/* town-shop.js  -  a gateway town's furniture shop, visited from home through its Waystone (docs/roadmap.md's Towns and
   Waystones, session 2). Each town sells one shelf of the Secret Base's catalogue (SHOP_SHELVES in js/data/towns.js),
   never sold in the Poké Mall: SHOP_STOCK designs a UTC day, dealt from the day's seed and the town, a design you own
   never dealt again (like the mall's store). Bought into the base's storage with buyPiece(). Its window is the device's
   (.dev-window): the day's pieces on a pale screen, a tap picks one, Buy takes it. */

import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el, refreshCoins, confirmDialog } from './ui.js';
import { PIECES, DESIGNS, loadBase, buyPiece } from './secret-base.js';
import { FURNITURE_BY_KIND } from './data/furniture.js';
import { SHOP_SHELVES, SHOP_STOCK, TOWNS } from './data/towns.js';
import { safariDay } from './data/safari.js';
import { streamOf, shuffled } from './rng.js';

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
  screen.append(say, grid);
  const close = el('button', 'btn secondary', 'Close'), buy = el('button', 'btn danger', 'Buy');
  const acts = el('div', 'dialog-actions');
  acts.append(close, buy);
  d.append(head, screen, acts);
  document.body.append(d);
  let picked = null;
  const line = (t) => { say.textContent = keeper ? `${keeper}: ${t}` : t; };
  const draw = () => {
    const stock = townStock(town), b = loadBase();
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
  buy.addEventListener('click', async () => {
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
  line('Things from round here, made by hand. You won\'t find them at the Poké Mall.');
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}
