#!/usr/bin/env node
// Generate word-level captions from a voiceover track using whisper-cpp (local, free).
// Output is a CaptionWord[] JSON ({text, startMs, endMs}) consumed by src/Captions.tsx.
//
// One-time setup:  npm i -D @remotion/install-whisper-cpp @remotion/captions
// Usage:           npm run captions -- --input public/audio/vo.mp3 --output data/<slug>/captions.json
//
// Requires ffmpeg on PATH (used to make the 16 kHz mono WAV whisper needs).
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileP = promisify(execFile);
const root = process.cwd();
const WHISPER_DIR = path.join(root, '.whisper');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {model: 'base.en'};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--input' || a === '-i') parsed.input = args[++i];
    else if (a === '--output' || a === '-o') parsed.output = args[++i];
    else if (a === '--model' || a === '-m') parsed.model = args[++i];
  }
  if (!parsed.input || !parsed.output) {
    throw new Error(
      'Usage: npm run captions -- --input public/audio/vo.mp3 --output data/<slug>/captions.json [--model base.en]',
    );
  }
  return parsed;
};

const loadWhisper = async () => {
  try {
    return await import('@remotion/install-whisper-cpp');
  } catch {
    throw new Error(
      'Missing dependency. Install once with:\n  npm i -D @remotion/install-whisper-cpp @remotion/captions',
    );
  }
};

const main = async () => {
  const args = parseArgs();
  const input = path.resolve(root, args.input);
  const output = path.resolve(root, args.output);
  const {installWhisperCpp, downloadWhisperModel, transcribe, toCaptions} =
    await loadWhisper();

  const WHISPER_VERSION = '1.5.5';
  await installWhisperCpp({to: WHISPER_DIR, version: WHISPER_VERSION});
  await downloadWhisperModel({folder: WHISPER_DIR, model: args.model});

  // whisper-cpp needs a 16 kHz mono WAV.
  const wav = path.join(os.tmpdir(), `caelith-vo-${path.basename(input)}.wav`);
  await execFileP('ffmpeg', ['-y', '-i', input, '-ar', '16000', '-ac', '1', wav]);

  const {transcription} = await transcribe({
    inputPath: wav,
    whisperPath: WHISPER_DIR,
    whisperCppVersion: WHISPER_VERSION,
    model: args.model,
    tokenLevelTimestamps: true,
  });

  // whisper returns token-level pieces (e.g. "Zap"+"ier", "CR"+"M"). A token that
  // starts a new word carries a leading space; continuations and punctuation don't.
  // Merge them back into whole words so the kinetic captions read cleanly.
  const {captions} = toCaptions({whisperCppOutput: {transcription}});
  const words = [];
  for (const c of captions) {
    const cleaned = c.text.trim();
    if (cleaned.length === 0) continue;
    const startsWord = /^\s/.test(c.text);
    const isPunct = /^[.,!?;:]+$/.test(cleaned);
    if ((startsWord && !isPunct) || words.length === 0) {
      words.push({
        text: cleaned,
        startMs: Math.round(c.startMs),
        endMs: Math.round(c.endMs),
      });
    } else {
      const prev = words[words.length - 1];
      prev.text += cleaned;
      prev.endMs = Math.round(c.endMs);
    }
  }

  await fs.mkdir(path.dirname(output), {recursive: true});
  await fs.writeFile(output, JSON.stringify(words, null, 2));
  await fs.rm(wav, {force: true});
  console.log(`Wrote ${words.length} caption words → ${path.relative(root, output)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
