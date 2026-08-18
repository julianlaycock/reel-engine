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
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f, Word} from './KTHook';
import {STACK_BEATS, STACK_END_MS} from './KTStackWords';
import {MatteWipe, ZigzagMarquee} from './KTSeams';
import {Odometer, rampValues, PumpRect} from './KTEffects';
import {ClaudeMascot} from './scenes/ClaudeMascot';
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

// ---- S1 -- the prompt box --------------------------------------------------
// Founder direction, 2026-08-08: "someone typing in a textbox". The first
// version drew two rules drifting apart to mean "a gap", which is an abstraction
// of an abstraction and read as nothing.
//
// This is the person the line is about: opens Claude Code, types something
// vague, sends it, and waits. The caret types "fix my code", the prompt is sent,
// and then nothing comes back — the stall IS the point, so it is held, not
// resolved. No setup above the box, because that is the other group.
// v3, 2026-08-08: the founder asked for the boxes to be improved. v2 drew two
// hairline rectangles that read as generic boxes rather than as a chat. What
// makes a composer legible at a glance is the furniture around the field, not
// the field: a rounded composer with a leading chevron, a send affordance that
// is dim until there is something to send, and the sent message as a filled
// bubble on the right with a tail. So the beat now reads as a conversation that
// goes nowhere, rather than as text in a rectangle.
const PROMPT = 'fix my code';
const PromptBox: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = Math.min(PROMPT.length, Math.max(0, Math.floor((frame - f(1500)) / 3)));
  const typed = PROMPT.slice(0, chars);
  const sent = frame >= f(3900);
  const caretOn = Math.floor(frame / 8) % 2 === 0;
  const BOX_Y = VIZ_TOP + 210;
  const R = 26;
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      {/* the sent message: a filled bubble, right-aligned, with a tail */}
      {sent ? (
        <>
          <div style={{position: 'absolute', left: VIZ_L + VIZ_W - 400, top: BOX_Y - 168,
            width: 400, height: 104, background: CREAM, color: INK, fontSize: 38,
            borderRadius: `${R}px ${R}px 6px ${R}px`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {PROMPT}
          </div>
          {/* The tail hangs off the bubble's RIGHT edge, so it has to start 18px
              back from it or it points outside the safe box — measured x933
              against a limit of 930. */}
          <div style={{position: 'absolute', left: VIZ_L + VIZ_W - 18, top: BOX_Y - 78,
            width: 0, height: 0, borderLeft: `18px solid ${CREAM}`,
            borderBottom: '16px solid transparent'}} />
        </>
      ) : null}

      {/* the composer */}
      <div style={{position: 'absolute', left: VIZ_L, top: BOX_Y, width: VIZ_W, height: 132,
        boxSizing: 'border-box',   // without this the 3px border pushes the
        // composer's right edge to x936, 6px outside the safe box; measured x933
        border: `3px solid ${HAIR_I}`, borderRadius: R, display: 'flex', alignItems: 'center',
        padding: '0 24px', fontSize: 40, color: CREAM, letterSpacing: 1, gap: 18}}>
        <span style={{color: RED, fontSize: 36}}>&gt;</span>
        <span style={{flex: 1, textAlign: 'left', opacity: sent ? 0.34 : 1}}>
          {sent ? 'ask anything' : typed}
          {sent ? null : <span style={{opacity: caretOn ? 1 : 0}}>|</span>}
        </span>
        {/* send: dim until there is something to send, then solid */}
        <div style={{width: 62, height: 62, borderRadius: 31,
          background: chars > 0 && !sent ? CREAM : 'transparent',
          border: `3px solid ${chars > 0 && !sent ? CREAM : HAIR_I}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: chars > 0 && !sent ? INK : GREY_I, fontSize: 30}}>↑</div>
      </div>

      {/* what comes back: nothing. three dots that never resolve. */}
      {sent ? (
        <div style={{position: 'absolute', left: VIZ_L + 24, top: BOX_Y + 186, display: 'flex', gap: 18}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{width: 22, height: 22, borderRadius: 11,
              background: CREAM,
              opacity: 0.22 + 0.5 * (Math.floor(frame / 6) % 3 === i ? 1 : 0)}} />
          ))}
        </div>
      ) : null}
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

// ---- the section openers ---------------------------------------------------
// Founder 2026-08-08: "1. Skills" and "2. The plugin marketplace" are OPENERS —
// centred, alone in the frame, obviously a section card, then a hard cut to the
// page. So these beats carry NO visualisation at all during their opener: the
// odometer, the 17-cell grid and the OFFICIAL/COMMUNITY/MINE strip are all gone.
// The card is the spoken words themselves, centred by the composition, which is
// why there is no component here — adding one would put the label on screen
// twice, once as type and once as furniture.
const OPENERS = [
  {from: 11810, to: 13400},   // 1. Skills.
  {from: 24610, to: 26200},   // 2. The plugin marketplace.
];

// S4 has no plate either. The OFFICIAL / COMMUNITY / MINE strip is gone at the
// founder's direction; the script already says "Anthropic curates the official
// one" and "there's a separate community one you add by hand", so the
// distinction is spoken and the screen does not need to repeat it.

// ---- S5 -- the commit that has to take the branch --------------------------
// Rebuilt 2026-08-08 after the founder rejected v2 as cheap. Research findings
// that drove this, with sources in the session record:
//
//  - GRAMMAR. In every git-graph implementation a filled RECTANGLE means
//    "highlighted", and a commit is a solid CIRCLE (mermaid, gitgraph.js).
//    v2 slid a rectangle along a rail, so it was drawing the wrong object.
//  - FILL CARRIES STATE (Primer): filled = accepted, outline = rejected. The
//    commit is a solid ink disc and becomes a hollow ring at the moment it is
//    turned back. That one state change tells the story with no new element.
//  - CURVE. Three independent libraries (gitgraph.js toSvgPath, d3 curveBumpY,
//    React Flow calculateControlOffset) compute the SAME diverging path: a
//    symmetric cubic bezier whose control points both sit at the midpoint of
//    the travel axis, so the branch leaves and rejoins exactly parallel to the
//    trunk. No visible corner is the premium tell. Founder picked this over an
//    elbow and over straight diagonals.
//  - WEIGHT HIERARCHY, two weights and no more: rails 12px, the blocking bar
//    20px, hairline annotation 3px.
//  - ONE RED OBJECT AT A TIME (Tufte's smallest effective difference). The bar
//    is red; the rejected ring is ink. Never both red.
//  - MOTION. A bounce oscillates; a rejection displaces ONCE and holds. So:
//    approach accelerates (no ease-out), hard stop at zero, 110ms of absolute
//    stillness, then a single recoil of ~10% that settles and never returns.
//    The dead hold does more work than any easing curve.
const LANE_X = 330;                 // trunk, on the 90px column grid
const BRANCH_X = LANE_X + 260;      // the branch lane
const GATE_Y = VIZ_TOP + 150;       // where main refuses it
const START_Y = VIZ_BOTTOM - 120;
const W_RAIL = 12, W_BAR = 20, W_HAIR = 3, DOT = 30;

// accelerate INTO the stop (M3 emphasized-accelerate), never ease out
const accel = (t: number) => clamp01(t) * clamp01(t) * (0.3 + 0.7 * clamp01(t));

const RUNS = [
  {start: 45300, hit: 45900, hold: 46010, settle: 46250},
  {start: 46450, hit: 47050, hold: 47160, settle: 47400},
];
const BRANCH_RUN = {draw: 47700, start: 48200, land: 49100};

const ThresholdCross: React.FC = () => {
  const frame = useCurrentFrame();

  // which attempt owns this frame
  const run = RUNS.find((r) => frame >= f(r.start) && frame < f(r.settle));
  const onBranch = frame >= f(BRANCH_RUN.start);
  const branchDraw = decel(prog(frame, BRANCH_RUN.draw, 400));
  const rejected = RUNS.some((r) => frame >= f(r.hit) && frame < f(r.settle));

  let cx = LANE_X, cy = START_Y;
  if (onBranch) {
    const t = decel(prog(frame, BRANCH_RUN.start, BRANCH_RUN.land - BRANCH_RUN.start));
    // ride the same bezier the branch is drawn on
    const p0 = {x: LANE_X, y: START_Y - 120}, p3 = {x: BRANCH_X, y: GATE_Y + 40};
    const my = (p0.y + p3.y) / 2;
    const u = 1 - t;
    cx = u * u * u * p0.x + 3 * u * u * t * p0.x + 3 * u * t * t * p3.x + t * t * t * p3.x;
    cy = u * u * u * p0.y + 3 * u * u * t * my + 3 * u * t * t * my + t * t * t * p3.y;
  } else if (run) {
    const reach = GATE_Y + 46;
    if (frame < f(run.hit)) {
      cy = START_Y - accel(prog(frame, run.start, run.hit - run.start)) * (START_Y - reach);
    } else if (frame < f(run.hold)) {
      cy = reach;                       // the dead hold — 110ms of nothing
    } else {
      const s = decel(prog(frame, run.hold, run.settle - run.hold));
      cy = reach + s * 74;              // ONE displacement, ~10%, then still
    }
  } else {
    cy = START_Y;
  }

  const barKick = rejected ? 1 : 0;

  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        {/* trunk */}
        <line x1={LANE_X} y1={GATE_Y + 30} x2={LANE_X} y2={VIZ_BOTTOM - 40}
          stroke={INK} strokeWidth={W_RAIL} strokeLinecap="round" opacity={0.32} />
        {/* the branch, drawn on the tangent-parallel bezier */}
        <path
          d={`M ${LANE_X} ${START_Y - 120} C ${LANE_X} ${(START_Y - 120 + GATE_Y + 40) / 2} ${BRANCH_X} ${(START_Y - 120 + GATE_Y + 40) / 2} ${BRANCH_X} ${GATE_Y + 40}`}
          fill="none" stroke={INK} strokeWidth={W_RAIL} strokeLinecap="round"
          strokeDasharray={1400} strokeDashoffset={1400 * (1 - branchDraw)} opacity={0.32} />
        {/* the hook: the only red object in the frame */}
        <line x1={LANE_X - 92} y1={GATE_Y} x2={LANE_X + 92} y2={GATE_Y}
          stroke={RED} strokeWidth={W_BAR + barKick * 6} strokeLinecap="butt" />
        {/* main's terminus, and the branch's */}
        <circle cx={LANE_X} cy={GATE_Y - 54} r={DOT / 2} fill={INK} />
        <circle cx={BRANCH_X} cy={GATE_Y + 40} r={DOT / 2}
          fill={frame >= f(BRANCH_RUN.land) ? INK : 'none'}
          stroke={INK} strokeWidth={W_HAIR} />
        {/* the travelling commit: solid when live, hollow the moment it is refused */}
        <circle cx={cx} cy={cy} r={DOT / 2}
          fill={rejected ? CREAM : INK} stroke={INK} strokeWidth={rejected ? W_RAIL : 0} />
      </svg>

      {/* Founder 2026-08-08: centre the labels on their circles. Both were
          left-anchored off a hand-picked offset, so neither sat under the node
          it names. Each is now a fixed-width box centred on the node's x. */}
      <div style={{position: 'absolute', left: LANE_X - 140, top: GATE_Y - 116, width: 280,
        textAlign: 'center', fontSize: 30, letterSpacing: 3, color: INK}}>MAIN</div>
      <div style={{position: 'absolute', left: BRANCH_X - 140, top: GATE_Y + 82, width: 280,
        textAlign: 'center', fontSize: 26, letterSpacing: 3, color: GREY_C}}>BRANCH</div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_BOTTOM - 46, width: VIZ_W,
        borderTop: `${W_HAIR}px solid ${HAIR_C}`, paddingTop: 12, fontSize: 22,
        letterSpacing: 3, color: GREY_C}}>PRE-TOOL-USE HOOK</div>
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
      <ZigzagMarquee fromMs={53200} unit={'MEMORY  '} amp={150} period={15}
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
            // Founder 2026-08-08: ink at 42% did not contrast. Full ink, with
            // the one row the VO calls out taking the red.
            borderBottom: `3px solid ${HAIR_C}`, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', fontSize: 26, letterSpacing: 2,
            color: i === 0 ? RED : INK}}>
            <span>{`FACT ${String(i + 1).padStart(2, '0')}`}</span>
            <span>{i === 0 ? 'INDEX' : 'ON DISK'}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---- S7 -- two specialists, one generalist ---------------------------------
const AGENTS = [
  {t: 'JUDGE', s: 'reads rendered frames', x: 30, ms: 65100},
  {t: 'TRIAGE', s: 'what actually needs me', x: 50, ms: 67500},
];
const AgentCards: React.FC<{frames: number}> = ({frames}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      {/* Founder 2026-08-08: use the mini mascots, as NO. 030's radial council
          did. Two specialists land as the VO names them; the generalist behind
          them is present but inert. Placement respects the mascot safe zone
          (xPct 20-62, yPct 25-66 per scenes/ClaudeMascot.tsx) — outside it the
          rig logs a render warning. */}
      {/* Eyes forced to ink. ClaudeMascot draws them as var(--fg, mascotNavy),
          so setting --fg here changes them WITHOUT touching a component that
          NO. 026 / 030 / 031 also render — those films are locked. */}
      <div style={{['--fg' as string]: INK} as React.CSSProperties}>
        {AGENTS.map((a) => (
          frame >= f(a.ms) ? (
            <ClaudeMascot key={a.t} frames={frames} sceneKind="beat"
              config={{pose: 'pop', xPct: a.x, yPct: 56, size: 132, delay: 0,
                lookAt: {xPct: 50, yPct: 30}}} />
          ) : null
        ))}
        {/* the generalist: same size as the specialists, drained of presence */}
        {frame >= f(69600) ? (
          <div style={{opacity: 0.3}}>
            <ClaudeMascot frames={frames} sceneKind="beat"
              config={{pose: 'pop', xPct: 70, yPct: 56, size: 132, delay: 0, bubble: false}} />
          </div>
        ) : null}
      </div>

      {AGENTS.map((a) => (
        frame >= f(a.ms) ? (
          <div key={`l-${a.t}`} style={{position: 'absolute', left: a.x * 10.8 - 110, top: 1250,
            width: 220, textAlign: 'center', fontSize: 30, letterSpacing: 2, color: CREAM}}>
            {a.t}
            <div style={{fontSize: 20, letterSpacing: 2, color: GREY_I, marginTop: 8}}>
              {a.s.toUpperCase()}
            </div>
          </div>
        ) : null
      ))}
      {frame >= f(69600) ? (
        <div style={{position: 'absolute', left: 70 * 10.8 - 110, top: 1250, width: 220,
          textAlign: 'center', fontSize: 26, letterSpacing: 2, color: GREY_I}}>GENERALIST</div>
      ) : null}
    </AbsoluteFill>
  );
};

// ---- S8 -- the end card ----------------------------------------------------
// THE HOUSE OUTRO. NO. 030 ends on a red field with fourteen rows of "vektor"
// folding down the frame at 13% cream, and three type rows over it: comment /
// the keyword huge with an underline / the promise. That is the standard and it
// is deliberately the same film to film — the founder's note on 2026-08-08 was
// that the outro should be "relatively standardized and relatively the same
// between videos".
//
// What this replaces: a solid red rectangle with STACK set inside it and a pump
// on top, on an ink field. Off-standard on the field, the row count and the
// treatment, and the founder cut it on sight.
//
// NO. 030 hand-rolled this marquee locally as `ZigzagOutro`. This uses the
// PORTED ZigzagMarquee from KTSeams instead — same fx, one implementation, no
// look-alike under a second name.
//
// The unit's trailing DOUBLE SPACE is load-bearing: rowDelta = amp*4/period =
// 260*4/13 = 80px must stay under the inter-word gap or adjacent rows shear.
// These are NO. 030's shipped numbers.
const StackOutro: React.FC = () => (
  <ZigzagMarquee fromMs={72800} unit={'vektor  '} amp={260} period={13} rows={14}
    rowH={136} fontSize={150} dur={75} color={'rgba(244,239,223,0.13)'} />
);


// ---- the screenshot beats --------------------------------------------------
// Founder direction 2026-08-08: the numbered label opens the section, then the
// real page takes the frame and scrolls slowly. Hard cut in and out, no wipe,
// no wordmark and no footer while it is up.
//
// No words at all while a shot is up (founder, third scrub) — full bleed means
// full bleed. That costs the film roughly 16 of its 78 seconds with no text on
// screen, which is a deliberate trade, not an oversight.
//
// The sources are AUTO-CROPPED, not eyeballed: a script measures where the page
// content actually ends against the page's own background colour, trims the dead
// space below it, and takes the left 55% where the file list sits. The founder's
// note was that the captures left too much empty space at the bottom and needed
// to zoom the left side; measuring the content beats picking a number by hand,
// and it re-derives itself if the pages are ever re-captured.
//
// Scroll travel is capped so the page drifts rather than swipes.
const SHOT_TOP = 1920;   // full bleed, founder 2026-08-08
type Shot = {from: number; to: number; src: string; travel: number};
const SHOTS: Shot[] = [
  {from: 13400, to: 24600, src: 'screens/no033-skills-crop.png', travel: 420},
  {from: 26200, to: 36700, src: 'screens/no033-official-crop.png', travel: 520},
];

const ShotPlate: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const t = clamp01((frame - f(shot.from)) / Math.max(1, f(shot.to) - f(shot.from)));
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SHOT_TOP,
        overflow: 'hidden', background: CREAM}}>
        {/* minHeight guards the case where a crop comes back shorter than the
            frame — at 55% the skills page fitted to 1080 wide was only 1756 tall
            and would have letterboxed. Both crops are taller than 1920 at 42%,
            but a re-capture must not be able to reintroduce a gap silently. */}
        <Img src={staticFile(shot.src)}
          style={{position: 'absolute', left: 0, top: 0, width: 1080, minHeight: 1920,
            objectFit: 'cover', objectPosition: 'top',
            transform: `translateY(${-t * shot.travel}px)`}} />
      </div>
    </>
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
// ONE COLOUR PER WIPE (founder, 2026-08-08: "i like those transitions but just
// make them cleaner, with 1 colour, i see like 3 colors"). MatteWipe sweeps three
// panels — two accents through the frame, then the main panel stopping at x0 —
// and colouring them separately is what put three colours on screen. All three
// now take the INCOMING field colour, so the seam reads as one clean sheet of the
// new colour arriving rather than as a parade.
//
// Done by passing the same value three times, NOT by editing MatteWipe: that
// component is the single shared implementation and NO. 027, 030 and 031 all
// render it. The border is dropped for the same reason it was a third colour.
const FLIPS: {ms: number; field: string}[] = [
  {ms: 11800, field: CREAM},
  {ms: 24600, field: RED},
  {ms: 36700, field: CREAM},
  // Splits the hooks beat. At 36.7s-52.6s it was 15.9s with no field change,
  // the longest stretch in the film and the weakest (design review 2026-08-08).
  // 44.8s lands between the second rejected commit and the branch draw, so the
  // seam falls on a story boundary rather than in the middle of a move.
  {ms: 44800, field: CREAM},
  {ms: 52600, field: CREAM},   // same-colour wipe: splits a 26.3s static stretch
  {ms: 63000, field: INK},
  {ms: 72800, field: INK},     // same-colour wipe into the end card
];
const Seams: React.FC = () => (
  <>
    {FLIPS.map((w) => (
      <MatteWipe key={w.ms} atMs={w.ms} main={w.field} accent1={w.field} accent2={w.field} />
    ))}
  </>
);

// ---- composition -----------------------------------------------------------
export const KTStack: React.FC<{layer?: 'all' | 'type' | 'viz'}> = ({layer = 'all'}) => {
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
  const shot = SHOTS.find((sh) => frame >= f(sh.from) && frame < f(sh.to));
  // During an opener the type block centres in the frame instead of sitting in
  // its usual top band, so the section card reads as a card and not as the first
  // line of a paragraph.
  const opener = OPENERS.some((o) => frame >= f(o.from) && frame < f(o.to));
  const lightField = beat.bg === CREAM;
  // Footer contrast (design review 2026-08-08). It was cream-at-34% on every
  // dark field, which measures 1.47:1 against RED — effectively invisible, and
  // on the beat that carries the CTA. Ink and red need different treatments:
  // red is a mid-luminance field, so the furniture has to be much closer to
  // full cream there than it does on ink.
  const furn = lightField
    ? 'rgba(16,16,16,0.55)'
    // Full cream on red: at 82% it still measured 2.88:1, under the 3.0
    // large-text floor. Undimmed cream on red is 3.68:1 and clears it.
    : (beat.bg === RED ? CREAM : 'rgba(244,239,223,0.55)');
  return (
    <AbsoluteFill style={{backgroundColor: beat.bg, fontFamily: FONT}}>
      {layer !== 'type' && !shot ? (<>
      <Window fromMs={1400}  toMs={7000}>  <PromptBox /></Window>
      <Window fromMs={7000}  toMs={11800}> <FiveTicks /></Window>
      <Window fromMs={36700} toMs={52600}> <ThresholdCross /></Window>
      <Window fromMs={52600} toMs={63000}> <MemoryStack /></Window>
      <Window fromMs={63000} toMs={72800}> <AgentCards frames={KT_STACK_FRAMES} /></Window>
      <Window fromMs={72800} toMs={STACK_END_MS}><StackOutro /></Window>
      </>) : null}
      {layer !== 'type' && shot ? <ShotPlate shot={shot} /> : null}

      {layer !== 'viz' && !shot ? (
      <AbsoluteFill style={{alignItems: 'center',
        justifyContent: opener || !beat.top ? 'center' : 'flex-start',
        flexDirection: 'column', rowGap: 26,
        // 330 not 260: the wordmark sits at y240 to clear Instagram's Reels
        // header, so the type block starts below its baseline. An opener ignores
        // that band entirely and centres in the frame.
        padding: opener || !beat.top ? '0 150px' : '330px 150px 0',
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
          at y240 and the footer slugs at y1372, not at the rail. */}
      <div style={{position: 'absolute', top: 240, left: VIZ_L, fontSize: 40, fontWeight: 600,
        letterSpacing: '-0.045em', color: lightField ? INK : CREAM,
        fontFamily: FONT_UI}}>vektor</div>
      <div style={{position: 'absolute', top: 1560, left: VIZ_L, fontSize: 22, letterSpacing: 3,
        color: furn}}>vektor /// five setups</div>
      <div style={{position: 'absolute', top: 1560, left: VIZ_L, width: VIZ_W, textAlign: 'right',
        fontSize: 22, letterSpacing: 3, color: furn}}>comment. stack.</div>
      </>) : null}
    </AbsoluteFill>
  );
};
