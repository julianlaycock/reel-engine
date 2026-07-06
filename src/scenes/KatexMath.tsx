import React, {useMemo} from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {cancelRender, continueRender, delayRender} from 'remotion';

// Headless font gate (runs ONCE at module load, before any frame). KaTeX lazy-
// loads its woff2 faces only when glyphs paint, which races frame-0 capture on a
// render server → fallback/missing glyphs. Force every face to download first.
const KATEX_FACES = [
  'KaTeX_Main',
  'KaTeX_Math',
  'KaTeX_AMS',
  'KaTeX_Caligraphic',
  'KaTeX_Fraktur',
  'KaTeX_SansSerif',
  'KaTeX_Script',
  'KaTeX_Typewriter',
  'KaTeX_Size1',
  'KaTeX_Size2',
  'KaTeX_Size3',
  'KaTeX_Size4',
];

const fontHandle = delayRender('Loading KaTeX fonts');
(async () => {
  try {
    if (typeof document !== 'undefined' && (document as Document).fonts) {
      await Promise.all(
        KATEX_FACES.flatMap((family) => [
          document.fonts.load(`16px "${family}"`),
          document.fonts.load(`italic 16px "${family}"`),
          document.fonts.load(`bold 16px "${family}"`),
        ]),
      );
      await document.fonts.ready;
    }
    continueRender(fontHandle);
  } catch (err) {
    cancelRender(err as Error);
  }
})();

// Typeset LaTeX → academic-quality math. Inherits color via currentColor.
export const KatexMath: React.FC<{latex: string; display?: boolean; fontSize?: number; color?: string}> = ({
  latex,
  display = true,
  fontSize = 64,
  color = 'var(--fg, currentColor)',
}) => {
  const html = useMemo(
    () => katex.renderToString(latex, {throwOnError: false, displayMode: display, output: 'html', strict: false}),
    [latex, display],
  );
  return (
    <span
      style={{color, fontSize, lineHeight: 'normal', display: 'inline-block'}}
      dangerouslySetInnerHTML={{__html: html}}
    />
  );
};
