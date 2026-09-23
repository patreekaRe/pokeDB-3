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
import { LEVELS, MAX_LEVEL } from './data/difficulty.js';
import { getSave } from './storage.js';
import { $, el, makeCard, groupDeck, showScreen, setBackdrop, openDialog } from './ui.js';

/** Fill a container with the cards of a deck, grouping copies (Ember ×3). */
function fillDeck(container, ids, stage = 0) {
  container.replaceChildren(
    ...groupDeck(ids, CARDS_BY_ID).map(({ card, count }) => makeCard(card, { stage, count })),
  );
}

let level = 0;   // the Trainer Level picked for the next run

/** Show the level picker: the rules of the chosen level, and a hint about the next one. */
function renderLevel() {
  const max = getSave().maxLevel;
  $('level-num').textContent = String(level);
  $('level-name').textContent = LEVELS[level].name;
  $('level-down').disabled = level <= 0;
  $('level-up').disabled = level >= max;

  const rules = level === 0
    ? [el('li', '', LEVELS[0].text)]
    : Array.from({ length: level }, (_, i) => el('li', '', `Level ${i + 1}: ${LEVELS[i + 1].text}`));
  if (level === max && max < MAX_LEVEL) {
    rules.push(el('li', 'level-locked', `🔒 Win a run on Level ${max} to unlock Level ${max + 1} (${LEVELS[max + 1].name}): ${LEVELS[max + 1].text}`));
  }
  $('level-rules').replaceChildren(...rules);
}

/** The screen shown after you pick a starter. onBegin(level) starts the run. */
export function openPreview(starter, { onBegin, onBack }) {
  const type = TYPES[starter.type];

  setBackdrop(BACKDROPS[starter.type], starter.type);
  $('preview-sprite').src = spriteUrl(starter, 'front');
  $('preview-sprite').alt = starter.line[0].name;
  $('preview-title').textContent = `${starter.line[0].name}  ${type.icon} ${type.label}`;
  $('preview-blurb').textContent = starter.blurb;

  // the three evolution stages, one per slide: swipe or use the arrows, and each form is drawn bigger than the last
  const WHEN = ['Where you start', 'After the Biome 1 boss', 'After the Biome 2 boss'];
  const track = $('evo-line');
  track.replaceChildren(...starter.line.map((stage, i) => {
    const slide = el('div', 'evo-stage');
    slide.dataset.stage = String(i);
    const img = el('img', 'pixel');
    img.src = spriteUrl(starter, 'front', i);
    img.alt = stage.name;
    slide.append(img, el('strong', '', stage.name), el('span', 'evo-hp', `${BASE_HP + i * HP_PER_STAGE} HP`), el('small', 'evo-when', WHEN[i]));
    return slide;
  }));
  const dots = starter.line.map((stage, i) => {
    const dot = el('button', 'evo-dot');
    dot.type = 'button';
    dot.setAttribute('aria-label', stage.name);
    dot.onclick = () => showForm(i);
    return dot;
  });
  $('evo-dots').replaceChildren(...dots);
  const current = () => Math.round(track.scrollLeft / track.clientWidth);
  const showForm = (i) => track.scrollTo({ left: Math.max(0, Math.min(dots.length - 1, i)) * track.clientWidth });
  const update = () => {
    const i = current();
    dots.forEach((dot, j) => dot.setAttribute('aria-current', String(i === j)));
    $('evo-prev').disabled = i === 0;
    $('evo-next').disabled = i === dots.length - 1;
  };
  $('evo-prev').onclick = () => showForm(current() - 1);
  $('evo-next').onclick = () => showForm(current() + 1);
  track.onscroll = update;
  track.onkeydown = (e) => {
    if (e.key === 'ArrowLeft') showForm(current() - 1);
    if (e.key === 'ArrowRight') showForm(current() + 1);
  };
  $('evo-note').textContent =
    `Evolves after you defeat the Biome 1 and Biome 2 bosses: +${HP_PER_STAGE} max HP, a full heal, ` +
    `and all your moves get ${STAGE_POWER * 100}% stronger.`;

  $('preview-count').textContent = `${starter.deck.length} cards`;
  fillDeck($('preview-deck'), starter.deck);

  level = getSave().maxLevel;    // start on your highest unlocked level
  renderLevel();
  $('level-down').onclick = () => { level = Math.max(0, level - 1); renderLevel(); };
  $('level-up').onclick = () => { level = Math.min(getSave().maxLevel, level + 1); renderLevel(); };

  $('preview-back').onclick = onBack;
  $('preview-begin').onclick = () => onBegin(level);
  showScreen('preview-screen');
  track.scrollLeft = 0;   // always start on the first form
  update();
}

/** Pop-up showing the deck you have right now in a run. */
export function showDeckDialog(run) {
  $('deck-dialog-count').textContent = `${run.deck.length} cards`;
  fillDeck($('deck-dialog-cards'), run.deck, run.stage);
  openDialog('deck-dialog');
}
