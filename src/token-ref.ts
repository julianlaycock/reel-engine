// token-ref.ts — resolves "token:<group>.<name>" references in a video.json to
// their generated canon values (canon-resolver step 5). video.json carries token
// NAMES (validated by scripts/lib/validate-tokens.mjs — the same vocabulary);
// this is the ONE render-time resolver, fed by the same gen-tokens.mjs output
// the rest of the engine imports, so a reference can never drift from canon.
//
// Syntax:
//   token:fields.<name>.<bg|fg|muted|hairline>   e.g. token:fields.ink.bg
//   token:accents.<name> | token:cssVars.<--var> | token:gradients.<name>
//   token:colors.<name>  | token:fonts.<name>
import {ACCENTS, COLORS, CSS_VARS, FIELDS, FONTS, GRADIENTS} from '@tokens/tokens';

const TOKEN_RE = /^token:([a-zA-Z]+)\.(.+)$/;

const FLAT_GROUPS: Record<string, Record<string, string> | undefined> = {
  accents: ACCENTS,
  cssVars: CSS_VARS,
  gradients: GRADIENTS,
  colors: COLORS,
  fonts: FONTS,
};

export const resolveTokenRef = (value: string): string => {
  const m = TOKEN_RE.exec(value);
  if (!m) return value;
  const [, group, rest] = m;
  if (group === 'fields') {
    const dot = rest.lastIndexOf('.');
    const name = rest.slice(0, dot);
    const part = rest.slice(dot + 1);
    const field = (FIELDS as Record<string, Record<string, string> | undefined>)[name];
    const resolved = field?.[part];
    if (typeof resolved === 'string') return resolved;
  } else {
    const resolved = FLAT_GROUPS[group]?.[rest];
    if (typeof resolved === 'string') return resolved;
  }
  // Fail LOUD at render time: an unresolvable reference means stale generated
  // tokens or a typo — never silently paint the raw string into CSS.
  throw new Error(
    `unknown token reference "${value}" — regenerate tokens (npm run canon:tokens) or fix the name`,
  );
};

// Deep-resolves every token reference in a parsed video.json (applied once at
// the Video composition entry). Non-reference values pass through untouched, so
// a video with no references is byte-identical in and out.
export const resolveTokenRefsDeep = <T,>(node: T): T => {
  if (typeof node === 'string') {
    return (TOKEN_RE.test(node) ? resolveTokenRef(node) : node) as unknown as T;
  }
  if (Array.isArray(node)) {
    return node.map((v) => resolveTokenRefsDeep(v)) as unknown as T;
  }
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = resolveTokenRefsDeep(v);
    }
    return out as unknown as T;
  }
  return node;
};
