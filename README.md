# reel-engine

> **ARCHIVED 2026-10-10: KT-Remotion engine retired.**
> Vektor OS scripts live in `vektor-producer/scripts/engine` (voiceover, master-voice, generate-captions,
> capture-url). KT re-render lives in `vektor-producer/archive/kt` (a copy of this repo's `src/`,
> `assets/fonts/` and `scripts/_engine.mjs`, with its own README).
> Provenance: tag `kt-final-2026-10-09` = `aee8420`, the last engine commit before the archive.
> The voice-fingerprint lock that lived in `scripts/check-goldens.mjs` now runs from
> `vektor-producer/scripts/check-voice-fingerprint.mjs`.
> Founder rulings: 2026-10-09 (archive KT, strip live references, gate new ones) and 2026-10-10
> (copy the four OS scripts into vektor-producer, then archive the whole reel-engine repo).
> Do not add new work here.

Shared Remotion JSON-in to MP4-out engine (scene graph, cards-in-video), formerly consumed by
vektor / caelith / caelith-labs. See `ENGINE.md` and `ENGINE-CHANGELOG.md` for the historical design.
