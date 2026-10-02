/* ============================================================
   title.js  -  the title screen, which is also the game's home.

   Once per page load it opens on PRESS START (a Gold/Silver homage: a
   pixel sky lit for the player's time of day (dusk: a moon), the flying legendaries crossing it in turn,
   over an empty grassy ledge). After that it's the main
   menu: a stack of pixel gems under the logo (Continue, New game,
   Collection, Game Corner, after the user's references: Slay the Spire 2's
   short centred list and glossy hexagon buttons). "Main menu" anywhere
   comes back here, straight to the gems.

   The sky is painted into a small canvas (one canvas pixel = PIXEL CSS
   pixels, upscaled with image-rendering: pixelated) so it stays blocky
   on any screen, and so are the gems (gemPx() CSS pixels a pixel). It only
   animates while the title is up.
   ============================================================ */

import { $, el, setHpBar } from './ui.js';
import { LOGO, EDGE, logoPixel, paintGlyph } from './logo.js';
import { playSound, playCry, playMusic, closeSoundPops } from './audio.js';
import { timeOfDay } from './daytime.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { safariDaily, SAFARI_DEX_PAGES, safariProgress } from './data/safari.js';
import { getSave } from './storage.js';
import { safariOpen } from './data/pokedex.js';
import { tipAt } from './tips.js';
import { isStarterUnlocked } from './progress.js';
import { makeGate, gateHp, gateReady } from './gate.js';
import { spriteFit } from './data/sprite-fit.js';

const PIXEL = 3;
const FPS = 10;                 // a stepped, Game Boy-ish frame rate for the twinkles
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/* The sky follows the player's clock (js/daytime.js). Dusk is the one the user picked for the title (2026-09-28: deep
   blue up top, a warm rose horizon); the moon is the sun by day, and the stars only come out at dusk and night. */
const SKIES = {
  dawn: {
    sky: ['#3c4c9c', '#6a6cb0', '#a07cb8', '#d894b4', '#f8b4a8', '#f8d8b0'],
    orb: ['#fffcec', '#f8e0a8', '#f8c8b8'], moon: false, stars: false,
    farHills: '#8a78b0', nearHills: '#5a5494', grass: ['#2a5a3a', '#3e7e4a', '#62ae62', '#a0e080'],
  },
  day: {
    sky: ['#3c88e0', '#58a0ea', '#74b4f0', '#94c8f4', '#b4dcf8', '#d4ecf8'],
    orb: ['#fffce8', '#fff0a0', '#b8dcf8'], moon: false, stars: false,
    farHills: '#7ab4c0', nearHills: '#4e8c7c', grass: ['#2e6a34', '#44904a', '#6ac060', '#a8e880'],
  },
  dusk: {
    sky: ['#1c2360', '#2c3480', '#46479a', '#7258a6', '#b06c9e', '#ec9888'],
    orb: ['#f8f0c8', '#d8cc98', '#9a88d0'], moon: true, stars: true,
    farHills: '#5c4c96', nearHills: '#383274', grass: ['#1e4a30', '#2e6e42', '#4c9e58', '#86d470'],
  },
  night: {
    sky: ['#060820', '#0a0e2e', '#10163c', '#161e4a', '#1e2856', '#283462'],
    orb: ['#f8f4dc', '#d0ccb0', '#3a4880'], moon: true, stars: true,
    farHills: '#1e2650', nearHills: '#121a3a', grass: ['#0e2a20', '#16402c', '#26603a', '#3e8a50'],
  },
};

const gemPx = () => (innerHeight <= 700 ? 3 : 4);   // CSS pixels per gem pixel: smaller on short windows (css/menus.css --gp)
const GEM_H = 16, GEM_BIG = 19;   // gem heights in pixels: Continue's is bigger (the user's call)
// face, top light, bottom shade (the reference's amber, violet, gold and coral)
const GEMS = {
  continue: ['#f0a030', '#ffd070', '#c07018'],
  new: ['#b848d8', '#e088f8', '#7a2098'],
  collection: ['#e0bc28', '#fff080', '#a88410'],
  corner: ['#f06038', '#ff9870', '#b83018'],
  safari: ['#58a838', '#98e070', '#2e7020'],
};
const OUTLINE = '#2a1408', BRONZE_LIGHT = '#d8a068', BRONZE_DARK = '#8a5430', BRONZE_MID = '#a86c3c', GROOVE = '#3a1c0c';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let actions = null;       // what the gems do, and the saved run for Continue (initTitle)
let pressed = false;      // PRESS START happens once per page load
let base = null, stars = [], shooting = null, W = 0, H = 0, timer = 0, frame = 0, look = SKIES.dusk;

/** Called once at startup with what the menu's gems do: { savedRun(), onContinue(run), onNewGame(), onCollection(), onGameCorner() }. */
/* The legendaries that fly (or float) cross the sky one at a time, like Ho-Oh in the Gold intro: a black silhouette until
   you've unlocked that one, then in its own colours (shiny if you've switched its shiny on). Each pass deals the next from
   a shuffled round, so they all come by before any comes back. Never Mewtwo: it has no flying sprite, and it's the secret
   (the user's call, 2026-10-02). */
const FLYERS = ['moltres', 'hooh', 'lugia', 'reshiram', 'celebi', 'victini', 'rayquaza'];
let flight = [], lastFlyer = null;

function nextFlyer(img) {
  if (!flight.length) {
    flight = FLYERS.map(id => [Math.random(), id]).sort((a, b) => a[0] - b[0]).map(([, id]) => id);
    if (flight[0] === lastFlyer) flight.push(flight.shift());
  }
  const id = lastFlyer = flight.shift(), starter = STARTERS_BY_ID[id], lit = isStarterUnlocked(starter);
  img.onload = () => img.style.setProperty('--w', Math.max(64, img.naturalWidth));   // one scale, so Celebi stays small next to Lugia (not a speck)
  img.src = lit ? spriteUrl(starter, 'front') : `assets/pokemon/${id}-front.gif`;
  img.classList.toggle('lit', lit);
}

export function initTitle(handlers) {
  actions = handlers;
  const screen = $('title-screen');
  const flyer = screen.querySelector('.title-flyer');
  nextFlyer(flyer);
  flyer.addEventListener('animationiteration', () => nextFlyer(flyer));   // swapped while it's off screen
  $('press-start-text').textContent = matchMedia('(pointer: coarse)').matches ? 'TAP TO START' : 'PRESS START';
  screen.addEventListener('click', (e) => { if (!pressed && !e.target.closest('.gem')) start(e); });
  $('title-refresh').addEventListener('click', refreshGame);
  paintLogo();
  initRope();
  $('title-gate').addEventListener('click', enterGate);
  gateReady().then(paintGate);
  document.addEventListener('keydown', (e) => {
    if (screen.hidden || document.querySelector('dialog:modal, #shop-dialog[open]') || document.activeElement?.matches?.('input')) return;
    if (!pressed) return start(e);
    const gems = [...screen.querySelectorAll('.gem')];
    const at = gems.findIndex(g => g.classList.contains('on'));
    const step = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (step) { e.preventDefault(); point(gems[(at + step + gems.length) % gems.length]); }
    if ((e.key === 'Enter' || e.key === ' ') && !document.activeElement?.closest?.('.gem, .gem-side, .title-corner, .title-gate, .title-signpost, .title-areas') && gems[at]) { e.preventDefault(); gems[at].click(); }
  });
  addEventListener('resize', () => { if (!screen.hidden) { paint(); sizeGems(); paintLogo(); } });
}

/** The first time: PRESS START. Resolves once it's pressed and the menu is up. */
export function showTitle() {
  pressed = false;
  open();
  $('press-start').focus({ preventScroll: true });
  return new Promise(resolve => { showTitle.done = resolve; });
}

/** Back to the menu from anywhere (Main menu, a run's end, Back): straight to the gems. */
export function showHome() {
  pressed = true;
  playMusic('title');   // the overlay doesn't go through showScreen(), so a run's map or battle track would play on
  open();
  renderMenu();
}

/** Leave the title for another screen: it fades while that screen comes in under it. */
export function leaveTitle() {
  const screen = $('title-screen');
  if (screen.hidden) return;
  screen.classList.add('away');
  closeSoundPops();
  setTimeout(() => {
    screen.hidden = true;
    screen.classList.remove('away');
    document.body.classList.remove('titling');
    clearInterval(timer);
    timer = 0;
  }, still() ? 0 : 380);
}

function open() {
  const screen = $('title-screen');
  screen.classList.toggle('menu', pressed);
  screen.classList.remove('away');
  screen.hidden = false;
  document.body.classList.add('titling');
  paint();
  renderRun(actions.savedRun());
  clearInterval(timer);
  if (!still()) timer = setInterval(tick, 1000 / FPS);
}

function start(e) {
  if (e.type === 'keydown' && (e.repeat || ['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key))) return;
  e.preventDefault();
  pressed = true;
  // the menu blip only answers buttons, and a tap on the sky isn't one: every way in says so (the user heard silence)
  playSound('confirm');
  const screen = $('title-screen');
  screen.classList.add('flash');
  setTimeout(() => {
    screen.classList.remove('flash');
    screen.classList.add('menu');
    renderMenu();
    showTitle.done?.();
    showTitle.done = null;
  }, still() ? 0 : 260);
}

/* ---------- the gem menu ---------- */

function renderMenu() {
  const run = actions.savedRun();
  const gems = [
    run && gem('continue', 'Continue', () => sendOut(run), runIcon(run)),
    gem('new', 'New game', hatch, el('span', 'gem-emoji gem-egg', '🥚')),   // an Egg, a new adventure hatching: Continue has the Poké Ball
    gem('collection', 'Collection', actions.onCollection, el('span', 'gem-emoji', '📕')),
    gem('corner', 'Game Corner', actions.onGameCorner, el('span', 'gem-emoji', '🎰')),
    safariGem(),
  ].filter(Boolean);
  gems.forEach((g, i) => g.style.setProperty('--i', i));   // inherited, so the Safari gem's row passes it on
  $('title-menu').replaceChildren(...gems);
  sizeGems();
  point(gems[0], true);
}

function gem(kind, label, onPick, icon, extra) {
  const btn = el('button', `gem gem-${kind}`);
  btn.type = 'button';
  btn.dataset.kind = kind;
  const name = el('span', 'gem-label');
  name.append(el('span', 'gem-name', label));
  if (extra) name.append(extra);
  btn.append(el('canvas', 'gem-face'), el('span', 'gem-icon'), name);
  btn.querySelector('.gem-icon').append(icon);
  btn.addEventListener('pointerenter', () => point(btn, true));
  btn.addEventListener('focus', () => point(btn, true));
  btn.addEventListener('click', () => { if (!btn.disabled) onPick(); });
  return btn;
}

/** The Safari Zone, the daily run: today's starter on its face (its areas on the signpost beside it). Locked (the whole gem
    greyed out, a Safari Ball on it) until every Pokédex entry has been beaten; a tap then says so. */
function safariGem() {
  const open = safariOpen(getSave());
  const daily = safariDaily();
  plantSign(open && daily);
  const line = daily.areas.map(a => a.name).join(' · ');
  const icon = el('img', open ? 'pixel gem-mon' : 'pixel gem-ball');
  icon.alt = '';
  if (open) icon.addEventListener('load', () => fitMon(icon), { once: true });
  icon.src = open ? spriteUrl(daily.starter, 'front', 0) : 'assets/items/safari-ball.png';
  const btn = gem('safari', 'Safari Zone', () => {
    if (open) return actions.onSafari();
    playSound('cancel');
    tipAt(btn, 'The Safari Zone opens once you\'ve beaten every Pokémon in the Pokédex.');
  }, icon);   // today's areas are on the signpost in the grass (the user's call); locked, a tap says why
  btn.classList.toggle('locked', !open);
  const full = open && getSave().safariDex.complete;   // every Safari Pokémon caught: a gold ✦ on the gem
  if (full) btn.append(el('span', 'gem-badge', '✦'));
  btn.title = (full ? 'Safari Pokédex complete! ' : '') + (open ? `Today's run, the same for everyone: ${daily.starter.line[0].name} through the ${line}. Only the first try counts.` : 'Beat every Pokémon in the Pokédex to open the Safari Zone.');
  if (!open) return btn;
  // the day's leaderboard, a trophy hung off the gem's right edge so the gem stays centred in the stack
  const row = el('div', 'gem-row');
  const board = el('button', 'gem-side gem-board');
  board.append(el('span', 'gem-side-icon', '🏆'));
  board.type = 'button';
  board.id = 'title-board';
  board.title = 'Today\'s Safari Zone leaderboard';
  board.setAttribute('aria-label', 'Safari Zone leaderboard');
  board.addEventListener('click', () => { playSound('confirm'); actions.onBoard(); });
  row.append(btn, board);
  return row;
}

/** A wooden signpost planted in the grass at the bottom left, part of the scene (the user's call, 2026-10-02), only while
    the Safari Zone is open: a tap pops up today's three areas, readable, with each page's caught count, over the sign.
    A tap elsewhere or Escape puts it away. */
const areasPop = el('div', 'gem-areas-pop title-areas');
areasPop.id = 'title-areas';
areasPop.hidden = true;
function plantSign(daily) {
  closeAreas();
  document.getElementById('title-sign')?.remove();
  if (!daily) return areasPop.remove();
  $('title-screen').append(areaSign(daily), areasPop);
}
function areaSign(daily) {
  const sign = el('button', 'title-signpost');
  sign.append(el('span', 'signpost-art', '🪧'), el('span', 'signpost-bang', '!'));
  sign.type = 'button';
  sign.id = 'title-sign';
  sign.title = 'Today\'s Safari Zone areas';
  sign.setAttribute('aria-label', 'Today\'s Safari Zone areas');
  sign.setAttribute('aria-expanded', 'false');
  sign.setAttribute('aria-controls', 'title-areas');
  sign.addEventListener('click', () => {
    const open = areasPop.hidden;
    playSound(open ? 'stick' : 'cancel', 'confirm');
    if (open) {
      const dex = getSave().safariDex;
      const list = el('ol');
      list.append(...daily.areas.map((area, i) => {
        const page = SAFARI_DEX_PAGES.find(p => p.area === area.id);
        const li = el('li', `area-${area.id}`);
        li.append(el('span', '', `${i + 1}. ${area.name}`), el('small', '', `${safariProgress(page.ids, dex).caught}/${page.ids.length} caught`));
        return li;
      }));
      areasPop.replaceChildren(el('strong', '', 'Today\'s Safari areas'), list);
    }
    areasPop.hidden = !open;
    sign.setAttribute('aria-expanded', String(open));
  });
  return sign;
}
function closeAreas() {
  if (areasPop.hidden) return;
  areasPop.hidden = true;
  document.getElementById('title-sign')?.setAttribute('aria-expanded', 'false');
}
document.addEventListener('pointerdown', (e) => { if (!e.target.closest?.('#title-areas, #title-sign')) closeAreas(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAreas(); });

/** A Pokémon GIF has empty space round it (more under its feet), so it sat off-centre in the gem's icon slot: scale its
    visible pixels (SPRITE_FIT's gaps) to fill the slot, a little over, and centre them, in % of the square slot. */
function fitMon(img) {
  const [top, bottom, left, right] = spriteFit(img.src);
  const w = img.naturalWidth - left - right, h = img.naturalHeight - top - bottom;
  const k = 1.2 / Math.max(w, h);
  const pct = (n) => `${(n * 100).toFixed(2)}%`;
  Object.assign(img.style, {
    width: pct(img.naturalWidth * k), height: pct(img.naturalHeight * k),
    left: pct(-left * k + (1 - w * k) / 2), top: pct(-top * k + (1 - h * k) / 2),
  });
}

/** The ▶ follows the pointer or the arrow keys, like the games' menus. */
function point(btn, quiet = false) {
  if (!btn) return;
  const moved = !btn.classList.contains('on');
  document.querySelectorAll('#title-menu .gem').forEach(g => g.classList.toggle('on', g === btn));
  if (!quiet && moved) playSound('stick', 'confirm');
  if (document.activeElement !== btn && document.activeElement?.closest?.('#title-menu')) btn.focus({ preventScroll: true });
}

/** Each gem's canvas is a whole number of gem pixels wide, so its pixels stay square at any screen width. */
function sizeGems() {
  const px = gemPx();
  const cols = Math.floor(Math.min(300, innerWidth * 0.8) / px);
  for (const btn of document.querySelectorAll('#title-menu .gem')) {
    const big = btn.dataset.kind === 'continue';
    const w = big ? cols + 2 * Math.round(cols * 0.04) : cols, h = big ? GEM_BIG : GEM_H;
    btn.style.width = `${w * px}px`;
    btn.style.height = `${h * px}px`;
    // the icon keeps the same place on the face: Continue is wider, so its ends are further out
    btn.style.setProperty('--icon-x', big ? 8 + (w - cols) / 2 + 1 : 8);
    paintGem(btn.querySelector('.gem-face'), w, h, GEMS[btn.dataset.kind], big ? shine : null);
  }
}

/**
 * A pixel gem, after the glossy hexagon reference: pointed ends, a dark outline, a two-tone bronze frame and an inner
 * groove round a face with a light band on top, a shade band below, a gloss streak and white glints.
 */
function paintGem(canvas, cols, rows, [face, hi, lo], sweep = null) {
  canvas.width = cols;
  canvas.height = rows;
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, cols, rows);
  const mid = (rows - 1) / 2;
  const inset = (y) => Math.round(Math.abs(y - mid) * 0.75);   // how far in the pointed ends are on each row
  for (let y = 0; y < rows; y++) {
    const left = inset(y), right = cols - 1 - inset(y);
    for (let x = left; x <= right; x++) {
      const d = Math.min(x - left, right - x, y, rows - 1 - y);
      let c;
      if (d === 0) c = OUTLINE;
      else if (d <= 2) c = d === 2 ? BRONZE_MID : y < mid ? BRONZE_LIGHT : BRONZE_DARK;
      else if (d === 3) c = GROOVE;
      else c = y <= 5 ? hi : y >= rows - 6 ? lo : face;
      // Continue's shimmer: a slanted band of light crossing the face
      if (sweep !== null && d > 3) { const at = x - sweep + (rows - y) * 0.6; if (at >= 0 && at < 3) c = at < 1 ? '#fff8d8' : '#ffe8a0'; }
      g.fillStyle = c;
      g.fillRect(x, y, 1, 1);
    }
  }
  // a gloss streak across the upper face, broken like the reference's highlight
  g.fillStyle = hi;
  for (let x = Math.round(cols * 0.18); x < cols * 0.82; x++) if (x % 9 < 6) g.fillRect(x, 6, 1, 1);
  g.fillStyle = 'rgba(255, 255, 255, 0.85)';
  g.fillRect(9, 4, 5, 1); g.fillRect(16, 4, 2, 1);
  g.fillRect(cols - 15, rows - 5, 5, 1);
}

/** Continue's icon: the run's Poké Ball, wobbling, with your Pokémon waiting inside to be sent out. */
function runIcon(run) {
  const ball = el('span', 'cball');
  const shell = el('span', 'cball-ball');
  shell.append(el('span', 'cball-bottom'), el('span', 'cball-light'), el('span', 'cball-top'));
  const img = el('img', 'pixel');
  img.src = run.sprite;
  img.alt = '';
  ball.append(shell, img);
  return ball;
}

/** The Escape Rope beside the nameplate: a tap rings it red and swings it (a phone's hover) and asks in a bubble over
    it rather than a window, so the rope stays in sight; Yes abandons the run, No or a tap anywhere else puts it away. */
function initRope() {
  const rope = $('title-rope'), ask = $('rope-ask'), btn = $('title-abandon');
  const set = (open) => {
    rope.classList.toggle('armed', open);
    ask.hidden = !open;
    btn.setAttribute('aria-expanded', open);
  };
  closeRope = (sound) => {
    if (ask.hidden) return;
    if (sound) playSound('cancel');
    set(false);
  };
  btn.addEventListener('click', () => {
    if (!ask.hidden) return closeRope(true);
    playSound('stick');
    set(true);
    $('rope-no').focus({ preventScroll: true });
  });
  $('rope-no').addEventListener('click', () => closeRope(true));
  $('rope-yes').addEventListener('click', () => { set(false); actions.onAbandon(true); });
  document.addEventListener('pointerdown', (e) => { if (!rope.contains(e.target)) closeRope(true); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeRope(true); });
}
let closeRope = () => {};

/** A saved run's nameplate stands on the ledge (the user's call): its name, biome and HP, like battle's. */
function renderRun(run) {
  closeRope(false);
  $('title-run').hidden = !run;
  if (!run) return;
  $('title-run-name').textContent = run.name;
  const floor = $('title-run-floor');
  floor.textContent = `F${run.floor}`;
  floor.setAttribute('aria-label', `Floor ${run.floor}`);
  const sign = $('title-run-biome');
  sign.textContent = run.place;
  sign.dataset.biome = run.biome;
  sign.classList.remove('arrive');
  void sign.offsetWidth;
  sign.classList.add('arrive');
  setHpBar('title-run', run.hp, run.maxHp);
}

/** Continue: the ball's lid pops open in a flash, your Pokémon comes out with its cry, then the map. */
function sendOut(run) {
  const btn = document.querySelector('#title-menu .gem-continue');
  if (!btn || btn.classList.contains('opening')) return;
  btn.classList.add('opening');
  playSound('ball-open');
  setTimeout(() => { btn.classList.add('out'); playCry(run.cry); }, still() ? 0 : 250);
  setTimeout(() => {
    btn.classList.remove('opening', 'out');
    actions.onContinue(run.saved);
  }, still() ? 0 : 1100);
}

/** The pixel logo, a canvas a letter so each still bounces in and waves on its own; repainted when its pixel size changes. */
function paintLogo() {
  const px = logoPixel();
  if (paintLogo.px === px) return;
  paintLogo.px = px;
  $('title-logo').replaceChildren(...LOGO.map((ch, i) => {
    const letter = el('span', `tl${ch === 'o' ? ' tl-ball' : ''}`);
    letter.style.setProperty('--i', i);
    if (i < LOGO.length - 1) letter.style.marginRight = `${-EDGE * px}px`;
    letter.append(paintGlyph(ch, px));
    return letter;
  }));
}

/** New game: the Egg shakes harder and harder, cracks, and bursts open in a flash before the character select. */
function hatch() {
  const btn = document.querySelector('#title-menu .gem-new');
  if (!btn || btn.classList.contains('hatching')) return;
  if (still()) return actions.onNewGame();
  btn.classList.add('hatching');
  playSound('stat-up');
  setTimeout(() => { btn.classList.add('cracked'); playSound('ball-open'); }, 650);
  setTimeout(() => btn.classList.add('hatched'), 850);
  setTimeout(() => {
    btn.classList.remove('hatching', 'cracked', 'hatched');
    actions.onNewGame();
  }, 1250);
}

/** The Sound button under the PC opens the Poké Ball menu's Sound toggle and slider (js/audio.js runs both). */
/**
 * The Refresh button (the user's ask): a plain reload can keep showing the old game for up to 10 minutes after a push,
 * since the browser keeps its files (GitHub Pages caches them that long), so every file this page loaded is fetched
 * again past the cache first, and then the page reloads onto them. The save is in localStorage, untouched.
 */
async function refreshGame() {
  const btn = $('title-refresh');
  if (btn.classList.contains('spinning')) return;
  btn.classList.add('spinning');
  const files = performance.getEntriesByType('resource').map(r => r.name)
    .filter(url => url.startsWith(location.origin) && /\.(js|css)(\?|$)/.test(url));   // the code and styles: art and sound rarely change
  await Promise.all([location.href, ...files].map(url => fetch(url, { cache: 'reload' }).catch(() => null)));
  location.reload();
}

/* ---------- the sky ---------- */

function paint() {
  const screen = $('title-screen'), canvas = $('title-sky');
  const ground = Math.round(Math.min(150, Math.max(96, innerHeight * 0.17)));
  screen.style.setProperty('--ground', `${ground}px`);
  W = Math.ceil(innerWidth / PIXEL);
  H = Math.ceil(innerHeight / PIXEL);
  canvas.width = W;
  canvas.height = H;
  look = SKIES[timeOfDay()];
  base = paintScenery(W, H, Math.round(ground / PIXEL));
  stars = look.stars ? makeStars(W, H - Math.round(ground / PIXEL) - 56, moonOf(W, H)) : [];
  sizeGate();
  draw();
}

/* ---------- the broken Sealed Gate on the ledge ---------- */

/* Only once it's broken and Mewtwo is free: before that the gate is only ever seen at a run's end (the user's call,
   2026-10-02). Then it stands open on the ledge, and a tap is a shortcut to Mewtwo's Prepare step. */
let gateArt = null, entering = false;
const gateOpen = () => gateHp() <= 0 && isStarterUnlocked(STARTERS_BY_ID.mewtwo);

/** It stands in the right-hand gutter, clear of the gems and a saved run's nameplate: small on phones. */
function sizeGate() {
  const btn = $('title-gate'), canvas = $('title-gate-art');
  btn.hidden = !gateOpen();
  if (btn.hidden) return;
  const phone = innerWidth < 600;
  const [w, h, px] = phone ? [36, 44, 2] : innerHeight <= 700 ? [46, 56, 3] : [56, 68, 3];
  if (!gateArt || gateArt.W !== w) gateArt = Object.assign(makeGate(w, h), { W: w });
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w * px}px`;
  canvas.style.height = `${h * px}px`;
  const gutter = (innerWidth - Math.min(300, innerWidth * 0.8)) / 2;
  btn.style.right = `${phone ? 4 : Math.max(16, Math.round((gutter - w * px) / 2))}px`;
  paintGate();
}

function paintGate(flash = 0) {
  if (!gateArt || $('title-gate').hidden) return;
  gateArt.paint($('title-gate-art').getContext('2d'), { hp: 0, open: true, t: frame / FPS, flash });
}

/** A tap: the violet light swells out of the arch and Mewtwo cries, then its Prepare step (actions.onGate). */
function enterGate() {
  if (!pressed || entering) return;   // before PRESS START a tap anywhere just starts
  const mewtwo = STARTERS_BY_ID.mewtwo;
  playCry(mewtwo.line[0].id);
  if (still()) return actions.onGate(mewtwo);
  entering = true;
  const screen = $('title-screen'), btn = $('title-gate'), box = btn.getBoundingClientRect();
  screen.style.setProperty('--gate-x', `${box.left + box.width / 2}px`);
  screen.style.setProperty('--gate-y', `${box.top + box.height * 0.6}px`);
  screen.classList.add('gate-opening');
  playSound('gate-hum');
  const t0 = performance.now();
  const swell = () => {
    const k = Math.min(1, (performance.now() - t0) / 1100);
    paintGate(k * 0.8);
    if (k < 1) requestAnimationFrame(swell);
  };
  requestAnimationFrame(swell);
  setTimeout(() => {
    actions.onGate(mewtwo);
    setTimeout(() => { screen.classList.remove('gate-opening'); entering = false; }, 400);
  }, 1100);
}

function draw() {
  const ctx = $('title-sky').getContext('2d');
  ctx.drawImage(base, 0, 0);
  for (const s of stars) {
    const glow = still() ? 1 : 0.5 + 0.5 * Math.sin(frame * s.speed + s.phase);
    if (glow < 0.25) continue;
    ctx.fillStyle = glow > 0.7 ? '#ffffff' : '#9aa4e8';
    ctx.fillRect(s.x, s.y, 1, 1);
    if (s.big && glow > 0.8) {
      ctx.fillStyle = '#9aa4e8';
      ctx.fillRect(s.x - 1, s.y, 1, 1); ctx.fillRect(s.x + 1, s.y, 1, 1);
      ctx.fillRect(s.x, s.y - 1, 1, 1); ctx.fillRect(s.x, s.y + 1, 1, 1);
    }
  }
  if (shooting) {
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i === 0 ? '#ffffff' : i < 3 ? '#fff2b0' : '#8a86c8';
      ctx.fillRect(Math.round(shooting.x - i * 2), Math.round(shooting.y - i), 2, 1);
    }
  }
}

let shine = null;   // where Continue's shimmer is on its face (gem pixels), null between sweeps

function tick() {
  frame++;
  const cont = document.querySelector('#title-menu .gem-continue');
  if (cont) {
    const face = cont.querySelector('.gem-face');
    if (shine === null && frame % 30 === 0) shine = -12;
    else if (shine !== null) shine = shine + 3 > face.width + 4 ? null : shine + 3;
    paintGem(face, face.width, face.height, GEMS.continue, shine);
  }
  if (!shooting && look.stars && Math.random() < 0.012) shooting = { x: W * (0.2 + Math.random() * 0.7), y: H * 0.05 + Math.random() * H * 0.2, life: 14 };
  if (shooting) {
    shooting.x -= 4; shooting.y += 2;
    if (--shooting.life <= 0) shooting = null;
  }
  draw();
  if (!entering) paintGate();
}

/** The sky, moon and hills: everything that doesn't move, painted once per resize. */
function paintScenery(W, H, groundH) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rand = seeded(1999);
  const groundY = H - groundH;

  // sky bands, ordered-dithered into each other like a GBC gradient
  const img = g.createImageData(W, H);
  const rgb = look.sky.map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
  for (let y = 0; y < H; y++) {
    const t = Math.min(0.999, Math.max(0, (y / groundY) ** 1.6)) * (rgb.length - 1);
    const band = Math.floor(t), mix = t - band;
    for (let x = 0; x < W; x++) {
      const pick = mix * 16 > BAYER[(y % 4) * 4 + (x % 4)] ? band + 1 : band;
      const [r, gg, b] = rgb[Math.min(pick, rgb.length - 1)];
      const i = (y * W + x) * 4;
      img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  // the moon, with a dithered halo and a shaded side (the sun by day: a rim, not a shaded side, and no craters)
  const { x: mx, y: my, r } = moonOf(W, H), [lit, shade, halo] = look.orb;
  for (let y = -r - 5; y <= r + 5; y++) {
    for (let x = -r - 5; x <= r + 5; x++) {
      const d = Math.hypot(x, y);
      if (d <= r) {
        g.fillStyle = (look.moon ? x + y > r * 0.9 : d > r - 1.5) ? shade : lit;
        g.fillRect(mx + x, my + y, 1, 1);
      } else if (d <= r + 5 && (x + y) % 2 === 0 && d <= r + 2 + rand() * 3) {
        g.fillStyle = halo;
        g.fillRect(mx + x, my + y, 1, 1);
      }
    }
  }
  g.fillStyle = shade;
  if (look.moon) for (const [cx, cy, cr] of [[-0.35, -0.2, 0.18], [0.2, 0.3, 0.13], [0.1, -0.45, 0.1]]) {
    const R = Math.max(1, Math.round(cr * r));
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      if (x * x + y * y <= R * R) g.fillRect(mx + Math.round(cx * r) + x, my + Math.round(cy * r) + y, 1, 1);
    }
  }

  // two rows of hills, then the ledge the starters stand on
  const GRASS = look.grass;
  ridge(g, W, groundY, look.farHills, 52, 1.1, rand);
  ridge(g, W, groundY, look.nearHills, 26, 1.5, rand);
  g.fillStyle = GRASS[0];
  g.fillRect(0, groundY, W, groundH);
  g.fillStyle = GRASS[1];
  g.fillRect(0, groundY, W, 3);
  g.fillStyle = GRASS[2];
  g.fillRect(0, groundY, W, 1);
  for (let x = 0; x < W; x += 3 + Math.floor(rand() * 5)) {
    const h = 1 + Math.floor(rand() * 3);
    g.fillStyle = GRASS[2];
    g.fillRect(x, groundY - h, 1, h);
    g.fillStyle = GRASS[3];
    g.fillRect(x, groundY - h, 1, 1);
  }
  for (let i = 0; i < W * groundH / 40; i++) {
    g.fillStyle = rand() < 0.5 ? GRASS[1] : '#10281a';
    g.fillRect(Math.floor(rand() * W), groundY + 4 + Math.floor(rand() * groundH), 2, 1);
  }
  return c;
}

/** A jagged skyline that random-walks across the width, filled down to the ground. */
function ridge(g, W, groundY, color, height, steep, rand) {
  g.fillStyle = color;
  let h = height * (0.4 + rand() * 0.6), dir = 1;
  for (let x = 0; x < W; x++) {
    if (rand() < 0.08) dir = -dir;
    h = Math.max(height * 0.25, Math.min(height, h + dir * steep * rand()));
    const top = Math.round(groundY - h);
    g.fillRect(x, top, 1, groundY - top);
  }
}

// up in the corner, clear of the logo and the menu under it
function moonOf(W, H) {
  const r = Math.max(8, Math.round(Math.min(W, H) * 0.05));
  return { x: Math.round(W * 0.86), y: Math.round(Math.max(r + 6, Math.min(H * 0.07, 26))), r };
}

function makeStars(W, maxY, moon) {
  const rand = seeded(42);
  return Array.from({ length: Math.round(W * maxY / 180) }, () => ({
    x: Math.floor(rand() * W),
    y: Math.floor(rand() * maxY),
    big: rand() < 0.08,
    speed: 0.15 + rand() * 0.35,
    phase: rand() * Math.PI * 2,
  })).filter(s => Math.hypot(s.x - moon.x, s.y - moon.y) > moon.r + 7);
}

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
