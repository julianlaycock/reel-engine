import {Easing, interpolate, spring} from 'remotion';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export const fadeRise = (frame: number, start: number, duration = 13) => {
  const progress = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * 28}px)`,
  };
};

export const drawX = (frame: number, start: number, duration = 12) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ease,
  });

export const pop = (frame: number, start: number, fps: number) => {
  const scale = spring({
    frame: frame - start,
    fps,
    config: {
      damping: 14,
      stiffness: 130,
      mass: 0.55,
    },
    durationInFrames: 14,
  });

  return {
    opacity: interpolate(frame, [start, start + 6], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    transform: `scale(${interpolate(scale, [0, 1], [0.92, 1])})`,
  };
};

export const accentPop = (frame: number, start: number) => {
  const local = frame - start;
  const scale = interpolate(
    local,
    [0, 6, 12, 18],
    [1, 1.06, 1.02, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    },
  );

  return `scale(${scale})`;
};

export const driftScale = (frame: number, duration: number) =>
  interpolate(frame, [0, Math.max(duration - 1, 1)], [1, 1.03], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

// === Vektor motion primitives (shared) ===

// Stagger helper: the start frame for the i-th element given a per-item delay.
export const stagger = (start: number, i: number, per = 2) => start + i * per;

// Eased count-up from `from`→`to` over a window. Pure function of frame.
export const countUp = (
  frame: number,
  start: number,
  durationFrames: number,
  to: number,
  from = 0,
) =>
  from +
  (to - from) *
    interpolate(frame, [start, start + durationFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: ease,
    });

// Spring entrance (scale + opacity) — the premium-timing primitive.
export const springIn = (frame: number, start: number, fps: number, from = 0.86) => {
  const s = spring({frame: frame - start, fps, config: {damping: 16, stiffness: 140, mass: 0.6}, durationInFrames: 16});
  return {
    opacity: interpolate(frame, [start, start + 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    transform: `scale(${interpolate(s, [0, 1], [from, 1])})`,
  };
};
