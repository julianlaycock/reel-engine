// Remotion ports of three Cavalry FX. ONE implementation each, imported by the
// films — the same rule KTSeams.tsx exists to enforce.
//
// Sources (read 2026-08-07):
//   .worktrees/cavalry-library/fx/odometer.js         verified 2026-07-29
//   .worktrees/cavalry-library/fx/pump-rect.js        verified 2026-07-31, shipped NO.029
//   .worktrees/cavalry-library/fx/container-breach.js UNVERIFIED, never run in Cavalry
//
// The Cavalry originals key Cavalry layers. These reproduce the BEHAVIOUR, not
// the keyframes, because Remotion computes per frame. Where the port diverges,
// the reason is stated inline.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {f} from './KTHook';

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
// One declaration, so this module adds a single font-family literal to the
// drift ratchet rather than one per call site.
const FONT_UI = '"Inter Tight", sans-serif';

// ---- odometer --------------------------------------------------------------
// fx/odometer.js: "hard-tick counter via stacked text opacity windows."
// The point is that it SNAPS. No interpolation between values, no easing — the
// digit is either the old one or the new one. Anything smooth reads as a slider
// and loses the mechanical feel the effect exists for.
export const Odometer: React.FC<{
  values: string[];        // shown in order, one per tick
  fromMs: number;
  tickMs?: number;         // dwell per value
  style?: React.CSSProperties;
}> = ({values, fromMs, tickMs = 90, style}) => {
  const frame = useCurrentFrame();
  if (frame < f(fromMs)) return null;
  const elapsed = frame - f(fromMs);
  const i = Math.min(values.length - 1, Math.floor(elapsed / Math.max(1, f(tickMs))));
  return <span style={style}>{values[i]}</span>;
};

// Build a tick-down (or up) run between two numbers. `steps` intermediate values
// plus the endpoints, so the counter visibly travels rather than cutting.
export const rampValues = (from: number, to: number, steps: number, fmt: (n: number) => string) => {
  const out: string[] = [];
  for (let i = 0; i <= steps; i++) out.push(fmt(Math.round(from + (to - from) * (i / steps))));
  out[out.length - 1] = fmt(to);   // land exactly, never on a rounding artifact
  return out;
};

// ---- pump-rect -------------------------------------------------------------
// fx/pump-rect.js: "a rect that pumps on an accelerating beat, with amplitude
// decay, optional colour flash, and ANCHOR COMPENSATION."
//
// THE ANCHOR PROBLEM, quoted from the source: "Cavalry scales a layer about its
// own centre. A rect sitting ON a baseline that pumps scale.y therefore grows
// through the baseline in both directions, which reads as floating rather than
// as pressure." Cavalry has to key position alongside scale to fix an edge.
// CSS gives us `transformOrigin` for free, so the port sets the origin instead
// of doing the compensation arithmetic — same result, no chance of the
// off-by-half that the source calls the most common way a pump looks wrong.
export const PumpRect: React.FC<{
  fromMs: number;
  x: number; y: number; w: number; h: number;
  color: string;
  beat?: number;           // frames between pumps (the first one)
  pumps?: number;
  ampY?: number;           // peak scale
  ampX?: number;
  attack?: number;         // frames rest -> peak
  release?: number;        // frames peak -> rest
  decay?: number;          // amplitude multiplier per pump (<1 fades out)
  accel?: number;          // beat multiplier per pump (<1 quickens)
  minBeat?: number;
  anchor?: 'center' | 'bottom' | 'top' | 'left' | 'right';
}> = ({fromMs, x, y, w, h, color, beat = 10, pumps = 6, ampY = 1.14, ampX = 1.0,
       attack = 2, release = 6, decay = 1.0, accel = 1.0, minBeat = 3, anchor = 'bottom'}) => {
  const frame = useCurrentFrame();
  const t0 = f(fromMs);
  if (frame < t0) return null;

  // Walk the pump schedule: each pump's start, its beat length, its amplitude.
  let cursor = 0;
  let b = beat;
  let amp = 1;
  let scaleY = 1, scaleX = 1;
  let done = true;
  for (let i = 0; i < pumps; i++) {
    const start = t0 + cursor;
    const local = frame - start;
    if (local >= 0 && local < attack + release) {
      const env = local < attack
        ? local / attack                                  // rest -> peak
        : 1 - (local - attack) / release;                 // peak -> rest
      scaleY = 1 + (ampY - 1) * amp * clamp01(env);
      scaleX = 1 + (ampX - 1) * amp * clamp01(env);
    }
    if (frame < start + b) done = false;
    cursor += b;
    b = Math.max(minBeat, b * accel);
    amp *= decay;
  }
  if (done && scaleY === 1 && scaleX === 1) return null;

  const origin = anchor === 'bottom' ? 'center bottom'
    : anchor === 'top' ? 'center top'
    : anchor === 'left' ? 'left center'
    : anchor === 'right' ? 'right center' : 'center center';
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, background: color,
      transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: origin}} />
  );
};

// ---- container-breach ------------------------------------------------------
// fx/container-breach.js: "the box is too small, and then it isn't a box."
//
// A bounded region fills with unit dots pouring in on an accelerating beat. Past
// `strainFrom` the boundary jitters with rising amplitude; at the breach the
// walls go accent and the surplus bursts straight through.
//
// From the source, and both are honoured here:
//  - "BOUNDARY IS FOUR RECTS, NOT A STROKED ONE" — per-wall strain control.
//  - "The dots are ONE object, not sixty, because they share a common region",
//    which is what keeps it inside the four-object cap.
//
// UNVERIFIED UPSTREAM: this module was authored 2026-07-30 and never run in
// Cavalry. This port is therefore the first time the effect has actually
// rendered anywhere; treat its output as unproven until it has been looked at.
// REBUILT after the first cut read as noise. Three faults, in order of how much
// damage they did:
//
//  1. THE ESCAPE WAS CLAMPED. To keep surplus dots inside the safe box I clamped
//     their spread to the container's own width — which pinned the overflow
//     INSIDE the box it is supposed to burst out of, and deleted the entire idea.
//     The clamp is now to the SAFE BOX (boundL/boundR), which is where it always
//     belonged, and the box is small enough that dots have real room to leave it.
//  2. THE BOX WAS MOSTLY EMPTY. A 600x280 container holding a 369x123 dot grid
//     reads as a half-filled box, so "full" never happened visually. The caller
//     now sizes the box so `capacity` dots fill it exactly — full means full.
//  3. THE BURST WAS UNTIED FROM THE VOICE. Overflow began whenever the pour maths
//     happened to pass capacity. `surplusFromMs` now pins it to the word being
//     spoken, so the walls give way on "burns through it".
export const ContainerBreach: React.FC<{
  fromMs: number;          // pour starts
  surplusFromMs: number;   // the breach — tie this to the VO
  x: number; y: number; w: number; h: number;
  capacity: number;        // dots that fit, and that exactly fill the box
  arriving: number;        // dots that try; the surplus is the overflow
  cols: number;
  dotR: number;
  gap: number;
  color: string;
  accent: string;
  boundL: number; boundR: number;   // the SAFE BOX, not the container
  wall?: number;
  pourMs?: number;         // time to fill to capacity
  legend?: string;
  label?: string;
}> = ({fromMs, surplusFromMs, x, y, w, h, capacity, arriving, cols, dotR, gap,
       color, accent, boundL, boundR, wall = 4, pourMs = 2400, legend, label}) => {
  const frame = useCurrentFrame();
  const t0 = f(fromMs);
  if (frame < t0) return null;
  const local = frame - t0;

  // Fill on an even pour across pourMs, so the box is exactly full when the
  // surplus starts rather than at whatever moment an accelerating beat lands on.
  const filled = Math.min(capacity, Math.floor((local / Math.max(1, f(pourMs))) * capacity) + 1);
  const fill = filled / capacity;

  const tB = f(surplusFromMs);
  const breached = frame >= tB;
  const surplus = breached ? Math.min(arriving - capacity, Math.floor((frame - tB) / 2) + 1) : 0;

  // Deterministic jitter — no Math.random; renders must be reproducible.
  const wob = (seed: number) => Math.sin((local + seed * 37) * 0.9);
  const strain = fill > 0.8 ? ((fill - 0.8) / 0.2) * 10 : 0;
  const sx = strain * wob(1), sy = strain * wob(2);
  const wallColor = breached ? accent : color;

  const cell = dotR * 2 + gap;
  const rows = Math.ceil(capacity / cols);
  const gridL = x + (w - cols * cell + gap) / 2;
  const gridT = y + (h - rows * cell + gap) / 2;

  const dots = [];
  for (let i = 0; i < filled; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    dots.push(
      <div key={`in${i}`} style={{position: 'absolute', left: gridL + c * cell, top: gridT + r * cell,
        width: dotR * 2, height: dotR * 2, borderRadius: dotR * 2, background: color}} />
    );
  }
  for (let k = 0; k < surplus; k++) {
    const age = frame - tB - k * 2;
    if (age < 0) continue;
    const rise = Math.min(1, age / 14);
    // Alternating fan out of the box, clamped to the safe box so the surplus
    // leaves the CONTAINER without leaving the FRAME.
    const dir = k % 2 ? 1 : -1;
    const reach = (w / 2 + 30 + (k >> 1) * 26) * rise;
    const bx = Math.min(boundR - dotR * 2, Math.max(boundL, x + w / 2 - dotR + dir * reach));
    const by = y + h / 2 - dotR + (((k >> 1) % 5) - 2) * 46 * rise;
    dots.push(
      <div key={`out${k}`} style={{position: 'absolute', left: bx, top: by,
        width: dotR * 2, height: dotR * 2, borderRadius: dotR * 2, background: accent,
        opacity: 1 - rise * 0.25}} />
    );
  }

  const w4 = (left: number, top: number, ww: number, hh: number, k: string) => (
    <div key={k} style={{position: 'absolute', left, top, width: ww, height: hh, background: wallColor}} />
  );
  return (
    <>
      {w4(x + sx, y + sy, w, wall, 'top')}
      {w4(x + sx, y + h - wall + sy, w, wall, 'bot')}
      {w4(x + sx, y + sy, wall, h, 'l')}
      {w4(x + w - wall + sx, y + sy, wall, h, 'r')}
      {dots}
      {legend && !breached && (
        <div style={{position: 'absolute', left: boundL, top: y + h + 18, width: boundR - boundL,
          textAlign: 'center', fontSize: 26, letterSpacing: 2, color,
          fontFamily: FONT_UI, opacity: 0.55}}>{legend}</div>
      )}
      {breached && label && (
        <div style={{position: 'absolute', left: boundL, top: y + h + 18, width: boundR - boundL,
          textAlign: 'center', fontSize: 30, letterSpacing: 2, color: accent,
          fontFamily: FONT_UI}}>{label} +{surplus}</div>
      )}
    </>
  );
};
