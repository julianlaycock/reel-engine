// pick-format.mjs — rotate the FORMAT slate so the brand chassis stays fixed while the
// substance varies (the anti-sameness system, alongside pick-method.mjs). Reads
// canon/formats.json + data/_format-log.jsonl and surfaces fitting, NON-REPEATED formats.
//
//   node scripts/pick-format.mjs candidates [--cadence anchor|recurring|weekly|filler|on-resolution] [--recent 5] [--n 5]
//   node scripts/pick-format.mjs log --slug <slug> --format <id>
//   node scripts/pick-format.mjs recent [--recent 5]
//
// "candidates" excludes any format used in the last N produced videos so each pitch varies
// the format. Optionally filter by cadence (e.g. only anchors on a normal day). It returns
// the fit + baked-in 2026 mechanics so the pitch picks the one that genuinely fits the topic
// (never shoehorn a format for novelty — see the anti-slop bar in vektor-pitch).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, 'canon', 'formats.json');
const LOG = path.join(ROOT, 'data', '_format-log.jsonl');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const cmd = process.argv[2];

const formats = JSON.parse(fs.readFileSync(CATALOG, 'utf8')).formats;

function recentlyUsed(n) {
  if (!fs.existsSync(LOG)) return [];
  const lines = fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean);
  const ids = lines.map((l) => { try { return JSON.parse(l).format; } catch { return null; } }).filter(Boolean);
  return ids.slice(-n); // last N format ids
}

if (cmd === 'candidates') {
  const cadence = arg('--cadence');
  const recentN = parseInt(arg('--recent', '5'), 10);
  const n = parseInt(arg('--n', '5'), 10);
  const recent = new Set(recentlyUsed(recentN));
  let fits = cadence ? formats.filter((f) => f.cadence === cadence) : formats;
  if (!fits.length) { console.error(`no formats for cadence "${cadence}". Valid: anchor, recurring, weekly, filler, on-resolution`); process.exit(2); }
  const fresh = fits.filter((f) => !recent.has(f.id));
  const pool = fresh.length >= n ? fresh : fits; // if too many recently used, allow repeats but warn
  if (fresh.length < n) console.log(`# note: only ${fresh.length} unused format(s)${cadence ? ` for cadence ${cadence}` : ''}; widening pool.`);
  console.log(`# format candidates${cadence ? ` (cadence=${cadence})` : ''} — excluding last ${recentN} used: ${[...recent].join(', ') || 'none'}\n`);
  for (const f of pool.slice(0, n)) {
    console.log(`- [${f.id}] ${f.name}  (${f.cadence})`);
    console.log(`    when: ${f.when}`);
    console.log(`    scenes: ${f.scenes.join(', ')}`);
    console.log(`    mechanics: ${f.mechanics}\n`);
  }
}
else if (cmd === 'log') {
  const slug = arg('--slug'); const format = arg('--format');
  if (!slug || !format) { console.error('need --slug and --format'); process.exit(2); }
  if (!formats.find((f) => f.id === format)) { console.error(`unknown format id "${format}". See canon/formats.json`); process.exit(2); }
  fs.appendFileSync(LOG, JSON.stringify({ slug, format }) + '\n');
  console.log(`[format-log] ${slug} → ${format}`);
}
else if (cmd === 'recent') {
  console.log('recently used:', recentlyUsed(parseInt(arg('--recent', '5'), 10)).join(', ') || 'none');
}
else {
  console.error('usage: pick-format.mjs candidates [--cadence <c>] | log --slug <s> --format <id> | recent');
  process.exit(2);
}
