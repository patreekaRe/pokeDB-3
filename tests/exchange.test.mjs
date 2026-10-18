// The Shiny Exchange (js/data/exchange.js): capsule machines of the Safari Pokémon you've caught, gold odds that climb,
// a pull of ten that always holds a gold one, duplicates as Sparkle and Lucky Stars, and ten stars for a free pick.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location ??= { search: '', pathname: '/', hostname: 'localhost' };
const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
// an old save, from before the Exchange
mem.set('pokedb.save.v2', JSON.stringify({ coins: 2000, safariDex: { seen: [], caught: ['pidgey', 'ponyta', 'eevee', 'venonat'], done: [], complete: false } }));
const X = await import('../js/data/exchange.js');
const { getSave, exchangePull, exchangePick } = await import('../js/storage.js');
const { SAFARI_DEX_PAGES } = await import('../js/data/safari.js');

/** A roll that plays back `values`, then `rest`. */
const rolls = (values, rest = 0.5) => { let i = 0; return () => (i < values.length ? values[i++] : rest); };

test('a machine holds only what you caught in its area: wilds plain, rare spawns gold', () => {
  const m = X.machineOf('meadow', ['pidgey', 'eevee', 'venonat', 'chansey']);
  assert.deepEqual(m.plain, ['pidgey']);
  assert.deepEqual(m.gold.sort(), ['chansey', 'eevee']);
  assert.deepEqual(X.machineOf('desert', ['pidgey']), { ...X.machineOf('desert', []), plain: [], gold: [] });
  for (const p of SAFARI_DEX_PAGES) assert.equal(X.machineOf(p.area, p.ids).plain.length + X.machineOf(p.area, p.ids).gold.length, p.ids.length);
});

test('gold odds start at 8%, climb 4% a plain capsule, and fall back after a gold one', () => {
  assert.equal(X.goldOdds(0), 0.08);
  assert.equal(X.goldOdds(3), 0.08 + 0.12);
  assert.equal(X.goldOdds(100), 1);
  const m = X.machineOf('meadow', ['pidgey', 'eevee']);
  const plain = X.pullCapsules(m, 1, {}, 2, rolls([0.2]));   // 0.2 >= 16%: plain
  assert.equal(plain.capsules[0].gold, false);
  assert.equal(plain.pity, 3);
  const gold = X.pullCapsules(m, 1, {}, 3, rolls([0.19]));   // 0.19 < 20%: gold
  assert.equal(gold.capsules[0].gold, true);
  assert.equal(gold.capsules[0].id, 'eevee');
  assert.equal(gold.pity, 0);
});

test('a pull of ten always holds a gold one (when the area has a rare caught), saved for last', () => {
  const m = X.machineOf('meadow', ['pidgey', 'ponyta', 'eevee']);
  const { capsules, pity } = X.pullCapsules(m, 10, {}, 0, () => 0.99);
  assert.equal(capsules.length, 10);
  assert.equal(capsules.filter(c => c.gold).length, 1);
  assert.equal(capsules.at(-1).gold, true);
  assert.equal(pity, 0);
  const none = X.pullCapsules(X.machineOf('meadow', ['pidgey']), 10, {}, 0, () => 0.99);
  assert.ok(none.capsules.every(c => !c.gold), 'no rare caught, no gold capsule');
  assert.equal(none.pity, 10);
});

test('only rares caught: every capsule is gold', () => {
  const { capsules } = X.pullCapsules(X.machineOf('meadow', ['eevee']), 3, {}, 0, () => 0.99);
  assert.ok(capsules.every(c => c.gold && c.id === 'eevee'));
  assert.deepEqual(X.pullCapsules(X.machineOf('meadow', []), 1, {}, 4).capsules, []);
});

test('about one plain capsule in three is a shiny you don\'t own yet, while there are both', () => {
  const m = X.machineOf('meadow', ['pidgey', 'ponyta']);
  const fresh = X.pullCapsules(m, 1, { pidgey: 2 }, 0, rolls([0.2, 0]));   // no rare caught, so no gold roll: new (0.2 < 1/3), the first
  assert.equal(fresh.capsules[0].id, 'ponyta');
  const dupe = X.pullCapsules(m, 1, { pidgey: 2 }, 0, rolls([0.5, 0]));
  assert.equal(dupe.capsules[0].id, 'pidgey');
  let n = 0, seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 3000; k++) if (X.pullCapsules(m, 1, { pidgey: 1 }, 0, rng).capsules[0].id === 'ponyta') n++;
  assert.ok(Math.abs(n / 3000 - 1 / 3) < 0.03, `${n} new of 3000`);
  // nothing owned: always a new one
  assert.equal(X.pullCapsules(m, 1, {}, 0, rolls([0.9])).capsules[0].gain.isNew, true);
});

test('a capsule is one Lucky Star; a duplicate +1 Sparkle and 2, one past ★5 3', () => {
  const shinies = { ponyta: 1, pidgey: 5 };
  const m = { plain: ['ponyta'], gold: [] };
  const a = X.pullCapsules(m, 1, shinies, 0);
  assert.deepEqual(a.capsules[0].gain, { was: 1, level: 2, isNew: false, maxed: false });
  assert.equal(a.stars, 2);
  assert.equal(shinies.ponyta, 2, 'the map is changed in place');
  assert.equal(X.pullCapsules({ plain: ['pidgey'], gold: [] }, 1, shinies, 0).stars, 3);
  assert.equal(X.pullCapsules({ plain: ['venonat'], gold: [] }, 1, shinies, 0).stars, 1);
  // a pull of ten sees its own earlier capsules: the same shiny twice is new, then a duplicate
  const ten = X.pullCapsules({ plain: ['sunkern'], gold: [] }, 10, {}, 0);
  assert.equal(ten.capsules[0].gain.isNew, true);
  assert.equal(ten.capsules[4].gain.level, 5);
  assert.equal(ten.capsules[9].gain.maxed, true);
  assert.equal(ten.stars, 1 + 4 * 2 + 5 * 3);
});

test('the save: a pull pays 150 a capsule, saves the shinies, stars and pity; too few coins or nothing caught pulls nothing', () => {
  assert.deepEqual(getSave().exchange, { stars: 0, pity: 0 }, 'an old save starts the Exchange afresh');
  assert.equal(exchangePull('desert', 1), null, 'nothing caught in the Desert');
  const got = exchangePull('meadow', 10, () => 0.99);
  assert.equal(got.length, 10);
  assert.equal(getSave().coins, 2000 - X.TEN_COST);
  assert.equal(got.at(-1).id, 'eevee');
  assert.equal(getSave().safariShinies.eevee, 1);
  assert.equal(getSave().exchange.pity, 0);
  assert.equal(getSave().exchange.stars, got.reduce((s, c) => s + c.stars, 0));
  assert.equal(exchangePull('meadow', 10), null, '500 coins left');
  const saved = JSON.parse(mem.get('pokedb.save.v2'));
  assert.equal(saved.coins, 500);
  assert.deepEqual(saved.exchange, getSave().exchange);
});

test('ten Lucky Stars pick any caught shiny free, from any area', () => {
  const stars = getSave().exchange.stars;
  assert.ok(stars >= 10);
  assert.equal(exchangePick('chansey'), null, 'not caught');
  const coins = getSave().coins;
  assert.equal(exchangePick('venonat').isNew, true);
  assert.equal(getSave().exchange.stars, stars - X.STARS_FOR_PICK);
  assert.equal(getSave().coins, coins);
  assert.equal(X.luckyPick({}, 9, ['venonat'], 'venonat'), null, 'nine stars pick nothing');
});
