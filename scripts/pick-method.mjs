// pick-method.mjs — rotate analytical methods so we're never "the 50k-sim channel".
// Reads canon/methods.json + data/_method-log.jsonl and surfaces fitting, NON-REPEATED methods.
//
//   node scripts/pick-method.mjs candidates --domain sports [--recent 5] [--n 4]
//   node scripts/pick-method.mjs log --slug <slug> --method <id>
//   node scripts/pick-method.mjs recent [--recent 5]
//
// Domains: sports | politics | markets | culture | health-money | general
// "candidates" excludes any method used in the last N produced videos so each pitch
// proposes something fresh. It returns the fit angle + source so the pitch can pick the
// one that genuinely fits the topic (never shoehorn — see the anti-slop bar in vektor-pitch).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const CATALOG = path.join(ROOT, 'canon', 'methods.json');
const LOG = path.join(ROOT, 'data', '_method-log.jsonl');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const cmd = process.argv[2];

const methods = JSON.parse(fs.readFileSync(CATALOG, 'utf8')).methods;

function recentlyUsed(n) {
  if (!fs.existsSync(LOG)) return [];
  const lines = fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean);
  const ids = lines.map((l) => { try { return JSON.parse(l).method; } catch { return null; } }).filter(Boolean);
  return ids.slice(-n); // last N method ids
}

if (cmd === 'candidates') {
  const domain = arg('--domain');
  const recentN = parseInt(arg('--recent', '5'), 10);
  const n = parseInt(arg('--n', '4'), 10);
  if (!domain) { console.error('need --domain (sports|politics|markets|culture|health-money|general)'); process.exit(2); }
  const recent = new Set(recentlyUsed(recentN));
  const fits = methods.filter((m) => m.domains.includes(domain));
  if (!fits.length) { console.error(`no methods for domain "${domain}". Valid: sports, politics, markets, culture, health-money, general`); process.exit(2); }
  const fresh = fits.filter((m) => !recent.has(m.id));
  const pool = fresh.length >= n ? fresh : fits; // if too many recently used, allow repeats but warn
  if (fresh.length < n) console.log(`# note: only ${fresh.length} unused method(s) for ${domain}; widening pool.`);
  console.log(`# ${domain} — candidates (excluding last ${recentN} used: ${[...recent].join(', ') || 'none'})\n`);
  for (const m of pool.slice(0, n)) {
    console.log(`- [${m.id}] ${m.name}  (difficulty ${m.difficulty})`);
    console.log(`    angle: ${m.angle}`);
    console.log(`    source: ${m.source}\n`);
  }
}
else if (cmd === 'log') {
  const slug = arg('--slug'); const method = arg('--method');
  if (!slug || !method) { console.error('need --slug and --method'); process.exit(2); }
  if (!methods.find((m) => m.id === method)) { console.error(`unknown method id "${method}"`); process.exit(2); }
  fs.appendFileSync(LOG, JSON.stringify({ slug, method }) + '\n');
  console.log(`[method-log] ${slug} → ${method}`);
}
else if (cmd === 'recent') {
  console.log('recently used:', recentlyUsed(parseInt(arg('--recent', '5'), 10)).join(', ') || 'none');
}
else {
  console.error('usage: pick-method.mjs candidates --domain <d> | log --slug <s> --method <id> | recent');
  process.exit(2);
}
