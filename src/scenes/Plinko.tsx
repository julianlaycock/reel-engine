import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import type {PlinkoScene as PlinkoSceneType} from '../video-schema';
import {SpecimenOverlay} from './_overlay';
import {FONTS} from '@tokens/tokens';

const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// "82% to advance — and 18% is not zero." Sims drop through a peg field and pile
// into two outcome bins. The OUT bin (accent) fills to a visibly real fraction:
// the favourite still falls. Pure function of frame; minimal/white aesthetic.
export const Plinko: React.FC<{scene: PlinkoSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const frames = scene.durationInFrames;
  const total = scene.total ?? 10000;
  const through = (scene.throughPct ?? 82) / 100;
  const out = 1 - through;
  const throughLabel = scene.throughLabel ?? 'THROUGH';
  const outLabel = scene.outLabel ?? 'OUT';
  const pegRows = scene.rows ?? 7;

  const W = 1000;
  const H = 600;
  const BIN_TOP = 380; // bins occupy 380..560
  const BIN_FLOOR = 560;
  const MAX_FILL = BIN_FLOOR - BIN_TOP; // 180px = full scale (= 100% of sims)
  const THROUGH_CX = 320;
  const OUT_CX = 690;
  const BIN_W = 230;

  // Peg field — static triangle of pegs.
  const pegs = useMemo(() => {
    const arr: {x: number; y: number}[] = [];
    for (let r = 0; r < pegRows; r++) {
      const y = 60 + r * ((BIN_TOP - 90) / pegRows);
      const count = r + 3;
      const span = 150 + r * 70;
      for (let c = 0; c < count; c++) {
        const x = 500 - span / 2 + (c * span) / (count - 1);
        arr.push({x, y});
      }
    }
    return arr;
  }, [pegRows]);

  // Falling sims — outcome decided deterministically; scatter is decorative.
  const balls = useMemo(
    () =>
      Array.from({length: 120}, (_, k) => {
        const isOut = rnd(k + 5.1) < out;
        const cx = isOut ? OUT_CX : THROUGH_CX;
        const finalX = cx + (rnd(k + 9.7) - 0.5) * BIN_W * 0.78;
        return {isOut, finalX, delay: rnd(k + 2.3) * 0.6, wob: rnd(k + 1.1) * 2 + 2};
      }),
    [out],
  );

  const p = interpolate(frame, [8, frames * 0.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const throughN = Math.floor(p * total * through);
  const outN = Math.floor(p * total * out);
  const throughH = through * p * MAX_FILL;
  const outH = out * p * MAX_FILL;
  const pct = (v: number) => Math.round(v * 100);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 60, right: 60, top: '34%', height: '52%'}}>
        {/* ticking counters */}
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.mono, fontVariantNumeric: 'tabular-nums', marginBottom: 10}}>
          <div>
            <div style={{fontSize: 22, color: 'var(--muted)', letterSpacing: '0.08em'}}>{throughLabel}</div>
            <div style={{fontSize: 40, color: 'var(--fg)'}}>{throughN.toLocaleString('en-US')} <span style={{fontSize: 26, color: 'var(--muted)'}}>· {pct(through)}%</span></div>
          </div>
          <div style={{textAlign: 'right'}}>
            <div style={{fontSize: 22, color: 'var(--accent)', letterSpacing: '0.08em'}}>{outLabel}</div>
            <div style={{fontSize: 40, color: 'var(--accent)'}}>{outN.toLocaleString('en-US')} <span style={{fontSize: 26, opacity: 0.7}}>· {pct(out)}%</span></div>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} style={{width: '100%', height: 'auto', overflow: 'visible'}}>
          {/* pegs */}
          {pegs.map((pg, i) => (
            <circle key={`p${i}`} cx={pg.x} cy={pg.y} r={4} fill="var(--hairline)" />
          ))}

          {/* bin outlines */}
          {[
            {cx: THROUGH_CX, h: throughH, accent: false},
            {cx: OUT_CX, h: outH, accent: true},
          ].map((b, i) => (
            <g key={`b${i}`}>
              <rect x={b.cx - BIN_W / 2} y={BIN_TOP} width={BIN_W} height={MAX_FILL} rx={8} fill="none" stroke="var(--hairline)" strokeWidth={2} />
              <rect
                x={b.cx - BIN_W / 2 + 4}
                y={BIN_FLOOR - b.h}
                width={BIN_W - 8}
                height={b.h}
                rx={6}
                fill={b.accent ? 'var(--accent)' : 'var(--fg)'}
                opacity={b.accent ? 0.95 : 0.88}
              />
            </g>
          ))}

          {/* falling sims */}
          {balls.map((d, k) => {
            const t = interpolate(p, [d.delay, d.delay + 0.16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            if (t <= 0 || t >= 1) return null;
            const y = interpolate(t, [0, 1], [-20, BIN_TOP - 14], {easing: Easing.in(Easing.quad)});
            const x = 500 + (d.finalX - 500) * t + Math.sin(t * d.wob * Math.PI) * 26 * (1 - t);
            return <circle key={`f${k}`} cx={x} cy={y} r={6} fill={d.isOut ? 'var(--accent)' : 'var(--fg)'} opacity={0.85 * (1 - t * 0.3)} />;
          })}

          {/* bin labels */}
          <line x1={0} y1={BIN_FLOOR} x2={W} y2={BIN_FLOOR} stroke="var(--hairline)" strokeWidth={2} />
        </svg>
      </div>
      <SpecimenOverlay eyebrow={scene.eyebrow} headline={scene.headline} accentWords={scene.accentWords} />
    </AbsoluteFill>
  );
};
