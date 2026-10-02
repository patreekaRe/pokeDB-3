/* ============================================================
   safariprep.js  -  the Safari Zone's prep window, between the title's
   Safari Zone gem and the run (docs/reference/safari.md): today's run,
   how the Safari works, your Poké Balls, and the doors to the Safari
   Pokédex, the leaderboard and the Game Corner, then Start.
   ============================================================ */

import { safariDaily, SAFARI_DEX_PAGES, SAFARI_AREA_COINS, RARE_BOOST, safariProgress } from './data/safari.js';
import { BALLS, CATCH_HP, RARE, ballWeek } from './data/balls.js';
import { CARDS_BY_ID } from './data/cards.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave } from './storage.js';
import { openSafariDex } from './safaridex.js';
import { openLeaderboard } from './leaderboard.js';
import { toggleShop } from './shop.js';
import { playSound } from './audio.js';
import { $, el, openDialog, closeDialog, itemSprite, makeCard, zoomable } from './ui.js';

let actions = {};

const ROCK_HIT = CARDS_BY_ID.rock.effects.damage;
const RULES = [
  ['🔄', 'One run a day, the same for everyone.'],
  ['🔴', `Once a wild Pokémon's HP bar turns red (below ${CATCH_HP * 100}%), throw a ball. It takes your turn.`],
  ['🎯', 'Debuffs on it raise the odds.'],
  ['🍙', 'Bait: better odds, but it hits harder. A card reward after fights, Safari runs only.', 'bait'],
  ['🧱', `Rock: ${ROCK_HIT} damage and Vulnerable, but it may run off. A card reward after fights, Safari runs only.`, 'rock'],
  ['💨', `Rare spawns flee after ${RARE.turns} turns.`],
  ['🃏', 'Each Pokémon you catch offers its own signature card for your deck.'],
  ['💰', `Catch a whole area: ${SAFARI_AREA_COINS} coins, x${RARE_BOOST} rare spawns.`],
];

export function initSafariPrep(handlers) {
  actions = handlers;
  $('sp-start').addEventListener('click', () => { closeDialog('safari-prep-dialog'); actions.onStart(); });
  $('sp-close').addEventListener('click', () => { playSound('cancel', 'confirm'); closeDialog('safari-prep-dialog'); });
  $('sp-dex').addEventListener('click', () => openSafariDex(safariDaily().areas[0].id));
  $('sp-board').addEventListener('click', () => openLeaderboard());
  // the Game Corner pops up over this window (modal, so it isn't hidden under it); its balls show here once it closes
  $('sp-corner').addEventListener('click', () => { if (!$('shop-dialog').open) toggleShop('balls', { modal: true }); });
  // a ball bought in the Game Corner, or anything changed in a window opened on top, shows once it closes
  for (const id of ['safari-dex-dialog', 'board-dialog', 'shop-dialog']) $(id).addEventListener('close', () => { if ($('safari-prep-dialog').open) render(); });
}

export function openSafariPrep() {
  render();
  openDialog('safari-prep-dialog');
}

function render() {
  const save = getSave();
  const daily = safariDaily();
  const first = save.safari.day !== daily.day || !save.safari.tries;

  const mon = el('img', 'pixel sp-mon');
  mon.src = spriteUrl(daily.starter, 'front', 0);
  mon.alt = '';
  const areas = el('div', 'sp-areas');
  daily.areas.forEach((area, i) => {
    const page = SAFARI_DEX_PAGES.find(p => p.area === area.id);
    const { caught } = safariProgress(page.ids, save.safariDex);
    const chip = el('span', `sp-area area-${area.id}`);
    chip.append(el('b', '', `${i + 1}. ${area.name}`), el('small', '', `${caught}/${page.ids.length}`));
    chip.title = `${area.name}: ${caught} of ${page.ids.length} caught`;
    areas.append(chip);
  });
  const info = el('div', 'sp-info');
  info.append(el('span', 'sp-kicker', `Today's starter · ${daily.day}`), el('strong', 'sp-name', daily.starter.line[0].name), areas,
    el('span', `sp-try${first ? ' first' : ''}`, first ? '🏆 First try: it counts!' : `Replay · try ${save.safari.tries + 1}`));
  $('sp-today').replaceChildren(mon, info);

  // the full Safari Pokédex's prize stays unnamed until it's won
  const prize = save.unlocked.includes('rayquaza') ? `Catch them all: ${STARTERS_BY_ID.rayquaza.line[0].name} joins you.`
    : 'Complete the Safari Pokédex: a new Legendary awaits you.';
  $('sp-rules').replaceChildren(...[...RULES, ['👑', prize]].map(([icon, text, cardId]) => {
    const li = el('li', cardId ? 'with-card' : '');
    li.append(el('span', 'sp-rule-icon', icon), el('span', '', text));
    if (cardId) {   // a Safari-only card: tap to read it big, with its keyword boxes
      const card = makeCard(CARDS_BY_ID[cardId]);
      card.classList.add('small', 'sp-card');
      zoomable(card, CARDS_BY_ID[cardId]);
      li.append(card);
    }
    return li;
  }));
  $('sp-replay').replaceChildren(el('strong', '', first ? 'After this first try, replay as often as you like' : 'Replay as often as you like'),
    el('span', '', 'Keep catching all day. Only the first try counts for the leaderboard; replays get your perks back.'));

  const week = ballWeek();
  $('sp-balls').replaceChildren(...BALLS.map(ball => {
    const left = ball.free ? '∞' : ball.stock ? save.balls[ball.id] || 0
      : !save.balls.owned.includes(ball.id) ? 0 : save.balls.masterWeek === week ? 0 : 1;
    const slot = el('div', `sp-ball${left === 0 ? ' none' : ''}`);
    slot.append(itemSprite(ball, 'sp-ball-icon'), el('b', `sp-ball-left${left === '∞' ? ' inf' : ''}`, typeof left === 'number' ? `×${left}` : left));
    slot.title = `${ball.name}: ${ball.text}`;
    slot.setAttribute('aria-label', `${ball.name}, ${left === '∞' ? 'always' : left} in your bag`);
    return slot;
  }));
}
