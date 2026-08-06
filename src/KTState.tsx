// NO. 032 "the state file" — KT-Remotion, built to vektor/docs/KT-MOTION-SPEC.md.
// Shared grammar imported from KTHook.tsx (ONE implementation, no look-alikes).
//
// Locked taste rulings encoded here (founder):
//   - no glyph-scramble anywhere in this film
//   - visualizations enter EARLY and hold LONG (the state file holds 49s -> 93s)
//   - text on viz beats sits ~65% up from the bottom, never touching the viz
//   - everything cuts on exact frames; nothing fades across a seam
//   - mascots SLIDE, never pop
//
// Field plan: ink -> cream (12.0s) -> ink (47.0s) -> red (95.5s). Three flips.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {ClaudeMascot} from './scenes/ClaudeMascot';
// Marks (RoughRing / RoughUnderline / RoughStrike) are not imported directly:
// they are declared on WORDS via the W props and drawn by <Word>, which is what
// keeps every commentary mark on type and off the data graphics.
import {INK, CREAM, RED, f, useBucket, Word, W} from './KTHook';
import {SlabStack3D, ScreenerBoard3D} from './KTState3D';
import './style.css';

const decel = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const MW = {park: 3000, through: -3000, mainFrom: 2800, sweep: 16, a2: 3, mainDelay: 6, mainDur: 12};

export const KT_STATE_FRAMES = f(99520);

const GREY_C = 'rgba(16,16,16,0.42)';   // spent, on cream
const GREY_I = 'rgba(244,239,223,0.34)'; // spent, on ink

// ---- states (text layer) ---------------------------------------------------
type Row = {size: number; words: W[]};
type S = {from: number; to: number; bg: string; type: string; top?: boolean; rows: Row[]};

const STATES: S[] = [
  { // S1 hook (ink) — the borrowed sentence, founder-approved verbatim 2026-08-06.
    // Three phases of in-place surgery; no full-screen swap.
    // top:true because the hook now carries the 3D screener board in the lower
    // band. Centred type sat 7px off the board's top edge and read as resting
    // on it; this puts the hook on the same layout every other viz beat uses.
    from: 120, to: 12000, bg: INK, type: CREAM, top: true,
    rows: [
      {size: 56, words: [
        {t: 'Most ', ms: 120, out: 4110}, {t: 'people ', ms: 240, out: 4110},
        {t: "don't ", ms: 620, out: 4110}, {t: 'realize ', ms: 900, out: 4110}, {t: 'that ', ms: 1320, out: 4110},
        {t: 'thousands ', ms: 4110, out: 9000}, {t: 'of ', ms: 4440, out: 9000},
        {t: 'dollars ', ms: 4560, out: 9000}, {t: 'just ', ms: 4880, out: 9000}, {t: 'to', ms: 5200, out: 9000},
        {t: 'This ', ms: 9000}, {t: 'is ', ms: 9290}, {t: 'the ', ms: 9440}, {t: 'same ', ms: 9660}, {t: 'job,', ms: 9950},
      ]},
      {size: 84, words: [
        {t: 'hedge ', ms: 1560, out: 4110, color: RED}, {t: 'funds', ms: 1860, out: 4110, color: RED},
        {t: 'screen ', ms: 5280, out: 9000}, {t: 'stocks,', ms: 5680, out: 9000},
        {t: 'rebuilt ', ms: 10310}, {t: 'as ', ms: 10830}, {t: 'an ', ms: 10980},
        {t: 'agent ', ms: 11130}, {t: 'you ', ms: 11500},
        {t: 'own.', ms: 11720, ring: 3211, furnMs: 11780},
      ]},
      {size: 56, words: [
        {t: 'pay ', ms: 2200, out: 4110}, {t: 'stock ', ms: 2400, out: 4110},
        {t: 'research ', ms: 2770, out: 4110}, {t: 'analysts', ms: 3240, out: 4110},
        {t: 'pull ', ms: 6370, out: 9000}, {t: 'company ', ms: 6640, out: 9000}, {t: 'data, ', ms: 7110, out: 9000},
        {t: 'and ', ms: 7520, out: 9000}, {t: 'build ', ms: 7710, out: 9000},
        {t: 'financial ', ms: 8030, out: 9000}, {t: 'models.', ms: 8600, out: 9000},
      ]},
    ],
  },
  { // S2 the three tools (cream flip on "Open Claude") — plates build below
    from: 12000, to: 26000, bg: CREAM, type: INK, top: true,
    rows: [
      {size: 62, words: [
        {t: 'Open ', ms: 12000, out: 14000}, {t: 'Claude ', ms: 12330, out: 14000},
        {t: 'and ', ms: 12660, out: 14000}, {t: 'give ', ms: 12840, out: 14000}, {t: 'it', ms: 13120, out: 14000},
        {t: 'so ', ms: 14880, out: 19000}, {t: 'it ', ms: 15090, out: 19000}, {t: 'reads ', ms: 15200, out: 19000},
        {t: 'the ', ms: 15650, out: 19000}, {t: 'open ', ms: 15840, out: 19000}, {t: 'web', ms: 16160, out: 19000},
        {t: 'so ', ms: 19560, out: 22000}, {t: 'it ', ms: 19650, out: 22000}, {t: 'drives ', ms: 19740, out: 22000},
        {t: 'a ', ms: 20020, out: 22000}, {t: 'real ', ms: 20060, out: 22000}, {t: 'browser', ms: 20250, out: 22000},
        {t: 'so ', ms: 23220}, {t: 'it ', ms: 23370}, {t: 'reads ', ms: 23520},
        {t: 'and ', ms: 23930}, {t: 'writes', ms: 24140},
      ]},
      {size: 88, words: [
        {t: 'three ', ms: 13260, out: 14000}, {t: 'tools.', ms: 13610, out: 14000},
        {t: 'Finviz ', ms: 17300, out: 19000}, {t: 'or ', ms: 17760, out: 19000},
        {t: 'Yahoo ', ms: 17900, out: 19000}, {t: 'Finance.', ms: 18320, out: 19000},
        {t: 'a ', ms: 20950, out: 22000}, {t: 'screener', ms: 20990, out: 22000},
        {t: 'a ', ms: 24610}, {t: 'knowledge ', ms: 24680}, {t: 'base.', ms: 25390},
      ]},
    ],
  },
  { // S3 the prompt (cream held) — cards go spent, chip types
    from: 26000, to: 32000, bg: CREAM, type: INK, top: true,
    rows: [
      {size: 54, words: [
        {t: 'Then ', ms: 26000, out: 27000}, {t: 'you ', ms: 26160, out: 27000},
        {t: 'hand ', ms: 26280, out: 27000}, {t: 'it ', ms: 26440, out: 27000},
        {t: 'one ', ms: 26520, out: 27000}, {t: 'prompt.', ms: 26640, out: 27000},
        {t: "That's ", ms: 27000}, {t: 'what ', ms: 27490}, {t: 'turns ', ms: 27650},
        {t: 'Claude ', ms: 27950}, {t: 'into ', ms: 28290}, {t: 'an ', ms: 28520}, {t: 'analyst,', ms: 28640},
      ]},
      {size: 84, words: [
        {t: 'a ', ms: 29520}, {t: 'real ', ms: 29540}, {t: 'scoring ', ms: 29770},
        {t: 'framework', ms: 30220, ring: 3221, furnMs: 30500},
      ]},
    ],
  },
  { // S4 the four factors (cream) — the weighting board's headers tick in
    from: 32000, to: 38000, bg: CREAM, type: INK, top: true,
    rows: [
      {size: 58, words: [
        {t: 'It ', ms: 32000}, {t: 'tells ', ms: 32130}, {t: 'the ', ms: 32470}, {t: 'agent ', ms: 32670},
        {t: 'what ', ms: 33010}, {t: 'to ', ms: 33280}, {t: 'screen ', ms: 33410}, {t: 'on.', ms: 33960},
      ]},
    ],
  },
  { // S5 the weights + the skill file (cream) — the board completes
    from: 38000, to: 47000, bg: CREAM, type: INK, top: true,
    rows: [
      {size: 58, words: [
        {t: 'Every ', ms: 38000, out: 43000}, {t: 'factor ', ms: 38450, out: 43000},
        {t: 'carries ', ms: 38720, out: 43000}, {t: 'a ', ms: 39190, out: 43000},
        {t: 'weight,', ms: 39240, out: 43000, underline: 3231, furnMs: 39400},
        {t: 'And ', ms: 43000}, {t: 'it ', ms: 43330}, {t: 'all ', ms: 43370}, {t: 'saves ', ms: 43550},
        {t: 'to ', ms: 43870}, {t: 'a ', ms: 43990},
      ]},
      {size: 80, words: [
        {t: 'the ', ms: 41310, out: 43000}, {t: 'same ', ms: 41470, out: 43000},
        {t: 'way ', ms: 41720, out: 43000}, {t: 'every ', ms: 41920, out: 43000},
        {t: 'single ', ms: 42250, out: 43000}, {t: 'time.', ms: 42660, out: 43000},
        {t: 'skill ', ms: 44070}, {t: 'file,', ms: 44380},
      ]},
      {size: 52, words: [
        {t: 'so ', ms: 44770}, {t: 'the ', ms: 44910}, {t: 'agent ', ms: 45110},
        {t: 'never ', ms: 45440}, {t: 'starts ', ms: 45770}, {t: 'from ', ms: 46170},
        {t: 'zero.', ms: 46440},
      ]},
    ],
  },
  { // S6 THE TURN (ink flip on "Here's where it goes") — the state file enters
    from: 47000, to: 59000, bg: INK, type: CREAM, top: true,
    rows: [
      {size: 54, words: [
        {t: "Here's ", ms: 47000, out: 49000}, {t: 'where ', ms: 47360, out: 49000},
        {t: 'it ', ms: 47500, out: 49000}, {t: 'goes ', ms: 47580, out: 49000},
        {t: 'from ', ms: 47770, out: 49000}, {t: 'useful ', ms: 47950, out: 49000}, {t: 'to', ms: 48220, out: 49000},
        {t: 'You ', ms: 49000, out: 53000}, {t: 'add ', ms: 49220, out: 53000}, {t: 'a', ms: 49440, out: 53000},
        {t: 'Every ', ms: 56000}, {t: 'run ', ms: 56350}, {t: 'after ', ms: 56680},
        {t: 'that ', ms: 56910}, {t: 'reads ', ms: 57190}, {t: 'the ', ms: 57540},
        {t: 'state ', ms: 57750}, {t: 'file ', ms: 58110},
        {t: 'first.', ms: 58400, underline: 3241, furnMs: 58500},
      ]},
      {size: 96, words: [
        {t: 'compounding.', ms: 48310, out: 49000, color: RED},
        {t: 'state ', ms: 49710, out: 53000}, {t: 'file', ms: 49880, out: 53000},
      ]},
      {size: 54, words: [
        {t: 'and ', ms: 50170, out: 53000}, {t: 'it ', ms: 50460, out: 53000},
        {t: 'records ', ms: 50530, out: 53000}, {t: 'every ', ms: 51040, out: 53000},
        {t: 'screen ', ms: 51450, out: 53000}, {t: 'the ', ms: 51860, out: 53000},
        {t: 'agent ', ms: 52070, out: 53000}, {t: 'runs.', ms: 52440, out: 53000},
        // The four clauses of what the file holds. These used to be micro-fields
        // printed inside the flat ledger rows; with the stack in 3D they belong
        // in the type layer, where house type carries meaning and the object
        // carries accumulation.
        // Starts at 53000, not 53280: the previous phase expired at 53000 and
        // left an eight-frame hole with NO text on screen at all, right in the
        // middle of the hero beat.
        {t: 'What ', ms: 53000, out: 56000}, {t: 'it ', ms: 53190, out: 56000},
        {t: 'surfaced, ', ms: 53280, out: 56000},
        {t: 'what ', ms: 53760, out: 56000}, {t: 'it ', ms: 53950, out: 56000},
        {t: 'scored, ', ms: 54080, out: 56000},
        {t: 'what ', ms: 54460, out: 56000}, {t: 'you ', ms: 54610, out: 56000},
        {t: 'did, ', ms: 54760, out: 56000},
        {t: 'what ', ms: 54980, out: 56000}, {t: 'happened ', ms: 55170, out: 56000},
        {t: 'next.', ms: 55610, out: 56000},
      ]},
    ],
  },
  { // S7 the worked example (ink) — one historic row takes the red annotation
    from: 59000, to: 68000, bg: INK, type: CREAM, top: true,
    rows: [
      {size: 54, words: [
        {t: 'So ', ms: 59000, out: 63000}, {t: 'a ', ms: 59190, out: 63000},
        {t: 'name ', ms: 59440, out: 63000}, {t: 'it ', ms: 59450, out: 63000},
        {t: 'flagged ', ms: 59580, out: 63000}, {t: 'three ', ms: 60130, out: 63000},
        {t: 'weeks ', ms: 60370, out: 63000}, {t: 'ago', ms: 60700, out: 63000},
        {t: 'That ', ms: 63000, out: 65000}, {t: 'goes ', ms: 63230, out: 65000},
        {t: 'in ', ms: 63460, out: 65000}, {t: 'the ', ms: 63710, out: 65000},
        {t: 'file ', ms: 63740, out: 65000}, {t: 'and ', ms: 63970, out: 65000},
        {t: 'the ', ms: 64140, out: 65000}, {t: 'agent ', ms: 64360, out: 65000},
        {t: 'learns', ms: 64600, out: 65000},
        {t: 'its ', ms: 65000}, {t: 'earnings ', ms: 65230}, {t: 'surprise', ms: 65840},
      ]},
      {size: 86, words: [
        {t: 'drops ', ms: 60900, out: 63000},
        {t: '15%', ms: 61230, out: 63000, color: RED, underline: 3301, furnMs: 61400},
        {t: 'weighting', ms: 66450, color: RED},
      ]},
      {size: 50, words: [
        {t: 'on ', ms: 61680, out: 63000}, {t: 'an ', ms: 61840, out: 63000},
        {t: 'earnings ', ms: 61940, out: 63000}, {t: 'miss.', ms: 62490, out: 63000},
        {t: 'was ', ms: 67000}, {t: 'too ', ms: 67090}, {t: 'aggressive ', ms: 67220},
        {t: 'for ', ms: 67490}, {t: 'that ', ms: 67580}, {t: 'sector.', ms: 67700},
      ]},
    ],
  },
  { // S8 the checker (ink) — second mascot slides in cropped at the right edge
    from: 68000, to: 78000, bg: INK, type: CREAM, top: true,
    rows: [
      {size: 54, words: [
        {t: 'Then ', ms: 68000, out: 73000}, {t: 'you ', ms: 68200, out: 73000},
        {t: 'add ', ms: 68370, out: 73000}, {t: 'a', ms: 68500, out: 73000},
        {t: 'Debt ', ms: 73000}, {t: 'it ', ms: 73250},
        {t: 'skipped, ', ms: 73340, ring: 3411, furnMs: 73400},
        {t: 'insiders ', ms: 73860}, {t: 'selling ', ms: 74380}, {t: 'into ', ms: 74740},
        {t: 'its ', ms: 74970}, {t: 'own ', ms: 75140}, {t: 'buy ', ms: 75310}, {t: 'signal, ', ms: 75480},
        {t: 'revenue ', ms: 76000}, {t: 'leaning ', ms: 76460}, {t: 'on ', ms: 76920},
        {t: 'one ', ms: 77050}, {t: 'customer.', ms: 77250},
      ]},
      {size: 86, words: [
        {t: 'checker,', ms: 68550, out: 73000, color: RED},
      ]},
      {size: 54, words: [
        {t: 'a ', ms: 69010, out: 73000}, {t: 'second ', ms: 69060, out: 73000}, {t: 'pass ', ms: 69480, out: 73000},
        {t: 'that ', ms: 69740, out: 73000}, {t: 'reads ', ms: 70000, out: 73000},
        {t: 'the ', ms: 70350, out: 73000}, {t: 'first ', ms: 70530, out: 73000},
        {t: "pass's ", ms: 70860, out: 73000},
        {t: 'picks', ms: 71270, out: 73000, strike: 3401, furnMs: 71330},
        {t: ' and ', ms: 71590, out: 73000}, {t: 'argues ', ms: 71790, out: 73000},
        {t: 'with ', ms: 72190, out: 73000}, {t: 'them.', ms: 72490, out: 73000},
      ]},
    ],
  },
  { // S9a the schedule (ink) — the big line leads, the clause follows below it
    from: 78000, to: 88000, bg: INK, type: CREAM, top: true,
    rows: [
      {size: 86, words: [
        {t: 'Monday ', ms: 81000}, {t: 'morning', ms: 81380},
      ]},
      {size: 54, words: [
        {t: 'To ', ms: 78000, out: 81000}, {t: 'automate ', ms: 78140, out: 81000},
        {t: 'it, ', ms: 78750, out: 81000}, {t: 'you ', ms: 79020, out: 81000},
        {t: 'put ', ms: 79200, out: 81000}, {t: 'the ', ms: 79410, out: 81000},
        {t: 'agent ', ms: 79620, out: 81000}, {t: 'on ', ms: 79970, out: 81000},
        {t: 'a ', ms: 80110, out: 81000}, {t: 'schedule.', ms: 80180, out: 81000},
        {t: 'it ', ms: 81830}, {t: 'pulls ', ms: 82020},
        {t: 'fresh ', ms: 82320}, {t: 'data, ', ms: 82590},
        {t: 'runs ', ms: 83060}, {t: 'your ', ms: 83230},
        {t: 'screens, ', ms: 83460},
        {t: 'checks ', ms: 84000}, {t: 'what ', ms: 84200},
        {t: 'changed ', ms: 84340}, {t: 'since ', ms: 84590},
        {t: 'last ', ms: 84710}, {t: 'week,', ms: 84840},
      ]},
      {size: 50, words: [
        {t: 'and ', ms: 85000}, {t: 'drops ', ms: 85230},
        {t: 'a ', ms: 85620}, {t: 'ranked ', ms: 85730},
        {t: 'watchlist ', ms: 86160}, {t: 'in ', ms: 86860},
        {t: 'your ', ms: 87050}, {t: 'vault.', ms: 87320},
      ]},
    ],
  },
  { // S9b the payoff (ink) — "judgement" is the big word, so it leads its line
    from: 88000, to: 93000, bg: INK, type: CREAM, top: true,
    rows: [
      {size: 54, words: [
        {t: 'After ', ms: 88000, out: 90000}, {t: 'a ', ms: 88270, out: 90000},
        {t: 'month, ', ms: 88320, out: 90000}, {t: 'the ', ms: 88840, out: 90000},
        {t: 'file ', ms: 88850, out: 90000}, {t: 'holds ', ms: 89060, out: 90000},
        {t: 'four ', ms: 89330, out: 90000}, {t: 'weeks.', ms: 89540, out: 90000},
        {t: 'After ', ms: 90000}, {t: 'three, ', ms: 90390}, {t: 'it ', ms: 90730},
        {t: 'knows ', ms: 90790}, {t: 'your ', ms: 91060},
      ]},
      {size: 86, words: [
        {t: 'judgement', ms: 91290, color: RED, underline: 3251, furnMs: 91400},
      ]},
      {size: 50, words: [
        {t: 'better ', ms: 91750}, {t: 'than ', ms: 92120}, {t: 'a ', ms: 92320},
        {t: 'new ', ms: 92370}, {t: 'hire.', ms: 92540},
      ]},
    ],
  },
  { // S10 the CTA build (ink) — what the guide contains
    from: 93000, to: 95500, bg: INK, type: CREAM,
    rows: [
      {size: 54, words: [
        {t: 'I ', ms: 93000}, {t: 'wrote ', ms: 93040}, {t: 'the ', ms: 93240},
        {t: 'whole ', ms: 93510}, {t: 'thing ', ms: 93590}, {t: 'up.', ms: 93830},
      ]},
      {size: 68, words: [
        {t: 'the ', ms: 94000}, {t: 'prompt,', ms: 94180},
        {t: ' the ', ms: 94670}, {t: 'scoring ', ms: 94850}, {t: 'framework,', ms: 95280},
      ]},
    ],
  },
  { // S11 end card (red flip through the matte wipe)
    from: 95500, to: 99520, bg: RED, type: CREAM,
    rows: [
      {size: 60, words: [
        {t: 'the ', ms: 96000, out: 97000}, {t: 'state ', ms: 96140, out: 97000},
        {t: 'file ', ms: 96430, out: 97000}, {t: 'schema.', ms: 96560, out: 97000},
        {t: 'comment', ms: 97000},
      ]},
      {size: 172, words: [
        {t: 'analyst', ms: 97430, underline: 3261, furnMs: 97500, furnColor: CREAM},
      ]},
      {size: 46, words: [
        {t: "and I'll ", ms: 97860}, {t: 'send ', ms: 98280}, {t: 'it ', ms: 98540},
        {t: 'to ', ms: 98650}, {t: 'you.', ms: 98770},
      ]},
    ],
  },
];

// ---- VIZ · the three tool plates (S2/S3, cream) ----------------------------
// NO.030 card-row language: hairline stroke, transparent fill, hard corners.
// Cards go to spent-grey once their tool has been spoken.
// Logos are the REAL full-colour marks, founder ruling 2026-08-06 (option B on
// out/no-032-logo-options.html). This is the first time anything outside the
// five-colour palette has been on screen in this system; the same ruling opened
// colour generally. Assets pulled from each project's own origin and vendored
// into vektor/public/images/logos/ so renders do not depend on the network.
// All three are transparent SVG. The first Firecrawl asset (the 180px
// apple-touch-icon) had an opaque white background baked in and rendered as a
// white square on the cream field -- use the real logo.svg, never a favicon.
// `box` normalises OPTICAL weight: a fixed 72px box makes the tall-narrow
// Obsidian gem read heavier than the wide-short Playwright masks.
const TOOLS = [
  {label: 'Firecrawl', logo: 'images/logos/firecrawl.svg', box: 66, inMs: 14000, spentMs: 19000},
  {label: 'Playwright', logo: 'images/logos/playwright.svg', box: 82, inMs: 19000, spentMs: 22000},
  {label: 'Obsidian MCP', logo: 'images/logos/obsidian.svg', box: 68, inMs: 22230, spentMs: 26000},
];
const ToolPlates: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(14000) || frame >= f(32000)) return null;
  return (
    <AbsoluteFill>
      {TOOLS.map((t, i) => {
        if (frame < f(t.inMs)) return null;
        const spent = frame >= f(t.spentMs);
        const col = spent ? GREY_C : INK;
        return (
          <div key={t.label} style={{position: 'absolute', left: 170, top: 780 + i * 148, width: 740, height: 116,
            border: `3px solid ${col}`, color: col, fontSize: 44, display: 'flex', alignItems: 'center',
            gap: 28, paddingLeft: 34, fontFamily: '"Printvetica", sans-serif'}}>
            {/* the mark keeps FULL colour even once the card goes spent-grey.
                Fading it to 50% read as a rendering fault rather than as
                "already covered", and the card's stroke plus its label already
                carry the spent state unambiguously. */}
            <div style={{width: 86, display: 'flex', justifyContent: 'center', flex: 'none'}}>
              <Img src={staticFile(t.logo)}
                style={{width: t.box, height: t.box, objectFit: 'contain'}} />
            </div>
            <span>{t.label}</span>
          </div>
        );
      })}
      {/* the prompt chip: types under the spent cards on "one prompt" */}
      {frame >= f(26640) && frame < f(32000) && (
        <div style={{position: 'absolute', left: 170, top: 1244, width: 740, height: 104, background: INK,
          color: CREAM, fontSize: 40, display: 'flex', alignItems: 'center', paddingLeft: 46,
          fontFamily: '"Printvetica", sans-serif'}}>
          {'> analyst.md'.slice(0, Math.max(0, Math.floor((frame - f(26640)) / 2)))}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- VIZ A · the weighting board (S4/S5, cream) ----------------------------
// Four factors across, three unnamed companies down. Cells tick in HARD on
// their spoken words, never a sweep, and every row fills in the SAME order --
// that repetition IS the argument for "scored the same way every single time".
// Rows are 01/02/03: no company is ever named, and no weight is ever labelled
// (illustrative shapes only, per canon).
const BOARD_X = 220, COL_W = 150, COL_GAP = 36;
const FACTORS = [
  {label: 'insider\nbuying', inMs: 34110, w: 118},
  {label: 'free cash\nflow', inMs: 35080, w: 94},
  {label: 'earnings\nsurprises', inMs: 36000, w: 150},
  {label: 'analyst\nsentiment', inMs: 37060, w: 70},
];
// scores: 1 = high (red), 0 = low (ghost). Identical fill ORDER, different values.
const SCORES = [
  [1, 1, 0, 1],
  [0, 1, 1, 0],
  [1, 0, 1, 1],
];
const ROW_MS = [40150, 41470, 42250]; // "each company" / "same way" / "single time"
const WeightBoard: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(34110) || frame >= f(47000)) return null;
  const colX = (i: number) => BOARD_X + i * (COL_W + COL_GAP);
  return (
    <AbsoluteFill>
      {FACTORS.map((fa, i) => {
        if (frame < f(fa.inMs)) return null;
        // weight bar grows on "carries a weight", decel, zero overshoot
        const g = decel((frame - f(39240)) / 12);
        return (
          <React.Fragment key={fa.label}>
            <div style={{position: 'absolute', left: colX(i), top: 700, width: COL_W, fontSize: 25,
              lineHeight: 1.15, color: INK, textAlign: 'center', whiteSpace: 'pre-line',
              fontFamily: '"Printvetica", sans-serif'}}>{fa.label}</div>
            {frame >= f(39240) && (
              <div style={{position: 'absolute', left: colX(i), top: 794, width: fa.w * g, height: 14,
                background: RED}} />
            )}
          </React.Fragment>
        );
      })}
      {SCORES.map((row, r) => row.map((v, c) => {
        const inF = f(ROW_MS[r]) + c * 4; // hard tick, left to right, same order every row
        if (frame < inF) return null;
        return (
          <div key={`${r}-${c}`} style={{position: 'absolute', left: colX(c), top: 870 + r * 92,
            width: COL_W, height: 74, background: v ? RED : 'rgba(16,16,16,0.16)'}} />
        );
      }))}
      {SCORES.map((_, r) => frame >= f(ROW_MS[r]) ? (
        <div key={`l${r}`} style={{position: 'absolute', left: 158, top: 890 + r * 92, fontSize: 26,
          color: GREY_C, fontFamily: '"Printvetica", sans-serif'}}>{`0${r + 1}`}</div>
      ) : null)}
    </AbsoluteFill>
  );
};

// ---- VIZ B · THE STATE FILE (S6-S9) — the hero, now in 3D ------------------
// The flat outlined-row ledger this replaced is gone: the founder approved the
// 3D slab stack on a real engine still (out/no-032-3d-slabs-v3.png) 2026-08-06.
// Geometry and motion live in KTState3D.tsx; the week detail moved into the
// type layer (S6 row 3), because the object now carries accumulation and the
// type carries meaning. Same division as every other viz beat in the film.
// ---- the weight strip returns for the payoff (S7, ink) ---------------------
// The board itself stays gone -- the state file holds -- but the four bars come
// back small at the foot of the frame so "its earnings surprise weighting was
// too aggressive" lands on a visible change: bar 3 shortens.
const WeightStrip: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(65230) || frame >= f(68000)) return null;
  const shrink = decel((frame - f(66450)) / 14);
  // Sits ABOVE the slab stack. Placement has now moved twice for the same
  // reason, so the number is derived rather than guessed: on this beat FIVE
  // weeks have arrived (49710/50530/51450/56350/59440), and a five-slab stack
  // based at 86% tops out near 59.5% of frame. y960/y1015 clears that by ~5.8%
  // and clears the caption block above by ~4.2%.
  // History: y1706 crossed the footer line; y1146 landed ON the slab face and
  // rendered cream-on-cream at 1.31:1 -- worse than the 2.85:1 it replaced.
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 220, top: 700, width: 710, fontSize: 26,
        color: CREAM, fontFamily: '"Printvetica", sans-serif'}}>earnings surprises</div>
      {/* bars were drawn at GREY_I (0.34 cream) = 2.85:1 on ink -- the data
          graphic this beat exists to show was functionally invisible. Cream at
          0.78 reads, and the changing bar goes red. */}
      {FACTORS.map((fa, i) => {
        const w = i === 2 ? fa.w - (fa.w - 78) * shrink : fa.w;
        const hot = i === 2 && frame >= f(66450);
        return (
          <div key={fa.label} style={{position: 'absolute', left: BOARD_X + i * (COL_W + COL_GAP), top: 755,
            width: w, height: 16, background: hot ? RED : 'rgba(244,239,223,0.78)'}} />
        );
      })}
    </AbsoluteFill>
  );
};

// ---- VIZ C · the checker's pass (S8, ink) ----------------------------------
// A second mascot SLIDES in cropped at the right edge (NO.031 f01 precedent --
// the only two-mascot frame in the film). Marks land on TYPE inside a row,
// never on a plate stroke: the data/commentary split holds.
const CheckerPass: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(68550) || frame >= f(78000)) return null;
  const inT = Math.min(1, (frame - f(68550)) / 12);
  const outT = Math.min(1, Math.max(0, (frame - f(77400)) / 10));
  const slideX = 300 * Math.pow(1 - inT, 3) + 340 * (1 - Math.pow(1 - outT, 3));
  return (
    <AbsoluteFill style={{['--fg' as any]: INK}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${slideX}px)`}}>
        <ClaudeMascot frames={KT_STATE_FRAMES}
          config={{pose: 'pop', xPct: 94, yPct: 62, size: 130, delay: f(68550),
            lookAt: {xPct: 46, yPct: 74}}} />
      </div>
      {/* The strike on "picks" and the ring on "skipped," are declared on the
          WORDS in S8, not drawn over the ledger. First pass hard-positioned them
          at y1520 and they cut straight through two row borders. */}
    </AbsoluteFill>
  );
};

// ---- the money device (hook, 4.1-5.4s) -------------------------------------
// "thousands of dollars" gets a hard-tick count: 40 marks landing one after
// another, no easing, no sweep. DELIBERATELY LABEL-FREE — the pay figure is the
// source creator's claim and has no verified source, so the film shows
// accumulation without ever asserting an amount on screen.
const TICKS = 40, TICK_W = 12, TICK_GAP = 6.67;
const MoneyTicks: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(4110) || frame >= f(5400)) return null;
  const shown = Math.min(TICKS, Math.floor((frame - f(4110)) / 0.82));
  return (
    <AbsoluteFill>
      {Array.from({length: shown}).map((_, i) => (
        <div key={i} style={{position: 'absolute', left: 170 + i * (TICK_W + TICK_GAP), top: 700,
          width: TICK_W, height: 26, background: RED}} />
      ))}
    </AbsoluteFill>
  );
};

// ---- hook cameo -----------------------------------------------------------
// Slides in from the LEFT and stands beside the screener board rather than on
// it: the board now owns the lower band, so the old centred yPct 68 placement
// would have put the mascot inside the geometry.
const HookCameo: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(900) || frame >= f(12000)) return null;
  const inT = Math.min(1, (frame - f(900)) / 12);
  const outT = Math.min(1, Math.max(0, (frame - f(11400)) / 8));
  // slides in from off-left, then leaves the same way
  const slideX = -380 * Math.pow(1 - inT, 3) - 420 * (1 - Math.pow(1 - outT, 3));
  // a second move: steps in toward the board on "screen stocks," (5.28s)
  const stepT = decel((frame - f(5280)) / 18);
  const step = frame >= f(5280) ? 46 * stepT : 0;
  return (
    <AbsoluteFill style={{['--fg' as any]: INK}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${slideX + step}px)`}}>
        <ClaudeMascot frames={KT_STATE_FRAMES}
          config={{pose: 'pop', xPct: 18, yPct: 62, size: 84, delay: f(900),
            react: {kind: 'gasp', atFrame: f(1560) - f(900)}, lookAt: {xPct: 52, yPct: 62}}} />
      </div>
    </AbsoluteFill>
  );
};

// ---- seams ----------------------------------------------------------------
// Matte wipe into the end card. Same MW constants as shipped NO.030 / NO.031:
// the blob is FULL-SCREEN on the cut frame, so it swallows the outgoing frame
// instead of fading across the seam.
const EndWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const T0 = f(95500) - MW.sweep;
  if (frame < T0 || frame >= T0 + 22) return null;
  const pos = (delay: number, fromX: number, toX: number, dur: number) => {
    const x = Math.min(1, Math.max(0, (frame - T0 - delay) / dur));
    return fromX + (toX - fromX) * easeIO(x);
  };
  const panel = (x: number, color: string, key: string, border?: string) => (
    <div key={key} style={{position: 'absolute', width: 2600, height: 2400, borderRadius: 400,
      left: 540 - 1300 + x, top: 960 - 1200, background: color,
      border: border ? `4px solid ${border}` : undefined}} />
  );
  return (
    <AbsoluteFill style={{overflow: 'hidden', zIndex: 5}}>
      {panel(pos(0, MW.park, MW.through, MW.sweep), CREAM, 'a1')}
      {panel(pos(MW.a2, MW.park, MW.through, MW.sweep), INK, 'a2', CREAM)}
      {panel(pos(MW.mainDelay, MW.mainFrom, 0, MW.mainDur), RED, 'main')}
    </AbsoluteFill>
  );
};

const ztri = (u: number) => { const w = u - Math.floor(u); return w < 0.5 ? 4 * w - 1 : 3 - 4 * w; };
const ZigzagState: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(96400)) return null;
  const t = frame - f(96400);
  const fade = Math.min(1, t / 10);
  const rows = [];
  for (let ri = 0; ri < 14; ri++) {
    rows.push(
      <div key={ri} style={{position: 'absolute', whiteSpace: 'nowrap', top: ri * 136 - 24,
        left: -700 + 260 * ztri(ri / 13 - t / 75), fontSize: 150, letterSpacing: 8,
        color: `rgba(244,239,223,${0.13 * fade})`, fontFamily: '"Printvetica", sans-serif'}}>
        vektor  vektor  vektor  vektor  vektor  vektor
      </div>
    );
  }
  return <AbsoluteFill style={{overflow: 'hidden'}}>{rows}</AbsoluteFill>;
};

// ---- composition ----------------------------------------------------------
export const KTState: React.FC = () => {
  const frame = useCurrentFrame();
  const state = STATES.find((s) => frame >= f(s.from) && frame < f(s.to)) ??
    (frame >= f(STATES[STATES.length - 1].from) ? STATES[STATES.length - 1] : STATES[0]);
  const inkFurniture = state.bg === CREAM;
  return (
    <AbsoluteFill style={{backgroundColor: state.bg, fontFamily: '"Printvetica", "Helvetica Neue", sans-serif'}}>
      <ZigzagState />
      {/* the 3D field goes BEHIND the type layer, not after it: a full-frame
          ThreeCanvas later in the tree would paint over the headline */}
      <ScreenerBoard3D />
      <SlabStack3D />
      <AbsoluteFill style={{alignItems: 'center',
        justifyContent: state.top ? 'flex-start' : 'center',
        flexDirection: 'column', rowGap: 30,
        padding: state.top ? '300px 150px 0' : '0 150px', textAlign: 'center'}}>
        {state.rows.map((row, ri) => (
          <div key={`${state.from}-${ri}`} style={{lineHeight: 1.14}}>
            {row.words.map((w, wi) => (
              <Word key={wi} w={w} base={row.size} baseColor={state.type} />
            ))}
          </div>
        ))}
      </AbsoluteFill>
      <HookCameo />
      <MoneyTicks />
      <ToolPlates />
      <WeightBoard />
      <WeightStrip />
      <CheckerPass />
      <EndWipe />
      {/* light furniture. letterSpacing is canon: americana-tokens.json +
          letterpress-tokens.json both specify Inter Tight / 600 / -0.045em /
          lower. (KTHook.tsx:768 still omits it and NO.030 shipped with it
          missing -- founder ruled leave that film alone, fix from 031 on.) */}
      <div style={{position: 'absolute', top: 52, left: 44, fontSize: 40, fontWeight: 600,
        letterSpacing: '-0.045em',
        color: inkFurniture ? INK : CREAM, fontFamily: '"Inter Tight", sans-serif'}}>vektor</div>
      <div style={{position: 'absolute', bottom: 72, left: 44, fontSize: 22, letterSpacing: 3,
        color: inkFurniture ? 'rgba(16,16,16,0.45)' : 'rgba(244,239,223,0.35)'}}>vektor /// the state file</div>
      <div style={{position: 'absolute', bottom: 72, right: 44, fontSize: 22, letterSpacing: 3,
        color: inkFurniture ? 'rgba(16,16,16,0.45)' : 'rgba(244,239,223,0.35)'}}>comment. analyst.</div>
    </AbsoluteFill>
  );
};
