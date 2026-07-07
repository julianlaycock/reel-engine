// Brand resolution for the federated engine.
//
// The engine (scripts/, src/, fonts) lives in reel-engine and is the single
// source of truth for CODE. Each brand (vektor, caelith, ...) is its own repo
// holding only DATA: canon/, config/, public/, data/, out/. brands.json maps a
// --brand name to that repo's root.
//
// Convention: engine scripts are invoked by ABSOLUTE path but run with
// cwd = brandRoot, so their existing `const root = process.cwd()` logic resolves
// data/config/public/out into the brand automatically. Only the script files and
// src/index.ts (the Remotion bundle) come from engineRoot.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const engineRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const loadRegistry = () =>
  JSON.parse(fs.readFileSync(path.join(engineRoot, 'brands.json'), 'utf8'));

// Pull --brand / -b out of an argv array without disturbing other flags.
export const parseBrandArg = (argv) => {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--brand' || argv[i] === '-b') return argv[i + 1];
  }
  return undefined;
};

// Resolve a brand name (or the registry default) to absolute roots.
export const resolveBrand = (brandArg) => {
  const reg = loadRegistry();
  const name = brandArg || reg.default;
  if (!name) {
    throw new Error('No --brand given and no "default" in brands.json');
  }
  const rel = reg.brands?.[name];
  if (!rel) {
    const known = Object.keys(reg.brands ?? {}).join(', ') || '(none)';
    throw new Error(`Unknown brand "${name}". Known brands: ${known}`);
  }
  const brandRoot = path.resolve(engineRoot, rel);
  if (!fs.existsSync(brandRoot)) {
    throw new Error(`Brand "${name}" root does not exist: ${brandRoot}`);
  }
  return {name, engineRoot, brandRoot};
};
