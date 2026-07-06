import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {drawX} from '../animation';

// Brand top/bottom meta bars shared by every non-card scene so cuts read as one piece.
export const Chrome: React.FC<{
  kicker?: string;
  kickerRight?: string;
  footerRight?: string;
}> = ({kicker, kickerRight, footerRight}) => {
  const frame = useCurrentFrame();
  const barOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ruleScale = drawX(frame, 0, 12);

  return (
    <>
      <div className="topbar" style={{opacity: barOpacity}}>
        <div className="top-rule" style={{transform: `scaleX(${ruleScale})`}} />
        <span className="meta">
          <span className="redmark" />
          {kicker ?? ''}
        </span>
        <span className="meta">{kickerRight ?? ''}</span>
      </div>
      <div className="botbar" style={{opacity: barOpacity}}>
        <span className="meta">caelithlabs.com</span>
        <span className="meta">{footerRight ?? ''}</span>
      </div>
    </>
  );
};
