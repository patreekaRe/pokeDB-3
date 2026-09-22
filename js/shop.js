/* ============================================================
   shop.js  -  the shop screen: spend PokéCoins on skins and
   permanent passive perks. What's for sale lives in data/shop.js;
   this file just renders it and handles buying.
   ============================================================ */

import { SKIN_SHOP_ITEMS, PASSIVE_SHOP_ITEMS } from './data/shop.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave, updateSave } from './storage.js';
import { $, el, showScreen, refreshCoins, toast } from './ui.js';

let onClose = () => {};
let returnScreen = 'start-screen';   // whatever screen was showing when you opened the shop

/** Called once at startup. */
export function initShop({ onBack }) {
  onClose = onBack;
  // The shop never abandons a run: it just hides the map/battle screen (the DOM
  // underneath is untouched), so "Back" can simply reveal it again. Only when you
  // opened the shop FROM the start screen does it need the fuller refresh onBack does.
  $('shop-back').addEventListener('click', () => {
    if (returnScreen === 'start-screen') onClose();
    else showScreen(returnScreen);
  });
}

/** Open the shop. highlightId briefly flashes one item (used when you tap a shop-locked starter). */
export function openShop(highlightId) {
  returnScreen = document.body.dataset.screen;
  render();
  showScreen('shop-screen');
  if (highlightId) {
    const item = $(`shop-item-${highlightId}`);
    if (item) { item.scrollIntoView({ block: 'center' }); item.classList.add('flash'); setTimeout(() => item.classList.remove('flash'), 1200); }
  }
}

function render() {
  refreshCoins();
  $('shop-skins').replaceChildren(...SKIN_SHOP_ITEMS.map(skinTile));
  $('shop-passives').replaceChildren(...PASSIVE_SHOP_ITEMS.map(passiveTile));
}

function buy(cost, onBought) {
  const save = getSave();
  if (save.coins < cost) return toast('Not enough PokéCoins yet.', 'warn');
  updateSave(d => { d.coins -= cost; });
  onBought();
  render();
}

function skinTile(item) {
  const starter = STARTERS_BY_ID[item.id];
  const owned = getSave().unlocked.includes(item.id);

  const node = el('div', 'shop-item');
  node.id = `shop-item-${item.id}`;
  const img = el('img', 'pixel shop-item-sprite');
  img.src = spriteUrl(starter, 'front');
  img.alt = starter.line[0].name;

  node.append(img, el('strong', '', starter.line[0].name), el('span', 'shop-item-text', starter.blurb));

  if (owned) {
    node.append(el('span', 'shop-owned', '✅ Owned'));
  } else {
    const btn = el('button', 'btn small primary', `Buy · ${item.cost} 💰`);
    btn.addEventListener('click', () => buy(item.cost, () => {
      updateSave(d => { d.unlocked.push(item.id); });
      toast(`${starter.line[0].name} unlocked!`, 'ok');
    }));
    node.append(btn);
  }
  return node;
}

function passiveTile(item) {
  const level = currentLevel(item);
  const maxed = level >= item.maxLevel;

  const node = el('div', 'shop-item');
  node.id = `shop-item-${item.id}`;
  node.append(el('span', 'shop-item-icon', item.icon), el('strong', '', item.name), el('span', 'shop-item-text', item.text));
  if (item.maxLevel > 1) node.append(el('span', 'shop-item-level', `Level ${level} / ${item.maxLevel}`));

  if (maxed) {
    node.append(el('span', 'shop-owned', '✅ Maxed'));
  } else {
    const cost = item.costs[level];
    const btn = el('button', 'btn small primary', `Buy · ${cost} 💰`);
    btn.addEventListener('click', () => buy(cost, () => {
      updateSave(d => {
        if (item.maxLevel > 1) d.passives[item.id] += 1;
        else d.passives[item.id] = true;
      });
      toast(`${item.name} purchased!`, 'ok');
    }));
    node.append(btn);
  }
  return node;
}

/** How many levels of a passive you already own (stacking ones are a number, others true/false). */
function currentLevel(item) {
  const value = getSave().passives[item.id];
  return typeof value === 'number' ? value : (value ? 1 : 0);
}
