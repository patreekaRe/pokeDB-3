/* ============================================================
   achievements.js  -  how the six locked starters get unlocked.

   Each achievement unlocks one starter. `test` looks at your saved
   stats (see storage.js) and returns true once you have done it.
   ============================================================ */

export const ACHIEVEMENTS = [
  {
    starter: 'chikorita',
    text: 'Defeat the Biome 1 boss (Snorlax)',
    test: (s) => !!s.bossesDefeated[1],
  },
  {
    starter: 'cyndaquil',
    text: 'Defeat the Biome 2 boss',
    test: (s) => !!s.bossesDefeated[2],
  },
  {
    starter: 'totodile',
    text: 'Win a full run',
    test: (s) => s.runsWon >= 1,
  },
  {
    starter: 'treecko',
    text: 'Win a run without visiting a rest site',
    test: (s) => s.noRestWin,
  },
  {
    starter: 'torchic',
    text: 'Defeat a boss without taking any damage',
    test: (s) => s.noDamageBoss,
  },
  {
    starter: 'mudkip',
    text: 'Win a run with each Kanto starter',
    test: (s) => ['charmander', 'bulbasaur', 'squirtle'].every(id => (s.winsBy[id] || 0) >= 1),
  },
];

export const ACHIEVEMENT_FOR = Object.fromEntries(ACHIEVEMENTS.map(a => [a.starter, a]));
