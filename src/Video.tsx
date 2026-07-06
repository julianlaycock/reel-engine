import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, Series, interpolate, staticFile, useCurrentFrame} from 'remotion';
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
import {GradientBackground} from './scenes/GradientBackground';
import {Captions} from './Captions';
import {AsciiFieldScene} from './scenes/AsciiFieldScene';
import './fonts';
import './style.css';

// Americana Cut skin (Vektor, locked 2026-07-04) — flat field colors per beat.
// The video.json author sets a per-scene `"field"`; light fields carry ink text,
// signal/ink fields carry paper text. Spec: vektor/canon/americana-tokens.json.
const AM_FIELDS: Record<string, {bg: string; fg: string; muted: string; hairline: string}> = {
  orchid: {bg: '#C77BC9', fg: '#101010', muted: 'rgba(16,16,16,0.62)', hairline: 'rgba(16,16,16,0.28)'},
  aqua: {bg: '#8FC5C9', fg: '#101010', muted: 'rgba(16,16,16,0.62)', hairline: 'rgba(16,16,16,0.28)'},
  cream: {bg: '#F4EFDF', fg: '#101010', muted: 'rgba(16,16,16,0.62)', hairline: 'rgba(16,16,16,0.24)'},
  fog: {bg: '#E8ECEA', fg: '#101010', muted: 'rgba(16,16,16,0.62)', hairline: 'rgba(16,16,16,0.24)'},
  ink: {bg: '#101010', fg: '#EFEADD', muted: 'rgba(239,234,221,0.6)', hairline: 'rgba(239,234,221,0.25)'},
  signal: {bg: '#1B4FA0', fg: '#EFEADD', muted: '#BFD9FF', hairline: 'rgba(191,217,255,0.3)'},
};

const amFieldVars = (field?: string): React.CSSProperties => {
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

const SceneBody: React.FC<{scene: Scene; frames: number; hideChrome: boolean}> = ({
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
  children: React.ReactNode;
}> = ({cam, frames, children}) => {
  const frame = useCurrentFrame();
  if (!cam) return <>{children}</>;
  const z = interpolate(frame, [0, Math.max(frames - 1, 1)], [cam.fromZoom ?? 1, cam.toZoom ?? 1.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });
  // Soft entrance (dissolve-up) so camera scenes transition instead of hard-cutting.
  const enter = interpolate(frame, [0, 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
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
const SceneEnvelope: React.FC<{frames: number; first: boolean; enter?: string; morph?: boolean; children: React.ReactNode}> = ({
  frames,
  first,
  enter = 'rise',
  morph = false,
  children,
}) => {
  const frame = useCurrentFrame();
  // Americana motion law ("hard steps only"): `"transition": "cut"` = a true hard
  // cut — no envelope fades at all; the flat field color changes in one frame.
  if (enter === 'cut') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }
  // FRAME-ZERO LAW (canon v1.2.0): the opening scene renders at FULL opacity with
  // no entrance transform from frame 0 — the first frame must work as a static
  // thumbnail (TikTok decides in ~1s; a fade-in reads as an empty frame).
  if (first) {
    const outOp = interpolate(frame, [frames - (morph ? 16 : 12), frames - (morph ? 6 : 0)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return <AbsoluteFill style={{opacity: outOp}}>{children}</AbsoluteFill>;
  }
  // DOCTRINE COLOR-MORPH (canon v1.5.0, seam tightened 2026-07-04): scenes do NOT
  // cross-dissolve — content fades out fully, a SHORT (~6-frame) bare-canvas seam
  // shows while the palette lerps (Video-level), then the next scene rises in on
  // easeOutExpo (ty 18→0). Founder QA 2026-07-04: the original ~16–20-frame seam
  // read as dead air / a glitch at ≤45s pacing — VO narrated over an empty canvas.
  // No lateral slides (family never-do).
  if (morph) {
    const op = Math.min(
      interpolate(frame, [2, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)}),
      interpolate(frame, [frames - 10, frames - 4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.5, 0, 0.75, 0)}),
    );
    const ty = interpolate(frame, [2, 14], [18, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
    return <AbsoluteFill style={{opacity: op, transform: `translateY(${ty}px)`}}>{children}</AbsoluteFill>;
  }
  const inN = 14;
  const outN = 12;
  const op = Math.min(
    interpolate(frame, [0, inN], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(frame, [frames - outN, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
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

export const Video: React.FC<VideoProps> = ({video}) => {
  const {audio, captions, captionStyle, chrome} = video;
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
      const dark = s.kind === 'asciiField' || (s as {beat?: string}).beat === 'dark';
      if (s.kind === 'broll' || (americana && dark)) chromeHideRanges.push([acc, acc + f]);
      acc += f;
    }
  }

  // Americana chrome data: per-beat section marker (Workbench, top-right) and
  // footer progress "NN / 06" — both advance with the current scene (progress
  // markers signal saveability, canon v1.7.1). One-Jacquard law checked here.
  const amBeats: Array<{from: number; to: number; marker?: string; no?: string}> = [];
  if (americana) {
    let acc = 0;
    let jacquards = 0;
    for (const s of video.scenes) {
      const f = sceneFrames(s);
      const sc = s as {marker?: string; beatNo?: string; jacquardWord?: string; kind: string};
      amBeats.push({from: acc, to: acc + f, marker: sc.marker, no: sc.beatNo});
      if (sc.kind === 'asciiField' && sc.jacquardWord) jacquards++;
      acc += f;
    }
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
      <Series>
        {video.scenes.map((scene, index) => {
          const frames = sceneFrames(scene);
          return (
            <Series.Sequence key={index} durationInFrames={frames}>
              <AbsoluteFill
                style={{
                  ...((scene as {beat?: string}).beat === 'dark' ? darkVars : {}),
                  ...(americana ? amFieldVars((scene as {field?: string}).field) : {}),
                }}
                className={americana && (scene as {amBeat?: string}).amBeat ? 'am-beat-' + (scene as {amBeat?: string}).amBeat : undefined}
              >
                <SceneEnvelope frames={frames} first={index === 0} enter={(scene as {transition?: string}).transition} morph={fx?.morph}>
                  <Camera cam={(scene as {camera?: {fromZoom?: number; toZoom?: number; fx?: number; fy?: number}}).camera} frames={frames}>
                    <SceneBody scene={scene} frames={frames} hideChrome={hasChrome} />
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
                    <ClaudeMascot config={(scene as {mascot?: MascotConfig}).mascot!} frames={frames} />
                  ) : null}
                </SceneEnvelope>
              </AbsoluteFill>
            </Series.Sequence>
          );
        })}
      </Series>

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
        <Audio src={staticFile(audio.musicSrc)} volume={audio.musicVolume ?? 0.12} loop />
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
