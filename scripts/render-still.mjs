#!/usr/bin/env node
// Render a single frame of a video.json to PNG — the QA gate for the platform
// safe zone (canon/VIDEO-STANDARD.md): overlay-check the hook frame against
// the TikTok/IG UI before delivery.
// Usage: node ../reel-engine/scripts/render-still.mjs --input data/<slug>/video.json --output out/<slug>-f<N>.png [--frame N] [--composition Video]
import {withEngineAlias} from './_engine.mjs';
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill} from '@remotion/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--input' || arg === '-i') parsed.input = args[++i];
    else if (arg === '--output' || arg === '-o') parsed.output = args[++i];
    else if (arg === '--frame' || arg === '-f') parsed.frame = Number(args[++i]);
    else if (arg === '--composition' || arg === '-c') parsed.composition = args[++i];
  }
  if (!parsed.input || !parsed.output) {
    throw new Error(
      'Usage: node render-still.mjs --input data/<slug>/video.json --output out/frame.png [--frame N]',
    );
  }
  return {
    input: path.resolve(root, parsed.input),
    output: path.resolve(root, parsed.output),
    frame: Number.isFinite(parsed.frame) ? parsed.frame : 0,
    composition: parsed.composition ?? 'Video',
  };
};

const main = async () => {
  const args = parseArgs();
  const video = JSON.parse(await fs.readFile(args.input, 'utf8'));
  if (video.captionsFile && !video.captions) {
    const capsPath = path.resolve(path.dirname(args.input), video.captionsFile);
    video.captions = JSON.parse(await fs.readFile(capsPath, 'utf8'));
  }
  await fs.mkdir(path.dirname(args.output), {recursive: true});

  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), webpackOverride: withEngineAlias});
  const comps = await getCompositions(serveUrl, {inputProps: {video}});
  const composition = comps.find((candidate) => candidate.id === args.composition);
  if (!composition) throw new Error(`Composition ${args.composition} not found`);

  await renderStill({
    composition,
    serveUrl,
    frame: Math.min(args.frame, composition.durationInFrames - 1),
    imageFormat: 'png',
    inputProps: {video},
    output: args.output,
    overwrite: true,
    chromiumOptions: {gl: 'angle'},
  });

  console.log(`Rendered frame ${args.frame} to ${path.relative(root, args.output)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
