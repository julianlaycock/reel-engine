import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {NodeGraphScene as NodeGraphSceneType} from '../video-schema';
import {drawX, fadeRise, driftScale} from '../animation';
import {renderAccent} from '../accent';
import {Chrome} from './Chrome';
import '../style.css';

// Graph stage rect (inside the persistent chrome). Nodes' xPct/yPct map here.
// GY1 stops well above the kinetic-caption band (~1350-1450) so nodes never
// collide with the spoken captions or the scene caption line.
const GX0 = 130;
const GX1 = 950;
const GY0 = 455;
const GY1 = 1090;
const cx = (xPct: number) => GX0 + (xPct / 100) * (GX1 - GX0);
const cy = (yPct: number) => GY0 + (yPct / 100) * (GY1 - GY0);

export const NodeGraphScene: React.FC<{
  scene: NodeGraphSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drift = driftScale(frame, scene.durationInFrames);
  // 'vertical' layout centers every node in one column (a clean stepper) — a
  // distinct look from the default 'zigzag'. Rotate layouts across videos.
  // With an audit-trail spine, shift the pipeline column left to make room for
  // the spine + its branches on the right.
  const hasSpine = Boolean(scene.spine) && scene.layout === 'vertical';
  const vCenter = hasSpine ? 440 : (GX0 + GX1) / 2;
  const cxFor = (xPct: number) =>
    scene.layout === 'vertical' ? vCenter : cx(xPct);
  const SPINE_X = 850;
  const NODE_RIGHT = vCenter + 200; // just past the node's right edge

  const idOf: Record<string, number> = {};
  scene.nodes.forEach((n, i) => (idOf[n.id] = i));
  const nodeStart = (i: number) => 16 + i * 22;
  const builtFrame = nodeStart(scene.nodes.length - 1) + 16;

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : (
          <Chrome
            kicker={scene.kicker}
            kickerRight={scene.kickerRight}
            footerRight={scene.footerRight}
          />
        )}

        <div className="ng-stage" style={{transform: `scale(${drift})`}}>
          {scene.title ? (
            <div className="ng-title" style={fadeRise(frame, 4, 12)}>
              {scene.title}
            </div>
          ) : null}

          {/* connectors draw in once both endpoints exist; accent path carries a packet */}
          <svg className="ng-svg" viewBox="0 0 1080 1920" width={1080} height={1920}>
            {scene.edges.map((e, i) => {
              const s = scene.nodes[idOf[e.from]];
              const t = scene.nodes[idOf[e.to]];
              if (!s || !t) return null;
              const x1 = cxFor(s.xPct);
              const y1 = cy(s.yPct);
              const x2 = cxFor(t.xPct);
              const y2 = cy(t.yPct);
              const start = nodeStart(Math.max(idOf[e.from], idOf[e.to])) + 6;
              const prog = drawX(frame, start, 14);
              const ex = x1 + (x2 - x1) * prog;
              const ey = y1 + (y2 - y1) * prog;
              // Drive colours through the CSS `stroke`/`fill` *properties* (not SVG
              // attributes) so per-brand var() values resolve (attributes can't read var).
              const edgeColor = e.accent ? 'var(--accent)' : 'var(--ng-edge)';
              const period = 66;
              const local = (((frame - (start + 14)) % period) + period) % period;
              const pt = interpolate(local, [0, 26], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const px = x1 + (x2 - x1) * pt;
              const py = y1 + (y2 - y1) * pt;
              const packetOn = e.accent && frame > start + 14;
              return (
                <g key={i}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={ex}
                    y2={ey}
                    style={{stroke: edgeColor}}
                    strokeWidth={e.accent ? 5 : 3}
                  />
                  {packetOn ? <circle cx={px} cy={py} r={9} style={{fill: 'var(--accent)'}} /> : null}
                </g>
              );
            })}

            {/* audit-trail spine: a vertical accent line beside the pipeline, with a
                branch + commit-dot lighting up at each node — every step sealed. */}
            {hasSpine
              ? (() => {
                  const ys = scene.nodes.map((n) => cy(n.yPct));
                  const y0 = ys[0];
                  const yN = ys[ys.length - 1];
                  const sStart = builtFrame;
                  const lineProg = drawX(frame, sStart, 18);
                  const lineY2 = y0 + (yN - y0) * lineProg;
                  return (
                    <g>
                      <line
                        x1={SPINE_X}
                        y1={y0}
                        x2={SPINE_X}
                        y2={lineY2}
                        style={{stroke: 'var(--accent)'}}
                        strokeWidth={4}
                      />
                      {scene.nodes.map((n, i) => {
                        const ny = cy(n.yPct);
                        const bStart = sStart + 8 + i * 7;
                        const bp = drawX(frame, bStart, 10);
                        const bx = NODE_RIGHT + (SPINE_X - NODE_RIGHT) * bp;
                        const dotOp = drawX(frame, bStart + 6, 6);
                        return (
                          <g key={`sp-${i}`}>
                            <line
                              x1={NODE_RIGHT}
                              y1={ny}
                              x2={bx}
                              y2={ny}
                              style={{stroke: 'var(--accent)'}}
                              strokeWidth={2}
                              opacity={0.6}
                            />
                            <circle cx={SPINE_X} cy={ny} r={7} style={{fill: 'var(--accent)'}} opacity={dotOp} />
                          </g>
                        );
                      })}
                    </g>
                  );
                })()
              : null}

            {/* "data flowing through the system" — a soft glowing pulse travels the
                pipeline top→bottom on a slow loop once built. Nodes occlude it, so it
                reads as data entering and leaving each step. Restrained, by design. */}
            {scene.layout === 'vertical' && scene.nodes.length > 1
              ? (() => {
                  const fxp = cxFor(50);
                  const yTop = cy(scene.nodes[0].yPct);
                  const yBot = cy(scene.nodes[scene.nodes.length - 1].yPct);
                  const flowStart = builtFrame + 10;
                  if (frame < flowStart) return null;
                  const period = 118;
                  const ph = (((frame - flowStart) % period) + period) % period / period;
                  const y = yTop + (yBot - yTop) * ph;
                  const fade = Math.sin(ph * Math.PI);
                  return (
                    <circle
                      cx={fxp}
                      cy={y}
                      r={9}
                      style={{fill: 'var(--accent)', filter: 'drop-shadow(0 0 12px var(--accent))'}}
                      opacity={fade * 0.85}
                    />
                  );
                })()
              : null}
          </svg>

          {scene.nodes.map((n, i) => {
            const a = nodeStart(i);
            const s = spring({
              frame: frame - a,
              fps,
              config: {damping: 14, stiffness: 130, mass: 0.55},
              durationInFrames: 14,
            });
            const sc = interpolate(s, [0, 1], [0.9, 1]);
            const op = interpolate(frame, [a, a + 6], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={n.id}
                className={`ng-node${n.accent ? ' r' : ''}`}
                style={{
                  left: cxFor(n.xPct),
                  top: cy(n.yPct),
                  opacity: op,
                  transform: `translate(-50%, -50%) scale(${sc})`,
                }}
              >
                <div className="ng-node-label">{n.label}</div>
                {n.sub ? <div className="ng-node-sub">{n.sub}</div> : null}
              </div>
            );
          })}

          {hasSpine && scene.spine?.label ? (
            <div
              className="ng-spine-label"
              style={{
                left: SPINE_X + 28,
                top: cy(scene.nodes[0].yPct) - 6,
                ...fadeRise(frame, builtFrame + 22, 16),
              }}
            >
              {scene.spine.label}
            </div>
          ) : null}

          {scene.caption ? (
            <div className="ng-caption" style={fadeRise(frame, builtFrame + 8, 14)}>
              {renderAccent(scene.caption, scene.accentWords)}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
