import React from 'react';
import {
  AbsoluteFill,
  Easing,
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
  const kenBurns = interpolate(frame, [0, durationInFrames], [1, 1.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Targeted cinematic zoom (SPIKE 2026-07-18): when scene.zooms is set, ease
  // scale + focal point across the keyframes so the camera pushes into a click
  // region and pulls back — the Screen-Studio effect, in-engine. Falls back to
  // the gentle Ken Burns (center origin) when no zooms are given.
  const zooms = Array.isArray(scene.zooms) && scene.zooms.length > 0 ? scene.zooms : null;
  const ease = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)} as const;
  const panelTransform = zooms
    ? {
        transform: `scale(${interpolate(frame, zooms.map((z) => z.at), zooms.map((z) => z.scale), ease)})`,
        transformOrigin: `${interpolate(frame, zooms.map((z) => z.at), zooms.map((z) => z.xPct ?? 50), ease)}% ${interpolate(frame, zooms.map((z) => z.at), zooms.map((z) => z.yPct ?? 50), ease)}%`,
      }
    : {transform: `scale(${kenBurns})`};
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
          {/* screen-panel = the FIXED outer card (americana ink bezel). Inside,
              screen-clip is the FIXED viewport that carries the keyline + clips;
              only the video inside it zooms — so the frame + keyline never move. */}
          <div className="screen-panel">
            <div className="screen-clip">
              <OffthreadVideo
                src={staticFile(scene.src)}
                muted={scene.muted ?? true}
                trimBefore={trimBefore}
                className="screen-video"
                style={panelTransform}
              />
            </div>
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
