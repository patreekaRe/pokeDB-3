/* ============================================================
   patchnotes.js  -  the title's version tag and its Patch notes
   window (js/patchnotes.js). Newest patch first: a new patch is
   one more entry at the top, and the tag shows its version.
   Each section is [icon, heading, lines]; every emoji needs an
   icon in js/icons.js.
   ============================================================ */

export const PATCHES = [
  {
    version: '1.0',
    name: 'The Journey Begins',
    date: '2026-09-28',
    sections: [
      ['🏆', 'Hall of Fame & Record Book', [
        'Every won run is kept in the Record Book: your deck, relics, items and the run\'s numbers.',
        'Win on Trainer Level 5 to enter the Hall of Fame: a gold pedestal, fireworks and its own song.',
        'A Level 5 win also gives that starter\'s shiny, a gold star on its portrait and a 500 PokéCoin jackpot once per type.',
      ]],
      ['🗺️', 'A world that changes', [
        'Each biome is now three places and a boss arena, from the Clearing\'s meadow to its ancient giant tree.',
        'Every floor has a landmark of its own, and the scenery builds up as you near the boss.',
        'Day and night follow your clock: dawn, day, dusk and night each have their own light.',
      ]],
      ['✨', 'Legendaries', [
        'Legendaries power up as they grow instead of changing: a blazing aura, then lightning and a shower of their type.',
        'Entei, Celebi and Kyogre now unlock with a Level 3 win.',
        'Keldeo needs wins with 3 different Water starters; Victini a win with 15 cards or fewer on Level 3 or higher.',
        'The flying legendaries cross the title sky, in colour once they\'re yours.',
      ]],
      ['⚔️', 'Battles', [
        'Wild Pokémon are dealt like a deck, so a route rarely meets the same one twice.',
        'Look-alike cards got jobs of their own, and Brine blocks with the Tide it spends.',
        'Relic rewards burst out in a flash of light and float up, like the treasure room\'s.',
      ]],
      ['📖', 'Quality of life', [
        'The map shows the floor you\'re on, and so does a saved run on the title screen.',
        'Tap your Pokémon on the map to call it back into its Poké Ball, and again to send it out.',
        'The Index marks a move, relic or item found only once it has really been yours.',
        'New on the title screen: How to play, Refresh (fetches the newest version) and these patch notes.',
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
