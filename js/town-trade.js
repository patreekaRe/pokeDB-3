/* town-trade.js  -  a gateway town's one trade in a run (the user's ask, 2026-10-15: it was one offer rolled at random,
   take it or leave it). The trader's window (the town shop's .dev-window): your Bag on top, tap the item to give, and
   up to TRADE_OFFERS items of its rarity from your type's that you don't hold come up under it; pick one, then Trade.
   Still a sidegrade, once per town per run, so no bot check. The offers are rolled once into `run.town.trade` (rollTrade()
   in js/run.js), so a refresh can't reroll them. */

import { playSound } from './audio.js';
import { el, itemSprite } from './ui.js';
import { ITEMS_BY_ID } from './data/items.js';

export const TRADE_OFFERS = 3;

/** What the trader gives for `give` (an item id): the first TRADE_OFFERS of its rarity's rolled order you don't hold. */
export const offersFor = (offers, give, held) =>
  (offers[ITEMS_BY_ID[give]?.rarity] || []).filter(id => ITEMS_BY_ID[id] && !held.includes(id)).slice(0, TRADE_OFFERS);

function tile(item, cls, note = '') {
  const t = el('button', `tshop-tile ${cls}`);
  t.type = 'button';
  t.append(itemSprite(item, 'tshop-pic ttrade-pic'), el('span', 'tshop-name', item.name));
  if (note) t.append(el('span', 'tshop-price', note));
  return t;
}

/** Open the trader's window. `trader` is the town's (js/data/towns.js), `held` the Bag's ids, `offers` the rolled
    { rarity: [ids] }. Resolves to { give, get } once a trade is made, or null if closed. */
export function pickTrade(trader, held, offers) {
  const d = el('dialog', 'dialog dev-window town-shop town-trade');
  const say = el('p', 'tshop-say'), info = el('p', 'ttrade-info');
  const bag = el('div', 'tshop-grid'), theirs = el('div', 'tshop-grid');
  const theirHead = el('h3', 'ttrade-head', `${trader.name.toUpperCase()} OFFERS`);
  const screen = el('div', 'dev-screen');
  screen.append(say, el('h3', 'ttrade-head', 'YOUR BAG'), bag, theirHead, theirs, info);
  const close = el('button', 'btn secondary', 'Not now'), trade = el('button', 'btn danger', 'Trade');
  const acts = el('div', 'dialog-actions');
  acts.append(close, trade);
  d.append(el('h2', '', 'TRADE'), screen, acts);
  document.body.append(d);
  let give = null, get = null, done = null;
  const line = (t) => { say.textContent = `${trader.name}: ${t}`; };
  const tell = (item) => { info.textContent = item ? `${item.name}: ${item.text}` : ''; };
  const draw = () => {
    bag.replaceChildren(...held.map((id, i) => {
      const item = ITEMS_BY_ID[id], none = !offersFor(offers, id, held).length;
      const t = tile(item, `${give === i ? 'on' : ''}${none ? ' sold' : ''}`, none ? 'No offer' : '');
      t.addEventListener('click', () => {
        tell(item);
        if (none) { playSound('cancel'); return line(`Your ${item.name}? Nothing I've got is worth the same, sorry.`); }
        playSound('confirm');
        give = i; get = null;
        line(`Your ${item.name}? Pick what you'd like for it.`);
        draw();
      });
      return t;
    }));
    const list = give === null ? [] : offersFor(offers, held[give], held);
    theirHead.hidden = theirs.hidden = !list.length;
    theirs.replaceChildren(...list.map(id => {
      const item = ITEMS_BY_ID[id], t = tile(item, get === id ? 'on' : '');
      t.addEventListener('click', () => {
        playSound('confirm');
        get = id;
        tell(item);
        line(trader.offer.replace('{give}', ITEMS_BY_ID[held[give]].name).replace('{get}', item.name));
        draw();
      });
      return t;
    }));
    trade.disabled = give === null || !get;
  };
  trade.addEventListener('click', () => {
    if (give === null || !get) return;
    done = { give: held[give], get };
    d.close();
  });
  line('Got something to swap? Pick an item from your Bag.');
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(done); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });   // a tap outside the window closes it
    d.showModal();
  });
}
