#!/usr/bin/env node
// One-command autonomous build of a concept: voiceover (ElevenLabs API) → master
// → captions → retime → render. The mechanical chain that turns a scripted concept
// (data/<slug>/{script.txt, video.json}) into out/<slug>.mp4 with zero manual steps.
// QA + delivery are handled by the /content-build skill that calls this.
//
// Usage: npm run build:concept -- --slug speed-to-lead --voice story
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileP = promisify(execFile);
const root = process.cwd();

const parseArgs = () => {
  const args = process.argv.slice(2);
  const p = {};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--slug' || a === '-s') p.slug = args[++i];
    else if (a === '--voice' || a === '-v') p.voice = args[++i];
  }
  if (!p.slug) throw new Error('Usage: npm run build:concept -- --slug <slug> [--voice story|authority]');
  return p;
};

const run = async (label, file, scriptArgs) => {
  process.stdout.write(`\n▶ ${label}\n`);
  const {stdout, stderr} = await execFileP('node', [path.join(root, 'scripts', file), ...scriptArgs], {
    cwd: root,
    maxBuffer: 1024 * 1024 * 64,
  });
  const tail = (stdout || stderr || '').trim().split('\n').slice(-1)[0];
  if (tail) console.log('  ' + tail);
};

const main = async () => {
  const args = parseArgs();
  const slug = args.slug;

  // Resolve voice: explicit arg → video.json.voice → concept.json → cluster default → default.
  const voicesCfg = JSON.parse(await fs.readFile(path.join(root, 'config/voices.json'), 'utf8'));
  const videoPath = path.join(root, 'data', slug, 'video.json');
  const video = JSON.parse(await fs.readFile(videoPath, 'utf8'));
  let voiceKey = args.voice || video.voice;
  if (!voiceKey) {
    try {
      const concept = JSON.parse(await fs.readFile(path.join(root, 'data', slug, 'concept.json'), 'utf8'));
      voiceKey = concept.voice || voicesCfg.clusterDefaults?.[concept.cluster];
    } catch {
      /* no concept.json */
    }
  }
  voiceKey = voiceKey || voicesCfg.default;
  const voice = voicesCfg.voices[voiceKey];
  if (!voice) throw new Error(`Unknown voice key "${voiceKey}"`);
  const masterStrength = voice.master_strength || 'balanced';

  const voRaw = `public/audio/${slug}/vo.mp3`;
  const voMaster = `public/audio/${slug}/vo-master.wav`;
  const captions = `data/${slug}/captions.json`;
  const output = `out/${slug}.mp4`;

  console.log(`Building "${slug}" with voice "${voiceKey}" (${voice.voice_id}, master: ${masterStrength})`);

  await run('voiceover (ElevenLabs API)', 'voiceover.mjs', ['--input', `data/${slug}/script.txt`, '--output', voRaw, '--voice', voiceKey]);
  await run('master-voice', 'master-voice.mjs', ['--input', voRaw, '--output', voMaster, '--strength', masterStrength]);
  await run('captions (whisper)', 'generate-captions.mjs', ['--input', voRaw, '--output', captions]);
  await run('retime to VO', 'retime.mjs', ['--video', `data/${slug}/video.json`, '--audio', voMaster]);
  await run('render', 'render-video.mjs', ['--input', `data/${slug}/video.json`, '--output', output]);

  console.log(`\n✅ Built ${output} — ready for qa-video + delivery.`);
};

main().catch((error) => {
  console.error('\n✖ build failed: ' + (error.message ?? error));
  process.exit(1);
});
