import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import type {GuessRevealScene as GuessRevealSceneType} from '../video-schema';
import {SpecimenOverlay} from './_overlay';

// "Guess before the reveal" — the open-loop format. Question holds, a guess beat,
// then the answer counts up, then the payoff + a comment prompt (participation).
// Pure function of frame; minimal/white aesthetic.
export const GuessReveal: React.FC<{scene: GuessRevealSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const f = scene.durationInFrames;
  const dec = scene.decimals ?? 0;

  // timeline (fractions of the scene)
  const t = frame / f;
  const qOp = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const guessOp = interpolate(t, [0.12, 0.2, 0.4, 0.46], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const guessPulse = 1 + 0.06 * Math.sin(frame * 0.4);
  const reveal = interpolate(t, [0.46, 0.72], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const num = reveal * scene.answer;
  const numOp = interpolate(t, [0.44, 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const numPop = interpolate(t, [0.68, 0.74], [1, 1.06], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const payoffOp = interpolate(t, [0.74, 0.84], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const promptOp = interpolate(t, [0.86, 0.94], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const shown = scene.prefix ? scene.prefix : '';
  const numStr = `${shown}${num.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec})}${scene.suffix ?? ''}`;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 80, right: 80, top: '20%', textAlign: 'center'}}>
        {/* question */}
        <div style={{opacity: qOp, fontFamily: 'var(--label-font), sans-serif', fontWeight: 700, fontSize: 62, lineHeight: 1.1, color: 'var(--fg)', letterSpacing: '-0.02em'}}>
          {scene.question}
        </div>
        {/* guess beat */}
        <div style={{opacity: guessOp, transform: `scale(${guessPulse})`, marginTop: 28, fontFamily: 'var(--mono)', fontSize: 30, color: 'var(--accent)', letterSpacing: '0.14em', textTransform: 'uppercase'}}>
          your guess?
        </div>
      </div>

      {/* the reveal number */}
      <div style={{position: 'absolute', left: 0, right: 0, top: '46%', textAlign: 'center', opacity: numOp}}>
        <div style={{transform: `scale(${numPop})`, fontFamily: 'var(--mono)', fontVariantNumeric: 'tabular-nums', fontSize: 168, fontWeight: 800, color: 'var(--accent)', lineHeight: 1, filter: 'drop-shadow(0 16px 46px rgba(14,20,19,0.14))'}}>
          {numStr}
        </div>
        {scene.answerLabel ? (
          <div style={{marginTop: 12, fontFamily: 'var(--mono)', fontSize: 30, color: 'var(--muted)', letterSpacing: '0.04em'}}>{scene.answerLabel}</div>
        ) : null}
      </div>

      {/* payoff + comment prompt */}
      <div style={{position: 'absolute', left: 80, right: 80, top: '70%', textAlign: 'center'}}>
        {scene.payoff ? (
          <div style={{opacity: payoffOp, fontFamily: 'var(--label-font), sans-serif', fontWeight: 600, fontSize: 40, lineHeight: 1.15, color: 'var(--fg)'}}>{scene.payoff}</div>
        ) : null}
        {scene.commentPrompt ? (
          <div style={{opacity: promptOp, marginTop: 26, fontFamily: 'var(--mono)', fontSize: 28, color: 'var(--accent)', letterSpacing: '0.02em'}}>{scene.commentPrompt}</div>
        ) : null}
      </div>

      <SpecimenOverlay eyebrow={scene.eyebrow} />
    </AbsoluteFill>
  );
};
