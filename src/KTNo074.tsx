// NO. 074 "Graph" — KT TRIAL ARM v2, FULL KT SYSTEM (ADR 0007, vektor-kt-trial, 2026-10-21).
// Rebuild after the founder's verdict on v1 ("kt visualisations are extremely crappy ... apply the full kt system").
// Study: vektor-kt-trial/docs/proposals/KT-FULL-SYSTEM-STUDY-2026-10-21.md. The winners (state-file, graphify, ai-sdlc,
// five-archetypes, local-convert) are NOT type on flat fields: they run 4-10 evolving pictures (UI panels, terminals with
// typing, a real full-width capture, a drawn diagram that grows, a mascot, a tiled-wordmark CTA) on ink / cream / red
// fields, with the wordmark + mono kicker top-left, a bold claim headline with one red word, and a small spoken caption.
//
// Same film as arm A: same script, caption timings (KTNo074Words / KTNo074Caps from canon/kt-trial/no074/captions.json),
// 61.600 s, same opening words. Audio is muxed afterwards from arm A (-c:a copy). Pictures (ms):
//   P1 0-8.35 ink   prompt composer + "check in" pings   P2 8.35-11.86 cream  a prompt = instructions card
//   P3 11.86-17.31 cream  loop (do/check/fix) orbit       P4 17.31-23.69 ink   chain of loops + Bun->Rust day counter
//   P5 23.69-33.06 red    terminal: ultracode -> workflow  P6 33.06-42.49 cream  graph: boxes, arrows, stop/retry/hand back
//   P7 42.49-46.64 ink    REAL /workflows capture, full width   P8 46.64-56.05 cream  prompt / loop / graph picker
//   P9 56.05-61.6 red     CTA: tiled wordmark + starter-file card + mascot
// Safe zone x150-930 / y220-1420 holds for everything except the real capture (full width, as the winners do).
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f, RoughUnderline} from './KTHook';
import {NO074_END_MS, NO074_CUES} from './KTNo074Words';
import {NO074_CAPS} from './KTNo074Caps';
import {MatteWipe} from './KTSeams';
import {FAMILY, FIELD, TEXT_ON, LABEL_ON, HAIR_ON, WASH_ON, ACCENT_ON, Field, ease, clamp01} from './kt/system';
import {ClaudeMascot} from './scenes/ClaudeMascot';
import './style.css';

export const KT_NO074_FRAMES = f(NO074_END_MS);

const D = FAMILY.display, UI = FAMILY.ui, MONO = FAMILY.mono;
const L = 150, W = 780;

// ---- beats: field + headline + kicker ---------------------------------------
type Head = {from: number; to: number; field: Field; kicker: string; rows: string[]; size?: number};
const HEADS: Head[] = [
  {from: 0, to: 2922, field: 'ink', kicker: 'THE PROBLEM', rows: ['Prompting is', 'not *enough.*']},
  {from: 2922, to: 8349, field: 'ink', kicker: 'THE FIX', rows: ['Learn *loops*', 'and *graphs.*']},
  {from: 8349, to: 11859, field: 'cream', kicker: '01 · PROMPT', rows: ['A *prompt* is', 'instructions.']},
  {from: 11859, to: 17307, field: 'cream', kicker: '02 · LOOP', rows: ['A *loop* does it,', 'checks it, fixes it.']},
  {from: 17307, to: 23694, field: 'ink', kicker: 'THE CATCH', rows: ['Real work is', 'a *chain.*']},
  {from: 23694, to: 33063, field: 'redDeep', kicker: '03 · GRAPH', rows: ['A *graph* is a', 'workflow.']},
  {from: 33063, to: 37692, field: 'cream', kicker: 'HOW IT WORKS', rows: ['Every step is', 'its own *box.*']},
  {from: 37692, to: 42489, field: 'cream', kicker: 'HOW IT WORKS', rows: ['Every arrow is', 'a *rule.*']},
  {from: 42489, to: 46637, field: 'ink', kicker: 'REAL RUN · /WORKFLOWS', rows: ['Loops run inside', 'every *box.*']},
  {from: 46637, to: 56047, field: 'cream', kicker: 'PICK ONE', rows: ['Which one do', 'you *need?*']},
  {from: 56047, to: 61600, field: 'redDeep', kicker: 'STARTER FILE', rows: ['Comment', '*GRAPHS*'], size: 107},
];
const WIPE_AT = HEADS.filter((h, i) => i > 0 && h.field !== HEADS[i - 1].field).map((h) => h.from);
const headAt = (ms: number) => HEADS.find((h) => ms >= h.from && ms < h.to) ?? HEADS[HEADS.length - 1];

type Pal = {fg: string; label: string; hair: string; wash: string; acc: string; bg: string};
const palOf = (fl: Field): Pal => ({fg: TEXT_ON[fl], label: LABEL_ON[fl], hair: HAIR_ON[fl], wash: WASH_ON[fl],
  acc: ACCENT_ON[fl], bg: FIELD[fl]});
const TERM = {bg: INK, fg: CREAM, label: 'rgba(244,239,223,0.55)', hair: 'rgba(244,239,223,0.26)', acc: RED, ok: 'rgb(111,207,151)'};

const useMs = () => (useCurrentFrame() / 30) * 1000;
const pop = (ms: number, at: number, dur = 350) => ease((ms - at) / dur);          // 0..1, 0 before `at`
const typed = (s: string, ms: number, at: number, per: number) =>
  s.slice(0, Math.max(0, Math.min(s.length, Math.floor((ms - at) / per))));
const Cursor: React.FC<{color: string; on: boolean}> = ({color, on}) => {
  const fr = useCurrentFrame();
  return on && Math.floor(fr / 8) % 2 === 0 ? <span style={{color}}>▍</span> : <span style={{opacity: 0}}>▍</span>;
};
const Abs: React.FC<{x: number; y: number; w?: number; h?: number; style?: React.CSSProperties; children?: React.ReactNode}> =
  ({x, y, w, h, style, children}) => (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', ...style}}>{children}</div>
  );
const rich = (s: string, hi: string) => s.split('*').map((p, i) => (
  i % 2 ? <span key={i} style={{color: hi, position: 'relative', display: 'inline-block'}}>{p}<RoughUnderline seed={i + s.length} color={hi} /></span>
    : <React.Fragment key={i}>{p}</React.Fragment>));

// ---- icons ------------------------------------------------------------------
const LoopGlyph: React.FC<{size: number; color: string; sw?: number}> = ({size, color, sw = 5}) => (
  <svg width={size} height={size} viewBox="0 0 56 56" style={{overflow: 'visible'}}>
    <path d="M 46 28 A 18 18 0 1 1 28 10" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    <polyline points="19,2 29,10 19,18" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const GraphGlyph: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 56 56" style={{overflow: 'visible'}}>
    {[[4, 8], [38, 8], [21, 38]].map(([x, y], i) => <rect key={i} x={x} y={y} width="14" height="12" rx="3" fill="none" stroke={color} strokeWidth="4" />)}
    <path d="M 18 14 L 38 14 M 45 22 L 30 38 M 28 44 L 18 22" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const ArrowGlyph: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 56 56" style={{overflow: 'visible'}}>
    <path d="M 6 28 L 46 28 M 32 14 L 46 28 L 32 42" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---- P1: composer + check-in pings ------------------------------------------
const P1: React.FC = () => {
  const ms = useMs();
  const pings = [['is this right?', '+2 min', 3200], ['still wrong. again', '+5 min', 4150], ['try it this way', '+9 min', 5000],
    ['did it finish?', '+14 min', 5750]] as const;
  const t = TERM;
  return (<>
    <Abs x={L} y={600} w={W} h={250} style={{background: t.bg, border: `2px solid ${t.hair}`, borderRadius: 16, padding: '24px 30px'}}>
      <div style={{fontFamily: MONO, fontSize: 24, color: t.label, letterSpacing: 2}}>● ● ●   claude code</div>
      <div style={{fontFamily: MONO, fontSize: 54, color: t.fg, marginTop: 26}}>
        <span style={{color: t.acc}}>&gt; </span>{typed('fix the login bug', ms, 250, 90)}<Cursor color={t.fg} on={ms < 1900} />
      </div>
      {ms > 1900 ? <div style={{fontFamily: MONO, fontSize: 36, color: 'rgb(255,122,92)', marginTop: 22, opacity: pop(ms, 1900, 250)}}>● working on it...</div> : null}
    </Abs>
    {ms > 2300 ? <Abs x={L} y={880} w={W} style={{fontFamily: MONO, fontSize: 30, color: 'rgba(244,239,223,0.8)', letterSpacing: 2,
      opacity: pop(ms, 2300)}}>YOU, CHECKING IN</Abs> : null}
    {pings.map(([txt, tm, at], i) => {
      const p = pop(ms, at, 300);
      if (p <= 0) return null;
      return (
        <React.Fragment key={i}>
          <Abs x={L} y={926 + i * 90} w={150} style={{fontFamily: MONO, fontSize: 28, color: 'rgba(244,239,223,0.7)', opacity: p,
            lineHeight: '74px'}}>{tm}</Abs>
          <Abs x={L + 170} y={926 + i * 90} w={W - 170} h={74} style={{border: `4px solid ${RED}`, borderRadius: 14, opacity: p,
            transform: `translateX(${(1 - p) * 40}px)`, fontFamily: MONO, fontSize: 36, color: CREAM, padding: '0 24px', lineHeight: '66px'}}>
            {txt}</Abs>
        </React.Fragment>
      );
    })}
  </>);
};

// ---- P2: a prompt is instructions -------------------------------------------
const P2: React.FC<{p: Pal}> = ({p}) => {
  const ms = useMs();
  const rows = [['role', 'you review code', 8650], ['task', 'fix the login bug', 9150], ['rules', 'keep tests green', 9700]] as const;
  return (<>
    <Abs x={L} y={600} w={W} h={440} style={{border: `4px solid ${p.fg}`, borderRadius: 18, background: p.wash, padding: '28px 36px'}}>
      <div style={{fontFamily: MONO, fontSize: 28, color: p.label, letterSpacing: 3}}>PROMPT</div>
      {rows.map(([k, v, at], i) => (
        <div key={k} style={{marginTop: i === 0 ? 38 : 34, fontFamily: MONO, fontSize: 44, color: p.fg, opacity: pop(ms, at, 280),
          transform: `translateY(${(1 - pop(ms, at, 280)) * 16}px)`}}>
          <span style={{color: p.acc, display: 'inline-block', width: 190}}>{k}</span>{v}
        </div>
      ))}
    </Abs>
    {ms > 10000 ? (<>
      <Abs x={540 - 30} y={1050} style={{opacity: pop(ms, 10000, 250), transform: 'rotate(90deg)'}}><ArrowGlyph size={60} color={p.acc} /></Abs>
      <Abs x={L + 100} y={1130} w={W - 200} h={120} style={{border: `4px solid ${p.acc}`, borderRadius: 18, background: p.bg,
        fontFamily: D, fontSize: 64, color: p.fg, textAlign: 'center', lineHeight: '112px', opacity: pop(ms, 10200, 300)}}>one answer</Abs>
    </>) : null}
  </>);
};

// ---- P3: a loop orbits do -> check -> fix ------------------------------------
const P3: React.FC<{p: Pal}> = ({p}) => {
  const ms = useMs();
  const CX = 540, CY = 950, R = 270;
  const nodes = [{n: 'do', a: -90, at: 14094}, {n: 'check', a: 30, at: 15014}, {n: 'fix', a: 150, at: 15334}];
  const T = ((ms - 12300) / 2600) % 1;
  const a = ms > 12300 ? (-90 + 360 * T) * Math.PI / 180 : null;
  const ringP = pop(ms, 12000, 500);
  const lit = ms >= 16200;
  return (<>
    <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0}}>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={lit ? p.acc : p.fg} strokeWidth={lit ? 10 : 7} strokeDasharray={lit ? undefined : '16 14'} opacity={ringP * (lit ? 1 : 0.55)} />
      {a !== null ? <circle cx={CX + R * Math.cos(a)} cy={CY + R * Math.sin(a)} r={24} fill={p.acc} stroke={p.bg} strokeWidth={6} /> : null}
    </svg>
    {nodes.map((nd) => {
      const x = CX + R * Math.cos(nd.a * Math.PI / 180), y = CY + R * Math.sin(nd.a * Math.PI / 180);
      const on = ms >= nd.at, q = pop(ms, nd.at - 500, 300);
      return (
        <Abs key={nd.n} x={x - 110} y={y - 50} w={220} h={100} style={{borderRadius: 50, border: `5px solid ${on ? p.acc : p.fg}`,
          background: on ? p.acc : p.bg, color: on ? TEXT_ON.redDeep : p.fg, fontFamily: D, fontSize: 60, textAlign: 'center',
          lineHeight: '90px', opacity: q, transform: `scale(${0.85 + 0.15 * q})`}}>{nd.n}</Abs>
      );
    })}
    <Abs x={CX - 50} y={CY - 90} style={{opacity: ringP}}><LoopGlyph size={100} color={p.fg} sw={6} /></Abs>
    <Abs x={CX - 120} y={CY + 30} w={240} style={{opacity: ringP, textAlign: 'center', fontFamily: MONO, fontSize: 30, color: p.label, letterSpacing: 3}}>RUNS AGAIN</Abs>
  </>);
};

// ---- P4: chain of loops + Bun -> Rust day counter ------------------------------
const P4: React.FC<{p: Pal}> = ({p}) => {
  const ms = useMs();
  const BW = 180, G = (W - 4 * BW) / 3;
  const at = [17800, 19730, 19930, 20130];
  const day = Math.max(0, Math.min(11, Math.floor((ms - 20900) / 125)));
  const bar = clamp01((ms - 20900) / 1500);
  return (<>
    {at.map((t0, i) => {
      const q = pop(ms, t0, 300), x = L + i * (BW + G);
      return (
        <React.Fragment key={i}>
          <Abs x={x} y={600} w={BW} h={160} style={{border: `4px solid ${p.fg}`, borderRadius: 18, background: p.wash, opacity: q,
            transform: `scale(${0.85 + 0.15 * q})`, padding: '18px 20px'}}>
            <LoopGlyph size={62} color={p.acc} sw={6} />
            <div style={{fontFamily: MONO, fontSize: 32, color: p.fg, marginTop: 10}}>job {i + 1}</div>
          </Abs>
          {i < 3 && pop(ms, t0 + 150, 200) > 0 ? <Abs x={x + BW} y={678} w={G} h={6} style={{background: p.acc, opacity: q}} /> : null}
        </React.Fragment>
      );
    })}
    {ms > 20539 ? (
      <Abs x={L} y={810} w={W} h={440} style={{border: `4px solid ${p.fg}`, borderRadius: 18, background: p.wash, padding: '30px 36px',
        opacity: pop(ms, 20539, 300)}}>
        <div style={{fontFamily: MONO, fontSize: 28, color: p.label, letterSpacing: 3}}>PORT BUN TO RUST</div>
        <div style={{display: 'flex', alignItems: 'baseline', marginTop: 20}}>
          <span style={{fontFamily: MONO, fontSize: 52, color: p.label, marginRight: 28}}>day</span>
          <span style={{fontFamily: D, fontSize: 270, color: p.fg, lineHeight: 1}}>{day}</span>
          <span style={{fontFamily: MONO, fontSize: 52, color: p.label, marginLeft: 24}}>/ 11</span>
        </div>
        <div style={{marginTop: 30, height: 34, border: `4px solid ${p.fg}`, borderRadius: 17}}>
          <div style={{width: `${bar * 100}%`, height: '100%', background: p.acc, borderRadius: 12}} />
        </div>
      </Abs>
    ) : null}
  </>);
};

// ---- P5: terminal, ultracode -> workflow script --------------------------------
const P5: React.FC = () => {
  const ms = useMs();
  const t = TERM;
  const lines = [['find     3 agents', 29900], ['verify   3 agents', 30500], ['fix      retry x2', 31100], ['report   hand back', 31700]] as const;
  return (
    <Abs x={L} y={600} w={W} h={660} style={{background: t.bg, border: `2px solid ${t.hair}`, borderRadius: 16, padding: '24px 32px'}}>
      <div style={{fontFamily: MONO, fontSize: 24, color: t.label, letterSpacing: 2}}>● ● ●   claude code</div>
      <div style={{fontFamily: MONO, fontSize: 38, color: t.fg, marginTop: 34}}>
        <span style={{color: t.acc}}>&gt; </span>{typed('ultracode port bun to rust', ms, 26900, 80)}<Cursor color={t.fg} on={ms < 29300} />
      </div>
      {ms > 29300 ? <div style={{fontFamily: MONO, fontSize: 36, color: 'rgb(255,122,92)', marginTop: 34, opacity: pop(ms, 29300, 250)}}>
        ● writing workflow.js</div> : null}
      {lines.map(([s, at], i) => (
        <div key={i} style={{fontFamily: MONO, fontSize: 38, color: t.fg, marginTop: 22, opacity: pop(ms, at, 250),
          transform: `translateX(${(1 - pop(ms, at, 250)) * 24}px)`, display: ms >= at ? 'block' : 'none'}}>
          <span style={{color: t.ok}}>✓ </span>{s}</div>
      ))}
      {ms > 32300 ? <div style={{fontFamily: MONO, fontSize: 30, color: t.label, marginTop: 34, opacity: pop(ms, 32300)}}>
        4 steps · 2 rules · ready to run</div> : null}
    </Abs>
  );
};

// ---- P6: the graph: boxes, arrows, stop / retry / hand back ----------------------
const P6: React.FC<{p: Pal}> = ({p}) => {
  const ms = useMs();
  const C = NO074_CUES;
  const CW = 220, CH = 210, GAP = (W - 3 * CW) / 2, CY = 650;
  const xs = [L, L + CW + GAP, L + 2 * (CW + GAP)];
  const cards = [['find', C.boxA], ['verify', C.boxB], ['fix', C.boxC]] as const;
  const arrows = [[xs[0] + CW, xs[1], C.arrow1], [xs[1] + CW, xs[2], C.arrow2]] as const;
  const retry = clamp01((ms - C.retry) / 600);
  const RY = CY + CH + 80;
  return (<>
    {cards.map(([n, at], i) => {
      const q = pop(ms, at, 300);
      if (q <= 0) return null;
      const stopHit = i === 2 && ms >= C.stop;
      return (
        <Abs key={n} x={xs[i]} y={CY} w={CW} h={CH} style={{border: `4px solid ${stopHit ? p.acc : p.fg}`, borderRadius: 18, background: p.wash,
          padding: '16px 20px', opacity: q, transform: `translateY(${(1 - q) * 20}px)`}}>
          <div style={{fontFamily: MONO, fontSize: 26, color: p.label, letterSpacing: 2}}>STEP {i + 1}</div>
          <div style={{fontFamily: D, fontSize: 68, color: p.fg, marginTop: 14}}>{n}</div>
          <Abs x={CW - 20 - 54} y={CH - 20 - 54} style={{opacity: 0.9}}><LoopGlyph size={54} color={p.acc} sw={6} /></Abs>
        </Abs>
      );
    })}
    {arrows.map(([x1, x2, at], i) => {
      const q = clamp01((ms - at) / 300);
      if (q <= 0) return null;
      return (
        <svg key={i} width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <line x1={x1 + 6} y1={CY + CH / 2} x2={x1 + 6 + (x2 - x1 - 12) * q} y2={CY + CH / 2} stroke={p.acc} strokeWidth={7} strokeLinecap="round" />
          {q > 0.85 ? <polyline points={`${x2 - 24},${CY + CH / 2 - 14} ${x2 - 6},${CY + CH / 2} ${x2 - 24},${CY + CH / 2 + 14}`} fill="none"
            stroke={p.acc} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /> : null}
        </svg>
      );
    })}
    {/* rule tags, one per rule */}
    {ms >= C.stop ? (<>
      <Abs x={xs[2]} y={CY - 70} style={{opacity: pop(ms, C.stop, 250), display: 'flex', alignItems: 'center'}}>
        <div style={{width: 36, height: 36, background: p.acc, borderRadius: 6, marginRight: 14}} />
        <span style={{fontFamily: MONO, fontSize: 38, color: p.fg}}>stop</span></Abs>
    </>) : null}
    {retry > 0 ? (<>
      <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d={`M ${xs[2] + CW / 2} ${CY + CH + 6} L ${xs[2] + CW / 2} ${RY} L ${xs[0] + CW / 2} ${RY} L ${xs[0] + CW / 2} ${CY + CH + 14}`}
          fill="none" stroke={p.acc} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1}
          strokeDashoffset={1 - retry} />
        {retry > 0.95 ? <polyline points={`${xs[0] + CW / 2 - 14},${CY + CH + 40} ${xs[0] + CW / 2},${CY + CH + 12} ${xs[0] + CW / 2 + 14},${CY + CH + 40}`}
          fill="none" stroke={p.acc} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /> : null}
      </svg>
      <Abs x={xs[1]} y={RY + 12} w={CW} style={{fontFamily: MONO, fontSize: 38, color: p.fg, textAlign: 'center', opacity: pop(ms, C.retry + 300)}}>retry</Abs>
    </>) : null}
    {ms >= C.you - 800 ? (<>
      <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <line x1={xs[1] + CW / 2} y1={RY + 70} x2={xs[1] + CW / 2} y2={RY + 70 + 90 * clamp01((ms - (C.you - 800)) / 300)}
          stroke={p.fg} strokeWidth={6} strokeLinecap="round" />
      </svg>
      <Abs x={xs[1]} y={RY + 170} w={CW} h={120} style={{border: `4px solid ${p.acc}`, borderRadius: 18, background: p.bg, fontFamily: D, fontSize: 56,
        color: p.fg, textAlign: 'center', lineHeight: '112px', opacity: pop(ms, C.you - 500, 300)}}>you</Abs>
      <Abs x={xs[1] + CW + 24} y={RY + 205} w={300} style={{fontFamily: MONO, fontSize: 38, color: p.fg, opacity: pop(ms, C.you - 400)}}>hand back</Abs>
    </>) : null}
  </>);
};

// ---- P7: the real /workflows capture, full width ------------------------------
const P7: React.FC = () => {
  const ms = useMs();
  const at = [42489, 43500, 44450, 45450];
  const idx = at.reduce((a, t, i) => (ms >= t ? i : a), 0);
  const active = [0, 2, 3, 3][idx];                 // phase the capture's chevron sits on (views 1-4, read from the PNGs)
  const rowY = [99, 164, 232, 299];                 // phase row centre in the 1080-wide capture (480px preview x 2.25)
  const a = pop(ms, at[idx], 250);
  const chips = [['find', '3 agents'], ['verify', '3 agents'], ['fix', '3 agents'], ['report', '1 agent']];
  return (<>
    <div style={{position: 'absolute', left: 0, top: 560, width: 1080, height: 480, overflow: 'hidden'}}>
      <Img src={staticFile(`screens/no074-workflows-${idx + 1}.png`)} style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 708}} />
    </div>
    <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <rect x={34} y={560 + rowY[active] - 33} width={470} height={66} rx={10} fill="none" stroke={RED} strokeWidth={7}
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - a} />
    </svg>
    {chips.map(([n, s], i) => {
      const on = i === active, q = pop(ms, 42800 + i * 120, 300);
      return (
        <Abs key={n} x={L + i * 200} y={1080} w={180} h={100} style={{border: `${on ? 5 : 3}px solid ${on ? RED : 'rgba(244,239,223,0.4)'}`,
          borderRadius: 14, padding: '12px 16px', opacity: q, background: on ? 'rgba(231,55,26,0.14)' : 'transparent'}}>
          <div style={{fontFamily: D, fontSize: 40, color: on ? RED : CREAM, lineHeight: 1}}>{n}</div>
          <div style={{fontFamily: MONO, fontSize: 20, color: 'rgba(244,239,223,0.55)', marginTop: 8}}>{s}</div>
        </Abs>
      );
    })}
    <Abs x={L} y={1206} w={W} style={{fontFamily: MONO, fontSize: 20, color: 'rgba(244,239,223,0.55)', letterSpacing: 2}}>
      our real /workflows run · 2026-10-17 · unaltered</Abs>
  </>);
};

// ---- P8: the picker ------------------------------------------------------------
const P8: React.FC<{p: Pal}> = ({p}) => {
  const ms = useMs();
  const rows = [
    {n: 'prompt', s: 'a one-time task', icon: 'a', enter: 46800, act: [47634, 49784]},
    {n: 'loop', s: 'a job you can mark pass or fail', icon: 'l', enter: 47100, act: [49784, 52097]},
    {n: 'graph', s: 'a multi-step process, every week', icon: 'g', enter: 47400, act: [52097, 56047]},
  ];
  return (<>
    {rows.map((r, i) => {
      const q = pop(ms, r.enter, 350);
      const on = ms >= r.act[0] && ms < r.act[1], done = ms >= r.act[1];
      const y = 600 + i * 215, prog = clamp01((ms - r.act[0]) / (r.act[1] - r.act[0]));
      return (
        <Abs key={r.n} x={L} y={y} w={W} h={190} style={{border: `${on ? 8 : 3}px solid ${on ? p.acc : p.fg}`, borderRadius: 20,
          background: on ? p.wash : 'transparent', opacity: q * (on ? 1 : done ? 0.45 : 0.75), transform: `translateX(${(1 - q) * -40}px)`,
          display: 'flex', alignItems: 'center', padding: '0 36px', overflow: 'hidden'}}>
          <div style={{width: 110}}>
            {r.icon === 'a' ? <ArrowGlyph size={80} color={on ? p.acc : p.fg} /> : r.icon === 'l' ? <LoopGlyph size={80} color={on ? p.acc : p.fg} />
              : <GraphGlyph size={80} color={on ? p.acc : p.fg} />}
          </div>
          <div style={{flex: 1}}>
            <div style={{fontFamily: D, fontSize: 90, color: on ? p.acc : p.fg, lineHeight: 1}}>{r.n}</div>
            <div style={{fontFamily: MONO, fontSize: 28, color: p.fg, marginTop: 10, opacity: 0.8}}>{r.s}</div>
          </div>
          {on ? <div style={{position: 'absolute', left: 0, bottom: 0, height: 10, width: `${prog * 100}%`, background: p.acc}} /> : null}
        </Abs>
      );
    })}
  </>);
};

// ---- P9: CTA --------------------------------------------------------------------
const P9: React.FC = () => {
  const ms = useMs();
  const t = TERM;
  return (<>
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {Array.from({length: 11}).map((_, r) => (
        <div key={r} style={{position: 'absolute', top: r * 190 - 20, left: r % 2 ? -120 : -10, whiteSpace: 'nowrap', fontFamily: UI, fontWeight: 600,
          fontSize: 56, letterSpacing: '-0.045em', color: 'rgba(255,255,255,0.07)'}}>
          {'vektor     '.repeat(8)}</div>
      ))}
    </AbsoluteFill>
    {ms > 57300 ? (
      <Abs x={L} y={690} w={W} h={520} style={{background: t.bg, border: `2px solid ${t.hair}`, borderRadius: 16, padding: '26px 34px',
        opacity: pop(ms, 57300, 400), transform: `translateY(${(1 - pop(ms, 57300, 400)) * 30}px)`}}>
        <div style={{fontFamily: MONO, fontSize: 24, color: t.label, letterSpacing: 2}}>STARTER FILE</div>
        <div style={{fontFamily: MONO, fontSize: 36, color: t.fg, marginTop: 18}}>.claude/commands/graph.md</div>
        <div style={{height: 2, background: t.hair, marginTop: 28}} />
        <div style={{fontFamily: MONO, fontSize: 38, color: t.fg, marginTop: 34}}>
          <span style={{color: t.acc}}>&gt; </span>{typed('/graph my weekly job', ms, 58300, 70)}<Cursor color={t.fg} on={ms < 60500} /></div>
        {ms > 60300 ? <div style={{fontFamily: MONO, fontSize: 32, color: 'rgb(255,122,92)', marginTop: 28, opacity: pop(ms, 60300, 250)}}>
          ● running it as a graph</div> : null}
        <div style={{fontFamily: MONO, fontSize: 28, color: t.label, marginTop: 36}}>save it as your own Claude Code command</div>
      </Abs>
    ) : null}
    <AbsoluteFill>
      <ClaudeMascot frames={KT_NO074_FRAMES}
        config={{pose: 'walk', xPct: 76, yPct: 20, size: 150, delay: f(56500), bubble: false}} />
    </AbsoluteFill>
  </>);
};

// ---- headline + caption + furniture -----------------------------------------------
const Headline: React.FC<{h: Head; p: Pal}> = ({h, p}) => {
  const ms = useMs();
  const q = pop(ms, h.from, 450);
  const size = h.size ?? 86;
  return (<>
    <Abs x={L} y={292} w={W} style={{fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: p.label, display: 'flex', alignItems: 'center'}}>
      <span style={{display: 'inline-block', width: 12, height: 12, background: p.acc, marginRight: 14}} />{h.kicker}</Abs>
    <Abs x={L} y={336} w={W} style={{fontFamily: D, fontSize: size, lineHeight: 1.06, color: p.fg, opacity: q,
      transform: `translateY(${(1 - q) * 16}px)`}}>
      {h.rows.map((r, i) => <div key={i}>{rich(r, p.acc)}</div>)}
    </Abs>
  </>);
};

const Caption: React.FC<{p: Pal}> = ({p}) => {
  const ms = useMs();
  const ph = NO074_CAPS.find((c) => ms >= c.from && ms < c.to);
  if (!ph) return null;
  const words = ph.words.filter((w) => ms >= w.ms);
  return (
    <Abs x={L} y={1300} w={W} style={{fontFamily: D, fontSize: 50, lineHeight: 1.12, textAlign: 'center', color: p.fg}}>
      {words.map((w, i) => <span key={i} style={{color: w.k ? p.acc : p.fg}}>{w.t}{' '}</span>)}
    </Abs>
  );
};

export const KTNo074: React.FC<{layer?: 'all' | 'type' | 'viz' | 'furniture'}> = ({layer = 'all'}) => {
  const ms = useMs();
  const h = headAt(ms);
  const p = palOf(h.field);
  const showViz = layer === 'all' || layer === 'viz';
  const showType = layer === 'all' || layer === 'type';
  const pic = (() => {
    if (ms < 8349) return <P1 />;
    if (ms < 11859) return <P2 p={p} />;
    if (ms < 17307) return <P3 p={p} />;
    if (ms < 23694) return <P4 p={p} />;
    if (ms < 33063) return <P5 />;
    if (ms < 42489) return <P6 p={p} />;
    if (ms < 46637) return <P7 />;
    if (ms < 56047) return <P8 p={p} />;
    return <P9 />;
  })();
  return (
    <AbsoluteFill style={{backgroundColor: p.bg, fontFamily: D}}>
      {showViz ? pic : null}
      {layer === 'all' ? WIPE_AT.map((at) => {
        const inc = HEADS.find((x) => x.from === at)!.field;
        return <MatteWipe key={at} atMs={at} main={FIELD[inc]} accent1={inc === 'ink' ? CREAM : INK} accent2={inc === 'redDeep' ? CREAM : RED} />;
      }) : null}
      {showType ? <Headline h={h} p={p} /> : null}
      {showType ? <Caption p={p} /> : null}
      {layer === 'all' || layer === 'furniture' ? (
        <Abs x={L} y={240} style={{fontSize: 40, fontWeight: 600, letterSpacing: '-0.045em', color: p.fg, fontFamily: UI}}>vektor</Abs>
      ) : null}
    </AbsoluteFill>
  );
};
