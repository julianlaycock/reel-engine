// One-off: list ElevenLabs voices available to this account with their labels,
// so we can pick valid voice_ids (e.g. British males). Reads ELEVENLABS_API_KEY
// from .env. Usage: node scripts/list-voices.mjs [filterAccent]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = process.cwd();
try {
  const raw = fs.readFileSync(path.join(root, '.env'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error('no ELEVENLABS_API_KEY');
const filter = (process.argv[2] || '').toLowerCase();

const res = await fetch('https://api.elevenlabs.io/v1/voices', {headers: {'xi-api-key': key}});
const data = await res.json();
for (const v of data.voices || []) {
  const l = v.labels || {};
  const row = `${v.voice_id}\t${v.name}\t${l.accent || '-'}\t${l.gender || '-'}\t${l.age || '-'}\t${l.descriptive || l.description || l.use_case || ''}`;
  if (!filter || row.toLowerCase().includes(filter)) console.log(row);
}
