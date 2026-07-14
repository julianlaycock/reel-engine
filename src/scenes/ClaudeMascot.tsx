import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {nearestSlot} from './mascot-slots';
import {ACCENTS, COLORS, FIELDS, FONTS} from '@tokens/tokens';

// Per-scene animated pixel mascot ("Clawd"). Original pixel-grid redraw in code
// (no third-party asset file) — nominative editorial depiction of Anthropic's
// Claude mascot in videos about Claude. Positioned on the 1080×1920 stage via
// xPct/yPct (sprite center); callers must keep the sprite + bubble inside the
// PLATFORM SAFE ZONE (top 220 / bottom 500 / sides 150, right 260 in the
// y 850–1600 rail band — see canon/VIDEO-STANDARD.md). On the americana skin
// that means roughly xPct 20–62, yPct 25–66 at size ≤ 160; an out-of-zone
// placement logs a render warning below.
//
// 2026-07-04 (founder): ink silhouette outline (reads on ANY field — the coral
// vanished on the americana orchid), richer idle (look-around eyes, landing
// squash), 'wave' pose (arm + pixel "hi" bubble) and 'roam' pose (walk in →
// wave hi → idle → hop off at the scene end).
//
// 2026-07-08 reaction rig: lookAt (pupil eye-tracking), pointAt (pixel arm
// extends toward a target on the wave-arm 8f cadence), react (jawdrop /
// celebrate / gasp — 3-phase anticipate → action → settle, spring-driven,
// with lagged ears/legs for follow-through). All frame-deterministic.
export type MascotConfig = {
  pose?: 'walk' | 'peek' | 'pop' | 'hop' | 'wave' | 'roam' | 'dash';
  xPct?: number; // sprite center, 0..100 of stage width
  yPct?: number; // sprite center, 0..100 of stage height
  size?: number; // sprite width in px (height follows the grid aspect)
  delay?: number; // frames before the entrance starts
  outline?: boolean; // ink silhouette outline (default true)
  bubble?: boolean; // "hi" speech bubble on wave/roam (default true)
  lookAt?: {xPct: number; yPct: number}; // pupils aim at this stage point (else drift cycle)
  pointAt?: {xPct: number; yPct: number; atFrame?: number}; // pixel arm extends toward target
  react?: {kind: 'jawdrop' | 'celebrate' | 'gasp'; atFrame: number}; // 3-phase reaction
};

// Size tiers — the authoring vocabulary (2026-07-08). Scenes were hand-setting
// ~80–130 against a 160 default; 'presence' (132) is the new default.
export const MASCOT_TIERS = {ambient: 100, presence: 132, hero: 160} as const;

// 13-wide pixel map. 'X' = body, 'E' = eye (navy), '.' = empty.
const BODY = [
  '..XX.....XX..', // ear nubs
  '.XXXXXXXXXXX.',
  '.XXXXXXXXXXX.',
  '.XXXEXXXEXXX.', // eyes
  'XXXXXXXXXXXXX', // side-arm nubs
  '.XXXXXXXXXXX.',
];
const LEG_COLS = [2, 4, 8, 10];
const COLS = 13;
const LEG_ROWS = 2;
const ROWS = BODY.length + LEG_ROWS;
const CORAL = COLORS.coral;
const INK = FIELDS.ink.bg;

// warn ONCE per key per render process (slot drift / end-card clamp) — the
// canon gate enforces; the warn just keeps authoring visible.
const warned = new Set<string>();
const warnOnce = (key: string, msg: string) => {
  if (warned.has(key)) return;
  warned.add(key);
  // eslint-disable-next-line no-console
  console.warn(msg);
};

export const ClaudeMascot: React.FC<{config: MascotConfig; frames: number; sceneKind?: string}> = ({
  config,
  frames,
  sceneKind,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {pose = 'pop', xPct = 50, yPct = 55, delay = 0, outline = true, bubble = true} = config;
  let size = config.size ?? MASCOT_TIERS.presence;
  // End-card structural guard (2026-07-08): the mascot must never be the
  // background — clamp to the hero tier on end cards.
  if (sceneKind === 'endCard' && size > MASCOT_TIERS.hero) {
    warnOnce(
      `endcard-clamp:${size}`,
      `[ClaudeMascot] end-card size ${size} clamped to ${MASCOT_TIERS.hero} — the mascot must never be the end-card background`,
    );
    size = MASCOT_TIERS.hero;
  }
  // Vetted-slot check (src/scenes/mascot-slots.ts): warn once when the configured
  // position is >8pct from every vetted slot for this scene kind. NOT auto-moved —
  // the canon gate enforces; the warn keeps authoring visible.
  if (sceneKind) {
    const slot = nearestSlot(sceneKind, xPct, yPct);
    const d = Math.hypot(slot.xPct - xPct, slot.yPct - yPct);
    if (d > 8) {
      warnOnce(
        `slot:${sceneKind}:${xPct}:${yPct}`,
        `[ClaudeMascot] ${sceneKind} position xPct=${xPct} yPct=${yPct} is ${d.toFixed(1)}pct from every vetted slot — nearest is {xPct: ${slot.xPct}, yPct: ${slot.yPct}, maxSize: ${slot.maxSize}} (src/scenes/mascot-slots.ts)`,
      );
    }
  }
  // platform safe zone check (bubble extends right of the sprite and above it)
  const rightEdge = (xPct / 100) * 1080 + size / 2 + (bubble ? size * 0.72 + size * 0.62 - size / 2 : 0);
  const bottomEdge = (yPct / 100) * 1920 + size / 2 + size * 0.35; // legs
  const inRailBand = bottomEdge > 850 && (yPct / 100) * 1920 < 1600;
  if (
    rightEdge > (inRailBand ? 1080 - 260 : 1080 - 150) ||
    (xPct / 100) * 1080 - size / 2 < 150 ||
    bottomEdge > 1920 - 500 ||
    (yPct / 100) * 1920 - size / 2 < 220
  ) {
    console.warn(
      `[ClaudeMascot] placement xPct=${xPct} yPct=${yPct} size=${size} leaves the platform safe zone (top 220 / bottom 500 / sides 150 / rail 260) — it will be cropped or covered on TikTok/IG`,
    );
  }
  const t = frame - delay;
  const unit = size / COLS;
  const height = unit * ROWS;

  const enter = spring({frame: Math.max(t, 0), fps, config: {damping: 13, stiffness: 120}});
  const idleBob = Math.sin(frame / 11) * unit * 0.08;

  // Pose-specific transforms on the outer wrapper.
  let tx = 0;
  let ty = idleBob;
  let sx = 1;
  let sy = 1;
  let rot = 0;
  let walking = false;
  let waving = false;
  let bubbleOn = false;
  if (t < 0 && pose !== 'walk' && pose !== 'roam' && pose !== 'dash') return null;
  const fromX = -((xPct / 100) * 1080 + size); // off-screen left
  if (pose === 'walk') {
    const walkFrames = 42;
    const p = interpolate(t, [0, walkFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    tx = (1 - p) * fromX;
    walking = p < 1;
    ty = walking ? Math.sin(frame / 3) * unit * 0.18 : idleBob;
  } else if (pose === 'pop') {
    sx = sy = enter;
  } else if (pose === 'peek') {
    ty += (1 - enter) * height * 1.1;
    sx = sy = 0.9 + enter * 0.1;
  } else if (pose === 'hop') {
    sx = sy = enter;
    const hopEvery = 52;
    const hopLen = 16;
    const local = t > 20 ? (t - 20) % hopEvery : hopLen; // settle first, then hop
    if (local < hopLen) {
      const hp = local / hopLen;
      ty -= Math.sin(hp * Math.PI) * unit * 2.2; // parabolic hop
    } else if (local < hopLen + 4) {
      // landing squash-and-stretch (hard, cartoon)
      sy *= 0.86;
      sx *= 1.1;
    }
  } else if (pose === 'wave') {
    sx = sy = enter;
    waving = t >= 6 && t < 96;
    bubbleOn = bubble && t >= 12 && t < 92;
  } else if (pose === 'roam') {
    // walk in → wave "hi" → idle → hop off right at the scene end.
    const walkFrames = 44;
    const exitStart = Math.max(walkFrames + 90, frames - 42);
    const tt = Math.max(t, 0);
    if (tt < walkFrames) {
      const p = interpolate(tt, [0, walkFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      tx = (1 - p) * fromX;
      walking = true;
      ty = Math.sin(frame / 3) * unit * 0.18;
    } else if (tt < exitStart) {
      waving = tt < walkFrames + 60;
      bubbleOn = bubble && tt >= walkFrames + 6 && tt < walkFrames + 64;
      const local = tt - walkFrames;
      // a couple of happy hops between waving and idling
      const hopLocal = local > 70 ? (local - 70) % 64 : 99;
      if (hopLocal < 14) {
        ty -= Math.sin((hopLocal / 14) * Math.PI) * unit * 1.6;
      } else if (hopLocal < 18) {
        sy *= 0.88;
        sx *= 1.08;
      }
    } else {
      // parabolic hop off toward the right edge
      const p = interpolate(tt, [exitStart, exitStart + 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      tx = p * ((1 - xPct / 100) * 1080 + size * 2);
      ty -= Math.sin(Math.min(p, 1) * Math.PI) * unit * 3.2 - p * unit * 1.2;
      walking = false;
    }
  } else if (pose === 'dash') {
    // Excited DASH-TO-CTA (founder pick, 2026-07-05): bounds in fast from off-screen
    // right with a forward lean → screech-stop squash → excited hops while waving at
    // the CTA. "Punchy" exaggeration (premium-editorial, not full rubber-hose).
    const dashFrames = 26;
    const fromXr = (1 - xPct / 100) * 1080 + size * 1.6; // off-screen right
    const tt = Math.max(t, 0);
    if (tt < dashFrames) {
      const p = 1 - Math.pow(1 - tt / dashFrames, 3); // easeOutCubic
      tx = (1 - p) * fromXr;
      walking = true;
      ty = Math.sin(frame / 2.5) * unit * 0.2;
      rot = -12 * (1 - p * 0.5); // forward lean, eases out on arrival
    } else if (tt < dashFrames + 8) {
      const p = (tt - dashFrames) / 8;
      const s = Math.sin(p * Math.PI);
      tx = -s * unit * 1.1; // slight overshoot recoil
      sy = 1 - 0.32 * s; // screech-stop squash
      sx = 1 / Math.sqrt(sy);
      rot = -6 * (1 - p);
    } else {
      // excited hops + waving at the CTA (no "hi" bubble — the CTA text owns that slot)
      const local = tt - (dashFrames + 8);
      const hopEvery = 20;
      const hl = local % hopEvery;
      if (hl < 9) {
        ty -= Math.sin((hl / 9) * Math.PI) * unit * 1.8;
      } else if (hl < 13) {
        sy *= 0.86;
        sx *= 1.1;
      }
      waving = true;
      rot = Math.sin(local / 4) * 3;
    }
  }

  // ---------------------------------------------------------------- reaction rig
  // 3-phase (anticipate → action → settle), spring() evaluated at frame — pure
  // functions of the local reaction frame so ears/legs can re-evaluate the SAME
  // motion at (frame − 3) for lag/follow-through (cheap, deterministic).
  const react = config.react;
  const rt = react ? t - react.atFrame : -1;

  // jawdrop envelope: 4f crouch → spring-open with overshoot → eased close.
  const JD_ANT = 4;
  const JD_HOLD = 30;
  const jawEnv = (f: number): number => {
    if (f < JD_ANT) return 0;
    const act = spring({frame: f - JD_ANT, fps, config: {damping: 9, stiffness: 170, mass: 0.8}});
    const close = f < JD_ANT + JD_HOLD ? 0 : spring({frame: f - JD_ANT - JD_HOLD, fps, config: {damping: 14, stiffness: 90}});
    return Math.max(0, act * (1 - close));
  };
  // celebrate: 6f squash → 2–3 spring-launched hops → settle with a final bounce.
  const CEL_ANT = 6;
  const CEL_HOP = 15;
  const CEL_HOPS = 3;
  const celLift = (f: number): number => {
    if (f < CEL_ANT) return 0;
    const local = f - CEL_ANT;
    const launch = spring({frame: local, fps, config: {damping: 10, stiffness: 160}});
    if (local < CEL_HOPS * CEL_HOP) {
      const hopI = Math.floor(local / CEL_HOP);
      const hp = (local % CEL_HOP) / CEL_HOP;
      return Math.sin(hp * Math.PI) * (2.6 - hopI * 0.5) * launch; // hops decay
    }
    const st = local - CEL_HOPS * CEL_HOP;
    const settle = spring({frame: st, fps, config: {damping: 9, stiffness: 130}});
    return Math.sin(Math.min(1, st / 12) * Math.PI) * 0.6 * (1 - settle); // final small bounce
  };
  // gasp: sharp 3f scale-up → slow overdamped settle.
  const gaspEnv = (f: number): number => {
    if (f < 0) return 0;
    const up = Math.min(1, f / 3);
    const settle = f < 3 ? 0 : spring({frame: f - 3, fps, config: {damping: 26, stiffness: 30}});
    return up * (1 - settle);
  };
  // body lift (grid cells) as a pure fn of the reaction frame — the "main body
  // spring" the secondary motion re-evaluates at (frame − 3).
  const reactLift = (f: number): number => {
    if (!react || f < 0) return 0;
    if (react.kind === 'jawdrop') return jawEnv(f) * 0.35; // recoil rises slightly
    if (react.kind === 'celebrate') return celLift(f);
    return gaspEnv(f) * 0.12; // gasp: tiny rise with the inhale
  };

  let jaw = 0; // grid cells the head lifts off the chin row (open mouth)
  let earPerk = 0; // grid cells the ear cells shift up (gasp)
  let pupilScale = 1;
  let pupilDy = 0;
  let armsUp = false; // celebrate: both arms up (mirrored wave cells)
  if (react && rt >= 0) {
    if (react.kind === 'jawdrop') {
      if (rt < JD_ANT) {
        const p = rt / JD_ANT; // quick crouch anticipation
        sy *= 1 - 0.14 * p;
        sx *= 1 + 0.08 * p;
      } else {
        const env = jawEnv(rt);
        // jaw pixel-row opens — quantized to whole screen pixels (sprite cadence)
        jaw = Math.round(env * 1.1 * unit) / unit;
        rot += -7 * env; // recoil lean-back (spring overshoot included)
        pupilScale = 1 - 0.35 * env; // eyes widen: pupils smaller…
        pupilDy = -0.18 * env; // …and higher
      }
    } else if (react.kind === 'celebrate') {
      if (rt < CEL_ANT) {
        const p = rt / CEL_ANT; // anticipation squash
        sy *= 1 - 0.2 * p;
        sx *= 1 + 0.12 * p;
      } else {
        const local = rt - CEL_ANT;
        if (local < CEL_HOPS * CEL_HOP) {
          const hp = (local % CEL_HOP) / CEL_HOP;
          sy *= 1 + 0.06 * Math.sin(hp * Math.PI); // stretch in the air
          sx *= 1 - 0.04 * Math.sin(hp * Math.PI);
          rot += Math.sin((local / CEL_HOP) * Math.PI * 2) * 5; // rotation wiggle
          armsUp = true;
        } else {
          const st = local - CEL_HOPS * CEL_HOP;
          const settle = spring({frame: st, fps, config: {damping: 9, stiffness: 130}});
          sy *= 0.84 + 0.16 * settle; // landing squash releases on the spring
          sx *= 1.1 - 0.1 * settle;
          armsUp = st < 8;
        }
      }
    } else if (react.kind === 'gasp') {
      const env = gaspEnv(rt);
      sx *= 1 + 0.14 * env; // sharp 3f scale-up, slow settle
      sy *= 1 + 0.14 * env;
      pupilScale = 1 - 0.4 * env; // pupils shrink
      // ears perk: ear cells shift up one sprite pixel (hard step, re-evaluated
      // at frame−3 below so the perk lags the body — follow-through)
      earPerk = gaspEnv(rt - 3) > 0.35 ? 1 : 0;
    }
  }
  const lift = reactLift(rt);
  ty -= lift * unit;
  // Secondary motion: ears/legs sit where the body WAS 3 frames ago (clamped
  // ±0.55 cells so a still never reads as a detached sprite).
  const lag = Math.max(-0.55, Math.min(0.55, lift - reactLift(rt - 3)));

  // Blink: every ~2.8s the eyes close for 5 frames.
  const blink = frame % 84 < 5;
  // Eye-tracking: pupils aim at lookAt (angle from mascot to target, quantized
  // to whole screen pixels — the sprite cadence). Falls back to the drift cycle.
  let eyeDx: number;
  let eyeDy = 0;
  if (config.lookAt) {
    const dxT = ((config.lookAt.xPct - xPct) / 100) * 1080;
    const dyT = ((config.lookAt.yPct - yPct) / 100) * 1920;
    const a = Math.atan2(dyT, dxT);
    const R = 0.26; // max pupil throw in grid cells
    eyeDx = Math.round(Math.cos(a) * R * unit) / unit;
    eyeDy = Math.round(Math.sin(a) * R * unit) / unit;
  } else {
    // Look-around: every ~5.3s the pupils drift left, then right (deterministic).
    const lookCycle = frame % 160;
    eyeDx = lookCycle >= 96 && lookCycle < 118 ? -0.22 : lookCycle >= 126 && lookCycle < 148 ? 0.22 : 0;
  }
  eyeDy += pupilDy;
  // Leg cycle: alternating pairs while walking; gentle synced tap when idle.
  const legPhase = walking ? Math.floor(frame / 5) % 2 : 0;

  // Per-row y offset: rows 0..4 (head) lift when the jaw opens; ears also get
  // the perk + the 3-frame lag; chin row (5) + legs stay grounded (legs lag).
  const rowDy = (y: number): number => {
    if (y === 0) return -jaw - earPerk + lag; // ears
    if (y <= 4) return -jaw; // head
    return 0; // chin row
  };

  // Silhouette cells (body + ears + legs) — used for the ink outline pass.
  const solid: Array<{x: number; y: number; h: number}> = [];
  const px: React.ReactNode[] = [];
  // open-mouth interior: ink fill between the lifted head and the chin row
  if (jaw > 0.04) {
    px.push(<rect key="mouth" x={1} y={BODY.length - 1 - jaw} width={COLS - 2} height={jaw + 0.05} fill={INK} />);
  }
  BODY.forEach((row, y) => {
    const dy = rowDy(y);
    for (let x = 0; x < COLS; x++) {
      const c = row[x];
      if (c === '.') continue;
      solid.push({x, y: y + dy, h: 1});
      if (c === 'E') {
        const pw = pupilScale;
        const ph = blink ? 0.4 : pupilScale;
        px.push(
          <rect
            key={`e${x}-${y}`}
            x={x + eyeDx + (1 - pw) / 2}
            y={(blink ? y + 0.6 : y + eyeDy + (1 - ph) / 2) + dy}
            width={pw}
            height={ph}
            fill={`var(--fg, ${COLORS.mascotNavy})`}
          />,
        );
        // coral base behind the eye so the look-around never opens a hole
        px.unshift(<rect key={`eb${x}-${y}`} x={x} y={y + dy} width={1} height={1} fill={CORAL} />);
      } else {
        px.push(<rect key={`b${x}-${y}`} x={x} y={y + dy} width={1} height={1} fill={CORAL} />);
      }
    }
  });
  LEG_COLS.forEach((x, i) => {
    const up = walking && i % 2 === legPhase ? 0.45 : 0;
    const ly = BODY.length - up + lag; // legs follow through on the lag
    solid.push({x, y: ly, h: LEG_ROWS});
    px.push(
      <rect
        key={`l${x}`}
        x={x}
        y={ly}
        width={1}
        height={LEG_ROWS}
        fill={CORAL}
      />,
    );
  });
  // Waving arm: two pixels off the right shoulder, hard-stepping between two
  // positions every 8 frames (pixel-art cadence, no easing).
  if (waving && !armsUp) {
    const up = Math.floor(frame / 8) % 2 === 0;
    const arm = up ? {ax: 12.7, ay: 2.9, hx: 13.4, hy: 2.0} : {ax: 12.7, ay: 3.5, hx: 13.5, hy: 2.9};
    solid.push({x: arm.ax, y: arm.ay - jaw, h: 1}, {x: arm.hx, y: arm.hy - jaw, h: 1});
    px.push(
      <rect key="arm" x={arm.ax} y={arm.ay - jaw} width={1} height={1} fill={CORAL} />,
      <rect key="hand" x={arm.hx} y={arm.hy - jaw} width={1} height={1} fill={CORAL} />,
    );
  }
  // Celebrate: BOTH arms up — the wave-arm cells plus their mirror, on the same
  // 8f hard-step cadence (left arm offset half a cycle so they alternate).
  if (armsUp) {
    const mk = (up: boolean) => (up ? {ax: 12.7, ay: 2.6, hx: 13.4, hy: 1.7} : {ax: 12.7, ay: 3.2, hx: 13.5, hy: 2.4});
    const r = mk(Math.floor(frame / 8) % 2 === 0);
    const l = mk(Math.floor((frame + 4) / 8) % 2 === 0);
    const cells = [
      {x: r.ax, y: r.ay - jaw},
      {x: r.hx, y: r.hy - jaw},
      {x: COLS - 1 - l.ax, y: l.ay - jaw}, // mirrored off the left shoulder
      {x: COLS - 1 - l.hx, y: l.hy - jaw},
    ];
    cells.forEach((c, ci) => {
      solid.push({x: c.x, y: c.y, h: 1});
      px.push(<rect key={`ca${ci}`} x={c.x} y={c.y} width={1} height={1} fill={CORAL} />);
    });
  }
  // pointAt: a 3–4 cell pixel arm extends toward the target angle, stepping on
  // the SAME 8f hard-step cadence as the wave arm. 6-frame anticipation dip
  // first (handled in the transform below), then one cell per 8 frames.
  const point = config.pointAt;
  const pt = point ? t - (point.atFrame ?? 0) : -1;
  if (point && pt >= 0) {
    if (pt < 6) {
      // anticipation dip before the arm extends
      const p = Math.sin((pt / 6) * Math.PI);
      sy *= 1 - 0.1 * p;
      sx *= 1 + 0.06 * p;
    } else {
      const dxT = ((point.xPct - xPct) / 100) * 1080;
      const dyT = ((point.yPct - yPct) / 100) * 1920;
      const a = Math.atan2(dyT, dxT);
      // quantize the direction to the 8 pixel diagonals (sprite grammar)
      const oct = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
      const ux = [1, 1, 0, -1, -1, -1, 0, 1][oct];
      const uy = [0, 1, 1, 1, 0, -1, -1, -1][oct];
      const shoulderX = ux >= 0 ? 12.3 : 0.7; // arm leaves the near shoulder
      const shoulderY = 4 - jaw; // side-arm nub row (follows the head on jawdrop)
      const ext = Math.min(4, 1 + Math.floor((pt - 6) / 8)); // 8f hard steps, out to 4 cells
      // once fully extended the hand cell taps ±0.3 on the same cadence (alive, not frozen)
      const tap = ext >= 4 && Math.floor(frame / 8) % 2 === 0 ? -0.3 : 0;
      for (let i = 1; i <= ext; i++) {
        const cx = shoulderX + ux * i;
        const cy = shoulderY + uy * i + (i === ext ? tap * (uy === 0 ? 1 : 0) : 0);
        solid.push({x: cx, y: cy, h: 1});
        px.push(<rect key={`pt${i}`} x={cx} y={cy} width={1} height={1} fill={CORAL} />);
      }
    }
  }

  // Ink silhouette outline: the solid cells re-drawn in ink, offset in 8
  // directions under the coral pass — reads on ANY field color (sprite-art
  // style, matches the hard-edged americana language).
  const o = 0.24;
  const outlineDirs: Array<[number, number]> = [
    [-o, 0],
    [o, 0],
    [0, -o],
    [0, o],
    [-o, -o],
    [-o, o],
    [o, -o],
    [o, o],
  ];
  const outlinePass = outline
    ? outlineDirs.map(([dx, dy], di) => (
        <g key={`o${di}`} transform={`translate(${dx} ${dy})`}>
          {solid.map((s, si) => (
            <rect key={si} x={s.x} y={s.y} width={1} height={s.h} fill={INK} />
          ))}
        </g>
      ))
    : null;

  const bubbleW = size * 0.62;
  const bubbleH = size * 0.34;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${xPct}%`,
        top: `${yPct}%`,
        width: size,
        height,
        marginLeft: -size / 2,
        marginTop: -height / 2,
        transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sx}, ${sy})`,
        transformOrigin: '50% 100%',
        pointerEvents: 'none',
        opacity: pose === 'walk' || pose === 'roam' || pose === 'dash' ? 1 : Math.min(1, enter * 1.4),
      }}
    >
      {bubbleOn ? (
        // pixel speech bubble — hard 1-frame pop (no easing), paper on ink
        <div
          style={{
            position: 'absolute',
            left: size * 0.72,
            top: -bubbleH - size * 0.18,
            width: bubbleW,
            height: bubbleH,
            background: ACCENTS.paper,
            border: `${Math.max(3, unit * 0.28)}px solid ${INK}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.plexMono,
            fontWeight: 500,
            fontSize: bubbleH * 0.52,
            color: INK,
            letterSpacing: '0.04em',
          }}
        >
          hi
          <div
            style={{
              position: 'absolute',
              left: size * 0.04,
              bottom: -size * 0.115,
              width: size * 0.11,
              height: size * 0.11,
              background: ACCENTS.paper,
              borderRight: `${Math.max(3, unit * 0.28)}px solid ${INK}`,
              borderBottom: `${Math.max(3, unit * 0.28)}px solid ${INK}`,
              transform: 'rotate(45deg)',
              marginBottom: size * 0.06,
            }}
          />
        </div>
      ) : null}
      <svg width="100%" height="100%" viewBox={`0 0 ${COLS} ${ROWS}`} shapeRendering="crispEdges" style={{overflow: 'visible'}}>
        {outlinePass}
        {px}
      </svg>
    </div>
  );
};
