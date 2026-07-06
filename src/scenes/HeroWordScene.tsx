import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {easeIn, easeOutExpo, easePhysical, interp, STAGGER} from '../motion';
import {Chrome} from './Chrome';
import '../style.css';

// Doctrine S4 "standard→hero" moment (the 'provable.' beat), canon v1.5.0 trial.
// The prelude line rises in (KineticLine grammar), exits up+out, then ONE word
// scales 1→2.0 on the single easePhysical overshoot, recolors to the hero
// treatment, and holds DEAD-STILL (no drift) until the scene ends.
//   {kind:'hero', prelude?: 'your number stays', word: 'private.',
//    eyebrow?, sub?, durationInFrames}
export const HeroWordScene: React.FC<{scene: any; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const preludeWords: string[] = (scene.prelude ?? '').split(' ').filter(Boolean);

  // Prelude: rise in from 8, exit up+out over [40, 62].
  const exitP = interp(frame, [40 + preludeWords.length * STAGGER, 60 + preludeWords.length * STAGGER], [0, 1], easeIn);

  // Hero: fades in during the prelude, then the ONE overshoot scale.
  // FIT-TO-FRAME (2026-07-03 fix): the 2× target was for a single short word
  // ("provable."); a phrase like "not your life." overflows both edges. Size the
  // font so the word fills ~86% of the safe width, and keep the pop gentle
  // (1→1.12) so it never leaves the frame.
  const word = String(scene.word ?? '');
  const fitFont = Math.min(150, Math.round(880 / Math.max(4, word.length) / 0.5));
  const heroStart = 46 + preludeWords.length * STAGGER;
  const heroOp = interp(frame, [16, 34], [0, 1]);
  const heroScale = interp(frame, [heroStart, heroStart + 40], [0.9, 1.12], easePhysical);

  return (
    <AbsoluteFill>
      <div className="frame">
        <div className="drift">
          {hideChrome ? null : <Chrome kicker={scene.kicker} kickerRight={scene.kickerRight} footerRight={scene.footerRight} />}
          <div className="mid" style={{alignItems: 'center', textAlign: 'center', gap: 30}}>
            {scene.eyebrow ? (
              <div className="ed-eyebrow" style={{opacity: interp(frame, [2, 14], [0, 1])}}>
                {scene.eyebrow}
              </div>
            ) : null}
            {preludeWords.length ? (
              // Exit: short rise + FAST fade — the phrase must be fully gone
              // before its ascenders reach the eyebrow line above (frame-sweep
              // finding 2026-07-03: at -140px it passed through the kicker).
              <div
                className="ed-headline"
                style={{
                  transform: `translateY(${-exitP * 70}px)`,
                  opacity: Math.max(0, 1 - exitP * 2.2),
                }}
              >
                {preludeWords.map((w, i) => {
                  const s = 8 + i * STAGGER;
                  const p = interp(frame, [s, s + 16], [0, 1], easeOutExpo);
                  const wght = Math.round(320 + 330 * p);
                  return (
                    <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', marginRight: '0.26em'}}>
                      <span style={{display: 'inline-block', transform: `translateY(${(1 - p) * 112}%)`, opacity: interp(frame, [s, s + 6], [0, 1]), fontVariationSettings: `"wght" ${wght}`, fontWeight: wght}}>
                        {w}
                      </span>
                    </span>
                  );
                })}
              </div>
            ) : null}
            {/* The wrapper reserves the FULL 2×-scaled height, so the transform
                never grows the word over the sub below (transforms don't reflow). */}
            <div style={{height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <div
                style={{
                  fontFamily: 'var(--display)',
                  fontSize: fitFont,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: 'var(--accent)',
                  opacity: heroOp,
                  transform: `scale(${heroScale})`,
                  transformOrigin: '50% 50%',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {scene.word}
              </div>
            </div>
            {scene.sub ? (
              <div className="sub" style={{opacity: interp(frame, [heroStart + 50, heroStart + 66], [0, 1]), textAlign: 'center', maxWidth: 820, marginTop: 26}}>
                {scene.sub}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
