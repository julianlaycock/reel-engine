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
const PROMPT = 'fix my code';
const PromptBox: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = Math.min(PROMPT.length, Math.max(0, Math.floor((frame - f(1500)) / 3)));
  const sent = frame >= f(3900);
  const caretOn = Math.floor(frame / 8) % 2 === 0;
  const BOX_Y = VIZ_TOP + 130;
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      {/* the sent prompt, parked above the box once it goes */}
      {sent ? (
        <div style={{position: 'absolute', left: VIZ_L + VIZ_W - 430, top: BOX_Y - 118, width: 430,
          height: 92, border: `4px solid ${HAIR_I}`, color: CREAM, fontSize: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 22px'}}>
          {PROMPT}
        </div>
      ) : null}

      {/* the input itself */}
      <div style={{position: 'absolute', left: VIZ_L, top: BOX_Y, width: VIZ_W, height: 128,
        border: `4px solid ${CREAM}`, display: 'flex', alignItems: 'center', padding: '0 26px',
        fontSize: 40, color: CREAM, letterSpacing: 1}}>
        <span>{sent ? '' : PROMPT.slice(0, chars)}</span>
        <span style={{opacity: caretOn ? 1 : 0, marginLeft: 3}}>|</span>
      </div>

      {/* what comes back: nothing. three dots that never resolve. */}
      {sent ? (
        <div style={{position: 'absolute', left: VIZ_L, top: BOX_Y + 190, display: 'flex', gap: 18}}>
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

// ---- S3 -- the 17, then the 7 ----------------------------------------------
// The count is the verified figure (17 directories in anthropics/skills/skills,
// GitHub API, 2026-08-08). The 7 that fills is vektor/.claude/skills.
const SkillGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const filled = (i: number) => frame >= f(20400 + i * 130);
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <Odometer fromMs={14200} tickMs={60} values={rampValues(0, 17, 12, (n) => String(n))}
        style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP - 44, fontSize: 112, color: INK,
          lineHeight: 1}} />
      <div style={{position: 'absolute', left: VIZ_L + 172, top: VIZ_TOP + 36, fontSize: 26,
        letterSpacing: 3, color: GREY_C}}>ANTHROPIC / SKILLS</div>
      {/* The real page, pasted in like a specimen rather than run full-bleed.
          Full-bleed would put type over the viz, which the locked ruling forbids
          ("text on viz beats sits top, never touching the viz"), and NO. 016's
          full-bleed repo shot came with an accepted tradeoff of nibbled edges.
          Framed, it stays inside x150-930 and its job is authenticity — the
          NUMBER is carried by the odometer and the spoken line, not by reading
          the screenshot. Provenance: public/screens/no033-skills-17.json. */}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 115, width: VIZ_W,
        height: 485, border: `4px solid ${INK}`, overflow: 'hidden', background: CREAM}}>
        <Img src={staticFile('screens/no033-skills-17.png')}
          style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 24%'}} />
      </div>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_BOTTOM - 62, width: VIZ_W,
        display: 'flex', justifyContent: 'space-between', fontSize: 24, letterSpacing: 3,
        color: GREY_C}}>
        <span>GITHUB.COM/ANTHROPICS/SKILLS</span><span>{filled(6) ? '7 MINE' : ''}</span>
      </div>
    </AbsoluteFill>
  );
};

// ---- S4 -- the real storefront, then the private one -----------------------
// The founder supplied this capture by hand: claude.com/plugins refuses headless
// Edge outright (flat single colour at 9s of virtual time, no file at all at
// 45s). It is worth the manual step — the page shows verified badges and install
// counts, so it visibly IS a storefront, which is the exact word in the line.
// Provenance: public/screens/no033-plugin-store.json.
//
// The three labels above it keep the factual correction the source reel gets
// wrong: official and community are DIFFERENT marketplaces
// (code.claude.com/docs/en/discover-plugins). The live one lights as the script
// names it. Then MINE lands ON TOP of the real store, because the line is "a
// third that nobody else can see".
const STORES = [{t: 'OFFICIAL', ms: 27600}, {t: 'COMMUNITY', ms: 31300}, {t: 'MINE', ms: 33800}];
const Storefront: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP, width: VIZ_W,
        display: 'flex', justifyContent: 'space-between'}}>
        {STORES.map((s) => {
          const live = frame >= f(s.ms);
          return (
            <div key={s.t} style={{fontSize: 26, letterSpacing: 3,
              color: live ? CREAM : 'rgba(244,239,223,0.38)',
              borderBottom: live ? `4px solid ${CREAM}` : '4px solid transparent',
              paddingBottom: 8}}>{s.t}</div>
          );
        })}
      </div>

      {/* Pre-cropped to the card region rather than object-fit'd from the full
          page. The whole 1100px-wide page inside a 780px plate rendered every
          card title at 0.71x, which is why the list could not be read. The crop
          (700x485 from x70,y290) is a 1.11x blow-up of the same cards instead —
          a 56% gain in apparent type size, and the plate no longer has to guess
          a focal point with objectPosition. */}
      <div style={{position: 'absolute', left: VIZ_L, top: VIZ_TOP + 100, width: VIZ_W,
        height: 510, border: `4px solid ${CREAM}`, overflow: 'hidden', background: CREAM}}>
        <Img src={staticFile('screens/no033-plugin-store-crop.png')}
          style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top'}} />
      </div>
    </AbsoluteFill>
  );
};

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

      <div style={{position: 'absolute', left: LANE_X - 92, top: GATE_Y - 104, fontSize: 30,
        letterSpacing: 3, color: INK}}>MAIN</div>
      <div style={{position: 'absolute', left: BRANCH_X - 40, top: GATE_Y - 34, fontSize: 26,
        letterSpacing: 3, color: GREY_C}}>BRANCH</div>
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
  {t: 'JUDGE', s: 'reads rendered frames', x: 26, ms: 65100},
  {t: 'TRIAGE', s: 'what actually needs me', x: 44, ms: 67500},
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
      {AGENTS.map((a) => (
        frame >= f(a.ms) ? (
          <ClaudeMascot key={a.t} frames={frames} sceneKind="beat"
            config={{pose: 'pop', xPct: a.x, yPct: 56, size: 132, delay: 0,
              lookAt: {xPct: 50, yPct: 30}}} />
        ) : null
      ))}
      {/* the generalist: same figure, drained of presence */}
      {frame >= f(69600) ? (
        <div style={{opacity: 0.28}}>
          <ClaudeMascot frames={frames} sceneKind="beat"
            config={{pose: 'pop', xPct: 62, yPct: 56, size: 108, delay: 0, bubble: false}} />
        </div>
      ) : null}

      {AGENTS.map((a) => (
        frame >= f(a.ms) ? (
          <div key={`l-${a.t}`} style={{position: 'absolute', left: a.x * 10.8 - 110, top: 1236,
            width: 220, textAlign: 'center', fontSize: 30, letterSpacing: 2, color: CREAM}}>
            {a.t}
            <div style={{fontSize: 20, letterSpacing: 2, color: GREY_I, marginTop: 8}}>
              {a.s.toUpperCase()}
            </div>
          </div>
        ) : null
      ))}
      {frame >= f(69600) ? (
        <div style={{position: 'absolute', left: 62 * 10.8 - 110, top: 1236, width: 220,
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
// The words go in a solid ink band under the shot rather than over it. The band
// stops at y1440, NOT at the frame edge: Instagram's chrome eats the bottom, and
// the words are the one thing that must never be cropped. The band's FILL runs
// to 1920 so there is no seam against the frame edge; only its TYPE is fenced.
//
// Scroll travel is capped. The official-plugins page is 2340px tall once fitted
// to 1080 wide, and letting it run its full length would scroll at 122px/s,
// which reads as a swipe rather than a drift.
const SHOT_TOP = 1120, BAND_TYPE_BOTTOM = 1440;
type Shot = {from: number; to: number; src: string; travel: number};
const SHOTS: Shot[] = [
  {from: 13400, to: 24600, src: 'screens/no033-skills-17.png', travel: 230},
  {from: 26200, to: 36700, src: 'screens/no033-official-repo.png', travel: 600},
];

const ShotPlate: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const t = clamp01((frame - f(shot.from)) / Math.max(1, f(shot.to) - f(shot.from)));
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: SHOT_TOP,
        overflow: 'hidden', background: CREAM}}>
        <Img src={staticFile(shot.src)}
          style={{position: 'absolute', left: 0, top: 0, width: 1080,
            transform: `translateY(${-t * shot.travel}px)`}} />
      </div>
      <div style={{position: 'absolute', left: 0, top: SHOT_TOP, width: 1080,
        height: 1920 - SHOT_TOP, background: INK}} />
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
  const lightField = beat.bg === CREAM;
  const furn = lightField ? GREY_C : GREY_I;
  return (
    <AbsoluteFill style={{backgroundColor: beat.bg, fontFamily: FONT}}>
      {layer !== 'type' && !shot ? (<>
      <Window fromMs={1400}  toMs={7000}>  <PromptBox /></Window>
      <Window fromMs={7000}  toMs={11800}> <FiveTicks /></Window>
      <Window fromMs={11800} toMs={24600}> <SkillGrid /></Window>
      <Window fromMs={24600} toMs={36700}> <Storefront /></Window>
      <Window fromMs={36700} toMs={52600}> <ThresholdCross /></Window>
      <Window fromMs={52600} toMs={63000}> <MemoryStack /></Window>
      <Window fromMs={63000} toMs={72800}> <AgentCards frames={KT_STACK_FRAMES} /></Window>
      <Window fromMs={72800} toMs={STACK_END_MS}><StackOutro /></Window>
      </>) : null}
      {layer !== 'type' && shot ? <ShotPlate shot={shot} /> : null}

      {layer !== 'viz' ? (
      <AbsoluteFill style={{alignItems: 'center',
        justifyContent: shot ? 'flex-end' : (beat.top ? 'flex-start' : 'center'),
        flexDirection: 'column', rowGap: shot ? 16 : 26,
        // 330 not 260: the wordmark sits at y240 to clear Instagram's Reels
        // header, so the type block starts below its baseline.
        padding: shot
          ? `0 150px ${1920 - BAND_TYPE_BOTTOM}px`
          : (beat.top ? '330px 150px 0' : '0 150px'), textAlign: 'center'}}>
        {beat.rows.map((row, ri) => (
          <div key={`${beat.from}-${ri}`} style={{lineHeight: 1.14}}>
            {row.words.map((w, wi) => (
              <Word key={wi} w={w} base={row.size} baseColor={shot ? CREAM : beat.type} />
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
