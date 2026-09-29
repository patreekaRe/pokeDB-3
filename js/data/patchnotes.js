/* ============================================================
   patchnotes.js  -  the title's version tag and its Patch notes
   window (js/patchnotes.js). Newest patch first: a new patch is
   one more entry at the top, and the tag shows its version.
   Each section is [icon, heading, lines]; every emoji needs an
   icon in js/icons.js.
   ============================================================ */

export const PATCHES = [
  {
    version: '0.9',
    name: 'Almost Complete',
    date: '2026-09-28',
    sections: [
      ['🔥', 'Pick a starter, build a deck', [
        'Choose Charmander, Bulbasaur or Squirtle and fight with a deck of moves, Slay the Spire style: 3 PP a turn, draw 5, play what you can.',
        'Fire burns and hits recklessly, Grass drains and seeds, Water builds Tide and cashes it in. Each type has three ways to build.',
        'Every starter has an Ability (Blaze, Overgrow, Torrent) and evolves after each boss.',
      ]],
      ['🗺️', 'The journey', [
        'Three biomes, each ten floors and a boss: Whispering Clearing, Overgrown Shrine and Ember Wastes.',
        'Each biome changes as you go, with three places, a landmark per floor, and a boss arena. Day and night follow your clock.',
        'Pick your route on the map: wild fights, Alphas, ? events, Poké Marts, Pokémon Centers and a treasure grotto.',
        'Plan ahead mid-fight: the Bag\'s Map pocket shows the map from any battle or reward.',
      ]],
      ['❓', 'Events and stops', [
        'Ten events: Berry Tree, Move Tutor, Move Deleter, Item Ball, Hot Spring, Team Rocket, Day Care, Wishing Well, Fan Club and Shrine.',
        'Spend Pokédollars at the Poké Mart on moves, items and relics, or pay to forget a move.',
        'Rest at a Pokémon Center, or power up a move with PP Up.',
      ]],
      ['⭐', 'Trainer Levels', [
        'Win a run to unlock the next Trainer Level, up to Level 5. Each one adds a rule that makes runs harder.',
        'Win on Level 5 to enter the Hall of Fame: a gold pedestal, fireworks, its own song, and that starter\'s shiny.',
        'Every win goes in the Record Book with your deck, relics and the run\'s numbers.',
      ]],
      ['🏆', 'For completionists', [
        'Unlock all 30 starters: 12 from later generations, and 15 legendaries earned through achievements.',
        'Collect a shiny of every starter from the Game Corner, or earn one with a Level 5 win.',
        'Complete Pokédex research on all 55 Pokémon for PokéCoins, page perks (Lv 2 once a page is fully researched) and the Silph Scope.',
        'Find every move, relic and item in the Index, and put a gold star on every starter.',
      ]],
      ['🎰', 'Between runs', [
        'Spend PokéCoins at the Game Corner on starters, perks and shinies.',
        'The Collection holds the Pokédex, Index, Stats, Achievements, Record Book and Hall of Fame.',
        'Sign in from the Poké Ball menu to keep one save on your phone and PC.',
      ]],
      ['🔒', 'Coming in v1.0', [
        'Mewtwo, the last secret starter, with a deck of its own.',
        'A final balance pass, if the types need it.',
      ]],
    ],
  },
];

/** What's in the game, as of the newest patch. */
export const IN_THE_GAME = [
  ['🔥', '30 starters', 'Charmander, Bulbasaur and Squirtle, 12 more from later generations, and 15 legendaries to earn. One of them is a secret.'],
  ['🃏', '242 moves', 'About 74 each for Fire, Grass and Water, plus 21 Neutral moves any type can learn. Every one can be powered up with PP Up.'],
  ['🗺️', '3 biomes', 'Whispering Clearing, Overgrown Shrine and Ember Wastes, each with wild Pokémon, Alphas and a boss.'],
  ['💎', '58 relics', 'Starter Abilities, relics for each type and boss relics that give extra PP with a catch.'],
  ['🧴', '20 items', 'Potions, battle items and one for each type, carried in your Bag.'],
  ['❓', '10 events', 'Berry Tree, Move Tutor, Move Deleter, Item Ball, Hot Spring, Team Rocket, Day Care, Wishing Well, Fan Club and Shrine.'],
  ['🏪', 'Poké Mart & Center', 'Spend Pokédollars on moves, items and relics, or rest and power up a move at the Pokémon Center.'],
  ['⭐', '6 Trainer Levels', 'Level 0 to 5, each adding a new rule. Win to unlock the next.'],
  ['📕', 'Pokédex', '55 entries over three pages. Research each Pokémon for PokéCoins, page perks and a Silph Scope.'],
  ['🎰', 'Game Corner', 'Spend PokéCoins on 6 starters, 9 perks and a shiny for every starter.'],
  ['☁️', 'Cloud save', 'Sign in from the Poké Ball menu to play on your phone and PC with one save.'],
];
