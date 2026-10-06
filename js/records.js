/* ============================================================
   records.js  -  the Collection device's Achievements app, made like
   its Relics and Items apps (shelfApp() in js/bagdex.js; the user's
   pick, 2026-10-06: one per screen). A banner per group of goals,
   then the red handheld: each goal's Pokémon (or prize) on the
   screen, a silhouette until earned, its goal typed out, its progress
   and its reward, and a gold UNLOCKED stamp once it's done.
   ============================================================ */

import { getSave } from './storage.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { ACHIEVEMENT_FOR, FEATS } from './data/achievements.js';
import { TYPES } from './data/cards.js';
import { DEX_PAGES, DEX_COMPLETE_COINS } from './data/pokedex.js';
import { researchCount, dexPerkLevel, isResearched, progressBar } from './pokedex.js';
import { shelfApp, thingArt, typed, typeChip } from './bagdex.js';
import { smoothIcon } from './smooth-icons.js';
import { el } from './ui.js';
import { playCry } from './audio.js';

const starterGoals = (...ids) => ids.map(id => ({ kind: 'starter', a: ACHIEVEMENT_FOR[id], starter: STARTERS_BY_ID[id] }));
const PERK_ICON = { 'moms-savings': 'cash', 'oaks-advice': 'cap' };

const GROUPS = [
  { id: 'skins', name: 'New Starters', sub: 'Six more partners', b1: '#f0a040', b2: '#8a4a10',
    goals: starterGoals('torchic', 'treecko', 'mudkip', 'chimchar', 'turtwig', 'piplup') },
  { id: 'levels', name: 'Trainer Levels', sub: 'Win on harder Levels', b1: '#5a8ef0', b2: '#24448a',
    goals: starterGoals('moltres', 'virizion', 'suicune', 'entei', 'celebi', 'kyogre') },
  { id: 'pokedex', name: 'Pokédex', sub: 'Fill every page', b1: '#e86a5a', b2: '#8a2a22',
    goals: [...starterGoals('hooh', 'lugia', 'palkia', 'reshiram'), ...DEX_PAGES.map(page => ({ kind: 'perk', page })), { kind: 'dexall' }] },
  { id: 'feats', name: 'Feats', sub: 'Tests of skill', b1: '#4ab070', b2: '#1a5a30',
    goals: starterGoals('victini', 'heatran', 'manaphy', 'keldeo', 'rayquaza') },
  { id: 'depths', name: 'Crystal Depths', sub: 'Beyond the Sealed Gate', b1: '#9a70e0', b2: '#3e2482',
    goals: [...starterGoals('mewtwo'), ...FEATS.map(f => ({ kind: 'feat', f }))],
    mask: () => (mewtwoFree() ? null : { name: '???', sub: 'Something sleeps behind the Sealed Gate.' }) },
].map(g => ({ ...g, list: () => g.goals }));
const ALL = GROUPS.flatMap(g => g.goals);

const mewtwoFree = () => getSave().unlocked.includes('mewtwo');

function earned(goal) {
  const save = getSave();
  if (goal.kind === 'starter') return save.unlocked.includes(goal.starter.id);
  if (goal.kind === 'perk') return save.dex.done.includes(goal.page.biome);
  if (goal.kind === 'dexall') return save.dex.complete;
  return save.feats.includes(goal.f.id);
}

/** A locked legendary (and Mewtwo's feats until it's free) stay a mystery (the user's call). */
function secret(goal, got) {
  if (got) return false;
  if (goal.kind === 'starter') return Boolean(goal.starter.legendary || goal.starter.secret);
  return goal.kind === 'feat' && goal.f.secret && !mewtwoFree();
}

function nameOf(goal, got) {
  if (secret(goal, got)) return '???';
  if (goal.kind === 'starter') return goal.starter.line[0].name;
  if (goal.kind === 'perk') return `${goal.page.perk.name}${dexPerkLevel(goal.page.perk.id) === 2 ? ' Lv 2' : ''}`;
  if (goal.kind === 'dexall') return 'Pokédex complete';
  return goal.f.name;
}

/** A Pokémon's sprite, or null for a prize drawn as an icon. */
function monSrc(goal) {
  if (goal.kind === 'starter') return spriteUrl(goal.starter, 'front');
  if (goal.kind === 'feat') return goal.f.shiny ? spriteUrl(STARTERS_BY_ID[goal.f.shiny], 'front', 0, true) : goal.f.sprite;
  return null;
}

/** A prize's icon: the perk's item, or smooth vector art. */
function prizeArt(goal, cls) {
  const item = goal.kind === 'perk' && goal.page.perk.item;
  if (item) return thingArt({ id: dexPerkLevel(goal.page.perk.id) === 2 ? goal.page.perk.lv2.item : item, icon: '🧴' }, cls);
  const box = el('span', `${cls} ach-icon`);
  box.append(smoothIcon(goal.kind === 'dexall' ? 'dex' : PERK_ICON[goal.page.perk.id] ?? 'star'));
  return box;
}

function monImg(src, cls) {
  const img = el('img', `pixel ${cls}`);
  img.src = src;
  img.alt = '';
  img.draggable = false;
  return img;
}

/** The goal's progress so far, as an LCD line (with a bar when it counts up to something). */
function progressLine(goal) {
  const save = getSave();
  const box = (text, n, of) => {
    const line = el('div', 'pdx-lcd bdx-tally ach-progress');
    line.append(el('span', '', text), el('b', '', `${n}/${of}`), progressBar(n, of));
    return line;
  };
  if (goal.kind === 'perk') {
    const ids = goal.page.ids;
    return box('Beaten', ids.filter(id => save.dex.defeated.includes(id)).length, ids.length);
  }
  if (goal.kind === 'dexall') return box('Researched', ...researchCount());
  if (goal.kind === 'starter' && goal.a.progress) return typed('ach-count', goal.a.progress(save.stats, save));
  return null;
}

/** What it gives: an LCD box of reward lines. */
function rewardBox(goal, got) {
  const box = el('div', 'pdx-lcd bdx-terms ach-reward');
  const line = (label, text) => {
    const row = el('div', 'bdx-term');
    row.append(el('b', 'term-keyword', label), ` ${text}`);
    box.append(row);
  };
  if (goal.kind === 'starter') {
    const s = goal.starter;
    line('Reward', secret(goal, got) ? 'A legendary starter.' : `${s.line[0].name}, a ${TYPES[s.type].label} starter.`);
  } else if (goal.kind === 'perk') {
    const p = goal.page;
    const researched = p.ids.filter(isResearched).length;
    line('Beat all', p.perk.text);
    line('Research all', `${p.perk.lv2.text} (${researched}/${p.ids.length})`);
  } else if (goal.kind === 'dexall') {
    line('Reward', `${DEX_COMPLETE_COINS} PokéCoins.`);
  } else if (!secret(goal, got)) {
    if (goal.f.coins) line('Reward', `${goal.f.coins} PokéCoins.`);
    if (goal.f.shiny) line('Reward', 'Mewtwo\'s shiny colours. They can\'t be bought.');
  }
  return box.childElementCount ? box : null;
}

function goalText(goal, got) {
  if (goal.kind === 'starter') return `${goal.a.text}.`;
  if (goal.kind === 'perk') return `Beat every Pokémon on the ${goal.page.name} page of the Pokédex.`;
  if (goal.kind === 'dexall') return 'Complete the research of every Pokédex entry.';
  return secret(goal, got) ? 'Something sleeps behind the Sealed Gate.' : `${goal.f.text}.`;
}

/** The Achievements app for the Collection device (js/device.js). */
export const achievementsApp = shelfApp({
  groups: GROUPS,
  known: (g, goal) => earned(goal),
  no: (g, goal) => `No.${String(ALL.indexOf(goal) + 1).padStart(3, '0')}`,
  label: (g, goal, got) => nameOf(goal, got),
  art(g, goal, got, where) {
    const src = monSrc(goal);
    if (where === 'banner') return src ? monImg(src, `bdx-banner-mon${got ? '' : ' unseen'}`) : prizeArt(goal, `bdx-banner-thing${got ? '' : ' unseen'}`);
    return src ? monImg(src, 'pdx-slot-mon') : prizeArt(goal, 'bdx-slot-thing');
  },
  screenCls: (g, goal, got) => (got ? 'ach-got' : ''),
  screen(g, goal, got) {
    const src = monSrc(goal);
    const nodes = src ? [el('span', 'pdx-pad'), monImg(src, 'pdx-mon bdx-art')] : [el('span', 'bdx-glow'), prizeArt(goal, 'bdx-thing bdx-art')];
    if (got && goal.kind === 'starter') nodes.push(typeChip(goal.starter.type));
    if (got) nodes.push(el('span', 'ach-stamp', 'UNLOCKED'));
    else {
      const lock = el('span', 'pdx-role ach-lock');
      lock.append(smoothIcon('lock'), 'Locked');
      nodes.push(lock);
    }
    return nodes;
  },
  lines: (g, goal, got) => [typed(got ? '' : 'muted', goalText(goal, got)), got ? null : progressLine(goal), rewardBox(goal, got)].filter(Boolean),
  tally: (g, done) => (done ? '★ Every one unlocked' : 'Unlocked'),
  doneSub: 'All unlocked!',
  onShow(g, goal, got) {
    if (!got) return;
    if (goal.kind === 'starter') playCry(goal.starter.line[0].id);
    else if (goal.kind === 'feat') playCry(goal.f.cry);
  },
});
