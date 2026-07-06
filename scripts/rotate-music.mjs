// rotate-music.mjs — pick a provenance-cleared bed from the rotation pool and set it
// on a concept's video.json, so every build doesn't reuse the same track.
//
//   node scripts/rotate-music.mjs --slug <slug> [--exclude <name>]
//
// Picks a random track from public/audio/music/ that has a passing license sidecar,
// writes audio.musicSrc into data/<slug>/video.json, and writes the required CC-BY
// credit to data/<slug>/_music-credit.txt (include it in the post description).
// Falls back to the legacy bed (with a warning) if the pool is empty.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const POOL = path.join(ROOT, 'public', 'audio', 'music');
// CC-BY-ND excluded: "No Derivatives" is a gray area for syncing music to video. Prefer BY / BY-SA / royalty-free.
const OK = new Set(['cc-by', 'cc-by-sa', 'royalty-free', 'own', 'licensed']);

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const slug = arg('--slug');
const exclude = arg('--exclude');
if (!slug) { console.error('Usage: node scripts/rotate-music.mjs --slug <slug>'); process.exit(2); }

function cleared() {
  if (!fs.existsSync(POOL)) return [];
  return fs.readdirSync(POOL).filter((f) => f.endsWith('.mp3')).map((f) => {
    const sc = path.join(POOL, f.replace(/\.mp3$/, '.json'));
    if (!fs.existsSync(sc)) return null;
    try {
      const m = JSON.parse(fs.readFileSync(sc, 'utf8'));
      if (!OK.has(m.license)) return null;
      if (exclude && f.includes(exclude)) return null;
      return { file: `audio/music/${f}`, attribution: m.attribution || '', name: f };
    } catch { return null; }
  }).filter(Boolean);
}

const vjPath = path.join(ROOT, 'data', slug, 'video.json');
const video = JSON.parse(fs.readFileSync(vjPath, 'utf8'));
const pool = cleared();

let chosen, credit = '';
if (pool.length === 0) {
  console.warn('⚠ rotation pool empty (public/audio/music/). Keeping existing bed. '
    + 'Run: python scripts/grab_music.py fill --tags "cinematic calm" --n 6');
  process.exit(0);
} else {
  // Vary by index so reruns differ without Date/Math.random determinism concerns.
  chosen = pool[Math.floor(Math.random() * pool.length)];
  credit = chosen.attribution;
  video.audio = video.audio || {};
  video.audio.musicSrc = chosen.file;
  video.audio.musicVolume = video.audio.musicVolume ?? 0.07;
  fs.writeFileSync(vjPath, JSON.stringify(video, null, 2) + '\n');
  if (credit) fs.writeFileSync(path.join(ROOT, 'data', slug, '_music-credit.txt'), credit + '\n');
  console.log(`[rotate-music] ${slug} → ${chosen.file}`);
  if (credit) console.log(`[credit] ${credit}  (add to the post description)`);
}
