// Kurt's Workshop (js/data/workshop.js): what it makes, when a recipe shows, and a Gym Leader's gift.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { RECIPES, GIFTS, FAVOURITE, SKINS, workshopOf, shortOf, isMade, shows, spend, madeInto, giveGift, safariSprite } from '../js/data/workshop.js';
import { MATERIALS_BY_ID, KEY_BY_ID, satchelOf, addMat } from '../js/data/satchel.js';
import { TOWNS, QUESTS, CLEARING } from '../js/data/towns.js';
import { FURNITURE, isEarned, howToEarn } from '../js/data/furniture.js';

const sees = (towns = {}, beaten = []) => ({ towns, wins: (id) => (beaten.includes(id) ? 1 : 0) });

test('every recipe needs real materials, and its ids are unique', () => {
  assert.equal(new Set(RECIPES.map(r => r.id)).size, RECIPES.length);
  for (const r of RECIPES) {
    assert.ok(Object.keys(r.needs).length, r.id);
    for (const [id, n] of Object.entries(r.needs)) assert.ok(MATERIALS_BY_ID[id] && n > 0, `${r.id}: ${id}`);
  }
});

test('every questline Make step has one recipe, for a key item the Workshop makes', () => {
  const crafts = Object.values(QUESTS).flatMap(q => q.steps).filter(s => s.kind === 'craft');
  for (const step of crafts) {
    const made = RECIPES.filter(r => r.kind === 'key' && r.makes === step.key);
    assert.equal(made.length, 1, step.key);
    assert.ok(KEY_BY_ID[step.key], step.key);
  }
  assert.ok(RECIPES.find(r => r.makes === 'katana').needs['magma-ore'], 'Machew\'s katana is forged from Cinder Springs\' ore');
});

test('every Gym Leader of a town, and the Nietos at home, has a favourite gift, and its signature piece is earned by it', () => {
  const leaders = [...Object.values(TOWNS), CLEARING].flatMap(t => Object.keys(t.leaders));
  assert.deepEqual(Object.keys(FAVOURITE).sort(), [...leaders].sort());
  for (const g of GIFTS) {
    const p = FURNITURE.find(f => f.kind === g.sig);
    assert.deepEqual(p?.from, ['gift', g.leader], g.sig);
    assert.ok(!isEarned(p, {}));
    assert.ok(isEarned(p, { workshop: { fond: [g.leader] } }));
    assert.match(howToEarn(p, {}), new RegExp(g.name));
  }
});

test('a made piece is owned in the Secret Base', () => {
  for (const r of RECIPES.filter(o => o.kind === 'piece')) {
    const p = FURNITURE.find(f => f.kind === r.makes);
    assert.deepEqual(p?.from, ['craft', r.id], r.makes);
    assert.ok(isEarned(p, { workshop: { made: [r.id] } }));
  }
});

test('a recipe shows once it can matter', () => {
  const lantern = RECIPES.find(r => r.makes === 'festival-lanterns'), daruma = RECIPES.find(r => r.makes === 'daruma');
  const taiko = RECIPES.find(r => r.makes === 'taiko'), fan = RECIPES.find(r => r.makes === 'fan');
  assert.ok(!shows(lantern, sees()));
  assert.ok(shows(lantern, sees({ shrine: { quest: { step: 0, picks: {} } } })));
  assert.ok(!shows(daruma, sees()));
  assert.ok(shows(daruma, sees({ shrine: { met: true } })));
  assert.ok(!shows(taiko, sees({ shrine: { met: true, quest: { picks: { 'sh-spirits': 'moon' } } } })), 'only the festival John holds');
  assert.ok(shows(taiko, sees({ shrine: { met: true, quest: { picks: { 'sh-spirits': 'fireworks' } } } })));
  assert.ok(!shows(fan, sees()));
  assert.ok(shows(fan, sees({}, ['john'])));
  for (const s of SKINS) assert.ok(shows(s, sees()));
});

test('making takes the materials and keeps what was made', () => {
  const daruma = RECIPES.find(r => r.makes === 'daruma');
  let sat = satchelOf({}, false);
  assert.deepEqual(shortOf(daruma, sat).map(m => m.id).sort(), ['washi', 'wick']);
  sat = addMat(addMat(sat, 'washi', 4), 'wick', 1);
  assert.deepEqual(shortOf(daruma, sat), []);
  sat = spend(daruma, sat);
  assert.equal(sat.mats.washi, 1);
  assert.equal(sat.mats.wick, 0);
  const ws = madeInto(daruma, workshopOf({}));
  assert.ok(isMade(daruma, ws, sat));
  assert.equal(madeInto(daruma, ws), ws, 'made once');
  const fan = RECIPES.find(r => r.makes === 'fan');
  assert.equal(madeInto(fan, madeInto(fan, ws)).gifts.fan, 2, 'gifts are made again and again');
  assert.ok(!isMade(fan, ws, sat));
});

test('a gift: their favourite twice the liking, and the first one makes them fond of you', () => {
  let ws = { ...workshopOf({}), gifts: { fan: 2, curry: 1 } };
  const a = giveGift(ws, 'curry', 'john');
  assert.ok(!a.favourite);
  assert.equal(a.ws.liked.john, 1);
  const b = giveGift(a.ws, 'fan', 'john');
  assert.ok(b.favourite && b.first);
  assert.deepEqual(b.ws.fond, ['john']);
  assert.equal(b.ws.liked.john, 3);
  const c = giveGift(b.ws, 'fan', 'john');
  assert.ok(c.favourite && !c.first);
  assert.equal(c.ws.gifts.fan, 0);
  assert.equal(giveGift(c.ws, 'fan', 'john').ws, c.ws, 'none left to give');
});

test('an Apricorn skin only changes the Safari Ball\'s sprite, and every sprite is there', () => {
  assert.equal(safariSprite(workshopOf({})), 'safari-ball');
  assert.equal(safariSprite({ skin: 'love' }), 'love-ball');
  for (const s of SKINS) assert.ok(existsSync(new URL(`../assets/items/${s.sprite}.png`, import.meta.url)), s.sprite);
  assert.ok(existsSync(new URL('../assets/trainers/kurt.png', import.meta.url)) && existsSync(new URL('../assets/trainers/kurt-blink.png', import.meta.url)));
});

test('a friend\'s hearts: a gift fills one, their favourite two, and they stop at five', async () => {
  const { heartsOf, HEARTS, FRIENDS } = await import('../js/data/workshop.js');
  assert.equal(FRIENDS[0], 'nietos');
  assert.equal(new Set(FRIENDS).size, GIFTS.length, 'everyone with a favourite gift, once');
  const fav = FAVOURITE.john.makes, other = GIFTS.find(g => g.leader !== 'john').makes;
  let ws = { ...workshopOf({}), gifts: { [fav]: 9, [other]: 9 } };
  assert.equal(heartsOf(ws, 'john'), 0);
  ws = giveGift(ws, other, 'john').ws;
  assert.equal(heartsOf(ws, 'john'), 1);
  ws = giveGift(ws, fav, 'john').ws;
  assert.equal(heartsOf(ws, 'john'), 3);
  for (let i = 0; i < 4; i++) ws = giveGift(ws, fav, 'john').ws;
  assert.equal(heartsOf(ws, 'john'), HEARTS);
  assert.equal(heartsOf(ws, 'jahmes'), 0);
});

test('friends drop by the Secret Base from three hearts, and best friends at five sit and say their lines', async () => {
  const { baseFriends, FRIENDS, HEARTS, VISIT_HEARTS } = await import('../js/data/workshop.js');
  const { BASE_LINES } = await import('../js/data/towns.js');
  const hearts = { john: VISIT_HEARTS - 1, pat: VISIT_HEARTS, kayl: HEARTS };
  const { all, best } = baseFriends((id) => hearts[id] || 0);
  assert.deepEqual(all, ['pat', 'kayl']);
  assert.deepEqual(best, ['kayl']);
  assert.deepEqual(baseFriends(() => 0), { all: [], best: [] });
  for (const id of FRIENDS) for (const kind of ['drop', 'sit']) {
    const speeches = BASE_LINES[id]?.[kind];
    assert.ok(speeches?.length, `${id}: a ${kind} speech`);
    for (const s of speeches) for (const l of s) assert.ok(typeof l === 'string' && l.length && l.length <= 160, `${id} ${kind}: "${l}"`);
  }
});
