/* pentagram.js  -  the Waystone Shards' progress, shown big (docs/roadmap.md's step 5, the user's design, 2026-10-14): a
   star of five shard slots slid in full screen like a Gym Leader's talk (js/gym.js's .gym-scene, in Mewtwo's violet),
   each placed shard glowing in its town's RING colour, the missing ones dark, Mewtwo in the middle and what its strength
   in the Depths comes to under it. Seen before a Mewtwo run (previewStarter() in js/main.js) and when you talk to Mewtwo
   in the Depths camp (homeRoom() in js/run.js), its lines in the speech window. One small SVG: no canvas, no GPU layer. */

import { el, sleep } from './ui.js';
import { playSound, playCry } from './audio.js';
import { getSave } from './storage.js';
import { battleFx } from './prefs.js';
import { RING, TOWNS, shardsLit } from './data/towns.js';
import { strengthOf } from './data/camp.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';

const NS = 'http://www.w3.org/2000/svg';
const R = 86;   // the points' circle, in the star's own units (its box is 300 x 250)
const point = (i, r = R) => { const a = (-90 + i * 72) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; };

function svg(tag, attrs = {}, parent = null) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.append(n);
  return n;
}

/** The star: its circle and lines, a crystal at each point (lit in its town's colour, or dark), the town's name by it. */
function star(lit) {
  const s = svg('svg', { viewBox: '-150 -118 300 250', class: 'penta-star', 'aria-hidden': 'true' });
  const defs = svg('defs', {}, s);
  const blur = svg('filter', { id: 'penta-glow', x: '-1', y: '-1', width: '3', height: '3' }, defs);
  svg('feGaussianBlur', { stdDeviation: '5' }, blur);
  svg('circle', { r: R + 8, class: 'penta-ring' }, s);
  svg('circle', { r: R - 4, class: 'penta-ring thin' }, s);
  const d = [0, 2, 4, 1, 3, 0].map((i, k) => `${k ? 'L' : 'M'}${point(i).map(v => v.toFixed(1)).join(' ')}`).join(' ');
  svg('path', { d, class: 'penta-lines' }, s);
  RING.forEach((t, i) => {
    const [x, y] = point(i), on = lit[i];
    const g = svg('g', { class: `penta-slot${on ? ' lit' : ''}`, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, style: `--glow: ${t.glow}; --i: ${i}` }, s);
    const gem = 'M0 -15 L9 -4 L6 12 L-6 12 L-9 -4 Z';
    if (on) svg('path', { d: gem, class: 'penta-halo', filter: 'url(#penta-glow)' }, g);
    svg('path', { d: gem, class: 'penta-gem' }, g);
    svg('path', { d: 'M0 -15 L3 -4 L0 12 M-9 -4 L9 -4', class: 'penta-facet' }, g);
    const label = svg('text', { y: i === 0 ? -24 : 30, class: 'penta-name', 'text-anchor': 'middle' }, g);
    label.textContent = TOWNS[t.id]?.name ?? t.id;
  });
  return s;
}

/** One tap on the layer, or Enter / Space (js/gym.js's tap(): pointerup too, for iOS). */
function tap(layer) {
  return new Promise(done => {
    const end = () => {
      layer.removeEventListener('pointerup', end); layer.removeEventListener('click', end);
      document.removeEventListener('keydown', key); done();
    };
    const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); end(); } };
    setTimeout(() => {
      layer.addEventListener('pointerup', end); layer.addEventListener('click', end); document.addEventListener('keydown', key);
    }, 150);
  });
}

/** Slide the pentagram in with Mewtwo's `lines` under it, a tap a line; resolves once it has gone. `lit` (RING order)
    defaults to the save's shards placed. */
export async function showPentagram(lines, { lit = shardsLit(getSave()), cry = false } = {}) {
  const calm = !battleFx();
  const n = lit.filter(Boolean).length;
  const layer = el('div', 'gym-scene psychic penta-scene');
  const top = el('div', 'penta-top');
  const ring = el('div', 'penta-wrap');
  const mon = el('img', 'penta-mon pixel');
  mon.src = spriteUrl(STARTERS_BY_ID.mewtwo, 'front', 0, getSave().shiny.on.includes('mewtwo'));
  mon.alt = '';
  ring.append(star(lit), mon);
  const meter = el('p', 'penta-meter');
  meter.append(el('b', '', `${n} / ${RING.length} shards`), el('span', '', n >= RING.length ? 'Full strength in the Depths' : `Strength in the Depths: ${strengthOf(n)}%`));
  top.append(ring, meter);
  const plate = el('div', 'gym-plate', 'MEWTWO');
  const text = el('p', 'gym-text');
  const box = el('div', 'gym-say');
  box.append(plate, text, el('i', 'gym-more'));
  layer.append(top, box);
  document.body.append(layer);
  if (!calm) { await sleep(20); layer.classList.add('in'); } else layer.classList.add('in', 'calm');
  if (cry) playCry('mewtwo');
  playSound('gate-hum');
  if (!calm) lit.forEach((on, i) => on && setTimeout(() => playSound(`crystal-${i % 3}`), 500 + i * 220));
  try {
    for (const line of lines) {
      text.textContent = line;
      await tap(layer);
      playSound('confirm');
    }
  } catch (e) { console.error(e); }   // never leave the layer stuck over the room
  layer.classList.remove('in');
  layer.classList.add('out');
  await sleep(calm ? 0 : 320);
  layer.remove();
}
