/* ============================================================
   questlog.js  -  the Quests app for the Collection device (the user's ask, 2026-10-14: the quest board's window, and
   somewhere to check where every questline stands from anywhere). A cork board of pinned notes: how many Waystones are
   lit, then one note per questline (the Clearing's first): the step up now with how far along it is, where its things
   come from and where it's handed in; tap a note for every step. The Clearing's quest board opens it, and so does the
   Pokédex's Quests app, in a run too. Shown only while the towns are on (townsOpen()).
   ============================================================ */

import { MATERIALS_BY_ID, satchelOf, satchelFlag } from './data/satchel.js';
import { RECIPES_BY_ID } from './data/workshop.js';
import { TOWNS, RING, CLEARING, clearingLit, townState, questOf, questStep, questDone, questProgress, greeterOf, stepText, stepHave, mended } from './data/towns.js';
import { GYM_BY_ID, spriteOf } from './data/gym.js';
import { BIOMES_BY_ID } from './data/enemies.js';
import { getSave } from './storage.js';
import { clearSatchelNews } from './satchel.js';
import { showBadgeNews } from './trainercard.js';
import { el } from './ui.js';

const LINES = [CLEARING, ...RING.map(t => TOWNS[t.id])].filter(t => questOf(t));
const GLOW = { clearing: '#c8a8ff', ...Object.fromEntries(RING.map(t => [t.id, t.glow])) };

/** How the Quests app's icon counts: Waystones lit of every questline's. */
export function questCount(save = getSave()) {
  const lit = LINES.filter(t => mended(townState(save, t.id))).length;
  return `${lit}/${LINES.length} lit`;
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
const handIn = (town) => (town.home ? 'the Nietos\' house, in the Clearing' : `${town.name}'s quest board`);

/** Where a step's thing comes from. */
function source(step, town, sat) {
  if (step.kind === 'gather') {
    const m = MATERIALS_BY_ID[step.item];
    return `${m.icon} ${m.from === 'map' ? 'Glints in sparkling rooms' : 'Dropped by Pokémon and found in sparkling rooms'} in the ${BIOMES_BY_ID[m.biome]?.name ?? biomeName(town)}.`;
  }
  if (step.kind === 'craft') {
    const r = RECIPES_BY_ID[step.key];
    const needs = r ? Object.entries(r.needs).map(([id, n]) => `${MATERIALS_BY_ID[id].icon} ${Math.min(sat.mats[id] || 0, n)}/${n}`).join('  ') : '';
    return `Kurt's Workshop makes it, in the Clearing${needs ? `, from ${needs}` : ''}.`;
  }
  if (step.kind === 'shard') return `It glows over a marked Alpha on the ${biomeName(town)}'s map.`;
  return '';
}

function sprite(leader, cls) {
  const img = el('img', `pixel ${cls}`);
  img.src = spriteOf(leader);
  img.alt = '';
  img.draggable = false;
  return img;
}

/** The step up now, big: its words, a bar of how far along, where it comes from and where it goes. */
function upNow(town, st, step, ready, sat) {
  const box = el('div', `qlog-now${ready ? ' ready' : ''}`);
  const have = satchelFlag() ? step.n : stepHave(step, st, sat);
  const bar = el('div', 'qlog-bar');
  const fill = el('span', 'qlog-fill');
  fill.style.width = `${Math.round((have / step.n) * 100)}%`;
  bar.append(fill, el('b', 'qlog-bar-n', step.n > 1 ? `${have}/${step.n}` : have ? 'Got it!' : 'Not yet'));
  box.append(el('small', 'qlog-kicker', ready ? '★ Ready to hand in' : 'Up now'), el('p', 'qlog-step', `${stepText(step)}.`), bar);
  const from = source(step, town, sat);
  if (from && !ready) box.append(el('p', 'qlog-hint', from));
  box.append(el('p', 'qlog-hint qlog-where', `Hand it in at ${handIn(town)}${step.by && GYM_BY_ID[step.by] && !town.home ? `, to ${GYM_BY_ID[step.by].name}` : ''}.`));
  return box;
}

/** Every step: done ones ticked, the one up now marked, the rest unknown. */
function stepList(town, st) {
  const list = el('ol', 'qlog-steps');
  questOf(town).steps.forEach((step, i) => {
    const at = st.quest?.step ?? 0;
    const li = el('li', i < at ? 'done' : i === at ? 'now' : 'later');
    li.append(el('b', 'qlog-tick', i < at ? '✓' : i === at ? '▶' : '·'), el('span', '', i <= at ? stepText(step) : '???'));
    list.append(li);
  });
  return list;
}

/** One questline's pinned note. */
function note(town, save, sat, i) {
  const st = townState(save, town.id), state = stateOf(town, save), met = !!st.quest || town.home || st.met;
  const [n, of] = questProgress(town, st);
  const card = el('article', `qlog-note ${state}`);
  card.style.setProperty('--glow', GLOW[town.id] ?? '#ffd858');
  card.style.setProperty('--tilt', `${[-0.6, 0.5, -0.3, 0.7, -0.5, 0.4][i % 6]}deg`);
  const head = el('button', 'qlog-head');
  head.type = 'button';
  const name = el('span', 'qlog-name');
  name.append(el('strong', '', met ? town.name : '???'), el('small', '', state === 'quiet' ? 'Not started' : `${n}/${of} steps`));
  const chip = el('span', 'qlog-chip', { lit: 'Lit ✓', ready: 'Ready!', on: 'Under way', quiet: 'Locked' }[state]);
  head.append(el('span', 'qlog-pin'), sprite(leaderOf(town, st, save), `qlog-mon${met ? '' : ' unseen'}`), name, chip);
  const pips = el('div', 'qlog-pips');
  for (let k = 0; k < of; k++) pips.append(el('span', k < n ? 'on' : ''));
  card.append(head, pips);

  const body = el('div', 'qlog-body');
  if (state === 'quiet') {
    body.append(el('p', 'qlog-hint', town.home ? 'Beat the Nietos at the Whispering Clearing\'s Gym, then come home.'
      : clearingLit(save) ? `Beat one of ${met ? town.name : 'this town'}'s Gym Leaders at the end of the ${BIOMES_BY_ID[town.biome]?.name}, then pass through the town.`
        : 'The Whispering Clearing\'s Waystone comes first: the Nietos\' quest mends it.'));
  } else if (state === 'lit') {
    body.append(el('p', 'qlog-hint', `${town.home ? 'The Clearing\'s' : `${town.name}'s`} Waystone is whole again.`));
  } else {
    body.append(upNow(town, st, questStep(town, st), state === 'ready', sat));
  }
  card.append(body);
  if (state === 'quiet') { head.disabled = true; return card; }
  const more = el('div', 'qlog-more');
  more.append(el('p', 'qlog-story', questOf(town).story), stepList(town, st));
  const toggle = el('button', 'qlog-toggle', 'Every step ▾');
  toggle.type = 'button';
  const flip = () => { toggle.textContent = card.classList.toggle('open') ? 'Hide steps ▴' : 'Every step ▾'; };
  head.addEventListener('click', flip);
  toggle.addEventListener('click', flip);
  body.append(toggle, more);
  return card;
}

/** The Quests app: `at` is 'board' when the Clearing's quest board opened it, which says where else it's kept. */
export const questLogApp = {
  mount(panel, at) {
    const save = getSave(), sat = satchelOf(save);
    panel.classList.add('qlog');
    const lit = LINES.filter(t => mended(townState(save, t.id)));
    const top = el('header', 'qlog-top');
    const gems = el('div', 'qlog-gems');
    gems.append(...LINES.map(t => {
      const g = el('span', lit.includes(t) ? 'lit' : '');
      g.style.setProperty('--glow', GLOW[t.id]);
      return g;
    }));
    const left = LINES.length - lit.length;
    top.append(el('strong', 'qlog-title', 'Waystones'), gems,
      el('small', 'qlog-sub', left ? `${lit.length} of ${LINES.length} lit · ${left} quest${left === 1 ? '' : 's'} left` : '★ Every Waystone lit!'));
    const notes = el('div', 'qlog-notes');
    notes.append(...LINES.map((t, i) => note(t, save, sat, i)));
    panel.append(top, notes);
    if (at === 'board') panel.append(el('p', 'qlog-tip', 'This log is in your Pokédex too, under Quests, in a run as well.'));
    clearSatchelNews(LINES.map(t => `q:${t.id}`));
    showBadgeNews();
  },
  back: () => false,
  key: () => false,
  unmount() {},
};
