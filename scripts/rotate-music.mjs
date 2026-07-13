// rotate-music.mjs — pick a provenance-cleared bed from the rotation pool and set it
// on a concept's video.json, so every build doesn't reuse the same track.
//
//   node scripts/rotate-music.mjs --slug <slug> [--exclude <name>] [--track <name>] [--seed <s>]
//
// Picks a track from public/audio/music/ that has a passing license sidecar,
// writes audio.musicSrc into data/<slug>/video.json, and writes the required CC-BY
// credit to data/<slug>/_music-credit.txt (include it in the post description).
// Falls back to the legacy bed (with a warning) if the pool is empty.
//
// No-repeat memory: the last picks are persisted to public/audio/music/.music-history.json;
// any bed used in the last 3 (other) videos is excluded from the pick so consecutive
// videos don't share a bed. Re-running for the same slug replaces its history entry
// (idempotent). --track <substring> forces a specific bed; --seed <s> makes the pick
// deterministic. Both still record to history.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const POOL = path.join(ROOT, 'public', 'audio', 'music');
const HISTORY = path.join(POOL, '.music-history.json');
const NO_REPEAT = 3;   // exclude beds used in the last N other videos
const KEEP = 12;       // history entries retained
// CC-BY-ND excluded: "No Derivatives" is a gray area for syncing music to video. Prefer BY / BY-SA / royalty-free.
const OK = new Set(['cc-by', 'cc-by-sa', 'royalty-free', 'own', 'licensed']);

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const slug = arg('--slug');
const exclude = arg('--exclude');
const forceTrack = arg('--track');
const seed = arg('--seed');
if (!slug) { console.error('Usage: node scripts/rotate-music.mjs --slug <slug> [--exclude <name>] [--track <name>] [--seed <s>]'); process.exit(2); }

function readHistory() {
  try {
    const h = JSON.parse(fs.readFileSync(HISTORY, 'utf8'));
    return Array.isArray(h) ? h : [];
  } catch { return []; }
}
function writeHistory(hist) {
  try { fs.writeFileSync(HISTORY, JSON.stringify(hist.slice(-KEEP), null, 2) + '\n'); }
  catch (e) { console.warn(`⚠ could not write ${HISTORY}: ${e.message}`); }
}
// Small deterministic PRNG (mulberry32) seeded from a string, for --seed.
function rngFrom(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
  const history = readHistory();
  if (forceTrack) {
    chosen = pool.find((p) => p.name.includes(forceTrack));
    if (!chosen) { console.error(`✗ --track "${forceTrack}" matches nothing in the cleared pool.`); process.exit(2); }
  } else {
    // No-repeat: drop beds used in the last N *other* videos (same-slug reruns don't count).
    const recent = history.filter((e) => e.slug !== slug).slice(-NO_REPEAT).map((e) => e.name);
    let candidates = pool.filter((p) => !recent.includes(p.name));
    if (candidates.length === 0) candidates = pool; // pool smaller than the window — allow repeats rather than fail
    const rand = seed ? rngFrom(String(seed)) : Math.random;
    chosen = candidates[Math.floor(rand() * candidates.length)];
  }
  writeHistory([...history.filter((e) => e.slug !== slug), { slug, name: chosen.name, at: new Date().toISOString() }]);
  credit = chosen.attribution;
  video.audio = video.audio || {};
  video.audio.musicSrc = chosen.file;
  video.audio.musicVolume = video.audio.musicVolume ?? 0.04;
  fs.writeFileSync(vjPath, JSON.stringify(video, null, 2) + '\n');
  if (credit) fs.writeFileSync(path.join(ROOT, 'data', slug, '_music-credit.txt'), credit + '\n');
  console.log(`[rotate-music] ${slug} → ${chosen.file}`);
  if (credit) console.log(`[credit] ${credit}  (add to the post description)`);
}
