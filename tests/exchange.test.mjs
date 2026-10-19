// The Shiny Exchange (js/data/exchange.js): capsule machines of every Safari Pokémon (one not caught comes out sealed,
// opened by a catch), gold odds that climb, a pull of ten that always holds a gold one, duplicates as Sparkle and Lucky
// Stars, and ten stars for a free pick.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location ??= { search: '', pathname: '/', hostname: 'localhost' };
const mem = new Map();
globalThis.localStorage ??= { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
// an old save, from before the Exchange
mem.set('pokedb.save.v2', JSON.stringify({ coins: 2000, safariDex: { seen: [], caught: ['pidgey', 'ponyta', 'eevee', 'venonat'], done: [], complete: false } }));
const X = await import('../js/data/exchange.js');
const { getSave, exchangePull, exchangePick, openSealedCapsules, staleSealed, markSafari } = await import('../js/storage.js');
const { SAFARI_DEX_PAGES } = await import('../js/data/safari.js');

/** A roll that plays back `values`, then `rest`. */
const rolls = (values, rest = 0.5) => { let i = 0; return () => (i < values.length ? values[i++] : rest); };

test('a machine holds its area\'s every Pokémon, caught or not: wilds plain, rare spawns gold', () => {
  for (const p of SAFARI_DEX_PAGES) {
    const m = X.machineOf(p.area, []);
    assert.deepEqual(m.plain, p.wild);
    assert.deepEqual(m.gold, p.rare);
    assert.equal(m.plain.length + m.gold.length, p.ids.length);
  }
  assert.deepEqual([...X.machineOf('meadow', ['pidgey', 'eevee']).caught], ['pidgey', 'eevee']);
});

test('one you haven\'t caught comes out sealed: no Sparkle, one Lucky Star, kept by id', () => {
  const m = X.machineOf('meadow', []), shinies = {}, sealed = {};
  const got = X.pullCapsules(m, 3, shinies, 0, () => 0.99, sealed);
  assert.ok(got.capsules.every(c => c.sealed && c.gain === null && c.stars === 1));
  assert.equal(got.stars, 3);
  assert.deepEqual(shinies, {});
  assert.equal(X.sealedCount(sealed), 3);
  // a catch opens them all: new, then +1 Sparkle each
  const id = got.capsules[0].id, n = sealed[id];
  const gains = X.openSealed(shinies, sealed, id);
  assert.equal(gains.length, n);
  assert.equal(gains[0].isNew, true);
  assert.equal(shinies[id], n);
  assert.equal(sealed[id], undefined);
  assert.deepEqual(X.openSealed(shinies, sealed, id), [], 'nothing left sealed');
  // a wild shiny caught first: the sealed one makes it ★2
  const s2 = { ponyta: 0 }, k2 = { ponyta: 1 };
  s2.ponyta = 1;
  assert.deepEqual(X.openSealed(s2, k2, 'ponyta'), [{ was: 1, level: 2, isNew: false, maxed: false }]);
});

test('gold odds start at 8%, climb 4% a plain capsule, and fall back after a gold one', () => {
  assert.equal(X.goldOdds(0), 0.08);
  assert.equal(X.goldOdds(3), 0.08 + 0.12);
  assert.equal(X.goldOdds(100), 1);
  const m = { plain: ['pidgey'], gold: ['eevee'] };
  const plain = X.pullCapsules(m, 1, {}, 2, rolls([0.2]));   // 0.2 >= 16%: plain
  assert.equal(plain.capsules[0].gold, false);
  assert.equal(plain.pity, 3);
  const gold = X.pullCapsules(m, 1, {}, 3, rolls([0.19]));   // 0.19 < 20%: gold
  assert.equal(gold.capsules[0].gold, true);
  assert.equal(gold.capsules[0].id, 'eevee');
  assert.equal(gold.pity, 0);
});

test('a pull of ten always holds a gold one (when the area has a rare caught), saved for last', () => {
  const m = X.machineOf('meadow', SAFARI_DEX_PAGES[0].ids);
  const { capsules, pity } = X.pullCapsules(m, 10, {}, 0, () => 0.99);
  assert.equal(capsules.length, 10);
  assert.equal(capsules.filter(c => c.gold).length, 1);
  assert.equal(capsules.at(-1).gold, true);
  assert.ok(SAFARI_DEX_PAGES[0].rare.includes(capsules.at(-1).id));
  assert.equal(pity, 0);
  const none = X.pullCapsules({ plain: ['pidgey'], gold: [] }, 10, {}, 0, () => 0.99);
  assert.ok(none.capsules.every(c => !c.gold), 'no rare in it, no gold capsule');
  assert.equal(none.pity, 10);
});

test('a machine of rares only: every capsule is gold', () => {
  const { capsules } = X.pullCapsules({ plain: [], gold: ['eevee'] }, 3, {}, 0, () => 0.99);
  assert.ok(capsules.every(c => c.gold && c.id === 'eevee'));
  assert.deepEqual(X.pullCapsules({ plain: [], gold: [] }, 1, {}, 4).capsules, []);
});

test('at least one plain capsule in three is a shiny you don\'t own yet; otherwise any of the machine', () => {
  const m = { plain: ['pidgey', 'ponyta'], gold: [] };
  const fresh = X.pullCapsules(m, 1, { pidgey: 2 }, 0, rolls([0.2, 0]));   // no rare, so no gold roll: new (0.2 < 1/3), the first
  assert.equal(fresh.capsules[0].id, 'ponyta');
  const any = X.pullCapsules(m, 1, { pidgey: 2 }, 0, rolls([0.5, 0]));   // any: the first of the machine
  assert.equal(any.capsules[0].id, 'pidgey');
  let n = 0, seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < 3000; k++) if (X.pullCapsules(m, 1, { pidgey: 1 }, 0, rng).capsules[0].id === 'ponyta') n++;
  assert.ok(Math.abs(n / 3000 - 2 / 3) < 0.03, `${n} new of 3000 (1/3, then half the rest)`);
  // one held sealed counts as yours: not new
  assert.equal(X.pullCapsules(m, 1, { pidgey: 2 }, 0, rolls([0.9]), { ponyta: 1 }).capsules[0].id, 'ponyta', 'no fresh one left: any, no odds rolled');
  // a machine where you own one shiny no longer gives it again and again
  const page = SAFARI_DEX_PAGES[0], owned = { [page.wild[0]]: 1 };
  let same = 0;
  for (let k = 0; k < 600; k++) if (X.pullCapsules(X.machineOf('meadow', page.ids), 1, { ...owned }, 0, rng).capsules[0].id === page.wild[0]) same++;
  assert.ok(same < 30, `${same} of 600 the one owned`);
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
  assert.deepEqual(getSave().exchange, { stars: 0, pity: 0, sealed: {} }, 'an old save starts the Exchange afresh');
  const got = exchangePull('meadow', 10, () => 0.99);
  assert.equal(got.length, 10);
  assert.equal(getSave().coins, 2000 - X.TEN_COST);
  assert.ok(got.at(-1).gold);
  assert.equal(getSave().exchange.pity, 0);
  assert.equal(getSave().exchange.stars, got.reduce((s, c) => s + c.stars, 0));
  const caught = getSave().safariDex.caught;
  for (const c of got) assert.equal(!!c.sealed, !caught.includes(c.id), `${c.id}: sealed only when not caught`);
  assert.equal(X.sealedCount(getSave().exchange.sealed), got.filter(c => c.sealed).length);
  assert.equal(exchangePull('meadow', 10), null, '500 coins left');
  const saved = JSON.parse(mem.get('pokedb.save.v2'));
  assert.equal(saved.coins, 500);
  assert.deepEqual(saved.exchange, getSave().exchange);
});

test('a catch opens its sealed capsules, saved; one caught with them still shut is stale', () => {
  const id = Object.keys(getSave().exchange.sealed)[0], n = getSave().exchange.sealed[id];
  assert.ok(n > 0);
  assert.deepEqual(staleSealed(), []);
  markSafari('caught', id);
  assert.deepEqual(staleSealed(), [id], 'caught, its capsule not opened yet');
  const gains = openSealedCapsules(id);
  assert.equal(gains.length, n);
  assert.equal(getSave().safariShinies[id], Math.min(5, n), 'Sparkle stops at ★5');
  assert.equal(getSave().exchange.sealed[id], undefined);
  assert.deepEqual(staleSealed(), []);
  assert.deepEqual(JSON.parse(mem.get('pokedb.save.v2')).exchange.sealed[id], undefined);
  assert.deepEqual(openSealedCapsules(id), []);
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
