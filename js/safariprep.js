/* ============================================================
   safariprep.js  -  the Safari Zone's prep window, between the title's
   Safari Zone gem and the run (docs/reference/safari.md): today's run,
   how the Safari works, your Poké Balls, and the doors to the Safari
   Pokédex, the leaderboard and the Game Corner, then Start.
   ============================================================ */

import { safariDaily, SAFARI_DEX_PAGES, SAFARI_AREA_COINS, RARE_BOOST, safariProgress } from './data/safari.js';
import { BALLS, CATCH_HP, RARE, ballWeek } from './data/balls.js';
import { spriteUrl } from './data/starters.js';
import { getSave } from './storage.js';
import { openSafariDex } from './safaridex.js';
import { openLeaderboard } from './leaderboard.js';
import { toggleShop } from './shop.js';
import { playSound } from './audio.js';
import { $, el, openDialog, closeDialog, itemSprite } from './ui.js';

let actions = {};
let backFromShop = false;   // the Game Corner is non-modal, so this window steps aside for it and comes back after

const RULES = [
  ['📅', 'One run a day, the same for everyone: same starter, areas, map and wild Pokémon.'],
  ['🔴', `Once a wild Pokémon's HP is red (below ${CATCH_HP * 100}%), throw a ball. A throw is your whole turn; if it breaks free, it attacks.`],
  ['🍓', 'Debuffs on it (Burn, Leech Seed, Weak, Sap) and Bait raise the odds. Bait makes it hit harder; Rock may scare it off.'],
  ['✦', `Rare spawns are harder to catch and run off after ${RARE.turns} turns.`],
  ['📖', 'A catch fills its Safari Pokédex entry and offers its signature card.'],
  ['🏆', 'The day\'s first try has no Game Corner perks and goes on the leaderboard. Replays keep your perks.'],
  ['💰', `Catch every Pokémon in an area: ${SAFARI_AREA_COINS} PokéCoins, and its rare spawns x${RARE_BOOST} on replays.`],
  ['🐉', 'Catch them all, every area: Rayquaza joins you.'],
];

export function initSafariPrep(handlers) {
  actions = handlers;
  $('sp-start').addEventListener('click', () => { closeDialog('safari-prep-dialog'); actions.onStart(); });
  $('sp-close').addEventListener('click', () => { playSound('cancel', 'confirm'); closeDialog('safari-prep-dialog'); });
  $('sp-dex').addEventListener('click', () => openSafariDex(safariDaily().areas[0].id));
  $('sp-board').addEventListener('click', () => openLeaderboard());
  $('sp-corner').addEventListener('click', () => {
    backFromShop = true;
    closeDialog('safari-prep-dialog');
    if (!$('shop-dialog').open) toggleShop('balls');
  });
  $('shop-dialog').addEventListener('close', () => {
    if (!backFromShop) return;
    backFromShop = false;
    openSafariPrep();
  });
  // a catch counted or a ball bought while the Pokédex or leaderboard was open on top shows when it closes
  for (const id of ['safari-dex-dialog', 'board-dialog']) $(id).addEventListener('close', () => { if ($('safari-prep-dialog').open) render(); });
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
  info.append(el('span', 'sp-kicker', `Today · ${daily.day}`), el('strong', 'sp-name', daily.starter.line[0].name), areas,
    el('span', `sp-try${first ? ' first' : ''}`, first ? '🏆 First try: it counts for the leaderboard.'
      : `Replay (try ${save.safari.tries + 1}): perks on, not on the leaderboard.`));
  $('sp-today').replaceChildren(mon, info);

  $('sp-rules').replaceChildren(...RULES.map(([icon, text]) => {
    const li = el('li');
    li.append(el('span', 'sp-rule-icon', icon), el('span', '', text));
    return li;
  }));

  const week = ballWeek();
  $('sp-balls').replaceChildren(...BALLS.map(ball => {
    const left = ball.free ? '∞' : ball.stock ? save.balls[ball.id] || 0
      : !save.balls.owned.includes(ball.id) ? 0 : save.balls.masterWeek === week ? 'used' : 1;
    const tile = el('div', `sp-ball${left === 0 ? ' none' : ''}`);
    tile.append(itemSprite(ball, 'sp-ball-icon'), el('span', 'sp-ball-name', ball.name.replace(' Ball', '')),
      el('b', 'sp-ball-left', left === 'used' ? 'next week' : typeof left === 'number' ? `×${left}` : left));
    tile.title = `${ball.name}: ${ball.text}`;
    return tile;
  }));
}
