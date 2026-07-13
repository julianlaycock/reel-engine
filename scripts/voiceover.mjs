#!/usr/bin/env node
// Programmatic voiceover via the ElevenLabs API — turns a script into vo.mp3 for
// a configured voice, with zero manual recording. This is what makes the daily
// build hands-off. Voice presets live in config/voices.json.
//
// Usage:
//   npm run voiceover -- --input data/<slug>/script.txt --output public/audio/<slug>/vo.mp3 --voice story
//   npm run voiceover -- --text "hello" --output out/test.mp3 --voice-id <id> --model eleven_v3
//
// Needs ELEVENLABS_API_KEY (process.env or a local .env in the engine root).
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileP = promisify(execFile);

const root = process.cwd();

// Minimal .env loader (no dependency). Only sets keys not already in process.env.
const loadEnv = async () => {
  try {
    const raw = await fs.readFile(path.join(root, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* no .env — rely on process.env */
  }
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const p = {output_format: 'mp3_44100_128'};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--input' || a === '-i') p.input = args[++i];
    else if (a === '--text' || a === '-t') p.text = args[++i];
    else if (a === '--output' || a === '-o') p.output = args[++i];
    else if (a === '--voice' || a === '-v') p.voiceKey = args[++i];
    else if (a === '--voice-id') p.voiceId = args[++i];
    else if (a === '--model' || a === '-m') p.model = args[++i];
    else if (a === '--format' || a === '-f') p.output_format = args[++i];
    else if (a === '--speed') p.speed = args[++i];
    else if (a === '--stability') p.stability = args[++i];
    else if (a === '--style') p.style = args[++i];
    else if (a === '--similarity') p.similarity = args[++i];
    else if (a === '--seed') p.seed = args[++i];
  }
  if (!p.output || (!p.input && !p.text)) {
    throw new Error('Usage: npm run voiceover -- --input <script.txt> --output <vo.mp3> --voice <key>  (or --text / --voice-id)');
  }
  return p;
};

const resolveVoice = async (args) => {
  if (args.voiceId) {
    return {
      voice_id: args.voiceId,
      model_id: args.model ?? 'eleven_multilingual_v2',
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0,
      use_speaker_boost: true,
    };
  }
  const cfg = JSON.parse(await fs.readFile(path.join(root, 'config/voices.json'), 'utf8'));
  const key = args.voiceKey ?? cfg.default;
  const v = cfg.voices?.[key];
  if (!v) {
    throw new Error(`Unknown voice key "${key}". Known: ${Object.keys(cfg.voices ?? {}).join(', ')}`);
  }
  if (!v.voice_id || v.voice_id.startsWith('REPLACE_')) {
    throw new Error(`Voice "${key}" has no real voice_id yet — set it in config/voices.json.`);
  }
  return v;
};

const main = async () => {
  await loadEnv();
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set (env or .env).');
  }
  const args = parseArgs();
  const text = args.text ?? (await fs.readFile(path.resolve(root, args.input), 'utf8')).trim();
  const v = await resolveVoice(args);
  // Per-run voice_settings overrides (for A/B tuning naturalness).
  if (args.stability != null) v.stability = parseFloat(args.stability);
  if (args.style != null) v.style = parseFloat(args.style);
  if (args.similarity != null) v.similarity_boost = parseFloat(args.similarity);
  const output = path.resolve(root, args.output);

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${v.voice_id}?output_format=${args.output_format}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: args.model ?? v.model_id,
        ...((args.seed ?? v.seed) != null ? {seed: parseInt(args.seed ?? v.seed, 10)} : {}),
        voice_settings: {
          stability: v.stability ?? 0.5,
          similarity_boost: v.similarity_boost ?? 0.8,
          style: v.style ?? 0,
          use_speaker_boost: v.use_speaker_boost ?? true,
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs API ${res.status}: ${body.slice(0, 400)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(output), {recursive: true});
  await fs.writeFile(output, buf);

  // Optional tempo lift (atempo preserves pitch) so the whole pipeline — captions
  // + retime included — reflects a snappier pace. Driven by voices.json `speed`.
  const speed = args.speed ? parseFloat(args.speed) : v.speed;
  if (speed && Math.abs(speed - 1) > 0.001) {
    const tmp = `${output}.spd.mp3`;
    await execFileP('ffmpeg', ['-y', '-i', output, '-filter:a', `atempo=${speed}`, '-c:a', 'libmp3lame', '-q:a', '2', tmp]);
    await fs.rm(output, {force: true});
    await fs.rename(tmp, output);
    console.log(`  sped ${speed}× (atempo, pitch-preserved)`);
  }

  console.log(
    `Voiced ${(text.length / 1000).toFixed(1)}k chars → ${path.relative(root, output)} (voice ${v.voice_id}, model ${args.model ?? v.model_id}, ${(buf.length / 1024).toFixed(0)} KB)`,
  );
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
