import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {FlowGraphScene as FlowGraphSceneType} from '../video-schema';
import {drawX, fadeRise} from '../animation';
import {Chrome} from './Chrome';
import '../style.css';

const CX = 540; // pipeline column centre
const ENGINE_TOP = 706;
const STAGE_Y = (i: number) => 762 + i * 244; // engine, record, sealed
const NODE_HALF = 58;
const SPINE_X = 858;
const NODE_RIGHT = CX + 200;
const SRC_DOT_Y = 512;

// quadratic bezier point (source → converge → engine top)
const qbez = (t: number, sx: number, sy: number, cx: number, cy: number, ex: number, ey: number) => ({
  x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex,
  y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey,
});

const stateMark: Record<string, string> = {clear: '● clear', flag: '⚑ flag', pass: '● pass', valid: '✓ valid'};

export const FlowGraphScene: React.FC<{scene: FlowGraphSceneType; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = scene.sources.length;
  const srcX = (i: number) => (n === 1 ? CX : 175 + (i * 730) / (n - 1));
  const lastY = STAGE_Y(scene.stages.length - 1);

  const ribbonDraw = drawX(frame, 18, 24);
  const stageStart = (i: number) => 34 + i * 18;
  const built = stageStart(scene.stages.length - 1) + 16;
  const flowOn = frame > built + 6;

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : <Chrome kicker={scene.kicker} kickerRight={scene.kickerRight} footerRight={scene.footerRight} />}

        <div className="ng-stage">
          {scene.title ? (
            <div className="ng-title" style={fadeRise(frame, 4, 12)}>
              {scene.title}
            </div>
          ) : null}

          <svg className="ng-svg" viewBox="0 0 1080 1920" width={1080} height={1920}>
            <defs>
              {/* ribbons fade from neutral (sources) to petrol (toward the engine) —
                  "data becoming provable as it converges". */}
              <linearGradient id="fg-ribbon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{stopColor: 'var(--ng-edge)'}} />
                <stop offset="1" style={{stopColor: 'var(--accent)'}} />
              </linearGradient>
            </defs>

            {/* converging ribbons: each source streams in to the engine */}
            {scene.sources.map((_, i) => {
              const sx = srcX(i);
              const cx = CX;
              const cy = SRC_DOT_Y + (ENGINE_TOP - SRC_DOT_Y) * 0.46;
              const d = `M ${sx} ${SRC_DOT_Y} Q ${cx} ${cy} ${CX} ${ENGINE_TOP}`;
              return (
                <path
                  key={`r${i}`}
                  d={d}
                  fill="none"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - ribbonDraw}
                  stroke="url(#fg-ribbon)"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                />
              );
            })}

            {/* live pulses travelling each ribbon into the engine */}
            {flowOn
              ? scene.sources.map((_, i) => {
                  const sx = srcX(i);
                  const cy = SRC_DOT_Y + (ENGINE_TOP - SRC_DOT_Y) * 0.46;
                  const period = 84;
                  const t = (((frame - built) + i * 16) % period) / period;
                  const p = qbez(t, sx, SRC_DOT_Y, CX, cy, CX, ENGINE_TOP);
                  return (
                    <circle key={`rp${i}`} cx={p.x} cy={p.y} r={6} style={{fill: 'var(--accent)', filter: 'drop-shadow(0 0 8px var(--accent))'}} opacity={Math.sin(t * Math.PI) * 0.9} />
                  );
                })
              : null}

            {/* pipeline column connectors */}
            {scene.stages.slice(0, -1).map((_, i) => {
              const y1 = STAGE_Y(i) + NODE_HALF;
              const y2 = STAGE_Y(i + 1) - NODE_HALF;
              const accent = scene.stages[i + 1]?.accent;
              const prog = drawX(frame, stageStart(i + 1) - 4, 12);
              return (
                <line key={`c${i}`} x1={CX} y1={y1} x2={CX} y2={y1 + (y2 - y1) * prog} style={{stroke: accent ? 'var(--accent)' : 'var(--ng-edge)'}} strokeWidth={accent ? 4 : 2.5} />
              );
            })}

            {/* one pulse flowing down the whole pipeline */}
            {flowOn
              ? (() => {
                  const period = 116;
                  const t = ((frame - built) % period) / period;
                  const y = STAGE_Y(0) + (lastY - STAGE_Y(0)) * t;
                  return <circle cx={CX} cy={y} r={8} style={{fill: 'var(--accent)', filter: 'drop-shadow(0 0 12px var(--accent))'}} opacity={Math.sin(t * Math.PI) * 0.85} />;
                })()
              : null}

            {/* audit-chain spine on the right */}
            {(() => {
              const y0 = STAGE_Y(0);
              const yN = lastY;
              const sStart = built;
              const lp = drawX(frame, sStart, 16);
              return (
                <g>
                  <line x1={SPINE_X} y1={y0} x2={SPINE_X} y2={y0 + (yN - y0) * lp} style={{stroke: 'var(--accent)'}} strokeWidth={4} />
                  {scene.stages.map((_, i) => {
                    const ny = STAGE_Y(i);
                    const bStart = sStart + 6 + i * 8;
                    const bp = drawX(frame, bStart, 10);
                    return (
                      <g key={`sp${i}`}>
                        <line x1={NODE_RIGHT} y1={ny} x2={NODE_RIGHT + (SPINE_X - NODE_RIGHT) * bp} y2={ny} style={{stroke: 'var(--accent)'}} strokeWidth={2} opacity={0.6} />
                        <circle cx={SPINE_X} cy={ny} r={7} style={{fill: 'var(--accent)'}} opacity={drawX(frame, bStart + 6, 6)} />
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>

          {/* source labels (top) */}
          {scene.sources.map((s, i) => (
            <div key={`sl${i}`} className="fg-source" style={{left: srcX(i), top: 452, ...fadeRise(frame, 6 + i * 4, 12)}}>
              <span className="fg-source-label">{s.label}</span>
              <span className="fg-source-dot" />
            </div>
          ))}

          {/* pipeline stage nodes */}
          {scene.stages.map((st, i) => {
            const a = stageStart(i);
            const sp = spring({frame: frame - a, fps, config: {damping: 14, stiffness: 130, mass: 0.55}, durationInFrames: 14});
            const sc = interpolate(sp, [0, 1], [0.9, 1]);
            const op = interpolate(frame, [a, a + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            // the sealed (accent) record breathes a soft petrol glow once built
            const pulse = (Math.sin(frame * 0.11) + 1) / 2;
            const glow =
              st.accent && flowOn
                ? {boxShadow: `0 0 0 1px var(--accent), 0 0 ${26 + 14 * pulse}px rgba(15,92,92,${(0.16 + 0.1 * pulse).toFixed(3)}), 0 10px 34px rgba(0,0,0,0.08)`}
                : {};
            return (
              <div key={`st${i}`} className={`ng-node${st.accent ? ' r' : ''}`} style={{left: CX, top: STAGE_Y(i), opacity: op, transform: `translate(-50%, -50%) scale(${sc})`, ...glow}}>
                <div className="ng-node-label">{st.label}</div>
                {st.sub ? <div className="ng-node-sub">{st.sub}</div> : null}
              </div>
            );
          })}

          {/* checks annotation (left of the middle stage) */}
          {scene.checks && scene.checks.length ? (
            <div className="fg-checks" style={{top: STAGE_Y(Math.min(1, scene.stages.length - 1)) - 36, ...fadeRise(frame, built + 10, 12)}}>
              {scene.checks.map((c, i) => (
                <div key={i} className={`fg-check s-${c.state}`}>{stateMark[c.state]}</div>
              ))}
            </div>
          ) : null}

          {/* audit-chain vertical label */}
          {scene.auditLabel ? (
            <div className="ng-spine-label" style={{left: SPINE_X + 26, top: STAGE_Y(0) - 6, ...fadeRise(frame, built + 18, 14)}}>
              {scene.auditLabel}
            </div>
          ) : null}

          {scene.caption ? (
            <div className="ng-caption" style={{bottom: 360, ...fadeRise(frame, built + 14, 14)}}>
              {scene.caption}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
