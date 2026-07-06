import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {LoopGraphScene as LoopGraphSceneType} from '../video-schema';
import {drawX, driftScale, fadeRise} from '../animation';
import {renderAccent} from '../accent';
import {Chrome} from './Chrome';
import '../style.css';

// The loop stage: a circular pipeline. Nodes sit on a ring (clockwise from
// 12 o'clock), a packet orbits it continuously, and a center counter ticks
// once per revolution — the system prompting itself, no human at the wheel.
const CX = 540;
const CY = 812;
const R = 330;

const polar = (r: number, a: number): [number, number] => [
  CX + r * Math.cos(a),
  CY + r * Math.sin(a),
];

// Arc path along the ring from angle a0 to a1 (clockwise, a1 > a0).
const arcPath = (a0: number, a1: number) => {
  const [x0, y0] = polar(R, a0);
  const [x1, y1] = polar(R, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}`;
};

export const LoopGraphScene: React.FC<{
  scene: LoopGraphSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drift = driftScale(frame, scene.durationInFrames);

  const n = scene.nodes.length;
  const angleOf = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const nodeStart = (i: number) => 14 + i * 16;
  const builtFrame = nodeStart(n - 1) + 16;
  const orbitStart = builtFrame + 6;
  const P = scene.orbitPeriod ?? 150; // frames per revolution

  // Ring track draws in clockwise from the top while nodes pop in.
  const circumference = 2 * Math.PI * R;
  const trackProg = drawX(frame, 8, 34);

  // Orbit state — the packet's angle, plus how far into the run we are.
  const t = Math.max(0, frame - orbitStart);
  const orbiting = frame >= orbitStart;
  const packetAngle = -Math.PI / 2 + (t / P) * Math.PI * 2;
  const cycle = Math.floor(t / P) + 1;
  const cycleLocal = t % P;

  // Counter tick: a small settle-pop each time the revolution completes.
  const tickP = interpolate(cycleLocal, [0, 7, 14], [1.12, 1.03, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fail branch out of the gate node: drawn as the packet first reaches the
  // gate, then a small item escapes down it once per revolution — the loop
  // handling what it can and escalating the rest.
  const branch = scene.branch;
  const gateIdx = branch ? Math.min(Math.max(branch.fromIndex, 0), n - 1) : -1;
  const gateFrac = gateIdx >= 0 ? gateIdx / n : 0;
  const branchStart = orbitStart + Math.round(P * gateFrac) + 4;
  const branchProg = branch ? drawX(frame, branchStart, 14) : 0;

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

          <svg className="ng-svg" viewBox="0 0 1080 1920" width={1080} height={1920}>
            {/* the ring — a hairline track the whole system runs on */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              style={{stroke: 'var(--ng-edge)'}}
              strokeWidth={3}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - trackProg)}
              transform={`rotate(-90 ${CX} ${CY})`}
            />

            {/* direction ticks — small arrowheads showing the flow is clockwise */}
            {Array.from({length: n}).map((_, i) => {
              const a = angleOf(i) + Math.PI / n; // between nodes
              const [tx, ty] = polar(R, a);
              const deg = (a * 180) / Math.PI + 90;
              const op = drawX(frame, builtFrame - 6, 10) * 0.85;
              return (
                <g key={`tick-${i}`} transform={`translate(${tx} ${ty}) rotate(${deg})`} opacity={op}>
                  <path d="M -8 5 L 0 -6 L 8 5" fill="none" style={{stroke: 'var(--ng-edge)'}} strokeWidth={3} />
                </g>
              );
            })}

            {/* packet trail — a short accent arc fading behind the orbiting dot */}
            {orbiting ? (
              <>
                <path
                  d={arcPath(packetAngle - 0.85, packetAngle)}
                  fill="none"
                  style={{stroke: 'var(--accent)'}}
                  strokeWidth={5}
                  strokeLinecap="round"
                  opacity={0.3}
                />
                <path
                  d={arcPath(packetAngle - 0.32, packetAngle)}
                  fill="none"
                  style={{stroke: 'var(--accent)'}}
                  strokeWidth={5}
                  strokeLinecap="round"
                  opacity={0.6}
                />
                <circle
                  cx={polar(R, packetAngle)[0]}
                  cy={polar(R, packetAngle)[1]}
                  r={10}
                  style={{fill: 'var(--accent)'}}
                />
              </>
            ) : null}

            {/* fail branch: gate → outside the loop. Draws once, then a small
                item escapes down it each revolution and fades out. */}
            {branch && frame >= branchStart
              ? (() => {
                  const ga = angleOf(gateIdx);
                  const [gx, gy] = polar(R + 58, ga);
                  const [bx, by] = polar(R + 190, ga);
                  const ex = gx + (bx - gx) * branchProg;
                  const ey = gy + (by - gy) * branchProg;
                  // escaping item: departs each time the packet passes the gate
                  const sinceGate = ((t - P * gateFrac) % P + P) % P;
                  const esc = interpolate(sinceGate, [4, 26], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
                  const showEsc = branchProg >= 1 && esc > 0 && esc < 1;
                  return (
                    <g>
                      <line
                        x1={gx}
                        y1={gy}
                        x2={ex}
                        y2={ey}
                        style={{stroke: 'var(--accent)'}}
                        strokeWidth={3}
                        strokeDasharray="7 8"
                        opacity={0.8}
                      />
                      {showEsc ? (
                        <circle
                          cx={gx + (bx - gx) * esc}
                          cy={gy + (by - gy) * esc}
                          r={7}
                          style={{fill: 'var(--accent)'}}
                          opacity={1 - esc * 0.6}
                        />
                      ) : null}
                    </g>
                  );
                })()
              : null}
          </svg>

          {/* nodes on the ring — flat, sharp-cornered (Pure Programme) */}
          {scene.nodes.map((node, i) => {
            const a = angleOf(i);
            const [x, y] = polar(R, a);
            const start = nodeStart(i);
            const s = spring({
              frame: frame - start,
              fps,
              config: {damping: 14, stiffness: 130, mass: 0.55},
              durationInFrames: 14,
            });
            const sc = interpolate(s, [0, 1], [0.9, 1]);
            const op = interpolate(frame, [start, start + 6], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            // light up as the packet passes: shortest angular distance → glow
            let glow = 0;
            if (orbiting) {
              const diff = Math.abs(
                ((packetAngle - a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI,
              );
              glow = Math.max(0, 1 - diff / 0.38);
            }
            return (
              <div
                key={i}
                className={`lg-node${node.accent ? ' r' : ''}`}
                style={{
                  left: x,
                  top: y,
                  opacity: op,
                  transform: `translate(-50%, -50%) scale(${sc + glow * 0.03})`,
                }}
              >
                <div className="lg-glow" style={{opacity: glow}} />
                <div className="lg-node-label">{node.label}</div>
                {node.sub ? <div className="lg-node-sub">{node.sub}</div> : null}
              </div>
            );
          })}

          {/* branch label — the human's only entry point. Clamped to the safe
              area so it never clips at the frame edge. */}
          {branch
            ? (() => {
                const [lx, ly] = polar(R + 214, angleOf(gateIdx));
                return (
                  <div
                    className="lg-branch-label"
                    style={{
                      left: Math.min(Math.max(lx, 250), 800),
                      top: Math.min(ly, 1300),
                      ...fadeRise(frame, branchStart + 12, 12),
                    }}
                  >
                    <div className="lg-branch-title">{branch.label}</div>
                    {branch.sub ? <div className="lg-branch-sub">{branch.sub}</div> : null}
                  </div>
                );
              })()
            : null}

          {/* center counter — the loop keeps going: cycle 001, 002, 003 … */}
          <div className="lg-center" style={fadeRise(frame, orbitStart, 14)}>
            <div className="lg-center-label">{scene.centerLabel ?? 'cycle'}</div>
            <div className="lg-center-num" style={{transform: `scale(${orbiting ? tickP : 1})`}}>
              {String(Math.max(1, cycle)).padStart(3, '0')}
            </div>
            {scene.centerSub ? <div className="lg-center-sub">{scene.centerSub}</div> : null}
          </div>

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
