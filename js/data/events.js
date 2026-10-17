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
    not: ['tower'],   // a climb's floors are its score
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
};

export const EVENTS_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));
