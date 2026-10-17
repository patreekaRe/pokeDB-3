/* base-3d.js  -  the Secret Base as a little HD-2D diorama in Three.js (?base): the room you walk your partner round and
   decorate in place. The same layout, rules and pixel paintings as js/secret-base.js (the 2D room is only the fallback
   where WebGL fails): the floor and walls are pixel-textured blocks, flat pieces low blocks with their painting on top,
   the bookshelf a block, the rest 3D models carved from their paintings (js/base-model.js); your partner's GIF is split into frames (ImageDecoder, or
   js/gif-frames.js) and walks where you tap. Decorating: a piece from the tray under the view shows as a ghost on the
   tiles under your finger (green fits, red doesn't) and lands where the finger lifts; a tap on a placed piece gives
   Rotate / Move / Store. A fixed tilted camera follows the partner; the scene renders small and is scaled up with crisp
   pixels, then tilt-shift and bloom are laid on in one pass. The light follows js/daytime.js. */

import { getSave } from './storage.js';
import { timeOfDay } from './daytime.js';
import { calmFx } from './prefs.js';
import { playSound, playCry, playMusic } from './audio.js';
import { dragWalk, reroute } from './drag-walk.js';
import { buddy } from './trainercard.js';
import { residentCap, openPC, resident } from './pc.js';
import { loadThree, tex, crop, trim, dispose, monBoard, drawMon, onSprite, createPost, curtain, doormat, warmShaders, wakeGL, sleepGL, bend, bendFine, unbend, tooSoon, bakeColours, smallNoShadow } from './hd2d.js';
import { CURVE, CLEARING_LOOK, CLEARING_LIGHT, treeArt, bushArt } from './hub-3d.js';
import { season } from './season.js';
import { leavesOf, groundLook, snowCap, tintOf } from './hub-season.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { RES, HD, sh as shadeOf } from './base-paint.js';
import { furnitureModel } from './base-mesh.js';
import { dressPlay, tapPlay, tickPlay, stopPlay } from './base-play.js';
import { homeGame, playAtHome, cabinetUp } from './home-arcade.js';
import { shapeOf, seatHeight } from './base-shapes.js';
import { isPlot, tendPlot, forgetPlots, liveGarden, openPlot, openGarden } from './berry-garden.js';
import { SAFARI_DEX_PAGES } from './data/safari.js';
import { PIECES, DESIGNS, colours, styles, WALLPAPERS, FLOORS, papers, T, WALL, COLS, ROWS, footprint, fits, aimTile, icon, loadBase, saveBase, roomArt, pieceArt,
  spare, openGift, ownsPaper, buyPaper, paperArt, cells, surfaceOf, surfaceUnder, ridersOf, standing, metSmeargle, meetSmeargle, KINDS_OF, FREE_PC,
  useRoom, goRoom, onFloor, topOf, leaderVisitor, leaderVisited, postersUp, fitsHere, metInYard, meetInYard } from './secret-base.js';
import { loadStatues, statuesIn } from './base-furniture-statues.js';
import { loadFigures } from './base-figures.js';
import { spriteOf } from './data/gym.js';
import { trainerName } from './leaderboard.js';
import { roomById, roomName, doorsOf, pipTile, floorName } from './data/house.js';

const PX = 1 / (T * RES);   // furniture: one painted pixel
const WALL_H = WALL / T;   // 3 tiles, as in the 2D room
const LAMPS = 2;           // lamps that really light the room (point lights are dear on phones); the rest only glow
const MIN_ACROSS = 6;      // tiles the view shows across at least, an upright phone panning over the rest
const onShowMax = () => residentCap();   // Safari catches living in the base at once (more from the Ranger Task Board), also picked at the Clearing's PC
const RIDER = 0.72;        // a piece up on a table, at this size
// kinds of piece a Pokémon climbs onto, and what it does there; any piece with a seat height (js/base-shapes.js) too
const SEATS = { bed: { rest: [9000, 16000], sleep: true }, cushion: { rest: [5000, 9000] } };
// out in the yard Water types swim in the pond or pool and the rest take the swings and benches (docs/roadmap.md's
// backyard, part c); where on the piece each goes, in its own frame unturned: [x across, y up, z out front, swing part]
const YARD_SEATS = { swingset: { rest: [7000, 13000], swing: true }, tyreswing: { rest: [7000, 13000], swing: true }, paddlingpool: { rest: [8000, 15000], swim: true }, rockpond: { rest: [8000, 15000], swim: true },
  lotadpond: { rest: [8000, 15000], swim: true }, psyduckpond: { rest: [8000, 15000], swim: true }, cedartub: { rest: [8000, 15000], swim: true } };
const YARD_SPOTS = {
  swingset: [[-0.42, 0.46, 0, 'swing0'], [0.42, 0.46, 0, 'swing1']],
  tyreswing: [[0, 0.56, 0, 'swing0']],
  picnicbench: [[-0.45, 0.44, -0.72], [0.45, 0.44, -0.72], [-0.45, 0.44, 0.72], [0.45, 0.44, 0.72]],
  paddlingpool: [[0.28, 0.22, 0.3], [-0.3, 0.22, -0.28]],
  rockpond: [[-0.3, -0.12, 0.08], [0.3, -0.12, 0.22]],
  lotadpond: [[-0.45, 0.43, 0.1], [0.45, 0.43, 0.25]],
  psyduckpond: [[0.35, 0.19, 0.35], [-0.3, 0.19, -0.35]],
  cedartub: [[-0.35, 0.62, 0.1], [0.35, 0.62, -0.1]],
};

const seatOf = (id) => { const p = PIECES[id]; return YARD_SEATS[p.fam] || SEATS[p.seat || p.fam] || (seatHeight(p.fam, p) ? { rest: [6000, 12000] } : null); };

const LIGHT = {
  dawn: { sky: '#ffd0b8', ground: '#5a4058', amb: 1.4, sun: '#ffb48a', sunI: 2.2, at: [-9, 5, 6], lamp: 0.8, win: 0.9, shaft: 0.3, motes: 0.7, bg: '#2a2036' },
  day: { sky: '#ffffff', ground: '#7a6a5a', amb: 1.6, sun: '#fff2dc', sunI: 2.6, at: [-5, 12, 7], lamp: 0, win: 1.1, shaft: 0.4, motes: 1, bg: '#1d2440' },
  dusk: { sky: '#f4a070', ground: '#4a2e44', amb: 1.2, sun: '#ff8a4a', sunI: 2.2, at: [9, 5, 6], lamp: 1.6, win: 0.8, shaft: 0.3, motes: 0.7, bg: '#2a1828' },
  night: { sky: '#6070b0', ground: '#14142a', amb: 0.9, sun: '#90a8f0', sunI: 0.7, at: [4, 12, 5], lamp: 4, win: 0.35, shaft: 0.12, motes: 0.25, bg: '#080a18' },
};

let THREE, renderer, scene, camera, root, view, hud;
let post;
let hemi, sun, lampLights = [], winMats = [], shafts = [], motes = [], ring;
let roomGroup, pieceGroup, ghost, foot, selBox;
let mon, walker = { x: 0, y: 0, z: 0, path: [], facing: 'front', flip: false, hop: 0 };
let blocked = new Set(), base, calm = false, time = '';
let holding = null, aimAt = null, sel = -1, pressing = false, pointer = null, swallowClick = false, tab = 'furniture';
let grab = null;   // a press on a placed piece, until it turns into a drag (it's picked up) or a tap
let camX = 0, panX = 0, follow = true, last = 0, fpsLog = [];
// decorating zooms in (pinch, the wheel) and a drag on the floor pans it about; camZ / panZ are the pan towards the wall
let zoom = 1, camZ = 0, panZ = 0, zoomK = 1, pinch = null, drag = null, quietUntil = 0;
const touches = new Map();
const ZOOM_MAX = 2.6;
// Walk shows only the room; Decorate pulls the camera back over the whole room and brings up the sheet
let mode = 'walk', blend = 0, shots = null, fitted = null, viewW = 0, viewH = 0;
let guests = [], puffs = [], puffTex = {};
const standees = new Set();   // round pieces drawn as their painting (js/base-model.js), leaned back like the Pokémon
let giftBoard = null, unwrapping = null, shopMsg = '';
let folded = false;   // the sheet folded down to its hinge, to look at the room while browsing
let named = null;   // a piece just taken from the tray: its name, said for a moment (the tiles show none)
let hushed = null;   // the hint tapped away: it stays away until it says something else
let trying = null;   // a wallpaper or floor up on approval: { field, id, was }
let exitMat = null;   // the main room's doormat over the front edge: a tap walks your partner out, as in a Pokémon house
let doorMats = [], doors = [];   // the room's doorways (js/data/house.js) and their mats, whose arrows breathe in Walk
let leaveTo = null;   // where the doormat walks back to (the hub's door); without it, a ?base playtest reloads onto the title   // the Safari Pokémon on show, and the hearts and Zs floating off them

const tileX = (tx) => tx + 0.5 - COLS / 2;
const tileZ = (ty) => ty + 0.5 - ROWS / 2;

// the backyard rolls away like the Clearing (bend() in js/hd2d.js): one strength for everything, 0 in every room and
// CURVE out on the lawn, so your partner and anything shared draw straight indoors; `z` follows the camera's focus
const BEND = { k: { value: 0 }, z: { value: 0 } };
const SEASON = season();
let snow = null;   // winter's snowfall over the yard
const outdoors = () => (base.here || 'main') === 'yard';


/** Only the pixels in (or shaded near) these colours, for an emissive map: a window's sky, a lamp's shade. The pieces
    are painted smooth, so a glow colour comes graded: a pixel glows the more the nearer it is to one of its shades. */
function mask(src, colours) {
  const keep = colours.flatMap(h => [-1, 0, 1, 2].map(n => shadeOf(h, n))).map(h => { const v = parseInt(h.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; });
  const c = crop(src, 0, 0, src.width, src.height), g = c.getContext('2d');
  c.hd = src.hd;
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let near = 1e9;
    for (const [r, gg, b] of keep) near = Math.min(near, Math.abs(d[i] - r) + Math.abs(d[i + 1] - gg) + Math.abs(d[i + 2] - b));
    const f = Math.max(0, 1 - near / 70);
    d[i] *= f; d[i + 1] *= f; d[i + 2] *= f;
  }
  g.putImageData(img, 0, 0);
  return c;
}

const solid = (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95 });
const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();


/* ---------- the room and its pieces, rebuilt whenever the layout changes ---------- */

const here = () => roomById(base.house, base.here || 'main');

/* A room is its floor tiles (js/data/house.js: a plain rectangle, or an L or a cross): a floor block for each of its
   rects, a back wall over every stretch of floor with none behind it, a side wall up each left and right edge, and the
   front left open, a diorama's cut-away. A side wall standing in front of floor further back (a cross's lower arm,
   before its wings) is cut down low, so it doesn't hide that floor. */
function buildRoom() {
  dispose(roomGroup);
  doorMats = []; exitMat = null; snow = null;
  BEND.k.value = outdoors() ? CURVE : 0;
  if (outdoors()) return buildYard();
  const art = roomArt(base), shape = here().shape;
  const edge = solid('#2a1e16'), trimC = wallTrim(art), under = solid('#3a2a1e');
  const cap = solid(shade(trimC, 1.15)), outer = solid(shade(trimC, 0.6));
  const paper = (from, len) => new THREE.MeshStandardMaterial({ map: tex(crop(art, from * T, 0, len * T, WALL)), roughness: 1 });
  const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.receiveShadow = true; roomGroup.add(mesh); return mesh; };

  for (const [x, y, w, h] of shape.rects) {
    const top = new THREE.MeshStandardMaterial({ map: tex(crop(art, x * T, WALL + y * T, w * T, h * T)), roughness: 1 });
    add(new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, h), [edge, edge, top, edge, under, edge]), x + w / 2 - COLS / 2, -0.3, y + h / 2 - ROWS / 2);
  }
  const on = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && onFloor(x, y);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS;) {
    const backed = (xx) => on(xx, y) && !on(xx, y - 1);
    if (!backed(x)) { x++; continue; }
    let e = x;
    while (backed(e + 1)) e++;
    const len = e - x + 1, l = on(x - 1, y) ? 0 : 0.4, r = on(e + 1, y) ? 0 : 0.4;
    add(new THREE.Mesh(new THREE.BoxGeometry(len + l + r, WALL_H, 0.4), [outer, outer, cap, outer, paper(x, len), outer]),
      x - COLS / 2 + len / 2 + (r - l) / 2, WALL_H / 2, y - ROWS / 2 - 0.2);
    x = e + 1;
  }
  for (const s of [-1, 1]) for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS;) {
    const edged = (yy) => on(x, yy) && !on(x + s, yy);
    const low = (yy) => { for (let k = 0; k < yy; k++) if (on(x + s, k)) return true; return false; };
    if (!edged(y)) { y++; continue; }
    const lo = low(y);
    let e = y;
    while (edged(e + 1) && low(e + 1) === lo) e++;
    const len = e - y + 1, tall = lo ? 0.35 : WALL_H, faces = [outer, outer, cap, outer, outer, outer];
    faces[s < 0 ? 0 : 1] = lo ? cap : paper(y, len);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.4, tall, len), faces), x + (s > 0 ? 1 : 0) - COLS / 2 + s * 0.2, tall / 2, y - ROWS / 2 + len / 2).castShadow = true;
    y = e + 1;
  }
  doors = doorsOf(base.house, here().id).map(d => ({ ...d, tile: pipTile(shape, [d.side, d.at]) }));
  for (const d of doors) addDoor(d, [outer, outer, cap, outer, outer, outer]);
}

const throughTex = {};
/** The dark of a doorway: the next room unlit beyond it, a little warm light on its floor; `down`, the top of a flight
    of stairs going down into it instead, its treads fading into the dark. */
function throughMat(down = false) {
  if (!throughTex[down]) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 128;
    const g = c.getContext('2d'), v = g.createLinearGradient(0, 0, 0, 128);
    v.addColorStop(0, '#08060e'); v.addColorStop(0.7, '#1a1420'); v.addColorStop(1, down ? '#1a1420' : '#4a3428');
    g.fillStyle = v; g.beginPath(); g.roundRect(0, 0, 64, 128, [28, 28, 0, 0]); g.fill();
    if (down) for (let i = 0; i < 5; i++) {
      g.fillStyle = `rgba(168, 122, 76, ${0.75 - i * 0.15})`;
      g.fillRect(6 + i * 3, 124 - i * 11, 52 - i * 6, 4);
    }
    throughTex[down] = new THREE.CanvasTexture(c);
    throughTex[down].colorSpace = THREE.SRGBColorSpace;
  }
  return new THREE.MeshBasicMaterial({ map: throughTex[down], transparent: true });
}

/** A doorway: on the front edge a doormat like the way out; in a wall a dark way through under a wooden frame, a small
    mat before it pointing in, or for a staircase (only ever in a back wall) wooden steps climbing into it, or the top
    of a flight going down. A tap on any of it walks your partner through (goThrough()). */
function addDoor(d, stepMat) {
  const { x: tx, y: ty } = d.tile;
  if (d.side === 's') {
    const m = doormat(tileX(tx), ty + 1 - ROWS / 2 + 0.47, stepMat);
    m.mat.userData.door = m.step.userData.door = d;
    roomGroup.add(m.step, m.mat);
    doorMats.push(m.mat);
    if (d.exit) exitMat = m.mat;
    return;
  }
  const g = new THREE.Group(), wood = solid('#7a5434');
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 2.1), throughMat(d.stairs === 'down'));
  dark.position.set(0, 1.05, 0.03);
  const post = (x) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.24, 0.14), wood); m.position.set(x, 1.12, 0.07); m.castShadow = true; return m; };
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.18, 0.16), wood);
  lintel.position.set(0, 2.24, 0.07);
  const mat = doormat(0, 0, wood).mat;
  mat.scale.set(0.6, 0.75, 1);
  mat.position.set(0, 0.012, 0.45);
  mat.rotation.z = Math.PI;
  g.add(dark, post(-0.61), post(0.61), lintel);
  if (d.stairs) {
    // up: steps climbing into the wall, each higher; down: a landing tread at the top, the rest painted going down
    const tread = solid('#a87a4c');
    for (let i = 0; i < (d.stairs === 'up' ? 4 : 1); i++) {
      const hgt = d.stairs === 'up' ? 0.16 * (i + 1) : 0.04, step = new THREE.Mesh(new THREE.BoxGeometry(1.0, hgt, 0.22), i % 2 ? wood : tread);
      step.position.set(0, hgt / 2, 0.5 - i * 0.22);
      step.castShadow = step.receiveShadow = true;
      g.add(step);
    }
  } else g.add(mat);
  if (d.side === 'n') g.position.set(tileX(tx), 0, ty - ROWS / 2);
  if (d.side === 'w') { g.position.set(tx - COLS / 2, 0, tileZ(ty)); g.rotation.y = Math.PI / 2; }
  if (d.side === 'e') { g.position.set(tx + 1 - COLS / 2, 0, tileZ(ty)); g.rotation.y = -Math.PI / 2; }
  g.traverse(o => { o.userData.door = d; });
  roomGroup.add(g);
  if (!d.stairs) doorMats.push(mat);
}

/** Your partner walks to a doorway and through it: out over the main room's doormat, the way out of the base, or into
    the room it leads to (travel()). */
function goThrough(d) {
  if (mode !== 'walk') return;
  const t = d.tile, [ox, oy] = { n: [0, -0.7], s: [0, 0.97], w: [-0.7, 0], e: [0.7, 0] }[d.side];
  const go = () => {
    walker.path = route(walker.tile, t);
    walker.path.push({ x: t.x + ox, y: t.y + oy });
    walker.through = d;
    ring.position.set(tileX(t.x), 0.02, tileZ(t.y));
    ring.material.opacity = 0.9;
  };
  follow = true;
  walker.goal = null; walker.seatTo = null;
  if (walker.seat) getUp(go); else if (!walker.jump) go();
  playSound('confirm');
}

// the trim colour is the wallpaper strip's bottom row, whatever the paper
function wallTrim(art) {
  const [r, g, b] = art.getContext('2d').getImageData(4, WALL - 3, 1, 1).data;
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/* ---------- the backyard (docs/roadmap.md's backyard, part a) ---------- */

/* A lawn behind the house, walked like a room (`house.yard`, js/data/house.js): mown in stripes, the Clearing's meadow
   round it (its colours, js/hub-3d.js, snowed over in winter), a wooden picket fence on three sides, the front left open
   like the rooms', the Clearing's trees behind it and down its sides, its sky and light (yardLight()), and the ground
   rolling away like the Clearing's (BEND). Its doormat on the front edge leads back out through the Clearing's garden arch.
   Nothing new on the GPU: it is the base's own renderer and scene, built like any room. */
const YTP = 16;   // painted pixels a tile, as the Clearing's
const LOOK = CLEARING_LOOK, GROUND = groundLook(SEASON, LOOK);

function seeded(seed) {
  return () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Grass `w` x `h` tiles, pixel by pixel like the Clearing's ground: a mown lawn in stripes two tiles wide, or the wild
    meadow round it, a shade darker, with longer blades and a few flowers. */
function grassArt(w, h, lawn, seed) {
  const rnd = seeded(seed), W = w * YTP, H = h * YTP, c = new OffscreenCanvas(W, H), g = c.getContext('2d', { willReadFrequently: true });
  const img = g.createImageData(W, H), d = img.data, pal = GROUND.meadow.map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const from = lawn ? Math.floor(x / (YTP * 2)) % 2 : 2, i = Math.min(pal.length - 1, from + Math.floor(rnd() * (lawn ? 1.7 : 2.6)));
    d.set([...pal[i], 255], (y * W + x) * 4);
  }
  g.putImageData(img, 0, 0);
  if (GROUND.blade) for (let n = W * H / (lawn ? 45 : 16); n > 0; n--) {
    g.fillStyle = GROUND.blade[Math.floor(rnd() * GROUND.blade.length)];
    g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H), 1, lawn ? 1 : 2);
  }
  if (!lawn) for (let n = W * H / 700; n > 0 && GROUND.flowers.length; n--) {
    const [petal, heart] = GROUND.flowers[Math.floor(rnd() * GROUND.flowers.length)], x = 1 + Math.floor(rnd() * (W - 3)), y = 1 + Math.floor(rnd() * (H - 3));
    g.fillStyle = petal; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
    g.fillStyle = heart; g.fillRect(x, y, 1, 1);
  }
  return c;
}

function buildYard() {
  const rnd = seeded(31), side = COLS / 2, back = -ROWS / 2;
  const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.receiveShadow = true; mesh.raycast = () => {}; roomGroup.add(mesh); return mesh; };
  const earth = solid('#7a5a34'), under = solid('#3a2818');
  const lawn = new THREE.MeshStandardMaterial({ map: tex(grassArt(COLS, ROWS, true, 3)), roughness: 1 });
  add(new THREE.Mesh(new THREE.BoxGeometry(COLS, 0.6, ROWS), [earth, earth, lawn, under, earth, earth]), 0, -0.3, 0);
  // the meadow round it, a touch lower so the lawn reads as kept, running on under the view in front as the Clearing's
  // ground does (the house is behind you), so no sky shows under the lawn's front edge
  const MW = 44, AHEAD = 9, MD = 22 + ROWS / 2 + AHEAD, wild = tex(grassArt(4, 4, false, 5));
  wild.wrapS = wild.wrapT = THREE.RepeatWrapping;
  wild.repeat.set(MW / 4, MD / 4);
  const meadow = new THREE.MeshStandardMaterial({ map: wild, roughness: 1 });
  add(new THREE.Mesh(new THREE.BoxGeometry(MW, 0.6, MD), [earth, earth, meadow, under, earth, earth]), 0, -0.33, ROWS / 2 + AHEAD - MD / 2);

  // the Clearing's trees: three rows behind, two down each side (short of the front, which stays open), bushes along
  // the back fence; billboards like the Clearing's, in its season's leaves
  const L = leavesOf(SEASON), crown = (i) => L ? L.trees[i % L.trees.length] : LOOK.trees, far = (i) => L ? L.deep[i % L.deep.length] : LOOK.deep;
  const kinds = [treeArt(1, crown(0)), treeArt(2, crown(1)), treeArt(3, far(0)), treeArt(4, far(1)), bushArt(5, crown(2)), bushArt(6, crown(0))]
    .map(c => SEASON === 'winter' ? snowCap(c) : c);
  const spots = kinds.map(() => []), near = () => rnd() < 0.5 ? 0 : 1, deep = () => 2 + (rnd() < 0.5 ? 1 : 0);
  for (let r = 0; r < 3; r++) for (let x = -side - 7; x < side + 7; x += 1.4 + rnd() * 0.6) {
    spots[r ? deep() : near()].push({ x: x + (rnd() - 0.5) * 0.5, z: back - 1.7 - r * 1.3 - rnd() * 0.4, s: 1 + r * 0.2 + rnd() * 0.2 });
  }
  for (const s of [-1, 1]) for (let r = 0; r < 2; r++) for (let z = back - 0.4; z < 1.2; z += 1.4 + rnd() * 0.4) {
    spots[r ? deep() : near()].push({ x: s * (side + 1.6 + r * 1.3) + (rnd() - 0.5) * 0.4, z, s: 0.95 + r * 0.2 + rnd() * 0.2 });
  }
  for (const s of [-1, 1]) for (let z = 1.6; z < ROWS / 2; z += 1.1) spots[4 + (rnd() < 0.5 ? 1 : 0)].push({ x: s * (side + 1 + rnd() * 0.4), z, s: 0.8 + rnd() * 0.15 });
  let b = 0;
  for (let x = -side + 0.4; x < side; x += 1 + rnd() * 0.3) spots[4 + (rnd() < 0.5 ? 1 : 0)].push({ x, z: back - 0.7 - (b++ % 2) * 0.06, s: 0.7 + rnd() * 0.15 });
  const m4 = new THREE.Matrix4();
  kinds.forEach((c, k) => {
    const list = spots[k];
    if (!list.length) return;
    const geo = new THREE.PlaneGeometry(c.width / YTP, c.height / YTP);
    geo.translate(0, c.height / YTP / 2, 0);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ map: tex(c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }), list.length);
    list.forEach((s, i) => mesh.setMatrixAt(i, m4.makeScale(s.s, s.s, s.s).setPosition(s.x, 0, s.z)));
    mesh.castShadow = true;
    mesh.raycast = () => {};
    roomGroup.add(mesh);
  });

  // a picket fence along the back and down both sides: pointed pickets on two rails, a post every two tiles
  const runs = [[-side - 0.12, back - 0.12, side + 0.12, back - 0.12], [-side - 0.12, back - 0.12, -side - 0.12, ROWS / 2 - 0.08], [side + 0.12, back - 0.12, side + 0.12, ROWS / 2 - 0.08]];
  const pick = new THREE.ExtrudeGeometry(new THREE.Shape([[-0.05, 0], [0.05, 0], [0.05, 0.6], [0, 0.7], [-0.05, 0.6]].map(([x, y]) => new THREE.Vector2(x, y))), { depth: 0.035, bevelEnabled: false });
  pick.translate(0, 0, -0.0175);
  const pickets = [], posts = [];
  for (const [x0, z0, x1, z1] of runs) {
    const len = Math.hypot(x1 - x0, z1 - z0), turn = x0 === x1 ? Math.PI / 2 : 0, out = x0 === x1 ? [Math.sign(x0) * 0.05, 0] : [0, -0.05];
    for (let s = 0.11; s < len; s += 0.24) pickets.push([x0 + (x1 - x0) * s / len, z0 + (z1 - z0) * s / len, turn]);
    for (let s = 0; s <= len + 0.01; s += len / Math.max(1, Math.round(len / 2))) posts.push([x0 + (x1 - x0) * s / len + out[0], z0 + (z1 - z0) * s / len + out[1]]);
    for (const y of [0.2, 0.48]) {
      const rail = add(new THREE.Mesh(new THREE.BoxGeometry(turn ? 0.04 : len, 0.07, turn ? len : 0.04), solid(LOOK.wood[1])), (x0 + x1) / 2 + out[0], y, (z0 + z1) / 2 + out[1]);
      rail.castShadow = true;
    }
  }
  const fence = (geo, mat, list, at) => {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => mesh.setMatrixAt(i, at(p)));
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.raycast = () => {};
    roomGroup.add(mesh);
  };
  fence(pick, solid(SEASON === 'winter' ? '#f4f0e8' : LOOK.wood[0]), pickets, ([x, z, turn]) => m4.makeRotationY(turn).setPosition(x, 0, z));
  fence(new THREE.BoxGeometry(0.13, 0.82, 0.13), solid(LOOK.wood[2]), posts, ([x, z]) => m4.makeTranslation(x, 0.41, z));

  doors = doorsOf(base.house, 'yard').map(d => ({ ...d, tile: pipTile(here().shape, [d.side, d.at]) }));
  const stone = solid(LOOK.stone[1]), stoneTop = solid(LOOK.stone[0]);
  for (const d of doors) {
    addDoor(d, [stone, stone, stoneTop, stone, stone, stone]);
    // stepping stones from the doormat up onto the lawn
    for (let i = 0; i < 3; i++) {
      const o = add(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.3, 0.05, 14), stoneTop), tileX(d.tile.x) + (i % 2 ? 0.12 : -0.1), 0.012, tileZ(d.tile.y - i) + 0.1);
      o.scale.z = 0.85;
    }
  }

  if (SEASON === 'winter') {
    // as thick over the bigger yard (part e): the flakes spread over its size, more of them
    const N = Math.round(260 * (COLS + 8) * (ROWS + 6) / 280), pos = new Float32Array(N * 3), seeds = [];
    for (let i = 0; i < N; i++) {
      const s = [(rnd() - 0.5) * (COLS + 8), rnd() * 7, (rnd() - 0.5) * (ROWS + 6) - 1, rnd() * 100, 0.5 + rnd() * 0.6];
      seeds.push(s);
      pos.set(s.slice(0, 3), i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d'), r = g.createRadialGradient(8, 8, 0, 8, 8, 8);
    r.addColorStop(0, '#fff'); r.addColorStop(0.35, 'rgba(255,255,255,0.8)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 16, 16);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    snow = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.1, map, transparent: true, opacity: 0.95, depthWrite: false }));
    snow.userData.seeds = seeds;
    snow.raycast = () => {};
    roomGroup.add(snow);
  }
  roomGroup.traverse(o => { if (o.isMesh) { bendFine(o); for (const m of [o.material].flat()) bend(m, BEND); } });
}

/** Winter's flakes drifting down over the yard, wrapping back to the top, following the view across. */
function liveSnow(now) {
  snow.position.x = camX;
  if (calm) return;
  const t = now / 1000, p = snow.geometry.attributes.position;
  snow.userData.seeds.forEach(([x, y, z, ph, sp], i) => p.setXYZ(i, x + Math.sin(t * 0.6 * sp + ph) * 0.5, ((y - t * sp) % 7 + 7) % 7, z + Math.cos(t * 0.4 * sp + ph) * 0.3));
  p.needsUpdate = true;
}

/** Out in the yard, the Clearing's light for the hour (its season's tint too) under a sky fading down to the treetops. */
function yardLight(t) {
  const L = CLEARING_LIGHT[t], T = tintOf(SEASON, t), c = new THREE.Color(), bg = new THREE.Color(L.bg);
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.amb;
  sun.color.set(L.sun); sun.intensity = L.sunI; sun.position.set(...L.at);
  if (T?.bg) bg.lerp(c.set(T.bg[0]), T.bg[1]);
  if (T?.sky) hemi.color.lerp(c.set(T.sky[0]), T.sky[1]);
  if (T?.ground) hemi.groundColor.lerp(c.set(T.ground[0]), T.ground[1]);
  if (T?.sun) sun.color.lerp(c.set(T.sun[0]), T.sun[1]);
  const sky = document.createElement('canvas');
  sky.width = 2; sky.height = 256;
  const g = sky.getContext('2d'), v = g.createLinearGradient(0, 0, 0, 256);
  v.addColorStop(0, '#' + bg.clone().multiplyScalar(t === 'night' ? 0.55 : 0.75).getHexString());
  v.addColorStop(1, '#' + bg.clone().lerp(c.set('#ffffff'), t === 'night' ? 0.06 : 0.3).getHexString());
  g.fillStyle = v; g.fillRect(0, 0, 2, 256);
  const map = new THREE.CanvasTexture(sky);
  map.colorSpace = THREE.SRGBColorSpace;
  setSky(map);
}

const setSky = (b) => { if (scene.background?.isTexture) scene.background.dispose(); scene.background = b; };

/** Out in the yard, a piece rolls away with the lawn under it (BEND), as the trees and fence do. */
function bendOut(o) {
  if (BEND.k.value) o.traverse(c => { if (c.isMesh) for (const m of [c.material].flat()) bend(m, BEND); });
}

function buildPieces() {
  pieceGroup.traverse(o => { if (o.userData.play) stopPlay(o.userData.play); });
  forgetPlots();
  dispose(pieceGroup);
  blocked = new Set(); winMats = []; shafts = []; motes = [];
  giftBoard = null;
  if (visit) for (const t of visit.tiles) if (visit.phase !== 'leave') blocked.add(t);
  const lamps = [];
  base.items.forEach((it, i) => {
    const g = makePiece(it);
    g.userData.index = i;
    pieceGroup.add(g);
    if (PIECES[it.id].gift) { giftBoard = g.children[0]; giftBoard.userData.y0 = giftBoard.position.y; }
    if (g.userData.lamp) lamps.push(g.userData.lamp);
    if (PIECES[it.id].layer === 'wall' || PIECES[it.id].layer === 'rug' || it.up) return;
    const [fw, fh] = footprint(it);
    for (let x = 0; x < fw; x++) for (let y = 0; y < fh; y++) blocked.add(`${it.x + x},${it.y + y}`);
  });
  bendOut(pieceGroup);
  smallNoShadow(pieceGroup);
  lampLights.forEach((l, i) => { l.visible = i < lamps.length; if (lamps[i]) l.position.copy(lamps[i]); });
  if (mon && blocked.has(key(walker.tile.x, walker.tile.y))) {
    walker.tile = nearestFree(walker.tile);
    walker.x = tileX(walker.tile.x); walker.z = tileZ(walker.tile.y);
  }
  if (mon) walker.path = [];
  settleGuests();
  setTime(true);
}

/** One piece as a group of meshes in room space. A ghost is see-through and lights nothing. A piece up on a table
    stands at the table's top (`lift`, found from the room unless given), a little smaller. */
function makePiece(it, ghostly = false, lift = null) {
  const p = PIECES[it.id], group = new THREE.Group();
  const see = (m) => { if (ghostly) Object.assign(m, { transparent: true, opacity: 0.6, depthWrite: false }); return m; };
  const add = (geo, mat, shadow = true) => {
    for (const m of new Set([mat].flat())) see(m);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = shadow && !ghostly; mesh.receiveShadow = !ghostly;
    group.add(mesh);
    return mesh;
  };
  if (p.layer === 'wall' && shapeOf(p.fam, p)) {   // a modelled wall piece (js/base-models-w.js), its back to the wall
    const model = furnitureModel(THREE, it.id, (art) => {
      const m = new THREE.MeshStandardMaterial({ map: tex(art), roughness: 0.9 });
      // a window's pane is a crop of its painting: its sky glows by the hour as the flat one did
      if (p.glow && !ghostly) { m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = tex(mask(art, p.glow)); winMats.push(m); }
      return m;
    });
    if (ghostly) ownPictures(model); else bakeColours(model);
    model.traverse(o => { if (o.isMesh) { o.castShadow = !ghostly; o.receiveShadow = !ghostly; [o.material].flat().forEach(see); } });
    model.position.set(it.x - COLS / 2 + p.w / 2, 0, topOf(it.x) - ROWS / 2 + (ghostly ? 0.01 : 0));
    group.add(model);
    group.userData.model = model;
    if (p.fam === 'window' && !ghostly) addShaft(group, model.position.x, model.position.z);
    return group;
  }
  if (p.layer === 'wall') {
    const art = pieceArt(it.id, 0, HD), m = new THREE.MeshStandardMaterial({ map: tex(art), transparent: true, alphaTest: 0.5, roughness: 1 });
    if (p.glow && !ghostly) { m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = tex(mask(art, p.glow)); winMats.push(m); }
    const plane = add(new THREE.PlaneGeometry(p.w, WALL_H), m, false);
    plane.position.set(it.x - COLS / 2 + p.w / 2, WALL_H / 2, topOf(it.x) - ROWS / 2 + 0.01 + (ghostly ? 0.01 : 0));
    if (p.fam === 'window' && !ghostly) addShaft(group, plane.position.x, plane.position.z);
    return group;
  }
  const [fw, fh] = footprint(it);
  const cx = it.x - COLS / 2 + fw / 2, cz = it.y - ROWS / 2 + fh / 2;

  if (p.flat && !shapeOf(p.fam, p)) {
    const h = p.high, side = p.side;
    // alphaTest: a round rug's corners are clear, not black
    const top = new THREE.MeshStandardMaterial({ map: tex(pieceArt(it.id, 0, HD)), roughness: 0.9, alphaTest: 0.5 }), s = solid(side);
    const block = add(new THREE.BoxGeometry(p.w, h, p.h), [s, s, top, s, s, s], h > 0.1);
    block.position.set(cx, h / 2 + (ghostly ? 0.01 : 0), cz);
    block.rotation.y = -it.dir * Math.PI / 2;
    return group;
  }
  if (p.solid && !shapeOf(p.fam, p)) {
    const front = trim(pieceArt(it.id, 0, HD)), behind = trim(pieceArt(it.id, 2, HD));
    const h = front.h * PX, wood = solid(p.wood);
    const face = (a) => new THREE.MeshStandardMaterial({ map: tex(a.c), roughness: 1 });
    const block = add(new THREE.BoxGeometry(p.w, h, 0.8), [wood, wood, solid(p.woodLit), wood, face(front), face(behind)]);
    block.position.set(cx, h / 2, cz);
    block.rotation.y = -it.dir * Math.PI / 2;
    return group;
  }
  // everything else is a real 3D model (js/base-mesh.js), turned to its facing
  const model = furnitureModel(THREE, it.id, (art) => {
    const m = new THREE.MeshStandardMaterial({ map: tex(art), roughness: 0.9 });
    if (p.glow && !ghostly) { m.emissive = new THREE.Color('#ffd890'); m.emissiveMap = tex(mask(art, p.glow)); m.userData.lamp = true; }
    return m;
  });
  // a still piece's plain-coloured parts as one draw (2026-10-16: a room of 40 pieces drew 522 calls a frame, now 325)
  if (!ghostly && !model.userData.parts && !model.userData.doors) bakeColours(model);
  if (!ghostly) dressPlay(THREE, model, p);
  if (ghostly) ownPictures(model);
  model.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = o.castShadow !== false && !ghostly; o.receiveShadow = !ghostly;
    for (const m of [o.material].flat()) { see(m); if (m.userData.lamp && !ghostly) winMats.push(m); }
  });
  if (it.up && lift === null) { const under = base.items[surfaceUnder(it, base)]; lift = under ? surfaceOf(under.id) : 0; }
  const k = it.up ? RIDER : 1;
  model.scale.setScalar(k);
  model.position.set(cx, it.up ? lift : 0, cz);
  if (model.userData.standee) standees.add(model.userData.standee);
  model.rotation.y = -(it.dir ?? 0) * Math.PI / 2;
  group.add(model);
  group.userData.model = model;
  if (isPlot(p) && !ghostly) tendPlot(THREE, group, it, cx, cz);
  if (p.glow) group.userData.lamp = new THREE.Vector3(cx, model.position.y + model.userData.top * k - 0.35, cz + 0.3);
  return group;
}

/** A model's pictures (a machine's screen, a card's face) share one material with every copy of the piece, so the ghost
    takes its own before it is tinted and faded. */
function ownPictures(model) {
  model.traverse(o => { if (o.isMesh && o.material?.userData?.kind === 'pic') o.material = o.material.clone(); });
}

/** A soft shaft of light from the window down to the floor, drawn additive so bloom picks it up, and dust in it. */
function addShaft(group, x, wz) {
  const c = new OffscreenCanvas(32, 64), g = c.getContext('2d');
  const v = g.createLinearGradient(0, 0, 0, 64);
  v.addColorStop(0, 'rgba(255,240,200,0.9)'); v.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = v; g.fillRect(0, 0, 32, 64);
  g.globalCompositeOperation = 'destination-in';
  const h = g.createLinearGradient(0, 0, 32, 0);
  h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.3, 'rgba(0,0,0,1)'); h.addColorStop(0.7, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = h; g.fillRect(0, 0, 32, 64);
  const m = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.6), m);
  // from the window's sill out and down across the floor
  shaft.position.set(x, 1.15, wz + 1.6);
  shaft.rotation.x = -1.05;
  shaft.raycast = () => {};
  group.add(shaft);
  shafts.push(shaft);

  const n = 36, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = x + (Math.random() - 0.5) * 1.6;
    pos[i * 3 + 1] = Math.random() * 2.6;
    pos[i * 3 + 2] = wz + 0.4 + Math.random() * 2.6;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: '#fff0c0', size: 2, sizeAttenuation: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  dust.userData.base = pos.slice();
  dust.raycast = () => {};
  group.add(dust);
  motes.push(dust);
}

/* ---------- decorating ---------- */

// a wallpaper or floor being tried on is never saved: the room keeps the one it had
const save = () => saveBase(trying ? { ...base, [trying.field]: trying.was } : base);

/** Take down a wallpaper or floor that was only being tried on. */
function untry() {
  if (!trying) return;
  base[trying.field] = trying.was;
  trying = null;
  buildRoom();
}

/** Pick up a piece (from the tray, or `back` for one lifted off the floor, with `riders`, what stood on it): its ghost
    appears where it was, or in the middle of the view. What stood on it is carried along, kept where it stood. */
function hold(id, dir = 0, back = null, riders = []) {
  holding = { id, dir, back, riders: riders.map(r => ({ id: r.id, dir: r.dir ?? 0, dx: r.x - back.x, dy: r.y - back.y, was: r })) };
  sel = -1;
  follow = false; panX = camX;
  makeGhost();
  if (back) aimAt = PIECES[id].layer === 'wall' ? { x: back.x } : { x: back.x, y: back.y };
  else aimFrom(0, 0);
  showGhost();
  refresh();
}

function makeGhost() {
  if (ghost) { dispose(ghost); scene.remove(ghost); }
  const wall = PIECES[holding.id].layer === 'wall';
  ghost = makePiece(wall ? { id: holding.id, x: 0 } : { id: holding.id, x: 0, y: 0, dir: holding.dir }, true);
  for (const r of holding.riders) ghost.add(makePiece({ id: r.id, x: r.dx, y: r.dy, dir: r.dir, up: 1 }, true, surfaceOf(holding.id)));
  bendOut(ghost);
  scene.add(ghost);
  const [fw, fh] = wall ? [PIECES[holding.id].w, WALL_H] : footprint({ id: holding.id, dir: holding.dir });
  foot.scale.set(fw, fh, 1);
  foot.rotation.x = wall ? 0 : -Math.PI / 2;
}

/** Where the ghost goes for a point on the view (in NDC): the floor tile under it, or for a wall piece the wall. */
function aimFrom(nx, ny) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
  let hit = new THREE.Vector3();
  const p = PIECES[holding.id];
  // out on the lawn, the tile under the finger is where the rolling lawn is drawn (groundHit())
  if (p.layer !== 'wall') hit = groundHit(ray.ray);
  else if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), ROWS / 2), hit)) hit = groundHit(ray.ray);
  if (!hit) return;
  aimAt = aimTile(holding.id, holding.dir, hit.x + COLS / 2, hit.z + ROWS / 2);
}

// a small piece aimed at a table goes up on it
const held = () => PIECES[holding.id].layer === 'wall' ? { id: holding.id, x: aimAt.x }
  : standing({ id: holding.id, x: aimAt.x, y: aimAt.y, dir: holding.dir }, base);

/** Lift a placed piece into your hand, and what stands on it with it. */
function pickUp(it) {
  const riders = ridersOf(it, base);
  base.items = base.items.filter(o => o !== it && !riders.includes(o));
  buildPieces();
  hold(it.id, it.dir ?? 0, it, riders);
}

/** The riders' tiles turned with their table: (dx, dy) on a table fw x fh turns to (fh - 1 - dy, dx). */
function turnRiders(riders, fw, fh) {
  for (const r of riders) { [r.dx, r.dy] = [fh - 1 - r.dy, r.dx]; r.dir = (r.dir + 1) % 4; }
}

function showGhost() {
  if (!ghost || !aimAt) return;
  const it = held(), wall = PIECES[it.id].layer === 'wall';
  // lifted a little, as if held, and tinted, since a ghost over a piece of the same shape would look just like it; up on a
  // table it shows at the table's top and the size it will be
  ghost.position.set(it.x, wall ? 0 : 0.08, wall ? topOf(it.x) - topOf(0) : it.y);
  const model = ghost.userData.model, under = it.up ? base.items[surfaceUnder(it, base)] : null;
  if (model) { model.scale.setScalar(under ? RIDER : 1); model.position.y = under ? surfaceOf(under.id) - 0.06 : 0; }
  const [fw, fh] = wall ? [PIECES[it.id].w, 0] : footprint(it), ok = fits(it, -1, base);
  if (wall) foot.position.set(it.x - COLS / 2 + fw / 2, WALL_H / 2, topOf(it.x) - ROWS / 2 + 0.03);
  else foot.position.set(it.x - COLS / 2 + fw / 2, under ? surfaceOf(under.id) + 0.02 : 0.025, it.y - ROWS / 2 + fh / 2);
  foot.material.color.set(ok ? '#60e080' : '#ff5050');
  const tint = new THREE.Color(ok ? '#b0ffc0' : '#ff8080');
  ghost.traverse(o => { for (const m of [o.material].flat()) if (m?.color) m.color.copy(m.userData.own ??= m.color.clone()).multiply(tint); });
  foot.visible = true;
}

function place() {
  if (!holding || !aimAt) return;
  const it = held();
  if (holding.back?.crop) it.crop = holding.back.crop;
  if (!fits(it, -1, base)) {
    playSound('cancel');
    // a piece dragged straight off the floor goes back where it was, rather than staying in your hand
    if (holding.dragged) { const back = holding.back; base.items.push(back, ...holding.riders.map(r => r.was)); dropHold(); sel = base.items.indexOf(back); buildPieces(); refresh(); }
    return;
  }
  base.items.push(it, ...holding.riders.map(r => ({ id: r.id, x: it.x + r.dx, y: it.y + r.dy, dir: r.dir, up: 1 })));
  const at = base.items.indexOf(it);
  dropHold();
  sel = at;
  playSound('confirm');
  save();
  buildPieces();
  refresh();
}

function dropHold() {
  holding = null; aimAt = null; foot.visible = false;
  if (ghost) { dispose(ghost); scene.remove(ghost); ghost = null; }
}

function act(kind) {
  if (holding) {
    if (kind === 'rotate' && PIECES[holding.id].layer !== 'wall') {
      turnRiders(holding.riders, ...footprint({ id: holding.id, dir: holding.dir }));
      holding.dir = (holding.dir + 1) % 4;
      makeGhost();
      const [fw, fh] = footprint({ id: holding.id, dir: holding.dir });
      if (aimAt) { aimAt.x = Math.min(aimAt.x, COLS - fw); aimAt.y = Math.min(aimAt.y, ROWS - fh); }
      showGhost();
    }
    if (kind === 'paint') { tray(tab === 'colour' ? 'furniture' : 'colour'); playSound('select'); }
    if (kind === 'cancel') {
      if (holding.back) { base.items.push(holding.back, ...holding.riders.map(r => r.was)); buildPieces(); }
      dropHold();
      playSound('cancel');
      if (tab === 'colour') tab = 'furniture';
    }
    return refresh();
  }
  const it = base.items[sel];
  if (!it) return;
  if (kind === 'rotate') {
    const turned = { ...it, dir: (it.dir + 1) % 4 }, riders = ridersOf(it, base);
    const [fw, fh] = footprint(turned);
    turned.x = Math.min(turned.x, COLS - fw); turned.y = Math.min(turned.y, ROWS - fh);
    if (fits(turned, sel, base)) {
      // what stands on a table turns with it
      const moved = riders.map(r => ({ id: r.id, dir: r.dir ?? 0, dx: r.x - it.x, dy: r.y - it.y }));
      turnRiders(moved, fh, fw);
      base.items = base.items.filter(o => !riders.includes(o));
      base.items[base.items.indexOf(it)] = turned;
      base.items.push(...moved.map(r => ({ id: r.id, x: turned.x + r.dx, y: turned.y + r.dy, dir: r.dir, up: 1 })));
      sel = base.items.indexOf(turned);
      save(); buildPieces(); playSound('confirm');
    } else playSound('cancel');
  }
  if (kind === 'paint') { tray(tab === 'colour' ? 'furniture' : 'colour'); playSound('select'); return refresh(); }
  if (kind === 'move') { pickUp(it); return; }
  if (kind === 'store') { const gone = [it, ...ridersOf(it, base)]; base.items = base.items.filter(o => !gone.includes(o)); sel = -1; playSound('cancel'); save(); buildPieces(); }
  if (kind === 'done') sel = -1;
  if (sel < 0 && tab === 'colour') tab = 'furniture';
  refresh();
}

/** A Pokémon on a billboard in the room: the partner (front and back GIFs), or a Safari guest (front only). */
async function makeMon(mate = buddy(getSave()), back = true) {
  const m = await monBoard(mate, back);
  scene.add(m.group);
  return m;
}

/* ---------- walking ---------- */

const key = (x, y) => `${x},${y}`;
const inRoom = (c) => c.x >= 0 && c.y >= 0 && c.x < COLS && c.y < ROWS && onFloor(c.x, c.y);
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
      if (!inRoom(n) || blocked.has(k) || prev.has(k)) continue;
      prev.set(k, c); queue.push(n);
    }
  }
  const path = [];
  for (let c = best; c && key(c.x, c.y) !== key(from.x, from.y); c = prev.get(key(c.x, c.y))) path.unshift(c);
  return path;
}

/** The free tile nearest this one, through furniture: where the partner hops to when something is put on it. */
function nearestFree(from) {
  const seen = new Set([key(from.x, from.y)]), queue = [from];
  while (queue.length) {
    const c = queue.shift();
    if (!blocked.has(key(c.x, c.y))) return c;
    for (const [dx, dy] of STEPS) {
      const n = { x: c.x + dx, y: c.y + dy };
      if (inRoom(n) && !seen.has(key(n.x, n.y))) { seen.add(key(n.x, n.y)); queue.push(n); }
    }
  }
  return from;
}

/** One step along `w.path`; true on the frame it arrives. */
function walk(w, m, dt, speed = 3.2) {
  const step = w.path[0];
  if (!step) { w.hop = 0; return false; }
  const tx = tileX(step.x), tz = tileZ(step.y), dx = tx - w.x, dz = tz - w.z;
  const d = Math.hypot(dx, dz), move = dt / 1000 * speed;
  if (Math.abs(dz) > Math.abs(dx)) w.facing = dz < 0 && m.sheets.back ? 'back' : 'front';
  else { w.facing = 'front'; w.flip = dx > 0; }
  if (d <= move) { w.x = tx; w.z = tz; w.tile = step; w.path.shift(); }
  else { w.x += dx / d * move; w.z += dz / d * move; }
  w.hop += dt;
  return !w.path.length;
}

/* ---------- the Safari Pokémon living here ---------- */

const rand = (a, b) => a + Math.random() * (b - a);

/** The catches on show: the save's pick, or before one is made the first onShowMax() caught, so the room is never empty.
    `&guests` lends every Safari Pokémon as caught for the page load, to playtest without a full Safari Pokédex. */
function onShow() {
  const lend = new URLSearchParams(location.search).has('guests');
  const caught = new Set(getSave().safariDex?.caught || []);
  const all = [...new Set(SAFARI_DEX_PAGES.flatMap(p => p.ids))].filter(id => (lend || caught.has(id)) && ENEMY_DEFS[id]);
  return { all, shown: (base.mons ?? all.slice(0, onShowMax())).filter(id => all.includes(id)) };
}

/** Whether a resident lives out in the yard (let out on the yard's Pokémon tab) rather than indoors. */
const livesOut = (id) => !!roomById(base.house, 'yard') && !!base.out?.includes(id);
/** The guests in the room you're in: out in the yard the ones let out, indoors the rest. */
const homeHere = (g) => livesOut(g.id) === outdoors();
const present = () => guests.filter(g => g.w && homeHere(g));

/** Tiles someone stands on or is heading for, so two never pick the same one. */
function taken(skip) {
  const out = new Set();
  for (const w of [walker, ...present().map(g => g.w), visit?.w]) {
    if (!w || w === skip || !w.tile) continue;
    out.add(key(w.tile.x, w.tile.y));
    const end = w.path.at(-1);
    if (end) out.add(key(end.x, end.y));
  }
  return out;
}

function freeTiles(skip) {
  const busy = taken(skip), out = [];
  for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (onFloor(x, y) && !blocked.has(key(x, y)) && !busy.has(key(x, y))) out.push({ x, y });
  return out;
}

/** Bring the room's guests in line with the pick: new ones load in (a hop and hearts as they arrive), dropped ones go. */
function syncGuests() {
  const { shown } = onShow();
  for (const g of guests.filter(g => !shown.includes(g.id))) dropGuest(g);
  for (const id of shown) if (!guests.some(g => g.id === id)) addGuest(id);
}

function dropGuest(g) {
  guests = guests.filter(x => x !== g);
  if (g.mon) { dispose(g.mon.group); scene.remove(g.mon.group); }
}

async function addGuest(id) {
  const def = resident(id), g = { id, mon: null, w: null };
  guests.push(g);
  const m = await makeMon({ src: def.image, name: def.name, cry: def.cry }, false);
  if (!guests.includes(g)) { dispose(m.group); scene.remove(m.group); return; }
  const spots = freeTiles();
  const tile = spots.length ? spots[Math.floor(Math.random() * spots.length)] : nearestFree(startTile());
  g.w = { tile, x: tileX(tile.x), z: tileZ(tile.y), y: 0, path: [], facing: 'front', flip: Math.random() < 0.5, hop: 0, think: performance.now() + rand(800, 3000) };
  m.board.userData.who = g;
  g.mon = m;
  m.group.visible = homeHere(g);
  if (homeHere(g)) cheer(g, 2);
}

/** Out to the yard or back in, from the yard's Pokémon tab: let out, it hops in on a free patch of lawn with hearts;
    called in, it's off its seat and gone in a twinkle. */
function letOut(id) {
  const g = guests.find(x => x.id === id), w = g?.w;
  if (!w) return;
  if (!homeHere(g)) {
    for (let i = 0; i < 4; i++) setTimeout(() => puff('star', { x: w.x + rand(-0.3, 0.3), y: w.y, z: w.z }, { top: rand(0.1, 0.5) }), i * 60);
    Object.assign(w, { seat: null, goal: null, jump: null, sleeping: false, path: [], y: 0 });
    return;
  }
  const spots = freeTiles(w), t = spots.length ? spots[Math.floor(Math.random() * spots.length)] : nearestFree(walker.tile);
  Object.assign(w, { seat: null, goal: null, jump: null, sleeping: false, path: [], y: 0, tile: t, x: tileX(t.x), z: tileZ(t.y), think: performance.now() + rand(1500, 3500) });
  cheer(g, 3);
}

/** The places on a piece a Pokémon can sit: a bed or a cushion its middle; a chair, sofa or bench one a tile, a
    little towards its front, at its seat's height (js/base-shapes.js); a yard piece where YARD_SPOTS says. */
function seatSpots(it) {
  const p = PIECES[it.id], [fw, fh] = footprint(it), y = seatHeight(p.fam, p) || p.high || 0;
  if (YARD_SPOTS[p.fam]) {
    const a = -(it.dir ?? 0) * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), cx = it.x - COLS / 2 + fw / 2, cz = it.y - ROWS / 2 + fh / 2;
    const { swim, swing } = YARD_SEATS[p.fam] || {}, clamp = (v, lo, n) => Math.min(lo + n - 1, Math.max(lo, v));
    return YARD_SPOTS[p.fam].map(([lx, sy, lz, part]) => {
      const x = cx + lx * c + lz * s, z = cz - lx * s + lz * c;
      return { x, y: sy, z, part, swim, swing, tile: { x: clamp(Math.floor(x + COLS / 2), it.x, fw), y: clamp(Math.floor(z + ROWS / 2), it.y, fh) } };
    });
  }
  if (p.seat) return [{ x: it.x - COLS / 2 + fw / 2, z: it.y - ROWS / 2 + fh / 2, y, tile: { x: it.x + Math.floor((fw - 1) / 2), y: it.y + Math.floor((fh - 1) / 2) } }];
  const a = -(it.dir ?? 0) * Math.PI / 2, fx = Math.sin(a) * 0.1, fz = Math.cos(a) * 0.1, out = [];
  for (let i = 0; i < fw; i++) for (let j = 0; j < fh; j++) out.push({ x: it.x + i + 0.5 - COLS / 2 + fx, z: it.y + j + 0.5 - ROWS / 2 + fz, y, tile: { x: it.x + i, y: it.y + j } });
  return out;
}

/** Every free place to sit in the room: { it, k } for spot k of piece it, none someone's on or heading for. */
function seats() {
  const used = new Set([walker, ...present().map(g => g.w), visit?.w].map(w => w?.seat ?? w?.seatTo).filter(Boolean).map(s => `${base.items.indexOf(s.it)}:${s.k}`));
  return base.items.flatMap((it, i) => seatOf(it.id) ? seatSpots(it).map((_, k) => ({ it, k })).filter(s => !used.has(`${i}:${s.k}`)) : []);
}

const nextTo = (t, it) => {
  const [fw, fh] = footprint(it);
  const dx = Math.max(it.x - t.x, 0, t.x - (it.x + fw - 1)), dy = Math.max(it.y - t.y, 0, t.y - (it.y + fh - 1));
  return dx + dy === 1;
};

/** A hop from where it is to (x, y, z) over `ms`, then `then()`. */
function leap(w, to, ms, then) {
  w.jump = { from: { x: w.x, y: w.y ?? 0, z: w.z }, to, t0: performance.now(), ms, then };
  if (Math.abs(to.x - w.x) > 0.05) w.flip = to.x > w.x;
  w.facing = 'front';
}

/** A hop under way, a frame of it; false when there's none. */
function hopping(w, now) {
  const j = w.jump;
  if (!j) return false;
  const k = Math.min(1, (now - j.t0) / j.ms);
  w.x = j.from.x + (j.to.x - j.from.x) * k; w.z = j.from.z + (j.to.z - j.from.z) * k;
  w.y = j.from.y + (j.to.y - j.from.y) * k + (calm ? 0 : Math.sin(k * Math.PI) * 0.45);
  if (k >= 1) { w.jump = null; w.y = j.to.y; j.then?.(); }
  return true;
}

/* Your partner sits where you tap (the user's ask, 2026-10-09): a tap on a chair, sofa, bench, bed or cushion walks it
   there and up it hops; a tap on the floor gets it down and walking. */

const swimmer = (g) => ENEMY_DEFS[g.id]?.type === 'water';

/** The free seats a guest would take: a Water type the water (where there's a pond or pool), the rest anything but. */
function seatsFor(g) {
  const free = seats(), wet = (s) => !!seatOf(s.it.id).swim;
  if (!swimmer(g)) return free.filter(s => !wet(s));
  return base.items.some(it => seatOf(it.id)?.swim) ? free.filter(wet) : free;
}

/** Walk your partner to a seat on `it` (the free spot nearest it) and sit; false if there's none or no way there. */
function sitPartner(it) {
  const free = seats().filter(s => s.it === it);
  if (!free.length) return false;
  const spots = seatSpots(it), dist = (s) => Math.hypot(spots[s.k].x - walker.x, spots[s.k].z - walker.z);
  const { k } = free.sort((a, b) => dist(a) - dist(b))[0], spot = spots[k];
  const go = () => {
    const path = route(walker.tile, spot.tile), end = path.at(-1) ?? walker.tile;
    if (!nextTo(end, it)) return;
    walker.path = path; walker.goal = it; walker.seatTo = { it, k, ...spot };
    if (!path.length) partnerUp();
  };
  follow = true;
  if (walker.seat) getUp(go); else go();
  playSound('confirm');
  return true;
}

/** Up onto the seat it walked to, if it's still there. */
function partnerUp() {
  const to = walker.seatTo, it = walker.goal;
  walker.goal = null;
  if (!to || !base.items.includes(it) || !nextTo(walker.tile, it)) { walker.seatTo = null; return; }
  walker.from = walker.tile;
  leap(walker, { x: to.x, y: to.y, z: to.z }, 450, () => { walker.seat = to; walker.seatTo = null; });
}

/** Down off its seat to where it climbed up from (or the nearest free tile), then `then()`. */
function getUp(then) {
  const s = walker.seat;
  if (!s) return then?.();
  walker.seat = null;
  const down = walker.from && !blocked.has(key(walker.from.x, walker.from.y)) ? walker.from : nearestFree(s.tile);
  leap(walker, { x: tileX(down.x), y: 0, z: tileZ(down.y) }, 380, () => { walker.tile = down; then?.(); });
}

/** A guest with nothing to do picks something: off its seat when its rest is up, onto a free seat now and then, or a
    short wander. */
function think(g, now) {
  const w = g.w;
  if (w.seat) {
    w.sleeping = false;
    const down = w.from && !blocked.has(key(w.from.x, w.from.y)) && !taken(w).has(key(w.from.x, w.from.y)) ? w.from : nearestFree(w.seat.tile);
    if (w.seat.swim) splash(w);
    w.seat = null;
    leap(w, { x: tileX(down.x), y: 0, z: tileZ(down.y) }, 420, () => { w.tile = down; w.think = now + rand(1500, 4000); });
    return;
  }
  const free = seatsFor(g);
  if (free.length && Math.random() < (outdoors() ? 0.5 : 0.35)) {
    const { it, k } = free[Math.floor(Math.random() * free.length)], spot = seatSpots(it)[k];
    const path = route(w.tile, spot.tile), end = path.at(-1) ?? w.tile;
    if (nextTo(end, it)) { w.path = path; w.goal = it; w.seat = { it, k, ...spot }; if (!path.length) climb(w, now); return; }
  }
  const near = freeTiles(w).filter(t => { const d = Math.abs(t.x - w.tile.x) + Math.abs(t.y - w.tile.y); return d > 0 && d <= 4; });
  if (near.length) w.path = route(w.tile, near[Math.floor(Math.random() * near.length)]);
  w.think = now + rand(2500, 6000) + w.path.length * 450;
}

/** At the seat it walked to: still there and still free, up it hops; else it just stands about. */
function climb(w, now) {
  const it = w.goal;
  w.goal = null;
  if (!base.items.includes(it) || !nextTo(w.tile, it)) { w.seat = null; w.think = now + rand(1000, 3000); return; }
  w.from = w.tile;
  const s = seatOf(it.id);
  leap(w, { x: w.seat.x, y: w.seat.y, z: w.seat.z }, 450, () => {
    const at = performance.now();
    if (!base.items.includes(it)) { w.think = at; return; }   // moved from under it mid-hop: straight back down
    w.sleeping = !!s.sleep; w.think = at + rand(...s.rest); w.nextZ = at + 600;
    if (s.swim) splash(w);
  });
}

/** Droplets off the water as a swimmer dives in or climbs out. */
function splash(w) {
  if (calm) return;
  for (let i = 0; i < 5; i++) setTimeout(() => puff('drop', { x: w.x + rand(-0.25, 0.25), y: w.y, z: w.z }, { top: rand(0.05, 0.3) }), i * 50);
}

/** The swings: one with a Pokémon on swings higher and carries it, an empty one comes to rest. */
function liveSwings(dt, now) {
  const on = new Map();
  for (const w of [walker, ...present().map(g => g.w)]) if (w?.seat?.part && !w.jump) on.set(`${base.items.indexOf(w.seat.it)}:${w.seat.part}`, w);
  for (const pg of pieceGroup.children) {
    const parts = pg.userData.model?.userData.parts;
    if (!parts) continue;
    for (const [name, part] of Object.entries(parts)) {
      const w = on.get(`${pg.userData.index}:${name}`), u = part.userData;
      u.amp = Math.max(0, Math.min(0.42, (u.amp ?? 0) + (w ? 0.18 : -0.12) * dt / 1000));
      u.phase = (u.phase ?? 0) + dt / 1000 * Math.PI * 2 / 1.7;
      part.rotation.x = calm ? 0 : Math.sin(u.phase) * u.amp;
      if (!w) continue;
      part.updateMatrixWorld(true);
      const at = part.localToWorld(new THREE.Vector3(0, w.seat.y - part.position.y, 0));
      w.x = at.x; w.y = at.y; w.z = at.z;
    }
  }
}

/** After the furniture changes: anyone on a seat that went comes down, walks are forgotten, and no one stands in a piece. */
function settleGuests() {
  // your partner off a seat that went or moved
  if (walker.seat && !base.items.includes(walker.seat.it)) {
    const down = nearestFree(walker.seat.tile);
    Object.assign(walker, { seat: null, y: 0, tile: down, x: tileX(down.x), z: tileZ(down.y) });
  }
  if (walker.goal) { walker.goal = null; walker.seatTo = null; walker.path = []; }
  // a visiting friend off a seat that went or moved, standing where they land
  const vw = visit?.w;
  if (vw?.seat && !base.items.includes(vw.seat.it)) {
    const down = nearestFree(vw.seat.tile);
    Object.assign(vw, { seat: null, y: 0, tile: down, x: tileX(down.x), z: tileZ(down.y) });
  }
  for (const { w } of present()) {
    if (w.jump) continue;
    if (w.goal) { w.goal = null; w.seat = null; }
    w.path = [];
    if (w.seat && !base.items.includes(w.seat.it)) {
      const down = nearestFree(w.seat.tile);
      Object.assign(w, { seat: null, sleeping: false, y: 0, tile: down, x: tileX(down.x), z: tileZ(down.y) });
    }
    if (!w.seat && blocked.has(key(w.tile.x, w.tile.y))) {
      w.tile = nearestFree(w.tile);
      w.x = tileX(w.tile.x); w.z = tileZ(w.tile.y);
    }
  }
}

function liveGuest(g, dt, now) {
  const { w, mon: m } = g;
  if (hopping(w, now)) {
    // mid-hop
  } else if (w.path.length) {
    if (walk(w, m, dt, 2.2) && w.goal) climb(w, now);
  } else if (now > w.think) think(g, now);
  // a swimmer bobs where it floats
  if (w.seat?.swim && !w.jump && !calm) w.y = w.seat.y + Math.sin(now / 520 + g.id.length) * 0.03;
  if (w.sleeping && now > w.nextZ) { w.nextZ = now + 1400; puff('z', w, m); }
  const happy = w.hopUntil > now;
  const bob = calm ? 0 : w.path.length ? Math.abs(Math.sin(w.hop / 1000 * Math.PI * 4)) * 0.06 : happy ? Math.abs(Math.sin((w.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  m.group.position.set(w.x, w.y, w.z);
  m.board.position.y = bob;
  m.board.scale.x = w.flip ? -1 : 1;
  drawMon(m, w, dt);
}

/** A guest happy to see you: its cry, a hop and hearts; a sleeper wakes and gets down. */
function cheer(g, hearts = 3) {
  const w = g.w;
  if (!w) return;
  playCry(g.mon.id);
  if (!w.jump && !w.seat) w.hopUntil = performance.now() + 500;
  for (let i = 0; i < hearts; i++) setTimeout(() => puff('heart', w, g.mon), i * 160);
  if (w.sleeping) w.think = performance.now() + 500;
}

/* ---------- the present ---------- */

function unwrap(i) {
  if (unwrapping) return;
  playSound('catch-shake');
  unwrapping = { it: base.items[i], t0: performance.now() };
}

function liveGift(now) {
  if (!giftBoard) return;
  if (unwrapping) {
    const k = (now - unwrapping.t0) / 900;
    if (k < 1 && !calm) { giftBoard.rotation.z = Math.sin(k * Math.PI * 6) * 0.22 * (1 - k * 0.5); return; }
    const it = unwrapping.it, at = { x: tileX(it.x), y: 0, z: tileZ(it.y) };
    unwrapping = null;
    const got = openGift(base);
    buildPieces();
    playSound('item-get');
    for (let i = 0; i < 8; i++) setTimeout(() => puff('star', { x: at.x + rand(-0.4, 0.4), y: 0, z: at.z }, { top: rand(0.1, 0.6) }), i * 70);
    showGiftCard(got);
    return;
  }
  if (!calm) giftBoard.position.y = giftBoard.userData.y0 + Math.abs(Math.sin(now / 280)) * 0.07;
}

/** What was in the present, its pieces popping in one by one, and a key straight into decorating. */
function showGiftCard(got) {
  const card = root.querySelector('.b3-gift'), row = card.querySelector('.b3-gift-row');
  row.replaceChildren();
  const counts = got.reduce((m, id) => m.set(id, (m.get(id) || 0) + 1), new Map());
  [...counts].forEach(([id, n], i) => {
    const pic = Object.assign(document.createElement('span'), { className: 'b3-pic' });
    pic.style.animationDelay = `${0.25 + i * 0.08}s`;
    pic.append(icon(id));
    if (n > 1) pic.append(Object.assign(document.createElement('i'), { className: 'b3-tag', textContent: `×${n}` }));
    row.append(pic);
  });
  card.hidden = false;
  refresh();
}

/* ---------- Smeargle's housewarming ---------- */

/* The first time in, Smeargle is at an easel painting; it turns, says it is opening a shop at the Poké Mall that opens
   tomorrow (meetSmeargle() in js/secret-base.js, saved at SAVED_AT), then packs up and walks out over the doormat. */
const SMEARGLE = { id: 'smeargle', name: 'Smeargle', src: 'assets/pokemon/smeargle-front.gif', cry: 'smeargle' };
const DABS = ['#e84838', '#f8c830', '#3a8ad8', '#58b858', '#c868d8', '#f88838'];
const SAVED_AT = 4;
let visit = null;   // { mon, w, easel, tiles, lines, i, phase: paint / stand / talk / leave, t, dab, leader }
const visitLines = () => [
  'Oh! Hello there! You must be the one who lives here. Welcome home!',
  'I\'m Smeargle. I was passing by and couldn\'t help giving the walls a fresh coat. Hope you don\'t mind!',
  'Painting furniture is my thing, you see. Beds, sofas, lamps... every piece, in every colour, all with my tail.',
  'So I\'m opening a furniture shop at the Poké Mall! New pieces on the stands every day.',
  'The paint on the sign is still wet, though. Come by tomorrow and the doors will be open!',
  ...(giftBoard ? ['Oh, and that present? It\'s from me. A little housewarming gift!'] : []),
  'See you at the shop!',
];

/** Two free tiles side by side near the middle of the back: Smeargle, then its easel to its right. */
function visitSpot() {
  const busy = taken(), ok = (t) => inRoom(t) && !blocked.has(key(t.x, t.y)) && !busy.has(key(t.x, t.y)) && !doors.some(d => Math.abs(d.tile.x - t.x) + Math.abs(d.tile.y - t.y) < 2);
  for (const y of [1, 2, 0, 3]) for (const x of [6, 7, 4, 3, 5, 8, 2, 1]) if (ok({ x, y }) && ok({ x: x + 1, y })) return { x, y };
  return null;
}

async function startVisit() {
  if (visit || yardTalk) return;
  if (outdoors()) return yardIntro();
  if (base.here) return;
  if (metSmeargle(base)) return leaderVisit();
  const spot = visitSpot();
  if (!spot) return;
  visit = { phase: 'load', tiles: [key(spot.x, spot.y), key(spot.x + 1, spot.y)] };
  const v = visit;
  for (const t of v.tiles) blocked.add(t);
  root.classList.add('visiting');
  refresh();
  const m = await makeMon(SMEARGLE, false);
  if (visit !== v) { dispose(m.group); scene.remove(m.group); return; }
  if (PIECES.easel) { v.easel = makePiece({ id: 'easel', x: spot.x + 1, y: spot.y, dir: 0 }); scene.add(v.easel); }
  const top = v.easel ? new THREE.Box3().setFromObject(v.easel).max.y : 1.6;
  Object.assign(v, { mon: m, canvasAt: [tileX(spot.x + 1), top * 0.72, tileZ(spot.y) + 0.12], phase: 'paint', t: performance.now() + 2200, dab: 0,
    w: { tile: spot, x: tileX(spot.x), z: tileZ(spot.y), y: 0, path: [], facing: 'front', flip: true, hop: 0 } });
}

/* A Gym Leader or a friend dropping by (leaderVisitor() in js/secret-base.js): they stand about in the room until you
   tap them, say their piece in the same speech window, and walk out over the doormat. A best friend (`sit`, 5 hearts)
   walks in over it and sits on one of your seats instead, and gets down to leave. */
const TRAINER_PX = 1 / 34;   // a trainer's sprite pixel, as in the walk-in rooms (js/event-3d.js)

async function leaderVisit() {
  const l = leaderVisitor(base);
  if (!l) return;
  const seat = l.sit && visitSeat(), spot = !seat && visitSpot();
  if (!seat && !spot) return;
  visit = { leader: l, phase: 'load', tiles: spot ? [key(spot.x, spot.y)] : [] };
  const v = visit;
  for (const t of v.tiles) blocked.add(t);
  const m = await makeMon({ src: spriteOf(l), name: l.name, cry: '', px: TRAINER_PX }, false);
  if (visit !== v) { dispose(m.group); scene.remove(m.group); return; }
  m.board.userData.who = { mon: m };
  if (!seat) Object.assign(v, { mon: m, phase: 'stand', w: { tile: spot, x: tileX(spot.x), z: tileZ(spot.y), y: 0, path: [], facing: 'front', flip: false, hop: 0 } });
  else {
    // a best friend lets themselves in over the doormat and makes for the seat
    const door = { x: Math.floor(COLS / 2), y: ROWS - 1 };
    Object.assign(v, { mon: m, phase: 'walkin', goal: seat.it,
      w: { tile: door, x: tileX(door.x), z: tileZ(ROWS + 0.6), y: 0, path: [door, ...seat.path], facing: 'back', flip: false, hop: 0, seatTo: seat.spot } });
    playSound('door');
  }
  refresh();
}

/** A best friend's seat: a free chair, sofa, bench or cushion they can walk to from the door (never your bed), with the
    way there; null if there's none. */
function visitSeat() {
  const door = { x: Math.floor(COLS / 2), y: ROWS - 1 };
  const free = seats().filter(s => !seatOf(s.it.id).sleep).sort(() => Math.random() - 0.5);
  for (const { it, k } of free) {
    const spot = seatSpots(it)[k], path = route(door, spot.tile), end = path.at(-1) ?? door;
    if (nextTo(end, it) && !taken().has(key(end.x, end.y))) return { it, path, spot: { it, k, ...spot } };
  }
  return null;
}

/** Their lines for this visit: one of their `visit` speeches, a word on their poster if it's up. A line's LAW: / JONA:
    tag is who says it (the name over the speech window); untagged, the visitor. */
function leaderLines(l) {
  const said = l.visit[Math.floor(Math.random() * l.visit.length)];
  const lines = postersUp(base, l.id) && l.posterSeen ? [said[0], l.posterSeen, ...said.slice(1)] : said;
  const vars = { name: l.name, badge: l.badge, trainer: trainerName().toUpperCase() };
  return lines.map(line => line.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m));
}

function leaderTalk() {
  const { w, leader: l } = visit, now = performance.now();
  Object.assign(visit, { phase: 'talk', lines: leaderLines(l), i: -1 });
  w.hopUntil = now + 500;
  walker.hopUntil = now + 500;
  root.querySelector('.b3-talk b').textContent = l.name;
  root.classList.add('visiting');
  playSound('select');
  sayNext();
}

function liveVisit(dt, now) {
  if (!visit?.mon) return;
  const { w, mon: m } = visit;
  let bob = 0;
  if (hopping(w, now)) {
    // onto the seat, or down off it on the way out
  } else if (visit.phase === 'walkin') {
    if (walk(w, m, dt, 2.4)) sitVisitor();
    bob = calm ? 0 : Math.abs(Math.sin(w.hop / 1000 * Math.PI * 4)) * 0.06;
  } else if (visit.phase === 'paint') {
    if (now > visit.dab) { visit.dab = now + rand(320, 600); dab(); }
    bob = calm ? 0 : Math.abs(Math.sin(now / 160)) * 0.06;
    if (now > visit.t) startTalk(now);
  } else if (visit.phase === 'leave') {
    if (walk(w, m, dt, 2.6)) { playSound('door'); return endVisit(); }
    bob = calm ? 0 : Math.abs(Math.sin(w.hop / 1000 * Math.PI * 4)) * 0.06;
  } else if (w.hopUntil > now && !calm) bob = Math.abs(Math.sin((w.hopUntil - now) / 500 * Math.PI * 2)) * 0.3;
  m.group.position.set(w.x, w.y, w.z);
  m.board.position.y = bob;
  m.board.scale.x = w.flip ? -1 : 1;
  drawMon(m, w, dt);
}

/** At the seat they walked to: up they hop and sit, ready to talk; if it went or someone took it, they stand there. */
function sitVisitor() {
  const v = visit, { w } = v, it = v.goal, to = w.seatTo;
  v.goal = null; w.seatTo = null;
  if (!to || !base.items.includes(it) || !nextTo(w.tile, it)) { v.phase = 'stand'; refresh(); return; }
  w.from = w.tile;
  leap(w, { x: to.x, y: to.y, z: to.z }, 450, () => { if (visit === v) { w.seat = to; w.flip = walker.x > w.x; } });
  v.phase = 'stand';
  refresh();
}

/** A dab of paint flicked off Smeargle's tail onto the easel's canvas. */
function dab() {
  const colour = DABS[Math.floor(Math.random() * DABS.length)], k = `dab${colour}`;
  if (!puffTex[k]) {
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d');
    g.fillStyle = colour; g.beginPath(); g.arc(8, 8, 6.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(6, 5.5, 2, 0, Math.PI * 2); g.fill();
    puffTex[k] = tex(c);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex[k], transparent: true, depthWrite: false }));
  s.scale.set(0.11, 0.11, 1);
  s.raycast = () => {};
  scene.add(s);
  const { w, mon: m, canvasAt: [cx, cy, cz] } = visit;
  puffs.push({ s, t0: performance.now(), life: 560, arc: [[w.x - 0.2, m.top * 0.45, w.z + 0.05], [cx + rand(-0.15, 0.15), cy + rand(-0.15, 0.15), cz]] });
}

function startTalk(now) {
  const { w } = visit;
  Object.assign(visit, { phase: 'talk', lines: visitLines(), i: -1 });
  root.querySelector('.b3-talk b').textContent = SMEARGLE.name;
  w.flip = walker.x > w.x;
  w.hopUntil = now + 500;
  walker.hopUntil = now + 500;
  playCry('smeargle');
  sayNext();
}

function sayNext() {
  visit.i++;
  if (visit.i === SAVED_AT && !visit.leader) meetSmeargle(base);
  const box = root.querySelector('.b3-talk');
  if (visit.i >= visit.lines.length) return leaveVisit();
  const line = visit.lines[visit.i], tag = visit.leader && line.match(/^([A-Z]+): /);
  if (visit.leader) box.querySelector('b').textContent = tag ? tag[1] : visit.leader.name;
  box.querySelector('span').textContent = tag ? line.slice(tag[0].length) : line;
  box.hidden = false;
  box.classList.remove('b3-say'); void box.offsetWidth; box.classList.add('b3-say');
}

/** It tucks the easel away in a puff and walks out over the doormat. */
function leaveVisit() {
  const { w } = visit;
  root.querySelector('.b3-talk').hidden = true;
  if (visit.leader) leaderVisited(base); else meetSmeargle(base);
  visit.phase = 'leave';
  for (const t of visit.tiles) blocked.delete(t);
  if (visit.easel) {
    const [fx, , fz] = visit.canvasAt;
    for (let i = 0; i < 6; i++) setTimeout(() => puff('star', { x: fx + rand(-0.3, 0.3), y: 0, z: fz }, { top: rand(0.2, 1) }), i * 60);
    dispose(visit.easel); scene.remove(visit.easel); visit.easel = null;
  }
  if (!visit.leader) playSound('item-get');
  if (w.seat || w.jump) {
    // a sitting friend gets down first, where they climbed up from
    const down = w.from && !blocked.has(key(w.from.x, w.from.y)) ? w.from : nearestFree(w.seat?.tile ?? w.tile);
    w.seat = null; w.jump = null;
    leap(w, { x: tileX(down.x), y: 0, z: tileZ(down.y) }, 380);
    w.tile = down;
  }
  const door = { x: Math.floor(COLS / 2), y: ROWS - 1 };
  w.path = route(w.tile, door);
  w.path.push({ x: door.x, y: ROWS + 0.6 });
  root.classList.remove('visiting');
  refresh();
}

/** Gone: out of the door, or the room left with it still here (it comes again next time, until it has told you). */
function endVisit() {
  if (!visit) return;
  if (visit.mon) { dispose(visit.mon.group); scene.remove(visit.mon.group); }
  if (visit.easel) { dispose(visit.easel); scene.remove(visit.easel); }
  if (visit.phase !== 'leave') for (const t of visit.tiles) blocked.delete(t);
  visit = null;
  root.querySelector('.b3-talk').hidden = true;
  root.classList.remove('visiting');
  refresh();
}

/* ---------- Smeargle in the yard ---------- */

/* The first time out in the yard (2026-10-15, the user's ask), once the housewarming indoors is over (a lent ?yard yard
   any time): Smeargle slides in on the talk window Kurt's hello uses (gymTalk() in js/gym.js) and says what the yard is
   for, leaving a Berry plot in storage (meetInYard() in js/secret-base.js). Your partner stands still while it talks. */
const YARD_SMEARGLE = { id: 'smeargle', name: 'SMEARGLE', talk: SMEARGLE.src };
let yardTalk = false;

async function yardLines() {
  const { workshopOpen } = await import('./data/towns.js');
  return [
    `${metSmeargle(base) ? 'Hello again!' : 'Hello there! I\'m Smeargle.'} So this is your backyard. What a lovely patch of lawn!`,
    `It's yours to furnish. Garden pieces come from my garden catalogue at the Poké Mall${metSmeargle(base) ? '' : ', which opens tomorrow'}: just tap me at the shop.`,
    'Whatever you buy waits in storage. Set it out with Furniture, the same as indoors.',
    `And the Pokémon tab lets the ${onShowMax()} on show come out to play. They'll swim, swing and sit wherever you give them room.`,
    'Oh! I left you a Berry plot in storage, too. Set it down, then tap it while walking to plant a berry.',
    'Cheri, Oran and Pecha Berries take a day, Sitrus two and Lum three. They ripen at midnight, UTC.',
    'Water a growing plot once a day, and it gives one more berry for every day it was watered.',
    'Picked berries go in your Satchel. Sell the spares with the Garden button, out here.',
    workshopOpen(getSave()) ? 'Kurt at his Workshop in the Clearing turns berries and town materials into held berries and items to take on a run. Pack up to three berries, one going on each biome!'
      : 'And someone handy in the Clearing may craft with them someday. Keep a few!',
    'Happy gardening! See you at the shop.',
  ];
}

async function yardIntro() {
  // no wait on the housewarming indoors: the arch leads straight out here, so a yard can be walked before the house
  if (metInYard(base)) return;
  yardTalk = true;
  try {
    const lines = await yardLines();
    await new Promise(r => setTimeout(r, calm ? 200 : 900));
    if (!root.isConnected || !outdoors()) return;
    Object.assign(walker, { path: [], goal: null, through: null });
    refresh();
    playCry('smeargle');
    const { gymTalk } = await import('./gym.js');
    await gymTalk(YARD_SMEARGLE, lines, { lit: true, title: 'PAINTER & GARDENER ' });
    if (!base.house.yard.lent && !metSmeargle(base)) meetSmeargle(base);
    meetInYard(base);
    playSound('item-get');
  } finally { yardTalk = false; refresh(); }
}

/* ---------- hearts and Zs ---------- */

function puffTexture(kind) {
  if (puffTex[kind]) return puffTex[kind];
  const rows = kind === 'heart'
    ? ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']
    : kind === 'star' ? ['...#...', '..###..', '#######', '.#####.', '.##.##.', '#.....#']
    : kind === 'drop' ? ['..#..', '.###.', '#####', '#####', '.###.']
    : ['#####', '...#.', '..#..', '.#...', '#####'];
  const c = new OffscreenCanvas(rows[0].length + 2, rows.length + 2), x = c.getContext('2d');
  const ink = { heart: '#ff5a8a', star: '#ffe060', drop: '#9ad8ff' }[kind] || '#e8f0ff', edge = { heart: '#8a1a3a', star: '#8a5a00', drop: '#1a4a8a' }[kind] || '#2a3a6a';
  rows.forEach((r, y) => [...r].forEach((ch, i) => { if (ch === '#') { x.fillStyle = edge; x.fillRect(i, y, 3, 3); } }));
  rows.forEach((r, y) => [...r].forEach((ch, i) => { if (ch === '#') { x.fillStyle = ink; x.fillRect(i + 1, y + 1, 1, 1); } }));
  return (puffTex[kind] = tex(c));
}

function puff(kind, w, m) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTexture(kind), transparent: true, depthWrite: false }));
  const size = kind === 'z' ? 0.2 : kind === 'drop' ? 0.14 : 0.26;
  s.scale.set(size, size * (kind === 'z' ? 1 : 8 / 9), 1);
  s.raycast = () => {};
  scene.add(s);
  puffs.push({ s, t0: performance.now(), life: kind === 'heart' ? 1100 : kind === 'drop' ? 600 : 2200, x: w.x + rand(-0.2, 0.2), y: w.y + m.top, z: w.z + 0.05, sway: rand(0, 6), drift: kind === 'z' ? 0.25 : 0 });
}

function livePuffs(now) {
  puffs = puffs.filter(p => {
    const k = (now - p.t0) / p.life;
    if (p.arc && k < 1) {
      const [a, b] = p.arc;
      p.s.position.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k + Math.sin(k * Math.PI) * 0.3, a[2] + (b[2] - a[2]) * k);
      return true;
    }
    if (k >= 1) { scene.remove(p.s); p.s.material.dispose(); return false; }
    p.s.position.set(p.x + p.drift * k + (calm ? 0 : Math.sin(p.sway + k * 7) * 0.08), p.y + k * 0.7, p.z);
    p.s.material.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    return true;
  });
}

/* ---------- taps ---------- */

function ndc(e) {
  const r = view.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1];
}

// holding a piece, a press shows its ghost under the finger, a drag carries it, and lifting puts it down
// not holding, a press on a placed piece that then moves picks it up and carries it: no Move key needed
function onDown(e) {
  if (mode !== 'edit') return;
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  view.setPointerCapture?.(e.pointerId);
  // a second finger turns whatever the first was doing into a pinch: nothing is put down or picked up
  if (touches.size === 2) {
    grab = null; drag = null;
    if (holding && pressing) { pressing = false; pointer = null; }
    const [a, b] = [...touches.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom, mid: [(a.x + b.x) / 2, (a.y + b.y) / 2], panX, panZ };
    startPan();
    pinch.panX = panX; pinch.panZ = panZ;
    return;
  }
  if (touches.size > 2) return;
  if (!holding) {
    const i = pieceUnder(ndc(e));
    if (i >= 0 && !PIECES[base.items[i].id].gift) grab = { i, x: e.clientX, y: e.clientY };
    else drag = { x: e.clientX, y: e.clientY, panX, panZ };
    return;
  }
  pressing = true; pointer = ndc(e);
  view.setPointerCapture?.(e.pointerId);
  aimFrom(...pointer); showGhost();
}
function onMove(e) {
  if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch) {
    if (touches.size < 2) return;
    const [a, b] = [...touches.values()];
    setZoom(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d);
    panBy((a.x + b.x) / 2 - pinch.mid[0], (a.y + b.y) / 2 - pinch.mid[1], pinch);
    return;
  }
  if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 8 && zoom > 1.01) drag.moved = true;
    if (drag.moved) panBy(dx, dy, drag);
    return;
  }
  if (grab && Math.hypot(e.clientX - grab.x, e.clientY - grab.y) > 10) {
    const it = base.items[grab.i];
    grab = null;
    pickUp(it);
    holding.dragged = true;
    pressing = true;
    playSound('confirm');
  }
  if (!holding || (!pressing && e.pointerType !== 'mouse')) return;
  pointer = ndc(e);
  aimFrom(...pointer); showGhost();
}
function onUp(e) {
  touches.delete(e?.pointerId);
  if (pinch) { if (touches.size < 2) { pinch = null; quietUntil = performance.now() + 350; } return; }
  if (drag) { if (drag.moved) quietUntil = performance.now() + 350; drag = null; return; }
  grab = null;
  if (!holding || !pressing) return;
  pressing = false; pointer = null; swallowClick = true;
  place();
}

/** The placed piece (its index) under a point on the view, unless the partner stands in front of it. */
function pieceUnder(at) {
  let g = tapped(at);
  if (g?.userData.who) return -1;
  while (g && g.userData.index === undefined) g = g.parent;
  return g?.parent === pieceGroup ? g.userData.index : -1;
}

/** What's under a point on the view: a Pokémon's billboard (where its sprite is), a piece's mesh, or nothing. */
function tapped(at, ray = new THREE.Raycaster()) {
  ray.setFromCamera(new THREE.Vector2(...at), camera);
  const boards = [mon.board, ...present().filter(g => g.mon).map(g => g.mon.board), ...(visit?.phase === 'stand' ? [visit.mon.board] : [])];
  const under = [...boards, pieceGroup, ...(mode === 'walk' ? [roomGroup] : [])];
  for (const r of bentRays(ray)) {
    const hit = r.intersectObjects(under, true).find(h => !h.object.userData.who || onSprite(h));
    if (hit) return hit.object;
  }
}

/* Out on the rolling lawn a piece is drawn lower than it stands, more so the further it is from the focus, so a straight
   ray passes over a plot on the front row: the ray is walked in short pieces, each put back where it stands unbent (the
   Clearing's tapRays()). Made once and reused, as a drag in Decorate asks on every move. */
let bentPieces = null;
function bentRays(ray) {
  if (!BEND.k.value) return [ray];
  const STEP = 1.5, o = ray.ray.origin, d = ray.ray.direction;
  bentPieces ??= Object.assign(Array.from({ length: 60 }, () => new THREE.Raycaster()), { a: new THREE.Vector3(), b: new THREE.Vector3() });
  bentPieces.forEach((p, i) => {
    const a = unbend(bentPieces.a.copy(o).addScaledVector(d, i * STEP), BEND), b = unbend(bentPieces.b.copy(o).addScaledVector(d, (i + 1) * STEP), BEND);
    p.ray.origin.copy(a); p.ray.direction.subVectors(b, a).normalize(); p.near = 0; p.far = a.distanceTo(b); p.camera = camera;
  });
  return bentPieces;
}

/** Off across the floor to `to`, getting up first if sitting; `drag` keeps the step under way (drag to walk). */
function walkFloor(to, drag = false) {
  const go = () => {
    walker.path = drag ? reroute(walker, route, to) : route(walker.tile, to);
    const end = walker.path.at(-1) ?? walker.tile;
    ring.position.set(tileX(end.x), 0.02, tileZ(end.y));
    ring.material.opacity = 0.9;
  };
  follow = true;
  walker.through = null; walker.goal = null; walker.seatTo = null;
  if (walker.seat) getUp(go); else if (!walker.jump) go();
}

/** Where a ray meets the floor: in the yard, where it meets the lawn as drawn, rolling away from the focus (BEND). */
function groundHit(ray) {
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  if (!ray.intersectPlane(plane, hit)) return null;
  for (let i = 0; BEND.k.value && i < 4; i++) {
    plane.constant = BEND.k.value * (hit.z - BEND.z.value) ** 2;
    if (!ray.intersectPlane(plane, hit)) return null;
  }
  return hit;
}

/** The floor tile under a pointer in walk mode, or null. */
function floorTile(e) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(...ndc(e)), camera);
  const hit = groundHit(ray.ray);
  if (!hit) return null;
  const to = { x: Math.floor(hit.x + COLS / 2), y: Math.floor(hit.z + ROWS / 2) };
  return inRoom(to) ? to : null;
}
let drags = null;

/** The yard's placed berry plots. */
const plotsHere = () => outdoors() ? base.items.filter(it => isPlot(PIECES[it.id])) : [];

/** The Garden key: every plot in one window (openGarden() in js/berry-garden.js). */
function tendGarden() {
  const list = plotsHere();
  if (!list.length || mode !== 'walk' || yardTalk) return;
  playSound('select');
  walker.hopUntil = performance.now() + 500;
  openGarden(base, list, save);
}

function onTap(e) {
  if (drags?.swallowed() || yardTalk) return;
  if (swallowClick || holding) { swallowClick = false; return; }
  if (performance.now() < quietUntil) return;   // the end of a pinch or a pan, not a tap
  const ray = new THREE.Raycaster();
  const first = tapped(ndc(e), ray);
  walker.through = null;
  if (first?.userData.door) return goThrough(first.userData.door);
  if (first === mon.board) {
    playCry(mon.id);
    walker.hopUntil = performance.now() + 500;
    return;
  }
  if (visit?.phase === 'stand' && first === visit.mon.board) return leaderTalk();
  if (first?.userData.who) return cheer(first.userData.who);
  let g = first;
  while (g && g.userData.index === undefined) g = g.parent;
  if (g && g.parent === pieceGroup && PIECES[base.items[g.userData.index].id].gift) return unwrap(g.userData.index);
  if (mode !== 'edit' && g && g.parent === pieceGroup) {
    const it = base.items[g.userData.index], play = g.userData.model?.userData.play;
    if (PIECES[it.id].own === FREE_PC) return logOn();
    if (isPlot(PIECES[it.id])) { playSound('select'); walker.hopUntil = performance.now() + 500; return openPlot(base, it, save); }
    if (homeGame(it.id)) { playSound('confirm'); walker.hopUntil = performance.now() + 500; return playAtHome(it.id); }
    // a tap on a piece works it (the TV changes channel, the fridge opens...), and your partner cheers it on
    if (play) {
      const r = tapPlay(play), now = performance.now();
      if (r.cheer) walker.hopUntil = now + 500;
      if (r.cheer === 'heal') for (const gu of present()) if (gu.mon) cheer(gu, 4);
      if (!seatOf(it.id) || seatOf(it.id).swim) return;
    }
    // your partner takes a seat or a swing; the water is for the Water types living here
    if (seatOf(it.id) && !seatOf(it.id).swim && sitPartner(it)) return;
  }
  if (mode === 'edit' && g && g.parent === pieceGroup) {
    // a second tap on the picked piece turns it
    if (sel === g.userData.index) return PIECES[base.items[sel].id].layer === 'wall' ? undefined : act('rotate');
    sel = g.userData.index;
    playSound('confirm');
    return refresh();
  }
  if (sel >= 0) { sel = -1; refresh(); }
  const hit = groundHit(ray.ray);
  if (!hit) return;
  // the yard's doormat, drawn lower where the lawn rolls away than the ray finds it, is found on the ground instead
  const mat = mode === 'walk' && doors.find(d => d.side === 's' && Math.abs(hit.x - tileX(d.tile.x)) < 0.9 && hit.z > ROWS / 2 && hit.z < ROWS / 2 + 0.95);
  if (mat) return goThrough(mat);
  const to = { x: Math.floor(hit.x + COLS / 2), y: Math.floor(hit.z + ROWS / 2) };
  if (!inRoom(to)) return;
  walkFloor(to);
  playSound('confirm');
}

/* ---------- the sheet ---------- */

// white line art, like the round keys' (js/smooth-icons.js)
const GLYPHS = {
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke-width="2.6"/>',
  ok: '<path d="M5.5 12.5 10 17l8.5-9.5" stroke-width="2.8"/>',
  rotate: '<path d="M18.5 12.5a6.5 6.5 0 1 1-1.9-5.1" stroke-width="2.4"/><path d="M18.5 4.5v4h-4" stroke-width="2.4"/>',
  store: '<path d="M4.5 9.5h15v8.6a1.4 1.4 0 0 1-1.4 1.4H5.9a1.4 1.4 0 0 1-1.4-1.4Z" stroke-width="2.2"/><path d="M3.5 5.5h17v4h-17Z" stroke-width="2.2"/><path d="M10 13.5h4" stroke-width="2.4"/>',
  sofa: '<path d="M6 11V8.5a2.5 2.5 0 0 1 2.5-2.5h7A2.5 2.5 0 0 1 18 8.5V11" stroke-width="2.2"/><path d="M4 11.5a1.8 1.8 0 0 1 3.6 0v2.3h8.8v-2.3a1.8 1.8 0 0 1 3.6 0v5.3a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 16.8Z" stroke-width="2.2"/><path d="M6.5 18.2v1.8M17.5 18.2v1.8" stroke-width="2.2"/>',
  roller: '<rect x="4" y="4" width="13" height="5.5" rx="1.6" stroke-width="2.2"/><path d="M17 6.7h2.5v5H11.5v2.8" stroke-width="2.2"/><rect x="9.8" y="14.5" width="3.4" height="6" rx="1.1" stroke-width="2.2"/>',
  floor: '<path d="M3.5 19.5 7.5 6.5h9l4 13Z" stroke-width="2.2"/><path d="M12 6.5v13M5.6 12.8h12.8" stroke-width="2"/>',
  cart: '<path d="M3 4.5h2.4l2.2 10.2h10.2l1.9-7.2H6.6" stroke-width="2.2"/><circle cx="9" cy="18.6" r="1.5" stroke-width="2"/><circle cx="16.2" cy="18.6" r="1.5" stroke-width="2"/>',
  paint: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.9 1.4-1.9-.5-1.2.3-2.4 1.6-2.4h1.6a3.9 3.9 0 0 0 3.9-3.9C20.5 7.6 16.7 3.5 12 3.5Z" stroke-width="2.2"/><circle cx="7.8" cy="11" r="1.2" stroke-width="2"/><circle cx="10.5" cy="7.4" r="1.2" stroke-width="2"/><circle cx="14.8" cy="7.6" r="1.2" stroke-width="2"/>',
  ball: '<circle cx="12" cy="12" r="8" stroke-width="2.2"/><path d="M4 12h5.3M14.7 12H20" stroke-width="2.2"/><circle cx="12" cy="12" r="2.6" stroke-width="2.2"/>',
  sprout: '<path d="M12 20.5v-9" stroke-width="2.4"/><path d="M12 12.5C12 8 9 5.5 4.5 5.5 4.5 10 7.5 12.5 12 12.5Z" stroke-width="2.2"/><path d="M12 11c0-3.6 2.6-6 7-6 0 4-2.8 6-7 6Z" stroke-width="2.2"/><path d="M7 20.5h10" stroke-width="2.4"/>',
};
const glyph = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[name]}</svg>`;

let lazy;
function tray(which = tab) {
  tab = which;
  const list = root.querySelector('.b3-strip');
  list.replaceChildren();
  lazy?.disconnect();
  lazy = new IntersectionObserver((seen) => seen.forEach(e => {
    if (!e.isIntersecting || !e.target.paint) return;
    e.target.prepend(e.target.paint()); e.target.paint = null; lazy.unobserve(e.target);
  }), { root: list, rootMargin: '200px' });
  root.querySelectorAll('.b3-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const add = (label, art, on, pick, tag = '') => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'b3-tile' + (on ? ' on' : '');
    const pic = Object.assign(document.createElement('span'), { className: 'b3-pic' });
    // a piece's icon is painted once it scrolls into view, so a tray of thousands (?allfurniture) opens at once
    if (typeof art === 'function') { pic.paint = art; lazy.observe(pic); } else pic.append(art);
    if (tag) pic.append(Object.assign(document.createElement('i'), { className: 'b3-tag', textContent: tag }));
    b.append(pic, Object.assign(document.createElement('span'), { className: 'b3-name', textContent: label }));
    b.title = label;
    b.addEventListener('click', pick);
    list.append(b);
  };
  filters();
  if (tab === 'colour') {
    const id = holding?.id ?? base.items[sel]?.id;
    if (!id) return tray('furniture');
    // a set's other styles in this colour first, then this style's other colours
    for (const c of [...styles(id), ...colours(id).filter(c => c !== id)]) add(PIECES[c].name, () => icon(c), c === id, () => recolour(c));
  }
  if (tab === 'furniture') for (const id of DESIGNS.filter(id => fitsHere(id, base) && spare(base, id) > 0 && KINDS_OF[kindPick](PIECES[id]))) add(PIECES[id].name, () => icon(id), holding?.id === id && !holding.back, () => {
    if (holding?.back) act('cancel');
    if (holding?.id === id) { dropHold(); refresh(); return; }
    if (holding) dropHold();
    playSound('confirm');
    named = { text: PIECES[id].name, until: performance.now() + 1600 };
    setTimeout(refresh, 1650);
    hold(id);
  }, spare(base, id) > 1 && spare(base, id) < Infinity ? `×${spare(base, id)}` : PIECES[id].layer === 'wall' ? 'Wall' : '');
  // the ones you have first, then the ones for sale, cheapest first
  const swatch = (all, field) => [...all.filter(s => ownsPaper(base, field, s)), ...all.filter(s => !ownsPaper(base, field, s)).sort((a, b) => a.price - b.price)]
    .forEach(s => add(s.name, () => paperArt(field, s.id), base[field] === s.id, () => paperTap(field, s), ownsPaper(base, field, s) ? '' : s.price.toLocaleString()));
  if (tab === 'wall') swatch(WALLPAPERS, 'wall');
  if (tab === 'floor') swatch(FLOORS, 'floor');
  if (tab === 'mons' && outdoors()) {
    // out in the yard: the ones on show, a tap letting one out onto the lawn or calling it back in
    for (const id of onShow().shown) {
      const img = Object.assign(document.createElement('img'), { loading: 'lazy', src: resident(id).image, alt: '', draggable: false, className: 'pixel' });
      add(resident(id).name, img, livesOut(id), () => {
        base.out = livesOut(id) ? base.out.filter(x => x !== id) : [...(base.out || []), id];
        playSound(livesOut(id) ? 'confirm' : 'cancel');
        save(); letOut(id); tray(); refresh();
      }, livesOut(id) ? '✓' : '');
    }
  } else if (tab === 'mons') {
    const { all, shown } = onShow();
    // the ones on show first, then every other catch in Pokédex order
    for (const id of [...shown, ...all.filter(id => !shown.includes(id))]) {
      const img = Object.assign(document.createElement('img'), { loading: 'lazy', src: resident(id).image, alt: '', draggable: false, className: 'pixel' });
      add(resident(id).name, img, shown.includes(id), () => {
        const now = onShow().shown;
        if (now.includes(id)) { base.mons = now.filter(x => x !== id); base.out = base.out?.filter(x => x !== id); playSound('cancel'); }
        else if (now.length >= onShowMax()) { playSound('cancel'); hushed = null; hud.hint.classList.remove('hush'); hud.hint.textContent = `${onShowMax()} can live here at once. Tap one to send it back first.`; return; }
        else { base.mons = [...now, id]; playSound('confirm'); }
        save(); syncGuests(); tray(); refresh();
      }, shown.includes(id) ? (livesOut(id) ? 'Yard' : '✓') : '');
    }
  }
}

let kindPick = 'All';

/** The filter chips over the Furniture tab: only kinds you have a piece of, so none ever opens empty. */
function filters() {
  const row = root.querySelector('.b3-filters');
  row.hidden = tab !== 'furniture';
  if (row.hidden) return;
  const have = DESIGNS.filter(id => fitsHere(id, base) && spare(base, id) > 0).map(id => PIECES[id]);
  const kinds = Object.keys(KINDS_OF).filter(k => k === 'All' || have.some(KINDS_OF[k]));
  if (!kinds.includes(kindPick)) kindPick = 'All';
  row.replaceChildren(...kinds.map(k => {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'b3-chip' + (k === kindPick ? ' on' : ''), textContent: k });
    b.addEventListener('click', () => {
      if (k === kindPick) return;
      kindPick = k; playSound('select'); tray();
      root.querySelector('.b3-strip').scrollLeft = 0;
    });
    return b;
  }));
}

/** The piece in hand, or the one picked in the room, in another colour or style of its kind or set: they all come with it. */
function recolour(id) {
  playSound('confirm');
  if (holding) { holding.id = id; makeGhost(); showGhost(); }
  else if (sel >= 0) { base.items[sel] = { ...base.items[sel], id }; save(); buildPieces(); }
  refresh();
}

/** A wallpaper or floor you have goes straight up. One for sale goes up on approval with its price, and a second tap
    buys it; tapping anything else, another tab or Done takes it down again. */
function paperTap(field, s) {
  hushed = null;
  const coins = getSave().coins ?? 0;
  if (trying?.id === s.id) {
    const was = trying.was;
    trying = null;
    base[field] = was;
    if (!buyPaper(base, field, s)) {
      trying = { field, id: s.id, was }; base[field] = s.id;
      playSound('cancel'); shopMsg = `You need ${(s.price - coins).toLocaleString()} more PokéCoins for ${s.name}.`;
      return refresh();
    }
    playSound('buy'); shopMsg = `${s.name} is yours.`;
    return tray(), refresh();
  }
  untry();
  shopMsg = '';
  if (base[field] === s.id) return refresh();
  if (ownsPaper(base, field, s)) { base[field] = s.id; save(); buildRoom(); playSound('confirm'); return tray(), refresh(); }
  trying = { field, id: s.id, was: base[field] };
  base[field] = s.id;
  buildRoom(); playSound('select');
  tray(); refresh();
}

function refresh() {
  const busy = holding || sel >= 0;
  root.classList.toggle('editing', mode === 'edit');
  root.classList.toggle('folded', mode === 'edit' && folded);
  // a piece in hand or picked tucks the sheet down to its hinge and keys, so the room has the screen
  root.classList.toggle('tucked', mode === 'edit' && !!busy);
  root.classList.toggle('painting', tab === 'colour');
  root.classList.toggle('outdoors', outdoors());
  const garden = root.querySelector('.b3-garden');
  garden.hidden = !(outdoors() && mode === 'walk' && !yardTalk && plotsHere().length);
  root.classList.toggle('has-garden', !garden.hidden);
  const bar = root.querySelector('.b3-acts');
  bar.hidden = !busy;
  const wall = PIECES[holding?.id ?? base.items[sel]?.id]?.layer === 'wall';
  bar.querySelectorAll('[data-act]').forEach(b => {
    const a = b.dataset.act;
    const pid = holding?.id ?? base.items[sel]?.id ?? 'bed', many = colours(pid).length > 1 || styles(pid).length > 1;
    b.hidden = a === 'paint' ? !busy || !many : holding ? !(a === 'cancel' || (a === 'rotate' && !wall)) : a === 'cancel' || (a === 'rotate' && wall);
    if (a === 'paint') b.classList.toggle('on', tab === 'colour');
  });
  const mons = onShow();
  const tip = mode === 'walk' && giftBoard && !visit && root.querySelector('.b3-gift').hidden;
  hud.hint.classList.toggle('tip', !!tip);
  // with a piece in hand or picked the hinge's LCD says what's going on, and nothing covers the room
  hud.hint.textContent = tip ? 'A present! Tap it to open it.'
    : busy ? (named && performance.now() < named.until ? named.text : '')
    : trying ? `${papers(trying.field).find(s => s.id === trying.id).name}: ${papers(trying.field).find(s => s.id === trying.id).price.toLocaleString()} PokéCoins. Tap again to buy.`
    : (tab === 'wall' || tab === 'floor') && shopMsg ? shopMsg
    : tab === 'wall' || tab === 'floor' ? 'Tap one to put it up. Ones with a price go up on approval first.'
    : tab === 'furniture' && outdoors() && !DESIGNS.some(id => fitsHere(id, base) && spare(base, id) > 0) ? 'No garden pieces in storage. Smeargle sells them at the Poké Mall: tap Smeargle for the garden catalogue.'
    : tab === 'furniture' && !DESIGNS.some(id => fitsHere(id, base) && spare(base, id) > 0) ? 'Everything is out. Buy more at the Poké Mall.'
    : tab === 'mons' && outdoors() && mons.shown.length ? 'Tap one to let it out in the yard, or call it back in.'
    : tab === 'mons' ? (mons.all.length ? `Up to ${onShowMax()} Safari catches can live here.` : 'Catch Pokémon in the Safari Zone and they can live here.')
    : '';
  hud.hint.classList.toggle('hush', hud.hint.textContent === hushed);
  if (sel >= 0) {
    const g = pieceGroup.children.find(c => c.userData.index === sel), it = base.items[sel];
    const box = new THREE.Box3().setFromObject(g);
    if (PIECES[it.id].layer !== 'wall') {
      const [fw, fh] = footprint(it), x0 = it.x - COLS / 2, z0 = it.y - ROWS / 2;
      box.union(new THREE.Box3(new THREE.Vector3(x0, 0, z0), new THREE.Vector3(x0 + fw, 0.05, z0 + fh)));
    }
    box.expandByScalar(0.04);
    selBox.box.copy(box);
    selBox.visible = true;
  } else selBox.visible = false;
  if (tab === 'furniture' || tab === 'colour') tray();
  root.querySelector('.b3-ok').textContent = holding ? 'Place' : 'Done';
}

/* ---------- light ---------- */

function setTime(force) {
  const t = timeOfDay();
  if (t === time && !force) return;
  time = t;
  if (outdoors()) return yardLight(t);
  const L = LIGHT[t];
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.amb;
  sun.color.set(L.sun); sun.intensity = L.sunI; sun.position.set(...L.at);
  for (const l of lampLights) l.intensity = L.lamp * 3;
  for (const m of winMats) { m.userData.was = m.userData.lamp ? Math.min(1, L.lamp / 2) : L.win; m.emissiveIntensity = m.userData.off ? 0 : m.userData.was; }
  for (const s of shafts) s.material.opacity = L.shaft;
  for (const d of motes) d.material.opacity = L.motes;
  setSky(new THREE.Color(L.bg));
}


/* ---------- camera ---------- */

/* Two shots, blended as you switch: walking, a lower, closer look that follows your partner (Octopath's tilt, the room
   at eye level); decorating, higher and pulled back so the whole room fits over the sheet, every tile in reach. */
// walking matches the Clearing outside (js/hub-3d.js: PITCH 0.6, ACROSS 8), so your partner is the same size in and out
const SHOT = { walk: { pitch: 0.6, across: 8 }, edit: { pitch: 0.9, across: COLS + 1.2 } };
const LOOK_Y = 0.9;

function aimCamera(x, d, pitch, z = 0) {
  camera.position.set(x, LOOK_Y + Math.sin(pitch) * d, z + Math.cos(pitch) * d);
  camera.lookAt(x, LOOK_Y, z);
  camera.updateMatrixWorld();
}

/** How far up and down the screen (in NDC) the room reaches from this distance: the wall's top to the floor's front edge. */
function roomSpan(d, pitch) {
  aimCamera(0, d, pitch);
  const top = new THREE.Vector3(0, WALL_H, -ROWS / 2 - 0.4).project(camera).y;
  const bottom = new THREE.Vector3(0, -0.6, ROWS / 2).project(camera).y;
  return [top, bottom];
}

/* A shot fills the height between the top bar and whatever covers the bottom (the sheet, decorating) and shows its
   `across` tiles at least; a lens shift centres the room there, keeping the tilt. */
function fitShot({ pitch, across: want }, w, h, below) {
  const bar = root.querySelector('.b3-top').offsetHeight;
  const avail = h - bar - below;
  const room = 2 * avail / h * 0.94;
  let lo = 2, hi = 80;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const [t, b] = roomSpan(mid, pitch); if (t - b > room) lo = mid; else hi = mid; }
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
  const d = Math.max(hi, want / 2 / halfTan);
  const [t, b] = roomSpan(d, pitch);
  return { pitch, dist: d, half: d * halfTan, shift: (1 - (t + b) / 2) / 2 * h - (bar + avail / 2) };
}

function fitCamera(w, h) {
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const sheet = root.querySelector('.b3-sheet').offsetHeight;
  root.style.setProperty('--b3-sheet', sheet + 'px');
  fitted = { walk: fitShot(SHOT.walk, w, h, 0), edit: fitShot({ ...SHOT.edit, across: COLS + 1.2 }, w, h, sheet) };
  shots ??= structuredClone(fitted);
}

// the sheet tucking down or coming back changes the room's fit: the camera glides to the new one rather than jumping
function easeShots(dt) {
  const k = calm ? 1 : Math.min(1, dt / 1000 * 6);
  for (const s of ['walk', 'edit']) for (const key in fitted[s]) shots[s][key] += (fitted[s][key] - shots[s][key]) * k;
}

function placeCamera(dt, now) {
  // opened or switched rooms while the view had no size yet: fit it once it has one
  if (!fitted) return resize();
  shots ??= structuredClone(fitted);
  easeShots(dt);
  blend = calm ? +(mode === 'edit') : blend + ((mode === 'edit') - blend) * Math.min(1, dt / 1000 * 6);
  const k = blend * blend * (3 - 2 * blend), mix = (key) => shots.walk[key] + (shots.edit[key] - shots.walk[key]) * k;
  // the zoom only counts decorating, eased in and out with the blend
  zoomK = 1 + (zoom - 1) * k;
  const room = COLS / 2 + 0.6, half = mix('half') / zoomK, free = mode === 'edit' && zoom > 1.01;
  if (holding && pressing && pointer && Math.abs(pointer[0]) > 0.7) {
    panX += Math.sign(pointer[0]) * (Math.abs(pointer[0]) - 0.7) / 0.3 * dt / 1000 * 5;
  }
  const clamp = (x) => half >= room ? 0 : Math.max(-room + half, Math.min(room - half, x));
  panX = clamp(panX);
  const deep = (ROWS / 2 + 0.5) * (1 - 1 / zoomK);
  panZ = Math.max(-deep, Math.min(deep, panZ));
  const want = follow && !free ? clamp(walker.x) : panX, wantZ = free ? panZ : 0;
  const before = camX;
  const glide = pinch || drag?.moved ? 1 : Math.min(1, dt / 1000 * 4);
  camX = calm ? want : camX + (want - camX) * glide;
  camZ = calm ? wantZ : camZ + (wantZ - camZ) * glide;
  camera.setViewOffset(viewW, viewH, 0, mix('shift'), viewW, viewH);
  const pitch = mix('pitch');
  aimCamera(camX, mix('dist') / zoomK, pitch, camZ);
  BEND.z.value = camZ;
  // Pokémon lean back by the tilt, as in the Clearing, so they face the camera unsquashed
  for (const m of [mon, ...guests.map(g => g.mon), visit?.mon]) if (m) m.board.rotation.x = -pitch;
  // and so do the pieces that stand as their painting
  // (turned back against their piece's own turn, so a statue's figure faces you whichever way its plinth does)
  for (const s of standees) { if (!s.parent) standees.delete(s); else { s.rotation.order = 'YXZ'; s.rotation.y = -s.parent.rotation.y; s.rotation.x = -pitch; } }
  if (holding && pressing && pointer && Math.abs(camX - before) > 1e-4) { aimFrom(...pointer); showGhost(); }
}

/** Zoomed in from the whole room, the camera stops following your partner and stays where it is. */
function startPan() {
  if (zoom > 1.01) return;
  follow = false; panX = camX; panZ = camZ;
}

function setZoom(z) {
  if (z > 1.01) startPan();
  zoom = Math.max(1, Math.min(ZOOM_MAX, z));
}

/** A drag of (dx, dy) screen pixels from where it began (`from`'s pan) moves the room under the finger. */
function panBy(dx, dy, from) {
  if (zoom <= 1.01) return;
  const perPx = 2 * shots.edit.half / zoomK / viewW, pitch = shots.edit.pitch;
  panX = from.panX - dx * perPx;
  panZ = from.panZ - dy * perPx / Math.sin(pitch);
}

/** Walk (just the room) or Decorate (the sheet up, the camera back over the whole room). */
function setMode(to) {
  if (to === mode) return;
  if (to === 'walk') { if (holding) act('cancel'); sel = -1; follow = true; untry(); }
  mode = to;
  playSound(to === 'edit' ? 'confirm' : 'cancel');
  if (to === 'edit') tray();
  refresh();
}

function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  // the canvas at the scene's own size: the last pass (bloom, tilt-shift blur) at 2x a phone's pixels cost the most and showed nothing more
  renderer.setPixelRatio(post.scale(w, h));
  renderer.setSize(w, h, false);
  post.size(w, h);
  camera.aspect = w / h;
  viewW = w; viewH = h;
  fitCamera(w, h);
}

/* ---------- the frame ---------- */

function frame(now) {
  if (!root.isConnected) return;
  if (cabinetUp()) { last = now; return requestAnimationFrame(frame); }
  if (tooSoon(now, last)) { requestAnimationFrame(frame); return; }
  const dt = Math.min(100, now - (last || now));
  last = now;
  fpsLog.push(dt); if (fpsLog.length > 60) fpsLog.shift();
  keepUp(now);
  tickSparks(now, dt);

  if (!hopping(walker, now) && walk(walker, mon, dt)) {
    if (walker.goal) partnerUp();
    else if (walker.through) { const d = walker.through; walker.through = null; if (d.exit) leave(); else travel(d); }
  }
  // the mat's arrow breathes, so it reads as the way out
  if (!calm) for (const m of doorMats) m.material.emissiveIntensity = mode === 'walk' ? 0.12 + Math.sin(now / 420) * 0.1 : 0;
  const happy = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : happy ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, walker.y ?? 0, walker.z);
  mon.board.position.y = bob;
  mon.board.scale.x = walker.flip ? -1 : 1;
  drawMon(mon, walker, dt);
  // the Pokémon living here are about whichever room you're in, or out in the yard if they were let out
  liveSwings(dt, now);
  for (const g of guests) if (g.mon && g.w) { g.mon.group.visible = homeHere(g); if (homeHere(g)) liveGuest(g, dt, now); }
  if (walker.seat?.part && !walker.jump) mon.group.position.set(walker.x, walker.y, walker.z);
  if (BEND.k.value) for (const o of [mon.group, ring, ...present().map(g => g.mon?.group).filter(Boolean)]) o.traverse(c => { if (c.isMesh) for (const m of [c.material].flat()) bend(m, BEND); });
  if (snow) liveSnow(now);
  liveVisit(dt, now);
  livePuffs(now);
  liveGift(now);
  for (const grown of liveGarden(now, BEND.k.value, BEND.z.value, calm)) bendOut(grown);
  for (const pg of pieceGroup.children) { const pl = pg.userData.model?.userData.play; if (pl) tickPlay(pl, now, dt); }
  if (ring.material.opacity > 0) { ring.material.opacity = Math.max(0, ring.material.opacity - dt / 700); ring.scale.setScalar(1.25 - ring.material.opacity * 0.3); }
  if (!calm) {
    for (const dust of motes) {
      const p = dust.geometry.attributes.position, b = dust.userData.base;
      for (let i = 0; i < p.count; i++) {
        p.array[i * 3 + 1] = (b[i * 3 + 1] + now / 6000 * (0.3 + (i % 5) * 0.08)) % 2.6;
        p.array[i * 3] = b[i * 3] + Math.sin(now / 1400 + i) * 0.12;
      }
      p.needsUpdate = true;
    }
    if (selBox.visible) selBox.material.color.setHSL(0.14, 1, 0.6 + Math.sin(now / 180) * 0.2);
    if (foot.visible) foot.material.opacity = 0.45 + Math.sin(now / 160) * 0.12;
  }
  if (now - (frame.checked || 0) > 30000) { frame.checked = now; setTime(); }
  placeCamera(dt, now);
  // the tilt-shift keeps its sharp band on what you're handling: the ghost, the picked piece, else where you've zoomed, else the partner
  const focus = holding && aimAt ? foot.position : selBox.visible ? selBox.box.getCenter(new THREE.Vector3()) : mode === 'edit' && zoom > 1.01 ? new THREE.Vector3(camX, 0.6, camZ) : new THREE.Vector3(walker.x, 0.6, walker.z);
  post.draw(scene, camera, (focus.clone().project(camera).y + 1) / 2);

  if (hud.fps) hud.fps.textContent = `${Math.round(1000 / (fpsLog.reduce((a, b) => a + b, 0) / fpsLog.length))} fps`;
  requestAnimationFrame(frame);
}

/** A device that can't hold ~40 fps steps down: smaller shadows, then a smaller scene, a step at most every 3 s, remembered
    on that device so the next visit starts there. */
let slowSince = 0, lowered = 0;
function keepUp(now) {
  if (fpsLog.length < 60 || document.hidden) { slowSince = 0; return; }
  const avg = fpsLog.reduce((a, b) => a + b, 0) / fpsLog.length;
  if (avg < 25) { slowSince = 0; return; }
  if (!slowSince) { slowSince = now; return; }
  if (now - slowSince < 3000) return;
  slowSince = 0;
  if (!stepDown()) return;
  try { localStorage.setItem('pokedb.base3d.low', String(++lowered)); } catch {}
  fpsLog.length = 0;
}
function stepDown() {
  if (sun.shadow.mapSize.x > 512) { sun.shadow.mapSize.set(512, 512); sun.shadow.map?.dispose(); sun.shadow.map = null; return true; }
  if (!post.lower(view.clientWidth || 9999, view.clientHeight || 9999)) return false;
  resize();
  return true;
}

/** The 2D room instead, where there's no WebGL or no Three.js (offline). */
async function fallBack() {
  root.remove();
  root = null;
  await (await import('./secret-base.js')).openBase();
  curtain(false);
}

/** Out through the door: dark, the room put away (kept asleep, so going back in is quick), then wherever it was opened from. */
export async function leave() {
  if (leave.busy) return;
  if (!leaveTo) { location.href = location.pathname; return; }
  leave.busy = true;
  playSound('door');
  await curtain(true);
  if (holding) act('cancel');
  endVisit();
  untry();
  root.remove();
  sleepGL(renderer);   // its GPU memory let go; reopen() wakes it
  await leaveTo();
  leave.busy = false;
  curtain(false);
}

/** Through a doorway into the room beyond: dark, that room built, your partner in at its side of the same doorway and
    the Pokémon living here about the room, then light. */
async function travel(d) {
  if (travel.busy) return;
  travel.busy = true;
  playSound('door');
  await curtain(true);
  if (holding) act('cancel');
  sel = -1;
  endVisit();
  untry();
  goRoom(base, d.to);
  save();
  showRoom(doors => doors.find(x => x.pip === d.toPip)?.tile);
  // in through a wall's doorway it faces into the room; in over the front edge, away from you, as at the front door
  if (doors.find(x => x.pip === d.toPip)?.side !== 's') walker.facing = 'front';
  travel.busy = false;
  curtain(false);
}

/** Build the room `base.here` is and stand your partner at `spot(doors)` (a tile), or at the front; the guests about it. */
function showRoom(spot = () => null) {
  useRoom(base);
  // outdoors there's no wallpaper or floor to pick, only furniture and who's let out
  if (outdoors() && tab !== 'furniture' && tab !== 'mons') tab = 'furniture';
  const lv = here().lv;
  root.querySelector('.b3-top h2').textContent = (base.here || 'main') === 'main' ? 'Secret Base' : `${roomName(base.house, base.here)}${lv ? ` · ${floorName(lv)}` : ''}`;
  buildRoom();
  Object.assign(walker, { path: [], through: null, seat: null, seatTo: null, goal: null, jump: null, y: 0 });
  buildPieces();
  walker.tile = nearestFree(spot(doors) ?? startTile());
  walker.x = tileX(walker.tile.x); walker.z = tileZ(walker.tile.y);
  walker.facing = 'back';
  for (const g of guests) {
    const w = g.w;
    if (!w) continue;
    const spots = freeTiles(w), t = spots.length ? spots[Math.floor(Math.random() * spots.length)] : walker.tile;
    Object.assign(w, { seat: null, goal: null, jump: null, sleeping: false, y: 0, path: [], tile: t, x: tileX(t.x), z: tileZ(t.y), think: performance.now() + rand(800, 3000) });
  }
  zoom = 1; camZ = panZ = 0; follow = true;
  camX = panX = walker.x;
  shots = fitted = null;
  resize();
  refresh();
  liveNews();
}

/* The Trainer set's cases (js/base-furniture-trainer.js) fill in by themselves. The first time a room is shown after
   what one shows has changed (a run won, a leader beaten), it sparkles and a line over the room says what's new (2026-10-16,
   the user: players should see their display update). What each showed is kept in the base's `liveSeen`, by kind; a
   piece seen for the first time is only noted. */
let sparks = [];
function liveNews() {
  const seen = base.liveSeen ||= {}, lines = [];
  let changed = false;
  base.items.forEach((it, i) => {
    const p = PIECES[it.id];
    if (!p?.live) return;
    const now = p.live(), was = seen[it.id];
    if (was === now) return;
    seen[it.id] = now;
    changed = true;
    if (was === undefined) return;
    const line = p.news?.(was, now);
    if (!line) return;
    lines.push(line);
    let g = null;   // its group, wherever bendOut() has put it
    pieceGroup.traverse(o => { if (!g && o.userData.index === i) g = o; });
    if (g) sparkle(g);
  });
  if (changed) saveBase(base);
  if (!lines.length) return;
  playSound('achievement');
  const news = root.querySelector('.b3-news');
  news.textContent = lines.join(' ');
  news.hidden = false;
  news.classList.remove('in'); void news.offsetWidth; news.classList.add('in');
  clearTimeout(liveNews.t);
  liveNews.t = setTimeout(() => { news.hidden = true; }, 7000);
}

/** Gold glints rising round a piece and fading, a couple of seconds. */
function sparkle(g) {
  if (calm) return;
  const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), geo = new THREE.OctahedronGeometry(0.06);
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: i % 3 ? '#ffd860' : '#ffffff', transparent: true, depthWrite: false }));
    m.position.set(box.min.x + Math.random() * size.x, box.min.y + Math.random() * size.y * 0.9, box.max.z + 0.05);
    m.raycast = () => {};
    scene.add(m);
    sparks.push({ m, vy: 0.4 + Math.random() * 0.6, t0: performance.now() + i * 60, life: 1600 + Math.random() * 600 });
  }
}

function tickSparks(now, dt) {
  if (!sparks.length) return;
  sparks = sparks.filter(s => {
    const age = now - s.t0;
    if (age < 0) { s.m.visible = false; return true; }
    s.m.visible = true;
    const k = age / s.life;
    s.m.position.y += s.vy * dt / 1000;
    s.m.rotation.y += dt / 300;
    s.m.material.opacity = Math.max(0, 1 - k) * (k < 0.15 ? k / 0.15 : 1);
    if (k < 1) return true;
    scene.remove(s.m); s.m.material.dispose();
    return false;
  });
}

/** The Storage PC: the Clearing's PC on its Decorations, over the room. What it changed (a piece put away, the walking
    buddy, the residents) is read back from the save once it's logged off. */
function logOn() {
  playSound('confirm');
  const was = base.here;
  openPC({ start: 'decor', inBase: true, onClose: async () => {
    base = loadBase();
    // the PC's House upgrades may have grown this room or opened a door in it, or taken it down (back in the main room)
    const at = walker.tile;
    showRoom(() => base.here === was ? at : null);
    const mate = buddy(getSave());
    if (mon.src !== mate.src) { dispose(mon.group); scene.remove(mon.group); mon = await makeMon(mate); mon.board.userData.who = { mon, w: walker }; }
    syncGuests();
    refresh();
  } });
}

/** Back in a second time: the room as it was left, the partner in at the door, any new catches moved in. */
async function reopen(start) {
  playMusic('secret-base');
  calm = calmFx();
  base = goRoom(loadBase(), start);   // the mall's Furniture store may have bought into it since; in at the front door
  document.body.append(root);
  await wakeGL(renderer);
  const mate = buddy(getSave());
  if (mon.src !== mate.src) { dispose(mon.group); scene.remove(mon.group); mon = await makeMon(mate); mon.board.userData.who = { mon, w: walker }; }
  mode = 'walk'; blend = 0; sel = -1;
  showRoom();
  setTime(true);
  syncGuests();
  startVisit();
  last = 0;
  requestAnimationFrame(frame);
  curtain(false);
}

/** The Secret Base. `onLeave` is where its doormat goes (the walkable hub hands it the way back out to the Clearing);
    `start` 'yard' opens out in the backyard (?yard), if there is one. */
export async function openBase3d({ onLeave = null, start = 'main' } = {}) {
  leaveTo = onLeave;
  playMusic('secret-base');
  // the statues' sprites are fetched only now: a room built without them would carve its statue models bare
  const every = new URLSearchParams(location.search).has('allfurniture'), owned = Object.keys(loadBase().owned || {});
  await Promise.all([loadStatues(every ? undefined : statuesIn(owned)), loadFigures(every ? undefined : owned)]);
  if (root && renderer) return reopen(start);
  calm = calmFx();
  root = document.createElement('section');
  root.className = 'base3d';
  root.innerHTML = `
    <div class="b3-stage">
      <canvas class="b3-view"></canvas>
      <header class="b3-top"><h2>Secret Base</h2><span class="b3-fps" hidden></span></header>
      <p class="b3-hint" aria-live="polite"></p>
      <p class="b3-news" aria-live="polite" hidden></p>
      <p class="b3-talk" hidden aria-live="polite"><b>Smeargle</b><span></span><i aria-hidden="true"></i></p>
      <div class="b3-gift" hidden><p>Starter furniture!</p><div class="b3-gift-row"></div><button type="button" class="b3-done">Decorate</button></div>
      <button type="button" class="b3-decor" aria-label="Decorate">${glyph('sofa')}<span>Decorate</span></button>
      <button type="button" class="b3-garden" aria-label="Garden" hidden>${glyph('sprout')}<span>Garden</span></button>
    </div>
    <div class="b3-sheet">
      <button type="button" class="b3-grip" aria-label="Fold the sheet"></button>
      <div class="room-hinge b3-hinge"><span class="pdx-lens" aria-hidden="true"></span><span class="mdex-lights" aria-hidden="true"><span class="pdx-light red"></span><span class="pdx-light yellow"></span><span class="pdx-light green"></span></span>
        <nav class="b3-tabs">
          ${[['furniture', 'Furniture', 'sofa'], ['wall', 'Wallpaper', 'roller'], ['floor', 'Floor', 'floor'], ['mons', 'Pokémon', 'ball']]
            .map(([id, name, g]) => `<button type="button" class="b3-tab" data-tab="${id}" title="${name}" aria-label="${name}"><span class="round-key">${glyph(g)}</span></button>`).join('')}
        </nav>
        <div class="b3-acts" hidden>
          ${[['rotate', 'Turn'], ['paint', 'Colour'], ['store', 'Store'], ['cancel', 'Cancel']]
            .map(([act, name]) => `<button type="button" class="b3-act" data-act="${act}" title="${name}" aria-label="${name}"><span class="round-key">${glyph(act === 'cancel' ? 'close' : act)}</span></button>`).join('')}
        </div>
        <button type="button" class="room-ok b3-ok">Done</button>
      </div>
      <div class="b3-filters" hidden></div>
      <div class="b3-screen"><div class="b3-strip"></div></div>
    </div>`;
  document.body.append(root);
  view = root.querySelector('.b3-view');
  hud = { hint: root.querySelector('.b3-hint'), fps: null };
  if (new URLSearchParams(location.search).has('fps')) { hud.fps = root.querySelector('.b3-fps'); hud.fps.hidden = false; }
  // like every window in the game, a tap anywhere else puts the cream ones away: the hint, and the present's card
  root.addEventListener('pointerdown', (e) => {
    // Smeargle talking: a tap anywhere is the next line, as in Animal Crossing
    if (visit?.phase === 'talk') { e.stopPropagation(); swallowClick = e.target === view; playSound('select'); return sayNext(); }
    const gift = root.querySelector('.b3-gift');
    if (!gift.hidden && !gift.contains(e.target)) { gift.hidden = true; swallowClick = e.target === view; e.stopPropagation(); return refresh(); }
    if (hud.hint.textContent && !hud.hint.classList.contains('hush')) { hushed = hud.hint.textContent; hud.hint.classList.add('hush'); }
  }, true);

  try {
    THREE = await loadThree();
    renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
  } catch { return fallBack(); }
  wakeGL(renderer);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.5, 120);

  hemi = new THREE.HemisphereLight('#fff', '#666', 1);
  sun = new THREE.DirectionalLight('#fff', 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
  sun.shadow.bias = -0.0015;
  sun.shadow.normalBias = 0.02;
  scene.add(hemi, sun);
  // made up front and only switched on and off, so placing a lamp never recompiles every shader mid-tap
  for (let i = 0; i < LAMPS; i++) { const l = new THREE.PointLight('#ffc070', 0, 7, 1.6); l.visible = false; lampLights.push(l); scene.add(l); }

  ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 24), new THREE.MeshBasicMaterial({ color: '#fff6c0', transparent: true, opacity: 0, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  foot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#60e080', transparent: true, opacity: 0.45, depthWrite: false, depthTest: false, side: THREE.DoubleSide }));
  foot.visible = false; foot.renderOrder = 10;   // seen through whatever stands on the tiles
  selBox = new THREE.Box3Helper(new THREE.Box3(), '#ffe060');
  selBox.visible = false;
  // both follow the lawn's roll out in the yard (a no-op indoors, where BEND.k is 0)
  bend(foot.material, BEND); bend(selBox.material, BEND);
  roomGroup = new THREE.Group(); pieceGroup = new THREE.Group();
  scene.add(ring, foot, selBox, roomGroup, pieceGroup);

  // the furniture is smooth 3D: a sharper scene, scaled up smoothly, not in whole pixels
  post = createPost(renderer, { short: 820, crisp: false });
  base = goRoom(loadBase(), start);
  useRoom(base);
  if (outdoors()) root.querySelector('.b3-top h2').textContent = roomName(base.house, 'yard');
  buildRoom();
  buildPieces();
  mon = await makeMon();
  mon.board.userData.who = { mon, w: walker };
  walker.tile = nearestFree(startTile());
  walker.x = tileX(walker.tile.x); walker.z = tileZ(walker.tile.y);
  camX = panX = walker.x;
  setTime(true);
  resize();
  try { lowered = +localStorage.getItem('pokedb.base3d.low') || 0; } catch {}
  for (let i = 0; i < lowered; i++) if (!stepDown()) break;
  new ResizeObserver(resize).observe(view);
  view.addEventListener('click', onTap);
  drags = dragWalk({ target: view, can: (e) => mode === 'walk' && !holding && visit?.phase !== 'talk' && !yardTalk && e.target === view, tile: floorTile, go: (t) => walkFloor(t, true) });
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', (e) => { touches.delete(e.pointerId); pinch = null; drag = null; pressing = false; pointer = null; });
  view.addEventListener('wheel', (e) => {
    if (mode !== 'edit') return;
    e.preventDefault();
    setZoom(zoom * Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });
  root.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => act(b.dataset.act)));
  // the grip, or a tap on the hinge's lens and lights, folds the sheet to its hinge and back; a tab opens it again
  const fold = (to = !folded) => { folded = to; playSound(folded ? 'cancel' : 'select'); refresh(); };
  root.querySelector('.b3-grip').addEventListener('click', () => fold());
  root.querySelector('.b3-hinge').addEventListener('click', (e) => { if (!e.target.closest('button')) fold(); });
  root.querySelectorAll('.b3-tab').forEach(b => b.addEventListener('click', () => { folded = false; playSound('select'); shopMsg = ''; untry(); tray(b.dataset.tab); refresh(); }));
  root.querySelector('.b3-gift .b3-done').addEventListener('click', () => { root.querySelector('.b3-gift').hidden = true; tray('furniture'); setMode('edit'); refresh(); });
  root.querySelector('.b3-decor').addEventListener('click', () => setMode('edit'));
  root.querySelector('.b3-garden').addEventListener('click', tendGarden);
  // with a piece in hand the gold pill puts it down; with one picked it lets go of it; else it ends decorating
  root.querySelector('.b3-ok').addEventListener('click', () => holding ? place() : sel >= 0 ? act('done') : setMode('walk'));
  new ResizeObserver(resize).observe(root.querySelector('.b3-sheet'));
  tray('furniture');
  refresh();
  liveNews();
  syncGuests();
  startVisit();
  await warmShaders(renderer, scene, camera);
  requestAnimationFrame(frame);
  curtain(false);
}

function startTile() {
  const mid = Math.floor(COLS / 2);
  for (let r = 0; r < COLS; r++) for (let y = ROWS - 2; y >= 0; y--) for (const x of [mid - r, mid + r]) {
    if (x >= 0 && x < COLS && onFloor(x, y) && !blocked.has(key(x, y))) return { x, y };
  }
  return { x: mid, y: ROWS - 1 };
}
