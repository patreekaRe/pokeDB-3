/* berry-garden.js  -  the backyard's berry garden in the 3D base (docs/roadmap.md's backyard, part d; the rules are
   js/data/berries.js): what grows on a placed plot, a bobbing "!" over a ripe one, darker soil on one watered today, and
   the Garden window over every plot at once (openGarden(), 2026-10-15; a tap on a plot opens it on that plot since
   2026-10-17) with the Satchel's berries to sell. A plant is a few merged meshes a stage, shared by every plot growing the same
   berry; js/base-3d.js lays them on and calls liveGarden() each frame, which swaps a plant when its stage turns over. */

import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el, refreshCoins, confirmDialog } from './ui.js';
import { BERRIES, BERRY, DAY_CAP, sow, stageOf, minutesLeft, harvest, coinsLeft, water, canWater, wetToday, yieldOf, sell } from './data/berries.js';
import { satchelOf, matCount } from './data/satchel.js';
import { gainMat } from './satchel.js';
import { firstLook } from './corner-panel.js';
import { workshopOpen } from './data/towns.js';
import { HELD_BY_ID } from './data/held.js';
import { RECIPES } from './data/workshop.js';

const PLOT_TOP = 0.12;   // the plot's soil (js/base-models-y.js's berryplot)
const STEM = '#4a9a3a', LEAF = '#4f9e3c', LEAF_LIT = '#6cbc4c';
export const isPlot = (p) => p?.fam === 'berryplot';

let THREE;
const made = new Map(), mats = new Map();
let plots = [], markTex = null, nextLook = 0, wetGeo = null, wetMat = null;

const mat = (hex, gloss = false) => {
  const key = hex + gloss;
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color: hex, roughness: gloss ? 0.3 : 0.8 }));
  return mats.get(key);
};

function merge(geos) {
  const parts = geos.map(g => g.index ? g.toNonIndexed() : g);
  const n = parts.reduce((s, g) => s + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let at = 0;
  for (const g of parts) { pos.set(g.attributes.position.array, at * 3); nor.set(g.attributes.normal.array, at * 3); at += g.attributes.position.count; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}

/** A plant's meshes for a berry at a stage: [geometry, material] pairs, made once. Its scatter is fixed per berry, so
    every plot growing it looks alike, as in the games. */
function grow(berry, stage) {
  const key = `${berry.id}|${stage}`;
  if (made.has(key)) return made.get(key);
  let s = berry.id.length * 977 + stage.length * 131;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const bins = new Map(), put = (geo, m, x, y, z) => { geo.translate(x, y + PLOT_TOP, z); (bins.get(m) || bins.set(m, []).get(m)).push(geo); };
  const ball = (rad, w = 10, h = 8) => new THREE.SphereGeometry(rad, w, h);
  if (stage === 'sprout') {
    put(new THREE.CylinderGeometry(0.008, 0.01, 0.1, 6), mat(STEM), 0, 0.05, 0);
    for (const sx of [-1, 1]) put(ball(0.035).scale(1.7, 0.3, 0.9).rotateZ(sx * 0.4), mat(LEAF_LIT), sx * 0.045, 0.1, 0);
  } else {
    // a round bush, then flowers or berries dotted over its outside
    const big = stage === 'fruit' ? 1.2 : 1, top = 0.26 * big, n = stage === 'fruit' ? 12 : 9;
    put(new THREE.CylinderGeometry(0.014, 0.02, 0.1, 6), mat('#7a5a3a'), 0, 0.05, 0);
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + r() * 0.5, out = 0.07 + r() * 0.05, y = 0.08 + (i % 3) * 0.06 * big;
      put(ball(0.065 + r() * 0.025), mat(i % 3 ? LEAF : LEAF_LIT), Math.cos(a) * out * big, y, Math.sin(a) * out * big);
    }
    put(ball(0.08), mat(LEAF_LIT), 0, top - 0.02, 0);
    const dots = stage === 'fruit' ? 7 : 6;
    for (let i = 0; i < dots; i++) {
      const a = i / dots * Math.PI * 2 + 0.3, out = 0.14 * big, y = 0.1 + ((i * 2) % 3) * 0.06 * big;
      const x = Math.cos(a) * out, z = Math.sin(a) * out;
      if (stage === 'fruit') put(ball(0.042 * berry.round, 12, 10).scale(1, 1.1, 1), mat(berry.fruit, true), x * 1.05, y, z * 1.05);
      else {
        for (let p = 0; p < 5; p++) { const b = p / 5 * Math.PI * 2; put(ball(0.016, 6, 5).scale(1, 0.5, 1), mat(berry.flower), x + Math.cos(b) * 0.018, y + 0.01, z + Math.sin(b) * 0.018); }
        put(ball(0.012, 6, 5), mat('#f8d038'), x, y + 0.016, z);
      }
    }
    if (stage === 'fruit') put(ball(0.042 * berry.round, 12, 10), mat(berry.fruit, true), 0, top + 0.04, 0);
  }
  const out = [...bins].map(([m, geos]) => [merge(geos), m]);
  made.set(key, out);
  return out;
}

function plantMesh(crop, now) {
  const stage = stageOf(crop, now), g = new THREE.Group();
  if (!stage) return g;
  for (const [geo, m] of grow(BERRY[crop.id], stage)) { const mesh = new THREE.Mesh(geo, m); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); }
  g.userData.stage = stage;
  return g;
}

/** The "!" over a ripe plot, a gold pixel mark like the PC's. */
function mark() {
  if (!markTex) {
    const rows = ['.###.', '.###.', '.###.', '..#..', '..#..', '.....', '.###.', '.###.'];
    const c = new OffscreenCanvas(7, 10), x = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, i) => { if (ch === '#') { x.fillStyle = '#5a3a00'; x.fillRect(i, y, 3, 3); } }));
    rows.forEach((row, y) => [...row].forEach((ch, i) => { if (ch === '#') { x.fillStyle = '#ffd040'; x.fillRect(i + 1, y + 1, 1, 1); } }));
    markTex = new THREE.CanvasTexture(c);
    markTex.magFilter = markTex.minFilter = THREE.NearestFilter;
    markTex.colorSpace = THREE.SRGBColorSpace;
    markTex.userData.keep = true;
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex, transparent: true, depthWrite: false }));
  s.scale.set(0.2, 0.28, 1);
  s.raycast = () => {};
  return s;
}

/** Forget the plots: the room's pieces are being built again. */
export function forgetPlots() { plots = []; }

/** Lay what grows on a placed plot `it` into its piece's group, centred at (cx, cz); bend(material) rolls it with the
    lawn. */
export function tendPlot(three, group, it, cx, cz) {
  THREE = three;
  const p = { group, it, cx, cz, plant: plantMesh(it.crop, Date.now()), mark: null, wet: null };
  p.plant.position.set(cx, 0, cz);
  group.add(p.plant);
  plots.push(p);
  dress(p);
}

/** The soil of a plot watered today, darkened: one shared see-through sheet laid over the furrows. */
function wetSoil() {
  wetGeo ||= new THREE.PlaneGeometry(0.8, 0.8).rotateX(-Math.PI / 2);
  wetMat ||= new THREE.MeshStandardMaterial({ color: '#1e1006', roughness: 0.35, transparent: true, opacity: 0.5, depthWrite: false });
  const m = new THREE.Mesh(wetGeo, wetMat);
  m.receiveShadow = true;
  return m;
}

/** A plot's "!" while ripe and its dark soil while watered today. Returns the wet sheet if it was just laid, to bend. */
function dress(p) {
  const ripe = p.plant.userData.stage === 'fruit';
  if (ripe && !p.mark) { p.mark = mark(); p.group.add(p.mark); }
  if (!ripe && p.mark) { p.group.remove(p.mark); p.mark.material.dispose(); p.mark = null; }
  const wet = wetToday(p.it.crop);
  if (wet && !p.wet) { p.wet = wetSoil(); p.wet.position.set(p.cx, 0.135, p.cz); p.group.add(p.wet); return p.wet; }
  if (!wet && p.wet) { p.group.remove(p.wet); p.wet = null; }
  return null;
}

/** Each frame: the "!"s bob, drawn where the lawn rolls them (`bendK`, `bendZ`), and every few seconds a plant whose stage
    has turned over is swapped and the soil wetted or dried. Returns the plants swapped in, for the caller to bend. */
export function liveGarden(now, bendK, bendZ, calm) {
  const fresh = [];
  if (now > nextLook) {
    nextLook = now + 5000;
    for (const p of plots) {
      if (stageOf(p.it.crop, Date.now()) !== (p.plant.userData.stage ?? null)) {
        p.group.remove(p.plant);
        p.plant = plantMesh(p.it.crop, Date.now());
        p.plant.position.set(p.cx, 0, p.cz);
        p.group.add(p.plant);
        fresh.push(p.plant);
      }
      const wet = dress(p);   // a new day dries it
      if (wet) fresh.push(wet);
    }
  }
  for (const p of plots) if (p.mark) p.mark.position.set(p.cx, 0.82 + (calm ? 0 : Math.abs(Math.sin(now / 300)) * 0.08) - bendK * (p.cz - bendZ) ** 2, p.cz);
  return fresh;
}

/** A berry's picture for the window: the berry, how far it has grown, or (no berry) the bare soil. */
function berryArt(berry, stage = 'fruit', wet = false) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  c.width = c.height = 64;
  c.className = 'tshop-pic';
  const disc = (cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
  const leaf = (cx, cy, rx, ry, a, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, a, 0, Math.PI * 2); x.fill(); };
  x.fillStyle = wet ? '#3e2814' : '#6a4a30'; x.beginPath(); x.ellipse(32, 56, 22, 6, 0, 0, Math.PI * 2); x.fill();
  if (!berry) {
    x.fillStyle = '#56381f';
    for (const dx of [-12, 0, 12]) x.fillRect(32 + dx - 4, 54, 8, 2);
    return c;
  }
  if (stage === 'sprout') {
    x.fillStyle = STEM; x.fillRect(31, 36, 3, 20);
    leaf(24, 36, 9, 4, -0.4, LEAF_LIT); leaf(40, 36, 9, 4, 0.4, LEAF_LIT);
    return c;
  }
  if (stage === 'bloom') {
    for (const [cx, cy, r] of [[22, 40, 11], [42, 40, 11], [32, 30, 13], [32, 44, 12]]) disc(cx, cy, r, LEAF);
    for (const [cx, cy] of [[22, 34], [40, 30], [30, 44], [44, 44], [32, 22]]) {
      for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; disc(cx + Math.cos(a) * 3.5, cy + Math.sin(a) * 3.5, 2.6, berry.flower); }
      disc(cx, cy, 1.8, '#f8d038');
    }
    return c;
  }
  const r = 17 * berry.round;
  leaf(42, 14, 9, 4, -0.5, LEAF_LIT);
  x.fillStyle = STEM; x.fillRect(31, 10, 3, 9);
  disc(32, 36, r + 2, 'rgba(0,0,0,0.25)');
  disc(32, 35, r, berry.fruit);
  disc(26, 29, r * 0.32, 'rgba(255,255,255,0.55)');
  return c;
}

const WORD = { sprout: 'Sprouting', bloom: 'In bloom' };
const days = (n) => `${n} day${n > 1 ? 's' : ''}`;
const left = (m) => m >= 1440 ? `${Math.floor(m / 1440)}d ${Math.floor(m % 1440 / 60)}h` : m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
const many = (berry, n) => `${n} ${n === 1 ? berry.name : berry.name.replace(/y$/, 'ies')}`;
const short = (berry) => berry.name.replace(/ Berry$/, '');
/** How far a crop has grown, 0 to 1. */
const grown = (crop, now = Date.now()) => Math.min(1, Math.max(0, (now - crop.at) / Math.max(1, crop.ready - crop.at)));

function meter(share, cls = '') {
  const m = el('span', `gw-bar${cls ? ` ${cls}` : ''}`), fill = el('span', 'gw-bar-fill');
  fill.style.width = `${Math.round(share * 100)}%`;
  m.append(fill);
  return m;
}
/** A drop in a slot's corner: blue once watered today, an empty outline while it still wants water. */
function drop(wet) {
  const d = el('span', `gw-drop${wet ? '' : ' dry'}`), say = wet ? 'Watered today' : 'Needs water';
  d.title = say;
  d.setAttribute('aria-label', say);
  return d;
}
const button = (cls, text) => { const b = el('button', cls, text); b.type = 'button'; return b; };

/** A plot's slot: its plant, a growth bar, the time left, a "!" when ripe and a drop for its water. */
function plotSlot(it, on) {
  const stage = stageOf(it.crop), berry = stage && BERRY[it.crop.id];
  const s = button(`gw-slot${on ? ' on' : ''}${stage === 'fruit' ? ' ripe' : ''}${stage ? '' : ' bare'}`);
  s.append(berryArt(berry, stage, wetToday(it.crop)));
  s.append(stage ? meter(grown(it.crop), stage === 'fruit' ? 'gold' : '') : el('span', 'gw-bar none'));
  s.append(el('span', 'gw-slot-tag', !stage ? 'Empty' : stage === 'fruit' ? 'Ripe!' : left(minutesLeft(it.crop))));
  if (stage === 'fruit') s.append(el('span', 'gw-pip', '!'));
  else if (stage) s.append(drop(wetToday(it.crop)));
  s.setAttribute('aria-label', berry ? `${berry.name}, ${stage === 'fruit' ? 'ripe' : WORD[stage].toLowerCase()}` : 'Empty plot');
  return s;
}

/** A seed to plant: the berry, its name and its days in the corner. */
function seedSlot(berry, on) {
  const s = button(`gw-seed${on ? ' on' : ''}`);
  s.append(berryArt(berry), el('span', 'gw-seed-name', short(berry)), el('span', 'gw-seed-days', `${berry.days}d`));
  s.setAttribute('aria-label', `${berry.name}, ${days(berry.days)}`);
  return s;
}

/** A berry's lines for the info card, an item tooltip's: grow time and price, its held effect in a few words and in
    full, and the run kit Kurt crafts from it once his Workshop's open. */
function berryLines(berry) {
  const h = HELD_BY_ID[berry.id], out = [];
  const stats = el('div', 'gw-stats');
  stats.append(el('span', '', `🌱 ${days(berry.days)}`), el('span', '', `🪙 ${berry.coins} each`));
  out.push(stats);
  if (h) {
    out.push(el('p', 'gw-effect', `✨ ${h.short}`));
    const full = el('p', 'gw-detail');
    full.append(el('b', '', 'Held: '), h.text.replace(/^Held\. /, '').replace(/, it's eaten: /, ': '));
    out.push(full);
  }
  const kits = RECIPES.filter(r => r.kind === 'kit' && r.needs[berry.id]).map(r => r.name);
  if (kits.length && workshopOpen(getSave())) out.push(el('p', 'gw-detail', `Kurt crafts: ${kits.join(', ')}`));
  return out;
}

/** The info card's head: a picture, a name in the berry's colour and a line under it. */
function cardHead(art, name, sub, colour) {
  const head = el('div', 'gw-card-head'), words = el('div', 'gw-card-words'), title = el('strong', 'gw-card-name', name);
  if (colour) title.style.setProperty('--berry', colour);
  words.append(title, el('span', 'gw-card-sub', sub));
  head.append(art, words);
  return head;
}

/** The garden's How to garden card (the user's ask, 2026-10-17): four steps, a line each. */
function gardenHelp() {
  const card = el('div', 'gw-help');
  card.append(el('strong', 'gw-help-title', 'HOW TO GARDEN'));
  const steps = el('ol', 'gw-help-steps');
  for (const [icon, lead, rest] of [
    ['🌱', 'Plant', 'Tap an empty plot and pick a seed.'],
    ['💧', 'Water', 'Once a day while it grows: +1 berry each time.'],
    ['✨', 'Pick', 'Ripe at midnight (UTC) once its days are up.'],
    ['🪙', 'Use', workshopOpen(getSave()) ? 'Sell at the Berry stand, or craft at Kurt\'s.' : `Sell at the Berry stand, up to ${DAY_CAP} a day.`],
  ]) {
    const li = el('li');
    li.append(el('span', 'gw-help-icon', icon), el('b', '', lead), el('span', '', rest));
    steps.append(li);
  }
  card.append(steps, el('p', 'gw-help-foot', 'More plots: Smeargle\'s Furniture store, placed with Decorate.'));
  return card;
}

/** The Garden window (2026-10-15; an MMO-style window since 2026-10-17, the user's ask): every placed plot `list` on
    base `b` as a slot, three tasks over them (Pick, Water, Plant: each every plot at once), an info card for the plot
    tapped (`at`, when opened from a plot in the yard) or the seed picked, and the Berry stand's tab to sell the
    Satchel's berries, up to the day's cap. A one-line log underneath says what just happened, or what to do next.
    `save()` keeps the base. Resolves once closed, true if a plot changed. */
export function openGarden(b, list, save, at = null) {
  const d = el('dialog', 'dialog garden-win');
  const top = el('header', 'gw-top'), q = button('gw-q', '?'), x = button('gw-x', 'X');
  q.setAttribute('aria-label', 'How to garden');
  x.setAttribute('aria-label', 'Close');
  top.append(q, el('h2', 'gw-title', 'BERRY GARDEN'), x);
  const tabs = el('nav', 'gw-tabs'), plotsTab = button('gw-tab'), standTab = button('gw-tab');
  tabs.append(plotsTab, standTab);
  const body = el('div', 'gw-body'), help = gardenHelp(), log = el('p', 'gw-log');
  log.setAttribute('aria-live', 'polite');
  const plotsPane = el('section', 'gw-pane'), standPane = el('section', 'gw-pane');
  const tasks = el('div', 'gw-tasks'), grid = el('div', 'gw-plots'), card = el('div', 'gw-card');
  const seedHead = el('h3', 'gw-head', 'SEEDS'), seeds = el('div', 'gw-seeds');
  const task = (icon, word) => { const t = button('gw-task'); t.dataset.icon = icon; t.dataset.word = word; return t; };
  const pickT = task('✨', 'Pick'), waterT = task('💧', 'Water'), plantT = task('🌱', 'Plant');
  tasks.append(pickT, waterT, plantT);
  plotsPane.append(tasks, grid, card, seedHead, seeds);
  body.append(help, plotsPane, standPane);
  d.append(top, tabs, body, log);
  document.body.append(d);

  let tab = 'plots', sel = Math.max(0, list.indexOf(at)), seed = null, changed = false, said = '';
  if (!at) {
    const ripe = list.findIndex(it => stageOf(it.crop) === 'fruit'), bare = list.findIndex(it => !stageOf(it.crop));
    sel = ripe >= 0 ? ripe : bare >= 0 ? bare : 0;
  }
  const keep = () => { changed = true; nextLook = 0; save(); };
  const empty = () => list.filter(it => !stageOf(it.crop));
  const showHelp = (on) => { help.hidden = !on; q.classList.toggle('on', on); q.setAttribute('aria-expanded', on); if (on) body.scrollTop = 0; };
  q.addEventListener('click', () => { playSound('select'); showHelp(help.hidden); });
  showHelp(firstLook('garden'));

  /** What to do next, when nothing's just happened. */
  const hint = (ripe, dry, bare) => ripe ? 'Berries are ripe! Tap Pick.' : dry ? 'Your plants are thirsty. Tap Water.'
    : bare ? 'An empty plot! Pick a seed to plant.' : 'All tended. Come back tomorrow!';

  function drawCard() {
    const it = list[sel], stage = it && stageOf(it.crop), acts = el('div', 'gw-acts');
    seedHead.hidden = seeds.hidden = !it || !!stage;
    if (!it) return card.replaceChildren();
    if (!stage) {
      seeds.replaceChildren(...BERRIES.map(berry => {
        const s = seedSlot(berry, seed === berry.id);
        s.addEventListener('click', () => { playSound('select'); seed = berry.id; said = ''; draw(); });
        return s;
      }));
      if (!seed) return card.replaceChildren(cardHead(berryArt(null), 'EMPTY PLOT', 'Pick a seed below to plant it.'));
      const berry = BERRY[seed], n = empty().length;
      const here = button('gw-btn', 'Plant here'), all = button('gw-btn alt', `Plant all ${n}`);
      here.addEventListener('click', () => plant([it]));
      all.addEventListener('click', () => plant(empty()));
      acts.append(here);
      if (n > 1) acts.append(all);
      return card.replaceChildren(cardHead(berryArt(berry), berry.name.toUpperCase(), 'Seed', berry.fruit), ...berryLines(berry), acts);
    }
    const berry = BERRY[it.crop.id], n = yieldOf(it.crop), more = n - 1;
    const sub = stage === 'fruit' ? `Ripe! ${n} to pick` : `${WORD[stage]} · ripe in ${left(minutesLeft(it.crop))}`;
    const yieldLine = el('div', 'gw-stats');
    yieldLine.append(el('span', '', `Harvest: ${n}`), el('span', '', more ? `💧 watered ${more} day${more > 1 ? 's' : ''}` : '💧 water for +1'));
    const lines = [cardHead(berryArt(berry, stage, wetToday(it.crop)), berry.name.toUpperCase(), sub, berry.fruit),
      meter(grown(it.crop), stage === 'fruit' ? 'gold big' : 'big'), yieldLine];
    if (HELD_BY_ID[berry.id]) lines.push(el('p', 'gw-effect', `✨ ${HELD_BY_ID[berry.id].short}`));
    if (stage === 'fruit') {
      const pick = button('gw-btn', 'Pick');
      pick.addEventListener('click', () => pickAll([it]));
      acts.append(pick);
    } else {
      const w = button('gw-btn', wetToday(it.crop) ? 'Watered today' : '💧 Water'), dig = button('gw-btn warn', 'Dig up');
      w.disabled = !canWater(it.crop);
      w.addEventListener('click', () => waterAll([it]));
      dig.addEventListener('click', async () => {
        if (!(await confirmDialog(`Dig up the ${berry.name}? It won't come back.`, 'Dig up'))) return;
        delete it.crop;
        playSound('cancel');
        keep();
        say('The plot is empty again.');
      });
      acts.append(w, dig);
    }
    card.replaceChildren(...lines, acts);
  }

  function drawStand() {
    const sat = satchelOf(getSave()), cap = coinsLeft(b.garden);
    const pay = el('div', 'gw-pay'), words = el('div', 'gw-pay-words');
    words.append(el('span', '', 'Berry stand pays today'), el('b', '', `🪙 ${DAY_CAP - cap} / ${DAY_CAP}`));
    pay.append(words, meter((DAY_CAP - cap) / DAY_CAP, 'gold'));
    standPane.replaceChildren(pay, ...BERRIES.map(berry => {
      const n = matCount(sat, berry.id), row = el('div', `gw-sale${n ? '' : ' none'}`), pic = el('span', 'gw-sale-pic');
      pic.append(berryArt(berry));
      if (n) pic.append(el('span', 'gw-count', `${n}`));
      const name = el('div', 'gw-sale-name');
      name.append(el('strong', '', berry.name), el('span', 'gw-sale-does', HELD_BY_ID[berry.id]?.short || ''), el('span', 'gw-sale-price', `🪙 ${berry.coins} each`));
      const one = button('gw-btn alt', 'Sell 1'), all = button('gw-btn alt', 'Sell all'), btns = el('div', 'gw-sale-btns');
      one.disabled = all.disabled = !n || cap < berry.coins;
      one.addEventListener('click', () => sellSome(berry, 1));
      all.addEventListener('click', () => sellSome(berry, matCount(satchelOf(getSave()), berry.id)));
      btns.append(one, all);
      row.append(pic, name, btns);
      return row;
    }));
  }

  function draw() {
    const ripe = list.filter(it => stageOf(it.crop) === 'fruit').length, dry = list.filter(it => canWater(it.crop)).length, bare = empty().length;
    const held = BERRIES.reduce((s, berry) => s + matCount(satchelOf(getSave()), berry.id), 0);
    plotsTab.replaceChildren(el('span', '', 'PLOTS'), ...(ripe ? [el('span', 'gw-badge', `${ripe}`)] : []));
    standTab.replaceChildren(el('span', '', 'BERRY STAND'), ...(held ? [el('span', 'gw-badge soft', `${held}`)] : []));
    plotsTab.classList.toggle('on', tab === 'plots'); standTab.classList.toggle('on', tab === 'stand');
    plotsTab.setAttribute('aria-pressed', tab === 'plots'); standTab.setAttribute('aria-pressed', tab === 'stand');
    plotsPane.hidden = tab !== 'plots'; standPane.hidden = tab !== 'stand';
    const next = ripe ? pickT : dry ? waterT : bare ? plantT : null;
    for (const [t, n] of [[pickT, ripe], [waterT, dry], [plantT, bare]]) {
      t.disabled = !n;
      t.classList.toggle('next', t === next);
      t.replaceChildren(el('span', 'gw-task-icon', t.dataset.icon), el('span', 'gw-task-word', t.dataset.word), el('span', 'gw-task-n', `${n}`));
    }
    grid.replaceChildren(...list.map((it, i) => {
      const s = plotSlot(it, i === sel);
      s.addEventListener('click', () => {
        playSound('select');
        sel = i; said = '';
        draw();
        card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
      return s;
    }));
    drawCard();
    if (tab === 'stand') drawStand();
    log.textContent = said || hint(ripe, dry, bare);
  }
  const say = (line) => { said = line; draw(); };

  function plant(bare) {
    if (!seed || !bare.length) return;
    for (const it of bare) it.crop = sow(seed);
    playSound('confirm');
    keep();
    const berry = BERRY[seed];
    seed = null;
    say(`Planted ${bare.length === 1 ? `a ${berry.name}` : many(berry, bare.length)}. Water ${bare.length === 1 ? 'it' : 'them'} daily!`);
  }
  function pickAll(from) {
    const got = from.map(it => harvest(b, it)).filter(Boolean);
    if (!got.length) return;
    const by = new Map();
    for (const g of got) by.set(g.berry, (by.get(g.berry) || 0) + g.n);
    for (const [berry, n] of by) gainMat(berry.id, n);
    keep();
    const firsts = got.filter(g => g.basket).map(g => short(g.berry));
    playSound(firsts.length ? 'item-get' : 'confirm');
    say(`+${[...by].map(([berry, n]) => many(berry, n)).join(', ')} to your Satchel.${firsts.length ? ` New ${firsts.join(' and ')} basket${firsts.length > 1 ? 's' : ''} in storage!` : ''}`);
  }
  function waterAll(from) {
    const n = from.filter(it => water(it.crop)).length;
    if (!n) return;
    playSound('confirm');
    keep();
    say(`Watered ${n} plot${n > 1 ? 's' : ''}: +1 berry each.`);
  }
  function sellSome(berry, k) {
    const got = sell(b, berry.id, k);
    if (!got.n) return say('The stand can\'t pay more today.');
    gainMat(berry.id, -got.n);
    updateSave(dd => { dd.coins = (dd.coins ?? 0) + got.coins; });
    save();
    refreshCoins();
    playSound('buy');
    say(`Sold ${many(berry, got.n)}: +${got.coins} 🪙${got.n < k ? '. That\'s all the stand pays today.' : ''}`);
  }

  pickT.addEventListener('click', () => pickAll(list));
  waterT.addEventListener('click', () => waterAll(list));
  plantT.addEventListener('click', () => {
    const i = list.findIndex(it => !stageOf(it.crop));
    if (i < 0) return;
    playSound('select');
    sel = i; said = '';
    draw();
    seeds.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  for (const [t, id] of [[plotsTab, 'plots'], [standTab, 'stand']]) t.addEventListener('click', () => {
    if (tab === id) return;
    playSound('select');
    tab = id; said = '';
    draw();
  });
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(changed); }, { once: true });
    x.addEventListener('click', () => { playSound('cancel'); d.close(); });
    d.showModal();
  });
}
