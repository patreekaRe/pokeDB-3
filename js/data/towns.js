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

import { DEPTHS_CAMP } from './camp.js';
import { ITEMS_BY_ID } from './items.js';

/** Whether the gateway towns are on (the user's call, 2026-10-14: the new Clearing went live first, the towns still being
    built): off, runs walk straight from the journey film to the map, requests count nothing and the Clearing's Waystone
    only reads its riddles. `?towns` turns them on for a page load; `?town=` peeks work either way. On for good: TOWNS_LIVE. */
export const TOWNS_LIVE = true;
export const townsOpen = () => TOWNS_LIVE || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('towns'));

/** Friendship (requests handed in) that mends a town's Waystone (the next session's: the ring by the Ancient Tree). */
export const MEND_AT = 5;
/** What handing a request in pays, in PokéCoins (Coin Finder applies). */
export const REQUEST_COINS = 40;

const req = (id, text, n, on) => ({ id, text, n, on });

export const TOWNS = {
  shrine: {
    id: 'shrine', biome: 'shrine', name: 'Lantern Village', music: 'town-lantern',
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
      'TT.~~~--~~~.#######################.TT',
      'TT.~~~--~~~~##R####################.TT',
      'TT.~~~--~~~.b###########b#..........TT',
      'TT..~~--~~..######WW######.....,,,,.TT',
      'TT..|.##.|..######WW######.....,,,,.TT',
      'TT.f..##f...##############.....,,,,.TT',
      'TT.,,,##....##############.f.f.,,,,.TT',
      'TT.,,,##.f.f##############..........TT',
      'TT.,,,##JJJJJ....####......SSS......TT',
      'TT.,,,##JJJJJ...L####L.....SSS......TT',
      'TT.,,,##JJJJJf.f.####.f...nSSS......TT',
      'TT....##JJJJJn.b.####b.....###......TT',
      'TT.################################.TT',
      'TT.################################.TT',
      'TT...............####...............TT',
      'TT.,,,,,........L####L........,,,,,.TT',
      'TT.,,,,,.........####.........,,,,,.TT',
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
      { id: 'kimono-girl', person: true, name: 'Kimono Girl', move: 'walk', speed: 1.1, likes: ['stand'],
        quips: ['*twirls*', 'The dance is at dusk.', 'Mind the sleeves.', 'One, two, turn...'],
        play: ['The lanterns are the stage.', 'Again, from the top.', 'Step, step, bow.', 'The maples are our curtain.'],
        you: ['Good evening, {name}. Will you stay for the dance?', 'We practise every night. The Gym Leader watches, then forgets which game he was playing.', 'The fan opens like this. Slowly.'] },
      { id: 'sage', person: true, name: 'Sage', move: 'walk', speed: 0.9, likes: ['stand'],
        quips: ['Hmm.', 'Breathe in. Breathe out.', 'The bells are early.', '...'],
        play: ['The stair has a thousand steps. I have counted them twice. Two answers.', 'Silence is also a sound.', 'Hmm hm hmmm.', 'The cedars are older than the Shrine.'],
        you: ['Welcome, {name}. Climb slowly.', 'The Shrine listens. Say something kind on the stair.', 'Misdreavus rings the bells at night. I have stopped asking.'] },
      { id: 'elder', person: true, name: 'Elder', move: 'walk', speed: 0.8, likes: ['stand'],
        quips: ['Eh?', 'In my day the lanterns were candles.', 'My knees.', 'Hm hm.'],
        play: ['I lit these lanterns for sixty years.', 'Ah, the maples. Every year I say last year was redder.', 'The loud one. Bed at eleven. Good lad.', 'Eh. Eh.'],
        you: ['Ah, {name}! Come, sit. No? Young legs.', 'The Waystone split the night the bells went quiet. I remember. I think.', 'Bring me a Persim Berry next time. Or don\'t. I\'ll live.'] },
      { id: 'granny', person: true, name: 'Granny', move: 'walk', speed: 0.8, likes: ['stand'],
        quips: ['Tea\'s on.', 'Ohoho.', 'Wrap up warm.', 'Such a lovely evening.'],
        play: ['Have you eaten? You haven\'t.', 'I knitted Glaceon a scarf. It froze.', 'Ohoho, the lanterns.', 'One more cup.'],
        you: ['{name}, dear! You look thin.', 'Eevee still can\'t decide. I told it: Sylveon. Pink goes with everything.', 'Take a rice ball for the road. Take two.'] },
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
    id: 'wastes', biome: 'wastes', name: 'Cinder Springs', music: 'town-cinder', style: 'springs',
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
    // A road to every door (the user's ask, 2026-10-14: "all roads need to connect to other houses and gym houses"), and
    // Shaun's lodge east of the moat, out of the Waystone's way, a road straight down from its bridge in its place.
    // Benches moved (the user's ask, 2026-10-14): off the Waystone's island and out of the open ash, each on a paved
    // nook off a road, two looking onto the springs and two either side of the road down to the forge. Then (the user's
    // ask, 2026-10-14: 'move any awkward brazier torches... and move those benches somewhere else') a bench on a terrace
    // looking down over the lava moat and one in a little square before the forge, where the roads meet; braziers in
    // pairs at the mine's mouth, either side of the way in and of the lava bridge, the strays in the ash gone.
    map: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTT##TTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTT##TTTTTTTT',
      'TTTMMMMM.,c,.~~~~~~~TT.....L##L....TTT',
      'TTTMMMMM.,,,~~~~~~~~........##.....TTT',
      'TT.MMMMM.,,,.~~~~~~.......f.##.AAA.TTT',
      'TT.MMMMM.,,,..~~~~...CCCCC.f##.AAA..TT',
      'TT.MMMMM.......~~~...CCCCC..##.AAA..TT',
      'TT..L=##L.f....~~~...CCCCC..######..TT',
      'TT...=##...f...~~~...CCCCC..######..TT',
      'TT.c.=##......~~~...n.##....##.,,,,.TT',
      'TT.k.=##......~~~.....##....##.,,,,.TT',
      'TT...=##......~~~.....##...L##L,,,,.TT',
      'TT...=##......~~~.....###b####......TT',
      'TT.f..########---#############...f..TT',
      'TT....########---#############....f.TT',
      'TTBBBBBB.##.~~~~~~~~~~~~~~~.........TT',
      'TTBBBBBB.##.~~L......R.L.~~...HHHHH,TT',
      'TTBBBBBB.##.--....WW.....~~...HHHHH,TT',
      'TTBBBBBBn##.--....WW.....~~...HHHHH,TT',
      'TTBBBBBB.##.~~...........~~...HHHHH,TT',
      'TT.########.~~L........L.~~...n##...TT',
      'TT.########.~~~~~~--~~~~~~~....##...TT',
      'TT.......###############---######...TT',
      'TT.ooo...###############---######...TT',
      'TTooooof.........L##L...~~~.##......TT',
      'TTooooo....SSSS...##.f..~~~.##.EEE..TT',
      'TT.ooo.f...SSSS...##....~~~.##.EEEc.TT',
      'TT.........SSSS...##....~~~.##.EEEk.TT',
      'TT,,,,,....n##.ff.##....~~~.######..TT',
      'TT,,,,,.....###b####...L~~~L######L.TT',
      'TT.....#################---###......TT',
      'TT.....#################---###......TT',
      'TTTT..L##L,,,,,,,,,,,,,.~~~,,,,,,,TTTT',
      'TTTT...##,,,,,,,,,,,,,,.~~~,,,,,,,TTTT',
      'TTTTTTT##TTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTTT##TTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    door: { x: 7, y: 35 }, gate: { x: 28, y: 0 },
    buildings: [
      { at: 'M', id: 'mine', kind: 'minehead', door: { x: 5, y: 7 },
        knock: ['The mine\'s lift cage is chained shut. A sign: "Closed. Something big moved down there."', 'Far below, a pick rings on rock. Then stops. Then starts again.', 'Warm air breathes up out of the shaft, smelling of sulphur.'] },
      { at: 'A', id: 'a', door: { x: 32, y: 7 }, roof: '#c84838', knock: ['A miner\'s helmet hangs on the door. Nobody\'s home; they\'re on the night shift.', 'Through the window, a Geodude is asleep in a laundry basket.', 'An old voice: "The Waystone? It split the night the volcano woke."'] },
      { at: 'H', id: 'shaun', name: 'SHAUN', door: { x: 32, y: 20 }, home: 'shaun', roof: '#3a78c8' },
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
    stands: [[8, 8], [11, 10], [19, 10], [25, 10], [32, 9], [6, 13], [16, 18], [22, 18], [20, 20], [28, 18], [33, 21], [5, 22],
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
      { id: 'hiker', person: true, name: 'Hiker', move: 'walk', speed: 1.2, likes: ['stand'],
        quips: ['Hah!', 'Good rock.', 'Up and over!', 'Feel that heat!'],
        play: ['Climbed the crater rim this morning. Twice.', 'This boulder\'s a Geodude. No, it isn\'t. Yes, it is.', 'Hahaha! Lava!', 'Boots are melting. Worth it.'],
        you: ['Hah! {name}! Fine day for a climb!', 'Mine\'s been closed a month. I\'ve been climbing the outside of it.', 'Soak in the springs after. Not before. Trust me.'] },
      { id: 'worker', person: true, name: 'Worker', move: 'walk', speed: 1.3, likes: ['stand'],
        quips: ['On break.', 'Still closed.', 'Hard hat. Always.', 'Ugh, the heat.'],
        play: ['The mine\'s shut. I\'m on the clock anyway.', 'Machop\'s out-dug me twice this week.', 'Pass the wrench. No, the other wrench.', 'Shaun says the fuse box is "fine". It\'s smoking.'],
        you: ['{name}. Don\'t go past the mine gate. I mean it.', 'Something big\'s down there. It hums when we dig.', 'Union says I\'m owed a soak. I\'m taking it.'] },
      { id: 'black-belt', person: true, name: 'Black Belt', move: 'walk', speed: 1.3, likes: ['stand'],
        quips: ['Hyah!', 'Osu!', 'Hot sand builds strong feet.', 'Hmph.'],
        play: ['One thousand punches. Then the springs.', 'I train where the ground is hottest.', 'Hyah! Hyah!', 'Machop and I spar at dawn. It wins.'],
        you: ['Osu, {name}! Your stance is weak.', 'Kenmatta came through here once. He ate four meals and left.', 'The heat is a teacher. A rude one.'] },
      { id: 'firebreather', person: true, name: 'Firebreather', move: 'walk', speed: 1.3, likes: ['stand'],
        quips: ['Fwoosh!', '*coughs smoke*', 'Hot hot hot.', 'Watch the eyebrows.'],
        play: ['The trick is to breathe OUT.', 'Torkoal\'s my mentor. It doesn\'t know.', 'Fwooooosh!', 'Lost an eyebrow. Grew it back. Lost it.'],
        you: ['Hey, {name}! Want to see a trick? Stand back. Further.', 'The Gym Leader with the boa wants me in "the show". I said only if I get top billing.', 'Don\'t try this at home. Try it here. Here\'s fine.'] },
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
    id: 'ruins', biome: 'ruins', name: 'Driftwood Landing', music: 'town-driftwood', style: 'lagoon',
    sub: 'Boardwalks ring the drowned temple. Walk out through the old stone arch when you\'re ready.',
    first: 'A fishing village on stilts over the lagoon, built on the bones of a sunken temple. Lines are out, nets are drying, and everyone waves.',
    trader: { id: 'pelipper', name: 'Pelipper',
      offer: 'Peli-peli! Your {give}, for this {get} I fished up. Swap?',
      none: 'Peli... Nothing in your Bag? Not even a soggy one?',
      done: 'Pelipper! Nice doing business. Mind the gaps in the planks!' },
    // the Ruins': a stilted village over the lagoon (the user's ask: its own shape, nothing like the village's grid or the
    // Springs' switchback). ~ water, - boardwalk, . sand, # the temple's old paving, , reeds, f hibiscus, T the jungle
    // bank, L a tiki torch, b a bench, c a crate, k a barrel, n a net drying on its rack, s a house's name board, y a
    // moored boat, | a drowned column, R the request board; a capital is a building, on stilts. A ring of boardwalk round
    // the temple's island (the broken Waystone at its middle), spokes out to the houses over the water, in up the jetty at
    // the bottom, out through the temple's arch on the far shore. Cleaned up like Highbough (the user's ask, 2026-10-14):
    // the ring a square of boardwalk two tiles wide with water between it and the island, piers in on all four sides, every
    // spoke two wide; four locked huts, not ten; nothing on the walks or flush on the jungle; Kayl and Pat live grandly.
    map: [
      'TTTTTTTTTTTTTTTT######TTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTT########TTTTTTTTTTTTTTT',
      'TTT~~~~~~~~~~~~#L####L#~~~~~~~~~~~~TTT',
      'TT~OOO~~~~~~~~~~~~--~~~~~~~~~~~~~~~~TT',
      'TT~OOO~~~~~PPPP~~~--~~~~~~~~~KKKKK~~TT',
      'TT~OOO~~~~~PPPP~~~--~~~~|~~~~KKKKK~~TT',
      'TT~~--~~~~~PPPP~~~--~~~~~~~~~KKKKK~~TT',
      'TT~~--~~~~~~--~~~~--~~~~~~~~~KKKKK~~TT',
      'TT~~--~~~~~~--~~~~--~~~~~~~~~s----~~TT',
      'TT~-------------------------------~~TT',
      'TT~-------------------------------~~TT',
      'TT~~~~~~~~--~~~~~~--~~~~~~--~~~~~~~~TT',
      'TT~~~~~~~~--~~~~~~--~~~~~~--~~~~~~~~TT',
      'TT~QQQQQ~~--~~~~,L..L,~~~~--~~~~~~~~TT',
      'TT~QQQQQ~~--~~~f..##..f~~~--~HHHHHH~TT',
      'TT~QQQQQ~~--~~,.######.,~~--~HHHHHH~TT',
      'TT~QQQQQ~~--~~..######R.~~--~HHHHHH~TT',
      'TT~-----------..##WW##..----------~~TT',
      'TT~-----------..##WW##..----------s~TT',
      'TT~~~~~y~~--~~.b######..~~--~~~~~~~~TT',
      'TT~~~~~~~~--~~,.######.,~~--~~~~y~~~TT',
      'TT~~~~~~~~--~~~f..##..f~~~--~~~~~~~~TT',
      'TT~~~~~~~~--~~~~,L..L,~~~~--~|~~~~~~TT',
      'TT~~~~|~~~--~~~~~~--~~~~~~--y~~~~~~~TT',
      'TT~~~~~~~~--~~~~~~--~~~~~~--~~~~~~~~TT',
      'TT~~~~~~~~------------------~~~~~|~~TT',
      'TT~~~~~~~~------------------~~~~~~~~TT',
      'TT~~~~~~~~~~~~~~~~--~~~~~~~~~~~~~~~~TT',
      'TT~YYYY~~~AAAA~~~~--y~SSSS~~~~XXXX~~TT',
      'TT~YYYY~~~AAAA~~~y--~~SSSS~~~~XXXX~~TT',
      'TT~YYYY~~~AAAA~~~~--~~SSSS~~~~XXXX~~TT',
      'TT~...............--.s.............~TT',
      'TT~..,,.f.,,..,...--..,,.f,,..,,...~TT',
      'TTTck,,b,.,n,n,f,L--L,.,n,f,b,.n,kcTTT',
      'TTTTTTTTTTTTTTTTTT--TTTTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTT--TTTTTTTTTTTTTTTTTT',
    ],
    door: { x: 18, y: 35 }, gate: { x: 18, y: 0 },
    buildings: [
      { at: 'W', id: 'waystone', kind: 'waystone', door: { x: 18, y: 19 },
        knock: ['A standing stone, split down the middle. Water drips from the crack, glowing faintly blue.', 'The Waystone hums like the sea in a shell.', 'Its top lies in the shallows by the island. A Krabby lives under it now.'] },
      { at: 'Q', id: 'aquarium', name: 'AQUARIUM', door: { x: 5, y: 17 }, home: 'aquarium', roof: '#3a8ab8', kind: 'aquarium' },
      { at: 'H', id: 'pat', name: 'PAT', door: { x: 31, y: 17 }, home: 'pat', roof: '#d85a78', kind: 'houseboat' },
      { at: 'K', id: 'kayl', name: 'KAYL', door: { x: 31, y: 8 }, home: 'kayl', roof: '#9a70c8' },
      { at: 'S', id: 'shop', name: 'BAIT & TACKLE', door: { x: 23, y: 31 }, home: 'shop', roof: '#e8a030', kind: 'shop' },
      { at: 'O', id: 'beacon', kind: 'beacon', door: { x: 4, y: 6 },
        knock: ['The old beacon tower. Its door is swollen shut with the damp.', 'A Wingull nest sits on the lamp. Nobody has the heart to move it.', 'Carved over the door: "The tide remembers." Then, smaller: "Pat was here."'] },
      { at: 'A', id: 'a', door: { x: 11, y: 31 }, roof: '#3aa0a0', shape: 'saddle', knock: ['A voice: "If you\'re selling nets, we have nets. We have SO many nets."', 'A wind chime of shells clinks on the porch. Nobody answers.', 'A lease agreement is pinned to the door. Kayl\'s signature, a paw print beside it.'] },
      { at: 'P', id: 'p', door: { x: 12, y: 7 }, roof: '#e86a4a', shape: 'saddle', knock: ['A child: "Is it the Krabby? Tell it I\'m not home!"', 'A smell of grilled fish and lemon drifts out. Nobody comes.', 'An old voice: "The temple sank in one night, my gran said. We built on top. Waste not."'] },
      { at: 'X', id: 'x', door: { x: 31, y: 31 }, roof: '#d88a3a', knock: ['A note: "At the beach. Watching the tide. It\'s a full-time job."', 'Through the shutters, a Shellos is asleep on a pile of cushions.', 'Someone inside is singing along to Pat. Badly. Lovingly.'] },
      { at: 'Y', id: 'y', door: { x: 4, y: 31 }, roof: '#7ab048', knock: ['A voice: "Who\'s there?" "A traveller." "...Who\'s there?" It\'s a Slowpoke.', 'Seashells line the windowsill, smallest to biggest. One is a Shellder. It winks.', 'A note: "Gone fishing." Under it, older: "Gone fishing." Under that: "Gone fishing."'] },
    ],
    homes: {
      shop: { name: 'Pelipper\'s Bait & Tackle', sub: 'Rods, nets, buckets of bait and a bell over the counter. Pelipper waves a wing.' },
      kayl: { name: 'Kayl\'s House', leader: 'kayl', sub: 'Lavender everywhere, a bass on its stand, two cat beds, a pile of lease renewals. Kayl is mid-email.',
        away: 'Nobody\'s home but the cats. A note on the amp: "At the Gym! Beat me there and come say hi to Spooky and Reya."',
        // Spooky is the black cat (Glameow recoloured, assets/pokemon/glameow-black-front.gif), Reya the purple one; the
        // first sits by the pet bed, the second on the amp (castAt in js/leader-homes.js)
        names: { 'glameow-black': 'SPOOKY', purrloin: 'REYA' },
        cast: {
          'glameow-black': [
            'Spooky is asleep in the bass case. It is Spooky\'s bed now.',
            'Spooky flicks a fluffy tail at you and goes back to sleep.',
            'Spooky rolls onto a sprig of lavender. Purrrr.',
            'Spooky crosses your path. Then crosses back. Then again. Your luck is now a rounding error.',
            'Spooky stares at an empty corner of the room. Growls at it. The corner apologises.',
            'Spooky is very black. You only found Spooky because Spooky\'s eyes opened.',
            'Spooky pushes a pen off the desk. Holds your gaze. Pushes a second pen off the desk.',
            'Spooky is "helping" with the lease renewals. Lease #412 now has a paw print and a tooth hole.',
            'Spooky sits in the one patch of sun in the house. Then the patch moves. Spooky does not forgive it.',
            'Spooky meows once, deeply, like a door creaking in a haunted house. Then sneezes.',
            'Spooky lets you pet exactly three times. On the fourth: a warning look. You stop. Respect.',
            'Spooky is plotting. You can tell. The tail is doing the swishy thing.',
            'Spooky\'s fur is covered in lavender. Spooky smells amazing and is furious about it.',
            'Spooky stands on the bass. One string. BWOOOM. Spooky looks at you like YOU did that.',
            'Spooky wears a little witch hat in a photo on the fridge. Spooky does not want to talk about it.',
          ],
          purrloin: [
            'Reya stares at you. Then SCREAMS. Then purrs. You\'re fine.',
            'Reya sits on the keyboard. A work email sends itself.',
            'Reya has opened a cabinet again. She looks very pleased.',
            'Reya sits on the amp. The amp is warm. Reya will not be taking questions.',
            'Reya walks you to her food bowl. Points at it. It is full. She points harder.',
            'Reya: "Mrrrow." Translation: you are late, and the bowl has been empty for SIX MINUTES.',
            'Reya has stolen a sticky note. It says "FEED REYA". She is presenting it as evidence.',
            'Reya rubs her face on your shoe. You have been claimed. You live here now.',
            'Reya knocks Spooky off the cat tree. Spooky knocks Reya off the cat tree. Nobody is on the cat tree.',
            'Reya stares at the aquarium. A fish stares back. This has been going on for weeks.',
            'Reya loafs. She is a loaf. A purple loaf. Do not touch the loaf.',
            'Reya flops onto her back. Belly out. A trap. Everyone knows it\'s a trap. You touch it anyway. Ow.',
            'Reya sits in a box labelled "LEASES". The leases are on the floor. The box is hers.',
            'Reya sings along when Kayl plays bass. Off key. With feeling.',
            'Reya chirps at a Wingull through the window. "Ek ek ek ek." The Wingull is unbothered.',
          ],
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
    stands: [[16, 14], [21, 14], [15, 20], [22, 20], [16, 21], [11, 13], [26, 13], [11, 22], [26, 22], [14, 25], [23, 26], [7, 9],
      [15, 10], [24, 9], [7, 18], [29, 18], [8, 31], [13, 31], [27, 31], [33, 31], [19, 28], [18, 4], [17, 2], [20, 2]],
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
      { id: 'tuber-boy', person: true, name: 'Tuber', move: 'walk', speed: 1.5, likes: ['stand'],
        quips: ['Splash!', 'Cannonball!', 'Is it swim time?', 'Wheee!'],
        play: ['I can float FOREVER.', 'Wooper fell in. I fell in too, to help.', 'Last one in is a Slowpoke!', 'My tube\'s a Lapras. Shh.'],
        you: ['{name}! Can you swim? I can\'t! That\'s what the tube\'s for!', 'Mum says I can\'t go past the temple. The temple\'s the best bit.', 'Pat sings and the fish jump. I jump too.'] },
      { id: 'tuber-girl', person: true, name: 'Tuber', move: 'walk', speed: 1.5, likes: ['stand'],
        quips: ['Tee-hee!', 'Not wet yet!', 'Bubbles!', 'Look, a Staryu!'],
        play: ['I\'m a mermaid. A small one.', 'I found a shell with a rune on it! It\'s mine now.', 'Splishy splashy!', 'Marill says hi. I speak Marill.'],
        you: ['Hi, {name}! Wanna race to the pier? I\'ll win!', 'The temple glows at night. I watch from my window.', 'Kayl gave me a lollipop for not touching the boats. I touched one.'] },
      { id: 'sailor', person: true, name: 'Sailor', move: 'walk', speed: 1.2, likes: ['stand'],
        quips: ['Ahoy!', 'Fair winds.', 'Smell that brine!', 'Yo ho.'],
        play: ['Twenty years at sea. Two weeks on a boardwalk. It\'s worse.', 'Knots. I know all of them.', 'That Corphish stole my bait. Again.', 'Hoist! Er. Nothing to hoist.'],
        you: ['Ahoy, {name}! Land legs holding up?', 'Kayl charges a song a week to moor here. I sing badly on purpose.', 'There\'s a current under the temple. Pulls straight down. Don\'t ask how I know.'] },
      { id: 'ruin-maniac', person: true, name: 'Ruin Maniac', move: 'walk', speed: 1.0, likes: ['stand'],
        quips: ['Fascinating.', 'Look at these runes!', '*scribbles*', 'Older than old.'],
        play: ['This plank is a relic. No, it\'s just a plank.', 'If I squint, the runes say "home". Or "hum".', 'Psyduck understands the runes better than me. It won\'t share.', 'Notebook number forty.'],
        you: ['{name}! Have you SEEN the temple? Of course you have. Isn\'t it wonderful?', 'The Waystone and the temple are carved by the same hand. I\'d stake my hat on it.', 'Don\'t tell anyone, but I can\'t swim. I dig from the dry side.'] },
      { id: 'captain', person: true, name: 'Captain', move: 'walk', speed: 0.9, likes: ['stand'],
        quips: ['Hm.', 'Steady as she goes.', 'Weather\'s turning.', 'Back in my day...'],
        play: ['Retired. They gave me a boardwalk. I stand on it like a deck.', 'That tide\'s late. Tides are never late.', 'Wingull, report! ...Useless.', 'Hrm.'],
        you: ['Captain on deck, {name}. Salute optional.', 'I sailed every sea there is. The one under that temple I\'ll leave alone.', 'Pat\'s songs keep the lagoon calm. Don\'t tell him. His head\'s big enough.'] },
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
    id: 'thornwood', biome: 'thornwood', name: 'Highbough', music: 'seal', style: 'canopy',
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
    // planks, # the Great Tree's deck, f a planter box (only the Nursery's pair: the user's ask, 2026-10-14, they were in the
    // way everywhere), T the canopy, L a lantern (in a platform's outer corner, clear of every bridge and door: the user's
    // ask, 2026-10-14, they stood in the walkways), b a bench, c a crate, k a barrel, |
    // a lone giant trunk, y a lift's basket on its rope, R the request board, s a name board; a capital is a building, up on its tree. Round
    // platforms scattered over the drop like stepping stones, joined by rope bridges in no pattern but the trees': in up
    // the lift at the bottom right, the Great Tree's deck in the middle with the broken Waystone, out through the vine gate
    // at the top left.
    map: [
      'TTTTT..TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTT..TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTT.....AAA~~LfQQQQQfL~~~~~~~~~~~TTTT',
      'TTTT.....AAA~~..QQQQQ..~~.KKKKK.L~TTTT',
      'TT~~.....AAA~~..QQQQQ..~~.KKKKK..~~~TT',
      'TT~~........~~.........~~.KKKKK..~~~TT',
      'TT~~........--.........--.KKKKK..~~~TT',
      'TT~~L....b..--.........--.....s..~~~TT',
      'TT~~~~--~~~~~~~~~~~--~~~~........~~~TT',
      'TT~~~~--~~~~~|~~~~~--~~~~........~~~TT',
      'TT~~~~--~y~~~~~~~~~--~~~~~~~~~~--~~~TT',
      'TT.EEE...~~~~~~~~~~--~~|~~~~~~~--~~~TT',
      'TT.EEE...~~~~~~OOO~--~~~~~~~~~~--~~~TT',
      'TT.EEE...~~~~~~OOO~--~~~~~~~~~~--~|~TT',
      'TT.......~~##R#OOO####~~~L.SSSS..~~~TT',
      'TT.......--###########~~~..SSSS..~~~TT',
      'TT.......--###########~~~..SSSS..~~~TT',
      'TTL......~~####WWW####---.......s~~~TT',
      'TT~~~~--~~~####WWW####---........~~~TT',
      'TT~~~~--~~~###########~~~.....ck.~~~TT',
      'TT~~~~--~~~###########~~~~~--~~~~~~~TT',
      'TT~~~~--~~|L######b##L~~~~~--~~~~~~~TT',
      'TT~~~~--~~~~~--~~~~~~~~~~~~--~~~~~~~TT',
      'TT~~~~--~~~~~--~~~~~~~~~~|~--~~~~~~~TT',
      'TT.DDD.....~~..HHHHH..~~~~~--~~~~~~~TT',
      'TT.DDD.....~~..HHHHH..~~~~~--~~~~~~~TT',
      'TT.DDD.....~~..HHHHH..~~~........L~~TT',
      'TT.........~~..HHHHH..~~~.........~~TT',
      'TT.........--......s..---.........~~TT',
      'TT.........--.........---.........~~TT',
      'TT.........~~.........~~~.........~~TT',
      'TTL...b....~~L.b...b.L~~~.........~~TT',
      'TTTTT~~~~~~~~~~~~~~~~~~y~.......ckTTTT',
      'TTTTT~~~~~~~~~~~~~~~~~~~~L........TTTT',
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
      { at: 'H', id: 'phil', name: 'PHIL', door: { x: 17, y: 28 }, home: 'phil', roof: '#6a4a8a', kind: 'haunted', tree: false },
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
      { id: 'bug-catcher', person: true, name: 'Bug Catcher', move: 'walk', speed: 1.4, likes: ['stand'],
        quips: ['Bugs!', 'Shh, a Wurmple!', 'Net ready!', 'Was that a ghost or a bug?'],
        play: ['There\'s no bugs up here. Only ghosts. I\'m catching ghosts now.', 'My net went straight through Haunter.', 'Got one! ...It\'s a leaf.', 'Bugs, bugs, buuugs.'],
        you: ['{name}! Have you seen any bugs? Real ones?', 'I counted the planks on the bridge. One more than yesterday. Bugs don\'t do that.', 'If you go down to the floor, bring me a bug. Don\'t bring me a ghost.'] },
      { id: 'ranger-m', person: true, name: 'Ranger', move: 'walk', speed: 1.4, likes: ['stand'],
        quips: ['On patrol.', 'All clear. Probably.', 'Ropes checked.', 'Stay on the bridges.'],
        play: ['Somebody keeps loosening these ropes.', 'I tie them. Gastly unties them. It\'s our routine.', 'Lift\'s been running by itself. I logged it.', 'Patrol, patrol.'],
        you: ['Ranger on duty. Watch your step, {name}.', 'Ricky\'s light was on all night again. I knocked. He said "one more".', 'Never look over the edge for more than a few seconds. Rule one of the canopy.'] },
      { id: 'ranger-f', person: true, name: 'Ranger', move: 'walk', speed: 1.4, likes: ['stand'],
        quips: ['Report filed.', 'Nothing to see.', 'Ugh, cobwebs.', 'Eyes up.'],
        play: ['The Nursery bridge creaks. I\'m not fixing it. It likes creaking.', 'I filed a report on the ghosts. They filed one on me.', 'Banette made a doll of me. It\'s quite good.', 'Clipboard. Pen. Courage.'],
        you: ['Evening, {name}. Do you have a lantern? You\'ll want one.', 'Phil\'s lights went purple last night. That\'s not on my list.', 'If something calls your name from below, it isn\'t me.'] },
      { id: 'medium', person: true, name: 'Medium', move: 'walk', speed: 1.0, likes: ['stand'],
        quips: ['They\'re here.', 'Mmmm...', 'The veil is thin tonight.', '*stares past you*'],
        play: ['Duskull says hello. It\'s behind you.', 'I talk to the ones down on the floor. They talk back. Constantly.', 'Ommm.', 'The planks whisper your name. Well, a name.'],
        you: ['{name}... you have a friend with you. No, the other one.', 'I can hear the Waystone. It\'s sad, not angry. Mostly.', 'Don\'t mind the cold spot. It likes you.'] },
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
    id: 'savanna', biome: 'savanna', name: 'Sunwell Bazaar', music: 'town-sunwell', style: 'bazaar',
    sub: 'Caravans trade under the acacias round the watering hole. Walk out through the sun gate when you\'re ready.',
    first: 'A caravan trading post by the Savanna\'s watering hole: round huts, striped stalls, wagons drawn up in a ring. The road runs straight through the market and on towards Sun Rock. Everyone here is selling something.',
    trader: { id: 'persian', name: 'Persian',
      offer: 'Purr... Your {give}, for my {get}. A bargain. For you. Only for you.',
      none: 'An empty Bag? Persian doesn\'t trade in air, darling. Come back with something.',
      done: 'Prrr. Pleasure. Tell nobody what you paid. Especially not Meowth.' },
    // the Savanna's: a caravan trading post, laid out unlike the other four (the user's ask): one dusty caravan road cutting
    // straight across the map on the diagonal, in at the bottom left, out through the sun gate at the top right, the market
    // where it crosses the middle (the broken Waystone in it, stalls round it), the watering hole off to the top left with a
    // jetty and a windpump, round huts either side of the road, wagons drawn up bottom right, a kopje of boulders. Cleaned
    // up (2026-10-14, the handoff's checklist): the road three wide, a jetty two wide, fewer huts with room between them,
    // and the Gym Leaders in grand kasbahs on 5 x 4 lots, Jerome's by the windpump, Machew's out on the east edge. Then
    // (the user's ask, 2026-10-14: the stalls round the Waystone "so lame and dinky") a real bazaar square, long stalls on
    // its four sides, and the hut by the sun gate gone. T the
    // bush round the town (acacias, baobabs, termite mounds), . dry grass, # the road and the market's packed earth, , tall
    // grass, f flowers, ~ the watering hole, - the jetty, | a lone acacia, n a market stall (a run of them one long stall), L a torch, b a bench, c a crate,
    // k a barrel, R the request board, s a name board; a capital is a building.
    map: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT##TTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT##TTTTT',
      'TTTT..|.........JJJJJ....,,,..###.TTTT',
      'TTT.............JJJJJ.|..,,,.###...TTT',
      'TT......~~~~~...JJJJJ.......###.....TT',
      'TT...~~~~~~~~~..JJJJJ......###..,,,.TT',
      'TT..~~~~~~~~~~~L.....s....###.L..|..TT',
      'TT.~~~~~~~~~~~~..f........###.......TT',
      'TT.~~~~~~~~~~~~..........###........TT',
      'TT.~~~~~~--~~~~.PP......###......f..TT',
      'TT..~~~~~--~~~..PP......###..HHH....TT',
      'TT..~~~~~--~~..........###...HHH....TT',
      'TT....~~~--~..........###.f..HHH,,,.TT',
      'TT|..f.....L..........###.......,,,.TT',
      'TT...................###L...........TT',
      'TT.CCCCCC.L.Lnnn#k#####nn........L..TT',
      'TT.CCCCCC...#############.SSSS......TT',
      'TT.CCCCCC...n##R########n.SSSS......TT',
      'TT.CCCCCC...n#####WW####n.SSSS..f...TT',
      'TT..........n#####WW####n...........TT',
      'TT......L...#############...L.....|.TT',
      'TT..........L############,,,........TT',
      'TT..........#####nnn#nnn#c..........TT',
      'TT......f...###..L...k.......MMMMM..TT',
      'TT.BBB.....###...VVV..XXX....MMMMM..TT',
      'TT.BBB...,###....VVV..XXX....MMMMM..TT',
      'TT.BBB.L.###........c....k...MMMMM..TT',
      'TT......###...|...........L.s.......TT',
      'TT......###L........................TT',
      'TT.....###....EEE.......KKK...,,,,..TT',
      'TT....###.....EEE.......KKK...,b,,..TT',
      'TT...###.,,,..EEE....f..KKK...,,,,..TT',
      'TTT..###.,,,.......................TTT',
      'TTTT###...........................TTTT',
      'TTT###TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTT###TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    door: { x: 4, y: 35 }, gate: { x: 31, y: 0 },
    buildings: [
      { at: 'W', id: 'waystone', kind: 'waystone', door: { x: 18, y: 20 },
        knock: ['A standing stone in the middle of the market, split down the middle. The traders set their stalls round it like it\'s still whole.', 'The Waystone hums. The heat shimmer round it bends the wrong way.', 'Someone has tied a strip of bright cloth round the crack. For luck, a trader says.'] },
      { at: 'P', id: 'windpump', kind: 'windpump' },
      { at: 'K', id: 'kopje', kind: 'kopje' },
      { at: 'S', id: 'shop', name: 'PERSIAN\'S BAZAAR', door: { x: 27, y: 19 }, home: 'shop', roof: '#c83a5a', kind: 'shop' },
      { at: 'C', id: 'caravanserai', name: 'CARAVANSERAI', door: { x: 5, y: 19 }, home: 'caravanserai', roof: '#e0a040', kind: 'caravanserai' },
      { at: 'M', id: 'machew', name: 'MACHEW', door: { x: 31, y: 27 }, home: 'machew', roof: '#3a2a3a' },
      { at: 'J', id: 'jerome', name: 'JEROME', door: { x: 18, y: 6 }, home: 'jerome', roof: '#e85aa8' },
      { at: 'B', id: 'b', door: { x: 4, y: 27 }, roof: '#8a5a3a', knock: ['An old voice: "Rain comes once a year. The market comes every day. Guess which we count on."', 'Snoring. A Hippopotas is asleep across the doorway. You go round. There is no round.', 'A potter\'s wheel is spinning inside. It slows when you knock. Then speeds up again.'] },
      { at: 'E', id: 'e', door: { x: 15, y: 32 }, roof: '#5a8a4a', knock: ['A child: "Mum! Someone\'s at the hut! Is it the man with the sword?"', 'Drums inside. Somebody\'s practising. Somebody else is asking them to stop.', 'A voice: "If it\'s about the Doduo, it ran off on its own. Both heads agreed."'] },
      { at: 'H', id: 'h', door: { x: 30, y: 13 }, roof: '#b84a3a', knock: ['A voice: "We\'re closed! The heat! Come back at dusk, everyone comes back at dusk."', 'Spices drift out under the door. Somebody inside sneezes. Then again.', 'A sign: "Water jars. Fired in the sun. Don\'t touch, still hot."'] },
      { at: 'V', id: 'v', kind: 'wagon', door: { x: 18, y: 26 }, roof: '#e8dcc0', knock: ['A caravan wagon, its canvas laced shut. "Gone to the next market," a tag says. "Back next season."', 'Something inside clanks. The Blitzle tied up by the wheel snorts at you.'] },
      { at: 'X', id: 'x', kind: 'wagon', door: { x: 23, y: 26 }, roof: '#d86a4a', knock: ['A voice from inside the wagon: "Fortunes told! Two coins!" A pause. "Ah. You\'re not buying. I knew that."', 'The wagon creaks. Somebody is asleep in a hammock in there. Somebody is always asleep in a hammock.'] },
    ],
    homes: {
      shop: { name: 'Persian\'s Bazaar', sub: 'A great striped tent of rugs, jars and brass lamps, cushions everywhere. Persian lounges on the counter, pretending not to watch you.' },
      machew: { name: 'Machew\'s Kasbah', leader: 'machew', sub: 'Blackout cloth over the windows in the middle of the Savanna. A plastic katana on a stand, a Tales of Berseria poster, a hood on a hook. Machew is brooding. It\'s 30 degrees.',
        away: 'Nobody\'s home. A note pinned to the door with a throwing star: "At the Gym. The shadows called. Do not touch the katana."',
        // from ten at night (your clock) he's on the roof, in the moonlight, "training"
        nightAt: 22, nightSub: 'One candle. Machew sits cross-legged in the dark, his plastic katana across his knees, the Berseria soundtrack playing very quietly.',
        night: ['...The night is when my true power awakens. Also it\'s cooler.', '*whispers* Velvet... I understand now... *notices you* ...You saw nothing.', 'I\'m meditating. On darkness. And on whether to start Berseria a fifth time.'] },
      jerome: { name: 'Jerome\'s Kasbah', leader: 'jerome', sub: 'A crib in the corner, a baby asleep in it. Jerome is on the PC with r/GTA6 open in eleven tabs. A countdown to the release date is taped over the crib.',
        away: 'Nobody\'s home but the baby\'s grandmother. "He\'s at the Gym," she sighs. "Says he\'s saving up for some game. Again."',
        // after nine at night the baby's asleep and he's refreshing Reddit in the dark, whispering
        nightAt: 21, nightSub: 'The kasbah\'s dark but for the monitor. The baby is asleep. Jerome is refreshing r/GTA6, whispering at the screen.',
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
    stands: [[7, 13], [13, 13], [15, 8], [19, 8], [16, 17], [22, 17], [17, 20], [22, 20], [20, 16], [24, 22],
      [25, 19], [14, 16], [23, 19], [20, 25], [27, 9], [30, 15], [6, 21], [10, 24], [27, 24], [31, 28], [12, 31], [20, 29], [33, 20], [23, 4]],
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
        you: ['LEFT: Hi, {name}! RIGHT: Hi! LEFT: I said it first. RIGHT: You did not.', 'We ran off from hut E. It was a mutual decision. Both heads agreed.', 'Sun gate\'s that way! LEFT: No it isn\'t. RIGHT: Yes it is.'] },
      { id: 'ponyta', name: 'Ponyta', move: 'hop', speed: 2.2, likes: ['stand'],
        quips: ['Pony!', '*flames flicker*', 'Ta!', '*tosses mane*'],
        play: ['Mind the hay. I\'ve set it on fire three times this week.', 'Ponyta!', 'Rapidash is my hero. Blitzle is my rival. Blitzle doesn\'t know yet.', '*gallops in a circle*'],
        you: ['Pony! {name}! Don\'t stand too close, I\'m a bit... fiery.', 'The grass out there catches if you look at it. I\'ve learned. Mostly.', 'Out past the sun gate, the wildfires never stop. Run fast.'] },
      { id: 'sudowoodo', name: 'Sudowoodo', move: 'walk', speed: 0.8, likes: ['stand'],
        quips: ['...', 'Sudo!', '*pretends to be a tree*', 'Woodo.'],
        play: ['I\'m an acacia. A short one. Nobody suspects.', 'Sudowoodo.', 'I\'m not thirsty. Trees don\'t get thirsty. ...Okay, I\'m going to the watering hole.', '*holds its arms out like branches*'],
        you: ['...I\'m a tree. Oh, {name}. Fine. Hello.', 'Phanpy watered me yesterday. I didn\'t like it. I couldn\'t say anything. I\'m a tree.', 'The acacias out there are real. Probably. I don\'t ask.'] },
      { id: 'rancher', person: true, name: 'Rancher', move: 'walk', speed: 1.1, likes: ['stand'],
        quips: ['Yeehaw.', 'Hot one today.', 'Where\'s that Doduo got to?', 'Mm-hm.'],
        play: ['Herded Blitzle all morning. They herded me back.', 'The windpump squeaks. I like it.', 'Ponyta needs new shoes. Again.', 'Dust. Everywhere. Lovely.'],
        you: ['Howdy, {name}! Stay out of the noon sun.', 'The watering hole\'s best at dawn. Everyone comes. Even Machew, in that hood.', 'Persian\'s Berry juice is watered down. Everyone knows. We all buy it anyway.'] },
      { id: 'cowgirl', person: true, name: 'Cowgirl', move: 'walk', speed: 1.3, likes: ['stand'],
        quips: ['Yee-haw!', 'Giddy up!', 'Lasso practice!', 'Whoa there.'],
        play: ['I lassoed a Girafarig. It lassoed me back with its tail.', 'Race you to Sun Rock! Not now. Later.', 'Hah! Missed!', 'Phanpy keeps hosing my hat.'],
        you: ['Hi, {name}! Need a ride? I\'ve got a Ponyta. It\'s grumpy.', 'Jerome\'s baby can already ride. Well. Sit. On a Phanpy.', 'Watch the sand past the sun gate. It bites.'] },
      { id: 'waitress', person: true, name: 'Waitress', move: 'walk', speed: 1.3, likes: ['stand'],
        quips: ['Coming!', 'Table for one?', 'Iced tea?', 'Busy, busy.'],
        play: ['Persian says to smile more. I\'m smiling. This is it.', 'Two Berry juices, extra ice. The ice melted.', 'Tips go in the jar. The jar\'s a Hippopotas.', 'Order up!'],
        you: ['Hi, {name}! Can I get you anything? We\'re out of ice.', 'The caravan tips best. The Gym Leaders tip in advice.', 'Machew ordered "something cold as the void". I gave him water.'] },
      { id: 'cameraman', person: true, name: 'Cameraman', move: 'walk', speed: 1.2, likes: ['stand'],
        quips: ['Rolling!', 'Hold that pose!', 'The light\'s perfect.', 'Cut!'],
        play: ['Shooting a nature film. The nature won\'t stay still.', 'Sun Rock at golden hour. Chef\'s kiss.', 'Mankey grabbed my lens cap. That\'s the third one.', 'And... action!'],
        you: ['{name}! Don\'t look at the camera. Act natural. More natural.', 'I filmed Jerome\'s baby\'s first word. He missed it. I sold him the tape.', 'If you see the caravan, wave. It\'s for the documentary.'] },
      { id: 'gambler', person: true, name: 'Gambler', move: 'walk', speed: 1.0, likes: ['stand'],
        quips: ['Feeling lucky.', 'Double or nothing.', 'Heh.', 'The dice are hot today.'],
        play: ['I bet the Blitzle would beat the Ponyta. I\'m broke.', 'Every shell game in this bazaar is rigged. That\'s why I like it.', 'Snake eyes. Again.', 'Odds are good. Odds are always good.'],
        you: ['{name}, my friend! Care for a little wager?', 'There\'s a Game Corner back home, they say. Real slots. Real Meowth.', 'Persian\'s the house. The house always wins. I keep checking.'] },
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

/** The trader's window (js/town-trade.js): how many items it offers for the one you give. */
export const TRADE_OFFERS = 3;

/** What the trader gives for `give` (an item id): TRADE_OFFERS of its rarity's rolled order you don't hold, each
    different Bag item of that rarity its own run of them (the user's ask, 2026-10-25: two commons offered the same three),
    wrapping round once the rarity runs short. */
export function offersFor(offers, give, held) {
  const rarity = ITEMS_BY_ID[give]?.rarity;
  const free = (offers[rarity] || []).filter(id => ITEMS_BY_ID[id] && !held.includes(id));
  if (free.length <= TRADE_OFFERS) return free;
  const kin = [...new Set(held.filter(id => ITEMS_BY_ID[id]?.rarity === rarity))];
  const at = Math.max(0, kin.indexOf(give)) * TRADE_OFFERS;
  return Array.from({ length: TRADE_OFFERS }, (_, i) => free[(at + i) % free.length]);
}

/** The town at the gate of `biomeId`, or null (the Clearing is home; the Depths have none). */
export const townOf = (biomeId) => TOWNS[biomeId] || null;

/** A town's saved friendship: `done` requests handed in, `got` towards the one up now, `ready` once it's finished, and
    its questline's `quest` ({ step, got, picks, lit }, null till its leader greets you; QUESTS below). */
export const townState = (save, id) => Object.defineProperty({ done: 0, got: 0, ready: false, quest: null, ...(save.towns?.[id] || {}) }, 'id', { value: id });

/** The request up on the board now: in order, round again once every one is done (a new batch, the same asks). */
export const currentRequest = (town, st) => town.requests[st.done % town.requests.length];

export const requestText = (r) => r.text.replace('{n}', r.n);

/** Who takes the request up now, at home (the user's ask, 2026-10-14: every turn-in goes to a leader, to send you into
    their homes): the town's Gym Leaders by turns. */
export const requestBy = (town, st) => { const ids = Object.keys(town.leaders); return ids[st.done % ids.length]; };

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

/** Whether a town's Waystone is mended: its questline's shard put back (`quest.lit`), or, on a save from before the
    questlines, friendship enough. `?mended` (every town) or `?mended=shrine,ruins` shows towns mended for a page load,
    to playtest Waystone travel without walking a questline; it reads the state's `id`, which townState() keeps out of
    the save (not enumerable, so no copy of it is ever written back). */
const mendedFlag = (id) => { if (!id || typeof location === 'undefined') return false; const v = new URLSearchParams(location.search).get('mended'); return v !== null && (v === '' || v.split(',').includes(id)); };
export const mended = (st) => !!st.quest?.lit || st.done >= MEND_AT || mendedFlag(st.id);

/* ---------- the questlines (docs/roadmap.md's Towns step 6, session 1, 2026-10-14; the user's idea and plan) ----------
   A town is quiet till one of its Gym Leaders is beaten at the biome's end; the next time you pass through, that leader
   slides in to greet you (greet: the gym's slide-in, js/gym.js's gymTalk()) and tells you what broke the Waystone, and
   the board opens on the town's questline. Its steps, one at a time, in order:
     track   Do: count a missions event (track() in js/missions.js) in the town's biome, `n` times
     gather  Find: hand over `n` of a material from the Satchel (js/data/satchel.js; they drop from session 2)
     craft   Make: bring a key item made at Kurt's Workshop (session 3)
     shard   the town's Waystone Shard, from the marked Alpha on its map (session 4); handing it in lights the stone
   A step finished is handed in to the leader `by` at their house (homeRoom() in js/run.js; the board till 2026-10-14) (their `thanks`, sliding in), paying QUEST_COINS; a step
   may hand you a key item (`gives`) or ask you to pick (`pick`: John's festival). The last step is always the shard.
   Then the board rotates the town's small coin requests (`requests`). The dialogue (session 5): each step's `talk`, its
   `nudge` (its leader's word on the board while it isn't done) and what each leader says about it at home; `after`, what
   they say at home once the stone is lit, and `chats`, the folk's talk then; `awaken` (2026-10-15), each leader's word as
   they slide in, glowing, the moment the shard wakes the stone (awakenTalk() in js/gym.js). `{pick}` is the pick made (homeTalk()).
   Story under it all: the shards are Crystal Depths
   crystal, cracked when the Sealed Gate was shut. Nothing in a questline gives power in a run. */

/** What handing in a quest step pays, in PokéCoins (Coin Finder applies). */
export const QUEST_COINS = 50;

const track = (id, by, text, on, n, thanks, more) => ({ id, kind: 'track', by, text, on, n, thanks, ...more });
const gather = (id, by, text, item, n, thanks, more) => ({ id, kind: 'gather', by, text, item, n, thanks, ...more });
const craft = (id, by, text, key, thanks, more) => ({ id, kind: 'craft', by, text, key, n: 1, thanks, ...more });
const shard = (biome, by, text, thanks) => ({ id: `${biome}-shard`, kind: 'shard', by, text, key: `shard-${biome}`, n: 1, thanks });

export const QUESTS = {
  shrine: {
    story: 'The lanterns won\'t stay lit, spirits roam after dark, and John can\'t pick the festival.',
    greet: {
      john: [
        'Hey! You\'re the one who beat me. Okay. Good. I need someone decisive.',
        'See the Waystone in the plaza? Cracked straight through. It happened the night the Sealed Gate shut. I heard it go.',
        'Since then the lanterns won\'t stay lit. Spirits wander the avenue after dark. Jahmes has started going to bed at TEN.',
        'And the autumn festival is coming, and I have to pick which one we hold. I have been picking for three weeks.',
        'Start with the lanterns? Bring me Lantern Wicks from the Shrine. I\'ll put the request on the board.',
      ],
      jahmes: [
        'YOOO! The champ! Okay, okay, listen. LISTEN. The village is in TROUBLE.',
        'The Waystone cracked the night the Sealed Gate shut. Since then? Lanterns go out. Spirits come out. I go to bed EARLIER.',
        'It\'s not even eleven and I\'m in bed. Do you know what that does to a man?! Nothing good!',
        'John\'s supposed to sort the festival. He can\'t pick one. Classic John.',
        'Bring Lantern Wicks from the Shrine. Wicks! Light! Then we fix the rest. It\'s on the board!',
      ],
    },
    steps: [
      gather('sh-wicks', 'jahmes', 'Bring {n} Lantern Wicks from the Shrine', 'wick', 6,
        ['LANTERN WICKS! Look at them! I\'m so hyped I could... I\'m going to bed. It\'s 10:58.',
          'John\'s threading them in now. Next: the spirits. They come out after dark. Go calm them down for me.']),
      track('sh-spirits', 'john', 'Calm the spirits: explore {n} ❓ rooms in the Shrine', 'event', 3,
        ['The avenue was quiet last night. Quiet in a good way. Thank you.',
          'So the festival\'s on. The {pick}. You picked it, I didn\'t have to. I\'d have picked that one too. Probably.',
          'Now the lantern ring round the Waystone needs relighting, and plain lanterns won\'t hold. Kurt in the Clearing makes festival ones.'],
        { pick: { ask: 'Pick John\'s festival', fallback: 'autumn festival', options: [
          { id: 'lantern', label: 'Lantern Festival', icon: '🏮', text: 'Lanterns floating on the koi pond at midnight.' },
          { id: 'moon', label: 'Moon Viewing', icon: '🎑', text: 'Dumplings and the harvest moon over the torii.' },
          { id: 'fireworks', label: 'Fireworks Night', icon: '🎆', text: 'Fireworks off the Shrine\'s stair, and food stalls.' },
        ] } }),
      craft('sh-lanterns', 'john', 'Bring Festival Lanterns from Kurt\'s Workshop to relight the ring', 'festival-lanterns',
        ['They\'re perfect. Load-bearing, even. I checked.', 'The lantern ring round the Waystone is lit again. Look at that. Now, the stone itself...']),
      shard('shrine', 'jahmes', 'Bring back Lantern Village\'s Waystone Shard from the Shrine', [
        'THE SHARD! You found it! I\'m not even tired! ...I\'m a little tired.',
        'Put it in. Go on. Together. One, two... YOOOO!']),
    ],
    talk: {
      'sh-wicks': {
        nudge: 'WICKS! Six of them! From the Shrine! I\'d go myself but it\'s 10:40.',
        john: [
          'Jahmes wanted the wicks first. I wanted the spirits first. He decided. Somebody had to.',
          'The lanterns gutter out about an hour after dusk. Every night. I\'ve logged it. Engineer habits.',
        ],
        jahmes: [
          'Got the wicks yet? No pressure. MASSIVE pressure.',
          'The lanterns go out at ten now. TEN. So I go to bed at ten. That\'s an HOUR of Valorant a night, GONE!',
        ],
      },
      'sh-spirits': {
        nudge: 'They drift through the Shrine\'s rooms. Visit a few. I think they just want company.',
        john: [
          'The spirits aren\'t angry, I don\'t think. Lost. Like a unit with no orders. Go and keep them company in the Shrine.',
          'I\'ve narrowed the festival down to three. That\'s progress. Last week it was nine.',
        ],
        jahmes: [
          'A spirit walked through my bedroom wall at 10:59. I said "NOT NOW" and it LEFT. Respect.',
          'John\'s down to three festivals. THREE! He\'s going to make you pick. Pick FAST. I\'ll be asleep.',
        ],
      },
      'sh-lanterns': {
        nudge: 'Plain lanterns burn out. Kurt in the Clearing makes festival ones that hold.',
        john: [
          'The {pick} needs the ring round the Waystone lit. Kurt makes lanterns that hold. Mine didn\'t. I tested them. To failure.',
          'I drew Kurt a lantern spec. Twelve pages. He said "I\'ll just make a nice one". Fair.',
        ],
        jahmes: [
          'The {pick}! It\'s DECIDED! I\'m SCREAMING. Quietly. People are asleep. I should be asleep.',
          'Kurt\'s lanterns, then the ring\'s lit, then the festival. Then I sleep. I\'d sleep anyway, but HAPPIER.',
        ],
      },
      'shrine-shard': {
        nudge: 'The shard\'s out in the Shrine, over some huge Alpha. It GLOWS. Go! Before eleven!',
        john: [
          'The ring\'s lit, but the stone\'s still cracked. The shard\'s out in the Shrine, over an Alpha. Something big is guarding it.',
          'Once the stone\'s whole, the {pick} goes ahead. I\'m committed. Mostly.',
        ],
        jahmes: [
          'That Alpha is HUGE. Don\'t lose! Or lose, and come back! But WIN!',
          'I set a fourth alarm. It says "SHARD". It goes off at 10:30. In case you forget. I won\'t be awake to check.',
        ],
      },
    },
    awaken: {
      jahmes: [
        'YOOOOO! DID YOU SEE THAT?! A PILLAR! OF LIGHT! INTO THE SKY!',
        'I\'m not tired. I\'m NEVER going to be tired again. ...I\'ll be tired at eleven. But TONIGHT? Lantern Village is AWAKE!',
      ],
      john: [
        'Did you feel that? The ground hummed. The whole avenue. Every lantern lit at once.',
        'That isn\'t a crack any more. It\'s a circuit, closed. The Shrine and your Clearing, wired together. ...And I didn\'t have to decide a thing.',
      ],
    },
    after: {
      john: [
        'The {pick} was everything. I didn\'t have to decide a single thing. Best night of my life.',
        'The Waystone reaches your Clearing now. I measured the hum. It\'s in tune.',
        'Come by with snacks next time. I\'ll have the Steam Deck ready. ...Or the Thor.',
      ],
      jahmes: [
        'The lanterns stay lit ALL NIGHT now! I still go to bed at eleven! But I COULD stay up!',
        'The {pick} went on till midnight. I left at 10:55. BEST NIGHT EVER.',
        'The spirits drop by to say hi now. Polite ones. They leave before eleven.',
      ],
    },
    chats: [
      ['The lanterns are still lit!', 'It\'s past ten!', 'Is Jahmes still up?', 'No. But the lanterns are.'],
      ['Were you at the {pick}?', 'Front row.', 'John says he\'ll pick next year\'s too.', 'He won\'t.'],
      [
        'The Waystone hums at night now.',
        'Like it\'s happy.',
        'Where does it go?',
        'Wherever the traveller lives, they say.',
      ],
      ['A spirit bowed to me on the bridge.', 'Did you bow back?', 'Of course.', 'Good. They remember.'],
    ],
  },
  wastes: {
    story: 'The springs went cold, Shaun\'s comms tower is down, and Clarence wants a reopening show.',
    greet: {
      clarence: [
        'Oh, it\'s you. The one who beat me. Fine. I don\'t hold grudges. I hold POSES.',
        'You see that Waystone on the island? Cracked the night the Sealed Gate shut. The whole mountain shuddered.',
        'And the springs went cold. COLD. Do you know what cold water does to a performer?',
        'Shaun\'s tower went down too, so no stream, no show. The boys are lost without me.',
        'Bring me Magma Ore from the Wastes. We\'ll heat the springs. Then we talk about a reopening.',
      ],
      shaun: [
        'Oh. You. Your last fight against me was fine. Your positioning wasn\'t.',
        'The Waystone cracked the night the Sealed Gate shut. My tower went down the same night. Not a coincidence.',
        'No comms, no stream, no Clarence show. The boys went 0 and 5 last week. I\'ve filed a ticket.',
        'First the springs, though. Clarence won\'t stop talking about the springs. Bring Magma Ore from the Wastes.',
      ],
    },
    steps: [
      gather('wa-ore', 'clarence', 'Bring {n} Magma Ore from the Wastes to warm the springs', 'magma-ore', 5,
        ['Ohhh. Ohhh, that\'s the stuff. The springs are steaming again.', 'Skin: saved. Show: next. But Shaun needs his tower first.']),
      craft('wa-relay', 'shaun', 'Bring a Comms Relay from Kurt\'s Workshop for Shaun\'s tower', 'comms-relay',
        ['Hm. You wired this wrong. ...It works, though. Ticket closed.', 'Stream\'s back up. Clarence is already "warming up". You\'ve been warned.']),
      craft('wa-costume', 'clarence', 'Bring a Sequin Costume from Kurt\'s Workshop for the reopening show', 'sequin-costume',
        ['Sequins. A cape. You understand me.', 'Reopening show at nine. You\'re invited. The Waystone, though... it still won\'t hum.']),
      shard('wastes', 'shaun', 'Bring back Cinder Springs\' Waystone Shard from the Wastes', [
        'That\'s the shard. Hand it here. I\'ll seat it. Carefully. Unlike your plays.', 'And... there. Connection established.']),
    ],
    talk: {
      'wa-ore': {
        nudge: 'Magma Ore. From the Wastes. Five. My pores are waiting.',
        clarence: [
          'Cold springs. I sat in one this morning. I made a noise I\'m not proud of.',
          'Bring me Magma Ore from the Wastes and the springs steam again. The skin thanks you in advance.',
        ],
        shaun: [
          'Clarence has been sitting in the cold spring all morning "on principle". Ticket #4511: Clarence. Status: won\'t close.',
          'My tower\'s down, so I\'ve been shouting calls to the boys off the roof. The range is bad.',
        ],
      },
      'wa-relay': {
        nudge: 'Kurt has the parts. I have the patience. Mostly he has the parts.',
        clarence: [
          'Shaun needs his tower before there can be a stream. No stream, and the show is just me. In a room. Dancing. For no one.',
          'I rehearsed to the steam last night. It was very moving. It moved me.',
        ],
        shaun: [
          'The relay\'s the one part I can\'t fix with what\'s here. Kurt can make one. Bring it and don\'t touch the pins.',
          'I turned the tower off and on again. Twice. It didn\'t help. That never happens. It\'s the crack.',
        ],
      },
      'wa-costume': {
        nudge: 'Sequins. A cape. Kurt knows. Kurt understands.',
        clarence: [
          'A reopening show needs a reopening COSTUME. Kurt\'s on it. I sent him a mood board. Fourteen pages.',
          'Don\'t look at the sketch. Okay, look. Look at the CAPE.',
        ],
        shaun: [
          'The stream\'s back, so now he wants a costume. I said the old one\'s fine. He said I wouldn\'t understand. I don\'t.',
          'The boys won two last night. Clarence says it\'s the show coming back. It was my calls.',
        ],
      },
      'wastes-shard': {
        nudge: 'Shard\'s out in the Wastes, over an Alpha. Play it safe. You won\'t, but play it safe.',
        clarence: [
          'The show\'s back, but the Waystone\'s still dull. A dull stage is a sin.',
          'Shaun says the shard\'s over an Alpha out in the Wastes. Beat it with FLAIR.',
        ],
        shaun: [
          'The stone\'s the last bit of packet loss in this town. The shard\'s out in the Wastes, over an Alpha.',
          'Don\'t overpeek the Alpha. I\'ll know. I always know.',
        ],
      },
    },
    awaken: {
      shaun: [
        'Signal\'s up. Full bars. The stone\'s pinging your Clearing at zero latency. I\'ve never seen a connection that clean.',
        'That light was a handshake. Cinder Springs is back on the network. ...Okay. That was cool. Don\'t tell anyone I said that.',
      ],
      clarence: [
        'Now THAT. Is. An. ENTRANCE. A pillar of light? A shockwave? I\'ve been trying that with smoke machines for YEARS.',
        'The springs are steaming, the stage is lit, and the whole mountain just took a bow. Cinder Springs is back, darling. And so am I.',
      ],
    },
    after: {
      clarence: [
        'The springs are hot, the stream is up, and the Waystone glows like a footlight. Nine o\'clock is SACRED again.',
        'The reopening show? Sold out. It was free. Sold out anyway.',
        'The Waystone reaches your Clearing now. Come back for the nine o\'clock show. Front row. It\'s always front row.',
      ],
      shaun: [
        'Tower\'s up, ping\'s eleven, and the boys are climbing. Don\'t tell Clarence it isn\'t the show.',
        'Ticket #4502: traveller enters town. Status: resolved. Good work. Your positioning\'s still bad.',
        'The Waystone runs to your Clearing now. Zero latency. I tested it with a ping. And a Clarence.',
      ],
    },
    chats: [
      [
        'The springs are hot again!',
        'Finally!',
        'Clarence has been in there six hours.',
        'He says it\'s for the show.',
      ],
      [
        'Did you see the reopening show?',
        'It\'s for the boys only.',
        'Then what was that music at nine?',
        'Don\'t ask.',
      ],
      ['The Wi-Fi works again!', 'Shaun fixed the tower.', 'He says it was the crack.', 'He also said it was you.'],
      [
        'The Waystone glows at night now.',
        'Clarence uses it as a spotlight.',
        'Does the Waystone mind?',
        'It glowed brighter. So, no.',
      ],
    ],
  },
  ruins: {
    story: 'The stilt houses are sinking, and Pat\'s love letters are adrift across the lagoon.',
    greet: {
      pat: [
        '♪ ...She was mine... ♪ Oh! You. The one who beat me. Hi.',
        'See the Waystone on the island? Cracked the night the Sealed Gate shut. The tide\'s been wrong since.',
        'Kayl\'s houses are sinking. And my letters... I may have put some letters in bottles. A few. Several.',
        'They\'re out across the Sunken Ruins now. Could you fish them back? Don\'t read them.',
      ],
      kayl: [
        'Oh! You\'re the one who beat Granbull. Hi! Sorry. Everything here is on fire. Metaphorically. It\'s very wet.',
        'The Waystone cracked the night the Sealed Gate shut, and since then the lagoon\'s been rising. My stilt houses are sinking.',
        'Every single one is technically my problem. Every. Single. One.',
        'And Pat\'s been throwing love letters into the sea. In bottles. Can you fish them out of the Ruins? He\'s distracting the tenants.',
      ],
    },
    steps: [
      gather('ru-bottles', 'pat', 'Fish {n} of Pat\'s Message Bottles out of the Sunken Ruins', 'bottle', 3,
        ['My letters! You didn\'t read them. ...You read them.', 'Okay. This one\'s the real one. Take it. You\'ll know who it\'s for when you get there.'],
        { gives: 'pats-letter' }),
      craft('ru-pier', 'kayl', 'Bring Pier Supports from Kurt\'s Workshop for Kayl\'s houses', 'pier-supports',
        ['These are PERFECT. Tarred! Banded! Reya, look! ...She doesn\'t care.', 'The houses stopped sinking. Lease renewals can resume. Wonderful. Horrible.']),
      track('ru-letter', 'pat', 'Carry Pat\'s letter through the Sunken Ruins: beat its boss', 'boss', 1,
        ['You delivered it? To the end of the Ruins? And...?', '...They said they\'d think about it. THINK ABOUT IT! ♪ Like a tall glass of lemonade... ♪']),
      shard('ruins', 'kayl', 'Bring back Driftwood Landing\'s Waystone Shard from the Sunken Ruins', [
        'The shard! Oh, it\'s beautiful. It\'s the colour of the lagoon at night.', 'Let\'s put it back. Spooky, OFF the Waystone.']),
    ],
    talk: {
      'ru-bottles': {
        nudge: '♪ Message in a bottle... ♪ Three of them, out in the Ruins. Please don\'t read them.',
        pat: [
          'The tide took them further than I meant. I meant it to take them a bit. Romantically.',
          '♪ She was mine... ♪ Oh, you heard that. The bottles, yes. They sparkle out on the Ruins\' map. Like my feelings.',
        ],
        kayl: [
          'Pat\'s bottles keep washing up under the tenants\' houses. One was addressed to "the moon".',
          'Reya fished a cork out of the lagoon and screamed at it for an hour. Honestly? Proud of her.',
        ],
      },
      'ru-pier': {
        nudge: 'Pier supports! Kurt makes them! Tarred, ideally. Lavender tar, ideally ideally.',
        pat: [
          'Kayl\'s houses lean a little further every night. I\'ve been singing to them. It hasn\'t helped. It hasn\'t hurt.',
          'You\'ve got my letter. Hold onto it. I\'ll tell you who it\'s for when I\'m brave. Or when the houses stop sinking.',
        ],
        kayl: [
          'Seventeen work orders, all "house is sinking". I\'ve put them in a folder called "house is sinking".',
          'Kurt can make pier supports. I went to ask him three times. I forgot why I was there twice.',
        ],
      },
      'ru-letter': {
        nudge: 'Carry it to the end of the Ruins. You\'ll know who it\'s for when you get there.',
        pat: [
          'The letter. Take it all the way, to the end of the Ruins. Whoever\'s waiting there... they\'ll know.',
          '♪ Like a tall glass of lemonade... ♪ That\'s the first line. It\'s in the letter. Don\'t read the letter.',
        ],
        kayl: [
          'The houses stopped sinking. I cried. Spooky rolled in the varnish. Lavender everywhere. Best day.',
          'Pat\'s pacing the jetty. He gave you the letter, didn\'t he? Go. He\'s scaring the Wingull.',
        ],
      },
      'ruins-shard': {
        nudge: 'The shard\'s out in the Ruins, over an Alpha. Bring it back and I can close the work order. FINALLY.',
        pat: [
          'They\'re thinking about it. I\'m thinking about them thinking about it. It\'s a lot of thinking.',
          'The stone\'s still cracked. Kayl says the shard\'s out in the Ruins. ♪ Bring it home... ♪',
        ],
        kayl: [
          'Work order #1: "Waystone, cracked". Opened the night the Sealed Gate shut. Still open. The shard\'s over an Alpha in the Ruins.',
          'Close it and I\'ll frame the work order. With pressed lavender.',
        ],
      },
    },
    awaken: {
      kayl: [
        'Oh. Oh wow. Did you see the lagoon? It went still. Every wave at once. The tide just... remembered.',
        'I can hear the stilts creaking UP. The houses are rising. Reya\'s staring at the stone. She knows. She always knows.',
      ],
      pat: [
        '♪ ...and the light came up from the water, and the old stone learned to sing... ♪',
        'That\'s the verse I\'ve been missing. Driftwood Landing is awake, and it sounds like a love song. Thank you, traveller.',
      ],
    },
    after: {
      pat: [
        'They wrote back! In a bottle! It says "maybe"! ♪ MAYBE ♪',
        'The lagoon\'s calm again. Everything sounds like a love song. Even more than before. Somehow.',
        'The Waystone reaches your Clearing now. I could serenade you from here. I\'ve tried.',
      ],
      kayl: [
        'Every house is level, every lease renewed. I have NOTHING to do. I wrote three songs. Spooky slept on all three.',
        'The Waystone hums in B flat. I\'m sampling it. For a Tame Impala cover. Don\'t tell anyone.',
        'Reya sits on the Waystone at night now. It\'s warm. She\'s claimed it. It\'s hers.',
      ],
    },
    chats: [
      ['The houses stopped leaning!', 'Kayl cried.', 'Kayl cries at everything.', 'Kayl cried at a lease.'],
      ['Pat got a letter back!', 'From who?', 'He won\'t say.', 'He\'s been singing about it for three days.'],
      ['The tide\'s right again.', 'Since the Waystone mended.', 'Was it the stone?', 'Everything here is the stone.'],
      ['A bottle washed up this morning.', 'Another of Pat\'s?', 'No. One addressed TO Pat.', 'Oh no. He\'ll cry.'],
    ],
  },
  thornwood: {
    story: 'Something haunts the ruined conservatory. Phil hunts it; Ricky films it all night.',
    greet: {
      phil: [
        'PHIL: You. You beat me. And JONA. She\'s still annoyed about it.',
        'PHIL: The Waystone on the Great Tree cracked the night the Sealed Gate shut. Something came up out of the crack.',
        'PHIL: It lives in the Withered Nursery now. I\'ve been hunting it. I need a Spirit Lantern to see it properly.',
        'JONA: He needs a nightlight. Pathetic.',
        'PHIL: Kurt in the Clearing makes them. Bring me one. Please.',
      ],
      ricky: [
        '*yawns* Oh hey. You beat me. I was up till three, so it doesn\'t count. It counts.',
        'The Waystone cracked when the Sealed Gate shut. Since then something lives in the old Nursery. Phil\'s hunting it.',
        'I\'m filming it. All night. For content. The boys think it\'s fake. It is NOT fake.',
        'Phil needs a Spirit Lantern from Kurt\'s Workshop to see it. I need sleep. One of us is getting what they need.',
      ],
    },
    steps: [
      craft('th-lantern', 'phil', 'Bring a Spirit Lantern from Kurt\'s Workshop for Phil', 'spirit-lantern',
        ['PHIL: It\'s bright. It\'s so bright. I can see it now. It can see me too.', 'PHIL: It\'s out in Thornwood. Big. Angry. Go and beat it before JONA makes friends with it.']),
      track('th-ghost', 'ricky', 'Hunt the Nursery\'s ghost: beat an Alpha in Thornwood', 'alpha', 1,
        ['I got it ALL on camera. 4K. The boys can\'t say it\'s fake now.', '...They said it\'s fake. Anyway, the Nursery\'s safe. Phil wants to plant it again.']),
      gather('th-seeds', 'phil', 'Bring {n} Thornwood Seeds to plant the Withered Nursery again', 'seeds', 6,
        ['PHIL: Green. Something green, up here. I forgot what it looked like.', 'JONA: Disgusting. Alive things.', 'PHIL: Now, the Waystone.']),
      shard('thornwood', 'ricky', 'Bring back Highbough\'s Waystone Shard from Thornwood', [
        'The shard? Nice. I\'ll film it going in. For the VOD.', 'Three, two... it\'s glowing. It\'s actually glowing. I\'m awake now.']),
    ],
    talk: {
      'th-lantern': {
        nudge: 'PHIL: A Spirit Lantern. From Kurt. Please. I can hear it at night.',
        phil: [
          'PHIL: It hums in the Nursery. Under the floor. I need light to see it.',
          'JONA: He wants a LANTERN. I have lived nine hundred years in the dark. Pathetic.',
          'PHIL: Kurt\'s Workshop. A Spirit Lantern. Please hurry. She\'s rolling my eyes for me.',
        ],
        ricky: [
          'I\'ve got eleven hours of footage of the Nursery. It\'s mostly dark. Phil needs a lantern so I can get the good stuff.',
          'Sleep maths: Phil gets the lantern tonight, the hunt\'s tomorrow night, the meeting\'s at nine... I lose either way.',
        ],
      },
      'th-ghost': {
        nudge: 'It\'s out in Thornwood now. An Alpha. A big one. I\'ll be filming.',
        phil: [
          'PHIL: I saw it. With the lantern. It\'s... big. It went out into Thornwood. An Alpha now.',
          'JONA: It is not a ghost. It is RUDE. Nothing haunts Highbough but ME.',
        ],
        ricky: [
          'Ring light\'s charged. Batteries are charged. I\'m not charged. Go get the Alpha.',
          'The boys say my footage is fake. Beat the thing and I\'ll prove it. Then I\'ll sleep. Maybe.',
        ],
      },
      'th-seeds': {
        nudge: 'PHIL: Thornwood Seeds. Six. Something should grow up here that isn\'t afraid.',
        phil: [
          'PHIL: The Nursery\'s quiet now. It used to grow things. I want it to grow things again.',
          'JONA: Plant WEEDS. Black ones. ...No? Fine. Seeds.',
        ],
        ricky: [
          'The Nursery got its first good night\'s sleep in months. I didn\'t. I was editing.',
          'Phil wants Thornwood seeds. I\'ll film them growing. A timelapse. A twelve-hour timelapse. Oh no.',
        ],
      },
      'thornwood-shard': {
        nudge: 'The shard\'s over an Alpha in Thornwood. Get it before my meeting. Or after. I\'ll be up either way.',
        phil: [
          'PHIL: The Nursery\'s green. The ghost\'s gone. The Waystone is still cracked.',
          'JONA: Bring me the shard, little traveller. ...Bring it to the STONE. I meant the stone.',
        ],
        ricky: [
          'Last one: the shard. It\'s out in Thornwood, over an Alpha. The camera\'s already on a branch.',
          'If the stone lights up at 3 a.m., that\'s the best content I\'ll ever make.',
        ],
      },
    },
    awaken: {
      ricky: [
        'Tell me I got that. Tell me I got that on camera. A PILLAR. OF LIGHT. Straight through the canopy.',
        'The boys can\'t call this one fake. The whole forest lit up. I\'m so awake right now. Highbough is LIVE.',
      ],
      phil: [
        'PHIL: The mist is lifting off the drop. I can see the jungle floor. I haven\'t seen it since the night it cracked.',
        'JONA: Ugh. Light. Everywhere. ...The stone is singing. I hate that it\'s beautiful.',
        'PHIL: She means thank you. Highbough is awake.',
      ],
    },
    after: {
      phil: [
        'PHIL: The Nursery\'s blooming. I sleep in it sometimes. It\'s the only place she\'s quiet.',
        'JONA: The stone hums. I HATE it. ...It is somewhat soothing.',
        'PHIL: The Waystone reaches your Clearing now. I checked it for ghosts. It\'s clean. I\'ll keep checking.',
      ],
      ricky: [
        'The VOD of the mending hit a thousand views. Nine hundred and ninety were the boys saying it\'s fake.',
        'I slept six hours last night. SIX. The Nursery\'s so quiet now. The boys were furious.',
        'The Waystone glows all night now. Great nightlight. Terrible for sleep. I\'m used to that.',
      ],
    },
    chats: [
      ['Something green in the Nursery!', 'Phil planted it.', 'Phil? Planting?', 'Jona hates it. So it\'s staying.'],
      ['The knocking stopped.', 'The ghost?', 'No, Ricky. He finally went to bed.', 'At four. But still.'],
      [
        'The Great Tree stopped creaking.',
        'Since the stone mended.',
        'Ricky filmed it not creaking.',
        'For six hours?',
      ],
      ['Did you see Ricky\'s video?', 'The boys say it\'s fake.', 'I was there.', 'They say you\'re fake too.'],
    ],
  },
  savanna: {
    story: 'The watering hole is drying, a caravan was robbed, and Machew\'s katana is broken.',
    greet: {
      machew: [
        '...You. The one who bested me. The shadows remember.',
        'The Waystone in the market cracked the night the Sealed Gate shut. The watering hole has been shrinking since.',
        'Then bandits took a caravan\'s crates. I gave chase. My blade broke on the first strike.',
        'It was plastic. That is not the point. Find the crates out in the Savanna. I will meditate on my failure.',
      ],
      jerome: [
        'Oh hey, you beat me. Cool. Did you know GTA 6 has a heist mode? Unconfirmed.',
        'The Waystone cracked the night the Sealed Gate shut. Somebody on Reddit said that. Also I was there.',
        'A caravan got robbed. Crates, gone. Machew broke his sword chasing them. Plastic. I told him.',
        'Find the crates out in the Savanna. Then we do a heist to get the rest back. I\'ve been planning one. For years. In my head.',
      ],
    },
    steps: [
      track('sv-crates', 'machew', 'Track the stolen crates: explore {n} ❓ rooms in the Savanna', 'event', 3,
        ['The crates. You found their trail. The shadows guided you.', 'The rest are in the bandits\' camp. Jerome has... a plan.']),
      track('sv-heist', 'jerome', 'Jerome\'s heist: win {n} fights in the Savanna in 4 turns or fewer', 'quick', 2,
        ['IN AND OUT. That was a real heist. Fifty-fifty split. You get fifty, I get fifty.', 'Machew\'s still sad about his sword. Kurt can reforge it. With ore from Cinder Springs, he says.']),
      craft('sv-katana', 'machew', 'Bring Machew\'s Katana, reforged at Kurt\'s Workshop with Cinder Springs ore', 'katana',
        ['...It is real now. It is heavy. I am afraid of it.', 'I will carry it anyway. The path demands it. Now, the Waystone.']),
      shard('savanna', 'jerome', 'Bring back Sunwell Bazaar\'s Waystone Shard from the Savanna', [
        'The shard! That\'s worth like, at least two GTA 6s.', 'Okay, okay, it\'s going in. Not selling it. Fine.']),
    ],
    talk: {
      'sv-crates': {
        nudge: 'The bandits left a trail through the Savanna\'s ❓ rooms. Follow it. As a shadow would.',
        machew: [
          '...The crates held the caravan\'s spice. Without spice the market is only sand. And I am only a man. In a hood.',
          'My blade broke on the first strike. Nine years I trained for that strike. It was plastic. It is still nine years.',
        ],
        jerome: [
          'Caravan got robbed. Persian says it\'s a crime. I say it\'s a heist. There\'s a difference. Style.',
          'Find where the crates went. Then it\'s my turn. I\'ve watched the trailer four hundred times. I\'m ready.',
        ],
      },
      'sv-heist': {
        nudge: 'In and out. Four turns or less. Twice. That\'s how they\'d do it in GTA 6. Probably.',
        machew: [
          'Jerome has a "plan". He drew it on a napkin. The napkin is a drawing of a car.',
          '...I will not join the heist. My blade is broken. I will watch from the shadows. Behind that pillar.',
        ],
        jerome: [
          'The plan: you go in, you win fast, you get out. That\'s it. That\'s every heist.',
          'My wife asked where I was going. I said "a heist". She said the baby needs changing. Do the heist for me.',
        ],
      },
      'sv-katana': {
        nudge: 'Kurt can reforge it. With ore from Cinder Springs. Real steel. ...Real.',
        machew: [
          'Kurt says he can make it real, with ore from the Wastes. A real blade. I have dreamed of this. I am terrified of this.',
          'Velvet\'s blade was forged in grief. Mine will be forged in a workshop in a clearing. It is the same.',
        ],
        jerome: [
          'Heist worked. I spent my fifty on a GTA 6 poster. The baby likes it. Or it\'s asleep.',
          'Machew wants a real sword. Kurt\'s making one. I asked Kurt for a car. He said no.',
        ],
      },
      'savanna-shard': {
        nudge: 'The shard\'s over an Alpha out in the Savanna. Glowing. Legendary drop. Like a gold chest.',
        machew: [
          '...The blade is real. It is heavy. The shard waits over an Alpha in the Savanna. Go. I will hold the market.',
          'The next arc begins when the stone is whole. I can feel it. That might be the heat.',
        ],
        jerome: [
          'The shard\'s out in the Savanna, over an Alpha. Legendary drop. Don\'t sell it.',
          'If you DO sell it, I want ten percent. You won\'t. Fine. Five.',
        ],
      },
    },
    awaken: {
      jerome: [
        'Bro. BRO. That was a full cinematic. Pillar of light, shockwave, the works. That\'s a GTA 6 trailer moment.',
        'Watering hole\'s rising, the stalls are lit, the whole market\'s back online. Sunwell Bazaar just got a day-one patch.',
      ],
      machew: [
        '...The shadows fled. Every one. For a moment there was only light, and I was not afraid of it.',
        'The sun-well wakes. The caravans will find their way by its beam. ...And so will you, traveller. The path is open.',
      ],
    },
    after: {
      machew: [
        '...The watering hole is full. The Waystone sings. And my blade is real. I sharpen it every evening. It sharpens now.',
        'The Waystone reaches your Clearing now. A shadow may travel anywhere. This one stays. My shift ends at six.',
        'This was a good arc. The next will be darker. ...A little less dark. The baby next door is asleep.',
      ],
      jerome: [
        'Watering hole\'s full, the caravan\'s back, the Waystone\'s on. Basically a new map dropped.',
        'The Waystone glows pink at sunset. Very Vice City. I posted it. Three upvotes.',
        'Baby\'s asleep. Wife\'s asleep. Just me and the trailer. Peace.',
      ],
    },
    chats: [
      [
        'The watering hole is full again!',
        'Since the Waystone lit.',
        'Phanpy hasn\'t left it all day.',
        'Can you blame Phanpy?',
      ],
      ['The caravan\'s crates came back!', 'Who found them?', 'Jerome says he did a heist.', 'Jerome was on Reddit.'],
      ['Machew\'s sword is real now.', 'He looks scared of it.', 'He sheathes it so carefully.', 'Good. Very good.'],
      [
        'The Waystone glows at sunset.',
        'Pink.',
        'Jerome says it\'s Vice City pink.',
        'Jerome says everything is Vice City pink.',
      ],
    ],
  },
  // the Clearing's own (docs/roadmap.md's Towns step 7, 2026-10-14): the Nietos mend the Clearing's Waystone, the hub the
  // towns' stones link to, so it comes before every town's. Opened when you come home after beating them; handed in at
  // their house (js/run.js's homeRoom()), the stone lighting on the plaza when you step out (js/hub-3d.js).
  clearing: {
    story: 'The Clearing\'s Waystone cracked the night the Sealed Gate shut, and every town\'s stone went dark with it. It hums off-key all night, and Linc can\'t sleep.',
    // as you come home after beating them (js/hub-3d.js's homeNews()): only a pointer to their notice on the quest board,
    // which tells the story (`greet`) and opens the questline (the user's ask, 2026-10-14)
    call: {
      nietos: [
        'LAW: Hey! You beat us! Fair and square. Mostly. Linc bit Kangaskhan.',
        'BRITT: Sweetie, we need your help with something. I pinned a notice on the quest board, by the Waystone.',
        'LAW: Go read it. Then come find us at the house. We\'ll be the ones not sleeping.',
      ],
      // tapped at home before you've read it (js/run.js's homeRoom())
      board: [
        'BRITT: Did you read the notice yet? It\'s on the quest board, out by the Waystone. In my best handwriting.',
        'LAW: She made three drafts. Oh, umm... go read it.',
      ],
    },
    greet: {
      nietos: [
        'BRITT: Found it? Good. Sweetie, have you looked at the Waystone on the plaza? Really looked?',
        'BRITT: It cracked the night the Sealed Gate shut. Straight through. And every town\'s stone out on the roads went dark with it.',
        'LAW: The towns all link through ours. It\'s the hub. Hub\'s down, whole server\'s down. Oh, umm... I mean, it\'s like a... hub.',
        'BRITT: And it hums. All night. Off-key. Linc hasn\'t slept through since. Neither have I. Law has, somehow.',
        'LINC: Ba! *points out of the window, at the stone*',
        'LAW: Something\'s stirred up the Clearing too. Thin it out for us? Win some fights out there, then come tell us at the house. It\'s in your Pokédex too. And on the fridge.',
      ],
    },
    steps: [
      track('cl-quiet', 'nietos', 'Settle the Clearing: win {n} fights in the Whispering Clearing', 'fight', 5,
        ['LAW: The Clearing\'s gone quiet! Like a lobby after everyone queues.',
          'BRITT: Gold star. Now the crack: Glowmoss from the Clearing packs it. I did a whole science unit on it. Twenty-six kids. One said "moss".']),
      gather('cl-moss', 'nietos', 'Bring {n} Glowmoss from the Whispering Clearing to pack the crack', 'glowmoss', 5,
        ['BRITT: Perfect moss. Law, come and look at the moss.',
          'LAW: That\'s... some moss. Great moss. Oh, umm... it still hums wrong, though. Kurt\'s back! The workshop on the east avenue? He makes chimes. Ask him for a Waystone Chime.']),
      craft('cl-chime', 'nietos', 'Bring a Waystone Chime from Kurt\'s Workshop to tune the stone', 'waystone-chime',
        ['BRITT: Listen. *ting* ...It hummed back in tune. Linc fell asleep on the spot.',
          'LAW: Last bit\'s the shard. It\'s out in the Clearing, over some big Alpha. Kangaskhan sniffed it out.']),
      shard('clearing', 'nietos', 'Bring back the Clearing\'s Waystone Shard from the Whispering Clearing', [
        'LAW: THE SHARD! Okay, everyone outside. Britt, get Linc. Kangaskhan, get... Kangaskhan.',
        'BRITT: We\'ll put it in together, out on the plaza. Gently. Like putting a baby down. You\'d think Law would know how.',
        'LINC: Pika! Pika!']),
    ],
    talk: {
      'cl-quiet': {
        nudge: 'LAW: The Clearing\'s all riled up since the crack. Win a few fights out there. Carry me. Oh, umm... I mean, help.',
        nietos: [
          'LAW: Five fights in the Clearing. That\'s like one ranked night. Britt says that\'s not a unit of measurement.',
          'BRITT: The wild Pokémon have been jumpy since the stone cracked. So has Linc. So has Law, but that\'s the energy drinks.',
        ],
      },
      'cl-moss': {
        nudge: 'BRITT: Glowmoss grows in the Clearing. Five clumps should pack the crack. I\'ve done the maths. I teach the maths.',
        nietos: [
          'BRITT: Glowmoss glows a bit after dark. Linc thinks it\'s a night light. We\'re not telling him otherwise.',
          'LAW: Britt made a worksheet for the moss. There\'s a quiz at the end. I failed it.',
        ],
      },
      'cl-chime': {
        nudge: 'LAW: Kurt carves chimes from Whisper Acorns. One should tune the stone. Like a... tuning thing.',
        nietos: [
          'LAW: The stone\'s packed, but it still hums wrong. Like a mic with no noise gate. Kurt\'s chime should fix it.',
          'BRITT: Kurt says a chime of Whisper Acorn sings the right note. Linc says "ba". We\'re going with Kurt.',
        ],
      },
      'clearing-shard': {
        nudge: 'LAW: The shard\'s floating over an Alpha in the Clearing. It glows. You can\'t miss it. I would, but you won\'t.',
        nietos: [
          'BRITT: The shard\'s out in the Clearing, over a big Alpha. Bring it home and we\'ll put it in together.',
          'LAW: Kangaskhan wanted to go and get it itself. We said no. It\'s on babysitting duty. It sulked. Into the laundry.',
        ],
      },
    },
    awaken: {
      nietos: [
        'LINC: Pika! PIKA! *pointing up at the light with both hands*',
        'BRITT: Oh... look at it. It\'s humming in tune. Sweetie, it\'s HUMMING IN TUNE.',
        'LAW: Hub\'s back up! Full server restored! Every town out on the roads can connect through us again. Oh, umm... I mean, the Waystone works.',
        'BRITT: Their stones are still dark out there. But ours can reach them now. Go and wake them up.',
      ],
    },
    after: {
      nietos: [
        'BRITT: The Waystone hums in tune now. Linc sleeps right through. I slept FOUR HOURS. In a row.',
        'LAW: The hub\'s back up! Now the towns. Their stones are still dark, but ours can reach them once they\'re fixed.',
        'LINC: Pika! *points at the plaza, at the stone, glowing*',
      ],
    },
  },
};

/** Whether the Clearing's Waystone is lit (step 7): the Nietos' questline's shard put back, or a save that already started
    (or mended) a town's before the Clearing came first, so nobody loses progress. Until then, no town's leader greets
    you or opens its board, and the Clearing's Waystone travels nowhere. */
export const clearingLit = (save) => mended(townState(save, 'clearing')) || RING.some(t => { const st = townState(save, t.id); return !!st.quest || mended(st); });

/** Kurt's Workshop opens when Law sends you to it, the Nietos' Waystone Chime step (the user's call, 2026-10-15: it stood
    open before the story gave a reason to go in). A lit stone, a town's questline or anything already made there opens it
    too, so no save loses it; `?satchel` opens it for a playtest. */
export const WORKSHOP_STEP = 2;
export const workshopOpen = (save) => townsOpen() && (clearingLit(save) || (townState(save, 'clearing').quest?.step ?? 0) >= WORKSHOP_STEP
  || !!save.workshop?.made?.length || Object.keys(save.workshop?.gifts || {}).length > 0
  || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('satchel')));

/** A town's questline, or null. */
export const questOf = (town) => QUESTS[town.id] || null;

/** A questline's line with `{pick}` filled: the pick made (John's festival), or its `fallback` before one is (or on a
    save mended before the questlines). */
export function questLine(town, st, line) {
  const s = questOf(town)?.steps.find(o => o.pick);
  if (!s || !line.includes('{pick}')) return line;
  return line.replaceAll('{pick}', s.pick.options.find(o => o.id === st.quest?.picks?.[s.id])?.label ?? s.pick.fallback);
}

/** The step of the town's questline that asks for a pick (the Shrine's `sh-spirits`: John's festival), or null. */
export const pickStepOf = (town) => questOf(town)?.steps.find(o => o.pick) || null;
/** The pick made there (`lantern`, `moon` or `fireworks`), or null: buildTown() dresses the town for it once mended. */
export const townPick = (town, st) => { const s = pickStepOf(town); return (s && st.quest?.picks?.[s.id]) || null; };

/* ---------- heart lines (docs/roadmap.md's step 8, session b; the user's picks, 2026-10-14) ----------
   A friend's line for each heart their gifts have filled (js/data/workshop.js's heartsOf()), the Nth said at N hearts:
   more personal as they rise, chats, jokes and stories about the other friends. The Nietos' carry their LAW: / BRITT: /
   LINC: tags, one voice a line. */
export const HEART_LINES = {
  nietos: [
    'LINC: Pika! *holds out a block for you, takes it back, then holds it out again*',
    'LAW: Jahmes tried to teach Linc "LET\'S GO". Linc said "GO" and screamed. So, close. Very Jahmes.',
    'BRITT: I gave Law a hall pass for one game with the boys. He came back four hours later. "It was a long game." Name on the board.',
    'LAW: Real talk, sweetie? I thought I was too busy to be a dad. Now I\'m too busy AND a dad. Best thing I ever queued for.',
    'BRITT: You\'re family now. That means you babysit. Gold star. ...Kidding. Mostly. Have a juice box.',
  ],
  john: [
    'You came back! I picked a handheld for your visit. Then I unpicked it. It\'s the thought that counts.',
    'Jahmes and I tried a Fire Emblem run together. He named every unit LET\'S GO. Classic mode. They were all gone by 10:59.',
    'Ricky asked me to design a chair he can sleep in during meetings. I ran the load calcs. Rated for one standup.',
    'At work I sign off parts that fly. Here I can\'t pick a handheld. It\'s easier to be sure about a wing than about fun.',
    'An S-support. That\'s where we are. I didn\'t even have to think about it, and I think about everything.',
  ],
  jahmes: [
    'YOU\'RE BACK! I\'m SCREAMING! Inside! It\'s after nine, I\'m winding down. This is me wound down.',
    'Shaun sent me VOD notes. FORTY minutes. I watched four. It was 10:56! I\'m not made of time!',
    'Clarence begged me to stay up for his show ONCE. I made it to the boa. Then it was eleven. I left. Mid-spin.',
    'Real talk? Some days with patients are heavy. Then you show up and it\'s LET\'S GO again. Thanks for that.',
    'You\'re my best friend now. OFFICIAL. You can call me after eleven. ...I won\'t answer. But you CAN. That\'s HUGE for me.',
  ],
  clarence: [
    'A returning audience member! The front row\'s yours. Not for the show. For general admiring.',
    'Shaun says my show adds forty milliseconds of lag to the boys. I say it adds four hundred percent morale. Science.',
    'Jahmes walked out of my show at eleven sharp, mid-spin. I finished the spin to an empty chair. A professional finishes the spin.',
    'Between us: some nights I\'m nervous before nine. The ring light\'s hot, the boa sheds. Then the boys type "GO CJ" and I\'m fine.',
    'You\'ve earned my highest honour: the name of my new routine. "The Second Act". Tell no one. Tell the boys.',
  ],
  shaun: [
    'You\'re back. Your last visit had good comms. I gave it a seven. That\'s high. Clarence is a four.',
    'Kayl\'s ticket this week: "the printer\'s making a noise". The noise was Reya. Reya was inside the printer.',
    'Ricky plays at 3 a.m. His aim\'s fine. His callouts are "uh" and "there". I coach him anyway. Nobody else will.',
    'I flame the boys because I want them out of Silver. If I didn\'t care, I\'d just smurf. ...Don\'t tell them I said that.',
    'Ticket closed: best friend. Resolution: you. No further action needed. Best ticket I\'ve ever written.',
  ],
  pat: [
    '♪ Like a tall glass of lemonade... ♪ Oh, you\'re back. I wasn\'t singing. I was humming. Loudly. On purpose.',
    'Law asked me to stop singing in voice chat. Then he asked me to sing "She Was Mine" for his friend. He said "friend" twice.',
    'Kayl played bass under my song last night. Spooky fell asleep on her pedal. It turned into a lullaby. Best take yet.',
    'Every song I sing is about someone. Maybe one day I\'ll tell them. Today I\'ll just sing it at the water. ♪ She was mine... ♪',
    'I wrote you a line. ♪ A friend who keeps coming back... ♪ That\'s it. Oh, you liked it? I didn\'t know anyone was listening.',
  ],
  kayl: [
    'Oh! It\'s you! I was about to... no, it\'s gone. Hi! Spooky, look who\'s here. She\'s asleep. She says hi.',
    'Pat stayed over to jam and Reya screamed through the whole chorus. Pat said she had perfect pitch. She was hungry.',
    'Shaun fixed my router again. Spooky\'s tail, again. He wrote "cat" on the ticket and drew a tiny lavender sprig. He says he didn\'t.',
    'Some days my brain has forty tabs open and none is the one I need. You coming by is a nice tab. The one with music on.',
    'I made you a lavender sachet. A week ago. Then I lost it. It was in the freezer? Anyway. Best friends! It smells fine.',
  ],
  phil: [
    'Oh, it\'s you. Good. I thought it was a knock from the other side. It\'s never a good knock from the other side.',
    'Ricky\'s video of me has a million views. Every comment says "fake". JONA reads them at night. She\'s offended.',
    'Jerome asked if JONA could get him a GTA 6 leak. She said yes, for his soul. He thought about it way too long.',
    'Most people stop visiting once the candles move by themselves. You didn\'t. That means more than you know.',
    'Last night JONA said "THAT ONE MAY STAY". About you. She\'s never said that about anyone. Not even me.',
  ],
  ricky: [
    'Hey. You came at a sane hour. Respect. I haven\'t seen one of those since college.',
    'Jahmes logs off at 10:59 his time. That\'s 1:59 mine. I call him "the early bird" now. He\'s furious.',
    'John made a spreadsheet of my sleep: "hours lost to one more game". He sent it as a pie chart. It\'s all one colour.',
    'My manager asked why I always look tired. I said time zones. Truth is, I\'d rather be tired with the boys than rested without them.',
    'You\'re the only friend who visits in daylight. I set an alarm for it. Best thing my alarm\'s ever done.',
  ],
  machew: [
    '...You return. The shadow remembers those who return. I wrote your name in my notebook. The cool notebook.',
    'Jerome called Tales of Berseria "basically GTA with swords". I have not spoken to him in three days. He hasn\'t noticed.',
    'Kurt saw me practise in the square. He said my form was "very enthusiastic". I have chosen to take that as a blessing.',
    '...I took the ninja path at twelve because I had no party. Now I have one. The arc changes.',
    'Velvet had Laphicet. Every hero needs one companion to the last arc. ...This time, kid, it\'s personnel.',
  ],
  jerome: [
    'Oh, hey. Somebody zoomed in on a mailbox in the trailer. It\'s a mailbox. Huge. Anyway, hi.',
    'Machew asked if GTA 6 has swords. I said "probably" so he\'d stop asking. He has not stopped asking.',
    'The baby smiled at me yesterday. My wife said "first smile!" I almost had my phone out. ...Almost. I put it down. Write that down.',
    'Real talk: I\'m scared I\'ll be bad at the dad thing. GTA\'s easy, you know the map. This doesn\'t come with a map.',
    'When GTA 6 drops, you\'re on my heist crew. First pick. Before the boys. Before Machew. That\'s a lot, coming from me.',
  ],
};

/* A friend's hello the first time you're in their home after beating them at their Gym (2026-10-16; js/run.js's
   homeRoom(), once a save, skipped once they've had a gift): a hint at their favourite gift (js/data/workshop.js's
   FAVOURITE) without naming it, pointing you to Kurt, whose `giftTalk` explains the hearts. */
export const GIFT_MEET = {
  nietos: [
    'BRITT: Sweetie! You beat us fair and square, so you\'re family now. Shoes off. Juice box?',
    'LAW: Real talk? If anything could hum Linc to sleep, we\'d be friends for life. Kurt next door makes things. Just saying.',
  ],
  john: [
    'Oh, hi! Come in. I was choosing which handheld to show you. I\'m still choosing.',
    'If Kurt could make something to help me finally pick... I\'d owe you. Probably. I can\'t decide.',
  ],
  jahmes: [
    'LET\'S GO! You found my place! Make yourself at home! Till eleven!',
    'Real talk, I wish I could stay up with the boys. If Kurt could cook up something that keeps me awake... SPICY? LET\'S GO!',
  ],
  clarence: [
    'Welcome, darling, to my dressing room! Mind the boa. It sheds.',
    'A performer can never check the pose enough. Kurt makes lovely things. A little sparkle would not go unnoticed.',
  ],
  shaun: [
    'You beat me. Fine. You had good comms. Sit anywhere that isn\'t my chair.',
    'My setup\'s too quiet. I can\'t hear myself flame. Kurt takes commissions. Make it LOUD.',
  ],
  pat: [
    '♪ Oh, a visitor at my door... ♪ Sorry. Come in! I sing when the door opens.',
    'Singing all day dries you out. Something cold and sweet, like the song... Kurt could make it. ♪ Like a tall glass of... ♪',
  ],
  kayl: [
    'Hi! You came! Mind Spooky. And Reya. And there\'s a third one somewhere. Hi!',
    'The cats keep stealing my chair. If Kurt built them something of their own to climb... oh, I\'d cry. Then forget why.',
  ],
  phil: [
    'You beat me, so JONA lets you in. Don\'t touch the candles. They move on their own.',
    'I eat in the dark so she can\'t watch. Something warm that glows a bit would help. Kurt cooks, apparently. JONA says no.',
  ],
  ricky: [
    'Hey. Come in. It\'s, uh, morning? For you. Night for me. Always night for me.',
    'Third hour of a stream at 3 a.m., I\'d kill for a hot drink with a kick. Kurt makes stuff. Just putting that out there.',
  ],
  machew: [
    '...You have defeated me. So you may enter the shadow\'s den. Shoes off.',
    'A ninja meditates on his failures. I have many. Kurt the smith could make something to burn while I do. ...Something smoky.',
  ],
  jerome: [
    'Oh, hey. Come in. Don\'t mind the trailer, it\'s on loop. Somebody found a new mailbox.',
    'Those bandits outside town? I\'m planning a heist. Need every way in AND out, on paper. Kurt\'s good with paper. Just saying.',
  ],
};

/* A friend dropping by your Secret Base (step 8, session c; js/secret-base.js's leaderVisitor()): `drop` from 3 hearts,
   standing about till you tap them; `sit` at 5, on a seat of yours, at home. One speech of each said a visit, picked at
   random; a LAW: / BRITT: / LINC: tag names who says the line. */
export const BASE_LINES = {
  nietos: {
    drop: [['BRITT: Surprise! We were on a walk and Linc pointed at your door. So now we\'re here.', 'LAW: Cute place, sweetie. Childproof? ...It is now. I moved a lamp.', 'LINC: Bah! *waves at your partner*', 'BRITT: Okay, nap o\'clock. Bye bye!']],
    sit: [
      ['LAW: Don\'t mind us. We needed a sit-down that isn\'t on a toy.', 'BRITT: Linc fell asleep in the stroller. Twenty minutes of silence. Your couch, our spa.', 'LINC: *snores, tiny*', 'LAW: ...Okay, he\'s awake. We were never here. Love you, bye!'],
      ['BRITT: We brought juice boxes. One\'s yours. One is technically Linc\'s, so ask him.', 'LINC: No.', 'LAW: Ha! First full word this week! In YOUR house! Gold star for the house.'],
    ],
  },
  john: {
    drop: [['Hey! I was passing and thought I\'d see the base in person. Your floor plan, I mean. I like a floor plan.', 'Load-bearing walls look good. Furniture looks... fun. I can\'t rate fun. Yet.', 'Okay, I\'ll stop inspecting. See you soon!']],
    sit: [
      ['Mind if I sit? Long week. Three parts signed, two handhelds returned.', 'This seat\'s comfortable. I checked the joints before I sat down. Habit.', 'Right. Back to the hangar. Thanks for the sit.'],
      ['I brought a handheld for us both. Then I thought: what if you don\'t want that one. So I brought none.', 'We can just sit. Sitting is a game. It\'s co-op.', 'That was a good run. See you!'],
    ],
  },
  jahmes: {
    drop: [['KNOCK KNOCK! It\'s me! You weren\'t expecting me! LET\'S GO!', 'Your base is so CLEAN. Is it always this clean? Mine\'s a disaster. I have a VERY clean disaster.', 'Okay, I gotta go, it\'s almost ten. Love the place!']],
    sit: [
      ['I\'m just gonna... sit. On your seat. Is that okay? It\'s okay. It\'s ON.', 'This is the calmest I\'ve been all day. A patient called me "the loud nurse" today. Fair.', 'Okay, 10:40. Leaving at 10:50. Bed at 10:59. LET\'S GO.'],
      ['Best friends get the comfy seat. That\'s the rule. I made it up just now. It\'s a GREAT rule.', 'Did you know you can fit me and like four plushies on here? I tested it. Mentally.', 'Alright! Night night! It\'s 9:30 but I\'m starting early!'],
    ],
  },
  clarence: {
    drop: [['Ta-da! An entrance! Your doormat could use a spotlight, but I\'ll allow it.', 'Oh, this space has good acoustics. Imagine a show in here. A small one. An intimate show.', 'Exit, stage left! Your stage left. Bye!']],
    sit: [
      ['Don\'t mind me. Rehearsing my sitting. A big part of my show is sitting fabulously.', 'Rate my posture. ...A ten? I agree. Thank you. You have taste.', 'Encore later! For now, I\'m off.'],
      ['Saved myself the best seat in the house. Your house. Thank you for having a best seat.', 'Shaun says sitting still for ten minutes is "unprecedented" for me. Watch me do eight.', 'That was seven. Close enough! Bye!'],
    ],
  },
  shaun: {
    drop: [['Yo. Came by to check your setup. Router\'s fine. Comms are fine. Base is... fine. That\'s a compliment.', 'You keep things tidy. Kayl should take notes. Kayl won\'t take notes.', 'Ticket closed. Later.']],
    sit: [
      ['I\'m sitting. Don\'t make it weird. I\'m allowed to sit.', 'Your seat\'s got better ergonomics than my gaming chair. That\'s a problem for me, not you.', 'Okay. Back to work. Clarence opened a ticket called "help me pick a boa". Pray for me.'],
      ['I\'m not here to coach you. I\'m here to sit. That\'s a first. Write it down.', '...Your partner just sat with me. Good positioning. It gets a nine.', 'Later. Keep the place like this.'],
    ],
  },
  pat: {
    drop: [['♪ Knock knock, it\'s just me... ♪ Oh. Hi. I didn\'t think you\'d actually be home.', 'Nice place. Good light. I could write in here. I won\'t. But I could.', 'See you by the water. ♪']],
    sit: [
      ['Mind if I sit and hum a bit? Your place has a nice echo. Very lemonade.', '♪ Sitting in a friend\'s chair, nothing much to say... ♪ That\'s a new one. Don\'t tell anyone.', 'Okay, okay. I\'ll head off. Thanks for the seat.'],
      ['I came to tell you something. Then I sat down and forgot what. It was probably a song.', '♪ She was mine... ♪ ...No, it\'s gone. Another day.', 'Bye for now. I\'ll come back when I remember.'],
    ],
  },
  kayl: {
    drop: [['Hi! I came to see your base. Or to return something. I don\'t have anything. So I came to see your base!', 'It\'s so cosy. Spooky would love it. Reya would knock everything over. Love you, Reya.', 'Okay, I\'m going before I forget where I parked. Bye!']],
    sit: [
      ['Is this seat taken? No? Yay. Okay, I\'m staying for like... a bit. Unclear.', 'I left my bass at Pat\'s. Again. Pat says that\'s how she knows I\'m coming back.', 'Oh! I have to go feed the cats. I think. One of them. Bye!'],
      ['This seat is perfect for a cat. I\'m not a cat. But I could nap here like one.', '...Did I nap? I think I napped. Sorry! It\'s a compliment. Your seat is nap-tier.', 'Okay, bye! I took nothing! Probably!'],
    ],
  },
  phil: {
    drop: [['Hello. Don\'t worry, JONA stayed home. She says your house is "quiet". She means it nicely.', 'No knocks from the other side here. Nothing behind the walls. It\'s lovely.', 'I\'ll go before she wonders where I am. See you.']],
    sit: [
      ['Mind if I sit? It\'s nice to sit somewhere the chair doesn\'t move by itself.', 'JONA asked me to tell you she likes your seat. She\'s never sat in it. She knows anyway.', 'Thank you. I\'ll go before the candles at home light themselves again.'],
      ['I sleep better after I visit you. Nobody here whispers. I checked, under everything.', 'JONA wants a seat like this. I said she\'s a ghost. She said "AND?"', 'Bye for now. I mean it, it\'s lovely here.'],
    ],
  },
  ricky: {
    drop: [['Hey. It\'s daytime and I\'m outside. Mark it down. I came to see your base.', 'Nice. Lots of light. Weird. Good weird.', 'Okay. Heading home for a "nap". It\'s my third. Later.']],
    sit: [
      ['I\'m gonna sit here. Might close my eyes for a minute. I\'m listening. I\'m always listening.', '...Was I out? I was out. This seat\'s dangerous. Ten out of ten.', 'Okay. I\'ll be on at 3 a.m. Won\'t see you then. That\'s the point. Later.'],
      ['Best seat I\'ve sat in all week. Beats my office chair. Beats my bed, honestly.', 'John would want to run load calcs on it. I just want to live here.', 'Fine. I\'ll go. Under protest. Later.'],
    ],
  },
  machew: {
    drop: [['...The shadow visits. You did not hear me enter. ...You heard me enter. The doormat squeaks.', 'Your hideout is... acceptable. A ninja could rest here. Briefly.', 'I vanish. ...Through the door. Normally.']],
    sit: [
      ['I take a seat. A ninja must rest, so that the next arc may begin.', 'This chair is worthy. I will write it in the cool notebook.', '...Our party rests well here. I vanish. Through the door. As before.'],
      ['Velvet would sit here. Before the final arc. Brooding. I am brooding. It is going well.', 'You may sit with me. Party members may brood together. That is allowed.', 'The arc continues. Farewell, companion.'],
    ],
  },
  jerome: {
    drop: [['Hey. Saw your door and thought, that door\'s in the trailer. It isn\'t. Anyway, hi.', 'Cool base. It\'s got that GTA safehouse energy. That\'s a big compliment from me.', 'Gotta go, baby\'s up. See ya.']],
    sit: [
      ['I\'m sitting. The baby\'s asleep and my wife said "go see a friend". So. You.', 'This is the first time I\'ve sat down since the trailer. And the trailer was ages ago.', 'Okay, she texted. Gotta go. Thanks for the safehouse.'],
      ['I didn\'t even watch the trailer today. I just sat with you. Write THAT down.', '...Okay, I watched it once. In the car. Twice. But I put the phone down here.', 'See ya. Heist crew, first pick. Still you.'],
    ],
  },
};

/** What a Gym Leader says in their home: a word on the questline where it stands (the step up now's `talk`, or `after`
    once the stone is lit), then the heart lines their `hearts` have filled that they haven't said yet (past `heard`;
    `fresh` holds each one's heart from `freshAt`), all said first (`topical` lines of them), then their usual lines with
    the heart lines heard among them. */
export function homeTalk(town, id, st, hearts = 0, heard = 0) {
  const q = questOf(town), step = questStep(town, st);
  const now = !q ? [] : step ? q.talk?.[step.id]?.[id] ?? [] : mended(st) ? q.after?.[id] ?? [] : [];
  const mine = (HEART_LINES[id] || []).slice(0, hearts), told = Math.min(heard, mine.length);
  const fresh = mine.slice(told);
  return {
    lines: [...now, ...fresh, ...(town.leaders[id] || []), ...mine.slice(0, told)].map(l => questLine(town, st, l)),
    topical: now.length + fresh.length, freshAt: now.length, fresh: fresh.map((_, i) => told + i + 1),
  };
}

/** The step's leader's word on the board while it isn't done, their name first unless the line has one (Phil's JONA). */
export function stepNudge(town, step, name) {
  const line = questOf(town)?.talk?.[step.id]?.nudge;
  return !line ? '' : /^[A-Z]+: /.test(line) ? line : `${name}: ${line}`;
}

/** The town's folk talk: once its stone is lit, about that first (`chats`), then their usual chats. */
export const folkChats = (town, st) => (mended(st) && questOf(town)?.chats
  ? [...questOf(town).chats.map(c => c.map(l => questLine(town, st, l))), ...town.chats] : town.chats);

/* ---------- leaders coming home (session 4, 2026-10-14) ----------
   Once a town's shard is back in, its Waystone reaches the Clearing's, and its Gym Leaders come through: one a UTC day
   stands by the Clearing's Waystone (waystoneGuest(); the one who put the shard in, the first time home after), and they
   drop by the Secret Base (js/secret-base.js's leaderVisitor()); all of it off with LEADER_VISITS_LIVE since 2026-10-28. Each has a
   few speeches (session 5): the Clearing deals one a day, the base one a visit. */
export const HOME_LINES = {
  john: [
    [
      'Stepped out of the Waystone and my ears popped. Cabin pressure. I\'d know.',
      'Nice Clearing. It needs a festival. I\'d need a week to pick which.',
    ],
    [
      'One road in, a plaza in the middle: your Clearing\'s a great Fire Emblem map. I\'d put the healer by the stone.',
      'I brought all three handhelds. I\'ve played none of them. Great day.',
    ],
    [
      'Somebody at work asked what I did this weekend. I said "travelled by magic rock". They asked for a report.',
      'I wrote one. Eleven pages. Peer-reviewed by Jahmes. He wrote LET\'S GO on every page.',
    ],
    [
      'Jahmes wanted to come. It\'s nine, so he\'s doing his skincare and then bed.',
      'Tell him I said hi. He\'ll say it back in capitals.',
    ],
  ],
  jahmes: [
    ['YOOO, the Clearing! The Waystone just YEETED me here!', 'Gotta be back by eleven, though. Curfew\'s curfew.'],
    [
      'A patient told me "it\'s probably nothing" this morning. It WAS nothing! I was SO hyped!',
      'Anyway, I\'m on a break. Breaks are for screaming. Quietly. Somewhere scenic.',
    ],
    [
      'Ricky\'s up till THREE every night?! THREE?! I\'d DIE. I\'d be SO dead.',
      'He said I should try it. I said I\'d try it at 10:59. He laughed. Why did he laugh.',
    ],
    [
      'ARAM tonight, then bed. An ARAM\'s twenty minutes. Bed\'s at eleven. I\'ve done the maths: time for ONE.',
      'If I\'m not home by 10:45, send a search party. Or let me sleep here. Is that a bench?',
    ],
  ],
  clarence: [
    [
      'A round plaza with a glowing centrepiece. It\'s practically a stage.',
      'Tell everyone I\'m here. Discreetly. Loudly.',
    ],
    [
      'Shaun says the Clearing can\'t hold a stream. "The trees", he says. The trees should learn.',
      'At nine I\'m back in the Springs. Nobody stops the show. Not even geography.',
    ],
    [
      'Shaun and I came through the Waystone together once. He timed it. I posed in it.',
      'The photos are for the boys. Only the boys. You understand.',
    ],
    [
      'Pat sang at me through the Waystone yesterday. All the way from Driftwood Landing. Beautiful.',
      'I\'ve hired him as my opening act. He doesn\'t know yet.',
    ],
  ],
  shaun: [
    [
      'Waystone latency: zero. Better than your internet.',
      'I ran diagnostics on yours. It\'s fine. I\'d still file a ticket.',
    ],
    [
      'I ran a speed test by your Waystone. Forty down. I get four hundred at home. Just saying.',
      'Not that it matters. Skill issue either way.',
    ],
    [
      'The boys went five and oh last week. Clarence says it was the show. I made the calls. It was the calls.',
      'Write that down. Date it.',
    ],
    [
      'Kayl filed a ticket: her router was down. It was unplugged. Spooky was asleep on the cable.',
      'Ticket closed: cat. Hardest one this month.',
    ],
  ],
  pat: [
    ['♪ Through the stone and straight to you... ♪ Oh. Hi.', 'Got any lemonade here? No? I\'ll wait.'],
    [
      '♪ She was mine... ♪ Oh, you heard that? I didn\'t know anyone was out here. In your yard.',
      'The acoustics by your Waystone are almost as good as the lagoon\'s. Almost.',
    ],
    [
      'I wrote a song about the Waystone. It\'s also about someone. Mostly about someone.',
      'I\'ll sing it at sunset. If there\'s lemonade.',
    ],
    [
      'Kayl charges me rent in songs, and now Clarence wants me as his opening act. I\'m in demand.',
      '♪ Like a tall glass of lemonade... ♪ That\'s my rate card.',
    ],
  ],
  kayl: [
    [
      'Free travel and no rent! Do you know how rare that is for me?',
      'Reya stayed home. She\'s in charge of the leases now. Heaven help us.',
    ],
    [
      'I came to look at your Secret Base. Professionally. Oh, I forgot my clipboard. And my keys.',
      'Wait, why did I come? ...Oh! Visiting! Hi!',
    ],
    [
      'Spooky followed me to the Waystone and lay down on it. It\'s warm. She\'s still there. She\'s fine.',
      'Reya screamed at it and it hummed back. They\'re friends now.',
    ],
    [
      'I put "Let It Happen" on and walked through the Waystone. Perfect timing. I\'m doing it again later.',
      'The whole Clearing should smell of lavender. I\'ll leave you a sachet. Three.',
    ],
  ],
  phil: [
    ['Your Clearing isn\'t haunted. I checked. Twice.', 'Jona says it\'s boring. Jona says that about everywhere.'],
    [
      'I came through the Waystone while she was asleep. She doesn\'t sleep. She was pretending.',
      'She says your Clearing has "potential". Please don\'t ask for what.',
    ],
    [
      'I salted the path from your Waystone to here. Just a little. Just in case.',
      'It\'s not for grip. You know it\'s not for grip.',
    ],
    [
      'Ricky filmed me stepping out of the Waystone. My eyes glowed in the footage. It\'s the lighting.',
      'He says it\'s fake. I hope he\'s right.',
    ],
  ],
  ricky: [
    [
      '*yawns* Came through the Waystone. Filmed it. The boys still think it\'s fake.',
      'If I nap on that bench, wake me in twenty. Or forty.',
    ],
    [
      'It\'s 2 p.m. here. That\'s 2 a.m. somewhere, which is where the boys are. And where I am, spiritually.',
      'Meeting at nine tomorrow. I\'ll be up till three. The maths never changes.',
    ],
    ['Jahmes went to bed at eleven on the dot last night. Mid-round. We were in a match.', 'We lost. He slept great.'],
    [
      'Phil came through the Waystone with me. His eyes went purple on camera. He says it\'s the lighting.',
      'It\'s not the lighting.',
    ],
  ],
  machew: [
    [
      '...The Waystone carried me here in silence. As a shadow should travel.',
      'My blade stays sheathed. It is real now. I am still nervous.',
    ],
    [
      '...Your Clearing has too much light. I will stand under that tree. Do not look for me. I am behind the tree.',
      'My shift starts at four. I came early to brood.',
    ],
    [
      'Kurt forged my blade. I come to thank him sometimes. Silently.',
      'He gives me tea. I drink it in the shadows. It is good tea.',
    ],
    [
      'Jerome asked if the Waystone is "basically fast travel". I told him it is the path of the shadow.',
      'He said "so, fast travel". ...Yes.',
    ],
  ],
  jerome: [
    [
      'The Waystone\'s basically fast travel. GTA 6 has fast travel. Probably.',
      'Baby\'s asleep. I\'ve got like forty minutes. Let\'s hang.',
    ],
    [
      'Somebody on r/GTA6 counted the trees in your Clearing. It\'s not in the trailer. They counted anyway.',
      'Forty-one, they said. Wrong. I counted forty-two.',
    ],
    [
      'My wife said "take the baby for a walk". So I took the baby through the Waystone.',
      'Kidding. Baby\'s with her. I\'m on a "walk".',
    ],
    [
      'Machew holds his real sword like it\'s a live grenade. Very GTA.',
      'If you want to do another heist, I\'m around. Weekdays. Before the baby wakes up.',
    ],
  ],
};

/** The leaders whose town's Waystone is mended: [{ id, town }], in RING order. */
export const homeLeaders = (save) => (townsOpen() ? RING.filter(t => mended(townState(save, t.id))).flatMap(t => Object.keys(TOWNS[t.id].leaders).map(id => ({ id, town: t.id }))) : []);

/** Who stands by the Clearing's Waystone today, or null: the first time home after a town's shard went in, the leader
    who put it in (`welcome`: their town says thanks); else one of the home leaders, dealt by `rand` (the UTC day's). */
export function waystoneGuest(save, rand) {
  const fresh = RING.find(t => townState(save, t.id).quest?.lit && !townState(save, t.id).quest.welcomed);
  if (fresh) return { id: QUESTS[fresh.id].steps.at(-1).by, town: fresh.id, welcome: true, speech: 0 };
  const pool = homeLeaders(save);
  if (!pool.length) return null;
  const g = pool[Math.floor(rand() * pool.length)];
  return { ...g, speech: Math.floor(rand() * (HOME_LINES[g.id]?.length || 1)) };
}

/** What a home leader says: one of their HOME_LINES speeches, with a thank-you first when they've come to welcome you. */
export const guestLines = (g) => [...(g.welcome ? [`The Waystone lit all the way to here! I came straight through. ${TOWNS[g.town].name} says thank you.`] : []), ...(HOME_LINES[g.id]?.[g.speech ?? 0] || [])];

/** The leader who greets you and opens the questline: the first of the town's leaders you've beaten, or null. */
export const greeterOf = (town, save) => Object.keys(town.leaders).find(id => (save.gym?.[id] || 0) > 0) ?? null;

/** The questline opened (their greeting heard). */
export const openQuest = (st) => (st.quest ? st : { ...st, quest: { step: 0, got: 0, picks: {} } });

/** The step up now, or null (not open, or every step done). */
export const questStep = (town, st) => (st.quest ? questOf(town)?.steps[st.quest.step] ?? null : null);

/** Every step handed in, the shard too. */
export const questDone = (town, st) => !!st.quest && st.quest.step >= (questOf(town)?.steps.length ?? 0);

/** Steps handed in and steps in all, for the Clearing's Waystone and the Satchel. */
export const questProgress = (town, st) => [Math.min(st.quest?.step ?? 0, questOf(town)?.steps.length ?? 0), questOf(town)?.steps.length ?? 0];

export const stepText = (step) => step.text.replace('{n}', step.n);

/** How much of a step you have: a track step's count, a gather step's material, a craft or shard step's key item. */
export function stepHave(step, st, sat) {
  if (step.kind === 'track') return Math.min(step.n, st.quest?.got || 0);
  if (step.kind === 'gather') return Math.min(step.n, sat.mats[step.item] || 0);
  return sat.keys.includes(step.key) ? 1 : 0;
}

export const stepReady = (step, st, sat) => stepHave(step, st, sat) >= step.n;

/** Count play into a town: its questline's track step while the questline runs, its coin requests once it's done,
    nothing while the town is quiet. Returns the new state and whether something just finished. */
export function countTown(town, st, event, amount, ctx = {}) {
  if (!st.quest) return { st, finished: false };
  if (questDone(town, st)) return town.requests ? countRequest(town, st, event, amount, ctx) : { st, finished: false };   // the Clearing has no board
  const step = questStep(town, st);
  if (step.kind !== 'track' || step.on !== event || ctx.biome !== town.biome || !(amount > 0) || st.quest.got >= step.n) return { st, finished: false };
  const got = Math.min(step.n, st.quest.got + amount);
  return { st: { ...st, quest: { ...st.quest, got } }, finished: got >= step.n };
}

/** Hand the step up now in: the next one up, the shard lighting the stone, a pick remembered. The Satchel's side (the
    materials taken, a key item given) is js/towns.js's. */
export function handInStep(town, st, pick = null) {
  const step = questStep(town, st);
  if (!step) return st;
  const picks = pick && step.pick ? { ...st.quest.picks, [step.id]: pick } : st.quest.picks;
  return { ...st, quest: { ...st.quest, step: st.quest.step + 1, got: 0, picks, ...(step.kind === 'shard' ? { lit: true } : {}) } };
}

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

/** The Waystone Shards placed, in RING order (true: that town's stone is mended), as the Clearing's Waystone lights them:
    the shard pentagram (js/pentagram.js) and Mewtwo's Sealed Weakness in the Depths (sealedMult() in difficulty.js).
    `?shards=N` lights the first N for a page load. */
export function shardsLit(save) {
  const flag = typeof location !== 'undefined' && new URLSearchParams(location.search).get('shards');
  if (flag) return RING.map((t, i) => i < Number(flag));
  return RING.map(t => townsOpen() && mended(townState(save, t.id)));
}
export const shardsPlaced = (save) => shardsLit(save).filter(Boolean).length;
/** Whether the shards count yet: the Sealed Weakness, the pentagram and the Depths camp come with the towns (TOWNS_LIVE,
    or `?towns` / `?shards=N` for a page load), since only the towns' questlines drop shards. Until then Mewtwo goes down
    at full strength, as before. */
export const sealOn = () => townsOpen() || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('shards'));
/** The shards Mewtwo's Sealed Weakness counts (runMods() in difficulty.js): all five while it's off. */
export const weaknessShards = (save) => (sealOn() ? shardsPlaced(save) : RING.length);

/** Each town's shop sells one shelf of the Secret Base's furniture (its `group`s), only there (the mall's store never
    deals them), `SHOP_STOCK` of it a UTC day, a piece you own never dealt again. */
export const SHOP_SHELVES = { shrine: ['Japanese'], wastes: ['Hot Spring'], ruins: ['Underwater'], thornwood: ['Greenhouse', 'Garden'], savanna: ['Desert'] };
export const SHOP_STOCK = 6;
export const TOWN_SHELVES = new Set(Object.values(SHOP_SHELVES).flat());

/** The town a furniture shelf is sold in, or null. */
export const shelfTown = (group) => Object.keys(SHOP_SHELVES).find(id => SHOP_SHELVES[id].includes(group)) ?? null;

/** Whether the Nietos are at home in their house in the Clearing (the house itself always stands): only once you've beaten
    Law, Britt or THE NIETOS at the Clearing's Gym, `wins` all three's Gym wins (js/data/gym.js's friendWins()). Since step 7 (2026-10-14) that's how they
    turn up: beaten, they greet you at home and their questline mends the Clearing's Waystone, so they're home with the
    towns (townsOpen()). `?nietos` brings them home for a page load (`&gymwins=1` to have beaten them). */
export const NIETOS_LIVE = true;
export const nietosHome = (wins) => ((NIETOS_LIVE && townsOpen()) || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('nietos'))) && wins > 0;

/** The Clearing's own houses (the user's ask, 2026-10-14): walked in from the hub like a town's homes (homeRoom() in
    js/run.js), a pseudo-town with no map, crowd or requests. The Nietos live here, the Clearing's third Gym Leaders. */
export const CLEARING = {
  id: 'clearing', biome: 'clearing', name: 'Whispering Clearing', music: 'title', home: true,
  buildings: [
    { id: 'nietos', name: 'THE NIETOS', home: 'nietos' },
    { id: 'workshop', name: 'KURT\'S WORKSHOP', home: 'workshop' },
    { id: 'dojo', name: 'KENMATTA\'S DOJO', home: 'dojo' },
  ],
  homes: {
    // Kurt's Workshop (docs/roadmap.md's Towns step 6, session 3): Kurt at his workbench (a tap opens js/workshop.js's
    // window), a cauldron, Apricorn trees, and a Slowpoke from Azalea Town asleep by the door
    workshop: { name: 'Kurt\'s Workshop', kurt: true, sub: 'Sawdust, Apricorns drying on every shelf, a cauldron bubbling, and Kurt at his workbench.',
      // the first time you walk in (js/run.js's homeRoom()): Kurt slides in and says who he is (the user's call, 2026-10-15)
      meet: [
        'Hm? A customer! Come in, come in. Mind Slowpoke, he\'s been asleep there since Tuesday.',
        'I\'m Kurt. Fifty years I made Poké Balls out of Apricorns in Azalea Town. Then the Waystones went dark, and I came where I\'m needed.',
        'That\'s how it works here. You bring what you find out on the roads, I make things from it. What the towns need, furniture, gifts for your friends...',
        '...and Apricorn balls. Carry one and your partner comes out of it in every battle, every ball you throw too. Looks only, mind. A ball\'s a ball. Have a look at the bench.',
      ],
      // his word in the Clearing, once a save (js/hub-3d.js's ballNews(), 2026-10-27, the user's ask): a carried Apricorn
      // ball is the one your partner comes out of in every battle now, not just the Safari Ball's look
      ballTalk: {
        open: 'Kurt here! Hold on a moment, I\'ve news about your Apricorn balls.',
        every: 'Carry one from my bench and your partner comes out of it at the start of every battle. Every run, every Gym, not just your Safari Balls.',
        carried: 'Your {ball}\'s on your belt already. You\'ll see it fly next battle.',
        made: 'You\'ve one made already. Tap it on my bench\'s Apricorns shelf, then Carry it.',
        none: 'Bring me three of one town\'s materials and I\'ll carve you one, or buy the one I send the Safari Outfitter each day.',
        close: 'Swap balls any time on your Trainer Card. Looks only, mind. A ball\'s a ball.',
      },
      // the first held berry he makes you (js/workshop.js, 2026-10-16, the user's ask): how they work, once a save
      heldTalk: [
        'Ah, your first held berry! Simpler than an Apricorn, this. Let me tell you how it goes.',
        'Your Pokémon holds it, and when the moment\'s right it eats it all by itself. Once. Then it\'s gone.',
        'Before a run, pack up to three in your Berry Pouch on the Prepare screen. It holds the first as you set out.',
        'The others wait in the pouch. Swap from your Bag\'s Items pocket on the map. Never mid-battle, mind: no time for that.',
        'And once one\'s eaten, the next can go on in the next biome. One a biome. Grow plenty, and come back for more!',
      ],
      // the first run kit item he makes you (2026-10-16, the user's ask): the one-a-run rule, once a save
      kitTalk: [
        'There, your first bit of run kit! Supplies for the road, made from your berries and the towns\' finds.',
        'Make as many as you like, whenever you like. I keep every one for you.',
        'But you take only one into each run. Pick it on the Prepare screen, beside your Berry Pouch, and it starts in your Bag.',
        'Use it when you need it. Whatever\'s left in your Bag stays behind when the run ends, win or lose, so don\'t hoard it!',
      ],
      // the first gift he makes you (2026-10-16): what gifts and hearts do, once a save
      giftTalk: [
        'Your first gift! A word on how these go, since the young ones never ask.',
        'Hand it to a friend at their home and it fills a heart. Their favourite fills two. Five hearts is as close as friends get.',
        'At three hearts and at five, they\'ll give you more of their signature pieces for your Secret Base.',
        'You can see where you stand with each of them in the Friends app on your Pokédex. Off you go!',
      ],
      // after the second line, while the Nietos' Waystone Chime is the step you're on
      meetChime: 'The Nietos sent you for a Waystone Chime, eh? Whisper Acorns from the Clearing, carved thin. Bring me four and a pinch of Glowmoss.',
      cast: {
        slowpoke: ['Slowpoke is asleep against the cauldron. Kurt says it came with him from Azalea Town.', 'Slowpoke yawns. Several seconds later, it notices you.', 'Slowpoke\'s tail is in a bucket of water. Nobody knows why. Slowpoke doesn\'t either.'],
      } },
    // Kenmatta's dojo (js/data/dojo.js; the user's ask, 2026-10-15: open, big inside, a ring in the middle to walk into):
    // the hall with the ring js/event-3d.js builds (buildDojoHall()), the trial board left of his medallion, the sandbag
    // right, Ken meditating in the ring and his three students training round it
    dojo: { name: 'Kenmatta\'s Dojo', dojo: true, sub: 'Gold leaf, red lacquer and a ring in the middle, Chad Master Kenmatta meditating in it. The trial board hangs left of his medallion.',
      cast: {
        hitmonlee: ['Hitmonlee kicks the training dummy\'s head clean off, then puts it back on, politely.', 'Hitmonlee stretches its legs. They keep going. And going.', 'Hitmonlee bows to you, then to the ring, then to Ken. In that order.'],
        hitmonchan: ['Hitmonchan shadowboxes at its reflection in the gold leaf. The reflection is losing.', 'Hitmonchan taps its gloves together. It wants a sparring partner. It looks at you.', 'Hitmonchan is counting punches. It\'s past nine thousand.'],
        machop: ['Machop is lifting a barbell that\'s bigger than it is. It insists it\'s fine.', 'Machop flexes for you. Then again. You get the idea.', 'Machop is doing push-ups on one finger. Ken says it\'s a warm-up.'],
      } },
    nietos: { name: 'The Nietos\' House', leader: 'nietos', sub: 'Toys all over the floor, a crib in the corner, two gaming chairs and one very tired couch.',
      away: 'Nobody\'s home. A note on the fridge: "At the Gym with Linc. Beat one of us there and come for dinner! - Law & Britt"',
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
export const placeOf = (id) => TOWNS[id] || (id === 'clearing' ? CLEARING : id === 'depths' ? DEPTHS_CAMP : null);
