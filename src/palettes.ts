// Single palette source of truth — ported VERBATIM from the design reference
// (pipeline/reference/*.reference.html `this.PAL`). Four palettes, each with a
// light + dark variant; the color-morph transition lerps light→dark via `dm`.
// Duotone palettes (dallas/london/miami): fg === accent (monochrome ink); muted
// is a warm/cool neutral. teal is the only fg ≠ accent palette.

export type PaletteName = 'teal' | 'dallas' | 'miami' | 'london';

export type Tokens = {
  bg: string;
  fg: string;
  accent: string;
  muted: string;
  hairline: string;
  shimB: string; // shimmer highlight (hero gradient stop)
};

export type Palette = {light: Tokens; dark: Tokens};

export const PALETTES: Record<PaletteName, Palette> = {
  teal: {
    light: {bg: '#ECEEEA', fg: '#15191A', accent: '#0F5C5C', muted: '#46494A', hairline: '#D6D9D3', shimB: '#BFE0D8'},
    dark: {bg: '#0F1314', fg: '#ECEEEA', accent: '#5FB5A3', muted: '#8A9290', hairline: '#2A2F30', shimB: '#D8EFE9'},
  },
  dallas: {
    light: {bg: '#E7E0D0', fg: '#B0392C', accent: '#B0392C', muted: '#9A8B73', hairline: '#D3C9B5', shimB: '#E6A58F'},
    dark: {bg: '#1B1512', fg: '#ECE3D3', accent: '#DB5B3C', muted: '#9A8F81', hairline: '#332B24', shimB: '#F0C9B6'},
  },
  miami: {
    light: {bg: '#C6E6DF', fg: '#6E77E8', accent: '#6E77E8', muted: '#5E9A90', hairline: '#A9D2CA', shimB: '#C2C7F6'},
    dark: {bg: '#0E1C1A', fg: '#DFE3FF', accent: '#8F96F0', muted: '#6F938C', hairline: '#213330', shimB: '#D4D7FB'},
  },
  london: {
    light: {bg: '#E7E0D0', fg: '#2E3A6B', accent: '#2E3A6B', muted: '#8A8571', hairline: '#D3C9B5', shimB: '#9AA4D0'},
    dark: {bg: '#0F1220', fg: '#E7E0D0', accent: '#5B68A8', muted: '#8388A5', hairline: '#242A42', shimB: '#C3C9EA'},
  },
};

// Ledger / panel fills are NOT palette-driven — they lerp white→near-black by dm.
export const PANEL_LIGHT = '#FFFFFF';
export const PANEL_DARK = '#161C1D';

// hexLerp moved to ./color.ts (pure utility); re-exported here so the doctrine
// consumers keep working until this file is deleted (canon-resolver step 7).
export {hexLerp} from './color';

// Unknown key falls back to dallas (matches reference `this.PAL[name] || this.PAL.dallas`).
export const resolvePalette = (name?: string): Palette => PALETTES[name as PaletteName] ?? PALETTES.dallas;
