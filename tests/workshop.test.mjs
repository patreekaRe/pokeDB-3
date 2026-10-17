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
  for (const s of SKINS.filter(s => !s.secret)) assert.ok(shows(s, sees()));
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

test('each friend gives a second piece at three hearts and a third at five, owned for good once there', async () => {
  const { heartPieces, heartGifts, heartsOf, HEART_AT, FRIENDS, HEARTS } = await import('../js/data/workshop.js');
  assert.deepEqual(HEART_AT, [3, 5]);
  const kinds = FRIENDS.flatMap(id => heartPieces(id).map(p => p.kind));
  assert.equal(kinds.length, FRIENDS.length * 2, 'two a friend');
  assert.equal(new Set([...kinds, ...GIFTS.map(g => g.sig)]).size, kinds.length + GIFTS.length, 'none shared, none their first piece');
  for (const id of FRIENDS) {
    const [two, three] = heartPieces(id), save = (liked) => ({ workshop: { liked: { [id]: liked } } });
    for (const p of [two, three]) {
      const f = FURNITURE.find(o => o.kind === p.kind);
      assert.deepEqual(f?.from, ['heart', `${id}:${p.at}`], p.kind);
      assert.ok(f.towns, `${p.kind} waits for the towns`);
      assert.match(howToEarn(f, save(1)), new RegExp(`${p.at} hearts.*\\(1/${p.at}\\)`));
    }
    assert.ok(!isEarned(FURNITURE.find(o => o.kind === two.kind), save(2)));
    assert.ok(isEarned(FURNITURE.find(o => o.kind === two.kind), save(3)), 'an old save at 3 has it on load');
    assert.ok(!isEarned(FURNITURE.find(o => o.kind === three.kind), save(4)));
    assert.ok(isEarned(FURNITURE.find(o => o.kind === three.kind), save(9)), 'liked past 5 still counts');
    assert.ok(heartsOf(save(9).workshop, id) === HEARTS);
  }
  // the gift toast: only the piece whose heart a gift just crossed
  assert.deepEqual(heartGifts('john', 1, 3), [heartPieces('john')[0].kind]);
  assert.deepEqual(heartGifts('john', 3, 5), [heartPieces('john')[1].kind]);
  assert.deepEqual(heartGifts('john', 3, 4), []);
  assert.deepEqual(heartGifts('john', 5, 5), []);
});

test('every heart piece is in the base\'s catalogue, one colour, with a 3D model of its own', async () => {
  globalThis.location ??= { search: '', pathname: '/', hostname: 'localhost' };
  const { heartPieces, FRIENDS } = await import('../js/data/workshop.js');
  const { PIECES } = await import('../js/base-furniture.js');
  const { shapeOf } = await import('../js/base-shapes.js');
  const { MAKES } = await import('../js/base-models-friends.js');
  for (const { kind } of FRIENDS.flatMap(heartPieces)) {
    assert.ok(PIECES[kind], `${kind} is in the catalogue`);
    assert.equal(Object.keys(PIECES).filter(id => PIECES[id].fam === kind).length, 1, `${kind} comes in their colours only`);
    const shape = shapeOf(kind, PIECES[kind]);
    assert.ok(shape && typeof MAKES[shape.make] === 'function', `${kind} is modelled, not carved from its painting`);
  }
});

test('each friend teaches Kurt one secret Safari Ball look at four hearts, with its sprite, from their own town', async () => {
  const { SECRETS, SECRET_AT, FRIENDS, HEART_AT } = await import('../js/data/workshop.js');
  const { GYM_BY_ID } = await import('../js/data/gym.js');
  assert.deepEqual(Object.keys(SECRETS).sort(), [...FRIENDS].sort(), 'one a friend');
  assert.ok(SECRET_AT > HEART_AT[0] && SECRET_AT < HEART_AT[1], 'between their second and third pieces');
  const sprites = new Set(SKINS.map(s => s.sprite));
  assert.equal(sprites.size, SKINS.length, 'no two looks alike');
  assert.ok(!sprites.has('safari-ball'));
  for (const [id, r] of Object.entries(SECRETS)) {
    assert.ok(existsSync(new URL(`../assets/items/${r.sprite}.png`, import.meta.url)), r.sprite);
    for (const m of Object.keys(r.needs)) assert.equal(MATERIALS_BY_ID[m].biome, GYM_BY_ID[id].biome, `${r.id}: ${m}`);
    const at = (n) => ({ ...sees({}, [id]), hearts: (who) => (who === id ? n : 0) });
    assert.ok(!shows(r, at(SECRET_AT - 1)));
    assert.ok(shows(r, at(SECRET_AT)), 'taught at four');
    assert.ok(!shows(r, { ...at(0), hearts: () => SECRET_AT - 1 }));
    assert.ok(!isMade(r, workshopOf({}), satchelOf({})));
    const ws = madeInto(r, workshopOf({}));
    assert.ok(isMade(r, ws, satchelOf({})), 'made only once');
    assert.equal(safariSprite({ ...ws, skin: r.makes }), r.sprite);
  }
});

test('a friend writes now and then: only friends at two hearts, coins or their own town\'s material', async () => {
  const { friendLetter, FRIEND_MAIL, FRIENDS, MAIL_HEARTS, MAIL_COINS, MAIL_ODDS } = await import('../js/data/workshop.js');
  const { GYM_BY_ID } = await import('../js/data/gym.js');
  const { biomeMats } = await import('../js/data/satchel.js');
  const biomeOf = (id) => GYM_BY_ID[id].biome, mats = (b) => biomeMats(b, true);
  for (const id of FRIENDS) assert.ok(FRIEND_MAIL[id]?.length >= 2, `${id} has letters`);
  const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };
  assert.equal(friendLetter(() => MAIL_HEARTS - 1, seq(0)), null, 'nobody close enough');
  assert.equal(friendLetter((id) => (id === 'pat' ? 5 : 0), seq(MAIL_ODDS + 0.01), biomeOf, mats), null, 'not every day');
  const coins = friendLetter((id) => (id === 'pat' ? 3 : 0), seq(0, 0.5, 0, 0), biomeOf, mats);
  assert.equal(coins.from, 'pat');
  assert.equal(coins.coins, 3 * MAIL_COINS);
  assert.ok(FRIEND_MAIL.pat.some(([t]) => t === coins.title));
  const mat = friendLetter((id) => (id === 'pat' ? 5 : 0), seq(0, 0.5, 0, 0.9, 0), biomeOf, mats);
  assert.equal(MATERIALS_BY_ID[mat.mat.id].biome, 'ruins');
  assert.notEqual(mat.mat.id, 'bottle', 'never a quest\'s map find');
  assert.equal(mat.mat.n, 2);
  // the closer friend is likelier: hearts weight the pick
  const at = (id) => ({ john: 2, jahmes: 4 }[id] || 0);
  assert.equal(friendLetter(at, seq(0, 0.3, 0, 0), biomeOf, mats).from, 'john');
  assert.equal(friendLetter(at, seq(0, 0.4, 0, 0), biomeOf, mats).from, 'jahmes');
  // the most coins a day is well under the Game Corner's ~380
  assert.ok(MAIL_COINS * 5 < 100);
});

test('held berries and run kit: made again and again, each a berry or two and a town\'s find, kept to pack one for a run', async () => {
  const { REPEAT, repeats, packable, packOne, TABS } = await import('../js/data/workshop.js');
  const { HELD, HELD_BY_ID } = await import('../js/data/held.js');
  const { ITEMS_BY_ID } = await import('../js/data/items.js');
  for (const kind of REPEAT) assert.ok(TABS.some(t => t.id === kind), kind);
  const held = RECIPES.filter(r => r.kind === 'held'), kit = RECIPES.filter(r => r.kind === 'kit');
  assert.deepEqual(held.map(r => r.makes).sort(), HELD.map(h => h.id).sort(), 'one held berry recipe a berry kind');
  assert.ok(kit.length >= 5);
  const towns = new Set();
  for (const r of [...held, ...kit]) {
    assert.ok(r.kind === 'held' ? HELD_BY_ID[r.makes] : ITEMS_BY_ID[r.makes], r.id);
    assert.equal(r.name, (r.kind === 'held' ? HELD_BY_ID[r.makes] : ITEMS_BY_ID[r.makes]).name);
    const mats = Object.keys(r.needs).map(id => MATERIALS_BY_ID[id]);
    assert.ok(mats.every(Boolean), r.id);
    assert.ok(mats.some(m => m.grown) && mats.some(m => !m.grown), `${r.id}: berries and a town's find`);
    for (const m of mats.filter(m => !m.grown)) towns.add(m.biome);
    const berries = mats.filter(m => m.grown).reduce((n, m) => n + r.needs[m.id], 0);
    assert.ok(berries >= 2 && berries <= 4, `${r.id}: ${berries} berries`);
    assert.ok(existsSync(new URL(`../assets/items/${r.sprite}.png`, import.meta.url)), r.sprite);
  }
  assert.ok(towns.size >= 4, 'they pull you round the towns');
  for (const r of held) assert.equal(r.berry, r.makes);

  const oran = RECIPES.find(r => r.id === 'held-oran'), potion = RECIPES.find(r => r.id === 'kit-potion');
  assert.ok(repeats(oran) && repeats(potion));
  assert.ok(!shows(oran, sees()), 'no backyard, no Oran Berry ever held');
  assert.ok(shows(oran, { ...sees(), yard: true }));
  assert.ok(shows(oran, { ...sees(), mats: ['oran'] }));
  assert.ok(!shows(RECIPES.find(r => r.id === 'held-lum'), { ...sees(), mats: ['oran'] }));
  assert.ok(shows(potion, sees()), 'the run kit always');

  let sat = satchelOf({}, false);
  for (const [id, n] of Object.entries(potion.needs)) sat = addMat(sat, id, n * 2);
  let ws = workshopOf({});
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(shortOf(potion, sat), []);
    assert.ok(!isMade(potion, ws, sat), 'never made for good');
    sat = spend(potion, sat);
    ws = madeInto(potion, ws);
  }
  assert.equal(ws.kit[potion.id], 2);
  assert.ok(shortOf(potion, sat).length, 'the materials are spent');
  ws = madeInto(oran, ws);
  assert.deepEqual(packable(ws).map(o => [o.recipe.id, o.n]), [['held-oran', 1], ['kit-potion', 2]]);
  const a = packOne(ws, 'kit-potion');
  assert.equal(a.item, 'potion');
  assert.equal(a.ws.kit['kit-potion'], 1);
  const b = packOne(a.ws, 'held-oran');
  assert.equal(b.held, 'oran');
  assert.equal(b.ws.kit['held-oran'], 0);
  assert.equal(packOne(b.ws, 'held-oran'), null, 'none kept, none packed');
  assert.equal(packOne(ws, 'piece-daruma'), null);
  assert.deepEqual(packable(b.ws).map(o => o.recipe.id), ['kit-potion']);
  assert.deepEqual(workshopOf({}).kit, {}, 'an old save keeps none');
});

test('Kurt explains gifts once, and every friend says a hello once that hints at their favourite without naming it', async () => {
  const { FRIENDS, GIFT_TOLD, meetKey, withTold, giftMeetDue, giveGift: give } = await import('../js/data/workshop.js');
  const { GIFT_MEET } = await import('../js/data/towns.js');
  const talk = CLEARING.homes.workshop.giftTalk;
  assert.ok(talk.length >= 3 && talk.length <= 4);
  assert.ok(/heart/i.test(talk.join(' ')) && /Friends app/.test(talk.join(' ')) && /Secret Base/.test(talk.join(' ')));
  const told = withTold(workshopOf({}), GIFT_TOLD);
  assert.equal(told.told[GIFT_TOLD], true);
  assert.deepEqual(Object.keys(GIFT_MEET).sort(), [...FRIENDS].sort());
  for (const id of FRIENDS) {
    const lines = GIFT_MEET[id], fav = FAVOURITE[id];
    assert.ok(lines.length >= 1 && lines.length <= 2, id);
    assert.ok(/Kurt/.test(lines.join(' ')), `${id} points to Kurt`);
    assert.ok(!lines.join(' ').toLowerCase().includes(fav.name.toLowerCase()), `${id} names ${fav.name}`);
    const fresh = workshopOf({});
    assert.ok(giftMeetDue(fresh, id), id);
    assert.ok(!giftMeetDue(withTold(fresh, meetKey(id)), id), `${id} says it once`);
    assert.ok(FRIENDS.filter(o => o !== id).every(o => giftMeetDue(withTold(fresh, meetKey(id)), o)), `${id}'s is theirs alone`);
    const held = { ...fresh, gifts: { [fav.makes]: 1 } };
    assert.ok(!giftMeetDue(give(held, fav.makes, id).ws, id), `${id} skips it once gifted`);
  }
});
