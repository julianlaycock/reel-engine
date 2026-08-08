// NO. 033 "five setups" — KT-Remotion. Shared grammar imported from KTHook.tsx
// (ONE implementation, no look-alikes), same as KTState.tsx and KTFunnel.tsx.
//
// The film's argument, and therefore its visual spine: the gap is not knowledge,
// it is SETUP. So every beat shows a thing that has been INSTALLED — a count that
// lands, panels that fill, a gate that holds, a stack that persists. Nothing on
// screen is code; the film shows what the setup DOES, and the page gives the how.
//
// Locked taste rulings carried from NO. 026 / NO. 027, held here:
//   - no glyph-scramble anywhere (so no w.shuffle, and no w.chaos either)
//   - visualisations enter EARLY and hold LONG
//   - text on viz beats sits top, never touching the viz
//   - everything cuts on exact frames; nothing fades across a seam
//
// Founder ruling 2026-08-08: build on the ported effect set, port nothing new,
// and spend the effort on the hook. The catalogue devices used here are
// MatteWipe, ZigzagMarquee, Odometer and PumpRect. Everything else is a
// film-local plate, which is what every KT film has (KTFunnel has nine).
//
// Field plan: ink -> cream (11.8s) -> red (24.6s) -> cream (36.7s) -> ink (63.0s).
// The rotation law is that a film does not repeat its predecessor; NO. 027 ran
// cream -> ink -> cream -> ink -> red. Red lands on beat 4 ("My own.") because
// that is the one line about Vektor rather than about tooling.
//
// SAFE ZONE IS A BUILD CONSTRAINT, NOT A REVIEW STEP. Everything meaningful lives
// inside x150-930 / y220-1420, drop shadows included. VIZ_L/VIZ_W below are that
// box and nothing may exceed it.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f, Word} from './KTHook';
import {STACK_BEATS, STACK_END_MS} from './KTStackWords';
import {MatteWipe, ZigzagMarquee} from './KTSeams';
import {Odometer, rampValues, PumpRect} from './KTEffects';
import './style.css';

export const KT_STACK_FRAMES = f(STACK_END_MS);

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

// ---- S1 -- the gap ---------------------------------------------------------
// Two rules drift apart. No labels: the type above already names the two groups,
// and repeating them here would be the "text touching the viz" mistake.
const GapBars: React.FC = () => {
  const frame = useCurrentFrame();
  const g = decel(prog(frame, 1400, 4200));
  const spread = 40 + g * 190;
  const mid = VIZ_TOP + 300;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: VIZ_L, top: mid - spread, width: VIZ_W, height: 10,
        background: CREAM}} />
      <div style={{position: 'absolute', left: VIZ_L, top: mid + spread, width: VIZ_W, height: 10,
        background: RED}} />
      <div style={{position: 'absolute', left: VIZ_L, top: mid - spread + 10, width: 4,
        height: spread * 2 - 10, background: HAIR_I}} />
      <div style={{position: 'absolute', left: VIZ_L + VIZ_W - 4, top: mid - spread + 10, width: 4,
        height: spread * 2 - 10, background: HAIR_I}} />
    </AbsoluteFill>
  );
};

// ---- S2 -- five ticks ------------------------------------------------------
const FiveTicks: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 190, width: VIZ_W,
        display: 'flex', justifyContent: 'space-between'}}>
        {[0, 1, 2, 3, 4].map((i) => {
          const on = frame >= f(7600 + i * 620);
          return (
            <div key={i} style={{width: 132, height: 132, border: `5px solid ${CREAM}`,
              background: on ? CREAM : 'transparent', color: INK, fontSize: 72,
              display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {on ? i + 1 : ''}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---- S3 -- the 17, then the 7 ----------------------------------------------
// The count is the verified figure (17 directories in anthropics/skills/skills,
// GitHub API, 2026-08-08). The 7 that fills is vektor/.claude/skills.
const SkillGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const cols = 6, cell = 118, gap = 14;
  const filled = (i: number) => frame >= f(20400 + i * 130);
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Odometer fromMs={14200} tickMs={60} values={rampValues(0, 17, 12, (n) => String(n))}
        style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP - 30, fontSize: 150, color: INK,
          lineHeight: 1}} />
      <div style={{position: 'absolute', left: VIZ_L + 200, top: VIZ_TOP + 60, fontSize: 26,
        letterSpacing: 3, color: GREY_C}}>ANTHROPIC / SKILLS</div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 190, width: VIZ_W,
        display: 'flex', flexWrap: 'wrap', gap}}>
        {Array.from({length: 17}).map((_, i) => (
          <div key={i} style={{width: cell, height: 74,
            border: `3px solid ${i < 7 && filled(i) ? RED : HAIR_C}`,
            background: i < 7 && filled(i) ? RED : WASH_C}} />
        ))}
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_BOTTOM - 92, width: VIZ_W,
        display: 'flex', justifyContent: 'space-between', fontSize: 24, letterSpacing: 3,
        color: GREY_C, borderTop: `3px solid ${HAIR_C}`, paddingTop: 14}}>
        <span>{`${cols * 0 + 17} EXAMPLES`}</span><span>7 MINE</span>
      </div>
    </AbsoluteFill>
  );
};

// ---- S4 -- three storefronts, the third alone ------------------------------
const STORES = ['OFFICIAL', 'COMMUNITY', 'MINE'];
const StorefrontPanels: React.FC = () => {
  const frame = useCurrentFrame();
  const inAt = [26800, 31700, 34200];
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      {STORES.map((s, i) => {
        const g = decel(prog(frame, inAt[i], 520));
        const w = 244, x = VIZ_L + i * (w + 24);
        const ours = i === 2;
        return (
          <div key={s} style={{position: 'absolute', left: x, top: VIZ_TOP + 150, width: w,
            height: 300, opacity: g,
            transform: `translateY(${(1 - g) * 40}px)`,
            border: `5px solid ${CREAM}`, background: ours ? CREAM : 'transparent',
            color: ours ? RED : CREAM,
            display: 'flex', alignItems: 'flex-end', padding: 20, fontSize: 30,
            letterSpacing: 2}}>{s}</div>
        );
      })}
      {/* fx/pump-rect via KTEffects. The third panel is the only one that pumps:
          it is the only one that is ours. transformOrigin does the anchoring, so
          no position key is needed alongside the scale (see EFFECTS-INDEX). */}
      <PumpRect fromMs={34600} x={VIZ_L + 2 * 268} y={VIZ_TOP + 150} w={244} h={300}
        color={'rgba(244,239,223,0.22)'} beat={11} pumps={5} ampY={1.09} accel={0.86}
        decay={0.82} anchor={'bottom'} />
    </AbsoluteFill>
  );
};

// ---- S5 -- the gate --------------------------------------------------------
// A commit travels toward main and is stopped. The bar is the hook; it does not
// move, which is the whole point of a hook.
const HookGate: React.FC = () => {
  const frame = useCurrentFrame();
  const g = decel(prog(frame, 45600, 1900));
  const gateX = VIZ_L + 520;
  const x = VIZ_L + 20 + g * 430;
  const blocked = frame >= f(47400);
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: gateX, top: VIZ_TOP + 120, width: 12, height: 300,
        background: RED}} />
      <div style={{position: 'absolute', left: gateX + 30, top: VIZ_TOP + 130, fontSize: 26,
        letterSpacing: 3, color: GREY_C}}>MAIN</div>
      <div style={{position: 'absolute', left: x, top: VIZ_TOP + 210, width: 150, height: 110,
        border: `4px solid ${INK}`, background: blocked ? WASH_C : 'transparent',
        color: INK, fontSize: 22, letterSpacing: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center'}}>COMMIT</div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_BOTTOM - 150, width: VIZ_W,
        borderTop: `3px solid ${HAIR_C}`, paddingTop: 16, fontSize: 24, letterSpacing: 3,
        color: GREY_C}}>PRE-TOOL-USE / POST-TOOL-USE</div>
      <PumpRect fromMs={47400} x={gateX} y={VIZ_TOP + 120} w={12} h={300} color={RED}
        beat={9} pumps={4} ampX={2.4} ampY={1.0} accel={0.9} decay={0.7} anchor={'center'} />
    </AbsoluteFill>
  );
};

// ---- S6 -- one fact per file -----------------------------------------------
// The rows are the memory directory: eleven files plus the index that is read
// back. ZigzagMarquee runs behind them as the sessions that keep ending.
const MEM_ROWS = 6;
const MemoryStack: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      {/* The unit's trailing DOUBLE SPACE is load-bearing: rowDelta = amp*4/period
          must stay under the inter-word gap or adjacent rows shear and the crease
          reads as torn columns. amp 150 / period 15 gives 40px. */}
      <ZigzagMarquee fromMs={53200} unit={'SESSION  '} amp={150} period={15}
        color={'rgba(16,16,16,0.07)'} fontSize={120} />
      {Array.from({length: MEM_ROWS}).map((_, i) => {
        const on = frame >= f(58400 + i * 190);
        const g = decel(prog(frame, 58400 + i * 190, 320));
        return (
          <div key={i} style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 130 + i * 74,
            width: VIZ_W, height: 60, opacity: on ? 1 : 0,
            // Slides UP, not in from the left. A translateX of -26 put the row at
            // x124 mid-animation, measured at x131-149 on frame 1770 against a
            // safe box starting at x150. The rows sit at y930-1300, so 18px of
            // vertical travel has room the horizontal axis does not.
            transform: `translateY(${(1 - g) * 18}px)`,
            borderBottom: `3px solid ${HAIR_C}`, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', fontSize: 26, letterSpacing: 2, color: GREY_C}}>
            <span>{`FACT ${String(i + 1).padStart(2, '0')}`}</span>
            <span style={{color: i === 0 ? RED : GREY_C}}>{i === 0 ? 'INDEX' : 'ON DISK'}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---- S7 -- two specialists, one generalist ---------------------------------
const AgentCards: React.FC = () => {
  const frame = useCurrentFrame();
  const cards = [
    {t: 'JUDGE', s: 'reads rendered frames', ms: 65100},
    {t: 'TRIAGE', s: 'what actually needs me', ms: 67500},
  ];
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      {cards.map((c, i) => {
        const g = decel(prog(frame, c.ms, 480));
        return (
          <div key={c.t} style={{position: 'absolute', left: VIZ_L + i * 400, top: VIZ_TOP + 160,
            width: 376, height: 250, opacity: g, transform: `translateY(${(1 - g) * 34}px)`,
            border: `5px solid ${CREAM}`, color: CREAM, padding: 22,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div style={{fontSize: 46, letterSpacing: 1}}>{c.t}</div>
            <div style={{fontSize: 24, letterSpacing: 2, color: GREY_I}}>{c.s.toUpperCase()}</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_BOTTOM - 170, width: VIZ_W,
        height: 96, border: `4px solid ${HAIR_I}`, background: WASH_I, color: GREY_I,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        letterSpacing: 4}}>ONE GENERALIST, GUESSING</div>
    </AbsoluteFill>
  );
};

// ---- S8 -- the keyword -----------------------------------------------------
const KeywordPlate: React.FC = () => {
  const frame = useCurrentFrame();
  const g = decel(prog(frame, 74200, 420));
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 210, width: VIZ_W, height: 190,
        opacity: g, background: RED, color: CREAM, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 96, letterSpacing: 6}}>STACK</div>
      {/* Inset 16px each side and pumped from the inset, NOT from VIZ_W. A
          centre-anchored ampX of 1.02 on a full-width rect grows 7.8px past each
          edge; it measured at x147-946 against a safe box of x150-930. The inset
          keeps the PEAK inside: 748 * 1.02 = 762.96 centred on 540, so
          158.5-921.5. Measure the peak, never the rest state. */}
      <PumpRect fromMs={74600} x={VIZ_L + 16} y={VIZ_TOP + 210} w={VIZ_W - 32} h={190}
        color={'rgba(231,55,26,0.30)'} beat={12} pumps={5} ampY={1.06} ampX={1.02}
        accel={0.88} decay={0.8} anchor={'center'} />
    </AbsoluteFill>
  );
};

// ---- seams -----------------------------------------------------------------
// Field flips are fx/matte-wipe.js (KTSeams.tsx), the same treatment shipped in
// NO. 030 / 031 / 027. The panel that stops at x0 CARRIES the incoming field
// colour, so the wipe performs the flip rather than decorating it.
//
// Four of these six are real field changes. The two same-colour wipes at 52.6s
// and 72.8s exist because the cream stretch from 36.7s to 63.0s is 26.3s long,
// well past the 21.4s worst case qa-measure accepted on NO. 027. They split it
// to 15.9s and 10.4s.
const FLIPS: {ms: number; main: string; a1: string; a2: string; border?: string}[] = [
  {ms: 11800, main: CREAM, a1: RED,   a2: INK,   border: CREAM},
  {ms: 24600, main: RED,   a1: CREAM, a2: INK,   border: CREAM},
  {ms: 36700, main: CREAM, a1: INK,   a2: RED,   border: CREAM},
  {ms: 52600, main: CREAM, a1: RED,   a2: INK,   border: CREAM},
  {ms: 63000, main: INK,   a1: CREAM, a2: RED,   border: CREAM},
  {ms: 72800, main: INK,   a1: RED,   a2: CREAM, border: CREAM},
];
const Seams: React.FC = () => (
  <>
    {FLIPS.map((w) => (
      <MatteWipe key={w.ms} atMs={w.ms} main={w.main} accent1={w.a1} accent2={w.a2}
        accent2Border={w.border} />
    ))}
  </>
);

// ---- composition -----------------------------------------------------------
export const KTStack: React.FC = () => {
  const frame = useCurrentFrame();
  // Every hook is called before any early return. A hook after an early return
  // passes every still and fails the video render with React error 310, and
  // `remotion render` exits 0 while printing it (NEXT-VIDEO-HANDOFF.md).
  // The error number is written without its hash on purpose: check-drift counts
  // a hash followed by 3-8 hex digits as a raw colour, and a React error code is
  // all hex digits, so writing it the usual way trips the ratchet.
  const beat = STACK_BEATS.find((s) => frame >= f(s.from) && frame < f(s.to)) ??
    (frame >= f(STACK_BEATS[STACK_BEATS.length - 1].from)
      ? STACK_BEATS[STACK_BEATS.length - 1]
      : STACK_BEATS[0]);
  const lightField = beat.bg === CREAM;
  const furn = lightField ? GREY_C : GREY_I;
  return (
    <AbsoluteFill style={{backgroundColor: beat.bg, fontFamily: FONT}}>
      <Window fromMs={1400}  toMs={7000}>  <GapBars /></Window>
      <Window fromMs={7000}  toMs={11800}> <FiveTicks /></Window>
      <Window fromMs={11800} toMs={24600}> <SkillGrid /></Window>
      <Window fromMs={24600} toMs={36700}> <StorefrontPanels /></Window>
      <Window fromMs={36700} toMs={52600}> <HookGate /></Window>
      <Window fromMs={52600} toMs={63000}> <MemoryStack /></Window>
      <Window fromMs={63000} toMs={72800}> <AgentCards /></Window>
      <Window fromMs={72800} toMs={STACK_END_MS}><KeywordPlate /></Window>

      <AbsoluteFill style={{alignItems: 'center',
        justifyContent: beat.top ? 'flex-start' : 'center',
        flexDirection: 'column', rowGap: 26,
        // 330 not 260: the wordmark sits at y240 to clear Instagram's Reels
        // header, so the type block starts below its baseline.
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

      {/* FURNITURE — inside the safe box. The 44px rail is HORIZONTAL-ONLY since
          2026-08-07: Reels chrome cuts the top and bottom, so the wordmark sits
          at y240 and the footer slugs at y1372, not at the rail. */}
      <div style={{position: 'absolute', top: 240, left: VIZ_L, fontSize: 40, fontWeight: 600,
        letterSpacing: '-0.045em', color: lightField ? INK : CREAM,
        fontFamily: FONT_UI}}>vektor</div>
      <div style={{position: 'absolute', top: 1372, left: VIZ_L, fontSize: 22, letterSpacing: 3,
        color: furn}}>vektor /// five setups</div>
      <div style={{position: 'absolute', top: 1372, left: VIZ_L, width: VIZ_W, textAlign: 'right',
        fontSize: 22, letterSpacing: 3, color: furn}}>comment. stack.</div>
    </AbsoluteFill>
  );
};
