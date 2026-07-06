#!/usr/bin/env node
// Render a narrated DoctrineFilm: the Doctrine visual system (color-morph, kinetic
// headlines, ledger, timeline, hero) carrying a voiceover. Retimes each section to
// the VO by word count (anchoring cuts to caption word timings), then renders with
// audio + loudness-normalizes. The script/VO is NOT modified — only section lengths.
//
// Usage:
//   node scripts/render-doctrine-film.mjs --input data/<slug>/brief.json \
//        --captions data/<slug>/captions.json --output out/<slug>.mp4
import {withEngineAlias} from './_engine.mjs';
import {bundle} from '@remotion/bundler';
import {getCompositions, renderMedia} from '@remotion/renderer';
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileP = promisify(execFile);
const root = process.cwd();

// Two-pass loudnorm: measure, then apply with linear=true so the -1.5 dBTP true-peak
// ceiling is actually respected (single-pass + alimiter let inter-sample peaks through).
const normalizeLoudness = async (input, output) => {
  const {stderr} = await execFileP(
    'ffmpeg',
    ['-hide_banner', '-i', input, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
    {maxBuffer: 1024 * 1024 * 32},
  ).catch((e) => ({stderr: e.stderr || ''}));
  const m = (stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/) || [])[0];
  let af = 'loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.7';
  if (m) {
    const j = JSON.parse(m);
    af = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  }
  await execFileP('ffmpeg', ['-y', '-i', input, '-af', af, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', output], {maxBuffer: 1024 * 1024 * 32});
};

const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {stills: []};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--input' || a[i] === '-i') p.input = a[++i];
    else if (a[i] === '--captions' || a[i] === '-c') p.captions = a[++i];
    else if (a[i] === '--output' || a[i] === '-o') p.output = a[++i];
    else if (a[i] === '--stills') p.stills = a[++i].split(',').map((s) => parseInt(s, 10));
    else if (a[i] === '--still-dir') p.stillDir = a[++i];
  }
  if (!p.input) throw new Error('Usage: --input <brief.json> --captions <captions.json> --output <out.mp4>');
  return p;
};

// Retime: distribute the section VO word counts across the caption word timings so
// each section starts when its narration starts (mirrors scripts/retime.mjs).
const retime = (brief, captions, fps) => {
  const words = captions.filter((w) => typeof w.startMs === 'number');
  const total = words.length;
  const lastEnd = words.length ? words[words.length - 1].endMs : 0;
  const totalFrames = Math.round((lastEnd / 1000) * fps) + 18; // small tail
  const voCounts = brief.sections.map((s) => Math.max(1, (s.vo ?? '').trim().split(/\s+/).filter(Boolean).length));
  const totalVo = voCounts.reduce((a, b) => a + b, 0);
  let cum = 0;
  const startFrames = brief.sections.map((s, i) => {
    if (i === 0) return 0;
    cum += voCounts[i - 1];
    const idx = Math.min(total - 1, Math.round((cum / totalVo) * total));
    return Math.round((words[idx].startMs / 1000) * fps);
  });
  brief.sections.forEach((s, i) => {
    const start = startFrames[i];
    const end = i === brief.sections.length - 1 ? totalFrames : startFrames[i + 1];
    s.durationInFrames = Math.max(45, end - start);
  });
  return brief;
};

const main = async () => {
  const args = parseArgs();
  const brief = JSON.parse(await fs.readFile(path.resolve(root, args.input), 'utf8'));
  const fps = brief.fps ?? 30;

  if (args.captions) {
    const caps = JSON.parse(await fs.readFile(path.resolve(root, args.captions), 'utf8'));
    retime(brief, caps, fps);
    console.log('Retimed sections (frames): ' + brief.sections.map((s) => s.durationInFrames).join(', '));
  }

  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), webpackOverride: withEngineAlias});
  const comps = await getCompositions(serveUrl, {inputProps: {brief}});
  const composition = comps.find((c) => c.id === 'DoctrineFilm');
  if (!composition) throw new Error('Composition DoctrineFilm not found');

  if (args.stills.length) {
    const {renderStill} = await import('@remotion/renderer');
    const dir = path.resolve(root, args.stillDir ?? 'out/_qa');
    await fs.mkdir(dir, {recursive: true});
    for (const frame of args.stills) {
      const out = path.join(dir, `film_${frame}.png`);
      await renderStill({composition, serveUrl, output: out, frame, inputProps: {brief}, imageFormat: 'png', chromiumOptions: {gl: 'angle'}, overwrite: true});
      console.log(`still f${frame} → ${path.relative(root, out)}`);
    }
  }

  if (args.output) {
    const output = path.resolve(root, args.output);
    await fs.mkdir(path.dirname(output), {recursive: true});
    const hasAudio = Boolean(brief.audio?.voSrc || brief.audio?.musicSrc);
    const target = hasAudio ? `${output}.raw.mp4` : output;
    await renderMedia({composition, serveUrl, codec: 'h264', imageFormat: 'jpeg', muted: !hasAudio, inputProps: {brief}, outputLocation: target, overwrite: true, chromiumOptions: {gl: 'angle'}});
    if (hasAudio) {
      await normalizeLoudness(target, output);
      await fs.rm(target, {force: true});
    }
    console.log(`Rendered ${path.relative(root, output)} (${composition.durationInFrames} frames, audio: ${hasAudio ? 'yes -14 LUFS' : 'none'})`);
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
