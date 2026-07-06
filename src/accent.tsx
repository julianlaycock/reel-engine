import React from 'react';

// Render a line with one accent word in brand red. Mirrors AnimatedCard's
// splitAccent, shared so the new scene types stay consistent. {curly braces}
// in source are stripped (they were a legacy accent marker).
export const renderAccent = (
  text: string,
  accentWords: string[] = [],
): React.ReactNode => {
  const clean = text.replace(/[{}]/g, '');
  const word = accentWords.find((candidate) =>
    clean.toLowerCase().includes(candidate.toLowerCase()),
  );
  if (!word) {
    return clean;
  }
  const idx = clean.toLowerCase().indexOf(word.toLowerCase());
  return (
    <>
      {clean.slice(0, idx)}
      <span className="r">{clean.slice(idx, idx + word.length)}</span>
      {clean.slice(idx + word.length)}
    </>
  );
};
