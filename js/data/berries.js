/* berries.js  -  the backyard's berry garden (docs/roadmap.md's backyard, part d): a soil plot is placed like furniture
   (`berryplot` in js/base-furniture-yard.js), a berry planted in it grows over real UTC days, sprout to bloom to fruit,
   ripe on the UTC midnight its days end, like the store's restock. Picking one gives a few PokéCoins, never run items
   (the base's rule: decoration only), and the first of each kind its berry basket instead, an earned piece
   (js/data/furniture.js's `berry` source). Coins from the garden stop at DAY_CAP a UTC day, well under the Game
   Corner's ~380, since plots can be duplicated without end. A plot's crop is saved on its item (`it.crop`); everything
   else in `secretBase.garden`. Kept free of the DOM so node tests can read it. */

export const BERRIES = [
  { id: 'cheri', name: 'Cheri Berry', days: 1, coins: 8, fruit: '#e0383a', flower: '#fbf6f0', round: 1 },
  { id: 'oran', name: 'Oran Berry', days: 1, coins: 8, fruit: '#3a74d8', flower: '#f4f0ff', round: 1 },
  { id: 'pecha', name: 'Pecha Berry', days: 1, coins: 8, fruit: '#f490b4', flower: '#ffe0ec', round: 0.9 },
  { id: 'sitrus', name: 'Sitrus Berry', days: 2, coins: 20, fruit: '#f4cc30', flower: '#fff6c8', round: 1.15 },
  { id: 'lum', name: 'Lum Berry', days: 3, coins: 35, fruit: '#58b848', flower: '#eaffdc', round: 1.05 },
];
export const BERRY = Object.fromEntries(BERRIES.map(b => [b.id, b]));
export const DAY_CAP = 100;
const DAY = 864e5;

const dayOf = (now) => new Date(now).toISOString().slice(0, 10);

/** A crop just planted: ripe on the UTC midnight `days` after today's. */
export const sow = (id, now = Date.now()) => ({ id, at: now, ready: (Math.floor(now / DAY) + BERRY[id].days) * DAY });

/** How far a crop is: 'sprout' for its first half, 'bloom' till ripe, then 'fruit'. Null for an empty plot. */
export function stageOf(crop, now = Date.now()) {
  if (!crop || !BERRY[crop.id]) return null;
  if (now >= crop.ready) return 'fruit';
  return (now - crop.at) / Math.max(1, crop.ready - crop.at) < 0.5 ? 'sprout' : 'bloom';
}

/** Minutes till a crop is ripe (0 once it is). */
export const minutesLeft = (crop, now = Date.now()) => Math.max(0, Math.ceil((crop.ready - now) / 6e4));

/** Berries the save has ever picked, for the baskets. */
export const picked = (save) => save?.secretBase?.garden?.picked || [];

/** Coins the garden can still give today. */
export const coinsLeft = (garden, now = Date.now()) => DAY_CAP - (garden?.day === dayOf(now) ? garden.coins : 0);

/** Pick a ripe plot `it` on base `b`: empties it and books the reward on `b.garden`. Returns { berry, coins, basket }
    (the coins are the caller's to add to the save), or null if nothing is ripe. The first of a kind is its basket. */
export function harvest(b, it, now = Date.now()) {
  if (stageOf(it.crop, now) !== 'fruit') return null;
  const berry = BERRY[it.crop.id];
  delete it.crop;
  const g = (b.garden ||= {});
  g.picked ||= [];
  if (!g.picked.includes(berry.id)) { g.picked.push(berry.id); return { berry, coins: 0, basket: true }; }
  if (g.day !== dayOf(now)) { g.day = dayOf(now); g.coins = 0; }
  const coins = Math.max(0, Math.min(berry.coins, DAY_CAP - g.coins));
  g.coins += coins;
  return { berry, coins, basket: false };
}
