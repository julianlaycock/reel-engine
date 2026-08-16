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

// ---- how a line arrives (founder review, 2026-08-16) ------------------------
// THE HARSHNESS WAS NEVER THE FADE. The founder said the words "transition too
// harshly and not smooth or clean enough", so the first attempt offered a 3-frame
// fade and a 5-frame rise. Both were rejected, correctly - they were treating a
// symptom that was not there.
//
// Measuring the type layer frame by frame while a line types on:
//
//   f105  3.50s   left x468  right x598     one word
//   f108  3.60s   left x406  right x658     +2 words
//   f114  3.80s   left x346  right x720
//   f117  3.90s   left x272  right x794
//
// The words already on screen MOVE. Every row is centre-aligned, so each new word
// pushes everything before it outward by half its own width - about 200px of
// sideways slide in under half a second. The reader is tracking text that will not
// hold still. No easing curve fixes that, because nothing is easing: the line is
// being re-laid-out on every word.
//
// THE FIX IS TO RESERVE THE SPACE. Each word gets a hidden spacer of its exact
// final width from the first frame of its row, and the visible word is drawn on
// top of it. The line's geometry is settled before the first word lands, so words
// arrive in place and nothing that is already readable ever moves again.
//
// The shared <Word> is untouched - it is imported by five published films. The
// spacer mirrors the two properties that decide width (fontSize and whiteSpace)
// and carries the same text, so it reserves exactly what <Word> will draw.
//
// The spacer follows the word out of the row when the word leaves, so a row that
// edits in place still collapses as it should.
//
// RULED 2026-08-16. The founder compared both and chose this. The trade is real
// and worth writing down: a line can grow outward from its centre, or it can hold
// still, and it cannot do both. Reserving the width makes the row full-measure, so
// the text now reads from the left rather than expanding symmetrically. That is a
// change to how this format looks, chosen deliberately over 200px of slide.
const lineWidthSpacer = (w: {t: string; caps?: boolean; size?: number}, base: number) => (
  <span aria-hidden style={{visibility: 'hidden', fontSize: w.size ?? base, whiteSpace: 'pre'}}>
    {w.caps ? w.t.toUpperCase() : w.t}
  </span>
);

// ---- the plate system -------------------------------------------------------
// THE CANON GOVERNED THE WORD LAYER AND NOT THE PLATES (founder review, 2026-08-16).
//
// Every consistency law this brand has was written for TYPE and enforced there.
// The plates occupy the bottom two-thirds of most frames and were under none of
// them. Measured across this file before this change:
//
//   type sizes          19, 20, 22, 27, 40      five ad-hoc sizes, no scale
//   entrance durations  400, 500, 560, 700, 900 five values, three outside the
//                                               motion spec's own 500-730 range
//   entrance distances  14 and 16               two values two pixels apart
//   letter-spacing      0, 2, 3, 4              four values
//   rule weights        1, 2, 3                 three
//   plate origin        VIZ_TOP -40 .. +90      every plate starts somewhere else
//
// This is the defect the canon already fixed once: NO. 033 had grown 21 type sizes
// with adjacent steps of 1.02-1.05, and the ruling was that differences no viewer
// can perceive do no work while every value still has to be maintained. That
// ruling was applied to the word layer and stopped at the plate boundary.
//
// A viewer never notices that one plate arrives in 400ms and the next in 900ms.
// They notice the film feels loose - assembled rather than designed. These are the
// values that stop that, and nothing here touches a timing the VO is pinned to:
// every one is an entrance ramp or a size.
const UI = {s: 20, m: 26, l: 40};   // the UI sub-scale, under the display scale
const ENTER = 500;                  // a plate arriving
const DETAIL = 300;                 // something landing inside one
const TRAVEL = 16;                  // one distance, always
const TRACK = {label: 2, slug: 3};  // tracking: labels, and all-caps slugs
const PLATE_TOP = 60;               // one origin for every plate

// ---- a plate paints itself for the field it lands on ------------------------
// TWICE IN ONE DAY a plate was invisible because it was authored against one field
// and mounted on another. AbPlate was built in the cream palette and sat on an ink
// beat - ink on ink, 1.00:1, 100% of the viz layer one flat colour. DropPlate was
// built for ink and sat on red. Both were fixed by hand. Then re-anchoring the
// plates to the voiceover moved AbPlate onto the cream beat and ContextField
// across a field boundary, and BOTH went invisible again - the same bug, twice,
// within an hour, because the fix had been "repaint this plate" rather than "stop
// plates from hardcoding a field".
//
// A plate now asks the field what to use. Moving a plate to a different beat can
// no longer make it disappear, which matters because moving plates to the words
// they belong to is exactly what the film needed.
type FieldPalette = {text: string; label: string; hair: string; wash: string; accent: string};
const onField = (bg: string): FieldPalette =>
  bg === CREAM ? {text: INK, label: LABEL_C, hair: HAIR_C, wash: WASH_C, accent: RED_DEEP}
  : bg === RED_DEEP ? {text: WHITE, label: WHITE, hair: RULE_R, wash: WASH_I, accent: WHITE}
  : {text: CREAM, label: LABEL_I, hair: HAIR_I, wash: WASH_I, accent: RED_DEEP};

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
// FEWER AND LARGER (founder, 2026-08-15: "make it look more premium").
//
// The first build was 20x6 — 120 ticks at 31x18 with 8px gutters. At phone size
// that is texture, not a diagram: the eye reads a grey rasterised block and the
// three survivors do not survive anything, because nothing was ever legible as a
// unit. Premium in this format is restraint, so the count comes down and the unit
// goes up: 12x4 at 52x30 with real air between them. Same idea, half the noise,
// and the three that remain now sit in obvious isolation.
//
// The hit indices are spread across different rows and columns on purpose. Three
// adjacent ticks would read as one surviving block rather than as a search
// returning scattered results from across a codebase.
const HITS = [7, 21, 40];
const FIELD_COLS = 12, FIELD_ROWS = 4, FIELD_GAP = 14, FIELD_RGAP = 18, FIELD_TH = 30;

const ContextField: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  // Timings unchanged from the bars they replace: both are pinned to the VO and
  // the word layer, and moving them would desync the claim from the sentence.
  const sweep = decel(prog(frame, 1280, ENTER));   // grep takes the whole corpus
  const slice = decel(prog(frame, 13000, ENTER));   // search narrows to what matters
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
            top: VIZ_TOP + PLATE_TOP + row * (FIELD_TH + FIELD_RGAP),
            width: tw, height: FIELD_TH, background: pal.hair}}>
            <div style={{position: 'absolute', inset: 0, background: pal.text,
              opacity: grepOn * (1 - slice)}} />
            {hit ? <div style={{position: 'absolute', inset: 0, background: pal.accent,
              opacity: slice}} /> : null}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: VIZ_L,
        top: VIZ_TOP + PLATE_TOP + FIELD_ROWS * (FIELD_TH + FIELD_RGAP) + 34, width: VIZ_W,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug, color: pal.label}}>
        {/* Both labels take the readable ink-field colour and the ACTIVE one goes
            to full cream. Red was doing the emphasis here and measured 4.49:1 on
            ink — under the 4.5 floor by a hundredth, at 20px. Red also belongs on
            the data, not on the commentary: the canon keeps marks on type and off
            the graphics, and here the three lit ticks are the mark. */}
        <span style={{opacity: 1 - slice}}>GREP READS EVERYTHING</span>
        <span style={{color: pal.text, opacity: slice}}>SEARCH READS THE PART THAT MATTERS</span>
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
  {from: 18680, to: 23770, src: 'screens/no034-evaluation.png'},
];

const ShotPlate: React.FC<{shot: {from: number; to: number; src: string}}> = ({shot}) => {
  const frame = useCurrentFrame();
  const IMG_H = 3160;
  // Slow, linear scroll. A drift that eases would read as a camera move; this is
  // a page being read.
  const t = clamp01((frame - f(shot.from)) / Math.max(1, f(shot.to - shot.from)));
  // SLOWER, founder 2026-08-16: "way too quick, and it looks cheap like that".
  // The shot ran the full 3160px page past the frame in 5.8s - about 214px/sec,
  // which is faster than anyone can read a line of code. It now travels 55% of the
  // page in the same time, roughly 118px/sec, so the eye can actually follow it.
  // Showing less of the page is the right trade: the point is that the evaluation
  // EXISTS and is legible, not that every line of it is seen.
  const y = -(IMG_H - 1920) * t * 0.55;
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
// STILL BARELY READABLE AFTER IT BECAME VISIBLE (founder, 2026-08-15).
//
// Making the plate visible was not the same as making it legible. METHOD A / B
// were cream at 55% - 5.04:1 on the column fill, which CLEARS the 4.5 floor and
// still read badly, because three things were working against legibility at once:
// 55% opacity, 20px, and 3px of letter-spacing. Thin, small and spread out. A
// contrast ratio measures a colour pair; it says nothing about stroke weight or
// tracking, and the founder's eye caught what the number could not.
//
// So the labels go to FULL cream at 13.13:1, up a size to 22, semibold, and the
// tracking comes down from 3 to 2 so the letters group into words instead of
// floating apart.
//
// The control column also had a 26% border - 2.14:1 - so it barely read as a
// column and the comparison did not land as a comparison. Both columns are now
// visible shapes; the difference between them is carried by the FILL and the
// full-strength border on the live one, not by the other being almost invisible.
const AbPlate: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const cols = [
    {k: 'METHOD A', tool: 'grep', at: 23770},
    {k: 'METHOD B', tool: 'semantic search', at: 26810, live: true},
  ];
  const cw = (VIZ_W - 24) / 2;
  return (
    <>
      {cols.map((c, i) => {
        const p = decel(prog(frame, c.at, ENTER));
        if (p <= 0) return null;
        return (
          <div key={c.k} style={{position: 'absolute', left: VIZ_L + i * (cw + 24),
            top: VIZ_TOP + PLATE_TOP, width: cw, height: 280,
            border: `2px solid ${c.live ? CREAM : LABEL_I}`,
            background: c.live ? WASH_I : 'transparent',
            opacity: p, transform: `translateY(${(1 - p) * TRAVEL}px)`,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'center', rowGap: 16, padding: '0 16px'}}>
            <div style={{fontFamily: FONT_UI, fontSize: UI.m, letterSpacing: TRACK.label, fontWeight: 600,
              color: pal.text}}>{c.k}</div>
            <div style={{fontFamily: FONT, fontSize: 44, color: pal.text, textAlign: 'center'}}>{c.tool}</div>
            <div style={{fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.label, color: pal.label}}>
              30 FIXES · 3 RUNS
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP + 326, width: VIZ_W,
        opacity: decel(prog(frame, 29500, ENTER)), textAlign: 'center',
        fontFamily: FONT_UI, fontSize: UI.m, letterSpacing: TRACK.slug, color: pal.label}}>
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
const DropPlate: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  return (
  <>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP, width: VIZ_W,
      fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug, color: pal.label}}>
      TOKENS PER FIX
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP + 44, width: VIZ_W,
      fontFamily: FONT, fontSize: 107, color: WHITE, lineHeight: 1}}>
      <Odometer values={rampValues(73373, 44449, 20, (n) => n.toLocaleString('en-US'))}
        fromMs={31840} tickMs={80} />
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP + 184, width: VIZ_W,
      height: 2, background: pal.hair}} />
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP + 226, width: VIZ_W,
      fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug, color: pal.label}}>
      TOOL CALLS
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP + 270, width: VIZ_W,
      fontFamily: FONT, fontSize: 86, color: WHITE, lineHeight: 1}}>
      <Odometer values={rampValues(8, 5, 6, (n) => String(n))} fromMs={35950} tickMs={110} />
    </div>
  </>
  );
};

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
const CostPlate: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const p = decel(prog(frame, 41640, ENTER));
  // Both items are in facts.md#G11, sourced to the evaluation's own setup step:
  // `export OPENAI_API_KEY` and `export MILVUS_ADDRESS`. Milvus is Zilliz's store,
  // which is why the second line names the account and not the variable.
  const keys = [
    {k: 'OPENAI API KEY', why: 'embeddings', at: 45200},
    {k: 'ZILLIZ ACCOUNT', why: 'vector store', at: 47900},
  ];
  // The total lands after both items, on the clause that states it.
  const tot = decel(prog(frame, 50600, ENTER));
  return (
    <>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP, width: VIZ_W,
        opacity: p, transform: `translateY(${(1 - p) * TRAVEL}px)`}}>
        <div style={{height: 2, background: pal.hair, opacity: 0.5}} />
        <div style={{padding: '30px 4px', fontFamily: FONT_UI, fontSize: UI.m,
          letterSpacing: 0.5, color: pal.text}}>
          <span style={{opacity: 0.55}}>$ </span>claude mcp add claude-context
        </div>
        <div style={{height: 2, background: pal.hair, opacity: 0.5}} />
      </div>

      {keys.map((r, i) => {
        const rp = decel(prog(frame, r.at, DETAIL));
        if (rp <= 0) return null;
        return (
          <div key={r.k} style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP + 140 + i * 104,
            width: VIZ_W, opacity: rp}}>
            <div style={{display: 'flex', alignItems: 'baseline',
              justifyContent: 'space-between', paddingBottom: 18}}>
              <span style={{fontFamily: FONT, fontSize: 44, color: WHITE, lineHeight: 1}}>{r.k}</span>
              <span style={{fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug,
                color: WHITE, opacity: 0.72}}>{r.why}</span>
            </div>
            <div style={{height: 1, background: pal.hair, opacity: 0.32}} />
          </div>
        );
      })}

      {/* The total is the line the beat exists to deliver, so it gets the only
          heavy rule on the plate and the largest type. It reads DOWN — label,
          then the amount on its own line — rather than across, because a
          right-aligned phrase competes with the two reasons above it. */}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP + 344, width: VIZ_W,
        height: 3, background: pal.hair, opacity: tot}} />
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP + 372, width: VIZ_W,
        opacity: tot, fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug, color: pal.label}}>
        TOTAL
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP + 406, width: VIZ_W,
        opacity: tot, fontFamily: FONT, fontSize: 44, lineHeight: 1.06, whiteSpace: 'nowrap', color: pal.text}}>
        someone else&rsquo;s tokens
      </div>
    </>
  );
};

// ---- S6 -- where to get it -------------------------------------------------
const FindPlate: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const p = decel(prog(frame, 52870, ENTER));
  return (
    <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + PLATE_TOP, width: VIZ_W,
      border: `2px solid ${pal.text}`, background: pal.wash, padding: '30px 34px', opacity: p,
      transform: `translateY(${(1 - p) * TRAVEL}px)`, display: 'flex',
      flexDirection: 'column', rowGap: 12}}>
      <div style={{fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug, color: pal.label}}>GITHUB.COM</div>
      <div style={{fontFamily: FONT, fontSize: 55, color: pal.text}}>zilliztech / claude-context</div>
      {/* A star count is the one figure in this film with a shelf life. Read at
          primary source (`gh api repos/zilliztech/claude-context`) on 2026-08-15;
          it was 12,395 on 2026-08-14, so it moves several a day. Re-read it on
          the day the film renders and update both here and facts.md#G10. */}
      <div style={{fontFamily: FONT_UI, fontSize: UI.m, letterSpacing: TRACK.label, color: pal.label}}>
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
const TokensOutro: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  return (
  <ZigzagMarquee fromMs={56070} unit={'vektor  '} amp={260} period={13} rows={14}
    rowH={136} fontSize={150} dur={75} color={'rgba(244,239,223,0.13)'} />
  );
};

// ---- seams -----------------------------------------------------------------
// ONE COLOUR PER WIPE (founder, 2026-08-08: "make them cleaner, with 1 colour,
// i see like 3 colors"). All three MatteWipe panels take the INCOMING field
// colour. Done by passing the same value three times, NOT by editing MatteWipe:
// that component is the single shared implementation every KT film renders.
//
// Each entry's field MUST equal the bg of the beat it lands on — check-kt's
// seamCarriesIncomingField rule, which caught NO. 033 wiping ink onto a red beat.
const FLIPS: {ms: number; field: string}[] = [
  // A SAME-COLOUR CUT, not a field change. The film opens with 18.7 seconds on ink
  // - the claim and then the new explanation of why it works - which is well past
  // the 10s the canon now allows on one field without punctuation. This lands where
  // the sentence turns, so it reads as a paragraph break rather than a transition.
  {ms: 7040,  field: INK},
  {ms: 18680, field: CREAM},
  {ms: 31840, field: INK},
  {ms: 41640, field: RED_DEEP},
  {ms: 52870, field: CREAM},
  {ms: 56070, field: RED_DEEP},
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

// THE PLATES, AS DATA. The render maps over this and the type anchor reads it, so
// there is exactly one statement of when each visualisation is on screen. When the
// windows lived inline in the JSX the anchor had no way to consult them, which is
// why it fell back to a per-beat flag and left type stranded over 4.9s of empty
// frame.
//
// `showsAt` is when the plate first puts a pixel on screen, which is NOT always
// when it mounts. AbPlate staggers its two columns from 20600 and FindPlate fades
// in from 36600, so both are mounted and blank for half a second. The anchor asks
// about VISIBILITY, not mounting — using the mount window left the type pinned to
// the top of an empty frame for 0.54s at 36.06s even after the anchor was fixed,
// which is the WIPE_LEAD mistake exactly: a declared window is not an arrival.
// check-type-fit fails the build if a top-anchored frame has no viz on it, so
// these two numbers cannot quietly drift away from the components.
// The plate is stored as a COMPONENT, not an element, so the field it lands on can
// be handed to it at render time. Storing elements is what made a plate's palette a
// property of where it was WRITTEN rather than where it is SHOWN.
const PLATES: {from: number; to: number; Node: React.FC<{field: string}>}[] = [
  // Every window below is measured against the take, and every one clears the
  // readable-time rule (3s + 0.6s per word) that the canon now carries. The old
  // cut could not: its six graphics needed 56 seconds between them and the film
  // was 48.3 seconds long, so the A/B panel got 2.5 seconds against the 12 it
  // needed. That is the arithmetic the longer take was recorded to fix.
  //
  // THE BLOCK GRAPHIC HOLDS for the whole opening - founder, 2026-08-16. It is the
  // picture of the idea the new section explains, and giving it room instead of a
  // second graphic is what the extra seconds were bought for.
  {from: 90,    to: 18680,         Node: ContextField},   // 18.6s  needs 6.6
  {from: 23770, to: 31840,         Node: AbPlate},        //  8.1s  needs 7.8
  {from: 31840, to: 41640,         Node: DropPlate},      //  9.8s  needs 7.8
  {from: 41640, to: 52870,         Node: CostPlate},      // 11.2s  needs 9.0
  {from: 52870, to: 56070,         Node: FindPlate},      //  3.2s  needs 4.8 - SHORT
  {from: 56070, to: TOKENS_END_MS, Node: TokensOutro},    //  8.5s  needs 6.0
];

// ---- composition -----------------------------------------------------------
// HOW THE WORDS AND THE GRAPHIC SHARE THE FRAME (founder, 2026-08-16).
//
// "the viewer doesn't know whether to concentrate on the visualization or on the
// words, and they're positioned in a weird way... maybe three lines is too much."
// Both questions are taste calls the founder wants to SEE rather than be told
// about, so they are modes rather than a change:
//
//   'full'    what the film does now - up to three rows at full size, over the
//             graphic. Everything competes.
//   'two'     at most the two most recent rows. A third less text at once.
//   'caption' one row only, dropped to label size and pinned above the graphic,
//             so the graphic clearly owns the frame and the words annotate it.
export type Layout = 'full' | 'two' | 'caption';

export const KTTokens: React.FC<{layer?: 'all' | 'type' | 'viz' | 'furniture'; stableLine?: boolean; mode?: Layout}> =
  ({layer = 'all', stableLine = true, mode = 'full'}) => {
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
  // THE ANCHOR FOLLOWS WHAT IS ON SCREEN, NOT WHAT THE BEAT IS ABOUT (founder, 2026-08-15).
  //
  // typeAnchor.onVizBeats says type on a VISUALISATION beat sits at the top so it
  // never rests on the plate. Correct — but it was applied per BEAT, and a beat is
  // not uniformly a viz beat. Measured with check-type-fit --dense 15, three
  // stretches had type pinned to the top with nothing at all beneath it:
  //
  //    9.92-11.80s  1.88s  the capture has not started
  //   17.60-20.08s  2.48s  the capture has ended, AbPlate not yet mounted
  //   36.06-36.60s  0.54s  FindPlate not yet mounted
  //
  // Roughly 4.9 seconds with type ending around y500-650 and the safe box running
  // to y1420 — about 800px of empty frame under it. The founder: "it looks unclean
  // if we place it at the top and there is a lot of unused space in the bottom".
  //
  // So the anchor asks whether a plate is actually mounted THIS FRAME. A beat that
  // declares top:false stays centred regardless — that is the house outro, whose
  // marquee is a full-bleed background rather than something the type sits above,
  // and it is standardised across every film.
  //
  // The move is a hard cut on an exact frame, which is the format's grammar:
  // everything cuts, nothing glides.
  // ONE ANCHOR PER BEAT (founder, 2026-08-16).
  //
  // The first version of this asked, every frame, whether a plate was on screen.
  // It removed the dead space and introduced something worse: the type block
  // JUMPED from centre to top the moment a plate arrived, mid-beat, five times in
  // the film. The founder: "a lot of the times the words are shown in the middle
  // and then they automatically jump to the top in a harsh manner". Trading a
  // static problem for a moving one is not a fix - motion draws the eye, so a jump
  // costs more than the empty space it saved.
  //
  // The anchor is now constant for the whole beat: if this beat carries a plate at
  // any point, its type sits at the top for the entire beat. Nothing moves.
  //
  // The dead space that started all this is solved at the other end instead - the
  // plates now open WITH their beat rather than half a second into it, which is
  // also what the locked ruling "visualisations enter EARLY and hold LONG" asks
  // for. No gap to fill, so nothing has to move to fill it.
  const beatHasPlate = PLATES.some((pl) => pl.from < beat.to && pl.to > beat.from);
  const topNow = beat.top && beatHasPlate;
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
      {PLATES.map((pl) => (
        <Window key={pl.from} fromMs={pl.from} toMs={pl.to}><pl.Node field={bg} /></Window>
      ))}
      </>) : null}

      {layer !== 'viz' && layer !== 'furniture' && !wiping && !shot ? (
      <AbsoluteFill style={{alignItems: 'center',
        ...(mode === 'caption' && topNow ? {fontSize: UI.m, opacity: 0.92} : {}),
        justifyContent: topNow ? 'flex-start' : 'center',
        flexDirection: 'column', rowGap: 26,
        // 330 not 260: the wordmark sits at y240 to clear Instagram's Reels
        // header, so the type block starts below its baseline.
        padding: topNow ? '330px 150px 0' : '0 150px',
        textAlign: 'center'}}>
        {(() => {
          // Only rows with a word already on screen count as "showing", so the cap
          // trims what is actually visible rather than what is declared.
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
      <div style={{position: 'absolute', top: 240, left: VIZ_L, fontSize: UI.l, fontWeight: 600,
        letterSpacing: '-0.045em', color: WORDMARK_ON[bg] ?? CREAM,
        fontFamily: FONT_UI}}>vektor</div>
      {/* THE FOOTER IS GONE (founder, 2026-08-16): "we have to get rid of the
          footer, it serves no purpose and conflicts with some content".
          It said `vektor /// claude context` and `comment. context.` at y1372,
          which is inside the band the plates need - the receipt collided with it
          this morning and had to be pulled up 40px to clear it. It repeated the
          wordmark and pre-announced the CTA the outro delivers properly. Removing
          it returns the whole 1352-1420 band to the plates. The wordmark stays. */}
      </>) : null}
    </AbsoluteFill>
  );
};
