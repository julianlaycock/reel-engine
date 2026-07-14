import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {RadarScene as RadarSceneType} from '../video-schema';
import {FONTS} from '@tokens/tokens';

// Radar / spider chart: a subject's profile across metrics; the polygon expands from the
// centre (staggered per axis). Optional player photo up top. Frame-deterministic.
export const RadarScene: React.FC<{scene: RadarSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const frames = scene.durationInFrames;
  const axes = scene.axes ?? [];
  const N = axes.length;
  const CX = 400, CY = 400, R = 250;

  const titleOp = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const ptFor = (i: number, pct: number) => {
    const ang = (-90 + (i * 360) / N) * (Math.PI / 180);
    return [CX + Math.cos(ang) * (pct / 100) * R, CY + Math.sin(ang) * (pct / 100) * R];
  };

  // value polygon vertices, each animating out from centre (staggered)
  const verts = axes.map((a, i) => {
    const t = interpolate(frame, [12 + i * 4, 12 + i * 4 + 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
    return ptFor(i, a.pct * t);
  });
  const poly = verts.map((v) => v.join(',')).join(' ');

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 60, right: 60, top: '12%', textAlign: 'center'}}>
        {scene.eyebrow ? <div style={{fontFamily: FONTS.mono, fontSize: 26, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: titleOp}}>{scene.eyebrow}</div> : null}
        {scene.photo ? (
          <div style={{width: 150, height: 150, borderRadius: '50%', overflow: 'hidden', margin: '16px auto 8px', border: '3px solid var(--accent)', opacity: titleOp}}>
            <Img src={staticFile(scene.photo)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        ) : null}
        {scene.title ? <div style={{fontFamily: FONTS.labelSans, fontWeight: 800, fontSize: 56, color: 'var(--fg)', letterSpacing: '-0.02em', opacity: titleOp, marginTop: 6}}>{scene.title}</div> : null}

        <svg viewBox="0 0 800 820" style={{width: '92%', height: 'auto', margin: '10px auto 0', display: 'block', overflow: 'visible'}}>
          {/* grid rings */}
          {[25, 50, 75, 100].map((ring) => (
            <polygon key={ring} points={axes.map((_, i) => ptFor(i, ring).join(',')).join(' ')} fill="none" stroke="var(--hairline)" strokeWidth={1.5} />
          ))}
          {/* spokes + labels */}
          {axes.map((a, i) => {
            const [ex, ey] = ptFor(i, 100);
            const [lx, ly] = ptFor(i, 118);
            const anchor = lx > CX + 20 ? 'start' : lx < CX - 20 ? 'end' : 'middle';
            return (
              <g key={i}>
                <line x1={CX} y1={CY} x2={ex} y2={ey} stroke="var(--hairline)" strokeWidth={1.5} />
                <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontFamily="var(--mono)" fontSize={22} fill="var(--muted)" style={{textTransform: 'uppercase', letterSpacing: '0.04em'}}>{a.label}</text>
                <text x={lx} y={ly + 26} textAnchor={anchor} dominantBaseline="middle" fontFamily="var(--mono)" fontSize={24} fontWeight={700} fill="var(--fg)">{a.display ?? Math.round(a.pct)}</text>
              </g>
            );
          })}
          {/* value polygon */}
          <polygon points={poly} fill="var(--accent)" fillOpacity={0.22} stroke="var(--accent)" strokeWidth={4} strokeLinejoin="round" />
          {verts.map((v, i) => <circle key={i} cx={v[0]} cy={v[1]} r={7} fill="var(--accent)" />)}
        </svg>
        {scene.caption ? <div style={{marginTop: 8, fontFamily: FONTS.mono, fontSize: 26, color: 'var(--muted)'}}>{scene.caption}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
