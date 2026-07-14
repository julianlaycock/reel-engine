#!/usr/bin/env node
// run-gates.mjs — ONE command that runs the full blocking gate suite for a
// rendered video and answers the only question that matters: SHIP or BLOCKED.
//
// Approval-Protocol hardening (law 2026-07-14): every founder approval is only
// worth anything if a gate BLOCKS a build that drifts from it. The gates exist
// (canon, goldens, footage-rights, technical, voice) but each is a separate
// command with its own flags — easy to forget one. This orchestrator runs them
// ALL, translates each result into plain English for the founder, and exits
// non-zero if ANY blocking gate fails, so a delivery script literally cannot
// proceed past a failed gate.
//
// Gates run (each as a child process, in order):
//   canon           check-canon.mjs           — the locked design rules (canon.yml)
//   goldens         check-goldens.mjs         — pixel truth vs approved stills + voice
//                                               settings fingerprint + wireframe zones
//   footage-rights  check-footage-rights.mjs  — every clip/image/track has cleared rights
//   technical       qa-measure.mjs            — resolution, loudness, freezes, hook onset
//                                               (qa-measure always exits 0; we read its
//                                               JSON `pass` field for the verdict)
//   voice-audio     check-voice-audio.mjs     — the shipped VO *sounds like* the approved
//                                               voice (skipped with a warning when the
//                                               slug has no public/audio/<slug>/vo-master)
//
// Usage:
//   node reel-engine/scripts/run-gates.mjs --brand vektor --slug <slug> [--video <mp4>] [--json]
//   (--video defaults to <brand>/out/<slug>.mp4; --json also writes
//    <brand>/out/_qa/gates-<slug>.json for machines)
//
// Exit: 0 = SHIP (all blocking gates passed) · 1 = BLOCKED · 2 = orchestrator error.
//
// Import-safe: render-video.mjs (or any pipeline step) can
//   import {runGates} from './run-gates.mjs'
// and call runGates({brand, slug, video, json}) — it returns the report object
// and never calls process.exit; only the CLI wrapper does.
import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolveBrand} from '../lib/brand.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--brand' || a[i] === '-b') p.brand = a[++i];
    else if (a[i] === '--slug' || a[i] === '-s') p.slug = a[++i];
    else if (a[i] === '--video' || a[i] === '-V') p.video = a[++i];
    else if (a[i] === '--json') p.json = true;
    else if (a[i] === '--help' || a[i] === '-h') p.help = true;
  }
  return p;
};

const usage = () => {
  console.log('Usage: node scripts/run-gates.mjs --brand vektor --slug <slug> [--video <mp4>] [--json]');
  console.log('Runs every blocking gate (canon, goldens, footage-rights, technical, voice-audio)');
  console.log('and prints a founder-readable SHIP / BLOCKED verdict. Exit 1 if any gate fails.');
  console.log('  --video   path to the rendered mp4 (default: <brand>/out/<slug>.mp4)');
  console.log('  --json    also write machine-readable results to <brand>/out/_qa/gates-<slug>.json');
};

// run a gate script as a child process; never throws — a crash is a result
const runChild = (script, args, cwd) => new Promise((resolve) => {
  execFile(process.execPath, [script, ...args], {cwd, maxBuffer: 1 << 26}, (err, stdout, stderr) => {
    resolve({exitCode: err ? (err.code ?? 1) : 0, stdout: stdout ?? '', stderr: stderr ?? '', spawnError: err && err.code === 'ENOENT' ? err.message : null});
  });
});

// keep failure explanations human: first meaningful line, no stack traces
const firstHumanLine = (text) =>
  (text || '').split('\n').map((l) => l.trim())
    .find((l) => l && !l.startsWith('at ') && !/^node:|^Error\b.*\n\s+at /.test(l)) ?? 'no output';

const truncate = (s, n = 160) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// pull the [BLOCK] lines out of a canon/goldens-style report and say them plainly
const explainBlockReport = (stdout, what) => {
  const blocks = [...stdout.matchAll(/\[BLOCK\]\s+(\S+)\s+(.*)/g)].map((m) => ({rule: m[1], detail: m[2].trim()}));
  if (!blocks.length) return `the ${what} gate said NO-GO — see its full output above`;
  const names = blocks.map((b) => b.rule).join(', ');
  return `${blocks.length} locked rule(s) broken (${names}). First: ${truncate(blocks[0].detail)}`;
};

// plain-English names for qa-measure's hard-gate keys
const TECH_EXPLAIN = {
  resolution: 'the video is not 1080x1920 vertical',
  audioPresent: 'the file has no audio track',
  loudnessOk: 'overall loudness is off the -14 LUFS platform target (±1.5) — will sound too quiet or too loud',
  truePeakOk: 'audio peaks above -1 dBFS — it can distort on playback',
  noFreeze: 'the picture freezes for more than 1.5 seconds somewhere',
  hookOnsetOk: 'the first spoken word lands after the 1-second mark — the hook opens on silence',
  durationSane: 'the duration is outside the allowed 12-125 second window',
};

// ------------------------------------------------------------- the gate suite
export const runGates = async ({brand: brandArg, slug, video, json = false} = {}) => {
  if (!slug) throw new Error('runGates needs a slug');
  const brand = resolveBrand(brandArg);
  const videoPath = path.resolve(brand.brandRoot, video ?? path.join('out', `${slug}.mp4`));
  const hasMp4 = fs.existsSync(videoPath);
  const gates = [];
  const add = (name, ok, summary, {skipped = false, exitCode = null, raw = ''} = {}) =>
    gates.push({name, ok, skipped, exitCode, summary, raw});

  // 1. canon — the locked design spec
  {
    const r = await runChild(path.join(scriptsDir, 'check-canon.mjs'),
      ['--brand', brand.name, '--slug', slug, '--video', videoPath], brand.brandRoot);
    if (r.exitCode === 0) add('canon', true, 'the video obeys every locked design rule in canon.yml', {exitCode: 0, raw: r.stdout});
    else if (r.exitCode === 1) add('canon', false, explainBlockReport(r.stdout, 'canon'), {exitCode: 1, raw: r.stdout});
    else add('canon', false, `the canon gate could not run: ${truncate(firstHumanLine(r.stderr))}`, {exitCode: r.exitCode, raw: r.stderr});
  }

  // 2. goldens — pixel truth + voice-settings fingerprint + wireframe zones
  {
    const r = await runChild(path.join(scriptsDir, 'check-goldens.mjs'),
      ['--brand', brand.name, '--slug', slug, '--video', videoPath], brand.brandRoot);
    if (r.exitCode === 0) add('goldens', true, 'the masthead, end-card lockup, voice settings and layout zones all match the founder-approved versions', {exitCode: 0, raw: r.stdout});
    else if (r.exitCode === 1) add('goldens', false, explainBlockReport(r.stdout, 'golden'), {exitCode: 1, raw: r.stdout});
    else add('goldens', false, `the golden gate could not run: ${truncate(firstHumanLine(r.stderr))}`, {exitCode: r.exitCode, raw: r.stderr});
  }

  // 3. footage rights — the strike-prevention check (cwd MUST be the brand root)
  {
    const r = await runChild(path.join(scriptsDir, 'check-footage-rights.mjs'),
      ['--slug', slug], brand.brandRoot);
    if (r.exitCode === 0) add('footage-rights', true, 'every clip, image and music track in the cut has cleared rights', {exitCode: 0, raw: r.stdout});
    else if (r.exitCode === 1) {
      const bad = [...`${r.stdout}\n${r.stderr}`.matchAll(/FAIL\s+(\S+)\s+\[license=([^\]]+)\]/g)]
        .map((m) => `${m[1]} (${m[2] === 'MISSING' ? 'no proof of rights' : m[2]})`);
      add('footage-rights', false,
        bad.length ? `${bad.length} asset(s) we cannot prove we may use: ${truncate(bad.join(', '))} — publishing risks a copyright strike` : 'at least one clip lacks cleared rights — publishing risks a copyright strike',
        {exitCode: 1, raw: `${r.stdout}\n${r.stderr}`});
    } else add('footage-rights', false, `the footage-rights gate could not run: ${truncate(firstHumanLine(r.stderr))}`, {exitCode: r.exitCode, raw: r.stderr});
  }

  // 4. technical — qa-measure prints JSON and always exits 0; the verdict is in `pass`
  if (!hasMp4) {
    add('technical', false, `no rendered video found at ${videoPath} — render it first, then gate it`, {exitCode: null});
  } else {
    const r = await runChild(path.join(scriptsDir, 'qa-measure.mjs'), [videoPath], brand.brandRoot);
    let metrics = null;
    try { metrics = JSON.parse(r.stdout); } catch { /* fall through to error case */ }
    if (r.exitCode !== 0 || !metrics) {
      add('technical', false, `the technical measurement could not run: ${truncate(firstHumanLine(r.stderr || r.stdout))}`, {exitCode: r.exitCode, raw: r.stderr});
    } else if (metrics.pass) {
      add('technical', true, `format, loudness, pacing and hook timing all measure clean (${metrics.specs?.durationSec}s, ${metrics.audio?.I_LUFS} LUFS)`, {exitCode: 0, raw: r.stdout});
    } else {
      const failed = Object.entries(metrics.gates ?? {}).filter(([, ok]) => !ok).map(([k]) => TECH_EXPLAIN[k] ?? k);
      add('technical', false, failed.join('; ') || 'a technical measurement failed', {exitCode: 0, raw: r.stdout});
    }
  }

  // 5. voice-audio — the shipped VO must SOUND like the approved voice.
  //    Skipped (with a visible warning) when the slug ships no voiceover file.
  {
    const voDir = path.join(brand.brandRoot, 'public', 'audio', slug);
    const vo = ['vo-master.wav', 'vo.mp3'].map((f) => path.join(voDir, f)).find((f) => fs.existsSync(f));
    const refWav = path.join(brand.brandRoot, 'canon', 'goldens', 'voice-reference.wav');
    if (!vo) {
      add('voice-audio', true, `no voiceover file at public/audio/${slug}/ — acoustic voice check skipped (fine for silent/music-only cuts; NOT fine if this video should have narration)`, {skipped: true});
    } else if (!fs.existsSync(refWav)) {
      add('voice-audio', false, 'the approved voice reference (canon/goldens/voice-reference.wav) is missing — cannot verify the voice; re-seed it from the founder-approved take', {exitCode: null});
    } else {
      const r = await runChild(path.join(scriptsDir, 'check-voice-audio.mjs'),
        ['--brand', brand.name, '--input', vo, '--reference', refWav], brand.brandRoot);
      if (r.exitCode === 0) add('voice-audio', true, 'the shipped voiceover sounds like the founder-approved voice (loudness, brightness and frequency shape all match)', {exitCode: 0, raw: r.stdout});
      else if (r.exitCode === 1) add('voice-audio', false, explainBlockReport(r.stdout, 'voice'), {exitCode: 1, raw: r.stdout});
      else add('voice-audio', false, `the voice gate could not run: ${truncate(firstHumanLine(r.stderr))}`, {exitCode: r.exitCode, raw: r.stderr});
    }
  }

  const failed = gates.filter((g) => !g.ok);
  const report = {
    brand: brand.name,
    slug,
    video: videoPath,
    ranAt: new Date().toISOString(),
    gates: gates.map(({raw, ...g}) => g), // raw output stays out of the JSON — it's for the console
    failedCount: failed.length,
    verdict: failed.length ? `BLOCKED: ${failed.length} gate(s) failed — do not deliver` : 'SHIP: all gates passed',
    ok: failed.length === 0,
  };

  if (json) {
    const qaDir = path.join(brand.brandRoot, 'out', '_qa');
    fs.mkdirSync(qaDir, {recursive: true});
    report.jsonPath = path.join(qaDir, `gates-${slug}.json`);
    fs.writeFileSync(report.jsonPath, JSON.stringify(report, null, 2));
  }
  return report;
};

// ------------------------------------------------------------------------ CLI
const main = async () => {
  const args = parseArgs();
  if (args.help) { usage(); return; }
  if (!args.slug) { usage(); process.exit(2); }

  const report = await runGates(args);

  console.log(`\ngate suite · ${report.brand} · ${report.slug}`);
  console.log(`video: ${report.video}\n`);
  for (const g of report.gates) {
    const mark = g.ok ? '✓' : '✗';
    console.log(`  ${mark} ${g.name.padEnd(16)} ${g.summary}`);
  }
  console.log('');
  if (report.jsonPath) console.log(`machine-readable results: ${report.jsonPath}\n`);
  console.log(report.verdict);
  if (!report.ok) process.exit(1);
};

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((e) => {
    console.error('\n✖ gate-suite error: ' + (e.message ?? e));
    process.exit(2);
  });
}
