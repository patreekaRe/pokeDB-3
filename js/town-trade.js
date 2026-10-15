/* town-trade.js  -  a gateway town's one trade in a run (the user's ask, 2026-10-15: it was one offer rolled at random,
   take it or leave it). Since the same day an MMO's trade window (the user's ask: "clearer, and visual"): you on the
   left and the trader on the right, each with an offer slot, a swap between them, your Bag under yours and their
   offers under theirs. Tap a Bag item to put it up, then one of up to TRADE_OFFERS items of its rarity from your type's
   that you don't hold; Trade readies you, then them, and the two items cross over. Still a sidegrade, once per town per
   run, so no bot check. The offers are rolled once into `run.town.trade` (rollTrade() in js/run.js), so a refresh can't
   reroll them. */

import { playSound } from './audio.js';
import { el, itemSprite } from './ui.js';
import { calmFx } from './prefs.js';
import { ITEMS_BY_ID } from './data/items.js';

export const TRADE_OFFERS = 3;

/** What the trader gives for `give` (an item id): the first TRADE_OFFERS of its rarity's rolled order you don't hold. */
export const offersFor = (offers, give, held) =>
  (offers[ITEMS_BY_ID[give]?.rarity] || []).filter(id => ITEMS_BY_ID[id] && !held.includes(id)).slice(0, TRADE_OFFERS);

const wait = (ms) => new Promise(r => setTimeout(r, calmFx() ? 0 : ms));

/** An inventory square: the item's picture, its rarity on its rim. */
function cell(item, cls = '') {
  const b = el('button', `tw-cell ${cls} rar-${item.rarity}`);
  b.type = 'button';
  b.title = item.name;
  b.append(itemSprite(item, 'tw-pic'));
  return b;
}

/** One side of the table: who, their offer slot, and a tag under it. */
function side(cls, name, src) {
  const box = el('div', `tw-side ${cls}`), who = el('div', 'tw-who');
  const face = el('img', 'tw-face');
  face.src = src; face.alt = ''; face.draggable = false;
  who.append(face, el('b', '', name));
  const slot = el('div', 'tw-slot'), tag = el('span', 'tw-tag');
  box.append(who, slot, tag, el('span', 'tw-ready', 'READY'));
  return { box, slot, tag };
}

/** Open the trader's window. `trader` is the town's (js/data/towns.js), `held` the Bag's ids, `offers` the rolled
    { rarity: [ids] }, `you` your partner { src, name } for your side. Resolves to { give, get } once a trade is made,
    or null if closed. */
export function pickTrade(trader, held, offers, you) {
  const d = el('dialog', 'dialog dev-window town-shop town-trade');
  const say = el('p', 'tshop-say'), info = el('p', 'ttrade-info');
  const mine = side('you', you?.name?.toUpperCase() || 'YOU', you?.src || '');
  const theirs = side('them', trader.name.toUpperCase(), `assets/pokemon/${trader.id}-front.gif`);
  const swap = el('div', 'tw-swap');
  swap.append(el('span', 'tw-arrow r', '▶'), el('span', 'tw-arrow l', '◀'));
  const table = el('div', 'tw-table');
  table.append(mine.box, swap, theirs.box);
  const bag = el('div', 'tw-grid'), stock = el('div', 'tw-grid');
  const theirHead = el('h3', 'ttrade-head', `${trader.name.toUpperCase()}'S OFFERS`);
  const pools = el('div', 'tw-pools'), left = el('section'), right = el('section');
  left.append(el('h3', 'ttrade-head', 'YOUR BAG'), bag);
  right.append(theirHead, stock);
  pools.append(left, right);
  const banner = el('div', 'tw-done', 'TRADE COMPLETE!');
  const screen = el('div', 'dev-screen');
  screen.append(say, table, pools, info, banner);
  const close = el('button', 'btn secondary', 'Not now'), trade = el('button', 'btn danger', 'Trade');
  const acts = el('div', 'dialog-actions');
  acts.append(close, trade);
  d.append(el('h2', '', 'TRADE'), screen, acts);
  document.body.append(d);
  let give = null, get = null, done = null, busy = false;
  const line = (t) => { say.textContent = `${trader.name}: ${t}`; };
  const tell = (item) => {
    info.replaceChildren();
    if (item) info.append(el('b', '', item.name), el('span', `tw-rar rar-${item.rarity}`, item.rarity), ` ${item.text}`);
  };
  const fill = (s, id, empty) => {
    s.slot.replaceChildren(id ? itemSprite(ITEMS_BY_ID[id], 'tw-pic') : el('span', 'tw-q', '?'));
    s.slot.className = `tw-slot${id ? ` full rar-${ITEMS_BY_ID[id].rarity}` : ''}`;
    s.tag.textContent = id ? ITEMS_BY_ID[id].name : empty;
  };
  const draw = () => {
    fill(mine, give === null ? null : held[give], 'Pick from your Bag');
    fill(theirs, get, give === null ? 'Waiting…' : 'Pick an offer');
    bag.replaceChildren(...held.map((id, i) => {
      const item = ITEMS_BY_ID[id], none = !offersFor(offers, id, held).length;
      const c = cell(item, `${give === i ? 'on' : ''}${none ? ' none' : ''}`);
      c.addEventListener('click', () => {
        if (busy) return;
        tell(item);
        if (none) { playSound('cancel'); return line(`Your ${item.name}? Nothing I've got is worth the same, sorry.`); }
        playSound('confirm');
        give = i; get = null;
        line(`Your ${item.name}? Pick what you'd like for it.`);
        draw();
      });
      return c;
    }));
    const list = give === null ? [] : offersFor(offers, held[give], held);
    stock.replaceChildren(...(list.length ? list.map(id => {
      const item = ITEMS_BY_ID[id], c = cell(item, get === id ? 'on' : '');
      c.addEventListener('click', () => {
        if (busy) return;
        playSound('confirm');
        get = id;
        tell(item);
        line(trader.offer.replace('{give}', ITEMS_BY_ID[held[give]].name).replace('{get}', item.name));
        draw();
      });
      return c;
    }) : Array.from({ length: TRADE_OFFERS }, () => el('span', 'tw-cell locked', '?'))));
    theirHead.classList.toggle('dim', !list.length);
    table.classList.toggle('set', give !== null && !!get);
    trade.disabled = give === null || !get;
  };
  // both sides ready, then the two items cross the table (an MMO's two ticks), and the window closes on its own
  trade.addEventListener('click', async () => {
    if (give === null || !get || busy) return;
    busy = true;
    trade.disabled = close.disabled = true;
    d.classList.add('busy');
    mine.box.classList.add('ready');
    playSound('confirm');
    line('Deal!');
    await wait(450);
    theirs.box.classList.add('ready');
    playSound('confirm');
    await wait(350);
    const a = mine.slot.firstElementChild, b = theirs.slot.firstElementChild;
    const dx = theirs.slot.getBoundingClientRect().left - mine.slot.getBoundingClientRect().left;
    if (!calmFx() && a && b) {
      table.classList.add('crossing');
      a.style.transform = `translate(${dx}px, -18px)`;
      b.style.transform = `translate(${-dx}px, 18px)`;
      await wait(520);
    }
    table.classList.remove('crossing');
    const was = held[give];
    fill(mine, get, ''); fill(theirs, was, '');
    banner.classList.add('on');
    await wait(1100);
    done = { give: was, get };
    d.close();
  });
  line('Got something to swap? Pick an item from your Bag.');
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(done); }, { once: true });
    d.addEventListener('cancel', (e) => { if (busy) e.preventDefault(); });
    close.addEventListener('click', () => d.close());
    d.addEventListener('click', (e) => { if (e.target === d && !busy) d.close(); });   // a tap outside the window closes it
    d.showModal();
  });
}
