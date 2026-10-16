/* ============================================================
   catalogue.js  -  the Grand Catalogue (2026-10-16, the user's ask: big things to save PokéCoins for, once the
   Trainer's Journal paid more than coins could buy), always in stock (js/grand-shop.js):
   - a gold statue of each starter you own (js/base-furniture-statues.js), 2 x 2 on a marble pedestal, its final form
     (a legendary as itself); Mewtwo's only once Mewtwo is yours. More copies are bought here again, at full price,
     never the PC's Duplicate.
   - Pokédex shells, worn from Settings > Device colour like the free ones (css/base.css's data-shell colours).
   Prices are tuned against the coins of 2026-10-16 (js/data/shop.js's note): ~700 a day from missions and the Game
   Corner, ~55,000 once from the Journal, Pokédex and Ranger board. The statues are the long tail (~127,000 in all).
   Since 2026-10-16 (the user's idea the same day) they're sold in the Furniture store's third floor, the Grand
   Ballroom, by its keeper: open once you own BALLROOM_KINDS kinds of furniture, for BALLROOM_PRICE (both, the
   ballroom being for collectors; `secretBase.ballroom`).
   ============================================================ */

/** Kinds of furniture to own (bought or earned, the statues not counted) before the Grand Ballroom can be opened. */
export const BALLROOM_KINDS = 40;
/** PokéCoins to open it, once you have them. */
export const BALLROOM_PRICE = 5000;

/** A statue's price by how its starter is unlocked. */
export const STATUE_COSTS = { free: 2000, skin: 3000, legendary: 5000, secret: 10000 };

export const statueKind = (id) => `statue-${id}`;
export const statueClass = (s) => s.secret ? 'secret' : s.free ? 'free' : s.legendary ? 'legendary' : 'skin';
/** The form a statue shows: the last evolution, or a legendary as itself (its later stages are only an aura). */
export const statueForm = (s) => s.line[s.legendary ? 0 : s.line.length - 1];
export const statueSprite = (s) => `assets/pokemon/${statueForm(s).id}-front.gif`;

/** Shells sold here, after the free ones and Grand Champion's gold. `swatch` is the chip's colour in Settings. */
export const LUXURY_SHELLS = [
  { id: 'silver', name: 'Silver', swatch: '#b4b8c4', price: 2500 },
  { id: 'crystal', name: 'Crystal', swatch: '#8a78d8', price: 2500 },
  { id: 'teal', name: 'Teal', swatch: '#189a94', price: 2500 },
  { id: 'orange', name: 'Orange', swatch: '#e8742a', price: 2500 },
  { id: 'purple', name: 'Purple', swatch: '#6a32b0', price: 2500 },
  { id: 'white', name: 'White', swatch: '#ecebe6', price: 2500 },
];
export const LUXURY_SHELL_IDS = new Set(LUXURY_SHELLS.map(s => s.id));
