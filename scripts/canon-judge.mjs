#!/usr/bin/env node
// canon-judge.mjs — the SUBJECTIVE canon gate's compiler.
//
// check-canon.mjs enforces the measurable canon. This compiles the subjective rubric
// (canon/JUDGE-RUBRIC.md) + the rendered artifact (evenly-spaced frames + the VO script)
// into a single prompt for the canon-judge: an LLM that actually LOOKS at the frames and
// returns a structured GO/REVISE/NO-GO verdict grounded in the CURRENT canon. Deterministic
// prep only — the judgment is made by a Claude subagent given this prompt + the frames.
//
// Usage: node reel-engine/scripts/canon-judge.mjs --brand vektor --slug <slug> [--frames 8]
// Writes frames + PROMPT.md to <brand>/out/_qa/<slug>/judge/ and prints the prompt path.
import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {resolveBrand} from '../lib/brand.mjs';

const execFileP = promisify(execFile);
const require = createRequire(import.meta.url);
const YAML = require('js-yaml');

const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {frames: 8};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--brand' || a[i] === '-b') p.brand = a[++i];
    else if (a[i] === '--slug' || a[i] === '-s') p.slug = a[++i];
    else if (a[i] === '--frames' || a[i] === '-f') p.frames = Number(a[++i]);
  }
  if (!p.slug) throw new Error('Usage: canon-judge.mjs --brand <brand> --slug <slug> [--frames 8]');
  return p;
};

const ffprobeDuration = async (file) => {
  const {stdout} = await execFileP('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', file]);
  return Number(JSON.parse(stdout).format?.duration) || 0;
};

const main = async () => {
  const args = parseArgs();
  const brand = resolveBrand(args.brand);
  process.chdir(brand.brandRoot);

  const canon = YAML.load(fs.readFileSync(path.join('canon', 'canon.yml'), 'utf8'));
  if (!canon.judge?.rubric) throw new Error('canon.yml has no judge.rubric');
  const rubric = fs.readFileSync(canon.judge.rubric, 'utf8');

  const mp4 = path.join('out', `${args.slug}.mp4`);
  if (!fs.existsSync(mp4)) throw new Error(`no rendered video at ${mp4} — build first`);
  const script = (() => { try { return fs.readFileSync(path.join('data', args.slug, 'script.txt'), 'utf8').trim(); } catch { return '(no script.txt)'; } })();
  let isTranscript = false;
  try { const c = JSON.parse(fs.readFileSync(path.join('data', args.slug, 'concept.json'), 'utf8')); isTranscript = c.source_type === 'transcript' || c.transcript_verbatim === true; } catch { /* optional */ }

  const outDir = path.join('out', '_qa', args.slug, 'judge');
  fs.mkdirSync(outDir, {recursive: true});

  // Sample at SCENE MIDPOINTS from video.json (canon v2.8) — blind time-bins used
  // to land on cross-fades and miss whole beats (how a mascot-on-text frame passed).
  // One frame per scene, plus frame-0 and the final CTA frame; falls back to
  // evenly-spaced bins if video.json is missing. 810px wide (was 540 — too soft
  // to see margin overflow and small labels).
  const dur = await ffprobeDuration(mp4);
  let stamps = [];
  try {
    const vj = JSON.parse(fs.readFileSync(path.join('data', args.slug, 'video.json'), 'utf8'));
    const fps = vj.fps || 30;
    let acc = 0;
    for (const sc of vj.scenes || []) {
      const d = sc.durationInFrames || 0;
      stamps.push(+(((acc + d / 2) / fps)).toFixed(2)); // scene midpoint
      acc += d;
    }
    stamps.unshift(0.03); // frame-0 (the hook law's actual subject)
    stamps.push(+Math.max(0, dur - 0.4).toFixed(2)); // final CTA state
    stamps = [...new Set(stamps)].filter((t) => t >= 0 && t < dur).sort((a, b) => a - b);
  } catch {
    const n = Math.max(10, Math.min(16, args.frames));
    stamps = Array.from({length: n}, (_, i) => +((i + 0.5) * (dur - 0.3) / n).toFixed(2));
  }
  const frames = [];
  for (let i = 0; i < stamps.length; i += 1) {
    const f = path.join(outDir, `f${String(i + 1).padStart(2, '0')}.png`);
    await execFileP('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(stamps[i]), '-i', mp4, '-frames:v', '1', '-vf', 'scale=810:-1', f]);
    frames.push({path: f, t: stamps[i]});
  }

  const prompt = [
    `CANON JUDGE · ${brand.name} · ${args.slug} · rubric: canon/JUDGE-RUBRIC.md (spec v${canon.version})`,
    '',
    'You are the Vektor canon-judge. READ the frames listed below (in order) with the Read tool,',
    'and evaluate this video against the rubric — judge against THIS canon, not generic taste.',
    isTranscript
      ? 'This is a TRANSCRIPT-verbatim build: do NOT penalize the source\'s claims (FACTS-POLICY is overridden); DO judge dimension 8 (fidelity + brand adaptation).'
      : 'This is an original (non-transcript) build: skip dimension 8.',
    '',
    'Return STRICT JSON only:',
    '{ "verdict": "GO|REVISE|NO-GO",',
    '  "dimensions": [ {"name": "<dim>", "pass": true|false, "severity": "minor|major|critical", "note": "<short>"} ],',
    '  "fixes": ["<highest-impact fix>", "..."] }',
    'Verdict rule: NO-GO if any critical; REVISE if any major; else GO.',
    '',
    'MANDATORY PER-FRAME CHECKS (canon v2.8 — answer for EVERY frame, do not skim):',
    '- MARGINS: does ANY text/element touch or cross the platform safe-zone margins',
    '  (top 220 / bottom 500 / sides 150 / right 260 in the rail band y850-1600)? Frames are',
    `  810px wide → margins scale to top 92 / bottom 211 / sides 61 / rail-right 109 px. major+.`,
    '- MASCOT: does the mascot overlap ANY text, wordmark, logo, or data element? major+.',
    '- MASCOT SCALE: mid-scene mascot reads as a small companion; if it dominates the',
    '  composition or acts as the background anywhere (incl. the end-card), critical.',
    '- END-CARD: background must be the signal-blue field + on-topic ascii art — the mascot',
    '  or an off-topic blow-up as background is critical.',
    '- READABILITY: could a viewer actually read all on-screen text in the beat\'s duration',
    '  (scene times are in the frame list)? Flag any wall-of-text or flash-by beat.',
    '',
    '===== RUBRIC =====',
    rubric.trim(),
    '',
    '===== VO SCRIPT =====',
    script,
    '',
    '===== FRAMES (Read each, in order) =====',
    ...frames.map((f, i) => `frame ${i + 1} (t=${f.t}s): ${path.resolve(f.path)}`),
    '',
  ].join('\n');

  const promptPath = path.join(outDir, 'PROMPT.md');
  fs.writeFileSync(promptPath, prompt);
  process.stdout.write(prompt + `\n\n[canon-judge] ${frames.length} frames + prompt written to ${outDir}\n[canon-judge] spawn a judge subagent with the prompt above; it Reads the frames and returns the verdict JSON.\n`);
};

main().catch((e) => { console.error('\n✖ canon-judge error: ' + (e.message ?? e)); process.exit(2); });
