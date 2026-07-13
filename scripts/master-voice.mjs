#!/usr/bin/env node
// Voice mastering — make a clean ElevenLabs/PVC export sound like it was recorded
// on a professional mic in a treated room. Tonal shaping + de-ess + compression +
// "air". Final loudness is left to render:video (loudnorm -14 LUFS), so this stage
// only shapes character — no double-normalization.
//
// Usage: npm run master-voice -- --input public/audio/<slug>/vo.mp3 --output public/audio/<slug>/vo-master.wav [--strength warm|balanced|airy]
//
// ElevenLabs/PVC exports are clean but DULL and BOXY (measured: presence ~12 dB and
// air ~18 dB below the 350-800 Hz midrange). A close pro mic is the opposite — trimmed
// box, open presence, real air. These chains correct toward a broadcast curve
// (verified by per-band measurement; target presence-box ≈ -6, air-box ≈ -11).
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileP = promisify(execFile);
const root = process.cwd();

// Three voicings so the founder can choose by ear. balanced = default.
const CHAINS = {
  warm: [
    'highpass=f=75',
    'equalizer=f=180:t=q:w=1.0:g=2', // chest warmth
    'equalizer=f=500:t=q:w=1.2:g=-4', // kill box/honk
    'equalizer=f=3000:t=q:w=1.1:g=4.5', // presence
    'treble=g=5:f=9000', // air
    'acompressor=threshold=-20dB:ratio=3:attack=10:release=150:makeup=3',
    'deesser=i=0.12',
  ],
  balanced: [
    'highpass=f=75',
    'equalizer=f=180:t=q:w=1.0:g=1.5', // warmth
    'equalizer=f=500:t=q:w=1.2:g=-4', // kill box/honk
    'equalizer=f=2900:t=q:w=1.0:g=5', // presence / clarity
    'equalizer=f=5000:t=q:w=2:g=2', // edge/detail
    'treble=g=5.5:f=9500', // air
    'aexciter=amount=0.7:freq=5000:blend=0.2', // synth missing highs (source is dull)
    'acompressor=threshold=-20dB:ratio=2.8:attack=10:release=150:makeup=3',
    'deesser=i=0.15',
  ],
  airy: [
    'highpass=f=75',
    'equalizer=f=500:t=q:w=1.2:g=-3.5',
    'equalizer=f=2800:t=q:w=1.0:g=5',
    'equalizer=f=6000:t=q:w=1.5:g=3.5',
    'treble=g=6.5:f=9500',
    'aexciter=amount=1.2:freq=4500:blend=0.3',
    'acompressor=threshold=-20dB:ratio=3:attack=8:release=140:makeup=3',
    'deesser=i=0.22',
  ],
  // For already-bright/produced voices (e.g. ElevenLabs v3 content-creator voices):
  // add body + tame the top, do NOT boost air. Smooths rather than brightens.
  narrator: [
    'highpass=f=95', // cut sub-rumble harder (was the source of the low "background" hum)
    'equalizer=f=160:t=q:w=1.2:g=-2.5', // tame the low boom — do NOT boost body on this voice
    'equalizer=f=400:t=q:w=1.4:g=-1.5', // light de-mud
    'afftdn=nr=10', // gentle broadband denoise (v3 ambience / breath floor)
    'equalizer=f=3000:t=q:w=1.2:g=1.5', // a touch of presence/clarity
    'equalizer=f=6500:t=q:w=2:g=-1.5', // tame brightness/sibilance
    'deesser=i=0.3',
    'acompressor=threshold=-20dB:ratio=2.5:attack=12:release=180:makeup=2', // gentler makeup = less noise lift
    'treble=g=-0.5:f=10500',
  ],
  // Clean broadcast read for eleven_v3 narration — kills the v3 ambience/hum floor
  // (the "background noise") with a firmer denoise + tight low-end, then a gentle,
  // slow compressor so the voice stays natural (not pumped or lifted). Use this when
  // the source has audible room tone that loudnorm would otherwise raise.
  clean: [
    'highpass=f=95', // remove sub-rumble the v3 floor lives in
    'afftdn=nr=12:nf=-25', // firm broadband denoise (tracks the noise floor)
    'equalizer=f=170:t=q:w=1.2:g=-2', // tame low boom
    'equalizer=f=430:t=q:w=1.3:g=-1.5', // de-mud
    'equalizer=f=2900:t=q:w=1.1:g=1.5', // gentle presence/clarity
    'equalizer=f=6500:t=q:w=2:g=-2', // soften harsh sibilance
    'deesser=i=0.25',
    'acompressor=threshold=-19dB:ratio=2.2:attack=18:release=220:makeup=1.5', // slow + gentle = natural, low noise-lift
    'treble=g=-1:f=11000', // keep the very top calm (less hiss)
  ],
  // Lightest touch — preserve natural dynamics (much less denoise + a gentle, slow
  // compressor) for a raw, "just spoke into a good mic" feel. Best on already-clean
  // v3 voices where heavy processing was making them sound produced/synthetic.
  natural: [
    'highpass=f=90',
    'equalizer=f=180:t=q:w=1.1:g=-1.5', // light mud trim only
    'afftdn=nr=6', // gentle denoise (vs nr=10) — keeps breath/air natural
    'equalizer=f=2800:t=q:w=1.2:g=1', // a touch of presence
    'equalizer=f=6500:t=q:w=2:g=-1', // soften sibilance lightly
    'deesser=i=0.18',
    'acompressor=threshold=-18dB:ratio=2:attack=20:release=250:makeup=1', // slow + gentle = keeps natural dynamics
  ],
  // THE VEKTOR VOICE MASTER — founder-locked 2026-07-14. The `natural` voicing above
  // (which preserves the karpathy "more human" character the founder approved) followed
  // by a firm de-hiss that kills the eleven_v3 ambience/hiss floor the founder flagged
  // ("annoying background noise"). This is the two-stage chain the founder signed off on
  // by ear (natural master → highpass+afftdn nr22), folded into ONE deterministic pass.
  // Do NOT retune without a founder unlock — it is fingerprinted via voices.json#vektor
  // master_strength (canon.yml#voice.fingerprint / check-goldens).
  'natural-dehiss': [
    'highpass=f=90',
    'equalizer=f=180:t=q:w=1.1:g=-1.5', // light mud trim (natural voicing)
    'afftdn=nr=6', // gentle first-pass denoise — keeps breath/air natural
    'equalizer=f=2800:t=q:w=1.2:g=1', // a touch of presence
    'equalizer=f=6500:t=q:w=2:g=-1', // soften sibilance lightly
    'deesser=i=0.18',
    'acompressor=threshold=-18dB:ratio=2:attack=20:release=250:makeup=1', // slow + gentle = natural dynamics
    'highpass=f=75', // de-hiss stage — tighten the low end the v3 floor lives in
    'afftdn=nr=22:nf=-40:tn=1', // firm broadband hiss-kill (tracks the noise floor) — the approved de-hiss
  ],
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {strength: 'clean'}; // factory default: denoised broadcast read for eleven_v3 (kills the v3 ambience/hum floor)
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--input' || a === '-i') parsed.input = args[++i];
    else if (a === '--output' || a === '-o') parsed.output = args[++i];
    else if (a === '--strength' || a === '-s') parsed.strength = args[++i];
  }
  if (!parsed.input || !parsed.output) {
    throw new Error(
      'Usage: npm run master-voice -- --input public/audio/<slug>/vo.mp3 --output public/audio/<slug>/vo-master.wav [--strength soft|default|strong]',
    );
  }
  if (!CHAINS[parsed.strength]) {
    throw new Error(`--strength must be one of: ${Object.keys(CHAINS).join(', ')}`);
  }
  return parsed;
};

const main = async () => {
  const args = parseArgs();
  const input = path.resolve(root, args.input);
  const output = path.resolve(root, args.output);
  const chain = CHAINS[args.strength].join(',');

  await fs.mkdir(path.dirname(output), {recursive: true});
  await execFileP('ffmpeg', [
    '-y',
    '-i',
    input,
    '-af',
    chain,
    '-ar',
    '48000',
    '-c:a',
    'pcm_s16le',
    output,
  ]);
  console.log(`Mastered (${args.strength}) → ${path.relative(root, output)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
