// The Safari Pokédex's completion rewards (js/data/safari.js) and their prize, Rayquaza.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { SAFARI_DEX_PAGES, SAFARI_ROSTER, safariNews, safariPageDone, rareOdds, safariStarters, RARE_BOOST } from '../js/data/safari.js';
import { RARE } from '../js/data/balls.js';
import { STARTERS, STARTERS_BY_ID } from '../js/data/starters.js';
import { ACHIEVEMENTS, ACHIEVEMENT_FOR } from '../js/data/achievements.js';
import { SPRITE_FIT } from '../js/data/sprite-fit.js';

const [first, second] = SAFARI_DEX_PAGES;
const dexOf = (caught, extra = {}) => ({ seen: [], caught, done: [], complete: false, ...extra });
// what creditSafari() in js/run.js does with the news
const credit = (dex) => {
  const news = safariNews(dex);
  return { news, dex: { ...dex, done: [...dex.done, ...news.areas], complete: dex.complete || news.complete } };
};

test('a page is done only once every Pokémon on it is caught', () => {
  assert.equal(safariPageDone(first, dexOf(first.ids.slice(1))), false);
  assert.equal(safariPageDone(first, dexOf(first.ids)), true);
  assert.deepEqual(safariNews(dexOf(first.ids.slice(1))), { areas: [], complete: false });
});

test('a finished page is news once, and stays earned when the roster grows', () => {
  const { news, dex } = credit(dexOf(first.ids));
  assert.deepEqual(news, { areas: [first.area], complete: false });
  assert.deepEqual(safariNews(dex), { areas: [], complete: false });   // paid once
  const fewer = { ...dex, caught: first.ids.slice(1) };                 // as if a later batch added one it hasn't caught
  assert.deepEqual(safariNews(fewer), { areas: [], complete: false });
  assert.ok(fewer.done.includes(first.area));
});

test('two pages finished by one catch are both news', () => {
  assert.deepEqual(safariNews(dexOf([...first.ids, ...second.ids])).areas, [first.area, second.area]);
});

test('the whole Safari Pokédex: every page, then complete once, and Rayquaza', () => {
  const { news, dex } = credit(dexOf([...SAFARI_ROSTER]));
  assert.equal(news.areas.length, SAFARI_DEX_PAGES.length);
  assert.equal(news.complete, true);
  assert.deepEqual(safariNews(dex), { areas: [], complete: false });
  assert.equal(safariNews(dexOf(SAFARI_ROSTER.slice(1))).complete, false);
  const test = ACHIEVEMENT_FOR.rayquaza.test;
  assert.equal(test({}, { safariDex: dex }), true);
  assert.equal(test({}, { safariDex: dexOf(SAFARI_ROSTER.slice(1)) }), false);
  assert.equal(test({}, { safariDex: { seen: [], caught: [] } }), false);   // an old save's
});

test('rare spawns double in a finished area, on replays only', () => {
  const dex = dexOf([], { done: [first.area] });
  assert.equal(rareOdds(first.area, dex, false), RARE.odds * RARE_BOOST);
  assert.equal(rareOdds(first.area, dex, true), RARE.odds);    // the day's first try
  assert.equal(rareOdds(second.area, dex, false), RARE.odds);
  assert.equal(rareOdds(first.area, { seen: [], caught: [] }, false), RARE.odds);
});

test('Rayquaza: a Grass legendary with every asset, its achievement before the Sealed Gate, never a daily starter', () => {
  const ray = STARTERS_BY_ID.rayquaza;
  assert.ok(ray.legendary && ray.type === 'grass');
  assert.equal(ray.deck, STARTERS_BY_ID.bulbasaur.deck);
  assert.ok(!safariStarters().includes(ray));
  assert.equal(safariStarters().length, STARTERS.filter(s => !s.secret).length - 1);
  assert.equal(ACHIEVEMENTS.at(-1).starter, 'mewtwo');
  assert.ok(ACHIEVEMENT_FOR.rayquaza);
  for (const kind of ['front', 'back']) {
    for (const name of ['rayquaza', 'rayquaza-shiny', 'rayquaza-awakened', 'rayquaza-ascendant', 'rayquaza-shiny-awakened', 'rayquaza-shiny-ascendant']) {
      assert.ok(existsSync(new URL(`../assets/pokemon/${name}-${kind}.gif`, import.meta.url)), `${name}-${kind}`);
      assert.ok(SPRITE_FIT[`${name}-${kind}`], `fit ${name}-${kind}`);
    }
  }
  assert.ok(existsSync(new URL('../assets/audio/cries/rayquaza.mp3', import.meta.url)));
});
