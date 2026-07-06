import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeOutExpo, easePhysical, interp} from '../motion';
import {Chrome} from './Chrome';
import '../style.css';

// Editorial poster-grid scene (canon v1.5.0 trial — the "Compliance Off The
// Record" reference grammar): huge uppercase display type top-left rising in
// KineticLine style, mono meta cells bottom-left, ONE giant focal figure
// bottom-right landing on the easePhysical overshoot, an accent asterisk mark.
// Layout respects the safe band (content inside the 200px chrome/footer bands).
//   {kind:'poster', display: 'NO SEARCH.\nNO DIRECTORY.', cells:[{label,value}],
//    figure: '3–35', figureLabel?: 'characters', eyebrow?, durationInFrames}
export const PosterScene: React.FC<{scene: any; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const lines: string[] = String(scene.display ?? '').split('\n');
  const figStart = 18;
  const figP = interp(frame, [figStart, figStart + 20], [0, 1], easePhysical);
  let wordIdx = 0;

  return (
    <AbsoluteFill>
      <div className="frame">
        <div className="drift">
          {hideChrome ? null : <Chrome kicker={scene.kicker} kickerRight={scene.kickerRight} footerRight={scene.footerRight} />}
          {/* asterisk mark — top-right under the chrome band */}
          <div style={{position: 'absolute', top: 230, right: 110, fontSize: 54, color: 'var(--accent)', opacity: interp(frame, [4, 18], [0, 1])}}>✳</div>

          {/* display block — top-left, uppercase, masked-rise per word */}
          <div style={{position: 'absolute', top: 300, left: 110, right: 110}}>
            {scene.eyebrow ? (
              <div className="ed-eyebrow" style={{marginBottom: 26, opacity: interp(frame, [0, 12], [0, 1])}}>
                {scene.eyebrow}
              </div>
            ) : null}
            <div style={{fontFamily: 'var(--display)', fontSize: 118, fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.03em', textTransform: 'uppercase', color: 'var(--fg)'}}>
              {lines.map((line, li) => (
                <div key={li}>
                  {line.split(' ').map((w, wi) => {
                    // Masked rise only — weight is FIXED at 700. Animating wght
                    // reflows neighboring word widths every frame (visible jitter
                    // on big display type); the doctrine look survives on the
                    // rise + the tracking settle alone. Tightened 2026-07-04
                    // (founder QA: slow per-word dribble read as a glitch).
                    const s = 3 + wordIdx++ * 2;
                    const p = interp(frame, [s, s + 12], [0, 1], easeOutExpo);
                    return (
                      <span key={wi} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', marginRight: '0.24em', paddingBottom: '0.06em'}}>
                        <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 112}%)`, opacity: interp(frame, [s, s + 6], [0, 1]), letterSpacing: `${(0.06 * (1 - p)).toFixed(3)}em`, fontWeight: 700}}>
                          {w}
                        </span>
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* meta cells — bottom-left, mono grid grammar (inside the safe band).
              Width caps hard so long figures (e.g. text like "LLM01") never collide. */}
          <div style={{position: 'absolute', left: 110, bottom: 340, width: 470, display: 'flex', flexDirection: 'column', gap: 34}}>
            {(scene.cells ?? []).map((c: {label: string; value: string}, i: number) => (
              <div key={i} style={{opacity: interp(frame, [18 + i * 7, 30 + i * 7], [0, 1])}}>
                <div style={{fontFamily: 'var(--mono)', fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8}}>
                  {c.label}
                </div>
                <div style={{fontFamily: 'var(--display)', fontSize: 32, fontWeight: 600, color: 'var(--fg)', maxWidth: 460, lineHeight: 1.2}}>
                  {c.value}
                </div>
              </div>
            ))}
          </div>

          {/* focal figure — bottom-right, the one big number. Font shrinks with
              length so multi-char figures (e.g. "LLM01") never reach the cells. */}
          {scene.figure ? (
            <div style={{position: 'absolute', right: 110, bottom: 340, maxWidth: 470, textAlign: 'right', transform: `scale(${0.7 + figP * 0.3})`, transformOrigin: '100% 100%', opacity: figP}}>
              <div style={{fontFamily: 'var(--display)', fontSize: String(scene.figure).replace(/[^0-9a-z]/gi, '').length <= 3 ? 190 : 120, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 0.95, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums'}}>
                {scene.figure}
              </div>
              {scene.figureLabel ? (
                <div style={{fontFamily: 'var(--mono)', fontSize: 24, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 10}}>
                  {scene.figureLabel}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
