// Vektor brand fonts via @remotion/google-fonts (headless-safe). Importing this
// module registers the families; video.json `brand` blocks reference them by name.
// Weights/subsets are capped to keep render-time network requests sane.
import {loadFont as loadGeist} from '@remotion/google-fonts/Geist';
import {loadFont as loadGeistMono} from '@remotion/google-fonts/GeistMono';
import {loadFont as loadSchibsted} from '@remotion/google-fonts/SchibstedGrotesk';
import {loadFont as loadHanken} from '@remotion/google-fonts/HankenGrotesk';
import {loadFont as loadOnest} from '@remotion/google-fonts/Onest';
import {loadFont as loadJetBrains} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadSpaceMono} from '@remotion/google-fonts/SpaceMono';
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadNotoEmoji} from '@remotion/google-fonts/NotoColorEmoji';

// Anton — heavy condensed display for the photo-forward sports scenes (splitvs /
// photostat / full-bleed covers). Registered so headless renders resolve "Anton".
loadAnton('normal', {weights: ['400'], subsets: ['latin'], ignoreTooManyRequestsWarning: true});

const opt = (weights: string[]) => ({
  weights,
  subsets: ['latin'] as const,
  ignoreTooManyRequestsWarning: true as const,
});

export const FONTS = {
  geist: loadGeist('normal', opt(['400', '500', '600', '700'])).fontFamily,
  geistMono: loadGeistMono('normal', opt(['400', '500'])).fontFamily,
  schibsted: loadSchibsted('normal', opt(['500', '700', '900'])).fontFamily,
  hanken: loadHanken('normal', opt(['400', '600', '800'])).fontFamily,
  onest: loadOnest('normal', opt(['400', '600', '800'])).fontFamily,
  jetbrainsMono: loadJetBrains('normal', opt(['400', '500'])).fontFamily,
  spaceMono: loadSpaceMono('normal', opt(['400', '700'])).fontFamily,
  notoEmoji: loadNotoEmoji().fontFamily,
};
