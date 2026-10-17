/* garden-shop.js  -  Smeargle's garden catalogue (docs/roadmap.md's backyard, part b): a tap on Smeargle in the Poké
   Mall's Furniture store, once you have a backyard, opens it. It sells the whole Yard shelf (js/base-furniture-yard.js),
   always in stock, never in the daily stands' deal; a design you own shows as owned (more copies are the PC's
   Duplicate's). Its window is a merchant's card like the Furniture store's buy window (2026-10-17, the user's ask): each
   tile a still of the piece's 3D model in a little spotlit box, and a tap opens a buy window with it turning. */

import { getSave } from './storage.js';
import { playSound } from './audio.js';
import { el, refreshCoins } from './ui.js';
import { PIECES, DESIGNS, styles, loadBase, buyPiece } from './secret-base.js';
import { loadFigures } from './base-figures.js';
import { piecePreview, pieceTurntable } from './mall-furniture.js';
import { turntableStage, snapTurn, turner } from './turntable.js';
import { smoothIcon } from './smooth-icons.js';
import { dispose } from './hd2d.js';

const INK = '#5a9a3a';   // the catalogue's turntables, Smeargle's garden green

/** The catalogue's tabs (2026-10-16: the yard sets took it from 17 pieces to over a hundred), by each kind's `yard`
    shelf; the first Yard shelf's kinds carry none. */
export const GARDEN_TABS = ['Yard', 'Fences', 'Playground', 'Sports', 'Buildings', 'Water', 'Camping', 'Statues', 'Lights', 'Iron garden'];
const tabOf = (p) => p.yard || 'Yard';
/** Every outdoor design (on a tab, if given), cheapest first. */
export const gardenStock = (tab) => DESIGNS.filter(id => PIECES[id].outdoor && (!tab || tabOf(PIECES[id]) === tab)).sort((a, b) => PIECES[a].price - PIECES[b].price);
const owned = (id, b) => (b.owned[PIECES[id].own] || 0) > 0;

function art(id) {
  const a = PIECES[id].art(0, 2), c = document.createElement('canvas');
  c.width = a.width; c.height = a.height;
  c.getContext('2d').drawImage(a, 0, 0);
  c.className = 'gcat-pic';
  return c;
}

/* Each piece's still, kept as a small 2D canvas: its model is built, drawn once by the shared turntable and thrown away,
   so a hundred pieces never sit on the GPU. */
const SNAP = 128, snaps = new Map();
let queue = [];
function picture(id) {
  const shot = snaps.get(id);
  if (shot) { const c = el('canvas', 'gcat-pic gcat-3d'); c.width = c.height = SNAP; c.getContext('2d').drawImage(shot, 0, 0); return c; }
  const c = art(id);
  queue.push([id, c]);
  return c;
}
async function snapAll(open) {
  const st = await turntableStage().catch(() => null);
  if (!st) return;
  const step = () => {
    if (!open()) { queue = []; return; }
    const job = queue.shift();
    if (job) {
      const [id, c] = job;
      if (!snaps.has(id)) {
        const shot = el('canvas'), pv = pieceTurntable(st.THREE, id, INK);
        shot.width = shot.height = SNAP;
        const drawn = snapTurn(st, pv, shot);
        dispose(pv.pivot);
        if (!drawn) { queue.unshift(job); requestAnimationFrame(step); return; }
        snaps.set(id, shot);
      }
      if (c.isConnected) {
        c.width = c.height = SNAP;
        c.getContext('2d').drawImage(snaps.get(id), 0, 0);
        c.classList.add('gcat-3d');
      }
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** The buy window over the catalogue: the tab on a ribbon, the piece turning (drag to turn it), its styles, the price
    and your coins, Buy / Not now. Resolves true on Buy; a tap outside is a no. */
function buyWindow(id, tab) {
  const p = PIECES[id], n = styles(id).length, coins = getSave().coins ?? 0, short = coins < p.price;
  const d = el('dialog', `dialog gmerch garden-pick${short ? ' short' : ''}`);
  d.style.setProperty('--ink', INK);
  d.innerHTML = `<b class="mall-ask-who">Smeargle</b><p class="mshop-dept"></p><h3 class="mshop-name"></h3>
    <div class="mshop-stage"><canvas class="mshop-turn"></canvas><span class="mshop-hint">Drag to turn</span></div>
    <p class="mshop-note"></p><p class="mshop-price"><b></b><small></small></p>
    <div class="mall-ask-keys"><button type="button" class="mall-ask-yes">Buy</button><button type="button" class="mall-ask-no">Not now</button></div>`;
  d.querySelector('.mshop-dept').textContent = tab.toUpperCase();
  d.querySelector('.mshop-name').textContent = p.name;
  d.querySelector('.mshop-note').textContent = n > 1 ? `All ${n} styles included` : 'Delivered to your Secret Base';
  d.querySelector('.mshop-price b').textContent = p.price.toLocaleString();
  d.querySelector('.mshop-price b').before(smoothIcon('coin', 'mshop-coin'));
  d.querySelector('.mshop-price small').textContent = short ? `You have ${coins.toLocaleString()}: ${(p.price - coins).toLocaleString()} short` : `You have ${coins.toLocaleString()}`;
  document.body.append(d);
  const turn = turner(d.querySelector('.mshop-stage'), d.querySelector('.mshop-turn'), () => d.isConnected);
  let yes = false;
  return new Promise(res => {
    d.addEventListener('close', () => { turn.stop(); d.remove(); res(yes); }, { once: true });
    d.querySelector('.mall-ask-no').addEventListener('click', () => { playSound('cancel'); d.close(); });
    d.querySelector('.mall-ask-yes').addEventListener('click', () => { yes = true; d.close(); });
    d.showModal();
    turn.show((T) => piecePreview(T, id, INK));
  });
}

/** A tap on Smeargle: the catalogue if there's a backyard to put it in (true), else null (Smeargle just chats). */
export function gardenTap(done) {
  if (!loadBase().house?.yard) return Promise.resolve(null);
  return openGardenShop().then(() => { done?.(); return true; });
}

/** Open the catalogue's window. Resolves once it's closed. */
export function openGardenShop() {
  const d = el('dialog', 'dialog gmerch garden-shop');
  d.style.setProperty('--ink', INK);
  const say = el('p', 'gcat-say'), tabs = el('div', 'gcat-tabs'), grid = el('div', 'gcat-grid');
  const keys = el('div', 'mall-ask-keys'), close = el('button', 'mall-ask-no', 'Close');
  close.type = 'button';
  keys.append(close);
  d.append(el('b', 'mall-ask-who', 'Smeargle'), el('p', 'mshop-dept', 'GARDEN CATALOGUE'), say, tabs, grid, keys);
  document.body.append(d);
  let tab = GARDEN_TABS[0];
  const line = (t) => { say.textContent = `Smeargle: ${t}`; };
  const draw = () => {
    const b = loadBase();
    queue = [];
    tabs.replaceChildren(...GARDEN_TABS.filter(t => gardenStock(t).length).map(t => {
      const btn = el('button', `gcat-tab${t === tab ? ' on' : ''}`, t);
      btn.type = 'button';
      btn.addEventListener('click', () => { playSound('confirm'); tab = t; draw(); grid.scrollTop = 0; });
      return btn;
    }));
    grid.replaceChildren(...gardenStock(tab).map(id => {
      const p = PIECES[id], have = owned(id, b), tile = el('button', `gcat-tile${have ? ' sold' : ''}`);
      tile.type = 'button';
      const box = el('span', 'gcat-box'), price = el('span', 'gcat-price');
      box.append(picture(id));
      if (have) price.textContent = 'OWNED';
      else price.append(smoothIcon('coin', 'gcat-coin'), p.price.toLocaleString());
      tile.append(box, el('span', 'gcat-name', p.name), price);
      tile.addEventListener('click', async () => {
        playSound(have ? 'cancel' : 'confirm');
        if (have) return line(`You've got the ${p.name} already, every colour of it. More copies are on your PC's Duplicate.`);
        if (!await buyWindow(id, tab)) return;
        if ((getSave().coins ?? 0) < p.price) { playSound('cancel'); return line(`That's ${p.price.toLocaleString()} PokéCoins. You're a little short.`); }
        if (!buyPiece(loadBase(), id)) { playSound('cancel'); return; }
        playSound('buy');
        refreshCoins();
        line(`Thank you! The ${p.name} is in your storage. Put it out in your backyard!`);
        draw();
      });
      return tile;
    }));
  };
  line('Things for your backyard! They only go outside, and they\'re always in stock.');
  draw();
  // the statues are their Pokémon's sprites: their pictures repaint once those are in (only the yard's, not every figurine)
  loadFigures(gardenStock()).then(() => { if (d.isConnected) { draw(); snapAll(() => d.isConnected); } });
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(); }, { once: true });
    close.addEventListener('click', () => { playSound('cancel'); d.close(); });
    d.showModal();
  });
}
