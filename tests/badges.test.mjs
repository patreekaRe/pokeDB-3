// The Badge Case's rules (js/data/badges.js): what a save can prove, and nothing more.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BADGES, BADGES_BY_ID, BADGE_GROUPS, newBadges, badgeLine } from '../js/data/badges.js';

const fresh = () => ({
  unlocked: [], badges: [], feats: [], kenWins: 0, kenBeaten: false, gateHp: 1000, hallOfFame: [],
  dex: { seen: [], defeated: [], done: [], count: {}, complete: false },
  safariDex: { seen: [], caught: [], done: [], complete: false },
  stats: {
    runsWon: 0, bossesDefeated: {}, winsBy: {}, maxLevelWinByType: { fire: -1, grass: -1, water: -1 },
    bestStreak: 0, winStreak: 0, level5WinsBy: {}, level5Jackpot: {},
  },
});
const ids = (save) => newBadges(save).map(b => b.id).sort();

test('every badge has a known group, a name, a hint and a test', () => {
  const groups = new Set(BADGE_GROUPS.map(g => g.id));
  assert.equal(Object.keys(BADGES_BY_ID).length, BADGES.length, 'ids are unique');
  for (const b of BADGES) {
    assert.ok(groups.has(b.group), b.id);
    assert.ok(b.name && b.text && b.icon && b.emoji, b.id);
    assert.equal(typeof b.test, 'function', b.id);
  }
});

test('a fresh save earns nothing', () => {
  assert.deepEqual(ids(fresh()), []);
});

test('an old save without a badges list earns what it can prove', () => {
  const save = fresh();
  delete save.badges;
  Object.assign(save.stats, { runsWon: 4, bossesDefeated: { 1: true, 2: true, 3: true }, winsBy: { charmander: 2, chikorita: 1 },
    maxLevelWinByType: { fire: 3, grass: 0, water: -1 }, bestStreak: 3 });
  Object.assign(save, { kenWins: 1, dex: { ...save.dex, complete: true }, safariDex: { ...save.safariDex, done: ['meadow'] } });
  assert.deepEqual(ids(save), ['bronze', 'champion', 'clearing', 'dojo', 'ember', 'fire', 'grass', 'pokedex', 'rookie', 'safari', 'shrine', 'silver', 'streak']);
});

test('a type badge counts skins and the Record Book\'s per-type Levels', () => {
  const save = fresh();
  save.stats.winsBy = { totodile: 1, mewtwo: 3 };   // Mewtwo is Psychic: no type badge
  assert.deepEqual(ids(save), ['water']);
  const other = fresh();
  other.stats.maxLevelWinByType.grass = 0;
  assert.deepEqual(ids(other), ['grass']);
});

test('the Level legendaries prove Bronze and Silver', () => {
  const save = fresh();
  save.unlocked = ['suicune'];
  assert.deepEqual(ids(save), ['bronze']);
  save.unlocked.push('celebi');
  assert.deepEqual(ids(save), ['bronze', 'silver']);
});

test('Gold from any Level 5 proof; Master needs all three types', () => {
  const fame = fresh();
  fame.hallOfFame = [{ level: 5, starter: 'charmander', type: 'fire' }];
  assert.ok(ids(fame).includes('gold'));
  assert.ok(!ids(fame).includes('master'));

  const mewtwo = fresh();
  mewtwo.hallOfFame = [{ level: 0, starter: 'mewtwo', type: 'psychic' }];
  assert.ok(!ids(mewtwo).includes('gold'), 'Mewtwo\'s wins have no Trainer Level');

  const mixed = fresh();
  mixed.stats.maxLevelWinByType.fire = 5;
  mixed.stats.level5WinsBy = { oshawott: 1 };
  mixed.stats.level5Jackpot = { grass: true };
  assert.ok(ids(mixed).includes('master'));
});

test('the gate, Eternatus and the dojo', () => {
  const save = fresh();
  Object.assign(save, { gateHp: 0, kenBeaten: true, feats: ['eternatus'] });
  assert.deepEqual(ids(save), ['black-belt', 'depths', 'dojo', 'seal']);   // Kenmatta's dojo on every map took 3 wins
  const deep = fresh();
  deep.stats.bossesDefeated = { 4: true };
  assert.deepEqual(ids(deep), ['depths']);
});

test('a granted badge is never new again, and no badge is still waiting on content', () => {
  const save = fresh();
  save.stats.runsWon = 1;
  save.badges = ['champion'];
  assert.deepEqual(ids(save), []);
  for (const b of BADGES) assert.ok(!b.locked, b.id);
  assert.match(badgeLine(BADGES_BY_ID.champion), /Badge earned: Champion Badge!/);
});

test('the Explorer Badge needs all five main biomes entered, both roads at each crossroads', () => {
  const save = fresh();
  save.stats.biomesSeen = ['clearing', 'shrine', 'ruins', 'wastes', 'depths'];
  assert.ok(!ids(save).includes('explorer'));
  save.stats.biomesSeen.push('thornwood');
  assert.ok(ids(save).includes('explorer'));
});

test('sixty badges, ten in each group', () => {
  assert.equal(BADGES.length, 60);
  for (const g of BADGE_GROUPS) assert.equal(BADGES.filter(b => b.group === g.id).length, 10, g.id);
});

// a Record Book win, as recordWin() saves it
const win = (extra) => ({ starter: 'charmander', type: 'fire', level: 0, route: null, deck: Array(20).fill('ember'), hp: 30, maxHp: 70,
  turns: 90, elites: 2, forgotten: 1, spent: 400, biggest: 30, itemsUsed: ['potion'], ...extra });

test('the challenges read one win\'s record, never Mewtwo\'s', () => {
  const save = fresh();
  save.hallOfFame = [win({ hp: 70, deck: Array(12).fill('ember'), forgotten: 0, spent: 99, turns: 59, elites: 5, itemsUsed: [] })];
  assert.deepEqual(ids(save), ['alpha-slayer', 'bare-bag', 'minimalist', 'penny', 'purist', 'speedrun', 'untouchable']);
  const mewtwo = fresh();
  mewtwo.hallOfFame = [win({ starter: 'mewtwo', hp: 70, forgotten: 0, spent: 0, turns: 30, itemsUsed: [] })];
  assert.deepEqual(ids(mewtwo), []);
  const old = fresh();
  old.hallOfFame = [{ starter: 'bulbasaur', level: 5, deck: Array(15).fill('vine-whip'), hp: 40 }];   // from before the tally
  assert.ok(!ids(old).some(id => ['untouchable', 'purist', 'penny', 'speedrun', 'bare-bag'].includes(id)));
});

test('a 100-damage hit counts from a lost run too', () => {
  const save = fresh();
  save.losses = [win({ biggest: 100, hp: 0 })];
  assert.deepEqual(ids(save), ['heavy-hitter']);
});

test('the Ruins\' and Thornwood\'s bosses from the Pokédex; the Wanderer walks every pair of roads', () => {
  const save = fresh();
  save.dex.defeated = ['maushold', 'typenull'];
  assert.deepEqual(ids(save), ['thorn', 'tide']);
  const roads = fresh();
  roads.hallOfFame = [win({}), win({ route: [null, 'ruins', 'wastes'] }), win({ route: [null, 'shrine', 'thornwood'] })];
  assert.ok(!ids(roads).includes('wanderer'));
  roads.hallOfFame.push(win({ route: [null, 'ruins', 'thornwood'] }));
  assert.ok(ids(roads).includes('wanderer'));
});

test('the Level badges: Rookie, Platinum, a crown per type and the Veteran\'s five starters', () => {
  const save = fresh();
  save.stats.maxLevelWinByType.water = 4;
  assert.deepEqual(ids(save), ['bronze', 'platinum', 'rookie', 'silver', 'water']);
  const five = fresh();
  five.stats.level5WinsBy = { charmander: 1, cyndaquil: 1, tepig: 1, torchic: 1 };
  assert.ok(ids(five).includes('crown-fire') && !ids(five).includes('crown-water'));
  assert.ok(!ids(five).includes('veteran'));
  five.hallOfFame = [win({ starter: 'chimchar', level: 5 })];
  assert.ok(ids(five).includes('veteran'));
});

test('the collector badges', () => {
  const save = fresh();
  Object.assign(save, {
    dex: { ...save.dex, done: ['ruins', 'thornwood', 'depths'] },
    shiny: { owned: ['charmander'], on: [] },
    balls: { great: 1, ultra: 1, dusk: 1, quick: 1, timer: 1, net: 1, luxury: 0, owned: ['master'] },
  });
  save.stats.coinsEarned = 10000;
  assert.deepEqual(ids(save), ['jackpot', 'page-depths', 'page-ruins', 'page-thornwood', 'sparkle']);
  save.balls.luxury = 3;
  assert.ok(ids(save).includes('balls'));
  save.passives = { hpBoost: 3, relicCharm: true, wellFed: true, coinFinder: true, bagPocket: true, martCard: 3, tutorNotes: true, scoutReport: true, scopeUpgrade: 1 };
  assert.ok(!ids(save).includes('high-roller'));
  save.passives.scopeUpgrade = 2;
  assert.ok(ids(save).includes('high-roller'));
});

test('the Sky Pillar\'s weeks and the Safari\'s days; an old save played the one it holds', () => {
  const save = fresh();
  save.tower = { week: '2026-10-05', bestEver: 75, summits: 3 };
  save.safari = { day: '2026-10-07', tries: 1 };
  assert.deepEqual(ids(save), ['sky-king', 'tower-10', 'tower-25', 'tower-50', 'tower-75']);
  save.tower.weeks = 4;
  save.safari.days = 7;
  save.safariDex.caught = ['chansey'];
  assert.deepEqual(ids(save).filter(id => ['weekly', 'safari-regular', 'rare-catch'].includes(id)), ['rare-catch', 'safari-regular', 'weekly']);
});
