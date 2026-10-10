/* gachapon.js  -  the Game Corner's capsule machine (the revamp, 2026-10-10): the Secret Base's big Pokémon dolls,
   sold nowhere else. A week's set of GACHA_SET dolls (js/data/corner.js), the same for everyone; a pull is GACHA_PRICE
   PokéCoins, opens one of them into the base's storage, and a doll you already own gives GACHA_REFUND back instead.
   The pull is rolled on the week and the pull's number, so a refresh opens the same capsule. */

import { GACHA_SET, GACHA_PRICE, GACHA_REFUND, gachaSet, gachaPull } from './data/corner.js';
import { towerWeek } from './data/tower.js';
import { PIECES, DESIGNS } from './base-furniture.js';
import { loadBase, isCapsule } from './secret-base.js';
import { getSave, updateSave } from './storage.js';
import { playSound, preloadSounds } from './audio.js';
import { el, refreshCoins, sleep } from './ui.js';
import { trim } from './hd2d.js';

/** Every capsule doll: the big ones. js/secret-base.js keeps them out of the Furniture store. */
export const CAPSULE_DOLLS = DESIGNS.filter(isCapsule);

const CAPSULE_COLOURS = ['#f05a6a', '#4a9ae8', '#f8c840', '#6ac868', '#b07af0', '#f08ac8', '#40c8c0', '#f09a40'];

let root = null, busy = false, opened = null, onClose = null;

const week = () => towerWeek();
const theSet = () => gachaSet(week(), CAPSULE_DOLLS);
/** Pulls made this week (a new week starts again at 0). */
const pulls = () => { const g = getSave().corner?.gacha; return g?.week === week() ? g.pulls : 0; };
const owned = (b, id) => (b.owned[PIECES[id].own] || 0) > 0;

export function openGachapon(close) {
  onClose = close ?? null;
  preloadSounds('creak', 'ball-open', 'item-get', 'coins');
  busy = false; opened = null;
  root?.remove();
  root = el('div', 'cg-overlay gp');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Gachapon');
  root.addEventListener('pointerdown', (e) => { if (e.target === root && !busy) shut(); });
  document.body.append(root);
  document.addEventListener('keydown', onKey, true);
  render();
}

function onKey(e) {
  if (e.key !== 'Escape' || !root || busy) return;
  e.stopPropagation();
  shut();
}

function shut() {
  playSound('cancel', 'confirm');
  document.removeEventListener('keydown', onKey, true);
  root?.remove();
  root = null;
  refreshCoins();
  onClose?.();
}

const arts = new Map();
/** A doll's painting, front on, cut to its pixels (painted once a page load). */
function art(id) {
  if (!arts.has(id)) arts.set(id, trim(PIECES[id].art(0, 4)).c);
  const a = arts.get(id), c = document.createElement('canvas');
  c.width = a.width; c.height = a.height;
  c.getContext('2d').drawImage(a, 0, 0);
  c.className = 'gp-art';
  return c;
}

function render() {
  const b = loadBase(), set = theSet(), coins = getSave().coins ?? 0;
  const head = el('div', 'gp-head');
  head.append(el('strong', 'gp-title', 'GACHAPON'), el('span', 'gp-week', `${set.filter(id => owned(b, id)).length}/${GACHA_SET} this week`));

  const machine = el('div', `gp-machine${busy ? ' turning' : ''}`);
  const dome = el('div', 'gp-dome');
  for (let i = 0; i < 14; i++) {
    const cap = el('span', 'gp-capsule');
    cap.style.setProperty('--c', CAPSULE_COLOURS[i % CAPSULE_COLOURS.length]);
    cap.style.setProperty('--x', `${8 + (i * 37) % 76}%`);
    cap.style.setProperty('--y', `${44 + (i * 23) % 44}%`);
    dome.append(cap);
  }
  const base = el('div', 'gp-base');
  base.append(el('span', 'gp-knob'), el('span', 'gp-slot'));
  machine.append(dome, base);

  const show = el('div', 'gp-show');
  if (opened) {
    const card = el('div', `gp-won${opened.dupe ? ' dupe' : ''}`);
    card.append(art(opened.id), el('b', '', PIECES[opened.id].name),
      el('span', '', opened.dupe ? `You have it already: ${GACHA_REFUND} PokéCoins back.` : 'New! It\'s in your Secret Base\'s storage.'));
    show.append(card);
  } else show.append(machine);

  const shelf = el('div', 'gp-set');
  for (const id of set) {
    const cell = el('div', `gp-cell${owned(b, id) ? ' have' : ''}`);
    cell.title = PIECES[id].name;
    cell.append(art(id));
    if (owned(b, id)) cell.append(el('span', 'gp-tick', '✓'));
    shelf.append(cell);
  }

  const say = el('p', 'gp-say', `This week's capsules hold big Pokémon dolls you can't buy anywhere else. ${GACHA_PRICE} PokéCoins a turn; a doll you already have gives ${GACHA_REFUND} back. New dolls every Monday.`);

  const keys = el('div', 'gp-keys');
  const turn = el('button', 'vf-key vf-go', opened ? `Again · ${GACHA_PRICE}` : `Turn · ${GACHA_PRICE}`);
  turn.type = 'button';
  turn.disabled = busy || coins < GACHA_PRICE;
  turn.addEventListener('click', pull);
  const close = el('button', 'vf-key vf-close', 'Close');
  close.type = 'button';
  close.disabled = busy;
  close.addEventListener('click', shut);
  keys.append(turn, close);

  const panel = el('div', 'gp-panel');
  panel.append(head, show, shelf, say, keys);
  root.replaceChildren(panel);
}

async function pull() {
  if (busy || (getSave().coins ?? 0) < GACHA_PRICE) return;
  const b = loadBase(), n = pulls(), id = gachaPull(week(), n, theSet()), dupe = owned(b, id);
  if (!dupe) b.owned[PIECES[id].own] = (b.owned[PIECES[id].own] || 0) + 1;
  updateSave(d => {
    d.coins -= GACHA_PRICE - (dupe ? GACHA_REFUND : 0);
    d.corner = { ...d.corner, gacha: { week: week(), pulls: n + 1 } };
    d.secretBase = b;
  });
  refreshCoins();
  busy = true; opened = null;
  playSound('creak', 'stick');
  render();
  await sleep(matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 1100);
  if (!root) return;
  playSound('ball-open', 'confirm');
  busy = false; opened = { id, dupe };
  render();
  playSound(dupe ? 'coins' : 'item-get', 'buy');
}
