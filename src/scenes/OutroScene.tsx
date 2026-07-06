import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import type {OutroScene as OutroSceneType} from '../video-schema';
import {fadeRise, driftScale} from '../animation';
import {Chrome} from './Chrome';
import '../style.css';

// Closing credibility beat. Renders official partner logos when provided
// (public/logos/*), else clean text badges so it always looks finished.
export const OutroScene: React.FC<{
  scene: OutroSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const drift = driftScale(frame, scene.durationInFrames);

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : (
          <Chrome
            kicker={scene.kicker}
            kickerRight={scene.kickerRight}
            footerRight={scene.footerRight}
          />
        )}

        <div className="outro-stage" style={{transform: `scale(${drift})`}}>
          <div className="outro-kicker" style={fadeRise(frame, 8, 12)}>
            <span className="redmark" />
            {scene.title ?? 'official certified partner'}
          </div>

          <div className="outro-badges">
            {scene.partners.map((p, i) => (
              <div key={i} className="outro-badge" style={fadeRise(frame, 22 + i * 10, 12)}>
                {p.logo ? (
                  <Img src={staticFile(p.logo)} className="outro-logo" />
                ) : (
                  <span className="outro-badge-name">{p.name}</span>
                )}
                {p.sub ? <span className="outro-badge-sub">{p.sub}</span> : null}
              </div>
            ))}
          </div>

          {scene.tagline ? (
            <div
              className="outro-tagline"
              style={fadeRise(frame, 30 + scene.partners.length * 10, 12)}
            >
              {scene.tagline}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
