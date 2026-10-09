/* ============================================================
   furniture.js  -  the Secret Base's earned pieces (roadmap: Secret Base part c).

   These pieces are never sold: each one comes from a badge, an achievement
   (the starter it unlocks), a feat or a finished Safari Pokédex page, named in
   its `from`. Every one of those is a list the save never shrinks (`badges`,
   `unlocked`, `feats`, `safariDex.done`), so a piece is owned once its source
   is, with nothing saved of its own: `earnedFurniture(save)` works it out, and
   an old save has every piece it can prove the day the base opens. Part a's
   bought pieces join them in `save.base`.

   A piece is data for the base's painter (part a), which draws it in code:
   - `layer`: 'rug' (on the floor, under things), 'stand' (furniture), 'top' (a
     small thing on a `top: true` piece, Gen 3's dolls on a desk, or on the
     floor), 'wall' (hung on the back wall), or a whole surface, 'wallpaper' or
     'flooring', swapped like furniture.
   - `size`: [width, depth] in tiles (wall pieces: [width, height]).
   - `turns`: it can be rotated (front, back and one side drawn, the other side
     mirrored).
   - `colours`: its palette swaps, `SWATCHES` keys, the first the default.
   - `use`: what a Safari Pokémon on show does with it (part d): 'bed', 'pool',
     'seat'.
   - `glow`: it gives off light at night (the day / night window).
   ============================================================ */

import { BADGES_BY_ID } from './badges.js';
import { ACHIEVEMENT_FOR, FEATS } from './achievements.js';
import { SAFARI_DEX_PAGES } from './safari.js';

/** The colour variants a piece can come in: its main colour swapped, the painter shading it from this. */
export const SWATCHES = {
  red: '#d0483c', orange: '#e8873a', yellow: '#f0c83c', green: '#58a848', blue: '#3c78d0',
  purple: '#8c58c0', pink: '#e87aa8', white: '#e8e8e0', black: '#383840', brown: '#8c5c38',
};

export const LAYERS = ['rug', 'stand', 'top', 'wall', 'wallpaper', 'flooring'];

/** Where a piece comes from: a kind and an id in that kind's list. */
const SOURCES = {
  badge: { owned: (save, id) => (save.badges || []).includes(id), item: (id) => BADGES_BY_ID[id] },
  achievement: { owned: (save, id) => (save.unlocked || []).includes(id), item: (id) => ACHIEVEMENT_FOR[id] },
  feat: { owned: (save, id) => (save.feats || []).includes(id), item: (id) => FEATS.find(f => f.id === id) },
  safari: { owned: (save, id) => (save.safariDex?.done || []).includes(id), item: (id) => SAFARI_DEX_PAGES.find(p => p.area === id) },
};

const FEATS_BY_ID = Object.fromEntries(FEATS.map(f => [f.id, f]));

export const FURNITURE = [
  // Journey badges: a piece of each biome to bring home.
  { id: 'stump-table', name: 'Stump Table', layer: 'stand', size: [2, 1], turns: true, top: true, from: ['badge', 'clearing'] },
  { id: 'stone-lantern', name: 'Stone Lantern', layer: 'stand', size: [1, 1], glow: true, from: ['badge', 'shrine'] },
  { id: 'tide-fountain', name: 'Tide Fountain', layer: 'stand', size: [1, 1], use: 'pool', from: ['badge', 'tide'] },
  { id: 'ember-brazier', name: 'Ember Brazier', layer: 'stand', size: [1, 1], glow: true, from: ['badge', 'ember'] },
  { id: 'log-bench', name: 'Mossy Log Bench', layer: 'stand', size: [2, 1], turns: true, use: 'seat', from: ['badge', 'thorn'] },
  { id: 'savanna-rug', name: 'Savanna Rug', layer: 'rug', size: [2, 2], colours: ['yellow', 'orange', 'brown'], from: ['badge', 'sun'] },
  { id: 'explorer-map', name: 'Explorer\'s Map', layer: 'wall', size: [2, 1], from: ['badge', 'explorer'] },
  { id: 'champion-cup', name: 'Champion Cup', layer: 'top', size: [1, 1], from: ['badge', 'champion'] },
  { id: 'master-cup', name: 'Master Cup', layer: 'top', size: [1, 1], from: ['badge', 'master'] },
  // Gen 3's dolls: the Kanto three from their type's first win, the Hoenn three from the achievements that unlock them.
  { id: 'charmander-doll', name: 'Charmander Doll', layer: 'top', size: [1, 1], from: ['badge', 'fire'] },
  { id: 'squirtle-doll', name: 'Squirtle Doll', layer: 'top', size: [1, 1], from: ['badge', 'water'] },
  { id: 'bulbasaur-doll', name: 'Bulbasaur Doll', layer: 'top', size: [1, 1], from: ['badge', 'grass'] },
  { id: 'torchic-doll', name: 'Torchic Doll', layer: 'top', size: [1, 1], from: ['achievement', 'torchic'] },
  { id: 'treecko-doll', name: 'Treecko Doll', layer: 'top', size: [1, 1], from: ['achievement', 'treecko'] },
  { id: 'mudkip-doll', name: 'Mudkip Doll', layer: 'top', size: [1, 1], from: ['achievement', 'mudkip'] },
  // Collector and secret badges.
  { id: 'glitter-mat', name: 'Glitter Mat', layer: 'rug', size: [2, 1], turns: true, colours: ['pink', 'blue', 'yellow', 'purple'], from: ['badge', 'sparkle'] },
  { id: 'slot-machine', name: 'Slot Machine', layer: 'stand', size: [1, 1], glow: true, from: ['badge', 'jackpot'] },
  { id: 'dex-shelf', name: 'Pokédex Shelf', layer: 'stand', size: [2, 1], turns: true, top: true, colours: ['red', 'blue', 'green', 'black'], from: ['badge', 'pokedex'] },
  { id: 'training-dummy', name: 'Training Dummy', layer: 'stand', size: [1, 1], from: ['badge', 'dojo'] },
  { id: 'dragonite-medallion', name: 'Dragonite Medallion', layer: 'wall', size: [1, 1], from: ['badge', 'black-belt'] },
  { id: 'legend-statue', name: 'Legend Statue', layer: 'stand', size: [1, 1], from: ['badge', 'legend'] },
  { id: 'crystal-wall', name: 'Crystal Cave Wall', layer: 'wallpaper', from: ['badge', 'depths'] },
  { id: 'master-ball-stand', name: 'Master Ball Stand', layer: 'top', size: [1, 1], from: ['badge', 'master-ball'] },
  { id: 'pillar-model', name: 'Sky Pillar Model', layer: 'top', size: [1, 1], from: ['badge', 'sky-king'] },
  // The bonus Pokédex pages: Gen 3's tree, cave and desert bases as surfaces.
  { id: 'ruin-floor', name: 'Sunken Tile Floor', layer: 'flooring', from: ['badge', 'page-ruins'] },
  { id: 'jungle-wall', name: 'Jungle Vine Wall', layer: 'wallpaper', from: ['badge', 'page-thornwood'] },
  { id: 'straw-bed', name: 'Straw Bed', layer: 'stand', size: [2, 1], turns: true, use: 'bed', from: ['badge', 'page-savanna'] },
  // The Pokédex page legendaries.
  { id: 'rainbow-wing', name: 'Rainbow Wing', layer: 'wall', size: [1, 1], from: ['achievement', 'hooh'] },
  { id: 'silver-wing', name: 'Silver Wing', layer: 'wall', size: [1, 1], from: ['achievement', 'lugia'] },
  { id: 'globe', name: 'Pokémon Globe', layer: 'top', size: [1, 1], from: ['achievement', 'reshiram'] },
  // Feats.
  { id: 'eternatus-core', name: 'Eternatus Core', layer: 'stand', size: [1, 1], glow: true, from: ['feat', 'eternatus'] },
  { id: 'mewtwo-poster', name: 'Mewtwo Poster', layer: 'wall', size: [1, 1], from: ['feat', 'depths-dex'] },
  // A piece per finished Safari page, and a floor for the whole Safari Pokédex.
  { id: 'flower-bed', name: 'Flower Bed', layer: 'stand', size: [1, 1], colours: ['pink', 'yellow', 'red', 'white'], from: ['safari', 'meadow'] },
  { id: 'tree-stool', name: 'Tree Stool', layer: 'stand', size: [1, 1], use: 'seat', from: ['safari', 'forest'] },
  { id: 'lily-pond', name: 'Lily Pond', layer: 'stand', size: [2, 2], use: 'pool', from: ['safari', 'wetland'] },
  { id: 'reed-pot', name: 'Reed Pot', layer: 'stand', size: [1, 1], from: ['safari', 'marsh'] },
  { id: 'snow-rock', name: 'Snowy Rock', layer: 'stand', size: [1, 1], from: ['safari', 'peak'] },
  { id: 'cactus-pot', name: 'Cactus Pot', layer: 'top', size: [1, 1], from: ['safari', 'desert'] },
  { id: 'safari-floor', name: 'Safari Grass Floor', layer: 'flooring', from: ['badge', 'safari-master'] },
];

export const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map(p => [p.id, p]));

/** The badge, achievement, feat or Safari page a piece comes from. */
export const sourceOf = (piece) => SOURCES[piece.from[0]].item(piece.from[1]);

/** Does the save hold this piece's source? */
export const isEarned = (piece, save) => SOURCES[piece.from[0]].owned(save, piece.from[1]);

/** Every earned piece the save can prove, in FURNITURE's order. */
export const earnedFurniture = (save) => FURNITURE.filter(p => isEarned(p, save));

/** A secret source's piece stays ??? until earned, like its badge or feat. */
const isSecret = (piece) => !!sourceOf(piece)?.secret;

/** How a piece is earned, for the base's shop or storage ("???" for a secret one not yet earned). */
export function howToEarn(piece, save) {
  if (!isEarned(piece, save) && isSecret(piece)) return '???';
  const [kind, id] = piece.from;
  const src = sourceOf(piece);
  if (kind === 'badge') return `Earn the ${src.name}: ${src.text}`;
  if (kind === 'achievement') return src.text;
  if (kind === 'feat') return FEATS_BY_ID[id].text;
  return `Catch every Pokémon in the Safari's ${src.name}`;
}
