import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {easePhysical, interp} from '../motion';

// Split-screen versus (photo-forward): two player photos stacked, each pushing in
// (Ken-Burns), names + scorelines rising, a VS badge popping in the seam. High
// energy, instantly readable. Photos slide in from opposite edges on entry.
//   {kind:'splitvs', topImg, botImg, topFocus?, botFocus?, topName, botName,
//    topSub?, botSub?, badge?, accent?, durationInFrames}
export const SplitVs: React.FC<{scene: any; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const accent = scene.accent ?? '#E0431F';

  const enter = spring({frame, fps, config: {damping: 16, stiffness: 90}});
  const topX = interpolate(enter, [0, 1], [-120, 0]);
  const botX = interpolate(enter, [0, 1], [120, 0]);
  const zTop = interpolate(frame, [0, durationInFrames], [1.08, 1.16], {extrapolateRight: 'clamp'});
  const zBot = interpolate(frame, [0, durationInFrames], [1.16, 1.08], {extrapolateRight: 'clamp'});
  const badge = interp(frame, [14, 30], [0, 1], easePhysical);
  const t1 = interp(frame, [22, 36], [0, 1]);
  const t2 = interp(frame, [30, 44], [0, 1]);

  const half: React.CSSProperties = {position: 'absolute', left: 0, right: 0, height: '50%', overflow: 'hidden'};
  const scrim = (dir: number): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(${dir}deg, rgba(12,14,24,0.15) 0%, rgba(12,14,24,0.55) 62%, rgba(12,14,24,0.85) 100%)`,
  });

  return (
    <AbsoluteFill style={{background: '#0C0E18', overflow: 'hidden'}}>
      <div style={{...half, top: 0, transform: `translateX(${topX}px)`}}>
        <AbsoluteFill style={{transform: `scale(${zTop})`}}>
          <Img src={staticFile(scene.topImg)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: scene.topFocus ?? 'center 30%'}} />
        </AbsoluteFill>
        <div style={scrim(180)} />
      </div>
      <div style={{...half, bottom: 0, transform: `translateX(${botX}px)`}}>
        <AbsoluteFill style={{transform: `scale(${zBot})`}}>
          <Img src={staticFile(scene.botImg)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: scene.botFocus ?? 'center 30%'}} />
        </AbsoluteFill>
        <div style={scrim(0)} />
      </div>

      {/* diagonal seam accent line */}
      <div style={{position: 'absolute', top: '50%', left: 0, right: 0, height: 4, background: accent, transform: 'translateY(-2px)', zIndex: 6, opacity: 0.9}} />

      {/* VS badge */}
      <div style={{position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${badge})`, zIndex: 8, width: 132, height: 132, borderRadius: '50%', background: accent, border: '5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>
        <span style={{fontFamily: '"Anton", sans-serif', fontSize: 62, color: '#fff', letterSpacing: '0.02em'}}>{scene.badge ?? 'VS'}</span>
      </div>

      {/* top name/score — below the persistent masthead (~320px), inside the
          150px sides (sides-150 law — labels are must-read text, only the
          full-bleed IMAGES are band-exempt texture). */}
      <div style={{position: 'absolute', top: 360, left: 150, right: 150, zIndex: 7, opacity: t1, transform: `translateY(${(1 - t1) * 16}px)`}}>
        <div style={{fontFamily: '"Anton", sans-serif', fontSize: 78, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9}}>{scene.topName}</div>
        {scene.topSub ? <div style={{fontFamily: '"IBM Plex Mono", monospace', fontSize: 30, color: accent, marginTop: 10, letterSpacing: '0.04em'}}>{scene.topSub}</div> : null}
      </div>
      {/* bottom name/score — anchored BELOW the seam (mirrors the top label
          below the chrome) so the platform zone, caption band (1300) and footer
          band (1380) stay clear of label text. Was bottom:240 (~y1560, inside
          the bottom-500 platform overlay) — founder conform call 2026-07-09. */}
      <div style={{position: 'absolute', top: 1050, left: 150, right: 150, zIndex: 7, opacity: t2, transform: `translateY(${(1 - t2) * 16}px)`}}>
        <div style={{fontFamily: '"Anton", sans-serif', fontSize: 78, color: '#fff', textTransform: 'uppercase', lineHeight: 0.9}}>{scene.botName}</div>
        {scene.botSub ? <div style={{fontFamily: '"IBM Plex Mono", monospace', fontSize: 30, color: '#cdd3e6', marginTop: 10, letterSpacing: '0.04em'}}>{scene.botSub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
