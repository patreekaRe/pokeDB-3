// Friends' tombstones' pure part (js/data/graves.js): a lost run packed for the network, read back, and placed on a map.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FALL_MAX, FALL_LEN, GRAVES_SHOWN, GRAVES_KEYS, fallOf, packFall, readFall, addFall, gravesDoc, readGraves, graveId, gravesHere, checkGraves } from '../js/data/graves.js';

const fall = (extra = {}) => ({
  mode: 'run', land: 'forest', day: '', biome: 0, floor: 4, node: 'f3c2', foeId: 'pidgey', at: 1760000000000,
  starter: 'charmander', stage: 1, shiny: false, type: 'fire', level: 2, date: '2026-10-18', biomeName: 'Viridian Forest',
  place: 'The Deep Woods', kind: 'fight', foe: 'Pidgey', move: 'Gust', hpTrail: [[40, 40, 0], [22, 40, 0], [0, 40, 0]],
  deck: ['ember', 'scratch', 'ember+'], itemsUsed: ['potion'], fights: 3, turns: 30, dealt: 200, ...extra,
});

test('a fall packs and reads back the same', () => {
  const json = packFall(fall());
  assert.ok(json.length <= FALL_LEN);
  const back = readFall(json);
  assert.deepEqual(back, fallOf(fall()));
  assert.equal(back.foeId, 'pidgey');
  assert.equal(back.deck.length, 3);
});

test('a long deck and chart are trimmed to fit, never dropped whole', () => {
  const big = fall({ deck: Array.from({ length: 200 }, (_, i) => `card-number-${i}-padding`.padEnd(40, "x")), hpTrail: Array.from({ length: 200 }, () => [9999, 9999, 9]), itemsUsed: Array(40).fill("i".repeat(40)) });
  const json = packFall(big);
  assert.ok(json && json.length <= FALL_LEN);
  const back = readFall(json);
  assert.ok(back.deck.length > 0 && back.deck.length <= 40);
  assert.ok(back.hpTrail.length >= 1);
});

test('a friend\'s fall is read as untrusted', () => {
  assert.equal(readFall('not json'), null);
  assert.equal(readFall(JSON.stringify({ mode: 'run' })), null);
  assert.equal(readFall(JSON.stringify({ starter: 'x', mode: 'hax' })), null);
  assert.equal(readFall('x'.repeat(FALL_LEN + 1)), null);
  const odd = readFall(JSON.stringify({ starter: 'charmander', mode: 'safari', floor: -5, stage: 9, kind: 'nuke', deck: [1, 'ember', { a: 1 }], hpTrail: 'no', day: 'today', foe: 'x'.repeat(500) }));
  assert.equal(odd.floor, 0);
  assert.equal(odd.stage, 2);
  assert.equal(odd.kind, null);
  assert.deepEqual(odd.deck, ['ember']);
  assert.equal(odd.hpTrail.length, 1);
  assert.equal(odd.day, '');
  assert.equal(odd.foe.length, 40);
});

test('the save keeps the newest FALL_MAX', () => {
  let list = [];
  for (let i = 0; i < 9; i++) list = addFall(list, `f${i}`);
  assert.equal(list.length, FALL_MAX);
  assert.equal(list.at(-1), 'f8');
});

test('the doc the rules take', () => {
  const d = gravesDoc({ name: 'misty', buddy: 'starter:squirtle', tier: 'gold', falls: [packFall(fall()), 'x'.repeat(FALL_LEN + 1)] });
  assert.equal(d.name, 'MISTY');
  assert.equal(d.falls.length, 1);
  assert.equal(checkGraves(d), null);
  assert.equal(checkGraves({ ...d, hax: 1 }), 'extra key');
  assert.equal(checkGraves({ ...d, tier: 'mauve' }), 'bad tier');
  assert.equal(checkGraves({ ...d, falls: Array(FALL_MAX + 1).fill('{}') }), 'bad falls');
  assert.equal(gravesDoc({ name: '', tier: 'mauve' }).tier, 'green');
  const r = readGraves({ ...d, falls: [...d.falls, 'junk'] }, 5);
  assert.equal(r.falls.length, 1);
  assert.equal(r.at, 5);
  assert.equal(readGraves({ name: 7 }), null);
});

test('the rules\' graves keys and bounds match', () => {
  const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
  const block = rules.slice(rules.indexOf("function fallOk"));
  for (const k of GRAVES_KEYS) assert.ok(block.slice(0, 900).includes(`'${k}'`), k);
  assert.ok(block.includes(`size() <= ${FALL_MAX}`));
  assert.ok(block.includes(`size() <= ${FALL_LEN}`));
});

const map = {
  floors: [[{ id: 'f0c1' }, { id: 'f0c4' }], [{ id: 'f1c2' }], [{ id: 'f2c0' }, { id: 'f2c3' }, { id: 'f2c6' }]],
  byId: { f0c1: {}, f0c4: {}, f1c2: {}, f2c0: {}, f2c3: {}, f2c6: {}, boss: {} },
};

test('a run\'s grave stands on the same floor of the same biome, steadily', () => {
  const friends = [{ uid: 'u1', name: 'MISTY', falls: [fallOf(fall({ floor: 3 })), fallOf(fall({ land: 'cave', at: 2 }))] }];
  const here = gravesHere(friends, { mode: 'run', land: 'forest' }, map);
  assert.equal(here.length, 1);
  assert.ok(['f2c0', 'f2c3', 'f2c6'].includes(here[0].node));
  assert.equal(gravesHere(friends, { mode: 'run', land: 'forest' }, map)[0].node, here[0].node);
  assert.equal(gravesHere([{ uid: 'u1', falls: [fallOf(fall({ floor: 9 }))] }], { mode: 'run', land: 'forest' }, map).length, 0);
  assert.equal(gravesHere([{ uid: 'u1', falls: [fallOf(fall({ kind: 'boss', node: 'boss' }))] }], { mode: 'run', land: 'forest' }, map)[0].node, 'boss');
});

test('a Safari grave stands at its very room, that day only', () => {
  const f = fallOf(fall({ mode: 'safari', land: 'wetland', day: '2026-10-18', node: 'f1c2' }));
  const friends = [{ uid: 'u1', falls: [f] }];
  assert.equal(gravesHere(friends, { mode: 'safari', land: 'wetland', day: '2026-10-18' }, map)[0].node, 'f1c2');
  assert.equal(gravesHere(friends, { mode: 'safari', land: 'wetland', day: '2026-10-19' }, map).length, 0);
  assert.equal(gravesHere(friends, { mode: 'run', land: 'wetland' }, map).length, 0);
});

test('a Sky Pillar grave stands at its floor\'s door, that week and flight only', () => {
  const f = fallOf(fall({ mode: 'tower', land: '', day: '2026-10-12', floor: 12, node: '1' }));
  const friends = [{ uid: 'u1', falls: [f] }];
  const [g] = gravesHere(friends, { mode: 'tower', day: '2026-10-12' }, map, 10);
  assert.equal(g.floor, 12);
  assert.equal(g.door, 0);   // floor 12 is the flight's second row: one door
  assert.equal(gravesHere(friends, { mode: 'tower', day: '2026-10-12' }, map, 0).length, 0);
  assert.equal(gravesHere(friends, { mode: 'tower', day: '2026-10-05' }, map, 10).length, 0);
});

test('newest first, at most GRAVES_SHOWN, each with its own id', () => {
  const falls = Array.from({ length: 5 }, (_, i) => fallOf(fall({ floor: 1, at: 100 + i })));
  const friends = [1, 2, 3].map(n => ({ uid: `u${n}`, falls }));
  const here = gravesHere(friends, { mode: 'run', land: 'forest' }, map);
  assert.equal(here.length, GRAVES_SHOWN);
  assert.equal(here[0].fall.at, 104);
  assert.equal(new Set(here.map(g => g.id)).size, here.length);
  assert.equal(graveId('u1', falls[0]), 'u1:100:run:1');
});
