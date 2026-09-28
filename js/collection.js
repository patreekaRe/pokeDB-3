/* ============================================================
   collection.js  -  the Collection, after Slay the Spire's compendium:
   a row of big cards, one per window (Pokédex, Moves, Relics, Items,
   Stats, Achievements), each with how far along you are. The windows
   themselves are the ones the Poké Ball menu opens.
   ============================================================ */

import { ALL_CARDS } from './data/cards.js';
import { RELICS } from './data/relics.js';
import { ITEMS } from './data/items.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { DEX_PAGES } from './data/pokedex.js';
import { getSave } from './storage.js';
import { openPokedex } from './pokedex.js';
import { openCardIndex } from './cardindex.js';
import { openStats, openAchievements } from './records.js';
import { openRecords, bookEntries } from './halloffame.js';
import { tipAt } from './tips.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { showMenuScene } from './scene.js';
import { pickedStarter } from './select.js';
import { $, el, showScreen, itemSprite } from './ui.js';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
// a plain count, not "0 of 1 runs won": every other card's pill is a goal (N/M), and this one read like "win one run"
const runCount = (stats) => `${plural(stats.runsStarted, 'run')} · ${plural(stats.runsWon, 'win')}`;

/** Called once at startup. */
export function initCollection({ onBack }) {
  $('coll-back').addEventListener('click', onBack);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.dataset.screen === 'collection-screen' && !document.querySelector('dialog:modal')) onBack();
  });
}

/** The newest entry stands on the Hall of Fame and Record Book cards. */
function fameArt(entry) {
  const img = el('img', 'pixel coll-winner');
  img.src = spriteUrl(STARTERS_BY_ID[entry.starter], 'front', entry.stage, entry.shiny);
  img.alt = '';
  return img;
}

/** The Hall of Fame's or the Record Book's card, a ??? until it holds an entry. */
function book(which, name, text, noun, how) {
  const entries = bookEntries(which);
  if (!entries.length) return [which, '???', el('span', 'coll-emoji', '🔒'), how, '???', null, how];
  return [which, name, fameArt(entries.at(-1)), text, `${entries.length} ${noun}${entries.length === 1 ? '' : 's'}`, () => openRecords(which)];
}

export function showCollection() {
  showScreen('collection-screen');
  showMenuScene();
  const save = getSave();
  const dexTotal = DEX_PAGES.reduce((n, p) => n + p.ids.length, 0);
  const cards = [
    ['dex', 'Pokédex', el('span', 'coll-emoji', '📕'), 'Every Pokémon you have met. Research them for PokéCoins.',
      `${save.dex.defeated.length}/${dexTotal} defeated`, () => openPokedex()],
    ['moves', 'Moves', el('span', 'coll-emoji', '🃏'), 'Every move card in the game, by type.', `${ALL_CARDS.filter(c => save.seen.cards.includes(c.id)).length}/${ALL_CARDS.length} found`, () => openCardIndex(pickedStarter()?.type ?? 'fire')],
    ['relics', 'Relics', itemSprite({ id: 'leftovers', icon: '🍎' }), 'The held items found climbing the biomes.',
      `${save.seen.relics.length}/${RELICS.length} found`, () => openCardIndex('relics')],
    ['items', 'Items', itemSprite({ id: 'potion', icon: '🧪' }), 'The one-use items for your Bag.',
      `${save.seen.items.length}/${ITEMS.length} found`, () => openCardIndex('items')],
    ['stats', 'Stats', el('span', 'coll-emoji', '📊'), 'Runs, wins and records.',
      runCount(save.stats), openStats],
    ['achievements', 'Achievements', el('span', 'coll-emoji', '🏆'), 'The goals that unlock starters and legendaries.',
      `${ACHIEVEMENTS.filter(a => save.unlocked.includes(a.starter)).length}/${ACHIEVEMENTS.length} done`, openAchievements],
    book('record', 'Record Book', 'Every run you won: its deck, relics, items and numbers.', 'win',
      'Win a run to unlock it.'),
    book('fame', 'Hall of Fame', 'Your Trainer Level 5 champions, each with its full record.', 'champion',
      'Win a run on Trainer Level 5 to unlock it.'),
  ];
  $('coll-grid').replaceChildren(...cards.map(([id, name, art, text, count, open, locked], i) => {
    const card = el('button', `coll-card coll-${id}`);
    card.type = 'button';
    card.style.setProperty('--i', i);
    const pic = el('span', 'coll-art');
    pic.append(art);
    card.append(el('strong', 'coll-name', name), pic, el('span', 'coll-text', text), el('span', 'coll-count', count));
    if (locked) {
      // a ??? until its first entry (the user's call): a tap says how to unlock it
      card.classList.add('locked');
      card.addEventListener('click', () => tipAt(card, locked));
    } else card.addEventListener('click', open);
    return card;
  }));
}
