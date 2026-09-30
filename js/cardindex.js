/* ============================================================
   cardindex.js  -  the Index (StS's Compendium): every card in the
   game, a tab per type, grouped by rarity with the evolution-only
   moves on their own, then every relic and item. Everything stays a
   dark "???" until you meet it in a run, Pokédex-style (`seen` in
   the save, markSeen()). Opened from the Poké Ball menu and the home
   screen. Read-only: tap a card to read it bigger.
   ============================================================ */

import { ALL_CARDS, TYPES, evolutionCardsFor } from './data/cards.js';
import { RELICS, ABILITIES } from './data/relics.js';
import { ITEMS } from './data/items.js';
import { getSave } from './storage.js';
import { $, el, makeCard, makeRelic, itemSprite, zoomable, openDialog } from './ui.js';

const TAB_LOOK = { mystery: { icon: '🔒', label: '???' }, relics: { icon: '🎒', label: 'Relics' }, items: { icon: '🧴', label: 'Items' } };
const RARITIES = [['common', 'Common'], ['uncommon', 'Uncommon'], ['rare', 'Rare']];

let tab = 'fire';

const costRank = (c) => (c.cost === 'X' ? 9 : c.cost);
const byCost = (a, b) => costRank(a) - costRank(b) || a.name.localeCompare(b.name);

function group(label, cards, seen, note) {
  const head = el('div', 'index-head');
  const title = el('h3', 'index-heading', label);
  title.append(el('span', 'index-count', `${cards.filter(c => seen.has(c.id)).length}/${cards.length}`));
  head.append(title);
  if (note) head.append(el('p', 'index-note', note));
  return [head, ...cards.sort(byCost).map(card => (seen.has(card.id) ? zoomable(makeCard(card), card, 0) : lockedCard(card)))];
}

/** A move not met yet: its card's frame, a dark silhouette of its art, and ??? for its name and text. */
function lockedCard(card) {
  const node = makeCard(card);
  node.classList.add('index-locked');
  node.querySelectorAll('[title]').forEach(n => n.removeAttribute('title'));   // its cost and text hints would give it away
  node.querySelector('.card-name').textContent = '???';
  node.querySelector('.card-text').replaceChildren('???');
  node.querySelector('.card-cost').textContent = '?';
  return node;
}

/** A relic or item: its tile once seen in a run, else a dark silhouette of its sprite. */
function thingTile(thing, seen) {
  if (!seen) {
    const node = el('div', 'relic index-thing locked');
    node.append(itemSprite(thing, 'relic-icon'), el('strong', 'relic-name', '???'), el('span', 'relic-text', 'Not found yet.'));
    return node;
  }
  const node = makeRelic(thing);
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
  const relics = tab === 'relics';
  const all = relics ? RELICS : ITEMS;
  const seen = new Set(getSave().seen[tab]);
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
  $('index-cards').replaceChildren(...body);
  $('index-cards').classList.add('index-things');
  $('index-total').textContent = `${all.filter(t => seen.has(t.id)).length}/${all.length} found`;
}

function render() {
  $('index-cards').classList.remove('index-things');
  if (tab === 'mystery') renderMystery();
  else if (TAB_LOOK[tab]) renderThings();
  else renderCards();
  $('index-dialog').scrollTop = 0;
  for (const btn of document.querySelectorAll('.index-tab')) {
    btn.setAttribute('aria-selected', String(btn.dataset.type === tab));
    btn.tabIndex = btn.dataset.type === tab ? 0 : -1;
  }
}

function renderMystery() {
  const blank = () => {
    const node = lockedCard(ALL_CARDS[0]);
    node.querySelector('.card-art').replaceChildren();
    node.querySelector('.card-type').textContent = '???';
    return node;
  };
  const head = el('div', 'index-head');
  const title = el('h3', 'index-heading', '???');
  title.append(el('span', 'index-count', '?/?'));
  head.append(title, el('p', 'index-note', 'Moves no starter has learned yet.'));
  $('index-cards').replaceChildren(head, ...Array.from({ length: 8 }, blank));
  $('index-total').textContent = '?/? found';
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
