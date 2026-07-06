import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {TimelineScene as TimelineSceneType} from '../video-schema';
import {drawX, fadeRise} from '../animation';
import {Chrome} from './Chrome';
import '../style.css';

const TL_X = 280; // the spine x
const Y0 = 640;
const Y1 = 1120;
const LINE_EXT = 34; // line runs past the first & last dots so they sit ON it

export const TimelineScene: React.FC<{scene: TimelineSceneType; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const n = scene.milestones.length;
  const yOf = (i: number) => (n <= 1 ? (Y0 + Y1) / 2 : Y0 + (i * (Y1 - Y0)) / (n - 1));

  const lineProg = drawX(frame, 14, 22);
  const mStart = (i: number) => 26 + i * 18;

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : <Chrome />}
        <div className="tl-stage">
          {scene.title ? (
            <div className="ng-title" style={fadeRise(frame, 4, 12)}>
              {scene.title}
            </div>
          ) : null}

          <svg className="ng-svg" viewBox="0 0 1080 1920" width={1080} height={1920}>
            <line
              x1={TL_X}
              y1={yOf(0) - LINE_EXT}
              x2={TL_X}
              y2={yOf(0) - LINE_EXT + (yOf(n - 1) - yOf(0) + 2 * LINE_EXT) * lineProg}
              style={{stroke: 'var(--ng-edge)'}}
              strokeWidth={3}
            />
            {scene.milestones.map((m, i) => {
              const y = yOf(i);
              const op = drawX(frame, mStart(i), 8);
              const r = 9 + 5 * op;
              return (
                <g key={i}>
                  <circle cx={TL_X} cy={y} r={r} style={{fill: m.accent ? 'var(--accent)' : 'var(--node-bg)', stroke: m.accent ? 'var(--accent)' : 'var(--fg)'}} strokeWidth={2} opacity={op} />
                  {m.accent ? <circle cx={TL_X} cy={y} r={r + 10} style={{fill: 'none', stroke: 'var(--accent)'}} strokeWidth={2} opacity={op * 0.4} /> : null}
                </g>
              );
            })}
          </svg>

          {scene.milestones.map((m, i) => (
            <div key={i} className={`tl-row${m.accent ? ' r' : ''}`} style={{top: yOf(i), ...fadeRise(frame, mStart(i) + 4, 12)}}>
              <span className="tl-date">{m.date}</span>
              <span className="tl-label">{m.label}</span>
            </div>
          ))}

          {scene.caption ? (
            <div className="ng-caption" style={{bottom: 340, fontSize: '46px', ...fadeRise(frame, mStart(n - 1) + 16, 14)}}>
              {scene.caption}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
