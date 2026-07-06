// Watcher: read the founder's WhatsApp pick for today's pitch, then build + QA +
// deliver the chosen video — all in Node (no LLM), so it's robust in a 10-min cron.
// The only LLM step in the whole system is the morning /content-pitch generation.
//
// Reads:  data/pitches/<today>.json (manifest from the pitch)
// Writes: data/pitches/<today>.state.json (lock + result), data/pitches/_produced.jsonl
// Usage:  node scripts/content-watch.mjs
import {execFile} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileP = promisify(execFile);
const root = process.cwd();
const today = () => new Date().toISOString().slice(0, 10);

const log = (m) => console.log(`[watch ${new Date().toISOString()}] ${m}`);

const readPick = (cfg, afterIso) => {
  const db = new DatabaseSync(cfg.whatsapp_db, {readOnly: true});
  const chat = cfg.whatsapp_read_jid || `${cfg.whatsapp_recipient}@s.whatsapp.net`;
  const rows = db
    .prepare("SELECT timestamp AS ts, content FROM messages WHERE chat_jid = ? ORDER BY timestamp DESC LIMIT 15")
    .all(chat);
  // newest first; find the most recent standalone 1-4 sent after the pitch.
  const afterMs = afterIso ? Date.parse(afterIso) : 0;
  for (const r of rows) {
    if (afterMs && r.ts && Date.parse(r.ts) < afterMs) continue;
    const m = (r.content || '').trim().match(/^\s*([1-4])\b(.*)$/s);
    if (m) return {n: parseInt(m[1], 10), tweak: m[2].trim()};
    if (/^\s*(skip|none|no)\b/i.test(r.content || '')) return {skip: true};
  }
  return null;
};

const objectiveQA = async (mp4) => {
  const {stdout} = await execFileP('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1', mp4,
  ]);
  const w = +(stdout.match(/width=(\d+)/)?.[1] || 0);
  const h = +(stdout.match(/height=(\d+)/)?.[1] || 0);
  const dur = +(stdout.match(/duration=([\d.]+)/)?.[1] || 0);
  const {stdout: ao} = await execFileP('ffprobe', [
    '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', mp4,
  ]).catch(() => ({stdout: ''}));
  const hasAudio = ao.trim().length > 0;
  const pass = w === 1080 && h === 1920 && hasAudio && dur > 8;
  return {pass, w, h, dur: Math.round(dur), hasAudio};
};

const main = async () => {
  const cfg = JSON.parse(await fs.readFile(path.join(root, 'config/content-engine.json'), 'utf8'));
  const date = today();
  const manifestPath = path.join(root, 'data/pitches', `${date}.json`);
  const statePath = path.join(root, 'data/pitches', `${date}.state.json`);

  if (!fssync.existsSync(manifestPath)) return log('no pitch manifest today — nothing to watch.');
  if (fssync.existsSync(statePath)) {
    const st = JSON.parse(await fs.readFile(statePath, 'utf8'));
    if (st.builtAt || st.skipped || st.failed || st.claimedAt) return log('already handled today.');
  }

  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.concepts) || manifest.concepts.length === 0) {
    await execFileP('node', [path.join(root, 'scripts/wa-send.mjs'), '--message', "⚠️ Today's pitch manifest has no concepts — re-run /content-pitch."]).catch(() => {});
    return log('manifest has no concepts array.');
  }
  // Guard against picking a stale 1-4 from a previous day: never look before the
  // pitch was sent (or, if sentAt is missing, before the start of today).
  const after = manifest.sentAt || `${date}T00:00:00.000Z`;
  const pick = readPick(cfg, after);
  if (!pick) return log('no valid pick yet.');
  if (pick.skip) {
    await fs.writeFile(statePath, JSON.stringify({skipped: true, at: new Date().toISOString()}, null, 2));
    return log('founder skipped today.');
  }

  const concept = manifest.concepts.find((c) => c.n === pick.n);
  if (!concept) return log(`pick ${pick.n} not in manifest.`);
  const slug = concept.slug;

  // claim immediately (lock against the next cron tick)
  await fs.writeFile(statePath, JSON.stringify({claimed: pick.n, slug, claimedAt: new Date().toISOString(), tweak: pick.tweak || null}, null, 2));
  log(`pick ${pick.n} → "${slug}". building…`);
  if (pick.tweak) await execFileP('node', [path.join(root, 'scripts/wa-send.mjs'), '--message', `Building #${pick.n} now. (Note: your tweak "${pick.tweak}" isn't auto-applied in v1 — the base concept builds.)`]).catch(() => {});

  try {
    await execFileP('node', [path.join(root, 'scripts/build-concept.mjs'), '--slug', slug], {cwd: root, maxBuffer: 1 << 26, timeout: 9 * 60 * 1000});
  } catch (e) {
    // Mark failed (so it isn't retried every tick) and ping the founder.
    await fs.writeFile(statePath, JSON.stringify({failed: true, slug, error: String(e.message || e).slice(0, 300), at: new Date().toISOString()}, null, 2));
    await execFileP('node', [path.join(root, 'scripts/wa-send.mjs'), '--message', `⚠️ Build failed for "${slug}": ${String(e.message || e).slice(0, 200)}`]).catch(() => {});
    throw e;
  }

  // Pre-delivery revision gate: the /video-revise skill measures, vision-audits,
  // critic-pans, auto-fixes, and DELIVERS the bundle. Falls through to the direct
  // delivery below if the claude CLI can't run it — so a video always ships.
  const claudeCli = process.env.CLAUDE_CLI || 'C:\\Users\\julia\\AppData\\Roaming\\npm\\claude.cmd';
  if (fssync.existsSync(claudeCli)) {
    try {
      await execFileP(claudeCli, ['-p', `/video-revise ${slug}`, '--dangerously-skip-permissions'], {cwd: root, timeout: 14 * 60 * 1000, maxBuffer: 1 << 26});
      await fs.appendFile(path.join(root, 'data/pitches/_produced.jsonl'), JSON.stringify({date, slug, cluster: concept.cluster, title: concept.title, hook: concept.hook, revised: true}) + '\n');
      await fs.writeFile(statePath, JSON.stringify({picked: pick.n, slug, builtAt: new Date().toISOString(), revised: true, delivered: true}, null, 2));
      return log(`revised + delivered "${slug}" ✅`);
    } catch (e) {
      log(`revision gate could not run (${String(e.message || e).slice(0, 140)}); delivering directly.`);
    }
  }

  const mp4 = path.join(root, 'out', `${slug}.mp4`);
  const qa = await objectiveQA(mp4);
  log(`QA: ${qa.pass ? 'PASS' : 'FAIL'} (${qa.w}x${qa.h}, ${qa.dur}s, audio:${qa.hasAudio})`);

  // Build the copy-paste bundle: a post checklist, the ready-to-paste LinkedIn
  // post, and the first comment (with the link). Each in its own clean message.
  const W = path.join(root, 'scripts/wa-send.mjs');
  const readOpt = async (f, fb = '') => {
    try { return (await fs.readFile(path.join(root, 'data', slug, f), 'utf8')).trim(); }
    catch { return fb; }
  };
  const linkedin = await readOpt('linkedin.txt', `${concept.hook || ''}\n\n${concept.title}`);
  const comment = await readOpt('comment.txt', 'The 2-minute automation scorecard → https://www.caelithlabs.com/automation-maturity-audit.html');
  const checklist =
    `✅ Today's video — "${concept.title}"\n` +
    `QA ${qa.pass ? 'PASS' : 'CHECK'} · ${qa.w}x${qa.h} · ${qa.dur}s\n\n` +
    `Post from your PERSONAL profile (not the company page) · best Tue–Thu 9–11 CET:\n` +
    `1. Upload the video natively to LinkedIn — no YouTube link\n` +
    `2. Paste the LinkedIn post (next message)\n` +
    `3. First comment = the conversation-starter (next message). NO raw link — links are penalised in 2026. The scorecard lives in your Featured + your DMs.\n` +
    `4. Golden hour: reply to every comment within 15 min for the first 60–90 min\n` +
    `5. DM everyone who engages — value-first, then send the scorecard/build.`;

  // If the WhatsApp bridge is down the video is still built on disk — record that
  // so the founder can resend, and don't crash (the build itself succeeded).
  let delivered = true;
  try {
    await execFileP('node', [W, '--file', mp4], {timeout: 120000});
    await execFileP('node', [W, '--message', checklist], {timeout: 60000});
    await execFileP('node', [W, '--message', `📋 LinkedIn post — copy & paste:\n\n${linkedin}`], {timeout: 60000});
    await execFileP('node', [W, '--message', `💬 First comment (paste under the post):\n\n${comment}`], {timeout: 60000});
  } catch (e) {
    delivered = false;
    log(`delivery failed (video built at out/${slug}.mp4): ${e.message || e}`);
  }

  await fs.appendFile(path.join(root, 'data/pitches/_produced.jsonl'), JSON.stringify({date, slug, cluster: concept.cluster, title: concept.title, hook: concept.hook, qa: qa.pass}) + '\n');
  await fs.writeFile(statePath, JSON.stringify({picked: pick.n, slug, builtAt: new Date().toISOString(), qa, delivered}, null, 2));
  log(delivered ? `delivered "${slug}" ✅` : `built "${slug}" — delivery failed, file on disk`);
};

main().catch((e) => {
  console.error(`[watch] ERROR: ${e.message ?? e}`);
  process.exit(1);
});
