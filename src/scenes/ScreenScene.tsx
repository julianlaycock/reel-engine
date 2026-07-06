import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {ScreenScene as ScreenSceneType} from '../video-schema';
import {drawX, fadeRise} from '../animation';
import '../style.css';

// A real screen recording embedded full-bleed inside the brand frame.
// Top/bottom meta bars match the card scenes so the cut reads as one piece.
export const ScreenScene: React.FC<{
  scene: ScreenSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Gentle Ken Burns so a held screen never reads as frozen (qa-video gate).
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const barOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ruleScale = drawX(frame, 0, 12);
  const trimBefore = scene.startFromMs
    ? Math.round((scene.startFromMs / 1000) * fps)
    : undefined;

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : (
          <div className="topbar" style={{opacity: barOpacity}}>
            <div className="top-rule" style={{transform: `scaleX(${ruleScale})`}} />
            <span className="meta">
              <span className="redmark" />
              {scene.kicker ?? 'the build'}
            </span>
            <span className="meta">{scene.kickerRight ?? 'live'}</span>
          </div>
        )}

        <div className="screen-stage">
          <div className="screen-panel" style={{transform: `scale(${zoom})`}}>
            <OffthreadVideo
              src={staticFile(scene.src)}
              muted={scene.muted ?? true}
              trimBefore={trimBefore}
              className="screen-video"
            />
          </div>
          {scene.label ? (
            <div className="screen-label" style={fadeRise(frame, 12, 12)}>
              {scene.label}
            </div>
          ) : null}
        </div>

        {hideChrome ? null : (
          <div className="botbar" style={{opacity: barOpacity}}>
            <span className="meta">caelithlabs.com</span>
            <span className="meta">{scene.footerRight ?? 'real build'}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
