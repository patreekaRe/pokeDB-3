/* ============================================================
   ui.js  -  small helpers every screen shares:
   switching screens, toast messages, dialogs, and the card element.
   ============================================================ */

import { TYPES, describe } from './data/cards.js';

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

const SCREENS = ['start-screen', 'builder-screen', 'battle-screen'];

/** Show one screen and hide the others. */
export function showScreen(id) {
  SCREENS.forEach(s => { $(s).hidden = s !== id; });
  $('home-btn').hidden = id === 'start-screen';   // no "menu" button needed on the menu
  document.body.dataset.screen = id;
  window.scrollTo(0, 0);
}

/** Set the blurred backdrop picture behind everything. */
export function setBackdrop(url, type) {
  $('backdrop').style.backgroundImage = url ? `url("${url}")` : '';
  document.body.dataset.theme = type || '';
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
 *   options.locked   greyed out with a padlock
 *   options.unlockAt text shown on a locked card
 *   options.small    compact version used in the deck strip
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
  const text = el('p', 'card-text', describe(card));

  // The outer .card sets the size; the inner .card-face is what you see.
  // (Text inside sizes itself from the card's width, see cards.css.)
  const face = el('div', 'card-face');
  face.append(cost, name, art, tag, text);
  node.append(face);

  if (options.small) node.classList.add('small');
  if (options.locked) {
    node.classList.add('locked');
    face.append(el('div', 'lock-badge', `🔒 Win ${options.unlockAt} battles`));
  }
  return node;
}
