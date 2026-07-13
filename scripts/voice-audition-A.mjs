// voice-audition-A.mjs — REFINEMENT round on the founder-picked "A · calm" delivery.
// Founder note: keep A's calm, but optimise for BETTER FLOW, cleaner pronunciation,
// more natural speech. Changes vs round 1: connective flow (golden style, gentle
// em-dashes/commas instead of choppy ellipses), numbers WRITTEN OUT (clean reads),
// "claude markdown file" phrasing, lighter atempo (0.93 felt draggy → 0.94-0.96),
// one soft breath/pause only. Same golden voice_id. Auditions only — nothing sealed.
//
// Usage: node scripts/voice-audition-A.mjs
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';

const execFileP = promisify(execFile);
const root = process.cwd();
const outDir = path.join(root, 'out', '_qa', 'voice-audition');
await fs.mkdir(outDir, {recursive: true});

const VOICE_ID = 'VG7zjqAT7O4FXCR57Wwv';
const MODEL = 'eleven_v3';

// Same content as round 1 for comparability — connective-flow rewrite, numbers spoken.
const BASE =
  'Part two — three more rules from one claude markdown file, and Claude Code gets faster, and cheaper. And here is the one that matters most: search before read. Our own run came back four lines, instead of two thousand two hundred and fifty-one — because context is the meter, and every line Claude reads is a line you pay for.';

const variants = [
  // A1 — pure flow: no hard pauses, gentle em-dashes, slightly less slow than 0.93.
  {name: 'A1-flow', stability: '0.45', style: '0.10', speed: '0.95', text: `[thoughtful] ${BASE}`},
  // A2 — flow + a touch more life + one organic breath.
  {name: 'A2-warmlife', stability: '0.40', style: '0.12', speed: '0.96',
    text: BASE.replace('And here is the one', '[breathes] And here is the one')},
  // A3 — most deliberate/calm, one weighted pause before the key rule, still flowing.
  {name: 'A3-deliberate', stability: '0.47', style: '0.08', speed: '0.93',
    text: BASE.replace('search before read', '[pause] search before read')},
];

const run = (file, args) =>
  execFileP('node', [path.join(root, 'scripts', file), ...args], {cwd: root, maxBuffer: 1 << 26});

for (const v of variants) {
  console.log(`\n=== ${v.name} (stab ${v.stability} · style ${v.style} · atempo ${v.speed}) ===`);
  const raw = path.join(outDir, `${v.name}.mp3`);
  const master = path.join(outDir, `${v.name}-master.wav`);
  await run('voiceover.mjs', [
    '--text', v.text, '--output', raw, '--voice-id', VOICE_ID, '--model', MODEL,
    '--stability', v.stability, '--style', v.style, '--speed', v.speed,
  ]);
  await run('master-voice.mjs', ['--input', raw, '--output', master, '--strength', 'natural']);
  console.log(`  built ${path.relative(root, master)}`);
}
console.log('\nRefined A auditions built → out/_qa/voice-audition/');
