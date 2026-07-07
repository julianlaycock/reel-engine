#!/usr/bin/env node
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

// Social loudness target. ElevenLabs exports ~-24 LUFS; normalize so the VO
// plays at the platform standard (-14 LUFS, true peak <= -1 dBTP) without clipping.
const normalizeLoudness = async (input, output) => {
  await execFileP('ffmpeg', [
    '-y',
    '-i',
    input,
    '-af',
    // loudnorm sets loudness; single-pass loudnorm's TP target is only approximate. alimiter
    // is a SAMPLE-peak limiter, so on its own it lets inter-sample (true) peaks slip through on
    // peaky VO. Oversample 4× around the limiter so it catches inter-sample peaks — this makes
    // it a true-peak limiter and guarantees TP ≤ -1 dBTP so QA never needs a manual fix.
    'loudnorm=I=-14:TP=-1.5:LRA=11,aresample=192000,alimiter=limit=0.75:level=disabled,aresample=48000',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '256k',
    output,
  ]);
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--input' || arg === '-i') {
      parsed.input = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      parsed.output = args[++i];
    } else if (arg === '--composition' || arg === '-c') {
      parsed.composition = args[++i];
    }
  }

  if (!parsed.input || !parsed.output) {
    throw new Error(
      'Usage: npm run render:video -- --input data/<slug>/video.json --output out/<slug>.mp4',
    );
  }

  return {
    input: path.resolve(root, parsed.input),
    output: path.resolve(root, parsed.output),
    composition: parsed.composition ?? 'Video',
  };
};

const validCardTypes = new Set(['stat', 'statement', 'flow', 'result']);

const validateVideo = (video) => {
  if (!Array.isArray(video.scenes) || video.scenes.length === 0) {
    throw new Error('video.scenes must be a non-empty array');
  }

  video.scenes.forEach((scene, index) => {
    const at = `scenes[${index}]`;
    if (scene.kind === 'generative' || scene.kind === 'heatmap3d') {
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'broll') {
      if (typeof scene.src !== 'string' || scene.src.length === 0) {
        throw new Error(`${at}: broll scene needs a src under public/clips/`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'winprob') {
      if (!Array.isArray(scene.rows) || scene.rows.length === 0) {
        throw new Error(`${at}: winprob scene needs a non-empty rows array`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'formula') {
      if (typeof scene.formula !== 'string' || scene.formula.length === 0) {
        throw new Error(`${at}: formula scene needs a non-empty "formula"`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'radar') {
      if (!Array.isArray(scene.axes) || scene.axes.length < 3) {
        throw new Error(`${at}: radar scene needs an axes array of 3+ metrics`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'montecarlo' || scene.kind === 'plinko' || scene.kind === 'guessreveal' || scene.kind === 'barrace' || scene.kind === 'shotmap' || scene.kind === 'poisson2d' || scene.kind === 'outro2' || scene.kind === 'flow' || scene.kind === 'hero' || scene.kind === 'poster' || scene.kind === 'splitvs' || scene.kind === 'photostat') {
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'card') {
      if (!validCardTypes.has(scene.card?.type)) {
        throw new Error(`${at}: invalid card.type "${scene.card?.type}"`);
      }
      const frames = scene.durationInFrames ?? scene.card?.durationInFrames;
      if (!Number.isInteger(frames) || frames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'screen') {
      if (typeof scene.src !== 'string' || scene.src.length === 0) {
        throw new Error(`${at}: screen scene needs a src under public/`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'counter') {
      if (typeof scene.to !== 'number') {
        throw new Error(`${at}: counter scene needs a numeric "to"`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'versus') {
      for (const f of ['leftValue', 'leftLabel', 'rightValue', 'rightLabel']) {
        if (typeof scene[f] !== 'string' || scene[f].length === 0) {
          throw new Error(`${at}: versus scene needs ${f}`);
        }
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'editorial') {
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'asciiField') {
      // Americana Cut dark beat / end-card (skin v1.0, 2026-07-04)
      if (typeof scene.src !== 'string' || scene.src.length === 0) {
        throw new Error(`${at}: asciiField scene needs an image src under public/`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'nodegraph') {
      if (!Array.isArray(scene.nodes) || scene.nodes.length === 0) {
        throw new Error(`${at}: nodegraph scene needs a non-empty nodes array`);
      }
      if (!Array.isArray(scene.edges)) {
        throw new Error(`${at}: nodegraph scene needs an edges array`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'outro') {
      if (!Array.isArray(scene.partners) || scene.partners.length === 0) {
        throw new Error(`${at}: outro scene needs a non-empty partners array`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'bars') {
      if (!Array.isArray(scene.bars) || scene.bars.length === 0) {
        throw new Error(`${at}: bars scene needs a non-empty bars array`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'pretext') {
      if (typeof scene.text !== 'string' || scene.text.length === 0) {
        throw new Error(`${at}: pretext scene needs a non-empty text`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'agent') {
      if (typeof scene.typed !== 'string' || scene.typed.length === 0) {
        throw new Error(`${at}: agent scene needs a non-empty "typed" message`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'flowgraph') {
      if (!Array.isArray(scene.sources) || scene.sources.length === 0) {
        throw new Error(`${at}: flowgraph scene needs a non-empty sources array`);
      }
      if (!Array.isArray(scene.stages) || scene.stages.length === 0) {
        throw new Error(`${at}: flowgraph scene needs a non-empty stages array`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'loopgraph') {
      if (!Array.isArray(scene.nodes) || scene.nodes.length < 3) {
        throw new Error(`${at}: loopgraph scene needs at least 3 nodes`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'fieldgrid') {
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'quote') {
      if (typeof scene.quote !== 'string' || scene.quote.length === 0) {
        throw new Error(`${at}: quote scene needs a non-empty "quote"`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else if (scene.kind === 'timeline') {
      if (!Array.isArray(scene.milestones) || scene.milestones.length === 0) {
        throw new Error(`${at}: timeline scene needs a non-empty milestones array`);
      }
      if (!Number.isInteger(scene.durationInFrames) || scene.durationInFrames < 30) {
        throw new Error(`${at}: durationInFrames must be an integer >= 30`);
      }
    } else {
      throw new Error(`${at}: unknown scene.kind "${scene.kind}"`);
    }
  });
};

const main = async () => {
  const args = parseArgs();
  const video = JSON.parse(await fs.readFile(args.input, 'utf8'));

  // Allow captions to live in a sibling file referenced by captionsFile.
  if (video.captionsFile && !video.captions) {
    const capsPath = path.resolve(path.dirname(args.input), video.captionsFile);
    video.captions = JSON.parse(await fs.readFile(capsPath, 'utf8'));
  }

  validateVideo(video);
  await fs.mkdir(path.dirname(args.output), {recursive: true});

  const hasAudio = Boolean(video.audio?.voSrc || video.audio?.musicSrc);

  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), webpackOverride: withEngineAlias});
  const comps = await getCompositions(serveUrl, {inputProps: {video}});
  const composition = comps.find((candidate) => candidate.id === args.composition);

  if (!composition) {
    throw new Error(`Composition ${args.composition} not found`);
  }

  // With audio, render to a raw file then loudness-normalize into the final output.
  const renderTarget = hasAudio ? `${args.output}.raw.mp4` : args.output;

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    imageFormat: 'jpeg',
    muted: !hasAudio,
    inputProps: {video},
    outputLocation: renderTarget,
    overwrite: true,
    chromiumOptions: {gl: 'angle'},
  });

  if (hasAudio) {
    await normalizeLoudness(renderTarget, args.output);
    await fs.rm(renderTarget, {force: true});
  }

  console.log(
    `Rendered ${path.relative(root, args.output)} (${composition.durationInFrames} frames, audio: ${hasAudio ? 'yes, normalized -14 LUFS' : 'none'})`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
