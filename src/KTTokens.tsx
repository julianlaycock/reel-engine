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

const GREY_C = 'rgba(16,16,16,0.42)';    // spent, on cream — WORDS ONLY, see LABEL_*
const GREY_I = 'rgba(244,239,223,0.34)'; // spent, on ink — WORDS ONLY, see LABEL_*

// READABLE LABEL COLOURS (founder ruling, 2026-08-15: text clears 4.5:1).
//
// GREY_C/GREY_I are the SPENT colour — a word that has been said and is fading
// out of relevance. Being hard to read is the point of them, and they stay as
// they are because NO. 026, 030, 031 and 033 all import them.
//
// They were also being used for every UI LABEL on every plate, where being hard
// to read is not the point. Measured 2026-08-15 with scripts/check-contrast.mjs:
// GREY_C on cream 2.74:1, GREY_I on ink 2.85:1, both under the 3.0 large-text
// floor and far under the 4.5 body floor that 19-26px labels actually need.
// The founder found it by eye first — "sec 33 'what it costs' is barely
// readable" — which is the third time this session a gate agreed with itself
// while the screen disagreed.
//
// NEW constants rather than edited ones: these are imported by locked films and
// the Approval Protocol forbids changing a published artefact. Alphas are the
// measured minimum that clears 4.5, rounded up to a round number.
const LABEL_C = 'rgba(16,16,16,0.62)';    // on cream — 5.07:1 (floor reached at 0.59)
const LABEL_I = 'rgba(244,239,223,0.55)'; // on ink   — 5.57:1 (floor reached at 0.49)
const HAIR_C = 'rgba(16,16,16,0.28)';
const HAIR_I = 'rgba(244,239,223,0.26)';
const WASH_C = 'rgba(16,16,16,0.08)';
const WASH_I = 'rgba(244,239,223,0.10)';
const FURN_R = 'rgba(244,239,223,0.4)';  // furniture on red, which needs more than ink does

// WHITE TEXT, AND A 5% DEEPER RED (founder ruling, 2026-08-15).
//
// FURN_R above stays for RULES AND STROKES, where contrast is decoration rather
// than reading. It was being used for label TEXT at 1.60:1, which is what the
// founder saw at second 33.
//
// Pure black measures 4.96:1 on E7371A and is the only colour that clears 4.5
// against it — and the founder rejected it on sight: "black red doesn't contrast
// well". That is not a matter of taste overruling a measurement. WCAG 2.x is a
// pure relative-luminance formula and is known to mis-rank saturated
// mid-luminance colours; on a strong red it scores dark text high while the eye
// reads it as muddy and vibrating. The metric was the wrong instrument, which is
// the same mistake as measuring the call site instead of the frame.
//
// White is the ceiling on the light side and reaches only 4.23:1 on the current
// red, so the fix is to move the red rather than keep hunting for a text colour
// that does not exist. Scaling E7371A down 5% in linear light:
//
//   E7371A (now)   white 4.23:1   cream 3.68:1
//   DB3419 (-5%)   white 4.65:1   cream 4.04:1   <- clears the floor
//   D03217 (-10%)  white 5.06:1   cream 4.40:1
//
// 5% is close to imperceptible side by side and it moves the whole red field
// permanently onto the right side of the rule — no exemption, no block behind the
// text, no black. It also lifts cream on red from 3.68 to 4.04, which helps the
// outro's large type without touching the house outro spec.
//
// A NEW CONSTANT, not an edit to RED: NO. 026, 030 and 031 import RED from
// KTHook and are locked artefacts. They keep the exact red they shipped with.
const WHITE = '#FFFFFF';
const RED_DEEP = '#DB3419';
const LABEL_R = WHITE;                   // on the deeper red — 4.65:1

// The beat data and the FLIPS list both say RED, because the words file is
// GENERATED and a hand-edit there is lost on the next run. The substitution
// happens once, here, so there is exactly one place that decides which red this
// film renders.
const RULE_R = 'rgba(255,255,255,0.5)';  // a hairline that survives the red field

// FURNITURE COLOUR BY FIELD — a MAP, not a ternary, and that is deliberate.
//
// check-contrast reads text colours out of this source. A ternary hides which
// colour lands on which field behind an expression, so the gate either skips the
// furniture entirely (which is how the footer's 4.05:1 survived two films unnoticed)
// or checks every branch against every field and reports nonsense. A map states
// the pairing the gate needs to know, and states it for a human too.
//
// Measured 2026-08-15. Footer is 22px, so the 4.5 body floor applies to all three:
//   on cream  ink at 62%     5.07:1
//   on red    white          4.65:1
//   on ink    cream at 55%   5.57:1
// Wordmark is 40px, which is large text at a 3.0 floor, and clears with room:
//   on cream  ink            16.54:1
//   on red    cream           4.04:1
//   on ink    cream          16.54:1
const FOOTER_ON: Record<string, string> = {[CREAM]: LABEL_C, [RED_DEEP]: WHITE, [INK]: LABEL_I};
const WORDMARK_ON: Record<string, string> = {[CREAM]: INK, [RED_DEEP]: CREAM, [INK]: CREAM};

const asField = (c: string) => (c === RED ? RED_DEEP : c);

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
// THE CONTEXT FIELD (founder, 2026-08-15). Replaces two bars.
//
// The film's claim is that semantic search cuts token usage ~40%, and the reason
// it can is the one thing the film never showed: grep hands the model the whole
// codebase, search hands it the part that matters. Two bars stated the OUTCOME as
// a quantity. This states the MECHANISM as a picture, at the exact moment the VO
// says "over your whole codebase".
//
// IT CARRIES NO NUMBERS, DELIBERATELY. The repo publishes tokens and tool calls;
// it does not publish how many chunks either method read, and facts.md has no such
// figure. So the field has no count on it and no axis: the tick grid is an
// ILLUSTRATION of a mechanism, not a measurement of one. Labelling it would make
// it read as data the evaluation never produced — which is the drawn-evidence
// mistake of 2026-08-14 wearing a different costume. If a count ever goes on this
// plate it comes from facts.md or it does not go on.
//
// The three lit ticks are FIXED indices, never seeded or random. A random pick
// would differ between a verification still and the video render, and a gate that
// measures a different frame than the one that ships is worthless.
const HITS = [27, 64, 111];
const FIELD_COLS = 20, FIELD_ROWS = 6, FIELD_GAP = 8, FIELD_RGAP = 10, FIELD_TH = 18;

const ContextField: React.FC = () => {
  const frame = useCurrentFrame();
  // Timings unchanged from the bars they replace: both are pinned to the VO and
  // the word layer, and moving them would desync the claim from the sentence.
  const sweep = decel(prog(frame, 2600, 900));   // grep takes the whole corpus
  const slice = decel(prog(frame, 4200, 700));   // search narrows to what matters
  const tw = (VIZ_W - (FIELD_COLS - 1) * FIELD_GAP) / FIELD_COLS;
  const n = FIELD_COLS * FIELD_ROWS;
  const litTo = Math.round(n * sweep);
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const col = i % FIELD_COLS, row = Math.floor(i / FIELD_COLS);
        const hit = HITS.includes(i);
        // Every tick sits on the hairline. Grep raises the whole field to cream;
        // search lowers it again and leaves three in red. One element, two states,
        // no third thing appearing — the field never gains a mark, it loses them.
        const grepOn = i < litTo ? 1 : 0;
        return (
          <div key={i} style={{position: 'absolute',
            left: VIZ_L + col * (tw + FIELD_GAP),
            top: VIZ_TOP + 70 + row * (FIELD_TH + FIELD_RGAP),
            width: tw, height: FIELD_TH, background: HAIR_I}}>
            <div style={{position: 'absolute', inset: 0, background: CREAM,
              opacity: grepOn * (1 - slice)}} />
            {hit ? <div style={{position: 'absolute', inset: 0, background: RED,
              opacity: slice}} /> : null}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: VIZ_L,
        top: VIZ_TOP + 70 + FIELD_ROWS * (FIELD_TH + FIELD_RGAP) + 34, width: VIZ_W,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: LABEL_I}}>
        {/* Both labels take the readable ink-field colour and the ACTIVE one goes
            to full cream. Red was doing the emphasis here and measured 4.49:1 on
            ink — under the 4.5 floor by a hundredth, at 20px. Red also belongs on
            the data, not on the commentary: the canon keeps marks on type and off
            the graphics, and here the three lit ticks are the mark. */}
        <span style={{opacity: 1 - slice}}>GREP READS EVERYTHING</span>
        <span style={{color: CREAM, opacity: slice}}>SEARCH READS THE PART THAT MATTERS</span>
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
// Two identical METHODS side by side, so the control reads as a control. The only
// difference between the columns is the one line that changed, and the score
// underneath is the same on both sides. That line is what makes the comparison
// mean anything, so it is drawn last and on its own.
//
// THE COLUMNS SAY METHOD, NOT RUN (founder, 2026-08-15).
//
// The repo ran each method THREE times independently, six runs in total, and the
// VO says "run twice. Once with grep, once with search." That line is true about
// the two ARMS and silent about the repetition, and the founder chose to carry the
// repetition on the plate rather than spend a new VO take on it — a regenerated
// eleven_v3 take is a different take and would not sit beside take 10.
//
// The plate already carried "3 RUNS" under each column and it did not land,
// because the column was headed RUN A. A column called RUN A that reports 3 RUNS
// contradicts itself, and the viewer resolves that by ignoring one of them. The
// repo's own word is method — "We ran each method 3 times independently" — so the
// header is METHOD A and the count beneath it now reads as what it is.
//
// AND IT WAS INVISIBLE (found by check-contrast, 2026-08-15). This plate is
// mounted 20080-24540ms, which is an INK beat, and every colour on it came from
// the CREAM-field palette: LABEL_C is ink at 62%, the tool name was INK, the
// border HAIR_C, the wash WASH_C. Ink on ink measures 1.00:1. Rendering the viz
// layer at 22.0s returned 141414 across 100% of the frame — the plate carrying
// METHOD A, METHOD B, 30 FIXES · 3 RUNS and SAME ANSWER QUALITY has never drawn a
// visible pixel, and a still of it was sent to the founder as evidence the label
// fix had landed. Nobody could have seen it, because there was nothing to see.
//
// No gate could catch it before today: the fit gate measures WHERE boxes are and
// found the plate's geometry exactly where it belonged. Only a check that asks
// what colour a mark is against what is behind it can see a thing that is present,
// correct and invisible.
const AbPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const cols = [
    {k: 'METHOD A', tool: 'grep', at: 20600},
    {k: 'METHOD B', tool: 'semantic search', at: 21400, live: true},
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
            border: `2px solid ${c.live ? CREAM : HAIR_I}`,
            background: c.live ? WASH_I : 'transparent',
            opacity: p, transform: `translateY(${(1 - p) * 16}px)`,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'center', rowGap: 16, padding: '0 16px'}}>
            <div style={{fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: LABEL_I}}>{c.k}</div>
            <div style={{fontFamily: FONT, fontSize: 44, color: CREAM, textAlign: 'center'}}>{c.tool}</div>
            <div style={{fontFamily: FONT_UI, fontSize: 19, letterSpacing: 2, color: LABEL_I}}>
              30 FIXES · 3 RUNS
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 386, width: VIZ_W,
        opacity: decel(prog(frame, 22600, 500)), textAlign: 'center',
        fontFamily: FONT_UI, fontSize: 22, letterSpacing: 3, color: LABEL_I}}>
        SAME ANSWER QUALITY
      </div>
    </>
  );
};

// ---- S4 -- the drop --------------------------------------------------------
// Both figures counted down. The odometer SNAPS by design: anything smooth reads
// as a slider and loses the mechanical feel the effect exists for.
//
// PAINTED FOR RED, not for ink (check-contrast, 2026-08-15). This plate is mounted
// 24540-30200ms, inside the RED beat, and its labels were LABEL_I — cream at 55%,
// which is the INK-field constant and measures 2.10:1 on red. Same class of error
// as AbPlate above: a plate authored against one field and mounted on another.
// The labels take the red-field colour and the odometers go to full white, which
// is 4.65:1 against this field where cream is 4.04:1.
const DropPlate: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 50, width: VIZ_W,
      fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: LABEL_R}}>
      TOKENS PER FIX
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 94, width: VIZ_W,
      fontFamily: FONT, fontSize: 107, color: WHITE, lineHeight: 1}}>
      <Odometer values={rampValues(73373, 44449, 20, (n) => n.toLocaleString('en-US'))}
        fromMs={25200} tickMs={80} />
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 234, width: VIZ_W,
      height: 2, background: RULE_R}} />
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 276, width: VIZ_W,
      fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: LABEL_R}}>
      TOOL CALLS
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 320, width: VIZ_W,
      fontFamily: FONT, fontSize: 86, color: WHITE, lineHeight: 1}}>
      <Odometer values={rampValues(8, 5, 6, (n) => String(n))} fromMs={27600} tickMs={110} />
    </div>
  </>
);

// ---- S5 -- what it costs ---------------------------------------------------
// THE RECEIPT (founder, 2026-08-15). Replaces two label-left / reason-right rows.
//
// This beat is the film's honesty beat: it names the price of the thing it just
// recommended. The old plate listed the two credentials as plain rows and the
// founder called it out at second 33 — legible and inert. Nothing about a list
// says "this costs you something".
//
// A receipt does. Same information, arranged as the argument: what you run, what
// it charges you, and the line at the bottom that the VO already speaks —
// "you're spending someone else's tokens to save your own". The layout carries
// the point instead of sitting under it.
//
// PREMIUM PASS, founder 2026-08-15: "make the table more visually appealing and
// premium looking". In this idiom premium is restraint, not addition. Four moves,
// every one of them a removal or a widening:
//
//   1. The dot leaders are gone. A row of full stops is a spreadsheet tell — it
//      is the cheapest mark in typography and it was the loudest thing on the
//      plate. The item and its reason now sit at the two ends of the measure and
//      the space between them does the joining, which is what a bill actually
//      looks like when it is set properly.
//   2. A hairline UNDER each row instead. One stroke per item, at low opacity,
//      so the eye gets the ledger rhythm without a dotted texture.
//   3. Room. Rows move from 78px apart to 104, and the box gains padding. Dense
//      is what cheap looks like at phone size.
//   4. Hierarchy. Item names take the DISPLAY face and grow; the reasons drop and
//      take wide tracking so they read as annotation, not as a second column of
//      equal weight. The total keeps the display face at the largest size on the
//      plate, because it is the line the whole beat exists to deliver.
//
// The install line loses its full border for a rule above and below. A boxed
// command reads as a UI control; two rules read as a document.
const CostPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const p = decel(prog(frame, 30200, 400));
  // Both items are in facts.md#G11, sourced to the evaluation's own setup step:
  // `export OPENAI_API_KEY` and `export MILVUS_ADDRESS`. Milvus is Zilliz's store,
  // which is why the second line names the account and not the variable.
  const keys = [
    {k: 'OPENAI API KEY', why: 'embeddings', at: 32400},
    {k: 'ZILLIZ ACCOUNT', why: 'vector store', at: 33600},
  ];
  // The total lands after both items, on the clause that states it.
  const tot = decel(prog(frame, 34600, 560));
  return (
    <>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP - 40, width: VIZ_W,
        opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}>
        <div style={{height: 2, background: WHITE, opacity: 0.5}} />
        <div style={{padding: '30px 4px', fontFamily: FONT_UI, fontSize: 27,
          letterSpacing: 0.5, color: WHITE}}>
          <span style={{opacity: 0.55}}>$ </span>claude mcp add claude-context
        </div>
        <div style={{height: 2, background: WHITE, opacity: 0.5}} />
      </div>

      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 124, width: VIZ_W,
        opacity: p, fontFamily: FONT_UI, fontSize: 19, letterSpacing: 4, color: LABEL_R}}>
        WHAT IT COSTS
      </div>

      {keys.map((r, i) => {
        const rp = decel(prog(frame, r.at, 320));
        if (rp <= 0) return null;
        return (
          <div key={r.k} style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 176 + i * 104,
            width: VIZ_W, opacity: rp}}>
            <div style={{display: 'flex', alignItems: 'baseline',
              justifyContent: 'space-between', paddingBottom: 18}}>
              <span style={{fontFamily: FONT, fontSize: 44, color: WHITE, lineHeight: 1}}>{r.k}</span>
              <span style={{fontFamily: FONT_UI, fontSize: 19, letterSpacing: 4,
                color: WHITE, opacity: 0.72}}>{r.why}</span>
            </div>
            <div style={{height: 1, background: WHITE, opacity: 0.32}} />
          </div>
        );
      })}

      {/* The total is the line the beat exists to deliver, so it gets the only
          heavy rule on the plate and the largest type. It reads DOWN — label,
          then the amount on its own line — rather than across, because a
          right-aligned phrase competes with the two reasons above it. */}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 380, width: VIZ_W,
        height: 3, background: WHITE, opacity: tot}} />
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 408, width: VIZ_W,
        opacity: tot, fontFamily: FONT_UI, fontSize: 19, letterSpacing: 4, color: LABEL_R}}>
        TOTAL
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 442, width: VIZ_W,
        opacity: tot, fontFamily: FONT, fontSize: 44, lineHeight: 1.06, whiteSpace: 'nowrap', color: WHITE}}>
        someone else&rsquo;s tokens
      </div>
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
      <div style={{fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3, color: LABEL_C}}>GITHUB.COM</div>
      <div style={{fontFamily: FONT, fontSize: 55, color: INK}}>zilliztech / claude-context</div>
      {/* A star count is the one figure in this film with a shelf life. Read at
          primary source (`gh api repos/zilliztech/claude-context`) on 2026-08-15;
          it was 12,395 on 2026-08-14, so it moves several a day. Re-read it on
          the day the film renders and update both here and facts.md#G10. */}
      <div style={{fontFamily: FONT_UI, fontSize: 22, letterSpacing: 2, color: LABEL_C}}>
        12,402 stars · MIT
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
  {ms: 24540, field: RED_DEEP},
  {ms: 36060, field: CREAM},
  {ms: 41760, field: RED_DEEP},
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
// WIPE_LEAD IS THE PANEL'S ARRIVAL, NOT MW.sweep (founder scrub, 2026-08-15).
//
// The first version took 16 from MW.sweep on the reasoning that the train "starts"
// then. It does start then — off screen. Measured on the rendered frame, the first
// panel pixel does not enter the frame until atMs - 10, on BOTH seams tested:
//
//   seam  9920 -> cream: clear at f282, first panel pixel f288, covered f290
//   seam 24540 -> red:   clear at f720, first panel pixel f726, covered f728
//
// So six frames — a fifth of a second — were cleared for an arrival that had not
// happened. The founder scrubbed it and saw the frame empty to nothing but the
// wordmark and the two footer slugs, twice per seam window: "transition at second
// 09.22 still shows some words like 'vektor' in the top and bottom and it looks
// messy". Suppressing at the measured arrival closes the hole, and the panel's
// leading edge is on screen at the instant the type goes, so nothing is stranded.
const WIPE_LEAD = 10;   // MEASURED first-panel-pixel, scripts/check-seam-colours.mjs
const WIPE_TAIL = 6;    // the main panel settles at x0 a few frames after
const inWipe = (frame: number) =>
  FLIPS.some((w) => frame >= f(w.ms) - WIPE_LEAD && frame < f(w.ms) + WIPE_TAIL);

// THE WIPE RUNS ONE WAY (founder, 2026-08-14).
//
// Suppressing the type and the plates got the seam down to the two colours a wipe
// must show — the field it is leaving and the colour it is bringing. But the
// measurement showed the sequence going the WRONG WAY round: at seam 9920ms the
// frame read cream 100% at +8, then ink 11.7% at +10, then cream 100% again. The
// old field FLASHES BACK after the new one has already covered the frame.
//
// The cause is the panel train's geometry. The two accents sweep through and
// exit, the main panel follows and stops at x0, and in the gap between them the
// background — still the OUTGOING field until atMs — shows through again.
//
// The fix is not to edit MatteWipe. That component is the single shared
// implementation and NO. 027, 030 and 031 all render it; changing its geometry
// would change three locked films. Instead the FIELD flips early, at the moment
// the first panel has covered the frame, so anything visible through a later gap
// is the incoming colour rather than the outgoing one. The wipe then travels one
// way: old, panels arriving, new. It never goes back.
//
// COVER is measured, not guessed: scripts/check-seam-colours.mjs reported 100%
// coverage at +8 on every seam of this film.
const WIPE_COVER = 8;
const wipeField = (frame: number): string | null => {
  const w = FLIPS.find((x) => frame >= f(x.ms) - WIPE_COVER && frame < f(x.ms));
  return w ? w.field : null;
};

// ---- composition -----------------------------------------------------------
export const KTTokens: React.FC<{layer?: 'all' | 'type' | 'viz' | 'furniture'}> = ({layer = 'all'}) => {
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
  // During the back half of a wipe the field is already the incoming one, so a
  // gap between panels reveals the new colour instead of flashing the old back.
  // The beat data and the seams both say RED; this film renders the 5% deeper
  // one so white text clears the floor. Mapped here, once, rather than edited
  // into KTTokensWords.ts — the words file is generated and would lose it.
  const bg = asField(wipeField(frame) ?? beat.bg);
  const lightField = bg === CREAM;
  // Footer contrast is field-aware (design review 2026-08-08). It was
  // cream-at-34% on every dark field, which measures 1.47:1 against RED —
  // effectively invisible, and on the beat that carries the CTA.
  // THE FOOTER TAKES THE LABEL COLOURS (founder ruling, 2026-08-15).
  //
  // This was ink-at-55% on cream, which measures 4.05:1 — and that shortfall has
  // been an OPEN QUESTION in kt-canon.yml since 2026-08-08, phrased as "raise the
  // opacity, or grant the footer an exemption at 3.0". Nobody ruled, so it sat
  // there for two films while the same class of colour spread onto the plates.
  // "Text clears 4.5, no exceptions" answers it: raise the opacity. Ink at 62% is
  // 5.07:1 on cream, cream at 55% is 5.57:1 on ink, white is 4.65:1 on the deeper
  // red. Named constants, not literals, so the contrast gate can see them.
  const furn = FOOTER_ON[bg] ?? LABEL_I;
  return (
    <AbsoluteFill style={{backgroundColor: bg, fontFamily: FONT}}>
      {layer !== 'type' && layer !== 'furniture' && !wiping && shot ? <ShotPlate shot={shot} /> : null}

      {layer !== 'type' && layer !== 'furniture' && !wiping && !shot ? (<>
      <Window fromMs={1600}  toMs={9920}> <ContextField /></Window>
      <Window fromMs={20080} toMs={24540}><AbPlate /></Window>
      <Window fromMs={24540} toMs={30200}><DropPlate /></Window>
      <Window fromMs={30200} toMs={36060}><CostPlate /></Window>
      <Window fromMs={36060} toMs={41760}><FindPlate /></Window>
      <Window fromMs={41760} toMs={TOKENS_END_MS}><TokensOutro /></Window>
      </>) : null}

      {layer !== 'viz' && layer !== 'furniture' && !wiping && !shot ? (
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

      {/* FURNITURE IS PART OF THE CLEAN SHEET (founder scrub, 2026-08-15).
          The 2026-08-14 fix suppressed "the type layer and the plates" for the
          frames the panel train is on screen. Furniture was never in that
          sentence, so the wipe emptied the frame of everything EXCEPT the two
          things that read as words — and MatteWipe paints at zIndex 5, so the
          panels covered them except through a gap, which measured as a one-frame
          reappearance at f292 (seam 9920) and f730 (seam 24540).
          `!wiping` applies to the `furniture` LAYER too, not just the composite:
          the layer has to show what actually ships or the gate reading it is
          measuring a frame the viewer never sees. check-type-fit already reports
          a layer that rendered nothing as blind rather than clean. */}
      {(layer === 'all' || layer === 'furniture') && !shot && !wiping ? (<>
      {/* FURNITURE — inside the safe box. The 44px rail is HORIZONTAL-ONLY since
          2026-08-07: Reels chrome cuts the top and bottom, so the wordmark sits
          at y240 and the footer slugs at y1372, not at the rail. NO. 033 put the
          footer at y1560 as a founder override scoped to that film only; this
          one is back inside the box. */}
      <div style={{position: 'absolute', top: 240, left: VIZ_L, fontSize: 40, fontWeight: 600,
        letterSpacing: '-0.045em', color: WORDMARK_ON[bg] ?? CREAM,
        fontFamily: FONT_UI}}>vektor</div>
      <div style={{position: 'absolute', top: 1372, left: VIZ_L, fontSize: 22, letterSpacing: 3,
        color: furn}}>vektor /// claude context</div>
      <div style={{position: 'absolute', top: 1372, left: VIZ_L, width: VIZ_W, textAlign: 'right',
        fontSize: 22, letterSpacing: 3, color: furn}}>comment. context.</div>
      </>) : null}
    </AbsoluteFill>
  );
};
