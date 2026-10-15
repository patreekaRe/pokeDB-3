import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { BELTS, TRIALS, DOJO_REWARDS, beltOf, nextBelt, dojoEarned, trialMissed, trialOpen } from '../js/data/dojo.js';
import { CARDS_BY_ID } from '../js/data/cards.js';
import { STARTERS_BY_ID } from '../js/data/starters.js';
import { FURNITURE_BY_KIND, isEarned } from '../js/data/furniture.js';

const at = (p) => new URL(`../${p}`, import.meta.url);

test('every trial deals real cards to a real starter, against a foe with a picture, with enough for its turns', () => {
  const ids = new Set();
  for (const t of TRIALS) {
    assert.ok(!ids.has(t.id), `${t.id} twice`); ids.add(t.id);
    assert.ok(STARTERS_BY_ID[t.starter], t.starter);
    for (const c of t.deck) assert.ok(CARDS_BY_ID[c] && !c.endsWith('+'), `${t.id}: ${c}`);
    assert.ok(t.deck.length >= 5 * (t.goal.turns || 1), `${t.id}: deck too short to draw its turns without reshuffling`);
    assert.ok(existsSync(at(t.foe.image)), t.foe.image);
    assert.ok(t.foe.moves.length && t.foe.hp > 0 && t.foe.type === 'normal');
    assert.ok(t.goal.turns, `${t.id} needs a turn limit, or it can't be lost but by fainting`);
    assert.ok(t.before.length && t.after && t.fail && t.goalText && t.tip);
  }
});

test('belts climb, and need stars and wins that never shrink', () => {
  for (let i = 1; i < BELTS.length; i++) {
    assert.ok(BELTS[i].stars >= BELTS[i - 1].stars && BELTS[i].wins >= BELTS[i - 1].wins);
    assert.ok(BELTS[i].line && BELTS[i].talk.length);
  }
  const save = (stars, kenWins) => ({ dojo: { stars: TRIALS.slice(0, stars).map(t => t.id) }, kenWins });
  assert.equal(beltOf({}), 0);
  assert.equal(beltOf(save(2, 0)), 1);
  assert.equal(beltOf(save(4, 0)), 1, 'green needs a win against him too');
  assert.equal(beltOf(save(4, 1)), 2);
  assert.equal(beltOf({ dojo: { stars: ['t1', 'gone'] }, kenBeaten: true }), 0, 'an unknown trial id is no star');
  assert.deepEqual(nextBelt(save(4, 1)).stars, 4);
  assert.ok(trialOpen({}, 0) && !trialOpen({}, 1) && trialOpen(save(1, 0), 1));
});

test('the dojo set: each piece a furniture kind of its own, earned by its belt or stars', () => {
  const src = readFileSync(at('js/base-furniture-dojo.js'), 'utf8');
  for (const r of DOJO_REWARDS) {
    assert.ok(src.includes(`id: '${r.kind}'`), r.kind);
    assert.deepEqual(FURNITURE_BY_KIND[r.kind].from, ['dojo', r.kind]);
  }
  assert.ok(dojoEarned({ dojo: { stars: ['t1'] } }, 'kenposter'));
  assert.ok(!dojoEarned({}, 'kenposter'));
  assert.ok(isEarned(FURNITURE_BY_KIND.dojomat, { dojo: { stars: ['t1', 't2'] } }));
  assert.ok(!isEarned(FURNITURE_BY_KIND.wingchun, { dojo: { stars: ['t1', 't2', 't3', 't4'] } }));
});

test('a trial\'s goal reads the fight\'s result', () => {
  const [t1, t2, t3, , , , t7] = TRIALS;
  const won = { won: true, turns: 1, damageTaken: 0, hp: 30, maxHp: 30, felledBy: null };
  assert.equal(trialMissed(t1, won), null);
  assert.equal(trialMissed(t1, { ...won, turns: 2 }), 'turns');
  assert.equal(trialMissed(t1, { won: false }), 'fainted');
  assert.equal(trialMissed(t2, { ...won, damageTaken: 3 }), 'hit');
  assert.equal(trialMissed(t3, won), 'burn');
  assert.equal(trialMissed(t3, { ...won, felledBy: 'burn' }), null);
  assert.equal(trialMissed(t7, { ...won, hp: 39, maxHp: 40 }), 'full');
  assert.equal(trialMissed(t1, { won: false, trialFailed: 'turns' }), 'turns');
});
