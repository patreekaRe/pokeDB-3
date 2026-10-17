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
/** How far a crop has grown, 0 to 1. */
const grown = (crop, now = Date.now()) => Math.min(1, Math.max(0, (now - crop.at) / Math.max(1, crop.ready - crop.at)));
const button = (cls, text) => { const b = el('button', cls, text); b.type = 'button'; return b; };
/** A held berry's text without its "Held." and its "it's eaten". */
const heldText = (h) => h.text.replace(/^Held\. /, '').replace(/, it's eaten: /, ': ');
/** Plots in the list's order: ripe, then thirsty, then growing, then empty. */
const plotRank = (it) => { const s = stageOf(it.crop); return s === 'fruit' ? 0 : canWater(it.crop) ? 1 : s ? 2 : 3; };

/** A stat chip on the card, the Workshop's material slot: an icon, a name, a value and (with `share`) a bar. */
function chip(icon, name, value, share = null, ok = false) {
  const c = el('div', `craft-mat${ok ? ' ok' : ''}${share == null ? ' gd-flat' : ''}`);
  c.append(el('span', 'craft-mat-ico', icon), el('span', 'craft-mat-name', name), el('span', 'craft-mat-n', value));
  if (share != null) {
    const bar = el('span', 'craft-bar'), fill = el('i');
    fill.style.width = `${Math.round(Math.min(1, share) * 100)}%`;
    bar.append(fill);
    c.append(bar);
  }
  return c;
}

/** The garden's How to garden (the user's ask, 2026-10-17): four steps, a line each, in Smeargle's bubble. */
function gardenHelp() {
  const ol = el('ol', 'gd-help');
  for (const [icon, lead, rest] of [
    ['🌱', 'Plant', 'Tap an empty plot, then pick a seed.'],
    ['💧', 'Water', 'Once a day while it grows: +1 berry.'],
    ['✨', 'Pick', 'Ripe at midnight (UTC) when its days are up.'],
    ['🪙', 'Use', workshopOpen(getSave()) ? 'Sell spares, or craft at Kurt\'s.' : `Sell spares, up to ${DAY_CAP} a day.`],
  ]) {
    const li = el('li');
    li.append(el('span', 'gd-help-ico', icon), el('b', '', lead), el('span', '', rest));
    ol.append(li);
  }
  return ol;
}

/** The Garden window (2026-10-15; rebuilt on Kurt's bench, js/workshop.js's openWorkshop(), 2026-10-17, the user's ask):
    Smeargle's line on a tag, three tabs (Plots, Seeds, Berry stand), the picked plot or berry on a parchment card with
    its stats as the Workshop's material slots and one big button, and the tab's list under it. A tap on a plot in the
    yard opens it on that plot (`at`). `save()` keeps the base `b`. Resolves once closed, true if a plot changed. */
export function openGarden(b, list, save, at = null) {
  const d = el('dialog', 'dialog craft garden');
  const head = el('div', 'craft-head'), q = button('gd-q', '?');
  q.setAttribute('aria-label', 'How to garden');
  head.append(el('h2', '', 'BERRY GARDEN'), q);
  const talk = el('div', 'craft-talk'), say = el('p', 'craft-say'), help = gardenHelp();
  talk.append(el('span', 'craft-tag', 'SMEARGLE'), say, help);
  const tabs = el('div', 'craft-tabs'), card = el('div', 'craft-card'), rows = el('div', 'craft-list');
  const close = button('btn secondary craft-close', 'Close');
  d.append(head, talk, tabs, card, rows, close);
  document.body.append(d);

  let tab = 'plots', plot = at || [...list].sort((x, y) => plotRank(x) - plotRank(y))[0], seed = BERRIES[0].id, stand = BERRIES[0].id;
  let target = null, changed = false, said = '';
  const keep = () => { changed = true; nextLook = 0; save(); };
  const empty = () => list.filter(it => !stageOf(it.crop));
  const sat = () => satchelOf(getSave());
  const held = (id) => matCount(sat(), id);
  const showHelp = (on) => { help.hidden = !on; say.hidden = on; q.classList.toggle('on', on); q.setAttribute('aria-expanded', on); };
  q.addEventListener('click', () => { playSound('select'); showHelp(help.hidden); });
  showHelp(firstLook('garden'));
  const line = (t) => { said = t; showHelp(false); draw(); };

  /** Smeargle's line when nothing's just happened: what to do next on this tab. */
  function hint() {
    if (tab === 'seeds') return target ? 'Which seed for this plot? Each berry does something in a run.' : 'Every berry does something in a run. Tap one to see what.';
    if (tab === 'stand') return coinsLeft(b.garden) > 0 ? `I buy spare berries, up to ${DAY_CAP} PokéCoins a day.` : 'I\'ve bought all I can today. Come back tomorrow!';
    if (list.some(it => stageOf(it.crop) === 'fruit')) return 'Ripe berries! Pick them for your Satchel.';
    if (list.some(it => canWater(it.crop))) return 'Thirsty plants! Water each once a day for one more berry.';
    if (empty().length) return 'An empty plot! Tap it, then plant a seed.';
    return 'All tended! Come back tomorrow.';
  }

  function drawTabs() {
    const ripe = list.filter(it => stageOf(it.crop) === 'fruit').length, dry = list.filter(it => canWater(it.crop)).length;
    const bare = empty().length;
    const have = BERRIES.reduce((n, berry) => n + held(berry.id), 0);
    tabs.replaceChildren(...[
      ['plots', 'Plots', ripe ? `${ripe} ripe` : `${list.length} plot${list.length > 1 ? 's' : ''}`, ripe + dry],
      ['seeds', 'Seeds', bare ? `${bare} empty` : `${BERRIES.length} kinds`, 0],
      ['stand', 'Sell', `have ${have}`, 0],
    ].map(([id, name, count, dot]) => {
      const t = button(`craft-tab${tab === id ? ' on' : ''}`);
      t.append(el('span', 'craft-tab-name', name), el('span', 'craft-tab-count', count));
      if (dot) t.append(el('span', 'craft-dot', String(dot)));
      t.addEventListener('click', () => {
        if (tab === id) return;
        playSound('select');
        tab = id; said = '';
        if (id !== 'seeds') target = null;
        draw();
      });
      return t;
    }));
  }

  /** A list row: a picture, a name, a count and a pill. */
  function row(art, name, pill, pillCls, on, pick, count = '') {
    const r = button(`craft-row${on ? ' on' : ''}`), pic = el('span', 'craft-row-pic');
    pic.append(art);
    r.append(pic, el('span', 'craft-row-name', name));
    if (count) r.append(el('span', 'craft-held', count));
    r.append(el('span', `craft-pill ${pillCls}`, pill));
    r.addEventListener('click', () => { playSound('select'); said = ''; pick(); draw(); });
    return r;
  }

  /** The card's top: the picture in its ring, a name, the line under it and the text. */
  function top(art, name, goes, text, ready = false, earns = '') {
    const pic = el('div', `craft-pic${ready ? ' ready' : ''}`), info = el('div', 'craft-info'), t = el('div', 'craft-top');
    pic.append(art);
    info.append(el('h3', 'craft-name', name), el('p', 'craft-goes', goes));
    if (text) info.append(el('p', 'craft-text', text));
    if (earns) info.append(el('p', 'craft-earns', earns));
    t.append(pic, info);
    return t;
  }
  const big = (text, on, act, cls = 'ready') => { const g = button(`craft-make ${on ? cls : ''}`, text); g.disabled = !on; g.addEventListener('click', act); return g; };
  const small = (text, act, cls = '') => { const s = button(`gd-more-btn ${cls}`, text); s.addEventListener('click', act); return s; };

  function drawPlots() {
    const sorted = [...list].sort((x, y) => plotRank(x) - plotRank(y));
    if (!list.includes(plot)) plot = sorted[0];
    rows.replaceChildren(...sorted.map(it => {
      const stage = stageOf(it.crop), berry = stage && BERRY[it.crop.id];
      const pill = stage === 'fruit' ? ['RIPE!', 'ready'] : canWater(it.crop) ? ['WATER', 'short'] : stage ? [left(minutesLeft(it.crop)), 'made'] : ['EMPTY', ''];
      return row(berryArt(berry, stage, wetToday(it.crop)), berry ? berry.name : 'Empty plot', ...pill, it === plot, () => { plot = it; }, wetToday(it.crop) ? '💧' : '');
    }));
    const it = plot, stage = stageOf(it.crop), ripe = list.filter(p => stageOf(p.crop) === 'fruit'), dry = list.filter(p => canWater(p.crop));
    const more = el('div', 'gd-more'), mats = el('div', 'craft-mats');
    if (!stage) {
      card.replaceChildren(top(berryArt(null), 'Empty plot', 'Fresh soil, ready to plant', 'Pick a seed and it starts growing today.'),
        big('Plant a seed', true, () => { playSound('confirm'); target = it; tab = 'seeds'; said = ''; draw(); }));
      return;
    }
    const berry = BERRY[it.crop.id], h = HELD_BY_ID[berry.id], n = yieldOf(it.crop);
    const goes = stage === 'fruit' ? `Ripe! ${many(berry, n)} to pick` : `${WORD[stage]} · ripe in ${left(minutesLeft(it.crop))}`;
    mats.append(chip('🌱', 'Growth', `${Math.round(grown(it.crop) * 100)}%`, grown(it.crop), stage === 'fruit'));
    if (stage !== 'fruit') mats.append(chip('💧', 'Water', wetToday(it.crop) ? 'Done' : 'Not yet', wetToday(it.crop) ? 1 : 0, wetToday(it.crop)));
    mats.append(chip('✨', 'Harvest', `${n}`, n / (1 + berry.days), stage === 'fruit'));
    const go = stage === 'fruit' ? big('Pick!', true, () => pick([it]))
      : canWater(it.crop) ? big('Water it', true, () => soak([it])) : big('Watered ✓', false, null, 'made');
    if (stage === 'fruit' && ripe.length > 1) more.append(small(`Pick all ${ripe.length}`, () => pick(ripe)));
    if (dry.length > (canWater(it.crop) ? 1 : 0)) more.append(small(`Water all ${dry.length}`, () => soak(dry)));
    if (stage !== 'fruit') more.append(small('Dig up', () => dig(it), 'warn'));
    card.replaceChildren(top(berryArt(berry, stage, wetToday(it.crop)), berry.name, goes, h ? `✨ ${h.short}` : '', stage === 'fruit'),
      el('p', 'craft-label', stage === 'fruit' ? 'Grown' : 'Growing'), mats, go, more);
  }

  function drawSeeds() {
    const bare = empty();
    if (target && stageOf(target.crop)) target = null;
    rows.replaceChildren(...BERRIES.map(berry => row(berryArt(berry), berry.name, days(berry.days).toUpperCase(), 'made', berry.id === seed, () => { seed = berry.id; },
      held(berry.id) ? `×${held(berry.id)}` : '')));
    const berry = BERRY[seed], h = HELD_BY_ID[berry.id];
    const kits = RECIPES.filter(r => r.kind === 'kit' && r.needs[berry.id]).map(r => r.name);
    const mats = el('div', 'craft-mats'), more = el('div', 'gd-more');
    mats.append(chip('🌱', 'Ripens', days(berry.days)), chip('🪙', 'Sells', `${berry.coins}`), chip('💧', 'Water', '+1/day'));
    const go = target ? big('Plant here', true, () => plant([target]))
      : bare.length ? big(`Plant in ${bare.length} empty`, true, () => plant(bare)) : big('No empty plot', false);
    if (target && bare.length > 1) more.append(small(`Plant all ${bare.length}`, () => plant(bare)));
    card.replaceChildren(top(berryArt(berry), berry.name, h ? `✨ ${h.short}` : 'Seed', h ? `Held in a run: ${heldText(h)}` : '', false,
      kits.length && workshopOpen(getSave()) ? `Kurt crafts: ${kits.join(', ')}` : ''), mats, go, more);
  }

  function drawStand() {
    const cap = coinsLeft(b.garden);
    rows.replaceChildren(...BERRIES.map(berry => row(berryArt(berry), berry.name, `🪙 ${berry.coins}`, held(berry.id) ? 'carried' : '', berry.id === stand, () => { stand = berry.id; },
      `×${held(berry.id)}`)));
    const berry = BERRY[stand], n = held(berry.id), h = HELD_BY_ID[berry.id];
    const mats = el('div', 'craft-mats'), more = el('div', 'gd-more');
    mats.append(chip('🪙', 'Paid today', `${DAY_CAP - cap}/${DAY_CAP}`, (DAY_CAP - cap) / DAY_CAP, cap <= 0));
    const can = n > 0 && cap >= berry.coins;
    const go = big(n ? (can ? `Sell 1 for ${berry.coins}` : 'Stand\'s full today') : 'None to sell', can, () => sellSome(berry, 1));
    if (can && n > 1) more.append(small(`Sell all ${n}`, () => sellSome(berry, n)));
    card.replaceChildren(top(berryArt(berry), berry.name, `You have ${n} · 🪙 ${berry.coins} each`, h ? `✨ ${h.short}${workshopOpen(getSave()) ? '. Keep some for Kurt!' : ''}` : ''),
      el('p', 'craft-label', 'The berry stand'), mats, go, more);
  }

  function draw() {
    drawTabs();
    if (tab === 'plots') drawPlots(); else if (tab === 'seeds') drawSeeds(); else drawStand();
    say.textContent = said || hint();
  }

  function plant(bare) {
    if (!bare.length) return;
    for (const it of bare) it.crop = sow(seed);
    playSound('confirm');
    keep();
    const berry = BERRY[seed];
    plot = bare[0]; target = null; tab = 'plots';
    line(`${bare.length === 1 ? `${/^[AEIOU]/.test(berry.name) ? 'An' : 'A'} ${berry.name}` : many(berry, bare.length)}, planted! Water ${bare.length === 1 ? 'it' : 'them'} once a day.`);
  }
  function pick(from) {
    const got = from.map(it => harvest(b, it)).filter(Boolean);
    if (!got.length) return;
    const by = new Map();
    for (const g of got) by.set(g.berry, (by.get(g.berry) || 0) + g.n);
    for (const [berry, n] of by) gainMat(berry.id, n);
    keep();
    const firsts = got.filter(g => g.basket).map(g => g.berry.name.split(' ')[0]);
    playSound(firsts.length ? 'item-get' : 'confirm');
    line(`${[...by].map(([berry, n]) => many(berry, n)).join(', ')}, into your Satchel!${firsts.length ? ` Your first! ${firsts.length > 1 ? 'Their baskets are' : `${/^[AEIOU]/.test(firsts[0]) ? 'An' : 'A'} ${firsts[0]} basket is`} in your storage.` : ''}`);
  }
  function soak(from) {
    const n = from.filter(it => water(it.crop)).length;
    if (!n) return;
    playSound('confirm');
    keep();
    line(`Watered ${n === 1 ? 'it' : `${n} plots`}! That's one more berry ${n === 1 ? '' : 'each '}when you pick.`);
  }
  async function dig(it) {
    if (!(await confirmDialog(`Dig up the ${BERRY[it.crop.id].name}? It won't come back.`, 'Dig up'))) return;
    delete it.crop;
    playSound('cancel');
    keep();
    line('Dug up. The plot is empty again.');
  }
  function sellSome(berry, k) {
    const got = sell(b, berry.id, k);
    if (!got.n) return line('I can\'t pay any more today. Tomorrow!');
    gainMat(berry.id, -got.n);
    updateSave(dd => { dd.coins = (dd.coins ?? 0) + got.coins; });
    save();
    refreshCoins();
    playSound('buy');
    line(`${many(berry, got.n)}, sold for ${got.coins} PokéCoins.${got.n < k ? ' That\'s all I can pay today.' : ''}`);
  }

  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(changed); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}
