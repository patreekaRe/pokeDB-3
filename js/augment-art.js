/* ============================================================
   augment-art.js  -  the Sky Pillar's augments as things to look at
   (roadmap item 21 part b, 2026-10-07): each augment's icon, its tile
   on the pick screen in a Silver / Gold / Prismatic frame, and the
   deal and reroll animations. Kept out of js/data/augments.js, which
   only holds the numbers (the bot tunes them there).

   An icon is a smooth medallion in its tier's metal with a glyph on it
   (js/smooth-icons.js's art or GLYPHS below, the user's call: smooth,
   no pixels), plus an optional pip mark ("+", "x2"...) so augments that
   share a glyph still read apart. A new augment needs an ICONS line;
   without one it falls back to its emoji.
   ============================================================ */

import { el } from './ui.js';
import { playSound } from './audio.js';
import { smoothArt, smoothIcon } from './smooth-icons.js';
import { AUG_TIER_NAMES } from './data/augments.js';
import { TYPES } from './data/cards.js';

const INK = '#1c1430';
const O = `stroke="${INK}" stroke-width="2" stroke-linejoin="round"`;

const GLYPHS = {
  feather: `<path d="M26 4C14 5 7 13 6 26l3-3c6 0 13-5 17-19Z" fill="#f4f4f6" ${O}/><path d="M7 25L20 11" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M12 17h5M15 13h5" stroke="#c8ccd8" stroke-width="1.4" stroke-linecap="round"/>`,
  book: `<path d="M3.5 6.5c4.5-1.6 8.5-1 12.5 1.6v19.4c-4-2.6-8-3.2-12.5-1.6Z" fill="#3c8cf0" ${O}/><path d="M28.5 6.5c-4.5-1.6-8.5-1-12.5 1.6v19.4c4-2.6 8-3.2 12.5-1.6Z" fill="#6aaaf8" ${O}/><path d="M7 11c2-.5 4-.3 6 .6M7 15c2-.5 4-.3 6 .6M19 11.6c2-.9 4-1.1 6-.6M19 15.6c2-.9 4-1.1 6-.6" stroke="#d8ecff" stroke-width="1.4" stroke-linecap="round"/>`,
  tag: `<path d="M4 15V5a1 1 0 0 1 1-1h10l13 13-11 11Z" fill="#f8c830" ${O}/><circle cx="9.5" cy="9.5" r="2.2" fill="#fff" stroke="${INK}" stroke-width="1.6"/><path d="M14 18l5-5M17 21l5-5" stroke="#a86a10" stroke-width="1.6" stroke-linecap="round"/>`,
  bandage: `<g transform="rotate(-40 16 16)"><rect x="2.5" y="10.5" width="27" height="11" rx="5.5" fill="#f8d8b0" ${O}/><rect x="12" y="10.5" width="8" height="11" fill="#fff4e4" stroke="${INK}" stroke-width="1.6"/><circle cx="14.4" cy="14" r=".9" fill="#c8a880"/><circle cx="17.6" cy="14" r=".9" fill="#c8a880"/><circle cx="14.4" cy="18" r=".9" fill="#c8a880"/><circle cx="17.6" cy="18" r=".9" fill="#c8a880"/></g>`,
  bolt: `<path d="M18.5 2L6 18h8.5l-2.5 12 14-17.5h-8.5Z" fill="#f8d838" ${O}/><path d="M16 6l-5 7" stroke="#fff8c0" stroke-width="1.6" stroke-linecap="round"/>`,
  bird: `<path d="M4.5 18c0-6.4 5-11 11.5-11 5 0 8 3 9 6.4-1 6.6-6 11.1-12 11.1-5.5 0-8.5-2.6-8.5-6.5Z" fill="#62b8f0" ${O}/><path d="M25 12.5l5 1.6-5 1.8Z" fill="#f8b830" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="20" cy="12.6" r="1.6" fill="${INK}"/><path d="M7 18c3.6.6 7.6-.4 10.4-3.6" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M12 24.5l-2 4.5M17 24.5l-1 4.5" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
  clover: `<path d="M16 17c2 5 4 8 7 11" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><g fill="#4cb84a" ${O}><circle cx="16" cy="9" r="5.4"/><circle cx="23" cy="15" r="5.4"/><circle cx="9" cy="15" r="5.4"/><circle cx="16" cy="21" r="5"/></g><circle cx="16" cy="15" r="2.4" fill="#8ad860"/>`,
  magnify: `<path d="M19.5 19.5L28 28" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M20 20l7.5 7.5" stroke="#a8642c" stroke-width="2.4" stroke-linecap="round"/><circle cx="13" cy="13" r="9.5" fill="#bfe8ff" stroke="${INK}" stroke-width="2.4"/><path d="M8.5 12a5 5 0 0 1 4-4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
  glove: `<path d="M6 13c0-5 4-8.5 9-8.5h5c4.5 0 7.5 3.5 7.5 8v6c0 4.5-3.5 8-8 8H13c-4 0-7-3-7-7Z" fill="#e23a2c" ${O}/><path d="M6 15c0-3 2-5 5-5s5 2 5 5-2 5-5 5" fill="#f0584a" ${O}/><rect x="10" y="26" width="14" height="4" rx="1.5" fill="#f4f4f6" ${O}/><path d="M18 8c3-1 6 0 7.5 2.5" fill="none" stroke="#ffb0a8" stroke-width="1.6" stroke-linecap="round"/>`,
  dice: `<rect x="4" y="4" width="24" height="24" rx="5" fill="#fff" ${O}/><g fill="#e23a2c"><circle cx="10" cy="10" r="2.2"/><circle cx="22" cy="10" r="2.2"/><circle cx="16" cy="16" r="2.2"/><circle cx="10" cy="22" r="2.2"/><circle cx="22" cy="22" r="2.2"/></g>`,
  helmet: `<path d="M5 22c0-9.4 4.8-16 11-16s11 6.6 11 16Z" fill="#8a9ab8" ${O}/><path d="M16 6v16" stroke="${INK}" stroke-width="1.6"/><path d="M9 14c.6-3 2.2-5 4-6" fill="none" stroke="#d8e0f0" stroke-width="1.8" stroke-linecap="round"/><rect x="3" y="21.5" width="26" height="5" rx="1.5" fill="#6a7a98" ${O}/>`,
  sprout: `<ellipse cx="16" cy="27.5" rx="8" ry="2.6" fill="#a8642c" ${O}/><path d="M16 27V16" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M16 17.5C16 11.5 11 8 4.5 9c0 6.5 5 9.5 11.5 8.5Z" fill="#62c050" ${O}/><path d="M16 15c0-6 5-9.5 11.5-8.5 0 6.5-5 9.5-11.5 8.5Z" fill="#8ad860" ${O}/>`,
  whirl: `<circle cx="16" cy="16" r="13" fill="#3c8cf0" ${O}/><path d="M14 16a2 2 0 1 1 4 0 5 5 0 0 1-10 0 8 8 0 0 1 16 0" fill="none" stroke="#d8f0ff" stroke-width="2.4" stroke-linecap="round"/>`,
  wind: `<path d="M3 11h16a4 4 0 1 0-4-4M3 17.5h22a4 4 0 1 1-4 4M3 24h10" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M3 11h16a4 4 0 1 0-4-4M3 17.5h22a4 4 0 1 1-4 4M3 24h10" fill="none" stroke="#c8f0f0" stroke-width="2.6" stroke-linecap="round"/>`,
  echo: `<path d="M15 9a9 9 0 0 1 0 14M20.5 4.5a15 15 0 0 1 0 23" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M15 9a9 9 0 0 1 0 14M20.5 4.5a15 15 0 0 1 0 23" fill="none" stroke="#c48cff" stroke-width="2.6" stroke-linecap="round"/><circle cx="8.5" cy="16" r="4.5" fill="#c48cff" ${O}/>`,
  chart: `<rect x="3" y="3.5" width="26" height="25" rx="4" fill="#fff" ${O}/><path d="M7 23l6-6.5 4 3.5 8.5-10" fill="none" stroke="#4cb84a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.5 9.5h6v6" fill="none" stroke="#4cb84a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  castle: `<path d="M4 28.5V9.5h4.5v3h3v-3H15v3h2v-3h3.5v3h3v-3H28v19Z" fill="#b8c0d8" ${O}/><path d="M12.5 28.5V22a3.5 3.5 0 0 1 7 0v6.5" fill="#5a4a3a" stroke="${INK}" stroke-width="1.8"/><path d="M8 17h3M21 17h3" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
  axe: `<path d="M7 29L22 7" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M7 29L22 7" stroke="#a8642c" stroke-width="2.4" stroke-linecap="round"/><path d="M16.5 4.5c4.5-2.4 10 0 12 4.6L22 16.5c-1.6-4.2-4.6-6.6-9-6.6Z" fill="#d8dce8" ${O}/><path d="M19 6c3-1 6.5.5 8 3" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
  mask: `<path d="M5 5.5c7 2.2 15 2.2 22 0 1.4 11.5-3 21.6-11 22.5C8 27.1 3.6 17 5 5.5Z" fill="#fff" ${O}/><path d="M8.5 12.5c1.6-1.8 3.8-1.8 5.4 0M18.1 12.5c1.6-1.8 3.8-1.8 5.4 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M10.5 18.5c3.4 3.6 7.6 3.6 11 0Z" fill="#e23a2c" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`,
  flag: `<path d="M8 29.5V3.5" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><path d="M8.5 4.5h17l-4.2 5.8 4.2 5.8h-17Z" fill="#e23a2c" ${O}/><path d="M11 8h6" stroke="#ff9c90" stroke-width="1.6" stroke-linecap="round"/>`,
  pin: `<path d="M16 19v10.5" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M11.5 3.5h9l-1.2 8 4.7 4.5v3H8v-3l4.7-4.5Z" fill="#e23a2c" ${O}/><path d="M14 6v5" stroke="#ff9c90" stroke-width="1.6" stroke-linecap="round"/>`,
  battery: `<rect x="2.5" y="8.5" width="24" height="15" rx="2.6" fill="#fff" ${O}/><rect x="26.5" y="12.5" width="3" height="7" rx="1" fill="${INK}"/><rect x="5.5" y="11.5" width="18" height="9" rx="1" fill="#4cb84a"/><path d="M16.5 11.5l-4.5 5h4l-2 4 5.5-6h-4l2-3Z" fill="#f8e858" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`,
  hourglass: `<path d="M9 4c0 7.4 6 8.4 6 12s-6 4.6-6 12h14c0-7.4-6-8.4-6-12s6-4.6 6-12Z" fill="#e8f4ff" ${O}/><path d="M12 25.5c1-3 3-4.4 4-6.4 1 2 3 3.4 4 6.4Z" fill="#f8c830"/><path d="M12 8.5h8c-1 2-3 3-4 4.4-1-1.4-3-2.4-4-4.4Z" fill="#f8c830"/><path d="M7 3.5h18M7 28.5h18" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  watch: `<rect x="13" y="1.5" width="6" height="4" rx="1.2" fill="${INK}"/><path d="M24 7.5l2.4-2.4" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="18" r="11" fill="#fff" ${O}/><path d="M16 18V10.5M16 18l5 3" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M16 7a11 11 0 0 1 11 11H16Z" fill="#62b8f0" opacity="0.45"/>`,
  sun: `<path d="M16 2.5v4M16 25.5v4M2.5 16h4M25.5 16h4M6.5 6.5l2.8 2.8M22.7 22.7l2.8 2.8M6.5 25.5l2.8-2.8M22.7 9.3l2.8-2.8" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/><path d="M16 2.5v4M16 25.5v4M2.5 16h4M25.5 16h4M6.5 6.5l2.8 2.8M22.7 22.7l2.8 2.8M6.5 25.5l2.8-2.8M22.7 9.3l2.8-2.8" stroke="#f8c830" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="16" r="7.5" fill="#f8d838" ${O}/>`,
  wave: `<path d="M3 26c2.6-11.4 9.4-18.5 18.6-18.5 4.4 0 7.4 2.4 7.4 6.2-2.2-2-5-2-7 0 3 1 4.2 4 3 6.4-3-3.2-8-1.4-9.2 2.8C14.4 27 10.6 28 3 26Z" fill="#3c8cf0" ${O}/><path d="M16 12c2-1.6 4-2 6-1.6" fill="none" stroke="#d8f0ff" stroke-width="1.8" stroke-linecap="round"/><path d="M2.5 29h27" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`,
  shell: `<path d="M16 28L3.5 15.5C3.5 9 9 4 16 4s12.5 5 12.5 11.5Z" fill="#f8b8c8" ${O}/><path d="M16 27.5L10 5.5M16 27.5V4M16 27.5l6-22M16 27.5L4.5 12M16 27.5L27.5 12" stroke="${INK}" stroke-width="1.4"/><path d="M12.5 26h7l-3.5 3.5Z" fill="#f8b8c8" ${O}/>`,
  bat: `<path d="M16 11.5c-2-3-5-3.4-6.4-1-2-2.2-5.4-2-8.1 1.4 2 1 3 3.2 3 6 1.8-1.6 4-1.6 5.2.4 1.2-2 3.4-2.8 6.3-.8 2.9-2 5.1-1.2 6.3.8 1.2-2 3.4-2 5.2-.4 0-2.8 1-5 3-6-2.7-3.4-6.1-3.6-8.1-1.4-1.4-2.4-4.4-2-6.4 1Z" fill="#6a4a8a" ${O}/><path d="M13.6 8.5l1.4 3.4M18.4 8.5L17 11.9" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><circle cx="14.5" cy="14.6" r="1.1" fill="#f8d838"/><circle cx="17.5" cy="14.6" r="1.1" fill="#f8d838"/>`,
  mirror: `<path d="M16 23.5V29M10.5 29.5h11" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/><ellipse cx="16" cy="13" rx="9.5" ry="10.5" fill="#c48cff" ${O}/><ellipse cx="16" cy="13" rx="6.6" ry="7.6" fill="#d8f4ff" stroke="${INK}" stroke-width="1.6"/><path d="M12.5 15l6-6.5M14 17.5l3-3.2" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
  eye: `<path d="M2.5 16C6 9.5 10.5 6.5 16 6.5S26 9.5 29.5 16C26 22.5 21.5 25.5 16 25.5S6 22.5 2.5 16Z" fill="#fff" ${O}/><circle cx="16" cy="16" r="5.6" fill="#c48cff" stroke="${INK}" stroke-width="1.8"/><circle cx="16" cy="16" r="2.4" fill="${INK}"/><circle cx="14.4" cy="14.4" r="1.1" fill="#fff"/>`,
  infinity: `<path d="M16 16c-3-4-5-6-8-6a6 6 0 0 0 0 12c3 0 5-2 8-6s5-6 8-6a6 6 0 0 1 0 12c-3 0-5-2-8-6Z" fill="none" stroke="${INK}" stroke-width="5.4"/><path d="M16 16c-3-4-5-6-8-6a6 6 0 0 0 0 12c3 0 5-2 8-6s5-6 8-6a6 6 0 0 1 0 12c-3 0-5-2-8-6Z" fill="none" stroke="#f8d838" stroke-width="2.4"/>`,
  log: `<rect x="3" y="18" width="24" height="9.5" rx="4.75" fill="#a8642c" ${O}/><ellipse cx="25" cy="22.75" rx="3" ry="4.75" fill="#f4d8a0" stroke="${INK}" stroke-width="1.8"/><path d="M8 21.5h9M10 24.5h8" stroke="#6a3a14" stroke-width="1.4" stroke-linecap="round"/><path d="M14.5 2.5c1 3.2 5 5 5 9.2a5 5 0 0 1-10 0c0-2 1-3 2-4.2 1 1 1.2 2.2 1.2 3.2 1-3 0-5.2 1.8-8.2Z" fill="#ff7a2a" ${O}/>`,
  tornado: `<path d="M3.5 5h25M6.5 11h19M9.5 17h13M12 23h8.5M14 28.5h4" stroke="${INK}" stroke-width="4.8" stroke-linecap="round"/><path d="M3.5 5h25M6.5 11h19M9.5 17h13M12 23h8.5M14 28.5h4" stroke="#d8dce8" stroke-width="2.2" stroke-linecap="round"/>`,
  uturn: `<path d="M24 28.5V13a7 7 0 0 0-14 0v4.5" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M24 28.5V13a7 7 0 0 0-14 0v4.5" fill="none" stroke="#4cb84a" stroke-width="3" stroke-linecap="round"/><path d="M3.5 17l6.5 9 6.5-9Z" fill="#4cb84a" ${O}/>`,
  glass: `<path d="M6.5 9.5h19l-2.6 19h-13.8Z" fill="#e8f4ff" ${O}/><path d="M8 14h16l-1.9 13.5H9.9Z" fill="#3c8cf0"/><path d="M6 10.5c0-3.4 4.4-5.6 10-5.6s10 2.2 10 5.6Z" fill="#6aaaf8" ${O}/><path d="M26.5 11.5c1.2 2 2.2 3.2 2.2 4.8a2.2 2.2 0 0 1-4.4 0c0-1.6 1-2.8 2.2-4.8Z" fill="#6aaaf8" stroke="${INK}" stroke-width="1.4"/><path d="M6.5 9.5h19l-2.6 19h-13.8Z" fill="none" ${O}/>`,
  bramble: `<path d="M3.5 27C10 23 8 14 14.5 12S23 15 28.5 5" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M3.5 27C10 23 8 14 14.5 12S23 15 28.5 5" fill="none" stroke="#4caa50" stroke-width="2.4" stroke-linecap="round"/><path d="M8.5 21.5l-3-1M10 16l3-2.6M19 13.5l1.4 3.4M24 10l3 1.6" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><circle cx="25" cy="21" r="4.4" fill="#e23a2c" ${O}/><path d="M23.5 20a2 2 0 0 1 3 .5" fill="none" stroke="#8a1820" stroke-width="1.4" stroke-linecap="round"/>`,
};

const art = (name) => GLYPHS[name] ?? smoothArt(name) ?? '';

/* Each augment's glyph and pip mark: [glyph, mark?]. js/smooth-icons.js's names work here too. */
const ICONS = {
  // Silver
  'thick-skin': ['heart', '+'], 'iron-wall': ['shield'], 'light-pack': ['feather'], sharpened: ['ppup'],
  'training-day': ['book'], 'pocket-change': ['cash'], 'big-spender': ['tag'], 'field-medic': ['bandage'],
  'rest-stop': ['center'], 'first-strike': ['bolt'], 'warm-up': ['moves', '+'], 'early-bird': ['bird'],
  hoarder: ['items', '+'], 'lucky-find': ['clover'], scavenger: ['magnify'], 'thorn-coat': ['cactus'],
  'steady-hands': ['shield', '+'], 'heavy-hitter': ['glove'], 'alpha-hunter': ['target'], 'second-helping': ['moves', '4'],
  'deep-pockets': ['dice'], 'tough-hide': ['helmet'], 'clean-slate': ['pc'], 'lucky-coin': ['coin'],
  'inner-focus': ['muscle'], kindling: ['log'], 'ember-skin': ['shield', 'fire'], 'deep-roots': ['tree'],
  pollinate: ['sprout', '+'], 'still-pool': ['water', '+'], undertow: ['whirl'],
  // Gold
  'second-wind': ['wind'], echo: ['echo'], overflow: ['glass'], 'double-down': ['moves', 'x2'],
  'combo-master': ['music'], momentum: ['chart'], bulwark: ['castle'], siphon: ['drop'],
  executioner: ['axe'], 'opening-act': ['mask'], 'deck-diet': ['trash'], refresh: ['turns'],
  ambush: ['target', '!'], intimidate: ['boss'], bodyguard: ['helmet', '+'], 'spoils-of-war': ['fame'],
  'golden-touch': ['sparkle'], duelist: ['swords'], comeback: ['uturn'], 'last-stand': ['flag'],
  'card-shark': ['moves', '★'], 'steel-nerves': ['status', '✓'], retainer: ['pin'], fortress: ['castle', '+'],
  'guardian-slayer': ['skull'], flurry: ['tornado'], overcharge: ['battery'], 'combo-breaker': ['burst', '3'],
  patience: ['hourglass'], 'heat-shield': ['shield', 'fire'], 'wildfire-aug': ['fire', '∞'], cauterize: ['heart', 'fire'],
  photosynthesis: ['sun'], 'thorn-garden': ['bramble'], overbloom: ['flower'], 'rising-tide': ['wave'],
  'tidal-armor': ['shell'], 'riptide-rush': ['pin', 'water'],
  // Prismatic
  'glass-cannon': ['gem'], vampire: ['bat'], overclock: ['settings'], 'metronome-mind': ['music', '?'],
  'mirror-force': ['mirror'], 'time-warp': ['hourglass', '4'], avatar: ['eye'], legend: ['star'],
  bloodlust: ['drop', '+'], immortal: ['infinity'], gambler: ['corner'], 'one-punch': ['glove', 'x5'],
  'living-legend': ['fame', '+'], speedrunner: ['watch'], nova: ['burst', '10'], pandemonium: ['boss', '+'],
  'last-breath': ['heart', '1'], phoenix: ['fire', '★'], rebirth: ['egg'], supernova: ['burst', 'fire'],
  'world-tree': ['tree', '∞'], 'spore-storm': ['mushroom'], 'tsunami-aug': ['wave', '∞'], abyss: ['whirl', '!'],
};

/* A pip mark that is a type name shows that type's colour instead of text */
const MARK_TYPE = { fire: '#ff7a2a', water: '#3c8cf0', grass: '#62c050' };

const METAL = {
  silver: [['0', '#ffffff'], ['0.35', '#b8c0cc'], ['0.55', '#eef1f5'], ['0.8', '#848c9a'], ['1', '#d4d9e0']],
  gold: [['0', '#fff6c0'], ['0.35', '#f0c040'], ['0.55', '#fff0a0'], ['0.8', '#b07818'], ['1', '#f4cc58']],
  prismatic: [['0', '#ff6b8a'], ['0.2', '#ffc06b'], ['0.38', '#fff07a'], ['0.55', '#6bff9c'], ['0.72', '#5ad1ff'], ['0.88', '#9a7bff'], ['1', '#ff6bd6']],
};
const FACE = { silver: ['#ffffff', '#dfe4ea'], gold: ['#fffaf0', '#f6e2a8'], prismatic: ['#ffffff', '#ecdcff'] };

let uid = 0;

/** An augment's icon: an inline SVG medallion in its tier's metal with its glyph (and pip) on it. */
export function augIcon(aug, className = '') {
  const [glyph, mark] = ICONS[aug.id] ?? [];
  if (!glyph) return el('span', `aug-emoji ${className}`, aug.icon);
  const id = `aug${uid++}`, tier = aug.tier in METAL ? aug.tier : 'silver';
  const stops = METAL[tier].map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  const [f1, f2] = FACE[tier];
  const pip = !mark ? '' : MARK_TYPE[mark]
    ? `<circle cx="33" cy="33" r="5.6" fill="${MARK_TYPE[mark]}" stroke="${INK}" stroke-width="1.6"/>`
    : `<circle cx="33" cy="33" r="${mark.length > 1 ? 6.4 : 5.6}" fill="${INK}"/><text x="33" y="33" dy="0.36em" text-anchor="middle" font-size="${mark.length > 1 ? 6.4 : 8}" font-weight="700" font-family="system-ui, sans-serif" fill="#fff">${mark}</text>`;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `aug-icon aug-icon-${tier}${className ? ` ${className}` : ''}`);
  svg.innerHTML = `<defs><linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>
    <radialGradient id="${id}f" cx="0.4" cy="0.32" r="0.75"><stop offset="0" stop-color="${f1}"/><stop offset="1" stop-color="${f2}"/></radialGradient></defs>
    <path d="M20 1.5l16 9.25v18.5L20 38.5 4 29.25v-18.5Z" fill="url(#${id}m)" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M20 5.6l12.5 7.2v14.4L20 34.4 7.5 27.2V12.8Z" fill="url(#${id}f)" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round" opacity="0.98"/>
    <g transform="translate(8.8 8.8) scale(0.7)">${art(glyph)}</g>${pip}`;
  return svg;
}

/** An augment's tile on the pick screen (and blown up when picked): its tier's frame and ribbon, its icon, name and
    text, and a back face for the deal's flip (the Sky Pillar on its tier's metal). */
export function augTile(aug) {
  const tile = el('div', `aug-tile aug-${aug.tier}`);
  const type = aug.type ? el('small', `aug-type type-${aug.type}`, `${TYPES[aug.type]?.label ?? aug.type} only`) : null;
  const back = el('div', 'aug-back');
  back.append(smoothIcon('tower'));
  tile.append(el('span', 'aug-ribbon', AUG_TIER_NAMES[aug.tier]), augIcon(aug, 'aug-tile-icon'), el('b', 'aug-name', aug.name),
    ...(type ? [type] : []), el('span', 'aug-text', aug.text), back);
  return tile;
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEAL_GAP = 170, FLIP_AT = 380;   // ms between tiles; when in its flip a tile turns face up (CSS augDeal's 55%)

/** Deal the pick screen's tiles in face down, one after another, each turning over with its tier's chime. */
export function dealAugments(box, offer) {
  const buttons = [...box.querySelectorAll('.reward-option')];
  buttons.forEach((btn, i) => {
    btn.style.setProperty('--i', i);
    btn.classList.add('aug-deal');
    const tier = offer[i]?.tier ?? 'silver';
    setTimeout(() => playSound(`aug-${tier}`, 'confirm'), reduced() ? i * 90 : i * DEAL_GAP + FLIP_AT);
  });
}

/** A reroll: the three tiles flip back over and fall away, then `then` deals the new ones. */
export function foldAugments(box, then) {
  playSound('aug-reroll', 'confirm');
  if (reduced()) return then();
  box.querySelectorAll('.reward-option').forEach((btn, i) => { btn.style.setProperty('--i', i); btn.classList.remove('aug-deal'); btn.classList.add('aug-fold'); });
  setTimeout(then, 520);
}
