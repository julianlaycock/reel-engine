import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate, Easing} from 'remotion';
import {easePhysical, interp} from '../motion';
import {KatexMath} from './KatexMath';

// Shared text overlay for the R3F scenes — eyebrow + headline (top) and an
// optional caption/sub (bottom), in brand type via CSS vars. Accent words get
// the brand accent. Staggered fade-rise, frame-driven.
const splitAccent = (text: string, accent: string[] = []) => {
  if (!accent.length) return [{t: text, a: false}];
  const out: {t: string; a: boolean}[] = [];
  let rest = text;
  // greedy: highlight each accent phrase occurrence
  const pattern = accent
    .map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|');
  const re = new RegExp(`(${pattern})`, 'g');
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(rest))) {
    if (m.index > last) out.push({t: rest.slice(last, m.index), a: false});
    out.push({t: m[0], a: true});
    last = m.index + m[0].length;
  }
  if (last < rest.length) out.push({t: rest.slice(last), a: false});
  return out;
};

export const SpecimenOverlay: React.FC<{
  eyebrow?: string;
  headline?: string;
  accentWords?: string[];
  sub?: string;
  caption?: string;
  formula?: string;
  topPad?: number;
  textCenter?: boolean; // viral-hook block: everything centered mid-frame, bigger type
  figure?: string; // giant accent figure above the headline (numbers stop scrolls)
  figureLabel?: string;
}> = ({eyebrow, headline, accentWords, sub, caption, formula, topPad = 300, textCenter, figure, figureLabel}) => {
  const frame = useCurrentFrame();
  // FRAME-ZERO LAW (canon v1.2.0): delay 0 = fully visible from the first frame —
  // the hook headline must read as a static thumbnail; motion comes from the
  // footage and the hero-word settle, not from text fading in.
  const rise = (delay: number) =>
    delay <= 0
      ? {opacity: 1}
      : {
          opacity: interpolate(frame, [delay, delay + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          transform: `translateY(${interpolate(frame, [delay, delay + 16], [14, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          })}px)`,
        };
  const parts = headline ? splitAccent(headline, accentWords) : [];
  return (
    <AbsoluteFill
      style={
        textCenter
          ? {padding: '240px 70px 260px', justifyContent: 'center', alignItems: 'center', textAlign: 'center', pointerEvents: 'none'}
          : {padding: `${topPad}px 70px 180px`, justifyContent: 'flex-start', pointerEvents: 'none'}
      }
    >
      {figure ? (
        <div style={{marginBottom: 10}}>
          <div style={{fontFamily: 'var(--display)', fontSize: 200, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums'}}>
            {figure}
          </div>
          {figureLabel ? (
            <div style={{...rise(6), fontFamily: 'var(--mono)', fontSize: 26, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 8}}>
              {figureLabel}
            </div>
          ) : null}
        </div>
      ) : null}
      {eyebrow ? (
        <div
          style={{
            ...rise(0),
            fontFamily: 'var(--mono)',
            fontSize: 25,
            fontWeight: 500,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 26,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      {headline ? (
        <div
          style={{
            ...rise(0),
            fontFamily: 'var(--label-font, var(--mono))',
            fontWeight: 700,
            fontSize: textCenter ? 94 : 78,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            color: 'var(--fg)',
          }}
        >
          {parts.map((p, i) => {
            if (!p.a) {
              return (
                <span key={i} style={{color: 'inherit'}}>
                  {p.t}
                </span>
              );
            }
            // Doctrine hero-word: visible (smaller) from frame 0 — frame-zero law —
            // then settles to full size on the one easePhysical overshoot, dead-still after.
            const sc = interp(frame, [4, 26], [0.7, 1], easePhysical);
            return (
              <span
                key={i}
                style={{display: 'inline-block', transform: `scale(${sc})`, transformOrigin: '50% 68%', color: 'var(--accent)'}}
              >
                {p.t}
              </span>
            );
          })}
        </div>
      ) : null}
      {formula ? (
        <div
          style={{
            ...rise(14),
            alignSelf: 'flex-start',
            marginTop: 18,
            padding: '14px 20px',
            borderRadius: 14,
            background: 'var(--panel, rgba(255,255,255,0.06))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--hairline)',
          }}
        >
          <KatexMath latex={formula} display={false} fontSize={34} color="var(--fg)" />
        </div>
      ) : null}
      {sub || caption ? (
        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            bottom: 180,
            ...rise(16),
            fontFamily: 'var(--mono)',
            fontSize: 28,
            lineHeight: 1.4,
            color: 'var(--muted)',
            letterSpacing: '0.02em',
          }}
        >
          {sub ?? caption}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
