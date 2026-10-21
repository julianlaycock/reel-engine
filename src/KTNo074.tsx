// NO. 074 "Graph" — KT TRIAL ARM (ADR 0007, vektor-kt-trial, 2026-10-21).
// The SAME film as the shipping Vektor OS arm A: same script, same captions timings, same opening words, same runtime
// (61.600 s). Only the picture differs. The audio is NOT in this composition: the arm-A IG master's audio stream is
// muxed on afterwards (-c:a copy), so voice, bed and loudness are byte-identical.
//
// Look: the shipped KT grammar from KTStack / KTHook (ONE implementation, imported): ink / cream / red fields that
// flip on a MatteWipe at beat seams, Printvetica words that pop on their caption frame, rough ring / underline marks,
// wordmark at y240, footer slugs at y1372 (kt-tokens footer.y). One film-local plate: the box-and-arrow graph that the
// script describes (beats "Every step is its own box ... each arrow is a rule"), built from the same primitives
// the shipped plates use (hairline strokes, field-aware colour). Everything cuts on exact frames.
// Safe zone x150-930 / y220-1420 is a build constraint: the plate is laid out inside it.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f, Word} from './KTHook';
import {NO074_BEATS, NO074_END_MS, NO074_CUES} from './KTNo074Words';
import {MatteWipe} from './KTSeams';
import './style.css';

export const KT_NO074_FRAMES = f(NO074_END_MS);

const FONT = '"Printvetica", "Helvetica Neue", sans-serif';
const FONT_UI = '"Inter Tight", sans-serif';

const L = 150, W = 780;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const prog = (frame: number, atMs: number, durMs: number) =>
  clamp01((frame - f(atMs)) / Math.max(1, f(durMs)));

// ---- the graph plate ---------------------------------------------------------
// Three boxes in a chain (plan -> build -> check), a stop mark on the last, a retry arrow back under the chain,
// and a "you" box the chain hands back to. Mounted 33.0 s .. 46.6 s, i.e. beats 9-11.
const PLATE_FROM = 33063, PLATE_TO = 46637;
const BY = 900, BH = 130, BW = 200;                 // box row
const BX = [L, L + 290, L + 580];                    // x of the three boxes (200 wide, 90 gaps)
const LABELS = ['plan', 'build', 'check'];

const Box: React.FC<{x: number; y: number; label: string; fg: string; atMs: number; accent?: boolean; loop?: boolean; loopMs?: number}> =
  ({x, y, label, fg, atMs, accent, loop, loopMs = 0}) => {
    const frame = useCurrentFrame();
    if (frame < f(atMs)) return null;
    const lp = loop ? prog(frame, loopMs, 400) : 0;
    return (
      <div style={{position: 'absolute', left: x, top: y, width: BW, height: BH, boxSizing: 'border-box',
        border: `5px solid ${accent ? RED : fg}`, borderRadius: 18, display: 'flex',
        alignItems: 'center', justifyContent: 'center', color: fg, fontSize: 44, fontFamily: FONT}}>
        {label}
        {loop && lp > 0 ? (
          // a small circular arrow in the box corner: "a loop runs inside every box"
          <svg width="56" height="56" viewBox="0 0 56 56" style={{position: 'absolute', right: 10, top: -34,
            background: 'transparent', overflow: 'visible'}}>
            <path d="M 46 28 A 18 18 0 1 1 28 10" fill="none" stroke={RED} strokeWidth="6" strokeLinecap="round"
              strokeDasharray="100" strokeDashoffset={100 * (1 - lp)} />
            <polyline points="20,2 30,10 20,18" fill="none" stroke={RED} strokeWidth="6" strokeLinecap="round"
              strokeLinejoin="round" opacity={lp > 0.9 ? 1 : 0} />
          </svg>
        ) : null}
      </div>
    );
  };

// a straight arrow drawn on over `durMs`
const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; color: string; atMs: number; durMs?: number}> =
  ({x1, y1, x2, y2, color, atMs, durMs = 300}) => {
    const frame = useCurrentFrame();
    if (frame < f(atMs)) return null;
    const p = clamp01((frame - f(atMs)) / f(durMs));
    const ex = x1 + (x2 - x1) * p, ey = y1 + (y2 - y1) * p;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const hx = (a: number) => ex - Math.cos(ang + a) * 26, hy = (a: number) => ey - Math.sin(ang + a) * 26;
    return (
      <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth="6" strokeLinecap="round" />
        {p > 0.85 ? (
          <polyline points={`${hx(0.5)},${hy(0.5)} ${ex},${ey} ${hx(-0.5)},${hy(-0.5)}`} fill="none" stroke={color}
            strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
      </svg>
    );
  };

const GraphPlate: React.FC<{fg: string}> = ({fg}) => {
  const frame = useCurrentFrame();
  const ms = (frame / 30) * 1000;
  if (ms < PLATE_FROM || ms >= PLATE_TO) return null;
  const C = NO074_CUES;
  const midY = BY + BH / 2;
  const retry = prog(frame, C.retry, 600);
  const RY = BY + BH + 90;                              // y of the retry rail
  return (
    <AbsoluteFill>
      <Box x={BX[0]} y={BY} label={LABELS[0]} fg={fg} atMs={C.boxA} loop loopMs={C.loops} />
      <Box x={BX[1]} y={BY} label={LABELS[1]} fg={fg} atMs={C.boxB} loop loopMs={C.loops + 120} />
      <Box x={BX[2]} y={BY} label={LABELS[2]} fg={fg} atMs={C.boxC} loop loopMs={C.loops + 240} />
      <Arrow x1={BX[0] + BW + 8} y1={midY} x2={BX[1] - 8} y2={midY} color={RED} atMs={C.arrow1} />
      <Arrow x1={BX[1] + BW + 8} y1={midY} x2={BX[2] - 8} y2={midY} color={RED} atMs={C.arrow2} />

      {/* stop: the chain ends in a solid mark on the last box */}
      {frame >= f(C.stop) ? (
        <div style={{position: 'absolute', left: BX[2] + BW + 0 - 44, top: BY - 52, width: 44, height: 44,
          background: RED, borderRadius: 6}} />
      ) : null}

      {/* retry: down from the last box, back along a rail, up into the first */}
      {retry > 0 ? (
        <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <path d={`M ${BX[2] + BW / 2} ${BY + BH + 6} L ${BX[2] + BW / 2} ${RY} L ${BX[0] + BW / 2} ${RY} L ${BX[0] + BW / 2} ${BY + BH + 14}`}
            fill="none" stroke={RED} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
            pathLength={1} strokeDasharray={1} strokeDashoffset={1 - retry} />
          {retry > 0.95 ? (
            <polyline points={`${BX[0] + BW / 2 - 14},${BY + BH + 40} ${BX[0] + BW / 2},${BY + BH + 12} ${BX[0] + BW / 2 + 14},${BY + BH + 40}`}
              fill="none" stroke={RED} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
        </svg>
      ) : null}

      {/* hand it back to you: a fourth box under the chain, fed from the middle box */}
      <Arrow x1={BX[1] + BW / 2} y1={RY + 6} x2={BX[1] + BW / 2} y2={RY + 74} color={fg} atMs={C.you - 700} durMs={300} />
      <Box x={BX[1]} y={RY + 84} label="you" fg={fg} atMs={C.you - 500} accent />
    </AbsoluteFill>
  );
};

// ---- composition --------------------------------------------------------------
export const KTNo074: React.FC<{layer?: 'all' | 'type' | 'viz' | 'furniture'}> = ({layer = 'all'}) => {
  const frame = useCurrentFrame();
  // Every hook is called before any early return.
  const beat = NO074_BEATS.find((s) => frame >= f(s.from) && frame < f(s.to)) ?? NO074_BEATS[NO074_BEATS.length - 1];
  const light = beat.bg === CREAM;
  const fg = beat.type;
  const furn = light ? 'rgba(16,16,16,0.62)' : (beat.bg === RED ? CREAM : 'rgba(244,239,223,0.55)');

  // field flips: every seam where the incoming field differs from the outgoing one
  const flips = NO074_BEATS.filter((b, i) => i > 0 && b.bg !== NO074_BEATS[i - 1].bg);

  return (
    <AbsoluteFill style={{backgroundColor: beat.bg, fontFamily: FONT}}>
      {layer === 'all' || layer === 'viz' ? <GraphPlate fg={fg} /> : null}

      {layer === 'all' || layer === 'type' ? (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: beat.top ? 'flex-start' : 'center',
          flexDirection: 'column', rowGap: 26, padding: beat.top ? '330px 150px 0' : '0 150px', textAlign: 'center'}}>
          {beat.rows.map((row, ri) => (
            <div key={`${beat.from}-${ri}`} style={{lineHeight: 1.14}}>
              {row.words.map((w, wi) => (
                <Word key={wi} w={w} base={row.size} baseColor={beat.type} />
              ))}
            </div>
          ))}
        </AbsoluteFill>
      ) : null}

      {layer === 'all' ? flips.map((b) => (
        <MatteWipe key={b.from} atMs={b.from} main={b.bg} accent1={b.bg} accent2={b.bg} />
      )) : null}

      {layer === 'all' || layer === 'furniture' ? (<>
        <div style={{position: 'absolute', top: 240, left: L, fontSize: 40, fontWeight: 600,
          letterSpacing: '-0.045em', color: light ? INK : CREAM, fontFamily: FONT_UI}}>vektor</div>
        <div style={{position: 'absolute', top: 1372, left: L, fontSize: 22, letterSpacing: 3, color: furn}}>
          vektor /// loops and graphs</div>
        <div style={{position: 'absolute', top: 1372, left: L, width: W, textAlign: 'right', fontSize: 22,
          letterSpacing: 3, color: furn}}>comment. graphs.</div>
      </>) : null}
    </AbsoluteFill>
  );
};
