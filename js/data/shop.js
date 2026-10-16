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
   a full clear ~230-250 at Level 0 and ~350 at Level 5 (COIN_LEVEL_BONUS).
   Since 2026-10-16 they also weigh the one-off rewards (the Trainer's
   Journal ~26500, the Pokédex ~13300, the Ranger board ~11700) and the
   daily ones (missions up to 200 a day and 1000 a week, the Game Corner
   up to 500 a day), which together had outgrown what coins could buy (the
   user's call). Everything here costs ~34600: skins 2400, perks 11800
   (the Scope Upgrade's 4000 of it), shinies 20400 (cosmetic, the long
   tail; a Level 5 win gives its starter's for free).
   The biggest things to save for are the Grand Ballroom's
   (js/data/catalogue.js): starter statues ~127000, shells 15000.
   ============================================================ */

/** Skins bought outright - a cheap, no-grind way to unlock a new look. */
export const SKIN_SHOP_ITEMS = [
  { id: 'cyndaquil', cost: 300 },
  { id: 'chikorita', cost: 300 },
  { id: 'totodile',  cost: 300 },
  { id: 'tepig',     cost: 500 },
  { id: 'snivy',     cost: 500 },
  { id: 'oshawott',  cost: 500 },
];

/** Permanent passive perks. `maxLevel` > 1 means it can be bought more than once, at rising cost. */
export const PASSIVE_SHOP_ITEMS = [
  {
    id: 'hpBoost', icon: '❤️', name: 'Max HP Boost',
    text: '+5 max HP for every starter.',
    costs: [200, 500, 1000], maxLevel: 3,
  },
  {
    id: 'relicCharm', icon: '🔮', name: 'Starting Relic Charm',
    text: 'Begin every run already holding one random common relic.',
    costs: [600], maxLevel: 1,
  },
  {
    id: 'wellFed', icon: '🍲', name: 'Well-Fed Bonus',
    text: 'Pokémon Centers heal +5% more.',
    costs: [400], maxLevel: 1,
  },
  {
    id: 'coinFinder', icon: '💰', name: 'Coin Finder',
    text: '+15% PokéCoins from every source.',
    costs: [800], maxLevel: 1,
  },
  {
    id: 'bagPocket', icon: '🎒', name: 'Bag Pocket',   // StS's Potion Belt
    text: 'Your Bag holds 4 items instead of 3.',
    costs: [750], maxLevel: 1,
  },
  {
    id: 'martCard', icon: '🏷️', name: 'Mart Card',     // StS's Membership Card, in steps
    text: 'Poké Mart prices 10% lower: cards, items, relics and forgetting a move (15% at Lv 2, 20% at Lv 3).',
    costs: [300, 600, 1000], maxLevel: 3,
  },
  {
    id: 'tutorNotes', icon: '📖', name: 'Move Tutor Notes',   // Neow's "upgrade a card"
    text: 'Start every run by PP Upping one move of your starting deck, your pick.',
    costs: [750], maxLevel: 1,   // a Lv 2 (two moves) was +8 to +28 points at Level 3 in the bot: one move is Neow's own
  },
  {
    id: 'scoutReport', icon: '🔍', name: 'Scout Report',   // StS's Question Card
    text: 'Card rewards after a fight offer 4 moves instead of 3.',
    costs: [900], maxLevel: 1,
  },
  {
    id: 'scopeUpgrade', icon: '👀', name: 'Scope Upgrade',   // needs the Silph Scope, a complete Pokédex's prize
    text: 'The Silph Scope reveals 2 rooms a biome (3 at Lv 2).',
    costs: [1500, 2500], maxLevel: 2, needsDex: true,
  },
];

/** Mart Card: the price cut at each level (index = level). */
export const MART_DISCOUNT = [0, 0.1, 0.15, 0.2];
/** Scout Report: cards on a fight's card reward, without and with it. */
export const REWARD_CARDS = [3, 4];

/** A starter's shiny colours, by how it's unlocked (the free three are cheapest, legendaries dearest). Cosmetic only;
    it can only be bought once you own the starter. Mewtwo isn't playable yet, so it has none. */
export const SHINY_COSTS = { free: 400, skin: 600, legendary: 800 };

/** PokéCoins from fights and wins grow with the Trainer Level played: +10% a level (Level 5 pays +50%). */
export const COIN_LEVEL_BONUS = 0.1;
