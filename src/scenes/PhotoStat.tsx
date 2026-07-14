import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {easePhysical, easeOutExpo, interp} from '../motion';
import {Chrome} from './Chrome';
import {COLORS, FONTS} from '@tokens/tokens';
import '../style.css';

// Photo + giant stat (photo-forward): the player photo bleeds off one side, a huge
// Anton number fills the rest, over the cream/london ground. The number SLAMS in
// (easePhysical), the photo pushes gently. For the data beats (7h18m, 8-1).
//   {kind:'photostat', img, focus?, side?:'right'|'left', eyebrow?, stat, statSub?,
//    caption?, durationInFrames}
export const PhotoStat: React.FC<{scene: any; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const side = scene.side ?? 'right';
  const z = interpolate(frame, [0, durationInFrames], [1.06, 1.14], {extrapolateRight: 'clamp'});
  const statScale = interp(frame, [8, 30], [0.6, 1], easePhysical);
  const statOp = interp(frame, [8, 18], [0, 1]);
  const capRise = interp(frame, [30, 44], [0, 1], easeOutExpo);
  const lines = String(scene.stat ?? '').split('\n');

  return (
    <AbsoluteFill style={{background: `var(--bg-mid, ${COLORS.photoPaper})`, overflow: 'hidden'}}>
      {/* THE CLIPPING (canon v2.2, founder pick D1, 2026-07-05): the screenshot as a
          hard-edged zine cutout — slight rotation, offset solid shadow, tape strip.
          Confined to the SAFE BAND (top 320 / bottom 560) so it never covers chrome
          or the footer meta line. The old gradient fade-out is retired. */}
      <div style={{position: 'absolute', top: 340, bottom: 580, [side]: 44, width: '54%', transform: `rotate(${side === 'right' ? -2.4 : 2.4}deg) scale(${z * 0.94})`, transformOrigin: 'center', border: '2px solid rgba(16,16,16,0.55)', boxShadow: `${side === 'right' ? -16 : 16}px 20px 0 rgba(16,16,16,0.32)`, overflow: 'hidden', background: COLORS.white}}>
        <Img src={staticFile(scene.img)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: scene.focus ?? 'center top'}} />
        <div style={{position: 'absolute', top: -12, left: 34, width: 120, height: 34, background: 'rgba(239,234,221,0.78)', transform: 'rotate(-13deg)', boxShadow: '0 2px 3px rgba(0,0,0,0.18)'}} />
      </div>

      {hideChrome ? null : <Chrome kicker={scene.kicker} footerRight={scene.footerRight} />}

      {/* giant stat */}
      <div style={{position: 'absolute', top: 300, [side === 'right' ? 'left' : 'right']: 70, maxWidth: 560}}>
        {scene.eyebrow ? (
          <div className="ed-eyebrow" style={{opacity: interp(frame, [0, 12], [0, 1]), marginBottom: 14}}>{scene.eyebrow}</div>
        ) : null}
        <div style={{fontFamily: FONTS.anton, fontSize: 200, lineHeight: 0.84, color: 'var(--accent)', transform: `scale(${statScale})`, transformOrigin: `${side === 'right' ? '0%' : '100%'} 50%`, opacity: statOp, letterSpacing: '-0.02em'}}>
          {lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        {scene.statSub ? (
          <div style={{fontFamily: FONTS.display, fontSize: 40, fontWeight: 800, color: 'var(--fg)', marginTop: 16, opacity: capRise, transform: `translateY(${(1 - capRise) * 14}px)`, maxWidth: 460, lineHeight: 1.05}}>{scene.statSub}</div>
        ) : null}
        {scene.caption ? (
          <div style={{fontFamily: FONTS.mono, fontSize: 26, color: 'var(--muted)', marginTop: 14, opacity: capRise, letterSpacing: '0.02em'}}>{scene.caption}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
