/* berry-garden.js  -  the backyard's berry garden in the 3D base (docs/roadmap.md's backyard, part d; the rules are
   js/data/berries.js): what grows on a placed plot, a bobbing "!" over a ripe one, and the window a tap on a plot opens,
   to plant it, look in on it or pick it. A plant is a few merged meshes a stage, shared by every plot growing the same
   berry; js/base-3d.js lays them on and calls liveGarden() each frame, which swaps a plant when its stage turns over. */

import { updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el, refreshCoins, confirmDialog } from './ui.js';
import { BERRIES, BERRY, sow, stageOf, minutesLeft, harvest, coinsLeft, DAY_CAP } from './data/berries.js';

const PLOT_TOP = 0.12;   // the plot's soil (js/base-models-y.js's berryplot)
const STEM = '#4a9a3a', LEAF = '#4f9e3c', LEAF_LIT = '#6cbc4c';
export const isPlot = (p) => p?.fam === 'berryplot';

let THREE;
const made = new Map(), mats = new Map();
let plots = [], markTex = null, nextLook = 0;

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
  const p = { group, it, cx, cz, plant: plantMesh(it.crop, Date.now()), mark: null };
  p.plant.position.set(cx, 0, cz);
  group.add(p.plant);
  plots.push(p);
  dress(p);
}

function dress(p) {
  const ripe = p.plant.userData.stage === 'fruit';
  if (ripe && !p.mark) { p.mark = mark(); p.group.add(p.mark); }
  if (!ripe && p.mark) { p.group.remove(p.mark); p.mark.material.dispose(); p.mark = null; }
}

/** Each frame: the "!"s bob, drawn where the lawn rolls them (`bendK`, `bendZ`), and every few seconds a plant whose stage
    has turned over is swapped. Returns the plants swapped in, for the caller to bend. */
export function liveGarden(now, bendK, bendZ, calm) {
  const fresh = [];
  if (now > nextLook) {
    nextLook = now + 5000;
    for (const p of plots) {
      if (stageOf(p.it.crop, Date.now()) === (p.plant.userData.stage ?? null)) continue;
      p.group.remove(p.plant);
      p.plant = plantMesh(p.it.crop, Date.now());
      p.plant.position.set(p.cx, 0, p.cz);
      p.group.add(p.plant);
      fresh.push(p.plant);
      dress(p);
    }
  }
  for (const p of plots) if (p.mark) p.mark.position.set(p.cx, 0.82 + (calm ? 0 : Math.abs(Math.sin(now / 300)) * 0.08) - bendK * (p.cz - bendZ) ** 2, p.cz);
  return fresh;
}

/** A berry's picture for the window: the berry, or how far it has grown. */
function berryArt(berry, stage = 'fruit') {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  c.width = c.height = 64;
  c.className = 'tshop-pic';
  const disc = (cx, cy, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
  const leaf = (cx, cy, rx, ry, a, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, a, 0, Math.PI * 2); x.fill(); };
  x.fillStyle = '#6a4a30'; x.beginPath(); x.ellipse(32, 56, 22, 6, 0, 0, Math.PI * 2); x.fill();
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

/** The window a tap on a plot opens: plant it, look in on it, or pick it. `b` is the base (its `garden` books the
    picking), `it` the plot; `save()` keeps them. Resolves once closed, true if the plot changed. */
export function openPlot(b, it, save) {
  const d = el('dialog', 'dialog dev-window town-shop berry-plot');
  const head = el('h2', '', 'BERRY PLOT');
  const say = el('p', 'tshop-say'), grid = el('div', 'tshop-grid'), screen = el('div', 'dev-screen');
  screen.append(say, grid);
  const close = el('button', 'btn secondary', 'Close'), go = el('button', 'btn danger', 'Plant');
  const acts = el('div', 'dialog-actions');
  acts.append(close, go);
  d.append(head, screen, acts);
  document.body.append(d);
  let picked = null, changed = false;
  // the plant on the plot changes at once, not at liveGarden()'s next look
  const keep = () => { changed = true; nextLook = 0; save(); };
  const draw = (line) => {
    const stage = stageOf(it.crop);
    if (!stage) {
      say.textContent = line || 'Freshly turned soil. What will you plant? Berries ripen at midnight (UTC) once their days are up.';
      grid.replaceChildren(...BERRIES.map(berry => {
        const tile = el('button', `tshop-tile${picked === berry.id ? ' on' : ''}`);
        tile.type = 'button';
        tile.append(berryArt(berry), el('span', 'tshop-name', berry.name), el('span', 'tshop-price', days(berry.days)));
        tile.addEventListener('click', () => { playSound('select'); picked = berry.id; draw(`The ${berry.name}: ${days(berry.days).toLowerCase()} to ripen, then about ${berry.coins} PokéCoins a picking.`); });
        return tile;
      }));
      go.textContent = 'Plant';
      go.disabled = !picked;
      return;
    }
    const berry = BERRY[it.crop.id], tile = el('div', 'tshop-tile on');
    tile.append(berryArt(berry, stage), el('span', 'tshop-name', berry.name), el('span', 'tshop-price', stage === 'fruit' ? 'RIPE!' : WORD[stage].toUpperCase()));
    grid.replaceChildren(tile);
    say.textContent = line || (stage === 'fruit' ? `Your ${berry.name} is ripe! Pick it?` : `Your ${berry.name} is ${WORD[stage]}. Ripe in ${left(minutesLeft(it.crop))}.`);
    go.textContent = stage === 'fruit' ? 'Pick' : 'Dig up';
    go.disabled = false;
  };
  go.addEventListener('click', async () => {
    const stage = stageOf(it.crop);
    if (!stage) {
      if (!picked) return;
      it.crop = sow(picked);
      playSound('confirm');
      keep();
      picked = null;
      return draw(`You planted the ${it.crop && BERRY[it.crop.id].name}. Come back once it's grown!`);
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
    if (got.coins) updateSave(dd => { dd.coins = (dd.coins ?? 0) + got.coins; });
    keep();
    refreshCoins();
    playSound(got.basket ? 'item-get' : got.coins ? 'buy' : 'confirm');
    draw(got.basket ? `You picked your first ${got.berry.name}! A ${got.berry.name.split(' ')[0]} basket for your home is in your storage.`
      : got.coins ? `You picked the ${got.berry.name} and sold it for ${got.coins} PokéCoins.${coinsLeft(b.garden) <= 0 ? ` That's all the berry stand buys today (${DAY_CAP}).` : ''}`
      : `You picked the ${got.berry.name}, but the berry stand has bought all it can today (${DAY_CAP} PokéCoins). Tomorrow!`);
  });
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(changed); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}
