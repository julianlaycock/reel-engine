// NO. 032 — 3D spike. NOT part of the film yet.
//
// Canon law (projects/CLAUDE.md, "The Visual Canon"): a new visualization enters
// the system only through the approve loop — mock -> founder approve -> engine
// still -> founder approve -> envelope written into wireframes.json + reference
// still seeded into canon/goldens/. This file is step two of that loop: a real
// engine still of the two 3D looks the founder asked for, rendered on the
// shipping path so what is approved is what can ship.
//
// Two variants:
//   'slabs'    — the state file as physical stacked slabs (the hero)
//   'screener' — a structured screener board, seen in perspective (the hook)
//
// v2, after the first spike was measured. Four faults were fixed, all objective:
//   1. GEOMETRY SAT UNDER THE TYPE at 0% clearance, and cream type landed on a
//      light slab face — a contrast failure. Both objects now live entirely in
//      the lower band (y 51-86%) with the type band (30-45%) left clear.
//   2. FLAT AMBIENT LIGHTING with no shadow, the standard tell of an untuned
//      three.js scene. Now one hard key with real cast shadows, low ambient, and
//      a red rim — matching the letterpress look: crisp edges, no atmosphere.
//   3. THE OBJECT BLED OFF THREE EDGES. Slab width was 5.2 units against a 4.46
//      unit viewport. Everything is now sized to sit inside the frame.
//   4. THE SCREENER WAS A RANDOM SCATTER. It is now an actual board: fixed
//      columns, uniform gutters, and the red cells CLUSTERED at the top of one
//      column so it reads as a sorted score, not confetti.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {INK, CREAM, RED, f} from './KTHook';
import './style.css';

export const KT_3D_SPIKE_FRAMES = f(6000);
const W = 1080, H = 1920;

// Viewport maths, so geometry can be placed against FRAME percentages.
// fov 38 at z=11.5 -> visible height 2*11.5*tan(19deg) = 7.92 units over 1920px,
// i.e. 1 unit = 242px. Visible width = 7.92 * (1080/1920) = 4.46 units.
const UNIT_PX = 242;
const yForPct = (pct: number) => (0.5 - pct / 100) * (H / UNIT_PX);

// ---- the state file as slabs ----------------------------------------------
// One slab per logged week. The stack grows upward and toward camera, so
// "the file accumulates" stops being a metaphor and becomes depth you can see.
const SLABS = [
  {wk: 'week 01', hot: false},
  {wk: 'week 02', hot: false},
  {wk: 'week 03', hot: true},   // the -15% week
  {wk: 'week 04', hot: false},
  {wk: 'week 05', hot: false},
  {wk: 'week 06', hot: false},
  {wk: 'week 07', hot: false},
];

const SlabStack: React.FC = () => (
  // sits in the lower band: base at 86% of frame, top of stack at ~51%
  <group rotation={[-0.22, 0.58, 0]} position={[0, yForPct(86), 0]}>
    <mesh position={[0, -0.09, 0]} receiveShadow>
      <boxGeometry args={[3.6, 0.16, 2.2]} />
      <meshStandardMaterial color="#26231F" roughness={1} metalness={0} />
    </mesh>
    {SLABS.map((s, i) => (
      <mesh key={s.wk} position={[0, 0.18 + i * 0.40, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.28, 2.0]} />
        <meshStandardMaterial
          color={s.hot ? RED : CREAM}
          roughness={0.85}
          metalness={0}
        />
      </mesh>
    ))}
  </group>
);

// ---- the screener board ----------------------------------------------------
// A real board, not a scatter: 5 fixed columns, 11 rows, uniform gutters, seen
// in perspective. The rightmost column is the score, and its red cells are
// CLUSTERED AT THE TOP — so the image reads "ranked", which is the thing the
// hook is actually about. Deliberately UNBRANDED and figure-free: no tickers,
// no prices, no product chrome, so nothing fabricates a real company's UI or
// invents market data.
const S_ROWS = 10, S_COLS = 5;
const CELL_W = 0.52, CELL_H = 0.17, GUT_X = 0.12, GUT_Y = 0.12;
const BOARD_W = S_COLS * CELL_W + (S_COLS - 1) * GUT_X;
const BOARD_H = S_ROWS * CELL_H + (S_ROWS - 1) * GUT_Y;

const ScreenerBoard: React.FC = () => {
  const cells = [];
  for (let r = 0; r < S_ROWS; r++) {
    for (let c = 0; c < S_COLS; c++) {
      const isScore = c === S_COLS - 1;
      const lit = isScore && r < 3;                       // top 3 = the picks
      // UNIFORM cell widths. v2 varied the width per cell, which made the board
      // scan as a bar chart rather than a screener. Value is carried by FILL,
      // which is how the NO.031 bar chart already does emphasis.
      const val = isScore ? 1 : 0.34 + ((r * 7 + c * 13) % 5) * 0.15;
      cells.push(
        <mesh key={`${r}-${c}`} castShadow
          position={[-BOARD_W / 2 + c * (CELL_W + GUT_X) + CELL_W / 2,
            BOARD_H / 2 - r * (CELL_H + GUT_Y), 0.09]}>
          <boxGeometry args={[CELL_W, CELL_H, 0.17]} />
          <meshStandardMaterial color={lit ? RED : CREAM} roughness={0.88} metalness={0}
            transparent opacity={lit ? 1 : val} />
        </mesh>
      );
    }
  }
  return (
    // Near-orthographic: v2's 0.46rad yaw put a 53px stagger on every row and a
    // 26% gutter taper, which destroyed the grid read. Shallow tilt keeps the
    // depth and gets the rows back. Sized and placed to sit fully inside the
    // frame and to STOP at 86%, clear of the footer it was printing over.
    <group rotation={[-0.09, 0.26, 0]} position={[0, yForPct(67), 0]} scale={1.06}>
      <mesh position={[0, 0, -0.02]} receiveShadow>
        <boxGeometry args={[BOARD_W + 0.30, BOARD_H + 0.30, 0.10]} />
        <meshStandardMaterial color="#221F1B" roughness={1} metalness={0} />
      </mesh>
      {cells}
    </group>
  );
};

export const KT3DSpike: React.FC<{variant?: 'slabs' | 'screener'}> = ({variant = 'slabs'}) => {
  useCurrentFrame();
  const slabs = variant === 'slabs';
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <ThreeCanvas
        width={W}
        height={H}
        shadows
        camera={{position: [0, 0, 11.5], fov: 38}}
        style={{position: 'absolute', inset: 0}}
      >
        {/* v3 lighting. The reason v1 and v2 both rendered dead-flat faces is
            that a DIRECTIONAL light emits parallel rays, so a flat surface takes
            exactly one illumination value across its whole area — no amount of
            intensity tuning changes that. Falloff needs a positional light.
            Key is now a close pointLight with physical decay, so each face is
            graded across its own width, plus a dim red point for the rim.
            Ambient is lifted a little so shadowed areas stay above the board
            they fall on instead of punching to pure black. */}
        <ambientLight intensity={0.34} />
        <pointLight
          position={[3.4, 4.2, 4.6]}
          intensity={95}
          decay={2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0006}
          shadow-radius={4}
        />
        <pointLight position={[-4.2, 0.4, 3.2]} intensity={26} decay={2} color={RED} />
        {/* a weak fill so the faces turned away from the key never go to zero */}
        <directionalLight position={[-2, 3, 8]} intensity={0.30} />
        {slabs ? <SlabStack /> : <ScreenerBoard />}
      </ThreeCanvas>

      {/* the house type layer sits in the CLEAR band above the object (30-45%).
          The 3D is the field; the grammar on top of it is unchanged. */}
      <div style={{position: 'absolute', left: 150, right: 150, top: 576, textAlign: 'center',
        fontSize: slabs ? 96 : 88, lineHeight: 1.14, color: CREAM,
        fontFamily: '"Printvetica", sans-serif'}}>
        {slabs ? 'state file' : 'hedge funds'}
      </div>
      <div style={{position: 'absolute', left: 150, right: 150, top: 706, textAlign: 'center',
        fontSize: 52, lineHeight: 1.14, color: CREAM, fontFamily: '"Printvetica", sans-serif'}}>
        {slabs ? 'every screen the agent runs.' : 'pay stock research analysts'}
      </div>

      {/* furniture, so the still is judged in its real context */}
      <div style={{position: 'absolute', top: 52, left: 44, fontSize: 40, fontWeight: 600,
        letterSpacing: '-0.045em', color: CREAM, fontFamily: '"Inter Tight", sans-serif'}}>vektor</div>
      <div style={{position: 'absolute', bottom: 72, left: 44, fontSize: 22, letterSpacing: 3,
        color: 'rgba(244,239,223,0.35)'}}>vektor /// the state file</div>
      <div style={{position: 'absolute', bottom: 72, right: 44, fontSize: 22, letterSpacing: 3,
        color: 'rgba(244,239,223,0.35)'}}>comment. analyst.</div>
    </AbsoluteFill>
  );
};
