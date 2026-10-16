/* ============================================================
   questlog.js  -  the Quests app for the Collection device (the user's ask, 2026-10-14: the quest board's window, and
   somewhere to check where every questline stands from anywhere). A cork board, kept simple (the user's ask, same day:
   "even more simple to understand"): one big note, DO THIS NEXT (a step ready to hand in first, else the first under
   way), saying what, how far along, where to find it and where to hand it in; then every quest as a one-line row, a tap
   opening its steps. The Clearing's quest board opens it, and so does the Pokédex's Quests app, in a run too. Shown only
   while the towns are on (townsOpen()).
   ============================================================ */

import { MATERIALS_BY_ID, satchelOf, satchelFlag } from './data/satchel.js';
import { RECIPES_BY_ID, FRIENDS, workshopOf, heartsOf, gifteeOf, HEARTS } from './data/workshop.js';
import { FRIEND_TOWN, favourOf, asking, currentFavour, favourText } from './data/favours.js';
import { TOWNS, RING, CLEARING, clearingLit, townState, currentRequest, requestText, requestBy, questOf, questStep, questDone, questProgress, greeterOf, stepText, stepHave, mended } from './data/towns.js';
import { GYM_BY_ID, spriteOf } from './data/gym.js';
import { BIOMES_BY_ID } from './data/enemies.js';
import { getSave } from './storage.js';
import { clearSatchelNews } from './satchel.js';
import { showBadgeNews } from './trainercard.js';
import { el } from './ui.js';

const LINES = [CLEARING, ...RING.map(t => TOWNS[t.id])].filter(t => questOf(t));
const GLOW = { clearing: '#c8a8ff', ...Object.fromEntries(RING.map(t => [t.id, t.glow])) };
const CHIP = { lit: 'Done ✓', ready: 'Ready!', on: 'Under way', quiet: 'Locked' };

/** How the Quests app's icon counts: questlines done of all of them. */
export function questCount(save = getSave()) {
  return `${LINES.filter(t => stateOf(t, save) === 'lit').length}/${LINES.length} done`;
}

/** Where a questline stands: 'lit', 'ready' (its step can be handed in), 'on', or 'quiet' (not started). */
function stateOf(town, save) {
  const st = townState(save, town.id);
  if (mended(st) || questDone(town, st)) return 'lit';
  const step = questStep(town, st);
  if (!step) return 'quiet';
  return satchelFlag() || stepHave(step, st, satchelOf(save)) >= step.n ? 'ready' : 'on';
}

const leaderOf = (town, st, save) => GYM_BY_ID[questStep(town, st)?.by ?? greeterOf(town, save) ?? Object.keys(town.leaders)[0]];
const biomeName = (town) => (town.home ? 'Whispering Clearing' : BIOMES_BY_ID[town.biome]?.name ?? town.name);
const named = (town, save) => (town.home || townState(save, town.id).quest || townState(save, town.id).met ? town.name : '???');

/** Where to hand a step in, in a few words: to its Gym Leader, at home (a "!" over their roof once it's ready). */
const handIn = (town, step) => (town.home ? 'Law and Britt, at the Nietos\' house in the Clearing.'
  : `${GYM_BY_ID[step.by]?.name ?? 'Its Gym Leader'}, at their house in ${town.name}.`);

/** Where a step's thing comes from, in a few words. */
function source(step, town, sat) {
  if (step.kind === 'track') return `Any run through the ${biomeName(town)}.`;
  if (step.kind === 'gather') {
    const m = MATERIALS_BY_ID[step.item], biome = BIOMES_BY_ID[m.biome]?.name ?? biomeName(town);
    return m.from === 'map' ? `Sparkling rooms on the ${biome}'s map.` : `Wild Pokémon in the ${biome} drop it. Sparkling rooms too.`;
  }
  if (step.kind === 'craft') {
    const r = RECIPES_BY_ID[step.key];
    const needs = r ? Object.entries(r.needs).map(([id, n]) => `${MATERIALS_BY_ID[id].icon} ${Math.min(sat.mats[id] || 0, n)}/${n}`).join('  ') : '';
    return `Kurt's Workshop in the Clearing makes it.${needs ? ` He needs ${needs}` : ''}`;
  }
  return `A glowing Alpha on the ${biomeName(town)}'s map has it.`;
}

/** How to start a quest that hasn't. */
const unlock = (town, save) => (town.home ? 'Beat Law, Britt or the Nietos at the Whispering Clearing\'s Gym, then come home.'
  : clearingLit(save) ? `Beat a Gym Leader at the end of the ${BIOMES_BY_ID[town.biome]?.name}, then pass through the town.`
    : 'Finish the Nietos\' quest first.');

function sprite(leader, cls) {
  const img = el('img', `pixel ${cls}`);
  img.src = spriteOf(leader);
  img.alt = '';
  img.draggable = false;
  return img;
}

/** A labelled line: WHERE / HAND IN. */
function row(label, text) {
  const r = el('div', 'qlog-row');
  r.append(el('small', '', label), el('span', '', text));
  return r;
}

function bar(have, n) {
  const b = el('div', 'qlog-bar');
  const fill = el('span', 'qlog-fill');
  fill.style.width = `${Math.round((have / n) * 100)}%`;
  b.append(fill, el('b', 'qlog-bar-n', n > 1 ? `${have} / ${n}` : have ? 'Got it!' : 'Not yet'));
  return b;
}

/** What to do for a quest's step up now: the step, its bar, where to find it (until it's had), where it goes. */
function stepCard(town, save, sat) {
  const st = townState(save, town.id), step = questStep(town, st), ready = stateOf(town, save) === 'ready';
  const box = el('div', `qlog-do${ready ? ' ready' : ''}`);
  box.append(el('p', 'qlog-step', `${stepText(step)}.`), bar(satchelFlag() ? step.n : stepHave(step, st, sat), step.n));
  if (!ready) box.append(row('WHERE', source(step, town, sat)));
  box.append(row(ready ? 'READY! HAND IT IN' : 'THEN HAND IN', handIn(town, step)));
  return box;
}

/** A done town's coin request up now (its board's old jobs), taken by its leaders by turns at home. */
function requestCard(town, st) {
  const r = currentRequest(town, st), by = GYM_BY_ID[requestBy(town, st)];
  const box = el('div', `qlog-do${st.ready ? ' ready' : ''}`);
  box.append(el('p', 'qlog-step', `Odd job: ${requestText(r)}.`), bar(st.ready ? r.n : Math.min(st.got || 0, r.n), r.n),
    row(st.ready ? 'READY! HAND IT IN' : 'THEN HAND IN', `${by?.name ?? 'Its Gym Leader'}, at their house in ${town.name}.`));
  return box;
}

/** `?hearts=N` on a playtest: every friend at N hearts. */
const heartsPeek = () => { const n = new URLSearchParams(location.search).get('hearts'); return n === null ? null : Math.max(0, Math.min(HEARTS, +n || 0)); };

/** The requests friends at 3+ hearts have pinned up (js/data/favours.js), each handed in to them at home. */
function friendCards(save) {
  const ws = workshopOf(save), peek = heartsPeek();
  return FRIENDS.filter(id => asking(id, peek ?? heartsOf(ws, id))).map(id => {
    const fs = favourOf(save, id), f = currentFavour(id, fs), ready = fs.ready || (peek !== null && satchelFlag());
    const place = FRIEND_TOWN[id] === 'clearing' ? CLEARING : TOWNS[FRIEND_TOWN[id]], who = gifteeOf(id, GYM_BY_ID[id].name);
    const card = el('article', 'qlog-ask');
    card.style.setProperty('--glow', GLOW[place.id] ?? '#ffd858');
    const head = el('div', 'qlog-who');
    head.append(sprite(GYM_BY_ID[id], 'qlog-mon'), el('span', '', `${who} ${id === 'nietos' ? 'ask' : 'asks'}:`));
    const box = el('div', `qlog-do${ready ? ' ready' : ''}`);
    box.append(el('p', 'qlog-step', `${favourText(f)}.`), bar(ready ? f.n : Math.min(fs.got, f.n), f.n),
      row(ready ? 'READY! HAND IT IN' : 'THEN HAND IN', place.home ? 'Law and Britt, at the Nietos\' house in the Clearing.' : `${who}, at their house in ${place.name}.`));
    card.append(head, el('p', 'qlog-note', `"${f.note}"`), box);
    return card;
  });
}

/** Every step of a quest: done ones ticked, the one up now marked, later ones hidden. */
function stepList(town, st) {
  const list = el('ol', 'qlog-steps');
  const at = st.quest?.step ?? 0;
  questOf(town).steps.forEach((step, i) => {
    const li = el('li', i < at ? 'done' : i === at ? 'now' : 'later');
    li.append(el('b', '', i < at ? '✓' : i === at ? '▶' : '·'), el('span', '', i <= at ? stepText(step) : '???'));
    list.append(li);
  });
  return list;
}

/** The big note on top: the one thing to do next. */
function nextNote(save, sat) {
  const states = LINES.map(t => [t, stateOf(t, save)]);
  const [town, state] = states.find(([, s]) => s === 'ready') ?? states.find(([, s]) => s === 'on') ?? [];
  const card = el('article', 'qlog-next');
  card.style.setProperty('--glow', GLOW[town?.id] ?? '#ffd858');
  card.append(el('span', 'qlog-pin'), el('strong', 'qlog-kicker', state === 'ready' ? '★ Ready to hand in' : 'Do this next'));
  if (!town) {
    const done = states.every(([, s]) => s === 'lit');
    card.append(el('p', 'qlog-step', done ? 'Every quest is done. Every Waystone is lit!' : 'No quest yet.'));
    if (!done) card.append(row('HOW TO START', unlock(states.find(([, s]) => s === 'quiet')[0], save)));
    return card;
  }
  const st = townState(save, town.id), who = el('div', 'qlog-who');
  who.append(sprite(leaderOf(town, st, save), 'qlog-mon'), el('span', '', `${town.name}'s quest · step ${questProgress(town, st)[0] + 1} of ${questProgress(town, st)[1]}`));
  card.append(who, stepCard(town, save, sat));
  return card;
}

/** A quest as one line: who, its name, how far, its state; a tap opens what's left. */
function questRow(town, save, sat) {
  const st = townState(save, town.id), state = stateOf(town, save), [n, of] = questProgress(town, st);
  const item = el('article', `qlog-item ${state}`);
  item.style.setProperty('--glow', GLOW[town.id] ?? '#ffd858');
  const head = el('button', 'qlog-head');
  head.type = 'button';
  head.setAttribute('aria-expanded', 'false');
  const name = el('span', 'qlog-name');
  name.append(el('strong', '', named(town, save)), el('small', '', state === 'quiet' ? 'Not started' : `${n} of ${of} steps`));
  head.append(sprite(leaderOf(town, st, save), `qlog-mon${named(town, save) === '???' ? ' unseen' : ''}`), name, el('span', 'qlog-chip', CHIP[state]), el('span', 'qlog-caret', '▾'));
  const body = el('div', 'qlog-more');
  if (state === 'quiet') body.append(row('HOW TO START', unlock(town, save)));
  else {
    if (state !== 'lit') body.append(stepCard(town, save, sat));
    else if (town.requests && st.quest) body.append(requestCard(town, st));
    body.append(el('p', 'qlog-story', questOf(town).story), stepList(town, st));
  }
  head.addEventListener('click', () => head.setAttribute('aria-expanded', String(item.classList.toggle('open'))));
  item.append(head, body);
  return item;
}

/** The Quests app: `at` is 'board' when a quest board opened it, which says where else it's kept; a `?town=` playtest's
    board passes `{ board: true, peek: { <town>: state } }`, its questline kept on the run, never the save. */
export const questLogApp = {
  mount(panel, at) {
    const real = getSave(), save = at?.peek ? { ...real, towns: { ...(real.towns || {}), ...at.peek } } : real, sat = satchelOf(save);
    panel.classList.add('qlog');
    const done = LINES.filter(t => stateOf(t, save) === 'lit');
    const gems = el('div', 'qlog-gems');
    gems.append(...LINES.map(t => {
      const g = el('span', done.includes(t) ? 'lit' : '');
      g.style.setProperty('--glow', GLOW[t.id]);
      return g;
    }));
    const top = el('header', 'qlog-top');
    top.append(gems, el('small', 'qlog-sub', `${done.length} of ${LINES.length} quests done`));
    const list = el('div', 'qlog-list');
    list.append(...LINES.map(t => questRow(t, save, sat)));
    panel.append(top, nextNote(save, sat));
    const asks = friendCards(save);
    if (asks.length) {
      const pinned = el('div', 'qlog-list');
      pinned.append(...asks);
      panel.append(el('h3', 'qlog-label', 'Friends\' requests'), pinned);
    }
    panel.append(el('h3', 'qlog-label', 'All quests'), list);
    if (at === 'board' || at?.board) panel.append(el('p', 'qlog-tip', 'Check this any time: Pokédex → Quests.'));
    clearSatchelNews(LINES.map(t => `q:${t.id}`));
    showBadgeNews();
  },
  back: () => false,
  key: () => false,
  unmount() {},
};
