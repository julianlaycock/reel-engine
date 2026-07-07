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
if (canon.transcript) L.push(`TRANSCRIPT [${sev(canon.transcript)}]: if the concept is transcript-based (concept.json source_type:"transcript" or transcript_verbatim:true), the SOURCE TRANSCRIPT is the script — reproduce its content/claims/hook 1:1, NO trimming/paraphrase; EXEMPT from the duration cap. FACTS-POLICY is OVERRIDDEN (trust the source, no facts.json/check-facts). ALWAYS adapt the brand layer to Vektor: CTA/keyword+funnel, skin, voice, disclaimer. Footage-rights + safe-zone still apply.`);
L.push(`SKIN [${sev(canon.skin)}]: ${canon.skin.required}.`);
L.push(`CHROME [${sev(canon.chrome)}]: masthead/chrome on every slide; fields ${(canon.chrome.requireFields || []).join('+')}.`);
L.push(`AUDIO [${sev(canon.audio)}]: voiceover required; NO transition SFX (music bed + VO only, sfx:false).`);
L.push(`SAFE ZONE [${sev(canon.safeZone)}]: all on-screen elements inside top ${zone.topPx} / bottom ${zone.bottomPx} / sides ${zone.sidePx} / rail-right ${zone.railRightPx}px (rail band y ${zone.railBandY[0]}-${zone.railBandY[1]}). Mascot: xPct ~20-62, yPct ~25-66, size <= 160.`);
L.push(`FRAME-0 [${sev(canon.frameZero)}]: scene[0] must have VO copy and instant payoff (no static hold).`);
L.push('');
L.push('After building, run: node ../reel-engine/scripts/check-canon.mjs --brand ' + brand.name + ' --slug <slug>');

process.stdout.write(L.join('\n') + '\n');
