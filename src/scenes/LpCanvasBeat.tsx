import React from 'react';
import type {LetterpressScene as LetterpressSceneType, LpCanvasEl} from '../video-schema';
import {caretBlink, growSteps, stampHit, stampIn, typeOn} from './lp-motion';
import '../style.css';

// ─────────────────────────────────────────────────────────────────────────────
// LpCanvasBeat — "The Evolving Canvas" (lp-canvas.v1). EXPERIMENT 2026-07-29,
// pending founder RENDER→SEE→LOCK; not yet in the template registry.
//
// One persistent diagram lives across consecutive scenes: every scene's JSON
// carries the FULL element state, elements shared between scenes sit at
// identical coordinates (pixel-identical across the `transition: "none"` seam),
// and only the ids in canvas.enter animate in — so the reel reads as a single
// zero-cut evolving canvas, KodeKloud-grammar, letterpress law.
//
// Letterpress laws in force: two colours via var(--lp-*) only, radius 0,
// HARD STEPS (all motion from lp-motion.ts; entering lines grow in discrete
// steps with a square pen-head at the tip; labels type on with the block
// caret). The per-scene restamp cycle (effFrame) is deliberately NOT used —
// a blank at 88% of every scene would destroy the persistent-canvas illusion.
// ─────────────────────────────────────────────────────────────────────────────

const STAGGER = 8; // frames between entering elements — payloads land near the seam
const SETTLED = -1_000_000; // start frame for elements not entering (always done)

const startFor = (id: string, enter: string[]): number => {
  const i = enter.indexOf(id);
  return i < 0 ? SETTLED : 8 + i * STAGGER; // first entrance 8f after the seam
};

// Local frame relative to an element's entrance (huge when settled).
const rel = (frame: number, start: number): number =>
  start === SETTLED ? 1_000_000 : frame - start;

const CanvasLine: React.FC<{el: LpCanvasEl; t: number}> = ({el, t}) => {
  const g = growSteps(t, 0, 9);
  if (g === 0) return null;
  const x1 = el.x1 ?? 0;
  const y1 = el.y1 ?? 0;
  const x2 = x1 + ((el.x2 ?? 0) - x1) * g;
  const y2 = y1 + ((el.y2 ?? 0) - y1) * g;
  const stroke = el.muted ? 'var(--lp-field-muted)' : 'var(--lp-field-fg)';
  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={el.dashed ? 4 : 3}
        strokeDasharray={el.dashed ? '16 12' : undefined}
      />
      {g < 1 ? (
        // the square pen-head riding the tip while the stroke is being drawn
        <rect x={x2 - 7} y={y2 - 7} width={14} height={14} fill="var(--lp-field-fg)" />
      ) : null}
    </>
  );
};

// The scribbled refusal — two heavy strokes crossing at (x,y), drawn fast.
const CanvasStrike: React.FC<{el: LpCanvasEl; t: number}> = ({el, t}) => {
  const arm = (el.w ?? 56) / 2;
  const cx = el.x ?? 0;
  const cy = el.y ?? 0;
  const g1 = growSteps(t, 0, 4);
  const g2 = growSteps(t, 3, 4);
  if (g1 === 0) return null;
  return (
    <>
      <line
        x1={cx - arm}
        y1={cy - arm}
        x2={cx - arm + 2 * arm * g1}
        y2={cy - arm + 2 * arm * g1}
        stroke="var(--lp-field-fg)"
        strokeWidth={8}
      />
      {g2 > 0 ? (
        <line
          x1={cx + arm}
          y1={cy - arm}
          x2={cx + arm - 2 * arm * g2}
          y2={cy - arm + 2 * arm * g2}
          stroke="var(--lp-field-fg)"
          strokeWidth={8}
        />
      ) : null}
    </>
  );
};

const CanvasBox: React.FC<{el: LpCanvasEl; t: number}> = ({el, t}) => {
  const hit = stampHit(Math.min(t, 1_000), 0);
  if (hit.opacity === 0) return null;
  const cls = [
    'lp-cv-box',
    el.hatched ? 'lp-hatched' : '',
    el.frameOnly ? 'lp-cv-box--frame' : '',
    el.muted ? 'lp-cv-muted' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={cls}
      style={{
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        opacity: hit.opacity,
        transform: `scale(${hit.scale})`,
      }}
    >
      {el.tag ? <span className="lp-cv-tag">{el.tag}</span> : null}
      {el.label ? <span className="lp-cv-box-label">{el.label}</span> : null}
      {el.sub ? <span className="lp-cv-box-sub">{el.sub}</span> : null}
      {el.list?.length ? (
        <div className="lp-cv-list">
          {el.list.map((row, i) => (
            <div key={i} style={{opacity: stampIn(Math.min(t, 1_000), i, 3)}}>
              {row}
            </div>
          ))}
        </div>
      ) : null}
      {el.innerTag ? <span className="lp-cv-inner-tag">{el.innerTag}</span> : null}
    </div>
  );
};

const CanvasLabel: React.FC<{el: LpCanvasEl; t: number}> = ({el, t}) => {
  if (t < 0) return null;
  const text = el.text ?? '';
  const shown = typeOn(t, text);
  if (shown.length === 0) return null; // no naked caret before the first glyph
  const typing = shown.length < text.length || t < 26 + 12;
  // Solid while typing (a blink-off caret mid-type reads as a glitch), block
  // blink only during the short post-type hold.
  const caretOpacity = shown.length < text.length ? 1 : caretBlink(t);
  return (
    <div
      className={[
        'lp-cv-label',
        el.display ? 'lp-display lp-cv-label--display' : '',
        el.muted ? 'lp-cv-muted' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: el.x,
        top: el.y,
        fontSize: el.size ?? (el.display ? 84 : 30),
        textAlign: el.align ?? 'center',
        transform:
          el.align === 'left' ? 'none' : el.align === 'right' ? 'translateX(-100%)' : 'translateX(-50%)',
      }}
    >
      {shown}
      {typing ? <span className="lp-cv-caret" style={{opacity: caretOpacity}} /> : null}
    </div>
  );
};

// Standalone tag — inverted block (or outlined when muted) riding an edge it
// wasn't born with: ENDPOINT / MCP CLIENT / MCP SERVER / THE MODEL. Separate
// from the box so it can ENTER in a later scene than its host.
const CanvasTag: React.FC<{el: LpCanvasEl; t: number}> = ({el, t}) => {
  if (t < 0) return null;
  return (
    <span
      className={`lp-cv-tag lp-cv-tag--free${el.muted ? ' lp-cv-tag--outline' : ''}`}
      style={{left: el.x, top: el.y}}
    >
      {el.text}
    </span>
  );
};

const CanvasChip: React.FC<{el: LpCanvasEl; t: number}> = ({el, t}) => {
  const hit = stampHit(Math.min(t, 1_000), 0);
  if (hit.opacity === 0) return null;
  return (
    <span
      className="lp-chip lp-cv-chip"
      style={{left: el.x, top: el.y, opacity: hit.opacity, transform: `translateX(-50%) scale(${hit.scale})`}}
    >
      {el.text}
    </span>
  );
};

export const LpCanvasBeat: React.FC<{scene: LetterpressSceneType; frame: number}> = ({scene, frame}) => {
  const canvas = scene.canvas;
  if (!canvas) return null;
  const enter = canvas.enter ?? [];
  const lines = canvas.elements.filter((e) => e.el === 'line' || e.el === 'strike');
  const blocks = canvas.elements.filter((e) => e.el !== 'line' && e.el !== 'strike');
  return (
    <div className="lp-cv">
      {canvas.headline ? (
        <div className="lp-display lp-cv-headline">
          {typeOn(frame, canvas.headline, 20)}
          {frame < 20 + 12 ? (
            <span className="lp-cv-caret" style={{opacity: frame < 20 ? 1 : caretBlink(frame)}} />
          ) : null}
        </div>
      ) : null}
      <svg className="lp-cv-lines" viewBox="0 0 1080 1920">
        {lines.map((el) =>
          el.el === 'strike' ? (
            <CanvasStrike key={el.id} el={el} t={rel(frame, startFor(el.id, enter))} />
          ) : (
            <CanvasLine key={el.id} el={el} t={rel(frame, startFor(el.id, enter))} />
          ),
        )}
      </svg>
      {blocks.map((el) => {
        const t = rel(frame, startFor(el.id, enter));
        if (el.el === 'label') return <CanvasLabel key={el.id} el={el} t={t} />;
        if (el.el === 'chip') return <CanvasChip key={el.id} el={el} t={t} />;
        if (el.el === 'tag') return <CanvasTag key={el.id} el={el} t={t} />;
        return <CanvasBox key={el.id} el={el} t={t} />;
      })}
    </div>
  );
};
