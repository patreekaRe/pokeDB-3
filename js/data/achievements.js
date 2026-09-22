/* ============================================================
   achievements.js  -  how achievement-locked skins get unlocked.

   Not every skin is here - Cyndaquil, Chikorita, Totodile, Snivy,
   Tepig and Oshawott are bought in the shop instead (see data/shop.js
   and progress.js's isShopUnlock). This file is only for the skins
   that need to be earned.

   Each achievement unlocks one starter. `test` looks at your saved
   stats (see storage.js) and returns true once you have done it.
   ============================================================ */

export const ACHIEVEMENTS = [
  {
    starter: 'torchic',
    text: 'Defeat a boss without taking any damage',
    test: (s) => s.noDamageBoss,
  },
  {
    starter: 'treecko',
    text: 'Win a run without visiting a rest site',
    test: (s) => s.noRestWin,
  },
  {
    starter: 'mudkip',
    text: 'Win a run with each Kanto starter',
    test: (s) => ['charmander', 'bulbasaur', 'squirtle'].every(id => (s.winsBy[id] || 0) >= 1),
  },
  {
    starter: 'turtwig',
    text: 'Win a run without your HP ever dropping below 30%',
    test: (s) => s.noLowHpWin,
  },
  {
    starter: 'chimchar',
    text: 'Deal 50 or more damage with a single card',
    test: (s) => s.biggestHit >= 50,
  },
  {
    starter: 'piplup',
    text: 'Defeat all three possible Biome 2 bosses (Tangrowth, Magmar, Lapras) across any runs',
    test: (s) => ['tangrowth', 'magmar', 'lapras'].every(id => s.bossIdsDefeated.includes(id)),
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
    starter: 'shaymin',
    text: 'Win a run on Trainer Level 3 with a Grass starter',
    test: (s) => s.maxLevelWinByType.grass >= 3,
  },
  {
    starter: 'suicune',
    text: 'Win a run on Trainer Level 3 with a Water starter',
    test: (s) => s.maxLevelWinByType.water >= 3,
  },
];

export const ACHIEVEMENT_FOR = Object.fromEntries(ACHIEVEMENTS.map(a => [a.starter, a]));
