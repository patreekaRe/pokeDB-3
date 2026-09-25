/* ============================================================
   starters.js  -  the starter Pokémon you can play.

   Only THREE of them are gameplay-distinct: Charmander, Bulbasaur and
   Squirtle each define their type's real starting deck (`free: true` -
   they need no unlock at all). Every other entry is a SKIN - it shares
   its type's exact deck (same array, see FIRE_DECK etc. below) and
   only changes the sprite, name and evolution line. That keeps the
   balance work to 3 decks; `skinOf` documents which real character a
   skin borrows its moves from (nothing in the code reads it, it's for
   humans).

   Skins unlock one of two ways (see isStarterUnlocked in progress.js):
     - achievement   listed in data/achievements.js
     - shop          bought with PokéCoins, listed in data/shop.js
   Either way, unlocking just adds the id to save.unlocked - the game
   doesn't care which method got you there.

   Each starter has:
     line   its three evolution stages (stage 0, 1, 2)
     deck   its fixed 10-card starting deck (card ids from cards.js).
            You can't edit it. You grow your deck by winning fights.

   Legendaries (Moltres/Virizion/Suicune) don't evolve into a different
   species in the real games, so their "evolutions" are titles, not
   new Pokémon - same sprite for stage 0 and 1, and the shiny recolor
   for stage 2 ("Ascendant"), as a genuine payoff for reaching it.

   Sprites are Gen 5 pixel art from the PokeAPI sprites project
   (credits are in the README). The files live in assets/pokemon/.
   Gen 6+ Pokémon don't exist in this animated style, which is why the
   roster stops at Gen 5.

   (The old design - all 9 with their own hand-tuned deck - is saved
   in docs/archived-starters.md in case we bring it back later.)
   ============================================================ */

const FIRE_DECK  = ['ember', 'ember', 'ember', 'scorch', 'will-o-wisp', 'flare-up', 'flame-wall', 'flame-wall', 'flame-body', 'tailwind'];
const GRASS_DECK = ['vine-whip', 'vine-whip', 'vine-whip', 'stun-spore', 'growth', 'razor-leaf', 'absorb', 'block', 'block', 'tailwind'];
const WATER_DECK = ['water-gun', 'water-gun', 'water-gun', 'bubble', 'rain-dance', 'surf', 'withdraw', 'withdraw', 'aqua-ring', 'tailwind'];

export const STARTERS = [
  /* ---------- the three real characters: free, and the only ones with a unique deck ---------- */
  {
    id: 'charmander', type: 'fire', free: true,
    line: [
      { id: 'charmander', name: 'Charmander' },
      { id: 'charmeleon', name: 'Charmeleon' },
      { id: 'charizard',  name: 'Charizard' },
    ],
    blurb: 'Fast, fiery attacks. Hits harder when hurt.',
    deck: FIRE_DECK,
  },
  {
    id: 'bulbasaur', type: 'grass', free: true,
    line: [
      { id: 'bulbasaur', name: 'Bulbasaur' },
      { id: 'ivysaur',   name: 'Ivysaur' },
      { id: 'venusaur',  name: 'Venusaur' },
    ],
    blurb: 'Steady damage, with plenty of block.',
    deck: GRASS_DECK,
  },
  {
    id: 'squirtle', type: 'water', free: true,
    line: [
      { id: 'squirtle',  name: 'Squirtle' },
      { id: 'wartortle', name: 'Wartortle' },
      { id: 'blastoise', name: 'Blastoise' },
    ],
    blurb: 'Tough shell, quick draws, reliable water attacks.',
    deck: WATER_DECK,
  },

  /* ---------- skins bought in the shop ---------- */
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
    id: 'tepig', type: 'fire', skinOf: 'charmander',
    line: [
      { id: 'tepig',   name: 'Tepig' },
      { id: 'pignite', name: 'Pignite' },
      { id: 'emboar',  name: 'Emboar' },
    ],
    blurb: 'Same fire moves as Charmander. Snorts smoke when excited.',
    deck: FIRE_DECK,
  },
  {
    id: 'snivy', type: 'grass', skinOf: 'bulbasaur',
    line: [
      { id: 'snivy',      name: 'Snivy' },
      { id: 'servine',    name: 'Servine' },
      { id: 'serperior',  name: 'Serperior' },
    ],
    blurb: 'Same grass moves as Bulbasaur. Sleek, quick, a little smug.',
    deck: GRASS_DECK,
  },
  {
    id: 'oshawott', type: 'water', skinOf: 'squirtle',
    line: [
      { id: 'oshawott', name: 'Oshawott' },
      { id: 'dewott',   name: 'Dewott' },
      { id: 'samurott', name: 'Samurott' },
    ],
    blurb: 'Same water moves as Squirtle. Never without its scalchop.',
    deck: WATER_DECK,
  },

  /* ---------- skins unlocked through achievements ---------- */
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
  {
    id: 'chimchar', type: 'fire', skinOf: 'charmander',
    line: [
      { id: 'chimchar',  name: 'Chimchar' },
      { id: 'monferno',  name: 'Monferno' },
      { id: 'infernape', name: 'Infernape' },
    ],
    blurb: 'Same fire moves as Charmander. A flame that never goes out.',
    deck: FIRE_DECK,
  },
  {
    id: 'turtwig', type: 'grass', skinOf: 'bulbasaur',
    line: [
      { id: 'turtwig',  name: 'Turtwig' },
      { id: 'grotle',   name: 'Grotle' },
      { id: 'torterra', name: 'Torterra' },
    ],
    blurb: 'Same grass moves as Bulbasaur. A much sturdier shell.',
    deck: GRASS_DECK,
  },
  {
    id: 'piplup', type: 'water', skinOf: 'squirtle',
    line: [
      { id: 'piplup',   name: 'Piplup' },
      { id: 'prinplup', name: 'Prinplup' },
      { id: 'empoleon', name: 'Empoleon' },
    ],
    blurb: 'Same water moves as Squirtle. Proud, and dramatic about it.',
    deck: WATER_DECK,
  },

  /* ---------- legendaries: the rarest unlock, one per type ----------
     They don't evolve into a different species - "evolving" just gives
     them a title, and reaching the final one reveals their shiny colours. */
  {
    id: 'moltres', type: 'fire', skinOf: 'charmander', legendary: true,
    line: [
      { id: 'moltres',        name: 'Moltres' },
      { id: 'moltres',        name: 'Awakened Moltres' },
      { id: 'moltres-shiny',  name: 'Ascendant Moltres' },
    ],
    blurb: 'A legendary flame. Same fire moves as Charmander - but you\'ll have earned this one.',
    deck: FIRE_DECK,
  },
  {
    id: 'virizion', type: 'grass', skinOf: 'bulbasaur', legendary: true,
    line: [
      { id: 'virizion',       name: 'Virizion' },
      { id: 'virizion',       name: 'Awakened Virizion' },
      { id: 'virizion-shiny', name: 'Ascendant Virizion' },
    ],
    blurb: 'A legendary guardian of the forest. Same grass moves as Bulbasaur, swift as the wind.',
    deck: GRASS_DECK,
  },
  {
    id: 'suicune', type: 'water', skinOf: 'squirtle', legendary: true,
    line: [
      { id: 'suicune',        name: 'Suicune' },
      { id: 'suicune',        name: 'Awakened Suicune' },
      { id: 'suicune-shiny',  name: 'Ascendant Suicune' },
    ],
    blurb: 'A legendary tide. Same water moves as Squirtle, carried by legend.',
    deck: WATER_DECK,
  },

  /* ---------- the secret final one ----------
     Hidden as "???" until you unlock every other starter. Psychic isn't one of
     the three battle types yet and it has no deck, so `comingSoon` keeps it
     out of runs (main.js) until its own cards are built. */
  {
    id: 'mewtwo', type: 'psychic', legendary: true, secret: true, comingSoon: true,
    line: [
      { id: 'mewtwo',        name: 'Mewtwo' },
      { id: 'mewtwo',        name: 'Awakened Mewtwo' },
      { id: 'mewtwo-shiny',  name: 'Ascendant Mewtwo' },
    ],
    blurb: 'The final secret. Its own psychic moves are still being trained.',
    deck: [],
  },
];

export const STARTERS_BY_ID = Object.fromEntries(STARTERS.map(s => [s.id, s]));

/** Path to one of a starter's images at a given evolution stage. kind is 'front' or 'back'. */
export function spriteUrl(starter, kind, stage = 0) {
  return `assets/pokemon/${starter.line[stage].id}-${kind}.gif`;
}

/** The name of a starter at a given evolution stage (Charmander, Charmeleon...). */
export const stageName = (starter, stage) => starter.line[stage].name;

/** Hit points at each evolution stage: BASE_HP, then +HP_PER_STAGE for each evolution. */
export const BASE_HP = 70;
export const HP_PER_STAGE = 20;

/** Starters that were swapped for another (old id -> new id), so saves keep what they earned. */
export const RENAMED_STARTERS = { shaymin: 'virizion' };
