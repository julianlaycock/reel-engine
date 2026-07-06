// Send a WhatsApp message or file by POSTing the bridge's local REST API directly
// (http://localhost:8080/api/send). MCP-independent → robust in headless cron runs.
// The bridge process must be running.
//
// Usage:
//   node scripts/wa-send.mjs --message "hello"
//   node scripts/wa-send.mjs --file "C:\\path\\to\\video.mp4"
//   (optional --recipient <number>; defaults to whatsapp_recipient from config)
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = process.cwd();

const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--message' || a[i] === '-m') p.message = a[++i];
    else if (a[i] === '--file' || a[i] === '-f') p.file = a[++i];
    else if (a[i] === '--message-file' || a[i] === '-M') p.messageFile = a[++i];
    else if (a[i] === '--recipient' || a[i] === '-r') p.recipient = a[++i];
  }
  if (!p.message && !p.file && !p.messageFile) throw new Error('Provide --message "...", --message-file <path>, or --file <path>');
  return p;
};

const main = async () => {
  const args = parseArgs();
  // --message-file lets long bodies (newsletter editions) be sent without shell-arg escaping.
  if (args.messageFile) args.message = await fs.readFile(path.resolve(args.messageFile), 'utf8');
  const cfg = JSON.parse(await fs.readFile(path.join(root, 'config/content-engine.json'), 'utf8'));
  const recipient = args.recipient || cfg.whatsapp_recipient;
  const base = cfg.whatsapp_api || 'http://localhost:8080/api';

  const payload = args.file
    ? {recipient, media_path: path.resolve(args.file)}
    : {recipient, message: args.message};

  const res = await fetch(`${base}/send`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`bridge ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!data.success) throw new Error(`send failed: ${data.message}`);
  console.log(`sent (${args.file ? 'file' : 'message'}) → ${recipient}: ${data.message}`);
};

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
