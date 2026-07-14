import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import type {ShotMapScene as ShotMapSceneType} from '../video-schema';
import {renderAccent} from '../accent';
import {FONTS} from '@tokens/tokens';

const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Animated xG shot map on a vertical attacking-third pitch. Shots pop in (staggered),
// each sized by its xG (chance quality); a running xG total ticks up. The picture tells
// the story: a swarm of tiny dots = lots of shots, almost no real chances.
export const ShotMap: React.FC<{scene: ShotMapSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const frames = scene.durationInFrames;
  const N = scene.shots ?? 21;
  const xgTotal = scene.xgTotal ?? 1.49;
  const W = 1000, H = 1180;
  // pitch geometry (goal at top)
  const GOAL_Y = 70, BOXW = 560, BOX_Y = GOAL_Y + 360, SIXW = 300, SIX_Y = GOAL_Y + 150;

  const shots = useMemo(() => {
    const raw = Array.from({length: N}, (_, k) => {
      const gx = 500 + (rnd(k + 1.3) - 0.5) * 660;
      const dist = rnd(k + 4.7); // 0 close, 1 far
      const gy = GOAL_Y + 120 + dist * 560;
      const central = 1 - Math.abs(gx - 500) / 500;
      const w = Math.max(0.03, (1 - dist) * 0.85 + central * 0.45 + rnd(k + 8.1) * 0.25);
      return {gx: Math.max(90, Math.min(910, gx)), gy, w, delay: rnd(k + 2.2) * 0.66};
    });
    const sum = raw.reduce((s, r) => s + r.w, 0);
    return raw.map((r) => ({...r, xg: (r.w / sum) * xgTotal}));
  }, [N, xgTotal]);

  const p = interpolate(frame, [10, frames * 0.82], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const shownXg = shots.reduce((s, sh) => s + (p > sh.delay ? sh.xg : 0), 0);

  const line = 'var(--hairline)';
  const titleOp = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 60, right: 60, top: '11%'}}>
        {scene.eyebrow ? (
          <div style={{fontFamily: FONTS.mono, fontSize: 26, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: titleOp, marginBottom: 10}}>{scene.eyebrow}</div>
        ) : null}
        {scene.headline ? (
          <div style={{fontFamily: FONTS.labelSans, fontWeight: 800, fontSize: 52, lineHeight: 1.05, color: 'var(--fg)', letterSpacing: '-0.02em', opacity: titleOp, marginBottom: 18}}>{renderAccent(scene.headline, scene.accentWords)}</div>
        ) : null}
        {/* running total */}
        <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontFamily: FONTS.mono, fontVariantNumeric: 'tabular-nums', marginBottom: 14}}>
          <div style={{fontSize: 30, color: 'var(--muted)', letterSpacing: '0.08em'}}>{N} SHOTS</div>
          <div style={{fontSize: 64, fontWeight: 800, color: 'var(--accent)'}}>{shownXg.toFixed(2)}<span style={{fontSize: 30, color: 'var(--muted)'}}> xG</span></div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width: '100%', height: 'auto', overflow: 'visible'}}>
          {/* pitch (goal at top) */}
          <rect x={40} y={GOAL_Y} width={W - 80} height={H - GOAL_Y - 20} rx={10} fill="none" stroke={line} strokeWidth={2.5} />
          <rect x={(W - BOXW) / 2} y={GOAL_Y} width={BOXW} height={BOX_Y - GOAL_Y} fill="none" stroke={line} strokeWidth={2.5} />
          <rect x={(W - SIXW) / 2} y={GOAL_Y} width={SIXW} height={SIX_Y - GOAL_Y} fill="none" stroke={line} strokeWidth={2.5} />
          <line x1={(W - 220) / 2} y1={GOAL_Y} x2={(W + 220) / 2} y2={GOAL_Y} stroke="var(--fg)" strokeWidth={7} />
          <circle cx={500} cy={GOAL_Y + 230} r={4} fill={line} />
          <path d={`M ${(W - 240) / 2} ${BOX_Y} A 130 130 0 0 0 ${(W + 240) / 2} ${BOX_Y}`} fill="none" stroke={line} strokeWidth={2.5} />
          {/* shots */}
          {shots.map((s, k) => {
            const t = interpolate(p, [s.delay, s.delay + 0.12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2))});
            if (t <= 0) return null;
            const r = (10 + Math.sqrt(s.xg) * 92) * t;
            const big = s.xg >= 0.12;
            return <circle key={k} cx={s.gx} cy={s.gy} r={r} fill={big ? 'var(--accent)' : 'var(--muted)'} opacity={big ? 0.9 : 0.32} stroke={big ? 'var(--accent)' : 'none'} strokeWidth={2} />;
          })}
        </svg>
        {scene.caption ? <div style={{marginTop: 16, fontFamily: FONTS.mono, fontSize: 26, color: 'var(--muted)', textAlign: 'center'}}>{scene.caption}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
