// ─────────────────────────────────────────────────────────────────────────────
// lp-motion.ts — letterpress (Vektor canon 2.0) hard-step motion recipes.
//
// THE LAW (letterpress-tokens.json #motion): HARD STEPS, NO EASING — values
// change discretely per frame; no interpolate() curves, no CSS animation.
// Every recipe is a pure function of the current frame (deterministic per
// Remotion frame capture). Spec: vektor/docs/letterpress-build-spec.md.
//
// FRAME-0 LAW + the restamp cycle: frame 0 of a scene is the FINISHED stack
// (the blank never happens on entry). Reveals re-stamp on the LAST beats of
// the scene: blank at ~88% of the scene, restamp staggered, settle before the
// cut. Renderers therefore feed recipes an EFFECTIVE frame (`effFrame`): before
// the restamp point it is "settled" (a huge value ⇒ every reveal reads done);
// after it, frames count from the blank so the reveal replays.
// ─────────────────────────────────────────────────────────────────────────────

// The restamp point — the blank at ~88% of the scene.
export const LP_RESTAMP_AT = 0.88;

export const restampStart = (durationInFrames: number): number =>
  Math.floor(durationInFrames * LP_RESTAMP_AT);

// A frame value every reveal recipe reads as "finished" (settled stack).
export const LP_SETTLED = 1_000_000;

// Effective reveal-frame for a scene frame: settled until the restamp point,
// then counting up from the blank (the reveal replays, staggered as authored).
export const effFrame = (frame: number, durationInFrames: number): number => {
  const r = restampStart(durationInFrames);
  return frame >= r ? frame - r : LP_SETTLED;
};

// stampIn(frame, i): element i visible from frame i*stagger — a 1-frame cut-in
// (opacity 0→1 in a single frame step, no fade). Stagger 4f.
export const stampIn = (frame: number, i: number, stagger = 4): number =>
  frame >= i * stagger ? 1 : 0;

// stampHit(frame, at): chip cuts in at `at` with scale 1.16→1.0 in ONE frame.
export const stampHit = (frame: number, at: number): {opacity: number; scale: number} => {
  if (frame < at) return {opacity: 0, scale: 1};
  return {opacity: 1, scale: frame === at ? 1.16 : 1};
};

// growSteps(frame, from, dur): 0→40%→75%→100% in 3 equal hard steps over `dur` (≈6f).
export const growSteps = (frame: number, from: number, dur = 6): number => {
  if (frame < from) return 0;
  const t = frame - from;
  if (t >= dur) return 1;
  const step = Math.min(2, Math.floor(t / (dur / 3)));
  return [0.4, 0.75, 1][step];
};

// odometerTicks(frame): 4 hard ticks over 12f (3f per tick) — returns the tick
// index 0..3 (one digit-height translateY per tick).
export const odometerTicks = (frame: number, from = 0): number =>
  Math.max(0, Math.min(3, Math.floor((frame - from) / 3)));

// invertPulse(frame, at): filter invert(1) for exactly 2 frames at `at`.
// MAX 2/reel — scene JSON opts in via `invertAt`.
export const invertPulse = (frame: number, at?: number): boolean =>
  at != null && frame >= at && frame < at + 2;

// xeroxJitter(frame): 4-position translate cycle at ~8fps (hold each 4 frames).
// Hook beat only, `jitter: true`.
const JITTER_CYCLE: Array<[number, number]> = [
  [-2, 1],
  [1, -2],
  [-1, -1],
  [0, 0],
];
export const xeroxJitter = (frame: number): {x: number; y: number} => {
  const [x, y] = JITTER_CYCLE[Math.floor(frame / 4) % 4];
  return {x, y};
};

// typeOn(frame, text, steps): prefix slice over `steps` (26) hard steps.
export const typeOn = (frame: number, text: string, steps = 26): string => {
  if (frame >= steps) return text;
  if (frame < 0) return '';
  return text.slice(0, Math.floor((text.length * frame) / steps));
};

// Block caret blink: 15 frames on / 15 off (frame-driven — CSS animation is banned).
export const caretBlink = (frame: number): number => (frame % 30 < 15 ? 1 : 0);

// hatchdrift — the ONLY ambient motion allowed: 6 steps / 3s (90f) background-
// position drift across one 16px hatch period.
export const hatchDrift = (frame: number): string => {
  const step = Math.floor((frame % 90) / 15);
  return `${Math.round((step * 16) / 6)}px 0px`;
};

// End-card marquee — the ONE linear motion: with the ticker text duplicated,
// a -50% translate of the inner run equals exactly one copy width, so the loop
// is seamless. Whole-percent-ish steps keep it deterministic per frame.
export const tickerX = (frame: number, loopFrames = 180): string => {
  const p = (frame % loopFrames) / loopFrames;
  return `${(-(p * 50)).toFixed(2)}%`;
};
