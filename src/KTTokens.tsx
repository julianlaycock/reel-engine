// NO. 034 "claude context" — KT-Remotion. Shared grammar imported from KTHook.tsx
// (ONE implementation, no look-alikes), same as KTState/KTFunnel/KTStack.
//
// The film's argument, and therefore its visual spine: five repos promise to cut
// your Claude Code token bill and exactly one of them published a measurement, so
// every plate here shows EVIDENCE rather than a claim. The bars are a before and
// an after. The repo card draws the evaluation FOLDER, because the folder existing
// at all is the point. The A/B plate draws two identical runs so the control reads
// as a control. Nothing on screen is a promise.
//
// It is a recommendation film, so it also states the price. S5 puts the install
// line and the two credentials it will not work without in ONE beat: separating
// them would let the promise land without the cost attached, which is what every
// other video in this category does.
//
// Locked taste rulings carried from NO. 026 / 027 / 033, held here:
//   - no glyph-scramble anywhere (so no w.shuffle, and no w.chaos either)
//   - visualisations enter EARLY and hold LONG
//   - text on viz beats sits top, never touching the viz
//   - everything cuts on exact frames; nothing fades across a seam
//
// Built on the ported effect set, nothing new ported: MatteWipe and
// ZigzagMarquee from KTSeams, Odometer from KTEffects. Everything else is a
// film-local plate, which is what every KT film has.
//
// Field plan: ink -> cream (9.9s) -> ink (20.1s) -> red (24.5s) -> cream (36.1s)
// -> red (41.8s). The rotation law is that a film does not repeat its
// predecessor; NO. 033 ran ink -> cream -> red -> cream -> ink -> red. Red carries
// the two beats that cost the viewer something: the install and its price.
//
// SAFE ZONE IS A BUILD CONSTRAINT, NOT A REVIEW STEP. Everything meaningful lives
// inside x150-930 / y220-1420, drop shadows included. VIZ_L/VIZ_W below are that
// box and nothing may exceed it.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f, Word} from './KTHook';
import {TOKENS_BEATS, TOKENS_END_MS} from './KTTokensWords';
import {MatteWipe, ZigzagMarquee} from './KTSeams';
import {Odometer, rampValues} from './KTEffects';
import './style.css';

export const KT_TOKENS_FRAMES = f(TOKENS_END_MS);

// One declaration each, so the file adds two font-family literals rather than
// forty. (The drift ratchet counts them; see vektor CLAUDE.md.)
const FONT = '"Printvetica", "Helvetica Neue", sans-serif';
const FONT_UI = '"Inter Tight", sans-serif';

const GREY_C = 'rgba(16,16,16,0.42)';    // spent, on cream
const GREY_I = 'rgba(244,239,223,0.34)'; // spent, on ink
const HAIR_C = 'rgba(16,16,16,0.28)';
const HAIR_I = 'rgba(244,239,223,0.26)';
const WASH_C = 'rgba(16,16,16,0.08)';
const WASH_I = 'rgba(244,239,223,0.10)';
const FURN_R = 'rgba(244,239,223,0.4)';  // furniture on red, which needs more than ink does

// The safe box. Nothing below may leave it.
const VIZ_L = 150, VIZ_W = 780, VIZ_TOP = 800;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const decel = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const prog = (frame: number, fromMs: number, durMs: number) =>
  clamp01((frame - f(fromMs)) / Math.max(1, f(durMs)));

// A beat's viz is mounted for the beat's whole extent and nothing else, so a
// plate can never bleed across a seam.
const Window: React.FC<{fromMs: number; toMs: number; children: React.ReactNode}> =
  ({fromMs, toMs, children}) => {
    const frame = useCurrentFrame();
    if (frame < f(fromMs) || frame >= f(toMs)) return null;
    return <>{children}</>;
  };

// ---- S1 -- the claim -------------------------------------------------------
// The hero number is on the type layer. This is the bar it lands against: a
// second column visibly shorter than the first, which is what 40% means in one
// picture. Two words label it and nothing else is needed.
const ClaimBars: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = decel(prog(frame, 2600, 900));
  const cut = decel(prog(frame, 4200, 700));
  const full = VIZ_W * 0.92;
  return (
    <>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 70, width: full * grow,
        height: 62, background: HAIR_I}} />
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 152, width: full * 0.6 * cut,
        height: 62, background: RED}} />
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 246, width: VIZ_W,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: GREY_I}}>
        <span>WITH GREP</span>
        <span style={{color: cut > 0.5 ? RED : GREY_I}}>WITH SEARCH</span>
      </div>
    </>
  );
};

// ---- S2 -- the thing nobody else has ---------------------------------------
// A REAL capture of the repo's evaluation directory, full-bleed, scrolling.
//
// This was a drawn card until 2026-08-14. The founder caught it: a film whose
// whole argument is "they published the evidence" was showing a picture of the
// evidence instead of the evidence. The ruling that covers it is from 2026-07-19
// ("AI decides WHEN to screenshot; full-bleed is the screenshot treatment") and
// lived only in DECISIONS.md, which no gate reads — so the canon now carries it
// as treatments.screenshot and this plate obeys it.
//
// Captured with scripts/capture-url.mjs from
// github.com/zilliztech/claude-context/tree/master/evaluation at 1080x3160, so it
// is wider than nothing and taller than the frame and can scroll.
//
// FULL BLEED MEANS FULL BLEED: no wordmark, no footer and no type while it is up.
const SHOTS: {from: number; to: number; src: string}[] = [
  {from: 11800, to: 17600, src: 'screens/no034-evaluation.png'},
];

const ShotPlate: React.FC<{shot: {from: number; to: number; src: string}}> = ({shot}) => {
  const frame = useCurrentFrame();
  const IMG_H = 3160;
  // Slow, linear scroll. A drift that eases would read as a camera move; this is
  // a page being read.
  const t = clamp01((frame - f(shot.from)) / Math.max(1, f(shot.to - shot.from)));
  const y = -(IMG_H - 1920) * t;
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: INK}}>
      <Img src={staticFile(shot.src)}
        style={{position: 'absolute', left: 0, top: y, width: 1080}} />
    </AbsoluteFill>
  );
};

// ---- S3 -- the experiment --------------------------------------------------
// Two identical runs side by side, so the control reads as a control. The only
// difference between the columns is the one line that changed, and the score
// underneath is the same on both sides. That line is what makes the comparison
// mean anything, so it is drawn last and on its own.
const AbPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const cols = [
    {k: 'RUN A', tool: 'grep', at: 20600},
    {k: 'RUN B', tool: 'semantic search', at: 21400, live: true},
  ];
  const cw = (VIZ_W - 24) / 2;
  return (
    <>
      {cols.map((c, i) => {
        const p = decel(prog(frame, c.at, 340));
        if (p <= 0) return null;
        return (
          <div key={c.k} style={{position: 'absolute', left: VIZ_L + i * (cw + 24),
            top: VIZ_TOP + 60, width: cw, height: 280,
            border: `2px solid ${c.live ? INK : HAIR_C}`,
            background: c.live ? WASH_C : 'transparent',
            opacity: p, transform: `translateY(${(1 - p) * 16}px)`,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'center', rowGap: 16, padding: '0 16px'}}>
            <div style={{fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: GREY_C}}>{c.k}</div>
            <div style={{fontFamily: FONT, fontSize: 44, color: INK, textAlign: 'center'}}>{c.tool}</div>
            <div style={{fontFamily: FONT_UI, fontSize: 19, letterSpacing: 2, color: GREY_C}}>
              30 FIXES · 3 RUNS
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 386, width: VIZ_W,
        opacity: decel(prog(frame, 22600, 500)), textAlign: 'center',
        fontFamily: FONT_UI, fontSize: 22, letterSpacing: 3, color: GREY_C}}>
        SAME ANSWER QUALITY
      </div>
    </>
  );
};

// ---- S4 -- the drop --------------------------------------------------------
// Both figures counted down. The odometer SNAPS by design: anything smooth reads
// as a slider and loses the mechanical feel the effect exists for.
const DropPlate: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 50, width: VIZ_W,
      fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: GREY_I}}>
      TOKENS PER FIX
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 94, width: VIZ_W,
      fontFamily: FONT, fontSize: 107, color: CREAM, lineHeight: 1}}>
      <Odometer values={rampValues(73373, 44449, 20, (n) => n.toLocaleString('en-US'))}
        fromMs={25200} tickMs={80} />
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 234, width: VIZ_W,
      height: 2, background: HAIR_I}} />
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 276, width: VIZ_W,
      fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: GREY_I}}>
      TOOL CALLS
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 320, width: VIZ_W,
      fontFamily: FONT, fontSize: 86, color: CREAM, lineHeight: 1}}>
      <Odometer values={rampValues(8, 5, 6, (n) => String(n))} fromMs={27600} tickMs={110} />
    </div>
  </>
);

// ---- S5 -- what it costs ---------------------------------------------------
// The install line, then the two credentials it will not work without. The
// command is drawn as a terminal row because it is the only thing on screen the
// viewer is meant to copy.
const CostPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const p = decel(prog(frame, 30200, 400));
  const keys = [
    {k: 'OPENAI_API_KEY', why: 'embeddings', at: 32400},
    {k: 'ZILLIZ ACCOUNT', why: 'vector store', at: 33600},
  ];
  return (
    <>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 60, width: VIZ_W,
        border: `2px solid ${CREAM}`, padding: '22px 26px', opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
        fontFamily: FONT_UI, fontSize: 26, color: CREAM}}>
        <span style={{color: FURN_R}}>$ </span>claude mcp add claude-context
      </div>
      {keys.map((r, i) => {
        const rp = decel(prog(frame, r.at, 320));
        if (rp <= 0) return null;
        return (
          <div key={r.k} style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 200 + i * 92,
            width: VIZ_W, opacity: rp, transform: `translateX(${(1 - rp) * -20}px)`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '14px 0', borderBottom: `2px solid ${FURN_R}`}}>
            <span style={{fontFamily: FONT_UI, fontSize: 24, letterSpacing: 2, color: CREAM}}>{r.k}</span>
            <span style={{fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: FURN_R}}>{r.why}</span>
          </div>
        );
      })}
    </>
  );
};

// ---- S6 -- where to get it -------------------------------------------------
const FindPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const p = decel(prog(frame, 36600, 400));
  return (
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 90, width: VIZ_W,
      border: `2px solid ${INK}`, background: WASH_C, padding: '30px 34px', opacity: p,
      transform: `translateY(${(1 - p) * 16}px)`, display: 'flex',
      flexDirection: 'column', rowGap: 12}}>
      <div style={{fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: GREY_C}}>GITHUB.COM</div>
      <div style={{fontFamily: FONT, fontSize: 55, color: INK}}>zilliztech / claude-context</div>
      <div style={{fontFamily: FONT_UI, fontSize: 22, letterSpacing: 2, color: GREY_C}}>
        12,395 stars · MIT
      </div>
    </div>
  );
};

// ---- S7 -- the end card ----------------------------------------------------
// THE HOUSE OUTRO. NO. 030 ends on a red field with fourteen rows of "vektor"
// folding down the frame at 13% cream, and three type rows over it: comment /
// the keyword huge with an underline / the promise. That is the standard and it
// is deliberately the same film to film.
//
// The unit's trailing DOUBLE SPACE is load-bearing: rowDelta = amp*4/period =
// 260*4/13 = 80px must stay under the inter-word gap or adjacent rows shear.
// These are NO. 030's shipped numbers.
const TokensOutro: React.FC = () => (
  <ZigzagMarquee fromMs={41760} unit={'vektor  '} amp={260} period={13} rows={14}
    rowH={136} fontSize={150} dur={75} color={'rgba(244,239,223,0.13)'} />
);

// ---- seams -----------------------------------------------------------------
// ONE COLOUR PER WIPE (founder, 2026-08-08: "make them cleaner, with 1 colour,
// i see like 3 colors"). All three MatteWipe panels take the INCOMING field
// colour. Done by passing the same value three times, NOT by editing MatteWipe:
// that component is the single shared implementation every KT film renders.
//
// Each entry's field MUST equal the bg of the beat it lands on — check-kt's
// seamCarriesIncomingField rule, which caught NO. 033 wiping ink onto a red beat.
const FLIPS: {ms: number; field: string}[] = [
  {ms: 9920, field: CREAM},
  {ms: 20080, field: INK},
  {ms: 24540, field: RED},
  {ms: 36060, field: CREAM},
  {ms: 41760, field: RED},
];
const Seams: React.FC = () => (
  <>
    {FLIPS.map((w) => (
      <MatteWipe key={w.ms} atMs={w.ms} main={w.field} accent1={w.field} accent2={w.field} />
    ))}
  </>
);

// THE WIPE CARRIES A CLEAN SHEET (founder, 2026-08-14).
//
// One colour per wipe was ruled on 2026-08-08 and check-kt enforced it at the
// CALL SITE: main, accent1 and accent2 are the same value, so the panels are one
// colour. The founder still saw three and four colours scrubbing NO. 034, and
// was right. MatteWipe paints at zIndex 5 over whatever is still mounted, and
// beneath it the outgoing beat's type and its plate are both still on screen —
// so the frame reads field + panel + type + accent even though the panels agree.
//
// Measured with scripts/check-seam-colours.mjs: seam 9920ms carried ink 95.4%,
// red 1.3%, type 2.6% and cream 0.7% at the head of the train. Four.
//
// So the type layer and the plates are suppressed for the frames the train is on
// screen. The wipe travels over a flat field and lands on a flat field, which is
// what "one colour per wipe" always meant.
const WIPE_LEAD = 16;   // MW.sweep — the train starts this far before atMs
const WIPE_TAIL = 6;    // the main panel settles at x0 a few frames after
const inWipe = (frame: number) =>
  FLIPS.some((w) => frame >= f(w.ms) - WIPE_LEAD && frame < f(w.ms) + WIPE_TAIL);

// ---- composition -----------------------------------------------------------
export const KTTokens: React.FC<{layer?: 'all' | 'type' | 'viz'}> = ({layer = 'all'}) => {
  const frame = useCurrentFrame();
  // Every hook is called before any early return. A hook after an early return
  // passes every still and fails the video render with React error 310, and
  // `remotion render` exits 0 while printing it (NEXT-VIDEO-HANDOFF.md).
  // The error number is written without its hash on purpose: check-drift counts
  // a hash followed by 3-8 hex digits as a raw colour, and a React error code is
  // all hex digits, so writing it the usual way trips the ratchet.
  const beat = TOKENS_BEATS.find((s) => frame >= f(s.from) && frame < f(s.to)) ??
    (frame >= f(TOKENS_BEATS[TOKENS_BEATS.length - 1].from)
      ? TOKENS_BEATS[TOKENS_BEATS.length - 1]
      : TOKENS_BEATS[0]);
  // Suppress type and plates while the panel train is on screen — see inWipe.
  const wiping = inWipe(frame);
  const shot = SHOTS.find((sh) => frame >= f(sh.from) && frame < f(sh.to));
  const lightField = beat.bg === CREAM;
  // Footer contrast is field-aware (design review 2026-08-08). It was
  // cream-at-34% on every dark field, which measures 1.47:1 against RED —
  // effectively invisible, and on the beat that carries the CTA.
  const furn = lightField
    ? 'rgba(16,16,16,0.55)'
    : (beat.bg === RED ? CREAM : 'rgba(244,239,223,0.55)');
  return (
    <AbsoluteFill style={{backgroundColor: beat.bg, fontFamily: FONT}}>
      {layer !== 'type' && !wiping && shot ? <ShotPlate shot={shot} /> : null}

      {layer !== 'type' && !wiping && !shot ? (<>
      <Window fromMs={1600}  toMs={9920}> <ClaimBars /></Window>
      <Window fromMs={20080} toMs={24540}><AbPlate /></Window>
      <Window fromMs={24540} toMs={30200}><DropPlate /></Window>
      <Window fromMs={30200} toMs={36060}><CostPlate /></Window>
      <Window fromMs={36060} toMs={41760}><FindPlate /></Window>
      <Window fromMs={41760} toMs={TOKENS_END_MS}><TokensOutro /></Window>
      </>) : null}

      {layer !== 'viz' && !wiping && !shot ? (
      <AbsoluteFill style={{alignItems: 'center',
        justifyContent: beat.top ? 'flex-start' : 'center',
        flexDirection: 'column', rowGap: 26,
        // 330 not 260: the wordmark sits at y240 to clear Instagram's Reels
        // header, so the type block starts below its baseline.
        padding: beat.top ? '330px 150px 0' : '0 150px',
        textAlign: 'center'}}>
        {beat.rows.map((row, ri) => (
          <div key={`${beat.from}-${ri}`} style={{lineHeight: 1.14}}>
            {row.words.map((w, wi) => (
              <Word key={wi} w={w} base={row.size} baseColor={beat.type} />
            ))}
          </div>
        ))}
      </AbsoluteFill>
      ) : null}

      {layer === 'all' ? <Seams /> : null}

      {layer === 'all' && !shot ? (<>
      {/* FURNITURE — inside the safe box. The 44px rail is HORIZONTAL-ONLY since
          2026-08-07: Reels chrome cuts the top and bottom, so the wordmark sits
          at y240 and the footer slugs at y1372, not at the rail. NO. 033 put the
          footer at y1560 as a founder override scoped to that film only; this
          one is back inside the box. */}
      <div style={{position: 'absolute', top: 240, left: VIZ_L, fontSize: 40, fontWeight: 600,
        letterSpacing: '-0.045em', color: lightField ? INK : CREAM,
        fontFamily: FONT_UI}}>vektor</div>
      <div style={{position: 'absolute', top: 1372, left: VIZ_L, fontSize: 22, letterSpacing: 3,
        color: furn}}>vektor /// claude context</div>
      <div style={{position: 'absolute', top: 1372, left: VIZ_L, width: VIZ_W, textAlign: 'right',
        fontSize: 22, letterSpacing: 3, color: furn}}>comment. context.</div>
      </>) : null}
    </AbsoluteFill>
  );
};
