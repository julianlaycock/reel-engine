#!/usr/bin/env node
// compose-script.mjs — generate data/<slug>/script.txt FROM video.json (the
// context-aware VO law, 2026-07-09). The script is no longer hand-authored:
// scene.vo (clean) + scene.voTag (approved eleven_v3 audio tag) compose it, so
// narration can never drift from the scenes and tags can never leak into
// captions or reading-time math. check-goldens re-composes and diffs (blocker).
//
// Usage: node ../reel-engine/scripts/compose-script.mjs --slug <slug>   (from the brand root)
import fs from 'node:fs';
import path from 'node:path';
import {composeScript, validateVoTags, APPROVED_VO_TAGS} from './lib/vo-script.mjs';

const args = process.argv.slice(2);
let slug;
for (let i = 0; i < args.length; i += 1) if (args[i] === '--slug' || args[i] === '-s') slug = args[++i];
if (!slug) throw new Error('Usage: compose-script.mjs --slug <slug>');

const dir = path.join('data', slug);
const video = JSON.parse(fs.readFileSync(path.join(dir, 'video.json'), 'utf8'));

const fails = validateVoTags(video);
if (fails.length) {
  console.error('✖ voTag validation failed:\n  ' + fails.join('\n  '));
  console.error(`  approved tags: ${APPROVED_VO_TAGS.join(', ')}`);
  process.exit(1);
}

const script = composeScript(video);
fs.writeFileSync(path.join(dir, 'script.txt'), script);
const tagged = (video.scenes || []).filter((sc) => sc.voTag).length;
console.log(`Composed ${path.join(dir, 'script.txt')} — ${(video.scenes || []).filter((sc) => sc.vo).length} beats, ${tagged} tagged (${script.length} chars, one v3 call)`);
