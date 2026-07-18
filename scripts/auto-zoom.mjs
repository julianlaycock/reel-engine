#!/usr/bin/env node
// auto-zoom.mjs — AI narration-synced cinematic zoom for screen scenes (Mode 1,
// founder-approved 2026-07-18). For each kind:'screen' scene in a video.json, it
// extracts sample frames from the recording, hands them + the scene's narration
// (with timing) to headless Claude vision, and injects the returned zoom
// keyframes (the `zooms` the ScreenScene renders). The zoom then follows what the
// voiceover is talking about, moment to moment.
//
// Usage:
//   node scripts/auto-zoom.mjs --slug <slug>            # dry-run: print the zooms
//   node scripts/auto-zoom.mjs --slug <slug> --commit   # write them into video.json
//
// Narration source, in order of preference: data/<slug>/captions.json (word
// timings → precise per-beat sync), else the scene's `vo` field (text only). With
// no narration it falls back to recording-only guidance (still useful).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {resolveBrand} from '../lib/brand.mjs';

const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const slug = getArg('--slug');
const brandName = getArg('--brand');
const commit = args.includes('--commit');
const FRAMES = Number(getArg('--frames') || 11); // sample frames per scene
if (!slug) { console.error('usage: auto-zoom.mjs --slug <slug> [--brand <b>] [--commit]'); process.exit(2); }

const brand = resolveBrand(brandName);
const root = brand.brandRoot;
const videoPath = path.join(root, 'data', slug, 'video.json');
if (!fs.existsSync(videoPath)) { console.error(`no ${path.relative(root, videoPath)}`); process.exit(2); }
const video = JSON.parse(fs.readFileSync(videoPath, 'utf8'));
const fps = video.fps || 30;

// captions.json (optional): [{text,startMs,endMs}] absolute across the whole video.
let captions = null;
const capPath = path.join(root, 'data', slug, 'captions.json');
if (fs.existsSync(capPath)) {
  try {
    const c = JSON.parse(fs.readFileSync(capPath, 'utf8'));
    captions = Array.isArray(c) ? c : c.words || null;
  } catch { /* ignore malformed */ }
}

// Resolve the claude binary the same way the dashboard does (the npm .cmd shim
// isn't spawnable without a shell — use the packaged exe on Windows).
const claudeBin = () => {
  if (process.platform === 'win32') {
    const exe = path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return 'claude';
};

const ffmpegFrame = (src, timeSec, out) => {
  execFileSync('ffmpeg', ['-y', '-ss', timeSec.toFixed(3), '-i', src, '-frames:v', '1', '-q:v', '3', out], { stdio: 'ignore' });
};

// Pull the first JSON array out of a claude text response.
const extractZooms = (text) => {
  const m = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (!m) throw new Error('no JSON array in claude output');
  return JSON.parse(m[0]);
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const validateZooms = (z, dur) => {
  if (!Array.isArray(z) || z.length < 2) throw new Error('need >=2 keyframes');
  const clean = z.map((k) => ({
    at: clamp(Math.round(k.at), 0, dur),
    scale: clamp(Number(k.scale), 1, 2),
    xPct: clamp(Number(k.xPct), 0, 100),
    yPct: clamp(Number(k.yPct), 0, 100),
  })).sort((a, b) => a.at - b.at);
  clean[0].at = 0; // interpolate() requires a keyframe at the scene start
  clean[clean.length - 1].at = dur; // ...and at the end
  // strictly-increasing frames (interpolate throws on duplicates)
  for (let i = 1; i < clean.length; i += 1) if (clean[i].at <= clean[i - 1].at) clean[i].at = clean[i - 1].at + 1;
  return clean;
};

let changed = 0;
let cumStart = 0; // scene start frame, accumulated
for (let i = 0; i < (video.scenes || []).length; i += 1) {
  const scene = video.scenes[i];
  const dur = scene.durationInFrames || 0;
  const sceneStart = cumStart;
  cumStart += dur;
  if (scene.kind !== 'screen') continue;
  if (!scene.src) { console.error(`scenes[${i}]: screen scene has no src — skipping`); continue; }

  const src = path.join(root, 'public', scene.src.replace(/^\//, ''));
  if (!fs.existsSync(src)) { console.error(`scenes[${i}]: recording not found: ${scene.src} — skipping`); continue; }
  const startSec = (scene.startFromMs || 0) / 1000;

  // Sample frames evenly across the scene, labelled by scene-frame.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'autozoom-'));
  const sceneFrames = [];
  for (let f = 0; f < FRAMES; f += 1) {
    const at = Math.round((dur * f) / (FRAMES - 1));
    const t = startSec + at / fps;
    const out = path.join(tmp, `f${String(at).padStart(4, '0')}.png`);
    ffmpegFrame(src, t, out);
    sceneFrames.push({ at, t, out });
  }

  // Narration window: absolute ms of this scene, collect captions inside it and
  // re-base to scene frames; else the scene's vo text; else recording-only.
  let narration = '';
  const winStartMs = (sceneStart / fps) * 1000;
  const winEndMs = ((sceneStart + dur) / fps) * 1000;
  if (captions) {
    const inWin = captions.filter((w) => w.startMs != null && w.startMs < winEndMs && (w.endMs ?? w.startMs) > winStartMs);
    if (inWin.length) {
      narration = inWin.map((w) => {
        const relFrame = Math.round(((w.startMs - winStartMs) / 1000) * fps);
        return `[f${clamp(relFrame, 0, dur)}] ${w.text}`;
      }).join(' ');
    }
  }
  if (!narration && typeof scene.vo === 'string') narration = scene.vo;

  const frameList = sceneFrames.map((s) => `  ${path.basename(s.out)} = scene frame ${s.at} (${(s.at / fps).toFixed(1)}s)`).join('\n');
  const narrBlock = narration
    ? `THE NARRATION over this scene (voiceover; [fN] marks the scene-frame each word lands on):\n${narration}\n\nZoom to the region the narration is talking about at each moment.`
    : `No narration available — zoom to the most important visual action at each moment (new text, results, focus).`;

  const prompt = [
    'You are an AI video editor generating cinematic auto-zoom keyframes for a screen recording that plays FULL-BLEED in a vertical (portrait) short-form video.',
    `Read these ${FRAMES} frames IN ORDER from ${tmp} (each labelled with its scene-frame, 0..${dur} @${fps}fps):`,
    frameList,
    '',
    narrBlock,
    '',
    'COORDINATE CONSTRAINTS (full-bleed portrait crops the left/right edges of a landscape source):',
    '- focal xPct must stay between 40 and 60 (only the horizontal center is visible).',
    '- yPct 0-100 is your main lever: pick WHICH VERTICAL PART of the recording to focus as the action/narration moves.',
    '- scale 1.0 (full) to 2.0 max.',
    '',
    `Output ONLY a JSON array of 5-7 keyframes, smooth arc, first at:0 and last at:${dur}:`,
    '[{"at":0,"scale":1.0,"xPct":50,"yPct":50}, ...]',
    'No prose, no code fences — just the JSON array.',
  ].join('\n');

  process.stderr.write(`\n  scenes[${i}] screen · ${scene.src} · ${dur}f · narration:${narration ? 'yes' : 'none'} — asking claude...\n`);
  const res = spawnSync(claudeBin(), ['-p', prompt, '--permission-mode', 'acceptEdits', '--output-format', 'text'], {
    encoding: 'utf8', maxBuffer: 1 << 26,
  });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (res.status !== 0) { console.error(`  claude failed (status ${res.status}): ${(res.stderr || '').slice(0, 400)}`); continue; }

  let zooms;
  try { zooms = validateZooms(extractZooms(res.stdout || ''), dur); }
  catch (e) { console.error(`  could not parse zooms: ${e.message}\n  ---\n${(res.stdout || '').slice(0, 500)}`); continue; }

  console.log(`\n  scenes[${i}] zooms (${zooms.length} keyframes):`);
  console.log('  ' + JSON.stringify(zooms));
  scene.zooms = zooms;
  changed += 1;
}

if (!changed) { console.error('\n  no screen scenes updated.'); process.exit(1); }
if (!commit) { console.log('\n  dry-run — pass --commit to write video.json.\n'); process.exit(0); }
fs.writeFileSync(videoPath, JSON.stringify(video, null, 2) + '\n');
console.log(`\n  ✓ committed — ${changed} screen scene(s) updated in ${path.relative(root, videoPath)}\n`);
