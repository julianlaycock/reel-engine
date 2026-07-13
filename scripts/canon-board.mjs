#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// canon-board.mjs — render the human-readable Visual Canon BOARD.
//
// Reads a brand's canon MASTERS and emits a single self-contained HTML page
// (canon/BOARD.html) so a founder can review the whole canon at a glance and
// the /canon-change ritual's "SEE the board" step works.
//
//   Masters read (pointer-only; this script NEVER re-types their values):
//     canon/canon.yml                    — enforced rules + severities (YAML)
//     canon/americana-tokens.json        — colors, type, motion, beat grammar
//     canon/wireframes/wireframes.json   — zone envelopes / master bands
//     canon/templates/templates.json     — THE TEMPLATE MENU
//     canon/VIDEO-MODEL.md               — the prose "what a video IS" (linked)
//
//   Output: canon/BOARD.html — a BUILD ARTIFACT. Never hand-edit it; change the
//   masters and regenerate (`npm run canon:board`, or the canon-regen PostToolUse
//   hook does it automatically).
//
// Usage:
//   node canon-board.mjs --brand vektor      # sibling brand folder ../<brand>
//   node canon-board.mjs --root <brandRoot>  # explicit brand root (hook path)
//
// Pure Node ESM. YAML parsed with js-yaml (a reel-engine dependency).
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── args ─────────────────────────────────────────────────────────────────────
function argVal(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}
const brand = argVal('--brand');
const rootArg = argVal('--root');

// Brand root: --root wins (hook passes it); else ../<brand> (sibling of reel-engine).
const brandRoot = rootArg
  ? path.resolve(rootArg)
  : brand
    ? path.resolve(__dirname, '..', '..', brand)
    : null;

if (!brandRoot) {
  console.error('canon-board: need --brand <name> or --root <brandRoot>');
  process.exit(1);
}

const canonDir = path.join(brandRoot, 'canon');
if (!fs.existsSync(canonDir)) {
  console.error(`canon-board: no canon/ dir at ${canonDir}`);
  process.exit(1);
}

// ── read masters (tolerant: a missing optional master just drops its section) ──
function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}
function readJson(p) {
  const t = readText(p);
  if (t == null) return null;
  try {
    return JSON.parse(t);
  } catch (e) {
    console.error(`canon-board: bad JSON in ${p} — ${e.message}`);
    return null;
  }
}

const canonYmlText = readText(path.join(canonDir, 'canon.yml'));
if (canonYmlText == null) {
  console.error(`canon-board: canon.yml not found in ${canonDir}`);
  process.exit(1);
}
let canon;
try {
  canon = yaml.load(canonYmlText);
} catch (e) {
  console.error(`canon-board: canon.yml failed to parse — ${e.message}`);
  process.exit(1);
}

const tokens = readJson(path.join(canonDir, 'americana-tokens.json')) || {};
const wireframes = readJson(path.join(canonDir, 'wireframes', 'wireframes.json')) || {};
const templates = readJson(path.join(canonDir, 'templates', 'templates.json')) || {};
const hasVideoModelDoc = fs.existsSync(path.join(canonDir, 'VIDEO-MODEL.md'));

// ── html helpers ─────────────────────────────────────────────────────────────
const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Compact one-line summary of a rule block's scalar fields (skip meta keys).
const SKIP_KEYS = new Set(['severity', 'source', 'enforcedBy', 'seededFrom', 'approvedAt', 'why', '_doc']);
function summarizeBlock(obj) {
  if (obj == null || typeof obj !== 'object') return esc(obj);
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    if (SKIP_KEYS.has(k)) continue;
    let val;
    if (Array.isArray(v)) val = v.map((x) => (typeof x === 'object' ? '{…}' : x)).join(', ');
    else if (v && typeof v === 'object') val = '{…}';
    else val = v;
    parts.push(`<b>${esc(k)}</b> ${esc(val)}`);
  }
  return parts.join(' · ');
}

function fieldSwatch(name, val) {
  let css;
  let label;
  if (typeof val === 'string') {
    css = val;
    label = val;
  } else if (val && val.type === 'linear-gradient') {
    css = `linear-gradient(${val.angle}, ${val.stops.join(', ')})`;
    label = 'gradient';
  } else {
    css = 'transparent';
    label = '—';
  }
  return `<div class="sw"><span class="chip" style="background:${esc(css)}"></span><span class="swname">${esc(name)}</span><span class="swval">${esc(label)}</span></div>`;
}

// ── build sections ───────────────────────────────────────────────────────────
const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

// RULES table: every top-level canon.yml block that carries a `severity`.
const ruleRows = Object.entries(canon)
  .filter(([, v]) => v && typeof v === 'object' && 'severity' in v)
  .map(([name, block]) => {
    const sev = String(block.severity).toLowerCase();
    const isBlocker = sev === 'blocker';
    const src = block.source || block.enforcedBy || block.registry || block.contract || block.file || '';
    return `<tr class="${isBlocker ? 'blk' : ''}">
      <td class="rn">${esc(name)}</td>
      <td><span class="sev sev-${esc(sev)}">${esc(sev.toUpperCase())}</span></td>
      <td class="sum">${summarizeBlock(block)}</td>
      <td class="src">${esc(src)}</td>
    </tr>`;
  })
  .join('\n');
const blockerCount = Object.values(canon).filter(
  (v) => v && typeof v === 'object' && String(v.severity).toLowerCase() === 'blocker'
).length;

// VIDEO MODEL
const vm = canon.videoModel || {};
const videoModelHtml = `
  <p class="lead">Every video defaults to a <b>${esc(vm.shapeDefault || 'standalone')}</b> topic told as a story arc:
  <span class="arc">${(vm.arc || []).map((a) => `<span>${esc(a)}</span>`).join('<i>→</i>')}</span></p>
  <p class="note">Shape flag is checked (<b>series</b> must be flagged in concept.json); quality is judged.
  Prose home: ${hasVideoModelDoc ? '<a href="VIDEO-MODEL.md">VIDEO-MODEL.md</a>' : 'VIDEO-MODEL.md'} · master: <code>canon.yml#videoModel</code> (severity ${esc(vm.severity || 'warn')}).</p>`;

// TRANSITIONS
const tr = canon.transitions || {};
const transitionsHtml = `
  <p><b>Allowed:</b> ${(tr.allowed || []).map((t) => `<code>${esc(t)}</code>`).join(' ')}
     &nbsp;·&nbsp; <b>Default:</b> <code>${esc(tr.default || '—')}</code></p>
  <p class="note">${esc(tr.grammar || '')}</p>`;

// COLOR TOKENS
const fields = (tokens.color && tokens.color.fields) || {};
const accents = (tokens.color && tokens.color.accents) || {};
const fieldSwatches = Object.entries(fields).map(([n, v]) => fieldSwatch(n, v)).join('\n');
const accentSwatches = Object.entries(accents).map(([n, v]) => fieldSwatch(n, v)).join('\n');
const colorLaws = ((tokens.color && tokens.color.laws) || []).map((l) => `<li>${esc(l)}</li>`).join('');

// TYPE TOKENS
const ty = tokens.type || {};
const typeRows = ['display', 'kicker', 'meta', 'ornament']
  .filter((r) => ty[r])
  .map((r) => {
    const t = ty[r];
    const family = t.family || '—';
    const roles = Array.isArray(t.roles) ? t.roles.join(', ') : t.law || t.note || '';
    return `<tr><td class="rn">${esc(r)}</td><td><b>${esc(family)}</b></td><td class="sum">${esc(roles)}</td></tr>`;
  })
  .join('\n');

// TEMPLATE MENU
const STATUS_ORDER = {approved: 0, proposed: 1, parked: 2, retired: 3};
const tmpl = templates.templates || {};
const tmplRows = Object.entries(tmpl)
  .sort((a, b) => (STATUS_ORDER[a[1].status] ?? 9) - (STATUS_ORDER[b[1].status] ?? 9) || a[0].localeCompare(b[0]))
  .map(([id, t]) => {
    const st = String(t.status || 'unknown').toLowerCase();
    return `<tr class="st-${esc(st)}">
      <td class="rn">${esc(id)}</td>
      <td><span class="status status-${esc(st)}">${esc(st)}</span></td>
      <td class="sum">${esc(t.title || '')}</td>
    </tr>`;
  })
  .join('\n');
const tmplCounts = Object.values(tmpl).reduce((acc, t) => {
  const s = String(t.status || 'unknown').toLowerCase();
  acc[s] = (acc[s] || 0) + 1;
  return acc;
}, {});
const tmplCountLine = Object.entries(tmplCounts)
  .map(([s, n]) => `${n} ${s}`)
  .join(' · ');

// Wireframe zone summary (a light pointer, not exhaustive).
const wfKinds = wireframes.kinds ? Object.keys(wireframes.kinds) : [];

// ── page ─────────────────────────────────────────────────────────────────────
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vektor Visual Canon — BOARD</title>
<style>
  :root {
    --ink: #101010; --paper: #F4EFDF; --fog: #E8ECEA; --line: #d9d4c4;
    --acid: #2b8a20; --signal: #1B4FA0; --blocker: #b3261e; --warn: #8a6d00;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--fog); color: var(--ink);
    font: 15px/1.5 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 1040px; margin: 0 auto; padding: 32px 24px 80px; }
  header.masthead {
    background: var(--ink); color: var(--paper); border-radius: 10px;
    padding: 22px 26px; margin-bottom: 8px;
    display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 18px;
  }
  .wordmark { font-family: 'Inter Tight', system-ui, sans-serif; font-weight: 700; font-size: 30px; letter-spacing: -0.045em; }
  .masthead .tag { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; opacity: .72; }
  .masthead .ver { margin-left: auto; font-size: 13px; opacity: .9; }
  .artifact {
    background: #fff7cf; border: 1px solid #e4c94a; border-radius: 8px;
    padding: 10px 14px; margin: 12px 0 26px; font-size: 12.5px; color: #6b5300;
  }
  h2 {
    font-family: 'Inter Tight', system-ui, sans-serif; font-weight: 700;
    font-size: 13px; letter-spacing: .16em; text-transform: uppercase;
    margin: 38px 0 12px; padding-bottom: 7px; border-bottom: 2px solid var(--ink);
  }
  section { background: #fff; border: 1px solid var(--line); border-radius: 10px; padding: 4px 20px 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-weight: 700; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #6b6455; padding: 12px 8px 6px; border-bottom: 1px solid var(--line); }
  td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  td.rn { font-weight: 700; white-space: nowrap; }
  td.src { color: #8a8577; font-size: 11.5px; word-break: break-word; }
  td.sum { color: #333; }
  td.sum b { font-weight: 700; color: #111; }
  tr.blk td.rn { color: var(--blocker); }
  tr.blk { background: #fdf3f2; }
  .sev { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: .08em; padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
  .sev-blocker { background: var(--blocker); color: #fff; }
  .sev-warn { background: #fff0c2; color: var(--warn); border: 1px solid #e4c94a; }
  .status { display: inline-block; font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; }
  .status-approved { background: #dff2d6; color: #2b6a1e; border: 1px solid #a8d69a; }
  .status-proposed { background: #dbe8ff; color: #274b8a; border: 1px solid #a8c2f0; }
  .status-parked { background: #ececec; color: #777; border: 1px solid #d4d4d4; }
  .status-retired { background: #f3e0e0; color: #9a4a4a; border: 1px solid #e0b8b8; }
  tr.st-parked td, tr.st-retired td { opacity: .62; }
  .lead { font-size: 15px; margin: 14px 0 8px; }
  .note { color: #6b6455; font-size: 12.5px; margin: 6px 0; }
  code { background: #f0ede2; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
  .arc { font-weight: 700; }
  .arc span { color: var(--signal); }
  .arc i { color: #b0a98f; font-style: normal; margin: 0 5px; }
  .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; margin: 14px 0; }
  .sw { display: flex; align-items: center; gap: 10px; border: 1px solid var(--line); border-radius: 7px; padding: 7px 9px; }
  .chip { width: 30px; height: 30px; border-radius: 5px; border: 1px solid rgba(0,0,0,.15); flex: none; }
  .swname { font-weight: 700; }
  .swval { margin-left: auto; color: #8a8577; font-size: 11.5px; }
  .laws { margin: 6px 0 2px; padding-left: 20px; font-size: 12.5px; color: #444; }
  .laws li { margin: 3px 0; }
  .meta-line { color: #6b6455; font-size: 12px; margin: 10px 0 2px; }
  a { color: var(--signal); }
  footer { margin-top: 40px; color: #8a8577; font-size: 11.5px; text-align: center; }
</style>
</head>
<body>
<div class="wrap">

  <header class="masthead">
    <span class="wordmark">vektor</span>
    <span class="tag">visual canon · board</span>
    <span class="ver">v${esc(canon.version)} · updated ${esc(canon.updated || '')}</span>
  </header>
  <div class="artifact">⚙ BUILD ARTIFACT — generated by <code>reel-engine/scripts/canon-board.mjs</code> on ${esc(now)}. Do NOT hand-edit. Change the master files in <code>canon/</code> and regenerate (<code>npm run canon:board</code>).</div>

  <h2>The Video Model</h2>
  <section>${videoModelHtml}</section>

  <h2>Enforced Rules — ${blockerCount} blockers</h2>
  <section>
    <table>
      <thead><tr><th>Rule</th><th>Severity</th><th>Summary</th><th>Master / enforced by</th></tr></thead>
      <tbody>
${ruleRows}
      </tbody>
    </table>
  </section>

  <h2>Transition Grammar</h2>
  <section>${transitionsHtml}</section>

  <h2>Color Tokens</h2>
  <section>
    <div class="meta-line">Fields</div>
    <div class="swatches">${fieldSwatches}</div>
    <div class="meta-line">Accents</div>
    <div class="swatches">${accentSwatches}</div>
    ${colorLaws ? `<div class="meta-line">Laws</div><ul class="laws">${colorLaws}</ul>` : ''}
  </section>

  <h2>Type Tokens</h2>
  <section>
    <table>
      <thead><tr><th>Role</th><th>Family</th><th>Used for</th></tr></thead>
      <tbody>
${typeRows}
      </tbody>
    </table>
  </section>

  <h2>The Template Menu — ${tmplCountLine}</h2>
  <section>
    <table>
      <thead><tr><th>Template id</th><th>Status</th><th>What it is</th></tr></thead>
      <tbody>
${tmplRows}
      </tbody>
    </table>
    <p class="note">New templates enter ONLY via founder RENDER→SEE→LOCK. Master: <code>canon/templates/templates.json</code>.</p>
  </section>

  ${
    wfKinds.length
      ? `<h2>Wireframe Zones</h2>
  <section>
    <p class="note">Zone envelopes / master bands for ${wfKinds.length} scene kinds: ${wfKinds.map((k) => `<code>${esc(k)}</code>`).join(' ')}.
    Master: <code>canon/wireframes/wireframes.json</code> (v${esc(wireframes.version || '?')}).</p>
  </section>`
      : ''
  }

  <footer>Vektor Visual Canon board · generated from canon.yml v${esc(canon.version)} · not hand-edited</footer>

</div>
</body>
</html>
`;

// ── write ────────────────────────────────────────────────────────────────────
const outPath = path.join(canonDir, 'BOARD.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`canon-board: wrote ${outPath} (canon v${canon.version}, ${blockerCount} blockers, ${Object.keys(tmpl).length} templates)`);
