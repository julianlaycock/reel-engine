// vo-script.mjs — ONE shared composer for the narrated script.
// data/<slug>/script.txt is COMPOSED from video.json: each scene's clean `vo`
// line, joined by blank lines. NO audio tags — the [voTag] system was REMOVED
// 2026-07-13. Audio tags were the voice-drift source; the founder locked a
// natural narration voice on eleven_multilingual_v2 (config/voices.json#voices.vektor)
// and tags no longer touch the pipeline. A pronunciation map respells known
// problem-words in the SPOKEN text so pronunciation never has to be hand-fixed.
//
// Used by compose-script.mjs (build) AND check-goldens.mjs (gate) so the build
// and the gate can never drift — same doctrine as lib/reading-time.mjs.

// Extensible spoken-pronunciation map: whole-word, case-insensitive respellings
// applied to VO text before composition, so script.txt itself carries the
// respelling and every video benefits. Add future problem-words as [regex, to].
export const PRONUNCIATION = [
  [/\bmarkdown\b/gi, 'mark down'],
];

// Apply the pronunciation map to a single piece of VO text.
export const applyPronunciation = (text = '') =>
  PRONUNCIATION.reduce((s, [re, to]) => s.replace(re, to), text);

// Compose the full narrated script from video.json scenes. Beat boundaries are
// blank lines. NO audio tags are ever injected; the pronunciation map is applied
// so the composed script is exactly what should be spoken.
export const composeScript = (video) =>
  (video.scenes || [])
    .filter((sc) => sc.vo)
    .map((sc) => applyPronunciation(sc.vo))
    .join('\n\n') + '\n';

// Detect any inline audio tag ([excited], [confident], … or any bracketed
// lowercase word) left in a composed script. Tags are gone; the gate BLOCKS if
// one reappears so the drift source can never come back. Returns the offending
// markers (empty = clean).
export const findAudioTags = (script = '') => {
  const re = /\[[a-z][a-z ]*\]/gi;
  const out = [];
  let m;
  while ((m = re.exec(script))) out.push(m[0]);
  return out;
};
