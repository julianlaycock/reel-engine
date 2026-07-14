import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {BrollScene as BrollSceneType} from '../video-schema';
import {SpecimenOverlay} from './_overlay';
import {COLORS} from '@tokens/tokens';

const IS_IMG = /\.(jpg|jpeg|png|webp|avif)$/i;

// Full-bleed B-roll behind the narration: a clip from public/clips/, cover-cropped
// to 9:16, slow Ken-Burns, with a legibility scrim (dark top/bottom + subtle brand
// tint) so keyword captions + headline stay readable. VO carries the audio (muted).
export const Broll: React.FC<{scene: BrollSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  // Crop in (default 1.22) so broadcast scoreboards/tickers at the frame edges are
  // pushed out; panY nudges the framing vertically.
  const base = scene.zoom ?? 1.22;
  const toZoom = scene.kenburns === false ? base : base + 0.1;
  const zoom = interpolate(frame, [0, durationInFrames], [base, toZoom], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const panY = scene.panY ?? 0;
  const trimBefore = scene.startFromMs ? Math.round((scene.startFromMs / 1000) * fps) : undefined;
  const ov = scene.overlay ?? 0.5;
  const top = Math.min(0.78, ov * 1.05);
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: COLORS.black}}>
      <AbsoluteFill style={{transform: `translateY(${panY}%) scale(${zoom})`}}>
        {IS_IMG.test(scene.src) ? (
          // Full-bleed PHOTO cover (Ken-Burns push). objectPosition lets a portrait
          // frame the face high; panX/panY nudge the crop.
          <Img
            src={staticFile(scene.src)}
            style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: (scene as {focus?: string}).focus ?? 'center 28%'}}
          />
        ) : (
          <OffthreadVideo
            src={staticFile(scene.src)}
            muted={scene.muted ?? true}
            trimBefore={trimBefore}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        )}
      </AbsoluteFill>
      {/* legibility scrim: darker top/bottom bands so chrome + captions read clean */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,${top}) 0%, rgba(0,0,0,${ov * 0.22}) 26%, rgba(0,0,0,${ov * 0.32}) 62%, rgba(0,0,0,${top}) 100%)`,
        }}
      />
      {/* subtle brand tint to bind the footage to the palette */}
      <AbsoluteFill style={{background: 'var(--accent)', opacity: 0.06, mixBlendMode: 'soft-light'}} />
      {/* footage overlays always render light + bright accent for contrast on the clip */}
      <div style={{position: 'absolute', inset: 0, ['--fg' as string]: COLORS.white, ['--muted' as string]: 'rgba(255,255,255,0.82)', ['--accent' as string]: `var(--accent-foot, ${COLORS.teal})`} as React.CSSProperties}>
        <SpecimenOverlay
          eyebrow={scene.eyebrow}
          headline={scene.headline}
          accentWords={scene.accentWords}
          sub={scene.sub}
          topPad={scene.textTop ?? 330}
          textCenter={(scene as {textCenter?: boolean}).textCenter}
          figure={(scene as {figure?: string}).figure}
          figureLabel={(scene as {figureLabel?: string}).figureLabel}
        />
      </div>
    </AbsoluteFill>
  );
};
