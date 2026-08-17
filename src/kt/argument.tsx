// KT ARGUMENT DEVICES — the shared graphics that SAY something.
//
// ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
//
// The fx catalog counted 85 devices in this format and found 13 reusable. NO. 035
// was the first film built after that count, and it had to invent all four of its
// argument graphics. Not because the library was ignored — because every one of
// the 13 approved devices is LAYOUT, SEAM or OUTRO furniture and none of them
// makes an argument. `Plate` says where a graphic goes. `T` says how big its type
// is. Nothing in the shared set draws a mechanism, a count, a chain or a source.
//
// Two of the four NO. 035 needed ALREADY EXISTED — sealed inside KTTokens.tsx as
// CodePage and FindPlate, unreachable by any other film. So the very next film
// after the count reinvented work that was already done and approved, which is
// the 13-vs-72 split doing real damage rather than theoretical damage.
//
// Until argument devices are shared, every film reinvents its visual language
// from scratch, and THAT is the actual enemy of consistency — not a stray margin.
//
// ── WHAT BELONGS HERE ────────────────────────────────────────────────────────
//
// A device belongs here when it carries the STORY's shape rather than the BRAND's
// shape, AND more than one film could carry that shape. The founder's test, from
// kt/blocks.tsx: if it carries the BRAND it is fixed, if it carries the STORY it
// is free. blocks.tsx holds the fixed half. This file holds the parts of the free
// half that turned out to be common — a page being read, a count collapsing, a
// call being handed along, a source being named.
//
// A film still owns WHAT it argues. It no longer owns HOW an argument is drawn.
//
// ── GEOMETRY COMES FROM THE CANON, WITH FOUR RECORDED EXCEPTIONS ─────────────
//
// Every value below is a canon token — the ladder, the roles, the plate origin,
// the one arrival. Four numbers in SourceCard are not, and they are marked where
// they appear: they are the geometry of a FOUNDER-APPROVED SHIPPED RENDER
// (NO. 034, 2026-08-16), protected by canon/goldens/no-034/signature.json. They
// are carried verbatim rather than rounded onto the ladder because rounding them
// would change published work, and "locked" means enforced. They are logged for a
// founder ruling rather than silently normalised.
//
// ── EVERY DEVICE HERE HAS A KTFxLab SEGMENT ──────────────────────────────────
//
// check-kt#fxProven enforces it: a device exported from a shared module is canon
// whether anyone looked at it or not, so nothing enters unseen (founder,
// 2026-08-17). Adding a device here without a segment fails the gate.
import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {
  CANVAS, MARGIN_X, COLUMN_W, PLATE_TOP, gap,
  FAMILY, ROLES,
  FIELD, TEXT_ON, LABEL_ON, HAIR_ON, WASH_ON, ACCENT_ON, Field,
  ENTER_MS, TRAVEL_PX, WIPE, ease, clamp01,
} from './system';

const f = (ms: number) => Math.round((ms / 1000) * CANVAS.fps);

// ---- the palette a device paints itself in ----------------------------------
// A device takes the field it is STANDING ON and derives its colours, never the
// other way round. Two plates in NO. 034 rendered completely invisible because
// their colours were a property of where they were WRITTEN instead of where they
// were SHOWN, and no geometry gate can see that — the element is present, correct
// and the same colour as the thing behind it.
//
// The prop is the field's HEX rather than its name because that is what a film's
// beat data carries and what its composition already passes down. An unknown hex
// resolves to ink, which is the field a plate lands on unless told otherwise.
export type Pal = {text: string; label: string; hair: string; wash: string; accent: string};
const nameOf = (bg: string): Field => {
  const hit = (Object.entries(FIELD) as [Field, string][])
    .find(([, v]) => v.toLowerCase() === String(bg).toLowerCase());
  return hit ? hit[0] : 'ink';
};
/** The canon palette for the field a device is standing on. */
export const palOf = (bg: string): Pal => {
  const k = nameOf(bg);
  return {text: TEXT_ON[k], label: LABEL_ON[k], hair: HAIR_ON[k], wash: WASH_ON[k], accent: ACCENT_ON[k]};
};

const prog = (frame: number, fromMs: number, durMs: number) =>
  clamp01((frame - f(fromMs)) / Math.max(1, f(durMs)));

// ═══ CODE PAGE ═══════════════════════════════════════════════════════════════
// A file being READ, and then most of it turning out not to matter.
//
// Shipped in NO. 034 as the film-local `CodePage`, extracted here unchanged.
//
// ── WHAT IT ARGUES ───────────────────────────────────────────────────────────
//
// Two claims at once, which is why it is one device and not two. A read-head
// travels down a page and every line it crosses lights from hairline to full
// text: that is a machine reading the whole thing. Then everything outside a
// kept passage falls away and a rule is drawn in the margin beside what remains:
// that is the same job done by reading the part that matters. The argument is the
// DIFFERENCE between the two states, so a film that only wants one of them should
// use a plate, not this.
//
// ── THE THREE RULINGS BAKED IN ───────────────────────────────────────────────
//
// 1. THE READ-HEAD IS LINEAR. It is a machine scanning a file, not something
//    arriving, and the one eased curve in this system is for arrivals.
// 2. RED IS A MARK, NOT TYPE. Red on ink measures 4.49:1, under the 4.5 floor, so
//    the kept passage STAYS full text at 16.54:1 and the accent is drawn beside it
//    as an editorial change-bar. Marks go on the data, never on the reading.
// 3. THE LABEL NAMES THE METHOD AND STOPS. Restating the voiceover's own sentence
//    on the plate costs readable time and gives the viewer the same sentence
//    twice. That ruling came out of this device and then caught NO. 035's grid.
//
// Every line is drawn TWICE — once at hairline, which is the file sitting there
// unread, and once in full text at the opacity the head has reached. Two canon
// colours crossfading, rather than one colour interpolated into values the canon
// does not contain. check-contrast's dim-glyph rule is written around exactly
// this pairing: the faint state is a picture of unread text, and the same content
// does reach the readable floor.
export const CodePage: React.FC<{
  field: string;
  lines: string[];
  /** The passage that survives the drop, inclusive, as indices into `lines`. */
  keptFrom: number;
  keptTo: number;
  /** The page arrives. A wipe suppresses plates for WIPE.tailFrames after a seam,
   *  so a page whose beat opens on a seam ramps from the frame it is handed the
   *  screen back — authored at the seam's own ms it renders blank and then pops. */
  inMs: number;
  /** The head travels from the first line to the last between these. */
  readFromMs: number;
  readToMs: number;
  /** Everything outside the kept passage falls away. */
  dropMs: number;
  /** The margin rule draws down the kept passage between these. */
  markFromMs: number;
  markToMs: number;
  /** What the first state is called, and what the second is called. */
  label: string;
  labelAfter: string;
}> = ({field, lines, keptFrom, keptTo, inMs, readFromMs, readToMs, dropMs,
  markFromMs, markToMs, label, labelAfter}) => {
  const pal = palOf(field);
  const frame = useCurrentFrame();
  const size = ROLES.label.size;
  const lh = size + gap('xs');
  const left = MARGIN_X + gap('m');          // the margin the accent rule lives in
  const width = COLUMN_W - gap('m');
  const height = lines.length * lh;

  const page = ease(clamp01((frame - (f(inMs) + WIPE.tailFrames)) / f(ENTER_MS)));
  const scan = clamp01((frame - f(readFromMs)) / Math.max(1, f(readToMs) - f(readFromMs)));
  const drop = ease(prog(frame, dropMs, 740));
  const mark = clamp01((frame - f(markFromMs)) / Math.max(1, f(markToMs) - f(markFromMs)));
  const headY = scan * height;

  return (
    <div style={{opacity: page, transform: `translateY(${(1 - page) * TRAVEL_PX}px)`}}>
      {/* THE MARGIN RULE — drawn before the code so it can never sit over a glyph. */}
      <div style={{position: 'absolute', left: MARGIN_X,
        top: PLATE_TOP + keptFrom * lh, width: 3,
        height: (keptTo - keptFrom + 1) * lh * mark,
        background: pal.accent}} />

      <div style={{position: 'absolute', left, top: PLATE_TOP,
        width, height, overflow: 'hidden',
        fontFamily: FAMILY.mono, fontSize: size, lineHeight: `${lh}px`,
        whiteSpace: 'pre'}}>
        {lines.map((line, i) => {
          const kept = i >= keptFrom && i <= keptTo;
          // A line lights over the one line-height the head takes to cross it, so
          // the page brightens continuously instead of in N steps.
          const read = clamp01((headY - i * lh) / lh);
          const lit = read * (kept ? 1 : 1 - drop);
          return (
            <div key={i} style={{position: 'relative', height: lh}}>
              <div style={{color: pal.hair}}>{line}</div>
              <div style={{position: 'absolute', left: 0, top: 0, color: pal.text,
                opacity: lit}}>{line}</div>
            </div>
          );
        })}
      </div>

      {/* THE READ-HEAD. It exists only while the scan is running and is gone the
          frame it ends — a marker parked on the last line reads as a cursor,
          which is a different claim. */}
      <div style={{position: 'absolute', left, top: PLATE_TOP + headY,
        width, height: 2, background: pal.text,
        opacity: 0.5 * (scan > 0 && scan < 1 ? 1 : 0)}} />

      <div style={{position: 'absolute', left: MARGIN_X, top: PLATE_TOP + height + gap('l'),
        width: COLUMN_W, height: size * 1.2,
        fontFamily: FAMILY.ui, fontSize: size, letterSpacing: ROLES.slug.tracking}}>
        <span style={{position: 'absolute', left: 0, top: 0, color: pal.label,
          opacity: 1 - drop}}>{label}</span>
        <span style={{position: 'absolute', left: 0, top: 0, color: pal.text,
          opacity: drop}}>{labelAfter}</span>
      </div>
    </div>
  );
};

// ═══ SOURCE CARD ═════════════════════════════════════════════════════════════
// A named artefact, with where it lives and what it costs.
//
// Shipped in NO. 034 as the film-local `FindPlate`, extracted here unchanged.
//
// ── WHAT IT ARGUES ───────────────────────────────────────────────────────────
//
// "This is a real thing you can go and get." Three lines in strict order —
// WHERE it lives, WHAT it is called, and the one or two facts that decide whether
// it is worth your time. It is the only device in this file that ends an argument
// rather than making one, which is why it takes no timings beyond its arrival.
//
// ── IT IS NOT THE ANSWER TO "SHOW ME THE REPO" ───────────────────────────────
//
// Read kt-canon.yml#rules.repoCapture before reaching for this. A film that
// RECOMMENDS a repository owes the viewer a real scrolling capture of that
// repository, never a drawn card — founder ruling, 2026-08-17, written after
// NO. 035's drawn card said "89,623 stars" in the same frame the voice said
// "eighty-nine thousand". A card can disagree with its own subject; a capture
// carries the subject's own number on the subject's own page.
//
// So this device is for a named source that is NOT a repo recommendation: a spec,
// a standard, a paper, a product, a citation on a claim. NO. 034 used it as a repo
// card and shipped before that ruling existed; it is grandfathered, not exemplary.
export const SourceCard: React.FC<{
  field: string;
  atMs: number;
  /** Where it lives — the domain, the publisher, the standards body. */
  where: string;
  /** What it is called. */
  name: string;
  /** The one or two facts that decide whether it is worth the viewer's time. */
  meta: string;
}> = ({field, atMs, where, name, meta}) => {
  const pal = palOf(field);
  const frame = useCurrentFrame();
  const p = ease(prog(frame, atMs, ENTER_MS));
  return (
    <div style={{position: 'absolute', left: MARGIN_X, top: PLATE_TOP, width: COLUMN_W,
      border: `2px solid ${pal.text}`, background: pal.wash,
      // OFF-LADDER, AND KEPT ON PURPOSE. 30/34/12 are the padding and row gap of
      // the founder-approved NO. 034 render (2026-08-16), held by
      // canon/goldens/no-034/signature.json. The ladder's neighbours are 24 and
      // 40; rounding to either moves published work, and an approval binds the
      // artefact rather than the name. Logged for a founder ruling — normalising
      // these is a re-approval of NO. 034's repo card, not a tidy-up.
      padding: '30px 34px', opacity: p,
      transform: `translateY(${(1 - p) * TRAVEL_PX}px)`, display: 'flex',
      flexDirection: 'column', rowGap: 12}}>
      <div style={{fontFamily: FAMILY.ui, fontSize: ROLES.label.size,
        letterSpacing: ROLES.slug.tracking, color: pal.label}}>{where}</div>
      <div style={{fontFamily: FAMILY.display, fontSize: ROLES.line.size, color: pal.text}}>{name}</div>
      <div style={{fontFamily: FAMILY.ui, fontSize: ROLES.slug.size,
        letterSpacing: ROLES.label.tracking, color: pal.label}}>{meta}</div>
    </div>
  );
};

// ═══ COUNT GRID ══════════════════════════════════════════════════════════════
// A multiplication, and then the same picture as an addition.
//
// Shipped in NO. 035 as the film-local GridCells / HookGrid / ArithmeticGrid,
// extracted here as one device with the three states as props.
//
// ── WHAT IT ARGUES ───────────────────────────────────────────────────────────
//
// cols x rows is drawn as CROSSINGS — one cell per pair — and the collapse leaves
// the MARGINS: one mark per column and one per row. So the interior of the grid
// is exactly what disappears, which is true rather than illustrative: the
// multiplication lives in the middle and the addition lives around the edge. A
// film that just wants "a lot of things" wants ContainerBreach instead; this
// device is only honest when its two numbers really are a product and a sum.
//
// ── NO MEASURED QUANTITY GOES ON THIS PLATE ──────────────────────────────────
//
// The two factors are stated in the VOICE so the viewer can check the arithmetic
// on their own fingers, and the plate carries those two numbers, no axis and no
// unit. A real-looking count here would make arithmetic read as evidence, which
// is the drawn-evidence mistake of 2026-08-14 wearing a different costume.
//
// ── THREE RULINGS BAKED IN ───────────────────────────────────────────────────
//
// 1. SOLID, NOT OUTLINED (founder, 2026-08-17, reversing an earlier pick). Two
//    independent signals agreed: measured, the ruled collapse left 0.4% of the
//    frame in ink against solid's 2.3% — six times sparser, an almost-empty
//    frame; and reviewed, 2px keylines read as a WIREFRAME rather than
//    letterpress. A keyline is a drawing of a thing; a solid block is the thing.
// 2. THE UNLIT STATE KEEPS ITS HAIRLINE, so a cell always occupies its space and
//    the grid's geometry is legible before anything fills it.
// 3. THE COLLAPSE IS A HARD CUT. It was an eased opacity ramp and the interior
//    crossfaded out under the margins, leaving ghost cells at ~5% under the live
//    marks — a fade across a cut, which this format does not do.
//
// Cells light in READING ORDER, never seeded. A random fill differs between a
// verification still and the video render, and a gate that measures a different
// frame than the one that ships is worthless.
const CELL_H = 44;

export const CountGrid: React.FC<{
  field: string;
  cols: number;
  rows: number;
  /** The grid fills between these. Omit to open full. */
  buildFromMs?: number;
  buildToMs?: number;
  /** The interior goes and the margins remain, on this exact frame. Omit to never collapse. */
  collapseAtMs?: number;
  /** The two factors, named, while the full grid is up. */
  colAxis?: string;
  rowAxis?: string;
  /** What the surviving margins are, once they are all that is left. */
  colMargin?: string;
  rowMargin?: string;
  /** One line under the grid, for the state before the factors are named. */
  caption?: string;
  /** The factors arrive on this word. */
  axisFromMs?: number;
}> = ({field, cols, rows, buildFromMs, buildToMs, collapseAtMs,
  colAxis, rowAxis, colMargin, rowMargin, caption, axisFromMs}) => {
  const pal = palOf(field);
  const frame = useCurrentFrame();
  const cellGap = gap('xs');
  const cellW = (COLUMN_W - (cols - 1) * cellGap) / cols;
  const rowGap = gap('xs') + 4;
  const gridH = rows * CELL_H + (rows - 1) * rowGap;

  const build = buildFromMs === undefined || buildToMs === undefined ? 1
    : clamp01((frame - f(buildFromMs)) / Math.max(1, f(buildToMs) - f(buildFromMs)));
  const lit = Math.round(cols * rows * build);
  const collapsed = collapseAtMs !== undefined && frame >= f(collapseAtMs);
  const marginIn = collapseAtMs === undefined ? 0 : ease(prog(frame, collapseAtMs, ENTER_MS));
  const axis = axisFromMs === undefined ? 1 : ease(prog(frame, axisFromMs, ENTER_MS));

  const label: React.CSSProperties = {position: 'absolute', fontFamily: FAMILY.ui,
    fontSize: ROLES.label.size, letterSpacing: ROLES.slug.tracking, color: pal.label};

  return (
    <>
      {!collapsed ? Array.from({length: cols * rows}, (_, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        return (
          <div key={i} style={{position: 'absolute',
            left: MARGIN_X + col * (cellW + cellGap),
            top: PLATE_TOP + row * (CELL_H + rowGap),
            width: cellW, height: CELL_H,
            background: pal.hair}}>
            <div style={{position: 'absolute', inset: 0,
              background: pal.text, opacity: i < lit ? 1 : 0}} />
          </div>
        );
      }) : null}

      {caption && !collapsed ? (
        <div style={{...label, left: MARGIN_X, top: PLATE_TOP + gridH + gap('l'), width: COLUMN_W}}>
          {caption}
        </div>
      ) : null}
      {colAxis && !collapsed ? (
        <div style={{...label, left: MARGIN_X, top: PLATE_TOP - gap('l'), opacity: axis}}>{colAxis}</div>
      ) : null}
      {rowAxis && !collapsed ? (
        <div style={{...label, left: MARGIN_X, top: PLATE_TOP + gridH + gap('m'),
          width: COLUMN_W, opacity: axis}}>{rowAxis}</div>
      ) : null}

      {/* THE MARGINS. The same cells the grid had around its edge, on their own
          rows, named — now the only thing left. Solid, like the grid they came
          out of: these stayed outlined once when the grid went solid, and the
          collapse ran from a solid block to hollow keylines, which is arithmetic
          on screen that does not look like the arithmetic. */}
      {collapsed && colMargin && rowMargin ? (
        <div style={{opacity: marginIn, transform: `translateY(${(1 - marginIn) * TRAVEL_PX}px)`}}>
          {([[cols, colMargin, 0], [rows, rowMargin, CELL_H + gap('xxl')]] as const).map(([n, text, dy]) => (
            <div key={text} style={{position: 'absolute', left: MARGIN_X, top: PLATE_TOP + dy}}>
              <div style={{display: 'flex', columnGap: cellGap}}>
                {Array.from({length: n as number}, (_, i) => (
                  <div key={i} style={{width: cellW, height: CELL_H, background: pal.text}} />
                ))}
              </div>
              <div style={{marginTop: gap('s'), fontFamily: FAMILY.ui, fontSize: ROLES.label.size,
                letterSpacing: ROLES.slug.tracking, color: pal.label}}>{text}</div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};

// ═══ HOP CHAIN ═══════════════════════════════════════════════════════════════
// A call being handed along, and the answer coming back.
//
// Shipped in NO. 035 as the film-local `HopChain`, extracted here unchanged.
//
// ── WHAT IT ARGUES ───────────────────────────────────────────────────────────
//
// WHO CALLS WHOM, in order. A stack of stations with ONE mark travelling down
// them as the voice names each: the travel is the whole point, because it shows a
// HAND-OFF. A static diagram of the same boxes shows a topology and says nothing
// about direction, which is usually the only thing actually in dispute.
//
// The optional return rule is the half of the round trip everybody forgets, and
// it is why the caller belongs at the TOP of the column rather than in the middle.
//
// ── THREE RULINGS BAKED IN ───────────────────────────────────────────────────
//
// 1. STATIONS ARRIVE EARLY (locked ruling: "visualisations enter EARLY and hold
//    LONG"). Pinned to the word naming each one, a four-station chain had ONE box
//    on screen a third of the way through its own hold and the bottom half of the
//    frame empty — the weakest frame in NO. 035, found by a design review. The
//    chain BUILDS in the first beat or so; the travelling mark still lands on the
//    spoken word. The picture is the whole chain, the voice picks out which link.
// 2. TWO STATES, NO THIRD COLOUR. A station is a keyline or a solid plate and the
//    field shows through otherwise. The inactive fill was a wash, which
//    composites to a grey that reads as a fourth colour and as a default UI card.
// 3. A LIVE STATION IS SOLID, so its type inverts to the field it sits on.
//
// A logo is OPTIONAL AND CARRIES A LICENCE OBLIGATION. See
// kt-canon.yml#rules.logoLicence: a real brand mark goes on screen UNMODIFIED,
// with a generic term after it on first use, and only where the brand's terms
// allow. Redrawing a mark "in our own style" inverts the risk rather than
// reducing it — every brand guideline including Slack's forbids ALTERING a logo,
// so a restyled mark is a modified trademark where an unmodified one is at least
// ordinary editorial use.
export type Station = {
  /** What the station is called. */
  k: string;
  /** When the box arrives. */
  at: number;
  /** When the travelling mark lands on it — the word that names it. */
  live: number;
  /** A staticFile() path to an UNMODIFIED brand mark. See logoLicence. */
  logo?: string;
};

const STATION_H = 96;

export const HopChain: React.FC<{
  field: string;
  stations: Station[];
  /** The answer goes back up the left margin from this word. Omit for one-way. */
  returnAtMs?: number;
  /** One line under the chain, arriving with the return. */
  caption?: string;
}> = ({field, stations, returnAtMs, caption}) => {
  const pal = palOf(field);
  const frame = useCurrentFrame();
  const chainGapY = gap('l');
  const ret = returnAtMs === undefined ? 0 : ease(prog(frame, returnAtMs, ENTER_MS));
  // The mark sits ON the station that is currently live: the last one whose time
  // has passed. One element moving down the column, never N.
  const live = stations.reduce((n, x, j) => (frame >= f(x.live) ? j : n), -1);
  return (
    <>
      {stations.map((s, i) => {
        const p = ease(prog(frame, s.at, ENTER_MS));
        const top = PLATE_TOP + i * (STATION_H + chainGapY);
        return (
          <div key={s.k} style={{position: 'absolute', left: MARGIN_X, top,
            width: COLUMN_W, height: STATION_H, opacity: p,
            transform: `translateY(${(1 - p) * TRAVEL_PX}px)`,
            border: `2px solid ${live === i ? pal.text : pal.hair}`,
            background: live === i ? pal.text : 'transparent',
            display: 'flex', alignItems: 'center', paddingLeft: gap('m'),
            columnGap: gap('m')}}>
            <div style={{fontFamily: FAMILY.mono, fontSize: ROLES.label.size,
              color: live === i ? pal.wash : pal.label}}>
              {String(i + 1).padStart(2, '0')}
            </div>
            {/* The mark sits BEFORE the name, at cap height, so the row still
                reads as a line of type with a mark on it rather than as a logo
                lockup. Sized off the body role, not a new number. */}
            {s.logo ? (
              <Img src={staticFile(s.logo)}
                style={{width: ROLES.body.size, height: ROLES.body.size, display: 'block'}} />
            ) : null}
            <div style={{fontFamily: FAMILY.display, fontSize: ROLES.body.size,
              color: live === i ? FIELD[nameOf(field)] : pal.text}}>{s.k}</div>
          </div>
        );
      })}

      {/* THE RETURN. INSIDE THE SAFE BOX — this was one gap to the LEFT of the
          column in NO. 035, sixteen pixels outside SAFE.x0, and every gate passed
          it. safeZoneFurniture checks the wordmark and footer only, so a PLATE
          could leave the safe zone and nothing in the canon could see it. A human
          found it. Both the bug and the hole are recorded. */}
      {ret > 0 ? (
        <div style={{position: 'absolute', left: MARGIN_X, top: PLATE_TOP, width: 3,
          height: (stations.length - 1) * (STATION_H + chainGapY) * ret,
          background: pal.accent}} />
      ) : null}

      {caption ? (
        <div style={{position: 'absolute', left: MARGIN_X,
          top: PLATE_TOP + stations.length * (STATION_H + chainGapY) - chainGapY + gap('m'),
          width: COLUMN_W, fontFamily: FAMILY.ui, fontSize: ROLES.label.size,
          letterSpacing: ROLES.slug.tracking, color: pal.label, opacity: ret}}>
          {caption}
        </div>
      ) : null}
    </>
  );
};
