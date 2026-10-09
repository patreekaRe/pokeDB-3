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
import { playSound, playCry } from './audio.js';
import { partner } from './trainercard.js';
import { loadThree, tex, crop, trim, dispose, monBoard, drawMon, onSprite, createPost, curtain } from './hd2d.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { RES, HD, sh as shadeOf } from './base-paint.js';
import { furnitureModel } from './base-mesh.js';
import { dressPlay, tapPlay, tickPlay, stopPlay } from './base-play.js';
import { shapeOf, seatHeight } from './base-shapes.js';
import { SAFARI_DEX_PAGES } from './data/safari.js';
import { PIECES, DESIGNS, colours, styles, WALLPAPERS, FLOORS, papers, T, WALL, COLS, ROWS, footprint, fits, aimTile, icon, loadBase, saveBase, roomArt, pieceArt,
  spare, openGift, ownsPaper, buyPaper, paperArt, cells, surfaceOf, surfaceUnder, ridersOf, standing } from './secret-base.js';

const PX = 1 / (T * RES);   // furniture: one painted pixel
const WALL_H = WALL / T;   // 3 tiles, as in the 2D room
const LAMPS = 2;           // lamps that really light the room (point lights are dear on phones); the rest only glow
const MIN_ACROSS = 6;      // tiles the view shows across at least, an upright phone panning over the rest
const ON_SHOW = 6;         // Safari catches living in the base at once
const RIDER = 0.72;        // a piece up on a table, at this size
// kinds of piece a Pokémon climbs onto, and what it does there; any piece with a seat height (js/base-shapes.js) too
const SEATS = { bed: { rest: [9000, 16000], sleep: true }, cushion: { rest: [5000, 9000] } };

const seatOf = (id) => { const p = PIECES[id]; return SEATS[p.seat || p.fam] || (seatHeight(p.fam, p) ? { rest: [6000, 12000] } : null); };

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
// Walk shows only the room; Decorate pulls the camera back over the whole room and brings up the sheet
let mode = 'walk', blend = 0, shots = null, fitted = null, viewW = 0, viewH = 0;
let guests = [], puffs = [], puffTex = {};
const standees = new Set();   // round pieces drawn as their painting (js/base-model.js), leaned back like the Pokémon
let giftBoard = null, unwrapping = null, shopMsg = '';
let hushed = null;   // the hint tapped away: it stays away until it says something else
let trying = null;   // a wallpaper or floor up on approval: { field, id, was }
let exitMat = null;   // the doormat over the front edge: a tap walks your partner out, as in a Pokémon house
let leaveTo = null;   // where the ✕ walks back to (the hub's door); without it, a ?base playtest reloads onto the title   // the Safari Pokémon on show, and the hearts and Zs floating off them

const tileX = (tx) => tx + 0.5 - COLS / 2;
const tileZ = (ty) => ty + 0.5 - ROWS / 2;


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

function buildRoom() {
  dispose(roomGroup);
  const art = roomArt(base);
  const edge = solid('#2a1e16'), trimC = wallTrim(art);

  const floorTex = tex(crop(art, 0, WALL, COLS * T, ROWS * T));
  const floor = new THREE.Mesh(new THREE.BoxGeometry(COLS, 0.6, ROWS),
    [edge, edge, new THREE.MeshStandardMaterial({ map: floorTex, roughness: 1 }), edge, solid('#3a2a1e'), edge]);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  roomGroup.add(floor);

  const paper = new THREE.MeshStandardMaterial({ map: tex(crop(art, 0, 0, COLS * T, WALL)), roughness: 1 });
  const cap = solid(shade(trimC, 1.15)), outer = solid(shade(trimC, 0.6));
  const back = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, WALL_H, 0.4), [outer, outer, cap, outer, paper, outer]);
  back.position.set(0, WALL_H / 2, -ROWS / 2 - 0.2);
  back.receiveShadow = true;
  roomGroup.add(back);
  // the side walls stop short of the front, so the camera sees in over them, a diorama's cut-away
  const sidePaper = new THREE.MeshStandardMaterial({ map: tex(crop(art, 0, 0, ROWS * T, WALL)), roughness: 1 });
  for (const s of [-1, 1]) {
    const faces = [outer, outer, cap, outer, outer, outer];
    faces[s < 0 ? 0 : 1] = sidePaper;
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.4, WALL_H, ROWS), faces);
    side.position.set(s * (COLS / 2 + 0.2), WALL_H / 2, 0);
    side.receiveShadow = true; side.castShadow = true;
    roomGroup.add(side);
  }
  dressRoom(art, cap, outer);
  // the mat lies on a doorstep jutting out of the base, past the floor's edge, so it takes no tile
  const step = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.95), [outer, outer, cap, outer, outer, outer]);
  step.position.set(tileX(Math.floor(COLS / 2)), -0.1, ROWS / 2 + 0.4 + 0.47);
  step.receiveShadow = true;
  roomGroup.add(step, exitMat = makeExitMat());
}

/** A woven red doormat on the doorstep outside the room with a cream arrow pointing out, off the tiles so nothing covers it. */
function makeExitMat() {
  const c = document.createElement('canvas');
  c.width = 288; c.height = 128;
  const g = c.getContext('2d');
  for (let x = 14; x < 274; x += 7) {   // fringe at both ends
    g.strokeStyle = '#d8c09a'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, 4); g.lineTo(x, 16); g.moveTo(x, 112); g.lineTo(x, 124); g.stroke();
  }
  const body = g.createLinearGradient(0, 12, 0, 116);
  body.addColorStop(0, '#d0503e'); body.addColorStop(1, '#a8382c');
  g.fillStyle = body; g.beginPath(); g.roundRect(6, 12, 276, 104, 14); g.fill();
  g.strokeStyle = '#7a2420'; g.lineWidth = 5; g.beginPath(); g.roundRect(16, 22, 256, 84, 9); g.stroke();
  g.globalAlpha = 0.12; g.fillStyle = '#000';
  for (let y = 26; y < 104; y += 6) g.fillRect(20, y, 248, 2);
  g.globalAlpha = 1;
  g.fillStyle = '#fbf0d8'; g.strokeStyle = '#7a2420'; g.lineWidth = 4; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(112, 38); g.lineTo(176, 38); g.lineTo(144, 92); g.closePath(); g.fill(); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const top = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 1, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0 });
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.8), top);
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(tileX(Math.floor(COLS / 2)), -0.015, ROWS / 2 + 0.87);
  mat.receiveShadow = true;
  return mat;
}

/** Your partner walks to the front of the room and out over the doormat; then the room is left as by the ✕. */
function headOut() {
  if (mode !== 'walk') return;
  const door = { x: Math.floor(COLS / 2), y: ROWS - 1 };
  const go = () => {
    walker.path = route(walker.tile, door);
    walker.path.push({ x: door.x, y: ROWS + 0.37 });
    walker.exit = true;
    ring.position.set(exitMat.position.x, 0, exitMat.position.z);
    ring.material.opacity = 0.9;
  };
  follow = true;
  walker.goal = null; walker.seatTo = null;
  if (walker.seat) getUp(go); else if (!walker.jump) go();
  playSound('confirm');
}

const UPPER = 9, PLINTH = 6;   // tall enough to fill an upright phone above the wall and below the floor

/* The room in a dollhouse: the walls run on up past a picture rail (the wallpaper's pattern, without its skirting,
   repeated), and the floor sits on a thick base cut at the front, so a tall screen shows no empty sky round it.
   fitShot() still frames the 3-tile room; these only fill what's left. They cast no shadows into it. */
function dressRoom(art, cap, outer) {
  const upper = (w, d) => {
    const t = tex(crop(art, 0, 0, d * T, 2 * T));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, UPPER / 2);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 1 });
  };
  const rail = solid(shade(cap.color.getHexString(), 0.9));
  const top = WALL_H + UPPER / 2;
  const back = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, UPPER, 0.4), [outer, outer, outer, outer, upper(COLS + 0.8, COLS), outer]);
  back.position.set(0, top, -ROWS / 2 - 0.2);
  back.receiveShadow = true;
  const backRail = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 0.14, 0.16), rail);
  backRail.position.set(0, WALL_H + 0.07, -ROWS / 2 + 0.08);
  roomGroup.add(back, backRail);
  for (const s of [-1, 1]) {
    const faces = [outer, outer, outer, outer, outer, outer];
    faces[s < 0 ? 0 : 1] = upper(ROWS, ROWS);
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.4, UPPER, ROWS), faces);
    side.position.set(s * (COLS / 2 + 0.2), top, 0);
    side.receiveShadow = true;
    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, ROWS), rail);
    sideRail.position.set(s * (COLS / 2 - 0.08), WALL_H + 0.07, 0);
    roomGroup.add(side, sideRail);
  }
  // the base under the floor: its cut top in the trim's colour, a dark wood front going down out of view
  const lip = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 0.12, 0.4), cap);
  lip.position.set(0, 0.02, ROWS / 2 + 0.2);
  lip.receiveShadow = true;
  const wood = solid('#3a281c');
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, PLINTH, 0.4), wood);
  plinth.position.set(0, -0.04 - PLINTH / 2, ROWS / 2 + 0.2);
  const band = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 0.1, 0.02), rail);
  band.position.set(0, -0.6, ROWS / 2 + 0.41);
  roomGroup.add(lip, plinth, band);
}

// the trim colour is the wallpaper strip's bottom row, whatever the paper
function wallTrim(art) {
  const [r, g, b] = art.getContext('2d').getImageData(4, WALL - 3, 1, 1).data;
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function buildPieces() {
  pieceGroup.traverse(o => { if (o.userData.play) stopPlay(o.userData.play); });
  dispose(pieceGroup);
  blocked = new Set(); winMats = []; shafts = []; motes = [];
  giftBoard = null;
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
  if (p.layer === 'wall') {
    const art = pieceArt(it.id, 0, HD), m = new THREE.MeshStandardMaterial({ map: tex(art), transparent: true, alphaTest: 0.5, roughness: 1 });
    if (p.glow && !ghostly) { m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = tex(mask(art, p.glow)); winMats.push(m); }
    const plane = add(new THREE.PlaneGeometry(p.w, WALL_H), m, false);
    plane.position.set(it.x - COLS / 2 + p.w / 2, WALL_H / 2, -ROWS / 2 + 0.01 + (ghostly ? 0.01 : 0));
    if (p.fam === 'window' && !ghostly) addShaft(group, plane.position.x);
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
  if (!ghostly) dressPlay(THREE, model, p);
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
  if (p.glow) group.userData.lamp = new THREE.Vector3(cx, model.position.y + model.userData.top * k - 0.35, cz + 0.3);
  return group;
}

/** A soft shaft of light from the window down to the floor, drawn additive so bloom picks it up, and dust in it. */
function addShaft(group, x) {
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
  shaft.position.set(x, 1.15, -ROWS / 2 + 1.6);
  shaft.rotation.x = -1.05;
  shaft.raycast = () => {};
  group.add(shaft);
  shafts.push(shaft);

  const n = 36, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = x + (Math.random() - 0.5) * 1.6;
    pos[i * 3 + 1] = Math.random() * 2.6;
    pos[i * 3 + 2] = -ROWS / 2 + 0.4 + Math.random() * 2.6;
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
  scene.add(ghost);
  const [fw, fh] = wall ? [PIECES[holding.id].w, WALL_H] : footprint({ id: holding.id, dir: holding.dir });
  foot.scale.set(fw, fh, 1);
  foot.rotation.x = wall ? 0 : -Math.PI / 2;
}

/** Where the ghost goes for a point on the view (in NDC): the floor tile under it, or for a wall piece the wall. */
function aimFrom(nx, ny) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
  const hit = new THREE.Vector3(), p = PIECES[holding.id];
  const plane = p.layer === 'wall' ? new THREE.Plane(new THREE.Vector3(0, 0, 1), ROWS / 2) : new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  if (!ray.ray.intersectPlane(plane, hit) && !ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
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
  ghost.position.set(it.x, wall ? 0 : 0.08, wall ? 0 : it.y);
  const model = ghost.userData.model, under = it.up ? base.items[surfaceUnder(it, base)] : null;
  if (model) { model.scale.setScalar(under ? RIDER : 1); model.position.y = under ? surfaceOf(under.id) - 0.06 : 0; }
  const [fw, fh] = wall ? [PIECES[it.id].w, 0] : footprint(it), ok = fits(it, -1, base);
  if (wall) foot.position.set(it.x - COLS / 2 + fw / 2, WALL_H / 2, -ROWS / 2 + 0.03);
  else foot.position.set(it.x - COLS / 2 + fw / 2, under ? surfaceOf(under.id) + 0.02 : 0.025, it.y - ROWS / 2 + fh / 2);
  foot.material.color.set(ok ? '#60e080' : '#ff5050');
  const tint = new THREE.Color(ok ? '#b0ffc0' : '#ff8080');
  ghost.traverse(o => { for (const m of [o.material].flat()) if (m?.color) m.color.copy(m.userData.own ??= m.color.clone()).multiply(tint); });
  foot.visible = true;
}

function place() {
  if (!holding || !aimAt) return;
  const it = held();
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
async function makeMon(mate = partner(getSave()), back = true) {
  const m = await monBoard(mate, back);
  scene.add(m.group);
  return m;
}

/* ---------- walking ---------- */

const key = (x, y) => `${x},${y}`;
const inRoom = (c) => c.x >= 0 && c.y >= 0 && c.x < COLS && c.y < ROWS;
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

/** The catches on show: the save's pick, or before one is made the first ON_SHOW caught, so the room is never empty.
    `&guests` lends every Safari Pokémon as caught for the page load, to playtest without a full Safari Pokédex. */
function onShow() {
  const lend = new URLSearchParams(location.search).has('guests');
  const caught = new Set(getSave().safariDex?.caught || []);
  const all = [...new Set(SAFARI_DEX_PAGES.flatMap(p => p.ids))].filter(id => (lend || caught.has(id)) && ENEMY_DEFS[id]);
  return { all, shown: (base.mons ?? all.slice(0, ON_SHOW)).filter(id => all.includes(id)) };
}

/** Tiles someone stands on or is heading for, so two never pick the same one. */
function taken(skip) {
  const out = new Set();
  for (const w of [walker, ...guests.map(g => g.w)]) {
    if (!w || w === skip || !w.tile) continue;
    out.add(key(w.tile.x, w.tile.y));
    const end = w.path.at(-1);
    if (end) out.add(key(end.x, end.y));
  }
  return out;
}

function freeTiles(skip) {
  const busy = taken(skip), out = [];
  for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (!blocked.has(key(x, y)) && !busy.has(key(x, y))) out.push({ x, y });
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
  const def = ENEMY_DEFS[id], g = { id, mon: null, w: null };
  guests.push(g);
  const m = await makeMon({ src: def.image, name: def.name, cry: def.spriteId ?? id }, false);
  if (!guests.includes(g)) { dispose(m.group); scene.remove(m.group); return; }
  const spots = freeTiles();
  const tile = spots.length ? spots[Math.floor(Math.random() * spots.length)] : nearestFree({ x: 5, y: ROWS - 1 });
  g.w = { tile, x: tileX(tile.x), z: tileZ(tile.y), y: 0, path: [], facing: 'front', flip: Math.random() < 0.5, hop: 0, think: performance.now() + rand(800, 3000) };
  m.board.userData.who = g;
  g.mon = m;
  cheer(g, 2);
}

/** The places on a piece a Pokémon can sit: a bed or a cushion its middle; a chair, sofa or bench one a tile, a
    little towards its front, at its seat's height (js/base-shapes.js). */
function seatSpots(it) {
  const p = PIECES[it.id], [fw, fh] = footprint(it), y = seatHeight(p.fam, p) || p.high || 0;
  if (p.seat) return [{ x: it.x - COLS / 2 + fw / 2, z: it.y - ROWS / 2 + fh / 2, y, tile: { x: it.x + Math.floor((fw - 1) / 2), y: it.y + Math.floor((fh - 1) / 2) } }];
  const a = -(it.dir ?? 0) * Math.PI / 2, fx = Math.sin(a) * 0.1, fz = Math.cos(a) * 0.1, out = [];
  for (let i = 0; i < fw; i++) for (let j = 0; j < fh; j++) out.push({ x: it.x + i + 0.5 - COLS / 2 + fx, z: it.y + j + 0.5 - ROWS / 2 + fz, y, tile: { x: it.x + i, y: it.y + j } });
  return out;
}

/** Every free place to sit in the room: { it, k } for spot k of piece it, none someone's on or heading for. */
function seats() {
  const used = new Set([walker, ...guests.map(g => g.w)].map(w => w?.seat ?? w?.seatTo).filter(Boolean).map(s => `${base.items.indexOf(s.it)}:${s.k}`));
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
    w.seat = null;
    leap(w, { x: tileX(down.x), y: 0, z: tileZ(down.y) }, 420, () => { w.tile = down; w.think = now + rand(1500, 4000); });
    return;
  }
  const free = seats();
  if (free.length && Math.random() < 0.35) {
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
  });
}

/** After the furniture changes: anyone on a seat that went comes down, walks are forgotten, and no one stands in a piece. */
function settleGuests() {
  // your partner off a seat that went or moved
  if (walker.seat && !base.items.includes(walker.seat.it)) {
    const down = nearestFree(walker.seat.tile);
    Object.assign(walker, { seat: null, y: 0, tile: down, x: tileX(down.x), z: tileZ(down.y) });
  }
  if (walker.goal) { walker.goal = null; walker.seatTo = null; walker.path = []; }
  for (const { w } of guests) {
    if (!w || w.jump) continue;
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

/* ---------- hearts and Zs ---------- */

function puffTexture(kind) {
  if (puffTex[kind]) return puffTex[kind];
  const rows = kind === 'heart'
    ? ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']
    : kind === 'star' ? ['...#...', '..###..', '#######', '.#####.', '.##.##.', '#.....#']
    : ['#####', '...#.', '..#..', '.#...', '#####'];
  const c = new OffscreenCanvas(rows[0].length + 2, rows.length + 2), x = c.getContext('2d');
  const ink = { heart: '#ff5a8a', star: '#ffe060' }[kind] || '#e8f0ff', edge = { heart: '#8a1a3a', star: '#8a5a00' }[kind] || '#2a3a6a';
  rows.forEach((r, y) => [...r].forEach((ch, i) => { if (ch === '#') { x.fillStyle = edge; x.fillRect(i, y, 3, 3); } }));
  rows.forEach((r, y) => [...r].forEach((ch, i) => { if (ch === '#') { x.fillStyle = ink; x.fillRect(i + 1, y + 1, 1, 1); } }));
  return (puffTex[kind] = tex(c));
}

function puff(kind, w, m) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTexture(kind), transparent: true, depthWrite: false }));
  const size = kind === 'z' ? 0.2 : 0.26;
  s.scale.set(size, size * (kind === 'z' ? 1 : 8 / 9), 1);
  s.raycast = () => {};
  scene.add(s);
  puffs.push({ s, t0: performance.now(), life: kind === 'heart' ? 1100 : 2200, x: w.x + rand(-0.2, 0.2), y: w.y + m.top, z: w.z + 0.05, sway: rand(0, 6), drift: kind === 'z' ? 0.25 : 0 });
}

function livePuffs(now) {
  puffs = puffs.filter(p => {
    const k = (now - p.t0) / p.life;
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
  if (!holding) {
    const i = pieceUnder(ndc(e));
    if (i >= 0 && !PIECES[base.items[i].id].gift) { grab = { i, x: e.clientX, y: e.clientY }; view.setPointerCapture?.(e.pointerId); }
    return;
  }
  pressing = true; pointer = ndc(e);
  view.setPointerCapture?.(e.pointerId);
  aimFrom(...pointer); showGhost();
}
function onMove(e) {
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
function onUp() {
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
  const boards = [mon.board, ...guests.filter(g => g.mon).map(g => g.mon.board)];
  return ray.intersectObjects([...boards, pieceGroup, ...(mode === 'walk' ? [exitMat] : [])], true).find(h => !h.object.userData.who || onSprite(h))?.object;
}

function onTap(e) {
  if (swallowClick || holding) { swallowClick = false; return; }
  const ray = new THREE.Raycaster();
  const first = tapped(ndc(e), ray);
  walker.exit = false;
  if (first === exitMat) return headOut();
  if (first === mon.board) {
    playCry(mon.id);
    walker.hopUntil = performance.now() + 500;
    return;
  }
  if (first?.userData.who) return cheer(first.userData.who);
  let g = first;
  while (g && g.userData.index === undefined) g = g.parent;
  if (g && g.parent === pieceGroup && PIECES[base.items[g.userData.index].id].gift) return unwrap(g.userData.index);
  if (mode !== 'edit' && g && g.parent === pieceGroup) {
    const it = base.items[g.userData.index], play = g.userData.model?.userData.play;
    // a tap on a piece works it (the TV changes channel, the fridge opens...), and your partner cheers it on
    if (play) {
      const r = tapPlay(play), now = performance.now();
      if (r.cheer) walker.hopUntil = now + 500;
      if (r.cheer === 'heal') for (const gu of guests) if (gu.mon) cheer(gu, 4);
      if (!seatOf(it.id)) return;
    }
    if (seatOf(it.id) && sitPartner(it)) return;
  }
  if (mode === 'edit' && g && g.parent === pieceGroup) {
    // a second tap on the picked piece turns it
    if (sel === g.userData.index) return PIECES[base.items[sel].id].layer === 'wall' ? undefined : act('rotate');
    sel = g.userData.index;
    playSound('confirm');
    return refresh();
  }
  if (sel >= 0) { sel = -1; refresh(); }
  const hit = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
  const to = { x: Math.floor(hit.x + COLS / 2), y: Math.floor(hit.z + ROWS / 2) };
  if (!inRoom(to)) return;
  const go = () => {
    walker.path = route(walker.tile, to);
    const end = walker.path.at(-1) ?? walker.tile;
    ring.position.set(tileX(end.x), 0.02, tileZ(end.y));
    ring.material.opacity = 0.9;
  };
  follow = true;
  walker.goal = null; walker.seatTo = null;
  if (walker.seat) getUp(go); else if (!walker.jump) go();
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
  if (tab === 'furniture') for (const id of DESIGNS.filter(id => spare(base, id) > 0 && KINDS_OF[kindPick](PIECES[id]))) add(PIECES[id].name, () => icon(id), holding?.id === id && !holding.back, () => {
    if (holding?.back) act('cancel');
    if (holding?.id === id) { dropHold(); refresh(); return; }
    if (holding) dropHold();
    playSound('confirm');
    hold(id);
  }, spare(base, id) > 1 && spare(base, id) < Infinity ? `×${spare(base, id)}` : PIECES[id].layer === 'wall' ? 'Wall' : '');
  // the ones you have first, then the ones for sale, cheapest first
  const swatch = (all, field) => [...all.filter(s => ownsPaper(base, field, s)), ...all.filter(s => !ownsPaper(base, field, s)).sort((a, b) => a.price - b.price)]
    .forEach(s => add(s.name, () => paperArt(field, s.id), base[field] === s.id, () => paperTap(field, s), ownsPaper(base, field, s) ? '' : s.price.toLocaleString()));
  if (tab === 'wall') swatch(WALLPAPERS, 'wall');
  if (tab === 'floor') swatch(FLOORS, 'floor');
  if (tab === 'mons') {
    const { all, shown } = onShow();
    // the ones on show first, then every other catch in Pokédex order
    for (const id of [...shown, ...all.filter(id => !shown.includes(id))]) {
      const img = Object.assign(document.createElement('img'), { loading: 'lazy', src: ENEMY_DEFS[id].image, alt: '', draggable: false, className: 'pixel' });
      add(ENEMY_DEFS[id].name, img, shown.includes(id), () => {
        const now = onShow().shown;
        if (now.includes(id)) { base.mons = now.filter(x => x !== id); playSound('cancel'); }
        else if (now.length >= ON_SHOW) { playSound('cancel'); hushed = null; hud.hint.classList.remove('hush'); hud.hint.textContent = `${ON_SHOW} can live here at once. Tap one to send it back first.`; return; }
        else { base.mons = [...now, id]; playSound('confirm'); }
        save(); syncGuests(); tray(); refresh();
      }, shown.includes(id) ? '✓' : '');
    }
  }
}

// the Furniture tab's filters, by what a piece is (the user's ask, 2026-10-09: a long strip was hard to pick from)
const KINDS_OF = {
  All: () => true,
  Seats: (p) => !!p.seat || ['Seats', 'Beds', 'Cushions'].includes(p.group),
  Tables: (p) => p.group === 'Tables' || /table|desk|counter/i.test(p.name),
  Storage: (p) => /shelf|shelves|cabinet|chest|drawer|wardrobe|dresser|locker|bookcase|cupboard/i.test(p.name),
  Plants: (p) => ['Plants', 'Garden', 'Greenhouse'].includes(p.group) || /plant|tree|flower|bush|cactus|fern|bonsai|pot/i.test(p.name),
  Lights: (p) => !!p.glow,
  Rugs: (p) => p.layer === 'rug',
  Wall: (p) => p.layer === 'wall',
  Dolls: (p) => p.group === 'Dolls',
  Other: (p) => !Object.entries(KINDS_OF).some(([k, test]) => k !== 'All' && k !== 'Other' && test(p)),
};
let kindPick = 'All';

/** The filter chips over the Furniture tab: only kinds you have a piece of, so none ever opens empty. */
function filters() {
  const row = root.querySelector('.b3-filters');
  row.hidden = tab !== 'furniture';
  if (row.hidden) return;
  const have = DESIGNS.filter(id => spare(base, id) > 0).map(id => PIECES[id]);
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
  // a piece in hand or picked tucks the sheet down to its hinge and keys, so the room has the screen
  root.classList.toggle('tucked', mode === 'edit' && !!busy);
  root.classList.toggle('painting', tab === 'colour');
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
  const tip = mode === 'walk' && giftBoard && root.querySelector('.b3-gift').hidden;
  hud.hint.classList.toggle('tip', !!tip);
  // with a piece in hand or picked the hinge's LCD says what's going on, and nothing covers the room
  hud.hint.textContent = tip ? 'A present! Tap it to open it.'
    : busy ? ''
    : trying ? `${papers(trying.field).find(s => s.id === trying.id).name}: ${papers(trying.field).find(s => s.id === trying.id).price.toLocaleString()} PokéCoins. Tap again to buy.`
    : (tab === 'wall' || tab === 'floor') && shopMsg ? shopMsg
    : tab === 'wall' || tab === 'floor' ? 'Tap one to put it up. Ones with a price go up on approval first.'
    : tab === 'furniture' && !DESIGNS.some(id => spare(base, id) > 0) ? 'Everything is out. Buy more at the Poké Mall.'
    : tab === 'mons' ? (mons.all.length ? `Up to ${ON_SHOW} Safari catches can live here.` : 'Catch Pokémon in the Safari Zone and they can live here.')
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
  const L = LIGHT[t];
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.amb;
  sun.color.set(L.sun); sun.intensity = L.sunI; sun.position.set(...L.at);
  for (const l of lampLights) l.intensity = L.lamp * 3;
  for (const m of winMats) { m.userData.was = m.userData.lamp ? Math.min(1, L.lamp / 2) : L.win; m.emissiveIntensity = m.userData.off ? 0 : m.userData.was; }
  for (const s of shafts) s.material.opacity = L.shaft;
  for (const d of motes) d.material.opacity = L.motes;
  scene.background = new THREE.Color(L.bg);
}


/* ---------- camera ---------- */

/* Two shots, blended as you switch: walking, a lower, closer look that follows your partner (Octopath's tilt, the room
   at eye level); decorating, higher and pulled back so the whole room fits over the sheet, every tile in reach. */
// walking matches the Clearing outside (js/hub-3d.js: PITCH 0.6, ACROSS 8), so your partner is the same size in and out
const SHOT = { walk: { pitch: 0.6, across: 8 }, edit: { pitch: 0.9, across: COLS + 1.2 } };
const LOOK_Y = 0.9;

function aimCamera(x, d, pitch) {
  camera.position.set(x, LOOK_Y + Math.sin(pitch) * d, Math.cos(pitch) * d);
  camera.lookAt(x, LOOK_Y, 0);
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
  fitted = { walk: fitShot(SHOT.walk, w, h, 0), edit: fitShot(SHOT.edit, w, h, sheet) };
  shots ??= structuredClone(fitted);
}

// the sheet tucking down or coming back changes the room's fit: the camera glides to the new one rather than jumping
function easeShots(dt) {
  const k = calm ? 1 : Math.min(1, dt / 1000 * 6);
  for (const s of ['walk', 'edit']) for (const key in fitted[s]) shots[s][key] += (fitted[s][key] - shots[s][key]) * k;
}

function placeCamera(dt, now) {
  easeShots(dt);
  blend = calm ? +(mode === 'edit') : blend + ((mode === 'edit') - blend) * Math.min(1, dt / 1000 * 6);
  const k = blend * blend * (3 - 2 * blend), mix = (key) => shots.walk[key] + (shots.edit[key] - shots.walk[key]) * k;
  const room = COLS / 2 + 0.6, half = mix('half');
  if (holding && pressing && pointer && Math.abs(pointer[0]) > 0.7) {
    panX += Math.sign(pointer[0]) * (Math.abs(pointer[0]) - 0.7) / 0.3 * dt / 1000 * 5;
  }
  const clamp = (x) => half >= room ? 0 : Math.max(-room + half, Math.min(room - half, x));
  panX = clamp(panX);
  const want = follow ? clamp(walker.x) : panX;
  const before = camX;
  camX = calm ? want : camX + (want - camX) * Math.min(1, dt / 1000 * 4);
  camera.setViewOffset(viewW, viewH, 0, mix('shift'), viewW, viewH);
  const pitch = mix('pitch');
  aimCamera(camX, mix('dist'), pitch);
  // Pokémon lean back by the tilt, as in the Clearing, so they face the camera unsquashed
  for (const m of [mon, ...guests.map(g => g.mon)]) if (m) m.board.rotation.x = -pitch;
  // and so do the pieces that stand as their painting
  for (const s of standees) { if (!s.parent) standees.delete(s); else s.rotation.x = -pitch; }
  if (holding && pressing && pointer && Math.abs(camX - before) > 1e-4) { aimFrom(...pointer); showGhost(); }
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
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  post.size(w, h);
  camera.aspect = w / h;
  viewW = w; viewH = h;
  fitCamera(w, h);
}

/* ---------- the frame ---------- */

function frame(now) {
  if (!root.isConnected) return;
  const dt = Math.min(100, now - (last || now));
  last = now;
  fpsLog.push(dt); if (fpsLog.length > 60) fpsLog.shift();

  if (!hopping(walker, now) && walk(walker, mon, dt)) {
    if (walker.goal) partnerUp();
    else if (walker.exit) { walker.exit = false; leave(); }
  }
  // the mat's arrow breathes, so it reads as the way out
  if (!calm) exitMat.material.emissiveIntensity = mode === 'walk' ? 0.12 + Math.sin(now / 420) * 0.1 : 0;
  const happy = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : happy ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, walker.y ?? 0, walker.z);
  mon.board.position.y = bob;
  mon.board.scale.x = walker.flip ? -1 : 1;
  drawMon(mon, walker, dt);
  for (const g of guests) if (g.mon) liveGuest(g, dt, now);
  livePuffs(now);
  liveGift(now);
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
  // the tilt-shift keeps its sharp band on what you're handling: the ghost, the picked piece, else the partner
  const focus = holding && aimAt ? foot.position : selBox.visible ? selBox.box.getCenter(new THREE.Vector3()) : new THREE.Vector3(walker.x, 0.6, walker.z);
  post.draw(scene, camera, (focus.clone().project(camera).y + 1) / 2);

  if (hud.fps) hud.fps.textContent = `${Math.round(1000 / (fpsLog.reduce((a, b) => a + b, 0) / fpsLog.length))} fps`;
  requestAnimationFrame(frame);
}

/** The 2D room instead, where there's no WebGL or no Three.js (offline). */
async function fallBack() {
  root.remove();
  root = null;
  await (await import('./secret-base.js')).openBase();
  curtain(false);
}

/** Out through the door: dark, the room put away (kept, so going back in is quick), then wherever it was opened from. */
async function leave() {
  if (leave.busy) return;   // the ✕ tapped while your partner is already walking out over the mat
  if (!leaveTo) { location.href = location.pathname; return; }
  leave.busy = true;
  playSound('door');
  await curtain(true);
  if (holding) act('cancel');
  untry();
  root.remove();
  await leaveTo();
  leave.busy = false;
  curtain(false);
}

/** Back in a second time: the room as it was left, the partner in at the door, any new catches moved in. */
async function reopen() {
  calm = calmFx();
  base = loadBase();   // the mall's Furniture store may have bought into it since
  document.body.append(root);
  const mate = partner(getSave());
  if (mon.src !== mate.src) { dispose(mon.group); scene.remove(mon.group); mon = await makeMon(mate); mon.board.userData.who = { mon, w: walker }; }
  mode = 'walk'; blend = 0; sel = -1;
  walker.path = []; walker.exit = false;
  walker.tile = nearestFree(startTile());
  walker.x = tileX(walker.tile.x); walker.z = tileZ(walker.tile.y);
  walker.facing = 'back';
  camX = panX = walker.x;
  setTime(true);
  resize();
  refresh();
  syncGuests();
  last = 0;
  requestAnimationFrame(frame);
  curtain(false);
}

/** The Secret Base. `onLeave` is where its ✕ goes (the walkable hub hands it the way back out to the Clearing). */
export async function openBase3d({ onLeave = null } = {}) {
  leaveTo = onLeave;
  if (root && renderer) return reopen();
  calm = calmFx();
  root = document.createElement('section');
  root.className = 'base3d';
  root.innerHTML = `
    <div class="b3-stage">
      <canvas class="b3-view"></canvas>
      <header class="b3-top"><h2>Secret Base</h2><span class="b3-fps" hidden></span>
        <button type="button" class="b3-key b3-close" aria-label="Leave">${glyph('close')}</button></header>
      <p class="b3-hint" aria-live="polite"></p>
      <div class="b3-gift" hidden><p>Starter furniture!</p><div class="b3-gift-row"></div><button type="button" class="b3-done">Decorate</button></div>
      <button type="button" class="b3-decor" aria-label="Decorate">${glyph('sofa')}<span>Decorate</span></button>
    </div>
    <div class="b3-sheet">
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
  root.querySelector('.b3-close').addEventListener('click', leave);
  // like every window in the game, a tap anywhere else puts the cream ones away: the hint, and the present's card
  root.addEventListener('pointerdown', (e) => {
    const gift = root.querySelector('.b3-gift');
    if (!gift.hidden && !gift.contains(e.target)) { gift.hidden = true; swallowClick = e.target === view; e.stopPropagation(); return refresh(); }
    if (hud.hint.textContent && !hud.hint.classList.contains('hush')) { hushed = hud.hint.textContent; hud.hint.classList.add('hush'); }
  }, true);

  try {
    THREE = await loadThree();
    renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
  } catch { return fallBack(); }
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
  roomGroup = new THREE.Group(); pieceGroup = new THREE.Group();
  scene.add(ring, foot, selBox, roomGroup, pieceGroup);

  // the furniture is smooth 3D: a sharper scene, scaled up smoothly, not in whole pixels
  post = createPost(renderer, { short: 820, crisp: false });
  base = loadBase();
  buildRoom();
  buildPieces();
  mon = await makeMon();
  mon.board.userData.who = { mon, w: walker };
  walker.tile = nearestFree(startTile());
  walker.x = tileX(walker.tile.x); walker.z = tileZ(walker.tile.y);
  camX = panX = walker.x;
  setTime(true);
  resize();
  new ResizeObserver(resize).observe(view);
  view.addEventListener('click', onTap);
  view.addEventListener('pointerdown', onDown);
  view.addEventListener('pointermove', onMove);
  view.addEventListener('pointerup', onUp);
  view.addEventListener('pointercancel', () => { pressing = false; pointer = null; });
  root.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => act(b.dataset.act)));
  root.querySelectorAll('.b3-tab').forEach(b => b.addEventListener('click', () => { playSound('select'); shopMsg = ''; untry(); tray(b.dataset.tab); refresh(); }));
  root.querySelector('.b3-gift .b3-done').addEventListener('click', () => { root.querySelector('.b3-gift').hidden = true; tray('furniture'); setMode('edit'); refresh(); });
  root.querySelector('.b3-decor').addEventListener('click', () => setMode('edit'));
  // with a piece in hand the gold pill puts it down; with one picked it lets go of it; else it ends decorating
  root.querySelector('.b3-ok').addEventListener('click', () => holding ? place() : sel >= 0 ? act('done') : setMode('walk'));
  new ResizeObserver(resize).observe(root.querySelector('.b3-sheet'));
  tray('furniture');
  refresh();
  syncGuests();
  requestAnimationFrame(frame);
  curtain(false);
}

function startTile() {
  for (let r = 0; r < COLS; r++) for (let y = ROWS - 2; y >= 0; y--) for (const x of [5 - r, 5 + r]) {
    if (x >= 0 && x < COLS && !blocked.has(key(x, y))) return { x, y };
  }
  return { x: 5, y: ROWS - 1 };
}
