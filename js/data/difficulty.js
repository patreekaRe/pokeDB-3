/* ============================================================
   difficulty.js  -  Trainer Levels.

   Level 0 is the normal game. Each time you win a run on your highest
   unlocked level, the next level unlocks. Levels STACK: level 3 has the
   rules of levels 1, 2 and 3 together.

   Every rule is just a number in `mods`. modsFor(level) adds them up
   and the game reads the result (see run.js, map.js and enemies.js).
   ============================================================ */

/** The rules of the normal game (level 0). */
const BASE_MODS = {
  normalHp: 1,      // multiplies the HP of regular and elite enemies
  eliteHp: 1,       // multiplies elite HP (on top of normalHp)
  restHeal: 0.35,   // fraction of your max HP a Pokémon Center heals
  bossHp: 1,        // multiplies boss HP
  bossDmg: 0,       // extra damage on every boss attack
  enemyDmg: 0,      // extra damage on every enemy attack (bosses too)
  evolveHeal: 1,    // fraction of your missing HP that evolving heals
  prizeMult: 1,     // multiplies the ₽ a won fight pays
};

export const LEVELS = [
  { name: 'Standard', text: 'The normal game.' },
  { name: 'Sharper Claws', text: 'Enemies have 12% more HP.', mods: { normalHp: 1.12 } },
  { name: 'Elite Territory', text: 'Elite Pokémon have 15% more HP.', mods: { eliteHp: 1.15 } },
  { name: 'Rationing', text: 'Pokémon Centers heal only 10% of your HP instead of 35%.', mods: { restHeal: 0.1 } },
  { name: 'Fierce Bosses', text: 'Bosses have 10% more HP and hit 2 harder.', mods: { bossHp: 1.1, bossDmg: 2 } },
  { name: 'Wild Aura', text: 'Every enemy hits 1 harder, and evolving only heals half of your missing HP.', mods: { enemyDmg: 1, evolveHeal: 0.5 } },
];

export const MAX_LEVEL = LEVELS.length - 1;

/** All the rules that apply at a level (the levels below it included). */
export function modsFor(level) {
  const mods = { ...BASE_MODS };
  for (let i = 1; i <= level; i++) Object.assign(mods, LEVELS[i].mods);
  return mods;
}

/* Mewtwo's run is its own game mode (v1.0, the user's calls 2026-09-28 / 2026-10-02): no Trainer Level, one fixed
   setting from start to end. Biomes 1-3 are a speedrun to build the deck for the Crystal Depths, the biome only Mewtwo
   enters (at its own BIOMES numbers, on a normal map): one road each, no forks (the user's call after a playtest,
   2026-10-02), enemies Mewtwo should shred, and prize money enough to shop at every Mart. */
const SPRINT = ['fight', 'fight', 'elite', 'shop', 'rest'];   // then the boss
export const MEWTWO_MODE = {
  floors: [SPRINT, SPRINT, SPRINT, 10],   // a list is a fixed road (generateMap())
  mods: [   // on top of Level 0's, per biome
    { prizeMult: 2.5 },
    { prizeMult: 2.5, normalHp: 0.7, bossHp: 0.85, enemyDmg: -5 },
    { prizeMult: 2.5, normalHp: 0.55, bossHp: 0.7, enemyDmg: -12 },
    {},
  ],
};

export const isMewtwoRun = (starter) => starter?.id === 'mewtwo';

/** The rules a run plays in a biome: its Trainer Level's, or Mewtwo's fixed ones. */
export function runMods(starter, level, biome) {
  return isMewtwoRun(starter) ? { ...BASE_MODS, ...MEWTWO_MODE.mods[biome] } : modsFor(level);
}

/** How many floors a biome's map has in this run (undefined: the map's own 10). */
export const runFloors = (starter, biome) => (isMewtwoRun(starter) ? MEWTWO_MODE.floors[biome] : undefined);
