// validate-tokens.mjs — video.json token-name enforcement (canon-resolver step 5).
//
// The ONE implementation of the "no raw style values in video.json" rule, shared
// by render-video.mjs (refuses to render) and check-canon.mjs (gate result).
// It is DATA-DRIVEN off the generated name lists in
// <brandRoot>/src/generated/token-names.json (gen-tokens.mjs output), so the
// allowed vocabulary always tracks canon — never a hand-maintained copy.
//
// Rules enforced on a parsed video.json:
//   (a) any string value matching a raw hex color (#RGB…#RRGGBBAA) → ERROR;
//       style values must be token references.
//   (b) font-carrying keys (any key matching /font/i, plus the brand-block font
//       stacks display/mono) with a raw font string → ERROR; use token:fonts.*
//       (a pure `var(--…)` reference is allowed — it names a token-fed CSS var,
//       not a hardcoded family).
//   (c) token-typed fields — a scene's `field` and any `token:<group>.<name>`
//       reference — must be members of the generated name lists → ERROR with a
//       closest-match suggestion.
//   (d) raw px coordinate overrides are NOT re-checked here: which keys a scene
//       may carry (including px overrides like imgBox/textTop) is governed by
//       the template whitelist in canon/templates/templates.json, enforced by
//       checkTemplates in check-goldens.mjs — one implementation, not duplicated.
//
// Token reference syntax (resolved at render time by reel-engine/src/token-ref.ts):
//   token:fields.<name>.<bg|fg|muted|hairline>   e.g. token:fields.ink.bg
//   token:accents.<name> | token:cssVars.<--var> | token:gradients.<name>
//   token:colors.<name>  | token:fonts.<name>
import fs from 'node:fs';
import path from 'node:path';

export const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
export const TOKEN_RE = /^token:([a-zA-Z]+)\.(.+)$/;
const FIELD_PARTS = new Set(['bg', 'fg', 'muted', 'hairline']);
// brand-block keys that carry a font stack without 'font' in the key name.
const BRAND_FONT_KEYS = new Set(['display', 'mono']);

// ── loaders ──────────────────────────────────────────────────────────────────
export const loadTokenNames = (brandRoot) => {
  const p = path.join(brandRoot, 'src', 'generated', 'token-names.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
};

// canon/legacy-frozen.json — pre-canon-resolver videos carrying raw style
// values, frozen as-is (render refuses; the canon gate skips them).
export const loadFrozenSlugs = (brandRoot) => {
  const p = path.join(brandRoot, 'canon', 'legacy-frozen.json');
  if (!fs.existsSync(p)) return new Set();
  return new Set(JSON.parse(fs.readFileSync(p, 'utf8')).frozen ?? []);
};

export const FROZEN_MESSAGE = (slug) =>
  `legacy-frozen: ${slug} is a pre-canon-resolver video (raw style values, canon/legacy-frozen.json); ` +
  `unfreeze requires founder approval + token migration`;

// ── closest-match suggestion (Levenshtein) ───────────────────────────────────
const lev = (a, b) => {
  const m = a.length;
  const n = b.length;
  const d = Array.from({length: m + 1}, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return d[m][n];
};

const closest = (name, candidates) => {
  let best = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const dd = lev(name.toLowerCase(), c.toLowerCase());
    if (dd < bestD) {
      bestD = dd;
      best = c;
    }
  }
  return best && bestD <= Math.max(2, Math.floor(name.length / 2)) ? best : null;
};

const unknown = (what, name, candidates) => {
  const hint = closest(name, candidates);
  return `unknown ${what} '${name}'${hint ? ` — did you mean '${hint}'?` : ''} (known: ${candidates.join(', ')})`;
};

// ── token-reference validation ───────────────────────────────────────────────
const GROUPS = ['fields', 'accents', 'cssVars', 'gradients', 'colors', 'fonts'];

export const validateTokenRef = (value, names) => {
  const m = TOKEN_RE.exec(value);
  if (!m) return `malformed token reference '${value}' — expected token:<group>.<name>`;
  const [, group, rest] = m;
  if (!GROUPS.includes(group)) {
    return `unknown token group '${group}' in '${value}' (known groups: ${GROUPS.join(', ')})`;
  }
  if (group === 'fields') {
    const dot = rest.lastIndexOf('.');
    const name = dot > 0 ? rest.slice(0, dot) : rest;
    const part = dot > 0 ? rest.slice(dot + 1) : null;
    if (!part || !FIELD_PARTS.has(part)) {
      return `field token '${value}' must name a part — token:fields.<name>.<${[...FIELD_PARTS].join('|')}>`;
    }
    if (!names.fields.includes(name)) return unknown('field token', name, names.fields);
    return null;
  }
  if (!names[group].includes(rest)) return unknown(`${group} token`, rest, names[group]);
  return null;
};

// ── the video.json walk ──────────────────────────────────────────────────────
const isFontKey = (key, inBrand) =>
  /font/i.test(key) || (inBrand && BRAND_FONT_KEYS.has(key));

// A `var(--…)` value names a token-fed CSS custom property, not a raw family.
const isVarRef = (v) => /^var\(--[a-zA-Z0-9-]+(\s*,.*)?\)$/.test(v.trim());

export const validateVideoTokens = (video, names) => {
  const errors = [];

  const checkString = (value, at, key, inBrand) => {
    if (TOKEN_RE.test(value)) {
      const err = validateTokenRef(value, names);
      if (err) errors.push(`${at}: ${err}`);
      return;
    }
    if (HEX_RE.test(value)) {
      errors.push(`${at}: raw hex color forbidden ('${value}') — use a token reference (token:<group>.<name>)`);
      return;
    }
    if (key && isFontKey(key, inBrand) && !isVarRef(value)) {
      errors.push(`${at}: raw font value forbidden ('${value}') — use token:fonts.<name> (known: ${names.fonts.join(', ')})`);
    }
  };

  const walk = (node, at, key, inBrand) => {
    if (typeof node === 'string') {
      checkString(node, at, key, inBrand);
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${at}[${i}]`, key, inBrand));
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        walk(v, at ? `${at}.${k}` : k, k, inBrand || k === 'brand');
      }
    }
  };

  walk(video, '', null, false);

  // token-typed scene fields: `field` must be a generated field/gradient name.
  const fieldNames = [...(names.fields ?? []), ...(names.gradients ?? [])];
  (video.scenes ?? []).forEach((sc, i) => {
    if (typeof sc.field === 'string' && !fieldNames.includes(sc.field)) {
      errors.push(`scenes[${i}].field: ${unknown('field name', sc.field, fieldNames)}`);
    }
  });

  return errors;
};
