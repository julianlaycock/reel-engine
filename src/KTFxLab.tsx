// KTFxLab — the proving ground for every SHARED device the KT format has.
//
// FOUNDER, 2026-08-17, two rulings that together define this file:
//
//   "the range — the same thing at its settings"
//   "a gate — nothing enters the canon unseen"
//
// So this is not a gallery. It is the screen an effect has to appear on before a
// film may import it, and each segment shows what the device can be TOLD to do,
// not one pretty instance of it. A card answering "what can this do" is worth more
// than one answering "what did this look like once".
//
// ── WHY IT EXISTS AT ALL ─────────────────────────────────────────────────────
//
// The fx catalog counted 85 devices in this format and found THIRTEEN reusable.
// The other seventy-two are sealed inside the one film that needed them. Nobody
// had counted that, because there was nowhere that showed the shared set as a set
// — and a shared module nobody can see the contents of gets reinvented instead of
// imported, which is how NO. 034 grew five plate heights and eight arbitrary gaps.
//
// ── ITS SHAPE COMES FROM THE CAVALRY CATALOG ─────────────────────────────────
//
// The founder asked for this to mirror .worktrees/cavalry-library/docs/CATALOG.html.
// The instructive thing about that page is what it does NOT do: 35 cards, only 12
// demos. A demo was the badge of the top tier, not a box every card had to tick.
// Same here — a segment in this file is what promotes a device to approved, and a
// device without one is not broken, it is unproven.
//
// ── SEGMENTS ARE FIXED-LENGTH AND ORDERED ────────────────────────────────────
//
// SEG frames each, in SEGMENTS order. scripts/fx-demos.mjs cuts one clip per
// device from a single render of this composition using those offsets, so the
// order here IS the contract. Insert in the middle and every clip after it is
// wrong — append, and re-cut.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {INK, CREAM, RED, f} from './KTHook';
import {MatteWipe, ZigzagMarquee} from './KTSeams';
import {Odometer, PumpRect, ContainerBreach} from './KTEffects';
import {Stage, T, Stack, Row, Plate, Rule, Wash, Enter} from './kt/blocks';
import {FIELD, ROLES, LADDER, MARGIN_X, COLUMN_W, PLATE_TOP, SAFE, CANVAS,
  ENTER_MS, DETAIL_MS, WASH_ON, TEXT_ON, FAMILY} from './kt/system';
import './style.css';

const FPS = CANVAS.fps;
const SEG_SEC = 5;
export const SEG = SEG_SEC * FPS;

// A segment is authored against a LOCAL clock — it always starts at 0 — so a
// device's demo does not have to know where in the strip it sits. Without this,
// reordering the list would silently break every timing after the change.
const Local: React.FC<{index: number; children: React.ReactNode}> = ({index, children}) => {
  const frame = useCurrentFrame();
  const start = index * SEG;
  if (frame < start || frame >= start + SEG) return null;
  return <RebasedClock offset={start}>{children}</RebasedClock>;
};

// Remotion has no "shift the clock" primitive, so the shift is done by rendering
// children inside a context the effects already read: useCurrentFrame. The
// simplest honest version is to pass the local frame down and let each demo use
// ms-based props relative to it — every shared effect takes `fromMs`/`atMs`, so
// the segment states its timings in local ms and this adds the offset.
const OffsetCtx = React.createContext(0);
const RebasedClock: React.FC<{offset: number; children: React.ReactNode}> = ({offset, children}) => (
  <OffsetCtx.Provider value={offset}>{children}</OffsetCtx.Provider>
);
/** local ms -> absolute ms, for an effect that takes a timestamp prop. */
const useAt = () => {
  const offset = React.useContext(OffsetCtx);
  return (localMs: number) => localMs + (offset / FPS) * 1000;
};

const Caption: React.FC<{name: string; note: string; on?: 'ink' | 'cream' | 'redDeep'}> =
  ({name, note, on = 'ink'}) => (
    <div style={{position: 'absolute', left: MARGIN_X, bottom: 150, width: COLUMN_W}}>
      <div style={{fontFamily: FAMILY.ui, fontSize: 40, letterSpacing: 3,
        textTransform: 'uppercase', color: on === 'cream' ? FIELD.ink : CREAM}}>{name}</div>
      <div style={{fontFamily: FAMILY.ui, fontSize: 28, marginTop: 10,
        color: on === 'cream' ? 'rgba(16,16,16,0.62)' : 'rgba(244,239,223,0.55)'}}>{note}</div>
    </div>
  );

// ── the segments ─────────────────────────────────────────────────────────────
// Each shows the RANGE: the same device at the settings a film can give it.

const DemoMatteWipe: React.FC = () => {
  const at = useAt();
  // Every field it can arrive on, in turn — the seam is the one device whose look
  // is entirely decided by the field it carries in.
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <MatteWipe atMs={at(900)} accent1={RED} accent2={CREAM} main={CREAM} />
      <MatteWipe atMs={at(2400)} accent1={CREAM} accent2={RED} main={RED} />
      <MatteWipe atMs={at(3900)} accent1={RED} accent2={CREAM} main={INK} />
      <Caption name="matte-wipe" note="the seam, arriving on cream, then red, then ink" />
    </AbsoluteFill>
  );
};

const DemoZigzag: React.FC = () => {
  const at = useAt();
  return (
    <AbsoluteFill style={{backgroundColor: RED}}>
      <ZigzagMarquee fromMs={at(0)} unit="VEKTOR  " color={CREAM} />
      <Caption name="zigzag-marquee" note="the outro marquee — unit must end in two spaces" />
    </AbsoluteFill>
  );
};

const DemoOdometer: React.FC = () => {
  const at = useAt();
  // A small count and a large one, because the device's whole job is making a
  // number move and the two read completely differently.
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <div style={{position: 'absolute', left: MARGIN_X, top: PLATE_TOP}}>
        <Odometer values={['8.3', '7.1', '6.2', '5.3']} fromMs={at(300)} tickMs={260}
          style={{fontFamily: FAMILY.display, fontSize: 134, color: CREAM}} />
      </div>
      <div style={{position: 'absolute', left: MARGIN_X, top: PLATE_TOP + 220}}>
        <Odometer values={['73,373', '61,004', '52,110', '44,449']} fromMs={at(1600)} tickMs={260}
          style={{fontFamily: FAMILY.display, fontSize: 86, color: RED}} />
      </div>
      <Caption name="odometer" note="a small number and a large one, same device" />
    </AbsoluteFill>
  );
};

const DemoPumpRect: React.FC = () => {
  const at = useAt();
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <PumpRect fromMs={at(400)} x={MARGIN_X} y={PLATE_TOP} w={COLUMN_W} h={120} color={CREAM} />
      <PumpRect fromMs={at(2200)} x={MARGIN_X} y={PLATE_TOP + 200} w={COLUMN_W} h={120} color={RED}
        pumps={4} ampY={1.5} />
      <Caption name="pump-rect" note="default beat, then four pumps at a higher amplitude" />
    </AbsoluteFill>
  );
};

const DemoContainerBreach: React.FC = () => {
  const at = useAt();
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <ContainerBreach fromMs={at(200)} surplusFromMs={at(2400)}
        x={MARGIN_X} y={PLATE_TOP} w={COLUMN_W} h={300}
        capacity={48} arriving={72} cols={12}
        dotR={9} gap={14} color={CREAM} accent={RED}
        boundL={SAFE.x0} boundR={SAFE.x1} />
      <Caption name="container-breach" note="48 fit, 72 arrive — the surplus is the point" />
    </AbsoluteFill>
  );
};

const DemoEnter: React.FC = () => {
  // `Enter` takes SECONDS and reads the global clock, unlike every other shared
  // effect, which takes ms. Authored naively its arrivals would all have fired
  // twenty-five seconds before this segment appears, and the demo would render as
  // four lines already on screen — a segment that looks fine and shows nothing.
  const offSec = React.useContext(OffsetCtx) / FPS;
  const s = (local: number) => offSec + local;
  return (
    // The one block that moves. Both speeds together, because the difference
    // between a plate arriving and a detail landing inside one is the whole
    // distinction the canon draws.
    <Stage field="ink">
      <Plate>
        <Stack gap="l">
          <Enter at={s(0.4)}><T role="title">PLATE ARRIVES</T></Enter>
          <Enter at={s(1.6)} detail><T role="body">detail lands</T></Enter>
          <Enter at={s(2.8)}><T role="title">AGAIN</T></Enter>
          <Enter at={s(3.6)} detail><T role="body">and again</T></Enter>
        </Stack>
      </Plate>
      <Caption name="enter" note={`the only arrival: ${ENTER_MS}ms, or ${DETAIL_MS}ms for a detail`} />
    </Stage>
  );
};

// ── the static blocks: specimens, not loops ──────────────────────────────────
// Seven of the thirteen do not move. A four-second loop of a line sitting still
// is a still image encoded as a video, and putting six real demos beside seven
// of those is how a page stops being believed. Each is drawn as a SPECIMEN — the
// device at every setting it has — and the catalog stills them.

const DemoStage: React.FC = () => (
  <AbsoluteFill style={{flexDirection: 'row'}}>
    {(['ink', 'cream', 'redDeep'] as const).map((fld) => (
      <div key={fld} style={{flex: 1, background: FIELD[fld], position: 'relative',
        borderRight: '1px solid rgba(244,239,223,0.25)'}}>
        <div style={{position: 'absolute', left: 24, top: PLATE_TOP,
          fontFamily: FAMILY.ui, fontSize: 22, letterSpacing: 2,
          color: fld === 'cream' ? FIELD.ink : CREAM}}>{fld}</div>
      </div>
    ))}
    <Caption name="stage" note="the three fields — a film picks one per beat, never a colour" />
  </AbsoluteFill>
);

const DemoT: React.FC = () => (
  <Stage field="ink">
    <Plate>
      <Stack gap="s">
        {(Object.keys(ROLES) as (keyof typeof ROLES)[]).map((role) => (
          <div key={role} style={{display: 'flex', alignItems: 'baseline', gap: 24}}>
            <div style={{fontFamily: FAMILY.mono, fontSize: 18,
              color: 'rgba(244,239,223,0.5)', width: 150}}>{role} {ROLES[role].size}</div>
            <T role={role}>Vektor</T>
          </div>
        ))}
      </Stack>
    </Plate>
    <Caption name="t" note="every role there is — a film asks for a role, never a size" />
  </Stage>
);

const DemoStack: React.FC = () => (
  <Stage field="ink">
    <Plate>
      <Stack gap="s">
        {LADDER.map((g, i) => (
          <div key={g} style={{display: 'flex', alignItems: 'center', gap: 20}}>
            <div style={{fontFamily: FAMILY.mono, fontSize: 18,
              color: 'rgba(244,239,223,0.5)', width: 90}}>
              {['xs', 's', 'm', 'l', 'xl', 'xxl'][i]} {g}
            </div>
            <div style={{width: g * 4, height: 14, background: CREAM}} />
          </div>
        ))}
      </Stack>
    </Plate>
    <Caption name="stack" note="the whole gap ladder — gaps come off it or they do not exist" />
  </Stage>
);

const DemoRow: React.FC = () => (
  <Stage field="ink">
    <Plate>
      <Stack gap="l">
        <Row gap="m"><T role="body">LEFT</T><T role="body">RIGHT</T></Row>
        <Rule weight="hair" />
        <Row gap="m" justify="center"><T role="body">CENTRED</T></Row>
        <Rule weight="hair" />
        <Row gap="m" justify="flex-start"><T role="body">A</T><T role="body">B</T><T role="body">C</T></Row>
      </Stack>
    </Plate>
    <Caption name="row" note="space-between, centre, flex-start" />
  </Stage>
);

const DemoPlate: React.FC = () => (
  <Stage field="ink">
    <div style={{position: 'absolute', left: SAFE.x0, top: SAFE.y0,
      width: SAFE.x1 - SAFE.x0, height: SAFE.y1 - SAFE.y0,
      border: `2px dashed ${RED}`, opacity: 0.5}} />
    <div style={{position: 'absolute', left: MARGIN_X, top: PLATE_TOP, width: COLUMN_W,
      height: SAFE.y1 - PLATE_TOP, background: 'rgba(244,239,223,0.14)',
      border: `1px solid ${CREAM}`}} />
    <div style={{position: 'absolute', left: MARGIN_X, top: PLATE_TOP - 44,
      fontFamily: FAMILY.mono, fontSize: 22, color: RED}}>
      {`x${MARGIN_X}  y${PLATE_TOP}  w${COLUMN_W}`}
    </div>
    <Caption name="plate" note="one origin, one width, every film — there is no top prop" />
  </Stage>
);

const DemoRule: React.FC = () => (
  <Stage field="ink">
    <Plate>
      <Stack gap="l">
        {/* THREE HAIRLINES ON A 1920px FRAME IS 0.4% INK — the poster picker
            measured it and warned, correctly. The lines are the subject and they
            cannot be thicker without lying about their weight, so the LABELS
            carry the frame: each weight named at title size with its pixel value,
            which is also the thing you actually need to know when choosing one. */}
        {([['heavy', '3px'], ['rule', '2px'], ['hair', '1px']] as const).map(([w, px]) => (
          <div key={w}>
            <Row gap="m"><T role="title">{w.toUpperCase()}</T><T role="slug">{px}</T></Row>
            <div style={{height: 18}} />
            <Rule weight={w} />
          </div>
        ))}
      </Stack>
    </Plate>
    <Caption name="rule" note="the three weights" />
  </Stage>
);

const DemoWash: React.FC = () => (
  // `Stage` IS AN AbsoluteFill. Nesting one inside each of three flex columns made
  // every Stage cover the entire frame, so the last field painted over the other
  // two and the specimen showed ONE panel while claiming to show three — a demo
  // that looked successful and demonstrated nothing, which is worse than a blank
  // one. The columns paint their own field and the Stage provides context only.
  <AbsoluteFill style={{flexDirection: 'row'}}>
    {(['ink', 'cream', 'redDeep'] as const).map((fld) => (
      <div key={fld} style={{flex: 1, background: FIELD[fld], position: 'relative',
        borderRight: `1px solid rgba(244,239,223,0.25)`}}>
        <div style={{position: 'absolute', left: 24, right: 24, top: PLATE_TOP}}>
          <div style={{background: WASH_ON[fld], padding: 20}}>
            <div style={{fontFamily: FAMILY.ui, fontSize: 22, letterSpacing: 2,
              color: TEXT_ON[fld]}}>WASH ON {fld.toUpperCase()}</div>
          </div>
        </div>
      </div>
    ))}
    <Caption name="wash" note="the fill takes its value from the field beneath it" />
  </AbsoluteFill>
);

// THE ORDER IS THE CONTRACT — scripts/fx-demos.mjs cuts by index. Append only.
export const SEGMENTS: {slug: string; moves: boolean; Node: React.FC}[] = [
  {slug: 'matte-wipe', moves: true, Node: DemoMatteWipe},
  {slug: 'zigzag-marquee', moves: true, Node: DemoZigzag},
  {slug: 'odometer', moves: true, Node: DemoOdometer},
  {slug: 'pump-rect', moves: true, Node: DemoPumpRect},
  {slug: 'container-breach', moves: true, Node: DemoContainerBreach},
  {slug: 'enter', moves: true, Node: DemoEnter},
  {slug: 'stage', moves: false, Node: DemoStage},
  {slug: 't', moves: false, Node: DemoT},
  {slug: 'stack', moves: false, Node: DemoStack},
  {slug: 'row', moves: false, Node: DemoRow},
  {slug: 'plate', moves: false, Node: DemoPlate},
  {slug: 'rule', moves: false, Node: DemoRule},
  {slug: 'wash', moves: false, Node: DemoWash},
];

export const KT_FX_LAB_FRAMES = SEGMENTS.length * SEG;

export const KTFxLab: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: INK}}>
    {SEGMENTS.map((s, i) => (
      <Local key={s.slug} index={i}><s.Node /></Local>
    ))}
  </AbsoluteFill>
);
