import React from 'react';
import {interp, easeOutExpo, easePhysical} from '../../motion';
import {FF, MONO} from './kinetics';
import {computeWrap, ebStyle} from './wrap';
import type {SceneProps} from './types';

// S3 (Lineage variant) — timeline. A self-drawing track (scaleX 326–392) with
// staggered node pops (st = 332 + k*16, easePhysical), last node sealed (filled dot
// + halo). Ported from the Lineage reference.
export const TimelineScene: React.FC<SceneProps> = ({frame, win, colors, section}) => {
  const {cfg, cac, cmu, chr, panelBg} = colors;
  const s0 = win.opIn[0];
  const events = section.viz?.events ?? [];
  const n = events.length;
  const xOf = (i: number) => (n <= 1 ? 50 : 12 + i * (76 / (n - 1)));
  const caption = section.copy?.caption ?? '';

  return (
    <div style={computeWrap(frame, win)}>
      {section.eyebrow ? <div style={ebStyle(colors)}>{section.eyebrow}</div> : null}
      <div style={{position: 'absolute', top: '600px', left: '96px', right: '96px', height: '320px'}}>
        <div style={{position: 'absolute', top: '150px', left: '20px', right: '20px', height: '2px', background: chr}} />
        <div style={{position: 'absolute', top: '150px', left: '20px', right: '20px', height: '2px', background: cac, transform: `scaleX(${interp(frame, [s0 + 4, s0 + 70], [0, 1], easeOutExpo).toFixed(3)})`, transformOrigin: 'left'}} />
        {events.map((ev, k) => {
          const st = s0 + 10 + k * 16;
          const p = interp(frame, [st, st + 14], [0, 1], easePhysical);
          const op = interp(frame, [st, st + 8], [0, 1]);
          const sealed = !!ev.seal;
          return (
            <div key={k} style={{position: 'absolute', left: `${xOf(k)}%`, top: '150px', transform: 'translate(-50%,-50%)', width: '190px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', opacity: op}}>
              <div style={{fontFamily: MONO, fontSize: '24px', letterSpacing: '0.04em', color: cac, whiteSpace: 'nowrap'}}>{ev.date}</div>
              <div style={{width: sealed ? '28px' : '18px', height: sealed ? '28px' : '18px', borderRadius: '50%', background: sealed ? cac : panelBg, border: `2px solid ${cac}`, boxShadow: sealed ? `0 0 0 7px color-mix(in srgb, ${cac} 14%, transparent)` : 'none', transform: `scale(${p.toFixed(3)})`}} />
              <div style={{fontFamily: FF, fontSize: '30px', fontWeight: 600, letterSpacing: '-0.01em', color: sealed ? cac : cfg, textAlign: 'center', lineHeight: 1.15}}>{ev.label}</div>
            </div>
          );
        })}
      </div>
      {caption ? (
        <div style={{position: 'absolute', top: '1360px', left: '96px', right: '96px', textAlign: 'center', fontFamily: FF, fontSize: '50px', fontWeight: 600, lineHeight: 1.3, color: cfg, opacity: interp(frame, [s0 + 70, s0 + 94], [0, 1], easeOutExpo)}}>
          {caption.split('*').map((seg, i) => (i % 2 === 1 ? <span key={i} style={{color: cac}}>{seg}</span> : <span key={i}>{seg}</span>))}
        </div>
      ) : null}
    </div>
  );
};
