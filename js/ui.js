/* ============================================================
   ui.js  -  small helpers every screen shares:
   switching screens, dialogs, and the card element.
   ============================================================ */

import { TYPES, describe, keywords } from './data/cards.js';
import { ITEM_FIT } from './data/item-fit.js';
import { getSave } from './storage.js';
import { playMusic } from './audio.js';

/** Shorthand for document.getElementById. */
export const $ = (id) => document.getElementById(id);

/** Wait for a number of milliseconds (use with `await`). */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Build an element in one line: el('div', 'card big', 'Hello'). */
export function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/* ---------- screens ---------- */

const SCREENS = ['start-screen', 'preview-screen', 'map-screen', 'reward-screen', 'battle-screen'];

// The screens of a run in progress: they pick their own music, and only they show the Bag.
const RUN_SCREENS = ['map-screen', 'battle-screen', 'reward-screen'];

/** Show one screen and hide the others. */
export function showScreen(id) {
  SCREENS.forEach(s => { $(s).hidden = s !== id; });
  document.body.dataset.screen = id;
  $('home-btn').hidden = id === 'start-screen';   // the menu's "Main menu" item isn't needed on the menu
  const inRun = RUN_SCREENS.includes(id);
  $('bag-btn').hidden = !inRun;
  $('money-pill').hidden = !inRun;
  // in a run the Shop moves into the Poké Ball menu, leaving the top bar to the run's own ₽ and Bag
  $('shop-btn').hidden = inRun;
  $('menu-shop-btn').hidden = !inRun;
  $('bag').hidden = true;
  $('bag-btn').setAttribute('aria-expanded', 'false');
  // the map, battles and reward screens pick their own track (biome theme, fight music, victory, Pokémon Center)
  if (!inRun) playMusic('title');
  window.scrollTo(0, 0);
}

/** Tint the page with the starter type's accent colour (or none). */
export function setTheme(type) {
  document.body.dataset.theme = type || '';
}

/** Refresh every on-screen PokéCoin balance from the save. Call this after coins change. */
export function refreshCoins() {
  const coins = getSave().coins;
  for (const node of document.querySelectorAll('.coin-value')) node.textContent = String(coins);
}

/* ---------- dialogs (built on the <dialog> element) ---------- */

export function openDialog(id) {
  const d = $(id);
  if (!d.open) d.showModal();
}
export function closeDialog(id) {
  const d = $(id);
  if (d.open) d.close();
}

/** Ask a yes/no question. Use it like:  if (await confirmDialog('Sure?')) { ... } */
export function confirmDialog(question, yesLabel = 'Yes') {
  $('confirm-text').textContent = question;
  $('confirm-yes').textContent = yesLabel;
  openDialog('confirm-dialog');
  return new Promise(resolve => {
    const finish = (answer) => {
      $('confirm-yes').onclick = $('confirm-no').onclick = null;
      closeDialog('confirm-dialog');
      resolve(answer);
    };
    $('confirm-yes').onclick = () => finish(true);
    $('confirm-no').onclick = () => finish(false);
  });
}

/* ---------- the card element ---------- */

/**
 * Build the HTML for one card.
 *   options.stage    evolution stage (moves get stronger, so the text changes)
 *   options.count    show a ×N badge (used when the same card is in the deck several times)
 */
export function makeCard(card, options = {}) {
  const type = TYPES[card.type];
  const node = el('div', `card type-${card.type}`);
  node.dataset.id = card.id;

  const cost = el('span', 'card-cost', String(card.cost));
  cost.title = `Costs ${card.cost} energy`;

  const name = el('h3', 'card-name', card.name);
  // pixel letters can't break inside a word, so a long one (Flamethrower) shrinks to fit the card
  const longest = Math.max(...card.name.split(/[ -]/).map(w => w.length));
  if (longest > 9) name.style.setProperty('--name-fit', (9.6 / longest).toFixed(3));
  const art = card.sprite ? cardSprite(card) : el('div', 'card-art', card.art);
  const tag = el('div', 'card-type', `${type.icon} ${type.label}`);
  const text = el('p', 'card-text');
  const words = keywords(card);
  const kw = ([label, tip]) => { const k = el('b', 'card-kw', `${label}.`); k.title = tip; return k; };
  // one wrapper, since .card-text is a grid and would give each piece its own row
  const line = el('span');
  line.append(...words.lead.flatMap(w => [kw(w), ' ']), describe(card, options.stage || 0), ...words.tail.flatMap(w => [' ', kw(w)]));
  text.append(line);

  // The outer .card sets the size; the inner .card-face is what you see.
  // (Text inside sizes itself from the card's width, see cards.css.)
  const face = el('div', 'card-face');
  face.append(cost, name, art, tag, text);
  node.append(face);

  if (options.count > 1) node.append(el('span', 'in-deck', `×${options.count}`));
  return node;
}

/** A card's item art, cropped to the sprite's visible pixels (ITEM_FIT) so the CSS can scale it to fill the art window. */
function cardSprite(card) {
  const art = el('div', 'card-art');
  const [x, y, w, h] = ITEM_FIT[card.sprite] || [0, 0, 32, 32];
  const crop = itemSprite({ id: card.sprite, icon: card.art }, 'sprite-fit');
  for (const [k, v] of Object.entries({ bx: x, by: y, bw: w, bh: h })) crop.style.setProperty(`--${k}`, v);
  art.append(crop);
  return art;
}

/**
 * Blow a card up in the middle of a dimmed screen so its text is easy to read.
 * Any tap or Escape closes it. Inside a modal dialog it's put in the dialog,
 * which sits in the top layer above everything else.
 */
export function zoomCard(card, stage, from) {
  const layer = el('div', 'card-zoom');
  const big = makeCard(card, { stage });
  big.classList.add('zoom-card');
  layer.append(big, el('p', 'focus-hint', 'Tap anywhere to close'));

  const close = () => {
    layer.remove();
    document.removeEventListener('keydown', onKey, true);
    from?.focus({ preventScroll: true });
  };
  // Escape would otherwise also close the dialog underneath
  const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); close(); } };
  layer.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  (from?.closest('dialog[open]') || document.body).append(layer);
}

/** Make a card in a deck view tappable to zoom in on it. */
export function zoomable(node, card, stage) {
  node.tabIndex = 0;
  node.setAttribute('role', 'button');
  node.setAttribute('aria-label', `${card.name}: tap to read it bigger`);
  node.addEventListener('click', () => zoomCard(card, stage, node));
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zoomCard(card, stage, node); }
  });
  return node;
}

/**
 * An item or relic's PokéSprite image (assets/items/<id>.png), in a span of the given class.
 * Sized in em like the pixel icons; falls back to its emoji if the file is missing.
 */
export function itemSprite(thing, className = '') {
  const box = el('span', className);
  const img = el('img', 'item-sprite');
  img.src = `assets/items/${thing.id}.png`;
  img.alt = '';
  img.draggable = false;
  img.onerror = () => box.replaceChildren(thing.icon || '');
  box.append(img);
  return box;
}

/** A relic tile: icon, name and what it does. */
export function makeRelic(relic) {
  const node = el('div', 'relic');
  node.title = `${relic.name}: ${relic.text}`;
  node.append(itemSprite(relic, 'relic-icon'), el('strong', 'relic-name', relic.name), el('span', 'relic-text', relic.text));
  return node;
}

/** Group a list of card ids into [{ card, count }], keeping first-seen order. */
export function groupDeck(ids, cardsById) {
  const groups = new Map();
  for (const id of ids) groups.set(id, (groups.get(id) || 0) + 1);
  return [...groups].map(([id, count]) => ({ card: cardsById[id], count }));
}

/**
 * Fill a Gold/Silver HP bar: #<prefix>-hp, #<prefix>-hp-fill and #<prefix>-hp-text.
 * It turns yellow at half HP and red at a fifth, like the games.
 */
export function setHpBar(prefix, hp, max) {
  const ratio = Math.max(0, hp / max);
  const bar = $(`${prefix}-hp`);
  bar.dataset.level = ratio > 0.5 ? 'high' : ratio > 0.2 ? 'mid' : 'low';
  bar.setAttribute('aria-valuemax', String(max));
  bar.setAttribute('aria-valuenow', String(Math.max(0, hp)));
  bar.title = `HP ${hp} / ${max}`;
  $(`${prefix}-hp-fill`).style.width = `${ratio * 100}%`;
  $(`${prefix}-hp-text`).textContent = `${Math.max(0, hp)}/ ${max}`;
}

/** Show the run's Pokédollars in the top bar (it's only visible on the run screens). */
export function setMoney(amount) {
  $('money-value').textContent = String(amount);
}
