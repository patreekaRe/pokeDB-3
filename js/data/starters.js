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

   Legendaries (Moltres, Entei, Ho-Oh...) don't evolve into a different
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

const FIRE_DECK  = ['ember', 'ember', 'ember', 'flame-body', 'flame-wall', 'flame-wall', 'flame-wall', 'flame-wall', 'scorch', 'will-o-wisp'];
const GRASS_DECK = ['vine-whip', 'vine-whip', 'vine-whip', 'vine-whip', 'cotton-guard', 'block', 'block', 'block', 'seed-bomb', 'absorb'];
const WATER_DECK = ['water-gun', 'water-gun', 'water-gun', 'water-pulse', 'withdraw', 'withdraw', 'withdraw', 'withdraw', 'bubble', 'dive'];

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
    blurb: 'Tough shell. Builds up the Tide, then crashes it down in one big wave.',
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

  /* ---------- legendaries earned by the hardest goals (step 9b) ----------
     A Level 3 win per type (Entei / Celebi / Kyogre; Moltres / Virizion / Suicune take Level 2), then a finished Pokédex
     page per biome (Ho-Oh / Lugia / Palkia). Same one-sprite line as above. */
  {
    id: 'entei', type: 'fire', skinOf: 'charmander', legendary: true,
    line: [
      { id: 'entei',         name: 'Entei' },
      { id: 'entei',         name: 'Awakened Entei' },
      { id: 'entei-shiny',   name: 'Ascendant Entei' },
    ],
    blurb: 'A legendary volcano\'s heart. Same fire moves as Charmander, earned at the highest Trainer Level.',
    deck: FIRE_DECK,
  },
  {
    id: 'celebi', type: 'grass', skinOf: 'bulbasaur', legendary: true,
    line: [
      { id: 'celebi',        name: 'Celebi' },
      { id: 'celebi',        name: 'Awakened Celebi' },
      { id: 'celebi-shiny',  name: 'Ascendant Celebi' },
    ],
    blurb: 'The legendary voice of the forest. Same grass moves as Bulbasaur, earned at the highest Trainer Level.',
    deck: GRASS_DECK,
  },
  {
    id: 'kyogre', type: 'water', skinOf: 'squirtle', legendary: true,
    line: [
      { id: 'kyogre',        name: 'Kyogre' },
      { id: 'kyogre',        name: 'Awakened Kyogre' },
      { id: 'kyogre-shiny',  name: 'Ascendant Kyogre' },
    ],
    blurb: 'The legendary lord of the sea. Same water moves as Squirtle, earned at the highest Trainer Level.',
    deck: WATER_DECK,
  },
  {
    id: 'hooh', type: 'fire', skinOf: 'charmander', legendary: true,
    line: [
      { id: 'hooh',          name: 'Ho-Oh' },
      { id: 'hooh',          name: 'Awakened Ho-Oh' },
      { id: 'hooh-shiny',    name: 'Ascendant Ho-Oh' },
    ],
    blurb: 'A legendary rainbow flame, drawn by a finished Clearing page. Same fire moves as Charmander.',
    deck: FIRE_DECK,
  },
  {
    id: 'lugia', type: 'water', skinOf: 'squirtle', legendary: true,
    line: [
      { id: 'lugia',         name: 'Lugia' },
      { id: 'lugia',         name: 'Awakened Lugia' },
      { id: 'lugia-shiny',   name: 'Ascendant Lugia' },
    ],
    blurb: 'The legendary guardian of the deep, drawn by a finished Shrine page. Same water moves as Squirtle.',
    deck: WATER_DECK,
  },
  {
    id: 'palkia', type: 'water', skinOf: 'squirtle', legendary: true,
    line: [
      { id: 'palkia',        name: 'Palkia' },
      { id: 'palkia',        name: 'Awakened Palkia' },
      { id: 'palkia-shiny',  name: 'Ascendant Palkia' },
    ],
    blurb: 'A legend that bends space, drawn by a finished Wastes page. Same water moves as Squirtle.',
    deck: WATER_DECK,
  },

  /* ---------- legendaries for mastery goals (step 9c) ----------
     A finished Pokédex, a lean deck, no rest, a flood of Tide, every Water starter. */
  {
    id: 'reshiram', type: 'fire', skinOf: 'charmander', legendary: true,
    line: [
      { id: 'reshiram',      name: 'Reshiram' },
      { id: 'reshiram',      name: 'Awakened Reshiram' },
      { id: 'reshiram-shiny',name: 'Ascendant Reshiram' },
    ],
    blurb: 'The legendary white flame of truth, drawn by a Pokédex with every entry researched. Same fire moves as Charmander.',
    deck: FIRE_DECK,
  },
  {
    id: 'victini', type: 'fire', skinOf: 'charmander', legendary: true,
    line: [
      { id: 'victini',       name: 'Victini' },
      { id: 'victini',       name: 'Awakened Victini' },
      { id: 'victini-shiny', name: 'Ascendant Victini' },
    ],
    blurb: 'The legendary bringer of victory, for a win with a lean deck. Same fire moves as Charmander.',
    deck: FIRE_DECK,
  },
  {
    id: 'heatran', type: 'fire', skinOf: 'charmander', legendary: true,
    line: [
      { id: 'heatran',       name: 'Heatran' },
      { id: 'heatran',       name: 'Awakened Heatran' },
      { id: 'heatran-shiny', name: 'Ascendant Heatran' },
    ],
    blurb: 'A legend of the magma, for a win that never rested. Same fire moves as Charmander.',
    deck: FIRE_DECK,
  },
  {
    id: 'manaphy', type: 'water', skinOf: 'squirtle', legendary: true,
    line: [
      { id: 'manaphy',       name: 'Manaphy' },
      { id: 'manaphy',       name: 'Awakened Manaphy' },
      { id: 'manaphy-shiny', name: 'Ascendant Manaphy' },
    ],
    blurb: 'The legendary prince of the sea, for a tide that rose to 20. Same water moves as Squirtle.',
    deck: WATER_DECK,
  },
  {
    id: 'keldeo', type: 'water', skinOf: 'squirtle', legendary: true,
    line: [
      { id: 'keldeo',        name: 'Keldeo' },
      { id: 'keldeo',        name: 'Awakened Keldeo' },
      { id: 'keldeo-shiny',  name: 'Ascendant Keldeo' },
    ],
    blurb: 'A legendary colt of the rivers, for a win with every Water starter. Same water moves as Squirtle.',
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

/** Path to one of a starter's images at a given evolution stage. kind is 'front' or 'back'. `shiny` defaults to
    whether its shiny colours are switched on (the Game Corner sells them); a legendary's final stage already is. */
export function spriteUrl(starter, kind, stage = 0, shiny = shinyOn(starter.id)) {
  const id = starter.line[stage].id;
  // a legendary keeps its sprite, so each stage turns up the power instead (tools/ascendant-aura.py): Awakened glows
  // (`-awakened`, in its normal or shiny colours), Ascendant blazes in its shiny colours (`-ascendant`), shiny or not
  if (starter.legendary && stage > 0) {
    const base = id.replace(/-shiny$/, '');
    return stage === starter.line.length - 1 ? `assets/pokemon/${base}-ascendant-${kind}.gif`
      : `assets/pokemon/${base}${shiny ? '-shiny' : ''}-awakened-${kind}.gif`;
  }
  return `assets/pokemon/${shiny && !id.endsWith('-shiny') ? `${id}-shiny` : id}-${kind}.gif`;
}

// Data files don't read the save; main.js hands in the check at startup.
let shinyOn = () => false;
export function useShinies(check) { shinyOn = check; }

/** The name of a starter at a given evolution stage (Charmander, Charmeleon...). */
export const stageName = (starter, stage) => starter.line[stage].name;

/** Hit points at each evolution stage: BASE_HP, then +HP_PER_STAGE for each evolution. */
export const BASE_HP = 70;
export const HP_PER_STAGE = 20;

/** Starters that were swapped for another (old id -> new id), so saves keep what they earned. */
export const RENAMED_STARTERS = { shaymin: 'virizion' };
