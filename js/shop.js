/* ============================================================
   shop.js  -  the Game Corner: spend PokéCoins on skins and
   permanent passive perks. What's for sale lives in data/shop.js;
   this file draws it on an arcade cabinet's screen, character-select
   style, and handles the joystick and buying.

   The screen holds four rows, Pokémon, Perks, Shiny and Poké Balls (the
   Safari Zone's, js/data/balls.js): the joystick's
   up/down switches row, left/right moves along it, and the choice under
   the cursor is shown big. A row longer than WINDOW cells shows the
   WINDOW around the cursor, with arrows for the rest. Buy takes two
   presses (the first arms it).
   ============================================================ */

import { SKIN_SHOP_ITEMS, PASSIVE_SHOP_ITEMS, SHINY_COSTS } from './data/shop.js';
import { BALLS } from './data/balls.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave, updateSave, perkLevel } from './storage.js';
import { safariOpen } from './data/pokedex.js';
import { checkAchievements, checkBadges, isStarterUnlocked } from './progress.js';
import { badgeLine } from './data/badges.js';
import { showBadgeNews } from './trainercard.js';
import { playSound, preloadSounds } from './audio.js';
import { $, el, refreshCoins } from './ui.js';

const ROWS = [
  { id: 'skins', name: 'Pokémon', entries: () => SKIN_SHOP_ITEMS.map(skinEntry) },
  { id: 'perks', name: 'Perks', entries: () => PASSIVE_SHOP_ITEMS.map(perkEntry) },
  { id: 'shiny', name: 'Shiny', entries: () => STARTERS.filter(s => !s.secret).map(shinyEntry) },
  { id: 'balls', name: 'Poké Balls', entries: () => BALLS.filter(b => !b.free).map(ballEntry) },
];
const cursor = { row: 0, col: [0, 0, 0, 0], armed: false, news: null };   // news: what the last purchase got you, on the screen in place of a toast
const WINDOW = 6;     // cells a row shows at once
const PUSH = 16;      // px the stick must be dragged before it counts as a push
const TRAVEL = 12;    // px the ball can lean

/** Toggle the shop dialog open/closed. It's a non-modal dialog (.show(), not
 *  .showModal()) so it floats on top of whatever screen is showing without
 *  blocking it - the map, a battle, a reward choice underneath stays fully
 *  clickable, and the shop button in the topbar stays clickable too, so it
 *  really is a toggle rather than a one-way trip.
 *  highlightId opens on one skin (used when you tap a shop-locked starter), or a row's id on that row. `modal` puts it
 *  in the top layer, over a modal window that opened it (the Safari's prep window), which a plain show() would sit under. */
export function toggleShop(highlightId, { modal = false } = {}) {
  const dialog = $('shop-dialog');
  if (dialog.open) { playSound('cancel', 'confirm'); return dialog.close(); }

  const at = SKIN_SHOP_ITEMS.findIndex(item => item.id === highlightId);
  if (at >= 0) { cursor.row = 0; cursor.col[0] = at; }
  const row = ROWS.findIndex(r => r.id === highlightId);   // a row's id opens on that row: 'balls' from the Safari's prep window
  if (row >= 0) cursor.row = row;
  cursor.armed = false;
  cursor.news = null;
  preloadSounds('stick', 'buy');
  render();
  if (modal) dialog.showModal(); else dialog.show();
  $('shop-btn').setAttribute('aria-expanded', 'true');
  $('gc-buy').focus({ preventScroll: true });
  if (at >= 0) flash('flash');
}

/**
 * The Game Corner as one of the Pokédex's apps (its dock): the cabinet's screen moves into the device's screen while
 * it's open, the device's D-pad is the joystick, A buys (twice, as Buy does) and B goes back to the Pokédex's home
 * screen instead of shutting it (the user's call, 2026-10-07). Its own Buy and the coins sit under the screen.
 */
export const cornerApp = {
  mount(panel) {
    cursor.armed = false;
    cursor.news = null;
    preloadSounds('stick', 'buy');
    const buy = el('button', 'gc-app-buy');
    buy.type = 'button';
    buy.id = 'gc-app-buy';
    buy.addEventListener('click', press);
    const foot = el('div', 'gc-app-foot');
    foot.append(el('span', 'gc-app-hint', 'D-pad to browse'), buy);
    panel.append(document.querySelector('#shop-dialog .gc-crt'), foot);
    render();
  },
  back: () => false,
  key(e) {
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!dir) return false;
    move(...dir);
    return true;
  },
  press,
  unmount() {
    document.querySelector('#shop-dialog .gc-bezel').append(document.querySelector('.cdev-app .gc-crt') ?? document.querySelector('.gc-crt'));
  },
};

/** Called once at startup: the cabinet's fixed parts and its controls. */
export function initShop() {
  for (const node of document.querySelectorAll('.gc-grille')) node.append(pixelSvg(GRILLE));
  $('gc-ball').append(pixelSvg(BALL));

  for (const pad of document.querySelectorAll('.gc-pad')) {
    pad.addEventListener('click', () => { const [dx, dy] = pad.dataset.dir.split(',').map(Number); lean(dx, dy, true); move(dx, dy); });
  }
  $('gc-buy').addEventListener('click', press);
  initDrag();

  // The cabinet isn't modal, so there's no backdrop: a tap anywhere else closes it (and does nothing else, so it can't
  // pick a starter or a map room by accident). A press that began inside (a joystick drag) doesn't count.
  let pressedInside = false;
  document.addEventListener('pointerdown', (e) => { pressedInside = !!e.target.closest?.('#shop-dialog'); }, true);
  document.addEventListener('click', (e) => {
    const dialog = $('shop-dialog');
    if (!dialog.open || pressedInside || !e.detail || document.querySelector('dialog:modal')) return;
    if (e.target.closest('#shop-dialog, .shop-btn, .app-corner, #sel-corner, .gem-corner')) return;
    e.preventDefault();
    e.stopPropagation();
    playSound('cancel', 'confirm');
    dialog.close();
  }, true);

  document.addEventListener('keydown', (e) => {
    const dialog = $('shop-dialog');
    if (!dialog.open || (document.querySelector('dialog:modal') && !dialog.matches(':modal'))) return;
    const focus = document.activeElement;
    if (focus && focus !== document.body && !dialog.contains(focus) && !focus.closest('.shop-btn, .app-corner')) return;
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
  const level = perkLevel(item.id);
  const locked = item.needsDex && !getSave().dex.complete;
  return {
    id: item.id, name: item.name, icon: item.icon, text: locked ? 'Complete the Pokédex to get the Silph Scope first.' : item.text,
    blocked: locked,
    level: `Lv ${level}/${item.maxLevel}`,
    done: level >= item.maxLevel && 'Maxed',
    cost: item.costs[level],
    bought() {
      updateSave(d => {
        if (item.maxLevel > 1) d.passives[item.id] += 1;
        else d.passives[item.id] = true;
      });
      return [item.maxLevel > 1 ? `${item.name} is now Lv ${level + 1}!` : 'Perk bought!'];
    },
  };
}

/** A starter's shiny colours: cosmetic, and only for a starter you own (a locked one shows as a silhouette). */
function shinyEntry(starter) {
  const name = starter.line[0].name;
  const known = isStarterUnlocked(starter);
  const owned = getSave().shiny.owned.includes(starter.id);
  return {
    id: starter.id, name: known ? `Shiny ${name}` : '???', sprite: spriteUrl(starter, 'front', 0, true), dark: !known,
    text: known ? 'Its rare shiny colours, on the starter screen, the map and in battle. Just for looks: tap ✨ on its card to switch.'
      : 'Unlock this starter first.',
    blocked: !known,
    done: owned && 'Owned',
    cost: SHINY_COSTS[starter.free ? 'free' : starter.legendary ? 'legendary' : 'skin'],
    bought() {
      updateSave(d => { d.shiny.owned.push(starter.id); d.shiny.on.push(starter.id); });
      return [`Shiny ${name} is yours!`, 'It\'s switched on: tap ✨ on its card to switch.'];
    },
  };
}

/** A Poké Ball for the Safari Zone: every ball but the Master Ball comes in packs (used up when thrown).
    Only for sale once the Safari Zone is open (every Pokémon beaten). */
function ballEntry(ball) {
  const balls = getSave().balls;
  const open = safariOpen(getSave());
  const have = balls[ball.id] || 0;
  return {
    id: ball.id, name: ball.stock ? `${ball.pack} ${ball.name}s` : ball.name, sprite: `assets/items/${ball.sprite}.png`,
    text: !open ? 'For the Safari Zone, which opens once you\'ve beaten every Pokémon in all three biomes.' : ball.text,
    blocked: !open,
    level: ball.stock ? `Have ${have}` : null,
    done: !ball.stock && balls.owned.includes(ball.id) && 'Owned',
    cost: ball.cost,
    bought() {
      updateSave(d => { if (ball.stock) d.balls[ball.id] = (d.balls[ball.id] || 0) + ball.pack; else d.balls.owned.push(ball.id); });
      return ball.stock ? [`${ball.pack} ${ball.name}s! You have ${have + ball.pack}.`] : [`The ${ball.name} is yours!`, 'It\'s in your Bag on every Safari Zone run, one throw a week.'];
    },
  };
}

function render() {
  refreshCoins();
  const coins = getSave().coins;
  const rows = ROWS.map(row => row.entries());
  const pick = rows[cursor.row][cursor.col[cursor.row]];

  $('gc-section').textContent = `${ROWS[cursor.row].name} ${cursor.col[cursor.row] + 1}/${rows[cursor.row].length}`;

  const art = pick.sprite ? el('img', `pixel gc-pick-sprite${pick.dark ? ' dark' : ''}`) : el('span', 'gc-pick-icon', pick.icon);
  if (pick.sprite) { art.src = pick.sprite; art.alt = ''; }
  const price = pick.done ? ownedTag(pick.done) : el('span', `gc-price${coins < pick.cost || pick.blocked ? ' short' : ''}`, `💰 ${pick.cost}`);
  const foot = el('div', 'gc-pick-foot');
  if (pick.level) foot.append(el('span', 'gc-level', pick.level));
  foot.append(price);
  // the words sit on a dark plate above the scanlines: on the bare glowing teal they were hard to read (the user's note)
  const plate = el('div', 'gc-pick-plate');
  plate.append(el('strong', 'gc-pick-name', pick.name), cursor.news ? el('span', 'gc-news', cursor.news.join(' ')) : el('span', 'gc-pick-text', pick.text), foot);
  $('gc-pick').replaceChildren(el('div', 'gc-pick-art'), plate);
  $('gc-pick').firstChild.append(art);

  $('gc-roster').replaceChildren(...rows.map((entries, r) => {
    const line = el('div', 'gc-row');
    line.setAttribute('role', 'group');
    line.setAttribute('aria-label', ROWS[r].name);
    const start = Math.max(0, Math.min(cursor.col[r] - Math.floor(WINDOW / 2) + 1, entries.length - WINDOW));
    const shown = entries.length > WINDOW;
    if (shown) line.append(el('span', `gc-more${start > 0 ? '' : ' none'}`, '◀'));
    entries.forEach((entry, c) => {
      if (shown && (c < start || c >= start + WINDOW)) return;
      const cell = el('button', 'gc-cell');
      cell.type = 'button';
      cell.setAttribute('aria-label', `${entry.name}${entry.done ? `, ${entry.done}` : `, ${entry.cost} PokéCoins`}`);
      if (r === cursor.row && c === cursor.col[r]) { cell.classList.add('on'); cell.setAttribute('aria-current', 'true'); }
      if (entry.sprite) {
        const img = el('img', `pixel${entry.dark ? ' dark' : ''}`);
        img.src = entry.sprite;
        img.alt = '';
        cell.append(img);
      } else cell.append(el('span', 'gc-cell-icon', entry.icon));
      if (entry.done) cell.append(ownedTag(''));
      cell.addEventListener('click', () => select(r, c));
      line.append(cell);
    });
    if (shown) line.append(el('span', `gc-more${start + WINDOW < entries.length ? '' : ' none'}`, '▶'));
    return line;
  }));

  const buy = $('gc-buy');
  buy.disabled = Boolean(pick.done) || pick.blocked || coins < pick.cost;
  buy.classList.toggle('armed', cursor.armed);
  buy.setAttribute('aria-label', pick.done ? pick.done : cursor.armed ? `Press again to buy ${pick.name}` : `Buy ${pick.name} for ${pick.cost} PokéCoins`);
  $('gc-buy-label').textContent = cursor.armed ? 'Sure?' : 'Buy';
  const app = document.getElementById('gc-app-buy');
  if (app) {
    app.disabled = buy.disabled;
    app.classList.toggle('armed', cursor.armed);
    app.textContent = pick.done ? 'Owned' : cursor.armed ? 'Sure? Buy!' : `Buy · ${pick.cost}`;
    app.setAttribute('aria-label', buy.getAttribute('aria-label'));
  }
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
  if (pick.done || pick.blocked || getSave().coins < pick.cost) return;
  if (!cursor.armed) { cursor.armed = true; cursor.news = null; render(); return; }
  cursor.armed = false;
  updateSave(d => { d.coins -= pick.cost; });
  playSound('buy');
  cursor.news = [...pick.bought(), ...checkBadges().map(badgeLine)];   // a shiny, a maxed perk or a full set of balls can earn one
  showBadgeNews();
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

/**
 * The stick, like a real one but easier to hit (the user found it fiddly): press anywhere on it. Dragging moves once per
 * push past PUSH (back near the middle to push again); a tap without a drag moves towards where you tapped, measured from
 * the stick's middle, so the ball (which sits above it) is "up". Held over, a push repeats, so a long row is quick.
 */
function initDrag() {
  const stick = $('gc-stick');
  let from = null, pushed = false, repeat = 0;
  const stop = () => { clearTimeout(repeat); clearInterval(repeat); repeat = 0; };
  const push = (dx, dy) => {
    const dir = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
    move(...dir);
    stop();
    repeat = setTimeout(() => { repeat = setInterval(() => move(...dir), 150); }, 420);
  };
  stick.addEventListener('pointerdown', (e) => {
    from = { x: e.clientX, y: e.clientY };
    pushed = false;
    stick.setPointerCapture(e.pointerId);
    stick.classList.add('held');
  });
  stick.addEventListener('pointermove', (e) => {
    if (!from) return;
    const dx = e.clientX - from.x, dy = e.clientY - from.y;
    const far = Math.hypot(dx, dy);
    const scale = Math.min(1, far / (PUSH * 1.5)) / (far || 1);
    lean(dx * scale, dy * scale);
    if (!pushed && far >= PUSH) { pushed = true; push(dx, dy); }
    else if (pushed && far < PUSH / 2) { pushed = false; stop(); }
  });
  const release = (e) => {
    if (!from) return;
    stop();
    stick.classList.remove('held');
    if (!pushed && e.type === 'pointerup') {
      const box = stick.getBoundingClientRect();
      const dx = e.clientX - (box.left + box.width / 2), dy = e.clientY - (box.top + box.height / 2);
      if (Math.hypot(dx, dy) > 8) {
        const dir = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
        from = null;
        lean(...dir, true);
        return move(...dir);
      }
    }
    from = null;
    lean(0, 0);
  };
  stick.addEventListener('pointerup', release);
  stick.addEventListener('pointercancel', release);
}

/** "Owned" / "Maxed" with a caught Poké Ball in front, like the games' owned mark. */
function ownedTag(text) {
  const tag = el('span', 'shop-owned');
  const ball = el('span', 'pokeball');
  ball.setAttribute('aria-hidden', 'true');
  tag.append(ball, text);
  return tag;
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
