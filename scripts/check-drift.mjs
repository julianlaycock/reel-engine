#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// check-drift.mjs — the raw-style-literal RATCHET (canon-resolver, step 2).
//
// Counts hardcoded design values in reel-engine/src (excluding src/generated/**,
// which is codegen output and MAY contain them):
//
//   hexTs        — hex colors  /#[0-9a-fA-F]{3,8}\b/  in .ts/.tsx
//   hexCss       — hex colors in src/style.css
//   fontFamilyTs — font-family string literals in .ts/.tsx outside fonts.ts
//                  (fontFamily: '<literal>' or "font-family:" in css-in-string)
//
// Compares against reel-engine/drift-baseline.json. The ratchet: counts may go
// DOWN (update the baseline when they do) but never UP — new styling must import
// from '@tokens' instead. When the baseline reaches zero, DELETE the baseline
// file: a missing baseline flips this script to zero-tolerance (every raw
// occurrence is an error).
//
// Usage: node scripts/check-drift.mjs [--verbose]
// Exit 0 = at/below baseline; exit 1 = drift (or any occurrence w/o baseline).
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const engineRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(engineRoot, 'src');
const baselinePath = path.join(engineRoot, 'drift-baseline.json');
const verbose = process.argv.includes('--verbose');

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
// literal font assignments only — `fontFamily: FONTS.geist` (identifier) does not match
const FONT_RE = /(?:fontFamily\s*:\s*['"`]|font-family\s*:)/g;

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (path.relative(srcDir, p) === 'generated') continue; // codegen output is exempt
      walk(p, out);
    } else out.push(p);
  }
  return out;
};

const counts = {hexTs: 0, hexCss: 0, fontFamilyTs: 0};
const perFile = {hexTs: {}, hexCss: {}, fontFamilyTs: {}};
const tally = (cat, file, n) => {
  if (!n) return;
  counts[cat] += n;
  perFile[cat][path.relative(engineRoot, file).replaceAll('\\', '/')] = n;
};

for (const file of walk(srcDir)) {
  const ext = path.extname(file);
  const base = path.basename(file);
  if (ext === '.ts' || ext === '.tsx') {
    const text = fs.readFileSync(file, 'utf8');
    tally('hexTs', file, (text.match(HEX_RE) ?? []).length);
    if (base !== 'fonts.ts') tally('fontFamilyTs', file, (text.match(FONT_RE) ?? []).length);
  } else if (base === 'style.css') {
    tally('hexCss', file, (fs.readFileSync(file, 'utf8').match(HEX_RE) ?? []).length);
  }
}

const hasBaseline = fs.existsSync(baselinePath);
const baseline = hasBaseline
  ? JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  : {hexTs: 0, hexCss: 0, fontFamilyTs: 0}; // no baseline = ZERO TOLERANCE

let drift = false;
console.log(hasBaseline ? 'drift ratchet — current vs baseline:' : 'drift ratchet — ZERO-TOLERANCE mode (no drift-baseline.json):');
for (const cat of Object.keys(counts)) {
  const over = counts[cat] > (baseline[cat] ?? 0);
  if (over) drift = true;
  console.log(`  ${cat.padEnd(13)} ${String(counts[cat]).padStart(4)} / ${baseline[cat] ?? 0}${over ? '  ← OVER' : ''}`);
  if (verbose) {
    for (const [f, n] of Object.entries(perFile[cat]).sort((a, b) => b[1] - a[1])) {
      console.log(`      ${String(n).padStart(4)}  ${f}`);
    }
  }
}

if (drift) {
  console.error(
    '\ndrift ratchet: raw values may never increase — import from @tokens instead.' +
      '\n(hex colors / font-family literals in reel-engine/src; baseline: drift-baseline.json.' +
      '\nIf you REMOVED raw values, lower the baseline to the new counts in the same commit.)',
  );
  process.exit(1);
}
console.log('OK — no drift.');
