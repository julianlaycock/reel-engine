// scoreboard.mjs — the "Vektor vs the market" accountability ledger.
// Every model-vs-market prediction is logged; when the event resolves we score model vs
// market by Brier score (the honest way) and keep a running record. Resolved predictions
// become self-generating "we said X, here's what happened" update videos.
//
//   node scripts/scoreboard.mjs log --from-concept <slug>          # auto from concept.json.prediction
//   node scripts/scoreboard.mjs log --slug s --claim "..." --subject X --model 8 --market 23 \
//        --market-label "the market" --resolve-by 2026-07-19 --type binary
//   node scripts/scoreboard.mjs resolve --id <id> --happened 0|1 [--note "..."]
//   node scripts/scoreboard.mjs due [--asof YYYY-MM-DD]            # pending + past resolve_by → make updates
//   node scripts/scoreboard.mjs record                            # running Vektor-vs-market tally
//   node scripts/scoreboard.mjs brief --id <id>                   # update-video brief for a resolved call
//
// Brier (binary): b = (p - outcome)^2, p = P(subject achieves the claim). Lower = better.
// Per prediction the lower Brier "wins"; we track W-L + mean Brier for model vs market.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const DB = path.join(ROOT, 'data', '_predictions.json');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const cmd = process.argv[2];
const load = () => (fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, 'utf8')) : []);
const save = (rows) => fs.writeFileSync(DB, JSON.stringify(rows, null, 2) + '\n');
const today = () => new Date().toISOString().slice(0, 10);

function cmdLog() {
  const rows = load();
  let p;
  const fromConcept = arg('--from-concept');
  if (fromConcept) {
    const cj = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', fromConcept, 'concept.json'), 'utf8'));
    if (!cj.prediction) { console.error(`concept ${fromConcept} has no .prediction block`); process.exit(2); }
    p = { slug: fromConcept, ...cj.prediction };
  } else {
    p = {
      slug: arg('--slug'), claim: arg('--claim'), subject: arg('--subject'),
      model: parseFloat(arg('--model')), market: parseFloat(arg('--market')),
      market_label: arg('--market-label', 'the market'),
      resolve_by: arg('--resolve-by'), type: arg('--type', 'binary'),
    };
  }
  if (!p.slug || !p.claim || isNaN(p.model) || isNaN(p.market)) { console.error('need slug, claim, model, market'); process.exit(2); }
  const id = `${p.slug}`;
  if (rows.find((r) => r.id === id)) { console.log(`[scoreboard] ${id} already logged — skip`); return; }
  rows.push({ id, date: today(), status: 'pending', outcome: null, verdict: null, ...p });
  save(rows);
  console.log(`[scoreboard] logged ${id}: "${p.claim}" — model ${p.model}% vs ${p.market_label} ${p.market}% (resolve by ${p.resolve_by || 'n/a'})`);
}

function cmdResolve() {
  const rows = load();
  const r = rows.find((x) => x.id === arg('--id'));
  if (!r) { console.error(`no prediction id ${arg('--id')}`); process.exit(2); }
  const happened = parseInt(arg('--happened'), 10); // 1 = subject achieved the claim, 0 = not
  if (happened !== 0 && happened !== 1) { console.error('--happened must be 0 or 1'); process.exit(2); }
  const mp = r.model / 100, kp = r.market / 100;
  const modelBrier = (mp - happened) ** 2, marketBrier = (kp - happened) ** 2;
  const verdict = Math.abs(modelBrier - marketBrier) < 1e-9 ? 'push' : (modelBrier < marketBrier ? 'model' : 'market');
  Object.assign(r, { status: 'resolved', outcome: happened, modelBrier: +modelBrier.toFixed(4), marketBrier: +marketBrier.toFixed(4), verdict, resolvedAt: today(), note: arg('--note', '') });
  save(rows);
  console.log(`[scoreboard] ${r.id} resolved: ${r.subject} ${happened ? 'DID' : 'did NOT'} "${r.claim}". ` +
    `model Brier ${modelBrier.toFixed(3)} vs ${r.market_label} ${marketBrier.toFixed(3)} → ${verdict.toUpperCase()} wins.`);
}

function cmdRecord() {
  const res = load().filter((r) => r.status === 'resolved');
  if (!res.length) { console.log('No resolved predictions yet.'); return; }
  let w = 0, l = 0, p = 0, mB = 0, kB = 0;
  for (const r of res) { r.verdict === 'model' ? w++ : r.verdict === 'market' ? l++ : p++; mB += r.modelBrier; kB += r.marketBrier; }
  const n = res.length;
  console.log(`VEKTOR vs THE MARKET — ${n} resolved`);
  console.log(`  record: ${w}–${l}${p ? `–${p}` : ''}  (model wins–losses${p ? '–pushes' : ''})`);
  console.log(`  mean Brier: model ${(mB / n).toFixed(3)}  ·  market ${(kB / n).toFixed(3)}  (lower = better)`);
  console.log(`  verdict: ${mB < kB ? 'Vektor is beating the market' : mB > kB ? 'the market is ahead' : 'dead level'}`);
}

function cmdDue() {
  const asof = arg('--asof', today());
  const due = load().filter((r) => r.status === 'pending' && r.resolve_by && r.resolve_by <= asof);
  if (!due.length) { console.log(`No predictions due as of ${asof}.`); return; }
  console.log(`Due for resolution (make a "we said X" update) as of ${asof}:`);
  for (const r of due) console.log(`  - ${r.id}: "${r.claim}" (model ${r.model}% vs ${r.market}%, due ${r.resolve_by})`);
}

function cmdBrief() {
  const r = load().find((x) => x.id === arg('--id'));
  if (!r || r.status !== 'resolved') { console.error('need a resolved --id'); process.exit(2); }
  const res = load().filter((x) => x.status === 'resolved');
  let w = 0, l = 0; for (const x of res) { if (x.verdict === 'model') w++; else if (x.verdict === 'market') l++; }
  console.log(JSON.stringify({
    update_for: r.id, claim: r.claim, subject: r.subject,
    we_said: `${r.model}%`, market_said: `${r.market}% (${r.market_label})`,
    what_happened: r.outcome ? 'it happened' : 'it did not happen',
    who_won: r.verdict, running_record: `${w}-${l}`,
  }, null, 2));
}

// Threshold-gate: is the model's edge over the market big enough to publish a CONTRARIAN
// "model vs market" call? If not, the pitch should ship a recap/explainer instead (fixes
// the "contrarian treadmill"). Exits 1 when the edge is too small so the pitch can branch.
function cmdGate() {
  const model = parseFloat(arg('--model')), market = parseFloat(arg('--market'));
  const thr = parseFloat(arg('--threshold', '8'));
  if (isNaN(model) || isNaN(market)) { console.error('need --model and --market (percentages)'); process.exit(2); }
  const edge = Math.abs(model - market);
  const publish = edge >= thr;
  console.log(`edge = |${model} - ${market}| = ${edge.toFixed(1)} pts (threshold ${thr}).`);
  console.log(publish
    ? `→ PUBLISH as a model-vs-market call — the edge clears the bar.`
    : `→ edge too small — ship a RECAP / EXPLAINER / other format instead of a forced contrarian take.`);
  process.exit(publish ? 0 : 1);
}

// Calibration: for resolved calls, bin by the model's stated probability and compare to how
// often it actually happened. A well-calibrated model's "70%"s happen ~70% of the time.
function cmdCalibration() {
  const res = load().filter((r) => r.status === 'resolved');
  if (!res.length) { console.log('No resolved predictions yet — calibration needs resolved calls.'); return; }
  console.log('Calibration — model probability vs actual outcome rate:');
  for (const [lo, hi] of [[0, 20], [20, 40], [40, 60], [60, 80], [80, 101]]) {
    const b = res.filter((r) => r.model >= lo && r.model < hi);
    if (!b.length) continue;
    const predicted = (b.reduce((s, r) => s + r.model, 0) / b.length).toFixed(0);
    const actual = (100 * b.reduce((s, r) => s + r.outcome, 0) / b.length).toFixed(0);
    console.log(`  ${lo}-${hi === 101 ? 100 : hi}%:  n=${b.length}  ·  we said ~${predicted}%  ·  happened ${actual}%`);
  }
  const mB = res.reduce((s, r) => s + r.modelBrier, 0) / res.length;
  const kB = res.reduce((s, r) => s + r.marketBrier, 0) / res.length;
  console.log(`Mean Brier (lower = better): model ${mB.toFixed(3)}  ·  market ${kB.toFixed(3)}  → ${mB < kB ? 'model better calibrated' : mB > kB ? 'market better' : 'level'}`);
}

({ log: cmdLog, resolve: cmdResolve, record: cmdRecord, due: cmdDue, brief: cmdBrief, gate: cmdGate, calibration: cmdCalibration }[cmd] ||
  (() => { console.error('usage: log | resolve | due | record | brief | gate | calibration'); process.exit(2); }))();
