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
import { leavesOf, groundLook, vistaLook, snowCap, tintOf, BUG_LOOK, pumpkinArt, snowmanArt, graveArt, deadTreeArt, scarecrowArt, candlesArt, hayArt, lanternArt, capsArt } from './hub-season.js';
import { makeSpooks } from './hub-spooky.js';
import { calmFx } from './prefs.js';
import { playSound, playCry, setLoop } from './audio.js';
import { buddy, deviceNews } from './trainercard.js';
import { loadThree, tex, dispose, MON_PX, monBoard, drawMon, onSprite, createPost, curtain, warmShaders, wakeGL, sleepGL, bend, bendFine, unbend } from './hd2d.js';
import { gateHp, gateReady } from './gate.js';
import { isStarterUnlocked } from './progress.js';
import { STARTERS_BY_ID } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { safariOpen, safariUnlockProgress } from './data/pokedex.js';
import { towerOpen } from './data/tower.js';
import { smoothIcon, roundKey } from './smooth-icons.js';
import { vistaArt, VISTA } from './hub-vista.js';
import { makeCracks, CRACK_LINES } from './hub-cracks.js';
import { makeSealedGate } from './hub-sealed.js';
import { gateStage } from './data/gate.js';
import { pcModel, livePc } from './hub-pc.js';
import { makeCauldron } from './hub-cauldron.js';
import { RING, TOWNS, CLEARING, QUESTS, townState, townsOpen, nietosHome, mended, questProgress, questStep, stepText, stepHave, guestLines, clearingLit, sealOn } from './data/towns.js';
import { satchelOf, satchelFlag, MATERIALS_BY_ID } from './data/satchel.js';
import { gymWins, GYM_BY_ID, spriteOf } from './data/gym.js';
import { todaysGuest, welcomeHome, startQuest } from './towns.js';
import { unclaimed } from './mail.js';
import { patchUnseen } from './patchnotes.js';
import { pcBeckons } from './pc-news.js';
import { claimable, timeLeft } from './missions.js';
import { setHpBar, confirmDialog, refreshCoins } from './ui.js';

// the walkable grid, tile (0, 0) at the back left. Laid out anew 2026-10-14 (the user's ask: everything spread out, wide
// roads that set off the plaza in the middle, the way out going north, Kenmatta's dojo away from the Nietos, the Secret
// Base moved): a round paved plaza in the middle, four avenues off it, a ring road round them linking every place
const COLS = 31, ROWS = 26;
const X0 = 15.5, Z0 = 12.5;   // the world's origin, the plaza's middle
const M = 4, FRONT = 2;       // grass round it (tiles): the open meadow behind, the forest down the sides, a hedge in front
// the Whispering Clearing's gate at the far end of the north avenue (the user's ask, 2026-10-14: the way out goes north);
// the road runs on through it into the painted distance (js/hub-vista.js), New game's Pokéstop and the route sign either
// side of the avenue just inside it
const GATE_AT = { tx: 15, ty: -2 };
const STOP_AT = { tx: 17, ty: 1 }, SIGN_AT = { tx: 12, ty: 0 };   // a step out from the gate's sides (2026-10-14), so neither hides its face; the stop a step nearer the avenue (the user's ask, same day)
const TP = 16;                // painted pixels a tile
const START = { x: 15, y: 12 };  // the plaza's middle, the Waystone's tile
const PLAZA_R = 3.6;             // the paved plaza's radius
const PC_AT = { tx: 19, ty: 10 };
const QUEST_AT = { tx: 11, ty: 10 };   // the quest board, the PC's mirror across the plaza (towns on only)
const PITCH = 0.6, LOOK_Y = 0.6;   // Octopath's low angle; Pokémon lean back by all of it (showHub()), so they face the camera unsquashed
const ACROSS = 8;             // tiles the view shows across at least; an upright phone pans over the rest
const DEPTH = 15;             // and rows deep at least, on a wide screen
const SEEN = 2.6;             // how near (tiles) a place's doorstep you walk before its keys are on the bar

// the avenues' and plaza's paving: pale stones, the mortar between them and the kerb's two shades
const STONE = ['#f2eadc', '#e4dac6', '#d4c8b0', '#c2b59a'], STONE_MORTAR = '#a8997e', STONE_KERB = ['#9c917c', '#857a66'];

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
const BUGS = 90;

// the Safari gate and the Sky Pillar in the back corners, out on the meadow, each up a trail off the ring road
const SAFARI_AT = { tx: 4, ty: -3 };
const PILLAR_AT = { tx: 28, ty: -3 };
// each by its top-left tile: Kenmatta's dojo north-west; the Ancient Tree, the Secret Base, north-east (TREE_AT its middle
// tile); moved 2026-10-14 from the user's drawing: the Nietos' house south-east and the Poké Mall south-west, their doors
// on the low road to the pond (the old road they faced taken out), and the Sealed Gate (once broken) where the mall stood,
// at the west avenue's end
// the Nietos' yard round their house's 3 x 3 (off NIETOS_AT): the washing line left (the name board's own tile, [-1, 2],
// is its place's), the garden either side of the doorstep, the pram and sandbox right; nothing walks through them
const NIETOS_YARD = [[-1, 1], [-2, 2], [0, 3], [2, 3], [3, 1], [3, 2]];
const NIETOS_AT = { tx: 24, ty: 17 }, DOJO_AT = { tx: 6, ty: 1 }, TREE_AT = { tx: 22, ty: 4 }, MALL_TILE = { tx: 8, ty: 18 };
const SEALED_AT = { tx: 2, ty: 10 };
// Kurt's Workshop (its top-left tile) in the plaza's north-east, its door on a path down to the east avenue
const WORKSHOP_AT = { tx: 23, ty: 6 };
// the pond in the garden at the south avenue's end, down past the ring road (the user's drawing, 2026-10-14: by the ring
// road it crowded the Waystone), the low road round the garden running into it from the ring road's sides
const POND = { x: 15, y: 21.6, r: 1.5 };
// the Clearing's Waystone (docs/roadmap.md's Towns and Waystones; one, not five, the user's pick 2026-10-14): it stands on
// the plaza's Poké Ball, START's tile, five crystals orbiting its tip, one a town in its RING colour (js/data/towns.js);
// your partner starts a step in front of it, a ring of dark stone RING_R out set into the plaza round it
const RING_R = 2.7;
const SPAWN = { x: START.x, y: START.y + 1 };
// where your partner walks in to and first stands: the north avenue's crossing with the ring road, short of the plaza
// (the user's ask, 2026-10-14: in front of the Waystone it stood on the plaza's Poké Ball)
const ARRIVE = { x: START.x, y: 5 };
// the roads, as centre lines between tile centres, `w` their half-width: stone avenues and ring road, earth trails out to
// the wild places (the Safari, the Pillar, the road on through the gate)
const AVE = 1.15, LANE = 0.72, TRAIL = 0.48;
const ROADS = [
  { a: [15, 9], b: [15, GATE_AT.ty + 0.6], w: AVE },                       // north avenue, up to the gate
  { a: [15, GATE_AT.ty + 0.6], b: [15, -M - 0.6], w: TRAIL * 0.9, dirt: true },  // and on out of the Clearing
  { a: [12, START.y], b: [SEALED_AT.tx, START.y], w: AVE },                         // west avenue, to the Sealed Gate
  { a: [18, START.y], b: [28, START.y], w: AVE },                                   // east avenue
  { a: [15, 15], b: [15, POND.y - 1.6], w: AVE * 0.85 },                  // south avenue, to the pond garden
  { a: [4, 5], b: [28, 5], w: LANE }, { a: [4, 5], b: [4, POND.y], w: LANE }, { a: [28, 5], b: [28, POND.y], w: LANE },   // the ring road
  { a: [4, POND.y], b: [28, POND.y], w: LANE },   // and the low road to the pond, its south side
  { a: [4, 5], b: [4, -M - 0.6], w: TRAIL, dirt: true },                 // trails to the Safari gate, on through it, and the Sky Pillar
  { a: [28, 5], b: [28, PILLAR_AT.ty + 1], w: TRAIL, dirt: true },
  { a: [SAFARI_AT.tx - 3, SAFARI_AT.ty + 1.6], b: [SAFARI_AT.tx, SAFARI_AT.ty + 1.6], w: TRAIL * 0.8, dirt: true },
  { a: [PILLAR_AT.tx - 2, PILLAR_AT.ty + 1.6], b: [PILLAR_AT.tx + 2, PILLAR_AT.ty + 1.6], w: TRAIL * 0.8, dirt: true },
  { a: [MALL_TILE.tx - 0.7, MALL_TILE.ty + 1.6], b: [MALL_TILE.tx - 0.7, POND.y], w: 0.6 },              // the mall's and the Nietos' doorsteps down to the low road
  { a: [NIETOS_AT.tx + 1, NIETOS_AT.ty + 2.6], b: [NIETOS_AT.tx + 1, POND.y], w: 0.6 },
  { a: [WORKSHOP_AT.tx + 1, WORKSHOP_AT.ty + 2.6], b: [WORKSHOP_AT.tx + 1, START.y], w: 0.6, towns: true },   // Kurt's doorstep down to the east avenue
];
// round the pond, a ring of stone to walk
const RINGS = [{ x: POND.x, y: POND.y, r: POND.r + 0.75, w: 0.42 }];

let THREE, renderer, scene, camera, post, root, view, screen, acts, dexBtn;
let hemi, sun, ring, ground, forest, placeGroup, vista = null;
let mon = null, walker = { x: 0, z: 0, tile: SPAWN, path: [], facing: 'front', flip: false, hop: 0 };
let places = [], blocked = new Set(), aim = null, here = null, card, bar, barKey = null, barCoins = null, saved = null;
let glowMats = [], lamps = [], bugs = null, flyer = null, nextFly = 0, stepAt = 0, airAt = 0, tree = null, sign = null, inside = null, entering = null, leaving = null;   // inside: the place walked into, 'base' or 'mall'
let stops = {}, calm = false, time = '', running = false, last = 0, fpsLog = [], camX = 0, camZ = 0, fpsEl = null, sealed = null, gateFx = null;
let built = null;   // the promise of the first build
let seasonMats = [], snow = null;   // the season's lit decorations (kept apart from glowMats, which buildPlaces() remakes) and its snowfall
let yardTiles = new Set(), spooks = null, cauldron = null, cracks = null;   // the tiles the season's decorations stand on (nothing walks through them), Halloween's ghosts and its cauldron
let pcMail = null;  // the envelope bobbing over the PC while its mailbox has a letter (js/mail.js)
let questMark = null, nietosMark = null;   // the "!" over the quest board (a notice to read) and over the Nietos' house (a step to hand them; boardNow())
let pcNews = null;  // else a yellow "!" while this device hasn't read the newest patch notes (js/patchnotes.js)
let placed = false; // the partner has been put on the plaza once
let greets = false; // listening for the logo's fade to end
let held = false;   // drawn behind the shut Pokédex, waiting for enterHub(): no partner, no keys, no taps
let arriving = false;   // walking in from the bottom of the screen (enterHub())
let showing = null; // a showHub() under way, so two calls at once never build two partners
let outbound = null, returning = false;   // walking out under the gate to a run (walkOut()), and back in from one

const tileX = (tx) => tx + 0.5 - X0;
const tileZ = (ty) => ty + 0.5 - Z0;
const key = (x, y) => `${x},${y}`;

/* ---------- painting ---------- */

function art(w, h) {
  const c = new OffscreenCanvas(w, h), g = c.getContext('2d', { willReadFrequently: true });
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
  const mix = (c, t, k) => c.map((n, i) => Math.round(n + (t[i] - n) * k));
  const stone = STONE.map(rgb), [mortar, kerb, kerbDark] = [STONE_MORTAR, ...STONE_KERB].map(rgb);
  const snowy = (c, x, y) => (GROUND.snowy ? mix(c, [244, 248, 252], smooth(x + 40, y + 17, 4) > 0.6 ? 0.6 : 0.2) : c);
  const roadsAt = (u, v, dirt) => {
    let d = Infinity;
    for (const r of ROADS) if (!!r.dirt === dirt && !(r.towns && !townsOpen())) d = Math.min(d, seg(u, v, [r.a, r.b]) - r.w);
    if (!dirt) for (const r of RINGS) d = Math.min(d, Math.abs(Math.hypot(u - r.x, v - r.y) - r.r) - r.w);
    return d;
  };
  // cobbles laid in courses, every other one shifted half a stone; a stone's shade from its own cell
  const cobble = (x, y) => {
    const row = Math.floor(y / 4), sx = x + (row % 2) * 3;
    if (y % 4 === 0 || sx % 6 === 0) return mortar;
    const n = hash(Math.floor(sx / 6), row) + hash(x, y) * 0.25;
    return stone[n > 0.95 ? 0 : n > 0.62 ? 1 : n > 0.3 ? 2 : 3];
  };
  // the plaza: stones in rings round the Waystone, a Poké Ball laid in the middle, a dark ring of stone RING_R out
  const plaza = (x, y, du, dv) => {
    const r = Math.hypot(du, dv);
    if (r < 1.5) {
      if (r > 1.38 || Math.abs(dv) < 0.11) return mix(stone[3], [40, 36, 44], 0.75);
      if (r < 0.5) return r > 0.4 ? mix(stone[3], [40, 36, 44], 0.75) : stone[0];
      const n = hash(Math.floor(x / 3), Math.floor(y / 3));
      return dv < 0 ? mix([214, 64, 52], [150, 34, 30], n * 0.5) : mix(stone[0], stone[1], n);
    }
    if (Math.abs(r - RING_R) < 0.14) return mix(stone[3], [70, 74, 92], 0.55);
    const ring = Math.floor(r * TP / 4), arc = Math.floor(Math.atan2(dv, du) * r * TP / 6 + (ring % 2) * 0.5);
    if (Math.abs(r * TP / 4 - Math.round(r * TP / 4)) < 0.14 || Math.abs(((Math.atan2(dv, du) * r * TP / 6 + (ring % 2) * 0.5) % 1 + 1) % 1) < 0.12) return mortar;
    const n = hash(ring, arc) + hash(x, y) * 0.2;
    return stone[n > 0.92 ? 0 : n > 0.55 ? 1 : n > 0.25 ? 2 : 3];
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / TP - M - 0.5, v = y / TP - M - 0.5;
    const wob = (smooth(x, y, 5) - 0.5) * 0.22;
    const pr = Math.hypot(u - START.x, v - START.y) - PLAZA_R;
    const paved = Math.min(roadsAt(u, v, false), pr), dirtD = roadsAt(u, v, true) - wob;
    const pond = Math.hypot(u - POND.x, v - POND.y) - POND.r;
    let c;
    if (pond < 0.2) {   // the pond's bed, deep in the middle, a ring of sand round its edge
      c = pond > 0 ? mix([226, 206, 152], [190, 168, 120], hash(x, y)) : mix([70, 140, 170], [30, 74, 110], Math.min(1, -pond / POND.r * 1.6));
    } else if (paved < 0) {
      c = paved > -0.1 ? (paved > -0.05 ? kerbDark : kerb) : pr < 0 ? plaza(x, y, u - START.x, v - START.y) : cobble(x, y);
      if (pr >= 0 && hash(x * 3, y * 7) > 0.992) c = mix(c, GROUND.meadow.map(rgb)[3], 0.6);   // a tuft between the stones
      c = snowy(c, x, y);
    } else if (dirtD < 0) {
      const n = smooth(x + 99, y, 3) + hash(x, y) * 0.35;
      c = dirt[dirtD > -0.06 ? 3 : n > 1.0 ? 0 : n > 0.62 ? 1 : 2];
      if (hash(x * 3, y * 7) > 0.985) c = dirt[3];
      c = snowy(c, x, y);
    } else {
      // darker away from the walkable ground, towards the forest down the sides and the hedge in front (the meadow behind
      // stays open)
      const out = Math.max(-u - 0.5, u - (COLS - 0.5), v - (ROWS - 0.5), 0);
      const n = smooth(x, y, 6) * 3.2 + hash(x, y) * 1.4 + (Math.min(paved, dirtD) < 0.12 ? 1 : 0) + Math.min(2, out * 0.6);
      c = meadow[Math.min(5, Math.max(0, Math.floor(n)))];
    }
    const i = (y * W + x) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  a.g.putImageData(img, 0, 0);
  const onPath = (x, y) => { const u = x / TP - M - 0.5, v = y / TP - M - 0.5; return Math.min(roadsAt(u, v, false), roadsAt(u, v, true), Math.hypot(u - START.x, v - START.y) - PLAZA_R, Math.hypot(u - POND.x, v - POND.y) - POND.r - 0.3) < 0.25; };
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

/** The Whispering Clearing's gate, the way out to every run (first 2026-10-09; made grander 2026-10-14, the user's ask:
    cleaner, more extravagant and easy to spot from anywhere in the Clearing): a shrine-like gate on carved stone feet
    whose leaf runes glow, mossy log pillars wound with flowering ivy and hung with teal banners, a green-shingled roof
    sweeping up at both ends with paper lanterns off its tips, a gold-rayed crest of the Clearing's leaf on its ridge, the
    WHISPERING CLEARING board between the beams, a garland and wind chimes (the whispering) under the lower beam. The
    opening is clear, so the road and your partner show going on through it, and it shimmers (buildGateway()). */
const GATE_W = 84, GATE_H = 100, GATE_OPEN = [23, 61], GATE_FEET = [10.5, 73.5], GATE_BEAM = 47;
function clearingGateArt() {
  const W = GATE_W, H = GATE_H, { c, g, fill, rr, lin, shine } = fine(W, H, 10), rnd = seeded(13), glow = shine();
  const WD = ['#d8a868', '#a87440', '#7a4e26', '#4a2c12'];
  const GOLD = ['#fff2a8', '#f8d048', '#c89418', '#8a6010'];
  const TEAL = ['#8ae0d0', '#3ea898', '#1e7068', '#0e4440'];
  const both = (col, glowCol, path) => { fill(col, () => path(g)); glow.fillStyle = glowCol; glow.beginPath(); path(glow); glow.fill(); };
  const sprout = (gg, x, y, s) => {   // the Clearing's mark: three leaves from one stem
    gg.moveTo(x, y + s); gg.quadraticCurveTo(x - s * 0.55, y, x, y - s); gg.quadraticCurveTo(x + s * 0.55, y, x, y + s);
    gg.moveTo(x, y + s * 0.9); gg.quadraticCurveTo(x - s * 0.5, y + s * 0.05, x - s * 1.05, y + s * 0.15); gg.quadraticCurveTo(x - s * 0.55, y + s * 0.75, x, y + s * 0.9);
    gg.moveTo(x, y + s * 0.9); gg.quadraticCurveTo(x + s * 0.5, y + s * 0.05, x + s * 1.05, y + s * 0.15); gg.quadraticCurveTo(x + s * 0.55, y + s * 0.75, x, y + s * 0.9);
  };

  // the stone feet: a capped plinth with a recessed panel, a glowing rune of the mark in it, moss on the cap
  for (const x0 of [GATE_FEET[0], GATE_FEET[1] - 15]) {
    rr(x0 - 1.4, 95, 17.8, 4, 1.2, lin(0, 95, 0, 99, [P.stone[1], P.stone[2], P.stone[3]]));
    rr(x0, 77, 15, 19, 1.4, lin(x0, 0, x0 + 15, 0, [P.stone[0], P.stone[0], P.stone[1], P.stone[2]]));
    rr(x0 + 3, 80.6, 9, 12, 1.4, lin(0, 80.6, 0, 92.6, [P.stone[3], P.stone[2]]));
    rr(x0 + 3.6, 81.2, 7.8, 10.8, 1.1, lin(0, 81.2, 0, 92, ['#5e6a64', '#7a8680']));
    both('#9ff8e0', '#5ef0d0', (gg) => sprout(gg, x0 + 7.5, 86.4, 3.2));
    rr(x0 - 1, 74.6, 17, 3.6, 1.2, lin(0, 74.6, 0, 78.2, [P.stone[0], P.stone[1], P.stone[2]]));
    rr(x0 - 0.4, 75, 15.8, 0.7, 0.35, 'rgba(255,255,255,0.6)');
    for (let i = 0; i < 4; i++) fill(i % 2 ? P.moss[0] : P.moss[1], () => g.ellipse(x0 + 1 + rnd() * 13, 75.2 + rnd() * 1.2, 1.6, 0.8, 0, 0, Math.PI * 2));
  }

  // the pillars: mossy logs with a gold collar at either end
  for (const x of [GATE_OPEN[0] - 10, GATE_OPEN[1]]) {
    rr(x, 24, 10, 52, 2.4, lin(x, 0, x + 10, 0, [WD[0], WD[1], WD[1], WD[2], WD[3]]));
    for (let y = 31; y < 74; y += 5) strokeOn(g, 'rgba(70,38,14,0.35)', 0.32, () => { g.moveTo(x + 1.2, y); g.quadraticCurveTo(x + 5, y + 1.5, x + 8.8, y); });
    fill('rgba(66,38,14,0.55)', () => g.ellipse(x + 3 + rnd() * 4, 38 + rnd() * 6, 0.8, 1.2, 0, 0, Math.PI * 2));
    for (const y of [30, 71.4]) {
      rr(x - 0.7, y, 11.4, 2.4, 0.9, lin(x, 0, x + 11, 0, [GOLD[2], GOLD[0], GOLD[1], GOLD[3]]));
      rr(x - 0.2, y + 0.3, 10.4, 0.5, 0.25, 'rgba(255,255,255,0.55)');
    }
  }
  const vine = (x0, dir) => {   // ivy climbing each pillar's outer side, flowering
    const pts = [];
    for (let y = 75; y > 32; y -= 2) pts.push([x0 + Math.sin(y * 0.42 * dir) * 1.6, y]);
    strokeOn(g, '#2e6a28', 0.45, () => { g.moveTo(...pts[0]); pts.forEach(p => g.lineTo(...p)); });
    pts.forEach(([x, y], i) => {
      leaf(g, x, y, (i % 2 ? -0.5 : Math.PI + 0.5), 1.7 + rnd() * 0.7, P.moss[i % 2]);
      if (i % 5 === 2) blossom(g, x + (i % 2 ? 0.8 : -0.8), y, 0.55, i % 10 === 2 ? '#f8b8d8' : '#ffffff', '#f8d048');
    });
  };
  vine(GATE_OPEN[0] - 8.6, 1); vine(GATE_OPEN[1] + 8.6, -1);

  // the banners down the pillars, hung from the lower beam: teal cloth trimmed in gold, the mark on each, swallow-tailed
  for (const cx of [GATE_OPEN[0] - 5, GATE_OPEN[1] + 5]) {
    const cloth = () => { g.moveTo(cx - 4, 48.4); g.lineTo(cx + 4, 48.4); g.lineTo(cx + 4, 69.5); g.lineTo(cx, 65.8); g.lineTo(cx - 4, 69.5); g.closePath(); };
    fill('rgba(0,0,0,0.25)', () => { g.save(); g.translate(0.6, 0.5); cloth(); g.restore(); });
    fill(lin(cx - 4, 0, cx + 4, 0, [TEAL[2], TEAL[1], TEAL[1], TEAL[2], TEAL[3]]), cloth);
    strokeOn(g, GOLD[1], 0.55, cloth);
    for (const dx of [-1.6, 1.6]) strokeOn(g, 'rgba(10,50,48,0.35)', 0.3, () => { g.moveTo(cx + dx, 50); g.lineTo(cx + dx, 66); });
    strokeOn(g, GOLD[1], 0.45, () => g.arc(cx, 56.2, 2.8, 0, Math.PI * 2));
    both('#f8e070', '#a08020', (gg) => sprout(gg, cx, 56.2, 1.8));
    rr(cx - 5, 47.4, 10, 1.4, 0.7, lin(0, 47.4, 0, 48.8, [GOLD[0], GOLD[2]]));
    for (const dx of [-5, 5]) fill(GOLD[1], () => g.arc(cx + dx, 48.1, 0.9, 0, Math.PI * 2));
  }

  // the lower beam through both pillars, gold-capped
  rr(3, 42, 78, 5, 1.2, lin(0, 42, 0, 47, [WD[0], WD[1], WD[2]]));
  rr(3.6, 42.4, 76.8, 0.7, 0.35, 'rgba(255,240,200,0.5)');
  for (const x of [2.2, 79.4]) rr(x, 41.5, 2.4, 6, 0.8, lin(0, 41.5, 0, 47.5, [GOLD[0], GOLD[1], GOLD[3]]));
  // the dark beam under the roof
  rr(6.5, 24.4, 71, 4.6, 1, lin(0, 24.4, 0, 29, ['#5a3a20', '#3a2210', '#24140a']));

  // the roof: green shingles sweeping up at both ends, a ridge along its top, gold curls at its tips
  const yTop = (x) => 18.5 - 8 * ((x - 42) / 42.5) ** 2, yBot = (x) => 26 - 11.5 * ((x - 42) / 42.5) ** 2;
  const roof = (gg = g) => {
    gg.moveTo(-0.5, 10.5); gg.quadraticCurveTo(20, 18.5, 42, 18.5); gg.quadraticCurveTo(64, 18.5, 84.5, 10.5);
    gg.lineTo(84.5, 14.5); gg.quadraticCurveTo(64, 26, 42, 26); gg.quadraticCurveTo(20, 26, -0.5, 14.5); gg.closePath();
  };
  fill('rgba(0,0,0,0.25)', () => g.rect(7, 26, 70, 1.6));
  fill(lin(0, 10, 0, 26, ['#8ad8a8', '#4aa880', '#2a7a5c', '#1a5440']), roof);
  g.save(); g.beginPath(); roof(); g.clip();
  for (let x = 1; x < W; x += 2.4) strokeOn(g, 'rgba(10,48,34,0.45)', 0.3, () => { g.moveTo(x, yTop(x) - 1); g.lineTo(x + (x - 42) * 0.03, yBot(x) + 1); });
  for (const k of [0.4, 0.72]) strokeOn(g, 'rgba(10,48,34,0.4)', 0.3, () => { for (let x = 0; x <= W; x += 2) g.lineTo(x, yTop(x) + (yBot(x) - yTop(x)) * k); });
  g.fillStyle = lin(0, 22, 0, 27, ['rgba(10,40,30,0)', 'rgba(10,40,30,0.4)']); g.fillRect(0, 20, W, 8);
  g.restore();
  strokeOn(g, '#1e5a42', 1.5, () => { g.moveTo(-0.5, 10.5); g.quadraticCurveTo(20, 18.5, 42, 18.5); g.quadraticCurveTo(64, 18.5, 84.5, 10.5); });
  strokeOn(g, GOLD[1], 0.45, () => { g.moveTo(0, 10.2); g.quadraticCurveTo(20, 18, 42, 18); g.quadraticCurveTo(64, 18, 84, 10.2); });
  strokeOn(g, 'rgba(255,255,255,0.4)', 0.35, () => { g.moveTo(1, 12.4); g.quadraticCurveTo(20, 20.4, 42, 20.4); g.quadraticCurveTo(64, 20.4, 83, 12.4); });
  for (const [x, d] of [[1.6, 1], [82.4, -1]]) {
    fill(lin(0, 9, 0, 15, [GOLD[0], GOLD[1], GOLD[3]]), () => g.arc(x, 12.4, 2.2, 0, Math.PI * 2));
    strokeOn(g, GOLD[3], 0.4, () => g.arc(x + d * 0.3, 12.2, 1.1, 0, Math.PI * 1.5));
  }

  // the crest on the ridge: gold rays round a gold ring, the mark in glowing glass inside it, leafy sprigs either side
  const cx = 42, cy = 11;
  for (const d of [-1, 1]) for (let i = 0; i < 5; i++) {
    const x = cx + d * (9.4 + i * 2.6);
    leaf(g, x, yTop(x) - 0.2, d < 0 ? Math.PI + 0.35 + i * 0.05 : -0.35 - i * 0.05, 2.6 - i * 0.25, P.moss[i % 2]);
    if (i === 2) blossom(g, x, yTop(x) - 1.4, 0.55, '#ffffff', '#f8d048');
  }
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2, r1 = i % 2 ? 9.2 : 10.6, w = 0.16;
    both(i % 2 ? GOLD[1] : GOLD[0], '#806010', (gg) => { gg.moveTo(cx + Math.cos(a - w) * 7, cy + Math.sin(a - w) * 7); gg.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); gg.lineTo(cx + Math.cos(a + w) * 7, cy + Math.sin(a + w) * 7); gg.closePath(); });
  }
  fill('rgba(0,0,0,0.25)', () => g.arc(cx + 0.4, cy + 0.5, 7.8, 0, Math.PI * 2));
  fill(lin(cx - 7, cy - 7, cx + 7, cy + 7, [GOLD[0], GOLD[1], GOLD[2], GOLD[3]]), () => g.arc(cx, cy, 7.6, 0, Math.PI * 2));
  strokeOn(g, GOLD[3], 0.4, () => g.arc(cx, cy, 6.3, 0, Math.PI * 2));
  const disc = g.createRadialGradient(cx - 2, cy - 2, 0.5, cx, cy, 6);
  disc.addColorStop(0, '#c8fff0'); disc.addColorStop(0.5, TEAL[1]); disc.addColorStop(1, TEAL[3]);
  both(disc, '#2a8a78', (gg) => gg.arc(cx, cy, 5.9, 0, Math.PI * 2));
  both('#f4fff8', '#b8fff0', (gg) => sprout(gg, cx, cy + 0.2, 3.6));
  strokeOn(g, 'rgba(30,110,90,0.6)', 0.25, () => { g.moveTo(cx, cy + 3.6); g.lineTo(cx, cy - 2.6); });
  fill('rgba(255,255,255,0.6)', () => g.ellipse(cx - 2.6, cy - 2.8, 1.4, 0.7, -0.6, 0, Math.PI * 2));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; fill(GOLD[0], () => g.arc(cx + Math.cos(a) * 6.95, cy + Math.sin(a) * 6.95, 0.38, 0, Math.PI * 2)); }

  // the name board between the beams, gold-framed
  rr(24.6, 29.6, 35.6, 12.4, 1.8, 'rgba(0,0,0,0.28)');
  rr(24, 29, 36, 12.6, 1.8, lin(0, 29, 0, 41.6, [GOLD[0], GOLD[1], GOLD[3]]));
  rr(25.3, 30.3, 33.4, 10, 1.2, lin(0, 30.3, 0, 40.3, ['#7cc6c0', '#3e8a90', '#1e5a62']));
  rr(26.3, 30.9, 31.4, 0.8, 0.4, 'rgba(255,255,255,0.35)');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 5px "Trebuchet MS", "Arial Black", sans-serif';
  g.fillStyle = 'rgba(10,40,44,0.7)'; g.fillText('WHISPERING', 42.35, 34.45, 30);
  g.fillStyle = '#fbf8e4'; g.fillText('WHISPERING', 42, 34.1, 30);
  g.font = '800 2.8px "Trebuchet MS", sans-serif';
  g.fillStyle = '#f8e070'; g.fillText('C L E A R I N G', 42, 38.3, 26);
  for (const x of [28.6, 55.4]) leaf(g, x, 38.3, x < 42 ? Math.PI : 0, 1.9, '#a8e070');

  // paper lanterns off the roof's upswept tips, lit at dusk
  for (const x of [4.4, 79.6]) {
    strokeOn(g, '#3a2410', 0.3, () => { g.moveTo(x, 14); g.lineTo(x, 17.4); });
    rr(x - 1.5, 17.2, 3, 0.9, 0.4, '#3a2410');
    const body = (gg) => gg.ellipse(x, 21.4, 2.5, 3.4, 0, 0, Math.PI * 2);
    both(lin(x - 2.5, 0, x + 2.5, 0, ['#ffe098', '#f8a048', '#c86020']), '#ffb060', body);
    for (const rx of [0.9, 1.8]) strokeOn(g, 'rgba(120,50,10,0.45)', 0.2, () => g.ellipse(x, 21.4, rx, 3.4, 0, 0, Math.PI * 2));
    fill('rgba(255,245,210,0.6)', () => g.ellipse(x - 1, 20.2, 0.6, 1.2, 0, 0, Math.PI * 2));
    rr(x - 1.3, 24.6, 2.6, 0.8, 0.35, '#3a2410');
    strokeOn(g, '#e04838', 0.45, () => { g.moveTo(x, 25.4); g.lineTo(x, 28); });
  }

  // the garland under the lower beam, and wind chimes hung inside it: a glass bell, three rods and a paper strip each
  for (const [a, b] of [[GATE_OPEN[0], 42], [42, GATE_OPEN[1]]]) {
    const pts = [];
    for (let t = 0; t <= 1; t += 0.07) pts.push([a + (b - a) * t, 47 + Math.sin(t * Math.PI) * 3.6]);
    strokeOn(g, '#2e6a28', 0.4, () => { g.moveTo(...pts[0]); pts.forEach(p => g.lineTo(...p)); });
    pts.forEach(([x, y], i) => leaf(g, x, y, Math.PI / 2 + (i % 2 ? 0.7 : -0.7), 1.6 + rnd() * 0.6, P.moss[i % 2]));
    for (const [t, p] of [[0.3, '#f8b8d8'], [0.5, '#ffffff'], [0.7, '#f8e048']]) blossom(g, a + (b - a) * t, 47.4 + Math.sin(t * Math.PI) * 3.6, 0.6, p, '#f89830');
  }
  for (const [x, len] of [[29.5, 1], [54.5, 0.85]]) {
    strokeOn(g, '#3a2410', 0.25, () => { g.moveTo(x, 47); g.lineTo(x, 51); });
    const bell = (gg) => { gg.moveTo(x - 2, 54); gg.quadraticCurveTo(x - 2, 50.6, x, 50.6); gg.quadraticCurveTo(x + 2, 50.6, x + 2, 54); gg.closePath(); };
    both(lin(x - 2, 0, x + 2, 0, ['#e8fbff', '#9ce0f0', '#5ab0d0']), '#a8e8ff', bell);
    fill('rgba(255,255,255,0.7)', () => g.ellipse(x - 0.9, 52, 0.35, 0.9, 0, 0, Math.PI * 2));
    for (const [dx, l] of [[-1.2, 5], [0, 6.4], [1.2, 4.4]]) {
      strokeOn(g, '#c8e8f0', 0.4, () => { g.moveTo(x + dx, 54); g.lineTo(x + dx, 54 + l * len); });
      strokeOn(glow, '#6a9aa8', 0.4, () => { glow.moveTo(x + dx, 54); glow.lineTo(x + dx, 54 + l * len); });
    }
    strokeOn(g, '#3a2410', 0.2, () => { g.moveTo(x, 54); g.lineTo(x, 54 + 7.5 * len); });
    rr(x - 0.9, 54 + 7.5 * len, 1.8, 4.6, 0.3, '#f8f0d8');
    rr(x - 0.9, 54 + 7.5 * len, 1.8, 0.9, 0.3, '#e05848');
  }

  // hydrangeas round the feet, grass and flowers along the ground
  for (const [x, y] of [[4.6, 94.5], [79.4, 94.5]]) {
    for (let i = 0; i < 6; i++) leaf(g, x, y + 2, -Math.PI / 2 + (i - 2.5) * 0.5, 3 + rnd(), P.moss[i % 2]);
    for (let i = 0; i < 16; i++) {
      const a = rnd() * Math.PI * 2, r = rnd() * 2.6;
      blossom(g, x + Math.cos(a) * r, y - 1 + Math.sin(a) * r * 0.8, 0.45, ['#a8b8f8', '#c8a8f0', '#88c8f8'][i % 3], '#f4f0ff');
    }
  }
  for (const x of [8, 27, 57, 76]) tuft(g, x, 99.4, 9, rnd);
  for (const [x, y, p] of [[26, 98.6, '#ffffff'], [29, 98.9, '#f8e048'], [55, 98.6, '#f8a0c8'], [58, 98.9, '#ffffff']]) blossom(g, x, y, 0.5, p, '#f89830');
  return c;
}

/** The shimmer hung in the gate's opening: soft light rising from the ground and fading up, in faint streaks. */
function gateVeilArt() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  const up = g.createLinearGradient(0, 128, 0, 0);
  up.addColorStop(0, 'rgba(210,255,236,0.95)'); up.addColorStop(0.35, 'rgba(180,250,230,0.55)'); up.addColorStop(1, 'rgba(160,240,255,0)');
  g.fillStyle = up; g.fillRect(0, 0, 64, 128);
  g.globalCompositeOperation = 'lighter';
  const rnd = seeded(29);
  for (let i = 0; i < 9; i++) {
    const x = 6 + rnd() * 52, s = g.createLinearGradient(0, 128, 0, 20 + rnd() * 40);
    s.addColorStop(0, 'rgba(255,255,240,0.35)'); s.addColorStop(1, 'rgba(255,255,240,0)');
    g.fillStyle = s; g.fillRect(x, 0, 1.5 + rnd() * 2.5, 128);
  }
  g.globalCompositeOperation = 'destination-in';
  const side = g.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, 'rgba(0,0,0,0)'); side.addColorStop(0.25, 'rgba(0,0,0,1)'); side.addColorStop(0.75, 'rgba(0,0,0,1)'); side.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = side; g.fillRect(0, 0, 64, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
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
  // only the short roots at its foot (the user's call, 2026-10-14: the long ones reaching out to the sides looked like stray branches)
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
export function newsArt() {
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
export function kioskArt(K = KIT) {
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
// set back off the ring road (x 4) a little left of its tiles' middle (the user's ask, 2026-10-14: its side stood on it)
const MALL_AT = { x: tileX(MALL_TILE.tx) - 0.7, z: tileZ(MALL_TILE.ty) + 0.25, turn: 0 };

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

/* ---------- the Waystone ring, the Nietos' house and Kenmatta's dojo (2026-10-14) ---------- */

let stoneLit = null;   // the Waystone's runes and crystals, pulsed and turned each frame (liveStones())

/** The Clearing's Waystone (one, not five, 2026-10-14): the towns' whole Waystone (js/event-3d.js's wholeWaystone()) on a
    plinth over the plaza's Poké Ball, its runes a pale silver light, and round its tip five small crystals orbiting, one a
    town in its RING colour, lit once that town's Waystone is mended, else a dull pebble. */
function clearingWaystone(g, lit, whole = true) {
  const s = new THREE.Group(), S = 1.7;
  s.position.set(tileX(START.x), 0, tileZ(START.y));
  s.scale.setScalar(S);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true, ...o });
  const stone = std({ color: whole ? '#b4b0a4' : '#8e8a80' }), dark = std({ color: '#6e6a60', roughness: 1 });
  const any = whole && lit.some(Boolean);
  const glow = std({ color: '#3a4a60', emissive: new THREE.Color(any ? '#d8f0ff' : '#90a8c0'), emissiveIntensity: any ? 1.2 : whole ? 0.45 : 0.12, roughness: 0.4, flatShading: false });
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; s.add(o); return o; };
  add(new THREE.CylinderGeometry(0.4, 0.45, 0.12, 8), dark, 0, 0.06, 0);
  add(new THREE.CylinderGeometry(0.3, 0.35, 0.12, 8), stone, 0, 0.18, 0);
  const geo = new THREE.CylinderGeometry(0.035, 0.23, 1.45, 4, 1); geo.translate(0, 0.725, 0); geo.rotateY(Math.PI / 4);
  add(geo, stone, 0, 0.24, 0).scale.set(1, 1, 1.25);
  for (const [y, w] of [[0.46, 0.13], [0.68, 0.11], [0.9, 0.09], [1.12, 0.065]]) {   // runes up its front and back
    for (const z of [1, -1]) add(new THREE.BoxGeometry(w, 0.035, 0.015), glow, 0, y, z * (0.18 * (1.69 - y) / 1.45 + 0.008)).castShadow = false;
  }
  for (let i = 0; i < 8; i++) {   // rune stones round its foot
    const a = i / 8 * Math.PI * 2, m = add(new THREE.BoxGeometry(0.09, 0.035, 0.06), glow, Math.cos(a) * 0.52, 0.03, Math.sin(a) * 0.52);
    m.rotation.y = -a; m.castShadow = false;
  }
  if (!whole) {   // cracked straight through till the Nietos' questline mends it (step 7): a dark zigzag up both faces
    const crack = std({ color: '#1c1a18', roughness: 1 });
    for (const z of [1, -1]) {
      for (const [y, x, r] of [[0.36, 0.02, 0.5], [0.58, -0.02, -0.6], [0.8, 0.015, 0.45], [1.0, -0.01, -0.5]]) {
        const m = add(new THREE.BoxGeometry(0.016, 0.24, 0.012), crack, x, y, z * (0.18 * (1.69 - y) / 1.45 + 0.012));
        m.rotation.z = r; m.castShadow = false;
      }
    }
  }
  const orbit = new THREE.Group();
  orbit.position.y = 1.6;
  s.add(orbit);
  const gems = RING.map((t, i) => {
    const on = lit[i], m = on
      ? std({ color: t.glow, emissive: new THREE.Color(t.glow), emissiveIntensity: 1.5, roughness: 0.35, flatShading: true })
      : std({ color: '#5e5a54', roughness: 0.9 });
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(on ? 0.085 : 0.065, 0), m);
    const a = i / RING.length * Math.PI * 2;
    gem.position.set(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32);
    gem.scale.y = 1.5;
    orbit.add(gem);
    return { gem, m, on, a };
  });
  if (any) {   // its light pooled on the plaza, in the colour of the towns it reaches
    const c = new THREE.Color(0, 0, 0);
    RING.forEach((t, i) => { if (lit[i]) c.add(new THREE.Color(t.glow)); });
    c.multiplyScalar(1 / Math.max(1, lit.filter(Boolean).length));
    const pool = new THREE.Mesh(new THREE.CircleGeometry(0.7, 40), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.02; pool.raycast = () => {};
    s.add(pool);
  }
  stoneLit = { glow, orbit, gems, any, whole };   // no lamp of its own: a light here would recompile the scene's shaders
  g.add(s);
}

function liveStones(now) {
  if (!stoneLit) return;
  const { glow, orbit, gems, any, whole } = stoneLit;
  glow.emissiveIntensity = !whole ? (calm ? 0.12 : 0.1 + 0.08 * Math.max(0, Math.sin(now / 170) * Math.sin(now / 530)))   // a weak, uneven flicker
    : calm ? (any ? 1.2 : 0.45) : any ? 1.1 + 0.3 * Math.sin(now / 700) : 0.35 + 0.15 * Math.sin(now / 1100);
  if (calm) return;
  orbit.rotation.y = now / 2400;
  orbit.position.y = 1.6 + Math.sin(now / 900) * 0.04;
  for (const o of gems) {
    o.gem.rotation.y = now / 600 + o.a;
    o.gem.position.y = Math.sin(now / 520 + o.a * 2) * 0.05;
    if (o.on) o.m.emissiveIntensity = 1.3 + 0.4 * Math.sin(now / 650 + o.a);
  }
}

/** A sign painted on a plank: `lines` of [text, size, colour]. */
function plankArt(w, h, lines, wood = ['#c89a60', '#a8763e', '#7a5226']) {
  const { c, g, rr, lin } = fine(w, h, 10);
  rr(0.2, 0.2, w - 0.4, h - 0.4, 1, lin(0, 0, 0, h, wood));
  g.strokeStyle = 'rgba(60,30,10,0.5)'; g.lineWidth = 0.3; g.strokeRect(0.6, 0.6, w - 1.2, h - 1.2);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach(([text, size, col], i) => { g.font = `900 ${size}px "Trebuchet MS", "Arial Black", sans-serif`; g.fillStyle = col; g.fillText(text, w / 2, h * (i + 1) / (lines.length + 1)); });
  return c;
}

let duck = null;      // the pond's duck (liveDuck())
let smoke = null;     // the puffs rising from the Nietos' chimney (liveSmoke())
let cottage = null;   // the Nietos' house's paintings, painted once
const BLOOMS = ['#f890b8', '#f8d848', '#ffffff', '#b8a0f0', '#8cc8f8', '#f86880'];

/** The Nietos' house's paintings: butter-cream clapboard, scalloped blue shingles, a stone footing, chimney bricks, the
    door and windows (their glass lit through shine()), a heart-cut shutter, baby Linc's washing and the note on the door. */
function cottageArt() {
  if (cottage) return cottage;
  const rnd = seeded(7);
  const siding = fine(40, 24, 8);
  for (let y = 0; y < 24; y += 3) {
    siding.g.fillStyle = siding.lin(0, y, 0, y + 3, ['#fff8e2', '#fcefcf', '#efdcb2']);
    siding.g.fillRect(0, y, 40, 3);
    siding.g.fillStyle = 'rgba(140,100,60,0.4)'; siding.g.fillRect(0, y + 2.7, 40, 0.3);
  }
  // shingles drawn from the eave up, so each row's scallops lap over the row below
  const sh = fine(56, 34, 8);
  sh.g.fillStyle = '#2a5690'; sh.g.fillRect(0, 0, 56, 34);
  sh.g.strokeStyle = '#2e5c96'; sh.g.lineWidth = 0.3;
  for (let row = 12; row >= 0; row--) {
    const y = row * 2.8 - 1.4;
    for (let x = row % 2 ? -2 : 0; x < 56; x += 4) {
      const t = rnd(), cols = t < 0.15 ? ['#a4d0f4', '#78b0e2', '#5490cc'] : t < 0.3 ? ['#80b4e4', '#5088c4', '#3a6eac'] : ['#94c4ee', '#64a0d8', '#4880c0'];
      sh.fill(sh.lin(0, y, 0, y + 4.2, cols), () => { sh.g.moveTo(x, y); sh.g.lineTo(x + 4, y); sh.g.lineTo(x + 4, y + 2.2); sh.g.arc(x + 2, y + 2.2, 2, 0, Math.PI); sh.g.closePath(); });
      sh.g.beginPath(); sh.g.arc(x + 2, y + 2.2, 1.85, 0.1, Math.PI - 0.1); sh.g.stroke();
    }
  }
  const st = fine(52, 6, 8);
  st.g.fillStyle = '#7a7468'; st.g.fillRect(0, 0, 52, 6);
  const greys = [['#e8e2d4', '#c8c0ae', '#a8a090'], ['#dcd6c8', '#bcb4a2', '#9c9484'], ['#ece4d0', '#d0c4a8', '#b0a488']];
  for (const [y, x0] of [[0.3, 0.3], [3.1, -1.5]]) {
    for (let x = x0; x < 52;) { const w = 2.6 + rnd() * 2.4; st.rr(x, y, w - 0.4, 2.6, 0.9, st.lin(0, y, 0, y + 2.6, greys[Math.floor(rnd() * 3)])); x += w; }
  }
  const br = fine(12, 36, 8);
  br.g.fillStyle = '#d8c8b4'; br.g.fillRect(0, 0, 12, 36);
  for (let r = 0; r < 18; r++) for (let x = r % 2 ? -2 : 0; x < 12; x += 4) br.rr(x + 0.2, r * 2 + 0.2, 3.6, 1.6, 0.3, ['#c0604a', '#b05040', '#c87458', '#a84a38'][Math.floor(rnd() * 4)]);
  // the door: four-panelled, a fanlight over it, a brass knob
  const dr = fine(20, 36, 8), ds = dr.shine();
  dr.rr(0, 0, 20, 36, 1, '#ffffff');
  dr.rr(1.6, 1.6, 16.8, 34.4, 1, dr.lin(0, 0, 20, 0, ['#4a86c4', '#3a70b0', '#2e5e98']));
  const fan = (gg, col) => { gg.fillStyle = col; gg.beginPath(); gg.moveTo(4, 10); gg.arc(10, 10, 6, Math.PI, 0); gg.closePath(); gg.fill(); };
  fan(dr.g, dr.lin(0, 4, 0, 10, ['#fff4cc', '#ffd890', '#f0b060']));
  fan(ds, '#d0d0d0');
  dr.g.strokeStyle = '#ffffff'; dr.g.lineWidth = 0.7;
  dr.g.beginPath(); dr.g.arc(10, 10, 6, Math.PI, 0); dr.g.moveTo(4, 10); dr.g.lineTo(16, 10);
  for (const a of [0.25, 0.5, 0.75]) { dr.g.moveTo(10, 10); dr.g.lineTo(10 - Math.cos(a * Math.PI) * 6, 10 - Math.sin(a * Math.PI) * 6); }
  dr.g.stroke();
  for (const [x, y, w, hh] of [[4, 13, 5, 9], [11, 13, 5, 9], [4, 24.5, 12, 8.5]]) {
    dr.rr(x, y, w, hh, 0.6, '#285488');
    dr.rr(x + 0.5, y + 0.5, w - 1, hh - 1, 0.4, dr.lin(0, y, 0, y + hh, ['#5a96d2', '#3a72b0']));
  }
  dr.fill('#f0c040', () => dr.g.arc(15.6, 23.2, 0.9, 0, Math.PI * 2));
  // a window: pink curtains tied back, a valance, white glazing bars
  const wn = fine(20, 24, 8), ws = wn.shine();
  wn.rr(0, 0, 20, 24, 1, '#ffffff');
  wn.rr(1.8, 1.8, 16.4, 20.4, 0.4, wn.lin(0, 1.8, 0, 22.2, ['#d8f0ff', '#fff2c8', '#ffd890']));
  ws.fillStyle = '#c8c8c8'; ws.fillRect(1.8, 1.8, 16.4, 20.4);
  const drape = (gg, s) => {
    const x0 = s > 0 ? 1.8 : 18.2;
    gg.beginPath(); gg.moveTo(x0, 1.8); gg.lineTo(x0 + s * 6, 1.8); gg.quadraticCurveTo(x0 + s * 1.6, 12, x0 + s * 3.6, 22.2); gg.lineTo(x0, 22.2); gg.closePath(); gg.fill();
  };
  for (const s of [1, -1]) {
    wn.g.fillStyle = wn.lin(0, 0, 0, 22, ['#ffc0d4', '#f088a8']); drape(wn.g, s);
    ws.fillStyle = '#404040'; drape(ws, s);
    wn.rr(s > 0 ? 1.6 : 15.6, 12, 2.8, 1.1, 0.5, '#d85880');
  }
  wn.rr(1.8, 1.8, 16.4, 2.6, 0.6, '#f8a0bc');
  for (let x = 2.8; x < 18; x += 2) wn.fill('#f8a0bc', () => wn.g.arc(x, 4.3, 1, 0, Math.PI));
  wn.rr(9.4, 4.4, 1.2, 17.8, 0, '#ffffff'); wn.rr(1.8, 11.4, 16.4, 1.2, 0, '#ffffff');
  const sht = fine(8, 24, 8);
  sht.rr(0, 0, 8, 24, 0.8, '#3a6ea8');
  sht.rr(0.7, 0.7, 6.6, 22.6, 0.5, sht.lin(0, 0, 8, 0, ['#a8d4f6', '#7cb4e4']));
  for (let y = 7.5; y < 22.5; y += 1.6) sht.rr(1.2, y, 5.6, 0.5, 0.25, 'rgba(40,80,140,0.35)');
  sht.fill('#3a6ea8', () => { sht.g.moveTo(4, 6); sht.g.bezierCurveTo(1.2, 4, 2.2, 1.4, 4, 2.9); sht.g.bezierCurveTo(5.8, 1.4, 6.8, 4, 4, 6); });
  // baby Linc's washing: two little onesies and a bib, pegged on
  const onesie = (col, dark) => {
    const o = fine(10, 11, 10);
    o.fill(col, () => {
      const g = o.g;
      g.moveTo(3, 0.8); g.lineTo(7, 0.8); g.lineTo(9.6, 2.4); g.lineTo(8.6, 4.6); g.lineTo(7.4, 4); g.lineTo(7.4, 7.6);
      g.quadraticCurveTo(7.4, 10.4, 5.8, 10.4); g.lineTo(4.2, 10.4); g.quadraticCurveTo(2.6, 10.4, 2.6, 7.6); g.lineTo(2.6, 4);
      g.lineTo(1.4, 4.6); g.lineTo(0.4, 2.4); g.closePath();
    });
    o.fill(dark, () => o.g.arc(5, 0.8, 1.4, 0, Math.PI));
    for (const x of [4.2, 5, 5.8]) o.fill('#ffffff', () => o.g.arc(x, 9.6, 0.35, 0, Math.PI * 2));
    for (const x of [3.2, 6.8]) o.rr(x - 0.4, 0, 0.8, 1.6, 0.2, '#c89060');
    return o.c;
  };
  const bib = fine(10, 11, 10);
  bib.fill('#f890b8', () => bib.g.ellipse(5, 6.2, 4.4, 4.6, 0, 0, Math.PI * 2));
  bib.fill('#ffffff', () => bib.g.ellipse(5, 6.2, 3.7, 3.9, 0, 0, Math.PI * 2));
  bib.fill('#f890b8', () => bib.g.ellipse(5, 2.2, 1.8, 1.2, 0, 0, Math.PI * 2));
  bib.fill('#f86880', () => { bib.g.moveTo(5, 8.6); bib.g.bezierCurveTo(2.8, 7, 3.4, 4.8, 5, 6); bib.g.bezierCurveTo(6.6, 4.8, 7.2, 7, 5, 8.6); });
  for (const x of [2.6, 7.4]) bib.rr(x - 0.4, 0, 0.8, 1.6, 0.2, '#c89060');
  const note = fine(14, 10, 10);
  note.rr(0.5, 0.8, 13, 8.8, 0.4, '#fffbe8');
  note.rr(5, 0.2, 4, 1.4, 0.2, 'rgba(255,240,180,0.85)');
  note.g.textAlign = 'center'; note.g.textBaseline = 'middle';
  note.g.font = '900 5px "Trebuchet MS", "Arial Black", sans-serif'; note.g.fillStyle = '#d83a30'; note.g.fillText('OUT!', 7, 5.6);
  cottage = { siding: siding.c, shingles: sh.c, stones: st.c, bricks: br.c, door: dr.c, window: wn.c, shutter: sht.c,
    washing: [onesie('#8cc8f8', '#5a96d0'), bib.c, onesie('#f8e070', '#e0b030')], note: note.c };
  return cottage;
}

/** The Nietos' house (the user's ask, 2026-10-14; made a storybook cottage the same day, the user's ask: "more aesthetic
    than a bland house"): butter-cream clapboard on a stone footing under a scalloped baby-blue roof, a brick chimney
    puffing smoke, a gabled porch over a fanlit blue door with a wreath (and an OUT! note while they're away), shuttered
    windows with pink curtains and flower boxes, a picket-fenced front garden, the name board and baby Linc's washing on
    the left, a pram and the sandbox on the right. Everything outside its walls stands on its `NIETOS_YARD` tiles. */
function nietosHouse(g, x, z, home) {
  const W = 2.5, D = 2.1, H = 1.45, FY = 0.2, E = FY + H, R = 0.95, fz = D / 2;
  const A = cottageArt(), rnd = seeded(11);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const h = new THREE.Group();
  h.position.set(x, 0, z);
  g.add(h);
  const add = (geo, m, px, py, pz, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = shadow; o.receiveShadow = true; h.add(o); return o; };
  const box = (w, hh, d, m, px, py, pz, shadow) => add(new THREE.BoxGeometry(w, hh, d), m, px, py, pz, shadow);
  const trim = std({ color: '#ffffff' }), cream = std({ color: '#fbefcf' }), navy = std({ color: '#2e5e98' }), wood = std({ color: '#8a6038' });
  const lit = (canvas, k) => { const m = glowing(std({ map: texOf(canvas), roughness: 0.4 }), canvas, null, '#ffd890', k); m.userData.glowMin = 0.15; return m; };
  const pane = std({ color: '#fff0c0', emissive: new THREE.Color('#ffd890'), roughness: 0.3 });
  pane.userData.glow = 1.2; pane.userData.glowMin = 0.15;
  glowMats.push(pane);

  // the stone footing, the clapboard walls with white boards at their corners, and a round lit window in each gable
  box(W + 0.1, FY, D + 0.1, std({ map: texOf(A.stones), roughness: 1 }), 0, FY / 2, 0);
  box(W, H, D, std({ map: texOf(A.siding) }), 0, FY + H / 2, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.08, H, 0.08, trim, sx * W / 2, FY + H / 2, sz * D / 2);
  const gable = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-D / 2, 0), new THREE.Vector2(D / 2, 0), new THREE.Vector2(0, R)]), { depth: W - 0.02, bevelEnabled: false });
  gable.translate(0, 0, -(W - 0.02) / 2); gable.rotateY(Math.PI / 2);
  add(gable, cream, 0, E, 0);
  for (const sx of [-1, 1]) {
    add(new THREE.CircleGeometry(0.15, 24), trim, sx * (W / 2 + 0.004), E + 0.32, 0, false).rotation.y = sx * Math.PI / 2;
    add(new THREE.CircleGeometry(0.11, 24), pane, sx * (W / 2 + 0.008), E + 0.32, 0, false).rotation.y = sx * Math.PI / 2;
  }

  // a roof slope: shingles on top, white barge boards down its ends and a fascia along its eave, hung from the ridge
  // at (px, py, pz) and running down towards `yaw`
  const slope = (run, rise, over, wide, yaw, px, py, pz, top) => {
    const s = new THREE.Group(), p = new THREE.Group(), L = Math.hypot(run, rise) + over;
    s.position.set(px, py, pz); s.rotation.y = yaw; p.rotation.x = Math.atan2(rise, run);
    s.add(p); h.add(s);
    const put = (w, hh, d, m, qx, qy, qz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); o.position.set(qx, qy, qz); o.castShadow = o.receiveShadow = true; p.add(o); };
    put(wide, 0.07, L, [navy, navy, top, trim, navy, navy], 0, 0, L / 2);
    for (const sx of [-1, 1]) put(0.05, 0.11, L, trim, sx * (wide / 2 + 0.025), -0.015, L / 2);
    put(wide + 0.1, 0.11, 0.05, trim, 0, -0.015, L + 0.025);
  };
  const shingle = std({ map: texOf(A.shingles), roughness: 0.75 });
  for (const yaw of [0, Math.PI]) slope(D / 2, R, 0.32, W + 0.36, yaw, 0, E + R, 0, shingle);
  box(W + 0.46, 0.08, 0.14, navy, 0, E + R + 0.04, 0);
  // the chimney, and the smoke it puffs (liveSmoke())
  const CX = 0.72, CZ = -0.45;
  box(0.3, 0.95, 0.3, std({ map: texOf(A.bricks), roughness: 1 }), CX, E + 0.72, CZ);
  box(0.38, 0.07, 0.38, std({ color: '#8a8478', roughness: 1 }), CX, E + 1.23, CZ);
  add(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 10), std({ color: '#c87050' }), CX, E + 1.32, CZ);
  const puffGeo = new THREE.SphereGeometry(0.1, 10, 8), puffs = [];
  for (let i = 0; i < 5; i++) {
    const o = add(puffGeo, std({ color: '#f4f4f4', roughness: 1, transparent: true, opacity: 0, depthWrite: false }), CX, E + 1.4, CZ, false);
    o.raycast = () => {};
    puffs.push(o);
  }
  smoke = { puffs, x: CX, y: E + 1.4, z: CZ };

  // the porch: a deck and a step, two posts, a little gabled roof of its own with a round window in its gable
  const PE = 1.2, PA = 1.5;
  box(1.24, 0.06, 0.62, std({ color: '#c8925a', roughness: 0.9 }), 0, FY - 0.03, fz + 0.31);
  box(0.74, 0.1, 0.22, std({ color: '#b8b0a0', roughness: 1 }), 0, 0.05, fz + 0.72);
  const small = texOf(A.shingles);
  small.repeat.set(0.26, 0.45);
  const porchShingle = std({ map: small, roughness: 0.75 });
  for (const sx of [-1, 1]) {
    box(0.07, PE - FY, 0.07, trim, sx * 0.52, (PE + FY) / 2, fz + 0.6);
    slope(0.56, PA - PE, 0.05, 0.74, sx * Math.PI / 2, 0, PA, fz + 0.34, porchShingle);
  }
  box(1.12, 0.08, 0.08, trim, 0, PE - 0.04, fz + 0.62);
  add(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.56, 0), new THREE.Vector2(0.56, 0), new THREE.Vector2(0, PA - PE)]), { depth: 0.04, bevelEnabled: false }), cream, 0, PE, fz + 0.6);
  add(new THREE.CircleGeometry(0.085, 20), trim, 0, PE + 0.11, fz + 0.642, false);
  add(new THREE.CircleGeometry(0.065, 20), pane, 0, PE + 0.11, fz + 0.646, false);

  // the door in its white frame, a wreath on it, the lantern beside it; a note while they're out
  box(0.5, 0.9, 0.05, [navy, navy, navy, navy, lit(A.door, 1), navy], 0, FY + 0.45, fz + 0.025);
  box(0.62, 0.07, 0.07, trim, 0, FY + 0.935, fz + 0.035);
  for (const sx of [-1, 1]) box(0.06, 0.93, 0.07, trim, sx * 0.28, FY + 0.465, fz + 0.035);
  add(new THREE.TorusGeometry(0.085, 0.03, 6, 16), std({ color: '#3e8a40', roughness: 1 }), 0, FY + 0.62, fz + 0.075);
  box(0.07, 0.045, 0.02, std({ color: '#e84860' }), 0, FY + 0.535, fz + 0.1, false);
  if (!home) {
    const n = add(new THREE.PlaneGeometry(0.16, 0.115), std({ map: texOf(A.note), roughness: 1 }), 0, FY + 0.4, fz + 0.054, false);
    n.rotation.z = 0.08;
  }
  box(0.02, 0.02, 0.07, navy, 0.4, FY + 0.8, fz + 0.035, false);
  box(0.09, 0.13, 0.09, pane, 0.4, FY + 0.78, fz + 0.09);
  add(new THREE.ConeGeometry(0.08, 0.07, 4), navy, 0.4, FY + 0.88, fz + 0.09).rotation.y = Math.PI / 4;

  // two windows: blue heart-cut shutters, a sill, a flower box under each
  const win = lit(A.window, 1.2), shut = std({ map: texOf(A.shutter) }), leaf = std({ color: '#4e9a40', roughness: 1 });
  const blooms = [], tufts = [];
  for (const sx of [-1, 1]) {
    const wx = sx * 0.92;
    box(0.42, 0.5, 0.04, [trim, trim, trim, trim, win, trim], wx, 0.98, fz + 0.02);
    box(0.5, 0.04, 0.08, trim, wx, 0.72, fz + 0.04);
    for (const s of [-1, 1]) box(0.12, 0.5, 0.03, [navy, navy, navy, navy, shut, navy], wx + s * 0.28, 0.98, fz + 0.015);
    box(0.48, 0.1, 0.12, std({ color: '#a8703e' }), wx, 0.65, fz + 0.07);
    box(0.44, 0.05, 0.09, leaf, wx, 0.715, fz + 0.07, false);
    for (let i = 0; i < 6; i++) blooms.push([wx - 0.19 + i * 0.076, 0.75 + (i % 2) * 0.02, fz + 0.05 + (i % 2) * 0.04, BLOOMS[(i + (sx > 0 ? 2 : 0)) % BLOOMS.length]]);
  }

  // the front garden: white pickets round two flower beds either side of the path, a bush by the porch
  const F = 2.3, GX = 0.5, SX = 1.45, Z0 = fz + 0.1;
  const pickets = [];
  for (const sx of [-1, 1]) {
    for (let px = GX + 0.09; px <= SX - 0.04; px += 0.12) pickets.push([sx * px, F, 0]);
    for (let pz = F - 0.12; pz >= Z0; pz -= 0.12) pickets.push([sx * SX, pz, Math.PI / 2]);
    box(SX - GX, 0.035, 0.02, trim, sx * (GX + SX) / 2, 0.1, F - 0.025);
    box(SX - GX, 0.035, 0.02, trim, sx * (GX + SX) / 2, 0.24, F - 0.025);
    box(0.02, 0.035, F - Z0, trim, sx * (SX - 0.025), 0.1, (F + Z0) / 2);
    box(0.02, 0.035, F - Z0, trim, sx * (SX - 0.025), 0.24, (F + Z0) / 2);
    for (const px of [GX, SX]) {
      box(0.07, 0.36, 0.07, trim, sx * px, 0.18, F);
      add(new THREE.SphereGeometry(0.045, 10, 8), trim, sx * px, 0.4, F);
    }
    box(SX - 0.66, 0.05, F - Z0 - 0.1, std({ color: '#6a4a2e', roughness: 1 }), sx * (0.62 + SX) / 2, 0.025, (F + Z0) / 2, false);
    add(new THREE.SphereGeometry(0.17, 14, 10), leaf, sx * 0.82, 0.13, fz + 0.32).scale.set(1.1, 0.85, 0.9);
    add(new THREE.SphereGeometry(0.13, 14, 10), std({ color: '#5cae4a', roughness: 1 }), sx * 1.22, 0.11, fz + 0.3);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const fx = sx * (0.74 + i * 0.18 + (rnd() - 0.5) * 0.05), fzz = 1.62 + j * 0.2 + (rnd() - 0.5) * 0.05;
      tufts.push([fx, 0.07, fzz]);
      blooms.push([fx, 0.14 + rnd() * 0.04, fzz, BLOOMS[Math.floor(rnd() * BLOOMS.length)]]);
    }
  }
  const at = new THREE.Object3D();
  const many = (geo, m, list, shadow, sy = 1) => {
    const im = new THREE.InstancedMesh(geo, m, list.length);
    list.forEach(([px, py, pz, c], i) => {
      at.position.set(px, py, pz); at.rotation.set(0, typeof c === 'number' ? c : 0, 0); at.scale.set(1, sy, 1); at.updateMatrix();
      im.setMatrixAt(i, at.matrix);
      if (typeof c === 'string') im.setColorAt(i, new THREE.Color(c));
    });
    im.castShadow = shadow; im.receiveShadow = true;
    h.add(im);
  };
  many(new THREE.BoxGeometry(0.05, 0.28, 0.025), trim, pickets.map(([px, pz, a]) => [px, 0.14, pz, a]), true);
  const tip = new THREE.ConeGeometry(0.036, 0.06, 4); tip.rotateY(Math.PI / 4); tip.scale(1, 1, 0.5);
  many(tip, trim, pickets.map(([px, pz, a]) => [px, 0.31, pz, a]), false);
  many(new THREE.SphereGeometry(0.07, 8, 6), leaf, tufts, false, 0.7);
  many(new THREE.SphereGeometry(0.04, 8, 6), std({ color: '#ffffff', roughness: 0.7 }), blooms, false);

  // the name board on the left is a place of its own (nietosSign()); baby Linc's washing on a line behind it
  const LZ = -0.4;
  for (const px of [-2.4, -1.55]) {
    add(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6), wood, px, 0.55, LZ);
    box(0.03, 0.03, 0.2, wood, px, 1.08, LZ);
  }
  add(new THREE.CylinderGeometry(0.006, 0.006, 0.85, 4), trim, -1.975, 1.06, LZ, false).rotation.z = Math.PI / 2;
  A.washing.forEach((art, i) => {
    const o = add(new THREE.PlaneGeometry(0.22, 0.24), std({ map: texOf(art), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }), -2.22 + i * 0.25, 0.94, LZ);
    o.rotation.z = (i - 1) * 0.06;
  });

  // on the right, baby Linc's pram, and the sandbox with a bucket and a ball
  const pram = new THREE.Group();
  pram.position.set(1.92, 0, 0); pram.rotation.y = -0.5;
  h.add(pram);
  const baby = std({ color: '#8cc8f8' }), tyre = std({ color: '#3a3e48', roughness: 0.6 });
  const pp = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; pram.add(o); return o; };
  pp(new THREE.BoxGeometry(0.4, 0.16, 0.24), baby, 0, 0.22, 0);
  pp(new THREE.BoxGeometry(0.42, 0.03, 0.26), trim, 0, 0.31, 0);
  pp(new THREE.SphereGeometry(0.13, 14, 8, 0, Math.PI, 0, Math.PI / 2), std({ color: '#5a96d0', side: THREE.DoubleSide }), -0.07, 0.31, 0).rotation.y = -Math.PI / 2;
  for (const wx of [-0.13, 0.13]) for (const wz of [-0.13, 0.13]) pp(new THREE.TorusGeometry(0.055, 0.016, 6, 14), tyre, wx, 0.07, wz);
  pp(new THREE.BoxGeometry(0.02, 0.24, 0.02), tyre, 0.24, 0.4, 0).rotation.z = -0.5;
  pp(new THREE.BoxGeometry(0.03, 0.03, 0.26), tyre, 0.3, 0.5, 0);
  box(0.62, 0.1, 0.5, std({ color: '#c89a60' }), 1.92, 0.05, 1.0);
  box(0.54, 0.04, 0.42, std({ color: '#f0dca0' }), 1.92, 0.1, 1.0);
  add(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 10), std({ color: '#e84838' }), 1.82, 0.17, 0.95);
  add(new THREE.SphereGeometry(0.09, 12, 8), std({ color: '#f8e048' }), 2.04, 0.21, 1.06);
  mergeStatic(h);
}

/** The Nietos' name board, front left of their garden, on two posts under a little roof and turned to the path; tapped,
    it reads out (the user's ask, 2026-10-14). Its posts stand at its ends behind it and stop under the roof: set inside
    its width they poked through the board's face. Its own place, so the house's merged meshes don't swallow the tap. */
function nietosSign(g, x, z) {
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const s = new THREE.Group();
  s.position.set(x, 0, z); s.rotation.y = 0.3;
  g.add(s);
  // big white letters on a deep blue board: pale blue on sky blue couldn't be read (the user's ask, 2026-10-14)
  const b = board(plankArt(36, 15, [['THE NIETOS', 5.6, '#ffffff']], ['#2c5a94', '#234a7e', '#183660']), 0, 0, { s: 0.66, shadow: false });
  const { width: W, height: H } = b.geometry.parameters, Y = 0.8, RY = Y + H / 2 + 0.04;
  b.position.y = Y;
  s.add(b);
  const add = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; s.add(o); };
  const wood = std({ color: '#8a6038' });
  for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.035, 0.035, RY, 6), wood, sx * (W / 2 - 0.08), RY / 2, -0.05);
  add(new THREE.BoxGeometry(W + 0.14, 0.05, 0.18), std({ color: '#2e5e98' }), 0, RY + 0.025, -0.03);
}

/** Kurt's Workshop (docs/roadmap.md's Towns step 6, session 3): a timber workshop on a stone footing under a mossy
    shingle roof, wide double doors, a lit window either side, its signboard (KURT'S WORKSHOP over an Apricorn) on the
    gable, logs stacked by one wall and an Apricorn tree, its fruit in the five colours, by the other. Shown only while
    the towns are on. */
function kurtWorkshop(g, x, z) {
  const W = 2.5, D = 2, H = 1.3, FY = 0.18, E = FY + H, R = 0.9, fz = D / 2;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const h = new THREE.Group();
  h.position.set(x, 0, z);
  g.add(h);
  const add = (geo, m, px, py, pz, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = shadow; o.receiveShadow = true; h.add(o); return o; };
  const box = (w, hh, d, m, px, py, pz, shadow) => add(new THREE.BoxGeometry(w, hh, d), m, px, py, pz, shadow);
  const beam = std({ color: '#4a2e18' }), wall = std({ color: '#c8925a' }), stone = std({ color: '#9a948a', roughness: 1 });
  const roof = std({ color: '#5a6a3a', roughness: 0.9 }), door = std({ color: '#7a4a24' });
  const pane = std({ color: '#fff0c0', emissive: new THREE.Color('#ffc870'), roughness: 0.3 });
  pane.userData.glow = 1.2; pane.userData.glowMin = 0.15;
  glowMats.push(pane);

  // the footing, the planked walls framed in dark beams, a gable at each end
  box(W + 0.12, FY, D + 0.12, stone, 0, FY / 2, 0);
  box(W, H, D, wall, 0, FY + H / 2, 0);
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) box(0.1, H, 0.1, beam, sx * W / 2, FY + H / 2, sz * D / 2);
  for (const sz of [-1, 1]) box(W + 0.04, 0.1, 0.1, beam, 0, E - 0.05, sz * D / 2);
  for (const sz of [-1, 1]) box(W + 0.04, 0.08, 0.1, beam, 0, FY + 0.04, sz * D / 2);
  const gable = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-D / 2, 0), new THREE.Vector2(D / 2, 0), new THREE.Vector2(0, R)]), { depth: W - 0.02, bevelEnabled: false });
  gable.translate(0, 0, -(W - 0.02) / 2); gable.rotateY(Math.PI / 2);
  add(gable, wall, 0, E, 0);
  // the roof: two slopes from the ridge, overhanging, and a ridge beam
  for (const side of [-1, 1]) {
    const L = Math.hypot(D / 2, R) + 0.36, s = new THREE.Group(), p = new THREE.Group();
    s.position.set(0, E + R, 0); s.rotation.y = side < 0 ? Math.PI : 0; p.rotation.x = Math.atan2(R, D / 2);
    s.add(p); h.add(s);
    const o = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 0.08, L), roof);
    o.position.set(0, 0, L / 2); o.castShadow = o.receiveShadow = true; p.add(o);
    for (let i = 1; i < 5; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(W + 0.42, 0.03, 0.05), beam); r.position.set(0, 0.05, L * i / 5); p.add(r); }
  }
  box(W + 0.5, 0.1, 0.14, beam, 0, E + R + 0.03, 0);
  // the doors under a little lintel, a lit window either side, a stone step
  box(0.9, 0.98, 0.06, door, 0, FY + 0.49, fz + 0.03);
  box(0.03, 0.98, 0.07, beam, 0, FY + 0.49, fz + 0.04);
  for (const sx of [-1, 1]) box(0.06, 0.06, 0.08, std({ color: '#d8b040', metalness: 0.6, roughness: 0.3 }), sx * 0.09, FY + 0.5, fz + 0.08);
  box(1.06, 0.1, 0.12, beam, 0, FY + 1.03, fz + 0.05);
  box(1, 0.1, 0.3, stone, 0, 0.05, fz + 0.2);
  for (const sx of [-1, 1]) {
    box(0.5, 0.42, 0.04, pane, sx * 0.85, FY + 0.72, fz + 0.02, false);
    box(0.58, 0.06, 0.08, beam, sx * 0.85, FY + 0.48, fz + 0.04);
    box(0.58, 0.06, 0.08, beam, sx * 0.85, FY + 0.96, fz + 0.04);
    box(0.04, 0.42, 0.06, beam, sx * 0.85, FY + 0.72, fz + 0.04);
  }
  // its signboard on the gable end facing you: over the eaves, on the roof's front
  const sign = board(plankArt(40, 14, [['KURT\'S WORKSHOP', 4.6, '#fff4dc'], ['● APRICORNS ●', 3.2, '#ffd858']], ['#7a4a24', '#5a3418', '#3a2010']), 0, 0, { s: 0.62, shadow: false });
  sign.position.set(0, E + 0.24, fz + 0.12);
  h.add(sign);
  // logs stacked by the left wall, and the Apricorn tree on the right, its fruit in Kurt's five colours
  const logM = std({ color: '#8a5a30' }), cut = std({ color: '#e0b878' });
  [[0, 0], [0.24, 0], [0.12, 0.2]].forEach(([dz, dy]) => {
    const l = add(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 10), logM, -W / 2 - 0.2, 0.1 + dy, 0.2 + dz);
    l.rotation.x = Math.PI / 2;
    add(new THREE.CircleGeometry(0.09, 10), cut, -W / 2 - 0.2, 0.1 + dy, 0.2 + dz + 0.351, false);
  });
  const TX = W / 2 + 0.55, TZ = 0.45;
  add(new THREE.CylinderGeometry(0.08, 0.11, 0.9, 8), std({ color: '#6a4a2a' }), TX, 0.45, TZ);
  const leaf = std({ color: '#3e8a3a' });
  for (const [dx, dy, dz, r] of [[0, 1.15, 0, 0.5], [-0.25, 0.95, 0.15, 0.35], [0.28, 1.0, -0.1, 0.36], [0.05, 1.45, 0.05, 0.32]]) add(new THREE.SphereGeometry(r, 12, 10), leaf, TX + dx, dy, TZ + dz);
  ['#e83a3a', '#3a6ae8', '#f8d030', '#48b848', '#f878b0'].forEach((c, i) => {
    const a = i / 5 * Math.PI * 2 + 0.4;
    add(new THREE.SphereGeometry(0.09, 10, 8), std({ color: c, roughness: 0.5 }), TX + Math.cos(a) * 0.42, 1.0 + (i % 2) * 0.22, TZ + Math.sin(a) * 0.42 + 0.12);
  });
  mergeStatic(h);
}

/** `root`'s still meshes that share a material (and shadow) baked into one mesh each: the Nietos' house is ~110 small
    pieces, and every draw call counts on a phone's GPU (2026-10-14). Animated ones (their own raycast) are left be. */
function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), sets = new Map();
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.raycast !== THREE.Mesh.prototype.raycast) return;
    const k = o.material.uuid + (o.castShadow ? '+' : '-');
    if (sets.has(k)) sets.get(k).push(o); else sets.set(k, [o]);
  });
  for (const list of sets.values()) {
    if (list.length < 2) continue;
    const parts = list.map(o => {
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      return geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));
    });
    if (parts.some(p => !p.attributes.uv || !p.attributes.normal)) { parts.forEach(p => p.dispose()); continue; }
    const merged = new THREE.BufferGeometry();
    for (const name of ['position', 'normal', 'uv']) {
      const size = parts[0].attributes[name].itemSize, out = new Float32Array(parts.reduce((n, p) => n + p.attributes[name].array.length, 0));
      let at = 0;
      for (const p of parts) { out.set(p.attributes[name].array, at); at += p.attributes[name].array.length; }
      merged.setAttribute(name, new THREE.BufferAttribute(out, size));
    }
    parts.forEach(p => p.dispose());
    const m = new THREE.Mesh(merged, list[0].material);
    m.castShadow = list[0].castShadow; m.receiveShadow = true;
    root.add(m);
    for (const o of list) { o.removeFromParent(); o.geometry.dispose(); }
  }
}

/** The Nietos' chimney smoke: puffs rising, swelling and fading in turn. */
function liveSmoke(now) {
  if (!smoke) return;
  const n = smoke.puffs.length;
  smoke.puffs.forEach((o, i) => {
    const t = calm ? (i + 0.5) / n : (now / 3600 + i / n) % 1;
    o.position.set(smoke.x + t * 0.3 + Math.sin(t * 6 + i) * 0.04, smoke.y + t * 1.0, smoke.z - t * 0.1);
    o.scale.setScalar(0.55 + t * 1.5);
    o.material.opacity = 0.6 * Math.sin(Math.PI * t);
  });
}

/** Chad Master Kenmatta's dojo, not open yet (the user's ask, 2026-10-14): a raised timber hall, white walls between dark
    posts, a two-tier slate roof, a DOJO board over the door, the door boarded up under a COMING SOON banner, red
    banners either side and stone steps up. */
function dojo(g, x, z) {
  const W = 2.7, D = 3.0, H = 1.35, LIFT = 0.32;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const d = new THREE.Group();
  d.position.set(x, 0, z);
  g.add(d);
  const add = (mesh, px, py, pz, shadow = true) => { mesh.position.set(px, py, pz); mesh.castShadow = mesh.receiveShadow = shadow; d.add(mesh); return mesh; };
  const wood = std({ color: '#5a3a22' }), plaster = std({ color: '#f2ece0' }), slate = std({ color: '#3e4250', roughness: 0.6, flatShading: true }), stone = std({ color: '#9a968c', roughness: 1 });
  add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, LIFT, D + 0.3), stone), 0, LIFT / 2, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(W, H, D), plaster), 0, LIFT + H / 2, 0);
  for (const sx of [-1, -1 / 3, 1 / 3, 1]) add(new THREE.Mesh(new THREE.BoxGeometry(0.1, H, 0.1), wood), sx * W / 2, LIFT + H / 2, D / 2 + 0.01);
  add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 0.12, 0.12), wood), 0, LIFT + H - 0.06, D / 2 + 0.02);
  // two tiers of hipped roof
  const hip = (w, dd, hh, y) => {
    const m = add(new THREE.Mesh(new THREE.ConeGeometry(Math.SQRT1_2, hh, 4, 1), slate), 0, y + hh / 2, 0);
    m.rotation.y = Math.PI / 4;
    m.scale.set(w, 1, dd);
  };
  hip(W + 0.7, D + 0.7, 0.75, LIFT + H);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.35, 1.2), plaster), 0, LIFT + H + 0.72, 0);
  hip(1.5, 1.7, 0.55, LIFT + H + 0.88);
  // the door, boarded up, the banner across it and the DOJO board over it
  const fz = D / 2 + 0.03;
  add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.04), std({ color: '#2a1c12' })), 0, LIFT + 0.5, fz);
  for (const [a, y] of [[0.5, 0.35], [-0.45, 0.7]]) add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.05), std({ color: '#b08858' })), 0, LIFT + y, fz + 0.04).rotation.z = a;
  const banner = board(plankArt(26, 8, [['COMING SOON', 3.6, '#ffe070']], ['#d83a30', '#b02820', '#801810']), 0, 0, { s: 0.8, shadow: false });
  banner.position.set(0, LIFT + 0.55, fz + 0.09);
  d.add(banner);
  const sign = board(plankArt(22, 9, [['道場', 4.2, '#2a1a10'], ['KENMATTA', 2.2, '#5a2a10']]), 0, 0, { s: 0.75, shadow: false });
  sign.position.set(0, LIFT + H + 0.12, fz + 0.12);
  d.add(sign);
  // steps up, and a red banner on a pole either side
  for (let i = 0; i < 2; i++) add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.22), stone), 0, 0.06 + i * 0.12, D / 2 + 0.38 - i * 0.18);
  const red = std({ color: '#c8302a', side: THREE.DoubleSide });
  for (const sx of [-1, 1]) {
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.9, 6), wood), sx * (W / 2 + 0.35), 0.95, D / 2 + 0.3);
    add(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.1), red), sx * (W / 2 + 0.35) + sx * 0.17, 1.25, D / 2 + 0.3, false);
  }
}

/** Into the Nietos' house: to its door, the curtain down, then the house walked in (js/run.js's visitTown()). */
async function enterHouse(p) {
  if (entering) return;
  hideCard();
  walker.path = []; walker.facing = mon.sheets.back ? 'back' : 'front';
  playSound('door');
  entering = { at: performance.now(), z: walker.z };
  await curtain(true, calm ? 0 : 420);
  entering = null;
  inside = p.id;
  await acts.onTown('clearing', p.id);
}

/** Down through the broken Sealed Gate to the Depths camp (js/data/camp.js), outside any run: back in front of the gate,
    and Mewtwo's runs set out from its talk there. */
async function enterCamp() {
  if (entering) return;
  hideCard();
  walker.path = []; walker.facing = mon.sheets.back ? 'back' : 'front';
  playSound('gate-hum');
  entering = { at: performance.now(), z: walker.z };
  await curtain(true, calm ? 0 : 600);
  entering = null;
  inside = 'gate';
  await acts.onTown('depths', 'camp');
}

let warp = null;   // a Waystone's light carrying your partner away (out) or setting it down (in)

/** Off through the Waystone to a mended town (`t`, a RING entry): a column of its light rises round your partner, which
    fades up into it, then the town. */
async function warpTo(p, t) {
  if (entering) return;
  hideCard();
  walker.path = []; aim = null; walker.facing = 'front';
  entering = { at: performance.now(), z: walker.z, still: true };
  playSound('gate-hum');
  warp = { at: performance.now(), out: true, colour: t.glow };
  await new Promise(r => setTimeout(r, calm ? 0 : 1000));
  await curtain(true, calm ? 0 : 300);
  entering = null;
  inside = p.id;
  await acts.onTown(t.id);
}

/** Back from a visit (js/run.js's visitTown()): in front of the Waystone, the light of the town it came from setting your
    partner down, or on the house's doorstep. */
export function cameHome(from, town) {
  inside = from;
  const t = from === 'waystone' && RING.find(o => o.id === town);
  warp = t ? { at: performance.now() + 300, out: false, colour: t.glow } : null;
}

/** What the Clearing has to tell you as you come home (step 7, the Nietos' questline): beaten at their Gym, Law and Britt
    slide in with the cracked Waystone's story and their questline opens; once they've put its shard in, the stone lights. */
let homeNewsBusy = false;
async function homeNews() {
  if (homeNewsBusy || held || !townsOpen()) return;
  const save = getSave(), st = townState(save, 'clearing');
  const greet = !st.quest && nietosHome(gymWins(save, 'nietos') || 0) && !clearingLit(save);
  const mend = !!st.quest?.lit && !st.quest.welcomed;
  if (!greet && !mend) return;
  homeNewsBusy = true;
  try {
    await new Promise(r => setTimeout(r, calm ? 200 : 900));
    if (!running || held) return;
    playSound('gate-hum');
    if (greet) {
      const { gymTalk } = await import('./gym.js');
      await gymTalk(GYM_BY_ID.nietos, QUESTS.clearing.greet.nietos, { lit: true });
      startQuest('clearing');
      dexNews();
      return;
    }
    welcomeHome('clearing');
    const glow = '#9fe0ff';
    warp = { at: performance.now(), stone: true, colour: '#d8f0ff', dur: 4200 };
    if (!calm) setTimeout(() => playSound('charge'), 300);
    await new Promise(r => setTimeout(r, calm ? 0 : 1300));   // the light at its brightest: the stone swapped for the whole one
    if (!running) return;
    buildPlaces();
    const { wayFlash, wayCard, awakenTalk } = await import('./gym.js');
    playSound('core-surge');
    if (!calm) setTimeout(() => playSound('thunder'), 250);
    wayFlash(glow);
    await new Promise(r => setTimeout(r, calm ? 0 : 1600));
    if (!running) return;
    await wayCard(CLEARING.name, glow);
    await awakenTalk([[GYM_BY_ID.nietos, QUESTS.clearing.awaken.nietos]], glow);
    playSound('stat-up');
  } finally { homeNewsBusy = false; questMarks(); }
}

/** Where the quest board stands: `locked` till the Nietos are beaten, `new` with their notice to read, `on` (`ready` to
    hand in) through their questline, then `towns`, every town's questline under way. */
function boardNow(save) {
  const st = townState(save, 'clearing');
  if (!st.quest && !clearingLit(save)) {
    return nietosHome(gymWins(save, 'nietos') || 0)
      ? { kind: 'new', line: 'A fresh notice in Britt\'s writing, pinned over the rest: "ABOUT THE WAYSTONE. Come and read this, sweetie. - Law & Britt"' }
      : { kind: 'locked', line: 'The Clearing\'s quest board. One notice, in Britt\'s writing: "Something\'s wrong with the Waystone. Beat us at the Gym and we\'ll explain. - Law & Britt"' };
  }
  const step = questStep(CLEARING, st);
  if (step) {
    const [n, of] = questProgress(CLEARING, st), have = stepHave(step, st, satchelOf(save)), ready = satchelFlag() || have >= step.n;
    const need = step.kind === 'gather' ? ` ${MATERIALS_BY_ID[step.item].icon} ${have}/${step.n} in your Satchel.` : step.kind === 'track' ? ` ${have}/${step.n}.`
      : have ? ' In your Satchel.' : '';
    return { kind: 'on', ready, line: `THE NIETOS' QUEST, ${n}/${of} done. Up now: ${stepText(step)}.${need} ${ready ? 'Done! Take it to their house, the one with the "!".' : 'Hand it in at their house, south-east.'}` };
  }
  const on = RING.map(t => [TOWNS[t.id], townState(save, t.id)]).filter(([, s]) => s.quest && !mended(s));
  return { kind: 'towns', line: on.length
    ? `Pinned up: ${on.map(([town, s]) => { const [n, of] = questProgress(town, s); return `${town.name} ${n}/${of}`; }).join(', ')}. Each step goes to its Gym Leader, at their house.`
    : 'Law and Britt\'s notice, stamped THANK YOU. The towns out on the roads post their own quests on their own boards.' };
}

function questMarks() {
  if (!questMark && !nietosMark) return;
  const b = boardNow(getSave());
  if (questMark) questMark.visible = b.kind === 'new';
  if (nietosMark) nietosMark.visible = !!b.ready;
}

/** The Nietos' notice read off the board: their story, and their questline opens (the greeting homeNews() plays, if it
    didn't as you came home). */
async function takeQuest() {
  if (homeNewsBusy || townState(getSave(), 'clearing').quest) return;
  homeNewsBusy = true;
  try {
    playSound('gate-hum');
    const { gymTalk } = await import('./gym.js');
    await gymTalk(GYM_BY_ID.nietos, QUESTS.clearing.greet.nietos, { lit: true });
    startQuest('clearing');
    dexNews();
  } finally { homeNewsBusy = false; questMarks(); }
  questLog();
}

/** The board's window: the Pokédex's Quests app (js/questlog.js), which then says it's kept there too. */
function questLog() {
  if (running && !entering) acts.onApp?.('quests', 'board');
}

/** The quest board: a cork face on two posts under a little shingled roof, notes pinned all over it. */
function questBoard(x, z) {
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const s = new THREE.Group();
  s.position.set(x, 0, z); s.rotation.y = 0.35;
  const face = board(questBoardArt(), 0, 0, { s: 0.62, shadow: false });
  const { width: W, height: H } = face.geometry.parameters, Y = 0.55, RY = Y + H + 0.04;
  face.position.y = Y + H / 2;
  s.add(face);
  const add = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; s.add(o); return o; };
  const wood = std({ color: '#7a5230' }), roof = std({ color: '#b8483a' });
  for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.045, 0.05, RY, 6), wood, sx * (W / 2 + 0.02), RY / 2, -0.05);
  add(new THREE.BoxGeometry(W + 0.1, 0.07, 0.1), wood, 0, Y - 0.02, -0.02);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(W / 2 + 0.2, 0.05, 0.34), roof, sx * (W / 4 + 0.04), RY + 0.13, -0.03).rotation.z = -sx * 0.32;
  return s;
}

function questBoardArt() {
  const { c, g, rr, lin } = fine(30, 21, 10);
  rr(0, 0, 30, 21, 1.2, lin(0, 0, 0, 21, ['#8a5a30', '#6a4220']));
  rr(1.2, 1.2, 27.6, 18.6, 0.6, lin(0, 0, 30, 21, ['#d8a86a', '#c8945a', '#b8824a']));
  g.fillStyle = 'rgba(90,50,20,0.25)';
  for (let i = 0; i < 70; i++) g.fillRect(1.5 + (i * 7.3) % 27, 1.5 + (i * 4.1) % 18, 0.3, 0.3);
  const note = (x, y, w, h, turn, paper, pin, lines) => {
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(turn);
    g.fillStyle = 'rgba(60,30,10,0.3)'; g.fillRect(-w / 2 + 0.4, -h / 2 + 0.4, w, h);
    g.fillStyle = paper; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(70,60,50,0.55)';
    for (let i = 0; i < lines; i++) g.fillRect(-w / 2 + 0.8, -h / 2 + 2 + i * 1.4, w - (i === lines - 1 ? 3 : 1.6), 0.45);
    g.fillStyle = pin; g.beginPath(); g.arc(0, -h / 2 + 0.7, 0.55, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  note(2.6, 3, 9, 8, -0.08, '#fff8e8', '#e8403a', 4);
  note(13, 2.4, 7, 6, 0.06, '#fff2a8', '#3a7ae0', 3);
  note(21.2, 3.4, 6.2, 7, -0.05, '#e8f4ff', '#3aa84a', 4);
  note(5, 12.2, 7.4, 6, 0.07, '#ffe0e8', '#f8b830', 3);
  note(14, 10.6, 10, 7.6, -0.04, '#fff8e8', '#e8403a', 4);
  return c;
}

let beam = null, wave = null;
function liveWarp(now) {
  if (!warp) { if (beam) beam.visible = false; if (wave) wave.visible = false; mon.board.scale.y = 1; return; }
  if (!beam) {
    beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    beam.raycast = () => {};
    scene.add(beam);
  }
  const t = Math.max(0, Math.min(1, (now - warp.at) / (warp.dur ?? (warp.out ? 900 : 1100))));
  const k = warp.out ? t : 1 - t;   // how far into the light
  beam.visible = true;
  beam.material.color.set(warp.colour);
  if (warp.stone) {   // the Clearing's Waystone mended (step 7): a pillar of light up into the sky, a shockwave rolling out at its peak
    if (!wave) {
      wave = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 64), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      wave.rotation.x = -Math.PI / 2;
      wave.raycast = () => {};
      scene.add(wave);
    }
    beam.position.set(tileX(START.x), 15, tileZ(START.y));
    const rise = Math.min(1, t / 0.3), peak = 1300 / warp.dur, fall = t < peak ? 1 : 1 - (t - peak) / (1 - peak);
    const w = (0.4 + rise * 0.6) * (t < peak ? 1 : 1 + Math.max(0, 1 - (t - peak) * 8) * 1.6) + Math.sin(now / 70) * 0.05;
    beam.scale.set(w, 5, w);
    beam.material.opacity = calm ? 0 : rise * fall * 0.75;
    const wk = Math.max(0, (t - peak) / 0.4);
    wave.visible = !calm && wk > 0 && wk < 1;
    wave.material.color.set(warp.colour);
    wave.position.set(tileX(START.x), 0.08, tileZ(START.y));
    wave.scale.setScalar(1 + wk * 12);
    wave.material.opacity = (1 - wk) * 0.9;
    if (t >= 1) { warp = null; wave.visible = false; }
    return;
  }
  beam.position.set(walker.x, 3, walker.z);
  beam.scale.set(0.4 + k * 0.6, 1, 0.4 + k * 0.6);
  beam.material.opacity = calm ? 0 : Math.min(0.75, Math.sin(Math.min(1, warp.out ? t * 1.3 : t + 0.15) * Math.PI) * 0.8);
  mon.board.scale.y = 1 - k * 0.6;
  mon.board.scale.x *= 1 - k * 0.6;
  mon.board.position.y += k * 1.4;
  if (!warp.out && t >= 1) { warp = null; walker.hopUntil = now + 500; playCry(mon.id); }
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
      build: (g) => pokestop(g, 'trail', tileX(STOP_AT.tx), tileZ(STOP_AT.ty) - 0.2, 0.7, !!run, 'SET OUT'),
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
      id: 'base', name: 'Secret Base', step: { x: TREE_AT.tx, y: TREE_AT.ty + 1 }, tiles: rect(TREE_AT.tx - 3, TREE_AT.ty - 2, TREE_AT.tx + 3, TREE_AT.ty), tag: [TREE_AT.tx, 3.2, TREE_AT.ty], open: true,
      line: baseOwned() ? 'A door in the Ancient Tree\'s roots: your Secret Base.'
        : `A boarded-up door in the Ancient Tree's roots. ${BASE_PRICE.toLocaleString()} PokéCoins makes it your Secret Base.`,
      buttons: [[baseOwned() ? 'Go in' : 'Unlock', baseOwned() ? enterBase : buyBase]],
      build: (g) => {
        const shut = ancientArt(false, !baseOwned()), b = board(shut, tileX(TREE_AT.tx), tileZ(TREE_AT.ty) + 0.2), open = ancientArt(true);
        glowing(b.material, shut, null, '#ffd890');
        tree = { m: b.material, shut: b.material.map, open: texOf(open) };
        g.add(b);
        // the sign hangs off its nail on the bark over the door, pivoting there (liveSign())
        const art = homeSignArt(baseOwned()), plate = board(art, 0, 0), pivot = new THREE.Group();
        plate.position.set((art.width / art.fine / 2 - SIGN_NAIL[0]) / TP, (SIGN_NAIL[1] - art.height / art.fine / 2) / TP, 0);
        pivot.position.set(tileX(TREE_AT.tx), 3.62, tileZ(TREE_AT.ty) + 0.32);
        pivot.add(plate);
        g.add(pivot);
        sign = { pivot, m: plate.material, fixed: baseOwned() ? null : texOf(homeSignArt(true)), fixAt: 0, from: 0, swapped: false };
      },
    },
    {
      // right of the plaza, where your partner starts (2026-10-09): who walks with you, who lives in the base, your name
      id: 'pc', name: 'PC', step: { x: PC_AT.tx, y: PC_AT.ty + 1 }, tiles: [[PC_AT.tx, PC_AT.ty]], tag: [PC_AT.tx, 2.6, PC_AT.ty], open: true,
      get line() { return `${unclaimed().length ? 'You\'ve got mail! ' : claimable() ? 'A mission reward is waiting! ' : pcBeckons(getSave()) ? (patchUnseen() ? 'New patch notes! ' : 'Something new on the PC! ') : ''}A PC. Your mail, your missions, the patch notes, who walks with you, who lives in your Secret Base, and your name.`; },
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
    id: 'safari-gate', name: 'Safari Zone', step: { x: SAFARI_AT.tx, y: SAFARI_AT.ty + 1 }, tiles: [], tag: [SAFARI_AT.tx, 4, SAFARI_AT.ty], open: safari,
    line: safari ? 'Today\'s Safari Zone run, the same for everyone. Spin the Pokéstop to set out.'
      : `The Safari Zone opens once you've beaten every Pokémon in all three biomes. ${safariUnlockProgress(save)}`,
    reset: safari && 'daily',
    buttons: [],
    // back in the left corner, out on the meadow, its fence across it
    build: (g) => {
      const s = safariArt(safari), S = 1.1, x = tileX(SAFARI_AT.tx), z = tileZ(SAFARI_AT.ty), b = board(s, x, z, { s: S });
      glowing(b.material, s, null, '#ffc890', 0.8);
      g.add(b);
      const half = s.width / s.fine / TP * S / 2, post = (px) => x - half + px / TP * S;
      safariFence(g, tileX(-M + 0.5), post(7), z);
      safariFence(g, post(57), tileX(SAFARI_AT.tx + 3.4), z);
    },
  });
  if (safari) list.push({
    id: 'safari', name: 'Safari Pokéstop', step: { x: SAFARI_AT.tx - 1, y: SAFARI_AT.ty + 2 }, tiles: [[SAFARI_AT.tx - 1, SAFARI_AT.ty + 1]], tag: [SAFARI_AT.tx - 1, 2.6, SAFARI_AT.ty + 1], open: true,
    line: safariRun ? waits(safariRun) : 'Today\'s Safari Zone run, the same for everyone. Only the first try counts.',
    reset: 'daily',
    buttons: safariRun ? [['Continue', () => acts.onContinue(safariRun)], ['New game', acts.onSafari]] : [['Enter', acts.onSafari]],
    build: (g) => pokestop(g, 'safari', tileX(SAFARI_AT.tx - 1), tileZ(SAFARI_AT.ty + 1), 0.5, !!safariRun, 'EXPLORE'),
  });
  // left of the gate, along its fence (the user's ask, 2026-10-09)
  list.push({
    id: 'safari-board', name: 'Safari Ranks', step: { x: SAFARI_AT.tx - 3, y: SAFARI_AT.ty + 2 }, tiles: [[SAFARI_AT.tx - 3, SAFARI_AT.ty + 1]], tag: [SAFARI_AT.tx - 3, 2.6, SAFARI_AT.ty + 1], open: safari,
    line: safari ? 'The Safari Zone\'s notice board: today\'s and yesterday\'s best catches.' : 'Notices for the Safari Zone, once it opens.',
    reset: safari && 'daily',
    buttons: safari ? [['Read', () => acts.onBoard('safari')]] : [],
    build: (g) => g.add(board(kioskArt(), tileX(SAFARI_AT.tx - 3), tileZ(SAFARI_AT.ty + 0.7))),
  });
  // south-west, its doors onto the ring road
  list.push({
    id: 'mall', name: 'Poké Mall', step: { x: MALL_TILE.tx, y: MALL_TILE.ty + 2 }, tiles: rect(MALL_TILE.tx - 2, MALL_TILE.ty - 1, MALL_TILE.tx + 1, MALL_TILE.ty + 1), tag: [MALL_TILE.tx, 3.4, MALL_TILE.ty + 1], open: true,
    line: 'A shopping centre. The Game Corner is inside.',
    buttons: [['Go in', enterMall]],
    build: (g) => { const m = mallBuilding(); m.position.set(MALL_AT.x, 0, MALL_AT.z); m.rotation.y = MALL_AT.turn; g.add(m); },
  });
  const tower = towerOpen(save) || !!runAt('pillar'), best = save.tower?.bestEver || 0, climb = runAt('pillar');
  list.push({
    id: 'pillar-tower', name: 'Sky Pillar', step: { x: PILLAR_AT.tx, y: PILLAR_AT.ty + 2 }, tiles: rect(PILLAR_AT.tx - 1, PILLAR_AT.ty - 1, PILLAR_AT.tx + 1, PILLAR_AT.ty + 1), tag: [PILLAR_AT.tx, 4.2, PILLAR_AT.ty + 1], open: tower,
    line: tower ? `A 100-floor climb with a weekly leaderboard.${best ? ` Your best: floor ${best}.` : ''} Spin the Pokéstop to climb.` : 'Win a run to open the Sky Pillar, a 100-floor tower climb with a weekly leaderboard.',
    reset: tower && 'weekly',
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
    id: 'pillar', name: 'Sky Pillar Pokéstop', step: { x: PILLAR_AT.tx - 2, y: PILLAR_AT.ty + 3 }, tiles: [[PILLAR_AT.tx - 2, PILLAR_AT.ty + 2]], tag: [PILLAR_AT.tx - 2, 2.6, PILLAR_AT.ty + 2], open: true,
    line: climb ? waits(climb) : `This week's Sky Pillar climb.${best ? ` Your best: floor ${best}.` : ''}`,
    reset: 'weekly',
    buttons: climb ? [['Continue', () => acts.onContinue(climb)], ['New game', acts.onTower]] : [['Climb', acts.onTower]],
    build: (g) => pokestop(g, 'pillar', tileX(PILLAR_AT.tx - 1.7), tileZ(PILLAR_AT.ty + 2.1), 0.5, !!climb, 'CLIMB'),
  });
  list.push({
    id: 'pillar-board', name: 'Pillar Ranks', step: { x: PILLAR_AT.tx + 2, y: PILLAR_AT.ty + 3 }, tiles: [[PILLAR_AT.tx + 2, PILLAR_AT.ty + 2]], tag: [PILLAR_AT.tx + 2, 2.6, PILLAR_AT.ty + 2], open: tower,
    line: tower ? 'The Sky Pillar\'s notice board: this week\'s and last week\'s highest climbers.' : 'Notices for the Sky Pillar, once it opens.',
    reset: tower && 'weekly',
    buttons: tower ? [['Read', () => acts.onBoard('tower')]] : [],
    build: (g) => g.add(board(kioskArt(SKY_KIT), tileX(PILLAR_AT.tx + 1.8), tileZ(PILLAR_AT.ty + 1.8))),
  });
  // the Clearing's Waystone on the plaza (docs/roadmap.md's Towns and Waystones): a tap opens its menu of the towns, a
  // mended one travelled to from there
  const lit = RING.map(t => townsOpen() && mended(townState(save, t.id)));
  // cracked till the Nietos' questline mends it (step 7), and still as you step out after they put the shard in (homeNews())
  const fresh = townState(save, 'clearing').quest;
  const whole = !townsOpen() || (clearingLit(save) && !(fresh?.lit && !fresh.welcomed));
  list.push({
    id: 'waystone', waystone: true, name: 'Waystone', step: SPAWN, tiles: [[START.x, START.y]], tag: [START.x, 3, START.y], open: true,
    line: !whole ? 'The Clearing\'s Waystone, cracked straight through. It hums off-key, and its five crystals are dark.'
      : lit.some(Boolean) ? 'The Clearing\'s Waystone, humming. Its crystals light the way to every town you\'ve mended.' : 'The Clearing\'s Waystone. Five dull crystals circle its tip, waiting on the towns out on the roads.',
    buttons: [],
    build: (g) => clearingWaystone(g, lit, whole),
  });
  // the quest board across the plaza from the PC (the user's ask, 2026-10-14: nowhere said where the Nietos' questline
  // was picked up): its notice starts it, then it says where every questline stands; steps are still handed in at home
  if (townsOpen()) list.push({
    id: 'quests', name: 'Quest Board', step: { x: QUEST_AT.tx, y: QUEST_AT.ty + 1 }, tiles: [[QUEST_AT.tx, QUEST_AT.ty]], tag: [QUEST_AT.tx, 2.6, QUEST_AT.ty], open: true,
    get line() { return boardNow(getSave()).line; },
    get buttons() { return boardNow(getSave()).kind === 'new' ? [['Read', takeQuest]] : [['Quest log', questLog]]; },
    build: (g) => {
      g.add(questBoard(tileX(QUEST_AT.tx), tileZ(QUEST_AT.ty)));
      questMark = board(newsArt(), tileX(QUEST_AT.tx), tileZ(QUEST_AT.ty) + 0.1, { shadow: false });
      questMark.rotation.x = -PITCH;
      questMark.userData.y = 2.35;
      g.add(questMark);
      questMarks();
    },
  });
  // a mended town's Gym Leader come through the Waystone (docs/roadmap.md's Towns step 6, session 4): one a day stands
  // beside it, the one who put a shard in the first time you're home after
  const guest = todaysGuest(save), leader = guest && GYM_BY_ID[guest.id];
  if (leader) list.push({
    id: 'guest', guest, name: leader.name, step: { x: GUEST_AT.x, y: GUEST_AT.y + 1 }, tiles: [[GUEST_AT.x, GUEST_AT.y]], tag: [GUEST_AT.x, 2.6, GUEST_AT.y], open: true,
    line: guestLines(guest).join(' '),
    buttons: [],
    build: (g) => standGuest(g, leader),
  });
  // a professor on the plaza, right of the Waystone (the user's ask, 2026-10-15): Oak by day, Sonia after dark, each tap
  // a hint about something easy to miss, and always a reminder to refresh for updates; both are built and setTime()
  // shows the one for the hour
  list.push({
    id: 'prof', step: { x: PROF_AT.x, y: PROF_AT.y + 1 }, tiles: [[PROF_AT.x, PROF_AT.y]], tag: [PROF_AT.x, 2.6, PROF_AT.y], open: true,
    get name() { return profNow().name; },
    get line() { return `${HINTS[hintAt++ % HINTS.length]} ${profNow().refresh}`; },
    buttons: [],
    build: (g) => { for (const who of PROFS) standProf(g, who); },
  });
  // the Clearing's own Gym Leaders at home (the user's ask, 2026-10-14): walked in like a town's houses (js/run.js's homeRoom());
  // they're home only once THE NIETOS are beaten at their Gym, and not at all while NIETOS_LIVE is off
  const nietosIn = nietosHome(gymWins(save, 'nietos') || 0);
  list.push({
    id: 'nietos', name: 'The Nietos\' House', step: { x: NIETOS_AT.tx + 1, y: NIETOS_AT.ty + 3 }, tiles: [...rect(NIETOS_AT.tx, NIETOS_AT.ty, NIETOS_AT.tx + 2, NIETOS_AT.ty + 2), ...NIETOS_YARD.map(([dx, dy]) => [NIETOS_AT.tx + dx, NIETOS_AT.ty + dy])], tag: [NIETOS_AT.tx + 1, 3.4, NIETOS_AT.ty + 2], open: true,
    line: nietosIn ? 'Law, Britt and baby Linc\'s house. The lights are on and something smells like fish sticks.' : 'Law, Britt and baby Linc\'s house. A note on the door: "Out!"',
    buttons: [['Go in', () => {}]],
    build: (g) => {
      nietosHouse(g, tileX(NIETOS_AT.tx + 1), tileZ(NIETOS_AT.ty + 1), nietosIn);
      if (!townsOpen()) return;
      // over their name sign, like every town's leaders (the user's call, 2026-10-14: the sign, not the roof)
      nietosMark = board(newsArt(), tileX(NIETOS_AT.tx + 1) - 2.15, tileZ(NIETOS_AT.ty + 1) + 1.3, { shadow: false });
      nietosMark.rotation.x = -PITCH;
      nietosMark.userData.y = 1.75;
      g.add(nietosMark);
      questMarks();
    },
  });
  list.push({
    id: 'nietos-sign', name: 'The Nietos\' House', step: { x: NIETOS_AT.tx - 1, y: NIETOS_AT.ty + 3 }, tiles: [[NIETOS_AT.tx - 1, NIETOS_AT.ty + 2]], tag: [NIETOS_AT.tx - 1, 1.6, NIETOS_AT.ty + 2], open: true,
    line: 'THE NIETOS. Law, Britt and baby Linc. Underneath, in crayon: "LINC LIVS HEAR TOO."',
    buttons: [],
    build: (g) => nietosSign(g, tileX(NIETOS_AT.tx + 1) - 2.15, tileZ(NIETOS_AT.ty + 1) + 1.3),
  });
  // Kurt's Workshop (docs/roadmap.md's Towns step 6, session 3): walked into like the Nietos' house, only while the towns are on
  if (townsOpen()) list.push({
    id: 'workshop', name: 'Kurt\'s Workshop', step: { x: WORKSHOP_AT.tx + 1, y: WORKSHOP_AT.ty + 3 }, tiles: rect(WORKSHOP_AT.tx, WORKSHOP_AT.ty, WORKSHOP_AT.tx + 2, WORKSHOP_AT.ty + 2), tag: [WORKSHOP_AT.tx + 1, 3.2, WORKSHOP_AT.ty + 2], open: true,
    line: 'Kurt\'s Workshop. Hammering inside, and the smell of Apricorns. Materials from the towns\' roads become things here.',
    buttons: [['Go in', () => {}]],
    build: (g) => kurtWorkshop(g, tileX(WORKSHOP_AT.tx + 1), tileZ(WORKSHOP_AT.ty + 1)),
  });
  list.push({
    id: 'dojo', name: 'Kenmatta\'s Dojo', step: { x: DOJO_AT.tx + 1, y: DOJO_AT.ty + 4 }, tiles: rect(DOJO_AT.tx, DOJO_AT.ty, DOJO_AT.tx + 2, DOJO_AT.ty + 3), tag: [DOJO_AT.tx + 1, 3.8, DOJO_AT.ty + 3], open: true,
    line: 'Chad Master Kenmatta\'s dojo. Planks over the door, and a banner: COMING SOON. From inside, faintly: "FORTIFY YOUR MIND."',
    buttons: [],
    build: (g) => dojo(g, tileX(DOJO_AT.tx + 1), tileZ(DOJO_AT.ty + 1.5)),
  });
  if (gateOpen()) list.push({
    id: 'gate', name: 'Sealed Gate', step: { x: SEALED_AT.tx, y: SEALED_AT.ty + 1 }, tiles: rect(SEALED_AT.tx - 1, SEALED_AT.ty, SEALED_AT.tx + 1, SEALED_AT.ty), tag: [SEALED_AT.tx, 4, SEALED_AT.ty], open: true,
    // the way down to the Depths camp, and back up to here: Mewtwo's run starts from its talk there (the user's ask, 2026-10-15)
    line: 'The broken Sealed Gate. Far below, a fire flickers: Mewtwo\'s camp in the Depths.',
    buttons: [['Go through', enterCamp]],
    build: (g) => {   // built in the round (js/hub-sealed.js; 2026-10-15, the user's ask: no longer a flat pixel painting)
      sealed = makeSealedGate(THREE, { x: tileX(SEALED_AT.tx), z: tileZ(SEALED_AT.ty), dot: dotTexture(), merge: mergeStatic });
      g.add(sealed.group);
    },
  });
  else {
    // until then, violet cracks in the ground where it will stand, spreading as the seal gives (js/hub-cracks.js)
    const stage = Math.min(3, gateStage(gateHp()));
    list.push({
      id: 'cracks', name: 'Cracked Ground', step: { x: SEALED_AT.tx, y: SEALED_AT.ty + 1 }, tiles: [[SEALED_AT.tx, SEALED_AT.ty]], tag: [SEALED_AT.tx, 1.6, SEALED_AT.ty], open: true,
      line: CRACK_LINES[stage],
      buttons: [],
      build: (g) => {
        cracks = makeCracks(THREE, { x: tileX(SEALED_AT.tx), z: tileZ(SEALED_AT.ty), stage, pitch: PITCH, dot: dotTexture() });
        g.add(cracks.group);
      },
    });
  }
  return list;
}

/** Where a visiting Gym Leader stands: on the plaza, left of the Waystone. */
const GUEST_AT = { x: START.x - 2, y: START.y };
const TRAINER_PX = 1 / 34;   // a trainer's sprite pixel, as in the walk-in rooms (js/event-3d.js)
async function standGuest(g, l) {
  const m = await monBoard({ src: spriteOf(l), name: l.name, cry: '', px: TRAINER_PX }, false);
  if (!g.parent) { dispose(m.group); return; }   // the places were built again while it loaded
  m.board.rotation.x = -PITCH;
  m.group.position.set(tileX(GUEST_AT.x), 0, tileZ(GUEST_AT.y));
  const p = places.find(q => q.id === 'guest');
  m.group.traverse(o => { o.userData.place = p; });
  drawMon(m, { facing: 'front' }, 0);
  g.add(m.group);
}

const PROF_AT = { x: START.x + 2, y: START.y };
const PROFS = [
  { id: 'oak', name: 'Professor Oak', night: false, refresh: 'And remember: refresh the page often! The game gets updates all the time.' },
  { id: 'sonia', name: 'Professor Sonia', night: true, refresh: 'Oh, and refresh the page often, okay? New updates land all the time!' },
];
const HINTS = [
  'Spin the Pokéstop by the gate to set out. A run you left waits there: Continue it, or give it up with an Escape Rope.',
  'Fire beats Grass, Grass beats Water, Water beats Fire. Elites and bosses shrug the chart off, though.',
  'Beat every Pokémon in the Whispering Clearing, the Overgrown Shrine and the Ember Wastes and the Safari Zone opens: one run a day, the same for everyone, and only your first try counts.',
  'Win a run and the Sky Pillar opens: 100 floors, with a new leaderboard every week.',
  '1,500 PokéCoins opens the boarded door in the Ancient Tree\'s roots. That\'s your Secret Base, to furnish however you like.',
  'The PC holds your mail, your missions and the patch notes. It also picks who walks beside you here.',
  'The Poké Mall sells furniture for your Secret Base, and the Game Corner\'s arcade is inside.',
  'See those cracks in the ground to the west? Every run you win strikes the seal below. Something wants out.',
  'Your Pokédex keeps every card and Pokémon you\'ve met. Open it whenever you\'re curious.',
  'Pokédollars from battles are spent at the Poké Mart during a run. PokéCoins are for here at home.',
  'Look closely at the map before you pick a path. A ? room can be a treat, or trouble.',
  'The Clearing follows your clock. Come back at another hour and someone else may be standing here.',
  'Finish the Whispering Clearing\'s Pokédex page and every run starts with ₽50. Mom\'s Savings, they call it.',
  'Finish the Overgrown Shrine\'s Pokédex page and Chansey slips a Potion into your Bag at the start of every run.',
  'Finish the Ember Wastes\' Pokédex page and I\'ll lend you my advice: reroll one card reward each biome.',
  'Stuck on what to unlock next? My PC rates your Pokédex and points you at the next goal.',
  'A wild Pokémon whose type beats yours is a tough match-up, but it pays like an elite. Fortune favours the brave!',
  'Every Trainer Level you play on pays 10% more PokéCoins from fights and wins.',
  'A Pokémon Center lets you Rest or PP Up a move. Healing now isn\'t always better than a stronger card later.',
  'Forgetting moves at a Center\'s PC needs the Mental Herb. Without it, the Poké Mart will forget one, for a price.',
  'A thinner deck draws your best cards more often. Just know you can\'t go below 7.',
  'Pick up a Cleanse Tag and you forget a move on the spot. A neat way to drop a weak card.',
  'Boss relics give an extra PP every turn, but each one has a catch. Read it twice before you take it!',
  'Choice Band can\'t Rest at Pokémon Centers. Grab it only if you trust your deck to keep you healthy.',
  'Leftovers and Shell Bell heal a little each turn. Over a whole run that adds up to a lot!',
  'Potions, Super Potions and HP Up work on the map too. No need to wait for a fight.',
  'A Revive in your Bag works by itself: faint, and you\'re back with 30% of your HP.',
  'In over your head? A Poké Doll escapes any fight but a boss. You give up the rewards, though.',
  'Vulnerable makes the enemy take 50% more from your attacks. Weak makes it deal 25% less. Both are worth a card.',
  'Watch the enemy\'s intent before you play. Some turns call for an attack, others for a wall of block.',
  'Fire Pokémon have Blaze: below half HP, their attacks hit 3 harder. Living dangerously has its perks.',
  'Grass Pokémon have Overgrow and heal 3 HP after every fight they win.',
  'Water Pokémon have Torrent and start every fight with 2 Tide. Hold 20 Tide at once and something special happens.',
  'A Burn Drive doubles the enemy\'s Burn. Stack it high first, then double it!',
  'Every starter but the first three is a skin: a new look, the same deck as its type.',
  'Win a run without ever resting at a Pokémon Center. Someone may want to join you after that.',
  'Win a run with 3 different Water starters and see who turns up.',
  'In the dojo, Chad Master Kenmatta teaches moves for ₽. Challenge him if you dare: his Mata-Mindset is something else.',
  'Beat Kenmatta three times and his dojo will show up on every map.',
  'Beat Team Rocket in a ? room and they pay out like an elite. Running away works too, if you must.',
  'The Day Care trades a card for one of the next rarity up. A fair deal, usually!',
  'The Fan Club never costs a thing. Always say hello.',
  'Short on ₽ at the Wishing Well? Fish in it instead. Free money is still money.',
  'Gym Leaders guard the bosses in each biome. Beat them for their badges, and to hear what they have to say.',
  'The Trainer Card holds over a hundred badges. Some are secret, so try everything.',
  'Daily and weekly missions wait on the PC. Claim all of them for a bonus.',
  'The Game Corner sells perks that last forever: more HP, a bigger Bag, a Mart discount and more.',
  'Shiny starters are sold in the Game Corner once a starter is yours. Purely for looks, but what looks!',
  'At the crossroads the road can turn to the Sunken Ruins, Thornwood Jungle or Sunscorch Savanna. Each has its own Pokédex page.',
  'Finish the Sunken Ruins\' page and once a biome you can read a ? room before you walk in.',
  'Finish Thornwood Jungle\'s page and the map marks the wild fights whose type beats yours.',
  'Safari Pokémon can be caught at any HP, but every throw costs 1 PP and ends your turn. Alphas and bosses can\'t be caught.',
  'Only a win on Trainer Level 5 can break the Sealed Gate for good. What sleeps behind it is very strong.',
  'Legendaries never evolve. They power up instead, and it\'s quite a sight.',
  'Amulet Coin doubles the ₽ you win after fights. More ₽, more Mart.',
];
let hintAt = Math.floor(Math.random() * HINTS.length), profBoards = {};
const profNow = () => PROFS.find(p => p.night === (time === 'night'));
async function standProf(g, who) {
  const m = await monBoard({ src: `assets/trainers/${who.id}.png`, name: who.name, cry: '', px: TRAINER_PX }, false);
  if (!g.parent) { dispose(m.group); return; }
  m.board.rotation.x = -PITCH;
  m.group.position.set(tileX(PROF_AT.x), 0, tileZ(PROF_AT.y));
  const p = places.find(q => q.id === 'prof');
  m.group.traverse(o => { o.userData.place = p; });
  drawMon(m, { facing: 'front' }, 0);
  m.group.visible = who === profNow();
  profBoards[who.id] = m.group;
  g.add(m.group);
}

function rect(x0, y0, x1, y1) {
  const out = [];
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) out.push([x, y]);
  return out;
}

function buildPlaces() {
  dispose(placeGroup);
  tree?.open.dispose();
  sign?.fixed?.dispose();
  glowMats = []; profBoards = {}; tree = null; sign = null; stops = {}; pcMail = null; pcNews = null; questMark = null; nietosMark = null; stoneLit = null; smoke = null; cracks = null; sealed = null;
  places = makePlaces();  saved = acts.savedRun();
  barKey = null;
  blocked = new Set(TREE_TILES.map(([x, y]) => key(x, y)));
  for (const k of [...yardTiles, ...dressTiles, ...FENCES]) blocked.add(k);
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

/** The Whispering Clearing's gate at the north avenue's end, a stretch of fence either side of it; its opening shimmers
    and motes of light drift up and out of it, so the way out reads from anywhere in the Clearing (liveGateway()). */
const MOTES = 26;
function buildGateway(g) {
  const s = clearingGateArt(), x = tileX(GATE_AT.tx), z = tileZ(GATE_AT.ty), b = board(s, x, z);
  glowing(b.material, s, null, '#ffffff', 1);
  b.material.userData.glowMin = 0.3;   // the crest and runes glow a little even at noon
  g.add(b);
  const half = s.width / s.fine / TP / 2, post = (px) => x - half + px / TP;
  const openW = (GATE_OPEN[1] - GATE_OPEN[0]) / TP, openH = (GATE_H - GATE_BEAM) / TP;
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(openW, openH), new THREE.MeshBasicMaterial({ map: gateVeilArt(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.4 }));
  veil.position.set(x, openH / 2, z - 0.03);
  veil.raycast = () => {};
  const rnd = seeded(41), pos = new Float32Array(MOTES * 3), col = new Float32Array(MOTES * 3), seeds = [];
  for (let i = 0; i < MOTES; i++) seeds.push([(rnd() - 0.5) * openW * 0.85, rnd(), rnd(), 0.5 + rnd() * 0.7, i % 3 ? [0.75, 1, 0.85] : [1, 0.9, 0.55]]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const motes = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.12, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  motes.raycast = () => {};
  g.add(veil, motes);
  gateFx = { veil, motes, seeds, x, z, h: openH };
  liveGateway(0);
  safariFence(g, tileX(GATE_AT.tx - 4), post(GATE_FEET[0]), z);
  safariFence(g, post(GATE_FEET[1]), tileX(GATE_AT.tx + 4), z);
  // on left to the Safari gate's fence, closing the gap between them (GAP_TREES behind it)
  safariFence(g, tileX(SAFARI_AT.tx + 3.4), tileX(GATE_AT.tx - 4), z);
}

/** The gate's shimmer breathing, brighter after dark, and its motes rising through the opening and drifting out towards
    you, fading in at the ground and out under the beam. Held still when calm. */
function liveGateway(now) {
  if (!gateFx) return;
  const { veil, motes, seeds, x, z, h } = gateFx, t = calm ? 0 : now / 1000, L = LIGHT[time] || LIGHT.day;
  veil.material.opacity = (0.3 + 0.2 * Math.min(1, L.glow)) * (0.8 + 0.2 * Math.sin(t * 1.3));
  const p = motes.geometry.attributes.position, c = motes.geometry.attributes.color;
  seeds.forEach(([dx, y0, z0, sp, tint], i) => {
    const k = (y0 + t * sp * 0.12) % 1, fade = Math.sin(k * Math.PI);
    p.setXYZ(i, x + dx + Math.sin(t * 0.9 * sp + i) * 0.12, k * h, z + 0.05 + ((z0 + t * sp * 0.05) % 1) * 0.8);
    c.setXYZ(i, tint[0] * fade, tint[1] * fade, tint[2] * fade);
  });
  p.needsUpdate = c.needsUpdate = true;
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
  g.fillStyle = '#7a7a76'; g.fillText('↑ ROUTE OUT', cx, 11.1);
  return c;
}

/* ---------- the Clearing round them ---------- */

// trees inside the walkable grid (they block): a few in the corners, kept off the roads and the ground in front of places
const TREE_TILES = [[0, 15], [1, 20], [0, 24], [9, 24], [21, 24]];

// a copse behind the fence between the Safari gate and the Whispering Clearing's (the user's ask, 2026-10-14: the open
// meadow there read as a hole in the Clearing's edge), on the meadow `cleared` keeps the forest off; [x, y, kind, size]
const GAP_TREES = [[8.2, -2.9, 0, 1.15], [9.6, -3.4, 1, 1.25], [7.4, -3.7, 2, 1.3], [10.4, -2.7, 4, 0.9], [8.9, -4.1, 3, 1.35], [6.6, -2.8, 5, 0.85]];

function buildClearing() {
  const W = COLS + 2 * M, D = ROWS + M + FRONT;
  const top = new THREE.MeshStandardMaterial({ map: tex(groundArt()), roughness: 1 });
  const earth = new THREE.MeshStandardMaterial({ color: '#7a5a34', roughness: 1 }), under = new THREE.MeshStandardMaterial({ color: '#3a2818' });
  ground = new THREE.Mesh(new THREE.BoxGeometry(W, 1, D), [earth, earth, top, under, earth, earth]);
  ground.position.set(tileX(-M - 0.5) + W / 2, -0.5, tileZ(-M - 0.5) + D / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  forest = new THREE.Group();
  scene.add(forest);
  const L = leavesOf(SEASON), crown = (i) => L ? L.trees[i % L.trees.length] : P.trees, far = (i) => L ? L.deep[i % L.deep.length] : P.deep;
  const rnd = seeded(21), kinds = [treeArt(1, crown(0)), treeArt(2, crown(1)), treeArt(3, far(0)), treeArt(4, far(1)), bushArt(5, crown(2)), bushArt(6, crown(0))]
    .map(c => SEASON === 'winter' ? snowCap(c) : c);
  const spots = kinds.map(() => []);
  // the meadow behind is open, the view (buildVista()) over it, but for the woods behind the Sky Pillar
  const cleared = (x, z) => z < tileZ(-0.6) && (x < tileX(PILLAR_AT.tx - 3) || (Math.abs(x - tileX(PILLAR_AT.tx)) < 3.4 && z > tileZ(PILLAR_AT.ty - 1.4)));
  const put = (k, x, z, s) => { if (!cleared(x, z)) spots[k].push({ x, z, s }); };
  for (let r = 0; r < 3; r++) for (let x = -M + 0.5; x < COLS + M; x += 1.25 + rnd() * 0.4) {
    put(r ? 2 + (rnd() < 0.5 ? 1 : 0) : rnd() < 0.5 ? 0 : 1, tileX(x - 0.5) + (rnd() - 0.5) * 0.5, tileZ(-1 - r * 1.2 - rnd() * 0.4), 1.25 + r * 0.25 + rnd() * 0.2);
  }
  // the forest down both sides, from the back meadow's edge to the hedge in front
  for (const s of [-1, 1]) for (let r = 0; r < 3; r++) for (let y = 0.5; y < ROWS + FRONT; y += 1.3 + rnd() * 0.4) {
    const x = s < 0 ? -2 - r * 1.2 : COLS + 1 + r * 1.2;
    put(r ? 2 + (rnd() < 0.5 ? 1 : 0) : rnd() < 0.5 ? 0 : 1, tileX(x) + (rnd() - 0.5) * 0.4, tileZ(y) + (rnd() - 0.5) * 0.3, 1.1 + r * 0.25 + rnd() * 0.2);
  }
  for (const [x, y] of TREE_TILES) put(rnd() < 0.3 ? 4 : rnd() < 0.5 ? 0 : 1, tileX(x), tileZ(y), 1);
  for (const [x, y, k, s] of GAP_TREES) spots[k].push({ x: tileX(x), z: tileZ(y), s });
  // a hedge of bushes along the front edge, low so it never hides the garden
  // each a step nearer than the last: side by side on one plane, where they overlap they z-fought and flickered
  let b = 0;
  for (let x = -M + 0.6; x < COLS + M - 1; x += 1.1 + rnd() * 0.3) put(4 + (rnd() < 0.5 ? 1 : 0), tileX(x), tileZ(ROWS) + 0.2 + (b++ % 2) * 0.08, 0.8 + rnd() * 0.2);
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
  dressClearing();
  dressSeason();
}

// the street's furniture, each on a tile of its own (dressTiles) so nothing walks through it, flower beds in the grass
// between the avenues;
// laid out in mirrored pairs across the north-south avenue (the user's ask, 2026-10-15: they stood scattered): lamps up
// the north avenue, at the east and west avenues' mouths, round the ring road and down to the pond; a bench either side
// of the plaza's front, either side of the pond, and along the east and west avenues, each turned to face what it's by
const LAMPS = [[13, 3], [17, 3], [13, 7], [17, 7], [9, 10], [21, 10], [9, 14], [21, 14],
  [3, 8], [27, 8], [3, 16], [27, 16], [13, 18], [17, 18]];
const BENCHES = [[12, 15, Math.PI * 0.75], [18, 15, -Math.PI * 0.75], [12, 20, 1.08], [18, 20, -1.08], [6, 14, Math.PI], [24, 14, Math.PI]];
const BEDS = [[10, 8, 0.9], [20, 8, 0.9], [10, 16, 0.8], [20, 16, 0.8]];
const dressTiles = new Set();

function dressClearing() {
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });
  const iron = std({ color: '#3a3e48', roughness: 0.5, metalness: 0.3 }), cap = std({ color: '#2a2e36', roughness: 0.5, metalness: 0.3 });
  const pane = std({ color: '#fff4d0', emissive: new THREE.Color('#ffd88a'), roughness: 0.3 });
  pane.userData.glow = 1.6; pane.userData.glowMin = 0.08;
  seasonMats.push(pane);
  const add = (g, geo, m, x, y, z, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; o.raycast = () => {}; g.add(o); return o; };
  const pole = new THREE.CylinderGeometry(0.045, 0.06, 1.7, 8), foot = new THREE.CylinderGeometry(0.12, 0.15, 0.14, 8);
  const head = new THREE.BoxGeometry(0.22, 0.26, 0.22), roof = new THREE.ConeGeometry(0.2, 0.16, 4), arm = new THREE.BoxGeometry(0.3, 0.04, 0.04);
  for (const [tx, ty] of LAMPS) {
    const g = new THREE.Group(), x = tileX(tx), z = tileZ(ty);
    add(g, foot, iron, x, 0.07, z); add(g, pole, iron, x, 0.85, z);
    add(g, arm, iron, x, 1.62, z).castShadow = false;
    add(g, head, pane, x, 1.83, z, false);
    add(g, roof, cap, x, 2.04, z).rotation.y = Math.PI / 4;
    forest.add(g);
    dressTiles.add(key(tx, ty));
  }
  const wood = std({ color: '#b07a44' });
  for (const [tx, ty, turn] of BENCHES) {
    const g = new THREE.Group();
    g.position.set(tileX(tx), 0, tileZ(ty)); g.rotation.y = turn;
    for (const dz of [-0.1, 0.02, 0.14]) add(g, new THREE.BoxGeometry(0.9, 0.05, 0.1), wood, 0, 0.36, dz);
    for (const dy of [0.5, 0.62]) add(g, new THREE.BoxGeometry(0.9, 0.08, 0.04), wood, 0, dy, -0.2);
    for (const dx of [-0.38, 0.38]) { add(g, new THREE.BoxGeometry(0.05, 0.36, 0.34), iron, dx, 0.18, 0); add(g, new THREE.BoxGeometry(0.05, 0.36, 0.05), iron, dx, 0.52, -0.2); }
    forest.add(g);
    dressTiles.add(key(tx, ty));
  }
  const kerbM = std({ color: STONE[2] }), soil = std({ color: '#6a4a2c', roughness: 1 });
  const blooms = (SEASON === 'winter' ? ['#f4f6fa', '#d8e4f0', '#e84838'] : SEASON === 'halloween' ? ['#f08a24', '#8a3ac8', '#f8c840', '#c83a28'] : ['#f86878', '#f8d040', '#ffffff', '#b48af8', '#f8a0c8']).map(c => std({ color: c, roughness: 0.6 }));
  const leafM = std({ color: SEASON === 'winter' ? '#7a9a88' : '#4e9a3c' });
  const rnd = seeded(77), petal = new THREE.IcosahedronGeometry(0.07, 0), leafG = new THREE.IcosahedronGeometry(0.11, 0);
  for (const [tx, ty, r] of BEDS) {
    const g = new THREE.Group();
    g.position.set(tileX(tx), 0, tileZ(ty));
    add(g, new THREE.CylinderGeometry(r, r + 0.04, 0.16, 24), kerbM, 0, 0.08, 0);
    add(g, new THREE.CylinderGeometry(r - 0.08, r - 0.08, 0.17, 24), soil, 0, 0.09, 0, false);
    for (let i = 0; i < r * 30; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (r - 0.18);
      const leaf = add(g, leafG, leafM, Math.cos(a) * d, 0.22, Math.sin(a) * d, false);
      leaf.scale.y = 0.7;
      if (rnd() < 0.7) add(g, petal, blooms[Math.floor(rnd() * blooms.length)], Math.cos(a) * d + (rnd() - 0.5) * 0.06, 0.32, Math.sin(a) * d, false);
    }
    forest.add(g);
    for (let dx = -Math.floor(r); dx <= Math.floor(r); dx++) for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) if (Math.hypot(dx, dy) <= r) dressTiles.add(key(tx + dx, ty + dy));
  }
  // the pond: still water over its painted bed, stones round its edge, lily pads, and nothing walks into it
  const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r + 0.05, 40), std({ color: '#5aaee0', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.62 }));
  water.rotation.x = -Math.PI / 2; water.position.set(tileX(POND.x), 0.03, tileZ(POND.y)); water.raycast = () => {};
  forest.add(water);
  const pebble = new THREE.DodecahedronGeometry(0.13, 0), rock = std({ color: '#a8a294', flatShading: true });
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2, o = add(forest, pebble, rock, tileX(POND.x) + Math.cos(a) * (POND.r + 0.12), 0.05, tileZ(POND.y) + Math.sin(a) * (POND.r + 0.12));
    o.scale.set(1 + rnd() * 0.6, 0.6 + rnd() * 0.4, 1 + rnd() * 0.5); o.rotation.y = rnd() * 3;
  }
  const pad = std({ color: '#5aa848', side: THREE.DoubleSide });
  for (const [dx, dz, r] of [[-0.6, 0.3, 0.2], [0.5, -0.4, 0.16], [0.2, 0.7, 0.14], [-0.2, -0.8, 0.12]]) {
    const o = add(forest, new THREE.CircleGeometry(r, 16, 0.3, Math.PI * 1.8), pad, tileX(POND.x) + dx, 0.045, tileZ(POND.y) + dz, false);
    o.rotation.x = -Math.PI / 2;
    if (r > 0.15) add(forest, petal, blooms[0], o.position.x + 0.05, 0.09, o.position.z - 0.04, false);
  }
  for (let tx = Math.floor(POND.x - POND.r); tx <= POND.x + POND.r; tx++) for (let ty = Math.floor(POND.y - POND.r); ty <= POND.y + POND.r; ty++) if (Math.hypot(tx - POND.x, ty - POND.y) <= POND.r + 0.2) dressTiles.add(key(tx, ty));
  // a duck paddling round the pond, outside the lily pads (liveDuck())
  const d = new THREE.Group(), white = std({ color: '#f4f1e8' }), bill = std({ color: '#f0a030' }), eye = std({ color: '#1a1a1a' });
  const body = add(d, new THREE.SphereGeometry(0.13, 14, 10), white, 0, 0.05, 0);
  body.scale.set(1, 0.7, 1.45);
  add(d, new THREE.ConeGeometry(0.06, 0.12, 8), white, 0, 0.1, -0.2).rotation.x = -Math.PI / 2 - 0.6;   // the tail, tipped up
  const neck = new THREE.Group(); neck.position.set(0, 0.1, 0.13); d.add(neck);
  add(neck, new THREE.SphereGeometry(0.075, 12, 10), white, 0, 0.09, 0.02);
  add(neck, new THREE.BoxGeometry(0.07, 0.022, 0.08), bill, 0, 0.08, 0.11, false);
  for (const sx of [-1, 1]) add(neck, new THREE.SphereGeometry(0.013, 6, 5), eye, sx * 0.055, 0.115, 0.06, false);
  d.position.set(tileX(POND.x) + 1.12, 0.03, tileZ(POND.y));
  forest.add(d);
  duck = { group: d, neck, x: tileX(POND.x), z: tileZ(POND.y) };
}

/** The pond's duck: a slow lap, wandering a little in and out, bobbing on the water and now and then dipping its head. */
function liveDuck(now) {
  if (!duck || calm) return;
  const t = now / 1000, a = t * 0.16, r = 1.12 + Math.sin(t * 0.37) * 0.06;
  duck.group.position.set(duck.x + Math.cos(a) * r, 0.03 + Math.sin(t * 2.2) * 0.008, duck.z + Math.sin(a) * r);
  duck.group.rotation.set(0, -a, Math.sin(t * 1.7) * 0.05);   // heading along the lap, rocking side to side
  const dip = (t % 9) / 9, k = dip > 0.9 ? Math.sin((dip - 0.9) / 0.1 * Math.PI) : 0;
  duck.neck.rotation.x = k * 1.1;
}

/** The season's decorations, built once with the forest. Halloween: jack-o'-lanterns at the Ancient Tree's door and
    the gate, a pumpkin patch with a giant one and a scarecrow, a row of graves lit by candles under a dead tree, a
    bubbling cauldron with toadstools, pumpkins at the gate's feet and two pairs of lantern posts (lit with the clock, setTime()), ghost
    Pokémon wandering among them (js/hub-spooky.js) and bats round the Ancient Tree. Each stands on its own tile, kept off
    every path and place (yardTiles), so nothing walks through them. In winter a snowman by the plaza. */
function dressSeason() {
  if (SEASON === 'halloween') {
    const P_ = (seed, lit = true) => [pumpkinArt(seed, lit), lit ? 'pumpkin' : null];
    // [art, glow, tile x, tile y, size, nudge x, nudge z]; a nudge keeps a thing on its tile but off its middle
    // grouped into a few spots, mirrored across the trail where they frame it, the open ground left clear (the user's
    // call, 2026-10-11: scattered everywhere it read as clutter)
    const yard = [
      [...P_(9), TREE_AT.tx - 1, TREE_AT.ty + 2, 2.2, 0, 0],   // by the Ancient Tree's door
      [lanternArt(0), 'white', 12, 4, 1.3, 0, 0], [lanternArt(1), 'white', 18, 4, 1.3, 0, 0],   // lantern posts up the north avenue
      [lanternArt(2), 'white', 12, 16, 1.3, 0, 0], [lanternArt(3), 'white', 18, 16, 1.3, 0, 0],   // and down the south one
      // the pumpkin patch, where the Nietos' house stood, either side of Kurt's path (his Workshop above it)
      [...P_(5), 26, 10, 4.4, 0, -0.1], [...P_(6), 22, 10, 2.2, 0, 0.1], [...P_(7, false), 23, 10, 1.9, 0, 0.15],
      [scarecrowArt(), 'white', 22, 9, 1.5, 0, 0],
      [deadTreeArt(0), 'white', 11, 9, 1.7, 0, -0.2],   // the graveyard before the dojo: a row of stones by the dead tree, a candle at each end
      [graveArt(0), null, 5, 9, 1.4, 0, 0], [graveArt(1), null, 6, 9, 1.5, 0, 0], [graveArt(2), null, 8, 9, 1.5, 0, 0], [graveArt(3), null, 9, 9, 1.4, 0, 0],
      [candlesArt(0), 'white', 5, 10, 1.1, 0, -0.1], [candlesArt(1), 'white', 8, 10, 1.1, 0, -0.1],
      [...P_(1), 16, 13, 1.4, 0.15, 0.1],   // a little one on the plaza
      [capsArt(0), 'white', 10, 3, 1.2, 0, 0.2],   // the witch's corner by the dojo, beside the cauldron
    ];
    for (const [c, glow, tx, ty, s, nx, nz] of yard) {
      const b = board(c, tileX(tx) + nx, tileZ(ty) + nz, { s });
      if (glow === 'pumpkin' && c.glow) glowing(b.material, c, null, '#ff8a20', 1.3, seasonMats);
      else if (glow && c.glow) glowing(b.material, c, null, '#ffffff', 1.2, seasonMats);
      b.raycast = () => {};
      forest.add(b);
      yardTiles.add(key(tx, ty));
    }
    // at the gate's feet: no tile, so the road through it stays clear
    for (const [dx, i] of [[-2.5, 20], [2.5, 21]]) {   // beside its stone feet, clear of their runes
      const c = pumpkinArt(i), b = board(c, tileX(GATE_AT.tx) + dx, tileZ(GATE_AT.ty) + 0.7, { s: 1.7 });
      glowing(b.material, c, null, '#ff8a20', 1.3, seasonMats);
      b.raycast = () => {};
      forest.add(b);
    }
    // the witch's cauldron, a real model that does something when tapped (js/hub-cauldron.js); its fire and brew are lamps
    cauldron = makeCauldron(THREE);
    cauldron.group.position.set(tileX(10), 0, tileZ(2));
    forest.add(cauldron.group);
    yardTiles.add(key(10, 2));
    for (const l of cauldron.lights) lamps.push(l);
    // the giant pumpkin lights the ground round it after dark
    for (const [colour, at, k] of [['#ff9030', [tileX(24), 1.2, tileZ(9) + 1.4], 0.8]]) {
      const l = new THREE.PointLight(colour, 0, 4, 1.6);
      l.position.set(...at);
      l.userData.k = k;
      lamps.push(l);
      scene.add(l);
    }
    spooks = makeSpooks({ THREE, scene, camera, root, view, tex: texOf, dispose, monBoard, drawMon, route, free, tileX, tileZ, PITCH,
      // never on or beside a doorstep (the user's ask, 2026-10-13: a ghost stood in front of the Poké Mall's doors)
      byDoor: (c) => places.some(p => Math.abs(p.step.x - c.x) <= 1 && Math.abs(p.step.y - c.y) <= 1),
      spawns: [{ x: 11, y: 8 }, { x: 20, y: 10 }, { x: 12, y: 16 }, { x: 26, y: 13 }], bats: { x: tileX(TREE_AT.tx), z: tileZ(TREE_AT.ty - 1.5) } });
  }
  if (SEASON === 'winter') {
    const b = board(snowmanArt(), tileX(12) + 0.3, tileZ(16) - 0.2, { s: 1.2 });
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
  const { x0, w } = vistaSpan(), h = VISTA.h, foot = tileZ(-M + 0.3), tall = h + SKY_UP;
  // its origin at its foot, where a bend (?curve=) drops it whole with the meadow it stands on; it runs SKY_UP on up
  // past the painting, there sampling the painting's top row (its plain sky, the texture clamped), so from the
  // Clearing's front, where the bend drops it furthest, no grey shows over it (the user's ask, 2026-10-14)
  const geo = new THREE.PlaneGeometry(w, tall).translate(0, tall / 2, 0), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * tall / h);
  vista = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true, fog: false }));
  vista.material.userData.upright = true;
  vista.rotation.x = -PITCH;
  vista.position.set(x0 + w / 2, 0, foot);
  vista.raycast = () => {};
  forest.add(vista);
  paintVista();
}

// across the whole back, well past the ground's edges, the woods behind the Sky Pillar standing in front of it (the
// user's ask, 2026-10-14: from the east side, grey showed past its old end at the Pillar)
const vistaSpan = () => { const x0 = tileX(-M - 8); return { x0, w: Math.round(tileX(COLS + M + 8) - x0) }; };
const SKY_UP = 40;

function paintVista() {
  const t = timeOfDay();
  if (!vista || vista.userData.time === t) return;
  vista.material.map?.dispose();
  const { x0, w } = vistaSpan();
  vista.material.map = texOf(vistaArt(t, w, [{ x: tileX(SAFARI_AT.tx) - x0, half: TRAIL * 0.9 }, { x: tileX(GATE_AT.tx) - x0, half: TRAIL * 0.9 }], vistaLook(SEASON)));
  vista.material.needsUpdate = true;
  vista.userData.time = t;
}

/* ---------- walking ---------- */

// the open meadow behind the grid, from the Safari gate's corner to the Sky Pillar's, and the road on out through the
// Whispering Clearing's gate (walkOut())
const MEADOW = new Set([...rect(-3, -4, PILLAR_AT.tx + 2, -1)].map(([x, y]) => key(x, y)));
// the fences either side of the gates, out on the meadow, and the trees in the gap between them (GAP_TREES)
const FENCES = [...rect(SAFARI_AT.tx + 4, GATE_AT.ty, GATE_AT.tx - 2, GATE_AT.ty), ...rect(GATE_AT.tx + 2, GATE_AT.ty, GATE_AT.tx + 4, GATE_AT.ty),
  ...rect(SAFARI_AT.tx + 4, GATE_AT.ty - 2, GATE_AT.tx - 5, GATE_AT.ty - 1),
  ...rect(-3, SAFARI_AT.ty, SAFARI_AT.tx - 2, SAFARI_AT.ty), ...rect(SAFARI_AT.tx + 2, SAFARI_AT.ty, SAFARI_AT.tx + 3, SAFARI_AT.ty)].map(([x, y]) => key(x, y));
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
  const d = Math.hypot(dx, dz), move = dt / 1000 * (arriving ? 5.2 : 4);
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
  playSound('confirm');   // as you tap, not again as you get there (the user's ask, 2026-10-12)
  if (walker.path.length === 0 && placeAt(walker.tile) === p) return enter ? open(p, i) : showCard(p);
  walker.path = route(walker.tile, p.step);
  aim = enter ? { p, i } : null;
  hideCard();
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
  if (p.waystone) return showWaystone(p);
  if (!p.open || !p.buttons.length || (i == null && p.buttons.length > 1)) return showCard(p);
  const stop = stops[p.id];
  if (stop) {
    if (stop.spinAt && performance.now() - stop.spinAt < SPIN) return;
    spinStop(stop);
  }
  if (p.id === 'base') return baseOwned() ? enterBase() : buyBase();
  if (p.id === 'mall') return enterMall();
  if (p.id === 'pc') return openPc();
  if (p.id === 'nietos' || p.id === 'workshop') return enterHouse(p);
  walker.hopUntil = performance.now() + 400;
  hideCard();
  const [label, go] = p.buttons[i ?? 0];
  if (p.id === 'trail' && label !== 'Escape Rope' && !calm) return setTimeout(() => walkOut(go), SPIN * 0.6);
  setTimeout(() => { if (running) go(); }, calm ? 0 : stop ? SPIN * 0.8 : 260);
}

/** Setting out (the user's ask, 2026-10-09; north since 2026-10-14): from the Pokéstop by the Whispering Clearing's arch
    your partner steps onto the avenue and walks away up it, under the arch and off into the distance, and the run opens
    once it's gone. */
function walkOut(go) {
  if (!running) return;
  const at = { x: GATE_AT.tx, y: STOP_AT.ty };
  walker.path = [...route(walker.tile, at)];
  for (let y = at.y - 1; y >= GATE_AT.ty - 5; y--) walker.path.push({ x: at.x, y });
  outbound = go;
  aim = null; here = null;
}

/** Back from a run that walked out under the gate: in through it again, down the avenue, facing you. */
function walkBackIn() {
  walker.x = tileX(GATE_AT.tx); walker.z = tileZ(GATE_AT.ty - 3); walker.tile = { x: GATE_AT.tx, y: GATE_AT.ty - 3 };
  walker.path = [];
  for (let y = GATE_AT.ty - 2; y <= GATE_AT.ty + 4; y++) walker.path.push({ x: GATE_AT.tx, y });
  walker.facing = 'front';
  camX = walker.x; camZ = walker.z;
  returning = true;
}

/* ---------- the Pokéstop ---------- */

/** A Pokéstop at (x, z), `S` its size: New game's on the trail, and the Safari's small one by its gate. `saved` is
    whether it holds the saved run: CONTINUE over it, else its own `start` (the user let Claude pick, 2026-10-10: NEW GAME
    sounded like wiping the save). The disc and its words turn together (`disc` is their group, liveStop()). */
function pokestop(g, id, x, z, S, saved, start) {
  const d = stopDiscArt(), w = d.width / d.fine / TP * 1.15 * S;
  g.add(board(stopPostArt(), x, z, { s: S }));
  const m = glowing(new THREE.MeshStandardMaterial({ map: texOf(d), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6 }), d, null, '#9cecff', 1.4);
  m.userData.glowMin = 0.3;
  const spin = new THREE.Group(), face = new THREE.Mesh(new THREE.PlaneGeometry(w, w), m);
  face.castShadow = true;
  spin.add(face);
  spin.position.set(x, 1.55 * S + w / 2, z);
  g.add(spin);
  stops[id] = { disc: spin, m, y: spin.position.y, spinAt: 0, cue: stopCue(spin, w / 2, S, saved ? 'CONTINUE' : start) };
}

/** Glowing words over a Pokéstop's disc, turning with it (the user's asks: 2026-10-09 / 10 make it obvious where to carry
    on or start; 2026-10-14 on top of the stop, not on the ground before it, and a little smaller): CONTINUE over the one
    holding the saved run, else what that stop starts, all the same size for a stop's size. Bungee, a heavy arcade face,
    white letters with a cyan glow on a dark extruded edge, a little see-through, chevrons marching in on either side;
    a face each way, so the words read right from behind too. */
let cueFont;
function stopCue(g, top, S, text) {
  const c = document.createElement('canvas');
  c.width = 760; c.height = 240;
  c.hd = 2;
  const map = tex(c);
  // the letters are painted once onto `base`; each frame lays the marching chevrons beside them
  const base = document.createElement('canvas');
  base.width = c.width; base.height = c.height;
  const cx = 380, cy = 120;
  let half = 0, px = 124, last = -1;
  const paint = () => {
    const d = base.getContext('2d');
    d.clearRect(0, 0, base.width, base.height);
    px = 124;
    do d.font = `${px -= 4}px Bungee, "Arial Black", sans-serif`; while (px > 40 && d.measureText(text).width > 500);
    d.textAlign = 'center'; d.textBaseline = 'middle'; d.lineJoin = 'round';
    half = d.measureText(text).width / 2;
    d.shadowColor = 'rgba(95, 224, 255, 0.9)'; d.shadowBlur = 22;
    d.lineWidth = 16; d.strokeStyle = 'rgba(40, 190, 240, 0.55)';
    d.strokeText(text, cx, cy);
    d.shadowBlur = 0;
    // a chunky extruded edge under the letters, like an arcade title
    d.lineWidth = 9; d.strokeStyle = d.fillStyle = '#06182a';
    for (let i = 6; i > 0; i -= 2) { d.strokeText(text, cx, cy + i); d.fillText(text, cx, cy + i); }
    d.strokeStyle = '#0c2c48';
    d.strokeText(text, cx, cy);
    const g = d.createLinearGradient(0, cy - px * 0.42, 0, cy + px * 0.42);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#bff2ff');
    d.fillStyle = g;
    d.fillText(text, cx, cy);
    draw(last < 0 ? 0 : last, true);
  };
  const chevron = (d, x, dir, a) => {
    d.globalAlpha = a;
    d.beginPath(); d.moveTo(x - 20 * dir, cy - 26); d.lineTo(x + 6 * dir, cy); d.lineTo(x - 20 * dir, cy + 26);
    d.lineWidth = 20; d.strokeStyle = '#0c2c48'; d.stroke();
    d.lineWidth = 10; d.strokeStyle = '#8eecff'; d.stroke();
  };
  // `now` 0 (and Reduced motion) is the still look: one chevron each side
  const draw = (now, force) => {
    if (!force && now - last < 33) return;
    last = now;
    const d = c.getContext('2d');
    d.clearRect(0, 0, c.width, c.height);
    d.lineJoin = 'round'; d.lineCap = 'round';
    if (!now) { chevron(d, cx - half - 40, 1, 1); chevron(d, cx + half + 40, -1, 1); }
    else for (let k = 0; k < 2; k++) {
      const t = (now / 1100 + k / 2) % 1, x = half + 92 - t * 44, a = Math.sin(t * Math.PI);
      chevron(d, cx - x, 1, a); chevron(d, cx + x, -1, a);
    }
    d.globalAlpha = 1;
    d.drawImage(base, 0, 0);
    map.needsUpdate = true;
  };
  paint();
  cueFont ??= new FontFace('Bungee', 'url(https://fonts.gstatic.com/s/bungee/v17/N0bU2SZBIuF2PU_0DXR1.woff2)').load()
    .then((f) => document.fonts.add(f));
  cueFont.then(paint, () => {});
  // drawn over the ground, not added to it: added light at 60% washed white letters into the grass (the user couldn't read them)
  const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, fog: false });
  const w = 3.2 * S, h = w * 240 / 760;
  for (const turn of [0, Math.PI]) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    mesh.rotation.y = turn;
    mesh.position.y = top + h * 0.3;
    mesh.renderOrder = 2;
    g.add(mesh);
  }
  m.userData.tick = draw;
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
  playSound('door');
  entering = { at: performance.now(), z: walker.z };
  await curtain(true, calm ? 0 : 420);
  entering = null;
  inside = 'mall';
  await acts.onMall();
}

/** What floats over the PC: the envelope for mail, else the "!" for unread patch notes or a PC page not yet opened. */
function pcMarks() {
  if (!pcMail) return;
  pcMail.visible = unclaimed().length > 0;
  pcNews.visible = !pcMail.visible && pcBeckons(getSave());
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

/** The new player's buddy (the title's first power-on), swapped in quietly while the Clearing still waits behind it. */
export async function refreshBuddy() {
  const mate = buddy(getSave());
  if (!mon || mon.src === mate.src) return;
  const old = mon, shown = old.group.visible;
  const next = await monBoard(mate);
  next.board.rotation.x = -PITCH;
  next.board.userData.who = { mon: next, w: walker };
  dispose(old.group); scene.remove(old.group);
  mon = next;
  mon.group.visible = shown;
  scene.add(mon.group);
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
  if (p.waystone) return showWaystone(p);
  if (p.guest?.welcome) welcomeHome(p.guest.town);
  card.classList.remove('way');
  // the Pokéstop with a saved run asks which (the user's call, 2026-10-08): its card's two buttons
  const ask = asks(p);
  // the user's call, 2026-10-08: that question is the Pokédex's shell, its two keys and no words
  card.classList.toggle('ask', ask);
  card.querySelector('.hub-card-name').textContent = p.name;
  card.querySelector('.hub-card-line').textContent = p.line;
  resetLine();
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

/** The Waystone's menu (the user's pick, 2026-10-14): the Pokédex's shell round a green LCD listing every town it reaches,
    a mended one with Travel (the rooms' gold pill), one met but not yet mended with its friendship, one not yet reached
    as ???. A later town is a RING line. */
function showWaystone(p) {
  here = p;
  const save = getSave();
  if (townsOpen() && !clearingLit(save)) return brokenWaystone(p, save);
  if (!townsOpen() || !RING.some(t => townState(save, t.id).met)) return sealedWaystone(p);
  card.querySelector('.hub-card-name').textContent = p.name;
  card.querySelector('.hub-card-line').textContent = p.line;
  resetLine();
  const head = document.createElement('div');
  head.className = 'way-head';
  head.innerHTML = '<b>WAYSTONE</b>';
  const list = document.createElement('div');
  list.className = 'way-list';
  const homeRow = document.createElement('div');   // the Clearing's own first: the hub every town links through (step 7)
  homeRow.className = 'way-row lit';
  homeRow.style.setProperty('--gem', '#d8f0ff');
  const homeGem = document.createElement('i'), homeName = document.createElement('b'), homeTag = document.createElement('span');
  homeGem.className = 'way-gem';
  homeName.className = 'way-name';
  homeName.textContent = CLEARING.name;
  homeTag.className = 'way-count';
  homeTag.textContent = 'Here';
  homeRow.append(homeGem, homeName, homeTag);
  list.append(homeRow);
  for (const t of RING) {
    const town = TOWNS[t.id], st = townState(save, t.id), lit = mended(st), known = lit || st.met;
    const row = document.createElement('div');
    row.className = `way-row ${lit ? 'lit' : known ? 'dark' : 'unmet'}`;
    row.style.setProperty('--gem', t.glow);
    const gem = document.createElement('i'), name = document.createElement('b');
    gem.className = 'way-gem';
    name.className = 'way-name';
    name.textContent = known ? town.name : '???';
    row.append(gem, name);
    if (lit) {
      const go = document.createElement('button');
      go.type = 'button';
      go.className = 'room-ok way-go';
      go.textContent = 'Travel';
      go.addEventListener('click', () => warpTo(p, t));
      row.append(go);
      // your saved run waits in this town's biome: its far gate walks on into it (js/run.js's runWaitingIn())
      import('./run.js').then(m => {
        if (!m.runWaitingIn(t.id) || !row.isConnected) return;
        const tag = document.createElement('span');
        tag.className = 'way-count way-run';
        tag.textContent = 'Run';
        tag.title = `Your run waits in ${town.name}: walk out its far gate to carry on.`;
        go.before(tag);
      });
    } else {
      const n = document.createElement('span');
      n.className = 'way-count';
      const [step, of] = questProgress(town, st);
      n.textContent = st.quest ? `${step}/${of}` : '';
      if (st.quest) n.title = `${step} of ${of} steps of ${town.name}'s quest done: the last puts back its Waystone's shard.`;
      row.append(n);
    }
    list.append(row);
  }
  card.querySelector('.hub-card-acts').replaceChildren(head, list);
  card.classList.remove('locked', 'ask');
  card.classList.add('way');
  card.hidden = false;
}

/** Before any town is reached the Waystone keeps its list to itself (the user's call, 2026-10-14): a riddle a tap, in
    turn, hinting the way to the towns out on the roads. */
const RIDDLES = [
  'An old stone hums on the plaza. Five dull crystals circle its tip, and not one of them lights.',
  'Words worn into its base: WHERE THE ROADS MEET, MEND WHAT WAS BROKEN.',
  'It feels cold to the touch. Somewhere out past the gate, stones like it lie broken.',
  'Five crystals, five roads. Perhaps someone out there knows how to wake them.',
];
let riddle = 0;
/** The Clearing's Waystone before the Nietos' questline mends it (step 7): no Travel, a word on why, pointing to them. */
function brokenWaystone(p, save) {
  const st = townState(save, 'clearing'), step = questStep(CLEARING, st), [n, of] = questProgress(CLEARING, st);
  card.classList.remove('way', 'locked', 'ask');
  card.querySelector('.hub-card-name').textContent = p.name;
  card.querySelector('.hub-card-line').textContent = st.quest
    ? `Cracked straight through, and every town's stone went dark with it. The Nietos are mending it: quest ${n}/${of}.${step ? ` Up now: ${stepText(step)}.` : ''}`
    : 'Cracked straight through, humming off-key. It travels nowhere like this. The Nietos by the plaza seem to know about it: beat them at the Clearing\'s Gym, and they\'ll tell you.';
  resetLine();
  card.querySelector('.hub-card-acts').replaceChildren();
  card.hidden = false;
}
function sealedWaystone(p) {
  card.classList.remove('way', 'locked', 'ask');
  card.querySelector('.hub-card-name').textContent = p.name;
  card.querySelector('.hub-card-line').textContent = RIDDLES[riddle++ % RIDDLES.length];
  resetLine();
  card.querySelector('.hub-card-acts').replaceChildren();
  card.hidden = false;
}

/** When the Safari's day or the Sky Pillar's week turns over (midnight UTC, the week on Monday), counted down on their
    places' cards (the user's ask, 2026-10-12: the reset was a guess at their own midnight). */
let resetAt = 0;
function resetLine() {
  const kind = here?.reset, out = card.querySelector('.hub-card-reset');
  out.hidden = !kind;
  if (kind) out.textContent = `${kind === 'daily' ? 'New day' : 'New week'} in ${timeLeft(kind)}`;
}

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
  if (dragged) { dragged = false; return; }
  if (held || arriving || leaving || outbound || returning) return;
  const rays = tapRays(e), ghosts = spooks?.boards() || [], under = [mon.board, ...ghosts, placeGroup, ...(cauldron ? [cauldron.hit] : [])];
  let hit;
  for (const ray of rays) if ((hit = ray.intersectObjects(under, true).find(h => !h.object.userData.who || onSprite(h)))) break;
  if (spooks?.tap(hit, walker)) return;
  if (spooks?.hush()) return;
  if (hit?.object.userData.cauldron) { cauldron.tap(); walker.hopUntil = performance.now() + 500; return; }
  if (hit?.object === mon.board) { playCry(mon.id); walker.hopUntil = performance.now() + 500; return; }
  if (hit?.object.userData.place) return goTo(hit.object.userData.place, true);
  const to = groundTile(rays);
  if (!to) return;
  walkTo(to);
  if (!walker.path.length) arrived();
}

/** The screen's ray through a tap as straight pieces of the world: one, or under ?curve= many short ones, each put back
    where it stands unbent, as the bend only moves what is drawn. */
function tapRays(e) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(ndc(e), camera);
  if (!CURVE) return [ray];
  const o = ray.ray.origin, d = ray.ray.direction, out = [], STEP = 1.5;
  for (let t = 0; t < 90; t += STEP) {
    const a = unbend(o.clone().addScaledVector(d, t), BEND), b = unbend(o.clone().addScaledVector(d, t + STEP), BEND);
    out.push(new THREE.Raycaster(a, b.clone().sub(a).normalize(), 0, a.distanceTo(b)));
  }
  return out;
}

/** The grid tile under a tap's rays, or null off the ground. */
function groundTile(rays) {
  const at = new THREE.Vector3(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ray = rays.find(r => r.ray.intersectPlane(plane, at) && at.distanceTo(r.ray.origin) <= r.far);
  if (!ray) return null;
  const to = { x: Math.floor(at.x + X0), y: Math.floor(at.z + Z0) };
  return inGrid(to) ? to : null;
}

/** Off along a route to `to`, the ring marking where it ends; a step already under way is finished first. */
function walkTo(to) {
  const next = walker.path[0];
  walker.path = next ? [next, ...route(next, to)] : route(walker.tile, to);
  aim = null;
  hideCard();
  const end = walker.path.at(-1) ?? walker.tile;
  ring.position.set(tileX(end.x), 0.02, tileZ(end.y));
  ring.material.opacity = 0.9;
}

/* Hold and drag to walk (the user's ask, 2026-10-11): your partner follows the finger tile by tile while it's down, and
   the tap that ends a drag is swallowed so it doesn't walk again or open a place. */
let drag = null, dragged = false;

function onDown(e) {
  if (held || arriving || leaving || outbound || returning || (e.button ?? 0) > 0) return;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, last: '' };
}

function onDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 12) return;
    drag.moved = true;
    view.setPointerCapture?.(e.pointerId);
  }
  if (held || arriving || leaving || outbound || returning) return;
  const to = groundTile(tapRays(e));
  if (!to || key(to.x, to.y) === drag.last) return;
  drag.last = key(to.x, to.y);
  walkTo(to);
}

function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  if (drag.moved) {
    dragged = true;
    setTimeout(() => { dragged = false; }, 400);   // a drag that ends off the canvas sends no click to clear it
    if (!walker.path.length) arrived();
  }
  drag = null;
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
    playSound('confirm');
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
  sun.color.set(L.sun); sun.intensity = L.sunI; sun.position.set(...L.at); sun.userData.at = L.at;
  if (camera) followSun();
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
  for (const who of PROFS) if (profBoards[who.id]) profBoards[who.id].visible = who === profNow();
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
    const s = [tileX(-1.5) + rnd() * (COLS + 2), 0.25 + rnd() * 1.6, tileZ(-3.5) + rnd() * (ROWS + 4), rnd() * 100, 0.6 + rnd() * 0.8];
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
  let lo = -2 * ROWS, hi = 2 * ROWS;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    aimCamera(0, mid);
    if (edge.set(0, 0, tileZ(ROWS - 0.5) + FRONT).project(camera).y < low) lo = mid; else hi = mid;
  }
  camera.userData.front = lo;
  scene.fog.near = d + 2; scene.fog.far = d + 22;
}

// ?aerial: the whole Clearing from high above, to see its layout at a glance
const AERIAL = new URLSearchParams(location.search).has('aerial');

// the ground rolls away like Animal Crossing's (bend() in js/hd2d.js), at the strength the user picked from 1 to 3
// (2026-10-14: the strongest); ?curve=N tries another, ?curve=0 lays it flat. Every town rolls the same (js/event-3d.js).
const CURVE_AT = 3;
export const CURVE = (() => {
  const q = new URLSearchParams(location.search);
  if (AERIAL) return 0;
  const n = parseFloat(q.get('curve'));
  return Math.max(0, q.has('curve') && Number.isFinite(n) ? n : CURVE_AT) * 0.01;
})();
const BEND = { k: { value: CURVE }, z: { value: 0 } };

/** Every material in the Clearing bent once; anything added since (a place, a guest, the flyer) is caught next frame. */
function bendAll() {
  scene.traverse(o => {
    if (!o.material) return;
    if (o.isMesh) bendFine(o);
    for (const m of [o.material].flat()) bend(m, BEND);
  });
}

function placeCamera(dt) {
  if (AERIAL) {
    const cx = tileX(-M - 0.5) + (COLS + 2 * M) / 2, cz = tileZ(-M - 0.5) + (ROWS + M + FRONT) / 2;
    camera.position.set(cx, 62, cz + 22);
    camera.lookAt(cx, 0, cz);
    camera.updateMatrixWorld();
    scene.fog.near = 400; scene.fog.far = 500;
    camX = camZ = 0; followSun();
    return;
  }
  const { half, front } = camera.userData;
  // up the Safari road, or to the Sky Pillar's door, the view looks on ahead into the back corner
  const ahead = !arriving && walker.tile.y <= 2 ? 2.5 : 0;
  const frontZ = front, backZ = ahead ? tileZ(-2.5) : tileZ(2);
  // walking in, the view waits on the plaza for it rather than dipping to meet it
  const wx = arriving ? tileX(ARRIVE.x) : walker.x, wz = arriving ? tileZ(ARRIVE.y) : walker.z - ahead;
  const loX = tileX(-0.5) - 2.2 + half - ahead * 1.2, hiX = tileX(COLS - 0.5) + 2.2 - half + ahead * 1.2;
  const wantX = loX >= hiX ? (loX + hiX) / 2 : Math.max(loX, Math.min(hiX, wx));
  const wantZ = backZ >= frontZ ? (backZ + frontZ) / 2 : Math.max(backZ, Math.min(frontZ, wz));
  const k = calm ? 1 : Math.min(1, dt / 1000 * 4);
  camX += (wantX - camX) * k; camZ += (wantZ - camZ) * k;
  aimCamera(camX, camZ);
  followSun();
}

/** The sun's shadow box (26 units square) kept over the view, as the Clearing is wider than it; moved in whole shadow-map
    texels, so the shadows don't shimmer as it goes. */
function followSun() {
  const step = 26 / 1024, x = Math.round(camX / step) * step, z = Math.round(camZ / step) * step, at = sun.userData.at;
  if (!at) return;
  sun.position.set(x + at[0], at[1], z + at[2]);
  sun.target.position.set(x, 0, z);
  sun.target.updateMatrixWorld();
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
  if (screen.hidden || !root.isConnected) { running = false; quiet(); sleepGL(renderer); return; }
  // under the device (its corner button opened it over the hub) the Clearing holds still rather than drawing unseen
  if (root.querySelector('.room-home.out') && document.getElementById('collection-screen')?.hidden === false) { last = 0; requestAnimationFrame(frame); return; }
  if (!card.hidden && now - resetAt > 5000) { resetAt = now; resetLine(); }
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
  liveWarp(now);
  liveStones(now);
  liveSmoke(now);
  liveDuck(now);
  spooks?.tick(now, dt, { calm, quiet: held || arriving || !!inside || !!entering || !!outbound, partner: walker });
  if (ring.material.opacity > 0) { ring.material.opacity = Math.max(0, ring.material.opacity - dt / 700); ring.scale.setScalar(1.25 - ring.material.opacity * 0.3); }
  sealed?.tick(now, (LIGHT[time] || LIGHT.day).glow, calm);
  liveGateway(now);
  cracks?.tick(now, Math.hypot(walker.x - cracks.x, walker.z - cracks.z) < 4.5, calm);
  if (!calm) livePc(now);
  cauldron?.tick(now, dt, calm);
  for (const m of [pcMail, pcNews, questMark, nietosMark]) if (m?.visible) m.position.y = m.userData.y + (calm ? 0 : Math.sin(now / 380) * 0.08);
  if (!calm) for (const s of Object.values(stops)) liveStop(s, now);
  for (const s of Object.values(stops)) if (s.cue) {
    s.cue.opacity = calm ? 0.82 : 0.74 + 0.14 * (0.5 + 0.5 * Math.sin(now / 520));
    s.cue.userData.tick(calm ? 0 : now);
  }
  liveSign(now);
  if (now - (frame.checked || 0) > 30000) { frame.checked = now; setTime(); }
  liveBugs(now);
  placeCamera(dt);
  liveSnow(now);
  if (!held) { liveFlyer(now, dt); sounds(now); }
  placeBar();
  if (CURVE) { BEND.z.value = camZ; bendAll(); }  post.draw(scene, camera, (v3().set(walker.x, 0.6, walker.z).project(camera).y + 1) / 2);
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
    <div class="hub-card" role="dialog" aria-live="polite" hidden><b class="hub-card-name"></b><p class="hub-card-line"></p><p class="hub-card-reset" hidden></p><div class="hub-card-acts"></div></div>
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
  for (const [colour, at, k] of [['#ffc070', [tileX(TREE_AT.tx) - 1.25, 2.4, tileZ(TREE_AT.ty) + 0.6], 1], ['#8ab0ff', [tileX(PILLAR_AT.tx), 1.1, tileZ(PILLAR_AT.ty) + 1.6], 0.7], ['#a8f8d8', [tileX(GATE_AT.tx), 1.6, tileZ(GATE_AT.ty) + 1], 0.9]]) {
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
  post = createPost(renderer, AERIAL ? { short: 1100 } : {});
  if (AERIAL) { post.final.uniforms.uBlur.value = 0; Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, far: 80 }); sun.shadow.mapSize.set(2048, 2048); }
  buildClearing();
  makeBugs();
  await gateReady();
  view.addEventListener('click', onTap);
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onDrag);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', onUp);
  addEventListener('keydown', onKey);
  new ResizeObserver(() => resize()).observe(view);
  if (CURVE) bendAll();
  await warmShaders(renderer, scene, camera);
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
  } catch (err) { console.warn('Clearing unavailable', err); built = Promise.reject(); built.catch(() => {}); return false; }
  // held before it's on the page, or the bar shows over the shut Pokédex while the partner loads
  root.classList.toggle('held', hold);
  await wakeGL(renderer);
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
  if (!placed) {
    placed = true;
    // ?hubat=x,y starts your partner on that tile, to look round one corner of the Clearing
    const at = new URLSearchParams(location.search).get('hubat')?.split(',').map(Number);
    walker.tile = at?.length === 2 ? { x: at[0], y: at[1] } : ARRIVE;
    walker.x = tileX(walker.tile.x); walker.z = tileZ(walker.tile.y); camX = walker.x; camZ = walker.z;
  }
  walker.path = []; aim = null; here = placeAt(walker.tile);
  outbound = null; returning = false;
  if (inside) leftPlace();
  else if (!inGrid(walker.tile) && !hold) walkBackIn();
  else if (!inGrid(walker.tile)) { walker.tile = { x: GATE_AT.tx, y: GATE_AT.ty + 4 }; walker.x = tileX(walker.tile.x); walker.z = tileZ(walker.tile.y); }
  hideCard();
  root.querySelectorAll('.room-home.out').forEach(k => k.classList.remove('out'));
  dexNews();
  nextFly = performance.now() + 6000;
  airAt = 0;
  setTime(true);
  resize();
  if (!held) screen.classList.add('hub-on');
  if (!running) { running = true; last = 0; requestAnimationFrame(frame); }
  homeNews();
  return true;
}

/** Out from behind the shut Pokédex: the corner keys come up and your partner walks in through the Whispering Clearing's
    gate, down the north avenue onto the plaza, facing you. */
export function enterHub() {
  if (!held || !mon) return;
  held = false;
  root.classList.remove('held');
  screen.classList.add('hub-on');
  mon.group.visible = true;
  nextFly = performance.now() + 6000;
  homeNews();
  if (calm || new URLSearchParams(location.search).has('hubat')) return;
  const from = GATE_AT.ty - 1;
  walker.x = tileX(ARRIVE.x); walker.z = tileZ(from); walker.tile = { x: ARRIVE.x, y: from };
  walker.path = [];
  for (let y = from + 1; y <= ARRIVE.y; y++) walker.path.push({ x: ARRIVE.x, y });
  walker.facing = 'front';
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
  sleepGL(renderer);
}
