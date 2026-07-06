// Brief types for the Doctrine composition — conforms to pipeline/brief.schema.json.
// One brief == one video. defaultBrief mirrors example.caelith-provable-doctrine.json.
import type {PaletteName} from './palettes';

export type HeroTreatment = 'shimmer' | 'aperture' | 'flat';
export type SectionKind =
  | 'question'
  | 'phrases'
  | 'ledger'
  | 'fieldgrid'
  | 'timeline'
  | 'standard-hero'
  | 'closing';

export type LedgerRow = {i: string; label: string; meta: string; prevHash: string; hash: string; seal: boolean};
export type FieldGridDef = {cols: number; rows: number; total: number; flags: number[]};
export type TimelineEvent = {date: string; label: string; seal?: boolean};

export type SectionCopy = {lines?: string[]; sub?: string; caption?: string; hero?: string};
export type SectionViz = {rows?: LedgerRow[]; grid?: FieldGridDef; events?: TimelineEvent[]};

export type Section = {
  kind: SectionKind;
  eyebrow: string;
  copy?: SectionCopy;
  viz?: SectionViz;
  holdSeconds?: number;
  vo?: string; // narration this section covers (DoctrineFilm: drives retime by word count)
  durationInFrames?: number; // DoctrineFilm: per-section length (set by retime)
};

export type Brief = {
  slug: string;
  title?: string;
  series: string;
  palette: PaletteName;
  heroTreatment?: HeroTreatment;
  grain?: boolean;
  fps?: number;
  totalFrames?: number;
  voice?: string | null;
  darkBeats?: number[];
  chrome?: {word?: string; footL?: string; footR?: string}; // chrome wordmark + footers (default caelith)
  audio?: {voSrc?: string; voVolume?: number; musicSrc?: string; musicVolume?: number}; // DoctrineFilm narration
  sections: Section[];
};

export type DoctrineProps = {brief: Brief};

export const defaultBrief: Brief = {
  slug: 'caelith-provable-doctrine',
  title: 'The Provability Doctrine',
  series: 'provability · doctrine',
  palette: 'london',
  heroTreatment: 'shimmer',
  grain: true,
  fps: 30,
  totalFrames: 720,
  voice: null,
  darkBeats: [3],
  chrome: {word: 'caelith', footL: 'caelith.tech', footR: 'annex iv'},
  sections: [
    {
      kind: 'question',
      eyebrow: '§ 01 — the question that comes back',
      copy: {
        lines: ['“show me how you', 'got that number.”'],
        sub: 'the question you answer eighteen months after you file.',
      },
      holdSeconds: 1.4,
    },
    {
      kind: 'phrases',
      eyebrow: '§ 02 — what we record',
      copy: {
        lines: ['every figure,', 'every rule,', 'every field —'],
        caption: 'recorded — to the proof chain',
      },
      holdSeconds: 1.0,
    },
    {
      kind: 'ledger',
      eyebrow: '§ 03 — the proof chain',
      copy: {caption: 'every figure carries its own evidence — *tamper-detectable*, down to the field.'},
      viz: {
        rows: [
          {i: '01', label: 'source data', meta: 'custodian feed · 12:04:07 UTC', prevHash: '', hash: 'a3f8…9c21', seal: false},
          {i: '02', label: 'valuation rule', meta: 'Annex IV · applied', prevHash: '‹ a3f8…', hash: '7b1c…4e02', seal: false},
          {i: '03', label: 'the reported figure', meta: 'derived · verified', prevHash: '‹ 7b1c…', hash: 'c5d9…8a11', seal: false},
          {i: '04', label: '◈ sealed record', meta: 'tamper-detectable', prevHash: '‹ c5d9…', hash: 'e0f2…d7c4', seal: true},
        ],
      },
      holdSeconds: 1.2,
    },
    {
      kind: 'standard-hero',
      eyebrow: '§ 04 — the standard',
      copy: {lines: ['everything,'], hero: 'provable.'},
      holdSeconds: 1.6,
    },
    {
      kind: 'closing',
      eyebrow: '',
      copy: {sub: 'provable by design · annex iv'},
      holdSeconds: 2.0,
    },
  ],
};
