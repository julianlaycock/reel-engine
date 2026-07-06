#!/usr/bin/env node
// Deterministic objective measurement of a rendered video — the technical gate
// of the revision skill. Emits a JSON metrics block (+ pass/fail on hard gates)
// to stdout. No LLM, no judgement: just numbers ffmpeg/ffprobe can prove.
//
// Usage: node scripts/qa-measure.mjs out/<slug>.mp4
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const execFileP = promisify(execFile);
const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/qa-measure.mjs <video.mp4>');
  process.exit(1);
}

const ff = async (args) => {
  try {
    const {stdout, stderr} = await execFileP('ffmpeg', ['-hide_banner', '-nostats', ...args], {maxBuffer: 1 << 26});
    return `${stdout}\n${stderr}`;
  } catch (e) {
    return `${e.stdout || ''}\n${e.stderr || ''}`;
  }
};

const probe = async (args) => {
  const {stdout} = await execFileP('ffprobe', ['-v', 'error', ...args], {maxBuffer: 1 << 26});
  return stdout.trim();
};

const num = (re, s, i = 1) => {
  const m = s.match(re);
  return m ? parseFloat(m[i]) : null;
};

const main = async () => {
  // --- specs ---
  const v = await probe(['-select_streams', 'v:0', '-show_entries', 'stream=width,height,avg_frame_rate,codec_name', '-of', 'default=noprint_wrappers=1', src]);
  const dur = parseFloat(await probe(['-show_entries', 'format=duration', '-of', 'csv=p=0', src]));
  const width = num(/width=(\d+)/, v);
  const height = num(/height=(\d+)/, v);
  const fr = v.match(/avg_frame_rate=(\d+)\/(\d+)/);
  const fps = fr ? Math.round((+fr[1] / +fr[2]) * 100) / 100 : null;

  // --- audio presence ---
  const a = await probe(['-select_streams', 'a:0', '-show_entries', 'stream=codec_name,channels,sample_rate', '-of', 'default=noprint_wrappers=1', src]).catch(() => '');
  const hasAudio = /codec_name=/.test(a);

  // --- loudness (EBU R128) ---
  // Parse the final Summary block. Per-frame lines ALSO contain "I:" / "LRA:" /
  // "Peak:" (momentary, e.g. -70 at silent starts), so anchor on the summary
  // labels; fall back to the last per-frame match if the summary isn't present.
  const eb = await ff(['-i', src, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const last = (re) => {
    const m = [...eb.matchAll(re)];
    return m.length ? parseFloat(m[m.length - 1][1]) : null;
  };
  const I = num(/Integrated loudness:[\s\S]*?I:\s*(-?[\d.]+)/, eb) ?? last(/I:\s*(-?[\d.]+)\s*LUFS/g);
  const LRA = num(/Loudness range:[\s\S]*?LRA:\s*(-?[\d.]+)/, eb) ?? last(/LRA:\s*(-?[\d.]+)\s*LU/g);
  const truePeak = num(/True peak:[\s\S]*?Peak:\s*(-?[\d.]+)/, eb) ?? last(/Peak:\s*(-?[\d.]+)\s*dBFS/g);

  // --- black / freeze (in-body anomalies) ---
  const black = await ff(['-i', src, '-vf', 'blackdetect=d=0.1:pic_th=0.98', '-an', '-f', 'null', '-']);
  const blackStarts = [...black.matchAll(/black_start:([\d.]+)/g)].map((m) => +m[1]);
  const freeze = await ff(['-i', src, '-vf', 'freezedetect=n=-60dB:d=1.5', '-an', '-f', 'null', '-']);
  const freezeDurs = [...freeze.matchAll(/freeze_duration:([\d.]+)/g)].map((m) => +m[1]);

  // --- first-word onset (first non-silent audio) ---
  const sil = await ff(['-i', src, '-af', 'silencedetect=noise=-30dB:d=0.4', '-f', 'null', '-']);
  const firstEnd = num(/silence_end:\s*([\d.]+)/, sil);
  const startsSilent = /silence_start:\s*0(\.0+)?\b/.test(sil) || /silence_start:\s*-0/.test(sil);
  const onset = startsSilent ? firstEnd ?? 0 : 0;

  // --- pacing: scene cuts + max static stretch ---
  const sc = await ff(['-i', src, '-vf', 'scdet=threshold=10,metadata=print', '-an', '-f', 'null', '-']);
  let cuts = [...sc.matchAll(/lavfi\.scd\.time=([\d.]+)/g)].map((m) => +m[1]).sort((x, y) => x - y);
  const pts = [0, ...cuts, dur];
  let maxStatic = 0;
  for (let i = 1; i < pts.length; i += 1) maxStatic = Math.max(maxStatic, pts[i] - pts[i - 1]);

  // --- hard gates ---
  const gates = {
    resolution: width === 1080 && height === 1920,
    audioPresent: hasAudio,
    loudnessOk: I != null && Math.abs(I + 14) <= 1.5,
    truePeakOk: truePeak != null && truePeak <= -1.0,
    noFreeze: !freezeDurs.some((d) => d > 1.5),
    hookOnsetOk: onset <= 1.0,
    durationSane: dur >= 12 && dur <= 125, // flagship deep master ~120s per canon/CANON.md (canonical breakdown shipped at 103.8s)
  };
  const pass = Object.values(gates).every(Boolean);

  const out = {
    file: src,
    specs: {width, height, fps, durationSec: Math.round(dur * 10) / 10, vcodec: v.match(/codec_name=(\w+)/)?.[1] || null},
    audio: {present: hasAudio, I_LUFS: I, LRA, truePeak_dBFS: truePeak},
    anomalies: {blackStarts, freezeDurations: freezeDurs},
    pacing: {sceneCuts: cuts.length, avgIntervalSec: cuts.length ? Math.round((dur / cuts.length) * 10) / 10 : dur, maxStaticStretchSec: Math.round(maxStatic * 10) / 10},
    hook: {firstWordOnsetSec: Math.round(onset * 100) / 100},
    gates,
    pass,
  };
  console.log(JSON.stringify(out, null, 2));
};

main().catch((e) => {
  console.error(String(e.message || e));
  process.exit(1);
});
