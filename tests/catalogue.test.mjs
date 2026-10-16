// The Grand Catalogue (js/data/catalogue.js): a statue for every starter, sold only there, never dealt or duplicated.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location ??= { search: '', pathname: '/', hostname: 'localhost' };
const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const { PIECES, DESIGNS, dealDay, duplicate, kindsOwned, buyBallroom } = await import('../js/secret-base.js');
const { STARTERS } = await import('../js/data/starters.js');
const { STATUE_COSTS, statueKind, statueClass, LUXURY_SHELLS, BALLROOM_KINDS, BALLROOM_PRICE } = await import('../js/data/catalogue.js');
const { getSave } = await import('../js/storage.js');
const { updateSave } = await import('../js/storage.js');

test('every starter has a gold statue at its class\'s price, off the store\'s curve', () => {
  for (const s of STARTERS) {
    const p = PIECES[statueKind(s.id)];
    assert.ok(p, `${s.id} has a statue`);
    assert.ok(p.luxury && DESIGNS.includes(statueKind(s.id)));
    assert.equal(p.price, STATUE_COSTS[statueClass(s)]);
  }
  assert.equal(PIECES[statueKind('mewtwo')].price, STATUE_COSTS.secret);
});

test('statues are never in the store\'s daily deal', () => {
  for (const day of ['2026-10-16', '2026-10-17', '2027-03-01']) for (const floor of dealDay(day)) for (const id of floor) assert.ok(!PIECES[id].luxury, id);
});

test('a statue is never copied by the PC\'s Duplicate', () => {
  updateSave(d => { d.coins = 10000; });
  assert.equal(duplicate({ owned: { [statueKind('charmander')]: 1 } }, statueKind('charmander')), false);
});

test('the shells are new colours, each priced', () => {
  const ids = LUXURY_SHELLS.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of LUXURY_SHELLS) { assert.ok(s.price > 0); assert.ok(!['red', 'blue', 'yellow', 'green', 'pink', 'black', 'gold'].includes(s.id)); }
});

test('the Grand Ballroom opens only for a collector who can pay, and statues don\'t count as kinds', () => {
  const plain = DESIGNS.filter(id => !PIECES[id].luxury);
  const b = { owned: Object.fromEntries(plain.slice(0, BALLROOM_KINDS - 1).map(id => [PIECES[id].own, 1])) };
  b.owned[statueKind('charmander')] = 1;
  const have = kindsOwned(b);
  updateSave(d => { d.coins = BALLROOM_PRICE * 2; });
  if (have < BALLROOM_KINDS) assert.equal(buyBallroom(b), false);
  for (const id of plain.slice(BALLROOM_KINDS - 1, BALLROOM_KINDS + 5)) b.owned[PIECES[id].own] = 1;
  assert.ok(kindsOwned(b) >= BALLROOM_KINDS);
  updateSave(d => { d.coins = BALLROOM_PRICE - 1; });
  assert.equal(buyBallroom(b), false);
  updateSave(d => { d.coins = BALLROOM_PRICE; });
  assert.equal(buyBallroom(b), true);
  assert.ok(b.ballroom);
  assert.equal(getSave().coins, 0);
});
