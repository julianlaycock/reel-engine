// Shared seam grammar for the KT films — ONE implementation of each approved
// treatment, imported by every film that uses it.
//
// WHY THIS FILE EXISTS. Both effects below were already ported into KTState.tsx
// and shipped (matte-wipe in NO. 030 / 031, zigzag-marquee in NO. 026). NO. 027
// then grew a hand-rolled polyline called "ZigzagFunnel" that did neither job,
// which is exactly the failure the Approval Protocol names: a parallel copy under
// an approved name, shipping something the founder never signed off. The fix is
// one implementation here, parameterised, with the look-alike deleted.
//
// Source of truth for both is the Cavalry FX library:
//   .worktrees/cavalry-library/fx/matte-wipe.js      (verified 2026-07-29)
//   .worktrees/cavalry-library/fx/zigzag-marquee.js  (verified 2026-07-29)
// The constants below are those files' reference values. Do not tune them here
// without going back to the FX source and its goldens.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {f} from './KTHook';

const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// fx/matte-wipe.js reference values. The accents sweep right-to-left THROUGH the
// frame; the main panel follows and STOPS at x 0, becoming the new field. That is
// why this is the field flip rather than decoration over it: the incoming colour
// arrives on the panel.
export const MW = {park: 3000, through: -3000, mainFrom: 2800, sweep: 16, a2: 3, mainDelay: 6, mainDur: 12};

// Transition mode (textA null in the FX source): the wipe train only, no text and
// no swap keys. "This is the form to use at a beat boundary, where there is no
// text to swap because the two sides live in different comps." — fx/matte-wipe.js
export const MatteWipe: React.FC<{
  atMs: number;            // the frame the incoming field takes over
  accent1: string;         // leading follower
  accent2: string;         // second follower, offset by MW.a2
  main: string;            // the INCOMING field colour — this panel stops at x 0
  accent2Border?: string;
}> = ({atMs, accent1, accent2, main, accent2Border}) => {
  const frame = useCurrentFrame();
  // The train starts early so the main panel lands exactly on atMs.
  const T0 = f(atMs) - MW.sweep;
  if (frame < T0 || frame >= T0 + 22) return null;
  const pos = (delay: number, fromX: number, toX: number, dur: number) => {
    const x = Math.min(1, Math.max(0, (frame - T0 - delay) / dur));
    return fromX + (toX - fromX) * easeIO(x);
  };
  const panel = (x: number, color: string, key: string, border?: string) => (
    <div key={key} style={{position: 'absolute', width: 2600, height: 2400, borderRadius: 400,
      left: 540 - 1300 + x, top: 960 - 1200, background: color,
      border: border ? `4px solid ${border}` : undefined}} />
  );
  return (
    <AbsoluteFill style={{overflow: 'hidden', zIndex: 5}}>
      {panel(pos(0, MW.park, MW.through, MW.sweep), accent1, 'a1')}
      {panel(pos(MW.a2, MW.park, MW.through, MW.sweep), accent2, 'a2', accent2Border)}
      {panel(pos(MW.mainDelay, MW.mainFrom, 0, MW.mainDur), main, 'main')}
    </AbsoluteFill>
  );
};

// Triangle wave, period 1, range [-1,1] — fx/zigzag-marquee.js.
const ztri = (u: number) => { const w = u - Math.floor(u); return w < 0.5 ? 4 * w - 1 : 3 - 4 * w; };

// fx/zigzag-marquee.js. A stack of repeated-word rows x-offset by a triangle wave
// over row index, so the stack folds into a crease that travels down the canvas.
// Edge bleed is intentional.
//
// THE LAW, quoted from the FX source, because the first build failed on it:
//   "the x-offset delta between ADJACENT rows on the triangle flank is
//    amp*4/period. That rowDelta MUST stay below the inter-word gap width of the
//    unit string, otherwise adjacent rows shear a word past its neighbour's gap
//    and the crease reads as torn columns instead of a folded ribbon."
// Reference amp 260 / period 13 gives rowDelta 80px against the DOUBLE-space gap
// of "VEKTOR  " at fontSize 150. The unit's trailing double space is load-bearing;
// a single space violates the law. Defaults here are the reference values.
export const ZigzagMarquee: React.FC<{
  fromMs: number;
  unit: string;            // MUST end in two spaces — see the law above
  color: string;
  amp?: number;
  period?: number;
  rows?: number;
  rowH?: number;
  fontSize?: number;
  dur?: number;            // frames for one full travel
  topOffset?: number;
  reps?: number;
}> = ({fromMs, unit, color, amp = 260, period = 13, rows = 14, rowH = 136,
       fontSize = 150, dur = 75, topOffset = -24, reps = 6}) => {
  const frame = useCurrentFrame();
  if (frame < f(fromMs)) return null;
  const t = frame - f(fromMs);
  const rowDelta = (amp * 4) / period;
  if (rowDelta >= fontSize * 0.62) {
    // Cheap guard on the law. A double space plus letterSpacing at fontSize 150
    // measures ~96px; 0.62em is a conservative stand-in for that gap so a bad
    // amp/period pair fails loudly in the studio instead of shearing on render.
    console.warn(`ZigzagMarquee: rowDelta ${rowDelta.toFixed(0)}px may exceed the unit gap — see fx/zigzag-marquee.js LAW`);
  }
  const line = unit.repeat(reps);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {Array.from({length: rows}, (_, ri) => (
        <div key={ri} style={{position: 'absolute', whiteSpace: 'nowrap', top: ri * rowH + topOffset,
          left: -700 + amp * ztri(ri / period - t / dur), fontSize, letterSpacing: 8,
          color, fontFamily: '"Printvetica", sans-serif'}}>
          {line}
        </div>
      ))}
    </AbsoluteFill>
  );
};
