// Branching biomes (roadmap item 19): the crossroads' roads and what a new biome has to bring.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ENEMY_DEFS, BIOMES, ALT_BIOMES, BIOMES_BY_ID, CROSSROADS, biomeAt, buildEncounter, buildKenEncounter } from '../js/data/enemies.js';
import { SAFARI_MONS } from '../js/data/safari-mons.js';
import { EVENTS_BY_ID } from '../js/data/events.js';
import { ALL_PAGES, BONUS_PAGES, DEX_PAGES, DEX_NUMBER, DEPTHS_PAGE } from '../js/data/pokedex.js';
import { SPRITE_FIT } from '../js/data/sprite-fit.js';
import { modsFor } from '../js/data/difficulty.js';

const root = new URL('../', import.meta.url);
const ALL = [...BIOMES, ...ALT_BIOMES];
const idsOf = (b) => [...b.normals, ...b.elites, ...b.bosses];

test('every biome has 12 wilds, 3 Alphas and 3+ bosses, each with a GIF, a sprite fit and a cry', () => {
  for (const b of ALT_BIOMES) {
    assert.equal(b.normals.length, 12, b.id);
    assert.equal(b.elites.length, 3, b.id);
    assert.ok(b.bosses.length >= 3, b.id);
    for (const id of idsOf(b)) {
      assert.ok(ENEMY_DEFS[id], id);
      assert.ok(existsSync(new URL(`assets/pokemon/${id}-front.gif`, root)), `${id} GIF`);
      assert.ok(SPRITE_FIT[`${id}-front`], `${id} sprite fit`);
      assert.ok(existsSync(new URL(`assets/audio/cries/${id}.mp3`, root)), `${id} cry`);
    }
  }
});

test('each Pokémon lives in one biome only, never in the Safari Zone', () => {
  const seen = new Map(), safari = new Set(SAFARI_MONS.map(m => m.id));
  for (const b of ALL) for (const id of idsOf(b)) {
    assert.ok(!seen.has(id), `${id} is in ${seen.get(id)} and ${b.id}`);
    assert.ok(!safari.has(id), `${id} is a Safari Pokémon`);
    seen.set(id, b.id);
  }
});

test('Alphas and bosses are pure Normal, and off-type moves are marked', () => {
  for (const b of ALT_BIOMES) {
    for (const id of [...b.elites, ...b.bosses]) assert.equal(ENEMY_DEFS[id].type, 'normal', id);
    for (const id of b.normals) assert.ok(['fire', 'grass', 'water', 'normal'].includes(ENEMY_DEFS[id].type), id);
  }
});

test('the crossroads: every road is a biome of its slot, the default road first', () => {
  for (const [slot, roads] of Object.entries(CROSSROADS)) {
    assert.equal(roads[0], BIOMES[slot].id);
    for (const id of roads) assert.equal(BIOMES_BY_ID[id]?.slot, Number(slot), id);
  }
  assert.equal(biomeAt(undefined, 1).id, 'shrine');
  assert.equal(biomeAt(['clearing', 'ruins'], 1).id, 'ruins');
  assert.equal(biomeAt(['clearing', 'ruins'], 2).id, 'wastes');
  BIOMES.forEach((b, i) => assert.equal(b.slot, i));
});

test('an other-road biome fights at its slot\'s numbers', () => {
  const mods = modsFor(0);
  const ruins = BIOMES_BY_ID.ruins;
  assert.equal(buildEncounter(ruins, 'boss', mods, 'dudunsparce').strength, buildEncounter(1, 'boss', mods, 'exploud').strength);
  assert.equal(buildKenEncounter(ruins, mods).maxHp, buildKenEncounter(1, mods).maxHp);
  assert.ok(buildEncounter(ruins, 'fight', mods, 'clauncher').maxHp > ENEMY_DEFS.clauncher.hp * 2);
});

test('Team Rocket has a team in every biome, from its own wilds', () => {
  const team = EVENTS_BY_ID['team-rocket'].team;
  for (const b of ALL) {
    assert.ok(team[b.id]?.length, b.id);
    for (const id of team[b.id]) assert.ok(b.normals.includes(id) && ENEMY_DEFS[id].type === 'normal', `${b.id}: ${id}`);
  }
});

test('bonus pages stay out of the Pokédex count, and old dex numbers stay put', () => {
  assert.equal(BONUS_PAGES.length, ALT_BIOMES.length);
  for (const p of BONUS_PAGES) {
    assert.ok(!DEX_PAGES.includes(p));
    assert.ok(p.bonus.coins > 0);
  }
  assert.equal(ALL_PAGES.indexOf(DEPTHS_PAGE), DEX_PAGES.length);
  assert.equal(DEX_NUMBER[DEPTHS_PAGE.ids[0]], 56);
  assert.equal(DEX_NUMBER[DEPTHS_PAGE.ids.at(-1)], 71);
});

test('the Thornwood Jungle is slot 2\'s other road: mostly Grass, one Normal wild, at the Wastes\' numbers', () => {
  const jungle = BIOMES_BY_ID.thornwood;
  assert.deepEqual(CROSSROADS[2], ['wastes', 'thornwood']);
  const types = jungle.normals.map(id => ENEMY_DEFS[id].type);
  assert.deepEqual(['grass', 'fire', 'water', 'normal'].map(t => types.filter(x => x === t).length), [7, 2, 2, 1]);
  const mods = modsFor(0);
  assert.equal(buildEncounter(jungle, 'boss', mods, 'silvally').strength, buildEncounter(2, 'boss', mods, 'slaking').strength);
  assert.equal(biomeAt(['clearing', 'ruins', 'thornwood'], 2).id, 'thornwood');
});
