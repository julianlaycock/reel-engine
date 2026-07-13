#!/usr/bin/env node
// compose-script.mjs — generate data/<slug>/script.txt FROM video.json (the
// context-aware VO law, 2026-07-09; audio-tag system REMOVED 2026-07-13). The
// script is no longer hand-authored: each scene's clean `vo` line composes it,
// so narration can never drift from the scenes. The pronunciation map respells
// known problem-words (e.g. markdown -> mark down) in the spoken text. NO audio
// tags are injected — they were the voice-drift source. check-goldens re-composes
// and diffs, and BLOCKS if any [tag] reappears.
//
// Usage: node ../reel-engine/scripts/compose-script.mjs --slug <slug>   (from the brand root)
import fs from 'node:fs';
import path from 'node:path';
import {composeScript, findAudioTags} from './lib/vo-script.mjs';

const args = process.argv.slice(2);
let slug;
for (let i = 0; i < args.length; i += 1) if (args[i] === '--slug' || args[i] === '-s') slug = args[++i];
if (!slug) throw new Error('Usage: compose-script.mjs --slug <slug>');

const dir = path.join('data', slug);
const video = JSON.parse(fs.readFileSync(path.join(dir, 'video.json'), 'utf8'));

const script = composeScript(video);

const tags = findAudioTags(script);
if (tags.length) {
  console.error('✖ composed script contains audio tag(s): ' + tags.join(', '));
  console.error('  the [voTag] audio-tag system was removed 2026-07-13 — strip any [tags] from the scene vo fields.');
  process.exit(1);
}

fs.writeFileSync(path.join(dir, 'script.txt'), script);
const beats = (video.scenes || []).filter((sc) => sc.vo).length;
console.log(`Composed ${path.join(dir, 'script.txt')} — ${beats} beats (${script.length} chars, one ElevenLabs call, no audio tags)`);
