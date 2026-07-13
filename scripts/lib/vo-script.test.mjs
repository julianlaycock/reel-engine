// vo-script.test.mjs — run: node --test scripts/lib/vo-script.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {composeScript, applyPronunciation, findAudioTags} from './vo-script.mjs';

test('pronunciation map: markdown -> mark down (whole word, case-insensitive)', () => {
  assert.equal(applyPronunciation('Open the markdown file'), 'Open the mark down file');
  assert.equal(applyPronunciation('Markdown rules'), 'mark down rules');
  assert.equal(applyPronunciation('a MARKDOWN doc'), 'a mark down doc');
});

test('pronunciation map: does not touch non-word substrings', () => {
  // "markdowns" is a different word — the \b boundary must not fire mid-word.
  assert.equal(applyPronunciation('markdowns'), 'markdowns');
});

test('composeScript respells markdown in the composed script', () => {
  const video = {scenes: [{vo: 'Ask Claude to read the markdown file'}, {vo: 'Done'}]};
  const out = composeScript(video);
  assert.equal(out, 'Ask Claude to read the mark down file\n\nDone\n');
  assert.ok(!/markdown/i.test(out), 'no raw "markdown" survives composition');
});

test('composeScript injects NO audio tags even if a scene has a voTag', () => {
  const video = {scenes: [{vo: 'Hello there', voTag: 'excited'}]};
  const out = composeScript(video);
  assert.equal(out, 'Hello there\n');
  assert.deepEqual(findAudioTags(out), []);
});

test('findAudioTags flags a leftover [tag]', () => {
  assert.deepEqual(findAudioTags('[excited] Hello'), ['[excited]']);
  assert.deepEqual(findAudioTags('clean line\n\nanother'), []);
});
