/* ============================================================
   trainercard.js  -  Gold/Silver's Trainer Card (roadmap item 17b): a
   Collection card opening a window with the trainer's numbers and the
   Badge Case, six rows of badges (js/data/badges.js). The badges
   are drawn as smooth SVG from a shape and a glyph each: a gradient from a
   light top-left to a dark bottom-right, a gloss and a dark outline.
   Also keeps `stats.playMs`, the play time, counted from its release.
   ============================================================ */

import { BADGES, BADGE_GROUPS } from './data/badges.js';
import { DEX_PAGES, DEPTHS_PAGE, BONUS_PAGES, safariOpen } from './data/pokedex.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { SAFARI_DEX_PAGES } from './data/safari.js';
import { isStarterUnlocked } from './progress.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { RELICS } from './data/relics.js';
import { ITEMS } from './data/items.js';
import { ALL_CARDS } from './data/cards.js';
import { getSave, updateSave, addPlayTime, isShiny } from './storage.js';
import { safariDexCount } from './safaridex.js';
import { trainerName } from './leaderboard.js';
import { tipAt } from './tips.js';
import { playSound } from './audio.js';
import { $, el, openDialog } from './ui.js';

// shapes as polygons in a 16x16 box, scaled onto a 36x36 SVG
const circle = (r = 7.6, cx = 8, cy = 8) => Array.from({ length: 32 }, (_, i) => [cx + r * Math.cos(i * Math.PI / 16), cy + r * Math.sin(i * Math.PI / 16)]);
const star = () => Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 3.6 : 8.4, a = -Math.PI / 2 + i * Math.PI / 5;
  return [8 + r * Math.cos(a), 8.8 + r * Math.sin(a)];
});
const SHAPES = {
  circle: circle(),
  hex: [[8, 0], [15.2, 4], [15.2, 12], [8, 16], [0.8, 12], [0.8, 4]],
  octagon: [[4.6, 0.4], [11.4, 0.4], [15.6, 4.6], [15.6, 11.4], [11.4, 15.6], [4.6, 15.6], [0.4, 11.4], [0.4, 4.6]],
  diamond: [[8, 0], [15.6, 8], [8, 16], [0.4, 8]],
  gem: [[4, 1], [12, 1], [15.6, 6], [8, 15.8], [0.4, 6]],
  shield: [[0.6, 0.6], [15.4, 0.6], [15.4, 8], [8, 15.8], [0.6, 8]],
  drop: [[8, 0], [12, 5.5], [14, 9], [13.2, 13], [10.5, 15.6], [5.5, 15.6], [2.8, 13], [2, 9], [4, 5.5]],
  flame: [[8, 0], [10, 3.5], [12.5, 2.5], [14.4, 8], [13.6, 13], [10.5, 15.6], [5.5, 15.6], [2.4, 13], [1.6, 8], [4, 3.2], [5.6, 5.2]],
  leaf: [[14.6, 1.4], [15, 8], [11.5, 13], [6, 15], [1, 15], [1.2, 10], [4, 4.5], [9, 1.6]],
  star: star(),
  crown: [[0.4, 3], [4, 7], [8, 0.8], [12, 7], [15.6, 3], [14.4, 15.4], [1.6, 15.4]],
  bolt: [[10.5, 0], [2, 9], [7.4, 9], [5, 16], [14, 6.6], [8.6, 6.6], [12, 0]],
  book: [[1.4, 1.4], [14.6, 1.4], [14.6, 14.6], [1.4, 14.6]],
  tower: [[8, 0], [13.6, 4.4], [13.6, 15.6], [2.4, 15.6], [2.4, 4.4]],
};
const ROUND = { book: 4, circle: 0 };

const num = (t, size, y = 24) => (d) => `<text x="18" y="${y}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${size}" fill="${d}">${t}</text>`;
// glyphs on the 36x36 badge, centred on 18,18: d is the dark ink, h the badge's light colour
const G = {
  tree: (d) => `<path d="M17 19h2v7h-2Z" fill="${d}"/><circle cx="18" cy="14.5" r="5.6" fill="${d}"/><circle cx="16" cy="12.6" r="1.6" fill="#fff" opacity=".5"/>`,
  torii: (d) => `<path d="M9.5 11.8Q18 9.2 26.5 11.8M12 15.4h12M13.6 12v13M22.4 12v13" fill="none" stroke="${d}" stroke-width="2.4" stroke-linecap="round"/>`,
  volcano: (d) => `<path d="M8.5 25.5 15 15h6l6.5 10.5Z" fill="${d}" stroke="${d}" stroke-width="1.2" stroke-linejoin="round"/><path d="M15.6 15.4l1.4 2.6 1-1.4 1.4 2 1-3.2" fill="none" stroke="#ffc060" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18" cy="11" r="1.8" fill="#fff"/><circle cx="20.6" cy="8.4" r="1.3" fill="#fff" opacity=".8"/>`,
  flame: () => `<path d="M18 12.5c2.8 3 4.2 5.6 4.2 8.4a4.2 4.2 0 0 1-8.4 0c0-2 .9-3.6 2.2-5 .3 1.4.9 2.1 1.6 2.4-.4-2.2-.2-3.9.4-5.8Z" fill="#fff" opacity=".92"/>`,
  drop: () => `<path d="M18 13c2.6 3.6 4 6 4 8.3a4 4 0 0 1-8 0c0-2.3 1.4-4.7 4-8.3Z" fill="#fff" opacity=".9"/>`,
  vein: () => `<path d="M27 8Q19 15 9.5 28M20.5 14.5l-.6-4.4M20.5 14.5l4.4.2M15.8 19.5l-.8-4.2M15.8 19.5l4.2.4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>`,
  two: num('2', 16), three: num('3', 16), five: num('5', 16),
  fist: (d, h) => `<path d="M11.5 15.5a2.5 2.5 0 0 1 2.5-2.5h9a2.5 2.5 0 0 1 2.5 2.5v6a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4Z" fill="${d}"/><path d="M15 13v4M18.5 13v4M22 13v4" stroke="${h}" stroke-width="1.1" stroke-linecap="round" opacity=".8"/><path d="M11.5 19.5h5.5" stroke="${h}" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>`,
  eye: (d) => `<path d="M9 18q9-9 18 0-9 9-18 0Z" fill="#fff" stroke="${d}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="18" cy="18" r="3.2" fill="${d}"/><circle cx="19" cy="17" r="1" fill="#fff"/>`,
  facet: () => `<path d="M3.5 14h29M10 4l4 10 4 19.6 4-19.6 4-10" fill="none" stroke="#fff" stroke-width="1" stroke-linejoin="round" opacity=".55"/>`,
  ball: (d) => `<circle cx="18" cy="18" r="7" fill="#fff" stroke="${d}" stroke-width="1.6"/><path d="M11 18a7 7 0 0 1 14 0Z" fill="${d}"/><path d="M11 18h14" stroke="${d}" stroke-width="1.6"/><circle cx="18" cy="18" r="2.2" fill="#fff" stroke="${d}" stroke-width="1.4"/>`,
  paw: (d) => `<ellipse cx="18" cy="21.6" rx="4.6" ry="3.8" fill="${d}"/><circle cx="12.4" cy="16" r="2" fill="${d}"/><circle cx="16" cy="12.6" r="2" fill="${d}"/><circle cx="20" cy="12.6" r="2" fill="${d}"/><circle cx="23.6" cy="16" r="2" fill="${d}"/>`,
  compass: (d) => `<circle cx="18" cy="18" r="7.4" fill="none" stroke="#fff" stroke-width="1.4" opacity=".85"/><path d="M18 10.5l2.6 7.5h-5.2Z" fill="#fff"/><path d="M15.4 18h5.2L18 25.5Z" fill="${d}"/><circle cx="18" cy="18" r="1.1" fill="${d}"/>`,
  ...Object.fromEntries([10, 20, 30, 40, 50, 60, 70, 80, 90].map(n => [`t${n}`, num(`${n}`, 11, 26)])), t100: num('100', 8.6, 25.5),
  ...Object.fromEntries([1, 5, 10, 15, 20, 30, 40, 50].map(n => [`n${n}`, n < 10 ? num(`${n}`, 16) : num(`${n}`, 12, 23)])),
  one: num('1', 16), four: num('4', 16), A: num('A', 14), zero: num('0', 16),
  wave: () => `<path d="M9 16q2.25-3 4.5 0t4.5 0 4.5 0 4.5 0M9 22q2.25-3 4.5 0t4.5 0 4.5 0 4.5 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>`,
  thorns: (d) => `<path d="M10 26Q14 18 18 18T26 10" fill="none" stroke="${d}" stroke-width="2.2" stroke-linecap="round"/><path d="M13.4 21.6l-2.6-1.2M16.6 18.6l-.4-2.8M20 17.6l2.4 1.6M23.2 13.6l.6 2.8" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>`,
  fork: (d) => `<path d="M18 27v-7l-6-8M18 20l6-8" fill="none" stroke="${d}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="11" r="1.8" fill="#fff"/><circle cx="24" cy="11" r="1.8" fill="#fff"/>`,
  leafy: (d) => `<path d="M12 25Q12 14 24.5 12.5Q24 24 12 25Z" fill="#fff" opacity=".92"/><path d="M12.6 24.4 21 16" stroke="${d}" stroke-width="1.2" stroke-linecap="round"/>`,
  sparkle: () => `<path d="M18 9.5Q19 17 26.5 18 19 19 18 26.5 17 19 9.5 18 17 17 18 9.5Z" fill="#fff" opacity=".95"/>`,
  heart: (d) => `<path d="M18 25.5 11 18.6a4 4 0 0 1 7-4.8 4 4 0 0 1 7 4.8Z" fill="#fff" stroke="${d}" stroke-width="1.4" stroke-linejoin="round"/>`,
  cards: (d) => `<rect x="11" y="12.5" width="9" height="12" rx="1.4" fill="#fff" stroke="${d}" stroke-width="1.4" transform="rotate(-12 15.5 18.5)"/><rect x="16" y="11.5" width="9" height="12" rx="1.4" fill="#fff" stroke="${d}" stroke-width="1.4" transform="rotate(10 20.5 17.5)"/>`,
  coin: (d, h) => `<circle cx="18" cy="18" r="7.2" fill="${h}" stroke="${d}" stroke-width="1.6"/><circle cx="18" cy="18" r="4.8" fill="none" stroke="${d}" stroke-width="1" opacity=".6"/><text x="18" y="21.4" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="9" fill="${d}">P</text>`,
  sun: () => `<circle cx="18" cy="18" r="4.2" fill="#fff" opacity=".95"/><path d="M18 8.5v3.2M18 24.3v3.2M8.5 18h3.2M24.3 18h3.2M11.3 11.3l2.3 2.3M22.4 22.4l2.3 2.3M11.3 24.7l2.3-2.3M22.4 13.6l2.3-2.3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".95"/>`,
  clock: (d) => `<circle cx="18" cy="18" r="7.4" fill="#fff" stroke="${d}" stroke-width="1.6"/><path d="M18 13.2V18l3.4 2.2" fill="none" stroke="${d}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
};

// per badge: shape, [light, mid, dark] colours, glyph
const LOOK = {
  clearing: ['circle', ['#a8e070', '#58a838', '#2c6820'], 'tree'],
  shrine: ['octagon', ['#f89880', '#d84838', '#882018'], 'torii'],
  ember: ['diamond', ['#ffc060', '#e87020', '#983810'], 'volcano'],
  champion: ['star', ['#fff090', '#f0c030', '#a07010']],
  fire: ['flame', ['#ffb060', '#f05828', '#a02810'], 'flame'],
  water: ['drop', ['#90d0ff', '#3890e8', '#1c4ea0'], 'drop'],
  grass: ['leaf', ['#b0f080', '#50b838', '#286a20'], 'vein'],
  bronze: ['circle', ['#f0b080', '#c07838', '#704010'], 'two'],
  silver: ['circle', ['#ffffff', '#b8c0d0', '#606878'], 'three'],
  gold: ['circle', ['#fff4a0', '#f0c030', '#987010'], 'five'],
  master: ['crown', ['#e0b0ff', '#9a50e0', '#4c2090']],
  dojo: ['octagon', ['#f0c888', '#b87838', '#603818'], 'fist'],
  seal: ['hex', ['#d8b0ff', '#8858d0', '#402080'], 'eye'],
  depths: ['gem', ['#c8f8ff', '#a070f0', '#482090'], 'facet'],
  pokedex: ['book', ['#ff9898', '#d83838', '#781818'], 'ball'],
  safari: ['shield', ['#e8e098', '#a8a048', '#5a5420'], 'paw'],
  streak: ['bolt', ['#fff8a0', '#f8d020', '#a07800']],
  explorer: ['circle', ['#98f0e0', '#30b0a0', '#106058'], 'compass'],
  tide: ['hex', ['#98f0e8', '#30a8b0', '#145860'], 'wave'],
  thorn: ['diamond', ['#a8d878', '#4a8a30', '#1e4818'], 'thorns'],
  sun: ['circle', ['#ffe890', '#e8a830', '#8a5410'], 'sun'],
  wanderer: ['circle', ['#f0d8a0', '#b89050', '#5e4420'], 'fork'],
  rookie: ['circle', ['#c8f0b0', '#70b858', '#305c20'], 'one'],
  platinum: ['circle', ['#f0fbff', '#a8d8e8', '#4c7888'], 'four'],
  'crown-fire': ['crown', ['#ffb060', '#f05828', '#a02810'], 'flame'],
  'crown-water': ['crown', ['#90d0ff', '#3890e8', '#1c4ea0'], 'drop'],
  'crown-grass': ['crown', ['#b0f080', '#50b838', '#286a20'], 'leafy'],
  veteran: ['shield', ['#fff4a0', '#d8a830', '#7a5410'], 'five'],
  'iron-will': ['shield', ['#e0e4ec', '#8c94a8', '#3c4250'], 'fist'],
  untouchable: ['circle', ['#ffc8e0', '#f070a8', '#902858'], 'heart'],
  minimalist: ['book', ['#ffffff', '#c8ccd8', '#5c6070'], 'cards'],
  purist: ['octagon', ['#fff8e0', '#e0c890', '#806030'], 'cards'],
  penny: ['circle', ['#f8c8a0', '#c8804c', '#683818'], 'coin'],
  'heavy-hitter': ['star', ['#ffa898', '#e04838', '#801810'], 'fist'],
  speedrun: ['diamond', ['#b8f4ff', '#40c0e0', '#106078'], 'clock'],
  'alpha-slayer': ['shield', ['#ff9890', '#c02830', '#601018'], 'A'],
  tsunami: ['drop', ['#80b8ff', '#2860d0', '#102c78'], 'wave'],
  'bare-bag': ['octagon', ['#f0e0c0', '#b89868', '#5c4428'], 'zero'],
  'page-ruins': ['book', ['#98f0e8', '#30a8b0', '#145860'], 'ball'],
  'page-thornwood': ['book', ['#a8d878', '#4a8a30', '#1e4818'], 'ball'],
  'page-savanna': ['book', ['#ffe890', '#e8a830', '#8a5410'], 'ball'],
  'page-depths': ['book', ['#d8c0ff', '#8858d0', '#402080'], 'ball'],
  'safari-master': ['shield', ['#fff4a0', '#d8b830', '#7a6410'], 'paw'],
  sparkle: ['diamond', ['#fff0f8', '#f8a8d0', '#a04880'], 'sparkle'],
  'shiny-hunter': ['star', ['#fff0f8', '#f8a8d0', '#a04880']],
  roster: ['circle', ['#ff9898', '#d83838', '#781818'], 'ball'],
  balls: ['hex', ['#e8b8ff', '#9848c8', '#4c1870'], 'ball'],
  'high-roller': ['octagon', ['#fff090', '#f0c030', '#a07010'], 'coin'],
  jackpot: ['circle', ['#fff090', '#f0c030', '#a07010'], 'coin'],
  'black-belt': ['octagon', ['#8890a0', '#40444c', '#141418'], 'fist'],
  eternal: ['gem', ['#ffb8c8', '#d02850', '#600c28'], 'facet'],
  thunder: ['bolt', ['#ffe0a0', '#f89820', '#984800']],
  legend: ['star', ['#ffffff', '#b8c8ff', '#4c5aa0']],
  'sky-king': ['crown', ['#e8f8ff', '#78c0f0', '#2c6098']],
  weekly: ['tower', ['#d8d0ff', '#8878d8', '#3c3088'], 'clock'],
  'safari-regular': ['circle', ['#f0e8a0', '#b0a048', '#5a5420'], 'paw'],
  'rare-catch': ['gem', ['#d8ffb0', '#58c048', '#1c6020'], 'sparkle'],
  'aug-25': ['hex', ['#eef1f5', '#a8b0c0', '#4c5464'], 'sparkle'],
  'aug-dex': ['book', ['#fff0a8', '#e8b838', '#7a5a10'], 'sparkle'],
  'aug-set': ['octagon', ['#d0ccff', '#6c64d0', '#2c2878'], 'cards'],
  'aug-sets': ['crown', ['#d0ccff', '#6c64d0', '#2c2878'], 'cards'],
  'aug-prism': ['gem', ['#ffe0f8', '#c070f0', '#4c2090'], 'facet'],
  'aug-trade': ['diamond', ['#ff9c9c', '#b02838', '#500c18'], 'coin'],
};

// the badges made in bulk: a Safari area's shape and colours, a type's colours and glyph, a biome's colours
const AREA_LOOK = {
  meadow: ['circle', ['#eef8a8', '#a8c838', '#566818']],
  forest: ['octagon', ['#a8e098', '#3c8a3c', '#18441c']],
  wetland: ['hex', ['#a8e0ff', '#4890d0', '#1c4878']],
  marsh: ['shield', ['#c8e0b8', '#6a8c68', '#2c4430']],
  peak: ['diamond', ['#f0f8ff', '#a8b8d0', '#4c5870']],
  desert: ['gem', ['#ffe0a0', '#e0a048', '#7a4c18']],
};
const TYPE_LOOK = {
  fire: [LOOK.fire[1], 'flame'], water: [LOOK.water[1], 'drop'], grass: [LOOK.grass[1], 'leafy'],
  normal: [['#f4f0e4', '#b8b098', '#5c5644'], 'paw'], psychic: [['#ffc8f0', '#d058b0', '#701c58'], 'eye'],
};
const BIOME_INK = {
  clearing: LOOK.clearing[1], shrine: LOOK.shrine[1], wastes: LOOK.ember[1],
  ruins: LOOK.tide[1], thornwood: LOOK.thorn[1], savanna: LOOK.sun[1], depths: LOOK['page-depths'][1],
};
const TOWER_INK = ['#c8d8f0', '#7890b8', '#384868'];
for (const [area, [shape, ink]] of Object.entries(AREA_LOOK)) {
  LOOK[`area-${area}`] = [shape, ink, 'paw'];
  LOOK[`rares-${area}`] = [shape, ink, 'sparkle'];
  for (const [type, [tink, glyph]] of Object.entries(TYPE_LOOK)) LOOK[`sx-${area}-${type}`] = [shape, tink, glyph];
}
for (const biome of ['clearing', 'shrine', 'wastes']) LOOK[`page-${biome}`] = ['book', BIOME_INK[biome], 'ball'];
for (const biome of ['ruins', 'thornwood', 'savanna', 'depths']) LOOK[`beat-${biome}`] = ['shield', BIOME_INK[biome], 'fist'];
for (const n of [10, 20, 30, 40, 50, 60, 70, 80, 90]) LOOK[`tower-${n}`] = ['tower', TOWER_INK, `t${n}`];
LOOK['tower-100'] = ['tower', ['#fff4a0', '#d8b830', '#7a6410'], 't100'];
for (const n of [1, 5, 10, 15, 20, 30, 40, 50]) LOOK[`guardians-${n}`] = ['shield', ['#f0e0b0', '#a88c58', '#584020'], `n${n}`];
for (const n of [5, 10, 15, 20]) LOOK[`rare-${n}`] = ['gem', LOOK['rare-catch'][1], `n${n}`];
LOOK['safari-open'] = ['shield', LOOK.safari[1], 'ball'];
LOOK['master-ball'] = ['circle', ['#e8b8ff', '#9848c8', '#4c1870'], 'ball'];

const INK = '#181820';

const at = ([x, y]) => `${+(x * 2 + 2).toFixed(2)},${+(y * 2 + 2).toFixed(2)}`;
function outline(shape) {
  if (shape === 'circle') return `<circle cx="18" cy="18" r="15.2"/>`;
  if (shape === 'book') return `<rect x="4.8" y="4.8" width="26.4" height="26.4" rx="${ROUND.book}"/>`;
  return `<polygon points="${SHAPES[shape].map(at).join(' ')}"/>`;
}

const painted = new Map();
/** A badge's vector art as an SVG data URL (also its shine's mask): earned in colour, locked as a dark outline. */
export function badgeArt(id, earned) {
  const key = `${id}:${earned}`;
  if (painted.has(key)) return painted.get(key);
  const [shape, [hi, mid, lo], glyph] = LOOK[id] ?? LOOK.champion;
  const body = outline(shape);
  const svg = earned
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
      <defs><linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="${mid}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
      <clipPath id="c">${body}</clipPath></defs>
      <g fill="url(#f)">${body}</g>
      <g clip-path="url(#c)"><g fill="none" stroke="${hi}" stroke-width="2" opacity=".75" transform="translate(1.2 1.2)">${body}</g>
      <ellipse cx="12" cy="9" rx="11" ry="6" transform="rotate(-28 12 9)" fill="#fff" opacity=".28"/></g>
      ${glyph ? G[glyph](shadeInk(lo), hi) : ''}
      <g fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round">${body}</g></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><g fill="#26262f" stroke="#5a5a70" stroke-width="1.8" stroke-linejoin="round">${body}</g></svg>`;
  const url = `data:image/svg+xml,${encodeURIComponent(svg.replace(/\n\s*/g, ''))}`;
  painted.set(key, url);
  return url;
}
// a glyph is a touch darker than the badge's dark rim, so it reads on the mid colour
const shadeInk = (hex) => `#${[1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.7).toString(16).padStart(2, '0')).join('')}`;

/* ---------- the card's colour: it steps up with badges ---------- */

const EARNABLE = BADGES.filter(b => !b.locked);
const TIERS = [
  { id: 'green', name: 'Green', at: 0 },
  { id: 'bronze', name: 'Bronze', at: 10 },
  { id: 'silver', name: 'Silver', at: 25 },
  { id: 'gold', name: 'Gold', at: 40 },
];
const earnedIds = (save) => new Set((save.badges || []).filter(id => EARNABLE.some(b => b.id === id)));
/** The card's colour from the badges earned; violet once Eternatus is beaten. */
export function cardTier(save = getSave()) {
  const earned = earnedIds(save);
  if (earned.has('depths')) return { id: 'violet', name: 'Violet', next: null };
  const i = TIERS.findLastIndex(t => earned.size >= t.at);
  const up = TIERS[i + 1];
  return { ...TIERS[i], next: up ? `${up.at - earned.size} more badge${up.at - earned.size === 1 ? '' : 's'} for a ${up.name} card` : null };
}

/* ---------- play time ---------- */

/** Counts play time into stats.playMs while the page is visible, every half minute and as the page hides. */
export function initPlayTime() {
  let last = document.hidden ? 0 : performance.now();
  const tick = () => {
    const now = performance.now();
    if (last) addPlayTime(Math.min(now - last, 60000));   // a timer frozen by a sleeping device doesn't count
    last = document.hidden ? 0 : now;
  };
  setInterval(tick, 30000);
  document.addEventListener('visibilitychange', tick);
  addEventListener('pagehide', tick);
}
const playTime = (ms = 0) => {
  const min = Math.floor(ms / 60000);
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;
};

/* ---------- the window ---------- */

/** The starter it picks by itself: the one with the most wins (a Level 5 win counts big), else Charmander. */
function autoPartner(save) {
  const s = save.stats;
  const score = (id) => (s.winsBy?.[id] || 0) + 10 * (s.level5WinsBy?.[id] || 0);
  const best = STARTERS.filter(st => score(st.id) > 0).sort((a, b) => score(b.id) - score(a.id))[0];
  return best ? { starter: best, stage: best.line.length - 1 } : { starter: STARTERS_BY_ID.charmander, stage: 0 };
}

/** Every Pokémon the card can show, by group: your starters at each stage, the Pokédex's defeated, the Safari's caught.
    Keys are what `save.partner` holds: 'starter:<id>:<stage>[:shiny]' or 'mon:<enemy id>'. A starter whose shiny you own
    comes both ways, each pointing at the other as its `twin` (the card's ✨ toggle); only starters have shiny sprites. */
export function partnerChoices(save = getSave()) {
  const mon = (id) => ENEMY_DEFS[id] && { key: `mon:${id}`, src: ENEMY_DEFS[id].image, name: ENEMY_DEFS[id].name };
  const owned = new Set(save.shiny?.owned || []);
  const form = (st, stage, shiny) => ({
    key: `starter:${st.id}:${stage}${shiny ? ':shiny' : ''}`, src: spriteUrl(st, 'front', stage, shiny),
    name: `${shiny ? 'Shiny ' : ''}${st.line[stage].name}`, shiny,
    twin: owned.has(st.id) ? `starter:${st.id}:${stage}${shiny ? '' : ':shiny'}` : null,
  });
  const mine = STARTERS.filter(isStarterUnlocked);
  const starters = mine.flatMap(st => st.line.map((_, stage) => form(st, stage, false)));
  const shinies = mine.filter(st => owned.has(st.id)).flatMap(st => st.line.map((_, stage) => form(st, stage, true)));
  const defeated = new Set(save.dex.defeated);
  const dex = [...DEX_PAGES, ...BONUS_PAGES, DEPTHS_PAGE].flatMap(p => p.ids).filter(id => defeated.has(id)).map(mon).filter(Boolean);
  const caught = new Set(save.safariDex?.caught || []);
  const safari = SAFARI_DEX_PAGES.flatMap(p => p.ids).filter(id => caught.has(id)).map(mon).filter(Boolean);
  return [
    { name: 'Starters', mons: starters },
    { name: 'Shiny', mons: shinies },
    { name: 'Pokédex', mons: dex },
    { name: 'Safari', mons: [...new Map(safari.map(m => [m.key, m])).values()] },
  ].filter(g => g.mons.length);
}

/** The Pokémon on the card, cover and ID strip: the one chosen (`save.partner`) while it's still yours, else autoPartner(). */
export function partner(save) {
  const chosen = save.partner && partnerChoices(save).flatMap(g => g.mons).find(m => m.key === save.partner);
  if (chosen) return chosen;
  const { starter, stage } = autoPartner(save);
  const shiny = isShiny(starter.id);
  const twin = (save.shiny?.owned || []).includes(starter.id) ? `starter:${starter.id}:${stage}${shiny ? '' : ':shiny'}` : null;
  return { key: null, src: spriteUrl(starter, 'front', stage), name: starter.line[stage].name, shiny, twin };
}

/** The picker over the card's body: Auto, then a grid per group; a tap saves it and calls `done`. */
function partnerPicker(body, done) {
  const save = getSave();
  const current = partner(save).key;
  const head = el('div', 'tc-head');
  head.append(el('h2', 'tc-title', 'PARTNER'));
  const back = el('button', 'tc-pick-back', 'Back');
  back.type = 'button';
  back.addEventListener('click', done);
  head.append(back);
  const pick = (key) => {
    updateSave(d => { d.partner = key; });
    playSound('confirm');
    done();
  };
  const auto = el('button', `tc-pick-auto${current ? '' : ' on'}`, 'Auto: the starter with the most wins');
  auto.type = 'button';
  auto.addEventListener('click', () => pick(null));
  const groups = partnerChoices(save).map(g => {
    const box = el('div', 'tc-pick-group');
    const grid = el('div', 'tc-pick-grid');
    grid.append(...g.mons.map(m => {
      const btn = el('button', `tc-pick${m.key === current ? ' on' : ''}`);
      btn.type = 'button';
      btn.title = m.name;
      btn.setAttribute('aria-label', m.name);
      const img = el('img', 'pixel');
      img.src = m.src;
      img.alt = '';
      img.loading = 'lazy';
      img.draggable = false;
      btn.append(img);
      btn.addEventListener('click', () => pick(m.key));
      return btn;
    }));
    box.append(el('span', 'tc-case-label', `${g.name.toUpperCase()} · ${g.mons.length}`), grid);
    return box;
  });
  body.replaceChildren(head, auto, ...groups);
  head.querySelector('h2').tabIndex = -1;
  body.scrollTop = 0;
}

const hintFor = (b, save) => {
  if (b.secret && !(save.unlocked || []).includes('mewtwo')) return 'A secret badge. Something sleeps behind the Sealed Gate...';
  return b.locked ? b.text : `Not earned yet. ${b.text}.`;
};

const popped = new Set();   // new badges whose pop-in has played this page load: their "!" stays, the show doesn't repeat

/** A new badge seen: its "!" goes, and so does its group's, the device lid's and the title's / Bag's once none is left. */
function markSeen(ids) {
  updateSave(d => { d.badgesSeen = [...new Set([...(d.badgesSeen || []), ...ids])]; });
  showBadgeNews();
}

function badgeButton(b, save, earned, fresh, i) {
  const btn = el('button', `tc-badge${earned ? ' earned' : ' locked'}${fresh ? ' new' : ''}${fresh && !popped.has(b.id) ? ' fresh' : ''}`);
  btn.dataset.badge = b.id;
  btn.type = 'button';
  const art = badgeArt(b.id, earned);
  btn.style.setProperty('--art', `url(${art})`);
  btn.style.setProperty('--i', i);
  const img = el('img', 'tc-badge-art');
  img.src = art;
  img.alt = '';
  btn.append(img);
  if (fresh) btn.append(el('span', 'tc-new', '!'));
  const name = earned ? b.name : (b.secret && !(save.unlocked || []).includes('mewtwo') ? '???' : b.name);
  btn.setAttribute('aria-label', `${name}: ${earned ? 'earned' : 'not earned'}`);
  btn.addEventListener('click', () => {
    tipAt(btn, earned ? `${b.name}: earned! ${b.text}.` : `${name}: ${hintFor(b, save)}`);
    if (!btn.classList.contains('new')) return;
    btn.classList.remove('new');
    btn.querySelector('.tc-new')?.remove();
    const row = btn.closest('.tc-row');
    if (row && !row.querySelector('.tc-badge.new')) row.classList.remove('new');
    if (!btn.closest('.tc-case')?.querySelector('.tc-badge.new')) btn.closest('.tc-case')?.parentElement?.querySelector('.tc-seen-all')?.remove();
    markSeen([b.id]);
  });
  return btn;
}

export function openTrainerCard(into = null, { reopen = false } = {}) {   // `into`: draw it there (the Collection device's screen), no window
  const save = getSave();
  const s = save.stats;
  const tier = cardTier(save);
  const earned = earnedIds(save);
  const seen = new Set(save.badgesSeen || []);
  const fresh = [...earned].filter(id => !seen.has(id));
  const dialog = into ?? $('trainer-dialog');
  dialog.dataset.tier = tier.id;

  const dexTotal = DEX_PAGES.reduce((n, p) => n + p.ids.length, 0);
  const dex = save.dex.defeated.filter(id => DEX_PAGES.some(p => p.ids.includes(id))).length;
  const safari = safariOpen(save) ? safariDexCount() : null;
  const stars = Object.values(s.level5WinsBy || {}).filter(n => n > 0).length;
  const lines = [
    ['NAME', trainerName().toUpperCase()],
    ['WINS', String(s.runsWon)],
    ['POKéDEX', `${dex}/${dexTotal}`],
    ['SAFARI', safari ? `${safari.caught}/${safari.total}` : '---'],
    ['STARS', stars ? '⭐'.repeat(Math.min(stars, 3)) + (stars > 3 ? `×${stars}` : '') : '-'],
    ['TIME', playTime(s.playMs)],
  ];
  const info = el('div', 'tc-info');
  const list = el('dl', 'tc-lines');
  for (const [k, v] of lines) list.append(el('dt', '', k), el('dd', '', v));
  const mate = partner(save);
  const pic = el('button', 'tc-partner');
  pic.type = 'button';
  pic.title = `${mate.name}. Tap to choose your partner`;
  pic.setAttribute('aria-label', `Partner: ${mate.name}. Choose another`);
  const img = el('img', 'pixel');
  img.src = mate.src;
  img.alt = '';
  pic.append(img, el('span', 'tc-partner-edit', '✎'));
  pic.addEventListener('click', () => {
    playSound('confirm');
    partnerPicker(body, () => openTrainerCard(into, { reopen: true }));
  });
  const frame = el('div', 'tc-partner-frame');
  frame.append(pic);
  if (mate.twin) {
    const flip = el('button', `tc-shiny${mate.shiny ? ' on' : ''}`, '✨');
    flip.type = 'button';
    flip.title = mate.shiny ? 'Shiny on: tap for its normal colours' : 'Tap for its shiny colours';
    flip.setAttribute('aria-pressed', String(!!mate.shiny));
    flip.setAttribute('aria-label', 'Shiny partner');
    flip.addEventListener('click', () => {
      updateSave(d => { d.partner = mate.twin; });
      playSound('confirm');
      openTrainerCard(into, { reopen: true });
    });
    frame.append(flip);
  }
  info.append(list, frame);

  let n = 0;
  const caseBox = el('div', 'tc-case');
  for (const group of BADGE_GROUPS) {
    const row = el('div', 'tc-row');
    const badges = el('div', 'tc-badges');
    badges.append(...BADGES.filter(b => b.group === group.id).map(b => badgeButton(b, save, earned.has(b.id), fresh.includes(b.id), fresh.includes(b.id) && !popped.has(b.id) ? n++ : 0)));
    const inGroup = BADGES.filter(b => b.group === group.id);
    if (inGroup.some(b => fresh.includes(b.id))) row.classList.add('new');
    row.append(el('span', 'tc-group', `${group.name} · ${inGroup.filter(b => earned.has(b.id)).length}/${inGroup.length}`), badges);
    caseBox.append(row);
  }

  const head = el('div', 'tc-head');
  head.append(el('h2', 'tc-title', 'TRAINER CARD'), el('span', 'tc-tier', tier.name));
  head.querySelector('h2').tabIndex = -1;
  const foot = el('p', 'tc-foot', `${earned.size}/${EARNABLE.length} badges${tier.next ? ` · ${tier.next}` : ''}`);
  const body = into ?? $('trainer-body');
  const label = el('span', 'tc-case-label', 'BADGE CASE');
  if (fresh.length > 1) {
    const all = el('button', 'tc-seen-all', 'Clear all !');
    all.type = 'button';
    all.addEventListener('click', () => {
      playSound('confirm');
      caseBox.querySelectorAll('.new').forEach(n => n.classList.remove('new'));
      caseBox.querySelectorAll('.tc-new').forEach(n => n.remove());
      all.remove();
      markSeen(fresh);
    });
    label.append(all);
  }
  body.replaceChildren(head, info, label, caseBox, foot);
  if (!into && !reopen) openDialog('trainer-dialog');
  const showing = () => (into ? into.isConnected && !into.closest('[hidden]') : dialog.open);

  // a new badge keeps its "!" till it's tapped: the case opens scrolled to the first one
  const first = caseBox.querySelector('.tc-badge.new');
  if (first && !reopen) setTimeout(() => { if (showing()) first.closest('.tc-row').scrollIntoView({ block: 'center', behavior: calmScroll() }); }, 120);
  const pops = fresh.filter(id => !popped.has(id));
  // each new badge pops in with a shine the first time the card opens after it
  pops.forEach((id, i) => { popped.add(id); setTimeout(() => { if (showing()) playSound(`crystal-${i % 3}`); }, 450 + i * 260); });
}

const calmScroll = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

/** Earned badges the card hasn't shown yet. */
export const badgeNews = (save = getSave()) => [...earnedIds(save)].some(id => !(save.badgesSeen || []).includes(id));

/** A little pixel Trainer Card in the card's colours ([data-tier] sets --tc1..3): the title's corner and the Bag's pocket. */
export function cardIcon() {
  const rects = [
    [1, 0, 14, 1, 'o'], [0, 1, 1, 10, 'o'], [15, 1, 1, 10, 'o'], [1, 11, 14, 1, 'o'],
    [1, 1, 14, 10, 'c1'], [1, 1, 14, 2, 'c2'], [2, 1, 12, 1, 'hi'],
    [2, 4, 5, 6, 'pic'], [3, 5, 3, 2, 'c3'], [2, 8, 5, 2, 'c3'],
    [8, 5, 6, 1, 'c3'], [8, 7, 4, 1, 'c3'], [12, 8, 2, 2, 'gold'],
  ];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 16 12');
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('tc-icon');
  for (const [x, y, w, h, c] of rects) {
    const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    Object.entries({ x, y, width: w, height: h, class: c }).forEach(([k, v]) => r.setAttribute(k, v));
    svg.append(r);
  }
  return svg;
}

const FIND_LISTS = { relics: RELICS, items: ITEMS, cards: ALL_CARDS };

/** A kind's new finds the Collection hasn't shown, only ones its apps list (a played Cinder or status card isn't one). */
export const newFinds = (kind, save = getSave()) => (save.newFinds?.[kind] || []).filter(id => FIND_LISTS[kind].some(t => t.id === id));

/** Anything new in the Collection device: a badge, or a relic, item or move found. */
export const deviceNews = (save = getSave()) => badgeNews(save) || Object.keys(FIND_LISTS).some(k => newFinds(k, save).length);

/** The title's card button and the Bag follow the card's colour, and glint while a new badge waits to be seen; the
    title's Pokédex sign and every Pokédex / Home key glint for anything new in the device. */
export function showBadgeNews(save = getSave()) {
  const tier = cardTier(save).id, news = badgeNews(save), any = deviceNews(save);
  for (const node of document.querySelectorAll('#title-menu .gem-dex, #bag-btn, .bag-pocket[data-pocket="trainer"]')) {
    node.dataset.tier = tier;
    node.classList.toggle('badge-news', node.classList.contains('gem-dex') ? any : news);
  }
  for (const node of document.querySelectorAll('#brand-btn, #room-home')) node.classList.toggle('dex-news', any);
  $('cdev')?.classList.toggle('news', any);
}

/** The Collection's card for it: the newest badge as its art, coloured like the card. */
export function trainerTile(save = getSave()) {
  const earned = (save.badges || []).filter(id => EARNABLE.some(b => b.id === id));
  const img = el('img', 'coll-badge');
  img.src = badgeArt(earned.at(-1) ?? 'champion', earned.length > 0);
  img.alt = '';
  const fresh = earned.some(id => !(save.badgesSeen || []).includes(id));
  return { art: img, count: `${earned.length}/${EARNABLE.length} badges${fresh ? ' · New!' : ''}`, tier: cardTier(save).id };
}
