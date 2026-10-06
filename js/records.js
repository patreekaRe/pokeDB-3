/* ============================================================
   records.js  -  the Achievements window, opened from the Collection
   device (Stats is js/statsdex.js). Rebuilt from the save every time it
   opens, so it's always current.
   ============================================================ */

import { getSave } from './storage.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { ACHIEVEMENTS, FEATS } from './data/achievements.js';
import { DEX_PAGES, DEX_COMPLETE_COINS } from './data/pokedex.js';
import { researchCount, dexPerkLevel } from './pokedex.js';
import { $, el, openDialog, itemSprite } from './ui.js';

export function openAchievements(into = null) {
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
    if (!got && a.progress) text.append(el('span', 'ach-count', a.progress(getSave().stats, getSave())));
    row.append(img, text, el('span', 'ach-status', got ? '' : '🔒'));
    if (got) row.lastChild.append(el('span', 'pokeball'));
    list.append(row);
  }

  // the Pokédex's page rewards: a perk each rather than a starter
  const dex = el('div', 'ach-list');
  for (const p of DEX_PAGES) {
    const got = getSave().dex.done.includes(p.biome);
    const lv2 = dexPerkLevel(p.perk.id) === 2;
    const row = el('div', `ach dex-ach${got ? ' done' : ''}`);
    const text = el('div', 'ach-text');
    const gift = (how, level) => {
      const line = el('span', 'perk-line', how);
      const chip = el('span', 'perk-gift');
      chip.append(level.item ? itemSprite({ id: level.item, icon: '🧴' }, 'perk-gift-icon') : el('span', 'perk-gift-icon', p.perk.icon),
        el('span', '', level.gift));
      line.append(chip);
      return line;
    };
    text.append(el('strong', '', `${p.perk.name}${lv2 ? ' Lv 2' : ''}`), el('span', 'perk-where', `${p.name} · ${p.perk.every}`),
      gift('Beat all', p.perk), gift(`${lv2 ? '★ ' : ''}Research all`, p.perk.lv2));
    row.append(el('span', 'dex-ach-icon', p.perk.icon), text, el('span', 'ach-status', got ? '' : '🔒'));
    if (got) row.lastChild.append(el('span', 'pokeball'));
    dex.append(row);
  }
  {
    const got = getSave().dex.complete;
    const [n, total] = researchCount();
    const row = el('div', `ach dex-ach${got ? ' done' : ''}`);
    const text = el('div', 'ach-text');
    const line = el('span', 'perk-line', `Research all (${n}/${total})`);
    const chip = el('span', 'perk-gift');
    chip.append(el('span', 'perk-gift-icon', '💰'), el('span', '', `${DEX_COMPLETE_COINS}`));
    line.append(chip);
    text.append(el('strong', '', 'Pokédex complete'), el('span', 'perk-where', 'Every page · once'), line);
    row.append(el('span', 'dex-ach-icon', '📕'), text, el('span', 'ach-status', got ? '' : '🔒'));
    if (got) row.lastChild.append(el('span', 'pokeball'));
    dex.append(row);
  }

  // feats: Mewtwo's ending, ??? until Mewtwo is free
  const feats = el('div', 'ach-list');
  const free = getSave().unlocked.includes('mewtwo');
  for (const f of FEATS) {
    const got = getSave().feats.includes(f.id);
    const hidden = !got && f.secret && !free;
    const row = el('div', `ach feat${got ? ' done' : ''}`);
    const img = el('img', 'pixel');
    img.src = f.shiny ? spriteUrl(STARTERS_BY_ID[f.shiny], 'front', 0, true) : f.sprite;
    img.alt = '';
    const text = el('div', 'ach-text');
    text.append(el('strong', '', hidden ? '???' : f.name), el('span', '', hidden ? 'Something sleeps behind the Sealed Gate.' : f.text));
    if (f.coins && !hidden) text.append(el('span', 'perk-where', `💰 ${f.coins} PokéCoins`));
    row.append(img, text, el('span', 'ach-status', got ? '' : '🔒'));
    if (got) row.lastChild.append(el('span', 'pokeball'));
    feats.append(row);
  }

  const sub = into ? [el('p', 'records-sub', 'Each one unlocks a new starter.')] : [];
  (into ?? $('achievements-body')).replaceChildren(...sub, header, list, el('h3', 'records-label', 'Pokédex pages'), dex, el('h3', 'records-label', 'The Crystal Depths'), feats);
  if (!into) openDialog('achievements-dialog');
}
