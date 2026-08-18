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
import {INK, CREAM, RED, f, Word, RoughStrike} from './KTHook';
import {NO036_BEATS, NO036_END_MS} from './KTNo036Words';
import {gap, FAMILY, WORDMARK, ROLES, MARGIN_X, COLUMN_W, SAFE, FIELD, TEXT_ON,
  ENTER_MS, DETAIL_MS, TRAVEL_PX, WIPE, PLATE_TOP,
  CAPTURE_SCROLL_PX_PER_SEC} from './kt/system';
import {MatteWipe, ZigzagMarquee} from './KTSeams';
import {Odometer} from './KTEffects';
import {G_NODES, G_EDGES, GRAPH_W, GRAPH_H} from './KTNo036Graph';
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
const ASSEMBLE_TO = 28000;     // whole before "instead of rereading your code."
const N = G_NODES.length;

const GraphAssembly: React.FC<{field: string; state: 'dissolve' | 'assemble'}> =
  ({field, state}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const ms = (frame / 30) * 1000;
  const cx = GRAPH_W / 2, cy = GRAPH_H / 2;

  // Per-node life in [0,1]: 1 = fully present at rest, 0 = gone/not yet.
  const life = (o: number) => {
    if (state === 'assemble') {
      const at = ASSEMBLE_FROM + (o / N) * (ASSEMBLE_TO - ASSEMBLE_FROM - 400);
      return decel(clamp01((ms - at) / 400));
    }
    const at = DISSOLVE_FROM + ((N - 1 - o) / N) * (DISSOLVE_TO - DISSOLVE_FROM - 600);
    return 1 - decel(clamp01((ms - at) / 600));
  };

  return (
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP, width: VIZ_W,
      height: 560, display: 'flex', justifyContent: 'center'}}>
      <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`} style={{height: '100%'}}>
        {G_EDGES.map(([a, b], i) => {
          const l = Math.min(life(G_NODES[a].o), life(G_NODES[b].o));
          if (l <= 0) return null;
          return (
            <line key={i} x1={G_NODES[a].x} y1={G_NODES[a].y}
              x2={G_NODES[b].x} y2={G_NODES[b].y}
              stroke={pal.text} strokeWidth={1.4} opacity={0.22 * l} />
          );
        })}
        {G_NODES.map((n, i) => {
          const l = life(n.o);
          if (l <= 0) return null;
          // The breath: a slow deterministic drift so the graph reads as alive
          // at frame 0 (frame-0 law: payoff in motion, never a static hold).
          const bx = Math.sin(frame / 37 + n.o * 1.7) * 2.2;
          const by = Math.cos(frame / 41 + n.o * 2.3) * 2.2;
          // Dissolving nodes drift off their edges, away from the hub.
          const dx = n.x - cx, dy = n.y - cy;
          const d = Math.sqrt(dx * dx + dy * dy) + 1e-3;
          const away = state === 'dissolve' ? (1 - l) * 90 : 0;
          const isHub = n.o === 0;
          return (
            <circle key={i}
              cx={n.x + bx + (dx / d) * away} cy={n.y + by + (dy / d) * away}
              r={n.r * (0.4 + 0.6 * l)}
              fill={isHub ? pal.accent : pal.text} opacity={l} />
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
// Shot 2: OUR graph — graphify-out/graph.html rendered from THIS engine,
// captured 2026-08-18 and cropped to the graph body (the numbered-community
// sidebar and empty inspector read as chrome, not evidence). Static: it is a
// picture being looked at, not a page being read, so it does not scroll.
const SHOTS: {from: number; to: number; src: string; imgH: number; scroll: boolean}[] = [
  {from: 16560, to: 22000, src: 'screens/no036-graphify-repo.png', imgH: 3160, scroll: true},
  {from: 32080, to: 36320, src: 'screens/no036-graphify-our-graph.png', imgH: 1920, scroll: false},
];

const ShotPlate: React.FC<{shot: (typeof SHOTS)[number]}> = ({shot}) => {
  const frame = useCurrentFrame();
  const t = clamp01((frame - f(shot.from)) / Math.max(1, f(shot.to - shot.from)));
  const shotSec = (shot.to - shot.from) / 1000;
  const travel = shot.scroll
    ? Math.min(shot.imgH - 1920, CAPTURE_SCROLL_PX_PER_SEC * shotSec)
    : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: INK}}>
      <Img src={staticFile(shot.src)}
        style={{position: 'absolute', left: 0, top: -travel * t, width: 1080}} />
    </AbsoluteFill>
  );
};

// ═══ S3 — THE QUERY, TYPED ═══════════════════════════════════════════════════
// The question we actually asked, typing in a mono chip as the voice asks it.
// Named QueryTerm, NOT TerminalChip — that name is NO. 030's film-local device
// and a same-named copy is the look-alike the Approval Protocol forbids.
const QUERY_FROM = 36320;       // "Then we asked it..."
const QUERY_TEXT = 'graphify query "how do captions connect to the render pipeline?"';
const QueryTerm: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const p = decel(prog(frame, QUERY_FROM, ENTER));
  // Types over ~2.2s, done before the beat ends; linear — typing is a clock.
  const typed = Math.round(QUERY_TEXT.length *
    clamp01((frame - f(QUERY_FROM + 200)) / Math.max(1, f(2200))));
  const caret = Math.floor(frame / 8) % 2 === 0;
  return (
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP, width: VIZ_W,
      opacity: p, transform: `translateY(${(1 - p) * TRAVEL}px)`}}>
      {/* NO LABEL: the type row above is already the sentence ("Then we asked
          it how..."), and readableTime priced a 3-word label at more seconds
          than this window has — NO. 034's CodePage ruling, again. */}
      <div style={{background: pal.wash, border: `2px solid ${pal.hair}`,
        padding: `${gap('m')}px ${gap('m')}px`}}>
        <div style={{fontFamily: FONT_MONO, fontSize: UI.m, color: pal.text,
          lineHeight: 1.4, minHeight: '2.8em', overflowWrap: 'break-word'}}>
          <span style={{color: pal.label}}>$ </span>
          {QUERY_TEXT.slice(0, typed)}
          {caret ? <span style={{opacity: 0.8}}>▌</span> : null}
        </div>
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
  const p = decel(prog(frame, 40000, ENTER));
  const growA = decel(prog(frame, BAR_A_AT, DETAIL));
  const growB = decel(prog(frame, BAR_B_AT, DETAIL));
  const RATIO = 2000 / 27184;
  const row = (top: number): React.CSSProperties => ({
    position: 'absolute', left: 0, top, width: VIZ_W,
  });
  return (
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP, width: VIZ_W,
      opacity: p, transform: `translateY(${(1 - p) * TRAVEL}px)`}}>
      <div style={row(0)}>
        <div style={{fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug,
          color: pal.label, marginBottom: gap('s')}}>
          READ THE FILES
        </div>
        <div style={{height: BAR_H, width: `${growA * 100}%`, background: pal.accent}} />
        <div style={{fontFamily: FONT_MONO, fontSize: UI.m, color: pal.text,
          marginTop: gap('s')}}>
          <Odometer values={['9,000', '18,000', '~27,000']} fromMs={BAR_A_AT} tickMs={140} />
          {' '}tokens
        </div>
      </div>
      <div style={row(BAR_H + 170)}>
        <div style={{fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug,
          color: pal.label, marginBottom: gap('s')}}>
          ASK THE GRAPH
        </div>
        <div style={{height: BAR_H, width: `${Math.max(growB * RATIO * 100, growB * 2)}%`,
          background: pal.text}} />
        <div style={{fontFamily: FONT_MONO, fontSize: UI.m, color: pal.text,
          marginTop: gap('s')}}>
          <Odometer values={['2,000']} fromMs={BAR_B_AT} tickMs={90} /> tokens
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
  const struck = frame >= f(STRIKE_AT);
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
          <div style={{fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug,
            color: pal.label, marginBottom: gap('s')}}>
            CLAIMED
          </div>
          <div style={{fontFamily: FONT, fontSize: ROLES.title.size, color: pal.text,
            position: 'relative', display: 'inline-block'}}>
            70x
            {struck ? <RoughStrike seed={36} /> : null}
          </div>
        </div>
        <div style={{height: 2, background: pal.hair}} />
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 320, width: VIZ_W,
        opacity: truth, transform: `translateY(${(1 - truth) * TRAVEL}px)`}}>
        <div style={{fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug,
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
  {from: 120,   to: 13360,        Node: GraphDissolve}, // 13.2s  0 words  needs 3.0
  {from: 22000, to: 30320,        Node: GraphRebuild},  //  8.3s  0 words  needs 3.0
  {from: 36320, to: 40000,        Node: QueryTerm},     //  3.7s  0 words  needs 3.0
  {from: 40000, to: 50560,        Node: TokenBars},     // 10.6s  8 words  needs 7.8
  {from: 50560, to: 61760,        Node: HonestyPlate},  // 11.2s  4 words  needs 5.4
  {from: 61760, to: NO036_END_MS, Node: OutroMarquee},  //  6.6s  0 words  needs 3.0
];

// ═══ THE MASCOT ══════════════════════════════════════════════════════════════
// Hook, receipt, outro — NO. 035's placement, same size and zone.
const MASCOT = {size: 160, xPct: 46.7, yPct: 70.7} as const;
const MASCOTS: {from: number; until: number; look: {xPct: number; yPct: number}}[] = [
  {from: 120,   until: 13360,        look: {xPct: 50, yPct: 50}},  // the hook
  {from: 40000, until: 50560,        look: {xPct: 50, yPct: 52}},  // the receipt
  {from: 61760, until: NO036_END_MS, look: {xPct: 50, yPct: 44}},  // the outro
];

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
              config={{pose: 'walk', xPct: MASCOT.xPct, yPct: MASCOT.yPct,
                size: MASCOT.size, delay: f(m.from) + f(ENTER), bubble: false,
                lookAt: m.look}} />
          </AbsoluteFill>
        ))
        : null}

      {layer !== 'viz' && layer !== 'furniture' && !wiping && !shot ? (
      <AbsoluteFill style={{alignItems: 'center',
        ...(mode === 'caption' && topNow ? {fontSize: UI.m, opacity: 0.92} : {}),
        justifyContent: 'center',
        ...(topNow ? {top: TYPE_BAND_TOP, height: TYPE_BAND_H, bottom: 'auto'} : {}),
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
