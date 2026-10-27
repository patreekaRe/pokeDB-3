/* base-papers.js  -  the Secret Base's wallpapers and floors (js/secret-base.js paints them): the list, each one's
   theme (the filter chips over the Decorate tray's Wallpaper and Floor tabs, and Smeargle's catalogue at the Poké Mall),
   the painters of every look added since the first 29 (those stay in paintWall() / paintFloor()), the day's half-price
   wallpaper and floor, and the "!" on the ones you haven't looked at yet.
   The user's ask, 2026-10-27: players didn't know they had wallpaper and floors, and wanted a lot more of them. */

import { shopPrice } from './base-furniture.js';
import { safariDay } from './data/safari.js';
import { streamOf } from './rng.js';

export const WALL_THEMES = ['Classic', 'Patterns', 'Nature', 'Pokémon', 'Fancy', 'Fun'];
export const FLOOR_THEMES = ['Wood', 'Tile', 'Carpet', 'Stone', 'Nature', 'Fun'];

const w = (id, name, theme, look, a, b, c, trim, price, more) => ({ id, name, theme, look, a, b, c, trim, ...(price ? { price } : {}), ...more });
const f = (id, name, theme, look, a, b, c, price) => ({ id, name, theme, look, a, b, c, ...(price ? { price } : {}) });

export const WALLPAPERS = [
  w('cream', 'Cream stripes', 'Classic', 'stripe', '#f4e6c4', '#ead6a8', null, '#a8794a'),
  w('mint', 'Mint dots', 'Classic', 'dots', '#cdebd4', '#9fd2ad', null, '#4f8a63'),
  w('sky', 'Sky panels', 'Classic', 'panel', '#c8dcf4', '#9dbbe4', null, '#4a6aa0'),
  w('brick', 'Red brick', 'Classic', 'brick', '#b5573e', '#8e3f2c', null, '#5a2a1e'),
  // for sale (a `price`): bought once in the Wallpaper tab, tried on first
  w('plaid', 'Plaid', 'Patterns', 'plaid', '#e8d0a0', '#c0503c', '#3c5a8c', '#6a3a24', 400),
  w('waves', 'Sea waves', 'Nature', 'wave', '#d4eef4', '#5aa8d0', null, '#2a6a94', 450),
  w('stars', 'Night stars', 'Nature', 'star', '#2a2c5a', '#f8e070', '#8a90d0', '#14163a', 600),
  w('boards', 'Log cabin', 'Classic', 'boards', '#b07a48', '#8a5a32', '#d09a60', '#4a2c18', 500),
  w('leaves', 'Leafy', 'Nature', 'leaf', '#e4f0c8', '#6aa84a', '#3e7a34', '#3e5a2a', 450),
  w('hearts', 'Sweet hearts', 'Fun', 'heart', '#fbe0ea', '#e8608c', null, '#a83a60', 500),
  w('harlequin', 'Harlequin', 'Patterns', 'diamond', '#f0d878', '#d8a830', '#8a5a10', '#6a4410', 550),
  w('pokeballs', 'Poké Balls', 'Pokémon', 'ball', '#cfe0ec', '#e04040', '#303030', '#a02828', 800),
  w('stone', 'Castle stone', 'Fancy', 'stone', '#9a9a90', '#7a7a72', '#b8b8ac', '#4a4a44', 650),
  w('sunset', 'Sunset', 'Nature', 'fade', '#f8c070', '#e86a60', '#8a4a90', '#5a2a5a', 900),
  // 2026-10-27
  w('rose-stripes', 'Rose stripes', 'Classic', 'stripe', '#f8dce0', '#f0c0c8', null, '#a85a6a', 350),
  w('lemon-stripes', 'Lemon stripes', 'Classic', 'stripe', '#fbf0b8', '#f0dc80', null, '#a88a30', 350),
  w('lilac-dots', 'Lilac dots', 'Classic', 'dots', '#e4daf4', '#b8a4e0', null, '#6a5a9a', 350),
  w('peach-dots', 'Peach dots', 'Classic', 'dots', '#fbe0cc', '#f0b890', null, '#a86a4a', 350),
  w('sage-panels', 'Sage panels', 'Classic', 'panel', '#dfe8d0', '#b4c8a0', null, '#5a7048', 400),
  w('white-brick', 'White brick', 'Classic', 'brick', '#ecebe6', '#c8c6be', null, '#8a8880', 450),
  w('pin-navy', 'Navy pinstripe', 'Classic', 'pin', '#2c3a5c', '#4a5c84', null, '#141c30', 400),
  w('pin-grey', 'Office pinstripe', 'Classic', 'pin', '#d8d8d4', '#b8b8b0', null, '#5a5a54', 400),
  w('wainscot-green', 'Green wainscot', 'Classic', 'wainscot', '#cfe4c8', '#8a5a32', '#b07a48', '#4a2c18', 550),
  w('wainscot-blue', 'Blue wainscot', 'Classic', 'wainscot', '#d4e0f0', '#c8c8c0', '#f4f4ec', '#6a7a90', 550),
  w('chalk', 'Chalkboard', 'Classic', 'chalk', '#2e4a3a', '#e8f0e8', null, '#6a4a2a', 600),
  w('gingham-red', 'Red gingham', 'Patterns', 'gingham', '#fbf4f0', '#d84a4a', null, '#8a2a2a', 400),
  w('gingham-blue', 'Blue gingham', 'Patterns', 'gingham', '#f4f6fb', '#4a7ad8', null, '#2a4a8a', 400),
  w('polka-pink', 'Pink polka', 'Patterns', 'polka', '#fbe4ee', '#f08ab0', null, '#a84a70', 450),
  w('polka-blue', 'Sunny polka', 'Patterns', 'polka', '#3a6ab0', '#f8d850', null, '#1e3a6a', 450),
  w('chevron', 'Chevron', 'Patterns', 'chevron', '#f0ece4', '#3a3a44', null, '#22222a', 500),
  w('chevron-teal', 'Teal chevron', 'Patterns', 'chevron', '#e4f4f2', '#2aa8a0', null, '#1a6a64', 500),
  w('candy', 'Candy cane', 'Patterns', 'diag', '#fbf4f4', '#e04050', null, '#a02838', 500),
  w('mint-diag', 'Mint ribbons', 'Patterns', 'diag', '#e8f8f0', '#8ad8b0', null, '#3a8a64', 450),
  w('argyle', 'Argyle', 'Patterns', 'argyle', '#3a5a8a', '#5a7ab0', '#f0d878', '#1e2e4a', 600),
  w('argyle-red', 'Ruby argyle', 'Patterns', 'argyle', '#8a2a3a', '#b04050', '#f0e0c8', '#4a1420', 600),
  w('graph', 'Graph paper', 'Patterns', 'grid', '#f4f8fb', '#cfe0f0', '#8ab0d8', '#3a5a8a', 350),
  w('quilt', 'Patchwork', 'Patterns', 'quilt', '#f0d8b0', '#d8705a', '#6a9ad0', '#6a3a24', 650),
  w('rings', 'Retro circles', 'Patterns', 'rings', '#f4a040', '#e06030', '#f8e0b0', '#6a2a10', 600),
  w('hound', 'Houndstooth', 'Patterns', 'hound', '#f0ece4', '#2a2a30', null, '#18181c', 600),
  w('beach-hut', 'Beach hut stripes', 'Patterns', 'wide', '#f4f4ec', '#3aa8b0', '#2a8890', '#1a5a60', 450),
  w('checks', 'Checks', 'Patterns', 'checks', '#f0ece4', '#e04040', null, '#8a2020', 500),
  w('halftone', 'Comic dots', 'Patterns', 'halftone', '#f8e040', '#e8a820', null, '#8a6a10', 450),
  w('clouds', 'Fluffy clouds', 'Nature', 'cloud', '#a8d4f4', '#ffffff', '#d8ecfa', '#4a7ab0', 500),
  w('rain', 'Rainy day', 'Nature', 'rain', '#8a9ab0', '#c8d8ec', null, '#4a5468', 450),
  w('snowfall', 'Snowfall', 'Nature', 'snow', '#4a6a9a', '#ffffff', '#a8c0e0', '#24365a', 500),
  w('flowers', 'Flower field', 'Nature', 'flower', '#e8f4d8', '#f08ab0', '#f8d850', '#5a8a3a', 500),
  w('sakura', 'Cherry blossom', 'Nature', 'flower', '#fbe8ee', '#f4a8c0', '#ffffff', '#8a4a5a', 600),
  w('bamboo', 'Bamboo', 'Nature', 'bamboo', '#e8f0d0', '#7ab04a', '#4a7a2a', '#3a5a1e', 550),
  w('ivy', 'Ivy', 'Nature', 'vine', '#d8e8d0', '#4a8a3a', '#2a5a24', '#2a4420', 550),
  w('autumn', 'Autumn leaves', 'Nature', 'leaf', '#f8e8c8', '#e07a30', '#a84a20', '#6a3a18', 450),
  w('pines', 'Pine forest', 'Nature', 'pine', '#cfe4d8', '#3a7a4a', '#6a4a2a', '#24402a', 600),
  w('dunes', 'Desert dunes', 'Nature', 'dune', '#f0d8a0', '#d8b070', '#e4c48a', '#7a5a30', 500),
  w('cave', 'Cave rock', 'Nature', 'cave', '#6a5a50', '#5a4a42', '#8a7a6a', '#2e2620', 500),
  w('bark', 'Tree hollow', 'Nature', 'bark', '#8a6040', '#6a4a2e', '#a87a50', '#3a2414', 500),
  w('deep-sea', 'Deep sea', 'Nature', 'bubble', '#1a4a7a', '#8ad0f0', '#4a8ac0', '#0e2a4a', 550),
  w('meteors', 'Meteor shower', 'Nature', 'starry', '#10183a', '#ffffff', '#f0c060', '#080c20', 650),
  w('dawn', 'Dawn sky', 'Nature', 'fade', '#f8e0b8', '#f8b0a0', '#a8c8f0', '#6a5a7a', 800),
  w('aurora', 'Aurora', 'Nature', 'fade', '#1a2a4a', '#3aa88a', '#8a5ac0', '#0e1424', 900),
  w('flames', 'Fire flames', 'Pokémon', 'flame', '#3a1410', '#e8602a', '#f8c040', '#200a08', 700),
  w('bubbles', 'Water bubbles', 'Pokémon', 'bubble', '#a8d8f4', '#ffffff', '#6ab0e0', '#3a7ab0', 650),
  w('sprouts', 'Grass sprouts', 'Pokémon', 'sprout', '#d8f0c0', '#5aa83a', '#3a7a24', '#2a5a1e', 600),
  w('bolts', 'Electric bolts', 'Pokémon', 'bolt', '#3a3a4a', '#f8d030', '#fff8b0', '#1e1e28', 700),
  w('ice-crystals', 'Ice crystals', 'Pokémon', 'flake', '#c8e8f8', '#ffffff', '#8ac0e0', '#4a7aa0', 650),
  w('spirals', 'Psychic spirals', 'Pokémon', 'spiral', '#f4c8e0', '#c04a90', null, '#7a2a5a', 700),
  w('wisps', 'Ghostly wisps', 'Pokémon', 'wisp', '#3a2a5a', '#a890e0', '#f0e8ff', '#1e1430', 750),
  w('scales', 'Dragon scales', 'Pokémon', 'scales', '#14244a', '#4a6ab8', '#8aa8e0', '#0a1430', 800),
  w('pawprints', 'Pawprints', 'Pokémon', 'paw', '#f4e8d8', '#b08a6a', null, '#6a4a30', 450),
  w('pikachu', 'Pikachu', 'Pokémon', 'pika', '#fff4c8', '#f8d030', '#303030', '#a8801a', 900),
  w('greatballs', 'Great Balls', 'Pokémon', 'ball', '#d8e4f4', '#3a6ad8', '#303030', '#1e3a8a', 800, { h: '#8ab0ff' }),
  w('premierballs', 'Premier Balls', 'Pokémon', 'ball', '#e8e0f0', '#ffffff', '#c03030', '#8a2a2a', 800, { h: '#ffffff' }),
  w('unown', 'Unown', 'Pokémon', 'unown', '#e8e0c8', '#4a4a3a', null, '#3a3020', 700),
  w('damask', 'Damask', 'Fancy', 'damask', '#6a1a2a', '#8a2a3a', '#c8a050', '#3a0e18', 900),
  w('royal-damask', 'Royal damask', 'Fancy', 'damask', '#1e2e5a', '#2e4278', '#c8a050', '#0e1830', 900),
  w('gilded', 'Gilded panels', 'Fancy', 'panel', '#f4ecd8', '#c8a050', null, '#8a6a20', 800),
  w('velvet', 'Velvet stripes', 'Fancy', 'stripe', '#5a1a3a', '#4a1430', null, '#2a0a1a', 700),
  w('marble-wall', 'Marble', 'Fancy', 'veins', '#f4f0ea', '#d8d0c4', '#b0a898', '#8a8478', 850),
  w('jade', 'Jade lattice', 'Fancy', 'lattice', '#2a6a5a', '#5aa890', '#c8a050', '#14342c', 850),
  w('shoji', 'Shoji screen', 'Fancy', 'shoji', '#f4f0e4', '#8a6a44', null, '#4a3420', 600),
  w('crystal-wall', 'Crystal cave', 'Fancy', 'crystal', '#2a2a5a', '#8a8ae0', '#e0d8ff', '#14142e', 900),
  w('stained', 'Stained glass', 'Fancy', 'stained', '#303040', '#e0a030', '#4a8ad0', '#18181e', 1000),
  w('confetti', 'Confetti', 'Fun', 'confetti', '#fbf8f0', '#e04a5a', null, '#8a6a4a', 500),
  w('rainbow', 'Rainbow', 'Fun', 'rainbow', '#f8f8f8', '#a0c8f0', null, '#5a4a8a', 900),
  w('notes', 'Music notes', 'Fun', 'note', '#fbe4ee', '#c04a7a', null, '#7a2a4a', 550),
  w('space', 'Outer space', 'Fun', 'starry', '#14102a', '#f8f0c0', '#f0a050', '#08061a', 800, { planets: true }),
  w('circuit', 'Circuit board', 'Fun', 'circuit', '#1a4a3a', '#4ac08a', '#c8a050', '#0e2a20', 700),
  w('candy-hearts', 'Candy hearts', 'Fun', 'heart', '#e4f4fb', '#f0a0c8', null, '#6a8ab0', 500),
];

export const FLOORS = [
  f('wood', 'Wood', 'Wood', 'wood', '#c48a52', '#a8723f', '#8a5a30'),
  f('tile', 'Tiles', 'Tile', 'tile', '#e8e4dc', '#cfc8bb', '#a49c8e'),
  f('carpet', 'Carpet', 'Carpet', 'carpet', '#7a5aa8', '#6a4c96', '#8c6cba'),
  f('grass', 'Grass', 'Nature', 'grass', '#6cbf58', '#58a848', '#86d46e'),
  f('checker', 'Checkerboard', 'Tile', 'checker', '#f0ece4', '#3a3a44', '#22222a', 500),
  f('darkwood', 'Dark wood', 'Wood', 'wood', '#6a4228', '#583620', '#3e2414', 450),
  f('parquet', 'Parquet', 'Wood', 'parquet', '#d0a060', '#b08040', '#8a5e2c', 650),
  f('flagstone', 'Flagstones', 'Stone', 'flag', '#a8a498', '#8e8a7e', '#6a665c', 550),
  f('tatami', 'Tatami', 'Wood', 'tatami', '#cfd08a', '#b8b874', '#4a5a2a', 600),
  f('sand', 'Beach sand', 'Nature', 'sand', '#ecd8a0', '#d8c080', '#f8ecc4', 400),
  f('ice', 'Ice', 'Nature', 'ice', '#cfe8f4', '#a8d0e8', '#ffffff', 700),
  f('marble', 'Marble', 'Stone', 'marble', '#f4f0ea', '#d8d0c4', '#b0a898', 900),
  f('redcarpet', 'Red carpet', 'Carpet', 'carpet', '#b02838', '#98202e', '#d04050', 500),
  f('mosaic', 'Mosaic', 'Tile', 'mosaic', '#e8dcc4', '#4a8ac0', '#e0a030', 800),
  // 2026-10-27
  f('oak', 'Light oak', 'Wood', 'wood', '#dcb27a', '#c49a62', '#a8804a', 350),
  f('cherry', 'Cherry wood', 'Wood', 'wood', '#a8503a', '#904430', '#6a2e20', 400),
  f('whitewash', 'Whitewashed', 'Wood', 'wood', '#e8e0d4', '#d4cabc', '#b0a698', 400),
  f('driftwood', 'Driftwood', 'Wood', 'wood', '#a8a094', '#948c80', '#6e675c', 400),
  f('planks', 'Wide planks', 'Wood', 'plank', '#c08a52', '#a8723f', '#6a4422', 450),
  f('herringbone', 'Herringbone', 'Wood', 'herring', '#c8945a', '#a87640', '#7a5228', 700),
  f('deck', 'Ship deck', 'Wood', 'deck', '#b08a5a', '#8a6a42', '#2e2418', 500),
  f('court', 'Gym court', 'Wood', 'court', '#e0b070', '#c8985a', '#d83a3a', 800),
  f('bamboo-mat', 'Bamboo mat', 'Wood', 'bamboof', '#d8c080', '#b8a060', '#8a7a40', 550),
  f('bathroom', 'Bathroom tiles', 'Tile', 'small', '#e4f0f4', '#d0e2ea', '#8aa8b4', 400),
  f('blue-tile', 'Blue tiles', 'Tile', 'small', '#c8dcf4', '#b0cbec', '#6a8ab8', 400),
  f('pink-tile', 'Pink tiles', 'Tile', 'tile', '#f8dce4', '#ecc4d0', '#b08a98', 400),
  f('green-tile', 'Green tiles', 'Tile', 'tile', '#d4ecd8', '#b8dcc0', '#7aa888', 400),
  f('diner', 'Diner floor', 'Tile', 'checker', '#f8f4ec', '#c03040', '#8a1a28', 550),
  f('mint-check', 'Mint checks', 'Tile', 'checker', '#f0f8f4', '#8ad0b0', '#4a8a6a', 500),
  f('diamond-tile', 'Diamond tiles', 'Tile', 'diamondf', '#f0ece4', '#c04040', '#8a2a2a', 600),
  f('hex', 'Hex tiles', 'Tile', 'hex', '#e8e4dc', '#cfc8bb', '#8a8478', 650),
  f('terrazzo', 'Terrazzo', 'Tile', 'terrazzo', '#e8e4dc', '#c06a5a', '#5a8ab0', 700),
  f('sea-mosaic', 'Sea mosaic', 'Tile', 'mosaic', '#d8ecf4', '#2a6ab0', '#f8f0d0', 800),
  f('ball-tiles', 'Poké Ball tiles', 'Tile', 'ballf', '#e8e4dc', '#e04040', '#303030', 900),
  f('blue-carpet', 'Blue carpet', 'Carpet', 'carpet', '#3a5aa8', '#304c96', '#5a7ac8', 400),
  f('green-carpet', 'Green carpet', 'Carpet', 'carpet', '#3a8a5a', '#2e7a4c', '#5aa87a', 400),
  f('pink-carpet', 'Pink carpet', 'Carpet', 'carpet', '#e88ab0', '#d47aa0', '#f8a8c8', 400),
  f('orange-carpet', 'Orange carpet', 'Carpet', 'carpet', '#e08a3a', '#c87830', '#f0a85a', 400),
  f('grey-carpet', 'Grey carpet', 'Carpet', 'carpet', '#8a8a90', '#7a7a80', '#a8a8ae', 350),
  f('cream-carpet', 'Cream carpet', 'Carpet', 'carpet', '#e8dcc0', '#d8ccb0', '#f4ecd8', 350),
  f('black-carpet', 'Black carpet', 'Carpet', 'carpet', '#2a2a30', '#22222a', '#4a4a54', 400),
  f('striped-rug', 'Striped carpet', 'Carpet', 'stripef', '#f0d8a0', '#c04040', '#8a2a2a', 500),
  f('ocean-rug', 'Ocean stripes', 'Carpet', 'stripef', '#f4f4ec', '#3a6ab0', '#2a4a8a', 500),
  f('picnic', 'Picnic blanket', 'Carpet', 'gingham', '#fbf4f0', '#d84a4a', null, 500),
  f('patchwork', 'Patchwork rug', 'Carpet', 'quilt', '#f0d8b0', '#d8705a', '#6a9ad0', 650),
  f('royal', 'Royal carpet', 'Carpet', 'lattice', '#6a1a2a', '#c8a050', '#f0d890', 900),
  f('arcade', 'Arcade carpet', 'Carpet', 'arcade', '#1a1430', '#e040a0', '#40d0e0', 800),
  f('cobbles', 'Cobblestones', 'Stone', 'cobble', '#5a564e', '#a8a294', '#8a8478', 500),
  f('brick-path', 'Brick path', 'Stone', 'brickf', '#c87050', '#b5573e', '#7a3424', 500),
  f('slate', 'Slate', 'Stone', 'flag', '#5a6068', '#4a5058', '#2e3238', 550),
  f('sandstone', 'Sandstone', 'Stone', 'flag', '#e0c890', '#c8b078', '#9a8456', 500),
  f('black-marble', 'Black marble', 'Stone', 'marble', '#2a2a30', '#3a3a44', '#8a8a9a', 1000),
  f('rose-marble', 'Rose marble', 'Stone', 'marble', '#f4dcd8', '#e0bcb8', '#c09490', 950),
  f('steel', 'Steel plate', 'Stone', 'plate', '#8a9098', '#b0b8c0', '#5a6068', 600),
  f('magma', 'Cooled magma', 'Stone', 'magma', '#2e2420', '#e0502a', '#f8b040', 900),
  f('crystal-floor', 'Crystal floor', 'Stone', 'crystal', '#3a3a7a', '#6a6ac0', '#c8c0ff', 1000),
  f('moss', 'Moss', 'Nature', 'grass', '#4a8a3a', '#3e7a32', '#6aa84a', 400),
  f('dirt', 'Dirt path', 'Nature', 'sand', '#a8804a', '#8a6a3a', '#c09a64', 350),
  f('meadow', 'Flower meadow', 'Nature', 'meadow', '#6cbf58', '#58a848', '#f08ab0', 600),
  f('fallen-leaves', 'Fallen leaves', 'Nature', 'leaff', '#a8804a', '#e07a30', '#c8a030', 550),
  f('snow', 'Snow', 'Nature', 'snowf', '#f4f8fc', '#d8e4f0', '#a8c8e8', 600),
  f('water', 'Shallow water', 'Nature', 'water', '#5ab0d8', '#8ad0ec', '#ffffff', 800),
  f('stepping', 'Stepping stones', 'Nature', 'stepping', '#6cbf58', '#a8a498', '#8e8a7e', 650),
  f('cloud-floor', 'Cloud floor', 'Fun', 'cloud', '#c8e4f8', '#ffffff', '#a8cce8', 900),
  f('starry', 'Starry floor', 'Fun', 'starry', '#10142e', '#ffffff', '#f0c060', 900),
  f('party', 'Party floor', 'Fun', 'confetti', '#fbf8f0', '#e04a5a', null, 550),
  f('rainbow-floor', 'Rainbow floor', 'Fun', 'rainbow', '#f8f8f8', '#a0c8f0', null, 900),
  f('circuit-floor', 'Circuit floor', 'Fun', 'circuit', '#1a4a3a', '#4ac08a', '#c8a050', 700),
  f('dragon-floor', 'Dragon scales', 'Fun', 'scales', '#14244a', '#4a6ab8', '#8aa8e0', 800),
  f('chevron-floor', 'Chevron tiles', 'Fun', 'chevron', '#e8e4dc', '#8a8478', null, 550),
];
// wallpapers and floors on the same cheap curve as the furniture (shopPrice())
for (const s of [...WALLPAPERS, ...FLOORS]) if (s.price) s.price = shopPrice(s.price);

export const papers = (field) => field === 'wall' ? WALLPAPERS : FLOORS;
export const themesOf = (field) => field === 'wall' ? WALL_THEMES : FLOOR_THEMES;
const owned = (b, field, s) => !s.price || (b.papers || []).includes(`${field}:${s.id}`);

/** Today's half-price wallpaper or floor: one of each you don't own yet, dealt once a day from the day's seed and kept
    in the base (`sale`), so buying it doesn't deal another. Null once you own them all. */
export function paperSale(b, field, day = safariDay()) {
  if (b.sale?.day !== day) {
    const deal = (fl) => {
      const left = papers(fl).filter(s => !owned(b, fl, s));
      return left.length ? left[Math.floor(streamOf('papers', `${fl}|${day}`)() * left.length)].id : null;
    };
    b.sale = { day, wall: deal('wall'), floor: deal('floor') };
  }
  return b.sale[field];
}
export const onSale = (b, field, s) => !!s.price && paperSale(b, field) === s.id;
/** What a wallpaper or floor costs you today: half (to the nearest 5) on the day's sale. */
export const paperPrice = (b, field, s) => onSale(b, field, s) ? Math.round(s.price / 10) * 5 : s.price;

/** The ones for sale you haven't looked at yet (`b.paperSeen`, as `wall:id` / `floor:id`): a "!" on the Decorate key and
    the tab till the tab is opened. A base from before it has seen none, so everyone is shown them once. */
export const freshPapers = (b, field) => papers(field).filter(s => s.price && !(b.paperSeen || []).includes(`${field}:${s.id}`));
/** Whether the day's sale on this tab is still unseen (a "!" on the tab, not the Decorate key). */
export const saleNews = (b, field) => !!paperSale(b, field) && b.saleSeen?.[field] !== safariDay();
/** Mark a tab's wallpapers or floors and its sale seen. True if anything changed. */
export function seePapers(b, field) {
  const fresh = freshPapers(b, field), news = saleNews(b, field);
  if (!fresh.length && !news) return false;
  b.paperSeen = [...(b.paperSeen || []), ...fresh.map(s => `${field}:${s.id}`)];
  b.saleSeen = { ...b.saleSeen, [field]: safariDay() };
  return true;
}

/* ---------- the painters ---------- */

/* Each look paints one 8x8 cell at (x, y), the cell's column and row `cx`, `cy` (a floor's counted from its own top),
   with `R(x, y, w, h, colour)`, after the cell is filled with the paper's `a`. Every look works on a wall or a floor. */

const hash = (a, b, k = 0) => {
  let h = Math.imul(a + 0x9e37, 0x85ebca6b) ^ Math.imul(b + 0x7f4a, 0xc2b2ae35) ^ Math.imul(k + 1, 0x27d4eb2f);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
  return h >>> 0;
};

/** A little picture from rows of letters, each a key of `ink` (anything else left clear). */
function sprite(R, rows, x, y, ink) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length;) {
      const c = ink[row[i]];
      let n = 1;
      while (c && row[i + n] === row[i]) n++;
      if (c) R(x + i, y + j, n, 1, c);
      i += n;
    }
  });
}
function disc(R, x, y, r, col) {
  for (let j = -Math.floor(r); j <= r; j++) {
    const half = Math.floor(Math.sqrt(r * r - j * j));
    R(x - half, y + j, half * 2 + 1, 1, col);
  }
}
/** A 12-pixel Poké Ball, as paintWall()'s `ball` look draws them. */
function ball(R, x, y, top, line, hi) {
  for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) {
    const d = (i - 5.5) ** 2 + (j - 5.5) ** 2, mid = d <= 6;
    if (d > 36) continue;
    R(x + i, y + j, 1, 1, d > 25 ? line : mid ? (d > 3 ? line : '#fff') : j === 5 || j === 6 ? line : j < 5 ? (i < 4 && j < 3 ? hi : top) : '#fff');
  }
}

const RAINBOW = ['#f8a8a8', '#f8c890', '#f8e890', '#b8e0a0', '#a0c8f0', '#c8a8e8'];
const BRIGHT = ['#e04a5a', '#4a8ad8', '#f8c830', '#4ab070', '#c060c0', '#f08a30'];
const PICS = {
  flame: ['...b....', '..bb..b.', '..bcb.b.', '.bbcbbb.', '.bccccb.', 'bbcccccb', '.bccccb.', '..bbbb..'],
  bolt: ['....bbb.', '...bbb..', '..bbb...', '.bbbbbb.', '....bbb.', '...bbb..', '..bb....', '.b......'],
  flake: ['...b...', '.b.b.b.', '..bbb..', 'bbbcbbb', '..bbb..', '.b.b.b.', '...b...'],
  paw: ['.b.b.b.', '.b.b.b.', '.......', '..bbb..', '.bbbbb.', '.bbbbb.', '..b.b..'],
  note: ['..bbbbb', '..b...b', '..b...b', '..b...b', '.bb..bb', 'bbb.bbb', '.b...b.'],
  wisp: ['..bbbb..', '.bbbbbb.', 'bbcbbcbb', 'bbcbbcbb', 'bbbbbbbb', 'bbbbbbbb', 'bb.bb.bb', 'b..b..b.'],
  flower: ['.b.b.', 'bbbbb', '.bcb.', 'bbbbb', '.b.b.'],
  sprout: ['.b...b.', 'bbb.bbb', '.bbcbb.', '...c...', '...c...'],
  spiral: ['.bbbbb.', 'b.....b', 'b.bbb.b', 'b.b.b.b', 'b.b...b', '.b.bbb.'],
  crystal: ['...c...', '..cbc..', '..bbb..', '.bbcbb.', '.bbcbb.', '.bbcbb.', '..bbb..', '...b...'],
  pine: ['...bb...', '..bbbb..', '...bb...', '..bbbb..', '.bbbbbb.', '..bbbb..', '.bbbbbb.', 'bbbbbbbb', '...cc...', '...cc...'],
  cloud: ['....cccc......', '..cccbbcc.cc..', '.cbbbbbbbcbbc.', 'cbbbbbbbbbbbbc', 'cbbbbbbbbbbbbc', '.cccccccccccc.'],
  damask: ['...cc...', '..c..c..', '.c.cc.c.', 'c.c..c.c', '.c.cc.c.', '..c..c..', '...cc...', '....c...'],
  hound: ['bbbb...b', 'bbbb..b.', 'bbbb.b..', 'bbbbb...', '...b....', '..b.....', '.b......', 'b.......'],
  scale: ['cccccccc', 'cccccccc', 'bccccccb', 'bccccccb', '.bccccb.', '..bbbb..'],
  pika: ['c..........c', 'cb........bc', '.bb......bb.', '.bbbbbbbbbb.', 'bbbbbbbbbbbb', 'bbcwbbbbcwbb', 'bbccbbbbccbb', 'brrbbccbbrrb', 'bbbbbbbbbbbb', '.bbbbbbbbbb.'],
  tri: ['...b...', '..b.b..', '.b...b.', 'bbbbbbb'],
  zig: ['b...b...', '.b.b.b.b', '..b...b.'],
  unown: [
    ['..bbb..', '.b...b.', 'b..b..b', 'b.bbb.b', 'b..b..b', '.b...b.', '..bbb..'],
    ['...b...', '..bbb..', '..b.b..', '.b.b.b.', '.bbbbb.', 'b.....b', 'b.....b'],
    ['bbbbbbb', '.....b.', '....b..', '..bbb..', '..b....', '.b.....', 'bbbbbbb'],
  ],
  doodle: [
    ['..b..', '.bbb.', 'bbbbb', '.b.b.', 'b...b'],
    ['.bbb.', 'b...b', 'bbbbb', 'b...b', '.bbb.'],
    ['.b...', 'b.b.b', '...b.'],
    ['bbbbb', '..b..', '..b..', '..b..'],
  ],
};

export const LOOKS = {
  pin: (R, s, x, y) => R(x + 3, y, 1, 8, s.b),
  wide: (R, s, x, y, cx) => { if (cx % 4 < 2) R(x, y, 8, 8, s.b); if (cx % 2 === 0) R(x, y, 1, 8, s.c); },
  wainscot: (R, s, x, y, cx, cy) => {
    if (y >= 24) { R(x, y, 8, 8, s.c); if (cx % 3 === 0) R(x, y, 1, 8, s.b); if (y === 24) R(x, y, 8, 2, s.b); }
    else if ((cx + cy) % 2 === 0) R(x + 3, y + 3, 2, 2, s.b + '50');
  },
  chalk: (R, s, x, y, cx, cy) => { const h = hash(cx, cy, 1) % 9; if (h < 4) sprite(R, PICS.doodle[h], x + 1, y + 1, { b: s.b + 'a0' }); },
  gingham: (R, s, x, y, cx, cy) => { if (cx % 2 === 0) R(x, y, 8, 8, s.b + '66'); if (cy % 2 === 0) R(x, y, 8, 8, s.b + '66'); },
  polka: (R, s, x, y, cx, cy) => { if ((cx + cy) % 2 === 0) disc(R, x + 4, y + 4, 2.6, s.b); },
  chevron: (R, s, x, y, cx, cy) => { if (cy % 2 === 0) for (let i = 0; i < 8; i++) R(x + i, y + [3, 2, 1, 0, 0, 1, 2, 3][i], 1, 3, s.b); },
  // ribbons six wide every sixteen, running down to the left: each row's run, cut to the cell
  diag: (R, s, x, y) => {
    for (let j = 0; j < 8; j++) {
      const at = (16 - (x + y + j) % 16) % 16;
      for (const i0 of [at, at - 16]) { const a = Math.max(0, i0), b = Math.min(8, i0 + 6); if (b > a) R(x + a, y + j, b - a, 1, s.b); }
    }
  },
  argyle: (R, s, x, y, cx, cy) => {
    for (let i = 0; i < 8; i++) {
      const wd = i < 4 ? i * 2 + 1 : 15 - i * 2;
      if ((cx + cy) % 2 === 0) R(x + 4 - (wd >> 1), y + i, wd, 1, s.b);
      if (i % 2 === 0) { R(x + i, y + i, 1, 1, s.c); R(x + 7 - i, y + i, 1, 1, s.c); }
    }
  },
  grid: (R, s, x, y, cx, cy) => { R(x, y, 8, 1, s.b); R(x, y, 1, 8, s.b); if (cx % 4 === 0) R(x, y, 1, 8, s.c); if (cy % 4 === 0) R(x, y, 8, 1, s.c); },
  quilt: (R, s, x, y, cx, cy) => {
    R(x, y, 8, 8, [s.a, s.b, s.c, '#e8c860'][hash(cx >> 1, cy >> 1, 2) % 4]);
    if (cx % 2 === 0) for (let j = 1; j < 8; j += 3) R(x + 1, y + j, 1, 2, '#ffffff90');
    if (cy % 2 === 0) for (let i = 1; i < 8; i += 3) R(x + i, y + 1, 2, 1, '#ffffff90');
  },
  rings: (R, s, x, y, cx, cy) => {
    if (cx % 2 || cy % 2) return;
    disc(R, x + 8, y + 8, 7, s.b); disc(R, x + 8, y + 8, 5, s.a); disc(R, x + 8, y + 8, 3, s.c); disc(R, x + 8, y + 8, 1, s.b);
  },
  hound: (R, s, x, y) => sprite(R, PICS.hound, x, y, { b: s.b }),
  checks: (R, s, x, y, cx, cy) => { if ((cx + cy) % 2 === 0) R(x, y, 8, 8, s.b); },
  halftone: (R, s, x, y, cx, cy) => disc(R, x + 4, y + 4, 0.8 + (cy % 4) * 0.7, s.b),
  cloud: (R, s, x, y, cx, cy) => { if (cx % 4 === 0 && cy % 2 === 0) sprite(R, PICS.cloud, x + (cy % 4 ? 16 : 1), y + 1, { b: s.b, c: s.c }); },
  rain: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 3) % 3;
    if (h === 0) { R(x + 5, y + 1, 1, 2, s.b); R(x + 4, y + 3, 1, 2, s.b); R(x + 3, y + 5, 1, 1, s.b); }
    else if (h === 1) R(x + 1, y + 6, 2, 1, s.b + '80');
  },
  snow: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 4);
    if (h % 4 === 0) { R(x + 3, y + 2, 1, 3, s.b); R(x + 2, y + 3, 3, 1, s.b); }
    else if (h % 4 === 2) R(x + (h >> 4) % 7, y + (h >> 8) % 7, 1, 1, s.c);
  },
  flower: (R, s, x, y, cx, cy) => {
    if ((cx + cy) % 2 === 0) sprite(R, PICS.flower, x + 1, y + 1, { b: s.b, c: s.c });
    else if (hash(cx, cy, 5) % 3 === 0) R(x + 4, y + 4, 1, 1, s.c);
  },
  bamboo: (R, s, x, y, cx, cy) => {
    if (cx % 2) { if (hash(cx, cy, 6) % 3 === 0) { R(x, y + 3, 3, 1, s.b); R(x + 1, y + 2, 2, 1, s.b); } return; }
    R(x + 2, y, 3, 8, s.b); R(x + 2, y, 1, 8, s.c);
    if (cy % 2 === 0) R(x + 1, y, 5, 1, s.c);
  },
  vine: (R, s, x, y, cx) => {
    if (cx % 3) return;
    const off = [3, 4, 4, 3, 2, 2, 3, 3];
    for (let j = 0; j < 8; j++) R(x + off[j], y + j, 1, 1, s.c);
    R(x + 5, y + 1, 3, 2, s.b); R(x, y + 5, 3, 2, s.b);
  },
  pine: (R, s, x, y, cx, cy) => { if (cx % 3 === 0 && cy % 2 === 0) sprite(R, PICS.pine, x + (cy % 4 ? 12 : 0), y, { b: s.b, c: s.c }); },
  dune: (R, s, x, y, cx, cy) => {
    for (let i = 0; i < 8; i++) {
      const off = Math.round(2 * Math.sin((x + i) / 9 + cy * 1.7));
      R(x + i, y + 4 + off, 1, cy % 2 ? 1 : 2, cy % 2 ? s.c : s.b);
    }
  },
  cave: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 7);
    R(x + (h & 3), y + ((h >> 2) & 3), 3 + ((h >> 4) & 1), 2, s.b);
    if (h % 5 === 0) { R(x + 1, y + 6, 3, 1, s.c); R(x + 3, y + 5, 1, 1, s.c); }
  },
  bark: (R, s, x, y, cx, cy) => {
    for (let j = 0; j < 8; j += 2) { R(x + ((j >> 1) + cx + cy) % 3, y + j, 1, 2, s.b); R(x + 5 + ((cy + (j >> 1)) % 2), y + j, 1, 2, s.b); }
    if (hash(cx, cy, 8) % 9 === 0) { disc(R, x + 3, y + 4, 1.5, s.c); R(x + 3, y + 4, 1, 1, s.b); }
  },
  rainbow: (R, s, x, y, cx, cy) => { R(x, y, 8, 8, RAINBOW[cy % RAINBOW.length]); R(x, y + 7, 8, 1, '#ffffff40'); },
  flame: (R, s, x, y, cx, cy) => {
    if ((cx + cy) % 2 === 0) sprite(R, PICS.flame, x, y, { b: s.b, c: s.c });
    else if (hash(cx, cy, 9) % 4 === 0) R(x + 3, y + 4, 1, 1, s.c);
  },
  bubble: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 10) % 6;
    if (h === 0) { disc(R, x + 4, y + 4, 3, s.b); disc(R, x + 4, y + 4, 2, s.a); R(x + 3, y + 2, 1, 1, s.b); R(x + 5, y + 5, 1, 1, s.c); }
    else if (h === 3) { disc(R, x + 3, y + 5, 1, s.b); R(x + 3, y + 5, 1, 1, s.a); }
    else if (h === 5) R(x + 6, y + 2, 1, 1, s.b);
  },
  sprout: (R, s, x, y, cx, cy) => { if ((cx + cy) % 2 === 0) sprite(R, PICS.sprout, x, y + 1, { b: s.b, c: s.c }); },
  bolt: (R, s, x, y, cx, cy) => {
    if ((cx + cy) % 2 === 0) sprite(R, PICS.bolt, x, y, { b: s.b });
    else if (hash(cx, cy, 11) % 3 === 0) { R(x + 3, y + 3, 1, 1, s.c); R(x + 5, y + 6, 1, 1, s.b); }
  },
  flake: (R, s, x, y, cx, cy) => {
    if ((cx + cy) % 2 === 0) sprite(R, PICS.flake, x, y, { b: s.b, c: s.c });
    else if (hash(cx, cy, 12) % 3 === 0) R(x + 4, y + 4, 1, 1, s.c);
  },
  spiral: (R, s, x, y, cx, cy) => { if ((cx + cy) % 2 === 0) sprite(R, PICS.spiral, x, y + 1, { b: s.b }); },
  wisp: (R, s, x, y, cx, cy) => {
    if ((cx + cy * 2) % 3 === 0) sprite(R, PICS.wisp, x, y, { b: s.b, c: s.a });
    else if (hash(cx, cy, 13) % 3 === 0) R(x + 3, y + 3, 2, 2, s.c + '50');
  },
  scales: (R, s, x, y, cx, cy) => {
    const off = (cy % 2) * 4, ink = { b: s.b, c: s.c };
    sprite(R, PICS.scale, x + off, y, ink);
    if (cx === 0 && off) sprite(R, PICS.scale, x - 4, y, ink);
  },
  paw: (R, s, x, y, cx, cy) => { if ((cx + cy) % 2 === 0 && hash(cx, cy, 14) % 2) sprite(R, PICS.paw, x, y, { b: s.b }); },
  pika: (R, s, x, y, cx, cy) => {
    if (cx % 2 === 0 && cy % 2 === 0 && (cx / 2 + cy / 2) % 2 === 0) sprite(R, PICS.pika, x + 2, y + 3, { b: s.b, c: s.c, r: '#e04040', w: '#ffffff' });
  },
  unown: (R, s, x, y, cx, cy) => { if ((cx + cy) % 2 === 0) sprite(R, PICS.unown[hash(cx, cy, 15) % 3], x, y, { b: s.b }); },
  note: (R, s, x, y, cx, cy) => { if ((cx + cy) % 2 === 0) sprite(R, PICS.note, x, y, { b: s.b }); },
  damask: (R, s, x, y, cx, cy) => {
    if ((cx + cy) % 2 === 0) sprite(R, PICS.damask, x, y, { c: s.c });
    else R(x + 3, y + 3, 2, 2, s.b);
  },
  veins: (R, s, x, y, cx, cy) => {
    if (cx % 4 === 0) R(x, y, 1, 8, s.b); if (cy % 2 === 0) R(x, y, 8, 1, s.b);
    if ((cx * 7 + cy * 5) % 9 < 2) for (let i = 0; i < 8; i++) R(x + i, y + ((i * 3 + cx) % 5), 1, 1, s.c);
  },
  lattice: (R, s, x, y) => {
    for (let j = 0; j < 8; j++) { R(x + j, y + j, 1, 1, s.b); R(x + 7 - j, y + j, 1, 1, s.b); }
    R(x + 3, y + 3, 2, 2, s.c);
  },
  shoji: (R, s, x, y, cx, cy) => { if (cx % 2 === 0) R(x, y, 1, 8, s.b); if (cy % 2 === 0) R(x, y, 8, 1, s.b); },
  crystal: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 16);
    if (h % 3 === 0 && (cx + cy) % 2 === 0) sprite(R, PICS.crystal, x, y, { b: s.b, c: s.c });
    else if (h % 4 === 1) R(x + (h >> 3) % 7, y + (h >> 6) % 7, 1, 1, s.c);
  },
  stained: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 17);
    R(x + 1, y + 1, 7, 7, [s.b, s.c, '#c04060', '#50a860', '#e8d890', '#8a5ac0'][h % 6]);
    if (h % 4 === 0) for (let i = 1; i < 8; i++) R(x + i, y + i, 1, 1, s.a);
    R(x + 2, y + 2, 2, 1, '#ffffff50');
  },
  confetti: (R, s, x, y, cx, cy) => {
    for (let k = 0; k < 2; k++) {
      const h = hash(cx, cy, 18 + k), flat = (h >> 6) & 1;
      R(x + (h & 7), y + ((h >> 3) & 7), flat ? 2 : 1, flat ? 1 : 2, BRIGHT[(h >> 7) % BRIGHT.length]);
    }
  },
  starry: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 20);
    if (s.planets && h % 41 === 0) { disc(R, x + 4, y + 4, 3, s.c); R(x - 1, y + 4, 11, 1, s.b); return; }
    if (h % 5 === 0) { R(x + 3, y + 2, 1, 3, s.b); R(x + 2, y + 3, 3, 1, s.b); }
    else if (h % 2 === 0) R(x + (h >> 5) % 7, y + (h >> 9) % 7, 1, 1, h % 3 ? s.b : s.c);
  },
  circuit: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 21);
    if (h % 3 === 0) R(x, y + 3, 8, 1, s.b);
    if (h % 3 === 1) R(x + 4, y, 1, 8, s.b);
    if (h % 7 === 0) R(x + 3, y + 2, 3, 3, s.c);
    if (h % 11 === 5) { R(x + 1, y + 1, 6, 5, '#0a1a14'); for (let i = 2; i < 7; i += 2) { R(x + i, y, 1, 1, s.c); R(x + i, y + 6, 1, 1, s.c); } }
  },
  // floors
  plank: (R, s, x, y, cx, cy) => {
    R(x, y + 7, 8, 1, s.c);
    if ((cx * 3 + cy * 7) % 8 === 0) R(x, y, 1, 7, s.c);
    if (hash(cx, cy, 22) % 4 === 0) R(x + 2, y + 3, 3, 1, s.b);
  },
  herring: (R, s, x, y, cx) => {
    R(x, y, 1, 8, s.b);
    for (let j = 0; j < 8; j++) { const i = cx % 2 ? 7 - j : j; R(x + i, y + j, 1, 1, s.c); R(x + (i + 4) % 8, y + j, 1, 1, s.c); }
  },
  deck: (R, s, x, y, cx, cy) => {
    R(x, y + 7, 8, 1, s.c);
    if ((cx + (cy % 3) * 3) % 5 === 0) { R(x, y, 1, 7, s.c); R(x + 2, y + 3, 1, 1, s.c); }
    if (hash(cx, cy, 23) % 3 === 0) R(x + 3, y + 2, 3, 1, s.b);
  },
  court: (R, s, x, y, cx, cy) => {
    if ((cx + (cy % 2) * 3) % 6 === 0) R(x, y, 1, 8, s.b);
    R(x, y + 7, 8, 1, s.b);
    if (cx % 10 === 1) R(x + 3, y, 2, 8, s.c);
    if (cy % 8 === 1) R(x, y + 3, 8, 2, s.c);
  },
  bamboof: (R, s, x, y, cx, cy) => {
    R(x + 3, y, 1, 8, s.b); R(x + 7, y, 1, 8, s.c);
    if ((cy + cx * 3) % 4 === 0) R(x, y + 4, 4, 1, s.c);
  },
  small: (R, s, x, y, cx, cy) => {
    if (hash(cx, cy, 24) % 3 === 0) R(x + 1, y + 1, 3, 3, s.b);
    if (hash(cx, cy, 25) % 4 === 0) R(x + 5, y + 5, 3, 3, s.b);
    R(x, y, 8, 1, s.c); R(x, y + 4, 8, 1, s.c); R(x, y, 1, 8, s.c); R(x + 4, y, 1, 8, s.c);
  },
  diamondf: (R, s, x, y, cx, cy) => {
    if ((cx + cy) % 2) { R(x + 3, y + 3, 2, 2, s.c); return; }
    for (let i = 0; i < 8; i++) { const wd = i < 4 ? i * 2 + 1 : 15 - i * 2; R(x + 4 - (wd >> 1), y + i, wd, 1, s.b); }
  },
  hex: (R, s, x, y, cx, cy) => {
    R(x, y + 7, 8, 1, s.c);
    if (cx % 2 === cy % 2) { R(x, y + 1, 1, 6, s.c); R(x + 1, y, 1, 1, s.c); R(x + 1, y + 7, 1, 1, s.b); }
    if (hash(cx >> 1, cy, 26) % 4 === 0) R(x + 2, y + 2, 4, 4, s.b);
  },
  terrazzo: (R, s, x, y, cx, cy) => {
    for (let k = 0; k < 3; k++) {
      const h = hash(cx, cy, 27 + k);
      R(x + (h & 7), y + ((h >> 3) & 7), 1 + ((h >> 6) & 1), 1, [s.b, s.c, '#f8f4ec', '#5a5a5a'][(h >> 8) % 4]);
    }
  },
  ballf: (R, s, x, y, cx, cy) => {
    R(x, y, 8, 1, s.c + '30'); R(x, y, 1, 8, s.c + '30');
    if (cx % 4 === 0 && cy % 4 === 0) ball(R, x + 10, y + 10, s.b, s.c, '#ffffff90');
  },
  stripef: (R, s, x, y, cx, cy) => { if (cy % 4 < 2) R(x, y, 8, 8, s.b); if (cy % 4 === 0) R(x, y, 8, 1, s.c); },
  arcade: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 30) % 9;
    if (h === 0) sprite(R, PICS.tri, x, y + 2, { b: s.b });
    else if (h === 1) { disc(R, x + 4, y + 4, 2, s.c); R(x + 4, y + 4, 1, 1, s.a); }
    else if (h === 2) sprite(R, PICS.zig, x, y + 3, { b: '#f8e040' });
  },
  cobble: (R, s, x, y, cx, cy) => {
    const off = (cy % 2) * 4, h = hash(cx, cy, 31);
    R(x + off + 1, y + 1, 6, 6, h % 3 ? s.b : s.c);
    R(x + off + 1, y + 6, 6, 1, '#00000030'); R(x + off + 2, y + 2, 2, 1, '#ffffff40');
    if (cx === 0 && off) R(x, y + 1, 3, 6, s.b);
  },
  brickf: (R, s, x, y, cx, cy) => {
    R(x, y + 3, 8, 1, s.c); R(x, y + 7, 8, 1, s.c);
    R(x + (cy % 2 ? 0 : 4), y, 1, 3, s.c); R(x + (cy % 2 ? 4 : 0), y + 4, 1, 3, s.c);
    if (hash(cx, cy, 32) % 3 === 0) R(x + 1, y, 3, 3, s.b);
  },
  plate: (R, s, x, y, cx, cy) => {
    const up = (cx + cy) % 2 === 0;
    for (let k = 0; k < 3; k++) { R(x + 2 + k, y + (up ? 4 - k : 2 + k), 1, 1, s.b); R(x + 3 + k, y + (up ? 5 - k : 3 + k), 1, 1, s.c); }
    if (cx % 8 === 0) R(x, y, 1, 8, s.c);
  },
  magma: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 33);
    R(x + (h >> 4) % 6, y + (h >> 7) % 6, 2, 2, '#00000030');
    if (h % 3 === 0) { R(x + 1, y + 3, 4, 1, s.b); R(x + 4, y + 4, 3, 1, s.b); R(x + 2, y + 3, 2, 1, s.c); }
    else if (h % 3 === 1) { R(x + 3, y + 1, 1, 4, s.b); R(x + 4, y + 4, 1, 3, s.b); R(x + 3, y + 2, 1, 1, s.c); }
  },
  snowf: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 34);
    if (h % 4 === 0) R(x + (h >> 2) % 7, y + (h >> 5) % 7, 1, 1, s.c);
    if (h % 9 === 1) R(x + 1, y + 5, 5, 1, s.b);
  },
  meadow: (R, s, x, y, cx, cy) => {
    if ((cx * 5 + cy * 11) % 7 === 0) { R(x + 2, y + 3, 1, 3, s.b); R(x + 4, y + 2, 1, 4, s.b); }
    if (hash(cx, cy, 35) % 9 === 0) { R(x + 5, y + 4, 1, 3, s.c); R(x + 4, y + 5, 3, 1, s.c); R(x + 5, y + 5, 1, 1, '#f8e060'); }
  },
  leaff: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 36) % 4;
    if (h === 0) { R(x + 2, y + 3, 3, 2, s.b); R(x + 3, y + 2, 2, 1, s.b); R(x + 5, y + 5, 1, 1, '#6a4a2a'); }
    else if (h === 1) { R(x + 4, y + 1, 2, 3, s.c); R(x + 3, y + 2, 1, 1, s.c); }
    else if (h === 2) R(x + 1, y + 6, 2, 1, '#00000020');
  },
  water: (R, s, x, y, cx, cy) => {
    const h = hash(cx, cy, 37);
    if (h % 4 === 0) R(x + 1, y + 3, 4, 1, s.b);
    if (h % 5 === 1) R(x + 4, y + 6, 3, 1, s.c);
    if (h % 23 === 2) { disc(R, x + 4, y + 4, 3, s.b); disc(R, x + 4, y + 4, 2, s.a); }
  },
  stepping: (R, s, x, y, cx, cy) => {
    if ((cx * 5 + cy * 11) % 7 === 0) { R(x + 2, y + 3, 1, 3, '#00000020'); R(x + 4, y + 2, 1, 4, '#00000020'); }
    if (cx % 4 === 1 && cy % 4 === 1) { disc(R, x + 8, y + 8, 6, s.c); disc(R, x + 7, y + 7, 5, s.b); R(x + 5, y + 5, 2, 1, '#ffffff50'); }
  },
};
