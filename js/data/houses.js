/* ============================================================
   data/houses.js  -  the Secret Base's houses (docs/roadmap.md's "Secret Base houses", the user's idea, 2026-10-23;
   mock-up docs/mockups/secret-base-houses.html): the Ancient Tree's lot in the Clearing holds the house you live in,
   bought from the Timburr crew's stand beside it (js/house-kiosk.js) and built there in 3D (js/hub-houses.js). Only the
   outside changes: rooms, furniture, the yard and residents stay as they are. No DOM here (tests/houses.test.mjs).

   The save keeps `houses` { owned: [id], home: id, paint: { id: n } }. Every base comes with the Ancient Tree, lived in,
   and the Starter Cottage, both free (the user's call, 2026-10-23: "why would they want to downgrade"), so a save
   without `houses` is read by housesOf() as that; no base, no houses. The first write (a buy, a move, a repaint) stores
   what it read.
   ============================================================ */

import { GYM_LEADERS } from './gym.js';
import { RING, mended, townState } from './towns.js';
import { MAX_LEVEL } from './difficulty.js';

/* Players see none of it until the user's playtest says go (as TOWNS_LIVE was): `?houses` shows it for a page load. */
export const HOUSES_LIVE = false;
const flag = () => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('houses'));
export const housesOpen = () => HOUSES_LIVE || flag() !== null;
/** `?houses=all` lends every earned house and puts the seasonal ones on sale for the page load (nothing is saved for it,
    though a move or buy made with it is). */
export const housesLent = () => flag() === 'all';

export const REPAINT_PRICE = 250;

export const TIERS = [
  { id: 'starter', name: 'Starter' },
  { id: 'homestead', name: 'Homestead' },
  { id: 'estate', name: 'Estate' },
  { id: 'earned', name: 'Earned' },
  { id: 'seasonal', name: 'Seasonal' },
  { id: 'legendary', name: 'Legendary' },
];

/* A house's paints are its eight looks (the user's ask, 2026-10-23: "many more paints"), the first what it's built in.
   The houses' colour keys are what their builders in js/hub-houses.js read, and `swatch` the two a catalogue swatch shows
   (roof and wall unless named); the tree's are its crown's (ancientArt() in js/hub-3d.js), the first exactly as it always
   was. */
export const HOUSES = [
  {
    id: 'tree', name: 'Ancient Tree', tier: 'starter', price: 0, how: 'Comes with the Secret Base',
    blurb: 'The old tree every Secret Base begins in, its door in the roots.',
    paints: [
      { name: 'Spring', lobe: ['#1c5a26', '#2e7c34'], shade: [['#a8e078', '#6cc058'], ['#7cc860', '#48a044'], ['#5aac4a', '#2e7c34'], ['#3a8a3a', '#1c5a26']], leaf: ['#c8f090', '#8ad468'], bloom: ['#ffffff', '#f8c8e0'] },
      { name: 'Autumn', lobe: ['#6a2a10', '#9a4418'], shade: [['#f8c860', '#e89a38'], ['#e8903a', '#c8642a'], ['#c86a2a', '#9a4418'], ['#9a4a20', '#6a2a10']], leaf: ['#ffe08a', '#f0a848'], bloom: ['#ffe0a0', '#fff4d0'] },
      { name: 'Twilight', lobe: ['#1c2a5a', '#2c4078'], shade: [['#a8c0f0', '#7a94d8'], ['#7a94d8', '#5a74b8'], ['#5a74b8', '#3a5a8a'], ['#3a5088', '#1c2a5a']], leaf: ['#d0dcff', '#9ab0e8'], bloom: ['#e0d0ff', '#ffffff'] },
      { name: 'Sakura', lobe: ['#8a3a5a', '#b05a7a'], shade: [['#ffe4ee', '#ffc4d8'], ['#ffc4d8', '#f09ab8'], ['#f09ab8', '#d0709a'], ['#c0608a', '#8a3a5a']], leaf: ['#fff0f6', '#ffd0e0'], bloom: ['#ffffff', '#fff0b0'] },
      { name: 'Golden', lobe: ['#7a5a10', '#a07a18'], shade: [['#fff0a0', '#f8d850'], ['#f8d850', '#e8b830'], ['#e0b030', '#b88a20'], ['#a88020', '#7a5a10']], leaf: ['#fff8c8', '#f8e070'], bloom: ['#ffffff', '#ffe8a0'] },
      { name: 'Crimson', lobe: ['#5a1018', '#8a1c24'], shade: [['#f87a6a', '#e84a40'], ['#e04a40', '#c02a2a'], ['#b02a28', '#8a1c24'], ['#801a20', '#5a1018']], leaf: ['#ffb0a0', '#f06a5a'], bloom: ['#ffe0a0', '#ffffff'] },
      { name: 'Frost', lobe: ['#4a6a80', '#6a8aa0'], shade: [['#ffffff', '#e8f4fc'], ['#e0eef8', '#c0d8ea'], ['#b0cce0', '#8aaac4'], ['#7a9ab4', '#4a6a80']], leaf: ['#ffffff', '#d8ecf8'], bloom: ['#ffffff', '#c8f0ff'] },
      { name: 'Haunter', lobe: ['#2a1440', '#44206a'], shade: [['#c8a0f0', '#a070e0'], ['#9a64d8', '#7a48b8'], ['#6c3ca8', '#522a88'], ['#4a2478', '#2a1440']], leaf: ['#e8d0ff', '#b890f0'], bloom: ['#ff7ab0', '#f8e0ff'] },
    ],
  },
  {
    id: 'cottage', name: 'Starter Cottage', tier: 'starter', price: 0, how: 'Comes with the Secret Base',
    blurb: 'A cream cottage under a gabled roof, shutters on its windows and a red mailbox by the gate.',
    paints: [
      { name: 'Pallet Red', roof: '#d24a3c', wall: '#f6f1e6', trim: '#ffffff', door: '#8a5a34' },
      { name: 'Cerulean Blue', roof: '#3a74c4', wall: '#f3f0e4', trim: '#ffffff', door: '#3a5a8a' },
      { name: 'Viridian Green', roof: '#3c8a52', wall: '#f1ead4', trim: '#ffffff', door: '#6a4a2a' },
      { name: 'Lavender Purple', roof: '#7a5aa8', wall: '#f2eef4', trim: '#ffffff', door: '#4a3a6a' },
      { name: 'Vermilion Orange', roof: '#e0782e', wall: '#fbf1e0', trim: '#ffffff', door: '#8a4a24' },
      { name: 'Saffron Yellow', roof: '#e8b830', wall: '#fff8e4', trim: '#ffffff', door: '#a0602a' },
      { name: 'Fuchsia Pink', roof: '#d0508a', wall: '#fbeef2', trim: '#ffffff', door: '#7a3a5a' },
      { name: 'Pewter Grey', roof: '#5c626e', wall: '#e8e6e0', trim: '#ffffff', door: '#3a3e48' },
    ],
  },
  {
    id: 'cabin', name: 'Log Cabin', tier: 'homestead', price: 1500, how: '1,500 PokéCoins',
    blurb: 'Round logs notched at the corners, a stone chimney, a porch lamp and a stack of firewood.',
    paints: [
      { name: 'Pine', wall: '#a26a3a', roof: '#3f7a4a', trim: '#efe0bc', door: '#5a3a20' },
      { name: 'Redwood', wall: '#8f4a32', roof: '#4a4a52', trim: '#efe0bc', door: '#5a3a20' },
      { name: 'Birch', wall: '#d2b48a', roof: '#a8452f', trim: '#efe0bc', door: '#6a4a2a' },
      { name: 'Cedar', wall: '#b8784a', roof: '#6a4a3a', trim: '#f4e4c4', door: '#4a2a18' },
      { name: 'Ebony', wall: '#5a4436', roof: '#2e3036', trim: '#e8d8b8', door: '#a8452f' },
      { name: 'Maple', wall: '#c08a52', roof: '#d0662a', trim: '#f6e8c8', door: '#6a3a1a' },
      { name: 'Snowcap', wall: '#e2d6c2', roof: '#4a6a9a', trim: '#ffffff', door: '#8a3a2a' },
      { name: 'Mossy', wall: '#8a8a62', roof: '#5a7a3a', trim: '#ece2c4', door: '#4a3a24' },
    ],
  },
  {
    id: 'bungalow', name: 'Seaside Bungalow', tier: 'homestead', price: 1500, how: '1,500 PokéCoins',
    blurb: 'A clapboard bungalow on a boardwalk deck, porthole windows, a life ring by the door and a palm.',
    paints: [
      { name: 'Lagoon', wall: '#a9d4e8', roof: '#356aa3', trim: '#ffffff', door: '#f0c45a' },
      { name: 'Coral', wall: '#f6c6b4', roof: '#e0705a', trim: '#ffffff', door: '#4aa0b0' },
      { name: 'Sandbar', wall: '#f2e2b8', roof: '#4c8a7a', trim: '#ffffff', door: '#d8603e' },
      { name: 'Seafoam', wall: '#c8eedc', roof: '#3a9a8a', trim: '#ffffff', door: '#e8803a' },
      { name: 'Sunset', wall: '#f8d8a8', roof: '#d8503e', trim: '#ffffff', door: '#5a6ab0' },
      { name: 'Starfish', wall: '#fbe89a', roof: '#e88a3a', trim: '#ffffff', door: '#3a8ab0' },
      { name: 'Driftwood', wall: '#d8cbb4', roof: '#6a7078', trim: '#ffffff', door: '#4a8a9a' },
      { name: 'Deep Sea', wall: '#5a7aa8', roof: '#24345a', trim: '#ffffff', door: '#f0c45a' },
    ],
  },
  {
    id: 'mushroom', name: 'Mushroom Cottage', tier: 'homestead', price: 2000, how: '2,000 PokéCoins', swatch: ['cap', 'spot'],
    blurb: 'A round house in a giant mushroom\'s stalk, its spotted cap for a roof and a stovepipe out the top.',
    paints: [
      { name: 'Shroomish Red', cap: '#d8443a', spot: '#fff6e8', wall: '#f2e2c4', door: '#8a5a34' },
      { name: 'Breloom Green', cap: '#4f9a4a', spot: '#f4f0c8', wall: '#f2e2c4', door: '#8a5a34' },
      { name: 'Amoonguss Pink', cap: '#c95a9a', spot: '#f8e8f4', wall: '#f4e6d4', door: '#5a3a5a' },
      { name: 'Paras Orange', cap: '#e8823a', spot: '#fff0c0', wall: '#f6e6c8', door: '#8a4a24' },
      { name: 'Morelull Blue', cap: '#5a8ad8', spot: '#e8f4ff', wall: '#f0ecf4', door: '#4a4a8a' },
      { name: 'Toedscool Gold', cap: '#e8c040', spot: '#fffbe8', wall: '#f0e4c8', door: '#7a5a2a' },
      { name: 'Cocoa Button', cap: '#9a6a40', spot: '#f4e2c4', wall: '#f2e4cc', door: '#5a3a20' },
      { name: 'Midnight Glow', cap: '#3a3a7a', spot: '#a8f0ff', wall: '#e4e0ec', door: '#2a2a50' },
    ],
  },
  {
    id: 'barn', name: 'Red Barn', tier: 'homestead', price: 2000, how: '2,000 PokéCoins',
    blurb: 'A gambrel barn, its big doors slid open under the hayloft, a silo beside it and a rooster on top.',
    paints: [
      { name: 'Barn Red', wall: '#c0392b', roof: '#5b5f66', trim: '#ffffff', door: '#a52f24' },
      { name: 'Moomoo Cream', wall: '#efe0bc', roof: '#7a4a32', trim: '#7a4a32', door: '#d8b880' },
      { name: 'Weathered', wall: '#8a7a6a', roof: '#4a4a4a', trim: '#ffffff', door: '#6a5a4a' },
      { name: 'Tauros Brown', wall: '#8a5232', roof: '#3a3a40', trim: '#f4e8d0', door: '#6a3a20' },
      { name: 'Sage', wall: '#8aa080', roof: '#4a4a44', trim: '#ffffff', door: '#6a8060' },
      { name: 'Prairie Yellow', wall: '#e0b84a', roof: '#6a4a32', trim: '#ffffff', door: '#c0392b' },
      { name: 'Slate Blue', wall: '#4a6a8a', roof: '#3a3e46', trim: '#ffffff', door: '#3a5470' },
      { name: 'Midnight Black', wall: '#34363c', roof: '#202226', trim: '#ffffff', door: '#c0392b' },
    ],
  },
  {
    id: 'treehouse', name: 'Treehouse', tier: 'homestead', price: 2000, how: '2,000 PokéCoins', swatch: ['leaf', 'wall'],
    blurb: 'A plank cabin up on a deck round a great trunk, a rope ladder down, its door in the roots and a crown of leaves over it.',
    paints: [
      { name: 'Oak Grove', wall: '#a8784a', roof: '#7a3a2a', trim: '#efe0bc', door: '#5a3a20', bark: '#6a4a32', leaf: '#4f9a3e', leaf2: '#7cc04e' },
      { name: 'Maple Fall', wall: '#b07a4a', roof: '#5a4a3a', trim: '#f4e4c4', door: '#6a3a1a', bark: '#5a3e2a', leaf: '#d8602a', leaf2: '#f0a038' },
      { name: 'Blossom', wall: '#9a6a48', roof: '#4a3a4a', trim: '#ffffff', door: '#5a3a3a', bark: '#5a4038', leaf: '#f0a0c0', leaf2: '#ffd0e0' },
      { name: 'Pine Ridge', wall: '#8a5a3a', roof: '#3f6a4a', trim: '#e8dcc0', door: '#4a2a18', bark: '#4a3424', leaf: '#2f6a3e', leaf2: '#4a8a4a' },
      { name: 'Golden Leaf', wall: '#c09060', roof: '#a8452f', trim: '#fff4dc', door: '#6a4a2a', bark: '#6a4a30', leaf: '#e0b030', leaf2: '#f8d860' },
      { name: 'Mossy', wall: '#7a6a4a', roof: '#5a7a3a', trim: '#ece2c4', door: '#4a3a24', bark: '#5a4a34', leaf: '#5a8a3a', leaf2: '#8ab04a' },
      { name: 'Twilight', wall: '#6a5a6a', roof: '#3a3a5a', trim: '#e0dcf0', door: '#2a2a4a', bark: '#4a3a44', leaf: '#5a6ab0', leaf2: '#8a9ad8' },
      { name: 'Snowy Bough', wall: '#a89070', roof: '#4a6a9a', trim: '#ffffff', door: '#8a3a2a', bark: '#5a4638', leaf: '#dfe8ee', leaf2: '#ffffff' },
    ],
  },
  {
    id: 'windmill', name: 'Windmill Farmhouse', tier: 'homestead', price: 1800, how: '1,800 PokéCoins', swatch: ['roof', 'sail'],
    blurb: 'A whitewashed farmhouse under a steep roof, a windmill tower joined to it with four lattice sails, and sunflowers by the wall.',
    paints: [
      { name: 'Meadow', wall: '#f4ecd8', roof: '#b0503a', trim: '#ffffff', door: '#3f6a4a', sail: '#f0e6cc' },
      { name: 'Tulip', wall: '#fbf0e4', roof: '#d24a6a', trim: '#ffffff', door: '#3a5a8a', sail: '#ffffff' },
      { name: 'Clover', wall: '#eef0dc', roof: '#3c8a52', trim: '#ffffff', door: '#8a5a34', sail: '#f4ecd8' },
      { name: 'Harvest', wall: '#f2dcb0', roof: '#8a5232', trim: '#fff4dc', door: '#6a3a20', sail: '#e8c070' },
      { name: 'Delft Blue', wall: '#f4f4f0', roof: '#2f5f9a', trim: '#ffffff', door: '#2f5f9a', sail: '#dfe8f4' },
      { name: 'Lavender Field', wall: '#f2eef4', roof: '#7a5aa8', trim: '#ffffff', door: '#4a3a6a', sail: '#e8e0f0' },
      { name: 'Sunflower', wall: '#fff4cc', roof: '#e0a020', trim: '#ffffff', door: '#6a4a2a', sail: '#fffaf0' },
      { name: 'Stormy', wall: '#c8ccd0', roof: '#4a4e58', trim: '#ffffff', door: '#8a3a2a', sail: '#a8b0b8' },
    ],
  },
  {
    id: 'machiya', name: 'Machiya Townhouse', tier: 'estate', price: 5000, how: '5,000 PokéCoins', swatch: ['noren', 'plaster'],
    blurb: 'A Kyoto townhouse: lit timber lattice, a tiled roof over each storey, a noren and paper lanterns.',
    paints: [
      { name: 'Lantern Night', wall: '#5a3b28', plaster: '#f1ead9', roof: '#4a5160', noren: '#2c3e7a' },
      { name: 'Cherry', wall: '#6a3a2a', plaster: '#f1ead9', roof: '#3a3a40', noren: '#c0405a' },
      { name: 'Bamboo', wall: '#7a6a3a', plaster: '#ece6c8', roof: '#3f5a4a', noren: '#3a7a5a' },
      { name: 'Persimmon', wall: '#5a3b28', plaster: '#f4ead4', roof: '#4a5160', noren: '#e0702a' },
      { name: 'Matcha', wall: '#4a4030', plaster: '#e4e8c8', roof: '#3f4a40', noren: '#6a8a3a' },
      { name: 'Plum', wall: '#4a2a2a', plaster: '#f2e8e4', roof: '#3a3440', noren: '#7a3a6a' },
      { name: 'Wisteria', wall: '#4a3a3a', plaster: '#f0ecf4', roof: '#4a4a5a', noren: '#8a7ad0' },
      { name: 'Snow Tile', wall: '#3a2a20', plaster: '#ffffff', roof: '#7a808c', noren: '#2a2a2a' },
    ],
  },
  {
    id: 'lighthouse', name: 'Lighthouse Cottage', tier: 'estate', price: 6000, how: '6,000 PokéCoins', swatch: ['stripe', 'wall'],
    blurb: 'A keeper\'s cottage joined to a striped lighthouse, its lamp lit after dark, an anchor by the step.',
    paints: [
      { name: 'Olivine', wall: '#fffaf0', roof: '#2f5f8f', stripe: '#d8443a', trim: '#ffffff', door: '#2f5f8f' },
      { name: 'Harbour Green', wall: '#fffaf0', roof: '#2f6a52', stripe: '#2f6a52', trim: '#ffffff', door: '#2f6a52' },
      { name: 'Midnight', wall: '#e8e6f0', roof: '#2c2c48', stripe: '#2c2c48', trim: '#ffffff', door: '#c8a040' },
      { name: 'Cerulean Cape', wall: '#fffaf0', roof: '#3a74c4', stripe: '#3a74c4', trim: '#ffffff', door: '#d8443a' },
      { name: 'Sunset Orange', wall: '#fff6ea', roof: '#5a4a6a', stripe: '#e8803a', trim: '#ffffff', door: '#5a4a6a' },
      { name: 'Mossdeep', wall: '#f4f8f4', roof: '#2a5a5a', stripe: '#3a9a8a', trim: '#ffffff', door: '#2a5a5a' },
      { name: 'Black Band', wall: '#f8f6f0', roof: '#2a2a30', stripe: '#2a2a30', trim: '#ffffff', door: '#d8443a' },
      { name: 'Lemon', wall: '#fffaf0', roof: '#3a5a8a', stripe: '#e8c040', trim: '#ffffff', door: '#3a5a8a' },
    ],
  },
  {
    id: 'glasshouse', name: 'Glasshouse Villa', tier: 'estate', price: 6000, how: '6,000 PokéCoins',
    blurb: 'A stone villa under a tiled roof, a balcony over the door and a glass conservatory full of plants.',
    paints: [
      { name: 'Lavender', wall: '#ddcfb6', roof: '#6b4e8a', trim: '#f7f7f2', door: '#3f6b4a' },
      { name: 'Terracotta', wall: '#ddcfb6', roof: '#b45a3a', trim: '#f7f7f2', door: '#4a5a7a' },
      { name: 'Slate', wall: '#c8ccd0', roof: '#3a4a5a', trim: '#f7f7f2', door: '#8a3a3a' },
      { name: 'Rose', wall: '#e6d4c8', roof: '#b05a72', trim: '#f7f7f2', door: '#5a6a4a' },
      { name: 'Ivy', wall: '#d4d0b8', roof: '#3a6a3a', trim: '#f7f7f2', door: '#7a4a2a' },
      { name: 'Sandstone', wall: '#e8cc98', roof: '#a0522d', trim: '#fffaf0', door: '#3a5a7a' },
      { name: 'Azure', wall: '#f2eee4', roof: '#2a6aa8', trim: '#ffffff', door: '#2a6aa8' },
      { name: 'Charcoal', wall: '#9a9a98', roof: '#2a2a2e', trim: '#f2f2ee', door: '#b8862a' },
    ],
  },
  {
    id: 'victorian', name: 'Victorian Manor', tier: 'estate', price: 8000, how: '8,000 PokéCoins',
    blurb: 'A turreted manor: a spired tower, a fish-scale gable, a bay window and a porch on white columns.',
    paints: [
      { name: 'Lavender Town', wall: '#7b5ea7', roof: '#3c3350', trim: '#f4ead8', door: '#b34a58' },
      { name: 'Robin Egg', wall: '#8cc6c4', roof: '#4a4a5a', trim: '#f4ead8', door: '#c04a5a' },
      { name: 'Butter', wall: '#f0d890', roof: '#6a3a3a', trim: '#f4ead8', door: '#3a5a7a' },
      { name: 'Rose Garden', wall: '#e8a0b0', roof: '#5a3a4a', trim: '#fff6ee', door: '#5a3a4a' },
      { name: 'Sage Manor', wall: '#9ab08a', roof: '#3a4a3a', trim: '#f4ead8', door: '#8a3a2a' },
      { name: 'Painted Lady', wall: '#f0a070', roof: '#4a3a5a', trim: '#fff6ee', door: '#3a6a7a' },
      { name: 'Ivory', wall: '#f2ecd8', roof: '#3a4a6a', trim: '#ffffff', door: '#3a4a6a' },
      { name: 'Gothic', wall: '#44444e', roof: '#1e1e26', trim: '#c8b8a0', door: '#8a2a3a' },
    ],
  },
  {
    id: 'riad', name: 'Desert Riad', tier: 'estate', price: 6500, how: '6,500 PokéCoins', swatch: ['dome', 'wall'],
    blurb: 'Sunwell Bazaar\'s style: two storeys of adobe, a tiled horseshoe arch, carved screens, a domed tower on the roof and a palm.',
    paints: [
      { name: 'Sunwell', wall: '#e8c49a', dome: '#2f8a8a', tile: '#2a6aa8', trim: '#f8eedc', door: '#8a4a24' },
      { name: 'Desert Rose', wall: '#e0a08a', dome: '#3a6a4a', tile: '#2a8a7a', trim: '#f8e8dc', door: '#6a3a2a' },
      { name: 'Saffron', wall: '#f0c870', dome: '#b0503a', tile: '#2a5aa8', trim: '#fff4dc', door: '#5a3a20' },
      { name: 'Oasis', wall: '#f4e4c8', dome: '#3a9ab0', tile: '#2f9a8a', trim: '#ffffff', door: '#3a6a8a' },
      { name: 'Indigo Night', wall: '#4a5a9a', dome: '#e8c040', tile: '#e8e0c8', trim: '#f0ecf4', door: '#2a2a48' },
      { name: 'Blue City', wall: '#7aa8d8', dome: '#ffffff', tile: '#2a5aa8', trim: '#ffffff', door: '#2a4a8a' },
      { name: 'Dune', wall: '#d8b080', dome: '#a0703a', tile: '#7a4a2a', trim: '#f4e4c8', door: '#5a3a20' },
      { name: 'Moonlit', wall: '#c8c0d0', dome: '#4a3a7a', tile: '#7a5ab0', trim: '#f0ecf4', door: '#3a2a4a' },
    ],
  },
  {
    id: 'pagoda', name: 'Lantern Pagoda', tier: 'estate', price: 7000, how: '7,000 PokéCoins', swatch: ['roof', 'wall'],
    blurb: 'Lantern Village\'s style: three storeys under sweeping tiled roofs, red columns, lit shoji and a lantern at every eave.',
    paints: [
      { name: 'Lantern Red', wall: '#b8322a', plaster: '#f4ead4', roof: '#3a3e48', lantern: '#ff7a3a', door: '#5a2a1a' },
      { name: 'Jade', wall: '#2f7a5a', plaster: '#f0ecd8', roof: '#3a4a40', lantern: '#ffd060', door: '#2a4a3a' },
      { name: 'Imperial Gold', wall: '#c8902a', plaster: '#fff4dc', roof: '#7a2a24', lantern: '#ffcf60', door: '#5a3a14' },
      { name: 'Vermilion', wall: '#e0502a', plaster: '#ffffff', roof: '#2e3038', lantern: '#ff9a4a', door: '#4a2a1a' },
      { name: 'Plum Blossom', wall: '#8a3a6a', plaster: '#f6eef2', roof: '#3a3440', lantern: '#ff8ac0', door: '#4a2a3a' },
      { name: 'Night Market', wall: '#3a2a3a', plaster: '#e8dcc8', roof: '#1e2028', lantern: '#ff5a4a', door: '#2a1a1a' },
      { name: 'Celadon', wall: '#6aa094', plaster: '#f2f4ec', roof: '#4a5a5a', lantern: '#ffe08a', door: '#3a4a48' },
      { name: 'Ivory', wall: '#e8e0cc', plaster: '#ffffff', roof: '#7a2a2a', lantern: '#ffb05a', door: '#7a2a2a' },
    ],
  },
  {
    id: 'gymhall', name: 'Gym Hall', tier: 'earned', price: null, earn: 'gyms', how: 'Beat every Gym Leader',
    blurb: 'A Gym of your own: a columned hall under a red roof, a Poké Ball crest over the door and banners either side.',
    paints: [
      { name: 'Champion Red', wall: '#ece6da', roof: '#c0392b', trim: '#ffffff', door: '#3a3f4a', banner: '#c0392b' },
      { name: 'Ace Blue', wall: '#ece6da', roof: '#2f5fa8', trim: '#ffffff', door: '#3a3f4a', banner: '#2f5fa8' },
      { name: 'Elite Gold', wall: '#f2ead0', roof: '#b8862a', trim: '#ffffff', door: '#4a3a24', banner: '#b8862a' },
      { name: 'Indigo Plateau', wall: '#e6e2ee', roof: '#4a3a8a', trim: '#ffffff', door: '#2a2a48', banner: '#4a3a8a' },
      { name: 'Thunder Yellow', wall: '#f0ead8', roof: '#e0a820', trim: '#ffffff', door: '#3a3f4a', banner: '#2a2a2a' },
      { name: 'Volcano', wall: '#e8d8c8', roof: '#8a2a1a', trim: '#f8f0e8', door: '#3a2a24', banner: '#e0702a' },
      { name: 'Marble', wall: '#f4f2ee', roof: '#5a5e68', trim: '#ffffff', door: '#2a2e38', banner: '#c0392b' },
      { name: 'Emerald', wall: '#eaeee2', roof: '#2f7a4a', trim: '#ffffff', door: '#2a3a2e', banner: '#2f7a4a' },
    ],
  },
  {
    id: 'ryokan', name: 'Hot-Spring Ryokan', tier: 'earned', price: null, earn: 'waystones', how: 'Mend every town\'s Waystone', swatch: ['roof', 'noren'],
    blurb: 'An inn of dark timber and plaster under a tiled roof, a ♨ noren in the door and a steaming spring beside it.',
    paints: [
      { name: 'Cinder', plaster: '#efe4cc', wall: '#7a4a2e', roof: '#3e3a36', noren: '#b23a3a' },
      { name: 'Moss', plaster: '#efe4cc', wall: '#7a4a2e', roof: '#3a5040', noren: '#2c5a7a' },
      { name: 'Ember', plaster: '#efe4cc', wall: '#5a2a1e', roof: '#5a2a24', noren: '#2a2a2a' },
      { name: 'Sakura', plaster: '#f4ebe4', wall: '#6a3a2e', roof: '#45404a', noren: '#e07a9a' },
      { name: 'Indigo', plaster: '#ece8dc', wall: '#5a4030', roof: '#3a3e4a', noren: '#2a3a6a' },
      { name: 'Bamboo', plaster: '#ece6c8', wall: '#6a5a30', roof: '#3f4a3a', noren: '#4a7a3a' },
      { name: 'Snowfall', plaster: '#ffffff', wall: '#4a3a2e', roof: '#6a7280', noren: '#3a4a6a' },
      { name: 'Lantern', plaster: '#f4e8cc', wall: '#4a2a1a', roof: '#3a3430', noren: '#e0802a' },
    ],
  },
  {
    id: 'lodge', name: 'Ranger Lodge', tier: 'earned', price: null, earn: 'safari', how: 'Catch every Pokémon in the Safari Pokédex',
    blurb: 'A tall A-frame of timber on a stone footing, its whole front a lit window, a ranger\'s flag on its pole.',
    paints: [
      { name: 'Safari', wall: '#7a5232', roof: '#4c6b3a', trim: '#f0e2c0', door: '#5a3a20' },
      { name: 'Desert', wall: '#8a5a32', roof: '#b07a3a', trim: '#f4e6c8', door: '#5a3a20' },
      { name: 'Tundra', wall: '#6a5a4a', roof: '#5a6a7a', trim: '#eef0f0', door: '#3a4a5a' },
      { name: 'Jungle', wall: '#5a3a22', roof: '#2f6a3a', trim: '#e8dcb0', door: '#3a2a14' },
      { name: 'Marsh', wall: '#6a6040', roof: '#5a7a5a', trim: '#ece4c4', door: '#4a4028' },
      { name: 'Canyon', wall: '#8a5a3a', roof: '#a0482a', trim: '#f6e2c4', door: '#5a2a1a' },
      { name: 'Midnight', wall: '#4a3a30', roof: '#2a3448', trim: '#e4dcc8', door: '#2a2420' },
      { name: 'Birch', wall: '#c8b490', roof: '#6a8a4a', trim: '#ffffff', door: '#6a4a2a' },
    ],
  },
  {
    id: 'spire', name: 'Sky Spire', tier: 'earned', price: null, earn: 'summit', how: 'Reach the top of the Sky Pillar',
    blurb: 'A stone tower like the Sky Pillar\'s, banded and battlemented, a pennant on top and little isles of rock about it.',
    paints: [
      { name: 'Rayquaza', wall: '#aab2a2', roof: '#3e8a5c', trim: '#d8d2bf', door: '#5a4a3a' },
      { name: 'Dawn', wall: '#c8bca8', roof: '#c0605a', trim: '#e8dcc8', door: '#5a3a3a' },
      { name: 'Storm', wall: '#8a8e98', roof: '#5a5aa8', trim: '#c8ccd8', door: '#3a3a5a' },
      { name: 'Sandstone', wall: '#d8c098', roof: '#b0703a', trim: '#f0e0c0', door: '#6a4a2a' },
      { name: 'Obsidian', wall: '#5a5a64', roof: '#8a3aa8', trim: '#9a9aa8', door: '#2a2a32' },
      { name: 'Cloud', wall: '#e8ecf0', roof: '#4a8ad8', trim: '#ffffff', door: '#3a5a8a' },
      { name: 'Mossy', wall: '#8a9a7a', roof: '#4a6a3a', trim: '#c8d0b8', door: '#4a3a2a' },
      { name: 'Shiny', wall: '#4a4a52', roof: '#e8c040', trim: '#7a7a84', door: '#2a2a30' },
    ],
  },
  {
    id: 'balldome', name: 'Poké Ball Dome', tier: 'earned', price: null, earn: 'master', how: 'Earn the Master Badge', swatch: ['top', 'bottom'],
    blurb: 'One round house shaped like a Poké Ball, its button the front door and an aerial on top.',
    paints: [
      { name: 'Poké Ball', top: '#e04040', bottom: '#f6f6f6', band: '#2a2a2a', mark: '#e04040', door: '#f6f6f6' },
      { name: 'Great Ball', top: '#3a74d0', bottom: '#f6f6f6', band: '#2a2a2a', mark: '#e04040', door: '#f6f6f6' },
      { name: 'Ultra Ball', top: '#2a2a2a', bottom: '#f6f6f6', band: '#2a2a2a', mark: '#f0c040', door: '#f6f6f6' },
      { name: 'Master Ball', top: '#7a3ab0', bottom: '#f6f6f6', band: '#2a2a2a', mark: '#e870b8', door: '#f6f6f6' },
      { name: 'Premier Ball', top: '#f6f6f6', bottom: '#f6f6f6', band: '#d84040', mark: '#f6f6f6', door: '#f6f6f6' },
      { name: 'Safari Ball', top: '#5a8a3a', bottom: '#e8e0c0', band: '#3a3a2a', mark: '#3a5a24', door: '#e8e0c0' },
      { name: 'Luxury Ball', top: '#2a2a2a', bottom: '#2a2a2a', band: '#e8c040', mark: '#d84040', door: '#f6f6f6' },
      { name: 'Dusk Ball', top: '#2a3a2a', bottom: '#3a3a3a', band: '#1a1a1a', mark: '#e8802a', door: '#f6f6f6' },
    ],
  },
  {
    id: 'keep', name: 'Champion\'s Keep', tier: 'earned', price: null, earn: 'champion', how: 'Win a run on Trainer Level 10', swatch: ['roof', 'banner'],
    blurb: 'A stone keep with battlements, two round towers, a gatehouse arch, a champion\'s banner with a gold crown and a flag on top.',
    paints: [
      { name: 'Champion', wall: '#c8c2b4', roof: '#2f4f9a', banner: '#c0392b', trim: '#e8c040', door: '#5a3a24' },
      { name: 'Royal Purple', wall: '#cfc8d4', roof: '#5a2a8a', banner: '#7a3ab0', trim: '#f0d060', door: '#3a2a3a' },
      { name: 'Crimson Crown', wall: '#b8b0a4', roof: '#8a1c24', banner: '#e8c040', trim: '#e8c040', door: '#3a2420' },
      { name: 'Dragon', wall: '#9aa098', roof: '#2f6a4a', banner: '#2f6a4a', trim: '#e8c040', door: '#2a3a2e' },
      { name: 'Ice Fortress', wall: '#e2e8f0', roof: '#5a8ad8', banner: '#a8d8ff', trim: '#ffffff', door: '#3a5a8a' },
      { name: 'Obsidian', wall: '#4a4a52', roof: '#2a2a30', banner: '#8a3aa8', trim: '#c8c8d0', door: '#1a1a20' },
      { name: 'Sandstone', wall: '#e0c090', roof: '#a0482a', banner: '#2a5aa8', trim: '#f0d060', door: '#5a3a20' },
      { name: 'White Marble', wall: '#f4f2ee', roof: '#c0392b', banner: '#2f4f9a', trim: '#e8c040', door: '#3a3f4a' },
    ],
  },
  {
    id: 'observatory', name: 'Stargazer Observatory', tier: 'earned', price: null, earn: 'pokedex', how: 'Complete the research of every Pokédex entry', swatch: ['dome', 'wall'],
    blurb: 'A round stone drum under a metal dome, its shutter open on a great telescope, a gold star on top and a little scope in the yard.',
    paints: [
      { name: 'Starlight', wall: '#e8e2d4', dome: '#c8d0d8', trim: '#ffffff', door: '#2a3a6a', star: '#ffd84a' },
      { name: 'Copper', wall: '#d8c8b0', dome: '#b8703a', trim: '#f4ecdc', door: '#5a3a20', star: '#ffd84a' },
      { name: 'Verdigris', wall: '#e0dccc', dome: '#5aa08a', trim: '#ffffff', door: '#3a4a40', star: '#ffe08a' },
      { name: 'Nebula', wall: '#5a4a80', dome: '#8a5ad0', trim: '#c8b8f0', door: '#2a2040', star: '#ff8ad8' },
      { name: 'Lunar', wall: '#d0d0d8', dome: '#f4f4f8', trim: '#ffffff', door: '#4a4a5a', star: '#a8d8ff' },
      { name: 'Comet Blue', wall: '#e8eef4', dome: '#2a5aa8', trim: '#ffffff', door: '#2a3a5a', star: '#8ad8ff' },
      { name: 'Solar', wall: '#f4e4c8', dome: '#e8a030', trim: '#fff4dc', door: '#8a4a24', star: '#ff6a3a' },
      { name: 'Midnight', wall: '#3a3e54', dome: '#4a5070', trim: '#8a90b0', door: '#1a1c2a', star: '#ffe08a' },
    ],
  },
  {
    id: 'teahouse', name: 'Cherry Blossom Teahouse', tier: 'seasonal', price: 3000, season: 4, how: 'Sold in April · 3,000 PokéCoins', swatch: ['blossom', 'roof'],
    blurb: 'A little teahouse of timber and plaster on a raised veranda, lit shoji, a tiled roof and a cherry tree in bloom beside it.',
    paints: [
      { name: 'Sakura', wall: '#6a3a2a', roof: '#45404a', plaster: '#f4ebe4', blossom: '#f6b0c8', door: '#5a3a2a' },
      { name: 'Yoshino White', wall: '#5a4030', roof: '#3a3e4a', plaster: '#f8f4ee', blossom: '#fde8ee', door: '#4a3a2a' },
      { name: 'Weeping Pink', wall: '#7a4a3a', roof: '#3a3440', plaster: '#f4e8e4', blossom: '#e880a8', door: '#5a2a3a' },
      { name: 'Plum', wall: '#4a2a2a', roof: '#2e2a34', plaster: '#f2e8e4', blossom: '#c04a7a', door: '#3a1a24' },
      { name: 'Moss Garden', wall: '#5a4a30', roof: '#3f4a3a', plaster: '#ece6c8', blossom: '#f0b8c8', door: '#3a3a24' },
      { name: 'Twilight', wall: '#3a3040', roof: '#2a2a3a', plaster: '#e8e4f0', blossom: '#c8a0e8', door: '#2a2030' },
      { name: 'Peach', wall: '#8a5a3a', roof: '#5a4a40', plaster: '#fbf0e4', blossom: '#f8b890', door: '#6a3a24' },
      { name: 'Snow Petal', wall: '#4a3a2e', roof: '#6a7280', plaster: '#ffffff', blossom: '#ffffff', door: '#3a2a24' },
    ],
  },
  {
    id: 'chateau', name: 'Haunted Chateau', tier: 'seasonal', price: 3000, season: 10, how: 'Sold in October · 3,000 PokéCoins',
    blurb: 'A crooked chateau with two spired towers, ghost-lit windows, jack-o\'-lanterns on the step and a dead tree.',
    paints: [
      { name: 'Lavender Gloom', wall: '#5b5a6e', roof: '#2b2838', trim: '#8e86a8', door: '#3a2a24', glow: '#c49aff' },
      { name: 'Pumpkin', wall: '#5a4a3a', roof: '#2a2420', trim: '#e88a3a', door: '#3a2a1a', glow: '#ffb04a' },
      { name: 'Bone', wall: '#9a948a', roof: '#3a3238', trim: '#d8d0c0', door: '#3a2a24', glow: '#a0ffb0' },
      { name: 'Gengar', wall: '#5a4a7a', roof: '#2a1a3a', trim: '#e05a7a', door: '#2a1a2a', glow: '#ff6aa0' },
      { name: 'Moss', wall: '#4a5a4a', roof: '#24302a', trim: '#8aa07a', door: '#2a2a1a', glow: '#c8ff8a' },
      { name: 'Blood Moon', wall: '#5a3a3a', roof: '#2a1418', trim: '#b04a4a', door: '#2a1414', glow: '#ff6a5a' },
      { name: 'Ash', wall: '#6a6a6a', roof: '#262628', trim: '#b8b8b8', door: '#2a2a2a', glow: '#a8e0ff' },
      { name: 'Midnight', wall: '#3a3e5a', roof: '#1a1c2a', trim: '#7a8ab0', door: '#1e2030', glow: '#ffe08a' },
    ],
  },
  {
    id: 'chalet', name: 'Snow Chalet', tier: 'seasonal', price: 3000, season: 12, how: 'Sold in December · 3,000 PokéCoins',
    blurb: 'A pine chalet under a snowy roof, a carved balcony, icicles on the eaves and a snowman by the door.',
    paints: [
      { name: 'Alpine', wall: '#8a5a36', roof: '#6a3a2a', trim: '#f2e6d0', door: '#b23a3a' },
      { name: 'Spruce', wall: '#8a5a36', roof: '#2f5a3a', trim: '#f2e6d0', door: '#2f5a3a' },
      { name: 'Frost', wall: '#c8b8a0', roof: '#3a4a6a', trim: '#ffffff', door: '#3a4a6a' },
      { name: 'Cocoa', wall: '#6a4028', roof: '#3a2a20', trim: '#f2e6d0', door: '#d8a040' },
      { name: 'Cranberry', wall: '#9a6a40', roof: '#8a2a30', trim: '#f6ecd8', door: '#2f5a3a' },
      { name: 'Glacier', wall: '#a8b8c8', roof: '#2a4a6a', trim: '#ffffff', door: '#c04040' },
      { name: 'Gingerbread', wall: '#b8763a', roof: '#7a4a2a', trim: '#ffffff', door: '#c04040' },
      { name: 'Aurora', wall: '#6a5a7a', roof: '#2a5a6a', trim: '#e8f0f0', door: '#3ab090' },
    ],
  },
  {
    id: 'crystal', name: 'Crystal Palace', tier: 'legendary', price: null, earn: 'eternatus', how: 'Beat Eternatus in the Crystal Depths', swatch: ['crystal', 'crystal2'],
    blurb: 'A hall of white stone grown through with glowing crystal spires, the tallest over the door.',
    paints: [
      { name: 'Amethyst', wall: '#e6e0f2', crystal: '#9b6bd8', crystal2: '#5fd4e6', door: '#3a2a5a' },
      { name: 'Rose Quartz', wall: '#f2e4ea', crystal: '#e07ab0', crystal2: '#ffd0e8', door: '#5a2a44' },
      { name: 'Emerald', wall: '#e2eee6', crystal: '#3aa878', crystal2: '#b8f0d0', door: '#1e4a34' },
      { name: 'Sapphire', wall: '#e2e8f4', crystal: '#3a6ad8', crystal2: '#a8d8ff', door: '#1e2e5a' },
      { name: 'Citrine', wall: '#f4eedc', crystal: '#e8b030', crystal2: '#fff0b0', door: '#5a4018' },
      { name: 'Ruby', wall: '#f2e2e2', crystal: '#d0303a', crystal2: '#ffb0a0', door: '#4a1418' },
      { name: 'Onyx', wall: '#c8c8d0', crystal: '#3a3a4a', crystal2: '#a8a8c8', door: '#1a1a24' },
      { name: 'Diamond', wall: '#f4f6fa', crystal: '#a8d0f0', crystal2: '#dff2ff', door: '#3a4a6a' },
    ],
  },
];
export const HOUSES_BY_ID = Object.fromEntries(HOUSES.map(h => [h.id, h]));

const hasBase = (save) => !!save?.baseOwned;
/** The houses every Secret Base comes with, the first the one moved into. */
export const FREE = ['tree', 'cottage'];

const badge = (save, id) => (save?.badges || []).includes(id);
/** What earns each earned house (a house's `earn`), read from what the save already keeps, so an old save has on day
    one every house it can prove. Once seen it's stored in `houses.owned` (claimEarned()), so it stays earned if a test
    ever changes (a new Gym Leader, a new Safari page). */
export const EARN = {
  gyms: (save) => GYM_LEADERS.every(l => (save.gym?.[l.id] || 0) >= 1),
  waystones: (save) => RING.every(t => mended(townState(save, t.id))),
  safari: (save) => !!save.safariDex?.complete || badge(save, 'safari-master'),
  summit: (save) => (save.tower?.bestEver || 0) >= 100 || (save.tower?.summits || 0) > 0 || badge(save, 'tower-100'),
  master: (save) => badge(save, 'master'),
  champion: (save) => Object.values(save.stats?.maxLevelWinByType || {}).some(n => n >= MAX_LEVEL),
  pokedex: (save) => !!save.dex?.complete || badge(save, 'pokedex'),
  eternatus: (save) => badge(save, 'depths') || (save.feats || []).includes('eternatus') || !!save.stats?.bossesDefeated?.[4],
};
/** What a letter says the trainer did, by a house's `earn`. */
export const EARN_DID = {
  gyms: 'beat every Gym Leader', waystones: 'mended every town\'s Waystone', safari: 'caught every Pokémon in the Safari Pokédex',
  summit: 'reached the top of the Sky Pillar', champion: 'won a run on Trainer Level 10', pokedex: 'researched every Pokédex entry', master: 'earned the Master Badge', eternatus: 'beat Eternatus in the Crystal Depths',
};
/** How far along a save is to an earned house, where it counts: [done, of], or null. */
export function earnProgress(save, earn) {
  if (earn === 'gyms') return [GYM_LEADERS.filter(l => (save?.gym?.[l.id] || 0) >= 1).length, GYM_LEADERS.length];
  if (earn === 'waystones') return [RING.filter(t => mended(townState(save || {}, t.id))).length, RING.length];
  if (earn === 'summit') return [Math.min(100, save?.tower?.bestEver || 0), 100];
  return null;
}
/** The earned houses a save has earned (`lend`: with `?houses=all`, every one). */
export const earnedOf = (save, lend = true) => HOUSES.filter(h => h.earn && ((lend && housesLent()) || EARN[h.earn](save || {}))).map(h => h.id);

/** Is a seasonal house on sale on `date` (its `season` month, UTC, as the furniture's holidays)? Every other house is. */
export const onSale = (house, date = new Date()) => !house.season || housesLent() || date.getUTCMonth() + 1 === house.season;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const seasonName = (house) => MONTHS[house.season - 1];

/** The houses a save has: what it owns, the one it lives in (null without a base) and each one's paint. */
export function housesOf(save) {
  const h = save?.houses;
  if (!hasBase(save) && !h) return { owned: [], home: null, paint: {} };
  const owned = h ? [...new Set((h.owned || []).filter(id => HOUSES_BY_ID[id]))] : [...FREE];
  if (hasBase(save)) owned.unshift(...FREE.filter(id => !owned.includes(id)));
  if (hasBase(save)) for (const id of earnedOf(save)) if (!owned.includes(id)) owned.push(id);
  const home = !h ? (hasBase(save) ? 'tree' : null) : owned.includes(h.home) ? h.home : owned[0] ?? null;
  const paint = {};
  for (const id of owned) { const n = h?.paint?.[id] | 0; if (n > 0 && n < HOUSES_BY_ID[id].paints.length) paint[id] = n; }
  return { owned, home, paint };
}

/** What the lot is called in a line ('the Ancient Tree', 'your Log Cabin'),
    so the garden arch, the PC and the hints name what stands there. */
export function lotWord(save) {
  const home = housesOpen() && homeOf(save);
  if (!housesOpen() || home?.id === 'tree') return 'the Ancient Tree';
  return home ? `your ${HOUSES_BY_ID[home.id].name}` : 'the Ancient Tree';
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

/** What buying `id` would say no to: 'base' (no Secret Base yet), 'owned', 'earned' (never sold), 'season' (a seasonal
    house out of its month), 'coins', or null. */
export function cantBuy(save, id, date) {
  const house = HOUSES_BY_ID[id];
  if (!house) return 'earned';
  if (!hasBase(save)) return 'base';
  if (housesOf(save).owned.includes(id)) return 'owned';
  if (house.price == null) return 'earned';
  if (!onSale(house, date)) return 'season';
  return (save.coins ?? 0) < house.price ? 'coins' : null;
}

/** On a save draft: the earned houses not yet stored, stored for good (never the lent ones). Returns their ids, for the
    Mailbox's letter; none without a base, which then gets them all at once when it's bought. */
export function claimEarned(d) {
  if (!hasBase(d)) return [];
  const kept = d.houses ? (d.houses.owned || []) : FREE;
  const got = earnedOf(d, false).filter(id => !kept.includes(id));
  if (!got.length) return [];
  const now = housesOf(d), owned = [...new Set([...FREE, ...kept, ...got])].filter(id => HOUSES_BY_ID[id]);
  store(d, { owned, home: owned.includes(now.home) ? now.home : owned[0], paint: Object.fromEntries(Object.entries(now.paint).filter(([id]) => owned.includes(id))) });
  return got;
}

/** On a save draft: pays for `id`, built in paint `n` (the first paint job comes with it), and moves in. */
export function buyHouse(d, id, n = 0, date) {
  if (cantBuy(d, id, date)) return false;
  const h = store(d, housesOf(d));
  d.coins -= HOUSES_BY_ID[id].price;
  h.owned.push(id);
  h.home = id;
  if (n > 0 && n < HOUSES_BY_ID[id].paints.length) h.paint[id] = n; else delete h.paint[id];
  return true;
}

/** On a save draft: the Secret Base itself, bought with houses on: it comes with the free houses, moved into `id` (one of
    them) in paint `n`. */
export function firstHouse(d, n = 0, id = FREE[0]) {
  if (!FREE.includes(id)) id = FREE[0];
  d.houses = { owned: [...FREE], home: id, paint: n > 0 && n < HOUSES_BY_ID[id].paints.length ? { [id]: n } : {} };
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
