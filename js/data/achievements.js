/* ============================================================
   achievements.js  -  how achievement-locked skins get unlocked.

   Not every skin is here - Cyndaquil, Chikorita, Totodile, Snivy,
   Tepig and Oshawott are bought in the shop instead (see data/shop.js
   and progress.js's isShopUnlock). This file is only for the skins
   that need to be earned.

   Each achievement unlocks one starter. `test` looks at your saved
   stats (see storage.js) and returns true once you have done it; it
   also gets the whole save, for goals about what you have unlocked.

   Kept deliberately forgiving: nothing here needs a flawless run.
   The two that used to ("no damage at all", "no rest site at all")
   were changed to "mostly" versions, since a single mistake voiding
   an entire run felt like bad luck more than a fair challenge.
   ============================================================ */

import { STARTERS } from './starters.js';

export const ACHIEVEMENTS = [
  // Easier, first-tier goals up front...
  {
    starter: 'torchic',
    text: 'Defeat the Biome 1 boss (Snorlax)',
    test: (s) => !!s.bossesDefeated[1],
  },
  {
    starter: 'treecko',
    text: 'Defeat the Biome 2 boss',
    test: (s) => !!s.bossesDefeated[2],
  },
  {
    starter: 'mudkip',
    text: 'Win a full run',
    test: (s) => s.runsWon >= 1,
  },
  // ...tougher, second-tier goals once you've got the basics down.
  {
    starter: 'chimchar',
    text: 'Defeat a boss with over half your HP left',
    test: (s) => s.healthyBossWin,
  },
  {
    starter: 'turtwig',
    text: 'Win a run visiting at most 1 rest site',
    test: (s) => s.lightRestWin,
  },
  {
    starter: 'piplup',
    text: 'Win a run with each Kanto starter',
    test: (s) => ['charmander', 'bulbasaur', 'squirtle'].every(id => (s.winsBy[id] || 0) >= 1),
  },
  // Legendaries: still the hardest unlock in the game, but Level 5 (the bot's
  // win rate there is ~10-18%) felt discouraging rather than aspirational.
  // Level 3 (~35-50%) is still a real skill check.
  {
    starter: 'moltres',
    text: 'Win a run on Trainer Level 3 with a Fire starter',
    test: (s) => s.maxLevelWinByType.fire >= 3,
  },
  {
    starter: 'virizion',
    text: 'Win a run on Trainer Level 3 with a Grass starter',
    test: (s) => s.maxLevelWinByType.grass >= 3,
  },
  {
    starter: 'suicune',
    text: 'Win a run on Trainer Level 3 with a Water starter',
    test: (s) => s.maxLevelWinByType.water >= 3,
  },
  // Must stay last: checkAchievements() grants in order, so this sees any
  // starter unlocked by the entries above in the same check.
  {
    starter: 'mewtwo',
    text: 'Unlock every other Pokémon',
    test: (s, save) => STARTERS.every(st => st.id === 'mewtwo' || st.free || save.unlocked.includes(st.id)),
  },
];

export const ACHIEVEMENT_FOR = Object.fromEntries(ACHIEVEMENTS.map(a => [a.starter, a]));
