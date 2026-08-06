// NO. 032 — the film's 3D layer. Founder-approved on real engine stills
// (out/no-032-3d-slabs-v3.png, out/no-032-3d-screener-v3.png) 2026-08-06, per
// the canon approve loop.
//
// Two objects, both rendered through <ThreeCanvas> at the composition's full
// 1080x1920 so they can be positioned against FRAME percentages:
//   SlabStack3D    — the state file. One slab per logged week; the stack grows
//                    as weeks arrive, so accumulation becomes literal depth.
//   ScreenerBoard3D — the hook. A structured screener board, unbranded and
//                    figure-free: no tickers, no prices, no product chrome.
//
// LIGHTING NOTE, learned the expensive way: a directionalLight emits PARALLEL
// rays, so a flat face takes exactly one illumination value across its whole
// area no matter how the intensity is tuned. The first two spikes rendered
// dead-flat for that reason alone. Falloff requires a POSITIONAL light, so the
// key is a close pointLight with physical decay.
import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useCurrentFrame} from 'remotion';
import {CREAM, RED, f} from './KTHook';

const W = 1080, H = 1920;
// fov 38 at z=11.5 -> visible height 2*11.5*tan(19deg) = 7.92 units over 1920px.
const UNIT_PX = 242;
export const yForPct = (pct: number) => (0.5 - pct / 100) * (H / UNIT_PX);
const decel = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

const Rig: React.FC<{children: React.ReactNode}> = ({children}) => (
  <ThreeCanvas width={W} height={H} shadows camera={{position: [0, 0, 11.5], fov: 38}}
    style={{position: 'absolute', inset: 0}}>
    <ambientLight intensity={0.34} />
    <pointLight position={[3.4, 4.2, 4.6]} intensity={95} decay={2} castShadow
      shadow-mapSize-width={2048} shadow-mapSize-height={2048}
      shadow-bias={-0.0006} shadow-radius={4} />
    <pointLight position={[-4.2, 0.4, 3.2]} intensity={26} decay={2} color={RED} />
    <directionalLight position={[-2, 3, 8]} intensity={0.30} />
    {children}
  </ThreeCanvas>
);

// ---- the state file --------------------------------------------------------
// Weeks arrive on their spoken beats. The newest slab SLIDES up into place over
// 16 frames with a decelerating, zero-overshoot landing (KT-MOTION-SPEC), and
// the stack rides up with it. Mascot law applies to objects too: slide, never
// pop.
// Weeks arrive on their spoken beats. The first pass put only ONE slab on
// screen from 49.7s to 56.4s -- six and a half seconds of the film's hero
// device being a single slab, which is not a stack and does not argue
// anything. Three now land across "records every screen the agent runs",
// which is also what the line actually says.
// Capped at SEVEN: at 0.40 pitch an eighth slab pushes the stack top above
// 50% of frame and into the caption band.
export const WEEK_MS = [49710, 50530, 51450, 56350, 59440, 81000, 89330];
const HOT = 2; // the flagged week that later drops -15%
const PITCH = 0.33;

const Slabs: React.FC<{frame: number}> = ({frame}) => {
  const arrived = WEEK_MS.filter((ms) => frame >= f(ms)).length;
  if (!arrived) return null;
  const newest = arrived - 1;
  const t = decel((frame - f(WEEK_MS[newest])) / 16);
  const lifted = frame >= f(61230) && frame < f(68000);
  // the whole stack rides the incoming slab, so the base stays put at 88%
  const ride = (1 - t) * PITCH;
  return (
    // PLATFORM SAFE ZONE (founder, 2026-08-06): base at 73%, not 86%. The
    // repo's own vetted constant is top 220 / bottom 500 / sides 150 (see
    // scenes/ClaudeMascot.tsx:10), i.e. nothing that must be seen may cross
    // y1420 -- Instagram's caption, handle and audio credit sit over the
    // bottom band, and the action rail over the right. At 86% the stack based
    // at y1651 was 269px from the bottom, squarely under the UI.
    <group rotation={[-0.22, 0.52, 0]} position={[0, yForPct(70) + ride, 0]}>
      <mesh position={[0, -0.09, 0]} receiveShadow>
        <boxGeometry args={[2.68, 0.16, 1.68]} />
        <meshStandardMaterial color="#26231F" roughness={1} metalness={0} />
      </mesh>
      {Array.from({length: arrived}).map((_, i) => {
        const hot = i === HOT;
        // the incoming slab travels the last of its distance and settles
        const dy = i === newest ? (1 - t) * 1.5 : 0;
        return (
          <mesh key={i} position={[0, 0.18 + i * PITCH + dy, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.48, 0.26, 1.48]} />
            <meshStandardMaterial
              color={hot ? RED : CREAM}
              roughness={0.85}
              metalness={0}
              emissive={hot && lifted ? RED : '#000000'}
              emissiveIntensity={hot && lifted ? 0.30 : 0}
              transparent
              opacity={i === newest ? Math.min(1, t * 2.2) : 1}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export const SlabStack3D: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(49710) || frame >= f(93000)) return null;
  return <Rig><Slabs frame={frame} /></Rig>;
};

// ---- the screener board ----------------------------------------------------
const S_ROWS = 10, S_COLS = 5;
const CELL_W = 0.52, CELL_H = 0.17, GUT_X = 0.12, GUT_Y = 0.12;
const BOARD_W = S_COLS * CELL_W + (S_COLS - 1) * GUT_X;
const BOARD_H = S_ROWS * CELL_H + (S_ROWS - 1) * GUT_Y;

const Board: React.FC<{frame: number}> = ({frame}) => {
  const cells = [];
  for (let r = 0; r < S_ROWS; r++) {
    // rows build downward fast at the top of the film, one every 2 frames
    if (frame < f(400) + r * 2) continue;
    for (let c = 0; c < S_COLS; c++) {
      const isScore = c === S_COLS - 1;
      // the top three score cells go red on "stock research analysts" — the
      // ranked pick, which is the job the hook is describing
      const lit = isScore && r < 3 && frame >= f(2400) + r * 3;
      // UNIFORM widths; value is carried by FILL, the way the NO.031 bar chart
      // does emphasis. Variable widths made this scan as a bar chart.
      const val = isScore ? 0.92 : 0.34 + ((r * 7 + c * 13) % 5) * 0.15;
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
    // near-orthographic: a steeper yaw staggered the rows and destroyed the
    // grid read. Shallow tilt keeps depth and gets the rows back. Placed to
    // stop at 86%, clear of the footer.
    // Boxed into the FULL safe zone, not just the vertical one: x150-930 as
    // well as y220-1420. The right rail (like / comment / share / remix) is the
    // constraint nobody notices until the buttons land on the artwork.
    <group rotation={[-0.09, 0.26, 0]} position={[0, yForPct(57), 0]} scale={0.70}>
      <mesh position={[0, 0, -0.02]} receiveShadow>
        <boxGeometry args={[BOARD_W + 0.30, BOARD_H + 0.30, 0.10]} />
        <meshStandardMaterial color="#221F1B" roughness={1} metalness={0} />
      </mesh>
      {cells}
    </group>
  );
};

export const ScreenerBoard3D: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(400) || frame >= f(12000)) return null;
  return <Rig><Board frame={frame} /></Rig>;
};
