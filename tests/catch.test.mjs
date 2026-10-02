// The Safari Zone's catch odds (js/data/balls.js) and its seeded rolls: the same throw must land the same for everyone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BALLS, CATCH_HP, CATCH_BASE, CATCH_CAP, RARE, baseOdds, catchChance, ballWeek, ballsInBag } from '../js/data/balls.js';
import { SAFARI_AREAS, SAFARI_ROSTER, markRares, safariSeed } from '../js/data/safari.js';
import { CARDS_BY_ID, SIGNATURE_FOR, ALL_CARDS, poolForType } from '../js/data/cards.js';
import { ENEMY_DEFS } from '../js/data/enemies.js';
import { random, useStream, streamOf } from '../js/rng.js';
import { cardChoices } from '../js/rewards.js';
import { STARTERS_BY_ID } from '../js/data/starters.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} vs ${b}`);

test('no throw above red HP or at 0 HP', () => {
  assert.equal(catchChance({ hpFrac: CATCH_HP }), 0);
  assert.equal(catchChance({ hpFrac: 0.5 }), 0);
  assert.equal(catchChance({ hpFrac: 0 }), 0);
});

test('a plain Safari Ball: the base odds, rising as HP falls', () => {
  close(catchChance({ hpFrac: CATCH_HP - 1e-12 }), CATCH_BASE.at);
  close(baseOdds(0), CATCH_BASE.low);
  close(catchChance({ hpFrac: 0.125 }), (CATCH_BASE.at + CATCH_BASE.low) / 2);
  let last = 0;
  for (let hp = 0.24; hp > 0; hp -= 0.02) {
    const p = catchChance({ hpFrac: hp });
    assert.ok(p > last, `odds fall at ${hp}`);
    last = p;
  }
});

test('better balls, debuffs and Bait raise the odds; a rare spawn lowers them', () => {
  const at = { hpFrac: 0.15 };
  const safari = catchChance(at);
  assert.ok(catchChance({ ...at, ball: 'great' }) > safari);
  assert.ok(catchChance({ ...at, ball: 'ultra' }) > catchChance({ ...at, ball: 'great' }));
  assert.ok(catchChance({ ...at, debuffs: 2 }) > catchChance({ ...at, debuffs: 1 }));
  assert.ok(catchChance({ ...at, debuffs: 1 }) > safari);
  assert.ok(catchChance({ ...at, bait: 1 }) > safari);
  assert.ok(catchChance({ ...at, rare: true }) < safari);
  // the games' shape: a multiplier m turns a miss chance q into q^m
  close(catchChance({ ...at, ball: 'ultra' }), 1 - Math.pow(1 - baseOdds(0.15), 2));
  close(catchChance({ ...at, rare: true }), 1 - Math.pow(1 - baseOdds(0.15), RARE.mult));
});

test('the special balls only shine in their moment', () => {
  const at = { hpFrac: 0.15 };
  const plain = catchChance(at);
  assert.ok(catchChance({ ...at, ball: 'dusk', night: true }) > catchChance({ ...at, ball: 'ultra' }));
  close(catchChance({ ...at, ball: 'dusk', night: false }), plain);
  assert.ok(catchChance({ ...at, ball: 'quick', turn: 2 }) > plain);
  close(catchChance({ ...at, ball: 'quick', turn: 4 }), plain);
  close(catchChance({ ...at, ball: 'timer', turn: 1 }), plain);
  assert.ok(catchChance({ ...at, ball: 'timer', turn: 9 }) > catchChance({ ...at, ball: 'timer', turn: 5 }));
  close(catchChance({ ...at, ball: 'timer', turn: 30 }), catchChance({ ...at, ball: 'timer', turn: 9 }));   // capped at x3
  assert.ok(catchChance({ ...at, ball: 'net', type: 'water' }) > plain);
  assert.ok(catchChance({ ...at, ball: 'net', type: 'grass' }) > plain);
  close(catchChance({ ...at, ball: 'net', type: 'fire' }), plain);
  close(catchChance({ ...at, ball: 'luxury' }), plain);
});

test('only the Master Ball is sure; everything else stops at the cap', () => {
  assert.equal(catchChance({ hpFrac: 0.2, ball: 'master', rare: true }), 1);
  const best = catchChance({ hpFrac: 0.01, ball: 'dusk', night: true, debuffs: 4, bait: 3 });
  assert.equal(best, CATCH_CAP);
});

test('the Master Ball comes back every UTC week, from Monday', () => {
  assert.equal(ballWeek(new Date('2026-10-04T23:59:59Z')), '2026-W40');   // a Sunday
  assert.equal(ballWeek(new Date('2026-10-05T00:00:00Z')), '2026-W41');   // Monday
  assert.equal(ballWeek(new Date('2027-01-01T12:00:00Z')), '2026-W53');   // ISO weeks: Friday 1 Jan is still 2026's last week
  const owned = { great: 2, ultra: 0, owned: ['master', 'net'], masterWeek: null };
  const ids = (bag) => bag.map(x => x.ball.id);
  assert.deepEqual(ids(ballsInBag(owned, '2026-W41')), ['safari', 'great', 'net', 'master']);
  assert.deepEqual(ids(ballsInBag({ ...owned, masterWeek: '2026-W41' }, '2026-W41')), ['safari', 'great', 'net']);
  assert.deepEqual(ids(ballsInBag({ ...owned, masterWeek: '2026-W40' }, '2026-W41')), ['safari', 'great', 'net', 'master']);
  assert.equal(ballsInBag(owned).find(x => x.ball.id === 'great').left, 2);
  assert.ok(BALLS.find(b => b.free));
});

test('a throw rolls the same on the same seed and room', () => {
  const throws = () => {
    useStream(safariSeed('2026-10-02'), 'room:0:n7');
    const out = Array.from({ length: 6 }, () => random() < catchChance({ hpFrac: 0.12, ball: 'great', debuffs: 1 }));
    useStream(null);
    return out;
  };
  assert.deepEqual(throws(), throws());
  const rolls = Array.from({ length: 6 }, streamOf(safariSeed('2026-10-02'), 'room:0:n7'));
  assert.deepEqual(throws(), rolls.map(r => r < catchChance({ hpFrac: 0.12, ball: 'great', debuffs: 1 })));
});

test('rare spawns are rolled on the seed, from the area\'s own list', () => {
  const rooms = () => Array.from({ length: 200 }, (_, i) => ({ id: `n${i}`, enemyId: 'rattata' }));
  const roll = () => { useStream(safariSeed('2026-10-02'), 'biome:0'); const r = rooms(); markRares(r, SAFARI_AREAS[0]); useStream(null); return r; };
  const a = roll(), b = roll();
  assert.deepEqual(a, b);
  const rare = a.filter(r => r.rare);
  assert.ok(rare.length > 10 && rare.length < 45, `${rare.length} rare of 200`);
  assert.ok(rare.every(r => SAFARI_AREAS[0].rares.includes(r.enemyId)));
});

test('every Safari Pokémon has a signature card, never offered outside the Safari', () => {
  for (const id of SAFARI_ROSTER) {
    assert.ok(ENEMY_DEFS[id], id);
    const card = CARDS_BY_ID[SIGNATURE_FOR[id]];
    assert.ok(card?.safari, `${id} has no signature card`);
    assert.ok(CARDS_BY_ID[`${card.id}+`], `${card.id} has no upgrade`);
  }
  for (const area of SAFARI_AREAS) assert.ok(area.rares.length && area.rares.every(id => ENEMY_DEFS[id]), area.id);
  assert.ok(!ALL_CARDS.some(c => c.safari));
  for (const type of ['fire', 'grass', 'water', 'psychic']) assert.ok(!poolForType(type).some(c => c.safari));
});

test('Bait and Rock are only offered in a Safari run', () => {
  const offered = (safari) => {
    const seen = new Set();
    const run = { starter: STARTERS_BY_ID.charmander, biome: 0, deck: [], safari };
    for (let i = 0; i < 400; i++) for (const c of cardChoices(run, 'fight', 3)) seen.add(c.id);
    return seen;
  };
  const main = offered(null), safari = offered({ seed: 1 });
  assert.ok(!main.has('bait') && !main.has('rock'));
  assert.ok(safari.has('bait') && safari.has('rock'));
});
