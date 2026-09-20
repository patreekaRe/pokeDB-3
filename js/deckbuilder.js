/* ============================================================
   deckbuilder.js  -  the screen where you choose your cards.

   You can add cards by clicking/tapping OR by dragging them into the deck.
   (Dragging doesn't work on most phones, so tapping is always available.)

   The deck itself is just an array of card ids, like
   ['ember', 'ember', 'block']. That makes it easy to save.
   ============================================================ */

import {
  CARDS_BY_ID, TYPES, poolForType, defaultDeck, DECK_MIN, DECK_MAX, MAX_COPIES,
} from './data/cards.js';
import { BACKDROPS, spriteUrl } from './data/starters.js';
import { isCardUnlocked } from './progress.js';
import {
  getCurrentDeck, setCurrentDeck, getSlots, saveToSlot, DECK_SLOTS,
} from './storage.js';
import { $, el, makeCard, showScreen, setBackdrop, toast } from './ui.js';

let starter = null;   // the starter Pokémon you picked
let deck = [];        // array of card ids
let onBattle = () => {};

/** Called once at startup: wires up the buttons that never change. */
export function initDeckBuilder(battleCallback) {
  onBattle = battleCallback;

  $('deck-clear').addEventListener('click', () => { deck = []; changed(); });
  $('deck-default').addEventListener('click', () => { deck = defaultDeck(starter.type); changed(); });
  $('battle-btn').addEventListener('click', () => {
    if (deck.length >= DECK_MIN) onBattle(starter, [...deck]);
  });

  // Drag and drop: the deck panel accepts new cards...
  makeDropTarget($('deck-panel'), (payload) => {
    if (payload.startsWith('add:')) addCard(payload.slice(4));
  });
  // ...and dropping a deck card back on the collection removes it.
  makeDropTarget($('pool-panel'), (payload) => {
    if (payload.startsWith('remove:')) removeAt(Number(payload.slice(7)));
  });
}

/** Show the deck builder for a starter. */
export function openDeckBuilder(chosenStarter) {
  starter = chosenStarter;
  deck = cleanDeck(getCurrentDeck(starter.id) || defaultDeck(starter.type));

  setBackdrop(BACKDROPS[starter.type], starter.type);
  $('builder-sprite').src = spriteUrl(starter, 'front');
  $('builder-title').textContent = `${starter.name}'s deck`;
  showScreen('builder-screen');
  render();
}

/* ---------- changing the deck ---------- */

const countOf = (id) => deck.filter(x => x === id).length;

function addCard(id) {
  const card = CARDS_BY_ID[id];
  if (!card || !isCardUnlocked(card)) return;
  if (deck.length >= DECK_MAX) return toast(`Your deck is full (${DECK_MAX} cards).`, 'warn');
  if (countOf(id) >= MAX_COPIES) return toast(`Max ${MAX_COPIES} copies of ${card.name}.`, 'warn');
  deck.push(id);
  changed();
}

function removeAt(index) {
  deck.splice(index, 1);
  changed();
}

/** Anything that changes the deck ends up here: save it and redraw. */
function changed() {
  setCurrentDeck(starter.id, deck);
  render();
}

/** Drop cards that don't belong (locked, unknown, too many copies). */
function cleanDeck(ids) {
  const allowed = new Set(poolForType(starter.type).filter(isCardUnlocked).map(c => c.id));
  const counts = {};
  return ids
    .filter(id => allowed.has(id) && (counts[id] = (counts[id] || 0) + 1) <= MAX_COPIES)
    .slice(0, DECK_MAX);
}

/* ---------- drawing the screen ---------- */

function render() {
  renderDeck();
  renderPool();
  renderSaveSlots();

  $('deck-count').textContent = `${deck.length}/${DECK_MAX}`;
  const ready = deck.length >= DECK_MIN;
  $('battle-btn').disabled = !ready;
  $('deck-warning').textContent = ready ? '' : `Add at least ${DECK_MIN} cards to battle.`;
}

function renderDeck() {
  const box = $('deck-slots');
  box.replaceChildren();

  for (let i = 0; i < DECK_MAX; i++) {
    const id = deck[i];
    if (!id) { box.append(el('div', 'slot empty', '+')); continue; }

    const node = makeCard(CARDS_BY_ID[id], { small: true });
    makeActionable(node, () => removeAt(i), `Remove ${CARDS_BY_ID[id].name}`);
    node.draggable = true;
    node.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', `remove:${i}`));
    box.append(node);
  }
}

function renderPool() {
  const box = $('card-pool');
  box.replaceChildren();

  const sections = [
    [`${TYPES[starter.type].icon} ${TYPES[starter.type].label} moves`, poolForType(starter.type).filter(c => c.type === starter.type)],
    ['⭐ Neutral moves', poolForType(starter.type).filter(c => c.type === 'normal')],
  ];

  for (const [title, cards] of sections) {
    box.append(el('h4', 'pool-heading', title));
    for (const card of cards) box.append(poolCard(card));
  }
}

function poolCard(card) {
  const unlocked = isCardUnlocked(card);
  const node = makeCard(card, { locked: !unlocked, unlockAt: card.unlockAt });

  if (!unlocked) return node;

  const copies = countOf(card.id);
  if (copies > 0) node.append(el('span', 'in-deck', `×${copies}`));
  if (copies >= MAX_COPIES || deck.length >= DECK_MAX) node.classList.add('maxed');

  makeActionable(node, () => addCard(card.id), `Add ${card.name} to deck`);
  node.draggable = true;
  node.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', `add:${card.id}`));
  return node;
}

function renderSaveSlots() {
  const box = $('save-slots');
  box.replaceChildren(el('span', 'save-label', 'Saved decks:'));
  const slots = getSlots(starter.id);

  for (let i = 0; i < DECK_SLOTS; i++) {
    const saved = slots[i];
    const item = el('div', 'save-slot');
    item.append(el('span', 'save-info', `Slot ${i + 1}: ${saved ? saved.length + ' cards' : 'empty'}`));

    const saveBtn = el('button', 'btn small secondary', 'Save');
    saveBtn.addEventListener('click', () => {
      saveToSlot(starter.id, i, deck);
      toast(`Deck saved to slot ${i + 1}.`, 'ok');
      renderSaveSlots();
    });

    const loadBtn = el('button', 'btn small secondary', 'Load');
    loadBtn.disabled = !saved;
    loadBtn.addEventListener('click', () => {
      deck = cleanDeck(saved);
      changed();
      toast(`Loaded slot ${i + 1}.`, 'ok');
    });

    item.append(saveBtn, loadBtn);
    box.append(item);
  }
}

/* ---------- small helpers ---------- */

/** Make a div behave like a button: click, Enter and Space all work. */
function makeActionable(node, action, label) {
  node.tabIndex = 0;
  node.setAttribute('role', 'button');
  node.setAttribute('aria-label', label);
  node.addEventListener('click', action);
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); }
  });
}

/** Turn an element into a place you can drop dragged cards onto. */
function makeDropTarget(node, onDrop) {
  node.addEventListener('dragover', (e) => { e.preventDefault(); node.classList.add('drop-hover'); });
  node.addEventListener('dragleave', (e) => {
    if (!node.contains(e.relatedTarget)) node.classList.remove('drop-hover');
  });
  node.addEventListener('drop', (e) => {
    e.preventDefault();
    node.classList.remove('drop-hover');
    onDrop(e.dataTransfer.getData('text/plain'));
  });
}
