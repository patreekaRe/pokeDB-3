/* ============================================================
   furniture.js  -  the Secret Base's earned kinds (roadmap: Secret Base part c).

   Each entry is a kind from the base's catalogue (js/base-furniture*.js, a
   family id) that is never sold: it comes from a badge, an achievement (the
   starter it unlocks), a feat, a finished Safari Pokédex page or three wins against a Gym Leader, named in its
   `from`, or a Game Corner prize bought at Meowth's counter. Every one of those is a list the save never shrinks (`badges`,
   `unlocked`, `feats`, `safariDex.done`, `corner.prizes`), so a kind is owned once its source
   is, with nothing saved of its own: `earnedFurniture(save)` works it out, and
   an old save has every kind it can prove. One of each comes with the source,
   every colour of it like a bought kind; the daily Shop never stocks them.
   Kept free of the painters so node tests can read it.
   ============================================================ */

import { BADGES_BY_ID } from './badges.js';
import { ACHIEVEMENTS, ACHIEVEMENT_FOR, FEATS } from './achievements.js';
import { SAFARI_DEX_PAGES } from './safari.js';
import { PRIZES, RETIRED_PRIZES } from './corner.js';
import { GYM_LEADERS, GYM_BY_ID, GYM_POSTER, posterKind } from './gym.js';
import { RECIPES, RECIPES_BY_ID, GIFTS, FAVOURITE, FRIENDS, gifteeOf, heartPieces, heartsOf, workshopOf } from './workshop.js';
import { DOJO_REWARDS, DOJO_REWARD, dojoEarned, dojoHow } from './dojo.js';
import { BERRIES, BERRY, picked } from './berries.js';
import { RANGER_FURNITURE, TASKS_BY_ID } from './ranger.js';
import { JOURNAL_FURNITURE, JOURNAL_BY_ID } from './journal.js';

/** Where a kind comes from: a source and an id in that source's list. */
const SOURCES = {
  badge: { owned: (save, id) => (save.badges || []).includes(id), item: (id) => BADGES_BY_ID[id] },
  achievement: { owned: (save, id) => (save.unlocked || []).includes(id), item: (id) => ACHIEVEMENT_FOR[id] },
  feat: { owned: (save, id) => (save.feats || []).includes(id), item: (id) => FEATS.find(f => f.id === id) },
  safari: { owned: (save, id) => (save.safariDex?.done || []).includes(id), item: (id) => SAFARI_DEX_PAGES.find(p => p.area === id) },
  prize: { owned: (save, id) => (save.corner?.prizes || []).includes(id), item: (id) => [...PRIZES, ...RETIRED_PRIZES].find(p => p.kind === id) },
  gym: { owned: (save, id) => (save.gym?.[id] || 0) >= GYM_POSTER, item: (id) => GYM_BY_ID[id] },   // wins only ever count up
  // Kurt's Workshop (js/data/workshop.js): a piece made there, and a Gym Leader's signature piece once given their favourite
  craft: { owned: (save, id) => (save.workshop?.made || []).includes(id), item: (id) => RECIPES_BY_ID[id] },
  gift: { owned: (save, id) => (save.workshop?.fond || []).includes(id), item: (id) => GYM_BY_ID[id] },
  // their second and third, at 3 and 5 hearts ('john:3'); `liked` only counts up, so it's owned for good
  heart: { owned: (save, id) => heartsOf(workshopOf(save), id.split(':')[0]) >= +id.split(':')[1], item: (id) => GYM_BY_ID[id.split(':')[0]] },
  // Kenmatta's dojo (js/data/dojo.js): a belt, or a number of stars from his trials
  dojo: { owned: (save, id) => dojoEarned(save, id), item: (id) => DOJO_REWARD[id] },
  // the backyard's berry garden (js/data/berries.js): a berry's basket, from the first of it picked
  berry: { owned: (save, id) => picked(save).includes(id), item: (id) => BERRY[id] },
  // the Safari Outfitter's Ranger Task Board (js/data/ranger.js): a task's reward, once it's claimed
  ranger: { owned: (save, id) => (save.ranger?.claimed || []).includes(id), item: (id) => TASKS_BY_ID[id] },
  // the Trainer's Journal at the PC (js/data/journal.js): a milestone's piece, once it's claimed
  journal: { owned: (save, id) => (save.journal?.claimed || []).includes(id), item: (id) => JOURNAL_BY_ID[id] },
  // the Golden set: a piece for every achievement earned, so the nth comes with the nth, whichever it is
  golden: { owned: (save, n) => achievementsOf(save) >= n, item: (n) => n >= 1 && n <= ACHIEVEMENTS.length && { n } },
};

const achievementsOf = (save) => (save.unlocked || []).filter(id => ACHIEVEMENT_FOR[id]).length;

/* The Golden series (js/base-furniture-golden.js; furniture expansion session e, 2026-10-17): never sold, earned. The
   small pieces come with the first achievements and the throne with the last; the bed, the chest and the vase are
   badges no other piece comes from. */
const GOLDEN = ['goldcandle', 'goldclock', 'goldchair', 'goldstool', 'goldlamp', 'golddishes', 'goldtable', 'goldmirror',
  'goldshelf', 'golddresser', 'golddesk', 'goldscreen', 'goldframe', 'goldsconce', 'goldrug', 'goldsofa', 'goldwardrobe',
  'goldmagikarp', 'goldtoilet', 'goldbath', 'goldpiano', 'goldthrone'];

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
  // Gen 3's dolls: the Kanto three from their type's first win, the Hoenn three from the achievements that unlock them.
  { kind: 'charmanderdoll', from: ['badge', 'fire'] },
  { kind: 'squirtledoll', from: ['badge', 'water'] },
  { kind: 'bulbasaurdoll', from: ['badge', 'grass'] },
  { kind: 'torchicdoll', from: ['achievement', 'torchic'] },
  { kind: 'treeckodoll', from: ['achievement', 'treecko'] },
  { kind: 'mudkipdoll', from: ['achievement', 'mudkip'] },
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
  // The Game Corner's prizes, bought at Meowth's counter (PRIZES in js/data/corner.js), and the ones it no longer sells.
  ...PRIZES.map(({ kind }) => ({ kind, from: ['prize', kind] })),
  ...RETIRED_PRIZES.map(({ kind }) => ({ kind, from: ['prize', kind], retired: true })),
  // A Gym Leader's signed poster, from the third win against them (js/base-furniture-gym.js paints it).
  ...GYM_LEADERS.map(l => ({ kind: posterKind(l.id), from: ['gym', l.id] })),
  // Kurt's Workshop: its craft-only pieces, and each Gym Leader's signature piece for their favourite gift
  ...RECIPES.filter(r => r.kind === 'piece').map(r => ({ kind: r.makes, from: ['craft', r.id], towns: true })),
  ...GIFTS.map(g => ({ kind: g.sig, from: ['gift', g.leader], towns: true })),
  ...FRIENDS.flatMap(id => heartPieces(id).map(p => ({ kind: p.kind, from: ['heart', `${id}:${p.at}`], towns: true }))),
  // Kenmatta's dojo set
  ...DOJO_REWARDS.map(r => ({ kind: r.kind, from: ['dojo', r.kind] })),
  // the berry garden's baskets
  ...BERRIES.map(b => ({ kind: `${b.id}basket`, from: ['berry', b.id] })),
  // the Safari set, from the Ranger Task Board
  ...RANGER_FURNITURE.map(f => ({ kind: f.kind, from: ['ranger', f.task] })),
  // the Trainer set, from the Trainer's Journal
  ...JOURNAL_FURNITURE.map(f => ({ kind: f.kind, from: ['journal', f.task] })),
  // the Golden set
  ...GOLDEN.map((kind, i) => ({ kind, from: ['golden', i + 1] })),
  { kind: 'goldbed', from: ['badge', 'gold'] },
  { kind: 'goldchest', from: ['badge', 'roster'] },
  { kind: 'goldvase', from: ['badge', 'shiny-hunter'] },
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
  if (kind === 'gym') return `Beat Gym Leader ${src.name} ${GYM_POSTER} times (${Math.min(save.gym?.[src.id] || 0, GYM_POSTER)}/${GYM_POSTER})`;
  if (kind === 'craft') return `Make it at Kurt's Workshop in the Whispering Clearing`;
  if (kind === 'gift') return `Give ${gifteeOf(src.id, src.name)} their favourite gift, made at Kurt's Workshop (${FAVOURITE[src.id].name})`;
  if (kind === 'heart') {
    const n = +piece.from[1].split(':')[1], has = heartsOf(workshopOf(save), src.id);
    return `Reach ${n} hearts with ${gifteeOf(src.id, src.name)}: give them gifts made at Kurt's Workshop (${Math.min(has, n)}/${n})`;
  }
  if (kind === 'dojo') return dojoHow(piece.kind, save);
  if (kind === 'berry') return `Pick your first ${src.name} in your backyard's berry garden`;
  if (kind === 'journal') return `Trainer's Journal at the Clearing's PC: ${src.title} (${src.text.replace(/\.$/, '')})`;
  if (kind === 'ranger') return `Ranger Task Board at the Safari Outfitter: ${src.title} (${src.text.replace(/\.$/, '')})`;
  if (kind === 'golden') {
    const n = piece.from[1];
    return `Earn ${n === ACHIEVEMENTS.length ? 'every' : n} achievement${n > 1 ? 's' : ''} (${Math.min(achievementsOf(save), n)}/${n})`;
  }
  if (kind === 'prize') return `Buy it for ${src.coins} PokéCoins at Meowth's prize counter in the Game Corner`;
  return `Catch every Pokémon in the Safari's ${src.name}`;
}
