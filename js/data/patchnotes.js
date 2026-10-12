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
  ['mall', 'The Poké Mall\'s hall is bigger and done up: a Poké Ball fountain in a gold-inlaid marble plaza, palms and topiary in stone planters, park benches, street lamps, columns, vending machines, a mall guide and escalators up to the mezzanine, all in real 3D.'],
  ['mall', 'The shop entrances are built out from the wall: lit sign boxes, a green striped awning and flower troughs at the Furniture store, a marquee of chasing bulbs, gold stars and velvet ropes at the Game Corner, and barriers and cones at the shop still moving in.'],
  ['base', 'What stands on top of furniture is modelled now, not a flat picture: the water cooler\'s bottle, the organ\'s pipes, the crates\' apples, carrots, corn, potatoes and cabbages, milk bottles, the till, the sink\'s tap, the fireplace\'s mantel things, the espresso machine, the prize counter\'s teddy and more.'],
  ['base', 'Over 60 boxy pieces of furniture are real boxes now, their picture on the front only: fridges, vending machines, shelves, cabinets, arcade machines and more no longer come out round or see-through from behind. The stove and air hockey table are fully modelled, like the arcade cabinets.'],
  ['mall', 'Poliwag Crossing and Ekans Trail are played by swiping the screen, with small Start and Exit keys under it.'],
  ['look', 'Pokémon no longer sink into the walls, shop fronts and counters behind them.'],
  ['hub', 'Hold and drag to walk everywhere you can walk: the Poké Mall and its shops, the Secret Base, the Pokémon Center, the Mart and the ? rooms.'],
  ['fixes', 'The confirm sound plays as you tap a door, a shop or anything you walk to, not when you get there.'],
  ['look', 'No more tiny text: every label in the game is at least a readable size, and the PC\'s text box is bigger.'],
  ['fixes', 'The Arcade Leaderboard\'s title fits on one line again, never cut off or wrapped.'],
  ['mall', 'Every arcade machine\'s Start and Exit are small round buttons now, like a Neo Geo\'s.'],
  ['mall', 'The Furniture store sells one of each piece: a buy poofs it off its platform and a SOLD OUT sign takes its place. Make more copies with your PC\'s Duplicate.'],
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
    version: '1.10',
    name: 'Arcade Cabinets',
    date: '2026-10-12',
    notes: [
  ['fixes', 'Sound now plays on iPhone and iPad with Silent Mode on, like a video does, in Chrome too.'],
  ['mall', 'More Game Corner plays pay PokéCoins each day: 10 slot spins, 10 Plinko drops, 5 hands each of Blackjack and High-Low, 5 Voltorb Flip rounds, and 7 questions in Who\'s That Pokémon?.'],
  ['base', 'New arcade game: Squirtle Bubble Shooter. Aim and fire bubbles, pop three of a colour, drop the ones left hanging, and keep them off the line as the ceiling comes down. At Meowth\'s prize counter and free to play in the Game Corner, in place of Unown Word Search.'],
  ['mall', 'A little PC with a "!" on Meowth\'s counter explains the Game Corner: which games pay coins today (up to 500 a day) and how much is left, the arcade and its weekly leaderboards, and taking games home.'],
  ['mall', 'The arcade leaderboard over Meowth has much bigger text.'],
  ['mall', 'A little "!" hops over every Game Corner game that still pays coins today, and goes once its paying plays are used up; it comes back the next day.'],
  ['mall', 'An hourglass on Meowth\'s counter counts down to the daily reset of coins and stamps: walk near it for the time left, or tap it to hear more.'],
  ['fixes', 'The Game Corner guide shows how many of today\'s quiz questions you\'ve answered, each game\'s plays left, and says when the stamp card is complete.'],
  ['fixes', 'Counters, tables and furniture no longer cut across a Pokémon standing just in front of them.'],
  ['base', 'Arcade games now fill the whole screen, and a tap outside a Game Corner game no longer closes it.'],
  ['base', 'Squirtle Bubble Shooter: a SHOOT button (a tap only aims), an arrow showing where the shot goes (the dotted path only for the first three shots), "Tap to swap" under the bubbles, rows sliding down smoothly and a steadier frame rate.'],
  ['base', 'Pachirisu Berry Catch runs smoother, and every arcade game gets a steadier frame rate: the room behind the cabinet stops drawing while you play.'],
  ['base', 'Every arcade game is now a real arcade cabinet: a lit marquee, the screen in a black bezel with LED scores, and a control deck with a joystick, START / EXIT and big round buttons.'],
  ['base', 'Squirtle Bubble Shooter aims with the joystick only (a tap just swaps bubbles), with a new glowing launcher and an underwater cave behind the bubbles. Pikachu Volleyball gets a round JUMP button.'],
  ['base', 'Arcade controls fit each game: Poliwag Crossing and Gastly Maze have big ◀ ▶ buttons under your left thumb and ▲ ▼ under your right, Psyduck Pong a big ◀ and ▶ for each thumb, and the tap games (Pachirisu Berry Catch, Where\'s Ditto?, Snorlax Stacker, Voltorb Memory, Poké Puzzle) have no joystick.'],
  ['base', 'Beedrill Invaders\' FIRE button is on the cabinet under the screen, beside the joystick.'],
  ['base', 'Ponyta Dash: Ponyta comes down from a hop faster. Pidgey Flap\'s trees lose their leafy clumps.'],
  ['base', 'Arcade games run smoother on phones, Poliwag Crossing and Poké Puzzle most of all.'],
    ],
  },
  {
    version: '1.9',
    name: 'Berry Season',
    date: '2026-10-12',
    notes: [
  ['mall', 'Slowpoke\'s Claw Machine and Poké Ball Skee-Ball are off Meowth\'s prize counter; anyone who bought one keeps it and can still play it at home.'],
  ['look', 'Every arcade game\'s How to play is a neon attract screen with the game running on a little CRT, and FREE PLAY is a lit LED badge.'],
  ['base', 'Poké Puzzle has a big round SWAP button (it swaps the two panels in the cursor), with a smaller RAISE under it.'],
  ['base', 'Ponyta Dash: a quick tap is a smaller hop; hold it for the high jump.'],
  ['base', 'Gastly Maze has tunnels through both side walls: run in one side and come out the other.'],
  ['base', 'Beedrill Invaders: Pikachu no longer fires by itself. Tap the round FIRE button (or Space) to zap.'],
  ['mall', 'Over Meowth\'s counter a big screen cycles through the arcade leaderboards, each game\'s top three this week (tap it for the full board); the GAME CORNER sign moved up above the pink neon, and the stamp card sits just over Meowth\'s head.'],
  ['mall', 'The Game Corner has regulars: a few Pokémon playing the slots, arcade and tables, wandering about deciding, chatting with each other and with Meowth, coming and going through the day. Tap one to talk; walk up to its game and it makes room.'],
  ['modes', 'Weekly arcade leaderboards for Ponyta Dash, Pidgey Flap, Snorlax Stacker, Poké Puzzle, Beedrill Invaders and Ekans Trail: your best score of the week goes up by itself (signed in), and the 🏆 on those cabinets opens the boards.'],
  ['mall', 'No more Deal of the Day: everything in the Game Corner is its normal price.'],
  ['base', 'New arcade game: Pachirisu Berry Catch. Run along under the Berry tree catching Berries, build a combo and dodge the Pinecos. At Meowth\'s prize counter and free to play in the Game Corner, in place of Jigglypuff\'s Sing-Along.'],
  ['mall', 'Jigglypuff\'s Sing-Along and Unown Word Search are off Meowth\'s prize counter; anyone who bought one keeps it and can still play it at home.'],
    ],
  },
  {
    version: '1.8',
    name: 'Arcade Night',
    date: '2026-10-12',
    notes: [
  ['mall', 'The Game Corner has arcade machines along its back wall, free to play for fun: a row under the screens, and two more under the two Plinko boards, now raised up the wall.'],
  ['mall', 'Four slot machines taken off the Game Corner\'s right wall, opening up the arcade corner.'],
  ['base', 'Three new arcade games at Meowth\'s prize counter: Pidgey Flap (in place of Magikarp Fishing: anyone who had it now has Pidgey Flap), Psyduck Pong and Gastly Maze.'],
  ['base', 'The home arcade machines are real 3D cabinets now, their game only on the front: lit screens and marquees, joysticks, a Whac-a-Diglett with Digletts up and a pinball table with its backglass.'],
  ['fixes', 'The arcade machines\' screens and marquees no longer flicker from across the room.'],
  ['base', 'The Game Corner\'s games are real 3D models in your Secret Base too: a slot machine with spinning-drum reels and a lever, Voltorb Flip and Who\'s That Pokémon? cabinets, Blackjack and High-Low card tables with cards dealt, and a Plinko board with real pegs hanging on the wall.'],
  ['mall', 'Meowth\'s prize counter now sells only games, each shown as its 3D model turning on the screen. The jackpot sign, Lucky 7 block, casino carpet and dolls are gone from it; anyone who bought one keeps it.'],
  ['fixes', 'The GAME CORNER sign over Meowth\'s counter is no longer cut off by the Pokémon screen, and the Game Corner\'s slot machines say FREE PLAY, not BET.'],
  ['mall', 'The Game Corner\'s back wall is lined with arcade machines either side of Meowth\'s counter, Whac-a-Diglett and Pokémon Pinball on the side walls, and its slot machines are new 3D cabinets, five a side.'],
  ['base', 'Eight new arcade games at Meowth\'s prize counter, free to play in the Game Corner and to take home: Poliwag Crossing, Ekans Trail, Beedrill Invaders, Electrode Breakout, Jigglypuff\'s Sing-Along, Where\'s Ditto?, Geodude Bowling and Poké Puzzle.'],
    ],
  },
  {
    version: '1.7',
    name: 'Home Arcade',
    date: '2026-10-12',
    notes: [
  ['mall', 'The Game Corner no longer takes bets: every game is free. Each has a few plays a day that pay PokéCoins (5 spins, 4 Plinko drops, 3 hands each of Blackjack and High-Low, 2 Voltorb Flip rounds, the daily quiz and scratch card), up to 500 a day all told and 150 from any one game.'],
  ['mall', 'Meowth\'s prize counter: tap Meowth in the Game Corner to buy, for PokéCoins, things the Furniture store never sells: every game (a slot machine, a Voltorb Flip machine, a Plinko board, a Blackjack table, a High-Low table and a Who\'s That Pokémon? machine) and ten arcade machines,, a jackpot sign, a Lucky 7 block, a casino carpet and Gen 1\'s Game Corner dolls (Abra, Clefairy, Dratini and a big Dratini) for your Secret Base.'],
  ['mall', 'Every Game Corner game keeps your records (best streaks, jackpots, best Voltorb Flip level and more), shown under the game.'],
  ['dex', '8 Game Corner badges for the Trainer Card: hit the jackpot, land a Plinko ball on ×10, win 5 Blackjack hands in a row, 8 right in one High-Low hand, reach Voltorb Flip level 8, 5 perfect quizzes, 2,500 PokéCoins won and every prize.'],
  ['base', 'The Game Corner\'s game prizes work in your Secret Base: tap a slot machine, Voltorb Flip machine, Plinko board, Blackjack table, High-Low table or Who\'s That Pokémon? machine to play it as much as you like. At home Who\'s That Pokémon? never ends and counts your streak.'],
  ['mall', 'Meowth\'s prize counter is a big screen now, like the Game Corner\'s showcases: one prize at a time, ◀ / ▶, the games first.'],
  ['fixes', 'Plinko no longer shows what a drop won before the ball lands: the coins and Today meter go up as it hits its bin.'],
  ['mall', 'The Game Corner no longer talks about chips: every play is free, so the Chips meter and the stake lines are gone.'],
  ['base', 'Ten new arcade games for your Secret Base, each a machine from Meowth\'s prize counter you can play at home as much as you like: Whac-a-Diglett, Magikarp Fishing, Snorlax Stacker, Ponyta Dash, Voltorb Memory, Slowpoke\'s Claw Machine, Poké Ball Skee-Ball, Pokémon Pinball, Pikachu Volleyball and Unown Word Search, each keeping your best score.'],
    ],
  },
  {
    version: '1.6',
    name: 'Game Corner',
    date: '2026-10-12',
    notes: [
  ['runs', 'The crossroads now open after your first won run, and Meowth, fresh out of Team Rocket, waits at the first one you reach.'],
  ['mall', 'Meet Meowth at a crossroads and it opens the Game Corner in the Poké Mall, with a ribbon for you to cut.'],
  ['look', 'Kenmatta\'s dojo now has a wooden wall behind him, filled by his gold Dragonite medallion from the arena.'],
  ['fixes', 'Sound no longer stays off after the first tap on the Pokédex: any tap now wakes it, also after locking the phone or switching apps.'],
  ['fixes', 'Players from early versions who never picked a name now get the name and buddy setup on their next start.'],
  ['battle', 'Alphas and bosses in the Whispering Clearing now fight in a 3D forest clearing; a boss still opens with its pixel prelude first.'],
  ['battle', 'Every biome\'s Alphas and bosses, Team Rocket\'s Alpha too, now stand on 3D platforms in front of their own living backdrop.'],
  ['look', 'The shut Pokédex on the title now opens only with its blue power button, and no longer plays your buddy\'s cry as it opens.'],
  ['pc', 'The PC\'s Sign in is now a gold SIGN IN / SIGN UP row near the top while you\'re signed out, and the sign-in window says how to make a free account.'],
  ['pc', 'The PC\'s Log off is now called Exit PC.'],
  ['pc', 'The PC menu is reordered: rewards first, then Walking buddy (showing who walks with you now) and Base residents straight off the menu, then your things and the game\'s records. Both the walking buddy and the Pokédex partner pickers now explain how the two differ.'],
  ['hub', 'Hold and drag in the Clearing and your walking buddy follows your finger.'],
  ['look', 'A quiet "Updates" word now sits under the refresh arrow: tap it now and then to get the newest version.'],
  ['battle', 'Fights in the Ember Wastes stand on 3D ashen ground: glowing lava cracks and pools, basalt rocks, obsidian and burnt trees, ash falling and embers rising. Chad Master Kenmatta\'s courtyard is 3D too: its flagstones, his dais and carpeted steps, two braziers burning, and a smooth gold Dragonite medallion on the wall in place of the pixel one.'],
  ['modes', "Sky Pillar: Fire's own augments are stronger (Kindling, Ember Skin, Heat Shield, Cauterize, Wildfire and Phoenix), and Risky Climb's Alphas now start on floor 3."],
  ['mall', 'The Game Corner is huge: screens on the back wall show the Pokémon, shinies and perks for sale, the Pokémon you don\'t own yet as silhouettes (tap one and flip through them left and right), two live Plinko boards hang on the other half, a row of slot machines lines each side wall, the floor is four game tables on a red-and-gold casino carpet.'],
  ['mall', 'Two free games in the Game Corner: Voltorb Flip and a daily round of Who\'s That Pokémon?. Win PokéCoins, up to 250 a day between them.'],
  ['mall', 'Bet your PokéCoins in the Game Corner, 5 to 50 a play: slots you stop yourself, with a growing jackpot and a Pikachu bonus round; Poké Ball Plinko, twelve rows of pegs with a ball that really falls; Blackjack against Meowth; and High-Low. The house closes for the day once you\'re 500 up.'],
  ['mall', 'Meowth\'s daily stamp card, on the wall behind its prize counter: play 5 different Game Corner games in a day and Meowth hands you a scratch card. It always wins something, up to 500 PokéCoins.'],
  ['mall', 'Every Game Corner game has a How to play card (the ? key), shown the first time you sit down. Voltorb Flip\'s works through a row\'s numbers for you.'],
  ['mall', 'Deal of the Day: one skin, perk or shiny in the Game Corner is 30% off each day, marked with a pink DEAL tag.'],
    ],
  },
  {
    version: '1.5',
    name: 'At the Crossroads',
    date: '2026-10-11',
    notes: [
  ['fixes', 'Alphas and bosses glow without a second shadow under them, so their fights should lag less on phones.'],
  ['runs', 'At a crossroads, picking a road now asks if you are sure before you walk into that biome.'],
  ['runs', 'The crossroads is now a 3D place you walk about at dusk: tap the ground to walk your Pokémon there, and walk up a road to take it.'],
  ['dex', 'The Sunken Ruins, Thornwood Jungle and Sunscorch Savanna pages now each give a perk when finished, Lv 2 once researched: Unown Rubbing shows which event a ❓ room holds, Tracker\'s Eye marks tough match-ups on the map, and Wayfinder lets you swap the other road at a crossroads.'],
  ['fixes', 'Closing the game at a crossroads (or during the walk after it) now brings you back to the crossroads on Continue, not to the map before the boss.'],
  ['runs', 'At the crossroads a notice board stands at each road: tap one to walk up and read it, its poster blown up with notes pinned to it: its places in order, bosses, wild Pokémon by type and its Pokédex page. Your Pokémon also gets a little smaller as it walks towards the fork.'],
  ['fixes', 'The crossroads no longer marks its roads\' bosses as seen in your Pokédex just by showing them, and a boss you have met now shows in colour there.'],
  ['runs', 'At the crossroads the notice boards wear a bobbing "!" until read and the signpost\'s arms glow in turn until you pick a road; tapping a board or a sign now chimes.'],
  ['fixes', 'A road you have never walked no longer shows its bosses at the crossroads, even if an older version or a playtest had marked them seen.'],
  ['runs', 'At the crossroads the signpost\'s arms and the notice boards now say which biome each road leads to, the arms pulsing with light, the boards list each road\'s three Alphas beside its bosses (so the Pokédex count of 18 adds up), and your Pokémon turns left and right as it walks, as in the Clearing.'],
  ['runs', 'At the crossroads a gold arrow bounces over the board and off the signpost arm of the road you have picked.'],
  ['fixes', 'Continuing a run at a crossroads no longer flashes the character select before the crossroads appears.'],
  ['hub', 'The Clearing\'s Halloween decorations are tidied up: a pumpkin patch, a graveyard, the witch\'s cauldron and matching pumpkins and lanterns along the trail, with the clutter in between cleared away.'],
  ['pc', 'Missions rebalanced: each day is now one easy, one medium and one hard mission (30, 45 and 65 PokéCoins), each week likewise (200, 250 and 300), never two that need the same type or two run wins; new ones ask for Tide, Burn, Leech Seed, Power cards, wins with two types or the other road, and a Sky Pillar climb to floor 30.'],
  ['hub', 'New players pick a name and a walking buddy (Charmander, Bulbasaur or Squirtle) on the Pokédex before they start, your buddy greets you on its screen each time you power it on, and names are now in capitals everywhere.'],
    ],
  },
  {
    version: '1.4',
    name: 'Rooms to Walk In',
    date: '2026-10-11',
    notes: [
  ['hub', 'In October a different ghost Pokémon greets you in the Clearing each visit, not always Sableye.'],
  ['hub', 'The Clearing\'s Halloween cauldron is 3D now: it bubbles and stirs itself, and each tap plays the next of its six tricks in turn.'],
  ['hub', 'The glowing words before each Pokéstop (CONTINUE, SET OUT, EXPLORE, CLIMB) are bold arcade letters with a cyan glow, easy to read, lying flat on the ground, with arrows marching in on either side.'],
  ['pc', 'Daily and weekly missions: three goals a day and three a week, from winning fights to climbing the Sky Pillar, each paying PokéCoins (with a bonus for finishing them all). Claim them at the PC\'s new MISSIONS page.'],
  ['modes', "Sky Pillar: Fire gets three new augments of its own (Flash Fire, Magma Armor and Eruption) and six stronger ones (Kindling, Ember Skin, Heat Shield, Cauterize, Wildfire and Phoenix), and Risky Climb's Alphas now start on floor 3."],
  ['modes', 'Sky Pillar: Mulligan, Scavenger, Ambush, Refresh and Thorn Garden are stronger and worth picking: Mulligan and Refresh also draw more on turn 1, Scavenger heals after won fights, Ambush hits harder first, and Thorn Garden seeds enemies from the start.'],
  ['runs', 'The Move Tutor\'s dojo, the Move Deleter\'s study, the Day Care and the Fan Club are 3D rooms you walk about, like the Pokémon Center: tap a sign or the thing itself to walk up to it, and each choice plays out in the room (the sandbag swings, the pendulum swirls, the Egg wobbles, confetti rains on the stage).'],
  ['fixes', 'The Fan Club no longer freezes the run when you walk in.'],
  ['runs', 'Every other ? room and the treasure grotto are 3D places you walk about too, dressed for the biome you\'re in and lit by the time of day: soak in the Hot Spring, ring the Shrine\'s bell as it glows in your type\'s colour, shake berries off the Berry Tree or plant one, toss a coin down the Wishing Well, wade into the tall grass for the Item Ball (watch out for Voltorb), face Team Rocket at their roadblock, and watch the grotto\'s Poké Ball chest wobble and pop open in its shaft of light.'],
  ['runs', 'After a ? room, the Center-style way: the room stays with its signs greyed, and you walk out over the doormat when you\'re ready; a found item or relic floats over the room it came from.'],
  ['runs', 'The Poké Mart\'s relics sit much bigger under their glass domes, with nothing in front of them or the shelves.'],
  ['music', 'The Move Tutor, Move Deleter, Day Care and Fan Club have a song of their own, and so do the Hot Spring, Berry Tree, Wishing Well and Item Ball, the Shrine and the treasure grotto.'],
    ],
  },
  {
    version: '1.3',
    name: 'Spooky Season',
    date: '2026-10-10',
    notes: [
  ['hub', "The Clearing dresses up for the season: jack-o'-lanterns, autumn leaves and ghosts flying over in October, snow in December."],
  ['hub', "Halloween in the Clearing goes big: giant jack-o'-lanterns, a pumpkin patch with a scarecrow, a candlelit graveyard, a bubbling cauldron, lanterns and bats, and Gengar, Litwick, Duskull and Sableye wandering about blurting spooky lines over their heads, with hundreds of lines and stories to tell when you tap one. One walks up to greet you by name when you arrive."],
  ['base', 'House upgrades: open the PC\'s blueprint to make your Secret Base\'s main room bigger, then build as many rooms as you like for 500 PokéCoins each, a doorway wherever you pick on a wall, turned whichever way you want, or upstairs up a staircase from a back wall. Join rooms that stand side by side with a new doorway, or take a room down and its furniture goes back into storage.'],
  ['pc', 'Duplicate any furniture you own from your PC: 50 PokéCoins, 5 more each time, never over 100.'],
  ['pc', 'Something new to read in the PC now wears a bobbing gold "!" instead of a "NEW" label.'],
  ['pc', 'New PC pages (House Upgrades, Duplicate, Decorations, Prof. Oak) wear a gold "!" until you open them, and the PC in the Clearing shows one too.'],
  ['pc', 'The house blueprint zooms and pans: pinch, scroll or tap + / − to zoom in, and drag to look around a big house.'],
  ['fixes', 'The Clearing loads again in October; a Halloween pumpkin stopped it.'],
  ['fixes', 'The "!" over the Clearing\'s PC goes away once you log on, instead of staying until every new page was read, and the PC now says what\'s new.'],
  ['pc', 'The PC menu is in a tidier order: your mail, then the PCs and your house, the Hall of Fame, and patch notes and cloud save at the bottom.'],
  ['fixes', 'The PC\'s Decorations and Duplicate pages show the picked piece in its own card, so tall furniture no longer covers its name.'],
  ['dex', 'Each Pokédex page\'s reward medal now sits beside its name, not in the bottom corner.'],
  ['hub', 'Every Pokéstop now says what it does on the ground in front of it: SET OUT on the trail, EXPLORE at the Safari, CLIMB at the Sky Pillar, or CONTINUE where your saved run waits.'],
    ],
  },
  {
    version: '1.2',
    name: 'Home Sweet Home',
    date: '2026-10-10',
    notes: [
      ['hub', 'After PRESS START you walk into the Whispering Clearing in 3D: tap where to go, and tap a place to use it.'],
      ['hub', 'A Pokéstop outside the Clearing\'s gate starts a new run; spin it and your Pokémon walks out. A saved run waits where you started it, with CONTINUE glowing in front.'],
      ['hub', 'The Safari Zone\'s gate and the Sky Pillar stand at the ends of their roads, each with its own Pokéstop and leaderboard board.'],
      ['hub', 'The Clearing has its own day and night, fireflies, sounds, and a legendary flying over now and then.'],
      ['base', 'Buy the Ancient Tree\'s house for 1,500 PokéCoins and make it your Secret Base: a 3D room to decorate however you like.'],
      ['base', 'Over 1,000 kinds of furniture in 20 colours each, from beds and TVs to 60 Pokémon plushies. Many do things when tapped: TVs change channel, lamps switch off, fridges open.'],
      ['base', 'Up to six of your Safari catches can live in your base, and your walking Pokémon can sit on its seats.'],
      ['base', 'Some furniture can\'t be bought: earn it with badges, achievements and Safari pages.'],
      ['mall', 'The Poké Mall opens in the Clearing. Smeargle\'s Furniture store sells a new stock every day, 50 to 150 PokéCoins a piece, with a second floor to unlock.'],
      ['mall', 'The Game Corner shop is coming soon.'],
      ['pc', 'A PC in the Clearing: choose the Pokémon that walks with you, pick your base\'s residents, change your name and sign in to the cloud save.'],
      ['pc', 'Big PokéCoin rewards now arrive as letters in its Mailbox. Prof. Oak rates your Pokédex and hints at what to unlock next.'],
      ['pc', 'The patch notes live on the PC now. A "!" over it means there\'s a new patch to read.'],
      ['runs', 'The Pokémon Center and Poké Mart are 3D rooms you walk around in. Your Pokémon goes into its Poké Ball to heal.'],
      ['runs', 'The new biomes\' roads open after any two won runs, not a Level 2 win with each type.'],
      ['battle', 'A wild Pokémon\'s block now shows in blue on its HP bar, like yours.'],
      ['music', 'New songs for the Clearing, the Secret Base, the Poké Mall, Team Rocket\'s ambush, the Sunken Ruins, Thornwood Jungle and Sunscorch Savanna.'],
      ['dex', 'The shut Pokédex shows the time and day like a lock screen. The Trainer Card explains each line when tapped.'],
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
  ['❓', '10 events', 'Berry Tree, Move Tutor, Move Deleter, Item Ball, Hot Spring, Team Rocket, Day Care, Wishing Well, Fan Club and Shrine, each a 3D place you walk about, with its own music.'],
  ['🏪', 'Poké Mart & Center', 'Spend Pokédollars on moves, items and relics, or rest and power up a move at the Pokémon Center.'],
  ['⭐', '6 Trainer Levels', 'Level 0 to 5, each adding a new rule. Win to unlock the next, and strike the Sealed Gate harder.'],
  ['📕', 'Pokédex', '125 entries over seven pages. Research each Pokémon for PokéCoins, page perks and a Silph Scope.'],
  ['🗼', 'Sky Pillar', 'A 100-floor climb with a new starter every week, 116 augments and a weekly leaderboard.'],
  ['🏆', '138 badges', 'Earned all over the game and kept in your Trainer Card\'s Badge Case.'],
  ['🌿', 'Safari Zone', 'A daily run, the same for everyone, with 514 Pokémon to catch over six areas and a leaderboard.'],
  ['🏠', 'Secret Base', 'A 3D house in the Ancient Tree, with as many rooms as you build, to decorate with over 1,000 kinds of furniture, and home to six of your Safari catches.'],
  ['🏪', 'Poké Mall', 'Smeargle\'s Furniture store, with new stock every day.'],
  ['🎰', 'Game Corner', 'Meowth\'s place in the Poké Mall: Voltorb Flip, Who\'s That Pokémon?, slots, Plinko, Blackjack and High-Low, free to play for up to 500 PokéCoins a day, a prize counter of 24 games to take home and play, from slot machines to Pokémon Pinball, and 6 starters, 9 perks and a shiny for every starter but Mewtwo to buy.'],
  ['☁️', 'Cloud save', 'Sign in at the Clearing\'s PC or in Settings to play on your phone and PC with one save.'],
];
