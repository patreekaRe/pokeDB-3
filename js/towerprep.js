/* ============================================================
   towerprep.js  -  the Sky Pillar's window, between the title's Sky
   Pillar gem and a climb (js/data/tower.js, roadmap item 18): the week's
   climber, your floors, the rules, then Climb (the week's starter; its
   first try counts for the leaderboard) or Practice with a starter of
   your own. A plain window for now; part b paints the tower's lobby.
   ============================================================ */

import { towerWeekly, FLIGHT, GUARDIAN_HEAL, TOP_FLOOR, TOWER_BADGE_FLOORS } from './data/tower.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { isStarterUnlocked } from './progress.js';
import { getSave } from './storage.js';
import { openLeaderboard, towerTop } from './leaderboard.js';
import { playSound } from './audio.js';
import { $, el, openDialog, closeDialog } from './ui.js';

let actions = {};

const RULES = [
  ['🚪', 'Each floor, pick a door: a fight, an Alpha, a Mart, a Pokémon Center or a ❓ room.'],
  ['👹', `A guardian waits every ${FLIGHT} floors: beat it to evolve, heal ${Math.round(GUARDIAN_HEAL * 100)}% and climb on.`],
  ['📈', `The higher you go, the stronger they get. Rayquaza guards the top, floor ${TOP_FLOOR}: beat it to win the climb.`],
  ['🏆', 'The week\'s first climb, with the week\'s starter and no perks, goes on the leaderboard: highest floor, then for a summit fewer turns, then the faster climb. Climb again as often as you like.'],
  ['🗼', `Clear floor ${TOWER_BADGE_FLOORS.join(', ')} for the Tower Badges (any climb).`],
];

export function initTowerPrep(handlers) {
  actions = handlers;
  $('tower-go').addEventListener('click', () => { closeDialog('tower-dialog'); actions.onStart(null); });
  $('tower-board').addEventListener('click', () => openLeaderboard(0, 'tower'));
  $('tower-close').addEventListener('click', () => { playSound('cancel', 'confirm'); closeDialog('tower-dialog'); });
}

/** The lobby's plaque: the week's top climbers engraved in bronze, filled in once the board answers. */
async function engrave() {
  const list = $('tower-plaque-list');
  list.replaceChildren(el('li', 'tower-plaque-note', 'Engraving…'));
  const top = await towerTop(5);
  if (!top) { list.replaceChildren(el('li', 'tower-plaque-note', "The plaque can't be read right now.")); return; }
  if (!top.length) { list.replaceChildren(el('li', 'tower-plaque-note', 'No names yet this week. Be the first!')); return; }
  list.replaceChildren(...top.map((e, i) => {
    const li = el('li', `tower-plaque-row${e.mine ? ' mine' : ''}`);
    const img = el('img', 'pixel');
    const starter = STARTERS_BY_ID[e.starter];
    if (starter) { img.src = spriteUrl(starter, 'front', 0); img.alt = ''; }
    li.append(el('span', 'tower-plaque-rank', `${i + 1}`), img, el('span', 'tower-plaque-name', e.name), el('span', 'tower-plaque-floor', e.floor >= TOP_FLOOR ? `🏔️ ${e.turns}t` : `${e.floor}F`));
    li.title = `${e.name}: floor ${e.floor}, ${e.turns} turns`;
    return li;
  }));
}

export function openTowerPrep() {
  const weekly = towerWeekly();
  const t = getSave().tower;
  const thisWeek = t.week === weekly.week;
  const first = !(thisWeek && t.tries);
  $('tower-week').textContent = `Week of ${weekly.week}: the same tower for everyone until Monday.`;
  const mon = $('tower-mon');
  mon.src = spriteUrl(weekly.starter, 'front', 0);
  mon.alt = weekly.starter.line[0].name;
  $('tower-name').textContent = `This week's climber: ${weekly.starter.line[0].name}`;
  $('tower-best').textContent = `${first ? 'Your counted climb is ready.' : `Your counted climb: floor ${thisWeek ? t.best : 0}.`} Your best ever: floor ${t.bestEver || 0}.`;
  $('tower-go').querySelector('.pxb-i').textContent = first ? '🏆 Climb (counts)' : '🔁 Climb again';
  engrave();
  $('tower-rules').replaceChildren(...RULES.map(([icon, text]) => {
    const li = el('li', '');
    li.append(el('span', 'tower-rule-icon', icon), el('span', '', text));
    return li;
  }));
  // practice: any starter you own but Mewtwo (it would trivialise the climb)
  const picks = $('tower-picks');
  picks.replaceChildren(...STARTERS.filter(s => !s.secret && isStarterUnlocked(s)).map(starter => {
    const btn = el('button', `tower-pick type-${starter.type}`);
    btn.type = 'button';
    btn.title = `Practice with ${starter.line[0].name}`;
    const img = el('img', 'pixel');
    img.src = spriteUrl(starter, 'front', 0);
    img.alt = starter.line[0].name;
    btn.append(img);
    btn.addEventListener('click', () => { closeDialog('tower-dialog'); actions.onStart(starter); });
    return btn;
  }));
  openDialog('tower-dialog');
}
