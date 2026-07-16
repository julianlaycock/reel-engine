import type {CardJson} from './schema';
import type {FieldName, GradientName} from '@tokens/token-names';

// Canon-resolver (step 5): style values in video.json are TOKEN NAMES, never
// raw hex/font literals. A TokenRef ("token:<group>.<name>") is resolved at the
// composition entry by src/token-ref.ts from the generated canon tokens; the
// vocabulary is enforced by scripts/lib/validate-tokens.mjs (render + gate).
export type TokenRef = `token:${string}.${string}`;

// A scene's Americana field — one of the generated canon field/gradient names
// (src/generated/token-names.*, from canon/americana-tokens.json).
export type SceneField = FieldName | GradientName;

// Per-video brand override block (Video.tsx maps it onto CSS custom
// properties). Values are token references or plain CSS values that carry no
// raw hex/font literals (validate-tokens.mjs enforces).
export type BrandOverrides = Record<string, string | Record<string, string>>;

// Word-level caption timing, absolute milliseconds across the whole video.
// Produced by scripts/generate-captions.mjs (whisper-cpp) or hand-authored.
export type CaptionWord = {
  text: string;
  startMs: number;
  endMs: number;
};

// A branded motion-graphics card scene. Reuses the existing 4 card types.
// durationInFrames overrides card.durationInFrames for this scene's slot.
export type CardScene = {
  kind: 'card';
  card: CardJson;
  durationInFrames?: number;
};

// A real screen recording (Screen Studio / n8n build) embedded full-bleed
// inside the brand frame — this is where trust comes from, per the master plan.
export type ScreenScene = {
  kind: 'screen';
  src: string; // path under public/, e.g. "screens/cv-build.mp4"
  durationInFrames: number;
  kicker?: string; // top-left meta label
  kickerRight?: string; // top-right meta label
  footerRight?: string; // bottom-right meta label
  label?: string; // optional lower-third caption over the clip
  startFromMs?: number; // trim: where in the source clip to start
  muted?: boolean; // default true — VO carries the audio
};

// A big animated number that rolls up to its value — for data beats that should
// feel alive ("42" hours, "100×", "6 out of 10"). Reveals decoration in stages.
export type CounterScene = {
  kind: 'counter';
  from?: number; // default 0
  to?: number; // required unless `word` is set (statement mode)
  // Statement mode (rule-beat treatment 05 language, 2026-07-08): render WORD
  // as the giant Tektur focal instead of a numeric count-up (e.g. "MATCHED.",
  // "ASK."). Auto-fits to the content column; lands with the same punch.
  // `word` IS read → counted by reading-time READ_KEYS.
  word?: string;
  // Optional small struck counter-value beside the focal (e.g. a struck
  // "+180" superscript next to "+6") — decorative counterpoint, not linearly read.
  counterpoint?: string;
  decimals?: number; // default 0
  prefix?: string; // e.g. "" or "<"
  suffix?: string; // e.g. "×", "%", " HOURS"
  headline?: string; // small line above the number
  sub?: string; // detail line under the number
  accent?: boolean; // render the number in red instead of off-white
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
  durationInFrames: number;
};

// Two contrasting figures side by side — the core tension device
// ("42 HOURS" vs "5 MINUTES"). Left = problem, right = payoff (red).
export type VersusScene = {
  kind: 'versus';
  leftValue: string;
  leftLabel: string;
  rightValue: string;
  rightLabel: string;
  caption?: string; // line under the pair
  // NO.010 versus-beat fill (founder pick: B+C combined, 2026-07-08).
  // ghost = huge outline rule numeral ("R2") behind/below the pair, ink outline
  // at ~13% opacity. DECORATIVE — the key is deliberately NOT in
  // reading-time.mjs READ_KEYS so it never inflates the reading floor.
  // Never put content that must be read here.
  ghost?: string;
  // versus-pair.v3 prototype (2026-07-13): ONE acid Jacquard blackletter word as a
  // top-left verdict stamp (acid on dark fields, ink on light — the acid law).
  jacquardWord?: string;
  // lines = short mono diff-style evidence lines rendered DIRECTLY on the field
  // (no card/panel/background), lower band. A leading '-' renders muted ink
  // (struck), a leading '+' renders caret-teal (acid law: acid never on light
  // fields). These ARE read → 'lines' IS a READ_KEY; keep each ≤22 chars.
  lines?: string[];
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
  durationInFrames: number;
};

// QOVES-style annotated editorial scene. A focal subject (a mock product panel
// now; a real screen-capture later) plus leader-line callouts that draw in,
// staggered. Premium whitespace + restraint, instant-value headline on top.
export type EditorialCallout = {
  text: string;
  xPct: number; // target point on the 1080×1920 stage, 0..100 (line points here)
  yPct: number;
  dir?: 'left' | 'right'; // which margin the label sits in; default auto by xPct
  accent?: boolean; // red leader line + label (the payoff annotation)
};

export type EditorialScene = {
  kind: 'editorial';
  eyebrow?: string; // mono § marker above the headline (petrol — the document grammar)
  logo?: boolean; // render the headline as the wordmark + blinking petrol cursor lockup
  headline?: string; // big instant-value line on top (accentWords highlights)
  accentWords?: string[];
  panel?: {
    title?: string; // mock window titlebar / URL (or the article's source/URL)
    body?: string[]; // mock document/content lines (ignored when image is set)
    badge?: string; // pill top-right of the panel, e.g. "open source"
    field?: string; // dashed highlight field label, e.g. "sign here"
    image?: string; // a real screenshot under public/ (article for authority, or a tool) — framed in the window, callouts draw on top
  };
  callouts?: EditorialCallout[];
  footnote?: string; // muted line under the subject
  caption?: string; // receipts line (wireframes v2 caption band y1300, P3 dateline grammar) — rendered by PersistentChrome in americana
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
  durationInFrames: number;
};

// Automation as a living 2D wiring diagram — the richer successor to the linear
// flow card. Nodes on a normalized grid, SVG connectors draw in, one red accent
// path with a packet that travels it. Monospace data labels.
export type GraphNode = {
  id: string;
  label: string;
  sub?: string;
  xPct: number; // 0..100 position across the graph stage
  yPct: number;
  accent?: boolean; // red node (the payoff / final output)
};

export type GraphEdge = {
  from: string; // node id
  to: string; // node id
  accent?: boolean; // red connector + traveling packet
};

// An audit-trail "spine": a vertical accent line running beside a vertical
// pipeline, with a branch + commit-dot lighting up at each node — visualizing
// every step being sealed into a tamper-evident record. Vertical layout only.
export type GraphSpine = {
  label?: string; // vertical mono label beside the spine, e.g. "audit trail · sha-256"
};

export type NodeGraphScene = {
  kind: 'nodegraph';
  title?: string; // small uppercase heading
  layout?: 'zigzag' | 'vertical'; // 'zigzag' (default, uses xPct) | 'vertical' (centered column). Rotate across videos for variety.
  spine?: GraphSpine; // optional audit-trail spine (vertical layout only)
  nodes: GraphNode[];
  edges: GraphEdge[];
  caption?: string; // line under the graph (accentWords highlights)
  accentWords?: string[];
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
  durationInFrames: number;
};

// Closing credibility scene: "official certified partner" + partner badges
// (official logos when provided in public/logos/, else elegant text badges).
export type OutroPartner = {
  name: string;
  sub?: string; // e.g. "Claude Partner Network" / "Solution Partner"
  logo?: string; // path under public/, e.g. "logos/zapier.png" (omit → text badge)
};

export type OutroScene = {
  kind: 'outro';
  title?: string; // default "official certified partner"
  partners: OutroPartner[];
  tagline?: string;
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
  durationInFrames: number;
};

// "The agent working" — a live compliance-copilot console mirroring the
// caelith.tech hero: a typing bot message, a fields-pre-filled progress bar,
// and status checks that resolve (clear / flag / valid). Shows, doesn't tell.
export type AgentCheck = {
  label: string;
  state: 'clear' | 'flag' | 'pass' | 'valid';
};

export type AgentScene = {
  kind: 'agent';
  durationInFrames: number;
  eyebrow?: string; // § marker above the console
  consoleTitle?: string; // header label, e.g. "filing automation"
  consoleStatus?: string; // header right, e.g. "active" / "live"
  typed: string; // the bot message that types out (supports **bold** and `code`)
  reply?: string; // optional user reply bubble
  progress?: {label: string; value: number; total: number}; // e.g. fields 176/180
  checks?: AgentCheck[]; // status rows that resolve one-by-one
  caption?: string; // line under the console
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// Converging data-flow (Sankey-style): source streams flow + converge through a
// vertical pipeline of stages into a sealed record, with live pulses travelling
// the ribbons and an audit-chain spine capturing each stage.
export type FlowSource = {label: string};
export type FlowStage = {label: string; sub?: string; accent?: boolean};
export type FlowGraphScene = {
  kind: 'flowgraph';
  durationInFrames: number;
  vo?: string;
  title?: string; // § marker (petrol mono)
  sources: FlowSource[]; // top, converge into stage 0
  stages: FlowStage[]; // vertical pipeline (engine → record → sealed)
  checks?: AgentCheck[]; // small ✓ valid / ⚑ flag annotation
  auditLabel?: string; // vertical spine label, e.g. "audit chain · sha-256"
  caption?: string;
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// The loop: a circular pipeline. Nodes sit on a ring (clockwise from 12
// o'clock), an accent packet orbits it continuously, nodes light as it passes,
// and a center counter ticks each revolution — an agent loop running on its
// own. Optional fail-branch escaping the ring at one node (escalate → human).
export type LoopNode = {
  label: string;
  sub?: string;
  accent?: boolean; // persistent accent border (use sparingly — the packet is the red mark)
};

export type LoopGraphScene = {
  kind: 'loopgraph';
  durationInFrames: number;
  vo?: string;
  title?: string; // small uppercase heading
  nodes: LoopNode[]; // placed clockwise from 12 o'clock
  orbitPeriod?: number; // frames per revolution (default 150)
  centerLabel?: string; // above the counter (default "cycle")
  centerSub?: string; // under the counter, e.g. "while you sleep"
  branch?: {fromIndex: number; label: string; sub?: string}; // fail path out of the ring
  caption?: string;
  accentWords?: string[];
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// Live field matrix: a grid of the Annex IV fields that fills in a diagonal wave,
// a few cells flag, then the grid "seals". A data-dense alternative to flowgraph.
export type FieldGridScene = {
  kind: 'fieldgrid';
  durationInFrames: number;
  vo?: string;
  title?: string;
  cols?: number; // default 15
  rows?: number; // default 12 (→ 180)
  filled?: number; // default = total - flaggedCount
  flaggedCount?: number; // default 4
  label?: string; // e.g. "Annex IV · 180 fields"
  sealLabel?: string; // e.g. "sealed · sha-256 chain"
  caption?: string;
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// A premium source citation / pulled quote — the source's own words, with an
// objective attribution and a logo (image or typographic mark). Optional receipt
// thumbnail (a small framed screenshot) for the "quote + proof" variant.
export type QuoteScene = {
  kind: 'quote';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  quote: string; // verbatim, no surrounding quotes (added by the component)
  attribution: string; // e.g. "EY Luxembourg · 06 Jan 2026"
  attributionSub?: string; // e.g. the article title
  logo?: string; // path under public/ (rendered grayscale); else logoText
  logoText?: string; // typographic mark, e.g. "EY"
  thumb?: string; // optional small screenshot "receipt"
};

// An animated milestone timeline (vertical), each milestone a date + label.
export type TimelineMilestone = {date: string; label: string; accent?: boolean};
export type TimelineScene = {
  kind: 'timeline';
  durationInFrames: number;
  vo?: string;
  title?: string; // § marker
  milestones: TimelineMilestone[];
  caption?: string;
};

// === Vektor R3F scenes ===

// Generative flow-field particle "specimen" (curl-noise GPU-ish particles in 3D),
// the signature hero visual. Fully frame-deterministic (positions = fn of frame).
// Optional headline/eyebrow overlay in brand type.
export type GenerativeScene = {
  kind: 'generative';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  headline?: string;
  accentWords?: string[];
  sub?: string;
  particles?: number; // default 3500
  palette?: string[]; // specimen colors; default [accent, ink, fg]
  blend?: 'add' | 'normal'; // 'add' (glow, default — for dark themes) | 'normal' (light themes)
  spin?: number; // camera azimuth sweep (radians) over the scene; default 0.7
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// 3D surface z=f(x,y) with a cinematic camera orbit — here a Poisson scoreline
// matrix (home goals × away goals). Either pass an explicit grid or two lambdas
// (expected goals) and the component builds the Poisson outer-product surface.
export type Heatmap3DScene = {
  kind: 'heatmap3d';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  headline?: string;
  caption?: string;
  grid?: number[][]; // explicit heights 0..1; else generated from lambdas
  lambdaHome?: number; // expected goals home (default 1.6)
  lambdaAway?: number; // expected goals away (default 1.1)
  size?: number; // goals axis 0..size (default 5)
  formula?: string; // optional formula chip, e.g. "P(k) = e^(−λ) λ^k / k!"
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
  palette?: string[]; // [highColor, lowColor]; default [accent, ink]
  spin?: number; // camera azimuth sweep (radians); default 0.9
  xLabel?: string; // default "home goals"
  yLabel?: string; // default "away goals"
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// Full-bleed B-roll clip behind narration (public/clips/<file>), cover-cropped to
// 9:16 with a legibility scrim. VO carries the audio. The show-don't-tell footage layer.
export type BrollScene = {
  kind: 'broll';
  durationInFrames: number;
  vo?: string;
  src: string; // path under public/, e.g. "clips/spain-celebration.mp4"
  startFromMs?: number; // trim into the clip
  muted?: boolean; // default true
  keepChrome?: boolean; // repo/tool-spotlight: keep the persistent masthead over the full-bleed clip (founder 2026-07-16)
  fit?: 'cover' | 'bleed'; // 'bleed' = full-bleed clip filling everything below the black masthead band (founder 2026-07-16); default cover
  clipTop?: number; // fit:'bleed' — px height of the reserved top black masthead band; default 300
  clipBottom?: number; // fit:'bleed' — px height of a reserved bottom black band (keeps the footer off the footage); default 0
  focus?: string; // objectPosition for the clip crop (e.g. 'center top', 'left top'); default 'center top' in bleed mode
  eyebrow?: string;
  headline?: string;
  accentWords?: string[];
  sub?: string;
  overlay?: number; // scrim darkness 0..1, default 0.5
  kenburns?: boolean; // default true (slow push-in)
  zoom?: number; // base scale (crop in to hide broadcast scoreboards etc.); default 1.22
  panY?: number; // vertical shift in % (negative pushes the top off-frame); default 0
  textTop?: number; // px from top for the headline block (push below scoreboards); default 330
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// Broadcast win-probability panel (glassmorphism): animated bars + count-up
// numbers, e.g. model vs market. The "broadcast analyst" graphic.
export type WinProbRow = {label: string; value: number; display?: string; accent?: boolean};
export type WinProbScene = {
  kind: 'winprob';
  durationInFrames: number;
  vo?: string;
  title?: string; // mono eyebrow, e.g. "SPAIN — to win the World Cup"
  sub?: string;
  rows: WinProbRow[]; // each a labelled bar
  scaleMax?: number; // bar full-scale; default = max value × 1.55
  suffix?: string; // default "%"
  caption?: string;
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// Monte Carlo viz: samples fall into bins, histogram builds + converges, counter ticks.
export type MonteCarloScene = {
  kind: 'montecarlo';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  headline?: string;
  accentWords?: string[];
  total?: number; // default 50000
  bins?: number; // default 15
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
};

// Galton-board / Plinko probability viz: sims drop through pegs and pile into two
// outcome bins (e.g. THROUGH 82% / OUT 18%) — makes "the favourite still falls" visceral.
export type PlinkoScene = {
  kind: 'plinko';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  headline?: string;
  accentWords?: string[];
  total?: number; // sims, default 10000
  throughPct?: number; // % landing in the "through" bin, default 82
  throughLabel?: string; // default "THROUGH"
  outLabel?: string; // default "OUT"
  rows?: number; // peg rows, default 7
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
};

// Flat 2D scoreline-probability heatmap (home × away goals).
export type Poisson2DScene = {
  kind: 'poisson2d';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  headline?: string;
  formula?: string; // KaTeX, rendered above the grid (no box)
  lambdaHome?: number;
  lambdaAway?: number;
  size?: number; // goals axis 0..size (default 5)
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
};

// End card: result recap + animated wordmark + follow CTA.
export type OutroScene2 = {
  kind: 'outro2';
  durationInFrames: number;
  vo?: string;
  recap?: string;
  question?: string;
  wordmark?: string; // default "vektor"
  tagline?: string;
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
};

// Minimal method pipeline (vertical nodes + connector + pulse).
export type FlowScene = {
  kind: 'flow';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  headline?: string;
  accentWords?: string[];
  steps?: string[];
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
};

// A brief "here's the maths" beat: a formula shown big with a plain-language gloss.
export type FormulaScene = {
  kind: 'formula';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  formula: string; // ^(...) and ^x render as superscripts; left of '=' gets the accent
  gloss?: string; // plain-language explanation
  note?: string;
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// Interactive "guess before the reveal": a question, a beat to guess, then the number
// counts up to the answer + a payoff. Built-in open loop; ends with a comment prompt.
export type GuessRevealScene = {
  kind: 'guessreveal';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  question: string;
  answer: number;
  decimals?: number;
  prefix?: string; // e.g. "$"
  suffix?: string; // e.g. "%"
  answerLabel?: string; // caption under the number
  payoff?: string; // the twist/takeaway line
  commentPrompt?: string; // baked-in participation, e.g. "Comment your guess 👇"
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
};

// Bar-chart race: entities' values animate across time steps; bars reorder by rank.
export type BarRaceScene = {
  kind: 'barrace';
  durationInFrames: number;
  vo?: string;
  title?: string;
  steps: string[]; // time labels, e.g. ["2015","2016",…]
  entities: Array<{label: string; values: number[]; accent?: boolean}>;
  prefix?: string;
  suffix?: string;
  caption?: string;
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
};

// Animated xG shot map: a vertical attacking-third pitch; shots plot in (staggered),
// each sized by its chance quality (xG), a running xG total ticks up. SHOWS xG, doesn't
// just state it. Per-shot positions/values are illustrative; the count + total are real.
export type ShotMapScene = {
  kind: 'shotmap';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  headline?: string;
  accentWords?: string[];
  shots?: number; // number of shots plotted, default 21
  xgTotal?: number; // real aggregate xG the dots sum to, default 1.49
  team?: string; // label under the total
  caption?: string;
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
};

// Radar / spider chart — a subject's profile across 6-8 metrics (each a 0-100 percentile),
// polygon draws in. The iconic football-analytics viz; optional player photo. Values must
// be real (from facts.json); percentiles/normalisation are the author's responsibility.
export type RadarScene = {
  kind: 'radar';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  title?: string; // subject (e.g. player/team name)
  photo?: string; // optional image under public/ (e.g. "images/ger-musiala.jpg")
  axes: Array<{label: string; pct: number; display?: string}>; // pct 0-100
  caption?: string;
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
};

// Horizontal animated bar chart — multi-stat comparisons (BarsScene.tsx).
export type BarsScene = {
  kind: 'bars';
  durationInFrames: number;
  vo?: string;
  title?: string;
  bars: Array<{label: string; value: number; display?: string; accent?: boolean}>;
  scaleMax?: number; // default 100 (percentage bars)
  caption?: string;
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// Pretext (chenglou) per-line-width text layout (PretextScene.tsx).
export type PretextScene = {
  kind: 'pretext';
  durationInFrames: number;
  vo?: string;
  eyebrow?: string;
  text: string;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: number;
  stageY?: number;
  fill?: {shape: 'circle' | 'diamond'; r: number};
  obstacle?: {w: number; h: number; gap?: number; label?: string; labelSize?: number; moveY?: [number, number]};
  justifyNarrow?: boolean;
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

// Americana Cut (Vektor skin v1.0, locked 2026-07-04) — the dark-beat ASCII field:
// a source image resolved into an oriented-glyph/ramp ASCII grid over the signal-blue
// gradient (spec: brand/design-system handoff + canon/americana-tokens.json).
// Law: exactly ONE Jacquard word per video, vertical-rl, acid, dark beat only.
export type AsciiFieldScene = {
  kind: 'asciiField';
  durationInFrames: number;
  src: string; // image under public/ — sampled to cols×rows, ascii-rendered
  jacquardWord?: string; // ONE per video (schema-checked in Video.tsx)
  headline?: string; // Tektur statement in paper
  meta?: string; // uppercase mono support line
  credit?: string; // "NAME / SOURCE / ID" chip, bottom-right, acid
  seed?: number; // shimmer determinism
  veil?: number; // extra veil over the field (end-card: 0.35)
  motion?: 'reveal'; // opt-in additive motion for `pre` assets: scan-in wipe + glow-pulse (canon v1.8)
  imgBox?: {top: number; left: number; width: number; height: number}; // optional position/size for `pre` <Img> (default {top:300,left:0,width:1080,height:700})
  endCard?: {
    wordmark?: string; // 150px lockup; decode logo-motion (option C) plays once
    // brand logoMotion (vektor-tokens.json): plays once, ends in the identical
    // static wordmark. 'fade' = current staggered per-letter fade (default).
    wordmarkMotion?: 'fade' | 'typeon' | 'registration' | 'decode' | 'presswipe';
    cta?: string; // Workbench acid CTA
    issue?: string; // issue chip, bottom-right acid credit format
  };
  vo?: string;
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
};

// KINETIC TYPOGRAPHY hook (BlockHook.tsx). The `headline` is split on '\n' into
// stacked color-blocked bands (ink → orchid → ink…), Tektur 900 uppercase, left-
// aligned, auto-fit to the hook envelope. `instant: true` composes fully at frame
// 0 (frame-zero cliff law); else the bands mask-rise in, staggered.
export type BlockHookScene = {
  kind: 'block-hook';
  headline: string; // '\n' between bands
  durationInFrames: number;
  template?: string;
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
  amBeat?: string;
  marker?: string;
  beatNo?: string;
  vo?: string;
  caption?: string;
  voTag?: string;
  variant?: string;
  mascot?: unknown;
  instant?: boolean;
  reveal?: string;
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
  eyebrow?: string; // small kicker line rendered above the bands (fills the hook grammar)
};

// ROSTER STAGGER (RosterStagger.tsx). A numbered list whose rows snap in one-by-
// one (chevron › + number + label). `atFrame` per item syncs a reveal to the VO.
export type RosterStaggerItem = {
  n: string; // the number/index glyph (accent colored)
  label: string; // Tektur 900 uppercase row label (var(--fg))
  atFrame?: number; // reveal frame override (default 12 + i*10) — sync to VO
};

export type RosterStaggerScene = {
  kind: 'roster-stagger';
  items: RosterStaggerItem[];
  ruleTitle?: string; // optional Workbench kicker heading above the rows
  durationInFrames: number;
  template?: string;
  transition?: string;
  field?: SceneField; // Americana field token name (generated union — no freestyle colors)
  amBeat?: string;
  marker?: string;
  beatNo?: string;
  vo?: string;
  caption?: string;
  voTag?: string;
  variant?: string;
  mascot?: unknown;
  instant?: boolean;
  reveal?: string;
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
};

export type Scene =
  | AsciiFieldScene
  | BlockHookScene
  | RosterStaggerScene
  | GenerativeScene
  | Heatmap3DScene
  | BrollScene
  | WinProbScene
  | FormulaScene
  | MonteCarloScene
  | PlinkoScene
  | GuessRevealScene
  | BarRaceScene
  | ShotMapScene
  | RadarScene
  | Poisson2DScene
  | OutroScene2
  | FlowScene
  | CardScene
  | ScreenScene
  | CounterScene
  | VersusScene
  | EditorialScene
  | NodeGraphScene
  | AgentScene
  | FlowGraphScene
  | LoopGraphScene
  | FieldGridScene
  | QuoteScene
  | TimelineScene
  | OutroScene
  | BarsScene
  | PretextScene;

// Persistent brand chrome shown for the whole video (fades in once at the start,
// stays put — no per-scene flicker). Labels are stable across the runtime.
export type ChromeConfig = {
  topLeft?: string; // next to the mark
  topRight?: string;
  footerLeft?: string; // default "caelithlabs.com"
  footerRight?: string;
  mark?: 'block' | 'cursor' | 'caret'; // 'block' = Labs square before wordmark; 'cursor' = Caelith blinking petrol cursor after; 'caret' = Vektor thin ALWAYS-TEAL blinking caret (BRAND.md — never palette-recolored)
};

export type VideoJson = {
  fps?: number; // default 30
  width?: number; // default 1080
  height?: number; // default 1920
  // Opt-in design-system skin. Default 'vmax' (the locked VMAX system) — omitting
  // the field keeps every existing video byte-identical. 'americana' = the
  // Americana Cut v1.0 (locked 2026-07-04): ink chrome bar + flat fields +
  // Tektur/Workbench type + ascii dark beats. Spec: vektor/canon/americana-tokens.json.
  skin?: 'vmax' | 'americana';
  brand?: BrandOverrides; // per-video CSS-var overrides (token references — see TokenRef)
  chrome?: ChromeConfig; // when set, one persistent bar set replaces per-scene bars
  scenes: Scene[];
  audio?: {
    voSrc?: string; // ElevenLabs PVC voiceover, path under public/
    voVolume?: number; // default 1
    musicSrc?: string; // optional bed, path under public/ (looped under the VO)
    musicVolume?: number; // default 0.12
    endMusicSrc?: string; // energy track for the closing beat (starts at the last scene)
    endMusicVolume?: number; // default 0.3
    sfx?: boolean; // auto SFX: a low impact into the winprob reveal
  };
  captions?: CaptionWord[]; // inline word timings (absolute ms)
  captionsFile?: string; // OR a path the renderer loads into `captions`
  captionStyle?: 'tiktok' | 'minimal' | 'keyword'; // default 'tiktok'; 'keyword' = punchy 2-word call-outs (Vektor hybrid)
  fx?: {
    orbs?: boolean; // drifting blurred accent orbs behind everything (atmosphere)
    grain?: boolean; // subtle film grain overlay
    grade?: boolean; // filmic finishing layer (vignette + brand tint + animated grain)
    gradientBg?: boolean; // living gradient-mesh background (ShaderGradient-inspired)
  };
};

export type VideoProps = {
  video: VideoJson;
};

export const FPS = 30;

// Resolve a scene's frame length (card scenes may inherit from card.durationInFrames).
export const sceneFrames = (scene: Scene): number => {
  if (scene.kind === 'card') {
    return scene.durationInFrames ?? scene.card.durationInFrames;
  }
  return scene.durationInFrames;
};

export const totalFrames = (video: VideoJson): number =>
  video.scenes.reduce((sum, scene) => sum + sceneFrames(scene), 0);

export const defaultVideo: VideoJson = {
  fps: FPS,
  width: 1080,
  height: 1920,
  scenes: [
    {
      kind: 'card',
      durationInFrames: 105,
      card: {
        type: 'statement',
        kicker: 'caelith labs',
        kickerRight: 'automation',
        lines: ['recruiters lose', '12 hours a week'],
        accentWords: ['12 hours'],
        sub: 'to manual CV screening.',
        durationInFrames: 105,
        footerRight: 'proof · recruitment',
      },
    },
    {
      kind: 'card',
      durationInFrames: 150,
      card: {
        type: 'flow',
        kicker: 'the build',
        kickerRight: 'n8n · attio',
        nodes: ['01  CV IN', '02  PARSE', '03  SCORE', '04  SHORTLIST'],
        accentWords: ['owner'],
        durationInFrames: 150,
        footerRight: 'module · workflow',
      },
    },
    {
      kind: 'card',
      durationInFrames: 105,
      card: {
        type: 'result',
        kicker: 'the outcome',
        kickerRight: 'caelith labs',
        lines: ['12 hours a week', 'back to recruiting.'],
        accentWords: ['back to recruiting.'],
        sub: 'book a free teardown — link below.',
        durationInFrames: 105,
        footerRight: 'caelithlabs.com',
      },
    },
  ],
  captionStyle: 'tiktok',
};
