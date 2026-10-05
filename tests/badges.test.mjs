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
  assert.deepEqual(ids(save), ['bronze', 'champion', 'clearing', 'dojo', 'ember', 'fire', 'grass', 'pokedex', 'safari', 'shrine', 'silver', 'streak']);
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
  assert.deepEqual(ids(save), ['depths', 'dojo', 'seal']);
  const deep = fresh();
  deep.stats.bossesDefeated = { 4: true };
  assert.deepEqual(ids(deep), ['depths']);
});

test('a granted badge is never new again, and the new-content badges can\'t be earned', () => {
  const save = fresh();
  save.stats.runsWon = 1;
  save.badges = ['champion'];
  assert.deepEqual(ids(save), []);
  for (const b of BADGES.filter(x => x.group === 'new' && !x.id.startsWith('tower-'))) assert.ok(b.locked, b.id);
  assert.match(badgeLine(BADGES_BY_ID.champion), /Badge earned: Champion Badge!/);
});
