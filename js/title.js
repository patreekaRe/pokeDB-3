/* ============================================================
   title.js  -  the title screen, which is also the game's home.

   Once per page load it opens on PRESS START (a Gold/Silver homage: a
   pixel sky lit for the player's time of day (dusk: a moon), the flying legendaries crossing it in turn,
   over an empty grassy ledge). After that it's the main
   menu: a stack of pixel gems under the logo (Continue, New game,
   Game Modes, Pokédex, after the user's references: Slay the Spire 2's
   short centred list and glossy hexagon buttons). "Main menu" anywhere
   comes back here, straight to the gems.

   The sky is painted into a small canvas (one canvas pixel = PIXEL CSS
   pixels, upscaled with image-rendering: pixelated) so it stays blocky
   on any screen, and so are the gems (gemPx() CSS pixels a pixel). It only
   animates while the title is up.
   ============================================================ */

import { $, el, setHpBar, infGlyph } from './ui.js';
import { LOGO, EDGE, logoPixel, paintGlyph } from './logo.js';
import { playSound, playCry, playMusic, closeSoundPops } from './audio.js';
import { timeOfDay } from './daytime.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { safariDaily, SAFARI_DEX_PAGES, safariProgress } from './data/safari.js';
import { safariAccess, DAY_PASS } from './data/balls.js';
import { getSave, updateSave } from './storage.js';
import { safariOpen, safariUnlockProgress } from './data/pokedex.js';
import { towerOpen } from './data/tower.js';
import { tipAt } from './tips.js';
import { isStarterUnlocked } from './progress.js';
import { makeGate, gateHp, gateReady } from './gate.js';
import { spriteFit } from './data/sprite-fit.js';
import { showBadgeNews } from './trainercard.js';
import { smoothIcon } from './smooth-icons.js';
import { paintTitleLight, runTitleLight } from './title-light.js';

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
const GEM_H = 16;   // a sign's height in --gp steps; each one's look is CSS (.gem in css/menus.css)
const BACK_W = 34, BACK_H = 13;   // Back's size in --gp steps: a Poké Ball BACK_H across with "BACK" beside it, left-aligned
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let actions = null;       // what the gems do, and the saved run for Continue (initTitle)
let pressed = false;      // PRESS START happens once per page load
let base = null, stars = [], shooting = null, W = 0, H = 0, timer = 0, frame = 0, look = SKIES.dusk;

/** Called once at startup with what the menu's gems do: { savedRun(), onContinue(run), onNewGame(), onCollection(), ... }. */
/* The legendaries that fly (or float) cross the sky one at a time, like Ho-Oh in the Gold intro: a black silhouette until
   you've unlocked that one, then in its own colours (shiny if you've switched its shiny on). Each pass deals the next from
   a shuffled round, so they all come by before any comes back. Never Mewtwo: it has no flying sprite, and it's the secret
   (the user's call, 2026-10-02). */
export const FLYERS = ['moltres', 'hooh', 'lugia', 'reshiram', 'celebi', 'victini', 'rayquaza'];
let flight = [], lastFlyer = null;
/* Once Eternatus is beaten (its feat, v1.0 part D) it joins the round: its showdown GIF, always in colour. ?bossfight=depths
   lends it for that page load (eternatusGuest()), so a playtest shows it too. */
const ETERNATUS = 'eternatus';
let guest = false;
export const eternatusGuest = () => { guest = true; flight = [ETERNATUS]; };   // the next pass is its

function nextFlyer(img) {
  if (!flight.length) {
    const round = guest || getSave().feats.includes(ETERNATUS) ? [...FLYERS, ETERNATUS] : FLYERS;
    flight = round.map(id => [Math.random(), id]).sort((a, b) => a[0] - b[0]).map(([, id]) => id);
    if (flight[0] === lastFlyer) flight.push(flight.shift());
  }
  const id = lastFlyer = flight.shift();
  if (id === ETERNATUS) {
    img.onload = () => img.style.setProperty('--w', img.naturalWidth);
    img.src = `assets/pokemon/${ETERNATUS}-front.gif`;
    img.classList.add('lit');
    return;
  }
  const starter = STARTERS_BY_ID[id], lit = isStarterUnlocked(starter);
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
  $('press-start-text').textContent = 'Power on';   // read out only: the shut Pokédex says it on its own (the user's call)
  screen.addEventListener('click', (e) => {
    if (!pressed && !e.target.closest('.gem')) return start(e);
    // a sub-menu goes back on a tap on the empty sky, like every window closes on a tap outside it
    if (pressed && page !== 'main' && !e.target.closest('button, a, input, .nameplate, .title-areas, .title-corner')) goBack();
  });
  $('title-refresh').addEventListener('click', refreshGame);
  // the corner's icons are smooth vector art like the signs (the user's call); the speaker is audio.js's
  $('title-account').querySelector('.ta-pc').replaceChildren(smoothIcon('pc'));
  const tags = screen.querySelectorAll('.title-sound .vol-tag');
  tags[0].replaceChildren(smoothIcon('music'));
  tags[1].replaceChildren(smoothIcon('bell'));
  $('title-abandon').replaceChildren(smoothIcon('run'));
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
    if ((e.key === 'Escape' || e.key === 'Backspace') && page !== 'main' && areasPop.hidden) { e.preventDefault(); goBack(); }
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
    runTitleLight(false);
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
  runTitleLight(true);
}

/* The first tap powers on the shut Pokédex (the user's pick, 2026-10-08): the button goes in, the LED turns green, the
   cover swings open and the screen flickers on with the logo and a hello. Then it lifts away as the sky lights up onto
   the menu. On the very first launch it dives into the screen instead, where How to play is already on (the Collection
   device, booted without its cover: the one boot), and the sky lights up once that's shut. */
const wait = (ms) => new Promise(done => setTimeout(done, ms));

async function start(e) {
  if (e.type === 'keydown' && (e.repeat || ['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key))) return;
  e.preventDefault();
  pressed = true;
  // the power-on's dex-on is the tap's answer; with motion off there's no power-on, so the blip stands in (the user heard silence)
  if (still()) playSound('confirm');
  const first = actions.firstLaunch?.() ?? false;
  const dex = $('title-dex');
  if (!still()) await powerOn(dex);
  if (first) {
    if (!still()) await dive(dex);
    const howto = actions.onFirstBoot();
    dex.classList.add('gone');
    await howto;
  } else if (!still()) lift(dex);
  reveal();
}

async function powerOn(dex) {
  $('title-screen').classList.add('powering');
  $('tdx-hello').textContent = actions.hello?.() ?? '';
  dex.classList.add('on');
  await wait(240);
  playSound('dex-on');
  dex.classList.add('open');
  await wait(1700);
}

/** Into the screen: it grows until its glow fills the view, where the real device takes over. */
async function dive(dex) {
  const box = dex.getBoundingClientRect(), glass = dex.querySelector('.tdx-screen').getBoundingClientRect();
  dex.style.transformOrigin = `${glass.left + glass.width / 2 - box.left}px ${glass.top + glass.height / 2 - box.top}px`;
  dex.style.setProperty('--dive', Math.ceil(2.4 * Math.max(innerWidth / glass.width, innerHeight / glass.height)));
  dex.classList.add('dive');
  await wait(560);
}

/** Out of the way: it rises and fades in the light, pinned where it stood while the menu takes its place. */
function lift(dex) {
  const box = dex.getBoundingClientRect();
  Object.assign(dex.style, { position: 'fixed', left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, margin: 0 });
  dex.classList.add('away');
  setTimeout(() => dex.classList.add('gone'), 700);
}

function reveal() {
  const screen = $('title-screen');
  screen.classList.remove('powering');
  screen.classList.add('menu');
  if (!$('title-dex').classList.contains('away')) $('title-dex').classList.add('gone');
  renderMenu();
  showTitle.done?.();
  showTitle.done = null;
}

/* ---------- the gem menu ---------- */

/* The main stack is four signs (the user's call, 2026-10-05: two flipped slots with pips under them looked busy):
   Continue, New game, and two that slide the stack sideways to a sub-menu of the same signs with a Back sign, the games'
   way, while the sky, logo and nameplate stay put. Game modes live in theirs, so a new mode never lengthens the title. */
let page = 'main';      // 'main' or 'modes'
let swapping = 0;

function renderMenu(dir = 0, from = null) {
  if (!dir) page = 'main';
  const run = actions.savedRun();
  const gems = {
    main: () => [
      run && gem('continue', 'Continue', () => sendOut(run), runIcon(run)),
      helpRow(gem('new', 'New game', hatch, smoothIcon('egg', 'gem-egg'))),   // an Egg, a new adventure hatching: Continue has the Poké Ball
      modesGem(),
      gem('dex', 'Pokédex', actions.onCollection, smoothIcon('dex')),   // one sign: the device's own home has the Trainer Card and Game Corner
    ],
    modes: () => [safariGem(), pillarGem(), backGem()],
  }[page]().filter(Boolean);
  if (page !== 'modes') plantSign(null);   // the signpost is the Safari's
  gems.forEach((g, i) => g.style.setProperty('--i', i));   // inherited, so the Safari gem's row passes it on
  const menu = $('title-menu');
  menu.dataset.slide = dir > 0 ? 'in-r' : dir < 0 ? 'in-l' : '';
  // iPhone Safari left a sign stuck a step short of its place after sliding in, so the animation is dropped once it's done
  clearTimeout(renderMenu.settle);
  if (dir && !still()) renderMenu.settle = setTimeout(() => { menu.dataset.slide = 'done'; }, 700);
  menu.replaceChildren(...gems);
  showBadgeNews();
  sizeGems();
  point((from && menu.querySelector(`.gem-${from}`)) || menu.querySelector('.gem'), true);
}

function gem(kind, label, onPick, icon, extra) {
  const btn = el('button', `gem gem-${kind}`);
  btn.type = 'button';
  btn.dataset.kind = kind;
  const name = el('span', 'gem-label');
  name.append(el('span', 'gem-name', label));
  if (extra) name.append(extra);
  btn.append(el('span', 'gem-icon'), name);
  btn.querySelector('.gem-icon').append(icon);
  btn.addEventListener('pointerenter', () => point(btn, true));
  btn.addEventListener('focus', () => point(btn, true));
  btn.addEventListener('click', () => { if (!btn.disabled) onPick(); });
  return btn;
}

function goTo(next) {
  if (swapping) return;
  playSound('confirm');
  slide(1, next);
}
function goBack() {
  if (swapping) return;
  playSound('cancel');
  slide(-1, 'main', page);
}
/** The stack slides out one way and the next comes in from the other side; back on the main stack the ▶ is on the sign
    you came from. */
function slide(dir, next, from = null) {
  page = next;
  if (still()) return renderMenu(dir, from);
  closeAreas();
  // the old signs leave in a layer of their own while the new ones come in, both at once: one push, with no empty beat
  // between them (the out-then-in version read as choppy)
  const menu = $('title-menu');
  const ghost = el('div', 'title-menu-ghost');
  ghost.dataset.slide = dir > 0 ? 'out-l' : 'out-r';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.append(...menu.children);
  renderMenu(dir, from);
  menu.append(ghost);
  swapping = setTimeout(() => { swapping = 0; ghost.remove(); }, 420);
}

/** How to play hangs off New game's right end as an emote bubble (the user's call, 2026-10-08: whoever needs it is about to
    start a game). It hops until it's first tapped (`helpTapped`; the first launch's own How to play doesn't count). */
function helpRow(btn) {
  const row = el('div', 'gem-row');
  const help = el('button', 'gem-side gem-help');
  help.type = 'button';
  help.id = 'title-help';
  help.title = 'How to play';
  help.setAttribute('aria-label', 'How to play');
  help.classList.toggle('calm', !!getSave().helpTapped);
  help.append(smoothIcon('help', 'gem-side-icon'));
  help.addEventListener('click', () => {
    playSound('confirm');
    if (!getSave().helpTapped) updateSave(d => { d.helpTapped = true; });
    help.classList.add('calm');
    actions.onHelp();
  });
  row.append(btn, help);
  return row;
}

/** A sign that opens a sub-menu: a ▶ on its right end says so. */
function more(btn) {
  btn.classList.add('gem-more');
  btn.append(el('span', 'gem-arrow'));   // a smooth triangle in CSS
  return btn;
}
const backGem = () => {
  const btn = gem('back', 'Back', goBack, '');   // a plain ball, wobbling (the user's call, 2026-10-08: no ◀)
  btn.setAttribute('aria-label', 'Back');
  return btn;
};

/** Game Modes: greyed out until one of its modes is open (the Sky Pillar, after a won run); a tap then says so. */
function modesGem() {
  const save = getSave(), open = safariOpen(save) || towerOpen(save);
  const btn = more(gem('modes', 'Game Modes', () => {
    if (open) return goTo('modes');
    playSound('cancel');
    tipAt(btn, 'Win a run to open the game modes, starting with the Sky Pillar: a 100-floor tower climb with a weekly leaderboard.');
  }, smoothIcon('map'), open ? null : el('span', 'gem-soon', 'Win a run')));
  btn.classList.toggle('locked', !open);
  return btn;
}

/** The Sky Pillar, the 100-floor tower climb (js/data/tower.js): open once you've won a run (greyed out till then, a tap says
    so); its face shows your best floor. */
function pillarGem() {
  const open = towerOpen(getSave());
  const best = getSave().tower?.bestEver || 0;
  const btn = gem('pillar', 'Sky Pillar', () => {
    if (open) return actions.onTower();
    playSound('cancel');
    tipAt(btn, 'Win a run to open the Sky Pillar, a 100-floor tower climb with a weekly leaderboard.');
  }, smoothIcon('tower'), open ? (best ? el('span', 'gem-soon', `Best F${best}`) : null) : el('span', 'gem-soon', 'Win a run'));
  btn.classList.toggle('locked', !open);
  return btn;
}

/** The Safari Zone, the daily run: today's starter on its face (its areas on the signpost beside it). Locked (the whole gem
    greyed out, a Safari Ball on it) until every Pokédex entry has been beaten; a tap then says so. */
function safariGem() {
  const open = safariOpen(getSave());
  const daily = safariDaily();
  plantSign(open && daily);
  const line = daily.areas.map(a => a.name).join(' · ');
  let icon = smoothIcon('safari', 'gem-ball');
  if (open) {
    icon = el('img', 'pixel gem-mon');
    icon.alt = '';
    icon.addEventListener('load', () => fitMon(icon), { once: true });
    icon.src = spriteUrl(daily.starter, 'front', 0);
  }
  const btn = gem('safari', 'Safari Zone', () => {
    if (open) return actions.onSafari();
    playSound('cancel');
    tipAt(btn, `The Safari Zone opens once you've beaten every Pokémon in all three biomes. ${safariUnlockProgress(getSave())}`);
  }, icon);   // today's areas are on the signpost in the grass (the user's call); locked, a tap says why
  btn.classList.toggle('locked', !open);
  const full = open && getSave().safariDex.complete;   // every Safari Pokémon caught: a gold ✦ on the gem
  if (full) btn.append(el('span', 'gem-badge', '✦'));
  // today's try still to play (1/1), or played and only replays left (∞)
  const access = safariAccess(getSave().safari, daily.day), played = access !== 'first';
  const tries = access === 'pass' ? infGlyph() : el('span', 'try-count', played ? '0/1' : '1/1');
  tries.classList.add('gem-tries');
  if (open) btn.append(tries);
  btn.title = (full ? 'Safari Pokédex complete! ' : '') + (open ? `Today's run, the same for everyone: ${daily.starter.line[0].name} through the ${line}. Only the first try counts${played ? `: you've played it, so it's replays from here${access === 'pass' ? '' : ` (a Day Pass, ${DAY_PASS} coins)`}` : ''}.` : 'Beat every Pokémon in all three biomes to open the Safari Zone.');
  if (!open) return btn;
  // the day's leaderboard, a trophy hung off the gem's right edge so the gem stays centred in the stack
  const row = el('div', 'gem-row');
  const board = el('button', 'gem-side gem-board');
  board.append(smoothIcon('trophy', 'gem-side-icon'));
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
  const k = 0.6 / Math.max(w, h);   // the slot is the whole round button, so fill its glow, not the ring
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

/** Each sign is sized in whole --gp steps, so they all line up at any screen width. */
function sizeGems() {
  const px = gemPx();
  const cols = Math.floor(Math.min(300, innerWidth * 0.8) / px);
  for (const btn of document.querySelectorAll('#title-menu .gem')) {
    const back = btn.dataset.kind === 'back';
    const w = back ? BACK_W : cols;
    btn.style.width = `${w * px}px`;
    btn.style.height = `${(back ? BACK_H : GEM_H) * px}px`;
    // the stack is centred, so a right margin of the difference lines Back's ball up with the signs' balls above
    if (back) btn.style.marginRight = `${(cols - w) * px}px`;
    if (back) btn.style.setProperty('--ball', `${BACK_H * px}px`);
    // and its centre under theirs: a sign's ball is as tall as the sign, GEM_H steps
    if (back) btn.style.setProperty('--ball-x', `${(GEM_H - BACK_H) * px / 2}px`);
  }
  // every page keeps the tallest page's height (four signs), so the nameplate never rises on a shorter sub-menu (the
  // user's ask)
  const menu = $('title-menu');
  const gap = parseFloat(getComputedStyle(menu).rowGap) || 0;
  menu.style.minHeight = `${4 * GEM_H * px + 3 * gap}px`;
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

/** The Run key on the plate's LCD: a tap lights it up (a phone's hover) and asks in a bubble over it rather than a
    window, so the key stays in sight; Yes abandons the run, No or a tap anywhere else puts it away. */
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
  sign.toggleAttribute('data-safari', run.safari);   // the Safari Zone's green signboard, as on its map
  sign.title = run.spot ? `${run.place}: ${run.spot}` : run.place;
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
  // "Poké" small over "Deckbound", like the games' logos; the letters still bounce in one by one across both lines
  let i = 0;
  $('title-logo').replaceChildren(...LOGO.map((word, line) => {
    const size = line ? px : Math.max(2, Math.round(px * 0.6));
    const row = el('span', `tl-row${line ? '' : ' tl-small'}`);
    row.append(...word.map((ch, j) => {
      const letter = el('span', `tl${ch === 'o' ? ' tl-ball' : ''}`);
      letter.style.setProperty('--i', i++);
      if (j < word.length - 1) letter.style.marginRight = `${-EDGE * size}px`;
      letter.append(paintGlyph(ch, size));
      return letter;
    }));
    return row;
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

/** The Sound button under the PC opens the same Sound toggle and slider as the Pokédex's Settings (js/audio.js runs both). */
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
  const orb = moonOf(W, H);
  paintTitleLight($('title-light'), { time: timeOfDay(), orb: { x: orb.x * PIXEL, y: orb.y * PIXEL, r: orb.r * PIXEL }, ground, hills: 40 * PIXEL });
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

function tick() {
  frame++;
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
