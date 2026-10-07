// Branching biomes (roadmap items 19-20): the crossroads' roads, the pool's roll and what a new biome has to bring.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { ENEMY_DEFS, BIOMES, ALT_BIOMES, BIOMES_BY_ID, POOL, FORKS, LEGACY_ROADS, biomeAt, canWalk, forkRoads, rollRoads, walkAt, buildEncounter, buildKenEncounter, roadsOpen } from '../js/data/enemies.js';
import { useStream } from '../js/rng.js';
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

test('each Pokémon lives in one biome only; the other roads\' are Safari Pokémon, shared, the default road\'s never', () => {
  const seen = new Map(), safari = new Set(SAFARI_MONS.map(m => m.id));
  for (const b of ALL) for (const id of idsOf(b)) {
    assert.ok(!seen.has(id), `${id} is in ${seen.get(id)} and ${b.id}`);
    if (ALT_BIOMES.includes(b)) {
      assert.ok(safari.has(id), `${id} is not a Safari Pokémon`);
      const m = SAFARI_MONS.find(x => x.id === id);
      assert.equal(ENEMY_DEFS[id].safariLine, m.description, `${id} keeps its Safari Pokédex line`);
      assert.equal(ENEMY_DEFS[id].type, m.type, `${id} keeps its Safari type`);
      assert.ok(!ENEMY_DEFS[id].template, `${id} has its biome's numbers, not a template's`);
    } else assert.ok(!safari.has(id), `${id} is a Safari Pokémon`);
    seen.set(id, b.id);
  }
});

test('Alphas and bosses are pure Normal, and off-type moves are marked', () => {
  for (const b of ALT_BIOMES) {
    for (const id of [...b.elites, ...b.bosses]) assert.equal(ENEMY_DEFS[id].type, 'normal', id);
    for (const id of b.normals) assert.ok(['fire', 'grass', 'water', 'normal'].includes(ENEMY_DEFS[id].type), id);
  }
});

test('the crossroads: the default road first, then the run\'s pool biome (an old run\'s: the Ruins, then Thornwood)', () => {
  for (const slot of FORKS) {
    assert.deepEqual(forkRoads(slot, null), [BIOMES[slot].id, LEGACY_ROADS[slot]]);
    assert.deepEqual(forkRoads(slot, { 1: 'savanna', 2: 'ruins' }), [BIOMES[slot].id, slot === 1 ? 'savanna' : 'ruins']);
    for (const id of POOL) assert.ok(canWalk(id, slot), `${id} at ${slot}`);
  }
  assert.ok(!canWalk('savanna', 0) && !canWalk('savanna', 3) && !canWalk('shrine', 2) && canWalk('shrine', 1));
  assert.equal(biomeAt(undefined, 1).id, 'shrine');
  assert.equal(biomeAt(['clearing', 'ruins'], 1).id, 'ruins');
  assert.equal(biomeAt(['clearing', 'ruins'], 2).id, 'wastes');
  assert.equal(biomeAt(['clearing', 'savanna', 'ruins'], 2).slot, 2);
  assert.equal(biomeAt(['clearing', 'wastes'], 1).id, 'shrine', 'a biome that can\'t stand there reads as the default');
  BIOMES.forEach((b, i) => assert.equal(b.slot, i));
});

test('the run-start roll: two different pool biomes, unseen ones first, pure random once all are seen', () => {
  const tally = (seen) => {
    const n = {};
    useStream(42, `roll:${seen}`);
    for (let i = 0; i < 2000; i++) {
      const r = rollRoads(seen);
      assert.ok(POOL.includes(r[1]) && POOL.includes(r[2]) && r[1] !== r[2]);
      n[`${r[1]}>${r[2]}`] = (n[`${r[1]}>${r[2]}`] || 0) + 1;
    }
    useStream(null, '');
    return n;
  };
  assert.deepEqual(Object.keys(tally(['ruins', 'thornwood'])).sort(), ['savanna>ruins', 'savanna>thornwood']);
  const one = tally(['ruins']);
  assert.deepEqual(Object.keys(one).sort(), ['savanna>thornwood', 'thornwood>savanna']);
  assert.ok(Math.abs(one['savanna>thornwood'] - 1000) < 120, 'a coin flip between the two unseen');
  const all = tally(POOL);
  assert.equal(Object.keys(all).length, 6);
  for (const k in all) assert.ok(Math.abs(all[k] - 333) < 80, k);
});

test('a pool biome fights at the slot it\'s walked at, the default road\'s numbers', () => {
  const mods = modsFor(0);
  const at = (b, slot, kind) => { const w = walkAt(b, slot), ids = kind === 'boss' ? w.bosses : kind === 'elite' ? w.elites : w.normals; return ids.map(id => buildEncounter(w, kind, mods, id)); };
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
  for (const b of ALT_BIOMES) for (const slot of FORKS) {
    const w = walkAt(b, slot);
    assert.equal(w, biomeAt({ [slot]: b.id }, slot), 'the same object each time');
    for (const k of ['hpMult', 'dmgBonus', 'bossBonus']) assert.equal(w[k], BIOMES[slot][k], `${b.id}@${slot} ${k}`);
    assert.equal(buildKenEncounter(w, mods).maxHp, buildKenEncounter(slot, mods).maxHp);
    for (const kind of ['fight', 'elite', 'boss']) {
      const mine = avg(at(b, slot, kind).map(e => e.maxHp)), road = avg(at(BIOMES[slot], slot, kind).map(e => e.maxHp));
      assert.ok(Math.abs(mine / road - 1) < 0.1, `${b.id}@${slot} ${kind}: ${Math.round(mine)} vs ${Math.round(road)}`);
    }
  }
  // an attack's average hit (its amount plus the fight's strength) lands within a point of the default road's
  const hit = (b, slot, kind) => avg(at(b, slot, kind).flatMap(e => e.def.moves.filter(m => m.amount && ['attack', 'drain'].includes(m.kind)).map(m => m.amount + e.strength)));
  for (const b of ALT_BIOMES) for (const slot of FORKS) for (const kind of ['fight', 'boss']) {
    const mine = hit(b, slot, kind), road = hit(BIOMES[slot], slot, kind);
    assert.ok(Math.abs(mine - road) <= 1.5, `${b.id}@${slot} ${kind}: ${mine.toFixed(1)} vs ${road.toFixed(1)}`);
  }
});

test('an other-road biome fights at its slot\'s numbers', () => {
  const mods = modsFor(0);
  const ruins = BIOMES_BY_ID.ruins;
  assert.equal(ruins.slot, ruins.home);
  assert.equal(buildEncounter(ruins, 'boss', mods, 'dunsparce').strength, buildEncounter(1, 'boss', mods, 'exploud').strength);
  assert.equal(buildKenEncounter(ruins, mods).maxHp, buildKenEncounter(1, mods).maxHp);
  assert.ok(buildEncounter(ruins, 'fight', mods, 'corphish').maxHp > ENEMY_DEFS.corphish.hp * 2);
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

test('the Thornwood Jungle: mostly Grass, one Normal wild, at the Wastes\' numbers at home', () => {
  const jungle = BIOMES_BY_ID.thornwood;
  assert.equal(jungle.home, 2);
  const types = jungle.normals.map(id => ENEMY_DEFS[id].type);
  assert.deepEqual(['grass', 'fire', 'water', 'normal'].map(t => types.filter(x => x === t).length), [7, 2, 2, 1]);
  const mods = modsFor(0);
  assert.equal(buildEncounter(jungle, 'boss', mods, 'porygon2').strength, buildEncounter(2, 'boss', mods, 'slaking').strength);
  assert.equal(biomeAt(['clearing', 'ruins', 'thornwood'], 2).id, 'thornwood');
});

test('the other roads open only after a Level 2+ win with every type', () => {
  const s = (fire, grass, water) => ({ maxLevelWinByType: { fire, grass, water } });
  assert.equal(roadsOpen(undefined), false);
  assert.equal(roadsOpen(s(-1, -1, -1)), false);
  assert.equal(roadsOpen(s(5, 5, 1)), false);
  assert.equal(roadsOpen(s(2, 3, 2)), true);
});

test('the Sunscorch Savanna is the pool\'s Fire road: 6 Fire wilds, the rest Water / Grass / pure Normal', () => {
  const savanna = BIOMES_BY_ID.savanna;
  const types = savanna.normals.map(id => ENEMY_DEFS[id].type);
  assert.deepEqual(['fire', 'grass', 'water', 'normal'].map(t => types.filter(x => x === t).length), [6, 2, 2, 2]);
  assert.equal(BONUS_PAGES.at(-1).biome, 'savanna');
  assert.equal(DEX_NUMBER[savanna.normals[0]], 108);
});
