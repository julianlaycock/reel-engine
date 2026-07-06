import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

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
export type MascotConfig = {
  pose?: 'walk' | 'peek' | 'pop' | 'hop' | 'wave' | 'roam' | 'dash';
  xPct?: number; // sprite center, 0..100 of stage width
  yPct?: number; // sprite center, 0..100 of stage height
  size?: number; // sprite width in px (height follows the grid aspect)
  delay?: number; // frames before the entrance starts
  outline?: boolean; // ink silhouette outline (default true)
  bubble?: boolean; // "hi" speech bubble on wave/roam (default true)
};

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
const CORAL = '#D97757';
const INK = '#101010';

export const ClaudeMascot: React.FC<{config: MascotConfig; frames: number}> = ({config, frames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {pose = 'pop', xPct = 50, yPct = 55, size = 160, delay = 0, outline = true, bubble = true} = config;
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

  // Blink: every ~2.8s the eyes close for 5 frames.
  const blink = frame % 84 < 5;
  // Look-around: every ~5.3s the pupils drift left, then right (deterministic).
  const lookCycle = frame % 160;
  const eyeDx = lookCycle >= 96 && lookCycle < 118 ? -0.22 : lookCycle >= 126 && lookCycle < 148 ? 0.22 : 0;
  // Leg cycle: alternating pairs while walking; gentle synced tap when idle.
  const legPhase = walking ? Math.floor(frame / 5) % 2 : 0;

  // Silhouette cells (body + ears + legs) — used for the ink outline pass.
  const solid: Array<{x: number; y: number; h: number}> = [];
  const px: React.ReactNode[] = [];
  BODY.forEach((row, y) => {
    for (let x = 0; x < COLS; x++) {
      const c = row[x];
      if (c === '.') continue;
      solid.push({x, y, h: 1});
      if (c === 'E') {
        px.push(
          <rect
            key={`e${x}-${y}`}
            x={x + eyeDx}
            y={blink ? y + 0.6 : y}
            width={1}
            height={blink ? 0.4 : 1}
            fill="var(--fg, #2A3350)"
          />,
        );
        // coral base behind the eye so the look-around never opens a hole
        px.unshift(<rect key={`eb${x}-${y}`} x={x} y={y} width={1} height={1} fill={CORAL} />);
      } else {
        px.push(<rect key={`b${x}-${y}`} x={x} y={y} width={1} height={1} fill={CORAL} />);
      }
    }
  });
  LEG_COLS.forEach((x, i) => {
    const up = walking && i % 2 === legPhase ? 0.45 : 0;
    solid.push({x, y: BODY.length - up, h: LEG_ROWS});
    px.push(
      <rect
        key={`l${x}`}
        x={x}
        y={BODY.length - up}
        width={1}
        height={LEG_ROWS}
        fill={CORAL}
      />,
    );
  });
  // Waving arm: two pixels off the right shoulder, hard-stepping between two
  // positions every 8 frames (pixel-art cadence, no easing).
  if (waving) {
    const up = Math.floor(frame / 8) % 2 === 0;
    const arm = up ? {ax: 12.7, ay: 2.9, hx: 13.4, hy: 2.0} : {ax: 12.7, ay: 3.5, hx: 13.5, hy: 2.9};
    solid.push({x: arm.ax, y: arm.ay, h: 1}, {x: arm.hx, y: arm.hy, h: 1});
    px.push(
      <rect key="arm" x={arm.ax} y={arm.ay} width={1} height={1} fill={CORAL} />,
      <rect key="hand" x={arm.hx} y={arm.hy} width={1} height={1} fill={CORAL} />,
    );
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
            background: '#EFEADD',
            border: `${Math.max(3, unit * 0.28)}px solid ${INK}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"IBM Plex Mono", monospace',
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
              background: '#EFEADD',
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
