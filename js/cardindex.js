/* ============================================================
   cardindex.js  -  the card index (StS's Compendium): every card in
   the game, a tab per type, grouped by rarity with the evolution-only
   moves on their own. Opened from the Poké Ball menu and the home
   screen. Read-only: tap a card to read it bigger.
   ============================================================ */

import { ALL_CARDS, TYPES, evolutionCardsFor } from './data/cards.js';
import { $, el, makeCard, zoomable, openDialog } from './ui.js';

const TABS = ['fire', 'grass', 'water', 'normal'];
const RARITIES = [['common', 'Common'], ['uncommon', 'Uncommon'], ['rare', 'Rare']];

let tab = 'fire';

const byCost = (a, b) => a.cost - b.cost || a.name.localeCompare(b.name);

function group(label, cards, note) {
  const head = el('div', 'index-head');
  const title = el('h3', 'index-heading', label);
  title.append(el('span', 'index-count', String(cards.length)));
  head.append(title);
  if (note) head.append(el('p', 'index-note', note));
  return [head, ...cards.sort(byCost).map(card => zoomable(makeCard(card), card, 0))];
}

function render() {
  const cards = ALL_CARDS.filter(c => c.type === tab);
  const body = [];
  for (const [rarity, label] of RARITIES) {
    const set = cards.filter(c => !c.evoOnly && (c.rarity || 'common') === rarity);
    if (set.length) body.push(...group(label, set));
  }
  const evo = [[1, 'Evolution: 1st form', 'Offered when your starter first evolves (pick 1 of 2).'],
    [2, 'Evolution: final form', 'Offered when your starter reaches its final form.']];
  for (const [stage, label, note] of evo) {
    const set = evolutionCardsFor(tab, stage);
    if (set.length) body.push(...group(label, [...set], note));
  }
  $('index-cards').replaceChildren(...body);
  $('index-dialog').scrollTop = 0;
  $('index-total').textContent = `${cards.length} cards`;

  for (const btn of document.querySelectorAll('.index-tab')) {
    btn.setAttribute('aria-selected', String(btn.dataset.type === tab));
    btn.tabIndex = btn.dataset.type === tab ? 0 : -1;
  }
}

function pick(type, focus = false) {
  tab = type;
  render();
  if (focus) document.querySelector(`.index-tab[data-type="${type}"]`).focus();
}

export function initCardIndex() {
  const tabs = $('index-tabs');
  tabs.replaceChildren(...TABS.map(type => {
    const btn = el('button', `index-tab type-${type}`);
    btn.type = 'button';
    btn.dataset.type = type;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', 'index-cards');
    btn.append(el('span', 'index-tab-icon', TYPES[type].icon), el('span', 'index-tab-label', TYPES[type].label));
    btn.addEventListener('click', () => pick(type));
    return btn;
  }));
  tabs.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    pick(TABS[(TABS.indexOf(tab) + step + TABS.length) % TABS.length], true);
  });
}

/** Opens on the given type's tab (the picked starter's), else the last one looked at. */
export function openCardIndex(type) {
  if (TABS.includes(type)) tab = type;
  render();
  openDialog('index-dialog');
}
