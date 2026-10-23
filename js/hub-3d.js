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
import { leavesOf, groundLook, vistaLook, snowCap, tintOf, BUG_LOOK, pumpkinArt, snowmanArt, graveArt, scarecrowArt, candlesArt, hayArt, lanternArt, capsArt } from './hub-season.js';
import { makeSpooks } from './hub-spooky.js';
import { calmFx } from './prefs.js';
import { plazaBoard } from './hub-plaza.js';
import { plazaTop } from './trainers.js';
import { plazaBuddies } from './graves.js';
import { makeBuddies } from './hub-buddies.js';
import { cloudConfigured, cloudRemembered } from './cloud.js';
import { playSound, playCry, setLoop } from './audio.js';
import { buddy, deviceNews } from './trainercard.js';
import { loadThree, tex, dispose, MON_PX, monBoard, drawMon, onSprite, createPost, curtain, warmShaders, wakeGL, sleepGL, bend, bendFine, unbend, tooSoon, smallNoShadow, bakeColours } from './hd2d.js';
import { gateHp, gateReady } from './gate.js';
import { isStarterUnlocked } from './progress.js';
import { STARTERS_BY_ID } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { safariOpen, safariUnlockProgress } from './data/pokedex.js';
import { showSafariLock } from './safarilock.js';
import { readyTasks } from './data/ranger.js';
import { towerOpen } from './data/tower.js';
import { smoothIcon, roundKey } from './smooth-icons.js';
import { vistaArt, VISTA } from './hub-vista.js';
import { makeCracks, CRACK_LINES } from './hub-cracks.js';
import { makeSealedGate } from './hub-sealed.js';
import { makeGardenArch } from './hub-arch.js';
import { makeHouse, makeKiosk } from './hub-houses.js';
import { housesOpen, homeOf, HOUSES_BY_ID, firstHouse, lotWord } from './data/houses.js';
import { YARD_PRICE } from './data/house.js';
import { gateStage } from './data/gate.js';
import { pcModel, livePc } from './hub-pc.js';
import { makeHolo } from './hub-holo.js';
import { makeCauldron } from './hub-cauldron.js';
import { safariGate, WING_X } from './hub-safari.js';
import { makeDojo } from './hub-dojo.js';
import { makePillar } from './hub-pillar.js';
import { kenWinsOf } from './data/dojo.js';
import { RING, TOWNS, CLEARING, QUESTS, townState, townsOpen, nietosHome, mended, questProgress, questStep, stepText, stepHave, guestLines, clearingLit, sealOn, workshopOpen } from './data/towns.js';
import { satchelOf, satchelFlag, MATERIALS_BY_ID } from './data/satchel.js';
import { gymWins, friendWins, GYM_BY_ID, spriteOf } from './data/gym.js';
import { todaysGuest, welcomeHome, startQuest, heardCall } from './towns.js';
import { asking, favourOf } from './data/favours.js';
import { workshopOf, heartsOf, boothBeckons } from './data/workshop.js';
import { unclaimed, friendMail } from './mail.js';
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
// the west side runs WEST tiles further (2026-10-15, the user's ask: room for the Safari gate out on its own), walkable
// grass to the forest's edge; MW is its margin, M the other sides'
const WEST = 4, MW = M + WEST;
// the Whispering Clearing's gate at the far end of the north avenue (the user's ask, 2026-10-14: the way out goes north);
// the road runs on through it into the painted distance (js/hub-vista.js), New game's Pokéstop and the Berry Booth either
// side of the avenue before it
const GATE_AT = { tx: 15, ty: -2 };
// New game's Pokéstop and the Berry Booth (js/berrybooth.js) a row in front of the gate, right at the avenue's edges, in
// line with its lamps (the user's ask, 2026-10-23: closer to the road), their doorsteps on the road (ROADSIDE: how far
// each stands out from its tile towards the road)
const STOP_AT = { tx: 17, ty: 0 }, BOOTH_AT = { tx: 13, ty: 0 }, ROADSIDE = 0.4;
const TP = 16;                // painted pixels a tile
const START = { x: 15, y: 12 };  // the plaza's middle, the Waystone's tile
const PLAZA_R = 3.6;             // the paved plaza's radius
const PC_AT = { tx: 19, ty: 10 };
const HOLO_AT = { tx: 11, ty: 10 };   // the Buddy Projector (js/hub-holo.js), left of the quest board where Halloween's dead tree stood
// the quest board (towns on only) and the Trainer Plaza's board (js/hub-plaza.js) at the plaza's top corners, either side
// of the north avenue, each turned to face the plaza (the user's marks on an aerial shot, 2026-10-17); `at` is where it
// stands (tiles, fractions allowed), `tiles` what it blocks, `step` where you stand to read it
const QUEST_AT = { at: [12.5, 8.4], tiles: [[13, 8], [12, 8], [12, 9]], step: { x: 13, y: 9 } };
const PLAZA_AT = { at: [17.5, 8.4], tiles: [[17, 8], [18, 8], [18, 9]], step: { x: 17, y: 9 } };
const facePlaza = ([x, y]) => Math.atan2(START.x - x, START.y - y);
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
// the Secret Base's backyard (js/base-3d.js) grows the same trees under the same sky
export { P as CLEARING_LOOK, LIGHT as CLEARING_LIGHT, treeArt, bushArt };
const AIRS = ['clearing-day', 'clearing-night'];
const BUGS = 90;

// the Safari gate and the Sky Pillar in the back corners, out on the meadow, each up a trail off the ring road
const SAFARI_AT = { tx: 1, ty: -3 };
const PILLAR_AT = { tx: 28, ty: -3 };
// each by its top-left tile: Kenmatta's dojo north-west; the Ancient Tree, the Secret Base, north-east (TREE_AT its middle
// tile); moved 2026-10-14 from the user's drawing: the Nietos' house south-east and the Poké Mall south-west, their doors
// on the low road to the pond (the old road they faced taken out), and the Sealed Gate (once broken) where the mall stood,
// at the west avenue's end
// the Nietos' mansion on its 5 x 4 (off NIETOS_AT; 2026-10-20, the user's ask: a mansion, where a 3 x 3 cottage stood,
// a tile in off the ring road), its door on the middle column; NIETOS_YARD the iron fence along the row in front, either
// side of the gate, nothing walking through it; the name board a tile left of the lot's front corner
const NIETOS_YARD = [[0, 4], [1, 4], [3, 4], [4, 4]];
const NIETOS_AT = { tx: 22, ty: 16 }, DOJO_AT = { tx: 6, ty: 0 }, TREE_AT = { tx: 22, ty: 4 }, MALL_TILE = { tx: 8, ty: 18 };
const SEALED_AT = { tx: 2, ty: 10 };
// the garden gate into the Secret Base's backyard (2026-10-15, the user's ask: its way in from outside, not a back door),
// in the front of the Ancient Tree's fenced garden, just right of its trunk (moved from 27,3 the same day, the user's drawing)
const ARCH_AT = { tx: 25, ty: 4 }, ARCH_X = 0;
// the Timburr crew's builders' stand (houses on, js/data/houses.js), just outside the lot's fence on its left, by the ring road
const KIOSK_AT = { tx: 17, ty: 4 };
// Kurt's Workshop (its top-left tile) in the plaza's north-east, its door straight onto the east avenue (moved down a
// step from 23,6 on 2026-10-15, the user's ask: up the grass it stood apart from the street)
const WORKSHOP_AT = { tx: 23, ty: 8 };
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
  { a: [4, 5], b: [4, SAFARI_AT.ty + 1.6], w: TRAIL, dirt: true },        // trails to the Safari gate (west under its board, then on through it) and the Sky Pillar
  { a: [SAFARI_AT.tx, SAFARI_AT.ty + 1.6], b: [SAFARI_AT.tx, -M - 0.6], w: TRAIL, dirt: true },
  { a: [28, 5], b: [28, PILLAR_AT.ty + 1], w: TRAIL, dirt: true },
  { a: [SAFARI_AT.tx - 3, SAFARI_AT.ty + 1.6], b: [4, SAFARI_AT.ty + 1.6], w: TRAIL * 0.8, dirt: true },
  { a: [PILLAR_AT.tx - 2, PILLAR_AT.ty + 1.6], b: [PILLAR_AT.tx + 2, PILLAR_AT.ty + 1.6], w: TRAIL * 0.8, dirt: true },
  { a: [MALL_TILE.tx - 0.7, MALL_TILE.ty + 1.6], b: [MALL_TILE.tx - 0.7, POND.y], w: 0.6 },              // the mall's and the Nietos' doorsteps down to the low road
  { a: [NIETOS_AT.tx + 2, NIETOS_AT.ty + 3.7], b: [NIETOS_AT.tx + 2, POND.y], w: 0.5 },
  { a: [WORKSHOP_AT.tx + 1, WORKSHOP_AT.ty + 2.6], b: [WORKSHOP_AT.tx + 1, START.y], w: 0.6, towns: true },   // Kurt's doorstep down to the east avenue
];
// round the pond, a ring of stone to walk
const RINGS = [{ x: POND.x, y: POND.y, r: POND.r + 0.75, w: 0.42 }];

let THREE, renderer, scene, camera, post, root, view, screen, acts, dexBtn;
let hemi, sun, ring, ground, forest, placeGroup, vista = null;
let mon = null, walker = { x: 0, z: 0, tile: SPAWN, path: [], facing: 'front', flip: false, hop: 0 };
let places = [], blocked = new Set(), aim = null, here = null, card, bar, barKey = null, barCoins = null, saved = null;
let safariFx = null;
let plazaFx = null;   // the Trainer Plaza's board: its lanterns, its Poké Ball and its cork of Polaroids (js/hub-plaza.js)   // the Safari gate's swaying pennants, lanterns and torches (js/hub-safari.js)
let glowMats = [], lamps = [], bugs = null, flyer = null, flownMat = null, flyShade = null, nextFly = 0, stepAt = 0, airAt = 0, tree = null, sign = null, gardenArch = null, inside = null, entering = null, leaving = null;   // inside: the place walked into, 'base', 'backyard' or 'mall'
let stops = {}, calm = false, time = '', running = false, last = 0, fpsLog = [], camX = 0, camZ = 0, fpsEl = null, sealed = null, gateFx = null, dojoFx = null, pillarFx = null;
let built = null;   // the promise of the first build
let seasonMats = [], snow = null;   // the season's lit decorations (kept apart from glowMats, which buildPlaces() remakes) and its snowfall
let buddies = null, buddiesAt = 0;   // the trainers on your list, as their buddies in the Trainer Plaza (js/hub-buddies.js)
let yardTiles = new Set(), spooks = null, cauldron = null, cracks = null;   // the tiles the season's decorations stand on (nothing walks through them), Halloween's ghosts and its cauldron
let safariMark = null;   // the "!" over the Safari gate while a Ranger task waits (js/data/ranger.js)
let pcMail = null;  // the envelope bobbing over the PC while its mailbox has a letter (js/mail.js)
let holo = null;    // the Buddy Projector: the walking buddy as a hologram (js/hub-holo.js)
let beckons = [];   // the signs that are places of their own, hopping now and then (beckon())
let questMark = null, nietosMark = null;   // the "!" over the quest board (a notice to read) and over the Nietos' house (a step to hand them; boardNow())
let house = null, kiosk = null, trying = null;   // the house on the lot (js/hub-houses.js), the builders' stand, and the house tried on from its catalogue
let boothMark = null;  // a "!" over the Berry Booth while held berries are kept and nothing's packed (boothBeckons())
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
  const W = (COLS + M + MW) * TP, H = (ROWS + M + FRONT) * TP, a = art(W, H), rnd = seeded(7);
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
    const u = x / TP - MW - 0.5, v = y / TP - M - 0.5;
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
      const out = Math.max(-u - 0.5 - WEST, u - (COLS - 0.5), v - (ROWS - 0.5), 0);
      const n = smooth(x, y, 6) * 3.2 + hash(x, y) * 1.4 + (Math.min(paved, dirtD) < 0.12 ? 1 : 0) + Math.min(2, out * 0.6);
      c = meadow[Math.min(5, Math.max(0, Math.floor(n)))];
    }
    const i = (y * W + x) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  a.g.putImageData(img, 0, 0);
  const onPath = (x, y) => { const u = x / TP - MW - 0.5, v = y / TP - M - 0.5; return Math.min(roadsAt(u, v, false), roadsAt(u, v, true), Math.hypot(u - START.x, v - START.y) - PLAZA_R, Math.hypot(u - POND.x, v - POND.y) - POND.r - 0.3) < 0.25; };
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

/** The fence either side of the gate, the lobby's: round log posts and two rails, from `x0` to `x1` along `z`. */
function safariFence(g, x0, x1, z) {
  const wood = new THREE.MeshStandardMaterial({ color: '#b87c48', roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: '#8a5a30', roughness: 0.9 });
  const f = new THREE.Group();
  const add = (mesh, x, y, zz) => { mesh.position.set(x, y, zz); mesh.castShadow = mesh.receiveShadow = true; f.add(mesh); return mesh; };
  const n = Math.max(1, Math.round((x1 - x0) / 1.1)), post = new THREE.CylinderGeometry(0.075, 0.085, 0.78, 10);
  for (let i = 0; i <= n; i++) add(new THREE.Mesh(post, wood), x0 + (x1 - x0) * i / n, 0.39, z);
  for (const y of [0.34, 0.62]) add(new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x1 - x0), 0.08, 0.06), dark), (x0 + x1) / 2, y, z + 0.06);
  mergeStill(f);
  g.add(f);
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

/** The Ancient Tree, smooth (2026-10-08): a crown of hundreds of leaf clumps lit from the top left with blossoms in it and
    vines hanging off it, a ridged trunk flaring into arching roots, and the Secret Base's plank door in the hollow between
    them, a round window and a lantern lit at dusk; mushrooms, ferns and grass at its foot. Open, the door's swung in on a
    warm room; `boarded` (not bought yet) nails two planks across it. */
function ancientArt(open = false, boarded = false, L = HOUSES_BY_ID.tree.paints[0]) {
  // at 4 pixels a unit, still several times what the screen shows of it: at 8 its four pictures (shut and open, with their
  // glow) were 5 MP, sent to the GPU as the Clearing first drew
  const W = 128, H = 160, { c, g, fill, rr, lin, shine } = fine(W, H, 4), rnd = seeded(11), glow = shine();
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
  for (const [x, y, r] of lobes) fill(L.lobe[0], () => g.arc(x, y, r + 1.2, 0, Math.PI * 2));
  for (const [x, y, r] of lobes) fill(L.lobe[1], () => g.arc(x, y, r, 0, Math.PI * 2));
  const clumps = [];
  for (let i = 0; i < 420; i++) {   // leaf clumps, lit from the top left, the lit ones on top
    const [bx, by, br] = lobes[Math.floor(rnd() * lobes.length)], a = rnd() * Math.PI * 2, rad = 2.6 + rnd() * 3.6, d = Math.sqrt(rnd()) * (br - rad * 0.6);
    const x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d;
    const l = -((x - bx) / br * 0.5 + (y - by) / br * 0.8) - (y - 40) / 90 + (rnd() - 0.5) * 0.35;
    clumps.push([l, x, y, rad]);
  }
  clumps.sort((p, q) => p[0] - q[0]);
  const shade = (l) => L.shade[l > 0.75 ? 0 : l > 0.35 ? 1 : l > -0.1 ? 2 : 3];
  for (const [l, x, y, rad] of clumps) {
    const [lit, dark] = shade(l);
    fill(dark, () => g.arc(x + rad * 0.18, y + rad * 0.22, rad, 0, Math.PI * 2));
    fill(lit, () => g.arc(x, y, rad * 0.88, 0, Math.PI * 2));
    if (l > 0.2) fill('rgba(255,255,220,0.22)', () => g.arc(x - rad * 0.3, y - rad * 0.35, rad * 0.35, 0, Math.PI * 2));
  }
  for (const [l, x, y] of clumps.slice(-90)) if (rnd() < 0.5) leaf(g, x + (rnd() - 0.5) * 4, y + (rnd() - 0.5) * 4, -2.4 + rnd() * 1.2, 1.6 + rnd(), l > 0.75 ? L.leaf[0] : L.leaf[1]);
  for (let i = 0; i < 26; i++) {   // blossoms in the light
    const [, x, y] = clumps[clumps.length - 1 - Math.floor(rnd() * 160)];
    blossom(g, x + (rnd() - 0.5) * 3, y + (rnd() - 0.5) * 3, 0.55, rnd() < 0.5 ? L.bloom[0] : L.bloom[1], '#f8d848');
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
/* A glow map's resolution against its painting's. Full size, the glow maps were half of every smooth painting's memory,
   mostly black (Cinder Springs held ~70 MB of them, 2026-10-18, while an iPhone kept reloading the tab); light is soft,
   and half as fine is a quarter of that. */
const GLOW = 0.5;

/** A smooth painting (the user's call: the notice boards, then the Safari gate, the Sky Pillar and the Ancient Tree,
    aren't pixel art), drawn in painted-pixel units, `k` times finer; board() shows it the same size as a pixel one.
    shine() is its emissive map, painted alongside in the same units at GLOW its resolution (mask() matches exact pixel
    colours, which smooth edges never are). */
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
      c.glow = new OffscreenCanvas(Math.max(1, Math.round(c.width * GLOW)), Math.max(1, Math.round(c.height * GLOW)));
      const sx = c.glow.width / c.width * k, sy = c.glow.height / c.height * k, gg = c.glow.getContext('2d');
      c.glow.fine = sx;
      gg.fillStyle = '#000'; gg.fillRect(0, 0, c.glow.width, c.glow.height);
      gg.scale(sx, sy); gg.lineJoin = gg.lineCap = 'round';
      softer(gg, sx / k);
    }
    return c.glow.getContext('2d');
  };
  return { c, g, fill, rr, lin, shine };
}

/** A context drawn at `q` its painting's resolution keeps its painting's halos: a shadow's blur and offset are in
    canvas pixels, never scaled by the transform (leader-homes.js's neon and rune rings blur their glow too). */
function softer(ctx, q) {
  for (const key of ['shadowBlur', 'shadowOffsetX', 'shadowOffsetY']) {
    let p = Object.getPrototypeOf(ctx), d;
    while (p && !(d = Object.getOwnPropertyDescriptor(p, key))) p = Object.getPrototypeOf(p);
    if (!d?.set) continue;
    Object.defineProperty(ctx, key, { get() { return d.get.call(this) / q; }, set(v) { d.set.call(this, v * q); } });
  }
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

/** Only the Ancient Tree's door (with its frame) takes a tap, not the whole tree (the user's ask, 2026-10-15): a tap on
    the crown or trunk walks there instead. In ancientArt()'s 128 x 160 painting the door's frame spans x 49-79, y 110-158. */
const DOOR_UV = { u0: 48 / 128, u1: 80 / 128, v1: 1 - 108 / 160 };
function doorOnly(ray, hits) {
  const mine = [];
  THREE.Mesh.prototype.raycast.call(this, ray, mine);
  for (const h of mine) if (h.uv && h.uv.x >= DOOR_UV.u0 && h.uv.x <= DOOR_UV.u1 && h.uv.y <= DOOR_UV.v1) hits.push(h);
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

/** The mall's front: a cream two-storey block, POKé MALL in a gold-framed red panel ringed with marquee bulbs under the
    red cornice, a row of upper windows between gold pilasters, then a ground floor of shop-lit glass round sliding doors,
    the Game Corner's violet sign hung in the glass. Its corners stay plain: the corner towers stand on them. */
function mallFrontArt(W, H) {
  const f = fine(W, H, 8), { g, rr, lin, shine } = f, s = shine(), M = 8, gold = lin(0, 0, 0, 3, [GC.gold, GC.goldDark]);
  g.fillStyle = lin(0, 0, 0, H, [MALL.cream, MALL.stone]); g.fillRect(0, 0, W, H);
  rr(0, 0, W, 3.2, 0, lin(0, 0, 0, 3.2, [MALL.red, MALL.redDark]));
  rr(0, 3.2, W, 0.7, 0, GC.gold);
  // the sign: a gold frame, a red panel, a white face, bulbs all round
  const sx = W * 0.12, sw = W * 0.76;
  rr(sx - 1, 4.8, sw + 2, 13, 2.4, lin(0, 4.8, 0, 17.8, [GC.gold, GC.goldDark, GC.gold]));
  rr(sx, 5.6, sw, 11.4, 2, MALL.red);
  rr(sx + 1.6, 7, sw - 3.2, 8.6, 1.2, '#ffffff');
  ball(g, sx + 6.5, 11.3, 3.2);
  ball(g, sx + sw - 6.5, 11.3, 3.2);
  words(g, 'POKé MALL', W * 0.5 + 0.25, 11.65, 6.4, 'rgba(0,0,0,0.25)');
  words(g, 'POKé MALL', W * 0.5, 11.3, 6.4, MALL.red);
  s.fillStyle = '#d8d0c0'; s.beginPath(); s.roundRect(sx + 1.6, 7, sw - 3.2, 8.6, 1.2); s.fill();
  ball(s, sx + 6.5, 11.3, 3.2, '#000'); ball(s, sx + sw - 6.5, 11.3, 3.2, '#000');
  words(s, 'POKé MALL', W * 0.5, 11.3, 6.4, '#ff9080');
  const bulbs = [];
  for (let x = sx + 1.5; x <= sx + sw - 1.4; x += 2.6) bulbs.push([x, 6.3], [x, 16.3]);
  for (const y of [8.9, 11.3, 13.7]) bulbs.push([sx + 0.8, y], [sx + sw - 0.8, y]);
  for (const [x, y] of bulbs) {
    g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(x, y, 0.5, 0, Math.PI * 2); g.fill();
    s.fillStyle = '#fff0a0'; s.beginPath(); s.arc(x, y, 0.6, 0, Math.PI * 2); s.fill();
  }
  // the upper floor's windows, arched, a gold pilaster between each
  const n = 5, gap = 2.2, ww = (W - 2 * M - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const x = M + i * (ww + gap);
    rr(x - 0.5, 18.8, ww + 1, 9.2, [ww / 2 + 0.5, ww / 2 + 0.5, 0.6, 0.6], MALL.shade);
    g.save(); g.beginPath(); g.roundRect(x, 19.3, ww, 8.2, [ww / 2, ww / 2, 0.3, 0.3]); g.clip();
    shopGlass(f, x, 19.3, ww, 8.2, null);
    g.restore();
    s.fillStyle = '#9a7848'; s.beginPath(); s.roundRect(x, 19.3, ww, 8.2, [ww / 2, ww / 2, 0.3, 0.3]); s.fill();
    rr(x + ww / 2 - 0.4, 18.4, 0.8, 1.2, 0.3, GC.gold);
    if (i < n - 1) rr(x + ww + gap / 2 - 0.45, 19, 0.9, 9.6, 0.3, gold);
  }
  rr(0, 28.6, W, 0.6, 0, GC.gold);
  rr(0, 29.2, W, 2.4, 0, lin(0, 29.2, 0, 31.6, [MALL.red, MALL.redDark]));
  rr(0, 31.6, W, 0.5, 0, GC.gold);
  // the ground floor: glass between dark mullions, the doors in the middle
  const top = 32.5;
  rr(M - 0.8, top, W - 2 * M + 1.6, H - top, 0, MALL.frame);
  const doorW = W * 0.24, dx = (W - doorW) / 2;
  for (const [x0, x1] of [[M, dx - 0.8], [dx + doorW + 0.8, W - M]]) {
    const panes = 2, pw = (x1 - x0 - 0.8 * (panes - 1)) / panes;
    for (let i = 0; i < panes; i++) shopGlass(f, x0 + i * (pw + 0.8), top + 0.8, pw, H - top - 1.6, s);
  }
  for (const x of [dx, dx + doorW / 2 + 0.2]) shopGlass(f, x, top + 0.8, doorW / 2 - 0.2, H - top - 0.8, s);
  rr(dx + doorW / 2 - 1.6, top + 9, 0.6, 3, 0.3, '#f0d070'); rr(dx + doorW / 2 + 1, top + 9, 0.6, 3, 0.3, '#f0d070');
  // the Game Corner's sign, hung inside the glass on the right, clear of the porch's columns
  const gx = dx + doorW + 5, gw = W - M - gx - 0.6;
  rr(gx, top + 3, gw, 5, 1, lin(0, top + 3, 0, top + 8, [GC.gold, GC.goldDark]));
  rr(gx + 0.5, top + 3.5, gw - 1, 4, 0.7, lin(0, top + 3.5, 0, top + 7.5, [GC.violet, GC.violetDark]));
  g.fillStyle = GC.gold; star(g, gx + 1.8, top + 5.5, 1.1);
  words(g, 'GAME CORNER', gx + gw / 2 + 0.9, top + 5.6, 2, '#ffe36b');
  s.fillStyle = '#ffe890'; star(s, gx + 1.8, top + 5.5, 1.1);
  words(s, 'GAME CORNER', gx + gw / 2 + 0.9, top + 5.6, 2, '#ffe890');
  return f.c;
}

/** Its sides: the same cream, red cornice and gold-edged band, two rows of windows. */
function mallSideArt(W, H) {
  const f = fine(W, H, 8), { g, rr, lin, shine } = f, s = shine();
  g.fillStyle = lin(0, 0, 0, H, [MALL.stone, MALL.shade]); g.fillRect(0, 0, W, H);
  rr(0, 0, W, 3.2, 0, lin(0, 0, 0, 3.2, [MALL.red, MALL.redDark]));
  rr(0, 3.2, W, 0.7, 0, GC.gold);
  rr(0, 28.6, W, 0.6, 0, GC.gold);
  rr(0, 29.2, W, 2.4, 0, lin(0, 29.2, 0, 31.6, [MALL.red, MALL.redDark]));
  rr(0, 31.6, W, 0.5, 0, GC.gold);
  for (const [y, h] of [[8, 16], [35, H - 40]]) for (let x = 3; x + 9 <= W - 2; x += 13) shopGlass(f, x, y, 9, h, y > 30 ? s : null);
  return f.c;
}

/** A corner tower's walls: cream, a red crown edged in gold, two tall arched windows, lit at night. */
function mallTowerArt(W, H) {
  const f = fine(W, H, 8), { g, rr, lin, shine } = f, s = shine();
  g.fillStyle = lin(0, 0, 0, H, [MALL.cream, MALL.stone]); g.fillRect(0, 0, W, H);
  rr(0, 0, W, 4, 0, lin(0, 0, 0, 4, [MALL.red, MALL.redDark]));
  rr(0, 4, W, 0.7, 0, GC.gold);
  rr(0, H - 2.2, W, 2.2, 0, MALL.shade);
  const ww = W * 0.5, x = (W - ww) / 2;
  for (const [y, h] of [[8, 14], [26, 16], [46, H - 52]]) {
    if (h < 6) continue;
    const arch = [ww / 2, ww / 2, 0.3, 0.3];
    rr(x - 0.6, y - 0.6, ww + 1.2, h + 1.2, arch, GC.goldDark);
    g.save(); g.beginPath(); g.roundRect(x, y, ww, h, arch); g.clip(); shopGlass(f, x, y, ww, h, null); g.restore();
    s.fillStyle = '#b08850'; s.beginPath(); s.roundRect(x, y, ww, h, arch); s.fill();
  }
  return f.c;
}

/** The dome's drum: cream between gold bands, a ring of small lit arches. */
function mallDrumArt(W, H) {
  const f = fine(W, H, 8), { g, rr, lin, shine } = f, s = shine();
  g.fillStyle = lin(0, 0, 0, H, [MALL.cream, MALL.shade]); g.fillRect(0, 0, W, H);
  rr(0, 0, W, 0.8, 0, GC.gold); rr(0, H - 0.8, W, 0.8, 0, GC.gold);
  const n = 12, step = W / n, ww = step * 0.45;
  for (let i = 0; i < n; i++) {
    const x = i * step + (step - ww) / 2, arch = [ww / 2, ww / 2, 0, 0];
    rr(x, 1.4, ww, H - 2.8, arch, MALL.warm[1]);
    s.fillStyle = '#c09858'; s.beginPath(); s.roundRect(x, 1.4, ww, H - 2.8, arch); s.fill();
  }
  return f.c;
}

/** A Poké Ball on a disc, for the porch's pediment. */
function mallMedalArt() {
  const f = fine(10, 10, 12), { g } = f;
  g.fillStyle = GC.gold; g.beginPath(); g.arc(5, 5, 4.9, 0, Math.PI * 2); g.fill();
  g.fillStyle = GC.goldDark; g.beginPath(); g.arc(5, 5, 4.2, 0, Math.PI * 2); g.fill();
  ball(g, 5, 5, 3.6);
  return f.c;
}

let mallFx = null;   // the mall's marquee bulbs chasing and the Poké Ball turning on its spire (mallFx.tick())

/** The Poké Mall (the user's call, 2026-10-08: the Game Corner's stall grew into a shopping centre, the Game Corner inside
    it; made grand 2026-10-15, the user's ask, "more grand and extravagant on the outside"): a two-storey block facing you,
    a gold-ribbed glass dome on a lit drum crowned by a turning Poké Ball, a tower with a gold cupola and a flag at each
    front corner, and a white-columned porch with a Poké Ball pediment and chasing bulbs over the doors, gold lamps beside
    it and a red carpet down the steps. */
function mallBuilding() {
  const W = 3.5, D = 2.5, H = 2.75, F = D / 2;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const g = new THREE.Group();
  const add = (mesh, x, y, z, shadow = true, to = g) => { mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = shadow; to.add(mesh); return mesh; };
  const front = mallFrontArt(W * MU, H * MU), side = mallSideArt(D * MU, H * MU);
  const fm = glowing(std({ map: texOf(front), roughness: 0.6 }), front, null, '#fff0d0', 1);
  fm.userData.glowMin = 0.2;
  const sm = glowing(std({ map: texOf(side) }), side, null, '#fff0d0', 0.8);
  const roof = std({ color: '#b8ac98' }), back = std({ color: MALL.shade });
  const gold = std({ color: '#f2c444', metalness: 0.35, roughness: 0.35, emissive: new THREE.Color('#5a3800'), emissiveIntensity: 0.35 });
  const marble = std({ color: '#fbf8f2', roughness: 0.45 }), red = std({ color: MALL.red }), redDark = std({ color: MALL.redDark });
  add(new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [sm, sm, roof, roof, fm, back]), 0, H / 2, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.14, D + 0.12), redDark), 0, H + 0.07, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.16, 0.04, D + 0.16), gold), 0, H + 0.16, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.035, D + 0.06), gold), 0, H - 1.6, 0);
  // a balustrade round the roof, gold posts on a white rail
  const rail = H + 0.18, postGeo = new THREE.BoxGeometry(0.04, 0.16, 0.04);
  for (const [w, d, x, z] of [[W, 0.04, 0, F - 0.02], [W, 0.04, 0, -F + 0.02], [0.04, D, W / 2 - 0.02, 0], [0.04, D, -W / 2 + 0.02, 0]]) {
    add(new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), marble), x, rail + 0.16, z);
    const n = Math.round(Math.max(w, d) / 0.22);
    for (let i = 0; i <= n; i++) {
      const k = -0.5 + i / n;
      add(new THREE.Mesh(postGeo, gold), w > d ? k * w : x, rail + 0.08, w > d ? z : k * d, false);
    }
  }
  // the dome: a drum of lit arches, gold-ribbed glass, a lantern, a spire and a Poké Ball that turns
  const R = 0.62, dz = -0.1, drumH = 0.26, base = H + 0.18;
  const drumArt = mallDrumArt(Math.round(2 * Math.PI * R * MU), Math.round(drumH * MU));
  const drum = glowing(std({ map: texOf(drumArt) }), drumArt, null, '#ffe0a0', 1.2);
  drum.userData.glowMin = 0.15;
  add(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.04, R + 0.06, drumH, 32), drum), 0, base + drumH / 2, dz);
  const glass = std({ color: '#bfe4ff', emissive: new THREE.Color('#9fd0ff'), metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.85 });
  glass.userData.glow = 0.5; glass.userData.glowMin = 0.15;
  glowMats.push(glass);
  const domeY = base + drumH;
  add(new THREE.Mesh(new THREE.SphereGeometry(R, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), glass), 0, domeY, dz);
  add(new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.03, 6, 40), gold), 0, domeY, dz).rotation.x = Math.PI / 2;
  const ribGeo = new THREE.TorusGeometry(R + 0.005, 0.014, 4, 20, Math.PI);
  for (let i = 0; i < 4; i++) add(new THREE.Mesh(ribGeo, gold), 0, domeY, dz, false).rotation.y = i * Math.PI / 4;
  const lit = std({ color: '#fff2c8', emissive: new THREE.Color('#ffd890'), roughness: 0.4 });
  lit.userData.glow = 1.2; lit.userData.glowMin = 0.35;
  glowMats.push(lit);
  const topY = domeY + R;
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 12), lit), 0, topY + 0.06, dz);
  add(new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.12, 12), gold), 0, topY + 0.2, dz);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.2, 8), gold), 0, topY + 0.34, dz);
  const finial = new THREE.Group();
  finial.position.set(0, topY + 0.53, dz);
  finial.userData.live = true;
  g.add(finial);
  const fr = 0.11, white = std({ color: '#ffffff', roughness: 0.4 }), ink = std({ color: '#2a2238' });
  add(new THREE.Mesh(new THREE.SphereGeometry(fr, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: MALL.red, roughness: 0.35 })), 0, 0, 0, true, finial);
  add(new THREE.Mesh(new THREE.SphereGeometry(fr, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), white), 0, 0, 0, true, finial);
  add(new THREE.Mesh(new THREE.TorusGeometry(fr, 0.012, 6, 24), ink), 0, 0, 0, false, finial).rotation.x = Math.PI / 2;
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 14), white), 0, 0, fr, false, finial).rotation.x = Math.PI / 2;
  // a tower at each front corner, a lit cupola and a flag on top
  const TW = 0.44, TH = H + 0.62, tx = W / 2 - 0.16, tz = F - 0.2;
  const towerArt = mallTowerArt(Math.round(TW * MU), Math.round(TH * MU));
  const tm = glowing(std({ map: texOf(towerArt) }), towerArt, null, '#fff0d0', 1);
  tm.userData.glowMin = 0.15;
  const pole = std({ color: '#d8d8e0', metalness: 0.5, roughness: 0.3 }), flag = std({ color: MALL.red, side: THREE.DoubleSide });
  for (const sx of [-1, 1]) {
    const x = sx * tx;
    add(new THREE.Mesh(new THREE.BoxGeometry(TW, TH, TW), [tm, tm, roof, roof, tm, tm]), x, TH / 2, tz);
    add(new THREE.Mesh(new THREE.BoxGeometry(TW + 0.08, 0.07, TW + 0.08), gold), x, TH + 0.035, tz);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.2, 8), lit), x, TH + 0.17, tz);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2;
      add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.03), gold), x + Math.cos(a) * 0.15, TH + 0.18, tz + Math.sin(a) * 0.15, false);
    }
    add(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.34, 8), gold), x, TH + 0.45, tz);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), gold), x, TH + 0.64, tz, false);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8), pole), x, TH + 0.88, tz);
    add(new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.22), flag), x + 0.18, TH + 1.0, tz, false);
  }
  // the porch: a white plinth, twin columns either side of the doors, a red entablature, a pediment with a Poké Ball
  const PZ = F + 0.3, PW = 1.9;
  add(new THREE.Mesh(new THREE.BoxGeometry(PW + 0.5, 0.05, 0.46), marble), 0, 0.025, F + 0.23);
  add(new THREE.Mesh(new THREE.BoxGeometry(PW + 0.3, 0.05, 0.4), marble), 0, 0.075, F + 0.2);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.006, 0.4), red), 0, 0.103, F + 0.2, false);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.006, 0.06), red), 0, 0.053, F + 0.43, false);
  const colH = 1.06, colY = 0.1, colGeo = new THREE.CylinderGeometry(0.055, 0.065, colH, 14), capGeo = new THREE.BoxGeometry(0.17, 0.05, 0.17);
  for (const x of [-0.68, -0.5, 0.5, 0.68]) {
    add(new THREE.Mesh(colGeo, marble), x, colY + colH / 2, PZ);
    add(new THREE.Mesh(capGeo, gold), x, colY + 0.025, PZ);
    add(new THREE.Mesh(capGeo, gold), x, colY + colH - 0.025, PZ);
  }
  const entY = colY + colH;
  add(new THREE.Mesh(new THREE.BoxGeometry(PW, 0.13, 0.42), red), 0, entY + 0.065, F + 0.21);
  add(new THREE.Mesh(new THREE.BoxGeometry(PW + 0.04, 0.03, 0.44), gold), 0, entY + 0.145, F + 0.22);
  const tri = (w, h) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); sh.closePath(); return sh; };
  add(new THREE.Mesh(new THREE.ExtrudeGeometry(tri(PW + 0.08, 0.44), { depth: 0.08, bevelEnabled: false }), gold), 0, entY + 0.16, F + 0.32);
  add(new THREE.Mesh(new THREE.ExtrudeGeometry(tri(PW - 0.14, 0.34), { depth: 0.06, bevelEnabled: false }), marble), 0, entY + 0.2, F + 0.36, false);
  const medal = std({ map: texOf(mallMedalArt()), transparent: true, roughness: 0.5 });
  add(new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), medal), 0, entY + 0.32, F + 0.425, false);
  // bulbs along the porch's edge, every other one lit in turn
  const bulbs = [0, 1].map(() => std({ color: '#fff2b0', emissive: new THREE.Color('#fff2b0'), roughness: 0.4 }));
  const bulbGeo = new THREE.SphereGeometry(0.028, 8, 6);
  for (let i = 0; i <= 12; i++) add(new THREE.Mesh(bulbGeo, bulbs[i % 2]), -PW / 2 + 0.06 + (i / 12) * (PW - 0.12), entY - 0.02, F + 0.43, false);
  // gold lamps either side of the steps, three globes each
  const globe = std({ color: '#fff6d8', emissive: new THREE.Color('#ffe8a8'), roughness: 0.3 });
  globe.userData.glow = 1.4; globe.userData.glowMin = 0.3;
  glowMats.push(globe);
  const globeGeo = new THREE.SphereGeometry(0.06, 12, 8);
  for (const sx of [-1, 1]) {
    const x = sx * 1.3, z = F + 0.3;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.08, 10), gold), x, 0.04, z);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.9, 8), gold), x, 0.5, z);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), gold), x, 0.92, z, false);
    for (const [ox, oy] of [[-0.15, 0.98], [0.15, 0.98], [0, 1.03]]) add(new THREE.Mesh(globeGeo, globe), x + ox, oy, z, false);
  }
  // only its doors take a tap (the user's ask, 2026-10-09: a tap meant for the road to the Safari went in); the rest
  // lets it through to the ground
  g.traverse(o => { if (o.isMesh) o.raycast = () => {}; });
  mergeStill(g, (o) => o.parent.userData.live);
  const doorH = H - 32.5 / MU;
  add(new THREE.Mesh(new THREE.BoxGeometry(W * 0.24 + 0.06, doorH + 0.08, 0.5), new THREE.MeshBasicMaterial({ visible: false })), 0, (doorH + 0.08) / 2, D / 2 + 0.25, false);
  mallFx = {
    tick(now, still, glow) {
      const on = Math.max(0.6, glow) * 1.4, k = still ? 0.5 : (Math.floor(now / 380) % 2);
      bulbs[0].emissiveIntensity = on * (still ? 1 : 0.35 + 0.65 * k);
      bulbs[1].emissiveIntensity = on * (still ? 1 : 1 - 0.65 * k);
      if (!still) finial.rotation.y = now / 1400;
    },
  };
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
  mergeStill(s, (o) => o.parent === orbit || o.raycast !== THREE.Mesh.prototype.raycast);
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
let nietosFx = null;  // the Nietos' mansion's moving parts: its chimney's smoke, its banners and its flag (liveNietos())
let mansion = null;   // the mansion's paintings, painted once
const BLOOMS = ['#f890b8', '#ffffff', '#8cc8f8', '#f86880', '#f8d848', '#b8a0f0'];

/** A pacifier, the Nietos' emblem (baby Linc's, the Pacifier Badge's): a shield, its ring over it, the teat under it. */
function pacifier(g, cx, cy, s, col, dark) {
  g.fillStyle = col; g.strokeStyle = col; g.lineWidth = s * 0.28;
  g.beginPath(); g.arc(cx, cy - s * 1.05, s * 0.55, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.ellipse(cx, cy + s * 0.95, s * 0.36, s * 0.5, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(cx, cy, s * 1.15, s * 0.62, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = dark; g.beginPath(); g.ellipse(cx, cy, s * 0.42, s * 0.26, 0, 0, Math.PI * 2); g.fill();
}

/** A little crown over an emblem. */
function crown(g, cx, cy, w, col) {
  g.fillStyle = col; g.beginPath();
  g.moveTo(cx - w / 2, cy + w * 0.3); g.lineTo(cx - w / 2, cy - w * 0.2); g.lineTo(cx - w / 4, cy + w * 0.05); g.lineTo(cx, cy - w * 0.3);
  g.lineTo(cx + w / 4, cy + w * 0.05); g.lineTo(cx + w / 2, cy - w * 0.2); g.lineTo(cx + w / 2, cy + w * 0.3); g.closePath(); g.fill();
}

/** An arch-topped shape, its springing `w / 2` down from its top. */
function archPath(g, x, y, w, h) {
  g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath();
}

/** The Nietos' mansion's paintings: cream ashlar stucco, the scalloped baby-blue slates, its arched windows (velvet drapes
    tied back with gold, a chandelier glinting inside) and round dormer lights, the grand door under its fanlight, the
    frieze with their name, the pediment's crest, their banner and flag, and the note on the door. */
function mansionArt() {
  if (mansion) return mansion;
  const rnd = seeded(7);
  const st = fine(48, 24, 8);
  st.g.fillStyle = st.lin(0, 0, 0, 24, ['#fffaf0', '#f8eedb', '#f2e4c8']); st.g.fillRect(0, 0, 48, 24);
  for (let r = 0; r < 8; r++) {
    const y = r * 3;
    st.g.fillStyle = 'rgba(150,120,80,0.3)'; st.g.fillRect(0, y + 2.75, 48, 0.25);
    for (let x = (r % 2) * 4; x < 48; x += 8) st.g.fillRect(x, y, 0.25, 3);
    for (let x = (r % 2) * 4; x < 48; x += 8) { st.g.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.25})`; st.g.fillRect(x + 0.5, y + 0.35, 7, 0.45); }
  }
  // slates drawn from the eave up, so each row's scallops lap over the row below
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
  // a tall arched window: a white frame, warm light, a chandelier's glints, velvet drapes tied back in gold
  const wn = fine(16, 30, 8), ws = wn.shine();
  wn.g.fillStyle = '#ffffff'; archPath(wn.g, 0, 0, 16, 30); wn.g.fill();
  wn.g.fillStyle = wn.lin(0, 2, 0, 28, ['#fff6d8', '#ffe2a4', '#ffc878']); archPath(wn.g, 1.6, 1.6, 12.8, 26.8); wn.g.fill();
  ws.fillStyle = '#d8d8d8'; archPath(ws, 1.6, 1.6, 12.8, 26.8); ws.fill();
  for (const [x, y] of [[8, 9.5], [6.2, 10.6], [9.8, 10.6], [5, 11.6], [11, 11.6], [8, 11.8]]) {
    for (const c of [wn.g, ws]) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, 0.55, 0, Math.PI * 2); c.fill(); }
  }
  wn.g.strokeStyle = 'rgba(200,150,60,0.8)'; wn.g.lineWidth = 0.35; wn.g.beginPath(); wn.g.ellipse(8, 10.8, 3.2, 1.1, 0, 0, Math.PI); wn.g.stroke();
  for (const s of [1, -1]) {
    const x0 = s > 0 ? 1.6 : 14.4;
    const drape = (gg) => { gg.beginPath(); gg.moveTo(x0, 7); gg.lineTo(x0 + s * 4.6, 7); gg.quadraticCurveTo(x0 + s * 1.1, 17, x0 + s * 2.8, 28.4); gg.lineTo(x0, 28.4); gg.closePath(); gg.fill(); };
    wn.g.fillStyle = wn.lin(0, 0, 16, 0, s > 0 ? ['#5a96d6', '#9cccf4'] : ['#9cccf4', '#5a96d6']); drape(wn.g);
    ws.fillStyle = '#2a2a2a'; drape(ws);
    wn.rr(s > 0 ? 1.3 : 12.5, 17, 2.2, 1, 0.45, '#f0c040');
  }
  wn.g.fillStyle = '#5a96d6'; wn.g.fillRect(1.6, 6.2, 12.8, 1.4);
  for (let x = 2.4; x < 14.4; x += 1.6) wn.fill('#5a96d6', () => wn.g.arc(x, 7.6, 0.8, 0, Math.PI));
  wn.g.fillStyle = '#f0c040'; wn.g.fillRect(1.6, 6.2, 12.8, 0.35);
  wn.g.strokeStyle = '#ffffff'; wn.g.lineWidth = 0.7;
  wn.g.beginPath(); wn.g.moveTo(8, 1.6); wn.g.lineTo(8, 6.2); for (const a of [0.2, 0.4, 0.6, 0.8]) { wn.g.moveTo(8, 8); wn.g.lineTo(8 - Math.cos(a * Math.PI) * 6.4, 8 - Math.sin(a * Math.PI) * 6.4); } wn.g.stroke();
  // a round dormer light
  const rd = fine(12, 12, 8), rs = rd.shine();
  rd.fill('#ffffff', () => rd.g.arc(6, 6, 6, 0, Math.PI * 2));
  rd.fill(rd.lin(0, 1, 0, 11, ['#fff6d8', '#ffd890']), () => rd.g.arc(6, 6, 4.6, 0, Math.PI * 2));
  rs.fillStyle = '#d8d8d8'; rs.beginPath(); rs.arc(6, 6, 4.6, 0, Math.PI * 2); rs.fill();
  rd.g.strokeStyle = '#ffffff'; rd.g.lineWidth = 0.7; rd.g.beginPath(); rd.g.moveTo(1.4, 6); rd.g.lineTo(10.6, 6); rd.g.moveTo(6, 1.4); rd.g.lineTo(6, 10.6); rd.g.stroke();
  // the grand door: a white arch, a fanlight in it, two tall blue leaves panelled and handled in gold, glass lit above
  const dr = fine(24, 40, 8), ds = dr.shine();
  dr.g.fillStyle = '#ffffff'; archPath(dr.g, 0, 0, 24, 40); dr.g.fill();
  dr.g.fillStyle = dr.lin(0, 2, 0, 12, ['#fff4cc', '#ffd890', '#f0b060']); archPath(dr.g, 2, 2, 20, 11); dr.g.fill();
  ds.fillStyle = '#d0d0d0'; archPath(ds, 2, 2, 20, 11); ds.fill();
  dr.g.strokeStyle = '#ffffff'; dr.g.lineWidth = 0.7; dr.g.beginPath();
  for (const a of [0.17, 0.33, 0.5, 0.67, 0.83]) { dr.g.moveTo(12, 12.4); dr.g.lineTo(12 - Math.cos(a * Math.PI) * 10, 12.4 - Math.sin(a * Math.PI) * 10); }
  dr.g.stroke();
  dr.fill('#f0c040', () => dr.g.arc(12, 12.4, 1.6, Math.PI, 0));
  for (const lx of [2, 12.2]) {
    dr.rr(lx, 13, 9.8, 27, 0.3, dr.lin(lx, 0, lx + 9.8, 0, ['#4a86c4', '#3a70b0', '#2e5e98']));
    dr.rr(lx + 1.6, 15, 6.6, 10, 0.6, dr.lin(0, 15, 0, 25, ['#fff2c8', '#ffd890']));
    ds.fillStyle = '#c0c0c0'; ds.fillRect(lx + 1.6, 15, 6.6, 10);
    dr.g.strokeStyle = '#f0c040'; dr.g.lineWidth = 0.5;
    dr.g.strokeRect(lx + 1.6, 15, 6.6, 10); dr.g.strokeRect(lx + 1.6, 27.5, 6.6, 9.5);
    dr.g.fillStyle = '#ffffff'; dr.g.fillRect(lx + 4.65, 15, 0.5, 10); dr.g.fillRect(lx + 1.6, 19.75, 6.6, 0.5);
    dr.g.fillStyle = '#f0c040'; dr.g.fillRect(lx + 0.6, 37.8, 8.6, 1.6);
  }
  for (const kx of [10.8, 13.4]) dr.fill('#f8d040', () => dr.g.arc(kx, 26.4, 0.9, 0, Math.PI * 2));
  // the frieze over the columns: their name in gold on royal blue, a rosette at each end
  const fz = fine(80, 8, 10);
  fz.g.fillStyle = fz.lin(0, 0, 0, 8, ['#3a6ea8', '#2a5690']); fz.g.fillRect(0, 0, 80, 8);
  fz.g.fillStyle = '#f0c850'; fz.g.fillRect(0, 0.5, 80, 0.45); fz.g.fillRect(0, 7.05, 80, 0.45);
  fz.g.textAlign = 'center'; fz.g.textBaseline = 'middle'; fz.g.font = '900 5px "Trebuchet MS", "Arial Black", sans-serif';
  fz.g.fillStyle = '#ffe48a'; fz.g.fillText('THE  NIETOS', 40, 4.2);
  for (const rx of [8, 72]) {
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; fz.fill('#f0c850', () => fz.g.ellipse(rx + Math.cos(a) * 1.2, 4 + Math.sin(a) * 1.2, 0.9, 0.5, a, 0, Math.PI * 2)); }
    fz.fill('#ffe48a', () => fz.g.arc(rx, 4, 0.8, 0, Math.PI * 2));
  }
  // the pediment's tympanum: baby blue, a gold medallion with the pacifier under a crown, laurels either side
  const tp = fine(60, 15, 10);
  tp.g.fillStyle = tp.lin(0, 0, 0, 15, ['#cfe8fa', '#94c8f0']); tp.g.fillRect(0, 0, 60, 15);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const t = i / 6, lx = 30 + s * (5.5 + t * 13), ly = 11.6 - Math.sin(t * Math.PI * 0.8) * 2.2;
      tp.fill('#e8b840', () => tp.g.ellipse(lx, ly - 0.9, 1.3, 0.55, s * -0.5, 0, Math.PI * 2));
      tp.fill('#d8a030', () => tp.g.ellipse(lx, ly + 0.6, 1.3, 0.55, s * 0.5, 0, Math.PI * 2));
    }
  }
  tp.fill(tp.lin(0, 5, 0, 14, ['#ffe48a', '#e0a830']), () => tp.g.arc(30, 9.6, 4.6, 0, Math.PI * 2));
  tp.fill('#e0f2ff', () => tp.g.arc(30, 9.6, 3.6, 0, Math.PI * 2));
  pacifier(tp.g, 30, 9.9, 1.5, '#3a6ea8', '#e0f2ff');
  crown(tp.g, 30, 4.4, 4, '#f0c040');
  // their banner: baby blue, cut in a swallowtail, a gold border, the crowned pacifier
  const bn = fine(16, 44, 8);
  const tail = (gg) => { gg.beginPath(); gg.moveTo(0, 0); gg.lineTo(16, 0); gg.lineTo(16, 42); gg.lineTo(8, 36); gg.lineTo(0, 42); gg.closePath(); };
  bn.g.fillStyle = bn.lin(0, 0, 16, 0, ['#6aaae4', '#a4d0f4', '#6aaae4']); tail(bn.g); bn.g.fill();
  bn.g.fillStyle = '#3a6ea8'; bn.g.fillRect(0, 0, 16, 4);
  bn.g.strokeStyle = '#f0c040'; bn.g.lineWidth = 0.9;
  bn.g.beginPath(); bn.g.moveTo(1.4, 4); bn.g.lineTo(1.4, 39.4); bn.g.lineTo(8, 34.2); bn.g.lineTo(14.6, 39.4); bn.g.lineTo(14.6, 4); bn.g.stroke();
  crown(bn.g, 8, 11, 6, '#f0c040');
  pacifier(bn.g, 8, 21, 3, '#f8d860', '#5a96d6');
  // the flag on the roof: royal blue over baby blue, the pacifier in gold
  const fl = fine(24, 16, 8);
  fl.g.fillStyle = '#88c4f0'; fl.g.fillRect(0, 0, 24, 16);
  fl.g.fillStyle = '#3a6ea8'; fl.g.fillRect(0, 0, 24, 3); fl.g.fillRect(0, 13, 24, 3);
  pacifier(fl.g, 12, 8.4, 2.1, '#f8d860', '#88c4f0');
  const note = fine(14, 10, 10);
  note.rr(0.5, 0.8, 13, 8.8, 0.4, '#fffbe8');
  note.rr(5, 0.2, 4, 1.4, 0.2, 'rgba(255,240,180,0.85)');
  note.g.textAlign = 'center'; note.g.textBaseline = 'middle';
  note.g.font = '900 5px "Trebuchet MS", "Arial Black", sans-serif'; note.g.fillStyle = '#d83a30'; note.g.fillText('OUT!', 7, 5.6);
  mansion = { stucco: st.c, slates: sh.c, window: wn.c, round: rd.c, door: dr.c, frieze: fz.c, tympanum: tp.c, banner: bn.c, flag: fl.c, note: note.c };
  return mansion;
}

/** The Nietos' house (the user's ask, 2026-10-14; a storybook cottage that day; an extravagant mansion since 2026-10-20,
    the user's ask: "an extravagant aesthetic mansion from the outside and inside"): a white château on a stone terrace,
    two storeys under a mansard of their scalloped baby-blue slates crested in gold, a wing either side and a turret on
    each front corner flying their banner, a portico of white columns with gilt capitals under a pediment carrying their
    crowned pacifier, a carpeted stair up to the fanlit door (a note on it while they're out), golden Kangaskhan on the gate
    piers, a Kangaskhan topiary and baby Linc's gilded pram on the terrace, rose beds behind a gold-tipped iron fence.
    It stands on its 5 x 4 lot, the fence on NIETOS_YARD. */
function nietosHouse(g, x, z, home) {
  const A = mansionArt(), rnd = seeded(11);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const h = new THREE.Group();
  h.position.set(x, 0, z);
  g.add(h);
  const add = (geo, m, px, py, pz, shadow = true, parent = h) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o; };
  const box = (w, hh, d, m, px, py, pz, shadow, parent) => add(new THREE.BoxGeometry(w, hh, d), m, px, py, pz, shadow, parent);
  const cyl = (rt, rb, hh, m, px, py, pz, seg = 16, shadow = true) => add(new THREE.CylinderGeometry(rt, rb, hh, seg), m, px, py, pz, shadow);
  const stucco = std({ map: texOf(A.stucco), roughness: 0.9 }), trim = std({ color: '#ffffff', roughness: 0.6 });
  const gold = std({ color: '#e8b840', metalness: 0.75, roughness: 0.3, emissive: new THREE.Color('#7a4a10'), emissiveIntensity: 0.35 });
  const stone = std({ color: '#e8e2d4', roughness: 1 }), iron = std({ color: '#23262e', roughness: 0.5, metalness: 0.4 });
  const carpet = std({ color: '#3a6ea8', roughness: 1 }), leaf = std({ color: '#3e8a3a', roughness: 1 }), clipped = std({ color: '#2e7a36', roughness: 1 });
  const soil = std({ color: '#6a4a2e', roughness: 1 }), clay = std({ color: '#c87050' });
  const slates = texOf(A.slates);
  slates.wrapS = slates.wrapT = THREE.RepeatWrapping;
  const slate = std({ map: slates, roughness: 0.7 }), lead = std({ color: '#4a80bc', roughness: 0.7 });
  const lit = (canvas, k) => { const m = glowing(std({ map: texOf(canvas), roughness: 0.4, alphaTest: 0.5 }), canvas, null, '#ffd890', k); m.userData.glowMin = 0.15; return m; };
  const win = lit(A.window, 1.1), round = lit(A.round, 1.1);
  const pane = std({ color: '#fff0c0', emissive: new THREE.Color('#ffd890'), roughness: 0.3 });
  pane.userData.glow = 1.2; pane.userData.glowMin = 0.15;
  glowMats.push(pane);
  const quiet = (o) => { o.raycast = () => {}; return o; };   // moves each frame (liveNietos()), so mergeStill() leaves it be

  // the lot: the terrace, the main house in the middle (MW x MD, two storeys, eaves at E), a wing either side (WH tall),
  // a turret on each front corner
  const P = 0.32, MW = 2.5, MD = 2.2, MZ = -0.5, H1 = 1.05, H2 = 0.9, E = P + H1 + H2, mf = MZ + MD / 2;
  const WW = 1.0, WD = 1.8, WZ = -0.5, WH = 1.2, WX = MW / 2 + WW / 2, wf = WZ + WD / 2;
  const TX = 2.2, TZ = wf, TR = 0.3, TH = 2.0;

  // a mansard: four slates sloping in from w0 x d0 to w1 x d1 over hh, the slates sized by the world (UVs in units),
  // so every roof shares one material
  const mansard = (w0, d0, w1, d1, hh, px, py, pz) => {
    const pos = [], uv = [], c0 = [[-w0, d0], [w0, d0], [w0, -d0], [-w0, -d0]], c1 = [[-w1, d1], [w1, d1], [w1, -d1], [-w1, -d1]];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4, len = Math.hypot(c0[j][0] - c0[i][0], c0[j][1] - c0[i][1]) / 2, top = Math.hypot(c1[j][0] - c1[i][0], c1[j][1] - c1[i][1]) / 2;
      const off = (len - top) / 2, slant = Math.hypot(hh, off);
      const v = [[c0[i][0] / 2, 0, c0[i][1] / 2, 0, 0], [c0[j][0] / 2, 0, c0[j][1] / 2, len / 2.8, 0], [c1[j][0] / 2, hh, c1[j][1] / 2, (len - off) / 2.8, slant / 1.7], [c1[i][0] / 2, hh, c1[i][1] / 2, off / 2.8, slant / 1.7]];
      for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(v[k][0], v[k][1], v[k][2]); uv.push(v[k][3], v[k][4]); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    add(geo, slate, px, py, pz);
    box(w1, 0.04, d1, lead, px, py + hh + 0.02, pz);
    return [w1, d1, py + hh + 0.04];
  };
  // gold cresting round a roof's flat top, and a gold ball on each corner
  const spikes = [], balls = [];
  const crest = ([w, d, y], px, pz) => {
    for (const [ax, az, bx, bz] of [[-w, d, w, d], [w, d, w, -d], [w, -d, -w, -d], [-w, -d, -w, d]]) {
      const n = Math.max(2, Math.round(Math.hypot(bx - ax, bz - az) / 2 / 0.12));
      for (let i = 0; i < n; i++) spikes.push([px + (ax + (bx - ax) * i / n) / 2, y + 0.05, pz + (az + (bz - az) * i / n) / 2]);
      balls.push([px + ax / 2, y + 0.06, pz + az / 2]);
    }
  };
  // a window: the arched painting, a white sill under it, a gold keystone over it
  const opening = (wx, wy, wz, w, hh) => {
    add(new THREE.PlaneGeometry(w, hh), win, wx, wy, wz + 0.006, false);
    box(w + 0.1, 0.035, 0.07, trim, wx, wy - hh / 2 - 0.015, wz + 0.035, false);
    box(0.06, 0.07, 0.035, gold, wx, wy + hh / 2 - 0.02, wz + 0.02, false);
  };
  // a dormer on a mansard's front: a lit round window under a slate-roofed hood with a gold ball on it
  const hood = new THREE.CylinderGeometry(0.2, 0.2, 0.36, 14, 1, false, 0, Math.PI);
  hood.rotateZ(Math.PI / 2); hood.rotateY(Math.PI / 2);
  const dormer = (dx, dy, dz) => {
    box(0.34, 0.36, 0.32, trim, dx, dy, dz);
    add(new THREE.CircleGeometry(0.12, 20), round, dx, dy + 0.01, dz + 0.162, false);
    add(hood, slate, dx, dy + 0.17, dz);
    add(new THREE.SphereGeometry(0.035, 10, 8), gold, dx, dy + 0.4, dz + 0.1, false);
  };

  // the terrace: pale stone, a white coping along its front and sides
  box(4.9, P, 3.5, stone, 0, P / 2, -0.1);
  box(4.96, 0.06, 0.1, trim, 0, P - 0.02, 1.66);
  for (const sx of [-1, 1]) box(0.1, 0.06, 3.56, trim, sx * 2.46, P - 0.02, -0.1);

  // the main house: ashlar stucco, white quoins, a belt course between its storeys, a cornice banded in gold
  box(MW, H1 + H2, MD, stucco, 0, P + (H1 + H2) / 2, MZ);
  for (const sx of [-1, 1]) box(0.1, H1 + H2, 0.1, trim, sx * MW / 2, P + (H1 + H2) / 2, mf);
  box(MW + 0.06, 0.07, MD + 0.06, trim, 0, P + H1, MZ);
  box(MW + 0.2, 0.1, MD + 0.2, trim, 0, E - 0.03, MZ);
  box(MW + 0.22, 0.03, MD + 0.22, gold, 0, E + 0.035, MZ, false);
  const top = mansard(MW + 0.14, MD + 0.14, MW - 0.46, MD - 0.46, 0.62, 0, E + 0.05, MZ);
  crest(top, 0, MZ);
  for (const sx of [-1, 1]) dormer(sx * 0.95, E + 0.36, mf - 0.1);
  // two tall chimneys, white with gold bands and terracotta pots; the left one puffs (liveNietos())
  for (const sx of [-1, 1]) {
    const cx = sx * 0.75, cz = MZ - 0.45;
    box(0.26, 0.9, 0.26, trim, cx, E + 0.75, cz);
    box(0.32, 0.06, 0.32, trim, cx, E + 1.2, cz);
    box(0.33, 0.025, 0.33, gold, cx, E + 1.15, cz, false);
    for (const px of [-0.06, 0.06]) cyl(0.04, 0.045, 0.12, clay, cx + px, E + 1.29, cz, 10);
  }
  const SX = -0.81, SY = E + 1.4, SZ = MZ - 0.45;
  const puffGeo = new THREE.SphereGeometry(0.1, 10, 8), puffs = [];
  for (let i = 0; i < 5; i++) puffs.push(quiet(add(puffGeo, std({ color: '#f4f4f4', roughness: 1, transparent: true, opacity: 0, depthWrite: false }), SX, SY, SZ, false)));
  const flags = [];
  // the flag on its gold-tipped pole over the roof
  box(0.03, 0.95, 0.03, gold, 0, top[2] + 0.47, MZ - 0.25);
  add(new THREE.SphereGeometry(0.04, 10, 8), gold, 0, top[2] + 0.97, MZ - 0.25, false);
  const fly = new THREE.Group();
  fly.position.set(0.015, top[2] + 0.78, MZ - 0.25);
  h.add(fly);
  quiet(add(new THREE.PlaneGeometry(0.48, 0.32), std({ map: texOf(A.flag), side: THREE.DoubleSide, roughness: 1 }), 0.24, 0, 0, false, fly));
  flags.push({ o: fly, axis: 'y', k: 0.28 });

  // the wings: a storey of stucco each, a tall window, a cornice, their own mansard and dormer, crested in gold
  for (const sx of [-1, 1]) {
    const wx = sx * WX;
    box(WW, WH, WD, stucco, wx, P + WH / 2, WZ);
    box(WW + 0.12, 0.08, WD + 0.12, trim, wx, P + WH - 0.02, WZ);
    box(WW + 0.14, 0.025, WD + 0.14, gold, wx, P + WH + 0.03, WZ, false);
    const wt = mansard(WW + 0.1, WD + 0.1, WW - 0.3, WD - 0.3, 0.46, wx, P + WH + 0.04, WZ);
    crest(wt, wx, WZ);
    opening(sx * 1.57, P + 0.5, wf, 0.36, 0.78);
    dormer(sx * 1.57, P + WH + 0.24, wf - 0.08);
  }
  // the turrets on the front corners: round, banded, a slate cone with a gold spire, a window low down, a banner high up
  const cone = new THREE.ConeGeometry(TR + 0.1, 0.95, 24), cloth = std({ map: texOf(A.banner), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95 });
  for (const sx of [-1, 1]) {
    const tx = sx * TX;
    cyl(TR, TR, TH, stucco, tx, P + TH / 2, TZ, 24);
    for (const [y, r] of [[P + WH, TR + 0.03], [P + TH - 0.02, TR + 0.05]]) cyl(r, r, 0.08, trim, tx, y, TZ, 24);
    cyl(TR + 0.06, TR + 0.06, 0.025, gold, tx, P + TH + 0.03, TZ, 24, false);
    add(cone, slate, tx, P + TH + 0.52, TZ);
    add(new THREE.SphereGeometry(0.05, 10, 8), gold, tx, P + TH + 1.02, TZ);
    add(new THREE.ConeGeometry(0.025, 0.22, 8), gold, tx, P + TH + 1.16, TZ);
    opening(tx, P + 0.52, TZ + TR - 0.004, 0.24, 0.6);
    box(0.03, 0.03, 0.14, gold, tx, P + TH - 0.14, TZ + TR + 0.06, false);
    const hang = new THREE.Group();
    hang.position.set(tx, P + TH - 0.15, TZ + TR + 0.11);
    h.add(hang);
    quiet(add(new THREE.PlaneGeometry(0.3, 0.82), cloth, 0, -0.41, 0, false, hang));
    flags.push({ o: hang, axis: 'x', k: 0.06 });
  }
  nietosFx = { puffs, x: SX, y: SY, z: SZ, flags };

  // the front: windows either side of the door, three over them, the middle one on a gilt balconette
  for (const sx of [-1, 1]) opening(sx * 0.72, P + 0.5, mf, 0.36, 0.7);
  for (const wx of [-0.72, 0, 0.72]) opening(wx, P + H1 + 0.42, mf, 0.34, 0.6);
  box(0.62, 0.04, 0.2, trim, 0, P + H1 + 0.08, mf + 0.1);
  box(0.62, 0.025, 0.025, gold, 0, P + H1 + 0.34, mf + 0.19, false);
  for (let i = 0; i < 7; i++) box(0.018, 0.24, 0.018, gold, -0.27 + i * 0.09, P + H1 + 0.22, mf + 0.19, false);
  // the door under its white arch, the gold keystone, a lantern either side, a note while they're out
  add(new THREE.PlaneGeometry(0.6, 1.0), lit(A.door, 1), 0, P + 0.5, mf + 0.006, false);
  box(0.08, 0.1, 0.04, gold, 0, P + 1.0, mf + 0.025, false);
  if (!home) quiet(add(new THREE.PlaneGeometry(0.14, 0.1), std({ map: texOf(A.note), roughness: 1 }), 0, P + 0.42, mf + 0.012, false)).rotation.z = 0.08;
  for (const sx of [-1, 1]) {
    box(0.02, 0.02, 0.08, gold, sx * 0.4, P + 0.78, mf + 0.04, false);
    box(0.08, 0.12, 0.08, pane, sx * 0.4, P + 0.74, mf + 0.09);
    add(new THREE.ConeGeometry(0.07, 0.07, 4), gold, sx * 0.4, P + 0.83, mf + 0.09).rotation.y = Math.PI / 4;
  }

  // the portico: four columns, white with gilt bases and capitals, carrying the frieze with their name and the pediment
  const PZ1 = 1.45, PD = PZ1 - mf, CZ = 1.3, cTop = E - 0.14;
  for (const cx of [-1.05, -0.4, 0.4, 1.05]) {
    box(0.2, 0.05, 0.2, trim, cx, P + 0.025, CZ);
    add(new THREE.TorusGeometry(0.08, 0.02, 6, 16), gold, cx, P + 0.07, CZ, false).rotation.x = Math.PI / 2;
    cyl(0.068, 0.08, cTop - P - 0.16, trim, cx, (cTop + P) / 2 + 0.02, CZ, 14);
    cyl(0.11, 0.07, 0.1, gold, cx, cTop - 0.08, CZ, 14);
    box(0.22, 0.035, 0.22, trim, cx, cTop - 0.015, CZ);
  }
  const frieze = std({ map: texOf(A.frieze), roughness: 0.6 });
  box(MW + 0.1, 0.24, PD + 0.02, [trim, trim, trim, trim, frieze, trim], 0, E - 0.02, mf + PD / 2);
  box(MW + 0.12, 0.025, 0.025, gold, 0, E - 0.135, PZ1 + 0.012, false);
  const PW = MW / 2 + 0.08, PR = 0.5, PY = E + 0.1;
  const tri = new THREE.Shape([new THREE.Vector2(-PW, 0), new THREE.Vector2(PW, 0), new THREE.Vector2(0, PR)]);
  add(new THREE.ExtrudeGeometry(tri, { depth: PD, bevelEnabled: false }), trim, 0, PY, mf);
  const ty = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-PW + 0.16, 0.05), new THREE.Vector2(PW - 0.16, 0.05), new THREE.Vector2(0, PR - 0.07)]));
  const tuv = ty.attributes.uv, tpos = ty.attributes.position;
  for (let i = 0; i < tuv.count; i++) tuv.setXY(i, (tpos.getX(i) + PW) / (2 * PW), tpos.getY(i) / PR);
  add(ty, std({ map: texOf(A.tympanum), roughness: 0.7 }), 0, PY, PZ1 + 0.004, false);
  const rake = Math.atan2(PR, PW), RL = Math.hypot(PW, PR) + 0.12;
  for (const sx of [-1, 1]) {
    const r = box(RL, 0.06, PD + 0.1, lead, sx * PW / 2, PY + PR / 2 + 0.05, mf + PD / 2 + 0.02);
    r.rotation.z = -sx * rake;
    const c = box(RL, 0.07, 0.07, trim, sx * PW / 2, PY + PR / 2 + 0.01, PZ1 + 0.04, false);
    c.rotation.z = -sx * rake;
    add(new THREE.SphereGeometry(0.05, 10, 8), gold, sx * (PW + 0.02), PY + 0.07, PZ1 + 0.04, false);
  }
  box(PW * 2 + 0.12, 0.06, 0.08, trim, 0, PY - 0.01, PZ1 + 0.03, false);
  add(new THREE.SphereGeometry(0.06, 12, 10), gold, 0, PY + PR + 0.1, PZ1 + 0.02, false);
  add(new THREE.ConeGeometry(0.035, 0.14, 8), gold, 0, PY + PR + 0.2, PZ1 + 0.02, false);

  // the grand stair: four steps, the carpet down them on gold rods, white cheeks with a lantern on each, and the
  // carpet on across the portico to the door
  const SW = 1.3, SN = 4, SD = 0.13, S0 = 1.65;
  for (let k = 0; k < SN; k++) {
    const sh = P * (SN - k) / SN, sz = S0 + SD * (k + 0.5);
    box(SW, sh, SD + 0.002, stone, 0, sh / 2, sz);
    box(0.62, 0.012, SD, carpet, 0, sh + 0.006, sz, false);
    add(new THREE.CylinderGeometry(0.008, 0.008, 0.68, 6), gold, 0, sh + 0.014, sz - SD / 2 + 0.01, false).rotation.z = Math.PI / 2;
  }
  box(0.62, 0.012, S0 - mf, carpet, 0, P + 0.006, (S0 + mf) / 2, false);
  for (const sx of [-1, 1]) {
    box(0.022, 0.014, S0 - mf, gold, sx * 0.32, P + 0.008, (S0 + mf) / 2, false);
    const cx = sx * (SW / 2 + 0.08);
    box(0.16, P + 0.12, SN * SD + 0.02, trim, cx, (P + 0.12) / 2, S0 + SN * SD / 2);
    cyl(0.025, 0.03, 0.4, iron, cx, P + 0.32, S0 + SN * SD - 0.08, 8);
    box(0.1, 0.14, 0.1, pane, cx, P + 0.58, S0 + SN * SD - 0.08);
    add(new THREE.ConeGeometry(0.085, 0.08, 4), gold, cx, P + 0.69, S0 + SN * SD - 0.08).rotation.y = Math.PI / 4;
  }

  // the terrace's balustrade, either side of the stair
  const balusters = [];
  for (const sx of [-1, 1]) {
    const x0 = 0.82, x1 = 2.38, z = 1.58;
    box(x1 - x0, 0.04, 0.08, trim, sx * (x0 + x1) / 2, P + 0.28, z);
    box(x1 - x0, 0.03, 0.07, trim, sx * (x0 + x1) / 2, P + 0.03, z, false);
    for (let bx = x0 + 0.08; bx < x1 - 0.04; bx += 0.1) balusters.push([sx * bx, P + 0.155, z]);
    for (const px of [x0 + 0.02, x1]) {
      box(0.09, 0.34, 0.09, trim, sx * px, P + 0.17, z);
      add(new THREE.SphereGeometry(0.04, 10, 8), gold, sx * px, P + 0.38, z, false);
    }
  }
  // on the terrace: a Kangaskhan clipped in box on the left, baby Linc's gilded pram on the right, a ball tree in a gold
  // urn by each turret
  const kanga = (px, py, pz, s, ry, m) => {
    const k = new THREE.Group();
    k.position.set(px, py, pz); k.scale.setScalar(s); k.rotation.y = ry;
    h.add(k);
    const part = (geo, qx, qy, qz) => add(geo, m, qx, qy, qz, true, k);
    for (const lx of [-1, 1]) part(new THREE.CylinderGeometry(0.11, 0.13, 0.3, 10), lx * 0.16, 0.15, 0.02);
    part(new THREE.SphereGeometry(0.3, 16, 12), 0, 0.55, 0).scale.set(1, 1.25, 0.9);
    part(new THREE.SphereGeometry(0.17, 14, 10), 0, 0.45, 0.2).scale.set(1.1, 0.8, 0.6);
    part(new THREE.SphereGeometry(0.085, 12, 10), 0, 0.57, 0.26);
    part(new THREE.SphereGeometry(0.17, 14, 12), 0, 0.98, 0.04).scale.set(1, 0.95, 1.05);
    part(new THREE.SphereGeometry(0.1, 12, 10), 0, 0.94, 0.17).scale.set(1.1, 0.8, 1);
    for (const lx of [-1, 1]) {
      part(new THREE.ConeGeometry(0.05, 0.14, 8), lx * 0.1, 1.13, -0.01).rotation.z = -lx * 0.35;
      const arm = part(new THREE.CapsuleGeometry(0.05, 0.18, 4, 8), lx * 0.27, 0.66, 0.12);
      arm.rotation.x = -0.9; arm.rotation.z = lx * 0.3;
    }
    part(new THREE.ConeGeometry(0.11, 0.42, 10), 0, 0.24, -0.3).rotation.x = -1.2;
    return k;
  };
  kanga(-1.7, P, 1.05, 0.5, 0.3, clipped);
  const pram = new THREE.Group();
  pram.position.set(1.7, P, 1.05); pram.rotation.y = -0.5; pram.scale.setScalar(1.1);
  h.add(pram);
  const baby = std({ color: '#8cc8f8' });
  const pp = (geo, m, px, py, pz) => add(geo, m, px, py, pz, true, pram);
  pp(new THREE.BoxGeometry(0.4, 0.16, 0.24), baby, 0, 0.22, 0);
  pp(new THREE.BoxGeometry(0.42, 0.03, 0.26), gold, 0, 0.31, 0);
  pp(new THREE.SphereGeometry(0.13, 14, 8, 0, Math.PI, 0, Math.PI / 2), std({ color: '#ffffff', side: THREE.DoubleSide }), -0.07, 0.31, 0).rotation.y = -Math.PI / 2;
  for (const wx of [-0.13, 0.13]) for (const wz of [-0.13, 0.13]) pp(new THREE.TorusGeometry(0.06, 0.014, 6, 16), gold, wx, 0.075, wz);
  pp(new THREE.BoxGeometry(0.02, 0.24, 0.02), gold, 0.24, 0.4, 0).rotation.z = -0.5;
  pp(new THREE.BoxGeometry(0.03, 0.03, 0.26), gold, 0.3, 0.5, 0);
  for (const sx of [-1, 1]) {
    const ux = sx * 2.2, uz = 1.2;
    cyl(0.1, 0.07, 0.16, gold, ux, P + 0.08, uz, 14);
    cyl(0.12, 0.12, 0.03, gold, ux, P + 0.17, uz, 14, false);
    cyl(0.015, 0.015, 0.14, soil, ux, P + 0.25, uz, 6, false);
    add(new THREE.SphereGeometry(0.17, 14, 10), clipped, ux, P + 0.44, uz);
  }

  // the front garden: a rose bed each side of the walk, edged in clipped box, behind an iron fence tipped in gold, its
  // gate piers carrying golden Kangaskhan
  const tufts = [], blooms = [];
  for (const sx of [-1, 1]) {
    const b0 = 0.92, b1 = 2.32, z0 = 1.78, z1 = 2.44;
    box(b1 - b0, 0.04, z1 - z0, soil, sx * (b0 + b1) / 2, 0.02, (z0 + z1) / 2, false);
    box(b1 - b0 + 0.1, 0.13, 0.08, clipped, sx * (b0 + b1) / 2, 0.065, z0 - 0.04);
    box(b1 - b0 + 0.1, 0.13, 0.08, clipped, sx * (b0 + b1) / 2, 0.065, z1 + 0.04);
    for (const ex of [b0, b1]) box(0.08, 0.13, z1 - z0, clipped, sx * ex, 0.065, (z0 + z1) / 2);
    add(new THREE.ConeGeometry(0.14, 0.5, 14), clipped, sx * (b0 + b1) / 2, 0.29, (z0 + z1) / 2);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
      const fx = sx * (b0 + 0.12 + i * 0.235 + (rnd() - 0.5) * 0.05), fzz = z0 + 0.12 + j * 0.21 + (rnd() - 0.5) * 0.04;
      if (Math.abs(Math.abs(fx) - (b0 + b1) / 2) < 0.18 && Math.abs(fzz - (z0 + z1) / 2) < 0.18) continue;
      tufts.push([fx, 0.08, fzz]);
      blooms.push([fx, 0.15 + rnd() * 0.04, fzz, BLOOMS[Math.floor(rnd() * BLOOMS.length)]]);
    }
  }
  const FZ = 2.62, bars = [];
  for (const sx of [-1, 1]) {
    box(0.3, 0.75, 0.3, stone, sx * 0.7, 0.375, FZ);
    box(0.36, 0.06, 0.36, trim, sx * 0.7, 0.78, FZ);
    box(0.37, 0.025, 0.37, gold, sx * 0.7, 0.74, FZ, false);
    kanga(sx * 0.7, 0.81, FZ, 0.36, -sx * 0.25, gold);
    box(0.14, 0.62, 0.14, stone, sx * 2.42, 0.31, FZ);
    add(new THREE.SphereGeometry(0.06, 10, 8), gold, sx * 2.42, 0.68, FZ, false);
    const runs = [[0.85, FZ, 2.35, FZ], [2.42, FZ - 0.07, 2.42, 1.72]];
    for (const [ax, az, bx, bz] of runs) {
      const len = Math.hypot(bx - ax, bz - az), n = Math.round(len / 0.09);
      for (const y of [0.08, 0.5]) box(Math.abs(bx - ax) + 0.025, 0.025, Math.abs(bz - az) + 0.025, iron, sx * (ax + bx) / 2, y, (az + bz) / 2, false);
      for (let i = 0; i <= n; i++) bars.push([sx * (ax + (bx - ax) * i / n), (az + (bz - az) * i / n)]);
    }
  }
  const at = new THREE.Object3D();
  const many = (geo, m, list, shadow, sy = 1) => {
    const im = new THREE.InstancedMesh(geo, m, list.length);
    list.forEach(([px, py, pz, c], i) => {
      at.position.set(px, py, pz); at.rotation.set(0, 0, 0); at.scale.set(1, sy, 1); at.updateMatrix();
      im.setMatrixAt(i, at.matrix);
      if (typeof c === 'string') im.setColorAt(i, new THREE.Color(c));
    });
    im.castShadow = shadow; im.receiveShadow = true;
    h.add(im);
  };
  many(new THREE.BoxGeometry(0.018, 0.5, 0.018), iron, bars.map(([px, pz]) => [px, 0.29, pz]), true);
  const tip = new THREE.ConeGeometry(0.022, 0.07, 6);
  many(tip, gold, bars.map(([px, pz]) => [px, 0.57, pz]), false);
  const spike = new THREE.ConeGeometry(0.018, 0.09, 6);
  many(spike, gold, spikes, false);
  many(new THREE.SphereGeometry(0.035, 8, 6), gold, balls, false);
  many(new THREE.CylinderGeometry(0.016, 0.024, 0.21, 8), trim, balusters, true);
  many(new THREE.SphereGeometry(0.075, 8, 6), leaf, tufts, false, 0.7);
  many(new THREE.SphereGeometry(0.042, 8, 6), std({ color: '#ffffff', roughness: 0.7 }), blooms, false);
  mergeStill(h);
}

/** The Nietos' moving parts: the chimney's puffs rising, swelling and fading in turn, the banners and the flag stirring. */
function liveNietos(now) {
  if (!nietosFx) return;
  const n = nietosFx.puffs.length;
  nietosFx.puffs.forEach((o, i) => {
    const t = calm ? (i + 0.5) / n : (now / 3600 + i / n) % 1;
    o.position.set(nietosFx.x + t * 0.3 + Math.sin(t * 6 + i) * 0.04, nietosFx.y + t * 1.0, nietosFx.z - t * 0.1);
    o.scale.setScalar(0.55 + t * 1.5);
    o.material.opacity = 0.6 * Math.sin(Math.PI * t);
  });
  nietosFx.flags.forEach((f, i) => { f.o.rotation[f.axis] = calm ? 0 : Math.sin(now / (f.axis === 'y' ? 700 : 1100) + i * 2) * f.k; });
}

/** The Nietos' name board, front left of their garden, turned to the walk; tapped, it reads out (the user's ask,
    2026-10-14). White on deep blue, so it reads (pale blue on sky blue couldn't), in a gilt frame since the house became a
    mansion, on two white posts capped in gold that stand at its ends behind it. Its own place, so the house's merged
    meshes don't swallow the tap. */
function nietosSign(g, x, z) {
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const s = new THREE.Group();
  s.position.set(x, 0, z); s.rotation.y = 0.3;
  g.add(s);
  const art = fine(38, 16, 10);
  art.rr(0.2, 0.2, 37.6, 15.6, 2, art.lin(0, 0, 0, 16, ['#fbe08a', '#e0ac38', '#a87818']));
  art.rr(1.6, 1.6, 34.8, 12.8, 1.2, art.lin(0, 0, 0, 16, ['#2c5a94', '#234a7e', '#183660']));
  art.g.strokeStyle = 'rgba(248,220,120,0.85)'; art.g.lineWidth = 0.35; art.g.strokeRect(2.6, 2.6, 32.8, 10.8);
  art.g.textAlign = 'center'; art.g.textBaseline = 'middle';
  art.g.font = '900 5.6px "Trebuchet MS", "Arial Black", sans-serif'; art.g.fillStyle = '#ffffff'; art.g.fillText('THE NIETOS', 19, 8.3);
  const b = board(art.c, 0, 0, { s: 0.66, shadow: false });
  const { width: W, height: H } = b.geometry.parameters, Y = 0.8, RY = Y + H / 2 + 0.04;
  b.position.y = Y;
  s.add(b);
  const add = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; s.add(o); };
  const white = std({ color: '#ffffff', roughness: 0.6 }), gold = std({ color: '#e8b840', metalness: 0.75, roughness: 0.3, emissive: new THREE.Color('#7a4a10'), emissiveIntensity: 0.35 });
  for (const sx of [-1, 1]) {
    add(new THREE.BoxGeometry(0.07, RY, 0.07), white, sx * (W / 2 - 0.06), RY / 2, -0.05);
    add(new THREE.SphereGeometry(0.05, 10, 8), gold, sx * (W / 2 - 0.06), RY + 0.05, -0.05);
  }
  return [s, W + 0.14, RY + 0.1];
}

/** Kurt's Workshop (docs/roadmap.md's Towns step 6, session 3): a timber workshop on a stone footing under a mossy
    shingle roof, wide double doors, a lit window either side, its signboard (KURT'S WORKSHOP over an Apricorn) on the
    gable, logs stacked by one wall and an Apricorn tree, its fruit in the five colours, by the other. Shown only while
    the towns are on. Shut (`open` false, till the Nietos send you): its windows dark and two planks across the doors. */
function kurtWorkshop(g, x, z, open = true) {
  const W = 2.5, D = 2, H = 1.3, FY = 0.18, E = FY + H, R = 0.9, fz = D / 2;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const h = new THREE.Group();
  h.position.set(x, 0, z);
  g.add(h);
  const add = (geo, m, px, py, pz, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = shadow; o.receiveShadow = true; h.add(o); return o; };
  const box = (w, hh, d, m, px, py, pz, shadow) => add(new THREE.BoxGeometry(w, hh, d), m, px, py, pz, shadow);
  const beam = std({ color: '#4a2e18' }), wall = std({ color: '#c8925a' }), stone = std({ color: '#9a948a', roughness: 1 });
  const roof = std({ color: '#5a6a3a', roughness: 0.9 }), door = std({ color: '#7a4a24' });
  const pane = open ? std({ color: '#fff0c0', emissive: new THREE.Color('#ffc870'), roughness: 0.3 }) : std({ color: '#2a3038', roughness: 0.3 });
  if (open) { pane.userData.glow = 1.2; pane.userData.glowMin = 0.15; glowMats.push(pane); }

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
  if (!open) for (const [py, rz] of [[0.62, 0.32], [0.38, -0.28]]) box(1.08, 0.1, 0.04, std({ color: '#9a6a3a' }), 0, FY + py, fz + 0.1).rotation.z = rz;
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
  mergeStill(h);
}

/** `root`'s still meshes that share a material (and shadow) baked into one mesh each: the Nietos' house is ~110 small
    pieces, and every draw call counts on a phone's GPU (2026-10-14). Animated ones (their own raycast) are left be, or
    those `live(mesh)` names (js/event-3d.js's Depths camp, where the untappable still pieces merge too and stay untappable).
    The merged meshes receive shadows unless `keepReceive`, which keeps each piece's own (the mall's Poké Balls take none). */
export function mergeStatic(root, live = null, keepReceive = false) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), sets = new Map();
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || (live ? live(o) : o.raycast !== THREE.Mesh.prototype.raycast)) return;
    const k = o.material.uuid + (o.castShadow ? '+' : '-') + (o.raycast === THREE.Mesh.prototype.raycast ? '' : 'x') + (keepReceive && !o.receiveShadow ? 'r' : '');
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
    m.castShadow = list[0].castShadow; m.receiveShadow = !keepReceive || list[0].receiveShadow;
    if (list[0].raycast !== THREE.Mesh.prototype.raycast) m.raycast = list[0].raycast;
    root.add(m);
    for (const o of list) { o.removeFromParent(); o.geometry.dispose(); }
  }
}

/** A mesh of many materials as one mesh a material, in its place. */
export function byFace(o) {
  const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, n = geo.attributes.position.count, sets = new Map();
  for (const r of geo.groups.length ? geo.groups : [{ start: 0, count: n, materialIndex: 0 }]) {
    if (!o.material[r.materialIndex]) continue;
    if (!sets.has(r.materialIndex)) sets.set(r.materialIndex, []);
    sets.get(r.materialIndex).push([r.start, Math.min(n, r.start + r.count)]);
  }
  for (const [i, runs] of sets) {
    const part = new THREE.BufferGeometry();
    for (const [name, a] of Object.entries(geo.attributes)) {
      const k = a.itemSize, arr = new a.array.constructor(runs.reduce((s, [s0, s1]) => s + (s1 - s0), 0) * k);
      let at = 0;
      for (const [s0, s1] of runs) { arr.set(a.array.subarray(s0 * k, s1 * k), at); at += (s1 - s0) * k; }
      part.setAttribute(name, new THREE.BufferAttribute(arr, k, a.normalized));
    }
    const m = new THREE.Mesh(part, o.material[i]);
    m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.scale.copy(o.scale);
    m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; m.raycast = o.raycast;
    o.parent.add(m);
  }
  if (geo !== o.geometry) geo.dispose();
  o.geometry.dispose();
  o.removeFromParent();
}

/** mergeStatic() and fewer draws yet, for a group whose meshes stand still (the Clearing's draw calls, 2026-10-18: ~480
    a frame on the plaza, the most of any place): a many-faced box split by its faces, plain colours baked onto the
    vertices (bakeColours()), then one mesh a material. Each part is cut to bend first (bendFine()), as a joined one no
    longer is. What `live(mesh)` names (by default, as mergeStatic(), a mesh with a raycast of its own) is left be. */
export function mergeStill(root, live = null, keepReceive = false) {
  const skip = live || ((o) => o.raycast !== THREE.Mesh.prototype.raycast);
  const parts = [];
  root.traverse(o => { if (o.isMesh && !o.isInstancedMesh && !skip(o)) parts.push(o); });
  for (const o of parts) {
    if (CURVE) bendFine(o);
    if (Array.isArray(o.material)) byFace(o);
    const m = o.material;
    if (!Array.isArray(m) && m.isMeshStandardMaterial && !m.map && !m.transparent && !m.emissive.getHex()) m.roughness = Math.round(m.roughness * 4) / 4;   // 0.8 and 0.85 look the same and were a draw each
  }
  bakeColours(root, skip);
  mergeStatic(root, live, keepReceive);
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
let cutscene = false;   // your partner walked by the scene (up to the Waystone as it mends, homeNews()): taps wait

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

/** What the Clearing has to tell you as you come home (step 7, the Nietos' questline): any of them beaten at the Gym, Law and Britt
    slide in once to send you to their notice on the quest board (takeQuest() opens the questline); once they've put its
    shard in, the stone lights. */
let homeNewsBusy = false;
async function homeNews() {
  if (homeNewsBusy || held || !townsOpen()) return;
  const save = getSave(), st = townState(save, 'clearing');
  const greet = !st.quest && !st.called && nietosHome(friendWins(save, 'nietos')) && !clearingLit(save);
  const mend = !!st.quest?.lit && !st.quest.welcomed;
  if (!greet && !mend) return;
  homeNewsBusy = true;
  try {
    await new Promise(r => setTimeout(r, calm ? 200 : 900));
    if (!running || held) return;
    playSound('gate-hum');
    if (greet) {   // only a pointer to their notice (the user's ask, 2026-10-14): the board starts the questline
      const { gymTalk } = await import('./gym.js');
      await gymTalk(GYM_BY_ID.nietos, QUESTS.clearing.call.nietos, { lit: true });
      heardCall('clearing');
      const p = running && !held && !entering && places.find(q => q.id === 'quests');
      if (p) { arriving = false; goTo(p); }   // your partner walks you over to it (cutting short its walk in, so its card shows there)
      return;
    }
    welcomeHome('clearing');
    const glow = '#9fe0ff';
    // out of the Nietos' house the stone was off the screen (the user's ask, 2026-10-14): your partner walks up to it
    // first, the view following, and faces it as it wakes
    cutscene = true;
    hideCard();
    walker.path = route(walker.tile, SPAWN); aim = null;
    for (const t0 = performance.now(); running && walker.path.length && performance.now() - t0 < 9000;) await new Promise(r => setTimeout(r, 50));
    if (!running) return;
    walker.path = [];
    walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
    await new Promise(r => setTimeout(r, calm ? 0 : 350));
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
  } finally { homeNewsBusy = false; cutscene = false; questMarks(); }
}

/** Where the quest board stands: `locked` till Law, Britt or the Nietos are beaten, `new` with their notice to read, `on` (`ready` to
    hand in) through their questline, then `towns`, every town's questline under way. */
function boardNow(save) {
  const st = townState(save, 'clearing');
  if (!st.quest && !clearingLit(save)) {
    return nietosHome(friendWins(save, 'nietos'))
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
  if (nietosMark) nietosMark.visible = !!b.ready || (asking('nietos', heartsOf(workshopOf(getSave()), 'nietos')) && favourOf(getSave(), 'nietos').ready);   // their own request too (js/data/favours.js)
}

/** The Nietos' notice read off the board: their story, and their questline opens, its steps then handed in at their house. */
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
function questBoard(x, z, turn) {
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const s = new THREE.Group();
  s.position.set(x, 0, z); s.rotation.y = turn;
  const face = board(questBoardArt(), 0, 0, { s: 0.62, shadow: false });
  const { width: W, height: H } = face.geometry.parameters, Y = 0.55, RY = Y + H + 0.04;
  face.position.y = Y + H / 2;
  s.add(face);
  const add = (geo, m, px, py, pz) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; s.add(o); return o; };
  const wood = std({ color: '#7a5230' }), roof = std({ color: '#b8483a' });
  for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.045, 0.05, RY, 6), wood, sx * (W / 2 + 0.02), RY / 2, -0.05);
  add(new THREE.BoxGeometry(W + 0.1, 0.07, 0.1), wood, 0, Y - 0.02, -0.02);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(W / 2 + 0.2, 0.05, 0.34), roof, sx * (W / 4 + 0.04), RY + 0.13, -0.03).rotation.z = -sx * 0.32;
  mergeStill(s);
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
      // right of the avenue before the gate, the Berry Booth across the road from it
      build: (g) => pokestop(g, 'trail', tileX(STOP_AT.tx) - ROADSIDE, tileZ(STOP_AT.ty) - 0.2, 0.7, !!run, 'SET OUT'),
    },
    {
      id: 'base', name: 'Secret Base', step: { x: TREE_AT.tx, y: TREE_AT.ty + 1 }, tiles: [...rect(TREE_AT.tx - 3, TREE_AT.ty - 2, TREE_AT.tx + 3, TREE_AT.ty - 1), ...rect(TREE_AT.tx - 3, TREE_AT.ty, ARCH_AT.tx - 1, TREE_AT.ty)], tag: [TREE_AT.tx, 3.2, TREE_AT.ty], open: true,
      line: lotLine(),
      buttons: [[baseOwned() ? 'Go in' : 'Unlock', baseOwned() ? enterBase : buyBase]],
      build: (g) => buildLot(g, lotNow()),
    },
    {
      // the backyard's garden arch: brambles and a padlock till it's bought, here or on the PC's blueprint (js/hub-arch.js)
      id: 'backyard', name: yardOwned() ? 'Backyard' : 'Garden Arch', step: { x: ARCH_AT.tx, y: ARCH_AT.ty + 1 }, tiles: [[ARCH_AT.tx, ARCH_AT.ty]], tag: [ARCH_AT.tx + ARCH_X, 2.9, ARCH_AT.ty], open: true,
      line: yardOwned() ? `Through the garden arch beside ${lotWord(save)}: your backyard.`
        : `An old garden arch beside ${lotWord(save)}, choked with brambles, its gate padlocked. ${baseOwned() ? `${YARD_PRICE.toLocaleString()} PokéCoins clears it into a backyard of your own.` : `Make ${lotWord(save)} your Secret Base first.`}`,
      buttons: yardOwned() ? [['Go in', enterYard]] : baseOwned() ? [['Unlock', buyYardArch]] : [],
      build: (g) => {
        const L = leavesOf(SEASON), owned = yardOwned();
        gardenArch = { ...makeGardenArch(THREE, { x: tileX(ARCH_AT.tx) + ARCH_X, z: tileZ(ARCH_AT.ty), owned, leaf: L ? L.trees[0] : P.trees, winter: SEASON === 'winter', merge: mergeStill }), owned };
        glowMats.push(...gardenArch.glows);
        g.add(gardenArch.group);
      },
    },
    ...(housesOpen() ? [{
      // the Timburr crew's stand beside the lot (houses on): its catalogue tries a house on the lot before you pay
      id: 'kiosk', name: 'Timburr & Co.', step: { x: KIOSK_AT.tx, y: KIOSK_AT.ty + 1 }, tiles: [[KIOSK_AT.tx, KIOSK_AT.ty]], tag: [KIOSK_AT.tx, 2.6, KIOSK_AT.ty], open: true,
      line: baseOwned() ? 'Timburr & Co., builders. Their catalogue builds a new house on your lot, tried on before you buy, and repaints the one you have.'
        : `Timburr & Co., builders. FOR SALE: the lot beside them, a Starter Cottage on it. ${BASE_PRICE.toLocaleString()} PokéCoins makes it your Secret Base.`,
      buttons: [['Catalogue', openKiosk]],
      build: (g) => buildKiosk(g),
    }] : []),
    {
      // right of the plaza, where your partner starts (2026-10-09): who lives in the base, your name
      id: 'pc', name: 'PC', step: { x: PC_AT.tx, y: PC_AT.ty + 1 }, tiles: [[PC_AT.tx, PC_AT.ty]], tag: [PC_AT.tx, 2.6, PC_AT.ty], open: true,
      get line() { return `${unclaimed().length ? 'You\'ve got mail! ' : claimable() ? 'A mission reward is waiting! ' : pcBeckons(getSave()) ? (patchUnseen() ? 'New patch notes! ' : 'Something new on the PC! ') : ''}A PC. Your mail, your missions, the patch notes, who lives in your Secret Base, and your name.`; },
      buttons: [['Log on', openPc]],
      build: (g) => {
        const pc = pcModel(THREE, glowMats);
        mergeStill(pc);
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
    {
      // the Buddy Projector (the user's ask, 2026-10-22): a device of its own for picking who walks with you
      id: 'holo', name: 'Buddy Projector', step: { x: HOLO_AT.tx, y: HOLO_AT.ty + 1 }, tiles: [[HOLO_AT.tx, HOLO_AT.ty]], tag: [HOLO_AT.tx, 2.4, HOLO_AT.ty], open: true,
      get line() { return `A hologram of ${buddy(getSave()).name}, your walking buddy. Pick another to walk with you.`; },
      buttons: [['Change buddy', openProjector]],
      build: (g) => {
        holo = makeHolo(THREE, PITCH);
        mergeStill(holo.stand);
        holo.group.position.set(tileX(HOLO_AT.tx), 0, tileZ(HOLO_AT.ty));
        holo.show(buddy(getSave()));
        g.add(holo.group);
      },
    },
  ];
  if (cloudConfigured()) list.push({
    id: 'plaza', name: 'Trainer Plaza', step: PLAZA_AT.step, tiles: PLAZA_AT.tiles, tag: [PLAZA_AT.at[0], 3.8, PLAZA_AT.at[1]], open: true,
    line: cloudRemembered() ? 'The Trainer Plaza\'s board: Polaroids of trainers who\'ve played lately. Add one from your Pokédex\'s Trainers app.'
      : 'The Trainer Plaza\'s board, where trainers pin themselves up. Sign in at the PC to join them.',
    buttons: [['Look', () => acts.onApp('trainers', 'plaza')]],
    build: (g) => {
      plazaFx = plazaBoard(THREE, { glows: glowMats, merge: mergeStill });
      plazaFx.group.position.set(tileX(PLAZA_AT.at[0]), 0, tileZ(PLAZA_AT.at[1]));
      plazaFx.group.rotation.y = facePlaza(PLAZA_AT.at);
      plazaFx.group.scale.setScalar(1.1);   // between the avenue's edge and the PC
      g.add(plazaFx.group);
      const fx = plazaFx;
      plazaTop(6).then(list => { if (plazaFx === fx) fx.paint(list); });
    },
  });
  const safari = safariOpen(save) || !!runAt('safari'), safariRun = runAt('safari');
  // you walk right up to the gate (MEADOW), where a small Pokéstop of its own starts or continues the day's run
  // (the user's ask, 2026-10-09)
  // only the Pokéstops start or continue a run (the user's call, 2026-10-09): a tap on the gate or the Pillar itself just
  // walks up and says what it is
  list.push({
    id: 'safari-gate', name: 'Safari Zone', step: { x: SAFARI_AT.tx, y: SAFARI_AT.ty + 1 }, tiles: [], tag: [SAFARI_AT.tx, 4, SAFARI_AT.ty], open: safari,
    line: safari ? `${readyTasks(save).length ? 'Ranger tasks are ready to claim at the Safari Outfitter in the Poké Mall! ' : ''}Today's Safari Zone run, the same for everyone. Spin the Pokéstop to set out.`
      : `The Safari Zone opens once you've beaten every Pokémon in all three biomes. ${safariUnlockProgress(save)}`,
    reset: safari && 'daily',
    buttons: [],
    // back in the left corner, out on the meadow, its fence across it; a real model since 2026-10-15 (js/hub-safari.js)
    build: (g) => {
      const x = tileX(SAFARI_AT.tx), z = tileZ(SAFARI_AT.ty);
      safariFx = safariGate(THREE, { open: safari, glows: glowMats });
      safariFx.group.position.set(x, 0, z);
      for (const l of lamps) if (l.userData.id === 'safari') l.userData.k = safari ? 0.8 : 0;   // its torches, unlit while it's shut
      g.add(safariFx.group);
      // a "!" over the gate while a Ranger task waits to be claimed at the Outfitter (js/ranger.js; 2026-10-16)
      safariMark = board(newsArt(), x, z + 0.1, { shadow: false });
      safariMark.rotation.x = -PITCH;
      safariMark.userData.y = 4.4;
      safariMark.visible = safari && readyTasks(save).length > 0;
      g.add(safariMark);
      safariFence(g, tileX(-MW + 0.5), x - WING_X, z);
      safariFence(g, x + WING_X, tileX(SAFARI_AT.tx + 4.6), z);   // past the ranks board, to the main gate's fence
    },
  });
  if (safari) list.push({
    // three tiles left of the gate, like the main gate's three right of it: one tile off, it stood in the 3D gate's mouth
    id: 'safari', name: 'Safari Pokéstop', step: { x: SAFARI_AT.tx - 3, y: SAFARI_AT.ty + 2 }, tiles: [[SAFARI_AT.tx - 3, SAFARI_AT.ty + 1]], tag: [SAFARI_AT.tx - 3, 2.6, SAFARI_AT.ty + 1], open: true,
    line: safariRun ? waits(safariRun) : 'Today\'s Safari Zone run, the same for everyone. Only the first try counts.',
    reset: 'daily',
    buttons: safariRun ? [['Continue', () => acts.onContinue(safariRun)], ['New game', acts.onSafari]] : [['Enter', acts.onSafari]],
    build: (g) => pokestop(g, 'safari', tileX(SAFARI_AT.tx - 3), tileZ(SAFARI_AT.ty + 1), 0.5, !!safariRun, 'EXPLORE'),
  });
  // three tiles right of the gate, the Pokéstop's mirror, where the trail from the ring road turns west to it (the user's
  // ask, 2026-10-15)
  list.push({
    id: 'safari-board', name: 'Safari Ranks', step: { x: SAFARI_AT.tx + 3, y: SAFARI_AT.ty + 2 }, tiles: [[SAFARI_AT.tx + 3, SAFARI_AT.ty + 1]], tag: [SAFARI_AT.tx + 3, 2.6, SAFARI_AT.ty + 1], open: safari,
    line: safari ? 'The Safari Zone\'s notice board: today\'s and yesterday\'s best catches.' : 'Notices for the Safari Zone, once it opens.',
    reset: safari && 'daily',
    buttons: safari ? [['Read', () => acts.onBoard('safari')]] : [],
    build: (g) => beckon(g, board(kioskArt(), tileX(SAFARI_AT.tx + 3), tileZ(SAFARI_AT.ty + 0.7))),
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
    // Hoenn's tower since 2026-10-15 (js/hub-pillar.js; the user's ask, "a big change"): asleep till a won run opens it
    build: (g) => {
      pillarFx = makePillar(THREE, { x: tileX(PILLAR_AT.tx), z: tileZ(PILLAR_AT.ty), open: tower, fine, texOf, merge: mergeStill });
      glowMats.push(...pillarFx.glows);
      g.add(pillarFx.group);
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
    build: (g) => beckon(g, board(kioskArt(SKY_KIT), tileX(PILLAR_AT.tx + 1.8), tileZ(PILLAR_AT.ty + 1.8))),
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
    id: 'quests', name: 'Quest Board', step: QUEST_AT.step, tiles: QUEST_AT.tiles, tag: [QUEST_AT.at[0], 2.6, QUEST_AT.at[1]], open: true,
    get line() { return boardNow(getSave()).line; },
    get buttons() { return boardNow(getSave()).kind === 'new' ? [['Read', takeQuest]] : [['Quest log', questLog]]; },
    build: (g) => {
      g.add(questBoard(tileX(QUEST_AT.at[0]), tileZ(QUEST_AT.at[1]), facePlaza(QUEST_AT.at)));
      questMark = board(newsArt(), tileX(QUEST_AT.at[0]), tileZ(QUEST_AT.at[1]) + 0.1, { shadow: false });
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
  // a professor just right of the PC (the user's ask, 2026-10-15): Oak by day, Sonia after dark, each tap
  // a hint about something easy to miss, and every fifth tap a reminder to refresh for updates (the user's ask,
  // 2026-10-15); both are built and setTime() shows the one for the hour. Talked to in a Gym Leader's slide-in
  // (profTalk())
  list.push({
    id: 'prof', step: { x: PROF_AT.x, y: PROF_AT.y + 1 }, tiles: [[PROF_AT.x, PROF_AT.y]], tag: [PROF_AT.x, 2.6, PROF_AT.y], open: true,
    get name() { return profNow().name; },
    line: '',
    buttons: [],
    build: (g) => { for (const who of PROFS) standProf(g, who); },
  });
  // the Clearing's own Gym Leaders at home (the user's ask, 2026-10-14): walked in like a town's houses (js/run.js's homeRoom());
  // they're home once Law, Britt or THE NIETOS are beaten at the Gym, and not at all while NIETOS_LIVE is off
  const nietosIn = nietosHome(friendWins(save, 'nietos'));
  const signX = tileX(NIETOS_AT.tx - 1) + 0.15, signZ = tileZ(NIETOS_AT.ty + 3) + 0.3;
  list.push({
    id: 'nietos', name: 'The Nietos\' Mansion', step: { x: NIETOS_AT.tx + 2, y: NIETOS_AT.ty + 4 }, tiles: [...rect(NIETOS_AT.tx, NIETOS_AT.ty, NIETOS_AT.tx + 4, NIETOS_AT.ty + 3), ...NIETOS_YARD.map(([dx, dy]) => [NIETOS_AT.tx + dx, NIETOS_AT.ty + dy])], tag: [NIETOS_AT.tx + 2, 4.2, NIETOS_AT.ty + 3], open: true,
    line: nietosIn ? 'Law, Britt and baby Linc\'s mansion. The chandeliers are lit and something smells like fish sticks.' : 'Law, Britt and baby Linc\'s mansion. A note on the grand door: "Out!"',
    buttons: [['Go in', () => {}]],
    build: (g) => {
      nietosHouse(g, tileX(NIETOS_AT.tx + 2), tileZ(NIETOS_AT.ty + 1.5), nietosIn);
      if (!townsOpen()) return;
      // over their name sign, like every town's leaders (the user's call, 2026-10-14: the sign, not the roof)
      nietosMark = board(newsArt(), signX, signZ, { shadow: false });
      nietosMark.rotation.x = -PITCH;
      nietosMark.userData.y = 1.75;
      g.add(nietosMark);
      questMarks();
    },
  });
  list.push({
    id: 'nietos-sign', name: 'The Nietos\' Mansion', step: { x: NIETOS_AT.tx - 1, y: NIETOS_AT.ty + 4 }, tiles: [[NIETOS_AT.tx - 1, NIETOS_AT.ty + 3]], tag: [NIETOS_AT.tx - 1, 1.6, NIETOS_AT.ty + 3], open: true,
    line: 'THE NIETOS. Law, Britt and baby Linc. Underneath, in crayon: "LINC LIVS HEAR TOO."',
    buttons: [],
    build: (g) => beckon(g, ...nietosSign(g, signX, signZ)),
  });
  // Kurt's Workshop (docs/roadmap.md's Towns step 6, session 3): walked into like the Nietos' house, only while the towns
  // are on, and shut till the Nietos send you for a Waystone Chime (workshopOpen())
  const kurtIn = workshopOpen(save);
  if (townsOpen()) list.push({
    id: 'workshop', name: 'Kurt\'s Workshop', step: { x: WORKSHOP_AT.tx + 1, y: WORKSHOP_AT.ty + 3 }, tiles: rect(WORKSHOP_AT.tx, WORKSHOP_AT.ty, WORKSHOP_AT.tx + 2, WORKSHOP_AT.ty + 2), tag: [WORKSHOP_AT.tx + 1, 3.2, WORKSHOP_AT.ty + 2], open: true,
    line: kurtIn ? 'Kurt\'s Workshop. Hammering inside, and the smell of Apricorns. Materials from the towns\' roads become things here.'
      : 'Kurt\'s Workshop. Boarded shut, the windows dark. A note on the door: "Out picking Apricorns. Back when I\'m needed. - K."',
    buttons: kurtIn ? [['Go in', () => {}]] : [],
    build: (g) => kurtWorkshop(g, tileX(WORKSHOP_AT.tx + 1), tileZ(WORKSHOP_AT.ty + 1), kurtIn),
  });
  // the Berry Booth by the gate (2026-10-23, the user's idea): a kiosk where the run's Berry Pouch and kit are packed,
  // once Kurt's open to make them
  if (kurtIn) list.push({
    id: 'booth', name: 'Berry Booth', step: { x: BOOTH_AT.tx + 1, y: BOOTH_AT.ty }, tiles: [[BOOTH_AT.tx, BOOTH_AT.ty]], tag: [BOOTH_AT.tx, 2.6, BOOTH_AT.ty], open: true,
    get line() { return `${boothBeckons(getSave().loadout, workshopOf(getSave())) ? 'Berries from Kurt\'s, not packed yet! ' : ''}A Berry Booth. Pack your held berries and one run kit item for your next run.`; },
    buttons: [['Open', openBooth]],
    build: (g) => {
      const x = tileX(BOOTH_AT.tx) + ROADSIDE, z = tileZ(BOOTH_AT.ty) - 0.2, art = boothArt(), b = board(art, x, z, { s: 0.9 });
      glowing(b.material, art, null, '#c8ffd0', 1.2).userData.glowMin = 0.4;
      g.add(b);
      boothMark = board(newsArt(), x, z + 0.1, { shadow: false });
      boothMark.rotation.x = -PITCH;
      boothMark.userData.y = 2.55;
      g.add(boothMark);
      boothMarks();
    },
  });
  // shut till you've beaten Kenmatta once in a run (the user's ask, 2026-10-15)
  const dojoIn = kenWinsOf(save) >= 1;
  list.push({
    // open since 2026-10-15 (the user's ask: "make it extravagant, even the inside"): a temple hall five tiles wide
    // (js/hub-dojo.js), its door into the hall with the ring (js/event-3d.js's buildDojoHall())
    id: 'dojo', name: 'Kenmatta\'s Dojo', step: { x: DOJO_AT.tx + 2, y: DOJO_AT.ty + 5 }, tiles: rect(DOJO_AT.tx, DOJO_AT.ty, DOJO_AT.tx + 4, DOJO_AT.ty + 4), tag: [DOJO_AT.tx + 2, 4.9, DOJO_AT.ty + 3], open: dojoIn,
    line: dojoIn ? 'Chad Master Kenmatta\'s dojo. From inside: the thud of a sandbag, and "FORTIFY YOUR MIND!" His trials and belts wait in there.'
      : 'Chad Master Kenmatta\'s dojo. The door won\'t budge. A note on it: "Beat me in a ? room first, bro. Then we train. - Ken."',
    buttons: dojoIn ? [['Go in', () => {}]] : [],
    build: (g) => {
      dojoFx = makeDojo(THREE, { x: tileX(DOJO_AT.tx + 2), z: tileZ(DOJO_AT.ty + 2), fine, texOf, merge: mergeStill });
      glowMats.push(...dojoFx.glows);
      g.add(dojoFx.group);
    },
  });
  if (gateOpen()) list.push({
    id: 'gate', name: 'Sealed Gate', step: { x: SEALED_AT.tx, y: SEALED_AT.ty + 1 }, tiles: rect(SEALED_AT.tx - 1, SEALED_AT.ty, SEALED_AT.tx + 1, SEALED_AT.ty), tag: [SEALED_AT.tx, 4, SEALED_AT.ty], open: true,
    // the way down to the Depths camp, and back up to here: Mewtwo's run starts from its talk there (the user's ask, 2026-10-15)
    line: 'The broken Sealed Gate. Far below, a fire flickers: Mewtwo\'s camp in the Depths.',
    buttons: [['Go through', enterCamp]],
    build: (g) => {   // built in the round (js/hub-sealed.js; 2026-10-15, the user's ask: no longer a flat pixel painting)
      sealed = makeSealedGate(THREE, { x: tileX(SEALED_AT.tx), z: tileZ(SEALED_AT.ty), dot: dotTexture(), merge: mergeStill });
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

const PROF_AT = { x: PC_AT.tx + 1, y: PC_AT.ty };
const PROFS = [
  { id: 'oak', name: 'Professor Oak', short: 'Oak', night: false, refresh: 'And remember: tap the red refresh button up in the corner often! The game gets updates all the time.',
    hello: 'Ah, there you are! Good to see you back. Let me share something from my research...' },
  { id: 'sonia', name: 'Professor Sonia', short: 'Sonia', night: true, dx: 0.35, refresh: 'Oh, and tap the red refresh button up in the corner often, okay? New updates land all the time!',
    hello: 'Oh, hi! Up late too? Perfect timing, I just jotted this one down in my notes...' },
];
const HINTS = [
  'Spin the Pokéstop by the gate to set out. A run you left waits there: Continue it, or give it up with an Escape Rope.',
  'Fire beats Grass, Grass beats Water, Water beats Fire. Elites and bosses shrug the chart off, though.',
  'Beat every Pokémon in the Whispering Clearing, the Overgrown Shrine and the Ember Wastes and the Safari Zone opens: one run a day, the same for everyone, and only your first try counts.',
  'Win a run and the Sky Pillar opens: 100 floors, with a new leaderboard every week.',
  '1,500 PokéCoins opens the boarded door in the Ancient Tree\'s roots. That\'s your Secret Base, to furnish however you like.',
  'The PC holds your mail, your missions and the patch notes. The Buddy Projector picks who walks beside you here.',
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
let hintAt = Math.floor(Math.random() * HINTS.length), hintsHeard = 0, profBoards = {}, profGreeted = false, profBusy = false;
const profNow = () => PROFS.find(p => p.night === (time === 'night'));

/** A tap on the professor (option 2, the user's pick, 2026-10-15): the first of a visit to the Clearing they slide in
    like a Gym Leader with a hello and a hint; after that, a hint a tap in the speech window alone, so browsing them stays quick. */
async function profTalk() {
  hideCard();
  if (profBusy) return;
  profBusy = true;
  try {
    const who = profNow(), first = !profGreeted;
    const lines = [HINTS[hintAt++ % HINTS.length]];
    if (++hintsHeard % 5 === 0) lines.push(who.refresh);
    if (first) lines.unshift(who.hello);
    profGreeted = true;
    const { gymTalk } = await import('./gym.js');
    await gymTalk({ id: who.id, name: who.short, sprite: `assets/trainers/${who.id}.png` }, lines, { lit: true, bubble: !first, title: 'PROFESSOR ' });
  } finally { profBusy = false; }
}
async function standProf(g, who) {
  const m = await monBoard({ src: `assets/trainers/${who.id}.png`, name: who.name, cry: '', px: TRAINER_PX }, false);
  if (!g.parent) { dispose(m.group); return; }
  m.board.rotation.x = -PITCH;
  m.group.position.set(tileX(PROF_AT.x) + (who.dx || 0), 0, tileZ(PROF_AT.y));
  const p = places.find(q => q.id === 'prof');
  m.group.traverse(o => { o.userData.place = p; });
  drawMon(m, { facing: 'front' }, 0);
  m.group.visible = who === profNow();
  profBoards[who.id] = m.group;
  g.add(m.group);
}

/** The Berry Booth (2026-10-23): a digital kiosk, the Safari gate's teal and cream, a berry-pink canopy over a lit screen
    showing a berry and the pouch's three slots, a card slot and a tray under it. */
function boothArt() {
  const { c, g, rr, lin, shine } = fine(18, 32);
  rr(2.4, 28.6, 13.2, 3, 1, lin(0, 28.6, 0, 31.6, ['#8a8a86', '#5e5e5a', '#3e3e3a']));
  rr(3.2, 9.4, 11.6, 19.8, 1.6, lin(3.2, 0, 14.8, 0, ['#5ec8b8', '#2e9a8e', '#1e6e66']));
  rr(3.8, 9.8, 1.2, 19, 0.6, 'rgba(255,255,255,0.3)');
  rr(4.6, 11.4, 8.8, 8.6, 1, '#1a2a30');
  rr(5.2, 12, 7.6, 7.4, 0.7, lin(0, 12, 0, 19.4, ['#d8f8c8', '#9fe0a0', '#6cbc78']));
  const berry = (gg, k) => {
    gg.fillStyle = k ? '#ffffff' : '#3a62c8'; gg.beginPath(); gg.arc(9, 14.8, 1.7, 0, Math.PI * 2); gg.fill();
    gg.fillStyle = k ? '#ffffff' : '#3aa040'; gg.beginPath(); gg.ellipse(9.9, 12.9, 0.9, 0.45, -0.5, 0, Math.PI * 2); gg.fill();
    for (const x of [6.6, 9, 11.4]) { gg.fillStyle = k ? '#d0d0d0' : 'rgba(31,58,20,0.55)'; gg.fillRect(x - 0.8, 17.4, 1.6, 1.3); }
  };
  berry(g, false);
  const s = shine();
  s.fillStyle = '#b8f0b0'; s.beginPath(); s.roundRect(5.2, 12, 7.6, 7.4, 0.7); s.fill();
  berry(s, true);
  rr(6, 21.4, 6, 1, 0.4, '#123a36');
  rr(5.4, 24.2, 7.2, 2.8, 0.8, lin(0, 24.2, 0, 27, ['#e8e4d8', '#b8b4a6']));
  rr(6.2, 25, 5.6, 1.2, 0.5, '#5e5a50');
  rr(1.4, 4.6, 15.2, 5.2, 1.6, lin(0, 4.6, 0, 9.8, ['#ff8ab8', '#e84a8a', '#b02a62']));
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (let x = 2.6; x < 16; x += 2.6) { g.beginPath(); g.arc(x, 9.6, 1.1, 0, Math.PI); g.fill(); }
  rr(4, 0.6, 10, 4.4, 1, lin(0, 0.6, 0, 5, ['#fff6e0', '#f0dcb0']));
  words(g, 'BERRY', 9, 2.9, 2.6, '#c02a62');
  words(s, 'BERRY', 9, 2.9, 2.6, '#ffd0e0');
  words(g, 'BOOTH', 9, 7.3, 2.2, '#ffffff');
  return c;
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
  glowMats = []; safariFx = null; profBoards = {}; tree = null; sign = null; house = null; kiosk = null; gardenArch = null; stops = {}; pcMail = null; pcNews = null; boothMark = null; holo = null; questMark = null; nietosMark = null; safariMark = null; beckons = []; plazaFx = null; stoneLit = null; nietosFx = null; cracks = null; sealed = null; dojoFx = null; pillarFx = null; mallFx = null;
  places = makePlaces();  saved = acts.savedRun();
  barKey = null;
  blocked = new Set(TREE_TILES.map(([x, y]) => key(x, y)));
  for (const k of [...yardTiles, ...dressTiles, ...FENCES]) blocked.add(k);
  for (const p of places) {
    const g = new THREE.Group();
    g.name = p.id;
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
  safariFence(g, tileX(SAFARI_AT.tx + 4.6), tileX(GATE_AT.tx - 4), z);
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

/* ---------- the Clearing round them ---------- */

// trees inside the walkable grid (they block): a few in the corners, kept off the roads and the ground in front of places
const TREE_TILES = [[0, 15], [1, 20], [0, 24], [9, 24], [21, 24]];

// a copse behind the fence between the Safari gate and the Whispering Clearing's (the user's ask, 2026-10-14: the open
// meadow there read as a hole in the Clearing's edge), on the meadow `cleared` keeps the forest off; [x, y, kind, size]
const GAP_TREES = [[8.2, -2.9, 0, 1.15], [9.6, -3.4, 1, 1.25], [7.4, -3.7, 2, 1.3], [10.4, -2.7, 4, 0.9], [8.9, -4.1, 3, 1.35], [6.6, -2.8, 5, 0.85]];

function buildClearing() {
  const W = COLS + M + MW, D = ROWS + M + FRONT;
  const top = new THREE.MeshStandardMaterial({ map: tex(groundArt()), roughness: 1 });
  const earth = new THREE.MeshStandardMaterial({ color: '#7a5a34', roughness: 1 }), under = new THREE.MeshStandardMaterial({ color: '#3a2818' });
  ground = new THREE.Mesh(new THREE.BoxGeometry(W, 1, D), [earth, earth, top, under, earth, earth]);
  ground.position.set(tileX(-MW - 0.5) + W / 2, -0.5, tileZ(-M - 0.5) + D / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  forest = new THREE.Group();
  forest.name = 'forest';
  scene.add(forest);
  const L = leavesOf(SEASON), crown = (i) => L ? L.trees[i % L.trees.length] : P.trees, far = (i) => L ? L.deep[i % L.deep.length] : P.deep;
  const rnd = seeded(21), kinds = [treeArt(1, crown(0)), treeArt(2, crown(1)), treeArt(3, far(0)), treeArt(4, far(1)), bushArt(5, crown(2)), bushArt(6, crown(0))]
    .map(c => SEASON === 'winter' ? snowCap(c) : c);
  const spots = kinds.map(() => []);
  // the meadow behind is open, the view (buildVista()) over it, but for the woods behind the Sky Pillar
  const cleared = (x, z) => z < tileZ(-0.6) && (x < tileX(PILLAR_AT.tx - 3) || (Math.abs(x - tileX(PILLAR_AT.tx)) < 3.4 && z > tileZ(PILLAR_AT.ty - 1.4)));
  const put = (k, x, z, s) => { if (!cleared(x, z)) spots[k].push({ x, z, s }); };
  for (let r = 0; r < 3; r++) for (let x = -MW + 0.5; x < COLS + M; x += 1.25 + rnd() * 0.4) {
    put(r ? 2 + (rnd() < 0.5 ? 1 : 0) : rnd() < 0.5 ? 0 : 1, tileX(x - 0.5) + (rnd() - 0.5) * 0.5, tileZ(-1 - r * 1.2 - rnd() * 0.4), 1.25 + r * 0.25 + rnd() * 0.2);
  }
  // the forest down both sides, from the back meadow's edge to the hedge in front
  for (const s of [-1, 1]) for (let r = 0; r < 3; r++) for (let y = 0.5; y < ROWS + FRONT; y += 1.3 + rnd() * 0.4) {
    const x = s < 0 ? -2 - WEST - r * 1.2 : COLS + 1 + r * 1.2;
    put(r ? 2 + (rnd() < 0.5 ? 1 : 0) : rnd() < 0.5 ? 0 : 1, tileX(x) + (rnd() - 0.5) * 0.4, tileZ(y) + (rnd() - 0.5) * 0.3, 1.1 + r * 0.25 + rnd() * 0.2);
  }
  for (const [x, y] of TREE_TILES) put(rnd() < 0.3 ? 4 : rnd() < 0.5 ? 0 : 1, tileX(x), tileZ(y), 1);
  for (const [x, y, k, s] of GAP_TREES) spots[k].push({ x: tileX(x), z: tileZ(y), s });
  // a hedge of bushes along the front edge, low so it never hides the garden
  // each a step nearer than the last: side by side on one plane, where they overlap they z-fought and flickered
  let b = 0;
  for (let x = -MW + 0.6; x < COLS + M - 1; x += 1.1 + rnd() * 0.3) put(4 + (rnd() < 0.5 ? 1 : 0), tileX(x), tileZ(ROWS) + 0.2 + (b++ % 2) * 0.08, 0.8 + rnd() * 0.2);
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

/** A white picket fence round the Ancient Tree's garden (2026-10-15, the user's ask), painted like the garden gate: a row
    behind the tree, down both sides to the front, and along the front from either side of the trunk to those corners
    (the left's closed off on the user's ask, the same day), the gate (ARCH_AT) in it just right of the trunk (their
    drawing). */
const FENCE_BACK = 1, FENCE_LEFT = 18, FENCE_RIGHT = 27;
function treeFence() {
  const paint = new THREE.MeshStandardMaterial({ color: SEASON === 'winter' ? '#e8e2d8' : '#f0e6d2', roughness: 0.7 });
  const g = new THREE.Group();
  const add = (geo, x, y, z, turn = 0) => { const o = new THREE.Mesh(geo, paint); o.position.set(x, y, z); o.rotation.y = turn; o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  const post = new THREE.BoxGeometry(0.11, 0.95, 0.11), cap = new THREE.ConeGeometry(0.09, 0.1, 4);
  const picket = new THREE.BoxGeometry(0.07, 0.72, 0.03), tip = new THREE.ConeGeometry(0.05, 0.08, 4);
  const run = ([x0, z0], [x1, z1]) => {
    const len = Math.hypot(x1 - x0, z1 - z0), turn = Math.atan2(-(z1 - z0), x1 - x0), at = (k) => [x0 + (x1 - x0) * k, z0 + (z1 - z0) * k];
    const posts = Math.max(1, Math.round(len / 1.1));
    for (let i = 0; i <= posts; i++) { const [x, z] = at(i / posts); add(post, x, 0.475, z); add(cap, x, 1, z).rotation.y = Math.PI / 4; }
    for (const y of [0.3, 0.65]) { const [x, z] = at(0.5); add(new THREE.BoxGeometry(len, 0.06, 0.035), x, y, z, turn); }
    const n = Math.max(2, Math.floor(len / 0.17));
    for (let i = 1; i < n; i++) {
      const [x, z] = at(i / n);
      add(picket, x, 0.41, z, turn);
      add(tip, x, 0.81, z, turn).rotation.y = turn + Math.PI / 4;
    }
  };
  const back = tileZ(FENCE_BACK), left = tileX(FENCE_LEFT), right = tileX(FENCE_RIGHT) + 0.3, front = tileZ(ARCH_AT.ty);
  const gate = tileX(ARCH_AT.tx) + ARCH_X, trunk = tileX(TREE_AT.tx + 2) + 0.1;
  run([trunk - 2 * (trunk - tileX(TREE_AT.tx)), front], [left, front]);   // the left's front, mirroring the right's up to the trunk
  run([left, front], [left, back]);
  run([left, back], [right, back]);
  run([right, back], [right, front]);
  run([right, front], [gate + 0.75, front]);
  run([gate - 0.75, front], [trunk, front]);
  mergeStatic(g, () => false);
  g.traverse(o => { if (o.isMesh) o.raycast = () => {}; });
  forest.add(g);
  for (let x = FENCE_LEFT; x <= FENCE_RIGHT; x++) dressTiles.add(key(x, FENCE_BACK));
  for (let y = FENCE_BACK; y <= TREE_AT.ty; y++) { dressTiles.add(key(FENCE_LEFT, y)); dressTiles.add(key(FENCE_RIGHT, y)); }
  for (let x = ARCH_AT.tx + 1; x < FENCE_RIGHT; x++) dressTiles.add(key(x, ARCH_AT.ty));
}

function dressClearing() {
  treeFence();
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });
  const iron = std({ color: '#3a3e48', roughness: 0.5, metalness: 0.3 }), cap = std({ color: '#2a2e36', roughness: 0.5, metalness: 0.3 });
  const pane = std({ color: '#fff4d0', emissive: new THREE.Color('#ffd88a'), roughness: 0.3 });
  pane.userData.glow = 1.6; pane.userData.glowMin = 0.08;
  seasonMats.push(pane);
  const still = new THREE.Group();   // merged below: the lamps, benches, beds and pond-side stones were ~250 draws a frame
  const add = (g, geo, m, x, y, z, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; o.raycast = () => {}; g.add(o); return o; };
  const pole = new THREE.CylinderGeometry(0.045, 0.06, 1.7, 8), foot = new THREE.CylinderGeometry(0.12, 0.15, 0.14, 8);
  const head = new THREE.BoxGeometry(0.22, 0.26, 0.22), roof = new THREE.ConeGeometry(0.2, 0.16, 4), arm = new THREE.BoxGeometry(0.3, 0.04, 0.04);
  for (const [tx, ty] of LAMPS) {
    const g = new THREE.Group(), x = tileX(tx), z = tileZ(ty);
    add(g, foot, iron, x, 0.07, z); add(g, pole, iron, x, 0.85, z);
    add(g, arm, iron, x, 1.62, z).castShadow = false;
    add(g, head, pane, x, 1.83, z, false);
    add(g, roof, cap, x, 2.04, z).rotation.y = Math.PI / 4;
    still.add(g);
    dressTiles.add(key(tx, ty));
  }
  const wood = std({ color: '#b07a44' });
  for (const [tx, ty, turn] of BENCHES) {
    const g = new THREE.Group();
    g.position.set(tileX(tx), 0, tileZ(ty)); g.rotation.y = turn;
    for (const dz of [-0.1, 0.02, 0.14]) add(g, new THREE.BoxGeometry(0.9, 0.05, 0.1), wood, 0, 0.36, dz);
    for (const dy of [0.5, 0.62]) add(g, new THREE.BoxGeometry(0.9, 0.08, 0.04), wood, 0, dy, -0.2);
    for (const dx of [-0.38, 0.38]) { add(g, new THREE.BoxGeometry(0.05, 0.36, 0.34), iron, dx, 0.18, 0); add(g, new THREE.BoxGeometry(0.05, 0.36, 0.05), iron, dx, 0.52, -0.2); }
    still.add(g);
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
    still.add(g);
    for (let dx = -Math.floor(r); dx <= Math.floor(r); dx++) for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) if (Math.hypot(dx, dy) <= r) dressTiles.add(key(tx + dx, ty + dy));
  }
  // the pond: still water over its painted bed, stones round its edge, lily pads, and nothing walks into it
  const water = new THREE.Mesh(new THREE.CircleGeometry(POND.r + 0.05, 40), std({ color: '#5aaee0', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.62 }));
  water.rotation.x = -Math.PI / 2; water.position.set(tileX(POND.x), 0.03, tileZ(POND.y)); water.raycast = () => {};
  forest.add(water);
  const pebble = new THREE.DodecahedronGeometry(0.13, 0), rock = std({ color: '#a8a294', flatShading: true });
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2, o = add(still, pebble, rock, tileX(POND.x) + Math.cos(a) * (POND.r + 0.12), 0.05, tileZ(POND.y) + Math.sin(a) * (POND.r + 0.12));
    o.scale.set(1 + rnd() * 0.6, 0.6 + rnd() * 0.4, 1 + rnd() * 0.5); o.rotation.y = rnd() * 3;
  }
  const pad = std({ color: '#5aa848', side: THREE.DoubleSide });
  for (const [dx, dz, r] of [[-0.6, 0.3, 0.2], [0.5, -0.4, 0.16], [0.2, 0.7, 0.14], [-0.2, -0.8, 0.12]]) {
    const o = add(still, new THREE.CircleGeometry(r, 16, 0.3, Math.PI * 1.8), pad, tileX(POND.x) + dx, 0.045, tileZ(POND.y) + dz, false);
    o.rotation.x = -Math.PI / 2;
    if (r > 0.15) add(still, petal, blooms[0], o.position.x + 0.05, 0.09, o.position.z - 0.04, false);
  }
  for (let tx = Math.floor(POND.x - POND.r); tx <= POND.x + POND.r; tx++) for (let ty = Math.floor(POND.y - POND.r); ty <= POND.y + POND.r; ty++) if (Math.hypot(tx - POND.x, ty - POND.y) <= POND.r + 0.2) dressTiles.add(key(tx, ty));
  mergeStill(still, () => false);
  forest.add(still);
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

/** The season's decorations, built once with the forest. Halloween: jack-o'-lanterns at the Ancient Tree's door, a
    pumpkin patch with a giant one and a scarecrow, a row of graves lit by candles, a
    bubbling cauldron with toadstools and two pairs of lantern posts (lit with the clock, setTime()), ghost
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
      // the pumpkin patch on the south-east lawn, short of the Nietos' house (moved 2026-10-15, the user's ask: up by
      // the Ancient Tree the scarecrow stood at the Secret Base's door)
      [...P_(5), 21, 17, 4.4, 0, -0.1], [...P_(6), 20, 18, 2.2, 0, 0.1], [...P_(7, false), 19, 18, 1.9, 0, -0.2],
      [scarecrowArt(), 'white', 19, 17, 1.5, 0, 0],
      // the graveyard before the dojo: a row of stones, a candle at each end (its dead tree taken out 2026-10-22, the user's
      // ask, for the Buddy Projector)
      [graveArt(0), null, 5, 9, 1.4, 0, 0], [graveArt(1), null, 6, 9, 1.5, 0, 0], [graveArt(2), null, 8, 9, 1.5, 0, 0], [graveArt(3), null, 9, 9, 1.4, 0, 0],
      [candlesArt(0), 'white', 5, 10, 1.1, 0, -0.1], [candlesArt(1), 'white', 8, 10, 1.1, 0, -0.1],
      [...P_(1), 16, 13, 1.4, 0.15, 0.1],   // a little one on the plaza
      [capsArt(0), 'white', 11, 3, 1.2, 0, 0.2],   // the witch's corner by the dojo, beside the cauldron
    ];
    for (const [c, glow, tx, ty, s, nx, nz] of yard) {
      const b = board(c, tileX(tx) + nx, tileZ(ty) + nz, { s });
      if (glow === 'pumpkin' && c.glow) glowing(b.material, c, null, '#ff8a20', 1.3, seasonMats);
      else if (glow && c.glow) glowing(b.material, c, null, '#ffffff', 1.2, seasonMats);
      b.raycast = () => {};
      forest.add(b);
      yardTiles.add(key(tx, ty));
    }
    // the witch's cauldron, a real model that does something when tapped (js/hub-cauldron.js); its fire and brew are lamps
    cauldron = makeCauldron(THREE, mergeStill);
    cauldron.group.position.set(tileX(11), 0, tileZ(2));
    forest.add(cauldron.group);
    yardTiles.add(key(11, 2));
    for (const l of cauldron.lights) lamps.push(l);
    // the giant pumpkin lights the ground round it after dark
    for (const [colour, at, k] of [['#ff9030', [tileX(21), 1.2, tileZ(17) + 1.4], 0.8]]) {
      const l = new THREE.PointLight(colour, 0, 4, 1.6);
      l.position.set(...at);
      l.userData.k = k;
      lamps.push(l);
      scene.add(l);
    }
    spooks = makeSpooks({ THREE, scene, camera, root, view, tex: texOf, dispose, monBoard, drawMon, route, free, tileX, tileZ, PITCH,
      // never on or beside a doorstep (the user's ask, 2026-10-13: a ghost stood in front of the Poké Mall's doors)
      byDoor: (c) => places.some(p => Math.abs(p.step.x - c.x) <= 1 && Math.abs(p.step.y - c.y) <= 1),
      spawns: [{ x: 11, y: 8 }, { x: 17, y: 12 }, { x: 12, y: 16 }, { x: 26, y: 13 }], bats: { x: tileX(TREE_AT.tx), z: tileZ(TREE_AT.ty - 1.5) } });
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
const vistaSpan = () => { const x0 = tileX(-MW - 8); return { x0, w: Math.round(tileX(COLS + M + 8) - x0) }; };
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
const MEADOW = new Set([...rect(-3 - WEST, -4, PILLAR_AT.tx + 2, -1)].map(([x, y]) => key(x, y)));
// the fences either side of the gates, out on the meadow, and the trees in the gap between them (GAP_TREES)
const FENCES = [...rect(SAFARI_AT.tx + 5, GATE_AT.ty, GATE_AT.tx - 2, GATE_AT.ty), ...rect(GATE_AT.tx + 2, GATE_AT.ty, GATE_AT.tx + 4, GATE_AT.ty),
  ...rect(SAFARI_AT.tx + 5, GATE_AT.ty - 2, GATE_AT.tx - 5, GATE_AT.ty - 1),
  ...rect(-3 - WEST, SAFARI_AT.ty, SAFARI_AT.tx - 2, SAFARI_AT.ty), ...rect(SAFARI_AT.tx + 2, SAFARI_AT.ty, SAFARI_AT.tx + 4, SAFARI_AT.ty)].map(([x, y]) => key(x, y));
const inGrid = (c) => (c.x >= -WEST && c.y >= 0 && c.x < COLS && c.y < ROWS) || MEADOW.has(key(c.x, c.y));
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
  if (p.id === 'pc') import('./pc.js').then(m => m.warmPC(), () => {});
  if (p.id === 'kiosk') import('./house-kiosk.js').catch(() => {});
  if (walker.path.length === 0 && placeAt(walker.tile) === p) return enter ? open(p, i) : showCard(p);
  walker.path = route(walker.tile, p.step);
  aim = enter ? { p, i } : null;
  hideCard();
  if (!walker.path.length) open(p, i);
}

function arrived() {
  if (cutscene) return;
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
  if (p.id === 'safari-gate' && !p.open) return showSafariLock();   // shut, each biome's bar to opening it
  if (!p.open || !p.buttons.length || (i == null && p.buttons.length > 1)) return showCard(p);
  const stop = stops[p.id];
  if (stop) {
    if (stop.spinAt && performance.now() - stop.spinAt < SPIN) return;
    spinStop(stop);
  }
  if (p.id === 'base') return baseOwned() ? enterBase() : buyBase();
  if (p.id === 'backyard') return yardOwned() ? enterYard() : baseOwned() ? buyYardArch() : lockedArch();
  if (p.id === 'mall') return enterMall();
  if (p.id === 'pc') return openPc();
  if (p.id === 'nietos' || p.id === 'workshop' || p.id === 'dojo') return enterHouse(p);
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
let cueFont, chevronArt;
function stopCue(g, top, S, text) {
  // the letters are painted once (again when Bungee arrives); the chevrons marching in beside them are little quads moved
  // each frame, not a repaint: repainting this 760 x 240 picture 30 times a second sent all of it to the GPU each time,
  // and the Clearing stuttered on phones (2026-10-16)
  const c = document.createElement('canvas');
  c.width = 760; c.height = 240;
  c.hd = 2;
  const map = tex(c);
  const cx = 380, cy = 120, w = 3.2 * S, k = w / c.width, h = c.height * k;
  let half = 0, px = 124, last = -1;
  const paint = () => {
    const d = c.getContext('2d');
    d.clearRect(0, 0, c.width, c.height);
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
    const grad = d.createLinearGradient(0, cy - px * 0.42, 0, cy + px * 0.42);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, '#ffffff'); grad.addColorStop(1, '#bff2ff');
    d.fillStyle = grad;
    d.fillText(text, cx, cy);
    map.needsUpdate = true;
    draw(last < 0 ? 0 : last, true);
  };
  // one chevron pointing right, its tip 31 px in from the left of a 48 x 76 picture; the left side's march in that way,
  // the right side's are the same picture flipped
  const CW = 48, CH = 76, TIP = 31;
  if (!chevronArt) {
    const cc = document.createElement('canvas');
    cc.width = CW; cc.height = CH; cc.hd = 2;
    const d = cc.getContext('2d');
    d.lineJoin = 'round'; d.lineCap = 'round';
    d.beginPath(); d.moveTo(TIP - 20, CH / 2 - 26); d.lineTo(TIP + 6, CH / 2); d.lineTo(TIP - 20, CH / 2 + 26);
    d.lineWidth = 20; d.strokeStyle = '#0c2c48'; d.stroke();
    d.lineWidth = 10; d.strokeStyle = '#8eecff'; d.stroke();
    chevronArt = tex(cc);
  }
  const m = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, fog: false });
  // two chevrons a side in turn (each its own fade), so a mesh for each, holding its left and right quads
  const marks = [0, 1].map(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 3), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 0]), 2));
    geo.setIndex([0, 2, 1, 2, 3, 1, 4, 6, 5, 6, 7, 5]);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.hypot(cx, cy) * k);   // the label's own, wherever they march
    return { geo, mat: new THREE.MeshBasicMaterial({ map: chevronArt, transparent: true, depthWrite: false, fog: false, opacity: 0 }) };
  });
  /** One mark's quads with their tips `x` (canvas px) either side of the middle. */
  const place = (mk, x) => {
    const p = mk.geo.attributes.position.array, hw = CW / 2 * k, hh = CH / 2 * k;
    for (const [i, side] of [[0, -1], [4, 1]]) {
      const mid = (side < 0 ? -x - (TIP - CW / 2) : x + (TIP - CW / 2)) * k;
      p.set([mid - hw, hh, 0, mid + hw, hh, 0, mid - hw, -hh, 0, mid + hw, -hh, 0], i * 3);
    }
    mk.geo.attributes.position.needsUpdate = true;
  };
  // `now` 0 (and Reduced motion) is the still look: one chevron each side
  const draw = (now, force) => {
    if (!now) {
      if (force || last !== 0) place(marks[0], half + 40);
      last = 0;
      marks[0].mat.opacity = m.opacity; marks[1].mat.opacity = 0;
      return;
    }
    last = now;
    marks.forEach((mk, n) => {
      const t = (now / 1100 + n / 2) % 1;
      place(mk, half + 92 - t * 44);
      mk.mat.opacity = Math.sin(t * Math.PI) * m.opacity;
    });
  };
  paint();
  cueFont ??= new FontFace('Bungee', 'url(https://fonts.gstatic.com/s/bungee/v17/N0bU2SZBIuF2PU_0DXR1.woff2)').load()
    .then((f) => document.fonts.add(f));
  cueFont.then(paint, () => {});
  // drawn over the ground, not added to it: added light at 60% washed white letters into the grass (the user couldn't read them)
  for (const turn of [0, Math.PI]) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    mesh.rotation.y = turn;
    mesh.position.y = top + h * 0.3;
    mesh.renderOrder = 2;
    for (const mk of marks) {
      const chev = new THREE.Mesh(mk.geo, mk.mat);
      chev.renderOrder = 1;   // under the letters, as they were painted: the letters' glow lies over them
      chev.raycast = () => {};
      mesh.add(chev);
    }
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

/* ---------- the signs that beckon ---------- */

let glintArt = null;

/** A sign that is a place of its own (the Safari's and the Sky Pillar's boards, the Nietos' name board)
    hops and wiggles every few seconds, a glint twinkling at its top corner (the user's ask, 2026-10-15: they
    read as scenery, nothing said they could be tapped; liveBeckons()). `obj` is a board(), standing on its middle, or a
    group standing on its origin `w` wide and `h` tall. */
function beckon(g, obj, w, h) {
  let pivot = obj;
  if (!obj.isGroup) {
    ({ width: w, height: h } = obj.geometry.parameters);
    pivot = new THREE.Group();
    pivot.position.set(obj.position.x, 0, obj.position.z);
    obj.position.x = obj.position.z = 0;
    pivot.add(obj);
  }
  g.add(pivot);
  glintArt ||= starGlint();
  const spark = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: texOf(glintArt), transparent: true, depthWrite: false, fog: false }));
  spark.position.set(w / 2 - 0.04, h - 0.02, 0.06);
  spark.rotation.x = -PITCH;
  spark.raycast = () => {};
  pivot.add(spark);
  beckons.push({ pivot, spark, phase: beckons.length * 1.3 });
}

/** A four-pointed twinkle, white at its heart, gold at its tips, in a soft halo. */
function starGlint() {
  const { c, g, fill } = fine(16, 16, 8), o = 8;
  const halo = g.createRadialGradient(o, o, 0, o, o, 7);
  halo.addColorStop(0, 'rgba(255, 246, 200, 0.75)'); halo.addColorStop(1, 'rgba(255, 220, 120, 0)');
  fill(halo, () => g.arc(o, o, 7, 0, Math.PI * 2));
  const star = (r, k, colour) => fill(colour, () => {
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 - Math.PI / 2, d = i % 2 ? r * k : r;
      g[i ? 'lineTo' : 'moveTo'](o + Math.cos(a) * d, o + Math.sin(a) * d);
    }
  });
  star(7.6, 0.2, '#ffd23a');
  star(5.4, 0.22, '#ffffff');
  return c;
}

const HOP = 3.8;   // seconds between a sign's hops

/** Each sign's hop: up and a little bounce, stretched in the air and squashed landing, wiggling as it settles, its glint
    flaring with it and twinkling faintly between. Held still when calm, the glint lit. */
function liveBeckons(now) {
  for (const { pivot, spark, phase } of beckons) {
    if (calm) {
      pivot.position.y = 0; pivot.scale.set(1, 1, 1); pivot.rotation.z = 0;
      spark.scale.setScalar(0.9); spark.rotation.z = 0; spark.material.opacity = 0.85;
      continue;
    }
    const c = (now / 1000 + phase) % HOP;
    const air = c < 0.45 ? Math.sin(Math.PI * c / 0.45) : c < 0.72 ? 0.35 * Math.sin(Math.PI * (c - 0.45) / 0.27) : 0;
    const land = Math.exp(-(((c - 0.45) / 0.05) ** 2)) + 0.6 * Math.exp(-(((c - 0.72) / 0.05) ** 2));
    pivot.position.y = air * 0.26;
    pivot.scale.set(1 - air * 0.05 + land * 0.08, 1 + air * 0.08 - land * 0.12, 1);
    pivot.rotation.z = c < 1.4 ? 0.1 * Math.sin(c * 16) * Math.exp(-c * 2.6) : 0;
    const flare = c < 1.1 ? Math.sin(Math.PI * c / 1.1) : 0, idle = 0.3 + 0.15 * Math.sin(now / 260 + phase * 3);
    spark.scale.setScalar(0.45 + Math.max(flare, idle) * 0.95);
    spark.rotation.z = now / 700;
    spark.material.opacity = Math.min(1, 0.4 + Math.max(flare, idle));
  }
}

// the Secret Base is bought once (the user's call, 2026-10-08), saved as `baseOwned`
const BASE_PRICE = 1500;
const baseOwned = () => !!getSave().baseOwned;
const yardOwned = () => { const y = getSave().secretBase?.house?.yard; return !!y && !y.lent; };

/* ---------- the house on the lot, and the builders' stand (js/data/houses.js; behind HOUSES_LIVE / ?houses) ---------- */

/** What stands on the lot: with houses off, always the Ancient Tree; on, the house tried on from the stand's catalogue,
    else the one lived in, else (no base yet) the Starter Cottage for sale. */
function lotNow() {
  if (!housesOpen()) return { id: 'tree', paint: 0 };
  return trying || homeOf(getSave()) || { id: 'cottage', paint: 0 };
}

function lotLine() {
  const lot = lotNow(), name = HOUSES_BY_ID[lot.id].name;
  if (lot.id === 'tree') return baseOwned() ? 'A door in the Ancient Tree\'s roots: your Secret Base.'
    : `A boarded-up door in the Ancient Tree's roots. ${BASE_PRICE.toLocaleString()} PokéCoins makes it your Secret Base.`;
  return baseOwned() ? `Your Secret Base: a ${name}, in ${HOUSES_BY_ID[lot.id].paints[lot.paint]?.name ?? 'its own paint'}.`
    : `A ${name}, boarded up. ${BASE_PRICE.toLocaleString()} PokéCoins at Timburr & Co.'s stand makes it your Secret Base.`;
}

/** The lot's house, `lot` { id, paint }: the tree's painting (its door, its "Home" sign), or a house's model. */
function buildLot(g, lot) {
  const owned = baseOwned();
  lotShown = lot;
  if (lot.id !== 'tree') {
    const def = HOUSES_BY_ID[lot.id];
    house = makeHouse(THREE, { id: lot.id, p: def.paints[lot.paint] || def.paints[0], x: tileX(TREE_AT.tx), z: tileZ(TREE_AT.ty) - 0.1, boarded: !owned, winter: SEASON === 'winter', fine, texOf, merge: mergeStill });
    glowMats.push(...house.glows);
    g.add(house.group);
    return;
  }
  const L = HOUSES_BY_ID.tree.paints[lot.paint] || HOUSES_BY_ID.tree.paints[0];
  const shut = ancientArt(false, !owned, L), b = board(shut, tileX(TREE_AT.tx), tileZ(TREE_AT.ty) + 0.2), open = ancientArt(true, false, L);
  glowing(b.material, shut, null, '#ffd890');
  b.raycast = doorOnly;
  tree = { m: b.material, shut: b.material.map, open: texOf(open) };
  g.add(b);
  // the sign hangs off its nail on the bark over the door, pivoting there (liveSign())
  const art = homeSignArt(owned), plate = board(art, 0, 0), pivot = new THREE.Group();
  plate.position.set((art.width / art.fine / 2 - SIGN_NAIL[0]) / TP, (SIGN_NAIL[1] - art.height / art.fine / 2) / TP, 0);
  pivot.position.set(tileX(TREE_AT.tx), 3.62, tileZ(TREE_AT.ty) + 0.32);
  plate.raycast = () => {};
  pivot.add(plate);
  g.add(pivot);
  sign = { pivot, m: plate.material, fixed: owned ? null : texOf(homeSignArt(true)), fixAt: 0, from: 0, swapped: false };
}

/** Just the lot built again (a try-on from the catalogue): its old model let go, its lights out of glowMats. */
function rebuildLot() {
  const g = placeGroup?.children.find(o => o.name === 'base'), p = places.find(q => q.id === 'base');
  if (!g || !p) return;
  const gone = new Set();
  g.traverse(o => { for (const m of [o.material].flat()) if (m) gone.add(m); });
  glowMats = glowMats.filter(m => !gone.has(m));
  tree?.open.dispose();
  sign?.fixed?.dispose();
  tree = null; sign = null; house = null;
  dispose(g);
  p.line = lotLine();
  p.build(g);
  g.traverse(o => { o.userData.place = p; });
  const L = LIGHT[time] || LIGHT.day;
  g.traverse(o => { const m = o.material; if (m && glowMats.includes(m)) m.emissiveIntensity = Math.max(m.userData.glowMin || 0, L.glow) * m.userData.glow; });
}

const KIOSK_CREW = 'assets/pokemon/timburr-front.gif';

/** The builders' stand, and Timburr behind its counter, hopping now and then to be noticed. */
function buildKiosk(g) {
  const x = tileX(KIOSK_AT.tx), z = tileZ(KIOSK_AT.ty) + 0.05;
  g.add(makeKiosk(THREE, { x, z, sale: !baseOwned(), fine, texOf, merge: mergeStill }).group);
  const k = kiosk = { mon: null, next: 0, hop: 0, tick(now) {
    if (!k.mon || calm) return;
    if (!k.next) k.next = now + 4000;
    if (now > k.next) { k.hop = now; k.next = now + 6000 + Math.random() * 5000; }
    const t = (now - k.hop) / 450;
    k.mon.board.position.y = t < 1 ? Math.sin(t * Math.PI) * 0.18 : 0;
  } };
  monBoard({ src: KIOSK_CREW, name: 'Timburr', cry: 'timburr' }, false).then(m => {
    if (!g.parent || kiosk !== k) { dispose(m.group); return; }
    m.board.rotation.x = -PITCH;
    m.group.scale.setScalar(0.85);
    m.group.position.set(x + 0.08, 0, z - 0.38);
    const p = places.find(q => q.id === 'kiosk');
    m.group.traverse(o => { o.userData.place = p; });
    drawMon(m, { facing: 'front' }, 0);
    g.add(m.group);
    k.mon = m;
  }, () => {});
}

let browsing = null;   // while the stand's catalogue is open, where the view looks: the lot, over the sheet
let near = 1;          // the view's distance, eased in to BROWSE_NEAR while it does, so the house tried on reads on a phone
const BROWSE_NEAR = 0.8;
let lotShown = null;   // the { id, paint } built on the lot
const sameLot = (a, b) => a?.id === b?.id && a?.paint === b?.paint;

/** The stand's catalogue (js/house-kiosk.js), a sheet over the lower half: a pick builds that house on the lot as a
    try-on (rebuildLot()), and shutting it puts back the one lived in. */
async function openKiosk() {
  if (entering || document.querySelector('.hk-sheet')) return;
  hideCard();
  walker.path = []; aim = null;
  let mod;
  try { mod = await import('./house-kiosk.js'); } catch { playSound('cancel'); return; }
  playCry('timburr');
  browsing = { x: tileX(TREE_AT.tx) - 0.2, z: tileZ(TREE_AT.ty) + 2.6 };
  root.classList.add('browsing');
  mod.openKiosk({
    parent: root,
    tryOn: (lot) => { trying = lot; if (!sameLot(lotNow(), lotShown)) rebuildLot(); },
    rebuild: () => rebuildLot(),
    buyBase: (paint) => buyBase(paint, true),
    onClose: (changed) => {
      browsing = null;
      root.classList.remove('browsing');
      trying = null;
      if (changed) buildPlaces();
      else if (!sameLot(lotNow(), lotShown)) rebuildLot();
      refreshCoins();
    },
  });
}

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
async function buyBase(paint = 0, fromKiosk = false) {
  if (entering) return false;
  hideCard();
  walker.path = []; aim = null;
  const coins = getSave().coins ?? 0, cottage = housesOpen();
  if (coins < BASE_PRICE) {
    playSound('cancel');
    await confirmDialog(`The Secret Base costs ${BASE_PRICE.toLocaleString()} PokéCoins, and you have ${coins.toLocaleString()}.`, 'OK');
    return false;
  }
  if (!fromKiosk && !(await confirmDialog(cottage ? `Make the Starter Cottage your Secret Base for ${BASE_PRICE.toLocaleString()} PokéCoins?` : `Make the Ancient Tree your Secret Base for ${BASE_PRICE.toLocaleString()} PokéCoins?`, `Buy (${BASE_PRICE.toLocaleString()})`))) return false;
  updateSave(d => { d.coins -= BASE_PRICE; d.baseOwned = true; if (cottage) firstHouse(d, paint); });
  refreshCoins();
  playSound('buy');
  if (fromKiosk) return true;
  if (sign && !calm) {   // the sign swings up level and mends itself before the door opens
    entering = { at: performance.now(), z: walker.z, still: true };
    sign.from = sign.pivot.rotation.z; sign.fixAt = performance.now();
    await new Promise(r => setTimeout(r, FIX + 300));
    entering = null;
  }
  buildPlaces();
  here = places.find(q => q.id === 'base');
  await enterBase();
  return true;
}

/** Into the Ancient Tree: the door swings open, your partner steps into the dark, and the Secret Base comes up under a
    curtain (js/base-3d.js); its ✕ brings it back out here (showHub(), `inside`). */
async function enterBase() {
  if (entering) return;
  hideCard();
  walker.path = []; walker.facing = mon.sheets.back ? 'back' : 'front';
  if (tree) tree.m.map = tree.open;
  house?.open(true);
  playSound('door');
  entering = { at: performance.now(), z: walker.z };
  await curtain(true, calm ? 0 : 420);
  entering = null;
  if (tree) tree.m.map = tree.shut;
  house?.open(false, true);
  inside = 'base';
  await acts.onBase();
}

/** The garden arch's price: too few coins says how many more; else a yes pays, the brambles wither and the padlock
    drops, and in through the gate. */
async function lockedArch() {
  if (entering) return;
  hideCard();
  walker.path = []; aim = null;
  playSound('cancel');
  await confirmDialog(`The garden arch is padlocked. Make ${lotWord(getSave())} your Secret Base first, then its backyard can be cleared.`, 'OK');
}

async function buyYardArch() {
  if (entering) return;
  hideCard();
  walker.path = []; aim = null;
  const coins = getSave().coins ?? 0;
  if (coins < YARD_PRICE) {
    playSound('cancel');
    await confirmDialog(`The backyard costs ${YARD_PRICE.toLocaleString()} PokéCoins, and you have ${coins.toLocaleString()}.`, 'OK');
    return;
  }
  if (!(await confirmDialog(`Clear the garden arch and make a backyard behind ${lotWord(getSave())} for ${YARD_PRICE.toLocaleString()} PokéCoins?`, `Buy (${YARD_PRICE.toLocaleString()})`))) return;
  const { buyYard, loadBase } = await import('./secret-base.js');
  if (!buyYard(loadBase())) { playSound('cancel'); return; }
  refreshCoins();
  playSound('buy');
  if (gardenArch && !calm) {
    entering = { at: performance.now(), z: walker.z, still: true };
    await new Promise(r => setTimeout(r, gardenArch.clear() + 250));
    entering = null;
  }
  buildPlaces();
  here = places.find(q => q.id === 'backyard');
  await enterYard();
}

/** Through the garden arch: the gate swings in, your partner walks through into the light, and the Secret Base comes
    up out in its backyard; its doormat brings it back out here, under the arch (leftPlace()). */
async function enterYard() {
  if (entering) return;
  hideCard();
  walker.path = []; walker.facing = mon.sheets.back ? 'back' : 'front';
  gardenArch?.swing(true);
  playSound('door');
  entering = { at: performance.now(), z: walker.z, x0: walker.x, x1: tileX(ARCH_AT.tx) + ARCH_X };
  await curtain(true, calm ? 0 : 420);
  entering = null;
  gardenArch?.swing(false);
  inside = 'backyard';
  await acts.onBase('yard');
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

function boothMarks() {
  if (boothMark) boothMark.visible = boothBeckons(getSave().loadout, workshopOf(getSave()));
}

/** The Berry Booth's device (js/berrybooth.js) over the Clearing. */
async function openBooth() {
  if (entering || document.getElementById('booth-dialog')?.open) return;
  hideCard();
  walker.path = []; aim = null;
  let openBerryBooth;
  try { ({ openBerryBooth } = await import('./berrybooth.js')); } catch { playSound('cancel'); return; }
  openBerryBooth(boothMarks);
}

/** Log on to the PC (js/pc.js), full screen over the Clearing. */
async function openPc() {
  if (entering || document.querySelector('.pc-screen')) return;
  hideCard();
  walker.path = []; aim = null;
  let openPC;
  try { ({ openPC } = await import('./pc.js')); } catch { playSound('cancel'); return; }
  openPC({ onClose: () => { pcMarks(); if (gardenArch && gardenArch.owned !== yardOwned()) buildPlaces(); }, onFame: (app) => acts.onApp?.(app),
    onKiosk: () => { const k = places.find(q => q.id === 'kiosk'); if (k) goTo(k, true); } });
}

/** The Buddy Projector's picker (js/holo-pick.js); a new pick steps out in place. */
async function openProjector() {
  if (entering || document.querySelector('.holo-pick')) return;
  hideCard();
  walker.path = []; aim = null;
  const { openBuddyPicker } = await import('./holo-pick.js');
  openBuddyPicker((picked) => { if (picked) swapBuddy(); });
}

/** The walking buddy again from the save: its billboard swapped where it stands, with a hop and its cry. */
async function swapBuddy() {
  const mate = buddy(getSave());
  holo?.show(mate);
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
  holo?.show(mate);
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
  if (p.id === 'backyard' && gardenArch) {   // back out under the arch, the gate swinging shut behind
    gardenArch.swing(true);
    if (calm) { gardenArch.swing(false); return; }
    leaving = { at: performance.now() + LEAVE_WAIT, z: walker.z, x0: tileX(ARCH_AT.tx) + ARCH_X, x1: walker.x };
    walker.z -= 0.7; walker.x = leaving.x0;
    walker.hopUntil = 0;
    return;
  }
  if ((!tree && !house) || p.id !== 'base') return;
  if (tree) tree.m.map = tree.open;
  house?.open(true, true);
  if (calm) { if (tree) tree.m.map = tree.shut; house?.open(false, true); return; }
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
  if (leaving.x0 != null) walker.x = leaving.x0 + (leaving.x1 - leaving.x0) * t;
  if (t < 1) return;
  leaving = null;
  walker.hopUntil = now + 500;
  setTimeout(() => { if (tree) tree.m.map = tree.shut; house?.open(false); gardenArch?.swing(false); playSound('door'); }, 250);
}

/* ---------- the card under a place ---------- */

function showCard(p) {
  here = p;
  if (p.waystone) return showWaystone(p);
  if (p.id === 'prof') return profTalk();
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
  if (!townsOpen() || !RING.some(t => { const st = townState(save, t.id); return st.met || mended(st); })) return sealedWaystone(p);
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
    : 'Cracked straight through, humming off-key. It travels nowhere like this. The Nietos by the plaza seem to know about it: beat Law, Britt or the Nietos at the Clearing\'s Gym, and they\'ll tell you.';
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
  if (held || cutscene || arriving || leaving || outbound || returning) return;
  const rays = tapRays(e), ghosts = [...(spooks?.boards() || []), ...(buddies?.boards() || [])], under = [mon.board, ...ghosts, placeGroup, ...(cauldron ? [cauldron.hit] : [])];
  let hit;
  for (const ray of rays) if ((hit = ray.intersectObjects(under, true).find(h => !h.object.userData.who || onSprite(h)))) break;
  if (spooks?.tap(hit, walker)) { buddies?.hush(); return; }
  if (buddies?.tap(hit, walker)) { spooks?.hush(); return; }
  if ([spooks?.hush(), buddies?.hush()].some(Boolean)) return;
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
  if (held || cutscene || arriving || leaving || outbound || returning || (e.button ?? 0) > 0) return;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, last: '' };
}

function onDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 12) return;
    drag.moved = true;
    view.setPointerCapture?.(e.pointerId);
  }
  if (held || cutscene || arriving || leaving || outbound || returning) return;
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
  if (!running || held || arriving || leaving || outbound || returning || document.querySelector('dialog:modal, #shop-dialog[open], .holo-pick') || document.activeElement?.matches?.('input')
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
  // one shadow for every flight, kept: a new one each time compiled its shader again as it set off
  if (!flyShade) {
    flyShade = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0, depthWrite: false }));
    flyShade.rotation.x = -Math.PI / 2;
    flyShade.scale.set(1.8, 0.7, 1);
    flyShade.raycast = () => {};
  }
  const shade = flyShade;
  shade.material.opacity = 0;
  // their shaders, bent as they'll be drawn, built before it shows (off the main thread where the GPU can)
  if (CURVE) { bendAll(m.group); bendAll(shade); }
  await Promise.all([warmShaders(renderer, m.group, camera, scene), warmShaders(renderer, shade, camera, scene)]);
  if (!running) return dispose(m.group);
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
  if (k >= 1) {
    // its board's material is kept (its sprite let go) and the last one's freed: disposing it threw its shader away, so
    // every flight, each 30-50 s, compiled it again mid-frame, the Clearing's stutter now and then (2026-10-16)
    const kept = f.m.board.material;
    f.m.board.material = new THREE.MeshBasicMaterial();
    scene.remove(f.m.group, f.shade); dispose(f.m.group);
    kept.map?.dispose();
    flownMat?.dispose(); flownMat = kept;
    flyer = null; return;
  }
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
  const d = camera.userData.dist * near;
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
function bendAll(root = scene) {
  root.traverse(o => {
    if (!o.material) return;
    if (o.isMesh) bendFine(o);
    for (const m of [o.material].flat()) bend(m, BEND);
  });
}

function placeCamera(dt) {
  if (AERIAL) {
    const cx = tileX(-MW - 0.5) + (COLS + M + MW) / 2, cz = tileZ(-M - 0.5) + (ROWS + M + FRONT) / 2;
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
  const loX = tileX(-0.5 - WEST) - 2.2 + half - ahead * 1.2, hiX = tileX(COLS - 0.5) + 2.2 - half + ahead * 1.2;
  const wantX = browsing ? browsing.x : loX >= hiX ? (loX + hiX) / 2 : Math.max(loX, Math.min(hiX, wx));
  const wantZ = browsing ? browsing.z : backZ >= frontZ ? (backZ + frontZ) / 2 : Math.max(backZ, Math.min(frontZ, wz));
  const k = calm ? 1 : Math.min(1, dt / 1000 * 4);
  camX += (wantX - camX) * k; camZ += (wantZ - camZ) * k;
  near += ((browsing ? BROWSE_NEAR : 1) - near) * k;
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
  if (post.fit(w, h) < 1) {
    // a Home Screen app's tall screen draws a smaller scene (createPost() in js/hd2d.js): the canvas a whole multiple of
    // it, so its crisp pixels stay even
    const k = post.scale(w, h), m = Math.max(1, Math.round(Math.min(devicePixelRatio, 2)));
    renderer.setPixelRatio(1);
    renderer.setSize(Math.round(w * k) * m, Math.round(h * k) * m, false);
  } else {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h, false);
  }
  post.size(w, h);
  fitCamera(w, h);
}

const v3 = () => new THREE.Vector3();

function frame(now) {
  if (!running) return;
  if (screen.hidden || !root.isConnected) { running = false; quiet(); sleepGL(renderer); return; }
  // under the device (its corner button opened it over the hub) the Clearing holds still rather than drawing unseen
  if (root.querySelector('.room-home.out') && document.getElementById('collection-screen')?.hidden === false) { last = 0; requestAnimationFrame(frame); return; }
  if (tooSoon(now, last)) { requestAnimationFrame(frame); return; }
  if (!card.hidden && now - resetAt > 5000) { resetAt = now; resetLine(); }
  const dt = Math.min(100, now - (last || now));
  last = now;
  fpsLog.push(dt); if (fpsLog.length > 60) fpsLog.shift();

  if (walker.path.length) { here = null; if (walk(dt)) arrived(); }
  if (entering && !entering.still) {   // into the hollow, or through the arch
    const k = Math.min(1, (now - entering.at) / 420);
    walker.z = entering.z - k * 0.7;
    if (entering.x0 != null) walker.x = entering.x0 + (entering.x1 - entering.x0) * k;
  }
  liveLeaving(now);
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, 0, walker.z);
  mon.board.position.y = bob;
  mon.board.scale.x = walker.flip ? -1 : 1;
  drawMon(mon, walker, dt);
  liveWarp(now);
  liveStones(now);
  liveNietos(now);
  liveDuck(now);
  spooks?.tick(now, dt, { calm, quiet: held || arriving || !!inside || !!entering || !!outbound, partner: walker });
  buddies?.tick(now, dt, { calm, quiet: held || arriving || !!inside || !!entering || !!outbound, partner: walker });
  if (ring.material.opacity > 0) { ring.material.opacity = Math.max(0, ring.material.opacity - dt / 700); ring.scale.setScalar(1.25 - ring.material.opacity * 0.3); }
  sealed?.tick(now, (LIGHT[time] || LIGHT.day).glow, calm);
  gardenArch?.tick(now, calm, (LIGHT[time] || LIGHT.day).glow);
  dojoFx?.tick(now, calm);
  pillarFx?.tick(now, calm);
  mallFx?.tick(now, calm, (LIGHT[time] || LIGHT.day).glow);
  liveGateway(now);
  cracks?.tick(now, Math.hypot(walker.x - cracks.x, walker.z - cracks.z) < 4.5, calm);
  if (!calm) livePc(now);
  holo?.tick(now, dt, calm);
  cauldron?.tick(now, dt, calm);
  safariFx?.tick(now, calm);
  plazaFx?.tick(now, calm);
  for (const m of [pcMail, pcNews, boothMark, questMark, nietosMark, safariMark]) if (m?.visible) m.position.y = m.userData.y + (calm ? 0 : Math.sin(now / 380) * 0.08);
  if (!calm) for (const s of Object.values(stops)) liveStop(s, now);
  for (const s of Object.values(stops)) if (s.cue) {
    s.cue.opacity = calm ? 0.82 : 0.74 + 0.14 * (0.5 + 0.5 * Math.sin(now / 520));
    s.cue.userData.tick(calm ? 0 : now);
  }
  liveSign(now);
  house?.tick(dt, calm);
  kiosk?.tick(now);
  liveBeckons(now);
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
  // the lantern by the base's door, the Sky Pillar's doorway and the Safari gate's torches light their ground from dusk; made once and only dimmed,
  // so the hour changing never recompiles a shader
  for (const [colour, at, k, id] of [['#ffc070', [tileX(TREE_AT.tx) - 1.25, 2.4, tileZ(TREE_AT.ty) + 0.6], 1], ['#8af0d0', [tileX(PILLAR_AT.tx), 1.1, tileZ(PILLAR_AT.ty) + 1.8], 0.7], ['#a8f8d8', [tileX(GATE_AT.tx), 1.6, tileZ(GATE_AT.ty) + 1], 0.9], ['#ffb060', [tileX(SAFARI_AT.tx), 1.5, tileZ(SAFARI_AT.ty) + 0.9], 0, 'safari']]) {
    const l = new THREE.PointLight(colour, 0, 6, 1.6);
    l.position.set(...at);
    l.userData.k = k; l.userData.id = id;
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
  smallNoShadow(scene);
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
  outbound = null; returning = false; profGreeted = false;
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
  if (friendMail()) pcMarks();   // a friend's letter, once a UTC day at most
  homeNews();
  friendBuddies();
  return true;
}

/** The trainers on your list out in the plaza as their buddies: read at most every ten minutes, built again only when
    who's there changed. Signed out, nobody. */
async function friendBuddies() {
  if (buddiesAt && performance.now() - buddiesAt < 600000) return;
  buddiesAt = performance.now();
  const list = await plazaBuddies(4);
  if (list === null) buddiesAt = 0;   // signed out: nothing was read, so ask again on the next visit
  const key = (list || []).map(f => `${f.uid}|${f.name}|${f.tier}|${f.mon.src}|${f.talk.join('|')}`).join('/');
  if (buddies?.key === key) return;
  buddies?.dispose();
  buddies = null;
  if (!list?.length) return;
  buddies = makeBuddies({ THREE, scene, camera, root, monBoard, drawMon, dispose, route, free, tileX, tileZ, PITCH,
    byDoor: (c) => places.some(p => Math.abs(p.step.x - c.x) <= 1 && Math.abs(p.step.y - c.y) <= 1),
    centre: START, reach: PLAZA_R + 0.6, spawns: [{ x: 13, y: 11 }, { x: 17, y: 13 }, { x: 13, y: 14 }, { x: 17, y: 10 }],
    others: (c) => (c.x === walker.tile?.x && c.y === walker.tile?.y), onCard: (uid) => acts.onApp?.('trainers', uid) }, list);
  buddies.key = key;
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
