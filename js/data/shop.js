/* ============================================================
   shop.js  -  what you can buy with PokéCoins on the start screen.

   Two kinds of item:
     skin      unlocks a starter to play (see data/starters.js). Once
               bought, it behaves exactly like an achievement-unlocked
               starter - it just skips the achievement.
     passive   a permanent perk that applies to every future run. Some
               (hpBoost) stack up to a limit; most are a one-time buy.
               Where they actually take effect: run.js (HP boost, relic
               charm, rest-site bonus, Bag Pocket, Mart Card, Move Tutor
               Notes, Scout Report) and storage.js's awardCoins() (coin
               finder). perkLevel() in storage.js reads any of them.
     shiny     a starter's shiny colours (SHINY_COSTS), cosmetic only.

   Costs are tuned against roughly what a run earns (see run.js's
   COIN_REWARDS): a run that dies partway through earns ~80-100 coins,
   a full clear ~230-250 at Level 0 and ~350 at Level 5 (COIN_LEVEL_BONUS),
   plus 450 once for the Pokédex pages. Everything here costs ~8400:
   skins 1200, perks 3430, shinies 3750, so ~35 runs buy it all and
   the shinies (cosmetic) are the long tail.
   ============================================================ */

/** Skins bought outright - a cheap, no-grind way to unlock a new look. */
export const SKIN_SHOP_ITEMS = [
  { id: 'cyndaquil', cost: 150 },
  { id: 'chikorita', cost: 150 },
  { id: 'totodile',  cost: 150 },
  { id: 'tepig',     cost: 250 },
  { id: 'snivy',     cost: 250 },
  { id: 'oshawott',  cost: 250 },
];

/** Permanent passive perks. `maxLevel` > 1 means it can be bought more than once, at rising cost. */
export const PASSIVE_SHOP_ITEMS = [
  {
    id: 'hpBoost', icon: '❤️', name: 'Max HP Boost',
    text: '+5 max HP for every starter.',
    costs: [100, 200, 350], maxLevel: 3,
  },
  {
    id: 'relicCharm', icon: '🔮', name: 'Starting Relic Charm',
    text: 'Begin every run already holding one random common relic.',
    costs: [250], maxLevel: 1,
  },
  {
    id: 'wellFed', icon: '🍲', name: 'Well-Fed Bonus',
    text: 'Pokémon Centers heal +5% more.',
    costs: [180], maxLevel: 1,
  },
  {
    id: 'coinFinder', icon: '💰', name: 'Coin Finder',
    text: '+15% PokéCoins from every source.',
    costs: [300], maxLevel: 1,
  },
  {
    id: 'bagPocket', icon: '🎒', name: 'Bag Pocket',   // StS's Potion Belt
    text: 'Your Bag holds 4 items instead of 3.',
    costs: [300], maxLevel: 1,
  },
  {
    id: 'martCard', icon: '🏷️', name: 'Mart Card',     // StS's Membership Card, in steps
    text: 'Poké Mart prices 10% lower: cards, items, relics and forgetting a move (15% at Lv 2, 20% at Lv 3).',
    costs: [150, 250, 400], maxLevel: 3,
  },
  {
    id: 'tutorNotes', icon: '📖', name: 'Move Tutor Notes',   // Neow's "upgrade a card"
    text: 'Start every run by PP Upping one move of your starting deck, your pick (two moves at Lv 2).',
    costs: [200, 400], maxLevel: 2,
  },
  {
    id: 'scoutReport', icon: '🔍', name: 'Scout Report',   // StS's Question Card
    text: 'Card rewards after a fight offer 4 moves instead of 3.',
    costs: [350], maxLevel: 1,
  },
];

/** Mart Card: the price cut at each level (index = level). */
export const MART_DISCOUNT = [0, 0.1, 0.15, 0.2];
/** Scout Report: cards on a fight's card reward, without and with it. */
export const REWARD_CARDS = [3, 4];

/** A starter's shiny colours, by how it's unlocked (the free three are cheapest, legendaries dearest). Cosmetic only;
    it can only be bought once you own the starter. Mewtwo isn't playable yet, so it has none. */
export const SHINY_COSTS = { free: 150, skin: 200, legendary: 300 };

/** PokéCoins from fights and wins grow with the Trainer Level played: +10% a level (Level 5 pays +50%). */
export const COIN_LEVEL_BONUS = 0.1;
