/* ============================================================
   duoprep.js  -  the Safari lobby's Duo key (docs/duo-design.md section 2): the Duo Run's app, slid over the lobby's
   LCD like Pokédex / Ranks / Buy. Today's road (each area's main types and Pokémon, to plan by), your duo pool (a
   portrait per type, its look any owned starter of that type), how the pair fares in each area, and A = Start Duo.
   A Duo Run is a replay: it opens once the day's free Daily run is finished, needs the Day Pass and never posts.
   ============================================================ */

import { safariDaily, SAFARI_DEX_PAGES, safariProgress } from './data/safari.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { STARTERS, STARTERS_BY_ID, DUO_STARTERS, spriteUrl } from './data/starters.js';
import { TYPES } from './data/cards.js';
import { REAL_TYPES, speciesTypes, realFactor } from './data/real-types.js';
import { DUO_BASE, DUO_LINES, duoPool, duoOpen } from './data/duo.js';
import { spriteFit, bodyX } from './data/sprite-fit.js';
import { getSave } from './storage.js';
import { typeBadge } from './type-badge.js';
import { isStarterUnlocked } from './progress.js';
import { playSound } from './audio.js';
import { $, el } from './ui.js';

/** ?duorun opens the Duo Run for the page load without finishing the day's Daily run (a playtest; nothing saved). */
export const duoLent = () => new URLSearchParams(location.search).has('duorun');
export const duoUnlocked = () => duoLent() || duoOpen(getSave().safari, safariDaily().day);

const owned = (s) => !s.comingSoon && isStarterUnlocked(s);

/** ?duopool lends every new type built so far (its starters' looks) for the page load: a playtest, nothing saved. */
const poolLent = () => new URLSearchParams(location.search).has('duopool');
/** Your duo pool, with ?duopool's lent types. */
function poolNow() {
  const pool = duoPool(getSave(), STARTERS, owned);
  if (poolLent()) for (const s of DUO_STARTERS) pool[s.type] = [...new Set([...(pool[s.type] || []), s.id])];
  return pool;
}

let host = null, start = null;
const pick = { order: [], look: {} };   // the types picked, lead first, and the look shown for each type
const opened = new Set();   // the areas of today's road unfolded, kept across a pick's re-render

/** An area's main types: the real types most of its wild Pokémon wear, two or three. */
export function areaTypes(area) {
  const count = {};
  for (const id of area.normals) for (const t of speciesTypes(ENEMY_DEFS[id])) count[t] = (count[t] || 0) + 1;
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]);
  return top.filter(([, n], i) => i < 2 || (i < 3 && n >= top[0][1] * 0.6)).map(([t]) => t);
}

/** How a pair fares in an area: ▲ its main types either of the two hits super effectively, ▼ the ones that hit either. */
export function fares(types, area) {
  const main = areaTypes(area);
  return {
    up: main.filter(t => types.some(mine => realFactor(mine, [t]) > 1)).length,
    down: main.filter(t => types.some(mine => realFactor(t, [mine]) > 1)).length,
    of: main.length,
  };
}

function chip(t) {
  const c = el('span', `duo-type type-${t}`);
  c.append(typeBadge(t), REAL_TYPES[t].label);
  c.title = `${REAL_TYPES[t].label} type`;
  return c;
}

function road(daily) {
  const seen = new Set([...getSave().safariDex.seen, ...getSave().safariDex.caught]);
  const box = el('ol', 'duo-road');
  daily.areas.forEach((area, i) => {
    const li = el('li', 'duo-area');
    const fold = el('details', 'duo-fold');
    fold.open = opened.has(area.id);
    fold.addEventListener('toggle', () => { if (fold.open) opened.add(area.id); else opened.delete(area.id); });
    const page = SAFARI_DEX_PAGES.find(p => p.area === area.id);
    const { caught } = safariProgress(page.ids, getSave().safariDex);
    const head = el('summary', `duo-area-head${caught === page.ids.length ? ' done' : ''}`);
    head.append(el('span', 'sp-area-no', `${i + 1}`), el('b', '', area.name), el('small', 'duo-area-count', `${caught}/${page.ids.length}`));
    head.title = `${area.name}: ${caught} of ${page.ids.length} caught. Tap for its types and Pokémon.`;
    head.addEventListener('click', () => playSound('confirm'));
    const types = el('span', 'duo-types');
    types.append(...areaTypes(area).map(chip));
    const mons = el('span', 'duo-mons');
    for (const id of area.normals.slice(0, 4)) {
      const img = el('img', `pixel duo-mon${seen.has(id) ? '' : ' unseen'}`);
      img.src = ENEMY_DEFS[id].image;
      img.alt = '';
      img.title = seen.has(id) ? `${ENEMY_DEFS[id].name}: ${speciesTypes(ENEMY_DEFS[id]).map(t => REAL_TYPES[t].label).join(' / ')}` : `Not seen yet: ${speciesTypes(ENEMY_DEFS[id]).map(t => REAL_TYPES[t].label).join(' / ')}`;
      mons.append(img);
    }
    for (const id of area.rares.slice(0, 2)) {
      const img = el('img', 'pixel duo-mon rare unseen');
      img.src = ENEMY_DEFS[id].image;
      img.alt = '';
      img.title = 'A rare spawn';
      mons.append(img, el('span', 'map-rare inline', '✦'));
    }
    fold.append(head, types, mons);
    if (pick.order.length === 2) {
      const f = fares(pick.order, area);
      fold.append(el('p', 'duo-fares', `▲ ${f.up}/${f.of} you hit hard · ▼ ${f.down}/${f.of} hit you hard`));
    }
    li.append(fold);
    box.append(li);
  });
  return box;
}

function portrait(type, pool) {
  const looks = pool[type] || [];
  const have = looks.length > 0;
  const on = pick.order.indexOf(type);
  const card = el('div', `duo-pick type-${type}${have ? '' : ' locked'}${on >= 0 ? ' on' : ''}`);
  const look = STARTERS_BY_ID[looks.includes(pick.look[type]) ? pick.look[type] : looks[0]];
  const face = el('button', 'duo-face');
  face.type = 'button';
  if (look) face.append(faceSprite(spriteUrl(look, 'front', 0)));
  const badge = typeBadge(type);
  badge.classList.add('duo-face-type');
  face.append(badge, ...(on >= 0 ? [el('em', 'duo-face-no', on === 0 ? 'Lead' : '2nd')] : []));
  const label = have ? `${look.line[0].name} (${(TYPES[type] ?? REAL_TYPES[type]).label})` : `${REAL_TYPES[type].label}: not caught yet`;
  face.title = label;
  face.setAttribute('aria-label', label);
  face.setAttribute('aria-pressed', String(on >= 0));
  face.addEventListener('click', () => {
    if (!have) { playSound('no-pp'); return; }
    playSound('confirm');
    if (on >= 0) pick.order.splice(on, 1);
    else { pick.order.push(type); if (pick.order.length > 2) pick.order.splice(1, 1); }   // a third pick takes the 2nd's place
    render();
  });
  card.append(face, el('small', 'duo-name', have ? look.line[0].name : '???'));
  if (looks.length > 1) {   // ◀ ▶: any owned starter of the type is its look
    const step = (d) => () => { playSound('cursor', 'confirm'); pick.look[type] = looks[(looks.indexOf(look.id) + d + looks.length) % looks.length]; render(); };
    const row = el('span', 'duo-look');
    const prev = el('button', 'duo-arrow', '◀'), next = el('button', 'duo-arrow', '▶');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', 'Previous look');
    next.setAttribute('aria-label', 'Next look');
    prev.addEventListener('click', step(-1));
    next.addEventListener('click', step(1));
    row.append(prev, el('span', '', `${looks.indexOf(look.id) + 1}/${looks.length}`), next);
    card.append(row);
  }
  if (!have) card.append(el('small', 'duo-hint', hintFor(type)));
  return card;
}

const FACE = 64, POSE = 50;   // the portrait's circle, and how big the Pokémon's resting pose stands in it
/** A starter's sprite stood in the middle of its portrait by its resting pose (SPRITE_FIT) and its body (BODY_X), not
    its GIF's frame, whose empty room for a hop or a tail pushed it off centre (the user's call, 2026-10-20). */
function faceSprite(src) {
  const img = el('img', 'pixel duo-face-mon');
  img.alt = '';
  img.onload = () => {
    const W = img.naturalWidth, H = img.naturalHeight, [top, bottom, left, right] = spriteFit(src);
    const pw = W - left - right, ph = H - top - bottom, k = POSE / Math.max(pw, ph);
    Object.assign(img.style, { width: `${W * k}px`, height: `${H * k}px`,
      left: `${FACE / 2 - (left + pw / 2 + bodyX(src)) * k}px`, top: `${FACE / 2 - (top + ph / 2) * k}px` });
  };
  img.src = src;
  const pic = el('span', 'duo-face-pic');
  pic.append(img);
  return pic;
}

/** Where a type not caught yet comes from: "Catch Shinx in the Power Plant". */
function hintFor(type) {
  const first = Object.keys(DUO_LINES[type] || {})[0];
  return first ? `Catch ${STARTERS_BY_ID[first]?.line[0].name ?? first} in the Safari` : 'Coming soon';
}

function render() {
  if (!host) return;
  const daily = safariDaily(), pool = poolNow();
  const open = duoUnlocked();
  const types = [...new Set([...DUO_BASE, ...Object.keys(pool), ...Object.keys(DUO_LINES)])];
  const parts = [];
  parts.push(el('h3', 'duo-head', 'Your duo pool'), el('p', 'duo-note', 'Pick two types. The first is out first; switch for 1 PP on your turn.'));
  if (!open) parts.push(el('p', 'duo-lock', "🔒 Finish today's Daily run to unlock the Duo Run (won or lost)."));
  const grid = el('div', 'duo-pool');
  grid.append(...types.map(t => portrait(t, pool)));
  parts.push(grid);
  parts.push(el('h3', 'duo-head', "Today's road"), el('p', 'duo-note', "Today's Daily run, the same three areas. Tap one for its types and Pokémon."), road(daily));
  if (open) parts.push(el('p', 'duo-note', 'A replay with the Day Pass: perks on, coins as a replay, never on the leaderboard.'));
  host.replaceChildren(...parts);
  host.dispatchEvent(new Event('duo-change', { bubbles: true }));
}

/** The looks picked so far, lead first (none, one or two), for the lobby's window to stand at the gate. */
export function duoLooks() {
  const pool = poolNow();
  return pick.order.map(t => STARTERS_BY_ID[(pool[t] || []).includes(pick.look[t]) ? pick.look[t] : pool[t]?.[0]]).filter(Boolean);
}

/** The picked pair as starter ids, lead first, or null until two are picked. */
function pair() {
  const pool = poolNow();
  if (pick.order.length !== 2) return null;
  return pick.order.map(t => (pool[t].includes(pick.look[t]) ? pick.look[t] : pool[t][0]));
}

/** The lobby's A while the app is open. */
export const duoLabel = () => (!duoUnlocked() ? 'Locked' : pick.order.length === 2 ? 'Start Duo' : 'Pick 2');

export const duoApp = {
  /** `onStart(ids)` begins the run (js/main.js). */
  setStart(fn) { start = fn; },
  mount(panel) {
    host = el('div', 'duo-app');
    panel.append(host);
    render();
  },
  unmount() { host = null; },
  back() { return false; },
  key() { return false; },
  press() {
    const ids = pair();
    if (!duoUnlocked() || !ids) { playSound('no-pp'); return; }
    playSound('confirm');
    start?.(ids);
  },
};
