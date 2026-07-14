import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import type {FlowScene as FlowSceneType} from '../video-schema';
import {easeOutExpo, interp} from '../motion';
import {SpecimenOverlay} from './_overlay';
import {COLORS, FONTS} from '@tokens/tokens';

const DEFAULTS = ['team strength · Elo', 'expected goals', 'every scoreline · Poisson', '50,000 simulations', 'win probability'];

// Minimal vertical method pipeline (white, one accent): nodes draw in, a line
// connects them, a pulse travels down. Harmonises with the flat-minimal charts.
export const Flow: React.FC<{scene: FlowSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const steps = scene.steps && scene.steps.length ? scene.steps : DEFAULTS;

  // Phone-mockup variant (founder 2026-07-03, the save-bait how-to grammar):
  // the steps live inside a drawn phone frame; optional mono save-cue below.
  if ((scene as {phone?: boolean}).phone) {
    const phoneIn = interp(frame, [8, 26], [0, 1], easeOutExpo);
    const phoneTitle = (scene as {phoneTitle?: string}).phoneTitle ?? 'how to';
    return (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div
            style={{
              width: 470,
              height: 800,
              border: '3px solid var(--fg)',
              borderRadius: 56,
              background: `var(--panel-card, ${COLORS.white})`,
              boxShadow: '0 40px 90px rgba(0,0,0,0.16)',
              padding: '30px 34px',
              position: 'relative',
              opacity: phoneIn,
              transform: `translateY(${(1 - phoneIn) * 18}px)`,
            }}
          >
            <div style={{width: 130, height: 9, borderRadius: 6, background: `var(--panel-dot, ${COLORS.fallbackLightHairline})`, margin: '0 auto 30px'}} />
            <div style={{fontFamily: FONTS.mono, fontSize: 22, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--panel-title, var(--muted))', borderBottom: '1px solid var(--panel-border, var(--hairline))', paddingBottom: 16, marginBottom: 30}}>
              {phoneTitle}
            </div>
            {steps.map((s, i) => {
              const d = 22 + i * 9;
              const op = interp(frame, [d, d + 12], [0, 1]);
              const isLast = i === steps.length - 1;
              return (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 34, opacity: op}}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      flex: 'none',
                      background: isLast ? 'var(--accent)' : 'transparent',
                      border: '3px solid var(--accent)',
                      color: isLast ? `var(--panel-card, ${COLORS.white})` : 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONTS.mono,
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{fontFamily: FONTS.display, fontSize: 33, fontWeight: isLast ? 700 : 500, color: 'var(--panel-doc, var(--fg))', lineHeight: 1.2}}>
                    {s.replace(/^\d+\s*·\s*/, '')}
                  </div>
                </div>
              );
            })}
          </div>
          {(scene as {sub?: string}).sub ? (
            <div style={{marginTop: 30, fontFamily: FONTS.mono, fontSize: 26, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', opacity: interp(frame, [60, 76], [0, 1])}}>
              {(scene as {sub?: string}).sub}
            </div>
          ) : null}
        </div>
        <SpecimenOverlay eyebrow={scene.eyebrow} headline={scene.headline} accentWords={scene.accentWords} />
      </AbsoluteFill>
    );
  }
  const N = steps.length;
  const W = 1000;
  const H = 1000;
  const x = 84;
  const y0 = 60;
  const y1 = H - 60;
  const dy = (y1 - y0) / (N - 1);
  const lineProg = interpolate(frame, [10, 10 + N * 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const pulseT = (frame % 76) / 76;
  const pulseY = y0 + (y1 - y0) * pulseT;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 80, right: 80, top: '31%', height: '58%'}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width: '100%', height: '100%', overflow: 'visible'}}>
          <line x1={x} y1={y0} x2={x} y2={y0 + (y1 - y0) * lineProg} stroke="var(--accent)" strokeWidth={4} opacity={0.38} />
          {lineProg > 0.02 ? <circle cx={x} cy={pulseY} r={7} fill="var(--accent)" /> : null}
          {steps.map((s, i) => {
            const y = y0 + i * dy;
            const d = 14 + i * 8;
            const op = interpolate(frame, [d, d + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            const isLast = i === N - 1;
            return (
              <g key={i} opacity={op}>
                <circle cx={x} cy={y} r={isLast ? 18 : 13} fill={isLast ? 'var(--accent)' : COLORS.white} stroke="var(--accent)" strokeWidth={4} />
                <text x={x + 46} y={y + 13} fontSize={42} fill="var(--fg)" fontFamily="var(--label-font, var(--mono))" fontWeight={isLast ? 700 : 500}>
                  {s}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <SpecimenOverlay eyebrow={scene.eyebrow} headline={scene.headline} accentWords={scene.accentWords} />
    </AbsoluteFill>
  );
};
