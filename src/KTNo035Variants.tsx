// KTNo035Variants — THREE TREATMENTS OF ONE GRAPHIC, for the founder to choose on
// screen. Not a film, not a lab segment: a decision surface, deleted once the
// choice is made and the winner moves into KTNo035.tsx.
//
// FOUNDER, 2026-08-17: chose the 5x10 matrix over the bipartite fan and the tally
// wall, with "i have to see a few options". So the question this file answers is
// narrow — the matrix is settled, its TREATMENT is not.
//
// ── WHAT THE COLLAPSE ACTUALLY IS ────────────────────────────────────────────
//
// The film's arithmetic is 5 apps x 10 services = 50 integrations, against
// 10 servers + 5 clients = 15. Drawn on a matrix that is not a decoration: the 50
// are the CROSSINGS, one per app-service pair, and the 15 are the MARGINS — one
// mark per service and one per app, which is exactly what MCP's own architecture
// says a host builds ("creating one MCP client for each MCP server", facts.md#G3).
//
// So the interior of the grid is the thing that disappears. That is the picture,
// and it is true rather than illustrative: the multiplication lives in the middle
// and the addition lives around the edge.
//
// The two states are a HARD CUT, not a morph. Everything in this format cuts.
//
// ── THE NUMBERS ON SCREEN ARE ARITHMETIC, NOT DATA ───────────────────────────
//
// facts.md#W1. Nobody publishes how many integrations a team writes, so the plate
// carries 5, 10, 50 and 15 and NO axis, no unit, no measured quantity. Labelling
// it with anything else would make arithmetic read as evidence, which is the
// drawn-evidence mistake of 2026-08-14 in a new costume.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Stage} from './kt/blocks';
import {CANVAS, MARGIN_X, COLUMN_W, PLATE_TOP, gap, FAMILY, ROLES,
  FIELD, TEXT_ON, LABEL_ON, HAIR_ON, ACCENT_ON, TRAVEL_PX,
  ease, clamp01} from './kt/system';
import './style.css';

const FPS = CANVAS.fps;
const f = (ms: number) => Math.round((ms / 1000) * FPS);

// Each variant gets the same clock so the three are compared at identical moments.
const SEG_SEC = 10;
export const VAR_SEG = SEG_SEC * FPS;

// The beat inside a segment, in ms. Phase one builds to fifty; phase two cuts to
// fifteen. Both hold long enough to read, per the canon's readable-time rule.
const BUILD_FROM = 400;
const BUILD_TO = 3200;
const CUT_AT = 5000;

const COLS = 10;   // services
const ROWS = 5;    // apps

// Geometry off the canon: the plate's own origin and width, the gap ladder.
const CELL_GAP = gap('xs');
const CELL_W = (COLUMN_W - (COLS - 1) * CELL_GAP) / COLS;
const CELL_H = 44;
const ROW_GAP = gap('xs') + 4;
const GRID_H = ROWS * CELL_H + (ROWS - 1) * ROW_GAP;

type Look = 'solid' | 'ruled' | 'axes';

const prog = (frame: number, fromMs: number, toMs: number) =>
  clamp01((frame - f(fromMs)) / Math.max(1, f(toMs) - f(fromMs)));

// ── the fifty ────────────────────────────────────────────────────────────────
// Cells light in reading order as the count runs. The order is FIXED, never
// seeded — a random fill would differ between a verification still and the video
// render, and a gate that measures a different frame than the one that ships is
// worthless (the ruling behind NO. 034's fixed tick indices).
const Fifty: React.FC<{look: Look; lit: number; out: number}> = ({look, lit, out}) => {
  const cells = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS, row = Math.floor(i / COLS);
    const on = i < lit ? 1 : 0;
    cells.push(
      <div key={i} style={{position: 'absolute',
        left: MARGIN_X + col * (CELL_W + CELL_GAP),
        top: PLATE_TOP + row * (CELL_H + ROW_GAP),
        width: CELL_W, height: CELL_H,
        // Every cell sits on the hairline and the count raises it. One element,
        // one state — nothing appears on top of anything.
        background: look === 'ruled' ? 'transparent' : HAIR_ON.ink,
        border: look === 'ruled' ? `1px solid ${HAIR_ON.ink}` : undefined,
        opacity: 1 - out}}>
        <div style={{position: 'absolute', inset: 0,
          background: TEXT_ON.ink, opacity: on * (1 - out)}} />
      </div>,
    );
  }
  return <>{cells}</>;
};

// ── the fifteen ──────────────────────────────────────────────────────────────
// Ten marks and five marks, on their own rows, named. They are the MARGINS of the
// grid above — one client per server, which is the architecture's own sentence.
const Fifteen: React.FC<{look: Look; t: number}> = ({look, t}) => {
  const rowOf = (n: number, label: string, top: number, delay: number) => {
    const p = ease(clamp01((t - delay) / 0.55));
    if (p <= 0) return null;
    return (
      <div style={{position: 'absolute', left: MARGIN_X, top,
        opacity: p, transform: `translateY(${(1 - p) * TRAVEL_PX}px)`}}>
        <div style={{display: 'flex', columnGap: CELL_GAP}}>
          {Array.from({length: n}, (_, i) => (
            <div key={i} style={{width: CELL_W, height: CELL_H,
              background: look === 'ruled' ? 'transparent' : TEXT_ON.ink,
              border: look === 'ruled' ? `2px solid ${TEXT_ON.ink}` : undefined}} />
          ))}
        </div>
        <div style={{marginTop: gap('s'), fontFamily: FAMILY.ui,
          fontSize: ROLES.label.size, letterSpacing: ROLES.label.tracking,
          color: LABEL_ON.ink}}>{label}</div>
      </div>
    );
  };
  return (
    <>
      {rowOf(COLS, '10 SERVERS — ONE PER SERVICE', PLATE_TOP, 0)}
      {rowOf(ROWS, '5 CLIENTS — ONE PER APP', PLATE_TOP + CELL_H + gap('xxl'), 0.35)}
    </>
  );
};

// ── the axis labels, variant C only ──────────────────────────────────────────
// They make the multiplication legible instead of implied: the reader can see
// that the count is rows times columns rather than being told it.
const Axes: React.FC<{t: number}> = ({t}) => {
  const p = ease(clamp01(t));
  const style: React.CSSProperties = {position: 'absolute', fontFamily: FAMILY.ui,
    fontSize: ROLES.label.size, letterSpacing: ROLES.label.tracking,
    color: LABEL_ON.ink, opacity: p};
  return (
    <>
      <div style={{...style, left: MARGIN_X, top: PLATE_TOP - gap('l')}}>
        10 SERVICES
      </div>
      <div style={{...style, left: MARGIN_X, top: PLATE_TOP + GRID_H + gap('m'),
        width: COLUMN_W}}>
        5 APPS
      </div>
    </>
  );
};

// ── one variant ──────────────────────────────────────────────────────────────
// THE FRAME IS A PROP, NOT `useCurrentFrame()`. Authored the obvious way, all
// three variants read the GLOBAL clock, so B and C would already be past their
// collapse before their own segment appeared — three panels showing the same
// end state and a decision surface that decides nothing. This is the exact trap
// KTFxLab's `Enter` segment documents; it is cheaper to obey than to rediscover.
const Variant: React.FC<{look: Look; name: string; note: string; frame: number}> =
  ({look, name, note, frame}) => {
  const build = prog(frame, BUILD_FROM, BUILD_TO);
  const cut = frame >= f(CUT_AT);
  const since = (frame - f(CUT_AT)) / FPS;
  const lit = Math.round(COLS * ROWS * build);
  const count = cut ? 15 : lit;

  return (
    <Stage field="ink">
      {/* The wordmark, so each variant is judged in the frame it will live in
          rather than as a diagram floating on a field. */}
      <div style={{position: 'absolute', left: MARGIN_X, top: 240,
        fontFamily: FAMILY.ui, fontSize: ROLES.wordmark.size, fontWeight: 600,
        letterSpacing: '-0.045em', color: TEXT_ON.ink}}>vektor</div>

      {/* THE COUNT. Large, on its own, above the grid — this is the number the
          voice is speaking, and it is the only thing on the frame that moves
          during the build. */}
      <div style={{position: 'absolute', left: MARGIN_X, top: PLATE_TOP - 190,
        width: COLUMN_W}}>
        <div style={{fontFamily: FAMILY.display, fontSize: ROLES.hero.size,
          lineHeight: 1, color: cut ? ACCENT_ON.ink : TEXT_ON.ink}}>{count}</div>
        <div style={{marginTop: gap('xs'), fontFamily: FAMILY.ui,
          fontSize: ROLES.label.size, letterSpacing: ROLES.label.tracking,
          color: LABEL_ON.ink}}>
          {cut ? 'PIECES OF GLUE' : 'INTEGRATIONS BY HAND'}
        </div>
      </div>

      {!cut ? (
        <>
          <Fifty look={look} lit={lit} out={0} />
          {look === 'axes' ? <Axes t={build} /> : null}
        </>
      ) : (
        <Fifteen look={look} t={since} />
      )}

      {/* the variant's own label, outside the film's frame language */}
      <div style={{position: 'absolute', left: MARGIN_X, bottom: 150, width: COLUMN_W}}>
        <div style={{fontFamily: FAMILY.ui, fontSize: 40, letterSpacing: 3,
          textTransform: 'uppercase', color: TEXT_ON.ink}}>{name}</div>
        <div style={{fontFamily: FAMILY.ui, fontSize: 28, marginTop: 10,
          color: LABEL_ON.ink}}>{note}</div>
      </div>
    </Stage>
  );
};

const VARIANTS: {look: Look; name: string; note: string}[] = [
  {look: 'solid', name: 'A — solid',
   note: 'filled blocks on a hairline. the NO. 034 context-field family.'},
  {look: 'ruled', name: 'B — ruled',
   note: 'outlined cells. reads as a table, more architectural.'},
  {look: 'axes', name: 'C — axes named',
   note: 'solid, plus the two factors named. the multiplication is legible, not implied.'},
];

export const KT_NO035_VARIANTS_FRAMES = VARIANTS.length * VAR_SEG;

// The strip: one variant per segment, each handed its own local frame. Scrub to
// 0s / 10s / 20s to land on A / B / C, and to +5s within any of them for the cut.
export const KTNo035Variants: React.FC = () => {
  const frame = useCurrentFrame();
  const index = Math.min(VARIANTS.length - 1, Math.floor(frame / VAR_SEG));
  const v = VARIANTS[index];
  return (
    <AbsoluteFill style={{backgroundColor: FIELD.ink}}>
      <Variant {...v} frame={frame - index * VAR_SEG} />
    </AbsoluteFill>
  );
};
