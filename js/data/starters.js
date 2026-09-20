/* ============================================================
   starters.js  -  the nine starter Pokémon you can play.

   Each starter has:
     line   its three evolution stages (stage 0, 1, 2)
     deck   its fixed 10-card starting deck (card ids from cards.js).
            You can't edit it. You grow your deck by winning fights.

   The three Kanto starters are free. The other six are unlocked by
   achievements (see achievements.js).

   Sprites are Gen 5 pixel art from the PokeAPI sprites project
   (credits are in the README). The files live in assets/pokemon/.
   ============================================================ */

export const STARTERS = [
  {
    id: 'charmander', type: 'fire',
    line: [
      { id: 'charmander', name: 'Charmander' },
      { id: 'charmeleon', name: 'Charmeleon' },
      { id: 'charizard',  name: 'Charizard' },
    ],
    blurb: 'Fast, fiery attacks. Hits harder when hurt.',
    deck: ['ember', 'ember', 'ember', 'scorch', 'heat-up', 'flare-up', 'block', 'block', 'block', 'tailwind'],
  },
  {
    id: 'bulbasaur', type: 'grass',
    line: [
      { id: 'bulbasaur', name: 'Bulbasaur' },
      { id: 'ivysaur',   name: 'Ivysaur' },
      { id: 'venusaur',  name: 'Venusaur' },
    ],
    blurb: 'Steady damage, with plenty of block.',
    deck: ['vine-whip', 'vine-whip', 'vine-whip', 'stun-spore', 'growth', 'razor-leaf', 'block', 'block', 'block', 'tailwind'],
  },
  {
    id: 'squirtle', type: 'water',
    line: [
      { id: 'squirtle',  name: 'Squirtle' },
      { id: 'wartortle', name: 'Wartortle' },
      { id: 'blastoise', name: 'Blastoise' },
    ],
    blurb: 'Tough shell, quick draws, reliable water attacks.',
    deck: ['water-gun', 'water-gun', 'water-gun', 'bubble', 'rain-dance', 'surf', 'block', 'block', 'block', 'tailwind'],
  },

  {
    id: 'cyndaquil', type: 'fire',
    line: [
      { id: 'cyndaquil',  name: 'Cyndaquil' },
      { id: 'quilava',    name: 'Quilava' },
      { id: 'typhlosion', name: 'Typhlosion' },
    ],
    blurb: 'A burn specialist that sets enemies ablaze.',
    deck: ['ember', 'ember', 'fire-spin', 'scorch', 'heat-up', 'inferno-charge', 'block', 'block', 'tailwind', 'smokescreen'],
  },
  {
    id: 'chikorita', type: 'grass',
    line: [
      { id: 'chikorita', name: 'Chikorita' },
      { id: 'bayleef',   name: 'Bayleef' },
      { id: 'meganium',  name: 'Meganium' },
    ],
    blurb: 'A healer. Wins long fights by outlasting enemies.',
    deck: ['vine-whip', 'vine-whip', 'absorb', 'absorb', 'synthesis', 'razor-leaf', 'block', 'block', 'potion', 'tailwind'],
  },
  {
    id: 'totodile', type: 'water',
    line: [
      { id: 'totodile',  name: 'Totodile' },
      { id: 'croconaw',  name: 'Croconaw' },
      { id: 'feraligatr', name: 'Feraligatr' },
    ],
    blurb: 'A hard hitter with a big Surf.',
    deck: ['water-gun', 'water-gun', 'surf', 'surf', 'bubble', 'rain-dance', 'withdraw', 'block', 'block', 'tailwind'],
  },

  {
    id: 'torchic', type: 'fire',
    line: [
      { id: 'torchic',   name: 'Torchic' },
      { id: 'combusken', name: 'Combusken' },
      { id: 'blaziken',  name: 'Blaziken' },
    ],
    blurb: 'An aggressive glass cannon with a little healing.',
    deck: ['ember', 'ember', 'ember', 'flare-up', 'inferno-charge', 'heat-up', 'block', 'block', 'potion', 'tailwind'],
  },
  {
    id: 'treecko', type: 'grass',
    line: [
      { id: 'treecko',  name: 'Treecko' },
      { id: 'grovyle',  name: 'Grovyle' },
      { id: 'sceptile', name: 'Sceptile' },
    ],
    blurb: 'Quick and tricky, with guards and debuffs.',
    deck: ['vine-whip', 'vine-whip', 'vine-whip', 'razor-leaf', 'growth', 'absorb', 'quick-guard', 'block', 'smokescreen', 'tailwind'],
  },
  {
    id: 'mudkip', type: 'water',
    line: [
      { id: 'mudkip',    name: 'Mudkip' },
      { id: 'marshtomp', name: 'Marshtomp' },
      { id: 'swampert',  name: 'Swampert' },
    ],
    blurb: 'A sturdy tank that weakens what it can\'t outdamage.',
    deck: ['water-gun', 'water-gun', 'water-gun', 'whirlpool', 'withdraw', 'withdraw', 'surf', 'bubble', 'quick-guard', 'block'],
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
