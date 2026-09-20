/* ============================================================
   enemies.js  -  the monsters you fight, and the three biomes.

   Each enemy has a "moves" list. On its turn it uses the next move in
   the list, then loops back to the start. The move it will use next is
   shown above its head (the "intent"), so you can plan your turn.

   Move kinds:
     attack    hit the player for `amount` damage
     drain     hit the player for `amount` and heal itself by `heal`
     defend    gain `amount` block
     buff      gain `amount` strength (all its attacks hit harder)

   Numbers here are for the first biome. Later biomes multiply HP and
   add damage (see BIOMES at the bottom). Tweak them to balance the game!
   ============================================================ */

/** Helpers for the two kinds of artwork. */
const artwork = (name) => ({ image: `assets/enemies/${name}.jpg`, art: true });     // Patrick's own monsters
const sprite  = (name) => ({ image: `assets/pokemon/${name}-front.gif`, art: false }); // pixel sprites

export const ENEMY_DEFS = {
  /* ----- your own monsters ----- */
  ashroot: {
    name: 'Ashroot', type: 'grass', hp: 55, ...artwork('ashroot'),
    description: 'A sneaky vine beast from the roots of the Lost Wilds.',
    moves: [
      { kind: 'attack', name: 'Vine Whip', amount: 7 },
      { kind: 'drain',  name: 'Drain',     amount: 5, heal: 5 },
      { kind: 'attack', name: 'Root Slam', amount: 11 },
    ],
  },
  blazeclaw: {
    name: 'Blazeclaw', type: 'fire', hp: 65, ...artwork('blazeclaw'),
    description: 'An aggressive predator with blazing strikes.',
    moves: [
      { kind: 'attack', name: 'Scratch',    amount: 8 },
      { kind: 'buff',   name: 'Roar',       amount: 2 },
      { kind: 'attack', name: 'Flame Claw', amount: 12 },
    ],
  },
  aquaeye: {
    name: 'Aquaeye', type: 'water', hp: 60, ...artwork('aquaeye'),
    description: 'Floods the battlefield and hides behind waves.',
    moves: [
      { kind: 'attack', name: 'Bubble',      amount: 6 },
      { kind: 'defend', name: 'Wave Shield', amount: 8 },
      { kind: 'attack', name: 'Wave Crash',  amount: 11 },
    ],
  },

  /* ----- wild Pokémon ----- */
  rattata: {
    name: 'Rattata', type: 'normal', hp: 40, ...sprite('rattata'),
    description: 'Small, quick and everywhere.',
    moves: [
      { kind: 'attack', name: 'Tackle',      amount: 6 },
      { kind: 'attack', name: 'Quick Attack', amount: 5 },
      { kind: 'attack', name: 'Hyper Fang',  amount: 9 },
    ],
  },
  oddish: {
    name: 'Oddish', type: 'grass', hp: 45, ...sprite('oddish'),
    description: 'Soaks up sunlight and your health.',
    moves: [
      { kind: 'drain',  name: 'Absorb', amount: 5, heal: 4 },
      { kind: 'attack', name: 'Acid',   amount: 8 },
      { kind: 'buff',   name: 'Growth', amount: 2 },
    ],
  },
  poliwag: {
    name: 'Poliwag', type: 'water', hp: 48, ...sprite('poliwag'),
    description: 'Splashes around in every puddle.',
    moves: [
      { kind: 'attack', name: 'Water Gun', amount: 6 },
      { kind: 'defend', name: 'Bubble',    amount: 7 },
      { kind: 'attack', name: 'Body Slam', amount: 9 },
    ],
  },
  zubat: {
    name: 'Zubat', type: 'normal', hp: 45, ...sprite('zubat'),
    description: 'Swoops out of the dark.',
    moves: [
      { kind: 'attack', name: 'Wing Attack', amount: 6 },
      { kind: 'drain',  name: 'Leech Life',  amount: 5, heal: 5 },
      { kind: 'attack', name: 'Air Cutter',  amount: 9 },
    ],
  },
  geodude: {
    name: 'Geodude', type: 'normal', hp: 60, ...sprite('geodude'),
    description: 'A living rock. Slow but sturdy.',
    moves: [
      { kind: 'defend', name: 'Defense Curl', amount: 9 },
      { kind: 'attack', name: 'Rock Throw',   amount: 9 },
      { kind: 'attack', name: 'Rollout',      amount: 12 },
    ],
  },
  growlithe: {
    name: 'Growlithe', type: 'fire', hp: 58, ...sprite('growlithe'),
    description: 'Loyal, loud and very warm.',
    moves: [
      { kind: 'attack', name: 'Bite',        amount: 8 },
      { kind: 'buff',   name: 'Howl',        amount: 2 },
      { kind: 'attack', name: 'Flame Wheel', amount: 12 },
    ],
  },
  machop: {
    name: 'Machop', type: 'normal', hp: 60, ...sprite('machop'),
    description: 'Trains all day. It shows.',
    moves: [
      { kind: 'attack', name: 'Karate Chop', amount: 7 },
      { kind: 'buff',   name: 'Bulk Up',     amount: 3 },
      { kind: 'attack', name: 'Cross Chop',  amount: 12 },
    ],
  },

  /* ----- bosses (fixed HP; the biome adds bonus damage via bossBonus) ----- */
  snorlax: {
    name: 'Snorlax', type: 'normal', hp: 150, ...sprite('snorlax'), boss: true,
    description: 'Blocks the path. Hits like a boulder when it wakes up.',
    moves: [
      { kind: 'attack', name: 'Body Slam',   amount: 11 },
      { kind: 'defend', name: 'Rest',        amount: 14 },
      { kind: 'buff',   name: 'Belly Drum',  amount: 2 },
      { kind: 'attack', name: 'Giga Impact', amount: 16 },
    ],
  },
  tangrowth: {
    name: 'Tangrowth', type: 'grass', hp: 280, ...sprite('tangrowth'), boss: true,
    description: 'The shrine\'s guardian, wrapped in living vines.',
    moves: [
      { kind: 'attack', name: 'Vine Whip',  amount: 9 },
      { kind: 'drain',  name: 'Giga Drain', amount: 10, heal: 10 },
      { kind: 'defend', name: 'Ingrain',    amount: 16 },
      { kind: 'attack', name: 'Power Whip', amount: 18 },
    ],
  },
  salamence: {
    name: 'Salamence', type: 'normal', hp: 450, ...sprite('salamence'), boss: true,
    description: 'The tyrant of the Ember Wastes. Beat it to finish the run.',
    moves: [
      { kind: 'attack', name: 'Bite',          amount: 11 },
      { kind: 'buff',   name: 'Dragon Dance',  amount: 3 },
      { kind: 'attack', name: 'Dragon Claw',   amount: 15 },
      { kind: 'attack', name: 'Hyper Beam',    amount: 22 },
    ],
  },
};

/** Elite version of an enemy: bigger, meaner, with an extra move. */
export function eliteOf(def) {
  return {
    ...def,
    name: `Alpha ${def.name}`,
    hp: Math.round(def.hp * 1.7),
    elite: true,
    description: `A much bigger ${def.name}. Watch out for its Rampage.`,
    moves: [...def.moves, { kind: 'attack', name: 'Rampage', amount: 16 }],
  };
}

/* ============================================================
   BIOMES  -  each is one act of a run: a map, then a boss.
   hpMult / dmgBonus make regular enemies tougher in later biomes,
   and bossBonus adds bonus damage to that biome's boss.
   ============================================================ */
export const BIOMES = [
  {
    id: 'clearing', name: 'Whispering Clearing', backdrop: 'assets/backgrounds/clearing.jpg',
    normals: ['rattata', 'oddish', 'poliwag', 'ashroot', 'aquaeye'],
    elites: ['ashroot'], boss: 'snorlax',
    hpMult: 1, dmgBonus: 0, bossBonus: 0,
  },
  {
    id: 'shrine', name: 'Overgrown Shrine', backdrop: 'assets/backgrounds/shrine.jpg',
    normals: ['zubat', 'geodude', 'growlithe', 'ashroot', 'aquaeye'],
    elites: ['aquaeye'], boss: 'tangrowth',
    hpMult: 1.9, dmgBonus: 4, bossBonus: 4,
  },
  {
    id: 'wastes', name: 'Ember Wastes', backdrop: 'assets/backgrounds/volcano.jpg',
    normals: ['blazeclaw', 'growlithe', 'machop', 'geodude', 'aquaeye'],
    elites: ['blazeclaw'], boss: 'salamence',
    hpMult: 3, dmgBonus: 9, bossBonus: 8,
  },
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * Build one fight. kind is 'fight', 'elite' or 'boss'.
 * Returns everything battle.js needs: the enemy, its HP, and bonus damage.
 */
export function buildEncounter(biomeIndex, kind) {
  const biome = BIOMES[biomeIndex];

  if (kind === 'boss') {
    const def = ENEMY_DEFS[biome.boss];
    return { def, kind, maxHp: def.hp, strength: biome.bossBonus };
  }

  const base = ENEMY_DEFS[pick(kind === 'elite' ? biome.elites : biome.normals)];
  const def = kind === 'elite' ? eliteOf(base) : base;
  return {
    def,
    kind,
    maxHp: Math.round(def.hp * biome.hpMult),
    strength: biome.dmgBonus,
  };
}
