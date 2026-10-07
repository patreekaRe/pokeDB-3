/* ============================================================
   safariprep.js  -  the Safari Zone's prep window, between the title's
   Safari Zone gem and the run (docs/reference/safari.md): today's run,
   how the Safari works, your Poké Balls, and the doors to the Safari
   Pokédex, the leaderboard and the Game Corner, then Start.
   Two looks (the user's ask, 2026-10-05, to compare): the lobby, a screen
   of its own like the Sky Pillar's (js/safari-lobby.js paints the gate
   behind it), or the classic window; ?safariclassic picks the classic one
   for good on this device, ?safarilobby the lobby again.
   ============================================================ */

import { safariDaily, SAFARI_DEX_PAGES, SAFARI_AREA_COINS, RARE_BOOST, safariProgress } from './data/safari.js';
import { BALLS, THROW_PP, RARE, ballWeek, SAFARI_BALLS, DAY_PASS, safariAccess } from './data/balls.js';
import { CARDS_BY_ID } from './data/cards.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave } from './storage.js';
import { openSafariDex } from './safaridex.js';
import { openLeaderboard, safariTop } from './leaderboard.js';
import { cloudConfigured } from './cloud.js';
import { startGate, stopGate } from './safari-lobby.js';
import { toggleShop } from './shop.js';
import { playSound } from './audio.js';
import { $, el, infGlyph, openDialog, closeDialog, itemSprite, makeCard, zoomable } from './ui.js';

let actions = {};

const CLASSIC_KEY = 'pokedb.safari.classic';
const classic = (() => {
  try {
    const q = new URLSearchParams(location.search);
    if (q.has('safariclassic')) localStorage.setItem(CLASSIC_KEY, '1');
    if (q.has('safarilobby')) localStorage.removeItem(CLASSIC_KEY);
    return localStorage.getItem(CLASSIC_KEY) === '1';
  } catch (err) { return false; }
})();

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
  $('sp-start').addEventListener('click', () => { closeDialog('safari-prep-dialog'); actions.onStart(); });
  $('sp-close').addEventListener('click', () => { playSound('cancel', 'confirm'); closeDialog('safari-prep-dialog'); });
  $('sp-dex').addEventListener('click', () => openSafariDex(safariDaily().areas[0].id));
  $('sp-board').addEventListener('click', () => openLeaderboard());
  // the Game Corner pops up over this window (modal, so it isn't hidden under it); its balls show here once it closes
  // the balls are a sideways strip: a mouse wheel scrolls it too, and its edges fade while there's more that way
  const balls = $('sp-balls');
  balls.addEventListener('scroll', () => ballEdges(balls), { passive: true });
  balls.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || balls.scrollWidth <= balls.clientWidth) return;
    e.preventDefault();
    balls.scrollLeft += e.deltaY;
  }, { passive: false });
  $('sp-corner').addEventListener('click', () => { if (!$('shop-dialog').open) toggleShop('balls', { modal: true }); });
  // a ball bought in the Game Corner, or anything changed in a window opened on top, shows once it closes
  for (const id of ['safari-dex-dialog', 'board-dialog', 'shop-dialog']) $(id).addEventListener('close', () => { if ($('safari-prep-dialog').open) render(); });
  // the classic window always shows the rules; the lobby folds them away
  $('sp-how').querySelector('summary').addEventListener('click', e => { if (classic) e.preventDefault(); else playSound('confirm'); });
  $('safari-prep-dialog').classList.toggle('lobby', !classic);
  $('safari-prep-dialog').classList.toggle('dialog', classic);
  if (classic) return;
  $('safari-prep-dialog').addEventListener('close', stopGate);
  // the grass line is measured off the layout, so repaint whenever anything above or around it moves
  const relayout = new ResizeObserver(() => { if ($('safari-prep-dialog').open) paintGate(); });
  relayout.observe($('sp-page'));
  relayout.observe($('sp-top'));
}

function paintGate() {
  const page = $('sp-page'), top = page.getBoundingClientRect().top;
  const g = startGate($('sp-sky'), page, $('sp-base').getBoundingClientRect().top - top + 8, $('sp-date').getBoundingClientRect().bottom - top);
  page.style.setProperty('--ground', `${g}px`);
}

export function openSafariPrep() {
  render();
  $('sp-how').open = classic;
  openDialog('safari-prep-dialog');
  if (classic) return;
  $('safari-prep-dialog').scrollTop = 0;
  engrave();
  paintGate();
}

const PLAQUE_ROWS = 5;
let engraved = false;

/** The lobby's plaque: today's top catchers, the Sky Pillar's bronze plate (engrave() in js/towerprep.js); it's the last
    thing on the page, so unlike the tower's it keeps no room before the board answers. */
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

  const mon = el('img', 'pixel sp-mon');
  mon.src = spriteUrl(daily.starter, 'front', 0);
  mon.alt = '';
  const areas = el('div', 'sp-areas');
  daily.areas.forEach((area, i) => {
    const page = SAFARI_DEX_PAGES.find(p => p.area === area.id);
    const { caught } = safariProgress(page.ids, save.safariDex);
    const chip = el('span', `sp-area area-${area.id}`);
    chip.append(el('b', '', `${i + 1}. ${area.name}`), el('small', '', `${caught}/${page.ids.length}`));
    chip.title = `${area.name}: ${caught} of ${page.ids.length} caught`;
    areas.append(chip);
  });
  const info = el('div', 'sp-info');
  info.append(el('span', 'sp-kicker', `Today's starter · ${daily.day}`), el('strong', 'sp-name', daily.starter.line[0].name), areas,
    el('span', `sp-try${first ? ' first' : ' replay'}`, first ? '🏆 Daily run: 1/1' : access === 'pass' ? '🎫 Day Pass: replays today' : '🏆 Daily run: 0/1'));
  $('sp-today').replaceChildren(mon, info);
  $('sp-date').textContent = `Today's starter · ${daily.day}`;
  const gateMon = $('sp-gate-mon');
  gateMon.src = mon.src;
  gateMon.alt = daily.starter.line[0].name;
  $('sp-start').querySelector('.pxb-i').replaceChildren(...(first ? ['Start', el('span', 'try-count', '1/1')] : access === 'pass' ? ['Replay', infGlyph()] : [`Day Pass ${DAY_PASS}`]));

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
  // the day's rules as pills, both rows always, no sentences (the user's asks, 2026-10-03): the try = what it gets, grey when off
  const pill = (cls, text, tip) => Object.assign(el('span', `sp-pill ${cls}`, text), { title: tip });
  const row = (...pills) => { const r = el('span', 'sp-pill-row'); r.append(...pills); return r; };
  $('sp-replay').replaceChildren(row(pill('daily', 'Daily run', 'Your one try today'), el('span', 'sp-eq', '='), pill('board', 'Leaderboard', 'This try goes on the leaderboard'), pill('perks off', 'Perks', 'Perks are off for this try')),
    row(pill('replay', 'Replay', `After your daily run, a Day Pass (${DAY_PASS} coins) replays it as much as you like today`), el('span', 'sp-eq', '='), pill('board off', 'Leaderboard', "Replays don't go on the leaderboard"), pill('perks', 'Perks', 'Your perks are back')));

  const week = ballWeek();
  $('sp-balls').replaceChildren(...BALLS.map(ball => {
    const left = ball.free ? SAFARI_BALLS : ball.stock ? save.balls[ball.id] || 0
      : !save.balls.owned.includes(ball.id) ? 0 : save.balls.masterWeek === week ? 0 : 1;
    const slot = el('div', `sp-ball${left === 0 ? ' none' : ''}`);
    slot.append(itemSprite(ball, 'sp-ball-icon'), el('b', `sp-ball-left${left === '∞' ? ' inf' : ''}`, typeof left === 'number' ? `×${left}` : left));
    slot.title = `${ball.name}: ${ball.text}`;
    slot.setAttribute('aria-label', `${ball.name}, ${left === '∞' ? 'always' : left} in your bag`);
    return slot;
  }));
  requestAnimationFrame(() => ballEdges($('sp-balls')));
}

function ballEdges(strip) {
  strip.classList.toggle('more-l', strip.scrollLeft > 2);
  strip.classList.toggle('more-r', strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 2);
}
