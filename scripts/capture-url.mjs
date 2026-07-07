#!/usr/bin/env node
// Capture a web page to PNG via headless Edge — for AUTHORITY/TOOL screenshots of
// tool sites, GitHub, Product Hunt, Hugging Face, etc. Works on most pages.
// NOTE: bot-protected stat sources (Gartner, Reuters, Bloomberg) serve a
// "verify you're human" wall to headless browsers — those need a manual
// screenshot. The build/revise VISION audit must validate any capture before it ships.
//
// Usage: node scripts/capture-url.mjs <url> <out.png> [--w 1200] [--h 1400]
import {execFile} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';

const execFileP = promisify(execFile);
const EDGES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const main = async () => {
  const a = process.argv.slice(2);
  const url = a[0];
  const out = a[1] ? path.resolve(a[1]) : a[1]; // Edge writes --screenshot relative to ITS cwd; force absolute
  if (!url || !out) throw new Error('Usage: node scripts/capture-url.mjs <url> <out.png> [--w N] [--h N]');
  const w = a.includes('--w') ? a[a.indexOf('--w') + 1] : '1200';
  const h = a.includes('--h') ? a[a.indexOf('--h') + 1] : '1400';
  const scale = a.includes('--scale') ? a[a.indexOf('--scale') + 1] : '2'; // 1 = exact px, 2 = retina
  const edge = EDGES.find((p) => fs.existsSync(p));
  if (!edge) throw new Error('Edge not found (headless capture unavailable).');

  await execFileP(
    edge,
    [`--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'edgecap-'))}`, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', `--force-device-scale-factor=${scale}`, ...(a.includes('--transparent') ? ['--default-background-color=00000000'] : []), '--virtual-time-budget=9000', `--screenshot=${out}`, `--window-size=${w},${h}`, url],
    {timeout: 90000},
  );
  // Edge's launcher process can return before the headless child flushes the
  // PNG to disk, so poll for the file (and for it to stop growing) before failing.
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let last = -1;
  for (let i = 0; i < 30; i += 1) {
    if (fs.existsSync(out)) {
      const sz = fs.statSync(out).size;
      if (sz > 0 && sz === last) break; // stable size → done writing
      last = sz;
    }
    await sleep(500);
  }
  if (!fs.existsSync(out)) throw new Error('no screenshot produced');
  const bytes = fs.statSync(out).size;
  // Crude hint only — the real check is the vision audit reading the image.
  console.log(JSON.stringify({out, bytes, hint: bytes < 90000 ? 'small file — may be a bot-check wall; VERIFY the image before using' : 'ok'}));
};

main().catch((e) => {
  console.error(String(e.message || e));
  process.exit(1);
});
