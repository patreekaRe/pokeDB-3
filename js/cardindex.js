/* ============================================================
   cardindex.js  -  the Collection device's Moves app (StS's
   Compendium): every card in the game, a tab per type, grouped by
   rarity with the evolution-only moves on their own. Everything stays
   a dark "???" until you meet it in a run, Pokédex-style (`seen` in
   the save, markSeen()). Read-only: tap a card to read it bigger.
   The old Index window it came from was retired in D2 (2026-10-07).
   ============================================================ */

import { ALL_CARDS, TYPES, evolutionCardsFor } from './data/cards.js';
import { getSave, updateSave, clearFinds } from './storage.js';
import { newFinds, showBadgeNews } from './trainercard.js';
import { el, makeCard, zoomable } from './ui.js';
import { kindOf, costRank } from './deckpreview.js';
import { smoothIcon } from './smooth-icons.js';

const TAB_LOOK = { mystery: { label: '???' } };
const RARITIES = [['common', 'Common'], ['uncommon', 'Uncommon'], ['rare', 'Rare']];

const SORTS = {
  cost: (a, b) => costRank(a) - costRank(b) || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
};

// the filter and sort; a locked card sorts as ??? so A-Z can't give its name away
function filtered(cards, seen) {
  const { indexFilter = 'all', indexSort = 'cost' } = getSave();
  const nameOf = (c) => (seen.has(c.id) ? c.name : '???');
  const sort = indexSort === 'name' ? (a, b) => nameOf(a).localeCompare(nameOf(b)) || SORTS.cost(a, b) : SORTS.cost;
  return cards.filter(c => indexFilter === 'all' || kindOf(c) === indexFilter).sort(sort);
}

/** A move not met yet: its card's frame, a dark silhouette of its art, and ??? for its name and text. */
function lockedCard(card, hideType = false) {
  const node = makeCard(card);
  node.classList.add('index-locked');
  node.querySelectorAll('[title]').forEach(n => n.removeAttribute('title'));   // its cost and text hints would give it away
  node.querySelector('.card-name').textContent = '???';
  node.querySelector('.card-text').replaceChildren('???');
  node.querySelector('.card-cost').textContent = '?';
  if (hideType) node.querySelector('.card-type').textContent = '???';
  return node;
}

const moveTabs = () => ['fire', 'grass', 'water', 'normal', getSave().unlocked.includes('mewtwo') ? 'psychic' : 'mystery'];

/* ---------- the Collection device's Moves app (js/device.js): type tabs, the filter and sort, then the cards ---------- */

let movesTab = null;
const FILTERS = [['all', 'All'], ['attack', 'Attack'], ['skill', 'Skill'], ['power', 'Power']];
const ORDERS = [['cost', 'Cost'], ['name', 'A-Z']];

/** A row of LCD keys for one of the save's settings (the filter and sort). */
function lcdKeys(key, choices, fallback, redraw) {
  const row = el('div', 'mv-keys');
  row.setAttribute('role', 'group');
  for (const [v, label] of choices) {
    const btn = el('button', 'mv-key', label);
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String((getSave()[key] ?? fallback) === v));
    btn.addEventListener('click', () => {
      updateSave(d => { d[key] = v; });
      for (const b of row.children) b.setAttribute('aria-pressed', String(b === btn));
      redraw();
    });
    row.append(btn);
  }
  return row;
}

// the drawn tab's new finds wear a "!" this once; draw() clears them from the save once they're on screen
let drawnNew = [];
function fresh(node, card) {
  if (!newFinds('cards').includes(card.id)) return node;
  drawnNew.push(card.id);
  node.classList.add('news');
  node.append(el('span', 'tc-new card-new', '!'));
  return node;
}

function moveGroup(label, all, seen, note, hideType = false) {
  const cards = filtered(all, seen).sort((a, b) => seen.has(b.id) - seen.has(a.id));   // the ??? cards after the known ones
  if (!cards.length) return [];
  const head = el('h3', 'mv-head');
  head.append(el('span', '', label), el('span', 'mv-count', `${all.filter(c => seen.has(c.id)).length}/${all.length}`));
  const grid = el('div', 'mv-cards');
  grid.append(...cards.map(c => (seen.has(c.id) ? fresh(zoomable(makeCard(c), c, 0), c) : lockedCard(c, hideType))));
  return [head, ...(note ? [el('p', 'mv-note', note)] : []), grid];
}

function moveList(type) {
  if (type === 'mystery') {
    return moveGroup('???', ALL_CARDS.filter(c => c.type === 'psychic'), new Set(), 'The secret starter\'s moves are still unknown.', true);
  }
  const cards = ALL_CARDS.filter(c => c.type === type);
  const seen = new Set(getSave().seen.cards);
  const body = RARITIES.flatMap(([rarity, label]) => moveGroup(label, cards.filter(c => !c.evoOnly && (c.rarity || 'common') === rarity), seen));
  body.push(...moveGroup('Evolution: 1st form', evolutionCardsFor(type, 1), seen, 'Offered when your starter first evolves.'),
    ...moveGroup('Evolution: final form', evolutionCardsFor(type, 2), seen, 'Offered when it reaches its final form.'));
  return body;
}

/** The Moves app on the given type's tab (the picked starter's), else the last one looked at; the D-pad's left and
    right step through the tabs. */
export function movesApp(type) {
  let panel, tabs, list;
  const draw = () => {
    drawnNew = [];
    const body = moveList(movesTab);
    list.replaceChildren(...(body.length ? body : [el('p', 'mv-empty', 'No moves like that here.')]));
    if (drawnNew.length) { clearFinds('cards', drawnNew); showBadgeNews(); }
    markTabs();
  };
  // a tab with new moves in it wears a "!" till it's been looked at
  const markTabs = () => {
    const fresh = new Set(newFinds('cards'));
    for (const b of tabs.children) b.classList.toggle('news', ALL_CARDS.some(c => c.type === b.dataset.type && fresh.has(c.id)));
  };
  const show = (t) => {
    movesTab = t;
    for (const b of tabs.children) b.setAttribute('aria-selected', String(b.dataset.type === t));
    draw();
    panel.scrollTop = 0;
  };
  return {
    mount(host) {
      panel = host;
      const available = moveTabs();
      tabs = el('div', 'mv-tabs');
      tabs.setAttribute('role', 'tablist');
      tabs.append(...available.map(t => {
        const btn = el('button', `mv-tab type-${t}`);
        btn.type = 'button';
        btn.dataset.type = t;
        btn.setAttribute('role', 'tab');
        btn.append(smoothIcon(t === 'mystery' ? 'lock' : t), el('span', 'mv-tab-label', (TAB_LOOK[t] || TYPES[t]).label));
        btn.addEventListener('click', () => show(t));
        return btn;
      }));
      const tools = el('div', 'mv-tools');
      tools.append(lcdKeys('indexFilter', FILTERS, 'all', draw), lcdKeys('indexSort', ORDERS, 'cost', draw));
      const top = el('div', 'mv-top');
      top.append(tabs, tools);
      list = el('div', 'mv-list');
      host.append(top, list);
      show([type, movesTab].find(t => available.includes(t)) ?? available[0]);
    },
    back: () => false,
    key(e) {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step) return false;
      const available = moveTabs();
      show(available[(available.indexOf(movesTab) + step + available.length) % available.length]);
      return true;
    },
    unmount() {},
  };
}
