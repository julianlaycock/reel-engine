import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {LetterpressScene as LetterpressSceneType, LpCol, LpRow} from '../video-schema';
import {FIELDS, type FieldTokens} from '@tokens/tokens';
import {
  caretBlink,
  effFrame,
  growSteps,
  hatchDrift,
  invertPulse,
  odometerTicks,
  stampHit,
  stampIn,
  tickerX,
  typeOn,
  xeroxJitter,
} from './lp-motion';
import {LpCanvasBeat} from './LpCanvasBeat';
import '../style.css';

// ─────────────────────────────────────────────────────────────────────────────
// LetterpressScene — Vektor canon 2.0 (founder-designed 2026-07-29). ONE scene
// kind dispatched on `lpBeat` to the 8 beat templates of the master reel
// grammar. Spec: vektor/docs/letterpress-build-spec.md (layout numbers) +
// canon/letterpress-tokens.json (values). Laws in force here:
//   · TWO COLOURS — every color comes from FIELDS.lpInk / FIELDS.lpCream
//     (@tokens) mapped onto --lp-field-* custom properties; the CSS consumes
//     ONLY var(--lp-*) (check-drift zero-tolerance).
//   · HARD STEPS — all motion is frame math from lp-motion.ts; frame 0 is the
//     finished stack, reveals re-stamp at ~88% of the scene (effFrame).
//   · Furniture (chrome bar / ledger strip / footer slug) renders INSIDE this
//     component on every beat except the end card (which keeps the slug) —
//     PersistentChrome has no letterpress path and is not modified.
// ─────────────────────────────────────────────────────────────────────────────

// Negative-print field alternation (spec: hook=cream, claim=ink, …). A scene's
// explicit `field` ('lpInk' | 'lpCream') overrides the beat default.
const BEAT_FIELD: Record<string, 'lpInk' | 'lpCream'> = {
  hook: 'lpCream',
  claim: 'lpInk',
  method: 'lpCream',
  divergence: 'lpInk',
  number: 'lpCream',
  breakdown: 'lpInk',
  verdict: 'lpCream',
  endCard: 'lpInk',
  canvas: 'lpCream', // the evolving canvas is a press sheet — ink on cream
};

const LP_FIELDS: Record<string, FieldTokens> = {lpInk: FIELDS.lpInk, lpCream: FIELDS.lpCream};

const pad2 = (n: number): string => String(n).padStart(2, '0');

// ── furniture (every beat except endCard; footer slug on every beat) ─────────

const LpFurniture: React.FC<{scene: LetterpressSceneType; cream: boolean}> = ({scene, cream}) => {
  const isEnd = scene.lpBeat === 'endCard';
  const count = scene.sceneCount ?? 8;
  const no = scene.sceneNo ?? 1;
  const slugRight = scene.beatNo ?? `${pad2(no)} / ${pad2(count)}`;
  const slugLeft = (isEnd ? scene.endCard?.issue : undefined) ?? scene.slug ?? 'vektor';
  return (
    <>
      {isEnd ? null : (
        <>
          <div className={`lp-chrome${cream ? ' lp-chrome--solid' : ''}`}>
            <span className="lp-wordmark">vektor</span>
            <span className="lp-marker">{scene.marker ?? ''}</span>
          </div>
          {/* LEDGER STRIP — the watch-time device: one segment per scene,
              filled = scenes elapsed (current index+1). */}
          <div className="lp-strip">
            {Array.from({length: count}, (_, i) => (
              <span key={i} className={`lp-seg${i < no ? ' on' : ''}`} />
            ))}
          </div>
        </>
      )}
      <div className="lp-slug">
        <span>{slugLeft}</span>
        <span>{slugRight}</span>
      </div>
    </>
  );
};

// Mascot slot placeholder — a hatched box until the halftone treatment lands
// (letterpress-tokens.json #surfaces.halftone: the ONLY way an image enters).
const LpMascotSlot: React.FC<{variant: 'avatar' | 'bleed' | 'stamp' | 'rail'}> = ({variant}) => (
  <div className={`lp-mascot-slot lp-mascot--${variant}`} />
);

// ── beat renderers ───────────────────────────────────────────────────────────

// 1. hook (cream) — "The Hook Stack"
const HookBeat: React.FC<{scene: LetterpressSceneType; frame: number; eff: number}> = ({scene, frame, eff}) => {
  const lines = scene.lines ?? [];
  const chipAt = lines.length * 4 + 4;
  const hit = stampHit(eff, chipAt);
  const j = scene.jitter ? xeroxJitter(frame) : {x: 0, y: 0};
  return (
    <div className="lp-body lp-hook" style={{transform: `translate(${j.x}px, ${j.y}px)`}}>
      {scene.kicker ? <div className="lp-kicker">{scene.kicker}</div> : null}
      <div className="lp-display lp-hook-stack">
        {lines.map((line, i) => (
          <div key={i} style={{opacity: stampIn(eff, i)}}>
            {line}
          </div>
        ))}
      </div>
      <div className="lp-hatch-rule" style={{backgroundPosition: hatchDrift(frame)}} />
      {scene.chip ? (
        <span className="lp-chip" style={{opacity: hit.opacity, transform: `scale(${hit.scale})`}}>
          {scene.chip}
        </span>
      ) : null}
    </div>
  );
};

// 2. claim (ink) — "The Exhibit Panel"
const ClaimBeat: React.FC<{scene: LetterpressSceneType; frame: number; eff: number}> = ({scene, frame, eff}) => {
  const rows = scene.rows ?? [];
  const footAt = rows.length * 4 + 10;
  const hit = stampHit(eff, footAt);
  return (
    <div className="lp-body lp-claim">
      {scene.headline ? <div className="lp-display lp-claim-headline">{scene.headline}</div> : null}
      <div className="lp-panel">
        <div className="lp-panel-head">
          {scene.mascot !== false ? <LpMascotSlot variant="avatar" /> : null}
          <span className="lp-panel-title">{scene.panelTitle}</span>
          <span className="lp-panel-meta">{scene.panelMeta}</span>
        </div>
        {rows.map((row: LpRow, i) => (
          <div key={i} className="lp-panel-row" style={{opacity: stampIn(eff, i)}}>
            <span className={row.struck ? 'lp-struck' : undefined}>{row.text}</span>
            <span className="lp-panel-diff">{row.diff}</span>
          </div>
        ))}
        {scene.terminalLine ? (
          <div className="lp-terminal">
            {typeOn(eff, scene.terminalLine)}
            <span className="lp-caret" style={{opacity: caretBlink(frame)}} />
          </div>
        ) : null}
        <div className="lp-panel-foot" style={{opacity: hit.opacity, transform: `scale(${hit.scale})`}}>
          <span>{scene.footerLeft}</span>
          <span>{scene.footerRight}</span>
        </div>
      </div>
    </div>
  );
};

// 3. method (cream) — "The Ledger Rows" (the breather — static once landed)
const MethodBeat: React.FC<{scene: LetterpressSceneType; eff: number}> = ({scene, eff}) => (
  <div className="lp-body lp-method">
    {scene.kicker ? <div className="lp-kicker lp-kicker--wide">{scene.kicker}</div> : null}
    {scene.headline ? <div className="lp-display lp-method-headline">{scene.headline}</div> : null}
    <div className="lp-ledger">
      {(scene.rows ?? []).map((row: LpRow, i) => (
        <div key={i} className="lp-ledger-row" style={{opacity: stampIn(eff, i)}}>
          <span className="lp-ledger-label">{row.label}</span>
          <span className="lp-ledger-value">{row.value}</span>
        </div>
      ))}
    </div>
    {scene.note ? <div className="lp-note">{scene.note}</div> : null}
  </div>
);

// 4. divergence (ink) — "The Divergence" (the money graph)
const DivergenceBeat: React.FC<{scene: LetterpressSceneType; eff: number}> = ({scene, eff}) => {
  const cols = scene.cols ?? [];
  return (
    <div className="lp-body lp-divergence">
      {scene.kicker ? <div className="lp-kicker">{scene.kicker}</div> : null}
      <div className="lp-div-chart">
        <div className="lp-div-axis" />
        <span className="lp-div-zero">0%</span>
        {cols.map((col: LpCol, i) => {
          const g = growSteps(eff, i * 4, 6);
          const h = Math.round(col.h * g);
          return (
            <div key={i} className="lp-div-col">
              {col.hatched ? (
                <>
                  <div className="lp-div-bar lp-div-bar--down lp-hatched" style={{height: h}} />
                  <span className="lp-div-value" style={{top: `calc(50% + ${col.h + 24}px)`}}>
                    {col.value}
                  </span>
                </>
              ) : (
                <>
                  <div className="lp-div-bar lp-div-bar--up" style={{height: h}} />
                  <span className="lp-div-value" style={{bottom: `calc(50% + ${col.h + 24}px)`}}>
                    {col.value}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="lp-div-labels">
        {cols.map((col, i) => (
          <span key={i}>{col.label}</span>
        ))}
      </div>
      {scene.source ? <div className="lp-source">{scene.source}</div> : null}
    </div>
  );
};

// 5. number (cream) — "The Odometer"
const ODO_ROW = 250; // clipped window height = one digit-row height (the tick unit)
const NumberBeat: React.FC<{scene: LetterpressSceneType; eff: number}> = ({scene, eff}) => {
  const values = scene.odometer?.values ?? [];
  const idx = Math.min(Math.max(values.length - 1, 0), odometerTicks(eff));
  return (
    <div className="lp-body lp-number">
      {scene.kicker ? <div className="lp-kicker">{scene.kicker}</div> : null}
      {values.length ? (
        <div className="lp-odo-line">
          <div className="lp-odo">
            <div style={{transform: `translateY(${-idx * ODO_ROW}px)`}}>
              {values.map((v, i) => (
                <div key={i} className="lp-odo-row">
                  {v.split('').map((ch, ci) => (
                    <span key={ci} className="lp-odo-box">
                      {ch}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {scene.odometer?.suffix ? <span className="lp-odo-suffix">{scene.odometer.suffix}</span> : null}
        </div>
      ) : null}
      {scene.subline ? <div className="lp-subline">{scene.subline}</div> : null}
      <div className="lp-rule-3" />
      {scene.headline ? <div className="lp-display lp-number-headline">{scene.headline}</div> : null}
      {scene.mascot ? <LpMascotSlot variant="bleed" /> : null}
    </div>
  );
};

// 6. breakdown (ink) — "The Waterfall"
const BreakdownBeat: React.FC<{scene: LetterpressSceneType; eff: number}> = ({scene, eff}) => (
  <div className="lp-body lp-breakdown">
    {scene.kicker ? <div className="lp-kicker">{scene.kicker}</div> : null}
    <div className="lp-wf">
      {(scene.rows ?? []).map((row: LpRow, i) => {
        const g = growSteps(eff, i * 2, 6); // rows staggered 2f
        return (
          <div key={i} className="lp-wf-row">
            <div className="lp-wf-meta">
              <span className="lp-wf-label">{row.label}</span>
              <span className="lp-wf-value">{row.value}</span>
            </div>
            <div className="lp-wf-track">
              <div
                className={`lp-wf-fill${row.hatched ? ' lp-hatched' : ''}`}
                style={{width: `${((row.pct ?? 0) * g).toFixed(1)}%`}}
              />
            </div>
          </div>
        );
      })}
    </div>
    {scene.headline ? <div className="lp-display lp-breakdown-headline">{scene.headline}</div> : null}
  </div>
);

// 7. verdict (cream) — "The Rules"
const VerdictBeat: React.FC<{scene: LetterpressSceneType; eff: number}> = ({scene, eff}) => {
  const rules = scene.rules ?? [];
  const hit = stampHit(eff, rules.length * 4 + 6);
  return (
    <div className="lp-body lp-verdict">
      {scene.kicker ? <div className="lp-kicker lp-kicker--wide">{scene.kicker}</div> : null}
      {scene.headline ? <div className="lp-display lp-verdict-headline">{scene.headline}</div> : null}
      <div className="lp-rules">
        {rules.map((rule, i) => (
          <div key={i} className="lp-rule-row" style={{opacity: stampIn(eff, i)}}>
            {rule}
          </div>
        ))}
      </div>
      <div className="lp-verdict-row">
        {scene.chip ? (
          <span
            className="lp-chip lp-chip--verdict"
            style={{opacity: hit.opacity, transform: `scale(${hit.scale})`}}
          >
            {scene.chip}
          </span>
        ) : null}
        {scene.mascot ? <LpMascotSlot variant="stamp" /> : null}
      </div>
    </div>
  );
};

// End-card wordmark motions — play once at scene entry (the sting), hard steps,
// then hold in the identical static wordmark.
const LpWordmark: React.FC<{text: string; motion?: string; frame: number}> = ({text, motion, frame}) => {
  const letters = text.split('');
  if (motion === 'decode') {
    // Per-letter scramble resolving left→right; unresolved letters cycle a
    // deterministic glyph pool every 2 frames (hard steps, ~1.1s total).
    const POOL = '#/%&$§0123456789X';
    return (
      <div className="lp-end-wordmark">
        {letters.map((ch, i) => {
          const done = frame >= 8 + i * 4;
          const glyph = done ? ch : POOL[(Math.floor(frame / 2) * 7 + i * 13) % POOL.length];
          return <span key={i}>{glyph}</span>;
        })}
      </div>
    );
  }
  if (motion === 'registration') {
    // Misregistered ghost copy snapping into register in 4 hard steps.
    const OFFSETS: Array<[number, number]> = [
      [6, -4],
      [3, -2],
      [1, -1],
      [0, 0],
    ];
    const [ox, oy] = OFFSETS[Math.min(3, Math.floor(frame / 4))];
    return (
      <div className="lp-end-wordmark" style={{position: 'relative'}}>
        <span
          style={{position: 'absolute', left: ox, top: oy, opacity: 0.5}}
          aria-hidden
        >
          {text}
        </span>
        <span style={{position: 'relative'}}>{text}</span>
      </div>
    );
  }
  if (motion === 'fade') {
    // Stepped per-letter opacity (hard 1/3-steps, staggered 3f) — no easing.
    return (
      <div className="lp-end-wordmark">
        {letters.map((ch, i) => {
          const t = frame - i * 3;
          const op = t < 0 ? 0 : t >= 9 ? 1 : (Math.floor(t / 3) + 1) / 3;
          return (
            <span key={i} style={{opacity: op}}>
              {ch}
            </span>
          );
        })}
      </div>
    );
  }
  return <div className="lp-end-wordmark">{text}</div>;
};

// 8. endCard (ink) — no chrome bar, no ledger strip; footer slug stays
const EndCardBeat: React.FC<{scene: LetterpressSceneType; frame: number}> = ({scene, frame}) => {
  const end = scene.endCard ?? {};
  const hit = stampHit(frame, 10);
  return (
    <div className="lp-end">
      <LpWordmark text={end.wordmark ?? 'vektor'} motion={end.wordmarkMotion} frame={frame} />
      {scene.headline ? <div className="lp-display lp-end-headline">{scene.headline}</div> : null}
      {end.stat ? (
        <div className="lp-end-stat">
          <span className="lp-end-stat-value">{end.stat.value}</span>
          <span className="lp-end-stat-label">{end.stat.label}</span>
        </div>
      ) : null}
      {end.cta ? (
        <span className="lp-chip lp-end-cta" style={{opacity: hit.opacity, transform: `scale(${hit.scale})`}}>
          {end.cta}
        </span>
      ) : null}
      {scene.mascot ? <LpMascotSlot variant="rail" /> : null}
      {end.ticker ? (
        <div className="lp-ticker">
          <div className="lp-ticker-inner" style={{transform: `translateX(${tickerX(frame)})`}}>
            <span className="lp-ticker-run">{end.ticker}</span>
            <span className="lp-ticker-run">{end.ticker}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ── the scene ────────────────────────────────────────────────────────────────

export const LetterpressScene: React.FC<{
  scene: LetterpressSceneType;
  hideChrome: boolean;
}> = ({scene, hideChrome: _hideChrome}) => {
  // NOTE: the letterpress furniture is scene-internal by spec (it needs the
  // scene's index + count for the ledger strip); `hideChrome` is accepted for
  // interface parity with the other scenes but does not suppress it —
  // PersistentChrome cannot draw this skin's furniture.
  const frame = useCurrentFrame();
  const dur = scene.durationInFrames;
  // Effective reveal-frame: settled (finished stack) from frame 0, re-stamping
  // at ~88% of the scene (lp-motion.ts). The end card plays its sting on the
  // real frame instead — it is the closing beat, nothing cuts away from it.
  const eff = scene.lpBeat === 'endCard' ? frame : effFrame(frame, dur);
  const fieldName = scene.field && LP_FIELDS[scene.field] ? scene.field : BEAT_FIELD[scene.lpBeat] ?? 'lpInk';
  const f = LP_FIELDS[fieldName];
  const cream = fieldName === 'lpCream';
  const fieldVars = {
    '--lp-field': f.bg,
    '--lp-field-fg': f.fg,
    '--lp-field-muted': f.muted,
    '--lp-field-hairline': f.hairline,
  } as React.CSSProperties;
  const invert = invertPulse(frame, scene.invertAt);

  return (
    <AbsoluteFill>
      <div
        className={`frame lp-frame ${cream ? 'lp-on-cream' : 'lp-on-ink'}`}
        style={{
          ...fieldVars,
          background: f.bg,
          color: f.fg,
          ...(invert ? {filter: 'invert(1)'} : {}),
        }}
      >
        {scene.lpBeat === 'hook' ? <HookBeat scene={scene} frame={frame} eff={eff} /> : null}
        {scene.lpBeat === 'claim' ? <ClaimBeat scene={scene} frame={frame} eff={eff} /> : null}
        {scene.lpBeat === 'method' ? <MethodBeat scene={scene} eff={eff} /> : null}
        {scene.lpBeat === 'divergence' ? <DivergenceBeat scene={scene} eff={eff} /> : null}
        {scene.lpBeat === 'number' ? <NumberBeat scene={scene} eff={eff} /> : null}
        {scene.lpBeat === 'breakdown' ? <BreakdownBeat scene={scene} eff={eff} /> : null}
        {scene.lpBeat === 'verdict' ? <VerdictBeat scene={scene} eff={eff} /> : null}
        {scene.lpBeat === 'endCard' ? <EndCardBeat scene={scene} frame={frame} /> : null}
        {scene.lpBeat === 'canvas' ? <LpCanvasBeat scene={scene} frame={frame} /> : null}
        <LpFurniture scene={scene} cream={cream} />
      </div>
    </AbsoluteFill>
  );
};
