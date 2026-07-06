import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {Poisson2DScene as Poisson2DSceneType} from '../video-schema';
import {SpecimenOverlay} from './_overlay';
import {KatexMath} from './KatexMath';

const poisson = (k: number, l: number) => {
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.exp(-l) * Math.pow(l, k)) / f;
};

// Flat scoreline-probability heatmap (home goals × away goals). Single-hue accent
// opacity = probability; most-likely cell highlighted. Diagonal staggered reveal.
export const Poisson2D: React.FC<{scene: Poisson2DSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const size = scene.size ?? 5;
  const lh = scene.lambdaHome ?? 1.8;
  const la = scene.lambdaAway ?? 1.0;

  const {cells, max, top} = useMemo(() => {
    const list: {i: number; j: number; p: number}[] = [];
    let mx = 0;
    let tp = {i: 0, j: 0, p: 0};
    for (let i = 0; i <= size; i++)
      for (let j = 0; j <= size; j++) {
        const p = poisson(i, lh) * poisson(j, la);
        list.push({i, j, p});
        if (p > mx) mx = p;
        if (p > tp.p) tp = {i, j, p};
      }
    return {cells: list, max: mx, top: tp};
  }, [size, lh, la]);

  const cell = 110;
  const gap = 9;
  const span = (size + 1) * (cell + gap) - gap;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: '33%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{marginBottom: 26}}>
          <KatexMath latex={scene.formula ?? 'P(k)=\\frac{e^{-\\lambda}\\lambda^{k}}{k!}'} display={false} fontSize={40} color="var(--fg)" />
        </div>
        <svg viewBox={`-58 -16 ${span + 76} ${span + 76}`} style={{width: '74%', height: 'auto', overflow: 'visible'}}>
          {cells.map((c) => {
            const delay = 8 + (c.i + c.j) * 4;
            const op = interpolate(frame, [delay, delay + 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            const x = c.j * (cell + gap);
            const y = c.i * (cell + gap);
            const isTop = c.i === top.i && c.j === top.j;
            return (
              <g key={`${c.i}-${c.j}`} opacity={op}>
                <rect x={x} y={y} width={cell} height={cell} rx={10} fill="var(--accent)" fillOpacity={(c.p / max) * 0.95} stroke="var(--hairline)" strokeWidth={1} />
                {isTop ? <rect x={x} y={y} width={cell} height={cell} rx={10} fill="none" stroke="var(--fg)" strokeWidth={4} /> : null}
              </g>
            );
          })}
          {Array.from({length: size + 1}).map((_, k) => (
            <text key={'x' + k} x={k * (cell + gap) + cell / 2} y={span + 44} textAnchor="middle" fontSize={30} fill="var(--muted)" fontFamily="var(--mono)">
              {k}
            </text>
          ))}
          {Array.from({length: size + 1}).map((_, k) => (
            <text key={'y' + k} x={-30} y={k * (cell + gap) + cell / 2 + 10} textAnchor="middle" fontSize={30} fill="var(--muted)" fontFamily="var(--mono)">
              {k}
            </text>
          ))}
        </svg>
        <div style={{fontFamily: 'var(--mono)', fontSize: 30, color: 'var(--muted)', marginTop: 28, letterSpacing: '0.02em'}}>
          most likely · <span style={{color: 'var(--accent)', fontWeight: 700}}>{top.i}–{top.j}</span> · {(top.p * 100).toFixed(0)}%
        </div>
      </div>
      <SpecimenOverlay eyebrow={scene.eyebrow} headline={scene.headline} />
    </AbsoluteFill>
  );
};
