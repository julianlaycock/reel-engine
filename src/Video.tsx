import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {TransitionSeries} from '@remotion/transitions';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {buildTransition, type TransitionVariant} from './TransitionDemo';
import {easeOutExpo, easeInOut} from './motion';
import type {Scene, VideoProps} from './video-schema';
import {sceneFrames} from './video-schema';
import {AnimatedCard} from './AnimatedCard';
import {ScreenScene} from './scenes/ScreenScene';
import {CounterScene} from './scenes/CounterScene';
import {VersusScene} from './scenes/VersusScene';
import {EditorialScene} from './scenes/EditorialScene';
import {NodeGraphScene} from './scenes/NodeGraphScene';
import {OutroScene} from './scenes/OutroScene';
import {BarsScene} from './scenes/BarsScene';
import {PretextScene} from './scenes/PretextScene';
import {AgentScene} from './scenes/AgentScene';
import {FlowGraphScene} from './scenes/FlowGraphScene';
import {LoopGraphScene} from './scenes/LoopGraphScene';
import {FieldGridScene} from './scenes/FieldGridScene';
import {QuoteScene} from './scenes/QuoteScene';
import {TimelineScene} from './scenes/TimelineScene';
import {Atmosphere} from './scenes/Atmosphere';
import {PersistentChrome} from './scenes/PersistentChrome';
import {Generative} from './scenes/Generative';
import {Heatmap3D} from './scenes/Heatmap3D';
import {Broll} from './scenes/Broll';
import {WinProb} from './scenes/WinProb';
import {Formula} from './scenes/Formula';
import {MonteCarlo} from './scenes/MonteCarlo';
import {Plinko} from './scenes/Plinko';
import {GuessReveal} from './scenes/GuessReveal';
import {BarRace} from './scenes/BarRace';
import {ShotMap} from './scenes/ShotMap';
import {RadarScene} from './scenes/RadarScene';
import {Poisson2D} from './scenes/Poisson2D';
import {Outro} from './scenes/Outro';
import {Flow} from './scenes/Flow';
import {GradeOverlay} from './scenes/GradeOverlay';
import {hexLerp} from './palettes';
import {ClaudeMascot, type MascotConfig} from './scenes/ClaudeMascot';
import {HeroWordScene} from './scenes/HeroWordScene';
import {PosterScene} from './scenes/PosterScene';
import {SplitVs} from './scenes/SplitVs';
import {PhotoStat} from './scenes/PhotoStat';
import {TerminalScene} from './scenes/TerminalScene';
import {GradientBackground} from './scenes/GradientBackground';
import {Captions} from './Captions';
import {AsciiFieldScene} from './scenes/AsciiFieldScene';
import {FIELDS, type FieldTokens} from '@tokens/tokens';
import './fonts';
import './style.css';

// Americana Cut skin (Vektor, locked 2026-07-04) — flat field colors per beat.
// The video.json author sets a per-scene `"field"`; light fields carry ink text,
// signal/ink fields carry paper text. Values are GENERATED from the canon
// (vektor/canon/americana-tokens.json → gen-tokens.mjs → @tokens/tokens).
export const AM_FIELDS: Record<string, FieldTokens> = FIELDS;

export const amFieldVars = (field?: string): React.CSSProperties => {
  const f = AM_FIELDS[field ?? ''];
  if (!f) return {};
  return {
    '--bg-top': f.bg,
    '--bg-mid': f.bg,
    '--bg-bot': f.bg,
    '--fg': f.fg,
    '--muted': f.muted,
    '--hairline': f.hairline,
    '--panel-title': f.muted,
    '--panel-doc': f.fg,
  } as React.CSSProperties;
};

export const SceneBody: React.FC<{scene: Scene; frames: number; hideChrome: boolean}> = ({
  scene,
  frames,
  hideChrome,
}) => {
  if (scene.kind === 'generative') {
    return <Generative scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'heatmap3d') {
    return <Heatmap3D scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'broll') {
    return <Broll scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'winprob') {
    return <WinProb scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'formula') {
    return <Formula scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'montecarlo') {
    return <MonteCarlo scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'plinko') {
    return <Plinko scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'guessreveal') {
    return <GuessReveal scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'barrace') {
    return <BarRace scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'shotmap') {
    return <ShotMap scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'radar') {
    return <RadarScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'poisson2d') {
    return <Poisson2D scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'outro2') {
    return <Outro scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'flow') {
    return <Flow scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'screen') {
    return <ScreenScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'counter') {
    return <CounterScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'versus') {
    return <VersusScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'editorial') {
    return <EditorialScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'asciiField') {
    return <AsciiFieldScene scene={scene} hideChrome={hideChrome} />;
  }
  if ((scene as {kind: string}).kind === 'hero') {
    return <HeroWordScene scene={scene} hideChrome={hideChrome} />;
  }
  if ((scene as {kind: string}).kind === 'poster') {
    return <PosterScene scene={scene} hideChrome={hideChrome} />;
  }
  if ((scene as {kind: string}).kind === 'splitvs') {
    return <SplitVs scene={scene} hideChrome={hideChrome} />;
  }
  if ((scene as {kind: string}).kind === 'photostat') {
    return <PhotoStat scene={scene} hideChrome={hideChrome} />;
  }
  if ((scene as {kind: string}).kind === 'terminal') {
    return <TerminalScene scene={scene as any} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'nodegraph') {
    return <NodeGraphScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'outro') {
    return <OutroScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'bars') {
    return <BarsScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'pretext') {
    return <PretextScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'agent') {
    return <AgentScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'flowgraph') {
    return <FlowGraphScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'loopgraph') {
    return <LoopGraphScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'fieldgrid') {
    return <FieldGridScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'quote') {
    return <QuoteScene scene={scene} hideChrome={hideChrome} />;
  }
  if (scene.kind === 'timeline') {
    return <TimelineScene scene={scene} hideChrome={hideChrome} />;
  }
  return <AnimatedCard card={scene.card} sceneDuration={frames} hideChrome={hideChrome} />;
};

// Virtual camera: a directed push-in / zoom-to-focus over a scene. `fx`/`fy` are
// the focal point (0-1) the camera moves toward; `toZoom` the end magnification.
// The persistent chrome lives outside this, so the FRAME stays put while the
// content pushes in — a clean "documentary camera over the graphic" feel.
const Camera: React.FC<{
  cam?: {fromZoom?: number; toZoom?: number; fx?: number; fy?: number};
  frames: number;
  maxZoom?: number;
  noEnter?: boolean;
  children: React.ReactNode;
}> = ({cam, frames, maxZoom, noEnter, children}) => {
  const frame = useCurrentFrame();
  if (!cam) return <>{children}</>;
  const zRaw = interpolate(frame, [0, Math.max(frames - 1, 1)], [cam.fromZoom ?? 1, cam.toZoom ?? 1.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });
  // Band guard (wireframes v2 — 2026-07-09): on band-governed scenes the push
  // is capped so scaled content can never cross the chrome band above or the
  // caption/footer bands below. 1.06 keeps a full 360..1260 stack inside the
  // 320 chrome edge and the 1300 caption band at every frame.
  const z = maxZoom ? Math.min(zRaw, maxZoom) : zRaw;
  // Soft entrance (dissolve-up) so camera scenes transition instead of hard-cutting.
  // When the scene rides a coupled TransitionSeries slide (noEnter), the slide IS
  // the entrance — a 7-frame opacity fade would make the content ghost in while it
  // slides, fighting the coupling; render at full opacity from frame 0 instead.
  const enter = noEnter ? 1 : interpolate(frame, [0, 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${z})`,
        transformOrigin: `${(cam.fx ?? 0.5) * 100}% ${(cam.fy ?? 0.5) * 100}%`,
        opacity: enter,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// Gentle dissolve envelope per scene — content eases in and out so consecutive
// scenes cross-dissolve through the background instead of hard-cutting. The
// continuous VO track runs across the cut (an L-cut feel). Restraint = elegant.
const SceneEnvelope: React.FC<{frames: number; first: boolean; enter?: string; morph?: boolean; ride?: {enter: boolean; exit: boolean}; children: React.ReactNode}> = ({
  frames,
  first,
  enter = 'rise',
  morph = false,
  ride,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rid = React.useId().replace(/[:]/g, '');
  // COUPLED-RIDE (2026-07-14): the truly-overlapping premium transitions run in the
  // main `TransitionSeries` (buildTransition + slide()/CameraMotionBlur). When a
  // TransitionSeries.Transition slides this scene IN (ride.enter) the slide IS the
  // entrance, and when the NEXT scene's slide pushes this one OUT (ride.exit) the
  // slide IS the exit — so the internal envelope MUST NOT also fade/translate on a
  // ridden side or it cross-dissolves against the slide (the exact "look-alike" the
  // Approval Protocol forbids). Suppress the fighting side; keep the other.
  const rideEnter = ride?.enter ?? false;
  const rideExit = ride?.exit ?? false;
  // Americana motion law ("hard steps only"): `"transition": "cut"` = a true hard
  // cut — no envelope fades at all; the flat field color changes in one frame.
  if (enter === 'cut') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  // FRAME-ZERO LAW (canon v1.2.0): the opening scene renders at FULL opacity with
  // no entrance transform from frame 0 — the first frame must work as a static
  // thumbnail (TikTok decides in ~1s; a fade-in reads as an empty frame). If the
  // NEXT scene's coupled slide pushes it off (rideExit), hold to the end so the
  // slide has real content to push — no premature fade before the hand-off.
  if (first) {
    const outOp = rideExit
      ? 1
      : interpolate(frame, [frames - (morph ? 16 : 12), frames - (morph ? 6 : 0)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return <AbsoluteFill style={{opacity: outOp}}>{children}</AbsoluteFill>;
  }
  // A scene the coupled slide brings IN: present from frame 0 (the slide is the
  // entrance). Hold to the end if the next slide also pushes it out (rideExit),
  // else keep the normal outro fade so a following hard cut still reads. This
  // supersedes every internal premium/directional branch below for coupled beats.
  if (rideEnter) {
    const outOp = rideExit
      ? 1
      : interpolate(frame, [frames - 12, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return <AbsoluteFill style={{opacity: outOp}}>{children}</AbsoluteFill>;
  }
  // DOCTRINE COLOR-MORPH (canon v1.5.0, seam tightened 2026-07-04): scenes do NOT
  // cross-dissolve — content fades out fully, a SHORT (~6-frame) bare-canvas seam
  // shows while the palette lerps (Video-level), then the next scene rises in on
  // easeOutExpo (ty 18→0). Founder QA 2026-07-04: the original ~16–20-frame seam
  // read as dead air / a glitch at ≤45s pacing — VO narrated over an empty canvas.
  // No lateral slides (family never-do).
  // Curated transition mix (2026-07-13 consolidation): a scene that explicitly asks
  // for a distinct directional transition (whip/left/right/scale) renders THAT even
  // when global fx.morph is on — whip INTO punchy beats, morph seam on the calm ones.
  // Only the default/undirected scenes take the palette-morph bare-canvas seam.
  // spring-slide / whip-real are intentionally absent: they render as COUPLED
  // overlaps in the main TransitionSeries and exit at the rideEnter guard above,
  // never reaching this single-scene path (see the NOTE below).
  const directional =
    enter === 'whip' ||
    enter === 'left' ||
    enter === 'right' ||
    enter === 'scale' ||
    enter === 'luma-wipe' ||
    enter === 'overshoot';
  if (morph && !directional) {
    const op = Math.min(
      interpolate(frame, [2, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)}),
      rideExit ? 1 : interpolate(frame, [frames - 10, frames - 4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.5, 0, 0.75, 0)}),
    );
    const ty = interpolate(frame, [2, 14], [18, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
    return <AbsoluteFill style={{opacity: op, transform: `translateY(${ty}px)`}}>{children}</AbsoluteFill>;
  }
  const inN = 14;
  const outN = 12;
  const op = Math.min(
    interpolate(frame, [0, inN], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    rideExit ? 1 : interpolate(frame, [frames - outN, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  // === PREMIUM TRANSITIONS (2026-07-13) ===
  // NOTE (2026-07-14): the truly-COUPLED spring-slide / whip-real now render in the
  // main `TransitionSeries` (buildTransition + slide()/CameraMotionBlur) — see the
  // rideEnter guard above; those beats never fall through to the single-scene
  // approximations below. The branches here remain ONLY for non-coupled single-scene
  // enters (luma-wipe / overshoot / whip / left / right / scale) that do not request
  // an overlapping hand-off. (The old same-named spring-slide/whip-real single-scene
  // look-alikes are slated for deletion once the coupled render is founder-approved.)

  // 4 — OVERSHOOT: eased (easeOutExpo) opacity + a spring overshoot on the scale.
  if (enter === 'overshoot') {
    const opIn = interpolate(frame, [0, inN], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOutExpo});
    const opO = Math.min(opIn, interpolate(frame, [frames - outN, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
    const s = spring({frame, fps, config: {damping: 11, stiffness: 120, mass: 0.9}, durationInFrames: 24});
    const scale = interpolate(s, [0, 1], [0.9, 1]); // spring overshoots >1 then settles
    return <AbsoluteFill style={{opacity: opO, transform: `scale(${scale})`, transformOrigin: '50% 46%'}}>{children}</AbsoluteFill>;
  }

  // 3 — LUMA-WIPE: reveal through a soft luminance mask sweep (Sam-Kolder), no flat opacity dip.
  if (enter === 'luma-wipe') {
    const p = interpolate(frame, [0, inN + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
    const feather = 22;
    const edge = -feather + p * (100 + feather * 2);
    const mask = `linear-gradient(112deg, #000 ${edge - feather}%, transparent ${edge}%)`;
    const opOut = interpolate(frame, [frames - outN, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return <AbsoluteFill style={{opacity: opOut, WebkitMaskImage: mask, maskImage: mask}}>{children}</AbsoluteFill>;
  }

  // NOTE (2026-07-14): the single-scene 'spring-slide' and 'whip-real' approximations
  // that used to live here were DELETED when those transitions became truly coupled
  // in the main TransitionSeries (buildTransition, src/TransitionDemo.tsx). Keeping a
  // same-named look-alike here is exactly what the Approval Protocol forbids (rule 2:
  // one implementation), and check-goldens#transitions.coupled BLOCKS its return.
  // Coupled beats never reach this far — they exit at the rideEnter guard above.

  // Directional enter transition (preserves total duration — no TransitionSeries).
  const p = interpolate(frame, [0, inN + 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  let transform = `translateY(${(1 - p) * 36}px)`;
  let filter = '';
  if (enter === 'left') transform = `translateX(${(1 - p) * -130}px)`;
  else if (enter === 'right') transform = `translateX(${(1 - p) * 130}px)`;
  else if (enter === 'scale') transform = `scale(${0.93 + p * 0.07})`;
  else if (enter === 'whip') {
    transform = `translateX(${(1 - p) * -190}px)`;
    filter = `blur(${(1 - p) * 7}px)`;
  } else if (enter === 'none') transform = '';
  return <AbsoluteFill style={{opacity: op, transform, filter}}>{children}</AbsoluteFill>;
};

// Doctrine color-morph canvas: the root background lerps light→dark (dm) into and
// out of the video's dark palette beat(s). Rendered above the static bg, below the
// grid/scenes, so the bare seam between scenes shows the morph — not a dissolve.
const MorphCanvas: React.FC<{
  ranges: Array<[number, number]>;
  lightBg: string;
  darkBg: string;
}> = ({ranges, lightBg, darkBg}) => {
  const frame = useCurrentFrame();
  let dm = 0;
  for (const [s, e] of ranges) {
    const up = interpolate(frame, [s - 14, s + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1)});
    const down = interpolate(frame, [e - 10, e + 14], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1)});
    dm = Math.max(dm, Math.min(up, down));
  }
  return <AbsoluteFill style={{backgroundColor: hexLerp(lightBg, darkBg, dm)}} />;
};

// Dark-beat-aware grid: same dm ramp as MorphCanvas, applied to the grid line
// color so lines stay near-background on BOTH palettes (founder 2026-07-03:
// bright grid lines over the dark canvas hurt readability).
const MorphGrid: React.FC<{ranges: Array<[number, number]>; light: string; dark: string}> = ({ranges, light, dark}) => {
  const frame = useCurrentFrame();
  let dm = 0;
  for (const [s, e] of ranges) {
    const up = interpolate(frame, [s - 14, s + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1)});
    const down = interpolate(frame, [e - 10, e + 14], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1)});
    dm = Math.max(dm, Math.min(up, down));
  }
  // Founder 2026-07-03 (board F3A:B): the grid disappears entirely on the dark
  // beat — fade opacity with dm rather than tinting the lines.
  const ok = (v: string) => /^#[0-9a-f]{6}$/i.test(v);
  const line = ok(light) && ok(dark) ? hexLerp(light, dark, Math.min(1, dm * 1.4)) : dm > 0.5 ? dark : light;
  return <AbsoluteFill className="vk-grid" style={{['--hairline' as string]: line, opacity: 1 - dm}} />;
};

// Frame-gated CameraMotionBlur (2026-07-14): the whip-real transitions carry REAL
// motion blur (identical wrapper to TransitionDemo — shutterAngle 220, 12 samples),
// but the calm spring-slide seams must stay blur-free (matching the approved
// 1-spring-slide.mp4). Wrapping the whole TransitionSeries would blur BOTH, so we
// only mount CameraMotionBlur on the absolute frame windows a whip occupies. Each
// frame renders independently (headless capture), so toggling the wrapper per frame
// is deterministic and seamless — outside a whip window there is no motion to blur
// anyway, so the boundary is continuous.
const MotionBlurGate: React.FC<{windows: Array<[number, number]>; children: React.ReactNode}> = ({windows, children}) => {
  const frame = useCurrentFrame();
  const active = windows.some(([s, e]) => frame >= s && frame < e);
  return active ? (
    <CameraMotionBlur shutterAngle={220} samples={12}>
      {children}
    </CameraMotionBlur>
  ) : (
    <>{children}</>
  );
};

export const Video: React.FC<VideoProps> = ({video}) => {
  const {audio, captions, captionStyle, chrome} = video;
  const {fps} = useVideoConfig();
  const hasChrome = Boolean(chrome);
  const skin = video.skin ?? 'vmax';
  const americana = skin === 'americana';

  // Frame ranges of B-roll scenes — the persistent chrome hides over footage so
  // the clip reads clean (only the per-scene headline/eyebrow remain). Americana
  // law: dark beats (asciiField / beat:"dark") render NO chrome bar either.
  const chromeHideRanges: Array<[number, number]> = [];
  {
    let acc = 0;
    for (const s of video.scenes) {
      const f = sceneFrames(s);
      // Founder 2026-07-06: the black masthead shows on EVERY slide (incl. blue/dark
      // asciiField beats) for consistency — hidden only on full-bleed broll + the end card.
      const isEndcard = Boolean((s as {endCard?: unknown}).endCard);
      if (s.kind === 'broll' || isEndcard) chromeHideRanges.push([acc, acc + f]);
      acc += f;
    }
  }

  // Americana chrome data: per-beat section marker (Workbench, top-right) and
  // footer progress "NN / 06" — both advance with the current scene (progress
  // markers signal saveability, canon v1.7.1). One-Jacquard law checked here.
  // Wireframe contract v2 (founder 2026-07-08): each beat also carries its
  // RECEIPTS caption (rendered once, at the caption band y1300 — same pixel
  // position on every kind), a dark flag (signal/ink recoloring) and the
  // print-furniture gate (P2 registration ticks, middle slides only). The
  // asciiField dark beat keeps its own .am-credit chip as the receipts line,
  // so its `caption` is not lifted here (no double-render).
  const amBeats: Array<{from: number; to: number; marker?: string; no?: string; caption?: string; dark?: boolean; furniture?: boolean}> = [];
  if (americana) {
    let acc = 0;
    let jacquards = 0;
    video.scenes.forEach((s, si) => {
      const f = sceneFrames(s);
      const sc = s as {marker?: string; beatNo?: string; jacquardWord?: string; kind: string; caption?: string; field?: string; endCard?: unknown};
      const isEnd = Boolean(sc.endCard);
      const dark = sc.kind === 'asciiField' || sc.field === 'signal' || sc.field === 'ink';
      const middle = si > 0 && !isEnd && sc.kind !== 'broll';
      amBeats.push({
        from: acc,
        to: acc + f,
        marker: sc.marker,
        no: sc.beatNo,
        caption: sc.kind === 'asciiField' || isEnd ? undefined : sc.caption,
        dark,
        furniture: middle,
      });
      if (sc.kind === 'asciiField' && sc.jacquardWord) jacquards++;
      acc += f;
    });
    if (jacquards > 1) {
      // eslint-disable-next-line no-console
      console.warn(`americana law: exactly ONE Jacquard word per video — found ${jacquards}`);
    }
  }

  // Per-video brand override: sets the CSS custom properties on the root so the
  // same engine renders any brand (defaults in :root = Caelith Labs).
  const brand = (video as {brand?: Record<string, string>}).brand;
  const brandVars: React.CSSProperties = brand
    ? ({
        '--accent': brand.accent,
        ...(brand.accentFootage ? {['--accent-foot']: brand.accentFootage} : {}),
        '--fg': brand.fg,
        ...(brand.display ? {'--display': brand.display} : {}),
        '--bg-top': brand.bgTop,
        '--bg-mid': brand.bgMid,
        '--bg-bot': brand.bgBot,
        ...(brand.mono ? {'--mono': brand.mono} : {}),
        ...(brand.capPill ? {'--cap-pill': brand.capPill} : {}),
        ...(brand.markW ? {'--mark-w': brand.markW} : {}),
        ...(brand.markH ? {'--mark-h': brand.markH} : {}),
        ...(brand.labelFont ? {'--label-font': brand.labelFont} : {}),
        ...(brand.muted ? {'--muted': brand.muted} : {}),
        ...(brand.metaFont ? {'--meta-font': brand.metaFont} : {}),
        ...(brand.metaTransform ? {'--meta-transform': brand.metaTransform} : {}),
        ...(brand.metaSpacing ? {'--meta-spacing': brand.metaSpacing} : {}),
        ...(brand.hairline ? {'--hairline': brand.hairline} : {}),
        ...(brand.nodeBg ? {'--node-bg': brand.nodeBg} : {}),
        ...(brand.ngEdge ? {'--ng-edge': brand.ngEdge} : {}),
        ...(brand.panel ? {'--panel': brand.panel} : {}),
        ...(brand.track ? {'--track': brand.track} : {}),
        ...(brand.panelCard ? {'--panel-card': brand.panelCard} : {}),
        ...(brand.panelBorder ? {'--panel-border': brand.panelBorder} : {}),
        ...(brand.panelBar ? {'--panel-bar': brand.panelBar} : {}),
        ...(brand.panelBarBorder ? {'--panel-bar-border': brand.panelBarBorder} : {}),
        ...(brand.panelDot ? {'--panel-dot': brand.panelDot} : {}),
        ...(brand.panelTitle ? {'--panel-title': brand.panelTitle} : {}),
        ...(brand.panelDoc ? {'--panel-doc': brand.panelDoc} : {}),
        // Generic escape hatch: brand.vars = {"ag-flag": "#d62828", ...} sets any
        // --custom-property without needing a named key here.
        ...((brand as unknown as {vars?: Record<string, string>}).vars
          ? Object.fromEntries(
              Object.entries((brand as unknown as {vars: Record<string, string>}).vars).map(([k, v]) => [`--${k}`, v]),
            )
          : {}),
      } as React.CSSProperties)
    : {};

  const fx = (video as {fx?: {orbs?: boolean; grain?: boolean; grade?: boolean; grid?: boolean; gradientBg?: boolean; morph?: boolean}}).fx;
  const orb2 = brand?.orb2;

  // Doctrine color-morph: frame ranges of scenes marked `"beat": "dark"` + the
  // dark palette tokens (brand.dark, falling back to a neutral near-black).
  const darkTokens = (brand as unknown as {dark?: Record<string, string>})?.dark;
  const darkRanges: Array<[number, number]> = [];
  if (fx?.morph) {
    let acc = 0;
    for (const s of video.scenes) {
      const f = sceneFrames(s);
      if ((s as {beat?: string}).beat === 'dark') darkRanges.push([acc, acc + f]);
      acc += f;
    }
  }
  const darkVars: React.CSSProperties = darkTokens
    ? ({
        '--fg': darkTokens.fg,
        '--accent': darkTokens.accent,
        ...(darkTokens.muted ? {'--muted': darkTokens.muted} : {}),
        ...(darkTokens.hairline ? {'--hairline': darkTokens.hairline} : {}),
        ...(darkTokens.panelCard ? {'--panel-card': darkTokens.panelCard} : {}),
        ...(darkTokens.panelDoc ? {'--panel-doc': darkTokens.panelDoc} : {}),
        ...(darkTokens.panelTitle ? {'--panel-title': darkTokens.panelTitle} : {}),
        ...(darkTokens.panelBar ? {'--panel-bar': darkTokens.panelBar} : {}),
      } as React.CSSProperties)
    : {};

  // === COUPLED TRANSITION PLAN (2026-07-14) ==================================
  // The scenes render in a `TransitionSeries` so premium `spring-slide`/`whip-real`
  // beats OVERLAP (outgoing + incoming on screen at once) — the founder-approved
  // hand-off from `TransitionDemo`, reusing the SAME `buildTransition()` (Approval
  // Protocol rule 2: one implementation, no look-alikes).
  //
  // TransitionSeries eats `D` frames per transition into the overlap, which would
  // shift every later scene EARLIER and desync the single straight-through VO track
  // (Audio, below) plus the chrome/caption/morph ranges (all keyed to the natural
  // cumulative scene starts). To keep every scene's ABSOLUTE start put, each
  // sequence is padded by the overlap of the transition that FOLLOWS it
  // (L_i = naturalFrames_i + D_{i+1}). Algebra: start_i = Σ_{j<i}L_j − Σ_{k≤i}D_k =
  // Σ_{j<i} naturalFrames_j — identical to the old sequential `Series`, and the
  // total stays `totalFrames(video)`. The extra pad is exactly the tail the
  // outgoing scene needs to still be on-screen while the next one slides in.
  const COUPLED: Record<string, TransitionVariant> = {'spring-slide': 'spring-slide', 'whip-real': 'whip'};
  const scenePlan = video.scenes.map((scene, i) => {
    const variant = COUPLED[(scene as {transition?: string}).transition ?? ''];
    // A transition element sits BEFORE scene i (i≥1) when scene i asks for a coupled
    // enter. Its overlap D and blur flag come straight from buildTransition().
    const t = i >= 1 && variant ? buildTransition(variant) : undefined;
    const D = t ? t.timing.getDurationInFrames({fps}) : 0;
    return {scene, variant, transition: t, D, natural: sceneFrames(scene)};
  });
  const n = scenePlan.length;
  // Whip transitions carry REAL CameraMotionBlur (exactly like TransitionDemo). The
  // spring-slide seams must stay blur-free (the approved 1-spring-slide.mp4 has no
  // blur), so instead of wrapping the whole series we gate the blur to just the
  // absolute frame windows a whip transition occupies. At most one transition is
  // ever active at a time (scenes don't otherwise overlap), so a whip window never
  // coincides with a spring-slide — the gate isolates blur per transition class.
  const whipWindows: Array<[number, number]> = [];
  {
    let orig = 0;
    scenePlan.forEach((p, i) => {
      if (i >= 1 && p.transition?.blur) whipWindows.push([orig, orig + p.D]);
      orig += p.natural;
    });
  }

  return (
    <AbsoluteFill
      style={{backgroundColor: brand?.bgBot ?? '#070707', ...brandVars, ...(orb2 ? {['--orb2' as string]: orb2} : {})}}
      className={[fx?.orbs || fx?.grain ? 'fx-on' : '', fx?.grid ? 'grid-on' : '', (video as {layout?: string}).layout ? 'layout-' + (video as {layout?: string}).layout : '', americana ? 'skin-americana' : ''].filter(Boolean).join(' ') || undefined}
    >
      {fx?.morph && darkRanges.length ? (
        <MorphCanvas ranges={darkRanges} lightBg={brand?.bgMid ?? '#E7E0D0'} darkBg={darkTokens?.bg ?? '#0F1220'} />
      ) : null}
      {fx?.grid ? (
        fx?.morph && darkRanges.length ? (
          // The grid sits at the video root, so during the dark beat its LIGHT
          // hairline would blaze over the dark canvas (readability). Lerp the
          // line color toward a near-bg dark tone with the same dm ramp.
          <MorphGrid
            ranges={darkRanges}
            light={brand?.hairline ?? '#D3C9B5'}
            dark={(darkTokens as {grid?: string} | undefined)?.grid ?? '#1A2033'}
          />
        ) : (
          <AbsoluteFill className="vk-grid" />
        )
      ) : null}
      {fx?.gradientBg ? (
        <GradientBackground accent={brand?.accent} accent2={orb2} bgTop={brand?.bgTop} bgBot={brand?.bgBot} />
      ) : null}
      {fx?.orbs || fx?.grain ? (
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse 90% 70% at 50% 42%, var(--bg-top) 0%, var(--bg-mid) 70%, var(--bg-bot) 100%)',
          }}
        >
          <Atmosphere orbs={fx?.orbs} grain={fx?.grain} />
        </AbsoluteFill>
      ) : null}
      <MotionBlurGate windows={whipWindows}>
        <TransitionSeries>
          {scenePlan.flatMap((p, index) => {
            const {scene} = p;
            const natural = p.natural;
            // Pad this sequence by the overlap of the coupled transition that
            // FOLLOWS it, so the outgoing scene is still on-screen while the next
            // one slides in AND every absolute scene start stays put (see plan above).
            const dAfter = index < n - 1 ? scenePlan[index + 1].D : 0;
            const seqFrames = natural + dAfter;
            // A coupled slide brings scene i IN (rideEnter) and the next coupled slide
            // pushes it OUT (rideExit) — the internal SceneEnvelope must not fight
            // either ridden side. The last coupled-entered scene holds to the end.
            const rideEnter = index >= 1 && Boolean(p.variant);
            const rideExit =
              (index < n - 1 && Boolean(scenePlan[index + 1].variant)) || (index === n - 1 && rideEnter);
            const sequence = (
              <TransitionSeries.Sequence key={`s${index}`} durationInFrames={seqFrames}>
                <AbsoluteFill
                  style={{
                    ...((scene as {beat?: string}).beat === 'dark' ? darkVars : {}),
                    ...(americana ? amFieldVars((scene as {field?: string}).field) : {}),
                  }}
                  className={americana && (scene as {amBeat?: string}).amBeat ? 'am-beat-' + (scene as {amBeat?: string}).amBeat : undefined}
                >
                  <SceneEnvelope
                    frames={natural}
                    first={index === 0}
                    enter={(scene as {transition?: string}).transition}
                    morph={fx?.morph}
                    ride={{enter: rideEnter, exit: rideExit}}
                  >
                    <Camera
                      cam={(scene as {camera?: {fromZoom?: number; toZoom?: number; fx?: number; fy?: number}}).camera}
                      frames={natural}
                      maxZoom={americana && !(scene as {endCard?: unknown}).endCard ? 1.06 : undefined}
                      noEnter={rideEnter}
                    >
                      <SceneBody scene={scene} frames={natural} hideChrome={hasChrome} />
                    </Camera>
                    {americana && (scene as {ghosts?: string[]}).ghosts
                      ? // ghost fragments: mono 19, corners only, max 2 per frame, ≤0.45
                        (scene as {ghosts?: string[]}).ghosts!.slice(0, 2).map((g, gi) => (
                          <div key={gi} className={`am-ghost ${gi === 0 ? 'am-ghost-tl' : 'am-ghost-br'}`}>
                            {g}
                          </div>
                        ))
                      : null}
                    {(scene as {mascot?: MascotConfig}).mascot ? (
                      <ClaudeMascot
                        config={(scene as {mascot?: MascotConfig}).mascot!}
                        frames={natural}
                        // end-card beats get their own vetted-slot table + size guard
                        sceneKind={(scene as {endCard?: unknown}).endCard ? 'endCard' : scene.kind}
                      />
                    ) : null}
                    {/* styleboard/demo escape hatch: several mascots on one scene */}
                    {((scene as {mascots?: MascotConfig[]}).mascots ?? []).map((m, mi) => (
                      <ClaudeMascot
                        key={`m${mi}`}
                        config={m}
                        frames={natural}
                        sceneKind={(scene as {endCard?: unknown}).endCard ? 'endCard' : scene.kind}
                      />
                    ))}
                  </SceneEnvelope>
                </AbsoluteFill>
              </TransitionSeries.Sequence>
            );
            // Coupled beats get a real overlapping Transition BEFORE them (spring-slide
            // pushes the outgoing scene off as the incoming springs in; whip rides its
            // CameraMotionBlur via the gate). Non-coupled seams get none → a hard cut,
            // with the single-scene enter still handled inside SceneEnvelope.
            if (p.transition) {
              return [
                <TransitionSeries.Transition
                  key={`t${index}`}
                  timing={p.transition.timing}
                  presentation={p.transition.presentation}
                />,
                sequence,
              ];
            }
            return [sequence];
          })}
        </TransitionSeries>
      </MotionBlurGate>

      {/* Always-on subtle film grain + soft vignette — kills the sterile flat-white look
          and adds depth (premium texture). Static, deterministic, under chrome/captions.
          fx.grainOpacity overrides intensity (doctrine reference: 0.17 overlay blend).
          Americana kill-list: NO grain, no texture overlays — flat fields carry the texture. */}
      {americana ? null : (
        <>
          <AbsoluteFill style={{pointerEvents: 'none', opacity: (fx as {grainOpacity?: number} | undefined)?.grainOpacity ?? 0.05, mixBlendMode: (fx as {grainOpacity?: number} | undefined)?.grainOpacity ? 'overlay' : 'multiply'}}>
            <svg width="100%" height="100%">
              <filter id="vk-grain"><feTurbulence type="fractalNoise" baseFrequency="0.74" numOctaves="3" stitchTiles="stitch" /></filter>
              <rect width="100%" height="100%" filter="url(#vk-grain)" />
            </svg>
          </AbsoluteFill>
          <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(120% 100% at 50% 38%, transparent 58%, rgba(14,20,19,0.05) 100%)'}} />
        </>
      )}

      {/* Cockpit layout: a composed source/context strip anchoring the lower frame. */}
      {(video as {layout?: string}).layout === 'cockpit' && (video as {sourceLine?: string}).sourceLine ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          <div style={{position: 'absolute', left: 64, right: 64, bottom: 172, borderTop: '2px solid var(--hairline)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 23, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase'}}>
            <span>{(video as {sourceLine?: string}).sourceLine}</span><span>vektor.fm</span>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Filmic finishing layer (vignette + tint + grain) under chrome/captions. */}
      {fx?.grade ? <GradeOverlay tint={brand?.accent} /> : null}

      {/* One persistent bar set for the whole video — fades in once, holds. */}
      {hasChrome ? (
        <PersistentChrome
          chrome={chrome!}
          hideRanges={chromeHideRanges}
          skin={skin}
          beats={americana ? amBeats : undefined}
          darkMorph={
            fx?.morph && darkRanges.length && darkTokens
              ? {
                  ranges: darkRanges,
                  light: {fg: brand?.fg ?? '#111', muted: brand?.muted ?? '#777', hairline: brand?.hairline ?? '#ccc'},
                  dark: {fg: darkTokens.fg ?? '#eee', muted: darkTokens.muted ?? '#999', hairline: darkTokens.hairline ?? '#333'},
                }
              : undefined
          }
        />
      ) : null}

      {audio?.voSrc ? (
        <Audio src={staticFile(audio.voSrc)} volume={audio.voVolume ?? 1} />
      ) : null}
      {audio?.musicSrc ? (
        <Audio src={staticFile(audio.musicSrc)} volume={audio.musicVolume ?? 0.04} loop />
      ) : null}
      {audio?.endMusicSrc ? (
        <Sequence from={video.scenes.slice(0, -1).reduce((s, sc) => s + sceneFrames(sc), 0)} layout="none">
          <Audio src={staticFile(audio.endMusicSrc)} volume={audio.endMusicVolume ?? 0.3} />
        </Sequence>
      ) : null}

      {captions && captions.length > 0 ? (
        <Captions words={captions} style={captionStyle ?? 'tiktok'} />
      ) : null}

      {audio?.sfx ? <SfxLayer scenes={video.scenes} /> : null}
    </AbsoluteFill>
  );
};

// Auto sound-design layer: a soft whoosh on every scene transition, and a riser
// swelling into the winprob "verdict" reveal with a low impact on the cut.
const SfxLayer: React.FC<{scenes: Scene[]}> = ({scenes}) => {
  const starts: number[] = [];
  let acc = 0;
  for (const s of scenes) {
    starts.push(acc);
    acc += sceneFrames(s);
  }
  // Sound design: a whoosh on every scene transition, a riser building into the
  // suspense reveals, and a low impact landing on each reveal beat. Synced to the
  // frame the visual "clicks" — the perceived-quality multiplier. Volumes sit under VO+music.
  const revealFrac: Record<string, number> = {guessreveal: 0.52, shotmap: 0.6, versus: 0.5, winprob: 0.06, counter: 0.74, plinko: 0.72};
  const els: React.ReactNode[] = [];
  scenes.forEach((s, i) => {
    const start = starts[i];
    const dur = sceneFrames(s);
    if (i > 0) {
      els.push(
        <Sequence key={`w${i}`} from={Math.max(0, start - 3)} durationInFrames={22} layout="none">
          <Audio src={staticFile('sfx/whoosh.wav')} volume={0.26} />
        </Sequence>,
      );
    }
    const frac = revealFrac[s.kind];
    if (frac != null) {
      const r = start + Math.floor(dur * frac);
      if (s.kind === 'guessreveal' || s.kind === 'plinko' || s.kind === 'shotmap') {
        els.push(
          <Sequence key={`r${i}`} from={Math.max(0, r - 38)} durationInFrames={40} layout="none">
            <Audio src={staticFile('sfx/riser.wav')} volume={0.2} />
          </Sequence>,
        );
      }
      els.push(
        <Sequence key={`i${i}`} from={r} durationInFrames={14} layout="none">
          <Audio src={staticFile('sfx/impact.wav')} volume={0.4} />
        </Sequence>,
      );
    }
  });
  return <>{els}</>;
};
