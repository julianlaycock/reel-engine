// KT fx demo strip — four approved Cavalry-catalog effects translated into
// the locked KT design (ink/cream/red, Printvetica, boiling-marker era).
// Segments of 4 s each, labeled: scramble-code / zigzag-marquee / matte-wipe /
// spiral-text. Founder picks which (if any) enter NO. 030 and where.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import './style.css';

const INK = '#101010';
const CREAM = '#F4EFDF';
const RED = '#E7371A';
const FPS = 30;
const SEG = 4 * FPS;

const jit = (seed: number, bucket: number, i: number) => {
  let h = (seed * 374761393 + bucket * 668265263 + i * 2246822519) >>> 0;
  h = (h ^ (h >> 13)) * 1274126177;
  h = (h ^ (h >> 16)) >>> 0;
  return (h % 1000) / 1000 - 0.5;
};

const Label: React.FC<{n: number; name: string; dark?: boolean}> = ({n, name, dark}) => (
  <div style={{position: 'absolute', left: 44, bottom: 640, fontSize: 22, letterSpacing: 3,
    color: dark ? 'rgba(16,16,16,0.5)' : 'rgba(244,239,223,0.4)'}}>{`0${n} / ${name}`}</div>
);

// 1 — scramble-code: mono tokens re-scrambling on stepped holds; some tokens
// are solid red redaction plates. Shown as an INTRO-flavored column.
const TOKENS = ['const', 'agents', '=>', 'council', 'verdict', 'ask()', 'claude', '5x', 'review', 'chair'];
const Scramble: React.FC = () => {
  const frame = useCurrentFrame();
  const b = Math.floor(frame / 8); // stepped holds
  const rows = [];
  for (let r = 0; r < 9; r++) {
    const cols = [];
    for (let c = 0; c < 3; c++) {
      const pick = Math.abs(Math.floor(jit(7 + r, b, c) * 1000)) % TOKENS.length;
      const redact = jit(13 + r, b, c + 5) > 0.32;
      cols.push(redact
        ? <span key={c} style={{background: RED, color: RED, marginRight: 26}}>____</span>
        : <span key={c} style={{marginRight: 26}}>{TOKENS[pick]}</span>);
    }
    rows.push(<div key={r} style={{marginBottom: 18}}>{cols}</div>);
  }
  return (
    <AbsoluteFill style={{background: INK, color: 'rgba(244,239,223,0.85)',
      fontFamily: 'monospace', fontSize: 40, paddingTop: 560, paddingLeft: 150}}>
      {rows}
      <div style={{position: 'absolute', top: 380, left: 0, right: 0, textAlign: 'center',
        fontFamily: '"Printvetica", sans-serif', fontSize: 76, color: CREAM}}>the council.</div>
      <Label n={1} name="scramble-code" />
    </AbsoluteFill>
  );
};

// 2 — zigzag-marquee: rows of the repeated keyword, x-offset by a scrolling
// triangle wave; dim cream on red. Shown as an OUTRO field behind the CTA.
const Zigzag: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - SEG;
  const rows = [];
  for (let r = 0; r < 12; r++) {
    const phase = ((r * 0.9 + t * 0.05) % 4 + 4) % 4;
    const tri = phase < 2 ? phase : 4 - phase; // 0..2..0
    rows.push(
      <div key={r} style={{whiteSpace: 'nowrap', fontSize: 84, lineHeight: 1.3,
        color: 'rgba(244,239,223,0.16)',
        transform: `translateX(${-360 + tri * 180}px)`}}>
        council council council council
      </div>
    );
  }
  return (
    <AbsoluteFill style={{background: RED, fontFamily: '"Printvetica", sans-serif', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 140}}>{rows}</div>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontSize: 60, color: CREAM}}>comment</div>
        <div style={{fontSize: 140, color: CREAM}}>council</div>
      </AbsoluteFill>
      <Label n={2} name="zigzag-marquee (outro field)" />
    </AbsoluteFill>
  );
};

// 3 — matte-wipe: oversized rounded panels sweep the frame carrying the next
// ground, led by two offset accent panels. Shown as verdict -> end card seam.
const MatteWipe: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (frame - 2 * SEG) / SEG; // 0..1 over segment
  const sweep = (delay: number, dur: number) => {
    const x = Math.min(1, Math.max(0, (t - delay) / dur));
    return 1 - Math.pow(1 - x, 3);
  };
  const lead1 = sweep(0.18, 0.22), lead2 = sweep(0.24, 0.22), main = sweep(0.3, 0.26);
  return (
    <AbsoluteFill style={{background: INK, fontFamily: '"Printvetica", sans-serif', overflow: 'hidden'}}>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontSize: 120, color: CREAM}}>a verdict.</div>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: -200, bottom: -200, width: 500, borderRadius: 120,
        background: CREAM, left: -520 + lead1 * 2200}} />
      <div style={{position: 'absolute', top: -200, bottom: -200, width: 700, borderRadius: 140,
        background: INK, left: -740 + lead2 * 2400, border: `4px solid ${CREAM}`}} />
      <div style={{position: 'absolute', top: -200, bottom: -200, width: 2400, borderRadius: 160,
        background: RED, left: -2440 + main * 2600}}>
        {main > 0.7 && (
          <div style={{position: 'absolute', left: 2440 - main * 1400, top: 800, fontSize: 90, color: CREAM}}>
            comment council</div>
        )}
      </div>
      <Label n={3} name="matte-wipe (verdict seam)" />
    </AbsoluteFill>
  );
};

// 4 — spiral-text: the CTA orbiting on an Archimedean spiral, chars upright,
// slow rotation. Shown as an alternative OUTRO around the keyword.
const Spiral: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - 3 * SEG;
  const msg = 'comment council · comment council · comment council · ';
  const chars = [];
  const rot = t * 0.008;
  for (let i = 0; i < msg.length; i++) {
    const arc = i / msg.length;
    const a = arc * Math.PI * 2 * 1.9 + rot;
    const r = 190 + arc * 250;
    chars.push(
      <span key={i} style={{position: 'absolute',
        left: 540 + Math.cos(a) * r, top: 900 - Math.sin(a) * r * 0.92,
        fontSize: 40 + arc * 26, color: `rgba(244,239,223,${0.35 + arc * 0.6})`}}>
        {msg[i]}
      </span>
    );
  }
  return (
    <AbsoluteFill style={{background: RED, fontFamily: '"Printvetica", sans-serif', overflow: 'hidden'}}>
      {chars}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontSize: 120, color: CREAM}}>council</div>
      </AbsoluteFill>
      <Label n={4} name="spiral-text (outro orbit)" />
    </AbsoluteFill>
  );
};

export const KTFxDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const seg = Math.min(3, Math.floor(frame / SEG));
  return (
    <AbsoluteFill style={{background: INK}}>
      {seg === 0 && <Scramble />}
      {seg === 1 && <Zigzag />}
      {seg === 2 && <MatteWipe />}
      {seg === 3 && <Spiral />}
      <div style={{position: 'absolute', top: 52, left: 44, fontSize: 40, fontWeight: 600,
        color: seg === 1 || seg === 3 ? CREAM : CREAM, fontFamily: '"Inter Tight", sans-serif'}}>vektor</div>
    </AbsoluteFill>
  );
};

export const KT_FX_DEMO_FRAMES = 4 * SEG;
