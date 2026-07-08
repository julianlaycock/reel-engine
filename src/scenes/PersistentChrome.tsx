import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ChromeConfig} from '../video-schema';
import {drawX} from '../animation';
import {hexLerp} from '../palettes';
import '../style.css';

// Color-morph support: the chrome sits OUTSIDE the per-scene dark-vars wrapper,
// so during a dark palette beat it lerps its own ink colors — otherwise the
// light-mode navy wordmark disappears against the dark canvas.
export type ChromeDarkMorph = {
  ranges: Array<[number, number]>;
  light: {fg: string; muted: string; hairline: string};
  dark: {fg: string; muted: string; hairline: string};
};

// Americana chrome data: which beat is under the playhead (drives the Workbench
// section marker + the "NN / 06" footer progress). Wireframe contract v2
// (founder 2026-07-08) adds the per-beat RECEIPTS caption (rendered at the
// caption band y1300 — same pixel position on every kind), the dark flag
// (signal/ink beats recolor the caption/furniture) and the print-furniture
// gate (P1 folio hairline + P2 registration ticks on middle slides).
export type ChromeBeat = {
  from: number;
  to: number;
  marker?: string;
  no?: string;
  caption?: string; // receipts line (P3 dateline grammar) — caption band y1300..1340
  dark?: boolean; // signal/ink beat → blueMeta caption, acid ticks, paper hairline
  furniture?: boolean; // middle slide → P2 registration ticks at the content-band corners
};

// Rendered ONCE at the video level (outside the scene Series), so the bars fade
// in a single time at the start and hold for the whole video — no per-cut flicker.
export const PersistentChrome: React.FC<{
  chrome: ChromeConfig;
  hideRanges?: Array<[number, number]>;
  darkMorph?: ChromeDarkMorph;
  skin?: string;
  beats?: ChromeBeat[];
}> = ({
  chrome,
  hideRanges = [],
  darkMorph,
  skin,
  beats,
}) => {
  const frame = useCurrentFrame();
  let dm = 0;
  if (darkMorph) {
    for (const [s, e] of darkMorph.ranges) {
      const up = interpolate(frame, [s - 14, s + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1)});
      const down = interpolate(frame, [e - 10, e + 14], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.65, 0, 0.35, 1)});
      dm = Math.max(dm, Math.min(up, down));
    }
  }
  // hexLerp needs #rrggbb on both ends — brands sometimes use rgba() hairlines;
  // fall back to a hard switch at the midpoint for non-hex values.
  const lerpSafe = (a: string, b: string, t: number) =>
    /^#[0-9a-f]{6}$/i.test(a) && /^#[0-9a-f]{6}$/i.test(b) ? hexLerp(a, b, t) : t > 0.5 ? b : a;
  const morphVars: React.CSSProperties =
    darkMorph && dm > 0
      ? ({
          '--fg': lerpSafe(darkMorph.light.fg, darkMorph.dark.fg, dm),
          '--muted': lerpSafe(darkMorph.light.muted, darkMorph.dark.muted, dm),
          '--hairline': lerpSafe(darkMorph.light.hairline, darkMorph.dark.hairline, dm),
        } as React.CSSProperties)
      : {};
  const {durationInFrames} = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames - 2],
    [1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  // Fade chrome out over footage (B-roll) scenes — clean clip, no wordmark/rules.
  let hide = 1;
  for (const [a, b] of hideRanges) {
    if (frame >= a - 1 && frame <= b + 1) {
      const enter = interpolate(frame, [a, a + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      // A hide range that runs to the end of the video never restores — otherwise
      // the bars ghost back in over a dark end-card during the global fade-out.
      const leave = b >= durationInFrames - 2 ? 0 : interpolate(frame, [b - 8, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      hide = Math.min(hide, Math.max(enter, leave));
    }
  }
  const opacity = Math.min(fadeIn, fadeOut) * hide;
  const ruleScale = drawX(frame, 0, 16);
  // Hard on/off cursor blink (~1.1s cycle at 30fps), frame-driven so Remotion
  // actually captures it (CSS keyframe animations don't advance per frame).
  const blink = frame % 34 < 18 ? 1 : 0;

  // Americana Cut chrome (opt-in skin, locked 2026-07-04): a 100px ink bar —
  // wordmark left (Inter Tight 600 lowercase, NO caret: the mark stands alone),
  // Workbench section marker right — and a mono footer 56px from the bottom:
  // "vektor /// no. NNN" left, "NN / 06" progress right. Constant ink, no
  // dark-morph lerp; broll + end card hide the whole set via hideRanges.
  // FOOTER = EVERY SLIDE (founder law 2026-07-08, wireframe contract v2 —
  // REVERSES the 2026-07-07 intro-only rule): the mono footer is the premium
  // anchor line on every slide, bottom edge hugging the y1420 platform safe
  // line (style.css .am-footer bottom:500). It hides only with the rest of the
  // chrome (hideRanges: broll + end card — the end card's issue line is its
  // footer analogue).
  if (skin === 'americana') {
    const beat = beats?.find((b) => frame >= b.from && frame < b.to);
    // FRAME-ZERO LAW + loop-seam law: the ink bar is part of the finished F0
    // thumbnail AND of a loop cut's hand-back frame — no fade-in, no end-of-video
    // fade. hideRanges (broll + end card) hides it; nothing else does.
    const amOpacity = hide;
    const dark = Boolean(beat?.dark);
    return (
      <AbsoluteFill>
        <div className="frame" style={{background: 'transparent'}}>
          <div className="am-chrome" style={{opacity: amOpacity}}>
            <span className="am-chrome-wordmark">{chrome.topLeft ?? 'vektor'}</span>
            <span className="am-chrome-marker">{beat?.marker ?? chrome.topRight ?? ''}</span>
          </div>
          {/* P2 REGISTRATION TICKS (wireframes v2 furniture, founder-approved
              2026-07-08): 12px press marks at the four content-band corners
              (150/360 · 930/360 · 150/1260 · 930/1260). Deterministic, static,
              quiet — proof-sheet furniture, middle slides only. */}
          {beat?.furniture ? (
            <div className={`am-regmarks${dark ? ' am-dark' : ''}`} style={{opacity: amOpacity}}>
              <span className="am-tick am-tick-tl" />
              <span className="am-tick am-tick-tr" />
              <span className="am-tick am-tick-bl" />
              <span className="am-tick am-tick-br" />
            </div>
          ) : null}
          {/* THE RECEIPTS LINE (wireframes v2 caption band, REQUIRED on middle
              slides): P3 dateline grammar — four-tick Workbench prefix + mono 22,
              same pixel position (y1300) on every kind. */}
          {beat?.caption ? (
            <div className={`am-capline${dark ? ' am-dark' : ''}`} style={{opacity: amOpacity}}>
              <span className="am-capline-ticks">{'////'}</span>
              <span>{beat.caption}</span>
            </div>
          ) : null}
          {/* P1 FOLIO HAIRLINE lives on .am-footer::before (style.css) — the
              footer reads as a newspaper folio line under a rule. */}
          <div className={`am-footer${dark ? ' am-dark' : ''}`} style={{opacity: amOpacity}}>
            <span>{chrome.footerLeft ?? ''}</span>
            <span>{beat?.no ?? chrome.footerRight ?? ''}</span>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={morphVars}>
      <div className="frame" style={{background: 'transparent'}}>
        <div className="topbar" style={{opacity}}>
          <div className="top-rule" style={{transform: `scaleX(${ruleScale})`}} />
          {chrome.mark === 'caret' ? (
            // Vektor BRAND.md lockup: lowercase wordmark + the thin TEAL caret —
            // the caret is always teal (never palette-recolored), blinking.
            <span className="wordmark">
              {chrome.topLeft ?? ''}
              <span className="caretmark" style={{opacity: blink}} />
            </span>
          ) : chrome.mark === 'cursor' ? (
            <span className="wordmark">
              {chrome.topLeft ?? ''}
              <span className="cursormark" style={{opacity: blink}} />
            </span>
          ) : (
            <span className="meta">
              <span className="redmark" />
              {chrome.topLeft ?? ''}
            </span>
          )}
          <span className="meta">{chrome.topRight ?? ''}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
