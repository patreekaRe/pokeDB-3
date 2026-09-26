/* ============================================================
   enemies.js  -  the Pokémon you fight, and the three biomes.

   Each enemy has a "moves" list. On its turn it uses the next move in
   the list, then loops back to the start. The move it will use next is
   shown above its head (the "intent"), so you can plan your turn.

   Enemy attacks follow the same type chart as yours: an enemy's attacks
   use its own type, so a Fire enemy hits a Grass starter for extra damage and a
   Water starter for less (see SUPER_EFFECTIVE in cards.js). Neutral enemies are always x1.
   A move whose real type isn't Fire/Grass/Water (Body Slam, Bite, Acid...) sets
   `type: 'normal'` so it stays x1. Elites and bosses ignore the chart both ways.

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
      { kind: 'attack', name: 'Acid',   amount: 8, type: 'normal' },
      { kind: 'buff',   name: 'Growth', amount: 2 },
    ],
  },
  poliwag: {
    name: 'Poliwag', type: 'water', hp: 48, ...sprite('poliwag'),
    description: 'Splashes around in every puddle.',
    moves: [
      { kind: 'attack', name: 'Water Gun', amount: 6 },
      { kind: 'defend', name: 'Bubble',    amount: 7 },
      { kind: 'attack', name: 'Body Slam', amount: 9, type: 'normal' },
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
      { kind: 'attack', name: 'Bite',        amount: 6, type: 'normal' },
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
      { kind: 'attack', name: 'Vice Grip',  amount: 7, type: 'normal' },
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

  /* ----- the bases of the elites (they only appear as "Alpha" versions), 3 per biome ----- */
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
      { kind: 'attack', name: 'Body Slam', amount: 12, type: 'normal' },
    ],
  },
  flareon: {
    name: 'Flareon', type: 'fire', hp: 64, ...sprite('flareon'),
    description: 'Its fluffy collar holds in a furnace.',
    moves: [
      { kind: 'attack', name: 'Fire Fang',   amount: 8 },
      { kind: 'buff',   name: 'Work Up',     amount: 2 },
      { kind: 'attack', name: 'Flare Blitz', amount: 12 },
    ],
  },

  ninetales: {
    name: 'Ninetales', type: 'fire', hp: 68, ...sprite('ninetales'),
    description: 'Said to live a thousand years, and to curse whoever grabs a tail.',
    moves: [
      { kind: 'attack', name: 'Ember',        amount: 8 },
      { kind: 'buff',   name: 'Nasty Plot',   amount: 2 },
      { kind: 'attack', name: 'Flamethrower', amount: 12 },
    ],
  },
  shiftry: {
    name: 'Shiftry', type: 'grass', hp: 66, ...sprite('shiftry'),
    description: 'Its leaf fans whip up gales in the shrine woods.',
    moves: [
      { kind: 'attack', name: 'Faint Attack', amount: 7, type: 'normal' },
      { kind: 'buff',   name: 'Growth',       amount: 2 },
      { kind: 'attack', name: 'Leaf Storm',   amount: 12 },
    ],
  },
  slowking: {
    name: 'Slowking', type: 'water', hp: 72, ...sprite('slowking'),
    description: 'The Shellder on its head made it wise. Too wise.',
    moves: [
      { kind: 'attack', name: 'Water Pulse', amount: 7 },
      { kind: 'defend', name: 'Amnesia',     amount: 9 },
      { kind: 'attack', name: 'Surf',        amount: 11 },
    ],
  },
  houndoom: {
    name: 'Houndoom', type: 'fire', hp: 70, ...sprite('houndoom'),
    description: 'Its howl sends everything on the wastes running.',
    moves: [
      { kind: 'attack', name: 'Bite',         amount: 8, type: 'normal' },
      { kind: 'buff',   name: 'Nasty Plot',   amount: 2 },
      { kind: 'attack', name: 'Flamethrower', amount: 13 },
    ],
  },
  breloom: {
    name: 'Breloom', type: 'grass', hp: 68, ...sprite('breloom'),
    description: 'Its stretchy arms punch faster than you can see.',
    moves: [
      { kind: 'attack', name: 'Mach Punch',  amount: 7, type: 'normal' },
      { kind: 'drain',  name: 'Drain Punch', amount: 7, heal: 5, type: 'normal' },
      { kind: 'attack', name: 'Seed Bomb',   amount: 12 },
    ],
  },
  kingdra: {
    name: 'Kingdra', type: 'water', hp: 72, ...sprite('kingdra'),
    description: 'Sleeps deep under the lava lakes\' steaming springs.',
    moves: [
      { kind: 'attack', name: 'Water Pulse',  amount: 8 },
      { kind: 'buff',   name: 'Dragon Dance', amount: 2 },
      { kind: 'attack', name: 'Hydro Pump',   amount: 13 },
    ],
  },

  /* ----- bosses (fixed HP; the biome adds bonus damage via bossBonus) ----- */
  snorlax: {
    name: 'Snorlax', type: 'normal', hp: 170, ...sprite('snorlax'), boss: true,
    description: 'Blocks the path. Hits like a boulder when it wakes up.',
    moves: [
      { kind: 'attack', name: 'Body Slam',   amount: 11, type: 'normal' },
      { kind: 'defend', name: 'Rest',        amount: 14 },
      { kind: 'buff',   name: 'Belly Drum',  amount: 2 },
      { kind: 'attack', name: 'Giga Impact', amount: 16 },
    ],
  },
  arcanine: {
    name: 'Arcanine', type: 'fire', hp: 150, ...sprite('arcanine'), boss: true,
    description: 'Runs like a legend and bites like one too.',
    moves: [
      { kind: 'attack', name: 'Fire Fang',     amount: 10 },
      { kind: 'buff',   name: 'Howl',          amount: 2 },
      { kind: 'attack', name: 'Extreme Speed', amount: 12, type: 'normal' },
      { kind: 'attack', name: 'Flare Blitz',   amount: 17 },
    ],
  },
  poliwrath: {
    name: 'Poliwrath', type: 'water', hp: 175, ...sprite('poliwrath'), boss: true,
    description: 'Swims the pond by day and trains its fists by night.',
    moves: [
      { kind: 'attack', name: 'Bubble Beam',   amount: 10 },
      { kind: 'defend', name: 'Detect',        amount: 12 },
      { kind: 'buff',   name: 'Bulk Up',       amount: 2 },
      { kind: 'attack', name: 'Dynamic Punch', amount: 15, type: 'normal' },
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
  chandelure: {
    name: 'Chandelure', type: 'fire', hp: 230, ...sprite('chandelure'), boss: true,
    description: 'Its ghostly flames burn the spirit, not the body.',
    moves: [
      { kind: 'attack', name: 'Hex',        amount: 10, type: 'normal' },
      { kind: 'buff',   name: 'Calm Mind',  amount: 3 },
      { kind: 'drain',  name: 'Pain Split', amount: 10, heal: 8, type: 'normal' },
      { kind: 'attack', name: 'Overheat',   amount: 21 },
    ],
  },
  ursaring: {
    name: 'Ursaring', type: 'normal', hp: 260, ...sprite('ursaring'), boss: true,
    description: 'It guards the shrine\'s honey trees, and it does not share.',
    moves: [
      { kind: 'attack', name: 'Slash',        amount: 11 },
      { kind: 'defend', name: 'Rest',         amount: 12 },
      { kind: 'buff',   name: 'Swords Dance', amount: 2 },
      { kind: 'attack', name: 'Hammer Arm',   amount: 20 },
    ],
  },
  slaking: {
    name: 'Slaking', type: 'normal', hp: 440, ...sprite('slaking'), boss: true,
    description: 'Lazes about every other turn. The turns in between hurt.',
    moves: [
      { kind: 'attack', name: 'Hammer Arm',  amount: 16 },
      { kind: 'defend', name: 'Truant',      amount: 14 },
      { kind: 'attack', name: 'Giga Impact', amount: 24 },
      { kind: 'defend', name: 'Truant',      amount: 14 },
    ],
  },
  magmortar: {
    name: 'Magmortar', type: 'fire', hp: 400, ...sprite('magmortar'), boss: true,
    description: 'Fires fireballs from its arms, hot enough to melt the wastes.',
    moves: [
      { kind: 'attack', name: 'Flamethrower', amount: 12 },
      { kind: 'buff',   name: 'Sunny Day',    amount: 3 },
      { kind: 'attack', name: 'Thunderbolt',  amount: 14, type: 'normal' },
      { kind: 'attack', name: 'Fire Blast',   amount: 22 },
    ],
  },
  gyarados: {
    name: 'Gyarados', type: 'water', hp: 420, ...sprite('gyarados'), boss: true,
    description: 'Once it starts rampaging, it burns everything down.',
    moves: [
      { kind: 'attack', name: 'Bite',         amount: 11, type: 'normal' },
      { kind: 'buff',   name: 'Dragon Dance', amount: 2 },
      { kind: 'attack', name: 'Waterfall',    amount: 15 },
      { kind: 'attack', name: 'Hyper Beam',   amount: 22, type: 'normal' },
    ],
  },
  salamence: {
    name: 'Salamence', type: 'normal', hp: 420, ...sprite('salamence'), boss: true,
    description: 'The tyrant of the Ember Wastes. Beat it to finish the run.',
    moves: [
      { kind: 'attack', name: 'Bite',          amount: 11, type: 'normal' },
      { kind: 'buff',   name: 'Dragon Dance',  amount: 2 },
      { kind: 'attack', name: 'Dragon Claw',   amount: 15 },
      { kind: 'attack', name: 'Hyper Beam',    amount: 22 },
    ],
  },
};

/** Elite version of an enemy: bigger, meaner, with an extra move. */
export const ELITE = { hpMult: 1.6, rampage: 14 };

export function eliteOf(def) {
  return {
    ...def,
    name: `Alpha ${def.name}`,
    hp: Math.round(def.hp * ELITE.hpMult),
    elite: true,
    description: `A much bigger ${def.name}. Watch out for its Rampage.`,
    moves: [...def.moves, { kind: 'attack', name: 'Rampage', amount: ELITE.rampage }],
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
    id: 'clearing', name: 'Whispering Clearing',
    normals: ['rattata', 'pidgey', 'oddish', 'poliwag', 'vulpix'],
    elites: ['gloom', 'poliwhirl', 'flareon'], bosses: ['snorlax', 'arcanine', 'poliwrath'],
    hpMult: 1.2, dmgBonus: 4, bossBonus: 5,
  },
  {
    id: 'shrine', name: 'Overgrown Shrine',
    normals: ['zubat', 'geodude', 'growlithe', 'bellsprout', 'krabby'],
    elites: ['ninetales', 'shiftry', 'slowking'], bosses: ['chandelure', 'tangrowth', 'ursaring'],
    hpMult: 2.9, dmgBonus: 11, bossBonus: 16,
  },
  {
    id: 'wastes', name: 'Ember Wastes',
    normals: ['machop', 'ponyta', 'staryu', 'rhyhorn', 'tangela'],
    elites: ['houndoom', 'breloom', 'kingdra'], bosses: ['slaking', 'magmortar', 'gyarados', 'salamence'],
    hpMult: 5.2, dmgBonus: 22, bossBonus: 28,
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
