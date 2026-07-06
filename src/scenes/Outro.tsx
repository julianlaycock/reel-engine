import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {OutroScene2 as OutroSceneType} from '../video-schema';
import {springIn} from '../animation';

// End card: result recap + an animated Vektor wordmark (letter stagger + cursor) +
// a follow CTA. No disclaimer.
export const Outro: React.FC<{scene: OutroSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const word = (scene.wordmark ?? 'vektor').split('');
  const blink = frame % 34 < 18 ? 1 : 0;
  const rise = (d: number) => ({
    opacity: interpolate(frame, [d, d + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    transform: `translateY(${interpolate(frame, [d, d + 14], [16, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`,
  });

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 80px'}}>
      {scene.recap ? (
        <div style={{...rise(4), fontFamily: 'var(--mono)', fontSize: 30, letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: 40}}>
          {scene.recap}
        </div>
      ) : null}
      {scene.question ? (
        <div style={{...rise(10), fontFamily: 'var(--label-font, var(--mono))', fontWeight: 700, fontSize: 64, lineHeight: 1.04, letterSpacing: '-0.02em', color: 'var(--fg)', marginBottom: 64, maxWidth: 820}}>
          {scene.question}
        </div>
      ) : null}
      {/* Wordmark lockup — matches the top-left chrome logo 1:1 (display font, 600
          weight, -0.02em tracking, square block cursor), just scaled up. */}
      <div style={{display: 'flex', alignItems: 'center'}}>
        {word.map((l, i) => (
          <span
            key={i}
            style={{
              ...springIn(frame, 22 + i * 3, fps, 0.7),
              fontFamily: 'var(--display)',
              fontWeight: 600,
              fontSize: 132,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'var(--fg)',
            }}
          >
            {l}
          </span>
        ))}
        <span style={{display: 'inline-block', width: 84, height: 84, marginLeft: 22, background: 'var(--accent)', opacity: frame > 44 ? blink : 0}} />
      </div>
      {scene.tagline ? (
        <div style={{...rise(40), fontFamily: 'var(--mono)', fontSize: 28, letterSpacing: '0.04em', color: 'var(--muted)', marginTop: 40}}>
          {scene.tagline}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
