/* ============================================================
   deckpreview.js  -  looking at a deck (you can't edit it).

   1. openPreview()   the screen you see after picking a starter:
                      its 10 starting cards and its evolution line.
   2. showDeckDialog() the pop-up you can open during a run to see
                      your deck as it grows.
   ============================================================ */

import { CARDS_BY_ID, STAGE_POWER } from './data/cards.js';
import { BACKDROPS, BASE_HP, HP_PER_STAGE, spriteUrl } from './data/starters.js';
import { TYPES } from './data/cards.js';
import { $, el, makeCard, groupDeck, showScreen, setBackdrop, openDialog } from './ui.js';

/** Fill a container with the cards of a deck, grouping copies (Ember ×3). */
function fillDeck(container, ids, stage = 0) {
  container.replaceChildren(
    ...groupDeck(ids, CARDS_BY_ID).map(({ card, count }) => makeCard(card, { stage, count })),
  );
}

/** The screen shown after you pick a starter. */
export function openPreview(starter, { onBegin, onBack }) {
  const type = TYPES[starter.type];

  setBackdrop(BACKDROPS[starter.type], starter.type);
  $('preview-sprite').src = spriteUrl(starter, 'front');
  $('preview-sprite').alt = starter.line[0].name;
  $('preview-title').textContent = `${starter.line[0].name}  ${type.icon} ${type.label}`;
  $('preview-blurb').textContent = starter.blurb;

  // the three evolution stages
  $('evo-line').replaceChildren(...starter.line.flatMap((stage, i) => {
    const tile = el('div', 'evo-stage');
    const img = el('img', 'pixel');
    img.src = spriteUrl(starter, 'front', i);
    img.alt = stage.name;
    tile.append(img, el('strong', '', stage.name), el('span', 'evo-hp', `${BASE_HP + i * HP_PER_STAGE} HP`));
    return i < 2 ? [tile, el('span', 'evo-arrow', '→')] : [tile];
  }));
  $('evo-note').textContent =
    `Evolves after you defeat the Biome 1 and Biome 2 bosses: +${HP_PER_STAGE} max HP, a full heal, ` +
    `and all your moves get ${STAGE_POWER * 100}% stronger.`;

  $('preview-count').textContent = `${starter.deck.length} cards`;
  fillDeck($('preview-deck'), starter.deck);

  $('preview-back').onclick = onBack;
  $('preview-begin').onclick = onBegin;
  showScreen('preview-screen');
}

/** Pop-up showing the deck you have right now in a run. */
export function showDeckDialog(run) {
  $('deck-dialog-count').textContent = `${run.deck.length} cards`;
  fillDeck($('deck-dialog-cards'), run.deck, run.stage);
  openDialog('deck-dialog');
}
