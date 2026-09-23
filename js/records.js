/* ============================================================
   records.js  -  the Stats and Achievements windows, opened from the
   Poké Ball menu. Both are rebuilt from the save every time they open,
   so they're always current.
   ============================================================ */

import { getSave } from './storage.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { $, el, openDialog } from './ui.js';

export function openStats() {
  const save = getSave();
  const s = save.stats;
  const winRate = s.runsStarted ? `${Math.round((s.runsWon / s.runsStarted) * 100)}% of ${s.runsStarted} runs` : 'no runs yet';

  const tiles = [
    ['🏆', s.runsWon, 'Runs won', winRate],
    ['⚔️', s.enemiesDefeated, 'Enemies defeated'],
    ['👑', `${Object.keys(s.bossesDefeated).length}/3`, 'Bosses beaten'],
    ['🔓', `${3 + save.unlocked.length}/${STARTERS.length}`, 'Starters unlocked'],
    ['⭐', save.maxLevel, 'Trainer Level'],
    ['💰', save.coins, 'PokéCoins'],
  ].map(([icon, value, label, note]) => {
    const tile = el('div', 'stat-tile');
    tile.append(el('span', 'stat-icon', icon), el('b', 'stat-value', String(value)), el('span', 'stat-label', label));
    if (note) tile.append(el('small', 'stat-note', note));
    return tile;
  });

  const champions = STARTERS.filter(st => (s.winsBy[st.id] || 0) > 0).map(st => {
    const node = el('div', 'champion');
    const img = el('img', 'pixel');
    img.src = spriteUrl(st, 'front');
    img.alt = st.line[0].name;
    node.append(img, el('span', '', `×${s.winsBy[st.id]}`));
    node.title = `${st.line[0].name}: ${s.winsBy[st.id]} win${s.winsBy[st.id] > 1 ? 's' : ''}`;
    return node;
  });

  $('stats-body').replaceChildren(
    el('div', 'stat-grid'),
    el('h3', 'records-label', 'Wins by starter'),
    champions.length ? el('div', 'champions') : el('p', 'records-empty', 'Win a run and your champions show up here.'),
  );
  $('stats-body').querySelector('.stat-grid').append(...tiles);
  $('stats-body').querySelector('.champions')?.append(...champions);
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
    text.append(el('strong', '', got || !starter.secret ? starter.line[0].name : '???'), el('span', '', a.text));
    row.append(img, text, el('span', 'ach-status', got ? '' : '🔒'));
    if (got) row.lastChild.append(el('span', 'pokeball'));
    row.title = got ? `Unlocked ${starter.line[0].name}` : `Locked: ${a.text}`;
    list.append(row);
  }

  $('achievements-body').replaceChildren(header, list);
  openDialog('achievements-dialog');
}
