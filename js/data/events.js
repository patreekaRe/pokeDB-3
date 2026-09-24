/* ============================================================
   events.js  -  the "?" map rooms. Each one is a short scene with a
   choice, and most choices cost something (HP, max HP, ₽ or a risk),
   like Slay the Spire's events.

   Numbers written as [a, b, c] are per biome (Biome 1, 2, 3). What each
   choice does is in eventRoom() in js/run.js; tune the numbers here.

   Which event a room holds (and any dice, like the Item Ball's trap) is
   rolled when the biome starts, so a refresh can't reroll it.
   ============================================================ */

export const EVENTS = [
  {
    id: 'berry-tree', icon: '🫐', name: 'Berry Tree',
    text: 'A tree heavy with Oran Berries grows by the path.',
    eatHeal: 0.3,              // share of max HP healed
    plantMaxHp: [5, 7, 9],     // max HP gained (and healed)
  },
  {
    id: 'move-tutor', icon: '🎓', name: 'Move Tutor',
    text: 'An old tutor offers to teach a rare move, for a price.',
    price: [60, 80, 100],      // ₽
    hpCost: [7, 10, 14],       // or pay in HP instead
  },
  {
    id: 'move-deleter', icon: '📖', name: 'Move Deleter',
    text: 'A strange man insists he can make your Pokémon forget moves.',
    doubleHpCost: 0.1,         // share of max HP to forget two moves instead of one
  },
  {
    id: 'item-ball', icon: '⚫', name: 'Item Ball',
    text: 'A Poké Ball lies in the grass. Is it an item... or a Voltorb?',
    trapChance: 0.4,
    trapDamage: [10, 14, 20],  // never takes you below 1 HP
  },
  {
    id: 'hot-spring', icon: '♨️', name: 'Hot Spring',
    text: 'Steam rises from a spring hidden between the rocks.',
    soakMaxHpLoss: [4, 5, 6],  // a full heal, but max HP drops by this
    dipHeal: 0.15,
  },
  {
    id: 'team-rocket', icon: '🚀', name: 'Team Rocket',
    text: 'A Team Rocket grunt blocks the road and demands a toll!',
    toll: [40, 60, 80],        // ₽
    fleeHp: 0.1,               // share of max HP lost running past
    // The grunt's Pokémon (an Alpha version: an elite fight with elite rewards), picked per biome.
    team: [['rattata', 'zubat'], ['zubat', 'geodude'], ['machop', 'rhyhorn']],
  },
];

export const EVENTS_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));
