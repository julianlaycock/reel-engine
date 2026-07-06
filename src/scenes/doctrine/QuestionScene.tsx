import React from 'react';
import {interp, easeOutExpo} from '../../motion';
import {FF} from './kinetics';
import {computeWrap, ebStyle} from './wrap';
import {KineticLine} from './KineticLine';
import type {SceneProps} from './types';

// S1 — the question. Eyebrow + kinetic headline lines + a muted sub-line that
// rises in later. Line k starts at frame 34 + k*12 (reference s1l1=34, s1l2=46).
export const QuestionScene: React.FC<SceneProps> = ({frame, win, colors, section}) => {
  const s0 = win.opIn[0]; // scene start — internal timings anchor here (position/length-agnostic)
  const lines = section.copy?.lines ?? [];
  const sub = section.copy?.sub;
  return (
    <div style={computeWrap(frame, win)}>
      {section.eyebrow ? <div style={ebStyle(colors)}>{section.eyebrow}</div> : null}
      <div style={{position: 'absolute', top: '700px', left: '96px', right: '96px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'}}>
        {lines.map((ln, k) => (
          <KineticLine key={k} text={ln} start={s0 + 28 + k * 12} color={colors.cfg} frame={frame} size="104px" />
        ))}
        {sub ? (
          <div
            style={{
              marginTop: '42px',
              fontFamily: FF,
              fontSize: '43px',
              color: colors.cmu,
              maxWidth: '820px',
              textAlign: 'center',
              lineHeight: 1.35,
              opacity: interp(frame, [s0 + 58, s0 + 82], [0, 1], easeOutExpo),
              transform: `translateY(${interp(frame, [s0 + 58, s0 + 82], [14, 0], easeOutExpo).toFixed(1)}px)`,
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
    </div>
  );
};
