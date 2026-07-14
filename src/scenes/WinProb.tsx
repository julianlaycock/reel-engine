import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {WinProbScene as WinProbSceneType} from '../video-schema';
import {countUp, springIn} from '../animation';
import {COLORS, FONTS} from '@tokens/tokens';

// Broadcast-analyst win-probability panel: a glassmorphism card with animated
// bars + count-up numbers (model vs market). The "broadcast graphics" identity.
export const WinProb: React.FC<{scene: WinProbSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rows = scene.rows;
  const suffix = scene.suffix ?? '%';
  const scaleMax = scene.scaleMax ?? Math.max(...rows.map((r) => r.value)) * 1.55;
  const panel = springIn(frame, 6, fps, 0.9);

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: '0 64px'}}>
      <div
        style={{
          ...panel,
          width: '100%',
          padding: '52px 44px 46px',
          borderRadius: 28,
          background: 'var(--panel, linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02)))',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid var(--hairline)',
          boxShadow: '0 24px 60px -24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {scene.title ? (
          <div style={{fontFamily: FONTS.mono, fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8}}>
            {scene.title}
          </div>
        ) : null}
        {scene.sub ? (
          <div style={{fontFamily: FONTS.label, fontSize: 30, fontWeight: 600, color: 'var(--fg)', marginBottom: 30}}>
            {scene.sub}
          </div>
        ) : null}
        {rows.map((r, i) => {
          const start = 16 + i * 10;
          const w = interpolate(frame, [start, start + 26], [0, (r.value / scaleMax) * 100], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });
          const n = countUp(frame, start, 26, r.value);
          const op = interpolate(frame, [start, start + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const col = r.accent ? 'var(--accent)' : 'var(--muted)';
          return (
            <div key={i} style={{opacity: op, marginTop: i ? 26 : 6}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12}}>
                <span style={{fontFamily: FONTS.mono, fontSize: 22, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg)'}}>{r.label}</span>
                <span style={{fontFamily: FONTS.label, fontWeight: 800, fontSize: 56, lineHeight: 1, color: col}}>
                  {r.display ?? `${Math.round(n)}${suffix}`}
                </span>
              </div>
              <div style={{height: 16, borderRadius: 10, background: 'var(--track, rgba(255,255,255,0.07))', overflow: 'hidden'}}>
                <div
                  style={{
                    width: `${w}%`,
                    height: '100%',
                    borderRadius: 10,
                    background: r.accent
                      ? `linear-gradient(90deg, color-mix(in srgb, var(--accent) 55%, ${COLORS.black}), var(--accent))`
                      : 'linear-gradient(90deg, rgba(255,255,255,0.18), var(--muted))',
                  }}
                />
              </div>
            </div>
          );
        })}
        {scene.caption ? (
          <div style={{fontFamily: FONTS.mono, fontSize: 18, color: 'var(--muted)', marginTop: 30, letterSpacing: '0.03em'}}>{scene.caption}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
