// KT hook segment — "The Council" 0–12.2s, built to vektor/docs/KT-MOTION-SPEC.md
// (motion grammar measured frame-by-frame from the Apple "2030" film).
// Laws encoded here:
//   - word entrances are 1-FRAME pops on exact caption frames (no fades/ramps)
//   - sentence surgery: lines build/edit in place; states hard-cut
//   - bg flips are the punctuation (ink -> cream -> red -> ink)
//   - hand-drawn red furniture BOILS: redraws every 5 frames, never repeating,
//     while set type stays pixel-frozen
//   - one sustained move only: the red blob wipe on "council." (~16f, ease-in
//     hard landing, zero overshoot)
//   - static camera. No springs, no bounce, no drift.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ClaudeMascot} from './scenes/ClaudeMascot';
import './style.css';

export const INK = '#101010';
export const CREAM = '#F4EFDF';
export const RED = '#E7371A';
const FPS = 30;
export const f = (ms: number) => Math.round((ms / 1000) * FPS);

// deterministic per-bucket jitter: same frame-bucket + id -> same shape,
// next bucket -> different shape (the boil)
export const jit = (seed: number, bucket: number, i: number) => {
  let h = (seed * 374761393 + bucket * 668265263 + i * 2246822519) >>> 0;
  h = (h ^ (h >> 13)) * 1274126177;
  h = (h ^ (h >> 16)) >>> 0;
  return (h % 1000) / 1000 - 0.5; // -0.5..0.5
};

export const useBucket = () => Math.floor(useCurrentFrame() / 5);

// ---- boiling marker furniture (SVG, overflow visible, sized by wrapper) ----
export const RoughRing: React.FC<{seed: number; color?: string}> = ({seed, color = RED}) => {
  const b = useBucket();
  const pts: string[] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rx = 54 + jit(seed, b, i) * 7;
    const ry = 40 + jit(seed + 7, b, i) * 6;
    pts.push(`${50 + Math.cos(a) * rx},${50 + Math.sin(a) * ry}`);
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', inset: '-26% -13%', width: '126%', height: '152%', overflow: 'visible',
        transform: `rotate(${-2 + jit(seed, b, 99) * 3}deg)`}}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={4.5}
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{strokeWidth: 9}} />
    </svg>
  );
};

export const RoughUnderline: React.FC<{seed: number; color?: string}> = ({seed, color = RED}) => {
  const b = useBucket();
  const pts: string[] = [];
  for (let i = 0; i <= 6; i++) {
    pts.push(`${(i / 6) * 100},${8 + jit(seed, b, i) * 8}`);
  }
  return (
    <svg viewBox="0 0 100 16" preserveAspectRatio="none"
      style={{position: 'absolute', left: '-2%', right: '-2%', bottom: -18, width: '104%', height: 22, overflow: 'visible'}}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2.2}
        strokeLinecap="round" style={{strokeWidth: 8}} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export const BurstTicks: React.FC<{seed: number; color?: string}> = ({seed, color = RED}) => {
  const b = useBucket();
  const ticks = [];
  const angles = [-160, -120, -60, -20, 20, 60, 120, 160];
  for (let i = 0; i < angles.length; i++) {
    const a = ((angles[i] + jit(seed, b, i) * 14) * Math.PI) / 180;
    const r1 = 58 + jit(seed + 3, b, i) * 6;
    const r2 = r1 + 14 + jit(seed + 5, b, i) * 8;
    ticks.push(
      <line key={i} x1={50 + Math.cos(a) * r1 * 0.9} y1={50 + Math.sin(a) * r1 * 0.62}
        x2={50 + Math.cos(a) * r2 * 0.9} y2={50 + Math.sin(a) * r2 * 0.62}
        stroke={color} strokeLinecap="round" style={{strokeWidth: 9}} vectorEffect="non-scaling-stroke" />
    );
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', inset: '-30% -18%', width: '136%', height: '160%', overflow: 'visible'}}>
      {ticks}
    </svg>
  );
};

export const RoughArrow: React.FC<{seed: number; color?: string}> = ({seed, color = RED}) => {
  // from upper-left, aiming at the word this wraps
  const b = useBucket();
  const j = (i: number, s: number) => jit(seed + s, b, i) * 6;
  const x1 = -60 + j(1, 0), y1 = -80 + j(2, 1), xm = -20 + j(3, 2), ym = -30 + j(4, 3), x2 = 2 + j(5, 4), y2 = -6 + j(6, 5);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', width: 10, height: 10}}>
      <polyline points={`${x1},${y1} ${xm},${ym} ${x2},${y2}`} fill="none" stroke={color}
        strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${x2 - 16},${y2 - 14} ${x2},${y2} ${x2 - 19},${y2 + 4}`} fill="none"
        stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ---- word: visible from its caption frame, 1-frame pop, no ramp ----
export type W = {t: string; ms: number; out?: number; size?: number; color?: string; caps?: boolean;
  ring?: number; underline?: number; burst?: number; arrow?: number; strike?: number;
  furnMs?: number; furnColor?: string; shuffle?: boolean; chaos?: boolean};

// rough cross-out through a word (the "fail." device)
export const RoughStrike: React.FC<{seed: number; color?: string}> = ({seed, color = RED}) => {
  const b = useBucket();
  const j = (i: number) => jit(seed, b, i) * 8;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{position: 'absolute', inset: '6% -4%', width: '108%', height: '88%', overflow: 'visible'}}>
      <polyline points={`${-2 + j(1)},${30 + j(2)} ${50 + j(3)},${52 + j(4)} ${102 + j(5)},${34 + j(6)}`}
        fill="none" stroke={color} strokeLinecap="round" style={{strokeWidth: 9}} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export const Word: React.FC<{w: W; base: number; baseColor: string}> = ({w, base, baseColor}) => {
  const frame = useCurrentFrame();
  if (frame < f(w.ms)) return null;
  if (w.out !== undefined && frame >= f(w.out)) return null;
  const furnOn = frame >= f(w.furnMs ?? w.ms);
  const text = w.caps ? w.t.toUpperCase() : w.t;
  // glyph-shuffle port (fx/glyph-shuffle.js): per-char wrong-until-right on
  // stepped holds, resolving left-to-right
  const SHUF = 'KXRZVMTQAENOSU';
  let body: React.ReactNode = text;
  if (w.shuffle) {
    const bb2 = Math.floor(frame / 4);
    body = text.split('').map((ch, i) => {
      const resolveF = f(w.ms) + 4 + i * 2;
      if (ch === ' ' || frame >= resolveF) return ch;
      return SHUF[Math.abs(Math.floor(jit(211 + i, bb2, i) * 1000)) % SHUF.length];
    }).join('');
  }
  // chaos-to-order port (fx/chaos-to-order.js): per-glyph jitter whose
  // amplitude decays to zero -- runs one way only
  if (w.chaos) {
    const d = 1 - Math.min(1, Math.max(0, (frame - f(w.ms)) / 10));
    body = text.split('').map((ch, i) => (
      <span key={i} style={{display: 'inline-block', whiteSpace: 'pre',
        transform: `translate(${jit(231, i, 1) * 110 * d}px, ${jit(237, i, 2) * 130 * d}px) rotate(${jit(241, i, 3) * 24 * d}deg)`}}>
        {ch}
      </span>
    ));
  }
  return (
    <span style={{position: 'relative', display: 'inline-block',
      fontSize: w.size ?? base, color: w.color ?? baseColor, whiteSpace: 'pre'}}>
      {body}
      {w.ring !== undefined && furnOn && <RoughRing seed={w.ring} color={w.furnColor} />}
      {w.underline !== undefined && furnOn && <RoughUnderline seed={w.underline} color={w.furnColor} />}
      {w.burst !== undefined && furnOn && <BurstTicks seed={w.burst} color={w.furnColor} />}
      {w.arrow !== undefined && furnOn && <RoughArrow seed={w.arrow} color={w.furnColor} />}
      {w.strike !== undefined && furnOn && <RoughStrike seed={w.strike} color={w.furnColor} />}
    </span>
  );
};

// a state = one live composition; rows of words building on fixed baselines
type Row = {words: W[]; size: number; gap?: number};
type S = {from: number; to: number; bg: string; type: string; rows: Row[]};

const STATES: S[] = [
  { // S1: hook line, ink ground
    from: 100, to: 2530, bg: INK, type: CREAM,
    rows: [{size: 84, words: [
      {t: 'Everyone ', ms: 100}, {t: 'uses ', ms: 630}, {t: 'Claude ', ms: 950},
      {t: 'like ', ms: 1420}, {t: 'a ', ms: 1740},
      {t: 'yes man,', ms: 1820, ring: 11, furnMs: 1900},
    ]}],
  },
  { // S2+S3 merged: one cream composition; the top line EDITS in place
    // while the 10% hero anchors the whole passage (no full-screen swap)
    from: 2530, to: 5760, bg: CREAM, type: INK,
    rows: [
      {size: 64, words: [
        {t: 'but ', ms: 2530, out: 4200}, {t: 'the ', ms: 2700, out: 4200},
        {t: 'top', ms: 2920, out: 4200}, {t: ' of users', ms: 3650, out: 4200},
        {t: 'do ', ms: 4200}, {t: 'this ', ms: 4340},
        {t: 'one', ms: 4620, ring: 31, furnMs: 4900}, {t: ' thing ', ms: 4830}, {t: 'instead.', ms: 5200},
      ]},
      {size: 300, words: [{t: '10%', ms: 3150, color: RED, burst: 23, furnMs: 3350}]},
    ],
  },
  { // S4: ink flip, the skill line (chip types below from 6660)
    from: 5760, to: 7530, bg: INK, type: CREAM,
    rows: [{size: 76, words: [
      {t: "There's ", ms: 5760}, {t: 'a ', ms: 6200}, {t: 'Claude ', ms: 6270},
      {t: 'skill ', ms: 6660}, {t: 'called ', ms: 6990}, {t: 'the...', ms: 7360},
    ]}],
  },
  { // S5+S6 merged: the RED passage. Custom-rendered (absolute layout):
    // "the council." lands on the wipe-complete frame, glides to the top
    // band at 8170 (the film's one other sustained move), and the question
    // line builds center beneath it. Rows are rendered by RedPassage.
    from: 7530, to: 9920, bg: RED, type: CREAM, rows: [],
  },
  { // S7+S8 merged: one ink composition, two in-place surgeries
    from: 9920, to: 13240, bg: INK, type: CREAM,
    rows: [
      {size: 54, words: [{t: 'you say', ms: 9920, out: 11770}]},
      {size: 104, words: [
        {t: 'ask ', ms: 10420, out: 11770}, {t: 'the ', ms: 10670, out: 11770},
        {t: 'council.', ms: 10920, out: 11770, arrow: 53, ring: 57, furnMs: 11400},
        {t: 'Claude ', ms: 11770, size: 72}, {t: 'then ', ms: 12340, size: 72},
        {t: 'spins ', ms: 12620, size: 72}, {t: 'up...', ms: 13050, size: 72},
      ]},
    ],
  },
  { // S9-S10: cream flip -- the troupe enters under the line and STAYS
    from: 13240, to: 18270, bg: CREAM, type: INK,
    rows: [
      {size: 88, words: [
        {t: 'five ', ms: 13240}, {t: 'AI ', ms: 13560}, {t: 'agents,', ms: 13730},
      ]},
      {size: 44, words: [
        {t: 'each ', ms: 14450}, {t: 'one ', ms: 14640}, {t: 'designed ', ms: 14880},
        {t: 'to ', ms: 15200}, {t: 'attack ', ms: 15350},
        {t: 'your problem', ms: 15680, ring: 61, furnMs: 16000},
      ]},
      {size: 44, words: [
        {t: 'from ', ms: 16340}, {t: 'a ', ms: 16580}, {t: 'completely ', ms: 16640},
        {t: 'different ', ms: 17240}, {t: 'angle.', ms: 17780},
      ]},
    ],
  },
  { // S11: agent 1 -- the contrary
    from: 18270, to: 21280, bg: CREAM, type: INK,
    rows: [
      {size: 92, words: [
        {t: 'First, ', ms: 18270}, {t: 'the contrary,', ms: 18720, color: RED},
      ]},
      {size: 44, words: [
        {t: 'it ', ms: 19460}, {t: 'only ', ms: 19590}, {t: 'looks ', ms: 19820},
        {t: 'for ', ms: 20120}, {t: 'what ', ms: 20300}, {t: 'will ', ms: 20560},
        {t: 'fail.', ms: 20850, strike: 71, furnMs: 20950},
      ]},
    ],
  },
  { // S12: agent 2 -- first principles
    from: 21280, to: 23620, bg: CREAM, type: INK,
    rows: [
      {size: 80, words: [
        {t: 'Second, ', ms: 21280}, {t: 'the first', ms: 21770, color: RED},
      ]},
      {size: 80, words: [{t: 'principles thinker.', ms: 22260, color: RED}]},
    ],
  },
  { // S13: the rebuild line
    from: 23620, to: 27370, bg: CREAM, type: INK,
    rows: [
      {size: 44, words: [
        {t: 'It ', ms: 23620}, {t: 'ignores ', ms: 23630}, {t: 'everything ', ms: 24030},
        {t: 'you ', ms: 24610}, {t: 'said', ms: 24780, strike: 81, furnMs: 25100},
      ]},
      {size: 56, words: [
        {t: 'and ', ms: 25040}, {t: 'rebuilds ', ms: 25280}, {t: 'the ', ms: 25750},
        {t: 'problem ', ms: 25890}, {t: 'from ', ms: 26240},
        {t: 'scratch.', ms: 26480, underline: 87, furnMs: 26650},
      ]},
    ],
  },
  { // S14: agent 3 -- the expansionist
    from: 27370, to: 30980, bg: CREAM, type: INK,
    rows: [
      {size: 84, words: [
        {t: 'Third, ', ms: 27370}, {t: 'the expansionist.', ms: 27820, color: RED},
      ]},
      {size: 44, words: [
        {t: 'It ', ms: 28710}, {t: 'finds ', ms: 28850}, {t: 'the ', ms: 29200},
        {t: 'upside', ms: 29340, ring: 91, furnMs: 29500}, {t: " you're ", ms: 29710}, {t: 'missing.', ms: 30100},
      ]},
    ],
  },
  { // S15: agent 4 -- the outsider
    from: 30980, to: 35930, bg: CREAM, type: INK,
    rows: [
      {size: 88, words: [
        {t: 'Fourth, ', ms: 30980}, {t: 'the outsider.', ms: 31480, color: RED},
      ]},
      {size: 44, words: [
        {t: 'It ', ms: 32240}, {t: 'strips ', ms: 32410}, {t: 'all ', ms: 32860},
        {t: 'your ', ms: 33010}, {t: 'context', ms: 33250, strike: 95, furnMs: 33500}, {t: ' and ', ms: 33730},
        {t: 'just ', ms: 33930}, {t: 'looks ', ms: 34200}, {t: 'at', ms: 34540},
      ]},
      {size: 52, words: [
        {t: 'the ', ms: 34680}, {t: 'raw problem.', ms: 34900, underline: 97, furnMs: 35400},
      ]},
    ],
  },
  { // S16: agent 5 -- the executor
    from: 35930, to: 39770, bg: CREAM, type: INK,
    rows: [
      {size: 92, words: [
        {t: 'Fifth, ', ms: 35930}, {t: 'the executor.', ms: 36510, color: RED},
      ]},
      {size: 44, words: [
        {t: 'It ', ms: 37400}, {t: 'only ', ms: 37440}, {t: 'cares ', ms: 37680},
        {t: 'about ', ms: 38020}, {t: 'what ', ms: 38370}, {t: 'to ', ms: 38630}, {t: 'do', ms: 38760},
      ]},
      {size: 64, words: [
        {t: 'right now.', ms: 38890, ring: 99, furnMs: 39100, color: RED},
      ]},
    ],
  },
  { // S17: ink flip -- the shuffle and the teardown
    from: 39770, to: 45850, bg: INK, type: CREAM,
    rows: [
      {size: 56, words: [
        {t: 'Then, ', ms: 39770}, {t: 'Claude ', ms: 40030}, {t: 'shuffles ', ms: 40440, shuffle: true},
        {t: 'all ', ms: 41040}, {t: 'five ', ms: 41180}, {t: 'answers', ms: 41450},
      ]},
      {size: 44, words: [
        {t: 'and ', ms: 42000}, {t: 'sends ', ms: 42160}, {t: 'them ', ms: 42420}, {t: 'to ', ms: 42640},
        {t: 'five ', ms: 43020}, {t: 'peer ', ms: 43280}, {t: 'review ', ms: 43550}, {t: 'agents', ms: 43960},
      ]},
      {size: 68, words: [
        {t: 'who ', ms: 44370}, {t: 'tear ', ms: 44590}, {t: 'each ', ms: 44840}, {t: 'one ', ms: 45110},
        {t: 'apart.', ms: 45350, strike: 103, furnMs: 45400, color: RED},
      ]},
    ],
  },
  { // S18: the chairman presides (mascot above the lines)
    from: 45850, to: 50070, bg: INK, type: CREAM,
    rows: [
      {size: 64, words: [
        {t: 'Finally, ', ms: 45850}, {t: 'a ', ms: 46450},
        {t: 'chairman', ms: 46510, ring: 107, furnMs: 46800, color: RED},
      ]},
      {size: 44, words: [
        {t: 'reads ', ms: 47050}, {t: 'the ', ms: 47390}, {t: 'entire ', ms: 47650}, {t: 'debate', ms: 48080},
      ]},
      {size: 56, words: [
        {t: 'and ', ms: 48560}, {t: 'gives ', ms: 48700}, {t: 'you ', ms: 48960}, {t: 'the ', ms: 49120},
        {t: 'final move.', ms: 49310, underline: 109, furnMs: 49800},
      ]},
    ],
  },
  { // S19+S20 merged: the VERDICT ACT lives on red from "You don't get an
    // answer," -- the chaos resolve gets its full read before the wipe
    from: 50070, to: 53280, bg: RED, type: CREAM,
    rows: [
      {size: 66, words: [
        {t: "You ", ms: 50070}, {t: "don't ", ms: 50350}, {t: 'get ', ms: 50570},
        {t: 'an ', ms: 50760}, {t: 'answer,', ms: 50880},
      ]},
      {size: 44, words: [{t: 'you get', ms: 51510}]},
      {size: 150, words: [{t: 'a verdict.', ms: 51820, chaos: true}]},
    ],
  },
  { // S21: end card -- CTA spoken word for word, shifted by the 0.7s breath
    from: 53280, to: 57110, bg: RED, type: CREAM,
    rows: [
      {size: 60, words: [{t: 'comment', ms: 53280}]},
      {size: 140, words: [{t: 'council', ms: 53640, underline: 113, furnMs: 53900, furnColor: CREAM}]},
      {size: 42, words: [
        {t: "and I'll send ", ms: 54130}, {t: 'the full skill ', ms: 54810},
        {t: 'to your DMs.', ms: 55560, color: 'rgba(244,239,223,0.9)'},
      ]},
    ],
  },
];

// ---- the radial council -----------------------------------------------------
// "attack your problem from a completely different angle" made literal: the
// problem plated at center, five agents around it, each firing a boiling red
// line INTO it from their own angle when introduced. Identity marks are
// hand-drawn glyphs in the marker voice. Previously-introduced agents hold a
// dim cream line; the ACTIVE agent's line is red.
type AgentSpec = {angle: number; delayMs: number; attackMs: number;
  mark: 'x' | 'gear' | 'up' | 'eye' | 'bolt'; react?: {kind: 'jawdrop' | 'celebrate' | 'gasp'; atMs: number}};
const R_CX = 540, R_CY = 1180; // plate center, px, y-down screen space
// explicit screen offsets (y-down): left-low, left-up, top, right-up, right-low
const AGENT_POS = [
  {dx: -370, dy: 190}, {dx: -310, dy: -220}, {dx: 0, dy: -350},
  {dx: 310, dy: -220}, {dx: 370, dy: 190},
];
const AGENTS: AgentSpec[] = [
  {angle: 0, delayMs: 13300, attackMs: 18270, mark: 'x', react: {kind: 'gasp', atMs: 18860}},
  {angle: 1, delayMs: 13470, attackMs: 21280, mark: 'gear', react: {kind: 'celebrate', atMs: 22260}},
  {angle: 2, delayMs: 13640, attackMs: 27820, mark: 'up', react: {kind: 'celebrate', atMs: 27820}},
  {angle: 3, delayMs: 13810, attackMs: 31480, mark: 'eye', react: {kind: 'gasp', atMs: 31480}},
  {angle: 4, delayMs: 13980, attackMs: 36510, mark: 'bolt', react: {kind: 'jawdrop', atMs: 36510}},
];
const agentPos = (a: AgentSpec) => ({
  x: R_CX + AGENT_POS[a.angle].dx,
  y: R_CY + AGENT_POS[a.angle].dy,
});

// hand-drawn identity mark, boiling, in the marker voice
const Mark: React.FC<{kind: AgentSpec['mark']; seed: number}> = ({kind, seed}) => {
  const b = useBucket();
  const j = (i: number) => jit(seed, b, i) * 3;
  const s = (d: string) => (
    <path d={d} fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  );
  const M = 40;
  return (
    <svg width={M} height={M} viewBox="0 0 40 40" style={{overflow: 'visible',
      transform: `rotate(${jit(seed, b, 9) * 8}deg)`}}>
      {kind === 'x' && s(`M${8 + j(1)} ${8 + j(2)} L${32 + j(3)} ${32 + j(4)} M${32 + j(5)} ${8 + j(6)} L${8 + j(7)} ${32 + j(8)}`)}
      {kind === 'gear' && <>
        {s(`M${20 + j(1)} ${6 + j(2)} V${13 + j(3)} M${20 + j(4)} ${27 + j(5)} V${34 + j(6)} M${6 + j(7)} ${20 + j(8)} H${13} M${27} ${20 + j(1)} H${34}`)}
        <circle cx={20 + j(2)} cy={20 + j(3)} r={7} fill="none" stroke={RED} strokeWidth={7} />
      </>}
      {kind === 'up' && s(`M${8 + j(1)} ${32 + j(2)} L${30 + j(3)} ${10 + j(4)} M${18 + j(5)} ${10 + j(6)} H${31} V${23 + j(7)}`)}
      {kind === 'eye' && <>
        {s(`M${4 + j(1)} ${20 + j(2)} Q${20 + j(3)} ${4 + j(4)} ${36 + j(5)} ${20 + j(6)} Q${20 + j(7)} ${36 + j(8)} ${4 + j(1)} ${20 + j(2)}`)}
        <circle cx={20 + j(4)} cy={20 + j(5)} r={5} fill={RED} />
      </>}
      {kind === 'bolt' && s(`M${22 + j(1)} ${5 + j(2)} L${12 + j(3)} ${22 + j(4)} H${20 + j(5)} L${16 + j(6)} ${35 + j(7)} L${29 + j(8)} ${17 + j(1)} H${21}`)}
    </svg>
  );
};

// boiling attack line from an agent toward the center plate; draws on over 8
// frames (decel, no overshoot) at attack time, red while active, dim after
const AttackLine: React.FC<{a: AgentSpec; i: number; activeUntilMs: number}> = ({a, i, activeUntilMs}) => {
  const frame = useCurrentFrame();
  const b = useBucket();
  if (frame < f(a.attackMs)) return null;
  const p = agentPos(a);
  const dx = R_CX - p.x, dy = R_CY - p.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  // start just off the mascot's edge; end ON the plate's edge (half-size
  // 190x62 + border) -- the first pass floated both ends
  const start = {x: p.x + ux * 62, y: p.y + uy * 62};
  const tEdge = Math.min(200 / Math.abs(ux || 1e-9), 74 / Math.abs(uy || 1e-9));
  const end = {x: R_CX - ux * tEdge, y: R_CY - uy * tEdge};
  const t = Math.min(1, (frame - f(a.attackMs)) / 8);
  const d = 1 - Math.pow(1 - t, 3); // decel, 0% overshoot
  const ex = start.x + (end.x - start.x) * d + jit(31 + i, b, 1) * 4;
  const ey = start.y + (end.y - start.y) * d + jit(31 + i, b, 2) * 4;
  const active = frame < f(activeUntilMs);
  return (
    <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}
      viewBox="0 0 1080 1920">
      <line x1={start.x + jit(37 + i, b, 3) * 3} y1={start.y + jit(37 + i, b, 4) * 3} x2={ex} y2={ey}
        stroke={active ? RED : 'rgba(16,16,16,0.28)'} strokeWidth={active ? 9 : 6} strokeLinecap="round" />
    </svg>
  );
};

// the troupe: five mascots on the cream stage from "five AI agents," onward.
// Subtle life comes from the rig itself (idle eye drift, landing squash).
const TROUPE = [
  {xPct: 18, delayMs: 13300, react: undefined as undefined | {kind: 'gasp' | 'celebrate' | 'jawdrop'; atFrame: number}},
  {xPct: 34, delayMs: 13520, react: undefined},
  {xPct: 50, delayMs: 13740, react: undefined},
  {xPct: 66, delayMs: 13960, react: undefined},
  {xPct: 82, delayMs: 14180, react: undefined},
];
// react.atFrame is RELATIVE to the sprite's entrance (rig: rt = t - atFrame,
// t = frame - delay) -- absolute frames fire ~14s late or never
const rel = (ms: number, i: number) => f(ms) - f(TROUPE[i].delayMs);
TROUPE[0].react = {kind: 'gasp', atFrame: rel(18860, 0)};      // the contrary announces
TROUPE[1].react = {kind: 'celebrate', atFrame: rel(22260, 1)}; // first principles
TROUPE[2].react = {kind: 'celebrate', atFrame: rel(27820, 2)}; // the expansionist
TROUPE[3].react = {kind: 'gasp', atFrame: rel(31480, 3)};      // the outsider
TROUPE[4].react = {kind: 'jawdrop', atFrame: rel(36510, 4)};   // the executor

// red blob wipe carrying S4 -> S5: pure mask growth, ease-in hard landing,
// 16 frames (~533ms), zero overshoot (measured from the reference)
const WIPE_START = f(7530) - 16; // blob is FULL-SCREEN on the cut frame --
const WIPE_LEN = 16;             // it swallows the outgoing headline instead
                                 // of the headline popping off mid-wipe
const easeInHard = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// H1: the yes-man cameo -- one mascot nodding along beside the hook line
const YesManCameo: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(500) || frame >= f(4500)) return null;
  // slide IN from frame-right (10f decel), slide OUT right (8f) at 4.2s --
  // never popping in or out of existence
  const inT = Math.min(1, (frame - f(500)) / 10);
  const outT = Math.min(1, Math.max(0, (frame - f(4200)) / 8));
  const slideX = 420 * Math.pow(1 - inT, 3) + 460 * (1 - Math.pow(1 - outT, 3));
  // THE NOD: obedient dip per hook word; frozen mid-nod when the ring slams
  const onsets = [630, 950, 1420, 1740, 1820].map(f);
  let nod = 0;
  if (frame >= f(2060)) {
    nod = frame < f(2800) ? 1 : 0;
  } else {
    for (const o of onsets) {
      const k = frame - o;
      if (k >= 0 && k < 8) { nod = k < 4 ? k / 4 : 1 - (k - 4) / 4; break; }
    }
  }
  const bubbleOn = (nod > 0.25 && frame < f(2800)) || (frame >= f(2060) && frame < f(2800));
  return (
    <AbsoluteFill style={{['--fg' as any]: INK}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${slideX}px)`}}>
        <div style={{position: 'absolute', inset: 0,
          transform: `translateY(${nod * 26}px) rotate(${nod * 4}deg)`,
          transformOrigin: '70% 66%'}}>
          <ClaudeMascot frames={KT_HOOK_FRAMES}
            config={{pose: 'pop', xPct: 50, yPct: 66, size: 170,
              delay: f(500), lookAt: {xPct: 50, yPct: 46}}} />
          {bubbleOn && (
            <div style={{position: 'absolute', left: '56%', top: '56.5%',
              background: CREAM, color: INK, fontSize: 34, padding: '10px 22px',
              borderRadius: 22, fontFamily: '"Printvetica", sans-serif'}}>
              yes.
              <div style={{position: 'absolute', left: 34, bottom: -12, width: 0, height: 0,
                borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
                borderTop: `14px solid ${CREAM}`}} />
            </div>
          )}
        </div>
      </div>
      {/* 2-frame red flash the instant the ring slams -- the 3s-window jolt */}
      {frame >= f(2060) && frame < f(2060) + 2 && (
        <AbsoluteFill style={{background: RED}} />
      )}
    </AbsoluteFill>
  );
};

// matte-wipe seam (faithful port of fx/matte-wipe.js, transition mode):
// oversized 2600x2400 rounded panels (r=400) sweep RIGHT->LEFT; two accents
// pass THROUGH (park 3000 -> -3000 over 16f, second +3f), the RED main
// follows (+6f, 2800 -> 0 over 12f) and STOPS as the new field. Content
// swaps on the cover frame (52490). Main equals the end-card ground, so the
// train unmounts invisibly once parked.
const MW = {park: 3000, through: -3000, mainFrom: 2800, sweep: 16, a2: 3, mainDelay: 6, mainDur: 12};
const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const MatteWipeSeam: React.FC = () => {
  const frame = useCurrentFrame();
  const T0 = f(53280) - MW.sweep; // cover lands ON the spoken 'comment'
  if (frame < T0 || frame >= T0 + 22) return null;
  const pos = (delay: number, fromX: number, toX: number, dur: number) => {
    const x = Math.min(1, Math.max(0, (frame - T0 - delay) / dur));
    return fromX + (toX - fromX) * easeIO(x);
  };
  const panel = (x: number, color: string, key: string, border?: string) => (
    <div key={key} style={{position: 'absolute', width: 2600, height: 2400, borderRadius: 400,
      left: 540 - 1300 + x, top: 960 - 1200, background: color,
      border: border ? `4px solid ${border}` : undefined}} />
  );
  return (
    <AbsoluteFill style={{overflow: 'hidden', zIndex: 5}}>
      {panel(pos(0, MW.park, MW.through, MW.sweep), CREAM, 'a1')}
      {panel(pos(MW.a2, MW.park, MW.through, MW.sweep), INK, 'a2', CREAM)}
      {panel(pos(MW.mainDelay, MW.mainFrom, 0, MW.mainDur), RED, 'main')}
    </AbsoluteFill>
  );
};

// zigzag-marquee outro (faithful port of fx/zigzag-marquee.js): 14 long
// repeated-word rows, x(row, f) = amp * tri(row/period - f/dur) -- ONE fold
// crease traveling down the stack. LAW: rowDelta = amp*4/period must stay
// under the double-space gap width (unit is "council  " for that reason).
const ztri = (u: number) => { const w = u - Math.floor(u); return w < 0.5 ? 4 * w - 1 : 3 - 4 * w; };
const ZigzagOutro: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(53600)) return null;
  const t = frame - f(53600);
  const fade = Math.min(1, t / 10);
  const rows = [];
  const AMP = 260, PERIOD = 13, DUR = 75, ROWS = 14, ROWH = 136;
  for (let ri = 0; ri < ROWS; ri++) {
    const x = AMP * ztri(ri / PERIOD - t / DUR);
    rows.push(
      <div key={ri} style={{position: 'absolute', whiteSpace: 'nowrap',
        top: ri * ROWH - 24, left: -700 + x, fontSize: 150, letterSpacing: 8,
        color: `rgba(244,239,223,${0.13 * fade})`}}>
        vektor  vektor  vektor  vektor  vektor  vektor
      </div>
    );
  }
  return <AbsoluteFill style={{overflow: 'hidden'}}>{rows}</AbsoluteFill>;
};

// the RED passage: council title lands, glides up, question builds beneath
const RedPassage: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(7530) || frame >= f(9920)) return null;
  // glide leads the question line by ~120ms so the title has cleared its
  // start position before "Instead" mounts (seam audit: collision at F05)
  const gt = Math.min(1, Math.max(0, (frame - f(8050)) / 15));
  const glide = 1 - Math.pow(1 - gt, 3); // 500ms decel, zero overshoot
  const q: W[] = [
    {t: 'Instead ', ms: 8170}, {t: 'of ', ms: 8580}, {t: 'asking ', ms: 8680},
    {t: 'Claude ', ms: 9020}, {t: 'a ', ms: 9350}, {t: 'question,', ms: 9420},
  ];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 870, textAlign: 'center',
        transform: `translateY(${-520 * glide}px)`, fontSize: 130, color: CREAM, lineHeight: 1.1}}>
        <span style={{position: 'relative', display: 'inline-block'}}>
          the council.
          {frame >= f(7800) && <RoughUnderline seed={41} color={CREAM} />}
        </span>
      </div>
      <div style={{position: 'absolute', left: 150, right: 150, top: 880, textAlign: 'center',
        fontSize: 60, color: CREAM, lineHeight: 1.2}}>
        {q.map((w, i) => <Word key={i} w={w} base={60} baseColor={CREAM} />)}
      </div>
    </AbsoluteFill>
  );
};

// H4: terminal chip typing the ask -- product flavor in the skill beat
const TerminalChip: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(6660) || frame >= f(10920)) return null;
  const full = '> ask the council';
  const n = Math.min(full.length, Math.floor((frame - f(6660)) / 2) + 1);
  return (
    <div style={{position: 'absolute', left: 540 - 260, top: 1150, width: 520, height: 92,
      background: INK, border: `3px solid ${CREAM}`, display: 'flex', alignItems: 'center',
      paddingLeft: 28, fontSize: 34, color: CREAM, letterSpacing: 1}}>
      {full.slice(0, n)}
      {frame % 16 < 8 && <span style={{marginLeft: 4, width: 16, height: 40, background: RED, display: 'inline-block'}} />}
    </div>
  );
};

// hybrid variant: the shuffle beat as Claude Code panes that physically
// shuffle, then get torn (struck through) by the reviewers
const PANE_LABELS = ['contrary', 'principles', 'expansionist', 'outsider', 'executor'];
const PANE_MARKS: AgentSpec['mark'][] = ['x', 'gear', 'up', 'eye', 'bolt'];
const PERMS = [
  [0, 1, 2, 3, 4], [3, 0, 4, 1, 2], [1, 4, 0, 2, 3], [4, 2, 3, 0, 1], [2, 3, 1, 4, 0],
];
const PaneShuffle: React.FC = () => {
  const frame = useCurrentFrame();
  const b = useBucket();
  const stepMs = [40440, 40770, 41100, 41430, 41760];
  let step = 0;
  for (let i = 0; i < stepMs.length; i++) if (frame >= f(stepMs[i])) step = i;
  const paneW = 176, gap = 16;
  const rowX0 = (1080 - 5 * paneW - 4 * gap) / 2;
  const slotX = (slot: number) => rowX0 + slot * (paneW + gap);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {PANE_LABELS.map((label, i) => {
        if (frame < f(40030)) return null;
        const prevSlot = PERMS[Math.max(0, step - 1)].indexOf(i);
        const slot = PERMS[step].indexOf(i);
        const t0 = f(stepMs[Math.min(step, stepMs.length - 1)]);
        const t = step === 0 ? 1 : Math.min(1, (frame - t0) / 8);
        const d = 1 - Math.pow(1 - t, 3);
        const x = slotX(prevSlot) + (slotX(slot) - slotX(prevSlot)) * d;
        const struckAt = f(44590 + i * 150);
        return (
          <div key={label} style={{position: 'absolute', left: x, top: 1010, width: paneW, height: 150,
            background: INK, border: `3px solid ${CREAM}`, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', rowGap: 8}}>
            <Mark kind={PANE_MARKS[i]} seed={61 + i} />
            <div style={{color: CREAM, fontSize: 20, letterSpacing: 1}}>{label}</div>
            {frame >= struckAt && (
              <svg style={{position: 'absolute', inset: -6, width: 'calc(100% + 12px)', height: 'calc(100% + 12px)', overflow: 'visible'}}
                viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1={-4 + jit(71 + i, b, 1) * 4} y1={102 + jit(71 + i, b, 2) * 4}
                  x2={104 + jit(71 + i, b, 3) * 4} y2={-2 + jit(71 + i, b, 4) * 4}
                  stroke={RED} strokeLinecap="round" style={{strokeWidth: 8}} vectorEffect="non-scaling-stroke" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const KTHook: React.FC<{variant?: 'radial' | 'hybrid'}> = ({variant = 'radial'}) => {
  const frame = useCurrentFrame();
  const state = STATES.find((s) => frame >= f(s.from) && frame < f(s.to)) ??
    (frame >= f(STATES[STATES.length - 1].from) ? STATES[STATES.length - 1] : STATES[0]);


  // the wipes overlay the tails of S4 and S19; the red bg then takes over
  const wipeAt = (start: number) => frame >= start && frame < start + WIPE_LEN
    ? easeInHard((frame - start) / WIPE_LEN) : frame >= start + WIPE_LEN ? 1 : 0;
  const wipe1 = wipeAt(WIPE_START);
  const wipe2 = wipeAt(f(50070) - 16);
  const showWipe = (wipe1 > 0 && frame < f(7530) + 4) || (wipe2 > 0 && frame < f(50070) + 4);
  const wipeT = frame < f(30000) ? wipe1 : wipe2;

  return (
    <AbsoluteFill style={{backgroundColor: state.bg, fontFamily: '"Printvetica", "Helvetica Neue", sans-serif'}}>
      {showWipe && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{width: 2600 * wipeT, height: 2600 * wipeT, borderRadius: '50%',
            background: RED, transform: `scale(1, ${1 - wipeT * 0.04})`}} />
        </AbsoluteFill>
      )}
      <ZigzagOutro />
      <AbsoluteFill style={{alignItems: 'center',
        justifyContent: (state.from >= 13240 && state.from < 39770) ||
          (variant === 'hybrid' && state.from === 39770) ? 'flex-start' : 'center',
        paddingTop: 0,
        flexDirection: 'column', rowGap: 40,
        padding: state.from >= 13240 && state.from < 39770 ? '240px 150px 0'
          : state.from === 45850 ? '520px 150px 0'
          : variant === 'hybrid' && state.from === 39770 ? '300px 150px 0'
          : '0 150px',
        textAlign: 'center'}}>
        {state.rows.map((row, ri) => (
          <div key={`${state.from}-${ri}`} style={{lineHeight: 1.14}}>
            {row.words.map((w, wi) => (
              <Word key={wi} w={w} base={row.size} baseColor={state.type} />
            ))}
          </div>
        ))}
      </AbsoluteFill>
      <YesManCameo />
      <RedPassage />
      <MatteWipeSeam />
      <TerminalChip />
      {/* THE RADIAL COUNCIL: problem plated at center, five agents around it,
          attack lines firing from each angle as agents are introduced */}
      {frame >= f(13300) && frame < f(39770) && (
        <AbsoluteFill style={{['--fg' as any]: INK}}>
          {AGENTS.map((a, i) => (
            <AttackLine key={`l${i}`} a={a} i={i}
              activeUntilMs={i < AGENTS.length - 1 ? AGENTS[i + 1].attackMs : 39770} />
          ))}
          {frame >= f(14900) && (
            <div style={{position: 'absolute', left: R_CX - 190, top: R_CY - 62, width: 380, height: 124,
              background: INK, border: `3px solid ${CREAM}`, display: 'flex',
              alignItems: 'center', justifyContent: 'center'}}>
              <span style={{color: CREAM, fontSize: 40}}>your problem.</span>
            </div>
          )}
          {AGENTS.map((a, i) => {
            const p = agentPos(a);
            return (
              <React.Fragment key={i}>
                <ClaudeMascot frames={KT_HOOK_FRAMES}
                  config={{pose: 'pop', xPct: (p.x / 1080) * 100, yPct: (p.y / 1920) * 100, size: 96,
                    delay: f(a.delayMs),
                    react: a.react ? {kind: a.react.kind, atFrame: f(a.react.atMs) - f(a.delayMs)} : undefined,
                    lookAt: {xPct: 50, yPct: (R_CY / 1920) * 100}}} />
                {frame >= f(a.attackMs) && (
                  <div style={{position: 'absolute', left: p.x - 20, top: p.y - 108}}>
                    <Mark kind={a.mark} seed={81 + i} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </AbsoluteFill>
      )}
      {/* hybrid: the shuffle beat as physically-shuffling Claude Code panes */}
      {variant === 'hybrid' && frame >= f(39770) && frame < f(45850) && <PaneShuffle />}
      {/* the chairman, presiding above the closing argument */}
      {frame >= f(46510) && frame < f(50070) && (
        <AbsoluteFill style={{['--fg' as any]: INK}}>
          <ClaudeMascot frames={KT_HOOK_FRAMES}
            config={{pose: 'pop', xPct: 50, yPct: 22, size: 132,
              delay: f(46510), lookAt: {xPct: 50, yPct: 48},
              react: {kind: 'jawdrop', atFrame: f(49310) - f(46510)}}} />
        </AbsoluteFill>
      )}
      {/* light furniture */}
      <div style={{position: 'absolute', top: 52, left: 44, fontSize: 40, fontWeight: 600,
        color: state.bg === CREAM ? INK : CREAM, fontFamily: '"Inter Tight", sans-serif'}}>vektor</div>
      <div style={{position: 'absolute', bottom: 72, left: 44, fontSize: 22, letterSpacing: 3,
        color: state.bg === CREAM ? 'rgba(16,16,16,0.45)' : 'rgba(244,239,223,0.35)'}}>vektor /// the council</div>
      <div style={{position: 'absolute', bottom: 72, right: 44, fontSize: 22, letterSpacing: 3,
        color: state.bg === CREAM ? 'rgba(16,16,16,0.45)' : 'rgba(244,239,223,0.35)'}}>comment. council.</div>
    </AbsoluteFill>
  );
};

export const KT_HOOK_FRAMES = f(57110);
