import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {DoctrineProps, SectionKind} from './doctrine-schema';
import {computeLayout} from './doctrine-layout';
import {computeMorphColors} from './doctrine-color';
import {DoctrineChrome} from './scenes/doctrine/DoctrineChrome';
import {Grain, Vignette} from './scenes/doctrine/Finishing';
import {QuestionScene} from './scenes/doctrine/QuestionScene';
import {PhrasesScene} from './scenes/doctrine/PhrasesScene';
import {LedgerScene} from './scenes/doctrine/LedgerScene';
import {FieldGridScene} from './scenes/doctrine/FieldGridScene';
import {TimelineScene} from './scenes/doctrine/TimelineScene';
import {StandardHeroScene} from './scenes/doctrine/StandardHeroScene';
import {ClosingScene} from './scenes/doctrine/ClosingScene';
import type {SceneProps} from './scenes/doctrine/types';

const FF = "'Inter Tight','Helvetica Neue',Arial,sans-serif";

const SCENE_BY_KIND: Record<SectionKind, React.FC<SceneProps>> = {
  question: QuestionScene,
  phrases: PhrasesScene,
  ledger: LedgerScene,
  fieldgrid: FieldGridScene,
  timeline: TimelineScene,
  'standard-hero': StandardHeroScene,
  closing: ClosingScene,
};

// Single continuous timeline (NO <Series>): all sections + persistent chrome are
// absolutely positioned on one morphing canvas, so the palette color-morph runs
// across the ~8-frame scene seams (the color change IS the transition).
export const Doctrine: React.FC<DoctrineProps> = ({brief}) => {
  const frame = useCurrentFrame();
  const layout = computeLayout(brief);
  const colors = computeMorphColors(frame, brief, layout);
  return (
    <AbsoluteFill style={{background: colors.cbg, overflow: 'hidden', fontFamily: FF}}>
      <DoctrineChrome brief={brief} colors={colors} frame={frame} />
      {brief.sections.map((section, i) => {
        const Comp = SCENE_BY_KIND[section.kind];
        const win = layout.windows[i];
        if (!Comp || !win) return null;
        return <Comp key={i} frame={frame} win={win} colors={colors} section={section} brief={brief} />;
      })}
      {brief.grain !== false ? <Grain frame={frame} /> : null}
      <Vignette />
    </AbsoluteFill>
  );
};
