/* ============================================================
   deckpreview.js  -  looking at a deck (you can't edit it).

   showDeckDialog() the pop-up you can open during a run to see your
   deck as it grows. (The starting deck is shown by the character
   select's Prepare step, prepare() in select.js.)
   ============================================================ */

import { CARDS_BY_ID } from './data/cards.js';
import { $, makeCard, zoomable, groupDeck, openDialog } from './ui.js';
import { getSave, updateSave } from './storage.js';

/** Fill a container with the cards of a deck, grouping copies (Ember ×3). Tap one to read it bigger. */
export function fillDeck(container, ids, stage = 0) {
  container.replaceChildren(
    ...groupDeck(ids, CARDS_BY_ID).map(({ card, count }) => zoomable(makeCard(card, { stage, count }), card, stage)),
  );
}

const kindOf = (card) => card.power ? 'power' : (card.effects.damage || card.effects.blockDamage) ? 'attack' : 'skill';
// X after every number, unplayable cards last
const costRank = (card) => card.unplayable ? 99 : card.cost === 'X' ? 98 : card.cost;
const SORTS = {
  got: () => 0,
  cost: (a, b) => costRank(a.card) - costRank(b.card) || a.card.name.localeCompare(b.card.name),
  name: (a, b) => a.card.name.localeCompare(b.card.name),
};

let shown = null;   // the run whose deck the dialog shows, so a tap on the filter or sort redraws it

function drawDeck() {
  const { deckSort = 'got', deckFilter = 'all' } = getSave();
  for (const [id, value] of [['deck-filter', deckFilter], ['deck-sort', deckSort]]) {
    for (const btn of $(id).children) btn.setAttribute('aria-pressed', String(btn.dataset.v === value));
  }
  const groups = groupDeck(shown.deck, CARDS_BY_ID)
    .filter(({ card }) => deckFilter === 'all' || kindOf(card) === deckFilter)
    .sort(SORTS[deckSort] ?? SORTS.got);
  $('deck-dialog-cards').replaceChildren(
    ...groups.map(({ card, count }) => zoomable(makeCard(card, { stage: shown.stage, count }), card, shown.stage)),
  );
  $('deck-empty').hidden = groups.length > 0;
}

for (const [id, key] of [['deck-filter', 'deckFilter'], ['deck-sort', 'deckSort']]) {
  $(id).addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !shown) return;
    updateSave(d => { d[key] = btn.dataset.v; });
    drawDeck();
  });
}

/** Pop-up showing the deck you have right now in a run. */
export function showDeckDialog(run) {
  shown = run;
  $('deck-dialog-count').textContent = `${run.deck.length} cards`;
  drawDeck();
  openDialog('deck-dialog');
}
