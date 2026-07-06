import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

// Frame-driven atmospheric layer — slow-drifting blurred accent orbs (the
// "motion design" depth from the caelith.tech hero) and an optional static
// grain. Driven by useCurrentFrame so Remotion actually captures the motion
// (CSS keyframe animations do not advance per rendered frame).
export const Atmosphere: React.FC<{orbs?: boolean; grain?: boolean}> = ({orbs, grain}) => {
  const frame = useCurrentFrame();
  if (!orbs && !grain) return null;

  const o1x = Math.sin(frame * 0.006) * 80;
  const o1y = Math.cos(frame * 0.005) * 70;
  const o2x = Math.cos(frame * 0.004 + 1) * 90;
  const o2y = Math.sin(frame * 0.006 + 2) * 80;
  const breathe = 1 + Math.sin(frame * 0.012) * 0.06;

  return (
    <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
      {orbs ? (
        <>
          <div
            style={{
              position: 'absolute',
              width: 780,
              height: 780,
              borderRadius: '50%',
              top: -160,
              right: -140,
              transform: `translate(${o1x}px, ${o1y}px) scale(${breathe})`,
              background: 'radial-gradient(circle, var(--accent), transparent 66%)',
              filter: 'blur(120px)',
              opacity: 0.2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 680,
              height: 680,
              borderRadius: '50%',
              bottom: -180,
              left: -160,
              transform: `translate(${o2x}px, ${o2y}px) scale(${2 - breathe})`,
              background: 'radial-gradient(circle, var(--orb2, #e8a87c), transparent 68%)',
              filter: 'blur(130px)',
              opacity: 0.12,
            }}
          />
        </>
      ) : null}
      {grain ? (
        <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05, mixBlendMode: 'overlay'}}>
          <filter id="ag-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#ag-grain)" />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
