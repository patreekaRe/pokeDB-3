/* ============================================================
   furniture.js  -  the Secret Base's earned kinds (roadmap: Secret Base part c).

   Each entry is a kind from the base's catalogue (js/base-furniture*.js, a
   family id) that is never sold: it comes from a badge, an achievement (the
   starter it unlocks), a feat or a finished Safari Pokédex page, named in its
   `from`. Every one of those is a list the save never shrinks (`badges`,
   `unlocked`, `feats`, `safariDex.done`), so a kind is owned once its source
   is, with nothing saved of its own: `earnedFurniture(save)` works it out, and
   an old save has every kind it can prove. One of each comes with the source,
   every colour of it like a bought kind; the daily Shop never stocks them.
   Kept free of the painters so node tests can read it.
   ============================================================ */

import { BADGES_BY_ID } from './badges.js';
import { ACHIEVEMENT_FOR, FEATS } from './achievements.js';
import { SAFARI_DEX_PAGES } from './safari.js';

/** Where a kind comes from: a source and an id in that source's list. */
const SOURCES = {
  badge: { owned: (save, id) => (save.badges || []).includes(id), item: (id) => BADGES_BY_ID[id] },
  achievement: { owned: (save, id) => (save.unlocked || []).includes(id), item: (id) => ACHIEVEMENT_FOR[id] },
  feat: { owned: (save, id) => (save.feats || []).includes(id), item: (id) => FEATS.find(f => f.id === id) },
  safari: { owned: (save, id) => (save.safariDex?.done || []).includes(id), item: (id) => SAFARI_DEX_PAGES.find(p => p.area === id) },
};

export const FURNITURE = [
  // Journey badges: a piece of each biome to bring home.
  { kind: 'stump', from: ['badge', 'clearing'] },
  { kind: 'stonelantern', from: ['badge', 'shrine'] },
  { kind: 'tidepool', from: ['badge', 'tide'] },
  { kind: 'brazier', from: ['badge', 'ember'] },
  { kind: 'logpile', from: ['badge', 'thorn'] },
  { kind: 'dunerug', from: ['badge', 'sun'] },
  { kind: 'worldmap', from: ['badge', 'explorer'] },
  { kind: 'trophy', from: ['badge', 'champion'] },
  { kind: 'medal', from: ['badge', 'master'] },
  // Gen 3's dolls: the Kanto three from their type's first win, big ones from the Hoenn starters' achievements.
  { kind: 'charmanderdoll', from: ['badge', 'fire'] },
  { kind: 'squirtledoll', from: ['badge', 'water'] },
  { kind: 'bulbasaurdoll', from: ['badge', 'grass'] },
  { kind: 'bigcharmanderdoll', from: ['achievement', 'torchic'] },
  { kind: 'bigbulbasaurdoll', from: ['achievement', 'treecko'] },
  { kind: 'bigsquirtledoll', from: ['achievement', 'mudkip'] },
  // Collector and secret badges.
  { kind: 'confettirug', from: ['badge', 'sparkle'] },
  { kind: 'coinpusher', from: ['badge', 'jackpot'] },
  { kind: 'cardcatalogue', from: ['badge', 'pokedex'] },
  { kind: 'dummy', from: ['badge', 'dojo'] },
  { kind: 'punchbag', from: ['badge', 'black-belt'] },
  { kind: 'wingstatue', from: ['badge', 'legend'] },
  { kind: 'geode', from: ['badge', 'depths'] },
  { kind: 'balldisplay', from: ['badge', 'master-ball'] },
  { kind: 'cloudcolumn', from: ['badge', 'sky-king'] },
  // The bonus Pokédex pages.
  { kind: 'sunkenpillar', from: ['badge', 'page-ruins'] },
  { kind: 'vinewall', from: ['badge', 'page-thornwood'] },
  { kind: 'haybale', from: ['badge', 'page-savanna'] },
  // The Pokédex page legendaries.
  { kind: 'featherfan', from: ['achievement', 'hooh'] },
  { kind: 'wingcrest', from: ['achievement', 'lugia'] },
  { kind: 'globe', from: ['achievement', 'reshiram'] },
  // Feats.
  { kind: 'plasmaglobe', from: ['feat', 'eternatus'] },
  { kind: 'crystalball', from: ['feat', 'depths-dex'] },
  // A piece per finished Safari page, and one for the whole Safari Pokédex.
  { kind: 'tulips', from: ['safari', 'meadow'] },
  { kind: 'mushstool', from: ['safari', 'forest'] },
  { kind: 'koipond', from: ['safari', 'wetland'] },
  { kind: 'lilytub', from: ['safari', 'marsh'] },
  { kind: 'boulder', from: ['safari', 'peak'] },
  { kind: 'saguaro', from: ['safari', 'desert'] },
  { kind: 'tent', from: ['badge', 'safari-master'] },
];

export const FURNITURE_BY_KIND = Object.fromEntries(FURNITURE.map(p => [p.kind, p]));

/** The badge, achievement, feat or Safari page a kind comes from. */
export const sourceOf = (piece) => SOURCES[piece.from[0]].item(piece.from[1]);

/** Does the save hold this kind's source? */
export const isEarned = (piece, save) => SOURCES[piece.from[0]].owned(save, piece.from[1]);

/** Every earned kind the save can prove, in FURNITURE's order. */
export const earnedFurniture = (save) => FURNITURE.filter(p => isEarned(p, save));

/** A secret source's kind stays ??? until earned, like its badge or feat. */
const isSecret = (piece) => !!sourceOf(piece)?.secret;

/** How a kind is earned, for the base's Shop ("???" for a secret one not yet earned). */
export function howToEarn(piece, save) {
  if (!isEarned(piece, save) && isSecret(piece)) return '???';
  const [kind] = piece.from;
  const src = sourceOf(piece);
  if (kind === 'badge') return `Earn the ${src.name}: ${src.text}`;
  if (kind === 'achievement' || kind === 'feat') return src.text;
  return `Catch every Pokémon in the Safari's ${src.name}`;
}
