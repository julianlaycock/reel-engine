#!/usr/bin/env node
// Programmatic voiceover via the ElevenLabs API — turns a script into vo.mp3 for
// a configured voice, with zero manual recording. This is what makes the daily
// build hands-off. Voice presets live in config/voices.json.
//
// Usage:
//   npm run voiceover -- --input data/<slug>/script.txt --output public/audio/<slug>/vo.mp3 --voice story
//   npm run voiceover -- --text "hello" --output out/test.mp3 --voice-id <id> --model eleven_v3
//
// Long-script STITCHING (2026-07-13): sending a whole ~60s script in ONE request
// makes eleven_multilingual_v2 whisper/drift past ~800 chars (documented). So a
// long script is split into sentence chunks (<~600 chars) and generated one chunk
// at a time, each conditioned on the PRIOR chunk via `previous_request_ids` (the
// `request-id` response header) so prosody stays continuous. The chunk audio is
// concatenated in order. Short text keeps the single-call path.
//
// NATIVE SPEED (2026-07-13): for v2-family models we pass `speed` inside
// voice_settings (ElevenLabs renders the pace at synthesis time) and DROP the
// ffmpeg atempo — atempo time-stretches and thins soft passages. atempo is kept
// only as a fallback for models that don't support voice_settings.speed (e.g. v3).
//
// Needs ELEVENLABS_API_KEY (process.env or a local .env in the engine root).
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileP = promisify(execFile);

const root = process.cwd();

// A script longer than this (chars) is generated chunk-by-chunk with request
// stitching; shorter text uses the single-call path. ~800 is where v2 starts to
// drift, so we chunk well under it.
const STITCH_THRESHOLD = 800;
const MAX_CHUNK = 600; // max chars per stitched chunk (well under the drift point)

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
    else if (a === '--stitch') p.stitch = 'on';
    else if (a === '--no-stitch') p.stitch = 'off';
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
  const requested = args.voiceKey ?? cfg.default;
  let key = requested;
  let v = cfg.voices?.[key];
  if (!v) {
    // Locked-voice policy (2026-07-14): a stale/retired/unknown voice key falls back to
    // the canonical default (the one locked vektor voice) instead of erroring — no build
    // can accidentally select, or fail for lack of, a preset that no longer exists.
    key = cfg.default;
    v = cfg.voices?.[key];
    if (v) console.warn(`Voice "${requested}" not found — falling back to the locked default voice "${key}".`);
  }
  if (!v) {
    throw new Error(`Unknown voice key "${requested}" and no usable default. Known: ${Object.keys(cfg.voices ?? {}).join(', ')}`);
  }
  if (!v.voice_id || v.voice_id.startsWith('REPLACE_')) {
    throw new Error(`Voice "${key}" has no real voice_id yet — set it in config/voices.json.`);
  }
  return v;
};

// v2-family models (eleven_multilingual_v2, eleven_turbo_v2, eleven_flash_v2, …)
// support `speed` in voice_settings. eleven_v3 does not — it falls back to atempo.
const supportsNativeSpeed = (model = '') => /_v2(?:_|$)/.test(model);

// Split a script into ~sentence chunks, then greedily pack them up to MAX_CHUNK
// chars so each stitched request is short enough to avoid v2 drift while still
// carrying whole sentences (so intra-chunk punctuation pauses are preserved).
const splitIntoChunks = (text, max = MAX_CHUNK) => {
  const sentences = [];
  for (const para of text.split(/\n{2,}/)) {
    const t = para.trim();
    if (!t) continue;
    // Keep the sentence-ending punctuation with the sentence.
    const parts = t.match(/[^.!?]*[.!?]+["')\]]*|\S[^.!?]*$/g) || [t];
    for (const raw of parts) {
      const s = raw.trim();
      if (s) sentences.push(s);
    }
  }
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if (!cur) cur = s;
    else if (cur.length + 1 + s.length <= max) cur += ' ' + s;
    else {
      chunks.push(cur);
      cur = s;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
};

// One TTS request → { buf, requestId }. requestId comes from the `request-id`
// response header and is fed to the next chunk via previous_request_ids.
const generateChunk = async ({apiKey, voiceId, output_format, body}) => {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${output_format}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs API ${res.status}: ${errText.slice(0, 400)}`);
  }
  const requestId = res.headers.get('request-id') || null;
  const buf = Buffer.from(await res.arrayBuffer());
  return {buf, requestId};
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
  await fs.mkdir(path.dirname(output), {recursive: true});

  const model = args.model ?? v.model_id;
  const seed = (args.seed ?? v.seed) != null ? parseInt(args.seed ?? v.seed, 10) : null;
  const speed = args.speed ? parseFloat(args.speed) : v.speed;
  const nativeSpeed = speed && Math.abs(speed - 1) > 0.001 && supportsNativeSpeed(model);

  // voice_settings shared by every chunk (same voice → continuous prosody).
  const voiceSettings = {
    stability: v.stability ?? 0.5,
    similarity_boost: v.similarity_boost ?? 0.8,
    style: v.style ?? 0,
    use_speaker_boost: v.use_speaker_boost ?? true,
    ...(nativeSpeed ? {speed} : {}),
  };
  const baseBody = {
    model_id: model,
    ...(seed != null ? {seed} : {}),
    voice_settings: voiceSettings,
  };

  // Auto-stitch is a v2-family fix (v2 whispers/drifts past ~800 chars). eleven_v3
  // handles long scripts in one call (the karpathy winner was a single ~67s call) and
  // does not use request-stitching, so v3 NEVER auto-stitches — only an explicit
  // --stitch forces it. This keeps the locked v3 voice on its proven single-call path.
  const wantStitch = args.stitch === 'on'
    || (args.stitch !== 'off' && text.length > STITCH_THRESHOLD && supportsNativeSpeed(model));
  const chunks = wantStitch ? splitIntoChunks(text) : [text];

  let finalBuf;
  if (chunks.length <= 1) {
    // Single-call path (short text, or stitching disabled).
    const {buf} = await generateChunk({
      apiKey,
      voiceId: v.voice_id,
      output_format: args.output_format,
      body: {...baseBody, text: chunks[0] ?? text},
    });
    finalBuf = buf;
  } else {
    // Stitched path: each chunk conditioned on the prior request ids.
    const tmpDir = `${output}.chunks`;
    await fs.rm(tmpDir, {recursive: true, force: true});
    await fs.mkdir(tmpDir, {recursive: true});
    const prevIds = [];
    const partFiles = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const {buf, requestId} = await generateChunk({
        apiKey,
        voiceId: v.voice_id,
        output_format: args.output_format,
        body: {
          ...baseBody,
          text: chunks[i],
          ...(prevIds.length ? {previous_request_ids: prevIds.slice(-3)} : {}),
        },
      });
      const part = path.join(tmpDir, `chunk-${String(i).padStart(3, '0')}.mp3`);
      await fs.writeFile(part, buf);
      partFiles.push(part);
      if (requestId) prevIds.push(requestId);
      console.log(`  chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars${requestId ? `, req ${requestId.slice(0, 8)}…` : ''})`);
    }
    // Concatenate the chunk mp3s in order, re-encoding once so mp3 frame
    // boundaries between chunks don't click or gap.
    const listFile = path.join(tmpDir, 'concat.txt');
    await fs.writeFile(
      listFile,
      partFiles.map((f) => `file '${f.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n') + '\n',
    );
    const joined = path.join(tmpDir, 'joined.mp3');
    await execFileP('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c:a', 'libmp3lame', '-q:a', '2', joined]);
    finalBuf = await fs.readFile(joined);
    await fs.writeFile(output, finalBuf);
    await fs.rm(tmpDir, {recursive: true, force: true});
    console.log(`  stitched ${chunks.length} chunks → ${path.relative(root, output)}`);
  }

  if (chunks.length <= 1) {
    await fs.writeFile(output, finalBuf);
  }

  // Speed handling:
  //  - v2-family with speed → already rendered natively in voice_settings (no atempo).
  //  - otherwise (e.g. v3) → atempo fallback (pitch-preserved time-stretch).
  if (speed && Math.abs(speed - 1) > 0.001 && !nativeSpeed) {
    const tmp = `${output}.spd.mp3`;
    await execFileP('ffmpeg', ['-y', '-i', output, '-filter:a', `atempo=${speed}`, '-c:a', 'libmp3lame', '-q:a', '2', tmp]);
    await fs.rm(output, {force: true});
    await fs.rename(tmp, output);
    console.log(`  sped ${speed}× (atempo fallback, pitch-preserved)`);
  } else if (nativeSpeed) {
    console.log(`  speed ${speed}× (native voice_settings.speed — no atempo)`);
  }

  const finalStat = await fs.stat(output);
  console.log(
    `Voiced ${(text.length / 1000).toFixed(1)}k chars → ${path.relative(root, output)} (voice ${v.voice_id}, model ${model}, ${(finalStat.size / 1024).toFixed(0)} KB${wantStitch && chunks.length > 1 ? `, stitched ×${chunks.length}` : ''})`,
  );
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
