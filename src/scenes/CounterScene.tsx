import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {CounterScene as CounterSceneType} from '../video-schema';
import {fadeRise, driftScale} from '../animation';
import {Chrome} from './Chrome';
import '../style.css';

export const CounterScene: React.FC<{
  scene: CounterSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const from = scene.from ?? 0;
  const decimals = scene.decimals ?? 0;

  // Number rolls up and decelerates into its final value (odometer feel).
  const rollEnd = Math.min(46, Math.round(durationInFrames * 0.5));
  const value = interpolate(frame, [10, 10 + rollEnd], [from, scene.to ?? 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  // Thousands grouping so 2251 reads "2,251" (matches the sub/caption copy).
  const groupThousands = (s: string) => {
    const neg = s.startsWith('-');
    const body = neg ? s.slice(1) : s;
    const [intPart, fracPart] = body.split('.');
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + grouped + (fracPart ? '.' + fracPart : '');
  };
  const display = groupThousands(value.toFixed(decimals));

  // Auto-fit the numeral so it never leaves the frame. The odometer STARTS at
  // `from` (the widest value shown) and rolls down to `to`; a fixed 380px only
  // fits the small landing value, so a large `from` (e.g. "2,251") spilled past
  // the 150px side margin. Size for the WIDEST formatted value across the roll —
  // digit count is monotonic between the endpoints, so max width is at whichever
  // endpoint has the larger magnitude, incl. its comma grouping (and any suffix).
  // Same usable column as the word path: 1080 − 2×86 (.drift) − 2×64 (.mid-counter) = 780px.
  // Tektur 900 tabular metrics (calibrated against a rendered "2,251": ~0.65em
  // per digit, comma ~0.33em). The numeral also rides the `land` scale below,
  // whose transform-origin is the LEFT edge — so scaling grows the number
  // RIGHTWARD. The widest VALUE (`from`) is on screen while land is clamped at
  // its start value (1.04), so we reserve that headroom in the fit.
  const LAND_MAX = 1.06;
  const numEmWidth = (str: string) =>
    [...str].reduce(
      (a, ch) =>
        a + (/[0-9]/.test(ch) ? 0.65 : /[+\-−]/.test(ch) ? 0.6 : /[.,]/.test(ch) ? 0.33 : 0.52),
      0,
    );
  const prefixStr = scene.prefix ?? '';
  const widestNumStr = [from, scene.to ?? 0]
    .map((n) => groupThousands(n.toFixed(decimals)))
    .reduce((a, b) => (numEmWidth(b) >= numEmWidth(a) ? b : a));
  const numEm =
    numEmWidth(prefixStr) +
    numEmWidth(widestNumStr) +
    (scene.suffix ? 0.34 * numEmWidth(scene.suffix) + 0.08 : 0);
  // Content band = 1080 − 2×86 (.drift) − 2×64 (.mid-counter) = 780px; hold back
  // 10px so no glyph kisses the 150px safe-zone line, and divide out the scale.
  const numSize = Math.min(380, Math.floor(770 / (Math.max(numEm, 0.62) * LAND_MAX)));
  const drift = driftScale(frame, durationInFrames);
  // Subtle punch as the number lands.
  const land = interpolate(frame, [10 + rollEnd - 6, 10 + rollEnd, 10 + rollEnd + 8], [1.04, 1.06, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Statement mode (treatment 05 language, 2026-07-08): a WORD replaces the
  // count-up as the giant focal. No odometer — it smooth-reveals (canon v2.5)
  // and lands with the same punch. Auto-fit so long statements ("MATCHED.")
  // never cross the 150px side margins: usable column = 1080 − 2×86 (.drift)
  // − 2×64 (.skin-americana .mid-counter pad → x150) = 780px; Tektur 900
  // uppercase runs ~0.7em/char, digits ~0.62, punctuation ~0.32.
  const word = scene.word;
  const wordEm = word
    ? [...word].reduce(
        (a, ch) =>
          a + (/[A-Za-z✓]/.test(ch) ? 0.7 : /[0-9]/.test(ch) ? 0.62 : /[+\-−~≈]/.test(ch) ? 0.6 : ch === ' ' ? 0.3 : 0.32),
        0,
      )
    : 0;
  const wordSize = word ? Math.min(380, Math.floor(780 / Math.max(wordEm, 0.62))) : undefined;
  const wordIn = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      <div className="frame">
        <div className="drift" style={{transform: `scale(${drift})`}}>
          {hideChrome ? null : (
            <Chrome
              kicker={scene.kicker}
              kickerRight={scene.kickerRight}
              footerRight={scene.footerRight}
            />
          )}
          <div className="mid mid-counter">
            {scene.headline ? (
              <div className="counter-head" style={fadeRise(frame, 8, 12)}>
                {scene.headline}
              </div>
            ) : null}
            {word ? (
              <div
                className="counter-num counter-word"
                style={{
                  transform: `scale(${land}) translateY(${(1 - wordIn) * 26}px)`,
                  opacity: wordIn,
                  fontSize: wordSize,
                }}
              >
                {word}
                {scene.counterpoint ? (
                  <span className="counter-counterpoint">{scene.counterpoint}</span>
                ) : null}
              </div>
            ) : (
              <div className="counter-num" style={{transform: `scale(${land})`, fontSize: numSize}}>
                {scene.prefix ?? ''}
                {display}
                {scene.suffix ? (
                  <span className={`counter-suffix${scene.accent ? ' r' : ''}`}>
                    {scene.suffix}
                  </span>
                ) : null}
              </div>
            )}
            {scene.sub ? (
              <div className="sub" style={fadeRise(frame, 10 + rollEnd, 12)}>
                {scene.sub}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
