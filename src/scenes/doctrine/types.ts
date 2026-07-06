import type {Section, Brief} from '../../doctrine-schema';
import type {SceneWindow} from '../../doctrine-layout';
import type {MorphColors} from '../../doctrine-color';

// Common props every doctrine scene receives from the Doctrine orchestrator.
export type SceneProps = {
  frame: number;
  win: SceneWindow;
  colors: MorphColors;
  section: Section;
  brief: Brief;
};
