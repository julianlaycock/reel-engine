import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {AsciiFieldScene as AsciiFieldSceneType} from '../video-schema';
import '../style.css';

// Americana Cut — the ASCII field pass (locked v1.0, ported from the design
// handoff's ascii-field.ts). Pure + deterministic: same pixels + same opts →
// same cells. Frame-driven at ≤12fps cadence — the flicker IS the texture
// (motion law), so the grid re-renders on sampleKey, never via CSS animation.

interface AsciiOpts {
  cols?: number; // default 72  (cell 15px at 1080w)
  rows?: number; // default 106 (cell 18px at 1920h)
  gamma?: number; // fill curve, default 1.5
  edgeThreshold?: number; // Sobel magnitude cutoff, default 0.28
  glowThreshold?: number; // fill glow cutoff, default 0.62
  subjectBoost?: number; // non-field-color boost, default 2.6
}

interface AsciiCell {
  col: number;
  row: number;
  ch: string;
  isEdge: boolean; // edges render acid rgba(120,255,110,1) + full glow
  v: number; // 0..1 — fill color: rgba(25+v*70, 150+v*105, 32+v*28, 0.28+v*0.72)
}

const RAMP = '`.,:;!i1tfjLCG0Z8W%@#';

export function computeAsciiCells(img: ImageData, opts: AsciiOpts = {}): AsciiCell[] {
  const cols = opts.cols ?? 72,
    rows = opts.rows ?? 106;
  const gamma = opts.gamma ?? 1.5;
  const EDGE_T = opts.edgeThreshold ?? 0.28;
  const boost = opts.subjectBoost ?? 2.6;
  const N = cols * rows;
  if (img.width !== cols || img.height !== rows) throw new Error('sample the frame to cols×rows first');
  const d = img.data;

  // luminance + subject boost (orange/skin/kit tones pop vs field colors)
  const lum = new Float32Array(N);
  let mn = 1,
    mx = 0;
  for (let i = 0; i < N; i++) {
    const R = d[i * 4],
      G = d[i * 4 + 1],
      B = d[i * 4 + 2];
    let l = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
    const subject = Math.max(0, (R - Math.max(G, B)) / 255) * boost;
    l = Math.min(1, Math.max(l, subject));
    lum[i] = l;
    if (l < mn) mn = l;
    if (l > mx) mx = l;
  }
  const norm = new Float32Array(N);
  for (let i = 0; i < N; i++) norm[i] = (lum[i] - mn) / (mx - mn + 1e-6);

  // separable box blur (approx gaussian)
  const blur = (src: Float32Array, r: number): Float32Array => {
    const tmp = new Float32Array(N),
      dst = new Float32Array(N);
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        let s = 0,
          n = 0;
        for (let k = -r; k <= r; k++) {
          const xx = x + k;
          if (xx >= 0 && xx < cols) {
            s += src[y * cols + xx];
            n++;
          }
        }
        tmp[y * cols + x] = s / n;
      }
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        let s = 0,
          n = 0;
        for (let k = -r; k <= r; k++) {
          const yy = y + k;
          if (yy >= 0 && yy < rows) {
            s += tmp[yy * cols + x];
            n++;
          }
        }
        dst[y * cols + x] = s / n;
      }
    return dst;
  };

  // DoG contour emphasis + Sobel magnitude/angle
  const b1 = blur(norm, 1),
    b2 = blur(norm, 3);
  const dog = new Float32Array(N);
  for (let i = 0; i < N; i++) dog[i] = Math.max(0, (b1[i] - b2[i]) * 8);
  const mag = new Float32Array(N),
    ang = new Float32Array(N);
  for (let y = 1; y < rows - 1; y++)
    for (let x = 1; x < cols - 1; x++) {
      const i = y * cols + x;
      const gx = -b1[i - cols - 1] - 2 * b1[i - 1] - b1[i + cols - 1] + b1[i - cols + 1] + 2 * b1[i + 1] + b1[i + cols + 1];
      const gy = -b1[i - cols - 1] - 2 * b1[i - cols] - b1[i - cols + 1] + b1[i + cols - 1] + 2 * b1[i + cols] + b1[i + cols + 1];
      mag[i] = Math.sqrt(gx * gx + gy * gy) * (0.5 + dog[i]);
      ang[i] = Math.atan2(gy, gx);
    }

  const cells: AsciiCell[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const v = Math.pow(norm[i], gamma);
      const isEdge = mag[i] > EDGE_T;
      if (!isEdge && v < 0.02) continue;
      let ch: string;
      if (isEdge) {
        const a = ((ang[i] * 180) / Math.PI + 90 + 180) % 180;
        ch = a < 22.5 || a >= 157.5 ? '_' : a < 67.5 ? '/' : a < 112.5 ? '|' : '\\';
      } else {
        ch = RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))];
      }
      cells.push({col: c, row: r, ch, isEdge, v});
    }
  return cells;
}

// Deterministic integer hash → [0,1). Same inputs → same output on every render
// thread (Math.random is banned — frames render out of order across workers).
const hash01 = (a: number, b: number, c: number, d: number): number => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647 + d * 69069) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177) | 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
};

const COLS = 72;
const ROWS = 106;
const CELL_W = 15;
const CELL_H = 18;
const NOISE = '`.,:;!i1tfjLCG0Z8W%@#/\\|_';

// Logo motion — option C "decode" (spec §02·B): the wordmark letters churn as
// acid ascii noise, then resolve left→right in HARD steps. Plays ONCE (all
// activity inside the first ~2.3s of the scene), then holds forever. No easing.
const DecodeWordmark: React.FC<{text: string; frame: number; fps: number}> = ({text, frame, fps}) => {
  const step = Math.floor(frame / Math.max(1, Math.round(fps / 12))); // hard 12fps steps
  const chars = text.split('');
  const resolveSpan = Math.round(fps * 2.3); // all letters locked by 2.3s
  return (
    <div className="am-wordmark">
      {chars.map((ch, i) => {
        const lockAt = Math.round(((i + 1) / chars.length) * resolveSpan * 0.8) + Math.round(fps * 0.3);
        const locked = frame >= lockAt;
        if (locked || ch === ' ') return <span key={i}>{ch}</span>;
        const g = NOISE[Math.floor(hash01(i, step, 7, 13) * NOISE.length)];
        return (
          <span key={i} className="am-wordmark-noise">
            {g}
          </span>
        );
      })}
      {/* founder 2026-07-04: no caret on the americana end-card — the wordmark
          stands fully alone (overrides the tokens' "solid caret" note). */}
    </div>
  );
};

export const AsciiFieldScene: React.FC<{scene: AsciiFieldSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgData, setImgData] = useState<ImageData | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const seed = scene.seed ?? 7;

  // Load + downsample the source once; delayRender holds the frame until the
  // pixels exist (Remotion renders headless — no progressive image decode).
  useEffect(() => {
    const handle = delayRender('asciiField source ' + scene.src);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = COLS;
      c.height = ROWS;
      const ctx = c.getContext('2d', {willReadFrequently: true})!;
      // cover-crop the source into the 72×106 grid so the subject fills the field
      const sAsp = img.width / img.height;
      const dAsp = COLS / ROWS;
      let sw = img.width,
        sh = img.height,
        sx = 0,
        sy = 0;
      if (sAsp > dAsp) {
        sw = img.height * dAsp;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / dAsp;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, COLS, ROWS);
      setImgData(ctx.getImageData(0, 0, COLS, ROWS));
      setImgUrl(img.src);
      continueRender(handle);
    };
    img.onerror = () => continueRender(handle);
    img.src = staticFile(scene.src);
  }, [scene.src]);

  const cells = useMemo(() => (imgData ? computeAsciiCells(imgData) : []), [imgData]);

  // ≤12fps cadence: the grid only re-draws when sampleKey changes; per-key jitter
  // (deterministic) drops/dims a small fraction of cells — the locked shimmer.
  const sampleKey = Math.floor(frame / Math.max(1, Math.round(fps / 12)));
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 1080, 1920);
    ctx.font = '600 16px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const cell of cells) {
      const j = hash01(cell.col, cell.row, sampleKey, seed);
      if (j < 0.06) continue; // ~6% of cells blink out per sample — the shimmer
      const flick = j > 0.94 ? 0.55 : 1; // a few dim instead of dropping
      const x = cell.col * CELL_W + CELL_W / 2;
      const y = cell.row * CELL_H + CELL_H / 2;
      if (cell.isEdge) {
        ctx.shadowColor = 'rgba(120,255,110,0.9)';
        ctx.shadowBlur = 9;
        ctx.fillStyle = `rgba(120,255,110,${flick})`;
      } else {
        const glow = cell.v > 0.62;
        ctx.shadowColor = glow ? 'rgba(120,255,110,0.55)' : 'transparent';
        ctx.shadowBlur = glow ? 7 : 0;
        const r = Math.round(25 + cell.v * 70);
        const g = Math.round(150 + cell.v * 105);
        const b = Math.round(32 + cell.v * 28);
        ctx.fillStyle = `rgba(${r},${g},${b},${(0.28 + cell.v * 0.72) * flick})`;
      }
      ctx.fillText(cell.ch, x, y);
    }
  }, [cells, sampleKey, seed]);

  // Hard-step reveals (motion law: chips cut in 1 frame, no easing).
  const showHeadline = frame >= Math.round(fps * 0.27);
  const showMeta = frame >= Math.round(fps * 0.67);
  const showCredit = frame >= Math.round(fps * 0.5);
  const ec = scene.endCard;
  // ASCII/type separation law (canon v1.8-3, 2026-07-05): `"split": true` confines the
  // ascii art to the upper band so headline/meta in .am-dark-stage never sit on the art.
  const split = Boolean((scene as {split?: boolean}).split);
  // `pre: true` (canon v2.2b, 2026-07-05): src is a PRE-RENDERED, TRANSPARENT ascii-art asset
  // from scripts/ascii-gen.mjs — glowing glyphs only. The scene owns the uniform background +
  // CRT scanlines, so the art composites seamlessly (no darker rectangle). No blurred ghost.
  const pre = Boolean((scene as {pre?: boolean}).pre);

  // Opt-in additive motion for `pre` ascii assets (canon v1.8, 2026-07-06): a
  // one-time "scan-in" wipe (~0.5s) plus a gentle continuous glow-pulse. Fully
  // deterministic — driven only by useCurrentFrame (no Math.random; frames
  // render out of order across workers). Gated on scene.motion === 'reveal', so
  // every existing video (no motion prop) renders exactly as before.
  const reveal = (scene as {motion?: 'reveal'}).motion === 'reveal';
  const revealFrames = Math.max(1, Math.round(fps * 0.5));
  const revealP = reveal ? Math.min(1, frame / revealFrames) : 1;
  const pulse = reveal ? 0.5 + 0.5 * Math.sin((frame / Math.max(1, fps)) * Math.PI * 1.6) : 0;
  const preMotionStyle: React.CSSProperties = reveal
    ? {
        clipPath: `inset(0 0 ${(1 - revealP) * 100}% 0)`,
        WebkitClipPath: `inset(0 0 ${(1 - revealP) * 100}% 0)`,
        opacity: 0.35 + revealP * 0.65,
        filter: `drop-shadow(0 0 ${6 + pulse * 12}px rgba(57,255,53,${0.35 + pulse * 0.4}))`,
      }
    : {};

  return (
    <AbsoluteFill className="am-ascii-scene">
      {/* signal-blue gradient + (non-pre only) blurred source ghost + veil */}
      <AbsoluteFill style={{background: 'linear-gradient(165deg,#1B4FA0 0%,#2B6BC4 60%,#153A78 100%)'}} />
      {imgUrl && !pre ? (
        <AbsoluteFill style={{opacity: 0.28, filter: 'blur(26px)'}}>
          <img src={imgUrl} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: 'rgba(10,26,70,0.45)'}} />
      {pre ? (
        // Remotion <Img> holds the frame until the asset is fully decoded — no
        // progressive top-down pop-in at the scene cut (canon v2.2b transition fix).
        <Img
          src={staticFile(scene.src)}
          style={{position: 'absolute', ...(scene.imgBox ?? {top: 300, left: 0, width: 1080, height: 700}), objectFit: 'contain', ...preMotionStyle}}
        />
      ) : (
        <canvas ref={canvasRef} width={1080} height={1920} style={{position: 'absolute', inset: 0, ...(split ? {transform: 'translateY(-60px) scale(0.62)', transformOrigin: 'top center'} : {})}} />
      )}
      {scene.veil ? <AbsoluteFill style={{background: `rgba(10,26,70,${scene.veil})`}} /> : null}
      {/* CRT scanlines — full-scene (uniform), behind text. Canon v2.2b: the CRT treatment
          belongs to the whole frame, not the ascii rectangle. */}
      {pre ? <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.13) 0px, rgba(0,0,0,0.13) 1px, transparent 1px, transparent 3px)', pointerEvents: 'none'}} /> : null}

      {scene.jacquardWord ? <div className="am-jacquard">{scene.jacquardWord}</div> : null}

      {ec ? (
        <div className="am-endcard">
          {ec.wordmark ? <DecodeWordmark text={ec.wordmark} frame={frame} fps={fps} /> : null}
          {ec.cta && frame >= Math.round(fps * 2.3) ? <div className="am-cta">{ec.cta}</div> : null}
          {ec.issue ? <div className="am-credit">{ec.issue}</div> : null}
        </div>
      ) : (
        <div className="am-dark-stage">
          {scene.headline && showHeadline ? <div className="am-dark-headline">{scene.headline}</div> : null}
          {scene.meta && showMeta ? <div className="am-dark-meta">{scene.meta}</div> : null}
        </div>
      )}
      {scene.credit && showCredit ? <div className="am-credit">{scene.credit}</div> : null}
    </AbsoluteFill>
  );
};
