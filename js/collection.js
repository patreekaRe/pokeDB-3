/* ============================================================
   collection.js  -  the Collection, the device's home screen
   (js/device.js): the owner's ID strip (the Trainer Card) and a grid
   of apps, each with how far along you are. Every app runs inside the
   screen; only the Leaderboard and a zoomed card open over it.
   ============================================================ */

import { ALL_CARDS } from './data/cards.js';
import { RELICS } from './data/relics.js';
import { ITEMS } from './data/items.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { DEX_PAGES, safariOpen } from './data/pokedex.js';
import { getSave } from './storage.js';
import { pokedexApp } from './pokedex.js';
import { safariDexApp, safariDexCount } from './safaridex.js';
import { movesApp, drawThings } from './cardindex.js';
import { openStats, openAchievements } from './records.js';
import { recordsApp, bookEntries } from './halloffame.js';
import { tipAt } from './tips.js';
import { openTrainerCard, trainerTile, badgeNews, partner, cardTier, badgeArt } from './trainercard.js';
import { BADGES } from './data/badges.js';
import { trainerName } from './leaderboard.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { showMenuScene } from './scene.js';
import { pickedStarter } from './select.js';
import { initDevice, openDevice, openApp, swapApp } from './device.js';
import { $, el, itemSprite } from './ui.js';

/** Called once at startup. */
export function initCollection({ onBack }) {
  initDevice({ onBack });
  pokedexApp.toSafari = () => swapApp({ ...safariApp(safariDexCount()), name: 'SAFARI' });
}

const safariApp = ({ caught, total }) => ({ id: 'safari', count: `${caught}/${total}`, cls: 'cdev-win panel cdev-safari', app: safariDexApp });

export function showCollection() {
  showMenuScene();
  openDevice({ render: renderHome, cover: coverArt, splash: `HELLO, ${trainerName().toUpperCase()}!` });
}

/**
 * Opens the device straight into one app over whatever is showing (the Poké Ball menu and the Bag, in a run or not):
 * 'dex' (`at` a biome's page), 'safari' (`at` an area), 'stats', 'achievements' or 'trainer'. B out of it shuts the
 * device, or with `home` steps out to the home screen like any app.
 */
export function openDeviceApp(id, at, home = false) {
  const save = getSave();
  const def = id === 'trainer' ? trainerApp(save)
    : id === 'safari' ? { ...safariApp(safariDexCount()), name: 'Safari' }   // a Safari run's own, open or not on the home screen
    : apps(save).find(a => a.id === id);
  if (!def || def.locked) return;
  openDevice({ render: renderHome, cover: coverArt, over: true, home, start: { ...def, name: def.name.toUpperCase(), at } });
}

/** The closed cover: an LED that blinks while a badge is unseen, your partner in a little window, your name and badges. */
function coverArt() {
  const save = getSave();
  const led = el('span', `cdev-led${badgeNews(save) ? ' on' : ''}`);
  led.title = badgeNews(save) ? 'A new badge!' : '';
  const { starter, stage } = partner(save);
  const win = el('span', 'cdev-cover-window');
  const img = el('img', 'pixel');
  img.src = spriteUrl(starter, 'front', stage);
  img.alt = '';
  win.append(img);
  const plate = el('span', 'cdev-cover-plate');
  plate.dataset.tier = cardTier(save).id;
  const earned = BADGES.filter(b => !b.locked && (save.badges || []).includes(b.id));
  const row = el('span', 'cdev-cover-badges');
  row.append(...earned.map(b => {
    const art = el('img', 'pixel');
    art.src = badgeArt(b.id, true);
    art.alt = '';
    return art;
  }));
  plate.append(el('b', '', trainerName().toUpperCase()), earned.length ? row : el('small', '', 'NO BADGES YET'));
  return [led, win, plate];
}

const trainerApp = (save) => {
  const tc = trainerTile(save);
  return { id: 'trainer', name: 'Trainer Card', count: tc.count.replace(' · New!', ''), cls: 'cdev-win panel trainer-dialog', fill: (p) => openTrainerCard(p) };
};

const emoji = (e) => el('span', 'coll-emoji', e);

/** The newest entry stands on the Hall of Fame and Record Book icons. */
function fameArt(entry) {
  const img = el('img', 'pixel coll-winner');
  img.src = spriteUrl(STARTERS_BY_ID[entry.starter], 'front', entry.stage, entry.shiny);
  img.alt = '';
  return img;
}

/** The apps, in the home screen's order. `locked` is how to unlock one ("???" until then); `fill` / `app` run in the
    screen (device.js's openApp()). */
function apps(save) {
  const dexTotal = DEX_PAGES.reduce((n, p) => n + p.ids.length, 0);
  const dexN = save.dex.defeated.filter(id => DEX_PAGES.some(p => p.ids.includes(id))).length;
  const book = (id, name, noun, how) => {
    const entries = bookEntries(id);
    if (!entries.length) return { id, locked: how };
    return { id, name, art: fameArt(entries.at(-1)), count: `${entries.length} ${noun}${entries.length === 1 ? '' : 's'}`, app: recordsApp(id) };
  };
  const safari = safariOpen(save) ? safariDexCount() : null;
  const things = (id, name, art, all) => ({
    id, name, art, count: `${save.seen[id].length}/${all.length}`, cls: 'cdev-win panel index-dialog', fill: (p) => drawThings(id, p),
  });
  return [
    { id: 'dex', name: 'Pokédex', art: emoji('📕'), count: `${dexN}/${dexTotal}`, cls: 'cdev-dex', app: pokedexApp },
    { id: 'moves', name: 'Moves', art: emoji('🃏'), count: `${ALL_CARDS.filter(c => save.seen.cards.includes(c.id)).length}/${ALL_CARDS.length}`,
      cls: 'cdev-win panel cdev-moves', app: movesApp(pickedStarter()?.type) },
    safari
      ? { ...safariApp(safari), name: 'Safari', art: emoji('🌿') }
      : { id: 'safari', locked: 'Beat every Pokémon in all three biomes to open the Safari Zone.' },
    things('relics', 'Relics', itemSprite({ id: 'leftovers', icon: '🍎' }), RELICS),
    things('items', 'Items', itemSprite({ id: 'potion', icon: '🧪' }), ITEMS),
    { id: 'stats', name: 'Stats', art: emoji('📊'), count: `${save.stats.runsWon} win${save.stats.runsWon === 1 ? '' : 's'}`, fill: (p) => openStats(p) },
    { id: 'achievements', name: 'Achievements', art: emoji('🏆'),
      count: `${ACHIEVEMENTS.filter(a => save.unlocked.includes(a.starter)).length}/${ACHIEVEMENTS.length}`, fill: (p) => openAchievements(p) },
    book('record', 'Record Book', 'win', 'Win a run to unlock it.'),
    book('fame', 'Hall of Fame', 'champion', 'Win a run on Trainer Level 5 to unlock it.'),
  ];
}

/** The owner's ID strip at the top of the home screen: it opens the Trainer Card. */
function ownerStrip(save) {
  const tc = trainerTile(save);
  const strip = el('button', 'cdev-pick cdev-owner');
  strip.type = 'button';
  strip.dataset.tier = tc.tier;
  const { starter, stage } = partner(save);
  const mon = el('span', 'cdev-owner-mon');
  const img = el('img', 'pixel');
  img.src = spriteUrl(starter, 'front', stage);
  img.alt = '';
  mon.append(img);
  const id = el('span', 'cdev-owner-id');
  id.append(el('small', '', 'TRAINER'), el('b', '', trainerName().toUpperCase()), el('small', '', cardTier(save).name));
  const badge = el('span', 'cdev-owner-badge');
  badge.append(tc.art, el('small', '', tc.count.replace(' · New!', '')));
  strip.append(mon, id, badge);
  strip.setAttribute('aria-label', `Trainer Card: ${tc.count}`);
  strip.addEventListener('click', () => openApp({ ...trainerApp(save), name: 'TRAINER CARD' }));
  return strip;
}

function renderHome() {
  const save = getSave();
  $('cdev').classList.toggle('news', badgeNews(save));   // the cover's LED, still blinking on the lid once it's open
  const grid = el('div', 'cdev-grid');
  grid.append(...apps(save).map(a => {
    const icon = el('button', `cdev-pick cdev-icon app-${a.id}${a.locked ? ' locked' : ''}`);
    icon.type = 'button';
    const tile = el('span', 'cdev-tile');
    tile.append(a.locked ? emoji('🔒') : a.art);
    icon.append(tile, el('span', 'cdev-label', a.locked ? '???' : a.name), el('span', 'cdev-count', a.locked ? '???' : a.count));
    if (a.locked) icon.addEventListener('click', () => tipAt(icon, a.locked));   // a ??? until its first entry: a tap says how
    else icon.addEventListener('click', () => openApp({ ...a, name: a.name.toUpperCase() }));
    return icon;
  }));
  return [ownerStrip(save), grid];
}
