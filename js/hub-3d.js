/* hub-3d.js  -  the Clearing as a walkable HD-2D hub (branch secret-base, session 3 part a): after PRESS START your
   partner stands in a small 3D Clearing and walks up to the places instead of tapping the title's signs. The trail out
   (Continue / New game), the Safari Zone's gate, the Poké Mall (the Game Corner inside, js/mall-3d.js), the Sky Pillar, the Sealed Gate once broken, the Secret Base's door in
   the Ancient Tree's roots each open what their sign opens; the Pokédex is a shut handheld in the bottom left corner that
   grows into the device (the user's call, 2026-10-08: always to hand, not a place to walk to). Everything is painted here in code in
   the Clearing's palette (js/scene.js's clearing day colours): pixel-textured ground, billboard trees (instanced) and
   places; the partner's GIF and the post pass are js/hd2d.js's, shared with the Secret Base.
   It lives inside #title-screen, over its sky and under its logo and corner, and runs only while the title shows. The
   signs are the fallback: no WebGL, Three.js not loading, or Settings' Title screen set to Signs (js/title.js). */

import { getSave, updateSave } from './storage.js';
import { timeOfDay } from './daytime.js';
import { season } from './season.js';
import { leavesOf, groundLook, vistaLook, snowCap, tintOf, BUG_LOOK, pumpkinArt, snowmanArt, graveArt, deadTreeArt, scarecrowArt, cauldronArt, candlesArt, hayArt, lanternArt, capsArt } from './hub-season.js';
import { makeSpooks } from './hub-spooky.js';
import { calmFx } from './prefs.js';
import { playSound, playCry, setLoop } from './audio.js';
import { buddy, deviceNews } from './trainercard.js';
import { loadThree, tex, dispose, MON_PX, monBoard, drawMon, onSprite, createPost, curtain } from './hd2d.js';
import { makeGate, gateHp, gateReady } from './gate.js';
import { isStarterUnlocked } from './progress.js';
import { STARTERS_BY_ID } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { safariOpen, safariUnlockProgress } from './data/pokedex.js';
import { towerOpen } from './data/tower.js';
import { smoothIcon, roundKey } from './smooth-icons.js';
import { vistaArt, VISTA } from './hub-vista.js';
import { pcModel, livePc } from './hub-pc.js';
import { unclaimed } from './mail.js';
import { patchUnseen } from './patchnotes.js';
import { setHpBar, confirmDialog, refreshCoins } from './ui.js';

const COLS = 13, ROWS = 12;   // the walkable grid, tile (0, 0) at the back left
const M = 4, FRONT = 7;       // grass and forest round it (tiles): back and sides, and in front, down to the gate and past it
// the Whispering Clearing's gate across the front (the user's ask, 2026-10-09): its fence closes the hub off, the trail
// leaves under its arch, and setting out on a run walks your partner through it and away
const GATE_AT = { tx: 6, ty: ROWS + 4 };
// outside it (the user's ask, 2026-10-09): the gate is only scenery you walk under, New game's Pokéstop stands right of
// the trail and a Pokémon route sign left of it
const STOP_AT = { tx: 8, ty: GATE_AT.ty + 1 }, SIGN_AT = { tx: 4, ty: GATE_AT.ty + 1 };
const TP = 16;                // painted pixels a tile
const START = { x: 6, y: 10 };
const PC_AT = { tx: 9, ty: 10 };
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
// the time of year (js/season.js), fixed for the page load: the trees, ground, light and decorations dress for it
const SEASON = season(), GROUND = groundLook(SEASON, P);

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
// (the Safari road runs on up through its gate, SAFARI_AT, and off the ground's back edge into the view, js/hub-vista.js)
const SAFARI_AT = { tx: 0, ty: -3 };
// the Sky Pillar back in the right corner the same way, its doorway onto a strip of meadow (the user's ask, 2026-10-09)
const PILLAR_AT = { tx: 13, ty: -3 };
const PATHS = [[[6, 3], [6, ROWS + FRONT + 1]], [[1, 4], [11, 4]], [[1, 4], [1, 2]], [[1, 2], [0, 1]], [[0, 1], [0, -M - 0.6]], [[11, 4], [11, 2]], [[11, 2], [13, 0]], [[13, 0], [13, PILLAR_AT.ty + 1]], [[-1, 9.5], [-1, 10]], [[-1, 10], [6, 10]]];

let THREE, renderer, scene, camera, post, root, view, screen, acts, dexBtn;
let hemi, sun, ring, ground, forest, placeGroup, vista = null;
let mon = null, walker = { x: 0, z: 0, tile: START, path: [], facing: 'front', flip: false, hop: 0 };
let places = [], blocked = new Set(), aim = null, here = null, card, bar, barKey = null, barCoins = null, saved = null;
let glowMats = [], lamps = [], bugs = null, flyer = null, nextFly = 0, stepAt = 0, airAt = 0, tree = null, sign = null, inside = null, entering = null, leaving = null;   // inside: the place walked into, 'base' or 'mall'
let stops = {}, calm = false, time = '', running = false, last = 0, fpsLog = [], camX = 0, camZ = 0, fpsEl = null, gateArt = null;
let built = null;   // the promise of the first build
let seasonMats = [], snow = null;   // the season's lit decorations (kept apart from glowMats, which buildPlaces() remakes) and its snowfall
let yardTiles = new Set(), spooks = null;   // the tiles the season's decorations stand on (nothing walks through them), and Halloween's ghosts
let pcMail = null;  // the envelope bobbing over the PC while its mailbox has a letter (js/mail.js)
let pcNews = null;  // else a yellow "!" while this device hasn't read the newest patch notes (js/patchnotes.js)
let placed = false; // the partner has been put on the plaza once
let greets = false; // listening for the logo's fade to end
let held = false;   // drawn behind the shut Pokédex, waiting for enterHub(): no partner, no keys, no taps
let arriving = false;   // walking in from the bottom of the screen (enterHub())
let showing = null; // a showHub() under way, so two calls at once never build two partners
let outbound = null, returning = false;   // walking out under the gate to a run (walkOut()), and back in from one

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

function bushArt(seed, pal = P.trees) {
  const rnd = seeded(seed), a = art(30, 20);
  blobs(a, [[10, 12, 8], [19, 11, 9], [15, 7, 7]], pal, rnd);
  if (rnd() < 0.6) for (let i = 0; i < 4; i++) { const [x, y] = [6 + Math.floor(rnd() * 18), 6 + Math.floor(rnd() * 8)]; a.dot(x, y, '#f04858', 2, 2); a.dot(x, y, '#f8c8d0'); }
  return a.c;
}

/** The ground: meadow grass, blades and flowers, the dirt paths and the plaza, and a soft dark rim under the forest. */
function groundArt() {
  const W = (COLS + 2 * M) * TP, H = (ROWS + M + FRONT) * TP, a = art(W, H), rnd = seeded(7);
  const img = a.g.createImageData(W, H), d = img.data;
  const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  const meadow = GROUND.meadow.map(rgb), dirt = GROUND.path.map(rgb);
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
      if (GROUND.snowy) c = mix(c, [244, 248, 252], smooth(x + 40, y + 17, 4) > 0.6 ? 0.55 : 0.1);   // trodden snow
    } else {
      // darker away from the walkable ground, towards the trees
      // (not down the left, cleared round the Safari gate and the Poké Mall)
      const out = Math.max(-u - 0.5, u - (COLS - 0.5), -v - 0.5, v - GATE_AT.ty - 0.2, 0) * (u < 2.5 && v < GATE_AT.ty - 1 ? 0.2 : 1);
      const n = smooth(x, y, 6) * 3.2 + hash(x, y) * 1.4 + (path < 0.12 ? 1 : 0) + Math.min(2, out * 0.6);
      c = meadow[Math.min(5, Math.max(0, Math.floor(n)))];
    }
    const i = (y * W + x) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  a.g.putImageData(img, 0, 0);
  const onPath = (x, y) => { const u = x / TP - M - 0.5, v = y / TP - M - 0.5; return Math.min(...PATHS.map(s => seg(u, v, s))) < 0.7 || Math.hypot(u - START.x, v - START.y) < 1.9; };
  const blade = GROUND.blade;
  if (blade) for (let i = 0; i < 900; i++) {   // blades
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H);
    if (onPath(x, y)) continue;
    a.dot(x, y, blade[2], 1, 1); a.dot(x, y - 1, blade[1]); a.dot(x, y - 2, blade[0]);
  }
  if (GROUND.leaves) for (let i = 0; i < 1400; i++) {   // fallen leaves, on the paths too
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H), col = GROUND.leaves[Math.floor(rnd() * GROUND.leaves.length)];
    a.dot(x, y, col, 2, 1); if (rnd() < 0.5) a.dot(x + (rnd() < 0.5 ? 0 : 1), y + 1, col);
  }
  if (GROUND.flowers.length) for (let i = 0; i < 70; i++) {   // flowers, in little clumps
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H), [petal, eye] = GROUND.flowers[Math.floor(rnd() * 4)];
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

/** The Safari Zone's gate, smooth, the lobby's own (js/safari-lobby.js; the user's call, 2026-10-09): two peeled log posts
    on stone feet, a green board with a Safari Ball and SAFARI ZONE, a thatched roof over it with a bound ridge, paper
    lanterns under the board lit at dusk; the opening between the posts is clear, so the road shows going on through it.
    Shut, a rope across it with a CLOSED tag. */
function safariArt(open) {
  const W = 64, H = 62, { c, g, fill, rr, lin, shine } = fine(W, H, 10), rnd = seeded(7), glow = shine();
  const WD = ['#e4b070', '#b87c48', '#8a5a30', '#5a3418'];
  for (const x of [7, 49]) {   // the posts: peeled logs, their grain, a knot, a rope lashing, a stone foot
    rr(x, 18, 8, 42, 2, lin(x, 0, x + 8, 0, [WD[0], WD[1], WD[1], WD[2], WD[3]]));
    for (let y = 24; y < 57; y += 5.5) strokeOn(g, 'rgba(74,40,16,0.35)', 0.32, () => { g.moveTo(x + 1, y); g.quadraticCurveTo(x + 4, y + 1.4, x + 7, y); });
    fill('rgba(70,40,16,0.55)', () => g.ellipse(x + 3 + rnd() * 2, 40 + rnd() * 10, 0.8, 1.2, 0, 0, Math.PI * 2));
    for (let i = 0; i < 3; i++) rr(x - 0.4, 33 + i * 1.1, 8.8, 0.95, 0.45, lin(0, 33 + i * 1.1, 0, 34 + i * 1.1, ['#f4e2aa', '#b8965a']));
    rr(x - 2, 57, 12, 5, 2, lin(0, 57, 0, 62, [P.stone[0], P.stone[1], P.stone[2]]));
    rr(x - 1.2, 57.4, 10.4, 0.7, 0.35, 'rgba(255,255,255,0.5)');
  }
  const ivy = [];   // ivy up the left post
  for (let y = 58; y > 38; y -= 2) ivy.push([8.6 + Math.sin(y * 0.5) * 1.6, y]);
  strokeOn(g, '#3a7a30', 0.4, () => { g.moveTo(...ivy[0]); ivy.forEach(p => g.lineTo(...p)); });
  ivy.forEach(([x, y], i) => leaf(g, x, y, i % 2 ? -0.5 : Math.PI + 0.5, 1.7 + rnd() * 0.6, P.moss[i % 2]));

  // the board, its frame, the Safari Ball, SAFARI ZONE
  rr(3.4, 17.6, 58, 15, 3, 'rgba(0,0,0,0.25)');
  rr(2.4, 16.6, 59.2, 15, 3, lin(0, 16.6, 0, 31.6, [WD[1], WD[3]]));
  rr(3.6, 17.8, 56.8, 12.6, 2.2, lin(0, 17.8, 0, 30.4, ['#7ad868', '#34963a', '#1e6a26']));
  rr(5, 18.6, 54, 1, 0.5, 'rgba(255,255,255,0.35)');
  const bx = 11.4, by = 24.1, br = 4.3;
  g.save(); g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#f4eed4'; g.fillRect(bx - br, by, br * 2, br);
  g.fillStyle = lin(0, by - br, 0, by, ['#a8d858', '#5a9a30']); g.fillRect(bx - br, by - br, br * 2, br);
  for (const [dx, dy, r] of [[-0.45, -0.5, 0.2], [0.35, -0.6, 0.16], [0.05, -0.28, 0.13]]) fill('#3a7a28', () => g.arc(bx + dx * br, by + dy * br, r * br, 0, Math.PI * 2));
  g.fillStyle = '#202018'; g.fillRect(bx - br, by - 0.4, br * 2, 0.8);
  g.restore();
  strokeOn(g, '#202018', 0.55, () => g.arc(bx, by, br, 0, Math.PI * 2));
  fill('#ffffff', () => g.arc(bx, by, br * 0.3, 0, Math.PI * 2));
  strokeOn(g, '#202018', 0.45, () => g.arc(bx, by, br * 0.3, 0, Math.PI * 2));
  fill('rgba(255,255,255,0.55)', () => g.ellipse(bx - 1.6, by - 2.2, 1, 0.6, -0.5, 0, Math.PI * 2));
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 7.6px "Trebuchet MS", "Arial Black", sans-serif';
  g.fillStyle = 'rgba(16,60,24,0.7)'; g.fillText('SAFARI', 36.4, 22.9);
  g.fillStyle = '#fbf8e4'; g.fillText('SAFARI', 36, 22.5);
  g.font = '800 3.2px "Trebuchet MS", sans-serif';
  g.fillStyle = '#f8d848'; g.fillText('Z O N E', 36, 28);
  for (const x of [27, 45]) {   // pawprints either side of ZONE
    fill('rgba(248,216,72,0.85)', () => g.ellipse(x, 28.4, 0.8, 0.65, 0, 0, Math.PI * 2));
    for (const dx of [-0.8, 0, 0.8]) fill('rgba(248,216,72,0.85)', () => g.arc(x + dx, 27.2 - (dx ? 0 : 0.3), 0.34, 0, Math.PI * 2));
  }
  fill('#c8e8a8', () => g.arc(57.4, 24.1, 0.8, 0, Math.PI * 2));

  // the thatch, a bound ridge along its top and a ragged eave
  const roof = () => {
    g.moveTo(-0.2, 17.4); g.quadraticCurveTo(6, 9, 20, 3.4); g.lineTo(44, 3.4); g.quadraticCurveTo(58, 9, 64.2, 17.4);
    for (let x = 64; x > 0; x -= 2) g.lineTo(x - 1, 17.4 + (x % 4 ? 1.4 : 0.4) + Math.sin(x) * 0.3);
    g.closePath();
  };
  fill('rgba(0,0,0,0.25)', () => g.rect(3, 16.6, 58, 1.6));
  fill(lin(0, 0, W, 0, ['#f4cc78', '#e2b260', '#d09848', '#8a5a28']), roof);
  g.save(); g.beginPath(); roof(); g.clip();
  for (let x = -6; x < 70; x += 1.1) {   // straw
    const top = 3 + Math.abs(x - 32) * 0.12;
    strokeOn(g, `rgba(${rnd() < 0.5 ? '122,74,32' : '255,236,170'},${0.25 + rnd() * 0.3})`, 0.22, () => { g.moveTo(32 + (x - 32) * 0.55, top); g.quadraticCurveTo(32 + (x - 32) * 0.8, 12, 32 + (x - 32) * 1.02, 19); });
  }
  for (const y of [8.5, 13]) strokeOn(g, 'rgba(110,64,24,0.45)', 0.4, () => { g.moveTo(0, y + 4); g.quadraticCurveTo(32, y - 2.6, 64, y + 4); });
  g.fillStyle = lin(0, 12, 0, 19, ['rgba(60,30,10,0)', 'rgba(60,30,10,0.35)']); g.fillRect(0, 12, W, 8);
  g.restore();
  strokeOn(g, 'rgba(90,56,24,0.85)', 0.45, roof);
  rr(17, 1.4, 30, 3.6, 1.8, lin(0, 1.4, 0, 5, ['#e8bc6c', '#b07a38', '#7a4c1e']));   // the ridge bundle, tied
  for (const x of [21, 27, 32, 37, 43]) rr(x - 0.45, 1.2, 0.9, 4, 0.4, '#6a4018');

  for (const x of [20, 44]) {   // paper lanterns hanging under the board, lit at dusk
    strokeOn(g, '#3a2410', 0.3, () => { g.moveTo(x, 31.4); g.lineTo(x, 33.4); });
    rr(x - 1.3, 33.2, 2.6, 0.8, 0.35, '#3a2410');
    const body = (gg) => { gg.beginPath(); gg.ellipse(x, 36.6, 2.1, 2.9, 0, 0, Math.PI * 2); };
    g.fillStyle = lin(x - 2, 0, x + 2, 0, ['#ffd890', '#f8a048', '#c86020']); body(g); g.fill();
    glow.fillStyle = '#ffb060'; body(glow); glow.fill();
    for (const rx of [0.7, 1.5]) strokeOn(g, 'rgba(120,50,10,0.45)', 0.2, () => g.ellipse(x, 36.6, rx, 2.9, 0, 0, Math.PI * 2));
    fill('rgba(255,245,210,0.6)', () => g.ellipse(x - 0.8, 35.6, 0.5, 1, 0, 0, Math.PI * 2));
    rr(x - 1.1, 39.3, 2.2, 0.7, 0.3, '#3a2410');
    strokeOn(g, '#f8d048', 0.35, () => { g.moveTo(x, 40); g.lineTo(x, 41.6); });
  }

  for (const x of [5, 16, 48, 59]) tuft(g, x, 61.6, 9, rnd);
  for (const [x, y, p] of [[3, 60.6, '#ffffff'], [17.5, 60.8, '#f8e048'], [47, 60.6, '#f8a0c8'], [60.5, 60.9, '#ffffff']]) blossom(g, x, y, 0.5, p, '#f89830');

  if (!open) {   // a rope across, a CLOSED tag hanging off it
    const rope = () => { g.moveTo(15, 44); g.quadraticCurveTo(32, 51, 49, 44); };
    strokeOn(g, '#f4ecd8', 1, rope);
    g.setLineDash([1.1, 1.1]); strokeOn(g, '#e04030', 1, rope); g.setLineDash([]);
    for (const x of [15, 49]) fill('#9a9aa6', () => g.arc(x, 44, 0.65, 0, Math.PI * 2));
    strokeOn(g, '#5a3a1c', 0.22, () => { g.moveTo(28.6, 48.6); g.lineTo(32, 47.6); g.lineTo(35.4, 48.6); });
    rr(27.6, 48.4, 8.8, 4, 0.7, lin(0, 48.4, 0, 52.4, [WD[0], WD[1]]));
    g.font = '900 2.1px "Trebuchet MS", sans-serif'; g.fillStyle = '#a02818'; g.fillText('CLOSED', 32, 50.5);
  }
  return c;
}

/** The fence either side of the gate, the lobby's: round log posts and two rails, from `x0` to `x1` along `z`. */
function safariFence(g, x0, x1, z) {
  const wood = new THREE.MeshStandardMaterial({ color: '#b87c48', roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: '#8a5a30', roughness: 0.9 });
  const add = (mesh, x, y, zz) => { mesh.position.set(x, y, zz); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); return mesh; };
  const n = Math.max(1, Math.round((x1 - x0) / 1.1)), post = new THREE.CylinderGeometry(0.075, 0.085, 0.78, 10);
  for (let i = 0; i <= n; i++) add(new THREE.Mesh(post, wood), x0 + (x1 - x0) * i / n, 0.39, z);
  for (const y of [0.34, 0.62]) add(new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), 0.08, 0.06), dark), (x0 + x1) / 2, y, z + 0.06);
}

/** The Whispering Clearing's gate across the front (the user's ask, 2026-10-09), smooth like the Safari's: two mossy log
    posts on stone feet under a torii-like beam whose ends sweep up, a second beam below, a hanging board saying
    WHISPERING CLEARING, a leafy garland, and wind chimes either side (the whispering) that glow at dusk. The opening is
    clear, so the trail and your partner show going on through it. */
function clearingGateArt() {
  const W = 60, H = 66, { c, g, fill, rr, lin, shine } = fine(W, H, 10), rnd = seeded(13), glow = shine();
  const WD = ['#d8a868', '#a87440', '#7a4e26', '#4a2c12'];
  for (const x of [7, 46]) {   // the posts: logs with grain and moss, a stone foot
    rr(x, 14, 7, 47, 2, lin(x, 0, x + 7, 0, [WD[0], WD[1], WD[1], WD[2], WD[3]]));
    for (let y = 20; y < 58; y += 5) strokeOn(g, 'rgba(70,38,14,0.35)', 0.3, () => { g.moveTo(x + 1, y); g.quadraticCurveTo(x + 3.5, y + 1.3, x + 6, y); });
    fill('rgba(66,38,14,0.55)', () => g.ellipse(x + 2.5 + rnd() * 2, 36 + rnd() * 12, 0.7, 1.1, 0, 0, Math.PI * 2));
    for (let i = 0; i < 7; i++) fill(i % 2 ? 'rgba(120,180,80,0.8)' : 'rgba(80,140,60,0.8)', () => g.ellipse(x + 0.6 + rnd() * 5.8, 52 + rnd() * 8, 1.4, 0.9, 0, 0, Math.PI * 2));
    rr(x - 2, 60, 11, 5, 2, lin(0, 60, 0, 65, [P.stone[0], P.stone[1], P.stone[2]]));
    rr(x - 1.2, 60.4, 9.4, 0.7, 0.35, 'rgba(255,255,255,0.5)');
  }
  const vine = (x0, dir) => {   // ivy climbing each post
    const pts = [];
    for (let y = 61; y > 24; y -= 2) pts.push([x0 + Math.sin(y * 0.45 * dir) * 1.8, y]);
    strokeOn(g, '#3a7a30', 0.4, () => { g.moveTo(...pts[0]); pts.forEach(p => g.lineTo(...p)); });
    pts.forEach(([x, y], i) => leaf(g, x, y, i % 2 ? -0.5 : Math.PI + 0.5, 1.6 + rnd() * 0.7, P.moss[i % 2]));
  };
  vine(9.5, 1); vine(50.5, -1);

  // the lower beam, through both posts
  rr(3, 17, 54, 4, 1, lin(0, 17, 0, 21, [WD[0], WD[1], WD[2]]));
  rr(3.6, 17.4, 52.8, 0.7, 0.35, 'rgba(255,240,200,0.5)');
  // the top beam, its ends sweeping up
  const top = () => {
    g.moveTo(-0.5, 4.5); g.quadraticCurveTo(14, 9.4, 30, 9.4); g.quadraticCurveTo(46, 9.4, 60.5, 4.5);
    g.lineTo(60.5, 8); g.quadraticCurveTo(46, 13.6, 30, 13.6); g.quadraticCurveTo(14, 13.6, -0.5, 8); g.closePath();
  };
  fill('rgba(0,0,0,0.22)', () => g.rect(4, 13.4, 52, 1.2));
  fill(lin(0, 4, 0, 14, ['#6a4a2e', '#4a2c16', '#2e1a0a']), top);
  strokeOn(g, 'rgba(255,230,180,0.35)', 0.4, () => { g.moveTo(0, 5.2); g.quadraticCurveTo(14, 10, 30, 10); g.quadraticCurveTo(46, 10, 60, 5.2); });
  fill('#3a7a30', () => g.ellipse(9, 9.4, 3.6, 1.1, 0.25, 0, Math.PI * 2));   // moss on the beam
  fill('#5a9a40', () => g.ellipse(51, 9.6, 3, 1, -0.25, 0, Math.PI * 2));

  // the garland draped along the lower beam
  for (const [a, b] of [[4, 18], [42, 56]]) {
    const pts = [];
    for (let t = 0; t <= 1; t += 0.08) pts.push([a + (b - a) * t, 21 + Math.sin(t * Math.PI) * 3.4]);
    strokeOn(g, '#2e6a28', 0.35, () => { g.moveTo(...pts[0]); pts.forEach(p => g.lineTo(...p)); });
    pts.forEach(([x, y], i) => leaf(g, x, y, Math.PI / 2 + (i % 2 ? 0.7 : -0.7), 1.5 + rnd() * 0.6, P.moss[i % 2]));
    blossom(g, (a + b) / 2, 24.2, 0.5, '#f8f0f8', '#f8d848');
  }

  // the hanging board between the beams, WHISPERING CLEARING
  rr(16, 10.6, 28, 11.4, 1.8, 'rgba(0,0,0,0.25)');
  rr(15.4, 10, 29.2, 11.4, 1.8, lin(0, 10, 0, 21.4, [WD[1], WD[3]]));
  rr(16.5, 11.1, 27, 9.2, 1.2, lin(0, 11.1, 0, 20.3, ['#7cc6c0', '#3e8a90', '#24606a']));
  rr(17.6, 11.7, 24.8, 0.8, 0.4, 'rgba(255,255,255,0.35)');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 4.2px "Trebuchet MS", "Arial Black", sans-serif';
  g.fillStyle = 'rgba(10,40,44,0.7)'; g.fillText('WHISPERING', 30.3, 15.1);
  g.fillStyle = '#fbf8e4'; g.fillText('WHISPERING', 30, 14.8);
  g.font = '800 2.4px "Trebuchet MS", sans-serif';
  g.fillStyle = '#f8e070'; g.fillText('C L E A R I N G', 30, 18.4);
  for (const x of [19.4, 40.6]) leaf(g, x, 18.4, x < 30 ? Math.PI : 0, 1.6, '#a8e070');

  // wind chimes hung under the lower beam, a glass bell, three rods and a paper strip each; they catch the light at dusk
  for (const [x, len] of [[18.5, 1], [41.5, 0.85]]) {
    strokeOn(g, '#3a2410', 0.25, () => { g.moveTo(x, 21); g.lineTo(x, 24); });
    const bell = (gg) => { gg.beginPath(); gg.moveTo(x - 2, 27); gg.quadraticCurveTo(x - 2, 23.6, x, 23.6); gg.quadraticCurveTo(x + 2, 23.6, x + 2, 27); gg.closePath(); };
    g.fillStyle = lin(x - 2, 0, x + 2, 0, ['#e8fbff', '#9ce0f0', '#5ab0d0']); bell(g); g.fill();
    glow.fillStyle = '#a8e8ff'; bell(glow); glow.fill();
    fill('rgba(255,255,255,0.7)', () => g.ellipse(x - 0.9, 25, 0.35, 0.9, 0, 0, Math.PI * 2));
    for (const [dx, l] of [[-1.2, 5], [0, 6.4], [1.2, 4.4]]) {
      strokeOn(g, '#c8e8f0', 0.4, () => { g.moveTo(x + dx, 27); g.lineTo(x + dx, 27 + l * len); });
      strokeOn(glow, '#6a9aa8', 0.4, () => { glow.moveTo(x + dx, 27); glow.lineTo(x + dx, 27 + l * len); });
    }
    strokeOn(g, '#3a2410', 0.2, () => { g.moveTo(x, 27); g.lineTo(x, 34 * len + 4); });
    rr(x - 0.9, 34 * len + 4, 1.8, 4.6, 0.3, lin(0, 0, 0, 1, ['#f8f0d8', '#f8f0d8']));
    rr(x - 0.9, 34 * len + 4, 1.8, 0.9, 0.3, '#e05848');
  }

  for (const x of [4, 15, 45, 57]) tuft(g, x, 65.6, 9, rnd);
  for (const [x, y, p] of [[2.5, 64.6, '#ffffff'], [16.5, 64.8, '#b0a0f8'], [44, 64.6, '#f8a0c8'], [58, 64.9, '#f8e048']]) blossom(g, x, y, 0.5, p, '#f89830');
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
    warm room; `boarded` (not bought yet) nails two planks across it. */
function ancientArt(open = false, boarded = false) {
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
    if (boarded) for (const [y, a] of [[dtop + 22, -0.32], [dtop + 30, 0.28]]) {   // not yours yet: two planks nailed across
      g.save(); g.translate(dx + dw / 2, y); g.rotate(a);
      rr(-dw / 2 - 3, -2, dw + 6, 4, 0.5, lin(0, -2, 0, 2, ['#b08458', '#7a5432', '#4a3018']));
      strokeOn(g, 'rgba(40,22,8,0.45)', 0.25, () => { g.moveTo(-dw / 2, -0.6); g.lineTo(dw / 2 - 2, -0.4); g.moveTo(-dw / 2 + 4, 0.9); g.lineTo(dw / 2 + 1, 1); });
      for (const nx of [-dw / 2 - 1, dw / 2 + 1]) fill('#9a9aa8', () => g.arc(nx, 0, 0.55, 0, Math.PI * 2));
      g.restore();
    }
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

/** The Secret Base's "Home" sign over its door (the user's asks, 2026-10-08). Locked (`fixed` false) it's weathered,
    cracked and mossy, its right end snapped off, hanging off one nail by a frayed rope, and liveSign() swings it left and
    right; bought, it's whole again, nailed up level with a vine of leaves and blossoms along its top. SIGN_NAIL is the
    rope's nail, the pivot, in painted pixels. */
function homeSignArt(fixed = false) {
  const W = 28, H = 17, { c, g, fill, lin } = fine(W, H, 10), rnd = seeded(fixed ? 9 : 7), top = 6.4;
  const whole = () => {
    g.moveTo(1, top); g.lineTo(27, top - 0.2); g.quadraticCurveTo(27.6, top + 4.4, 27, top + 8.8); g.lineTo(1, top + 9); g.quadraticCurveTo(0.4, top + 4.6, 1, top); g.closePath();
  };
  const snapped = () => {
    g.moveTo(1, top); g.lineTo(22.6, top - 0.1); g.lineTo(24, top + 1.8); g.lineTo(22.4, top + 3.2); g.lineTo(24.6, top + 5);
    g.lineTo(23, top + 6.8); g.lineTo(23.8, top + 8.7); g.lineTo(1, top + 9); g.quadraticCurveTo(0.4, top + 4.6, 1, top); g.closePath();
  };
  const path = fixed ? whole : snapped, [nx, ny] = SIGN_NAIL;
  if (!fixed) {   // the rope: one side whole, the other frayed thin
    strokeOn(g, '#b89868', 0.55, () => { g.moveTo(nx, ny); g.lineTo(4, top + 0.6); });
    strokeOn(g, '#a08050', 0.3, () => { g.moveTo(nx, ny); g.lineTo(20, top + 0.4); });
    strokeOn(g, '#c8a878', 0.15, () => { g.moveTo(17.4, top - 1.4); g.lineTo(18.6, top - 0.6); g.moveTo(17.8, top - 1.6); g.lineTo(18.2, top - 2.2); });
  }
  fill('rgba(20,10,4,0.4)', () => { g.save(); g.translate(0.4, 0.6); path(); g.restore(); });
  fill(lin(0, top, 0, top + 9, fixed ? ['#e0b47a', '#c08a50', '#94643a'] : ['#b08a5a', '#8a6440', '#5e4026']), path);
  g.save(); g.beginPath(); path(); g.clip();
  for (const y of [top + 3, top + 6]) fill(fixed ? 'rgba(90,52,22,0.45)' : 'rgba(50,28,10,0.6)', () => g.rect(0, y, W, 0.3));   // three planks
  for (let i = 0; i < 20; i++) {
    const x = rnd() * 25 + 1.5, y = top + 0.4 + rnd() * 8, rx = 2 + rnd() * 2;
    fill(`rgba(70,40,16,${fixed ? 0.18 : 0.32})`, () => g.ellipse(x, y, rx, 0.12, 0, 0, Math.PI * 2));
  }
  if (!fixed) {
    strokeOn(g, '#2a1608', 0.35, () => { g.moveTo(15.6, top); g.lineTo(16.6, top + 2.4); g.lineTo(15.8, top + 4.2); g.lineTo(17.2, top + 6.6); });   // a crack
    for (let i = 0; i < 9; i++) { const x = 1.5 + i * 1.6 + rnd(), y = top + 0.2 + rnd() * 0.5, r = 1 + rnd() * 0.5; fill('rgba(104,166,66,0.85)', () => g.ellipse(x, y, r, 0.55, 0, 0, Math.PI * 2)); }   // moss
    fill('rgba(30,16,6,0.35)', () => g.ellipse(9, top + 7.8, 3, 0.8, 0, 0, Math.PI * 2));   // a water stain
  }
  g.restore();
  const tx = fixed ? 14 : 12.4, ty = top + 4.8;
  g.font = '900 6.6px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 0.9; g.strokeStyle = fixed ? '#4a2a10' : '#2e1a0a'; g.strokeText('Home', tx, ty);
  g.fillStyle = fixed ? '#fff4d8' : '#e4d0a4'; g.fillText('Home', tx, ty);
  if (!fixed) fill('rgba(100,70,40,0.9)', () => g.rect(16.2, ty - 1.6, 1.4, 1.8));   // a letter flaked off
  const nail = (x, y) => { fill('#9a9aa8', () => g.arc(x, y, 0.6, 0, Math.PI * 2)); fill('#e0e0ea', () => g.arc(x - 0.2, y - 0.2, 0.22, 0, Math.PI * 2)); };
  if (fixed) {
    nail(3, top + 1.4); nail(25, top + 1.4);
    const pts = [];
    for (let x = 2; x <= 26; x += 1.2) pts.push([x, top + Math.sin(x * 0.7) * 0.5]);
    strokeOn(g, '#2e6a2a', 0.3, () => { g.moveTo(...pts[0]); pts.forEach(p => g.lineTo(...p)); });
    pts.forEach(([x, y], i) => leaf(g, x, y, i % 2 ? -0.6 : Math.PI + 0.6, 1.3, i % 3 ? '#58b04a' : '#8ad468'));
    for (const x of [6, 14, 22]) blossom(g, x, top - 0.1, 0.5, x === 14 ? '#f8c8e0' : '#ffffff', '#f8d848');
  } else nail(nx, ny);
  return c;
}
const SIGN_NAIL = [14, 1.2];

const KIT = { white: '#f6f8fb', pale: '#e2e6ee', grey: '#bcc3cf', dark: '#8a92a0', ink: '#3a3e4c', red: '#e84838', redDark: '#b8302a' };
const FINE = 12;   // a smooth painting's pixels per painted pixel

/** A smooth painting (the user's call: the notice boards, then the Safari gate, the Sky Pillar and the Ancient Tree,
    aren't pixel art), drawn in painted-pixel units, `k` times finer; board() shows it the same size as a pixel one.
    shine() is its emissive map, painted alongside (mask() matches exact pixel colours, which smooth edges never are). */
export function fine(w, h, k = FINE) {
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
/** three.js for this file's painters when the Clearing hasn't been built (the mall opened straight from ?mall). */
export async function hubThree() { THREE ??= await loadThree(); }

export function texOf(canvas) {
  const map = tex(canvas);
  if (canvas.fine) { map.magFilter = THREE.LinearFilter; map.minFilter = THREE.LinearMipmapLinearFilter; map.generateMipmaps = true; map.anisotropy = 4; }
  return map;
}

/** The PC's "you've got mail": a cream envelope in a white bubble with a red dot, like a phone's badge. */
/** The "!" over the PC: the yellow bubble every Home key wears for news (.dex-news), a point at its foot. */
function newsArt() {
  const { c, g, fill, rr } = fine(10, 13, 10);
  fill('#5a3a00', () => g.arc(5, 5, 4.6, 0, Math.PI * 2));
  fill('#5a3a00', () => { g.moveTo(3.4, 8.6); g.lineTo(5, 12.4); g.lineTo(6.6, 8.6); });
  fill('#ffd23a', () => g.arc(5, 5, 3.8, 0, Math.PI * 2));
  fill('#ffd23a', () => { g.moveTo(3.9, 8.2); g.lineTo(5, 11); g.lineTo(6.1, 8.2); });
  fill('rgba(255, 255, 255, 0.55)', () => g.ellipse(3.6, 3, 1.4, 0.8, -0.6, 0, Math.PI * 2));
  rr(4.3, 2.2, 1.4, 3.6, 0.7, '#3a2400');
  fill('#3a2400', () => g.arc(5, 7.2, 0.8, 0, Math.PI * 2));
  return c;
}

function mailArt() {
  const { c, g, fill, rr } = fine(14, 13, 10);
  rr(0.5, 0.5, 13, 10, 3, '#3a4a6a');
  rr(1.2, 1.2, 11.6, 8.6, 2.4, '#ffffff');
  fill('#3a4a6a', () => { g.moveTo(5.5, 10.4); g.lineTo(7, 12.6); g.lineTo(8.5, 10.4); });
  rr(3, 3, 8, 5.4, 0.8, '#f4dca4');
  g.strokeStyle = '#b88a3a'; g.lineWidth = 0.5;
  g.beginPath(); g.moveTo(3.2, 3.3); g.lineTo(7, 6.2); g.lineTo(10.8, 3.3); g.stroke();
  fill('#e8403a', () => g.arc(11.4, 2.6, 2, 0, Math.PI * 2));
  return c;
}

/** The Safari's board, Scarlet / Violet's roadside kiosk: a white frame on arched legs under a ribbed, curved roof, a
    poster with a red header and three snapshots of today's catches. */
function kioskArt(K = KIT) {
  const { c, g, fill, rr, lin } = fine(22, 32);
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
  fill(KIT.red, () => g.arc(6.4, 11, 0.85, Math.PI, 0));
  g.strokeStyle = K.ink; g.lineWidth = 0.22;
  g.beginPath(); g.arc(6.4, 11, 0.85, 0, Math.PI * 2); g.moveTo(5.55, 11); g.lineTo(7.25, 11); g.stroke();
  fill(K.white, () => g.arc(6.4, 11, 0.28, 0, Math.PI * 2));
  rr(8, 10.6, 7.5, 0.7, 0.35, 'rgba(255,255,255,0.75)');
  [[5.5, 4], [10, 3], [13.5, 3]].forEach(([x, w]) => rr(x, 13.2, w, 1.1, 0.55, K.ink));   // a headline
  (K.shots || ['#58b860', '#f8d848', '#6ab0e0']).forEach((col, i) => {   // the snapshots, with captions
    const x = 5.4 + i * 4;
    rr(x, 15.6, 3.2, 3.2, 0.5, lin(x, 15.6, x + 3.2, 18.8, ['#ffffff', col, col]));
    fill('rgba(0,0,0,0.18)', () => g.ellipse(x + 1.6, 17.6, 0.9, 0.7, 0, 0, Math.PI * 2));
    rr(x + 0.2, 19.3, 2.8, 0.6, 0.3, K.grey);
  });
  rr(3, 22.7, 16, 1.8, 0.8, lin(0, 22.7, 0, 24.5, [K.white, K.pale, K.dark]));   // the rail under it
  return c;
}

/** The Sky Pillar's board since 2026-10-09: the Safari's kiosk in the sky's blues (the user's ask). */
const SKY_KIT = { ...KIT, white: '#f2f7ff', pale: '#d4e2f8', grey: '#9cb2d6', dark: '#5e74a0', red: '#3c78d8', redDark: '#24509e', shots: ['#8ad0ff', '#c8b4ff', '#f8e070'] };

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
export function glowing(m, src, colours, colour = '#ffffff', k = 1, list = glowMats) {
  m.emissive = new THREE.Color(colour);
  m.emissiveMap = src.glow ? texOf(src.glow) : tex(mask(src, colours));
  m.userData.glow = k;
  list.push(m);
  return m;
}

/* ---------- the Game Corner's stall, in 3D (now inside the Poké Mall, js/mall-3d.js) ---------- */

// its colours: the awning's red and gold stripes, the booth's violet, the cabinets' lilac chrome
export const GC = { red: '#e84838', redDark: '#a82820', gold: '#f8d040', goldDark: '#c89418', violet: '#5a3a8a', violetDark: '#2e1c4e', chrome: ['#f4f2fa', '#cdc8e0', '#9a92b8'], ink: '#2a2238' };

export const star = (g, x, y, r) => {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  g.closePath(); g.fill();
};
export const words = (g, text, x, y, size, col) => {
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

/** The Game Corner, built (the user's call, 2026-10-08: 3D, smooth; since the same day a booth inside the Poké Mall): a violet booth on a
    wooden deck, two slot machines with their stools, a striped awning sloping out over them with a row of bulbs under
    its hem, and the GAME CORNER marquee on top. Its lights come up with the evening like the other places'. */
export function cornerStall(glows = glowMats) {
  const W = 2.3, D = 1.3, FRONT_Y = 1.86, BACK_Y = 2.14, OUT = 0.32;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const lit = (colour, k, min) => {
    const m = std({ color: colour, emissive: new THREE.Color(colour), roughness: 0.4 });
    m.userData.glow = k; m.userData.glowMin = min;
    glows.push(m);
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

  const face = slotFaceArt(), faceM = glowing(std({ map: texOf(face), roughness: 0.5 }), face, null, '#fff0c0', 0.9, glows);
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
  const sign = cornerSignArt(), signM = glowing(std({ map: texOf(sign), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 }), sign, null, '#fff0b0', 1.1, glows);
  signM.userData.glowMin = 0.35;
  add(new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.05 * 8 / 28), signM), 0, FRONT_Y + 0.33, D / 2 + OUT - 0.04).receiveShadow = false;
  return g;
}

/* ---------- the Poké Mall, outside ---------- */

// its colours: cream stone, the Poké Mart's red, a blue-white glass that shows the warm shops behind it
const MALL = { cream: '#fbf3e4', stone: '#e6d8bf', shade: '#c8b896', red: '#e84838', redDark: '#a82820', glass: ['#cfe8f8', '#8fbce0', '#5a86b8'], warm: ['#fff2c8', '#ffd890', '#e8a860'], frame: '#4a4458' };
const MU = 20;   // the mall's paintings: units a tile
// on the left, under the Safari gate and a step left of its road, far enough forward that its roof never hides the gate,
// its doors on row 9 over tile -1 where the road from the plaza comes up to them, facing the camera
const MALL_AT = { x: tileX(-1), z: tileZ(8) + 0.25, turn: 0 };

/** A Poké Ball, `r` round, at (x, y). */
function ball(g, x, y, r, ink = '#2a2238') {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = MALL.red; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill();
  g.strokeStyle = ink; g.lineWidth = r * 0.16;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r * 0.32, 0, Math.PI * 2); g.fill(); g.stroke();
}

/** Glass with the shops showing through: the warm light of a lit interior, shelves' silhouettes, a sky glint. */
function shopGlass(f, x, y, w, h, s) {
  const { g, rr, lin } = f;
  rr(x, y, w, h, 0.4, lin(0, y, 0, y + h, [MALL.warm[0], MALL.warm[1], MALL.warm[2]]));
  g.fillStyle = 'rgba(120,70,40,0.28)';
  for (let sx = x + 1; sx < x + w - 2; sx += 5) g.fillRect(sx, y + h * 0.35, 3, h * 0.65);
  g.fillStyle = lin(x, y, x + w, y + h, ['rgba(200,230,255,0.55)', 'rgba(200,230,255,0.05)', 'rgba(200,230,255,0.3)']);
  g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,0.45)';
  g.beginPath(); g.moveTo(x + w * 0.1, y); g.lineTo(x + w * 0.3, y); g.lineTo(x + w * 0.12, y + h); g.lineTo(x, y + h); g.lineTo(x, y + h * 0.6); g.closePath(); g.fill();
  if (s) { s.fillStyle = '#9a7848'; s.fillRect(x, y, w, h); }
}

/** The mall's front: a cream two-storey block, POKé MALL on a white panel under the red cornice, a row of upper windows,
    then a ground floor of shop-lit glass round sliding doors, the Game Corner's violet sign hung in the glass. */
function mallFrontArt(W, H) {
  const f = fine(W, H, 8), { g, rr, lin, shine } = f, s = shine();
  g.fillStyle = lin(0, 0, 0, H, [MALL.cream, MALL.stone]); g.fillRect(0, 0, W, H);
  rr(0, 0, W, 3.2, 0, lin(0, 0, 0, 3.2, [MALL.red, MALL.redDark]));
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(0, 3.2, W, 0.5);
  // the sign
  rr(W * 0.12, 5, W * 0.76, 12, 2, MALL.red);
  rr(W * 0.12 + 0.9, 5.9, W * 0.76 - 1.8, 10.2, 1.4, '#ffffff');
  ball(g, W * 0.12 + 6.5, 11, 3.6);
  words(g, 'POKé MALL', W * 0.55 + 0.25, 11.35, 7, 'rgba(0,0,0,0.25)');
  words(g, 'POKé MALL', W * 0.55, 11, 7, MALL.red);
  s.fillStyle = '#d8d0c0'; s.beginPath(); s.roundRect(W * 0.12 + 0.9, 5.9, W * 0.76 - 1.8, 10.2, 1.4); s.fill();
  ball(s, W * 0.12 + 6.5, 11, 3.6, '#000');
  words(s, 'POKé MALL', W * 0.55, 11, 7, '#ff9080');
  // the upper floor's windows
  const n = 5, gap = 1.6, ww = (W - 4 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const x = 2 + i * (ww + gap);
    rr(x - 0.5, 18.5, ww + 1, 9, 0.6, MALL.shade);
    shopGlass(f, x, 19, ww, 8, s);
  }
  rr(0, 29, W, 2.4, 0, lin(0, 29, 0, 31.4, [MALL.red, MALL.redDark]));
  // the ground floor: glass between dark mullions, the doors in the middle
  const top = 32.5;
  rr(0.8, top, W - 1.6, H - top, 0, MALL.frame);
  const doorW = W * 0.24, dx = (W - doorW) / 2;
  for (const [x0, x1] of [[1.6, dx - 0.8], [dx + doorW + 0.8, W - 1.6]]) {
    const panes = 2, pw = (x1 - x0 - 0.8 * (panes - 1)) / panes;
    for (let i = 0; i < panes; i++) shopGlass(f, x0 + i * (pw + 0.8), top + 0.8, pw, H - top - 1.6, s);
  }
  for (const x of [dx, dx + doorW / 2 + 0.2]) shopGlass(f, x, top + 0.8, doorW / 2 - 0.2, H - top - 0.8, s);
  rr(dx + doorW / 2 - 1.6, top + 9, 0.6, 3, 0.3, '#d8d8e0'); rr(dx + doorW / 2 + 1, top + 9, 0.6, 3, 0.3, '#d8d8e0');
  // the Game Corner's sign, hung inside the glass on the right
  const gx = dx + doorW + 3, gw = W - 1.6 - gx - 1.6;
  rr(gx, top + 3, gw, 5, 1, lin(0, top + 3, 0, top + 8, [GC.gold, GC.goldDark]));
  rr(gx + 0.5, top + 3.5, gw - 1, 4, 0.7, lin(0, top + 3.5, 0, top + 7.5, [GC.violet, GC.violetDark]));
  g.fillStyle = GC.gold; star(g, gx + 2, top + 5.5, 1.2);
  words(g, 'GAME CORNER', gx + gw / 2 + 1, top + 5.6, 2.3, '#ffe36b');
  s.fillStyle = '#ffe890'; star(s, gx + 2, top + 5.5, 1.2);
  words(s, 'GAME CORNER', gx + gw / 2 + 1, top + 5.6, 2.3, '#ffe890');
  return f.c;
}

/** Its sides: the same cream, red cornice and band, two rows of windows. */
function mallSideArt(W, H) {
  const f = fine(W, H, 8), { g, rr, lin, shine } = f, s = shine();
  g.fillStyle = lin(0, 0, 0, H, [MALL.stone, MALL.shade]); g.fillRect(0, 0, W, H);
  rr(0, 0, W, 3.2, 0, lin(0, 0, 0, 3.2, [MALL.red, MALL.redDark]));
  rr(0, 29, W, 2.4, 0, lin(0, 29, 0, 31.4, [MALL.red, MALL.redDark]));
  for (const [y, h] of [[8, 16], [35, H - 40]]) for (let x = 3; x + 9 <= W - 2; x += 13) shopGlass(f, x, y, 9, h, y > 30 ? s : null);
  return f.c;
}

/** The Poké Mall (the user's call, 2026-10-08: the Game Corner's stall grew into a shopping centre, the Game Corner inside
    it): a two-storey block facing you, a glass pyramid on its roof, flags at its corners, a red canopy with bulbs over the
    doors and two potted trees beside them. */
function mallBuilding() {
  const W = 3.5, D = 2.5, H = 2.75;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const g = new THREE.Group();
  const add = (mesh, x, y, z, shadow = true) => { mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = shadow; g.add(mesh); return mesh; };
  const front = mallFrontArt(W * MU, H * MU), side = mallSideArt(D * MU, H * MU);
  const fm = glowing(std({ map: texOf(front), roughness: 0.6 }), front, null, '#fff0d0', 1);
  fm.userData.glowMin = 0.2;
  const sm = glowing(std({ map: texOf(side) }), side, null, '#fff0d0', 0.8);
  const roof = std({ color: '#b8ac98' }), back = std({ color: MALL.shade });
  add(new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [sm, sm, roof, roof, fm, back]), 0, H / 2, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.14, D + 0.12), std({ color: MALL.redDark })), 0, H + 0.07, 0);
  const glass = std({ color: '#bfe4ff', emissive: new THREE.Color('#9fd0ff'), metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.85 });
  glass.userData.glow = 0.5; glass.userData.glowMin = 0.15;
  glowMats.push(glass);
  const dome = add(new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.75, 4), glass), 0, H + 0.14 + 0.375, -0.1);
  dome.rotation.y = Math.PI / 4;
  const pole = std({ color: '#d8d8e0', metalness: 0.5, roughness: 0.3 }), flag = std({ color: MALL.red, side: THREE.DoubleSide });
  for (const sx of [-1, 1]) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), pole), sx * (W / 2 - 0.15), H + 0.14 + 0.45, D / 2 - 0.15);
    add(new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.24), flag), sx * (W / 2 - 0.15) + 0.2, H + 0.14 + 0.75, D / 2 - 0.15, false);
  }
  // the canopy over the doors, bulbs along its edge
  const cw = W * 0.34, cy = 1.18;
  add(new THREE.Mesh(new THREE.BoxGeometry(cw, 0.06, 0.5), [flag, flag, flag, std({ color: '#7a2018' }), flag, flag]), 0, cy, D / 2 + 0.25);
  const bulb = std({ color: '#fff2b0', emissive: new THREE.Color('#fff2b0'), roughness: 0.4 });
  bulb.userData.glow = 1.4; bulb.userData.glowMin = 0.6;
  glowMats.push(bulb);
  const bulbGeo = new THREE.SphereGeometry(0.03, 8, 6);
  for (let i = 0; i <= 6; i++) add(new THREE.Mesh(bulbGeo, bulb), -cw / 2 + (i / 6) * cw, cy - 0.05, D / 2 + 0.5, false);
  // potted trees by the doors
  const pot = std({ color: '#f4f0e8' }), potBand = std({ color: MALL.red }), leaves = std({ color: P.trees[1], roughness: 1 });
  for (const sx of [-1, 1]) {
    const x = sx * (cw / 2 + 0.3), z = D / 2 + 0.28;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.3, 14), pot), x, 0.15, z);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.06, 14), potBand), x, 0.24, z);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.4, 8), std({ color: P.trunk[1] })), x, 0.5, z);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), leaves), x, 0.82, z).scale.y = 1.15;
  }
  // only its doors take a tap (the user's ask, 2026-10-09: a tap meant for the road to the Safari went in); the rest
  // lets it through to the ground
  g.traverse(o => { if (o.isMesh) o.raycast = () => {}; });
  const doorH = H - 32.5 / MU;
  add(new THREE.Mesh(new THREE.BoxGeometry(W * 0.24 + 0.06, doorH + 0.08, 0.5), new THREE.MeshBasicMaterial({ visible: false })), 0, (doorH + 0.08) / 2, D / 2 + 0.25, false);
  return g;
}

/* ---------- the places ---------- */

const gateOpen = () => gateHp() <= 0 && isStarterUnlocked(STARTERS_BY_ID.mewtwo);

/** Every place: where it stands (`tiles` it blocks), its doorstep (`step`), whether it's open, what its card says and
    what it opens, all from the title's own actions (`acts`) and today's save. */
function makePlaces() {
  const save = getSave(), saved = acts.savedRun();
  // a saved run is continued where it was started (the user's call, 2026-10-08): a Safari run at the Safari gate, a
  // climb at the Sky Pillar, any other at the Pokéstop
  const kind = !saved ? null : saved.saved.tower ? 'pillar' : saved.safari ? 'safari' : 'trail';
  const runAt = (id) => (kind === id ? saved : null);
  const waits = (r) => `${r.name} waits in the ${r.place}${r.floor ? `, floor ${r.floor}` : ''}. HP ${r.hp}/${r.maxHp}.`;
  const run = runAt('trail');
  const list = [
    {
      id: 'trail', name: run ? 'Continue / New game' : 'New game', step: { x: STOP_AT.tx - 1, y: STOP_AT.ty }, tiles: [[STOP_AT.tx, STOP_AT.ty]], tag: [STOP_AT.tx, 2.6, STOP_AT.ty],
      open: true,
      line: run ? waits(run) : 'The trail out of the Whispering Clearing: a new adventure.',
      buttons: run ? [['Continue', () => acts.onContinue(run)], ['New game', acts.onNewGame], ['Escape Rope', acts.onAbandon]] : [['New game', acts.onNewGame]],
      // outside the gate on its right, the route sign across the trail from it (the user's ask, 2026-10-09)
      build: (g) => pokestop(g, 'trail', tileX(STOP_AT.tx), tileZ(STOP_AT.ty) - 0.2, 0.7, !!run),
    },
    {
      // the route sign says what the old gate's card did (the user's ask, 2026-10-09); like the Safari gate, no buttons
      id: 'route-sign', name: 'Whispering Clearing', step: { x: SIGN_AT.tx + 1, y: SIGN_AT.ty }, tiles: [[SIGN_AT.tx, SIGN_AT.ty]], tag: [SIGN_AT.tx, 2.6, SIGN_AT.ty],
      open: true,
      line: 'The way out of the Whispering Clearing. Spin the Pokéstop to set out on an adventure.',
      buttons: [],
      build: (g) => g.add(board(routeSignArt(), tileX(SIGN_AT.tx), tileZ(SIGN_AT.ty) - 0.2, { s: 0.85 })),
    },
    {
      id: 'base', name: 'Secret Base', step: { x: 6, y: 3 }, tiles: rect(3, 0, 9, 2), tag: [6, 3.2, 2], open: true,
      line: baseOwned() ? 'A door in the Ancient Tree\'s roots: your Secret Base.'
        : `A boarded-up door in the Ancient Tree's roots. ${BASE_PRICE.toLocaleString()} PokéCoins makes it your Secret Base.`,
      buttons: [[baseOwned() ? 'Go in' : 'Unlock', baseOwned() ? enterBase : buyBase]],
      build: (g) => {
        const shut = ancientArt(false, !baseOwned()), b = board(shut, tileX(6), tileZ(2) + 0.2), open = ancientArt(true);
        glowing(b.material, shut, null, '#ffd890');
        tree = { m: b.material, shut: b.material.map, open: texOf(open) };
        g.add(b);
        // the sign hangs off its nail on the bark over the door, pivoting there (liveSign())
        const art = homeSignArt(baseOwned()), plate = board(art, 0, 0), pivot = new THREE.Group();
        plate.position.set((art.width / art.fine / 2 - SIGN_NAIL[0]) / TP, (SIGN_NAIL[1] - art.height / art.fine / 2) / TP, 0);
        pivot.position.set(tileX(6), 3.62, tileZ(2) + 0.32);
        pivot.add(plate);
        g.add(pivot);
        sign = { pivot, m: plate.material, fixed: baseOwned() ? null : texOf(homeSignArt(true)), fixAt: 0, from: 0, swapped: false };
      },
    },
    {
      // right of the plaza, where your partner starts (2026-10-09): who walks with you, who lives in the base, your name
      id: 'pc', name: 'PC', step: { x: PC_AT.tx, y: PC_AT.ty + 1 }, tiles: [[PC_AT.tx, PC_AT.ty]], tag: [PC_AT.tx, 2.6, PC_AT.ty], open: true,
      get line() { return `${unclaimed().length ? 'You\'ve got mail! ' : patchUnseen() ? 'New patch notes! ' : ''}A PC. Your mail, the patch notes, who walks with you, who lives in your Secret Base, and your name.`; },
      buttons: [['Log on', openPc]],
      build: (g) => {
        const pc = pcModel(THREE, glowMats);
        pcMail = board(mailArt(), tileX(PC_AT.tx), tileZ(PC_AT.ty) + 0.1, { shadow: false });
        pcMail.rotation.x = -PITCH;
        pcMail.userData.y = 2.35;
        pcNews = board(newsArt(), tileX(PC_AT.tx), tileZ(PC_AT.ty) + 0.1, { shadow: false });
        pcNews.rotation.x = -PITCH;
        pcNews.userData.y = 2.35;
        g.add(pcMail, pcNews);
        pcMarks();
        pc.position.set(tileX(PC_AT.tx), 0, tileZ(PC_AT.ty));
        pc.rotation.y = -0.35;   // turned a little, so its right side shows
        g.add(pc);
      },
    },
  ];
  const safari = safariOpen(save) || !!runAt('safari'), safariRun = runAt('safari');
  // you walk right up to the gate (MEADOW), where a small Pokéstop of its own starts or continues the day's run
  // (the user's ask, 2026-10-09)
  // only the Pokéstops start or continue a run (the user's call, 2026-10-09): a tap on the gate or the Pillar itself just
  // walks up and says what it is
  list.push({
    id: 'safari-gate', name: 'Safari Zone', step: { x: 0, y: -2 }, tiles: [], tag: [0, 4, -3], open: safari,
    line: safari ? 'Today\'s Safari Zone run, the same for everyone. Spin the Pokéstop to set out.'
      : `The Safari Zone opens once you've beaten every Pokémon in all three biomes. ${safariUnlockProgress(save)}`,
    buttons: [],
    // back in the left corner, just behind the Ancient Tree, its fence across the cleared meadow (the user's call, 2026-10-09)
    build: (g) => {
      const s = safariArt(safari), S = 1.1, x = tileX(SAFARI_AT.tx), z = tileZ(SAFARI_AT.ty), b = board(s, x, z, { s: S });
      glowing(b.material, s, null, '#ffc890', 0.8);
      g.add(b);
      const half = s.width / s.fine / TP * S / 2, post = (px) => x - half + px / TP * S;
      safariFence(g, VISTA.x0 + 8, post(7), z);
      safariFence(g, post(57), tileX(3.6), z);
    },
  });
  if (safari) list.push({
    id: 'safari', name: 'Safari Pokéstop', step: { x: -1, y: -1 }, tiles: [[-1, -2]], tag: [-1, 2.6, -2], open: true,
    line: safariRun ? waits(safariRun) : 'Today\'s Safari Zone run, the same for everyone. Only the first try counts.',
    buttons: safariRun ? [['Continue', () => acts.onContinue(safariRun)], ['New game', acts.onSafari]] : [['Enter', acts.onSafari]],
    build: (g) => pokestop(g, 'safari', tileX(-1), tileZ(-2), 0.5, !!safariRun),
  });
  // left of the gate, along its fence (the user's ask, 2026-10-09)
  list.push({
    id: 'safari-board', name: 'Safari Ranks', step: { x: -3, y: -1 }, tiles: [[-3, -2]], tag: [-3, 2.6, -2], open: safari,
    line: safari ? 'The Safari Zone\'s notice board: today\'s and yesterday\'s best catches.' : 'Notices for the Safari Zone, once it opens.',
    buttons: safari ? [['Read', () => acts.onBoard('safari')]] : [],
    build: (g) => g.add(board(kioskArt(), tileX(-3), tileZ(-2.3))),
  });
  // out on the left where the side forest stood, lined up under the Safari gate a step to its left (2026-10-09, the user's
  // ask: in the grid it stood too near the middle), the road from the plaza running up the middle of its doors
  list.push({
    id: 'mall', name: 'Poké Mall', step: { x: -1, y: 10 }, tiles: rect(-3, 7, 0, 9), tag: [-1, 3.4, 9], open: true,
    line: 'A shopping centre. The Game Corner is inside.',
    buttons: [['Go in', enterMall]],
    build: (g) => { const m = mallBuilding(); m.position.set(MALL_AT.x, 0, MALL_AT.z); m.rotation.y = MALL_AT.turn; g.add(m); },
  });
  const tower = towerOpen(save) || !!runAt('pillar'), best = save.tower?.bestEver || 0, climb = runAt('pillar');
  list.push({
    id: 'pillar-tower', name: 'Sky Pillar', step: { x: 13, y: -1 }, tiles: rect(12, -4, 14, -2), tag: [13, 4.2, -2], open: tower,
    line: tower ? `A 100-floor climb with a weekly leaderboard.${best ? ` Your best: floor ${best}.` : ''} Spin the Pokéstop to climb.` : 'Win a run to open the Sky Pillar, a 100-floor tower climb with a weekly leaderboard.',
    buttons: [],
    build: (g) => {
      const side = new THREE.MeshStandardMaterial({ map: texOf(pillarArt(false)), roughness: 1 });
      const door = pillarArt(true), face = glowing(new THREE.MeshStandardMaterial({ map: texOf(door), roughness: 1 }), door, null, '#a8c4ff', 0.9);
      const top = new THREE.MeshStandardMaterial({ color: P.stone[1], roughness: 1 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(2.6, 12, 2.6), [side, side, top, top, face, side]);
      box.position.set(tileX(PILLAR_AT.tx), 6, tileZ(PILLAR_AT.ty));
      box.castShadow = box.receiveShadow = true;
      g.add(box);
    },
  });
  if (tower) list.push({
    id: 'pillar', name: 'Sky Pillar Pokéstop', step: { x: 11, y: 0 }, tiles: [[11, -1]], tag: [11, 2.6, -1], open: true,
    line: climb ? waits(climb) : `This week's Sky Pillar climb.${best ? ` Your best: floor ${best}.` : ''}`,
    buttons: climb ? [['Continue', () => acts.onContinue(climb)], ['New game', acts.onTower]] : [['Climb', acts.onTower]],
    build: (g) => pokestop(g, 'pillar', tileX(11.3), tileZ(-0.9), 0.5, !!climb),
  });
  list.push({
    id: 'pillar-board', name: 'Pillar Ranks', step: { x: 15, y: 0 }, tiles: [[15, -1]], tag: [15, 2.6, -1], open: tower,
    line: tower ? 'The Sky Pillar\'s notice board: this week\'s and last week\'s highest climbers.' : 'Notices for the Sky Pillar, once it opens.',
    buttons: tower ? [['Read', () => acts.onBoard('tower')]] : [],
    build: (g) => g.add(board(kioskArt(SKY_KIT), tileX(14.8), tileZ(-1.2))),
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
  sign?.fixed?.dispose();
  glowMats = []; tree = null; sign = null; stops = {}; pcMail = null; pcNews = null;
  places = makePlaces();
  saved = acts.savedRun();
  barKey = null;
  blocked = new Set(TREE_TILES.map(([x, y]) => key(x, y)));
  for (const k of yardTiles) blocked.add(k);
  for (const p of places) {
    const g = new THREE.Group();
    p.build(g);
    g.traverse(o => { o.userData.place = p; });
    placeGroup.add(g);
    for (const [x, y] of p.tiles) blocked.add(key(x, y));
  }
  const way = new THREE.Group();   // no place: a tap on them walks there, through the arch
  buildGateway(way);
  placeGroup.add(way);
  setTime(true);
}

/** The Whispering Clearing's gate and fence across the front, and the route sign outside it. */
function buildGateway(g) {
  const s = clearingGateArt(), x = tileX(GATE_AT.tx), z = tileZ(GATE_AT.ty), b = board(s, x, z);
  glowing(b.material, s, null, '#c8f0ff', 0.9);
  g.add(b);
  const half = s.width / s.fine / TP / 2, post = (px) => x - half + px / TP;
  safariFence(g, tileX(-M), post(7), z);
  safariFence(g, post(53), tileX(COLS + M - 1), z);
}

/** A Pokémon route sign (the user's pick, 2026-10-09, after Scarlet / Violet's): a white pin, a red band over its round
    face, a red point below, on a grey post and foot. */
function routeSignArt() {
  const { c, g, fill, rr, lin } = fine(16, 36), cx = 8, cy = 8.5;
  const pin = (r, tip) => {   // the round head and its tangents down to the point
    const a = Math.acos(r / (tip - cy));
    g.moveTo(cx, tip); g.lineTo(cx + r * Math.cos(Math.PI / 2 - a), cy + r * Math.sin(Math.PI / 2 - a));
    g.arc(cx, cy, r, Math.PI / 2 - a, Math.PI / 2 + a, true); g.closePath();
  };
  rr(6.2, 22, 3.6, 3.2, 0.9, lin(6.2, 0, 9.8, 0, ['#d8d8d4', '#a8a8a4', '#70706c']));   // the collar, post and foot
  rr(7, 24.6, 2, 7.6, 0.6, lin(7, 0, 9, 0, ['#c8c8c4', '#9a9a96', '#6a6a66']));
  rr(3.6, 31.4, 8.8, 4.4, 1.2, lin(0, 31.4, 0, 35.8, ['#a8a8a4', '#7a7a76', '#4e4e4a']));
  rr(4.2, 31.6, 7.6, 0.8, 0.4, 'rgba(255,255,255,0.45)');
  fill(lin(0, 1, 0, 23, ['#e4e4e0', '#b8b8b4', '#8a8a86']), () => pin(7.4, 23.2));
  fill(lin(0, 2, 0, 22, ['#ffffff', '#f4f4f0', '#dcdcd6']), () => pin(6.7, 22.2));
  g.strokeStyle = lin(0, 1.5, 0, 12, ['#ff7a6a', '#e8483a', '#c8302a']); g.lineWidth = 1.5;   // the red band round the top
  g.beginPath(); g.arc(cx, cy, 6.3, 0.3, Math.PI - 0.3, true); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.35;
  g.beginPath(); g.arc(cx, cy, 6.7, 1.15 * Math.PI, 1.4 * Math.PI); g.stroke();
  fill('#e2e2dc', () => g.arc(cx, cy, 5.1, 0, Math.PI * 2));   // the face
  fill('#fdfdfb', () => g.arc(cx, cy, 4.7, 0, Math.PI * 2));
  fill(lin(0, 15.6, 0, 20.6, ['#ff6a5a', '#d83a30']), () => { g.moveTo(5.3, 15.6); g.lineTo(10.7, 15.6); g.lineTo(cx, 20.6); g.closePath(); });
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 1.75px "Trebuchet MS", "Arial Black", sans-serif';
  g.fillStyle = '#e8483a'; g.fillText('WHISPERING', cx, 7.1);
  g.font = '800 1.45px "Trebuchet MS", sans-serif';
  g.fillStyle = '#3a3a3a'; g.fillText('CLEARING', cx, 9.3);
  g.font = '700 1.05px "Trebuchet MS", sans-serif';
  g.fillStyle = '#7a7a76'; g.fillText('↓ ROUTE OUT', cx, 11.1);
  return c;
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
  const L = leavesOf(SEASON), crown = (i) => L ? L.trees[i % L.trees.length] : P.trees, far = (i) => L ? L.deep[i % L.deep.length] : P.deep;
  const rnd = seeded(21), kinds = [treeArt(1, crown(0)), treeArt(2, crown(1)), treeArt(3, far(0)), treeArt(4, far(1)), bushArt(5, crown(2)), bushArt(6, crown(0))]
    .map(c => SEASON === 'winter' ? snowCap(c) : c);
  const spots = kinds.map(() => []);
  // none in the back-left corner, open meadow round the Safari gate with the view past it (buildVista()),
  // and none where the Sky Pillar and its meadow stand in the back-right corner, the trees behind it kept
  const cleared = (x, z) => (x < -3 && z < (x < -10.4 ? -3 : 0.3)) || (x > tileX(9.9) && x < tileX(17) && z > tileZ(Math.abs(x - tileX(PILLAR_AT.tx)) < 2 ? -4.6 : -2.6) && z < 0.3);
  const put = (k, x, z, s) => { if (!cleared(x, z)) spots[k].push({ x, z, s }); };
  // the forest's wall: three ragged rows behind, three down each side, the far ones bigger and darker
  for (let r = 0; r < 3; r++) for (let x = -M + 0.5; x < COLS + M; x += 1.25 + rnd() * 0.4) {
    put(r ? 2 + (rnd() < 0.5 ? 1 : 0) : rnd() < 0.5 ? 0 : 1, tileX(x - 0.5) + (rnd() - 0.5) * 0.5, tileZ(-1 - r * 1.2 - rnd() * 0.4), 1.25 + r * 0.25 + rnd() * 0.2);
  }
  for (const s of [-1, 1]) for (let r = 0; r < 3; r++) for (let y = -1; y < ROWS + FRONT; y += 1.3 + rnd() * 0.4) {
    const x = s < 0 ? -2 - r * 1.2 : COLS + 1 + r * 1.2;
    // none down the left, open meadow round the Poké Mall (2026-10-09, the user's ask)
    if (s < 0) { rnd(); rnd(); rnd(); rnd(); continue; }
    put(r ? 2 + (rnd() < 0.5 ? 1 : 0) : rnd() < 0.5 ? 0 : 1, tileX(x) + (rnd() - 0.5) * 0.4, tileZ(y) + (rnd() - 0.5) * 0.3, 1.1 + r * 0.25 + rnd() * 0.2);
  }
  for (const [x, y] of TREE_TILES) put(y >= 9 && rnd() < 0.4 ? 4 : rnd() < 0.5 ? 0 : 1, tileX(x), tileZ(y), 1);
  // bushes along the gate's fence, outside it, the trail between
  for (let x = -M + 0.6; x < COLS + M - 1; x += 1.1 + rnd() * 0.3) if (Math.abs(x - GATE_AT.tx) > 2.3) put(4 + (rnd() < 0.5 ? 1 : 0), tileX(x), tileZ(GATE_AT.ty) + 0.45, 0.9 + rnd() * 0.25);
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
  buildVista();
  dressSeason();
}

/** The season's decorations, built once with the forest. Halloween: big jack-o'-lanterns round the plaza, down the
    trail and at the Ancient Tree's door, a giant pumpkin patch with a scarecrow, a graveyard lit by candles under a dead
    tree, a bubbling cauldron, hay bales, lantern posts and glowing toadstools (lit with the clock, setTime()), ghost
    Pokémon wandering among them (js/hub-spooky.js) and bats round the Ancient Tree. Each stands on its own tile, kept off
    every path and place (yardTiles), so nothing walks through them. In winter a snowman by the plaza. */
function dressSeason() {
  if (SEASON === 'halloween') {
    const P_ = (seed, lit = true) => [pumpkinArt(seed, lit), lit ? 'pumpkin' : null];
    // [art, glow, tile x, tile y, size, nudge x, nudge z]; a nudge keeps a thing on its tile but off its middle
    const yard = [
      [...P_(0), 5, 9, 2.6, 0.1, 0], [...P_(1), 7, 9, 2.4, -0.1, 0], [...P_(2), 5, 11, 1.5, -0.2, 0.2], [...P_(3, false), 7, 11, 1.4, 0.2, 0.2],   // the plaza
      [...P_(5), 3, 7, 5.6, 0, -0.1], [...P_(6), 4, 8, 2.4, 0.1, 0.1], [...P_(7, false), 2, 8, 2, -0.1, 0.15], [...P_(8, false), 2, 6, 1.8, 0, 0],   // the patch
      [scarecrowArt(), 'white', 4, 6, 1.5, 0.1, 0],
      [...P_(9), 5, 3, 2.2, 0, 0.2], [...P_(10), 7, 3, 2.1, 0, 0.2],   // the Ancient Tree's door
      [...P_(11), 5, 12, 2, 0.1, 0], [...P_(12), 7, 13, 2.2, -0.1, 0], [...P_(13, false), 5, 14, 1.8, 0.1, 0], [...P_(14), 7, 15, 2, -0.1, 0],   // the trail
      [...P_(15), 0, 5, 1.8, 0, 0], [...P_(16), 12, 3, 1.8, 0, 0], [...P_(17), 1, -1, 2, 0, 0], [...P_(18), -3, 11, 2.4, 0, 0], [...P_(19, false), -2, 12, 1.6, 0, 0],
      [graveArt(0), null, 8, 5, 1.5, 0, 0], [graveArt(1), null, 10, 5, 1.6, 0, -0.1], [graveArt(2), null, 9, 6, 1.4, 0, 0.1], [graveArt(3), null, 11, 6, 1.5, 0, 0],   // the graveyard
      [graveArt(4), null, 12, 5, 1.3, 0, 0], [candlesArt(0), 'white', 8, 6, 1.2, 0.1, 0.2], [candlesArt(1), 'white', 10, 6, 1.1, 0, 0.2], [candlesArt(2), 'white', 11, 5, 1, 0, 0.1],
      [deadTreeArt(0), 'white', 12, 6, 1.7, 0.2, -0.2], [capsArt(1), 'white', 12, 7, 1.3, 0, 0.1],
      [cauldronArt(), 'white', 3, 11, 1.7, 0, 0], [candlesArt(3), 'white', 2, 11, 1.1, 0, 0.1], [capsArt(0), 'white', 4, 11, 1.2, 0, 0.2],   // the witch's corner
      [lanternArt(0), 'white', 2, 3, 1.3, 0, 0], [lanternArt(1), 'white', 10, 3, 1.3, 0, 0], [lanternArt(2), 'white', 4, 12, 1.3, 0, 0], [lanternArt(3), 'white', 8, 12, 1.3, 0, 0],
      [hayArt(0), 'white', 1, 13, 1.7, 0, 0], [hayArt(1), 'white', 11, 13, 1.6, 0, 0], [hayArt(2), 'white', -3, 10, 1.6, 0, 0.2], [hayArt(3), 'white', 10, 14, 1.4, 0, 0.1],
      [deadTreeArt(1), 'white', 0, 12, 1.8, -0.2, 0], [deadTreeArt(2), 'white', 12, 14, 1.6, 0.2, 0],
      [graveArt(5), null, 2, 14, 1.3, 0, 0], [graveArt(6), null, -3, 13, 1.4, 0, 0], [candlesArt(4), 'white', -2, 13, 1, 0, 0.1], [capsArt(1), 'white', 3, 14, 1.1, 0, 0.1],
      [capsArt(0), 'white', 9, 14, 1.1, 0, 0], [lanternArt(4), 'white', -1, 12, 1.3, 0, 0],
    ];
    for (const [c, glow, tx, ty, s, nx, nz] of yard) {
      const b = board(c, tileX(tx) + nx, tileZ(ty) + nz, { s });
      if (glow === 'pumpkin') glowing(b.material, c, null, '#ff8a20', 1.3, seasonMats);
      else if (glow && c.glow) glowing(b.material, c, null, '#ffffff', 1.2, seasonMats);
      b.raycast = () => {};
      forest.add(b);
      yardTiles.add(key(tx, ty));
    }
    // out under the gate's sides, where the old little ones stood: no tile, so the sign and the Pokéstop stay reachable
    for (const [dx, i] of [[-1.6, 20], [1.6, 21]]) {
      const c = pumpkinArt(i), b = board(c, tileX(GATE_AT.tx) + dx, tileZ(GATE_AT.ty) + 0.7, { s: 1.7 });
      glowing(b.material, c, null, '#ff8a20', 1.3, seasonMats);
      b.raycast = () => {};
      forest.add(b);
    }
    // the giant pumpkin and the cauldron light the ground round them after dark
    for (const [colour, at, k] of [['#ff9030', [tileX(3), 1.2, tileZ(7) + 1.4], 0.8], ['#70ff80', [tileX(3), 1, tileZ(11) + 0.8], 0.6]]) {
      const l = new THREE.PointLight(colour, 0, 4.5, 1.6);
      l.position.set(...at);
      l.userData.k = k;
      lamps.push(l);
      scene.add(l);
    }
    spooks = makeSpooks({ THREE, scene, camera, root, view, tex: texOf, dispose, monBoard, drawMon, route, free, tileX, tileZ, PITCH,
      spawns: [{ x: 1, y: 9 }, { x: 9, y: 7 }, { x: 8, y: 14 }, { x: 4, y: 9 }], bats: { x: tileX(6), z: tileZ(0.5) } });
  }
  if (SEASON === 'winter') {
    const b = board(snowmanArt(), tileX(START.x) - 1.7, tileZ(START.y) - 1.3, { s: 1.2 });
    b.raycast = () => {};
    forest.add(b);
    makeSnow();
  }
}

/** The view out past the Safari gate (js/hub-vista.js), square to the camera so it reads as the far distance, its foot
    on the ground's back edge; and plain meadow under everything, where the cleared corner shows past the ground's edges. */
function buildVista() {
  const meadow = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: GROUND.meadow[3], roughness: 1 }));
  meadow.rotation.x = -Math.PI / 2;
  meadow.position.y = -0.02;
  meadow.receiveShadow = true;
  meadow.raycast = () => {};
  forest.add(meadow);
  const { x0, w, h } = VISTA, foot = tileZ(-M + 0.3);
  vista = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ transparent: true, fog: false }));
  vista.rotation.x = -PITCH;
  vista.position.set(x0 + w / 2, Math.cos(PITCH) * h / 2, foot - Math.sin(PITCH) * h / 2);
  vista.raycast = () => {};
  forest.add(vista);
  paintVista();
}

function paintVista() {
  const t = timeOfDay();
  if (!vista || vista.userData.time === t) return;
  vista.material.map?.dispose();
  vista.material.map = texOf(vistaArt(t, tileX(SAFARI_AT.tx), 0.42, vistaLook(SEASON)));
  vista.material.needsUpdate = true;
  vista.userData.time = t;
}

/* ---------- walking ---------- */

// the cleared meadow up to the Safari gate, outside the grid's back-left corner
// and the rows down to the Whispering Clearing's gate in front, under its arch and out past it to the Pokéstop
// and the open meadow down the left round the Poké Mall
const MEADOW = new Set([...rect(-3, -2, 1, -1), ...rect(-3, 0, -1, GATE_AT.ty - 1),...rect(11, -2, 15, -1), ...rect(13, 0, 15, 0), ...rect(0, ROWS, COLS - 1, GATE_AT.ty - 1),
  [GATE_AT.tx, GATE_AT.ty], ...rect(1, GATE_AT.ty + 1, COLS - 2, GATE_AT.ty + 2)].map(([x, y]) => key(x, y)));
const inGrid = (c) => (c.x >= 0 && c.y >= 0 && c.x < COLS && c.y < ROWS) || MEADOW.has(key(c.x, c.y));
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
  const d = Math.hypot(dx, dz), move = dt / 1000 * (arriving ? 4.6 : 3.4);
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
  if (outbound) { const go = outbound; outbound = null; if (running) go(); return; }
  if (returning) { returning = false; here = null; walker.facing = 'front'; walker.flip = false; walker.hopUntil = performance.now() + 500; return; }
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
  if (!p.open || !p.buttons.length || (i == null && p.buttons.length > 1)) return showCard(p);
  const stop = stops[p.id];
  if (stop) {
    if (stop.spinAt && performance.now() - stop.spinAt < SPIN) return;
    spinStop(stop);
  }
  if (p.id === 'base') return baseOwned() ? enterBase() : buyBase();
  if (p.id === 'mall') return enterMall();
  if (p.id === 'pc') return openPc();
  walker.hopUntil = performance.now() + 400;
  playSound('confirm');
  hideCard();
  const [label, go] = p.buttons[i ?? 0];
  if (p.id === 'trail' && label !== 'Escape Rope' && !calm) return setTimeout(() => walkOut(go), SPIN * 0.6);
  setTimeout(() => { if (running) go(); }, calm ? 0 : stop ? SPIN * 0.8 : 260);
}

/** Setting out (the user's ask, 2026-10-09): from the Pokéstop outside the Whispering Clearing's arch your partner steps
    onto the trail and walks away past the bottom of the screen, and the run opens once it's gone. */
function walkOut(go) {
  if (!running) return;
  const at = { x: GATE_AT.tx, y: STOP_AT.ty };
  walker.path = [...route(walker.tile, at)];
  for (let y = at.y + 1; y <= GATE_AT.ty + 5; y++) walker.path.push({ x: at.x, y });
  outbound = go;
  aim = null; here = null;
}

/** Back from a run that walked out under the gate: in through it again, onto the trail, facing you. */
function walkBackIn() {
  walker.x = tileX(GATE_AT.tx); walker.z = tileZ(GATE_AT.ty + 3); walker.tile = { x: GATE_AT.tx, y: GATE_AT.ty + 3 };
  walker.path = [];
  for (let y = GATE_AT.ty + 2; y >= GATE_AT.ty - 2; y--) walker.path.push({ x: GATE_AT.tx, y });
  walker.facing = mon.sheets.back ? 'back' : 'front';
  camX = walker.x; camZ = walker.z;
  returning = true;
}

/* ---------- the Pokéstop ---------- */

/** A Pokéstop at (x, z), `S` its size: New game's on the trail, and the Safari's small one by its gate. */
function pokestop(g, id, x, z, S, cue = false) {
  const d = stopDiscArt(), w = d.width / d.fine / TP * 1.15 * S;
  g.add(board(stopPostArt(), x, z, { s: S }));
  const m = glowing(new THREE.MeshStandardMaterial({ map: texOf(d), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 }), d, null, '#9cecff', 1.4);
  m.userData.glowMin = 0.3;
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(w, w), m);
  disc.position.set(x, 1.55 * S + w / 2, z);
  disc.castShadow = true;
  g.add(disc);
  stops[id] = { disc, m, y: disc.position.y, spinAt: 0, cue: cue ? continueCue(g, x, z + 0.95) : null };
}

/** Glowing CONTINUE on the ground before the Pokéstop holding the saved run (the user's ask, 2026-10-09: make it
    obvious where to carry on). One saved run, so only one stop ever wears it; liveStop() fades it in and out. */
function continueCue(g, x, z) {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 160;
  c.hd = 2;
  const map = tex(c);
  const paint = () => {
    const d = c.getContext('2d');
    d.clearRect(0, 0, c.width, c.height);
    d.font = '68px "PokeDB Pixel", monospace';
    d.textAlign = 'center'; d.textBaseline = 'middle';
    d.shadowColor = '#5fe0ff'; d.shadowBlur = 30;
    d.lineWidth = 10; d.strokeStyle = '#4fd8ff'; d.lineJoin = 'round';
    for (let i = 0; i < 3; i++) d.strokeText('CONTINUE', 320, 84);
    d.shadowBlur = 0; d.fillStyle = '#ffffff';
    d.fillText('CONTINUE', 320, 84);
    map.needsUpdate = true;
  };
  paint();
  document.fonts?.load('68px "PokeDB Pixel"').then(paint, () => {});
  const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.9 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6 * 160 / 640 * 1.6), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.03, z);
  mesh.renderOrder = 2;
  g.add(mesh);
  return m;
}

const SPIN = 1700;

/** A tap spins the disc like Pokémon Go's, three turns slowing down, and it glows violet a moment after. */
function spinStop(stop) {
  if (calm) return;
  stop.spinAt = performance.now();
  playSound('aug-silver');
  setTimeout(() => playSound('aug-gold'), SPIN * 0.75);
}

/** Idle it bobs and sways a little; spun, it whirls, then its violet fades back to blue. */
function liveStop(stop, now) {
  const t = stop.spinAt ? (now - stop.spinAt) / SPIN : 9, sway = Math.sin(now / 1400) * 0.3;
  stop.disc.rotation.y = t < 1 ? (1 - (1 - t) ** 3) * Math.PI * 6 + sway * t : sway;
  stop.disc.position.y = stop.y + Math.sin(now / 900) * 0.06;
  const violet = t < 1 ? t : Math.max(0, 1 - (t - 1) * SPIN / 3000);
  stop.m.color.setRGB(1 - violet * 0.15, 1 - violet * 0.55, 1);
  stop.m.emissive.setRGB(0.61 + violet * 0.3, 0.92 - violet * 0.5, 1);
}

// the Secret Base is bought once (the user's call, 2026-10-08), saved as `baseOwned`
const BASE_PRICE = 1500;
const baseOwned = () => !!getSave().baseOwned;

const FIX = 1100;

/** The locked sign swings left and right on its one nail; bought, it settles level, mending itself on the way. */
function liveSign(now) {
  if (!sign) return;
  if (!sign.fixAt) { sign.pivot.rotation.z = sign.fixed ? (calm ? 0.12 : Math.sin(now / 700) * 0.34) : 0; return; }
  const t = Math.min(1, (now - sign.fixAt) / FIX);
  sign.pivot.rotation.z = sign.from * Math.exp(-6 * t) * Math.cos(t * 14) * (1 - t);
  if (t > 0.3 && !sign.swapped) { sign.swapped = true; sign.m.map = sign.fixed; sign.m.needsUpdate = true; playSound('aug-gold'); }
}

/** The boarded door's price: too few coins says how many more; else a yes pays, pulls the planks off and walks in. */
async function buyBase() {
  if (entering) return;
  hideCard();
  walker.path = []; aim = null;
  const coins = getSave().coins ?? 0;
  if (coins < BASE_PRICE) {
    playSound('cancel');
    await confirmDialog(`The Secret Base costs ${BASE_PRICE.toLocaleString()} PokéCoins, and you have ${coins.toLocaleString()}.`, 'OK');
    return;
  }
  if (!(await confirmDialog(`Make the Ancient Tree your Secret Base for ${BASE_PRICE.toLocaleString()} PokéCoins?`, `Buy (${BASE_PRICE.toLocaleString()})`))) return;
  updateSave(d => { d.coins -= BASE_PRICE; d.baseOwned = true; });
  refreshCoins();
  playSound('buy');
  if (sign && !calm) {   // the sign swings up level and mends itself before the door opens
    entering = { at: performance.now(), z: walker.z, still: true };
    sign.from = sign.pivot.rotation.z; sign.fixAt = performance.now();
    await new Promise(r => setTimeout(r, FIX + 300));
    entering = null;
  }
  buildPlaces();
  here = places.find(q => q.id === 'base');
  await enterBase();
}

/** Into the Ancient Tree: the door swings open, your partner steps into the dark, and the Secret Base comes up under a
    curtain (js/base-3d.js); its ✕ brings it back out here (showHub(), `inside`). */
async function enterBase() {
  if (entering) return;
  hideCard();
  walker.path = []; walker.facing = mon.sheets.back ? 'back' : 'front';
  if (tree) tree.m.map = tree.open;
  playSound('confirm');
  playSound('door');
  entering = { at: performance.now(), z: walker.z };
  await curtain(true, calm ? 0 : 420);
  entering = null;
  if (tree) tree.m.map = tree.shut;
  inside = 'base';
  await acts.onBase();
}

/** Through the Poké Mall's sliding doors into its hall (js/mall-3d.js), whose ✕ brings you back out here. */
async function enterMall() {
  if (entering) return;
  hideCard();
  walker.path = []; walker.facing = mon.sheets.back ? 'back' : 'front';
  playSound('confirm');
  playSound('door');
  entering = { at: performance.now(), z: walker.z };
  await curtain(true, calm ? 0 : 420);
  entering = null;
  inside = 'mall';
  await acts.onMall();
}

/** What floats over the PC: the envelope for mail, else the "!" for unread patch notes. */
function pcMarks() {
  if (!pcMail) return;
  pcMail.visible = unclaimed().length > 0;
  pcNews.visible = !pcMail.visible && patchUnseen();
}

/** Log on to the PC (js/pc.js), full screen over the Clearing; logged off, a new walking buddy steps out in place. */
async function openPc() {
  if (entering || document.querySelector('.pc-screen')) return;
  hideCard();
  walker.path = []; aim = null;
  const { openPC } = await import('./pc.js');
  openPC({ onClose: () => { pcMarks(); swapBuddy(); }, onFame: (app) => acts.onApp?.(app) });
}

/** The walking buddy again from the save: its billboard swapped where it stands, with a hop and its cry. */
async function swapBuddy() {
  const mate = buddy(getSave());
  if (!mon || mon.src === mate.src) return;
  const old = mon;
  const next = await monBoard(mate);
  next.board.rotation.x = -PITCH;
  next.board.userData.who = { mon: next, w: walker };
  dispose(old.group); scene.remove(old.group);
  mon = next;
  scene.add(mon.group);
  walker.facing = 'front'; walker.flip = false;
  walker.hopUntil = performance.now() + 500;
  playCry(mon.id);
}

/** Back out of the base or the mall: on its doorstep, facing you, the base's door shutting behind. */
function leftPlace() {
  const p = places.find(q => q.id === inside);
  inside = null;
  if (!p) return;
  walker.tile = p.step; walker.x = tileX(p.step.x); walker.z = tileZ(p.step.y);
  walker.facing = 'front'; walker.flip = false; walker.hopUntil = performance.now() + 500;
  camX = walker.x; camZ = walker.z;
  here = p;
  if (!tree || p.id !== 'base') return;
  tree.m.map = tree.open;
  if (calm) { tree.m.map = tree.shut; return; }
  // out of the hollow the way it went in (the user's ask, 2026-10-09): it steps out of the open door onto the doorstep
  leaving = { at: performance.now() + LEAVE_WAIT, z: walker.z };
  walker.z -= 0.7;
  walker.hopUntil = 0;
}

const LEAVE_WAIT = 450, LEAVE = 600;   // it waits out the hub's fade in, so the step out is seen

/** Stepping out of the Ancient Tree's door; once on the doorstep it hops and the door swings shut behind it. */
function liveLeaving(now) {
  if (!leaving) return;
  const t = Math.max(0, Math.min(1, (now - leaving.at) / LEAVE));
  walker.z = leaving.z - (1 - t) * 0.7;
  if (t < 1) return;
  leaving = null;
  walker.hopUntil = now + 500;
  setTimeout(() => { if (tree) tree.m.map = tree.shut; playSound('door'); }, 250);
}

/* ---------- the card under a place ---------- */

function showCard(p) {
  here = p;
  // the Pokéstop with a saved run asks which (the user's call, 2026-10-08): its card's two buttons
  const ask = asks(p);
  // the user's call, 2026-10-08: that question is the Pokédex's shell, its two keys and no words
  card.classList.toggle('ask', ask);
  card.querySelector('.hub-card-name').textContent = p.name;
  card.querySelector('.hub-card-line').textContent = p.line;
  card.querySelector('.hub-card-acts').replaceChildren(...(ask ? ['Continue', 'New game'] : []).map((label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = label === 'Continue' ? 'room-ok hub-card-ok' : 'hub-card-btn';
    b.textContent = label;
    b.addEventListener('click', () => open(p, p.buttons.findIndex(([l]) => l === label)));
    return b;
  }));
  card.classList.toggle('locked', !p.open);
  card.hidden = false;
  if (!p.open) playSound('cancel');
}
function hideCard() { card.hidden = true; }

/** A place where the saved run was started asks Continue or New game: the Pokéstop, the Safari gate or the Sky Pillar. */
const asks = (p) => p.open && p.buttons[0]?.[0] === 'Continue';

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

/** A GIF's frame fits its whole animation, so a big or hopping Pokémon overflowed the run strip's LCD: scale its resting
    pose (SPRITE_FIT's gaps) to fit .hbar-mon's 34 x 30 box, feet on its floor, in % so the box can change size. */
function fitMon(img) {
  const BW = 34, BH = 30;
  const [top, bottom, left, right] = spriteFit(img.src);
  const w = img.naturalWidth - left - right, h = img.naturalHeight - top - bottom;
  if (w <= 0 || h <= 0) return;
  const k = Math.min(BW / w, BH / h), pct = (n, of) => `${(n / of * 100).toFixed(2)}%`;
  Object.assign(img.style, {
    width: pct(img.naturalWidth * k, BW), height: pct(img.naturalHeight * k, BH),
    left: pct((BW - w * k) / 2 - left * k, BW), top: pct(BH - h * k - top * k, BH),
  });
}

/** The bottom bar, the rooms' Pokédex bar (the user's pick, 2026-10-08), reworked 2026-10-09 (the user's layout): one
    line along the hinge, lens, lights, small Home and How to play keys that never turn into anything else, the PokéCoins
    on their own little LCD and the place your partner walks up to on the right (a tap on the place does it); under it a
    saved run's LCD (its Pokémon in the LCD's greens like the map's run card, its name, where and which floor, the HP bar and the Escape Rope), folding away down into the
    bar, like an auto-hiding taskbar, while there is no run. Redrawn only when the place or the run changes. */
function placeBar() {
  const coins = getSave().coins ?? 0;
  if (coins !== barCoins) { barCoins = coins; bar.querySelector('.hbar-coins').textContent = coins.toLocaleString(); }
  const p = nearest(), k = `${p?.id ?? ''}|${saved ? `${saved.hp}/${saved.maxHp}|${saved.sprite}` : ''}`;
  if (k === barKey) return;
  barKey = k;
  bar.classList.toggle('no-run', !saved);
  bar.querySelector('.hbar-fold').inert = !saved;
  if (saved) {
    setHpBar('hub', saved.hp, saved.maxHp);
    const mon = bar.querySelector('.hbar-sprite');
    if (mon.getAttribute('src') !== saved.sprite) mon.src = saved.sprite;
    mon.dataset.stage = saved.saved.stage;
    bar.querySelector('.hbar-name').textContent = saved.name;
    bar.querySelector('.hbar-where').textContent = saved.place;
    bar.querySelector('.hbar-floor').textContent = saved.floor ? `F${saved.floor}` : '';
  }
  const sign = bar.querySelector('.hbar-sign b'), name = p?.name ?? 'The Clearing';
  if (sign.textContent === name) return;
  sign.textContent = name;
  sign.classList.remove('hbar-pop');
  void sign.offsetWidth;
  sign.classList.add('hbar-pop');
}

/* ---------- the Pokédex in the corner ---------- */

/** It grows from the corner into the device (js/device.js's `from`), which opens over the hub; shut, it's back here. */
const openDex = () => fromCorner(acts.onPokedex, dexBtn);

/** How to play grows out of its own round key beside Home (the user's call, 2026-10-08), and shuts back into it. */
function fromCorner(open, key) {
  if (root.querySelector('.room-home.out') || entering || held) return;
  hideCard();
  // the walk in carries on once it shuts: cut short, `arriving` never cleared and every tap was ignored
  if (!arriving) { walker.path = []; aim = null; }
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
  if (held || arriving || leaving || outbound || returning) return;
  const ray = new THREE.Raycaster();
  ray.setFromCamera(ndc(e), camera);
  const ghosts = spooks?.boards() || [];
  const hit = ray.intersectObjects([mon.board, ...ghosts, placeGroup], true).find(h => !h.object.userData.who || onSprite(h));
  if (spooks?.tap(hit, walker)) return;
  if (spooks?.hush()) return;
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
  if (!running || held || arriving || leaving || outbound || returning || document.querySelector('dialog:modal, #shop-dialog[open]') || document.activeElement?.matches?.('input')
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
  const T = tintOf(SEASON, t), c = new THREE.Color();
  if (T?.bg) { scene.background.lerp(c.set(T.bg[0]), T.bg[1]); scene.fog.color.copy(scene.background); }
  if (T?.sky) hemi.color.lerp(c.set(T.sky[0]), T.sky[1]);
  if (T?.ground) hemi.groundColor.lerp(c.set(T.ground[0]), T.ground[1]);
  if (T?.sun) sun.color.lerp(c.set(T.sun[0]), T.sun[1]);
  for (const m of [...glowMats, ...seasonMats]) m.emissiveIntensity = Math.max(m.userData.glowMin || 0, L.glow) * m.userData.glow;
  for (const l of lamps) l.intensity = L.lamp * l.userData.k;
  if (bugs) bugs.userData.kind = L.bugs;
  paintVista();
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
  bugs.visible = SEASON !== 'winter';   // snow instead
  scene.add(bugs);
}

/** Winter's snowfall: flakes drifting down through a box that follows the view, wrapping back to the top. */
const FLAKES = 420, SNOW_W = 26, SNOW_D = 24, SNOW_H = 9;
function makeSnow() {
  const rnd = seeded(51), pos = new Float32Array(FLAKES * 3), seeds = [];
  for (let i = 0; i < FLAKES; i++) {
    const s = [(rnd() - 0.5) * SNOW_W, rnd() * SNOW_H, (rnd() - 0.5) * SNOW_D, rnd() * 100, 0.5 + rnd() * 0.6];
    seeds.push(s);
    pos.set(s.slice(0, 3), i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  snow = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.12, map: dotTexture(), color: '#ffffff', transparent: true, opacity: 0.95, depthWrite: false }));
  snow.userData = { seeds };
  snow.raycast = () => {};
  scene.add(snow);
}

function liveSnow(now) {
  if (!snow) return;
  snow.position.set(camX, 0, camZ);
  if (calm) return;
  const t = now / 1000, p = snow.geometry.attributes.position;
  snow.userData.seeds.forEach(([x, y, z, ph, sp], i) => {
    const fy = ((y - t * sp) % SNOW_H + SNOW_H) % SNOW_H;
    p.setXYZ(i, x + Math.sin(t * 0.6 * sp + ph) * 0.5, fy, z + Math.cos(t * 0.4 * sp + ph) * 0.3);
  });
  p.needsUpdate = true;
}

const FIREFLY = [0.85, 1, 0.45], POLLEN = [1, 0.96, 0.78];
function liveBugs(now) {
  if (!bugs.visible) return;
  const { seeds, kind } = bugs.userData, L = LIGHT[time], p = bugs.geometry.attributes.position, c = bugs.geometry.attributes.color;
  const tints = BUG_LOOK[SEASON]?.[kind];
  const t = calm ? 0 : now / 1000, fly = kind === 'fireflies';
  bugs.material.size = fly ? 0.16 : 0.09;
  seeds.forEach(([x, y, z, ph, sp], i) => {
    if (!calm) p.setXYZ(i, x + Math.sin(t * 0.3 * sp + ph) * 1.2, y + Math.sin(t * 0.7 * sp + ph * 2) * (fly ? 0.3 : 0.12) - (fly ? 0 : (t * 0.05 * sp + ph) % 1 * 0.3), z + Math.cos(t * 0.25 * sp + ph) * 1.0);
    // a firefly glows in slow pulses, dark between; pollen just catches the light
    const k = (fly ? Math.max(0, Math.sin(t * 1.3 * sp + ph)) ** 3 : 0.35 + 0.15 * Math.sin(t * 2 + ph)) * L.bugsI * (calm ? 0.7 : 1);
    const [r, g, b] = tints ? tints[i % tints.length] : fly ? FIREFLY : POLLEN;
    c.setXYZ(i, r * k, g * k, b * k);
  });
  p.needsUpdate = true; c.needsUpdate = true;
}

/** Now and then a legendary crosses the sky over the forest, from the title's own round (a silhouette until it's
    yours), its shadow gliding over the Clearing while the sun's up. Never under reduced motion, like the title's. */
const FLY_SCALE = 0.45;
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
  const dir = Math.random() < 0.5 ? 1 : -1, high = 0.4 + Math.random() * 0.15;
  // the path is fixed in the world when it sets off, across the top of the view as it is then, so walking about
  // never drags it along with the camera. It starts and ends a whole sprite's width past the view's edges: a fixed
  // margin left Lugia and Eternatus half on screen on a narrow phone when the flight ended
  const along = (sx) => {
    const d = new THREE.Vector3(sx, high, 0.5).unproject(camera).sub(camera.position).normalize();
    return camera.position.clone().addScaledVector(d, camera.userData.dist * 0.55);
  };
  const a = along(-dir), b = along(dir), out = b.clone().sub(a).normalize().multiplyScalar(m.c.width * MON_PX * FLY_SCALE + 0.5);
  flyer = { m, shade, at: now, ms: 9000 + Math.random() * 3000, dir, from: a.sub(out), to: b.add(out),
    sx: camX, sz: camZ, w: { facing: 'front' } };
}

function liveFlyer(now, dt) {
  if (!flyer) { if (now > nextFly) launchFlyer(now); return; }
  const f = flyer, k = (now - f.at) / f.ms;
  if (k >= 1) { scene.remove(f.m.group, f.shade); dispose(f.m.group); f.shade.geometry.dispose(); f.shade.material.dispose(); flyer = null; return; }
  // high over the treetops (nearer the camera than the forest, or it would fly through it); the board always faces the camera
  f.m.group.position.lerpVectors(f.from, f.to, k);
  f.m.group.position.y += Math.sin(k * Math.PI) * 0.4 + Math.sin(now / 260) * 0.06;
  f.m.group.quaternion.copy(camera.quaternion);
  f.m.board.scale.set(f.dir > 0 ? -FLY_SCALE : FLY_SCALE, FLY_SCALE, 1);
  drawMon(f.m, f.w, dt);
  // the shadow runs a little ahead, over the ground near you
  const sh = Math.min(1, k * 1.2 + 0.05), up = time !== 'night';
  f.shade.position.set(f.sx + f.dir * (-14 + 28 * sh), 0.03, f.sz - 1.5);
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
  // the furthest forward the view may look: where the ground's front edge sits on the bar's top, not under it
  const edge = new THREE.Vector3(), low = -1 + 2 * Math.min(0.4, (bar?.offsetHeight || 0) / h);
  let lo = -ROWS, hi = ROWS;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    aimCamera(0, mid);
    if (edge.set(0, 0, ROWS / 2 + FRONT).project(camera).y < low) lo = mid; else hi = mid;
  }
  camera.userData.front = lo;
  scene.fog.near = d + 2; scene.fog.far = d + 22;
}

function placeCamera(dt) {
  const { half, front } = camera.userData;
  // up the Safari road, or to the Sky Pillar's door, the view looks on ahead into the back corner
  const ahead = !arriving && (walker.tile.x <= 1 || walker.tile.x >= 11) && walker.tile.y <= 3 ? 2.5 : 0;
  const reachX = COLS / 2 + 2.2 - half, frontZ = front, backZ = ahead ? tileZ(-2.5) : tileZ(2);
  // walking in, the view waits on the plaza for it rather than dipping to meet it
  const wx = arriving ? tileX(START.x) : walker.x, wz = arriving ? tileZ(START.y) : walker.z - ahead;
  // a tile further on the left, so the Poké Mall out there is whole in the view
  const wantX = reachX + ahead <= 0 ? 0 : Math.max(-reachX - 1 - ahead * 1.2,Math.min(Math.max(0, reachX) + ahead * 1.2, wx));
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
  if (entering && !entering.still) walker.z = entering.z - Math.min(1, (now - entering.at) / 420) * 0.7;   // into the hollow
  liveLeaving(now);
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, 0, walker.z);
  mon.board.position.y = bob;
  mon.board.scale.x = walker.flip ? -1 : 1;
  drawMon(mon, walker, dt);
  spooks?.tick(now, dt, { calm, quiet: held || arriving || !!inside || !!entering || !!outbound, partner: walker });
  if (ring.material.opacity > 0) { ring.material.opacity = Math.max(0, ring.material.opacity - dt / 700); ring.scale.setScalar(1.25 - ring.material.opacity * 0.3); }
  if (!calm) paintGateArt(now);
  if (!calm) livePc(now);
  for (const m of [pcMail, pcNews]) if (m?.visible) m.position.y = m.userData.y + (calm ? 0 : Math.sin(now / 380) * 0.08);
  if (!calm) for (const s of Object.values(stops)) liveStop(s, now);
  for (const s of Object.values(stops)) if (s.cue) s.cue.opacity = calm ? 0.85 : 0.3 + 0.65 * (0.5 + 0.5 * Math.sin(now / 520));
  liveSign(now);
  if (now - (frame.checked || 0) > 30000) { frame.checked = now; setTime(); }
  liveBugs(now);
  placeCamera(dt);
  liveSnow(now);
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
        <div class="room-keys"><button type="button" class="room-home hub-dex" aria-label="Pokédex"></button><button type="button" class="room-home hub-help" title="How to play" aria-label="How to play"></button></div>
        <div class="room-sign hbar-cash" title="PokéCoins"><span class="hbar-coins">0</span></div>
        <div class="room-sign hbar-sign" aria-live="polite"><b></b></div></div>
      <div class="hbar-fold"><div class="hbar-fold-in">
        <div class="room-lcd hbar-run"><span class="hbar-mon" aria-hidden="true"><img class="hbar-sprite pixel" alt=""></span><span class="hbar-info"><b class="hbar-name"></b><span class="hbar-where"></span><span class="hbar-floor"></span></span>
          <span class="hbar-hp"><span class="gb-hp" id="hub-hp" role="progressbar" aria-label="HP" aria-valuemin="0"><span class="gb-hp-tag" aria-hidden="true">HP:</span><span class="gb-hp-track"><span class="gb-hp-fill" id="hub-hp-fill"></span></span></span><span class="gb-hp-num" id="hub-hp-text"></span></span>
          <button type="button" class="hbar-flee" title="Escape Rope" aria-label="Escape Rope"></button></div></div></div>
    </div>
    <span class="hub-fps" hidden></span>`;
  view = root.querySelector('.hub-view');
  card = root.querySelector('.hub-card');
  bar = root.querySelector('.hub-bar');
  bar.querySelector('.hbar-coins').before(smoothIcon('coin', 'hbar-coin'));
  new ResizeObserver(() => { root.style.setProperty('--hub-bar-h', `${bar.offsetHeight}px`); if (camera) resize(); }).observe(bar);
  bar.querySelector('.hbar-sprite').addEventListener('load', (e) => fitMon(e.target));
  bar.querySelector('.hbar-flee').append(smoothIcon('run'));
  bar.querySelector('.hbar-flee').addEventListener('click', () => { playSound('confirm'); hideCard(); acts.onAbandon(); });
  dexBtn = root.querySelector('.hub-dex');
  dexBtn.append(roundKey('home'));
  dexBtn.addEventListener('click', openDex);
  const help = root.querySelector('.hub-help');
  help.append(roundKey('help'));
  help.addEventListener('click', () => fromCorner(acts.onHelp, help));
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
  for (const [colour, at, k] of [['#ffc070', [tileX(6) - 1.25, 2.4, tileZ(2) + 0.6], 1], ['#8ab0ff', [tileX(PILLAR_AT.tx), 1.1, tileZ(PILLAR_AT.ty) + 1.6], 0.7]]) {
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
  // the logo greets the hub once: the title shown again (out of the mall or the base, after a run) would restart its fade
  if (!greets) { greets = true; screen.addEventListener('animationend', (e) => { if (e.animationName === 'hubLogo') screen.classList.add('hub-greeted'); }); }
  calm = calmFx();
  try {
    built ??= build();
    await built;
  } catch { built = Promise.reject(); built.catch(() => {}); return false; }
  // held before it's on the page, or the bar shows over the shut Pokédex while the partner loads
  root.classList.toggle('held', hold);
  if (!root.isConnected) screen.prepend(root);
  buildPlaces();
  const mate = buddy(getSave());
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
  outbound = null; returning = false;
  if (inside) leftPlace();
  else if (!inGrid(walker.tile) && !hold) walkBackIn();
  else if (!inGrid(walker.tile)) { walker.tile = { x: GATE_AT.tx, y: GATE_AT.ty - 2 }; walker.x = tileX(walker.tile.x); walker.z = tileZ(walker.tile.y); }
  hideCard();
  root.querySelectorAll('.room-home.out').forEach(k => k.classList.remove('out'));
  dexNews();
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
