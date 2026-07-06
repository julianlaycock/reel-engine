import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import type {MonteCarloScene as MonteCarloSceneType} from '../video-schema';
import {SpecimenOverlay} from './_overlay';

const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// "We simulated it 50,000 times": samples fall into bins, the histogram builds
// and converges from jagged → a smooth bell, a tabular counter ticks to N.
// All a pure function of frame; minimal/white aesthetic.
export const MonteCarlo: React.FC<{scene: MonteCarloSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const frames = scene.durationInFrames;
  const total = scene.total ?? 50000;
  const bins = scene.bins ?? 15;
  const W = 1000;
  const H = 520;
  const bw = W / bins;

  const target = useMemo(() => {
    const mu = (bins - 1) / 2;
    const sd = bins / 5.2;
    const arr = Array.from({length: bins}, (_, i) => Math.exp(-0.5 * ((i - mu) / sd) ** 2));
    const max = Math.max(...arr);
    return arr.map((v) => v / max);
  }, [bins]);
  const seed = useMemo(() => Array.from({length: bins}, (_, i) => 0.18 + rnd(i + 1) * 0.82), [bins]);
  const dots = useMemo(
    () =>
      Array.from({length: 70}, (_, k) => {
        const bin = Math.floor(rnd(k + 5.1) * bins);
        return {bin, delay: rnd(k + 2.3) * 0.62, x: bin * bw + bw / 2 + (rnd(k + 9.7) - 0.5) * bw * 0.5};
      }),
    [bins, bw],
  );

  const n = interpolate(frame, [8, frames * 0.78], [0, total], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const p = n / total;
  const heights = target.map((t, i) => seed[i] * (1 - p) + t * p);
  const curveOp = interpolate(p, [0.55, 0.92], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pts = heights.map((h, i) => [i * bw + bw / 2, H - h * H]);
  const curve = 'M' + pts.map((pt) => pt.join(',')).join(' L');

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 70, right: 70, top: '41%', height: '44%'}}>
        <div style={{fontFamily: 'var(--mono)', fontSize: 36, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em', marginBottom: 16}}>
          {Math.floor(n).toLocaleString('en-US')}
          <span style={{color: 'var(--muted)'}}> / {total.toLocaleString('en-US')} sims</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width: '100%', height: 'auto', overflow: 'visible'}}>
          {dots.map((d, k) => {
            const t = interpolate(p, [d.delay, d.delay + 0.12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            if (t <= 0 || t >= 1) return null;
            const binTop = H - heights[d.bin] * H;
            const y = interpolate(t, [0, 1], [-24, binTop], {easing: Easing.in(Easing.quad)});
            return <circle key={k} cx={d.x} cy={y} r={6} fill="var(--accent)" opacity={0.85 * (1 - t)} />;
          })}
          {heights.map((h, i) => (
            <rect key={i} x={i * bw + bw * 0.13} y={H - h * H} width={bw * 0.74} height={h * H} rx={5} fill="var(--accent)" opacity={0.92} />
          ))}
          <path d={curve} fill="none" stroke="var(--fg)" strokeWidth={3.5} opacity={curveOp} />
          <line x1={0} y1={H} x2={W} y2={H} stroke="var(--hairline)" strokeWidth={2} />
        </svg>
      </div>
      <SpecimenOverlay eyebrow={scene.eyebrow} headline={scene.headline} accentWords={scene.accentWords} />
    </AbsoluteFill>
  );
};
