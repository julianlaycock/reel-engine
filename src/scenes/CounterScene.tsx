import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {CounterScene as CounterSceneType} from '../video-schema';
import {fadeRise, driftScale} from '../animation';
import {Chrome} from './Chrome';
import '../style.css';

export const CounterScene: React.FC<{
  scene: CounterSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const from = scene.from ?? 0;
  const decimals = scene.decimals ?? 0;

  // Number rolls up and decelerates into its final value (odometer feel).
  const rollEnd = Math.min(46, Math.round(durationInFrames * 0.5));
  const value = interpolate(frame, [10, 10 + rollEnd], [from, scene.to ?? 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const display = value.toFixed(decimals);
  const drift = driftScale(frame, durationInFrames);
  // Subtle punch as the number lands.
  const land = interpolate(frame, [10 + rollEnd - 6, 10 + rollEnd, 10 + rollEnd + 8], [1.04, 1.06, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Statement mode (treatment 05 language, 2026-07-08): a WORD replaces the
  // count-up as the giant focal. No odometer — it smooth-reveals (canon v2.5)
  // and lands with the same punch. Auto-fit so long statements ("MATCHED.")
  // never cross the 150px side margins: usable column = 1080 − 2×86 (.drift)
  // − 2×64 (.skin-americana .mid-counter pad → x150) = 780px; Tektur 900
  // uppercase runs ~0.7em/char, digits ~0.62, punctuation ~0.32.
  const word = scene.word;
  const wordEm = word
    ? [...word].reduce(
        (a, ch) =>
          a + (/[A-Za-z✓]/.test(ch) ? 0.7 : /[0-9]/.test(ch) ? 0.62 : /[+\-−~≈]/.test(ch) ? 0.6 : ch === ' ' ? 0.3 : 0.32),
        0,
      )
    : 0;
  const wordSize = word ? Math.min(380, Math.floor(780 / Math.max(wordEm, 0.62))) : undefined;
  const wordIn = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <div className="frame">
        <div className="drift" style={{transform: `scale(${drift})`}}>
          {hideChrome ? null : (
            <Chrome
              kicker={scene.kicker}
              kickerRight={scene.kickerRight}
              footerRight={scene.footerRight}
            />
          )}
          <div className="mid mid-counter">
            {scene.headline ? (
              <div className="counter-head" style={fadeRise(frame, 8, 12)}>
                {scene.headline}
              </div>
            ) : null}
            {word ? (
              <div
                className="counter-num counter-word"
                style={{
                  transform: `scale(${land}) translateY(${(1 - wordIn) * 26}px)`,
                  opacity: wordIn,
                  fontSize: wordSize,
                }}
              >
                {word}
                {scene.counterpoint ? (
                  <span className="counter-counterpoint">{scene.counterpoint}</span>
                ) : null}
              </div>
            ) : (
              <div className="counter-num" style={{transform: `scale(${land})`}}>
                {scene.prefix ?? ''}
                {display}
                {scene.suffix ? (
                  <span className={`counter-suffix${scene.accent ? ' r' : ''}`}>
                    {scene.suffix}
                  </span>
                ) : null}
              </div>
            )}
            {scene.sub ? (
              <div className="sub" style={fadeRise(frame, 10 + rollEnd, 12)}>
                {scene.sub}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
