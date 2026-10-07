/* ============================================================
   badges.js  -  the Trainer Card's Badge Case (roadmap item 17).

   Badges unlock nothing: they're a record of what you've done, in
   BADGE_GROUPS. Each `test(stats, save)` looks only at what the save already
   keeps, so an old save earns on day one everything it can prove
   (checkBadges() in js/progress.js also runs at load). Earned ids are kept
   in the save's `badges`, so a badge stays earned even if a test ever
   changes. `locked` ones wait for content that doesn't exist yet and can't
   be earned. `icon` names the badge's pixel art (part b); `emoji` stands in
   for it in the text lines.
   ============================================================ */

import { STARTERS } from './starters.js';
import { MAX_LEVEL } from './difficulty.js';
import { BIOMES, ALT_BIOMES, BIOMES_BY_ID, FORKS, ENEMY_DEFS } from './enemies.js';
import { PASSIVE_SHOP_ITEMS } from './shop.js';
import { BALLS, masterThrows } from './balls.js';
import { SAFARI_AREAS, SAFARI_DEX_PAGES } from './safari.js';
import { DEX_PAGES, DEPTHS_PAGE, BONUS_PAGES } from './pokedex.js';
import { FLIGHT } from './tower.js';

/** Every main biome, the default road's and the pool's (the Explorer Badge's; the Depths are Mewtwo's own). */
const MAIN_BIOMES = [...BIOMES, ...ALT_BIOMES].filter(b => !b.secret).map(b => b.id);

const KANTO_TYPES = ['fire', 'water', 'grass'];
const LEVEL2_LEGENDS = ['moltres', 'virizion', 'suicune'];
const LEVEL3_LEGENDS = ['entei', 'celebi', 'kyogre'];
const typeOf = Object.fromEntries(STARTERS.map(s => [s.id, s.type]));

/** Has a run been won with a starter of this type? */
const wonWithType = (s, type) => (s.maxLevelWinByType?.[type] ?? -1) >= 0
  || Object.entries(s.winsBy || {}).some(([id, n]) => n > 0 && typeOf[id] === type);

/** The types won with on Trainer Level 5, from everything the save keeps about Level 5 wins. */
function level5Types(s, save) {
  const types = new Set(KANTO_TYPES.filter(t => (s.maxLevelWinByType?.[t] ?? -1) >= MAX_LEVEL));
  for (const [id, n] of Object.entries(s.level5WinsBy || {})) if (n > 0 && typeOf[id]) types.add(typeOf[id]);
  for (const t of Object.keys(s.level5Jackpot || {})) if (s.level5Jackpot[t]) types.add(t);
  for (const w of save.hallOfFame || []) if (w.level === MAX_LEVEL && w.starter !== 'mewtwo') types.add(w.type ?? typeOf[w.starter]);
  return types;
}

const levelWon = (s, level) => KANTO_TYPES.some(t => (s.maxLevelWinByType?.[t] ?? -1) >= level);
const owns = (save, ids) => ids.some(id => (save.unlocked || []).includes(id));
const pageDone = (save, biome) => (save.dex?.done || []).includes(biome);

/** The Record Book's wins with a Trainer Level (Mewtwo's runs have none, and its speedrun would make the challenges free). */
const levelWins = (save) => (save.hallOfFame || []).filter(w => w.starter !== 'mewtwo');
const aWin = (save, test) => levelWins(save).some(test);
const isNum = (v) => typeof v === 'number';

/** A biome's boss beaten, from the Pokédex (the stats count bosses by slot, which every road through it shares). */
const bossBeaten = (save, biome) => BIOMES_BY_ID[biome].bosses.some(id => (save.dex?.defeated || []).includes(id));

/** Every road a fork can offer (the Wanderer Badge's: each won through at least once, at either fork; since item 20 a pool
    biome can stand at both, so pairs of roads would be 13 runs). A win saved before the crossroads walked the default road. */
const ROADS = [...FORKS.map(i => BIOMES[i].id), ...ALT_BIOMES.map(b => b.id)];
const roadsOf = (w) => FORKS.map(i => w.route?.[i] ?? BIOMES[i].id);

/** The starters with a Level 5 win (the Veteran Badge's). */
function level5Starters(s, save) {
  const ids = new Set(Object.entries(s.level5WinsBy || {}).filter(([, n]) => n > 0).map(([id]) => id));
  for (const w of levelWins(save)) if (w.level === MAX_LEVEL) ids.add(w.starter);
  return ids;
}

const LEGENDS = STARTERS.filter(s => s.legendary && !s.secret).map(s => s.id);
const perkMaxed = (save, p) => { const v = save.passives?.[p.id]; return (typeof v === 'number' ? v : v ? 1 : 0) >= p.maxLevel; };
const SAFARI_RARES = new Set(SAFARI_AREAS.flatMap(a => a.rares));

/** Weeks with a Sky Pillar climb and days with a Safari run (counted at the start); a save from before the counts played
    the one it holds. */
export const towerWeeks = (save) => save.tower?.weeks ?? (save.tower?.week ? 1 : 0);
export const safariDays = (save) => save.safari?.days ?? (save.safari?.day ? 1 : 0);

/** Sky Pillar guardians beaten in all, any climb (`tower.guardians`, counted since these badges); an older save has at
    least beaten its best climb's, or 10 a summit. */
export const guardiansBeaten = (save) => Math.max(save.tower?.guardians || 0,
  Math.floor((save.tower?.bestEver || 0) / FLIGHT), (save.tower?.summits || 0) * 10);

/** A main Pokédex page with every Pokémon on it beaten (the main game has no catching: beating one is its "capture"). */
const pageBeaten = (save, page) => page.ids.every(id => (save.dex?.defeated || []).includes(id));
const its = (name) => `${name}'${name.endsWith('s') ? '' : 's'}`;
const PAGE_OF = Object.fromEntries([...DEX_PAGES, DEPTHS_PAGE, ...BONUS_PAGES].map(p => [p.biome, p]));

const caughtAll = (save, ids) => ids.length > 0 && ids.every(id => (save.safariDex?.caught || []).includes(id));
const raresCaught = (save) => new Set((save.safariDex?.caught || []).filter(id => SAFARI_RARES.has(id))).size;

/** Types as the game shows them (Normal is Neutral). */
const TYPE_NAME = { fire: 'Fire', water: 'Water', grass: 'Grass', normal: 'Neutral', psychic: 'Psychic' };
const TYPE_EMOJI = { fire: '🔥', water: '💧', grass: '🍃', normal: '⚪', psychic: '🔮' };
const TYPE_ORDER = ['fire', 'water', 'grass', 'normal', 'psychic'];
const AREA_EMOJI = { meadow: '🌼', forest: '🌲', wetland: '🦆', marsh: '🪷', peak: '🏔️', desert: '🏜️' };

/** One badge per type on each Safari Pokédex page: every Pokémon of that type there caught. */
const SAFARI_TYPE_BADGES = SAFARI_DEX_PAGES.flatMap(p => TYPE_ORDER
  .map(type => ({ type, ids: p.ids.filter(id => (ENEMY_DEFS[id]?.type ?? 'normal') === type) }))
  .filter(t => t.ids.length)
  .map(({ type, ids }) => ({ id: `sx-${p.area}-${type}`, group: 'safari-types', name: `${p.name} ${TYPE_NAME[type]} Badge`,
    icon: `sx-${p.area}-${type}`, emoji: TYPE_EMOJI[type], text: `Catch every ${TYPE_NAME[type]} Pokémon in the Safari's ${p.name}`,
    test: (s, save) => caughtAll(save, ids) })));

const GUARDIAN_FLOORS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const GUARDIAN_COUNTS = [1, 5, 10, 15, 20, 30, 40, 50];
const RARE_COUNTS = [5, 10, 15, 20];

export const BADGE_GROUPS = [
  { id: 'journey', name: 'Journey' },
  { id: 'levels', name: 'Trainer Levels' },
  { id: 'challenges', name: 'Challenges' },
  { id: 'collector', name: 'Collector' },
  { id: 'pokedex', name: 'Pokédex' },
  { id: 'secrets', name: 'Secrets' },
  { id: 'safari', name: 'Safari Zone' },
  { id: 'safari-types', name: 'Safari types' },
  { id: 'tower', name: 'Sky Pillar' },
];

export const BADGES = [
  // Journey
  { id: 'clearing', group: 'journey', name: 'Clearing Badge', icon: 'clearing', emoji: '🌳',
    text: 'Defeat the Whispering Clearing\'s boss', test: (s) => !!s.bossesDefeated?.[1] },
  { id: 'shrine', group: 'journey', name: 'Shrine Badge', icon: 'shrine', emoji: '⛩️',
    text: 'Defeat the Overgrown Shrine\'s boss', test: (s, save) => bossBeaten(save, 'shrine') },
  { id: 'tide', group: 'journey', name: 'Tide Badge', icon: 'tide', emoji: '🌊',
    text: 'Defeat the Sunken Ruins\' boss', test: (s, save) => bossBeaten(save, 'ruins') },
  { id: 'ember', group: 'journey', name: 'Ember Badge', icon: 'ember', emoji: '🌋',
    text: 'Defeat the Ember Wastes\' boss', test: (s, save) => bossBeaten(save, 'wastes') },
  { id: 'thorn', group: 'journey', name: 'Thorn Badge', icon: 'thorn', emoji: '🌿',
    text: 'Defeat the Thornwood Jungle\'s boss', test: (s, save) => bossBeaten(save, 'thornwood') },
  { id: 'champion', group: 'journey', name: 'Champion Badge', icon: 'champion', emoji: '🏆',
    text: 'Win a run', test: (s) => s.runsWon >= 1 },
  { id: 'fire', group: 'journey', name: 'Fire Badge', icon: 'fire', emoji: '🔥',
    text: 'Win a run with a Fire starter', test: (s) => wonWithType(s, 'fire') },
  { id: 'water', group: 'journey', name: 'Water Badge', icon: 'water', emoji: '💧',
    text: 'Win a run with a Water starter', test: (s) => wonWithType(s, 'water') },
  { id: 'grass', group: 'journey', name: 'Grass Badge', icon: 'grass', emoji: '🍃',
    text: 'Win a run with a Grass starter', test: (s) => wonWithType(s, 'grass') },
  { id: 'wanderer', group: 'journey', name: 'Wanderer Badge', icon: 'wanderer', emoji: '🗺️',
    text: 'Win a run down every road from the crossroads',
    test: (s, save) => { const won = new Set(levelWins(save).flatMap(roadsOf)); return ROADS.every(r => won.has(r)); } },
  { id: 'explorer', group: 'journey', name: 'Explorer Badge', icon: 'explorer', emoji: '🧭',
    text: 'Walk into every biome on every road', test: (s) => MAIN_BIOMES.every(id => (s.biomesSeen || []).includes(id)) },

  // Trainer Levels (Mewtwo's runs have no Level, so they never count; its Hall of Fame entries are skipped too)
  { id: 'rookie', group: 'levels', name: 'Rookie Badge', icon: 'rookie', emoji: '🎗️',
    text: 'Win a run on Trainer Level 1', test: (s, save) => levelWon(s, 1) || aWin(save, w => w.level >= 1) },
  { id: 'bronze', group: 'levels', name: 'Bronze Badge', icon: 'bronze', emoji: '🥉',
    text: 'Win a run on Trainer Level 2', test: (s, save) => levelWon(s, 2) || owns(save, LEVEL2_LEGENDS) },
  { id: 'silver', group: 'levels', name: 'Silver Badge', icon: 'silver', emoji: '🥈',
    text: 'Win a run on Trainer Level 3', test: (s, save) => levelWon(s, 3) || owns(save, LEVEL3_LEGENDS) },
  { id: 'platinum', group: 'levels', name: 'Platinum Badge', icon: 'platinum', emoji: '💠',
    text: 'Win a run on Trainer Level 4', test: (s, save) => levelWon(s, 4) || aWin(save, w => w.level >= 4) },
  { id: 'gold', group: 'levels', name: 'Gold Badge', icon: 'gold', emoji: '🥇',
    text: 'Win a run on Trainer Level 5', test: (s, save) => level5Types(s, save).size > 0 },
  { id: 'crown-fire', group: 'levels', name: 'Blaze Crown', icon: 'crown-fire', emoji: '🔥',
    text: 'Win a run on Trainer Level 5 with a Fire starter', test: (s, save) => level5Types(s, save).has('fire') },
  { id: 'crown-water', group: 'levels', name: 'Torrent Crown', icon: 'crown-water', emoji: '💧',
    text: 'Win a run on Trainer Level 5 with a Water starter', test: (s, save) => level5Types(s, save).has('water') },
  { id: 'crown-grass', group: 'levels', name: 'Overgrow Crown', icon: 'crown-grass', emoji: '🍃',
    text: 'Win a run on Trainer Level 5 with a Grass starter', test: (s, save) => level5Types(s, save).has('grass') },
  { id: 'master', group: 'levels', name: 'Master Badge', icon: 'master', emoji: '👑',
    text: 'Win a run on Trainer Level 5 with a Fire, a Water and a Grass starter',
    test: (s, save) => KANTO_TYPES.every(t => level5Types(s, save).has(t)) },
  { id: 'veteran', group: 'levels', name: 'Veteran Badge', icon: 'veteran', emoji: '🎖️',
    text: 'Win a run on Trainer Level 5 with 5 different starters', test: (s, save) => level5Starters(s, save).size >= 5 },

  // Challenges: one run's record in the Record Book (Mewtwo's skipped), so wins from before these badges count
  { id: 'iron-will', group: 'challenges', name: 'Iron Will Badge', icon: 'iron-will', emoji: '🛡️',
    text: 'Win a run without resting at a Pokémon Center', test: (s) => !!s.noRestWin },
  { id: 'untouchable', group: 'challenges', name: 'Untouchable Badge', icon: 'untouchable', emoji: '💖',
    text: 'Win a run with full HP', test: (s, save) => aWin(save, w => isNum(w.hp) && isNum(w.maxHp) && w.hp >= w.maxHp) },
  { id: 'minimalist', group: 'challenges', name: 'Minimalist Badge', icon: 'minimalist', emoji: '🃏',
    text: 'Win a run with 12 cards or fewer in your deck', test: (s, save) => aWin(save, w => Array.isArray(w.deck) && w.deck.length <= 12) },
  { id: 'purist', group: 'challenges', name: 'Purist Badge', icon: 'purist', emoji: '📜',
    text: 'Win a run without forgetting a move', test: (s, save) => aWin(save, w => w.forgotten === 0) },
  { id: 'penny', group: 'challenges', name: 'Penny Pincher Badge', icon: 'penny', emoji: '🪙',
    text: 'Win a run spending less than ₽100', test: (s, save) => aWin(save, w => isNum(w.spent) && w.spent < 100) },
  { id: 'heavy-hitter', group: 'challenges', name: 'Heavy Hitter Badge', icon: 'heavy-hitter', emoji: '💥',
    text: 'Deal 100 damage or more in one hit',
    test: (s, save) => [...(save.hallOfFame || []), ...(save.losses || [])].some(r => (r.biggest || 0) >= 100) },
  { id: 'speedrun', group: 'challenges', name: 'Speedrun Badge', icon: 'speedrun', emoji: '⏱️',
    text: 'Win a run in fewer than 60 turns', test: (s, save) => aWin(save, w => isNum(w.turns) && w.turns > 0 && w.turns < 60) },
  { id: 'alpha-slayer', group: 'challenges', name: 'Alpha Slayer Badge', icon: 'alpha-slayer', emoji: '⚔️',
    text: 'Win a run that beat 5 Alphas', test: (s, save) => aWin(save, w => (w.elites || 0) >= 5) },
  { id: 'tsunami', group: 'challenges', name: 'Tsunami Badge', icon: 'tsunami', emoji: '🌊',
    text: 'Hold 30 Tide at once', test: (s) => (s.maxTide || 0) >= 30 },
  { id: 'bare-bag', group: 'challenges', name: 'Empty Bag Badge', icon: 'bare-bag', emoji: '🎒',
    text: 'Win a run without using an item', test: (s, save) => aWin(save, w => Array.isArray(w.itemsUsed) && !w.itemsUsed.length) },

  // Collector
  { id: 'sparkle', group: 'collector', name: 'Sparkle Badge', icon: 'sparkle', emoji: '✨',
    text: 'Own a shiny starter', test: (s, save) => (save.shiny?.owned || []).length >= 1 },
  { id: 'shiny-hunter', group: 'collector', name: 'Shiny Hunter Badge', icon: 'shiny-hunter', emoji: '🌟',
    text: 'Own 10 shiny starters', test: (s, save) => (save.shiny?.owned || []).length >= 10 },
  { id: 'roster', group: 'collector', name: 'Full Roster Badge', icon: 'roster', emoji: '📋',
    text: 'Own every starter', test: (s, save) => STARTERS.every(st => st.free || (save.unlocked || []).includes(st.id)) },
  { id: 'balls', group: 'collector', name: 'Ball Collector Badge', icon: 'balls', emoji: '⚾',
    text: 'Hold every kind of Poké Ball at once, the Master Ball too',
    test: (s, save) => BALLS.every(b => b.free || (b.stock ? (save.balls?.[b.id] || 0) > 0 : (save.balls?.owned || []).includes(b.id))) },
  { id: 'high-roller', group: 'collector', name: 'High Roller Badge', icon: 'high-roller', emoji: '🎰',
    text: 'Max out every Game Corner perk', test: (s, save) => PASSIVE_SHOP_ITEMS.every(p => perkMaxed(save, p)) },
  { id: 'jackpot', group: 'collector', name: 'Jackpot Badge', icon: 'jackpot', emoji: '💰',
    text: 'Earn 10,000 PokéCoins in all', test: (s) => (s.coinsEarned || 0) >= 10000 },

  // Secrets
  { id: 'dojo', group: 'secrets', name: 'Dojo Badge', icon: 'dojo', emoji: '🥋',
    text: 'Defeat Chad Master Kenmatta in his dojo', test: (s, save) => (save.kenWins || 0) >= 1 || !!save.kenBeaten },
  { id: 'black-belt', group: 'secrets', name: 'Black Belt Badge', icon: 'black-belt', emoji: '🥋',
    text: 'Defeat Chad Master Kenmatta 3 times', test: (s, save) => (save.kenWins || 0) >= 3 || !!save.kenBeaten },
  { id: 'seal', group: 'secrets', name: 'Seal Badge', icon: 'seal', emoji: '🔮',
    text: 'Break the Sealed Gate', test: (s, save) => save.gateHp <= 0 },
  { id: 'depths', group: 'secrets', name: 'Depths Badge', icon: 'depths', emoji: '💎', secret: true,
    text: 'Defeat Eternatus in the Crystal Depths', test: (s, save) => !!s.bossesDefeated?.[4] || (save.feats || []).includes('eternatus') },
  { id: 'eternal', group: 'secrets', name: 'Eternal Badge', icon: 'eternal', emoji: '♾️', secret: true,
    text: 'Defeat Eternatus twice',
    test: (s, save) => (s.bossKills?.[4] || 0) >= 2 || (save.hallOfFame || []).filter(w => w.starter === 'mewtwo').length >= 2 },
  { id: 'pokedex', group: 'secrets', name: 'Pokédex Badge', icon: 'pokedex', emoji: '📕',
    text: 'Complete the research of every Pokédex entry', test: (s, save) => !!save.dex?.complete },
  { id: 'safari', group: 'secrets', name: 'Safari Badge', icon: 'safari', emoji: '🦺',
    text: 'Catch every Pokémon on one Safari Pokédex page', test: (s, save) => (save.safariDex?.done || []).length > 0 },
  { id: 'streak', group: 'secrets', name: 'Streak Badge', icon: 'streak', emoji: '⚡',
    text: 'Win 3 runs in a row on Trainer Level 2 or higher', test: (s) => s.bestStreak >= 3 },
  { id: 'thunder', group: 'secrets', name: 'Thunder Badge', icon: 'thunder', emoji: '🌩️',
    text: 'Win 5 runs in a row on Trainer Level 2 or higher', test: (s) => s.bestStreak >= 5 },
  { id: 'legend', group: 'secrets', name: 'Legend Badge', icon: 'legend', emoji: '🌠',
    text: 'Unlock every legendary starter', test: (s, save) => LEGENDS.every(id => (save.unlocked || []).includes(id)) },

  // Pokédex: research every entry on a biome's page, or beat every Pokémon on it
  ...DEX_PAGES.map(p => ({ id: `page-${p.biome}`, group: 'pokedex', name: `${p.name.split(' ').at(-1)} Page Badge`, icon: `page-${p.biome}`,
    emoji: '📖', text: `Complete the ${its(p.name)} Pokédex page`, test: (s, save) => pageDone(save, p.biome) })),
  { id: 'page-ruins', group: 'pokedex', name: 'Ruins Page Badge', icon: 'page-ruins', emoji: '📘',
    text: 'Complete the Sunken Ruins\' Pokédex page', test: (s, save) => pageDone(save, 'ruins') },
  { id: 'page-thornwood', group: 'pokedex', name: 'Jungle Page Badge', icon: 'page-thornwood', emoji: '📗',
    text: 'Complete the Thornwood Jungle\'s Pokédex page', test: (s, save) => pageDone(save, 'thornwood') },
  { id: 'page-depths', group: 'pokedex', name: 'Crystal Page Badge', icon: 'page-depths', emoji: '📓', secret: true,
    text: 'Complete the Crystal Depths\' Pokédex page', test: (s, save) => pageDone(save, 'depths') },
  ...[['ruins', 'Ruins Hunter Badge'], ['thornwood', 'Jungle Hunter Badge'], ['depths', 'Crystal Hunter Badge']].map(([biome, name]) => ({
    id: `beat-${biome}`, group: 'pokedex', name, icon: `beat-${biome}`, emoji: '🎯', ...(biome === 'depths' && { secret: true }),
    text: `Defeat every Pokémon on the ${its(PAGE_OF[biome].name)} Pokédex page`, test: (s, save) => pageBeaten(save, PAGE_OF[biome]) })),

  // Safari Zone
  { id: 'safari-open', group: 'safari', name: 'Safari Pass Badge', icon: 'safari-open', emoji: '🎫',
    text: 'Open the Safari Zone: research every Pokémon in the first three biomes', test: (s, save) => DEX_PAGES.every(p => pageDone(save, p.biome)) },
  { id: 'safari-regular', group: 'safari', name: 'Safari Regular Badge', icon: 'safari-regular', emoji: '🌄',
    text: 'Play the Safari Zone on 7 different days', test: (s, save) => safariDays(save) >= 7 },
  { id: 'master-ball', group: 'safari', name: 'Master Ball Badge', icon: 'master-ball', emoji: '🟣',
    text: 'Throw the Master Ball 10 times (it has one throw a week)', test: (s, save) => masterThrows(save.balls) >= 10 },
  { id: 'rare-catch', group: 'safari', name: 'Rare Catch Badge', icon: 'rare-catch', emoji: '🍀',
    text: 'Catch a rare Pokémon in the Safari Zone', test: (s, save) => (save.safariDex?.caught || []).some(id => SAFARI_RARES.has(id)) },
  ...RARE_COUNTS.map(n => ({ id: `rare-${n}`, group: 'safari', name: `Rare Catch Badge ×${n}`, icon: `rare-${n}`, emoji: '🍀',
    text: `Catch ${n} different rare Pokémon in the Safari Zone`, test: (s, save) => raresCaught(save) >= n })),
  ...SAFARI_DEX_PAGES.map(p => ({ id: `area-${p.area}`, group: 'safari', name: `${p.name} Badge`, icon: `area-${p.area}`,
    emoji: AREA_EMOJI[p.area] ?? '🦺', text: `Catch every Pokémon on the Safari's ${p.name} page`, test: (s, save) => caughtAll(save, p.ids) })),
  ...SAFARI_DEX_PAGES.map(p => ({ id: `rares-${p.area}`, group: 'safari', name: `${p.name} Rarity Badge`, icon: `rares-${p.area}`,
    emoji: '💎', text: `Catch every rare Pokémon in the Safari's ${p.name}`, test: (s, save) => caughtAll(save, p.rare) })),
  { id: 'safari-master', group: 'safari', name: 'Safari Master Badge', icon: 'safari-master', emoji: '🦺',
    text: 'Catch every Pokémon in the Safari Pokédex', test: (s, save) => !!save.safariDex?.complete },
  ...SAFARI_TYPE_BADGES,

  // Sky Pillar: each flight's guardian, and guardians beaten over every climb
  ...GUARDIAN_FLOORS.map(f => ({ id: `tower-${f}`, group: 'tower', name: `Tower Badge ${f}F`, icon: `tower-${f}`, emoji: '🗼',
    text: f === 100 ? 'Defeat Rayquaza, the guardian of the Sky Pillar\'s top floor' : `Defeat the Sky Pillar's floor ${f} guardian`,
    test: (s, save) => (save.tower?.bestEver || 0) >= f })),
  ...GUARDIAN_COUNTS.map(n => ({ id: `guardians-${n}`, group: 'tower', name: n === 1 ? 'Guardian Badge' : `Guardian Badge ×${n}`,
    icon: `guardians-${n}`, emoji: '🛡️', text: n === 1 ? 'Defeat a Sky Pillar guardian' : `Defeat ${n} Sky Pillar guardians, over any climbs`,
    test: (s, save) => guardiansBeaten(save) >= n })),
  { id: 'sky-king', group: 'tower', name: 'Sky King Badge', icon: 'sky-king', emoji: '☁️',
    text: 'Reach the top of the Sky Pillar 3 times', test: (s, save) => (save.tower?.summits || 0) >= 3 },
  { id: 'weekly', group: 'tower', name: 'Weekly Climber Badge', icon: 'weekly', emoji: '📅',
    text: 'Climb the Sky Pillar in 4 different weeks', test: (s, save) => towerWeeks(save) >= 4 },
];

export const BADGES_BY_ID = Object.fromEntries(BADGES.map(b => [b.id, b]));

/** The badges this save has earned but not been granted yet (pure: checkBadges() in js/progress.js saves them). */
export const newBadges = (save) => BADGES.filter(b => !b.locked && !(save.badges || []).includes(b.id) && b.test(save.stats || {}, save));

/** A badge's line in the reward box and the result window. */
export const badgeLine = (b) => `${b.emoji} Badge earned: ${b.name}!`;
