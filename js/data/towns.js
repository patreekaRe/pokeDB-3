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
    // where townsfolk stand about (tiles of the 13 x 18 village, js/event-3d.js's buildTown())
    stands: [[5, 14], [7, 12], [4, 7], [8, 13], [5, 4], [7, 3], [3, 10], [9, 10], [6, 6], [5, 16]],
    folk: [
      { id: 'eevee', name: 'Eevee', move: 'hop', speed: 2.0, likes: ['stand'],
        quips: ['Vee!', 'Which one will I become?', 'The kimono dancers are practising again.', 'Eevee~'],
        play: ['I could watch the lanterns all evening.', 'So many choices...', 'Ooh, a leaf!', 'Vee vee!'],
        you: ['Eevee! Hi, {name}!', 'I can\'t decide what to evolve into. Like the Gym Leader can\'t decide what to play.', 'Are you climbing to the Shrine? Be careful on the stair!'] },
      { id: 'espeon', name: 'Espeon', move: 'walk', speed: 1.4, likes: ['stand'],
        quips: ['Esp.', 'I sense a long road ahead.', 'The air is clear today.', '*tail sways*'],
        play: ['The sun through the cedars...', 'Hmm. A visitor.', 'The Shrine is restless.', 'Esp...'],
        you: ['I knew you were coming, {name}.', 'The Shrine\'s guardian is strong. You are stronger. Probably.', 'Walk softly past the old cedars.'] },
      { id: 'flareon', name: 'Flareon', move: 'walk', speed: 1.5, likes: ['stand'],
        quips: ['Flare!', 'I keep the lanterns warm.', 'Too chilly up the stair for me.', 'Fla~'],
        play: ['This lantern needs a little more flame.', 'Toasty.', 'Fwoosh!', 'Warm paws, warm heart.'],
        you: ['Flareon! Need warming up, {name}?', 'I light a lantern or two when nobody\'s looking.', 'The Gym Leaders argue about bedtimes. Every night.'] },
      { id: 'jolteon', name: 'Jolteon', move: 'hop', speed: 2.4, likes: ['stand'],
        quips: ['Jolt!', 'Zip, zip!', 'Can\'t sit still!', 'Bzzt!'],
        play: ['Run to the gate and back? Again?', 'Bzz bzz!', 'Faster!', 'Jolt jolt!'],
        you: ['Jolteon! Race you to the gate, {name}!', 'I ran up the whole stair this morning. Twice.', 'That loud Gym Leader? I like him. He\'s fast too.'] },
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
