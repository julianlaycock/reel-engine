#!/usr/bin/env node
// check-canon.mjs — the BLOCKING canon gate (poka-yoke, not a warning).
//
// Reads the brand's enforced spec (canon/canon.yml), the video.json, and — when
// present — the rendered mp4, then verifies every measurable rule. Any failure
// whose rule is `severity: blocker` makes the process exit 1 (NO-GO); warnings
// are reported but do not block. This turns "canon exists somewhere" into "the
// artifact must pass canon to ship."
//
// Usage:
//   node reel-engine/scripts/check-canon.mjs --brand vektor --slug <slug> [--video out/<slug>.mp4]
//
// Design: the spec POINTS to masters (e.g. safe-zone lives in americana-tokens.json)
// so numbers are never duplicated — the gate follows the pointer.
import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {resolveBrand} from '../lib/brand.mjs';
import {readingFloorFrames, CPS} from './lib/reading-time.mjs';

const execFileP = promisify(execFile);
const require = createRequire(import.meta.url);
const YAML = require('js-yaml');

const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--brand' || a[i] === '-b') p.brand = a[++i];
    else if (a[i] === '--slug' || a[i] === '-s') p.slug = a[++i];
    else if (a[i] === '--video' || a[i] === '-V') p.video = a[++i];
  }
  if (!p.slug) throw new Error('Usage: check-canon.mjs --brand <brand> --slug <slug> [--video out/<slug>.mp4]');
  return p;
};

// A check result. severity is only consulted when ok === false.
const R = (ok, severity, name, detail) => ({ok, severity, name, detail});

const ffprobe = async (file) => {
  const {stdout} = await execFileP('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-show_entries', 'format=duration',
    '-of', 'json', file,
  ]);
  const j = JSON.parse(stdout);
  const s = j.streams?.[0] ?? {};
  return {width: Number(s.width), height: Number(s.height), duration: Number(j.format?.duration)};
};

// Replicates ClaudeMascot.tsx's safe-zone math against the mastered zone numbers.
const mascotViolatesZone = (m, z) => {
  const {xPct = 50, yPct = 55, size = 160, bubble = true} = m || {};
  const rightEdge = (xPct / 100) * 1080 + size / 2 + (bubble ? size * 0.72 + size * 0.62 - size / 2 : 0);
  const bottomEdge = (yPct / 100) * 1920 + size / 2 + size * 0.35;
  const inRail = bottomEdge > z.railBandY[0] && (yPct / 100) * 1920 < z.railBandY[1];
  const reasons = [];
  if (rightEdge > (inRail ? 1080 - z.railRightPx : 1080 - z.sidePx)) reasons.push('right/rail');
  if ((xPct / 100) * 1080 - size / 2 < z.sidePx) reasons.push('left');
  if (bottomEdge > 1920 - z.bottomPx) reasons.push('bottom');
  if ((yPct / 100) * 1920 - size / 2 < z.topPx) reasons.push('top');
  return reasons;
};

const main = async () => {
  const args = parseArgs();
  const brand = resolveBrand(args.brand);
  process.chdir(brand.brandRoot);

  const canon = YAML.load(fs.readFileSync(path.join('canon', 'canon.yml'), 'utf8'));
  const video = JSON.parse(fs.readFileSync(path.join('data', args.slug, 'video.json'), 'utf8'));
  const tokens = JSON.parse(fs.readFileSync(path.join('canon', 'americana-tokens.json'), 'utf8'));
  const zone = tokens.layout.platformSafeZone;
  let concept = null;
  try { concept = JSON.parse(fs.readFileSync(path.join('data', args.slug, 'concept.json'), 'utf8')); } catch { /* concept.json optional */ }
  const isTranscript = Boolean(concept && (concept.source_type === 'transcript' || concept.transcript_verbatim === true));

  const videoPath = args.video || path.join('out', `${args.slug}.mp4`);
  const hasMp4 = fs.existsSync(videoPath);
  const probe = hasMp4 ? await ffprobe(videoPath) : null;

  const results = [];

  // format
  {
    const f = canon.format;
    const okJson = video.width === f.width && video.height === f.height && video.fps === f.fps;
    results.push(R(okJson, f.severity, 'format.video.json', `${video.width}x${video.height}@${video.fps} (want ${f.width}x${f.height}@${f.fps})`));
    if (probe) {
      results.push(R(probe.width === f.width && probe.height === f.height, f.severity, 'format.mp4', `${probe.width}x${probe.height} (want ${f.width}x${f.height})`));
    }
  }

  // duration — transcript-verbatim videos are exempt from the cap (canon.transcript)
  {
    const d = canon.duration;
    const frames = (video.scenes || []).reduce((s, sc) => s + (sc.durationInFrames || 0), 0);
    const sec = probe ? probe.duration : frames / (video.fps || 30);
    const from = probe ? ' [mp4]' : ' [from frames]';
    if (isTranscript && canon.transcript?.exemptFromDurationCap) {
      results.push(R(true, 'warn', 'duration', `${sec.toFixed(1)}s — transcript-verbatim, exempt from cap${from}`));
    } else {
      const okHard = sec >= d.minSec && sec <= d.maxSec;
      results.push(R(okHard, d.severity, 'duration', `${sec.toFixed(1)}s (allowed ${d.minSec}-${d.maxSec}s)${from}`));
      const inTarget = sec >= d.targetMinSec && sec <= d.targetMaxSec;
      results.push(R(inTarget, 'warn', 'duration.target', `${sec.toFixed(1)}s (target ${d.targetMinSec}-${d.targetMaxSec}s)`));
    }
  }

  // skin
  {
    const s = canon.skin;
    results.push(R(video.skin === s.required, s.severity, 'skin', `${video.skin ?? '(unset)'} (want ${s.required})`));
  }

  // chrome / masthead
  {
    const c = canon.chrome;
    const hasBlock = video.chrome && typeof video.chrome === 'object' && Object.keys(video.chrome).length > 0;
    const missing = (c.requireFields || []).filter((k) => !video.chrome || !video.chrome[k]);
    results.push(R(hasBlock && missing.length === 0, c.severity, 'chrome', hasBlock ? (missing.length ? `missing fields: ${missing.join(', ')}` : 'present') : 'no chrome block'));
  }

  // audio / VO
  {
    const a = canon.audio;
    const hasVo = Boolean(video.audio && video.audio.voSrc);
    results.push(R(hasVo, a.severity, 'audio.vo', hasVo ? video.audio.voSrc : 'no voSrc'));
    if (a.noSfx) {
      const sfxOff = !(video.audio && video.audio.sfx === true);
      results.push(R(sfxOff, a.severity, 'audio.noSfx', sfxOff ? 'no transition SFX' : 'audio.sfx is true (transition SFX not allowed)'));
    }
    // music bed level — a video's audio.musicVolume must not EXCEED canon.audio.musicVolumeMax.
    // The default bed (0.04) lives in the engine fallback, so an OMITTED musicVolume is on-canon;
    // this only fires when a video sets a bed louder than the cap. WARN (not a blocker) per canon.
    const max = a.musicVolumeMax;
    const vol = video.audio?.musicVolume;
    if (typeof max === 'number' && typeof vol === 'number') {
      results.push(R(vol <= max, 'warn', 'audio.musicVolume',
        vol <= max ? `${vol} ≤ ${max}` : `music bed too loud (${vol} > ${max})`));
    }
  }

  // safe zone (mascot placements)
  {
    const sz = canon.safeZone;
    const scenes = video.scenes || [];
    const offenders = [];
    scenes.forEach((sc, i) => {
      if (sc.mascot) {
        const reasons = mascotViolatesZone(sc.mascot, zone);
        if (reasons.length) offenders.push(`scene[${i}] xPct=${sc.mascot.xPct} yPct=${sc.mascot.yPct} size=${sc.mascot.size ?? 160} → ${reasons.join(',')}`);
      }
    });
    results.push(R(offenders.length === 0, sz.severity, 'safeZone.mascot', offenders.length ? offenders.join(' | ') : 'all mascots inside zone'));
  }

  // pacing — reading-time floor per scene (canon v2.8; same math as retime.mjs
  // via scripts/lib/reading-time.mjs, so build and gate can never drift)
  {
    const sev = canon.pacing?.severity ?? 'blocker';
    const fps = video.fps || 30;
    const slow = [];
    (video.scenes || []).forEach((sc, i) => {
      const floor = readingFloorFrames(sc, fps);
      const dur = sc.durationInFrames || 0;
      if (dur < floor) slow.push(`scene[${i}] ${dur}f < floor ${floor}f (${(floor / fps).toFixed(1)}s to read its text @${CPS}cps)`);
    });
    results.push(R(slow.length === 0, sev, 'pacing.readingFloor', slow.length ? slow.join(' | ') : 'every scene readable'));
  }

  // mascot size cap — the mascot is a companion, never the background (canon v2.8)
  {
    const cap = zone.mascotMaxSize ?? 160;
    const big = [];
    (video.scenes || []).forEach((sc, i) => {
      if (sc.mascot && (sc.mascot.size ?? 160) > cap) big.push(`scene[${i}] size=${sc.mascot.size} > ${cap}`);
    });
    results.push(R(big.length === 0, canon.safeZone?.severity ?? 'blocker', 'mascot.sizeCap', big.length ? big.join(' | ') : `all mascots ≤ ${cap}px`));
  }

  // wordmark reveal — end-card wordmarkMotion must be founder-approved (canon v2.8 §5)
  if (canon.wordmark?.allowed) {
    const allowed = new Set(canon.wordmark.allowed.concat('fade')); // fade = engine default when unset
    const bad = [];
    (video.scenes || []).forEach((sc, i) => {
      const wm = sc.endCard?.wordmarkMotion;
      if (sc.endCard && wm && !allowed.has(wm)) bad.push(`scene[${i}] wordmarkMotion="${wm}" not in [${canon.wordmark.allowed.join(', ')}]`);
    });
    results.push(R(bad.length === 0, canon.wordmark.severity ?? 'blocker', 'wordmark.motion', bad.length ? bad.join(' | ') : 'approved reveal'));
  }

  // frame-0 cliff (proxy)
  {
    const fz = canon.frameZero;
    const s0 = (video.scenes || [])[0] || {};
    if (fz.requireFirstSceneVo) results.push(R(Boolean(s0.vo && s0.vo.trim()), fz.severity, 'frameZero.vo', s0.vo ? 'VO at frame 0' : 'scene[0] has no VO'));
    if (fz.requireFirstSceneInstant) results.push(R(s0.instant === true, fz.severity, 'frameZero.instant', s0.instant === true ? 'payoff instant' : 'scene[0] not instant (static hold risk)'));
  }

  // transition grammar (canon v1.12) — every scene's `transition` (when set) must be
  // one of the curated values in canon.transitions.allowed; an unknown value warns.
  {
    const tr = canon.transitions;
    if (tr && Array.isArray(tr.allowed)) {
      const allowed = new Set(tr.allowed);
      const bad = [];
      (video.scenes || []).forEach((sc, i) => {
        if (sc.transition != null && !allowed.has(sc.transition)) bad.push(`scene[${i}] transition="${sc.transition}"`);
      });
      results.push(R(bad.length === 0, tr.severity ?? 'warn', 'transitions',
        bad.length ? `${bad.join(', ')} not in allowed [${tr.allowed.join(', ')}]` : 'all transitions in the allowed grammar'));
    }
  }

  // video model shape (canon v1.12) — every video DEFAULTS to a standalone topic; a
  // series/part-N is the ALLOWED but FLAGGED exception (concept.json shape:"series").
  // A continuation's INTENT isn't reliably detectable from the data, so this never
  // blocks: it confirms an explicit `series` flag, else reminds that non-standalone
  // must be flagged. WARN severity (from canon.videoModel), reminder only.
  {
    const vm = canon.videoModel;
    if (vm) {
      const shape = concept?.shape;
      if (shape === 'series') {
        results.push(R(true, vm.severity ?? 'warn', 'videoModel.shape', 'concept.json flags shape:"series" — allowed flagged exception (noted)'));
      } else if (shape && shape !== vm.shapeDefault) {
        results.push(R(false, 'warn', 'videoModel.shape', `concept.json shape='${shape}' is not '${vm.shapeDefault}' or 'series' — flag a continuation as shape:"series"`));
      } else {
        results.push(R(true, vm.severity ?? 'warn', 'videoModel.shape', `shape='${shape ?? `${vm.shapeDefault} (default)`}' — reminder: a series/part-N must set concept.json shape:"series"`));
      }
    }
  }

  // ── report ──
  const fails = results.filter((r) => !r.ok);
  const blockers = fails.filter((r) => r.severity === 'blocker');
  const warns = fails.filter((r) => r.severity !== 'blocker');

  console.log(`\ncanon gate · ${brand.name} · ${args.slug} · spec v${canon.version}${hasMp4 ? '' : '  (no mp4 — structural checks only)'}\n`);
  for (const r of results) {
    const mark = r.ok ? 'ok  ' : r.severity === 'blocker' ? 'BLOCK' : 'warn ';
    console.log(`  [${mark}] ${r.name.padEnd(20)} ${r.detail}`);
  }
  console.log('');
  if (blockers.length) {
    console.log(`NO-GO — ${blockers.length} blocker(s), ${warns.length} warning(s). This video violates canon and must not ship.`);
    process.exit(1);
  }
  console.log(`GO — 0 blockers${warns.length ? `, ${warns.length} warning(s) to review` : ''}. Canon-clean.`);
};

main().catch((e) => {
  console.error('\n✖ canon gate error: ' + (e.message ?? e));
  process.exit(2);
});
