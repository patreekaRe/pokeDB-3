/* pentagram.js  -  the Waystone Shards' progress, shown big (docs/roadmap.md's step 5, the user's design, 2026-10-14): a
   window slid in from the right like a Gym Leader, in Mewtwo's violet. On it the star of five shard sockets, each placed
   shard glowing in its town's RING colour and the missing ones dark, Mewtwo at the middle brightening with its strength
   (--power), how much of that strength the Depths leave it, the five towns lit or dark, and Mewtwo's lines under them, a
   tap a line. Seen before a Mewtwo run (previewStarter() in js/main.js) and when you talk to Mewtwo in the Depths camp
   (homeRoom() in js/run.js). Shards lit since Mewtwo last saw it flare in one after another. One small SVG: no canvas,
   no GPU layer. */

import { el, sleep } from './ui.js';
import { playSound, playCry } from './audio.js';
import { getSave } from './storage.js';
import { battleFx } from './prefs.js';
import { RING, TOWNS, shardsLit } from './data/towns.js';
import { strengthOf } from './data/camp.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};
const at = (k, r) => { const a = (-90 + k * 72) * Math.PI / 180; return [Math.cos(a) * r, Math.sin(a) * r]; };

/** A shard's socket on a point of the star: a long six-sided crystal. */
function slot(k, glow) {
  const [x, y] = at(k, 72), g = svg('g', { class: 'penta-slot', transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` });
  g.style.setProperty('--glow', glow);
  g.append(
    svg('circle', { class: 'penta-halo', r: 20 }),
    svg('circle', { class: 'penta-socket', r: 13 }),
    svg('polygon', { class: 'penta-gem', points: '0,-11 6,-4 6,5 0,12 -6,5 -6,-4' }),
    svg('polygon', { class: 'penta-shine', points: '0,-11 6,-4 0,-1 -6,-4' }),
  );
  return g;
}

/** Slide the pentagram in with Mewtwo's `lines` under it, a tap a line; resolves once it has gone. `lit` (RING order)
    defaults to the save's shards placed; `fresh` marks the ones lit since Mewtwo last saw them, which flare in last. */
export async function showPentagram(lines, { lit = shardsLit(getSave()), fresh = [], cry = false } = {}) {
  const calm = !battleFx();
  const isNew = (k) => lit[k] && fresh[k];
  const layer = el('div', 'penta-scene gym-scene psychic');
  const card = el('div', 'penta-card');
  const head = el('div', 'penta-head');
  head.append(el('small', '', 'THE SEAL ON'), 'MEWTWO');
  const star = svg('svg', { class: 'penta-star', viewBox: '-100 -100 200 200', 'aria-hidden': 'true' });
  const mon = svg('image', { class: 'penta-mon', href: spriteUrl(STARTERS_BY_ID.mewtwo, 'front', 0, getSave().shiny.on.includes('mewtwo')), x: -30, y: -32, width: 60, height: 60 });
  const slots = RING.map((t, k) => slot(k, t.glow));
  star.append(
    svg('circle', { class: 'penta-ring', r: 92 }),
    svg('polygon', { class: 'penta-lines', points: [0, 2, 4, 1, 3].map(k => at(k, 72).map(v => v.toFixed(1)).join(',')).join(' ') }),
    svg('circle', { class: 'penta-inner', r: 34 }), mon, ...slots);
  const pct = el('div', 'penta-pct');
  const num = el('b');
  pct.append(num, el('span', '', ' of its strength in the Depths'));
  const list = el('ul', 'penta-list');
  const rows = RING.map(t => {
    const li = el('li', 'penta-town');
    li.style.setProperty('--glow', t.glow);
    li.append(el('i', 'penta-dot'), el('span', '', TOWNS[t.id]?.name ?? t.id), el('em', ''));
    list.append(li);
    return li;
  });
  const text = el('p', 'penta-line');
  card.append(head, star, pct, list, text, el('i', 'gym-more'));
  layer.append(card);
  const light = (k, on) => {
    slots[k].classList.toggle('lit', on);
    rows[k].classList.toggle('lit', on);
    rows[k].querySelector('em').textContent = on ? 'lit' : 'dark';
  };
  const power = (n) => {
    num.textContent = `${strengthOf(n)}%`;
    star.style.setProperty('--power', (strengthOf(n) / 100).toFixed(2));
  };
  let n = 0;
  RING.forEach((t, k) => { const on = lit[k] && !isNew(k); light(k, on); if (on) n++; });
  power(n);
  text.textContent = lines[0] ?? '';
  document.body.append(layer);
  if (cry) playCry('mewtwo');
  playSound('gate-hum');
  if (!calm) { await sleep(20); layer.classList.add('in'); await sleep(650); } else layer.classList.add('in', 'calm');
  try {
    // the shards back since it last looked, one after another: the socket flares, the strength climbs
    for (let k = 0; k < RING.length; k++) {
      if (!isNew(k)) continue;
      if (!calm) await sleep(350);
      slots[k].classList.add('flare');
      light(k, true);
      power(++n);
      playSound(n >= RING.length ? 'core-surge' : `crystal-${n % 3}`);
      if (!calm) await sleep(700);
    }
    if (fresh.some(Boolean)) playSound('stat-up');
    for (let i = 0; i < lines.length; i++) {
      text.textContent = lines[i];
      await tap(layer);
      playSound('confirm');
    }
  } catch (e) { console.error(e); }   // never leave the layer stuck over the room
  layer.classList.remove('in');
  layer.classList.add('out');
  await sleep(calm ? 0 : 320);
  layer.remove();
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
