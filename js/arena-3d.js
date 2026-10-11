/* arena-3d.js  -  an Alpha's or a boss's fight in a 3D place (the user's ask, 2026-10-11; a test on its own branch, the
   Whispering Clearing only): the battle screen is untouched, every card, sprite, nameplate and animation is the page's
   own, and this only lays a 3D clearing under it where the pixel scene was. The camera is fixed (you never walk here),
   high and behind your Pokémon like the games' battle view, and each grassy pad is put exactly where the page draws its
   Pokémon: the pad's spot on screen (the CSS pad, now invisible) is cast into the ground (`layout()`), so it fits any
   screen. A boss keeps its pixel prelude; the 3D arena fades in out of its last white flash (`revealArena()`). */

import { loadThree, tex, createPost, dispose } from './hd2d.js';
import { timeOfDay } from './daytime.js';

export const ARENA_3D = new Set(['clearing']);
const PAD_H = 0.2;

let THREE, renderer, scene, camera, post, view, hemi, sun;
let A = null, raf = 0, last = 0, wanted = false, building = 0, stormOn = false, stormK = 0, flashK = 0, resizeTimer = 0;

function seeded(n) { return () => { n = (n + 0x6d2b79f5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const hd = (c) => { c.hd = 2; return c; };   // smooth sampling, mipmaps (hd2d.js's tex())

/** Whether this fight is laid in 3D: an Alpha's or a boss's in a biome that has its arena (`?arena2d` keeps the pixels). */
export function wantsArena({ land, kind, def, run }) {
  if (new URLSearchParams(location.search).has('arena2d')) return false;
  return ARENA_3D.has(land) && (kind === 'elite' || kind === 'boss') && !def.arena && !run.tower && !run.safari;
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

function shaftArt() {
  return once('shaft', () => {
    const c = hd(canvas(64, 256)), g = c.getContext('2d');
    for (let x = 0; x < 64; x++) {
      const k = Math.sin(x / 63 * Math.PI) ** 2;
      const lin = g.createLinearGradient(0, 0, 0, 256);
      lin.addColorStop(0, `rgba(255,255,255,${0.9 * k})`); lin.addColorStop(0.7, `rgba(255,255,255,${0.5 * k})`); lin.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = lin; g.fillRect(x, 0, 1, 256);
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
    root: std({ color: '#5e4024', roughness: 1 }),
    log: std({ map: bark }),
    hollow: new THREE.MeshBasicMaterial({ color: '#160c06' }),
    rune: new THREE.MeshBasicMaterial({ color: '#a8f8a0' }),
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
function pad(p) {
  const M = materials(), g = new THREE.Group();
  g.position.set(p.x, 0, p.z);
  const top = new THREE.Mesh(new THREE.CircleGeometry(p.r, 48), M.padTop);
  top.rotation.x = -Math.PI / 2; top.position.y = PAD_H; top.receiveShadow = true;
  const side = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r * 1.06, PAD_H + 0.04, 48, 1, true), M.dirt);
  side.position.y = PAD_H / 2 - 0.02; side.receiveShadow = true; side.castShadow = true;
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(p.r * 2.9, p.r * 2.9), M.shadow);
  shade.rotation.x = -Math.PI / 2; shade.position.y = 0.012;
  g.add(top, side, shade);
  // a fringe of grass round its rim
  const n = Math.round(p.r * 22), blades = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.26).translate(0, 0.13, 0), M.blade, n);
  const d = new THREE.Object3D();
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

/** The Ancient Tree, the Clearing's heart, behind a boss: a colossal trunk on arching roots, a dark hollow at its foot
    and old runes glowing in its bark. */
function ancientTree(x, z, r) {
  const M = materials(), g = new THREE.Group(), h = 14;
  g.position.set(x, 0, z);
  g.scale.setScalar(1.5);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.8, h, 24, 6).translate(0, h / 2, 0), M.bark);
  const pos = trunk.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {   // knotted, not a perfect column
    const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i), a = Math.atan2(pz, px), k = 1 + Math.sin(a * 5 + py * 0.6) * 0.08 + Math.sin(a * 11) * 0.04;
    pos.setXYZ(i, px * k, py, pz * k);
  }
  trunk.geometry.computeVertexNormals();
  trunk.castShadow = trunk.receiveShadow = true;
  g.add(trunk);
  const hollow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24).scale(0.75, 1.3, 1), M.hollow);
  hollow.position.set(0, 1.1, 2.62); hollow.rotation.x = -0.12;
  g.add(hollow);
  for (let i = 0; i < 9; i++) {   // roots arching out over the ground
    const a = i / 9 * Math.PI * 2 + r() * 0.3, reach = 3.2 + r() * 2.4;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 0.35) continue;   // keep the hollow clear
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 1.8, 1.6, Math.sin(a) * 1.8),
      new THREE.Vector3(Math.cos(a) * (reach * 0.55), 0.9 + r() * 0.4, Math.sin(a) * (reach * 0.55)),
      new THREE.Vector3(Math.cos(a) * reach, -0.15, Math.sin(a) * reach),
    ]);
    const root = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.42, 9), M.bark);
    root.castShadow = root.receiveShadow = true; g.add(root);
  }
  B.runes = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 2 + (i - 2.5) * 0.32, y = 2.4 + (i % 3) * 0.9;
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.4), M.rune.clone());
    rune.position.set(Math.cos(a) * 2.62, y, Math.sin(a) * 2.62);
    rune.lookAt(Math.cos(a) * 6, y, Math.sin(a) * 6);
    rune.material.transparent = true;
    g.add(rune); B.runes.push(rune);
  }
  for (let i = 0; i < 9; i++) {
    const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), M.leaves[1]);
    const a = i / 9 * Math.PI * 2;
    ball.position.set(Math.cos(a) * 4.5, h + 1 + r() * 2, Math.sin(a) * 4.5);
    ball.scale.setScalar(3.2 + r() * 1.4);
    ball.castShadow = true; g.add(ball);
  }
  add(g);
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

/** Roots and old branches lying across the floor, like the pixel Deep Woods'. */
function rootLine(from, to, r) {
  const M = materials(), mid = from.clone().lerp(to, 0.5);
  mid.x += (r() - 0.5) * 2; mid.y = 0.12;
  const curve = new THREE.CatmullRomCurve3([from, mid, to]);
  const o = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.07 + r() * 0.05, 6), M.root);
  o.castShadow = o.receiveShadow = true;
  add(o);
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

/** Sunbeams slanting down through the canopy. */
function shafts(look, spots) {
  const m0 = new THREE.MeshBasicMaterial({ map: tex(shaftArt()), color: look.shaft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  spots.forEach(([x, z, w], i) => {
    const m = m0.clone();
    const o = new THREE.Mesh(new THREE.PlaneGeometry(w, 16).translate(0, -8, 0), m);
    o.position.set(x, 15, z);
    o.rotation.set(0, 0.3, -0.32);
    add(o);
    B.ticks.push((t) => { m.opacity = look.shaftA * (0.75 + Math.sin(t * 0.5 + i * 1.7) * 0.25) * (1 - stormK); });
  });
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

/** Rain for a boss close to fainting (setStorm in js/scene.js does the pixel scene's). */
function rain() {
  const n = 700, geo = new THREE.BufferGeometry(), p = new Float32Array(n * 6), r = seeded(77);
  const drops = [];
  for (let i = 0; i < n; i++) drops.push([(r() - 0.5) * 30, r() * 14, -16 + r() * 22, 8 + r() * 4]);
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.LineBasicMaterial({ color: '#c8d8f0', transparent: true, opacity: 0, depthWrite: false });
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

function layout() {
  const spot = (zone, pseudo) => {
    const p = cssPad(document.getElementById(zone), pseudo), c = onGround(p.cx, p.cy), l = onGround(p.cx - p.w / 2, p.cy), rr = onGround(p.cx + p.w / 2, p.cy);
    if (!c || !l || !rr) return null;
    return { x: c.x, z: c.z, r: Math.abs(rr.x - l.x) / 2 * 0.86, sy: p.cy / innerHeight };
  };
  return { foe: spot('enemy-zone', '::after'), you: spot('player-zone', '::before') };
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

function build(o) {
  const look = TIMES[o.time] || TIMES.day, r = seeded(1234 + o.stage * 97 + (o.kind === 'boss' ? 5 : 0));
  B = { group: new THREE.Group(), ticks: [], look, runes: null };
  const M = materials();
  for (const m of [M.bark, ...M.leaves, M.blade, ...M.flowers, M.padTop, M.dirt, M.rock, M.moss, M.root, M.log]) m.color.set(look.tint);
  scene.background = new THREE.Color(look.sky);
  scene.fog = new THREE.Fog(look.fog, 30, 85);
  hemi.color.set(look.hemi[0]); hemi.groundColor.set(look.hemi[1]); hemi.intensity = look.hemi[2];
  sun.color.set(look.sun[0]); sun.intensity = look.sun[1];
  sun.position.set(-10, 18, -2);
  sun.target.position.set(0, 0, -4);

  const groundTex = tex(groundArt(o.stage + 1));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), std({ map: groundTex, color: look.tint }));
  ground.rotation.x = -Math.PI / 2; ground.position.z = -14; ground.receiveShadow = true;
  add(ground);

  const at = layout();
  if (!at.foe || !at.you) return null;
  B.pads = [pad(at.foe), pad(at.you)];
  B.at = at;
  const clear = (x, z, m = 0.9) => [at.foe, at.you].every(p => Math.hypot(x - p.x, z - p.z) > p.r + m);
  // the fighting ground, on screen: nothing tall may stand in front of the far pad there, nor reach over either Pokémon
  const boxes = [at.foe, at.you].map(p => { const c = onScreen(p.x, 0, p.z); return [c.x - 0.28, c.y - 0.3, c.x + 0.28, c.y + 0.08, p.z - p.r - 2.6]; });
  const covers = (x, z, s = 1) => {
    let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    for (const [dx, y, dz] of [[0, 0, 0], [-2.6 * s, 5.5 * s, 0], [2.6 * s, 5.5 * s, 0], [0, 7.5 * s, 2.6 * s], [0, 3 * s, 2.6 * s]]) {
      const p = onScreen(x + dx, y, z + dz);
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
    }
    return boxes.some(([a, b, c, d, behind]) => z > behind && x0 < c && x1 > a && y0 < d && y1 > b);
  };
  const open = (x, z, s) => { const p = onScreen(x, 0, z); return (p.y > at.foe.sy - 0.06 && p.x > 0.04 && p.x < 0.96) || covers(x, z, s); };
  const between = (x, z) => { const s = onScreen(x, 0, z); return s.y > at.foe.sy - 0.02 && s.y < at.you.sy + 0.06 && s.x > 0.1 && s.x < 0.9; };

  const deep = o.stage >= 2, trees = [0.6, 1, 1.4, 1.2][o.stage] ?? 1;
  // the Ancient Tree stands behind a boss, its foot just above the far pad on screen, a little to the right
  const heart = o.stage === 3 ? onGround(innerWidth * 0.66, innerHeight * (at.foe.sy - 0.13), 0) : null;
  if (heart) ancientTree(heart.x, heart.z, r);
  const nearHeart = (x, z) => heart && Math.hypot(x - heart.x, z - heart.z) < 11;
  for (let x = -26; x < 26; x += 2.6 + r() * 1.6) {   // the forest's wall at the back
    const z = -30 - r() * 6;
    if (nearHeart(x, z)) continue;
    tree(x, z, 1.1 + r() * 0.5, r);
  }
  let placed = 0;
  for (let i = 0; i < 400 && placed < Math.round(30 * trees); i++) {
    const x = (r() - 0.5) * 44, z = -34 + r() * 36, size = 0.9 + r() * 0.6;
    if (open(x, z, size) || !clear(x, z, 2)) continue;
    if (nearHeart(x, z)) continue;
    tree(x, z, size, r);
    placed++;
  }
  for (let i = 0; i < 22; i++) {   // bushes and rocks round the edges, a few in the open
    const x = (r() - 0.5) * 26, z = -18 + r() * 18;
    if (!clear(x, z, 0.8) || between(x, z)) continue;
    if (r() < 0.55) bush(x, z, 0.8 + r() * 0.6, r); else rock(x, z, 0.3 + r() * 0.5, r);
  }
  for (let i = 0; i < 2 && deep; i++) { const x = (i ? 1 : -1) * (7 + r() * 3), z = -10 - r() * 6; if (!between(x, z) && clear(x, z, 2)) log(x, z, r); }
  if (deep) for (let i = 0; i < 6; i++) {
    const a = new THREE.Vector3((r() - 0.5) * 30, 0.05, -20 + r() * 14), b = a.clone().add(new THREE.Vector3((r() - 0.5) * 8, 0, (r() - 0.5) * 5));
    if (clear(a.x, a.z, 1) && clear(b.x, b.z, 1) && clear((a.x + b.x) / 2, (a.z + b.z) / 2, 1)) rootLine(a, b, r);
  }
  for (let i = 0; i < 18; i++) { const x = (r() - 0.5) * 24, z = -16 + r() * 14; if (clear(x, z, 0.5)) mushroom(x, z, 0.5 + r() * 0.5); }
  const tufts = [], flowers = [[], [], [], []];
  for (let i = 0; i < 700; i++) {
    const x = (r() - 0.5) * 36, z = -26 + r() * 30;
    if (!clear(x, z, 0.25)) continue;
    if (r() < (o.stage === 0 ? 0.35 : 0.2)) flowers[Math.floor(r() * 4)].push([x, z, 0.5 + r() * 0.35, r() * 3]);
    else tufts.push([x, z, 0.6 + r() * 0.7, r() * 3]);
  }
  scatter(M.blade, 0.6, 0.36, tufts);
  flowers.forEach((f, i) => f.length && scatter(M.flowers[i], 0.36, 0.42, f));

  if (o.time !== 'night' || deep) shafts(look, [[-6, -12, 2.2], [-1, -16, 1.6], [4, -10, 2.6], [9, -15, 1.8], [-10, -6, 2]].slice(0, deep ? 5 : 3));
  motes(look.fireflies || deep ? 60 : 36, look.fireflies ? '#e0f878' : look.motes, [-12, 12, -20, 2, 4], { size: look.fireflies ? 0.22 : 0.12, rise: 0.05 });
  if (heart) motes(50, '#b8f8a0', [heart.x - 6, heart.x + 6, heart.z - 2, heart.z + 6, 9], { size: 0.3, rise: 0.25 });
  if (o.time === 'day' || o.time === 'dawn') butterflies(o.stage === 0 ? 4 : 2, r);
  rain();
  const runes = B.runes;
  if (runes) B.ticks.push((t) => runes.forEach((u, i) => { u.material.opacity = 0.45 + Math.sin(t * 1.6 + i) * 0.4; }));

  const b = B;
  B = null;
  return b;
}

/* ---------- the frame ---------- */

const onBattle = () => document.body.dataset.screen === 'battle-screen';

function frame(now) {
  raf = 0;
  if (!A) return;
  if (!onBattle()) { unmountArena(); return; }
  const dt = Math.min(0.1, (now - (last || now)) / 1000);
  last = now;
  const t = now / 1000;
  stormK += ((stormOn ? 1 : 0) - stormK) * Math.min(1, dt * 1.5);
  const look = A.look;
  hemi.intensity = look.hemi[2] * (1 - stormK * 0.45) + flashK * 2;
  sun.intensity = look.sun[1] * (1 - stormK * 0.75);
  if (stormOn && Math.random() < dt * 0.25) flashK = 1;   // lightning, now and then
  flashK = Math.max(0, flashK - dt * 3);
  for (const f of A.ticks) f(t, dt);
  const focus = 1 - (A.at.foe.sy + A.at.you.sy) / 2;
  post.draw(scene, camera, focus);
  if (!document.hidden) raf = requestAnimationFrame(frame);
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

let warming = null;
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
    camera = new THREE.PerspectiveCamera(24, 1, 0.5, 160);
    hemi = new THREE.HemisphereLight('#fff', '#444', 1);
    sun = new THREE.DirectionalLight('#fff', 2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 });
    sun.shadow.bias = -0.0012;
    sun.shadow.normalBias = 0.03;
    scene.add(hemi, sun, sun.target);
    precompile();
    post = createPost(renderer, { short: 720, crisp: false });
    Object.assign(post.final.uniforms.uBlur, { value: 3.2 });
    Object.assign(post.final.uniforms.uBand, { value: 0.26 });
    Object.assign(post.final.uniforms.uBloom, { value: 0.55 });
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (A) rebuild(); }, 200);
    });
  })();
  warming.catch(() => { warming = null; });
  return warming;
}

/** Every material's shaders built ahead, under the arena's lights and fog, so a boss's pixel prelude doesn't stutter
    while its 3D arena is laid behind it. */
function precompile() {
  const M = materials(), g = new THREE.Group(), geo = new THREE.PlaneGeometry(1, 1);
  scene.fog = new THREE.Fog('#fff', 30, 85);
  for (const m of Object.values(M).flat()) g.add(new THREE.Mesh(geo, m));
  g.add(new THREE.InstancedMesh(geo, M.blade, 1), new THREE.Points(geo, new THREE.PointsMaterial({ transparent: true, blending: THREE.AdditiveBlending })));
  g.traverse(o => { o.castShadow = o.receiveShadow = true; });
  scene.add(g);
  try { renderer.compile(scene, camera); } catch { /* built on first use instead */ }
  scene.remove(g);
}

let current = null;   // what mountArena() was last asked for, to build again on a resize
/** Lays the 3D arena under the battle screen: `o` is { biome, kind, stage }, `reveal` false to build it hidden (a boss,
    whose pixel prelude plays first; revealArena() shows it). Resolves false where it can't (no WebGL, offline): the
    pixel scene stays. */
export async function mountArena(o, { reveal = true } = {}) {
  unmountArena();
  const id = ++building;
  wanted = reveal;
  stormOn = false; stormK = 0;
  const stage = new URLSearchParams(location.search).get('stage');
  current = { ...o, stage: stage != null ? Math.max(0, Math.min(3, Number(stage) || 0)) : o.stage, time: timeOfDay() };
  try { await warmArena(); } catch { return false; }
  // the page's sprites must be laid out (sizeSprite()) before their pads are cast into the ground
  await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
  if (id !== building || !onBattle()) return false;
  return rebuild();
}

function rebuild() {
  if (A) { dispose(A.group); scene.remove(A.group); A = null; }
  resize();
  const b = build(current);
  if (!b) return false;
  A = b;
  scene.add(A.group);
  if (wanted) show(false);
  last = 0;
  raf ||= requestAnimationFrame(frame);
  return true;
}

function show(fade) {
  document.body.classList.add('arena3d');
  view.classList.toggle('fade', fade && !matchMedia('(prefers-reduced-motion: reduce)').matches);
  void view.offsetWidth;
  view.classList.add('on');
  // the pixel scene stays under the fade, then is put away
  const solid = () => { if (A) document.body.classList.add('arena3d-solid'); };
  if (view.classList.contains('fade')) view.addEventListener('animationend', solid, { once: true });
  else solid();
}

/** The boss's prelude is over: the arena comes up out of its last white flash. */
export function revealArena() {
  wanted = true;
  if (A) show(true);
}

/** Back to the pixel scene (the fight is over, or the next one isn't 3D). */
export function unmountArena() {
  building++;
  cancelAnimationFrame(raf); raf = 0;
  document.body.classList.remove('arena3d', 'arena3d-solid');
  view?.classList.remove('on', 'fade');
  if (A) { dispose(A.group); scene.remove(A.group); A = null; }
}

/** A boss close to fainting brings the weather in (rain, lightning), like the pixel scene's storm. */
export function stormArena(on) { stormOn = on; }

document.addEventListener('visibilitychange', () => { if (!document.hidden && A && !raf) raf = requestAnimationFrame(frame); });
