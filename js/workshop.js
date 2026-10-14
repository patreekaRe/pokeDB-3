/* workshop.js  -  Kurt's Workshop (docs/roadmap.md's Towns step 6, session 3; its recipes: js/data/workshop.js). The save's
   side (making a thing, handing a Gym Leader a gift, carrying an Apricorn skin) and its window: the device's
   (.dev-window), a shelf a tab (Quest, Furniture, Gifts, Apricorns), a tap picks a recipe and Make makes it. Kurt is
   walked to in his house in the Clearing (js/run.js's homeRoom(), js/data/towns.js's CLEARING). */

import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el } from './ui.js';
import { satchelOf, addKey, KEY_BY_ID, MATERIALS_BY_ID } from './data/satchel.js';
import { RECIPES, TABS, GIFTS, GIFT_BY_ID, workshopOf, shortOf, isMade, shows, spend, madeInto, giveGift, needsLine } from './data/workshop.js';
import { RING, townState } from './data/towns.js';
import { GYM_BY_ID, gymWins } from './data/gym.js';
import { PIECES } from './secret-base.js';

/** What the Workshop can see of the save, for shows(). */
const seen = (save) => ({ towns: Object.fromEntries(RING.map(t => [t.id, townState(save, t.id)])), wins: (id) => gymWins(save, id) || 0 });

/** The recipes on a shelf now. */
export const shelf = (tab, save = getSave()) => RECIPES.filter(r => r.kind === tab && shows(r, seen(save)));

/** Make a recipe: its materials out of the Satchel (the `?satchel` loan counts toward having them), the thing in. False
    if it's short or made already. */
export function craft(recipe) {
  const save = getSave();
  if (shortOf(recipe, satchelOf(save)).length || isMade(recipe, workshopOf(save), satchelOf(save))) return false;
  updateSave(d => {
    let sat = spend(recipe, satchelOf(d, false));
    if (recipe.kind === 'key') sat = addKey(sat, recipe.makes);
    d.satchel = sat;
    d.workshop = madeInto(recipe, workshopOf(d));
  });
  return true;
}

/** Hand `leader` a gift held: { favourite, first } (first: their signature piece just earned), or null. */
export function handGift(giftId, leader) {
  const out = giveGift(workshopOf(getSave()), giftId, leader);
  if (out.ws === workshopOf(getSave())) return null;
  updateSave(d => { d.workshop = giveGift(workshopOf(d), giftId, leader).ws; });
  return { favourite: out.favourite, first: out.first };
}

/** Carry an Apricorn skin made (or none: `id` null) as the Safari Ball's look. */
export const carrySkin = (id) => updateSave(d => { d.workshop = { ...workshopOf(d), skin: id }; });

/** The gifts held, [{ gift, n }]. */
export const giftsHeld = (save = getSave()) => GIFTS.map(g => ({ gift: g, n: workshopOf(save).gifts[g.makes] || 0 })).filter(o => o.n > 0);

const KURT = 'KURT';
const nameOf = (r) => (r.kind === 'key' ? KEY_BY_ID[r.makes].name : r.name);

function art(r) {
  if (r.kind === 'piece' && PIECES[r.makes]) {
    const a = PIECES[r.makes].art(0, 2), c = document.createElement('canvas');
    c.width = a.width; c.height = a.height;
    c.getContext('2d').drawImage(a, 0, 0);
    c.className = 'tshop-pic';
    return c;
  }
  if (r.kind === 'skin') {
    const img = el('img', 'tshop-pic pixel');
    img.src = `assets/items/${r.sprite}.png`;
    img.alt = '';
    return img;
  }
  return el('span', 'tshop-pic wshop-glyph', r.kind === 'key' ? KEY_BY_ID[r.makes].icon : r.icon);
}

const EMPTY = {
  key: 'Nothing to make for the towns yet. Once a town\'s Gym Leader asks for something, bring me its materials.',
  piece: 'Visit a town out on the roads and I\'ll learn its furniture. They make lovely things out there.',
  gift: 'Beaten a Gym Leader? Come back and I\'ll tell you what they\'d love.',
  skin: '',
};
const ABOUT = {
  key: 'For the towns\' Waystones. Bring me materials from the roads and I\'ll make what they need.',
  piece: 'Furniture you can\'t buy anywhere. Made here, sent to your Secret Base.',
  gift: 'Every Gym Leader has a favourite. Give it to them at home and they won\'t forget it.',
  skin: 'Apricorns! A Safari Ball made from one throws just the same. It only looks better.',
};

/** Open the Workshop's window. Resolves once it's closed. */
export function openWorkshop() {
  const d = el('dialog', 'dialog dev-window town-shop workshop');
  const head = el('h2', '', 'KURT\'S WORKSHOP');
  const tabs = el('div', 'wshop-tabs');
  const say = el('p', 'tshop-say');
  const grid = el('div', 'tshop-grid');
  const screen = el('div', 'dev-screen');
  screen.append(tabs, say, grid);
  const close = el('button', 'btn secondary', 'Close'), make = el('button', 'btn danger', 'Make');
  const acts = el('div', 'dialog-actions');
  acts.append(close, make);
  d.append(head, screen, acts);
  document.body.append(d);
  let tab = 'key', picked = null;
  const line = (t) => { say.textContent = `${KURT}: ${t}`; };
  const draw = () => {
    const save = getSave(), sat = satchelOf(save), ws = workshopOf(save), list = shelf(tab, save);
    tabs.replaceChildren(...TABS.map(t => {
      const b = el('button', `wshop-tab${t.id === tab ? ' on' : ''}`, t.name);
      b.type = 'button';
      b.addEventListener('click', () => { if (tab === t.id) return; playSound('select'); tab = t.id; picked = null; line(ABOUT[tab]); draw(); });
      return b;
    }));
    grid.replaceChildren(...(list.length ? list.map(r => {
      const done = isMade(r, ws, sat), short = shortOf(r, sat).length > 0, carried = r.kind === 'skin' && ws.skin === r.makes;
      const tile = el('button', `tshop-tile${picked === r.id ? ' on' : ''}${done && r.kind !== 'skin' ? ' sold' : ''}`);
      tile.type = 'button';
      const note = carried ? 'CARRIED' : done ? 'MADE' : r.kind === 'gift' && ws.gifts[r.makes] ? `HELD ×${ws.gifts[r.makes]}` : needsLine(r, sat);
      tile.append(art(r), el('span', 'tshop-name', nameOf(r)), el('span', `tshop-price${short && !done ? ' short' : ''}`, note));
      tile.addEventListener('click', () => {
        playSound('confirm');
        picked = r.id;
        line(about(r, ws, sat));
        draw();
      });
      return tile;
    }) : [el('p', 'tshop-empty', EMPTY[tab])]));
    const r = list.find(o => o.id === picked);
    const madeSkin = r?.kind === 'skin' && isMade(r, ws, sat);
    make.textContent = madeSkin ? (ws.skin === r.makes ? 'Put away' : 'Carry') : 'Make';
    make.disabled = !r || (!madeSkin && (isMade(r, ws, sat) || shortOf(r, sat).length > 0));
  };
  const about = (r, ws, sat) => {
    if (r.kind === 'skin' && isMade(r, ws, sat)) return `${r.name}. ${ws.skin === r.makes ? 'Your Safari Balls look like this now.' : 'Carry it and your Safari Balls will look like this.'}`;
    if (isMade(r, ws, sat)) return r.kind === 'key' ? `The ${nameOf(r)}'s in your Satchel already.` : `The ${nameOf(r)}'s made. It's in your Secret Base.`;
    const short = shortOf(r, sat);
    const need = short.length ? ` I still need ${short.map(m => `${m.need - m.have} ${MATERIALS_BY_ID[m.id].name}`).join(' and ')}.` : ' I can make it now.';
    if (r.kind === 'gift') return `${r.name}, ${GYM_BY_ID[r.leader].name}'s favourite. ${r.text}${need}`;
    if (r.kind === 'skin') return `${r.name}. ${r.text}${need}`;
    if (r.kind === 'key') return `${nameOf(r)}. ${KEY_BY_ID[r.makes].text}${need}`;
    return `A ${nameOf(r)}, made by hand.${need}`;
  };
  make.addEventListener('click', () => {
    const r = RECIPES.find(o => o.id === picked);
    if (!r) return;
    const ws = workshopOf(getSave());
    if (r.kind === 'skin' && ws.made.includes(r.id)) {
      const on = ws.skin !== r.makes;
      carrySkin(on ? r.makes : null);
      playSound(on ? 'confirm' : 'cancel');
      line(on ? `There! Your Safari Balls are ${r.name}s now. They catch just the same.` : 'Back to plain Safari Balls. Good old things.');
      return draw();
    }
    if (!craft(r)) { playSound('cancel'); return draw(); }
    playSound('item-get');
    line(r.kind === 'key' ? `Done! The ${nameOf(r)}'s in your Satchel. Take it to them.`
      : r.kind === 'piece' ? `Done! The ${nameOf(r)}'s gone to your Secret Base.`
        : r.kind === 'gift' ? `Done! Take the ${r.name} to ${GYM_BY_ID[r.leader].name}'s home. Or anyone's.`
          : `Done! A ${r.name}. Tap it again to carry it.`);
    draw();
  });
  line('Ah, a customer! I make Apricorn balls, mostly. These days the towns keep me busy too. What\'ll it be?');
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}

/** Pick a gift to hand `leader` (their home's Gift option): resolves the gift's id, or null. */
export function pickGift(leader) {
  const d = el('dialog', 'dialog dev-window town-shop workshop');
  const grid = el('div', 'tshop-grid'), say = el('p', 'tshop-say', `Give ${GYM_BY_ID[leader]?.name ?? 'them'} which gift?`);
  const screen = el('div', 'dev-screen');
  screen.append(say, grid);
  const close = el('button', 'btn secondary', 'Not now'), acts = el('div', 'dialog-actions');
  acts.append(close);
  d.append(el('h2', '', 'GIFTS'), screen, acts);
  document.body.append(d);
  let chosen = null;
  grid.append(...giftsHeld().map(({ gift, n }) => {
    const tile = el('button', 'tshop-tile');
    tile.type = 'button';
    tile.append(art(gift), el('span', 'tshop-name', gift.name), el('span', 'tshop-price', `×${n}`));
    tile.addEventListener('click', () => { chosen = gift.makes; d.close(); });
    return tile;
  }));
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(chosen); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}

export { GIFT_BY_ID };
