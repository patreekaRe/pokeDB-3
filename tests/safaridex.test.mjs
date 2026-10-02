// The Safari Pokédex (js/data/safari.js): its pages come from the area rosters, so a Pokémon added to an area joins it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SAFARI_AREAS, SAFARI_ROSTER, SAFARI_NUMBER, SAFARI_DEX_PAGES, safariHomes, safariProgress } from '../js/data/safari.js';
import { ENEMY_DEFS } from '../js/data/enemies.js';
import { SIGNATURE_FOR } from '../js/data/cards.js';

test('one page per area, holding every wild and rare spawn of that area once', () => {
  assert.equal(SAFARI_DEX_PAGES.length, SAFARI_AREAS.length);
  for (const [i, a] of SAFARI_AREAS.entries()) {
    const p = SAFARI_DEX_PAGES[i];
    assert.equal(p.area, a.id);
    assert.deepEqual(new Set(p.ids), new Set([...a.normals, ...a.rares]));
    assert.equal(p.ids.length, new Set(p.ids).size);
    for (const id of p.rare) assert.ok(a.rares.includes(id) && !p.wild.includes(id));
  }
});

test('every entry is a real Pokémon with a number, a picture and a signature card', () => {
  const numbers = Object.values(SAFARI_NUMBER);
  assert.equal(numbers.length, SAFARI_ROSTER.length);
  assert.deepEqual([...numbers].sort((a, b) => a - b), SAFARI_ROSTER.map((_, i) => i + 1));
  for (const id of SAFARI_DEX_PAGES.flatMap(p => p.ids)) {
    assert.ok(ENEMY_DEFS[id]?.image, id);
    assert.ok(SAFARI_NUMBER[id], id);
    assert.ok(SIGNATURE_FOR[id], id);
    assert.ok(safariHomes(id).length >= 1, id);
  }
});

test('progress counts caught as seen and ignores ids from elsewhere', () => {
  const ids = SAFARI_DEX_PAGES[0].ids;
  assert.deepEqual(safariProgress(ids), { caught: 0, seen: 0, total: ids.length });
  const dex = { seen: [ids[0], ids[1], 'not-a-safari-mon'], caught: [ids[1], ids[2]] };
  assert.deepEqual(safariProgress(ids, dex), { caught: 2, seen: 3, total: ids.length });
});

test('a rare spawn is marked rare in the areas it spawns in', () => {
  const p = SAFARI_DEX_PAGES.find(pg => pg.rare.length);
  const id = p.rare[0];
  assert.ok(safariHomes(id).some(h => h.name === p.name && h.rare));
});
