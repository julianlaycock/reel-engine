import React from 'react';

// Procedural grain (fractalNoise, overlay, opacity 0.17, tile drift by frame) +
// vignette. Verbatim from the reference finishing pass. Deterministic under frame.
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export const Grain: React.FC<{frame: number}> = ({frame}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      backgroundImage: GRAIN_URL,
      backgroundSize: '160px 160px',
      backgroundPosition: `${((frame * 7) % 160).toFixed(0)}px ${((frame * 11) % 160).toFixed(0)}px`,
      opacity: 0.17,
      mixBlendMode: 'overlay',
    }}
  />
);

export const Vignette: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'radial-gradient(120% 90% at 50% 42%, transparent 55%, rgba(0,0,0,0.16) 100%)',
    }}
  />
);
