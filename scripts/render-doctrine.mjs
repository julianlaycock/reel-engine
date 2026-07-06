#!/usr/bin/env node
// Render the Doctrine composition (design-tuned motion system) to MP4, and/or
// capture QA stills. Silent by default (no VO); deterministic; gl:'angle'.
//
// Usage:
//   node scripts/render-doctrine.mjs --output out/caelith-provable-doctrine.mp4
//   node scripts/render-doctrine.mjs --input data/<slug>/brief.json --output out/<slug>.mp4
//   node scripts/render-doctrine.mjs --stills 95,250,400,505,595,685,455,635 --still-dir out/_qa
import {withEngineAlias} from './_engine.mjs';
import {bundle} from '@remotion/bundler';
import {getCompositions, renderMedia, renderStill} from '@remotion/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = process.cwd();

const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {stills: [], stillDir: 'out/_qa'};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--input' || a[i] === '-i') p.input = a[++i];
    else if (a[i] === '--output' || a[i] === '-o') p.output = a[++i];
    else if (a[i] === '--stills') p.stills = a[++i].split(',').map((s) => parseInt(s, 10));
    else if (a[i] === '--still-dir') p.stillDir = a[++i];
  }
  return p;
};

const main = async () => {
  const args = parseArgs();
  // If --input given, drive from that brief; else use the composition's defaultProps.
  const inputProps = args.input
    ? {brief: JSON.parse(await fs.readFile(path.resolve(root, args.input), 'utf8'))}
    : {};

  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), webpackOverride: withEngineAlias});
  const comps = await getCompositions(serveUrl, {inputProps});
  const composition = comps.find((c) => c.id === 'Doctrine');
  if (!composition) throw new Error('Composition Doctrine not found');

  if (args.stills.length) {
    const dir = path.resolve(root, args.stillDir);
    await fs.mkdir(dir, {recursive: true});
    for (const frame of args.stills) {
      const out = path.join(dir, `f${frame}.png`);
      await renderStill({composition, serveUrl, output: out, frame, inputProps, imageFormat: 'png', chromiumOptions: {gl: 'angle'}, overwrite: true});
      console.log(`still f${frame} → ${path.relative(root, out)}`);
    }
  }

  if (args.output) {
    const output = path.resolve(root, args.output);
    await fs.mkdir(path.dirname(output), {recursive: true});
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      imageFormat: 'jpeg',
      muted: true,
      inputProps,
      outputLocation: output,
      overwrite: true,
      chromiumOptions: {gl: 'angle'},
    });
    console.log(`Rendered ${path.relative(root, output)} (${composition.durationInFrames} frames)`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
