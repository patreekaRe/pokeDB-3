/* Mewtwo's pentagram (docs/roadmap.md's Towns step 5): the five Waystone Shards' slots, slid in full screen like a Gym
   Leader's talk. A town's slot glows in its Waystone ring colour once its shard is back in place, the rest stay dark;
   Mewtwo at the middle shows how much of its strength is back. Seen before a Mewtwo run and in the Depths camp.
   Slots newly lit since Mewtwo last saw it light up one by one. One tap (or Enter / Space) puts it away. */

import { el, sleep } from './ui.js';
import { playSound } from './audio.js';
import { getSave, updateSave } from './storage.js';
import { calmFx } from './prefs.js';
import { RING, TOWNS } from './data/towns.js';
import { SEALED } from './data/difficulty.js';
import { shardsBack, newShards, strengthBack, pentagramLine } from './data/sealed.js';

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

/** Shows it, and resolves once it's tapped away. `say`: a line over the list instead of the strength's own. */
export async function showPentagram({ say = '', record = true } = {}) {
  const save = getSave(), back = shardsBack(save), fresh = newShards(save), calm = calmFx();
  const was = back.filter(id => !fresh.includes(id));
  const layer = el('div', 'penta-scene gym-scene psychic');
  const card = el('div', 'penta-card');
  const head = el('div', 'penta-head');
  head.append(el('small', '', 'THE SEAL ON'), 'MEWTWO');
  const star = svg('svg', { class: 'penta-star', viewBox: '-100 -100 200 200', 'aria-hidden': 'true' });
  const ring = svg('circle', { class: 'penta-ring', r: 92 });
  const lines = svg('polygon', { class: 'penta-lines', points: [0, 2, 4, 1, 3].map(k => at(k, 72).map(v => v.toFixed(1)).join(',')).join(' ') });
  const inner = svg('circle', { class: 'penta-inner', r: 34 });
  const shiny = save.shiny?.on?.includes('mewtwo');
  const mon = svg('image', { class: 'penta-mon', href: `assets/pokemon/mewtwo${shiny ? '-shiny' : ''}-front.gif`, x: -30, y: -32, width: 60, height: 60 });
  const slots = RING.map((t, k) => slot(k, t.glow));
  star.append(ring, lines, inner, mon, ...slots);
  const pct = el('div', 'penta-pct');
  const num = el('b', '', `${strengthBack(was.length)}%`);
  pct.append(num, el('span', '', ' of its strength'));
  const list = el('ul', 'penta-list');
  const rows = RING.map(t => {
    const li = el('li', 'penta-town');
    li.style.setProperty('--glow', t.glow);
    li.append(el('i', 'penta-dot'), el('span', '', TOWNS[t.id]?.name ?? t.id), el('em', ''));
    list.append(li);
    return li;
  });
  const line = el('p', 'penta-line', say || pentagramLine(was.length));
  card.append(head, star, pct, list, line, el('i', 'gym-more'));
  layer.append(card);
  const light = (k, on) => {
    slots[k].classList.toggle('lit', on);
    rows[k].classList.toggle('lit', on);
    rows[k].querySelector('em').textContent = on ? 'lit' : 'dark';
  };
  RING.forEach((t, k) => light(k, was.includes(t.id)));
  star.style.setProperty('--power', (strengthBack(was.length) / 100).toFixed(2));
  document.body.append(layer);
  playSound('gate-hum');
  if (!calm) { await sleep(20); layer.classList.add('in'); await sleep(650); } else layer.classList.add('in');
  // the shards back since it last looked, one after another: the slot flares, the strength climbs
  let n = was.length;
  for (const id of fresh) {
    const k = RING.findIndex(t => t.id === id);
    if (!calm) await sleep(350);
    slots[k].classList.add('flare');
    light(k, true);
    n++;
    num.textContent = `${strengthBack(n)}%`;
    star.style.setProperty('--power', (strengthBack(n) / 100).toFixed(2));
    playSound(n >= SEALED.shards ? 'core-surge' : `crystal-${Math.min(2, n % 3)}`);
    if (!calm) await sleep(700);
  }
  if (fresh.length) {
    if (!say) line.textContent = pentagramLine(n);
    playSound('stat-up');
  }
  if (record && fresh.length && !new URLSearchParams(location.search).has('shards')) updateSave(d => { d.pentagram = shardsBack(d); });
  await tap(layer);
  playSound('confirm');
  layer.classList.remove('in');
  layer.classList.add('out');
  await sleep(calm ? 0 : 320);
  layer.remove();
}

/** One tap anywhere on the layer, or Enter / Space (gymTalk()'s). */
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
