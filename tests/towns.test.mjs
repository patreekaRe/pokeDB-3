import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { TOWNS, MEND_AT, townState, currentRequest, countRequest, handIn, mended, requestText, RING, SHOP_SHELVES, CLEARING, placeOf, folkKey, folkOf, shelfTown } from '../js/data/towns.js';
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
    for (const home of Object.values(town.homes)) for (const id of Object.keys(home.cast || {})) assert.ok(existsSync(new URL(`../assets/pokemon/${id}-front.gif`, import.meta.url)), `${id}: no front GIF`);
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

test("a town's map: square, its buildings' letters there, every door, stand and the gate reachable from the way in", () => {
  for (const town of Object.values(TOWNS)) {
    const { map } = town, W = map[0].length;
    assert.ok(map.every(row => row.length === W), `${town.id}: ragged map`);
    const letters = new Set(town.buildings.map(b => b.at));
    for (const ch of new Set(map.join(''))) assert.ok('T.#,fLbR=cko~-|yns'.includes(ch) || letters.has(ch), `${town.id}: '${ch}' isn't a building`);
    for (const b of town.buildings) {
      assert.ok(map.some(row => row.includes(b.at)), `${b.id}: not on the map`);
      if (b.home) assert.ok(town.homes[b.home], `${b.id}: no home ${b.home}`);
      if (b.door && !b.home) assert.ok(b.knock?.length, `${b.id}: locked with nothing to say`);
    }
    const open = (x, y) => '.#,f=-'.includes(map[y]?.[x] ?? 'T') && map[y]?.[x - 1] !== 'b';   // a bench takes its tile and the next
    const seen = new Set([`${town.door.x},${town.door.y}`]), queue = [[town.door.x, town.door.y]];
    assert.ok(open(town.door.x, town.door.y));
    while (queue.length) {
      const [x, y] = queue.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${x + dx},${y + dy}`;
        if (!seen.has(k) && open(x + dx, y + dy)) { seen.add(k); queue.push([x + dx, y + dy]); }
      }
    }
    const reach = ({ x, y }, what) => assert.ok(seen.has(`${x},${y}`), `${town.id}: ${what} at ${x},${y} can't be reached`);
    reach(town.gate, 'the gate');
    for (const b of town.buildings) if (b.door) reach(b.door, `${b.id}'s door`);
    for (const [x, y] of town.stands) reach({ x, y }, 'a stand');
    const board = map.findIndex(row => row.includes('R'));
    reach({ x: map[board].indexOf('R'), y: board + 1 }, 'the board');
  }
});

test('the Waystone ring has one stone a town, each its own colour', () => {
  assert.deepEqual(RING.map(t => t.id).sort(), Object.keys(TOWNS).sort());
  assert.equal(new Set(RING.map(t => t.glow)).size, RING.length);
});

test('every town sells a shelf of the catalogue that no other town sells', () => {
  const src = ['', '-kinds', '-rooms', '-rooms2', '-rooms3', '-rooms4', '-rooms5'].map(f => readFileSync(new URL(`../js/base-furniture${f}.js`, import.meta.url), 'utf8')).join('\n');
  const groups = new Set([...src.matchAll(/add\('([^']+)'/g)].map(m => m[1]));
  assert.deepEqual(Object.keys(SHOP_SHELVES).sort(), Object.keys(TOWNS).sort());
  const seen = new Set();
  for (const [town, shelves] of Object.entries(SHOP_SHELVES)) for (const g of shelves) {
    assert.ok(groups.has(g), `${town}: no shelf ${g}`);
    assert.ok(!seen.has(g), `${g} sold in two towns`);
    seen.add(g);
    assert.equal(shelfTown(g), town);
  }
});

test('the Clearing\'s houses are the Clearing\'s own Gym Leaders\', and townsfolk keys find their town', () => {
  assert.equal(placeOf('clearing'), CLEARING);
  assert.equal(placeOf('shrine'), TOWNS.shrine);
  const clearing = leadersOf('clearing').map(l => l.id);
  for (const home of Object.values(CLEARING.homes)) {
    assert.ok(clearing.includes(home.leader), `${home.leader} isn't a Clearing leader`);
    assert.ok(CLEARING.leaders[home.leader]?.length >= 3);
    for (const id of Object.keys(home.cast || {})) assert.ok(existsSync(new URL(`../assets/pokemon/${id}-front.gif`, import.meta.url)), `${id}: no front GIF`);
  }
  for (const b of CLEARING.buildings) assert.ok(CLEARING.homes[b.home]);
  for (const town of Object.values(TOWNS)) for (const f of town.folk) assert.equal(folkOf(folkKey(town.id, f.id))?.id, f.id);
  assert.equal(folkOf('nowhere:eevee'), null);
});
