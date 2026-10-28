/* paper-shop.js  -  Smeargle's wallpaper and floor catalogue: a tap on Smeargle in the Poké Mall's Furniture store opens
   it (2026-10-27, the user's ask: players didn't know they had wallpaper and floors, which were only sold in the Decorate
   tray). Every one for sale, always in stock, the day's two at half price first; a tap picks one and a second buys it,
   as the Decorate tray's try-on does. With a backyard its last tab opens the garden catalogue (js/garden-shop.js). */

import { getSave } from './storage.js';
import { playSound } from './audio.js';
import { el, refreshCoins } from './ui.js';
import { loadBase, buyPaper, ownsPaper, paperArt } from './secret-base.js';
import { papers, themesOf, paperPrice, onSale } from './base-papers.js';
import { smoothIcon } from './smooth-icons.js';

const INK = '#c0603a';   // Smeargle's paint-tail orange
const TABS = [['wall', 'Wallpaper'], ['floor', 'Floors']];

// each one's picture is painted once a page load, so a tap that redraws the grid doesn't repaint a hundred rooms
const pics = new Map();
function art(field, id) {
  const key = `${field}:${id}`;
  if (!pics.has(key)) pics.set(key, paperArt(field, id));
  const shot = pics.get(key), c = el('canvas', 'gcat-pic pcat-pic');
  c.width = shot.width; c.height = shot.height;
  c.getContext('2d').drawImage(shot, 0, 0);
  return c;
}

/** A tap on Smeargle: the catalogue. Resolves true once it's closed. */
export function paperTap(done) {
  return openPaperShop().then((garden) => {
    done?.();
    return garden ? import('./garden-shop.js').then(m => m.openGardenShop()).then(() => { done?.(); return true; }) : true;
  });
}

/** Open the catalogue's window. Resolves once it's closed: true if its Garden tab closed it. */
export function openPaperShop() {
  const d = el('dialog', 'dialog gmerch garden-shop paper-shop');
  d.style.setProperty('--ink', INK);
  const say = el('p', 'gcat-say'), tabs = el('div', 'gcat-tabs'), themes = el('div', 'gcat-tabs pcat-themes'), grid = el('div', 'gcat-grid');
  const keys = el('div', 'mall-ask-keys'), close = el('button', 'mall-ask-no', 'Close');
  close.type = 'button';
  keys.append(close);
  d.append(el('b', 'mall-ask-who', 'Smeargle'), el('p', 'mshop-dept', 'WALLPAPER & FLOORS'), say, tabs, themes, grid, keys);
  document.body.append(d);
  let field = 'wall', theme = 'All', picked = null, garden = false;
  const line = (t) => { say.textContent = `Smeargle: ${t}`; };
  const draw = () => {
    const b = loadBase();
    const tab = (label, on, go) => { const btn = el('button', `gcat-tab${on ? ' on' : ''}`, label); btn.type = 'button'; btn.addEventListener('click', go); return btn; };
    tabs.replaceChildren(...TABS.map(([f, label]) => tab(label, f === field, () => { playSound('confirm'); field = f; theme = 'All'; picked = null; draw(); grid.scrollTop = 0; })),
      ...(b.house?.yard ? [tab('Garden ›', false, () => { playSound('confirm'); garden = true; d.close(); })] : []));
    themes.replaceChildren(...['All', ...themesOf(field)].map(t => tab(t, t === theme, () => { playSound('select'); theme = t; picked = null; draw(); grid.scrollTop = 0; })));
    const list = papers(field).filter(s => s.price && (theme === 'All' || s.theme === theme));
    list.sort((x, y) => onSale(b, field, y) - onSale(b, field, x) || ownsPaper(b, field, x) - ownsPaper(b, field, y) || x.price - y.price);
    grid.replaceChildren(...list.map(s => {
      const have = ownsPaper(b, field, s), sale = !have && onSale(b, field, s), cost = paperPrice(b, field, s);
      const tile = el('button', `gcat-tile${have ? ' sold' : ''}${sale ? ' pcat-sale' : ''}${picked === s.id ? ' pcat-picked' : ''}`);
      tile.type = 'button';
      const box = el('span', 'gcat-box'), price = el('span', 'gcat-price');
      box.append(art(field, s.id));
      if (have) price.textContent = 'OWNED';
      else price.append(smoothIcon('coin', 'gcat-coin'), cost.toLocaleString());
      tile.append(box, el('span', 'gcat-name', sale ? `${s.name} ½` : s.name), price);
      tile.addEventListener('click', () => {
        if (have) { playSound('cancel'); return line(`You have ${s.name} already. Put it up from Decorate in your Secret Base!`); }
        if (picked !== s.id) {
          playSound('select'); picked = s.id; draw();
          return line(`${s.name}${sale ? ', half price today' : ''}: ${cost.toLocaleString()} PokéCoins. Tap it again to buy.`);
        }
        picked = null;
        if ((getSave().coins ?? 0) < cost) { playSound('cancel'); draw(); return line(`That's ${cost.toLocaleString()} PokéCoins. You're a little short.`); }
        if (!buyPaper(b, field, s, false)) { playSound('cancel'); return; }
        playSound('buy');
        refreshCoins();
        draw();
        line(`Thank you! ${s.name} is yours. Put it up from Decorate in your Secret Base.`);
      });
      return tile;
    }));
  };
  line('Every wallpaper and floor I paint, always in stock. One of each is half price every day!');
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(garden); }, { once: true });
    close.addEventListener('click', () => { playSound('cancel'); d.close(); });
    d.showModal();
  });
}
