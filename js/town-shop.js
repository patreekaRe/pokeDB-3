/* town-shop.js  -  a gateway town's furniture shop, visited from home through its Waystone (docs/roadmap.md's Towns and
   Waystones, session 2). Each town sells one shelf of the Secret Base's catalogue (SHOP_SHELVES in js/data/towns.js),
   never sold in the Poké Mall: SHOP_STOCK designs a UTC day, dealt from the day's seed and the town, a design you own
   never dealt again (like the mall's store). Bought into the base's storage with buyPiece(). Its window is the device's
   (.dev-window): the day's pieces on a pale screen, a tap picks one, Buy takes it. With records (js/data/records.js) a
   Records tab sells the town's songs, never dealt by the day, in a crate you flip through (recordCrate() in
   js/jukebox.js): a tap on the front record plays it, Buy keeps it for the base's jukebox. */

import { getSave, updateSave } from './storage.js';
import { playSound, playMusic, musicNow } from './audio.js';
import { el, refreshCoins, confirmDialog } from './ui.js';
import { PIECES, DESIGNS, loadBase, buyPiece } from './secret-base.js';
import { FURNITURE_BY_KIND } from './data/furniture.js';
import { SHOP_SHELVES, SHOP_STOCK, TOWNS } from './data/towns.js';
import { safariDay } from './data/safari.js';
import { streamOf, shuffled } from './rng.js';
import { recordsOf, recordsOpen, ownedRecords } from './data/records.js';
import { recordCrate } from './jukebox.js';

/** The designs a town's shelf holds (earned pieces never sold). */
export const shelfOf = (town) => DESIGNS.filter(id => (SHOP_SHELVES[town] || []).includes(PIECES[id].group) && !FURNITURE_BY_KIND[id]);

/** The town's stock today: SHOP_STOCK of its shelf, the day's and the town's own deal, leaving out what you own. Dealt
    once a day and kept in the save (`townShop`), so a piece bought today stands sold out till tomorrow, like the mall's. */
export function townStock(town, day = safariDay()) {
  const kept = getSave().townShop?.[town];
  if (kept?.day === day && kept.ids.every(id => PIECES[id])) return kept.ids;
  const owned = loadBase().owned;
  const ids = shuffled(shelfOf(town).filter(id => !(owned[PIECES[id].own] > 0)), streamOf(`shop-${town}`, day)).slice(0, SHOP_STOCK);
  updateSave(d => { d.townShop = { ...(d.townShop || {}), [town]: { day, ids } }; });
  return ids;
}
const soldOut = (id, b) => (b.owned[PIECES[id].own] || 0) > 0;

function art(id) {
  const a = PIECES[id].art(0, 2), c = document.createElement('canvas');
  c.width = a.width; c.height = a.height;
  c.getContext('2d').drawImage(a, 0, 0);
  c.className = 'tshop-pic';
  return c;
}

/** Open the shop's window for `town` (a TOWNS id); `keeper` names who sells. Resolves once it's closed. */
export function openTownShop(town, keeper = TOWNS[town]?.trader?.name ?? '') {
  const d = el('dialog', 'dialog dev-window town-shop');
  const head = el('h2', '', `${TOWNS[town].name.toUpperCase()} GOODS`);
  const say = el('p', 'tshop-say');
  const grid = el('div', 'tshop-grid');
  const screen = el('div', 'dev-screen');
  const records = recordsOpen() && recordsOf(town).length > 0, song = musicNow();
  let tab = 'goods';
  const tabs = el('div', 'tshop-tabs');
  if (records) {
    for (const [id, label] of [['goods', 'Furniture'], ['records', 'Records']]) {
      const t = el('button', 'tshop-tab', label);
      t.type = 'button';
      t.dataset.tab = id;
      t.addEventListener('click', () => {
        if (tab === id) return;
        playSound('select');
        tab = id; picked = null; listening = null;
        playMusic(song);
        line(id === 'records' ? 'Songs from round here, pressed on records. Tap one to have a listen.' : GOODS_LINE);
        draw();
      });
      tabs.append(t);
    }
    screen.append(tabs);
  }
  screen.append(say, grid);
  const close = el('button', 'btn secondary', 'Close'), buy = el('button', 'btn danger', 'Buy');
  const acts = el('div', 'dialog-actions');
  acts.append(close, buy);
  d.append(head, screen, acts);
  document.body.append(d);
  let picked = null;
  const line = (t) => { say.textContent = keeper ? `${keeper}: ${t}` : t; };
  const drawGoods = () => {
    const stock = townStock(town), b = loadBase();
    grid.classList.remove('crate');
    grid.replaceChildren(...(stock.length ? stock.map(id => {
      const p = PIECES[id], gone = soldOut(id, b), tile = el('button', `tshop-tile${picked === id ? ' on' : ''}${gone ? ' sold' : ''}`);
      tile.type = 'button';
      tile.append(art(id), el('span', 'tshop-name', p.name), el('span', 'tshop-price', gone ? 'SOLD OUT' : `${p.price.toLocaleString()}`));
      tile.addEventListener('click', () => {
        playSound(gone ? 'cancel' : 'confirm');
        if (gone) return line(`The ${p.name}'s sold! New stock tomorrow.`);
        picked = id;
        line(`${p.name}. ${p.price.toLocaleString()} PokéCoins.`);
        draw();
      });
      return tile;
    }) : [el('p', 'tshop-empty', 'Sold out! New stock tomorrow.')]));
    buy.disabled = !picked || !stock.includes(picked) || soldOut(picked, b);
  };
  // the front record of the crate is the one Buy takes; a tap on it plays it, so flipping never stops the music
  let crate = null, listening = null;
  const owns = (r) => ownedRecords(getSave()).includes(r.id);
  const drawRecords = () => {
    crate ??= recordCrate(recordsOf(town), {
      look: (r) => ({ out: r.id === listening, note: `${owns(r) ? 'OWNED' : `${r.price.toLocaleString()} PokéCoins`} · ${r.id === listening ? 'playing' : 'tap to listen'}` }),
      onFlip: (r) => { picked = r.id; buy.disabled = owns(r); },
      onTap: (r) => {
        if (listening === r.id) return;
        playSound('select');
        listening = r.id;
        playMusic(r.track);
        line(owns(r) ? `"${r.name}". That one's yours already.` : `"${r.name}". ${r.price.toLocaleString()} PokéCoins. Plays on any jukebox, record player or gramophone.`);
        crate.refresh();
      },
    });
    picked = crate.current().id;
    crate.refresh();
    grid.classList.add('crate');
    grid.replaceChildren(crate.el);
    buy.disabled = owns(crate.current());
  };
  const draw = () => {
    for (const t of tabs.children) t.classList.toggle('on', t.dataset.tab === tab);
    (tab === 'records' ? drawRecords : drawGoods)();
  };
  const buyRecord = async () => {
    const r = recordsOf(town).find(x => x.id === picked);
    if (!r || ownedRecords(getSave()).includes(r.id)) return;
    if ((getSave().coins ?? 0) < r.price) { playSound('cancel'); return line(`That's ${r.price.toLocaleString()} PokéCoins. You're a little short.`); }
    if (!(await confirmDialog(`Buy the record "${r.name}" for ${r.price.toLocaleString()} PokéCoins?`, 'Buy'))) return;
    updateSave(s => { s.coins -= r.price; s.records = [...new Set([...(Array.isArray(s.records) ? s.records : []), r.id])]; });
    playSound('buy');
    refreshCoins();
    line(`Thank you! Put "${r.name}" on at home: tap a jukebox, record player or gramophone in your Secret Base.`);
    draw();
  };
  buy.addEventListener('click', async () => {
    if (tab === 'records') return buyRecord();
    const p = PIECES[picked];
    if (!p) return;
    if ((getSave().coins ?? 0) < p.price) { playSound('cancel'); return line(`That's ${p.price.toLocaleString()} PokéCoins. You're a little short.`); }
    if (!(await confirmDialog(`Buy the ${p.name} for ${p.price.toLocaleString()} PokéCoins? It goes to your Secret Base's storage.`, 'Buy'))) return;
    const b = loadBase();
    if (!buyPiece(b, picked)) { playSound('cancel'); return; }
    playSound('buy');
    refreshCoins();
    line(`Thank you! The ${p.name} is waiting in your Secret Base's storage.`);
    picked = null;
    draw();
  });
  line(GOODS_LINE);
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); playMusic(song); res(); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}
const GOODS_LINE = 'Things from round here, made by hand. You won\'t find them at the Poké Mall.';
