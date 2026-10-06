/* ============================================================
   cardindex.js  -  the Index (StS's Compendium): every card in the
   game, a tab per type, grouped by rarity with the evolution-only
   moves on their own, then every relic and item. Everything stays a
   dark "???" until you meet it in a run, Pokédex-style (`seen` in
   the save, markSeen()). Opened from the Poké Ball menu; the Collection device's
   Moves app (movesApp()) is its compact list. Read-only: tap a card
   to read it bigger.
   ============================================================ */

import { ALL_CARDS, TYPES, evolutionCardsFor } from './data/cards.js';
import { RELICS, ABILITIES } from './data/relics.js';
import { ITEMS } from './data/items.js';
import { getSave, updateSave } from './storage.js';
import { $, el, makeCard, makeRelic, itemSprite, zoomable, zoomCard, openDialog } from './ui.js';
import { kindOf, costRank } from './deckpreview.js';

const TAB_LOOK = { mystery: { icon: '🔒', label: '???' }, relics: { icon: '🎒', label: 'Relics' }, items: { icon: '🧴', label: 'Items' } };
const RARITIES = [['common', 'Common'], ['uncommon', 'Uncommon'], ['rare', 'Rare']];

let tab = 'fire';

const SORTS = {
  cost: (a, b) => costRank(a) - costRank(b) || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
};

// the deck window's filter and sort; a locked card sorts as ??? so A-Z can't give its name away
function filtered(cards, seen) {
  const { indexFilter = 'all', indexSort = 'cost' } = getSave();
  const nameOf = (c) => (seen.has(c.id) ? c.name : '???');
  const sort = indexSort === 'name' ? (a, b) => nameOf(a).localeCompare(nameOf(b)) || SORTS.cost(a, b) : SORTS.cost;
  return cards.filter(c => indexFilter === 'all' || kindOf(c) === indexFilter).sort(sort);
}

function group(label, all, seen, note) {
  const cards = filtered(all, seen);
  if (!cards.length) return [];
  const head = el('div', 'index-head');
  const title = el('h3', 'index-heading', label);
  title.append(el('span', 'index-count', `${cards.filter(c => seen.has(c.id)).length}/${cards.length}`));
  head.append(title);
  if (note) head.append(el('p', 'index-note', note));
  return [head, ...cards.map(card => (seen.has(card.id) ? zoomable(makeCard(card), card, 0) : lockedCard(card)))];
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

/** A relic or item: its tile once seen in a run, else a dark silhouette of its sprite. */
function thingTile(thing, seen) {
  if (!seen) {
    const node = el('div', 'relic index-thing locked');
    node.append(itemSprite(thing, 'relic-icon'), el('strong', 'relic-name', '???'), el('span', 'relic-text', 'Not found yet.'));
    return node;
  }
  const node = makeRelic(thing, { tips: true });
  node.removeAttribute('title');   // its name and text are right there
  node.classList.add('index-thing');
  if (thing.only) node.append(el('span', `index-only type-${thing.only}`, `${TYPES[thing.only].label} only`));
  return node;
}

function thingGroup(label, things, seen, note) {
  const head = el('div', 'index-head');
  const title = el('h3', 'index-heading', label);
  title.append(el('span', 'index-count', `${things.filter(t => seen.has(t.id)).length}/${things.length}`));
  head.append(title);
  if (note) head.append(el('p', 'index-note', note));
  return [head, ...things.map(t => thingTile(t, seen.has(t.id)))];
}

/** The Relics or Items tab, grouped by rarity (and boss relics on their own). */
function renderThings() {
  const { body, total } = thingsBody(tab);
  $('index-cards').replaceChildren(...body);
  $('index-cards').classList.add('index-things');
  $('index-total').textContent = total;
}

/** The Relics or Items tab drawn into `into` (the Collection device's screen); returns its "n/m found". */
export function drawThings(kind, into) {
  const { body, total } = thingsBody(kind);
  const grid = el('div', 'card-pool index-things');
  grid.append(...body);
  into.replaceChildren(grid);
  return total;
}

function thingsBody(kind) {
  const relics = kind === 'relics';
  const all = relics ? RELICS : ITEMS;
  const seen = new Set(getSave().seen[kind]);
  const body = [];
  if (relics) {
    const abilities = Object.values(ABILITIES).filter(a => a.id !== 'pressure' || getSave().unlocked.includes('mewtwo'));
    body.push(...thingGroup('Abilities', abilities, new Set(abilities.map(a => a.id)),
      'Every starter has its type\'s Ability from the start.'));
  }
  for (const [rarity, label] of RARITIES) {
    const set = all.filter(t => !t.boss && t.rarity === rarity);
    if (set.length) body.push(...thingGroup(label, set, seen));
  }
  if (relics) body.push(...thingGroup('Boss', all.filter(t => t.boss), seen, 'Only offered after beating a boss.'));
  if (relics) body.push(...thingGroup('Special', all.filter(t => t.unique), seen, 'Won by beating Chad Master Kenmatta in his dojo.'));
  return { body, total: `${all.filter(t => seen.has(t.id)).length}/${all.length} found` };
}

function render() {
  $('index-cards').classList.remove('index-things');
  const cardTab = !TAB_LOOK[tab];
  $('index-tools').hidden = !cardTab;
  if (cardTab) {
    const { indexFilter = 'all', indexSort = 'cost' } = getSave();
    for (const [id, value] of [['index-filter', indexFilter], ['index-sort', indexSort]]) {
      for (const btn of $(id).children) btn.setAttribute('aria-pressed', String(btn.dataset.v === value));
    }
  }
  if (tab === 'mystery') renderMystery();
  else if (TAB_LOOK[tab]) renderThings();
  else renderCards();
  $('index-empty').hidden = !cardTab || $('index-cards').children.length > 0;
  $('index-dialog').scrollTop = 0;
  for (const btn of document.querySelectorAll('.index-tab')) {
    btn.setAttribute('aria-selected', String(btn.dataset.type === tab));
    btn.tabIndex = btn.dataset.type === tab ? 0 : -1;
  }
}

function renderMystery() {
  const all = ALL_CARDS.filter(card => card.type === 'psychic');
  const cards = filtered([...all], new Set());
  const head = el('div', 'index-head');
  const title = el('h3', 'index-heading', '???');
  title.append(el('span', 'index-count', String(all.length)));
  head.append(title, el('p', 'index-note', 'The secret starter\'s moves are still unknown.'));
  $('index-cards').replaceChildren(...(cards.length ? [head, ...cards.map(card => lockedCard(card, true))] : []));
  $('index-total').textContent = `0/${all.length} found`;
}

function renderCards() {
  const cards = ALL_CARDS.filter(c => c.type === tab);
  const seen = new Set(getSave().seen.cards);
  const body = [];
  for (const [rarity, label] of RARITIES) {
    const set = cards.filter(c => !c.evoOnly && (c.rarity || 'common') === rarity);
    if (set.length) body.push(...group(label, set, seen));
  }
  const evo = [[1, 'Evolution: 1st form', 'Offered when your starter first evolves (pick 1 of 2).'],
    [2, 'Evolution: final form', 'Offered when your starter reaches its final form.']];
  for (const [stage, label, note] of evo) {
    const set = evolutionCardsFor(tab, stage);
    if (set.length) body.push(...group(label, [...set], seen, note));
  }
  $('index-cards').replaceChildren(...body);
  $('index-total').textContent = `${cards.filter(c => seen.has(c.id)).length}/${cards.length} found`;
}

function visibleTabs() {
  return [
    'fire', 'grass', 'water', 'normal',
    getSave().unlocked.includes('mewtwo') ? 'psychic' : 'mystery',
    'relics', 'items',
  ];
}

function renderTabs() {
  const tabs = $('index-tabs');
  tabs.replaceChildren(...visibleTabs().map(type => {
    const btn = el('button', `index-tab type-${type}`);
    btn.type = 'button';
    btn.dataset.type = type;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', 'index-cards');
    const look = TAB_LOOK[type] || TYPES[type];
    btn.append(el('span', 'index-tab-icon', look.icon), el('span', 'index-tab-label', look.label));
    btn.addEventListener('click', () => pick(type));
    return btn;
  }));
}

function pick(type, focus = false) {
  if (!visibleTabs().includes(type)) return;
  tab = type;
  render();
  if (focus) document.querySelector(`.index-tab[data-type="${type}"]`)?.focus();
}

export function initCardIndex() {
  const tabs = $('index-tabs');
  renderTabs();
  for (const [id, key] of [['index-filter', 'indexFilter'], ['index-sort', 'indexSort']]) {
    $(id).addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      updateSave(d => { d[key] = btn.dataset.v; });
      render();
    });
  }
  tabs.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const available = visibleTabs();
    pick(available[(available.indexOf(tab) + step + available.length) % available.length], true);
  });
}

/** Opens on the given type's tab (the picked starter's), else the last one looked at. */
export function openCardIndex(type) {
  const available = visibleTabs();
  if (available.includes(type)) tab = type;
  if (!available.includes(tab)) tab = available.includes('psychic') ? 'psychic' : 'fire';
  renderTabs();
  render();
  openDialog('index-dialog');
}

/* ---------- the Collection device's Moves app (js/device.js): a type tab row over a compact list ---------- */

let movesTab = null;
const moveTabs = () => visibleTabs().filter(t => !['relics', 'items'].includes(t));

/** A move's row: its cost and name, ??? until met; a tap zooms its card. */
function moveRow(card, seen) {
  const known = seen.has(card.id);
  const row = el(known ? 'button' : 'div', `mv-row${known ? '' : ' locked'}`);
  row.dataset.type = card.type;
  row.append(el('span', 'mv-cost', known ? String(card.cost) : '?'), el('span', 'mv-name', known ? card.name : '???'));
  if (known) {
    row.type = 'button';
    row.append(el('span', 'mv-kind', kindOf(card)));
    row.addEventListener('click', () => zoomCard(card, 0, row));
  }
  return row;
}

function moveGroup(label, cards, seen, note) {
  if (!cards.length) return [];
  const rank = (c) => (seen.has(c.id) ? costRank(c) : 100);   // the ??? rows after the known ones, their costs hidden
  const head = el('h3', 'mv-head', label);
  head.append(el('span', 'index-count', `${cards.filter(c => seen.has(c.id)).length}/${cards.length}`));
  const rows = el('div', 'mv-rows');
  rows.append(...[...cards].sort((a, b) => rank(a) - rank(b) || (rank(a) < 100 ? a.name.localeCompare(b.name) : 0)).map(c => moveRow(c, seen)));
  return [head, ...(note ? [el('p', 'mv-note', note)] : []), rows];
}

function moveList(type) {
  if (type === 'mystery') {
    return moveGroup('???', ALL_CARDS.filter(c => c.type === 'psychic'), new Set(), 'The secret starter\'s moves are still unknown.');
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
  const show = (t) => {
    movesTab = t;
    for (const b of tabs.children) b.setAttribute('aria-selected', String(b.dataset.type === t));
    list.replaceChildren(...moveList(t));
    panel.scrollTop = 0;
  };
  return {
    mount(host) {
      panel = host;
      const available = moveTabs();
      tabs = el('div', 'index-tabs mv-tabs');
      tabs.setAttribute('role', 'tablist');
      tabs.append(...available.map(t => {
        const btn = el('button', `index-tab type-${t}`);
        btn.type = 'button';
        btn.dataset.type = t;
        btn.setAttribute('role', 'tab');
        const look = TAB_LOOK[t] || TYPES[t];
        btn.append(el('span', 'index-tab-icon', look.icon), el('span', 'index-tab-label', look.label));
        btn.addEventListener('click', () => show(t));
        return btn;
      }));
      list = el('div', 'mv-list');
      host.append(tabs, list);
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
