/* ============================================================
   patchnotes.js  -  the patch notes, read on the Clearing's PC
   (js/pc.js) and the Signs title's version tag (js/patchnotes.js).

   How a change gets in (2026-10-10, the user's ask: no more
   hand-writing a whole patch, and no v1.3, v1.4, v1.5 for every
   small thing):
   1. Every session that ships something a player would notice
      adds ONE line to NEXT: [group, line], the group a GROUPS
      key. Fixes too small to notice get no line.
   2. NEXT shows on the PC as "Since vX" with no "!": players can
      read it, nothing beckons them.
   3. Once NEXT holds RELEASE_AT lines, or a headline (a new
      mode, biome or place) and half that, it becomes a patch:
      move the lines into a new PATCHES entry at the top with the
      next version, a name and the date, and empty NEXT. The PC's
      "!" and the version follow by themselves. tests/
      patchnotes.test.mjs fails past NEXT_MAX, so it can't pile up.
   A patch's notes are grouped under GROUPS' headings in GROUPS'
   order (sectionsOf()); patches before 1.2 keep their own
   hand-made `sections`, each [icon, heading, lines].
   ============================================================ */

/** Where a note goes: its heading, in this order. A new group needs a smooth or pixel icon for its emoji. */
export const GROUPS = {
  hub: ['🌳', 'The Clearing'],
  base: ['🏠', 'Secret Base'],
  mall: ['🏪', 'Poké Mall'],
  pc: ['💻', 'The PC'],
  runs: ['🗺️', 'Runs'],
  battle: ['⚔️', 'Battle'],
  modes: ['🗼', 'Game modes'],
  dex: ['📕', 'Pokédex'],
  music: ['🎵', 'Music'],
  look: ['✨', 'Look'],
  fixes: ['⚙️', 'Settings and fixes'],
};

/** Lines a patch is cut at; a headline feature cuts it at half. */
export const RELEASE_AT = 12;
/** Past this the tests fail: cut a patch. */
export const NEXT_MAX = 20;

/** What has shipped since the newest patch, waiting for the next one: [group, line]. */
export const NEXT = [
  ['fixes', 'Typing your name on a phone no longer brings up the "turn your phone upright" screen: the keyboard made the screen look sideways.'],
  ['dex', 'A Gym Leaders app in the Pokédex: every leader, a silhouette till beaten, who they are, your record against them and their rematch rewards.'],
  ['hub', 'The Clearing is tidied up: the Poké Mall and the Nietos\' house now stand south of the plaza, the PC faces you, the Waystone stands clear of lamp posts, the pond garden sits further south, and a Pokéstop\'s CONTINUE or SET OUT floats over its disc.'],
  ['battle', 'A Gym Leader\'s badge over the arch is shown in full colour before you win it, so you can see what you\'re fighting for.'],
  ['hub', 'The Nietos\' house and Gym Leaders\' visits to your Secret Base are switched off for now. They\'ll be back.'],
  ['fixes', 'A Gym win no longer counts twice after Continue, badges no longer cut iPhone sound, and Main menu leaves the Poké Mall, Secret Base and run rooms cleanly. Three relics on offer float in a triangle, so their names never overlap.'],
  ['runs', 'After a fight and in the Poké Mart, a Bag key lets you check your items and deck, and a found item shows what it does at once, no text to tap through.'],
  ['fixes', 'On a computer or a tablet held sideways, the Poké Mart shows the whole store, picking a card to upgrade or forget keeps the 3D room behind it, running from Team Rocket takes you straight to the map, and the Mart\'s PC no longer hides the cards.'],
  ['hub', 'The Clearing\'s ground now rolls away into the distance, like a little round world.'],
  ['hub', 'The Nietos\' house is now a storybook cottage: a scalloped blue roof, a porch, flower boxes, a picket-fenced garden, baby Linc\'s washing out and a name board you can read.'],
  ['hub', 'The gate out to an adventure is grander: a glowing gold crest, lanterns and banners, and a shimmer you can spot from across the Clearing.'],
];

/** The gateway towns' lines, held back while the towns are off (TOWNS_LIVE in js/data/towns.js): back into NEXT when
    they go live. */
export const TOWN_NOTES = [
  ['runs', 'Lantern Village: on the road into the Shrine you now walk through a whole village laid out like a shrine\'s approach: one wide stone avenue lined with lanterns from the forest up to the torii, a koi pond under a red bridge, autumn maples, a pagoda and a few houses with their names on boards by the door (a house fades while you\'re behind it). Walk into Delibird\'s shop (one item swap), the Dance Theater, and John\'s and Jahmes\'s homes. The request board asks favours across runs that raise the village\'s friendship, and the broken Waystone stands in the plaza at its heart. Its houses wear tiled roofs, the ones you can walk into with gold on the ridge and a crest over the door; John and Jahmes live in grand two-storey manors with gold-leafed upper floors and banners in their colours, home only once you\'ve beaten them. The way out to the Shrine is a great gold-trimmed torii in a lantern-lit glade, a sacred rope and red paper lanterns swaying on it and light glowing up through it.'],
  ['runs', 'Cinder Springs: on the road into the Wastes you now walk through a mining town on a lava field, lava pouring off the crags into a glowing river your road crosses on stone bridges, the broken Waystone on an island in a lava moat, an old mine head and a timber mine gate out. Soak with the Pokémon in the Bathhouse, swap an item at Heatmor\'s Forge, visit Clarence and Shaun in their grand two-storey lodges (Clarence is busy after nine), and help with the town\'s requests to mend its cracked Waystone.'],
  ['runs', 'Driftwood Landing: on the road into the Sunken Ruins you now walk through a fishing village on stilts over the lagoon, its boardwalks ringing a drowned temple\'s island with the broken Waystone at its middle, and out through the temple\'s old stone arch. Swap an item at Pelipper\'s Bait & Tackle, see the lagoon\'s Pokémon in the Aquarium, visit Kayl (and her cats) and Pat on his houseboat (he serenades the moon after ten), and take on the town\'s requests.'],
  ['runs', 'Highbough: on the road into Thornwood you now walk through a village up in the treetops, round platforms on the giant trunks joined by wide rope bridges with railings round every deck, the jungle floor far below in the mist. Its builders are long gone and only ghost Pokémon live there now. Ride up on the lift, swap an item at Mismagius\'s Curio Shop, tiptoe past the ghosts asleep in the Withered Nursery, call on Phil (not after eleven) and Ricky (up gaming with the boys after ten), and help with the requests to mend the broken Waystone on the Great Tree\'s deck.'],
  ['runs', 'Sunwell Bazaar: on the road into the Savanna you now walk through a caravan trading post, one dusty road straight across it past round thatched huts, a market of striped stalls round the broken Waystone, wagons drawn up in a ring and a watering hole with a jetty and a windpump. Trade at Persian\'s Bazaar, meet the caravans\' Pokémon in the Caravanserai, and visit Machew and Jerome at home once you\'ve beaten them.'],
  ['hub', 'The Whispering Clearing is bigger, with a Waystone on the plaza\'s Poké Ball, five crystals circling its tip, one for each town. Hand in a town\'s requests until its Waystone mends and its crystal lights up: tap the Waystone and pick a lit town to travel there from home, buy furniture you can\'t get anywhere else, hand in requests, and invite the townsfolk you chat to home to your Secret Base.'],
];

/** A patch's sections, [icon, heading, lines]: its own, or its notes grouped by GROUPS. */
export function sectionsOf(p) {
  if (p.sections) return p.sections;
  return Object.entries(GROUPS)
    .map(([key, [icon, heading]]) => [icon, heading, p.notes.filter(([g]) => g === key).map(([, line]) => line)])
    .filter(([, , lines]) => lines.length);
}

export const PATCHES = [
  {
    version: '1.18',
    name: 'The New Clearing',
    date: '2026-10-14',
    notes: [
      ['hub', 'The Whispering Clearing is laid out anew: a round plaza, lamp-lit avenues, a ring road, gardens and a pond. A sleeping Waystone stands on the plaza.'],
      ['hub', 'The Nietos have a house in the Clearing, and Kenmatta\'s dojo is going up across from it. Coming soon.'],
      ['runs', 'Beat a Gym Leader 3 times for their signed poster and 5 times for their Gold badge.'],
      ['runs', 'A POKéDEX button on the map opens the page for the biome you\'re in, and the Gym Leader stands over the boss room.'],
      ['mall', 'Squirtle Bubble Shooter plays like Puzzle Bobble: 20 hand-made boards and a ceiling that lowers.'],
      ['fixes', 'Phones no longer reload the game mid-run, Main menu on the map asks first, and closing the game in a Gym brings you back to it.'],
    ],
  },
  {
    version: '1.17',
    name: 'The Gym Badge',
    date: '2026-10-13',
    notes: [
      ['runs', 'Earning a Gym badge is a moment: tap it on the arch and it spins, then slams down with a flash. You get it on every win, counted.'],
      ['runs', 'Gym Leaders slide in to talk and throw their Poké Ball themselves, and your Pokémon evolves in the gym after the badge.'],
      ['look', 'Every Gym is grander: a stone hall of columns, giant statues of the leader\'s best Pokémon and a great arch with their name.'],
      ['base', 'Every wall piece is properly 3D, and things on counters and desks are life size.'],
      ['look', 'Evolutions play out in full, and SKIP is easier to find when you pick a move.'],
    ],
  },
  {
    version: '1.16',
    name: 'Gym Leaders',
    date: '2026-10-13',
    notes: [
      ['runs', 'Gym Leaders: thirteen of them, two or three a biome, in front of its boss. Walk up their 3D gym, hear them out and win their badge.'],
      ['runs', 'Each has their own look, speeches and badge, and Phil is possessed by JONA, who takes over the talk.'],
      ['runs', 'The crossroads boards and the map show each road\'s Gym Leaders.'],
      ['music', 'Gym music: one song for the gym, one for the battle and a victory theme.'],
    ],
  },
  {
    version: '1.15',
    name: 'Hung Up',
    date: '2026-10-13',
    notes: [
      ['base', 'Most wall pieces are properly 3D: lights, clocks, shelves, windows, mirrors, doors, boards, banners and curtains.'],
      ['base', 'Farm, Underwater, Desert and Types furniture is properly 3D too.'],
      ['runs', 'Britt, a Gym Leader off duty, runs the Poké Mart counter in place of Kecleon.'],
      ['hub', 'The Clearing\'s ghosts and the Game Corner\'s regulars mostly stand about, and never block a door.'],
      ['fixes', 'Fixes for ? rooms, and for the Poké Mart on short phones.'],
    ],
  },
  {
    version: '1.14',
    name: 'Big Screens',
    date: '2026-10-12',
    notes: [
      ['look', 'On an iPad or a computer the game fills the screen again, with the map and Pokédex windows handheld-sized in the middle.'],
      ['look', 'Add the game to your home screen for its own icon and full screen. Phones play upright only.'],
      ['look', 'Starters with long tails or big arms stand centred on their body.'],
      ['base', 'Music, Library, Pirate, Space, Japanese, Toys, Hot Spring, Arcade and Greenhouse furniture is properly 3D.'],
      ['fixes', 'Arcade games no longer flicker or shimmer, and run smoother on iPhones.'],
    ],
  },
  {
    version: '1.13',
    name: 'Arcade Polish',
    date: '2026-10-12',
    notes: [
      ['mall', 'Squirtle Bubble Shooter: glossy marble bubbles, a brass launcher with two Squirtles, endless levels and a weekly leaderboard.'],
      ['mall', 'Blackjack and High-Low are on new 3D card tables.'],
      ['mall', 'Arcade buttons tick, and buzz on phones, as you press them.'],
      ['fixes', 'No more flickering bushes in the Clearing, or zooming in on a double tap in the arcade.'],
    ],
  },
  {
    version: '1.12',
    name: 'Fresh Coat',
    date: '2026-10-12',
    notes: [
      ['look', 'Cards have a new glossy look, and every move has new smooth art, Mewtwo\'s included.'],
      ['base', 'Over 200 more pieces of furniture are properly 3D, from the Ferris wheel to a coffin whose lid opens.'],
      ['mall', 'Every arcade cabinet has a lit marquee on top.'],
      ['fixes', 'The Poké Mall, the Game Corner and every 3D place load and run smoother, especially on phones.'],
    ],
  },
  {
    version: '1.11',
    name: 'Grand Mall',
    date: '2026-10-12',
    notes: [
      ['mall', 'The Poké Mall\'s hall is bigger and grander: fountains, a red carpet, palms, escalators, and Pokémon hanging about to chat with.'],
      ['mall', 'The Furniture store sells one of each piece and never restocks what you own. Make copies with your PC\'s Duplicate.'],
      ['base', 'Boxy furniture is a real box now, and what stands on furniture is modelled, not a flat picture.'],
      ['hub', 'Hold and drag to walk, everywhere you can walk.'],
      ['look', 'No more tiny text anywhere in the game.'],
    ],
  },
  {
    version: '1.10',
    name: 'Arcade Cabinets',
    date: '2026-10-12',
    notes: [
      ['mall', 'Every arcade game is a real arcade cabinet: a lit marquee, a bezelled screen and controls that fit the game.'],
      ['base', 'New arcade game: Squirtle Bubble Shooter, in place of Unown Word Search.'],
      ['mall', 'More Game Corner plays pay each day, and Meowth\'s counter has a guide, a "!" over games that still pay and a clock to the daily reset.'],
      ['fixes', 'Sound plays on iPhone and iPad with Silent Mode on, and arcade games run smoother on phones.'],
    ],
  },
  {
    version: '1.9',
    name: 'Berry Season',
    date: '2026-10-12',
    notes: [
      ['base', 'New arcade game: Pachirisu Berry Catch, in place of Jigglypuff\'s Sing-Along.'],
      ['modes', 'Weekly arcade leaderboards for six games, on a big screen over Meowth\'s counter.'],
      ['mall', 'The Game Corner has regulars playing, wandering and chatting. Tap one to talk.'],
      ['mall', 'Deal of the Day is gone, and a few prizes left Meowth\'s counter (if you bought one, you keep it).'],
    ],
  },
  {
    version: '1.8',
    name: 'Arcade Night',
    date: '2026-10-12',
    notes: [
      ['base', 'Eleven new arcade games at Meowth\'s prize counter, from Pidgey Flap to Poké Puzzle.'],
      ['mall', 'The Game Corner\'s walls are lined with arcade machines, free to play, and its slot machines are new 3D cabinets.'],
      ['base', 'The arcade machines and Game Corner games are real 3D models in your Secret Base.'],
    ],
  },
  {
    version: '1.7',
    name: 'Home Arcade',
    date: '2026-10-12',
    notes: [
      ['mall', 'The Game Corner no longer takes bets: every game is free, and a few plays a day pay PokéCoins, up to 500 a day.'],
      ['mall', 'Meowth\'s prize counter sells the Game Corner\'s games and ten arcade machines, to play at home as much as you like.'],
      ['dex', '8 Game Corner badges for the Trainer Card.'],
    ],
  },
  {
    version: '1.6',
    name: 'Game Corner',
    date: '2026-10-12',
    notes: [
      ['mall', 'Meet Meowth at a crossroads and it opens the Game Corner in the Poké Mall: slots, Plinko, Blackjack, High-Low, Voltorb Flip and Who\'s That Pokémon?.'],
      ['mall', 'Meowth\'s daily stamp card: play 5 different games in a day for a scratch card.'],
      ['runs', 'The crossroads open after your first won run.'],
      ['battle', 'Alphas and bosses fight on 3D ground in front of a living backdrop, and Kenmatta\'s courtyard is 3D too.'],
      ['modes', 'Sky Pillar: Fire\'s augments are stronger.'],
      ['fixes', 'Sound no longer stays off after the first tap, or after locking the phone.'],
    ],
  },
  {
    version: '1.5',
    name: 'At the Crossroads',
    date: '2026-10-11',
    notes: [
      ['runs', 'The crossroads is a 3D place you walk about at dusk, with a notice board for each road (its places, bosses and wild Pokémon) and a signpost to pick one.'],
      ['dex', 'The Ruins, Jungle and Savanna pages each give a perk when finished: Unown Rubbing, Tracker\'s Eye and Wayfinder.'],
      ['pc', 'Missions rebalanced: one easy, one medium and one hard each day and each week.'],
      ['hub', 'New players pick a name and a walking buddy before they start.'],
      ['fixes', 'Continue at a crossroads brings you back there, and Alpha and boss fights lag less on phones.'],
    ],
  },
  {
    version: '1.4',
    name: 'Rooms to Walk In',
    date: '2026-10-11',
    notes: [
      ['runs', 'Every ? room and the treasure grotto are 3D places you walk about, dressed for the biome and lit by the time of day.'],
      ['pc', 'Daily and weekly missions that pay PokéCoins, on the PC\'s MISSIONS page.'],
      ['modes', 'Sky Pillar: three new Fire augments, and weak ones made stronger.'],
      ['hub', 'In October a different ghost greets you each visit, and the cauldron is 3D with six tricks.'],
      ['music', 'The ? rooms and the grotto have songs of their own.'],
    ],
  },
  {
    version: '1.3',
    name: 'Spooky Season',
    date: '2026-10-10',
    notes: [
      ['hub', 'The Clearing dresses up for the season: Halloween in October (pumpkins, a graveyard, a cauldron and chatty ghosts), snow in December.'],
      ['base', 'House upgrades: make your Secret Base bigger and build as many rooms as you like, upstairs too, from the PC\'s blueprint.'],
      ['pc', 'Duplicate any furniture you own from your PC.'],
      ['hub', 'Every Pokéstop says what it does on the ground in front of it.'],
      ['fixes', 'The Clearing loads again in October.'],
    ],
  },
  {
    version: '1.2',
    name: 'Home Sweet Home',
    date: '2026-10-10',
    notes: [
      ['hub', 'After PRESS START you walk into the Whispering Clearing in 3D. A Pokéstop starts a run, and the Safari Zone and Sky Pillar stand at the ends of their roads.'],
      ['base', 'Buy the Ancient Tree\'s house for 1,500 PokéCoins and make it your Secret Base: over 1,000 kinds of furniture, and room for six of your Safari catches.'],
      ['mall', 'The Poké Mall opens with Smeargle\'s Furniture store, new stock every day.'],
      ['pc', 'A PC in the Clearing: pick your walking Pokémon, read your mail and the patch notes, and sign in to the cloud save.'],
      ['runs', 'The Pokémon Center and Poké Mart are 3D rooms you walk around in.'],
      ['runs', 'The new biomes\' roads open after any two won runs.'],
      ['music', 'New songs for the Clearing, the Secret Base, the Poké Mall, Team Rocket and the three new biomes.'],
    ],
  },
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
        'Arriving in the Whispering Clearing plays its own intro: drop through the clouds, meet its wild Pokémon, and see the Ancient Tree waiting.',
        'Pick your route on the map: wild fights, Alphas, ? events, Poké Marts, Pokémon Centers and a treasure grotto.',
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
  ['🔥', '31 starters', 'Charmander, Bulbasaur and Squirtle, 12 more from later generations, 15 legendaries to earn, and Mewtwo behind the Sealed Gate.'],
  ['🃏', '310 moves', 'About 74 each for Fire, Grass and Water, 68 Psychic moves for Mewtwo, and 21 Neutral moves any type can learn. Every one can be powered up with PP Up.'],
  ['🗺️', '7 biomes', 'Whispering Clearing, Overgrown Shrine and Ember Wastes, the Sunken Ruins, Thornwood Jungle and Sunscorch Savanna on the roads that branch off them, and the Crystal Depths for Mewtwo alone.'],
  ['💎', '59 relics', 'Starter Abilities, relics for each type and boss relics that give extra PP with a catch.'],
  ['🧴', '20 items', 'Potions, battle items and one for each type, carried in your Bag.'],
  ['❓', '10 events', 'Berry Tree, Move Tutor, Move Deleter, Item Ball, Hot Spring, Team Rocket, Day Care, Wishing Well, Fan Club and Shrine, each a 3D place you walk about, with its own music.'],
  ['🏪', 'Poké Mart & Center', 'Spend Pokédollars on moves, items and relics, or rest and power up a move at the Pokémon Center.'],
  ['🏅', '13 Gym Leaders', 'Two or three in every biome, standing in front of its boss, each with their own gym, speeches and badge.'],
  ['⭐', '6 Trainer Levels', 'Level 0 to 5, each adding a new rule. Win to unlock the next, and strike the Sealed Gate harder.'],
  ['📕', 'Pokédex', '125 entries over seven pages. Research each Pokémon for PokéCoins, page perks and a Silph Scope.'],
  ['🗼', 'Sky Pillar', 'A 100-floor climb with a new starter every week, 116 augments and a weekly leaderboard.'],
  ['🏆', '151 badges', 'Earned all over the game and kept in your Trainer Card\'s Badge Case.'],
  ['🌿', 'Safari Zone', 'A daily run, the same for everyone, with 514 Pokémon to catch over six areas and a leaderboard.'],
  ['🏠', 'Secret Base', 'A 3D house in the Ancient Tree, with as many rooms as you build, to decorate with over 1,000 kinds of furniture, and home to six of your Safari catches.'],
  ['🏪', 'Poké Mall', 'A grand 3D hall with fountains and Pokémon passing through, and Smeargle\'s Furniture store, with new stock every day.'],
  ['🎰', 'Game Corner', 'Meowth\'s place in the Poké Mall: Voltorb Flip, Who\'s That Pokémon?, slots, Plinko, Blackjack and High-Low, free to play for up to 500 PokéCoins a day, a prize counter of 24 games to take home and play, from slot machines to Pokémon Pinball, and 6 starters, 9 perks and a shiny for every starter but Mewtwo to buy.'],
  ['☁️', 'Cloud save', 'Sign in at the Clearing\'s PC or in Settings to play on your phone and PC with one save.'],
];
