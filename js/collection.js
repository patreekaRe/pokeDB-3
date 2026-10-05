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
import { DEX_PAGES, safariOpen } from './data/pokedex.js';
import { getSave } from './storage.js';
import { openPokedex } from './pokedex.js';
import { openSafariDex, safariDexCount } from './safaridex.js';
import { openCardIndex } from './cardindex.js';
import { openStats, openAchievements } from './records.js';
import { openRecords, bookEntries } from './halloffame.js';
import { tipAt } from './tips.js';
import { openTrainerCard, trainerTile } from './trainercard.js';
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
  // a tap on the empty background, anywhere but a card or the top bar, goes back like a tap outside a window (the user's
  // call). Pointer events, not click: iOS Safari sends no click for a tap on a plain section or the body. The press must
  // start and end on the same spot, so a swipe to scroll isn't a tap (iOS cancels the pointer on a scroll anyway)
  let down = null;
  document.addEventListener('pointerdown', (e) => { down = e.isPrimary ? { target: e.target, x: e.clientX, y: e.clientY } : null; }, true);
  document.addEventListener('pointerup', (e) => {
    const start = down;
    down = null;
    if (document.body.dataset.screen !== 'collection-screen' || !start || start.target !== e.target) return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) return;
    if (document.querySelector('dialog[open], .card-zoom, .tap-tip, #ball-menu-panel:not([hidden])')) return;
    if (e.target.closest('.coll-card, button, a, input, dialog, .topbar > *, .drop')) return;
    $('coll-back').click();
    // the tap's own click comes after, onto the title's gems now under the finger: swallow it
    const swallow = (c) => { c.stopPropagation(); c.preventDefault(); };
    document.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => document.removeEventListener('click', swallow, true), 500);
  });
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

/** The Safari Pokédex's card, a ??? until the Safari Zone opens (every Pokémon beaten). */
function safariCard(save) {
  const how = 'Beat every Pokémon in all three biomes to open the Safari Zone.';
  if (!safariOpen(save)) return ['safari', '???', el('span', 'coll-emoji', '🔒'), how, '???', null, how];
  const n = safariDexCount();
  return ['safari', 'Safari Pokédex', el('span', 'coll-emoji', '🌿'), 'The Pokémon of the Safari Zone, area by area. Catch them all.',
    `${n.caught}/${n.total} caught`, () => openSafariDex()];
}

export function showCollection() {
  showScreen('collection-screen');
  showMenuScene();
  const save = getSave();
  const dexTotal = DEX_PAGES.reduce((n, p) => n + p.ids.length, 0);
  const tc = trainerTile(save);
  const cards = [
    ['trainer', 'Trainer Card', tc.art, 'Your name, your numbers and the Badge Case.', tc.count, openTrainerCard],
    ['dex', 'Pokédex', el('span', 'coll-emoji', '📕'), 'Every Pokémon you have met. Research them for PokéCoins.',
      `${save.dex.defeated.filter(id => DEX_PAGES.some(p => p.ids.includes(id))).length}/${dexTotal} defeated`, () => openPokedex()],
    safariCard(save),
    ['moves', 'Moves', el('span', 'coll-emoji', '🃏'), 'Every move card in the game, by type.', `${ALL_CARDS.filter(c => save.seen.cards.includes(c.id)).length}/${ALL_CARDS.length} found`, () => openCardIndex(pickedStarter()?.type ?? 'fire')],
    ['relics', 'Relics', itemSprite({ id: 'leftovers', icon: '🍎' }), 'The held items found climbing the biomes.',
      `${save.seen.relics.length}/${RELICS.length} found`, () => openCardIndex('relics')],
    ['items', 'Items', itemSprite({ id: 'potion', icon: '🧪' }), 'The one-use items for your Bag.',
      `${save.seen.items.length}/${ITEMS.length} found`, () => openCardIndex('items')],
    ['stats', 'Stats', el('span', 'coll-emoji', '📊'), 'Runs, wins and records.',
      runCount(save.stats), openStats],
    ['achievements', 'Achievements', el('span', 'coll-emoji', '🏆'), 'The goals that unlock starters and legendaries.',
      `${ACHIEVEMENTS.filter(a => save.unlocked.includes(a.starter)).length}/${ACHIEVEMENTS.length} done`, openAchievements],
    book('record', 'Record Book', 'Every run you won: its deck, relics, items and numbers. Lost runs get a line too.', 'win',
      'Win a run to unlock it.'),
    book('fame', 'Hall of Fame', 'Your Trainer Level 5 champions, each with its full record.', 'champion',
      'Win a run on Trainer Level 5 to unlock it.'),
  ];
  $('coll-grid').replaceChildren(...cards.map(([id, name, art, text, count, open, locked], i) => {
    const card = el('button', `coll-card coll-${id}`);
    card.type = 'button';
    card.style.setProperty('--i', i);
    if (id === 'trainer') card.dataset.tier = tc.tier;
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
