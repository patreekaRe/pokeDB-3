/* ============================================================
   shop.js  -  what you can buy with PokéCoins on the start screen.

   Two kinds of item:
     skin      unlocks a starter to play (see data/starters.js). Once
               bought, it behaves exactly like an achievement-unlocked
               starter - it just skips the achievement.
     passive   a permanent perk that applies to every future run. Some
               (hpBoost) stack up to a limit; most are a one-time buy.
               Where they actually take effect: run.js (HP boost, relic
               charm, rest-site bonus) and storage.js's awardCoins()
               (coin finder).

   Costs are tuned against roughly what a run earns (see run.js's
   COIN_REWARDS): a run that dies partway through earns ~80-100 coins,
   a full clear ~230-250.
   ============================================================ */

/** Skins bought outright - a cheap, no-grind way to unlock a new look. */
export const SKIN_SHOP_ITEMS = [
  { id: 'cyndaquil', cost: 150 },
  { id: 'chikorita', cost: 150 },
  { id: 'totodile',  cost: 150 },
  { id: 'snivy',     cost: 250 },
  { id: 'tepig',     cost: 250 },
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
];
