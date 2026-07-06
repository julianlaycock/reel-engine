// Kinetic-text helpers ported verbatim from the reference (klWords, scr). Pure
// functions of `frame` — no state, no wall-clock. Used by the doctrine text scenes.
import type {CSSProperties} from 'react';
import {interp, easeOutExpo, STAGGER} from '../../motion';

export const FF = "'Inter Tight','Helvetica Neue',Arial,sans-serif";
export const MONO = "'IBM Plex Mono',ui-monospace,monospace";

export type KLWord = {text: string; outer: CSSProperties; inner: CSSProperties};

// Per word i: s = start + i*STAGGER; weight 320→650; masked rise translateY 112%→0;
// letter-spacing 0.1em→0; opacity over the first 6 frames.
export const klWords = (text: string, start: number, color: string, frame: number): KLWord[] => {
  const ws = text.split(' ');
  return ws.map((w, i) => {
    const s = start + i * STAGGER;
    const p = interp(frame, [s, s + 16], [0, 1], easeOutExpo);
    const wght = Math.round(320 + 330 * p);
    return {
      text: w,
      outer: {display: 'inline-block', overflow: 'hidden', paddingBottom: '0.14em', marginRight: '0.28em'},
      inner: {
        display: 'inline-block',
        fontFamily: FF,
        transform: `translateY(${(112 * (1 - p)).toFixed(1)}%)`,
        opacity: interp(frame, [s, s + 6], [0, 1]),
        letterSpacing: `${(0.1 * (1 - p)).toFixed(3)}em`,
        fontVariationSettings: `"wght" ${wght}`,
        fontWeight: wght,
        color,
      },
    };
  });
};

// Deterministic hash scramble→resolve, left→right. Chars …/space/‹ pass through.
// A char resolves once i/len <= prog; unresolved chars = deterministic hex from frame.
export const scr = (target: string, prog: number, frame: number): string => {
  const hex = '0123456789abcdef';
  let o = '';
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    if (ch === '…' || ch === ' ' || ch === '‹') {
      o += ch;
      continue;
    }
    if (i / target.length <= prog) o += ch;
    else o += hex[(Math.floor(frame * 0.9) + i * 13 + 5) % 16];
  }
  return o;
};
