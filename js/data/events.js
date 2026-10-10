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
    text: 'A tree heavy with Oran Berries grows by the path.',
    eatHeal: 0.3,              // share of max HP healed
    plantMaxHp: [5, 7, 9, 11],     // max HP gained (and healed)
  },
  {
    id: 'move-tutor', icon: '🎓', name: 'Move Tutor',
    text: 'Chad Master Kenmatta, the Move Tutor, offers to teach a rare move, for a price.',
    price: [60, 80, 100, 120],      // ₽
    hpCost: [7, 10, 14, 18],       // or pay in HP instead
  },
  {
    id: 'move-deleter', icon: '📖', name: 'Move Deleter',
    text: 'A strange man insists he can make your Pokémon forget moves.',
    doubleHpCost: 0.1,         // share of max HP to forget two moves instead of one
  },
  {
    id: 'item-ball', icon: '⚫', name: 'Item Ball',
    text: 'A Poké Ball lies in the grass. Is it an item... or a Voltorb?',
    trapChance: 0.25,          // a Voltorb
    relicChance: 0.15,         // a relic; else (60%) an item
    trapDamage: [10, 14, 20, 26],  // never takes you below 1 HP
  },
  {
    id: 'hot-spring', icon: '♨️', name: 'Hot Spring',
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
    text: 'The Day Care couple offer to swap one of your moves for a rarer one they\'ve been raising.',
    // a card of each rarity trades for a random card (of your type's pool) of the next one up; rares can't be traded
    upgrade: { common: 'uncommon', uncommon: 'rare' },
  },
  {
    id: 'wishing-well', icon: '⛲', name: 'Wishing Well',
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
    text: 'The Pokémon Fan Club rushes over to meet your Pokémon!',
    healthyMoney: [40, 55, 70, 85],   // ₽ if your HP is above half
    tiredItem: 'super-potion',    // otherwise they hand you this (or tiredMoney with a full Bag)
    tiredMoney: [15, 20, 25, 30],
  },
  {
    id: 'shrine', icon: '⛩️', name: 'Shrine',
    text: 'An old shrine hums with the power of your Pokémon\'s type.',
    // HP for one of your type's relics (a normal relic once you own them all); never faints you
    offering: [6, 9, 12, 15],
  },
];

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
