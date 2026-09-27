/* ============================================================
   pokedex.js  -  the Pokédex window and its bookkeeping.

   A page per biome (data/pokedex.js). An entry is a dark "???"
   silhouette until you've fought that Pokémon (seen: its name, type
   and moves show), and complete once you've beaten it (defeated: a
   Poké Ball mark, its flavour text and weakness), like the games'
   seen / caught. Defeating every Pokémon on a page pays its PokéCoins
   once and turns on its perk for every run after.
   ============================================================ */

import { ENEMY_DEFS, eliteOf } from './data/enemies.js';
import { TYPES } from './data/cards.js';
import { DEX_PAGES, DEX_NUMBER } from './data/pokedex.js';
import { getSave, updateSave, markDex, awardCoins } from './storage.js';
import { $, el, openDialog } from './ui.js';

const ROLE_LABEL = { wild: 'Wild', elite: 'Alpha', boss: 'Boss' };
const MOVE_KIND = { attack: ['⚔️', 'Attack'], drain: ['🩸', 'Drain'], defend: ['🛡️', 'Block'], buff: ['💪', 'Buff'], status: ['🗂️', 'Status'] };

let page = 0;

const dexNo = (id) => `No.${String(DEX_NUMBER[id]).padStart(3, '0')}`;
const pageOf = (id) => DEX_PAGES.find(p => p.ids.includes(id));
const pageDone = (p, defeated) => p.ids.every(id => defeated.has(id));

/** True once the page holding this perk is complete (its reward is paid). */
export const hasDexPerk = (perkId) => DEX_PAGES.some(p => p.perk.id === perkId && getSave().dex.done.includes(p.biome));

/** Pick weight for a fight room's Pokémon: ones you haven't beaten yet come up twice as often. */
export const dexWeight = (id) => (getSave().dex.defeated.includes(id) ? 1 : 2);

/** A fight against this Pokémon began. */
export function dexSeen(id) {
  if (ENEMY_DEFS[id]) markDex('seen', id);
}

/**
 * This Pokémon was beaten. Returns the lines to tell: its data joining the Pokédex the first
 * time, and a finished page's PokéCoins and perk (paid here, once, however the run ends).
 */
export function dexDefeated(id) {
  if (!ENEMY_DEFS[id]) return [];
  markDex('seen', id);
  if (!markDex('defeated', id)) return [];
  const lines = [`${ENEMY_DEFS[id].name}'s data was added to the Pokédex!`];
  const p = pageOf(id);
  const save = getSave();
  if (p && !save.dex.done.includes(p.biome) && pageDone(p, new Set(save.dex.defeated))) {
    updateSave(d => { d.dex.done.push(p.biome); });
    const coins = awardCoins(p.perk.coins);
    lines.push(`The ${p.name} page is complete! +${coins} PokéCoins.`, `New perk: ${p.perk.name}. ${p.perk.text}`);
  }
  return lines;
}

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
  const tile = el('button', `dex-entry${known ? '' : ' locked'}${defeated.has(id) ? ' defeated' : ''}`);
  tile.type = 'button';
  tile.append(el('span', 'dex-no', dexNo(id)), sprite(def, 'dex-sprite'), el('strong', 'dex-name', known ? def.name : '???'));
  if (defeated.has(id)) tile.append(el('span', 'dex-mark pokeball'));
  tile.title = known ? `${def.name}: tap for its entry` : 'Not seen yet. Fight it in a run to fill this in.';
  tile.disabled = !known;
  if (known) tile.addEventListener('click', () => openEntry(id, role, defeated.has(id), tile));
  return tile;
}

function perkBox(p, count, done) {
  const box = el('div', `dex-perk${done ? ' earned' : ''}`);
  const icon = el('span', 'dex-perk-icon', p.perk.icon);
  const text = el('div', 'dex-perk-text');
  text.append(
    el('strong', '', `${done ? '' : '🔒 '}${p.perk.name}`),
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

function render() {
  const save = getSave();
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
  const all = DEX_PAGES.flatMap(q => q.ids);
  $('dex-total').textContent = `${all.filter(id => defeated.has(id)).length}/${all.length} · ${all.filter(id => seen.has(id)).length} seen`;
  for (const btn of document.querySelectorAll('.dex-tab')) {
    const on = Number(btn.dataset.page) === page;
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
  }
}

/** One entry blown up over the window, like a zoomed card: any tap or Escape closes it. */
function openEntry(id, role, defeated, from) {
  const base = ENEMY_DEFS[id];
  const def = role === 'elite' ? eliteOf(base) : base;
  const card = el('div', 'dex-detail');
  const head = el('div', 'dex-detail-head');
  const names = el('div', 'dex-detail-names');
  names.append(el('span', 'dex-no', dexNo(id)), el('strong', 'dex-detail-name', base.name), typeChip(base.type));
  head.append(sprite(base, 'dex-detail-sprite'), names);
  card.append(head);

  const facts = el('p', 'dex-detail-facts');
  const where = pageOf(id).name;
  facts.textContent = `${ROLE_LABEL[role]} · ${where}`;
  card.append(facts);
  if (defeated) {
    card.append(el('p', 'dex-detail-text', base.description));
    const weak = role === 'wild' && TYPES[base.type].losesTo;
    card.append(el('p', 'dex-detail-weak', weak
      ? `Weak to ${TYPES[weak].icon} ${TYPES[weak].label}. Resists ${TYPES[base.type].beats ? `${TYPES[TYPES[base.type].beats].icon} ${TYPES[TYPES[base.type].beats].label}` : 'nothing'}.`
      : role === 'wild' ? 'No weakness: Neutral both ways.' : 'Alphas and bosses ignore types in battle.'));
  } else {
    card.append(el('p', 'dex-detail-text muted', 'Defeat it to complete this entry.'));
  }
  const moves = el('ul', 'dex-moves');
  for (const m of def.moves) {
    const [icon, label] = MOVE_KIND[m.kind] || ['❓', m.kind];
    const li = el('li', `dex-move kind-${m.kind}`);
    li.append(el('span', 'dex-move-icon', icon), el('span', 'dex-move-name', m.name), el('small', '', label));
    moves.append(li);
  }
  card.append(el('h4', 'dex-moves-head', 'Moves, in order'), moves);

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
  tabs.replaceChildren(...DEX_PAGES.map((p, i) => {
    const btn = el('button', `index-tab dex-tab biome-${p.biome}`);
    btn.type = 'button';
    btn.dataset.page = String(i);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', 'dex-body');
    btn.append(el('span', 'index-tab-icon', ['🌳', '⛩️', '🌋'][i]), el('span', 'index-tab-label', p.name.split(' ').pop()));
    btn.addEventListener('click', () => pick(i));
    return btn;
  }));
  tabs.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    pick((page + step + DEX_PAGES.length) % DEX_PAGES.length, true);
  });
}

/** Opens on the given biome's page (the run's), else the last one looked at. */
export function openPokedex(biome) {
  if (Number.isInteger(biome) && DEX_PAGES[biome]) page = biome;
  render();
  openDialog('dex-dialog');
}
