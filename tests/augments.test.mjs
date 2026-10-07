import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUGMENTS, AUGMENTS_BY_ID, AUG_TIERS, AUG_FLOORS, augmentOffer, augEffects, augTier, augAllowed, lifeline } from '../js/data/augments.js';
import { towerWeekly, weekOffset, TOP_FLOOR } from '../js/data/tower.js';
import { CARDS_BY_ID } from '../js/data/cards.js';
import { towerResult, checkTowerEntry } from '../js/data/leaderboard.js';

const seed = towerWeekly('2026-10-05').seed;
const ids = (list) => list.map(a => a.id);

test('every augment is well formed: a unique id, a tier, a name, a text and a type the game has', () => {
  assert.equal(new Set(AUGMENTS.map(a => a.id)).size, AUGMENTS.length);
  for (const a of AUGMENTS) {
    assert.ok(AUG_TIERS.includes(a.tier), a.id);
    assert.ok(a.name && a.text && a.icon, a.id);
    assert.ok(!a.type || ['fire', 'grass', 'water'].includes(a.type), a.id);
    assert.ok(Object.keys(a).some(k => !['id', 'tier', 'type', 'icon', 'name', 'text', 'needs'].includes(k)), `${a.id} does nothing`);
  }
  for (const type of ['fire', 'grass', 'water']) for (const tier of AUG_TIERS) {
    assert.ok(AUGMENTS.some(a => a.type === type && a.tier === tier), `${type} has a ${tier} augment`);
  }
});

test('picks: before floor 1 and after every guardian but the top, Silver / Gold / Prismatic by height', () => {
  assert.deepEqual(AUG_FLOORS, [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
  assert.ok(!AUG_FLOORS.includes(TOP_FLOOR));
  assert.deepEqual(AUG_FLOORS.map(augTier), ['silver', 'silver', 'silver', 'silver', 'gold', 'gold', 'gold', 'prismatic', 'prismatic', 'prismatic']);
});

test('the week deals the same three at the same floor for everyone, and the same three after a reroll', () => {
  for (const floor of AUG_FLOORS) {
    const a = augmentOffer({ seed, floor, type: 'fire' }), b = augmentOffer({ seed, floor, type: 'fire' });
    assert.deepEqual(ids(a), ids(b));
    assert.equal(a.length, 3);
    assert.equal(new Set(ids(a)).size, 3);
    const r1 = augmentOffer({ seed, floor, reroll: 1, type: 'fire' });
    assert.deepEqual(ids(r1), ids(augmentOffer({ seed, floor, reroll: 1, type: 'fire' })));
    for (const id of ids(r1)) assert.ok(!ids(a).includes(id), `reroll at ${floor} shows ${id} again`);
  }
});

test('offers differ between weeks and floors', () => {
  const other = towerWeekly(weekOffset('2026-10-05', 1)).seed;
  const here = (s, f) => ids(augmentOffer({ seed: s, floor: f, type: 'water' })).join();
  assert.notEqual(here(seed, 0), here(other, 0));
  assert.notEqual(here(seed, 10), here(seed, 20));
});

test('an offer is mostly its floor\'s tier, sometimes one up, never down', () => {
  const counts = { same: 0, up: 0 };
  for (let w = 0; w < 200; w++) {
    const s = towerWeekly(weekOffset('2026-10-05', w)).seed;
    for (const floor of [0, 40]) for (const a of augmentOffer({ seed: s, floor, type: 'grass' })) {
      const d = AUG_TIERS.indexOf(a.tier) - AUG_TIERS.indexOf(augTier(floor));
      assert.ok(d === 0 || d === 1, `${a.id} at ${floor}`);
      counts[d ? 'up' : 'same'] += 1;
    }
  }
  const up = counts.up / (counts.up + counts.same);
  assert.ok(up > 0.04 && up < 0.18, `tier-up share ${up}`);
});

test('never one already held, never another type\'s, never one whose need is missing', () => {
  for (let w = 0; w < 100; w++) {
    const s = towerWeekly(weekOffset('2026-10-05', w)).seed;
    const held = [];
    for (const floor of AUG_FLOORS) {
      const offer = augmentOffer({ seed: s, floor, type: 'fire', held, deck: ['tackle'], cards: CARDS_BY_ID });
      for (const a of offer) {
        assert.ok(!held.includes(a.id), a.id);
        assert.ok(!a.type || a.type === 'fire', a.id);
        assert.ok(a.needs !== 'x', a.id);
      }
      held.push(offer[0].id);
    }
  }
});

test('holding one walks on down the same seeded order, so the rest of the offer stays put', () => {
  const full = augmentOffer({ seed, floor: 40, type: 'water' });
  const less = augmentOffer({ seed, floor: 40, type: 'water', held: [full[0].id] });
  assert.ok(!ids(less).includes(full[0].id));
  assert.ok(ids(less).includes(full[1].id) || ids(less).includes(full[2].id));
});

test('augEffects adds numbers, multiplies the MULT keys and drops a spent lifeline', () => {
  const e = augEffects(['iron-wall', 'ember-skin', 'duelist', 'fortress', 'phoenix']);
  assert.equal(e.startBlock, 14);
  assert.ok(Math.abs(e.dmgMult - 1.25 * 0.85) < 1e-9);
  assert.equal(e.blazeAlways, true);
  assert.equal(augEffects(['rebirth'], ['rebirth']).rebirth, undefined);
  assert.equal(lifeline(['second-wind', 'rebirth'], []), 'rebirth');
  assert.equal(lifeline(['second-wind', 'rebirth'], ['rebirth']), 'second-wind');
  assert.equal(lifeline(['last-breath'], []), 'last-breath');
  assert.equal(lifeline(['heavy-hitter'], []), null);
});

test('Overcharge needs an X card in the deck', () => {
  const over = AUGMENTS_BY_ID.overcharge;
  const x = Object.values(CARDS_BY_ID).find(c => c.cost === 'X');
  assert.ok(!augAllowed(over, { type: 'fire', deck: ['tackle'], cards: CARDS_BY_ID }));
  assert.ok(augAllowed(over, { type: 'fire', deck: [x.id], cards: CARDS_BY_ID }));
});

test('a climb\'s board entry carries its augments, and the rules take at most ten', () => {
  const r = towerResult({ week: '2026-10-05', starter: 'charmander', floor: 30, turns: 200, startedAt: new Date(Date.now() - 6e5).toISOString(), augments: ['iron-wall', 'echo'] });
  assert.deepEqual(r.augments, ['iron-wall', 'echo']);
  const entry = { ...r, uid: 'u1', name: 'ASH', at: new Date().toISOString() };
  assert.equal(checkTowerEntry(entry, '2026-10-05'), null);
  assert.match(checkTowerEntry({ ...entry, augments: Array(11).fill('echo') }, '2026-10-05'), /augments/);
  const { augments, ...old } = entry;
  assert.equal(checkTowerEntry(old, '2026-10-05'), null);   // an entry posted before augments
});
