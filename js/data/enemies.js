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
     status    only puts junk into your deck (its `adds`)
   Any move can carry `adds: { card, n, to }`: status cards (Confusion, Paralysis, Poison, Sludge in
   cards.js) put into your 'draw' pile (shuffled in) or 'discard' pile (the default), for this fight.

   Numbers here are for the first biome. Later biomes multiply HP and
   add damage (see BIOMES at the bottom). Tweak them to balance the game!
   ============================================================ */

import { random, pickOne } from '../rng.js';
import { SAFARI_MONS, safariMonDef, PLACE } from './safari-mons.js';

/** Pixel sprite from assets/pokemon/ (Gen 5 art from PokeAPI/sprites). */
const sprite = (name) => ({ image: `assets/pokemon/${name}-front.gif`, art: false, spriteId: name });

export const ENEMY_DEFS = {
  /* ----- Biome 1: the clearing's meadow and pond, baby forms ----- */
  vulpix: {
    name: 'Vulpix', type: 'fire', hp: 45, ...sprite('vulpix'),
    description: 'Six tails, each one warm.',
    moves: [
      { kind: 'attack', name: 'Ember',        amount: 6 },
      { kind: 'buff',   name: 'Will-O-Wisp',  amount: 2 },
      { kind: 'attack', name: 'Flamethrower', amount: 10 },
    ],
  },
  growlithe: {
    name: 'Growlithe', type: 'fire', hp: 46, ...sprite('growlithe'),
    description: 'Loyal, loud and very warm.',
    moves: [
      { kind: 'attack', name: 'Bite',        amount: 5, type: 'normal' },
      { kind: 'buff',   name: 'Howl',        amount: 1 },
      { kind: 'attack', name: 'Flame Wheel', amount: 10 },
    ],
  },
  pansear: {
    name: 'Pansear', type: 'fire', hp: 44, ...sprite('pansear'),
    description: 'Roasts the berries it finds. And anything else.',
    moves: [
      { kind: 'attack', name: 'Scratch',     amount: 5, type: 'normal' },
      { kind: 'attack', name: 'Incinerate',  amount: 7 },
      { kind: 'attack', name: 'Flame Burst', amount: 9 },
    ],
  },
  oddish: {
    name: 'Oddish', type: 'grass', hp: 45, ...sprite('oddish'),
    description: 'Soaks up sunlight and your health.',
    moves: [
      { kind: 'drain',  name: 'Absorb', amount: 5, heal: 4 },
      { kind: 'attack', name: 'Acid',   amount: 8, type: 'normal', adds: { card: 'poison', n: 1 } },
      { kind: 'buff',   name: 'Growth', amount: 2 },
    ],
  },
  hoppip: {
    name: 'Hoppip', type: 'grass', hp: 40, ...sprite('hoppip'),
    description: 'So light the meadow breeze carries it off.',
    moves: [
      { kind: 'attack', name: 'Bullet Seed', amount: 6 },
      { kind: 'defend', name: 'Synthesis',   amount: 7 },
      { kind: 'attack', name: 'Acrobatics',  amount: 9, type: 'normal' },
    ],
  },
  seedot: {
    name: 'Seedot', type: 'grass', hp: 42, ...sprite('seedot'),
    description: 'Hangs from a branch looking exactly like an acorn.',
    moves: [
      { kind: 'defend', name: 'Harden',      amount: 7 },
      { kind: 'attack', name: 'Bullet Seed', amount: 6 },
      { kind: 'attack', name: 'Seed Bomb',   amount: 9 },
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
  psyduck: {
    name: 'Psyduck', type: 'water', hp: 46, ...sprite('psyduck'),
    description: 'Its headache gets worse. So does its aim.',
    moves: [
      { kind: 'attack', name: 'Water Gun', amount: 6 },
      { kind: 'defend', name: 'Amnesia',   amount: 7 },
      { kind: 'attack', name: 'Confusion', amount: 10, type: 'normal', adds: { card: 'confusion', n: 1, to: 'draw' } },
    ],
  },
  marill: {
    name: 'Marill', type: 'water', hp: 48, ...sprite('marill'),
    description: 'Its tail floats on the pond like a buoy.',
    moves: [
      { kind: 'defend', name: 'Defense Curl', amount: 6 },
      { kind: 'attack', name: 'Rollout',      amount: 7, type: 'normal' },
      { kind: 'attack', name: 'Aqua Tail',    amount: 9 },
    ],
  },
  rattata: {
    name: 'Rattata', type: 'normal', hp: 40, ...sprite('rattata'),
    description: 'Small, quick and everywhere.',
    moves: [
      { kind: 'attack', name: 'Tackle',       amount: 6 },
      { kind: 'attack', name: 'Quick Attack', amount: 5 },
      { kind: 'attack', name: 'Hyper Fang',   amount: 9 },
    ],
  },
  sentret: {
    name: 'Sentret', type: 'normal', hp: 42, ...sprite('sentret'),
    description: 'Stands on its tail to keep watch over the meadow.',
    moves: [
      { kind: 'attack', name: 'Scratch',      amount: 6 },
      { kind: 'defend', name: 'Defense Curl', amount: 6 },
      { kind: 'attack', name: 'Fury Swipes',  amount: 9 },
    ],
  },
  zigzagoon: {
    name: 'Zigzagoon', type: 'normal', hp: 44, ...sprite('zigzagoon'),
    description: 'Zigzags through the grass, sniffing out trouble.',
    moves: [
      { kind: 'attack', name: 'Tackle',    amount: 6 },
      { kind: 'buff',   name: 'Tail Whip', amount: 2 },
      { kind: 'attack', name: 'Headbutt',  amount: 9 },
    ],
  },

  /* ----- Biome 2: the shrine's spirits and folklore ----- */
  litwick: {
    name: 'Litwick', type: 'fire', hp: 50, ...sprite('litwick'),
    description: 'A candle that lights the way, and burns your life force as fuel.',
    moves: [
      { kind: 'attack', name: 'Ember',      amount: 7 },
      { kind: 'drain',  name: 'Pain Split', amount: 6, heal: 5, type: 'normal' },
      { kind: 'attack', name: 'Fire Spin',  amount: 11 },
    ],
  },
  houndour: {
    name: 'Houndour', type: 'fire', hp: 52, ...sprite('houndour'),
    description: 'Hunts the shrine grounds in packs, calling out to each other.',
    moves: [
      { kind: 'attack', name: 'Bite',      amount: 7, type: 'normal' },
      { kind: 'buff',   name: 'Howl',      amount: 1 },
      { kind: 'attack', name: 'Fire Fang', amount: 11 },
    ],
  },
  darumaka: {
    name: 'Darumaka', type: 'fire', hp: 56, ...sprite('darumaka'),
    description: 'Tumbles about like a lucky charm with a furnace inside.',
    moves: [
      { kind: 'attack', name: 'Headbutt',   amount: 7, type: 'normal' },
      { kind: 'buff',   name: 'Work Up',    amount: 2 },
      { kind: 'attack', name: 'Fire Punch', amount: 12 },
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
  paras: {
    name: 'Paras', type: 'grass', hp: 50, ...sprite('paras'),
    description: 'The mushrooms on its back grow from the shrine\'s old roots.',
    moves: [
      { kind: 'attack', name: 'Scratch',    amount: 6, type: 'normal' },
      { kind: 'drain',  name: 'Giga Drain', amount: 6, heal: 5 },
      { kind: 'attack', name: 'X-Scissor',  amount: 11, type: 'normal' },
    ],
  },
  cherubi: {
    name: 'Cherubi', type: 'grass', hp: 48, ...sprite('cherubi'),
    description: 'Left as an offering, it took root and never left.',
    moves: [
      { kind: 'attack', name: 'Magical Leaf', amount: 7 },
      { kind: 'buff',   name: 'Sunny Day',    amount: 2 },
      { kind: 'attack', name: 'Seed Bomb',    amount: 11 },
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
  slowpoke: {
    name: 'Slowpoke', type: 'water', hp: 60, ...sprite('slowpoke'),
    description: 'Dozes by the shrine\'s well. Some say it brings the rain.',
    moves: [
      { kind: 'attack', name: 'Water Gun',    amount: 7 },
      { kind: 'defend', name: 'Slack Off',    amount: 9 },
      { kind: 'attack', name: 'Zen Headbutt', amount: 11, type: 'normal', adds: { card: 'confusion', n: 2, to: 'draw' } },
    ],
  },
  shellos: {
    name: 'Shellos', type: 'water', hp: 55, ...sprite('shellos'),
    description: 'Oozes out of the shrine\'s old stone basins.',
    moves: [
      { kind: 'attack', name: 'Water Pulse',  amount: 7 },
      { kind: 'defend', name: 'Recover',      amount: 8 },
      { kind: 'attack', name: 'Muddy Water',  amount: 11, adds: { card: 'sludge', n: 1 } },
    ],
  },
  teddiursa: {
    name: 'Teddiursa', type: 'normal', hp: 52, ...sprite('teddiursa'),
    description: 'Licks honey off its paws. Cute until you get between it and the honey.',
    moves: [
      { kind: 'attack', name: 'Fury Swipes', amount: 6 },
      { kind: 'defend', name: 'Charm',       amount: 8 },
      { kind: 'attack', name: 'Slash',       amount: 11 },
    ],
  },
  aipom: {
    name: 'Aipom', type: 'normal', hp: 48, ...sprite('aipom'),
    description: 'Steals the shrine\'s offerings with its hand of a tail.',
    moves: [
      { kind: 'attack', name: 'Swift',      amount: 6 },
      { kind: 'buff',   name: 'Nasty Plot', amount: 2 },
      { kind: 'attack', name: 'Double Hit', amount: 11 },
    ],
  },
  stantler: {
    name: 'Stantler', type: 'normal', hp: 58, ...sprite('stantler'),
    description: 'Its antlers bend the air, so the path ahead never looks quite right.',
    moves: [
      { kind: 'attack', name: 'Stomp',     amount: 7, adds: { card: 'paralysis', n: 1, to: 'draw' } },
      { kind: 'buff',   name: 'Calm Mind', amount: 1 },
      { kind: 'attack', name: 'Take Down', amount: 12 },
    ],
  },

  /* ----- Biome 3: the wastes, fully evolved ----- */
  magmar: {
    name: 'Magmar', type: 'fire', hp: 64, ...sprite('magmar'),
    description: 'Born in the lava, it breathes out heat haze.',
    moves: [
      { kind: 'attack', name: 'Fire Punch',   amount: 8 },
      { kind: 'defend', name: 'Smokescreen',  amount: 9 },
      { kind: 'attack', name: 'Flamethrower', amount: 12 },
    ],
  },
  torkoal: {
    name: 'Torkoal', type: 'fire', hp: 70, ...sprite('torkoal'),
    description: 'Burns coal in its shell and puffs black smoke from its nose.',
    moves: [
      { kind: 'attack', name: 'Flame Wheel',  amount: 8 },
      { kind: 'defend', name: 'Iron Defense', amount: 10 },
      { kind: 'attack', name: 'Lava Plume',   amount: 12 },
    ],
  },
  heatmor: {
    name: 'Heatmor', type: 'fire', hp: 64, ...sprite('heatmor'),
    description: 'Breathes fire through its snout to melt its way into anthills.',
    moves: [
      { kind: 'attack', name: 'Incinerate', amount: 8 },
      { kind: 'buff',   name: 'Hone Claws', amount: 2 },
      { kind: 'attack', name: 'Inferno',    amount: 13 },
    ],
  },
  tangela: {
    name: 'Tangela', type: 'grass', hp: 62, ...sprite('tangela'),
    description: 'A tangle of vines with something inside.',
    moves: [
      { kind: 'drain',  name: 'Mega Drain', amount: 6, heal: 6 },
      { kind: 'attack', name: 'Constrict',  amount: 6, type: 'normal', adds: { card: 'sludge', n: 2 } },
      { kind: 'attack', name: 'Power Whip', amount: 12 },
    ],
  },
  cacturne: {
    name: 'Cacturne', type: 'grass', hp: 64, ...sprite('cacturne'),
    description: 'Stands still all day in the heat, then follows travellers at night.',
    moves: [
      { kind: 'attack', name: 'Needle Arm',   amount: 8 },
      { kind: 'buff',   name: 'Swords Dance', amount: 2 },
      { kind: 'attack', name: 'Energy Ball',  amount: 12 },
    ],
  },
  maractus: {
    name: 'Maractus', type: 'grass', hp: 62, ...sprite('maractus'),
    description: 'Dances to a rhythm only it hears. The needles fly anyway.',
    moves: [
      { kind: 'drain',  name: 'Giga Drain',   amount: 7, heal: 6 },
      { kind: 'defend', name: 'Cotton Guard', amount: 10 },
      { kind: 'attack', name: 'Petal Dance',  amount: 13 },
    ],
  },
  staryu: {
    name: 'Staryu', type: 'water', hp: 60, ...sprite('staryu'),
    description: 'Spins out of the hot springs.',
    moves: [
      { kind: 'attack', name: 'Water Gun',   amount: 7 },
      { kind: 'defend', name: 'Harden',      amount: 8 },
      { kind: 'attack', name: 'Bubble Beam', amount: 12 },
    ],
  },
  crawdaunt: {
    name: 'Crawdaunt', type: 'water', hp: 66, ...sprite('crawdaunt'),
    description: 'Picks fights with anything that comes near its steaming pool.',
    moves: [
      { kind: 'attack', name: 'Night Slash', amount: 8, type: 'normal' },
      { kind: 'defend', name: 'Harden',      amount: 9 },
      { kind: 'attack', name: 'Crabhammer',  amount: 13 },
    ],
  },
  sharpedo: {
    name: 'Sharpedo', type: 'water', hp: 62, ...sprite('sharpedo'),
    description: 'Its fangs can tear through iron. Or through you.',
    moves: [
      { kind: 'attack', name: 'Crunch',    amount: 8, type: 'normal' },
      { kind: 'buff',   name: 'Agility',   amount: 2 },
      { kind: 'attack', name: 'Waterfall', amount: 13 },
    ],
  },
  tauros: {
    name: 'Tauros', type: 'normal', hp: 68, ...sprite('tauros'),
    description: 'Whips itself with its tails, then charges at anything.',
    moves: [
      { kind: 'attack', name: 'Body Slam',   amount: 8, adds: { card: 'paralysis', n: 1, to: 'draw' } },
      { kind: 'buff',   name: 'Rage',        amount: 2 },
      { kind: 'attack', name: 'Thrash',      amount: 13 },
    ],
  },
  bouffalant: {
    name: 'Bouffalant', type: 'normal', hp: 72, ...sprite('bouffalant'),
    description: 'Its huge afro softens any blow, and not one of its own.',
    moves: [
      { kind: 'attack', name: 'Fury Attack', amount: 8 },
      { kind: 'defend', name: 'Endure',      amount: 10 },
      { kind: 'attack', name: 'Head Charge', amount: 13 },
    ],
  },
  zangoose: {
    name: 'Zangoose', type: 'normal', hp: 64, ...sprite('zangoose'),
    description: 'Sharpens its claws on the volcanic rock, waiting for a rival.',
    moves: [
      { kind: 'attack', name: 'Slash',        amount: 8 },
      { kind: 'buff',   name: 'Swords Dance', amount: 3 },
      { kind: 'attack', name: 'Crush Claw',   amount: 13 },
    ],
  },

  /* ----- Biome 4: the Crystal Depths, Mewtwo's own (v1.0). Shown as Neutral or Psychic whatever their real types:
     Mewtwo is neutral to every type. Built to test a strong deck: shields, scaling, and a `trait` that answers what you
     play (TRAITS below). ----- */
  crobat: {
    name: 'Crobat', type: 'normal', hp: 66, ...sprite('crobat'),
    description: 'Four wings and no sound at all. You feel the bite before you see it.',
    moves: [
      { kind: 'attack', name: 'Cross Poison', amount: 8, adds: { card: 'poison', n: 1 } },
      { kind: 'buff',   name: 'Agility',      amount: 3 },
      { kind: 'drain',  name: 'Leech Life',   amount: 10, heal: 8 },
    ],
  },
  sableye: {
    name: 'Sableye', type: 'normal', hp: 62, ...sprite('sableye'),
    description: 'Eats the crystals off the walls, and its eyes became gems.',
    moves: [
      { kind: 'status', name: 'Confuse Ray', adds: { card: 'confusion', n: 2, to: 'draw' } },
      { kind: 'attack', name: 'Shadow Claw', amount: 10 },
      { kind: 'buff',   name: 'Nasty Plot',  amount: 3 },
      { kind: 'attack', name: 'Power Gem',   amount: 13 },
    ],
  },
  gigalith: {
    name: 'Gigalith', type: 'normal', hp: 78, ...sprite('gigalith'),
    trait: { id: 'stamina', name: 'Sturdy', after: 4, amount: 6 },
    description: 'Soaks up the cave\'s energy in its crystals, and fires it all at once.',
    moves: [
      { kind: 'defend', name: 'Iron Defense', amount: 14 },
      { kind: 'attack', name: 'Rock Blast',   amount: 9 },
      { kind: 'attack', name: 'Solar Beam',   amount: 15, type: 'normal' },
    ],
  },
  steelix: {
    name: 'Steelix', type: 'normal', hp: 80, ...sprite('steelix'),
    trait: { id: 'barbs', name: 'Iron Barbs', amount: 3 },
    description: 'Tunnels through the crystal rock. Hitting it hurts your hands.',
    moves: [
      { kind: 'attack', name: 'Iron Tail', amount: 10 },
      { kind: 'defend', name: 'Harden',    amount: 12 },
      { kind: 'attack', name: 'Crunch',    amount: 13 },
    ],
  },
  excadrill: {
    name: 'Excadrill', type: 'normal', hp: 70, ...sprite('excadrill'),
    trait: { id: 'barbs', name: 'Rough Skin', amount: 2 },
    description: 'Drills through the cave floor faster than a train runs.',
    moves: [
      { kind: 'buff',   name: 'Hone Claws', amount: 3 },
      { kind: 'attack', name: 'Metal Claw', amount: 9 },
      { kind: 'attack', name: 'Drill Run',  amount: 14 },
    ],
  },
  haxorus: {
    name: 'Haxorus', type: 'normal', hp: 72, ...sprite('haxorus'),
    description: 'Its tusks cut through steel. It sharpens them on the crystals.',
    moves: [
      { kind: 'buff',   name: 'Dragon Dance', amount: 4 },
      { kind: 'attack', name: 'Dragon Claw',  amount: 10 },
      { kind: 'attack', name: 'Outrage',      amount: 16 },
    ],
  },
  golurk: {
    name: 'Golurk', type: 'normal', hp: 82, ...sprite('golurk'),
    trait: { id: 'stamina', name: 'No Guard', after: 4, amount: 5 },
    description: 'An ancient guardian of clay, still walking the halls it was made to watch.',
    moves: [
      { kind: 'attack', name: 'Shadow Punch', amount: 10 },
      { kind: 'defend', name: 'Iron Defense', amount: 12 },
      { kind: 'attack', name: 'Hammer Arm',   amount: 15 },
    ],
  },
  bronzong: {
    name: 'Bronzong', type: 'psychic', hp: 76, ...sprite('bronzong'),
    description: 'Rings once, deep in the cave, and the crystals answer.',
    moves: [
      { kind: 'defend', name: 'Iron Defense', amount: 13 },
      { kind: 'buff',   name: 'Calm Mind',    amount: 3 },
      { kind: 'attack', name: 'Extrasensory', amount: 12 },
    ],
  },
  claydol: {
    name: 'Claydol', type: 'psychic', hp: 70, ...sprite('claydol'),
    trait: { id: 'analytic', name: 'Levitate', amount: 3 },
    description: 'Floats in the dark, studying whatever comes near with all its eyes.',
    moves: [
      { kind: 'attack', name: 'Psybeam',     amount: 9, adds: { card: 'confusion', n: 1, to: 'draw' } },
      { kind: 'defend', name: 'Cosmic Power', amount: 12 },
      { kind: 'attack', name: 'Earth Power', amount: 14 },
    ],
  },
  dusknoir: {
    name: 'Dusknoir', type: 'normal', hp: 74, ...sprite('dusknoir'),
    description: 'Comes up out of the deepest cracks to lead lost things away.',
    moves: [
      { kind: 'status', name: 'Curse',        adds: { card: 'sludge', n: 2, to: 'draw' } },
      { kind: 'drain',  name: 'Shadow Sneak', amount: 9, heal: 8 },
      { kind: 'attack', name: 'Shadow Punch', amount: 14 },
    ],
  },
  lanturn: {
    name: 'Lanturn', type: 'normal', hp: 72, ...sprite('lanturn'),
    description: 'Lights the underground lakes. Swim towards it and the light bites.',
    moves: [
      { kind: 'attack', name: 'Spark',       amount: 9, adds: { card: 'paralysis', n: 1, to: 'draw' } },
      { kind: 'drain',  name: 'Aqua Ring',   amount: 6, heal: 12 },
      { kind: 'attack', name: 'Thunderbolt', amount: 14 },
    ],
  },
  magnezone: {
    name: 'Magnezone', type: 'normal', hp: 74, ...sprite('magnezone'),
    trait: { id: 'analytic', name: 'Analytic', amount: 4 },
    description: 'Drawn to the depths by the strange energy pulsing below.',
    moves: [
      { kind: 'defend', name: 'Magnet Rise',   amount: 12 },
      { kind: 'attack', name: 'Flash Cannon',  amount: 11 },
      { kind: 'attack', name: 'Zap Cannon',    amount: 15, adds: { card: 'paralysis', n: 1, to: 'draw' } },
    ],
  },

  /* ----- the bases of the elites (they only appear as "Alpha" versions), 3 per biome ----- */
  /* Elites and bosses are all pure Normal: they fight as Neutral, and a Gloom that isn't weak to Fire looked like a bug. */
  raticate: {
    name: 'Raticate', type: 'normal', hp: 60, ...sprite('raticate'),
    description: 'Its fangs never stop growing, so it gnaws on everything.',
    moves: [
      { kind: 'drain',  name: 'Super Fang', amount: 6, heal: 3 },
      { kind: 'status', name: 'Toxic',      adds: { card: 'poison', n: 1, to: 'draw' } },
      { kind: 'attack', name: 'Hyper Fang', amount: 11 },
    ],
  },
  furret: {
    name: 'Furret', type: 'normal', hp: 65, ...sprite('furret'),
    description: 'So long and thin it slips down any burrow in the meadow.',
    moves: [
      { kind: 'attack', name: 'Quick Attack', amount: 7 },
      { kind: 'defend', name: 'Defense Curl', amount: 8 },
      { kind: 'attack', name: 'Body Slam',    amount: 12 },
    ],
  },
  linoone: {
    name: 'Linoone', type: 'normal', hp: 64, ...sprite('linoone'),
    description: 'Charges in dead straight lines, and never swerves.',
    moves: [
      { kind: 'attack', name: 'Headbutt',    amount: 8 },
      { kind: 'buff',   name: 'Work Up',     amount: 2 },
      { kind: 'attack', name: 'Double-Edge', amount: 10 },
    ],
  },

  ambipom: {
    name: 'Ambipom', type: 'normal', hp: 68, ...sprite('ambipom'),
    description: 'Swings through the shrine\'s trees on its two tails.',
    moves: [
      { kind: 'attack', name: 'Double Hit',  amount: 8 },
      { kind: 'buff',   name: 'Nasty Plot',  amount: 2 },
      { kind: 'attack', name: 'Last Resort', amount: 12 },
    ],
  },
  persian: {
    name: 'Persian', type: 'normal', hp: 66, ...sprite('persian'),
    description: 'Prowls the shrine at night, the jewel on its brow gleaming.',
    moves: [
      { kind: 'attack', name: 'Faint Attack', amount: 7 },
      { kind: 'buff',   name: 'Nasty Plot',   amount: 2 },
      { kind: 'attack', name: 'Slash',        amount: 12 },
    ],
  },
  watchog: {
    name: 'Watchog', type: 'normal', hp: 72, ...sprite('watchog'),
    description: 'Keeps watch over the shrine. Its glowing eyes dizzy intruders.',
    moves: [
      { kind: 'attack', name: 'Confuse Ray', amount: 7, adds: { card: 'confusion', n: 2, to: 'draw' } },
      { kind: 'defend', name: 'Amnesia',     amount: 9 },
      { kind: 'attack', name: 'Crunch',      amount: 11 },
    ],
  },
  purugly: {
    name: 'Purugly', type: 'normal', hp: 70, ...sprite('purugly'),
    description: 'Squats in other Pokémon\'s dens on the wastes and dares them to argue.',
    moves: [
      { kind: 'attack', name: 'Bite',       amount: 8 },
      { kind: 'buff',   name: 'Nasty Plot', amount: 2 },
      { kind: 'attack', name: 'Slam',       amount: 13 },
    ],
  },
  cinccino: {
    name: 'Cinccino', type: 'normal', hp: 68, ...sprite('cinccino'),
    description: 'Its coat shrugs off ash, and its tail slaps faster than you can see.',
    moves: [
      { kind: 'attack', name: 'Double Slap', amount: 7 },
      { kind: 'drain',  name: 'Covet',       amount: 7, heal: 5 },
      { kind: 'attack', name: 'Tail Slap',   amount: 12 },
    ],
  },
  lopunny: {
    name: 'Lopunny', type: 'normal', hp: 72, ...sprite('lopunny'),
    description: 'Leaps clean over the lava rivers, and kicks on landing.',
    moves: [
      { kind: 'attack', name: 'Dizzy Punch', amount: 8 },
      { kind: 'buff',   name: 'Agility',     amount: 2 },
      { kind: 'attack', name: 'Return',      amount: 13 },
    ],
  },

  clefable: {
    name: 'Clefable', type: 'normal', hp: 80, ...sprite('clefable'),
    trait: { id: 'stamina', name: 'Magic Guard', after: 4, amount: 7 },
    description: 'Dances under the moonstones in the deepest cave, and hates being watched.',
    moves: [
      { kind: 'defend', name: 'Cosmic Power', amount: 14 },
      { kind: 'drain',  name: 'Moonlight',    amount: 9, heal: 12 },
      { kind: 'buff',   name: 'Calm Mind',    amount: 4 },
      { kind: 'attack', name: 'Metronome',    amount: 17 },
    ],
  },
  ditto: {
    name: 'Ditto', type: 'normal', hp: 74, ...sprite('ditto'),
    trait: { id: 'analytic', name: 'Imposter', amount: 5 },
    description: 'It turns into you. Every trick you learn, it learns too.',
    moves: [
      { kind: 'buff',   name: 'Transform', amount: 5 },
      { kind: 'attack', name: 'Pound',     amount: 11 },
      { kind: 'attack', name: 'Struggle',  amount: 15 },
    ],
  },
  smeargle: {
    name: 'Smeargle', type: 'normal', hp: 76, ...sprite('smeargle'),
    trait: { id: 'barbs', name: 'Own Tempo', amount: 3 },
    description: 'Paints the cave walls with its tail. Its signature move copies yours.',
    moves: [
      { kind: 'status', name: 'Spore',  adds: { card: 'paralysis', n: 2, to: 'draw' } },
      { kind: 'attack', name: 'Sketch', amount: 12 },
      { kind: 'buff',   name: 'Spore Dance', amount: 3 },
      { kind: 'attack', name: 'Explosion', amount: 18 },
    ],
  },

  /* ----- bosses (fixed HP; the biome adds bonus damage via bossBonus) ----- */
  snorlax: {
    name: 'Snorlax', type: 'normal', hp: 170, ...sprite('snorlax'), boss: true,
    description: 'Blocks the path. Hits like a boulder when it wakes up.',
    moves: [
      { kind: 'attack', name: 'Body Slam',   amount: 11, type: 'normal', adds: { card: 'paralysis', n: 1, to: 'draw' } },
      { kind: 'defend', name: 'Rest',        amount: 14 },
      { kind: 'buff',   name: 'Belly Drum',  amount: 2 },
      { kind: 'attack', name: 'Giga Impact', amount: 16 },
    ],
  },
  kangaskhan: {
    name: 'Kangaskhan', type: 'normal', hp: 150, ...sprite('kangaskhan'), boss: true,
    description: 'Nothing gets near the baby in its pouch.',
    moves: [
      { kind: 'attack', name: 'Mega Punch',    amount: 9 },
      { kind: 'buff',   name: 'Howl',          amount: 2 },
      { kind: 'attack', name: 'Extreme Speed', amount: 12 },
      { kind: 'attack', name: 'Mega Kick',     amount: 13 },
    ],
  },
  miltank: {
    name: 'Miltank', type: 'normal', hp: 175, ...sprite('miltank'), boss: true,
    description: 'Rolls across the meadow and flattens whatever it meets.',
    moves: [
      { kind: 'attack', name: 'Rollout',       amount: 10 },
      { kind: 'defend', name: 'Defense Curl',  amount: 12 },
      { kind: 'buff',   name: 'Bulk Up',       amount: 2 },
      { kind: 'attack', name: 'Dynamic Punch', amount: 15 },
    ],
  },
  exploud: {
    name: 'Exploud', type: 'normal', hp: 250, ...sprite('exploud'), boss: true,
    description: 'Its roar shakes the leaves off every tree round the shrine.',
    moves: [
      { kind: 'attack', name: 'Uproar',      amount: 11 },
      { kind: 'drain',  name: 'Bite',        amount: 10, heal: 6 },
      { kind: 'status', name: 'Screech',     adds: { card: 'paralysis', n: 2, to: 'draw' } },
      { kind: 'attack', name: 'Hyper Voice', amount: 22 },
    ],
  },
  stoutland: {
    name: 'Stoutland', type: 'normal', hp: 230, ...sprite('stoutland'), boss: true,
    description: 'An old guard dog of the shrine. Its cape of fur is thick as armour.',
    moves: [
      { kind: 'attack', name: 'Take Down',  amount: 10 },
      { kind: 'buff',   name: 'Work Up',    amount: 3 },
      { kind: 'drain',  name: 'Retaliate',  amount: 10, heal: 8 },
      { kind: 'attack', name: 'Giga Impact', amount: 21 },
    ],
  },
  ursaring: {
    name: 'Ursaring', type: 'normal', hp: 260, ...sprite('ursaring'), boss: true,
    description: 'It guards the shrine\'s honey trees, and it does not share.',
    moves: [
      { kind: 'attack', name: 'Slash',        amount: 11 },
      { kind: 'defend', name: 'Rest',         amount: 12 },
      { kind: 'buff',   name: 'Swords Dance', amount: 2 },
      { kind: 'attack', name: 'Hammer Arm',   amount: 22 },
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
  regigigas: {
    name: 'Regigigas', type: 'normal', hp: 400, ...sprite('regigigas'), boss: true,
    description: 'Slow to wake, but it once towed the continents into place.',
    moves: [
      { kind: 'attack', name: 'Knock Off',  amount: 12 },
      { kind: 'buff',   name: 'Slow Start', amount: 3 },
      { kind: 'attack', name: 'Payback',    amount: 14 },
      { kind: 'attack', name: 'Crush Grip', amount: 22 },
    ],
  },
  lickilicky: {
    name: 'Lickilicky', type: 'normal', hp: 420, ...sprite('lickilicky'), boss: true,
    description: 'Its tongue can reach across a lava lake. Don\'t let it.',
    moves: [
      { kind: 'attack', name: 'Wrap',         amount: 11 },
      { kind: 'buff',   name: 'Swords Dance', amount: 2 },
      { kind: 'attack', name: 'Wring Out',    amount: 15 },
      { kind: 'attack', name: 'Hyper Beam',   amount: 20 },
    ],
  },
  porygonz: {
    name: 'Porygon-Z', type: 'normal', hp: 420, ...sprite('porygonz'), boss: true,
    description: 'A glitch in the Ember Wastes. Beat it to finish the run.',
    moves: [
      { kind: 'attack', name: 'Psybeam',    amount: 11 },
      { kind: 'buff',   name: 'Nasty Plot', amount: 2 },
      { kind: 'attack', name: 'Tri Attack', amount: 15 },
      { kind: 'attack', name: 'Hyper Beam', amount: 20 },
    ],
  },

  /* the final boss: "the last energy". Its set piece (phases, Eternamax, its own music) is v1.0 part C. */
  eternatus: {
    name: 'Eternatus', type: 'normal', hp: 800, ...sprite('eternatus'), boss: true,
    trait: { id: 'stamina', name: 'Pressure', after: 4, amount: 8 },
    description: 'The energy at the bottom of everything. It has been waiting a very long time.',
    moves: [
      { kind: 'attack', name: 'Dynamax Cannon', amount: 14 },
      { kind: 'defend', name: 'Cosmic Power',   amount: 22 },
      { kind: 'status', name: 'Toxic',          adds: { card: 'poison', n: 2, to: 'draw' } },
      { kind: 'buff',   name: 'Dragon Dance',   amount: 4 },
      { kind: 'attack', name: 'Eternabeam',     amount: 26 },
    ],
  },

  /* ----- the Safari Zone's rare spawns (SAFARI_AREAS' `rares` in safari.js): only ever met there ----- */
  chansey: {
    name: 'Chansey', type: 'normal', hp: 70, ...sprite('chansey'), safari: true,
    description: 'Shy, lucky, and gone before you know it.',
    moves: [
      { kind: 'attack', name: 'Pound',       amount: 6 },
      { kind: 'defend', name: 'Soft-Boiled', amount: 10 },
      { kind: 'attack', name: 'Double-Edge', amount: 11 },
    ],
  },
  kecleon: {
    name: 'Kecleon', type: 'normal', hp: 62, ...sprite('kecleon'), safari: true,
    description: 'You only spot it when it wants you to.',
    moves: [
      { kind: 'attack', name: 'Shadow Sneak', amount: 6 },
      { kind: 'defend', name: 'Camouflage',   amount: 9 },
      { kind: 'attack', name: 'Feint Attack', amount: 10 },
    ],
  },
};

// the Safari Zone's own Pokémon, one data line each on a role template (js/data/safari-mons.js)
for (const m of SAFARI_MONS) ENEMY_DEFS[m.id] = safariMonDef(m);

/* Chad Master Kenmatta, the Move Tutor, fought in person from his dojo (the Move Tutor event's Challenge). Not in
   ENEMY_DEFS, so he never joins the Pokédex. A boss fight in any biome: `hp` is per biome, and the biome's bossBonus
   adds to his attacks like any boss. Winning gives his Mata-Mindset (the `unique` relic `exp-share` in relics.js). */
export const KEN = {
  id: 'ken', name: 'Chad Master Kenmatta', type: 'normal', hp: [130, 220, 370, 560], boss: true,
  image: 'assets/trainers/alder.png', art: false, arena: 'kombat',   // his own stage (PLACE_ART.kombat in js/scene.js)
  aura: true,   // goes Super Saiyan 2 below half HP (js/aura.js; the user's joke)
  music: 'kombat',   // his own theme, the user's (an 8-bit Mortal Kombat theme), in place of the boss music
  description: 'The Move Tutor. He teaches by hitting you.',
  prelude: 'Kenmatta cracks his neck. "Try not to cry, bro."',
  intro: 'Chad Master Kenmatta wants to battle!',
  // what he says mid-fight, like a Gen 5 gym leader (checkTaunts() in battle.js): below half HP, below a fifth, and if you faint
  taunts: {
    half: '"Bro, that was a warm-up. I\'m literally not even sweating."',
    low: '"Okay, okay, you got some moves... for a beta."',
    win: '"Skill issue. Come back when you\'ve hit the gym."',
  },
  moves: [
    { kind: 'attack', name: 'Mata Chop',    amount: 9 },
    { kind: 'buff',   name: 'Mata-Manspread', amount: 2 },
    { kind: 'attack', name: 'Kraber Crush', amount: 12 },
    { kind: 'defend', name: 'FORTIFY YOUR MIND', amount: 14, sound: 'fortify' },   // Wong's shout, the user's
    { kind: 'attack', name: 'TEST YOUR MIGHT', amount: 18, say: 'TEST YOUR MIGHT!' },   // `say`: he yells it before the move
  ],
};

export function buildKenEncounter(biomeIndex, mods) {
  const biome = BIOMES[biomeIndex];
  return {
    def: KEN, kind: 'boss',
    maxHp: Math.round(KEN.hp[biomeIndex] * mods.bossHp),
    strength: biome.bossBonus + mods.bossDmg + mods.enemyDmg,
  };
}

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
    stages: ['Meadow', 'Forest Edge', 'Deep Woods', 'Ancient Tree'],   // floors 1-3, 4-6, 7-10, the boss (stageOf() in js/map.js, painted by js/scene.js)
    normals: ['vulpix', 'growlithe', 'pansear', 'oddish', 'hoppip', 'seedot',
      'poliwag', 'psyduck', 'marill', 'rattata', 'sentret', 'zigzagoon'],
    elites: ['raticate', 'furret', 'linoone'], bosses: ['snorlax', 'kangaskhan', 'miltank'],
    hpMult: 1.2, dmgBonus: 7, bossBonus: 8,
  },
  {
    id: 'shrine', name: 'Overgrown Shrine',
    stages: ['Stone Steps', 'Torii Path', 'Inner Court', 'Main Hall'],   // floors 1-3, 4-6, 7-10, the boss (stageOf() in js/map.js, painted by js/scene.js)
    normals: ['litwick', 'houndour', 'darumaka', 'bellsprout', 'paras', 'cherubi',
      'krabby', 'slowpoke', 'shellos', 'teddiursa', 'aipom', 'stantler'],
    elites: ['ambipom', 'persian', 'watchog'], bosses: ['stoutland', 'exploud', 'ursaring'],
    hpMult: 2.9, dmgBonus: 16, bossBonus: 21,
  },
  {
    id: 'wastes', name: 'Ember Wastes',
    stages: ['Ash Plains', 'Lava Fields', 'Volcano Slope', 'Crater Rim'],   // floors 1-3, 4-6, 7-10, the boss (stageOf() in js/map.js, painted by js/scene.js)
    normals: ['magmar', 'torkoal', 'heatmor', 'tangela', 'cacturne', 'maractus',
      'staryu', 'crawdaunt', 'sharpedo', 'tauros', 'bouffalant', 'zangoose'],
    elites: ['purugly', 'cinccino', 'lopunny'], bosses: ['slaking', 'regigigas', 'lickilicky', 'porygonz'],
    hpMult: 5.2, dmgBonus: 27, bossBonus: 33,
  },
  {
    // Mewtwo's alone (v1.0): `secret` keeps it out of every other run, the Pokédex and the records. Its numbers are fixed:
    // no Trainer Level reaches it (MEWTWO_MODE in difficulty.js). Its scenery is BIOME_ART.depths in scene.js.
    id: 'depths', name: 'Crystal Depths', secret: true,
    stages: ['Cave Mouth', 'Crystal Halls', 'Deep Core', 'Energy Well'],
    normals: ['crobat', 'sableye', 'gigalith', 'steelix', 'excadrill', 'haxorus',
      'golurk', 'bronzong', 'claydol', 'dusknoir', 'lanturn', 'magnezone'],
    elites: ['clefable', 'ditto', 'smeargle'], bosses: ['eternatus'],
    hpMult: 7.5, dmgBonus: 31, bossBonus: 58,
  },
];

/** The biome a run ends in: the third, or for Mewtwo its secret fourth. */
export const finalBiome = (starter) => (starter?.id === 'mewtwo' ? BIOMES.length : BIOMES.filter(b => !b.secret).length) - 1;

/* Traits: what some of the Crystal Depths' Pokémon do whenever you play a card (enemyTrait() in js/battle.js). Each
   enemy's `trait` names one by `id`, with its own `name` (an Ability) and numbers. */
export const TRAITS = {
  barbs:    { icon: '🦔', text: t => `${t.name}: every attack you play hurts you ${t.amount} (block soaks it, and it can't knock you out)` },
  analytic: { icon: '🧠', text: t => `${t.name}: it gains ${t.amount} strength whenever you play a Power` },
  stamina:  { icon: '💎', text: t => `${t.name}: every card you play past your ${t.after}th in a turn gives it ${t.amount} block` },
};

const pick = (list) => pickOne(list);

/**
 * Build one fight. kind is 'fight', 'elite' or 'boss'. mods are the Trainer Level rules.
 * enemyId is optional: the map picks the elite and boss ahead of time so it can show them.
 * Returns everything battle.js needs: the enemy, its HP, and bonus damage.
 */
/** Pick which enemy a fight, elite or boss node will hold, when the map is made. `weight(id)` favours some
    (the Pokédex's unbeaten ones); the default is an even pick. */
export function pickEnemyId(biomeIndex, kind, weight = () => 1) {
  const biome = BIOMES[biomeIndex];
  const list = kind === 'boss' ? biome.bosses : kind === 'elite' ? biome.elites : biome.normals;
  const weights = list.map(weight);
  let roll = random() * weights.reduce((a, b) => a + b, 0);
  return list.find((id, i) => (roll -= weights[i]) < 0) ?? list[list.length - 1];
}

/**
 * Fill a biome's rooms of one kind (sorted floor by floor) with enemies like a dealt deck (the user's call, 2026-09-28:
 * two Growlithes in one run felt unfair). Routes branch and merge, so for each room it counts, per Pokémon, how many of
 * the routes into it already met it, and deals one met on the fewest (almost always none); among those the deck makes
 * every Pokémon come up about as often as the rest, and `weight(id)` favours the Pokédex's unbeaten ones.
 */
export function dealEnemies(biomeIndex, kind, rooms, byId, weight = () => 1, normals = null) {
  const biome = BIOMES[biomeIndex];
  const list = kind === 'boss' ? biome.bosses : kind === 'elite' ? biome.elites : normals ?? biome.normals;   // normals: a Safari area's wilds
  const routes = new Map(), met = new Map();   // node id -> routes from the start into it / { id: routes into it that met id }
  const count = (node) => {
    if (!routes.has(node.id)) routes.set(node.id, node.prev.length ? node.prev.reduce((n, id) => n + count(byId[id]), 0) : 1);
    return routes.get(node.id);
  };
  const metBy = (node) => {
    if (!met.has(node.id)) {
      const tally = {};
      for (const id of node.prev) {
        const prev = byId[id], before = metBy(prev);
        for (const x of list) tally[x] = (tally[x] || 0) + (prev.enemyId === x ? count(prev) : before[x] || 0);
      }
      met.set(node.id, tally);
    }
    return met.get(node.id);
  };
  let deck = [...list];
  for (const room of rooms) {
    const tally = metBy(room);
    const least = Math.min(...list.map(x => tally[x] || 0));
    const fresh = list.filter(x => (tally[x] || 0) === least);
    if (!deck.some(x => fresh.includes(x))) deck = [...list];
    const options = deck.filter(x => fresh.includes(x));
    const weights = options.map(weight);
    let roll = random() * weights.reduce((x, y) => x + y, 0);
    const id = options.find((_, i) => (roll -= weights[i]) < 0) ?? options[options.length - 1];
    room.enemyId = id;
    deck.splice(deck.indexOf(id), 1);
  }
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
  const place = (def.template && PLACE[biomeIndex]) || { hp: 1, dmg: 0 };   // a Safari template Pokémon grows with its area's place
  return {
    def,
    kind,
    maxHp: Math.round(def.hp * place.hp * biome.hpMult * mods.normalHp * (kind === 'elite' ? mods.eliteHp : 1)),
    strength: biome.dmgBonus + place.dmg + mods.enemyDmg,
  };
}
