import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {FormulaScene as FormulaSceneType} from '../video-schema';
import {springIn} from '../animation';
import {KatexMath} from './KatexMath';
import {FONTS} from '@tokens/tokens';

// Render a math string with ^(...) / ^x as superscripts.
export const renderMath = (s: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < s.length) {
    if (s[i] === '^') {
      if (s[i + 1] === '(') {
        const end = s.indexOf(')', i + 2);
        out.push(<sup key={key++}>{s.slice(i + 2, end)}</sup>);
        i = end + 1;
      } else {
        out.push(<sup key={key++}>{s[i + 1]}</sup>);
        i += 2;
      }
    } else {
      let j = i;
      while (j < s.length && s[j] !== '^') j++;
      out.push(<span key={key++}>{s.slice(i, j)}</span>);
      i = j;
    }
  }
  return out;
};

// A dedicated "here's the maths" beat: a brief formula shown big, with a plain-
// language gloss. The quantity being defined (left of '=') gets the brand accent.
export const Formula: React.FC<{scene: FormulaSceneType; hideChrome?: boolean}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chip = springIn(frame, 8, fps, 0.92);
  const glossOp = interpolate(frame, [22, 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: '0 60px', textAlign: 'center'}}>
      {scene.eyebrow ? (
        <div style={{fontFamily: FONTS.mono, fontSize: 24, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 30, ...springIn(frame, 2, fps)}}>
          {scene.eyebrow}
        </div>
      ) : null}
      <div style={{...chip, maxWidth: '92%', display: 'flex', justifyContent: 'center'}}>
        <KatexMath latex={scene.formula} fontSize={60} color="var(--fg)" />
      </div>
      {scene.gloss ? (
        <div style={{opacity: glossOp, fontFamily: FONTS.label, fontWeight: 600, fontSize: 38, lineHeight: 1.18, color: 'var(--fg)', marginTop: 36, maxWidth: 820}}>
          {scene.gloss}
        </div>
      ) : null}
      {scene.note ? (
        <div style={{opacity: glossOp, fontFamily: FONTS.mono, fontSize: 20, color: 'var(--muted)', marginTop: 18, letterSpacing: '0.03em'}}>{scene.note}</div>
      ) : null}
    </AbsoluteFill>
  );
};
