/* ============================================================
   patchnotes.js  -  the title's version tag and its Patch notes
   window (js/patchnotes.js). Newest patch first: a new patch is
   one more entry at the top, and the tag shows its version.
   Each section is [icon, heading, lines]; every emoji needs an
   icon in js/icons.js.
   ============================================================ */

export const PATCHES = [
  {
    version: '1.1',
    name: 'Many Roads',
    date: '2026-10-08',
    sections: [
      ['🗺️', 'New roads', [
        'Three new biomes: the Sunken Ruins, a temple drowned in a jungle lagoon; the Thornwood Jungle, a forest older than the Shrine; and the Sunscorch Savanna, grassland burning round one watering hole.',
        'Win on Trainer Level 2 or higher with Fire, Grass and Water to open them. After a boss you reach a crossroads and choose your road.',
        'Each run offers different roads, the ones you haven\'t walked first. Every new biome has its own wild Pokémon, Alphas, bosses, music for the map and a Pokédex page worth 500 PokéCoins.',
        'Between biomes your Pokémon now walks the road from one to the next, past a legendary in the sky if you\'re lucky.',
      ]],
      ['🗼', 'The Sky Pillar', [
        'A new game mode: climb 100 floors, with a guardian every 10 and Rayquaza at the top. One starter a week, the same for everyone, and a weekly leaderboard.',
        'No perks on the climb. Pick one of three augments at the start and after every guardian: 113 of them, from Silver to Prismatic, some with a catch, and six sets that grow stronger together.',
        'Practice any time with any starter you own (but Mewtwo).',
      ]],
      ['🏆', 'Badges and the Trainer Card', [
        '130 badges to earn across the whole game, from beating each boss to catching every rare in the Safari Zone. Your old wins already count.',
        'Your Trainer Card shows them in a Badge Case, with your name, play time and a partner Pokémon of your choice.',
      ]],
      ['📕', 'The game is a Pokédex', [
        'PokéDB is now Poké Deckbound. The whole game runs on the Pokédex: it powers on at the title and opens on every map.',
        'Its home screen holds every app: the Pokédex, Moves, Relics, Items, Stats, Achievements, the Record Book, the Hall of Fame and the Game Corner.',
        'How to play is rewritten as an app, and new moves, relics and items leave a "!" until you\'ve looked at them.',
      ]],
      ['✨', 'A new look', [
        'Hybrid scenery: every biome keeps its pixel art, now with soft light over it, glowing lanterns, crystals and lava, and a dawn and dusk glow. Switch back to Pixel in Settings.',
        'Smooth icons through the menus, and the Pokédex in six colours.',
      ]],
      ['⚙️', 'Settings and fixes', [
        'Settings is a proper options screen: music, effects and cries volumes, text speed, battle speed, reduced flashing and shake, and vibration.',
        'Every window closes on a tap outside it, and every confirm button looks and works the same.',
        'Safari Zone: every run has 30 Safari Balls, and replays after the free daily try need a 100-coin Day Pass.',
      ]],
    ],
  },
  {
    version: '1.0',
    name: 'The Last Energy',
    date: '2026-10-02',
    sections: [
      ['🔒', 'The Sealed Gate', [
        'Something is sealed below the three biomes, and its energy is why the wild Pokémon are so fierce.',
        'Every run you win strikes the Sealed Gate after the win: hold the strike card to charge it, let go to throw. Higher Trainer Levels hit harder.',
        'The gate cracks, its chains snap and a shape stirs behind it. Only a Trainer Level 5 win can break it.',
      ]],
      ['🔮', 'Mewtwo', [
        'Break the gate to free Mewtwo, the last secret starter: a Psychic deck of its own (Force, Barrier, Mind Games) and the Pressure Ability.',
        'Mewtwo is its own game mode, with no Trainer Level: it shreds the three biomes on one fast road each, then goes deeper.',
        'Once broken, the open gate stands on the title screen: tap it to set out with Mewtwo.',
      ]],
      ['💎', 'The Crystal Depths', [
        'A fourth biome only Mewtwo can enter: the Cave Mouth, the Crystal Halls, the Deep Core and the Energy Well.',
        '12 wild cave Pokémon and 3 Alphas, some with traits that punish attacks, Powers or long turns.',
        'At the bottom waits Eternatus, the final boss. When it falls, the sky splits and it rises again as Eternamax.',
      ]],
      ['🏆', 'The ending', [
        'Beat Eternatus to become Champion of the Depths: your own Hall of Fame in the cavern, then the credits.',
        'Champions of the Depths stand in the Hall of Fame and the Record Book in gold and violet.',
        'The Crystal Depths get a Pokédex page of their own. Complete it to unlock shiny Mewtwo, which can\'t be bought.',
        'Once Eternatus is beaten it crosses the title screen\'s sky now and then, and an achievement pays 1000 PokéCoins.',
      ]],
      ['🌿', 'The Safari Zone', [
        'Beat every Pokémon in all three biomes to open a daily run, the same for everyone: today\'s starter through three Safari areas.',
        'Throw Poké Balls at wild Pokémon in any turn. 514 Pokémon to catch, each with its own signature move.',
        'The first try of the day counts for the leaderboard; after it, the Safari window and the map say when you\'re on a replay.',
        'Fill the Safari Pokédex to unlock Rayquaza.',
      ]],
      ['🥋', 'Chad Master Kenmatta', [
        'Challenge the Move Tutor himself to a boss fight in his dojo, for his Mata-Mindset relic.',
        'Beat him three times and his dojo shows on every map.',
      ]],
      ['📊', 'Final balance pass', [
        'Fire, Grass and Water were checked at Trainer Levels 0, 3 and 5: all three are level, so they stay as they are.',
        'Eternatus and Eternamax hit 8 harder and have 30% more HP: Mewtwo was winning almost every run, and the last fight should be a real one.',
      ]],
    ],
  },
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
        'Each boss arena comes alive before the fight: the ancient tree wakes, the Shrine summons its spirits, the Wastes erupt.',
        'Arriving in the Whispering Clearing plays its own intro: drop through the clouds, meet its wild Pokémon, and see the Ancient Tree waiting.',
        'Each new place in the Clearing (Forest Edge, Deep Woods) gets a short intro as you walk on towards the Ancient Tree. Pokémon you have met show in colour in the intro.',
        'Pick your route on the map: wild fights, Alphas, ? events, Poké Marts, Pokémon Centers and a treasure grotto.',
        'Plan ahead mid-fight: the Bag\'s Map pocket shows the map from any battle or reward.',
        'Battle, map and victory music now loop seamlessly instead of stopping and starting the song over.',
        'Beating an Alpha, Team Rocket or a boss plays Red and Blue\'s trainer victory theme.',
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
        'The character select shows how many runs each Pokémon has won, on its portrait and beside its HP.',
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
  ['🔥', '31 starters', 'Charmander, Bulbasaur and Squirtle, 12 more from later generations, 15 legendaries to earn, and Mewtwo behind the Sealed Gate.'],
  ['🃏', '310 moves', 'About 74 each for Fire, Grass and Water, 68 Psychic moves for Mewtwo, and 21 Neutral moves any type can learn. Every one can be powered up with PP Up.'],
  ['🗺️', '7 biomes', 'Whispering Clearing, Overgrown Shrine and Ember Wastes, the Sunken Ruins, Thornwood Jungle and Sunscorch Savanna on the roads that branch off them, and the Crystal Depths for Mewtwo alone.'],
  ['💎', '59 relics', 'Starter Abilities, relics for each type and boss relics that give extra PP with a catch.'],
  ['🧴', '20 items', 'Potions, battle items and one for each type, carried in your Bag.'],
  ['❓', '10 events', 'Berry Tree, Move Tutor, Move Deleter, Item Ball, Hot Spring, Team Rocket, Day Care, Wishing Well, Fan Club and Shrine.'],
  ['🏪', 'Poké Mart & Center', 'Spend Pokédollars on moves, items and relics, or rest and power up a move at the Pokémon Center.'],
  ['⭐', '6 Trainer Levels', 'Level 0 to 5, each adding a new rule. Win to unlock the next, and strike the Sealed Gate harder.'],
  ['📕', 'Pokédex', '125 entries over seven pages. Research each Pokémon for PokéCoins, page perks and a Silph Scope.'],
  ['🗼', 'Sky Pillar', 'A 100-floor climb with a new starter every week, 113 augments and a weekly leaderboard.'],
  ['🏆', '130 badges', 'Earned all over the game and kept in your Trainer Card\'s Badge Case.'],
  ['🌿', 'Safari Zone', 'A daily run, the same for everyone, with 514 Pokémon to catch over six areas and a leaderboard.'],
  ['🎰', 'Game Corner', 'Spend PokéCoins on 6 starters, 9 perks, a shiny for every starter but Mewtwo, and Poké Balls.'],
  ['☁️', 'Cloud save', 'Sign in from the Pokédex\'s Settings to play on your phone and PC with one save.'],
];
