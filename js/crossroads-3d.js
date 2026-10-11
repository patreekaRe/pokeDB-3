/* crossroads-3d.js  -  the crossroads (js/crossroads.js) as a 3D place you walk, like the ? rooms (js/event-3d.js); the
   user's ask, 2026-10-11, keeping the painted fork's camera: a still camera standing high over the path, looking level
   up it (no pitch, so trees stand straight, the horizon shifted up the screen with a view offset) at the same heights on
   the screen as the painting's (the horizon, the fork, your Pokémon's feet). Dusk on the edge of the woods: the path from
   your Pokémon splits round a signpost into two roads, each running into a gap in the treeline that shows a still of its
   biome (sceneShot()), and at each road's mouth a notice board in its sign's colours (the Clearing's kiosk, kioskArt(); the
   user's pick, 2026-10-11, over the floating cards, the last part of the scene that looked like a menu): a tap walks your
   Pokémon up to it and opens what it says (the road's bosses, wilds, places and Pokédex page). Reading never picks a road.
   Your Pokémon walks where you tap, easing down to 70% of the size it loads in at by the fork; walking onto a road picks
   it, on up it takes it. Without Three.js the painted one runs. */

import { $, el, sleep, confirmDialog } from './ui.js';
import { playSound, preloadSounds, playCry } from './audio.js';
import { loadThree, tex, monBoard, drawMon, createPost } from './hd2d.js';
import { sceneShot } from './scene.js';
import { BIOMES_BY_ID } from './data/enemies.js';
import { spriteUrl, stageName } from './data/starters.js';
import { ARMS, roadInfo, wildTypes } from './crossroads.js';
import { kioskArt } from './hub-3d.js';
import { TYPES } from './data/cards.js';
import { progressBar } from './pokedex.js';
import { getSave } from './storage.js';
import { ALL_PAGES } from './data/pokedex.js';

let THREE, renderer, post, view;

const FORK_Z = -12;           // where the path splits
const START_Z = -6;           // where your Pokémon stands
const SPREAD = 0.26;          // each road's slant off the path (x per unit ahead)
const ROAD_X = 0.75;          // where each road leaves the path, either side
const ROAD_HW = 0.72, PATH_HW = 1.15;
const TAKE_T = 4.5, MAX_T = 24, GONE_T = 14;
const GLIMPSE_Z = -46.5;
const HAZE = '#b8687a';
const BOARD_Z = FORK_Z - 0.3;  // the boards stand just behind the fork's line, beside each road's mouth
const BOARD_S = 1.45;          // painted pixels to units: kioskArt() is 22 x 32 of them, 16 a unit as in the Clearing
const SHRINK = 0.7;            // your Pokémon's size at the fork, of the size it loads in at
const TYPE_INK = { fire: '#f08030', water: '#6890f0', grass: '#78c850', normal: '#c8c0a0', psychic: '#f85888' };

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function seeded(n) { return () => { n = (n + 0x6d2b79f5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const side = (i) => (i ? 1 : -1);
const DIR = [0, 1].map(i => { const n = Math.hypot(SPREAD, 1); return [side(i) * SPREAD / n, -1 / n]; });
const roadStart = (i) => [side(i) * ROAD_X, FORK_Z];
/** Road i's middle at depth z. */
const roadX = (i, z) => side(i) * (ROAD_X + SPREAD * (FORK_Z - z));
/** A spot's distance up road i and off its middle. */
function along(i, x, z) {
  const [ax, az] = roadStart(i), [dx, dz] = DIR[i], px = x - ax, pz = z - az;
  return [px * dx + pz * dz, px * -dz + pz * dx];
}
const onRoad = (i, t, l) => { const [ax, az] = roadStart(i), [dx, dz] = DIR[i]; return [ax + dx * t - dz * l, az + dz * t + dx * l]; };
const meadowHalf = (z) => 2.2 + 0.18 * Math.max(0, z - FORK_Z);
const NEAREST = START_Z + 0.6;
const regionOf = (x, z) => (z >= FORK_Z - 0.2 ? -1 : Math.abs(x - roadX(0, z)) <= Math.abs(x - roadX(1, z)) ? 0 : 1);

/* ---------- painting ---------- */

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function smoothTex(c, repeat = null) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

function grassArt() {
  const [c, g] = canvas(256, 256), r = seeded(3);
  g.fillStyle = '#4e6238'; g.fillRect(0, 0, 256, 256);
  const tones = ['#6a7048', '#5a6a40', '#46592f', '#3e502e', '#58643c'];
  for (let i = 0; i < 520; i++) {
    g.fillStyle = tones[i % tones.length]; g.globalAlpha = 0.55;
    const x = r() * 256, y = r() * 256, rx = 4 + r() * 14;
    for (const [ox, oy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) { g.beginPath(); g.ellipse(x + ox, y + oy, rx, rx * 0.6, 0, 0, Math.PI * 2); g.fill(); }
  }
  g.globalAlpha = 1;
  g.strokeStyle = '#2e3e22'; g.lineWidth = 1.2;
  for (let i = 0; i < 900; i++) { const x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 3); g.stroke(); }
  for (let i = 0; i < 40; i++) { g.fillStyle = ['#f0d8a0', '#e8a8b8', '#c8b8f0'][i % 3]; g.beginPath(); g.arc(r() * 256, r() * 256, 1.3, 0, Math.PI * 2); g.fill(); }
  return c;
}

/** Dirt for the path, worn soft at its edges (u runs across it, v along it). */
function dirtArt() {
  const [c, g] = canvas(128, 256), r = seeded(5);
  const across = g.createLinearGradient(0, 0, 128, 0);
  across.addColorStop(0, '#a87a50'); across.addColorStop(0.5, '#e0b07a'); across.addColorStop(1, '#a87a50');
  g.fillStyle = across; g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 700; i++) { g.fillStyle = ['#c4925e', '#8e6844', '#ecc490', '#5e4430'][i % 4]; g.globalAlpha = 0.6; g.fillRect(r() * 128, r() * 256, 1.5 + r() * 2, 1.5 + r() * 2); }
  g.globalAlpha = 1;
  for (let i = 0; i < 30; i++) {
    const x = 12 + r() * 104, y = r() * 256;
    g.fillStyle = '#5e4430'; g.beginPath(); g.ellipse(x + 0.8, y + 0.8, 2.6, 1.8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d8c0a0'; g.beginPath(); g.ellipse(x, y, 2.4, 1.6, 0, 0, Math.PI * 2); g.fill();
  }
  // ragged soft edges, grass creeping in
  const img = g.getImageData(0, 0, 128, 256), d = img.data;
  for (let y = 0; y < 256; y++) {
    const wob = Math.sin(y / 9) * 3 + Math.sin(y / 3.3) * 1.5;
    for (let x = 0; x < 128; x++) {
      const e = Math.min(x, 127 - x) - 4 + wob * (x < 64 ? 1 : -1) * 0.5;
      d[(y * 128 + x) * 4 + 3] = Math.max(0, Math.min(255, e * 26));
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** The sky at dusk, a sun going down on the horizon between the roads (`h` the horizon's row of 512). */
function skyArt() {
  const [c, g] = canvas(64, 512), h = 300;
  const l = g.createLinearGradient(0, 0, 0, 512);
  [['#282c68', 0], ['#3c3474', 0.22], ['#5a3c80', 0.36], ['#a8507a', 0.48], ['#e8705e', 0.55], ['#f8a858', h / 512], ['#e8885e', 0.7], ['#8a5078', 1]].forEach(([col, k]) => l.addColorStop(k, col));
  g.fillStyle = l; g.fillRect(0, 0, 64, 512);
  const r = seeded(9);
  g.fillStyle = '#fff4d8';
  for (let i = 0; i < 26; i++) { g.globalAlpha = 0.3 + r() * 0.6; g.fillRect(r() * 64, r() * 150, 0.8, 0.8); }
  g.globalAlpha = 1;
  return c;
}

function sunArt() {
  const [c, g] = canvas(128, 128), l = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  l.addColorStop(0, 'rgba(255,248,216,1)'); l.addColorStop(0.16, 'rgba(255,232,160,1)'); l.addColorStop(0.22, 'rgba(252,176,112,0.7)'); l.addColorStop(1, 'rgba(248,140,90,0)');
  g.fillStyle = l; g.fillRect(0, 0, 128, 128);
  return c;
}

function hillArt() {
  const [c, g] = canvas(512, 128), r = seeded(11);
  for (const [col, base, amp, k] of [['#8a5078', 70, 22, 0], ['#6a4068', 92, 14, 1]]) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 128);
    for (let x = 0; x <= 512; x += 8) g.lineTo(x, base - Math.sin(x / (60 + k * 30) + k) * amp - Math.sin(x / 17) * 3 - r() * 2);
    g.lineTo(512, 128); g.fill();
  }
  return c;
}

function glowArt(core, edge) {
  const [c, g] = canvas(32, 32), l = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  l.addColorStop(0, core); l.addColorStop(0.3, edge); l.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = l; g.fillRect(0, 0, 32, 32);
  return c;
}

/** The gold "!" bobbing over a board till it's read: a cream speech bubble, as the Clearing's mailbox and PC wear. */
function hintArt() {
  const [c, g] = canvas(64, 72);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.beginPath(); g.ellipse(33, 31, 27, 27, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#fbf4e4'; g.strokeStyle = '#3a2e24'; g.lineWidth = 3.5;
  g.beginPath(); g.arc(32, 29, 25, 0, Math.PI * 2); g.moveTo(24, 50); g.lineTo(32, 66); g.lineTo(40, 50); g.fill();
  g.beginPath(); g.arc(32, 29, 25, 0.62 * Math.PI, 2.38 * Math.PI); g.lineTo(32, 66); g.closePath(); g.stroke();
  g.fillStyle = '#f0b020'; g.strokeStyle = '#8a5a10'; g.lineWidth = 2;
  g.beginPath(); g.roundRect(27, 11, 10, 23, 4); g.fill(); g.stroke();
  g.beginPath(); g.arc(32, 42, 5, 0, Math.PI * 2); g.fill(); g.stroke();
  return c;
}

/* ---------- building ---------- */

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, ...o });

/** A strip lying on the ground along `pts` ([x, z, half-width]), its texture running `per` units a repeat. */
function ribbon(pts, map, y, per = 3) {
  const pos = [], uv = [], idx = [];
  let run = 0;
  pts.forEach(([x, z, hw], k) => {
    const [nx, nz] = pts[Math.min(pts.length - 1, k + 1)], [px, pz] = pts[Math.max(0, k - 1)];
    let dx = nx - px, dz = nz - pz;
    const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n;
    if (k) run += Math.hypot(x - pts[k - 1][0], z - pts[k - 1][1]);
    pos.push(x + dz * hw, y, z - dx * hw, x - dz * hw, y, z + dx * hw);
    uv.push(0, run / per, 1, run / per);
    if (k) { const a = (k - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, std({ map, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.receiveShadow = true;
  m.renderOrder = 1;
  return m;
}

/** Many of one shape at once: `list` of [x, y, z, scale, colour, sx?]. */
function many(geo, list, { shadow = true, rough = 0.95, flat = true } = {}) {
  const m = new THREE.InstancedMesh(geo, std({ roughness: rough, flatShading: flat }), list.length);
  const o = new THREE.Object3D(), col = new THREE.Color();
  list.forEach(([x, y, z, s, c, sx = s, turn = 0], i) => {
    o.position.set(x, y, z); o.scale.set(sx, s, sx); o.rotation.set(0, turn, 0); o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
    m.setColorAt(i, col.set(c));
  });
  m.castShadow = shadow; m.receiveShadow = true;
  m.raycast = () => {};
  return m;
}

/** Whether (x, z) is in a gap of the treeline, round where a road runs on. */
const inGap = (x, z) => [0, 1].some(i => Math.abs(x - roadX(i, z)) < 1.4 + (FORK_Z - z) * 0.17);

/** The far treeline, low across the horizon as in the painting, a wide gap where each road runs on. Built for the
    phone's camera height, and squashed to the camera's (fitCamera()) so it rises as far over the horizon on any screen. */
function treeline(r) {
  const pines = [], trunks = [];
  for (let z = -28; z > -45; z -= 1.5) for (let x = -40; x < 40; x += 0.9 + r() * 1.1) {
    const zz = z + (r() - 0.5) * 1.2;
    if (inGap(x, zz)) continue;
    const h = (6.4 + r() * 2.6) * (0.75 + 0.25 * Math.min(1, Math.abs(x) / 9)), turn = r() * 6;   // lower in the middle, the sun glowing over them
    trunks.push([x, h * 0.18, zz, h * 0.36, '#2e2234', h * 0.05 + 0.08, turn]);
    for (let k = 0; k < 3; k++) pines.push([x, h * (0.3 + k * 0.22), zz, h * (0.46 - k * 0.08), ['#5a4466', '#4a3858', '#3e2e4c'][k], h * (0.24 - k * 0.055), turn + k]);
  }
  const g = new THREE.Group();
  g.add(many(new THREE.ConeGeometry(1, 1, 7), pines), many(new THREE.CylinderGeometry(0.7, 1, 1, 6), trunks));
  return g;
}

/** One of the two big trees standing at the screen's edges level with the fork, as the painting frames it: a tall trunk
    with roots, its dark crown up over the top corner. fitCamera() puts each at the edge. */
function edgeTree(r) {
  const g = new THREE.Group(), bark = std({ color: '#5a4030', roughness: 1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 26, 9), bark);
  trunk.position.y = 13; trunk.castShadow = true;
  g.add(trunk);
  for (let k = 0; k < 5; k++) {
    const a = k / 5 * Math.PI * 2 + r(), root = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.6, 6), bark);
    root.position.set(Math.cos(a) * 0.75, 0.45, Math.sin(a) * 0.75);
    root.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
    g.add(root);
  }
  const leaf = ['#36402e', '#2a3226', '#1e261c'];
  for (let k = 0; k < 14; k++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2 + r() * 1.6, 1), std({ color: leaf[k % 3], flatShading: true }));
    m.position.set((r() - 0.5) * 9, 17 + r() * 9, (r() - 0.5) * 3);
    m.castShadow = true;
    g.add(m);
  }
  g.traverse(o => { o.raycast = () => {}; });
  return g;
}

function tufts(group, r) {
  const list = [], stones = [];
  for (let i = 0; i < 900; i++) {
    const z = 1 - r() * 27, x = (r() - 0.5) * 2 * (6 - z * 0.6);
    const onPath = z > FORK_Z ? Math.abs(x) < PATH_HW + 0.3 : [0, 1].some(k => Math.abs(x - roadX(k, z)) < ROAD_HW + 0.4);
    if (onPath) continue;
    const h = 0.14 + r() * 0.12;
    list.push([x, h / 2, z, h, ['#4a5e36', '#3e502e', '#5a6a40'][i % 3], 0.05, r() * 6]);
    if (i % 9 === 0) stones.push([x + 0.3, 0.04, z, 0.08 + r() * 0.08, '#8a8070', 0.12 + r() * 0.1, r() * 6]);
  }
  group.add(many(new THREE.ConeGeometry(1, 1, 4), list, { shadow: false }));
  group.add(many(new THREE.DodecahedronGeometry(1, 0), stones, { shadow: false }));
}

const ARM_L = 2.8, ARM_H = 0.78;
const SIGN_FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Writes `text` centred in the box, bold, shrunk to fit its width, with a dark outline so it reads at a distance. */
function letter(g, text, x, y, w, size, fill, ink) {
  let px = size;
  g.font = `900 ${px}px ${SIGN_FONT}`;
  while (px > 4 && g.measureText(text).width > w) { px -= 0.5; g.font = `900 ${px}px ${SIGN_FONT}`; }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = px * 0.22; g.strokeStyle = ink;
  g.strokeText(text, x, y);
  g.fillStyle = fill;
  g.fillText(text, x, y);
}

/** An arm's face: its plank in the sign's colours, the grain, a rim, the biome's name. Its uv is the shape's own x / y,
    so the canvas spans the arm's length and height; arm 0 is seen from behind, so its painting is mirrored to read. */
function armArt(id, mirror) {
  const [dark, light] = ARMS[id] ?? ['#7a5a3a', '#c8a070'];
  const [c, g] = canvas(512, Math.round(512 * ARM_H / ARM_L));
  const W = c.width, H = c.height, r = seeded(id.length * 7);
  g.fillStyle = light; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.18; g.strokeStyle = dark; g.lineWidth = 1.5;
  for (let k = 0; k < 9; k++) { const y = 8 + r() * (H - 16); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + (r() - 0.5) * 8, W * 0.7, y + (r() - 0.5) * 8, W, y); g.stroke(); }
  g.globalAlpha = 1;
  g.strokeStyle = dark; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);
  if (mirror) { g.translate(W, 0); g.scale(-1, 1); }
  const tip = W * 0.4 / ARM_L, x0 = mirror ? tip : 20, x1 = mirror ? W - 20 : W - tip;   // keep off the point and the nail
  letter(g, BIOMES_BY_ID[id]?.name ?? id, (x0 + x1) / 2 + 6, H / 2 + 2, x1 - x0 - 24, H * 0.68, '#fffaf0', dark);
  return c;
}

function armFace(id, i) {
  const t = smoothTex(armArt(id, !i));
  t.repeat.set(1 / ARM_L, 1 / ARM_H);
  t.offset.set(0, 0.5);
  return t;
}

/** A soft halo behind an arm, pulsing with it. */
let halo = null;

/** An arm of the signpost: a board with a pointed end, aimed up road i, in that biome's sign colours, its name on it. */
function arm(i, id, y) {
  const s = new THREE.Shape(), L = ARM_L, h = ARM_H;
  s.moveTo(0, -h / 2); s.lineTo(L - 0.4, -h / 2); s.lineTo(L, 0); s.lineTo(L - 0.4, h / 2); s.lineTo(0, h / 2); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 });
  geo.translate(0.05, 0, -0.06);
  const [dark, light] = ARMS[id] ?? ['#7a5a3a', '#c8a070'];
  const map = armFace(id, i);
  const face = std({ color: '#ffffff', map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.3 }), edge = std({ color: dark, emissive: dark, emissiveIntensity: 0.3 });
  const m = new THREE.Mesh(geo, [face, edge]);
  halo ??= smoothTex(glowArt('rgba(255,240,200,0.9)', 'rgba(255,210,140,0.45)'));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: light, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.4 }));
  glow.position.set(L / 2, 0, 0);
  glow.scale.set(L * 1.5, h * 3.2, 1);
  glow.raycast = () => {};
  m.add(glow);
  m.userData.glow = glow;
  // aimed mostly sideways, up its road a little: pointing straight up the roads they'd be seen end on from here
  m.rotation.y = Math.atan2(0.5, side(i));
  m.position.y = y;
  m.castShadow = true;
  m.userData.road = i;
  return m;
}

/** A road's notice board: the Clearing's kiosk in its sign's colours, its snapshots its wilds' types. */
function boardArt(id) {
  const [dark, light] = ARMS[id] ?? ['#7a5a3a', '#c8a070'];
  const shots = wildTypes(BIOMES_BY_ID[id]).map(([t]) => TYPE_INK[t] ?? '#c8c0a0');
  while (shots.length < 3) shots.push(shots[shots.length - 1] ?? '#c8c0a0');
  const c = kioskArt({ white: '#fbf4e4', pale: '#eadcc0', grey: light, dark, ink: '#3a2e24', red: light, redDark: dark, shots: shots.slice(0, 3) });
  // the poster's header says where the road goes, over the painted headline's place
  const g = c.getContext('2d'), name = BIOMES_BY_ID[id]?.name ?? id;
  g.fillStyle = '#fbf4e4'; g.fillRect(4.6, 12.7, 13, 2.2);
  const [first, ...rest] = name.split(' ');
  if (rest.length) { letter(g, first, 12.2, 11, 7.6, 1.7, '#fffaf0', dark); letter(g, rest.join(' '), 11, 13.85, 11.6, 1.9, '#3a2e24', '#fbf4e4'); }
  else letter(g, name, 11, 13.85, 11.6, 1.9, '#3a2e24', '#fbf4e4');
  return c;
}

function boardMesh(i, id) {
  const art = boardArt(id), w = art.width / art.fine / 16 * BOARD_S, h = art.height / art.fine / 16 * BOARD_S;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: smoothTex(art), alphaTest: 0.5, side: THREE.DoubleSide, emissive: '#ffffff', emissiveIntensity: 0.12, roughness: 1 }));
  m.material.emissiveMap = m.material.map;
  m.geometry.translate(0, h / 2, 0);
  m.rotation.y = -side(i) * 0.32;   // turned a little towards the path
  m.castShadow = true;
  m.userData = { board: i, w, h };
  return m;
}

async function build(ids) {
  const group = new THREE.Group(), r = seeded(21);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(HAZE, 26, 95);
  scene.background = new THREE.Color('#8a5078');
  // the ground, the path and the two roads
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 52), std({ map: smoothTex(grassArt(), [30, 17]), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -20);
  ground.receiveShadow = true;
  ground.userData.ground = true;
  group.add(ground);
  const dirt = smoothTex(dirtArt());
  dirt.wrapT = THREE.RepeatWrapping;
  const path = [];
  for (let z = 1.5; z >= FORK_Z - 1.2; z -= 0.5) path.push([Math.sin(z * 0.35) * 0.12 * Math.min(1, (z - FORK_Z) / 3), z, PATH_HW + Math.max(0, z - START_Z) * 0.03]);
  group.add(ribbon(path, dirt, 0.01));
  for (const i of [0, 1]) {
    const pts = [];
    for (let t = -1.6; t <= 36; t += 0.5) { const [x, z] = onRoad(i, t, Math.sin(t * 0.3) * 0.15 * Math.min(1, Math.max(0, t) / 3)); pts.push([x, z, ROAD_HW * (t < 0 ? 0.9 : 1)]); }
    group.add(ribbon(pts, dirt, 0.015 + i * 0.002));
  }
  const line = treeline(r), edges = [edgeTree(r), edgeTree(r)];
  group.add(line, ...edges);
  tufts(group, r);
  // the signpost in the split, an arm up each road
  const post = new THREE.Group();
  post.position.set(0, 0, FORK_Z - 1.5);
  const wood = std({ color: '#8a5a2c' });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 4.6, 8), wood);
  pole.position.y = 2.3; pole.castShadow = true;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 8), std({ color: '#5a3818' }));
  cap.position.y = 4.7;
  const arms = [arm(0, ids[0], 3.75), arm(1, ids[1], 2.88)];
  post.add(pole, cap, ...arms);
  group.add(post);
  const boards = ids.map((id, i) => boardMesh(i, id));
  group.add(...boards);
  // a "!" over each board till it's read, so it's plain they can be
  const hintTex = smoothTex(hintArt());
  const hints = boards.map((b) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: hintTex, transparent: true, depthWrite: false, fog: false }));
    s.scale.set(0.95, 1.07, 1);
    s.raycast = () => {};
    b.add(s);
    return s;
  });
  // through each gap, a glimpse of the biome the road runs to, lit by itself
  const glimpses = ids.map((id, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glimpseTex(id), fog: false, toneMapped: false, transparent: true, depthWrite: false }));
    m.position.set(roadX(i, GLIMPSE_Z), 0, GLIMPSE_Z);
    m.userData.road = i;
    group.add(m);
    return m;
  });
  // the far hills, then the sky and the setting sun
  const hills = new THREE.Mesh(new THREE.PlaneGeometry(260, 40), new THREE.MeshBasicMaterial({ map: smoothTex(hillArt()), transparent: true, fog: false }));
  group.add(hills);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(400, 260), new THREE.MeshBasicMaterial({ map: smoothTex(skyArt()), fog: false, toneMapped: false }));
  group.add(sky);
  const sunDisc = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ map: smoothTex(sunArt()), transparent: true, fog: false, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
  group.add(sunDisc);
  for (const m of [hills, sky, sunDisc]) m.raycast = () => {};
  // fireflies over the grass
  const glow = smoothTex(glowArt('rgba(255,250,208,1)', 'rgba(248,216,96,0.7)'));
  const flies = Array.from({ length: 22 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.scale.setScalar(0.32);
    s.userData = { x: (r() - 0.5) * 12, y: 0.4 + r() * 2.4, z: -3 - r() * 20, ph: r() * 6.28 };
    group.add(s);
    return s;
  });
  // the light: the last of the sun from over your shoulder, its shadows reaching up the path, the glow ahead rimming
  // the trees, a violet sky over all
  const hemi = new THREE.HemisphereLight('#ffc8b8', '#4a3a5a', 1.6);
  const sun = new THREE.DirectionalLight('#ffc090', 1.9);
  sun.position.set(-7, 13, 6);
  sun.target.position.set(0, 0, FORK_Z + 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 20, bottom: -20, near: 1, far: 60 });
  sun.shadow.bias = -0.0015;
  sun.shadow.normalBias = 0.03;
  const fill = new THREE.DirectionalLight('#ff9060', 1.2);
  fill.position.set(0, 6, FORK_Z - 40);
  scene.add(group, hemi, sun, sun.target, fill);
  return { scene, group, arms, glimpses, boards, hints, hills, sky, sunDisc, flies, ground, line, edges };
}

function glimpseTex(id) {
  const shot = sceneShot(id, { w: 100, h: 112, at: 0.62, time: 'dusk', where: { progress: 0, stage: 0, step: null } });
  // its sky and sides fading into the clearing's, so it reads as the land beyond the trees, not a picture in a frame
  const g = shot.getContext('2d'), img = g.getImageData(0, 0, 100, 112), d = img.data;
  const ease = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
  for (let y = 0; y < 112; y++) for (let x = 0; x < 100; x++) {
    const a = ease((y / 112 - 0.08) / 0.3) * ease(Math.min(x, 99 - x) / 18);
    d[(y * 100 + x) * 4 + 3] *= a;
  }
  g.putImageData(img, 0, 0);
  const t = tex(shot);
  t.userData.ratio = 112 / 100;
  return t;
}

/* ---------- the camera: the painting's ---------- */

let F = 400, camH = 5, hzK = 0.42;

/** Level and high over the path, so the horizon, the fork and your Pokémon's feet sit where the painting has them. */
function fitCamera(camera, w, h, W) {
  const tall = h > w * 1.1;
  hzK = tall ? 0.42 : 0.5;
  const startK = tall ? 0.86 : 0.9;
  F = tall ? (w / 2) / Math.tan(THREE.MathUtils.degToRad(27)) : (h / 2) / Math.tan(THREE.MathUtils.degToRad(21));
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h / 2 / F));
  camera.aspect = w / h;
  camH = -START_Z * (startK - hzK) * h / F;
  camera.position.set(0, camH, 0);
  camera.lookAt(0, camH, -1);
  camera.setViewOffset(w, h, 0, (0.5 - hzK) * h, w, h);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  // what stands at the far end moves with the camera's height: each glimpse's horizon on the true one, and the sky's
  for (const m of W.glimpses) {
    const ht = Math.max(14, (camH + 2) / 0.38), wd = ht / m.material.map.userData.ratio;
    m.scale.set(wd, ht, 1);
    m.position.y = camH - (0.5 - 0.62) * ht;
  }
  W.hills.position.set(0, camH - 2, -82);
  W.line.scale.y = (camH + 1.8) / 7.6;
  // the two big trees cut by the screen's edges just past the fork, as the painting has them
  const z = FORK_Z - 1, half = (w / 2) / F * -z;
  W.edges.forEach((t, i) => t.position.set(side(i) * (half + 0.2), 0, z));
  // each board beside its road's mouth, out towards the screen's edge so it never hides the glimpses (smaller on a wide
  // screen, whose camera stands lower and nearer), but in far enough to show whole
  const edge = (w / 2) / F * -BOARD_Z, k = tall ? 1 : 0.8;
  W.boards.forEach((b, i) => {
    const bw = b.userData.w * k;
    b.scale.setScalar(k);
    b.position.set(side(i) * Math.min(Math.max(Math.abs(roadX(i, BOARD_Z)) + ROAD_HW + 0.9 + bw / 2, edge * 0.68), edge - bw / 2 - 0.25), 0, BOARD_Z);
  });
  W.sky.position.set(0, camH - (130 - 300 / 512 * 260), -120);
  W.sunDisc.position.set(0, camH + 1.5, -110);
}

/* ---------- the scene ---------- */

/**
 * The 3D fork: as crossroads() in js/crossroads.js, which calls it first. Throws before showing anything if Three.js
 * won't load, so the painted one can run instead.
 */
export async function crossroads3d({ ids, swap = null, starter, stage = 0, shiny = false }) {
  THREE = await loadThree();
  if (!renderer) {
    view = document.createElement('canvas');
    view.className = 'xr3d-view';
    renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setPixelRatio(1);
    post = createPost(renderer, { short: 760, crisp: false });
    post.final.uniforms.uBlur.value = 2;
    post.final.uniforms.uBand.value = 0.2;
    post.final.uniforms.uBloom.value = 0.5;
  }
  const roads = [...ids];
  const W = await build(roads);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 260);
  const art = { back: spriteUrl(starter, 'back', stage, shiny), front: spriteUrl(starter, 'front', stage, shiny) };
  const mon = await monBoard({ src: art.front, name: stageName(starter, stage), cry: starter.line[stage]?.id });
  W.scene.add(mon.group);

  const scene = $('crossroads-scene'), go = $('xr-go'), calm = still();
  scene.className = `crossroads-scene x3d${calm ? ' still' : ''}`;
  scene.prepend(view);
  preloadSounds('stick', 'confirm', 'cancel', 'footstep');
  go.disabled = true;
  go.textContent = 'Which way?';
  scene.hidden = false;

  const walker = { x: 0, z: START_Z, facing: mon.sheets.back ? 'back' : 'front', flip: false, hop: 0 };
  let picked = -1, walking = false, asking = false, backing = false, route = [], keys = new Set(), toRead = -1, reading = -1;
  let size = 1, vw = 0, vh = 0, raf = 0, last = 0, stepAt = 0, held = false;
  const read = new Set();   // boards opened: their "!" and glow stop

  function resize() {
    vw = view.clientWidth || innerWidth; vh = view.clientHeight || innerHeight;
    const k = post.scale(vw, vh);
    renderer.setSize(Math.round(vw * k), Math.round(vh * k), false);
    post.size(vw, vh);
    fitCamera(camera, vw, vh, W);
    // your Pokémon as tall on the screen as the painted one where it loads in (frame() eases it down towards the fork)
    const room = Math.min(vw * 0.3, vh * (vh > vw * 1.1 ? 0.15 : 0.2));
    size = room / F / Math.max(0.5, mon.top);
  }
  const project = (x, y, z) => { const p = new THREE.Vector3(x, y, z).project(camera); return [(p.x + 1) / 2 * vw, (1 - p.y) / 2 * vh]; };

  const box = $('xr-roads');
  const ways = swap && [ids[1], ...swap];
  let way = 0, resolve = null;
  const chosen = new Promise(r => { resolve = r; });
  try {
    const choose = (i) => {
      if (picked === i) return;
      picked = i;
      playSound('confirm');
      W.arms.forEach(a => { a.rotation.z = 0; });
      W.arms.forEach((a, k) => { a.material[0].emissive.set(k === i ? '#fff0c0' : '#ffffff'); a.material[1].emissive.set(k === i ? '#c89030' : a.material[1].color); });
      go.disabled = false;
      go.textContent = `To the ${BIOMES_BY_ID[roads[i]].name}`;
    };
    const pick = (i) => {
      if (walking || asking || reading >= 0) return;
      toRead = -1;
      if (picked === i) return take();
      choose(i);
      routeTo(...onRoad(i, 1.6, 0));
    };
    box.replaceChildren();
    const panel = el('div', 'xr-panel');
    panel.hidden = true;
    scene.append(panel);
    /** What road i's board says: its sign, places, bosses, wilds and how much of its Pokédex page you've met. */
    /** A boxed section of the board: a small heading over its contents. */
    const section = (cls, label, ...kids) => { const sec = el('section', `xr-sec ${cls}`); sec.append(el('h4', 'xr-label', label), ...kids); return sec; };
    /** What road i's board says, in boxes: its places in order, its bosses beside its wilds, then its Pokédex page. */
    function fillPanel(i) {
      const id = roads[i], biome = BIOMES_BY_ID[id], page = ALL_PAGES.find(p => p.biome === id);
      const { bosses, alphas } = roadInfo(id);
      // the kiosk's poster, blown up: its roof, its frame in the road's sign colours, a header with a Poké Ball
      const [dark, light] = ARMS[id] ?? ['#7a5a3a', '#c8a070'];
      panel.style.setProperty('--xr-dark', dark);
      panel.style.setProperty('--xr-light', light);
      const head = el('header', 'xr-head');
      const shut = el('button', 'xr-shut', '✕');
      shut.type = 'button';
      shut.setAttribute('aria-label', 'Close');
      shut.onclick = (e) => { e.stopPropagation(); closePanel(); };
      head.append(el('span', 'xr-ball'), el('h3', 'xr-title', biome.name), shut);
      const places = el('ol', 'xr-places');
      biome.stages.forEach((name, k) => {
        const li = el('li', `xr-place${k === biome.stages.length - 1 ? ' boss' : ''}`);
        li.append(el('span', 'xr-num', `${k + 1}`), el('span', 'xr-pname', name));
        places.append(li);
      });
      const wilds = el('div', 'xr-wilds');
      for (const [type, n] of wildTypes(biome)) {
        const row = el('div', `xr-wild type-${type}`);
        row.append(el('span', 'xr-wicon', TYPES[type]?.icon ?? ''), el('span', 'xr-wname', TYPES[type]?.label ?? type), el('span', 'xr-wn', `${n}`));
        wilds.append(row);
      }
      const body = el('div', 'xr-body');
      body.append(section('xr-sec-places', 'Places', places), section('xr-sec-bosses', 'Bosses', bosses), section('xr-sec-wilds', 'Wild Pokémon', wilds), section('xr-sec-bosses xr-sec-alphas', 'Alphas', alphas));
      if (page) {
        const beaten = getSave().dex.defeated, n = page.ids.filter(id => beaten.includes(id)).length;
        const dex = el('div', 'xr-dex');
        dex.append(progressBar(n, page.ids.length), el('span', 'xr-dex-n', `${n}/${page.ids.length}`));
        body.append(section('xr-sec-dex', 'Pokédex', dex));
      }
      if (ways && i === 1) {
        const swapBtn = el('button', 'xr-swap', '🧭 Another road');
        swapBtn.type = 'button';
        swapBtn.title = 'Wayfinder: swap this road for another biome you could walk.';
        swapBtn.onclick = (e) => { e.stopPropagation(); turn(); };
        body.append(swapBtn);
      }
      panel.dataset.biome = id;
      const frame = el('div', 'xr-frame'), poster = el('div', 'xr-poster');
      poster.append(head, body);
      frame.append(poster);
      panel.replaceChildren(el('div', 'xr-roof'), frame, el('div', 'xr-rail'));
    }
    function openPanel(i) {
      reading = i;
      route = [];
      keys.clear();
      face('back');
      read.add(i);
      playSound('stick');
      fillPanel(i);
      panel.hidden = false;
    }
    function closePanel() {
      if (reading < 0) return;
      reading = -1;
      panel.hidden = true;
      playSound('cancel');
    }
    /** Walks your Pokémon up in front of road i's board (on the grass, short of the road), then opens it. */
    function readBoard(i) {
      if (walking || asking || reading >= 0) return;
      const b = W.boards[i].position, z = FORK_Z + 0.9, e = meadowHalf(z) - 0.15;
      routeTo(side(i) * Math.min(e, Math.abs(b.x) - 1.5), z);   // beside it, not in front of it
      if (toRead !== i) playSound('confirm');
      toRead = i;
    }
    function turn() {
      if (walking || asking) return;
      way = (way + 1) % ways.length;
      roads[1] = ways[way];
      playSound('stick');
      if (picked === 1) go.textContent = `To the ${BIOMES_BY_ID[roads[1]].name}`;
      // the second road's arm, glimpse and board follow the swap
      const [dark, light] = ARMS[roads[1]] ?? ['#7a5a3a', '#c8a070'];
      const [face, edge] = W.arms[1].material;
      face.map.dispose(); face.map = face.emissiveMap = armFace(roads[1], 1); face.needsUpdate = true;
      edge.color.set(dark); edge.emissive.set(dark);
      W.arms[1].userData.glow.material.color.set(light);
      const m = W.glimpses[1].material;
      m.map.dispose(); m.map = glimpseTex(roads[1]); m.needsUpdate = true;
      const bm = W.boards[1].material;
      bm.map.dispose(); bm.map = bm.emissiveMap = smoothTex(boardArt(roads[1])); bm.needsUpdate = true;
      if (reading === 1) fillPanel(1);
      else read.delete(1);
      resize();
    }
    resize();

    /** Where a step from (x0, z0) to (x, z) ends up: on the grass below the fork, or kept to the road it's on. */
    function constrain(x0, z0, x, z) {
      z = Math.min(NEAREST, z);
      if (z >= FORK_Z - 0.2) { const e = meadowHalf(z); return [Math.max(-e, Math.min(e, x)), z]; }
      const was = regionOf(x0, z0), i = was >= 0 ? was : regionOf(x, z);
      if (was < 0 && Math.abs(x - roadX(i, z)) > ROAD_HW * 1.8) return [x0, Math.max(z, FORK_Z - 0.2)];   // only onto a road at its mouth
      const [t, l] = along(i, x, z);
      return onRoad(i, Math.min(walking ? 99 : MAX_T, Math.max(-0.4, t)), Math.max(-ROAD_HW, Math.min(ROAD_HW, l)));
    }
    const mouth = (i) => [onRoad(i, 0.2, 0), [roadX(i, FORK_Z) * 0.7, FORK_Z + 0.6]];
    /** The way to (x, z): back through the fork if it means changing road, then along it. */
    function routeTo(x, z) {
      z = Math.min(NEAREST, z);
      const to = regionOf(x, z), from = regionOf(walker.x, walker.z);
      if (to >= 0) { const [t, l] = along(to, x, z); [x, z] = onRoad(to, Math.min(walking ? 99 : MAX_T, Math.max(0, t)), Math.max(-ROAD_HW, Math.min(ROAD_HW, l))); }
      else { const e = meadowHalf(z); x = Math.max(-e, Math.min(e, x)); }
      route = [];
      if (from >= 0 && to !== from) { const [a, b] = mouth(from); route.push(a, b); }
      if (to >= 0 && to !== from) { const [a, b] = mouth(to); route.push(b, a); }
      route.push([x, z]);
    }
    const face = (to) => { if (to === 'back') walker.flip = false; if (walker.facing !== to && (to === 'front' || mon.sheets.back)) { walker.facing = to; mon.frame = 0; } };

    const loop = (now) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
      last = now;
      const speed = (walking ? 3.6 : 3) * dt;
      let gx = 0, gz = 0;
      if (keys.size && !walking && !asking && reading < 0) {
        toRead = -1;
        gx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
        gz = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
        route = [];
      } else if (route.length) {
        const [tx, tz] = route[0], dist = Math.hypot(tx - walker.x, tz - walker.z);
        if (dist < Math.max(0.05, speed)) { [walker.x, walker.z] = constrain(walker.x, walker.z, tx, tz); route.shift(); }
        else { gx = (tx - walker.x) / dist; gz = (tz - walker.z) / dist; }
      }
      const moving = !!(gx || gz);
      if (moving) {
        const n = Math.hypot(gx, gz) || 1;
        let [x, z] = constrain(walker.x, walker.z, walker.x + gx / n * speed, walker.z + gz / n * speed);
        const r = regionOf(x, z);
        if (r >= 0 && keys.size) { const [t] = along(r, x, z), [cx] = onRoad(r, t, 0); x += (cx - x) * Math.min(1, dt * 4); }   // keys steer along the road
        walker.x = x; walker.z = z;
        // as in the Clearing (walk() in js/hub-3d.js): up or down shows its back or front, sideways its front turned that way
        if (Math.abs(gz) > Math.abs(gx)) { face(gz < 0 ? 'back' : 'front'); walker.flip = false; }
        else { face('front'); walker.flip = gx > 0; }
        if (!calm && now > stepAt) { playSound('footstep'); stepAt = now + 360; }
        walker.hop += dt * 1000;
      } else walker.hop = 0;
      if (toRead >= 0 && !route.length && !moving) { const i = toRead; toRead = -1; openPanel(i); }
      const r = regionOf(walker.x, walker.z);
      if (r < 0) backing = false;
      if (!walking && !asking && r >= 0) {
        choose(r);
        if (along(r, walker.x, walker.z)[0] > TAKE_T && !backing) take();
      }
      frame(now, dt);
      raf = requestAnimationFrame(loop);
    };

    function frame(now, dt) {
      drawMon(mon, walker, dt * 1000);
      const dz = -walker.z;
      // as tall on the screen as it loads in near the bottom, easing down to SHRINK by the fork and held there (full
      // perspective felt like too much in the painted one); walking off up the road at the end, the distance shrinks it on
      const u = Math.max(0, Math.min(1, (START_Z - walker.z) / (START_Z - FORK_Z)));
      if (!walking) mon.scale = size * dz * (1 - (1 - SHRINK) * u * u * (3 - 2 * u));
      mon.group.scale.setScalar(mon.scale);
      mon.group.position.set(walker.x, 0, walker.z);
      const bob = calm || !walker.hop ? 0 : Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08;
      mon.board.position.y = bob;
      mon.board.scale.x = walker.flip ? -1 : 1;
      mon.board.rotation.x = -Math.atan2(camH - mon.top * 0.5 * mon.scale, dz) * 0.85;
      const t = calm ? 0 : now;
      for (const s of W.flies) {
        const u = s.userData, b = Math.sin(t * 0.0021 + u.ph * 3);
        s.position.set(u.x + Math.sin(t * 0.0005 + u.ph) * 0.8, u.y + Math.cos(t * 0.0007 + u.ph * 2) * 0.3, u.z);
        s.material.opacity = calm ? 0.8 : Math.max(0, b);
      }
      // till read, a board's "!" bobs over it and the board glows softly; till a road is picked, the signpost's arms breathe
      W.boards.forEach((b, i) => {
        const on = !read.has(i) && !walking, wave = calm ? 0.5 : (Math.sin(t * 0.004 + i * 1.7) + 1) / 2;
        const hint = W.hints[i];
        hint.visible = on;
        hint.position.y = b.userData.h + 0.55 + (calm ? 0 : Math.abs(Math.sin(t * 0.0035 + i * 1.3)) * 0.22);
        b.material.emissiveIntensity = on ? 0.14 + wave * 0.22 : 0.12;
      });
      // the signpost's arms glow and pulse, in turn till a road is picked, then the picked one brighter and the other dim
      W.arms.forEach((a, k) => {
        const wave = calm ? 0.5 : (Math.sin(t * (picked < 0 ? 0.003 : 0.005) + k * Math.PI) + 1) / 2;
        const lit = picked < 0 ? 0.3 + wave * 0.5 : k === picked ? 0.55 + wave * 0.55 : 0.18;
        a.material.forEach(m => { m.emissiveIntensity = lit; });
        a.userData.glow.material.opacity = picked < 0 ? 0.15 + wave * 0.4 : k === picked ? 0.3 + wave * 0.5 : 0;
        a.userData.glow.scale.x = ARM_L * (1.4 + wave * 0.25);
        if (picked < 0) a.rotation.z = calm ? 0 : Math.sin(t * 0.0022 + k * 2) * 0.035;
      });
      post.draw(W.scene, camera, (new THREE.Vector3(walker.x, 0.5, walker.z).project(camera).y + 1) / 2);
    }
    frame(performance.now(), 0);
    raf = requestAnimationFrame(loop);
    requestAnimationFrame(() => view.classList.add('on'));

    const ray = new THREE.Raycaster();
    const aim = (e) => {
      const rc = view.getBoundingClientRect(), y = e.clientY - rc.top, x = e.clientX - rc.left;
      ray.setFromCamera(new THREE.Vector2(x / rc.width * 2 - 1, -y / rc.height * 2 + 1), camera);
      const hit = ray.intersectObjects([...W.boards, ...W.arms, ...W.glimpses, W.ground], false)[0];
      if (hit?.object.userData.board !== undefined) { held = false; return readBoard(hit.object.userData.board); }
      toRead = -1;
      if (hit?.object.userData.road !== undefined) return pick(hit.object.userData.road);   // a road's arm, or its glimpse
      if (!hit || y <= hzK * rc.height + 4 || hit.point.z < -32) return pick(x < project(0, camH, -40)[0] ? 0 : 1);
      routeTo(hit.point.x, hit.point.z);
    };
    const onDown = (e) => {
      if (walking || asking || e.target.closest('.xr-panel, .xr-go')) return;
      if (reading >= 0) { closePanel(); return; }
      if (e.target === view) {
        // a tap on your Pokémon: its cry
        const rc = view.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -(e.clientY - rc.top) / rc.height * 2 + 1), camera);
        if (ray.intersectObject(mon.board, false).length && !route.length) { playCry(mon.id); return; }
      }
      held = true;
      aim(e);
    };
    const onMove = (e) => { if (held && !walking && (e.clientY - view.getBoundingClientRect().top) > hzK * vh + 4) aim(e); };
    const onUp = () => { held = false; };
    const KEYS = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
    const onKey = (e) => {
      if (asking) return;
      if (reading >= 0) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { closePanel(); e.preventDefault(); e.stopPropagation(); }
        return;
      }
      const k = KEYS[e.key];
      if (k) keys.add(k);
      else if ((e.key === 'Enter' || e.key === ' ') && picked >= 0) take();
      else if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
    };
    const onKeyUp = (e) => { if (KEYS[e.key]) keys.delete(KEYS[e.key]); };
    const onResize = () => { if (!walking) resize(); };
    scene.addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    addEventListener('keydown', onKey, true);
    addEventListener('keyup', onKeyUp, true);
    addEventListener('resize', onResize);
    go.onclick = (e) => { e.stopPropagation(); take(); };

    async function take() {
      if (walking || asking || picked < 0) return;
      closePanel();
      asking = true;
      keys.clear();
      route = [];
      playSound('stick');
      const sure = await confirmDialog(`Are you sure you want to enter the ${BIOMES_BY_ID[roads[picked]].name}?`, 'Enter');
      asking = false;
      if (!sure || walking) {
        if (regionOf(walker.x, walker.z) >= 0) { backing = true; routeTo(0, FORK_Z + 1.6); }
        return;
      }
      walking = true;
      keys.clear();
      playSound('confirm');
      scene.removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
      removeEventListener('keydown', onKey, true);
      removeEventListener('keyup', onKeyUp, true);
      removeEventListener('resize', onResize);
      go.disabled = true;
      scene.classList.add('chosen');
      face('back');
      routeTo(...onRoad(picked, GONE_T, 0));
      await sleep(calm ? 500 : 1300);
      scene.classList.add('dark');
      await sleep(650);
      const id = roads[picked];
      resolve({
        id,
        close: () => {
          cancelAnimationFrame(raf);
          scene.hidden = true;
          scene.classList.remove('dark', 'chosen', 'x3d');
          view.classList.remove('on');
          view.remove();
          panel.remove();
          W.scene.traverse(o => {
            o.geometry?.dispose();
            for (const m of [o.material].flat()) if (m) { m.map?.dispose(); m.dispose(); }
          });
        },
      });
    }
  } catch (e) {
    cancelAnimationFrame(raf);
    view.remove();
    scene.querySelector('.xr-panel')?.remove();
    throw e;
  }
  return { chosen };
}
