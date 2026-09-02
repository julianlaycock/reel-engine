#!/usr/bin/env node
// canon-brief.mjs — compile the CURRENT canon into an imperative brief for the
// session/build prompt. INJECTION half of the enforcement loop: the live token
// files are compiled into context on every run, so rule changes always apply.
//
// REWRITTEN 2026-08-29 (founder ruling, vektor/DECISIONS.md 2026-08-29):
//   - Compiles from canon/kt-canon.yml + canon/kt-tokens.json — KT-Remotion is
//     the ONLY active design system. americana/letterpress are DEAD; this
//     compiler must never mention them as current.
//   - HARD ERROR if the KT sources are missing. A broken compiler must ERROR,
//     never serve stale rules (that exact failure taught sessions dead canon
//     for weeks — see research/2026-08-29-canon-contradiction-audit.md).
//   - Emits a provenance stamp (sources + git SHA + compile time).
//   - No design VALUE is hand-written here: every number is read from the
//     token file at compile time or the line names the token path instead.
//
// Usage: node reel-engine/scripts/canon-brief.mjs --brand vektor
import fs from 'node:fs';
import path from 'node:path';
import {execSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolveBrand} from '../lib/brand.mjs';

const require = createRequire(import.meta.url);
const YAML = require('js-yaml');

const brandArg = (() => {
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 1) if (a[i] === '--brand' || a[i] === '-b') return a[i + 1];
  return undefined;
})();

const brand = resolveBrand(brandArg);
process.chdir(brand.brandRoot);

const KT_CANON = path.join('canon', 'kt-canon.yml');
const KT_TOKENS = path.join('canon', 'kt-tokens.json');

const fail = (msg) => {
  process.stderr.write(`⚠ CANON BRIEF FAILED — ${msg}\n`);
  process.stderr.write('⚠ DO NOT AUTHOR VISUALS until the compiler is fixed. Stale rules must never be served.\n');
  process.exit(1);
};

if (!fs.existsSync(KT_CANON)) fail(`${KT_CANON} not found`);
if (!fs.existsSync(KT_TOKENS)) fail(`${KT_TOKENS} not found`);

let kt; let tok; let legacy = {};
try {
  kt = YAML.load(fs.readFileSync(KT_CANON, 'utf8'));
  tok = JSON.parse(fs.readFileSync(KT_TOKENS, 'utf8'));
} catch (e) {
  fail(`could not parse KT canon sources: ${e.message}`);
}
try {
  // canon.yml survives ONLY for the voice fingerprint block (sole live block).
  legacy = YAML.load(fs.readFileSync(path.join('canon', 'canon.yml'), 'utf8')) ?? {};
} catch { /* optional */ }

let sha = 'unknown';
try { sha = execSync('git rev-parse --short HEAD', {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim(); } catch {}

const fields = tok.color?.fields ?? {};
const fieldList = Object.entries(fields)
  .map(([k, v]) => `${k} ${v.hex}`)
  .join(' · ');
const steps = tok.type?.scale?.steps?.join(', ');
const sz = tok.layout?.safeZone?.resolvesTo;
const rail = tok.layout?.furnitureRail;
const col = tok.layout?.column?.widthPx;

const L = [];
L.push(`CANON BRIEF · ${brand.name} · KT-Remotion v${tok.version} (compiled live from ${KT_CANON} + ${KT_TOKENS} @ ${sha}, ${new Date().toISOString()})`);
L.push('Follow every rule below. scripts/check-kt.mjs BLOCKS the build on any BLOCKER violation.');
L.push('');
L.push('SYSTEM [BLOCKER]: KT-Remotion is the ONLY active design system (kt-tokens.json + kt-canon.yml + canon/goldens/kt-*).');
L.push('  americana and letterpress are DEAD (founder ruling 2026-08-29, DECISIONS.md). Never source typography,');
L.push('  palette, or effects from their token files, old covers, or pre-KT example files. Dead files live in canon/_graveyard/.');
L.push(`FORMAT [BLOCKER]: ${tok.canvas?.w}x${tok.canvas?.h} @ ${tok.canvas?.fps}fps.`);
L.push(`PALETTE [BLOCKER]: the UNIFORM uses exactly these fields — ${fieldList}. Drawn red is redDeep.`);
L.push('  Plates may declare soft accents per film (founder ruling 2026-08-29 B) — declared, never defaulted.');
L.push(`TYPE [BLOCKER]: display ${tok.type?.family?.display} · ui ${tok.type?.family?.ui}. NO other faces (Unique is letterpress-era: DEAD).`);
L.push(`  Sizes snap to the scale steps [${steps}] (kt-tokens#type.scale). One declared hero line may exceed (heroExempt).`);
L.push(`CAPS [BLOCKER]: max ${tok.type?.rowCap?.max} concurrent rows (authoring) · max ${tok.type?.renderedLineCap?.max} rendered lines + 1 hero (post-render backstop).`);
L.push(`SAFE ZONE [BLOCKER]: content inside x${sz?.x0}-${sz?.x1} / y${sz?.y0}-${sz?.y1} (kt-tokens#layout.safeZone). Furniture rail ${rail?.px}px, ${rail?.axis}. Column ${col}px.`);
L.push('UNIFORM [BLOCKER]: masthead + house outro (kt-tokens#outro) + canonical seams on every film. NO.038 is a recorded one-film exception, not precedent.');
L.push('MARKS: commentary marks are hand-drawn (width variance + wobble), declared on a word, red only. Straight rules read as bugs.');
L.push('CAPTURES [BLOCKER]: every screenshot is FULL BLEED and NOT GREYED OUT - it fills the frame and looks');
  L.push('  exactly like it looks in reality. NO veil, NO blur, NO greyscale, NO contrast push - your type stands on');
  L.push('  an OPAQUE band of the beat field colour, never on a faded screenshot (founder 2026-09-02: "leave them');
  L.push('  exactly what they look like in reality"). On such a frame the PALETTE + SAFE-ZONE pixel tests stand down;');
  L.push('  the studio scrub is then the only check that the FILM own type stays on palette.');
  L.push('  A band, a strip or a boxed crop is NOT full bleed (founder 2026-07-19, re-issued 2026-09-02; kt-canon.yml#captureIsFullBleed,');
  L.push('  enforced by scripts/check-mock.mjs). CARVE-OUT: a cropped SENTENCE used as an inline citation inside a plate is a');
  L.push('  QUOTATION and may be inset - declare it file by file in the mock sidecar {"quotations": ["quote.png"]}.');
  L.push('PLATES: type over a capture is legal - on an opaque band, NOT on a dimmed capture (2026-08-29 A, amended 2026-09-02).');
if (tok.narration) L.push(`NARRATION: see kt-tokens#narration${tok.duration ? ' · duration kt-tokens#duration' : ''}. Fit by trimming words, never by speeding the read.`);
if (legacy.voice) L.push(`VOICE [BLOCKER]: fingerprint-sealed (${legacy.voice.file}; canon.yml#voice is the sole surviving canon.yml block). NEVER change settings; no [tags]; 3+ takes, founder's ear picks.`);
L.push('');
L.push('GATES: node scripts/check-kt.mjs --film no-0NN [--render] · mocks: node scripts/check-mock.mjs <mock.html> — a visual artifact');
L.push('  (mock, cover, still, render) may reach the founder ONLY after its gate passes (founder ruling 2026-08-29).');
L.push('AUTHORING: docs/KT-RUNBOOK.md (register the film in kt-canon.yml#films; generated words file mandatory). Human canon view: canon/CATALOG.html.');

process.stdout.write(L.join('\n') + '\n');
