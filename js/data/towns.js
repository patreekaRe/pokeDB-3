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
    // the village from above (the user's ask, 2026-10-13: laid out like a Pokémon town, after their picture): a ring of
    // forest, stone roads, houses in rows, tall grass. T forest, . grass, # road, , tall grass, f flowers, L a stone
    // lantern, b a bench, R the request board; a capital is a building's footprint (BUILDINGS). You come in at the
    // bottom (`door`) and go on through the torii at the top (`gate`). 38 x 36 (the user's call: huge, never cramped),
    // its broken Waystone in the plaza at the middle (js/event-3d.js's buildTown()).
    map: [
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
      'TT,,............L.##.L..........,,,,TT',
      'TT.SSS..AAA.BBB...##...JJJ.CCC..,,,,TT',
      'TT.SSS..AAA.BBB...##...JJJ.CCC..,,,,TT',
      'TT.SSS..AAA.BBB...##...JJJ.CCC..,,,,TT',
      'TT..#....#...#....##....#...#.......TT',
      'TT.################################.TT',
      'TT.################################.TT',
      'TT....f....b...L..##..L........f....TT',
      'TT.DDDDDD.........##...MMM...PPP.TTTTT',
      'TT.DDDDDD.TTT.....##...MMM...PPP.TTTTT',
      'TT.DDDDDD.TTT.....##...MMM...PPP.TTTTT',
      'TT.DDDDDD.TTT.....##....#........TTTTT',
      'TT.DDDDDD.........##....#...,,,,,,,,TT',
      'TT...##.....L############L......,,,,TT',
      'TT...##.EEE.##ffR#####ff##.KKK......TT',
      'TT...##.EEE.##############.KKK..,,,,TT',
      'TT...##.EEE.###b##WW##b###.KKK..,,,,TT',
      'TT...##..#..######WW######..#.......TT',
      'TT##################################TT',
      'TT############ff######ff############TT',
      'TT..........L############L..........TT',
      'TT................##........,,,,,,,,TT',
      'TT.GGG..NNN..TTT..##...HHH..,,,,,,,,TT',
      'TT.GGG..NNN..TTT..##...HHH..,,,,,,,,TT',
      'TT.GGG..NNN..TTT..##...HHH..,,,,,,,,TT',
      'TT..#....#........##....#...,,,,,,,,TT',
      'TT.################################.TT',
      'TT.################################.TT',
      'TT...fff..b.....L.##.L....b...fff...TT',
      'TT,,,,,...........##...........,,,,,TT',
      'TT,,,,,..f........##........f..,,,,,TT',
      'TT,,,,,.........L.##.L.........,,,,,TT',
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
    ],
    door: { x: 18, y: 35 }, gate: { x: 18, y: 0 },
    // the buildings, every one facing south, its door on the road below it: `at` the map's letter, `door` the tile in
    // front of it, `home` the one you walk into (`homes` below), else locked (a knock says one of `knock`); `roof` its
    // tiles' colour
    buildings: [
      { at: 'S', id: 'shop', name: 'DELIBIRD\'S GOODS', door: { x: 4, y: 6 }, home: 'shop', roof: '#3a78c8', kind: 'shop' },
      { at: 'A', id: 'a', door: { x: 9, y: 6 }, roof: '#d8508a', knock: ['Nobody answers. A wind chime rings somewhere inside.', 'A sign on the door: "Out at the Shrine. Back at dusk."'] },
      { at: 'B', id: 'b', door: { x: 13, y: 6 }, roof: '#5aa060', knock: ['Someone inside calls out: "Not today, thank you!"', 'The door\'s locked. You hear a kettle whistling.'] },
      { at: 'J', id: 'john', name: 'JOHN', door: { x: 24, y: 6 }, home: 'john', roof: '#e8803a' },
      { at: 'C', id: 'c', door: { x: 28, y: 6 }, roof: '#3a78c8', knock: ['No answer. A Hoothoot peeks out of the window and hides again.', 'A note: "Gone dancing. - the Kimono Girls\' biggest fan"'] },
      { at: 'D', id: 'theater', name: 'DANCE THEATER', door: { x: 5, y: 15 }, home: 'theater', roof: '#c84838', kind: 'theater' },
      { at: 'M', id: 'jahmes', name: 'JAHMES', door: { x: 24, y: 13 }, home: 'jahmes', roof: '#5aa060' },
      { at: 'E', id: 'e', door: { x: 9, y: 19 }, roof: '#8a60c0', knock: ['A voice: "If you\'re selling Poké Balls, I have plenty!"', 'Snoring. Something big is asleep in there.'] },
      { at: 'K', id: 'k', door: { x: 28, y: 19 }, roof: '#d8508a', knock: ['The lantern maker\'s house. Paper and glue all over the step.', 'A sign: "Lanterns mended. Knock twice." You knock twice. Nothing.'] },
      { at: 'G', id: 'g', door: { x: 4, y: 27 }, roof: '#e8803a', knock: ['Someone\'s practising the shamisen. Badly. They stop when you knock.', 'No answer. Maple leaves are piled against the door.'] },
      { at: 'N', id: 'n', door: { x: 9, y: 27 }, roof: '#3a78c8', knock: ['An old voice: "The Waystone? It cracked the year the bell stopped ringing."', 'A note: "At the Shrine stair, sweeping. - Grandma"'] },
      { at: 'H', id: 'h', door: { x: 24, y: 27 }, roof: '#c84838', knock: ['You smell rice crackers baking. Nobody comes to the door.', 'A child shouts: "Mum says don\'t open it for strangers!"'] },
      // the town's broken Waystone, in the plaza at the middle: friendship mends it (MEND_AT; its ring in the Clearing is
      // the next session's). A tap reads it.
      { at: 'W', id: 'waystone', kind: 'waystone', door: { x: 18, y: 20 },
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
    stands: [[7, 9], [26, 9], [15, 13], [22, 13], [14, 17], [23, 17], [14, 19], [23, 19], [30, 15], [8, 22], [29, 22], [12, 27], [27, 27],
      [8, 31], [29, 31], [21, 4], [32, 6], [3, 18], [33, 19], [16, 23]],
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
    sub: 'Steam drifts over the rooftops from the springs. Walk out through the mine gate when you\'re ready.',
    first: 'A mining town in the volcano\'s shadow, its springs steaming in the ash. The miners nod as you pass, as if they expected you.',
    trader: { id: 'heatmor', name: 'Heatmor',
      offer: 'Hrrmor. Your {give}, for my {get}. Forged fair, traded fair.',
      none: 'Hrr... An empty Bag. Come back with something to swap.',
      done: 'Hrrmor! Good trade. Mind the stairs out.' },
    // Lavaridge's: the volcano's foot, after the Shrine's village (the user's call: every town this big). T crags, .
    // ash, # road, , dry scrub, f fire lilies, = the mine's rails, L a brazier, b a bench, c a crate, k a barrel, o a
    // spring (the pools steam), R the request board; a capital is a building. In at the bottom, out through the mine
    // gate at the top; the broken Waystone in the plaza at the middle.
    map: [
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
      'TT,MMMMM..........##...............,TT',
      'TT.MMMMM..AAA.JJJ.##..KKK.HHHH.NNN..TT',
      'TT.MMMMM..AAA.JJJ.##..KKK.HHHH.NNN..TT',
      'TT.MMMMM..AAA.JJJ.##..KKK.HHHH.NNN..TT',
      'TT.MMMMM..........##................TT',
      'TT...=...L.......L##.L........L.....TT',
      'TT.################################.TT',
      'TT.======c........##................TT',
      'TT.kc.............##................TT',
      'TT.BBBBBBBB.......##.....L.oooo.....TT',
      'TT.BBBBBBBB.......##.......oooo...L.TT',
      'TT.BBBBBBBB...##R###......b....b....TT',
      'TT.BBBBBBBB..fL########Lf...........TT',
      'TT.BBBBBBBB..##b######b##.....oooob.TT',
      'TT.BBBBBBBB..#####WW#####.....oooo..TT',
      'TT.....###########WW#####.ooob......TT',
      'TT.b......b..############...........TT',
      'TT...TTT.....############....CCCC...TT',
      'TT...TTT.....f##########f....CCCC...TT',
      'TT................##.........CCCC...TT',
      'TT.################################.TT',
      'TT................##................TT',
      'TT.SSSS..DDD.EEE..##..GGG.PPP..TTT..TT',
      'TT.SSSS..DDD.EEE..##..GGG.PPP..TTT..TT',
      'TT.SSSS..DDD.EEE..##..GGG.PPP..TTT..TT',
      'TT................##................TT',
      'TT.################################.TT',
      'TT,,,,,,.f..b.....##.....b.f..,,,,,,TT',
      'TT,,,,,,..........##..........,,,,,,TT',
      'TT,,,,,,..,,,,....##..........,,,,,,TT',
      'TT,,,,,,..,,,,....##....f.kc..,,,,,,TT',
      'TT,,,,,,..,,,,..L.##.L........,,,,,,TT',
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTT##TTTTTTTTTTTTTTTTTT',
    ],
    door: { x: 18, y: 35 }, gate: { x: 18, y: 0 },
    buildings: [
      { at: 'M', id: 'mine', kind: 'minehead', door: { x: 5, y: 7 },
        knock: ['The mine\'s lift cage is chained shut. A sign: "Closed. Something big moved down there."', 'Far below, a pick rings on rock. Then stops. Then starts again.', 'Warm air breathes up out of the shaft, smelling of sulphur.'] },
      { at: 'A', id: 'a', door: { x: 11, y: 6 }, roof: '#c84838', knock: ['A miner\'s helmet hangs on the door. Nobody\'s home; they\'re on the night shift.', 'Through the window, a Geodude is asleep in a laundry basket.'] },
      { at: 'J', id: 'j', door: { x: 15, y: 6 }, roof: '#d8883a', knock: ['A voice: "If it\'s about the noise, it\'s the volcano, not me!"', 'A note: "Gone to the springs. Back when I\'m pink."'] },
      { at: 'K', id: 'k', door: { x: 23, y: 6 }, roof: '#8a6a50', knock: ['The door\'s warm to the touch. Someone\'s baking. Or forging.', 'No answer. Ash has piled up on the step like snow.'] },
      { at: 'H', id: 'shaun', name: 'SHAUN', door: { x: 27, y: 6 }, home: 'shaun', roof: '#3a78c8' },
      { at: 'N', id: 'n', door: { x: 32, y: 6 }, roof: '#5aa060', knock: ['An old voice: "The Waystone? It split the night the volcano woke."', 'A sign: "Lava cookies, two for one. Knock loudly." You do. Nothing.'] },
      { at: 'B', id: 'bath', name: 'BATHHOUSE', door: { x: 7, y: 17 }, home: 'bath', roof: '#4a82b8', kind: 'bathhouse' },
      { at: 'C', id: 'clarence', name: 'CLARENCE', door: { x: 30, y: 22 }, home: 'clarence', roof: '#d8508a' },
      { at: 'S', id: 'shop', name: 'HEATMOR\'S FORGE', door: { x: 5, y: 27 }, home: 'shop', roof: '#e0602a', kind: 'shop' },
      { at: 'D', id: 'd', door: { x: 10, y: 27 }, roof: '#5a5a6a', knock: ['Someone inside is snoring louder than the volcano.', 'A note: "At the mine. Do NOT feed the Slugma."'] },
      { at: 'E', id: 'e', door: { x: 14, y: 27 }, roof: '#c84838', knock: ['A child: "Mum! It\'s a traveller! Can I show them my rocks?" "No!"', 'No answer. A row of polished stones sits on the sill, biggest to smallest.'] },
      { at: 'G', id: 'g', door: { x: 23, y: 27 }, roof: '#d8883a', knock: ['You smell sulphur and soap. Somebody\'s just back from the springs.', 'A voice: "Is it the boys? Tell Clarence I\'m NOT watching tonight."'] },
      { at: 'P', id: 'p', door: { x: 27, y: 27 }, roof: '#8a60c0', knock: ['A sign: "Retired. Gone digging." The door\'s been bricked shut.', 'Something rumbles inside. Probably a Graveler. Probably.'] },
      { at: 'W', id: 'waystone', kind: 'waystone', door: { x: 18, y: 18 },
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
    stands: [[9, 6], [20, 6], [29, 7], [12, 10], [25, 10], [24, 13], [33, 14], [26, 16], [11, 15], [15, 19], [22, 19], [9, 18],
      [27, 21], [3, 21], [16, 23], [33, 23], [8, 27], [20, 27], [29, 30], [8, 30]],
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
