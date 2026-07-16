import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {BlockHookScene as BlockHookSceneType} from '../video-schema';
import {driftScale} from '../animation';
import {easeOutExpo, interp} from '../motion';
import {Chrome} from './Chrome';
import {FIELDS, ACCENTS} from '@tokens/tokens';
import '../style.css';

// KINETIC TYPOGRAPHY hook (block-hook): the headline is broken on '\n' into
// stacked full-bleed COLOR-BLOCKED bands — the "kinetic typography" look. Bands
// cycle ink → orchid → ink…; band text is paper on ink, ink token on orchid
// (NO.009 contrast law: never paper-on-light). A leading ▸▸ (caret-teal) marks
// the LAST band only. Reflow law: animate ONLY transform/opacity — the type
// metrics (size, weight, tracking) are FIXED, so bands never re-lay-out.

// Hook envelope (within the americana content band): x150 y360, w780 h560.
const ENV_W = 780;
const ENV_H = 560;

// Deterministic auto-fit to the envelope (DOM measurement is unreliable in
// Remotion's headless capture — same doctrine as VersusScene/CounterScene).
// Tektur 900 uppercase runs ~0.60em/char advance; each band adds ~0.30em of
// horizontal padding and the stack ~1.14 line-box per band (incl. vertical pad).
const fitSize = (lines: string[]): number => {
  const maxChars = Math.max(1, ...lines.map((l) => l.trim().length));
  const widthFit = ENV_W / (maxChars * 0.6 + 0.3);
  const heightFit = ENV_H / (lines.length * 1.14);
  return Math.floor(Math.min(widthFit, heightFit, 150));
};

export const BlockHook: React.FC<{
  scene: BlockHookSceneType;
  hideChrome?: boolean;
}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const lines = (scene.headline ?? '').split('\n').map((l) => l.replace(/[{}]/g, ''));
  const size = fitSize(lines);

  // FRAME-ZERO CLIFF LAW (canon v1.7.1): `instant: true` composes the full hook
  // at frame 0 — no mask rise (a hook that animates in leaves F0 an empty field,
  // the #1 drop-off cause). A tiny driftScale settle is metric-safe (transform).
  const instant = Boolean(scene.instant);
  const drift = driftScale(frame, scene.durationInFrames);

  return (
    <AbsoluteFill>
      <div className="frame">
        {hideChrome ? null : (
          <Chrome kicker={scene.kicker} kickerRight={scene.kickerRight} footerRight={scene.footerRight} />
        )}
        <div className="bh-stage">
          {scene.eyebrow ? (
            <div className="bh-eyebrow" style={{color: FIELDS.ink.bg}}>
              <span className="bh-eyebrow-rule" style={{background: ACCENTS.caretTeal}} />
              {scene.eyebrow}
            </div>
          ) : null}
          <div
            className="bh-fit"
            style={instant ? {transform: `scale(${drift.toFixed(4)})`, transformOrigin: '0% 50%'} : undefined}
          >
            {lines.map((line, i) => {
              const onOrchid = i % 2 === 1; // ink, orchid, ink, orchid…
              const bg = onOrchid ? FIELDS.orchid.bg : FIELDS.ink.bg;
              const fg = onOrchid ? FIELDS.ink.bg : FIELDS.ink.fg; // ink on orchid · paper on ink
              const isLast = i === lines.length - 1;
              // instant: fully composed at F0. Else: mask-rise, staggered per band.
              const s = 4 + i * 6;
              const p = instant ? 1 : interp(frame, [s, s + 16], [0, 1], easeOutExpo);
              const op = instant ? 1 : interp(frame, [s, s + 7], [0, 1]);
              return (
                <span key={i} className="bh-mask">
                  <span
                    className="bh-band"
                    style={{
                      background: bg,
                      color: fg,
                      fontSize: size,
                      transform: `translateY(${((1 - p) * 108).toFixed(2)}%)`,
                      opacity: op,
                    }}
                  >
                    {isLast ? (
                      <span className="bh-chev" style={{color: ACCENTS.caretTeal}}>
                        ▸▸
                      </span>
                    ) : null}
                    {line}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
