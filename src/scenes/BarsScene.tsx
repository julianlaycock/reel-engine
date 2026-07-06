import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {Chrome} from './Chrome';
import {renderAccent} from '../accent';
import '../style.css';

const ease = Easing.bezier(0.16, 1, 0.3, 1);

// Data-viz device: horizontal animated bars (each grows to its value), staggered.
// A distinct look from the node-graph — for multi-stat comparisons.
export const BarsScene: React.FC<{scene: any; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const bars: Array<{label: string; value: number; display?: string; accent?: boolean}> = scene.bars ?? [];
  // Bar width is value/scaleMax. Default 100 keeps percentage bars (47, 31, …) working;
  // for non-% magnitudes (squad value, Elo) pass scaleMax so bars scale to the max.
  const scaleMax = scene.scaleMax ?? 100;

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : (
          <Chrome kicker={scene.kicker} kickerRight={scene.kickerRight} footerRight={scene.footerRight} />
        )}
        <div className="bars-stage">
          {scene.title ? <div className="bars-title">{scene.title}</div> : null}
          <div className="bars-list">
            {bars.map((b, i) => {
              const start = 14 + i * 13;
              const w = interpolate(frame, [start, start + 24], [0, b.value], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: ease,
              });
              const op = interpolate(frame, [start, start + 8], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <div className="bars-row" key={i} style={{opacity: op}}>
                  <div className="bars-rowtop">
                    <span className="bars-label" style={{fontFamily: 'var(--label-font), "Noto Color Emoji"', fontWeight: 600, letterSpacing: '-0.01em', textTransform: 'none'}}>{b.label}</span>
                    <span className="bars-val" style={{color: b.accent ? 'var(--accent)' : 'var(--fg)', fontFamily: 'var(--label-font)', fontVariantNumeric: 'tabular-nums', fontWeight: 700}}>{b.display ?? `${Math.round(w)}%`}</span>
                  </div>
                  <div className="bars-track" style={{background: 'var(--track, rgba(0,0,0,0.08))'}}>
                    <div className="bars-fill" style={{width: `${(w / scaleMax) * 100}%`, background: 'var(--accent)', opacity: b.accent ? 1 : 0.42, borderRadius: 'inherit'}} />
                  </div>
                </div>
              );
            })}
          </div>
          {scene.caption ? (
            <div className="bars-caption">{renderAccent(scene.caption, scene.accentWords)}</div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
