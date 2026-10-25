// The Secret Base's residents (js/secret-base.js's placeMon()): every room, the yard too, picks from the whole Safari
// list, up to the cap a room, and a Pokémon lives in one room at a time.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location ??= { search: '', pathname: '/', hostname: 'localhost' };
const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { monRoom, monsIn, placeMon, readGuestBase, takeDown } = await import('../js/secret-base.js');
const { freshHouse } = await import('../js/data/house.js');

const withYard = () => ({ v: 2, items: [], house: { ...freshHouse(), yard: { size: 1, items: [], wall: 'cream', floor: 'grass' } } });

test('a room fills to the cap, and a Pokémon moves rather than being in two rooms', () => {
  const b = withYard();
  let shown = [];
  for (const id of ['a', 'b', 'c']) { assert.equal(placeMon(b, shown, id, 'main', 3), 'in'); shown = b.mons; }
  assert.equal(placeMon(b, shown, 'd', 'main', 3), 'full');
  assert.equal(placeMon(b, shown, 'd', 'yard', 3), 'in');
  assert.equal(placeMon(b, b.mons, 'a', 'yard', 3), 'in');
  assert.deepEqual(monsIn(b, b.mons, 'main'), ['b', 'c']);
  assert.deepEqual(monsIn(b, b.mons, 'yard'), ['a', 'd']);
  assert.equal(b.mons.filter(id => id === 'a').length, 1);
  assert.equal(placeMon(b, b.mons, 'a', 'yard', 3), 'out');
  assert.ok(!b.mons.includes('a') && !('a' in b.at));
});

test('a resident of a room that is gone (a lent yard taken back) crowds no other room', () => {
  const b = { v: 2, items: [], at: { x: 'yard' } };
  assert.equal(monRoom(b, 'x'), 'yard');
  assert.deepEqual(monsIn(b, ['x', 'y'], 'main'), ['y']);
  assert.equal(placeMon(b, ['x', 'y'], 'x', 'main', 2), 'in');
  assert.deepEqual(monsIn(b, ['x', 'y'], 'main'), ['x', 'y']);
});

test('the old list of the ones let out in the yard moves over', () => {
  const b = readGuestBase(JSON.stringify({ ...withYard(), mons: ['a', 'b'], out: ['b'] }));
  assert.equal(b.out, undefined);
  assert.equal(monRoom(b, 'a'), 'main');
  assert.equal(monRoom(b, 'b'), 'yard');
});

test('a room taken down sends its Pokémon back to the box', () => {
  const b = { v: 2, items: [], owned: {}, house: freshHouse() };
  b.house.rooms.push({ id: 'r1', kind: 'closet', rot: 0, gx: 0, gy: -4, lv: 0 });
  b.house.links.push(['main', 0, 'r1', 0]);
  b.mons = ['a', 'b'];
  b.at = { b: 'r1' };
  assert.ok(takeDown(b, 'r1'));
  assert.deepEqual(b.mons, ['a']);
  assert.ok(!('b' in b.at));
});
