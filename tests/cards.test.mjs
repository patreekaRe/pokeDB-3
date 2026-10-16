import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

globalThis.location ||= { search: '' };
const { ALL_CARDS, CARDS_BY_ID, poolForType, describe, cardTerms, STAGE_STATUS, scaledEffects } = await import('../js/data/cards.js');
const { STARTERS_BY_ID } = await import('../js/data/starters.js');
const { RELICS, ENERGY_RELICS } = await import('../js/data/relics.js');
const { ITEMS } = await import('../js/data/items.js');
const { CARD_ART_IDS } = await import('../js/card-art.js');

const STARTER = { fire: 'charmander', grass: 'bulbasaur', water: 'squirtle', psychic: 'mewtwo' };

test('no two cards a run can meet share a cost and text (CLAUDE.md\'s rule)', () => {
  for (const [type, id] of Object.entries(STARTER)) {
    const cards = new Map();
    for (const c of [...poolForType(type), ...STARTERS_BY_ID[id].deck.map(x => CARDS_BY_ID[x])]) cards.set(c.id, c);
    const seen = new Map(), dupes = [];
    for (const c of cards.values()) {
      const key = `${c.cost}|${describe(c)}|${!!c.exhaust}|${!!c.retain}|${!!c.power}|${!!c.innate}|${!!c.ethereal}`;
      if (seen.has(key)) dupes.push(`${type}: ${c.id} reads like ${seen.get(key)}`);
      seen.set(key, c.id);
    }
    assert.deepEqual(dupes, []);
  }
});

test('every card has text, its art and an upgrade that changes something', () => {
  const art = new Set(CARD_ART_IDS);
  for (const c of ALL_CARDS) {
    assert.ok(describe(c).length > 0 || c.unplayable, `${c.id} has no text`);
    assert.ok(art.has(c.id), `${c.id} has no ART line in js/card-art.js`);
    const up = CARDS_BY_ID[`${c.id}+`];
    assert.ok(up, `${c.id} has no upgraded copy`);
    const same = up.cost === c.cost && describe(up) === describe(c) && !!up.exhaust === !!c.exhaust && !!up.innate === !!c.innate
      && !!up.retain === !!c.retain && !!up.ethereal === !!c.ethereal && JSON.stringify(up.growOnPlay) === JSON.stringify(c.growOnPlay);
    assert.ok(!same, `${c.id}+ is the same card as ${c.id}`);
    assert.ok(Array.isArray(cardTerms(c)));
  }
});

test('every relic and item has its PokéSprite art', () => {
  for (const thing of [...RELICS, ...ITEMS]) assert.ok(existsSync(new URL(`../assets/items/${thing.sprite || thing.id}.png`, import.meta.url)), `${thing.id} has no art`);
});

test('relics: every boss relic is offered only after a boss, the energy ones listed, ids unique', () => {
  const ids = RELICS.map(r => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ENERGY_RELICS) assert.ok(RELICS.find(r => r.id === id)?.boss, `${id} should be a boss relic`);
  for (const r of RELICS) assert.ok(r.boss || r.unique || ['common', 'uncommon', 'rare'].includes(r.rarity), `${r.id} has no tier`);
});

test('Leech Seed doesn\'t grow with evolution (the 2026-10-16 balance pass), Burn still does', () => {
  assert.equal(STAGE_STATUS.seed, 0);
  assert.equal(scaledEffects(CARDS_BY_ID['worry-seed'], 2).seed, CARDS_BY_ID['worry-seed'].effects.seed);
  assert.equal(scaledEffects(CARDS_BY_ID['will-o-wisp'], 2).burn, CARDS_BY_ID['will-o-wisp'].effects.burn + 2);
});
