// Safari shinies (js/data/shinies.js): the wild roll is looks only and off the daily seed, and the save keeps each
// caught shiny's Sparkle, 1-5.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

globalThis.location ??= { search: '', pathname: '/', hostname: 'localhost' };
const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
// an old save, from before Safari shinies
mem.set('pokedb.save.v2', JSON.stringify({ coins: 5, safariDex: { seen: ['marill'], caught: ['marill'], done: [], complete: false } }));
const { SHINY_ODDS, SPARKLE_MAX, markShinies, sparkleOf, shinyGain, addShiny, shinyLine, shinyImage } = await import('../js/data/shinies.js');
const { getSave, gainShiny, safariSparkle } = await import('../js/storage.js');
const { SAFARI_ROSTER } = await import('../js/data/safari.js');
const { ENEMY_DEFS } = await import('../js/data/enemies.js');
const { useStream, random } = await import('../js/rng.js');

test('an old save starts with no Safari shinies', () => {
  assert.deepEqual(getSave().safariShinies, {});
  assert.equal(getSave().coins, 5);
  assert.equal(safariSparkle('marill'), 0);
});

test('a first catch is a new shiny at ★1, each duplicate +1, up to ★5', () => {
  assert.deepEqual(gainShiny('marill'), { was: 0, level: 1, isNew: true, maxed: false });
  assert.equal(safariSparkle('marill'), 1);
  for (let n = 2; n <= SPARKLE_MAX; n++) assert.equal(gainShiny('marill').level, n);
  assert.deepEqual(gainShiny('marill'), { was: 5, level: 5, isNew: false, maxed: true });
  assert.equal(getSave().safariShinies.marill, SPARKLE_MAX);
  assert.equal(JSON.parse(mem.get('pokedb.save.v2')).safariShinies.marill, SPARKLE_MAX, 'saved');
});

test('shinyGain only looks: the catch box reads it before the rewards are collected', () => {
  const shinies = { pikachu: 2 };
  assert.deepEqual(shinyGain(shinies, 'pikachu'), { was: 2, level: 3, isNew: false, maxed: false });
  assert.deepEqual(shinies, { pikachu: 2 });
  addShiny(shinies, 'pikachu');
  assert.equal(shinies.pikachu, 3);
  assert.equal(sparkleOf({ x: 9 }, 'x'), SPARKLE_MAX);
  assert.equal(sparkleOf(null, 'x'), 0);
  assert.match(shinyLine('Pikachu', shinyGain({}, 'pikachu')), /NEW SHINY/);
  assert.match(shinyLine('Pikachu', shinyGain({ pikachu: 2 }, 'pikachu')), /★2 → ★3/);
});

test('the wild roll marks rooms at its odds, and never touches the seeded stream', () => {
  const rooms = Array.from({ length: 6 }, () => ({ type: 'fight' }));
  const rolls = [0.5, 0.001, SHINY_ODDS, 0.9, 0.0066, 0];
  markShinies(rooms, SHINY_ODDS, () => rolls.shift());
  assert.deepEqual(rooms.map(r => !!r.shiny), [false, true, false, false, true, true]);
  const all = Array.from({ length: 5 }, () => ({}));
  markShinies(all, 1);
  assert.ok(all.every(r => r.shiny), '?wildshiny makes every one shiny');
  assert.equal(SHINY_ODDS, 1 / 150);

  useStream('seed', 'room:1:a');
  const expected = random();
  useStream('seed', 'room:1:a');
  markShinies(Array.from({ length: 50 }, () => ({})));
  assert.equal(random(), expected, 'the daily run rolls the same whether or not a shiny came out');
});

test('every Safari Pokémon has its shiny front GIF', () => {
  for (const id of SAFARI_ROSTER) {
    const file = new URL(`../${shinyImage(ENEMY_DEFS[id].spriteId)}`, import.meta.url);
    assert.ok(existsSync(file), `${id} has ${shinyImage(id)}`);
  }
});
