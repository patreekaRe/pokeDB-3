/* ============================================================
   shop.js  -  the shop screen: spend PokéCoins on skins and
   permanent passive perks. What's for sale lives in data/shop.js;
   this file just renders it and handles buying.
   ============================================================ */

import { SKIN_SHOP_ITEMS, PASSIVE_SHOP_ITEMS } from './data/shop.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave, updateSave } from './storage.js';
import { checkAchievements } from './progress.js';
import { $, el, refreshCoins, toast } from './ui.js';

/** Toggle the shop dialog open/closed. It's a non-modal dialog (.show(), not
 *  .showModal()) so it floats on top of whatever screen is showing without
 *  blocking it - the map, a battle, a reward choice underneath stays fully
 *  clickable, and the shop button in the topbar stays clickable too, so it
 *  really is a toggle rather than a one-way trip.
 *  highlightId briefly flashes one item (used when you tap a shop-locked starter). */
export function toggleShop(highlightId) {
  const dialog = $('shop-dialog');
  if (dialog.open) return dialog.close();

  render();
  dialog.show();
  $('shop-btn').setAttribute('aria-expanded', 'true');
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

/** "Owned" / "Maxed" with a caught Poké Ball in front, like the games' owned mark. */
function ownedTag(text) {
  const tag = el('span', 'shop-owned');
  const ball = el('span', 'pokeball');
  ball.setAttribute('aria-hidden', 'true');
  tag.append(ball, text);
  return tag;
}

function skinTile(item) {
  const starter = STARTERS_BY_ID[item.id];
  const owned = getSave().unlocked.includes(item.id);

  const node = el('div', 'shop-item');
  node.id = `shop-item-${item.id}`;
  const img = el('img', 'pixel shop-item-sprite');
  img.src = spriteUrl(starter, 'front');
  img.alt = starter.line[0].name;

  node.append(img, el('strong', '', starter.line[0].name));

  if (owned) {
    node.append(ownedTag('Owned'));
  } else {
    const btn = el('button', 'btn small primary', `${item.cost} 💰`);
    btn.setAttribute('aria-label', `Buy ${starter.line[0].name} for ${item.cost} PokéCoins`);
    btn.addEventListener('click', () => buy(item.cost, () => {
      updateSave(d => { d.unlocked.push(item.id); });
      toast(`${starter.line[0].name} unlocked!`, 'ok');
      // buying the last missing skin can complete an "unlock everything" goal
      for (const earned of checkAchievements()) toast(`🔓 Unlocked ${earned.line[0].name}!`, 'ok');
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
    node.append(ownedTag('Maxed'));
  } else {
    const cost = item.costs[level];
    const btn = el('button', 'btn small primary', `${cost} 💰`);
    btn.setAttribute('aria-label', `Buy ${item.name} for ${cost} PokéCoins`);
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
