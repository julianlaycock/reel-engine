// NO. 036 "graphify" — KT-Remotion.
//
// The film's argument, and therefore its visual spine: Claude Code re-learns a
// codebase every session, and Graphify replaces that re-reading with one
// queryable map. So the film moves from REPETITION (a grid that fills the same
// way every session) to EVIDENCE (two real captures: the repo page and OUR OWN
// graph of OUR OWN engine) to a RECEIPT (two token bars whose ratio we measured
// ourselves) to a CORRECTION (the viral 70x, struck through, because the repo
// never claims it — facts.md).
//
// Every number on screen is either spoken by the take or carried by a capture
// of the page that owns it. The one drawn quantity (the token bars) is our own
// measurement, stated as "about", and its bar lengths are the true ratio.
//
// Locked taste rulings carried from NO. 026 / 027 / 033 / 034 / 035, held here:
//   - no glyph-scramble anywhere
//   - visualisations enter EARLY and hold LONG
//   - text on viz beats sits top, never touching the viz
//   - everything cuts on exact frames; nothing fades across a seam
//   - one anchor per beat: the type block never moves mid-beat
//
// Field plan: ink -> ink (paragraph cut, 7.20s) -> cream (13.36s) -> red
// (30.32s) -> ink (40.00s) -> cream (50.56s) -> red (61.76s). The rotation law
// is that a film does not repeat its predecessor; NO. 035 ran ink -> red ->
// cream -> ink -> cream -> red. Red carries the two beats that cost the viewer
// something: our own run (the receipts they are asked to trust) and the CTA.
import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f, Word} from './KTHook';
import {NO036_BEATS, NO036_END_MS} from './KTNo036Words';
import {gap, FAMILY, WORDMARK, ROLES, MARGIN_X, COLUMN_W, SAFE, FIELD, TEXT_ON,
  ENTER_MS, DETAIL_MS, TRAVEL_PX, WIPE, PLATE_TOP,
  CAPTURE_SCROLL_PX_PER_SEC} from './kt/system';
import {MatteWipe, ZigzagMarquee} from './KTSeams';
import {Odometer} from './KTEffects';
import {G_NODES, G_EDGES, G_HUB_EDGE, G_PATH, GRAPH_VB} from './KTNo036Graph';
import {ClaudeMascot} from './scenes/ClaudeMascot';
import './style.css';

export const KT_NO036_FRAMES = f(NO036_END_MS);

const FONT = FAMILY.display;
const FONT_UI = FAMILY.ui;
const FONT_MONO = FAMILY.mono;

// NO. 034's ruling, redeclared from the canon exactly as NO. 035 does: pure
// E7371A cannot carry text at 4.5:1, so the FIELD is the 5% deeper red.
const WHITE = TEXT_ON.redDeep;
const RED_DEEP = FIELD.redDeep;

const LABEL_C = 'rgba(16,16,16,0.62)';    // on cream — 5.07:1
const LABEL_I = 'rgba(244,239,223,0.55)'; // on ink   — 5.57:1
const HAIR_C = 'rgba(16,16,16,0.28)';
const HAIR_I = 'rgba(244,239,223,0.26)';
const WASH_C = 'rgba(16,16,16,0.08)';
const WASH_I = 'rgba(244,239,223,0.10)';
const RULE_R = 'rgba(255,255,255,0.5)';

const FOOTER_ON: Record<string, string> = {[CREAM]: LABEL_C, [RED_DEEP]: WHITE, [INK]: LABEL_I};
const WORDMARK_ON: Record<string, string> = {[CREAM]: INK, [RED_DEEP]: CREAM, [INK]: CREAM};

const asField = (c: string) => (c === RED ? RED_DEEP : c);

// A plate paints itself for the field it lands on (NO. 035's pattern, kept
// shape-for-shape so check-contrast can parse the arms).
type FieldPalette = {text: string; label: string; hair: string; wash: string; accent: string};
const onField = (bg: string): FieldPalette =>
  bg === CREAM ? {text: INK, label: LABEL_C, hair: HAIR_C, wash: WASH_C, accent: RED_DEEP}
  : bg === RED_DEEP ? {text: WHITE, label: WHITE, hair: RULE_R, wash: WASH_I, accent: WHITE}
  : {text: CREAM, label: LABEL_I, hair: HAIR_I, wash: WASH_I, accent: RED_DEEP};

const UI = {s: ROLES.label.size, m: ROLES.slug.size, l: ROLES.wordmark.size};
const TRACK = {label: ROLES.label.tracking, slug: ROLES.slug.tracking};
const ENTER = ENTER_MS;
const DETAIL = DETAIL_MS;
const TRAVEL = TRAVEL_PX;

const VIZ_L = MARGIN_X, VIZ_W = COLUMN_W;

const TYPE_BAND_TOP = WORDMARK.y + ROLES.wordmark.size;
const TYPE_BAND_H = PLATE_TOP - TYPE_BAND_TOP;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const decel = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const prog = (frame: number, fromMs: number, durMs: number) =>
  clamp01((frame - f(fromMs)) / Math.max(1, f(durMs)));

const Window: React.FC<{fromMs: number; toMs: number; children: React.ReactNode}> =
  ({fromMs, toMs, children}) => {
    const frame = useCurrentFrame();
    if (frame < f(fromMs) || frame >= f(toMs)) return null;
    return <>{children}</>;
  };

const lineWidthSpacer = (w: {t: string; caps?: boolean; size?: number}, base: number) => (
  <span aria-hidden style={{visibility: 'hidden', fontSize: w.size ?? base, whiteSpace: 'pre'}}>
    {w.caps ? w.t.toUpperCase() : w.t}
  </span>
);

// ═══ THE HERO — GraphAssembly (novelty law, 2026-08-18) ══════════════════════
// THIS ENGINE'S REAL GRAPH: the 110 highest-degree nodes and 356 edges of the
// Graphify graph built from reel-engine on 2026-08-18 (KTNo036Graph.ts, seeded
// layout, no randomness at render time). One device, two states, and the film's
// whole thesis between them:
//
//   S1 `dissolve` — the graph is WHOLE at frame 0 (the frame-0 payoff, alive
//   with a slow deterministic breath), then falls apart as the voice says the
//   mental model is rebuilt from scratch: nodes drift off their edges in
//   reverse assembly order and are gone by "knew yesterday". What the viewer
//   loses is what Claude loses.
//
//   S2 `assemble` — the same graph grows back, hub outward in BFS order, while
//   the voice says "scans your codebase once and builds a knowledge graph".
//   Edges draw on as their endpoints arrive. It ends whole and stays.
//
// The dissolve order is the assembly order REVERSED: leaves vanish first, the
// hub dies last — knowledge erodes from the edges in. Both states end inside
// the plate band (860 -> 1420): height is capped at 560 and the SVG scales.
const DISSOLVE_FROM = 5120;    // "rebuilds"
const DISSOLVE_TO = 12430;     // "knew yesterday."
const ASSEMBLE_FROM = 22000;   // the repo shot ends; "Every function, every connection"
const ASSEMBLE_TO = 27500;     // whole just before the trace
const N = G_NODES.length;

// THE QUERY TRACE (founder, 2026-08-18: the second showing must earn itself).
// At "can query" the REAL route lights hop by hop: Captions() -> Video.tsx
// (which is also the graph's hub) -> SceneBody(). render-video.mjs shares no
// AST edge with src/ — that path truly does not exist, so the film does not
// draw it (facts.md).
const TRACE_AT = 27980;        // "query,"
const TRACE_HOP_MS = 550;      // slow enough to be FOLLOWED (motion judge v1)
const PATH_NODE = new Set(G_PATH);

const GraphAssembly: React.FC<{field: string; state: 'dissolve' | 'assemble'}> =
  ({field, state}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const ms = (frame / 30) * 1000;
  const cx = GRAPH_VB.x + GRAPH_VB.w / 2, cy = GRAPH_VB.y + GRAPH_VB.h / 2;

  // Per-node kinematics, computed ONCE per frame and shared by edges, discs
  // and labels so everything moves together (motion judge v1: nodes flew while
  // their edges stayed anchored, and arrivals faded in place instead of
  // flying). Every position is deterministic in `frame`.
  //
  // Hook opens on an ASSEMBLY BURST (founder, 2026-08-18: "way more dynamic"):
  // ~35% of the graph is up at frame 0 and the rest FLIES IN radially with a
  // tangential curl over the first ~1.7s — the film's largest motion, first.
  // Deaths are 1.4s throws (radial + swirl), and nodes hold near-full ink for
  // the first two thirds of the flight so the throw is SEEN, not inferred.
  const P = G_NODES.map((n) => {
    const o = n.o;
    let intro = 1;
    let death = 1;
    if (state === 'assemble') {
      const at = ASSEMBLE_FROM + (o / N) * (ASSEMBLE_TO - ASSEMBLE_FROM - 400);
      intro = decel(clamp01((ms - at) / 400));
    } else {
      const frac = o / N;
      intro = frac <= 0.35 ? 1
        : decel(clamp01((ms - ((frac - 0.35) / 0.65) * 1400) / 320));
      // The hub is the LAST SURVIVOR: it holds the frame, pulsing harder as
      // everything else dies, and is still alive AT the cut — the wipe takes
      // it (motion judge v2: killing it at 12.8s left dead canvas).
      const at = o === 0 ? Infinity
        : DISSOLVE_FROM + ((N - 1 - o) / N) * (DISSOLVE_TO - DISSOLVE_FROM - 1400);
      death = 1 - decel(clamp01((ms - at) / 1400));
    }
    const l = Math.min(intro, death);
    const dx = n.x - cx, dy = n.y - cy;
    const d = Math.sqrt(dx * dx + dy * dy) + 1e-3;
    const bAmp = state === 'dissolve' ? 6 : 2.2;
    let x = n.x + Math.sin(frame / 29 + o * 1.7) * bAmp;
    let y = n.y + Math.cos(frame / 33 + o * 2.3) * bAmp;
    if (state === 'dissolve') {
      const arr = 1 - intro;   // arrival: in from beyond the rim, curling
      x += (dx / d) * arr * 420 - (dy / d) * arr * 160;
      y += (dy / d) * arr * 420 + (dx / d) * arr * 160;
      const thr = 1 - death;   // death: thrown out with the opposite swirl
      x += (dx / d) * thr * 420 + (dy / d) * thr * 200;
      y += (dy / d) * thr * 420 - (dx / d) * thr * 200;
    }
    // Visible WHILE flying: full ink until two thirds of the flight is done.
    const op = clamp01(l / 0.35);
    return {x, y, l, op};
  });

  // The whole structure LIVES: slow continuous rotation + swell across the
  // hook, accelerating slightly as it dies. Deterministic, dissolve only —
  // the assemble state stays still so the query trace reads.
  const beatT = clamp01(ms / 13360);
  const rot = state === 'dissolve'
    ? -2 + 6 * beatT + 5 * decel(clamp01((ms - DISSOLVE_FROM) / 7310))
    : 0;
  const scl = state === 'dissolve' ? 1 + 0.09 * beatT : 1;

  // Trace choreography (motion judge v1: it snapped in whole). The field dims
  // FIRST over 300ms, then the route draws hop by hop at a pace the eye can
  // follow, each ring landing as its hop arrives.
  const dimP = state === 'assemble' ? decel(clamp01((ms - (TRACE_AT - 300)) / 300)) : 0;

  return (
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP - 160, width: VIZ_W,
      height: 720, display: 'flex', justifyContent: 'center'}}>
      {/* The graph FILLS its band (design judge, 2026-08-18: at 290px wide it
          read as a speckle, not a hero). Enlarged 560 -> 720 and raised 160px
          toward the optical centre: at frame 0 the old band left the top half
          of the phone empty (stills judge v1) — the hook must own the frame. */}
      <svg viewBox={`${GRAPH_VB.x} ${GRAPH_VB.y} ${GRAPH_VB.w} ${GRAPH_VB.h}`}
        preserveAspectRatio="xMidYMid meet"
        style={{width: '100%', height: '100%'}}>
        <g transform={`translate(${cx},${cy}) scale(${scl}) rotate(${rot}) translate(${-cx},${-cy})`}>
        {G_EDGES.map(([a, b], i) => {
          const op = Math.min(P[a].op, P[b].op);
          if (op <= 0) return null;
          // Hub-incident edges are the SPOKE BURST — heavier and brighter, so
          // the centre reads as the centre at phone scale (design judge pass 5).
          const spoke = G_HUB_EDGE[i];
          // During the trace everything off-route steps back HARD and the
          // spoke burst surrenders its red — 40 faint red spokes buried the
          // lit route (trace pass). The step-back RAMPS over 300ms (motion
          // judge v1: a binary dim read as a jump cut inside the beat).
          const decay = state === 'dissolve'
            ? 1 - 0.55 * decel(clamp01((ms - DISSOLVE_FROM) / 6000)) : 1;
          const dim = (1 - 0.85 * dimP) * decay;
          // Edges follow their DISPLACED endpoints: they stretch with flying
          // nodes and snap out when an endpoint dies (motion judge v1).
          return (
            <line key={i} x1={P[a].x} y1={P[a].y}
              x2={P[b].x} y2={P[b].y}
              stroke={spoke && dimP < 0.5 ? pal.accent : pal.text}
              strokeWidth={spoke ? 3 : 2} opacity={(spoke ? 0.6 : 0.45) * op * dim} />
          );
        })}
        {G_NODES.map((n, i) => {
          const {x, y, l, op} = P[i];
          if (op <= 0) return null;
          const isHub = n.o === 0;
          // The hub PULSES — subtle at rest, urgent once it is the last thing
          // alive (amplitude grows over the dissolve's final 2.4s).
          const urgency = state === 'dissolve' ? clamp01((ms - 11000) / 2400) : 0;
          const pulse = isHub ? 1 + (0.05 + 0.12 * urgency) * Math.sin(frame / 5) : 1;
          const nodeDim = PATH_NODE.has(i) ? 1 : 1 - 0.6 * dimP;
          return (
            <circle key={i} cx={x} cy={y}
              r={n.r * (0.75 + 0.25 * l) * pulse}
              fill={isHub ? pal.accent : pal.text} opacity={op * nodeDim} />
          );
        })}
        {/* The trace: each hop draws on over TRACE_HOP_MS, in order, then the
            path nodes ring. Assemble state only. */}
        {state === 'assemble' ? G_PATH.slice(0, -1).map((a, k) => {
          const b = G_PATH[k + 1];
          const tp = decel(clamp01((ms - (TRACE_AT + k * TRACE_HOP_MS)) / TRACE_HOP_MS));
          if (tp <= 0) return null;
          const A = G_NODES[a], B = G_NODES[b];
          return (
            <g key={`p${k}`}>
              <line x1={A.x} y1={A.y}
                x2={A.x + (B.x - A.x) * tp} y2={A.y + (B.y - A.y) * tp}
                stroke={pal.accent} strokeWidth={20} strokeLinecap="round" opacity={0.22} />
              <line x1={A.x} y1={A.y}
                x2={A.x + (B.x - A.x) * tp} y2={A.y + (B.y - A.y) * tp}
                stroke={pal.accent} strokeWidth={9} strokeLinecap="round" opacity={0.95} />
            </g>
          );
        }) : null}
        {state === 'assemble' ? G_PATH.map((i, k) => {
          const lit = decel(clamp01((ms - (TRACE_AT + k * TRACE_HOP_MS - 120)) / 240));
          if (lit <= 0) return null;
          const n = G_NODES[i];
          return (
            <circle key={`pr${k}`} cx={n.x} cy={n.y} r={n.r + 8 + 4 * lit}
              fill="none" stroke={pal.accent} strokeWidth={4} opacity={lit} />
          );
        }) : null}
        </g>
        {/* THE NAMES ARE THE POINT (founder, 2026-08-18): nine real file
            basenames from the graph data, so the structure reads as THIS
            codebase and not abstract dots. They die and return with their
            nodes — losing the names IS losing the knowledge. */}
        {G_NODES.map((n, i) => {
          if (!n.label) return null;
          const {l} = P[i];
          if (l <= 0) return null;
          const left = n.x > (GRAPH_VB.x + GRAPH_VB.w * 0.62);
          const tx = n.x + (left ? -(n.r + 26) : n.r + 26);
          const bw = n.label.length * 22 + 18;
          // Off-route labels dim WITH their nodes during the trace — full-black
          // labels out-contrasted the red route (trace pass 2). The dim RAMPS
          // with dimP. During the dissolve a label vanishes the moment its own
          // node starts flying (v1: plates hung over departed nodes).
          // 1500ms, snapped at 0.15: the 2500ms tail left 20%-opacity ghost
          // labels smudging the dissolve at pause (stills judge v2).
          const rawFade = 1 - decel(clamp01((ms - DISSOLVE_FROM) / 1500));
          const labelDim = state === 'dissolve'
            ? (rawFade < 0.15 ? 0 : rawFade)
            : (PATH_NODE.has(i) ? 1 : 1 - 0.75 * dimP);
          const anchored = state === 'dissolve' ? (l > 0.92 ? 1 : 0) : 1;
          return (
            <g key={`t${i}`} opacity={(l > 0.65 ? 1 : 0) * labelDim * anchored}>
              {/* A field-coloured plate under each label: halo alone lost to
                  edge clutter near the hub (trace pass). */}
              <rect x={left ? tx - bw : tx - 8} y={n.y - 22} width={bw} height={54}
                fill={field === RED ? RED_DEEP : field} opacity={0.88} rx={4} />
              <text x={tx} y={n.y + 12}
                textAnchor={left ? 'end' : 'start'}
                /* Labels SNAP, never fade: a mid-fade label reads as a defect
                   on any paused frame (labels pass 3). Visible means crisp.
                   40px: at the svg's effective scale 34 landed ~25px on the
                   phone, under the 40px floor (stills judge v1). */
                style={{fontFamily: FONT_MONO, fontSize: 40, fill: pal.text}}>
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const GraphDissolve: React.FC<{field: string}> = ({field}) =>
  <GraphAssembly field={field} state="dissolve" />;
const GraphRebuild: React.FC<{field: string}> = ({field}) =>
  <GraphAssembly field={field} state="assemble" />;

// ═══ THE CAPTURES ════════════════════════════════════════════════════════════
// CANON, founder 2026-08-17: a film that RECOMMENDS a repo must show a real
// capture of it, scrolling — never a drawn card.
//
// Shot 1: github.com/Graphify-Labs/graphify, captured 2026-08-18 at 1080x3160
// with scripts/capture-url.mjs. GitHub's own star count is on the page (108k
// header / 107.7k sidebar) against the voice's "107,000" — the same floor-vs-
// page rounding NO. 035 shipped, and the page owns the number.
//
// The static capture of our own graph was CUT (founder scrub, 2026-08-18:
// "makes no sense and looks bad" — a dark screenshot fighting the palette,
// showing what the animated hero already shows better). Its beat is now the
// terminal replay below. The repo capture stays: canon requires the
// recommended repo shown as a real capture.
const SHOTS: {from: number; to: number; src: string; imgH: number; scroll: boolean}[] = [
  {from: 16560, to: 22000, src: 'screens/no036-graphify-repo.png', imgH: 3160, scroll: true},
];

// The star pill on the capture, measured in original 1080x3160 pixel space
// (subagent read, 2026-08-18): "Star 108k" at (932, 87, 114x29). The VO's
// "107,000 stars" lands at 16560 — the exact frame the shot cuts in — so the
// ring draws immediately and rides the scroll with its pixel. Without it the
// load-bearing number was unhighlighted 15px chrome (stills judge v1).
const STAR_PILL = {x: 932, y: 87, w: 114, h: 29};
const STAR_RING_AT = 16700;
// The pill sits at y=87 in the capture — inside IG's top-220 chrome zone. The
// capture therefore enters PUSHED DOWN 240px (pill lands at y~327, safe band),
// HOLDS there while the ring draws and the VO lands "107,000 stars", then the
// scroll runs (stills judge v2: the proof was under platform chrome and had
// scrolled away by the time the claim landed).
const STAR_HOLD_MS = 1900;
const ShotPlate: React.FC<{shot: (typeof SHOTS)[number]}> = ({shot}) => {
  const frame = useCurrentFrame();
  const shotSec = (shot.to - shot.from) / 1000;
  const drop = shot.scroll ? 240 : 0;
  const scrollDur = Math.max(1, f(shot.to - shot.from) - f(STAR_HOLD_MS));
  const t = shot.scroll
    ? decel(clamp01((frame - f(shot.from) - f(STAR_HOLD_MS)) / scrollDur))
    : 0;
  const travel = shot.scroll
    ? drop + Math.min(shot.imgH - 1920, CAPTURE_SCROLL_PX_PER_SEC * shotSec)
    : 0;
  const top = drop - travel * t;
  const ringP = shot.scroll ? decel(prog(frame, STAR_RING_AT, 400)) : 0;
  const pad = 16;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: INK}}>
      <Img src={staticFile(shot.src)}
        style={{position: 'absolute', left: 0, top, width: 1080}} />
      {ringP > 0 ? (
        <div style={{position: 'absolute',
          left: STAR_PILL.x - pad, top: STAR_PILL.y - pad + top,
          width: STAR_PILL.w + pad * 2, height: STAR_PILL.h + pad * 2,
          border: `6px solid ${RED_DEEP}`, borderRadius: 34,
          opacity: ringP, transform: `scale(${1.25 - 0.25 * ringP})`}} />
      ) : null}
    </AbsoluteFill>
  );
};

// ═══ S3 — THE RUN, REPLAYED ══════════════════════════════════════════════════
// The founder cut the static graph screenshot; this beat is now a REPLAY of
// the terminal session we actually ran on 2026-08-18 (facts.md) — commands
// type, real output lines land on the words that speak them. Constant motion,
// zero decoration: every line is the tool's own stdout.
const TERM_LINES: {at: number; kind: 'cmd' | 'out'; text: string; typeMs?: number}[] = [
  {at: 30320, kind: 'cmd', text: 'graphify update .', typeMs: 900},
  {at: 32080, kind: 'out', text: '196/196 files scanned'},
  {at: 34530, kind: 'out', text: '1,764 nodes -> graph.json'},
  {at: 36660, kind: 'cmd', text: 'graphify query "how do captions connect to the render pipeline?"', typeMs: 2100},
  {at: 39300, kind: 'out', text: 'answered in a ~2,000-token budget'},
];
const RunTerminal: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const ms = (frame / 30) * 1000;
  // The entrance BEGINS as the matte wipe clears (tail = 6fr / 200ms) — v2
  // showed the old entrance finishing UNDER the matte, so the panel popped.
  const p = decel(prog(frame, 30320 + 200, 260));
  const caret = Math.floor(frame / 8) % 2 === 0;
  const live = TERM_LINES.filter((L) => ms >= L.at);
  return (
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP, width: VIZ_W,
      opacity: p, transform: `translateY(${(1 - p) * TRAVEL}px)`}}>
      {/* No minHeight: the panel GROWS as each line lands \u2014 the growth is the
          beat's motion, and an empty 380px cell read as dead space (v1). */}
      <div style={{background: pal.wash, border: `2px solid ${pal.hair}`,
        padding: `${gap('m')}px ${gap('m')}px`}}>
        {live.map((L, li) => {
          const isLast = li === live.length - 1;
          const typed = L.kind === 'cmd'
            ? Math.round(L.text.length * clamp01((ms - L.at) / (L.typeMs ?? 800)))
            : L.text.length;
          return (
            <div key={L.at} style={{fontFamily: FONT_MONO, fontSize: UI.m,
              color: L.kind === 'cmd' ? pal.text : pal.label,
              lineHeight: 1.5, overflowWrap: 'break-word'}}>
              {L.kind === 'cmd' ? <span style={{color: pal.label}}>$ </span> : null}
              {L.text.slice(0, typed)}
              {isLast && caret ? <span style={{opacity: 0.8}}>{'\u258c'}</span> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══ S4 — THE TOKEN BARS ═════════════════════════════════════════════════════
// The one drawn quantity in the film, and it is OUR OWN measurement (facts.md,
// 2026-08-18): ~27,000 tokens to read the six files that answer the question,
// 2,000 from the graph. Bar lengths are the true ratio (2000/27184 ≈ 7.4%), and
// the numbers tick up with an Odometer on the words that speak them.
const BAR_A_AT = 42800;   // "27,000"
const BAR_B_AT = 45950;   // "2,000"
const BAR_H = 96;
const TokenBars: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  // 500ms fill with a 2% overshoot-settle: DETAIL-length fills completed
  // inside one strip step and read as a pop (motion judge v2). The number
  // still SNAPS whole on its word — no count-up: ticking through 9,000/18,000
  // while the voice says 27,000 is the exact defect the arrive-whole law was
  // written against (design judge, 2026-08-18; NO. 035's card lesson).
  const fill = (at: number) => {
    const q = decel(prog(frame, at, 500));
    return q * (1 + 0.02 * Math.sin(Math.PI * q));
  };
  const growA = fill(BAR_A_AT);
  const growB = fill(BAR_B_AT);
  // The row FRAME (eyebrow, then its hairline track 250ms later) pre-arrives
  // on the clause that introduces it, so the beat is never an empty plate
  // (motion judge v1 caught 2.8s of nothing at 40.0–42.8s).
  const lblA = decel(prog(frame, 40600, ENTER));
  const trkA = decel(prog(frame, 40850, ENTER));
  const lblB = decel(prog(frame, 44800, ENTER));
  const trkB = decel(prog(frame, 45050, ENTER));
  const RATIO = 2000 / 27184;
  const row = (top: number, o: number): React.CSSProperties => ({
    position: 'absolute', left: 0, top, width: VIZ_W,
    opacity: o, transform: `translateY(${(1 - o) * TRAVEL}px)`,
  });
  const bar = (grow: number, widthPct: number, fill: string) => (
    <div style={{position: 'relative', height: BAR_H, width: '100%',
      border: `2px solid ${pal.hair}`}}>
      <div style={{position: 'absolute', inset: 0, width: `${widthPct}%`,
        background: fill, opacity: grow > 0 ? 1 : 0}} />
    </div>
  );
  // The payoff figures are THE film (stills judge v1: they were the smallest
  // type on screen). Display-scale mono, snapping in with their bars.
  const num = (grow: number): React.CSSProperties => ({
    fontFamily: FONT_MONO, fontSize: 72, color: pal.text,
    marginTop: gap('s'), opacity: grow > 0 ? 1 : 0,
  });
  return (
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP, width: VIZ_W}}>
      <div style={row(0, lblA)}>
        {/* Eyebrows at UI.m: UI.s measured ~18px on the phone, under the 40px
            floor (stills judge v2). */}
        <div style={{fontFamily: FONT_UI, fontSize: UI.m, letterSpacing: TRACK.slug,
          color: pal.label, marginBottom: gap('s')}}>
          READ THE FILES
        </div>
        <div style={{opacity: trkA}}>{bar(growA, Math.min(growA, 1) * 100, pal.accent)}</div>
        <div style={num(growA)}>
          <Odometer values={['~27,000']} fromMs={BAR_A_AT} /> tokens
        </div>
      </div>
      <div style={row(BAR_H + 210, lblB)}>
        <div style={{fontFamily: FONT_UI, fontSize: UI.m, letterSpacing: TRACK.slug,
          color: pal.label, marginBottom: gap('s')}}>
          ASK THE GRAPH
        </div>
        <div style={{opacity: trkB}}>{bar(growB, Math.max(Math.min(growB, 1) * RATIO * 100, growB * 2), pal.text)}</div>
        <div style={num(growB)}>
          <Odometer values={['2,000']} fromMs={BAR_B_AT} /> tokens
        </div>
      </div>
    </div>
  );
};

// ═══ S5 — THE STRIKE ═════════════════════════════════════════════════════════
// The correction, drawn the way the canon draws removals: the claim in set type,
// a boiling marker strike through it on the word that refutes it, and what is
// true arriving beneath. RoughStrike is the shared "fail." device from NO. 030.
const CLAIM_AT = 53870;    // "70x."
const STRIKE_AT = 55040;   // "never"
const TRUE_AT = 57840;     // "14x"
const HonestyPlate: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const p = decel(prog(frame, CLAIM_AT, ENTER));
  // The strike is a HORIZONTAL RULE drawn left-to-right at the optical midline,
  // fully spanning the glyphs — NO. 035's deprecation treatment. RoughStrike's
  // shallow V read as a stray check-mark on three glyphs and its -4% inset
  // crossed the 150px safe margin (design judge, 2026-08-18).
  const strike = clamp01((frame - f(STRIKE_AT)) / Math.max(1, f(600)));
  const truth = decel(prog(frame, TRUE_AT, DETAIL));
  return (
    <>
      {/* FOUR WORDS TOTAL. The voice already says "one user's anecdote", "the
          repo never says that" and "on a real codebase" — repeating any of it
          here priced the plate at 15.6s against an 11.2s window (readableTime).
          The plate is the two numbers and their verdicts, nothing else. */}
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP, width: VIZ_W,
        opacity: p, transform: `translateY(${(1 - p) * TRAVEL}px)`}}>
        <div style={{height: 2, background: pal.hair}} />
        <div style={{padding: `${gap('m')}px 0`}}>
          <div style={{fontFamily: FONT_UI, fontSize: UI.m, letterSpacing: TRACK.slug,
            color: pal.label, marginBottom: gap('s')}}>
            CLAIMED
          </div>
          <div style={{fontFamily: FONT, fontSize: ROLES.title.size, color: pal.text,
            position: 'relative', display: 'inline-block'}}>
            70x
            <div style={{position: 'absolute', left: '-2%', top: '52%', height: 6,
              width: `${strike * 104}%`, background: pal.accent}} />
          </div>
        </div>
        <div style={{height: 2, background: pal.hair}} />
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 320, width: VIZ_W,
        opacity: truth, transform: `translateY(${(1 - truth) * TRAVEL}px)`}}>
        <div style={{fontFamily: FONT_UI, fontSize: UI.m, letterSpacing: TRACK.slug,
          color: pal.label, marginBottom: gap('s')}}>
          MEASURED
        </div>
        <div style={{fontFamily: FONT, fontSize: ROLES.title.size, color: pal.text,
          lineHeight: 1.14}}>
          14x
        </div>
      </div>
    </>
  );
};

// ═══ THE OUTRO ═══════════════════════════════════════════════════════════════
const OutroMarquee: React.FC<{field: string}> = () => (
  <ZigzagMarquee fromMs={61760} unit={'vektor  '} amp={260} period={13} rows={14}
    rowH={136} fontSize={150} dur={75} color={'rgba(244,239,223,0.13)'} />
);

// ═══ SEAMS ═══════════════════════════════════════════════════════════════════
// Each entry's field MUST equal the bg of the beat it lands on
// (check-kt#seamCarriesIncomingField). The 7200 wipe is a same-colour cut: the
// hook would otherwise sit 13.2s on ink, past the 10s the canon allows on one
// field without punctuation; it lands where the sentence turns to the cost.
const FLIPS: {ms: number; field: string}[] = [
  {ms: 7200,  field: INK},       // paragraph cut, not a change
  {ms: 13360, field: CREAM},
  {ms: 30320, field: RED_DEEP},
  {ms: 40000, field: INK},
  {ms: 50560, field: CREAM},
  {ms: 61760, field: RED_DEEP},
];
const Seams: React.FC = () => (
  <>
    {FLIPS.map((w) => (
      <MatteWipe key={w.ms} atMs={w.ms} main={w.field} accent1={w.field} accent2={w.field} />
    ))}
  </>
);

const WIPE_LEAD = WIPE.leadFrames;
const WIPE_TAIL = WIPE.tailFrames;
const inWipe = (frame: number) =>
  FLIPS.some((w) => frame >= f(w.ms) - WIPE_LEAD && frame < f(w.ms) + WIPE_TAIL);

const WIPE_COVER = 8;
const wipeField = (frame: number): string | null => {
  const w = FLIPS.find((x) => frame >= f(x.ms) - WIPE_COVER && frame < f(x.ms));
  return w ? w.field : null;
};

// ═══ THE PLATES, AS DATA ═════════════════════════════════════════════════════
// Readable time is 3s + 0.6s per word ON THE PLATE (canon READABLE).
const PLATES: {from: number; to: number; Node: React.FC<{field: string}>}[] = [
  // from 0, NOT 120: the assembled graph must be on screen at frame 0 (frame-0
  // law). At from:120 the film's first 4 frames — and the thumbnail — were an
  // empty ink field (design judge, 2026-08-18).
  {from: 0,     to: 13360,        Node: GraphDissolve}, // 13.4s  0 words  needs 3.0
  {from: 22000, to: 30320,        Node: GraphRebuild},  //  8.3s  0 words  needs 3.0
  {from: 30320, to: 40000,        Node: RunTerminal},   //  9.7s  0 words  needs 3.0
  {from: 40000, to: 50560,        Node: TokenBars},     // 10.6s  8 words  needs 7.8
  {from: 50560, to: 61760,        Node: HonestyPlate},  // 11.2s  4 words  needs 5.4
  {from: 61760, to: NO036_END_MS, Node: OutroMarquee},  //  6.6s  0 words  needs 3.0
];

// ═══ THE MASCOT ══════════════════════════════════════════════════════════════
// Hook, receipt, outro — NO. 035's placement, same size and zone.
const MASCOT = {size: 160, xPct: 46.7, yPct: 70.7} as const;
// NO HOOK MASCOT: the hero graph now fills the whole plate band and the mascot
// stood inside it as "a third unrelated object" (design judge, 2026-08-18).
// Which beats fit is a measurement, not a preference — receipt and outro clear.
// The receipt mascot drops to yPct 78: at the house 70.7 its walk crossed the
// display-scale "2,000 tokens" value and occluded it (stills judge v2).
const MASCOTS: {from: number; until: number; look: {xPct: number; yPct: number}; yPct?: number}[] = [
  {from: 40000, until: 50560,        look: {xPct: 50, yPct: 52}, yPct: 78},  // the receipt
  {from: 61760, until: NO036_END_MS, look: {xPct: 50, yPct: 44}},            // the outro
];

// THE TYPE HOLE: while the honesty plate holds, the caption layer is hidden —
// the plate is the only carrier of "70x"/"14x" on screen (stills judges v1+v2
// both caught the running caption duplicating the plate's stat). The words
// still live in the beat spec, so take coverage stays whole — the same
// precedent as words under a full-bleed shot (NO. 035 repo beat).
const TYPE_HOLES: {from: number; to: number}[] = [{from: 53800, to: 61760}];
const inTypeHole = (frame: number) =>
  TYPE_HOLES.some((h) => frame >= f(h.from) && frame < f(h.to));

// ═══ COMPOSITION ═════════════════════════════════════════════════════════════
export type Layout = 'full' | 'two' | 'caption';

export const KTNo036: React.FC<{layer?: 'all' | 'type' | 'viz' | 'furniture'; stableLine?: boolean; mode?: Layout}> =
  ({layer = 'all', stableLine = true, mode = 'two'}) => {
  const frame = useCurrentFrame();
  // Every hook is called before any early return (React error 310 — the number
  // written without its hash so check-drift does not read it as a colour).
  const beat = NO036_BEATS.find((s) => frame >= f(s.from) && frame < f(s.to)) ??
    (frame >= f(NO036_BEATS[NO036_BEATS.length - 1].from)
      ? NO036_BEATS[NO036_BEATS.length - 1]
      : NO036_BEATS[0]);
  const wiping = inWipe(frame);
  const shot = SHOTS.find((sh) => frame >= f(sh.from) && frame < f(sh.to));
  const bg = asField(wipeField(frame) ?? beat.bg);

  const beatHasPlate = PLATES.some((pl) => pl.from < beat.to && pl.to > beat.from);
  const topNow = beat.top && beatHasPlate;
  const furn = FOOTER_ON[bg] ?? LABEL_I;

  return (
    <AbsoluteFill style={{backgroundColor: bg, fontFamily: FONT}}>
      {/* The voice in the composition, composite only — GATE 2 reviews sync. */}
      {layer === 'all' ? (
        <Audio src={staticFile('audio/2026-08-18-graphify-kt/vo-master.wav')} />
      ) : null}

      {layer !== 'type' && layer !== 'furniture' && !wiping && shot ? <ShotPlate shot={shot} /> : null}

      {layer !== 'type' && layer !== 'furniture' && !wiping && !shot ? (<>
        {PLATES.map((pl) => (
          <Window key={pl.from} fromMs={pl.from} toMs={pl.to}><pl.Node field={bg} /></Window>
        ))}
      </>) : null}

      {layer !== 'type' && layer !== 'furniture' && !wiping && !shot
        ? MASCOTS.filter((m) => frame >= f(m.from) && frame < f(m.until)).map((m) => (
          <AbsoluteFill key={m.from} style={{['--fg' as any]: INK}}>
            <ClaudeMascot frames={KT_NO036_FRAMES}
              config={{pose: 'walk', xPct: MASCOT.xPct, yPct: m.yPct ?? MASCOT.yPct,
                size: MASCOT.size, delay: f(m.from) + f(ENTER), bubble: false,
                lookAt: m.look}} />
          </AbsoluteFill>
        ))
        : null}

      {layer !== 'viz' && layer !== 'furniture' && !wiping && !shot && !inTypeHole(frame) ? (
      <AbsoluteFill style={{alignItems: 'center',
        ...(mode === 'caption' && topNow ? {fontSize: UI.m, opacity: 0.92} : {}),
        /* TOP-ANCHORED, never centered: with justify-center every appended row
           re-centred the block, so row 1 jumped up mid-read — the drift both
           v2 judges caught. Row 1 now holds its baseline and row 2 fills in
           beneath it. */
        justifyContent: topNow ? 'flex-start' : 'center',
        ...(topNow ? {top: TYPE_BAND_TOP + Math.round(TYPE_BAND_H * 0.18), height: TYPE_BAND_H, bottom: 'auto'} : {}),
        flexDirection: 'column', rowGap: gap('m'),
        padding: `0 ${MARGIN_X}px`,
        textAlign: 'center'}}>
        {(() => {
          const live = beat.rows.filter((r) => r.words.some((w) => frame >= f(w.ms)));
          const keep = mode === 'caption' ? 1 : mode === 'two' ? 2 : 3;
          const shown = live.slice(-keep);
          return beat.rows.filter((r) => shown.includes(r));
        })().map((row, ri) => (
          <div key={`${beat.from}-${ri}`} style={{lineHeight: 1.14}}>
            {row.words.map((w, wi) => {
              const gone = w.out !== undefined && frame >= f(w.out);
              if (!stableLine) return <Word key={wi} w={w} base={row.size} baseColor={beat.type} />;
              if (gone) return null;
              return (
                <span key={wi} style={{position: 'relative', display: 'inline-block'}}>
                  {lineWidthSpacer(w, row.size)}
                  <span style={{position: 'absolute', left: 0, top: 0}}>
                    <Word w={w} base={row.size} baseColor={beat.type} />
                  </span>
                </span>
              );
            })}
          </div>
        ))}
      </AbsoluteFill>
      ) : null}

      {layer === 'all' ? <Seams /> : null}

      {(layer === 'all' || layer === 'furniture') && !wiping && !shot ? (
        <div style={{position: 'absolute', top: WORDMARK.y, left: MARGIN_X,
          fontSize: UI.l, fontWeight: ROLES.wordmark.weight,
          letterSpacing: '-0.045em', color: WORDMARK_ON[bg] ?? CREAM,
          fontFamily: FONT_UI}}>vektor</div>
      ) : null}
    </AbsoluteFill>
  );
};
