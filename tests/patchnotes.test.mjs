import test from 'node:test';
import assert from 'node:assert/strict';
import { PATCHES, NEXT, GROUPS, NEXT_MAX, sectionsOf } from '../js/data/patchnotes.js';

test('NEXT is cut into a patch before it piles up', () => {
  assert.ok(NEXT.length <= NEXT_MAX, `NEXT holds ${NEXT.length} lines: move them into a new PATCHES entry (see the file's header)`);
});

test('every note names a group', () => {
  for (const [g, line] of [...NEXT, ...PATCHES.flatMap(p => p.notes ?? [])]) {
    assert.ok(GROUPS[g], `unknown group "${g}" for: ${line}`);
    assert.equal(typeof line, 'string');
  }
});

test('versions go up, newest first, and every patch has something in it', () => {
  const v = PATCHES.map(p => p.version.split('.').map(Number));
  for (let i = 1; i < v.length; i++) assert.ok(v[i - 1][0] > v[i][0] || (v[i - 1][0] === v[i][0] && v[i - 1][1] > v[i][1]), `${PATCHES[i - 1].version} after ${PATCHES[i].version}`);
  for (const p of PATCHES) assert.ok(sectionsOf(p).length, `v${p.version} is empty`);
});
