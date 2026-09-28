/* ============================================================
   records.js  -  the Stats and Achievements windows, opened from the
   Poké Ball menu. Both are rebuilt from the save every time they open,
   so they're always current.
   ============================================================ */

import { getSave, loadRunData } from './storage.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { ALL_CARDS, TYPES } from './data/cards.js';
import { RELICS } from './data/relics.js';
import { ITEMS } from './data/items.js';
import { BIOMES } from './data/enemies.js';
import { MAX_LEVEL } from './data/difficulty.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { DEX_PAGES, DEX_COMPLETE_COINS } from './data/pokedex.js';
import { researchCount } from './pokedex.js';
import { $, el, openDialog } from './ui.js';

const tile = ([icon, value, label, note]) => {
  const node = el('div', 'stat-tile');
  node.append(el('span', 'stat-icon', icon), el('b', 'stat-value', String(value)), el('span', 'stat-label', label));
  if (note) node.append(el('small', 'stat-note', note));
  return node;
};
const grid = (tiles) => {
  const node = el('div', 'stat-grid');
  node.append(...tiles.map(tile));
  return node;
};
/** A collection row: icon, what, a bar and n/total. */
const progress = ([icon, label, n, total]) => {
  const row = el('div', 'stat-row');
  const bar = el('span', 'stat-bar');
  const fill = el('i');
  fill.style.width = `${total ? (n / total) * 100 : 0}%`;
  bar.append(fill);
  row.append(el('span', 'stat-row-icon', icon), el('span', 'stat-row-label', label), bar, el('b', '', `${n}/${total}`));
  return row;
};

/** Every number that means something, in sections: runs, battles, collection, coins (the user's call, 2026-09-28). */
export function openStats() {
  const save = getSave();
  const s = save.stats;
  const inRun = loadRunData() ? 1 : 0;
  const lost = Math.max(0, s.runsStarted - s.runsWon - inRun);
  const winRate = s.runsStarted ? `${Math.round((s.runsWon / Math.max(1, s.runsStarted - inRun)) * 100)}% win rate` : 'no runs yet';
  const bestLevel = Math.max(...Object.values(s.maxLevelWinByType));
  const winsOf = (type) => STARTERS.filter(st => st.type === type).reduce((n, st) => n + (s.winsBy[st.id] || 0), 0);
  const owned = STARTERS.filter(st => st.free || save.unlocked.includes(st.id)).length;
  const shinyable = STARTERS.filter(st => !st.secret).length;
  const [researched, entries] = researchCount();
  const seenCards = new Set(save.seen.cards);

  const runs = grid([
    ['🏆', s.runsWon, 'Runs won', winRate],
    ['💀', lost, 'Runs lost', inRun ? '+1 in progress' : ''],
    ['⭐', bestLevel >= 0 ? bestLevel : '-', 'Best level won', `Unlocked: ${save.maxLevel}/${MAX_LEVEL}`],
    ...['fire', 'grass', 'water'].map(type => [TYPES[type].icon, winsOf(type), `${TYPES[type].label} wins`,
      s.maxLevelWinByType[type] >= 0 ? `best: Level ${s.maxLevelWinByType[type]}` : '']),
  ]);
  const furthest = s.deepestBiome ? BIOMES[s.deepestBiome - 1].name : 'not yet';
  const battles = grid([
    ['⚔️', s.enemiesDefeated, 'Pokémon defeated'],
    ['👑', s.elitesDefeated, 'Alphas defeated', 'counted since 28 Sep 2026'],
    ['🗺️', s.deepestBiome ? `${s.deepestBiome}/3` : '-', 'Furthest biome', furthest],
    ...BIOMES.map((biome, i) => ['👹', `×${s.bossKills[i + 1] || 0}`, `${biome.name.split(' ').pop()} boss`, 'times beaten']),
  ]);
  const collection = el('div', 'stat-rows');
  collection.append(...[
    ['🔓', 'Starters', owned, STARTERS.length],
    ['✨', 'Shinies', save.shiny.owned.length, shinyable],
    ['📕', 'Pokédex defeated', save.dex.defeated.length, entries],
    ['⭐', 'Research complete', researched, entries],
    ['🃏', 'Moves found', ALL_CARDS.filter(c => seenCards.has(c.id)).length, ALL_CARDS.length],
    ['💎', 'Relics found', save.seen.relics.length, RELICS.length],
    ['🧴', 'Items found', save.seen.items.length, ITEMS.length],
  ].map(progress));
  const coins = grid([
    ['💰', save.coins, 'PokéCoins now'],
    ['💰', s.coinsEarned, 'Earned in all', 'counted since 28 Sep 2026'],
    ['🌊', s.maxTide, 'Most Tide held'],
  ]);

  const champions = STARTERS.filter(st => (s.winsBy[st.id] || 0) > 0).map(st => {
    const node = el('div', 'champion');
    const img = el('img', 'pixel');
    img.src = spriteUrl(st, 'front');
    img.alt = st.line[0].name;
    node.append(img, el('span', '', `×${s.winsBy[st.id]}`));
    node.title = `${st.line[0].name}: ${s.winsBy[st.id]} win${s.winsBy[st.id] > 1 ? 's' : ''}`;
    return node;
  });

  const label = (text) => el('h3', 'records-label', text);
  const champs = champions.length ? el('div', 'champions') : el('p', 'records-empty', 'Win a run and your champions show up here.');
  if (champions.length) champs.append(...champions);
  $('stats-body').replaceChildren(
    label('Runs'), runs,
    label('Battles'), battles,
    label('Collection'), collection,
    label('PokéCoins & records'), coins,
    label('Wins by starter'), champs,
  );
  openDialog('stats-dialog');
}

export function openAchievements() {
  const unlocked = new Set(getSave().unlocked);
  const done = ACHIEVEMENTS.filter(a => unlocked.has(a.starter)).length;

  const header = el('div', 'ach-progress');
  const bar = el('div', 'ach-bar');
  const fill = el('div', 'ach-fill');
  fill.style.width = `${(done / ACHIEVEMENTS.length) * 100}%`;
  bar.append(fill);
  header.append(el('b', '', `${done} / ${ACHIEVEMENTS.length}`), bar);

  const list = el('div', 'ach-list');
  for (const a of ACHIEVEMENTS) {
    const starter = STARTERS_BY_ID[a.starter];
    const got = unlocked.has(a.starter);
    const row = el('div', `ach${got ? ' done' : ''}`);
    const img = el('img', 'pixel');
    img.src = spriteUrl(starter, 'front');
    img.alt = '';
    const text = el('div', 'ach-text');
    const hidden = !got && (starter.legendary || starter.secret);   // a locked legendary stays a mystery (the user's call)
    text.append(el('strong', '', hidden ? '???' : starter.line[0].name), el('span', '', a.text));
    row.append(img, text, el('span', 'ach-status', got ? '' : '🔒'));
    if (got) row.lastChild.append(el('span', 'pokeball'));
    list.append(row);
  }

  // the Pokédex's page rewards: a perk each rather than a starter
  const dex = el('div', 'ach-list');
  for (const p of DEX_PAGES) {
    const got = getSave().dex.done.includes(p.biome);
    const row = el('div', `ach dex-ach${got ? ' done' : ''}`);
    const text = el('div', 'ach-text');
    text.append(el('strong', '', p.perk.name), el('span', '', `Complete the Pokédex's ${p.name} page: ${p.perk.text}`));
    row.append(el('span', 'dex-ach-icon', p.perk.icon), text, el('span', 'ach-status', got ? '' : '🔒'));
    if (got) row.lastChild.append(el('span', 'pokeball'));
    dex.append(row);
  }
  {
    const got = getSave().dex.complete;
    const [n, total] = researchCount();
    const row = el('div', `ach dex-ach${got ? ' done' : ''}`);
    const text = el('div', 'ach-text');
    text.append(el('strong', '', 'Pokédex complete'),
      el('span', '', `Complete every entry's research (${n}/${total}): +${DEX_COMPLETE_COINS} PokéCoins.`));
    row.append(el('span', 'dex-ach-icon', '📕'), text, el('span', 'ach-status', got ? '' : '🔒'));
    if (got) row.lastChild.append(el('span', 'pokeball'));
    dex.append(row);
  }

  $('achievements-body').replaceChildren(header, list, el('h3', 'records-label', 'Pokédex pages'), dex);
  openDialog('achievements-dialog');
}
