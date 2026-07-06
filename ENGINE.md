# reel-engine — shared video engine (architecture)

**One engine, three brands.** `reel-engine` holds ALL engine code (compositions, scenes, motion system) and ALL build scripts. The brand apps are thin consumers that supply only content + brand + assets. Edit the engine once here → every brand gets it.

## Workspace layout (`C:\Users\julia\projects\`)
```
projects/
├─ package.json            # npm workspace root (members below); one hoisted node_modules
├─ reel-engine/            # THE ENGINE (this package)
│  ├─ src/                 # Video · Doctrine · DoctrineFilm · scenes/ · schema · motion · palettes · style.css
│  ├─ scripts/             # build-concept · render-* · voiceover · retime · capture-url · deliver · publish …
│  ├─ assets/fonts/        # shipped fonts (@font-face → here, portable)
│  └─ package.json         # deps + CLI bins (reel-render-video, reel-build-concept, …)
├─ vektor/                 # app: Vektor brand  (data/ · canon/ · config/ · public/ · brand/)
└─ caelith-labs/studio-os/ops/animated-card-engine/   # app: Caelith + Caelith Labs brands
```
Each **app** contains only: `src/index.ts` (3 lines: `registerRoot(Root)` from `@engine/root`), `remotion.config.ts` + `tsconfig` (`@engine` alias), `data/<slug>/`, `config/`, `canon/`, `public/`, and its `.env`. Brand (cream/navy vs teal vs mint) is set per-video in each `video.json`'s `brand` block.

## How resolution works (why it's deduped & transpiled)
The render scripts (`scripts/render-*.mjs`) bundle the **consumer's** `src/index.ts` and inject, via `_engine.mjs` → `withEngineAlias`:
- `resolve.alias['@engine'] = reel-engine/src` (a real sibling dir, not node_modules → Remotion transpiles it).
- `resolve.modules = [<cwd>/node_modules, 'node_modules']` → the engine's `react/three/remotion` resolve from the **consumer's** tree → one instance, no duplicate-React.
- Script `root = process.cwd()` → `data/ public/ out/ .env` resolve to whichever app runs it.

## Per-brand workflow
| Brand | cd into | say |
|---|---|---|
| Vektor | `projects/vektor` | "make a Vektor video from this transcript" |
| Caelith / Caelith Labs | `…/animated-card-engine` | "make a **Caelith Labs** video …" (brand set per-video) |
| **Engine change** (new scene, fix) | `projects/reel-engine` | edit `src/` → applies to all three |

Run builds from an app dir: `npm run build:concept -- --slug <slug>` (vektor uses `node ../reel-engine/scripts/...`; caelith uses the linked `reel-*` bins).

## Rules
- **Never** edit engine code in an app's `src/` — it's just a 3-line entry. All engine work lives in `reel-engine/src`.
- Deep engine reference (scene types, the safe-band layout law, Doctrine motion spec) — see the app CANON docs + `ENGINE-CHANGELOG.md`.
- Deprecated: each app's old local `scripts/` + `_src-engine-bak/` (pre-refactor backups) — safe to delete once you're confident.
