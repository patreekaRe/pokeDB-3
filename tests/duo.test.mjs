// The Safari's duo (js/data/duo.js, docs/duo-design.md sections 1-3): the pair, its deck, its pools and its pool of types.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location ||= { search: '' };
const { STAB, DUO_SWITCH_PP, validDuo, newDuo, restoreDuo, syncDecks, ownerOf, duoDeck, runTypes, outStarter, benchStarter, runPool, runItems, fitsTypes,
  rewardSlots, duoPool, duoGains, duoOpen } = await import('../js/data/duo.js');
const { CARDS_BY_ID, poolForType } = await import('../js/data/cards.js');
const { STARTERS, STARTERS_BY_ID } = await import('../js/data/starters.js');
const { cardChoices, evolutionChoices } = await import('../js/rewards.js');

const duoRun = (ids, out = 0) => { const duo = { ...newDuo(ids), out }; return { starter: STARTERS_BY_ID[ids[0]], duo, deck: duoDeck(duo), biome: 0, stage: 1, relics: [], safari: { day: 'x' } }; };

test('the numbers the user picked: 1 PP a switch, STAB x1.2', () => {
  assert.equal(DUO_SWITCH_PP, 1);
  assert.equal(STAB, 1.2);
});

test('a duo is two starters of different types, each with its own solo starting deck (rule 1b)', () => {
  assert.equal(validDuo({ ids: ['charmander', 'charmander'] }), null);
  assert.equal(validDuo({ ids: ['charmander', 'cyndaquil'] }), null);   // two Fire looks
  assert.equal(validDuo({ ids: ['charmander', 'mewtwo'] }), null);      // the secret starter never pairs
  assert.deepEqual(validDuo({ ids: ['charmander', 'squirtle'], out: 1 }), { ids: ['charmander', 'squirtle'], out: 1 });
  const duo = newDuo(['bulbasaur', 'cyndaquil']);
  assert.deepEqual(duo.decks, [STARTERS_BY_ID.bulbasaur.deck, STARTERS_BY_ID.cyndaquil.deck]);
  assert.notEqual(duo.decks[0], STARTERS_BY_ID.bulbasaur.deck);   // a copy, never the starter's own array
  assert.equal(duoDeck(duo).length, 20);
});

test('the save keeps both decks; a duo saved before them is dropped (rule 6)', () => {
  const r = duoRun(['charmander', 'squirtle']);
  const saved = JSON.parse(JSON.stringify(r.duo));
  assert.deepEqual(restoreDuo(saved, r.deck), r.duo);
  assert.equal(restoreDuo({ ids: ['charmander', 'squirtle'], out: 0 }, r.deck), null);   // session 1's shape
  assert.equal(restoreDuo(saved, r.deck.slice(1)), null);                                // decks that don't add up
  assert.equal(restoreDuo({ ...saved, decks: [['nope'], []] }, ['nope']), null);
});

test('syncDecks: a change to run.deck lands in the right partner\'s deck', () => {
  const r = duoRun(['charmander', 'squirtle'], 1);
  r.deck.push('flamethrower', 'surf');                // a type's card goes to its type's deck
  syncDecks(r);
  assert.ok(r.duo.decks[0].includes('flamethrower') && r.duo.decks[1].includes('surf'));
  r.deck.push('tailwind');                            // a Neutral one waits for you to say who takes it
  syncDecks(r);
  assert.deepEqual(r.duo.loose, ['tailwind']);
  r.deck.push('swords-dance');
  syncDecks(r, { to: 0 });                            // ...unless the pick said whose
  assert.ok(r.duo.decks[0].includes('swords-dance'));
  r.deck.push('sludge');                              // junk goes to the one out
  syncDecks(r);
  assert.ok(r.duo.decks[1].includes('sludge'));
  r.deck.splice(r.deck.indexOf('ember'), 1, 'ember+');   // an upgrade stays in its deck
  syncDecks(r);
  assert.ok(r.duo.decks[0].includes('ember+'));
  r.deck.splice(r.deck.indexOf('swords-dance'), 1);   // a removal leaves the deck that held it
  syncDecks(r);
  assert.ok(!r.duo.decks[0].includes('swords-dance'));
  assert.equal(ownerOf(r.duo, 'water-gun'), 1);
  assert.equal(ownerOf(r.duo, 'tailwind'), -1);
  assert.deepEqual(duoDeck(r.duo), r.deck);
});

test('the one out and the bench', () => {
  const r = duoRun(['charmander', 'squirtle'], 1);
  assert.deepEqual(runTypes(r), ['fire', 'water']);
  assert.equal(outStarter(r).id, 'squirtle');
  assert.equal(benchStarter(r).id, 'charmander');
  assert.equal(outStarter({ starter: STARTERS_BY_ID.bulbasaur }).id, 'bulbasaur');
});

test('pools are both types\' together, Neutral once, `only` relics and items of either', () => {
  const r = duoRun(['charmander', 'bulbasaur']);
  const ids = runPool(r).map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of [...poolForType('fire'), ...poolForType('grass')]) assert.ok(ids.includes(c.id), c.id);
  assert.ok(!ids.some(id => CARDS_BY_ID[id].type === 'water'));
  assert.ok(fitsTypes('grass', ['fire', 'grass']) && fitsTypes(undefined, ['fire']) && !fitsTypes('water', ['fire', 'grass']));
  assert.ok(runItems(['fire', 'grass']).every(i => !i.only || ['fire', 'grass'].includes(i.only)));
});

test('a duo\'s card reward is one of each type, the third either; Neutral at its share', () => {
  assert.deepEqual(rewardSlots(['fire', 'water'], 3, 0.2), ['fire', 'water', 'fire']);
  assert.deepEqual(rewardSlots(['fire', 'water'], 3, 0.7), ['fire', 'water', 'water']);
  const r = duoRun(['charmander', 'squirtle']);
  let fire = 0, water = 0, neutral = 0;
  for (let i = 0; i < 300; i++) {
    const cards = cardChoices(r, 'fight', 3, { reward: true });
    assert.equal(cards.length, 3);
    assert.equal(new Set(cards.map(c => c.id)).size, 3);
    assert.ok(cards.every(c => ['fire', 'water', 'normal'].includes(c.type)));
    assert.notEqual(cards[0].type, 'water');   // slot 1 is Fire's pool
    assert.notEqual(cards[1].type, 'fire');    // slot 2 Water's
    for (const c of cards) c.type === 'fire' ? fire++ : c.type === 'water' ? water++ : neutral++;
  }
  assert.ok(fire > 250 && water > 250 && neutral > 60, `${fire} / ${water} / ${neutral}`);
});

test('a duo evolves with one card of each type offered', () => {
  const evo = evolutionChoices(duoRun(['bulbasaur', 'squirtle']));
  assert.deepEqual(evo.map(c => c.type).sort(), ['grass', 'water']);
});

test('the duo pool: the base three with every owned look, then caught types; old catches count', () => {
  const owned = (s) => s.free || s.id === 'cyndaquil';
  const pool = duoPool({ duoPool: { fire: ['torchic'], bogus: ['nobody'] } }, STARTERS, owned);
  assert.deepEqual(Object.keys(pool).sort(), ['fire', 'grass', 'water']);
  assert.deepEqual(pool.fire, ['charmander', 'cyndaquil', 'torchic']);
  assert.ok(!pool.water.includes('mewtwo'));
  const lines = { electric: { pichu: ['pichu', 'pikachu', 'raichu'] } };
  assert.deepEqual(duoGains(['zubat', 'pikachu'], {}, lines), { electric: ['pichu'] });
  assert.deepEqual(duoGains(['pikachu'], { electric: ['pichu'] }, lines), {});
  assert.deepEqual(duoGains([], {}, lines), {});
});

test('the Duo Run opens once the day\'s Daily run is finished', () => {
  assert.equal(duoOpen({ day: '2026-10-19', tries: 1 }, '2026-10-19'), false);
  assert.equal(duoOpen({ day: '2026-10-19', tries: 1, done: '2026-10-19' }, '2026-10-19'), true);
  assert.equal(duoOpen({ done: '2026-10-18' }, '2026-10-19'), false);
});
