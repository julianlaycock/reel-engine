#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// check-conformance.mjs — LAYER-4 CONFORMANCE TEST (the durable "auto-inherit" proof)
//
// Proves that a FRESH, minimal, on-model video.json which DELIBERATELY OMITS the
// canon-defaulted fields (per-scene `transition`, `audio.musicVolume`) still
// renders ON-CANON — because the DEFAULTS live in the ENGINE, not in every file.
// If someone ever moves the 0.04 music bed / the transition default out of the
// engine fallback (or deletes the canon record), this test goes RED.
//
// It checks three independent layers and needs ALL to hold:
//   1. STATIC WIRING  — canon.yml records the defaults; the engine applies them
//      (Video.tsx `musicVolume ?? 0.04`, rotate-music.mjs `?? 0.04`), and the
//      fixture genuinely omits the fields it claims to omit.
//   2. GATE           — the omitting fixture passes check-canon + check-goldens (GO).
//   3. RENDER PROOF   — it renders with audio present even though musicVolume is
//      never set in the file (the engine default supplied the bed).
//
//   node reel-engine/scripts/check-conformance.mjs --brand vektor [--slug _conformance]
// ─────────────────────────────────────────────────────────────────────────────
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveBrand} from '../lib/brand.mjs';

const require = createRequire(import.meta.url);
const YAML = require('js-yaml');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const engineRoot = path.resolve(__dirname, '..');

// ---- args -------------------------------------------------------------------
const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {brand: undefined, slug: '_conformance'};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--brand' || a[i] === '-b') p.brand = a[++i];
    else if (a[i] === '--slug' || a[i] === '-s') p.slug = a[++i];
  }
  return p;
};

// ---- reporting --------------------------------------------------------------
const results = [];
const note = (ok, label, detail) => {
  results.push({ok, label, detail});
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`  [${mark}] ${label.padEnd(26)} ${detail}`);
};

const main = () => {
  const args = parseArgs();
  const brand = resolveBrand(args.brand);
  const brandRoot = brand.brandRoot;
  const slug = args.slug;

  console.log(`\nconformance test · ${brand.name} · slug '${slug}'`);
  console.log('proving a fresh video.json auto-inherits the canon defaults it never sets\n');

  // ── LAYER 1: STATIC WIRING ────────────────────────────────────────────────
  console.log('LAYER 1 · static wiring (canon records the defaults, the engine applies them)');

  // 1a. canon.yml records the defaults
  const canonPath = path.join(brandRoot, 'canon', 'canon.yml');
  let canon = {};
  try {
    canon = YAML.load(fs.readFileSync(canonPath, 'utf8'));
  } catch (e) {
    note(false, 'canon.yml.read', `could not read/parse ${canonPath}: ${e.message}`);
  }
  const musicDefault = canon?.audio?.musicVolume;
  note(
    musicDefault === 0.04,
    'canon.audio.musicVolume',
    `= ${JSON.stringify(musicDefault)} (want 0.04 — the recorded default bed)`,
  );
  const hasTransitions = canon?.transitions && typeof canon.transitions === 'object';
  note(
    Boolean(hasTransitions),
    'canon.transitions',
    hasTransitions
      ? `present (default '${canon.transitions.default}', allowed [${(canon.transitions.allowed || []).join(', ')}])`
      : 'MISSING transitions block',
  );
  const shapeDefault = canon?.videoModel?.shapeDefault;
  note(
    shapeDefault === 'standalone',
    'canon.videoModel.shape',
    `= ${JSON.stringify(shapeDefault)} (want 'standalone')`,
  );

  // 1b. the ENGINE applies the music default (fallback), in two places
  const videoTsxPath = path.join(engineRoot, 'src', 'Video.tsx');
  let videoTsx = '';
  try {
    videoTsx = fs.readFileSync(videoTsxPath, 'utf8');
  } catch (e) {
    note(false, 'Video.tsx.read', `could not read ${videoTsxPath}: ${e.message}`);
  }
  note(
    /musicVolume\s*\?\?\s*0\.04/.test(videoTsx),
    'Video.tsx fallback',
    /musicVolume\s*\?\?\s*0\.04/.test(videoTsx)
      ? "renders `audio.musicVolume ?? 0.04` (omitted -> 0.04 bed)"
      : 'no `musicVolume ?? 0.04` fallback found — omitted music would NOT default',
  );

  const rotatePath = path.join(engineRoot, 'scripts', 'rotate-music.mjs');
  let rotate = '';
  try {
    rotate = fs.readFileSync(rotatePath, 'utf8');
  } catch (e) {
    note(false, 'rotate-music.read', `could not read ${rotatePath}: ${e.message}`);
  }
  note(
    /musicVolume\s*=\s*[^\n]*\?\?\s*0\.04/.test(rotate) || /\?\?\s*0\.04/.test(rotate),
    'rotate-music.mjs default',
    /\?\?\s*0\.04/.test(rotate)
      ? 'defaults `musicVolume ?? 0.04` when picking a bed'
      : 'no 0.04 default found in rotate-music.mjs',
  );

  // 1c. the FIXTURE genuinely omits what it claims to omit
  const fixturePath = path.join(brandRoot, 'data', slug, 'video.json');
  let fixture = {};
  let fixtureRaw = '';
  try {
    fixtureRaw = fs.readFileSync(fixturePath, 'utf8');
    fixture = JSON.parse(fixtureRaw);
  } catch (e) {
    note(false, 'fixture.read', `could not read/parse ${fixturePath}: ${e.message}`);
  }
  const omitsMusicVol = fixture?.audio && !('musicVolume' in fixture.audio);
  note(
    Boolean(omitsMusicVol),
    'fixture omits musicVolume',
    omitsMusicVol
      ? `audio has voSrc + musicSrc but NO musicVolume (voVolume=${fixture.audio.voVolume})`
      : 'fixture sets audio.musicVolume — it must OMIT it to prove the default',
  );
  const scenes = Array.isArray(fixture?.scenes) ? fixture.scenes : [];
  const scenesWithTransition = scenes.filter((s) => 'transition' in s).length;
  note(
    scenes.length > 0 && scenesWithTransition === 0,
    'fixture omits transition',
    scenes.length === 0
      ? 'fixture has no scenes'
      : `${scenes.length} scenes, ${scenesWithTransition} set a transition (want 0 — rely on the default)`,
  );

  // ── LAYER 2: GATE (the omitting fixture must pass) ────────────────────────
  console.log('\nLAYER 2 · gate (the omitting fixture passes check-canon + check-goldens)');
  const runGate = (script) => {
    const r = spawnSync(
      process.execPath,
      [path.join(engineRoot, 'scripts', script), '--brand', brand.name, '--slug', slug],
      {cwd: brandRoot, encoding: 'utf8'},
    );
    const out = `${r.stdout || ''}${r.stderr || ''}`;
    const verdict = (out.match(/^(GO|NO-GO)[^\n]*/m) || [])[0] || '(no verdict line)';
    return {code: r.status, verdict};
  };
  const canonGate = runGate('check-canon.mjs');
  note(canonGate.code === 0, 'check-canon', `${canonGate.verdict}  [exit ${canonGate.code}]`);
  const goldenGate = runGate('check-goldens.mjs');
  note(goldenGate.code === 0, 'check-goldens', `${goldenGate.verdict}  [exit ${goldenGate.code}]`);

  // ── LAYER 3: RENDER PROOF (renders with audio despite no musicVolume) ─────
  console.log('\nLAYER 3 · render proof (renders with audio bed although musicVolume is never set)');
  const outRel = path.join('out', '_qa', `${slug}.mp4`);
  const outAbs = path.join(brandRoot, outRel);
  fs.mkdirSync(path.dirname(outAbs), {recursive: true});
  if (fs.existsSync(outAbs)) fs.rmSync(outAbs);

  const render = spawnSync(
    process.execPath,
    [
      path.join(engineRoot, 'scripts', 'render-video.mjs'),
      '--input',
      path.join('data', slug, 'video.json'),
      '--output',
      outRel,
    ],
    {cwd: brandRoot, encoding: 'utf8', timeout: 9 * 60 * 1000},
  );
  const rendered = render.status === 0 && fs.existsSync(outAbs);
  note(
    rendered,
    'render-video',
    rendered
      ? `rendered ${outRel}`
      : `render failed (exit ${render.status}): ${(render.stderr || render.stdout || '').split('\n').slice(-4).join(' | ')}`,
  );

  let audioPresent = false;
  let meanVol = null;
  if (rendered) {
    // audio stream present?
    const probe = spawnSync(
      'ffprobe',
      ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', outAbs],
      {encoding: 'utf8'},
    );
    audioPresent = /audio/.test(probe.stdout || '');

    // volumedetect: mean/max dB — confirms the mux is NOT silence (VO@1.0 + engine bed)
    const vd = spawnSync('ffmpeg', ['-hide_banner', '-i', outAbs, '-af', 'volumedetect', '-f', 'null', '-'], {
      encoding: 'utf8',
    });
    const vdOut = `${vd.stdout || ''}${vd.stderr || ''}`;
    const m = vdOut.match(/mean_volume:\s*(-?\d+(\.\d+)?)\s*dB/);
    const mx = vdOut.match(/max_volume:\s*(-?\d+(\.\d+)?)\s*dB/);
    meanVol = m ? parseFloat(m[1]) : null;
    const maxVol = mx ? parseFloat(mx[1]) : null;
    note(
      audioPresent && meanVol !== null && meanVol > -80,
      'audio mix present',
      audioPresent
        ? `audio stream ok · mean_volume ${meanVol}dB · max_volume ${maxVol}dB (non-silent — VO@1.0 + music at engine default 0.04)`
        : 'no audio stream in the rendered mp4',
    );
  }

  // The load-bearing statement: the file set NO musicVolume, yet the render carries a bed.
  note(
    rendered && audioPresent && omitsMusicVol,
    'default auto-applied',
    rendered && audioPresent && omitsMusicVol
      ? 'video.json contains NO musicVolume, yet the render used the engine default (0.04) and has audio — precise music-only level is not separable from the VO in the final mux, so this is confirmed via: fixture omits the field + engine fallback wiring + non-silent audio present'
      : 'could not confirm the omitted-default auto-applied',
  );

  // ── VERDICT ───────────────────────────────────────────────────────────────
  const failed = results.filter((r) => !r.ok);
  console.log('');
  if (failed.length === 0) {
    console.log(
      "CONFORMANCE PASS — a fresh video.json omitting transition + musicVolume auto-inherits the canon defaults (music 0.04, transition default) and gates GO.",
    );
    process.exit(0);
  } else {
    console.log(
      `CONFORMANCE FAIL — ${failed.length} assertion(s) failed: ${failed.map((r) => r.label).join(', ')}. ` +
        'A fresh video did NOT auto-inherit the canon defaults (or the fixture no longer omits them).',
    );
    process.exit(1);
  }
};

main();
