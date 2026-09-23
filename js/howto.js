/* ============================================================
   howto.js  -  the "How to play" window: a row of slides you swipe
   through (native scroll-snap), with dots, arrows and arrow keys.
   The shop slide is filled from the real coin rewards and shop items,
   so it can't drift from the game.
   ============================================================ */

import { CARDS_BY_ID } from './data/cards.js';
import { PASSIVE_SHOP_ITEMS } from './data/shop.js';
import { COIN_REWARDS } from './run.js';
import { $, el, makeCard, openDialog, closeDialog } from './ui.js';

let slides = [];
let dots = [];

const track = () => $('howto-track');
const current = () => Math.round(track().scrollLeft / track().clientWidth);

function goTo(i, behavior = 'smooth') {
  const index = Math.max(0, Math.min(slides.length - 1, i));
  track().scrollTo({ left: index * track().clientWidth, behavior });
}

function update() {
  const i = current();
  dots.forEach((dot, j) => dot.setAttribute('aria-current', String(i === j)));
  $('howto-prev').disabled = i === 0;
  $('howto-next').textContent = i === slides.length - 1 ? "Let's go!" : 'Next ›';
}

/** A list row like the static ones in index.html: icon on the left, name and a short line beside it. */
const row = (nodeClass, icon, title, note) => {
  const box = el('div', 'howto-li');
  const text = el('span', 'howto-li-text');
  text.append(el('b', '', title), el('small', '', note));
  box.append(el('span', `howto-node ${nodeClass}`, icon), text);
  return box;
};

export function initHowto() {
  $('howto-card').append(makeCard(CARDS_BY_ID.ember, { stage: 0 }));   // a real card, so the guide always matches the game

  $('howto-coins').replaceChildren(
    row('', '⚔️', `+${COIN_REWARDS.fight} 💰`, 'Wild fight'),
    row('elite', '💀', `+${COIN_REWARDS.elite} 💰`, 'Elite'),
    row('boss', '👑', `+${COIN_REWARDS.boss} 💰`, 'Boss'),
    row('treasure', '🏆', `+${COIN_REWARDS.winBonus} 💰`, 'Full win'),
  );
  $('howto-perks').replaceChildren(
    row('', '🔓', 'New starters', 'Unlock new Pokémon to play as.'),
    ...PASSIVE_SHOP_ITEMS.map(perk => row('', perk.icon, perk.name, perk.text)),
  );

  slides = [...track().querySelectorAll('.howto-slide')];
  dots = slides.map((slide, i) => {
    const dot = el('button', 'howto-dot');
    dot.type = 'button';
    dot.setAttribute('aria-label', slide.dataset.title);
    dot.addEventListener('click', () => goTo(i));
    return dot;
  });
  $('howto-dots').replaceChildren(...dots);

  track().addEventListener('scroll', update, { passive: true });
  $('howto-prev').addEventListener('click', () => goTo(current() - 1));
  $('howto-next').addEventListener('click', () => {
    if (current() === slides.length - 1) closeDialog('help-dialog');
    else goTo(current() + 1);
  });
  $('help-dialog').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goTo(current() + 1);
    if (e.key === 'ArrowLeft') goTo(current() - 1);
  });
}

/** Open the guide on its first slide. */
export function openHowto() {
  openDialog('help-dialog');
  goTo(0, 'instant');   // after opening: a closed dialog has no width to scroll by
  update();
}
