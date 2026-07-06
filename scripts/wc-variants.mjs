// Generate the S2/S3/S4 colour-system variants of the WC video from the (already
// retimed) S1 video.json — same scenes/durations/audio/captions, swapped brand +
// R3F palettes. Run AFTER retime; then render each variant.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = process.cwd();
const dir = path.join(root, 'data', 'wc-spain');

const SYSTEMS = {
  s2: {
    brand: {
      accent: '#5B8CFF', fg: '#EAEDF6', bgTop: '#0a0c16', bgMid: '#080a12', bgBot: '#05060c',
      mono: '"Space Mono", monospace', metaFont: '"Space Mono", monospace', labelFont: '"Schibsted Grotesk", sans-serif',
      muted: '#5e6585', hairline: 'rgba(91,140,255,0.16)', metaTransform: 'uppercase', metaSpacing: '0.12em',
      nodeBg: '#0c1020', ngEdge: '#243',
    },
    gen: ['#5B8CFF', '#9FB6FF', '#EAEDF6'],
    heat: ['#5B8CFF', '#2E4BD8'],
  },
  s3: {
    brand: {
      accent: '#2BD17A', fg: '#E9F2EB', bgTop: '#0a110d', bgMid: '#081109', bgBot: '#050806',
      mono: '"JetBrains Mono", monospace', metaFont: '"JetBrains Mono", monospace', labelFont: '"Hanken Grotesk", sans-serif',
      muted: '#5d7165', hairline: 'rgba(43,209,122,0.15)', metaTransform: 'uppercase', metaSpacing: '0.12em',
      nodeBg: '#0c140f', ngEdge: '#243',
    },
    gen: ['#2BD17A', '#126E4A', '#CFF3DE'],
    heat: ['#2BD17A', '#126E4A'],
  },
  s4: {
    brand: {
      accent: '#9B7BFF', fg: '#ECE8F6', bgTop: '#0d0a16', bgMid: '#0a0712', bgBot: '#070510',
      mono: '"Geist Mono", monospace', metaFont: '"Geist Mono", monospace', labelFont: '"Onest", sans-serif',
      muted: '#6a6284', hairline: 'rgba(155,123,255,0.16)', metaTransform: 'uppercase', metaSpacing: '0.12em',
      nodeBg: '#120e1a', ngEdge: '#342',
    },
    gen: ['#9B7BFF', '#FF7A59', '#ECE8F6'],
    heat: ['#9B7BFF', '#5B3FB0'],
  },
};

const base = JSON.parse(await fs.readFile(path.join(dir, 'video.json'), 'utf8'));

for (const [key, sys] of Object.entries(SYSTEMS)) {
  const v = JSON.parse(JSON.stringify(base));
  v.brand = sys.brand;
  for (const scene of v.scenes) {
    if (scene.kind === 'generative') scene.palette = sys.gen;
    if (scene.kind === 'heatmap3d') scene.palette = sys.heat;
  }
  await fs.writeFile(path.join(dir, `video-${key}.json`), JSON.stringify(v, null, 2));
  console.log(`wrote data/wc-spain/video-${key}.json`);
}
