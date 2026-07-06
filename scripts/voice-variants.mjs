// Build the same concept with several alternative voices for A/B selection.
// Produces out/<slug>-<name>.mp4 per voice WITHOUT touching the canonical
// video.json / vo files. Usage: node scripts/voice-variants.mjs <slug>
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileP = promisify(execFile);
const root = process.cwd();
const slug = process.argv[2];
if (!slug) throw new Error('Usage: node scripts/voice-variants.mjs <slug>');

// Caelith voice candidates — institutional British males, natural settings.
const variants = [
  {name: 'daniel', id: 'onwK4e9ZLuTAKqWW03F9', model: 'eleven_multilingual_v2', speed: '1.05', stability: '0.5', master: 'natural'},
  {name: 'george', id: 'JBFqnCBsd6RMkjVDRZzb', model: 'eleven_multilingual_v2', speed: '1.05', stability: '0.5', master: 'natural'},
  {name: 'sam', id: '8hLI4rOPGciwSPGUg4qs', model: 'eleven_multilingual_v2', speed: '1.05', stability: '0.5', master: 'natural'},
];

const run = (file, args) =>
  execFileP('node', [path.join(root, 'scripts', file), ...args], {cwd: root, maxBuffer: 1 << 26});

const base = JSON.parse(await fs.readFile(path.join(root, 'data', slug, 'video.json'), 'utf8'));

for (const v of variants) {
  console.log(`\n=== ${v.name} (${v.id}) ===`);
  const voRaw = `public/audio/${slug}/vo-${v.name}.mp3`;
  const voMaster = `public/audio/${slug}/vo-${v.name}-master.wav`;
  const caps = `data/${slug}/captions-${v.name}.json`;
  const vjson = `data/${slug}/video-${v.name}.json`;
  const out = `out/${slug}-${v.name}.mp4`;

  await run('voiceover.mjs', ['--input', `data/${slug}/script.txt`, '--output', voRaw, '--voice-id', v.id, '--model', v.model, '--speed', v.speed ?? '1.1', '--stability', v.stability ?? '0.5']);
  await run('master-voice.mjs', ['--input', voRaw, '--output', voMaster, '--strength', v.master ?? 'narrator']);
  await run('generate-captions.mjs', ['--input', voRaw, '--output', caps]);

  const clone = JSON.parse(JSON.stringify(base));
  clone.audio = {...(clone.audio || {}), voSrc: `audio/${slug}/vo-${v.name}-master.wav`};
  clone.captionsFile = `captions-${v.name}.json`;
  await fs.writeFile(path.join(root, vjson), JSON.stringify(clone, null, 2));

  await run('retime.mjs', ['--video', vjson, '--audio', voMaster, '--captions', caps]);
  await run('render-video.mjs', ['--input', vjson, '--output', out]);
  console.log(`built ${out}`);
}
console.log('\nAll voice variants built.');
