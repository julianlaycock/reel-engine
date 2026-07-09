#!/usr/bin/env node
// canon-brief.mjs — compile the brand's enforced spec into an imperative brief
// for the build/concept prompt. This is the INJECTION half of the loop: instead
// of trusting the builder to remember a doc, the CURRENT canon.yml is compiled
// into context on every run, so recent rule changes always apply. The gate
// (check-canon.mjs) then verifies the output against the same spec.
//
// Usage: node reel-engine/scripts/canon-brief.mjs --brand vektor
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {resolveBrand} from '../lib/brand.mjs';

const require = createRequire(import.meta.url);
const YAML = require('js-yaml');

const brandArg = (() => {
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 1) if (a[i] === '--brand' || a[i] === '-b') return a[i + 1];
  return undefined;
})();

const brand = resolveBrand(brandArg);
process.chdir(brand.brandRoot);
const canon = YAML.load(fs.readFileSync(path.join('canon', 'canon.yml'), 'utf8'));
const zone = JSON.parse(fs.readFileSync(path.join('canon', 'americana-tokens.json'), 'utf8')).layout.platformSafeZone;

const sev = (block) => (block?.severity === 'blocker' ? 'BLOCKER' : 'warn');
const L = [];
L.push(`CANON BRIEF · ${brand.name} · spec v${canon.version}  (compiled live from canon/canon.yml)`);
L.push('Follow every rule below. The canon gate BLOCKS the video on any BLOCKER violation.');
L.push('');
L.push(`FORMAT [${sev(canon.format)}]: ${canon.format.width}x${canon.format.height} @ ${canon.format.fps}fps.`);
L.push(`DURATION [${sev(canon.duration)}]: ${canon.duration.minSec}-${canon.duration.maxSec}s hard; target ${canon.duration.targetMinSec}-${canon.duration.targetMaxSec}s.`);
if (canon.transcript) L.push(`TRANSCRIPT [${sev(canon.transcript)}]: if the concept is transcript-based (concept.json source_type:"transcript" or transcript_verbatim:true), reproduce the SOURCE's content/structure/hook + human flow but LIGHTLY REWORD into original wording (not a word-for-word copy — minor tweaks, keep the natural flow). EXEMPT from the duration cap. FACTS-POLICY OVERRIDDEN (trust the source, no facts.json/check-facts). ALWAYS adapt the brand layer to Vektor: CTA/keyword+funnel, skin, voice, disclaimer. Footage-rights + safe-zone still apply.`);
L.push(`SKIN [${sev(canon.skin)}]: ${canon.skin.required}.`);
L.push(`CHROME [${sev(canon.chrome)}]: masthead/chrome on every slide; fields ${(canon.chrome.requireFields || []).join('+')}.`);
L.push(`AUDIO [${sev(canon.audio)}]: voiceover required; NO transition SFX (music bed + VO only, sfx:false).`);
L.push(`SAFE ZONE [${sev(canon.safeZone)}]: all on-screen elements inside top ${zone.topPx} / bottom ${zone.bottomPx} / sides ${zone.sidePx} / rail-right ${zone.railRightPx}px (rail band y ${zone.railBandY[0]}-${zone.railBandY[1]}). Mascot: xPct ~20-62, yPct ~25-66, size <= 160.`);
L.push(`FRAME-0 [${sev(canon.frameZero)}]: scene[0] must have VO copy and instant payoff (no static hold).`);
if (canon.pacing) L.push(`PACING [${sev(canon.pacing)}]: reading-time floor per scene = max(${canon.pacing.hardFloorSec}s, visibleChars/${canon.pacing.cps}cps + ${canon.pacing.glanceBufferSec}s glance buffer). Fit length by TRIMMING WORDS, never by speeding the read (atempo > 1.1x banned). Shared math: ${canon.pacing.enforcedBy || 'scripts/lib/reading-time.mjs'}.`);
if (canon.wordmark) L.push(`WORDMARK [${sev(canon.wordmark)}]: endCard.wordmarkMotion MUST be one of [${(canon.wordmark.allowed || []).join(', ')}] — unapproved reveals are gate-blocked. Set the rotation pick at authoring time; log it in the video registry.`);
if (canon.voice) L.push(`VOICE [${sev(canon.voice)}]: the narrator voice is FINGERPRINT-SEALED (${canon.voice.file}; gate: ${canon.voice.enforcedBy || 'check-goldens.mjs'}). NEVER change voice settings — a founder unlock updates voices.json AND canon.yml#voice.fingerprint together. Scripts: spoken connective flow (and-joins, no ellipsis stops) + phonetic tokens for tricky reads; ear-reference ${canon.voice.reference || 'n/a'}.`);
if (canon.voice?.tags) L.push(`VO EXPRESSION [${sev(canon.voice.tags)}]: context-aware delivery via eleven_v3 audio tags — every scene carries voTag from [${(canon.voice.tags.allowed || []).join(', ')}] (${canon.voice.tags.mapping || ''}). vo stays CLEAN (no inline [tags]); data/<slug>/script.txt is COMPOSED by compose-script.mjs from video.json (never hand-edit — the gate diffs it). ONE ElevenLabs call for the whole script (v3 has no stitching). Tagged ear-reference: ${canon.voice.tags.referenceTagged || 'n/a'}.`);
if (canon.templates) L.push(`TEMPLATES [${sev(canon.templates)}]: THE HARD MENU — every scene in video.json MUST declare template: <id> from ${canon.templates.registry}. Any scene field outside the template's whitelist, a parked/unregistered id, or a binds/constraint violation is GATE-BLOCKED (zero freestyle compositions). New templates enter ONLY via founder RENDER→SEE→LOCK; approved stills: ${canon.templates.stills}.`);
if (canon.goldens) L.push(`GOLDENS [${sev(canon.goldens)}]: layout is governed by the wireframe contract ${canon.goldens.contract} (master bands + per-kind envelopes; content never behind chrome/footer; caption line REQUIRED on every middle slide). Pixel-stable regions are diffed against ${canon.goldens.goldensDir} by check-goldens.mjs.`);
if (canon.distinctiveElements) L.push(`DISTINCTIVE ELEMENT [${sev(canon.distinctiveElements)}]: add ONE optional distinctive element by the video's type (screenshot / screen-recording / animation / source-receipt / split-screen), ON by default, offered in the pitch as a one-line opt-out. Rights-clean sources ONLY (own capture / official press / PD-CC0-CC-BY / on-topic ASCII; never others' clips-as-footage, never unverified people/logos from stock, never CC-BY-SA); cite every stat/screenshot on-frame. See canon/DISTINCTIVE-ELEMENTS.md. Base skin canon untouched.`);
L.push('');
L.push('After building, run: node ../reel-engine/scripts/check-canon.mjs --brand ' + brand.name + ' --slug <slug>');

process.stdout.write(L.join('\n') + '\n');
