// The Safari Zone's own Pokémon (js/data/safari-mons.js): one data line each, so these pin what a line has to bring.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { SAFARI_MONS, TEMPLATES, PLACE } from '../js/data/safari-mons.js';
import { SAFARI_AREAS, SAFARI_ROSTER } from '../js/data/safari.js';
import { ENEMY_DEFS, BIOMES, buildEncounter } from '../js/data/enemies.js';
import { CARDS_BY_ID, SIGNATURE_FOR, describe } from '../js/data/cards.js';
import { SPRITE_FIT } from '../js/data/sprite-fit.js';

const root = new URL('../', import.meta.url);
const MAIN_GAME = new Set([...BIOMES.flatMap(b => [...b.normals, ...b.elites, ...b.bosses]), 'chansey', 'kecleon']);

test('every Safari Pokémon has a def, a sprite on disk, a sprite fit, a signature card and an area', () => {
  const ids = SAFARI_MONS.map(m => m.id);
  assert.equal(ids.length, new Set(ids).size, 'no Pokémon twice');
  for (const m of SAFARI_MONS) {
    const def = ENEMY_DEFS[m.id];
    assert.ok(def, m.id);
    assert.ok(!MAIN_GAME.has(m.id), `${m.id} is already in the main game`);
    assert.ok(['fire', 'grass', 'water', 'normal'].includes(def.type), m.id);
    assert.ok(TEMPLATES[m.template], `${m.id}: template ${m.template}`);
    assert.equal(def.moves.length, TEMPLATES[m.template].moves.length, m.id);
    for (const mv of def.moves) assert.ok(mv.name && mv.kind, m.id);
    assert.ok(existsSync(new URL(def.image, root)), `${m.id}: ${def.image}`);
    assert.ok(SPRITE_FIT[`${m.id}-front`], `${m.id}: SPRITE_FIT`);
    const card = CARDS_BY_ID[SIGNATURE_FOR[m.id]];
    assert.ok(card?.safari && CARDS_BY_ID[`${card.id}+`], `${m.id}: signature card`);
    assert.ok(!/undefined|NaN/.test(describe(card)), `${card.id}: ${describe(card)}`);
    const area = SAFARI_AREAS.find(a => a.id === m.area);
    assert.ok(area && (m.rare ? area.rares : area.normals).includes(m.id), `${m.id}: in ${m.area}`);
    assert.ok(SAFARI_ROSTER.includes(m.id));
  }
});

test('no signature card shares cost and text with another card a run can meet', () => {
  const sigs = Object.values(CARDS_BY_ID).filter(c => c.id.startsWith('sig-') && !c.upgraded);
  const others = Object.values(CARDS_BY_ID).filter(c => !c.upgraded && !c.status && c.type !== 'psychic');   // Mewtwo never walks the Safari
  const key = (c) => `${c.cost}|${describe(c)}|${!!c.exhaust}|${!!c.retain}|${!!c.innate}`;
  const twins = sigs.flatMap(s => others.filter(c => c !== s && key(c) === key(s)).map(c => `${s.id} reads like ${c.id}`));
  assert.deepEqual(twins, []);
});

test('a template Pokémon grows with its area\'s place in the run', () => {
  const mods = { normalHp: 1, eliteHp: 1, enemyDmg: 0 };
  const id = SAFARI_MONS[0].id;
  const enc = [0, 1, 2].map(i => buildEncounter(i, 'fight', mods, id));
  for (const [i, e] of enc.entries()) {
    assert.equal(e.maxHp, Math.round(ENEMY_DEFS[id].hp * PLACE[i].hp * BIOMES[i].hpMult));
    assert.equal(e.strength, BIOMES[i].dmgBonus + PLACE[i].dmg);
  }
  const native = buildEncounter(2, 'fight', mods, 'rattata');   // the main game's own wilds are untouched
  assert.equal(native.maxHp, Math.round(ENEMY_DEFS.rattata.hp * BIOMES[2].hpMult));
});
