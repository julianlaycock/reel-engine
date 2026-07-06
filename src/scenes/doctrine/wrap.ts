import type {CSSProperties} from 'react';
import {interp, easeOutExpo, easeInOut, sceneOp} from '../../motion';
import type {SceneWindow} from '../../doctrine-layout';
import type {MorphColors} from '../../doctrine-color';
import {MONO} from './kinetics';

// The per-scene wrapper: opacity envelope + entrance rise (translateY) + camera
// push (scale) + transform-origin. Ported from the reference `wrap(op,camIn,ty,origin)`.
export const computeWrap = (frame: number, win: SceneWindow): CSSProperties => {
  const op = win.opOut
    ? sceneOp(frame, win.opIn[0], win.opIn[1], win.opOut[0], win.opOut[1])
    : interp(frame, [win.opIn[0], win.opIn[1]], [0, 1], easeOutExpo);
  const camIn = interp(frame, win.cam, win.camScale, easeInOut);
  const ty = interp(frame, win.rise, [win.riseFrom, 0], easeOutExpo);
  return {
    position: 'absolute',
    inset: 0,
    opacity: op,
    transform: `translateY(${ty.toFixed(1)}px) scale(${camIn.toFixed(4)})`,
    transformOrigin: win.camOrigin,
    pointerEvents: 'none',
  };
};

// § eyebrow — mono, centered at y=384, accent-colored (verbatim from reference `eb`).
export const ebStyle = (colors: MorphColors): CSSProperties => ({
  position: 'absolute',
  top: '384px',
  left: '96px',
  right: '96px',
  textAlign: 'center',
  fontFamily: MONO,
  fontSize: '31px',
  fontWeight: 500,
  letterSpacing: '0.06em',
  color: colors.cac,
});
