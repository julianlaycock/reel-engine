#!/usr/bin/env node
import {withEngineAlias} from './_engine.mjs';
import {bundle} from '@remotion/bundler';
import {getCompositions, renderMedia} from '@remotion/renderer';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = process.cwd();

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
    throw new Error('Usage: npm run render:card -- --input data/card.json --output out/card.mp4');
  }

  return {
    input: path.resolve(root, parsed.input),
    output: path.resolve(root, parsed.output),
    composition: parsed.composition ?? 'Card',
  };
};

const validateCard = (card) => {
  const validTypes = new Set(['stat', 'statement', 'flow', 'result']);
  if (!validTypes.has(card.type)) {
    throw new Error(`Invalid card.type: ${card.type}`);
  }

  if (!Number.isInteger(card.durationInFrames) || card.durationInFrames < 90) {
    throw new Error('durationInFrames must be an integer of at least 90 frames');
  }

  for (const field of ['kicker', 'kickerRight', 'footerRight']) {
    if (typeof card[field] !== 'string' || card[field].length === 0) {
      throw new Error(`${field} is required`);
    }
  }
};

const main = async () => {
  const args = parseArgs();
  const card = JSON.parse(await fs.readFile(args.input, 'utf8'));
  validateCard(card);
  await fs.mkdir(path.dirname(args.output), {recursive: true});

  const serveUrl = await bundle({
    entryPoint: path.join(root, 'src/index.ts'),
    webpackOverride: withEngineAlias,
  });
  const comps = await getCompositions(serveUrl, {
    inputProps: {card},
  });
  const composition = comps.find((candidate) => candidate.id === args.composition);

  if (!composition) {
    throw new Error(`Composition ${args.composition} not found`);
  }

  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    imageFormat: 'jpeg',
    muted: true,
    inputProps: {card},
    outputLocation: args.output,
    overwrite: true,
    chromiumOptions: {
      gl: 'angle',
    },
  });

  console.log(`Rendered ${path.relative(root, args.output)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
