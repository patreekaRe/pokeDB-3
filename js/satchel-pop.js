/* satchel-pop.js  -  a material found on a run pops up over the screen, bobbing in the light like a found relic, then
   flies off into your things (2026-10-18, the user's ask: "i didnt know when i got materials"; the text line alone was
   missed). It never takes a tap, so it can't hold up a reward screen or the map. Finds that come together pop
   together, in a row; the next lot waits its turn. */

import { el } from './ui.js';
import { playSound } from './audio.js';
import { MATERIALS_BY_ID } from './data/satchel.js';

const HOLD = 1500, RISE = 600, FLY = 700;
let queue = Promise.resolve();

/** Pop `finds` ({ id, n } materials) up over the screen, after any still showing. */
export function popFinds(finds) {
  const mats = finds.filter(f => f && MATERIALS_BY_ID[f.id]);
  if (mats.length) queue = queue.then(() => pop(mats)).catch(() => {});
}

/** Where they fly: the Bag on screen (the map's dock, the top bar's, a room bar's), or null to float off upward. */
function bagSpot() {
  for (const q of ['.mdex-btn[data-pocket="items"]', '#bag-btn', '#room-bag']) {
    const r = document.querySelector(q)?.getBoundingClientRect();
    if (r?.width) return r;
  }
  return null;
}

async function pop(mats) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const row = el('div', 'satchel-pop');
  row.setAttribute('role', 'status');
  for (const [i, { id, n }] of mats.entries()) {
    const m = MATERIALS_BY_ID[id], thing = el('div', 'satchel-find'), float = el('span', 'relic-float');
    thing.style.setProperty('--i', i);
    float.append(el('span', 'satchel-glyph', m.icon));
    thing.append(el('span', 'relic-halo'), float, el('span', 'float-label', `${m.name}${n > 1 ? ` ×${n}` : ''}`));
    row.append(thing);
  }
  row.append(el('span', 'satchel-pop-note', 'Into your Satchel!'));
  document.body.append(row);
  playSound('item-get');
  await wait(reduced ? HOLD : RISE + HOLD);
  const to = bagSpot();
  for (const thing of row.querySelectorAll('.satchel-find')) {
    const from = thing.getBoundingClientRect();
    thing.style.setProperty('--to-x', `${to ? to.left + to.width / 2 - (from.left + from.width / 2) : 0}px`);
    thing.style.setProperty('--to-y', `${to ? to.top + to.height / 2 - (from.top + from.height / 2) : -80}px`);
  }
  row.classList.add('taken');
  await wait(reduced ? 200 : FLY);
  row.remove();
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));
