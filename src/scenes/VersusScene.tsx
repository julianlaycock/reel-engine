import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VersusScene as VersusSceneType} from '../video-schema';
import {accentPop, driftScale, fadeRise, pop} from '../animation';
import {Chrome} from './Chrome';
import '../style.css';

// Two contrasting figures: left (problem) enters, then right (payoff, red) pops in
// — the core tension beat. Staggered so it builds rather than appears at once.
export const VersusScene: React.FC<{
  scene: VersusSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const drift = driftScale(frame, durationInFrames);

  // Auto-fit the value type to the longest word so long values (e.g. "MINUTES")
  // never clip the column. Both sides share one size so the pair stays balanced.
  // Leading +/−/~ signs are near-full-width glyphs at display weights — count
  // them as an extra character or signed pairs ("+50%" vs "−70%") clip the frame.
  const effLen = (v: string) => v.length + (/^[+\-−~≈]/.test(v) ? 1 : 0);
  const longest = Math.max(effLen(scene.leftValue), effLen(scene.rightValue));
  const valueSize =
    longest <= 4 ? 170 : longest <= 5 ? 142 : longest <= 6 ? 120 : longest <= 7 ? 102 : longest <= 9 ? 82 : 68;

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
          <div className="mid mid-versus">
            <div className="vs-row">
              <div className="vs-col" style={fadeRise(frame, 12, 13)}>
                <div className="vs-value" style={{fontSize: valueSize}}>{scene.leftValue}</div>
                <div className="vs-label">{scene.leftLabel}</div>
              </div>
              <div className="vs-div" style={fadeRise(frame, 26, 10)}>
                vs
              </div>
              <div className="vs-col" style={pop(frame, 34, fps)}>
                <div
                  className="vs-value r"
                  style={{fontSize: valueSize, transform: accentPop(frame, 44)}}
                >
                  {scene.rightValue}
                </div>
                <div className="vs-label">{scene.rightLabel}</div>
              </div>
            </div>
            {scene.caption ? (
              <div className="sub vs-caption" style={fadeRise(frame, 54, 12)}>
                {scene.caption}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
