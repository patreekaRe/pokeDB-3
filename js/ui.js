/* ============================================================
   ui.js  -  small helpers every screen shares:
   switching screens, toast messages, dialogs, and the card element.
   ============================================================ */

import { TYPES, describe } from './data/cards.js';
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
  $('bag').hidden = true;
  $('bag-btn').setAttribute('aria-expanded', 'false');
  // the map, battles and reward screens pick their own track (biome theme, fight music, victory, Pokémon Center)
  if (!inRun) playMusic('title');
  window.scrollTo(0, 0);
}

/** Set the blurred backdrop picture behind everything. */
export function setBackdrop(url, type) {
  $('backdrop').style.backgroundImage = url ? `url("${url}")` : '';
  document.body.dataset.theme = type || '';
}

/** Refresh every on-screen PokéCoin balance from the save. Call this after coins change. */
export function refreshCoins() {
  const coins = getSave().coins;
  for (const node of document.querySelectorAll('.coin-value')) node.textContent = String(coins);
}

/* ---------- toast (little message at the top) ---------- */

let toastTimer;
export function toast(message, kind = '') {
  const t = $('toast');
  t.textContent = message;
  t.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 2200);
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
  const art = el('div', 'card-art', card.art);
  const tag = el('div', 'card-type', `${type.icon} ${type.label}`);
  const text = el('p', 'card-text', describe(card, options.stage || 0));

  // The outer .card sets the size; the inner .card-face is what you see.
  // (Text inside sizes itself from the card's width, see cards.css.)
  const face = el('div', 'card-face');
  face.append(cost, name, art, tag, text);
  node.append(face);

  if (options.count > 1) node.append(el('span', 'in-deck', `×${options.count}`));
  return node;
}

/** A relic tile: icon, name and what it does. */
export function makeRelic(relic) {
  const node = el('div', 'relic');
  node.title = `${relic.name}: ${relic.text}`;
  node.append(el('span', 'relic-icon', relic.icon), el('strong', 'relic-name', relic.name), el('span', 'relic-text', relic.text));
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
