import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {FieldGridScene as FieldGridSceneType} from '../video-schema';
import {fadeRise} from '../animation';
import {Chrome} from './Chrome';
import '../style.css';

export const FieldGridScene: React.FC<{scene: FieldGridSceneType; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const cols = scene.cols ?? 15;
  const rows = scene.rows ?? 12;
  const total = cols * rows;
  const flaggedCount = scene.flaggedCount ?? 4;

  // deterministic, spread flag positions (no Math.random in Remotion)
  const flagged = new Set<number>();
  for (let k = 0; k < flaggedCount; k += 1) {
    const idx = Math.floor(((k + 1) / (flaggedCount + 1)) * total + (k % 2 ? cols * 2 + 3 : -cols - 2));
    flagged.add(((idx % total) + total) % total);
  }

  const FILL_START = 18;
  const STEP = 4; // frames per diagonal
  const maxDiag = rows - 1 + (cols - 1);
  const fillDone = FILL_START + maxDiag * STEP + 10;
  const sealP = interpolate(frame, [fillDone, fillDone + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const i = r * cols + c;
      const on = frame > FILL_START + (r + c) * STEP;
      const isFlag = flagged.has(i);
      const op = interpolate(frame, [FILL_START + (r + c) * STEP, FILL_START + (r + c) * STEP + 7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      cells.push(
        <div
          key={i}
          className={`grid-cell${on ? (isFlag ? ' flag' : ' fill') : ''}`}
          style={on ? {opacity: 0.35 + 0.65 * op, transform: `scale(${0.7 + 0.3 * op})`} : undefined}
        />,
      );
    }
  }

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

          <div className="grid-wrap">
            <div className="grid-top" style={fadeRise(frame, 8, 12)}>
              <span className="grid-label">{scene.label ?? `Annex IV · ${total} fields`}</span>
              <span className="grid-count">
                {scene.filled ?? total - flaggedCount} mapped<span className="grid-flag"> · {flaggedCount} flagged ⚑</span>
              </span>
            </div>
            <div className="grid-cells" style={{gridTemplateColumns: `repeat(${cols}, 1fr)`}}>
              {cells}
            </div>
            {/* seal sweep + label */}
            <div className="grid-seal" style={{opacity: sealP}}>
              <span className="grid-seal-mark">◆</span> {scene.sealLabel ?? 'sealed · sha-256 chain'}
            </div>
          </div>

          {scene.caption ? (
            <div className="ng-caption" style={{bottom: 300, ...fadeRise(frame, fillDone + 6, 14)}}>
              {scene.caption}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
