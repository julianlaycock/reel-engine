// Vetted mascot slots per scene kind (2026-07-08) — placement is STRUCTURAL:
// authoring picks a slot, the gate enforces it, and ClaudeMascot warns when a
// hand-set position drifts >8pct from every vetted slot for its scene kind.
//
// Dependency-free by design (plain data + pure functions) so node scripts
// (check-canon / gates) can import it without pulling React/Remotion.
//
// Derivation (1080×1920, platform safe zone: top 220 / bottom 500 / sides 150 /
// right rail 260 in the y 850–1600 band — canon/VIDEO-STANDARD.md v1.1):
// - sprite center x must keep left edge ≥150 → xPct ≥ (150 + size/2)/1080
// - bottom edge (center + size/2 + legs ≈ center + 0.85·size) must stay ≤1420
// - right edge must stay ≤820 inside the rail band
// - slots avoid each scene's text real estate:
//   editorial  → headline top / panel center (.ed-stage pads 360/150/560) → lower corners
//   versus     → centered rows, 150px side pads → lower corners below the rows
//   asciiField → jacquard top-left (y≈372+), .am-dark-stage headline lower-LEFT
//                (bottom 560) → the proven dash spot lower-center-right, alt lower-left
//   photostat  → photo center, stat/caption lower-center → lower corners
//   endCard    → wordmark+CTA centered column (~y 900–1100) → below-CTA center,
//                alt lower-left (yPct 69 not 72: 72 puts the leg row past the
//                bottom-500 line at any useful size — 69 is the deepest safe row)

export type MascotSlot = {xPct: number; yPct: number; maxSize: number};

// v2 SYNC (wireframe contract v2, founder 2026-07-08 — wireframes.json LEADS,
// this file mirrors it): light kinds moved up to yPct 62 so the sprite's leg
// row clears the always-on footer band (y1380); asciiField slots moved to the
// strip BETWEEN jacquard and headline (yPct 33) so the sprite can NEVER cover
// the headline/credit words (founder catch 05).
export const MASCOT_SLOTS: Record<string, MascotSlot[]> = {
  editorial: [
    {xPct: 20, yPct: 62, maxSize: 132}, // lower-left, under the panel column
    {xPct: 58, yPct: 62, maxSize: 132}, // lower-right, clear of the rail band
  ],
  versus: [
    {xPct: 22, yPct: 62, maxSize: 120}, // lower-left, below the versus rows
    {xPct: 60, yPct: 62, maxSize: 120}, // lower-right, inside the rail limit
  ],
  asciiField: [
    {xPct: 72, yPct: 33, maxSize: 120}, // right of the jacquard, above the headline
    {xPct: 28, yPct: 33, maxSize: 110}, // left alt (only when no jacquard word)
  ],
  photostat: [
    {xPct: 22, yPct: 63, maxSize: 120}, // lower-left, clear of the stat block
    {xPct: 38, yPct: 63, maxSize: 120}, // left column — never over the clipping
  ],
  endCard: [
    {xPct: 50, yPct: 69, maxSize: 100}, // below-CTA (deepest row inside bottom-500)
    {xPct: 22, yPct: 68, maxSize: 132}, // lower-left of the lockup
  ],
  default: [
    {xPct: 22, yPct: 62, maxSize: 132},
    {xPct: 58, yPct: 62, maxSize: 132},
  ],
};

// Closest vetted slot for a scene kind (Euclidean in pct space). Unknown kinds
// fall back to the 'default' row so every scene has a checkable answer.
export const nearestSlot = (kind: string, xPct: number, yPct: number): MascotSlot => {
  const slots = MASCOT_SLOTS[kind] ?? MASCOT_SLOTS.default;
  let best = slots[0];
  let bestD = Infinity;
  for (const s of slots) {
    const d = Math.hypot(s.xPct - xPct, s.yPct - yPct);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
};

// Distance (pct) from a position to the nearest vetted slot — the gate's number.
export const slotDistance = (kind: string, xPct: number, yPct: number): number => {
  const s = nearestSlot(kind, xPct, yPct);
  return Math.hypot(s.xPct - xPct, s.yPct - yPct);
};
