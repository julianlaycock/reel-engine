import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {RosterStaggerScene as RosterStaggerSceneType} from '../video-schema';
import {pop} from '../animation';
import {Chrome} from './Chrome';
import {ACCENTS} from '@tokens/tokens';
import '../style.css';

// ROSTER STAGGER (roster-stagger): a numbered list where rows SNAP IN one-by-one
// (chevron › + number + label). Each row's vertical space is RESERVED up front
// (all rows are laid out from frame 0) so animating one row never shifts another
// — reflow law. Rows animate ONLY opacity/transform via pop().
//
// Accent (chevron + number) tracks field brightness: acid on dark fields
// (ink/signal), caret-teal on light fields — the acid-on-dark law. Labels use
// var(--fg). `atFrame` per item lets the author sync a reveal to the VO.
export const RosterStagger: React.FC<{
  scene: RosterStaggerSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dark = scene.field === 'ink' || scene.field === 'signal';
  const accent = dark ? ACCENTS.acid : ACCENTS.caretTeal;
  const accentShadow = dark ? '0 0 16px rgba(57, 255, 53, 0.3)' : 'none';
  const items = scene.items ?? [];

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : (
          <Chrome kicker={scene.kicker} kickerRight={scene.kickerRight} footerRight={scene.footerRight} />
        )}
        <div className="rs-stage">
          {scene.ruleTitle ? <div className="rs-title">{scene.ruleTitle}</div> : null}
          <div className="rs-list">
            {items.map((it, i) => {
              const delay = it.atFrame ?? 12 + i * 10;
              return (
                <div key={i} className="rs-row" style={pop(frame, delay, fps)}>
                  <span className="rs-chev" style={{color: accent}}>
                    ›
                  </span>
                  <span className="rs-num" style={{color: accent, textShadow: accentShadow}}>
                    {it.n}
                  </span>
                  <span className="rs-label">{it.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
