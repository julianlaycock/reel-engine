// Pure color utilities — NO color constants live here (design values come from
// '@tokens/tokens', generated from the canon by scripts/gen-tokens.mjs).

const h2 = (v: number): string => {
  let n = Math.round(v);
  if (n < 0) n = 0;
  if (n > 255) n = 255;
  return n.toString(16).padStart(2, '0');
};

// Per-channel RGB lerp between two #rrggbb hex strings (verbatim from reference).
export const hexLerp = (a: string, b: string, t: number): string => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + h2(pa[0] + (pb[0] - pa[0]) * t) + h2(pa[1] + (pb[1] - pa[1]) * t) + h2(pa[2] + (pb[2] - pa[2]) * t);
};
