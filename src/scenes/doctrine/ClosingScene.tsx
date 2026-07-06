import React from 'react';
import {interp, easeOutExpo} from '../../motion';
import {FF, MONO} from './kinetics';
import {computeWrap} from './wrap';
import type {SceneProps} from './types';

// S6 — closing. Wordmark + blinking accent block cursor + a mono sub-line.
export const ClosingScene: React.FC<SceneProps> = ({frame, win, colors, section, brief}) => {
  const s0 = win.opIn[0];
  const cur = Math.floor(frame / 16) % 2 === 0 ? 1 : 0.18;
  const word = brief.chrome?.word ?? 'caelith';
  const sub = section.copy?.sub;
  return (
    <div style={computeWrap(frame, win)}>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '44px'}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <span style={{fontFamily: FF, fontSize: '150px', fontWeight: 600, letterSpacing: '-0.04em', color: colors.cfg, lineHeight: 1, transform: `translateY(${interp(frame, [s0 - 2, s0 + 22], [24, 0], easeOutExpo).toFixed(1)}px)`}}>{word}</span>
          <span style={{display: 'inline-block', width: '27px', height: '120px', background: colors.cac, marginLeft: '18px', opacity: cur}} />
        </div>
        {sub ? <div style={{fontFamily: MONO, fontSize: '30px', letterSpacing: '0.14em', color: colors.cmu, maxWidth: '900px', textAlign: 'center', lineHeight: 1.4, opacity: interp(frame, [s0 + 18, s0 + 46], [0, 1], easeOutExpo)}}>{sub}</div> : null}
      </div>
    </div>
  );
};
