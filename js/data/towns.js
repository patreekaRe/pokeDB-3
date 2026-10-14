/* ============================================================
   towns.js  -  the gateway towns (the user's idea, 2026-10-13; docs/roadmap.md's Towns and Waystones). Each biome after
   the Clearing has a town, walked in 3D between the journey film and the biome's map (walkOn() in js/run.js, the room
   in js/event-3d.js): the biome you're entering, its Gym Leaders standing about, a few townsfolk on the crowd code
   (js/corner-crowd.js), one small trade and a request board. A town makes no run stronger (no healing, cards or relics,
   the user's call), so it needs no bot check: the trade is a sidegrade, a request pays PokéCoins and the town's
   friendship. Requests are counted across runs from the missions' events (track() in js/missions.js, by way of
   trackTowns()), one at a time, in order; finished ones raise the friendship that will mend the town's Waystone.
   This file is pure (tests/towns.test.mjs). A new town is a TOWNS entry.
   ============================================================ */

/** Whether the gateway towns are on (the user's call, 2026-10-14: the new Clearing went live first, the towns still being
    built): off, runs walk straight from the journey film to the map, requests count nothing and the Clearing's Waystone
    only reads its riddles. `?towns` turns them on for a page load; `?town=` peeks work either way. On for good: TOWNS_LIVE. */
export const TOWNS_LIVE = false;
export const townsOpen = () => TOWNS_LIVE || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('towns'));

/** Friendship (requests handed in) that mends a town's Waystone (the next session's: the ring by the Ancient Tree). */
export const MEND_AT = 5;
/** What handing a request in pays, in PokéCoins (Coin Finder applies). */
export const REQUEST_COINS = 40;

const req = (id, text, n, on) => ({ id, text, n, on });

export const TOWNS = {
  shrine: {
    id: 'shrine', biome: 'shrine', name: 'Lantern Village', music: 'shrine-room',
    sub: 'Lanterns light the stone road up to the Shrine. Walk out through the far gate when you\'re ready.',
    first: 'A village of lanterns and old cedars, at the foot of the Shrine\'s stair. Its people seem to know who you are.',
    // the stall's keeper and their one trade: an item from your Bag for another of the same rarity
    trader: { id: 'delibird', name: 'Delibird',
      offer: 'Deli! I\'ll take your {give} for my {get}. Fair\'s fair!',
      none: 'Deli... Your Bag is empty. Bring me something to swap!',
      done: 'Deli-deli! A pleasure doing business.' },
    // the village from above: a shrine's approach (the user's ask, 2026-10-14: "a lot of houses", so cleaned up as the
    // Clearing and Highbough were, with a shape of its own). One wide stone avenue runs straight from the way in to the
    // torii between pairs of stone lanterns, the Waystone's plaza halfway up it; two cross lanes; a koi pond in the west
    // garden with a vermilion bridge over it; only four houses, the Dance Theater and the pagoda at the back against the
    // forest, gardens of tall grass, flowers and lone maples between. T forest, . grass, # road, , tall grass, f flowers,
    // L a stone lantern, b a bench, R the request board, ~ the koi pond, - its bridge, | a lone maple, n a house's name
    // board; a capital is a building's footprint (BUILDINGS). You come in at the bottom (`door`) and go on through the
    // torii at the top (`gate`). 38 x 36 (the user's call: huge, never cramped). js/event-3d.js's buildTown() builds it.
    map: [
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTT####TTTTTTTTTTTTTTTTT',
      'TTTDDDDDD.|,,,|.L####L.AAA.|..PPP,,TTT',
      'TTTDDDDDD.,,,,,..####..AAA....PPP,,TTT',
      'TT.DDDDDD.,,,,,..####..AAA....PPP,,.TT',
      'TT.DDDDDD.......L####L.###...L###L,.TT',
      'TT.DDDDDDf.....f.####..###....###,,.TT',
      'TT.################################.TT',
      'TT.################################.TT',
      'TT.,,,##.........####.f...fMMMMM,,,.TT',
      'TT.,,,##.b.......####......MMMMM,,,.TT',
      'TT.,,,##........L####L.....MMMMM,,,.TT',
      'TT..~~--~~.......####.....nMMMMM....TT',
      'TT.~~~--~~~.L############L#########.TT',
      'TT.~~~--~~~~##R#########f##########.TT',
      'TT.~~~--~~~.##############..........TT',
      'TT..~~--~~..######WW######.....,,,,.TT',
      'TT..|.##.|..######WW######.....,,,,.TT',
      'TT.f..##f...#b#########b##.....,,,,.TT',
      'TT.,,,##....#f##########f#.f.f.,,,,.TT',
      'TT.,,,##.f.fL############L..........TT',
      'TT.,,,##JJJJJ....####......SSS......TT',
      'TT.,,,##JJJJJ...L####L.....SSS......TT',
      'TT.,,,##JJJJJf.f.####.f...nSSS......TT',
      'TT....##JJJJJn...####......###......TT',
      'TT.################################.TT',
      'TT.################################.TT',
      'TT...............####...............TT',
      'TT.,,,,,........L####L........,,,,,.TT',
      'TT.,,,,,...b.....####....b....,,,,,.TT',
      'TT.,,,,,.........####.........,,,,,.TT',
      'TT.,,,,,........L####L........,,,,,.TT',
      'TT...............####...............TT',
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
    ],
    door: { x: 18, y: 35 }, gate: { x: 18, y: 0 },
    // the buildings, every one facing south, its door on the road below it: `at` the map's letter, `door` the tile in
    // front of it, `home` the one you walk into (`homes` below), else locked (a knock says one of `knock`); `roof` its
    // tiles' colour
    buildings: [
      { at: 'S', id: 'shop', name: 'DELIBIRD\'S GOODS', door: { x: 28, y: 25 }, home: 'shop', roof: '#3a78c8', kind: 'shop' },
      // the one locked house left (the user's ask, 2026-10-14: too many houses), up by the pagoda
      { at: 'A', id: 'a', door: { x: 24, y: 6 }, roof: '#d8508a', knock: ['Nobody answers. A wind chime rings somewhere inside.', 'A sign on the door: "Out at the Shrine. Back at dusk."', 'An old voice: "The Waystone? It cracked the year the bell stopped ringing."'] },
      { at: 'J', id: 'john', name: 'JOHN', door: { x: 10, y: 26 }, home: 'john', roof: '#e8803a' },
      { at: 'D', id: 'theater', name: 'DANCE THEATER', door: { x: 5, y: 8 }, home: 'theater', roof: '#c84838', kind: 'theater' },
      { at: 'M', id: 'jahmes', name: 'JAHMES', door: { x: 29, y: 14 }, home: 'jahmes', roof: '#5aa060' },
      // the town's broken Waystone, in the plaza at the middle: friendship mends it (MEND_AT; its ring in the Clearing is
      // the next session's). A tap reads it.
      { at: 'W', id: 'waystone', kind: 'waystone', door: { x: 18, y: 19 },
        knock: ['An old standing stone, split down the middle. Faint runes flicker in the crack.', 'The Waystone hums, very quietly, as if it remembers the way home.', 'Its top lies broken at its foot. The villagers have swept round it, waiting.'] },
      { at: 'P', id: 'pagoda', kind: 'pagoda' },
    ],
    // the rooms you can walk into
    homes: {
      shop: { name: 'Delibird\'s Goods', sub: 'Shelves of odds and ends from far away. Delibird waves from behind the counter.' },
      john: { name: 'John\'s House', leader: 'john', sub: 'Three handhelds on the table, all charging. John hasn\'t picked one yet.',
        // till you've beaten them once a Gym Leader is up at their Gym, not at home (the user's call, 2026-10-13)
        away: 'Nobody\'s home. A note by the handhelds: "Up at the Gym. Beat me there and I\'ll be home after."' },
      jahmes: { name: 'Jahmes\'s House', leader: 'jahmes', sub: 'Three alarm clocks by the bed, a gaming PC humming in the corner.',
        away: 'Nobody\'s home. Three alarm clocks tick by an empty bed. A note: "AT THE GYM. COME FIND ME. BEFORE ELEVEN."',
        // after 11 p.m. (your clock) he's in bed, and talks in his sleep
        night: ['*snore* ...eleven o\'clock... bed...', '*mumbles* ...one more ARAM... no... bed...', '*snore* ...LET\'S GOOO... *snore*'] },
      theater: { name: 'Dance Theater', sub: 'Five dancers practise on the stage, each with their Pokémon\'s grace.',
        cast: {
          espeon: ['Espeon bows. "We dance for the Shrine\'s guardian every autumn."', 'Espeon twirls. "Feel the rhythm. The Shrine hears it."'],
          umbreon: ['Umbreon\'s rings glow. "We practise until the lanterns go out. They never do."', 'Umbreon nods. "Night is when we dance best."'],
          flareon: ['Flareon spins. "Watch my tail! Watch it!"', 'Flareon pants. "The stage gets SO warm when I dance."'],
          vaporeon: ['Vaporeon flows across the boards. "Like water down the stair."', 'Vaporeon smiles. "Sit, watch. It\'s free."'],
          jolteon: ['Jolteon zips past. "Too slow! Again!"', 'Jolteon crackles. "I keep the stage lights on. With my fur."'],
        } },
    },
    requests: [
      req('sh-fights', 'Win {n} fights in the Shrine', 4, 'fight'),
      req('sh-events', 'Explore {n} ❓ rooms in the Shrine', 2, 'event'),
      req('sh-alpha', 'Beat an Alpha in the Shrine', 1, 'alpha'),
      req('sh-learn', 'Learn {n} new moves in the Shrine', 3, 'learn'),
      req('sh-gym', 'Beat the Shrine\'s Gym Leader', 1, 'gym'),
    ],
    // the Gym Leaders off duty, standing about the village; a tap says the next line
    leaders: {
      john: [
        'Oh, hey. I\'m deciding which handheld to bring up to the Gym. I\'ve been deciding since lunch.',
        'These lanterns? Load-bearing posts, all of them. I checked. Engineer habits.',
        'There\'s a bridge on the road up. I inspected it. It\'s fine. Probably. I\'d jog.',
        'This village is basically a Fire Emblem map. Choke point at the gate, high ground at the Shrine.',
        'I\'ll see you at the top of the stair. Or I\'ll be playing Fire Emblem. One of those.',
        'Steam Deck or the Thor... Sorry. You didn\'t ask. Good luck up there.',
      ],
      jahmes: [
        'YOOO! You\'re heading up? LET\'S GOOO! ...I\'ll meet you there. Don\'t take too long.',
        'It\'s quiet here. TOO quiet. I want to SCREAM. I won\'t. The villagers go to bed early. Like me.',
        'I saw patients all morning. Then I came here for the lanterns. They\'re calming. I\'m CALM.',
        'Okay, rules: you reach my gym before eleven. Not 11:01. ELEVEN.',
        'Delibird tried to trade me a sock. I SCREAMED. It was a good sock though.',
        'Go win some fights. Get warmed up. I want a REAL battle. Before bed.',
      ],
    },
    // where townsfolk stand about (tiles of `map`)
    stands: [[15, 17], [22, 17], [16, 20], [21, 20], [23, 16], [18, 5], [19, 11], [18, 24], [19, 30], [10, 9], [26, 8], [12, 4],
      [4, 11], [32, 18], [4, 22], [5, 30], [32, 30], [24, 11], [33, 15], [26, 20], [13, 28], [24, 28], [6, 15]],
    folk: [
      { id: 'eevee', name: 'Eevee', move: 'hop', speed: 2.0, likes: ['stand'],
        quips: ['Vee!', 'Which one will I become?', 'The kimono dancers are practising again.', 'Eevee~'],
        play: ['I could watch the lanterns all evening.', 'So many choices...', 'Ooh, a leaf!', 'Vee vee!'],
        you: ['Eevee! Hi, {name}!', 'I can\'t decide what to evolve into. Like the Gym Leader can\'t decide what to play.', 'Are you climbing to the Shrine? Be careful on the stair!'] },
      { id: 'leafeon', name: 'Leafeon', move: 'walk', speed: 1.3, likes: ['stand'],
        quips: ['Leaf.', 'The maples are turning.', 'Smell that? Cedar.', '*rustle*'],
        play: ['These leaves fall so gently.', 'Autumn already...', 'Leaf~', 'So peaceful here.'],
        you: ['Leafeon. Welcome, {name}.', 'Every leaf on the road is one of mine. Just kidding.', 'The old cedars were here before the village.'] },
      { id: 'glaceon', name: 'Glaceon', move: 'walk', speed: 1.3, likes: ['stand'],
        quips: ['Glace.', 'It\'ll snow soon.', '*shivers happily*', 'Brr~'],
        play: ['The stone is cold. Perfect.', 'Frost on the lanterns tonight.', 'Glace...', 'Crisp air.'],
        you: ['Glaceon. Stay cool, {name}.', 'Flareon keeps warming the lanterns. I keep cooling them. We\'re friends.', 'The stair gets icy at night. Hurry.'] },
      { id: 'hoothoot', name: 'Hoothoot', move: 'hop', speed: 1.6, likes: ['stand'],
        quips: ['Hoot.', 'Hoot hoot!', 'What time is it? Still day?', '*tilts head*'],
        play: ['I keep the village\'s time.', 'Hoot... Hoot...', 'Tick, tock, hoot.', 'One foot. Then the other.'],
        you: ['Hoothoot! Hoot hoot, {name}!', 'The loud one asks me the time every five minutes. Eleven is his bedtime.', 'I\'ve never missed a beat. Hoot.'] },
      { id: 'misdreavus', name: 'Misdreavus', move: 'float', speed: 1.4, likes: ['stand'],
        quips: ['Mis~', 'Hee hee hee.', 'Boo.', '*giggles*'],
        play: ['Who lit that lantern? Hee hee.', 'Shh. Listen to the bells.', 'Mis mis!', 'Spooky~'],
        you: ['Boo! Did I scare you, {name}?', 'I know who lights the lanterns. I won\'t tell.', 'The Shrine at night is SO much fun.'] },
      { id: 'natu', name: 'Natu', move: 'hop', speed: 1.2, likes: ['stand'],
        quips: ['Natu.', '...', 'Tu.', '*stares*'],
        play: ['...', 'Natu tu.', '*stares at the sun*', '...!'],
        you: ['...Natu. ({name}.)', '...I see your future. It has a Gym in it.', '...Tu.'] },
      { id: 'chimecho', name: 'Chimecho', move: 'float', speed: 1.3, likes: ['stand'],
        quips: ['Chime~', '*ring ring*', 'Cheee~', 'Lovely breeze.'],
        play: ['The wind sings through me.', 'Ring-a-ling.', 'Chime chime!', '*tinkle*'],
        you: ['Chimecho! Welcome, {name}! *ring*', 'I ring when someone new comes through the gate.', 'The Shrine\'s bell is my big cousin.'] },
      { id: 'stantler', name: 'Stantler', move: 'walk', speed: 1.6, likes: ['stand'],
        quips: ['Stan!', 'My antlers make the air shimmer.', '*stamps*', 'Hm, a stranger.'],
        play: ['The tall grass is the best grass.', 'Stan stan.', 'Did that lantern move?', '*sniffs*'],
        you: ['Stantler! Don\'t stare at my antlers, {name}. Everyone does.', 'I walked down from the mountain this morning.', 'The Dance Theater\'s doors are open. Go and watch!'] },
      { id: 'aipom', name: 'Aipom', move: 'hop', speed: 2.2, likes: ['stand'],
        quips: ['Ai ai!', 'Hee hee!', 'Who has snacks?', '*swings tail*'],
        play: ['I climbed the pagoda once. Don\'t tell.', 'Ai!', 'Catch me!', 'Boing!'],
        you: ['Aipom! Got any Berries, {name}?', 'Delibird\'s shop has the BEST junk.', 'I can open any door with my tail. Except John\'s. He\'s always home.'] },
      { id: 'teddiursa', name: 'Teddiursa', move: 'walk', speed: 1.2, likes: ['stand'],
        quips: ['Teddi~', '*licks paw*', 'Honey...', 'Sleepy.'],
        play: ['The flowers by the road smell like honey.', 'Teddi teddi.', 'Mmm.', 'Sticky paws again.'],
        you: ['Teddi! Hi, {name}!', 'The loud man in the orange house goes to bed at eleven. Every night. I can hear it.', 'Want a hug? It\'s free.'] },
      { id: 'sunflora', name: 'Sunflora', move: 'hop', speed: 1.4, likes: ['stand'],
        quips: ['Sun!', 'Lovely day!', '*turns to the sun*', 'Flora~'],
        play: ['Soaking up the light.', 'Sunny side up!', 'Flora flora.', 'Warm!'],
        you: ['Sunflora! Have a sunny day, {name}!', 'I planted the flowers by the gate.', 'The tall grass behind the houses is where the wild ones nap.'] },
    ],
    shared: {
      deciding: ['Where to now...', 'Hmm.', 'What a nice evening.', 'Let\'s see the lanterns.', 'A stroll, I think.'],
      stand: ['Lovely lanterns.', 'So peaceful.', 'Hmm hm hm.', 'The cedars smell nice today.'],
      arriving: ['Back home!', 'Evening, everyone!', 'What a climb.', 'Phew, the stair!'],
      leaving: ['Off home!', 'Up to the Shrine for me.', 'See you tomorrow!', 'Bedtime.'],
      nearYou: ['Oh! A traveller.', 'Welcome to the village!', 'Heading up the stair?', 'Good luck at the Shrine!'],
    },
    chats: [
      ['Did you see the Gym Leader?', 'Which one?', 'The one who can\'t pick a game.', 'Oh, him. Still picking.'],
      ['Who lights the lanterns?', 'Nobody knows.', 'Misdreavus knows.', 'Misdreavus says she knows.'],
      ['It\'s nearly eleven!', 'So?', 'The loud one goes to bed at eleven.', 'Oh. Quiet at last.'],
      ['The maples are turning.', 'Already?', 'Every year, right on time.'],
      ['Delibird traded me a pinecone.', 'For what?', 'My other pinecone.', '...Fair\'s fair.'],
    ],
  },
  wastes: {
    id: 'wastes', biome: 'wastes', name: 'Cinder Springs', music: 'event-outdoor', style: 'springs',
    sub: 'Lava pours off the volcano and round the Waystone\'s island. Walk out through the mine gate when you\'re ready.',
    first: 'A mining town on a lava field in the volcano\'s shadow, its stone bridges warm underfoot and its springs steaming in the ash. The miners nod as you pass, as if they expected you.',
    trader: { id: 'heatmor', name: 'Heatmor',
      offer: 'Hrrmor. Your {give}, for my {get}. Forged fair, traded fair.',
      none: 'Hrr... An empty Bag. Come back with something to swap.',
      done: 'Hrrmor! Good trade. Mind the stairs out.' },
    // Lavaridge's: the volcano's foot, after the Shrine's village (the user's call: every town this big). T crags, .
    // ash, # road, , dry scrub, f fire lilies, = the mine's rails, L a brazier, b a bench, c a crate, k a barrel, o a
    // spring (the pools steam), ~ lava, - a basalt bridge, R the request board, n a house's name board; a capital is a
    // building. Laid out unlike the village's grid (the user's ask): a switchback road up the slope, in at the bottom
    // left, out through the mine gate at the top right, houses on the terraces between its bends. A lava field (the
    // user's ask, 2026-10-14: "bland... make it look something cool how you did the thornwood one", and fewer homes):
    // lava pours off the crags at the top into a river the switchback crosses on two-tile bridges, a moat round the
    // Waystone's island in the middle, two locked houses; the bathhouse has its own road and its springs out beside it.
    map: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTT##TTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTT##TTTTTTTT',
      'TTTMMMMML,c,.~~~~~~~TT.....L##L....TTT',
      'TTTMMMMM.,,,~~~~~~~~........##.....TTT',
      'TT.MMMMM.,,,.~~~~~~.......f.##.AAA.TTT',
      'TT.MMMMM.,,,..~~~~...CCCCC.f##.AAA..TT',
      'TT.MMMMM.......~~~...CCCCC..##.AAA..TT',
      'TT...=....f....~~~...CCCCC..##......TT',
      'TT...=.....f...~~~...CCCCC..##......TT',
      'TT.c.=........~~~...n.......##.,,,,.TT',
      'TT.k.=........~~~...........##.,,,,.TT',
      'TT...====.....~~~...........##.,,,,.TT',
      'TT.........L..~~~..........L##L.....TT',
      'TT.f.....#####---#############...f..TT',
      'TT.......#####---#############....f.TT',
      'TTBBBBBB.##.~~~~~~~~~~~~~~~.........TT',
      'TTBBBBBB.##.~~L......R.L.~~....,,,,,TT',
      'TTBBBBBB.##.--....WW.....~~....,,,,,TT',
      'TTBBBBBBn##.--....WW.....~~....,,,,,TT',
      'TTBBBBBBL##.~~.b.....b...~~....,,,,,TT',
      'TT.########.~~L........L.~~...f.....TT',
      'TT.########.~~~~~~--~~~~~~~.........TT',
      'TT.......###############---###......TT',
      'TT.ooo...###############---###......TT',
      'TTooooof...L.....HHHHH..~~~.##......TT',
      'TTooooo....SSSS..HHHHHf.~~~.##.EEE..TT',
      'TT.ooo.f...SSSS..HHHHH..~~~.##.EEEc.TT',
      'TTb........SSSS.nHHHHH..~~~.##.EEEk.TT',
      'TT,,,,,...n.............~~~.##......TT',
      'TT,,,,,........ff.....L.~~~L##L.....TT',
      'TT.....#################---###......TT',
      'TT....L#################---###......TT',
      'TTTT...##,,,,,,,,,,,,,,.~~~,,,,,,,TTTT',
      'TTTT...##,,,,,,,,,,,,,,.~~~,,,,,,,TTTT',
      'TTTTTTT##TTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTT##TTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    door: { x: 7, y: 35 }, gate: { x: 28, y: 0 },
    buildings: [
      { at: 'M', id: 'mine', kind: 'minehead', door: { x: 5, y: 7 },
        knock: ['The mine\'s lift cage is chained shut. A sign: "Closed. Something big moved down there."', 'Far below, a pick rings on rock. Then stops. Then starts again.', 'Warm air breathes up out of the shaft, smelling of sulphur.'] },
      { at: 'A', id: 'a', door: { x: 32, y: 7 }, roof: '#c84838', knock: ['A miner\'s helmet hangs on the door. Nobody\'s home; they\'re on the night shift.', 'Through the window, a Geodude is asleep in a laundry basket.', 'An old voice: "The Waystone? It split the night the volcano woke."'] },
      { at: 'H', id: 'shaun', name: 'SHAUN', door: { x: 19, y: 28 }, home: 'shaun', roof: '#3a78c8' },
      { at: 'B', id: 'bath', name: 'BATHHOUSE', door: { x: 5, y: 20 }, home: 'bath', roof: '#4a82b8', kind: 'bathhouse' },
      { at: 'C', id: 'clarence', name: 'CLARENCE', door: { x: 23, y: 9 }, home: 'clarence', roof: '#d8508a' },
      { at: 'S', id: 'shop', name: 'HEATMOR\'S FORGE', door: { x: 12, y: 28 }, home: 'shop', roof: '#e0602a', kind: 'shop' },
      { at: 'E', id: 'e', door: { x: 32, y: 28 }, roof: '#c84838', knock: ['A child: "Mum! It\'s a traveller! Can I show them my rocks?" "No!"', 'No answer. A row of polished stones sits on the sill, biggest to smallest.'] },
      { at: 'W', id: 'waystone', kind: 'waystone', door: { x: 18, y: 19 },
        knock: ['A standing stone, split by the heat. Faint runes glow in the crack like embers.', 'The Waystone is warm, like the ground here. It hums, very quietly.', 'Its top lies cracked at its foot, dusted with ash. The miners step round it carefully.'] },
    ],
    homes: {
      shop: { name: 'Heatmor\'s Forge', sub: 'An anvil, a roaring brazier, and odds and ends from the mine. Heatmor waves a pair of tongs.' },
      shaun: { name: 'Shaun\'s House', leader: 'shaun', sub: 'Three monitors, a headset, and a pile of laptops tagged "FIXED". Shaun is reviewing a VOD.',
        away: 'Nobody\'s home. A sticky note on the monitor: "At the Gym. Beat me there and I\'ll review your VOD."' },
      clarence: { name: 'Clarence\'s House', leader: 'clarence', sub: 'A feather boa on the chair, a webcam on the desk. The disco ball is "for the show".',
        away: 'Nobody\'s home. A note on the ring light: "At the Gym. Beat me and you can visit. NOT during the show."',
        // from nine at night (your clock) he's live for the boys, and not to be disturbed
        nightAt: 21, nightSub: 'Clarence is live for the boys. A ring light glares; he waves you away without looking.',
        night: ['*whispering* I\'m LIVE. Twelve viewers. Do NOT walk into frame.', '*to the webcam* ...and SPIN! *to you* Shh! Out!', '*whispering* The boys are spamming peaches. Come back tomorrow.'] },
      bath: { name: 'Bathhouse', sub: 'Steam rolls off the springs. Pokémon soak up to their chins, too warm to say much.',
        cast: {
          camerupt: ['Camerupt sighs. "The volcano heats this water. Best bath in the world."', 'Camerupt blows a lazy smoke ring. "Mmmh."'],
          magcargo: ['Magcargo bubbles. "I\'m not melting. I\'m relaxing. It\'s different."', 'Magcargo glows a little. "Hot enough. Just."'],
          graveler: ['Graveler soaks. "Rock bathing. Don\'t knock it till you try it."', 'Graveler grins. "Smoothest I\'ve felt since I was a pebble."'],
          machoke: ['Machoke flexes in the steam. "Muscles need soaking too."', 'Machoke yawns. "Twelve hours in the mine. Twelve minutes in here. Fair."'],
          rhyhorn: ['Rhyhorn snorts happily and slides lower. Only its horn sticks out.', 'Rhyhorn blinks slowly. It forgot what it was doing. Bathing, probably.'],
        } },
    },
    requests: [
      req('wa-fights', 'Win {n} fights in the Wastes', 4, 'fight'),
      req('wa-events', 'Explore {n} ❓ rooms in the Wastes', 2, 'event'),
      req('wa-alpha', 'Beat an Alpha in the Wastes', 1, 'alpha'),
      req('wa-learn', 'Learn {n} new moves in the Wastes', 3, 'learn'),
      req('wa-gym', 'Beat the Wastes\' Gym Leader', 1, 'gym'),
    ],
    leaders: {
      clarence: [
        'What? I\'m on my day off. Day off from the GYM. Not from the show.',
        'The springs are good for the skin. I need the skin looking good. For reasons.',
        'You\'re heading up to my gym? Fine. Be quick. Nine o\'clock is SACRED.',
        'Shaun says the boys play better after the show. Shaun is a coward who won\'t say it himself.',
        'New routine this week. There\'s a spin. Nobody\'s ready for the spin.',
        'The volcano rumbles every night at nine. That\'s not the volcano. That\'s anticipation.',
      ],
      shaun: [
        'Hey. Your positioning walking in here was bad. Just so you know.',
        'I fixed the whole town\'s Wi-Fi. It was the router. It\'s always the router. Or it\'s you.',
        'Ticket #4502: traveller enters town. Status: under review.',
        'Clarence asked me to "set up the stream". I said no. He set it up himself. Badly.',
        'My friends are queueing without me. They\'re going to lose. I\'m at peace with it.',
        'Go win some fights in the Wastes. Warm up. I don\'t want an Iron 1 lobby when you get to me.',
      ],
    },
    stands: [[8, 8], [11, 10], [19, 10], [25, 10], [32, 9], [6, 13], [16, 18], [22, 18], [20, 20], [30, 17], [33, 21], [3, 22],
      [8, 24], [16, 24], [22, 26], [27, 26], [32, 23], [14, 32], [31, 32], [4, 30]],
    folk: [
      { id: 'geodude', name: 'Geodude', move: 'hop', speed: 1.4, likes: ['stand'],
        quips: ['Geo!', 'Dude.', '*rolls a little*', 'Rock on.'],
        play: ['Warm rocks are the best rocks.', 'Geo dude!', 'I fell asleep in a laundry basket again.', '*cracks knuckles*'],
        you: ['Geodude! Sup, {name}?', 'The mine\'s closed. Something big is down there. Bigger than me.', 'The springs? I sink. Every time.'] },
      { id: 'numel', name: 'Numel', move: 'walk', speed: 1.0, likes: ['stand'],
        quips: ['Nuuu...', '*plods*', 'So warm.', 'Nu.'],
        play: ['The ground is warm here. I like it.', 'Nuuu~', 'Slow and steady.', '*nibbles ash*'],
        you: ['Numel... Hi... {name}...', 'I walked here from the volcano. Took a while.', 'Don\'t rush. Nothing here rushes. Except the lava.'] },
      { id: 'slugma', name: 'Slugma', move: 'walk', speed: 0.9, likes: ['stand'],
        quips: ['Slug.', '*sizzle*', 'Hot hot.', 'Bloop.'],
        play: ['Don\'t touch me. For your sake.', 'Slugma~', 'I left a scorch mark on the bench again.', '*drips*'],
        you: ['Slug! Hi, {name}! Don\'t hug me.', 'Nobody feeds me. There\'s a sign. I hate the sign.', 'I tried the springs once. They got hotter.'] },
      { id: 'torkoal', name: 'Torkoal', move: 'walk', speed: 0.9, likes: ['stand'],
        quips: ['*puff*', 'Kohhh.', '*wheeze*', 'Smoke break.'],
        play: ['Is it foggy, or is that me?', '*puffs a ring*', 'Kohh...', 'I heat the bathhouse on cold days.'],
        you: ['Torkoal! *puff* Welcome, {name}.', 'Sorry about the smoke. It\'s a condition.', 'The Gym Leader with the boa asked me to do smoke effects. For "the show".'] },
      { id: 'machop', name: 'Machop', move: 'hop', speed: 1.8, likes: ['stand'],
        quips: ['Cho!', 'Hup!', 'Leg day.', '*flexes*'],
        play: ['I carried four crates today. FOUR.', 'Machop!', 'One more rep!', 'Hup, hup!'],
        you: ['Machop! Want to arm wrestle, {name}?', 'I work the mine. When it\'s open. It isn\'t.', 'My big brother soaks in the bathhouse all day.'] },
      { id: 'cubone', name: 'Cubone', move: 'walk', speed: 1.3, likes: ['stand'],
        quips: ['Cu.', '*taps bone*', 'Bone...', 'Hm.'],
        play: ['I found this skull in the mine. Don\'t ask.', 'Cubone.', '*tap tap*', 'Quiet here. I like quiet.'],
        you: ['Cubone. Hi, {name}.', 'The Waystone cracked. I heard it. Like a bone.', 'The Shaun one fixed my lamp. He said it was user error.'] },
      { id: 'vulpix', name: 'Vulpix', move: 'hop', speed: 2.0, likes: ['stand'],
        quips: ['Vul!', '*swishes tails*', 'Pix~', 'So cosy.'],
        play: ['Six tails, six warm spots.', 'Vulpix~', 'The fire lilies are blooming!', '*curls up*'],
        you: ['Vulpix! Hi, {name}!', 'I nap on the warm stones by the springs. Don\'t tell.', 'Have you SEEN the Gym Leader\'s feather boa? I want it.'] },
      { id: 'larvitar', name: 'Larvitar', move: 'hop', speed: 1.5, likes: ['stand'],
        quips: ['Lar!', '*chews rock*', 'Crunch.', 'Tar tar!'],
        play: ['This rock tastes like the mountain.', 'Larvitar!', 'I\'m going to be HUGE one day.', '*munch*'],
        you: ['Larvitar! I ate a hole in the fence, {name}.', 'The mountain is my dinner. Slowly.', 'The big one in the mine? I\'m not scared. I\'m HUNGRY.'] },
      { id: 'drilbur', name: 'Drilbur', move: 'walk', speed: 1.7, likes: ['stand'],
        quips: ['Dril!', '*digs*', 'Brrrr!', 'Found something!'],
        play: ['I dug that tunnel. And that one.', 'Drilbur!', 'Shiny rock! No, just glass.', '*spins*'],
        you: ['Drilbur! Need a tunnel, {name}?', 'I could dig into the mine. They told me not to. I\'m thinking about it.', 'The rails? I laid half of them. The good half.'] },
      { id: 'houndour', name: 'Houndour', move: 'walk', speed: 1.8, likes: ['stand'],
        quips: ['Rrruf.', '*sniffs*', 'Grr.', 'Ruff!'],
        play: ['I guard the mine gate. Mostly I nap by it.', 'Houndour.', '*growls at the volcano*', 'Ruff ruff.'],
        you: ['Ruff! A traveller. Hi, {name}.', 'Going up past the gate? The wastes bite back.', 'I can smell the Gym from here. It smells like ring light.'] },
    ],
    shared: {
      deciding: ['Where to now...', 'Hmm.', 'Bit warm today.', 'Springs or home?', 'A stroll, I think.'],
      stand: ['Nice and warm.', 'Smell that? Sulphur.', 'Hmm hm hm.', 'The volcano\'s quiet today.'],
      arriving: ['Back from the mine!', 'Evening, all!', 'What a shift.', 'Phew, the heat!'],
      leaving: ['Off to the springs!', 'Night shift for me.', 'See you tomorrow!', 'Bedtime.'],
      nearYou: ['Oh! A traveller.', 'Welcome to the Springs!', 'Going up to the wastes?', 'Mind the ash!'],
    },
    chats: [
      ['Is the mine open yet?', 'No.', 'Tomorrow?', 'That\'s what they said yesterday.'],
      ['Did you hear the volcano last night?', 'At nine?', 'Yeah.', '...That wasn\'t the volcano.'],
      ['The springs are too hot today.', 'Slugma got in.', 'Again?!'],
      ['Shaun fixed my lamp.', 'What was wrong?', 'He said "you".', 'Rude. Was he right?', '...Yes.'],
      ['Who cracked the Waystone?', 'The volcano.', 'I heard it was a Larvitar.', 'I HEARD THAT.'],
    ],
  },
  ruins: {
    id: 'ruins', biome: 'ruins', name: 'Driftwood Landing', music: 'event-outdoor', style: 'lagoon',
    sub: 'Boardwalks ring the drowned temple. Walk out through the old stone arch when you\'re ready.',
    first: 'A fishing village on stilts over the lagoon, built on the bones of a sunken temple. Lines are out, nets are drying, and everyone waves.',
    trader: { id: 'pelipper', name: 'Pelipper',
      offer: 'Peli-peli! Your {give}, for this {get} I fished up. Swap?',
      none: 'Peli... Nothing in your Bag? Not even a soggy one?',
      done: 'Pelipper! Nice doing business. Mind the gaps in the planks!' },
    // the Ruins': a stilted village over the lagoon (the user's ask: its own shape, nothing like the village's grid or the
    // Springs' switchback). ~ water, - boardwalk, . sand, # the temple's old paving, , reeds, f hibiscus, T the jungle
    // bank, L a tiki torch, b a bench, c a crate, k a barrel, n a net drying on its rack, y a moored boat, | a drowned
    // column, R the request board; a capital is a building, on stilts. A ring of boardwalk round the temple's island
    // (the broken Waystone at its middle), spokes out to the houses over the water, in up the jetty at the bottom, out
    // through the temple's arch on the far shore.
    map: [
      'TTTTTTTTTTTTTTTT######TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT########TTTTTTTTTTTTTTT',
      'TTT~~~~~~~~~~~~#L####L#~~~~~~~~~~~~TTT',
      'TT~~AAAA~~GGG~~~~~--~~~~~PPP~~KKKK~~TT',
      'TT~~AAAA~~GGG~~~~~--~~~~~PPP~~KKKK~~TT',
      'TT~~AAAA~~GGG~~~~~--~~~~~PPP~~KKKK~~TT',
      'TT~~~~-c~~~-~~~~~~--~~~~~~-~~~~-~~~~TT',
      'TT~~~~-~~~~-~|~--------~~~-~~~~-~~~~TT',
      'TT~~~~-~~~~-~------------~-~~~~-~~~~TT',
      'TT~~~y-~~~~----~~~--~~~----~~~~-~~|~TT',
      'TT~~~~-~~~~---~~~~--~~~~---~~~~-~~~~TT',
      'TT~~~~------~EEE~~--~~JJJ~------~~~~TT',
      'TTQQQQQ~~---~EEE~~--~~JJJ~---~~~~~~~TT',
      'TTQQQQQ~~--~~~---L..L---~~~--~~~~~~~TT',
      'TTQQQQQ~--~~~~f......R.~~~~~|-~~~~~~TT',
      'TTQQQQQ~--~|~~~..####..f~~~~--~~~~~~TT',
      'TT~L-~~~--~~~~.b######..~~~~--y~~~L~TT',
      'TT~-----------..##WW##..-----------~TT',
      'TT~-----------..##WW##..-----------~TT',
      'TT~~~~~y--~~~~..######b.~~~~--~~-~~~TT',
      'TT~~~~~~--~~~~~.f####..~~~|~--~HHHH~TT',
      'TT~OOO~~--~~MMM.......fNNN~~--~HHHH~TT',
      'TT~OOO~~~--~MMM~~L..L~~NNN~--~~~~~~~TT',
      'TT~OOO~~~-----~~~~--~~~~-----~~~~y~~TT',
      'TT~~--------~~~~~~--~~~~~~--~~~~~~~~TT',
      'TT~~~~~~~~~---~~~~--~~~~---~~~|~~~~~TT',
      'TT~~~~~~|~~~---|~~--~~~---~~~~~~~~~~TT',
      'TT~~~~~~~~~~~-------y----~~~~~~~~~~~TT',
      'TT~~YYYY~~~~~~~--------~~~~~XXXX~~~~TT',
      'TT~~YYYY~~~DDDD~~~--~~SSSS~~XXXX~~~~TT',
      'TT~~YYYY~~~DDDD~~y--~~SSSS~~XXXX~~~~TT',
      'TT~~~~-~~~~DDDD~~~--~~SSSS~~~-~~~~~~TT',
      'TT~ck...........------...........kc~TT',
      'TTT~~,,b.,,n.n,L~~--~~L,n.,,.b.,n~~TTT',
      'TTTTTTTTTTTTTTTTTT--TTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTT--TTTTTTTTTTTTTTTTTT',
    ],
    door: { x: 18, y: 35 }, gate: { x: 18, y: 0 },
    buildings: [
      { at: 'W', id: 'waystone', kind: 'waystone', door: { x: 18, y: 19 },
        knock: ['A standing stone, split down the middle. Water drips from the crack, glowing faintly blue.', 'The Waystone hums like the sea in a shell.', 'Its top lies in the shallows by the island. A Krabby lives under it now.'] },
      { at: 'Q', id: 'aquarium', name: 'AQUARIUM', door: { x: 4, y: 16 }, home: 'aquarium', roof: '#3a8ab8', kind: 'aquarium' },
      { at: 'H', id: 'pat', name: 'PAT', door: { x: 32, y: 19 }, home: 'pat', roof: '#d85a78', kind: 'houseboat' },
      { at: 'K', id: 'kayl', name: 'KAYL', door: { x: 31, y: 6 }, home: 'kayl', roof: '#9a70c8' },
      { at: 'S', id: 'shop', name: 'BAIT & TACKLE', door: { x: 23, y: 32 }, home: 'shop', roof: '#e8a030', kind: 'shop' },
      { at: 'O', id: 'beacon', kind: 'beacon', door: { x: 4, y: 24 },
        knock: ['The old beacon tower. Its door is swollen shut with the damp.', 'A Wingull nest sits on the lamp. Nobody has the heart to move it.', 'Carved over the door: "The tide remembers." Then, smaller: "Pat was here."'] },
      { at: 'A', id: 'a', door: { x: 6, y: 6 }, roof: '#3aa0a0', knock: ['A voice: "If you\'re selling nets, we have nets. We have SO many nets."', 'A wind chime of shells clinks on the porch. Nobody answers.'] },
      { at: 'G', id: 'g', door: { x: 11, y: 6 }, roof: '#e8c050', knock: ['A note: "Gone fishing." Under it, older: "Gone fishing." Under that: "Gone fishing."', 'You hear snoring, and a fishing line being reeled in. In the same breath.'] },
      { at: 'P', id: 'p', door: { x: 26, y: 6 }, roof: '#e86a4a', knock: ['A child: "Is it the Krabby? Tell it I\'m not home!"', 'A smell of grilled fish and lemon drifts out. Nobody comes.'] },
      { at: 'E', id: 'e', door: { x: 14, y: 13 }, roof: '#58a868', knock: ['An old voice: "The temple sank in one night, my gran said. We built on top. Waste not."', 'A sign: "Diving lessons. Ask inside." You ask. Nobody answers.'] },
      { at: 'J', id: 'j', door: { x: 23, y: 13 }, roof: '#5a78c8', knock: ['A lease agreement is pinned to the door. Kayl\'s signature, a paw print beside it.', 'A voice: "Kayl said the leak would be fixed by Tuesday. WHICH Tuesday?"'] },
      { at: 'M', id: 'm', door: { x: 13, y: 23 }, roof: '#c8607a', knock: ['Someone inside is singing along to Pat. Badly. Lovingly.', 'A doormat: "Wipe your fins."'] },
      { at: 'N', id: 'n', door: { x: 24, y: 23 }, roof: '#8a6a50', knock: ['The floorboards creak. A Poliwag peeks out of a hole in them, then vanishes.', 'No answer. A fishing rod leans by the door, its line tangled round the railing.'] },
      { at: 'D', id: 'd', door: { x: 12, y: 32 }, roof: '#4a9ab8', knock: ['A voice: "We\'re drying squid. Don\'t come in. For your own sake."', 'A sign: "Boat repairs. Knock twice." You knock twice. Something falls over inside.'] },
      { at: 'X', id: 'x', door: { x: 29, y: 31 }, roof: '#d88a3a', knock: ['A note: "At the beach. Watching the tide. It\'s a full-time job."', 'Through the shutters, a Shellos is asleep on a pile of cushions.'] },
      { at: 'Y', id: 'y', door: { x: 6, y: 31 }, roof: '#7ab048', knock: ['A voice: "Who\'s there?" "A traveller." "...Who\'s there?" It\'s a Slowpoke.', 'Seashells line the windowsill, smallest to biggest. One is a Shellder. It winks.'] },
    ],
    homes: {
      shop: { name: 'Pelipper\'s Bait & Tackle', sub: 'Rods, nets, buckets of bait and a bell over the counter. Pelipper waves a wing.' },
      kayl: { name: 'Kayl\'s House', leader: 'kayl', sub: 'Lavender everywhere, a bass on its stand, two cat beds, a pile of lease renewals. Kayl is mid-email.',
        away: 'Nobody\'s home but the cats. A note on the amp: "At the Gym! Beat me there and come say hi to Spooky and Reya."',
        names: { purrloin: 'SPOOKY', glameow: 'REYA' },
        cast: {
          purrloin: ['Spooky is asleep in the bass case. It is Spooky\'s bed now.', 'Spooky flicks a fluffy tail at you and goes back to sleep.', 'Spooky rolls onto a sprig of lavender. Purrrr.'],
          glameow: ['Reya stares at you. Then SCREAMS. Then purrs. You\'re fine.', 'Reya sits on the keyboard. A work email sends itself.', 'Reya has opened a cabinet again. She looks very pleased.'],
        } },
      pat: { name: 'Pat\'s Houseboat', leader: 'pat', sub: 'Fairy lights, a guitar, a hammock and a rose in a bottle. The boat rocks gently. Pat is tuning up.',
        away: 'Nobody\'s aboard. A note on the guitar: "At the Gym. Beat me and I\'ll play you something. Maybe."',
        // after ten at night (your clock) he's out on the deck, singing to the moon, and not to be interrupted
        nightAt: 22, nightSub: 'Pat is out on the deck, serenading the moon. The lagoon is very quiet. It\'s listening.',
        night: ['*softly* ♪ ...soothing like the ocean... ♪ Shh. The moon\'s listening.', '♪ Love has no distance, baby... ♪ *to you* Not now. Big finish coming.', '*whispering* This is the part where she writes back. Any minute.'] },
      aquarium: { name: 'Lagoon Aquarium', sub: 'Tide pools under a glass roof, the lagoon\'s Pokémon resting in them. Everything glows blue.',
        cast: {
          lapras: ['Lapras hums a low, old song. The water ripples with it.', 'Lapras: "I carried the first fishers here, long ago. They still bring me berries."'],
          mantine: ['Mantine glides round its pool, slow and pleased with itself.', 'Mantine: "I could jump the whole lagoon. I just don\'t want to."'],
          corsola: ['Corsola: "Don\'t touch the pink bits. Or the white bits. Or me."', 'Corsola waves a stubby arm. A bit of coral falls off. "...That grows back."'],
          chinchou: ['Chinchou\'s lights blink at you. On, off. On, off. Hello.', 'Chinchou: "I light the aquarium at night. Lanturn takes the credit."'],
          lanturn: ['Lanturn: "I light the aquarium at night. Chinchou helps. A little."', 'Lanturn glows warmly. The whole pool turns gold.'],
        } },
    },
    requests: [
      req('ru-fights', 'Win {n} fights in the Sunken Ruins', 4, 'fight'),
      req('ru-mart', 'Buy {n} things at the Sunken Ruins\' Mart', 2, 'mart'),
      req('ru-events', 'Explore {n} ❓ rooms in the Sunken Ruins', 2, 'event'),
      req('ru-flawless', 'Win a fight in the Sunken Ruins without a scratch', 1, 'flawless'),
      req('ru-gym', 'Beat the Sunken Ruins\' Gym Leader', 1, 'gym'),
    ],
    leaders: {
      pat: [
        '♪ Like a tall glass of lemonade... ♪ Oh. You. Hi. I\'m just... rehearsing.',
        'The acoustics on the water here are unreal. Everything sounds like a love song.',
        'I live on a boat now. It\'s romantic. It\'s also wet. Mostly romantic.',
        'Kayl rented me the mooring. She charged me in songs. Three a week. Fair.',
        'Shh. Hear that? That\'s the tide. It\'s in four-four.',
        '♪ It\'s been three years... ♪ Don\'t ask. Go win some fights in the Ruins.',
      ],
      kayl: [
        'Oh! Hi! Sorry, I\'m mid-lease-renewal. Every house on this lagoon is technically my problem.',
        'Spooky slept in my bass case again. I can\'t practise. I can\'t move her. This is my life.',
        'Reya learned to open the fridge. I\'m not okay.',
        'Do you smell lavender? I put it in the boardwalk varnish. The fishers haven\'t noticed. Yet.',
        'Pat pays his mooring in songs. I said yes because I\'m weak. And they\'re good.',
        'Heading into the Ruins? Mind the stairs. They\'re underwater. All of them.',
      ],
    },
    stands: [[16, 14], [22, 16], [15, 19], [21, 21], [16, 21], [7, 32], [11, 32], [26, 32], [31, 32], [9, 32], [5, 17], [10, 18],
      [27, 17], [33, 18], [18, 6], [17, 2], [20, 2], [13, 8], [24, 9], [9, 24], [14, 27], [28, 23]],
    folk: [
      { id: 'wooper', name: 'Wooper', move: 'hop', speed: 1.4, likes: ['stand'],
        quips: ['Woo?', 'Wooper!', '*blinks*', 'Paa.'],
        play: ['I fell off the boardwalk again. It\'s fine. I\'m a Wooper.', 'Woo woo!', 'The fish don\'t bite. I bite.', '*smiles at nothing*'],
        you: ['Wooper! Hi, {name}! Want to see me fall in?', 'The temple\'s down there. I\'ve seen it. I forgot where.', 'Pat sang to me once. I cried. I\'m always a bit wet anyway.'] },
      { id: 'psyduck', name: 'Psyduck', move: 'walk', speed: 1.0, likes: ['stand'],
        quips: ['Psy...?', '*holds head*', 'Duck.', 'Ow.'],
        play: ['I have a headache. I always have a headache.', 'Psyduck?', 'Did I leave the stove on? I don\'t have a stove.', '*stares at the water*'],
        you: ['Psy... Oh, {name}. Hi.', 'The runes under the water make my head buzz. Worse than usual.', 'I can\'t swim. In a fishing village. I know.'] },
      { id: 'slowpoke', name: 'Slowpoke', move: 'walk', speed: 0.7, likes: ['stand'],
        quips: ['...', '...Slow?', '*yawns*', 'Mm.'],
        play: ['I\'m fishing with my tail. Something bit it. Yesterday.', '......Slowpoke.', '*dangles tail in the water*', 'Is it lunch?'],
        you: ['...Oh. Hello... {name}...', 'I was waiting for... something. What was it.', 'The tide came in. Then out. I watched both. Busy day.'] },
      { id: 'corphish', name: 'Corphish', move: 'walk', speed: 1.6, likes: ['stand'],
        quips: ['Corph!', '*snaps*', 'Grr!', 'Clack clack.'],
        play: ['This is MY plank. Get your own plank.', 'Corphish!', 'I pinched a fisher. He deserved it.', '*clacks claws*'],
        you: ['Corph! You, {name}! Got any bait?', 'I\'m the toughest thing in this lagoon. Don\'t tell the Lapras.', 'The Krabby under the Waystone owes me rent. Kayl says that\'s not how it works.'] },
      { id: 'marill', name: 'Marill', move: 'hop', speed: 1.8, likes: ['stand'],
        quips: ['Mar!', 'Rill~', '*bounces*', 'Splash!'],
        play: ['My tail floats! I never sink!', 'Marill marill!', 'Race you round the ring!', '*bounces on the boardwalk*'],
        you: ['Marill! Hi, {name}! Play with me!', 'I can hear the Waystone humming under the water. Like a song!', 'Pat lets me sit on his boat when he sings. I clap with my tail.'] },
      { id: 'poliwag', name: 'Poliwag', move: 'hop', speed: 1.7, likes: ['stand'],
        quips: ['Poli!', '*swirls*', 'Wag wag!', 'Bloop.'],
        play: ['I live under the boardwalk. It\'s cosy.', 'Poliwag!', 'Look at my belly. It\'s hypnotic. Look.', '*wiggles*'],
        you: ['Poli! Hi, {name}!', 'Don\'t step on the loose plank by the Bait shop. That\'s my front door.', 'The fish here are huge. Huge! I\'m not jealous.'] },
      { id: 'buizel', name: 'Buizel', move: 'walk', speed: 2.1, likes: ['stand'],
        quips: ['Bui!', '*spins tails*', 'Zip!', 'Hah!'],
        play: ['I can swim the whole ring in thirty seconds.', 'Buizel!', 'I pull the boats in when the wind drops.', '*does a spin*'],
        you: ['Bui! A traveller! Race me, {name}!', 'The arch out there? Old temple door. The Ruins go deep past it.', 'I lifeguard. Nobody\'s drowned. Psyduck came close. Twice.'] },
      { id: 'krabby', name: 'Krabby', move: 'walk', speed: 1.3, likes: ['stand'],
        quips: ['Krab.', '*bubbles*', 'Pinch.', 'Clik.'],
        play: ['I live under the Waystone\'s top. Rent free.', 'Krabby!', '*blows bubbles*', 'Sideways is the only way.'],
        you: ['Krab! Hi, {name}. Don\'t lift my rock.', 'The Waystone glows at night. Keeps me warm.', 'Corphish says I owe it rent. Corphish is not my landlord.'] },
      { id: 'wingull', name: 'Wingull', move: 'hop', speed: 2.0, likes: ['stand'],
        quips: ['Wing!', 'Gull!', '*flaps*', 'Kee!'],
        play: ['I nest on the old beacon. Best view in the lagoon.', 'Wingull!', 'Got any fish? No? Any chips?', '*eyes your Bag*'],
        you: ['Wingull! Hi, {name}! What\'s in the Bag?', 'I deliver letters for Pelipper. For fish.', 'From the beacon you can see the temple under the water. It goes down forever.'] },
      { id: 'staryu', name: 'Staryu', move: 'hop', speed: 1.5, likes: ['stand'],
        quips: ['Hyah!', '*blinks core*', 'Ya!', '*spins*'],
        play: ['My core glows at night. Fishers use me as a lamp.', 'Hyah!', '*sparkles*', 'I washed up here. I stayed.'],
        you: ['Hyah! {name}! Shiny!', 'At night the whole lagoon glows. The old runes, I think.', 'Lanturn and I are in a glowing contest. I\'m winning.'] },
    ],
    shared: {
      deciding: ['Where to now...', 'Hmm.', 'Tide\'s turning.', 'Boat or home?', 'A walk round the ring.'],
      stand: ['Nice breeze.', 'Smell that? Salt.', 'Hmm hm hm.', 'The fish are biting today.'],
      arriving: ['Back from the boats!', 'Morning, all!', 'What a catch.', 'Phew, that wind!'],
      leaving: ['Off to check the nets!', 'Boat\'s waiting.', 'See you at the tide!', 'Nap time.'],
      nearYou: ['Oh! A traveller.', 'Welcome to the Landing!', 'Going into the Ruins?', 'Mind the gaps!'],
    },
    chats: [
      ['Is Pat singing again?', 'Since sunrise.', '...It\'s nice though.', 'It IS nice though.'],
      ['Who left a net on the boardwalk?', 'Not me.', 'It\'s got your name on it.', '...Not me.'],
      ['Kayl raised the mooring fees.', 'By how much?', 'One song a week.', 'Oh, that\'s fine.'],
      ['The temple glowed last night.', 'It does that.', 'Is that normal?', 'Here? Yes.'],
      ['Psyduck fell in again.', 'Did Buizel get him?', 'Wooper did.', 'WOOPER?!'],
    ],
  },
  thornwood: {
    id: 'thornwood', biome: 'thornwood', name: 'Highbough', music: 'event-outdoor', style: 'canopy',
    sub: 'Rope bridges creak between dark treehouses. Something is always watching. Walk out through the vine gate when you dare.',
    first: 'A village up in the canopy, treehouses round the giant trunks and rope bridges between them. The people who built it left long ago. Ghost Pokémon live here now, and they\'ve been waiting for a visitor.',
    // Highbough is a ghost town (the user's call, 2026-10-14: "filled with only scary ghost Pokémon"): every townsperson,
    // the shopkeeper and the Nursery's sleepers are Ghost types; Phil and Ricky are the only living souls who stayed
    trader: { id: 'mismagius', name: 'Mismagius',
      offer: 'Hee hee... Your {give}, for my {get}. A fair trade. Mostly. Don\'t ask what I did to the last one.',
      none: 'An empty Bag? Pity. I do so love taking things. Come back with something.',
      done: 'Lovely. It\'s yours now. It was always going to be. Mind the third plank on the way out.' },
    // Thornwood's: a village in the treetops, its rope bridges two tiles wide (the user's ask, 2026-10-14: a big Pokémon
    // looked to hang off one-tile ones), Fortree's (the user's ask: its own shape, unlike the village's grid, the
    // Springs' switchback or the Landing's ring). ~ open air (the jungle floor far below), - a rope bridge, . a platform's
    // planks, # the Great Tree's deck, , moss, f a planter, T the canopy, L a lantern, b a bench, c a crate, k a barrel, |
    // a lone giant trunk, y a lift's basket on its rope, R the request board; a capital is a building, up on its tree. Round
    // platforms scattered over the drop like stepping stones, joined by rope bridges in no pattern but the trees': in up
    // the lift at the bottom right, the Great Tree's deck in the middle with the broken Waystone, out through the vine gate
    // at the top left.
    map: [
      'TTTTT..TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTT..TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTT.....AAA~~..QQQQQ..~~~~~~~~~~~TTTT',
      'TTTT,....AAA~~..QQQQQ..~~........~TTTT',
      'TT~~.....AAA~~..QQQQQ..~~.KKKK...~~~TT',
      'TT~~.L......~~.........~~.KKKK..L~~~TT',
      'TT~~........--L.......L--.KKKK...~~~TT',
      'TT~~...b....--.f.....f.--f.......~~~TT',
      'TT~~~~--~~~~~~~~~~~--~~~~.....c.f~~~TT',
      'TT~~~~--~~~~~|~~~~~--~~~~........~~~TT',
      'TT~~~~--~y~~~~~~~~~--~~~~~~~~~~--~~~TT',
      'TT.EEE...~~~~~~~~~~--~~|~~~~~~~--~~~TT',
      'TT.EEE.f.~~~~~~OOO~--~~~~~~~~~~--~~~TT',
      'TT.EEE...~~~~~~OOO~--~~~~~~~~~~--~|~TT',
      'TT.......~~####OOO#R##~~~..SSSS.L~~~TT',
      'TT,......--##########L~~~f.SSSS..~~~TT',
      'TT.L.....--##b########~~~..SSSS..~~~TT',
      'TT.......~~####WWW####---........~~~TT',
      'TT~~~~--~~~L###WWW####---........~~~TT',
      'TT~~~~--~~~###########~~~......c.~~~TT',
      'TT~~~~--~~~##########f~~~~~--~~~~~~~TT',
      'TT~~~~--~~|#L#####b###~~~~~--~~~~~~~TT',
      'TT~~~~--~~~~~--~~~~~~~~~~~~--~~~~~~~TT',
      'TT~~~~--~~~~~--~~~~~~~~~~|~--~~~~~~~TT',
      'TT.DDD.....~~,...HHHH.~~~~~--~~~~~~~TT',
      'TT.DDD...f.~~....HHHH.~~~~~--~~~~~~~TT',
      'TT.DDD.....~~....HHHH.~~~.........~~TT',
      'TT.........~~L........~~~........L~~TT',
      'TT.........--.........---.........~~TT',
      'TT..L......--.........---.........~~TT',
      'TT.......,.~~..b.....L~~~b.......,~~TT',
      'TT.b.......~~.........~~~.........~~TT',
      'TTTTT~~~~~~~~~~~~~~~~~~y~.L....ck.TTTT',
      'TTTTT~~~~~~~~~~~~~~~~~~~~.........TTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTT..TTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTT..TTTTTTT',
    ],
    door: { x: 29, y: 35 }, gate: { x: 5, y: 0 },
    buildings: [
      { at: 'W', id: 'waystone', kind: 'waystone', door: { x: 16, y: 19 },
        knock: ['A standing stone on the Great Tree\'s deck, split down the middle. Roots have grown into the crack.', 'The Waystone hums. The leaves round it turn to face it, slowly.', 'Somebody hung a lantern on it. The flame inside is violet. It doesn\'t flicker.'] },
      { at: 'O', id: 'greattree', kind: 'greattree', door: { x: 16, y: 15 },
        knock: ['The Great Tree\'s hollow. It\'s warm inside, and it smells of sap. Something very old is asleep in there.', 'You knock on the bark. Far away, deep in the wood, something knocks back.', 'Carved by the hollow: every family that built here. The newest names were carved from the inside.'] },
      { at: 'Q', id: 'nursery', name: 'WITHERED NURSERY', door: { x: 18, y: 5 }, home: 'nursery', roof: '#6a7a5a', kind: 'nursery' },
      { at: 'H', id: 'phil', name: 'PHIL', door: { x: 19, y: 27 }, home: 'phil', roof: '#6a4a8a', kind: 'haunted', tree: false },
      { at: 'K', id: 'ricky', name: 'RICKY', door: { x: 28, y: 7 }, home: 'ricky', roof: '#3a7ac8', kind: 'gamer' },
      { at: 'S', id: 'shop', name: 'CURIO SHOP', door: { x: 29, y: 17 }, home: 'shop', roof: '#7a4a9a', kind: 'shop', tree: false },
      { at: 'A', id: 'a', door: { x: 10, y: 5 }, roof: '#d85a48', knock: ['A voice from inside: "Who\'s there?" You say your name. It says it back. In your voice.', 'A rope ladder is pulled up from inside. Nobody\'s coming down. Something giggles.'] },
      { at: 'E', id: 'e', door: { x: 4, y: 14 }, roof: '#c87ab0', knock: ['A child\'s voice: "Is it Ricky? Tell him to come and PLAY." Ricky lives alone.', 'A smell of baked Berries drifts out. The oven inside has been cold for a hundred years.'] },
      { at: 'D', id: 'd', door: { x: 4, y: 27 }, roof: '#5aa0a8', knock: ['An old voice: "We built up to get away from the floor. It climbed up after us."', 'A sign: "Rope for sale. Ask about our knots." You ask. The knots ask back.'] },
    ],
    homes: {
      shop: { name: 'Mismagius\'s Curio Shop', sub: 'Candles, cobwebs, a crystal ball and jars of things that move. Mismagius hums a spell behind the counter. The door locks itself behind you.' },
      phil: { name: 'Phil\'s Treehouse', leader: 'phil', sub: 'Candles everywhere. Salt lines on the sills. A ghost-hunting kit on the table, and a chair nobody sits in. Phil looks tired.',
        away: 'Nobody\'s home. A note on the door: "At the Gym. Do NOT sit in the chair." The chair is facing you now.',
        // after eleven at night (your clock) it isn't Phil who answers
        nightAt: 23, nightSub: 'The candles burn violet. Phil sits very still in the chair nobody sits in. He smiles. Phil doesn\'t smile.',
        night: ['JONA: Phil is asleep. I am not. I never am.', 'JONA: Such a long way up, these bridges. Such a long way down.', 'JONA: Sit. The chair is warm. Someone has been sitting in it.'],
        cast: {
          misdreavus: ['Misdreavus giggles from behind the curtain. Phil says it isn\'t his.', 'Misdreavus: "I keep JONA company. Someone has to."', 'Misdreavus blows out a candle. Then lights it again. It thinks that\'s hilarious.'],
        } },
      ricky: { name: 'Ricky\'s Treehouse', leader: 'ricky', sub: 'Blackout curtains, two monitors, a headset on a hook and three empty mugs. Ricky is answering emails in a hoodie.',
        away: 'Nobody\'s home. The PC is still on. A note: "At the Gym. If the boys ping, I\'m NOT online."',
        // from ten at night (your clock) the boys are on, from their dinner, and he's in it till two
        nightAt: 22, nightSub: 'The room is dark but for the monitors. Ricky has his headset on. "One more," he says, to nobody in the room.',
        night: ['*into the headset* No, I\'m not tired. Who said I\'m tired. Go mid.', '*to you, hushed* It\'s their dinner. It\'s my 2 a.m. This is my life now.', '*into the headset* GG. Okay, one more. ONE more. Then I sleep.'] },
      nursery: { name: 'Withered Nursery', sub: 'A glasshouse up in the canopy, gone dark. The plants died long ago and nobody cleared them. The ghosts sleep here now.',
        cast: {
          chandelure: ['Chandelure\'s flames turn to watch you. They\'re warm. They want to be warmer.', 'Chandelure: "Stay a while. Stay as long as you like. Stay forever."'],
          cofagrigus: ['Cofagrigus stretches four black hands towards you. Then pretends it didn\'t.', 'Cofagrigus: "The keeper sleeps in me now. Very peaceful. Would you like a turn?"'],
          dusclops: ['Dusclops stares with its one red eye. It hasn\'t blinked since you walked in.', 'Dusclops: "Everything that falls from the bridges ends up inside me. Everything."'],
          spiritomb: ['Spiritomb\'s keystone hums. A hundred and eight voices whisper your name.', 'Spiritomb: "We were all visitors once. We liked it so much we stayed."'],
          gengar: ['Gengar grins from the shadow of a dead fern. Its grin stays when it goes.', 'Gengar: "Your shadow looks comfy. Mind if I borrow it? Kehehe."'],
        } },
    },
    requests: [
      req('th-fights', 'Win {n} fights in Thornwood', 4, 'fight'),
      req('th-events', 'Explore {n} ❓ rooms in Thornwood', 2, 'event'),
      req('th-alpha', 'Beat an Alpha in Thornwood', 1, 'alpha'),
      req('th-upgrade', 'PP Up a move in Thornwood', 1, 'upgrade'),
      req('th-gym', 'Beat Thornwood\'s Gym Leader', 1, 'gym'),
    ],
    leaders: {
      phil: [
        'PHIL: Up here the wind sounds like whispering. That\'s the wind. I checked. Mostly.',
        'PHIL: I moved up a tree to get away from her. She came up the ladder.',
        'PHIL: If my lights go purple tonight, don\'t knock. Please don\'t knock.',
        'PHIL: I salt the bridges. The others think it\'s for grip. Let them.',
        'PHIL: Ricky\'s up at all hours too. We wave at each other at 3 a.m. He\'s gaming. I\'m... watching the corners.',
        'PHIL: Heading into Thornwood? It\'s quiet in there. Too quiet. Good luck.',
        'PHIL: Everyone else in Highbough is a ghost. Honestly? Better neighbours than JONA.',
      ],
      ricky: [
        '*yawns* Oh. Hey. I was up till three. The boys wanted "one more".',
        'Living in a tree is great for the Wi-Fi. Don\'t ask how. I put the router on a branch.',
        'I have a meeting at nine. It\'s a treehouse meeting. I still have to be awake.',
        'Phil waves at me at 3 a.m. sometimes. At least I think it\'s Phil.',
        'I\'m thirty-two. In tree years that\'s... I don\'t know. I\'m too tired for the maths.',
        'Going into Thornwood? Go to bed after. Learn from me.',
        'The whole village is ghosts. They knock on my window at four. I tell them I\'m in a match.',
      ],
    },
    stands: [[7, 4], [17, 6], [27, 8], [31, 4], [6, 13], [4, 16], [13, 19], [19, 17], [14, 15], [20, 19], [26, 18],
      [31, 17], [5, 28], [8, 26], [16, 28], [20, 29], [14, 26], [28, 27], [31, 29], [27, 31], [8, 5]],
    folk: [
      { id: 'gastly', name: 'Gastly', move: 'float', speed: 1.4, likes: ['stand'],
        quips: ['Gaaas...', '*hisses*', 'Hee hee.', '*drifts through a railing*'],
        play: ['I\'m ninety-five percent gas. The rest is spite.', 'Gastly.', 'Breathe in. Go on. ...Now you\'re a bit haunted.', '*wraps round a lantern*'],
        you: ['Ooh. {name}. You\'re warm. I like warm.', 'Don\'t lean on the ropes. I loosened some. Which ones? Guess.', 'The last traveller stayed for good. You can see them at night, if you look down.'] },
      { id: 'haunter', name: 'Haunter', move: 'float', speed: 1.5, likes: ['stand'],
        quips: ['Haunt!', '*licks the air*', 'Hehehe.', '*waves its hands at you*'],
        play: ['I lick people. It makes them shiver. It\'s my whole thing.', 'Haunter.', 'Ricky\'s light is on again. I\'ll go and stand behind him.', '*floats upside down*'],
        you: ['Boo! ...Ugh, you didn\'t jump. Nobody jumps any more.', 'Behind you, {name}. No, the OTHER behind you.', 'I lived in a house down on the floor once. It was a person\'s house. Then it was mine.'] },
      { id: 'duskull', name: 'Duskull', move: 'float', speed: 1.0, likes: ['stand'],
        quips: ['Dusk...', '*stares*', '...', '*its eye glows*'],
        play: ['I follow children who stay out after dark. It\'s been so long since one came.', 'Duskull.', 'I can see through walls. You\'re all very boring inside.', '*circles the lantern*'],
        you: ['Dusk... {name}. It\'ll be dark soon. Will you still be here?', 'I counted the planks on the bridges. There\'s one more every night.', 'Don\'t look over the edge too long. The floor looks back.'] },
      { id: 'shuppet', name: 'Shuppet', move: 'float', speed: 1.3, likes: ['stand'],
        quips: ['Shup!', '*sniffs your mood*', 'Pet pet.', '*bobs eagerly*'],
        play: ['I eat bad feelings. Highbough is a buffet.', 'Shuppet.', 'Phil\'s house tastes amazing. Pure dread.', '*sways on the wind*'],
        you: ['Shup! {name}, you\'re nervous. Delicious.', 'Scared of heights? Scared of ghosts? Both? Oh, that\'s a feast.', 'Stay close. I\'ll eat the scary bits for you. Mostly.'] },
      { id: 'banette', name: 'Banette', move: 'walk', speed: 1.1, likes: ['stand'],
        quips: ['Banette.', '*zip rattles*', 'Heh.', '*cradles a pin*'],
        play: ['A child threw me away. I\'m still looking for them.', 'Banette.', 'I stitched my own mouth shut. Then I unzipped it to tell you that.', '*sharpens a needle*'],
        you: ['{name}. You wouldn\'t throw a doll away. Would you?', 'I have a doll of everyone in town. I\'m starting one of you.', 'Zip, zip. Don\'t mind me. Just counting your threads.'] },
      { id: 'drifloon', name: 'Drifloon', move: 'float', speed: 1.2, likes: ['stand'],
        quips: ['Fuwa...', '*bobs*', 'Floon~', '*string dangles*'],
        play: ['Hold my string. Go on. Just for a moment.', 'Drifloon.', 'Kids who hold on too long float away with me. I always bring them back. Eventually.', '*drifts towards the edge*'],
        you: ['Fuwa! {name}! Hold my string! ...Why not?', 'I carried the last villager away. They didn\'t even scream. Much.', 'At dusk I float over the mist. Sometimes things reach up.'] },
      { id: 'yamask', name: 'Yamask', move: 'float', speed: 1.0, likes: ['stand'],
        quips: ['Yaaa...', '*stares at its mask*', 'Mask.', '*weeps quietly*'],
        play: ['This mask is the face I had before. I look at it every day. I can\'t remember smiling.', 'Yamask.', 'I was a person once. I was from here. I think.', '*traces the mask\'s face*'],
        you: ['{name}... have we met? Before I died?', 'Don\'t try on my mask. The last one who did is still wearing it.', 'The house with the bone wind chime was mine. Somebody else lives there now. Something.'] },
      { id: 'lampent', name: 'Lampent', move: 'float', speed: 1.3, likes: ['stand'],
        quips: ['Lam...', '*glows*', 'Pent~', '*its flame flickers hungrily*'],
        play: ['I light the bridges at night. Travellers follow me. They don\'t come back.', 'Lampent.', 'Phil\'s candles are nice. I want to be his candle.', '*hangs off a branch, glowing*'],
        you: ['Lam... {name}. Follow me. I know a shortcut.', 'The village lights are me and my family. Don\'t follow the purple ones.', 'You have such a bright little spirit. I\'ll just take a peek.'] },
      { id: 'shedinja', name: 'Shedinja', move: 'float', speed: 0.8, likes: ['stand'],
        quips: ['...', '*hovers, perfectly still*', '*a hollow click*', '...'],
        play: ['...', 'Shedinja.', 'Don\'t look in the hole in my back.', '*doesn\'t move at all*'],
        you: ['...{name}. You looked in the hole.', 'I am a shell. Something crawled out of me. It lives in the Great Tree.', 'The halo is not a good sign. It never is.'] },
      { id: 'golett', name: 'Golett', move: 'walk', speed: 0.9, likes: ['stand'],
        quips: ['Go...', '*clunk*', 'Lett.', '*its eyes flicker on*'],
        play: ['I was made to guard the village. The village is gone. I guard anyway.', 'Golett.', 'Somebody built me out of clay and a soul. Not their own.', '*stomps, and the bridge sways*'],
        you: ['Go... {name}. Intruder? ...Guest. Guest. Stand still.', 'I walk the bridges all night. Something else walks them too. Bigger.', 'My seal. Don\'t touch my seal. I don\'t know what happens. Nobody does.'] },
    ],
    shared: {
      deciding: ['Where to haunt...', 'Hmm.', 'Up or across?', 'Cold wind.', 'Over to the Great Tree.'],
      stand: ['Don\'t look down.', 'Something moved in the mist.', 'Hmm hm hm.', 'The leaves are whispering again.'],
      arriving: ['Back from the floor...', 'Evening, everyone.', 'I came up the lift. Nobody was working it.', 'Made it across. Barely.'],
      leaving: ['Off to haunt the floor.', 'The lift is calling.', 'See you after dark.', 'Into the mist.'],
      nearYou: ['Oh... a living one.', 'Welcome to Highbough. Stay.', 'Going into Thornwood? Come back.', 'Mind the gaps. They\'re hungry.'],
    },
    chats: [
      ['Ricky\'s light was on all night.', 'Did you visit him?', 'I stood behind him for an hour.', 'He said "one more".'],
      ['Phil\'s lights went purple.', 'That\'s not one of us.', 'Then who is it?', '...Don\'t look at them.'],
      ['Who\'s been working the lift?', 'Nobody.', 'It went up and down all night.', 'Nobody.'],
      ['The bridge to the Nursery creaks.', 'All the bridges creak.', 'This one creaks a name.', 'Whose?'],
      ['There\'s a living one in town.', 'I know. I can smell its warmth.', 'Shall we keep it?', 'Let\'s see if it stays.'],
    ],
  },
  savanna: {
    id: 'savanna', biome: 'savanna', name: 'Sunwell Bazaar', music: 'event-outdoor', style: 'bazaar',
    sub: 'Caravans trade under the acacias round the watering hole. Walk out through the sun gate when you\'re ready.',
    first: 'A caravan trading post by the Savanna\'s watering hole: round huts, striped stalls, wagons drawn up in a ring. The road runs straight through the market and on towards Sun Rock. Everyone here is selling something.',
    trader: { id: 'persian', name: 'Persian',
      offer: 'Purr... Your {give}, for my {get}. A bargain. For you. Only for you.',
      none: 'An empty Bag? Persian doesn\'t trade in air, darling. Come back with something.',
      done: 'Prrr. Pleasure. Tell nobody what you paid. Especially not Meowth.' },
    // the Savanna's: a caravan trading post, laid out unlike the other four (the user's ask): one dusty caravan road cutting
    // straight across the map on the diagonal, in at the bottom left, out through the sun gate at the top right, the market
    // where it crosses the middle (the broken Waystone in it, stalls round it), the watering hole off to the top left with a
    // jetty and a windpump, round huts either side of the road, wagons drawn up bottom right, a kopje of boulders. T the bush
    // round the town (acacias, baobabs, termite mounds), . dry grass, # the road and the market's packed earth, , tall
    // grass, f flowers, ~ the watering hole, - the jetty, | a lone acacia, n a market stall, L a torch, b a bench, c a crate,
    // k a barrel, R the request board; a capital is a building.
    map: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT##TTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT##TTTTT',
      'TTTT.............AAA......,,,###..TTTT',
      'TTT..............AAA..JJJ.,,,###...TTT',
      'TT...........~~~~AAA..JJJ.,,##...,,.TT',
      'TT....~~~~~~~~~~~~....JJJ..##....,,.TT',
      'TT..~~~~~~~~~~~~~f........##..L..,,.TT',
      'TT..~~~~~~~~~~~~~........##.........TT',
      'TT.~~~~~~~~~~~~~..PP.....##....GGG..TT',
      'TT.~~~~~~~-~~~~~..PP....|#.....GGG..TT',
      'TT..~~~~~~-~~~~........##......GGG..TT',
      'TT.~~~~~~~-~~~~.......##...|........TT',
      'TT..~~~~~~-~~..DDD...##............TTT',
      'TT..........f..DDD...##.......f....TTT',
      'TT....|L.b.....DDD..##..........KKK.TT',
      'TT.................##....SSSS...KKK.TT',
      'TT............L#n####n#L.SSSS...KKK.TT',
      'TTTCCCCCC.....#R########.SSSS.......TT',
      'TTTCCCCCC.....####WW####............TT',
      'TT.CCCCCC.....n###WW###n..L.......|.TT',
      'TT.CCCCCC.....##########....HHH.....TT',
      'TT.........L..L#n####n#L....HHH.....TT',
      'TT....f......##.............HHH....TTT',
      'TT.....MMM...##...........f.........TT',
      'TT..L..MMM..#..|........k......XXX..TT',
      'TT.....MMM.##.......EEE........XXX..TT',
      'TT.BBB....##........EEE..VVV........TT',
      'TT.BBB...##.,,,,,..LEEE..VVV.ck...k.TT',
      'TT.BBB...##.,,,,,...................TT',
      'TT......##..,,,,,............,,,,,,.TT',
      'TT.,,,,##...........|......b.,,,,,,.TT',
      'TT.,,,##.....|...............,,,,,,.TT',
      'TTT,,##......................,,,,,,TTT',
      'TTTT.##...........................TTTT',
      'TTT###TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTT##TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    door: { x: 4, y: 35 }, gate: { x: 31, y: 0 },
    buildings: [
      { at: 'W', id: 'waystone', kind: 'waystone', door: { x: 18, y: 20 },
        knock: ['A standing stone in the middle of the market, split down the middle. The traders set their stalls round it like it\'s still whole.', 'The Waystone hums. The heat shimmer round it bends the wrong way.', 'Someone has tied a strip of bright cloth round the crack. For luck, a trader says.'] },
      { at: 'P', id: 'windpump', kind: 'windpump' },
      { at: 'K', id: 'kopje', kind: 'kopje' },
      { at: 'S', id: 'shop', name: 'PERSIAN\'S BAZAAR', door: { x: 27, y: 18 }, home: 'shop', roof: '#c83a5a', kind: 'shop' },
      { at: 'C', id: 'caravanserai', name: 'CARAVANSERAI', door: { x: 6, y: 21 }, home: 'caravanserai', roof: '#e0a040', kind: 'caravanserai' },
      { at: 'M', id: 'machew', name: 'MACHEW', door: { x: 8, y: 26 }, home: 'machew', roof: '#3a2a3a' },
      { at: 'J', id: 'jerome', name: 'JEROME', door: { x: 23, y: 6 }, home: 'jerome', roof: '#e85aa8' },
      { at: 'A', id: 'a', door: { x: 18, y: 5 }, roof: '#d8a040', knock: ['A voice: "If it\'s about the Doduo, it ran off on its own. Both heads agreed."', 'A bead curtain rattles in the doorway. Nobody comes through it.'] },
      { at: 'D', id: 'd', door: { x: 16, y: 15 }, roof: '#c86a3a', knock: ['A potter\'s wheel is spinning inside. It slows when you knock. Then speeds up again.', 'A sign: "Water jars. Fired in the sun. Don\'t touch, still hot."'] },
      { at: 'B', id: 'b', door: { x: 4, y: 29 }, roof: '#8a5a3a', knock: ['An old voice: "Rain comes once a year. The market comes every day. Guess which we count on."', 'Snoring. A Hippopotas is asleep across the doorway. You go round. There is no round.'] },
      { at: 'E', id: 'e', door: { x: 21, y: 28 }, roof: '#5a8a4a', knock: ['A child: "Mum! Someone\'s at the hut! Is it the man with the sword?"', 'Drums inside. Somebody\'s practising. Somebody else is asking them to stop.'] },
      { at: 'G', id: 'g', door: { x: 32, y: 11 }, roof: '#3a7ab8', knock: ['A note: "Gone to Sun Rock to watch the sunrise. Back when it\'s too hot."', 'No answer. A Trapinch has dug a pit right in front of the door. You step round it.'] },
      { at: 'H', id: 'h', door: { x: 29, y: 23 }, roof: '#b84a3a', knock: ['A voice: "We\'re closed! The heat! Come back at dusk, everyone comes back at dusk."', 'Spices drift out under the door. Somebody inside sneezes. Then again.'] },
      { at: 'V', id: 'v', kind: 'wagon', door: { x: 26, y: 28 }, roof: '#e8dcc0', knock: ['A caravan wagon, its canvas laced shut. "Gone to the next market," a tag says. "Back next season."', 'Something inside clanks. The Blitzle tied up by the wheel snorts at you.'] },
      { at: 'X', id: 'x', kind: 'wagon', door: { x: 32, y: 26 }, roof: '#d86a4a', knock: ['A voice from inside the wagon: "Fortunes told! Two coins!" A pause. "Ah. You\'re not buying. I knew that."', 'The wagon creaks. Somebody is asleep in a hammock in there. Somebody is always asleep in a hammock.'] },
    ],
    homes: {
      shop: { name: 'Persian\'s Bazaar', sub: 'A great striped tent of rugs, jars and brass lamps, cushions everywhere. Persian lounges on the counter, pretending not to watch you.' },
      machew: { name: 'Machew\'s Hut', leader: 'machew', sub: 'Blackout cloth over the windows in the middle of the Savanna. A plastic katana on a stand, a Tales of Berseria poster, a hood on a hook. Machew is brooding. It\'s 30 degrees.',
        away: 'Nobody\'s home. A note pinned to the door with a throwing star: "At the Gym. The shadows called. Do not touch the katana."',
        // from ten at night (your clock) he's on the roof, in the moonlight, "training"
        nightAt: 22, nightSub: 'One candle. Machew sits cross-legged in the dark, his plastic katana across his knees, the Berseria soundtrack playing very quietly.',
        night: ['...The night is when my true power awakens. Also it\'s cooler.', '*whispers* Velvet... I understand now... *notices you* ...You saw nothing.', 'I\'m meditating. On darkness. And on whether to start Berseria a fifth time.'] },
      jerome: { name: 'Jerome\'s Hut', leader: 'jerome', sub: 'A crib in the corner, a baby asleep in it. Jerome is on the PC with r/GTA6 open in eleven tabs. A countdown to the release date is taped over the crib.',
        away: 'Nobody\'s home but the baby\'s grandmother. "He\'s at the Gym," she sighs. "Says he\'s saving up for some game. Again."',
        // after nine at night the baby's asleep and he's refreshing Reddit in the dark, whispering
        nightAt: 21, nightSub: 'The hut\'s dark but for the monitor. The baby is asleep. Jerome is refreshing r/GTA6, whispering at the screen.',
        night: ['*whispering* Shh. Baby\'s asleep. ...Did you see? Someone found a new pixel in the trailer.', '*whispering* My wife thinks I\'m feeding the baby. I fed the baby. Then I fed Reddit.', '*whispering* If it gets delayed again I\'m going to scream. Quietly. Baby\'s asleep.'] },
      caravanserai: { name: 'The Caravanserai', sub: 'A cool stone courtyard where the caravans rest out of the sun: hay in the stalls, a trough, water jars. The caravans\' Pokémon doze in the shade.',
        cast: {
          tauros: ['Tauros snorts. "I pull the big wagon. Three tails, three times the work."', 'Tauros: "The road to Sun Rock? Straight on. Everything here is straight on."'],
          rapidash: ['Rapidash tosses its mane. Sparks drift into the hay. Everyone holds their breath.', 'Rapidash: "I carry the mail. Fastest in the Savanna. Ask anyone. Don\'t ask Doduo."'],
          zebstrika: ['Zebstrika\'s mane crackles. "I light the market at night. Plug in a lamp, I don\'t mind."', 'Zebstrika: "Blitzle out there is my kid. Don\'t tell it I said it\'s doing well."'],
          bouffalant: ['Bouffalant lowers its afro at you. Then lets you pat it. It\'s very soft.', 'Bouffalant: "The caravan stops when I stop. I stop a lot."'],
          kangaskhan: ['Kangaskhan keeps the courtyard. The baby in its pouch waves at you.', 'Kangaskhan: "Two babies in this town now. Mine, and Jerome\'s. Only one of us is paying attention."'],
        } },
    },
    requests: [
      req('sv-fights', 'Win {n} fights in the Savanna', 4, 'fight'),
      req('sv-quick', 'Win {n} fights in the Savanna in 4 turns or fewer', 2, 'quick'),
      req('sv-mart', 'Buy {n} things at the Savanna\'s Mart', 2, 'mart'),
      req('sv-relic', 'Find a relic in the Savanna', 1, 'relic'),
      req('sv-gym', 'Beat the Savanna\'s Gym Leader', 1, 'gym'),
    ],
    leaders: {
      machew: [
        '...You\'ve come to the market. Everyone comes to the market. I come for the shadows between the stalls.',
        'The sun here is merciless. Like the Abbey. I wear the hood anyway. It\'s part of who I am.',
        'Persian tried to sell me a "cursed" scarf. It was cursed. I bought two.',
        'Jerome talks about his game all day. I talk about mine. We don\'t listen to each other. It works.',
        'I sharpen my blade every evening at the watering hole. It\'s plastic. It doesn\'t sharpen. That\'s not the point.',
        'Heading into the Savanna? Walk in the shade. Strike from the shadows. Bring water.',
      ],
      jerome: [
        'Oh, hey. Did you know they recreated a whole savanna in GTA 6? Probably. Unconfirmed. Somebody on Reddit said.',
        'Yeah, I live here. The Wi-Fi\'s bad but you can see the trailer on my phone if you hold it up by the windpump.',
        'My kid\'s three weeks old. Or four. GTA 6 is two hundred and twelve days away. That one I know exactly.',
        'Persian sells GTA 6 pre-order cards. They\'re fake. I bought three. Just in case.',
        'Machew says he\'s a character in a game. I said cool, which game. He said I wouldn\'t understand. He\'s right.',
        'Going into the Savanna? Cool. If you see a gas station out there, take a picture. For the subreddit.',
      ],
    },
    stands: [[13, 13], [11, 13], [8, 13], [17, 10], [20, 9], [16, 17], [22, 17], [16, 20], [22, 20], [20, 16], [17, 22],
      [27, 19], [24, 18], [29, 26], [30, 28], [24, 27], [28, 24], [6, 22], [10, 27], [18, 26], [30, 12], [20, 6], [33, 18]],
    folk: [
      { id: 'girafarig', name: 'Girafarig', move: 'walk', speed: 1.3, likes: ['stand'],
        quips: ['Rig!', 'Gira?', '*the tail looks at you*', 'Farig.'],
        play: ['My front half buys. My back half haggles. We get great deals.', 'Girafarig!', 'I can see over every stall. Persian hates it.', '*both heads look in different directions*'],
        you: ['Rig! Hello, {name}! My tail says hello too. It bites, a little.', 'From up here you can see Sun Rock. It\'s glowing today.', 'The acacia leaves on the top branches are the best. Nobody else can reach. Lucky me.'] },
      { id: 'phanpy', name: 'Phanpy', move: 'hop', speed: 1.6, likes: ['stand'],
        quips: ['Phan!', 'Pyyy!', '*splashes*', '*trumpets*'],
        play: ['I sprayed Persian at the watering hole. By accident. Mostly.', 'Phanpy!', 'Everyone needs a bath in this heat. I\'m helping.', '*rolls in the dust*'],
        you: ['Phan! {name}! Want a shower? I have a whole trunk of water!', 'The watering hole is best at dawn. Everybody comes. Even the shy ones.', 'Donphan says when I\'m bigger I can roll all the way to Sun Rock.'] },
      { id: 'hippopotas', name: 'Hippopotas', move: 'walk', speed: 0.9, likes: ['stand'],
        quips: ['Hippo.', '*sand puffs out*', 'Potas!', '*yawns*'],
        play: ['I sleep in front of hut B. They keep stepping over me.', 'Hippopotas.', 'Sand keeps you cool. Try it. Roll in it.', '*shakes sand off*'],
        you: ['Hippo. Oh, {name}. Mind the sand. It\'s mine.', 'The heat doesn\'t bother me. Nothing bothers me.', 'When the caravan comes I hide under the wagons. Shade and gossip.'] },
      { id: 'sandile', name: 'Sandile', move: 'walk', speed: 1.4, likes: ['stand'],
        quips: ['Sand.', '*grins*', 'Dile!', '*squints*'],
        play: ['My eyes are like sunglasses. Built in. Very cool.', 'Sandile.', 'I watch the market. Nobody watches me back.', '*buries itself to the nose*'],
        you: ['Sand. {name}. You look like you could use shade.', 'Persian waters down the Berry juice. You didn\'t hear that from me.', 'Down past the sun gate the sand gets hot enough to cook on. I nap there.'] },
      { id: 'blitzle', name: 'Blitzle', move: 'hop', speed: 2.1, likes: ['stand'],
        quips: ['Blitz!', '*crackle*', 'Zle!', '*stamps*'],
        play: ['I charge the market\'s lamps every night. I\'m a big deal.', 'Blitzle!', 'Mum pulls the big caravan. One day I\'ll pull it too.', '*mane flashes*'],
        you: ['Blitz! {name}! Race you to the windpump!', 'Don\'t touch my mane. Unless you like your hair standing up.', 'Ponyta thinks it\'s faster. Ponyta is wrong. Ponyta is very wrong.'] },
      { id: 'mankey', name: 'Mankey', move: 'hop', speed: 1.8, likes: ['stand'],
        quips: ['Man!', '*fumes*', 'Key!', 'Hmph!'],
        play: ['Somebody took my spot at the stall. I\'m FURIOUS. Again.', 'Mankey!', 'The heat makes me angry. The cold made me angry too.', '*stomps*'],
        you: ['Man! {name}! What are you looking at! ...Hi.', 'Persian overcharged me. I\'m going to stare at Persian until it gives me a discount.', 'Machew says anger is a path to power. I said I KNOW.'] },
      { id: 'trapinch', name: 'Trapinch', move: 'hop', speed: 1.0, likes: ['stand'],
        quips: ['Trap.', '*digs*', 'Pinch!', '*clacks jaws*'],
        play: ['I dug a pit. A small one. For practice.', 'Trapinch.', 'One day I\'ll have wings. Today I have a big head.', '*sand pours off its head*'],
        you: ['Trap! {name}! Watch your step. I\'m serious.', 'Hut G\'s doorstep is my best pit yet. They\'re not happy.', 'The desert past Sun Rock is where the real diggers live.'] },
      { id: 'doduo', name: 'Doduo', move: 'hop', speed: 2.0, likes: ['stand'],
        quips: ['Do!', 'Duo!', '*both heads squawk*', '*runs on the spot*'],
        play: ['LEFT: I want to go to the watering hole. RIGHT: I want to go to the market. BOTH: ...', 'Doduo!', 'We run the mail with Rapidash. We\'re faster. We argue less. No we don\'t.', '*one head pecks the other*'],
        you: ['LEFT: Hi, {name}! RIGHT: Hi! LEFT: I said it first. RIGHT: You did not.', 'We ran off from hut A. It was a mutual decision. Both heads agreed.', 'Sun gate\'s that way! LEFT: No it isn\'t. RIGHT: Yes it is.'] },
      { id: 'ponyta', name: 'Ponyta', move: 'hop', speed: 2.2, likes: ['stand'],
        quips: ['Pony!', '*flames flicker*', 'Ta!', '*tosses mane*'],
        play: ['Mind the hay. I\'ve set it on fire three times this week.', 'Ponyta!', 'Rapidash is my hero. Blitzle is my rival. Blitzle doesn\'t know yet.', '*gallops in a circle*'],
        you: ['Pony! {name}! Don\'t stand too close, I\'m a bit... fiery.', 'The grass out there catches if you look at it. I\'ve learned. Mostly.', 'Out past the sun gate, the wildfires never stop. Run fast.'] },
      { id: 'sudowoodo', name: 'Sudowoodo', move: 'walk', speed: 0.8, likes: ['stand'],
        quips: ['...', 'Sudo!', '*pretends to be a tree*', 'Woodo.'],
        play: ['I\'m an acacia. A short one. Nobody suspects.', 'Sudowoodo.', 'I\'m not thirsty. Trees don\'t get thirsty. ...Okay, I\'m going to the watering hole.', '*holds its arms out like branches*'],
        you: ['...I\'m a tree. Oh, {name}. Fine. Hello.', 'Phanpy watered me yesterday. I didn\'t like it. I couldn\'t say anything. I\'m a tree.', 'The acacias out there are real. Probably. I don\'t ask.'] },
    ],
    shared: {
      deciding: ['Which stall...', 'Hmm.', 'Too hot to decide.', 'Water first.', 'Over to the market.'],
      stand: ['Phew, this heat.', 'Smell the spices?', 'Hmm hm hm.', 'Any shade round here?'],
      arriving: ['The caravan\'s in!', 'Morning, everyone!', 'Phew, that road.', 'Made it before noon!'],
      leaving: ['Off to the watering hole!', 'Caravan\'s leaving.', 'See you at dusk!', 'Nap in the shade.'],
      nearYou: ['Oh! A traveller.', 'Welcome to Sunwell Bazaar!', 'Going into the Savanna?', 'Buying anything?'],
    },
    chats: [
      ['Persian raised its prices.', 'Again?', 'It says it\'s the heat.', 'Everything is the heat.'],
      ['Is Machew wearing the hood again?', 'In this heat.', 'He says it\'s cold in the shadows.', 'There ARE no shadows.'],
      ['Jerome\'s baby said its first word.', 'What was it?', 'He didn\'t hear. He was on Reddit.', 'Oh no.'],
      ['Who left the jetty gate open?', 'Phanpy.', 'Phanpy says it was you.', '...It was Phanpy.'],
      ['The caravan\'s late.', 'Bouffalant stopped.', 'For how long?', 'Bouffalant decides that.'],
    ],
  },
};

/** The town at the gate of `biomeId`, or null (the Clearing is home; the Depths have none). */
export const townOf = (biomeId) => TOWNS[biomeId] || null;

/** A town's saved friendship: `done` requests handed in, `got` towards the one up now, `ready` once it's finished. */
export const townState = (save, id) => ({ done: 0, got: 0, ready: false, ...(save.towns?.[id] || {}) });

/** The request up on the board now: in order, round again once every one is done (a new batch, the same asks). */
export const currentRequest = (town, st) => town.requests[st.done % town.requests.length];

export const requestText = (r) => r.text.replace('{n}', r.n);

/** Count play into a town's request: `ctx.biome` must be the town's biome (the Shrine's fights count for the Shrine's
    village). Returns the new state and whether the request just finished. */
export function countRequest(town, st, event, amount, ctx = {}) {
  const r = currentRequest(town, st);
  if (st.ready || r.on !== event || ctx.biome !== town.biome || !(amount > 0)) return { st, finished: false };
  const got = Math.min(r.n, st.got + amount);
  return { st: { ...st, got, ready: got >= r.n }, finished: got >= r.n };
}

/** Hand the finished request in: friendship up, the next request on the board. */
export const handIn = (st) => (st.ready ? { ...st, done: st.done + 1, got: 0, ready: false } : st);

/** Whether a town's Waystone is mended (friendship enough). */
export const mended = (st) => st.done >= MEND_AT;

/* ---------- the Waystone ring and visiting from home (session 2, 2026-10-14) ---------- */

/** The towns the Clearing's Waystone reaches (js/hub-3d.js), in its menu's order: a crystal each orbiting its tip, lit
    in its town's colour once that town's Waystone is mended. A later town (a Depths camp) is a line here. */
export const RING = [
  { id: 'shrine', glow: '#ff7a5a' },
  { id: 'wastes', glow: '#ffa040' },
  { id: 'ruins', glow: '#48d8e8' },
  { id: 'thornwood', glow: '#78e878' },
  { id: 'savanna', glow: '#ffd858' },
];

/** Each town's shop sells one shelf of the Secret Base's furniture (its `group`s), only there (the mall's store never
    deals them), `SHOP_STOCK` of it a UTC day, a piece you own never dealt again. */
export const SHOP_SHELVES = { shrine: ['Japanese'], wastes: ['Hot Spring'], ruins: ['Underwater'], thornwood: ['Greenhouse', 'Garden'], savanna: ['Desert'] };
export const SHOP_STOCK = 6;
export const TOWN_SHELVES = new Set(Object.values(SHOP_SHELVES).flat());

/** The town a furniture shelf is sold in, or null. */
export const shelfTown = (group) => Object.keys(SHOP_SHELVES).find(id => SHOP_SHELVES[id].includes(group)) ?? null;

/** A townsperson living in the Secret Base keeps the town's id with it: "<town>:<pokemon>". */
export const folkKey = (town, id) => `${town}:${id}`;
export function folkOf(key) {
  const [town, id] = String(key).split(':');
  const f = TOWNS[town]?.folk.find(o => o.id === id);
  return f ? { ...f, town } : null;
}

/** Whether the Nietos are at home in their house in the Clearing (the house itself always stands): only once you've beaten
    THE NIETOS (their Kangaskhan) at the Clearing's Gym, `wins` their Gym wins, and not at all for now (the user's call,
    2026-10-14: they're working out how the Nietos turn up). `?nietos` turns it on for a page load (`&gymwins=1` to have
    beaten them). On for good: NIETOS_LIVE. */
export const NIETOS_LIVE = false;
export const nietosHome = (wins) => (NIETOS_LIVE || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('nietos'))) && wins > 0;

/** The Clearing's own houses (the user's ask, 2026-10-14): walked in from the hub like a town's homes (homeRoom() in
    js/run.js), a pseudo-town with no map, crowd or requests. The Nietos live here, the Clearing's third Gym Leaders. */
export const CLEARING = {
  id: 'clearing', biome: 'clearing', name: 'Whispering Clearing', music: 'title', home: true,
  buildings: [
    { id: 'nietos', name: 'THE NIETOS', home: 'nietos' },
  ],
  homes: {
    nietos: { name: 'The Nietos\' House', leader: 'nietos', sub: 'Toys all over the floor, a crib in the corner, two gaming chairs and one very tired couch.',
      away: 'Nobody\'s home. A note on the fridge: "At the Gym with Linc. Beat us there and come for dinner! - Law & Britt"',
      // beaten, but not home yet (NIETOS_LIVE off)
      out: 'Nobody\'s home. The car\'s gone, Kangaskhan too. A note on the fridge: "Back soon! - Law & Britt"',
      // from seven at night (your clock) Linc is asleep, and the house whispers
      nightAt: 19, nightSub: 'Linc is asleep in his crib. Law and Britt wave from the couch, whispering.',
      cast: {
        kangaskhan: ['Kangaskhan is rocking the crib with one foot and folding laundry. It nods at you.', 'Kangaskhan checks the baby monitor, then you. You seem fine. It goes back to folding.', 'Kangaskhan offers you a juice box from its pouch. It has a lot of juice boxes in there.'],
      },
      night: ['BRITT: *whispering* He JUST went down. If you wake him, you\'re babysitting.', 'LAW: *whispering* One ranked match. Quietly. Oh, umm... I mean, we\'re reading. Books.', 'BRITT: *whispering* Shh. That\'s the third time tonight. Tiptoe out, sweetie.'] },
  },
  leaders: {
    nietos: [
      'LAW: Welcome to the Nietos\' house! Shoes off. Oh, umm... I mean, mind the Lego.',
      'BRITT: Twenty-six kids at school, one at home, and Law. I count Law as two.',
      'LINC: Pika! Pika! *offers you a soggy cracker*',
      'LAW: The boys want me on at nine. Britt says no. We\'re negotiating.',
      'BRITT: Grade the homework, feed the baby, heal Law in ranked. A teacher\'s work is never done.',
      'LINC: Dada! Ba! *points at the TV*',
      'LAW: Kangaskhan babysits sometimes. It\'s a natural. Better than Lawrence, anyway.',
    ],
  },
};

/** A town by id for the houses walked in from home too (the Clearing's). */
export const placeOf = (id) => TOWNS[id] || (id === 'clearing' ? CLEARING : null);
