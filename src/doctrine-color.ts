// The color-morph controller. `dm` (dark-beat blend, 0=light 1=dark) is computed
// per frame from the dark-beat windows; every foreground color and the canvas bg
// is hexLerp(light, dark, dm). The color change IS the transition — scenes never
// cross-dissolve; the ~8-frame seam shows only chrome over the morphing canvas.
import {hexLerp, resolvePalette, PANEL_LIGHT, PANEL_DARK} from './palettes';
import {interp, easeInOut} from './motion';
import type {Brief} from './doctrine-schema';
import type {DoctrineLayout} from './doctrine-layout';

export type MorphColors = {
  dm: number;
  cfg: string;
  cac: string;
  cmu: string;
  chr: string;
  cbg: string;
  cshB: string;
  panelBg: string;
};

export const computeDm = (frame: number, layout: DoctrineLayout): number => {
  let dm = 0;
  for (const w of layout.darkWindows) {
    const up = interp(frame, [w.inStart, w.inEnd], [0, 1], easeInOut);
    const down = interp(frame, [w.outStart, w.outEnd], [1, 0], easeInOut);
    dm = Math.max(dm, Math.min(up, down));
  }
  return dm;
};

export const computeMorphColors = (frame: number, brief: Brief, layout: DoctrineLayout): MorphColors => {
  const {light: L, dark: D} = resolvePalette(brief.palette);
  const dm = computeDm(frame, layout);
  return {
    dm,
    cfg: hexLerp(L.fg, D.fg, dm),
    cac: hexLerp(L.accent, D.accent, dm),
    cmu: hexLerp(L.muted, D.muted, dm),
    chr: hexLerp(L.hairline, D.hairline, dm),
    cbg: hexLerp(L.bg, D.bg, dm),
    cshB: hexLerp(L.shimB, D.shimB, dm),
    panelBg: hexLerp(PANEL_LIGHT, PANEL_DARK, dm),
  };
};
