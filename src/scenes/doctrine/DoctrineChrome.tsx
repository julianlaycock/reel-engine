import React from 'react';
import type {Brief} from '../../doctrine-schema';
import type {MorphColors} from '../../doctrine-color';
import {interp, easeOutExpo} from '../../motion';
import {FF, MONO} from './kinetics';

// Persistent chrome: wordmark + blinking block cursor, series label, self-drawing
// rule, foot L/R. Rendered ONCE at the Doctrine root (outside the scene wraps) so it
// survives the color-morph seam. Verbatim from the reference chrome block.
export const DoctrineChrome: React.FC<{brief: Brief; colors: MorphColors; frame: number}> = ({brief, colors, frame}) => {
  const cur = Math.floor(frame / 16) % 2 === 0 ? 1 : 0.18;
  const word = brief.chrome?.word ?? 'caelith';
  const footL = brief.chrome?.footL ?? 'caelith.tech';
  const footR = brief.chrome?.footR ?? 'annex iv';
  return (
    <>
      <div style={{position: 'absolute', top: '90px', left: '110px', display: 'flex', alignItems: 'center', fontFamily: FF, fontWeight: 600, fontSize: '30px', letterSpacing: '-0.02em', color: colors.cfg, lineHeight: 1}}>
        {word}
        <span style={{display: 'inline-block', width: '20px', height: '20px', background: colors.cac, marginLeft: '8px', opacity: cur}} />
      </div>
      <div style={{position: 'absolute', top: '95px', right: '110px', fontFamily: MONO, fontSize: '24px', letterSpacing: '0.06em', color: colors.cmu}}>{brief.series}</div>
      <div style={{position: 'absolute', top: '150px', left: '110px', right: '110px', height: '2px', background: colors.cfg, opacity: 0.85, transform: `scaleX(${interp(frame, [8, 40], [0, 1], easeOutExpo).toFixed(3)})`, transformOrigin: 'left'}} />
      <div style={{position: 'absolute', bottom: '92px', left: '110px', fontFamily: MONO, fontSize: '24px', letterSpacing: '0.06em', color: colors.cmu}}>{footL}</div>
      <div style={{position: 'absolute', bottom: '92px', right: '110px', fontFamily: MONO, fontSize: '24px', letterSpacing: '0.06em', color: colors.cmu}}>{footR}</div>
    </>
  );
};
