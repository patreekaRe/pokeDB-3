/* garden-shop.js  -  Smeargle's garden catalogue (docs/roadmap.md's backyard, part b): a tap on Smeargle in the Poké
   Mall's Furniture store, once you have a backyard, opens it. It sells the whole Yard shelf (js/base-furniture-yard.js),
   always in stock, never in the daily stands' deal; a design you own shows as owned (more copies are the PC's
   Duplicate's). Its window is a gateway town shop's (js/town-shop.js), the device's .dev-window. */

import { getSave } from './storage.js';
import { playSound } from './audio.js';
import { el, refreshCoins, confirmDialog } from './ui.js';
import { PIECES, DESIGNS, loadBase, buyPiece } from './secret-base.js';

/** The catalogue's tabs (2026-10-16: the yard sets took it from 17 pieces to over a hundred), by each kind's `yard`
    shelf; the first Yard shelf's kinds carry none. */
export const GARDEN_TABS = ['Yard', 'Fences', 'Playground', 'Sports', 'Buildings', 'Water', 'Camping', 'Statues', 'Lights'];
const tabOf = (p) => p.yard || 'Yard';
/** Every outdoor design (on a tab, if given), cheapest first. */
export const gardenStock = (tab) => DESIGNS.filter(id => PIECES[id].outdoor && (!tab || tabOf(PIECES[id]) === tab)).sort((a, b) => PIECES[a].price - PIECES[b].price);
const owned = (id, b) => (b.owned[PIECES[id].own] || 0) > 0;

function art(id) {
  const a = PIECES[id].art(0, 2), c = document.createElement('canvas');
  c.width = a.width; c.height = a.height;
  c.getContext('2d').drawImage(a, 0, 0);
  c.className = 'tshop-pic';
  return c;
}

/** A tap on Smeargle: the catalogue if there's a backyard to put it in (true), else null (Smeargle just chats). */
export function gardenTap(done) {
  if (!loadBase().house?.yard) return Promise.resolve(null);
  return openGardenShop().then(() => { done?.(); return true; });
}

/** Open the catalogue's window. Resolves once it's closed. */
export function openGardenShop() {
  const d = el('dialog', 'dialog dev-window town-shop garden-shop');
  const head = el('h2', '', 'GARDEN CATALOGUE');
  const say = el('p', 'tshop-say'), tabs = el('div', 'wshop-tabs'), grid = el('div', 'tshop-grid'), screen = el('div', 'dev-screen');
  screen.append(say, tabs, grid);
  const close = el('button', 'btn secondary', 'Close'), buy = el('button', 'btn danger', 'Buy');
  const acts = el('div', 'dialog-actions');
  acts.append(close, buy);
  d.append(head, screen, acts);
  document.body.append(d);
  let picked = null, tab = GARDEN_TABS[0];
  const line = (t) => { say.textContent = `Smeargle: ${t}`; };
  const draw = () => {
    const b = loadBase();
    tabs.replaceChildren(...GARDEN_TABS.filter(t => gardenStock(t).length).map(t => {
      const btn = el('button', `wshop-tab${t === tab ? ' on' : ''}`, t);
      btn.type = 'button';
      btn.addEventListener('click', () => { playSound('confirm'); tab = t; draw(); grid.scrollTop = 0; });
      return btn;
    }));
    grid.replaceChildren(...gardenStock(tab).map(id => {
      const p = PIECES[id], have = owned(id, b), tile = el('button', `tshop-tile${picked === id ? ' on' : ''}${have ? ' sold' : ''}`);
      tile.type = 'button';
      tile.append(art(id), el('span', 'tshop-name', p.name), el('span', 'tshop-price', have ? 'OWNED' : p.price.toLocaleString()));
      tile.addEventListener('click', () => {
        playSound(have ? 'cancel' : 'confirm');
        if (have) return line(`You've got the ${p.name} already, every colour of it. More copies are on your PC's Duplicate.`);
        picked = id;
        line(`The ${p.name}. ${p.price.toLocaleString()} PokéCoins, every colour with it.`);
        draw();
      });
      return tile;
    }));
    buy.disabled = !picked || owned(picked, b);
  };
  buy.addEventListener('click', async () => {
    const p = PIECES[picked];
    if (!p) return;
    if ((getSave().coins ?? 0) < p.price) { playSound('cancel'); return line(`That's ${p.price.toLocaleString()} PokéCoins. You're a little short.`); }
    if (!(await confirmDialog(`Buy the ${p.name} for ${p.price.toLocaleString()} PokéCoins? It goes to your Secret Base's storage.`, 'Buy'))) return;
    if (!buyPiece(loadBase(), picked)) { playSound('cancel'); return; }
    playSound('buy');
    refreshCoins();
    line(`Thank you! The ${p.name} is in your storage. Put it out in your backyard!`);
    picked = null;
    draw();
  });
  line('Things for your backyard! They only go outside, and they\'re always in stock.');
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}
