/* ============================================================
   safariprep.js  -  the Safari Zone's lobby, between the title's
   Safari Zone gem and the run (docs/reference/safari.md): today's run,
   how the Safari works, your Poké Balls, and the doors to the Safari
   Pokédex, the leaderboard and the Game Corner, then Start.
   The Pokédex device, like the Sky Pillar's lobby (the user's call,
   2026-10-07): a window onto the Zone's gate (js/safari-lobby.js paints
   it), an LCD with the day's run, then the hardware's keys. Its Pokédex,
   Ranks and Buy keys are the device's apps (the user's call, 2026-10-07):
   the window folds away and the app slides over the LCD, as the
   Collection's do; B (or the key again) slides it back.
   ============================================================ */

import { safariDaily, SAFARI_DEX_PAGES, SAFARI_AREA_COINS, RARE_BOOST, safariProgress } from './data/safari.js';
import { BALLS, THROW_PP, RARE, ballWeek, SAFARI_BALLS, DAY_PASS, safariAccess } from './data/balls.js';
import { CARDS_BY_ID } from './data/cards.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave } from './storage.js';
import { safariDexApp } from './safaridex.js';
import { boardApp, safariTop } from './leaderboard.js';
import { cloudConfigured } from './cloud.js';
import { startGate, stopGate } from './safari-lobby.js';
import { cornerApp, aimCorner } from './shop.js';
import { playSound } from './audio.js';
import { bootDevice } from './device-boot.js';
import { smoothIcon } from './smooth-icons.js';
import { $, el, openDialog, closeDialog, itemSprite, makeCard, zoomable } from './ui.js';

let actions = {};

const ROCK_HIT = CARDS_BY_ID.rock.effects.damage;
const RULES = [
  ['🔄', 'One run a day, the same for everyone.'],
  ['⚾', `Every run starts with ${SAFARI_BALLS} Safari Balls, plus any ball packs you bought. Today's first try is free; a Day Pass (${DAY_PASS} coins) gives replays until the day ends.`],
  ['🔴', `Throw a ball at any wild Pokémon: ${THROW_PP} PP, and it ends your turn. At full HP it's a long shot; the lower its HP, the better.`],
  ['🎯', 'Debuffs on it raise the odds.'],
  ['🍙', 'Bait: better odds, but it hits harder. A card reward after fights, Safari runs only.', 'bait'],
  ['🧱', `Rock: ${ROCK_HIT} damage and Vulnerable, but it may run off. A card reward after fights, Safari runs only.`, 'rock'],
  ['✦', `A room marked with this star on the map holds a rare Pokémon. It runs off after ${RARE.turns} turns.`],
  ['🃏', 'Each Pokémon you catch offers its own signature card for your deck.'],
  ['💰', `Catch a whole area: ${SAFARI_AREA_COINS} coins, x${RARE_BOOST} rare spawns.`],
];

export function initSafariPrep(handlers) {
  actions = handlers;
  for (const node of document.querySelectorAll('#safari-prep-dialog [data-icon]')) node.append(smoothIcon(node.dataset.icon));
  $('sp-start').addEventListener('click', () => {
    if (app) { if (app.def.a) app.def.app.press(); return; }
    closeDialog('safari-prep-dialog');
    actions.onStart();
  });
  $('sp-close').addEventListener('click', back);
  for (const id of Object.keys(APPS)) $(id).addEventListener('click', () => (app?.key === id ? back() : openApp(id)));
  const dialog = $('safari-prep-dialog');
  dialog.addEventListener('cancel', (e) => { if (app) { e.preventDefault(); back(); } });   // Escape is B
  dialog.addEventListener('keydown', (e) => {
    if (!app || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || e.target.matches?.('input')) return;
    if (app.def.app.key(e)) e.preventDefault();
  });
  dialog.addEventListener('close', () => closeApp(true));
  // the balls are a sideways strip: a mouse wheel scrolls it too, and its edges fade while there's more that way
  const balls = $('sp-balls');
  balls.addEventListener('scroll', () => ballEdges(balls), { passive: true });
  balls.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || balls.scrollWidth <= balls.clientWidth) return;
    e.preventDefault();
    balls.scrollLeft += e.deltaY;
  }, { passive: false });
  $('sp-how').querySelector('summary').addEventListener('click', () => playSound('confirm'));
  $('safari-prep-dialog').addEventListener('close', stopGate);
  const relayout = new ResizeObserver(() => { if ($('safari-prep-dialog').open) paintGate(); });
  relayout.observe($('sp-top'));
}

/* ---------- the keys' apps ---------- */

const APPS = {
  'sp-dex': { name: 'Safari Dex', cls: 'cdev-dex', app: safariDexApp },
  'sp-board': { name: 'Ranks', cls: 'cdev-dex sp-board-app', app: boardApp('safari') },
  'sp-corner': { name: 'Game Corner', cls: 'cdev-win cdev-corner', app: cornerApp, a: 'Buy', before: () => aimCorner('balls') },
};
const SLIDE = { duration: 260, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)' };
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let app = null;      // the open app: { key, def, panel }
let sliding = false;

function openApp(key) {
  if (sliding) return;
  if (app) closeApp(true);
  const def = APPS[key];
  playSound('confirm');
  def.before?.();
  const panel = el('div', `cdev-app sp-app ${def.cls}`);
  $('sp-glass').append(panel);
  def.app.mount(panel);
  panel.scrollTop = 0;
  app = { key, def, panel };
  dressKeys();
  if (calm()) return;
  sliding = true;
  $('sp-base').animate([{ translate: '0 0', opacity: 1 }, { translate: '-30% 0', opacity: 0 }], SLIDE);
  panel.animate([{ translate: '100% 0' }, { translate: '0 0' }], SLIDE).finished.catch(() => {}).then(() => { sliding = false; });
}

function closeApp(now = false) {
  if (!app) return;
  const { def, panel } = app;
  app = null;
  dressKeys();
  const done = () => { def.app.unmount(); panel.remove(); };
  if (!$('safari-prep-dialog').open) { done(); return; }
  if (now || calm()) { done(); return; }
  sliding = true;
  $('sp-base').animate([{ translate: '-30% 0', opacity: 0 }, { translate: '0 0', opacity: 1 }], SLIDE);
  panel.animate([{ translate: '0 0' }, { translate: '100% 0' }], { ...SLIDE, fill: 'forwards' }).finished.catch(() => {}).then(() => { done(); sliding = false; });
}

/** B: the app steps back itself first (a Safari Dex page to its banners), then home to the lobby; there it shuts. */
function back() {
  if (sliding) return;
  if (app) {
    if (app.def.app.back()) return;
    playSound('cancel');
    closeApp();
    return;
  }
  playSound('cancel', 'confirm');
  closeDialog('safari-prep-dialog');
}

/** The window folds away under an app, the lit key is the open app's, the LCD names it and A is its own. */
function dressKeys() {
  const page = $('sp-page');
  page.classList.toggle('app-open', !!app);
  for (const id of Object.keys(APPS)) {
    $(id).classList.toggle('on', app?.key === id);
    $(id).setAttribute('aria-pressed', String(app?.key === id));
  }
  $('sp-title').textContent = app ? app.def.name : 'Safari Zone';
  $('sp-date').hidden = !!app;
  $('sp-base').inert = !!app;
  if (app) {
    $('sp-start-label').textContent = app.def.a ?? '';
    $('sp-start').disabled = !app.def.a;
  } else {
    $('sp-start').disabled = false;
    render();   // a buy may have moved the balls
  }
}

/** The gate in the window: a strip of meadow under the starter, the sky from the window's top. */
function paintGate() {
  const win = $('sp-top'), H = win.clientHeight;
  const g = startGate($('sp-sky'), win, H - Math.round(Math.max(8, H * 0.04)));
  win.style.setProperty('--ground', `${g}px`);
}

export function openSafariPrep() {
  closeApp(true);
  render();
  $('sp-how').open = false;
  openDialog('safari-prep-dialog');
  $('sp-base').scrollTop = 0;
  const win = $('sp-top');
  win.classList.remove('power-on');
  engrave();
  paintGate();
  bootDevice($('sp-page'), { below: $('sp-page').querySelector('.tdev-lid'), screen: win, onScreen: () => { void win.offsetWidth; win.classList.add('power-on'); } });
}

const PLAQUE_ROWS = 5;
let engraved = false;

/** Today's top catchers, the Sky Pillar lobby's list (engrave() in js/towerprep.js); it's the last thing on the
    screen, so unlike the tower's it keeps no room before the board answers. */
async function engrave() {
  const slot = $('sp-plaque-slot'), plaque = $('sp-plaque'), list = $('sp-plaque-list');
  slot.hidden = !cloudConfigured();
  if (slot.hidden) return;
  if (!engraved) plaque.classList.remove('in');
  const top = await safariTop(PLAQUE_ROWS);
  if (!top) { plaque.classList.remove('in'); engraved = false; return; }
  engraved = true;
  plaque.classList.add('in');
  if (!top.length) { list.replaceChildren(el('li', 'tower-plaque-note', 'No catches yet today. Be the first!')); return; }
  list.replaceChildren(...top.map(plaqueRow));
}

function plaqueRow(e, i) {
  const li = el('li', `tower-plaque-row${e.mine ? ' mine' : ''}`);
  li.dataset.rank = i + 1;
  const img = el('img', 'pixel');
  const starter = STARTERS_BY_ID[e.starter];
  if (starter) { img.src = spriteUrl(starter, 'front', 0); img.alt = ''; }
  li.append(el('span', 'tower-plaque-rank', `${i + 1}`), img, el('span', 'tower-plaque-name', e.name), el('span', 'tower-plaque-floor', `${e.caught} caught`));
  li.title = `${e.name}: ${e.caught} caught${e.won ? ', crossed the Safari Zone' : ''}`;
  return li;
}

function render() {
  const save = getSave();
  const daily = safariDaily();
  const access = safariAccess(save.safari, daily.day), first = access === 'first';
  const name = daily.starter.line[0].name;

  const head = el('p', 'tower-name');
  head.append(el('strong', '', name), el('span', '', "Today's starter"));
  const areas = el('ol', 'sp-areas');
  daily.areas.forEach((area, i) => {
    const page = SAFARI_DEX_PAGES.find(p => p.area === area.id);
    const { caught } = safariProgress(page.ids, save.safariDex);
    const row = el('li', `sp-area${caught === page.ids.length ? ' done' : ''}`);
    row.append(el('span', 'sp-area-no', `${i + 1}`), el('b', '', area.name), el('small', '', `${caught}/${page.ids.length}`));
    row.title = `${area.name}: ${caught} of ${page.ids.length} caught`;
    areas.append(row);
  });
  const tries = el('p', `sp-try${first ? ' first' : ' replay'}`, first ? '🏆 Daily run: 1/1' : access === 'pass' ? 'Day Pass: replays today' : '🏆 Daily run: 0/1');
  $('sp-today').replaceChildren(head, areas, tries);
  $('sp-date').textContent = new Date(`${daily.day}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  const gateMon = $('sp-gate-mon');
  gateMon.src = spriteUrl(daily.starter, 'front', 0);
  gateMon.alt = name;
  $('sp-start-label').textContent = first ? 'Start' : access === 'pass' ? 'Replay' : `Pass ${DAY_PASS}`;
  $('sp-start').title = first ? "Start today's run" : access === 'pass' ? 'Replay today' : `Buy a Day Pass (${DAY_PASS} coins) to replay today`;

  // the full Safari Pokédex's prize stays unnamed until it's won
  const prize = save.unlocked.includes('rayquaza') ? `Catch them all: ${STARTERS_BY_ID.rayquaza.line[0].name} joins you.`
    : 'Complete the Safari Pokédex: a new Legendary awaits you.';
  $('sp-rules').replaceChildren(...[...RULES, ['👑', prize]].map(([icon, text, cardId]) => {
    const li = el('li', cardId ? 'with-card' : '');
    const mark = el('span', 'sp-rule-icon');
    mark.append(icon === '✦' ? el('span', 'map-rare inline', '✦') : icon);   // the map's own rare-spawn star, not a stand-in
    li.append(mark, el('span', '', text));
    if (cardId) {   // a Safari-only card: tap to read it big, with its keyword boxes
      const card = makeCard(CARDS_BY_ID[cardId]);
      card.classList.add('small', 'sp-card');
      zoomable(card, CARDS_BY_ID[cardId]);
      li.append(card);
    }
    return li;
  }));
  // the day's rules as pills, both rows always, no sentences (the user's asks, 2026-10-03): the try = what it gets, struck through when off
  const pill = (cls, text, tip) => Object.assign(el('span', `sp-pill ${cls}`, text), { title: tip });
  const row = (...pills) => { const r = el('span', 'sp-pill-row'); r.append(...pills); return r; };
  $('sp-replay').replaceChildren(row(pill('daily', 'Daily run', 'Your one try today'), el('span', 'sp-eq', '='), pill('board', 'Ranked', 'This try goes on the leaderboard'), pill('perks off', 'Perks', 'Perks are off for this try')),
    row(pill('replay', 'Replay', `After your daily run, a Day Pass (${DAY_PASS} coins) replays it as much as you like today`), el('span', 'sp-eq', '='), pill('board off', 'Ranked', "Replays don't go on the leaderboard"), pill('perks', 'Perks', 'Your perks are back')));

  const week = ballWeek();
  $('sp-balls').replaceChildren(...BALLS.map(ball => {
    const left = ball.free ? SAFARI_BALLS : ball.stock ? save.balls[ball.id] || 0
      : !save.balls.owned.includes(ball.id) ? 0 : save.balls.masterWeek === week ? 0 : 1;
    const slot = el('div', `sp-ball${left === 0 ? ' none' : ''}`);
    slot.append(itemSprite(ball, 'sp-ball-icon'), el('b', 'sp-ball-left', `×${left}`));
    slot.title = `${ball.name}: ${ball.text}`;
    slot.setAttribute('aria-label', `${ball.name}, ${left} in your bag`);
    return slot;
  }));
  requestAnimationFrame(() => ballEdges($('sp-balls')));
}

function ballEdges(strip) {
  strip.classList.toggle('more-l', strip.scrollLeft > 2);
  strip.classList.toggle('more-r', strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 2);
}
