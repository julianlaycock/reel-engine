#!/usr/bin/env node
// Vektor delivery — sends a built video + a per-platform post pack to the founder's
// WhatsApp via the local bridge (same path as Caelith). MCP-independent so it works
// headless in cron. The bridge process must be running on whatsapp_api.
//
// Usage: node scripts/deliver.mjs --slug wc-spain [--video out/wc-spain-s2.mp4] [--recipient <num>]
import {execFile} from 'node:child_process';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileP = promisify(execFile);
const root = process.cwd();

const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--slug' || a[i] === '-s') p.slug = a[++i];
    else if (a[i] === '--video' || a[i] === '-v') p.video = a[++i];
    else if (a[i] === '--recipient' || a[i] === '-r') p.recipient = a[++i];
  }
  if (!p.slug && !p.video) throw new Error('Usage: node scripts/deliver.mjs --slug <slug> [--video <path>]');
  return p;
};

const qa = async (mp4) => {
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
  return {w, h, dur: Math.round(dur), hasAudio, pass: w === 1080 && h === 1920 && hasAudio && dur > 8};
};

// Split post.md into [{heading, body}] on "## " section headers; the preamble
// (before the first ##) is the title line.
const parsePost = (md) => {
  const out = [];
  let title = '';
  const blocks = md.split(/\n##\s+/);
  title = blocks.shift().replace(/^#+\s+/, '').trim();
  for (const b of blocks) {
    const nl = b.indexOf('\n');
    out.push({heading: b.slice(0, nl).trim(), body: b.slice(nl + 1).trim()});
  }
  return {title, sections: out};
};

const main = async () => {
  const args = parseArgs();
  const cfg = JSON.parse(await fs.readFile(path.join(root, 'config/content-engine.json'), 'utf8'));
  const recipient = args.recipient || cfg.whatsapp_recipient;
  const base = cfg.whatsapp_api || 'http://localhost:8080/api';
  const slug = args.slug;
  const mp4 = path.resolve(root, args.video || `out/${slug}.mp4`);
  if (!fssync.existsSync(mp4)) throw new Error(`video not found: ${mp4}`);

  const send = async (payload) => {
    const res = await fetch(`${base}/send`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({recipient, ...payload}),
    });
    if (!res.ok) throw new Error(`bridge ${res.status}: ${await res.text()}`);
    const data = await res.json().catch(() => ({success: true}));
    if (data.success === false) throw new Error(`send failed: ${data.message}`);
  };

  const m = await qa(mp4);
  const variant = path.basename(mp4).replace(`${slug}`, '').replace(/^[-.]?|\.mp4$/g, '') || 'default';

  // Optional post pack
  let post = null;
  if (slug) {
    try {
      post = parsePost(await fs.readFile(path.join(root, 'data', slug, 'post.md'), 'utf8'));
    } catch {
      /* no post.md — deliver video + a minimal header */
    }
  }

  const header =
    `🟢 VEKTOR — new video ready${slug ? ` · "${slug}"` : ''}\n` +
    `QA ${m.pass ? 'PASS' : 'CHECK'} · ${m.w}x${m.h} · ${m.dur}s · audio:${m.hasAudio ? 'yes' : 'no'}\n` +
    (post?.title ? `\n${post.title}\n` : '') +
    `\nUpload the clean file NATIVELY to each platform (never a screen-recapture or another platform's watermark). Paste-ready captions per platform 👇\n` +
    `\n✅ On upload: toggle the platform's "AI-generated/altered content" label (the synthetic voice). Best window Tue–Thu ~9–11am; reply to early comments in the first hour.\n` +
    (cfg.disclaimer ? `\n⚠️ ${cfg.disclaimer}` : '');

  // Send video, then header, then one message per platform caption block.
  await send({media_path: mp4});
  await send({message: header});
  if (post) {
    const emoji = {
      'TikTok': '📱', 'Instagram Reels': '📷', 'YouTube Shorts': '▶️',
      'TikTok / Instagram Reels': '📱', 'First comment': '💬',
      'First comment (paste under the post)': '💬', 'LinkedIn': '💼',
    };
    for (const s of post.sections) {
      await send({message: `${emoji[s.heading] || '•'} ${s.heading}\n\n${s.body}`});
    }
  }

  console.log(`Delivered ${path.relative(root, mp4)} (${variant}) → ${recipient}`);
};

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
