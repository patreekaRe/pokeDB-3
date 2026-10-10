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

import { random, pickOne, shuffled } from '../rng.js';
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

  /* ----- Biome 2, the other road: the Sunken Ruins, a flooded temple (roadmap item 19). Mostly Water. Its Pokémon are
     the Safari Zone's, shared like the Safari's borrowed wilds (official Gen 5 sprites only, the user's call): these
     defs win over safariMonDef(), which keeps their Safari line (`safariLine`). ----- */
  corphish: {
    name: 'Corphish', type: 'water', hp: 54, ...sprite('corphish'),
    description: 'Moved into the flooded halls and claims every one of them, one pincer at a time.',
    moves: [
      { kind: 'attack', name: 'Bubble Beam', amount: 7 },
      { kind: 'buff',   name: 'Swords Dance', amount: 2 },
      { kind: 'attack', name: 'Crabhammer',  amount: 12 },
    ],
  },
  finneon: {
    name: 'Finneon', type: 'water', hp: 46, ...sprite('finneon'),
    description: 'Its tail fins glow in the drowned corridors. Follow the light and you swim into its school.',
    moves: [
      { kind: 'attack', name: 'Water Gun', amount: 6 },
      { kind: 'buff',   name: 'Rain Dance', amount: 3 },
      { kind: 'attack', name: 'Waterfall',      amount: 11 },
    ],
  },
  shellder: {
    name: 'Shellder', type: 'water', hp: 62, ...sprite('shellder'),
    description: 'Clamps shut in the temple\'s tide pools and waits for a careless foot.',
    moves: [
      { kind: 'attack', name: 'Tackle',     amount: 6, type: 'normal' },
      { kind: 'defend', name: 'Withdraw',      amount: 10 },
      { kind: 'attack', name: 'Clamp', amount: 11 },
    ],
  },
  frillish: {
    name: 'Frillish', type: 'water', hp: 52, ...sprite('frillish'),
    description: 'Drifts through the sunken halls, veil trailing. Whoever it wraps never quite surfaces.',
    moves: [
      { kind: 'attack', name: 'Bubble',      amount: 7 },
      { kind: 'buff',   name: 'Rain Dance',     amount: 2 },
      { kind: 'attack', name: 'Hex', amount: 11, type: 'normal', adds: { card: 'confusion', n: 1, to: 'draw' } },
    ],
  },
  basculin: {
    name: 'Basculin', type: 'water', hp: 50, ...sprite('basculin'),
    description: 'Two schools fight over the flooded nave, and both of them bite anything in between.',
    moves: [
      { kind: 'attack', name: 'Bite',        amount: 6, type: 'normal' },
      { kind: 'buff',   name: 'Agility',     amount: 2 },
      { kind: 'attack', name: 'Aqua Tail', amount: 12 },
    ],
  },
  slugma: {
    name: 'Slugma', type: 'fire', hp: 52, ...sprite('slugma'),
    description: 'Oozes along the dry upper ledges, warm enough to boil the puddles it crosses.',
    moves: [
      { kind: 'attack', name: 'Smog',        amount: 6, type: 'normal', adds: { card: 'poison', n: 1 } },
      { kind: 'buff',   name: 'Amnesia',  amount: 2 },
      { kind: 'attack', name: 'Lava Plume', amount: 11 },
    ],
  },
  flareon: {
    name: 'Flareon', type: 'fire', hp: 56, ...sprite('flareon'),
    description: 'Keeps the temple\'s last brazier lit by curling round it. It doesn\'t like visitors near.',
    moves: [
      { kind: 'attack', name: 'Quick Attack',     amount: 6, type: 'normal' },
      { kind: 'buff',   name: 'Focus Energy',  amount: 2 },
      { kind: 'attack', name: 'Fire Fang', amount: 12 },
    ],
  },
  foongus: {
    name: 'Foongus', type: 'grass', hp: 62, ...sprite('foongus'),
    description: 'Grows on the offerings left at the shrines. Some are real Poké Balls. Most are not.',
    moves: [
      { kind: 'drain',  name: 'Giga Drain',  amount: 6, heal: 5 },
      { kind: 'attack', name: 'Clear Smog', amount: 7, type: 'normal', adds: { card: 'sludge', n: 1 } },
      { kind: 'attack', name: 'Energy Ball',  amount: 12 },
    ],
  },
  shroomish: {
    name: 'Shroomish', type: 'grass', hp: 50, ...sprite('shroomish'),
    description: 'Sprouts in the damp crypts and puffs spores at any lamp that comes near.',
    moves: [
      { kind: 'drain',  name: 'Mega Drain', amount: 6, heal: 5 },
      { kind: 'status', name: 'Spore',      adds: { card: 'paralysis', n: 1, to: 'draw' } },
      { kind: 'attack', name: 'Headbutt',  amount: 11, type: 'normal' },
    ],
  },
  bidoof: {
    name: 'Bidoof', type: 'normal', hp: 50, ...sprite('bidoof'),
    description: 'Gnaws at the temple\'s wooden beams. The floors that collapsed were probably its fault.',
    moves: [
      { kind: 'attack', name: 'Tackle', amount: 6 },
      { kind: 'defend', name: 'Defense Curl',          amount: 8 },
      { kind: 'attack', name: 'Hyper Fang',    amount: 11 },
    ],
  },
  lillipup: {
    name: 'Lillipup', type: 'normal', hp: 52, ...sprite('lillipup'),
    description: 'Sniffs out every dry corridor of the ruins, and barks at the water rising behind it.',
    moves: [
      { kind: 'attack', name: 'Bite',       amount: 7 },
      { kind: 'buff',   name: 'Work Up',    amount: 2 },
      { kind: 'attack', name: 'Take Down', amount: 11 },
    ],
  },
  skitty: {
    name: 'Skitty', type: 'normal', hp: 58, ...sprite('skitty'),
    description: 'Chases the light rippling on the temple walls round and round the halls.',
    moves: [
      { kind: 'attack', name: 'Double Slap',      amount: 6 },
      { kind: 'defend', name: 'Wish',       amount: 9 },
      { kind: 'attack', name: 'Double-Edge', amount: 12 },
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

  /* ----- Biome 3, the other road: the Thornwood Jungle, a primeval forest (roadmap item 19). Mostly Grass. Safari Pokémon,
     shared like the Sunken Ruins'. One Normal wild, Slakoth (Team Rocket's whole team here; the user's call,
     2026-10-07). ----- */
  simisage: {
    name: 'Simisage', type: 'grass', hp: 64, ...sprite('simisage'),
    description: 'Swings through the jungle canopy and drops on whatever walks the trail beneath.',
    moves: [
      { kind: 'attack', name: 'Vine Whip',      amount: 8 },
      { kind: 'buff',   name: 'Nasty Plot', amount: 2 },
      { kind: 'attack', name: 'Seed Bomb',  amount: 13 },
    ],
  },
  lilligant: {
    name: 'Lilligant', type: 'grass', hp: 62, ...sprite('lilligant'),
    description: 'Blooms only deep in the jungle, where no one tends it. It grew thorns instead.',
    moves: [
      { kind: 'attack', name: 'Facade', amount: 8, type: 'normal' },
      { kind: 'drain',  name: 'Leech Life', amount: 7, heal: 6, type: 'normal' },
      { kind: 'attack', name: 'Petal Dance',   amount: 13 },
    ],
  },
  shiftry: {
    name: 'Shiftry', type: 'grass', hp: 68, ...sprite('shiftry'),
    description: 'Its fans whip up gales in the treetops. The jungle says it guards the oldest trees.',
    moves: [
      { kind: 'attack', name: 'Feint Attack', amount: 8, type: 'normal' },
      { kind: 'attack', name: 'Razor Wind',       amount: 6, type: 'normal', adds: { card: 'sludge', n: 2 } },
      { kind: 'attack', name: 'Leaf Storm', amount: 13 },
    ],
  },
  sawsbuck: {
    name: 'Sawsbuck', type: 'grass', hp: 70, ...sprite('sawsbuck'),
    description: 'Its antlers grow whatever the jungle grows. In Thornwood that means thorns.',
    moves: [
      { kind: 'drain',  name: 'Horn Leech',     amount: 6, heal: 7 },
      { kind: 'defend', name: 'Aromatherapy', amount: 10 },
      { kind: 'attack', name: 'Solar Beam',      amount: 12 },
    ],
  },
  carnivine: {
    name: 'Carnivine', type: 'grass', hp: 60, ...sprite('carnivine'),
    description: 'Hangs from the strangler figs with its mouth open, smelling sweet.',
    moves: [
      { kind: 'attack', name: 'Vine Whip', amount: 7 },
      { kind: 'status', name: 'Sweet Scent',      adds: { card: 'sludge', n: 2 } },
      { kind: 'attack', name: 'Power Whip',  amount: 13 },
    ],
  },
  exeggutor: {
    name: 'Exeggutor', type: 'grass', hp: 66, ...sprite('exeggutor'),
    description: 'Grows taller than the undergrowth here, and its heads argue about who saw you first.',
    moves: [
      { kind: 'drain',  name: 'Giga Drain', amount: 7, heal: 6 },
      { kind: 'defend', name: 'Reflect',   amount: 10 },
      { kind: 'attack', name: 'Wood Hammer', amount: 12 },
    ],
  },
  whimsicott: {
    name: 'Whimsicott', type: 'grass', hp: 60, ...sprite('whimsicott'),
    description: 'Blows through the jungle on the wind, leaving its cotton snagged on every thorn.',
    moves: [
      { kind: 'attack', name: 'Razor Leaf', amount: 7 },
      { kind: 'defend', name: 'Cotton Guard', amount: 11 },
      { kind: 'attack', name: 'Energy Ball',   amount: 13 },
    ],
  },
  volcarona: {
    name: 'Volcarona', type: 'fire', hp: 66, ...sprite('volcarona'),
    description: 'Its wings light the dark under the canopy like a second sun. Nothing grows where it lands.',
    moves: [
      { kind: 'attack', name: 'Ember',   amount: 8 },
      { kind: 'buff',   name: 'Quiver Dance',  amount: 2 },
      { kind: 'attack', name: 'Fiery Dance', amount: 13 },
    ],
  },
  rapidash: {
    name: 'Rapidash', type: 'fire', hp: 64, ...sprite('rapidash'),
    description: 'Gallops the jungle trails so fast the leaves catch fire behind it.',
    moves: [
      { kind: 'attack', name: 'Stomp', amount: 8, type: 'normal' },
      { kind: 'buff',   name: 'Agility',     amount: 2 },
      { kind: 'attack', name: 'Flare Blitz', amount: 13 },
    ],
  },
  carvanha: {
    name: 'Carvanha', type: 'water', hp: 60, ...sprite('carvanha'),
    description: 'Packs the jungle\'s rivers. One bite and the whole school knows where you are.',
    moves: [
      { kind: 'attack', name: 'Aqua Jet',    amount: 8 },
      { kind: 'buff',   name: 'Rage',     amount: 2 },
      { kind: 'attack', name: 'Waterfall', amount: 13 },
    ],
  },
  simipour: {
    name: 'Simipour', type: 'water', hp: 64, ...sprite('simipour'),
    description: 'Fills its tail at the waterfalls and sprays anyone it doesn\'t like. It likes nobody.',
    moves: [
      { kind: 'attack', name: 'Scald',   amount: 8 },
      { kind: 'defend', name: 'Water Sport',   amount: 9 },
      { kind: 'attack', name: 'Acrobatics',    amount: 13, type: 'normal' },
    ],
  },
  slakoth: {
    name: 'Slakoth', type: 'normal', hp: 66, ...sprite('slakoth'),
    description: 'Hangs in the same tree all day. It moves, a little, when you come too close.',
    moves: [
      { kind: 'attack', name: 'Scratch',       amount: 8 },
      { kind: 'defend', name: 'Slack Off',  amount: 10 },
      { kind: 'attack', name: 'Feint Attack',  amount: 13 },
    ],
  },

  /* ----- the pool's Fire road (roadmap item 20): the Sunscorch Savanna, a sun-baked grassland of wildfires and one
     watering hole. Mostly Fire. Safari Pokémon, shared like the Sunken Ruins', authored at Biome 2's numbers (its
     `home`); walked at the second fork they grow like any pool biome's (walkAt() below). ----- */
  ponyta: {
    name: 'Ponyta', type: 'fire', hp: 46, ...sprite('ponyta'),
    description: 'Its herd gallops ahead of the wildfires, and leaves a fresh one in the grass behind it.',
    moves: [
      { kind: 'attack', name: 'Ember',        amount: 6 },
      { kind: 'attack', name: 'Stomp',        amount: 5, type: 'normal' },
      { kind: 'attack', name: 'Flame Charge', amount: 10 },
    ],
  },
  magby: {
    name: 'Magby', type: 'fire', hp: 48, ...sprite('magby'),
    description: 'Naps on the hottest rock of the plain. When it sneezes, the grass round it catches.',
    moves: [
      { kind: 'attack', name: 'Ember',       amount: 6 },
      { kind: 'defend', name: 'Smokescreen', amount: 7 },
      { kind: 'attack', name: 'Fire Punch',  amount: 11 },
    ],
  },
  ninetales: {
    name: 'Ninetales', type: 'fire', hp: 54, ...sprite('ninetales'),
    description: 'Walks the savanna in the heat haze. Travellers who follow its glow wake up far from the trail.',
    moves: [
      { kind: 'buff',   name: 'Nasty Plot',   amount: 2 },
      { kind: 'attack', name: 'Extrasensory', amount: 7, type: 'normal', adds: { card: 'confusion', n: 1, to: 'draw' } },
      { kind: 'attack', name: 'Flamethrower', amount: 11 },
    ],
  },
  arcanine: {
    name: 'Arcanine', type: 'fire', hp: 58, ...sprite('arcanine'),
    description: 'Runs the plain from one horizon to the other between sunrise and noon. The lions keep out of its way.',
    moves: [
      { kind: 'attack', name: 'Bite',       amount: 7, type: 'normal' },
      { kind: 'buff',   name: 'Howl',       amount: 2 },
      { kind: 'attack', name: 'Flare Blitz', amount: 12 },
    ],
  },
  houndoom: {
    name: 'Houndoom', type: 'fire', hp: 52, ...sprite('houndoom'),
    description: 'Hunts the savanna in packs after dark. Its howl carries from one burning grass fire to the next.',
    moves: [
      { kind: 'attack', name: 'Smog',    amount: 6, type: 'normal', adds: { card: 'poison', n: 1 } },
      { kind: 'buff',   name: 'Roar',    amount: 1 },
      { kind: 'attack', name: 'Inferno', amount: 11 },
    ],
  },
  simisear: {
    name: 'Simisear', type: 'fire', hp: 52, ...sprite('simisear'),
    description: 'Lords it over the one shady tree on the plain, and roasts whoever wants the shade.',
    moves: [
      { kind: 'attack', name: 'Fury Swipes', amount: 6, type: 'normal' },
      { kind: 'buff',   name: 'Work Up',     amount: 2 },
      { kind: 'attack', name: 'Flame Burst', amount: 10 },
    ],
  },
  panpour: {
    name: 'Panpour', type: 'water', hp: 50, ...sprite('panpour'),
    description: 'Fills its head at the watering hole and carries it across the plain for its troop.',
    moves: [
      { kind: 'attack', name: 'Water Gun',   amount: 6 },
      { kind: 'defend', name: 'Water Sport', amount: 7 },
      { kind: 'attack', name: 'Scald',       amount: 10 },
    ],
  },
  golduck: {
    name: 'Golduck', type: 'water', hp: 54, ...sprite('golduck'),
    description: 'Guards the last watering hole. Every thirsty Pokémon on the savanna has to get past it.',
    moves: [
      { kind: 'defend', name: 'Amnesia',      amount: 8 },
      { kind: 'attack', name: 'Zen Headbutt', amount: 7, type: 'normal' },
      { kind: 'attack', name: 'Hydro Pump',   amount: 12 },
    ],
  },
  sunflora: {
    name: 'Sunflora', type: 'grass', hp: 52, ...sprite('sunflora'),
    description: 'Turns all day to follow the sun across the plain, drinking in every ray.',
    moves: [
      { kind: 'drain',  name: 'Mega Drain',     amount: 6, heal: 5 },
      { kind: 'buff',   name: 'Growth',         amount: 2 },
      { kind: 'attack', name: 'Petal Blizzard', amount: 11 },
    ],
  },
  cherrim: {
    name: 'Cherrim', type: 'grass', hp: 50, ...sprite('cherrim'),
    description: 'Stays shut through the long dry spells and bursts open the moment the sun gets fierce.',
    moves: [
      { kind: 'defend', name: 'Synthesis',    amount: 8 },
      { kind: 'attack', name: 'Magical Leaf', amount: 7 },
      { kind: 'attack', name: 'Petal Dance',  amount: 11 },
    ],
  },
  meowth: {
    name: 'Meowth', type: 'normal', hp: 46, ...sprite('meowth'),
    description: 'Picks coins out of the ashes after every grass fire. It knows who dropped them.',
    moves: [
      { kind: 'attack', name: 'Scratch',     amount: 6 },
      { kind: 'attack', name: 'Pay Day',     amount: 7 },
      { kind: 'attack', name: 'Fury Swipes', amount: 9 },
    ],
  },
  minccino: {
    name: 'Minccino', type: 'normal', hp: 48, ...sprite('minccino'),
    description: 'Sweeps the ash off its burrow with its tail every morning, then the wind brings more.',
    moves: [
      { kind: 'attack', name: 'Pound',     amount: 6 },
      { kind: 'defend', name: 'Tidy Up',   amount: 7 },
      { kind: 'attack', name: 'Tail Slap', amount: 10 },
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
  lickitung: {
    name: 'Lickitung', type: 'normal', hp: 70, ...sprite('lickitung'),
    description: 'Licks the old carvings clean. It has tasted every word written in the temple.',
    moves: [
      { kind: 'attack', name: 'Lick',  amount: 8 },
      { kind: 'buff',   name: 'Belly Drum',   amount: 2 },
      { kind: 'attack', name: 'Wring Out', amount: 12 },
    ],
  },
  herdier: {
    name: 'Herdier', type: 'normal', hp: 68, ...sprite('herdier'),
    description: 'Stands guard at one door of the ruins as if someone told it to long ago.',
    moves: [
      { kind: 'attack', name: 'Crunch',    amount: 7 },
      { kind: 'drain',  name: 'Thief', amount: 8, heal: 5 },
      { kind: 'attack', name: 'Giga Impact',     amount: 12 },
    ],
  },
  audino: {
    name: 'Audino', type: 'normal', hp: 72, ...sprite('audino'),
    description: 'Hears your heartbeat through the stone, so it always knows which hall you\'re hiding in.',
    moves: [
      { kind: 'attack', name: 'Pound',  amount: 7 },
      { kind: 'defend', name: 'Heal Pulse', amount: 10 },
      { kind: 'attack', name: 'Hyper Voice',   amount: 12 },
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

  vigoroth: {
    name: 'Vigoroth', type: 'normal', hp: 72, ...sprite('vigoroth'),
    description: 'Can\'t sit still for a second. It tears through the jungle like a storm with claws.',
    moves: [
      { kind: 'attack', name: 'Fury Swipes',   amount: 8 },
      { kind: 'defend', name: 'Endure',  amount: 11 },
      { kind: 'attack', name: 'Slash', amount: 13 },
    ],
  },
  delcatty: {
    name: 'Delcatty', type: 'normal', hp: 70, ...sprite('delcatty'),
    description: 'Wanders the jungle wherever it likes, and expects the jungle to move out of its way.',
    moves: [
      { kind: 'attack', name: 'Fake Out',  amount: 7 },
      { kind: 'defend', name: 'Heal Bell', amount: 11 },
      { kind: 'attack', name: 'Double-Edge',    amount: 13 },
    ],
  },
  spinda: {
    name: 'Spinda', type: 'normal', hp: 66, ...sprite('spinda'),
    description: 'Totters along the jungle paths. Its dizzy steps make anyone who follows it lose the trail.',
    moves: [
      { kind: 'attack', name: 'Dizzy Punch',  amount: 8 },
      { kind: 'buff',   name: 'Psych Up',     amount: 2 },
      { kind: 'attack', name: 'Thrash',  amount: 12 },
    ],
  },

  patrat: {
    name: 'Patrat', type: 'normal', hp: 66, ...sprite('patrat'),
    description: 'Stands sentry on a termite mound. One squeak from it and the whole plain knows you\'re here.',
    moves: [
      { kind: 'attack', name: 'Bite',       amount: 7 },
      { kind: 'defend', name: 'Detect',     amount: 9 },
      { kind: 'attack', name: 'Hyper Fang', amount: 12 },
    ],
  },
  buneary: {
    name: 'Buneary', type: 'normal', hp: 68, ...sprite('buneary'),
    description: 'Bounds through the tall grass faster than the fires. It kicks first and asks after.',
    moves: [
      { kind: 'attack', name: 'Pound',     amount: 8 },
      { kind: 'buff',   name: 'Agility',   amount: 2 },
      { kind: 'attack', name: 'Jump Kick', amount: 12 },
    ],
  },
  glameow: {
    name: 'Glameow', type: 'normal', hp: 66, ...sprite('glameow'),
    description: 'Lounges in the shade of the thorn trees and claws whatever wakes it.',
    moves: [
      { kind: 'attack', name: 'Fury Swipes', amount: 7 },
      { kind: 'buff',   name: 'Hone Claws',  amount: 2 },
      { kind: 'attack', name: 'Slash',       amount: 12 },
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
  dunsparce: {
    name: 'Dunsparce', type: 'normal', hp: 250, ...sprite('dunsparce'), boss: true,
    description: 'They say it bored the temple\'s halls before the builders came. Now the water\'s in, it wants them back.',
    moves: [
      { kind: 'attack', name: 'Drill Run',   amount: 11 },
      { kind: 'status', name: 'Glare',       adds: { card: 'paralysis', n: 2, to: 'draw' } },
      { kind: 'buff',   name: 'Coil',        amount: 2 },
      { kind: 'attack', name: 'Ancient Power', amount: 22 },
    ],
  },
  wigglytuff: {
    name: 'Wigglytuff', type: 'normal', hp: 240, ...sprite('wigglytuff'), boss: true,
    description: 'Sings on the tide altar every night. The ruins went under, and it never stopped singing.',
    moves: [
      { kind: 'attack', name: 'Body Slam',   amount: 10, adds: { card: 'paralysis', n: 1, to: 'draw' } },
      { kind: 'defend', name: 'Rest',        amount: 13 },
      { kind: 'buff',   name: 'Work Up',     amount: 2 },
      { kind: 'attack', name: 'Hyper Voice', amount: 21 },
    ],
  },
  granbull: {
    name: 'Granbull', type: 'normal', hp: 230, ...sprite('granbull'), boss: true,
    description: 'Took the altar for its den. Every offering left there since has been its dinner.',
    moves: [
      { kind: 'attack', name: 'Bite',            amount: 10 },
      { kind: 'buff',   name: 'Bulk Up',         amount: 3 },
      { kind: 'drain',  name: 'Drain Punch',      amount: 10, heal: 8 },
      { kind: 'attack', name: 'Outrage', amount: 22 },
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

  /* the Thornwood Jungle's (roadmap item 19). The last biome's bosses, so each one ends the run like the Wastes'. */
  blissey: {
    name: 'Blissey', type: 'normal', hp: 430, ...sprite('blissey'), boss: true,
    description: 'Nests in the Heart Tree\'s roots and nurses every hurt thing in the jungle. Not you.',
    moves: [
      { kind: 'attack', name: 'Egg Bomb',        amount: 12 },
      { kind: 'defend', name: 'Soft-Boiled',   amount: 14 },
      { kind: 'drain',  name: 'Present',       amount: 14, heal: 10 },
      { kind: 'attack', name: 'Double-Edge',  amount: 22 },
    ],
  },
  porygon: {
    name: 'Porygon', type: 'normal', hp: 420, ...sprite('porygon'), boss: true,
    description: 'Someone brought it to map the jungle. The jungle grew over the someone.',
    moves: [
      { kind: 'attack', name: 'Psybeam', amount: 12 },
      { kind: 'buff',   name: 'Conversion', amount: 2 },
      { kind: 'status', name: 'Thunder Wave', adds: { card: 'paralysis', n: 2, to: 'draw' } },
      { kind: 'attack', name: 'Tri Attack', amount: 20 },
    ],
  },
  porygon2: {
    name: 'Porygon2', type: 'normal', hp: 420, ...sprite('porygon2'), boss: true,
    description: 'Upgraded itself to survive the jungle. It is still upgrading.',
    moves: [
      { kind: 'attack', name: 'Discharge',          amount: 11 },
      { kind: 'buff',   name: 'Conversion 2',         amount: 2 },
      { kind: 'attack', name: 'Zap Cannon',       amount: 15 },
      { kind: 'attack', name: 'Hyper Beam',    amount: 21 },
    ],
  },

  /* the Sunscorch Savanna's (roadmap item 20), on top of Sun Rock. Biome 2's numbers at home; at the second fork they
     grow with the slot like its wilds, and each one ends the run like the Wastes'. */
  castform: {
    name: 'Castform', type: 'normal', hp: 235, ...sprite('castform'), boss: true,
    description: 'Sits on Sun Rock and calls the drought down on the plain. No rain has fallen since it came.',
    moves: [
      { kind: 'attack', name: 'Weather Ball', amount: 11 },
      { kind: 'defend', name: 'Forecast',     amount: 13 },
      { kind: 'status', name: 'Thunder Wave', adds: { card: 'paralysis', n: 2, to: 'draw' } },
      { kind: 'attack', name: 'Hurricane',    amount: 21 },
    ],
  },
  loudred: {
    name: 'Loudred', type: 'normal', hp: 250, ...sprite('loudred'), boss: true,
    description: 'Roars from Sun Rock at dawn, and the whole savanna stampedes.',
    moves: [
      { kind: 'attack', name: 'Stomp',       amount: 10 },
      { kind: 'buff',   name: 'Howl',        amount: 3 },
      { kind: 'status', name: 'Supersonic',  adds: { card: 'confusion', n: 2, to: 'draw' } },
      { kind: 'attack', name: 'Hyper Voice', amount: 22 },
    ],
  },
  munchlax: {
    name: 'Munchlax', type: 'normal', hp: 260, ...sprite('munchlax'), boss: true,
    description: 'Ate the savanna\'s last fruit tree, roots and all, and is still hungry.',
    moves: [
      { kind: 'attack', name: 'Tackle',      amount: 10 },
      { kind: 'defend', name: 'Stockpile',   amount: 14 },
      { kind: 'drain',  name: 'Snatch',      amount: 10, heal: 8 },
      { kind: 'attack', name: 'Last Resort', amount: 22 },
    ],
  },

  /* the final boss: "the last energy". A set piece in two bars (v1.0 part C, the user's calls 2026-10-02): when this one
     faints it draws the Well's energy in and rises again as `phase2`, Eternamax, with a fresh bar (its `hp` scaled like
     this one's) and its own moves, music and cry (rebirth() in js/battle.js). Eternamax charges Eternabeam a turn ahead
     (`kind: 'charge'`: the intent shows the hit to come) and its Dynamax Cannon `grow`s every time it fires. */
  eternatus: {
    name: 'Eternatus', type: 'normal', hp: 440, ...sprite('eternatus'), boss: true, music: 'eternatus',
    trait: { id: 'stamina', name: 'Pressure', after: 4, amount: 8 },
    description: 'The energy at the bottom of everything. It has been waiting a very long time.',
    moves: [
      { kind: 'attack', name: 'Dynamax Cannon', amount: 14 },
      { kind: 'defend', name: 'Cosmic Power',   amount: 22 },
      { kind: 'status', name: 'Toxic',          adds: { card: 'poison', n: 2, to: 'draw' } },
      { kind: 'buff',   name: 'Dragon Dance',   amount: 4 },
      { kind: 'attack', name: 'Eternabeam',     amount: 26 },
    ],
    phase2: {
      name: 'Eternamax', type: 'normal', hp: 460, ...sprite('eternamax'), boss: true, music: 'eternamax',
      trait: { id: 'stamina', name: 'Pressure', after: 4, amount: 10 },
      description: 'Eternatus filled with all the energy of the Well: its true, limitless form.',
      moves: [
        { kind: 'attack', name: 'Dynamax Cannon', amount: 12, grow: 5 },
        { kind: 'defend', name: 'Cosmic Power',   amount: 26 },
        { kind: 'charge', name: 'Eternabeam' },
        { kind: 'attack', name: 'Eternabeam',     amount: 34 },
        { kind: 'status', name: 'Toxic',          adds: { card: 'poison', n: 2, to: 'draw' } },
      ],
    },
  },

  /* the Sky Pillar's guardian on its top floor, 100 (js/data/tower.js): Rayquaza, the tower's master. Never in a biome, so never
     in the Pokédex; its numbers grow with the floor like every guardian's. */
  'rayquaza-guardian': {
    name: 'Rayquaza', type: 'normal', hp: 520, ...sprite('rayquaza'), boss: true,
    description: 'It lives above the clouds at the top of the Sky Pillar, and comes down for no one.',
    moves: [
      { kind: 'buff',   name: 'Dragon Dance',   amount: 3 },
      { kind: 'attack', name: 'Extreme Speed',  amount: 14 },
      { kind: 'defend', name: 'Air Lock',       amount: 18 },
      { kind: 'attack', name: 'Dragon Ascent',  amount: 26 },
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

// the Safari Zone's own Pokémon, one data line each on a role template (js/data/safari-mons.js). One a main biome also
// holds keeps that biome's def everywhere, like the Safari's borrowed wilds, with its Safari Pokédex line beside it.
for (const m of SAFARI_MONS) ENEMY_DEFS[m.id] = ENEMY_DEFS[m.id] ? { ...ENEMY_DEFS[m.id], safariLine: m.description } : safariMonDef(m);

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

export function buildKenEncounter(at, mods) {
  const biome = biomeOf(at);
  return {
    def: KEN, kind: 'boss',
    maxHp: Math.round(KEN.hp[biome.slot] * mods.bossHp),
    strength: biome.bossBonus + mods.bossDmg + mods.enemyDmg,
    dmgMult: mods.enemyDmgMult ?? 1,
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
    id: 'clearing', name: 'Whispering Clearing', slot: 0,
    stages: ['Meadow', 'Forest Edge', 'Deep Woods', 'Ancient Tree'],   // floors 1-3, 4-6, 7-10, the boss (stageOf() in js/map.js, painted by js/scene.js)
    normals: ['vulpix', 'growlithe', 'pansear', 'oddish', 'hoppip', 'seedot',
      'poliwag', 'psyduck', 'marill', 'rattata', 'sentret', 'zigzagoon'],
    elites: ['raticate', 'furret', 'linoone'], bosses: ['snorlax', 'kangaskhan', 'miltank'],
    hpMult: 1.2, dmgBonus: 7, bossBonus: 8,
  },
  {
    id: 'shrine', name: 'Overgrown Shrine', slot: 1,
    stages: ['Stone Steps', 'Torii Path', 'Inner Court', 'Main Hall'],   // floors 1-3, 4-6, 7-10, the boss (stageOf() in js/map.js, painted by js/scene.js)
    normals: ['litwick', 'houndour', 'darumaka', 'bellsprout', 'paras', 'cherubi',
      'krabby', 'slowpoke', 'shellos', 'teddiursa', 'aipom', 'stantler'],
    elites: ['ambipom', 'persian', 'watchog'], bosses: ['stoutland', 'exploud', 'ursaring'],
    hpMult: 2.9, dmgBonus: 16, bossBonus: 21,
  },
  {
    id: 'wastes', name: 'Ember Wastes', slot: 2,
    stages: ['Ash Plains', 'Lava Fields', 'Volcano Slope', 'Crater Rim'],   // floors 1-3, 4-6, 7-10, the boss (stageOf() in js/map.js, painted by js/scene.js)
    normals: ['magmar', 'torkoal', 'heatmor', 'tangela', 'cacturne', 'maractus',
      'staryu', 'crawdaunt', 'sharpedo', 'tauros', 'bouffalant', 'zangoose'],
    elites: ['purugly', 'cinccino', 'lopunny'], bosses: ['slaking', 'regigigas', 'lickilicky', 'porygonz'],
    hpMult: 5.2, dmgBonus: 27, bossBonus: 33,
  },
  {
    // Mewtwo's alone (v1.0): `secret` keeps it out of every other run, the Pokédex and the records. Its numbers are fixed:
    // no Trainer Level reaches it (MEWTWO_MODE in difficulty.js). Its scenery is BIOME_ART.depths in scene.js.
    id: 'depths', name: 'Crystal Depths', secret: true, slot: 3,
    stages: ['Cave Mouth', 'Crystal Halls', 'Deep Core', 'Energy Well'],
    normals: ['crobat', 'sableye', 'gigalith', 'steelix', 'excadrill', 'haxorus',
      'golurk', 'bronzong', 'claydol', 'dusknoir', 'lanturn', 'magnezone'],
    elites: ['clefable', 'ditto', 'smeargle'], bosses: ['eternatus'],
    hpMult: 7.5, dmgBonus: 31, bossBonus: 58,
  },
];

/* Branching biomes (roadmap items 19-20): after a boss, the crossroads offers the next slot's default biome and one of the
   POOL's, rolled for each fork at the run's start (rollRoads(), saved as `run.roads`), and the run saves its pick in
   `run.route`, a biome id per slot. BIOMES above is the default road, and every per-biome array (events, Kenmatta's HP,
   `deepestBiome`, `bossesDefeated`) is by slot. A pool biome can be walked at either fork, so it has no numbers of its own:
   walkAt() lends it the slot's, and its Pokémon (authored at its `home` slot) grow or shrink to that slot's. */
export const ALT_BIOMES = [
  {
    id: 'ruins', name: 'Sunken Ruins', home: 1, music: 'ruins',   // its map's own song (the user's), at either fork
    stages: ['Flooded Steps', 'Drowned Halls', 'Sunken Court', 'Tide Altar'],
    normals: ['corphish', 'finneon', 'shellder', 'frillish', 'basculin', 'slugma',
      'flareon', 'foongus', 'shroomish', 'bidoof', 'lillipup', 'skitty'],
    elites: ['lickitung', 'herdier', 'audino'], bosses: ['dunsparce', 'wigglytuff', 'granbull'],
  },
  {
    id: 'thornwood', name: 'Thornwood Jungle', home: 2, music: 'thornwood',   // its map's own song (the user's), at either fork
    stages: ['Tangled Edge', 'Canopy Walk', 'Strangler Grove', 'Heart Tree'],
    normals: ['simisage', 'lilligant', 'shiftry', 'sawsbuck', 'carnivine', 'exeggutor',
      'whimsicott', 'volcarona', 'rapidash', 'carvanha', 'simipour', 'slakoth'],
    elites: ['vigoroth', 'delcatty', 'spinda'], bosses: ['blissey', 'porygon', 'porygon2'],
  },
  {
    id: 'savanna', name: 'Sunscorch Savanna', home: 1, music: 'savanna',   // its map's own song (the user's), at either fork
    stages: ['Tall Grass', 'Burnt Plain', 'Watering Hole', 'Sun Rock'],
    normals: ['ponyta', 'magby', 'ninetales', 'arcanine', 'houndoom', 'simisear',
      'panpour', 'golduck', 'sunflora', 'cherrim', 'meowth', 'minccino'],
    elites: ['patrat', 'buneary', 'glameow'], bosses: ['castform', 'loudred', 'munchlax'],
  },
];
/** The pool of other roads (roadmap item 20) and the slots that fork. */
export const POOL = ALT_BIOMES.map(b => b.id);
export const FORKS = [1, 2];
/** A run saved before item 20 has no `roads`: its forks offer what they always did. */
export const LEGACY_ROADS = { 1: 'ruins', 2: 'thornwood' };

const walks = new Map();
/** A biome as walked at `slot`: a default-road biome is itself; a pool biome takes the slot's hpMult / dmgBonus / bossBonus
    (the same object each time, so it can be compared). */
export function walkAt(biome, slot) {
  if (!biome?.home) return biome;
  const key = `${biome.id}@${slot}`;
  if (!walks.has(key)) {
    const { hpMult, dmgBonus, bossBonus } = BIOMES[slot];
    walks.set(key, { ...biome, slot, hpMult, dmgBonus, bossBonus });
  }
  return walks.get(key);
}
/** Every biome by id, a pool biome as walked at its `home` slot (the Pokédex shows its numbers there). */
export const BIOMES_BY_ID = Object.fromEntries([...BIOMES, ...ALT_BIOMES.map(b => walkAt(b, b.home))].map(b => [b.id, b]));
/** Whether biome `id` can stand at slot `i` of a route. */
export const canWalk = (id, i) => BIOMES[i]?.id === id || (POOL.includes(id) && FORKS.includes(i));
/** The roads a fork offers, the default first; `roads` is the run's roll (rollRoads()). */
export const forkRoads = (slot, roads) => [BIOMES[slot].id, roads?.[slot] ?? LEGACY_ROADS[slot]];

/**
 * Which pool biome each fork offers this run, rolled once at its start (roadmap item 20, the user's call): never the same
 * one twice, so one sits out. A biome never walked into (`seen`, stats.biomesSeen) is offered before a seen one, so a
 * player meets all three soon; between two unseen or two seen ones it's a coin flip, and once all are seen pure random.
 */
export function rollRoads(seen = []) {
  const order = shuffled(POOL).sort((a, b) => seen.includes(a) - seen.includes(b));
  return Object.fromEntries(FORKS.map((slot, i) => [slot, order[i]]));
}

/** The other roads stay hidden until you've won a run with every type (Fire, Grass, Water) on Trainer Level ROADS_LEVEL or
    higher (the user's call, 2026-10-07); until then a run walks the default road with no crossroads. */
export const ROADS_LEVEL = 2;
export const roadsOpen = (stats) => ['fire', 'grass', 'water'].every(t => (stats?.maxLevelWinByType?.[t] ?? -1) >= ROADS_LEVEL);
/** The biome a run is in at slot `i`, by its saved `route` (none, or a run saved before the crossroads: the default road). */
export const biomeAt = (route, i) => (canWalk(route?.[i], i) ? walkAt(BIOMES_BY_ID[route[i]], i) : BIOMES[i]);
/** A biome given as its slot (the default road's) or as the biome itself. */
const biomeOf = (b) => (typeof b === 'number' ? BIOMES[b] : b);

/* How strong a slot's Pokémon stand, from the default road's own (average HP of its wilds, Alphas' bases and bosses, and
   the average hit of its attacks), so a pool biome's Pokémon walked away from `home` match the slot (forkGrowth()). */
const average = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const hitsOf = (ids) => ids.flatMap(id => ENEMY_DEFS[id].moves.filter(m => m.amount && m.kind !== 'defend' && m.kind !== 'buff').map(m => m.amount));
let strengths = null;
const strengthAt = (slot) => (strengths ??= BIOMES.map(b => ({
  fight: average(b.normals.map(id => ENEMY_DEFS[id].hp)), elite: average(b.elites.map(id => ENEMY_DEFS[id].hp)),
  boss: average(b.bosses.map(id => ENEMY_DEFS[id].hp)), hit: average(hitsOf([...b.normals, ...b.elites])), bossHit: average(hitsOf(b.bosses)),
})))[slot];
/** A pool biome's Pokémon walked at another slot than `home`: their HP times `hp`, and `dmg` more on every attack. */
export function forkGrowth(biome, kind) {
  if (!biome.home || biome.slot === biome.home) return { hp: 1, dmg: 0 };
  const at = strengthAt(biome.slot), home = strengthAt(biome.home), boss = kind === 'boss';
  return { hp: at[kind] / home[kind], dmg: Math.round(boss ? at.bossHit - home.bossHit : at.hit - home.hit) };
}

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
export function pickEnemyId(at, kind, weight = () => 1) {
  const biome = biomeOf(at);
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
export function dealEnemies(at, kind, rooms, byId, weight = () => 1, normals = null, elites = null) {
  const biome = biomeOf(at);
  const list = kind === 'boss' ? biome.bosses : kind === 'elite' ? elites ?? biome.elites : normals ?? biome.normals;   // normals: a Safari area's wilds (elites: the Sky Pillar's past floor 30)
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

export function buildEncounter(at, kind, mods, enemyId) {
  const biome = biomeOf(at);

  if (kind === 'boss') {
    const def = ENEMY_DEFS[enemyId || pick(biome.bosses)], grow = forkGrowth(biome, kind);
    return {
      def, kind,
      maxHp: Math.round(def.hp * grow.hp * mods.bossHp),
      strength: biome.bossBonus + grow.dmg + mods.bossDmg + mods.enemyDmg,
      dmgMult: mods.enemyDmgMult ?? 1,
    };
  }

  const base = ENEMY_DEFS[enemyId || pick(kind === 'elite' ? biome.elites : biome.normals)];
  const def = kind === 'elite' ? eliteOf(base) : base;
  const place = (def.template && PLACE[biome.slot]) || { hp: 1, dmg: 0 };   // a Safari template Pokémon grows with its area's place
  const grow = forkGrowth(biome, kind);
  return {
    def,
    kind,
    maxHp: Math.round(def.hp * place.hp * grow.hp * biome.hpMult * mods.normalHp * (kind === 'elite' ? mods.eliteHp : 1)),
    strength: biome.dmgBonus + place.dmg + grow.dmg + mods.enemyDmg,
    dmgMult: mods.enemyDmgMult ?? 1,
  };
}
