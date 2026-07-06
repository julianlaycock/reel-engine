import React from 'react';
import type {CSSProperties} from 'react';
import {klWords, FF} from './kinetics';

// One kinetic-text line: each word rises out of an overflow-hidden mask while its
// weight (320→650) and letter-spacing (0.1em→0) settle. Verbatim from reference klWords.
export const KineticLine: React.FC<{
  text: string;
  start: number;
  color: string;
  frame: number;
  size: string;
  containerStyle?: CSSProperties;
}> = ({text, start, color, frame, size, containerStyle}) => {
  const words = klWords(text, start, color, frame);
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        fontFamily: FF,
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: '-0.03em',
        ...containerStyle,
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={w.outer}>
          <span style={w.inner}>{w.text}</span>
        </span>
      ))}
    </div>
  );
};
