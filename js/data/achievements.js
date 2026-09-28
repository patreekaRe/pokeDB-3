/* ============================================================
   achievements.js  -  how achievement-locked skins get unlocked.

   Not every skin is here - Cyndaquil, Chikorita, Totodile, Snivy,
   Tepig and Oshawott are bought in the shop instead (see data/shop.js
   and progress.js's isShopUnlock). This file is only for the skins
   that need to be earned.

   Each achievement unlocks one starter. `test` looks at your saved
   stats (see storage.js) and returns true once you have done it; it
   also gets the whole save, for goals about what you have unlocked.

   The early goals are deliberately forgiving: the two that used to
   need a flawless run ("no damage at all", "no rest site at all")
   were changed to "mostly" versions. Only the late legendaries
   (steps 9b-9c: no rest, the whole Pokédex) are meant as
   mastery goals.
   ============================================================ */

import { STARTERS } from './starters.js';

export const ACHIEVEMENTS = [
  // Easier, first-tier goals up front...
  {
    starter: 'torchic',
    text: 'Defeat the Biome 1 boss',
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
    text: 'Win a run resting at a Pokémon Center no more than 3 times',
    test: (s) => s.lightRestWin,
  },
  {
    starter: 'piplup',
    text: 'Win a run with each Kanto starter',
    test: (s) => ['charmander', 'bulbasaur', 'squirtle'].every(id => (s.winsBy[id] || 0) >= 1),
  },
  // Legendaries: a Level 2 win per type, then a Level 3 one (the user's call,
  // 2026-09-28: Level 5 felt out of reach, and one win shouldn't unlock two).
  {
    starter: 'moltres',
    text: 'Win a run on Trainer Level 2 with a Fire starter',
    test: (s) => s.maxLevelWinByType.fire >= 2,
  },
  {
    starter: 'virizion',
    text: 'Win a run on Trainer Level 2 with a Grass starter',
    test: (s) => s.maxLevelWinByType.grass >= 2,
  },
  {
    starter: 'suicune',
    text: 'Win a run on Trainer Level 2 with a Water starter',
    test: (s) => s.maxLevelWinByType.water >= 2,
  },
  // Step 9b: a Level 3 legendary per type, then a finished Pokédex page per biome.
  {
    starter: 'entei',
    text: 'Win a run on Trainer Level 3 with a Fire starter',
    test: (s) => s.maxLevelWinByType.fire >= 3,
  },
  {
    starter: 'celebi',
    text: 'Win a run on Trainer Level 3 with a Grass starter',
    test: (s) => s.maxLevelWinByType.grass >= 3,
  },
  {
    starter: 'kyogre',
    text: 'Win a run on Trainer Level 3 with a Water starter',
    test: (s) => s.maxLevelWinByType.water >= 3,
  },
  {
    starter: 'hooh',
    text: 'Complete the Whispering Clearing page of the Pokédex',
    test: (s, save) => save.dex.done.includes('clearing'),
  },
  {
    starter: 'lugia',
    text: 'Complete the Overgrown Shrine page of the Pokédex',
    test: (s, save) => save.dex.done.includes('shrine'),
  },
  {
    starter: 'palkia',
    text: 'Complete the Ember Wastes page of the Pokédex',
    test: (s, save) => save.dex.done.includes('wastes'),
  },
  // Mastery goals (step 9c).
  {
    starter: 'reshiram',
    text: 'Complete the research of every Pokédex entry',
    test: (s, save) => !!save.dex.complete,
  },
  {
    starter: 'victini',
    text: 'Win a run with a deck of 15 cards or fewer',
    test: (s) => s.smallDeckWin,
  },
  {
    starter: 'heatran',
    text: 'Win a run without resting at a Pokémon Center',
    test: (s) => s.noRestWin,
  },
  {
    starter: 'manaphy',
    text: 'Hold 20 Tide at once in a fight',
    test: (s) => s.maxTide >= 20,
  },
  {
    // Keldeo itself doesn't count, or it could never be earned. 3 of the 10 others (the user's call, 2026-09-28: "every one
    // you own" was a single Squirtle win for a new player).
    starter: 'keldeo',
    text: 'Win a run with 3 different Water starters',
    test: (s) => STARTERS.filter(st => st.type === 'water' && st.id !== 'keldeo' && (s.winsBy[st.id] || 0) >= 1).length >= 3,
  },
  // Must stay last: checkAchievements() grants in order, so this sees any
  // starter unlocked by the entries above in the same check.
  {
    starter: 'mewtwo',
    text: 'Unlock every other Pokémon and win a run on Trainer Level 5',
    test: (s, save) => Object.keys(s.level5WinsBy).length > 0
      && STARTERS.every(st => st.id === 'mewtwo' || st.free || save.unlocked.includes(st.id)),
  },
];

export const ACHIEVEMENT_FOR = Object.fromEntries(ACHIEVEMENTS.map(a => [a.starter, a]));
