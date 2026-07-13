import React from 'react';
import {AbsoluteFill, Easing} from 'remotion';
import {TransitionSeries, springTiming, linearTiming} from '@remotion/transitions';
import type {TransitionPresentation, TransitionTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {CameraMotionBlur} from '@remotion/motion-blur';
import type {Scene, VideoProps} from './video-schema';
import {SceneBody, amFieldVars, AM_FIELDS} from './Video';
import {easeOutExpo} from './motion';
import './fonts';
import './style.css';

// ---------------------------------------------------------------------------
// TransitionDemo — a FOUNDER-REVIEW composition that renders two REAL Vektor
// scenes with a truly-COUPLED (overlapping) premium transition between them,
// via @remotion/transitions (TransitionSeries) + @remotion/motion-blur. This
// is the artifact the founder reviews; the production `Video` pipeline exposes
// the same 4 as selectable `transition` enum values (see SceneEnvelope).
// ---------------------------------------------------------------------------

export type TransitionVariant = 'spring-slide' | 'whip' | 'luma-wipe' | 'overshoot';

// Demo timing: each scene held ~2.2s, transition overlaps in the middle so a
// ~3s clip spans the whole hand-off.
export const DEMO_A = 66;
export const DEMO_B = 66;

const FIELD_BG = (field?: string) => AM_FIELDS[field ?? '']?.bg ?? '#EFEADD';

// Map the per-video brand object → CSS custom properties (the subset the
// editorial/field beats consume). Mirrors the mapping inside <Video/>.
const brandToVars = (brand: Record<string, string> = {}): React.CSSProperties =>
  ({
    ...(brand.accent ? {'--accent': brand.accent} : {}),
    ...(brand.accentFootage ? {'--accent-foot': brand.accentFootage} : {}),
    ...(brand.fg ? {'--fg': brand.fg} : {}),
    ...(brand.display ? {'--display': brand.display} : {}),
    ...(brand.bgTop ? {'--bg-top': brand.bgTop} : {}),
    ...(brand.bgMid ? {'--bg-mid': brand.bgMid} : {}),
    ...(brand.bgBot ? {'--bg-bot': brand.bgBot} : {}),
    ...(brand.mono ? {'--mono': brand.mono} : {}),
    ...(brand.labelFont ? {'--label-font': brand.labelFont} : {}),
    ...(brand.muted ? {'--muted': brand.muted} : {}),
    ...(brand.metaFont ? {'--meta-font': brand.metaFont} : {}),
    ...(brand.metaTransform ? {'--meta-transform': brand.metaTransform} : {}),
    ...(brand.metaSpacing ? {'--meta-spacing': brand.metaSpacing} : {}),
    ...(brand.hairline ? {'--hairline': brand.hairline} : {}),
    ...(brand.panelCard ? {'--panel-card': brand.panelCard} : {}),
    ...(brand.panelTitle ? {'--panel-title': brand.panelTitle} : {}),
    ...(brand.panelDoc ? {'--panel-doc': brand.panelDoc} : {}),
    ...(brand.panelBorder ? {'--panel-border': brand.panelBorder} : {}),
    ...(brand.panelBar ? {'--panel-bar': brand.panelBar} : {}),
    ...(brand.panelBarBorder ? {'--panel-bar-border': brand.panelBarBorder} : {}),
    ...(brand.panelDot ? {'--panel-dot': brand.panelDot} : {}),
  } as React.CSSProperties);

// --- Custom presentations -------------------------------------------------

// 3 — LUMA-WIPE: reveal the incoming scene through a soft luminance mask sweep;
// the outgoing scene just holds beneath (no flat opacity dip).
const LumaWipe: React.FC<{presentationProgress: number; presentationDirection: string; children: React.ReactNode}> = ({
  presentationProgress,
  presentationDirection,
  children,
}) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  const p = presentationProgress;
  const feather = 24;
  const edge = -feather + p * (100 + feather * 2);
  const mask = `linear-gradient(112deg, #000 ${edge - feather}%, transparent ${edge}%)`;
  return <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask}}>{children}</AbsoluteFill>;
};
const lumaWipe = (): TransitionPresentation<Record<string, unknown>> => ({
  component: LumaWipe as never,
  props: {},
});

// 4 — OVERSHOOT: incoming fades in on easeOutExpo + scales up with a spring
// overshoot (springTiming feeds a progress that briefly exceeds 1).
const Overshoot: React.FC<{presentationProgress: number; presentationDirection: string; children: React.ReactNode}> = ({
  presentationProgress,
  presentationDirection,
  children,
}) => {
  const p = presentationProgress;
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{opacity: Math.max(0, 1 - p * 1.5)}}>{children}</AbsoluteFill>;
  }
  const c = Math.min(1, Math.max(0, p));
  const scale = 0.9 + p * 0.1; // >1 at overshoot, settles to 1
  return (
    <AbsoluteFill style={{opacity: easeOutExpo(c), transform: `scale(${scale})`, transformOrigin: '50% 46%'}}>
      {children}
    </AbsoluteFill>
  );
};
const overshoot = (): TransitionPresentation<Record<string, unknown>> => ({
  component: Overshoot as never,
  props: {},
});

// --- Variant → {timing, presentation, motion-blur} ------------------------
export const buildTransition = (
  variant: TransitionVariant,
): {timing: TransitionTiming; presentation: TransitionPresentation<Record<string, unknown>>; blur: boolean} => {
  switch (variant) {
    case 'spring-slide':
      // COUPLED slide: slide() pushes the outgoing scene out to the left as the
      // incoming springs in from the right — one continuous momentum hand-off,
      // no cross-dissolve. springTiming gives the overshoot/settle.
      return {
        timing: springTiming({config: {damping: 26, stiffness: 100, mass: 1.1}, durationInFrames: 30}),
        presentation: slide({direction: 'from-right'}) as never,
        blur: false,
      };
    case 'whip':
      // REAL whip: slide() moves BOTH scenes along the pan axis on a slow→fast→
      // slow speed ramp; CameraMotionBlur turns that motion into directional
      // motion blur (heavy at mid-transition, clean at both ends).
      return {
        timing: linearTiming({durationInFrames: 18, easing: Easing.bezier(0.85, 0, 0.15, 1)}),
        presentation: slide({direction: 'from-right'}) as never,
        blur: true,
      };
    case 'luma-wipe':
      return {
        timing: linearTiming({durationInFrames: 28, easing: Easing.inOut(Easing.cubic)}),
        presentation: lumaWipe(),
        blur: false,
      };
    case 'overshoot':
    default:
      return {
        timing: springTiming({config: {damping: 11, stiffness: 110, mass: 0.9}, durationInFrames: 28}),
        presentation: overshoot(),
        blur: false,
      };
  }
};

export const demoDuration = (variant: TransitionVariant, fps: number): number =>
  DEMO_A + DEMO_B - buildTransition(variant).timing.getDurationInFrames({fps});

type DemoProps = {video: VideoProps['video']; variant: TransitionVariant};

export const TransitionDemo: React.FC<DemoProps> = ({video, variant}) => {
  const a = video.scenes[0] as Scene & {field?: string};
  const b = video.scenes[1] as Scene & {field?: string};
  const brand = (video as {brand?: Record<string, string>}).brand;
  const {timing, presentation, blur} = buildTransition(variant);

  const wrap = (scene: Scene & {field?: string}, frames: number) => (
    <AbsoluteFill style={{...amFieldVars(scene.field), backgroundColor: FIELD_BG(scene.field)}}>
      <SceneBody scene={scene} frames={frames} hideChrome={true} />
    </AbsoluteFill>
  );

  const series = (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={DEMO_A}>{wrap(a, DEMO_A)}</TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={timing} presentation={presentation} />
      <TransitionSeries.Sequence durationInFrames={DEMO_B}>{wrap(b, DEMO_B)}</TransitionSeries.Sequence>
    </TransitionSeries>
  );

  return (
    <AbsoluteFill
      className="skin-americana"
      style={{backgroundColor: brand?.bgBot ?? '#EFEADD', ...brandToVars(brand)}}
    >
      {blur ? (
        <CameraMotionBlur shutterAngle={220} samples={12}>
          {series}
        </CameraMotionBlur>
      ) : (
        series
      )}
    </AbsoluteFill>
  );
};
