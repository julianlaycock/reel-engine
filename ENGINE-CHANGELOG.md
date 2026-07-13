# reel-engine — changelog

Every engine change goes here ONCE; it applies to all three brands (vektor · caelith · caelith-labs) automatically.

## 2026-07-09 — canon-board (visual canon as a build artifact)
- `scripts/canon-board.mjs` renders `canon/BOARD.html` from the canon sources (`americana-tokens.json`, `wireframes/wireframes.json`, `canon.yml`) — the board is now a generated artifact, never hand-edited. Run via `npm run canon:board` from the brand dir (`--brand vektor`).
- Enforcement wiring (projects-level): Claude Code PostToolUse hook (`.claude/hooks/canon-regen.mjs`) auto-regenerates the board after any canon-file edit; vektor git `pre-commit` hook regenerates + stages BOARD.html in the same commit as a canon change; `/canon-change` skill runs the founder-approval ritual. Law recorded in `projects/CLAUDE.md`.

## 2026-07-05 — Americana platform safe zone
- TikTok/IG aspect-fill 9:16 onto ~9:19.5 screens (~100px cropped per side) and overlay UI; the NO.004 upload lost its masthead, headline edge, footer and meta line. All `.skin-americana` layout now lives inside the union safe zone: top 220 / bottom 500 / sides 150 / right 260 in the y 850–1600 rail band.
- Masthead bar deepened 100→320px (full-bleed ink, content row bottom-aligned below the top overlay); footer inset 56→510 from bottom; rail 44→150; ghosts, jacquard, dark-stage, credit pulled inside; americana `.caps` override.
- Type rescaled ×0.79 for the 780px safe column: hook 158→126, section 120→100, receipt 104→88 (shot cap 840→660), numeral 420→380.
- `ClaudeMascot` warns at render time when an xPct/yPct/size placement (incl. bubble) leaves the zone.
- VMAX untouched (legacy lock). Spec: `vektor/canon/americana-tokens.json` v1.1.0 + `canon/VIDEO-STANDARD.md` platform-safe-zone law.

## 2026-07-02 — Shared-package refactor (Option A)
- Extracted the engine (all `src/` + `scripts/`) into `reel-engine`; set up an npm workspace at `projects/` (deduped, hoisted `node_modules`).
- Migrated **vektor** and the **caelith animated-card-engine** to thin consumers (`@engine/root`) — caelith upgraded on par with vektor (gained everything below).
- Scripts now resolve `root = process.cwd()`; `@engine` alias + consumer-`node_modules` dedup via `scripts/_engine.mjs`. Fonts shipped in `reel-engine/assets/fonts` (portable `@font-face`).
- Verified: vektor full video render + caelith Doctrine still, both green.

## Recent engine work (folded in from vektor, now shared)
- **Doctrine motion system**: `Doctrine.tsx` + `DoctrineFilm.tsx` (narrated) + `palettes.ts` + `motion.ts` + `doctrine-*.ts` + `scenes/doctrine/*` (kinetic headlines, color-morph transitions, scramble-ledger, self-drawing timeline, field-grid, shimmer hero, dead-still freeze). `render-doctrine.mjs` + `render-doctrine-film.mjs` (two-pass loudnorm).
- **Safe-band layout law** (`.ed-stage` `justify-content: safe center`, capped `.ed-shot`, lowered `.ng-caption`) — scene content can never collide with chrome/footer.
- **Timeline**: connector line pierces first & last dots.
- **Editorial**: light-panel brand vars (`--panel-*`), `--display` font override, themed callout leader-lines.
- **capture-url.mjs**: `--no-sandbox`, isolated profile, absolute-path output, write-poll, `--scale` (exact-px exports).
- **Brand**: Vektor logo "The Caret" locked (`canon/BRAND.md`), production banners exported.
- **Publishing**: `PUBLISH-SETUP.md` (self-hosted Postiz, WhatsApp intake, 1-tap approval) — pending user setup.

## How to add an engine change
1. Edit in `reel-engine/src` (or `scripts`).
2. Render-test from one app dir (`npm run render:video ...`).
3. Add a line here. Done — all brands have it.
