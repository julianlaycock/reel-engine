// vo-script.mjs — ONE shared composer for the narrated script (founder-approved
// context-aware VO, 2026-07-09). data/<slug>/script.txt is COMPOSED from
// video.json: each scene's clean `vo` line prefixed with its `voTag` as an
// eleven_v3 inline audio tag. The vo field stays tag-free (captions +
// reading-time never see tags); the composed script is the ONLY text that
// reaches the ElevenLabs API — in a single call (v3 has no request stitching).
//
// Used by compose-script.mjs (build) AND check-goldens.mjs (gate) so the build
// and the gate can never drift — same doctrine as lib/reading-time.mjs.

// The founder-approved tag vocabulary (canon.yml#voice.tags.allowed mirrors this;
// the gate cross-checks against canon so the two can't drift silently).
export const APPROVED_VO_TAGS = ['excited', 'confident', 'curious', 'thoughtful', 'happily'];

// Compose the full narrated script from video.json scenes.
// Beat boundaries are blank lines; a tagged beat opens with its audio tag.
export const composeScript = (video) =>
  (video.scenes || [])
    .filter((sc) => sc.vo)
    .map((sc) => (sc.voTag ? `[${sc.voTag}] ${sc.vo}` : sc.vo))
    .join('\n\n') + '\n';

// Validate every scene's voTag against an allowed list. Returns fail strings.
export const validateVoTags = (video, allowed = APPROVED_VO_TAGS) => {
  const fails = [];
  (video.scenes || []).forEach((sc, i) => {
    if (sc.voTag && !allowed.includes(sc.voTag)) {
      fails.push(`scene[${i}] voTag '${sc.voTag}' is not in the approved tag vocabulary [${allowed.join(', ')}]`);
    }
    if (sc.vo && /\[[a-z ]+\]/i.test(sc.vo)) {
      fails.push(`scene[${i}] vo contains an inline [tag] — tags live ONLY in voTag; vo stays clean for captions/reading-time`);
    }
  });
  return fails;
};
