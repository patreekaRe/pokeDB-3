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
};

export const LEVELS = [
  { name: 'Standard', text: 'The normal game.' },
  { name: 'Sharper Claws', text: 'Enemies have 12% more HP.', mods: { normalHp: 1.12 } },
  { name: 'Elite Territory', text: 'Elite Pokémon have 30% more HP.', mods: { eliteHp: 1.3 } },
  { name: 'Rationing', text: 'Pokémon Centers heal only 10% of your HP instead of 35%.', mods: { restHeal: 0.1 } },
  { name: 'Fierce Bosses', text: 'Bosses have 20% more HP and hit 2 harder.', mods: { bossHp: 1.2, bossDmg: 2 } },
  { name: 'Wild Aura', text: 'Every enemy hits 1 harder, and evolving only heals half of your missing HP.', mods: { enemyDmg: 1, evolveHeal: 0.5 } },
];

export const MAX_LEVEL = LEVELS.length - 1;

/** All the rules that apply at a level (the levels below it included). */
export function modsFor(level) {
  const mods = { ...BASE_MODS };
  for (let i = 1; i <= level; i++) Object.assign(mods, LEVELS[i].mods);
  return mods;
}
