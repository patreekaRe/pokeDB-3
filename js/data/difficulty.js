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
  enemyDmgMult: 1,  // multiplies every enemy attack, after enemyDmg (the Sky Pillar past floor 30)
  evolveHeal: 1,    // fraction of your missing HP that evolving heals
  prizeMult: 1,     // multiplies the ₽ a won fight pays
  playerDmg: 1,     // multiplies the damage of your attacks (Mewtwo's sprint)
  healMult: 1,      // multiplies every heal in battle (rounded)
  maxHpMult: 1,     // multiplies your starting max HP
};

export const LEVELS = [
  { name: 'Standard', text: 'The normal game.' },
  { name: 'Sharper Claws', text: 'Enemies have 12% more HP.', mods: { normalHp: 1.12 } },
  { name: 'Elite Territory', text: 'Elite Pokémon have 15% more HP.', mods: { eliteHp: 1.15 } },
  { name: 'Rationing', text: 'Pokémon Centers heal only 10% of your HP instead of 35%.', mods: { restHeal: 0.1 } },
  { name: 'Fierce Bosses', text: 'Bosses have 10% more HP and hit 2 harder.', mods: { bossHp: 1.1, bossDmg: 2 } },
  { name: 'Wild Aura', text: 'Every enemy hits 1 harder, and evolving only heals half of your missing HP.', mods: { enemyDmg: 1, evolveHeal: 0.5 } },
  // 6-10 (2026-10-22, the user won on 5 and found it too easy, healing most of all): StS's Ascension 15-20, in five steps
  { name: 'Bitter Medicine', text: 'Healing in battle restores 20% less.', mods: { healMult: 0.8 } },
  { name: 'Worn Out', text: 'You start with 10% less max HP.', mods: { maxHpMult: 0.9 } },
  { name: 'Seasoned Foes', text: 'Every enemy hits 1 harder again, and elites have 10% more HP again.', mods: { enemyDmg: 2, eliteHp: 1.25 } },
  { name: 'No Second Wind', text: 'Evolving no longer heals, and Pokémon Centers heal only 5%.', mods: { evolveHeal: 0, restHeal: 0.05 } },
  { name: 'Champion\'s Trial', text: 'Bosses have 20% more HP and hit 4 harder.', mods: { bossHp: 1.2, bossDmg: 4 } },
];

export const MAX_LEVEL = LEVELS.length - 1;
/** The Level whose wins are a champion's (the Hall of Fame, the gold stars, the Sealed Gate's last blow, the Level 5
    badges): the top Level until 2026-10-22, when 6-10 were added above it. A win on any Level from here up counts. */
export const CHAMPION_LEVEL = 5;
export const isChampion = (level) => level >= CHAMPION_LEVEL;

/** The highest Trainer Level won with a starter (-1: none), from the Record Book; a gold star from before it counts as 5. */
export function bestWin(save, id) {
  const best = Math.max(-1, ...(save.hallOfFame || []).filter(w => w.starter === id && typeof w.level === 'number').map(w => w.level));
  return Math.max(best, save.stats?.level5WinsBy?.[id] > 0 ? CHAMPION_LEVEL : -1);
}
/** A champion's star climbs with the best Level won (the user's pick, 2026-10-22): gold at 5, a gem's colour at 6-9, a
    rainbow at 10. `.star-lvN` in css/menus.css tints the ⭐. */
const STAR_NAMES = ['Gold', 'Ruby', 'Emerald', 'Sapphire', 'Amethyst', 'Rainbow'];
export const starClass = (level) => (isChampion(level) ? `star-lv${Math.min(level, MAX_LEVEL)}` : '');
export const starName = (level) => STAR_NAMES[Math.min(level, MAX_LEVEL) - CHAMPION_LEVEL];

/** A Pokémon Master: a run won on the top Trainer Level (Mewtwo's and a summit aside), read from the Record Book so an
    old save proves it. It earns the title on the Trainer Card, a crystal Hall of Fame pedestal (the user's pick,
    2026-10-22) and the Champion's Crown (2026-10-23). `?master` lends them for a page load. */
const QUERY = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
/** `?aura=6..10` lends that Level's aura for a page load; 10's comes with the crown, as a real Level 10 win's does. */
const LENT_AURA = (() => { const n = parseInt(QUERY.get('aura'), 10); return n > CHAMPION_LEVEL && n <= MAX_LEVEL ? n : 0; })();
const LENT_MASTER = QUERY.has('master') || LENT_AURA === MAX_LEVEL;
let masterRead = { list: null, n: -1, yes: false };   // the walking buddy asks every frame: the Record Book is read once per new win
export function isMaster(save) {
  if (LENT_MASTER) return true;
  const list = save.hallOfFame || [];
  if (masterRead.list !== list || masterRead.n !== list.length) masterRead = { list, n: list.length, yes: list.some(w => w.starter !== 'mewtwo' && !w.summit && w.level >= MAX_LEVEL) };
  return masterRead.yes;
}
/** The Champion's Crown floats over the walking buddy from the first Level 10 win until it's taken off (`save.crown`
    false; the Trainer Card's Crown key). The user's pick over a cape, which they found silly (2026-10-23). */
export const wearsCrown = (save) => isMaster(save) && save.crown !== false;
/** Has the save won a run on Trainer Level `level` or higher (Mewtwo's and a summit aside), from the Record Book? */
export const wonOn = (save, level) => (save.hallOfFame || []).some(w => w.starter !== 'mewtwo' && !w.summit && w.level >= level);

/** The Super Saiyan aura (2026-10-23, the user's ask: "a super saiyan aura or something along the way? and a crazier one
    at level 10?"): the walking buddy wears the aura of the highest Level won from 6 up, in that Level's star colour and
    bigger each Level (js/aura-art.js paints them). Every Level below the best won counts as earned, as each one had to
    be won to open the next. 0: none. */
let auraRead = { list: null, n: -1, best: 0 };
export function auraBest(save) {
  const list = save.hallOfFame || [];
  if (auraRead.list !== list || auraRead.n !== list.length) {
    const won = list.filter(w => w.starter !== 'mewtwo' && !w.summit && typeof w.level === 'number').map(w => Math.min(w.level, MAX_LEVEL));
    const best = Math.max(0, ...won);
    auraRead = { list, n: list.length, best: best > CHAMPION_LEVEL ? best : 0 };
  }
  return Math.max(auraRead.best, LENT_AURA);
}
/** The auras the save may wear, lowest first. */
export const aurasEarned = (save) => { const best = auraBest(save); return best ? Array.from({ length: best - CHAMPION_LEVEL }, (_, i) => CHAMPION_LEVEL + 1 + i) : []; };
/** The aura the walking buddy wears (0: none): the Trainer Card's Aura key picks one earned (`save.aura`, 0 for off),
    else the best. */
export function auraWorn(save) {
  const best = auraBest(save), pick = save.aura;
  if (!best || pick === 0) return 0;
  return typeof pick === 'number' && pick > CHAMPION_LEVEL && pick <= best ? pick : best;
}

/** The Pokédex shells a high Level earns (the roadmap's Level 6-10 reward 7, 2026-10-23): Gilded, polished gold, for a
    Level 8 win and Clear, the see-through Game Boy, for a Pokémon Master. Settings shows each once earned. */
export const LEVEL_SHELLS = [
  { id: 'gilded', name: 'Gilded', swatch: '#f0c040', level: 8 },
  { id: 'clear', name: 'Clear', swatch: '#c8dcec', level: MAX_LEVEL },
];
export const shellEarned = (save, sh) => isMaster(save) || wonOn(save, sh.level);

/** All the rules that apply at a level (the levels below it included). */
export function modsFor(level) {
  const mods = { ...BASE_MODS };
  for (let i = 1; i <= level; i++) Object.assign(mods, LEVELS[i].mods);
  return mods;
}

/* Mewtwo's run is its own game mode (v1.0, the user's calls 2026-09-28 / 2026-10-02): no Trainer Level, one fixed
   setting from start to end. Biomes 1-3 are a speedrun to build the deck for the Crystal Depths, the biome only Mewtwo
   enters (at its own BIOMES numbers, on a normal map): one road each, no forks (the user's call after a playtest,
   2026-10-02) with a ? room, enemies Mewtwo shreds (its attacks also hit 25% harder there, the user's call: lore-accurate),
   and prize money enough to shop at every Mart. */
const SPRINT = ['fight', 'fight', 'event', 'elite', 'shop', 'rest'];   // then the boss
export const MEWTWO_MODE = {
  floors: [SPRINT, SPRINT, SPRINT, 10],   // a list is a fixed road (generateMap())
  mods: [   // on top of Level 0's, per biome
    { prizeMult: 2.5, playerDmg: 1.25 },
    { prizeMult: 2.5, playerDmg: 1.25, normalHp: 0.7, bossHp: 0.85, enemyDmg: -5 },
    { prizeMult: 2.5, playerDmg: 1.25, normalHp: 0.55, bossHp: 0.7, enemyDmg: -12 },
    { bossDmg: 4, bossHp: 1.2, enemyDmg: -3 },   // the Depths and Eternatus: v1.0's 8 / 1.3 (the bot won 91-95% without it), eased in the 2026-10-16 balance pass, when Quick Guard's Exhaust and the bigger pools took Mewtwo's run from 63% to 53%
  ],
};

export const isMewtwoRun = (starter) => starter?.id === 'mewtwo';

/* Mewtwo's Sealed Weakness (the user's design, 2026-10-14): freed from the gate it is still too weak for what's below, so
   in the Crystal Depths only its attacks deal `base` of their damage, each Waystone Shard placed giving `perShard` back;
   all five, full strength. Its first three biomes are unchanged. */
export const SEALED_WEAKNESS = { base: 0.5, perShard: 0.1, shards: 5 };
export const sealedMult = (shards) => Math.min(1, Math.round((SEALED_WEAKNESS.base + SEALED_WEAKNESS.perShard * Math.max(0, shards || 0)) * 100) / 100);

/** The rules a run plays in a biome: its Trainer Level's, or Mewtwo's fixed ones (`shards`: the Waystone Shards placed,
    for the Depths' Sealed Weakness). */
export function runMods(starter, level, biome, shards = 0) {
  if (!isMewtwoRun(starter)) return modsFor(level);
  const mods = { ...BASE_MODS, ...MEWTWO_MODE.mods[biome] };
  return biome === 3 ? { ...mods, playerDmg: sealedMult(shards) } : mods;
}

/** How many floors a biome's map has in this run (undefined: the map's own 10). */
export const runFloors = (starter, biome) => (isMewtwoRun(starter) ? MEWTWO_MODE.floors[biome] : undefined);
