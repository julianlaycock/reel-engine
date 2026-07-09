import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {EditorialScene as EditorialSceneType} from '../video-schema';
import {fadeRise, drawX, driftScale} from '../animation';
import {easeOutExpo, easePhysical, interp} from '../motion';
import {renderAccent} from '../accent';
import {Chrome} from './Chrome';
import '../style.css';

const W = 1080;
const H = 1920;
const ED_MARGIN = 110; // leader-line start x = label margin (aligns with chrome rule)

// Doctrine KineticLine (canon v1.5.0 trial): each word rises from behind a mask
// (translateY 112%→0, easeOutExpo, 3-frame stagger) while the variable weight
// settles 320→650 and the tracking tightens 0.1em→0. Deliberate, no bounce.
// Accent words land LAST with the easePhysical hero pop, then hold dead-still.
const KineticWords: React.FC<{text: string; accentWords?: string[]; frame: number}> = ({
  text,
  accentWords = [],
  frame,
}) => {
  const clean = text.replace(/[{}]/g, '');
  const accents = accentWords.map((a) => a.replace(/[{}]/g, '').toLowerCase());
  const words = clean.split(' ');
  // Tightened 2026-07-04 (founder QA: the 8f delay + 3f stagger + 18f rise read as
  // words "dribbling in" — glitchy at short-form pacing). Local KSTAG, not the
  // shared STAGGER: headlines must be readable within ~0.8s of scene start.
  const KSTAG = 2;
  return (
    <>
      {words.map((w, i) => {
        const bare = w.replace(/[^a-z0-9$%]/gi, '').toLowerCase();
        const accent = bare.length > 0 && accents.some((a) => a.includes(bare));
        if (accent) {
          const start = 4 + words.length * KSTAG + 4;
          const sc = interp(frame, [start, start + 14], [0.7, 1], easePhysical);
          const op = interp(frame, [start, start + 5], [0, 1]);
          return (
            <span
              key={i}
              style={{display: 'inline-block', transform: `scale(${sc})`, transformOrigin: '50% 68%', opacity: op, marginRight: '0.26em', color: 'var(--accent)'}}
            >
              {w}
            </span>
          );
        }
        // Masked rise + tracking settle; weight FIXED (animating wght reflows
        // neighbor word widths per frame — visible jitter on display type).
        const s = 4 + i * KSTAG;
        const p = interp(frame, [s, s + 12], [0, 1], easeOutExpo);
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', marginRight: '0.26em', paddingBottom: '0.06em'}}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - p) * 112}%)`,
                opacity: interp(frame, [s, s + 6], [0, 1]),
                letterSpacing: `${(0.08 * (1 - p)).toFixed(3)}em`,
                fontWeight: 650,
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </>
  );
};

// Spring-physics headline reveal (chenglou / react-motion spirit): each word
// springs up into place with overshoot, staggered — fluid, not a flat fade.
const SpringWords: React.FC<{text: string; accentWords?: string[]; frame: number; fps: number}> = ({
  text,
  accentWords = [],
  frame,
  fps,
}) => {
  const clean = text.replace(/[{}]/g, '');
  const accents = accentWords.map((a) => a.replace(/[{}]/g, '').toLowerCase());
  return (
    <>
      {clean.split(' ').map((w, i, words) => {
        const bare = w.replace(/[^a-z0-9$%]/gi, '').toLowerCase();
        const accent = bare.length > 0 && accents.some((a) => a.includes(bare));
        if (accent) {
          // Doctrine hero-word ("the provable moment"): the accent word lands LAST,
          // scaling in on the one easePhysical overshoot, then holds dead-still.
          const start = 8 + words.length * 5 + 4;
          const sc = interp(frame, [start, start + 18], [0.62, 1], easePhysical);
          const op = interp(frame, [start, start + 6], [0, 1]);
          return (
            <span
              key={i}
              style={{display: 'inline-block', transform: `scale(${sc})`, transformOrigin: '50% 68%', opacity: op, marginRight: '0.26em', color: 'var(--accent)'}}
            >
              {w}
            </span>
          );
        }
        const start = 8 + i * 5;
        const s = spring({frame: frame - start, fps, config: {damping: 12, stiffness: 130, mass: 0.7}});
        const y = interpolate(s, [0, 1], [46, 0]);
        const op = interpolate(frame, [start, start + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <span
            key={i}
            style={{display: 'inline-block', transform: `translateY(${y}px)`, opacity: op, marginRight: '0.26em'}}
          >
            {w}
          </span>
        );
      })}
    </>
  );
};

// Mock product window — the focal subject. Later this slot holds a real
// screen-capture; the annotation layer (callouts) draws on top of either.
const Panel: React.FC<{
  panel: NonNullable<EditorialSceneType['panel']>;
  frame: number;
}> = ({panel, frame}) => {
  const bodyLen = panel.body?.length ?? 0;
  return (
    <div className="ed-panel" style={fadeRise(frame, 16, 18)}>
      <div className="ed-bar">
        <span className="ed-dot" />
        <span className="ed-dot" />
        <span className="ed-dot" />
        <span className="ed-title">{panel.title}</span>
        {panel.badge ? <span className="ed-badge">{panel.badge}</span> : null}
      </div>
      {panel.image ? (
        <Img src={staticFile(panel.image)} className="ed-shot" />
      ) : (
        <div className="ed-body">
          {(panel.body ?? []).map((line, i) => (
            <div key={i} className="ed-docline" style={fadeRise(frame, 26 + i * 6, 12)}>
              {line}
            </div>
          ))}
          {panel.field ? (
            <div className="ed-field" style={fadeRise(frame, 28 + bodyLen * 6, 12)}>
              <span className="ed-field-label">{panel.field}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export const EditorialScene: React.FC<{
  scene: EditorialSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drift = driftScale(frame, scene.durationInFrames);
  const callouts = scene.callouts ?? [];
  const blink = frame % 34 < 18 ? 1 : 0; // frame-driven cursor blink (~1.1s)
  // FRAME-ZERO CLIFF LAW (canon v1.7.1): `"instant": true` renders the full text
  // composition at frame 0 — no entrance rises. For hook scenes whose motion
  // idea lives elsewhere (mascot/ghosts), an animated-in headline would leave
  // F0 as an empty field, the #1 documented drop-off cause.
  const instant = Boolean((scene as {instant?: boolean}).instant);
  const rise = (delay: number, dist: number) => (instant ? undefined : fadeRise(frame, delay, dist));

  // AUTO-SHRINK-TO-FIT (canon v2.3, 2026-07-05): DOM measurement is unreliable in Remotion's
  // headless capture (ref/continueRender race), so we shrink deterministically by the panel's
  // row count — the reliable overflow signal. Method panels (big R1/R2/R3 rows that wrap to two
  // lines) overflow the footer at 3 rows; scale the stage so the last row always clears it.
  // Scales from the top so the bottom lifts up (see transformOrigin below). No-op elsewhere.
  const panelRows = scene.panel && !scene.panel.image ? scene.panel.body?.length ?? 0 : 0;
  const isMethod = scene.amBeat === 'method';
  const fit = isMethod && panelRows >= 3 ? 0.84 : isMethod && panelRows === 2 ? 0.93 : 1;

  // RECEIPT BAND FIT (wireframes v2 — 2026-07-09): the eyebrow+headline+plate
  // stack must fit the 360..1260 content band AT REST — tall screenshots crop
  // inside the plate (object-fit cover) instead of pushing it under the
  // caption/footer bands. Deterministic budget from the headline line count,
  // same doctrine as the method-panel fit above (headless DOM measurement is
  // unreliable). 0 lines = hero plate (no headline), the plate owns the band.
  const isReceiptShot = Boolean(scene.panel?.image);
  const headlineLines = isReceiptShot && scene.headline ? scene.headline.split('\n').length : 0;
  const shotMax = isReceiptShot ? (headlineLines === 0 ? 640 : headlineLines === 1 ? 450 : 360) : undefined;

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : (
          <Chrome
            kicker={scene.kicker}
            kickerRight={scene.kickerRight}
            footerRight={scene.footerRight}
          />
        )}

        <div className="ed-stage">
        <div className="ed-fit" style={{transform: `scale(${(drift * fit).toFixed(4)})`, transformOrigin: fit < 1 ? '50% 0%' : '50% 50%', ...(shotMax ? ({'--shot-max': `${shotMax}px`} as React.CSSProperties) : {})}}>
          {scene.eyebrow ? (
            <div className="ed-eyebrow" style={rise(2, 12)}>
              {scene.eyebrow}
            </div>
          ) : null}
          {scene.logo && scene.headline ? (
            <div className="ed-logo" style={fadeRise(frame, 6, 14)}>
              <span className="ed-wordmark">{scene.headline}</span>
              {(scene as {caret?: boolean}).caret ? (
                <span className="caretmark" style={{opacity: blink}} />
              ) : (
                <span className="ed-cursor" style={{opacity: blink}} />
              )}
            </div>
          ) : scene.headline ? (
            (scene as {kinetic?: boolean}).kinetic ? (
              <div className="ed-headline">
                <KineticWords text={scene.headline} accentWords={scene.accentWords} frame={frame} />
              </div>
            ) : (scene as {reveal?: string}).reveal === 'spring' ? (
              <div className="ed-headline">
                <SpringWords text={scene.headline} accentWords={scene.accentWords} frame={frame} fps={fps} />
              </div>
            ) : (
              <div className="ed-headline" style={rise(6, 14)}>
                {renderAccent(scene.headline, scene.accentWords)}
              </div>
            )
          ) : null}
          {scene.panel ? <Panel panel={scene.panel} frame={frame} /> : null}
          {scene.footnote ? (
            <div className="ed-footnote" style={rise(44, 12)}>
              {renderAccent(scene.footnote, scene.accentWords)}
            </div>
          ) : null}
        </div>
        </div>

        {/* annotation layer: an underline-leader runs from the margin to the
            target dot. The label sits ABOVE the line so a line never crosses
            a word. */}
        <svg className="ed-svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {callouts.map((c, i) => {
            const start = 34 + i * 16;
            const tx = (c.xPct / 100) * W;
            const ty = (c.yPct / 100) * H;
            const left = (c.dir ?? (c.xPct < 50 ? 'left' : 'right')) === 'left';
            const sx = left ? ED_MARGIN : W - ED_MARGIN;
            const prog = drawX(frame, start, 14);
            const endX = sx + (tx - sx) * prog;
            const col = c.accent ? 'var(--accent)' : 'var(--fg)';
            return (
              <g key={i}>
                <line x1={sx} y1={ty} x2={endX} y2={ty} style={{stroke: col}} strokeWidth={2} />
                <circle cx={tx} cy={ty} r={8} style={{fill: col}} opacity={drawX(frame, start + 9, 8)} />
              </g>
            );
          })}
        </svg>

        {/* callout labels — pinned to the margin, resting just above the line */}
        {callouts.map((c, i) => {
          const start = 34 + i * 16;
          const ty = (c.yPct / 100) * H;
          const left = (c.dir ?? (c.xPct < 50 ? 'left' : 'right')) === 'left';
          return (
            <div
              key={i}
              className={`ed-callout ${left ? 'ed-left' : 'ed-right'}${c.accent ? ' r' : ''}`}
              style={{top: ty - 60, ...fadeRise(frame, start + 6, 12)}}
            >
              {c.text}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
