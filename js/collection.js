/* ============================================================
   collection.js  -  the Collection, the device's home screen
   (js/device.js): the owner's ID strip (the Trainer Card) and a grid
   of apps, each with how far along you are. Every app runs inside the
   screen; only the Leaderboard and a zoomed card open over it. Under
   the grid a dock: Settings, Help and the Game Corner, and laid over a screen (the top
   bar's Pokédex) Main menu too.
   ============================================================ */

import { ALL_CARDS } from './data/cards.js';
import { RELICS } from './data/relics.js';
import { ITEMS } from './data/items.js';
import { ACHIEVEMENTS } from './data/achievements.js';
import { DEX_PAGES, safariOpen } from './data/pokedex.js';
import { getSave } from './storage.js';
import { pokedexApp } from './pokedex.js';
import { safariDexApp, safariDexCount } from './safaridex.js';
import { movesApp } from './cardindex.js';
import { bagApp } from './bagdex.js';
import { openStats, openAchievements } from './records.js';
import { recordsApp, bookEntries } from './halloffame.js';
import { tipAt } from './tips.js';
import { openTrainerCard, trainerTile, badgeNews, partner, cardTier, badgeArt } from './trainercard.js';
import { BADGES } from './data/badges.js';
import { trainerName } from './leaderboard.js';
import { showMenuScene } from './scene.js';
import { pickedStarter } from './select.js';
import { initDevice, openDevice, openApp, swapApp, hideDevice, deviceOver } from './device.js';
import { $, el } from './ui.js';
import { smoothIcon } from './smooth-icons.js';

let dock = null;   // main.js's { corner(), menu(), abandonable() } for the dock
let here = {};     // the pages a run stands on, for the Pokédex apps: { dex, safari }

/** Called once at startup. */
export function initCollection({ onBack, ...handlers }) {
  initDevice({ onBack });
  dock = handlers;
  pokedexApp.toSafari = () => swapApp({ ...safariApp(safariDexCount()), name: 'SAFARI' });
}

const safariApp = ({ caught, total }) => ({ id: 'safari', count: `${caught}/${total}`, cls: 'cdev-win panel cdev-safari', app: safariDexApp });

const splash = () => `HELLO, ${trainerName().toUpperCase()}!`;

export function showCollection() {
  showMenuScene();
  here = {};
  openDevice({ render: renderHome, cover: coverArt, splash: splash() });
}

/** The top bar's Pokédex: the device over whatever is showing, on its home screen. `at` is where a run stands: its
    Pokédex apps open on that page ({ dex: biome, safari: area }). */
export function openPokedex(at = {}) {
  here = at;
  openDevice({ render: renderHome, cover: coverArt, splash: splash(), over: true });
}

/**
 * Opens the device straight into one app over whatever is showing (the Bag, in a run or not):
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
  const mate = partner(save);
  const win = el('span', 'cdev-cover-window');
  const img = el('img', 'pixel');
  img.src = mate.src;
  img.alt = '';
  win.append(img);
  const plate = el('span', 'cdev-cover-plate');
  plate.dataset.tier = cardTier(save).id;
  const earned = BADGES.filter(b => !b.locked && (save.badges || []).includes(b.id));
  const row = el('span', 'cdev-cover-badges');
  row.append(...earned.map(b => {
    const art = el('img');
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

/** An app's icon: smooth vector art (js/smooth-icons.js), sized by the tile's font-size. */
const vec = (name) => {
  const s = el('span', 'coll-emoji');
  s.append(smoothIcon(name));
  return s;
};

/** The apps, in the home screen's order. `locked` is how to unlock one ("???" until then); `fill` / `app` run in the
    screen (device.js's openApp()). */
function apps(save) {
  const dexTotal = DEX_PAGES.reduce((n, p) => n + p.ids.length, 0);
  const dexN = save.dex.defeated.filter(id => DEX_PAGES.some(p => p.ids.includes(id))).length;
  const book = (id, name, noun, how) => {
    const entries = bookEntries(id);
    if (!entries.length) return { id, locked: how };
    return { id, name, art: vec(id), count: `${entries.length} ${noun}${entries.length === 1 ? '' : 's'}`, app: recordsApp(id) };
  };
  const safari = safariOpen(save) ? safariDexCount() : null;
  const things = (id, name, art, all) => ({
    id, name, art, count: `${save.seen[id].length}/${all.length}`, cls: 'cdev-dex cdev-bag', app: bagApp(id),
  });
  return [
    { id: 'dex', name: 'Pokédex', art: vec('dex'), count: `${dexN}/${dexTotal}`, cls: 'cdev-dex', app: pokedexApp, at: here.dex },
    { id: 'moves', name: 'Moves', art: vec('moves'), count: `${ALL_CARDS.filter(c => save.seen.cards.includes(c.id)).length}/${ALL_CARDS.length}`,
      cls: 'cdev-win panel cdev-moves', app: movesApp(pickedStarter()?.type) },
    safari
      ? { ...safariApp(safari), name: 'Safari', art: vec('safari'), at: here.safari }
      : { id: 'safari', locked: 'Beat every Pokémon in all three biomes to open the Safari Zone.' },
    things('relics', 'Relics', vec('relics'), RELICS),
    things('items', 'Items', vec('items'), ITEMS),
    { id: 'stats', name: 'Stats', art: vec('stats'), count: `${save.stats.runsWon} win${save.stats.runsWon === 1 ? '' : 's'}`, fill: (p) => openStats(p) },
    { id: 'achievements', name: 'Achievements', art: vec('trophy'),
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
  const mate = partner(save);
  const mon = el('span', 'cdev-owner-mon');
  const img = el('img', 'pixel');
  img.src = mate.src;
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
    tile.append(a.locked ? vec('lock') : a.art);
    icon.append(tile, el('span', 'cdev-label', a.locked ? '???' : a.name), el('span', 'cdev-count', a.locked ? '???' : a.count));
    if (a.locked) icon.addEventListener('click', () => tipAt(icon, a.locked));   // a ??? until its first entry: a tap says how
    else icon.addEventListener('click', () => openApp({ ...a, name: a.name.toUpperCase() }));
    return icon;
  }));
  return [ownerStrip(save), grid, dockRow()];
}

/** An app that shows a piece of the page (index.html's #dev-parts) while it's open, and hands it back after. */
const borrow = (id, before) => ({
  mount(panel) { before?.(); panel.append($(id)); },
  back: () => false,
  key: () => false,
  unmount() { $('dev-parts').append($(id)); },
});

const settingsApp = () => ({
  id: 'settings', name: 'SETTINGS', cls: 'cdev-win panel cdev-system',
  // abandoning is only offered over a run's own screens, not from the title's Collection (it has its Escape Rope)
  app: borrow('dev-settings', () => { $('abandon-btn').hidden = !(deviceOver() && dock.abandonable()); }),
});

/** The dock under the apps: settings, help and the Game Corner; laid over a screen also Main menu. */
function dockRow() {
  const over = deviceOver();
  const row = el('div', 'cdev-dock');
  const items = [
    ['settings', 'Settings', 'settings', () => openApp(settingsApp())],
    ['help', 'Help', 'help', () => openApp({ id: 'help', name: 'HELP', cls: 'cdev-win panel cdev-system', app: borrow('dev-help') })],
    ['corner', 'Game Corner', 'corner', () => { hideDevice(); dock.corner(); }],
    over && ['menu', 'Main menu', 'home', () => dock.menu()],
  ].filter(Boolean);
  row.append(...items.map(([id, name, icon, open]) => {
    const b = el('button', `cdev-pick cdev-dock-btn app-${id}`);
    b.type = 'button';
    const tile = el('span', 'cdev-tile');
    tile.append(vec(icon));
    b.append(tile, el('span', 'cdev-label', name));
    b.addEventListener('click', open);
    return b;
  }));
  return row;
}
