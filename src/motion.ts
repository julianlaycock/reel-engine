// Shared motion tokens — the four easing curves + interp/sceneOp helpers, ported
// from the design reference (its Newton-Raphson `_bez` is equivalent to Remotion's
// Easing.bezier; both are the CSS cubic-bezier definition). STAGGER = 3 frames.
//
// The existing engine (animation.ts) keeps its own `ease` (same 0.16,1,0.3,1
// coefficients) — these are additive and only consumed by the new Doctrine scenes.
import {Easing, interpolate} from 'remotion';

export type Ease = (t: number) => number;

export const easeOutExpo: Ease = Easing.bezier(0.16, 1, 0.3, 1); // default entrance
export const easePhysical: Ease = Easing.bezier(0.15, 1.05, 0.2, 1.0); // the ONE hero overshoot
export const easeInOut: Ease = Easing.bezier(0.65, 0, 0.35, 1); // camera push / color-morph
export const easeIn: Ease = Easing.bezier(0.5, 0, 0.75, 0); // exits

export const STAGGER = 3;

// clamp + optional ease + lerp (verbatim behavior of the reference `interp`).
export const interp = (f: number, xr: [number, number], yr: [number, number], ease?: Ease): number => {
  const [f0, f1] = xr;
  const [v0, v1] = yr;
  if (f1 === f0) return f < f0 ? v0 : v1;
  return interpolate(f, [f0, f1], [v0, v1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });
};

// min(eased fade-in, eased fade-out) — the non-overlapping scene opacity envelope.
export const sceneOp = (f: number, i0: number, i1: number, o0: number, o1: number): number =>
  Math.min(interp(f, [i0, i1], [0, 1], easeOutExpo), interp(f, [o0, o1], [1, 0], easeIn));
