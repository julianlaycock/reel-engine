// NO. 031 "TAX THE AGENTS" — 98.2s, built to the approved treatment sheet
// (out/no-031-treatment-proposal.html, founder-approved 2026-08-05) on the
// locked KT grammar. Every displayed word pops on its caption frame.
// Facts: the 5.9:1 bar ratio is FY2025 Treasury ($2,656B individual vs
// $452B corporate) — verified this session; no number renders beyond it.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {ClaudeMascot} from './scenes/ClaudeMascot';
import {INK, CREAM, RED, f, jit, useBucket, RoughRing, RoughStrike, Word, W} from './KTHook';
import './style.css';

const decel = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
const MW = {park: 3000, through: -3000, mainFrom: 2800, sweep: 16, a2: 3, mainDelay: 6, mainDur: 12};
const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const KT_TAX_FRAMES = f(98240);

// ---- states (text layer) ---------------------------------------------------
type Row = {size: number; words: W[]};
type S = {from: number; to: number; bg: string; type: string; top?: boolean; rows: Row[]};
const STATES: S[] = [
  { // S1 hook (ink) — three sentence phases, in-place surgery
    from: 140, to: 13360, bg: INK, type: CREAM,
    rows: [
      {size: 58, words: [
        {t: 'It ', ms: 140, out: 4000}, {t: 'matters ', ms: 190, out: 4000}, {t: 'that ', ms: 630, out: 4000},
        {t: 'you ', ms: 910, out: 4000}, {t: 'understand', ms: 1120, out: 4000},
        {t: 'Honestly, ', ms: 4000, out: 6640}, {t: 'it ', ms: 4670, out: 6640}, {t: 'matters', ms: 4800, out: 6640},
        {t: 'Because ', ms: 6640}, {t: 'conversations ', ms: 7030}, {t: 'about ', ms: 7750},
        {t: 'now ', ms: 10320}, {t: 'run ', ms: 10510}, {t: 'straight ', ms: 10700}, {t: 'through', ms: 11210},
      ]},
      {size: 76, words: [
        {t: 'how ', ms: 1830, out: 4000}, {t: 'AI ', ms: 2040, out: 4000}, {t: 'works,', ms: 2240, out: 4000},
        {t: 'more', ms: 5270, out: 6640, color: RED, size: 96},
        {t: 'policy, ', ms: 8020}, {t: 'culture, ', ms: 8610},
        {t: 'the ', ms: 11660}, {t: 'technical ', ms: 11850}, {t: 'details', ms: 12430},
      ]},
      {size: 58, words: [
        {t: 'even ', ms: 2750, out: 4000}, {t: 'if ', ms: 2950, out: 4000}, {t: 'you ', ms: 3090, out: 4000},
        {t: "don't like it.", ms: 3270, out: 4000, ring: 311, furnMs: 3900},
        {t: 'if ', ms: 5540, out: 6640}, {t: 'you ', ms: 5670, out: 6640}, {t: "don't ", ms: 5870, out: 6640},
        {t: 'like ', ms: 6200, out: 6640}, {t: 'it.', ms: 6450, out: 6640},
        {t: 'even ', ms: 9360}, {t: 'taxes, ', ms: 9690, underline: 313, furnMs: 9900},
        {t: 'of ', ms: 12880}, {t: 'AI.', ms: 12980},
      ]},
    ],
  },
  { // S2 setup (cream flip)
    from: 13360, to: 17740, bg: CREAM, type: INK,
    rows: [
      {size: 84, words: [
        {t: "Here's ", ms: 13360, out: 14640}, {t: 'one ', ms: 13750, out: 14640},
        {t: 'example.', ms: 13930, out: 14640, ring: 321, furnMs: 14100},
        {t: 'The ', ms: 14640, size: 48}, {t: 'second ', ms: 14850, size: 48}, {t: 'order ', ms: 15270, size: 48},
        {t: 'effect ', ms: 15680, size: 48}, {t: 'of ', ms: 16040, size: 48}, {t: 'AI', ms: 16180, size: 48},
      ]},
      {size: 72, words: [{t: 'automating ', ms: 16320}, {t: 'jobs', ms: 17020}]},
    ],
  },
  { // S3 the collapse (cream, top band; chart then desks below)
    from: 17740, to: 31120, bg: CREAM, type: INK, top: true,
    rows: [
      {size: 50, words: [
        {t: 'income ', ms: 17740, out: 19920}, {t: 'taxes ', ms: 18000, out: 19920}, {t: 'start ', ms: 18560, out: 19920},
        {t: 'disappearing.', ms: 18900, out: 19920, strike: 331, furnMs: 19250},
        {t: 'Income ', ms: 19920, out: 23520, size: 44}, {t: 'tax ', ms: 20340, out: 23520, size: 44},
        {t: 'brings ', ms: 20550, out: 23520, size: 44}, {t: 'in', ms: 20970, out: 23520, size: 44},
        {t: 'and ', ms: 23520, out: 25920, size: 44, color: CREAM}, {t: 'most ', ms: 23750, out: 25920, size: 44, color: CREAM},
        {t: 'of ', ms: 23950, out: 25920, size: 44, color: CREAM}, {t: 'it ', ms: 24070, out: 25920, size: 44, color: CREAM},
        {t: 'comes ', ms: 24190, out: 25920, size: 44, color: CREAM}, {t: 'from', ms: 24500, out: 25920, size: 44, color: CREAM},
        {t: 'So ', ms: 25920, out: 30020, size: 44}, {t: 'if ', ms: 26090, out: 30020, size: 44},
        {t: 'AI ', ms: 26200, out: 30020, size: 44}, {t: 'agents ', ms: 26340, out: 30020, size: 44},
        {t: 'replace ', ms: 26770, out: 30020, size: 44}, {t: 'those ', ms: 27270, out: 30020, size: 44}, {t: 'jobs,', ms: 27620, out: 30020, size: 44},
      ]},
      {size: 68, words: [
        {t: 'almost ', ms: 21110, out: 23520}, {t: 'six times ', ms: 21530, out: 23520, color: RED},
        {t: 'more', ms: 22090, out: 23520},
        {t: 'white ', ms: 24750, out: 25920, size: 56, color: CREAM}, {t: 'collar ', ms: 25050, out: 25920, size: 56, color: CREAM}, {t: 'work.', ms: 25430, out: 25920, size: 56, color: CREAM},
        {t: 'the ', ms: 28080, out: 30020, size: 40}, {t: "government's ", ms: 28320, out: 30020, size: 40},
        {t: 'biggest ', ms: 28910, out: 30020, size: 40}, {t: 'revenue ', ms: 29330, out: 30020, size: 40}, {t: 'source', ms: 29690, out: 30020, size: 40},
      ]},
      {size: 40, words: [
        {t: 'than ', ms: 22370, out: 23520}, {t: 'corporate ', ms: 22640, out: 23520}, {t: 'tax,', ms: 23280, out: 23520},
      ]},
    ],
  },
  { // S4 the idea (ink flip; diagram below)
    from: 31120, to: 43680, bg: INK, type: CREAM, top: true,
    rows: [
      {size: 46, words: [
        // spoken entirely under receipt 2, where captions are suppressed -- these
        // expire WITH the receipt so they never reappear after they were said
        {t: 'One ', ms: 31120, out: 34500}, {t: 'alternative ', ms: 31310, out: 34500}, {t: 'people ', ms: 32020, out: 34500},
        {t: 'are ', ms: 32430, out: 34500}, {t: 'seriously ', ms: 32590, out: 34500}, {t: 'discussing,', ms: 33170, out: 34500},
        {t: 'Hypothetically, ', ms: 37120, out: 39360, size: 44}, {t: 'it ', ms: 38210, out: 39360, size: 44},
        {t: 'works ', ms: 38290, out: 39360, size: 44}, {t: 'like ', ms: 38610, out: 39360, size: 44}, {t: 'this.', ms: 38870, out: 39360, size: 44},
        {t: 'For ', ms: 39360, size: 42}, {t: 'every ', ms: 39610, size: 42}, {t: 'agent ', ms: 39860, size: 42},
        {t: 'that ', ms: 40180, size: 42}, {t: 'replaces ', ms: 40410, size: 42}, {t: 'a ', ms: 40920, size: 42}, {t: 'person,', ms: 41060, size: 42},
      ]},
      {size: 56, words: [
        {t: 'instead ', ms: 33840, out: 37120}, {t: 'of ', ms: 34400, out: 37120}, {t: 'taxing ', ms: 34440, out: 37120}, {t: 'humans,', ms: 34860, out: 37120},
        {t: 'the ', ms: 41520, size: 48}, {t: 'government ', ms: 41730, size: 48},
        {t: 'takes a cut', ms: 42220, size: 56, color: RED, underline: 341, furnMs: 42600},
        {t: ' from the company.', ms: 42790, size: 48},
      ]},
      {size: 88, words: [
        {t: 'tax ', ms: 35540, out: 37120, color: RED}, {t: 'the ', ms: 35800, out: 37120, color: RED},
        {t: 'AI agents.', ms: 36020, out: 37120, color: RED, ring: 343, furnMs: 36400},
      ]},
    ],
  },
  { // S5 hole 1 (ink; panes below)
    from: 43680, to: 58320, bg: INK, type: CREAM, top: true,
    rows: [
      {size: 46, words: [
        {t: 'But ', ms: 43680, out: 45600}, {t: 'there ', ms: 43930, out: 45600}, {t: 'are ', ms: 44160, out: 45600}, {t: 'technical', ms: 44340, out: 45600},
        {t: 'First, ', ms: 45600, out: 50400, size: 42}, {t: 'an ', ms: 46390, out: 50400, size: 42},
        {t: 'AI ', ms: 46450, out: 50400, size: 42}, {t: 'agent ', ms: 46640, out: 50400, size: 42},
        {t: 'is, ', ms: 47110, out: 50400, size: 42}, {t: 'at ', ms: 47520, out: 50400, size: 42},
        {t: 'the ', ms: 47630, out: 50400, size: 42}, {t: 'end ', ms: 47800, out: 50400, size: 42},
        {t: 'of ', ms: 47970, out: 50400, size: 42}, {t: 'the ', ms: 48110, out: 50400, size: 42}, {t: 'day,', ms: 48250, out: 50400, size: 42},
        {t: 'And ', ms: 50400, out: 53120, size: 42}, {t: 'API ', ms: 50600, out: 53120, size: 42}, {t: 'calls ', ms: 50800, out: 53120, size: 42}, {t: 'are', ms: 51130, out: 53120, size: 42},
        {t: 'A ', ms: 53120, size: 42}, {t: 'company ', ms: 53340, size: 42}, {t: 'could ', ms: 53550, size: 42},
        {t: 'route ', ms: 53840, size: 42}, {t: 'them ', ms: 54090, size: 42}, {t: 'through', ms: 54320, size: 42},
      ]},
      {size: 60, words: [
        {t: 'a ', ms: 48650, out: 50400}, {t: 'bunch ', ms: 48740, out: 50400}, {t: 'of ', ms: 49160, out: 50400},
        {t: 'API ', ms: 49370, out: 50400}, {t: 'calls.', ms: 49610, out: 50400},
        {t: 'geographically ', ms: 51340, out: 53120, size: 52}, {t: 'flexible.', ms: 52310, out: 53120, size: 52, color: RED},
        {t: 'whatever ', ms: 54560, size: 48}, {t: 'country ', ms: 54940, size: 48}, {t: 'taxes ', ms: 55280, size: 48},
        {t: 'them ', ms: 55690, size: 48}, {t: 'least,', ms: 55960, size: 48},
      ]},
      {size: 48, words: [
        {t: 'or ', ms: 56320}, {t: 'just ', ms: 56540}, {t: 'relocate ', ms: 56800, color: RED}, {t: 'entirely.', ms: 57430},
      ]},
    ],
  },
  { // S6 hole 2 (ink; data-center viz below)
    from: 58320, to: 75840, bg: INK, type: CREAM, top: true,
    rows: [
      {size: 44, words: [
        {t: 'Second, ', ms: 58320, out: 63280}, {t: "there's ", ms: 58810, out: 63280}, {t: 'a ', ms: 59260, out: 63280},
        {t: 'real ', ms: 59320, out: 63280}, {t: 'chance ', ms: 59570, out: 63280}, {t: 'most ', ms: 60000, out: 63280},
        {t: 'AI ', ms: 60280, out: 63280}, {t: 'in ', ms: 60420, out: 63280}, {t: 'the ', ms: 60560, out: 63280}, {t: 'future', ms: 60770, out: 63280},
        {t: 'on ', ms: 63280, out: 65920, size: 46}, {t: 'open-weight ', ms: 63460, out: 65920, size: 46}, {t: 'models', ms: 64090, out: 65920, size: 46},
        {t: 'And ', ms: 65920, out: 68640, size: 42}, {t: 'that ', ms: 66130, out: 68640, size: 42}, {t: 'makes ', ms: 66390, out: 68640, size: 42}, {t: 'usage', ms: 66730, out: 68640, size: 42},
        {t: 'because ', ms: 68640, size: 40}, {t: "there's ", ms: 69000, size: 40}, {t: 'no ', ms: 69360, size: 40},
        {t: 'shared ', ms: 69460, size: 40}, {t: 'surface', ms: 69790, size: 40},
      ]},
      {size: 58, words: [
        {t: 'runs ', ms: 61200, out: 63280}, {t: 'locally,', ms: 61540, out: 63280, ring: 361, furnMs: 61900},
        {t: 'instead ', ms: 64470, out: 65920, size: 44}, {t: 'of ', ms: 64920, out: 65920, size: 44},
        {t: 'in ', ms: 65040, out: 65920, size: 44}, {t: 'the ', ms: 65160, out: 65920, size: 44}, {t: 'cloud.', ms: 65350, out: 65920, size: 44},
        {t: 'almost ', ms: 67080, out: 68640, size: 52}, {t: 'impossible ', ms: 67470, out: 68640, size: 52},
        {t: 'to ', ms: 68170, out: 68640, size: 52}, {t: 'track,', ms: 68270, out: 68640, size: 52, strike: 363, furnMs: 68450},
        {t: 'like ', ms: 70160, size: 44}, {t: 'a ', ms: 70430, size: 44}, {t: 'data ', ms: 70510, size: 44},
        {t: 'center ', ms: 70780, size: 44}, {t: 'left ', ms: 71180, size: 44}, {t: 'to ', ms: 71490, size: 44},
        {t: 'monitor.', ms: 71580, size: 44, color: RED},
      ]},
      {size: 44, words: [
        {t: 'on ', ms: 62160, out: 63280}, {t: 'your ', ms: 62330, out: 63280}, {t: 'own ', ms: 62550, out: 63280}, {t: 'device,', ms: 62740, out: 63280},
        {t: 'This ', ms: 72320, size: 42}, {t: 'barely ', ms: 72570, size: 42}, {t: 'scratches ', ms: 72940, size: 42},
        {t: 'the ', ms: 73500, size: 42}, {t: 'surface. ', ms: 73680, size: 42},
        {t: 'But ', ms: 74320, size: 42}, {t: 'it ', ms: 74580, size: 42}, {t: 'shows ', ms: 74600, size: 42},
        {t: 'something ', ms: 74850, size: 42}, {t: 'bigger.', ms: 75330, size: 46, color: RED},
      ]},
    ],
  },
  { // S7 thesis — RED act via blob wipe covering at "impossible"
    from: 75840, to: 87120, bg: RED, type: CREAM,
    rows: [
      {size: 72, words: [
        {t: 'impossible ', ms: 76540, chaos: true, out: 80960}, {t: 'to ', ms: 77130, out: 80960}, {t: 'separate', ms: 77260, out: 80960},
        {t: 'If ', ms: 80960, size: 44}, {t: 'we ', ms: 81180, size: 44}, {t: 'want ', ms: 81180, size: 44},
        {t: 'to ', ms: 81400, size: 44}, {t: 'steer ', ms: 81510, size: 44}, {t: 'this ', ms: 81790, size: 44},
        {t: 'in ', ms: 82000, size: 44}, {t: 'the ', ms: 82110, size: 44}, {t: 'right ', ms: 82270, size: 44}, {t: 'direction,', ms: 82550, size: 44},
      ]},
      {size: 48, words: [
        {t: 'policy ', ms: 77880, out: 80960}, {t: 'and ', ms: 78160, out: 80960}, {t: 'ethics ', ms: 78370, out: 80960},
        {t: 'from ', ms: 78800, out: 80960}, {t: 'the', ms: 79000, out: 80960},
        {t: 'we ', ms: 83330, size: 44}, {t: 'should ', ms: 83400, size: 44}, {t: 'not ', ms: 83720, size: 44},
        {t: 'only ', ms: 83910, size: 44}, {t: 'let', ms: 84170, size: 44},
      ]},
      {size: 54, words: [
        {t: 'technical ', ms: 79120, out: 80960}, {t: 'mechanics ', ms: 79600, out: 80960},
        {t: 'of ', ms: 80360, out: 80960}, {t: 'AI.', ms: 80530, out: 80960},
        {t: 'AI-pilled ', ms: 84360, size: 58}, {t: 'tech bros', ms: 84920, size: 58, strike: 371, furnMs: 85600, furnColor: CREAM},
      ]},
      {size: 44, words: [
        {t: 'have ', ms: 85440}, {t: 'these ', ms: 85700}, {t: 'conversations.', ms: 86020},
      ]},
    ],
  },
  { // S8 the tease (ink flip)
    from: 87120, to: 93680, bg: INK, type: CREAM,
    rows: [
      {size: 44, words: [
        {t: 'I ', ms: 87120, out: 90400}, {t: 'have ', ms: 87320, out: 90400}, {t: 'a ', ms: 87370, out: 90400},
        {t: 'lot ', ms: 87420, out: 90400}, {t: 'of ', ms: 87570, out: 90400}, {t: 'thoughts ', ms: 87670, out: 90400},
        {t: 'on ', ms: 88080, out: 90400}, {t: 'how ', ms: 88200, out: 90400}, {t: 'we ', ms: 88390, out: 90400}, {t: 'avoid', ms: 88510, out: 90400},
        {t: 'But ', ms: 90400, size: 46}, {t: 'that ', ms: 90650, size: 46}, {t: 'is ', ms: 90820, size: 46},
        {t: 'for ', ms: 90940, size: 46}, {t: 'another ', ms: 91120, size: 46}, {t: 'video.', ms: 91540, size: 46},
      ]},
      {size: 60, words: [
        {t: 'a ', ms: 88830, out: 90400}, {t: 'fiscal ', ms: 88890, out: 90400, color: RED},
        {t: 'collapse ', ms: 89280, out: 90400, color: RED}, {t: 'with ', ms: 89800, out: 90400}, {t: 'AI.', ms: 90030, out: 90400},
        {t: 'Follow', ms: 92080, size: 64, ring: 381, furnMs: 92400},
        {t: ' so ', ms: 92460, size: 44}, {t: 'you ', ms: 92580, size: 44}, {t: "don't ", ms: 92770, size: 44},
        {t: 'miss ', ms: 93080, size: 44}, {t: 'it.', ms: 93320, size: 44},
      ]},
    ],
  },
  { // S9 end card (red via matte-wipe cover at 93680)
    from: 93680, to: 98240, bg: RED, type: CREAM,
    rows: [
      {size: 60, words: [{t: 'comment', ms: 93680}]},
      {size: 150, words: [{t: 'tax', ms: 94190, underline: 391, furnMs: 94500, furnColor: CREAM}]},
      {size: 38, words: [
        {t: "and I'll send you ", ms: 94560, color: 'rgba(244,239,223,0.9)'},
        {t: 'the full breakdown with sources ', ms: 95480, color: 'rgba(244,239,223,0.9)'},
        {t: 'in your DMs.', ms: 96610, color: 'rgba(244,239,223,0.9)'},
      ]},
    ],
  },
];

// source receipt: real page screenshot held STATIC and FULL BLEED -- no pan, no
// zoom, no bars, NO SCRIM (founder, 2026-08-05: a scrim "subtracts clarity"). The
// capture itself is the framing: it is scaled to cover 1080x1920 and centred, so a
// 9:16 capture loses nothing and any other aspect is centre-cropped. Nothing is
// drawn over it -- captions and the wordmark are suppressed for the beat (see
// onReceipt) so the source reads clean. Cuts in and out on exact word frames --
// the seam law applies to receipts too.
const Receipt: React.FC<{src: string; inMs: number; outMs: number;
  imgH: number; imgW?: number; offsetY?: number}> =
  ({src, inMs, outMs, imgH, imgW = 800, offsetY = 0}) => {
  const frame = useCurrentFrame();
  if (frame < f(inMs) || frame >= f(outMs)) return null;
  const sc = Math.max(1080 / imgW, 1920 / imgH);
  const w = imgW * sc, h = imgH * sc;
  // TOP-anchored, not centred: a centred cover-crop pushed the page up by half the
  // overflow and drove the source's headline under the wordmark plate, leaving
  // sliced glyph stubs against its lower edge. Anchoring at 0 puts the plate over
  // the page's own nav strip and keeps the headline whole, as draft 3 framed it.
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(src)} style={{position: 'absolute',
        width: w, height: h, left: (1080 - w) / 2, top: offsetY}} />
    </AbsoluteFill>
  );
};

// The two source receipts, in one place: the furniture colour logic below reads
// the same list, so a window can never drift out of sync with the image it gates.
const RECEIPTS = [
  // offsetY lifts the page so the plate covers this site's masthead WHOLE -- at 0
  // the plate's lower edge cut through the "TAX FOUNDATION" lockup and left sliced
  // capitals sitting against it. Nothing of the article is lost; only the site's
  // own header goes under the plate.
  {src: 'images/no-031/receipt-taxfoundation.png', inMs: 23520, outMs: 25920, imgW: 800, imgH: 1660, offsetY: -34},
  {src: 'images/no-031/receipt-wef.png', inMs: 31120, outMs: 34500, imgW: 800, imgH: 1610},
];
// A receipt covers the beat's own field with a dark ink scrim, so the furniture
// must be keyed to the SCRIM, not to state.bg. Without this the wordmark/footer
// flip polarity across the cut -- dark glyphs on the cream-state receipt, light
// glyphs on the ink-state one, over the same grey page.
const onReceipt = (frame: number) =>
  RECEIPTS.some((r) => frame >= f(r.inMs) && frame < f(r.outMs));
// Backing plate for the wordmark on receipt beats. Sized to hold the mark at its
// normal position (top 52, 40px) with margin -- NOT the letterpress chromeBar,
// which is canonized at 330px and would drag the wordmark down to a baseline 32px
// off its lower edge, i.e. a different position on receipt beats than everywhere
// else. Founder call pending on which of the two this should be.
const RECEIPT_PLATE_H = 148;

// ---- beat visuals ----------------------------------------------------------
// smash-drop word (the "collapse." / "problems." device from the sheet)
const DropWord: React.FC<{text: string; ms: number; outMs: number; y: number; size: number; color?: string}> =
  ({text, ms, outMs, y, size, color = RED}) => {
  const frame = useCurrentFrame();
  if (frame < f(ms) || frame >= f(outMs)) return null;
  const t = frame - f(ms);
  const py = t >= 6 ? 0 : t <= 4 ? -900 * (1 - decel(t / 4)) - 36 * decel(t / 4) * 0 : 0;
  const overshoot = t === 4 || t === 5 ? -14 : 0;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center',
      transform: `translateY(${t < 4 ? -900 * (1 - decel(t / 4)) : overshoot}px)`,
      fontSize: size, color, fontFamily: '"Printvetica", sans-serif'}}>{text}</div>
  );
};

// S3a: the 5.9:1 bar chart (verified FY2025) — bars grow on their words
const TaxBars: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(19920) || frame >= f(23520)) return null;
  const g1 = decel((frame - f(19920)) / 16); // income bar grows with its words
  const g2 = decel((frame - f(22640)) / 10); // corporate bar on "corporate"
  const H1 = 520 * g1, H2 = 88 * (frame >= f(22640) ? g2 : 0);
  const label = (x: number, y: number, txt: string, color: string, inF: number) =>
    frame >= inF ? (
      <div style={{position: 'absolute', left: x, top: y, width: 220, textAlign: 'center',
        fontSize: 34, color, fontFamily: '"Printvetica", sans-serif'}}>{txt}</div>
    ) : null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0}}>
      <div style={{position: 'absolute', left: 300, top: 1560 - H1, width: 200, height: H1, background: RED}} />
      <div style={{position: 'absolute', left: 590, top: 1560 - H2, width: 200, height: H2, background: 'rgba(16,16,16,0.4)'}} />
      <div style={{position: 'absolute', left: 150, right: 150, top: 1560, height: 6, background: INK}} />
      {label(290, 985, '$2,656B', RED, f(19920) + 16)}
      {label(580, 1418, '$452B', INK, f(22640) + 10)}
    </div>
  );
};

// S3b: five desk-agents, struck and erased as agents replace the jobs
const DeskAgents: React.FC = () => {
  const frame = useCurrentFrame();
  const b = useBucket();
  if (frame < f(25920) || frame >= f(31120)) return null;
  const xs = [150, 330, 510, 690, 870];
  return (
    <AbsoluteFill style={{['--fg' as any]: INK}}>
      {xs.map((x, i) => {
        const inF = f(25920) + i * 3;
        const strikeF = f(26770) + i * 18; // erased one by one as "replace those jobs," lands
        const goneF = strikeF + 14;
        if (frame < inF || frame >= goneF) return null;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: x, top: 1330, width: 120, height: 14, background: INK}} />
            <ClaudeMascot frames={KT_TAX_FRAMES}
              config={{pose: 'pop', xPct: ((x + 60) / 1080) * 100, yPct: 66, size: 86,
                delay: inF, lookAt: {xPct: 50, yPct: 40}}} />
            {frame >= strikeF && (
              <div style={{position: 'absolute', left: x - 10, top: 1210, width: 140, height: 130}}>
                <RoughStrike seed={401 + i} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// S4: company -> agent -> state diagram with the coin hop on "takes a cut"
const LevyDiagram: React.FC = () => {
  const frame = useCurrentFrame();
  const b = useBucket();
  if (frame < f(34500) || frame >= f(43680)) return null;
  const plate = (x: number, label: string, inMs: number) => frame >= f(inMs) ? (
    <div style={{position: 'absolute', left: x, top: 1180, width: 250, height: 110, background: INK,
      border: `3px solid ${CREAM}`, color: CREAM, fontSize: 34, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: '"Printvetica", sans-serif'}}>{label}</div>
  ) : null;
  const arrow = (x1: number, inMs: number, k: number) => {
    if (frame < f(inMs)) return null;
    const d = decel((frame - f(inMs)) / 8); // draws on, decel, no overshoot
    const x2 = x1 + 92 * d;
    return (
      <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} viewBox="0 0 1080 1920">
        <line x1={x1} y1={1235 + jit(411 + k, b, 1) * 3} x2={x2} y2={1235 + jit(413 + k, b, 2) * 3}
          stroke={CREAM} strokeWidth={7} strokeLinecap="round" />
        {d > 0.9 && <polyline points={`${x1 + 76},${1221} ${x1 + 94},${1235} ${x1 + 76},${1249}`} fill="none"
          stroke={CREAM} strokeWidth={7} strokeLinecap="round" />}
      </svg>
    );
  };
  // the coin: hops company -> over the agent -> state on "takes a cut" (42220-43090)
  const ct = decel((frame - f(42220)) / 22);
  const coinX = 175 + 640 * ct;
  const coinY = 1140 - Math.sin(ct * Math.PI) * 190;
  return (
    <AbsoluteFill style={{['--fg' as any]: INK}}>
      {plate(60, 'the company', 34500)}
      {arrow(318, 37120, 1)}
      {frame >= f(35540) && (
        <ClaudeMascot frames={KT_TAX_FRAMES}
          config={{pose: 'pop', xPct: 50, yPct: 64.5, size: 96, delay: f(35540), lookAt: {xPct: 50, yPct: 40}}} />
      )}
      {arrow(620, 39360, 2)}
      {plate(770, 'the state', 39860)}
      {frame >= f(42220) && frame < f(43680) && (
        <div style={{position: 'absolute', left: coinX, top: coinY, width: 52, height: 52, borderRadius: '50%',
          background: RED, color: CREAM, fontSize: 32, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: '"Printvetica", sans-serif'}}>$</div>
      )}
    </AbsoluteFill>
  );
};

// S5: API-call chips sliding from the taxed plate to the low-tax plate
const ReroutePanes: React.FC = () => {
  const frame = useCurrentFrame();
  const b = useBucket();
  if (frame < f(46390) || frame >= f(58320)) return null;
  const plate = (x: number, big: boolean, inMs: number) => frame >= f(inMs) ? (
    <div style={{position: 'absolute', left: x, top: 1160, width: 300, height: 150, background: INK,
      border: `3px solid ${CREAM}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <span style={{color: RED, fontSize: big ? 74 : 34, fontFamily: '"Printvetica", sans-serif',
        transform: `rotate(${jit(421, b, 1) * 4}deg)`, display: 'inline-block'}}>$</span>
    </div>
  ) : null;
  const chips = [0, 1, 2, 3, 4].map((i) => {
    const inF = f(48650) + i * 4;
    if (frame < inF) return null;
    const mt = decel((frame - f(53840) - i * 8) / 16);
    const x = 120 + 40 + i * 48 + (frame >= f(53840) + i * 8 ? (660 - i * 20) * mt : 0);
    return (
      <div key={i} style={{position: 'absolute', left: x, top: 1105, width: 42, height: 30,
        background: RED}} />
    );
  });
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {plate(120, true, 46390)}
      {plate(660, false, 53120)}
      {chips}
    </div>
  );
};

// S6: the data center eaten away; the agents scatter to the corners
const NoSurface: React.FC = () => {
  const frame = useCurrentFrame();
  const b = useBucket();
  if (frame < f(59570) || frame >= f(75840)) return null;
  const eat = Math.min(1, Math.max(0, (frame - f(69460)) / 64)); // LINEAR munch, completes on 'monitor'
  const corners = [{x: 8, y: 80}, {x: 84, y: 80}, {x: 8, y: 40}, {x: 84, y: 40}, {x: 46, y: 86}];
  return (
    <AbsoluteFill style={{['--fg' as any]: INK}}>
      {eat < 1 && (
        <div style={{position: 'absolute', left: 390, top: 1150, width: 300, height: 170, background: INK,
          border: `3px solid ${CREAM}`, clipPath: `inset(0 ${Math.min(100, eat * 100 + jit(451, b, 1) * 2)}% 0 0)`,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: 18}}>
          {Array.from({length: 8}).map((_, i) => (
            <div key={i} style={{background: jit(441 + i, b, i) > 0.22 ? RED : 'rgba(244,239,223,0.35)'}} />
          ))}
        </div>
      )}
      {corners.map((c, i) => {
        const st = decel((frame - f(69000) - i * 2) / 10);
        const starts = [{x: 28, y: 57}, {x: 40, y: 54}, {x: 52, y: 57}, {x: 64, y: 54}, {x: 46, y: 51}];
        const startX = starts[i].x, startY = starts[i].y;
        const x = frame < f(69000) ? startX : startX + (c.x - startX) * st;
        const y = frame < f(69000) ? startY : startY + (c.y - startY) * st;
        if (frame < f(61200) + i * 3) return null;
        return <ClaudeMascot key={i} frames={KT_TAX_FRAMES}
          config={{pose: 'pop', xPct: x, yPct: y, size: 74, delay: f(61200) + i * 3,
            lookAt: {xPct: 50, yPct: 62}}} />;
      })}
      {frame >= f(71580) && (
        <div style={{position: 'absolute', left: 420, top: 1140, width: 240, height: 190}}>
          <RoughRing seed={431} color={'rgba(231,55,26,0.55)'} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// matte-wipe into THE IDEA (cream->ink pivot, covers on "One", 31120)
const IdeaWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const T0 = f(31120) - MW.sweep;
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
      {panel(pos(0, MW.park, MW.through, MW.sweep), RED, 'a1')}
      {panel(pos(MW.a2, MW.park, MW.through, MW.sweep), CREAM, 'a2')}
      {panel(pos(MW.mainDelay, MW.mainFrom, 0, MW.mainDur), INK, 'main')}
    </AbsoluteFill>
  );
};

// the PROBLEMS stab: a red blob swells under "problems.", holds, retreats
const ProblemsBlob: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(44480) || frame >= f(46080)) return null;
  const grow = easeIO(Math.min(1, (frame - f(44480)) / 12));
  const shrink = frame >= f(45600) ? easeIO(Math.min(1, (frame - f(45600)) / 14)) : 0;
  const r = 2700 * grow * (1 - shrink);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: r, height: r, borderRadius: '50%', background: RED}} />
    </AbsoluteFill>
  );
};

// blob wipe into the red thesis act (covers exactly at "impossible", 76540)
const ThesisWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const T0 = f(76540) - 16;
  if (frame < T0 || frame >= f(76540) + 3) return null;
  const t = easeIO(Math.min(1, (frame - T0) / 16));
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{width: 2700 * t, height: 2700 * t, borderRadius: '50%', background: RED}} />
    </AbsoluteFill>
  );
};

// matte-wipe into the end card (cover on the spoken "Comment", 93680)
const EndWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const T0 = f(93680) - MW.sweep;
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
const ZigzagTax: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(94800)) return null;
  const t = frame - f(94800);
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

// hook cameo: slides in centered, gasps at "even if you don't like it"
const HookCameo: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(1000) || frame >= f(13360)) return null;
  const inT = Math.min(1, (frame - f(1000)) / 10);
  const outT = Math.min(1, Math.max(0, (frame - f(12700)) / 8));
  const slideX = 420 * Math.pow(1 - inT, 3) + 460 * (1 - Math.pow(1 - outT, 3));
  return (
    <AbsoluteFill style={{['--fg' as any]: INK}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${slideX}px)`}}>
        <ClaudeMascot frames={KT_TAX_FRAMES}
          config={{pose: 'pop', xPct: 50, yPct: 68, size: 170, delay: f(1000),
            react: {kind: 'gasp', atFrame: f(2750) - f(1000)}, lookAt: {xPct: 50, yPct: 48}}} />
      </div>
    </AbsoluteFill>
  );
};

// tease cameo, small, watching "Follow"
const TeaseCameo: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < f(90400) || frame >= f(93680)) return null;
  const inT = Math.min(1, (frame - f(90400)) / 8);
  return (
    <AbsoluteFill style={{['--fg' as any]: INK}}>
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${300 * Math.pow(1 - inT, 3)}px)`}}>
        <ClaudeMascot frames={KT_TAX_FRAMES}
          config={{pose: 'pop', xPct: 76, yPct: 66, size: 96, delay: f(90400),
            react: {kind: 'celebrate', atFrame: f(92080) - f(90400)}, lookAt: {xPct: 44, yPct: 44}}} />
      </div>
    </AbsoluteFill>
  );
};

export const KTTax: React.FC = () => {
  const frame = useCurrentFrame();
  const state = STATES.find((s) => frame >= f(s.from) && frame < f(s.to)) ??
    (frame >= f(STATES[STATES.length - 1].from) ? STATES[STATES.length - 1] : STATES[0]);
  const receiptUp = onReceipt(frame);
  const inkFurniture = state.bg === CREAM && !receiptUp;
  return (
    <AbsoluteFill style={{backgroundColor: state.bg, fontFamily: '"Printvetica", "Helvetica Neue", sans-serif'}}>
      <ZigzagTax />
      {RECEIPTS.map((r) => <Receipt key={r.src} {...r} />)}
      {!receiptUp && <AbsoluteFill style={{alignItems: 'center',
        justifyContent: state.top ? 'flex-start' : 'center',
        flexDirection: 'column', rowGap: 34,
        padding: state.top ? '640px 150px 0' : '0 150px', textAlign: 'center'}}>
        {state.rows.map((row, ri) => (
          <div key={`${state.from}-${ri}`} style={{lineHeight: 1.14}}>
            {row.words.map((w, wi) => (
              <Word key={wi} w={w} base={row.size} baseColor={state.type} />
            ))}
          </div>
        ))}
      </AbsoluteFill>}
      <HookCameo />
      <TaxBars />
      <DeskAgents />
      <DropWord text="collapse." ms={30460} outMs={31120} y={880} size={150} />
      <ProblemsBlob />
      <DropWord text="problems." ms={44880} outMs={45600} y={880} size={130} color={CREAM} />
      <LevyDiagram />
      <ReroutePanes />
      <NoSurface />
      <IdeaWipe />
      <ThesisWipe />
      <TeaseCameo />
      <EndWipe />
      {/* light furniture. On a receipt beat the wordmark sits on a solid ink plate
          (founder, 2026-08-05) so the mark stays visible over the source page
          without covering the page's own headline. The mark does NOT move between
          beats -- only the plate appears -- so its position stays continuous.
          letterSpacing is canon: americana-tokens.json + letterpress-tokens.json
          both specify Inter Tight / 600 / -0.045em / lower. */}
      {receiptUp && <div style={{position: 'absolute', top: 0, left: 0, right: 0,
        height: RECEIPT_PLATE_H, background: '#0A0A0A'}} />}
      <div style={{position: 'absolute', top: 52, left: 44, fontSize: 40, fontWeight: 600,
        letterSpacing: '-0.045em',
        color: inkFurniture ? INK : CREAM, fontFamily: '"Inter Tight", sans-serif'}}>vektor</div>
      {/* footers are HIDDEN on receipt beats (founder, 2026-08-05): unscrimmed they
          fell to 1.04:1 on a white page -- drawn but unreadable, and sitting on the
          source's own body copy. Only the wordmark plate carries the brand there. */}
      {!receiptUp && (
        <>
          <div style={{position: 'absolute', bottom: 72, left: 44, fontSize: 22, letterSpacing: 3,
            color: inkFurniture ? 'rgba(16,16,16,0.45)' : 'rgba(244,239,223,0.35)'}}>vektor /// tax the agents</div>
          <div style={{position: 'absolute', bottom: 72, right: 44, fontSize: 22, letterSpacing: 3,
            color: inkFurniture ? 'rgba(16,16,16,0.45)' : 'rgba(244,239,223,0.35)'}}>comment. tax.</div>
        </>
      )}
    </AbsoluteFill>
  );
};
