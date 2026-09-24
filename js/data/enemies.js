/* ============================================================
   enemies.js  -  the Pokémon you fight, and the three biomes.

   Each enemy has a "moves" list. On its turn it uses the next move in
   the list, then loops back to the start. The move it will use next is
   shown above its head (the "intent"), so you can plan your turn.

   Enemy attacks follow the same type chart as yours: an enemy's attacks
   use its own type, so a Fire enemy hits a Grass starter for extra damage and a
   Water starter for less (see SUPER_EFFECTIVE in cards.js). Neutral enemies are always x1.

   Move kinds:
     attack    hit the player for `amount` damage
     drain     hit the player for `amount` and heal itself by `heal`
     defend    gain `amount` block
     buff      gain `amount` strength (all its attacks hit harder)

   Numbers here are for the first biome. Later biomes multiply HP and
   add damage (see BIOMES at the bottom). Tweak them to balance the game!
   ============================================================ */

/** Pixel sprite from assets/pokemon/ (Gen 5 art from PokeAPI/sprites). */
const sprite = (name) => ({ image: `assets/pokemon/${name}-front.gif`, art: false, spriteId: name });

export const ENEMY_DEFS = {
  /* ----- Biome 1: small wild Pokémon ----- */
  rattata: {
    name: 'Rattata', type: 'normal', hp: 40, ...sprite('rattata'),
    description: 'Small, quick and everywhere.',
    moves: [
      { kind: 'attack', name: 'Tackle',       amount: 6 },
      { kind: 'attack', name: 'Quick Attack', amount: 5 },
      { kind: 'attack', name: 'Hyper Fang',   amount: 9 },
    ],
  },
  pidgey: {
    name: 'Pidgey', type: 'normal', hp: 42, ...sprite('pidgey'),
    description: 'Kicks up sand, then swoops down.',
    moves: [
      { kind: 'attack', name: 'Gust',        amount: 6 },
      { kind: 'defend', name: 'Sand Attack', amount: 6 },
      { kind: 'attack', name: 'Wing Attack', amount: 10 },
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
  vulpix: {
    name: 'Vulpix', type: 'fire', hp: 45, ...sprite('vulpix'),
    description: 'Six tails, each one warm.',
    moves: [
      { kind: 'attack', name: 'Ember',        amount: 6 },
      { kind: 'buff',   name: 'Will-O-Wisp',  amount: 2 },
      { kind: 'attack', name: 'Flamethrower', amount: 10 },
    ],
  },

  /* ----- Biome 2: the shrine ----- */
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
      { kind: 'attack', name: 'Bite',        amount: 6 },
      { kind: 'buff',   name: 'Howl',        amount: 1 },
      { kind: 'attack', name: 'Flame Wheel', amount: 12 },
    ],
  },
  bellsprout: {
    name: 'Bellsprout', type: 'grass', hp: 55, ...sprite('bellsprout'),
    description: 'Thin, bendy and surprisingly sharp.',
    moves: [
      { kind: 'attack', name: 'Vine Whip',  amount: 7 },
      { kind: 'buff',   name: 'Growth',     amount: 2 },
      { kind: 'attack', name: 'Razor Leaf', amount: 11 },
    ],
  },
  krabby: {
    name: 'Krabby', type: 'water', hp: 55, ...sprite('krabby'),
    description: 'Big claws, tough shell.',
    moves: [
      { kind: 'attack', name: 'Vice Grip',  amount: 7 },
      { kind: 'defend', name: 'Harden',     amount: 8 },
      { kind: 'attack', name: 'Crabhammer', amount: 12 },
    ],
  },

  /* ----- Biome 3: the wastes ----- */
  machop: {
    name: 'Machop', type: 'normal', hp: 60, ...sprite('machop'),
    description: 'Trains all day. It shows.',
    moves: [
      { kind: 'attack', name: 'Karate Chop', amount: 7 },
      { kind: 'buff',   name: 'Bulk Up',     amount: 3 },
      { kind: 'attack', name: 'Cross Chop',  amount: 12 },
    ],
  },
  ponyta: {
    name: 'Ponyta', type: 'fire', hp: 62, ...sprite('ponyta'),
    description: 'Gallops across the hot ground.',
    moves: [
      { kind: 'attack', name: 'Ember',       amount: 8 },
      { kind: 'buff',   name: 'Agility',     amount: 2 },
      { kind: 'attack', name: 'Flame Wheel', amount: 12 },
    ],
  },
  staryu: {
    name: 'Staryu', type: 'water', hp: 60, ...sprite('staryu'),
    description: 'Spins out of the tide pools.',
    moves: [
      { kind: 'attack', name: 'Water Gun',   amount: 7 },
      { kind: 'defend', name: 'Harden',      amount: 8 },
      { kind: 'attack', name: 'Bubble Beam', amount: 12 },
    ],
  },
  rhyhorn: {
    name: 'Rhyhorn', type: 'normal', hp: 70, ...sprite('rhyhorn'),
    description: 'Charges first and asks questions never.',
    moves: [
      { kind: 'attack', name: 'Horn Attack', amount: 8 },
      { kind: 'defend', name: 'Harden',      amount: 10 },
      { kind: 'attack', name: 'Take Down',   amount: 13 },
    ],
  },
  tangela: {
    name: 'Tangela', type: 'grass', hp: 62, ...sprite('tangela'),
    description: 'A tangle of vines with something inside.',
    moves: [
      { kind: 'drain',  name: 'Mega Drain', amount: 6, heal: 6 },
      { kind: 'defend', name: 'Ingrain',    amount: 8 },
      { kind: 'attack', name: 'Power Whip', amount: 12 },
    ],
  },

  /* ----- the bases of the elites (they only appear as "Alpha" versions) ----- */
  gloom: {
    name: 'Gloom', type: 'grass', hp: 60, ...sprite('gloom'),
    description: 'Its smell alone is a weapon.',
    moves: [
      { kind: 'drain',  name: 'Absorb',      amount: 6, heal: 3 },
      { kind: 'defend', name: 'Ingrain',     amount: 8 },
      { kind: 'attack', name: 'Petal Dance', amount: 9 },
    ],
  },
  poliwhirl: {
    name: 'Poliwhirl', type: 'water', hp: 65, ...sprite('poliwhirl'),
    description: 'The swirl on its belly is hypnotic.',
    moves: [
      { kind: 'attack', name: 'Water Gun', amount: 7 },
      { kind: 'defend', name: 'Bubble',    amount: 8 },
      { kind: 'attack', name: 'Body Slam', amount: 12 },
    ],
  },
  arcanine: {
    name: 'Arcanine', type: 'fire', hp: 75, ...sprite('arcanine'),
    description: 'Runs like a legend and bites like one too.',
    moves: [
      { kind: 'attack', name: 'Bite',         amount: 9 },
      { kind: 'buff',   name: 'Roar',         amount: 2 },
      { kind: 'attack', name: 'Flamethrower', amount: 13 },
    ],
  },

  /* ----- bosses (fixed HP; the biome adds bonus damage via bossBonus) ----- */
  snorlax: {
    name: 'Snorlax', type: 'normal', hp: 170, ...sprite('snorlax'), boss: true,
    description: 'Blocks the path. Hits like a boulder when it wakes up.',
    moves: [
      { kind: 'attack', name: 'Body Slam',   amount: 11 },
      { kind: 'defend', name: 'Rest',        amount: 14 },
      { kind: 'buff',   name: 'Belly Drum',  amount: 2 },
      { kind: 'attack', name: 'Giga Impact', amount: 16 },
    ],
  },
  tangrowth: {
    name: 'Tangrowth', type: 'grass', hp: 250, ...sprite('tangrowth'), boss: true,
    description: 'The shrine\'s guardian, wrapped in living vines.',
    moves: [
      { kind: 'attack', name: 'Vine Whip',  amount: 11 },
      { kind: 'drain',  name: 'Giga Drain', amount: 10, heal: 6 },
      { kind: 'defend', name: 'Ingrain',    amount: 10 },
      { kind: 'attack', name: 'Power Whip', amount: 22 },
    ],
  },
  magmar: {
    name: 'Magmar', type: 'fire', hp: 230, ...sprite('magmar'), boss: true,
    description: 'A living furnace that guards the shrine\x27s heart.',
    moves: [
      { kind: 'attack', name: 'Fire Punch', amount: 10 },
      { kind: 'buff',   name: 'Sunny Day',  amount: 3 },
      { kind: 'defend', name: 'Protect',    amount: 10 },
      { kind: 'attack', name: 'Fire Blast', amount: 20 },
    ],
  },
  lapras: {
    name: 'Lapras', type: 'water', hp: 260, ...sprite('lapras'), boss: true,
    description: 'A gentle giant. Not today.',
    moves: [
      { kind: 'attack', name: 'Water Pulse', amount: 10 },
      { kind: 'defend', name: 'Mist',        amount: 10 },
      { kind: 'attack', name: 'Surf',        amount: 14 },
      { kind: 'attack', name: 'Hydro Pump',  amount: 21 },
    ],
  },
  salamence: {
    name: 'Salamence', type: 'normal', hp: 420, ...sprite('salamence'), boss: true,
    description: 'The tyrant of the Ember Wastes. Beat it to finish the run.',
    moves: [
      { kind: 'attack', name: 'Bite',          amount: 11 },
      { kind: 'buff',   name: 'Dragon Dance',  amount: 2 },
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
    hp: Math.round(def.hp * 1.6),
    elite: true,
    description: `A much bigger ${def.name}. Watch out for its Rampage.`,
    moves: [...def.moves, { kind: 'attack', name: 'Rampage', amount: 14 }],
  };
}

/* ============================================================
   BIOMES  -  each is one act of a run: a map, then a boss.
   hpMult / dmgBonus make regular enemies tougher in later biomes,
   and bossBonus adds bonus damage to that biome's boss.

   A biome can have several possible bosses; one is picked at random each run,
   so no starter always meets the boss it is weakest against.

   Each biome mixes all four types so that every starter meets
   enemies it is strong against and enemies it is weak against.
   ============================================================ */
export const BIOMES = [
  {
    id: 'clearing', name: 'Whispering Clearing', backdrop: 'assets/backgrounds/clearing.jpg',
    normals: ['rattata', 'pidgey', 'oddish', 'poliwag', 'vulpix'],
    elites: ['gloom', 'poliwhirl', 'growlithe'], bosses: ['snorlax'],
    hpMult: 1.4, dmgBonus: 5, bossBonus: 7,
  },
  {
    id: 'shrine', name: 'Overgrown Shrine', backdrop: 'assets/backgrounds/shrine.jpg',
    normals: ['zubat', 'geodude', 'growlithe', 'bellsprout', 'krabby'],
    elites: ['gloom', 'poliwhirl', 'arcanine'], bosses: ['tangrowth', 'magmar', 'lapras'],
    hpMult: 3.5, dmgBonus: 18, bossBonus: 24,
  },
  {
    id: 'wastes', name: 'Ember Wastes', backdrop: 'assets/backgrounds/volcano.jpg',
    normals: ['machop', 'ponyta', 'staryu', 'rhyhorn', 'tangela'],
    elites: ['gloom', 'poliwhirl', 'arcanine'], bosses: ['salamence'],
    hpMult: 6.5, dmgBonus: 33, bossBonus: 40,
  },
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * Build one fight. kind is 'fight', 'elite' or 'boss'. mods are the Trainer Level rules.
 * enemyId is optional: the map picks the elite and boss ahead of time so it can show them.
 * Returns everything battle.js needs: the enemy, its HP, and bonus damage.
 */
/** Pick which enemy a fight, elite or boss node will hold, when the map is made. */
export function pickEnemyId(biomeIndex, kind) {
  const biome = BIOMES[biomeIndex];
  return pick(kind === 'boss' ? biome.bosses : kind === 'elite' ? biome.elites : biome.normals);
}

export function buildEncounter(biomeIndex, kind, mods, enemyId) {
  const biome = BIOMES[biomeIndex];

  if (kind === 'boss') {
    const def = ENEMY_DEFS[enemyId || pick(biome.bosses)];
    return {
      def, kind,
      maxHp: Math.round(def.hp * mods.bossHp),
      strength: biome.bossBonus + mods.bossDmg + mods.enemyDmg,
    };
  }

  const base = ENEMY_DEFS[enemyId || pick(kind === 'elite' ? biome.elites : biome.normals)];
  const def = kind === 'elite' ? eliteOf(base) : base;
  return {
    def,
    kind,
    maxHp: Math.round(def.hp * biome.hpMult * mods.normalHp * (kind === 'elite' ? mods.eliteHp : 1)),
    strength: biome.dmgBonus + mods.enemyDmg,
  };
}
