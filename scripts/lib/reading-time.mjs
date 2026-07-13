// Reading-time floor — canon v2.8 (vektor, 2026-07-08).
// A scene must stay on screen long enough to READ its on-screen text.
// Basis: Netflix Timed Text standard caps subtitles at 20 chars/sec (adult) /
// 17 cps (comfortable). Our on-screen text competes with visuals on a phone,
// so we canonize a conservative 15 cps + a half-second glance buffer, with the
// canon v2.0 hard floor of 3s (90 frames @30fps) for any voiced scene.
// Shared by retime.mjs (enforces at build) and check-canon.mjs (gates at QA)
// so the two can never drift apart again.

export const CPS = 15;              // chars/sec a viewer can read while also watching
export const GLANCE_BUFFER_SEC = 0.5;
export const HARD_FLOOR_SEC = 3;    // canon v2.0-3 scene-duration floor

// Keys whose string content the viewer actually reads. Corner furniture
// (meta/credit/issue chips) is excluded — it isn't read linearly.
const READ_KEYS = new Set([
  'headline', 'subhead', 'title', 'body', 'lines', 'caption', 'footnote',
  'label', 'leftLabel', 'rightLabel', 'leftValue', 'rightValue', 'value',
  'rows', 'items', 'cta', 'question', 'text', 'tagline', 'recap',
  'eyebrow', 'badge', 'cells', 'points', 'word',
]);
// kicker/kickerRight/footerRight are chrome corner furniture (section markers),
// not linearly-read content — excluded like meta/credit.
const SKIP_KEYS = new Set(['vo', 'meta', 'credit', 'kicker', 'kickerRight', 'footerRight', 'src', 'voSrc', 'musicSrc', 'asset', 'image']);

const collect = (node, out, keyed) => {
  if (node == null) return;
  if (typeof node === 'string') {
    if (keyed) out.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) collect(item, out, keyed);
    return;
  }
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (SKIP_KEYS.has(k)) continue;
      collect(v, out, keyed || READ_KEYS.has(k));
    }
  }
};

export const visibleChars = (scene) => {
  const out = [];
  // A terminal scene is a SCANNED CLI artifact (kind:'terminal', 2026-07-13):
  // its typed body — prompt / planHeader / rows / lines / confirm — is texture
  // paced by the char-by-char typing animation + the VO, NOT linearly-read prose.
  // Like a screenshot or ascii capture (whose `src`/`image` is already skipped),
  // the viewer scans it; the meaning rides the voiceover. Counting every grep/
  // diff line at 15 cps would demand ~18s for a 6-line session — absurd. So the
  // floor for a terminal is governed by its title/caption furniture + the 3s
  // hard floor (which still guarantees real dwell). Non-terminal scenes unchanged.
  if (scene && scene.kind === 'terminal') {
    const {lines, rows, prompt, planHeader, confirm, ...rest} = scene;
    collect(rest, out, false);
  } else {
    collect(scene, out, false);
  }
  // Count meaningful characters only (drop repeated whitespace).
  return out.join(' ').replace(/\s+/g, ' ').trim().length;
};

export const readingFloorFrames = (scene, fps = 30) => {
  const chars = visibleChars(scene);
  const readSec = chars / CPS + GLANCE_BUFFER_SEC;
  return Math.max(Math.round(HARD_FLOOR_SEC * fps), Math.ceil(readSec * fps));
};
