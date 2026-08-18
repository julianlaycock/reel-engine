// NO. 027 "the free funnel" — KT-Remotion. Shared grammar imported from
// KTHook.tsx (ONE implementation, no look-alikes), same as KTState.tsx.
//
// The film's argument, and therefore its visual spine: ManyChat's price is not
// buying you code. So the graphics only ever show RESULTS and PRICES — a bill, a
// contact ceiling, a DM arriving, a report full of zeros. Founder ruling: tease in
// the film, give everything on the page. There is no code on screen anywhere.
//
// Locked taste rulings carried over from NO. 026:
//   - no glyph-scramble anywhere
//   - visualisations enter EARLY and hold LONG
//   - text on viz beats sits top, never touching the viz
//   - everything cuts on exact frames; nothing fades across a seam
//
// Field plan: cream -> ink (32.8s) -> cream (52.7s) -> ink (65.8s) -> red (103.9s).
// Four flips. Deliberately NOT NO. 026's plan (ink -> cream -> ink -> red); the
// canon's field-rotation law is that a film does not repeat its predecessor.
//
// SAFE ZONE IS A BUILD CONSTRAINT, NOT A REVIEW STEP (NO. 026 cost several
// rebuild cycles here). Everything meaningful lives inside x150-930 / y220-1420,
// drop shadows included. VIZ_L/VIZ_W below are that box, and nothing may exceed it.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f, useBucket, jit, Word} from './KTHook';
import {FUNNEL_BEATS, FUNNEL_END_MS} from './KTFunnelWords';
import {MatteWipe, ZigzagMarquee} from './KTSeams';
import {Odometer, rampValues, PumpRect} from './KTEffects';
import './style.css';

export const KT_FUNNEL_FRAMES = f(FUNNEL_END_MS);

// One declaration each, so the file adds two font-family literals rather than
// thirty. (The drift ratchet counts them; see vektor CLAUDE.md.)
const FONT = '"Printvetica", "Helvetica Neue", sans-serif';
const FONT_UI = '"Inter Tight", sans-serif';

const GREY_C = 'rgba(16,16,16,0.42)';   // spent, on cream
const GREY_I = 'rgba(244,239,223,0.34)'; // spent, on ink
const HAIR_C = 'rgba(16,16,16,0.28)';
const HAIR_I = 'rgba(244,239,223,0.26)';

// The safe box. Viz beats build downward from VIZ_TOP; the type layer owns
// everything above it.
const VIZ_L = 150, VIZ_W = 780, VIZ_TOP = 800, VIZ_BOTTOM = 1420;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const decel = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
// Progress through a window, in ms.
const prog = (frame: number, fromMs: number, durMs: number) =>
  clamp01((frame - f(fromMs)) / Math.max(1, f(durMs)));

// ---- shared plate ----------------------------------------------------------
// NO. 030 card language: hairline stroke, transparent fill, hard corners. Every
// data graphic in this film is built from it, so the beats read as one system.
const Plate: React.FC<{
  x: number; y: number; w: number; h: number; color: string;
  children?: React.ReactNode; grow?: number; align?: string;
}> = ({x, y, w, h, color, children, grow = 1, align = 'center'}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h,
    border: `3px solid ${color}`, color, display: 'flex', alignItems: 'center',
    justifyContent: align, fontFamily: FONT,
    transform: `scaleY(${grow})`, transformOrigin: 'top center', overflow: 'hidden'}}>
    {children}
  </div>
);

// ---- S1 · the bill ---------------------------------------------------------
// The accusation needs its number grounded instantly: $99 is only true at the
// tier a 5,000-comment reel forces you onto, so the bar pair carries the volume
// as well as the price. ManyChat's mark is monochrome by their own brand (black
// on light, white on dark) — the ink rendering is the faithful one on cream.
const BillBars: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(1710) || frame >= f(9920)) return null;
  const g = decel(prog(frame, 1710, 900));
  // Three v1 defects fixed here:
  //  - the wordmark sat at y824 while the bar top reached y873, a real collision;
  //    the logo now owns a row above the baseline with clearance.
  //  - "$0" was a 0.02-scaled bar, i.e. a 4px red sliver that read as an axis
  //    artifact. It is now an EMPTY slot with a hairline floor, so the absence of
  //    a bar is the point rather than a rendering fault.
  //  - the baseline rule spanned the full 780px under 550px of bars; it now spans
  //    the bars only, which is the NO. 031 language.
  const BASE = VIZ_TOP + 330;
  const MAXH = 210;
  const theirs = MAXH * g;
  const COL = 250, GAP = 60, RUN = COL * 2 + GAP;
  // The chart is CENTRED in the safe box, not pinned to its left edge. v2 sat the
  // 560px bar pair at x150 inside a 780px box, so the whole graphic read as
  // left-drifted against centred type above it.
  const CX = VIZ_L + (VIZ_W - RUN) / 2;
  return (
    <AbsoluteFill>
      <Img src={staticFile('images/logos/manychat.svg')}
        style={{position: 'absolute', left: CX, top: VIZ_TOP + 10, width: 280, height: 52,
          objectFit: 'contain', objectPosition: 'left center'}} />
      {/* the bars sit on one baseline rule, no axis — NO. 031 language */}
      <div style={{position: 'absolute', left: CX, top: BASE, width: RUN, height: 3, background: HAIR_C}} />
      <div style={{position: 'absolute', left: CX, top: BASE - theirs, width: COL,
        height: theirs, background: INK}} />
      {frame >= f(7280) && (
        <div style={{position: 'absolute', left: CX + COL + GAP, top: BASE - 3, width: COL, height: 3,
          background: RED}} />
      )}
      {/* pump-rect: the bill's own baseline takes a beat under "Ninety nine
          dollars. To send a D M." Accelerating and decaying, so it lands as
          pressure and then settles rather than looping. */}
      <PumpRect fromMs={2200} x={CX} y={BASE} w={COL} h={6} color={RED}
        beat={11} pumps={5} ampY={2.6} attack={2} release={6} decay={0.78} accel={0.9} anchor="bottom" />
      {/* odometer: the bill accrues to $99 in hard ticks instead of cutting in. */}
      <div style={{position: 'absolute', left: CX, top: BASE + 18, width: COL, textAlign: 'center',
        fontFamily: FONT, fontSize: 44, color: INK}}>
        <Odometer fromMs={1710} tickMs={70}
          values={rampValues(0, 99, 7, (n) => `$${n}/mo`)} />
      </div>
      {frame >= f(7280) && (
        <div style={{position: 'absolute', left: CX + COL + GAP, top: BASE + 18, width: COL, textAlign: 'center',
          fontFamily: FONT, fontSize: 44, color: RED}}>$0</div>
      )}
      <div style={{position: 'absolute', left: CX, top: BASE + 82, width: RUN, textAlign: 'center',
        fontFamily: FONT_UI, fontSize: 24, letterSpacing: 2, color: GREY_C}}>5,000 CONTACTS IN A MONTH</div>
    </AbsoluteFill>
  );
};

// ---- S2 · 1,000 -> 25 ------------------------------------------------------
// "resets monthly" is NOT decoration. The old 1,000 was a cumulative permanent
// ceiling and the new 25 resets, so the two are not like-for-like; stating the
// drop without the qualifier is arithmetically true and substantively unfair.
// It appears with the 25 and holds as long as the 25 does.
const CeilingDrop: React.FC = () => {
  const frame = useCurrentFrame();
  // Holds the whole beat again. It briefly cut at 17.2s to hand the frame to a
  // container-breach graphic, which was cut on founder judgement (see below), so
  // this is the only device on the beat and must carry it to the flip.
  if (frame < f(10800) || frame >= f(20080)) return null;
  const dropped = frame >= f(12480);
  const g = decel(prog(frame, 12480, 800));
  const y = VIZ_TOP + 60;
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: VIZ_L, top: y, width: 340, textAlign: 'center'}}>
        <div style={{fontSize: 120, color: dropped ? GREY_C : INK,
          textDecoration: dropped ? 'line-through' : 'none'}}>1,000</div>
        <div style={{fontSize: 24, letterSpacing: 3, color: GREY_C, fontFamily: FONT_UI}}>WAS, AND KEPT</div>
      </div>
      {dropped && (
        <>
          <div style={{position: 'absolute', left: VIZ_L + 360, top: y + 44, width: 60, height: 3,
            background: RED, transform: `scaleX(${g})`, transformOrigin: 'left center'}} />
          <div style={{position: 'absolute', left: VIZ_L + 440, top: y, width: 340, textAlign: 'center',
            opacity: g}}>
            {/* odometer: 1,000 ticks DOWN to 25 rather than cutting. It reads as
                "this became that", which is what happened — one change, not a
                gradual decline. The struck 1,000 and RESETS MONTHLY hold either
                side so the comparison stays honest. */}
            <div style={{fontSize: 120, color: RED}}>
              <Odometer fromMs={12480} tickMs={65}
                values={rampValues(1000, 25, 8, (n) => n.toLocaleString('en-US'))} />
            </div>
            <div style={{fontSize: 26, letterSpacing: 3, color: INK, fontFamily: FONT_UI}}>RESETS MONTHLY</div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ---- S2b · container-breach — CUT 2026-08-07 -------------------------------
// A container-breach graphic sat here: 25 dots filling a box, then the surplus
// bursting through red walls on "burns through it". It was built, debugged and
// measured working (4x more surplus outside the box than in, walls flipping to
// accent on the beat) and the founder cut it on sight: "makes no sense, looks
// cheap." Their call on their own brand, and the honest read is that a
// dot-grid metaphor is a weaker device than the struck 1,000 beside a red 25.
//
// The port stays in KTEffects.tsx so the work is not lost, and so nobody rebuilds
// it for another film without knowing it was tried and rejected here.

// ---- S3 · the meter --------------------------------------------------------
// Active contacts refill every month and every one past the cap carries a fee.
// The meter fills past its own cap line rather than stopping at it, which is the
// whole point of the billing change.
const ContactMeter: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(21600) || frame >= f(32800)) return null;
  const fill = decel(prog(frame, 21600, 2600));
  const over = frame >= f(24600);
  const y = VIZ_TOP + 120;
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: VIZ_L, top: y, width: VIZ_W, height: 92,
        border: `3px solid ${CREAM}`}} />
      <div style={{position: 'absolute', left: VIZ_L + 3, top: y + 3, width: (VIZ_W - 6) * fill,
        height: 86, background: over ? RED : CREAM}} />
      {/* the cap line, at 62% — the meter deliberately runs past it */}
      <div style={{position: 'absolute', left: VIZ_L + VIZ_W * 0.62, top: y - 22, width: 3, height: 136,
        background: CREAM}} />
      <div style={{position: 'absolute', left: VIZ_L + VIZ_W * 0.62 - 90, top: y - 58, width: 180,
        textAlign: 'center', fontSize: 24, letterSpacing: 2, color: GREY_I, fontFamily: FONT_UI}}>YOUR CAP</div>
      {over && (
        <div style={{position: 'absolute', left: VIZ_L, top: y + 128, width: VIZ_W, textAlign: 'center',
          fontSize: 38, color: RED}}>+ a fee on every contact past it</div>
      )}
      {frame >= f(28240) && (
        <div style={{position: 'absolute', left: VIZ_L, top: y + 200, width: VIZ_W, textAlign: 'center',
          fontSize: 30, color: GREY_I, fontFamily: FONT_UI, letterSpacing: 1}}>
            deleted every contact · billed anyway
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- S4 · the mechanism ----------------------------------------------------
// Four outlined plates, hairline arrows, one per stage, each landing on the word
// that names it. This is the LevyDiagram pattern from KTTax.tsx. The RESULT is on
// screen, never the code that produces it.
// FIVE stages, because the VO names five. v1 had four plates on timings that no
// longer matched the step being spoken, so the graphic contradicted the
// narration. Each ms is the caption frame of the words that name that stage.
const STAGES = [
  {label: 'they comment', ms: 37440},
  {label: 'Meta pings your URL', ms: 39040},
  {label: 'match the word', ms: 41360},
  {label: 'check the follow', ms: 42560},
  {label: 'send the DM', ms: 43680},
];
const FlowPlates: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(37440) || frame >= f(46880)) return null;
  const H = 86, GAP = 24;
  return (
    <AbsoluteFill>
      {STAGES.map((s, i) => {
        if (frame < f(s.ms)) return null;
        const top = VIZ_TOP + i * (H + GAP);
        const g = decel(prog(frame, s.ms, 380));
        const last = i === STAGES.length - 1;
        return (
          <React.Fragment key={s.label}>
            <div style={{position: 'absolute', left: VIZ_L, top, width: VIZ_W, height: H,
              border: `3px solid ${last ? RED : INK}`, color: last ? RED : INK,
              display: 'flex', alignItems: 'center', paddingLeft: 40, fontFamily: FONT,
              fontSize: 42, opacity: g}}>
              {s.label}
            </div>
            {i > 0 && (
              <div style={{position: 'absolute', left: VIZ_L + 60, top: top - GAP, width: 3, height: GAP,
                background: HAIR_C, transform: `scaleY(${g})`, transformOrigin: 'top center'}} />
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ---- S5 · what we run ------------------------------------------------------
// Cloudflare's mark keeps FULL colour on the ink field — it is the only colour in
// the film outside the palette, and it earns that by being the answer to the bill.
const OursPlate: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(47600) || frame >= f(52720)) return null;
  const g = decel(prog(frame, 47600, 600));
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 60, width: VIZ_W, height: 300,
        border: `3px solid ${CREAM}`, opacity: g, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', rowGap: 22}}>
        <Img src={staticFile('images/logos/cloudflare.svg')}
          style={{width: 260, height: 120, objectFit: 'contain'}} />
        <div style={{fontSize: 96, color: CREAM}}>$0</div>
      </div>
      {frame >= f(49600) && (
        <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 400, width: VIZ_W,
          textAlign: 'center', fontSize: 28, letterSpacing: 2, color: GREY_I, fontFamily: FONT_UI}}>
            NO SUBSCRIPTION · NO CONTACT CAP
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- S6 · tenancy ----------------------------------------------------------
// The honest half of the film. ManyChat runs other people's accounts through one
// app, which is what forces Meta's review on them and not on a single-account
// build. Two plates, the difference is the only thing on screen.
const TenancyPlates: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(54800) || frame >= f(65760)) return null;
  const y = VIZ_TOP + 40;
  const mine = frame >= f(59600);
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: VIZ_L, top: y, width: VIZ_W, height: 210,
        border: `3px solid ${INK}`, padding: '26px 34px'}}>
        <Img src={staticFile('images/logos/manychat.svg')}
          style={{width: 220, height: 42, objectFit: 'contain'}} />
        <div style={{fontSize: 34, color: INK, marginTop: 18}}>other people&rsquo;s accounts, one app</div>
        <div style={{fontSize: 30, color: RED, marginTop: 10}}>→ Meta&rsquo;s review, business verification</div>
      </div>
      {/* pump-rect under "What you're paying for is paperwork." — the film's
          payoff line gets the only other beat in the piece. */}
      <PumpRect fromMs={63440} x={VIZ_L} y={y + 466} w={VIZ_W} h={8} color={RED}
        beat={12} pumps={4} ampY={3.2} attack={2} release={7} decay={0.72} accel={0.88} anchor="bottom" />
      {mine && (
        <div style={{position: 'absolute', left: VIZ_L, top: y + 250, width: VIZ_W, height: 176,
          border: `3px solid ${INK}`, padding: '26px 34px',
          opacity: decel(prog(frame, 59600, 500))}}>
          <div style={{fontSize: 40, color: INK}}>one account. mine.</div>
          <div style={{fontSize: 30, color: GREY_C, marginTop: 14}}>→ none of it</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- S7 · the report of zeros ----------------------------------------------
// The war story's whole point is that the failure was INVISIBLE: bumpCounter only
// runs after a successful send, so a dead funnel and a quiet night render the same
// readout. The zeros land campaign by campaign, then the marker strikes the word
// that was lying — on type, never on the data.
// Generic by founder ruling: the film must not use our own campaigns as the
// worked example. The shape is the point, every row reading zero.
const ZERO_ROWS = ['reel 01 / keyword', 'reel 02 / keyword', 'reel 03 / keyword', 'reel 04 / keyword'];
const ReportZeros: React.FC = () => {
  const frame = useCurrentFrame();
  // Both hooks run before the early return. Calling useBucket() after it changes
  // the hook count from frame to frame and fails the whole render with React
  // error #310 — invisible to a still render, which only ever renders one frame.
  const b = useBucket();
  if (frame < f(75440) || frame >= f(87120)) return null;
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 20, width: VIZ_W,
        fontSize: 26, letterSpacing: 3, color: GREY_I, fontFamily: FONT_UI}}>FUNNEL REPORT</div>
      {ZERO_ROWS.map((r, i) => {
        const ms = 76400 + i * 900;
        if (frame < f(ms)) return null;
        return (
          <div key={r} style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 80 + i * 92, width: VIZ_W,
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            borderBottom: `2px solid ${HAIR_I}`, paddingBottom: 14, color: CREAM, fontSize: 40}}>
            <span>{r}</span>
            <span style={{color: RED, fontSize: 52}}>commented 0</span>
          </div>
        );
      })}
      {frame >= f(81760) && (
        <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 460, width: VIZ_W,
          textAlign: 'center', fontSize: 32, color: GREY_I, fontFamily: FONT_UI, letterSpacing: 1,
          transform: `translateY(${jit(907, b, 1) * 2}px)`}}>
            the funnel was dead for the whole night
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- S8 · their own words --------------------------------------------------
// Set verbatim, and attributed, because it is the strongest line available and
// paraphrasing a quote from the company you are criticising is how you lose it.
const QuotePlate: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(94880) || frame >= f(103920)) return null;
  const g = decel(prog(frame, 94880, 600));
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 90, width: VIZ_W,
        border: `3px solid ${INK}`, padding: '40px 38px', opacity: g}}>
        <div style={{fontSize: 46, color: INK, lineHeight: 1.24}}>
          &ldquo;We can&rsquo;t reverse bans or account restrictions.&rdquo;
        </div>
        <div style={{marginTop: 26, display: 'flex', alignItems: 'center', gap: 16}}>
          <Img src={staticFile('images/logos/manychat.svg')}
            style={{width: 190, height: 36, objectFit: 'contain'}} />
          <span style={{fontSize: 26, color: GREY_C, fontFamily: FONT_UI, letterSpacing: 2}}>
            THEIR OWN SITE
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- S9 · the repo ---------------------------------------------------------
const RepoCard: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(105000)) return null;
  const g = decel(prog(frame, 105000, 500));
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      {/* fx/zigzag-marquee.js, via KTSeams — the treatment the founder expected
          here and v1 never had. Repeated FUNNEL rows fold into a crease that
          travels down the red field, behind the repo card. The unit's trailing
          DOUBLE SPACE is load-bearing: rowDelta = amp*4/period must stay under
          the inter-word gap or adjacent rows shear. amp 240 / period 14 gives
          68.6px, comfortably inside the reference 96px gap at this size. */}
      <ZigzagMarquee fromMs={104400} unit={'FUNNEL  '} amp={240} period={14}
        color={'rgba(244,239,223,0.16)'} />
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 180, width: VIZ_W, height: 150,
        border: `3px solid ${CREAM}`, color: CREAM, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 42, opacity: g, background: RED}}>
        github.com/vektor-fm/vektor-ig-dm
      </div>
    </AbsoluteFill>
  );
};

// ---- seams ----------------------------------------------------------------
// Field flips are fx/matte-wipe.js (KTSeams.tsx), the same treatment shipped in
// NO. 030 / 031. The panel that stops at x0 CARRIES the incoming field colour, so
// the wipe performs the flip rather than decorating it.
//
// v1 shipped a hand-rolled polyline here under the name "ZigzagFunnel". It was a
// look-alike of an approved treatment and did neither job; deleted, not tuned.
//
// Seven flips instead of v1's four. qa-measure put v1's longest static stretch at
// 38.2s; the extra seams at 20.1s, 46.9s and 87.1s bring the worst down to 21.4s.
const FLIPS: {ms: number; main: string; a1: string; a2: string; border?: string}[] = [
  {ms: 20080,  main: INK,   a1: CREAM, a2: RED,   border: CREAM},
  {ms: 32800,  main: CREAM, a1: RED,   a2: INK,   border: CREAM},
  {ms: 46880,  main: INK,   a1: CREAM, a2: RED,   border: CREAM},
  {ms: 52720,  main: CREAM, a1: INK,   a2: RED,   border: CREAM},
  {ms: 65760,  main: INK,   a1: CREAM, a2: RED,   border: CREAM},
  {ms: 87120,  main: CREAM, a1: RED,   a2: INK,   border: CREAM},
  {ms: 103920, main: RED,   a1: CREAM, a2: INK,   border: CREAM},
];
const Seams: React.FC = () => (
  <>
    {FLIPS.map((w) => (
      <MatteWipe key={w.ms} atMs={w.ms} main={w.main} accent1={w.a1} accent2={w.a2} accent2Border={w.border} />
    ))}
  </>
);

// ---- composition -----------------------------------------------------------
export const KTFunnel: React.FC = () => {
  const frame = useCurrentFrame();
  const beat = FUNNEL_BEATS.find((s) => frame >= f(s.from) && frame < f(s.to)) ??
    (frame >= f(FUNNEL_BEATS[FUNNEL_BEATS.length - 1].from)
      ? FUNNEL_BEATS[FUNNEL_BEATS.length - 1]
      : FUNNEL_BEATS[0]);
  const lightField = beat.bg === CREAM;
  const furn = lightField ? 'rgba(16,16,16,0.45)' : 'rgba(244,239,223,0.35)';
  return (
    <AbsoluteFill style={{backgroundColor: beat.bg, fontFamily: FONT}}>
      <BillBars />
      <CeilingDrop />
      <ContactMeter />
      <FlowPlates />
      <OursPlate />
      <TenancyPlates />
      <ReportZeros />
      <QuotePlate />
      <RepoCard />
      <AbsoluteFill style={{alignItems: 'center',
        justifyContent: beat.top ? 'flex-start' : 'center',
        flexDirection: 'column', rowGap: 26,
        // 330 not 260: the wordmark moved down to y240 to clear Instagram's Reels
        // header, which put it straight under the centred type block. The block
        // now starts below the wordmark's baseline (240 + 40px type + leading).
        padding: beat.top ? '330px 150px 0' : '0 150px', textAlign: 'center'}}>
        {beat.rows.map((row, ri) => (
          <div key={`${beat.from}-${ri}`} style={{lineHeight: 1.14}}>
            {row.words.map((w, wi) => (
              <Word key={wi} w={w} base={row.size} baseColor={beat.type} />
            ))}
          </div>
        ))}
      </AbsoluteFill>
      <Seams />
      {/* FURNITURE — repositioned inside the safe box, 2026-08-07.
          letterpress-tokens.json#layout.platformSafeZone sets furnitureRailPx 44
          and exempts the footer slug from the content zone. Founder confirmed the
          wordmark is CUT in Reels at that rail, and both footer labels sat at
          ~y1826, inside Instagram's caption and username strip. The 44px rail
          predates that evidence.
          These coordinates ANTICIPATE the canon change the founder approved;
          the canon files are amended separately via /canon-change. Until that
          lands, this film is deliberately ahead of the written canon — and note
          the canon gate cannot catch it, because KT films carry no video.json. */}
      <div style={{position: 'absolute', top: 240, left: VIZ_L, fontSize: 40, fontWeight: 600,
        letterSpacing: '-0.045em', color: lightField ? INK : CREAM,
        fontFamily: FONT_UI}}>vektor</div>
      <div style={{position: 'absolute', top: 1372, left: VIZ_L, fontSize: 22, letterSpacing: 3,
        color: furn}}>vektor /// the free funnel</div>
      <div style={{position: 'absolute', top: 1372, left: VIZ_L, width: VIZ_W, textAlign: 'right',
        fontSize: 22, letterSpacing: 3, color: furn}}>comment. funnel.</div>
    </AbsoluteFill>
  );
};
