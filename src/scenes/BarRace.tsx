import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import type {BarRaceScene as BarRaceSceneType} from '../video-schema';
import {FONTS} from '@tokens/tokens';

// Bar-chart race: each entity's value animates across time steps; bars reorder by rank
// and the step label ("year") advances. Built-in "who wins?" open loop. Frame-deterministic.
export const BarRace: React.FC<{scene: BarRaceSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const f = scene.durationInFrames;
  const steps = scene.steps ?? [];
  const entities = scene.entities ?? [];
  const lastStep = Math.max(steps.length - 1, 0);

  // progress along the timeline (hold briefly at start + end)
  const t = interpolate(frame, [8, f - 12], [0, lastStep], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad),
  });
  const i0 = Math.floor(t), i1 = Math.min(i0 + 1, lastStep), frac = t - i0;

  const cur = entities.map((e, idx) => {
    const a = e.values[i0] ?? 0, b = e.values[i1] ?? a;
    return {idx, label: e.label, accent: e.accent, value: a + (b - a) * frac};
  });
  const maxVal = Math.max(...cur.map((c) => c.value), 1) * 1.06;

  // rank by current value (desc) → row y
  const order = [...cur].sort((x, y) => y.value - x.value);
  const rankOf = new Map(order.map((c, r) => [c.idx, r]));

  const rowH = 92;
  const fmt = (v: number) => `${scene.prefix ?? ''}${Math.round(v).toLocaleString('en-US')}${scene.suffix ?? ''}`;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 64, right: 64, top: '16%'}}>
        {scene.title ? (
          <div style={{fontFamily: FONTS.mono, fontSize: 26, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8}}>{scene.title}</div>
        ) : null}
        {/* the advancing step label — the "clock" of the race */}
        <div style={{fontFamily: FONTS.mono, fontVariantNumeric: 'tabular-nums', fontSize: 88, fontWeight: 700, color: 'var(--accent)', lineHeight: 1, marginBottom: 24}}>
          {steps[Math.round(t)] ?? ''}
        </div>

        <div style={{position: 'relative', height: entities.length * rowH}}>
          {cur.map((c) => {
            const r = rankOf.get(c.idx) ?? 0;
            const w = (c.value / maxVal) * 100;
            return (
              <div key={c.idx} style={{position: 'absolute', left: 0, right: 0, top: r * rowH, height: rowH - 16}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8}}>
                  <span style={{fontFamily: FONTS.labelEmoji, fontWeight: 600, fontSize: 34, color: 'var(--fg)'}}>{c.label}</span>
                  <span style={{fontFamily: FONTS.mono, fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 36, color: c.accent ? 'var(--accent)' : 'var(--fg)'}}>{fmt(c.value)}</span>
                </div>
                <div style={{height: 26, borderRadius: 8, background: 'var(--track, rgba(0,0,0,0.08))'}}>
                  <div style={{width: `${w}%`, height: '100%', borderRadius: 8, background: 'var(--accent)', opacity: c.accent ? 1 : 0.4}} />
                </div>
              </div>
            );
          })}
        </div>

        {scene.caption ? (
          <div style={{marginTop: 24, fontFamily: FONTS.mono, fontSize: 26, color: 'var(--muted)'}}>{scene.caption}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
