/* ============================================================
   trainercard.js  -  Gold/Silver's Trainer Card (roadmap item 17b): a
   Collection card opening a window with the trainer's numbers and the
   Badge Case, four rows of badges (js/data/badges.js). The badges
   are drawn as smooth SVG from a shape and a glyph each: a gradient from a
   light top-left to a dark bottom-right, a gloss and a dark outline.
   Also keeps `stats.playMs`, the play time, counted from its release.
   ============================================================ */

import { BADGES, BADGE_GROUPS } from './data/badges.js';
import { DEX_PAGES, safariOpen } from './data/pokedex.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave, updateSave, addPlayTime } from './storage.js';
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
  t25: num('25', 11, 26), t50: num('50', 11, 26), t100: num('100', 8.6, 25.5),
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
  'tower-25': ['tower', ['#c8d8f0', '#7890b8', '#384868'], 't25'],
  'tower-50': ['tower', ['#c8d8f0', '#7890b8', '#384868'], 't50'],
  'tower-100': ['tower', ['#c8d8f0', '#7890b8', '#384868'], 't100'],
};
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
  { id: 'bronze', name: 'Bronze', at: 5 },
  { id: 'silver', name: 'Silver', at: 10 },
  { id: 'gold', name: 'Gold', at: 15 },
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

/** The starter on the card: the one with the most wins (a Level 5 win counts big), else Charmander. */
export function partner(save) {
  const s = save.stats;
  const score = (id) => (s.winsBy?.[id] || 0) + 10 * (s.level5WinsBy?.[id] || 0);
  const best = STARTERS.filter(st => score(st.id) > 0).sort((a, b) => score(b.id) - score(a.id))[0];
  return best ? { starter: best, stage: best.line.length - 1 } : { starter: STARTERS_BY_ID.charmander, stage: 0 };
}

const hintFor = (b, save) => {
  if (b.secret && !(save.unlocked || []).includes('mewtwo')) return 'A secret badge. Something sleeps behind the Sealed Gate...';
  return b.locked ? b.text : `Not earned yet. ${b.text}.`;
};

function badgeButton(b, save, earned, fresh, i) {
  const btn = el('button', `tc-badge${earned ? ' earned' : ' locked'}${fresh ? ' fresh' : ''}`);
  btn.type = 'button';
  const art = badgeArt(b.id, earned);
  btn.style.setProperty('--art', `url(${art})`);
  btn.style.setProperty('--i', i);
  const img = el('img', 'tc-badge-art');
  img.src = art;
  img.alt = '';
  btn.append(img);
  const name = earned ? b.name : (b.secret && !(save.unlocked || []).includes('mewtwo') ? '???' : b.name);
  btn.setAttribute('aria-label', `${name}: ${earned ? 'earned' : 'not earned'}`);
  btn.addEventListener('click', () => tipAt(btn, earned ? `${b.name}: earned! ${b.text}.` : `${name}: ${hintFor(b, save)}`));
  return btn;
}

export function openTrainerCard(into = null) {   // `into`: draw it there (the Collection device's screen), no window
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
  const { starter, stage } = partner(save);
  const pic = el('div', 'tc-partner');
  const img = el('img', 'pixel');
  img.src = spriteUrl(starter, 'front', stage);
  img.alt = '';
  pic.append(img);
  info.append(list, pic);

  let n = 0;
  const caseBox = el('div', 'tc-case');
  for (const group of BADGE_GROUPS) {
    const row = el('div', 'tc-row');
    const badges = el('div', 'tc-badges');
    badges.append(...BADGES.filter(b => b.group === group.id).map(b => badgeButton(b, save, earned.has(b.id), fresh.includes(b.id), fresh.includes(b.id) ? n++ : 0)));
    row.append(el('span', 'tc-group', group.name), badges);
    caseBox.append(row);
  }

  const head = el('div', 'tc-head');
  head.append(el('h2', 'tc-title', 'TRAINER CARD'), el('span', 'tc-tier', tier.name));
  head.querySelector('h2').tabIndex = -1;
  const foot = el('p', 'tc-foot', `${earned.size}/${EARNABLE.length} badges${tier.next ? ` · ${tier.next}` : ''}`);
  (into ?? $('trainer-body')).replaceChildren(head, info, el('span', 'tc-case-label', 'BADGE CASE'), caseBox, foot);
  if (!into) openDialog('trainer-dialog');
  const showing = () => (into ? into.isConnected && !into.closest('[hidden]') : dialog.open);

  if (fresh.length) {
    // each new badge pops in with a shine the first time the card opens after it
    fresh.forEach((id, i) => setTimeout(() => { if (showing()) playSound(`crystal-${i % 3}`); }, 450 + i * 260));
    updateSave(d => { d.badgesSeen = [...earned]; });
    showBadgeNews();
  }
}

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

/** The title's card button and the Bag follow the card's colour, and glint while a new badge waits to be seen. */
export function showBadgeNews(save = getSave()) {
  const tier = cardTier(save).id, news = badgeNews(save);
  for (const node of document.querySelectorAll('#title-menu .gem-dex, #bag-btn, .bag-pocket[data-pocket="trainer"]')) {
    node.dataset.tier = tier;
    node.classList.toggle('badge-news', news);
  }
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
