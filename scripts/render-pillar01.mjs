import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = process.cwd();

const cards = [
  ['data/pillar-01/card-a-stat.json', 'out/pillar-01/card-a-stat.mp4'],
  ['data/pillar-01/card-b-statement.json', 'out/pillar-01/card-b-statement.mp4'],
  ['data/pillar-01/card-c-flow.json', 'out/pillar-01/card-c-flow.mp4'],
  ['data/pillar-01/card-d-result.json', 'out/pillar-01/card-d-result.mp4'],
];

const run = ([input, output]) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ['scripts/render-card.mjs', '--input', input, '--output', output],
      {
        cwd: root,
        stdio: 'inherit',
        shell: false,
      },
    );

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${input} failed with exit code ${code}`));
      }
    });
  });

for (const card of cards) {
  await run(card);
}
