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
  ['dex', 'The Trainer Plaza: meet players on a new board in the Clearing and in the Trainers app, and a TRAINER LINK pops up when someone adds you.'],
  ['dex', 'Visiting a friend with a backyard asks house or yard, and their trophy cases show their own trophies.'],
  ['modes', 'Tap the locked Safari Zone to see a bar per biome of the Pokémon you\'ve beaten, and a new one beaten in a run steps its bar up.'],
  ['fixes', 'Evolving after a Gym Leader win keeps its Max HP and heal again, and leaving a town into the next biome no longer reloads the game on iPhones.'],
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
    version: '1.25',
    name: 'Off the Path',
    date: '2026-10-17',
    notes: [
    ['runs', 'Twenty new ? rooms, among them a Sleeping Snorlax, Bill\'s PC, Meowth\'s Prize Wheel, the Canalave Library, a Litwick Bonfire and a game of Voltorb Flip.'],
    ['mall', '100 new pieces: the Cherry blossom and Maple leaf series, sold only in April and October, and the Acorn and Mushroom series.'],
    ['mall', '100 more pieces: the Wooden block, Throwback and Ranch series, and Iron garden for the backyard on its own tab of Smeargle\'s catalogue.'],
    ['mall', '100 more pieces: the Bamboo, Constellations and Desert caravan series, and Stone zen for the backyard on a Zen tab of Smeargle\'s catalogue.'],
    ['mall', '450 pieces for whole rooms of a place, from a Hospital ward, Bakery and Poké Mart corner shop to a Cinema, Hotel lobby, Ski lodge, Haunted mansion and Cruise cabin.'],
    ['mall', 'The arcade machines have a room of their own: walk through the lit ARCADE door in the Game Corner\'s right wall, where Porygon keeps the weekly leaderboard.'],
    ['dex', 'A Trainers app on your Pokédex: signed in, get a trainer code, add friends by code or a leaderboard name, see their Trainer Card and walk round their Secret Base.'],
    ['fixes', 'Driftwood Landing runs lighter, and phones no longer reload the game in the Game Corner or after Alpha and Gym Leader wins.'],
    ['runs', 'The Bag is in every ? room now, opening on your deck, so you can look through your moves before choosing.'],
    ['look', 'Text boxes move on by themselves now, the last line waiting for a tap; Settings has Text boxes: Tap for the old way.'],
    ],
  },
  {
    version: '1.24',
    name: 'Full Tilt',
    date: '2026-10-17',
    notes: [
    ['base', 'Every furniture piece is a clean 3D model now, the Gym Leader posters included, statues stand as their Pokémon\'s own sprite in stone or gold, and rooms run lighter.'],
    ['mall', '904 new pieces: ten furniture series (Antique to Mermaid; the Golden one earned by achievements), six Pokémon rooms, seven Pokémon sets, 30 figurines, 60 dolls, eight holiday sets and 120 for the yard.'],
    ['battle', 'A balance pass toward Slay the Spire\'s numbers: 34 new relics, 14 new items and 32 new moves, each modelled on one of its own.'],
    ['battle', 'Runaway combos tamed: Shell Smash and Quick Guard exhaust, Leech Seed stops growing as you evolve, Choice Scarf is a boss relic, and starting defences are sturdier.'],
    ['look', 'A Sharpness setting: 3D places draw crisper on a phone by default, Max crispest, and Soft runs lightest on an older phone.'],
    ['dex', 'Friends moved into your Pokédex, by Quests: a banner each, their hearts, the pieces they\'ve given and what the next heart brings.'],
    ['hub', 'Kurt explains gifts and hearts after your first gift, and each Gym Leader greets you at home with a hint at their favourite.'],
    ['mall', 'Smeargle\'s garden catalogue is a proper merchant window: every piece shown as its 3D model, turning in a buy window when tapped.'],
    ['mall', 'Every Game Corner arcade game rebuilt: painted worlds, rising stages, hazards and power-ups. Pinball is a real table; Bubble Shooter has a shot clock and rocks.'],
    ['base', 'The Berry Garden window is rebuilt like Kurt\'s Workshop, with Plots, Seeds and Sell tabs, Smeargle\'s tips, and a card saying what each berry does.'],
    ['fixes', 'Buying furniture in the Poké Mall makes a soft puff now, not a crackly buzz, the Clearing and the 3D buy windows run lighter, and an arcade cabinet\'s How to play no longer stretches across a wide screen.'],
    ['mall', 'Four new pinball tables down the Game Corner\'s right wall, each its own game: Gengar\'s haunted graveyard, Lapras\'s whirlpool lagoon, Charizard\'s volcano and Rayquaza\'s scrolling Sky Pillar.'],
    ],
  },
  {
    version: '1.23',
    name: 'Collectors',
    date: '2026-10-16',
    notes: [
    ['pc', 'The Trainer\'s Journal on the Clearing\'s PC: 99 goals for the whole game, paying PokéCoins and a Trainer furniture set that fills in as you play (and sparkles when you come home to something new), with ranks and a gold shell.'],
    ['runs', 'Berry Trees in runs now drop a berry or two into your Satchel, and Professor Oak drops by to explain your first.'],
    ['mall', 'A Ranger Task Board in the Safari Outfitter: 92 tasks and weekly Expeditions for coins, balls, Safari furniture and base room, with Ranger Ranks and badges on your Trainer Card.'],
    ['base', 'Grow berries in your backyard: Smeargle shows you round, watering adds berries, a Garden window tends every plot (its ? explains it all), and Kurt crafts held berries (up to 3 a run, one a biome) and items to pack.'],
    ['mall', 'Smeargle\'s Furniture store is a grand showroom three times bigger: eight departments, prices you can read, a lift at the end of the carpet, and a buy window where pieces turn.'],
    ['mall', 'The Safari Outfitter is a grand safari lodge now: bamboo and thatch, a jeep, a Day Pass booth in the middle, and a buy window where each ball turns.'],
    ['hub', 'The Nietos come home once you beat Law, Britt or the Nietos at the Clearing\'s Gym, not only the Nietos.'],
    ['runs', 'Mewtwo has left the character select: start its run from the open Sealed Gate or the Depths camp.'],
    ['base', 'House Upgrades has its own Backyard tab, and the Build key stays in sight under any blueprint.'],
    ['mall', 'Prices rose to match the Trainer\'s Journal, and collectors can open the Furniture store\'s Grand Ballroom (3F): gold starter statues and new Pokédex shells.'],
    ['runs', 'A won run pays 200 PokéCoins on top, double before, and the Game Corner pays up to 250 a day, so runs are the best way to earn.'],
    ['fixes', 'Cooler and smoother on phones: 3D places and arcade games cap at 60 fps, the Mall draws far less, the Clearing no longer stutters, and the Home Screen app plays as smoothly as the browser.'],
    ],
  },
  {
    version: '1.22',
    name: 'Outfitted',
    date: '2026-10-15',
    notes: [
    ['mall', 'The Safari Outfitter is open in the Poké Mall: Kangaskhan sells Poké Ball packs, the Master Ball and Day Passes under a board of today\'s top catchers.'],
    ['mall', 'The Poké Mall\'s outside is grand now: a gold-ribbed glass dome, corner towers, a columned porch with chasing lights, gold lamps and a red carpet.'],
    ['hub', 'The Sky Pillar is rebuilt as an ancient tower of mossy stone and jade runes, in the Clearing, on the climb, inside, in its lobby and its opening film: its fights stand in 3D rooms open on the sky.'],
    ['base', 'The backyard\'s way in is a white garden gate in a picket fence round the Ancient Tree: unlock it there or on the PC, then grow the yard bigger on House Upgrades.'],
    ['hub', 'Friends at 3 hearts pin requests of their own on the Quests board, three each in their own words, paying PokéCoins when you hand them in at home.'],
    ['hub', 'Professor Oak and Professor Sonia now slide in to say hello the first time you talk to them each visit, like a Gym Leader.'],
    ['hub', 'Kenmatta\'s dojo has all 20 trials now, ending on his final test, and stays shut until you\'ve beaten him once in a run\'s ? room.'],
    ['hub', 'The Clearing\'s signs hop and sparkle now and then so you know you can read them, and the route sign and Pokéstop flank the gate.'],
    ['music', 'Highbough has a song of its own now, the Crystal Depths\' theme.'],
    ['hub', 'The Safari Zone\'s gate is a real 3D jungle lodge, out on its own in a wider west Clearing, its Pokéstop and ranks board either side.'],
    ['music', 'The Crystal Depths and Mewtwo\'s camp now play the Sky Pillar\'s song, and a climb\'s song starts with its opening film down the tower.'],
    ['music', 'Lantern Village, Cinder Springs, Driftwood Landing and Sunwell Bazaar each have a song of their own.'],
    ['fixes', 'Only the Ancient Tree\'s door takes you into the Secret Base now, going back into it, its backyard or the Poké Mall no longer leaves a black screen, and Kenmatta\'s dojo stands clear of the Safari gate, its cherry trees gone, and holding a finger down no longer brings up the iPhone\'s magnifying glass.'],
    ],
  },
  {
    version: '1.21',
    name: 'Hearts and Home',
    date: '2026-10-15',
    notes: [
      ['hub', 'Kenmatta\'s dojo is open: a grand temple hall with a ring to climb into, eight puzzle trials (one star each), belts from white to black and seven dojo pieces for your Secret Base.'],
      ['runs', 'Every friend has a new line for each friendship heart you fill: warmer at each one, with stories about the other Gym Leaders.'],
      ['base', 'A backyard: buy it on the PC\'s House Upgrades, furnish it from Smeargle\'s garden catalogue, let your Pokémon out to play, and grow berries in plots.'],
      ['base', 'Friends at 3 hearts drop by your Secret Base, and best friends at 5 come often and sit on your chairs and sofas.'],
      ['base', 'Each friend gives you a second piece of their own furniture at 3 hearts and a third at 5: 22 new pieces, from Linc\'s Pikachu crib to Jerome\'s heist safe.'],
      ['hub', 'Friends now mail your PC with PokéCoins or materials, teach Kurt a secret Safari Ball look at 4 hearts, and give a Friendship badge at 5.'],
    ],
  },
  {
    version: '1.20',
    name: 'The Waystones',
    date: '2026-10-15',
    notes: [
      ['runs', 'Five gateway towns now stand on the roads into each biome: Lantern Village, Cinder Springs, Driftwood Landing, Highbough and Sunwell Bazaar, each with shops, folk and its Gym Leaders\' homes.'],
      ['runs', 'Every town has a trader: pick one of their offers in a trade window, both sides ready up, and the items swap.'],
      ['runs', 'Beat a town\'s Gym Leader and they ask your help mending its broken Waystone: a questline over a few runs, ending on a shard won from a marked Alpha.'],
      ['runs', 'Gym Leaders\' homes are big rooms all their own, each town\'s great hall is huge inside, and every town looks out on a grand view past its gate.'],
      ['runs', 'Pick John\'s festival, and once Lantern Village\'s Waystone is mended its evenings fill with floating lanterns, a harvest moon or fireworks.'],
      ['hub', 'The Clearing\'s Waystone is cracked: beat the Nietos and their notice on the new quest board starts the quest to mend it, before any town\'s.'],
      ['hub', 'Mend a town\'s Waystone and its crystal lights on the Clearing\'s: travel there from home, buy its own furniture, and its leaders come to visit.'],
      ['hub', 'Kurt\'s Workshop opens in the Clearing: craft materials from the roads into quest items, unique furniture, gifts that fill a Gym Leader\'s five friendship hearts (see them on the PC\'s Friends page) and Apricorn looks for Safari Balls.'],
      ['dex', 'New Satchel and Quests apps in the Pokédex: your key items, materials you keep even on a lost run, and every quest\'s next step.'],
      ['modes', 'Mewtwo is weakened in the Crystal Depths until the five Waystones are mended; each shard gives back strength, shown on a pentagram in its new camp.'],
      ['runs', 'Every Gym Leader has about fifty new lines: more to say before and after a battle, and their own words for posters, Gold badges and visits.'],
      ['look', 'The Shrine, Sunken Ruins and Thornwood\'s outdoor rooms have a blue sky now, not a green one.'],
      ['hub', 'A duck now paddles round the Clearing\'s pond, dipping its head now and then.'],
      ['hub', 'The Nietos\' house is bigger inside and all theirs: Linc\'s nursery, two gaming desks, one very tired couch and Lego everywhere.'],
      ['fixes', 'The Overgrown Shrine and Safari Desert intro films no longer stutter on phones, and Kurt\'s Workshop has its fire lit and no trees indoors.'],
      ['runs', 'Mewtwo now speaks when it breaks out of the Sealed Gate, sliding in to tell you it\'s weak and needs your help.'],
      ['hub', 'The broken Sealed Gate is 3D now, leading down to Mewtwo\'s camp, where the gate lies smashed open into the Depths: talk to Mewtwo there to set out.'],
      ['hub', 'The Clearing\'s lamps and benches stand in tidy pairs now, and Professor Oak (Professor Sonia after dark) waits by the PC with tips (a refresh reminder every fifth one).'],
    ],
  },
  {
    version: '1.19',
    name: 'Something Stirs',
    date: '2026-10-14',
    notes: [
      ['fixes', 'Typing your name on a phone no longer brings up the "turn your phone upright" screen: the keyboard made the screen look sideways.'],
      ['dex', 'A Gym Leaders app in the Pokédex: every leader, a silhouette till beaten, who they are, your record against them and their rematch rewards.'],
      ['hub', 'The Clearing is tidied up: the Poké Mall and the Nietos\' house now stand south of the plaza, the PC faces you, the Waystone stands clear of lamp posts, the pond garden sits further south, and a Pokéstop\'s CONTINUE or SET OUT floats over its disc.'],
      ['battle', 'A Gym Leader\'s badge over the arch is shown in full colour before you win it, so you can see what you\'re fighting for.'],
      ['hub', 'The Nietos\' house and Gym Leaders\' visits to your Secret Base are switched off for now. They\'ll be back.'],
      ['fixes', 'A Gym win no longer counts twice after Continue, badges no longer cut iPhone sound, and Main menu leaves the Poké Mall, Secret Base and run rooms cleanly. Three relics on offer float in a triangle, so their names never overlap.'],
      ['runs', 'After a fight and in the Poké Mart, a Bag key lets you check your items and deck, and a found item shows what it does at once, no text to tap through.'],
      ['fixes', 'On a computer or a tablet held sideways, the Poké Mart shows the whole store, picking a card to upgrade or forget keeps the 3D room behind it, running from Team Rocket takes you straight to the map, and the Mart\'s PC no longer hides the cards.'],
      ['hub', 'The Clearing\'s ground now rolls away into the distance, like a little round world, with sky all the way round it.'],
      ['hub', 'The Nietos\' house is now a storybook cottage: a scalloped blue roof, a porch, flower boxes, a picket-fenced garden, baby Linc\'s washing out and a name board you can read.'],
      ['hub', 'The gate out to an adventure is grander: a glowing gold crest, lanterns and banners, and a shimmer you can spot from across the Clearing.'],
      ['hub', 'Strange violet cracks glow in the ground west of the plaza, spreading as the Sealed Gate weakens. Walk close and listen.'],
    ],
  },
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
  ['🃏', '342 moves', 'About 80 each for Fire, Grass and Water, 74 Psychic moves for Mewtwo, and 28 Neutral moves any type can learn. Every one can be powered up with PP Up.'],
  ['🗺️', '7 biomes', 'Whispering Clearing, Overgrown Shrine and Ember Wastes, the Sunken Ruins, Thornwood Jungle and Sunscorch Savanna on the roads that branch off them, and the Crystal Depths for Mewtwo alone.'],
  ['💎', '93 relics', 'Starter Abilities, relics for each type, and boss relics: extra PP with a catch, or your Ability made stronger.'],
  ['🧴', '34 items', 'Potions, battle items and one for each type, carried in your Bag, plus five held berries Kurt makes from your backyard\'s crop.'],
  ['❓', '30 events', 'From the Berry Tree, Move Tutor and Team Rocket to a Sleeping Snorlax, Bill\'s PC, a Litwick Bonfire and Voltorb Flip, each a 3D place you walk about, with its own music.'],
  ['🏪', 'Poké Mart & Center', 'Spend Pokédollars on moves, items and relics, or rest and power up a move at the Pokémon Center.'],
  ['🏘️', '5 towns', 'A gateway town on every road out of the Clearing, each with a trader, its Gym Leaders\' homes and a broken Waystone to mend, plus Kurt\'s Workshop at home to craft for it.'],
  ['🏅', '13 Gym Leaders', 'Two or three in every biome, standing in front of its boss, each with their own gym, speeches and badge.'],
  ['⭐', '6 Trainer Levels', 'Level 0 to 5, each adding a new rule. Win to unlock the next, and strike the Sealed Gate harder.'],
  ['📕', 'Pokédex', '125 entries over seven pages. Research each Pokémon for PokéCoins, page perks and a Silph Scope.'],
  ['🗼', 'Sky Pillar', 'A 100-floor climb with a new starter every week, 116 augments and a weekly leaderboard.'],
  ['🏆', '188 badges', 'Earned all over the game and kept in your Trainer Card\'s Badge Case.'],
  ['🌿', 'Safari Zone', 'A daily run, the same for everyone, with 514 Pokémon to catch over six areas and a leaderboard.'],
  ['🏠', 'Secret Base', 'A 3D house in the Ancient Tree, with as many rooms as you build and a backyard with a berry garden, to decorate with over 1,000 kinds of furniture, and home to six of your Safari catches.'],
  ['🏪', 'Poké Mall', 'A grand 3D hall with fountains and Pokémon passing through, Smeargle\'s furniture showroom, with new stock in eight departments every day and a Grand Ballroom of gold statues for collectors, and Kangaskhan\'s Safari Outfitter for Poké Balls and Day Passes.'],
  ['🎰', 'Game Corner', 'Meowth\'s place in the Poké Mall: Voltorb Flip, Who\'s That Pokémon?, slots, Plinko, Blackjack and High-Low, free to play for up to 250 PokéCoins a day, a prize counter of 28 games to take home and play, from slot machines to five pinball tables, and 6 starters, 9 perks and a shiny for every starter but Mewtwo to buy.'],
  ['🥋', 'Kenmatta\'s dojo', 'Puzzle trials with set hands in the Clearing, a star each, six belts from white to black and a dojo set of furniture to earn.'],
  ['☁️', 'Cloud save', 'Sign in at the Clearing\'s PC or in Settings to play on your phone and PC with one save.'],
];
