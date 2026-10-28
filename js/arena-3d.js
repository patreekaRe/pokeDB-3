/* arena-3d.js  -  a main biome's fight in 3D (the user's ask, 2026-10-11; a test on its own branch): the battle
   screen is untouched, every card, sprite, nameplate and animation is the page's own. The live pixel scene stays the
   backdrop (`backdrop`, its canvas as the 3D view's background, so each boss's pulse, lava or storm plays on), and 3D pads
   stand where the page draws its Pokémon: the pad's spot on screen (the CSS pad, now invisible) is cast into the ground
   (`layout()`), and followed every few frames (`follow()`), so it fits any screen and a sprite that resizes keeps its pad.
   The Clearing and the Wastes also lay their own 3D ground up to the pixel horizon (`GROUNDS`). The camera is fixed, high
   and behind your Pokémon like the games' battle view. A boss keeps its pixel prelude; the 3D fades in out of its last
   white flash (`revealArena()`). A Sky Pillar fight stands in one of the tower's rooms, built whole (`dressTower()`): only
   the sky in its windows is the pixel scene's. */

import { loadThree, tex, createPost, dispose, warmShaders, wakeGL, restGL, sleepGL, tooSoon } from './hd2d.js';
import { timeOfDay } from './daytime.js';
import { sceneHorizon, sceneColour, sceneBare } from './scene.js';
import { paintMedallion } from './medallion-art.js';
import { fine } from './hub-3d.js';
import { runeArt, bannerArt, STONES } from './hub-pillar.js';
import { BANNER } from './tower-art.js';

/* Every main biome's fights, boss, Alphas (Team Rocket's too) and wilds, stand on 3D pads in front of their own live pixel
   backdrop (the Ancient Tree's pulse, the lava, the Well: the user's calls, 2026-10-11); the Clearing, whose 3D place this
   was built for, also lays its 3D ground, bushes and side trees up to the horizon. A wild fight's kind is `fight`. */
const MAIN = new Set(['clearing', 'shrine', 'wastes', 'depths', 'ruins', 'thornwood', 'savanna']);
const KINDS = new Set(['boss', 'elite', 'fight', 'wild']);
export const arenaFor = (land, kind) => KINDS.has(kind) && MAIN.has(land);
const PAD_H = 0.2;
const PLAIN_LIGHT = 1.53;   // flatLight() under the plain lights pads elsewhere are seen in (build())

let THREE, renderer, scene, camera, post, view, hemi, sun, backdrop;
let A = null, raf = 0, last = 0, wanted = false, building = 0, stormOn = false, stormK = 0, flashK = 0, resizeTimer = 0;

function seeded(n) { return () => { n = (n + 0x6d2b79f5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const hd = (c) => { c.hd = 2; return c; };   // smooth sampling, mipmaps (hd2d.js's tex())

/** Whether this fight is laid in 3D: any main biome's fight in a biome that has its arena (`?arena2d` keeps the pixels).
    Kenmatta's fight (`def.arena` 'kombat') stands on 3D pads before his own Mortal Kombat courtyard (the user's call, 2026-10-11). */
export function wantsArena({ land, kind, def, run }) {
  if (new URLSearchParams(location.search).has('arena2d') || run.safari) return false;
  if (run.tower) return true;
  if (def.arena) return def.arena === 'kombat';
  return arenaFor(land, kind);
}

/* ---------- the looks, by the hour ---------- */

const TIMES = {
  day: { sky: '#cfeaf4', fog: '#bfe2c8', hemi: ['#f4fbff', '#7aa850', 2.1], sun: ['#fff4d8', 3.4], shaft: '#fff8d0', shaftA: 0.34, motes: '#fff8c0', fireflies: false, tint: '#ffffff' },
  dawn: { sky: '#f8d8c8', fog: '#d8d0c0', hemi: ['#fff0e8', '#6a8048', 1.8], sun: ['#ffd0a8', 3.0], shaft: '#ffd8b0', shaftA: 0.26, motes: '#ffe0c0', fireflies: false, tint: '#f8e0d8' },
  dusk: { sky: '#f0b090', fog: '#c09080', hemi: ['#ffd8c0', '#5a5a40', 1.6], sun: ['#ffb070', 3.0], shaft: '#ffb070', shaftA: 0.3, motes: '#ffd090', fireflies: true, tint: '#e8b090' },
  night: { sky: '#1a2440', fog: '#22304a', hemi: ['#7a90d0', '#1a2a30', 1.1], sun: ['#b0c8ff', 1.2], shaft: '#a8c8ff', shaftA: 0.1, motes: '#d8f080', fireflies: true, tint: '#6878a8' },
};

/* ---------- paintings ---------- */

const cache = {};
const once = (k, f) => (cache[k] ??= f());

function groundArt(seed) {
  return once(`ground${seed}`, () => {
    const c = hd(canvas(1024, 1024)), g = c.getContext('2d'), r = seeded(seed);
    g.fillStyle = '#7cc450'; g.fillRect(0, 0, 1024, 1024);
    const greens = ['#88d058', '#6cb048', '#98d864', '#5ea040', '#7cc050', '#a8e070'];
    for (let i = 0; i < 2600; i++) {
      const x = r() * 1024, y = r() * 1024, rad = 6 + r() * 26;
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      const col = greens[Math.floor(r() * greens.length)];
      grd.addColorStop(0, col + '70'); grd.addColorStop(1, col + '00');
      g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 40; i++) {   // worn earth and leaf litter
      const x = r() * 1024, y = r() * 1024, rad = 20 + r() * 50;
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, 'rgba(150,120,70,0.35)'); grd.addColorStop(1, 'rgba(150,120,70,0)');
      g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 9000; i++) {  // blades
      const x = r() * 1024, y = r() * 1024, l = 2 + r() * 5;
      g.strokeStyle = r() < 0.5 ? 'rgba(190,240,130,0.6)' : 'rgba(60,120,40,0.4)';
      g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 2, y - l); g.stroke();
    }
    for (let i = 0; i < 260; i++) {   // fallen leaves and clover flowers
      const x = r() * 1024, y = r() * 1024;
      g.fillStyle = r() < 0.6 ? ['#c8a050', '#a87838', '#d8b860'][Math.floor(r() * 3)] : ['#ffffff', '#f8e070', '#f8b0d0'][Math.floor(r() * 3)];
      g.beginPath(); g.ellipse(x, y, 2 + r() * 2, 1.2 + r(), r() * 3, 0, Math.PI * 2); g.fill();
    }
    return c;
  });
}

function barkArt() {
  return once('bark', () => {
    const c = hd(canvas(128, 256)), g = c.getContext('2d'), r = seeded(3);
    const lin = g.createLinearGradient(0, 0, 128, 0);
    lin.addColorStop(0, '#4e3418'); lin.addColorStop(0.45, '#7a5430'); lin.addColorStop(1, '#4e3418');
    g.fillStyle = lin; g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 70; i++) {
      const x = r() * 128, w = 1 + r() * 3;
      g.strokeStyle = r() < 0.5 ? 'rgba(40,24,10,0.5)' : 'rgba(160,120,80,0.35)';
      g.lineWidth = w; g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= 256; y += 32) g.lineTo(x + Math.sin(y * 0.05 + i) * 3, y);
      g.stroke();
    }
    for (let i = 0; i < 18; i++) {   // moss
      const x = r() * 128, y = 140 + r() * 116, rad = 6 + r() * 14;
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, 'rgba(110,170,70,0.7)'); grd.addColorStop(1, 'rgba(110,170,70,0)');
      g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    return c;
  });
}

function leafArt(tone) {
  return once(`leaf${tone}`, () => {
    const c = hd(canvas(256, 256)), g = c.getContext('2d'), r = seeded(11 + tone);
    const sets = [['#3e8a34', '#58a844', '#78c058', '#a0dc70', '#2a6a28'], ['#2e7030', '#4a9a40', '#68b450', '#90cc68', '#1e5022'], ['#4a9038', '#6ab048', '#8cc85c', '#b4e080', '#346a2a']][tone];
    g.fillStyle = sets[0]; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const x = r() * 256, y = r() * 256, s = 5 + r() * 9;
      g.fillStyle = sets[Math.min(4, Math.floor(r() * 4.4))];
      g.beginPath(); g.ellipse(x, y, s, s * 0.55, r() * Math.PI, 0, Math.PI * 2); g.fill();
    }
    return c;
  });
}

function bladeArt() {
  return once('blade', () => {
    const c = hd(canvas(128, 128)), g = c.getContext('2d'), r = seeded(21);
    for (let i = 0; i < 26; i++) {
      const x = 14 + r() * 100, h = 40 + r() * 70, lean = (r() - 0.5) * 46;
      const lin = g.createLinearGradient(0, 128, 0, 128 - h);
      lin.addColorStop(0, '#78b850'); lin.addColorStop(1, r() < 0.5 ? '#b8ec80' : '#d8f898');
      g.fillStyle = lin; g.beginPath(); g.moveTo(x - 4, 128); g.quadraticCurveTo(x + lean * 0.3, 128 - h * 0.6, x + lean, 128 - h); g.quadraticCurveTo(x + lean * 0.3 + 3, 128 - h * 0.5, x + 4, 128); g.fill();
    }
    return c;
  });
}

function flowerArt(petal, eye) {
  return once(`flower${petal}`, () => {
    const c = hd(canvas(64, 64)), g = c.getContext('2d');
    g.strokeStyle = '#3e8a34'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 64); g.quadraticCurveTo(28, 44, 32, 26); g.stroke();
    g.fillStyle = petal;
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.beginPath(); g.ellipse(32 + Math.cos(a) * 8, 20 + Math.sin(a) * 8, 7, 5, a, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = eye; g.beginPath(); g.arc(32, 20, 4.5, 0, Math.PI * 2); g.fill();
    return c;
  });
}

function glowArt() {
  return once('glow', () => {
    const c = hd(canvas(64, 64)), g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, 'rgba(255,255,255,0.7)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return c;
  });
}


/** A pad's top away from the Clearing: plain worn ground, white, so the pixel floor's own colour tints it. */
function stoneArt() {
  return once('stone', () => {
    const c = hd(canvas(256, 256)), g = c.getContext('2d'), r = seeded(41);
    const grd = g.createRadialGradient(128, 118, 10, 128, 128, 128);
    grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.7, '#e4e4e4'); grd.addColorStop(1, '#a8a8a8');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const x = r() * 256, y = r() * 256, rad = 2 + r() * 9;
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(80,80,80,0.18)';
      g.beginPath(); g.ellipse(x, y, rad, rad * 0.6, r() * 3, 0, Math.PI * 2); g.fill();
    }
    return c;
  });
}

function padTopArt() {
  return once('padTop', () => {
    const c = hd(canvas(256, 256)), g = c.getContext('2d'), r = seeded(31);
    const grd = g.createRadialGradient(128, 118, 10, 128, 128, 128);
    grd.addColorStop(0, '#b8ec88'); grd.addColorStop(0.6, '#8cd060'); grd.addColorStop(0.9, '#62a840'); grd.addColorStop(1, '#3e7a2c');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 124, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d;
      g.strokeStyle = r() < 0.5 ? 'rgba(200,250,150,0.5)' : 'rgba(50,110,40,0.4)';
      g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); g.stroke();
    }
    return c;
  });
}

function dirtArt() {
  return once('dirt', () => {
    const c = hd(canvas(256, 64)), g = c.getContext('2d'), r = seeded(41);
    const lin = g.createLinearGradient(0, 0, 0, 64);
    lin.addColorStop(0, '#4e8a36'); lin.addColorStop(0.18, '#3a6a2a'); lin.addColorStop(0.24, '#8a6a3a'); lin.addColorStop(1, '#5a4024');
    g.fillStyle = lin; g.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(60,40,20,0.5)' : 'rgba(180,140,90,0.4)';
      g.beginPath(); g.ellipse(r() * 256, 18 + r() * 46, 1 + r() * 3, 1 + r() * 2, 0, 0, Math.PI * 2); g.fill();
    }
    for (let x = 0; x < 256; x += 3) {   // grass overhanging the rim
      g.strokeStyle = '#5ea840'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 10); g.lineTo(x + (r() - 0.5) * 3, 14 + r() * 8); g.stroke();
    }
    return c;
  });
}

function shadowArt() {
  return once('shadow', () => {
    const c = hd(canvas(128, 128)), g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 20, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,0.5)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return c;
  });
}

/* ---------- building ---------- */

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, ...o });
let mats = null;
function materials() {
  if (mats) return mats;
  const keep = (t) => { t.userData.keep = true; return t; };
  const bark = keep(tex(barkArt()));
  bark.wrapS = bark.wrapT = THREE.RepeatWrapping;
  mats = {
    bark: std({ map: bark }),
    leaves: [0, 1, 2].map(i => std({ map: keep(tex(leafArt(i))), roughness: 1 })),
    blade: std({ map: keep(tex(bladeArt())), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }),
    flowers: [['#ffffff', '#f8d848'], ['#f8e048', '#f89830'], ['#f8a0c8', '#fff0f8'], ['#b0a0f8', '#ffffff']].map(([p, e]) => std({ map: keep(tex(flowerArt(p, e))), alphaTest: 0.5, side: THREE.DoubleSide })),
    padTop: std({ map: keep(tex(padTopArt())), roughness: 1 }),
    dirt: std({ map: keep(tex(dirtArt())) }),
    shadow: new THREE.MeshBasicMaterial({ map: keep(tex(shadowArt())), transparent: true, depthWrite: false }),
    rock: std({ color: '#a8a8a0', flatShading: true }),
    moss: std({ color: '#6aa848', roughness: 1 }),
    cap: std({ color: '#e04838', roughness: 0.6 }),
    stem: std({ color: '#f0e8d0' }),
    log: std({ map: bark }),
  };
  return mats;
}

let B = null;   // the arena being built: its group and what moves each frame
const add = (o, parent = B.group) => { parent.add(o); return o; };
function mesh(geo, m, x, y, z, { shadow = true } = {}) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = shadow; o.receiveShadow = true;
  return add(o);
}

/** A grassy battle pad, like the games' (Gen 4's raised discs): its top, a band of earth round it, its shadow. */
function pad(p, kit = null) {
  const M = materials(), g = new THREE.Group();
  g.position.set(p.x, p.lift ?? 0, p.z);
  const top = new THREE.Mesh(new THREE.CircleGeometry(p.r, 48), kit?.top ?? M.padTop);
  top.rotation.x = -Math.PI / 2; top.position.y = PAD_H; top.receiveShadow = true;
  const side = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r * 1.06, PAD_H + 0.04, 48, 1, true), kit?.side ?? M.dirt);
  side.position.y = PAD_H / 2 - 0.02; side.receiveShadow = true; side.castShadow = true;
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(p.r * 2.9, p.r * 2.9), M.shadow);
  shade.rotation.x = -Math.PI / 2; shade.position.y = 0.012;
  g.add(top, side, shade);
  if (kit && !kit.grass) { add(g); return g; }
  // a fringe of grass round its rim
  const n = Math.round(p.r * 22), blades = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.26).translate(0, 0.13, 0), M.blade, n);
  const d = new THREE.Object3D();
  if (kit?.blade) blades.material = kit.blade;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + Math.sin(i * 7.1) * 0.05;
    d.position.set(Math.cos(a) * p.r * 1.0, PAD_H - 0.06, Math.sin(a) * p.r * 1.0);
    d.rotation.set(0, -a + Math.PI / 2, 0);
    d.scale.setScalar(0.8 + ((i * 37) % 10) / 20);
    d.updateMatrix(); blades.setMatrixAt(i, d.matrix);
  }
  g.add(blades);
  add(g);
  return g;
}

/** A broadleaf tree: a tapered trunk on flared roots, a couple of boughs, a crown of leafy balls. `s` its size. */
function tree(x, z, s, r) {
  const M = materials(), g = new THREE.Group(), h = (3.6 + r() * 2.2) * s;
  g.position.set(x, 0, z);
  g.rotation.y = r() * Math.PI * 2;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.36 * s, h, 12).translate(0, h / 2, 0), M.bark);
  trunk.castShadow = trunk.receiveShadow = true;
  g.add(trunk);
  for (let i = 0; i < 4; i++) {   // roots
    const a = i / 4 * Math.PI * 2 + r() * 0.6, root = new THREE.Mesh(new THREE.ConeGeometry(0.16 * s, 1.1 * s, 7), M.bark);
    root.position.set(Math.cos(a) * 0.32 * s, 0.12 * s, Math.sin(a) * 0.32 * s);
    root.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25);
    root.castShadow = true; g.add(root);
  }
  for (let i = 0; i < 2; i++) {   // boughs
    const a = r() * Math.PI * 2, l = (1 + r()) * s, bough = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * s, 0.11 * s, l, 7).translate(0, l / 2, 0), M.bark);
    bough.position.set(0, h * (0.55 + r() * 0.2), 0);
    bough.rotation.set(Math.sin(a) * 0.9, 0, Math.cos(a) * 0.9);
    bough.castShadow = true; g.add(bough);
  }
  const leaf = M.leaves[Math.floor(r() * 3)], n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, d = (i === 0 ? 0 : 0.9 + r() * 0.5) * s, k = (1.1 + r() * 0.7) * s;
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), leaf);
    ball.position.set(Math.cos(a) * d, h + (i === 0 ? 0.7 * s : (r() - 0.3) * 0.8 * s), Math.sin(a) * d);
    ball.scale.set(k, k * 0.82, k);
    ball.castShadow = ball.receiveShadow = true; g.add(ball);
  }
  add(g);
  return g;
}


function rock(x, z, s, r) {
  const M = materials(), o = mesh(new THREE.DodecahedronGeometry(s, 0), M.rock, x, s * 0.35, z);
  o.scale.set(1, 0.6 + r() * 0.3, 0.8 + r() * 0.4);
  o.rotation.set(r(), r() * 6, r());
  if (r() < 0.6) { const m = mesh(new THREE.SphereGeometry(s * 0.7, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.moss, x, s * 0.5, z); m.scale.set(1, 0.35, 0.9); }
}

function mushroom(x, z, s) {
  const M = materials();
  mesh(new THREE.CylinderGeometry(0.05 * s, 0.07 * s, 0.22 * s, 8), M.stem, x, 0.11 * s, z);
  mesh(new THREE.SphereGeometry(0.16 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.cap, x, 0.2 * s, z).scale.set(1, 0.7, 1);
}

function bush(x, z, s, r) {
  const M = materials(), leaf = M.leaves[2];
  for (let i = 0; i < 4; i++) {
    const a = r() * Math.PI * 2, d = r() * 0.5 * s;
    const o = mesh(new THREE.IcosahedronGeometry(0.55 * s * (0.7 + r() * 0.5), 1), leaf, x + Math.cos(a) * d, 0.3 * s, z + Math.sin(a) * d);
    o.scale.y = 0.8;
  }
}

function log(x, z, r) {
  const M = materials(), l = 2.6 + r() * 1.4, o = mesh(new THREE.CylinderGeometry(0.32, 0.36, l, 12), M.log, x, 0.3, z);
  o.rotation.set(0, r() * Math.PI, Math.PI / 2);
}


/** Many of one card (a tuft of grass, a flower) scattered over the ground. */
function scatter(m, w, h, spots) {
  const geo = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0);
  const two = new THREE.InstancedMesh(geo, m, spots.length * 2), d = new THREE.Object3D();
  spots.forEach(([x, z, s, a], i) => {
    for (let k = 0; k < 2; k++) {
      d.position.set(x, 0, z); d.rotation.set(0, a + k * Math.PI / 2, 0); d.scale.setScalar(s);
      d.updateMatrix(); two.setMatrixAt(i * 2 + k, d.matrix);
    }
  });
  two.receiveShadow = true;
  add(two);
}

/** Lights that float: pollen by day, fireflies after dark, and the Ancient Tree's motes. */
function motes(n, colour, box, { size = 0.12, rise = 0.15 } = {}) {
  const geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3), seed = [];
  const r = seeded(n * 7 + box[0]);
  for (let i = 0; i < n; i++) {
    p[i * 3] = box[0] + r() * (box[1] - box[0]); p[i * 3 + 1] = 0.3 + r() * box[4]; p[i * 3 + 2] = box[2] + r() * (box[3] - box[2]);
    seed.push(r() * 100);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ map: tex(glowArt()), color: colour, size, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const pts = add(new THREE.Points(geo, m));
  const home = p.slice();
  B.ticks.push((t) => {
    for (let i = 0; i < n; i++) {
      const s = seed[i];
      p[i * 3] = home[i * 3] + Math.sin(t * 0.4 + s) * 0.5;
      p[i * 3 + 1] = home[i * 3 + 1] + Math.sin(t * 0.7 + s * 2) * 0.3 + ((t * rise + s) % 3) * (rise ? 0.4 : 0);
      p[i * 3 + 2] = home[i * 3 + 2] + Math.cos(t * 0.33 + s) * 0.5;
    }
    geo.attributes.position.needsUpdate = true;
    m.opacity = 0.7 + Math.sin(t * 2.1) * 0.3;
  });
  return pts;
}


/** Butterflies, by day: two wings flapping on a little loop about the clearing. */
function butterflies(n, r) {
  const cols = ['#ffffff', '#f8d848', '#f8a040'];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: cols[i % 3], side: THREE.DoubleSide });
    const wing = () => { const w = new THREE.Mesh(new THREE.CircleGeometry(0.09, 8).translate(0.09, 0, 0), m); w.rotation.x = -Math.PI / 2; const p = new THREE.Group(); p.add(w); return p; };
    const L = wing(), R = wing();
    R.scale.x = -1;
    g.add(L, R);
    add(g);
    const cx = (r() - 0.5) * 10, cz = -3 - r() * 6, s = r() * 10;
    B.ticks.push((t) => {
      const k = t * 0.35 + s;
      g.position.set(cx + Math.sin(k) * 2.5, 1.2 + Math.sin(k * 2.3) * 0.5, cz + Math.sin(k * 0.7) * 1.8);
      g.rotation.y = -k;
      const f = Math.sin(t * 18 + s) * 1.1;
      L.rotation.z = f; R.rotation.z = -f;
    });
  }
}

/** Rain for a boss close to fainting (setStorm in js/scene.js does the pixel scene's); in the Wastes, a rain of cinders. */
function rain(colour) {
  const n = 700, geo = new THREE.BufferGeometry(), p = new Float32Array(n * 6), r = seeded(77);
  const drops = [];
  for (let i = 0; i < n; i++) drops.push([(r() - 0.5) * 30, r() * 14, -16 + r() * 22, 8 + r() * 4]);
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0, depthWrite: false });
  const lines = add(new THREE.LineSegments(geo, m));
  lines.frustumCulled = false;
  B.ticks.push((t, dt) => {
    m.opacity = stormK * 0.55;
    if (!stormK) return;
    drops.forEach((d, i) => {
      d[1] -= d[3] * dt; if (d[1] < 0) d[1] += 14;
      p.set([d[0], d[1], d[2], d[0] + 0.08, d[1] + 0.5, d[2]], i * 6);
    });
    geo.attributes.position.needsUpdate = true;
  });
}

/* ---------- where things stand ---------- */

/** Where the page draws a pad (its CSS ::before / ::after, kept for this, never shown) in page pixels: centre and width.
    Offsets, not boxes, so a sprite sliding in (a transform) doesn't move it. */
function cssPad(zone, pseudo) {
  let x = 0, y = 0;
  for (let n = zone; n; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
  const cs = getComputedStyle(zone, pseudo), w = parseFloat(cs.width) || 160, bottom = parseFloat(cs.bottom) || 0;
  return { cx: x + zone.offsetWidth / 2, cy: y + zone.offsetHeight - bottom - w / 6, w };
}

const ray = () => new THREE.Raycaster();
/** A page point cast onto the pads' top. */
function onGround(px, py, h = PAD_H) {
  const rc = ray();
  rc.setFromCamera(new THREE.Vector2(px / innerWidth * 2 - 1, -(py / innerHeight * 2 - 1)), camera);
  const hit = new THREE.Vector3();
  return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -h), hit) ? hit : null;
}

/** Where a pad lands, cast onto the plane its top is on (`lift` above the ground: Kenmatta's dais). */
function padAt(p, lift = 0) {
  const h = lift + PAD_H, c = onGround(p.cx, p.cy, h), l = onGround(p.cx - p.w / 2, p.cy, h), rr = onGround(p.cx + p.w / 2, p.cy, h);
  if (!c || !l || !rr) return null;
  return { x: c.x, z: c.z, r: Math.abs(rr.x - l.x) / 2 * 0.86, sy: p.cy / innerHeight, lift };
}

function layout(lift = 0) {
  const spot = (zone, pseudo, h = 0) => padAt(cssPad(document.getElementById(zone), pseudo), h);
  return { foe: spot('enemy-zone', '::after', lift), you: spot('player-zone', '::before') };
}

/** A point's place on screen, 0-1 each way (y down). */
function onScreen(x, y, z) {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, front: v.z < 1 };
}

/* ---------- the arena ---------- */

function aimCamera(w, h) {
  camera.aspect = w / h;
  // a narrow lens from far off, so the far pad and the near one read about the same size, as the page draws them
  camera.fov = w / h < 0.8 ? 30 : 24;
  const pitch = 0.42, dist = w / h < 0.8 ? 21 : 24;
  camera.position.set(0, Math.sin(pitch) * dist, -3 + Math.cos(pitch) * dist);
  camera.lookAt(0, 0, -3);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

const hexOf = (c) => `#${c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const mixRgb = (c, k, to = 255) => c.map(v => v + (to - v) * k);

/** The pixel floor's colour round a pad (beside it, where the CSS pad doesn't cover the canvas), to dress a pad in it. */
function floorColour(p) {
  const cs = [[-0.7, 0], [0.7, 0], [-0.55, 0.12], [0.55, 0.12]].map(([dx, dy]) => sceneColour((p.cx + dx * p.w) / innerWidth, (p.cy + dy * p.w) / innerHeight)).filter(Boolean);
  if (!cs.length) return [150, 140, 120];
  return [0, 1, 2].map(i => cs.reduce((t, c) => t + c[i], 0) / cs.length);
}

/** A pad's look in a biome without a 3D ground: the pixel floor's colour on a plain worn top, grass at the rim in green places. */
function padKit(p, land) {
  const c = floorColour(p), green = c[1] > c[0] * 1.08 && c[1] > c[2];
  const top = std({ map: tex(stoneArt()), color: hexOf(mixRgb(c, 0.12)), roughness: 1 });
  const side = std({ map: tex(dirtArt()), color: hexOf(mixRgb(c, 0.35, 0)) });
  if (land === 'kombat') {   // the courtyard's flags, a gold-trimmed side
    const gain = flatLight();
    top.map = tex(flagsArt()); top.color.copy(painted([150, 136, 128], gain));
    side.map = null; side.color.copy(painted([120, 84, 40], gain)); side.metalness = 0.4; side.roughness = 0.5;
    return { top, side, blade: null, grass: false };
  }
  if (land === 'wastes') {   // basalt, lava glowing through its seams like the pixel pads'; as bright under its own light as elsewhere
    const glow = (WASTES_TIMES[timeOfDay()] ?? WASTES_TIMES.day).glow, k = PLAIN_LIGHT / flatLight();
    top.color.multiplyScalar(k); side.color.multiplyScalar(k);
    side.emissiveMap = tex(seamArt()); side.emissive.set('#ff6a18'); side.emissiveIntensity = glow * 1.4;
  }
  const blade = green ? std({ map: tex(bladeArt()), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, color: hexOf(mixRgb(c, 0.25)) }) : null;
  return { top, side, blade, grass: green || land === 'thornwood' };
}

function build(o) {
  const dress = GROUNDS[o.biome], clearing = o.biome === 'clearing';
  const look = TIMES[o.time] || TIMES.day, r = seeded(1234 + o.stage * 97 + (o.kind === 'boss' ? 5 : o.kind === 'elite' ? 0 : 11));
  B = { group: new THREE.Group(), ticks: [], look, runes: null, clearing };
  const M = materials();
  for (const m of [M.bark, ...M.leaves, M.blade, ...M.flowers, M.padTop, M.dirt, M.rock, M.moss, M.log]) m.color.set(clearing ? look.tint : '#ffffff');
  // the pixel scene, live (its boss's pulse, lava, rain), is the sky and the far land behind everything 3D
  scene.background = backdrop;
  const hz = sceneHorizon() ?? 0.42;
  const fogC = sceneColour(0.5, Math.max(0, hz - 0.02)) ?? [200, 220, 200];
  const wl = o.biome === 'wastes' ? WASTES_TIMES[o.time] || WASTES_TIMES.day : null;
  if (clearing) {
    hemi.color.set(look.hemi[0]); hemi.groundColor.set(look.hemi[1]); hemi.intensity = look.hemi[2];
    sun.color.set(look.sun[0]); sun.intensity = look.sun[1];
  } else if (o.biome === 'tower') {   // lit as the sky in its windows goes, by height
    const l = towerLight(o.tower.alt);
    hemi.color.set(l.hemi[0]); hemi.groundColor.set(l.hemi[1]); hemi.intensity = l.hemi[2];
    sun.color.set(l.sun[0]); sun.intensity = l.sun[1];
  } else if (o.biome === 'kombat') {   // always night: a blood-red sky, the braziers' fire doing the rest
    hemi.color.set('#d8b0c0'); hemi.groundColor.set('#40181a'); hemi.intensity = 1.6;
    sun.color.set('#ffb8a0'); sun.intensity = 1.4;
  } else if (wl) {   // its 3D ground stands in for the pixel floor, so it takes the floor's colours and a light by the hour
    hemi.color.set(wl.hemi[0]); hemi.groundColor.set(wl.hemi[1]); hemi.intensity = wl.hemi[2];
    sun.color.set(wl.sun[0]); sun.intensity = wl.sun[1];
  } else {   // the pixel floor is already lit by the hour: the pads only need to read as solid
    hemi.color.set('#ffffff'); hemi.groundColor.set('#808080'); hemi.intensity = 2.2;
    sun.color.set('#fff8ec'); sun.intensity = 2.0;
  }
  B.look = { ...look, hemi: [hemi.color.getStyle(), hemi.groundColor.getStyle(), hemi.intensity], sun: [sun.color.getStyle(), sun.intensity] };
  sun.position.set(-10, 18, -2);
  sun.target.position.set(0, 0, -4);

  const at = layout(LIFTS[o.biome]?.(hz) ?? 0);
  if (!at.foe || !at.you) return null;
  const far = onGround(innerWidth / 2, innerHeight * hz, 0);
  const span = far ? camera.position.distanceTo(far) : 40;
  scene.fog = dress ? new THREE.Fog(hexOf(fogC), span * 0.55, span * 1.15) : null;

  const kitOf = (zone, pseudo) => clearing ? null : o.biome === 'tower' ? towerPad(o.tower.alt) : padKit(cssPad(document.getElementById(zone), pseudo), o.biome);
  B.pads = [pad(at.foe, kitOf('enemy-zone', '::after')), pad(at.you, kitOf('player-zone', '::before'))];
  B.at = at;
  if (!dress) { const b = B; B = null; return b; }

  // the 3D ground, from your feet to just past the pixel horizon, fading into the pixel floor there
  const edge = onGround(innerWidth / 2, innerHeight * Math.max(0.05, hz - 0.045), 0);
  const zFar = edge ? edge.z : -20, zNear = 14, len = zNear - zFar;
  const fade = hd(canvas(4, 256)), fg = fade.getContext('2d'), fl = fg.createLinearGradient(0, 0, 0, 256);
  const fadeFrom = edge && far ? Math.min(0.5, Math.max(0.04, (far.z - zFar + 0.8) / len)) : 0.12;
  fl.addColorStop(0, '#000'); fl.addColorStop(fadeFrom * 0.35, '#000'); fl.addColorStop(fadeFrom, '#fff'); fl.addColorStop(1, '#fff');
  fg.fillStyle = fl; fg.fillRect(0, 0, 4, 256);
  const alpha = tex(fade); alpha.flipY = true;

  const clear = (x, z, m = 0.9) => [at.foe, at.you].every(p => Math.hypot(x - p.x, z - p.z) > p.r + m);
  const onLand = (x, z) => onScreen(x, 0, z).y > hz + 0.004;   // stands on the 3D ground, not out in the pixel backdrop
  const between = (x, z) => { const s = onScreen(x, 0, z); return s.y > at.foe.sy - 0.02 && s.y < at.you.sy + 0.06 && s.x > 0.1 && s.x < 0.9; };
  // anything tall on screen must keep off the middle, where the backdrop's landmark and both Pokémon are; `reach` is how far
  // its crown or branches spread, which near the camera can sweep across the whole screen from a trunk at the edge
  const side = (x, z, s, reach = 0) => {
    const ps = [];
    for (const dx of [-reach, 0, reach]) for (const dz of [-reach, 0, reach]) for (const y of [0, 6 * s]) ps.push(onScreen(x + dx, y, z + dz));
    const xs = ps.map(p => p.x);
    return ps.every(p => p.front) && (Math.max(...xs) < 0.17 || Math.min(...xs) > 0.83);
  };
  dress({ o, r, at, hz, zFar, zNear, len, alpha, look, wl, clear, onLand, between, side });
  const b = B;
  B = null;
  return b;
}

/** The Whispering Clearing: a meadow with trees framing the sides, bushes, rocks, mushrooms, flowers, pollen or fireflies. */
function dressClearing({ o, r, zFar, zNear, len, alpha, look, clear, onLand, between, side }) {
  const M = materials();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, len), std({ map: tex(groundArt(o.stage + 1)), color: look.tint, alphaMap: alpha, transparent: true }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = (zNear + zFar) / 2; ground.receiveShadow = true;
  ground.renderOrder = -1;
  add(ground);

  const deep = o.stage >= 2;
  let placed = 0;
  for (let i = 0; i < 500 && placed < 8; i++) {   // a few trees framing the sides, standing on the 3D ground
    const x = (r() - 0.5) * 40, z = zFar + 1 + r() * (len - 4), size = 0.8 + r() * 0.5;
    if (!onLand(x, z) || !side(x, z, size * 1.35, size * 3.3) || !clear(x, z, 2)) continue;   // tree()'s crown tops out ~8x its size, ~3.2x wide
    tree(x, z, size, r);
    placed++;
  }
  for (let i = 0; i < 40; i++) {   // bushes and rocks round the edges, a few in the open
    const x = (r() - 0.5) * 26, z = zFar + r() * (len - 2);
    if (!onLand(x, z) || !clear(x, z, 0.8) || between(x, z)) continue;
    if (r() < 0.55) bush(x, z, 0.8 + r() * 0.6, r); else rock(x, z, 0.3 + r() * 0.5, r);
  }
  for (let i = 0; i < 2 && deep; i++) { const x = (i ? 1 : -1) * (7 + r() * 3), z = -6 - r() * 4; if (onLand(x, z) && !between(x, z) && clear(x, z, 2)) log(x, z, r); }
  for (let i = 0; i < 30; i++) { const x = (r() - 0.5) * 24, z = zFar + r() * (len - 2); if (onLand(x, z) && clear(x, z, 0.5)) mushroom(x, z, 0.5 + r() * 0.5); }
  const tufts = [], flowers = [[], [], [], []];
  for (let i = 0; i < 900; i++) {
    const x = (r() - 0.5) * 36, z = zFar + r() * len;
    if (!onLand(x, z) || !clear(x, z, 0.25)) continue;
    if (r() < (o.stage === 0 ? 0.35 : 0.2)) flowers[Math.floor(r() * 4)].push([x, z, 0.5 + r() * 0.35, r() * 3]);
    else tufts.push([x, z, 0.6 + r() * 0.7, r() * 3]);
  }
  scatter(M.blade, 0.6, 0.36, tufts);
  flowers.forEach((f, i) => f.length && scatter(M.flowers[i], 0.36, 0.42, f));

  motes(look.fireflies || deep ? 50 : 30, look.fireflies ? '#e0f878' : look.motes, [-12, 12, zFar + 2, 2, 4], { size: look.fireflies ? 0.22 : 0.12, rise: 0.05 });
  if (o.time === 'day' || o.time === 'dawn') butterflies(o.stage === 0 ? 4 : 2, r);
  rain('#c8d8f0');
}

/* ---------- the Ember Wastes ---------- */

/* Its light by the hour (the pixel floor's colours already carry the hour; this only shades the 3D, warm by day, red at
   dusk, the lava's glow from below at night), how bright its lava burns and how many embers rise. */
const WASTES_TIMES = {
  day: { hemi: ['#ffffff', '#8a6a5a', 2.0], sun: ['#fff0d8', 2.4], glow: 0.8, embers: 30, ash: 150 },
  dawn: { hemi: ['#f8ecf4', '#7a5a60', 1.9], sun: ['#ffd0b0', 2.3], glow: 0.9, embers: 36, ash: 140 },
  dusk: { hemi: ['#fff0e8', '#904030', 1.9], sun: ['#ffa478', 2.5], glow: 1.05, embers: 50, ash: 130 },
  night: { hemi: ['#d8d8ff', '#c05020', 2.0], sun: ['#b8c0ff', 1.3], glow: 1.35, embers: 70, ash: 110 },
};

/** Draws `f(x, y)` at every wrap of a tile, so a mark on its edge carries on over the other side and the tile repeats seamlessly. */
function wrapped(size, x, y, rad, f) {
  for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
    if (x + dx + rad < 0 || x + dx - rad > size || y + dy + rad < 0 || y + dy - rad > size) continue;
    f(x + dx, y + dy);
  }
}

/** Ash-dusted basalt, light and neutral (the vertex colours give it the pixel floor's own), tiled over the ground. */
function basaltArt() {
  return once('basalt', () => {
    const N = 512, c = hd(canvas(N, N)), g = c.getContext('2d'), r = seeded(51);
    g.fillStyle = '#d4d0cc'; g.fillRect(0, 0, N, N);
    const blob = (x, y, rad, col) => wrapped(N, x, y, rad, (X, Y) => {
      const grd = g.createRadialGradient(X, Y, 0, X, Y, rad);
      grd.addColorStop(0, col); grd.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
      g.fillStyle = grd; g.fillRect(X - rad, Y - rad, rad * 2, rad * 2);
    });
    for (let i = 0; i < 260; i++) blob(r() * N, r() * N, 14 + r() * 50, r() < 0.5 ? 'rgba(255,252,248,0.45)' : 'rgba(120,110,104,0.35)');   // drifts of ash, bare rock
    for (let i = 0; i < 26; i++) {   // hairline cracks in the crust
      let x = r() * N, y = r() * N, a = r() * Math.PI * 2;
      g.strokeStyle = 'rgba(70,60,56,0.55)'; g.lineWidth = 1 + r();
      for (let k = 0; k < 7; k++) {
        const nx = x + Math.cos(a) * (8 + r() * 14), ny = y + Math.sin(a) * (8 + r() * 14);
        wrapped(N, x, y, 30, (X, Y) => { g.beginPath(); g.moveTo(X, Y); g.lineTo(X + nx - x, Y + ny - y); g.stroke(); });
        x = nx; y = ny; a += (r() - 0.5) * 1.2;
      }
    }
    for (let i = 0; i < 1400; i++) {   // grit and pebbles, each with a lit top and a shadow
      const x = r() * N, y = r() * N, s = 0.8 + r() * (r() < 0.1 ? 4 : 1.6);
      wrapped(N, x, y, s + 2, (X, Y) => {
        g.fillStyle = 'rgba(60,52,48,0.55)'; g.beginPath(); g.ellipse(X + 0.6, Y + 0.8, s, s * 0.7, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = r() < 0.5 ? 'rgba(236,232,228,0.8)' : 'rgba(150,142,136,0.8)'; g.beginPath(); g.ellipse(X, Y, s, s * 0.7, 0, 0, Math.PI * 2); g.fill();
      });
    }
    return c;
  });
}

/** Molten rock along a crack: u runs along it (tiled, so it flows), v across, from crust-dark edges to a white-hot core. */
function lavaArt() {
  return once('lava', () => {
    const c = hd(canvas(256, 64)), g = c.getContext('2d'), r = seeded(61);
    const lin = g.createLinearGradient(0, 0, 0, 64);
    lin.addColorStop(0, '#3a0c06'); lin.addColorStop(0.2, '#b02c0c'); lin.addColorStop(0.38, '#f07018'); lin.addColorStop(0.5, '#fff0a0');
    lin.addColorStop(0.62, '#f07018'); lin.addColorStop(0.8, '#b02c0c'); lin.addColorStop(1, '#3a0c06');
    g.fillStyle = lin; g.fillRect(0, 0, 256, 64);
    for (let i = 0; i < 70; i++) {   // cooling crust floating on it, and hotter swirls
      const x = r() * 256, y = 8 + r() * 48, w = 4 + r() * 16;
      wrapped(256, x, 32, w, (X) => {
        g.fillStyle = r() < 0.6 ? 'rgba(60,14,6,0.55)' : 'rgba(255,230,140,0.5)';
        g.beginPath(); g.ellipse(X, y, w, 1.5 + r() * 3, 0, 0, Math.PI * 2); g.fill();
      });
    }
    return c;
  });
}

/** A soft band, white across the middle: the glow over a crack, and (as an alpha map) the scorch round it. */
function bandArt() {
  return once('band', () => {
    const c = hd(canvas(8, 64)), g = c.getContext('2d'), lin = g.createLinearGradient(0, 0, 0, 64);
    lin.addColorStop(0, '#000'); lin.addColorStop(0.5, '#fff'); lin.addColorStop(1, '#000');
    g.fillStyle = lin; g.fillRect(0, 0, 8, 64);
    return c;
  });
}

/** A lava pool's face: glowing rock between plates of black crust. */
function poolArt() {
  return once('pool', () => {
    const N = 256, c = hd(canvas(N, N)), g = c.getContext('2d'), r = seeded(71);
    const grd = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
    grd.addColorStop(0, '#fff4b0'); grd.addColorStop(0.5, '#f8a028'); grd.addColorStop(1, '#c03810');
    g.fillStyle = grd; g.fillRect(0, 0, N, N);
    for (let i = 0; i < 26; i++) {
      const x = r() * N, y = r() * N, k = 8 + r() * 22, n = 5 + Math.floor(r() * 3), a0 = r() * 6;
      const pts = Array.from({ length: n }, (_, j) => { const a = a0 + j / n * Math.PI * 2, d = k * (0.6 + r() * 0.4); return [x + Math.cos(a) * d, y + Math.sin(a) * d]; });
      g.fillStyle = 'rgba(255,120,30,0.8)';
      g.beginPath(); pts.forEach(([px, py], j) => j ? g.lineTo(px + 1.5, py + 1.5) : g.moveTo(px + 1.5, py + 1.5)); g.fill();
      g.fillStyle = ['#2a1410', '#3a1c14', '#1e0e0a'][i % 3];
      g.beginPath(); pts.forEach(([px, py], j) => j ? g.lineTo(px, py) : g.moveTo(px, py)); g.fill();
    }
    return c;
  });
}

/** A pad's side in the Wastes: layered basalt with seams of lava glowing through (its emissive map). */
function seamArt() {
  return once('seam', () => {
    const c = hd(canvas(256, 64)), g = c.getContext('2d'), r = seeded(81);
    g.fillStyle = '#000'; g.fillRect(0, 0, 256, 64);
    g.strokeStyle = '#fff'; g.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      let x = r() * 256, y = 26 + r() * 34;
      g.lineWidth = 1 + r() * 1.6; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += 4 + r() * 10; y = Math.max(22, Math.min(62, y + (r() - 0.5) * 12)); g.lineTo(x, y); }
      g.stroke();
    }
    return c;
  });
}

/** The light a flat face gets from the arena's lights as they are, so a colour can be divided by it and come out as painted. */
function flatLight() {
  const lum = (c) => c.r * 0.3 + c.g * 0.55 + c.b * 0.15, dir = new THREE.Vector3().subVectors(sun.position, sun.target.position).normalize();
  return (hemi.intensity * lum(hemi.color) + sun.intensity * dir.y * lum(sun.color)) / Math.PI * 1.25;
}

/** sRGB 0-255 from the pixel scene, as a linear colour divided by `gain` (the light falling on it), so once lit it reads as it was painted. */
function painted(c, gain) {
  return new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace).multiplyScalar(1 / gain);
}

/** The pixel floor's colour along a row, from both sides of the screen (never the middle, where its landmark stands): the median, so a lava crack or a rock doesn't sway it. */
function rowColour(y) {
  const cs = [0.03, 0.08, 0.14, 0.2, 0.8, 0.86, 0.92, 0.97].map(x => sceneColour(x, y)).filter(Boolean);
  if (!cs.length) return null;
  cs.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
  return cs[cs.length >> 1];
}

/** Flat ribbons laid on the ground along a crack's path: the scorch, the molten core and its glow, each merged into one mesh. */
function ribbons() {
  const layers = { scorch: [], core: [], glow: [] };
  return {
    lay(pts, w) {
      let u = 0;
      const L = layers;
      const strip = (out, width, y) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], t0 = i / (pts.length - 1), t1 = (i + 1) / (pts.length - 1);
          const w0 = width * Math.pow(Math.sin(Math.PI * Math.min(0.98, Math.max(0.02, t0))), 0.6), w1 = width * Math.pow(Math.sin(Math.PI * Math.min(0.98, Math.max(0.02, t1))), 0.6);
          const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l;
          const u0 = u + i * 0.6, u1 = u + (i + 1) * 0.6;
          out.push([x0 + nx * w0, y, z0 + nz * w0, u0, 0], [x1 + nx * w1, y, z1 + nz * w1, u1, 0], [x0 - nx * w0, y, z0 - nz * w0, u0, 1],
            [x1 + nx * w1, y, z1 + nz * w1, u1, 0], [x1 - nx * w1, y, z1 - nz * w1, u1, 1], [x0 - nx * w0, y, z0 - nz * w0, u0, 1]);
        }
      };
      strip(L.scorch, w * 3.2, 0.015);
      strip(L.core, w, 0.03);
      strip(L.glow, w * 2.6, 0.06);
      u += pts.length;
    },
    mesh(name, m) {
      const v = layers[name];
      if (!v.length) return null;
      const pos = new Float32Array(v.length * 3), uv = new Float32Array(v.length * 2);
      v.forEach((p, i) => { pos.set(p.slice(0, 3), i * 3); uv.set(p.slice(3), i * 2); });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.computeVertexNormals();
      const o = new THREE.Mesh(geo, m);
      o.receiveShadow = name === 'scorch';
      return add(o);
    },
  };
}

/** Points drifting through a box, wrapping top to bottom: ash falling, embers rising (`vy` > 0), each swaying a little. */
function drift(n, box, { colour, size, vy, glow = false, sway = 0.4 }) {
  const geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3), r = seeded(n * 13 + Math.round(vy * 10)), seed = [];
  const [x0, x1, z0, z1, top] = box;
  for (let i = 0; i < n; i++) { p.set([x0 + r() * (x1 - x0), r() * top, z0 + r() * (z1 - z0)], i * 3); seed.push(r() * 100); }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.PointsMaterial({ map: tex(glowArt()), color: colour, size, transparent: true, depthWrite: false, sizeAttenuation: true,
    ...(glow ? { blending: THREE.AdditiveBlending } : { opacity: 0.85 }) });
  const pts = add(new THREE.Points(geo, m));
  pts.frustumCulled = false;
  B.ticks.push((t, dt) => {
    for (let i = 0; i < n; i++) {
      const s = seed[i];
      let y = p[i * 3 + 1] + vy * (0.7 + (s % 1) * 0.6) * dt;
      if (y > top) y -= top; else if (y < 0) y += top;
      p[i * 3 + 1] = y;
      p[i * 3] += Math.sin(t * 0.8 + s) * sway * dt;
      p[i * 3 + 2] += Math.cos(t * 0.6 + s) * sway * 0.5 * dt;
    }
    geo.attributes.position.needsUpdate = true;
    if (glow) m.opacity = 0.75 + Math.sin(t * 7.3) * 0.15 + Math.sin(t * 3.1) * 0.1;
  });
  return pts;
}

/** Smoke curling up off the lava, a few soft puffs rising, swelling and thinning out, then starting again. */
function smoke(spots, colour) {
  const m = new THREE.SpriteMaterial({ map: tex(glowArt()), color: colour, transparent: true, depthWrite: false, opacity: 0 });
  spots.forEach(([x, z], k) => {
    for (let j = 0; j < 2; j++) {
      const s = new THREE.Sprite(m.clone()), off = j / 2 + k * 0.37;
      add(s);
      B.ticks.push((t) => {
        const f = (t * 0.12 + off) % 1;
        s.position.set(x + Math.sin(t * 0.5 + off * 9) * 0.3 * f, 0.3 + f * 4, z);
        s.scale.setScalar(0.8 + f * 2.6);
        s.material.opacity = Math.sin(f * Math.PI) * 0.32;
      });
    }
  });
}

/** The Ember Wastes: an ashen basalt plain from your feet to the volcano, lava cracks glowing round its edges (more in the
    Lava Fields, a lava pool or two there and at the Crater Rim), basalt rocks and ash heaps, charred snags at the sides,
    obsidian on the Volcano Slope and the Crater Rim, ash falling, embers rising, smoke off the lava. */
function dressWastes({ o, r, at, hz, zFar, zNear, len, alpha, wl, clear, onLand, between, side }) {
  const boss = o.kind === 'boss', st = o.stage, gain = flatLight();
  const glowK = wl.glow + (boss ? 0.3 : 0) + (o.kind === 'elite' ? 0.1 : 0);

  // the ground, in the pixel floor's own colours row by row (darker or lighter towards the horizon, graded for an Alpha or a boss)
  const rows = 24, geo = new THREE.PlaneGeometry(80, len, 1, rows), cols = new THREE.BufferAttribute(new Float32Array((rows + 1) * 2 * 3), 3);
  geo.setAttribute('color', cols);
  const tinters = [];
  // read again when a boss's arena is shown: built under its prelude, the floor was mid-eruption
  const tint = () => {
    const posA = geo.attributes.position;
    let near = null;
    for (let i = 0; i < posA.count; i++) {
      const z = (zNear + zFar) / 2 - posA.getY(i);   // the plane is laid flat: its y becomes -z
      const c = rowColour(Math.min(0.995, Math.max(hz + 0.01, onScreen(0, 0, z).y))) ?? near ?? [90, 76, 70];
      near = c;
      const col = painted(c, gain);
      cols.setXYZ(i, col.r, col.g, col.b);
    }
    cols.needsUpdate = true;
    // its haze is the far floor's colour (a boss's horizon is a band of lava, which hazed it all orange)
    const hc = rowColour(hz + 0.02);
    if (hc && scene.fog) scene.fog.color.set(hexOf(hc));
    const fc = painted(rowColour(Math.min(0.95, (at.foe.sy + at.you.sy) / 2)) ?? [90, 76, 70], gain);
    for (const f of tinters) f(fc);
  };
  B.retint = tint;
  const basalt = tex(basaltArt());
  basalt.wrapS = basalt.wrapT = THREE.RepeatWrapping;
  basalt.repeat.set(16, len / 5);
  const ground = new THREE.Mesh(geo, std({ map: basalt, vertexColors: true, alphaMap: alpha, transparent: true, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = (zNear + zFar) / 2; ground.receiveShadow = true;
  ground.renderOrder = -1;
  add(ground);
  const tinted = (m, k = 1) => { tinters.push(fc => m.color.copy(fc).multiplyScalar(k)); return m; };

  // lava cracks, wandering over the ground round the edges, never across the middle or under a pad
  const lava = tex(lavaArt());
  lava.wrapS = THREE.RepeatWrapping;
  const band = tex(bandArt());
  const R = ribbons(), vents = [];
  // flat things may lie anywhere but the middle between the two Pokémon; spots are picked on screen, so a phone's narrow view gets its share
  const middle = (x, z) => { const s = onScreen(x, 0, z); return s.y > at.foe.sy - 0.05 && s.y < at.you.sy + 0.06 && s.x > 0.24 && s.x < 0.76; };
  const ok = (x, z, m = 0.5) => onLand(x, z) && clear(x, z, m) && !middle(x, z);
  const okCrack = boss ? (x, z) => onLand(x, z) && clear(x, z, 0.6) : ok;   // the Crater Rim's lava runs right across it, like the pixel arena's
  const spot = () => onGround(r() * innerWidth, innerHeight * (hz + 0.012 + Math.pow(r(), 1.4) * (0.94 - hz)), 0) ?? { x: 0, z: zFar };
  const cracks = [7, 12, 8, 10][st] + (boss ? 2 : 0);
  for (let i = 0, made = 0; i < 300 && made < cracks; i++) {
    let { x, z } = spot(), a = r() * Math.PI * 2;
    if (!okCrack(x, z)) continue;
    const pts = [[x, z]], steps = 7 + Math.floor(r() * (st === 1 || boss ? 14 : 9));
    for (let k = 0; k < steps; k++) {
      a += (r() - 0.5) * 1.1;
      const nx = x + Math.cos(a) * (0.5 + r() * 0.5), nz = z + Math.sin(a) * (0.5 + r() * 0.5);
      if (!okCrack(nx, nz)) break;
      x = nx; z = nz; pts.push([x, z]);
    }
    if (pts.length < 4) continue;
    R.lay(pts, (st === 1 || boss ? 0.24 : 0.16) + r() * 0.12);
    if (r() < 0.5) vents.push(pts[pts.length >> 1]);
    made++;
  }
  R.mesh('scorch', new THREE.MeshBasicMaterial({ color: '#140806', alphaMap: band, transparent: true, opacity: 0.7, depthWrite: false }));
  const core = new THREE.MeshBasicMaterial({ map: lava, color: '#ffffff', toneMapped: false });
  R.mesh('core', core);
  const glowM = new THREE.MeshBasicMaterial({ map: band, color: '#ff6a18', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 });
  R.mesh('glow', glowM);

  // lava pools: in the Lava Fields and at the Crater Rim, off to the sides
  const pools = [];
  for (let i = 0, want = st === 1 ? 2 : st === 3 || boss ? 2 : 0; i < 200 && pools.length < want; i++) {
    const { x, z } = spot(), s = 0.7 + r() * 0.8;
    if (!ok(x, z, s + 1) || pools.some(p => Math.hypot(p[0] - x, p[1] - z) < 4) || !side(x, z, 0.05)) continue;
    pools.push([x, z, s]);
  }
  const poolTex = tex(poolArt());
  const poolM = new THREE.MeshBasicMaterial({ map: poolTex, toneMapped: false });
  for (const [x, z, s] of pools) {
    const disc = (rad, m, y) => {
      const g = new THREE.CircleGeometry(rad, 28), p = g.attributes.position;
      for (let i = 1; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)), k = 1 + Math.sin(a * 3 + x) * 0.12 + Math.sin(a * 5 + z) * 0.08; p.setXY(i, p.getX(i) * k, p.getY(i) * k); }
      const o = mesh(g, m, x, y, z, { shadow: false });
      o.rotation.x = -Math.PI / 2; o.scale.y = 0.75;
      return o;
    };
    disc(s * 1.7, new THREE.MeshBasicMaterial({ color: '#140806', map: tex(glowArt()), transparent: true, opacity: 0.85, depthWrite: false }), 0.012);
    disc(s * 1.25, tinted(std({ roughness: 1, flatShading: true }), 0.55), 0.02);
    disc(s, poolM, 0.05);
    const halo = mesh(new THREE.PlaneGeometry(s * 4, s * 3), new THREE.MeshBasicMaterial({ map: tex(glowArt()), color: '#ff7a20', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }), x, 0.08, z, { shadow: false });
    halo.rotation.x = -Math.PI / 2;
    vents.push([x, z]);
  }
  B.ticks.push((t, dt) => {   // the lava flows and breathes
    lava.offset.x = (lava.offset.x + dt * 0.09) % 1;
    poolTex.offset.set(Math.sin(t * 0.1) * 0.03, Math.cos(t * 0.08) * 0.03);
    const p = glowK * (0.85 + Math.sin(t * 1.3) * 0.1 + Math.sin(t * 3.7) * 0.05);
    glowM.opacity = 0.6 * p;
    core.color.setScalar(0.75 + 0.25 * p);
    poolM.color.setScalar(0.8 + 0.2 * p);
  });

  // basalt rocks and pebbles round the edges, a few boulders, ash heaps: one instanced mesh each
  const d = new THREE.Object3D(), rocks = [], heaps = [], shards = [];
  for (let i = 0; i < 400 && rocks.length < 90; i++) {
    const { x, z } = spot(), big = r() < 0.2, s = big ? 0.45 + r() * 0.65 : 0.07 + r() * 0.2;
    if (!onLand(x, z) || !clear(x, z, s + 0.5) || (big ? !side(x, z, s * 0.2) : middle(x, z) && r() < 0.85)) continue;
    rocks.push([x, z, s]);
  }
  for (let i = 0; i < 200 && heaps.length < (st === 0 ? 14 : 7); i++) {
    const { x, z } = spot(), s = 0.5 + r() * 0.9;
    if (!ok(x, z, s)) continue;
    heaps.push([x, z, s]);
  }
  if (st >= 2 || boss) for (let i = 0; i < 200 && shards.length < 7; i++) {   // obsidian, in clusters
    const { x, z } = spot();
    if (!ok(x, z, 1) || !side(x, z, 0.15)) continue;
    shards.push([x, z]);
  }
  const rockM = std({ roughness: 0.95, flatShading: true });
  const rockI = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), rockM, rocks.length);
  const shade = [];
  rocks.forEach(([x, z, s], i) => {
    d.position.set(x, s * 0.25, z); d.rotation.set(r() * 3, r() * 6, r() * 3); d.scale.set(s, s * (0.55 + r() * 0.35), s * (0.8 + r() * 0.4));
    d.updateMatrix(); rockI.setMatrixAt(i, d.matrix);
    shade.push(0.5 + r() * 0.65);
  });
  tinters.push(fc => { const c = new THREE.Color(); shade.forEach((k, i) => rockI.setColorAt(i, c.copy(fc).multiplyScalar(k))); if (rockI.instanceColor) rockI.instanceColor.needsUpdate = true; });
  rockI.castShadow = rockI.receiveShadow = true;
  if (rocks.length) add(rockI);
  const heapI = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), tinted(std({ roughness: 1 }), 1.05), heaps.length);
  heaps.forEach(([x, z, s], i) => {
    d.position.set(x, 0, z); d.rotation.set(0, r() * 6, 0); d.scale.set(s, s * 0.3, s * (0.6 + r() * 0.4));
    d.updateMatrix(); heapI.setMatrixAt(i, d.matrix);
  });
  heapI.receiveShadow = true; heapI.castShadow = true;
  if (heaps.length) add(heapI);
  if (shards.length) {
    const n = shards.length * 4, shardI = new THREE.InstancedMesh(new THREE.ConeGeometry(0.22, 1, 5).translate(0, 0.5, 0),
      std({ color: '#2c2438', roughness: 0.18, metalness: 0.35, flatShading: true, emissive: '#3a1a40', emissiveIntensity: 0.4 }), n);
    shards.forEach(([x, z], k) => {
      for (let j = 0; j < 4; j++) {
        const a = r() * 6, dd = j ? 0.2 + r() * 0.35 : 0, h = j ? 0.5 + r() * 0.8 : 1.2 + r() * 1.1;
        d.position.set(x + Math.cos(a) * dd, -0.05, z + Math.sin(a) * dd);
        d.rotation.set(Math.sin(a) * dd * 1.2, r() * 6, -Math.cos(a) * dd * 1.2);
        d.scale.set(0.7 + r() * 0.6, h, 0.7 + r() * 0.6);
        d.updateMatrix(); shardI.setMatrixAt(k * 4 + j, d.matrix);
      }
    });
    shardI.castShadow = shardI.receiveShadow = true;
    add(shardI);
  }

  // charred snags framing the sides, like the Clearing's trees
  const charM = tinted(std({ roughness: 1 }), 0.45);
  for (let i = 0, placed = 0; i < 400 && placed < (st === 0 ? 5 : 3); i++) {
    const x = (r() - 0.5) * 40, z = zFar + 1 + r() * (len - 4), s = 0.7 + r() * 0.5;
    if (!onLand(x, z) || !side(x, z, s * 0.75, s * 1.5) || !clear(x, z, 2) || Math.abs(onScreen(x, 0, z).x - 0.5) < 0.38) continue;
    snag(x, z, s, r, charM);
    placed++;
  }

  // ash falling, embers rising off the cracks, smoke off the lava
  const boxW = [-14, 14, zFar + 2, zNear - 4];
  drift(wl.ash, [...boxW, 9], { colour: '#c8c0bc', size: 0.09, vy: -0.45, sway: 0.5 });
  drift(Math.round(wl.embers * (boss ? 1.8 : 1) * (st === 1 || st === 3 ? 1.3 : 1)), [...boxW, 6], { colour: '#ffa040', size: 0.16, vy: 0.9, glow: true, sway: 0.8 });
  smoke(vents.slice(0, 4), o.time === 'night' ? '#4a3a38' : '#8a7c78');
  rain('#ffa860');
  tint();
}

/** A dead tree burnt black: a leaning trunk and a few bare branches, forked at their ends, merged into one mesh (one draw). */
function snag(x, z, s, r, m) {
  const parts = [], h = (2.6 + r() * 1.6) * s, o = new THREE.Object3D();
  const part = (r0, r1, l, at, rx, rz, parent = null) => {
    const geo = new THREE.CylinderGeometry(r1, r0, l, 6).translate(0, l / 2, 0).toNonIndexed();
    o.position.set(...at); o.rotation.set(rx, 0, rz); o.updateMatrix();
    const mat = parent ? parent.clone().multiply(o.matrix) : o.matrix.clone();
    parts.push(geo.applyMatrix4(mat));
    return mat;
  };
  part(0.22 * s, 0.07 * s, h, [0, 0, 0], 0, 0);
  for (let i = 0; i < 4; i++) {
    const a = r() * Math.PI * 2, l = (0.8 + r() * 0.9) * s, b = part(0.07 * s, 0.025 * s, l, [0, h * (0.45 + i * 0.13), 0], Math.sin(a) * 0.95, Math.cos(a) * 0.95);
    part(0.03 * s, 0.01 * s, l * 0.5, [0, l * 0.8, 0], 0.6, 0.4, b);
  }
  const geo = new THREE.BufferGeometry();
  for (const key of ['position', 'normal']) {
    const all = new Float32Array(parts.reduce((n, g) => n + g.attributes[key].array.length, 0));
    parts.reduce((at, g) => { all.set(g.attributes[key].array, at); return at + g.attributes[key].array.length; }, 0);
    geo.setAttribute(key, new THREE.BufferAttribute(all, 3));
  }
  parts.forEach(g => g.dispose());
  const tree = mesh(geo, m, x, 0, z);
  tree.rotation.set((r() - 0.5) * 0.15, r() * 6, (r() - 0.5) * 0.15);
}

/* ---------- Chad Master Kenmatta's courtyard ---------- */

/* His Mortal Kombat courtyard: the painted wall, gate tower and medallion stay the backdrop; the flags in front of it,
   his dais and its carpeted steps and two braziers are 3D. The painted floor is a low strip just above your Pokémon's pad,
   so his pad stands raised on the dais against the wall, where the page draws it. */
const KOMBAT = {
  stone: [138, 120, 112], stoneDark: [92, 78, 72], carpet: [184, 36, 32], carpetDark: [110, 18, 20],
  gold: [248, 200, 48], lacquer: [184, 40, 32],
};

/** Big light flags in staggered rows, dark seams, a few cracks and chips (the vertex colours give them the painted floor's). */
function flagsArt() {
  return once('flags', () => {
    const N = 512, c = hd(canvas(N, N)), g = c.getContext('2d'), r = seeded(91), rows = 4, h = N / rows, w = N / 3;
    g.fillStyle = '#2a2224'; g.fillRect(0, 0, N, N);
    for (let y = 0; y < rows; y++) for (let k = -1; k < 4; k++) {
      const x = k * w + (y % 2) * w / 2, tone = 200 + Math.floor(r() * 40);
      g.fillStyle = `rgb(${tone},${tone - 6},${tone - 10})`;
      g.fillRect(x + 4, y * h + 4, w - 8, h - 8);
      const lit = g.createLinearGradient(0, y * h, 0, y * h + h);
      lit.addColorStop(0, 'rgba(255,255,255,0.18)'); lit.addColorStop(0.15, 'rgba(255,255,255,0)'); lit.addColorStop(0.85, 'rgba(0,0,0,0)'); lit.addColorStop(1, 'rgba(0,0,0,0.22)');
      g.fillStyle = lit; g.fillRect(x + 4, y * h + 4, w - 8, h - 8);
    }
    for (let i = 0; i < 700; i++) {   // wear and grit
      const x = r() * N, y = r() * N, s = 1 + r() * 3;
      g.fillStyle = r() < 0.5 ? 'rgba(255,250,244,0.25)' : 'rgba(40,30,30,0.22)';
      g.beginPath(); g.ellipse(x, y, s, s * 0.7, 0, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(40,30,30,0.6)'; g.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {   // hairline cracks
      let x = r() * N, y = r() * N, a = r() * 6;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { a += (r() - 0.5) * 1.4; x += Math.cos(a) * 12; y += Math.sin(a) * 12; g.lineTo(x, y); }
      g.stroke();
    }
    return c;
  });
}

/** How high his dais must be for his pad, cast where the page draws it, to stand just in front of the wall (0 when the
    page draws him down on the floor, a wide screen). */
function kombatLift(hz) {
  const wall = onGround(innerWidth / 2, innerHeight * hz, 0);
  if (!wall) return 0;
  const p = cssPad(document.getElementById('enemy-zone'), '::after'), rc = ray();
  rc.setFromCamera(new THREE.Vector2(p.cx / innerWidth * 2 - 1, -(p.cy / innerHeight * 2 - 1)), camera);
  const { origin: O, direction: D } = rc.ray;
  let lift = 0;
  for (let i = 0; i < 4; i++) {
    const at = padAt(p, lift);
    if (!at) return 0;
    const z = wall.z + at.r * 1.1 + 0.5, t = (z - O.z) / D.z;
    lift = O.y + D.y * t - PAD_H;
  }
  return lift > 0.4 ? lift : 0;
}

function dressKombat({ o, r, at, hz, zNear }) {
  scene.fog = null;
  const gain = flatLight(), paint = (c) => painted(c, gain);
  const wall = onGround(innerWidth / 2, innerHeight * hz, 0), zW = wall ? wall.z : -10, len = zNear - zW;

  // the flags from your feet to the foot of the wall, in the painted floor's colours row by row
  const rows = 16, geo = new THREE.PlaneGeometry(80, len, 1, rows), cols = new THREE.BufferAttribute(new Float32Array((rows + 1) * 2 * 3), 3);
  geo.setAttribute('color', cols);
  const tint = () => {
    const posA = geo.attributes.position;
    let near = null;
    for (let i = 0; i < posA.count; i++) {
      const z = (zNear + zW) / 2 - posA.getY(i);
      const c = rowColour(Math.min(0.995, Math.max(hz + 0.006, onScreen(0, 0, z).y))) ?? near ?? [86, 76, 72];
      near = c;
      const col = paint(c.map(v => v * 1.15));
      cols.setXYZ(i, col.r, col.g, col.b);
    }
    cols.needsUpdate = true;
  };
  B.retint = tint;
  const flags = tex(flagsArt());
  flags.wrapS = flags.wrapT = THREE.RepeatWrapping;
  flags.repeat.set(80 / 3.6, len / 2.4);
  const ground = mesh(geo, std({ map: flags, vertexColors: true, roughness: 0.95 }), 0, 0, (zNear + zW) / 2, { shadow: false });
  ground.rotation.x = -Math.PI / 2;
  ground.renderOrder = -1;
  tint();

  const stoneM = std({ map: tex(flagsArt()), color: paint(KOMBAT.stone), roughness: 0.9 });
  const riserM = std({ color: paint(KOMBAT.stoneDark), roughness: 0.95 });
  const goldM = std({ color: paint(KOMBAT.gold), metalness: 0.6, roughness: 0.35, emissive: '#5a3008', emissiveIntensity: 0.3 });
  const carpetM = std({ color: paint(KOMBAT.carpet), roughness: 1 });
  const carpetDarkM = std({ color: paint(KOMBAT.carpetDark), roughness: 1 });

  // his dais against the wall and its steps down to the flags, a red carpet down the middle edged in gold
  const foe = at.foe;
  if (foe.lift > 0) {
    const g = new THREE.Group();
    g.position.set(foe.x, 0, foe.z);
    add(g);
    B.dais = g;
    const Y = foe.lift, hw = foe.r + 0.45, back = zW - 0.3 - foe.z, front = foe.r + 0.4;
    const n = Math.max(3, Math.round(Y / 0.26)), rise = Y / n, run = Math.min(0.42, Math.max(0.24, rise * 1.1)), cw = foe.r * 0.42;
    const box = new THREE.BoxGeometry(1, 1, 1), d = new THREE.Object3D();
    const parts = { stone: [], riser: [], gold: [], carpet: [], carpetDark: [] };
    const put = (kind, x, y, z, sx, sy, sz) => parts[kind].push([x, y, z, sx, sy, sz]);
    put('stone', 0, Y / 2, (back + front) / 2, hw * 2, Y, front - back);
    put('gold', 0, Y - 0.03, front, hw * 2 + 0.04, 0.07, 0.06);
    for (let k = 1; k < n; k++) {
      const top = Y - k * rise, z0 = front + (k - 1) * run, w = hw + k * 0.1;
      put('stone', 0, top / 2, z0 + run / 2, w * 2, top, run);
      put('riser', 0, top + rise / 2, z0 + 0.002, w * 2 - 0.02, rise, 0.01);
      put('carpet', 0, top + 0.012, z0 + run / 2, cw * 2, 0.025, run + 0.005);
      put('carpetDark', 0, top + rise / 2, z0 + 0.008, cw * 2, rise, 0.012);
      for (const s of [-1, 1]) put('gold', s * cw, top + 0.02, z0 + run / 2, 0.06, 0.04, run + 0.01);
    }
    const foot = front + (n - 1) * run;
    put('carpet', 0, 0.012, foot + 0.9, cw * 2, 0.025, 1.8);   // and on over the flags a little
    for (const s of [-1, 1]) put('gold', s * cw, 0.02, foot + 0.9, 0.06, 0.04, 1.8);
    const mats = { stone: stoneM, riser: riserM, gold: goldM, carpet: carpetM, carpetDark: carpetDarkM };
    for (const [kind, list] of Object.entries(parts)) {
      const im = new THREE.InstancedMesh(box, mats[kind], list.length);
      list.forEach(([x, y, z, sx, sy, sz], i) => { d.position.set(x, y, z); d.scale.set(sx, sy, sz); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
      im.castShadow = kind === 'stone'; im.receiveShadow = true;
      g.add(im);
    }
  }

  // a brazier either side, at the foot of the wall, clear of the pads and the steps
  const fires = [];
  for (const sx of [0.07, 0.93]) {
    let spot = null;
    for (let k = 0; k < 8 && !spot; k++) {
      const x = innerWidth * (sx + (sx < 0.5 ? 1 : -1) * k * 0.02), c = onGround(x, innerHeight * (hz + 0.025), 0);
      if (!c) continue;
      const offDais = !B.dais || Math.abs(c.x - foe.x) > foe.r + 1.6;
      if (offDais && [at.foe, at.you].every(p => Math.hypot(c.x - p.x, c.z - p.z) > p.r + 0.9)) spot = c;
    }
    if (spot) fires.push(brazier(spot.x, spot.z, { stoneM, goldM, lacquer: std({ color: paint(KOMBAT.lacquer), roughness: 0.4 }) }));
  }
  B.ticks.push((t) => fires.forEach((f, i) => f(t + i * 3.7)));

  B.medal = medallion3d(at, zW);
  drift(40, [-12, 12, zW, zNear - 6, 7], { colour: '#ffa040', size: 0.14, vy: 0.7, glow: true, sway: 0.7 });
  rain('#ffa860');
}

/* The courtyard's emblem, Mortal Kombat's dragon medallion with a Dragonite for its dragon (js/medallion-art.js): the ring
   painted at once, then the relief baked by tools/medallion.html drawn over it. Traced in the page, the Dragonite never
   showed on the user's iPhone, so the phone only loads two pictures. */
const MEDALLION = ['assets/arena/ken-medallion.jpg', 'assets/arena/ken-medallion-bump.jpg'];
const MEDALLION_EYE = [0.4634, 0.3355];   // tools/medallion.html prints it

function medallionArt() {
  return once('medallion', () => {
    const N = 1024, out = { map: hd(canvas(N, N)), bump: hd(canvas(N, N)), eye: null, version: 0 };
    paintMedallion(null, out);   // never blank while the pictures load
    let left = MEDALLION.length;
    MEDALLION.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        try { (i ? out.bump : out.map).getContext('2d').drawImage(img, 0, 0, N, N); } catch { return; }
        if (--left) return;
        out.eye = MEDALLION_EYE;
        out.version++;
      };
      img.src = src;
    });
    return out;
  });
}

/** The medallion hung on the gate tower, in the middle of the wall between the two Pokémon, as big as the wall has room
    for under the foe's nameplate. Returns whether it was hung. */
function medallion3d(at, zW) {
  const art = medallionArt(), wallZ = zW - 0.25;
  const onWall = (px, py) => {
    const rc = ray();
    rc.setFromCamera(new THREE.Vector2(px / innerWidth * 2 - 1, -(py / innerHeight * 2 - 1)), camera);
    const hit = new THREE.Vector3();
    return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -wallZ), hit) ? hit : null;
  };
  // on the wall between the nameplate and your Pokémon's head, clear of the dais in front of it
  const pads = [at.foe, at.you].map(p => onScreen(p.x, p.lift ?? 0, p.z).x * innerWidth);
  const plate = document.getElementById('enemy-plate')?.getBoundingClientRect();
  const top = Math.max(64, plate?.height ? plate.bottom + 8 : 0);
  let lo = 8, hi = innerWidth - 8;
  if (B.dais) {
    const f = at.foe, w = f.r + 0.45, edge = [-1, 1].map(s => onScreen(f.x + s * w, f.lift, f.z + f.r).x * innerWidth);
    if (pads[0] > innerWidth / 2) hi = Math.min(hi, edge[0] - 16); else lo = Math.max(lo, edge[1] + 16);
  }
  const fit = (foot) => {
    const half = Math.min((foot - top) / 2 - 4, (hi - lo) / 2, 150);
    return { half, cx: Math.max(lo + half, Math.min(hi - half, (pads[0] + pads[1]) / 2)), cy: top + (foot - top) / 2 };
  };
  const { half, cx, cy } = fit(onScreen(0, 0, zW).y * innerHeight);   // your Pokémon may stand in front of it
  if (half < 30) return false;
  const c = onWall(cx, cy), e = onWall(cx + half, cy);
  if (!c || !e) return false;
  const R = e.distanceTo(c);
  const map = tex(art.map), bumpMap = tex(art.bump);
  const face = std({ map, bumpMap, bumpScale: 3, metalness: 0.25, roughness: 0.4, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.45 });
  const disc = mesh(new THREE.CircleGeometry(R, 64), face, c.x, c.y, wallZ + 0.06, { shadow: false });
  const rim = mesh(new THREE.CylinderGeometry(R * 1.01, R * 1.01, 0.12, 64, 1, true), std({ color: '#a86a18', metalness: 0.5, roughness: 0.4 }), c.x, c.y, wallZ, { shadow: false });
  rim.rotation.x = Math.PI / 2;
  // the eye smoulders, blazing once the storm is up
  const eye = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(glowArt()), color: '#ff3020', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  eye.visible = false;
  add(eye);
  let seen = -1;
  B.ticks.push((t) => {
    if (seen !== art.version) {   // the Dragonite painted in since
      seen = art.version;
      map.needsUpdate = bumpMap.needsUpdate = true;
      if (art.eye) { eye.position.set(c.x + (art.eye[0] - 0.5) * 2 * R, c.y - (art.eye[1] - 0.5) * 2 * R, wallZ + 0.1); eye.visible = true; }
    }
    const p = 0.6 + Math.sin(t * 1.4) * 0.3 + stormK * 0.8;
    eye.scale.setScalar(R * (0.05 + p * 0.035));
    eye.material.opacity = Math.min(1, 0.5 + p * 0.4);
  });
  return !!disc;
}

/** A brazier on a red lacquer column, gold-banded, its gold bowl burning: flickering flames and a light that throws the
    fire's colour over the flags. Returns its flicker. */
function brazier(x, z, { stoneM, goldM, lacquer, power = 6 }) {
  const h = 1.5;
  mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.16, 16), stoneM, x, 0.08, z);
  mesh(new THREE.CylinderGeometry(0.17, 0.19, h, 16), lacquer, x, 0.16 + h / 2, z);
  for (const y of [0.24, h + 0.04]) mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.08, 16), goldM, x, y, z);
  const bowl = new THREE.LatheGeometry([[0.05, 0], [0.3, 0.06], [0.42, 0.26], [0.44, 0.3], [0.4, 0.3]].map(([a, b]) => new THREE.Vector2(a, b)), 20);
  mesh(bowl, goldM, x, h + 0.08, z);
  const coals = mesh(new THREE.CircleGeometry(0.38, 16), new THREE.MeshBasicMaterial({ color: '#ff8a30', toneMapped: false }), x, h + 0.34, z, { shadow: false });
  coals.rotation.x = -Math.PI / 2;
  const glow = tex(glowArt()), flames = [];
  for (const [col, s, y] of [['#e84818', 1.5, 0.55], ['#f8a030', 1.05, 0.6], ['#fff080', 0.6, 0.5]]) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    f.position.set(x, h + 0.08 + y, z);
    add(f);
    flames.push([f, s, y]);
  }
  const light = add(new THREE.PointLight('#ff8a3a', power, 9, 1.6));
  light.position.set(x, h + 0.9, z);
  return (t) => {
    const k = 0.85 + Math.sin(t * 9.1) * 0.08 + Math.sin(t * 5.3) * 0.07;
    flames.forEach(([f, s, y], i) => {
      const wob = Math.sin(t * (7 + i * 2.3)) * 0.06;
      f.scale.set(s * (0.9 + wob), s * 1.5 * k, 1);
      f.position.y = h + 0.08 + y + (k - 0.85) * 0.5;
    });
    light.intensity = power * k;
  };
}

/* ---------- the Sky Pillar ---------- */

/* A climb's fights stand in the tower's rooms, built as the Clearing's tower is (js/hub-pillar.js): sage stone, jade
   runes, pale arches. The light follows the sky its windows look out on (js/tower-art.js's SKY_STOPS): day, the storm,
   the sunset over the cloud sea, the aurora's night, then the summit's dawn over the planet. */
const TOWER_LIGHT = [
  [0, { hemi: ['#f4f8ff', '#7a8270', 2.1], sun: ['#fff2d8', 2.6], motes: '#fff4c8', runes: 0.45 }],
  [15, { hemi: ['#c0c8e0', '#4a5058', 2.0], sun: ['#c8d4f0', 1.2], motes: '#d8e4ff', runes: 0.7, storm: true }],
  [27, { hemi: ['#ffe8e0', '#706068', 1.9], sun: ['#ffb890', 2.4], motes: '#ffd8a8', runes: 0.7 }],
  [36, { hemi: ['#94a0dc', '#20283a', 1.5], sun: ['#a8c0ff', 1.0], motes: '#8af8c8', runes: 1.2, night: true }],
  [100, { hemi: ['#c0c8f4', '#40405a', 2.1], sun: ['#ffd8b0', 2.9], motes: '#8af8c8', runes: 1.2, night: true }],
];
const towerLight = (alt) => TOWER_LIGHT.reduce((l, [at, v]) => (alt >= at ? v : l), TOWER_LIGHT[0][1]);
const JADE = '#6af0c0';

/** A smooth painting from js/hub-3d.js's fine(), sampled smooth (tex()). */
const smooth = (c) => { c.hd = 2; if (c.glow) c.glow.hd = 2; return c; };

/** Courses of sage stone, the tower's own (js/hub-pillar.js's STONES), a tile that repeats every 2.4 units each way. */
function ashlarArt() {
  return once('ashlar', () => {
    const N = 512, c = hd(canvas(N, N)), g = c.getContext('2d'), r = seeded(17), rows = 6, rh = N / rows, bw = N / 3;
    g.fillStyle = '#7c8274'; g.fillRect(0, 0, N, N);
    for (let row = 0; row < rows; row++) {
      const y = row * rh, off = row % 2 ? bw / 2 : 0;
      for (let k = 0; k < 3; k++) {
        const n = r(), col = STONES[n > 0.85 ? 0 : n > 0.45 ? 1 : n > 0.15 ? 2 : 3];
        wrapped(N, k * bw + off + bw / 2, y + rh / 2, bw / 2, (X, Y) => {
          const x0 = X - bw / 2 + 3, y0 = Y - rh / 2 + 3, w = bw - 6, h = rh - 6;
          g.fillStyle = col; g.beginPath(); g.roundRect(x0, y0, w, h, 6); g.fill();
          g.fillStyle = 'rgba(255,255,240,0.3)'; g.fillRect(x0 + 4, y0 + 2, w - 8, 5);
          g.fillStyle = 'rgba(50,56,44,0.25)'; g.fillRect(x0 + 4, y0 + h - 7, w - 8, 5);
        });
      }
    }
    for (let i = 0; i < 1600; i++) {   // weathering
      const x = r() * N, y = r() * N, s = 1 + r() * 3;
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,240,0.18)' : 'rgba(54,60,48,0.2)';
      g.beginPath(); g.ellipse(x, y, s, s * 0.7, 0, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(54,58,48,0.55)'; g.lineWidth = 1.5;
    for (let i = 0; i < 10; i++) {   // hairline cracks
      let x = r() * N, y = r() * N, a = Math.PI / 2 + (r() - 0.5);
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { a += (r() - 0.5) * 1.2; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); }
      g.stroke();
    }
    return c;
  });
}

/** A wall torch: an iron bracket, a cup and its fire (one light at most, `light`). Returns its flicker. */
function sconce(x, y, z, iron, { light = false, colour = '#ff8a3a' } = {}) {
  mesh(new THREE.BoxGeometry(0.14, 0.42, 0.06), iron, x, y - 0.12, z + 0.03);
  mesh(new THREE.BoxGeometry(0.05, 0.05, 0.24), iron, x, y - 0.16, z + 0.14);
  mesh(new THREE.CylinderGeometry(0.11, 0.05, 0.14, 10), iron, x, y, z + 0.24);
  const glow = tex(glowArt()), flames = [];
  for (const [col, s, dy] of [['#e84818', 0.62, 0.2], ['#f8a030', 0.44, 0.22], ['#fff080', 0.24, 0.18]]) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    f.position.set(x, y + dy, z + 0.24);
    add(f);
    flames.push([f, s, dy]);
  }
  const lamp = light ? add(new THREE.PointLight(colour, 3, 6, 1.6)) : null;
  lamp?.position.set(x, y + 0.4, z + 0.6);
  return (t) => {
    const k = 0.85 + Math.sin(t * 9.1) * 0.08 + Math.sin(t * 5.3) * 0.07;
    flames.forEach(([f, s, dy], i) => {
      f.scale.set(s * (0.9 + Math.sin(t * (7 + i * 2.3)) * 0.06), s * 1.5 * k, 1);
      f.position.y = y + dy + (k - 0.85) * 0.2;
    });
    if (lamp) lamp.intensity = 3 * k;
  };
}

/** A pad in the tower: a pale flagstone top on a band of jade runes. */
function towerPad(alt) {
  const runes = smooth(runeArt(fine)), map = tex(runes), glow = tex(runes.glow);
  for (const t of [map, glow]) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(5, 1); }
  return {
    top: std({ map: tex(stoneArt()), color: '#d6dac8', roughness: 1 }),
    side: std({ map, emissive: JADE, emissiveMap: glow, emissiveIntensity: towerLight(alt).runes, roughness: 0.7 }),
    blade: null, grass: false,
  };
}

/** A Sky Pillar room: flagstones to a wall of sage stone, its arched windows open on the pixel sky at that height, a
    band of jade runes along it and torches between; a guardian's hall adds banners in its colours, braziers and a runner. The summit has no walls: a broken parapet and columns open on the planet's dawn, moss in the flags, stones
    floating. */
function dressTower({ o, r, at, hz, zNear }) {
  scene.fog = null;
  const { alt, kind, banner } = o.tower, summit = alt >= 100, guardian = kind === 'boss' || kind === 'elite';
  const L = towerLight(alt);
  B.sky = true;
  sun.position.set(-7, 15, 12);   // in over your shoulder, so the wall facing you is lit
  const foot = onGround(innerWidth / 2, innerHeight * hz, 0);
  const zW = (foot ? foot.z : -8) - 0.6, len = zNear - zW;
  const onWall = (px, py, z = zW) => {
    const rc = ray(), hit = new THREE.Vector3();
    rc.setFromCamera(new THREE.Vector2(px / innerWidth * 2 - 1, -(py / innerHeight * 2 - 1)), camera);
    return rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), hit) ? hit : null;
  };
  const wallX = (frac) => onWall(innerWidth * frac, innerHeight * hz)?.x ?? (frac - 0.5) * 10;
  const topY = onWall(innerWidth / 2, 0)?.y ?? 6;
  const half = Math.max(Math.abs(onWall(0, 0)?.x ?? 8), Math.abs(onWall(0, innerHeight * hz)?.x ?? 8)) * 1.25 + 2;

  const pale = std({ color: '#dadecf', flatShading: true }), dark = std({ color: '#8a907c', roughness: 1, flatShading: true });
  const gold = std({ color: '#e8c058', metalness: 0.6, roughness: 0.35, emissive: '#3a2a08', emissiveIntensity: 0.5 });
  const iron = std({ color: '#3a3e3a', metalness: 0.5, roughness: 0.5 });
  const runeSrc = smooth(runeArt(fine)), runeMap = tex(runeSrc), runeGlow = tex(runeSrc.glow);
  const runeM = std({ map: runeMap, emissive: JADE, emissiveMap: runeGlow, emissiveIntensity: L.runes, roughness: 0.6 });

  // the floor: big flags in the tower's pale stone, from your feet to the wall
  const flags = tex(flagsArt());
  flags.wrapS = flags.wrapT = THREE.RepeatWrapping;
  flags.repeat.set(80 / 3.2, len / 2.2);
  const ground = mesh(new THREE.PlaneGeometry(80, len), std({ map: flags, color: summit ? '#c4cab2' : '#cdd2bf', roughness: 0.95 }), 0, 0, (zNear + zW) / 2, { shadow: false });
  ground.rotation.x = -Math.PI / 2;
  ground.renderOrder = -1;

  const ticks = [];
  if (summit) {
    // the parapet, broken, and old columns standing at either side
    const blocks = [];
    for (let x = -half; x < half; x += 0.9) {
      if (r() < 0.22) continue;
      blocks.push([x + 0.45, 0.28 + r() * 0.5, r() < 0.15 ? 0.25 : 0]);
    }
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.86, 1, 0.5), pale, blocks.length), d = new THREE.Object3D();
    blocks.forEach(([x, h, tilt], i) => { d.position.set(x, h / 2, zW - 0.1); d.scale.set(1, h, 1); d.rotation.set(0, 0, tilt * (r() - 0.5)); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
    im.castShadow = im.receiveShadow = true;
    add(im);
    for (const f of innerWidth > 560 ? [0.06, 0.24, 0.76, 0.94] : [0.08, 0.92]) {
      const x = wallX(f), h = topY * (0.45 + r() * 0.35);
      mesh(new THREE.CylinderGeometry(0.26, 0.3, h, 12), pale, x, h / 2, zW - 0.2);
      mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.18, 12), dark, x, 0.09, zW - 0.2);
      if (r() < 0.5) mesh(new THREE.BoxGeometry(0.8, 0.16, 0.8), pale, x, h + 0.08, zW - 0.2);
      else mesh(new THREE.DodecahedronGeometry(0.22, 0), pale, x + 0.5, 0.15, zW + 0.4);   // its top fallen at its foot
    }
    // moss in the old flags
    const moss = [std({ color: '#5a8a3e', roughness: 1, flatShading: true }), std({ color: '#76a84c', roughness: 1, flatShading: true })];
    for (let i = 0; i < 60; i++) {
      const x = (r() - 0.5) * half * 2, z = zW + 0.4 + r() * (len - 6);
      if (![at.foe, at.you].every(p => Math.hypot(x - p.x, z - p.z) > p.r + 0.4)) continue;
      const s = 0.12 + r() * 0.22;
      mesh(new THREE.IcosahedronGeometry(s, 1), moss[i % 2], x, s * 0.2, z).scale.y = 0.35;
    }
    // stones floating up past the parapet, some with a jade shard in them
    const rockM = std({ color: '#a8ae9a', flatShading: true }), shardM = std({ color: '#6ae8b8', emissive: JADE, emissiveIntensity: 1.2, flatShading: true, roughness: 0.3 });
    for (let i = 0; i < 7; i++) {
      const s = 0.12 + r() * 0.2, side = i % 2 ? 1 : -1, x = side * (Math.abs(wallX(0.5 + side * 0.32)) + r() * 3), y = 0.8 + r() * topY * 0.7, z = zW - 0.8 - r() * 3;
      const g = new THREE.Group(), rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockM);
      rock.scale.y = 0.7 + r() * 0.4; rock.castShadow = true;
      g.add(rock);
      if (i % 2 === 0) { const sh = new THREE.Mesh(new THREE.OctahedronGeometry(s * 0.55, 0), shardM); sh.position.y = s * 0.75; sh.scale.y = 1.8; g.add(sh); }
      add(g);
      const bob = r() * 6, spin = r() - 0.5;
      ticks.push((t) => { g.position.set(x, y + Math.sin(t * 0.7 + bob) * 0.25, z); g.rotation.set(t * spin * 0.4, t * spin, 0); });
    }
    rain('#c8d8f0');
  } else {
    // the wall: one slab with arched windows cut through it (their reveals show its thickness), a plinth at its foot
    const winW = Math.min(1.7, Math.max(0.8, Math.abs(wallX(0.62) - wallX(0.5)))), sill = 0.75;
    const spring = Math.max(sill + 1, Math.min(sill + 4.2, topY * 0.66 - winW / 2)), archTop = spring + winW / 2;
    const wins = (innerWidth > 560 ? [0.12, 0.32, 0.68, 0.88] : [0.16, 0.84]).map(wallX);
    const shape = new THREE.Shape();
    const H = topY + 1.5;
    shape.moveTo(-half, 0); shape.lineTo(half, 0); shape.lineTo(half, H); shape.lineTo(-half, H); shape.closePath();
    for (const cx of wins) {
      const hole = new THREE.Path(), w = winW / 2;
      hole.moveTo(cx - w, sill); hole.lineTo(cx + w, sill); hole.lineTo(cx + w, spring);
      hole.absarc(cx, spring, w, 0, Math.PI, false);
      hole.lineTo(cx - w, sill);
      shape.holes.push(hole);
    }
    const D = 0.5, stone = tex(ashlarArt());
    stone.wrapS = stone.wrapT = THREE.RepeatWrapping;
    stone.repeat.set(1 / 2.4, 1 / 2.4);
    const wallM = std({ map: stone, color: '#f2f4ea', flatShading: true });
    const wall = mesh(new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false }), wallM, 0, 0, zW - D, { shadow: false });
    wall.renderOrder = -1;
    mesh(new THREE.BoxGeometry(half * 2, 0.34, 0.16), dark, 0, 0.17, zW + 0.08, { shadow: false });
    // each window's frame: pale jambs, an arch with a gold keystone, a sill
    for (const cx of wins) {
      const w = winW / 2;
      for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.16, spring - sill, 0.12), pale, cx + s * (w + 0.08), (sill + spring) / 2, zW + 0.06, { shadow: false });
      mesh(new THREE.TorusGeometry(w + 0.08, 0.08, 6, 20, Math.PI), pale, cx, spring, zW + 0.06, { shadow: false });
      mesh(new THREE.BoxGeometry(0.16, 0.22, 0.16), gold, cx, archTop + 0.1, zW + 0.08, { shadow: false });
      mesh(new THREE.BoxGeometry(winW + 0.5, 0.1, 0.3), pale, cx, sill - 0.05, zW + 0.1, { shadow: false });
    }
    // a band of jade runes along the wall over the windows, under a pale cornice
    const bandY = Math.min(H - 0.6, archTop + 0.45);
    runeMap.wrapS = runeGlow.wrapS = THREE.RepeatWrapping;
    runeMap.repeat.x = runeGlow.repeat.x = half * 2 / 1.5;
    const band = mesh(new THREE.BoxGeometry(half * 2, 0.26, 0.06), runeM, 0, bandY, zW + 0.03, { shadow: false });
    for (const dy of [-0.18, 0.18]) mesh(new THREE.BoxGeometry(half * 2, 0.08, 0.14), pale, 0, bandY + dy, zW + 0.07, { shadow: false });
    ticks.push((t) => { band.material.emissiveIntensity = L.runes * (0.85 + Math.sin(t * 1.3) * 0.15); });

    // torches between the windows (on a plain floor; a guardian's hall burns braziers instead)
    if (!guardian) {
      const spots = (innerWidth > 560 ? [0.22, 0.5, 0.78] : [0.5]).map(wallX);
      spots.forEach((x, i) => ticks.push(sconce(x, sill + (spring - sill) * 0.6, zW, iron, { light: i !== 1 || spots.length === 1 })));
    } else {
      // banners in the guardian's colours (js/tower-art.js's BANNER) hung from the cornice, braziers at the wall's foot
      const [main, deep] = BANNER[banner] || BANNER[0];
      const art = smooth(bannerArt(fine, [main, deep])), bm = std({ map: tex(art), side: THREE.DoubleSide, alphaTest: 0.5, transparent: true, roughness: 0.95 });
      const bh = Math.min(bandY - 0.3, 2.6), bw = bh * 8 / 34;
      for (const f of innerWidth > 560 ? [0.41, 0.59] : [0.3, 0.7]) {
        const x = wallX(f), pivot = new THREE.Group(), cloth = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh, 1, 6), bm);
        pivot.position.set(x, bandY - 0.22, zW + 0.12);
        cloth.position.y = -bh / 2; cloth.castShadow = true;
        pivot.add(cloth);
        add(pivot);
        mesh(new THREE.CylinderGeometry(0.025, 0.025, bw + 0.2, 6).rotateZ(Math.PI / 2), gold, x, bandY - 0.22, zW + 0.14, { shadow: false });
        ticks.push((t) => { cloth.rotation.x = Math.sin(t * 1.1 + x) * 0.05 - 0.02; });
      }
      if (kind === 'boss') {
        const stoneM = std({ map: tex(stoneArt()), color: '#c8cdb8', roughness: 0.9 }), lacquer = std({ color: '#5a6a58', roughness: 0.6 });
        for (const f of [0.06, 0.94]) {
          const c = onGround(innerWidth * f, innerHeight * (hz + 0.03), 0);
          if (c && [at.foe, at.you].every(p => Math.hypot(c.x - p.x, c.z - p.z) > p.r + 0.9)) ticks.push(brazier(c.x, Math.max(c.z, zW + 0.7), { stoneM, goldM: gold, lacquer, power: 1.6 }));
        }
      }
    }
  }

  // a guardian's runner up the middle, in its banners' deep colour edged in gold
  if (kind === 'boss' && !summit) {
    const w = 1.2, zl = zNear - zW;
    mesh(new THREE.BoxGeometry(w, 0.02, zl), std({ color: (BANNER[banner] || BANNER[0])[1], roughness: 1 }), 0, 0.012, (zNear + zW) / 2, { shadow: false });
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.08, 0.025, zl), gold, s * (w / 2 + 0.04), 0.014, (zNear + zW) / 2, { shadow: false });
  }

  // dust in the light from the windows; jade sparks once the night comes
  motes(L.night ? 40 : 28, L.motes, [-half * 0.7, half * 0.7, zW + 0.5, zNear - 6, 4], { size: L.night ? 0.16 : 0.1, rise: 0.04 });
  // lightning through the windows in the storm's floors
  if (L.storm && !summit) ticks.push((t, dt) => { if (Math.random() < dt * 0.12) flashK = 0.8; });
  B.ticks.push((t, dt) => ticks.forEach(f => f(t, dt)));
}

const GROUNDS = { clearing: dressClearing, wastes: dressWastes, kombat: dressKombat, tower: dressTower };
const LIFTS = { kombat: kombatLift };

/* ---------- the frame ---------- */

const onBattle = () => document.body.dataset.screen === 'battle-screen';

function frame(now) {
  raf = 0;
  if (!A) return;
  // the fight's over: the rewards, the map or a gym come next, and its GPU memory goes back to them (an Alpha's or a
  // Gym Leader's relic window over a still-awake arena reloaded a friend's iPhone tab, 2026-10-17)
  if (!onBattle()) { unmountArena(); sleepGL(renderer); napping = true; return; }
  if (tooSoon(now, last)) { if (!document.hidden) raf = requestAnimationFrame(frame); return; }
  const dt = Math.min(0.1, (now - (last || now)) / 1000);
  last = now;
  const t = now / 1000;
  stormK += ((stormOn ? 1 : 0) - stormK) * Math.min(1, dt * 1.5);
  const look = A.look;
  hemi.intensity = look.hemi[2] * (1 - stormK * 0.45) + flashK * 2 + glowK * 1.4;
  if (glowK > 0 || glowed) {   // an attack's light: the sky light leans to its colour for a moment (no new light, no new shaders)
    hemi.color.copy(look.hemiCol ||= new THREE.Color(look.hemi[0])).lerp(glowCol, Math.min(1, glowK) * 0.6);
    glowed = glowK > 0;
    glowK = Math.max(0, glowK - dt * 3);
  }
  sun.intensity = look.sun[1] * (1 - stormK * 0.75);
  if (stormOn && Math.random() < dt * 0.25) flashK = 1;   // lightning, now and then
  flashK = Math.max(0, flashK - dt * 3);
  for (const f of A.ticks) f(t, dt);
  backdrop.needsUpdate = true;
  if (++A.beat % 3 === 0) follow();
  const focus = 1 - (A.at.foe.sy + A.at.you.sy) / 2;
  post.draw(scene, camera, focus);
  fpsLog.push(dt * 1000); if (fpsLog.length > 60) fpsLog.shift();
  if (wanted) keepUp(now);   // not under a boss's pixel prelude, which has its own cost
  if (!document.hidden) raf = requestAnimationFrame(frame);
}

/* Wild fights are the most common, so a phone that can't hold ~40 fps steps down like the Secret Base (shadows, then
   resolution), remembered per device. */
let fpsLog = [], slowSince = 0, lowered = 0;
function keepUp(now) {
  if (fpsLog.length < 60 || document.hidden) { slowSince = 0; return; }
  const avg = fpsLog.reduce((a, b) => a + b, 0) / fpsLog.length;
  if (avg < 25) { slowSince = 0; return; }
  if (!slowSince) { slowSince = now; return; }
  if (now - slowSince < 3000) return;
  slowSince = 0;
  if (!stepDown()) return;
  try { localStorage.setItem('pokedb.arena3d.low', String(++lowered)); } catch {}
  fpsLog.length = 0;
}
function stepDown() {
  if (sun.shadow.mapSize.x > 512) { sun.shadow.mapSize.set(512, 512); sun.shadow.map?.dispose(); sun.shadow.map = null; return true; }
  if (!post.lower(innerWidth, innerHeight)) return false;
  resize();
  return true;
}

/** The pads follow the page's: a boss's sprite that loads late, a move bubble that wraps, a Pokémon that grows on evolving
    all shift where the page draws its pads, and a 3D pad left where it was built stood off to the side (the user saw it). */
function follow() {
  const spots = [['enemy-zone', '::after'], ['player-zone', '::before']];
  spots.forEach(([zone, pseudo], i) => {
    const el = document.getElementById(zone);
    if (!el) return;
    const p = cssPad(el, pseudo), key = `${Math.round(p.cx)},${Math.round(p.cy)},${Math.round(p.w)}`;
    if (A.keys[i] === key) return;
    A.keys[i] = key;
    const was = i ? A.at.you : A.at.foe, at = padAt(p, was.lift);
    if (!at) return;
    const g = A.pads[i];
    g.position.set(at.x, at.lift, at.z);
    if (!i) A.dais?.position.set(at.x, 0, at.z);
    const k = at.r / was.r0;
    g.scale.set(k, 1, k);
    Object.assign(was, at);
  });
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(1);
  const k = post.scale(w, h);
  renderer.setSize(Math.round(w * k), Math.round(h * k), false);
  post.size(w, h);
  aimCamera(w, h);
}

/* ---------- in and out ---------- */

let warming = null, napping = false;
/** Three.js and the renderer, ready before a fight needs them. */
export function warmArena() {
  warming ??= (async () => {
    THREE = await loadThree();
    view = document.createElement('canvas');
    view.className = 'arena3d-view';
    document.body.append(view);
    renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    backdrop = new THREE.CanvasTexture(document.getElementById('scene-bg'));
    backdrop.colorSpace = THREE.SRGBColorSpace;
    backdrop.magFilter = backdrop.minFilter = THREE.NearestFilter;
    backdrop.generateMipmaps = false;
    camera = new THREE.PerspectiveCamera(24, 1, 0.5, 160);
    hemi = new THREE.HemisphereLight('#fff', '#444', 1);
    sun = new THREE.DirectionalLight('#fff', 2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 });
    sun.shadow.bias = -0.0012;
    sun.shadow.normalBias = 0.03;
    scene.add(hemi, sun, sun.target);
    post = createPost(renderer, { short: 720, crisp: false });
    Object.assign(post.final.uniforms.uBlur, { value: 3.2 });
    Object.assign(post.final.uniforms.uBand, { value: 0.26 });
    Object.assign(post.final.uniforms.uBloom, { value: 0.55 });
    let steps = 0;
    try { steps = +localStorage.getItem('pokedb.arena3d.low') || 0; } catch {}
    for (; lowered < steps; lowered++) if (!stepDown()) break;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (A) rebuild(); }, 200);
    });
    await precompile();
    restGL(renderer, 1);
  })();
  warming.catch(() => { warming = null; });
  return warming;
}

/** Every material's shaders built ahead, under the arena's lights and fog, so a boss's pixel prelude doesn't stutter
    while its 3D arena is laid behind it. Compiled for the post's render target (warmShaders()): compiled for the screen,
    every one was a variant the first frame never used, and that frame compiled them all again (2026-10-18). */
function precompile() {
  const M = materials(), g = new THREE.Group(), geo = new THREE.PlaneGeometry(1, 1);
  scene.fog = new THREE.Fog('#fff', 30, 85);
  for (const m of Object.values(M).flat()) g.add(new THREE.Mesh(geo, m));
  g.add(new THREE.InstancedMesh(geo, M.blade, 1), new THREE.Points(geo, new THREE.PointsMaterial({ transparent: true, blending: THREE.AdditiveBlending })));
  g.traverse(o => { o.castShadow = o.receiveShadow = true; });
  return warmShaders(renderer, g, camera, scene);
}

let current = null;   // what mountArena() was last asked for, to build again on a resize
/** Lays the 3D arena under the battle screen: `o` is { biome, kind, stage }, `reveal` false to build it hidden (a boss,
    whose pixel prelude plays first; revealArena() shows it). Resolves false where it can't (no WebGL, offline): the
    pixel scene stays. */
export async function mountArena(o, { reveal = true } = {}) {
  const waiting = document.body.classList.contains('arena3d-wait');
  unmountArena();
  document.body.classList.toggle('arena3d-wait', waiting);   // the pixel scene stays hidden till this one's up
  const id = ++building;
  wanted = reveal;
  stormOn = false; stormK = 0;
  const stage = new URLSearchParams(location.search).get('stage');
  current = { ...o, stage: stage != null ? Math.max(0, Math.min(3, Number(stage) || 0)) : o.stage, time: timeOfDay() };
  try { await warmArena(); } catch { return false; }
  // a lost context lost its shaders too: asleep after its last fight, or put to sleep by a place warmed after it
  const lost = napping || renderer.getContext().isContextLost();
  await wakeGL(renderer);
  if (lost) { napping = false; await precompile(); }
  // the page's sprites must be laid out (sizeSprite()) before their pads are cast into the ground
  await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
  if (id !== building || !onBattle()) return false;
  if (!rebuild()) return false;
  await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));   // its first frame drawn (battle.js's arenaReady())
  return true;
}

function rebuild() {
  if (A) { dispose(A.group); scene.remove(A.group); A = null; }
  resize();
  const b = build(current);
  if (!b) return false;
  A = b;
  A.beat = 0; A.keys = [];
  for (const p of [A.at.foe, A.at.you]) p.r0 = p.r;
  scene.add(A.group);
  if (wanted) show(false);
  last = 0; fpsLog.length = 0; slowSince = 0;
  raf ||= requestAnimationFrame(frame);
  return true;
}

function show(fade) {
  document.body.classList.add('arena3d');
  document.body.classList.remove('arena3d-wait');
  sceneBare({ dais: !!A?.dais, medal: !!A?.medal });
  view.classList.toggle('fade', fade && !matchMedia('(prefers-reduced-motion: reduce)').matches);
  void view.offsetWidth;
  view.classList.add('on');
  // the pixel scene stays under the fade, then is put away
  const solid = () => {
    if (!A) return;
    document.body.classList.add('arena3d-solid');
    if (A.sky) sceneBare({ dais: !!A.dais, medal: !!A.medal, sky: true });   // its windows look out on the bare sky
  };
  if (view.classList.contains('fade')) view.addEventListener('animationend', solid, { once: true });
  else solid();
}

/** The boss's prelude is over: the arena comes up out of its last white flash. */
export function revealArena() {
  wanted = true;
  // the prelude's last flash may still be on the pixel floor: read its colours again once it has settled
  const was = A;
  for (const ms of [0, 500, 1200]) setTimeout(() => { if (A === was) A?.retint?.(); }, ms);
  if (A) show(true);
}

/** Back to the pixel scene (the fight is over, or the next one isn't 3D). */
export function unmountArena() {
  building++;
  cancelAnimationFrame(raf); raf = 0;
  document.body.classList.remove('arena3d', 'arena3d-solid', 'arena3d-wait');
  sceneBare({ dais: false, medal: false });
  view?.classList.remove('on', 'fade');
  if (A) { dispose(A.group); scene.remove(A.group); A = null; }
}

let glowK = 0, glowed = false, glowCol = null;
/** An attack lands: the arena takes on its colour for a moment, `k` (about 0.4-1) how strongly (js/movefx.js). */
export function glowArena(colour, k = 0.6) {
  if (!THREE || !A) return;
  (glowCol ||= new THREE.Color()).set(colour);
  glowK = Math.max(glowK, k);
}

/** A boss close to fainting brings the weather in (rain, lightning), like the pixel scene's storm. */
export function stormArena(on) { stormOn = on; }

document.addEventListener('visibilitychange', () => { if (!document.hidden && A && !raf) raf = requestAnimationFrame(frame); });
