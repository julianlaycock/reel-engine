import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {easePhysical, interp} from '../motion';
import {ACCENTS, COLORS, FIELDS, FONTS} from '@tokens/tokens';

// Split-screen versus (photo-forward): two player photos stacked, each pushing in
// (Ken-Burns), names + scorelines rising, a VS badge popping in the seam. High
// energy, instantly readable. Photos slide in from opposite edges on entry.
//   {kind:'splitvs', topImg, botImg, topFocus?, botFocus?, topName, botName,
//    topSub?, botSub?, badge?, accent?, durationInFrames}
// EDITORIAL VARIANT (variant:"editorial") — the premium before/after in the
// americana print language (founder 2026-07-09: the VS/Anton/dark-full-bleed
// look isn't premium). Light paper field; the "before" is a small ghosted card,
// the "after" is the crisp hero card; a thin ink divider + verdict word replace
// the esports badge; Tektur/Workbench type in ink, no Ken-Burns. Calm, printed.
const EditorialSplit: React.FC<{scene: any}> = ({scene}) => {
  const frame = useCurrentFrame();
  const ink = FIELDS.ink.bg;
  const paper = scene.paper ?? ACCENTS.paper;
  const accent = scene.accent ?? ACCENTS.caretTeal;
  const settle = interp(frame, [4, 20], [0, 1], easePhysical);
  const after = interp(frame, [14, 32], [0, 1], easePhysical);
  const card = (img: string, focus: string): React.CSSProperties => ({
    backgroundImage: `url(${staticFile(img)})`,
    backgroundSize: 'cover',
    backgroundPosition: focus ?? 'center top',
  });
  const label: React.CSSProperties = {fontFamily: FONTS.workbench, fontSize: 26, letterSpacing: '0.04em', color: ink, textTransform: 'uppercase'};
  const sub: React.CSSProperties = {fontFamily: FONTS.plexMono, fontSize: 24, color: 'rgba(16,16,16,0.55)', marginTop: 6};
  return (
    <AbsoluteFill style={{background: paper}}>
      {/* BEFORE — small, ghosted, struck (the wrong way, demoted). 0.62 not
          0.45: the board render read borderline-illegible at 0.45 (founder
          catch 2026-07-09) — still clearly demoted vs the crisp after card. */}
      <div style={{position: 'absolute', left: 150, top: 400, width: 560, opacity: 0.62 * settle}}>
        <div style={{...label, display: 'flex', gap: 12, alignItems: 'center'}}>
          <span style={{color: ink}}>✗</span><span>{scene.topName}</span>
        </div>
        <div style={{...card(scene.topImg, scene.topFocus), width: 560, height: 232, marginTop: 14, filter: 'grayscale(0.4)', border: '1px solid rgba(16,16,16,0.25)'}} />
        {scene.topSub ? <div style={{...sub, textDecoration: 'line-through'}}>{scene.topSub}</div> : null}
      </div>

      {/* verdict rule — a thin ink hairline + a small word, no badge */}
      <div style={{position: 'absolute', left: 150, right: 150, top: 760, opacity: settle}}>
        <div style={{height: 1.5, background: 'rgba(16,16,16,0.28)'}} />
        <div style={{...label, color: accent, marginTop: 10}}>instead ↓</div>
      </div>

      {/* AFTER — the crisp hero card (the right way) */}
      <div style={{position: 'absolute', left: 150, top: 840, width: 780, opacity: after, transform: `translateY(${(1 - after) * 18}px)`}}>
        <div style={{...label, display: 'flex', gap: 12, alignItems: 'center', fontSize: 30}}>
          <span style={{color: accent}}>✓</span><span>{scene.botName}</span>
        </div>
        <div style={{...card(scene.botImg, scene.botFocus), width: 780, height: 300, marginTop: 14, border: `2px solid ${ink}`, boxShadow: '14px 14px 0 rgba(16,16,16,0.9)'}} />
        {scene.botSub ? <div style={{...sub, color: 'rgba(16,16,16,0.62)'}}>{scene.botSub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

export const SplitVs: React.FC<{scene: any; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const accent = scene.accent ?? COLORS.splitRed;
  if (scene.variant === 'editorial') return <EditorialSplit scene={scene} />;

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
    <AbsoluteFill style={{background: COLORS.splitDark, overflow: 'hidden'}}>
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
      <div style={{position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${badge})`, zIndex: 8, width: 132, height: 132, borderRadius: '50%', background: accent, border: `5px solid ${COLORS.white}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.4)'}}>
        <span style={{fontFamily: FONTS.anton, fontSize: 62, color: COLORS.white, letterSpacing: '0.02em'}}>{scene.badge ?? 'VS'}</span>
      </div>

      {/* top name/score — below the persistent masthead (~320px), inside the
          150px sides (sides-150 law — labels are must-read text, only the
          full-bleed IMAGES are band-exempt texture). */}
      <div style={{position: 'absolute', top: 360, left: 150, right: 150, zIndex: 7, opacity: t1, transform: `translateY(${(1 - t1) * 16}px)`}}>
        <div style={{fontFamily: FONTS.anton, fontSize: 78, color: COLORS.white, textTransform: 'uppercase', lineHeight: 0.9}}>{scene.topName}</div>
        {scene.topSub ? <div style={{fontFamily: FONTS.plexMono, fontSize: 30, color: accent, marginTop: 10, letterSpacing: '0.04em'}}>{scene.topSub}</div> : null}
      </div>
      {/* bottom name/score — anchored BELOW the seam (mirrors the top label
          below the chrome) so the platform zone, caption band (1300) and footer
          band (1380) stay clear of label text. Was bottom:240 (~y1560, inside
          the bottom-500 platform overlay) — founder conform call 2026-07-09. */}
      <div style={{position: 'absolute', top: 1050, left: 150, right: 150, zIndex: 7, opacity: t2, transform: `translateY(${(1 - t2) * 16}px)`}}>
        <div style={{fontFamily: FONTS.anton, fontSize: 78, color: COLORS.white, textTransform: 'uppercase', lineHeight: 0.9}}>{scene.botName}</div>
        {scene.botSub ? <div style={{fontFamily: FONTS.plexMono, fontSize: 30, color: COLORS.splitMutedBlue, marginTop: 10, letterSpacing: '0.04em'}}>{scene.botSub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
