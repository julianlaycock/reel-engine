#!/usr/bin/env node
// Re-time a video's scenes to a recorded voiceover. Each scene carries a `vo`
// string (the narration it covers). Scene boundaries are anchored to the ACTUAL
// word timings in captions.json (not a flat proportion), so cuts land when the
// narrator actually reaches that part of the script — visuals stay in sync.
//
// Usage: npm run retime -- --video data/<slug>/video.json --audio public/audio/<slug>/vo-master.wav [--captions data/<slug>/captions.json]
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileP = promisify(execFile);
const root = process.cwd();

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--video' || a === '-v') parsed.video = args[++i];
    else if (a === '--audio' || a === '-a') parsed.audio = args[++i];
    else if (a === '--captions' || a === '-c') parsed.captions = args[++i];
  }
  if (!parsed.video || !parsed.audio) {
    throw new Error('Usage: npm run retime -- --video data/<slug>/video.json --audio public/audio/<slug>/vo-master.wav [--captions <path>]');
  }
  return parsed;
};

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean);

const main = async () => {
  const args = parseArgs();
  const videoPath = path.resolve(root, args.video);
  const audioPath = path.resolve(root, args.audio);
  const captionsPath = args.captions
    ? path.resolve(root, args.captions)
    : path.join(path.dirname(videoPath), 'captions.json');

  const video = JSON.parse(await fs.readFile(videoPath, 'utf8'));
  const captions = JSON.parse(await fs.readFile(captionsPath, 'utf8'));
  const fps = video.fps ?? 30;
  const N = captions.length;

  const {stdout} = await execFileP('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioPath,
  ]);
  const durMs = parseFloat(stdout.trim()) * 1000;

  // A scene with no `vo` is a fixed-duration HOLD (e.g. a silent end-card) — it
  // keeps its own durationInFrames and plays as a silent tail. Only voiced scenes
  // are anchored to the audio.
  const isHold = (s) => words(s.vo).length === 0;
  const voiced = video.scenes.filter((s) => !isHold(s));
  if (voiced.length === 0) {
    throw new Error('Need at least one scene with a non-empty "vo" field to re-time.');
  }
  const counts = voiced.map((s) => words(s.vo).length);
  const total = counts.reduce((a, b) => a + b, 0);

  // Boundary in word-space → caption token index → that token's real start time.
  const starts = [];
  let acc = 0;
  for (let i = 0; i < voiced.length; i += 1) {
    if (i === 0) {
      starts.push(0);
    } else {
      const idx = Math.min(N - 1, Math.max(0, Math.round((acc / total) * N)));
      starts.push(captions[idx].startMs);
    }
    acc += counts[i];
  }

  const MIN = 40;
  const voicedAlloc = voiced.map((s, i) => {
    const endMs = i < starts.length - 1 ? starts[i + 1] : durMs + 250;
    return Math.max(MIN, Math.round(((endMs - starts[i]) / 1000) * fps));
  });

  let vi = 0;
  video.scenes.forEach((s) => {
    if (isHold(s)) {
      if (s.kind === 'card') s.card.durationInFrames = s.durationInFrames;
    } else {
      s.durationInFrames = voicedAlloc[vi];
      if (s.kind === 'card') s.card.durationInFrames = voicedAlloc[vi];
      vi += 1;
    }
  });

  await fs.writeFile(videoPath, JSON.stringify(video, null, 2) + '\n');
  const totalFrames = video.scenes.reduce((a, s) => a + (s.durationInFrames || 0), 0);
  console.log(
    `Anchored ${video.scenes.length} scenes to caption timings (${(durMs / 1000).toFixed(1)}s audio, ${totalFrames} frames / ${(totalFrames / fps).toFixed(1)}s).`,
  );
  console.log('Scene starts (s): ' + starts.map((m) => (m / 1000).toFixed(1)).join(', '));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
