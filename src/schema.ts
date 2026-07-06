export type CardType = 'stat' | 'statement' | 'flow' | 'result';

export type CardJson = {
  type: CardType;
  kicker: string;
  kickerRight: string;
  lines?: string[];
  accentWords?: string[];
  nodes?: string[];
  tagline?: string;
  sub?: string;
  durationInFrames: number;
  footerRight: string;
};

export type CardProps = {
  card: CardJson;
};

export const defaultCard: CardJson = {
  type: 'flow',
  kicker: 'the build',
  kickerRight: 'workflow OS',
  nodes: ['01  INPUT', '02  CLASSIFY', '03  ROUTE', '04  FLAG'],
  accentWords: ['owner'],
  tagline: 'every step gets an {owner}. then automate.',
  durationInFrames: 810,
  footerRight: 'module · workflow',
};
