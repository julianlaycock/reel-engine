import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import type {QuoteScene as QuoteSceneType} from '../video-schema';
import {fadeRise, driftScale} from '../animation';
import {Chrome} from './Chrome';
import '../style.css';

export const QuoteScene: React.FC<{scene: QuoteSceneType; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const drift = driftScale(frame, scene.durationInFrames);

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : <Chrome />}
        <div className="qt-stage" style={{transform: `scale(${drift})`}}>
          {scene.eyebrow ? (
            <div className="ed-eyebrow" style={fadeRise(frame, 2, 12)}>
              {scene.eyebrow}
            </div>
          ) : null}

          <div className="qt-quote" style={fadeRise(frame, 8, 16)}>
            <span className="qt-mark">“</span>
            {scene.quote}
            <span className="qt-mark">”</span>
          </div>

          <div className="qt-rule" style={fadeRise(frame, 22, 12)} />

          <div className="qt-attr" style={fadeRise(frame, 28, 12)}>
            <span className="qt-logo">
              {scene.logo ? (
                <Img src={staticFile(scene.logo)} className="qt-logo-img" />
              ) : (
                <span className="qt-logo-text">{scene.logoText ?? '·'}</span>
              )}
            </span>
            <span className="qt-attr-text">
              <span className="qt-attr-main">{scene.attribution}</span>
              {scene.attributionSub ? <span className="qt-attr-sub">{scene.attributionSub}</span> : null}
            </span>
          </div>

          {scene.thumb ? (
            <div className="qt-thumb-wrap" style={fadeRise(frame, 36, 14)}>
              <Img src={staticFile(scene.thumb)} className="qt-thumb" />
              <span className="qt-thumb-cap">the source</span>
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
