/* ============================================================
   mart.js  -  Pokédollars (₽) and the Poké Mart map room.

   Pokédollars are prize money for the current run only (lost when it
   ends), unlike PokéCoins, which are kept forever (see shop.js).
   Every price gets a ±MART_JITTER wobble when a Mart's stock is rolled.
   ============================================================ */

// [min, max] prize money for winning each kind of fight.
export const PRIZE_MONEY = { fight: [12, 18], elite: [25, 35], boss: [65, 85] };

export const MART_CARD_PRICES = { common: 50, uncommon: 80, rare: 125 };
export const MART_RELIC_PRICES = { normal: 150, rare: 220 };
export const MART_JITTER = 0.1;

// Forgetting a move costs more each time you buy it in the same run.
export const MART_REMOVAL = { base: 75, step: 25 };

export const MART_STOCK = { cards: 5, relics: 2 };
