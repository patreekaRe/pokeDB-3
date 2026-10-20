/* ============================================================
   events.js  -  the "?" map rooms. Each one is a short scene with a
   choice, and most choices cost something (HP, max HP, ₽ or a risk),
   like Slay the Spire's events.

   Numbers written as [a, b, c] are per biome (Biome 1, 2, 3, and Mewtwo's Crystal Depths), by its slot: an other-road
   biome from the crossroads (the Sunken Ruins is Biome 2) takes its slot's number. What each
   choice does is in eventRoom() in js/run.js; tune the numbers here.

   Which event a room holds (and any dice, like the Item Ball's trap, the
   Day Care's cards or the Wishing Well's luck and relics) is
   rolled when the biome starts, so a refresh can't reroll it.
   ============================================================ */

export const EVENTS = [
  {
    id: 'berry-tree', icon: '🫐', name: 'Berry Tree',
    music: 'event-outdoor',   // the user's song for the outdoor rooms (2026-10-11)
    text: 'A tree heavy with Oran Berries grows by the path.',
    eatHeal: 0.3,              // share of max HP healed
    plantMaxHp: [5, 7, 9, 11],     // max HP gained (and healed)
  },
  {
    id: 'move-tutor', icon: '🎓', name: 'Move Tutor',
    music: 'event-room',   // the user's song for the indoor rooms (2026-10-11)
    text: 'Chad Master Kenmatta, the Move Tutor, offers to teach a rare move, for a price.',
    price: [60, 80, 100, 120],      // ₽
    hpCost: [7, 10, 14, 18],       // or pay in HP instead
  },
  {
    id: 'move-deleter', icon: '📖', name: 'Move Deleter',
    music: 'event-room',   // the user's song for the indoor rooms (2026-10-11)
    text: 'A strange man insists he can make your Pokémon forget moves.',
    doubleHpCost: 0.1,         // share of max HP to forget two moves instead of one
  },
  {
    id: 'item-ball', icon: '⚫', name: 'Item Ball',
    music: 'event-outdoor',   // the user's song for the outdoor rooms (2026-10-11)
    text: 'A Poké Ball lies in the grass. Is it an item... or a Voltorb?',
    trapChance: 0.25,          // a Voltorb
    relicChance: 0.15,         // a relic; else (60%) an item
    trapDamage: [10, 14, 20, 26],  // never takes you below 1 HP
  },
  {
    id: 'hot-spring', icon: '♨️', name: 'Hot Spring',
    music: 'event-outdoor',   // the user's song for the outdoor rooms (2026-10-11)
    text: 'Steam rises from a spring hidden between the rocks.',
    soakMaxHpLoss: [4, 5, 6, 7],  // a full heal, but max HP drops by this
    dipHeal: 0.15,
  },
  {
    id: 'team-rocket', icon: '🚀', name: 'Team Rocket',
    text: 'A Team Rocket grunt blocks the road and demands a toll!',
    music: 'team-rocket',          // the user's (2026-10-09): only in the room; the fight cuts to the elite song
    toll: [30, 45, 60, 75],        // ₽
    fleeHp: 0.15,              // share of max HP lost running past
    // The grunt's Pokémon (an Alpha version: an elite fight with elite rewards), by biome id: from its own wilds, so a new
    // biome needs a line here. All Normal, like every Alpha.
    team: { clearing: ['rattata', 'zigzagoon'], shrine: ['teddiursa', 'aipom'], ruins: ['bidoof', 'lillipup'], wastes: ['bouffalant', 'zangoose'], thornwood: ['slakoth'], savanna: ['meowth', 'minccino'], depths: ['crobat', 'sableye'] },
    grunts: ['grunt-m', 'grunt-f'],   // the grunt himself (or herself), from assets/trainers/
  },
  {
    id: 'day-care', icon: '🥚', name: 'Day Care',
    music: 'event-room',   // the user's song for the indoor rooms (2026-10-11)
    text: 'The Day Care couple offer to swap one of your moves for a rarer one they\'ve been raising.',
    // a card of each rarity trades for a random card (of your type's pool) of the next one up; rares can't be traded
    upgrade: { common: 'uncommon', uncommon: 'rare' },
  },
  {
    id: 'wishing-well', icon: '⛲', name: 'Wishing Well',
    music: 'event-outdoor',   // the user's song for the outdoor rooms (2026-10-11)
    text: 'Something glints at the bottom of an old well. They say a coin buys a wish.',
    // pay ₽ for a chance of a relic (choose 1 of 3); the bigger toss has better odds
    tosses: [
      { price: [30, 40, 50, 60], odds: 0.4 },
      { price: [70, 90, 110, 130], odds: 0.8 },
    ],
    fish: [20, 30, 40, 50],   // ₽ fished out of the well when you can't make the small toss, so the room is never wasted
  },
  {
    id: 'fan-club', icon: '📣', name: 'Fan Club',
    music: 'event-room',   // the user's song for the indoor rooms (2026-10-11)
    text: 'The Pokémon Fan Club rushes over to meet your Pokémon!',
    healthyMoney: [40, 55, 70, 85],   // ₽ if your HP is above half
    tiredItem: 'super-potion',    // otherwise they hand you this (or tiredMoney with a full Bag)
    tiredMoney: [15, 20, 25, 30],
  },
  {
    id: 'shrine', icon: '⛩️', name: 'Shrine',
    music: 'shrine-room',   // the user's song for the Shrine (2026-10-11)
    text: 'An old shrine hums with the power of your Pokémon\'s type.',
    // HP for one of your type's relics (a normal relic once you own them all); never faints you
    offering: [6, 9, 12, 15],
  },

  // batch 1 of the StS events (2026-10-17, the user's picks): docs/roadmap.md's "More ? events"
  {
    id: 'sleeping-snorlax', icon: '😴', name: 'Sleeping Snorlax',   // StS: Dead Adventurer
    music: 'event-outdoor',
    text: 'A Snorlax snores across the path, curled round a pile of things other trainers dropped.',
    loot: ['money', 'item', 'relic'],   // what the pile holds, found in a rolled order, one a search
    lootMoney: [30, 40, 50, 60],
    wake: [0.25, 0.5, 0.75],            // the chance it wakes on the 1st, 2nd and 3rd search: then an Alpha fight
    foeHp: 0.4,                         // its share of a boss Snorlax's HP, fought as an Alpha
  },
  {
    id: 'trash-heap', icon: '🗑️', name: 'Trash Heap',   // StS: Scrap Ooze
    music: 'event-outdoor',
    text: 'A Trubbish guards a heap of junk. Something shiny is buried in there.',
    digHp: [3, 4, 5, 6],   // HP a dig, +1 each dig after
    odds: 0.25,            // the first dig's chance of a relic, +step each dig after
    step: 0.1,
  },
  {
    id: 'ditto', icon: '🟣', name: 'Ditto',   // StS: Duplicator and Transmogrifier
    music: 'event-outdoor',
    text: 'A Ditto wobbles out of the grass and copies your Pokémon\'s face.',
    // copy a move (one more of it), or let it turn one into a random move of the same rarity from your type's pool
    morph: ['common', 'uncommon', 'rare'],
  },
  {
    id: 'bills-pc', icon: '💻', name: "Bill's PC",   // StS: Note for Yourself
    music: 'event-room',
    text: 'Bill\'s cottage, and his famous PC. Someone left a move in your Box.',
    // take out the move stored last time (one Box per type, kept in the save), then store one of yours for a later run
    box: 'quick-attack',   // what an empty Box holds
    not: ['safari', 'tower'],   // a Safari day and a climb are the same for everyone
  },
  {
    id: 'abra', icon: '🌀', name: 'Abra',   // StS: Secret Portal
    music: 'event-outdoor',
    text: 'An Abra dozes on a stump, humming with psychic power. It could Teleport you somewhere.',
    doze: 0.2,        // or doze beside it: this share of max HP healed (it sleeps 18 hours a day)
    not: ['tower'],   // a climb's floors are its score
  },

  // batch 2 of the StS events (2026-10-17): docs/roadmap.md's "More ? events"
  {
    id: 'prize-wheel', icon: '🎡', name: 'Prize Wheel',   // StS: Wheel of Change
    music: 'event-outdoor',
    text: 'A Meowth runs a prize wheel by the road. "One free spin, nya! No refunds!"',
    // one free spin, its slice rolled as the biome starts: each as likely as the rest
    slices: ['money', 'relic', 'heal', 'forget', 'item', 'ouch'],
    wheelMoney: [70, 100, 130, 160],
    ouch: 0.1,   // the share of max HP the bad slice costs (never faints you)
  },
  {
    id: 'ruins-idol', icon: '🗿', name: 'Ruins Idol',   // StS: Golden Idol
    music: 'event-outdoor',
    text: 'A golden idol sits on a plinth among old ruins. On the ledge above it, a Golem sits beside a huge boulder.',
    relic: 'relic-statue',          // what the idol is; held already, it's a Relic Gold worth `gold` ₽ instead
    gold: [60, 80, 100, 120],
    boulder: 0.25,                  // then the Golem shoves its boulder down: brace for this share of max HP,
    hide: 0.08,                     // or dive aside and lose this share of max HP for good
  },
  {
    id: 'odd-keystone', icon: '👻', name: 'Odd Keystone',   // StS: Knowing Skull
    music: 'event-outdoor',
    text: 'An Odd Keystone sits on a cairn of stones. A Spiritomb drifts out of it, whispering: ask, and it will give... for a price.',
    askHp: [5, 6, 7, 8],            // HP an ask, +1 for every ask before it
    askMoney: [40, 55, 70, 85],     // ask for ₽, an item or a neutral move, as often as your HP allows
  },
  {
    id: 'moon-dance', icon: '🌙', name: 'Moon Dance',   // StS: Shining Light
    music: 'event-outdoor',
    text: 'Under the moon, a ring of Clefairy dance round a Moon Stone.',
    danceHp: [6, 8, 10, 12],        // join the dance: 2 random moves PP Up, for this much HP
    moonlight: 0.25,                // or bask in the moonlight: this share of max HP healed
  },
  {
    id: 'swap-stall', icon: '🦎', name: 'Swap Stall',   // StS: N'loth
    music: 'event-outdoor',
    text: 'A Kecleon keeps a stall of odd treasures. It eyes your Bag and changes colour.',
    // it wants one of two of your relics (rolled), and trades it for one a tier rarer
    up: { common: 'uncommon', uncommon: 'rare' },
  },

  // batch 3 of the StS events (2026-10-17): docs/roadmap.md's "More ? events"
  {
    id: 'canalave-library', icon: '📚', name: 'Canalave Library',   // StS: The Library
    music: 'event-room',
    text: 'The great library of Canalave City. A Noctowl keeps watch over shelves of old move manuals.',
    books: 20,     // read: learn one of this many moves from your type's pool, rolled as the biome starts
    nap: 0.33,     // or nap in the reading chair: this share of max HP healed
  },
  {
    id: 'fishing-spot', icon: '🎣', name: 'Fishing Spot',   // StS: Big Fish
    music: 'event-outdoor',
    text: 'A quiet jetty over deep water, three rods leaning on its rail. A Magikarp splashes about below.',
    oldRod: 0.33,             // the Old Rod hooks a Sitrus Berry: this share of max HP healed
    goodRod: [5, 6, 7, 8],    // the Good Rod reels in an HP Up: max HP gained (and healed)
    superRod: [8, 11, 14, 17],   // the Super Rod hooks a Gyarados guarding a chest: a relic, for this much HP
  },
  {
    id: 'sludge-pit', icon: '🦠', name: 'Sludge Pit',   // StS: World of Goop
    music: 'event-outdoor',
    text: 'You slip into a pit of sludge, a Grimer wallowing in it. Coins glint in the muck... and some of yours are sinking.',
    goopMoney: [60, 75, 90, 105],   // dig the coins out of the muck, for this much HP
    goopHp: [8, 10, 12, 14],
    lose: [[15, 35], [20, 45], [25, 55], [30, 65]],   // or climb out and leave this much ₽ in the sludge (rolled; never more than you have)
  },
  {
    id: 'silph-storeroom', icon: '📦', name: 'Silph Co. Storeroom',   // StS: The Lab
    music: 'event-room',
    text: 'A back room of Silph Co., stacked with crates of their newest goods. A Porygon floats by the shelves, guarding nothing in particular.',
    items: 3,                     // free items, found one after another (a full Bag asks what to swap)
    duskMoney: [20, 25, 30, 35],   // ₽ for each one a Dusk Stone keeps away
  },
  {
    id: 'bug-contest', icon: '🐛', name: 'Bug-Catching Contest',   // StS: The Joust
    music: 'event-outdoor',
    text: 'The Bug-Catching Contest\'s final round: a Scyther against a Caterpie! A Bug Catcher is taking bets.',
    bet: [30, 40, 50, 60],         // ₽ staked on one of them; the winner is rolled as the biome starts
    favourite: 0.7,                // Scyther's chance of winning
    pays: { favourite: 2, underdog: 5 },   // a winning bet pays back this many times the stake
  },

  // batch 3 of the StS events, its last five (2026-10-17): docs/roadmap.md's "More ? events"
  {
    id: 'unown-tablet', icon: '🔠', name: 'Unown Tablet',   // StS: Ancient Writing
    music: 'event-outdoor',
    text: 'An old stone tablet stands in the grass, carved with Unown glyphs. A few Unown drift round it.',
    // study the glyphs: every copy of your type's two basic moves (BASICS) PP Ups; or let the Unown erase one move
  },
  {
    id: 'smeargle-studio', icon: '🎨', name: "Smeargle's Studio",   // StS: Designer In-Spire
    music: 'event-room',
    text: 'A Smeargle\'s studio, paint on every wall. It looks your moves over like a blank canvas... for a fee.',
    touchUp: [40, 50, 60, 70],       // ₽: PP Up a move of your choice
    repaint: [60, 75, 90, 105],      // ₽: Transform a move of your choice into a random move of its rarity
    morph: ['common', 'uncommon', 'rare'],
    portrait: [90, 110, 130, 150],   // ₽: forget a move of your choice, and a random one PP Ups
  },
  {
    id: 'litwick-bonfire', icon: '🕯️', name: 'Litwick Bonfire',   // StS: Bonfire Spirits
    music: 'event-outdoor',
    text: 'A ring of Litwick sway round a bonfire in the dark, hungry for something to burn.',
    // offer a move to the fire (it's forgotten); the Litwick give back warmth by its rarity: this share of max HP healed
    warmth: { basic: 0.1, common: 0.25, uncommon: 1, rare: 1 },
    rareMaxHp: [5, 6, 7, 8],   // a rare one raises max HP too
  },
  {
    id: 'voltorb-flip', icon: '🃏', name: 'Voltorb Flip',   // StS: Match and Keep
    music: 'event-outdoor',
    text: 'A Voltorb rolls up to a table of face-down cards. "Flip two at a time. Match a pair and it\'s yours!"',
    pairs: ['common', 'uncommon', 'rare'],   // a pair of moves of each rarity from your type's pool, and a pair of Voltorb
    tries: 4,                                 // flips of two
    zap: [6, 8, 10, 12],                      // HP the Voltorb pair costs if you match it (never faints you)
  },
  {
    id: 'rivals-return', icon: '🆚', name: "Rival's Return",   // StS: We Meet Again
    music: 'event-outdoor',
    text: 'Your rival blocks the road again, his Sneasel at his heel. "Still at it? Give me something worth having and you can have this."',
    // he wants ₽, an item of your Bag or a move of your deck (which ones are rolled), each for a relic
    ask: [50, 70, 90, 110],
  },
];

/** Which search wakes the Snorlax (0-based), or loot.length if it sleeps through all of them: one roll a search. */
export const snorlaxWakesAt = (event, rolls) => {
  const i = event.wake.findIndex((p, k) => rolls[k] < p);
  return i < 0 ? event.loot.length : i;
};

/** The trash heap's dig `n` (0-based): its HP cost and its chance of a relic. */
export const trashDig = (event, n, biome) => ({
  hp: (Array.isArray(event.digHp) ? event.digHp[biome] : event.digHp) + n,
  odds: Math.min(1, event.odds + event.step * n),
});

/** What Ditto turns `card` into: the first rolled card of its rarity that isn't it and that you hold fewer than `max` of. */
export const dittoMorph = (offers, card, copies, max) =>
  (offers[card.rarity || 'common'] || []).find(id => id !== card.id && copies(id) < max) || null;

/** The Prize Wheel's slice for a spin rolled at `roll` (0-1). */
export const wheelSlice = (event, roll) => event.slices[Math.min(event.slices.length - 1, Math.floor(roll * event.slices.length))];

/** The Golem's boulder: { hp } it costs to brace for it, { maxHp } to dive aside. */
export const idolBoulder = (event, maxHp) => ({ hp: Math.ceil(maxHp * event.boulder), maxHp: Math.ceil(maxHp * event.hide) });

/** The HP the Odd Keystone's next ask costs, after `asked` asks. */
export const keystoneAsk = (event, asked, biome) => (Array.isArray(event.askHp) ? event.askHp[biome] : event.askHp) + asked;

/** The two relics of yours Kecleon wants (`owned` relic objects): those it can trade up, in a stable order, two picked
    by the rolls. */
export function swapWares(event, owned, rolls) {
  const left = owned.filter(r => event.up[r.rarity] && !r.boss && !r.unique).sort((a, b) => (a.id < b.id ? -1 : 1));
  return rolls.map(roll => left.splice(Math.floor(roll * left.length), 1)[0]).filter(Boolean);
}

/** What Kecleon gives for `give`: the first of the rolled `offers` (relic objects) a tier rarer that you don't hold. */
export const swapGift = (event, give, offers, held) => offers.find(r => r.rarity === event.up[give.rarity] && !held.includes(r.id)) || null;

/** The Library's shelf: the moves it can offer from your type's `pool` (never an evolution or unplayable card), in a
    rolled order (`order`, a shuffle), `event.books` of them. */
export const libraryShelf = (event, order) => order.filter(c => !c.evoOnly && !c.unplayable).slice(0, event.books);

/** The ₽ left in the Sludge Pit for climbing out: rolled between the biome's two numbers, never more than you have. */
export function goopLoss(event, roll, biome, money) {
  const [lo, hi] = event.lose[Math.min(biome, event.lose.length - 1)];
  return Math.min(money, lo + Math.min(hi - lo, Math.floor(roll * (hi - lo + 1))));
}

/** Who wins the Bug-Catching Contest for a roll (0-1): 'favourite' (Scyther) or 'underdog' (Caterpie). */
export const contestWinner = (event, roll) => (roll < event.favourite ? 'favourite' : 'underdog');

/** Each type's two basic moves, the attack and the block its deck starts with most of (the Unown Tablet PP Ups them;
    the Litwick Bonfire thinks little of them). */
export const BASICS = { fire: ['ember', 'flame-wall'], grass: ['vine-whip', 'block'], water: ['water-gun', 'withdraw'], psychic: ['psywave', 'psychic-guard'],
  electric: ['thunder-shock', 'magnet-rise'], ice: ['powder-snow', 'frost-shield'], fighting: ['rock-smash', 'mat-block'], ground: ['mud-shot', 'sand-veil'] };

/** The deck indexes the Unown Tablet PP Ups: every copy of the type's basics not yet PP Upped. */
export const tabletUps = (type, deck) => deck.map((id, i) => i).filter(i => (BASICS[type] || []).includes(deck[i]));

/** What the Litwick give back for a burnt `card`: its rank (a basic, else its rarity), the share of max HP healed and the
    max HP gained. */
export function bonfireGift(event, card, type, biome) {
  const rank = (BASICS[type] || []).includes(card.id.replace(/\+$/, '')) ? 'basic' : card.rarity || 'common';
  const grow = rank === 'rare' ? (Array.isArray(event.rareMaxHp) ? event.rareMaxHp[Math.min(biome, event.rareMaxHp.length - 1)] : event.rareMaxHp) : 0;
  return { rank, heal: event.warmth[rank] ?? event.warmth.common, maxHp: grow };
}

/** Where a game of Voltorb Flip stands after `flips` (tile indexes, two a try): the tiles matched, the moves won, whether
    the Voltorb pair went off, the tries left and whether it's over (no tries left, or nothing but Voltorb face down). */
export function flipState(event, board, flips) {
  const matched = new Set(), won = [];
  let zapped = false;
  for (let i = 0; i + 1 < flips.length; i += 2) {
    const a = flips[i], b = flips[i + 1];
    if (a === b || board[a] !== board[b]) continue;
    matched.add(a); matched.add(b);
    if (board[a] === 'voltorb') zapped = true;
    else won.push(board[a]);
  }
  const left = event.tries - Math.floor(flips.length / 2);
  return { matched, won, zapped, left, over: left <= 0 || board.every((t, i) => matched.has(i) || t === 'voltorb') };
}

/** The one of `list` your rival asks for, picked by `roll` (0-1); null when the list is empty. */
export const rivalWants = (list, roll) => (list.length ? list[Math.min(list.length - 1, Math.floor(roll * list.length))] : null);

/** The events a run of this kind can meet (an event's `not` lists the modes it stays out of). */
export const eventsFor = (mode) => EVENTS.filter(e => !e.not?.includes(mode));

/* The trainers standing in four events (still sprites from Pokéngine, `assets/trainers/<id>.png`, with an eyes-closed
   `<id>-blink.png`). eventFigure() in js/run.js cuts each into layers so it can breathe and talk a whole pixel at a
   time: `head` is [left, right, bottom] in sprite pixels, `waist` the row the upper body dips from. */
export const NPCS = {
  alder: { head: [20, 40, 29], waist: 48 },     // the Move Tutor, Chad Master Kenmatta (Jext's Alder, sitting cross-legged)
  deleter: { head: [24, 44, 17], waist: 36 },   // the Move Deleter (Augustine Sycamore)
  daycare: { head: [12, 34, 18], waist: 38 },   // the Day-Care Lady (Agatha)
  chairman: { head: [7, 27, 18], waist: 40 },   // the Fan Club's Chairman (Founder)
  rival: { head: [14, 43, 27], waist: 53 },     // your rival in Rival's Return: a silhouette in a cap (the Gym's unknown leader), his name never given
};

export const EVENTS_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));
