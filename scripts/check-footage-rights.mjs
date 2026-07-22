#!/usr/bin/env node
// check-footage-rights.mjs — deterministic footage-rights gate (the strike-prevention check).
//
// Reads a concept's video.json, finds every clip it actually uses (broll scenes
// or any scene whose `src` points under clips/), and verifies each clip's
// provenance sidecar (public/clips/<name>.json, written by grab_clip.py /
// grab_pexels.py). A clip tagged `broadcast-raw` — or with NO sidecar (unknown
// provenance = treat as broadcast-raw) — is a publish BLOCKER and exits non-zero.
//
// Usage:
//   node scripts/check-footage-rights.mjs --slug <slug>
//   node scripts/check-footage-rights.mjs --input data/<slug>/video.json
//
// Exit 0 = all used footage is cleared (transformative|licensed|stock|own).
// Exit 1 = at least one clip is broadcast-raw or missing provenance.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
// cc/public-domain (stills) and cc-by*/royalty-free (music) all clear commercial social use.
const OK = new Set([
  'transformative', 'licensed', 'stock', 'own', 'cc', 'cc0', 'public-domain',
  'cc-by', 'cc-by-sa', 'royalty-free', // cc-by-nd excluded: 'No Derivatives' is a gray area for music-to-video sync
]);

function parseArgs() {
  const a = process.argv.slice(2);
  const p = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--slug' || a[i] === '-s') p.slug = a[++i];
    else if (a[i] === '--input' || a[i] === '-i') p.input = a[++i];
  }
  if (!p.slug && !p.input) {
    console.error('Usage: node scripts/check-footage-rights.mjs --slug <slug> | --input <video.json>');
    process.exit(2);
  }
  return p;
}

function main() {
  const args = parseArgs();
  const videoJsonPath = args.input
    ? path.resolve(ROOT, args.input)
    : path.join(ROOT, 'data', args.slug, 'video.json');

  const video = JSON.parse(fs.readFileSync(videoJsonPath, 'utf8'));

  // Every external asset the cut references: video clips (broll / src under clips/)
  // and still images (editorial panel.image, or any src under images/).
  const used = [];
  for (const s of video.scenes ?? []) {
    const src = s.src;
    if (s.kind === 'broll' || (typeof src === 'string' && src.includes('clips/'))) {
      if (src) used.push(src);
    }
    // GATE-HOLE FIX 2026-07-22: screens/ captures (receipt panels since NO.019)
    // were never scanned — only images/ paths were collected.
    const isImagery = (v) => typeof v === 'string' && (v.includes('images/') || v.includes('screens/'));
    const img = s.panel?.image;
    if (isImagery(img) || isImagery(src)) {
      used.push(isImagery(img) ? img : src);
    }
    // splitvs screenshot pairs + photostat clippings are licensed imagery too
    // (gap found on NO.010's rb-* pairs, 2026-07-08).
    for (const key of ['topImg', 'botImg', 'img']) {
      const v = s[key];
      if (isImagery(v)) used.push(v);
    }
  }
  // Background music is the #1 Content-ID strike risk — gate it too.
  const music = video.audio?.musicSrc;
  if (typeof music === 'string' && music.length) used.push(music);
  const uniq = [...new Set(used)];

  if (uniq.length === 0) {
    console.log('[footage-rights] PASS — no external footage or licensed imagery used (graphics-only).');
    process.exit(0);
  }

  const rows = [];
  const blockers = [];
  for (const src of uniq) {
    const clipPath = path.resolve(ROOT, 'public', src);
    const sidecar = clipPath.replace(/\.[^./\\]+$/, '.json');
    let license = null;
    let source = '';
    if (fs.existsSync(sidecar)) {
      try {
        const m = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
        license = m.license;
        source = m.source || m.src_url || '';
      } catch {
        license = 'unreadable';
      }
    } else {
      license = 'MISSING';
    }
    const pass = OK.has(license);
    if (!pass) blockers.push({ src, license });
    rows.push({ src, license, pass, source });
  }

  console.log('[footage-rights] clips used in this cut:');
  for (const r of rows) {
    console.log(`  ${r.pass ? 'OK  ' : 'FAIL'}  ${r.src}  [license=${r.license}]${r.source ? `  ${r.source}` : ''}`);
  }

  if (blockers.length) {
    console.error(`\n[footage-rights] NO-GO — ${blockers.length} clip(s) not cleared:`);
    for (const b of blockers) {
      const why = b.license === 'MISSING'
        ? 'no provenance sidecar (unknown rights)'
        : `tagged ${b.license}`;
      console.error(`  - ${b.src}: ${why}`);
    }
    console.error('\nFix: either run it UNDER your own VO/analysis + data overlays and re-tag\n' +
      '`--license transformative`, or swap to a licensed/stock/own source\n' +
      '(scripts/grab_pexels.py pulls license-clean stock, auto-tagged `stock`).');
    process.exit(1);
  }

  console.log('\n[footage-rights] PASS — all used footage is cleared.');
  process.exit(0);
}

main();
