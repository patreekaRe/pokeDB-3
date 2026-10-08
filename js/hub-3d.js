/* hub-3d.js  -  the Clearing as a walkable HD-2D hub (branch secret-base, session 3 part a): after PRESS START your
   partner stands in a small 3D Clearing and walks up to the places instead of tapping the title's signs. The trail out
   (Continue / New game), the Safari Zone's gate, the Game Corner's stall, the Sky Pillar, the Sealed Gate once broken, the Secret Base's door in
   the Ancient Tree's roots each open what their sign opens; the Pokédex is a shut handheld in the bottom left corner that
   grows into the device (the user's call, 2026-10-08: always to hand, not a place to walk to). Everything is painted here in code in
   the Clearing's palette (js/scene.js's clearing day colours): pixel-textured ground, billboard trees (instanced) and
   places; the partner's GIF and the post pass are js/hd2d.js's, shared with the Secret Base.
   It lives inside #title-screen, over its sky and under its logo and corner, and runs only while the title shows. The
   signs are the fallback: no WebGL, Three.js not loading, or Settings' Title screen set to Signs (js/title.js). */

import { getSave } from './storage.js';
import { timeOfDay } from './daytime.js';
import { calmFx } from './prefs.js';
import { playSound, playCry, setLoop } from './audio.js';
import { partner, deviceNews } from './trainercard.js';
import { loadThree, tex, dispose, monBoard, drawMon, onSprite, createPost, curtain } from './hd2d.js';
import { makeGate, gateHp, gateReady } from './gate.js';
import { isStarterUnlocked } from './progress.js';
import { STARTERS_BY_ID } from './data/starters.js';
import { safariOpen, safariUnlockProgress } from './data/pokedex.js';
import { towerOpen } from './data/tower.js';
import { smoothIcon } from './smooth-icons.js';

const COLS = 13, ROWS = 12;   // the walkable grid, tile (0, 0) at the back left
const M = 4, FRONT = 1;       // grass and forest round it (tiles): back and sides, and in front where the trail leaves
const TP = 16;                // painted pixels a tile
const START = { x: 6, y: 8 };
const PITCH = 0.6, LOOK_Y = 0.6;   // Octopath's low angle; Pokémon lean back by all of it (showHub()), so they face the camera unsquashed
const ACROSS = 8;             // tiles the view shows across at least; an upright phone pans over the rest
const DEPTH = 15;             // and rows deep at least, on a wide screen
const SEEN = 2.6;             // how near (tiles) a place's doorstep you walk before its name tag pops up

// the Clearing's day colours (BIOME_ART.clearing in js/scene.js); the light, not the paint, follows the clock
const P = {
  meadow: ['#90d468', '#80c858', '#70bc4c', '#62b044', '#56a43c', '#4a9834'],
  blade: ['#b0e878', '#78c050', '#3e8832'],
  trees: ['#6cc058', '#48a044', '#2e7c34', '#1c5a26'],
  deep: ['#4e9a48', '#347a38', '#225a2a', '#123a1a'],
  trunk: ['#9a6c40', '#7a5430', '#4e3418', '#2a1a0c'],
  bark: ['#7a5a3c', '#5a4028', '#3a2818', '#1c1008'],
  moss: ['#8ac858', '#5a9a40'],
  wood: ['#d0a068', '#a87840', '#744c24', '#3a2410'],
  stone: ['#e0e0d8', '#b0b0a8', '#808078', '#484844'],
  path: ['#ead6a2', '#d6ba82', '#bc9e64', '#8e7444'],
  roof: ['#d85040', '#a03028'],
  flowers: [['#ffffff', '#f8d848'], ['#f8e048', '#f89830'], ['#f8a0c8', '#f8f0f8'], ['#b0a0f8', '#f8f8f8']],
};

// glow: how hard the lantern and the Sky Pillar's door shine; lamp: the two lights they cast;
// bugs: pollen drifting by day, fireflies blinking from dusk; air: the ambience loop (js/audio.js)
const LIGHT = {
  dawn: { sky: '#ffd8c0', ground: '#5a5048', amb: 1.3, sun: '#ffb890', sunI: 2.4, at: [-10, 8, 6], bg: '#e8b8a8', glow: 0.5, lamp: 0.5, bugs: 'pollen', bugsI: 0.6, air: 'clearing-day' },
  day: { sky: '#ffffff', ground: '#6a7a50', amb: 1.5, sun: '#fff4e0', sunI: 2.8, at: [-6, 14, 8], bg: '#9ccaf0', glow: 0.15, lamp: 0, bugs: 'pollen', bugsI: 1, air: 'clearing-day' },
  dusk: { sky: '#f8a878', ground: '#4a3040', amb: 1.1, sun: '#ff9050', sunI: 2.4, at: [10, 7, 6], bg: '#d88868', glow: 1, lamp: 1.2, bugs: 'fireflies', bugsI: 0.6, air: 'clearing-night' },
  night: { sky: '#6878c0', ground: '#141830', amb: 0.8, sun: '#a0b4f8', sunI: 0.8, at: [4, 14, 6], bg: '#101830', glow: 1.6, lamp: 3, bugs: 'fireflies', bugsI: 1, air: 'clearing-night' },
};
const AIRS = ['clearing-day', 'clearing-night'];
// the painted pixels that shine (an emissive map each): the lantern by the base's door, the Sky Pillar's door and stair
const GLOWS = { lantern: ['#f8e070', '#fff4c0', '#f8d848'], door: ['#2a3a6a', '#6a8ae0', '#141a30'], slots: ['#fff8e0', '#fff4a0', '#f83048'] };
const BUGS = 44;

// the paths, as centre lines between tile centres; the plaza round START
const PATHS = [[[6, 3], [6, ROWS + FRONT + 1]], [[1, 4], [11, 4]], [[1, 4], [1, 3]], [[11, 4], [11, 3]], [[2, 8], [6, 8]]];

let THREE, renderer, scene, camera, post, root, view, screen, acts, dexBtn;
let hemi, sun, ring, ground, forest, placeGroup;
let mon = null, walker = { x: 0, z: 0, tile: START, path: [], facing: 'front', flip: false, hop: 0 };
let places = [], blocked = new Set(), aim = null, here = null, tags = [], card;
let glowMats = [], lamps = [], bugs = null, flyer = null, nextFly = 0, stepAt = 0, airAt = 0, tree = null, inBase = false, entering = null;
let calm = false, time = '', running = false, last = 0, fpsLog = [], camX = 0, camZ = 0, fpsEl = null, gateArt = null;
let built = null;   // the promise of the first build
let placed = false; // the partner has been put on the plaza once

const tileX = (tx) => tx + 0.5 - COLS / 2;
const tileZ = (ty) => ty + 0.5 - ROWS / 2;
const key = (x, y) => `${x},${y}`;

/* ---------- painting ---------- */

function art(w, h) {
  const c = new OffscreenCanvas(w, h), g = c.getContext('2d');
  const dot = (x, y, col, ww = 1, hh = 1) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); };
  return { c, g, dot };
}

function seeded(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };

/** Round leafy blobs, lit from the top left, with a dark outline: every canopy and bush. */
function blobs(a, list, pal, rnd) {
  const { width: w, height: h } = a.c, fill = new Int8Array(w * h).fill(-1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let best = null, depth = 0;
    for (const b of list) {
      const d = 1 - Math.hypot(x - b[0], y - b[1]) / b[2];
      if (d > depth) { depth = d; best = b; }
    }
    if (!best) continue;
    const l = -((x - best[0]) / best[2] * 0.55 + (y - best[1]) / best[2] * 0.83) + (rnd() - 0.5) * 0.45;
    fill[y * w + x] = l > 0.38 ? 0 : l > -0.15 ? 1 : 2;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (fill[i] < 0) continue;
    const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1 || fill[i - 1] < 0 || fill[i + 1] < 0 || fill[i - w] < 0 || fill[i + w] < 0;
    a.dot(x, y, pal[edge ? 3 : fill[i]]);
  }
}

/** A Clearing tree: a short trunk under a round crown of three or four blobs. */
function treeArt(seed, pal = P.trees) {
  const rnd = seeded(seed), a = art(44, 60), j = () => (rnd() - 0.5) * 4;
  for (let y = 36; y < 60; y++) {
    const flare = y > 54 ? (y - 54) : 0;
    for (let x = 19 - flare; x <= 24 + flare; x++) a.dot(x, y, P.trunk[x < 21 - flare / 2 ? 0 : x > 22 + flare / 2 ? 2 : 1]);
  }
  a.dot(18, 59, P.trunk[3], 8, 1);
  blobs(a, [[22 + j(), 23 + j(), 16], [12 + j(), 30, 10 + j()], [32 + j(), 30, 10 + j()], [22 + j(), 12 + j(), 11]], pal, rnd);
  return a.c;
}

function bushArt(seed) {
  const rnd = seeded(seed), a = art(30, 20);
  blobs(a, [[10, 12, 8], [19, 11, 9], [15, 7, 7]], P.trees, rnd);
  if (rnd() < 0.6) for (let i = 0; i < 4; i++) { const [x, y] = [6 + Math.floor(rnd() * 18), 6 + Math.floor(rnd() * 8)]; a.dot(x, y, '#f04858', 2, 2); a.dot(x, y, '#f8c8d0'); }
  return a.c;
}

/** The ground: meadow grass, blades and flowers, the dirt paths and the plaza, and a soft dark rim under the forest. */
function groundArt() {
  const W = (COLS + 2 * M) * TP, H = (ROWS + M + FRONT) * TP, a = art(W, H), rnd = seeded(7);
  const img = a.g.createImageData(W, H), d = img.data;
  const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const meadow = P.meadow.map(rgb), dirt = P.path.map(rgb);
  const seg = (u, v, [[x1, y1], [x2, y2]]) => {
    const dx = x2 - x1, dy = y2 - y1, k = Math.max(0, Math.min(1, ((u - x1) * dx + (v - y1) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(u - x1 - dx * k, v - y1 - dy * k);
  };
  const smooth = (x, y, s) => {   // value noise on an s-pixel lattice
    const gx = Math.floor(x / s), gy = Math.floor(y / s), fx = x / s - gx, fy = y / s - gy;
    const a0 = hash(gx, gy), a1 = hash(gx + 1, gy), b0 = hash(gx, gy + 1), b1 = hash(gx + 1, gy + 1);
    return (a0 + (a1 - a0) * fx) * (1 - fy) + (b0 + (b1 - b0) * fx) * fy;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / TP - M - 0.5, v = y / TP - M - 0.5;
    const wob = (smooth(x, y, 5) - 0.5) * 0.22;
    let path = Math.min(...PATHS.map(s => seg(u, v, s))) - 0.42 - wob;
    path = Math.min(path, Math.hypot(u - START.x, v - START.y) - 1.55 - wob * 2);
    let c;
    if (path < 0) {
      const n = smooth(x + 99, y, 3) + hash(x, y) * 0.35;
      c = dirt[path > -0.06 ? 3 : n > 1.0 ? 0 : n > 0.62 ? 1 : 2];
      if (hash(x * 3, y * 7) > 0.985) c = dirt[3];
    } else {
      // darker away from the walkable ground, towards the trees
      const out = Math.max(-u - 0.5, u - (COLS - 0.5), -v - 0.5, 0) ;
      const n = smooth(x, y, 6) * 3.2 + hash(x, y) * 1.4 + (path < 0.12 ? 1 : 0) + Math.min(2, out * 0.6);
      c = meadow[Math.min(5, Math.max(0, Math.floor(n)))];
    }
    const i = (y * W + x) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  a.g.putImageData(img, 0, 0);
  const onPath = (x, y) => { const u = x / TP - M - 0.5, v = y / TP - M - 0.5; return Math.min(...PATHS.map(s => seg(u, v, s))) < 0.7 || Math.hypot(u - START.x, v - START.y) < 1.9; };
  for (let i = 0; i < 900; i++) {   // blades
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H);
    if (onPath(x, y)) continue;
    a.dot(x, y, P.blade[2], 1, 1); a.dot(x, y - 1, P.blade[1]); a.dot(x, y - 2, P.blade[0]);
  }
  for (let i = 0; i < 70; i++) {   // flowers, in little clumps
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H), [petal, eye] = P.flowers[Math.floor(rnd() * 4)];
    if (onPath(x, y)) continue;
    for (let k = 0; k < 3; k++) {
      const fx = x + Math.floor(rnd() * 7) - 3, fy = y + Math.floor(rnd() * 5) - 2;
      a.dot(fx - 1, fy, petal); a.dot(fx + 1, fy, petal); a.dot(fx, fy - 1, petal); a.dot(fx, fy + 1, petal); a.dot(fx, fy, eye);
    }
  }
  return a.c;
}

const FONT = { S: ['###', '#..', '###', '..#', '###'], A: ['.#.', '#.#', '###', '#.#', '#.#'], F: ['###', '#..', '##.', '#..', '#..'], R: ['##.', '#.#', '##.', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'] };
function word(a, text, x, y, col) {
  [...text].forEach((ch, i) => FONT[ch].forEach((row, r) => [...row].forEach((p, c) => { if (p === '#') a.dot(x + i * 4 + c, y + r, col); })));
}

/** The Safari Zone's gate: two log posts under a red-roofed beam, its green board; shut, a rope across it. */
function safariArt(open) {
  const a = art(60, 56);
  const log = (x0, y0, w, h) => { for (let x = x0; x < x0 + w; x++) a.dot(x, y0, P.wood[x === x0 ? 0 : x === x0 + w - 1 ? 3 : x - x0 < w / 2 ? 1 : 2], 1, h); };
  log(7, 14, 6, 42); log(47, 14, 6, 42);
  a.dot(6, 53, P.wood[3], 8, 3); a.dot(46, 53, P.wood[3], 8, 3);
  for (let y = 4; y < 13; y++) {   // the roof, wider at its foot, its ends turned up
    const half = 24 + (y - 4) * 0.7;
    a.dot(Math.round(30 - half), y, y < 6 ? P.roof[0] : y > 10 ? '#702018' : P.roof[1], Math.round(half * 2), 1);
  }
  a.dot(0, 11, P.roof[1], 3, 2); a.dot(57, 11, P.roof[1], 3, 2);
  a.dot(3, 13, P.wood[2], 54, 3); a.dot(3, 13, P.wood[1], 54, 1);
  a.dot(16, 18, P.wood[3], 28, 13);   // the board
  a.dot(17, 19, '#3a9a48', 26, 11);
  a.dot(17, 19, '#58b860', 26, 1);
  word(a, 'SAFARI', 19, 22, '#f8f8e0');
  a.dot(20, 16, P.wood[3], 1, 3); a.dot(39, 16, P.wood[3], 1, 3);
  if (!open) {
    for (let x = 13; x < 47; x++) { const y = 36 + Math.round(Math.sin((x - 13) / 34 * Math.PI) * 3); a.dot(x, y, (x >> 2) % 2 ? '#e84838' : '#f8f0e0', 1, 2); }
  }
  return a.c;
}

/** The Game Corner's stall: a striped awning trimmed with bulbs over two slot machines, three 7s on each one's reels. */
function cornerArt() {
  const a = art(48, 40), seven = ['###', '..#', '.#.', '.#.', '.#.'];
  a.dot(3, 10, P.wood[2], 2, 30); a.dot(43, 10, P.wood[2], 2, 30);
  a.dot(3, 10, P.wood[1], 1, 30); a.dot(43, 10, P.wood[1], 1, 30);
  a.dot(5, 11, '#3a2a5a', 38, 27);   // the booth's dark back
  for (let y = 1; y < 10; y++) {   // the awning, red and yellow, wider at its foot
    const half = 21 + y * 0.35;
    for (let x = Math.round(24 - half); x < Math.round(24 + half); x++) {
      const red = Math.floor((x + 1) / 5) % 2 === 0;
      a.dot(x, y, y === 1 ? '#f8f0d0' : red ? (y > 7 ? '#b8302a' : '#e84838') : (y > 7 ? '#d8a830' : '#f8d848'));
    }
  }
  for (let x = 2; x < 46; x += 5) a.dot(x, 10, Math.floor((x + 1) / 5) % 2 === 0 ? '#b8302a' : '#d8a830', 4, 2);   // its scalloped hem
  for (let x = 4; x < 45; x += 4) a.dot(x, 12, '#fff4a0');   // a row of bulbs
  for (const x0 of [7, 26]) {   // the slot machines
    a.dot(x0, 15, '#2a2a3a', 15, 23); a.dot(x0 + 1, 16, '#c8c8d8', 13, 21); a.dot(x0 + 1, 16, '#e8e8f0', 13, 1);
    a.dot(x0 + 1, 18, '#2a2a3a', 13, 9);
    for (let r = 0; r < 3; r++) {
      const cx = x0 + 2 + r * 4;
      a.dot(cx, 19, '#fff8e0', 3, 7);
      seven.forEach((row, y) => [...row].forEach((p, c) => { if (p === '#') a.dot(cx + c, 20 + y, '#f83048'); }));
    }
    a.dot(x0 + 4, 29, '#8a8aa0', 7, 2); a.dot(x0 + 3, 33, '#3a3a4a', 9, 2);   // the coin slot and tray
    a.dot(x0 + 15, 20, '#8a8aa0', 1, 7); a.dot(x0 + 14, 17, '#f83048', 3, 3);   // the lever
  }
  a.dot(2, 38, P.wood[3], 44, 2); a.dot(2, 38, P.wood[2], 44, 1);
  return a.c;
}

/** The Sky Pillar's stone: bricks, a trim band every few courses, window slits; the front face has its arched door. */
function pillarArt(front) {
  const W = 42, H = 192, a = art(W, H), rnd = seeded(front ? 3 : 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const row = Math.floor(y / 5), off = row % 2 ? 4 : 0, mortar = y % 5 === 4 || (x + off) % 9 === 8;
    const n = hash(x >> 1, y >> 1);
    a.dot(x, y, mortar ? P.stone[3] : n > 0.8 ? P.stone[0] : n > 0.25 ? P.stone[1] : P.stone[2]);
  }
  for (const y of [40, 90, 140]) { a.dot(0, y, P.stone[0], W, 2); a.dot(0, y + 2, P.stone[3], W, 1); }
  for (const y of [18, 62, 112, 160]) { a.dot(19, y, '#1c2440', 4, 12); a.dot(19, y, '#3a4a7a', 4, 2); }
  for (let i = 0; i < 40; i++) {   // moss and vines up from the foot
    const x = Math.floor(rnd() * W), top = H - 8 - Math.floor(rnd() * 40);
    for (let y = top; y < H; y += 1) if (rnd() < 0.7) a.dot(x + (rnd() < 0.3 ? 1 : 0), y, P.moss[rnd() < 0.5 ? 0 : 1]);
  }
  if (front) {
    a.g.clearRect(0, 0, 0, 0);
    for (let y = H - 34; y < H; y++) for (let x = 11; x < 31; x++) {
      const r = Math.hypot(x - 20.5, (y - (H - 24)) * 1.1);
      if (y < H - 24 && r > 10.5) continue;
      const rim = y < H - 24 ? r > 8.5 : x < 13 || x > 28;
      a.dot(x, y, rim ? P.stone[0] : y > H - 4 ? '#2a3a6a' : '#141a30');
    }
    for (let y = H - 22; y < H - 2; y += 3) a.dot(19, y, '#6a8ae0', 3, 1);   // the stair inside, lit from above
  }
  return a.c;
}

/** The Ancient Tree: a huge crown, a trunk flaring into arching roots, and the Secret Base's door in the hollow between them. */
function ancientArt(open = false) {
  const W = 128, H = 160, a = art(W, H), rnd = seeded(11);
  // roots: thick curves out of the trunk's foot
  const root = (x0, x1, y1, t) => {
    for (let k = 0; k <= 1; k += 0.01) {
      const x = x0 + (x1 - x0) * k, y = 128 + (y1 - 128) * k * k - Math.sin(k * Math.PI) * 8, r = t * (1 - k * 0.7);
      for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) if (dx * dx + dy * dy <= r * r) {
        const col = dy < -r * 0.4 ? P.bark[0] : dy > r * 0.4 ? P.bark[2] : P.bark[1];
        a.dot(Math.round(x + dx), Math.round(y + dy), col);
      }
    }
  };
  root(50, 10, 157, 6); root(56, 28, 159, 5); root(78, 118, 157, 6); root(72, 100, 159, 5);
  for (let y = 60; y < H; y++) {   // the trunk, widening to the ground
    const k = (y - 60) / (H - 60), half = 15 + k * k * 18;
    for (let x = Math.round(64 - half); x <= Math.round(64 + half); x++) {
      const u = (x - (64 - half)) / (half * 2), streak = hash(x, Math.floor(y / 6)) > 0.8;
      a.dot(x, y, streak ? P.bark[3] : u < 0.3 ? P.bark[0] : u < 0.7 ? P.bark[1] : P.bark[2]);
    }
  }
  for (let i = 0; i < 60; i++) { const x = 34 + Math.floor(rnd() * 60), y = 120 + Math.floor(rnd() * 40); a.dot(x, y, P.moss[rnd() < 0.5 ? 0 : 1], 2, 1); }
  // the door: a dark hollow, a plank door in it, a lantern beside
  for (let y = 116; y < 158; y++) for (let x = 52; x <= 76; x++) {
    const r = Math.hypot(x - 64, (y - 128) * 1.0);
    if (y < 128 && r > 12.5) continue;
    const inner = y < 128 ? r < 10.5 : x > 53 && x < 75;
    if (!inner) { a.dot(x, y, P.bark[3]); continue; }
    if (open) { a.dot(x, y, y > 150 ? '#4a2c14' : y > 144 ? '#2a180a' : '#120804'); continue; }   // the hollow, a warm floor inside
    a.dot(x, y, (x - 55) % 5 === 0 ? P.wood[3] : x < 60 ? P.wood[1] : P.wood[2]);
  }
  a.dot(70, 138, '#f8d848', 2, 2);
  a.dot(44, 108, P.wood[3], 1, 6); a.dot(41, 114, P.wood[3], 7, 1);
  a.dot(41, 115, P.wood[3], 7, 8); a.dot(42, 116, '#f8e070', 5, 6); a.dot(43, 117, '#fff4c0', 3, 3);
  blobs(a, [[64, 40, 36], [28, 58, 24], [100, 58, 24], [44, 26, 22], [86, 26, 22], [64, 14, 18], [16, 74, 12], [112, 74, 12]], P.trees, rnd);
  return a.c;
}

const KIT = { white: '#f6f8fb', pale: '#e2e6ee', grey: '#bcc3cf', dark: '#8a92a0', ink: '#3a3e4c', red: '#e84838', redDark: '#b8302a' };

/** The Safari's board, Scarlet / Violet's roadside kiosk: a white frame on arched legs under a ribbed, curved roof, a
    poster with a red header and three snapshots of today's catches. */
function kioskArt() {
  const a = art(22, 32), K = KIT;
  for (let y = 1; y < 7; y++) {   // the roof, rounded on top, its underside in shadow
    const x0 = y === 1 ? 3 : y === 2 ? 2 : 1;
    a.dot(x0, y, y === 1 ? K.white : y === 6 ? K.dark : y === 2 ? K.pale : K.pale, 22 - x0 * 2, 1);
  }
  for (let x = 5; x < 18; x += 4) a.dot(x, 2, K.grey, 1, 4);   // its ribs
  a.dot(1, 5, K.grey, 20, 1);
  for (const x0 of [2, 18]) {   // the posts, each standing on a little arch
    a.dot(x0, 7, K.white, 2, 21); a.dot(x0 + 1, 7, K.grey, 1, 21);
    a.dot(x0 - 1, 27, K.pale, 4, 2); a.dot(x0 - 1, 29, K.pale, 1, 3); a.dot(x0 + 2, 29, K.grey, 1, 3);
  }
  a.dot(3, 8, K.grey, 16, 15);   // the frame, then the poster
  a.dot(4, 9, K.white, 14, 13);
  a.dot(5, 10, K.red, 12, 2); a.dot(5, 11, K.redDark, 12, 1);
  a.dot(6, 10, K.white); a.dot(6, 11, K.ink);   // a Poké Ball on the header
  for (let x = 6; x < 16; x++) if (x % 3 !== 2) a.dot(x, 13, K.ink, 1, 2);   // a headline
  ['#58b860', '#f8d848', '#6ab0e0'].forEach((c, i) => { a.dot(6 + i * 4, 16, c, 3, 3); a.dot(6 + i * 4, 19, K.grey, 3, 1); });
  a.dot(3, 23, K.pale, 16, 1); a.dot(3, 24, K.dark, 16, 1);   // the rail under it
  return a.c;
}

/** The Sky Pillar's board, a pin-shaped roadside marker: a red-and-white head round a white face, a red arrow pointing
    down its tapering body, on a jointed pole and a stone foot. */
function pinArt() {
  const a = art(16, 40), K = KIT;
  for (let y = 0; y < 27; y++) for (let x = 0; x < 16; x++) {
    const r = Math.hypot(x - 7.5, y - 7.5), half = y < 8 ? 0 : 7.5 - (y - 8) * 0.36;
    const body = r <= 7.5 || (y >= 8 && Math.abs(x - 7.5) <= half);
    if (!body) continue;
    const edge = r > 6.6 && (y < 8 || Math.abs(x - 7.5) > half - 0.9) || (y >= 8 && Math.abs(x - 7.5) > half - 0.9);
    const arrow = y >= 15 && y <= 22 && Math.abs(x - 7.5) <= (22 - y) * 0.55;
    a.dot(x, y, r <= 5 ? K.white : edge ? (y < 8 ? K.redDark : K.grey) : y < 8 ? K.red : arrow ? K.red : K.pale);
  }
  for (let x = 5; x < 11; x++) if (x !== 8) a.dot(x, 5, K.red);   // the face's lines
  a.dot(5, 8, K.ink, 6, 1); a.dot(5, 10, K.ink, 2, 1); a.dot(8, 10, K.ink, 3, 1);
  a.dot(7, 27, K.pale, 2, 9); a.dot(8, 27, K.grey, 1, 9);   // the pole and its joint
  a.dot(6, 30, K.grey, 4, 2); a.dot(6, 30, K.pale, 4, 1);
  a.dot(4, 36, K.grey, 8, 4); a.dot(4, 36, K.pale, 8, 1); a.dot(4, 39, K.dark, 8, 1);
  return a.c;
}

function signArt() {
  const a = art(22, 26);
  a.dot(10, 9, P.wood[2], 3, 17); a.dot(10, 9, P.wood[1], 1, 17);
  a.dot(1, 2, P.wood[3], 20, 9); a.dot(2, 3, P.wood[0], 18, 7); a.dot(2, 9, P.wood[1], 18, 1);
  a.dot(9, 4, P.wood[3], 4, 1); a.dot(8, 5, P.wood[3], 6, 1); a.dot(10, 6, P.wood[3], 2, 3);   // an arrow, this way out
  return a.c;
}

/** A billboard: the painting standing upright, feet at (x, z), `s` units a painted tile. */
function board(canvas, x, z, { s = 1, shadow = true } = {}) {
  const w = canvas.width / TP * s, h = canvas.height / TP * s;
  const m = new THREE.MeshStandardMaterial({ map: tex(canvas), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, h / 2, z);
  mesh.castShadow = shadow;
  return mesh;
}

/** Only the pixels in these colours, the rest black: an emissive map. */
function mask(src, colours) {
  const { width: w, height: h } = src, c = new OffscreenCanvas(w, h), g = c.getContext('2d');
  const d = src.getContext('2d').getImageData(0, 0, w, h), keep = colours.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  for (let i = 0; i < d.data.length; i += 4) {
    const hit = d.data[i + 3] > 8 && keep.some(([r, gg, b]) => d.data[i] === r && d.data[i + 1] === gg && d.data[i + 2] === b);
    if (!hit) { d.data[i] = d.data[i + 1] = d.data[i + 2] = 0; }
  }
  g.putImageData(d, 0, 0);
  return c;
}

/** A material's painted lights shine with the clock (setTime()): `k` scales the hour's glow, in that colour. */
function glowing(m, src, colours, colour = '#ffffff', k = 1) {
  m.emissive = new THREE.Color(colour);
  m.emissiveMap = tex(mask(src, colours));
  m.userData.glow = k;
  glowMats.push(m);
  return m;
}

/* ---------- the places ---------- */

const gateOpen = () => gateHp() <= 0 && isStarterUnlocked(STARTERS_BY_ID.mewtwo);

/** Every place: where it stands (`tiles` it blocks), its doorstep (`step`), whether it's open, what its card says and
    what it opens, all from the title's own actions (`acts`) and today's save. */
function makePlaces() {
  const save = getSave(), run = acts.savedRun();
  const list = [
    {
      id: 'trail', name: run ? 'Continue / New game' : 'New game', step: { x: 6, y: ROWS - 1 }, tiles: [[7, ROWS - 2]], tag: [6, 1.5, ROWS - 1],
      open: true,
      line: run ? `${run.name} waits in the ${run.place}${run.floor ? `, floor ${run.floor}` : ''}. HP ${run.hp}/${run.maxHp}.` : 'The trail out of the Clearing: a new adventure.',
      buttons: run ? [['Continue', () => acts.onContinue(run)], ['New game', acts.onNewGame], ['Escape Rope', acts.onAbandon]] : [['New game', acts.onNewGame]],
      build: (g) => g.add(board(signArt(), tileX(7), tileZ(ROWS - 2))),
    },
    {
      id: 'base', name: 'Secret Base', step: { x: 6, y: 3 }, tiles: rect(3, 0, 9, 2), tag: [6, 3.2, 2], open: true,
      line: 'A door in the Ancient Tree\'s roots: your Secret Base.',
      buttons: [['Go in', enterBase]],
      build: (g) => {
        const shut = ancientArt(), b = board(shut, tileX(6), tileZ(2) + 0.2), open = ancientArt(true);
        glowing(b.material, shut, GLOWS.lantern, '#ffd890');
        tree = { m: b.material, shut: b.material.map, open: tex(open) };
        g.add(b);
      },
    },
  ];
  const safari = safariOpen(save);
  list.push({
    id: 'safari', name: 'Safari Zone', step: { x: 1, y: 3 }, tiles: rect(0, 0, 2, 2), tag: [1, 3.8, 2], open: safari,
    line: safari ? 'Today\'s Safari Zone run, the same for everyone. Only the first try counts.'
      : `The Safari Zone opens once you've beaten every Pokémon in all three biomes. ${safariUnlockProgress(save)}`,
    buttons: safari ? [['Enter', acts.onSafari]] : [],
    build: (g) => g.add(board(safariArt(safari), tileX(1), tileZ(2))),
  });
  list.push({
    id: 'safari-board', name: 'Safari Ranks', step: { x: 3, y: 4 }, tiles: [[3, 3]], tag: [3, 2.6, 3], open: safari,
    line: safari ? 'The Safari Zone\'s notice board: today\'s and yesterday\'s best catches.' : 'Notices for the Safari Zone, once it opens.',
    buttons: safari ? [['Read', () => acts.onBoard('safari')]] : [],
    build: (g) => g.add(board(kioskArt(), tileX(3), tileZ(3))),
  });
  // a low stall, so the Safari stays in view over it
  list.push({
    id: 'corner', name: 'Game Corner', step: { x: 2, y: 8 }, tiles: rect(1, 7, 3, 7), tag: [2, 2.9, 7], open: true,
    line: 'Spend PokéCoins on starters, perks, shinies and Poké Balls.',
    buttons: [['Play', acts.onCorner]],
    build: (g) => { const c = cornerArt(), b = board(c, tileX(2), tileZ(7)); glowing(b.material, c, GLOWS.slots, '#fff0b0', 0.7); g.add(b); },
  });
  const tower = towerOpen(save), best = save.tower?.bestEver || 0;
  list.push({
    id: 'pillar', name: 'Sky Pillar', step: { x: 11, y: 3 }, tiles: rect(10, 0, 12, 2), tag: [11, 4.2, 2], open: tower,
    line: tower ? `A 100-floor climb with a weekly leaderboard.${best ? ` Your best: floor ${best}.` : ''}` : 'Win a run to open the Sky Pillar, a 100-floor tower climb with a weekly leaderboard.',
    buttons: tower ? [['Climb', acts.onTower]] : [],
    build: (g) => {
      const side = new THREE.MeshStandardMaterial({ map: tex(pillarArt(false)), roughness: 1 });
      const door = pillarArt(true), face = glowing(new THREE.MeshStandardMaterial({ map: tex(door), roughness: 1 }), door, GLOWS.door, '#a8c4ff', 0.9);
      const top = new THREE.MeshStandardMaterial({ color: P.stone[1], roughness: 1 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.6, 12, 2.6), [side, side, top, top, face, side]);
      box.position.set(tileX(11), 6, tileZ(1));
      box.castShadow = box.receiveShadow = true;
      g.add(box);
    },
  });
  list.push({
    id: 'pillar-board', name: 'Pillar Ranks', step: { x: 9, y: 4 }, tiles: [[9, 3]], tag: [9, 2.6, 3], open: tower,
    line: tower ? 'The Sky Pillar\'s notice board: this week\'s and last week\'s highest climbers.' : 'Notices for the Sky Pillar, once it opens.',
    buttons: tower ? [['Read', () => acts.onBoard('tower')]] : [],
    build: (g) => g.add(board(pinArt(), tileX(9), tileZ(3))),
  });
  if (gateOpen()) list.push({
    id: 'gate', name: 'Sealed Gate', step: { x: 10, y: 9 }, tiles: rect(9, 8, 11, 8), tag: [10, 4, 8], open: true,
    line: 'The broken Sealed Gate. Something waits beyond it.',
    buttons: [['Go through', acts.onGate]],
    build: (g) => {
      const c = document.createElement('canvas');
      c.width = 48; c.height = 58;
      gateArt = { ...makeGate(48, 58), c, t: tex(c), at: 0 };
      const m = new THREE.MeshStandardMaterial({ map: gateArt.t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, emissive: '#ffffff', emissiveMap: gateArt.t, emissiveIntensity: 0.35 });
      const h = 58 / TP * 1.1, mesh = new THREE.Mesh(new THREE.PlaneGeometry(48 / TP * 1.1, h), m);
      mesh.position.set(tileX(10), h / 2, tileZ(8));
      mesh.castShadow = true;
      g.add(mesh);
      paintGateArt(0);
    },
  });
  else gateArt = null;
  return list;
}

function rect(x0, y0, x1, y1) {
  const out = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push([x, y]);
  return out;
}

function paintGateArt(now) {
  if (!gateArt || now - gateArt.at < 90) return;
  gateArt.at = now;
  const g = gateArt.c.getContext('2d');
  g.clearRect(0, 0, 48, 58);
  gateArt.paint(g, { hp: 0, open: true, t: now / 1000 });
  gateArt.t.needsUpdate = true;
}

function buildPlaces() {
  dispose(placeGroup);
  tree?.open.dispose();
  glowMats = []; tree = null;
  tags.forEach(t => t.el.remove());
  places = makePlaces();
  blocked = new Set(TREE_TILES.map(([x, y]) => key(x, y)));
  tags = [];
  for (const p of places) {
    const g = new THREE.Group();
    p.build(g);
    g.traverse(o => { o.userData.place = p; });
    placeGroup.add(g);
    for (const [x, y] of p.tiles) blocked.add(key(x, y));
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'hub-tag' + (p.open ? '' : ' locked');
    el.append(Object.assign(document.createElement('span'), { textContent: p.name }));
    if (!p.open) el.prepend(smoothIcon('lock', 'hub-tag-lock'));
    el.addEventListener('click', () => goTo(p, true));
    root.querySelector('.hub-tags').append(el);
    tags.push({ el, p, at: new THREE.Vector3(tileX(p.tag[0]), p.tag[1], tileZ(p.tag[2])) });
  }
  setTime(true);
}

/* ---------- the Clearing round them ---------- */

// trees inside the walkable grid (they block)
const TREE_TILES = [[0, 9], [0, 10], [0, 11], [12, 9], [12, 10], [12, 11], [3, 11]];

function buildClearing() {
  const W = COLS + 2 * M, D = ROWS + M + FRONT;
  const top = new THREE.MeshStandardMaterial({ map: tex(groundArt()), roughness: 1 });
  const earth = new THREE.MeshStandardMaterial({ color: '#7a5a34', roughness: 1 }), under = new THREE.MeshStandardMaterial({ color: '#3a2818' });
  ground = new THREE.Mesh(new THREE.BoxGeometry(W, 1, D), [earth, earth, top, under, earth, earth]);
  ground.position.set(0, -0.5, (FRONT - M) / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  forest = new THREE.Group();
  scene.add(forest);
  const rnd = seeded(21), kinds = [treeArt(1), treeArt(2), treeArt(3, P.deep), treeArt(4, P.deep), bushArt(5), bushArt(6)];
  const spots = kinds.map(() => []);
  const put = (k, x, z, s) => spots[k].push({ x, z, s });
  // the forest's wall: three ragged rows behind, three down each side, the far ones bigger and darker
  for (let r = 0; r < 3; r++) for (let x = -M + 0.5; x < COLS + M; x += 1.25 + rnd() * 0.4) {
    put(r ? 2 + (rnd() < 0.5 ? 1 : 0) : rnd() < 0.5 ? 0 : 1, tileX(x - 0.5) + (rnd() - 0.5) * 0.5, tileZ(-1 - r * 1.2 - rnd() * 0.4), 1.25 + r * 0.25 + rnd() * 0.2);
  }
  for (const s of [-1, 1]) for (let r = 0; r < 3; r++) for (let y = -1; y < ROWS + FRONT; y += 1.3 + rnd() * 0.4) {
    if (r === 0 && y > ROWS - 0.5) continue;
    const x = s < 0 ? -1 - r * 1.2 : COLS + r * 1.2;
    put(r ? 2 + (rnd() < 0.5 ? 1 : 0) : rnd() < 0.5 ? 0 : 1, tileX(x) + (rnd() - 0.5) * 0.4, tileZ(y) + (rnd() - 0.5) * 0.3, 1.1 + r * 0.25 + rnd() * 0.2);
  }
  for (const [x, y] of TREE_TILES) put(y >= 9 && rnd() < 0.4 ? 4 : rnd() < 0.5 ? 0 : 1, tileX(x), tileZ(y), 1);
  for (const x of [1, 3, 4, 8, 9, 11]) put(4 + (x % 2), tileX(x), tileZ(ROWS) + 0.2, 1);   // bushes along the front edge, the trail between
  const m4 = new THREE.Matrix4();
  kinds.forEach((c, k) => {
    const list = spots[k];
    if (!list.length) return;
    const geo = new THREE.PlaneGeometry(c.width / TP, c.height / TP);
    geo.translate(0, c.height / TP / 2, 0);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ map: tex(c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }), list.length);
    list.forEach((s, i) => mesh.setMatrixAt(i, m4.makeScale(s.s, s.s, s.s).setPosition(s.x, 0, s.z)));
    mesh.castShadow = true;
    mesh.raycast = () => {};
    forest.add(mesh);
  });
}

/* ---------- walking ---------- */

const inGrid = (c) => c.x >= 0 && c.y >= 0 && c.x < COLS && c.y < ROWS;
const free = (c) => inGrid(c) && !blocked.has(key(c.x, c.y));
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Breadth-first over free tiles; if the tapped tile is taken, to the reachable one nearest it. */
function route(from, to) {
  const prev = new Map([[key(from.x, from.y), null]]), queue = [from];
  let best = from, bestD = Infinity;
  while (queue.length) {
    const c = queue.shift();
    const d = Math.abs(c.x - to.x) + Math.abs(c.y - to.y);
    if (d < bestD) { best = c; bestD = d; }
    if (!d) break;
    for (const [dx, dy] of STEPS) {
      const n = { x: c.x + dx, y: c.y + dy }, k = key(n.x, n.y);
      if (!free(n) || prev.has(k)) continue;
      prev.set(k, c); queue.push(n);
    }
  }
  const path = [];
  for (let c = best; c && key(c.x, c.y) !== key(from.x, from.y); c = prev.get(key(c.x, c.y))) path.unshift(c);
  return path;
}

function walk(dt) {
  const w = walker, step = w.path[0];
  if (!step) { w.hop = 0; return false; }
  const tx = tileX(step.x), tz = tileZ(step.y), dx = tx - w.x, dz = tz - w.z;
  const d = Math.hypot(dx, dz), move = dt / 1000 * 3.4;
  if (Math.abs(dz) > Math.abs(dx)) w.facing = dz < 0 && mon.sheets.back ? 'back' : 'front';
  else { w.facing = 'front'; w.flip = dx > 0; }
  if (d <= move) { w.x = tx; w.z = tz; w.tile = step; w.path.shift(); }
  else { w.x += dx / d * move; w.z += dz / d * move; }
  w.hop += dt;
  return !w.path.length;
}

const placeAt = (t) => places.find(p => p.step.x === t.x && p.step.y === t.y) ?? null;

/** Head for a place's doorstep; `enter` opens it on arrival (a tap on the place itself), else its card shows there. */
function goTo(p, enter) {
  if (walker.path.length === 0 && placeAt(walker.tile) === p) return enter ? open(p) : showCard(p);
  walker.path = route(walker.tile, p.step);
  aim = enter ? p : null;
  hideCard();
  playSound('confirm');
  if (!walker.path.length) open(p);
}

function arrived() {
  here = placeAt(walker.tile);
  const go = aim;
  aim = null;
  if (!here) return;
  walker.facing = here.id === 'trail' || !mon.sheets.back ? 'front' : 'back';
  if (go === here) open(here);
  else showCard(here);
}

/** What a place does: a closed one says why; the trail with a saved run asks Continue or New game; else straight in. */
function open(p) {
  if (!p.open || p.buttons.length > 1) return showCard(p);
  if (p.id === 'base') return enterBase();
  walker.hopUntil = performance.now() + 400;
  playSound('confirm');
  hideCard();
  setTimeout(() => { if (running) p.buttons[0][1](); }, calm ? 0 : 260);
}

/** Into the Ancient Tree: the door swings open, your partner steps into the dark, and the Secret Base comes up under a
    curtain (js/base-3d.js); its ✕ brings it back out here (showHub(), `inBase`). */
async function enterBase() {
  if (entering) return;
  hideCard();
  walker.path = []; walker.facing = mon.sheets.back ? 'back' : 'front';
  if (tree) tree.m.map = tree.open;
  playSound('door');
  entering = { at: performance.now(), z: walker.z };
  await curtain(true, calm ? 0 : 420);
  entering = null;
  if (tree) tree.m.map = tree.shut;
  inBase = true;
  await acts.onBase();
}

/** Back out of the base: on its doorstep, facing you, the door shutting behind. */
function leftBase() {
  inBase = false;
  const p = places.find(q => q.id === 'base');
  walker.tile = p.step; walker.x = tileX(p.step.x); walker.z = tileZ(p.step.y);
  walker.facing = 'front'; walker.flip = false; walker.hopUntil = performance.now() + 500;
  camX = walker.x; camZ = walker.z;
  here = p;
  if (!tree) return;
  tree.m.map = tree.open;
  setTimeout(() => { if (tree) tree.m.map = tree.shut; }, calm ? 0 : 650);
}

/* ---------- the card under a place ---------- */

function showCard(p) {
  here = p;
  card.querySelector('.hub-card-name').textContent = p.name;
  card.querySelector('.hub-card-line').textContent = p.line;
  const row = card.querySelector('.hub-card-btns');
  row.replaceChildren(...p.buttons.map(([label, go], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn' + (i ? ' secondary' : '');
    b.textContent = label;
    b.addEventListener('click', () => { playSound('confirm'); hideCard(); go(); });
    return b;
  }));
  card.classList.toggle('locked', !p.open);
  card.hidden = false;
  if (!p.open) playSound('cancel');
}
function hideCard() { card.hidden = true; }

/* ---------- the Pokédex in the corner ---------- */

/** It grows from the corner into the device (js/device.js's `from`), which opens over the hub; shut, it's back here. */
function openDex() {
  if (dexBtn.classList.contains('out') || entering) return;
  hideCard();
  walker.path = []; aim = null;
  playSound('confirm');
  acts.onPokedex(dexBtn, () => { dexBtn.classList.remove('out'); dexNews(); });
  dexBtn.classList.add('out');
}

/** Its LED blinks while the device has something new (a badge, a find), like the title's Pokédex sign's "!". */
const dexNews = () => dexBtn.classList.toggle('news', deviceNews());

/* ---------- taps and keys ---------- */

function ndc(e) {
  const r = view.getBoundingClientRect();
  return new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
}

function onTap(e) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(ndc(e), camera);
  const hit = ray.intersectObjects([mon.board, placeGroup], true).find(h => h.object !== mon.board || onSprite(h));
  if (hit?.object === mon.board) { playCry(mon.id); walker.hopUntil = performance.now() + 500; return; }
  if (hit?.object.userData.place) return goTo(hit.object.userData.place, true);
  const at = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), at)) return;
  const to = { x: Math.floor(at.x + COLS / 2), y: Math.floor(at.z + ROWS / 2) };
  if (!inGrid(to)) return;
  walker.path = route(walker.tile, to);
  aim = null;
  hideCard();
  const end = walker.path.at(-1) ?? walker.tile;
  ring.position.set(tileX(end.x), 0.02, tileZ(end.y));
  ring.material.opacity = 0.9;
  if (!walker.path.length) arrived();
}

function onKey(e) {
  if (!running || document.querySelector('dialog:modal, #shop-dialog[open]') || document.activeElement?.matches?.('input')
    || document.getElementById('collection-screen')?.hidden === false) return;
  const step = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
  if (step) {
    e.preventDefault();
    const from = walker.path.at(-1) ?? walker.tile, n = { x: from.x + step[0], y: from.y + step[1] };
    if (!free(n)) return;
    if (walker.path.length > 1) walker.path.length = 1;
    walker.path.push(n);
    aim = null;
    hideCard();
    return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && !walker.path.length && placeAt(walker.tile) && !document.activeElement?.closest?.('button')) {
    e.preventDefault();
    const p = placeAt(walker.tile);
    if (card.hidden || p.buttons.length < 2) open(p); else card.querySelector('.hub-card-btns button')?.click();
  }
  if (e.key === 'Escape' && !card.hidden) hideCard();
}

/* ---------- light, camera, frame ---------- */

function setTime(force) {
  const t = timeOfDay();
  if (t === time && !force) return;
  time = t;
  const L = LIGHT[t];
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.amb;
  sun.color.set(L.sun); sun.intensity = L.sunI; sun.position.set(...L.at);
  scene.background = new THREE.Color(L.bg);
  scene.fog.color.set(L.bg);
  for (const m of glowMats) m.emissiveIntensity = L.glow * m.userData.glow;
  for (const l of lamps) l.intensity = L.lamp * l.userData.k;
  if (bugs) bugs.userData.kind = L.bugs;
}

/* ---------- life: pollen or fireflies, a legendary flying over, the Clearing's sounds ---------- */

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d'), r = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.8)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 16, 16);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeBugs() {
  const rnd = seeded(33), pos = new Float32Array(BUGS * 3), col = new Float32Array(BUGS * 3), seeds = [];
  for (let i = 0; i < BUGS; i++) {
    const s = [(rnd() - 0.5) * (COLS + 2), 0.25 + rnd() * 1.6, -ROWS / 2 - 1 + rnd() * (ROWS + 2), rnd() * 100, 0.6 + rnd() * 0.8];
    seeds.push(s);
    pos.set(s.slice(0, 3), i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  bugs = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.16, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  bugs.userData = { seeds, kind: 'pollen' };
  bugs.raycast = () => {};
  scene.add(bugs);
}

const FIREFLY = [0.85, 1, 0.45], POLLEN = [1, 0.96, 0.78];
function liveBugs(now) {
  const { seeds, kind } = bugs.userData, L = LIGHT[time], p = bugs.geometry.attributes.position, c = bugs.geometry.attributes.color;
  const t = calm ? 0 : now / 1000, fly = kind === 'fireflies';
  bugs.material.size = fly ? 0.16 : 0.09;
  seeds.forEach(([x, y, z, ph, sp], i) => {
    if (!calm) p.setXYZ(i, x + Math.sin(t * 0.3 * sp + ph) * 1.2, y + Math.sin(t * 0.7 * sp + ph * 2) * (fly ? 0.3 : 0.12) - (fly ? 0 : (t * 0.05 * sp + ph) % 1 * 0.3), z + Math.cos(t * 0.25 * sp + ph) * 1.0);
    // a firefly glows in slow pulses, dark between; pollen just catches the light
    const k = (fly ? Math.max(0, Math.sin(t * 1.3 * sp + ph)) ** 3 : 0.35 + 0.15 * Math.sin(t * 2 + ph)) * L.bugsI * (calm ? 0.7 : 1);
    const [r, g, b] = fly ? FIREFLY : POLLEN;
    c.setXYZ(i, r * k, g * k, b * k);
  });
  p.needsUpdate = true; c.needsUpdate = true;
}

/** Now and then a legendary crosses the sky over the forest, from the title's own round (a silhouette until it's
    yours), its shadow gliding over the Clearing while the sun's up. Never under reduced motion, like the title's. */
async function launchFlyer(now) {
  nextFly = now + 30000 + Math.random() * 20000;
  if (calm || !acts.dealFlyer) return;
  const { id, src, lit } = acts.dealFlyer();
  const m = await monBoard({ src, name: '', cry: id }, false);
  if (!running) return dispose(m.group);
  m.group.children[1].visible = false;
  m.board.castShadow = false;
  m.board.material.fog = false;
  if (!lit) m.board.material.color.set('#000');
  const shade = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0, depthWrite: false }));
  shade.rotation.x = -Math.PI / 2;
  shade.scale.set(1.8, 0.7, 1);
  shade.raycast = () => {};
  scene.add(m.group, shade);
  flyer = { m, shade, at: now, ms: 9000 + Math.random() * 3000, dir: Math.random() < 0.5 ? 1 : -1, high: 0.4 + Math.random() * 0.15, w: { facing: 'front' } };
}

const ray = { dir: null };

function liveFlyer(now, dt) {
  if (!flyer) { if (now > nextFly) launchFlyer(now); return; }
  const f = flyer, k = (now - f.at) / f.ms;
  if (k >= 1) { scene.remove(f.m.group, f.shade); dispose(f.m.group); f.shade.geometry.dispose(); f.shade.material.dispose(); flyer = null; return; }
  // its path is across the top of the view, high over the treetops (nearer the camera than the forest, or it would fly
  // through it); the board always faces the camera
  const x = f.dir * (-1.5 + 3 * k), y = f.high + Math.sin(k * Math.PI) * 0.08;
  ray.dir ??= new THREE.Vector3();
  ray.dir.set(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
  f.m.group.position.copy(camera.position).addScaledVector(ray.dir, camera.userData.dist * 0.55);
  f.m.group.position.y += Math.sin(now / 260) * 0.06;
  f.m.group.quaternion.copy(camera.quaternion);
  f.m.board.scale.set(f.dir > 0 ? -0.45 : 0.45, 0.45, 1);
  drawMon(f.m, f.w, dt);
  // the shadow runs a little ahead, over the ground near you
  const sh = Math.min(1, k * 1.2 + 0.05), up = time !== 'night';
  f.shade.position.set(camX + f.dir * (-14 + 28 * sh), 0.03, camZ - 1.5);
  f.shade.material.opacity = up ? 0.2 * Math.sin(Math.min(1, sh) * Math.PI) : 0;
}

/** Footsteps while walking; the Clearing's air (birds by day, crickets from dusk) while the hub shows. */
function sounds(now) {
  if (walker.path.length && now > stepAt) { stepAt = now + 270; playSound('grass-step'); }
  if (now < airAt) return;
  airAt = now + 2000;
  for (const name of AIRS) setLoop(name, running && name === LIGHT[time].air);
}
const quiet = () => AIRS.forEach(name => setLoop(name, false));

function aimCamera(x, z) {
  const d = camera.userData.dist;
  camera.position.set(x, LOOK_Y + Math.sin(PITCH) * d, z + Math.cos(PITCH) * d);
  camera.lookAt(x, LOOK_Y, z);
  camera.updateMatrixWorld();
}

function fitCamera(w, h) {
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), tanH = tanV * camera.aspect;
  const d = Math.max(ACROSS / 2 / tanH, DEPTH * Math.sin(PITCH) / 2 / tanV);
  camera.userData = { dist: d, half: d * tanH };
  // the furthest forward the view may look: where the ground's front edge sits on the bottom of the screen
  const edge = new THREE.Vector3();
  let lo = -ROWS, hi = ROWS;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    aimCamera(0, mid);
    if (edge.set(0, 0, ROWS / 2 + FRONT).project(camera).y < -1) lo = mid; else hi = mid;
  }
  camera.userData.front = lo;
  scene.fog.near = d + 2; scene.fog.far = d + 22;
}

function placeCamera(dt) {
  const { half, front } = camera.userData;
  const reachX = COLS / 2 + 1.2 - half, frontZ = front, backZ = tileZ(2);
  const wantX = reachX <= 0 ? 0 : Math.max(-reachX, Math.min(reachX, walker.x));
  const wantZ = backZ >= frontZ ? (backZ + frontZ) / 2 : Math.max(backZ, Math.min(frontZ, walker.z));
  const k = calm ? 1 : Math.min(1, dt / 1000 * 4);
  camX += (wantX - camX) * k; camZ += (wantZ - camZ) * k;
  aimCamera(camX, camZ);
}

function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  post.size(w, h);
  fitCamera(w, h);
}

const v3 = () => new THREE.Vector3();
function placeTags() {
  const w = view.clientWidth, h = view.clientHeight, p = v3();
  for (const t of tags) {
    p.copy(t.at).project(camera);
    const off = p.z > 1 || Math.abs(p.x) > 1.1 || Math.abs(p.y) > 1.1;
    t.el.hidden = off;
    if (!off) t.el.style.translate = `${Math.round((p.x + 1) / 2 * w)}px ${Math.round((1 - p.y) / 2 * h)}px`;
    t.el.classList.toggle('near', here === t.p && !walker.path.length);
    t.el.classList.toggle('show', Math.hypot(walker.x - tileX(t.p.step.x), walker.z - tileZ(t.p.step.y)) < SEEN);
  }
}

function frame(now) {
  if (!running) return;
  if (screen.hidden || !root.isConnected) { running = false; quiet(); return; }
  // under the device (its corner button opened it over the hub) the Clearing holds still rather than drawing unseen
  if (dexBtn.classList.contains('out') && document.getElementById('collection-screen')?.hidden === false) { last = 0; requestAnimationFrame(frame); return; }
  const dt = Math.min(100, now - (last || now));
  last = now;
  fpsLog.push(dt); if (fpsLog.length > 60) fpsLog.shift();

  if (walker.path.length) { here = null; if (walk(dt)) arrived(); }
  if (entering) walker.z = entering.z - Math.min(1, (now - entering.at) / 420) * 0.7;   // into the hollow
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, 0, walker.z);
  mon.board.position.y = bob;
  mon.board.scale.x = walker.flip ? -1 : 1;
  drawMon(mon, walker, dt);
  if (ring.material.opacity > 0) { ring.material.opacity = Math.max(0, ring.material.opacity - dt / 700); ring.scale.setScalar(1.25 - ring.material.opacity * 0.3); }
  if (!calm) paintGateArt(now);
  if (now - (frame.checked || 0) > 30000) { frame.checked = now; setTime(); }
  liveBugs(now);
  placeCamera(dt);
  liveFlyer(now, dt);
  sounds(now);
  placeTags();
  post.draw(scene, camera, (v3().set(walker.x, 0.6, walker.z).project(camera).y + 1) / 2);
  if (fpsEl) fpsEl.textContent = `${Math.round(1000 / (fpsLog.reduce((a, b) => a + b, 0) / fpsLog.length))} fps`;
  requestAnimationFrame(frame);
}

/* ---------- building and showing ---------- */

async function build() {
  THREE = await loadThree();
  root = document.createElement('div');
  root.className = 'hub';
  // it fades in once; shown again (back from the base, a run) it's simply there, or the screen under the title shows through
  root.addEventListener('animationend', () => root.classList.add('shown'), { once: true });
  root.innerHTML = `
    <canvas class="hub-view"></canvas>
    <div class="hub-tags"></div>
    <div class="hub-card" role="dialog" aria-live="polite" hidden><b class="hub-card-name"></b><p class="hub-card-line"></p><div class="hub-card-btns"></div></div>
    <button type="button" class="hub-dex" aria-label="Pokédex"><span class="hdx-top"><span class="hdx-lens"></span><span class="hdx-light"></span><span class="hdx-light"></span><span class="hdx-light"></span></span><span class="hdx-cover"><span class="hdx-led"></span></span></button>
    <button type="button" class="hub-help" aria-label="How to play"></button>
    <button type="button" class="hub-version" aria-label="Patch notes"></button>
    <span class="hub-fps" hidden></span>`;
  view = root.querySelector('.hub-view');
  card = root.querySelector('.hub-card');
  root.querySelector('.hub-help').append(smoothIcon('help'));
  root.querySelector('.hub-help').addEventListener('click', () => { playSound('confirm'); acts.onHelp(); });
  dexBtn = root.querySelector('.hub-dex');
  dexBtn.addEventListener('click', openDex);
  root.querySelector('.hub-version').addEventListener('click', () => document.getElementById('title-version')?.click());
  if (new URLSearchParams(location.search).has('fps')) { fpsEl = root.querySelector('.hub-fps'); fpsEl.hidden = false; }
  renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#9ccaf0', 30, 50);
  camera = new THREE.PerspectiveCamera(30, 1, 0.5, 140);
  hemi = new THREE.HemisphereLight('#fff', '#666', 1);
  sun = new THREE.DirectionalLight('#fff', 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
  sun.shadow.bias = -0.0015;
  sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun);
  // the lantern by the base's door and the Sky Pillar's doorway light their ground from dusk; made once and only dimmed,
  // so the hour changing never recompiles a shader
  for (const [colour, at, k] of [['#ffc070', [tileX(6) - 1.25, 2.4, tileZ(2) + 0.6], 1], ['#8ab0ff', [tileX(11), 1.1, tileZ(1) + 1.6], 0.7]]) {
    const l = new THREE.PointLight(colour, 0, 6, 1.6);
    l.position.set(...at);
    l.userData.k = k;
    lamps.push(l);
    scene.add(l);
  }
  ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 24), new THREE.MeshBasicMaterial({ color: '#fff6c0', transparent: true, opacity: 0, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  placeGroup = new THREE.Group();
  scene.add(ring, placeGroup);
  post = createPost(renderer);
  buildClearing();
  makeBugs();
  await gateReady();
  view.addEventListener('click', onTap);
  addEventListener('keydown', onKey);
  new ResizeObserver(() => resize()).observe(view);
}

/** Show the hub over the title (screen is #title-screen, acts what the places open). Resolves true once it's drawn,
    false where it can't be (no WebGL, Three.js offline), and the signs stay. */
export async function showHub(titleScreen, actions) {
  screen = titleScreen;
  acts = actions;
  calm = calmFx();
  try {
    built ??= build();
    await built;
  } catch { built = Promise.reject(); built.catch(() => {}); return false; }
  if (!root.isConnected) screen.prepend(root);
  buildPlaces();
  const mate = partner(getSave());
  if (!mon || mon.src !== mate.src) {
    if (mon) { dispose(mon.group); scene.remove(mon.group); }
    mon = await monBoard(mate);
    mon.board.rotation.x = -PITCH;
    scene.add(mon.group);
    mon.board.userData.who = { mon, w: walker };
  }
  if (!placed) { placed = true; walker.tile = START; walker.x = tileX(START.x); walker.z = tileZ(START.y); camX = walker.x; camZ = walker.z; }
  walker.path = []; aim = null; here = placeAt(walker.tile);
  if (inBase) leftBase();
  hideCard();
  dexBtn.classList.remove('out');
  dexNews();
  const tag = document.getElementById('title-version');
  root.querySelector('.hub-version').textContent = tag?.textContent ?? '';
  nextFly = performance.now() + 6000;
  airAt = 0;
  setTime(true);
  resize();
  screen.classList.add('hub-on');
  if (!running) { running = true; last = 0; requestAnimationFrame(frame); }
  return true;
}

/** Back to the signs (Settings' Title screen). */
export function hideHub() {
  running = false;
  quiet();
  screen?.classList.remove('hub-on');
  root?.remove();
}
