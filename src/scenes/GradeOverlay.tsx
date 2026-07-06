import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

// Global filmic finishing layer: vignette + subtle brand-tint + animated film grain.
// Sits above scene content, below chrome/captions so text stays crisp. Frame-driven
// grain seed = deterministic. The "craft is luxury" anti-slop signal, near-zero cost.
export const GradeOverlay: React.FC<{tint?: string; intensity?: number}> = ({tint, intensity = 1}) => {
  const frame = useCurrentFrame();
  const seed = frame % 6; // subtle moving grain
  const grain = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' seed='${seed}'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', zIndex: 40}}>
      {/* vignette — pulls the eye to centre */}
      <AbsoluteFill
        style={{background: `radial-gradient(125% 100% at 50% 42%, transparent 54%, rgba(0,0,0,${0.28 * intensity}))`}}
      />
      {/* brand colour cast — very subtle top/bottom */}
      {tint ? (
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, ${tint}14 0%, transparent 38%, transparent 64%, ${tint}12 100%)`,
            mixBlendMode: 'soft-light',
          }}
        />
      ) : null}
      {/* animated film grain */}
      <AbsoluteFill
        style={{
          opacity: 0.07 * intensity,
          mixBlendMode: 'overlay',
          backgroundImage: `url("${grain}")`,
          backgroundSize: '300px 300px',
        }}
      />
    </AbsoluteFill>
  );
};
