// Per-section frame windows for the Doctrine composition. The design reference
// hardcodes these windows for the canonical 5-beat structure (question, phrases,
// viz, standard-hero, closing); we reproduce them EXACTLY (indexed by position)
// so the port matches the reference frame-for-frame. Dark-beat windows for the
// color-morph are derived from each dark section's opacity window.
import type {Brief} from './doctrine-schema';

export type SceneWindow = {
  opIn: [number, number];
  opOut: [number, number] | null; // null = hold to end (closing)
  cam: [number, number]; // frame range over which the camera push runs
  camScale: [number, number]; // from → to
  camOrigin: string;
  rise: [number, number]; // entrance translateY frame range
  riseFrom: number; // px
};

export type DarkWindow = {inStart: number; inEnd: number; outStart: number; outEnd: number};
export type DoctrineLayout = {windows: SceneWindow[]; darkWindows: DarkWindow[]; total: number};

// Canonical reference windows (Provability Doctrine), section index 0..4.
const CANON: SceneWindow[] = [
  {opIn: [6, 26], opOut: [150, 164], cam: [6, 175], camScale: [1, 1.03], camOrigin: '50% 42%', rise: [6, 26], riseFrom: 18},
  {opIn: [172, 192], opOut: [300, 314], cam: [172, 314], camScale: [1, 1.03], camOrigin: '50% 42%', rise: [172, 192], riseFrom: 18},
  {opIn: [322, 342], opOut: [438, 452], cam: [322, 452], camScale: [1, 1.025], camOrigin: '50% 42%', rise: [322, 342], riseFrom: 18},
  {opIn: [460, 480], opOut: [616, 632], cam: [460, 632], camScale: [1, 1.03], camOrigin: '50% 50%', rise: [460, 480], riseFrom: 18},
  {opIn: [638, 660], opOut: null, cam: [638, 720], camScale: [1, 1.02], camOrigin: '50% 50%', rise: [638, 660], riseFrom: 18},
];

export const computeLayout = (brief: Brief): DoctrineLayout => {
  const n = brief.sections.length;
  const windows: SceneWindow[] = [];
  for (let i = 0; i < n; i++) windows.push(CANON[Math.min(i, CANON.length - 1)]);

  const darkWindows: DarkWindow[] = (brief.darkBeats ?? []).map((idx) => {
    const w = windows[idx] ?? CANON[3];
    const [i0, i1] = w.opIn;
    const o1 = (w.opOut ?? [w.opIn[1], w.opIn[1]])[1];
    // reproduces the reference S4 dm windows exactly: 448/480 in, 624/644 out.
    return {inStart: i0 - 12, inEnd: i1, outStart: o1 - 8, outEnd: o1 + 12};
  });

  const total = brief.totalFrames ?? 720;
  return {windows, darkWindows, total};
};

export const briefTotalFrames = (brief: Brief): number => brief.totalFrames ?? computeLayout(brief).total;

// ── DoctrineFilm (narrated) layout ──
// Sequential windows sized to each section's VO duration (set by retime). Scenes
// are back-to-back; the color-morph + chrome carry the beat handoffs. Internal
// scene animations anchor to each window's start (s0), then hold for the rest.
const kindCam = (kind: string): number => {
  if (kind === 'closing') return 1.02;
  if (kind === 'ledger' || kind === 'fieldgrid' || kind === 'timeline') return 1.025;
  return 1.03;
};

export const computeFilmLayout = (brief: Brief): DoctrineLayout => {
  const windows: SceneWindow[] = [];
  let cursor = 0;
  const n = brief.sections.length;
  brief.sections.forEach((s, i) => {
    const dur = s.durationInFrames ?? 150;
    const start = cursor;
    const end = start + dur;
    const lead = i === 0 ? 4 : 0;
    const IN = 18;
    const OUT = 16;
    const isLast = i === n - 1;
    const origin = s.kind === 'standard-hero' || s.kind === 'closing' ? '50% 50%' : '50% 42%';
    windows.push({
      opIn: [start + lead, start + lead + IN],
      opOut: isLast ? null : [end - OUT, end], // last section holds
      cam: [start, end],
      camScale: [1, kindCam(s.kind)],
      camOrigin: origin,
      rise: [start + lead, start + lead + IN],
      riseFrom: 18,
    });
    cursor = end;
  });

  const darkWindows: DarkWindow[] = (brief.darkBeats ?? []).map((idx) => {
    const w = windows[idx] ?? windows[0];
    const [i0, i1] = w.opIn;
    const o1 = (w.opOut ?? [w.opIn[1], w.opIn[1]])[1];
    return {inStart: i0 - 12, inEnd: i1, outStart: o1 - 8, outEnd: o1 + 12};
  });

  return {windows, darkWindows, total: cursor};
};

export const filmTotalFrames = (brief: Brief): number => computeFilmLayout(brief).total;
