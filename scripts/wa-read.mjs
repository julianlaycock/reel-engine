// Read recent WhatsApp messages straight from the bridge's SQLite store. The
// whatsapp MCP `list_messages` has an output-validation bug, so the watcher reads
// the DB directly — more robust for unattended cron use. Sending still uses the MCP.
//
// Usage: node scripts/wa-read.mjs [--chat <jid>] [--limit 10] [--after "2026-06-26 10:00:00"]
//   defaults: chat = <whatsapp_recipient>@s.whatsapp.net (from config), limit 10
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = process.cwd();
const DEFAULT_DB = 'C:/Users/julia/whatsapp-mcp/whatsapp-bridge/store/messages.db';

const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {limit: 10};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--chat') p.chat = a[++i];
    else if (a[i] === '--limit') p.limit = parseInt(a[++i], 10);
    else if (a[i] === '--after') p.after = a[++i];
    else if (a[i] === '--db') p.db = a[++i];
  }
  return p;
};

const main = async () => {
  const args = parseArgs();
  const cfg = JSON.parse(await fs.readFile(path.join(root, 'config/content-engine.json'), 'utf8'));
  const dbPath = args.db || cfg.whatsapp_db || DEFAULT_DB;
  const chat = args.chat || cfg.whatsapp_read_jid || `${cfg.whatsapp_recipient}@s.whatsapp.net`;

  const db = new DatabaseSync(dbPath, {readOnly: true});
  const cols = db.prepare('PRAGMA table_info(messages)').all().map((c) => c.name);
  const pick = (...cands) => cands.find((c) => cols.includes(c));
  const tsCol = pick('timestamp', 'time', 'created_at');
  const contentCol = pick('content', 'text', 'body', 'message');
  const fromMeCol = pick('is_from_me', 'from_me', 'fromMe');
  const senderCol = pick('sender', 'sender_jid', 'from');
  const chatCol = pick('chat_jid', 'chat', 'jid');

  let sql = `SELECT ${tsCol} AS ts, ${contentCol} AS content, ${fromMeCol} AS from_me, ${senderCol} AS sender FROM messages WHERE ${chatCol} = ?`;
  const params = [chat];
  if (args.after) {
    sql += ` AND ${tsCol} > ?`;
    params.push(args.after);
  }
  sql += ` ORDER BY ${tsCol} DESC LIMIT ?`;
  params.push(args.limit);

  const rows = db.prepare(sql).all(...params);
  // newest last for readability
  console.log(JSON.stringify(rows.reverse(), null, 2));
};

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
