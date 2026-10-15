// Held berries (js/data/held.js): each goes off once a run, on its own moment, and no two do the same thing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { HELD, HELD_BY_ID, holding, heldFires, heldHeal, clearsCard } from '../js/data/held.js';
import { CARDS_BY_ID } from '../js/data/cards.js';
import { MATERIALS_BY_ID } from '../js/data/satchel.js';
import { ENEMY_DEFS } from '../js/data/enemies.js';

const hurt = (hp, lost, maxHp = 60) => ({ hp, maxHp, lost });

test('one held berry a backyard berry, each with its sprite, and no two alike', () => {
  for (const h of HELD) {
    assert.ok(MATERIALS_BY_ID[h.berry]?.grown, h.id);
    assert.ok(existsSync(new URL(`../assets/items/${h.sprite}.png`, import.meta.url)), h.sprite);
    assert.ok(h.text.length < 160, h.id);
  }
  const what = HELD.map(({ on, heal, healShare, hit, strength, cures, clears, shuts }) => JSON.stringify({ on, heal, healShare, hit, strength, cures, clears, shuts }));
  assert.equal(new Set(what).size, HELD.length);
  assert.equal(holding('nope'), null);
  assert.deepEqual(holding('oran'), { id: 'oran', used: false });
});

test('Oran and Sitrus go off once your HP drops below half, never on a faint', () => {
  const oran = holding('oran'), sitrus = holding('sitrus');
  assert.equal(heldFires(oran, 'hurt', hurt(31, 5)), null, 'still at half or more');
  assert.equal(heldFires(oran, 'hurt', hurt(29, 5)).id, 'oran');
  assert.equal(heldFires(oran, 'hurt', hurt(0, 40)), null, 'fainted');
  assert.equal(heldFires(oran, 'hurt', hurt(20, 0)), null, 'no HP lost');
  assert.equal(heldFires(oran, 'status', { card: 'poison' }), null);
  assert.equal(heldFires({ ...oran, used: true }, 'hurt', hurt(10, 5)), null, 'eaten already');
  assert.equal(heldHeal(HELD_BY_ID.oran, 60), 10);
  assert.equal(heldFires(sitrus, 'hurt', hurt(29, 5)).id, 'sitrus');
  assert.equal(heldHeal(HELD_BY_ID.sitrus, 60), 15);
  assert.equal(heldHeal(HELD_BY_ID.sitrus, 90), 22);
});

test('Cheri goes off on one big hit, whatever your HP', () => {
  const cheri = holding('cheri');
  assert.equal(heldFires(cheri, 'hurt', hurt(50, 9)), null);
  assert.equal(heldFires(cheri, 'hurt', hurt(50, 10)).strength, 2);
  assert.equal(heldFires(cheri, 'hurt', hurt(0, 12)), null);
  assert.equal(heldHeal(HELD_BY_ID.cheri, 60), 0);
});

test('Lum clears every status card on the first one; Pecha only Poison, and shuts it out', () => {
  const lum = holding('lum'), pecha = holding('pecha');
  for (const card of ['confusion', 'paralysis', 'poison', 'sludge']) assert.equal(heldFires(lum, 'status', { card })?.id, 'lum', card);
  assert.equal(heldFires(lum, 'hurt', hurt(10, 5)), null);
  assert.equal(heldFires(pecha, 'status', { card: 'paralysis' }), null);
  assert.equal(heldFires(pecha, 'status', { card: 'poison' }).shuts, 'poison');
  const status = Object.values(CARDS_BY_ID).filter(c => c.status && !c.id.endsWith('+'));
  assert.ok(status.every(c => clearsCard(HELD_BY_ID.lum, c)));
  assert.deepEqual(status.filter(c => clearsCard(HELD_BY_ID.pecha, c)).map(c => c.id), ['poison']);
  assert.ok(!clearsCard(HELD_BY_ID.lum, CARDS_BY_ID.tackle ?? Object.values(CARDS_BY_ID).find(c => !c.status)));
});

test('the status cards the berries answer are ones enemies really put in your deck', () => {
  const added = new Set(Object.values(ENEMY_DEFS).flatMap(d => d.moves).filter(m => m.adds).map(m => m.adds.card));
  for (const h of HELD.filter(h => h.on === 'status')) {
    if (h.cures) assert.ok(added.has(h.cures), h.cures);
    if (h.shuts) assert.ok(CARDS_BY_ID[h.shuts]?.status, h.shuts);
  }
  assert.ok(added.has('poison'));
});
