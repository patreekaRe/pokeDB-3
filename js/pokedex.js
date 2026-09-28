/* ============================================================
   pokedex.js  -  the Pokédex window and its bookkeeping.

   A page per biome (data/pokedex.js). An entry is a dark "???"
   silhouette until you've fought that Pokémon (seen: its picture, name
   and biome), and gets a Poké Ball mark once you've beaten it, like the
   games' seen / caught. Defeating every Pokémon on a page pays its
   PokéCoins once and turns on its perk for every run after. Each entry
   counts its defeats (research, Legends: Arceus-style): at its goal it's
   Research complete, with a gold mark, and only then shows its type,
   role, flavour text, weakness, HP and moves with their numbers.
   ============================================================ */

import { ENEMY_DEFS, eliteOf, buildEncounter, BIOMES } from './data/enemies.js';
import { TYPES, CARDS_BY_ID } from './data/cards.js';
import { modsFor } from './data/difficulty.js';
import { DEX_PAGES, DEX_NUMBER, RESEARCH_GOAL, RESEARCH_COINS, DEX_COMPLETE_COINS, SCOPE } from './data/pokedex.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave, updateSave, markDex, countDex, awardCoins } from './storage.js';
import { $, el, openDialog, itemSprite } from './ui.js';

const ROLE_LABEL = { wild: 'Wild', elite: 'Alpha', boss: 'Boss' };
const MOVE_KIND = { attack: ['⚔️', 'Attack'], drain: ['🩸', 'Drain'], defend: ['🛡️', 'Block'], buff: ['💪', 'Buff'], status: ['🗂️', 'Status'] };

let page = 0;

const dexNo = (id) => `No.${String(DEX_NUMBER[id]).padStart(3, '0')}`;
const pageOf = (id) => DEX_PAGES.find(p => p.ids.includes(id));
const pageDone = (p, defeated) => p.ids.every(id => defeated.has(id));
const ALL_IDS = DEX_PAGES.flatMap(p => p.ids);
const roleOf = (id) => pageOf(id).role[id];
const goalOf = (id) => RESEARCH_GOAL[roleOf(id)];
const defeats = (id) => getSave().dex.count[id] || 0;
const researched = (id) => defeats(id) >= goalOf(id);

/** True once the page holding this perk is complete (its reward is paid). */
export const hasDexPerk = (perkId) => DEX_PAGES.some(p => p.perk.id === perkId && getSave().dex.done.includes(p.biome));

/** Pick weight for a fight room's Pokémon: ones you haven't beaten yet come up twice as often. */
export const dexWeight = (id) => (getSave().dex.defeated.includes(id) ? 1 : 2);

/** A fight against this Pokémon began. */
export function dexSeen(id) {
  if (ENEMY_DEFS[id]) markDex('seen', id);
}

/**
 * This Pokémon was beaten. Returns `{ lines, complete }`: the lines to tell (its data joining the
 * Pokédex the first time, its research count, a finished page's PokéCoins and perk, research and
 * whole-dex bonuses, all paid here, once, however the run ends) and whether this finished the Pokédex.
 */
export function dexDefeated(id) {
  if (!ENEMY_DEFS[id] || !pageOf(id)) return { lines: [], complete: false };
  const name = ENEMY_DEFS[id].name;
  const lines = [];
  markDex('seen', id);
  if (markDex('defeated', id)) lines.push(`${name}'s data was added to the Pokédex!`);

  const goal = goalOf(id);
  const n = countDex(id);
  if (n < goal) lines.push(`${name} defeated ${n}/${goal}.`);
  else if (n === goal) {
    const coins = awardCoins(RESEARCH_COINS[roleOf(id)]);
    lines.push(`${name} defeated ${n}/${goal}: Research complete! +${coins} PokéCoins.`);
  }

  const p = pageOf(id);
  const save = getSave();
  if (!save.dex.done.includes(p.biome) && pageDone(p, new Set(save.dex.defeated))) {
    updateSave(d => { d.dex.done.push(p.biome); });
    const coins = awardCoins(p.perk.coins);
    lines.push(`The ${p.name} page is complete! +${coins} PokéCoins.`, `New perk: ${p.perk.name}. ${p.perk.text}`);
  }
  let complete = false;
  if (!save.dex.complete && ALL_IDS.every(researched)) {
    updateSave(d => { d.dex.complete = true; });
    const coins = awardCoins(DEX_COMPLETE_COINS);
    lines.push(`Pokédex complete! Every entry's research is done. +${coins} PokéCoins!`, `New on the map: the ${SCOPE.name}. ${SCOPE.text}`);
    complete = true;
  }
  return { lines, complete };
}

/** How many entries' research is complete, of how many. */
export const researchCount = () => [ALL_IDS.filter(researched).length, ALL_IDS.length];

/* ---------- the window ---------- */

function sprite(def, className) {
  const img = el('img', `pixel ${className}`);
  img.src = def.image;
  img.alt = '';
  img.draggable = false;
  return img;
}

function typeChip(type) {
  return el('span', `index-only type-${type}`, `${TYPES[type].icon} ${TYPES[type].label}`);
}

function entryTile(id, role, seen, defeated) {
  const def = ENEMY_DEFS[id];
  const known = seen.has(id);
  const done = researched(id);
  const tile = el('button', `dex-entry${known ? '' : ' locked'}${defeated.has(id) ? ' defeated' : ''}${done ? ' researched' : ''}`);
  tile.type = 'button';
  tile.append(el('span', 'dex-no', dexNo(id)), sprite(def, 'dex-sprite'), el('strong', 'dex-name', known ? def.name : '???'));
  if (defeated.has(id)) {
    tile.append(el('span', `dex-mark pokeball${done ? ' gold' : ''}`));
    tile.append(el('span', 'dex-research', done ? '★ Research' : `${defeats(id)}/${goalOf(id)}`));
  }
  tile.title = !known ? 'Not seen yet. Fight it in a run to fill this in.'
    : done ? `${def.name}: Research complete. Tap for its entry` : `${def.name}: defeated ${defeats(id)}/${goalOf(id)}. Tap for its entry`;
  tile.disabled = !known;
  if (known) tile.addEventListener('click', () => openEntry(id, role, tile));
  return tile;
}

function perkBox(p, count, done, pageName) {
  const box = el('div', `dex-perk${done ? ' earned' : ''}`);
  const icon = el('span', 'dex-perk-icon', p.perk.icon);
  const text = el('div', 'dex-perk-text');
  text.append(
    el('strong', '', `${done ? '' : '🔒 '}${pageName ? `${pageName} page: ` : ''}${p.perk.name}`),
    el('span', '', p.perk.text),
    el('small', '', done ? 'Earned: on for every run.' : `Defeat all ${p.ids.length} to earn it, plus 💰 ${p.perk.coins}.`),
  );
  const bar = el('div', 'ach-bar dex-bar');
  const fill = el('div', 'ach-fill');
  fill.style.width = `${(count / p.ids.length) * 100}%`;
  bar.append(fill);
  text.append(bar);
  box.append(icon, text, el('b', 'dex-perk-count', `${count}/${p.ids.length}`));
  return box;
}

/* The Rewards tab (the user's call: what finishing the Pokédex pays should be easy to find): the jackpot, research and
   each page's perk, with how far along you are. */
const REWARDS = DEX_PAGES.length;

function prize(art, name, text) {
  const row = el('div', 'dex-prize');
  row.append(art, el('span', 'dex-prize-text'));
  row.lastChild.append(el('b', '', name), text ? ` · ${text}` : '');
  return row;
}

function progressBar(n, of) {
  const bar = el('div', 'ach-bar dex-bar');
  const fill = el('div', 'ach-fill');
  fill.style.width = `${(n / of) * 100}%`;
  bar.append(fill);
  return bar;
}

function renderRewards() {
  const save = getSave();
  const [done, all] = researchCount();
  const defeated = new Set(save.dex.defeated);
  const reshiram = STARTERS_BY_ID.reshiram;
  const img = el('img', 'pixel dex-prize-sprite');
  img.src = spriteUrl(reshiram, 'front', 0);
  img.alt = '';

  // one box per goal: what to do in a few words, the prizes as icon rows, and how far along you are
  const goal = (icon, title, how, prizes, n, of, earned, tip) => {
    const box = el('div', `dex-perk dex-goal${earned ? ' earned' : ''}`);
    const text = el('div', 'dex-perk-text');
    text.append(el('strong', '', `${earned ? '✅ ' : ''}${title}`), el('span', 'dex-goal-how', how), ...prizes, progressBar(n, of));
    box.append(el('span', 'dex-perk-icon', icon), text, el('b', 'dex-perk-count', `${n}/${of}`));
    box.title = tip;
    return box;
  };
  const coins = (n) => prize(el('span', 'dex-prize-icon', '💰'), `${n} PokéCoins`, '');

  const jackpot = goal('🏆', 'Complete the Pokédex', `Research all ${all} entries`, [
    coins(DEX_COMPLETE_COINS),
    prize(img, reshiram.line[0].name, 'New starter'),
    prize(itemSprite(SCOPE, 'dex-prize-icon'), SCOPE.name, SCOPE.short),
  ], done, all, save.dex.complete, 'Research an entry by beating it 3 times (a boss twice).');
  jackpot.classList.add('dex-jackpot');

  // one row per kind, marked with its map room's icon rather than a word (the user's call)
  const pay = (icon, kind, n) => {
    const row = prize(el('span', 'dex-prize-icon', icon), `💰 ${n}`, '');
    row.title = `${kind}: ${n} PokéCoins`;
    return row;
  };
  const research = goal('★', 'Research', 'Beat a Pokémon 3× (bosses 2×) to complete its research. Each one pays once:', [
    pay('⚔️', 'Wild', RESEARCH_COINS.wild), pay('💀', 'Alpha', RESEARCH_COINS.elite), pay('👹', 'Boss', RESEARCH_COINS.boss),
  ], done, all, false, 'Each entry pays once.');

  const pages = DEX_PAGES.map(p => goal(p.perk.icon, `${p.name.split(' ').pop()} page`, `Beat all ${p.ids.length} once`, [
    coins(p.perk.coins),
    prize(el('span', 'dex-prize-icon', p.perk.icon), p.perk.name, p.perk.short),
  ], p.ids.filter(id => defeated.has(id)).length, p.ids.length, save.dex.done.includes(p.biome), `${p.perk.name}: ${p.perk.text}`));

  $('dex-body').replaceChildren(jackpot, research, ...pages);
}

function render() {
  const save = getSave();
  if (page === REWARDS) { renderRewards(); markTabs(); $('dex-dialog').scrollTop = 0; return; }
  const seen = new Set(save.dex.seen);
  const defeated = new Set(save.dex.defeated);
  const p = DEX_PAGES[page];
  const count = p.ids.filter(id => defeated.has(id)).length;
  const body = [perkBox(p, count, save.dex.done.includes(p.biome))];
  for (const role of ['wild', 'elite', 'boss']) {
    const ids = p.ids.filter(id => p.role[id] === role);
    const head = el('div', 'index-head');
    const title = el('h3', 'index-heading', { wild: 'Wild Pokémon', elite: 'Alphas', boss: 'Bosses' }[role]);
    title.append(el('span', 'index-count', `${ids.filter(id => defeated.has(id)).length}/${ids.length}`));
    head.append(title);
    body.push(head, ...ids.map(id => entryTile(id, role, seen, defeated)));
  }
  $('dex-body').replaceChildren(...body);
  $('dex-dialog').scrollTop = 0;
  const [done] = researchCount();
  $('dex-total').textContent = `${ALL_IDS.filter(id => defeated.has(id)).length}/${ALL_IDS.length} · ${ALL_IDS.filter(id => seen.has(id)).length} seen · ★${done}`;
  $('dex-total').title = `${ALL_IDS.filter(id => defeated.has(id)).length} defeated, ${ALL_IDS.filter(id => seen.has(id)).length} seen, ${done} with Research complete`;
  markTabs();
}

function markTabs() {
  for (const btn of document.querySelectorAll('.dex-tab')) {
    const on = Number(btn.dataset.page) === page;
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
  }
}

/** A move's numbers in a fight (Research complete): attacks carry the biome's extra damage. */
function moveNumbers(m, extra) {
  const junk = m.adds ? `${m.adds.n ?? 1} ${CARDS_BY_ID[m.adds.card]?.name ?? m.adds.card}` : '';
  const parts = {
    attack: () => [`${m.amount + extra} dmg`],
    drain: () => [`${m.amount + extra} dmg`, `heal ${m.heal}`],
    defend: () => [`+${m.amount} block`],
    buff: () => [`+${m.amount} strength`],
    status: () => [],
  }[m.kind]?.() ?? [];
  if (junk) parts.push(`+${junk}`);
  return parts.join(', ');
}

/** One entry blown up over the window, like a zoomed card: any tap or Escape closes it. */
function openEntry(id, role, from) {
  const base = ENEMY_DEFS[id];
  const def = role === 'elite' ? eliteOf(base) : base;
  const card = el('div', 'dex-detail');
  const head = el('div', 'dex-detail-head');
  const names = el('div', 'dex-detail-names');
  const done = researched(id);
  names.append(el('span', 'dex-no', dexNo(id)), el('strong', 'dex-detail-name', base.name), ...(done ? [typeChip(base.type)] : []));
  head.append(sprite(base, 'dex-detail-sprite'), names);
  card.append(head);

  // until its research is complete an entry shows only its picture and where it lives (the user's call): the rest is the prize
  const facts = el('p', 'dex-detail-facts');
  const where = pageOf(id).name;
  facts.textContent = done ? `${ROLE_LABEL[role]} · ${where}` : where;
  card.append(facts);
  card.append(el('p', `dex-detail-research${done ? ' done' : ''}`, done
    ? `★ Research complete (defeated ${defeats(id)})`
    : `Research: defeated ${defeats(id)}/${goalOf(id)}. At ${goalOf(id)} this entry reveals its type, moves and weakness.`));
  if (!done) return showEntry(card, from);
  const foe = buildEncounter(BIOMES.findIndex(b => b.id === pageOf(id).biome), role === 'wild' ? 'fight' : role, modsFor(0), id);
  if (foe) card.append(el('p', 'dex-detail-hp', `HP ${foe.maxHp} · numbers at Level 0, before types`));
  card.append(el('p', 'dex-detail-text', base.description));
  const weak = role === 'wild' && TYPES[base.type].losesTo;
  card.append(el('p', 'dex-detail-weak', weak
    ? `Weak to ${TYPES[weak].icon} ${TYPES[weak].label}. Resists ${TYPES[base.type].beats ? `${TYPES[TYPES[base.type].beats].icon} ${TYPES[TYPES[base.type].beats].label}` : 'nothing'}.`
    : role === 'wild' ? 'No weakness: Neutral both ways.' : 'Alphas and bosses ignore types in battle.'));
  const moves = el('ul', 'dex-moves');
  for (const m of def.moves) {
    const li = el('li', `dex-move kind-${m.kind}`);
    li.append(el('span', 'dex-move-icon', (MOVE_KIND[m.kind] || ['❓'])[0]), el('span', 'dex-move-name', m.name), el('small', '', moveNumbers(m, foe.strength)));
    moves.append(li);
  }
  card.append(el('h4', 'dex-moves-head', 'Moves, in order'), moves);
  showEntry(card, from);
}

function showEntry(card, from) {
  const layer = el('div', 'card-zoom dex-zoom');
  layer.append(card, el('p', 'focus-hint', 'Tap anywhere to close'));
  const close = () => {
    layer.remove();
    document.removeEventListener('keydown', onKey, true);
    from?.focus({ preventScroll: true });
  };
  const onKey = (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) { e.preventDefault(); e.stopPropagation(); close(); } };
  layer.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  $('dex-dialog').append(layer);
}

function pick(i, focus = false) {
  page = i;
  render();
  if (focus) document.querySelector(`.dex-tab[data-page="${i}"]`).focus();
}

export function initPokedex() {
  const tabs = $('dex-tabs');
  const tab = (i, className, icon, label) => {
    const btn = el('button', `index-tab dex-tab ${className}`);
    btn.type = 'button';
    btn.dataset.page = String(i);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', 'dex-body');
    btn.append(el('span', 'index-tab-icon', icon), el('span', 'index-tab-label', label));
    btn.addEventListener('click', () => pick(i));
    return btn;
  };
  tabs.replaceChildren(...DEX_PAGES.map((p, i) => tab(i, `biome-${p.biome}`, ['🌳', '⛩️', '🌋'][i], p.name.split(' ').pop())),
    tab(REWARDS, 'dex-rewards-tab', '🏆', 'Rewards'));
  tabs.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    pick((page + step + REWARDS + 1) % (REWARDS + 1), true);
  });
}

/** Opens on the given biome's page (the run's), else the last one looked at. */
export function openPokedex(biome) {
  if (Number.isInteger(biome) && DEX_PAGES[biome]) page = biome;
  render();
  openDialog('dex-dialog');
}
