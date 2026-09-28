/* ============================================================
   deckpreview.js  -  looking at a deck (you can't edit it).

   showDeckDialog() the pop-up you can open during a run to see your
   deck as it grows. (The starting deck is shown by the character
   select's Prepare step, prepare() in select.js.)
   ============================================================ */

import { CARDS_BY_ID } from './data/cards.js';
import { $, makeCard, zoomable, groupDeck, openDialog } from './ui.js';

/** Fill a container with the cards of a deck, grouping copies (Ember ×3). Tap one to read it bigger. */
function fillDeck(container, ids, stage = 0) {
  container.replaceChildren(
    ...groupDeck(ids, CARDS_BY_ID).map(({ card, count }) => zoomable(makeCard(card, { stage, count }), card, stage)),
  );
}

/** Pop-up showing the deck you have right now in a run. */
export function showDeckDialog(run) {
  $('deck-dialog-count').textContent = `${run.deck.length} cards`;
  fillDeck($('deck-dialog-cards'), run.deck, run.stage);
  openDialog('deck-dialog');
}
