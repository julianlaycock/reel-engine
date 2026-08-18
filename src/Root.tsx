// THE COMPOSITION LIST IS A WORKING SURFACE, NOT AN INVENTORY (founder, 2026-08-17:
// "is there any way we can make this list cleaner so i always know which is our
// latest film").
//
// ── THE NAMING SCHEME ────────────────────────────────────────────────────────
//
//   NN-no0NN-short-name    a film.  NN counts DOWN the list, so the newest film
//                           is always 01 and always at the top.
//   lab-*                   not a film: a proving ground or a decision surface.
//                           Sorts below every film because 'l' > any digit.
//
// THE COST OF THIS SCHEME, STATED SO NOBODY REDISCOVERS IT: the NN prefix SHIFTS
// on every new film. NO. 034 is 02 today and 03 tomorrow. Composition ids are
// therefore NOT stable identifiers, and anything that pins one must be updated in
// the same commit as the rename. Today that is exactly one place —
// canon/kt-canon.yml#films.*.composition, which every gate resolves through — plus
// the hardcoded 'lab-fx-lab' in vektor/scripts/fx-demos.mjs. The founder chose
// newest-at-top over stable ids knowing this; the alternative was the newest film
// sorting to the bottom of the list forever.
//
// ── WHAT WAS REMOVED, AND WHY IT IS COMMENTED RATHER THAN DELETED ────────────
//
// Founder 2026-08-17 removed four groups of stale entries. They are commented out
// instead of deleted because a Composition registration is the ONLY thing that
// makes a component renderable, and one of them is load-bearing outside the studio:
//
//   Video ................. `render-video.mjs` and `render-still.mjs` both DEFAULT
//                           to composition 'Video'. With this commented out,
//                           `npm run render:video` cannot render any scene-based
//                           film — the whole pre-KT pipeline. Restoring it is
//                           uncommenting one block.
//   TransitionDemo ........ the ONE coupled-transition implementation, which
//                           vektor/CLAUDE.md names as the source of `buildTransition`
//                           and which check-goldens has a coupling golden for.
//                           Verify that gate before treating this as gone.
//   KTTokens-B/C .......... layout options for a choice NO. 034 already shipped.
//   KT3DSlabs/Screener .... 3D experiments, in no shipped film.
//   KTFxDemo .............. superseded by KTFxLab, which is what fxProven reads.
//   KTHookHybrid .......... a variant prop of NO. 030.
import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './video-schema';
import {KTHook, KT_HOOK_FRAMES} from './KTHook';
import {KTFxLab, KT_FX_LAB_FRAMES} from './KTFxLab';
import {KTNo035, KT_NO035_FRAMES} from './KTNo035';
import {KTTax, KT_TAX_FRAMES} from './KTTax';
import {KTState, KT_STATE_FRAMES} from './KTState';
import {KTFunnel, KT_FUNNEL_FRAMES} from './KTFunnel';
import {KTStack, KT_STACK_FRAMES} from './KTStack';
import {KTTokens, KT_TOKENS_FRAMES} from './KTTokens';

export const Root: React.FC = () => {
  return (
    <>
      {/* ── 01 — THE CURRENT FILM ──────────────────────────────────────────── */}
      <Composition
        id="01-no035-mcp-not-apis"
        component={KTNo035}
        defaultProps={{layer: 'all' as const}}
        durationInFrames={KT_NO035_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── 02+ — SHIPPED FILMS, newest first ──────────────────────────────── */}
      <Composition
        id="02-no034-token-claims"
        component={KTTokens}
        defaultProps={{layer: 'all' as const}}
        durationInFrames={KT_TOKENS_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="03-no033-five-setups"
        component={KTStack}
        defaultProps={{layer: 'all' as const}}
        durationInFrames={KT_STACK_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="04-no027-free-funnel"
        component={KTFunnel}
        durationInFrames={KT_FUNNEL_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="05-no026-state-file"
        component={KTState}
        durationInFrames={KT_STATE_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="06-no031-tax-the-agents"
        component={KTTax}
        durationInFrames={KT_TAX_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="07-no030-the-council"
        component={KTHook}
        durationInFrames={KT_HOOK_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{variant: 'radial' as const}}
      />

      {/* ── lab — NOT FILMS ────────────────────────────────────────────────── */}
      {/* The proving ground. A shared device must appear here before a film may
          import it (check-kt#fxProven). Renaming this id means updating the
          hardcoded string in vektor/scripts/fx-demos.mjs, which renders it. */}
      <Composition
        id="lab-fx-lab"
        component={KTFxLab}
        durationInFrames={KT_FX_LAB_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* REMOVED 2026-08-18 with KTNo035Variants.tsx (founder approved deleting
          it). It was a decision surface for the grid treatment, the choice was
          made and then reversed, and once CountGrid moved into kt/argument.tsx
          the file was a third copy of a shipped graphic — the look-alike the
          Approval Protocol forbids. The three treatments are in git history. */}

      {/* ── REMOVED 2026-08-17 (founder). Uncomment to restore. ─────────────
      <Composition id="Video" component={Video}
        durationInFrames={totalFrames(defaultVideo)} fps={FPS} width={1080} height={1920}
        defaultProps={{video: defaultVideo}}
        calculateMetadata={({props}) => ({
          durationInFrames: totalFrames(props.video), fps: props.video.fps ?? FPS,
          width: props.video.width ?? 1080, height: props.video.height ?? 1920,
        })} />
      <Composition id="TransitionDemo" component={TransitionDemo}
        durationInFrames={demoDuration('spring-slide', FPS)} fps={FPS} width={1080} height={1920}
        defaultProps={{video: defaultVideo, variant: 'spring-slide' as TransitionVariant}}
        calculateMetadata={({props}) => ({
          durationInFrames: demoDuration(props.variant, props.video.fps ?? FPS),
          fps: props.video.fps ?? FPS,
          width: props.video.width ?? 1080, height: props.video.height ?? 1920,
        })} />
      <Composition id="KTTokens-B-two-lines" component={KTTokens}
        defaultProps={{layer: 'all' as const, mode: 'two' as const}}
        durationInFrames={KT_TOKENS_FRAMES} fps={FPS} width={1080} height={1920} />
      <Composition id="KTTokens-C-caption" component={KTTokens}
        defaultProps={{layer: 'all' as const, mode: 'caption' as const}}
        durationInFrames={KT_TOKENS_FRAMES} fps={FPS} width={1080} height={1920} />
      <Composition id="KT3DSlabs" component={KT3DSpike} defaultProps={{variant: 'slabs' as const}}
        durationInFrames={KT_3D_SPIKE_FRAMES} fps={FPS} width={1080} height={1920} />
      <Composition id="KT3DScreener" component={KT3DSpike} defaultProps={{variant: 'screener' as const}}
        durationInFrames={KT_3D_SPIKE_FRAMES} fps={FPS} width={1080} height={1920} />
      <Composition id="KTFxDemo" component={KTFxDemo}
        durationInFrames={KT_FX_DEMO_FRAMES} fps={FPS} width={1080} height={1920} />
      <Composition id="KTHookHybrid" component={KTHook} defaultProps={{variant: 'hybrid' as const}}
        durationInFrames={KT_HOOK_FRAMES} fps={FPS} width={1080} height={1920} />
      ──────────────────────────────────────────────────────────────────────── */}
    </>
  );
};
