import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { TOWNS, MEND_AT, townState, currentRequest, countRequest, handIn, mended, requestText } from '../js/data/towns.js';
import { GYM_BY_ID, leadersOf } from '../js/data/gym.js';
import { BIOMES_BY_ID } from '../js/data/enemies.js';

const run = readFileSync(new URL('../js/run.js', import.meta.url), 'utf8');
const sent = new Set([...run.matchAll(/mission\((\[[^\]]*\]|'[^']*')/g)].flatMap(m => m[1].match(/'([^']*)'/g).map(s => s.slice(1, -1))));

test('every town stands at a real biome, with its own Gym Leaders and folk who can be drawn', () => {
  for (const [id, town] of Object.entries(TOWNS)) {
    assert.equal(town.id, id);
    assert.ok(BIOMES_BY_ID[town.biome], `${id}: no biome ${town.biome}`);
    assert.deepEqual(Object.keys(town.leaders).sort(), leadersOf(town.biome).map(l => l.id).sort(), `${id}: its leaders are the biome's`);
    for (const lid of Object.keys(town.leaders)) assert.ok(GYM_BY_ID[lid] && town.leaders[lid].length >= 3);
    for (const f of [...town.folk, { id: town.trader.id }]) assert.ok(existsSync(new URL(`../assets/pokemon/${f.id}-front.gif`, import.meta.url)), `${id}: ${f.id} has no front GIF`);
    for (const f of town.folk) for (const k of ['quips', 'play', 'you']) assert.ok(f[k]?.length, `${f.id}.${k}`);
    for (const k of ['deciding', 'stand', 'arriving', 'leaving', 'nearYou']) assert.ok(town.shared[k]?.length, `${id}: shared.${k}`);
  }
});

test('every request counts an event the game sends, at least MEND_AT a town', () => {
  for (const town of Object.values(TOWNS)) {
    assert.ok(town.requests.length >= MEND_AT);
    for (const r of town.requests) {
      assert.ok(sent.has(r.on), `${r.id}: nothing sends '${r.on}'`);
      assert.ok(r.n >= 1 && !requestText(r).includes('{n}'));
    }
  }
});

test('a request counts only its event in its own biome, then waits to be handed in', () => {
  const town = TOWNS.shrine, r0 = currentRequest(town, townState({}, 'shrine'));
  let st = townState({}, 'shrine');
  assert.equal(countRequest(town, st, r0.on, 1, { biome: 'clearing' }).st, st);
  assert.equal(countRequest(town, st, 'nope', 1, { biome: 'shrine' }).st, st);
  let finished = false;
  for (let i = 0; i < r0.n + 2; i++) ({ st, finished } = countRequest(town, st, r0.on, 1, { biome: 'shrine' }));
  assert.equal(st.got, r0.n);
  assert.ok(st.ready);
  assert.ok(!finished, 'it finishes once, not again while it waits');
  st = handIn(st);
  assert.deepEqual([st.done, st.got, st.ready], [1, 0, false]);
  assert.notEqual(currentRequest(town, st).id, r0.id);
  assert.equal(handIn(st), st, 'nothing to hand in');
  for (let i = 1; i < MEND_AT; i++) st = handIn({ ...st, ready: true });
  assert.ok(mended(st));
  assert.equal(currentRequest(town, st).id, town.requests[MEND_AT % town.requests.length].id);
});
