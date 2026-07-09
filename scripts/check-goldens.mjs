#!/usr/bin/env node
// check-goldens.mjs — the GOLDEN GATE (pixel + structural drift stop).
//
// "Rules in prose keep failing; the pixel truth needs a contract + an automated
// diff gate" (founder, 2026-07-08). Three layers, honest about what each can see:
//
//   1. GOLDEN REGIONS (pixel-diff) — only regions that are PIXEL-STABLE across
//      videos are diffed: the masthead/chrome band (wordmark side; the per-beat
//      acid marker on the right is excluded by the crop) and the end-card
//      wordmark LOCKUP (the crop excludes the per-issue jacquard word, CTA text,
//      issue line; the veiled per-video ascii still bleeds faintly into the
//      background, hence its wider tolerance). Goldens live in
//      <brand>/canon/goldens/<region>.png, seeded from the founder-approved cut
//      (--seed). CONTENT AREAS ARE NOT PIXEL-DIFFED — headlines, panels, ascii
//      art and stats vary per video by design; those are governed structurally
//      by the wireframe contract (layer 3) and subjectively by the canon-judge.
//
//   2. VOICE FINGERPRINT — sha256 of the canonical JSON of
//      config/voices.json#voices.vektor (master_strength, model_id,
//      similarity_boost, speed, stability, style; keys sorted) vs
//      canon/canon.yml#voice.fingerprint. Mismatch = BLOCKER: "voice changed
//      without founder unlock". The unlock ritual: change voices.json AND the
//      fingerprint together, deliberately, in one commit.
//
//   3. WIREFRAME ZONE CHECK (structural, no pixels) — validates video.json
//      scenes against canon/wireframes/wireframes.json where mappable from data:
//      mascot on a vetted slot (same distance math as src/scenes/mascot-slots.ts,
//      mirrored as data in wireframes.json) and within the slot's max size;
//      forbidden elements absent (mascot/ghost on versus diff-lines beats —
//      founder lock 2026-07-08); end-card required fields; one jacquard word
//      per video; no white editorial panel on signal/ink fields (NO.009 law).
//      v2 MASTER BANDS (founder 2026-07-08, wireframes.json#bands): where
//      geometry is DERIVABLE from video.json —
//        · content-below-chrome: mascot boxes and ascii imgBox tops must start
//          at/below the content band (y>=360; chrome 0–320 + 40px gap);
//        · content-above-footer: mascot boxes must end above the footer band
//          (y<1380) and inside the 150px sides;
//        · caption-required (warn): every middle slide carries a receipts line
//          (footnote/caption/credit/meta field);
//        · footer-on-every-slide (warn): chrome.footerLeft must be set — the
//          engine now renders the footer on every slide (law 2026-07-08).
//      HONESTY: headline/panel/numeral pixel positions, versus auto-fit widths,
//      the caption's RENDERED y, and whether a sprite visually covers words are
//      engine-CSS territory — not derivable from video.json. Those live with
//      the canon-judge + the verify-by-looking still. This gate only enforces
//      what the data can prove.
//
// Usage:
//   node reel-engine/scripts/check-goldens.mjs --brand vektor --slug <slug> [--video out/<slug>.mp4]
//   node reel-engine/scripts/check-goldens.mjs --brand vektor --slug <slug> --seed          # write goldens from an APPROVED cut
//   node reel-engine/scripts/check-goldens.mjs --brand vektor --still <png> --region endcard-lockup   # probe one still vs one golden
//
// Exit: 1 on any BLOCK, 0 otherwise. Diff images land in out/_qa/goldens/ for eyeballing.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {resolveBrand} from '../lib/brand.mjs';
import {composeScript, validateVoTags} from './lib/vo-script.mjs';

const execFileP = promisify(execFile);
const require = createRequire(import.meta.url);
const YAML = require('js-yaml');
const {PNG} = require('pngjs');
const pixelmatch = (await import('pixelmatch')).default;

const parseArgs = () => {
  const a = process.argv.slice(2);
  const p = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === '--brand' || a[i] === '-b') p.brand = a[++i];
    else if (a[i] === '--slug' || a[i] === '-s') p.slug = a[++i];
    else if (a[i] === '--video' || a[i] === '-V') p.video = a[++i];
    else if (a[i] === '--seed') p.seed = true;
    else if (a[i] === '--still') p.still = a[++i];
    else if (a[i] === '--region') p.region = a[++i];
  }
  if (!p.slug && !p.still) throw new Error('Usage: check-goldens.mjs --brand <brand> --slug <slug> [--seed] | --still <png> --region <name>');
  return p;
};

const R = (ok, severity, name, detail) => ({ok, severity, name, detail});

// ---------------------------------------------------------------- pixel layer
const cropFromVideo = async (video, frame, [x, y, w, h], out) => {
  await execFileP('ffmpeg', ['-v', 'error', '-y', '-i', video,
    '-vf', `select=eq(n\\,${frame}),crop=${w}:${h}:${x}:${y}`,
    '-frames:v', '1', '-fps_mode', 'passthrough', out]);
};
const cropFromStill = async (still, [x, y, w, h], out) => {
  await execFileP('ffmpeg', ['-v', 'error', '-y', '-i', still, '-vf', `crop=${w}:${h}:${x}:${y}`, out]);
};

const readPng = (p) => PNG.sync.read(fs.readFileSync(p));

// diff two same-size PNGs → {pct, diffPixels}; writes a visual diff png.
const diffPct = (goldenPath, candidatePath, diffOut) => {
  const a = readPng(goldenPath);
  const b = readPng(candidatePath);
  if (a.width !== b.width || a.height !== b.height) {
    return {pct: 100, diffPixels: -1, note: `size mismatch golden ${a.width}x${a.height} vs candidate ${b.width}x${b.height}`};
  }
  const d = new PNG({width: a.width, height: a.height});
  const diffPixels = pixelmatch(a.data, b.data, d.data, a.width, a.height, {threshold: 0.1});
  fs.mkdirSync(path.dirname(diffOut), {recursive: true});
  fs.writeFileSync(diffOut, PNG.sync.write(d));
  return {pct: (diffPixels / (a.width * a.height)) * 100, diffPixels};
};

// which mp4 frame to sample for a golden region, from video.json structure
const sampleFrame = (region, video) => {
  const scenes = video.scenes || [];
  const LIGHT = new Set(['cream', 'aqua', 'fog', 'orchid']);
  let start = 0;
  if (region.sample.type === 'firstLightField') {
    for (const sc of scenes) {
      if (LIGHT.has(sc.field) && sc.kind !== 'asciiField') return start + Math.floor((sc.durationInFrames || 0) / 2);
      start += sc.durationInFrames || 0;
    }
    return null;
  }
  if (region.sample.type === 'endCard') {
    for (const sc of scenes) {
      if (sc.endCard) {
        const local = Math.min((sc.durationInFrames || 90) - 5, region.sample.localFrame ?? 70);
        return start + local; // past the wordmark motion (~45f) — the lockup is settled
      }
      start += sc.durationInFrames || 0;
    }
    return null;
  }
  return null;
};

// ------------------------------------------------------------ voice fingerprint
const VOICE_FIELDS = ['master_strength', 'model_id', 'similarity_boost', 'speed', 'stability', 'style'];
export const voiceFingerprint = (voice) => {
  const canonical = JSON.stringify(Object.fromEntries(VOICE_FIELDS.map((k) => [k, voice[k]])));
  return crypto.createHash('sha256').update(canonical).digest('hex');
};

// ------------------------------------------------------- wireframe zone layer
const mapKind = (sc) => {
  if (sc.endCard) return 'endCard';
  if (sc.kind === 'asciiField') return 'asciiField';
  if (sc.kind === 'versus') return 'versus';
  if (sc.kind === 'splitvs') return 'versus'; // splitvs is the versus kind's screenshot variant (styleboard 04)
  if (sc.kind === 'photostat') return 'photostat';
  if (sc.kind === 'counter') return 'stat';
  if (sc.kind === 'editorial') {
    if (sc.amBeat === 'hook') return 'hook';
    if (sc.panel?.image) return 'receipt';
    return 'editorial';
  }
  return sc.kind;
};

const checkWireframes = (video, wf, results) => {
  const tol = wf.mascotSlotTolerancePct ?? 8;
  const scenes = video.scenes || [];
  const slotFails = [];
  const forbidFails = [];
  scenes.forEach((sc, i) => {
    const kindKey = mapKind(sc);
    const kind = wf.kinds[kindKey] ?? wf.kinds.editorial;

    // mascot: vetted slot + slot size cap (same math as src/scenes/mascot-slots.ts)
    if (sc.mascot && kind?.mascotSlots?.length) {
      const {xPct = 50, yPct = 55, size = 160} = sc.mascot;
      let best = null;
      let bestD = Infinity;
      for (const s of kind.mascotSlots) {
        const d = Math.hypot(s.xPct - xPct, s.yPct - yPct);
        if (d < bestD) { bestD = d; best = s; }
      }
      if (bestD > tol) slotFails.push(`scene[${i}] (${kindKey}) mascot ${xPct}/${yPct} is ${bestD.toFixed(1)}pct from every vetted slot (nearest ${best.xPct}/${best.yPct})`);
      else if (size > best.maxSize) slotFails.push(`scene[${i}] (${kindKey}) mascot size ${size} > slot max ${best.maxSize} at ${best.xPct}/${best.yPct}`);
    }

    // versus diff-lines beats: NO mascot, NO ghost (founder lock 2026-07-08)
    if (sc.kind === 'versus' && sc.lines?.length) {
      if (sc.mascot) forbidFails.push(`scene[${i}] versus has diff lines AND a mascot — forbidden (founder lock 2026-07-08)`);
      if (sc.ghost) forbidFails.push(`scene[${i}] versus has diff lines AND a ghost numeral — forbidden (founder lock 2026-07-08)`);
    }

    // white editorial panel on a dark field (NO.009 field/panel contrast law)
    if (sc.kind === 'editorial' && sc.panel && ['signal', 'ink', 'signalBlue'].includes(sc.field)) {
      forbidFails.push(`scene[${i}] editorial white panel on dark field '${sc.field}' — panels are light-field only`);
    }
  });
  results.push(R(slotFails.length === 0, 'blocker', 'wireframe.mascotSlots', slotFails.length ? slotFails.join(' | ') : 'all mascots on vetted slots'));
  results.push(R(forbidFails.length === 0, 'blocker', 'wireframe.forbidden', forbidFails.length ? forbidFails.join(' | ') : 'no forbidden elements'));

  // ---- v2 MASTER BANDS (founder 2026-07-08) — only what video.json geometry can prove
  const bands = wf.bands;
  if (bands) {
    const contentTop = bands.content?.y ?? 360;
    const footerTop = bands.footer?.y ?? 1380;
    const sides = bands.sides ?? 150;
    const bandFails = [];
    const captionMissing = [];
    scenes.forEach((sc, i) => {
      const isEndcard = Boolean(sc.endCard);
      const isBroll = sc.kind === 'broll';
      const kindKey = mapKind(sc);

      // ascii art must clear the chrome band + 40px gap (founder catches 05/08:
      // the default imgBox top of 300 sits behind the 320px masthead). Applies
      // to end cards too — band-exempt is not collision-exempt.
      if (sc.kind === 'asciiField' || sc.pre) {
        const artTop = sc.imgBox?.top ?? 360; // engine default conformed 2026-07-08 (AsciiFieldScene imgBox 300→360)
        if (artTop < contentTop) bandFails.push(`scene[${i}] (${kindKey}) ascii imgBox top ${artTop} < ${contentTop} — art sits behind the chrome band (founder catch 05/08); set imgBox.top >= ${contentTop}`);
      }

      if (isEndcard || isBroll || i === 0) return; // hook + end card are band-exempt for placement

      // mascot box vs the bands (sprite: width = size, height = size * 8/13 * 1.35
      // incl. legs — same aspect the wireframe visualization uses)
      if (sc.mascot) {
        const {xPct = 50, yPct = 55, size = 160} = sc.mascot;
        const w = size;
        const h = size * (8 / 13) * 1.35;
        const top = (yPct / 100) * 1920 - h / 2;
        const bottom = top + h;
        const left = (xPct / 100) * 1080 - w / 2;
        const right = left + w;
        if (top < contentTop) bandFails.push(`scene[${i}] (${kindKey}) mascot top ${top.toFixed(0)} < ${contentTop} — content never sits behind the chrome band`);
        if (bottom > footerTop) bandFails.push(`scene[${i}] (${kindKey}) mascot bottom ${bottom.toFixed(0)} > ${footerTop} — content never sits behind the footer band`);
        if (left < sides - 1 || right > 1080 - sides + 1) bandFails.push(`scene[${i}] (${kindKey}) mascot ${left.toFixed(0)}..${right.toFixed(0)} crosses the ${sides}px side margins (sides are 150 EVERYWHERE — left AND right)`);
      }
    });
    results.push(R(bandFails.length === 0, 'blocker', 'wireframe.bands',
      bandFails.length ? bandFails.join(' | ') : `derivable geometry inside the master bands (content ${contentTop}..${footerTop}, sides ${sides})`));

    // caption line REQUIRED on every middle slide (the receipts layer). Data
    // evidence: a footnote/caption/credit/meta field. WARN not BLOCK — renders
    // predating v2 fail this by design, and the judge owns the rendered look.
    scenes.forEach((sc, i) => {
      if (i === 0 || sc.endCard || sc.kind === 'broll') return;
      if (!(sc.footnote || sc.caption || sc.credit || sc.meta)) captionMissing.push(`scene[${i}] (${mapKind(sc)})`);
    });
    results.push(R(captionMissing.length === 0, 'warn', 'wireframe.caption',
      captionMissing.length ? `no receipts line (footnote/caption/credit/meta) on: ${captionMissing.join(', ')} — REQUIRED on middle slides (v2 caption band y${bands.caption?.y ?? 1300})` : 'every middle slide carries a receipts line'));

    // footer on EVERY slide (law 2026-07-08). The engine renders it from chrome
    // config; the gate can only prove the data feeds it — visibility is
    // engine+judge territory (PersistentChrome hides it only on broll/end card).
    results.push(R(Boolean(video.chrome?.footerLeft), 'warn', 'wireframe.footer',
      video.chrome?.footerLeft ? `footer text set ('${video.chrome.footerLeft}') — renders on every slide, bottom edge y1420` : 'chrome.footerLeft is empty — the every-slide footer (law 2026-07-08) would render blank'));
  } else {
    results.push(R(false, 'warn', 'wireframe.bands', 'wireframes.json has no #bands block (pre-v2 contract) — master-band checks skipped'));
  }

  // end card: required fields
  const ecScene = scenes.find((sc) => sc.endCard);
  if (ecScene) {
    const missing = ['wordmark', 'cta', 'issue'].filter((k) => !ecScene.endCard[k]);
    results.push(R(missing.length === 0, 'blocker', 'wireframe.endCard', missing.length ? `endCard missing: ${missing.join(', ')}` : 'wordmark + cta + issue present'));
  } else {
    results.push(R(false, 'warn', 'wireframe.endCard', 'no endCard scene found'));
  }

  // one jacquard word per VIDEO (dark beats only carry it)
  const jac = scenes.filter((sc) => sc.jacquardWord);
  const jacOnLight = jac.filter((sc) => sc.kind !== 'asciiField');
  results.push(R(jac.length <= 1 && jacOnLight.length === 0, 'blocker', 'wireframe.jacquard',
    jac.length > 1 ? `${jac.length} jacquard words (max 1 per video)` : jacOnLight.length ? 'jacquard on a non-dark beat' : `${jac.length} jacquard word(s), dark beat only`));
};

// ------------------------------------------------------- template registry layer
// THE ANTI-FREESTYLE GATE (founder mission 2026-07-09): every scene must be
// built from a registered, founder-approved template in
// canon/templates/templates.json. The field WHITELIST is the teeth — a scene
// cannot carry any key the template doesn't declare, so an invented
// composition is structurally inexpressible, not just discouraged. While the
// registry has enforce:false (menu awaiting founder sign-off) violations are
// warnings; the sign-off flips them to blockers.
const getPath = (obj, dotted) => dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

const checkTemplates = (video, registry, results) => {
  if (!registry) {
    results.push(R(false, 'warn', 'templates.menu', 'canon/templates/templates.json missing — template menu not enforced (pre-v3 contract)'));
    return;
  }
  const sev = registry.enforce ? 'blocker' : 'warn';
  const shared = new Set(registry.sharedFields || []);
  const menu = Object.entries(registry.templates || {})
    .filter(([, t]) => t.status === 'approved').map(([id]) => id);
  const fails = [];
  (video.scenes || []).forEach((sc, i) => {
    const tag = `scene[${i}] (${mapKind(sc)})`;
    const id = sc.template;
    if (!id) {
      fails.push(`${tag} has NO template id — every scene is built from a registered template (menu: ${menu.join(', ') || 'none approved yet'})`);
      return;
    }
    const t = registry.templates?.[id];
    if (!t) {
      fails.push(`${tag} template '${id}' is not in the registry — new templates enter only via founder RENDER→SEE→LOCK`);
      return;
    }
    if (t.status !== 'approved') {
      fails.push(`${tag} template '${id}' is '${t.status}' — only founder-approved templates ship`);
      return;
    }
    // binds: the template pins what the scene must be
    if (t.binds?.kind && sc.kind !== t.binds.kind) fails.push(`${tag} template '${id}' binds kind='${t.binds.kind}' but scene has kind='${sc.kind}'`);
    if (t.binds?.amBeat && sc.amBeat !== t.binds.amBeat) fails.push(`${tag} template '${id}' binds amBeat='${t.binds.amBeat}' but scene has amBeat='${sc.amBeat ?? '(none)'}'`);
    if (t.binds?.endCard === true && !sc.endCard) fails.push(`${tag} template '${id}' requires an endCard block`);
    if (t.binds?.endCard === false && sc.endCard) fails.push(`${tag} template '${id}' forbids an endCard block`);
    // field whitelist — the anti-freestyle rule
    const allowed = new Set([
      ...shared,
      ...(t.fields?.required || []).map((p) => p.split('.')[0]),
      ...(t.fields?.optional || []).map((p) => p.split('.')[0]),
    ]);
    for (const key of Object.keys(sc)) {
      if (!allowed.has(key)) fails.push(`${tag} field '${key}' is not part of template '${id}' — freestyle composition blocked (allowed: ${[...allowed].join(', ')})`);
    }
    // required fields (dotted paths reach into panel/endCard blocks)
    for (const p of t.fields?.required || []) {
      if (getPath(sc, p) === undefined) fails.push(`${tag} template '${id}' requires '${p}'`);
    }
    // enum constraints (value allowlists)
    for (const [k, allowedVals] of Object.entries(t.constraints || {})) {
      const v = getPath(sc, k);
      if (v !== undefined && !allowedVals.some((a) => JSON.stringify(a) === JSON.stringify(v))) {
        fails.push(`${tag} '${k}'=${JSON.stringify(v)} is outside template '${id}' allowlist ${JSON.stringify(allowedVals)}`);
      }
    }
    // pattern constraints (e.g. receipt-source caption must read 'SOURCE: …')
    for (const [k, re] of Object.entries(t.patterns || {})) {
      const v = getPath(sc, k);
      if (typeof v === 'string' && !new RegExp(re).test(v)) fails.push(`${tag} '${k}' must match /${re}/ for template '${id}' (got '${v}')`);
    }
    // wireframe congruence — the template's declared wireframe kind must be
    // the one the golden gate will actually check this scene against
    if (t.wireframeKind && t.wireframeKind !== 'broll' && mapKind(sc) !== t.wireframeKind) {
      fails.push(`${tag} maps to wireframe kind '${mapKind(sc)}' but template '${id}' declares '${t.wireframeKind}'`);
    }
  });
  results.push(R(fails.length === 0, sev, 'templates.menu',
    fails.length ? fails.join(' | ') : `all ${video.scenes?.length ?? 0} scenes built from registered templates (registry v${registry.version}${registry.enforce ? '' : ' — ADVISORY, enforce:false until founder menu sign-off'})`));
};

// ------------------------------------------------------------------------ main
const main = async () => {
  const args = parseArgs();
  const brand = resolveBrand(args.brand);
  process.chdir(brand.brandRoot);

  const wf = JSON.parse(fs.readFileSync(path.join('canon', 'wireframes', 'wireframes.json'), 'utf8'));
  const canon = YAML.load(fs.readFileSync(path.join('canon', 'canon.yml'), 'utf8'));
  const goldenDir = path.join('canon', 'goldens');
  const qaDir = path.join('out', '_qa', 'goldens');
  fs.mkdirSync(qaDir, {recursive: true});
  const results = [];

  // ---- probe mode: one still vs one golden region, then exit -----------------
  if (args.still) {
    const name = args.region;
    const region = wf.goldenRegions[name];
    if (!region) throw new Error(`unknown region '${name}' — have: ${Object.keys(wf.goldenRegions).filter((k) => !k.startsWith('_')).join(', ')}`);
    const cand = path.join(qaDir, `probe-${name}.png`);
    await cropFromStill(args.still, region.crop, cand);
    const golden = path.join(goldenDir, `${name}.png`);
    const d = diffPct(golden, cand, path.join(qaDir, `probe-${name}-diff.png`));
    const ok = d.pct <= region.tolerancePct;
    console.log(`\ngolden probe · ${name} · ${args.still}`);
    console.log(`  [${ok ? 'PASS ' : 'FAIL '}] ${name.padEnd(16)} diff ${d.pct.toFixed(2)}% (${d.diffPixels}px) vs tolerance ${region.tolerancePct}%${d.note ? ' — ' + d.note : ''}`);
    process.exit(ok ? 0 : 1);
  }

  const video = JSON.parse(fs.readFileSync(path.join('data', args.slug, 'video.json'), 'utf8'));
  const videoPath = args.video || path.join('out', `${args.slug}.mp4`);
  const hasMp4 = fs.existsSync(videoPath);

  // ---- 1. golden regions (pixel) --------------------------------------------
  if (hasMp4) {
    for (const [name, region] of Object.entries(wf.goldenRegions)) {
      if (name.startsWith('_')) continue;
      const frame = sampleFrame(region, video);
      if (frame == null) {
        results.push(R(false, 'warn', `golden.${name}`, `no scene matches sample rule '${region.sample.type}' — region skipped`));
        continue;
      }
      const cand = path.join(qaDir, `${args.slug}-${name}.png`);
      await cropFromVideo(videoPath, frame, region.crop, cand);
      const golden = path.join(goldenDir, `${name}.png`);
      if (args.seed) {
        fs.mkdirSync(goldenDir, {recursive: true});
        fs.copyFileSync(cand, golden);
        results.push(R(true, 'warn', `golden.${name}`, `SEEDED from ${videoPath} frame ${frame} crop [${region.crop.join(',')}] → ${golden}`));
        continue;
      }
      if (!fs.existsSync(golden)) {
        results.push(R(false, 'blocker', `golden.${name}`, `golden missing (${golden}) — seed from an approved cut with --seed`));
        continue;
      }
      const d = diffPct(golden, cand, path.join(qaDir, `${args.slug}-${name}-diff.png`));
      results.push(R(d.pct <= region.tolerancePct, 'blocker', `golden.${name}`,
        `diff ${d.pct.toFixed(2)}% (frame ${frame}, tol ${region.tolerancePct}%)${d.note ? ' — ' + d.note : ''}`));
    }
  } else {
    results.push(R(false, 'warn', 'golden.regions', `no mp4 at ${videoPath} — pixel layer skipped (structural checks only)`));
  }

  // ---- 2. voice fingerprint ---------------------------------------------------
  {
    const voices = JSON.parse(fs.readFileSync(path.join('config', 'voices.json'), 'utf8'));
    const brandVoice = voices.voices?.[canon.brand] ?? voices.voices?.vektor;
    const fp = voiceFingerprint(brandVoice ?? {});
    const want = canon.voice?.fingerprint;
    if (!want) {
      results.push(R(false, 'warn', 'voice.fingerprint', 'canon.yml has no voice.fingerprint block — gate cannot lock the voice'));
    } else {
      results.push(R(fp === want, 'blocker', 'voice.fingerprint',
        fp === want ? `locked (${fp.slice(0, 12)}…)` : `VOICE CHANGED WITHOUT FOUNDER UNLOCK — voices.json#${canon.brand} hashes ${fp.slice(0, 12)}… but canon.yml locks ${String(want).slice(0, 12)}…. If the founder approved a new voice, update config/voices.json AND canon.yml#voice.fingerprint together.`));
    }
  }

  // ---- 3. wireframe zone check (structural) ----------------------------------
  checkWireframes(video, wf, results);

  // ---- 4. template registry (the anti-freestyle menu) -------------------------
  {
    const regPath = path.join('canon', 'templates', 'templates.json');
    const registry = fs.existsSync(regPath) ? JSON.parse(fs.readFileSync(regPath, 'utf8')) : null;
    checkTemplates(video, registry, results);
  }

  // ---- 5. context-aware VO (voTag vocabulary + composed-script drift) ---------
  // The narrated script is COMPOSED from video.json (compose-script.mjs). The
  // gate re-composes with the SAME shared lib and diffs data/<slug>/script.txt —
  // a hand-edited script (or stale tags) can never ship. Tag vocabulary comes
  // from canon.yml#voice.tags.allowed (founder-approved 2026-07-09).
  if (canon.voice?.tags) {
    const allowed = canon.voice.tags.allowed ?? [];
    const tagFails = validateVoTags(video, allowed);
    results.push(R(tagFails.length === 0, 'blocker', 'voice.tags',
      tagFails.length ? tagFails.join(' | ') : `voTags valid (vocabulary: ${allowed.join(', ')})`));
    const scriptPath = path.join('data', args.slug, 'script.txt');
    if (fs.existsSync(scriptPath)) {
      const onDisk = fs.readFileSync(scriptPath, 'utf8').replace(/\r\n/g, '\n');
      const composed = composeScript(video);
      results.push(R(onDisk === composed, 'blocker', 'voice.script',
        onDisk === composed ? 'script.txt matches the video.json composition' : 'script.txt DRIFTED from the video.json vo/voTag composition — regenerate with compose-script.mjs (never hand-edit)'));
    } else {
      results.push(R(false, 'warn', 'voice.script', 'no data/<slug>/script.txt — compose it with compose-script.mjs before the VO build'));
    }
  }

  // ---- report -----------------------------------------------------------------
  const fails = results.filter((r) => !r.ok);
  const blockers = fails.filter((r) => r.severity === 'blocker');
  const warns = fails.filter((r) => r.severity !== 'blocker');
  console.log(`\ngolden gate · ${brand.name} · ${args.slug} · wireframes v${wf.version} · canon v${canon.version}${args.seed ? '  (SEED MODE)' : ''}\n`);
  for (const r of results) {
    const mark = r.ok ? 'ok  ' : r.severity === 'blocker' ? 'BLOCK' : 'warn ';
    console.log(`  [${mark}] ${r.name.padEnd(24)} ${r.detail}`);
  }
  console.log('');
  if (blockers.length) {
    console.log(`NO-GO — ${blockers.length} golden-gate blocker(s), ${warns.length} warning(s). Pixel truth or structure drifted from the approved contract.`);
    process.exit(1);
  }
  console.log(`GO — 0 blockers${warns.length ? `, ${warns.length} warning(s)` : ''}. Matches the approved pixel contract.`);
};

main().catch((e) => {
  console.error('\n✖ golden gate error: ' + (e.message ?? e));
  process.exit(2);
});
