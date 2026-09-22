/* ============================================================
   starters.js  -  the nine starter Pokémon you can play.

   Only THREE of them are gameplay-distinct: Charmander, Bulbasaur and
   Squirtle each define their type's real starting deck. The other six
   (Cyndaquil, Chikorita, Totodile, Torchic, Treecko, Mudkip) are SKINS -
   they share their type's exact deck (same array, see FIRE_DECK etc.
   below) and only change the sprite, name and evolution line. That
   keeps the balance work to 3 decks instead of 9; `skinOf` just
   documents which real character a skin borrows its moves from
   (nothing in the code reads it, it's for humans).

   Each starter has:
     line   its three evolution stages (stage 0, 1, 2)
     deck   its fixed 10-card starting deck (card ids from cards.js).
            You can't edit it. You grow your deck by winning fights.

   The three Kanto starters are free. The other six are unlocked by
   achievements (see achievements.js).

   Sprites are Gen 5 pixel art from the PokeAPI sprites project
   (credits are in the README). The files live in assets/pokemon/.

   (The old design - all 9 with their own hand-tuned deck - is saved
   in docs/archived-starters.md in case we bring it back later.)
   ============================================================ */

const FIRE_DECK  = ['ember', 'ember', 'ember', 'scorch', 'heat-up', 'flare-up', 'flame-wall', 'flame-wall', 'block', 'tailwind'];
const GRASS_DECK = ['vine-whip', 'vine-whip', 'vine-whip', 'stun-spore', 'growth', 'razor-leaf', 'absorb', 'block', 'block', 'tailwind'];
const WATER_DECK = ['water-gun', 'water-gun', 'water-gun', 'bubble', 'rain-dance', 'surf', 'withdraw', 'withdraw', 'aqua-ring', 'tailwind'];

export const STARTERS = [
  {
    id: 'charmander', type: 'fire',
    line: [
      { id: 'charmander', name: 'Charmander' },
      { id: 'charmeleon', name: 'Charmeleon' },
      { id: 'charizard',  name: 'Charizard' },
    ],
    blurb: 'Fast, fiery attacks. Hits harder when hurt.',
    deck: FIRE_DECK,
  },
  {
    id: 'bulbasaur', type: 'grass',
    line: [
      { id: 'bulbasaur', name: 'Bulbasaur' },
      { id: 'ivysaur',   name: 'Ivysaur' },
      { id: 'venusaur',  name: 'Venusaur' },
    ],
    blurb: 'Steady damage, with plenty of block.',
    deck: GRASS_DECK,
  },
  {
    id: 'squirtle', type: 'water',
    line: [
      { id: 'squirtle',  name: 'Squirtle' },
      { id: 'wartortle', name: 'Wartortle' },
      { id: 'blastoise', name: 'Blastoise' },
    ],
    blurb: 'Tough shell, quick draws, reliable water attacks.',
    deck: WATER_DECK,
  },

  /* ---------- skins: same deck as the matching Kanto starter above ---------- */
  {
    id: 'cyndaquil', type: 'fire', skinOf: 'charmander',
    line: [
      { id: 'cyndaquil',  name: 'Cyndaquil' },
      { id: 'quilava',    name: 'Quilava' },
      { id: 'typhlosion', name: 'Typhlosion' },
    ],
    blurb: 'Same fire moves as Charmander, wrapped in a different flame.',
    deck: FIRE_DECK,
  },
  {
    id: 'chikorita', type: 'grass', skinOf: 'bulbasaur',
    line: [
      { id: 'chikorita', name: 'Chikorita' },
      { id: 'bayleef',   name: 'Bayleef' },
      { id: 'meganium',  name: 'Meganium' },
    ],
    blurb: 'Same grass moves as Bulbasaur, a different bulb entirely.',
    deck: GRASS_DECK,
  },
  {
    id: 'totodile', type: 'water', skinOf: 'squirtle',
    line: [
      { id: 'totodile',   name: 'Totodile' },
      { id: 'croconaw',   name: 'Croconaw' },
      { id: 'feraligatr', name: 'Feraligatr' },
    ],
    blurb: 'Same water moves as Squirtle, with a much bigger grin.',
    deck: WATER_DECK,
  },
  {
    id: 'torchic', type: 'fire', skinOf: 'charmander',
    line: [
      { id: 'torchic',   name: 'Torchic' },
      { id: 'combusken', name: 'Combusken' },
      { id: 'blaziken',  name: 'Blaziken' },
    ],
    blurb: 'Same fire moves as Charmander. Feathers instead of scales.',
    deck: FIRE_DECK,
  },
  {
    id: 'treecko', type: 'grass', skinOf: 'bulbasaur',
    line: [
      { id: 'treecko',  name: 'Treecko' },
      { id: 'grovyle',  name: 'Grovyle' },
      { id: 'sceptile', name: 'Sceptile' },
    ],
    blurb: 'Same grass moves as Bulbasaur. Quicker on its feet.',
    deck: GRASS_DECK,
  },
  {
    id: 'mudkip', type: 'water', skinOf: 'squirtle',
    line: [
      { id: 'mudkip',    name: 'Mudkip' },
      { id: 'marshtomp', name: 'Marshtomp' },
      { id: 'swampert',  name: 'Swampert' },
    ],
    blurb: 'Same water moves as Squirtle, straight out of the mud.',
    deck: WATER_DECK,
  },
];

export const STARTERS_BY_ID = Object.fromEntries(STARTERS.map(s => [s.id, s]));

/** Path to one of a starter's images at a given evolution stage. kind is 'front' or 'back'. */
export function spriteUrl(starter, kind, stage = 0) {
  return `assets/pokemon/${starter.line[stage].id}-${kind}.gif`;
}

/** The name of a starter at a given evolution stage (Charmander, Charmeleon...). */
export const stageName = (starter, stage) => starter.line[stage].name;

/** Which backdrop picture goes with each type (used on the menu). */
export const BACKDROPS = {
  fire:  'assets/backgrounds/volcano.jpg',
  grass: 'assets/backgrounds/shrine.jpg',
  water: 'assets/backgrounds/clearing.jpg',
};

/** Hit points at each evolution stage: BASE_HP, then +HP_PER_STAGE for each evolution. */
export const BASE_HP = 70;
export const HP_PER_STAGE = 20;
