/* ============================================================
   data/houses.js  -  the Secret Base's houses (docs/roadmap.md's "Secret Base houses", the user's idea, 2026-10-23;
   mock-up docs/mockups/secret-base-houses.html): the Ancient Tree's lot in the Clearing holds the house you live in,
   bought from the Timburr crew's stand beside it (js/house-kiosk.js) and built there in 3D (js/hub-houses.js). Only the
   outside changes: rooms, furniture, the yard and residents stay as they are. No DOM here (tests/houses.test.mjs).

   The save keeps `houses` { owned: [id], home: id, paint: { id: n } }. A save without it is read by housesOf(): a base
   bought before houses keeps the Ancient Tree and has the Starter Cottage free; no base, no houses. The first write
   (a buy, a move, a repaint) stores what it read.
   ============================================================ */

/* Players see none of it until the user's playtest says go (as TOWNS_LIVE was): `?houses` shows it for a page load. */
export const HOUSES_LIVE = false;
export const housesOpen = () => HOUSES_LIVE || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('houses'));

export const REPAINT_PRICE = 250;

export const TIERS = [
  { id: 'starter', name: 'Starter' },
  { id: 'homestead', name: 'Homestead' },
  { id: 'legendary', name: 'Legendary' },
];

/* A house's paints are its three looks, the first what it's built in. The houses' colour keys are what their builders
   in js/hub-houses.js read; the tree's are its crown's (ancientArt() in js/hub-3d.js), the first exactly as it always was. */
export const HOUSES = [
  {
    id: 'cottage', name: 'Starter Cottage', tier: 'starter', price: 0, how: 'Comes with the Secret Base',
    blurb: 'A cream cottage under a gabled roof, shutters on its windows and a red mailbox by the gate.',
    paints: [
      { name: 'Pallet Red', roof: '#d24a3c', wall: '#f6f1e6', trim: '#ffffff', door: '#8a5a34' },
      { name: 'Cerulean Blue', roof: '#3a74c4', wall: '#f3f0e4', trim: '#ffffff', door: '#3a5a8a' },
      { name: 'Viridian Green', roof: '#3c8a52', wall: '#f1ead4', trim: '#ffffff', door: '#6a4a2a' },
    ],
  },
  {
    id: 'cabin', name: 'Log Cabin', tier: 'homestead', price: 1500, how: '1,500 PokéCoins',
    blurb: 'Round logs notched at the corners, a stone chimney, a porch lamp and a stack of firewood.',
    paints: [
      { name: 'Pine', wall: '#a26a3a', roof: '#3f7a4a', trim: '#efe0bc', door: '#5a3a20' },
      { name: 'Redwood', wall: '#8f4a32', roof: '#4a4a52', trim: '#efe0bc', door: '#5a3a20' },
      { name: 'Birch', wall: '#d2b48a', roof: '#a8452f', trim: '#efe0bc', door: '#6a4a2a' },
    ],
  },
  {
    id: 'bungalow', name: 'Seaside Bungalow', tier: 'homestead', price: 1500, how: '1,500 PokéCoins',
    blurb: 'A clapboard bungalow on a boardwalk deck, porthole windows, a life ring by the door and a palm.',
    paints: [
      { name: 'Lagoon', wall: '#a9d4e8', roof: '#356aa3', trim: '#ffffff', door: '#f0c45a' },
      { name: 'Coral', wall: '#f6c6b4', roof: '#e0705a', trim: '#ffffff', door: '#4aa0b0' },
      { name: 'Sandbar', wall: '#f2e2b8', roof: '#4c8a7a', trim: '#ffffff', door: '#d8603e' },
    ],
  },
  {
    id: 'tree', name: 'Ancient Tree', tier: 'legendary', price: null, how: 'Kept by every Secret Base made before houses',
    blurb: 'The old tree the Secret Base began in, its door in the roots.',
    paints: [
      { name: 'Spring', lobe: ['#1c5a26', '#2e7c34'], shade: [['#a8e078', '#6cc058'], ['#7cc860', '#48a044'], ['#5aac4a', '#2e7c34'], ['#3a8a3a', '#1c5a26']], leaf: ['#c8f090', '#8ad468'], bloom: ['#ffffff', '#f8c8e0'] },
      { name: 'Autumn', lobe: ['#6a2a10', '#9a4418'], shade: [['#f8c860', '#e89a38'], ['#e8903a', '#c8642a'], ['#c86a2a', '#9a4418'], ['#9a4a20', '#6a2a10']], leaf: ['#ffe08a', '#f0a848'], bloom: ['#ffe0a0', '#fff4d0'] },
      { name: 'Twilight', lobe: ['#1c2a5a', '#2c4078'], shade: [['#a8c0f0', '#7a94d8'], ['#7a94d8', '#5a74b8'], ['#5a74b8', '#3a5a8a'], ['#3a5088', '#1c2a5a']], leaf: ['#d0dcff', '#9ab0e8'], bloom: ['#e0d0ff', '#ffffff'] },
    ],
  },
];
export const HOUSES_BY_ID = Object.fromEntries(HOUSES.map(h => [h.id, h]));

const hasBase = (save) => !!save?.baseOwned;

/** The houses a save has: what it owns, the one it lives in (null without a base) and each one's paint. */
export function housesOf(save) {
  const h = save?.houses;
  if (!h) return hasBase(save) ? { owned: ['cottage', 'tree'], home: 'tree', paint: {} } : { owned: [], home: null, paint: {} };
  const owned = [...new Set((h.owned || []).filter(id => HOUSES_BY_ID[id]))];
  if (hasBase(save) && !owned.includes('cottage')) owned.unshift('cottage');
  const home = owned.includes(h.home) ? h.home : owned[0] ?? null;
  const paint = {};
  for (const id of owned) { const n = h.paint?.[id] | 0; if (n > 0 && n < HOUSES_BY_ID[id].paints.length) paint[id] = n; }
  return { owned, home, paint };
}

/** What the lot is called in a line ('the Ancient Tree', 'your Log Cabin', or before the base 'the Starter Cottage'),
    so the garden arch, the PC and the hints name what stands there. */
export function lotWord(save) {
  const home = housesOpen() && homeOf(save);
  if (!housesOpen() || home?.id === 'tree') return 'the Ancient Tree';
  return home ? `your ${HOUSES_BY_ID[home.id].name}` : 'the Starter Cottage';
}
const upper = (s) => s[0].toUpperCase() + s.slice(1);
export const LotWord = (save) => upper(lotWord(save));

export const paintOf = (save, id) => housesOf(save).paint[id] || 0;
/** The house on the lot: the one lived in, in its paint. */
export function homeOf(save) {
  const h = housesOf(save);
  return h.home ? { id: h.home, paint: h.paint[h.home] || 0 } : null;
}

const store = (d, h) => { d.houses = { owned: [...h.owned], home: h.home, paint: { ...h.paint } }; return d.houses; };

/** What buying `id` would say no to: 'base' (no Secret Base yet), 'owned', 'earned' (never sold), 'coins', or null. */
export function cantBuy(save, id) {
  const house = HOUSES_BY_ID[id];
  if (!house) return 'earned';
  if (!hasBase(save)) return 'base';
  if (housesOf(save).owned.includes(id)) return 'owned';
  if (house.price == null) return 'earned';
  return (save.coins ?? 0) < house.price ? 'coins' : null;
}

/** On a save draft: pays for `id`, built in paint `n` (the first paint job comes with it), and moves in. */
export function buyHouse(d, id, n = 0) {
  if (cantBuy(d, id)) return false;
  const h = store(d, housesOf(d));
  d.coins -= HOUSES_BY_ID[id].price;
  h.owned.push(id);
  h.home = id;
  if (n > 0 && n < HOUSES_BY_ID[id].paints.length) h.paint[id] = n; else delete h.paint[id];
  return true;
}

/** On a save draft: the Secret Base itself, bought with houses on: it comes as a Starter Cottage in paint `n`. */
export function firstHouse(d, n = 0) {
  d.houses = { owned: ['cottage'], home: 'cottage', paint: n > 0 && n < HOUSES_BY_ID.cottage.paints.length ? { cottage: n } : {} };
}

/** On a save draft: into a house already owned, free. */
export function moveIn(d, id) {
  const now = housesOf(d);
  if (!now.owned.includes(id)) return false;
  store(d, now).home = id;
  return true;
}

/** On a save draft: an owned house in its paint `n`, for REPAINT_PRICE. */
export function repaint(d, id, n) {
  const now = housesOf(d), house = HOUSES_BY_ID[id];
  if (!now.owned.includes(id) || !(n >= 0 && n < house.paints.length) || (now.paint[id] || 0) === n || (d.coins ?? 0) < REPAINT_PRICE) return false;
  const h = store(d, now);
  d.coins -= REPAINT_PRICE;
  if (n) h.paint[id] = n; else delete h.paint[id];
  return true;
}
