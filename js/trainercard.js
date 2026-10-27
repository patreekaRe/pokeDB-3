/* ============================================================
   trainercard.js  -  Gold/Silver's Trainer Card (roadmap item 17b): a
   Collection card opening a window with the trainer's numbers and the
   Badge Case, six rows of badges (js/data/badges.js). The badges
   are drawn as smooth SVG from a shape and a glyph each: a gradient from a
   light top-left to a dark bottom-right, a gloss and a dark outline.
   Also keeps `stats.playMs`, the play time, counted from its release.
   ============================================================ */

import { rankOf } from './data/ranger.js';
import { journalRank } from './data/journal.js';
import { GYM_LEADERS, GYM_INK } from './data/gym.js';
import { BADGES, BADGE_GROUPS } from './data/badges.js';
import { DEX_PAGES, DEPTHS_PAGE, BONUS_PAGES, safariOpen, dexTally } from './data/pokedex.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { SAFARI_DEX_PAGES, SAFARI_ROSTER } from './data/safari.js';
import { shinyImage, sparkleOf } from './data/shinies.js';
import { isStarterUnlocked } from './progress.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { RELICS } from './data/relics.js';
import { ITEMS } from './data/items.js';
import { ALL_CARDS } from './data/cards.js';
import { getSave, updateSave, addPlayTime, isShiny } from './storage.js';
import { bestWin, starClass, starName, isMaster, wearsCrown, auraBest, aurasEarned, auraWorn } from './data/difficulty.js';
import { safariDexCount } from './safaridex.js';
import { trainerName, pickedName, setTrainerName } from './leaderboard.js';
import { NAME_MAX } from './data/leaderboard.js';
import { tipAt } from './tips.js';
import { calmFx } from './prefs.js';
import { playSound } from './audio.js';
import { $, el, openDialog, crownArt, auraArt } from './ui.js';
import { satchelNews, questNews } from './satchel.js';
import { friendsNews } from './data/friends.js';
import { townsOpen } from './data/towns.js';
import { FRIENDS, SKINS, SKIN_BY_ID, workshopOf, ownsSkin } from './data/workshop.js';
import { ball3d } from './ball-looks.js';
import { myCode, publishTrainer } from './trainers.js';
import { formatCode } from './data/trainers.js';

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
  jagged: [[8, 0], [10, 4.6], [15.6, 2.2], [12.4, 7.4], [16, 11.2], [10.6, 10.6], [8, 16], [5.4, 10.6], [0, 11.2], [3.6, 7.4], [0.4, 2.2], [6, 4.6]],
};
const ROUND = { book: 4, circle: 0 };
// outlines drawn straight on the 36x36 badge
const PATHS = {
  heart: 'M18 31.5 5.6 19A7.2 7.2 0 0 1 18 9.6 7.2 7.2 0 0 1 30.4 19Z',
  apple: 'M18 11.2C14.6 8.4 5.6 8.6 5 17.2c-.5 7.2 4.4 14 8.6 14 1.8 0 2.6-.9 4.4-.9s2.6.9 4.4.9c4.2 0 9.1-6.8 8.6-14-.6-8.6-9.6-8.8-13-6Z',
  peach: 'M18 9.4C10.6 4.8 4.2 11.4 4.6 19c.4 7.2 6.4 12.4 13.4 12.4S31 26.2 31.4 19C31.8 11.4 25.4 4.8 18 9.4Z',
  cat: 'M5 31V16.5L6.6 4.8l7.6 6.6h7.6l7.6-6.6L31 16.5V31Z',
  horns: 'M5.4 3.6Q7.6 10 10.4 12.6A11 11 0 1 0 25.6 12.6Q28.4 10 30.6 3.6 25.6 7.6 21.8 9.8A11 11 0 0 0 14.2 9.8Q10.4 7.6 5.4 3.6Z',
  door: 'M8 32V12.4a10 10 0 0 1 20 0V32Z',
  handheld: 'M9 8.6h18a5 5 0 0 1 5 5v8.8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-8.8a5 5 0 0 1 5-5Z',
};

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
  closet: (d) => `<rect x="11" y="13" width="9" height="17" rx="1" fill="${d}"/>${['#ff5050', '#ffa030', '#ffe040', '#50d060', '#4890ff', '#a060f0'].map((c, i) => `<rect x="20" y="${13 + i * 2.84}" width="4.6" height="2.9" fill="${c}"/>`).join('')}<circle cx="18" cy="21.6" r="1.1" fill="#fff"/>`,
  aplus: (d) => `<path d="M18 11.4q.4-3.4 2-5" fill="none" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="22.6" cy="7.8" rx="3" ry="1.5" fill="#6cd050" transform="rotate(-24 22.6 7.8)"/><text x="18" y="25" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="11" fill="#fff">A+</text>`,
  pacifier: (d) => `<ellipse cx="18" cy="11.8" rx="2.6" ry="2.4" fill="#fff" stroke="${d}" stroke-width="1.2"/><ellipse cx="18" cy="17" rx="8.4" ry="4.4" fill="#fff" stroke="${d}" stroke-width="1.5"/><circle cx="18" cy="17" r="2.2" fill="${d}"/><circle cx="18" cy="24.6" r="3.8" fill="none" stroke="#fff" stroke-width="2.2"/>`,
  handheld: (d) => `<rect x="12.6" y="12" width="10.8" height="12" rx="1.2" fill="#fff" stroke="${d}" stroke-width="1.4"/><text x="18" y="21.8" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="9" fill="${d}">?</text><path d="M8.4 15.8v4.4M6.2 18h4.4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="27.4" cy="16.4" r="1.4" fill="#fff"/><circle cx="25.6" cy="20" r="1.4" fill="#fff"/>`,
  curfew: (d) => `<circle cx="18" cy="18" r="10" fill="#fff" stroke="${d}" stroke-width="1.4"/><path d="M18 9.4v1.8M26.6 18h-1.8M18 26.6v-1.8M9.4 18h1.8" stroke="${d}" stroke-width="1.4" stroke-linecap="round"/><path d="M18 18 15.6 13.8M18 18V11.2" stroke="${d}" stroke-width="1.8" stroke-linecap="round"/><circle cx="18" cy="18" r="1.3" fill="#e84040"/>`,
  peach: (d) => `<path d="M18 9.8q-4.4 9 0 21" fill="none" stroke="${d}" stroke-width="1.4" stroke-linecap="round" opacity=".55"/><ellipse cx="21.6" cy="7" rx="3.6" ry="1.7" fill="#5cc048" stroke="${d}" stroke-width=".8" transform="rotate(-18 21.6 7)"/><path d="M26 13.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" fill="#fff"/>`,
  headset: () => `<path d="M10.4 21v-2.4a7.6 7.6 0 0 1 15.2 0V21" fill="none" stroke="#fff" stroke-width="2.4"/><rect x="8.4" y="19" width="4.4" height="7" rx="1.8" fill="#fff"/><rect x="23.2" y="19" width="4.4" height="7" rx="1.8" fill="#fff"/><path d="M11.2 25.6q1.6 4 6 3.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="18" cy="29.2" r="1.5" fill="#fff"/>`,
  note: (d) => `<g transform="translate(18.6 16.6) scale(.82) translate(-18.6 -18.6)"><path d="M15.4 25V13.2l9-2.2v11" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M15.4 13.2l9-2.2v2.6l-9 2.2Z" fill="#fff"/><ellipse cx="13.4" cy="25" rx="2.8" ry="2.1" fill="#fff" stroke="${d}" stroke-width=".8"/><ellipse cx="22.4" cy="22" rx="2.8" ry="2.1" fill="#fff" stroke="${d}" stroke-width=".8"/></g>`,
  catface: (d) => `<path d="M10.6 18.4q2.6-2.4 5.2 0-2.6 2.4-5.2 0ZM20.2 18.4q2.6-2.4 5.2 0-2.6 2.4-5.2 0Z" fill="#ffe060" stroke="${d}" stroke-width=".9"/><path d="M13.2 16.8v3.2M22.8 16.8v3.2" stroke="${d}" stroke-width="1.2" stroke-linecap="round"/><path d="M16.6 22.4h2.8L18 24Z" fill="#ff8cb4"/><path d="M18 24q-1.2 1.6-2.6.6M18 24q1.2 1.6 2.6.6M6.8 22.6l6 .4M6.8 25.4l6-.8M29.2 22.6l-6 .4M29.2 25.4l-6-.8" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round"/>`,
  demoneye: (d) => `<path d="M9 20q9-8.4 18 0-9 8.4-18 0Z" fill="#ffe8f0" stroke="${d}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="18" cy="20" r="3.6" fill="#e01848"/><path d="M18 17v6" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>`,
  mug: (d) => `<path d="M10.6 15.4h11.6v9.4a3 3 0 0 1-3 3h-5.6a3 3 0 0 1-3-3Z" fill="#fff" stroke="${d}" stroke-width="1.3"/><path d="M22.2 17.4h1.6a2.6 2.6 0 0 1 0 5.2h-1.6" fill="none" stroke="#fff" stroke-width="1.8"/><path d="M14 13q-1.4-1.8 0-3.6M18.6 13q-1.4-1.8 0-3.6" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".85"/><path d="M27.6 8.4a3.4 3.4 0 1 0 2 5.8 2.8 2.8 0 0 1-2-5.8Z" fill="#fff4b0"/>`,
  katana: (d) => `<path d="M10.6 25.4 27.4 8.6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M11.4 21.6l4 4" stroke="#ffd060" stroke-width="2" stroke-linecap="round"/><path d="M12.2 23.8 7.4 28.6" stroke="${d}" stroke-width="3" stroke-linecap="round"/><path d="M12.2 23.8 7.4 28.6" stroke="#e03040" stroke-width="1" stroke-dasharray="1 1.2"/>`,
  vi: (d) => `<text x="18" y="24.4" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="15" fill="#fff" stroke="${d}" stroke-width=".9" font-style="italic">VI</text>`,
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
  'star-depths': ['star', ['#f4f0ff', '#b080f0', '#482090'], 'sparkle'],
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
  'corner-jackpot': ['octagon', ['#ff9c9c', '#d83040', '#701020'], 'coin'],
  'corner-plinko': ['hex', ['#a8e8ff', '#3aa8d8', '#145878'], 'ball'],
  'corner-blackjack': ['shield', ['#a8e0b8', '#2a8a58', '#104828'], 'cards'],
  'corner-highlow': ['diamond', ['#fff090', '#f0c030', '#a07010'], 'cards'],
  'corner-voltorb': ['circle', ['#ff9890', '#e04040', '#801818'], 'ball'],
  'corner-quiz': ['book', ['#b8d0ff', '#4a90f0', '#1c4890'], 'eye'],
  'corner-tickets': ['circle', ['#ffc8e0', '#f070a8', '#902858'], 'sparkle'],
  'corner-prizes': ['crown', ['#fff090', '#f0c030', '#a07010']],
};

// the badges made in bulk: a Safari area's shape and colours, a type's colours and glyph, a biome's colours
const AREA_LOOK = {
  meadow: ['circle', ['#eef8a8', '#a8c838', '#566818']],
  forest: ['octagon', ['#a8e098', '#3c8a3c', '#18441c']],
  wetland: ['hex', ['#a8e0ff', '#4890d0', '#1c4878']],
  marsh: ['shield', ['#c8e0b8', '#6a8c68', '#2c4430']],
  peak: ['diamond', ['#f0f8ff', '#a8b8d0', '#4c5870']],
  desert: ['gem', ['#ffe0a0', '#e0a048', '#7a4c18']],
  powerplant: ['hex', ['#fff4a0', '#e8c020', '#5a4a10']],
  icecave: ['gem', ['#f0faff', '#90cce8', '#2a5878']],
  dojomountain: ['octagon', ['#ffe0c8', '#d8743c', '#6a3420']],
  quarry: ['gem', ['#f4e0c0', '#c09058', '#5a3c20']],
  windycliffs: ['hex', ['#f0f8ff', '#7ab8e0', '#1e4a70']],
  nightalley: ['octagon', ['#f4ecff', '#8a6cc0', '#2a1e44']],
};
const TYPE_LOOK = {
  fire: [LOOK.fire[1], 'flame'], water: [LOOK.water[1], 'drop'], grass: [LOOK.grass[1], 'leafy'],
  normal: [['#f4f0e4', '#b8b098', '#5c5644'], 'paw'], psychic: [['#ffc8f0', '#d058b0', '#701c58'], 'eye'],
};
export const BIOME_INK = {
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
// the Gym Badges: each one after its leader's personality, its own shape and glyph (its colours are GYM_INK in js/data/gym.js)
const GYM_LOOK = {
  lawrence: ['door', 'closet'],     // the rainbow he keeps from his wife
  britt: ['apple', 'aplus'],        // the teacher's apple
  nietos: ['circle', 'pacifier'],   // baby Linc's
  john: ['handheld', 'handheld'],   // which handheld, though?
  jahmes: ['circle', 'curfew'],     // bed at 11 sharp
  clarence: ['peach', 'peach'],     // the show for the boys
  shaun: ['hex', 'headset'],        // the IGL's comms
  pat: ['heart', 'note'],           // Lemonade, sung by accident
  kayl: ['cat', 'catface'],         // Spooky and Reya, in lavender
  phil: ['horns', 'demoneye'],      // JONA
  ricky: ['octagon', 'mug'],        // 2 a.m. games, 9 a.m. meetings
  machew: ['jagged', 'katana'],     // the plastic katana
  jerome: ['book', 'vi'],           // GTA VI
};
for (const l of GYM_LEADERS) LOOK[`gym-${l.id}`] = GYM_LOOK[l.id] ? [GYM_LOOK[l.id][0], GYM_INK[l.id], GYM_LOOK[l.id][1]] : ['circle', BIOME_INK[l.biome]];
// a Gold badge is its badge's shape and glyph in gold
for (const l of GYM_LEADERS) LOOK[`gym-${l.id}-gold`] = [LOOK[`gym-${l.id}`][0], ['#fff6b8', '#f0bc30', '#7a4c08'], LOOK[`gym-${l.id}`][2]];
// a Friendship badge is a heart in its friend's colours, their Gym Badge's glyph on it (Pat's Gym Badge is a heart already,
// so his friendship one wears a heart); the Best Friends badge a gold crown
for (const id of FRIENDS) LOOK[`friend-${id}`] = ['heart', GYM_INK[id], GYM_LOOK[id][0] === 'heart' ? 'heart' : GYM_LOOK[id][1]];
LOOK['best-friends'] = ['crown', ['#fff6b8', '#f0bc30', '#7a4c08'], 'heart'];
LOOK['safari-open'] = ['shield', LOOK.safari[1], 'ball'];
// the Ranger ranks, Scout to Master Ranger: jungle green climbing to gold, the shape growing grander
[['circle', ['#b8e090', '#5a9a48', '#2e5426'], 'paw'], ['shield', ['#b8e090', '#4a8a3a', '#24481c'], 'compass'],
  ['hex', ['#d8e8a0', '#7aa848', '#3a5a20'], 'leafy'], ['gem', ['#f0e0a0', '#b8a048', '#5a4a18'], 'compass'],
  ['crown', ['#fff0a0', '#e0b840', '#8a6a10'], 'paw'], ['star', ['#fff6c0', '#f0c838', '#9a7010'], 'sparkle']]
  .forEach((look, i) => { LOOK[`ranger-${i + 2}`] = look; });
// the Journal ranks, Novice to Champion: a leather red climbing to gold
[['circle', ['#f0b0a0', '#c84838', '#7a1c14'], 'cards'], ['shield', ['#f0b0a0', '#b83828', '#6a1810'], 'compass'],
  ['hex', ['#f8c8a0', '#d06030', '#7a3010'], 'aplus'], ['gem', ['#f8d8a0', '#d89038', '#7a4a10'], 'cards'],
  ['crown', ['#fff0a0', '#e0b840', '#8a6a10'], 'aplus'], ['star', ['#fff6c0', '#f0c838', '#9a7010'], 'sparkle']]
  .forEach((look, i) => { LOOK[`journal-${i + 2}`] = look; });
LOOK['master-ball'] = ['circle', ['#e8b8ff', '#9848c8', '#4c1870'], 'ball'];

const INK = '#181820';

const at = ([x, y]) => `${+(x * 2 + 2).toFixed(2)},${+(y * 2 + 2).toFixed(2)}`;
function outline(shape) {
  if (shape === 'circle') return `<circle cx="18" cy="18" r="15.2"/>`;
  if (PATHS[shape]) return `<path d="${PATHS[shape]}"/>`;
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
export const TIERS = [
  { id: 'green', name: 'Green', at: 0 },
  { id: 'bronze', name: 'Bronze', at: 10 },
  { id: 'silver', name: 'Silver', at: 25 },
  { id: 'gold', name: 'Gold', at: 40 },
];
const earnedIds = (save) => new Set((save.badges || []).filter(id => EARNABLE.some(b => b.id === id)));
/** A badge the card may pin for friends to see (`save.pinBadge`): earned, and never one of the Depths' secret ones. */
export const pinnable = (id, save = getSave()) => !!id && earnedIds(save).has(id) && !BADGES.find(b => b.id === id)?.secret;
/** The badge in a group's slot on the Pokédex cover: the one set for it (`save.coverBadges`), else the pinned one if it's
    in the group, else the last earned in the group's list order. */
export function coverBadge(groupId, save = getSave()) {
  const have = earnedIds(save);
  const mine = EARNABLE.filter(b => b.group === groupId && have.has(b.id));
  const pin = pinnable(save.pinBadge, save) ? save.pinBadge : null;
  return mine.find(b => b.id === save.coverBadges?.[groupId]) ?? mine.find(b => b.id === pin) ?? mine.at(-1) ?? null;
}
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

/** STARS: up to three stars, the starters' best first, each tinted by its best Level won (gold at 5, a rainbow at 10). */
function starRow(save) {
  const best = Object.keys(save.stats.level5WinsBy || {}).concat((save.hallOfFame || []).map(w => w.starter))
    .filter((id, i, all) => id !== 'mewtwo' && all.indexOf(id) === i).map(id => bestWin(save, id)).filter(lv => lv >= 5).sort((a, b) => b - a);
  const dd = el('dd', '');
  for (const lv of best.slice(0, 3)) dd.append(el('span', starClass(lv), '⭐'));
  if (best.length > 3) dd.append(`×${best.length}`);
  return dd;
}

/** The starter it picks by itself: the one with the most wins (a Level 5 win counts big), else Charmander. */
function autoPartner(save) {
  const s = save.stats;
  const score = (id) => (s.winsBy?.[id] || 0) + 10 * (s.level5WinsBy?.[id] || 0);
  const best = STARTERS.filter(st => score(st.id) > 0).sort((a, b) => score(b.id) - score(a.id))[0];
  return best ? { starter: best, stage: best.line.length - 1 } : { starter: STARTERS_BY_ID.charmander, stage: 0 };
}

/** Safari shinies owned (the Trainer Card's SHINIES). */
export const shinyTotal = (save) => SAFARI_ROSTER.filter(id => sparkleOf(save.safariShinies, id)).length;

/** Every Pokémon the card can show, by group: your starters at each stage, the Pokédex's defeated, the Safari's caught.
    Keys are what `save.partner` holds: 'starter:<id>:<stage>[:shiny]' or 'mon:<enemy id>[:shiny]'. A starter or Safari
    Pokémon whose shiny you own comes both ways, each pointing at the other as its `twin` (the card's ✨ toggle). */
export function partnerChoices(save = getSave()) {
  const mon = (id) => ENEMY_DEFS[id] && { key: `mon:${id}`, src: ENEMY_DEFS[id].image, name: ENEMY_DEFS[id].name, twin: safariShiny(id) ? `mon:${id}:shiny` : null };
  const shinyMon = (id) => ENEMY_DEFS[id] && { key: `mon:${id}:shiny`, src: shinyImage(id), name: `Shiny ${ENEMY_DEFS[id].name}`, shiny: true, twin: `mon:${id}` };
  const safariShiny = (id) => sparkleOf(save.safariShinies, id) > 0;
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
  const safariShinies = [...new Set(SAFARI_DEX_PAGES.flatMap(p => p.ids))].filter(safariShiny).map(shinyMon).filter(Boolean);
  return [
    { name: 'Starters', mons: starters },
    { name: 'Shiny', mons: [...shinies, ...safariShinies] },
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

/** The partner as a `save.partner` key, picked or not (the Trainers app's page, js/trainers.js). */
export function partnerKey(save = getSave()) {
  const m = partner(save);
  if (m.key) return m.key;
  const { starter, stage } = autoPartner(save);
  return `starter:${starter.id}:${stage}${m.shiny ? ':shiny' : ''}`;
}

/** Who may walk with you in the Clearing, the Secret Base and the Poké Mall (the PC's walking buddy, the user's call,
    2026-10-09): the first form of every starter you own, no legendaries (their sprites are too big to walk about), and
    each one's shiny once bought. Keys are 'starter:<id>[:shiny]'. */
export function buddyChoices(save = getSave()) {
  const owned = new Set(save.shiny?.owned || []);
  const form = (st, shiny) => ({ key: `starter:${st.id}${shiny ? ':shiny' : ''}`, id: st.id, cry: st.line[0].id, src: spriteUrl(st, 'front', 0, shiny), name: `${shiny ? 'Shiny ' : ''}${st.line[0].name}`, shiny });
  const mine = STARTERS.filter(st => !st.legendary && isStarterUnlocked(st));
  return [...mine.map(st => form(st, false)), ...mine.filter(st => owned.has(st.id)).map(st => form(st, true))];
}

/** The Pokémon walking with you: the PC's pick (`save.buddy`) while it's still yours, else the first form of the
    starter with the most wins, as its shiny switch says. Never the Pokédex's partner: that one only shows on the device. */
export function buddy(save = getSave()) {
  const all = buddyChoices(save);
  const chosen = save.buddy && all.find(m => m.key === save.buddy);
  if (chosen) return { ...chosen, crown: crownOn, aura: auraOn };
  const s = save.stats, score = (id) => (s.winsBy?.[id] || 0) + 10 * (s.level5WinsBy?.[id] || 0);
  const plain = all.filter(m => !m.shiny), best = [...plain].sort((a, b) => score(b.id) - score(a.id))[0] ?? plain[0];
  const st = STARTERS_BY_ID[best?.id ?? 'charmander'], shiny = isShiny(st.id) && (save.shiny?.owned || []).includes(st.id);
  return { key: null, id: st.id, cry: st.line[0].id, src: spriteUrl(st, 'front', 0, shiny), name: st.line[0].name, shiny, crown: crownOn, aura: auraOn };
}

/** Whether the walking buddy wears the Champion's Crown right now: js/hd2d.js's drawMon() asks each frame, so the Trainer
    Card's Crown key shows at once. */
const crownOn = () => wearsCrown(getSave());
/** The Level of the Super Saiyan aura it wears (0: none), asked each frame the same way. */
const auraOn = () => auraWorn(getSave());


/** The walking buddy as a `save.buddy` key, picked or not. */
export const buddyKey = (save = getSave()) => { const b = buddy(save); return b.key ?? `starter:${b.id}${b.shiny ? ':shiny' : ''}`; };

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
  const pick = (key, btn) => {
    updateSave(d => { d.partner = key; });
    playSound('confirm');
    body.querySelectorAll('.tc-pick.on, .tc-pick-auto.on').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
  };
  const auto = el('button', `tc-pick-auto${current ? '' : ' on'}`, 'Auto: the starter with the most wins');
  auto.type = 'button';
  auto.addEventListener('click', () => pick(null, auto));
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
      btn.addEventListener('click', () => pick(m.key, btn));
      return btn;
    }));
    box.append(el('span', 'tc-case-label', `${g.name.toUpperCase()} · ${g.mons.length}`), grid);
    return box;
  });
  // players mixed the two up (2026-10-11): this one is the card's and the cover's, the one walking about is the PC's
  const note = el('p', 'tc-pick-note', 'Your partner shows on your Pokédex cover and this Trainer Card. The Pokémon that walks with you outside is your walking buddy: choose it at the PC in the Clearing.');
  body.replaceChildren(head, note, auto, ...groups);
  head.querySelector('h2').tabIndex = -1;
  body.scrollTop = 0;
}

/** The badge picker over the card's body: None, then every earned badge you may pin; a tap saves it, puts it on your
    Trainers page and calls `done`. */
function pinPicker(body, done) {
  const save = getSave();
  const head = el('div', 'tc-head');
  head.append(el('h2', 'tc-title', 'PIN A BADGE'));
  const back = el('button', 'tc-pick-back', 'Back');
  back.type = 'button';
  back.addEventListener('click', done);
  head.append(back);
  const pick = (id) => {
    updateSave(d => { d.pinBadge = id; });
    playSound('confirm');
    publishTrainer();
    done();
  };
  const none = el('button', `tc-pick-auto${pinnable(save.pinBadge, save) ? '' : ' on'}`, 'None');
  none.type = 'button';
  none.addEventListener('click', () => pick(null));
  const grid = el('div', 'tc-pick-grid');
  grid.append(...EARNABLE.filter(b => pinnable(b.id, save)).map(b => {
    const btn = el('button', `tc-pick${b.id === save.pinBadge ? ' on' : ''}`);
    btn.type = 'button';
    btn.title = b.name;
    btn.setAttribute('aria-label', `Pin ${b.name}`);
    const img = el('img', '');
    img.src = badgeArt(b.id, true);
    img.alt = '';
    img.draggable = false;
    btn.append(img);
    btn.addEventListener('click', () => pick(b.id));
    return btn;
  }));
  const note = el('p', 'tc-pick-note', 'Your pinned badge shows on your page in other trainers\' Trainers app, beside your partner.');
  body.replaceChildren(head, note, none, ...(grid.children.length ? [grid] : [el('p', 'tc-pick-note', 'Earn a badge first!')]));
  head.querySelector('h2').tabIndex = -1;
  body.scrollTop = 0;
}

/** The cover picker over the card's body (the user's ask, 2026-10-27: choose the cover's 12 badges): a row per badge
    group with any earned, Auto first; a tap sets that group's slot and the picker stays open for the next. */
function coverPicker(body, done) {
  const save = getSave();
  const head = el('div', 'tc-head');
  head.append(el('h2', 'tc-title', 'YOUR COVER'));
  const back = el('button', 'tc-pick-back', 'Back');
  back.type = 'button';
  back.addEventListener('click', done);
  head.append(back);
  const earned = earnedIds(save);
  const groups = BADGE_GROUPS.map(g => {
    const mine = EARNABLE.filter(b => b.group === g.id && earned.has(b.id));
    if (!mine.length) return null;
    const set = mine.some(b => b.id === save.coverBadges?.[g.id]) ? save.coverBadges[g.id] : null;
    const grid = el('div', 'tc-pick-grid');
    const pick = (id, btn) => {
      updateSave(d => {
        d.coverBadges = { ...d.coverBadges };
        if (id) d.coverBadges[g.id] = id; else delete d.coverBadges[g.id];
      });
      playSound('confirm');
      grid.querySelectorAll('.tc-pick.on').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
    };
    const auto = el('button', `tc-pick tc-pick-word${set ? '' : ' on'}`, 'AUTO');
    auto.type = 'button';
    auto.title = 'Auto: your pinned badge if it\'s in this group, else the newest';
    auto.addEventListener('click', () => pick(null, auto));
    grid.append(auto, ...mine.map(b => {
      const btn = el('button', `tc-pick${b.id === set ? ' on' : ''}`);
      btn.type = 'button';
      btn.title = b.name;
      btn.setAttribute('aria-label', `Show ${b.name} on the cover`);
      const img = el('img', '');
      img.src = badgeArt(b.id, true);
      img.alt = '';
      img.draggable = false;
      btn.append(img);
      btn.addEventListener('click', () => pick(b.id, btn));
      return btn;
    }));
    const box = el('div', 'tc-pick-group');
    box.append(el('span', 'tc-case-label', `${g.name.toUpperCase()} · ${mine.length}`), grid);
    return box;
  }).filter(Boolean);
  const note = el('p', 'tc-pick-note', 'Your Pokédex cover has a slot for each badge group. Choose the badge each one shows.');
  body.replaceChildren(head, note, ...(groups.length ? groups : [el('p', 'tc-pick-note', 'Earn a badge first!')]));
  head.querySelector('h2').tabIndex = -1;
  body.scrollTop = 0;
}

/** The ball picker over the card's body (2026-10-27, the user's yes: a quicker place than Kurt's bench): the plain Poké
    Ball, every Apricorn ball you own, then Kurt's seven still to get, greyed, each named under it; a tap carries it and
    the picker stays open. Put away (the user's ask, 2026-10-27) goes back to the plain ball. */
function ballPicker(body, done) {
  const ws = workshopOf(getSave());
  const head = el('div', 'tc-head');
  head.append(el('h2', 'tc-title', 'YOUR BALL'));
  const back = el('button', 'tc-pick-back', 'Back');
  back.type = 'button';
  back.addEventListener('click', done);
  head.append(back);
  const now = el('div', 'tc-pick-note tc-ball-now'), line = el('span', '');
  const away = el('button', 'tc-pick-back tc-ball-away', 'Put away');
  away.type = 'button';
  away.title = 'Back to the plain Poké Ball';
  now.append(line, away);
  const say = (skin) => { line.textContent = `Carrying: ${SKIN_BY_ID[skin]?.name ?? 'Poké Ball'}.`; away.hidden = !skin; };
  say(ws.skin);
  const grid = el('div', 'tc-pick-grid tc-ball-grid');
  const carry = (skin) => {
    updateSave(d => { d.workshop = { ...workshopOf(d), skin }; });
    grid.querySelectorAll('.tc-pick').forEach(b => b.classList.toggle('on', (b.dataset.skin || null) === skin));
    say(skin);
  };
  away.addEventListener('click', () => { playSound('cancel'); carry(null); });
  const tile = (skin, sprite, name, owned, hint) => {
    const btn = el('button', `tc-pick tc-ball${(ws.skin ?? null) === skin ? ' on' : ''}${owned ? '' : ' locked'}`);
    btn.type = 'button';
    if (skin) btn.dataset.skin = skin;
    btn.title = owned ? name : `${name}: ${hint}`;
    btn.setAttribute('aria-label', owned ? `Carry the ${name}` : `${name}, not yours yet`);
    btn.append(ball3d(sprite), el('span', 'tc-ball-name', skin ? name.replace(/ Ball$/, '') : 'Plain'));
    btn.addEventListener('click', () => {
      if (!owned) { playSound('no-pp'); line.textContent = `${name}: ${hint}`; return; }
      playSound('confirm');
      carry(skin);
    });
    return btn;
  };
  grid.append(tile(null, 'poke-ball', 'Poké Ball', true),
    ...SKINS.filter(r => ownsSkin(ws, r)).map(r => tile(r.makes, r.sprite, r.name, true)),
    ...SKINS.filter(r => !r.secret && !ownsSkin(ws, r)).map(r => tile(r.makes, r.sprite, r.name, false, 'Kurt\'s Workshop makes it, and the Safari Outfitter sells one Apricorn ball a day.')));
  const note = el('p', 'tc-pick-note', 'Your partner comes out of this ball at the start of every battle, and your Safari Balls wear it. Looks only: every ball throws the same.');
  body.replaceChildren(head, note, now, grid);
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

/** NAME on the card: a tap turns it into a box (the user's ask, 2026-10-08), the same nickname as Settings' Trainer box and
    the leaderboards. Enter, OK or a tap away keeps it; Escape leaves it as it was. */
function nameField(redraw) {
  const dd = el('dd', 'tc-name');
  const show = el('button', 'tc-name-btn');
  show.type = 'button';
  show.title = 'Tap to change your name';
  show.setAttribute('aria-label', `Name: ${trainerName()}. Change it`);
  show.append(el('span', '', trainerName().toUpperCase()), el('span', 'tc-name-edit', 'Edit'));
  show.addEventListener('click', () => {
    playSound('confirm');
    const form = el('form', 'tc-name-form');
    const input = el('input', 'tc-name-input');
    Object.assign(input, { maxLength: NAME_MAX, value: pickedName(), placeholder: 'TRAINER', autocomplete: 'nickname', spellcheck: false, enterKeyHint: 'done' });
    input.setAttribute('aria-label', 'Your name');
    const ok = el('button', 'tc-name-ok', 'OK');
    ok.type = 'submit';
    form.append(input, ok);
    let done = false;
    const finish = (keep) => {
      if (done) return;
      done = true;
      if (keep) { setTrainerName(input.value); playSound('confirm'); }
      redraw();
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); finish(true); });
    input.addEventListener('blur', () => setTimeout(() => finish(true)));
    // typing stays in the box: the device's keys (D-pad, B on Escape) wait
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); finish(false); } });
    dd.replaceChildren(form);
    input.focus();
    input.select();
  });
  dd.append(show);
  return dd;
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

  const dex = dexTally(save);
  const safari = safariOpen(save) ? safariDexCount() : null;
  const stars = Object.values(s.level5WinsBy || {}).filter(n => n > 0).length;
  // each line says what it counts when tapped (js/tips.js reads the title): STARS and TIME weren't clear on their own
  const lines = [
    ['NAME', trainerName().toUpperCase(), 'Your nickname, shown on the leaderboards. Tap Edit to change it.'],
    ...(isMaster(save) ? [['TITLE', 'POKéMON MASTER', 'Your title, for winning a run on Trainer Level 10, the top Level.']] : []),
    ['WINS', String(s.runsWon), 'Runs you have won, at any Trainer Level.'],
    ['POKéDEX', `${dex.n}/${dex.total}`, dex.all ? 'Pokémon beaten on every Pokédex page you have found.' : 'Pokémon beaten in the three biomes. Beat them all to open the Safari Zone.'],
    ['SAFARI', safari ? `${safari.caught}/${safari.total}` : '---', safari ? 'Pokémon caught in the Safari Zone.' : 'Pokémon caught in the Safari Zone, once it opens.'],
    ['SHINIES', safari ? `${shinyTotal(save)}/${SAFARI_ROSTER.length}` : '---', 'Safari Pokémon whose shiny is yours, caught in the wild or pulled at the Shiny Exchange.'],
    ['JOURNAL', journalRank(save).rank.name.toUpperCase(), 'Your rank in the Trainer\'s Journal, from tasks claimed at the Clearing\'s PC.'],
    ['RANGER', safari ? rankOf(save).rank.name.toUpperCase() : '---', 'Your Ranger Rank, from tasks claimed on the Safari Outfitter\'s Ranger Task Board.'],
    ['STARS', stars ? '⭐'.repeat(Math.min(stars, 3)) + (stars > 3 ? `×${stars}` : '') : '-', 'A star for each starter you have won a Level 5 run with: gold at Level 5, a new colour each Level up, a rainbow at 10.'],
    ['TIME', playTime(s.playMs), 'Play time, in hours and minutes.'],
    ...(myCode() ? [['CODE', formatCode(myCode()), 'Your trainer code. A friend types it in the Trainers app to add you.']] : []),
  ];
  const info = el('div', 'tc-info');
  const list = el('dl', 'tc-lines');
  const redraw = () => openTrainerCard(into, { reopen: true });
  for (const [k, v, tip] of lines) {
    const dt = el('dt', '', k), dd = k === 'NAME' ? nameField(redraw) : k === 'STARS' && stars ? starRow(save) : el('dd', k === 'TITLE' ? 'tc-master' : '', v);
    dt.title = tip;
    if (k !== 'NAME') dd.title = tip;
    list.append(dt, dd);
  }
  const mate = partner(save);
  const pic = el('button', 'tc-partner');
  pic.type = 'button';
  pic.title = `${mate.name}. Tap to choose your partner`;
  pic.setAttribute('aria-label', `Partner: ${mate.name}. Choose another`);
  const img = el('img', 'pixel');
  img.src = mate.src;
  img.alt = '';
  if (wearsCrown(save)) pic.append(crownArt());
  const aura = auraWorn(save) ? auraArt(auraWorn(save)) : null;
  if (aura) {
    // its feet on the partner's: the picture is 96px tall under the button's 6px padding
    for (const box of [aura.back, aura.front].filter(Boolean)) box.style.top = `${104 - aura.h}px`;
    pic.append(aura.back);
  }
  pic.append(img);
  if (aura?.front) pic.append(aura.front);
  pic.append(el('span', 'tc-partner-edit', 'Change'));
  pic.addEventListener('click', () => {
    playSound('confirm');
    partnerPicker(body, () => openTrainerCard(into, { reopen: true }));
  });
  const frame = el('div', 'tc-partner-frame');
  frame.append(pic);
  const carried = SKIN_BY_ID[workshopOf(save).skin];
  const ballKey = el('button', 'tc-shiny tc-ball-key');
  ballKey.type = 'button';
  ballKey.title = 'The ball your partner comes out of in battle: tap to choose';
  ballKey.setAttribute('aria-label', `Ball: ${carried?.name ?? 'Poké Ball'}. Choose another`);
  ballKey.append(ball3d(carried?.sprite ?? 'poke-ball'), carried?.name.replace(/ Ball$/, '') ?? 'Poké');
  ballKey.addEventListener('click', () => { playSound('confirm'); ballPicker(body, redraw); });
  frame.append(ballKey);
  if (mate.twin) {
    const flip = el('button', `tc-shiny${mate.shiny ? ' on' : ''}`, mate.shiny ? '✨ Shiny' : 'Shiny');
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
  if (isMaster(save)) {
    const on = wearsCrown(save), key = el('button', `tc-shiny tc-crown-key${on ? ' on' : ''}`, on ? '👑 Crown' : 'Crown');
    key.type = 'button';
    key.title = on ? 'The Champion\'s Crown is on: tap to take it off' : 'Tap to wear the Champion\'s Crown';
    key.setAttribute('aria-pressed', String(on));
    key.setAttribute('aria-label', 'Champion\'s Crown');
    key.addEventListener('click', () => {
      updateSave(d => { d.crown = !on; });
      playSound('confirm');
      openTrainerCard(into, { reopen: true });
    });
    frame.append(key);
  } else {
    // a preview of the crown for everyone not yet a Master, greyed, saying how it's earned (the user's pick, 2026-10-23)
    const lock = el('span', 'tc-shiny tc-crown-locked');
    lock.append(crownArt('tc-crown-mini'), ' Win Lv 10');
    lock.title = 'The Champion\'s Crown: win a run on Trainer Level 10 and it floats over your partner.';
    frame.append(lock);
  }
  const earnedAuras = aurasEarned(save);
  if (earnedAuras.length) {
    // the Aura key steps through every aura earned, then off (the user's go, 2026-10-23); the best one isn't saved as a
    // pick, so a higher Level won later puts its aura on by itself
    const on = auraWorn(save), best = auraBest(save), cycle = [...earnedAuras, 0], next = cycle[(cycle.indexOf(on) + 1) % cycle.length];
    const key = el('button', `tc-shiny tc-aura-key${on ? ` on aura-key-lv${on}` : ''}`, on ? `🔥 Lv ${on}` : 'Aura');
    key.type = 'button';
    key.title = `${on ? `The ${starName(on)} aura, for a Level ${on} win, is on` : 'Your aura is off'}: tap for ${next ? `the ${starName(next)} aura` : 'none'}`;
    key.setAttribute('aria-label', `Super Saiyan aura: ${on ? starName(on) : 'off'}`);
    key.addEventListener('click', () => {
      updateSave(d => { if (next === best) delete d.aura; else d.aura = next; });
      playSound('confirm');
      openTrainerCard(into, { reopen: true });
    });
    frame.append(key);
  } else {
    const lock = el('span', 'tc-shiny tc-crown-locked tc-aura-locked');
    lock.append(auraArt(6, { cls: 'tc-aura-mini', s: 16 }).back, ' Win Lv 6');
    lock.title = 'A Super Saiyan aura: win a run on Trainer Level 6 and your partner glows ruby, bigger each Level up to 10.';
    frame.append(lock);
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
  const label = el('div', 'tc-case-label');
  label.append(el('span', '', 'BADGE CASE'));
  const cover = el('button', 'tc-pin-btn tc-cover-btn', 'Cover');
  cover.type = 'button';
  cover.title = 'Choose the badges on your Pokédex cover';
  cover.addEventListener('click', () => { playSound('confirm'); coverPicker(body, redraw); });
  const keys = el('span', 'tc-case-keys');
  keys.append(cover);
  label.append(keys);
  if (myCode() || new URLSearchParams(location.search).has('mycard')) {
    // signed in, friends see your page: pin one badge for it (the Trainers app shows it by your partner). The user found
    // a faint "Pinned" tab easy to miss (2026-10-27): it's a gold plate now, and the badge sits pinned on the partner too
    const pinned = pinnable(save.pinBadge, save) ? save.pinBadge : null;
    const openPin = () => { playSound('confirm'); pinPicker(body, redraw); };
    const pin = el('button', `tc-pin-btn${pinned ? '' : ' empty'}${pinned || calmFx() ? '' : ' shine'}`);
    pin.type = 'button';
    pin.title = pinned ? 'Your pinned badge, on your Trainers page. Tap to change it' : 'Pin a badge to your Trainers page';
    const art = el('span', 'tc-pin-art');
    if (pinned) { const im = el('img', ''); im.src = badgeArt(pinned, true); im.alt = ''; art.append(im); }
    pin.append(art, el('span', '', pinned ? 'Pinned badge' : 'Pin a badge'));
    pin.addEventListener('click', openPin);
    keys.append(pin);
    const tack = el('button', `tc-tack${pinned ? '' : ' empty'}`);
    tack.type = 'button';
    tack.title = pin.title;
    tack.setAttribute('aria-label', pinned ? `Pinned badge: ${BADGES.find(b => b.id === pinned).name}. Change it` : 'Pin a badge');
    if (pinned) { const im = el('img', ''); im.src = badgeArt(pinned, true); im.alt = ''; tack.append(im); } else tack.textContent = '+';
    tack.addEventListener('click', openPin);
    frame.append(tack);
  }
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
    keys.append(all);
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

const FIND_LISTS = { relics: RELICS, items: ITEMS, cards: ALL_CARDS, gym: GYM_LEADERS };

/** A kind's new finds the Collection hasn't shown, only ones its apps list (a played Cinder or status card isn't one). */
export const newFinds = (kind, save = getSave()) => (save.newFinds?.[kind] || []).filter(id => FIND_LISTS[kind].some(t => t.id === id));

/** Anything new in the Collection device: a badge, or a relic, item, move or Gym Leader found. */
export const deviceNews = (save = getSave()) => badgeNews(save) || Object.keys(FIND_LISTS).some(k => newFinds(k, save).length) || (townsOpen() && (satchelNews(save) || questNews(save))) || friendsNews(save);

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
