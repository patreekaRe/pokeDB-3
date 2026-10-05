/* ============================================================
   badges.js  -  the Trainer Card's Badge Case (roadmap item 17).

   Badges unlock nothing: they're a record of what you've done, in four
   groups. Each `test(stats, save)` looks only at what the save already
   keeps, so an old save earns on day one everything it can prove
   (checkBadges() in js/progress.js also runs at load). Earned ids are kept
   in the save's `badges`, so a badge stays earned even if a test ever
   changes. `locked` ones wait for content that doesn't exist yet and can't
   be earned. `icon` names the badge's pixel art (part b); `emoji` stands in
   for it in the text lines.
   ============================================================ */

import { STARTERS } from './starters.js';
import { MAX_LEVEL } from './difficulty.js';

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

export const BADGE_GROUPS = [
  { id: 'journey', name: 'Journey' },
  { id: 'levels', name: 'Trainer Levels' },
  { id: 'secrets', name: 'Secrets' },
  { id: 'new', name: 'New frontiers' },
];

export const BADGES = [
  // Journey
  { id: 'clearing', group: 'journey', name: 'Clearing Badge', icon: 'clearing', emoji: '🌳',
    text: 'Defeat the Whispering Clearing\'s boss', test: (s) => !!s.bossesDefeated?.[1] },
  { id: 'shrine', group: 'journey', name: 'Shrine Badge', icon: 'shrine', emoji: '⛩️',
    text: 'Defeat the Overgrown Shrine\'s boss', test: (s) => !!s.bossesDefeated?.[2] },
  { id: 'ember', group: 'journey', name: 'Ember Badge', icon: 'ember', emoji: '🌋',
    text: 'Defeat the Ember Wastes\' boss', test: (s) => !!s.bossesDefeated?.[3] },
  { id: 'champion', group: 'journey', name: 'Champion Badge', icon: 'champion', emoji: '🏆',
    text: 'Win a run', test: (s) => s.runsWon >= 1 },
  { id: 'fire', group: 'journey', name: 'Fire Badge', icon: 'fire', emoji: '🔥',
    text: 'Win a run with a Fire starter', test: (s) => wonWithType(s, 'fire') },
  { id: 'water', group: 'journey', name: 'Water Badge', icon: 'water', emoji: '💧',
    text: 'Win a run with a Water starter', test: (s) => wonWithType(s, 'water') },
  { id: 'grass', group: 'journey', name: 'Grass Badge', icon: 'grass', emoji: '🍃',
    text: 'Win a run with a Grass starter', test: (s) => wonWithType(s, 'grass') },

  // Trainer Levels (Mewtwo's runs have no Level, so they never count; its Hall of Fame entries are skipped too)
  { id: 'bronze', group: 'levels', name: 'Bronze Badge', icon: 'bronze', emoji: '🥉',
    text: 'Win a run on Trainer Level 2', test: (s, save) => levelWon(s, 2) || owns(save, LEVEL2_LEGENDS) },
  { id: 'silver', group: 'levels', name: 'Silver Badge', icon: 'silver', emoji: '🥈',
    text: 'Win a run on Trainer Level 3', test: (s, save) => levelWon(s, 3) || owns(save, LEVEL3_LEGENDS) },
  { id: 'gold', group: 'levels', name: 'Gold Badge', icon: 'gold', emoji: '🥇',
    text: 'Win a run on Trainer Level 5', test: (s, save) => level5Types(s, save).size > 0 },
  { id: 'master', group: 'levels', name: 'Master Badge', icon: 'master', emoji: '👑',
    text: 'Win a run on Trainer Level 5 with a Fire, a Water and a Grass starter',
    test: (s, save) => KANTO_TYPES.every(t => level5Types(s, save).has(t)) },

  // Secrets
  { id: 'dojo', group: 'secrets', name: 'Dojo Badge', icon: 'dojo', emoji: '🥋',
    text: 'Defeat Chad Master Kenmatta in his dojo', test: (s, save) => (save.kenWins || 0) >= 1 || !!save.kenBeaten },
  { id: 'seal', group: 'secrets', name: 'Seal Badge', icon: 'seal', emoji: '🔮',
    text: 'Break the Sealed Gate', test: (s, save) => save.gateHp <= 0 },
  { id: 'depths', group: 'secrets', name: 'Depths Badge', icon: 'depths', emoji: '💎', secret: true,
    text: 'Defeat Eternatus in the Crystal Depths', test: (s, save) => !!s.bossesDefeated?.[4] || (save.feats || []).includes('eternatus') },
  { id: 'pokedex', group: 'secrets', name: 'Pokédex Badge', icon: 'pokedex', emoji: '📕',
    text: 'Complete the research of every Pokédex entry', test: (s, save) => !!save.dex?.complete },
  { id: 'safari', group: 'secrets', name: 'Safari Badge', icon: 'safari', emoji: '🦺',
    text: 'Catch every Pokémon on one Safari Pokédex page', test: (s, save) => (save.safariDex?.done || []).length > 0 },
  { id: 'streak', group: 'secrets', name: 'Streak Badge', icon: 'streak', emoji: '⚡',
    text: 'Win 3 runs in a row on Trainer Level 2 or higher', test: (s) => s.bestStreak >= 3 },

  // New content: shown as locked slots until it lands
  { id: 'explorer', group: 'new', name: 'Explorer Badge', icon: 'explorer', emoji: '🧭', locked: true,
    text: 'See every biome (coming with branching biomes)', test: () => false },
  { id: 'tower-25', group: 'new', name: 'Tower Badge 25F', icon: 'tower-25', emoji: '🗼', locked: true,
    text: 'Reach floor 25 of the Sky Pillar (coming soon)', test: () => false },
  { id: 'tower-50', group: 'new', name: 'Tower Badge 50F', icon: 'tower-50', emoji: '🗼', locked: true,
    text: 'Reach floor 50 of the Sky Pillar (coming soon)', test: () => false },
  { id: 'tower-100', group: 'new', name: 'Tower Badge 100F', icon: 'tower-100', emoji: '🗼', locked: true,
    text: 'Reach floor 100 of the Sky Pillar (coming soon)', test: () => false },
];

export const BADGES_BY_ID = Object.fromEntries(BADGES.map(b => [b.id, b]));

/** The badges this save has earned but not been granted yet (pure: checkBadges() in js/progress.js saves them). */
export const newBadges = (save) => BADGES.filter(b => !b.locked && !(save.badges || []).includes(b.id) && b.test(save.stats || {}, save));

/** A badge's line in the reward box and the result window. */
export const badgeLine = (b) => `${b.emoji} Badge earned: ${b.name}!`;
