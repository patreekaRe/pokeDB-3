/* ============================================================
   shop.js  -  the Game Corner: spend PokéCoins on skins and
   permanent passive perks. What's for sale lives in data/shop.js;
   this file draws it on an arcade cabinet's screen, character-select
   style, and handles the joystick and buying.

   The screen holds two rows, Pokémon and Perks: the joystick's up/down
   switches row, left/right moves along it, and the choice under the
   cursor is shown big. Buy takes two presses (the first arms it).
   ============================================================ */

import { SKIN_SHOP_ITEMS, PASSIVE_SHOP_ITEMS } from './data/shop.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave, updateSave } from './storage.js';
import { checkAchievements } from './progress.js';
import { playSound, preloadSounds } from './audio.js';
import { $, el, refreshCoins } from './ui.js';

const ROWS = [
  { id: 'skins', name: 'Pokémon', entries: () => SKIN_SHOP_ITEMS.map(skinEntry) },
  { id: 'perks', name: 'Perks', entries: () => PASSIVE_SHOP_ITEMS.map(perkEntry) },
];
const cursor = { row: 0, col: [0, 0], armed: false, news: null };   // news: what the last purchase got you, on the screen in place of a toast
const PUSH = 16;      // px the stick must be dragged before it counts as a push
const TRAVEL = 12;    // px the ball can lean

/** Toggle the shop dialog open/closed. It's a non-modal dialog (.show(), not
 *  .showModal()) so it floats on top of whatever screen is showing without
 *  blocking it - the map, a battle, a reward choice underneath stays fully
 *  clickable, and the shop button in the topbar stays clickable too, so it
 *  really is a toggle rather than a one-way trip.
 *  highlightId opens on one skin (used when you tap a shop-locked starter). */
export function toggleShop(highlightId) {
  const dialog = $('shop-dialog');
  if (dialog.open) { playSound('cancel', 'confirm'); return dialog.close(); }

  const at = SKIN_SHOP_ITEMS.findIndex(item => item.id === highlightId);
  if (at >= 0) { cursor.row = 0; cursor.col[0] = at; }
  cursor.armed = false;
  cursor.news = null;
  preloadSounds('stick', 'buy');
  render();
  dialog.show();
  $('shop-btn').setAttribute('aria-expanded', 'true');
  $('gc-buy').focus({ preventScroll: true });
  if (at >= 0) flash('flash');
}

/** Called once at startup: the cabinet's fixed parts and its controls. */
export function initShop() {
  for (const node of document.querySelectorAll('.gc-grille')) node.append(pixelSvg(GRILLE));
  $('gc-ball').append(pixelSvg(BALL));

  for (const pad of document.querySelectorAll('.gc-pad')) {
    pad.addEventListener('click', () => { const [dx, dy] = pad.dataset.dir.split(',').map(Number); lean(dx, dy, true); move(dx, dy); });
  }
  $('gc-buy').addEventListener('click', press);
  initDrag();

  document.addEventListener('keydown', (e) => {
    const dialog = $('shop-dialog');
    if (!dialog.open || document.querySelector('dialog:modal')) return;
    const focus = document.activeElement;
    if (focus && focus !== document.body && !dialog.contains(focus) && !focus.closest('.shop-btn, #menu-shop-btn')) return;
    if (e.key === 'Escape') { playSound('cancel', 'confirm'); dialog.close(); return; }
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!dir) return;
    e.preventDefault();
    lean(...dir, true);
    move(...dir);
  });
}

function skinEntry(item) {
  const starter = STARTERS_BY_ID[item.id];
  const name = starter.line[0].name;
  const owned = getSave().unlocked.includes(item.id);
  return {
    id: item.id, name, sprite: spriteUrl(starter, 'front'),
    text: `${cap(starter.type)} skin`,
    done: owned && 'Owned',
    cost: item.cost,
    bought() {
      updateSave(d => { d.unlocked.push(item.id); });
      // buying the last missing skin can complete an "unlock everything" goal
      return [`${name} is yours!`, ...checkAchievements().map(earned => `${earned.line[0].name} unlocked!`)];
    },
  };
}

function perkEntry(item) {
  const level = currentLevel(item);
  return {
    id: item.id, name: item.name, icon: item.icon, text: item.text,
    level: item.maxLevel > 1 ? `Lv ${level}/${item.maxLevel}` : '',
    done: level >= item.maxLevel && 'Maxed',
    cost: item.costs[level],
    bought() {
      updateSave(d => {
        if (item.maxLevel > 1) d.passives[item.id] += 1;
        else d.passives[item.id] = true;
      });
      return ['Perk bought!'];
    },
  };
}

function render() {
  refreshCoins();
  const coins = getSave().coins;
  const rows = ROWS.map(row => row.entries());
  const pick = rows[cursor.row][cursor.col[cursor.row]];

  $('gc-section').textContent = `${ROWS[cursor.row].name} ${cursor.col[cursor.row] + 1}/${rows[cursor.row].length}`;

  const art = pick.sprite ? el('img', 'pixel gc-pick-sprite') : el('span', 'gc-pick-icon', pick.icon);
  if (pick.sprite) { art.src = pick.sprite; art.alt = ''; }
  const price = pick.done ? ownedTag(pick.done) : el('span', `gc-price${coins < pick.cost ? ' short' : ''}`, `💰 ${pick.cost}`);
  const foot = el('div', 'gc-pick-foot');
  if (pick.level) foot.append(el('span', 'gc-level', pick.level));
  foot.append(price);
  $('gc-pick').replaceChildren(el('div', 'gc-pick-art'), el('strong', 'gc-pick-name', pick.name), cursor.news ? el('span', 'gc-news', cursor.news.join(' ')) : el('span', 'gc-pick-text', pick.text), foot);
  $('gc-pick').firstChild.append(art);

  $('gc-roster').replaceChildren(...rows.map((entries, r) => {
    const line = el('div', 'gc-row');
    line.setAttribute('role', 'group');
    line.setAttribute('aria-label', ROWS[r].name);
    entries.forEach((entry, c) => {
      const cell = el('button', 'gc-cell');
      cell.type = 'button';
      cell.setAttribute('aria-label', `${entry.name}${entry.done ? `, ${entry.done}` : `, ${entry.cost} PokéCoins`}`);
      if (r === cursor.row && c === cursor.col[r]) { cell.classList.add('on'); cell.setAttribute('aria-current', 'true'); }
      if (entry.sprite) {
        const img = el('img', 'pixel');
        img.src = entry.sprite;
        img.alt = '';
        cell.append(img);
      } else cell.append(el('span', 'gc-cell-icon', entry.icon));
      if (entry.done) cell.append(ownedTag(''));
      cell.addEventListener('click', () => select(r, c));
      line.append(cell);
    });
    return line;
  }));

  const buy = $('gc-buy');
  buy.disabled = Boolean(pick.done) || coins < pick.cost;
  buy.classList.toggle('armed', cursor.armed);
  buy.setAttribute('aria-label', pick.done ? pick.done : cursor.armed ? `Press again to buy ${pick.name}` : `Buy ${pick.name} for ${pick.cost} PokéCoins`);
  $('gc-buy-label').textContent = cursor.armed ? 'Sure?' : 'Buy';
}

function move(dx, dy) {
  if (dy) cursor.row = (cursor.row + dy + ROWS.length) % ROWS.length;
  if (dx) {
    const count = ROWS[cursor.row].entries().length;
    cursor.col[cursor.row] = (cursor.col[cursor.row] + dx + count) % count;
  }
  cursor.armed = false;
  cursor.news = null;
  playSound('stick', 'confirm');
  render();
}

function select(row, col) {
  cursor.row = row;
  cursor.col[row] = col;
  cursor.armed = false;
  cursor.news = null;
  playSound('stick', 'confirm');
  render();
}

/** First press arms the button, the second buys (the menu blip covers the first). */
function press() {
  const pick = ROWS[cursor.row].entries()[cursor.col[cursor.row]];
  if (pick.done || getSave().coins < pick.cost) return;
  if (!cursor.armed) { cursor.armed = true; cursor.news = null; render(); return; }
  cursor.armed = false;
  updateSave(d => { d.coins -= pick.cost; });
  playSound('buy');
  cursor.news = pick.bought();
  render();
  flash('won');
}

function flash(name) {
  const pick = $('gc-pick');
  pick.classList.remove(name);
  void pick.offsetWidth;
  pick.classList.add(name);
}

/** Lean the ball towards a direction; `bounce` springs it back, as a tap or key press does. */
function lean(dx, dy, bounce = false) {
  const stick = $('gc-stick');
  stick.style.setProperty('--tx', `${dx * TRAVEL}px`);
  stick.style.setProperty('--ty', `${dy * TRAVEL * 0.6}px`);
  clearTimeout(lean.timer);
  if (bounce) lean.timer = setTimeout(() => lean(0, 0), 140);
}

/** Drag the ball like a real stick: one move per push past PUSH, back near the middle to push again. */
function initDrag() {
  const ball = $('gc-ball');
  let from = null, pushed = false;
  ball.addEventListener('pointerdown', (e) => {
    from = { x: e.clientX, y: e.clientY };
    pushed = false;
    ball.setPointerCapture(e.pointerId);
    $('gc-stick').classList.add('held');
  });
  ball.addEventListener('pointermove', (e) => {
    if (!from) return;
    const dx = e.clientX - from.x, dy = e.clientY - from.y;
    const far = Math.hypot(dx, dy);
    const scale = Math.min(1, far / (PUSH * 1.5)) / (far || 1);
    lean(dx * scale, dy * scale);
    if (!pushed && far >= PUSH) {
      pushed = true;
      if (Math.abs(dx) > Math.abs(dy)) move(Math.sign(dx), 0);
      else move(0, Math.sign(dy));
    } else if (pushed && far < PUSH / 2) pushed = false;
  });
  const release = () => { from = null; lean(0, 0); $('gc-stick').classList.remove('held'); };
  ball.addEventListener('pointerup', release);
  ball.addEventListener('pointercancel', release);
}

/** "Owned" / "Maxed" with a caught Poké Ball in front, like the games' owned mark. */
function ownedTag(text) {
  const tag = el('span', 'shop-owned');
  const ball = el('span', 'pokeball');
  ball.setAttribute('aria-hidden', 'true');
  tag.append(ball, text);
  return tag;
}

/** How many levels of a passive you already own (stacking ones are a number, others true/false). */
function currentLevel(item) {
  const value = getSave().passives[item.id];
  return typeof value === 'number' ? value : (value ? 1 : 0);
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

/* ---------- the cabinet's pixel parts ---------- */

const PIXEL_COLORS = { k: '#181010', d: '#303038', g: '#58585f', l: '#8a8a92', r: '#e83828', R: '#a01818', w: '#f8f8f8', p: '#f8a8a0' };

// a round speaker grille: a dark cone behind a plate punched with holes
const GRILLE = [
  '....kkkkkk....',
  '..kkgggggglk..',
  '.kggdgdgdgglk.',
  '.kgdgdgdgdgdk.',
  'kgdgdgdgdgdgdk',
  'kggdgdgdgdgdgk',
  'kgdgdgdgdgdgdk',
  'kggdgdgdgdgdgk',
  'kgdgdgdgdgdgdk',
  'kggdgdgdgdgdgk',
  '.kgdgdgdgdgdk.',
  '.kggdgdgdgdgk.',
  '..kkggggggkk..',
  '....kkkkkk....',
];

// the joystick's red ball-top, lit from the top left
const BALL = [
  '...kkkkkk...',
  '..krrrrrrk..',
  '.krpwrrrrRk.',
  'krpwwrrrrrRk',
  'krpwrrrrrrRk',
  'krrrrrrrrrRk',
  'krrrrrrrrRRk',
  'krrrrrrrRRRk',
  '.kRrrrrRRRk.',
  '..kRRRRRRk..',
  '...kkkkkk...',
];

function pixelSvg(map) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${map[0].length} ${map.length}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-hidden', 'true');
  map.forEach((line, y) => [...line].forEach((ch, x) => {
    if (ch === '.') return;
    const px = document.createElementNS(ns, 'rect');
    px.setAttribute('x', x);
    px.setAttribute('y', y);
    px.setAttribute('width', 1.02);
    px.setAttribute('height', 1.02);
    px.setAttribute('fill', PIXEL_COLORS[ch]);
    svg.append(px);
  }));
  return svg;
}
