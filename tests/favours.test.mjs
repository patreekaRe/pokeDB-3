// A friend's own requests (js/data/favours.js): who asks, what counts where, and handing one in.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FAVOURS, FAVOUR_HEARTS, FRIEND_TOWN, favourOf, asking, currentFavour, favourText, countFavour, handInFavour } from '../js/data/favours.js';
import { FRIENDS } from '../js/data/workshop.js';
import { readFileSync } from 'node:fs';

test('every friend has requests, each with a note, thanks and an event the missions count', () => {
  const run = readFileSync(new URL('../js/run.js', import.meta.url), 'utf8');
  const events = new Set([...run.matchAll(/mission\((\[[^\]]*\]|'[^']*')/g)].flatMap(m => m[1].match(/'[^']*'/g).map(e => e.slice(1, -1))));
  const ids = Object.values(FAVOURS).flat().map(f => f.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of FRIENDS) {
    assert.ok(FAVOURS[id]?.length >= 3, id);
    assert.ok(FRIEND_TOWN[id], id);
    for (const f of FAVOURS[id]) {
      assert.ok(events.has(f.on), `${f.id}: ${f.on}`);
      assert.ok(f.n > 0 && f.note && f.thanks.length, f.id);
      assert.ok(!['seed', 'tide-fight', 'burn-fight', 'gym'].includes(f.on), f.id);
      assert.ok(!favourText(f).includes('{n}'), f.id);
    }
  }
});

test('only a friend at 3+ hearts asks', () => {
  assert.equal(asking('john', FAVOUR_HEARTS - 1), false);
  assert.equal(asking('john', FAVOUR_HEARTS), true);
  assert.equal(asking('nobody', 5), false);
});

test('a request counts in its friend\'s biome only, then waits to be handed in', () => {
  let fs = favourOf({}, 'john');
  const f = currentFavour('john', fs);
  assert.equal(countFavour('john', fs, f.on, 1, 'wastes').fs, fs);
  assert.equal(countFavour('john', fs, 'fight', 1, 'shrine').fs, fs);
  for (let i = 0; i < f.n; i++) fs = countFavour('john', fs, f.on, 1, 'shrine').fs;
  assert.equal(fs.ready, true);
  assert.equal(countFavour('john', fs, f.on, 1, 'shrine').fs, fs);
  fs = handInFavour(fs);
  assert.deepEqual(fs, { done: 1, got: 0, ready: false });
  assert.notEqual(currentFavour('john', fs).id, f.id);
  assert.equal(handInFavour(fs), fs);
});

test('the Nietos\' count in the Clearing, and a placeless request anywhere', () => {
  const fs = favourOf({}, 'nietos');
  assert.equal(countFavour('nietos', fs, currentFavour('nietos', fs).on, 1, 'clearing').fs.got, 1);
  const anywhere = { done: FAVOURS.shaun.findIndex(f => f.on === 'tough'), got: 0, ready: false };
  assert.equal(countFavour('shaun', anywhere, 'tough', 1, null).fs.got, 1);
});

test('requests go round again', () => {
  const n = FAVOURS.pat.length;
  assert.equal(currentFavour('pat', { done: n }).id, FAVOURS.pat[0].id);
});
