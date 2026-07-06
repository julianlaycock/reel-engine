import React from 'react';
import type {CSSProperties} from 'react';
import {interp, easeInOut, easePhysical} from '../../motion';
import {FF} from './kinetics';
import {computeWrap, ebStyle} from './wrap';
import {KineticLine} from './KineticLine';
import type {SceneProps} from './types';

// S4 — the standard. Shared-element handoff: the outgoing kinetic line ("everything,")
// leaves up+out while the hero word ("provable.") fades in, scales 1→2.0 via the ONE
// easePhysical overshoot (515–565), and recolors fg→treatment via treatMix. Shimmer/
// aperture drift is frozen at fShim = min(frame, 578) for the dead-still hold.
export const StandardHeroScene: React.FC<SceneProps> = ({frame, win, colors, section, brief}) => {
  const {cfg, cac, cshB} = colors;
  const s0 = win.opIn[0];
  const treatment = brief.heroTreatment ?? 'shimmer';
  const lines = section.copy?.lines ?? [];
  const hero = section.copy?.hero ?? '';

  const fShim = Math.min(frame, s0 + 118); // freeze shimmer/aperture drift → dead-still hold
  const treatMix = interp(frame, [s0 + 60, s0 + 100], [0, 1]);
  const heroSc = 1 + 1.0 * interp(frame, [s0 + 55, s0 + 105], [0, 1], easePhysical);

  const heroMetrics: CSSProperties = {fontFamily: FF, fontSize: '118px', fontWeight: 680, fontVariationSettings: '"wght" 680', letterSpacing: '-0.03em'};

  let treatObj: CSSProperties;
  if (treatment === 'flat') {
    treatObj = {color: cac};
  } else if (treatment === 'aperture') {
    treatObj = {
      backgroundImage: `radial-gradient(150% 130% at ${(35 + Math.sin(fShim * 0.05) * 30).toFixed(1)}% ${(42 + Math.cos(fShim * 0.045) * 22).toFixed(1)}%, ${cshB} 0%, ${cac} 52%, ${cac} 100%)`,
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent',
    };
  } else {
    treatObj = {
      backgroundImage: `linear-gradient(100deg, ${cac} 0%, ${cshB} 46%, ${cac} 88%)`,
      backgroundSize: '260% 100%', backgroundPositionX: `${(((fShim * 1.1) % 260) - 30).toFixed(1)}%`,
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent',
    };
  }

  return (
    <div style={computeWrap(frame, win)}>
      {section.eyebrow ? <div style={ebStyle(colors)}>{section.eyebrow}</div> : null}
      {lines[0] ? (
        <KineticLine
          text={lines[0]}
          start={s0 + 22}
          color={cfg}
          frame={frame}
          size="110px"
          containerStyle={{
            position: 'absolute', top: '700px', left: '96px', right: '96px', lineHeight: 1,
            opacity: interp(frame, [s0 + 55, s0 + 95], [1, 0]),
            transform: `translateY(${interp(frame, [s0 + 55, s0 + 100], [0, -90], easeInOut).toFixed(1)}px)`,
          }}
        />
      ) : null}
      <div style={{position: 'absolute', top: '855px', left: 0, right: 0, height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', transformOrigin: '50% 50%', opacity: interp(frame, [s0 + 16, s0 + 40], [0, 1]), transform: `scale(${heroSc.toFixed(3)})`}}>
        <div style={{position: 'relative', display: 'inline-block'}}>
          <span style={{...heroMetrics, color: cfg, opacity: 1 - treatMix}}>{hero}</span>
          <span style={{...heroMetrics, ...treatObj, position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap', opacity: treatMix}}>{hero}</span>
        </div>
      </div>
    </div>
  );
};
