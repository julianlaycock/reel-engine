// Shared engine-resolution helper for the reel-engine workspace.
// Consumers (vektor / caelith / caelith-labs) keep a thin src/index.ts + root.tsx
// that import engine components via the '@engine' alias. This maps '@engine' to
// reel-engine/src (a REAL sibling dir, not node_modules), so Remotion's TS loader
// transpiles it and hoisted deps (react/three/remotion) resolve to one instance.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ENGINE_SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

// '@tokens' → the CONSUMER brand's generated token files (gen-tokens.mjs output).
// Falls back to the engine-local committed copy (reel-engine/src/generated/,
// generated from vektor) so the engine also builds/typechecks standalone.
export const TOKENS_FALLBACK = path.join(ENGINE_SRC, 'generated');
export const resolveTokensDir = () => {
  const brandGenerated = path.join(process.cwd(), 'src', 'generated');
  return fs.existsSync(path.join(brandGenerated, 'tokens.ts')) ? brandGenerated : TOKENS_FALLBACK;
};

export const withEngineAlias = (config) => {
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    '@engine': ENGINE_SRC,
    '@tokens': resolveTokensDir(),
  };
  // Resolve the engine's bare deps (react/three/remotion) from the CONSUMER's
  // node_modules first → one instance, no duplicate-React across the shared source.
  const cwdNM = path.join(process.cwd(), 'node_modules');
  config.resolve.modules = [cwdNM, 'node_modules', ...(config.resolve.modules || [])];
  return config;
};
