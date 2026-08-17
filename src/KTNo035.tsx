// NO. 035 "mcp does not replace your api" — KT-Remotion.
//
// The film's argument, and therefore its visual spine: MCP is not a replacement
// for your API, it is a socket in front of one. So every plate here shows a
// RELATIONSHIP rather than a quantity — what connects to what, and what stops
// having to be written. The one number that moves (50 -> 15) is arithmetic the
// viewer can do on their own fingers, and the plate says so by carrying its two
// factors and no axis.
//
// It is a correction film, which is the shape the founder's 2026-08-17 reel list
// identified as the highest-performing one in the set. The beat that makes it
// worth making is S4: the protocol DEPRECATED the one primitive that let a server
// bypass a provider API, and told implementers to call the API instead. The
// correction the film makes is one the spec makes about itself (facts.md#G6).
//
// Locked taste rulings carried from NO. 026 / 027 / 033 / 034, held here:
//   - no glyph-scramble anywhere (so no w.shuffle, and no w.chaos either)
//   - visualisations enter EARLY and hold LONG
//   - text on viz beats sits top, never touching the viz
//   - everything cuts on exact frames; nothing fades across a seam
//   - one anchor per beat: the type block never moves mid-beat
//
// Field plan: ink -> ink (paragraph break, 7.29s) -> red (18.16s) -> cream
// (31.48s) -> ink (45.44s) -> cream (51.68s) -> red (58.70s). The rotation law is
// that a film does not repeat its predecessor; NO. 034 ran ink -> cream -> ink ->
// red -> cream -> red. Red carries the two beats that cost the viewer something:
// the arithmetic that says the integration count is their own doing, and the CTA.
//
// SAFE ZONE IS A BUILD CONSTRAINT, NOT A REVIEW STEP. Everything meaningful lives
// inside SAFE, and every geometry value below comes off the canon — there is no
// frame position typed in this file.
import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f, Word} from './KTHook';
import {NO035_BEATS, NO035_END_MS} from './KTNo035Words';
import {gap, FAMILY, WORDMARK, ROLES, MARGIN_X, COLUMN_W, SAFE, FIELD, TEXT_ON,
  ENTER_MS, DETAIL_MS, TRAVEL_PX, WIPE, PLATE_TOP,
  CAPTURE_SCROLL_PX_PER_SEC} from './kt/system';
import {MatteWipe, ZigzagMarquee} from './KTSeams';
import {ClaudeMascot} from './scenes/ClaudeMascot';
import './style.css';

export const KT_NO035_FRAMES = f(NO035_END_MS);

const FONT = FAMILY.display;
const FONT_UI = FAMILY.ui;
const FONT_MONO = FAMILY.mono;

// The deeper red and white text, ruled 2026-08-15 on NO. 034: pure E7371A cannot
// carry any text colour at 4.5:1, so the FIELD moved rather than the text. These
// are that ruling's constants, imported in spirit but redeclared because NO. 034
// is a locked artefact and its file must not become a shared module by accident.
// TAKEN FROM THE CANON, NOT TYPED. These were raw hex literals and the drift
// ratchet blocked the commit — correctly. A film that retypes a colour is a film
// the canon cannot move: changing the red in kt-tokens.json would have changed
// nothing this file renders. Both values are already in the generated system.
const WHITE = TEXT_ON.redDeep;    // pure white — the only text colour that clears on red
                                  // (written without the hex: check-drift counts a hash plus 3-8
                                  //  hex digits as a raw colour, even inside a comment)
const RED_DEEP = FIELD.redDeep;   // the 5% deeper red ruled on NO. 034, 2026-08-15

const LABEL_C = 'rgba(16,16,16,0.62)';    // on cream — 5.07:1
const LABEL_I = 'rgba(244,239,223,0.55)'; // on ink   — 5.57:1
const HAIR_C = 'rgba(16,16,16,0.28)';
const HAIR_I = 'rgba(244,239,223,0.26)';
const WASH_C = 'rgba(16,16,16,0.08)';
const WASH_I = 'rgba(244,239,223,0.10)';
const RULE_R = 'rgba(255,255,255,0.5)';

const FOOTER_ON: Record<string, string> = {[CREAM]: LABEL_C, [RED_DEEP]: WHITE, [INK]: LABEL_I};
const WORDMARK_ON: Record<string, string> = {[CREAM]: INK, [RED_DEEP]: CREAM, [INK]: CREAM};

const asField = (c: string) => (c === RED ? RED_DEEP : c);

// ---- a plate paints itself for the field it lands on ------------------------
// The single most expensive class of bug in NO. 034: a plate authored against one
// field and mounted on another renders invisible, is present and correct, and no
// geometry gate can see it. A plate ASKS the field what to use; moving a plate to
// a different beat can no longer make it disappear.
//
// check-contrast parses this function out of the source to resolve every
// `color: pal.*` against the field the plate actually stands on. Keep the shape:
// `bg === CONST ? {...}` arms and a bare default arm.
type FieldPalette = {text: string; label: string; hair: string; wash: string; accent: string};
const onField = (bg: string): FieldPalette =>
  bg === CREAM ? {text: INK, label: LABEL_C, hair: HAIR_C, wash: WASH_C, accent: RED_DEEP}
  : bg === RED_DEEP ? {text: WHITE, label: WHITE, hair: RULE_R, wash: WASH_I, accent: WHITE}
  : {text: CREAM, label: LABEL_I, hair: HAIR_I, wash: WASH_I, accent: RED_DEEP};

// ---- the sub-scale and the one arrival --------------------------------------
const UI = {s: ROLES.label.size, m: ROLES.slug.size, l: ROLES.wordmark.size};
const TRACK = {label: ROLES.label.tracking, slug: ROLES.slug.tracking};
const ENTER = ENTER_MS;
const DETAIL = DETAIL_MS;
const TRAVEL = TRAVEL_PX;

const VIZ_L = MARGIN_X, VIZ_W = COLUMN_W;

// The band the words live in: from the wordmark's baseline to the top of the
// graphic, with the block centred in it. Both edges are canon values, so no beat
// has anywhere to state a top.
const TYPE_BAND_TOP = WORDMARK.y + ROLES.wordmark.size;
const TYPE_BAND_H = PLATE_TOP - TYPE_BAND_TOP;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const decel = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const prog = (frame: number, fromMs: number, durMs: number) =>
  clamp01((frame - f(fromMs)) / Math.max(1, f(durMs)));

const Window: React.FC<{fromMs: number; toMs: number; children: React.ReactNode}> =
  ({fromMs, toMs, children}) => {
    const frame = useCurrentFrame();
    if (frame < f(fromMs) || frame >= f(toMs)) return null;
    return <>{children}</>;
  };

// Reserve each word's final width so the line's geometry is settled before the
// first word lands — words arrive in place and nothing readable ever moves.
// Ruled 2026-08-16: a line can grow from its centre or hold still, not both.
const lineWidthSpacer = (w: {t: string; caps?: boolean; size?: number}, base: number) => (
  <span aria-hidden style={{visibility: 'hidden', fontSize: w.size ?? base, whiteSpace: 'pre'}}>
    {w.caps ? w.t.toUpperCase() : w.t}
  </span>
);

// ═══ THE GRID ════════════════════════════════════════════════════════════════
// SOLID CELLS. The founder picked the ruled treatment from three rendered options
// on 2026-08-17 and reversed it the same day once a design review agreed with the
// measurement. See GridCells below for both signals.
//
// WHAT THE COLLAPSE ACTUALLY IS. The 50 are the CROSSINGS of 5 apps and 10
// services — one integration per pair. The 15 are the MARGINS: one server per
// service and one client per app, which is the architecture's own sentence
// ("creating one MCP client for each MCP server", facts.md#G3). So the interior
// of the grid is exactly what disappears. That is true rather than illustrative:
// the multiplication lives in the middle, the addition lives around the edge.
//
// NO MEASURED QUANTITY GOES ON THIS PLATE (facts.md#W1). Nobody publishes how
// many integrations a team writes. Five and ten are stated in the voice so the
// viewer can check the arithmetic themselves, and the plate carries those two
// numbers, no axis and no unit. A real-looking count here would make arithmetic
// read as evidence, which is the drawn-evidence mistake of 2026-08-14.
const COLS = 10;   // services
const ROWS = 5;    // apps
const CELL_GAP = gap('xs');
const CELL_W = (COLUMN_W - (COLS - 1) * CELL_GAP) / COLS;
const CELL_H = 44;
const ROW_GAP = gap('xs') + 4;
const GRID_H = ROWS * CELL_H + (ROWS - 1) * ROW_GAP;

// Cells light in reading order. The order is FIXED, never seeded — a random fill
// would differ between a verification still and the video render, and a gate that
// measures a different frame than the one that ships is worthless.
// SOLID, NOT OUTLINED (founder, 2026-08-17, reversing the earlier B pick).
//
// Two independent signals said the same thing and the founder changed the call.
// Measured: the ruled collapse left 0.4% of the frame in ink against solid's
// 2.3% — six times sparser, an almost-empty frame. Reviewed: 2px keylines on ink
// read as a WIREFRAME rather than letterpress, and NO. 034's approved golden used
// solid blocks. A keyline is a drawing of a thing; a solid block is the thing.
//
// The unlit state keeps the hairline, so a cell always occupies its space and the
// grid's geometry is legible before anything fills it. One element, one state,
// nothing appearing on top of anything.
//
// `gone` IS A BOOLEAN, NOT A RAMP. It was `fade`, an opacity interpolation, which
// crossfaded the interior out over 640ms and left ghost cells at ~5% sitting under
// the live margin marks — a fade across a cut, which this format does not do.
// Everything cuts on an exact frame.
const GridCells: React.FC<{field: string; lit: number; gone?: boolean}> = ({field, lit, gone = false}) => {
  const pal = onField(field);
  if (gone) return null;
  const out = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS, row = Math.floor(i / COLS);
    out.push(
      <div key={i} style={{position: 'absolute',
        left: VIZ_L + col * (CELL_W + CELL_GAP),
        top: PLATE_TOP + row * (CELL_H + ROW_GAP),
        width: CELL_W, height: CELL_H,
        background: pal.hair}}>
        <div style={{position: 'absolute', inset: 0,
          background: pal.text, opacity: i < lit ? 1 : 0}} />
      </div>,
    );
  }
  return <>{out}</>;
};

// S1 — the hook. The grid builds to fifty while the voice says "fifty".
const GRID_BUILD_FROM = 1270;   // "MCP" — the grid starts as the subject is named
const GRID_BUILD_TO = 5160;     // "50" is spoken exactly as the last cell lands
const HookGrid: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const build = clamp01((frame - f(GRID_BUILD_FROM)) / Math.max(1, f(GRID_BUILD_TO) - f(GRID_BUILD_FROM)));
  return (
    <>
      <GridCells field={field} lit={Math.round(COLS * ROWS * build)} />
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + GRID_H + gap('l'),
        width: VIZ_W, fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug,
        color: pal.label}}>
        ONE PER APP, PER SERVICE
      </div>
    </>
  );
};

// S3 — the arithmetic. The same grid, now with its two factors named, then the
// interior goes and the margins remain.
const GRID_FACTORS = 22240;   // "Five apps talking to 10 services"
// THE COLLAPSE LANDS ON THE SENTENCE THAT DESCRIBES THE FIFTEEN, NOT ON THE
// NUMBER AT THE END OF IT (2026-08-17).
//
// It was pinned to "15." at 30610, which sounds right and is the single worst
// timing decision in the film. Measured:
//
//   collapse lands       f918   30.60s
//   fully arrived        f933          the 500ms entrance finishes
//   wipe suppresses at   f934          10 frames before the 31480 seam
//
// The payoff of the entire film — the multiplication becoming an addition — was
// on screen for 0.53s, and at full opacity for ONE FRAME. Every gate passed:
// readableTime measures the PLATE window, 13.3s, and is structurally blind to how
// long a STATE within a plate survives.
//
// 26800 is "One server per service, one client per app" — the clause that
// describes the fifteen. The marks are now up while the voice explains them and
// the spoken "15." at 30610 lands on a picture already there, which is the locked
// ruling "visualisations enter EARLY and hold LONG". The payoff gets 4.3s.
const GRID_COLLAPSE = 26800;
const ArithmeticGrid: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const factors = decel(prog(frame, GRID_FACTORS, ENTER));
  // A HARD CUT. `collapse` was an eased 640ms ramp and the interior crossfaded
  // out under the margins — a fade across a cut, which this format does not do.
  // The interior is there or it is not, on one exact frame.
  const collapsed = frame >= f(GRID_COLLAPSE);
  const marginIn = decel(prog(frame, GRID_COLLAPSE, ENTER));
  const axis: React.CSSProperties = {position: 'absolute', fontFamily: FONT_UI,
    fontSize: UI.s, letterSpacing: TRACK.slug, color: pal.label, opacity: collapsed ? 0 : factors};
  return (
    <>
      <GridCells field={field} lit={COLS * ROWS} gone={collapsed} />
      <div style={{...axis, left: VIZ_L, top: PLATE_TOP - gap('l')}}>10 SERVICES</div>
      <div style={{...axis, left: VIZ_L, top: PLATE_TOP + GRID_H + gap('m'), width: VIZ_W}}>
        5 APPS
      </div>

      {/* THE MARGINS. Ten and five, on their own rows, named — the same cells the
          grid had around its edge, now the only thing left. */}
      {collapsed ? (
        <div style={{opacity: marginIn, transform: `translateY(${(1 - marginIn) * TRAVEL}px)`}}>
          {/* THE LABELS NAME THE THING AND STOP. They read "10 SERVERS — ONE PER
              SERVICE" and "5 CLIENTS — ONE PER APP", which is the voice's own
              sentence at this exact moment ("One server per service, one client
              per app"). readableTime failed the plate by 0.5s at 18 words, and
              the six words it wanted back were the six that gave the viewer the
              same sentence twice — NO. 034's CodePage ruling, applying itself. */}
          {([[COLS, '10 SERVERS', 0],
             [ROWS, '5 CLIENTS', CELL_H + gap('xxl')]] as const).map(([n, label, dy]) => (
            <div key={label} style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + dy}}>
              <div style={{display: 'flex', columnGap: CELL_GAP}}>
                {Array.from({length: n as number}, (_, i) => (
                  /* SOLID, like the grid they came out of. These stayed
                     outlined when GridCells went solid, so the collapse ran
                     from a solid block of 50 to fifteen hollow keylines —
                     measured at 0.5% of the frame in ink against the grid's
                     7.8%, when 15/50 of a solid grid should be about 2.3%. The
                     arithmetic on screen has to look like the arithmetic. */
                  <div key={i} style={{width: CELL_W, height: CELL_H,
                    background: pal.text}} />
                ))}
              </div>
              <div style={{marginTop: gap('s'), fontFamily: FONT_UI, fontSize: UI.s,
                letterSpacing: TRACK.slug, color: pal.label}}>{label}</div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};

// ═══ THE HOP CHAIN ═══════════════════════════════════════════════════════════
// S2 — the mechanism, and the film's central correction drawn rather than said.
// Four stations, and ONE mark that travels between them as the voice names each.
// The travel is the whole point: it shows a HAND-OFF. A static diagram of the
// same four boxes would show a topology and say nothing about who calls whom,
// which is the only thing in dispute.
//
// Every station time is a word's `ms` from KTNo035Words.ts, so the picture moves
// when the sentence moves.
// THE FOURTH STATION CARRIES THE REAL SLACK MARK (founder, 2026-08-17).
//
// AN ACCEPTED RISK, NOT A CLEARED ONE — recorded so nobody later reads this as
// settled. Slack's Brand Terms of Service say most third-party use of their marks
// requires a written licence, and we have none. What we are relying on is ordinary
// nominative editorial use: naming a product, with its own unmodified mark, to
// identify it. That is common practice and the practical exposure on a 60s
// explainer is low. The founder weighed it and chose the logo.
//
// TWO THINGS THAT ARE NOT NEGOTIABLE, GIVEN THAT CHOICE:
//   1. The mark is UNMODIFIED. The founder's first instinct was to redraw it in
//      our own style to "comply", which inverts the risk — every brand guideline
//      including Slack's forbids ALTERING the logo, so a restyled mark is a
//      modified trademark where an unmodified one is at least defensible.
//   2. A generic term follows the trademark on first use, which Slack's guidelines
//      require. Hence "SLACK API", never "Slack" alone.
//
// public/images/logos/slack.svg is the official 2019 mark, unaltered, fetched
// 2026-08-17. It is the only element in this film carrying colours outside the
// three-field palette — Slack's four brand colours. That is the cost of the
// decision and it is why the mark is small and sits beside the type rather than
// replacing it.
//
// STATIONS ARRIVE EARLY (locked ruling: "visualisations enter EARLY and hold
// LONG"). They were pinned to the word naming each one, which meant that at 10.5s
// — a third of the way into a 10.9s hold — ONE of four stations was on screen and
// the bottom 965px of frame was empty. A design review called it the weakest frame
// in the film and was right. The chain now BUILDS over the first 1.4s so the shape
// is legible immediately, and the travelling mark still lands on the spoken word.
// The picture is the whole chain; the voice picks out which link is live.
type Station = {k: string; at: number; live: number; logo?: string};
const STATIONS: Station[] = [
  {k: 'MODEL', at: 7600, live: 8990},        // "The model never makes the call."
  {k: 'YOUR APP', at: 8000, live: 12070},    // "your application"
  {k: 'MCP SERVER', at: 8400, live: 13890},  // "a server,"
  {k: 'SLACK API', at: 8800, live: 15510, logo: 'images/logos/slack.svg'}, // "calls Slack"
] as const;
const RETURN_AT = 16400;         // "the way your code always did" — the answer goes back

const STATION_H = 96;
const CHAIN_GAPY = gap('l');

const HopChain: React.FC<{field: string; reduced?: boolean}> = ({field, reduced = false}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  // REDUCED is the S5 restatement: the same device, two stations, no travel. The
  // callback is the argument — a socket in front of the thing, not instead of it.
  const list: Station[] = reduced
    ? [{k: 'MCP', at: 45900, live: 46980}, {k: 'YOUR API', at: 46300, live: 47610}]
    : STATIONS;
  const ret = !reduced ? decel(prog(frame, RETURN_AT, ENTER)) : 0;
  return (
    <>
      {list.map((s, i) => {
        const p = decel(prog(frame, s.at, ENTER));
        const top = PLATE_TOP + i * (STATION_H + CHAIN_GAPY);
        // The mark sits ON the station that is currently live: the last one whose
        // time has passed. One element moving down the column, never four.
        const live = list.reduce((n, x, j) => (frame >= f(x.live) ? j : n), -1);
        return (
          <div key={s.k} style={{position: 'absolute', left: VIZ_L, top,
            width: VIZ_W, height: STATION_H, opacity: p,
            transform: `translateY(${(1 - p) * TRAVEL}px)`,
            // TWO STATES, NO THIRD COLOUR. The inactive fill was `pal.wash`,
            // which composites to a grey on ink — a value that reads as a fourth
            // colour and as a default UI card. A station is either a keyline or a
            // solid plate; the field shows through otherwise.
            border: `2px solid ${live === i ? pal.text : pal.hair}`,
            background: live === i ? pal.text : 'transparent',
            display: 'flex', alignItems: 'center', paddingLeft: gap('m'),
            columnGap: gap('m')}}>
            <div style={{fontFamily: FONT_MONO, fontSize: UI.s,
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
            {/* A live station is a solid plate, so its type inverts to the field. */}
            <div style={{fontFamily: FONT, fontSize: ROLES.body.size,
              color: live === i ? (field === CREAM ? CREAM : INK) : pal.text}}>{s.k}</div>
          </div>
        );
      })}

      {/* THE RETURN. One rule down the left margin, drawn upward, for the answer
          going back. It is the half of the round trip everybody forgets, and it
          is why the model is at the top and not in the middle. */}
      {ret > 0 ? (
        // INSIDE THE SAFE BOX. This was `VIZ_L - gap('s')` = x134, sixteen pixels
        // outside SAFE.x0. Every gate passed it: safeZoneFurniture checks the
        // wordmark and footer only — its own comment says a block with no fontSize
        // is "a plate, a mask or a full-bleed container" and skips it. So a PLATE
        // can leave the safe zone and nothing in the canon can see it. A human
        // found this, not a gate. Logged as a hole in the canon, not just a bug.
        <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP, width: 3,
          height: (list.length - 1) * (STATION_H + CHAIN_GAPY) * ret,
          background: pal.accent}} />
      ) : null}

      {!reduced ? (
        <div style={{position: 'absolute', left: VIZ_L,
          top: PLATE_TOP + list.length * (STATION_H + CHAIN_GAPY) - CHAIN_GAPY + gap('m'),
          width: VIZ_W, fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug,
          color: pal.label, opacity: ret}}>
          THE MODEL NEVER MAKES THE CALL
        </div>
      ) : null}
    </>
  );
};

// ═══ THE DEPRECATION ═════════════════════════════════════════════════════════
// S4 — the beat the source reel does not have, and the reason this film is worth
// making. Sampling let a server obtain a model completion without its author ever
// touching a provider API. The protocol removed it and told implementers to call
// the API. facts.md#G6, verbatim from the spec's own deprecation note.
//
// THE STRUCK LINE IS THE PRIMITIVE, NOT A SENTENCE. Striking through prose would
// be an opinion about the prose; striking the primitive's own name is a record of
// what the spec did.
const DEPRECATED_AT = 35130;  // "Sampling"
const STRIKE_AT = 40890;      // "deprecates"
const ADVICE_AT = 43830;      // "call the API directly"

const DeprecationPlate: React.FC<{field: string}> = ({field}) => {
  const pal = onField(field);
  const frame = useCurrentFrame();
  const p = decel(prog(frame, DEPRECATED_AT, ENTER));
  const strike = clamp01((frame - f(STRIKE_AT)) / Math.max(1, f(740)));
  const advice = decel(prog(frame, ADVICE_AT, DETAIL));
  return (
    <>
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP, width: VIZ_W,
        opacity: p, transform: `translateY(${(1 - p) * TRAVEL}px)`}}>
        <div style={{height: 2, background: pal.hair}} />
        <div style={{padding: `${gap('m')}px 0`, position: 'relative'}}>
          <div style={{fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug,
            color: pal.label, marginBottom: gap('s')}}>
            CLIENT PRIMITIVE
          </div>
          <div style={{fontFamily: FONT, fontSize: ROLES.title.size, color: pal.text,
            position: 'relative', display: 'inline-block'}}>
            sampling
            {/* The rule is drawn LEFT TO RIGHT over the word, so the removal
                happens on screen rather than being a state the plate arrives in. */}
            <div style={{position: 'absolute', left: 0, top: '52%', height: 4,
              width: `${strike * 100}%`, background: pal.accent}} />
          </div>
          <div style={{fontFamily: FONT_MONO, fontSize: UI.s, color: pal.label,
            marginTop: gap('s')}}>
            deprecated · protocol 2026-07-28
          </div>
        </div>
        <div style={{height: 2, background: pal.hair}} />
      </div>

      {/* What the spec says to do instead. It is the film's thesis in the
          protocol's own words, so it takes the display face and not the mono. */}
      <div style={{position: 'absolute', left: VIZ_L, top: PLATE_TOP + 300, width: VIZ_W,
        opacity: advice, transform: `translateY(${(1 - advice) * TRAVEL}px)`}}>
        <div style={{fontFamily: FONT_UI, fontSize: UI.s, letterSpacing: TRACK.slug,
          color: pal.label, marginBottom: gap('s')}}>
          THE SPEC&rsquo;S OWN ADVICE
        </div>
        <div style={{fontFamily: FONT, fontSize: ROLES.body.size, color: pal.text,
          lineHeight: 1.14}}>
          integrate directly with<br />LLM provider APIs
        </div>
      </div>
    </>
  );
};

// ═══ THE REPO, AS A REAL CAPTURE ════════════════════════════════════════════
// CANON, founder 2026-08-17: a film that RECOMMENDS a repo must show a real
// capture of it, scrolling — never a drawn card.
//
// This was a drawn card until the founder ruled it. The rule writes down what
// three films already did without anyone recording it (NO. 028's superpowers repo,
// NO. 033's official repo, NO. 034's evaluation directory), and it is the same
// ruling NO. 034 arrived at the hard way: a film whose argument is "the evidence
// is published" was showing a PICTURE of the evidence instead of the evidence.
//
// It also resolves a contradiction the card created. At 53.69s the voice says
// "eighty-nine thousand stars" and the card said "89,623 stars" — two different
// numbers for the same quantity in the same frame. The capture carries GitHub's
// own count on GitHub's own page, so there is nothing left to disagree with.
//
// Captured with scripts/capture-url.mjs from github.com/modelcontextprotocol/servers
// on 2026-08-17 at 2160x6320 (2x DPR). Drawn at width 1080, so it presents as
// 1080x3160 — the same geometry as NO. 034's shot.
//
// FULL BLEED MEANS FULL BLEED: no wordmark and no type while it is up.
const SHOTS: {from: number; to: number; src: string}[] = [
  {from: 51680, to: 58700, src: 'screens/no035-mcp-servers-repo.png'},
];

const ShotPlate: React.FC<{shot: {from: number; to: number; src: string}}> = ({shot}) => {
  const frame = useCurrentFrame();
  const IMG_H = 3160;
  // Slow, LINEAR scroll. A drift that eases would read as a camera move; this is
  // a page being read. Travel is derived from the canon's reading speed times how
  // long the shot is up, clamped to the image — not a fraction tuned by eye. NO.
  // 034 had that fraction adjusted twice and it was still too fast both times,
  // because a percentage of an arbitrary image height is not a speed.
  const t = clamp01((frame - f(shot.from)) / Math.max(1, f(shot.to - shot.from)));
  const shotSec = (shot.to - shot.from) / 1000;
  const travel = Math.min(IMG_H - 1920, CAPTURE_SCROLL_PX_PER_SEC * shotSec);
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: INK}}>
      <Img src={staticFile(shot.src)}
        style={{position: 'absolute', left: 0, top: -travel * t, width: 1080}} />
    </AbsoluteFill>
  );
};

// ═══ THE OUTRO ═══════════════════════════════════════════════════════════════
// THE HOUSE OUTRO, deliberately the same film to film. The unit's trailing DOUBLE
// SPACE is load-bearing: rowDelta = amp*4/period = 260*4/13 = 80px must stay under
// the inter-word gap or adjacent rows shear. These are NO. 030's shipped numbers.
const OutroMarquee: React.FC<{field: string}> = () => (
  <ZigzagMarquee fromMs={58700} unit={'vektor  '} amp={260} period={13} rows={14}
    rowH={136} fontSize={150} dur={75} color={'rgba(244,239,223,0.13)'} />
);

// ═══ SEAMS ═══════════════════════════════════════════════════════════════════
// ONE COLOUR PER WIPE: all three MatteWipe panels take the INCOMING field colour,
// passed three times rather than by editing MatteWipe — that component is the
// single shared implementation every KT film renders.
//
// Each entry's field MUST equal the bg of the beat it lands on (check-kt's
// seamCarriesIncomingField, which caught NO. 033 wiping ink onto a red beat).
const FLIPS: {ms: number; field: string}[] = [
  {ms: 7290,  field: INK},       // a same-colour cut: a paragraph break, not a change
  {ms: 18160, field: RED_DEEP},
  {ms: 31480, field: CREAM},
  {ms: 45440, field: INK},
  {ms: 51680, field: CREAM},
  {ms: 58700, field: RED_DEEP},
];
const Seams: React.FC = () => (
  <>
    {FLIPS.map((w) => (
      <MatteWipe key={w.ms} atMs={w.ms} main={w.field} accent1={w.field} accent2={w.field} />
    ))}
  </>
);

// The type layer, the plates and the FURNITURE are all suppressed for the frames
// the panel train is on screen, so the wipe travels over a flat field and lands on
// a flat field. Measured lead/tail live in the canon, not here — a film reading its
// own copy of these is a film that can silently disagree with the gate.
const WIPE_LEAD = WIPE.leadFrames;
const WIPE_TAIL = WIPE.tailFrames;
const inWipe = (frame: number) =>
  FLIPS.some((w) => frame >= f(w.ms) - WIPE_LEAD && frame < f(w.ms) + WIPE_TAIL);

// THE WIPE RUNS ONE WAY. The field flips early, at the moment the first panel has
// covered the frame, so anything visible through a later gap between panels is the
// INCOMING colour rather than the outgoing one flashing back.
const WIPE_COVER = 8;
const wipeField = (frame: number): string | null => {
  const w = FLIPS.find((x) => frame >= f(x.ms) - WIPE_COVER && frame < f(x.ms));
  return w ? w.field : null;
};

// ═══ THE PLATES, AS DATA ═════════════════════════════════════════════════════
// One statement of when each visualisation is on screen, which the type anchor
// also reads — when the windows lived inline in the JSX the anchor had no way to
// consult them and left type stranded over empty frame.
//
// Readable time is 3s + 0.6s per word ON THE PLATE (canon READABLE, enforced by
// check-kt#readableTime). Counted below against each window.
const PLATES: {from: number; to: number; Node: React.FC<{field: string}>}[] = [
  {from: 140,   to: 7290,        Node: HookGrid},        //  7.2s  4 words  needs 5.4
  {from: 7290,  to: 18160,       Node: HopChain},        // 10.9s  6 words  needs 6.6
  {from: 18160, to: 31480,       Node: ArithmeticGrid},  // 13.3s  9 words  needs 8.4
  {from: 31480, to: 45440,       Node: DeprecationPlate},// 14.0s 10 words  needs 9.0
  {from: 45440, to: 51680,       Node: ReducedChain},    //  6.2s  3 words  needs 4.8
  {from: 58700, to: NO035_END_MS, Node: OutroMarquee},   //  6.7s  0 words  needs 3.0
];

// Declared after PLATES would be a temporal-dead-zone error at module scope, so
// the reduced chain gets its own named component rather than an inline arrow.
function ReducedChain({field}: {field: string}) {
  return <HopChain field={field} reduced />;
}

// ═══ THE MASCOT ══════════════════════════════════════════════════════════════
// Founder 2026-08-17: same as NO. 034 — hook, payoff, outro.
//
// WHICH BEATS IS A MEASUREMENT, NOT A PREFERENCE. check-type-fit reports the
// lowest graphic pixel per beat; the mascot may only stand where it clears that by
// at least gap('xl'). The sprite rig is 13 cells across and 8 down, so at size 160
// it is 160 wide and 98 TALL — reading the component rather than assuming its
// aspect is the difference between "one beat fits" and "four beats fit".
//
// The component is NEVER edited — NO. 026, 030, 031 and 034 render it and are
// locked artefacts. Everything here is props, and ClaudeMascot's own safe-zone
// warning is known-wrong and must not be obeyed (founder ruling, 2026-08-16).
const MASCOT = {size: 160, xPct: 46.7, yPct: 70.7} as const;
const MASCOTS: {from: number; until: number; look: {xPct: number; yPct: number}}[] = [
  {from: 140,   until: 7290,        look: {xPct: 50, yPct: 50}},  // the hook
  {from: 18160, until: 31480,       look: {xPct: 50, yPct: 52}},  // the payoff
  {from: 58700, until: NO035_END_MS, look: {xPct: 50, yPct: 44}}, // the outro
];

// ═══ COMPOSITION ═════════════════════════════════════════════════════════════
export type Layout = 'full' | 'two' | 'caption';

export const KTNo035: React.FC<{layer?: 'all' | 'type' | 'viz' | 'furniture'; stableLine?: boolean; mode?: Layout}> =
  ({layer = 'all', stableLine = true, mode = 'two'}) => {
  const frame = useCurrentFrame();
  // Every hook is called before any early return. A hook after an early return
  // passes every still and fails the video render with React error 310, and
  // `remotion render` exits 0 while printing it. The error number is written
  // without its hash on purpose: check-drift counts a hash followed by 3-8 hex
  // digits as a raw colour, and a React error code is all hex digits.
  const beat = NO035_BEATS.find((s) => frame >= f(s.from) && frame < f(s.to)) ??
    (frame >= f(NO035_BEATS[NO035_BEATS.length - 1].from)
      ? NO035_BEATS[NO035_BEATS.length - 1]
      : NO035_BEATS[0]);
  const wiping = inWipe(frame);
  const shot = SHOTS.find((sh) => frame >= f(sh.from) && frame < f(sh.to));
  const bg = asField(wipeField(frame) ?? beat.bg);

  // ONE ANCHOR PER BEAT. If this beat carries a plate at any point, its type sits
  // at the top for the entire beat. Asking every frame whether a plate is on
  // screen removed dead space and introduced something worse — the block JUMPING
  // from centre to top mid-beat. Motion draws the eye, so a jump costs more than
  // the empty space it saves. The dead space is solved at the other end instead:
  // the plates open WITH their beat.
  const beatHasPlate = PLATES.some((pl) => pl.from < beat.to && pl.to > beat.from);
  const topNow = beat.top && beatHasPlate;
  const furn = FOOTER_ON[bg] ?? LABEL_I;

  return (
    <AbsoluteFill style={{backgroundColor: bg, fontFamily: FONT}}>
      {/* THE VOICE, IN THE COMPOSITION. Studio has to play the take or GATE 2
          cannot check the one thing it is for: whether each visual lands on the
          word that says it. Reviewing sync in silence is not reviewing sync.
          Only on the composite; the layer renders the gates measure stay silent
          so nothing waits on audio decoding. */}
      {layer === 'all' ? (
        <Audio src={staticFile('audio/2026-08-17-mcp-not-apis-kt/vo-master.wav')} />
      ) : null}

      {layer !== 'type' && layer !== 'furniture' && !wiping && shot ? <ShotPlate shot={shot} /> : null}

      {layer !== 'type' && layer !== 'furniture' && !wiping && !shot ? (<>
        {PLATES.map((pl) => (
          <Window key={pl.from} fromMs={pl.from} toMs={pl.to}><pl.Node field={bg} /></Window>
        ))}
      </>) : null}

      {/* The mascot rides the VIZ layer so check-type-fit measures it as something
          the type must clear, and is suppressed on wipes exactly like a plate. It
          is deliberately NOT in PLATES: onePlateAtATime would read it as a second
          plate and fail every beat it stands on, and it is not a plate — it
          carries the brand, not the argument. */}
      {layer !== 'type' && layer !== 'furniture' && !wiping && !shot
        ? MASCOTS.filter((m) => frame >= f(m.from) && frame < f(m.until)).map((m) => (
          /* BLACK EYES, EVERY FIELD. The pupils are filled `var(--fg)` so eye
             colour is set from OUTSIDE by this wrapper — the shared rig is never
             touched. Field-aware eyes made the mascot look at you differently
             depending on the beat. */
          <AbsoluteFill key={m.from} style={{['--fg' as any]: INK}}>
            <ClaudeMascot frames={KT_NO035_FRAMES}
              config={{pose: 'walk', xPct: MASCOT.xPct, yPct: MASCOT.yPct,
                size: MASCOT.size, delay: f(m.from) + f(ENTER), bubble: false,
                lookAt: m.look}} />
          </AbsoluteFill>
        ))
        : null}

      {layer !== 'viz' && layer !== 'furniture' && !wiping && !shot ? (
      /* THE TYPE CENTRES IN THE BAND between the wordmark's baseline and the
         graphic — the founder's rule stated twice on NO. 034, and it is a rule
         rather than a position: a one-row beat and a three-row beat both sit
         centred in the same band, and no beat has anywhere to state a top.
         TEXT_ABOVE_PLATE_GAP is a FLOOR checked by the gate, not the positioner. */
      <AbsoluteFill style={{alignItems: 'center',
        ...(mode === 'caption' && topNow ? {fontSize: UI.m, opacity: 0.92} : {}),
        justifyContent: 'center',
        // `bottom: auto` because AbsoluteFill pins all four sides: with top,
        // bottom and height all set the browser drops one of them, and which one
        // is not a thing to leave to a resolution rule.
        ...(topNow ? {top: TYPE_BAND_TOP, height: TYPE_BAND_H, bottom: 'auto'} : {}),
        flexDirection: 'column', rowGap: gap('m'),
        padding: `0 ${MARGIN_X}px`,
        textAlign: 'center'}}>
        {(() => {
          // Only rows with a word already on screen count as "showing", so the cap
          // trims what is actually VISIBLE rather than what is declared.
          // FOUNDER 2026-08-17: 'two'. This film's graphics are diagrams rather
          // than single numbers and need more looking-at time than NO. 034's
          // odometers did, so a third less text is on screen at any instant.
          const live = beat.rows.filter((r) => r.words.some((w) => frame >= f(w.ms)));
          const keep = mode === 'caption' ? 1 : mode === 'two' ? 2 : 3;
          const shown = live.slice(-keep);
          return beat.rows.filter((r) => shown.includes(r));
        })().map((row, ri) => (
          <div key={`${beat.from}-${ri}`} style={{lineHeight: 1.14}}>
            {row.words.map((w, wi) => {
              const gone = w.out !== undefined && frame >= f(w.out);
              if (!stableLine) return <Word key={wi} w={w} base={row.size} baseColor={beat.type} />;
              if (gone) return null;
              return (
                <span key={wi} style={{position: 'relative', display: 'inline-block'}}>
                  {lineWidthSpacer(w, row.size)}
                  <span style={{position: 'absolute', left: 0, top: 0}}>
                    <Word w={w} base={row.size} baseColor={beat.type} />
                  </span>
                </span>
              );
            })}
          </div>
        ))}
      </AbsoluteFill>
      ) : null}

      {layer === 'all' ? <Seams /> : null}

      {/* FURNITURE IS PART OF THE CLEAN SHEET: `!wiping` applies to the furniture
          LAYER too, not just the composite, or the gate reading it measures a
          frame the viewer never sees.
          NO FOOTER (founder, 2026-08-16, carried forward): it repeated the
          wordmark, pre-announced the CTA the outro delivers properly, and sat
          inside the band the plates need. The wordmark stays. */}
      {(layer === 'all' || layer === 'furniture') && !wiping && !shot ? (
        <div style={{position: 'absolute', top: WORDMARK.y, left: MARGIN_X,
          fontSize: UI.l, fontWeight: ROLES.wordmark.weight,
          letterSpacing: '-0.045em', color: WORDMARK_ON[bg] ?? CREAM,
          fontFamily: FONT_UI}}>vektor</div>
      ) : null}
    </AbsoluteFill>
  );
};
