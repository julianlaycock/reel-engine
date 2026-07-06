// Shared engine-resolution helper for the reel-engine workspace.
// Consumers (vektor / caelith / caelith-labs) keep a thin src/index.ts + root.tsx
// that import engine components via the '@engine' alias. This maps '@engine' to
// reel-engine/src (a REAL sibling dir, not node_modules), so Remotion's TS loader
// transpiles it and hoisted deps (react/three/remotion) resolve to one instance.
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ENGINE_SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

export const withEngineAlias = (config) => {
  config.resolve = config.resolve || {};
  config.resolve.alias = {...(config.resolve.alias || {}), '@engine': ENGINE_SRC};
  // Resolve the engine's bare deps (react/three/remotion) from the CONSUMER's
  // node_modules first → one instance, no duplicate-React across the shared source.
  const cwdNM = path.join(process.cwd(), 'node_modules');
  config.resolve.modules = [cwdNM, 'node_modules', ...(config.resolve.modules || [])];
  return config;
};
