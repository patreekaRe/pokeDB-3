/* grand-shop.js  -  the Grand Catalogue (2026-10-16, js/data/catalogue.js): big things to save PokéCoins for, always in
   stock, opened by Gardevoir in the Furniture store's Grand Ballroom (3F; it was the Clearing's PC's for an hour). Two
   tabs: a gold statue of each starter you own (another copy at full price; one you don't own yet shows dark, Mewtwo's
   not at all till it's yours), and the Pokédex shells, worn at once when bought and switched from Settings after. Its
   window is a gateway town shop's with Kurt's Workshop's tabs. */

import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el, refreshCoins, confirmDialog } from './ui.js';
import { PIECES, loadBase, buyPiece } from './secret-base.js';
import { STARTERS } from './data/starters.js';
import { isStarterUnlocked } from './progress.js';
import { statueKind, LUXURY_SHELLS } from './data/catalogue.js';
import { loadStatues } from './base-furniture-statues.js';
import { wearShell } from './settings.js';

const coins = () => getSave().coins ?? 0;
const n = (v) => v.toLocaleString();
const hasBase = () => { const s = getSave(); return !!(s.baseOwned || s.secretBase?.v >= 2); };
/** The starters whose statue is listed: all but Mewtwo, and Mewtwo once it's yours. */
const listed = () => STARTERS.filter(s => !s.secret || isStarterUnlocked(s));

function statueArt(kind, dark) {
  const a = PIECES[kind].art(0, 2), c = document.createElement('canvas');
  c.width = a.width; c.height = a.height;
  const g = c.getContext('2d');
  if (dark) g.filter = 'brightness(0) opacity(0.45)';
  g.drawImage(a, 0, 0);
  c.className = 'tshop-pic';
  return c;
}

function shellArt(swatch) {
  const d = el('span', 'tshop-pic gshop-shell');
  d.style.setProperty('--sw', swatch);
  return d;
}

/** Open the catalogue. `done` runs once it's closed (the PC's menu again). */
export function openGrandShop(done) {
  const d = el('dialog', 'dialog dev-window town-shop workshop grand-shop');
  const head = el('h2', '', 'GRAND CATALOGUE');
  const tabs = el('div', 'wshop-tabs gshop-tabs'), say = el('p', 'tshop-say'), grid = el('div', 'tshop-grid'), screen = el('div', 'dev-screen');
  screen.append(tabs, say, grid);
  const close = el('button', 'btn secondary', 'Close'), buy = el('button', 'btn danger', 'Buy');
  const acts = el('div', 'dialog-actions');
  acts.append(close, buy);
  d.append(head, screen, acts);
  document.body.append(d);
  let tab = 'statues', picked = null, ready = false;
  const line = (t) => { say.textContent = t; };
  const welcome = () => line(tab === 'statues'
    ? (hasBase() ? `A gold statue of any starter you own, for your Secret Base. You have ${n(coins())} PokéCoins.` : 'Statues stand in a Secret Base: make the Ancient Tree\'s house yours first.')
    : `A new colour for your Pokédex, worn at once. Switch back any time in Settings. You have ${n(coins())} PokéCoins.`);

  const tile = (pic, name, price, { on, sold, tap }) => {
    const b = el('button', `tshop-tile${on ? ' on' : ''}${sold ? ' sold' : ''}`);
    b.type = 'button';
    b.append(pic, el('span', 'tshop-name', name), el('span', 'tshop-price', price));
    b.addEventListener('click', tap);
    return b;
  };

  const draw = () => {
    tabs.replaceChildren(...[['statues', 'Statues'], ['shells', 'Shells']].map(([id, name]) => {
      const t = el('button', `wshop-tab${tab === id ? ' on' : ''}`, name);
      t.type = 'button';
      t.addEventListener('click', () => { if (tab === id) return; playSound('select'); tab = id; picked = null; welcome(); draw(); });
      return t;
    }));
    const save = getSave();
    if (tab === 'statues') {
      if (!ready) { grid.replaceChildren(el('p', 'tshop-empty', 'Unpacking the statues…')); buy.disabled = true; return; }
      const owned = loadBase().owned || {};
      grid.replaceChildren(...listed().map(s => {
        const kind = statueKind(s.id), p = PIECES[kind], mine = isStarterUnlocked(s), have = owned[kind] || 0;
        return tile(statueArt(kind, !mine), p.name, mine ? (have ? `OWNED${have > 1 ? ` ×${have}` : ''}` : n(p.price)) : 'LOCKED', {
          on: picked === kind, sold: !mine,
          tap: () => {
            if (!mine) { playSound('cancel'); return line(`Unlock ${s.line[0].name} first, and its statue is yours to buy.`); }
            playSound('confirm');
            picked = kind;
            line(have ? `Another ${p.name}? ${n(p.price)} PokéCoins, the same as the first.` : `The ${p.name}, in gold on a marble pedestal. ${n(p.price)} PokéCoins.`);
            draw();
          },
        });
      }));
      buy.disabled = !picked || !hasBase();
      return;
    }
    const mine = save.shells || [];
    grid.replaceChildren(...LUXURY_SHELLS.map(sh => {
      const have = mine.includes(sh.id), worn = save.shell === sh.id;
      return tile(shellArt(sh.swatch), `${sh.name} shell`, worn ? 'WEARING' : have ? 'OWNED' : n(sh.price), {
        on: picked === sh.id,
        tap: () => {
          if (have) {
            playSound('select');
            picked = null;
            wearShell(sh.id);
            line(`You're wearing the ${sh.name} shell. Settings > Device colour switches it.`);
            return draw();
          }
          playSound('confirm');
          picked = sh.id;
          line(`The ${sh.name} shell for your Pokédex. ${n(sh.price)} PokéCoins.`);
          draw();
        },
      });
    }));
    buy.disabled = !picked;
  };

  buy.addEventListener('click', async () => {
    const shell = LUXURY_SHELLS.find(s => s.id === picked), p = shell ? null : PIECES[picked];
    const name = shell ? `${shell.name} shell` : p?.name, price = shell ? shell.price : p?.price;
    if (!name) return;
    if (coins() < price) { playSound('cancel'); return line(`That's ${n(price)} PokéCoins, and you have ${n(coins())}. ${n(price - coins())} to go!`); }
    if (!(await confirmDialog(`Buy the ${name} for ${n(price)} PokéCoins?${shell ? '' : ' It goes to your Secret Base\'s storage.'}`, 'Buy'))) return;
    if (shell) {
      if (coins() < price) return;
      updateSave(s => { s.coins -= price; s.shells = [...(s.shells || []), shell.id]; });
      wearShell(shell.id);
    } else if (!buyPiece(loadBase(), picked)) { playSound('cancel'); return; }
    playSound('buy');
    refreshCoins();
    line(shell ? `Your Pokédex is ${shell.name.toLowerCase()} now! Settings > Device colour switches it back.` : `The ${name} is in your storage. Decorate your Secret Base to put it out!`);
    picked = null;
    draw();
  });

  welcome();
  draw();
  loadStatues(listed().map(s => s.id)).then(() => { ready = true; if (d.isConnected) draw(); });
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(); done?.(); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}
