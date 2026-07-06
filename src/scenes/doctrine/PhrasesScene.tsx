import React from 'react';
import {interp, easeOutExpo} from '../../motion';
import {MONO} from './kinetics';
import {computeWrap, ebStyle} from './wrap';
import {KineticLine} from './KineticLine';
import type {SceneProps} from './types';

// S2 — what we record. Kinetic phrase lines (start 176 + k*16) + the §02 self-drawing
// tick-ruler instrument (width 0→640 over 224–252) + a mono forward-reference caption.
export const PhrasesScene: React.FC<SceneProps> = ({frame, win, colors, section}) => {
  const s0 = win.opIn[0];
  const lines = section.copy?.lines ?? [];
  const cap = section.copy?.caption;
  const rulerW = 640 * interp(frame, [s0 + 52, s0 + 80], [0, 1], easeOutExpo);
  return (
    <div style={computeWrap(frame, win)}>
      {section.eyebrow ? <div style={ebStyle(colors)}>{section.eyebrow}</div> : null}
      <div style={{position: 'absolute', top: '660px', left: '96px', right: '96px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'}}>
        {lines.map((ln, k) => (
          <KineticLine key={k} text={ln} start={s0 + 4 + k * 16} color={colors.cfg} frame={frame} size="96px" />
        ))}
        <div style={{width: `${rulerW.toFixed(0)}px`, height: '30px', overflow: 'hidden', marginTop: '34px'}}>
          <div style={{position: 'relative', width: '640px', height: '30px'}}>
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '1px', background: colors.chr}} />
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: '18px', backgroundImage: `repeating-linear-gradient(90deg, ${colors.cac} 0 2px, transparent 2px 53px)`}} />
          </div>
        </div>
        {cap ? (
          <div style={{marginTop: '26px', fontFamily: MONO, fontSize: '28px', letterSpacing: '0.14em', color: colors.cmu, opacity: interp(frame, [s0 + 78, s0 + 102], [0, 1], easeOutExpo)}}>{cap}</div>
        ) : null}
      </div>
    </div>
  );
};
