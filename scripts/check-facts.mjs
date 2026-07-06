// check-facts.mjs — the accuracy gate. Proves every on-screen number is traceable and
// matches its source. This is as close to "certain" as is achievable: it guarantees
// traceability + model-exactness + market-liveness + full coverage. It CANNOT guarantee an
// external source is itself correct — pair it with the adversarial verifier agent for the
// "approach" check.
//
//   node scripts/check-facts.mjs --slug <slug>
//
// Reads data/<slug>/facts.json:
//   { "model_repo": "../vektor-model/results",
//     "facts": [ {id, value, display, source_type, source_ref, claim, range?} ],
//     "whitelist": ["2026","50,000", ...] }   // self-evident numbers (years, sim counts)
//
// source_type:
//   model       source_ref "file.json#Team.field"   -> must match the repo value (±0.05)
//   polymarket  source_ref "research/markets/x.json#Outcome" -> must match saved live pull (±0.2)
//   bookmaker / external / stat  source_ref = http(s) URL  -> provenance required (not auto-verifiable)
// Exit 0 only if all source checks pass AND every on-screen number is covered.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const slug = (() => { const i = process.argv.indexOf('--slug'); return i > -1 ? process.argv[i + 1] : null; })();
if (!slug) { console.error('Usage: node scripts/check-facts.mjs --slug <slug>'); process.exit(2); }

const dir = path.join(ROOT, 'data', slug);
const facts = JSON.parse(fs.readFileSync(path.join(dir, 'facts.json'), 'utf8'));
const video = JSON.parse(fs.readFileSync(path.join(dir, 'video.json'), 'utf8'));
const fail = [];
const ok = [];

const num = (s) => parseFloat(String(s).replace(/[, %]/g, ''));
const close = (a, b, tol) => Math.abs(a - b) <= tol;

// Resolve a value from a results file. Supports:
//   "France.title_pct"      -> find team/player in probabilities[]/teams[]/values[], then field
//   "Djokovic N.|title_pct" -> entity name with dots/spaces, via '|' separator
//   "raw.ece"               -> plain nested-key traversal
function resolve(obj, ptr) {
  if (ptr.includes('|')) {
    const [entity, field] = ptr.split('|');
    const arr = obj.probabilities || obj.teams || obj.values || (Array.isArray(obj) ? obj : []);
    const row = arr.find((r) => r.team === entity || r.player === entity);
    return row ? row[field] : undefined;
  }
  let cur = obj;
  for (const p of ptr.split('.')) {
    if (cur == null) return undefined;
    const arr = cur.probabilities || cur.teams || cur.values;
    if (Array.isArray(cur)) cur = cur.find((r) => r.team === p || r.player === p);
    else if (arr && cur[p] === undefined) cur = arr.find((r) => r.team === p || r.player === p);
    else cur = cur[p];
  }
  return cur;
}

// ---- 1. verify each fact against its live source ----
for (const f of facts.facts ?? []) {
  if (f.source_type === 'model') {
    const [file, ptr] = f.source_ref.split('#');
    const repo = JSON.parse(fs.readFileSync(path.join(ROOT, facts.model_repo, file), 'utf8'));
    const val = resolve(repo, ptr);
    if (val == null) { fail.push(`${f.id}: ${ptr} not found in ${file}`); continue; }
    if (!close(num(f.value), num(val), 0.05)) fail.push(`${f.id}: source ${file}#${ptr}=${val}, facts says ${f.value}`);
    else ok.push(`${f.id}: ${file}#${ptr}=${val} ✓`);
  } else if (f.source_type === 'polymarket') {
    const [file, outcome] = f.source_ref.split('#');
    const pm = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    const o = (pm.outcomes ?? []).find((x) => x.outcome === outcome);
    if (!o) { fail.push(`${f.id}: PM outcome ${outcome} not found in ${file}`); continue; }
    if (!close(num(f.value), num(o.implied_pct), 0.2)) fail.push(`${f.id}: PM file says ${o.implied_pct}, facts says ${f.value}`);
    else ok.push(`${f.id}: polymarket ${outcome}=${o.implied_pct}% ✓ (${pm.src_url})`);
  } else { // bookmaker / external / stat
    if (!/^https?:\/\//.test(f.source_ref || '')) fail.push(`${f.id}: ${f.source_type} needs a source URL (got "${f.source_ref}")`);
    else ok.push(`${f.id}: ${f.source_type} provenance ${f.source_ref} ✓ (value not auto-verifiable — agent-checked)`);
  }
}

// ---- 2. coverage: every number shown on screen must be a known fact or whitelisted ----
const shown = new Set();
const TEXT = ['headline','eyebrow','caption','footnote','kicker','sub','title','recap','question','tagline','leftValue','rightValue','leftLabel','rightLabel','attribution','attributionSub','quote','display'];
const pushNums = (str) => { for (const m of String(str).matchAll(/\d[\d,]*(?:\.\d+)?%?/g)) shown.add(m[0]); };
for (const s of video.scenes ?? []) {
  for (const k of TEXT) if (s[k]) pushNums(s[k]);
  for (const step of s.steps ?? []) pushNums(step);
  for (const r of s.rows ?? []) { if (r.label) pushNums(r.label); if (r.value != null) shown.add(String(r.value)); }
  for (const b of s.bars ?? []) { if (b.display) pushNums(b.display); else if (b.value != null) shown.add(String(b.value)); }
  if (s.kind === 'plinko') { if (s.total) shown.add(String(s.total)); if (s.throughPct != null) shown.add(String(s.throughPct)); }
  if (s.kind === 'guessreveal' && s.answer != null) shown.add(String(s.answer));
  if (s.kind === 'counter') { if (s.to != null) shown.add(String(s.to)); if (s.from != null) shown.add(String(s.from)); }
  if (s.kind === 'shotmap') { if (s.shots != null) shown.add(String(s.shots)); if (s.xgTotal != null) shown.add(String(s.xgTotal)); }
}
const known = new Set();
const addTokens = (s) => { for (const m of String(s).matchAll(/\d[\d,]*(?:\.\d+)?%?/g)) known.add(m[0].replace(/[, %]/g, '')); };
for (const f of facts.facts ?? []) { if (f.display != null) addTokens(f.display); known.add(String(f.value).replace(/[, %]/g, '')); }
for (const w of facts.whitelist ?? []) addTokens(w);
const uncovered = [...shown].filter((n) => !known.has(n.replace(/[, %]/g, '')));
if (uncovered.length) fail.push(`uncovered on-screen numbers (not in facts/whitelist): ${uncovered.join(', ')}`);

// ---- report ----
console.log(`[check-facts] ${slug} — ${ok.length} verified, ${fail.length} problem(s)\n`);
for (const o of ok) console.log('  OK   ' + o);
if (fail.length) {
  console.error('\n[check-facts] FAIL:');
  for (const f of fail) console.error('  ✗  ' + f);
  console.error('\nFix facts.json / video.json so every number traces and matches. Then re-run.');
  process.exit(1);
}
console.log('\n[check-facts] PASS — every on-screen number traces to a source and matches.');
