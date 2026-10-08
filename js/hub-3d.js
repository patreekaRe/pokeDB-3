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
import { smoothIcon, roundKey } from './smooth-icons.js';
import { setHpBar } from './ui.js';

const COLS = 13, ROWS = 12;   // the walkable grid, tile (0, 0) at the back left
const M = 4, FRONT = 1;       // grass and forest round it (tiles): back and sides, and in front where the trail leaves
const TP = 16;                // painted pixels a tile
const START = { x: 6, y: 8 };
const PITCH = 0.6, LOOK_Y = 0.6;   // Octopath's low angle; Pokémon lean back by all of it (showHub()), so they face the camera unsquashed
const ACROSS = 8;             // tiles the view shows across at least; an upright phone pans over the rest
const DEPTH = 15;             // and rows deep at least, on a wide screen
const SEEN = 2.6;             // how near (tiles) a place's doorstep you walk before its keys are on the bar

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
const BUGS = 44;

// the paths, as centre lines between tile centres; the plaza round START
const PATHS = [[[6, 3], [6, ROWS + FRONT + 1]], [[1, 4], [11, 4]], [[1, 4], [1, 3]], [[11, 4], [11, 3]], [[1, 10], [6, 10]]];

let THREE, renderer, scene, camera, post, root, view, screen, acts, dexBtn;
let hemi, sun, ring, ground, forest, placeGroup;
let mon = null, walker = { x: 0, z: 0, tile: START, path: [], facing: 'front', flip: false, hop: 0 };
let places = [], blocked = new Set(), aim = null, here = null, card, bar, barKey = null, barCoins = null, saved = null;
let glowMats = [], lamps = [], bugs = null, flyer = null, nextFly = 0, stepAt = 0, airAt = 0, tree = null, inBase = false, entering = null;
let stop = null, calm = false, time = '', running = false, last = 0, fpsLog = [], camX = 0, camZ = 0, fpsEl = null, gateArt = null;
let built = null;   // the promise of the first build
let placed = false; // the partner has been put on the plaza once
let held = false;   // drawn behind the shut Pokédex, waiting for enterHub(): no partner, no keys, no taps
let arriving = false;   // walking in from the bottom of the screen (enterHub())
let showing = null; // a showHub() under way, so two calls at once never build two partners

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
  // the plaza is a Poké Ball worn into the dirt, only just there: a reddish top half, a darker band, a pale button ring
  const mix = (c, t, k) => c.map((n, i) => Math.round(n + (t[i] - n) * k));
  const pokePlaza = (c, du, dv, wob) => {
    const r = Math.hypot(du, dv);
    if (r > 1.45 + wob) return c;
    if (Math.abs(r - 0.4) < 0.07) return mix(c, dirt[3], 0.7);
    if (r < 0.33) return mix(c, dirt[0], 0.5);
    if (Math.abs(dv - wob * 0.3) < 0.08) return mix(c, dirt[3], 0.6);
    return dv < 0 ? mix(c, [196, 84, 64], 0.38) : mix(c, dirt[0], 0.25);
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
      c = pokePlaza(c, u - START.x, v - START.y, wob);
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

const strokeOn = (g, col, w, path) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); path(); g.stroke(); };

/** An arched opening's outline (a round top on straight sides), as a path on `g`. */
function arch(g, x, w, top, bot) {
  g.beginPath(); g.moveTo(x, bot); g.lineTo(x, top + w / 2); g.arc(x + w / 2, top + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, bot); g.closePath();
}

function leaf(g, x, y, a, s, col) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 0.5, -s * 0.38, s, 0); g.quadraticCurveTo(s * 0.5, s * 0.38, 0, 0); g.fill();
  g.restore();
}

function tuft(g, x, y, n, rnd) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (rnd() - 0.5) * 1.5, l = 1.6 + rnd() * 2.4, x0 = x + (rnd() - 0.5) * 2.4;
    strokeOn(g, P.blade[i % 3], 0.42, () => { g.moveTo(x0, y); g.quadraticCurveTo(x0 + Math.cos(a) * l * 0.3, y + Math.sin(a) * l * 0.6, x0 + Math.cos(a) * l, y + Math.sin(a) * l); });
  }
}

function blossom(g, x, y, r, petal, heart) {
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.fillStyle = petal; g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = heart; g.beginPath(); g.arc(x, y, r * 0.6, 0, Math.PI * 2); g.fill();
}

/** The Safari Zone's gate, smooth like the notice boards (the user's call, 2026-10-08): two log posts lashed with rope on
    stone feet, a tiled red roof turned up at its ends with paper lanterns hanging off it, the green SAFARI ZONE board on
    chains; shut, a rope across it with a CLOSED tag. */
function safariArt(open) {
  const { c, g, fill, rr, lin, shine } = fine(60, 56, 10), rnd = seeded(7), glow = shine();
  const W = ['#e8bc84', '#c08a50', '#94643a', '#5a3a1c'];
  for (const x of [7, 47]) {   // the posts: peeled logs, their grain and a knot, a rope lashing, a stone foot
    rr(x, 12, 6, 42, 1.4, lin(x, 0, x + 6, 0, [W[0], W[1], W[1], W[2], W[3]]));
    for (let i = 0; i < 11; i++) {
      const y = 16 + rnd() * 34, x0 = x + 1 + rnd() * 3.6;
      strokeOn(g, 'rgba(70,40,16,0.4)', 0.28, () => { g.moveTo(x0, y); g.quadraticCurveTo(x0 + 0.6, y + 1.6, x0 + 0.1, y + 3.4); });
    }
    fill('rgba(70,40,16,0.55)', () => g.ellipse(x + 2.4 + rnd() * 1.2, 30 + rnd() * 14, 0.7, 1.1, 0, 0, Math.PI * 2));
    for (let i = 0; i < 4; i++) rr(x - 0.4, 17 + i * 1.05, 6.8, 0.9, 0.45, lin(0, 17 + i * 1.05, 0, 17.9 + i * 1.05, ['#f4e2aa', '#b8965a']));
    rr(x - 1.6, 51.5, 9.2, 4.5, 1.6, lin(0, 51.5, 0, 56, [P.stone[0], P.stone[1], P.stone[2]]));
    rr(x - 1, 51.9, 8, 0.7, 0.35, 'rgba(255,255,255,0.5)');
  }
  // ivy up the left post
  const ivy = [];
  for (let y = 54; y > 26; y -= 2) ivy.push([8.2 + Math.sin(y * 0.5) * 1.6, y]);
  strokeOn(g, '#3a7a30', 0.4, () => { g.moveTo(...ivy[0]); ivy.forEach(p => g.lineTo(...p)); });
  ivy.forEach(([x, y], i) => leaf(g, x, y, i % 2 ? -0.5 : Math.PI + 0.5, 1.6 + rnd() * 0.6, P.moss[i % 2]));

  const roof = () => {
    g.moveTo(-0.2, 9.6); g.quadraticCurveTo(3, 12.4, 9, 12.4); g.lineTo(51, 12.4); g.quadraticCurveTo(57, 12.4, 60.2, 9.6);
    g.lineTo(56.5, 9.4); g.lineTo(49, 3.2); g.quadraticCurveTo(30, 1.6, 11, 3.2); g.lineTo(3.5, 9.4); g.closePath();
  };
  fill(lin(0, 2, 0, 12.4, ['#f07058', '#d84838', '#a83024']), roof);
  g.save(); g.beginPath(); roof(); g.clip();
  for (let r = 0; r < 4; r++) {   // courses of round tiles
    const y = 4.6 + r * 2.1;
    strokeOn(g, 'rgba(110,24,16,0.55)', 0.35, () => { g.moveTo(0, y + 0.8); g.quadraticCurveTo(30, y - 0.6, 60, y + 0.8); });
    for (let x = 1 + (r % 2) * 1.5; x < 60; x += 3) strokeOn(g, 'rgba(255,190,160,0.4)', 0.4, () => { g.moveTo(x, y - 1.2); g.lineTo(x + 0.3, y + 0.4); });
  }
  g.fillStyle = 'rgba(80,16,10,0.5)'; g.fillRect(0, 11.1, 60, 1.5);
  g.restore();
  rr(10, 1.8, 40, 2, 1, lin(0, 1.8, 0, 3.8, ['#c84030', '#8a2418']));   // the ridge, a brass finial on it
  fill(lin(0, 0, 0, 2.8, ['#fff2a0', '#e0a830', '#a87018']), () => g.arc(30, 1.5, 1.3, 0, Math.PI * 2));
  for (const x of [1, 59]) fill('#f8d048', () => g.arc(x, 9.6, 0.8, 0, Math.PI * 2));

  rr(2, 12.2, 56, 3.6, 1, lin(0, 12.2, 0, 15.8, [W[0], W[1], W[2]]));   // the beam, pegged at its ends
  rr(2.4, 12.4, 55.2, 0.6, 0.3, 'rgba(255,240,210,0.5)');
  for (const x of [4, 56]) fill(W[3], () => g.arc(x, 14, 0.7, 0, Math.PI * 2));

  for (const x of [2.6, 57.4]) {   // paper lanterns, lit at dusk
    strokeOn(g, '#3a2410', 0.3, () => { g.moveTo(x, 12.6); g.lineTo(x, 17.2); });
    rr(x - 1.3, 17, 2.6, 0.8, 0.35, '#3a2410');
    const body = (gg) => { gg.beginPath(); gg.ellipse(x, 20.4, 2.1, 2.9, 0, 0, Math.PI * 2); };
    g.fillStyle = lin(x - 2, 0, x + 2, 0, ['#ffc070', '#f86838', '#b83020']); body(g); g.fill();
    glow.fillStyle = '#ff9850'; body(glow); glow.fill();
    for (const rx of [0.7, 1.5]) strokeOn(g, 'rgba(120,30,10,0.45)', 0.2, () => g.ellipse(x, 20.4, rx, 2.9, 0, 0, Math.PI * 2));
    for (const y of [19, 21.8]) strokeOn(g, 'rgba(120,30,10,0.35)', 0.2, () => { g.moveTo(x - 1.9, y); g.lineTo(x + 1.9, y); });
    fill('rgba(255,245,210,0.6)', () => g.ellipse(x - 0.8, 19.4, 0.5, 1, 0, 0, Math.PI * 2));
    rr(x - 1.1, 23.1, 2.2, 0.7, 0.3, '#3a2410');
    strokeOn(g, '#f8d048', 0.35, () => { g.moveTo(x, 23.8); g.lineTo(x, 25.6); });
  }

  for (const x of [19, 41]) for (let y = 16; y < 18.4; y += 0.85) strokeOn(g, '#6a6a74', 0.26, () => g.ellipse(x, y + 0.4, 0.34, 0.5, 0, 0, Math.PI * 2));
  rr(14, 18, 32, 14.5, 1.8, lin(0, 18, 0, 32.5, [W[1], W[3]]));   // the board
  rr(15.2, 19.2, 29.6, 12.1, 1.2, lin(0, 19.2, 0, 31.3, ['#5cc068', '#3a9a48', '#2a7a38']));
  rr(15.6, 19.5, 28.8, 1.4, 0.7, 'rgba(255,255,255,0.22)');
  for (const [x, y] of [[15.9, 19.9], [44.1, 19.9], [15.9, 30.6], [44.1, 30.6]]) fill('#d8b070', () => g.arc(x, y, 0.42, 0, Math.PI * 2));
  leaf(g, 16.4, 30.4, -0.9, 3.4, '#2a7a38'); leaf(g, 16.4, 30.4, -0.3, 2.8, '#48a044');
  leaf(g, 43.6, 30.4, Math.PI + 0.9, 3.4, '#2a7a38'); leaf(g, 43.6, 30.4, Math.PI + 0.3, 2.8, '#48a044');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 6.6px "Trebuchet MS", "Arial Black", sans-serif';
  g.fillStyle = 'rgba(16,60,24,0.65)'; g.fillText('SAFARI', 30.35, 24.55);
  g.fillStyle = '#fbf8e4'; g.fillText('SAFARI', 30, 24.2);
  g.font = '800 2.8px "Trebuchet MS", sans-serif';
  g.fillStyle = '#f8d848'; g.fillText('Z O N E', 30, 29);
  for (const x of [22.4, 37.6]) {   // pawprints either side of ZONE
    fill('rgba(248,216,72,0.85)', () => g.ellipse(x, 29.4, 0.75, 0.6, 0, 0, Math.PI * 2));
    for (const dx of [-0.75, 0, 0.75]) fill('rgba(248,216,72,0.85)', () => g.arc(x + dx, 28.3 - (dx ? 0 : 0.3), 0.32, 0, Math.PI * 2));
  }

  for (const x of [4, 15, 45, 56]) tuft(g, x, 56, 8, rnd);
  for (const [x, y, p] of [[3, 55, '#ffffff'], [16.5, 55.2, '#f8e048'], [44, 55, '#f8a0c8'], [57, 55.3, '#ffffff']]) blossom(g, x, y, 0.45, p, '#f89830');

  if (!open) {   // a rope across, a CLOSED tag hanging off it
    const rope = () => { g.moveTo(13, 34); g.quadraticCurveTo(30, 40.8, 47, 34); };
    strokeOn(g, '#f4ecd8', 0.95, rope);
    g.setLineDash([1.1, 1.1]); strokeOn(g, '#e04030', 0.95, rope); g.setLineDash([]);
    for (const x of [13, 47]) fill('#9a9aa6', () => g.arc(x, 34, 0.6, 0, Math.PI * 2));
    strokeOn(g, '#5a3a1c', 0.22, () => { g.moveTo(27, 38.4); g.lineTo(30, 37.4); g.lineTo(33, 38.4); });
    rr(26, 38.2, 8, 3.8, 0.7, lin(0, 38.2, 0, 42, [W[0], W[1]]));
    g.font = '900 1.9px "Trebuchet MS", sans-serif'; g.fillStyle = '#a02818'; g.fillText('CLOSED', 30, 40.2);
  }
  return c;
}

/** The Sky Pillar's stone, smooth (2026-10-08): weathered blocks, a carved band of runes every few storeys, arched windows
    lit at night, ivy and moss up from the foot; the front face has its great arched door under Rayquaza's jade ring. */
function pillarArt(front) {
  const W = 42, H = 192, { c, g, fill, rr, lin, shine } = fine(W, H, 8), rnd = seeded(front ? 3 : 4), glow = shine();
  const door = { x: 9, w: 24, top: H - 36 };
  g.fillStyle = '#8e887a'; g.fillRect(0, 0, W, H);
  for (let row = 0; row * 5 < H; row++) {   // the blocks, each its own shade, lit on top, a crack or pits here and there
    const y = row * 5, off = row % 2 ? 4.5 : 0;
    for (let x = -off; x < W; x += 9) {
      const n = rnd();
      rr(x + 0.3, y + 0.3, 8.4, 4.4, 0.8, n > 0.82 ? '#ddd8ca' : n > 0.3 ? '#c4beb0' : '#aaa496');
      rr(x + 0.6, y + 0.45, 7.8, 0.7, 0.35, 'rgba(255,255,255,0.3)');
      rr(x + 0.6, y + 3.8, 7.8, 0.7, 0.35, 'rgba(60,56,48,0.2)');
      if (rnd() < 0.16) {
        const cx = x + 2 + rnd() * 5;
        strokeOn(g, 'rgba(60,56,48,0.55)', 0.22, () => { g.moveTo(cx, y + 0.5); g.lineTo(cx + 0.8, y + 2); g.lineTo(cx + 0.3, y + 4.4); });
      }
      for (let i = rnd() < 0.3 ? 3 : 0; i > 0; i--) fill('rgba(70,66,58,0.4)', () => g.arc(x + 1 + rnd() * 7, y + 1 + rnd() * 3, 0.25, 0, Math.PI * 2));
    }
  }
  g.fillStyle = lin(0, 0, W, 0, ['rgba(255,250,235,0.2)', 'rgba(0,0,0,0)', 'rgba(20,24,40,0.24)']); g.fillRect(0, 0, W, H);
  g.fillStyle = lin(0, H - 60, 0, H, ['rgba(40,70,30,0)', 'rgba(40,70,30,0.3)']); g.fillRect(0, H - 60, W, 60);
  for (const y of [0, 40, 90, 140]) {   // the carved bands, runes in them
    rr(-1, y, W + 2, 5, 0.6, lin(0, y, 0, y + 5, ['#ece8dc', '#c8c2b4', '#958f80']));
    g.fillStyle = 'rgba(30,30,40,0.3)'; g.fillRect(0, y + 5, W, 0.8);
    for (let i = 0; i < 7; i++) {
      const x = 3 + i * 6, m = y + 2.5;
      if (i % 2) strokeOn(g, '#7a7468', 0.4, () => g.arc(x, m, 1.1, 0, Math.PI * 2));
      else fill('#7a7468', () => { g.moveTo(x, m - 1.4); g.lineTo(x + 1.2, m); g.lineTo(x, m + 1.4); g.lineTo(x - 1.2, m); g.closePath(); });
    }
  }
  for (const y of [18, 62, 112, 160]) {   // arched windows, a cold light in them after dark
    if (front && y > door.top - 12) continue;
    g.fillStyle = lin(0, y, 0, y + 14, ['#ece8dc', '#a8a294']); arch(g, 17.2, 7.6, y - 1.4, y + 14); g.fill();
    g.fillStyle = lin(0, y, 0, y + 13, ['#3a4a7a', '#1c2440', '#141a30']); arch(g, 18.6, 4.8, y, y + 13); g.fill();
    glow.fillStyle = lin(0, y, 0, y + 13, ['#5a70c0', '#2a3868']); arch(glow, 18.6, 4.8, y, y + 13); glow.fill();
    rr(16.6, y + 13, 8.8, 1.5, 0.5, lin(0, y + 13, 0, y + 14.5, ['#ece8dc', '#958f80']));
  }
  for (let v = 0; v < 4; v++) {   // ivy climbing from the foot, clear of the door
    let x = front ? (v % 2 ? 2 + rnd() * 4 : 36 + rnd() * 4) : 2 + rnd() * 38, y = H;
    const top = H - 30 - rnd() * 80, pts = [[x, y]];
    while (y > top) { x = Math.max(1, Math.min(W - 1, x + (rnd() - 0.5) * 2.6)); y -= 2.4; pts.push([x, y]); }
    strokeOn(g, '#3a6a2a', 0.45, () => { g.moveTo(...pts[0]); pts.forEach(p => g.lineTo(...p)); });
    pts.forEach(([px, py], i) => leaf(g, px, py, i % 2 ? -0.5 - rnd() * 0.4 : Math.PI + 0.5 + rnd() * 0.4, 1.5 + rnd() * 0.8, i % 3 ? P.moss[1] : P.moss[0]));
  }
  for (let i = 0; i < 14; i++) fill(`rgba(${rnd() < 0.5 ? '90,154,64' : '138,200,88'},0.45)`, () => g.ellipse(rnd() * W, H - rnd() * 10, 1.5 + rnd() * 2.5, 0.8 + rnd(), 0, 0, Math.PI * 2));
  if (front) {
    const { x, w, top } = door, mid = x + w / 2, ry = top + w / 2;
    g.fillStyle = lin(0, top - 4, 0, H, ['#f0ece0', '#c8c2b4']); arch(g, x - 3.4, w + 6.8, top - 3.4, H); g.fill();
    for (let i = 0; i <= 10; i++) {   // the arch's voussoirs and its jambs' blocks
      const a = Math.PI + i / 10 * Math.PI;
      strokeOn(g, '#8e887a', 0.32, () => { g.moveTo(mid + Math.cos(a) * w / 2, ry + Math.sin(a) * w / 2); g.lineTo(mid + Math.cos(a) * (w / 2 + 3.4), ry + Math.sin(a) * (w / 2 + 3.4)); });
    }
    for (let y = ry + 4; y < H; y += 5) for (const jx of [x - 3.4, x + w]) strokeOn(g, '#8e887a', 0.32, () => { g.moveTo(jx, y); g.lineTo(jx + 3.4, y); });
    rr(mid - 2, top - 4, 4, 4.6, 0.6, lin(0, top - 4, 0, top + 0.6, ['#fffaf0', '#b8b2a4']));   // the keystone
    g.fillStyle = lin(0, top, 0, H, ['#0a0e1c', '#141a30', '#26346a']); arch(g, x, w, top, H); g.fill();
    glow.fillStyle = lin(0, top, 0, H, ['#121a34', '#24305e', '#4a68c8']); arch(glow, x, w, top, H); glow.fill();
    for (let i = 0; i < 8; i++) {   // the stair inside, lit from above
      const y = H - 5 - i * 3.6, inset = i * 1.15, a = 0.95 - i * 0.1;
      rr(x + 3 + inset, y, w - 6 - inset * 2, 1.1, 0.4, `rgba(120,150,236,${a})`);
      glow.fillStyle = `rgba(150,180,255,${a})`; glow.beginPath(); glow.roundRect(x + 3 + inset, y, w - 6 - inset * 2, 1.1, 0.4); glow.fill();
    }
    rr(x - 5, H - 2.4, w + 10, 2.4, 0.6, lin(0, H - 2.4, 0, H, ['#e4e0d4', '#a8a294']));   // the threshold steps
    rr(x - 2.5, H - 4.4, w + 5, 2.2, 0.6, lin(0, H - 4.4, 0, H - 2.2, ['#f0ece0', '#b8b2a4']));
    const ey = top - 9.2;   // Rayquaza's ring over the door, set into the band
    fill(lin(0, ey - 4, 0, ey + 4, ['#f0ece0', '#958f80']), () => g.arc(mid, ey, 4.4, 0, Math.PI * 2));
    fill(lin(mid - 3, ey - 3, mid + 3, ey + 3, ['#8ae8b8', '#3aa878', '#1a6a48']), () => g.arc(mid, ey, 3.5, 0, Math.PI * 2));
    glow.fillStyle = '#3ac088'; glow.beginPath(); glow.arc(mid, ey, 3.5, 0, Math.PI * 2); glow.fill();
    const coil = (gg, col, wd) => strokeOn(gg, col, wd, () => { gg.moveTo(mid - 2, ey - 2.2); gg.bezierCurveTo(mid + 3, ey - 2.4, mid - 3, ey + 2.4, mid + 2, ey + 2.2); });
    coil(g, '#f8f0c0', 0.65); coil(glow, '#fff8d0', 0.65);
    fill('#f8f0c0', () => g.arc(mid - 2, ey - 2.2, 0.55, 0, Math.PI * 2));
  }
  return c;
}

/** The Ancient Tree, smooth (2026-10-08): a crown of hundreds of leaf clumps lit from the top left with blossoms in it and
    vines hanging off it, a ridged trunk flaring into arching roots, and the Secret Base's plank door in the hollow between
    them, a round window and a lantern lit at dusk; mushrooms, ferns and grass at its foot. Open, the door's swung in on a
    warm room. */
function ancientArt(open = false) {
  const W = 128, H = 160, { c, g, fill, rr, lin, shine } = fine(W, H, 8), rnd = seeded(11), glow = shine();
  const B = ['#8a6844', '#6a4c30', '#4a3420', '#26180c'], WD = ['#e0b07c', '#c08a50', '#94643a', '#5a3a1c'];
  const root = (x0, x1, y1, t) => {   // a tapering root out of the trunk's foot, arching as it goes
    const at = (k) => [x0 + (x1 - x0) * k, 128 + (y1 - 128) * k * k - Math.sin(k * Math.PI) * 9], up = [], down = [];
    for (let k = 0; k <= 1.001; k += 0.05) { const [x, y] = at(k), r = t * (1 - k * 0.75); up.push([x, y - r]); down.push([x, y + r]); }
    fill(lin(0, 118, 0, H, [B[0], B[1], B[2]]), () => { g.moveTo(...up[0]); up.forEach(p => g.lineTo(...p)); down.reverse().forEach(p => g.lineTo(...p)); g.closePath(); });
    strokeOn(g, 'rgba(255,220,170,0.28)', t * 0.35, () => { g.moveTo(up[1][0], up[1][1] + t * 0.3); up.slice(2, 16).forEach(([x, y], i) => g.lineTo(x, y + t * 0.3 * (1 - i / 16))); });
  };
  root(50, 4, 158, 7.5); root(56, 24, 159.5, 5.5); root(78, 124, 158, 7.5); root(72, 104, 159.5, 5.5);
  root(60, 44, 159.5, 4); root(68, 86, 159.5, 4);
  const trunk = () => { g.moveTo(49, 54); g.bezierCurveTo(47, 100, 44, 130, 27, 160); g.lineTo(101, 160); g.bezierCurveTo(84, 130, 81, 100, 79, 54); g.closePath(); };
  fill(lin(28, 0, 100, 0, [B[0], B[0], B[1], B[2], B[3]]), trunk);
  g.save(); g.beginPath(); trunk(); g.clip();
  for (let i = 0; i < 56; i++) {   // bark ridges following the flare
    const u = rnd(), xt = 49 + u * 30, xb = 27 + u * 74;
    g.setLineDash([4 + rnd() * 14, 1 + rnd() * 4]);
    strokeOn(g, u < 0.3 ? 'rgba(255,224,176,0.2)' : 'rgba(30,18,8,0.42)', 0.4 + rnd() * 0.8, () => { g.moveTo(xt, 54); g.bezierCurveTo(xt, 100, xt + (xb - xt) * 0.2, 130, xb, 160); });
  }
  g.setLineDash([]);
  fill(B[3], () => g.ellipse(74, 94, 2.2, 3.2, 0, 0, Math.PI * 2));   // a knot hole
  strokeOn(g, B[0], 0.6, () => g.ellipse(74, 94, 3, 4, 0, Math.PI * 0.9, Math.PI * 1.9));
  g.fillStyle = lin(0, 54, 0, 92, ['rgba(12,24,8,0.7)', 'rgba(12,24,8,0)']); g.fillRect(0, 54, W, 38);
  g.restore();
  for (let i = 0; i < 26; i++) fill(`rgba(${rnd() < 0.5 ? '90,154,64' : '138,200,88'},0.55)`, () => g.ellipse(30 + rnd() * 68, 128 + rnd() * 30, 1.5 + rnd() * 3, 0.7 + rnd() * 0.8, 0, 0, Math.PI * 2));

  const dx = 52, dw = 24, dtop = 113, dbot = 157.5;   // the door in its hollow
  g.fillStyle = B[3]; arch(g, dx - 2.4, dw + 4.8, dtop - 2.4, dbot + 1); g.fill();
  strokeOn(g, 'rgba(255,220,170,0.3)', 0.7, () => g.arc(dx + dw / 2, dtop + dw / 2, dw / 2 + 2, Math.PI * 1.05, Math.PI * 1.6));
  if (open) {
    g.fillStyle = lin(0, dtop, 0, dbot, ['#120804', '#2a180a', '#6a3c18']); arch(g, dx, dw, dtop, dbot); g.fill();
    fill('rgba(255,190,110,0.45)', () => g.ellipse(dx + dw / 2, dbot - 2, dw / 2 - 1, 4, 0, 0, Math.PI * 2));
    fill(lin(dx, 0, dx + 4, 0, [WD[2], WD[1]]), () => { g.moveTo(dx, dtop + 10); g.lineTo(dx + 4, dtop + 13); g.lineTo(dx + 4, dbot - 1.5); g.lineTo(dx, dbot); g.closePath(); });
  } else {
    g.save(); arch(g, dx, dw, dtop, dbot); g.clip();
    for (let i = 0; i < 5; i++) {   // planks, their grain, two iron straps
      const x = dx + i * 4.8;
      rr(x + 0.15, dtop, 4.5, dbot - dtop, 0.6, lin(x, 0, x + 4.8, 0, [WD[0], WD[1], WD[2]]));
      for (let j = 0; j < 4; j++) { const gx = x + 1 + rnd() * 2.6, gy = dtop + 4 + rnd() * 36; strokeOn(g, 'rgba(70,40,16,0.35)', 0.22, () => { g.moveTo(gx, gy); g.quadraticCurveTo(gx + 0.5, gy + 2, gx, gy + 4); }); }
    }
    for (const y of [dtop + 17, dbot - 11]) {
      rr(dx, y, dw, 1.8, 0.4, lin(0, y, 0, y + 1.8, ['#6a6a76', '#2e2e38']));
      for (let x = dx + 2.4; x < dx + dw; x += 4.8) fill('#a8a8b4', () => g.arc(x, y + 0.9, 0.35, 0, Math.PI * 2));
    }
    g.restore();
    const wy = dtop + 8.5;   // a round window, warm light behind it
    fill(WD[3], () => g.arc(dx + dw / 2, wy, 3.6, 0, Math.PI * 2));
    fill(lin(0, wy - 3, 0, wy + 3, ['#fff0b8', '#f8c860', '#e09030']), () => g.arc(dx + dw / 2, wy, 2.8, 0, Math.PI * 2));
    glow.fillStyle = '#ffd070'; glow.beginPath(); glow.arc(dx + dw / 2, wy, 2.8, 0, Math.PI * 2); glow.fill();
    strokeOn(g, WD[3], 0.45, () => { g.moveTo(dx + dw / 2 - 2.8, wy); g.lineTo(dx + dw / 2 + 2.8, wy); g.moveTo(dx + dw / 2, wy - 2.8); g.lineTo(dx + dw / 2, wy + 2.8); });
    fill('#3a3a44', () => g.arc(70.5, 138, 1.1, 0, Math.PI * 2));   // the ring handle
    strokeOn(g, '#e0b848', 0.4, () => g.arc(70.5, 139.4, 1.3, 0, Math.PI * 2));
  }
  fill(lin(0, 156, 0, 160, [P.stone[0], P.stone[2]]), () => g.ellipse(64, 158.4, 9, 1.6, 0, 0, Math.PI * 2));   // a stepping stone

  strokeOn(g, B[2], 1.3, () => { g.moveTo(47.5, 103); g.quadraticCurveTo(43, 102.6, 41.6, 105.4); });   // the lantern, on a hook
  strokeOn(g, '#3a3a44', 0.3, () => { g.moveTo(41.6, 105.4); g.lineTo(41.6, 108.6); });
  fill('#2e2e38', () => { g.moveTo(39.6, 108.4); g.lineTo(43.6, 108.4); g.lineTo(44.8, 110.4); g.lineTo(38.4, 110.4); g.closePath(); });
  rr(39, 110.4, 5.2, 6.6, 0.6, lin(0, 110.4, 0, 117, ['#fff8d0', '#f8d060', '#e0a030']));
  glow.fillStyle = '#ffe080'; glow.beginPath(); glow.roundRect(39, 110.4, 5.2, 6.6, 0.6); glow.fill();
  for (const x of [39, 41.6, 44.2]) strokeOn(g, '#2e2e38', 0.35, () => { g.moveTo(x, 110.4); g.lineTo(x, 117); });
  rr(38.4, 116.8, 6.4, 1.3, 0.4, '#2e2e38');

  const lobes = [[64, 40, 36], [28, 58, 24], [100, 58, 24], [44, 26, 22], [86, 26, 22], [64, 15, 17], [16, 74, 12], [112, 74, 12]];
  for (const [x, y, r] of lobes) fill(P.trees[3], () => g.arc(x, y, r + 1.2, 0, Math.PI * 2));
  for (const [x, y, r] of lobes) fill(P.trees[2], () => g.arc(x, y, r, 0, Math.PI * 2));
  const clumps = [];
  for (let i = 0; i < 420; i++) {   // leaf clumps, lit from the top left, the lit ones on top
    const [bx, by, br] = lobes[Math.floor(rnd() * lobes.length)], a = rnd() * Math.PI * 2, rad = 2.6 + rnd() * 3.6, d = Math.sqrt(rnd()) * (br - rad * 0.6);
    const x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d;
    const l = -((x - bx) / br * 0.5 + (y - by) / br * 0.8) - (y - 40) / 90 + (rnd() - 0.5) * 0.35;
    clumps.push([l, x, y, rad]);
  }
  clumps.sort((p, q) => p[0] - q[0]);
  const shade = (l) => l > 0.75 ? ['#a8e078', '#6cc058'] : l > 0.35 ? ['#7cc860', '#48a044'] : l > -0.1 ? ['#5aac4a', '#2e7c34'] : ['#3a8a3a', '#1c5a26'];
  for (const [l, x, y, rad] of clumps) {
    const [lit, dark] = shade(l);
    fill(dark, () => g.arc(x + rad * 0.18, y + rad * 0.22, rad, 0, Math.PI * 2));
    fill(lit, () => g.arc(x, y, rad * 0.88, 0, Math.PI * 2));
    if (l > 0.2) fill('rgba(255,255,220,0.22)', () => g.arc(x - rad * 0.3, y - rad * 0.35, rad * 0.35, 0, Math.PI * 2));
  }
  for (const [l, x, y] of clumps.slice(-90)) if (rnd() < 0.5) leaf(g, x + (rnd() - 0.5) * 4, y + (rnd() - 0.5) * 4, -2.4 + rnd() * 1.2, 1.6 + rnd(), l > 0.75 ? '#c8f090' : '#8ad468');
  for (let i = 0; i < 26; i++) {   // blossoms in the light
    const [, x, y] = clumps[clumps.length - 1 - Math.floor(rnd() * 160)];
    blossom(g, x + (rnd() - 0.5) * 3, y + (rnd() - 0.5) * 3, 0.55, rnd() < 0.5 ? '#ffffff' : '#f8c8e0', '#f8d848');
  }
  for (const [x, y, n] of [[18, 84, 12], [30, 80, 16], [42, 74, 10], [86, 74, 12], [98, 80, 18], [110, 84, 10]]) {   // vines hanging off it
    const pts = [];
    for (let k = 0; k <= n; k += 1.5) pts.push([x + Math.sin(k * 0.6 + x) * 0.8, y + k]);
    strokeOn(g, '#2e6a2a', 0.4, () => { g.moveTo(...pts[0]); pts.forEach(p => g.lineTo(...p)); });
    pts.forEach(([px, py], i) => i && leaf(g, px, py, i % 2 ? 0.6 : Math.PI - 0.6, 1.4, i % 2 ? P.moss[0] : P.moss[1]));
  }

  for (const [x, s] of [[20, 1], [24, 0.7], [108, 1.1], [104, 0.75]]) {   // mushrooms by the roots
    rr(x - 0.6 * s, 157 - 3 * s, 1.2 * s, 3 * s, 0.4 * s, '#f4ecd8');
    fill(lin(0, 154 - 4 * s, 0, 157 - 3 * s, ['#f86848', '#c02818']), () => g.ellipse(x, 157 - 3 * s, 2.4 * s, 1.8 * s, 0, Math.PI, 0));
    for (const ddx of [-1.1, 0.4, 1.4]) fill('#fff8f0', () => g.arc(x + ddx * s, 156.2 - 3.8 * s + Math.abs(ddx) * 0.5 * s, 0.35 * s, 0, Math.PI * 2));
  }
  for (const [x, flip] of [[34, -1], [94, 1]]) {   // ferns
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI / 2 + (f - 2) * 0.42 * flip, len = 7 + (f === 2 ? 2 : 0), ex = x + Math.cos(a) * len, ey = 160 + Math.sin(a) * len;
      strokeOn(g, '#3a8a32', 0.35, () => { g.moveTo(x, 160); g.quadraticCurveTo(x + Math.cos(a) * len * 0.5, 160 + Math.sin(a) * len * 0.8, ex, ey); });
      for (let k = 0.25; k < 1; k += 0.15) {
        const px = x + (ex - x) * k, py = 160 + (ey - 160) * k + Math.sin(k * Math.PI) * -1;
        leaf(g, px, py, a - 1.3, 1.6 * (1.1 - k), '#58b04a'); leaf(g, px, py, a + 1.3, 1.6 * (1.1 - k), '#48a044');
      }
    }
  }
  for (const x of [8, 26, 46, 82, 100, 120]) tuft(g, x, 160, 9, rnd);
  for (const [x, p] of [[12, '#ffffff'], [40, '#f8e048'], [88, '#f8a0c8'], [116, '#b0a0f8']]) blossom(g, x, 159.2, 0.55, p, '#f89830');
  return c;
}

const KIT = { white: '#f6f8fb', pale: '#e2e6ee', grey: '#bcc3cf', dark: '#8a92a0', ink: '#3a3e4c', red: '#e84838', redDark: '#b8302a' };
const FINE = 12;   // a smooth painting's pixels per painted pixel

/** A smooth painting (the user's call: the notice boards, then the Safari gate, the Sky Pillar and the Ancient Tree,
    aren't pixel art), drawn in painted-pixel units, `k` times finer; board() shows it the same size as a pixel one.
    shine() is its emissive map, painted alongside (mask() matches exact pixel colours, which smooth edges never are). */
function fine(w, h, k = FINE) {
  const c = new OffscreenCanvas(w * k, h * k), g = c.getContext('2d');
  c.fine = k;
  g.scale(k, k);
  g.lineJoin = g.lineCap = 'round';
  const fill = (col, path) => { g.fillStyle = col; g.beginPath(); path(); g.fill(); };
  const rr = (x, y, ww, hh, r, col) => fill(col, () => g.roundRect(x, y, ww, hh, r));
  const lin = (x0, y0, x1, y1, stops) => { const l = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => l.addColorStop(i / (stops.length - 1), s)); return l; };
  const shine = () => {
    if (!c.glow) {
      c.glow = new OffscreenCanvas(c.width, c.height); c.glow.fine = k;
      const gg = c.glow.getContext('2d');
      gg.fillStyle = '#000'; gg.fillRect(0, 0, c.width, c.height);
      gg.scale(k, k); gg.lineJoin = gg.lineCap = 'round';
    }
    return c.glow.getContext('2d');
  };
  return { c, g, fill, rr, lin, shine };
}

/** A texture, filtered smooth for a smooth painting. */
function texOf(canvas) {
  const map = tex(canvas);
  if (canvas.fine) { map.magFilter = THREE.LinearFilter; map.minFilter = THREE.LinearMipmapLinearFilter; map.generateMipmaps = true; map.anisotropy = 4; }
  return map;
}

/** The Safari's board, Scarlet / Violet's roadside kiosk: a white frame on arched legs under a ribbed, curved roof, a
    poster with a red header and three snapshots of today's catches. */
function kioskArt() {
  const { c, g, fill, rr, lin } = fine(22, 32), K = KIT;
  for (const x0 of [2, 18]) {   // the posts, each standing on a little arch
    rr(x0, 6, 2, 22, 0.6, lin(x0, 0, x0 + 2, 0, [K.white, K.pale, K.grey]));
    fill(lin(0, 27, 0, 32, [K.white, K.grey]), () => {
      g.moveTo(x0 - 1.2, 32); g.lineTo(x0 - 1.2, 28); g.quadraticCurveTo(x0 - 1.2, 27, x0, 27); g.lineTo(x0 + 2, 27);
      g.quadraticCurveTo(x0 + 3.2, 27, x0 + 3.2, 28); g.lineTo(x0 + 3.2, 32); g.lineTo(x0 + 2.3, 32);
      g.arc(x0 + 1, 31.6, 1.3, 0, Math.PI, true); g.closePath();
    });
  }
  fill(lin(0, 1, 0, 7, [K.white, K.pale, K.grey]), () => {   // the roof, rounded on top, its underside in shadow
    g.moveTo(0.6, 6.4); g.quadraticCurveTo(0.6, 1.2, 11, 0.8); g.quadraticCurveTo(21.4, 1.2, 21.4, 6.4);
    g.quadraticCurveTo(21.4, 7.2, 20.6, 7.2); g.lineTo(1.4, 7.2); g.quadraticCurveTo(0.6, 7.2, 0.6, 6.4);
  });
  rr(0.8, 5.9, 20.4, 1.3, 0.6, K.dark);
  g.strokeStyle = K.grey; g.lineWidth = 0.35;   // its ribs
  for (const x of [4.5, 8.5, 13.5, 17.5]) { g.beginPath(); g.moveTo(x, x < 11 ? 2.2 + (11 - x) * 0.12 : 2.2 + (x - 11) * 0.12); g.lineTo(x, 5.6); g.stroke(); }
  rr(3, 8, 16, 15, 1, lin(0, 8, 0, 23, [K.grey, K.dark]));   // the frame, then the poster
  rr(3.9, 8.9, 14.2, 13.2, 0.6, K.white);
  rr(4.8, 9.8, 12.4, 2.4, 0.5, lin(0, 9.8, 0, 12.2, [K.red, K.redDark]));
  fill(K.white, () => g.arc(6.4, 11, 0.85, 0, Math.PI * 2));   // a Poké Ball on the header
  fill(K.red, () => g.arc(6.4, 11, 0.85, Math.PI, 0));
  g.strokeStyle = K.ink; g.lineWidth = 0.22;
  g.beginPath(); g.arc(6.4, 11, 0.85, 0, Math.PI * 2); g.moveTo(5.55, 11); g.lineTo(7.25, 11); g.stroke();
  fill(K.white, () => g.arc(6.4, 11, 0.28, 0, Math.PI * 2));
  rr(8, 10.6, 7.5, 0.7, 0.35, 'rgba(255,255,255,0.75)');
  [[5.5, 4], [10, 3], [13.5, 3]].forEach(([x, w]) => rr(x, 13.2, w, 1.1, 0.55, K.ink));   // a headline
  ['#58b860', '#f8d848', '#6ab0e0'].forEach((col, i) => {   // the snapshots, with captions
    const x = 5.4 + i * 4;
    rr(x, 15.6, 3.2, 3.2, 0.5, lin(x, 15.6, x + 3.2, 18.8, ['#ffffff', col, col]));
    fill('rgba(0,0,0,0.18)', () => g.ellipse(x + 1.6, 17.6, 0.9, 0.7, 0, 0, Math.PI * 2));
    rr(x + 0.2, 19.3, 2.8, 0.6, 0.3, K.grey);
  });
  rr(3, 22.7, 16, 1.8, 0.8, lin(0, 22.7, 0, 24.5, [K.white, K.pale, K.dark]));   // the rail under it
  return c;
}

/** The Sky Pillar's board, a pin-shaped roadside marker: a red-and-white head round a white face, a red arrow pointing
    down its tapering body, on a jointed pole and a stone foot. */
function pinArt() {
  const { c, g, fill, rr, lin } = fine(16, 40), K = KIT;
  rr(7, 25, 2, 12, 0.5, lin(7, 0, 9, 0, [K.white, K.pale, K.grey]));   // the pole and its joint
  rr(5.8, 29.8, 4.4, 2.2, 0.8, lin(0, 29.8, 0, 32, [K.pale, K.grey]));
  rr(3.6, 35.6, 8.8, 4.2, 1.2, lin(0, 35.6, 0, 39.8, [K.pale, K.grey, K.dark]));   // the stone foot
  const pin = () => {
    g.moveTo(0.5, 8); g.arc(8, 8, 7.5, Math.PI, 0);
    g.bezierCurveTo(15.5, 14, 11, 21, 8, 27.4); g.bezierCurveTo(5, 21, 0.5, 14, 0.5, 8); g.closePath();
  };
  fill(K.grey, pin);
  g.save(); g.beginPath(); pin(); g.clip();
  g.fillStyle = lin(0.5, 0, 15.5, 0, [K.white, K.pale, K.grey]); g.fillRect(0, 0, 16, 28);
  g.fillStyle = lin(0, 0, 0, 9, [K.red, K.red, K.redDark]); g.fillRect(0, 0, 16, 8.6);
  g.restore();
  g.strokeStyle = K.dark; g.lineWidth = 0.5; g.beginPath(); pin(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.7;   // a shine on the head
  g.beginPath(); g.arc(8, 8, 6.4, Math.PI * 1.15, Math.PI * 1.45); g.stroke();
  fill(K.grey, () => g.arc(8, 8, 5.4, 0, Math.PI * 2));   // the face
  fill(K.white, () => g.arc(8, 8, 4.9, 0, Math.PI * 2));
  rr(5, 5.2, 6, 0.9, 0.45, K.red);   // the face's lines
  rr(5, 7.8, 6, 0.8, 0.4, K.ink);
  rr(5, 9.8, 2.2, 0.8, 0.4, K.ink); rr(8, 9.8, 3, 0.8, 0.4, K.ink);
  fill(lin(0, 15, 0, 23, [K.red, K.redDark]), () => {   // the arrow, pointing down
    g.moveTo(4.4, 15.4); g.lineTo(11.6, 15.4); g.lineTo(8, 22.6); g.closePath();
  });
  return c;
}

/** New game's Pokéstop (the user's pick, after Pokémon Go's): a holographic disc, a ring round a Poké Ball with arcs
    orbiting it, floating over a slim post with a little tilted plate. The disc's own shapes are its glow (shine()). */
function stopDiscArt() {
  const { c, g, lin, shine } = fine(32, 32), o = 16;
  const ink = (gg, col) => {
    gg.strokeStyle = gg.fillStyle = col;
    gg.lineWidth = 1.6; gg.beginPath(); gg.arc(o, o, 12.6, 0, Math.PI * 2); gg.stroke();   // the ring
    gg.lineWidth = 1.2;   // the arcs orbiting inside and out
    for (const [r, a0, a1] of [[14.9, 1.12, 1.42], [11, 1.3, 1.72], [11, 0.66, 0.8]]) { gg.beginPath(); gg.arc(o, o, r, a0 * Math.PI, a1 * Math.PI); gg.stroke(); }
    gg.save(); gg.beginPath(); gg.arc(o, o, 8.6, 0, Math.PI * 2);   // the Poké Ball, its band and button cut out
    gg.rect(o - 9, o - 0.55, 18, 1.1); gg.arc(o, o, 3.9, 0, Math.PI * 2); gg.clip('evenodd');
    gg.beginPath(); gg.arc(o, o, 8.6, 0, Math.PI * 2); gg.fill(); gg.restore();
    gg.beginPath(); gg.arc(o, o, 2.9, 0, Math.PI * 2); gg.fill();
  };
  ink(g, lin(0, 2, 0, 30, ['#9cf0ff', '#3cc8f8', '#1aa8e8']));
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.6;   // a shine along the top
  g.beginPath(); g.arc(o, o, 12.6, 1.15 * Math.PI, 1.4 * Math.PI); g.stroke();
  g.beginPath(); g.arc(o, o, 7.4, 1.1 * Math.PI, 1.35 * Math.PI); g.stroke();
  ink(shine(), '#8c8c8c');
  return c;
}

function stopPostArt() {
  const { c, g, fill, rr, lin } = fine(12, 22);
  rr(5.4, 2.4, 1.2, 18, 0.5, lin(5.4, 0, 6.6, 0, ['#9cf0ff', '#3cc8f8', '#1a98d8']));
  fill(lin(0, 0, 0, 3, ['#bff6ff', '#3cc8f8', '#1a98d8']), () => {   // the plate, tilted towards you
    g.moveTo(1.6, 0.6); g.lineTo(10.4, 0.6); g.lineTo(11.4, 2.4); g.lineTo(0.6, 2.4); g.closePath();
  });
  fill(lin(0, 19.6, 0, 22, ['#7ee4ff', '#1a98d8']), () => g.ellipse(6, 20.8, 2.6, 0.9, 0, 0, Math.PI * 2));
  return c;
}

/** A billboard: the painting standing upright, feet at (x, z), `s` units a painted tile. */
function board(canvas, x, z, { s = 1, shadow = true } = {}) {
  const k = canvas.fine ? s / canvas.fine : s, w = canvas.width / TP * k, h = canvas.height / TP * k;
  const map = texOf(canvas);
  const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
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
  m.emissiveMap = src.glow ? texOf(src.glow) : tex(mask(src, colours));
  m.userData.glow = k;
  glowMats.push(m);
  return m;
}

/* ---------- the Game Corner's stall, in 3D ---------- */

// its colours: the awning's red and gold stripes, the booth's violet, the cabinets' lilac chrome
const GC = { red: '#e84838', redDark: '#a82820', gold: '#f8d040', goldDark: '#c89418', violet: '#5a3a8a', violetDark: '#2e1c4e', chrome: ['#f4f2fa', '#cdc8e0', '#9a92b8'], ink: '#2a2238' };

const star = (g, x, y, r) => {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  g.closePath(); g.fill();
};
const words = (g, text, x, y, size, col) => {
  g.font = `900 ${size}px "Trebuchet MS", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, x, y);
};

/** A slot machine's face: a lit marquee, three reels showing 7s behind glass, three buttons and the coin tray. */
function slotFaceArt() {
  const { c, g, fill, rr, lin, shine } = fine(16, 26), G = GC;
  rr(0, 0, 16, 26, 1.2, lin(0, 0, 16, 0, [G.chrome[2], G.chrome[0], G.chrome[1], G.chrome[2]]));
  rr(1.2, 1.2, 13.6, 4.4, 1, lin(0, 1.2, 0, 5.6, [G.red, G.redDark]));
  g.fillStyle = G.gold; star(g, 3.6, 3.4, 1.5);
  words(g, 'SLOTS', 9.6, 3.5, 2.6, '#fff4c0');
  rr(1.4, 7, 13.2, 9.2, 1, G.ink);   // the reels behind their glass
  const reels = (gg, white) => {
    for (let r = 0; r < 3; r++) {
      const x = 2.3 + r * 4.15;
      if (white) rr(x, 7.8, 3.6, 7.6, 0.5, lin(0, 7.8, 0, 15.4, ['#b8b4c4', '#ffffff', '#ffffff', '#b8b4c4']));
      words(gg, '7', x + 1.8, 11.8, 6, white ? G.red : '#8c3c3c');
    }
  };
  reels(g, true);
  rr(1.6, 11.5, 12.8, 0.45, 0.2, 'rgba(232,72,56,0.85)');   // the pay line
  fill('rgba(255,255,255,0.35)', () => { g.moveTo(2, 7.6); g.lineTo(6, 7.6); g.lineTo(3.4, 15.6); g.lineTo(2, 15.6); g.closePath(); });   // a glint on the glass
  rr(1.4, 17.4, 13.2, 3.4, 0.8, lin(0, 17.4, 0, 20.8, [G.violet, G.violetDark]));   // the button deck
  const buttons = [['#f85848', 4], ['#f8d040', 8], ['#58a8f8', 12]];
  for (const [col, x] of buttons) fill(lin(0, 18, 0, 20.4, ['#ffffff', col, col]), () => g.arc(x, 19.1, 1.15, 0, Math.PI * 2));
  rr(4, 22.2, 8, 2.6, 0.8, lin(0, 22.2, 0, 24.8, [G.ink, '#4a4060']));   // the coin tray, a few coins in it
  for (const x of [5.6, 7.2, 8.6]) fill(G.gold, () => g.ellipse(x, 24, 0.75, 0.4, 0, 0, Math.PI * 2));
  // what lights up after dark: the marquee, the reels and the buttons
  const s = shine();
  s.fillStyle = '#c86a50'; s.beginPath(); s.roundRect(1.2, 1.2, 13.6, 4.4, 1); s.fill();
  s.fillStyle = '#ffe890'; star(s, 3.6, 3.4, 1.5);
  words(s, 'SLOTS', 9.6, 3.5, 2.6, '#ffe890');
  s.fillStyle = '#9a9a9a';
  for (let r = 0; r < 3; r++) { s.beginPath(); s.roundRect(2.3 + r * 4.15, 7.8, 3.6, 7.6, 0.5); s.fill(); }
  reels(s, false);
  for (const [col, x] of buttons) { s.fillStyle = col; s.beginPath(); s.arc(x, 19.1, 1.15, 0, Math.PI * 2); s.fill(); }
  return c;
}

/** The striped awning, red and gold, shaded darker towards its foot; `under` is its shadowed underside. */
function awningArt(under = false) {
  const { c, g, lin } = fine(24, 12, 8), G = GC;
  for (let i = 0; i < 8; i++) {
    g.fillStyle = lin(0, 0, 0, 12, i % 2 ? [G.gold, G.gold, G.goldDark] : [G.red, G.red, G.redDark]);
    g.fillRect(i * 3, 0, 3, 12);
  }
  g.fillStyle = lin(0, 0, 24, 0, ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.12)']);
  g.fillRect(0, 0, 24, 12);
  if (under) { g.fillStyle = 'rgba(30,10,40,0.45)'; g.fillRect(0, 0, 24, 12); }
  return c;
}

/** Its hem: the stripes ending in scallops. */
function valanceArt() {
  const { c, g, lin } = fine(24, 4, 8), G = GC;
  for (let i = 0; i < 8; i++) {
    g.fillStyle = lin(0, 0, 0, 4, i % 2 ? [G.gold, G.goldDark] : [G.red, G.redDark]);
    g.beginPath(); g.moveTo(i * 3, 0); g.lineTo(i * 3 + 3, 0); g.lineTo(i * 3 + 3, 2.4);
    g.arc(i * 3 + 1.5, 2.4, 1.5, 0, Math.PI); g.closePath(); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0, 0, 24, 0.35);
  return c;
}

/** The marquee over the awning: GAME CORNER in gold on violet, ringed with bulbs. */
function cornerSignArt() {
  const { c, g, rr, lin, shine } = fine(28, 8), G = GC;
  rr(0.2, 0.2, 27.6, 7.6, 1.6, lin(0, 0, 0, 8, [G.goldDark, G.gold, G.goldDark]));
  rr(0.9, 0.9, 26.2, 6.2, 1.1, lin(0, 0.9, 0, 7.1, [G.violet, G.violetDark]));
  words(g, 'GAME CORNER', 14.2, 4.45, 3.4, 'rgba(0,0,0,0.45)');
  words(g, 'GAME CORNER', 14, 4.2, 3.4, '#ffe36b');
  const s = shine();
  for (let x = 2; x <= 26; x += 2) for (const y of [0.55, 7.45]) {
    g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(x, y, 0.42, 0, Math.PI * 2); g.fill();
    s.fillStyle = '#ffffff'; s.beginPath(); s.arc(x, y, 0.5, 0, Math.PI * 2); s.fill();
  }
  words(s, 'GAME CORNER', 14, 4.2, 3.4, '#d8c060');
  return c;
}

/** The booth's walls: violet under a gold lattice of diamonds, a coin where the lines cross. */
function boothWallArt() {
  const { c, g, lin } = fine(24, 20, 8), G = GC;
  g.fillStyle = lin(0, 0, 0, 20, [G.violet, G.violetDark]); g.fillRect(0, 0, 24, 20);
  g.strokeStyle = 'rgba(248,208,64,0.5)'; g.lineWidth = 0.25;
  for (let k = -20; k < 44; k += 4) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 20, 20); g.moveTo(k, 20); g.lineTo(k + 20, 0); g.stroke(); }
  g.fillStyle = 'rgba(248,208,64,0.55)';
  for (let y = 0; y <= 20; y += 2) for (let x = (y / 2) % 2 ? 2 : 0; x <= 24; x += 4) { g.beginPath(); g.arc(x, y, 0.45, 0, Math.PI * 2); g.fill(); }
  return c;
}

/** The Game Corner, built (the user's call, 2026-10-08: 3D, smooth, turned 45 degrees to the plaza): a violet booth on a
    wooden deck, two slot machines with their stools, a striped awning sloping out over them with a row of bulbs under
    its hem, and the GAME CORNER marquee on top. Its lights come up with the evening like the other places'. */
function cornerStall() {
  const W = 2.3, D = 1.3, FRONT_Y = 1.86, BACK_Y = 2.14, OUT = 0.32;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const lit = (colour, k, min) => {
    const m = std({ color: colour, emissive: new THREE.Color(colour), roughness: 0.4 });
    m.userData.glow = k; m.userData.glowMin = min;
    glowMats.push(m);
    return m;
  };
  const g = new THREE.Group();
  const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); return mesh; };
  const box = (w, h, d, mats, x, y, z) => add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats), x, y, z);
  const wood = std({ color: P.wood[1] }), woodDark = std({ color: P.wood[2] }), violet = std({ color: GC.violetDark });
  box(W + 0.16, 0.12, D + 0.16, [woodDark, woodDark, wood, woodDark, woodDark, woodDark], 0, 0.06, 0);
  box(W - 0.1, 0.01, D - 0.1, std({ color: '#9a2a4a' }), 0, 0.125, 0.02);   // a red carpet
  const wall = std({ map: texOf(boothWallArt()) });
  box(W, 1.95, 0.08, [violet, violet, violet, violet, wall, violet], 0, 0.12 + 0.975, -D / 2 + 0.04);
  for (const s of [-1, 1]) box(0.08, 1.95, D, [wall, wall, violet, violet, violet, violet], s * (W / 2 - 0.04), 0.12 + 0.975, 0);

  const face = slotFaceArt(), faceM = glowing(std({ map: texOf(face), roughness: 0.5 }), face, null, '#fff0c0', 0.9);
  faceM.userData.glowMin = 0.25;
  const chrome = std({ color: GC.chrome[1], metalness: 0.45, roughness: 0.35 }), chromeTop = std({ color: GC.chrome[0], metalness: 0.45, roughness: 0.35 });
  const topper = lit('#ffd860', 0.9, 0.35), red = std({ color: GC.red, roughness: 0.4 }), steel = std({ color: '#8a88a0', metalness: 0.6, roughness: 0.3 });
  for (const sx of [-0.55, 0.55]) {
    const z = -D / 2 + 0.36;
    box(0.72, 1.17, 0.55, [chrome, chrome, chromeTop, chrome, faceM, chrome], sx, 0.12 + 0.585, z);
    box(0.6, 0.16, 0.42, [chrome, chrome, topper, chrome, topper, chrome], sx, 0.12 + 1.17 + 0.08, z - 0.02);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.42, 10), steel), sx + 0.39, 0.92, z + 0.06);   // the lever
    add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), red), sx + 0.39, 1.15, z + 0.06);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.07, 18), red), sx, 0.5, z + 0.62);   // a stool
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.36, 10), steel), sx, 0.3, z + 0.62);
  }

  const rise = BACK_Y - FRONT_Y, run = D + OUT;
  const stripes = std({ map: texOf(awningArt()), roughness: 0.7 }), under = std({ map: texOf(awningArt(true)), roughness: 0.9 });
  box(W + 0.24, 0.04, Math.hypot(run, rise), [under, under, stripes, under, under, under], 0, (FRONT_Y + BACK_Y) / 2, OUT / 2).rotation.x = Math.atan2(rise, run);
  const hem = add(new THREE.Mesh(new THREE.PlaneGeometry(W + 0.24, 0.34), std({ map: texOf(valanceArt()), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 })), 0, FRONT_Y - 0.17, D / 2 + OUT + 0.005);
  hem.receiveShadow = false;
  const bulb = lit('#fff2b0', 1.4, 0.6), bulbGeo = new THREE.SphereGeometry(0.035, 10, 8);
  for (let i = 0; i <= 10; i++) {
    const b = new THREE.Mesh(bulbGeo, bulb);
    b.position.set(-W / 2 + (i / 10) * W, FRONT_Y - 0.03, D / 2 + OUT + 0.04);
    g.add(b);
  }
  const sign = cornerSignArt(), signM = glowing(std({ map: texOf(sign), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 }), sign, null, '#fff0b0', 1.1);
  signM.userData.glowMin = 0.35;
  add(new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.05 * 8 / 28), signM), 0, FRONT_Y + 0.33, D / 2 + OUT - 0.04).receiveShadow = false;
  return g;
}

/* ---------- the places ---------- */

const gateOpen = () => gateHp() <= 0 && isStarterUnlocked(STARTERS_BY_ID.mewtwo);

/** Every place: where it stands (`tiles` it blocks), its doorstep (`step`), whether it's open, what its card says and
    what it opens, all from the title's own actions (`acts`) and today's save. */
function makePlaces() {
  const save = getSave(), run = acts.savedRun();
  const list = [
    {
      id: 'trail', name: run ? 'Continue / New game' : 'New game', step: { x: 6, y: ROWS - 1 }, tiles: [[7, ROWS - 2]], tag: [6, 4, ROWS - 1],
      open: true,
      line: run ? `${run.name} waits in the ${run.place}${run.floor ? `, floor ${run.floor}` : ''}. HP ${run.hp}/${run.maxHp}.` : 'The trail out of the Clearing: a new adventure.',
      buttons: run ? [['Continue', () => acts.onContinue(run)], ['New game', acts.onNewGame], ['Escape Rope', acts.onAbandon]] : [['New game', acts.onNewGame]],
      build: (g) => {
        const S = 0.7, x = tileX(7), z = tileZ(ROWS - 2), d = stopDiscArt(), w = d.width / d.fine / TP * 1.15 * S;
        g.add(board(stopPostArt(), x, z, { s: S }));
        const m = glowing(new THREE.MeshStandardMaterial({ map: texOf(d), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 }), d, null, '#9cecff', 1.4);
        m.userData.glowMin = 0.3;
        const disc = new THREE.Mesh(new THREE.PlaneGeometry(w, w), m);
        disc.position.set(x, 1.55 * S + w / 2, z);
        disc.castShadow = true;
        g.add(disc);
        stop = { disc, m, y: disc.position.y, spinAt: 0 };
      },
    },
    {
      id: 'base', name: 'Secret Base', step: { x: 6, y: 3 }, tiles: rect(3, 0, 9, 2), tag: [6, 3.2, 2], open: true,
      line: 'A door in the Ancient Tree\'s roots: your Secret Base.',
      buttons: [['Go in', enterBase]],
      build: (g) => {
        const shut = ancientArt(), b = board(shut, tileX(6), tileZ(2) + 0.2), open = ancientArt(true);
        glowing(b.material, shut, null, '#ffd890');
        tree = { m: b.material, shut: b.material.map, open: texOf(open) };
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
    build: (g) => { const s = safariArt(safari), b = board(s, tileX(1), tileZ(2)); glowing(b.material, s, null, '#ffc890', 0.8); g.add(b); },
  });
  list.push({
    id: 'safari-board', name: 'Safari Ranks', step: { x: 3, y: 4 }, tiles: [[3, 3]], tag: [3, 2.6, 3], open: safari,
    line: safari ? 'The Safari Zone\'s notice board: today\'s and yesterday\'s best catches.' : 'Notices for the Safari Zone, once it opens.',
    buttons: safari ? [['Read', () => acts.onBoard('safari')]] : [],
    build: (g) => g.add(board(kioskArt(), tileX(3), tileZ(3))),
  });
  // a stall down in the bottom left, so the Safari has the back left to itself, turned 45 degrees to face the plaza
  list.push({
    id: 'corner', name: 'Game Corner', step: { x: 2, y: 10 }, tiles: [[0, 9], [1, 9], [1, 8], [2, 8], [0, 10]], tag: [1.4, 3, 9.4], open: true,
    line: 'Spend PokéCoins on starters, perks, shinies and Poké Balls.',
    buttons: [['Play', acts.onCorner]],
    build: (g) => { const st = cornerStall(); st.position.set(tileX(1) - 0.1, 0, tileZ(9) - 0.1); st.rotation.y = Math.PI / 4; g.add(st); },
  });
  const tower = towerOpen(save), best = save.tower?.bestEver || 0;
  list.push({
    id: 'pillar', name: 'Sky Pillar', step: { x: 11, y: 3 }, tiles: rect(10, 0, 12, 2), tag: [11, 4.2, 2], open: tower,
    line: tower ? `A 100-floor climb with a weekly leaderboard.${best ? ` Your best: floor ${best}.` : ''}` : 'Win a run to open the Sky Pillar, a 100-floor tower climb with a weekly leaderboard.',
    buttons: tower ? [['Climb', acts.onTower]] : [],
    build: (g) => {
      const side = new THREE.MeshStandardMaterial({ map: texOf(pillarArt(false)), roughness: 1 });
      const door = pillarArt(true), face = glowing(new THREE.MeshStandardMaterial({ map: texOf(door), roughness: 1 }), door, null, '#a8c4ff', 0.9);
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
  glowMats = []; tree = null; stop = null;
  places = makePlaces();
  saved = acts.savedRun();
  barKey = null;
  blocked = new Set(TREE_TILES.map(([x, y]) => key(x, y)));
  for (const p of places) {
    const g = new THREE.Group();
    p.build(g);
    g.traverse(o => { o.userData.place = p; });
    placeGroup.add(g);
    for (const [x, y] of p.tiles) blocked.add(key(x, y));
  }
  setTime(true);
}

/* ---------- the Clearing round them ---------- */

// trees inside the walkable grid (they block)
const TREE_TILES = [[12, 11]];

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
    const x = s < 0 ? -2 - r * 1.2 : COLS + 1 + r * 1.2;
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

/** Head for a place's doorstep; `enter` opens it on arrival (`i`: which of its buttons, from the bar), else its card
    shows there. */
function goTo(p, enter, i = null) {
  if (walker.path.length === 0 && placeAt(walker.tile) === p) return enter ? open(p, i) : showCard(p);
  walker.path = route(walker.tile, p.step);
  aim = enter ? { p, i } : null;
  hideCard();
  playSound('confirm');
  if (!walker.path.length) open(p, i);
}

function arrived() {
  here = placeAt(walker.tile);
  const go = aim;
  aim = null;
  if (arriving) { arriving = false; walker.facing = 'front'; walker.flip = false; walker.hopUntil = performance.now() + 500; return; }
  if (!here) return;
  walker.facing = here.id === 'trail' || !mon.sheets.back ? 'front' : 'back';
  if (go?.p === here) open(here, go.i);
  else showCard(here);
}

/** What a place does: a closed one says why; with more than one thing to do (the trail with a saved run) a tap on the
    place only shows its card, the bar's keys choosing; else straight in. */
function open(p, i = null) {
  if (!p.open || (i == null && p.buttons.length > 1)) return showCard(p);
  if (p.id === 'trail') {
    if (stop?.spinAt && performance.now() - stop.spinAt < SPIN) return;
    spinStop();
  }
  if (p.id === 'base') return enterBase();
  walker.hopUntil = performance.now() + 400;
  playSound('confirm');
  hideCard();
  const go = p.buttons[i ?? 0][1];
  setTimeout(() => { if (running) go(); }, calm ? 0 : p.id === 'trail' ? SPIN * 0.8 : 260);
}

/* ---------- the Pokéstop ---------- */

const SPIN = 1700;

/** A tap spins the disc like Pokémon Go's, three turns slowing down, and it glows violet a moment after. */
function spinStop() {
  if (!stop || calm) return;
  stop.spinAt = performance.now();
  playSound('aug-silver');
  setTimeout(() => playSound('aug-gold'), SPIN * 0.75);
}

/** Idle it bobs and sways a little; spun, it whirls, then its violet fades back to blue. */
function liveStop(now) {
  if (!stop || calm) return;
  const t = stop.spinAt ? (now - stop.spinAt) / SPIN : 9, sway = Math.sin(now / 1400) * 0.3;
  stop.disc.rotation.y = t < 1 ? (1 - (1 - t) ** 3) * Math.PI * 6 + sway * t : sway;
  stop.disc.position.y = stop.y + Math.sin(now / 900) * 0.06;
  const violet = t < 1 ? t : Math.max(0, 1 - (t - 1) * SPIN / 3000);
  stop.m.color.setRGB(1 - violet * 0.15, 1 - violet * 0.55, 1);
  stop.m.emissive.setRGB(0.61 + violet * 0.3, 0.92 - violet * 0.5, 1);
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
  // the Pokéstop with a saved run asks which (the user's call, 2026-10-08): its card's two buttons
  const ask = p.id === 'trail' && p.open && saved;
  card.querySelector('.hub-card-name').textContent = ask ? 'Continue or New game?' : p.name;
  card.querySelector('.hub-card-line').textContent = p.line;
  card.querySelector('.hub-card-acts').replaceChildren(...(ask ? ['Continue', 'New game'] : []).map((label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `hub-card-btn${label === 'Continue' ? ' go' : ''}`;
    b.textContent = label;
    b.addEventListener('click', () => open(p, p.buttons.findIndex(([l]) => l === label)));
    return b;
  }));
  card.classList.toggle('locked', !p.open);
  card.hidden = false;
  if (!p.open) playSound('cancel');
}
function hideCard() { card.hidden = true; }

/* ---------- the bar beside it ---------- */

/** The place your partner stands at, else the nearest within SEEN of its doorstep. */
function nearest() {
  if (held || arriving) return null;
  if (here && !walker.path.length) return here;
  let best = null, d0 = SEEN;
  for (const p of places) {
    const d = Math.hypot(walker.x - tileX(p.step.x), walker.z - tileZ(p.step.y));
    if (d < d0) { d0 = d; best = p; }
  }
  return best;
}

// a round key's glyph by what it does (only the trail has more than one thing to do)
const KEY_FOR = { Continue: 'play', 'New game': 'plus', 'Escape Rope': 'rope' };

/** The bottom bar, the rooms' Pokédex bar (the user's pick, 2026-10-08): the hinge's LCD names the place your partner
    walks up to and the gold pill does it (a tap walking there first); the row under it is Home (the Pokédex), round
    keys for How to play (New game's + at the Pokéstop) and a place's other doings (no Continue key: it squashed the HP), and the LCD: a saved
    run's HP and its Escape Rope (battle's running figure), then the PokéCoins. Near
    nothing the pill is Continue, or New game (the Pokéstop). Redrawn only when the place changes. */
function placeBar() {
  const coins = getSave().coins ?? 0;
  if (coins !== barCoins) { barCoins = coins; bar.querySelector('.hbar-coins').textContent = coins.toLocaleString(); }
  const p = nearest(), k = `${p?.id ?? ''}|${saved ? `${saved.hp}/${saved.maxHp}` : ''}`;
  if (k === barKey) return;
  barKey = k;
  bar.querySelector('.hbar-run').hidden = !saved;
  if (saved) setHpBar('hub', saved.hp, saved.maxHp);
  const cont = () => { playSound('confirm'); hideCard(); acts.onContinue(saved); };
  const trail = places.find(q => q.id === 'trail');
  let main, rest = [];
  if (p && (!p.open || !p.buttons.length)) main =['Locked', () => goTo(p, true), true];
  else if (p) {
    main = [p.buttons[0][0], () => goTo(p, true, 0)];
    rest = p.buttons.slice(1).map(([label], i) => [label, () => goTo(p, true, i + 1)]);
    // at the Pokéstop How to play's key is New game and the Escape Rope is on the LCD, by your HP
    if (p.id === 'trail') rest = [];
  } else if (saved) {
    main = ['Continue', cont];
  } else main = ['New game', () => goTo(trail, true, 0)];
  bar.querySelector('.hbar-sign b').textContent = p?.name ?? 'The Clearing';
  helpKey(p?.id === 'trail' && p.open ? () => goTo(p, true, p.buttons.findIndex(([label]) => label === 'New game')) : null);
  const ok = bar.querySelector('.hbar-ok');
  ok.querySelector('span').textContent = main[0];
  ok.classList.toggle('locked', !!main[2]);
  ok.onclick = main[1];
  bar.querySelector('.hbar-keys').replaceChildren(...rest.map(([label, go]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'room-home hbar-key';
    b.title = label;
    b.setAttribute('aria-label', label);
    b.append(roundKey(KEY_FOR[label] ?? 'ok', 'round-key'));
    b.addEventListener('click', go);
    return b;
  }));
  for (const el of [ok, bar.querySelector('.hbar-sign b')]) {
    el.classList.remove('hbar-pop');
    void el.offsetWidth;
    el.classList.add('hbar-pop');
  }
}

/** How to play's key, or New game's (+) while your partner is at the Pokéstop (`go`); it pops when it swaps. */
function helpKey(go) {
  const key = root.querySelector('.hub-help'), glyph = go ? 'plus' : 'help';
  key.onclick = go ?? (() => fromCorner(acts.onHelp, key));
  if (key.dataset.glyph === glyph) return;
  key.dataset.glyph = glyph;
  const label = go ? 'New game' : 'How to play';
  key.title = label;
  key.setAttribute('aria-label', label);
  key.replaceChildren(roundKey(glyph));
  key.classList.remove('hbar-pop');
  void key.offsetWidth;
  key.classList.add('hbar-pop');
}

/* ---------- the Pokédex in the corner ---------- */

/** It grows from the corner into the device (js/device.js's `from`), which opens over the hub; shut, it's back here. */
const openDex = () => fromCorner(acts.onPokedex, dexBtn);

/** How to play grows out of its own round key beside Home (the user's call, 2026-10-08), and shuts back into it. */
function fromCorner(open, key) {
  if (root.querySelector('.room-home.out') || entering || held) return;
  hideCard();
  walker.path = []; aim = null;
  playSound('confirm');
  open(key, () => { key.classList.remove('out'); dexNews(); });
  key.classList.add('out');
}

/** It wears the yellow "!" while the device has something new (a badge, a find), like every other Home key. */
const dexNews = () => dexBtn.classList.toggle('dex-news', deviceNews());

/* ---------- taps and keys ---------- */

function ndc(e) {
  const r = view.getBoundingClientRect();
  return new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
}

function onTap(e) {
  if (held || arriving) return;
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
  if (!running || held || arriving || document.querySelector('dialog:modal, #shop-dialog[open]') || document.activeElement?.matches?.('input')
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
    open(placeAt(walker.tile), 0);
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
  for (const m of glowMats) m.emissiveIntensity = Math.max(m.userData.glowMin || 0, L.glow) * m.userData.glow;
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
  const reachX = COLS / 2 + 2.2 - half, frontZ = front, backZ = tileZ(2);
  // walking in, the view waits on the plaza for it rather than dipping to meet it
  const wx = arriving ? tileX(START.x) : walker.x, wz = arriving ? tileZ(START.y) : walker.z;
  const wantX = reachX <= 0 ? 0 : Math.max(-reachX, Math.min(reachX, wx));
  const wantZ = backZ >= frontZ ? (backZ + frontZ) / 2 : Math.max(backZ, Math.min(frontZ, wz));
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

function frame(now) {
  if (!running) return;
  if (screen.hidden || !root.isConnected) { running = false; quiet(); return; }
  // under the device (its corner button opened it over the hub) the Clearing holds still rather than drawing unseen
  if (root.querySelector('.room-home.out') && document.getElementById('collection-screen')?.hidden === false) { last = 0; requestAnimationFrame(frame); return; }
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
  liveStop(now);
  if (now - (frame.checked || 0) > 30000) { frame.checked = now; setTime(); }
  liveBugs(now);
  placeCamera(dt);
  if (!held) { liveFlyer(now, dt); sounds(now); }
  placeBar();
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
    <div class="hub-card" role="dialog" aria-live="polite" hidden><b class="hub-card-name"></b><p class="hub-card-line"></p><div class="hub-card-acts"></div></div>
    <div class="hub-bar">
      <div class="room-hinge"><span class="pdx-lens" aria-hidden="true"></span><span class="mdex-lights" aria-hidden="true"><span class="pdx-light red"></span><span class="pdx-light yellow"></span><span class="pdx-light green"></span></span>
        <button type="button" class="room-ok hbar-ok"><span></span></button>
        <div class="room-sign hbar-sign" aria-live="polite"><b></b></div></div>
      <div class="room-row"><div class="room-keys"><button type="button" class="room-home hub-dex" aria-label="Pokédex"></button><button type="button" class="room-home hub-help"></button><span class="hbar-keys"></span></div>
        <div class="room-lcd hbar-lcd"><span class="hbar-run" hidden><span class="gb-hp" id="hub-hp" role="progressbar" aria-label="HP" aria-valuemin="0"><span class="gb-hp-tag" aria-hidden="true">HP:</span><span class="gb-hp-track"><span class="gb-hp-fill" id="hub-hp-fill"></span></span></span><span class="gb-hp-num" id="hub-hp-text"></span><button type="button" class="hbar-flee" title="Escape Rope" aria-label="Escape Rope"></button></span>
          <span class="hbar-cash" title="PokéCoins"><span class="hbar-coins">0</span></span></div></div>
    </div>
    <button type="button" class="hub-version" aria-label="Patch notes"></button>
    <span class="hub-fps" hidden></span>`;
  view = root.querySelector('.hub-view');
  card = root.querySelector('.hub-card');
  bar = root.querySelector('.hub-bar');
  bar.querySelector('.hbar-coins').before(smoothIcon('coin', 'hbar-coin'));
  new ResizeObserver(() => root.style.setProperty('--hub-bar-h', `${bar.offsetHeight}px`)).observe(bar);
  bar.querySelector('.hbar-flee').append(smoothIcon('run'));
  bar.querySelector('.hbar-flee').addEventListener('click', () => { playSound('confirm'); hideCard(); acts.onAbandon(); });
  dexBtn = root.querySelector('.hub-dex');
  dexBtn.append(roundKey('home'));
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
    false where it can't be (no WebGL, Three.js offline), and the signs stay. `hold` draws it behind the shut Pokédex with
    no partner and nothing to tap, until enterHub() walks the partner in. */
export function showHub(titleScreen, actions, { hold = false } = {}) {
  showing ??= openHub(titleScreen, actions, hold).finally(() => { showing = null; });
  return showing;
}

async function openHub(titleScreen, actions, hold) {
  screen = titleScreen;
  acts = actions;
  calm = calmFx();
  try {
    built ??= build();
    await built;
  } catch { built = Promise.reject(); built.catch(() => {}); return false; }
  // held before it's on the page, or the bar shows over the shut Pokédex while the partner loads
  root.classList.toggle('held', hold);
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
  held = hold;
  root.classList.toggle('held', held);
  mon.group.visible = !held;
  if (!placed) { placed = true; walker.tile = START; walker.x = tileX(START.x); walker.z = tileZ(START.y); camX = walker.x; camZ = walker.z; }
  walker.path = []; aim = null; here = placeAt(walker.tile);
  if (inBase) leftBase();
  hideCard();
  root.querySelectorAll('.room-home.out').forEach(k => k.classList.remove('out'));
  dexNews();
  const tag = document.getElementById('title-version');
  root.querySelector('.hub-version').textContent = tag?.textContent ?? '';
  nextFly = performance.now() + 6000;
  airAt = 0;
  setTime(true);
  resize();
  if (!held) screen.classList.add('hub-on');
  if (!running) { running = true; last = 0; requestAnimationFrame(frame); }
  return true;
}

/** Out from behind the shut Pokédex: the corner keys come up and your partner walks in from the bottom of the screen, up
    the trail onto the plaza, then turns to face you. */
export function enterHub() {
  if (!held || !mon) return;
  held = false;
  root.classList.remove('held');
  screen.classList.add('hub-on');
  mon.group.visible = true;
  nextFly = performance.now() + 6000;
  if (calm) return;
  const from = ROWS + FRONT + 2;
  walker.x = tileX(START.x); walker.z = tileZ(from); walker.tile = { x: START.x, y: from };
  walker.path = [];
  for (let y = from - 1; y >= START.y; y--) walker.path.push({ x: START.x, y });
  walker.facing = mon.sheets.back ? 'back' : 'front';
  here = null;
  arriving = true;
}

/** The corner handheld, for a device to shrink back into (the first launch's How to play). */
export const hubDex = () => (root?.isConnected ? root.querySelector('.hub-help') : null);

/** Back to the signs (Settings' Title screen). */
export function hideHub() {
  running = false;
  held = arriving = false;
  quiet();
  screen?.classList.remove('hub-on');
  root?.remove();
}
