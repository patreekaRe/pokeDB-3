import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

globalThis.location ||= { search: '' };
const { ALL_CARDS, CARDS_BY_ID, poolForType, describe, cardTerms, STAGE_STATUS, scaledEffects } = await import('../js/data/cards.js');
const { STARTERS_BY_ID } = await import('../js/data/starters.js');
const { RELICS, ENERGY_RELICS } = await import('../js/data/relics.js');
const { ITEMS } = await import('../js/data/items.js');
const { CARD_ART_IDS } = await import('../js/card-art.js');

// the user's call (2026-10-26, after Bubble and Bubble Beam sat in one hand): not even the same card with other numbers.
// tools/card-twins.mjs lists any it finds, with the runs that meet them
test('no two cards a run can meet read alike: the same lines with other numbers, or one plus a line (CLAUDE.md\'s rule)', async () => {
  const { twinReport } = await import('../tools/card-twins.mjs');
  assert.deepEqual(twinReport().map(p => `${p.kind}: ${p.a.id} / ${p.b.id} (${p.runs[0]})`), []);
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

test('a Duo Run\'s own cards and relic stay out of every other run (Baton Pass, Shed Shell)', async () => {
  const { fitsRun } = await import('../js/data/duo.js');
  assert.ok(!poolForType('fire').some(c => c.id === 'baton-pass'));
  assert.ok(poolForType('fire', true).some(c => c.id === 'baton-pass'));
  const shed = RELICS.find(r => r.id === 'shed-shell');
  assert.ok(!fitsRun(shed, { starter: STARTERS_BY_ID.charmander, relics: [] }));
  assert.ok(fitsRun(shed, { starter: STARTERS_BY_ID.charmander, duo: { ids: ['charmander', 'shinx'], out: 0 }, relics: [] }));
});

test('Electric: a full starting deck, its evolution cards, its Ability', async () => {
  const { ABILITIES } = await import('../js/data/relics.js');
  const { evolutionCardsFor } = await import('../js/data/cards.js');
  const deck = STARTERS_BY_ID.shinx.deck.map(id => CARDS_BY_ID[id]);
  assert.equal(deck.length, 10);
  assert.equal(deck.filter(c => c.effects.damage && !c.effects.static).length, 3);   // Fire's shape: 3 attacks, 4 blocks and an Iron Wave
  assert.equal(deck.filter(c => c.effects.block && !c.effects.damage).length, 5);
  assert.equal(evolutionCardsFor('electric', 1).length, 4);
  assert.equal(evolutionCardsFor('electric', 2).length, 4);
  assert.equal(ABILITIES.electric.id, 'static');
});

test('Ice: a full starting deck, its evolution cards, its Ability, and Icicle on the right cards', async () => {
  const { ABILITIES } = await import('../js/data/relics.js');
  const { evolutionCardsFor, typePool } = await import('../js/data/cards.js');
  const deck = STARTERS_BY_ID.vanillite.deck.map(id => CARDS_BY_ID[id]);
  assert.equal(deck.length, 10);
  assert.ok(deck.every(c => c.type === 'ice'));
  assert.equal(evolutionCardsFor('ice', 1).length, 4);
  assert.equal(evolutionCardsFor('ice', 2).length, 4);
  assert.equal(ABILITIES.ice.id, 'snow-warning');
  const pool = typePool('ice');
  assert.deepEqual([pool.filter(c => !c.rarity).length, pool.filter(c => c.rarity === 'uncommon').length, pool.filter(c => c.rarity === 'rare').length], [19, 31, 14]);   // StS's split, whole since session 6, less the twins taken out 2026-10-27
  assert.equal(STARTERS_BY_ID.swinub.skinOf, 'vanillite');
  assert.ok(CARDS_BY_ID.icicle.token && CARDS_BY_ID.icicle.icicle);
});

test('Fighting: a full starting deck, its evolution cards, its Ability, and Sore a status card', async () => {
  const { ABILITIES } = await import('../js/data/relics.js');
  const { evolutionCardsFor, typePool } = await import('../js/data/cards.js');
  const deck = STARTERS_BY_ID.timburr.deck.map(id => CARDS_BY_ID[id]);
  assert.equal(deck.length, 10);
  assert.ok(deck.every(c => c.type === 'fighting'));
  assert.equal(evolutionCardsFor('fighting', 1).length, 3);   // less the cards taken out of the pools as twins, 2026-10-27 (docs/card-twins.md)
  assert.equal(evolutionCardsFor('fighting', 2).length, 4);
  assert.equal(ABILITIES.fighting.id, 'guts');
  const pool = typePool('fighting');
  assert.deepEqual([pool.filter(c => !c.rarity).length, pool.filter(c => c.rarity === 'uncommon').length, pool.filter(c => c.rarity === 'rare').length], [20, 31, 14]);   // StS's split, whole since session 8, less the twins taken out 2026-10-27
  assert.equal(STARTERS_BY_ID.machop.skinOf, 'timburr');
  const sore = CARDS_BY_ID.sore;
  assert.ok(sore.status && sore.unplayable && sore.ethereal);
});

test('Ground: a full starting deck, its evolution cards, its Ability, and Dig cards that surface', async () => {
  const { ABILITIES } = await import('../js/data/relics.js');
  const { evolutionCardsFor, typePool } = await import('../js/data/cards.js');
  const deck = STARTERS_BY_ID.trapinch.deck.map(id => CARDS_BY_ID[id]);
  assert.equal(deck.length, 10);
  assert.ok(deck.every(c => c.type === 'ground'));
  assert.equal(evolutionCardsFor('ground', 1).length, 4);
  assert.equal(evolutionCardsFor('ground', 2).length, 3);   // less the cards taken out of the pools as twins, 2026-10-27 (docs/card-twins.md)
  assert.equal(ABILITIES.ground.id, 'sturdy');
  const pool = typePool('ground');
  assert.deepEqual([pool.filter(c => !c.rarity).length, pool.filter(c => c.rarity === 'uncommon').length, pool.filter(c => c.rarity === 'rare').length], [19, 32, 14]);   // StS's split, whole since session 10, less the twins taken out 2026-10-27
  assert.equal(STARTERS_BY_ID.rhyhorn.skinOf, 'trapinch');
  // a Dig card's upgrade keeps a Surface part (an upgrade replaces `surface` whole)
  for (const c of [...pool, ...evolutionCardsFor('ground', 1), ...evolutionCardsFor('ground', 2)].filter(c => c.effects.surface)) {
    assert.ok(Object.keys(CARDS_BY_ID[`${c.id}+`].effects.surface).length, c.id);
  }
});

test('Flying: a full starting deck, its evolution cards, its Ability, and the neutral Tailwind renamed', async () => {
  const { ABILITIES } = await import('../js/data/relics.js');
  const { evolutionCardsFor, typePool } = await import('../js/data/cards.js');
  const deck = STARTERS_BY_ID.starly.deck.map(id => CARDS_BY_ID[id]);
  assert.equal(deck.length, 10);
  assert.ok(deck.every(c => c.type === 'flying'));
  assert.equal(evolutionCardsFor('flying', 1).length, 4);
  assert.equal(evolutionCardsFor('flying', 2).length, 3);   // less the cards taken out of the pools as twins, 2026-10-27 (docs/card-twins.md)
  assert.equal(ABILITIES.flying.id, 'keen-eye');
  const pool = typePool('flying');
  assert.deepEqual([pool.filter(c => !c.rarity).length, pool.filter(c => c.rarity === 'uncommon').length, pool.filter(c => c.rarity === 'rare').length], [20, 31, 14]);   // StS's split, whole since session 12, less the twins taken out 2026-10-27
  assert.equal(STARTERS_BY_ID.pidgey.skinOf, 'starly');
  assert.equal(STARTERS_BY_ID.pidove.skinOf, 'starly');
  // answer 18: Flying owns Tailwind; the neutral card keeps its id under another name
  assert.equal(CARDS_BY_ID.tailwind.type, 'normal');
  assert.notEqual(CARDS_BY_ID.tailwind.name, 'Tailwind');
});

test('Dark: a full starting deck, its evolution cards, its Ability, and the names it took over', async () => {
  const { ABILITIES } = await import('../js/data/relics.js');
  const { evolutionCardsFor, typePool } = await import('../js/data/cards.js');
  const deck = STARTERS_BY_ID.deino.deck.map(id => CARDS_BY_ID[id]);
  assert.equal(deck.length, 10);
  assert.ok(deck.every(c => c.type === 'dark'));
  assert.equal(evolutionCardsFor('dark', 1).length, 4);
  assert.equal(evolutionCardsFor('dark', 2).length, 4);
  assert.equal(ABILITIES.dark.id, 'intimidate');
  const pool = typePool('dark');
  assert.deepEqual([pool.filter(c => !c.rarity).length, pool.filter(c => c.rarity === 'uncommon').length, pool.filter(c => c.rarity === 'rare').length], [20, 31, 14]);   // StS's split, whole since session 14, less the twins taken out 2026-10-27
  assert.equal(STARTERS_BY_ID.sandile.skinOf, 'deino');
  // Intimidate is Dark's Ability, so Fighting's card of that id goes by another name
  assert.notEqual(CARDS_BY_ID.intimidate.name, 'Intimidate');
});
