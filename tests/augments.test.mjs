import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUGMENTS, AUGMENTS_BY_ID, AUG_TIERS, AUG_FLOORS, AUG_SETS, augmentOffer, augEffects, augTier, augAllowed, lifeline, dealPrismatic, setBonuses, newBonuses, setMembers, copyCard } from '../js/data/augments.js';
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

test('an offer is mostly its floor\'s tier, at most one slot one up, never down, and the start is all Silver', () => {
  const counts = { same: 0, up: 0 };
  for (let w = 0; w < 200; w++) {
    const s = towerWeekly(weekOffset('2026-10-05', w)).seed;
    for (let r = 0; r < 2; r++) assert.ok(augmentOffer({ seed: s, floor: 0, reroll: r, type: 'grass' }).every(a => a.tier === 'silver'));
    for (const floor of [10, 40]) {
      let ups = 0;
      for (const a of augmentOffer({ seed: s, floor, type: 'grass' })) {
        const d = AUG_TIERS.indexOf(a.tier) - AUG_TIERS.indexOf(augTier(floor));
        assert.ok(d === 0 || d === 1, `${a.id} at ${floor}`);
        counts[d ? 'up' : 'same'] += 1;
        ups += d;
      }
      assert.ok(ups <= 1, `${ups} tier-ups at ${floor}`);
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

test('High Roller\'s 4th slot leaves everyone\'s three as they were, and a reroll after it never repeats one', () => {
  for (let w = 0; w < 60; w++) {
    const s = towerWeekly(weekOffset('2026-10-05', w)).seed;
    for (const floor of AUG_FLOORS) {
      const three = ids(augmentOffer({ seed: s, floor, type: 'water' }));
      const four = ids(augmentOffer({ seed: s, floor, type: 'water', extra: 1 }));
      assert.equal(four.length, 4);
      assert.deepEqual(four.slice(0, 3), three);
      assert.equal(new Set(four).size, 4);
      assert.equal(AUGMENTS_BY_ID[four[3]].tier, augTier(floor), 'the 4th is the floor\'s own tier');
      const again = ids(augmentOffer({ seed: s, floor, type: 'water', extra: 1, reroll: 1 }));
      for (const id of again) assert.ok(!four.includes(id), `${id} shown twice at ${floor}`);
    }
  }
});

test('Darkrai\'s Deal: the week and floor pick the Prismatic, the same for everyone, never one held or not allowed', () => {
  for (let w = 0; w < 40; w++) {
    const s = towerWeekly(weekOffset('2026-10-05', w)).seed;
    for (const floor of [0, 40, 50, 60]) {
      const a = dealPrismatic({ seed: s, floor, type: 'fire' }), b = dealPrismatic({ seed: s, floor, type: 'fire' });
      assert.equal(a.id, b.id);
      assert.equal(a.tier, 'prismatic');
      assert.ok(!a.type || a.type === 'fire');
      assert.notEqual(dealPrismatic({ seed: s, floor, type: 'fire', held: [a.id] }).id, a.id);
    }
  }
  const s = towerWeekly('2026-10-05').seed;
  const picks = new Set(AUG_FLOORS.map(f => dealPrismatic({ seed: s, floor: f, type: 'grass' }).id));
  assert.ok(picks.size > 1, 'differs by floor');
});

test('trade-offs carry a cost and their power; every set has 4+ members and both bonuses', () => {
  const trades = AUGMENTS.filter(a => a.trade);
  assert.ok(trades.length >= 10);
  for (const set of AUG_SETS) {
    assert.ok(setMembers(set.id).length >= 4, set.id);
    for (const at of [2, 3]) assert.ok(set.bonus[at]?.text, `${set.id} ${at}`);
  }
  for (const a of AUGMENTS) if (a.set) assert.ok(AUG_SETS.some(x => x.id === a.set), `${a.id}'s set`);
});

test('set bonuses: 2 held give the first, 3 the second as well, summed into augEffects', () => {
  assert.deepEqual(setBonuses(['iron-wall']), []);
  assert.equal(augEffects(['iron-wall', 'bulwark']).turnBlock, 3);
  assert.equal(augEffects(['iron-wall', 'bulwark']).minBlock, undefined);
  const three = augEffects(['iron-wall', 'bulwark', 'overflow']);
  assert.equal(three.turnBlock, 3);
  assert.equal(three.minBlock, 10);
  assert.equal(augEffects(['iron-wall', 'bulwark', 'overflow', 'fortress']).turnBlock, 3, '4 held is still one of each');
  assert.equal(augEffects(['bloodlust', 'momentum', 'executioner']).startStrength, 3);
  assert.deepEqual(newBonuses(['iron-wall'], 'bulwark').map(b => b.n), [2]);
  assert.deepEqual(newBonuses(['iron-wall', 'bulwark'], 'overflow').map(b => b.n), [3]);
  assert.deepEqual(newBonuses(['iron-wall', 'bulwark'], 'echo'), []);
  assert.equal(augEffects(['gambler', 'lucky-find', 'cursed-gold']).offerPlus, 1);
});

test('Copycat\'s card: the enemy\'s move at half its power, free and exhausting', () => {
  const hit = copyCard({ kind: 'attack', name: 'Tackle', amount: 9 }, 21);
  assert.equal(hit.effects.damage, 11);
  assert.equal(hit.cost, 0);
  assert.ok(hit.exhaust && hit.copied);
  assert.equal(copyCard({ kind: 'defend', name: 'Harden', amount: 7 }).effects.block, 4);
  assert.equal(copyCard({ kind: 'buff', name: 'Growl', amount: 2 }).effects.strength, 1);
  assert.equal(copyCard({ kind: 'drain', name: 'Absorb', amount: 6, heal: 4 }, 6).effects.heal, 2);
});
