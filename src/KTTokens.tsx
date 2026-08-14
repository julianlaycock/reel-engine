// NO. 034 "token claims" — KT-Remotion. Shared grammar imported from KTHook.tsx
// (ONE implementation, no look-alikes), same as KTState/KTFunnel/KTStack.
//
// The film's argument, and therefore its visual spine: five repos promise to cut
// your Claude Code token bill, their numbers do not agree, and the biggest claim
// was measured by its author against its author's own code. So every plate here
// is a CLAIM SET AGAINST ITS EVIDENCE — a number with what is behind it, or the
// conspicuous absence of anything behind it. Nothing on screen is code; the film
// shows what each repo says and what it measured, and the page gives the links.
//
// The pivot beat carries the whole argument and is deliberately the emptiest
// frame in the film: 43 alone, against the 12,395 that just left.
//
// Locked taste rulings carried from NO. 026 / 027 / 033, held here:
//   - no glyph-scramble anywhere (so no w.shuffle, and no w.chaos either)
//   - visualisations enter EARLY and hold LONG
//   - text on viz beats sits top, never touching the viz
//   - everything cuts on exact frames; nothing fades across a seam
//
// Built on the ported effect set, nothing new ported: MatteWipe and
// ZigzagMarquee from KTSeams, Odometer and PumpRect from KTEffects. Everything
// else is a film-local plate, which is what every KT film has.
//
// Field plan: ink -> cream (18.6s) -> ink (30.7s) -> red (44.7s) -> cream (50.9s)
// -> red (63.5s). The rotation law is that a film does not repeat its
// predecessor; NO. 033 ran ink -> cream -> red -> cream -> ink -> red.
//
// SAFE ZONE IS A BUILD CONSTRAINT, NOT A REVIEW STEP. Everything meaningful lives
// inside x150-930 / y220-1420, drop shadows included. VIZ_L/VIZ_W below are that
// box and nothing may exceed it.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f, Word} from './KTHook';
import {TOKENS_BEATS, TOKENS_END_MS} from './KTTokensWords';
import {MatteWipe, ZigzagMarquee} from './KTSeams';
import {Odometer, rampValues, PumpRect} from './KTEffects';
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

// The safe box. Nothing below may leave it.
const VIZ_L = 150, VIZ_W = 780, VIZ_TOP = 800, VIZ_BOTTOM = 1420;

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

// ---- S1 -- the claim, counting itself up -----------------------------------
// The hero number arrives on the type layer; this is what sits UNDER it. An
// odometer runs 0 -> 98.9 and then holds, so the claim is watched being made
// rather than simply stated, and the bar beneath it fills to match. The bar is
// the point: it is almost the whole width, which is what 98.9% looks like.
const ClaimBar: React.FC = () => {
  const frame = useCurrentFrame();
  const p = decel(prog(frame, 2100, 1500));
  const w = VIZ_W * 0.989 * p;
  return (
    <>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 120, width: VIZ_W,
        height: 2, background: HAIR_I}} />
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 60, width: w,
        height: 58, background: RED}} />
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 150, width: VIZ_W,
        fontFamily: FONT_UI, fontSize: 22, letterSpacing: 3, color: GREY_I}}>
        CLAIMED REDUCTION
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 210, width: VIZ_W,
        fontFamily: FONT, fontSize: 86, color: CREAM}}>
        <Odometer values={rampValues(0, 98.9, 14, (n) => String(n))} fromMs={2100} tickMs={100} />
        <span style={{fontSize: 55}}>%</span>
      </div>
    </>
  );
};

// ---- S2 -- the benchmark, and how small it is ------------------------------
// Two figures the repo publishes about itself, side by side, plus the corpus it
// used. The corpus cell is the finding, so it is the one that gets the border
// and the pump: the tool measured itself.
const BenchGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const cells: {k: string; v: string; at: number; self?: boolean}[] = [
    {k: 'FILES', v: '51', at: 19200},
    {k: 'QUERIES', v: '5', at: 19900},
    {k: 'CORPUS', v: 'ITSELF', at: 20800, self: true},
  ];
  const cw = (VIZ_W - 40) / 3;
  return (
    <>
      {cells.map((c, i) => {
        const p = decel(prog(frame, c.at, 300));
        if (p <= 0) return null;
        return (
          <div key={c.k} style={{position: 'absolute', left: VIZ_L + i * (cw + 20),
            top: VIZ_TOP + 90, width: cw, height: 210,
            border: `2px solid ${c.self ? RED : HAIR_I}`,
            background: c.self ? 'rgba(231,55,26,0.14)' : WASH_I,
            opacity: p, transform: `translateY(${(1 - p) * 18}px)`,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            alignItems: 'center', rowGap: 10}}>
            <div style={{fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3,
              color: c.self ? RED : GREY_I}}>{c.k}</div>
            <div style={{fontFamily: FONT, fontSize: c.self ? 44 : 69,
              color: c.self ? RED : CREAM}}>{c.v}</div>
          </div>
        );
      })}
      {/* The two published figures, disagreeing with each other. */}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 340, width: VIZ_W,
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        fontFamily: FONT_UI, fontSize: 22, letterSpacing: 3, color: GREY_I}}>
        <span>README 90%+</span>
        <span style={{color: RED}}>BENCHMARK 98.9%</span>
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 386, width: VIZ_W,
        height: 2, background: HAIR_I}} />
    </>
  );
};

// ---- S3 -- the five, arriving ----------------------------------------------
// The whole set on one plate, so the film has shown its scope before it starts
// spending time on any single repo. Each row lands on its own beat of the line.
const RepoStack: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    {n: 'Claude Context', at: 30000},
    {n: 'Token Reducer', at: 30260},
    {n: 'Claude Code Memory Setup', at: 30520},
    {n: 'Claude Memory', at: 30780},
    {n: 'ClaudeSlim', at: 31040},
  ];
  return (
    <>
      {rows.map((r, i) => {
        const p = decel(prog(frame, r.at, 260));
        if (p <= 0) return null;
        return (
          <div key={r.n} style={{position: 'absolute', left: VIZ_L,
            top: VIZ_TOP + 60 + i * 92, width: VIZ_W, height: 76,
            borderBottom: `2px solid ${HAIR_C}`,
            opacity: p, transform: `translateX(${(1 - p) * -26}px)`,
            display: 'flex', alignItems: 'center', columnGap: 22}}>
            <span style={{fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3,
              color: GREY_C, width: 40}}>{`0${i + 1}`}</span>
            <span style={{fontFamily: FONT, fontSize: 44, color: INK}}>{r.n}</span>
          </div>
        );
      })}
    </>
  );
};

// ---- S4 -- the big repo, and its condition ---------------------------------
// 12,395 counted up, with the caveat printed underneath in the same weight as
// the number is NOT: the condition is the thing nobody else attaches, so it is
// set as a chip rather than as small print.
const ContextPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const p = decel(prog(frame, 38600, 400));
  return (
    <>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 40, width: VIZ_W,
        fontFamily: FONT_UI, fontSize: 22, letterSpacing: 3, color: GREY_C}}>
        CLAUDE CONTEXT
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 84, width: VIZ_W,
        fontFamily: FONT, fontSize: 134, color: INK, lineHeight: 1}}>
        <Odometer values={rampValues(0, 12395, 18, (n) => n.toLocaleString('en-US'))} fromMs={38600} tickMs={90} />
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 226, width: VIZ_W,
        fontFamily: FONT_UI, fontSize: 22, letterSpacing: 3, color: GREY_C}}>
        STARS
      </div>
      {p > 0 ? (
        <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 300,
          padding: '16px 26px', border: `2px solid ${INK}`, background: WASH_C,
          opacity: p, transform: `translateY(${(1 - p) * 14}px)`,
          fontFamily: FONT, fontSize: 44, color: INK}}>
          40% <span style={{fontFamily: FONT_UI, fontSize: 24, color: GREY_C}}>
            at equivalent retrieval quality</span>
        </div>
      ) : null}
    </>
  );
};

// ---- S5 -- the pivot -------------------------------------------------------
// The emptiest frame in the film, on purpose. 12,395 has just left the screen
// and 43 replaces it at the same size and the same position, so the comparison
// is made by the cut rather than by a chart. The pump fires once, on the number,
// and nothing else moves.
const PivotPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const p = decel(prog(frame, 45400, 300));
  if (p <= 0) return null;
  return (
    <>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 40, width: VIZ_W,
        fontFamily: FONT_UI, fontSize: 22, letterSpacing: 3, color: GREY_I, opacity: p}}>
        TOKEN REDUCER
      </div>
      <PumpRect fromMs={45400} x={VIZ_L} y={VIZ_TOP + 88} w={228} h={148} color={RED} />
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 268, width: VIZ_W,
        fontFamily: FONT_UI, fontSize: 22, letterSpacing: 3, color: GREY_I, opacity: p}}>
        STARS
      </div>
      {/* The other two, stated flat and small. They are corroboration, not news. */}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 340, width: VIZ_W,
        opacity: decel(prog(frame, 48400, 400))}}>
        {[['CLAUDE CODE MEMORY SETUP', 'up to 71x', 'no benchmark'],
          ['CLAUDE MEMORY', '10x', 'no benchmark']].map(([k, v, e], i) => (
          <div key={k} style={{display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', padding: '14px 0',
            borderBottom: `2px solid ${HAIR_I}`}}>
            <span style={{fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3,
              color: GREY_I}}>{k}</span>
            <span style={{fontFamily: FONT, fontSize: 44, color: CREAM}}>{v}</span>
            <span style={{fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3,
              color: RED}}>{e}</span>
          </div>
        ))}
      </div>
    </>
  );
};

// ---- S6 -- the one that is not there ---------------------------------------
// A repo card that draws itself and then fails. The 404 is on the type layer;
// this is the empty frame it fails into.
const SlimPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const p = decel(prog(frame, 51600, 400));
  const strike = decel(prog(frame, 53400, 500));
  return (
    <>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 60, width: VIZ_W,
        height: 250, border: `2px solid ${CREAM}`, opacity: p,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        paddingLeft: 34, rowGap: 14}}>
        <div style={{fontFamily: FONT_UI, fontSize: 20, letterSpacing: 3,
          color: 'rgba(244,239,223,0.72)'}}>GITHUB.COM</div>
        <div style={{fontFamily: FONT, fontSize: 55, color: CREAM}}>apolloraines / ClaudeSlim</div>
      </div>
      {/* The card is crossed out by a rule that draws left to right. */}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 185,
        width: VIZ_W * strike, height: 6, background: CREAM}} />
    </>
  );
};

// ---- S7 -- the pattern -----------------------------------------------------
// The film's actual finding, drawn once: stars descending, claims ascending.
// Four repos, ordered by stars, each a row whose bar length is its CLAIM. The
// bars get longer as the stars get smaller, which is the whole argument in one
// picture and needs no annotation.
const PatternPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    {n: 'Claude Context', stars: '12,395', claim: 0.40},
    {n: 'Claude Code Memory Setup', stars: '934', claim: 0.72},
    {n: 'Claude Memory', stars: '24', claim: 0.90},
    {n: 'Token Reducer', stars: '43', claim: 0.989},
  ];
  return (
    <>
      {rows.map((r, i) => {
        const p = decel(prog(frame, 61000 + i * 420, 460));
        if (p <= 0) return null;
        const barW = (VIZ_W - 300) * r.claim * p;
        return (
          <div key={r.n} style={{position: 'absolute', left: VIZ_L,
            top: VIZ_TOP + 40 + i * 108, width: VIZ_W, height: 92,
            display: 'flex', alignItems: 'center', columnGap: 16}}>
            <span style={{fontFamily: FONT_UI, fontSize: 19, letterSpacing: 2,
              color: GREY_C, width: 96, textAlign: 'right'}}>{r.stars}</span>
            <div style={{width: barW, height: 40, background: i === 3 ? RED : INK}} />
            <span style={{fontFamily: FONT_UI, fontSize: 19, letterSpacing: 2,
              color: i === 3 ? RED : GREY_C, whiteSpace: 'nowrap'}}>
              {Math.round(r.claim * 100)}%
            </span>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 8, width: VIZ_W,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: FONT_UI, fontSize: 19, letterSpacing: 3, color: GREY_C}}>
        <span>STARS</span><span>CLAIMED SAVING</span>
      </div>
    </>
  );
};

// ---- S8 -- the end card ----------------------------------------------------
// THE HOUSE OUTRO. NO. 030 ends on a red field with fourteen rows of "vektor"
// folding down the frame at 13% cream, and three type rows over it: comment /
// the keyword huge with an underline / the promise. That is the standard and it
// is deliberately the same film to film.
//
// The unit's trailing DOUBLE SPACE is load-bearing: rowDelta = amp*4/period =
// 260*4/13 = 80px must stay under the inter-word gap or adjacent rows shear.
// These are NO. 030's shipped numbers.
const TokensOutro: React.FC = () => (
  <ZigzagMarquee fromMs={63460} unit={'vektor  '} amp={260} period={13} rows={14}
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
  {ms: 18620, field: CREAM},
  {ms: 30660, field: INK},
  {ms: 44660, field: RED},
  {ms: 50900, field: CREAM},
  {ms: 63460, field: RED},
];
const Seams: React.FC = () => (
  <>
    {FLIPS.map((w) => (
      <MatteWipe key={w.ms} atMs={w.ms} main={w.field} accent1={w.field} accent2={w.field} />
    ))}
  </>
);

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
  const lightField = beat.bg === CREAM;
  // Footer contrast is field-aware (design review 2026-08-08). It was
  // cream-at-34% on every dark field, which measures 1.47:1 against RED —
  // effectively invisible, and on the beat that carries the CTA.
  const furn = lightField
    ? 'rgba(16,16,16,0.55)'
    : (beat.bg === RED ? CREAM : 'rgba(244,239,223,0.55)');
  return (
    <AbsoluteFill style={{backgroundColor: beat.bg, fontFamily: FONT}}>
      {layer !== 'type' ? (<>
      <Window fromMs={1600}  toMs={18620}><ClaimBar /></Window>
      <Window fromMs={18620} toMs={30660}><BenchGrid /></Window>
      <Window fromMs={30660} toMs={38200}><RepoStack /></Window>
      <Window fromMs={38200} toMs={44660}><ContextPlate /></Window>
      <Window fromMs={44660} toMs={50900}><PivotPlate /></Window>
      <Window fromMs={50900} toMs={56400}><SlimPlate /></Window>
      <Window fromMs={60600} toMs={63460}><PatternPlate /></Window>
      <Window fromMs={63460} toMs={TOKENS_END_MS}><TokensOutro /></Window>
      </>) : null}

      {layer !== 'viz' ? (
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

      {layer === 'all' ? (<>
      {/* FURNITURE — inside the safe box. The 44px rail is HORIZONTAL-ONLY since
          2026-08-07: Reels chrome cuts the top and bottom, so the wordmark sits
          at y240 and the footer slugs at y1372, not at the rail. NO. 033 put the
          footer at y1560 as a founder override scoped to that film only; this
          one is back inside the box. */}
      <div style={{position: 'absolute', top: 240, left: VIZ_L, fontSize: 40, fontWeight: 600,
        letterSpacing: '-0.045em', color: lightField ? INK : CREAM,
        fontFamily: FONT_UI}}>vektor</div>
      <div style={{position: 'absolute', top: 1372, left: VIZ_L, fontSize: 22, letterSpacing: 3,
        color: furn}}>vektor /// token claims</div>
      <div style={{position: 'absolute', top: 1372, left: VIZ_L, width: VIZ_W, textAlign: 'right',
        fontSize: 22, letterSpacing: 3, color: furn}}>comment. tokens.</div>
      </>) : null}
    </AbsoluteFill>
  );
};
