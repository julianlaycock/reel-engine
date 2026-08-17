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
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f, Word} from './KTHook';
import {TOKENS_BEATS, TOKENS_END_MS} from './KTTokensWords';
import {CAPTURE_SCROLL_PX_PER_SEC, gap, FAMILY, WORDMARK, ROLES, MARGIN_X, COLUMN_W,
  ENTER_MS, DETAIL_MS, TRAVEL_PX, WIPE, PLATE_TOP as PLATE_TOP_CANON} from './kt/system';
import {MatteWipe, ZigzagMarquee} from './KTSeams';
import {Odometer, rampValues} from './KTEffects';
// THE SHARED ARGUMENT LIBRARY. Two of this film's plates were extracted into it
// on 2026-08-18 and are imported back here — ONE implementation, no look-alikes.
// The alias exists only because the film's own wrapper keeps the name the PLATES
// array and every gate already key off.
import {CodePage as SharedCodePage, SourceCard} from './kt/argument';
import {ClaudeMascot} from './scenes/ClaudeMascot';
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

// The safe box, TAKEN FROM THE CANON rather than restated. These were three
// hand-typed numbers that happened to equal the canon's, which meant the canon
// could not move them: changing MARGIN_X would have changed nothing this film
// draws. VIZ_TOP is gone entirely - every one of its sixteen uses was
// `PLATE_TOP`, i.e. the plate origin, which the canon already names.
const VIZ_L = MARGIN_X, VIZ_W = COLUMN_W;
const PLATE_TOP = PLATE_TOP_CANON;

// THE BAND THE WORDS LIVE IN (founder, 2026-08-16). It opens at the wordmark's
// baseline and closes at the top of the graphic, and the type block sits centred
// in it. Both edges are canon values — the wordmark's position and role size, and
// the one plate origin — so there is no frame position stated anywhere in this
// film. See the comment on the type layer for why this replaced a fixed gap.
const TYPE_BAND_TOP = WORDMARK.y + ROLES.wordmark.size;
const TYPE_BAND_H = PLATE_TOP_CANON - TYPE_BAND_TOP;

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
// ARRIVAL COMES FROM THE CANON. Identical values, but restating them meant the
// canon's motion spec governed nothing - a film that retypes a value is a film the
// canon cannot reach.
const ENTER = ENTER_MS;             // a plate arriving
const DETAIL = DETAIL_MS;           // something landing inside one
const TRAVEL = TRAVEL_PX;           // one distance, always
const TRACK = {label: 2, slug: 3};  // tracking: labels, and all-caps slugs

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
// THE FIELD IS THE OPENING PLATE ONLY, 0.09-7.04s (founder, 2026-08-16).
//
// It used to run the whole way to 18.68s and carry a second state at 13.0s: the
// field lowering again and leaving three red survivors for "semantic search reads
// only the part that actually matters". The founder watched that and called the
// second section monotonous — measured, the field finished its fill at 1.78s and
// then held ONE image for 11.2 seconds before that collapse.
//
// The explanation now has its own picture (WindowPlate, below), so the collapse,
// the three fixed hit indices and the second label are DELETED rather than left in
// place unable to fire. Code that can no longer run still gets read as if it does.
const FIELD_COLS = 12, FIELD_ROWS = 4, FIELD_GAP = 14, FIELD_RGAP = 18, FIELD_TH = 30;

const ContextField: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  // Pinned to the VO and the word layer: the field takes the whole corpus as the
  // line says "over your whole codebase". Moving it desyncs the claim from the
  // sentence, so this number does not move.
  const sweep = decel(prog(frame, 1280, ENTER));
  const tw = (VIZ_W - (FIELD_COLS - 1) * FIELD_GAP) / FIELD_COLS;
  const n = FIELD_COLS * FIELD_ROWS;
  const litTo = Math.round(n * sweep);
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const col = i % FIELD_COLS, row = Math.floor(i / FIELD_COLS);
        // Every tick sits on the hairline and grep raises it to cream. One
        // element, one state, nothing appearing on top of anything.
        return (
          <div key={i} style={{position: 'absolute',
            left: VIZ_L + col * (tw + FIELD_GAP),
            top: PLATE_TOP + row * (FIELD_TH + FIELD_RGAP),
            width: tw, height: FIELD_TH, background: pal.hair}}>
            <div style={{position: 'absolute', inset: 0, background: pal.text,
              opacity: i < litTo ? 1 : 0}} />
          </div>
        );
      })}
      {/* The label takes the readable ink-field colour. Red was doing the emphasis
          here and measured 4.49:1 on ink — under the 4.5 floor by a hundredth, at
          20px. Red also belongs on the data, not on the commentary. */}
      <div style={{position: 'absolute', left: VIZ_L,
        top: PLATE_TOP + FIELD_ROWS * (FIELD_TH + FIELD_RGAP) + 34, width: VIZ_W,
        fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug, color: pal.label}}>
        GREP READS EVERYTHING
      </div>
    </>
  );
};

// ---- S1b -- the page, and what each method read of it -----------------------
// FOUNDER, 2026-08-16, on the first answer to this (a bounded box that grep filled
// past the brim): "i do not like that visualisation at all". Three researched
// directions replaced it and the founder chose THIS one: show the real source and
// mark what was read.
//
// It is the pattern retrieval is credibly shown with — source highlighting, the
// thing RAG tools build to let a reader check an answer against the passage it
// came from. It also happens to be the only one of the three that puts EVIDENCE on
// screen, which is this film's entire argument.
//
// THE CODE IS REAL. `packages/core/src/context.ts` from zilliztech/claude-context
// at commit 6fc318b, lines 264-279, read 2026-08-16, verbatim including the
// indentation. Line 264 runs to 120 characters and is CLIPPED by the column, which
// is what a code window does and is not a crop worth hiding. Recorded in facts.md.
//
// The lit passage is lines 268-273 — a doc comment and the whole function under
// it. That is not a decorative choice: this repo splits with an AST splitter, so a
// chunk IS a syntactic unit, and a whole function with its comment is exactly the
// shape of thing its search hands back.
//
// STILL NO NUMBERS. Nothing is counted, nothing is labelled with a quantity, there
// is no axis. Six lit rows out of sixteen is a picture of a mechanism, the same
// standing as ContextField's three ticks — the repo does not publish how many
// chunks either method read and facts.md has no such figure.
//
// RED IS A MARK, NOT TYPE. Red on ink measures 4.49:1, under the 4.5 floor, so the
// kept passage does not turn red — it STAYS full cream, 16.54:1, and a red rule is
// drawn beside it in the margin. That is the editorial change-bar, and it keeps the
// canon's rule that marks go on the data and never on the reading.
//
// The mono face is FAMILY.mono, added to canon/kt-tokens.json#system on 2026-08-16.
// IBM Plex Mono is already a Vektor face — the landing pages are set in it and the
// engine already loads it — so this canonises a face the brand owns. It is not a
// role, so no film can set a headline in it.
const CODE_LINES = [
  '    async getEffectiveIgnorePatterns(codebasePath: string, additionalIgnorePatterns: string[] = []): Promise<string[]> {',
  '        return this.loadIgnorePatterns(codebasePath, additionalIgnorePatterns);',
  '    }',
  '',
  '    /**',
  '     * Public wrapper for prepareCollection private method',
  '     */',
  '    async getPreparedCollection(codebasePath: string): Promise<void> {',
  '        return this.prepareCollection(codebasePath);',
  '    }',
  '',
  '    /**',
  '     * Get isHybrid setting from environment variable with default true',
  '     */',
  '    private getIsHybrid(): boolean {',
  "        const isHybridEnv = envManager.get('HYBRID_MODE');",
];
const CODE_KEPT_FROM = 4, CODE_KEPT_TO = 9;   // source lines 268-273, comment and all

// TIMINGS ARE THE WORD LAYER'S, not round numbers, so the picture moves when the
// sentence moves. Every one is a word's `ms` from KTTokensWords.ts.
const CODE_IN = 7040;         // the page arrives on "Here is why that works."
const CODE_READ_FROM = 8450;  // "Grep reads your whole repo" — the head starts down
const CODE_READ_TO = 12960;   // it reaches the bottom on "window."
const CODE_DROP = 13660;      // "Semantic search" — everything grep lit falls away
const CODE_MARK_FROM = 14450; // "reads"
const CODE_MARK_TO = 16190;   // the rule finishes drawing on "matters,"

// EXTRACTED 2026-08-18 into kt/argument.tsx, the shared argument library.
//
// NO. 034 IS A LOCKED ARTEFACT AND ITS RENDER DOES NOT CHANGE. What moved is
// where the device is DECLARED, not what it draws — every geometry value, colour
// and curve is carried across verbatim, and canon/goldens/no-034/signature.json
// is the proof: nine founder-approved frames, two of them this plate, all inside
// tolerance after the move. Extraction that alters published work is not
// extraction, it is a re-approval nobody asked for.
//
// WHY IT HAD TO MOVE. This device was sealed inside this film, so NO. 035 — the
// very next film built — could not import it and had to invent its own argument
// graphics from nothing. That is the 13-vs-72 split costing real work, and it is
// the actual enemy of consistency: while argument devices live inside films,
// every film reinvents its visual language.
//
// The film keeps what is ITS OWN: the source lines, and every timing, each of
// which is a word's `ms` from KTTokensWords.ts so the picture moves when the
// sentence moves.
const CodePage: React.FC<{field: string}> = ({field}) => (
  <SharedCodePage field={field} lines={CODE_LINES}
    keptFrom={CODE_KEPT_FROM} keptTo={CODE_KEPT_TO}
    inMs={CODE_IN} readFromMs={CODE_READ_FROM} readToMs={CODE_READ_TO}
    dropMs={CODE_DROP} markFromMs={CODE_MARK_FROM} markToMs={CODE_MARK_TO}
    label="GREP" labelAfter="SEMANTIC SEARCH" />
);

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
  // TRAVEL IS DERIVED FROM THE CANON'S READING SPEED, not from a fraction tuned by
  // eye. system.CAPTURE_SCROLL_PX_PER_SEC is the rate a viewer can actually follow;
  // how far the page moves is that rate times how long the shot is up, clamped to
  // the image. Twice now the fraction was adjusted and twice it was still too fast,
  // because a percentage of an arbitrary image height is not a speed.
  const shotSec = (shot.to - shot.from) / 1000;
  const travel = Math.min(IMG_H - 1920, CAPTURE_SCROLL_PX_PER_SEC * shotSec);
  const y = -travel * t;
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
            top: PLATE_TOP, width: cw, height: 280,
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
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 326, width: VIZ_W,
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
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP, width: VIZ_W,
      fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug, color: pal.label}}>
      TOKENS PER FIX
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 44, width: VIZ_W,
      fontFamily: FONT, fontSize: 107, color: WHITE, lineHeight: 1}}>
      <Odometer values={rampValues(73373, 44449, 20, (n) => n.toLocaleString('en-US'))}
        fromMs={31840} tickMs={80} />
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 184, width: VIZ_W,
      height: 2, background: pal.hair}} />
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 226, width: VIZ_W,
      fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug, color: pal.label}}>
      TOOL CALLS
    </div>
    <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 270, width: VIZ_W,
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
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP, width: VIZ_W,
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
          <div key={r.k} style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 140 + i * 104,
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
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 344, width: VIZ_W,
        height: 3, background: pal.hair, opacity: tot}} />
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 372, width: VIZ_W,
        opacity: tot, fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug, color: pal.label}}>
        TOTAL
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 406, width: VIZ_W,
        opacity: tot, fontFamily: FONT, fontSize: 44, lineHeight: 1.06, whiteSpace: 'nowrap', color: pal.text}}>
        someone else&rsquo;s tokens
      </div>
    </>
  );
};

// ---- S6 -- where to get it -------------------------------------------------
// EXTRACTED 2026-08-18 into kt/argument.tsx as `SourceCard`. Same terms as
// CodePage above: the declaration moved, the render did not, and the goldens are
// the proof. The film keeps its own content and its own arrival time.
//
// THE SHARED DEVICE IS DELIBERATELY NOT CALLED A REPO CARD. kt-canon.yml#rules
// .repoCapture (founder, 2026-08-17) says a film RECOMMENDING a repository owes
// the viewer a real scrolling capture of it, never a drawn card. NO. 034 shipped
// this card before that ruling existed and is grandfathered by it; the extracted
// device is for a named source that is not a repo recommendation.
//
// A star count is the one figure in this film with a shelf life. Read at primary
// source (`gh api repos/zilliztech/claude-context`) on 2026-08-15; it was 12,395
// on 2026-08-14, so it moves several a day. It is frozen here because the film is
// shipped — the value belongs to the render, not to today.
const FindPlate: React.FC<{field: string}> = ({field}) => (
  <SourceCard field={field} atMs={52870}
    where="GITHUB.COM" name="zilliztech / claude-context" meta="12,402 stars · MIT" />
);

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
// MEASURED first-panel-pixel (scripts/check-seam-colours.mjs), and now held in the
// canon rather than here. WIPE_TAIL decides when a plate may arrive after a seam -
// NO. 034's code page was rendering blank because it started its entrance under the
// wipe - so a film reading its own copy of this number is a film that can silently
// disagree with the gate that measures it.
const WIPE_LEAD = WIPE.leadFrames;
const WIPE_TAIL = WIPE.tailFrames;
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
  //
  // ...AND STOPS AT THE OPENING, same day, after the founder watched it: held over
  // BOTH sections it was one still image for 11.2 of the 18.6 seconds. It now ends
  // on the seam in the sentence — the claim gets the field, the explanation gets
  // the window it actually names. Two plates, still never two at once.
  {from: 90,    to: 7040,          Node: ContextField},   //  7.0s  needs 4.8
  {from: 7040,  to: 18680,         Node: CodePage},       // 11.6s  needs 4.8
  {from: 23770, to: 31840,         Node: AbPlate},        //  8.1s  needs 7.8
  {from: 31840, to: 41640,         Node: DropPlate},      //  9.8s  needs 7.8
  {from: 41640, to: 52870,         Node: CostPlate},      // 11.2s  needs 9.0
  {from: 52870, to: 56070,         Node: FindPlate},      //  3.2s  needs 4.8 - SHORT
  {from: 56070, to: TOKENS_END_MS, Node: TokensOutro},    //  8.5s  needs 6.0
];

// ---- the mascot -------------------------------------------------------------
// FOUNDER, 2026-08-16: "add the mascot in the hook and in a couple of other
// slides", then "hook, 1 middle, 1 outro", with the position marked as a green dot
// on a Studio screenshot.
//
// THE DOT WAS MEASURED, NOT EYEBALLED. A sub-agent decoded the screenshot to raw
// RGB and found the green blob's centroid at (165, 445) in a 357x632 image whose
// video frame runs x10-342 / y15-606 — which maps to x504, y1397 on the 1080x1920
// frame. That is below the graphic, in the empty lower third, a touch left of
// centre. The sprite is placed on the founder's x and as close to their y as the
// safe floor allows: feet on SAFE.y1 less one gap, which is 39px above the mark.
//
// WHICH BEATS IS A MEASUREMENT, NOT A PREFERENCE. check-type-fit reports the
// lowest graphic pixel per beat; the mascot may only stand where it clears that by
// at least gap('xl'). Measured, with feet at 1404:
//
//   hook       viz to 1105   clearance 200   OK
//   code page  viz to 1367   overlaps        NO
//   capture    full bleed    no furniture    NO
//   A/B        viz to 1200   clearance 105   OK
//   drop       viz to 1212   clearance  93   OK   <- the middle, the payoff beat
//   cost       viz to 1303   clearance   2   NO
//   repo card  viz to 1064   clearance 241   OK
//   outro      no viz layer                  OK
//
// AN EARLIER VERSION OF THIS TABLE WAS WRONG and would have cut two of those
// beats. It assumed the sprite was as tall as `size` is wide. The rig is 13 cells
// across and 8 down, so at size 160 it is 160 wide and 98 TALL. Reading the
// component instead of assuming its aspect is the difference between "only the
// repo card fits" and "four beats fit".
//
// The component is NEVER edited — NO. 026, 030 and 031 render it and are locked
// artefacts. Everything here is props. The pose is `walk` because the canon motion
// law is that mascots SLIDE, never pop, and the bubble is off because a speech
// bubble is a second thing to read on a frame that already carries three.
const MASCOT = {size: 160, xPct: 46.7, yPct: 70.7} as const;
const MASCOTS: {from: number; until: number; look: {xPct: number; yPct: number}}[] = [
  {from: 90,    until: 7040,          look: {xPct: 50, yPct: 50}},  // the hook
  {from: 31840, until: 41640,         look: {xPct: 50, yPct: 52}},  // the payoff
  {from: 56070, until: TOKENS_END_MS, look: {xPct: 50, yPct: 44}},  // the outro
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
      {/* THE VOICE, IN THE COMPOSITION (2026-08-16). Previously the film rendered
          silent and the take was muxed on afterwards, which meant Studio played
          nothing - so GATE 2, the founder's scrub, could not check the one thing
          this rebuild was for: whether each visual lands on the word that says it.
          Reviewing sync in silence is not reviewing sync.
          Only on the composite; the layer renders that the gates measure stay
          silent so nothing waits on audio decoding. */}
      {layer === 'all' ? (
        <Audio src={staticFile('audio/2026-08-14-token-claims-kt/vo-master-v3.wav')} />
      ) : null}
      {layer !== 'type' && layer !== 'furniture' && !wiping && shot ? <ShotPlate shot={shot} /> : null}

      {layer !== 'type' && layer !== 'furniture' && !wiping && !shot ? (<>
      {PLATES.map((pl) => (
        <Window key={pl.from} fromMs={pl.from} toMs={pl.to}><pl.Node field={bg} /></Window>
      ))}
      </>) : null}

      {/* The mascot rides the VIZ layer so check-type-fit measures it as something
          the type must clear, and is suppressed on wipes and full-bleed exactly
          like a plate. It is deliberately NOT in PLATES: onePlateAtATime would
          read it as a second plate and fail every beat it stands on, and it is not
          a plate — it carries the brand, not the argument (kt-tokens.json#system
          .hierarchy.mascotIsCompanion, founder 2026-08-16). */}
      {layer !== 'type' && layer !== 'furniture' && !wiping && !shot
        ? MASCOTS.filter((m) => frame >= f(m.from) && frame < f(m.until)).map((m) => (
          /* BLACK EYES, EVERY FIELD (founder, 2026-08-16). The pupils are filled
              `var(--fg)` so eye colour is set from OUTSIDE by this wrapper — the
              shared rig is never touched. It was field-aware (cream eyes on the
              dark fields), which made the mascot look at you differently depending
              on the beat. INK on every field, like NO. 033's mini mascots. The
              pupils sit inside the sprite's own eye whites, not on the field, so
              this reads the same on ink, cream and red. */
          <AbsoluteFill key={m.from} style={{['--fg' as any]: INK}}>
            <ClaudeMascot frames={KT_TOKENS_FRAMES}
              config={{pose: 'walk', xPct: MASCOT.xPct, yPct: MASCOT.yPct,
                size: MASCOT.size, delay: f(m.from) + f(ENTER), bubble: false,
                lookAt: m.look}} />
          </AbsoluteFill>
        ))
        : null}

      {layer !== 'viz' && layer !== 'furniture' && !wiping && !shot ? (
      /* THE TYPE HANGS OFF THE GRAPHIC, NOT OFF THE TOP OF THE FRAME
          (founder, 2026-08-16, with an arrow drawn on the gap).

          This was `padding: 330px` and `justifyContent: flex-start` — the block
          pinned under the wordmark, the plate starting at y860, and however much
          empty frame fell between them. On a two-row beat that is roughly 300px
          of nothing sitting between a sentence and the picture of the sentence.

          The canon had already ruled on it and the ruling had never been wired to
          anything. kt-tokens.json#system.hierarchy.proximityDoc, in its own words:
          "Type at y330 above a graphic at y860 was actively telling the viewer the
          two had nothing to do with each other." That is the whole defect, written
          down, in the file the composition is generated from, unread by the
          composition. It is the fifth mechanism in WHY-THE-CANON-ISNT-APPLIED.md.

          So the block is BOTTOM-ANCHORED to textBottomWhenPlateShown() and grows
          upward. A one-row beat and a three-row beat both end the same distance
          above the graphic, which is what proximity means; before, they started
          at the same place and ended wherever they happened to end.

          FIRST ATTEMPT BOTTOM-ANCHORED IT to textBottomWhenPlateShown() and the
          founder rejected it: "they should sit in the middle between vektor at the
          top left and the visualisation, not that close to the visualisation."
          Hanging the block off the graphic solved the void above it by creating a
          void below the wordmark instead — the same defect upside down.

          So the block CENTRES IN THE BAND between the wordmark's baseline and the
          graphic. That is the founder's rule stated twice, and it is a rule rather
          than a position: a one-row beat and a three-row beat both sit centred in
          the same band, and no beat has anywhere to state a top.

          Every number is derived, none typed. The band opens at the wordmark's
          baseline (WORDMARK.y + the wordmark role's size, both canon) and closes at
          PLATE_TOP. TEXT_ABOVE_PLATE_GAP stops being the positioner and becomes
          what it should always have been — a FLOOR, checked by the gate. It was
          raised 64 -> 96 in this same change because 64 could never be obeyed: it
          fails typeToVizClearancePx, the 80px floor check-type-fit has enforced
          since NO. 033. Two canon files, two numbers, and the unreachable one was
          the one nothing used. */
      <AbsoluteFill style={{alignItems: 'center',
        ...(mode === 'caption' && topNow ? {fontSize: UI.m, opacity: 0.92} : {}),
        justifyContent: 'center',
        // `bottom: auto` because AbsoluteFill pins all four sides: with top,
        // bottom and height all set the browser drops one of them, and which one
        // is not a thing to leave to a resolution rule.
        ...(topNow ? {top: TYPE_BAND_TOP, height: TYPE_BAND_H, bottom: 'auto'} : {}),
        flexDirection: 'column', rowGap: 26,
        padding: '0 150px',
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
