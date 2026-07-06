import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {prepareWithSegments, layoutNextLineRange, materializeLineRange} from '@chenglou/pretext';
import {Chrome} from './Chrome';
import '../style.css';

const STAGE_X = 110;
const STAGE_W = 860;

// Pretext (chenglou): per-line-width text layout. Modes:
//  - wrap around an obstacle (square or a big number/label); obstacle.moveY animates → live reflow
//  - fill a shape (circle/diamond): text centered, width follows the shape profile
export const PretextScene: React.FC<{scene: any; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const text: string = scene.text ?? '';
  const fontSize: number = scene.fontSize ?? 50;
  const lineHeight: number = scene.lineHeight ?? Math.round(fontSize * 1.34);
  const weight: number = scene.fontWeight ?? 600;
  const font = `${weight} ${fontSize}px "Inter Tight", sans-serif`;
  const stageY: number = scene.stageY ?? 470;
  const fill = scene.fill; // {shape:'circle'|'diamond', r}
  const obs = scene.obstacle; // {w,h,gap,label?,labelSize?,moveY?:[a,b]}
  const justifyNarrow: boolean = scene.justifyNarrow ?? false;

  let obsY = 0;
  if (obs?.moveY) obsY = interpolate(frame, [0, Math.max(scene.durationInFrames - 1, 1)], obs.moveY, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const obsX = obs ? STAGE_W - obs.w : 0;

  const lines: Array<{text: string; y: number; width: number; maxWidth: number; offsetX: number; center: boolean; last?: boolean}> = [];
  try {
    const prepared = prepareWithSegments(text, font);
    let cursor = {segmentIndex: 0, graphemeIndex: 0};
    let y = 0;
    let guard = 0;
    while (guard++ < 90) {
      let maxWidth: number;
      let offsetX = 0;
      let center = false;
      if (fill) {
        const r: number = fill.r;
        const dy = y + lineHeight / 2 - r;
        const halfW = fill.shape === 'circle' ? Math.sqrt(Math.max(0, r * r - dy * dy)) : Math.max(0, r - Math.abs(dy));
        maxWidth = Math.max(60, halfW * 2);
        offsetX = STAGE_W / 2 - halfW;
        center = true;
        if (y > r * 2) break;
      } else if (obs) {
        const overlaps = y < obsY + obs.h && y + lineHeight > obsY;
        maxWidth = overlaps ? obsX - (obs.gap ?? 46) : STAGE_W;
      } else {
        maxWidth = STAGE_W;
      }
      const range = layoutNextLineRange(prepared, cursor, maxWidth);
      if (!range) break;
      const ln = materializeLineRange(prepared, range);
      lines.push({text: ln.text.trim(), y, width: ln.width, maxWidth, offsetX, center});
      const adv = range.end.segmentIndex !== cursor.segmentIndex || range.end.graphemeIndex !== cursor.graphemeIndex;
      cursor = range.end;
      y += lineHeight;
      if (!adv) break;
    }
    if (lines.length && !fill) lines[lines.length - 1].last = true;
  } catch (e) {
    /* fallback: empty */
  }

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : <Chrome kicker={scene.kicker} kickerRight={scene.kickerRight} footerRight={scene.footerRight} />}
        {scene.eyebrow ? <div className="pt-eyebrow">{scene.eyebrow}</div> : null}
        <div style={{position: 'absolute', left: STAGE_X, top: stageY, width: STAGE_W}}>
          {obs ? (
            <div
              style={{
                position: 'absolute',
                left: obsX,
                top: obsY,
                width: obs.w,
                height: obs.h,
                background: obs.label ? 'transparent' : '#d62828',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {obs.label ? (
                <span style={{fontSize: obs.labelSize ?? 200, fontWeight: 700, color: '#d62828', lineHeight: 1, letterSpacing: '-0.04em'}}>{obs.label}</span>
              ) : null}
            </div>
          ) : null}
          {lines.map((ln, i) => {
            const op = interpolate(frame, [10 + i * 2, 10 + i * 2 + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            const spaces = (ln.text.match(/\s+/g) || []).length;
            const doJustify = !ln.last && !ln.center && spaces > 0 && (justifyNarrow || ln.maxWidth >= STAGE_W - 10);
            const extra = doJustify ? (ln.maxWidth - ln.width) / spaces : 0;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: ln.y,
                  left: ln.center ? ln.offsetX : 0,
                  width: ln.maxWidth,
                  opacity: op,
                  fontFamily: '"Inter Tight", sans-serif',
                  fontWeight: weight,
                  fontSize,
                  lineHeight: `${lineHeight}px`,
                  color: '#f4f2ec',
                  whiteSpace: 'nowrap',
                  wordSpacing: `${extra}px`,
                  textAlign: ln.center ? 'center' : 'left',
                }}
              >
                {ln.text}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
