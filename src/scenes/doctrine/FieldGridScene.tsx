import React from 'react';
import {interp, easeOutExpo} from '../../motion';
import {FF, MONO} from './kinetics';
import {computeWrap, ebStyle} from './wrap';
import type {SceneProps} from './types';

const AMBER = '#C99A2E';

// S3 (Signal/Annex IV variant) — field matrix. Cells fill along the diagonal
// (st = 322 + (col+row)*3), a few amber flags resolve to accent, a live counter
// ticks, and a seal line lands. Ported from the Signal-Annex-IV reference.
export const FieldGridScene: React.FC<SceneProps> = ({frame, win, colors, section}) => {
  const {cfg, cac, cmu, chr} = colors;
  const s0 = win.opIn[0];
  const grid = section.viz?.grid;
  const cols = grid?.cols ?? 12;
  const rows = grid?.rows ?? 6;
  const total = grid?.total ?? 432;
  const flags = new Set(grid?.flags ?? [16, 33, 52]);
  const n = cols * rows;

  let filled = 0;
  const cells = Array.from({length: n}, (_, k) => {
    const col = k % cols;
    const row = Math.floor(k / cols);
    const st = s0 + (col + row) * 3;
    const fp = interp(frame, [st, st + 10], [0, 1], easeOutExpo);
    if (fp > 0.5) filled += 1;
    const flagRes = interp(frame, [st + 16, st + 30], [0, 1], easeOutExpo);
    let bg = 'transparent';
    let border = chr;
    if (fp > 0.02) {
      if (flags.has(k) && flagRes < 1) {
        bg = AMBER;
        border = AMBER;
      } else {
        bg = cac;
        border = cac;
      }
    }
    return (
      <div key={k} style={{aspectRatio: '1 / 1', borderRadius: '4px', border: `1.5px solid ${border}`, background: bg, opacity: 0.22 + 0.78 * fp, transform: `scale(${(0.55 + 0.45 * fp).toFixed(3)})`}} />
    );
  });
  const fieldNum = Math.round((filled / n) * total);
  const caption = section.copy?.caption ?? '';

  return (
    <div style={computeWrap(frame, win)}>
      {section.eyebrow ? <div style={ebStyle(colors)}>{section.eyebrow}</div> : null}
      <div style={{position: 'absolute', top: '506px', left: '210px', right: '210px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: MONO, fontSize: '26px', letterSpacing: '0.06em', color: cmu}}>
        <span style={{color: cfg, fontWeight: 500}}>annex iv · fields</span>
        <span style={{color: cmu}}>{fieldNum} / {total}</span>
      </div>
      <div style={{position: 'absolute', top: '560px', left: '210px', right: '210px', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '8px'}}>{cells}</div>
      <div style={{position: 'absolute', top: '930px', left: '96px', right: '96px', textAlign: 'center', fontFamily: MONO, fontSize: '28px', letterSpacing: '0.08em', color: cac, opacity: interp(frame, [s0 + 70, s0 + 92], [0, 1], easeOutExpo)}}>◆ complete · sealed 12:04 utc</div>
      {caption ? (
        <div style={{position: 'absolute', top: '1360px', left: '96px', right: '96px', textAlign: 'center', fontFamily: FF, fontSize: '50px', fontWeight: 600, lineHeight: 1.3, color: cfg, opacity: interp(frame, [s0 + 70, s0 + 94], [0, 1], easeOutExpo)}}>
          {caption.split('*').map((seg, i) => (i % 2 === 1 ? <span key={i} style={{color: cac}}>{seg}</span> : <span key={i}>{seg}</span>))}
        </div>
      ) : null}
    </div>
  );
};
