import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {fadeRise} from '../animation';
import {interp, easePhysical} from '../motion';
import {Chrome} from './Chrome';
import {ACCENTS, FIELDS} from '@tokens/tokens';
import '../style.css';

// TERMINAL SCENE (proposed 2026-07-13) — an ANIMATED "live Claude Code session":
// the prompt types in char-by-char, a `⏺` plan header lands, the 3 file rows
// reveal staggered, then a `proceed? [y/N]` line blinks a green caret. ONE scene,
// three DISTINCT looks via `termStyle`:
//   'live'      — full-bleed near-black CLI, JetBrains Mono, acid caret (dark field).
//   'editorial' — premium white paper card + offset ink-shadow (light field).
//   'kinetic'   — ✗ NO PLAN → ✓ THE PLAN resolve, rows sweep + a scan bar.
// Pure function of useCurrentFrame() — no state/timers (headless determinism).

type Row = {n?: string; path: string; note?: string};
type TLine = {type: string; text: string};

// ── GENERIC TYPED-LINE MODEL (2026-07-13) — a `lines:[{type,text}]` array renders
// a live dark CLI session of ANY shape (plan / grep / diff), not just the plan form.
// Types: prompt · thinking · header · row · result · add · del · context · confirm.
// Pure function of frame: prompt/confirm TYPE char-by-char, the rest fadeRise
// staggered. LEGIBILITY (founder review): dim/annotation greys nudged one step
// brighter so they read at phone size. Back-compat: no `lines` ⇒ the plan path.

// grep hit "path:line: code" — dim the `path:line:` locator, brighten the match.
const splitResult = (text: string): [string, string] => {
  const m = text.match(/^(\S*?:\d+:)(.*)$/);
  return m ? [m[1], m[2]] : ['', text];
};
// numbered plan row "1  src/x.py  · note" — pull the leading index to tint it.
const splitRow = (text: string): [string, string] => {
  const m = text.match(/^(\d+)(\s+.*)$/);
  return m ? [m[1], m[2]] : ['', text];
};

const LiveLines: React.FC<{frame: number; blink: number; lines: TLine[]; title: string; total: number}> = ({
  frame,
  blink,
  lines,
  title,
  total,
}) => {
  // DURATION-ANCHORED reveal schedule (2026-07-13, v4 judge fix). The terminals now
  // breathe ~9–10s each, so the schedule is a PURE FUNCTION of the scene's own
  // durationInFrames — never a fixed absolute clock. The point of the beat is the
  // DECISION GATE, so we spend the scene's time on the payoff, not on typing:
  //   • the `prompt` command types in FAST — fully typed by ~15% of the scene.
  //   • middle lines (thinking/row/result/header/add/del/context) reveal staggered
  //     across the MIDDLE, ALL fully landed by ~66% (never cut mid-reveal).
  //   • the `confirm` gate ("proceed?/apply?") lands by ~72% and HOLDS with the
  //     blinking acid caret through the end — the "watch it decide" hold (~1s+).
  const T = Math.max(90, total || 300);
  const promptStart = Math.round(T * 0.02);
  const promptEnd = Math.round(T * 0.15); // command fully typed by here
  const midStart = Math.round(T * 0.2);
  const midEnd = Math.round(T * 0.66); // last middle line fully revealed by here
  const confirmAt = Math.round(T * 0.72); // gate lands here, then holds to the end

  const promptIdx = lines.findIndex((l) => l.type === 'prompt');
  const confirmIdx = lines.findIndex((l) => l.type === 'confirm');
  const midIdxs = lines
    .map((_, i) => i)
    .filter((i) => i !== promptIdx && i !== confirmIdx);
  const n = midIdxs.length;
  const revealDur = 6;
  const span = Math.max(1, midEnd - midStart - revealDur);
  const step = n > 1 ? span / (n - 1) : 0;

  const timed = lines.map((ln, i) => {
    if (i === promptIdx) {
      const len = Math.max(1, ln.text.length);
      // fast, but capped so a short command still reads as "typed"
      const per = Math.min(0.9, (promptEnd - promptStart) / len);
      return {ln, start: promptStart, per, mode: 'type' as const};
    }
    if (i === confirmIdx) {
      const len = Math.max(1, ln.text.length);
      const per = Math.min(0.55, Math.max(0.2, (T * 0.06) / len));
      return {ln, start: confirmAt, per, mode: 'type' as const};
    }
    const k = midIdxs.indexOf(i);
    return {ln, start: Math.round(midStart + k * step), per: 0, mode: 'reveal' as const};
  });

  return (
    <div className="term-stage term-stage-live">
      <div className="term-live">
        <div className="term-live-top">{title}</div>
        {timed.map(({ln, start, per, mode}, i) => {
          if (frame < start) return null;
          const op =
            mode === 'reveal'
              ? interpolate(frame, [start, start + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
              : 1;
          const tx =
            mode === 'reveal'
              ? interpolate(frame, [start, start + 6], [-10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
              : 0;
          const wrap = (child: React.ReactNode, cls: string) => (
            <div key={i} className={cls} style={{opacity: op, transform: `translateX(${tx}px)`}}>
              {child}
            </div>
          );

          if (ln.type === 'prompt') {
            const p = typed(frame, start, per, ln.text);
            return (
              <div key={i} className="term-line term-l-prompt">
                <span className="term-usr-caret">&gt;</span>
                <span className="term-usr">{p.text}</span>
                {!p.done ? <span className="term-caret term-caret-acid" style={{opacity: blink}} /> : null}
              </div>
            );
          }
          if (ln.type === 'confirm') {
            const c = typed(frame, start, per, ln.text);
            return (
              <div key={i} className="term-line term-l-confirm">
                <span>{c.text}</span>
                <span className="term-caret term-caret-acid term-caret-block" style={{opacity: blink}} />
              </div>
            );
          }
          if (ln.type === 'thinking') {
            return wrap(
              <>
                <span className="term-l-think-dot">⏺</span>
                <span className="term-l-think-tx">{ln.text}</span>
              </>,
              'term-line term-l-thinking',
            );
          }
          if (ln.type === 'header') {
            return wrap(<span>{ln.text}</span>, 'term-line term-l-header');
          }
          if (ln.type === 'row') {
            const [rn, rest] = splitRow(ln.text);
            return wrap(
              <>
                {rn ? <span className="term-l-row-n">{rn}</span> : null}
                <span className="term-l-row-tx">{rest}</span>
              </>,
              'term-line term-l-row',
            );
          }
          if (ln.type === 'result') {
            const [loc, code] = splitResult(ln.text);
            return wrap(
              <>
                {loc ? <span className="term-l-res-loc">{loc}</span> : null}
                <span className="term-l-res-code">{code}</span>
              </>,
              'term-line term-l-result',
            );
          }
          if (ln.type === 'add') {
            return wrap(<span>{ln.text}</span>, 'term-line term-l-add');
          }
          if (ln.type === 'del') {
            return wrap(<span>{ln.text}</span>, 'term-line term-l-del');
          }
          // context / fallback
          return wrap(<span>{ln.text}</span>, 'term-line term-l-context');
        })}
      </div>
    </div>
  );
};

const DEFAULT_ROWS: Row[] = [
  {n: '1', path: 'src/api/middleware.py', note: 'add limiter'},
  {n: '2', path: 'src/api/handlers.py', note: 'wire it in'},
  {n: '3', path: 'config/limits.py', note: 'thresholds'},
];

// Typewriter reveal — count of chars shown at `frame` given a start + frames/char.
const typed = (frame: number, start: number, per: number, text: string) => {
  const shown = Math.floor(
    interpolate(frame, [start, start + text.length * per], [0, text.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  return {text: text.slice(0, Math.max(0, shown)), done: shown >= text.length};
};

type VData = {
  frame: number;
  blink: number;
  prompt: string;
  planHeader: string;
  rows: Row[];
  confirm: string;
  title: string;
};

// ── A · LIVE — realistic full-bleed CLI. Typing is the ONE motion. ─────────────
const LiveTerm: React.FC<VData> = ({frame, blink, prompt, planHeader, rows, confirm}) => {
  const pStart = 6;
  const pPer = 1.0; // realistic terminal typing speed
  const p = typed(frame, pStart, pPer, prompt);
  const hStart = pStart + prompt.length * pPer + 6;
  const hPer = 0.55;
  const h = typed(frame, hStart, hPer, planHeader);
  const rowsStart = hStart + planHeader.length * hPer + 5;
  const rowPer = 7;
  const confirmStart = rowsStart + rows.length * rowPer + 8;
  const c = typed(frame, confirmStart, 0.7, confirm);
  return (
    <div className="term-stage term-stage-live">
      <div className="term-live">
        <div className="term-live-top">claude-code — plan mode</div>
        <div className="term-line">
          <span className="term-usr-caret">&gt;</span>
          <span className="term-usr">{p.text}</span>
          {!p.done ? <span className="term-caret term-caret-acid" style={{opacity: blink}} /> : null}
        </div>
        {frame >= hStart ? (
          <div className="term-line term-head-live">
            <span className="term-dot-live">⏺</span>
            <span>{h.text}</span>
            {p.done && !h.done ? <span className="term-caret term-caret-acid" style={{opacity: blink}} /> : null}
          </div>
        ) : null}
        {rows.map((r, i) => {
          const rs = rowsStart + i * rowPer;
          if (frame < rs) return null;
          const op = interpolate(frame, [rs, rs + 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const tx = interpolate(frame, [rs, rs + 5], [-10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div key={i} className="term-row-live" style={{opacity: op, transform: `translateX(${tx}px)`}}>
              <span className="term-rn-live">{r.n}</span>
              <span className="term-rp-live">{r.path}</span>
              {r.note ? <span className="term-note-live">· {r.note}</span> : null}
            </div>
          );
        })}
        {frame >= confirmStart ? (
          <div className="term-line term-confirm-live">
            <span>{c.text}</span>
            <span className="term-caret term-caret-acid term-caret-block" style={{opacity: blink}} />
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ── B · EDITORIAL — premium paper card, offset ink shadow. Staggered fadeRise. ──
const EditorialTerm: React.FC<VData> = ({frame, blink, prompt, planHeader, rows, confirm, title}) => {
  const pStart = 12;
  const pPer = 1.4; // calmer
  const p = typed(frame, pStart, pPer, prompt);
  const hStart = pStart + prompt.length * pPer + 12;
  const rowsStart = hStart + 14;
  const rowPer = 8;
  const confirmStart = rowsStart + rows.length * rowPer + 12;
  return (
    <div className="term-stage">
      <div className="term-card" style={fadeRise(frame, 4, 16)}>
        <div className="term-card-bar">
          <span className="term-tl term-tl-r" />
          <span className="term-tl term-tl-y" />
          <span className="term-tl term-tl-g" />
          <span className="term-card-title">{title}</span>
        </div>
        <div className="term-card-body">
          <div className="term-line">
            <span className="term-usr-caret ed">&gt;</span>
            <span className="term-usr ed">{p.text}</span>
            {!p.done ? <span className="term-caret term-caret-ed" style={{opacity: blink}} /> : null}
          </div>
          <div className="term-line term-head-ed" style={fadeRise(frame, hStart, 12)}>
            <span className="term-dot-ed">⏺</span>
            <span>{planHeader}</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="term-row-ed" style={fadeRise(frame, rowsStart + i * rowPer, 12)}>
              <span className="term-rn-ed">{r.n}</span>
              <span className="term-rp-ed">{r.path}</span>
              {r.note ? <span className="term-note-ed">· {r.note}</span> : null}
            </div>
          ))}
          <div className="term-line term-confirm-ed" style={fadeRise(frame, confirmStart, 12)}>
            <span>{confirm}</span>
            <span className="term-caret term-caret-ed term-caret-block" style={{opacity: blink}} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── C · KINETIC — ✗ NO PLAN resolves to ✓ THE PLAN; rows SWEEP + a scan bar. ────
const KineticTerm: React.FC<VData> = ({frame, blink, prompt, rows, confirm, title}) => {
  const pStart = 6;
  const pPer = 0.9; // fast
  const p = typed(frame, pStart, pPer, prompt);
  // state flip: ✗ NO PLAN (warn) 10→34, morphs to ✓ THE PLAN header at ~34
  const noOp = Math.min(
    interpolate(frame, [10, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(frame, [30, 36], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );
  const okS = interp(frame, [34, 46], [0, 1], easePhysical);
  const rowsStart = 44;
  const rowPer = 7;
  const confirmStart = rowsStart + rows.length * rowPer + 12;
  const cPop = interp(frame, [confirmStart, confirmStart + 10], [0, 1], easePhysical);
  return (
    <div className="term-stage">
      <div className="term-card term-card-kin" style={fadeRise(frame, 2, 12)}>
        <div className="term-card-bar">
          <span className="term-tl term-tl-r" />
          <span className="term-tl term-tl-y" />
          <span className="term-tl term-tl-g" />
          <span className="term-card-title">{title}</span>
        </div>
        <div className="term-card-body">
          <div className="term-line">
            <span className="term-usr-caret ed">&gt;</span>
            <span className="term-usr ed">{p.text}</span>
            {!p.done ? <span className="term-caret term-caret-ed" style={{opacity: blink}} /> : null}
          </div>

          {/* the resolving state line: ✗ NO PLAN → ✓ THE PLAN */}
          <div className="term-state-wrap">
            {noOp > 0.01 ? (
              <div className="term-state term-state-no" style={{opacity: noOp}}>
                <span className="term-state-mark">✗</span> NO PLAN
              </div>
            ) : null}
            <div
              className="term-state term-state-ok"
              style={{opacity: okS, transform: `translateY(${(1 - okS) * 14}px)`}}
            >
              <span className="term-state-mark ok">✓</span> THE PLAN
            </div>
          </div>

          {rows.map((r, i) => {
            const rs = rowsStart + i * rowPer;
            const sweep = interp(frame, [rs, rs + 10], [0, 1], easePhysical);
            // scan bar: a highlight that wipes across the row as it lands, then fades
            const scanW = interpolate(frame, [rs, rs + 8], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            const scanOp = Math.min(
              interpolate(frame, [rs, rs + 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              interpolate(frame, [rs + 8, rs + 18], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            );
            return (
              <div
                key={i}
                className="term-row-kin"
                style={{opacity: sweep, transform: `translateX(${(1 - sweep) * -56}px)`}}
              >
                <span className="term-scan" style={{width: `${scanW}%`, opacity: scanOp * 0.5}} />
                <span className="term-rn-kin">{r.n}</span>
                <span className="term-rp-kin">{r.path}</span>
                {r.note ? <span className="term-note-kin">· {r.note}</span> : null}
              </div>
            );
          })}

          <div
            className="term-line term-confirm-kin"
            style={{opacity: cPop, transform: `scale(${interpolate(cPop, [0, 1], [0.9, 1])})`, transformOrigin: 'left center'}}
          >
            <span>{confirm}</span>
            <span className="term-caret term-caret-ed term-caret-block" style={{opacity: blink}} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TerminalScene: React.FC<{scene: any; hideChrome?: boolean}> = ({scene, hideChrome}) => {
  const frame = useCurrentFrame();
  const blink = frame % 34 < 18 ? 1 : 0;
  const variant: 'live' | 'editorial' | 'kinetic' = scene.termStyle ?? 'live';

  // terminal.v2 (proposed 2026-07-13, founder): a PROMINENT rule-title band above
  // the CLI. Big Tektur 900 uppercase caps in the top of the content band (y 372+),
  // acid on dark fields / ink on light — pure function of frame, fades+rises in.
  // When set, the frame gets `.term-frame--titled` which pushes the CLI stage down
  // so the two never collide. Absent ⇒ terminal.v1 renders exactly as before.
  const ruleTitle: string | undefined =
    typeof scene.ruleTitle === 'string' && scene.ruleTitle.trim() ? scene.ruleTitle : undefined;
  const darkField = scene.field === 'ink' || scene.field === 'signal';

  // NEW: a generic typed-line session (grep / diff / plan) — live dark CLI.
  const lines: TLine[] | undefined = Array.isArray(scene.lines) && scene.lines.length ? scene.lines : undefined;
  const title = scene.title ?? 'claude code · session';

  const data: VData = {
    frame,
    blink,
    prompt: scene.prompt ?? 'add rate limiting to the api',
    planHeader: scene.planHeader ?? "planning first — the 3 files I'll touch:",
    rows: scene.rows ?? DEFAULT_ROWS,
    confirm: scene.confirm ?? 'proceed? [y/N]',
    title: scene.title ?? 'claude code · session',
  };

  return (
    <AbsoluteFill>
      <div className={`frame term-frame${ruleTitle ? ' term-frame--titled' : ''}`}>
        {hideChrome ? null : <Chrome kicker={scene.marker} footerRight={scene.beatNo} />}
        {ruleTitle ? (
          <div
            className="term-ruletitle"
            style={{
              ...fadeRise(frame, 6, 14),
              color: darkField ? ACCENTS.acid : FIELDS.ink.bg,
              textShadow: darkField ? '0 0 14px rgba(57, 255, 53, 0.4)' : 'none',
            }}
          >
            {ruleTitle}
          </div>
        ) : null}
        {lines ? (
          <LiveLines frame={frame} blink={blink} lines={lines} title={title} total={scene.durationInFrames ?? 300} />
        ) : variant === 'live' ? (
          <LiveTerm {...data} />
        ) : variant === 'kinetic' ? (
          <KineticTerm {...data} />
        ) : (
          <EditorialTerm {...data} />
        )}
      </div>
    </AbsoluteFill>
  );
};
