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
// Fire's shape (3 attacks, an Iron Wave): with a 4th Thunder Shock instead of Eerie Impulse it trailed ~25 points in the bot
const ELECTRIC_DECK = ['thunder-shock', 'thunder-shock', 'thunder-shock', 'eerie-impulse', 'magnet-rise', 'magnet-rise', 'magnet-rise', 'magnet-rise', 'spark', 'thunder-wave'];
// Fire's shape from the start (Electric's lesson): 3 attacks, an Iron Wave, 4 blocks, the Bash and a second signature
const ICE_DECK = ['powder-snow', 'powder-snow', 'powder-snow', 'frost-armor', 'frost-shield', 'frost-shield', 'frost-shield', 'frost-shield', 'icy-wind', 'ice-shard'];
// Fire's shape from the start: 3 attacks, an Iron Wave (Vital Throw), 4 blocks, the Bash and a second signature
const FIGHTING_DECK = ['rock-smash', 'rock-smash', 'rock-smash', 'vital-throw', 'mat-block', 'mat-block', 'mat-block', 'mat-block', 'low-kick', 'mach-punch'];
// Fire's shape: 3 attacks, an Iron Wave (Sand Attack), 4 blocks, the Bash (Bulldoze) and a second signature (Dig)
const GROUND_DECK = ['mud-shot', 'mud-shot', 'mud-shot', 'sand-attack', 'sand-veil', 'sand-veil', 'sand-veil', 'sand-veil', 'bulldoze', 'dig'];
// Fire's shape: 3 attacks, an Iron Wave (Aerial Ace), 4 blocks, the Bash (Wing Attack) and a second signature (Peck)
const FLYING_DECK = ['gust', 'gust', 'gust', 'aerial-ace', 'feather-guard', 'feather-guard', 'feather-guard', 'feather-guard', 'wing-attack', 'peck'];
// Fire's shape: 3 attacks, an Iron Wave (Feint Attack), 4 blocks, the Bash (Snatch) and a second signature (Lash Out)
const DARK_DECK = ['bite', 'bite', 'bite', 'feint-attack', 'obstruct', 'obstruct', 'obstruct', 'obstruct', 'snatch', 'lash-out'];
const PSYCHIC_DECK = ['psywave', 'psywave', 'psywave', 'psywave', 'psychic-guard', 'psychic-guard', 'psychic-guard', 'psychic-guard', 'psychic-confusion', 'psystrike'];

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
     them a title and a Super Saiyan-style aura (spriteUrl()); their stage 2 `-shiny` id is only read for its cry, which drops the suffix. */
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
     A finished Pokédex, a lean deck, no rest, a flood of Tide, 3 Water starters. */
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
    blurb: 'A legendary colt of the rivers, for wins with 3 different Water starters. Same water moves as Squirtle.',
    deck: WATER_DECK,
  },
  {
    // a green sky dragon: Grass had the fewest legendaries (2, against Fire's 6 and Water's 6). `safariPrize` keeps it out
    // of the Safari's daily starters (safariStarters()), which were dealt before it existed.
    id: 'rayquaza', type: 'grass', skinOf: 'bulbasaur', legendary: true, safariPrize: true,
    line: [
      { id: 'rayquaza',        name: 'Rayquaza' },
      { id: 'rayquaza',        name: 'Awakened Rayquaza' },
      { id: 'rayquaza-shiny',  name: 'Ascendant Rayquaza' },
    ],
    blurb: 'The legendary lord of the sky, drawn by a Safari Pokédex with every Pokémon caught. Same grass moves as Bulbasaur.',
    deck: GRASS_DECK,
  },

   /* ---------- the secret final one ----------
      Hidden as "???" until you unlock every other starter. Its dedicated Psychic
      deck and Pressure Ability make it the game's fourth playable character. */
  {
    id: 'mewtwo', type: 'psychic', legendary: true, secret: true,
    line: [
      { id: 'mewtwo',        name: 'Mewtwo' },
      { id: 'mewtwo',        name: 'Awakened Mewtwo' },
      { id: 'mewtwo-shiny',  name: 'Ascendant Mewtwo' },
    ],
    blurb: 'A force of pure psychic power. Builds strength, raises barriers, and bends the enemy’s mind.',
    deck: PSYCHIC_DECK,
  },
];

/* The Safari's duo pool (docs/duo-design.md section 3): a new type's starters play only in a Duo Run, once caught. They
   stay out of STARTERS (the character select, the Game Corner, the statues, every "own every starter" count) and are
   only looked up by id. Every one is a 3-stage line (the user's call). */
export const DUO_STARTERS = [
  {
    id: 'shinx', type: 'electric', duoOnly: true,
    line: [
      { id: 'shinx',  name: 'Shinx' },
      { id: 'luxio',  name: 'Luxio' },
      { id: 'luxray', name: 'Luxray' },
    ],
    blurb: 'Quick and shocking. Builds Static until the enemy is Paralyzed, and switches out in a flash.',
    deck: ELECTRIC_DECK,
  },
  // Shinx's deck under other looks, as the Gen 2 / 3 starters are Charmander's (session 4)
  {
    id: 'mareep', type: 'electric', duoOnly: true, skinOf: 'shinx',
    line: [
      { id: 'mareep', name: 'Mareep' },
      { id: 'flaaffy', name: 'Flaaffy' },
      { id: 'ampharos', name: 'Ampharos' },
    ],
    blurb: 'Woolly and bright. Its fleece stores static for the enemy, and its tail lights the way.',
    deck: ELECTRIC_DECK,
  },
  {
    id: 'pichu', type: 'electric', duoOnly: true, skinOf: 'shinx',
    line: [
      { id: 'pichu', name: 'Pichu' },
      { id: 'pikachu', name: 'Pikachu' },
      { id: 'raichu', name: 'Raichu' },
    ],
    blurb: 'Small but sparky. Builds Static fast, then tags out before the shock bites back.',
    deck: ELECTRIC_DECK,
  },
  {
    id: 'elekid', type: 'electric', duoOnly: true, skinOf: 'shinx',
    line: [
      { id: 'elekid', name: 'Elekid' },
      { id: 'electabuzz', name: 'Electabuzz' },
      { id: 'electivire', name: 'Electivire' },
    ],
    blurb: 'Arms whirling, it charges up between punches and lets the PP pile up for a big one.',
    deck: ELECTRIC_DECK,
  },
  {
    id: 'tynamo', type: 'electric', duoOnly: true, skinOf: 'shinx',
    line: [
      { id: 'tynamo', name: 'Tynamo' },
      { id: 'eelektrik', name: 'Eelektrik' },
      { id: 'eelektross', name: 'Eelektross' },
    ],
    blurb: 'Slips in and out of the fight like an eel, leaving every foe crackling.',
    deck: ELECTRIC_DECK,
  },
  // every other 3-stage line that fits a new type, enemies and all (the user's call, 2026-10-20: "add as many as you think can be starter skins")
  {
    id: 'magnemite', type: 'electric', duoOnly: true, skinOf: 'shinx',
    line: [
      { id: 'magnemite', name: 'Magnemite' },
      { id: 'magneton', name: 'Magneton' },
      { id: 'magnezone', name: 'Magnezone' },
    ],
    blurb: 'Drifts on its own magnetism, humming near anything with a charge. Join enough of them and they pull the whole fight their way.',
    deck: ELECTRIC_DECK,
  },
  {
    id: 'vanillite', type: 'ice', duoOnly: true,
    line: [
      { id: 'vanillite', name: 'Vanillite' },
      { id: 'vanillish', name: 'Vanillish' },
      { id: 'vanilluxe', name: 'Vanilluxe' },
    ],
    blurb: 'Cold to the core. Frostbite makes every hit bite deeper, and Hail follows wherever it goes.',
    deck: ICE_DECK,
  },
  // Vanillite's deck under another look, as Electric's four are Shinx's (session 6)
  {
    id: 'swinub', type: 'ice', duoOnly: true, skinOf: 'vanillite',
    line: [
      { id: 'swinub', name: 'Swinub' },
      { id: 'piloswine', name: 'Piloswine' },
      { id: 'mamoswine', name: 'Mamoswine' },
    ],
    blurb: 'Snout down in the snow, it plods on through any blizzard and tusks its way through the rest.',
    deck: ICE_DECK,
  },
  {
    id: 'timburr', type: 'fighting', duoOnly: true,
    line: [
      { id: 'timburr', name: 'Timburr' },
      { id: 'gurdurr', name: 'Gurdurr' },
      { id: 'conkeldurr', name: 'Conkeldurr' },
    ],
    blurb: 'Hauls a log into every fight. Chains jabs into throws, hits back when it\'s hit, and fights harder when it hurts.',
    deck: FIGHTING_DECK,
  },
  // Timburr's deck under another look, as Swinub is Vanillite's (session 8)
  {
    id: 'machop', type: 'fighting', duoOnly: true, skinOf: 'timburr',
    line: [
      { id: 'machop', name: 'Machop' },
      { id: 'machoke', name: 'Machoke' },
      { id: 'machamp', name: 'Machamp' },
    ],
    blurb: 'Trains on the mountain every day it can. More arms each time it evolves, and every one of them punching.',
    deck: FIGHTING_DECK,
  },
  {
    id: 'poliwag', type: 'fighting', duoOnly: true, skinOf: 'timburr',
    line: [
      { id: 'poliwag', name: 'Poliwag' },
      { id: 'poliwhirl', name: 'Poliwhirl' },
      { id: 'poliwrath', name: 'Poliwrath' },
    ],
    blurb: 'Its spiral belly sets foes swaying. It swims like a pro, and by the end it punches like one too.',
    deck: FIGHTING_DECK,
  },
  {
    id: 'ralts', type: 'fighting', duoOnly: true, skinOf: 'timburr',
    line: [
      { id: 'ralts', name: 'Ralts' },
      { id: 'kirlia', name: 'Kirlia' },
      { id: 'gallade', name: 'Gallade' },
    ],
    blurb: 'Senses what its trainer feels and hides behind them. Grows a blade on each arm to guard them instead.',
    deck: FIGHTING_DECK,
  },
  {
    id: 'trapinch', type: 'ground', duoOnly: true,
    line: [
      { id: 'trapinch', name: 'Trapinch' },
      { id: 'vibrava', name: 'Vibrava' },
      { id: 'flygon', name: 'Flygon' },
    ],
    blurb: 'Waits at the bottom of its sand pit. Digs in to strike next turn, opens faults that swallow the weak, and calls up sandstorms.',
    deck: GROUND_DECK,
  },
  // Trapinch's deck under another look, as Machop is Timburr's (session 10)
  {
    id: 'rhyhorn', type: 'ground', duoOnly: true, skinOf: 'trapinch',
    line: [
      { id: 'rhyhorn', name: 'Rhyhorn' },
      { id: 'rhydon', name: 'Rhydon' },
      { id: 'rhyperior', name: 'Rhyperior' },
    ],
    blurb: 'Charges in a straight line until it forgets why. Its hide shrugs off a landslide, and its horn drills through bedrock.',
    deck: GROUND_DECK,
  },
  {
    id: 'gible', type: 'ground', duoOnly: true, skinOf: 'trapinch',
    line: [
      { id: 'gible', name: 'Gible' },
      { id: 'gabite', name: 'Gabite' },
      { id: 'garchomp', name: 'Garchomp' },
    ],
    blurb: 'Lives in warm caves and bites anything that moves. Grows into a land shark that outruns a jet.',
    deck: GROUND_DECK,
  },
  {
    id: 'geodude', type: 'ground', duoOnly: true, skinOf: 'trapinch',
    line: [
      { id: 'geodude', name: 'Geodude' },
      { id: 'graveler', name: 'Graveler' },
      { id: 'golem', name: 'Golem' },
    ],
    blurb: 'Lies on mountain paths looking like a rock until someone trips on it. Rolls downhill as a boulder by the end.',
    deck: GROUND_DECK,
  },
  {
    id: 'nidoranm', type: 'ground', duoOnly: true, skinOf: 'trapinch',
    line: [
      { id: 'nidoranm', name: 'Nidoran♂' },
      { id: 'nidorino', name: 'Nidorino' },
      { id: 'nidoking', name: 'Nidoking' },
    ],
    blurb: 'Its ears catch every sound and its horn is poisoned. Grows into a king whose tail can snap a tree.',
    deck: GROUND_DECK,
  },
  {
    id: 'nidoranf', type: 'ground', duoOnly: true, skinOf: 'trapinch',
    line: [
      { id: 'nidoranf', name: 'Nidoran♀' },
      { id: 'nidorina', name: 'Nidorina' },
      { id: 'nidoqueen', name: 'Nidoqueen' },
    ],
    blurb: 'Small and careful, its barbs keep foes back. Grows into a queen who guards her nest in armour.',
    deck: GROUND_DECK,
  },
  {
    id: 'starly', type: 'flying', duoOnly: true,
    line: [
      { id: 'starly', name: 'Starly' },
      { id: 'staravia', name: 'Staravia' },
      { id: 'staraptor', name: 'Staraptor' },
    ],
    blurb: 'Small, loud and never still. Dodges what it can, rides the wind for more cards, and hits hardest with nothing left in hand.',
    deck: FLYING_DECK,
  },
  // Starly's deck under two other looks, as Rhyhorn is Trapinch's (session 12)
  {
    id: 'pidgey', type: 'flying', duoOnly: true, skinOf: 'starly',
    line: [
      { id: 'pidgey', name: 'Pidgey' },
      { id: 'pidgeotto', name: 'Pidgeotto' },
      { id: 'pidgeot', name: 'Pidgeot' },
    ],
    blurb: 'Would rather flutter off than fight. Kicks up sand to blind a foe, and its wings beat up a gale that carries it for miles.',
    deck: FLYING_DECK,
  },
  {
    id: 'pidove', type: 'flying', duoOnly: true, skinOf: 'starly',
    line: [
      { id: 'pidove', name: 'Pidove' },
      { id: 'tranquill', name: 'Tranquill' },
      { id: 'unfezant', name: 'Unfezant' },
    ],
    blurb: 'Follows the flock and always finds its way home. Light on its feet, it travels with nothing to weigh it down.',
    deck: FLYING_DECK,
  },
  {
    id: 'togepi', type: 'flying', duoOnly: true, skinOf: 'starly',
    line: [
      { id: 'togepi', name: 'Togepi' },
      { id: 'togetic', name: 'Togetic' },
      { id: 'togekiss', name: 'Togekiss' },
    ],
    blurb: 'Hatched full of happiness and shares it with anyone kind. One day it spreads its wings to share it further.',
    deck: FLYING_DECK,
  },
  {
    id: 'zubat', type: 'flying', duoOnly: true, skinOf: 'starly',
    line: [
      { id: 'zubat', name: 'Zubat' },
      { id: 'golbat', name: 'Golbat' },
      { id: 'crobat', name: 'Crobat' },
    ],
    blurb: 'Has no eyes and finds its way by sound. Flies through dark caves faster with every pair of wings it grows.',
    deck: FLYING_DECK,
  },
  {
    id: 'hoppip', type: 'flying', duoOnly: true, skinOf: 'starly',
    line: [
      { id: 'hoppip', name: 'Hoppip' },
      { id: 'skiploom', name: 'Skiploom' },
      { id: 'jumpluff', name: 'Jumpluff' },
    ],
    blurb: 'So light the wind carries it off. Rides the breeze and drifts down wherever its spores should grow.',
    deck: FLYING_DECK,
  },
  {
    id: 'dratini', type: 'flying', duoOnly: true, skinOf: 'starly',
    line: [
      { id: 'dratini', name: 'Dratini' },
      { id: 'dragonair', name: 'Dragonair' },
      { id: 'dragonite', name: 'Dragonite' },
    ],
    blurb: 'Sheds its skin as it grows, and was thought a myth. Ends as a gentle dragon that flies round the world.',
    deck: FLYING_DECK,
  },
  {
    id: 'bagon', type: 'flying', duoOnly: true, skinOf: 'starly',
    line: [
      { id: 'bagon', name: 'Bagon' },
      { id: 'shelgon', name: 'Shelgon' },
      { id: 'salamence', name: 'Salamence' },
    ],
    blurb: 'Dreams of flying and headbutts cliffs trying. Its wish comes true at last, as a dragon that soars.',
    deck: FLYING_DECK,
  },
  {
    id: 'deino', type: 'dark', duoOnly: true,
    line: [
      { id: 'deino', name: 'Deino' },
      { id: 'zweilous', name: 'Zweilous' },
      { id: 'hydreigon', name: 'Hydreigon' },
    ],
    blurb: 'Bites first and finds out what it bit later. Steals what you were saving, punishes every swing, and fights in disguise.',
    deck: DARK_DECK,
  },
  // Deino's deck under another look, as Pidgey is Starly's (session 14)
  {
    id: 'sandile', type: 'dark', duoOnly: true, skinOf: 'deino',
    line: [
      { id: 'sandile', name: 'Sandile' },
      { id: 'krokorok', name: 'Krokorok' },
      { id: 'krookodile', name: 'Krookodile' },
    ],
    blurb: 'Lies buried in the sand with only its eyes showing. Waits for a foe to swing, then snaps up whatever it dropped.',
    deck: DARK_DECK,
  },
  {
    id: 'larvitar', type: 'dark', duoOnly: true, skinOf: 'deino',
    line: [
      { id: 'larvitar', name: 'Larvitar' },
      { id: 'pupitar', name: 'Pupitar' },
      { id: 'tyranitar', name: 'Tyranitar' },
    ],
    blurb: 'Eats its way through mountains of soil. By its last form it can knock one down.',
    deck: DARK_DECK,
  },
  {
    id: 'seedot', type: 'dark', duoOnly: true, skinOf: 'deino',
    line: [
      { id: 'seedot', name: 'Seedot' },
      { id: 'nuzleaf', name: 'Nuzleaf' },
      { id: 'shiftry', name: 'Shiftry' },
    ],
    blurb: 'Hangs from a branch passing for an acorn. Grows a long nose, then leaf fans that whip up storms.',
    deck: DARK_DECK,
  },
];

export const STARTERS_BY_ID = Object.fromEntries([...STARTERS, ...DUO_STARTERS].map(s => [s.id, s]));

/** Path to one of a starter's images at a given evolution stage. kind is 'front' or 'back'. `shiny` defaults to
    whether its shiny colours are switched on (the Game Corner sells them). */
export function spriteUrl(starter, kind, stage = 0, shiny = shinyOn(starter.id)) {
  const id = starter.line[stage].id;
  // a legendary keeps its sprite and its colours (shiny only if bought), and powers up instead, Super Saiyan style
  // (tools/legendary-aura.py): a flame aura at stage 1 (`-awakened`), bigger with lightning at stage 2 (`-ascendant`)
  if (starter.legendary && stage > 0) {
    const base = id.replace(/-shiny$/, '');
    return `assets/pokemon/${base}${shiny ? '-shiny' : ''}-${stage === starter.line.length - 1 ? 'ascendant' : 'awakened'}-${kind}.gif`;
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
