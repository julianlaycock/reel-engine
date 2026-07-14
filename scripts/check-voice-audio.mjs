#!/usr/bin/env node
// check-voice-audio.mjs — the ACOUSTIC voice gate (Approval Protocol rule 4:
// verify the SHIP, not the settings).
//
// The voice.fingerprint check in check-goldens.mjs proves the SETTINGS in
// config/voices.json didn't drift — but it cannot hear the audio. The 2026-07-14
// voice incident (a rebuild regenerated the VO from mis-remembered settings and
// nobody listened) showed we also need a gate on the SOUND itself. This script
// compares the shipped voiceover against the founder-approved reference take,
// canon/goldens/voice-reference.wav, using features ffmpeg can measure.
//
// WHAT THIS GATE CAN AND CANNOT CATCH (be honest):
//   The TTS voice (eleven_v3) is NON-DETERMINISTIC — two renders of the same
//   script are never sample-identical, so waveform/hash comparison is useless.
//   Instead we compare acoustic CHARACTER with generous tolerances. This catches
//   a GROSS mismatch — wrong voice, wrong model, music instead of speech, a
//   radically different mastering chain — NOT a subtly different take. A same-
//   voice different-take comparison SHOULD pass; that is by design.
//
// FEATURES + TOLERANCES (all duration-normalized — files may differ in length):
//   1. Integrated loudness (EBU R128 'I', LUFS)      — BLOCK if |Δ| > 4 LU.
//      Rationale: the master-voice chain lands the VO at a consistent loudness;
//      same-voice takes measured within ~1-2 LU. Music beds, unmastered raw TTS,
//      or a different chain land 5-15 LU away. 4 LU is ~2x take noise.
//   2. Loudness range (EBU R128 'LRA', LU)           — WARN if |Δ| > 8 LU.
//      Dynamics vary a lot with script content (pauses, emphasis), so this only
//      warns — it flags "speech vs music/ambience" dynamics, nothing finer.
//   3. Spectral centroid (median, Hz, via aspectralstats) — BLOCK if the ratio
//      candidate/reference leaves [0.55 .. 1.80]. The centroid is a timbre
//      proxy ("brightness"). Calibration 2026-07-14: the approved reference is
//      a short 9s take measuring ~2700 Hz; known-good same-voice full-length
//      masters measured 3300-4030 Hz (ratio 1.24-1.49) because the centroid
//      tracks script content too. The window is set ~2x beyond observed
//      same-voice spread — wide enough to never block a legit take, narrow
//      enough to catch a categorically different sound. We use the MEDIAN
//      across frames so silent/breath frames can't skew it.
//   4. Spectral profile (relative energy in 4 speech bands: 0-300 Hz body,
//      300-1200 Hz vowels, 1.2-3 kHz presence, 3-8 kHz sibilance; each band's
//      RMS minus overall RMS so absolute level cancels out) — BLOCK if any
//      band deviates > 8 dB from the reference profile, WARN above 5 dB.
//      Rationale: this is the shape of the voice independent of loudness and
//      duration. Same-voice takes measured within ~2-3 dB per band; a different
//      timbre or a music track bends the profile by 10 dB+.
//   NOT measured: true pitch (F0) tracking — ffmpeg has no pitch filter; the
//   centroid + band profile stand in for it. Prosody/pacing/read quality are
//   judge territory, not this gate's.
//
// Usage:
//   node reel-engine/scripts/check-voice-audio.mjs --input <audio-or-mp4> [--reference <wav>] [--brand vektor]
//   (--reference defaults to <brand>/canon/goldens/voice-reference.wav;
//    an .mp4 input has its first audio stream read directly — no extraction step)
//
// Exit: 0 = voice character matches the approved reference (within tolerance)
//       1 = GROSS MISMATCH — wrong voice / wrong settings / wrong file. Do not ship.
//       2 = gate error (missing file, no ffmpeg, no audio stream).
import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolveBrand} from '../lib/brand.mjs';

const execFileP = promisify(execFile);

// ---- tolerances (see the comment block above for the rationale) -------------
const TOL = {
  loudnessLU: 4,        // blocker
  lraLU: 8,             // warn only
  centroidRatio: [0.55, 1.80], // blocker (see calibration note above)
  bandBlockDb: 8,       // blocker per band
  bandWarnDb: 5,        // warn per band
};

// speech bands: [name, highpass Hz | null, lowpass Hz | null]
const BANDS = [
  ['body 0-300Hz', null, 300],
  ['vowels 300-1200Hz', 300, 1200],
  ['presence 1.2-3kHz', 1200, 3000],
  ['sibilance 3-8kHz', 3000, 8000],
];

// normalize everything to mono/48k so channel count & sample rate never skew a diff
const MONO = 'aformat=channel_layouts=mono:sample_rates=48000';

const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--input' || a[i] === '-i') p.input = a[++i];
    else if (a[i] === '--reference' || a[i] === '-r') p.reference = a[++i];
    else if (a[i] === '--brand' || a[i] === '-b') p.brand = a[++i];
    else if (a[i] === '--help' || a[i] === '-h') p.help = true;
  }
  return p;
};

const usage = () => {
  console.log('Usage: node scripts/check-voice-audio.mjs --input <audio-or-mp4> [--reference <wav>] [--brand vektor]');
  console.log('Compares the shipped voiceover to the founder-approved reference take (acoustic character,');
  console.log('not waveform — the TTS is non-deterministic). Catches WRONG VOICE, not different takes.');
};

// run ffmpeg over the first AUDIO stream of `file` (works for wav/mp3/mp4 alike)
const ff = async (file, af) => {
  try {
    const {stdout, stderr} = await execFileP('ffmpeg',
      ['-hide_banner', '-nostats', '-i', file, '-map', 'a:0', '-af', af, '-f', 'null', '-'],
      {maxBuffer: 1 << 26});
    return `${stdout}\n${stderr}`;
  } catch (e) {
    if (e.code === 'ENOENT') throw new Error('ffmpeg not found on PATH — the acoustic gate needs ffmpeg');
    if (/matches no streams|does not contain any stream/i.test(`${e.stderr}`)) {
      throw new Error(`${file} has no audio stream`);
    }
    // ffmpeg writes analysis to stderr and can exit non-zero on odd containers; keep what we got
    return `${e.stdout || ''}\n${e.stderr || ''}`;
  }
};

const num = (re, s) => {
  const m = s.match(re);
  return m ? parseFloat(m[1]) : null;
};

// ---- feature extraction ------------------------------------------------------
const measureLoudness = async (file) => {
  const out = await ff(file, `${MONO},ebur128`);
  return {
    I: num(/Integrated loudness:[\s\S]*?I:\s*(-?[\d.]+)\s*LUFS/, out),
    LRA: num(/Loudness range:[\s\S]*?LRA:\s*(-?[\d.]+)\s*LU/, out),
  };
};

const measureCentroid = async (file) => {
  // median across frames — robust against silences/breaths skewing the mean
  const out = await ff(file, `${MONO},aspectralstats=measure=centroid,ametadata=print:file=-`);
  const vals = [...out.matchAll(/aspectralstats\.1\.centroid=([\d.]+)/g)]
    .map((m) => +m[1]).filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (!vals.length) return null;
  return vals[Math.floor(vals.length / 2)];
};

const rmsDb = async (file, band) => {
  const [, hp, lp] = band;
  const chain = [MONO, hp ? `highpass=f=${hp}` : null, lp ? `lowpass=f=${lp}` : null, 'astats=measure_perchannel=none']
    .filter(Boolean).join(',');
  const out = await ff(file, chain);
  return num(/Overall[\s\S]*?RMS level dB:\s*(-?[\d.]+|inf|-inf)/, out);
};

const measureProfile = async (file) => {
  const overall = await rmsDb(file, ['overall', null, null]);
  const bands = {};
  for (const b of BANDS) {
    const v = await rmsDb(file, b);
    bands[b[0]] = v == null || overall == null ? null : v - overall; // relative dB — loudness cancels
  }
  return bands;
};

const duration = async (file) => {
  const {stdout} = await execFileP('ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {maxBuffer: 1 << 20});
  return parseFloat(stdout);
};

export const measureVoice = async (file) => ({
  file,
  durationSec: await duration(file),
  ...await measureLoudness(file),
  centroidHz: await measureCentroid(file),
  profile: await measureProfile(file),
});

// ---- comparison ---------------------------------------------------------------
const R = (ok, severity, name, detail) => ({ok, severity, name, detail});

export const compareVoices = (ref, cand) => {
  const results = [];

  // 1. integrated loudness
  if (ref.I == null || cand.I == null) {
    results.push(R(false, 'warn', 'loudness', 'could not measure integrated loudness on one of the files'));
  } else {
    const d = Math.abs(cand.I - ref.I);
    results.push(R(d <= TOL.loudnessLU, 'blocker', 'loudness',
      d <= TOL.loudnessLU
        ? `overall loudness ${cand.I.toFixed(1)} LUFS vs reference ${ref.I.toFixed(1)} — within the ±${TOL.loudnessLU} LU window`
        : `overall loudness ${cand.I.toFixed(1)} LUFS vs reference ${ref.I.toFixed(1)} — ${d.toFixed(1)} LU apart (allowed ±${TOL.loudnessLU}); the mastering chain or source is different`));
  }

  // 2. loudness range (warn only — dynamics track the script, not the voice)
  if (ref.LRA != null && cand.LRA != null) {
    const d = Math.abs(cand.LRA - ref.LRA);
    results.push(R(d <= TOL.lraLU, 'warn', 'dynamics',
      d <= TOL.lraLU
        ? `loudness range ${cand.LRA.toFixed(1)} LU vs reference ${ref.LRA.toFixed(1)} — similar dynamics`
        : `loudness range ${cand.LRA.toFixed(1)} LU vs reference ${ref.LRA.toFixed(1)} — very different dynamics (speech vs music/ambience territory)`));
  }

  // 3. spectral centroid (timbre / brightness)
  if (ref.centroidHz == null || cand.centroidHz == null) {
    results.push(R(false, 'warn', 'timbre', 'could not measure the spectral centroid on one of the files'));
  } else {
    const ratio = cand.centroidHz / ref.centroidHz;
    const ok = ratio >= TOL.centroidRatio[0] && ratio <= TOL.centroidRatio[1];
    results.push(R(ok, 'blocker', 'timbre',
      ok
        ? `voice brightness ${Math.round(cand.centroidHz)} Hz vs reference ${Math.round(ref.centroidHz)} Hz (ratio ${ratio.toFixed(2)}) — same timbre family`
        : `voice brightness ${Math.round(cand.centroidHz)} Hz vs reference ${Math.round(ref.centroidHz)} Hz (ratio ${ratio.toFixed(2)}, allowed ${TOL.centroidRatio[0]}-${TOL.centroidRatio[1]}) — this does not sound like the approved voice`));
  }

  // 4. spectral profile (band-by-band shape, loudness-independent)
  const devs = [];
  for (const [name] of BANDS) {
    const a = ref.profile?.[name];
    const b = cand.profile?.[name];
    if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) continue;
    devs.push({name, dev: Math.abs(b - a)});
  }
  if (!devs.length) {
    results.push(R(false, 'warn', 'spectrum', 'could not measure the band profile on one of the files'));
  } else {
    const worst = devs.reduce((m, d) => (d.dev > m.dev ? d : m));
    const sev = worst.dev > TOL.bandBlockDb ? 'blocker' : 'warn';
    const ok = worst.dev <= (sev === 'blocker' ? TOL.bandBlockDb : TOL.bandWarnDb);
    results.push(R(ok, sev, 'spectrum',
      ok
        ? `frequency shape matches (worst band ${worst.name} off by ${worst.dev.toFixed(1)} dB, allowed ${TOL.bandWarnDb})`
        : `frequency shape differs: ${worst.name} is ${worst.dev.toFixed(1)} dB off the reference (${sev === 'blocker' ? `over the ${TOL.bandBlockDb} dB hard limit — different voice character` : `over the ${TOL.bandWarnDb} dB soft limit — listen before shipping`})`));
  }

  return results;
};

// ------------------------------------------------------------------------ main
const main = async () => {
  const args = parseArgs();
  if (args.help) { usage(); return; }
  if (!args.input) { usage(); process.exit(2); }

  // verify ffmpeg/ffprobe are actually on PATH before doing anything
  await execFileP('ffmpeg', ['-version'], {maxBuffer: 1 << 20})
    .catch(() => { throw new Error('ffmpeg is not on PATH — install it or fix PATH; the acoustic gate cannot run'); });

  // resolve the brand only when the default reference is needed — an explicit
  // --reference must work even where brands.json can't resolve (e.g. a worktree)
  const reference = path.resolve(args.reference
    ?? path.join(resolveBrand(args.brand).brandRoot, 'canon', 'goldens', 'voice-reference.wav'));
  const input = path.resolve(args.input);
  for (const [label, f] of [['reference', reference], ['input', input]]) {
    if (!fs.existsSync(f)) throw new Error(`${label} file not found: ${f}`);
  }

  const ref = await measureVoice(reference);
  const cand = await measureVoice(input);
  const results = compareVoices(ref, cand);

  const fails = results.filter((r) => !r.ok);
  const blockers = fails.filter((r) => r.severity === 'blocker');
  const warns = fails.filter((r) => r.severity !== 'blocker');

  console.log(`\nvoice gate · acoustic character check (catches WRONG VOICE, not different takes)`);
  console.log(`  reference: ${reference} (${ref.durationSec.toFixed(1)}s)`);
  console.log(`  shipped:   ${input} (${cand.durationSec.toFixed(1)}s)\n`);
  for (const r of results) {
    const mark = r.ok ? 'ok  ' : r.severity === 'blocker' ? 'BLOCK' : 'warn ';
    console.log(`  [${mark}] ${r.name.padEnd(10)} ${r.detail}`);
  }
  console.log('');
  if (blockers.length) {
    console.log(`NO-GO — this audio does NOT sound like the founder-approved voice (${blockers.length} blocker(s), ${warns.length} warning(s)).`);
    console.log('If the founder approved a NEW voice, re-seed canon/goldens/voice-reference.wav from the approved take in the same commit.');
    process.exit(1);
  }
  console.log(`GO — the shipped audio matches the approved voice character${warns.length ? ` (${warns.length} warning(s) — worth a listen)` : ''}.`);
  console.log('Reminder: tolerances are deliberately generous — this gate catches the wrong voice, not a weaker take.');
};

// import-safe: only run the CLI when invoked directly
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((e) => {
    console.error('\n✖ voice gate error: ' + (e.message ?? e));
    process.exit(2);
  });
}
