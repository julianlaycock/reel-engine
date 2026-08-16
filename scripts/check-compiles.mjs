#!/usr/bin/env node
// check-compiles.mjs — a staged .ts/.tsx file must compile.
//
// WHY. On 2026-08-16 the same mistake broke the build twice in one session: a JSX
// comment, `{/* ... */}`, written in an EXPRESSION position — inside a ternary
// branch and inside a .map() callback — where only a plain /* ... */ is legal.
// Both were caught within a minute by running tsc by hand. This exists for the
// version of the session that does not run it by hand.
//
// It is deliberately a small net and not a large one. It cannot stop the mistake
// being made; it stops it being committed. The whole class is caught because it is
// a syntax error, and a syntax error cannot hide from the compiler.
//
// EXIT CODES ARE READ DIRECTLY, NEVER THROUGH A PIPE. Twice on the same day a
// check's exit code was read off `head` instead of the check, and once a gate that
// never ran at all (wrong directory, MODULE_NOT_FOUND) exited 1 and was very
// nearly reported as a passing test. So: capture output, read status, then look at
// the output. See docs/SESSION-RECORD-2026-08-16.md#B6 in the vektor repo.
import {execFileSync, spawnSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {encoding: 'utf8'}).trim();

// Only the staged files matter. A pre-commit hook that typechecks on every commit
// regardless of what changed is a tax people learn to skip with --no-verify.
const staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'],
  {encoding: 'utf8', cwd: root})
  .split('\n')
  .map((s) => s.trim())
  .filter((s) => /^src\/.*\.tsx?$/.test(s));

if (!staged.length) process.exit(0);

const tsconfig = path.join(root, 'tsconfig.json');
if (!fs.existsSync(tsconfig)) {
  // Not a pass. A missing tsconfig means this check silently stopped checking,
  // which is the failure mode that has cost this project the most time.
  console.error('check-compiles: no tsconfig.json at the repo root — this check did not look at anything.');
  process.exit(1);
}

console.log(`check-compiles: ${staged.length} staged TypeScript file(s) — typechecking`);

// spawnSync, not a shell pipeline: `status` is the compiler's own exit code and
// nothing stands between it and this script.
const r = spawnSync('npx', ['tsc', '--noEmit', '-p', tsconfig],
  {cwd: root, encoding: 'utf8', shell: process.platform === 'win32'});

if (r.status !== 0) {
  console.error('');
  console.error('check-compiles: FAIL — the staged code does not compile.');
  console.error('');
  console.error((r.stdout || '').split('\n').slice(0, 25).join('\n'));
  if (r.stderr) console.error(r.stderr.split('\n').slice(0, 10).join('\n'));
  console.error('Fix it rather than committing with --no-verify: a src/ commit that');
  console.error('does not compile breaks every other session working in this repo.');
  process.exit(1);
}

console.log('check-compiles: ok');
