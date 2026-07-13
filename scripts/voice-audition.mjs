// voice-audition.mjs — DELIVERY auditions for the golden Xander voice.
// Generates the SAME representative script in several delivery styles so the
// founder can pick by ear. Same voice_id + model as the sealed fingerprint —
// only stability/style/atempo-speed + SCRIPT PUNCTUATION vary. This is an
// AUDITION rig: it writes to out/_qa/voice-audition/ and touches NOTHING sealed
// (no voices.json / canon.yml edit). A pick becomes canonical only via the
// founder unlock ritual afterwards.
//
// Recipes from the 2026-07-10 v3-naturalness research:
//   0 baseline  = current prod (0.30/0.15, atempo 1.08, connective-flow script)
//   A calm      = 0.45/0.10, atempo 0.93, ellipsis+em-dash+[pause] breathing
//   B dynamic   = 0.35/0.20, atempo 1.00 (NO stretch), CAPS + short/long contrast
//   C balanced  = 0.40/0.10, atempo 0.97, mixed punctuation, one [pause]
//
// Usage: node scripts/voice-audition.mjs
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';

const execFileP = promisify(execFile);
const root = process.cwd();
const outDir = path.join(root, 'out', '_qa', 'voice-audition');
await fs.mkdir(outDir, {recursive: true});

const VOICE_ID = 'VG7zjqAT7O4FXCR57Wwv'; // Xander — golden voice (delivery varies, voice does NOT)
const MODEL = 'eleven_v3';

const variants = [
  {
    name: '0-baseline',
    stability: '0.30', style: '0.15', speed: '1.08',
    text:
      'part two and three more claude markdown file rules and Claude Code gets faster and cheaper and here is the one that matters most. search before read. our own run came back 4 lines instead of 2,251. because context is the meter and every line Claude reads is a line you pay for.',
  },
  {
    name: 'A-calm',
    stability: '0.45', style: '0.10', speed: '0.93',
    text:
      '[thoughtful] Part two... three more rules from one markdown file — and Claude Code gets faster, and cheaper. [pause] Here is the one that matters most. Search before read. Our own run came back 4 lines... instead of 2,251. [pause] Because context is the meter — every line Claude reads, is a line you pay for.',
  },
  {
    name: 'B-dynamic',
    stability: '0.35', style: '0.20', speed: '1.00',
    text:
      'Part two. Three more rules — one markdown file — and Claude Code just got FASTER. And cheaper. Here is the one that matters. Search before read. Our own run? 4 lines. Instead of 2,251. Because context is the METER — every line Claude reads is a line you PAY for.',
  },
  {
    name: 'C-balanced',
    stability: '0.40', style: '0.10', speed: '0.97',
    text:
      'Part two — three more rules from one markdown file, and Claude Code gets faster and cheaper. The one that matters most? Search before read. [pause] Our own run came back 4 lines, instead of 2,251 — because context is the meter. Every line Claude reads is a line you pay for.',
  },
];

const run = (file, args) =>
  execFileP('node', [path.join(root, 'scripts', file), ...args], {cwd: root, maxBuffer: 1 << 26});

for (const v of variants) {
  console.log(`\n=== ${v.name} (stab ${v.stability} · style ${v.style} · atempo ${v.speed}) ===`);
  const raw = path.join(outDir, `${v.name}.mp3`);
  const master = path.join(outDir, `${v.name}-master.wav`);
  await run('voiceover.mjs', [
    '--text', v.text,
    '--output', raw,
    '--voice-id', VOICE_ID,
    '--model', MODEL,
    '--stability', v.stability,
    '--style', v.style,
    '--speed', v.speed,
  ]);
  await run('master-voice.mjs', ['--input', raw, '--output', master, '--strength', 'natural']);
  console.log(`  built ${path.relative(root, master)}`);
}
console.log('\nAll voice auditions built → out/_qa/voice-audition/');
