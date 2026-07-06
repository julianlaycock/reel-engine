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
  const value = interpolate(frame, [10, 10 + rollEnd], [from, scene.to], {
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
            <div className="counter-num" style={{transform: `scale(${land})`}}>
              {scene.prefix ?? ''}
              {display}
              {scene.suffix ? (
                <span className={`counter-suffix${scene.accent ? ' r' : ''}`}>
                  {scene.suffix}
                </span>
              ) : null}
            </div>
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
