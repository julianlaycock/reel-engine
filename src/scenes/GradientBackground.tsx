import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

// Living gradient-mesh background (ShaderGradient-inspired) — soft brand-colour
// blobs drifting over a dark base. Frame-driven → deterministic; pure DOM → no
// extra WebGL context (safe under the 3D scenes). Kept dark/subtle so text + data
// stay readable on top.
export const GradientBackground: React.FC<{
  accent?: string;
  accent2?: string;
  bgTop?: string;
  bgBot?: string;
}> = ({accent = '#2BD4B5', accent2 = '#1E5A8C', bgTop = '#0b1117', bgBot = '#06090c'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const a = '4d'; // ~30% alpha on the colour blobs
  const blob = (i: number, color: string, bx: number, by: number, r: number, sp: number) => {
    const x = bx + Math.sin(t * sp + i) * 9;
    const y = by + Math.cos(t * sp * 0.8 + i * 1.3) * 8;
    return `radial-gradient(${r}% ${r}% at ${x}% ${y}%, ${color}${a}, transparent 62%)`;
  };
  return (
    <AbsoluteFill
      style={{
        background: [
          blob(0, accent, 28, 26, 70, 0.16),
          blob(1, accent2, 74, 72, 78, 0.13),
          blob(2, accent, 60, 50, 55, 0.2),
          `radial-gradient(125% 100% at 50% 30%, ${bgTop}, ${bgBot} 78%)`,
        ].join(','),
      }}
    />
  );
};
