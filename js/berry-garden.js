/* berry-garden.js  -  the backyard's berry garden in the 3D base (docs/roadmap.md's backyard, part d; the rules are
   js/data/berries.js): what grows on a placed plot, a bobbing "!" over a ripe one, darker soil on one watered today, the
   window a tap on a plot opens, to plant it, water it, look in on it or pick it, and the Garden window over every plot
   at once (openGarden(), 2026-10-15) with the Satchel's berries to sell. A plant is a few merged meshes a stage, shared by every plot growing the same
   berry; js/base-3d.js lays them on and calls liveGarden() each frame, which swaps a plant when its stage turns over. */

import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el, refreshCoins, confirmDialog } from './ui.js';
import { BERRIES, BERRY, DAY_CAP, sow, stageOf, minutesLeft, harvest, coinsLeft, water, canWater, wetToday, yieldOf, sell } from './data/berries.js';
import { satchelOf, matCount } from './data/satchel.js';
import { gainMat } from './satchel.js';
import { firstLook } from './corner-panel.js';
import { workshopOpen } from './data/towns.js';

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

const WORD = { sprout: 'sprouting', bloom: 'in bloom' };
const days = (n) => `${n} DAY${n > 1 ? 'S' : ''}`;
const left = (m) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
const many = (berry, n) => `${n} ${n === 1 ? berry.name : berry.name.replace(/y$/, 'ies')}`;
/** A drop in a tile's corner: watered today. */
const drop = () => { const d = el('span', 'berry-wet'); d.title = 'Watered today'; d.setAttribute('aria-label', 'Watered today'); return d; };

/** A plot's tile: its berry at its stage, the berry's name, how it's doing. */
function plotTile(it, tag = 'div') {
  const stage = stageOf(it.crop), berry = stage && BERRY[it.crop.id], wet = wetToday(it.crop);
  const tile = el(tag, `tshop-tile berry-tile${stage === 'fruit' ? ' ripe' : ''}`);
  if (tag === 'button') tile.type = 'button';
  tile.append(berryArt(berry, stage, wet), el('span', 'tshop-name', berry ? berry.name : 'Bare soil'),
    el('span', 'tshop-price', !stage ? 'EMPTY' : stage === 'fruit' ? 'RIPE!' : left(minutesLeft(it.crop))));
  if (wet) tile.append(drop());
  return tile;
}

/** Berry tiles to plant from, `on` the one picked. */
const seedTiles = (on, pick) => BERRIES.map(berry => {
  const tile = el('button', `tshop-tile${on === berry.id ? ' on' : ''}`);
  tile.type = 'button';
  tile.append(berryArt(berry), el('span', 'tshop-name', berry.name), el('span', 'tshop-price', days(berry.days)));
  tile.addEventListener('click', () => { playSound('select'); pick(berry); });
  return tile;
});

function dialog(cls, title) {
  const d = el('dialog', `dialog dev-window town-shop ${cls}`), screen = el('div', 'dev-screen'), acts = el('div', 'dialog-actions');
  d.append(el('h2', '', title), screen, acts);
  document.body.append(d);
  return { d, screen, acts };
}

/** The window a tap on a plot opens: plant it, water it, look in on it, or pick it. `b` is the base (its `garden` books
    the picking), `it` the plot; `save()` keeps them. Resolves once closed, true if the plot changed. */
export function openPlot(b, it, save) {
  const { d, screen, acts } = dialog('berry-plot', 'BERRY PLOT');
  const say = el('p', 'tshop-say'), grid = el('div', 'tshop-grid');
  screen.append(say, grid);
  const close = el('button', 'btn secondary', 'Close'), wet = el('button', 'btn', 'Water'), go = el('button', 'btn danger', 'Plant');
  acts.append(close, wet, go);
  let picked = null, changed = false;
  // the plant on the plot changes at once, not at liveGarden()'s next look
  const keep = () => { changed = true; nextLook = 0; save(); };
  const draw = (line) => {
    const stage = stageOf(it.crop);
    wet.hidden = !stage || stage === 'fruit';
    if (!stage) {
      say.textContent = line || 'Freshly turned soil. What will you plant? Berries ripen at midnight (UTC) once their days are up.';
      grid.replaceChildren(...seedTiles(picked, (berry) => { picked = berry.id; draw(`The ${berry.name}: ${days(berry.days).toLowerCase()} to ripen. Water it each day it grows for an extra berry.`); }));
      go.textContent = 'Plant';
      go.disabled = !picked;
      return;
    }
    const berry = BERRY[it.crop.id];
    grid.replaceChildren(plotTile(it));
    const more = yieldOf(it.crop) - 1;
    say.textContent = line || (stage === 'fruit' ? `Your ${berry.name} is ripe! ${many(berry, yieldOf(it.crop))} to pick.`
      : `Your ${berry.name} is ${WORD[stage]}. Ripe in ${left(minutesLeft(it.crop))}.${more ? ` Watered ${more} day${more > 1 ? 's' : ''}: ${more} extra.` : ''}`);
    wet.textContent = wetToday(it.crop) ? 'Watered today' : 'Water';
    wet.disabled = !canWater(it.crop);
    go.textContent = stage === 'fruit' ? 'Pick' : 'Dig up';
    go.className = `btn ${stage === 'fruit' ? '' : 'danger'}`;
    go.disabled = false;
  };
  wet.addEventListener('click', () => {
    if (!water(it.crop)) return;
    playSound('confirm');
    keep();
    draw(`You watered the ${BERRY[it.crop.id].name}. It'll give one more berry. Water it again tomorrow!`);
  });
  go.addEventListener('click', async () => {
    const stage = stageOf(it.crop);
    if (!stage) {
      if (!picked) return;
      it.crop = sow(picked);
      playSound('confirm');
      keep();
      picked = null;
      return draw(`You planted the ${BERRY[it.crop.id].name}. Water it, and come back once it's grown!`);
    }
    if (stage !== 'fruit') {
      if (!(await confirmDialog(`Dig up the ${BERRY[it.crop.id].name}? It won't come back.`, 'Dig up'))) return;
      delete it.crop;
      playSound('cancel');
      keep();
      return draw('The plot is empty again.');
    }
    const got = harvest(b, it);
    if (!got) return;
    gainMat(got.berry.id, got.n);
    keep();
    playSound(got.basket ? 'item-get' : 'confirm');
    draw(`You picked ${many(got.berry, got.n)}. ${got.n > 1 ? 'They' : 'It'} went into your Satchel.${got.basket ? ` Your first ${got.berry.name}! A ${got.berry.name.split(' ')[0]} basket for your home is in your storage.` : ''}`);
  });
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(changed); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}

/** The Garden window (2026-10-15, the user's ask): every placed plot `list` on base `b` at once, a tap on one opening
    openPlot(), with Pick all, Water all and Plant all (a berry picked first), and the Satchel's berries to sell to the
    berry stand, up to the day's cap. `save()` keeps the base. Resolves once closed, true if a plot changed. */
/** The garden's How to garden card (the user's ask, 2026-10-17): everything Smeargle's walk round says, kept to hand. */
function gardenHelp() {
  const by = new Map();
  for (const berry of BERRIES) by.set(berry.days, [...(by.get(berry.days) || []), berry.name.replace(/ Berry$/, '')]);
  const ripen = [...by].map(([n, names]) => `${names.join(', ').replace(/, ([^,]*)$/, ' and $1')} ${n} day${n > 1 ? 's' : ''}`).join('; ');
  const steps = [
    ['Plant.', 'Tap an empty plot, or pick a berry under Plant the empty ones and tap Plant all. More Berry plots are at Smeargle\'s Furniture store; place them with Decorate.'],
    ['Grow.', `Berries ripen at midnight (UTC) once their days are up: ${ripen}.`],
    ['Water.', 'Once a day while a crop grows (Water all does every plot). Each watered day adds one more berry when you pick. Watered soil looks darker and wears a blue drop.'],
    ['Pick.', 'A ripe plot shows a "!". Pick all puts the berries in your Satchel, and your first of each berry earns its basket for indoors.'],
    ['Use them.', `Sell spares below, up to ${DAY_CAP} PokéCoins a day at the berry stand.${workshopOpen(getSave()) ? ' Or take them to Kurt\'s Workshop to craft held berries and items to pack for a run.' : ''}`],
  ];
  const card = el('div', 'berry-help');
  card.append(el('strong', 'berry-help-title', 'HOW TO GARDEN'));
  const ol = el('ol', 'berry-help-steps');
  for (const [lead, rest] of steps) { const li = el('li'); li.append(el('b', '', lead), ` ${rest}`); ol.append(li); }
  card.append(ol);
  return card;
}

export function openGarden(b, list, save) {
  const { d, screen, acts } = dialog('berry-garden', 'BERRY GARDEN');
  // the "?" in the title brings the card up over the plots, and down again; it shows by itself the first time
  const help = gardenHelp(), q = el('button', 'berry-q', '?');
  q.type = 'button';
  q.setAttribute('aria-label', 'How to garden');
  d.querySelector('h2').append(q);
  const showHelp = (on) => { help.hidden = !on; q.classList.toggle('on', on); q.setAttribute('aria-expanded', on); if (on) screen.scrollTop = 0; };
  q.addEventListener('click', () => { playSound('select'); showHelp(help.hidden); });
  showHelp(firstLook('garden'));
  const say = el('p', 'tshop-say'), grid = el('div', 'tshop-grid berry-plots'), bar = el('div', 'berry-bar');
  const seeds = el('div', 'tshop-grid berry-seeds'), sales = el('div', 'berry-sales');
  const head = (t) => el('h3', 'berry-head', t);
  const pickAll = el('button', 'btn', 'Pick all'), waterAll = el('button', 'btn', 'Water all'), plantAll = el('button', 'btn', 'Plant all');
  bar.append(pickAll, waterAll, plantAll);
  const plantHead = head('PLANT THE EMPTY ONES');
  screen.append(help, say, grid, bar, plantHead, seeds, head('BERRIES IN YOUR SATCHEL'), sales);
  const close = el('button', 'btn secondary', 'Close');
  acts.append(close);
  let picked = null, changed = false;
  const keep = () => { changed = true; nextLook = 0; save(); };
  const empty = () => list.filter(it => !stageOf(it.crop));
  const draw = (line) => {
    const ripe = list.filter(it => stageOf(it.crop) === 'fruit'), dry = list.filter(it => canWater(it.crop)), bare = empty();
    say.textContent = line || (ripe.length ? `${ripe.length} plot${ripe.length > 1 ? 's are' : ' is'} ripe for picking!` : 'Tap a plot to look in on it. Water growing ones once a day for an extra berry each.');
    grid.replaceChildren(...list.map(it => {
      const tile = plotTile(it, 'button');
      tile.addEventListener('click', async () => {
        playSound('select');
        if (await openPlot(b, it, save)) changed = true;
        draw();
      });
      return tile;
    }));
    pickAll.textContent = `Pick all${ripe.length ? ` (${ripe.length})` : ''}`; pickAll.disabled = !ripe.length;
    waterAll.textContent = `Water all${dry.length ? ` (${dry.length})` : ''}`; waterAll.disabled = !dry.length;
    plantAll.textContent = `Plant all${bare.length ? ` (${bare.length})` : ''}`; plantAll.disabled = !bare.length || !picked;
    plantHead.hidden = seeds.hidden = !bare.length;
    if (bare.length) seeds.replaceChildren(...seedTiles(picked, (berry) => { picked = berry.id; draw(`${berry.name} for the ${bare.length} empty plot${bare.length > 1 ? 's' : ''}: ${days(berry.days).toLowerCase()} to ripen.`); }));
    const sat = satchelOf(getSave()), cap = coinsLeft(b.garden);
    sales.replaceChildren(el('p', 'berry-cap', cap > 0 ? `The berry stand pays ${cap} more PokéCoins today.` : 'The berry stand has bought all it can today. Tomorrow!'),
      ...BERRIES.map(berry => {
        const n = matCount(sat, berry.id), row = el('div', 'berry-sale');
        const one = el('button', 'btn secondary', 'Sell 1'), all = el('button', 'btn secondary', 'Sell all');
        one.disabled = all.disabled = !n || cap < berry.coins;
        one.addEventListener('click', () => sellSome(berry, 1));
        all.addEventListener('click', () => sellSome(berry, matCount(satchelOf(getSave()), berry.id)));
        row.append(berryArt(berry), el('span', 'berry-sale-name', `${berry.name} ×${n}`), el('span', 'berry-sale-price', `${berry.coins} each`), one, all);
        return row;
      }));
  };
  function sellSome(berry, k) {
    const got = sell(b, berry.id, k);
    if (!got.n) return draw('The berry stand can\'t pay that much more today.');
    gainMat(berry.id, -got.n);
    updateSave(dd => { dd.coins = (dd.coins ?? 0) + got.coins; });
    save();
    refreshCoins();
    playSound('buy');
    draw(`You sold ${many(berry, got.n)} for ${got.coins} PokéCoins.${got.n < k ? ' That\'s all the berry stand can pay for today.' : ''}`);
  }
  pickAll.addEventListener('click', () => {
    const got = list.map(it => harvest(b, it)).filter(Boolean);
    if (!got.length) return;
    const by = new Map();
    for (const g of got) by.set(g.berry, (by.get(g.berry) || 0) + g.n);
    for (const [berry, n] of by) gainMat(berry.id, n);
    keep();
    const firsts = got.filter(g => g.basket).map(g => g.berry.name);
    playSound(firsts.length ? 'item-get' : 'confirm');
    draw(`You picked ${[...by].map(([berry, n]) => many(berry, n)).join(', ')}. Into your Satchel they go!${firsts.length ? ` Your first ${firsts.join(' and ')}! ${firsts.length > 1 ? 'Their baskets are' : 'Its basket is'} in your storage.` : ''}`);
  });
  waterAll.addEventListener('click', () => {
    const n = list.filter(it => water(it.crop)).length;
    if (!n) return;
    playSound('confirm');
    keep();
    draw(`You watered ${n} plot${n > 1 ? 's' : ''}. One more berry each!`);
  });
  plantAll.addEventListener('click', () => {
    const bare = empty();
    if (!picked || !bare.length) return;
    for (const it of bare) it.crop = sow(picked);
    playSound('confirm');
    keep();
    const berry = BERRY[picked];
    picked = null;
    draw(`You planted ${bare.length} ${bare.length === 1 ? berry.name : berry.name.replace(/y$/, 'ies')}. Water them, and come back once they've grown!`);
  });
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(changed); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}
