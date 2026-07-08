import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VersusScene as VersusSceneType} from '../video-schema';
import {accentPop, driftScale, fadeRise, pop} from '../animation';
import {Chrome} from './Chrome';
import '../style.css';

// Two contrasting figures: left (problem) enters, then right (payoff, red) pops in
// — the core tension beat. Staggered so it builds rather than appears at once.
export const VersusScene: React.FC<{
  scene: VersusSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const drift = driftScale(frame, durationInFrames);

  // Auto-fit the value type to the longest word so long values (e.g. "MINUTES")
  // never clip the column. Both sides share one size so the pair stays balanced.
  // Leading +/−/~ signs are near-full-width glyphs at display weights — count
  // them as an extra character or signed pairs ("+50%" vs "−70%") clip the frame.
  const effLen = (v: string) => v.length + (/^[+\-−~≈]/.test(v) ? 1 : 0);
  const longest = Math.max(effLen(scene.leftValue), effLen(scene.rightValue));
  const tableSize =
    longest <= 4 ? 170 : longest <= 5 ? 142 : longest <= 6 ? 120 : longest <= 7 ? 102 : longest <= 9 ? 82 : 68;
  // Width-aware clamp (canon v2.8 §2 — structural per §0). The band table above
  // was tuned for digit values ("+180"); uppercase WORDS at 800 weight run
  // ~0.65em/char, so a pair like GUESSED vs MATCHED overflowed the stage and
  // pushed the right column off-frame. Estimate both values' widths in em and
  // cap the shared size so the whole row always fits the padded stage:
  // 1080 − 2×86 (.drift) − 2×150 (.mid-versus safe zone) − 2×30 gaps − ~46 'vs'.
  const emW = (v: string) =>
    [...v].reduce(
      (a, ch) =>
        a +
        (/[A-Za-z]/.test(ch) ? 0.66 : /[0-9]/.test(ch) ? 0.58 : /[+\-−~≈]/.test(ch) ? 0.6 : ch === ' ' ? 0.28 : 0.4),
      0,
    );
  const VS_ROW_AVAIL = 1080 - 2 * 86 - 2 * 150 - 2 * 30 - 46;
  const valueSize = Math.min(tableSize, Math.floor(VS_ROW_AVAIL / (emW(scene.leftValue) + emW(scene.rightValue))));

  // Labels get the same treatment values already had — auto-fit so a long label
  // ("SMALLEST CHANGE", "MATCHED") can never cross the platform safe-zone margin.
  // Column width ≈ (1080 − 2×150 side margins − divider) / 2 ≈ 340px usable; the
  // 30px mono label runs ~18px/char, so shrink past ~13 chars.
  const longestLabel = Math.max(scene.leftLabel?.length ?? 0, scene.rightLabel?.length ?? 0);
  const labelSize = longestLabel <= 13 ? 30 : longestLabel <= 16 ? 25 : longestLabel <= 20 ? 21 : 17;

  // Ghost rule numeral (NO.010 fill, variant C): fades in smoothly to ~13%
  // (canon v2.5 smooth-reveals — no hard cut) behind/below the pair. Purely
  // decorative — z-indexed UNDER .mid-versus, excluded from the reading floor.
  const ghostOpacity = interpolate(frame, [4, 18], [0, 0.13], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
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
          {scene.ghost ? (
            <div className="vs-ghost" style={{opacity: ghostOpacity}}>
              {scene.ghost}
            </div>
          ) : null}
          {scene.lines?.length ? (
            // Evidence lines (variant B, founder-amended: NO white card) — mono
            // diff lines directly on the field, lower band, centered under the
            // pair (founder mock B; fill-beat ghost + mascot removed 2026-07-08).
            <div className="vs-lines">
              {scene.lines.map((ln, i) => (
                <div
                  key={i}
                  className={`vs-line ${ln.trim().startsWith('+') ? 'vs-line-add' : 'vs-line-del'}`}
                  style={fadeRise(frame, 48 + i * 9, 10)}
                >
                  {ln}
                </div>
              ))}
            </div>
          ) : null}
          <div className="mid mid-versus">
            {/* .vs-row is inline-flex + align-self:center (style.css): the pair
                hugs its content and centers AS A WHOLE, labels under each value —
                a wide+narrow pair ("+180" / "+6") stays on the optical center
                (founder catch 2026-07-08; was flex:1 halves centering
                independently). */}
            <div className="vs-row">
              <div className="vs-col" style={fadeRise(frame, 12, 13)}>
                <div className="vs-value" style={{fontSize: valueSize}}>{scene.leftValue}</div>
                <div className="vs-label" style={{fontSize: labelSize}}>{scene.leftLabel}</div>
              </div>
              <div className="vs-div" style={fadeRise(frame, 26, 10)}>
                vs
              </div>
              <div className="vs-col" style={pop(frame, 34, fps)}>
                <div
                  className="vs-value r"
                  style={{fontSize: valueSize, transform: accentPop(frame, 44)}}
                >
                  {scene.rightValue}
                </div>
                <div className="vs-label" style={{fontSize: labelSize}}>{scene.rightLabel}</div>
              </div>
            </div>
            {scene.caption ? (
              <div className="sub vs-caption" style={fadeRise(frame, 54, 12)}>
                {scene.caption}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
