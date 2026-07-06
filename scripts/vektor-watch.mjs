// Vektor watcher: read the founder's WhatsApp pick (1-4) for the latest pitch,
// build the chosen concept, and deliver it (video + per-platform post pack) to
// WhatsApp. Pure Node (no LLM) so it's robust in a 10-min cron tick.
//
// Reads:  data/pitches/<date>.<slot>.json (manifest from vektor-pitch)
// Writes: data/pitches/<date>.<slot>.state.json, data/pitches/_produced.jsonl
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
const log = (m) => console.log(`[vektor-watch ${new Date().toISOString()}] ${m}`);

const readPick = (cfg, afterIso) => {
  const db = new DatabaseSync(cfg.whatsapp_db, {readOnly: true});
  const chat = cfg.whatsapp_read_jid || `${cfg.whatsapp_recipient}@s.whatsapp.net`;
  const rows = db
    .prepare('SELECT timestamp AS ts, content FROM messages WHERE chat_jid = ? ORDER BY timestamp DESC LIMIT 15')
    .all(chat);
  const afterMs = afterIso ? Date.parse(afterIso) : 0;
  for (const r of rows) {
    if (afterMs && r.ts && Date.parse(r.ts) < afterMs) continue;
    const m = (r.content || '').trim().match(/^\s*([1-4])\b(.*)$/s);
    if (m) return {n: parseInt(m[1], 10), tweak: m[2].trim()};
    if (/^\s*(skip|none|no)\b/i.test(r.content || '')) return {skip: true};
  }
  return null;
};

// Newest unhandled manifest for today (handles the am + pm slots).
const latestManifest = async (dir, date) => {
  let files = [];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.startsWith(date) && f.endsWith('.json') && !f.endsWith('.state.json'));
  } catch {
    return null;
  }
  files.sort();
  for (const f of files.reverse()) {
    const statePath = path.join(dir, f.replace(/\.json$/, '.state.json'));
    if (fssync.existsSync(statePath)) {
      const st = JSON.parse(await fs.readFile(statePath, 'utf8'));
      if (st.builtAt || st.skipped || st.failed || st.claimedAt) continue;
    }
    return {manifestPath: path.join(dir, f), statePath};
  }
  return null;
};

const main = async () => {
  const cfg = JSON.parse(await fs.readFile(path.join(root, 'config/content-engine.json'), 'utf8'));
  const dir = path.join(root, 'data/pitches');
  const found = await latestManifest(dir, today());
  if (!found) return log('no unhandled pitch manifest — nothing to watch.');

  const manifest = JSON.parse(await fs.readFile(found.manifestPath, 'utf8'));
  if (!Array.isArray(manifest.concepts) || manifest.concepts.length === 0) return log('manifest has no concepts.');

  const after = manifest.sentAt || `${today()}T00:00:00.000Z`;
  const pick = readPick(cfg, after);
  if (!pick) return log('no valid pick yet.');
  if (pick.skip) {
    await fs.writeFile(found.statePath, JSON.stringify({skipped: true, at: new Date().toISOString()}, null, 2));
    return log('founder skipped this pitch.');
  }
  const concept = manifest.concepts.find((c) => c.n === pick.n);
  if (!concept) return log(`pick ${pick.n} not in manifest.`);
  const slug = concept.slug;

  await fs.writeFile(found.statePath, JSON.stringify({claimed: pick.n, slug, claimedAt: new Date().toISOString()}, null, 2));
  log(`pick ${pick.n} → "${slug}". building…`);

  try {
    await execFileP('node', [path.join(root, 'scripts/build-concept.mjs'), '--slug', slug], {cwd: root, maxBuffer: 1 << 26, timeout: 12 * 60 * 1000});
  } catch (e) {
    await fs.writeFile(found.statePath, JSON.stringify({failed: true, slug, error: String(e.message || e).slice(0, 300), at: new Date().toISOString()}, null, 2));
    await execFileP('node', [path.join(root, 'scripts/wa-send.mjs'), '--message', `⚠️ Vektor build failed for "${slug}": ${String(e.message || e).slice(0, 200)}`]).catch(() => {});
    throw e;
  }

  // --- Pre-delivery gates (Phase 2): copyright · data accuracy · technical. Escalate, never ship a failure. ---
  const gateFails = [];
  try { await execFileP('node', [path.join(root, 'scripts/check-footage-rights.mjs'), '--slug', slug], {cwd: root}); }
  catch { gateFails.push('footage-rights (copyright)'); }
  if (fssync.existsSync(path.join(root, 'data', slug, 'facts.json'))) {
    try { await execFileP('node', [path.join(root, 'scripts/check-facts.mjs'), '--slug', slug], {cwd: root}); }
    catch { gateFails.push('check-facts (data accuracy)'); }
  } else {
    log(`no facts.json for "${slug}" — accuracy gate skipped (add one if it has on-screen numbers)`);
  }
  try {
    const {stdout} = await execFileP('node', [path.join(root, 'scripts/qa-measure.mjs'), `out/${slug}.mp4`], {cwd: root, maxBuffer: 1 << 24});
    if (!/"pass":\s*true/.test(stdout)) gateFails.push('qa-measure (technical)');
  } catch { gateFails.push('qa-measure (errored)'); }

  if (gateFails.length) {
    await fs.writeFile(found.statePath, JSON.stringify({gated: true, slug, fails: gateFails, at: new Date().toISOString()}, null, 2));
    await execFileP('node', [path.join(root, 'scripts/wa-send.mjs'), '--message', `⚠️ Vektor "${slug}" built but FAILED pre-delivery gates: ${gateFails.join(', ')}. NOT delivered — needs a manual look.`]).catch(() => {});
    log(`GATED: "${slug}" failed ${gateFails.join(', ')} — not delivered`);
    return;
  }

  // Log the rotated method (so pick-method won't repeat it) + the prediction (for the
  // self-grading "Vektor vs the market" scoreboard). Best-effort.
  try {
    const cj = JSON.parse(await fs.readFile(path.join(root, 'data', slug, 'concept.json'), 'utf8'));
    if (cj.method) await fs.appendFile(path.join(root, 'data', '_method-log.jsonl'), JSON.stringify({slug, method: cj.method}) + '\n');
    if (cj.format) await fs.appendFile(path.join(root, 'data', '_format-log.jsonl'), JSON.stringify({slug, format: cj.format}) + '\n');
    if (cj.prediction) await execFileP('node', [path.join(root, 'scripts/scoreboard.mjs'), 'log', '--from-concept', slug], {cwd: root}).catch(() => {});
  } catch {}

  let delivered = true;
  try {
    await execFileP('node', [path.join(root, 'scripts/deliver.mjs'), '--slug', slug], {cwd: root, timeout: 4 * 60 * 1000, maxBuffer: 1 << 26});
  } catch (e) {
    delivered = false;
    log(`delivery failed (video built at out/${slug}.mp4): ${e.message || e}`);
  }

  await fs.appendFile(path.join(dir, '_produced.jsonl'), JSON.stringify({date: today(), slug, franchise: concept.franchise, title: concept.title, delivered}) + '\n');
  await fs.writeFile(found.statePath, JSON.stringify({picked: pick.n, slug, builtAt: new Date().toISOString(), delivered}, null, 2));
  log(delivered ? `delivered "${slug}" ✅` : `built "${slug}" — delivery failed, file on disk`);
};

main().catch((e) => {
  console.error(`[vektor-watch] ERROR: ${e.message ?? e}`);
  process.exit(1);
});
