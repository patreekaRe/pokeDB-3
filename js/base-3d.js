/* base-3d.js  -  the Secret Base as a little HD-2D diorama in Three.js (?base): the room you walk your partner round and
   decorate in place. The same layout, rules and pixel paintings as js/secret-base.js (the 2D room is only the fallback
   where WebGL fails): the floor and walls are pixel-textured blocks, flat pieces low blocks with their painting on top,
   the bookshelf a block, the rest standing billboards; your partner's GIF is split into frames (ImageDecoder, or
   js/gif-frames.js) and walks where you tap. Decorating: a piece from the tray under the view shows as a ghost on the
   tiles under your finger (green fits, red doesn't) and lands where the finger lifts; a tap on a placed piece gives
   Rotate / Move / Store. A fixed tilted camera follows the partner; the scene renders small and is scaled up with crisp
   pixels, then tilt-shift and bloom are laid on in one pass. The light follows js/daytime.js. */

import { getSave } from './storage.js';
import { timeOfDay } from './daytime.js';
import { calmFx } from './prefs.js';
import { playSound, playCry } from './audio.js';
import { partner } from './trainercard.js';
import { spriteFit } from './data/sprite-fit.js';
import { decodeGif } from './gif-frames.js';
import { PIECES, WALLPAPERS, FLOORS, T, WALL, COLS, ROWS, footprint, fits, aimTile, icon, loadBase, saveBase, roomArt, pieceArt } from './secret-base.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const PX = 1 / T;          // furniture: one painted pixel
const MON_PX = 1 / 32;     // Pokémon GIFs are drawn at twice the furniture's detail
const WALL_H = WALL / T;   // 3 tiles, as in the 2D room
const LAMPS = 2;           // lamps that really light the room (point lights are dear on phones); the rest only glow
const MIN_ACROSS = 6;      // tiles the view shows across at least, an upright phone panning over the rest

// flat pieces stand this tall, their sides this colour
const FLAT = { rug: [0.04, '#8e342e'], bed: [0.5, '#5a3a1e'], table: [0.55, '#6e4626'], cushion: [0.22, '#202028'] };
const GLOW = { window: ['#8cc8f4', '#f4b8a0', '#e8885a', '#2a3a6a'], lamp: ['#f4dc88', '#fff4c0'] };

const LIGHT = {
  dawn: { sky: '#ffd0b8', ground: '#5a4058', amb: 1.4, sun: '#ffb48a', sunI: 2.2, at: [-9, 5, 6], lamp: 0.8, win: 0.9, shaft: 0.3, motes: 0.7, bg: '#2a2036' },
  day: { sky: '#ffffff', ground: '#7a6a5a', amb: 1.6, sun: '#fff2dc', sunI: 2.6, at: [-5, 12, 7], lamp: 0, win: 1.1, shaft: 0.4, motes: 1, bg: '#1d2440' },
  dusk: { sky: '#f4a070', ground: '#4a2e44', amb: 1.2, sun: '#ff8a4a', sunI: 2.2, at: [9, 5, 6], lamp: 1.6, win: 0.8, shaft: 0.3, motes: 0.7, bg: '#2a1828' },
  night: { sky: '#6070b0', ground: '#14142a', amb: 0.9, sun: '#90a8f0', sunI: 0.7, at: [4, 12, 5], lamp: 4, win: 0.35, shaft: 0.12, motes: 0.25, bg: '#080a18' },
};

let THREE, renderer, scene, camera, root, view, hud;
let rt, bloomA, bloomB, quad, quadCam, mats;
let hemi, sun, lampLights = [], winMats = [], shafts = [], motes = [], ring;
let roomGroup, pieceGroup, ghost, foot, selBox;
let mon, walker = { x: 0, z: 0, path: [], facing: 'front', flip: false, hop: 0 };
let blocked = new Set(), base, calm = false, time = '';
let holding = null, aimAt = null, sel = -1, pressing = false, pointer = null, swallowClick = false, tab = 'furniture';
let grab = null;   // a press on a placed piece, until it turns into a drag (it's picked up) or a tap
let camX = 0, panX = 0, follow = true, last = 0, fpsLog = [];

const tileX = (tx) => tx + 0.5 - COLS / 2;
const tileZ = (ty) => ty + 0.5 - ROWS / 2;

function tex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function crop(src, x, y, w, h) {
  const c = new OffscreenCanvas(w, h);
  c.getContext('2d').drawImage(src, x, y, w, h, 0, 0, w, h);
  return c;
}

/** The painting cut to its opaque pixels, with where that box sat. */
function trim(src) {
  const { width: w, height: h } = src, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  if (x1 < 0) return { c: src, x: 0, y: 0, w, h };
  return { c: crop(src, x0, y0, x1 - x0 + 1, y1 - y0 + 1), x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Only the pixels in these colours, for an emissive map: a window's sky, a lamp's shade. */
function mask(src, colours) {
  const keep = new Set(colours.map(h => parseInt(h.slice(1), 16)));
  const c = crop(src, 0, 0, src.width, src.height), g = c.getContext('2d');
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) if (!keep.has((d[i] << 16) | (d[i + 1] << 8) | d[i + 2])) { d[i] = d[i + 1] = d[i + 2] = 0; }
  g.putImageData(img, 0, 0);
  return c;
}

const solid = (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.95 });
const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();

function dispose(group) {
  group.traverse(o => {
    o.geometry?.dispose();
    for (const m of [o.material].flat()) if (m) { m.map?.dispose(); m.emissiveMap?.dispose(); m.dispose(); }
  });
  group.clear();
}

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
}

// the trim colour is the wallpaper strip's bottom row, whatever the paper
function wallTrim(art) {
  const [r, g, b] = art.getContext('2d').getImageData(4, WALL - 3, 1, 1).data;
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function buildPieces() {
  dispose(pieceGroup);
  blocked = new Set(); winMats = []; shafts = []; motes = [];
  const lamps = [];
  base.items.forEach((it, i) => {
    const g = makePiece(it);
    g.userData.index = i;
    pieceGroup.add(g);
    if (g.userData.lamp) lamps.push(g.userData.lamp);
    if (PIECES[it.id].layer === 'wall' || PIECES[it.id].layer === 'rug') return;
    const [fw, fh] = footprint(it);
    for (let x = 0; x < fw; x++) for (let y = 0; y < fh; y++) blocked.add(`${it.x + x},${it.y + y}`);
  });
  lampLights.forEach((l, i) => { l.visible = i < lamps.length; if (lamps[i]) l.position.copy(lamps[i]); });
  if (mon && blocked.has(key(walker.tile.x, walker.tile.y))) {
    walker.tile = nearestFree(walker.tile);
    walker.x = tileX(walker.tile.x); walker.z = tileZ(walker.tile.y);
  }
  if (mon) walker.path = [];
  setTime(true);
}

/** One piece as a group of meshes in room space. A ghost is see-through and lights nothing. */
function makePiece(it, ghostly = false) {
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
    const art = pieceArt(it.id), m = new THREE.MeshStandardMaterial({ map: tex(art), transparent: true, alphaTest: 0.5, roughness: 1 });
    if (GLOW[it.id] && !ghostly) { m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = tex(mask(art, GLOW[it.id])); winMats.push(m); }
    const plane = add(new THREE.PlaneGeometry(p.w, WALL_H), m, false);
    plane.position.set(it.x - COLS / 2 + p.w / 2, WALL_H / 2, -ROWS / 2 + 0.01 + (ghostly ? 0.01 : 0));
    if (it.id === 'window' && !ghostly) addShaft(group, plane.position.x);
    return group;
  }
  const [fw, fh] = footprint(it);
  const cx = it.x - COLS / 2 + fw / 2, cz = it.y - ROWS / 2 + fh / 2;

  if (p.flat) {
    const [h, side] = FLAT[it.id] || [0.4, '#5a3a1e'];
    const top = new THREE.MeshStandardMaterial({ map: tex(pieceArt(it.id)), roughness: 0.9 }), s = solid(side);
    const block = add(new THREE.BoxGeometry(p.w, h, p.h), [s, s, top, s, s, s], h > 0.1);
    block.position.set(cx, h / 2 + (ghostly ? 0.01 : 0), cz);
    block.rotation.y = -it.dir * Math.PI / 2;
    return group;
  }
  if (it.id === 'shelf') {
    const front = trim(pieceArt('shelf', 0)), behind = trim(pieceArt('shelf', 2));
    const h = front.h * PX, wood = solid('#a8723f');
    const face = (a) => new THREE.MeshStandardMaterial({ map: tex(a.c), roughness: 1 });
    const block = add(new THREE.BoxGeometry(p.w, h, 0.8), [wood, wood, solid('#c48a52'), wood, face(front), face(behind)]);
    block.position.set(cx, h / 2, cz);
    block.rotation.y = -it.dir * Math.PI / 2;
    return group;
  }
  // upright pieces stand as billboards: their painting at their facing, feet on the floor at the footprint's middle
  const cut = trim(pieceArt(it.id, it.dir));
  const m = new THREE.MeshStandardMaterial({ map: tex(cut.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
  if (GLOW[it.id] && !ghostly) { m.emissive = new THREE.Color('#ffd890'); m.emissiveMap = tex(mask(cut.c, GLOW[it.id])); m.userData.lamp = true; winMats.push(m); }
  const board = add(new THREE.PlaneGeometry(cut.w * PX, cut.h * PX), m);
  board.position.set(it.x - COLS / 2 + (cut.x + cut.w / 2) * PX, cut.h * PX / 2, cz);
  if (it.id === 'lamp') group.userData.lamp = new THREE.Vector3(board.position.x, cut.h * PX - 0.35, cz + 0.3);
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

const save = () => saveBase(base);

/** Pick up a piece (from the tray, or `back` for one lifted off the floor): its ghost appears where it was, or in the
    middle of the view. */
function hold(id, dir = 0, back = null) {
  holding = { id, dir, back };
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

const held = () => PIECES[holding.id].layer === 'wall' ? { id: holding.id, x: aimAt.x } : { id: holding.id, x: aimAt.x, y: aimAt.y, dir: holding.dir };

function showGhost() {
  if (!ghost || !aimAt) return;
  const it = held(), wall = PIECES[it.id].layer === 'wall';
  // lifted a little, as if held, and tinted, since a ghost over a piece of the same shape would look just like it
  ghost.position.set(it.x, wall ? 0 : 0.08, wall ? 0 : it.y);
  const [fw, fh] = wall ? [PIECES[it.id].w, 0] : footprint(it), ok = fits(it, -1, base);
  if (wall) foot.position.set(it.x - COLS / 2 + fw / 2, WALL_H / 2, -ROWS / 2 + 0.03);
  else foot.position.set(it.x - COLS / 2 + fw / 2, 0.025, it.y - ROWS / 2 + fh / 2);
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
    if (holding.dragged) { const back = holding.back; base.items.push(back); dropHold(); sel = base.items.length - 1; buildPieces(); refresh(); }
    return;
  }
  base.items.push(it);
  dropHold();
  sel = base.items.length - 1;
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
      holding.dir = (holding.dir + 1) % 4;
      makeGhost();
      const [fw, fh] = footprint({ id: holding.id, dir: holding.dir });
      if (aimAt) { aimAt.x = Math.min(aimAt.x, COLS - fw); aimAt.y = Math.min(aimAt.y, ROWS - fh); }
      showGhost();
    }
    if (kind === 'cancel') {
      if (holding.back) { base.items.push(holding.back); buildPieces(); }
      dropHold();
      playSound('cancel');
    }
    return refresh();
  }
  const it = base.items[sel];
  if (!it) return;
  if (kind === 'rotate') {
    const turned = { ...it, dir: (it.dir + 1) % 4 };
    const [fw, fh] = footprint(turned);
    turned.x = Math.min(turned.x, COLS - fw); turned.y = Math.min(turned.y, ROWS - fh);
    if (fits(turned, sel, base)) { base.items[sel] = turned; save(); buildPieces(); playSound('confirm'); }
    else playSound('cancel');
  }
  if (kind === 'move') { base.items.splice(sel, 1); buildPieces(); hold(it.id, it.dir ?? 0, it); return; }
  if (kind === 'store') { base.items.splice(sel, 1); sel = -1; playSound('cancel'); save(); buildPieces(); }
  if (kind === 'done') sel = -1;
  refresh();
}

/* ---------- the partner: GIF frames on a billboard ---------- */

/** Every frame of a GIF with its delay: ImageDecoder where there is one, else js/gif-frames.js (iPhone Safari). */
async function gifFrames(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const data = await res.arrayBuffer();
    if (typeof ImageDecoder === 'function' && !new URLSearchParams(location.search).has('gifjs')) {
      const dec = new ImageDecoder({ data, type: 'image/gif' });
      await dec.tracks.ready;
      const frames = [];
      for (let i = 0; i < dec.tracks.selectedTrack.frameCount; i++) {
        const { image } = await dec.decode({ frameIndex: i });
        const ms = (image.duration ?? 0) / 1000;
        frames.push({ bmp: await createImageBitmap(image), ms: ms < 20 ? 100 : ms });
        image.close();
      }
      dec.close();
      if (frames.length) return frames;
    }
    const frames = decodeGif(data);
    return frames.length ? frames : null;
  } catch { return null; }
}

async function makeMon() {
  const mate = partner(getSave());
  const front = mate.src, backSrc = front.replace(/-front\.gif$/, '-back.gif');
  const [ff, bf] = await Promise.all([gifFrames(front), backSrc !== front ? gifFrames(backSrc) : null]);
  const sheets = { front: { frames: ff || [] } };
  if (bf) sheets.back = { frames: bf };
  const first = ff?.[0].bmp;
  const w = first?.width || 96, h = first?.height || 96;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const t = tex(c);
  const m = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w * MON_PX, h * MON_PX), m);
  board.castShadow = true;
  const [, bottom, left, right] = spriteFit(front);
  board.geometry.translate((right - left) / 2 * MON_PX, (h / 2 - bottom) * MON_PX, 0);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.011;
  blob.raycast = () => {};
  const group = new THREE.Group();
  group.add(board, blob);
  scene.add(group);
  return { group, board, c, g: c.getContext('2d'), t, sheets, frame: 0, clock: 0, id: front.split('/').pop().replace(/-front\.gif$/, ''), name: mate.name };
}

function drawMon(dt) {
  const s = mon.sheets[walker.facing] || mon.sheets.front;
  if (!s.frames.length) return;
  mon.clock += dt;
  const f = s.frames[mon.frame % s.frames.length];
  if (mon.clock >= f.ms) { mon.clock = 0; mon.frame = (mon.frame + 1) % s.frames.length; }
  const now = s.frames[mon.frame % s.frames.length];
  if (mon.shown !== now) { mon.g.clearRect(0, 0, mon.c.width, mon.c.height); mon.g.drawImage(now.bmp, 0, 0); mon.t.needsUpdate = true; mon.shown = now; }
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

function walk(dt) {
  const step = walker.path[0];
  if (!step) { walker.hop = 0; return; }
  const tx = tileX(step.x), tz = tileZ(step.y), dx = tx - walker.x, dz = tz - walker.z;
  const d = Math.hypot(dx, dz), move = dt / 1000 * 3.2;
  if (Math.abs(dz) > Math.abs(dx)) walker.facing = dz < 0 && mon.sheets.back ? 'back' : 'front';
  else { walker.facing = 'front'; walker.flip = dx > 0; }
  if (d <= move) { walker.x = tx; walker.z = tz; walker.tile = step; walker.path.shift(); }
  else { walker.x += dx / d * move; walker.z += dz / d * move; }
  walker.hop += dt;
}

/* ---------- taps ---------- */

function ndc(e) {
  const r = view.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1];
}

// holding a piece, a press shows its ghost under the finger, a drag carries it, and lifting puts it down
// not holding, a press on a placed piece that then moves picks it up and carries it: no Move key needed
function onDown(e) {
  if (!holding) {
    const i = pieceUnder(ndc(e));
    if (i >= 0) { grab = { i, x: e.clientX, y: e.clientY }; view.setPointerCapture?.(e.pointerId); }
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
    base.items.splice(base.items.indexOf(it), 1);
    buildPieces();
    hold(it.id, it.dir ?? 0, it);
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
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(...at), camera);
  let g = ray.intersectObjects([mon.board, pieceGroup], true)[0]?.object;
  if (g === mon.board) return -1;
  while (g && g.userData.index === undefined) g = g.parent;
  return g?.parent === pieceGroup ? g.userData.index : -1;
}

function onTap(e) {
  if (swallowClick || holding) { swallowClick = false; return; }
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(...ndc(e)), camera);
  const hits = ray.intersectObjects([mon.board, pieceGroup], true);
  const first = hits[0]?.object;
  if (first === mon.board) {
    playCry(mon.id);
    walker.hopUntil = performance.now() + 500;
    return;
  }
  let g = first;
  while (g && g.userData.index === undefined) g = g.parent;
  if (g && g.parent === pieceGroup) {
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
  walker.path = route(walker.tile, to);
  follow = true;
  const end = walker.path.at(-1) ?? walker.tile;
  ring.position.set(tileX(end.x), 0.02, tileZ(end.y));
  ring.material.opacity = 0.9;
  playSound('confirm');
}

/* ---------- the panel under the view ---------- */

function tray(which = tab) {
  tab = which;
  const list = root.querySelector('.b3-strip');
  list.replaceChildren();
  root.querySelectorAll('.b3-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const add = (label, art, on, pick) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sb-item' + (on ? ' on' : '');
    b.append(art, Object.assign(document.createElement('span'), { textContent: label }));
    b.addEventListener('click', pick);
    list.append(b);
  };
  if (tab === 'furniture') for (const [id, p] of Object.entries(PIECES)) add(p.name, icon(id), holding?.id === id && !holding.back, () => {
    if (holding?.back) act('cancel');
    if (holding?.id === id) { dropHold(); refresh(); return; }
    if (holding) dropHold();
    playSound('confirm');
    hold(id);
  });
  const swatch = (all, field) => all.forEach(s => {
    const sw = document.createElement('span');
    sw.className = 'sb-swatch';
    sw.style.background = `repeating-linear-gradient(90deg, ${s.a} 0 6px, ${s.b} 6px 10px)`;
    add(s.name, sw, base[field] === s.id, () => {
      if (base[field] === s.id) return;
      base[field] = s.id; save(); buildRoom(); playSound('confirm'); tray();
    });
  });
  if (tab === 'wall') swatch(WALLPAPERS, 'wall');
  if (tab === 'floor') swatch(FLOORS, 'floor');
}

function refresh() {
  const busy = holding || sel >= 0;
  root.querySelector('.b3-tabs').hidden = !!busy;
  const bar = root.querySelector('.b3-acts');
  bar.hidden = !busy;
  const wall = PIECES[holding?.id ?? base.items[sel]?.id]?.layer === 'wall';
  bar.querySelectorAll('[data-act]').forEach(b => {
    const a = b.dataset.act;
    b.hidden = holding ? !(a === 'cancel' || (a === 'rotate' && !wall)) : a === 'cancel' || (a === 'rotate' && wall);
  });
  hud.hint.textContent = holding ? `Tap or drag where the ${PIECES[holding.id].name.toLowerCase()} goes.`
    : sel >= 0 ? `${PIECES[base.items[sel].id].name}: ${PIECES[base.items[sel].id].layer === 'wall' ? '' : 'tap it again to turn it, '}drag it to move it.`
    : `Tap the floor and ${mon?.name ?? 'your partner'} walks there. Drag a piece to move it, tap it for more, or pick one below.`;
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
  if (tab === 'furniture') tray();
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
  for (const m of winMats) m.emissiveIntensity = m.userData.lamp ? Math.min(1, L.lamp / 2) : L.win;
  for (const s of shafts) s.material.opacity = L.shaft;
  for (const d of motes) d.material.opacity = L.motes;
  scene.background = new THREE.Color(L.bg);
  mats.final.uniforms.uBg.value.set(L.bg);
}

/* ---------- post: tilt-shift and bloom, one small pass chain ---------- */

const VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

function makePost() {
  const bright = new THREE.ShaderMaterial({
    uniforms: { tScene: { value: null }, uCut: { value: 0.9 } },
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tScene; uniform float uCut; varying vec2 vUv;
      void main() { vec3 c = texture2D(tScene, vUv).rgb; float l = max(c.r, max(c.g, c.b));
        gl_FragColor = vec4(c * smoothstep(uCut, uCut + 0.2, l), 1.0); }`,
  });
  const blur = new THREE.ShaderMaterial({
    uniforms: { tIn: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tIn; uniform vec2 uDir; varying vec2 vUv;
      void main() { vec3 c = texture2D(tIn, vUv).rgb * 0.227;
        c += (texture2D(tIn, vUv + uDir * 1.385).rgb + texture2D(tIn, vUv - uDir * 1.385).rgb) * 0.316;
        c += (texture2D(tIn, vUv + uDir * 3.231).rgb + texture2D(tIn, vUv - uDir * 3.231).rgb) * 0.070;
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const final = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: null }, tBloom: { value: null }, uRes: { value: new THREE.Vector2() },
      uFocus: { value: 0.5 }, uBand: { value: 0.16 }, uBlur: { value: 5 }, uBloom: { value: 0.75 }, uBg: { value: new THREE.Color() },
    },
    vertexShader: VERT,
    fragmentShader: `uniform sampler2D tScene; uniform sampler2D tBloom; uniform vec2 uRes;
      uniform float uFocus; uniform float uBand; uniform float uBlur; uniform float uBloom; uniform vec3 uBg; varying vec2 vUv;
      void main() {
        vec2 px = (floor(vUv * uRes) + 0.5) / uRes;
        vec3 c = texture2D(tScene, px).rgb;
        float d = clamp((abs(vUv.y - uFocus) - uBand) / (0.5 - uBand), 0.0, 1.0);
        float r = d * d * uBlur;
        if (r > 0.15) {
          vec3 acc = c; float n = 1.0;
          for (int i = 0; i < 12; i++) {
            float a = float(i) * 2.39996, k = sqrt((float(i) + 0.5) / 12.0);
            acc += texture2D(tScene, vUv + vec2(cos(a), sin(a)) * k * r / uRes).rgb; n += 1.0;
          }
          c = acc / n;
        }
        c += texture2D(tBloom, vUv).rgb * uBloom;
        vec2 v = vUv - 0.5; c *= 1.0 - dot(v, v) * 0.55;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  mats = { bright, blur, final };
  quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), final);
  quad.frustumCulled = false;
  quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  quad.userData.scene = quadScene;
}

function pass(material, target) {
  quad.material = material;
  renderer.setRenderTarget(target);
  renderer.render(quad.userData.scene, quadCam);
}

/* ---------- camera ---------- */

const PITCH = 0.8;   // ~46° down, Octopath's tilt
const LOOK_Y = 0.9;

function aimCamera(x, d) {
  camera.position.set(x, LOOK_Y + Math.sin(PITCH) * d, Math.cos(PITCH) * d);
  camera.lookAt(x, LOOK_Y, 0);
  camera.updateMatrixWorld();
}

/** How far up and down the screen (in NDC) the room reaches from this distance: the wall's top to the floor's front edge. */
function roomSpan(d) {
  aimCamera(0, d);
  const top = new THREE.Vector3(0, WALL_H, -ROWS / 2 - 0.4).project(camera).y;
  const bottom = new THREE.Vector3(0, -0.6, ROWS / 2).project(camera).y;
  return [top, bottom];
}

/* The room fills the view's height (under the top bar), so an upright phone has no empty sky and floor round it; it
   shows MIN_ACROSS tiles at least, and on a wide screen the whole room. A lens shift centres it, keeping the tilt. */
function fitCamera(w, h) {
  const bar = root.querySelector('.b3-top').offsetHeight;
  const room = 2 * (h - bar) / h * 0.94;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  let lo = 2, hi = 80;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const [t, b] = roomSpan(mid); if (t - b > room) lo = mid; else hi = mid; }
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
  let d = hi;
  const across = (dist) => 2 * dist * halfTan;
  if (across(d) < MIN_ACROSS) d = MIN_ACROSS / 2 / halfTan;
  const [t, b] = roomSpan(d);
  camera.userData = { dist: d, half: across(d) / 2 };
  camera.setViewOffset(w, h, 0, -((t + b) / 2) * h / 2 - bar / 2, w, h);
}

function placeCamera(dt, now) {
  const room = COLS / 2 + 0.6, half = camera.userData.half;
  if (holding && pressing && pointer && Math.abs(pointer[0]) > 0.7) {
    panX += Math.sign(pointer[0]) * (Math.abs(pointer[0]) - 0.7) / 0.3 * dt / 1000 * 5;
  }
  const clamp = (x) => half >= room ? 0 : Math.max(-room + half, Math.min(room - half, x));
  panX = clamp(panX);
  const want = follow ? clamp(walker.x) : panX;
  const before = camX;
  camX = calm ? want : camX + (want - camX) * Math.min(1, dt / 1000 * 4);
  aimCamera(camX, camera.userData.dist);
  if (holding && pressing && pointer && Math.abs(camX - before) > 1e-4) { aimFrom(...pointer); showGhost(); }
}

function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  // a small scene, scaled up with crisp pixels: about 420 px on the short side
  const k = Math.min(1, 420 / Math.min(w, h));
  const sw = Math.round(w * k), sh = Math.round(h * k);
  rt?.dispose(); bloomA?.dispose(); bloomB?.dispose();
  rt = new THREE.WebGLRenderTarget(sw, sh, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, samples: 0 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const bw = Math.max(1, sw >> 1), bh = Math.max(1, sh >> 1);
  bloomA = new THREE.WebGLRenderTarget(bw, bh);
  bloomB = new THREE.WebGLRenderTarget(bw, bh);
  mats.final.uniforms.uRes.value.set(sw, sh);
  mats.blur.userData.texel = [1 / bw, 1 / bh];
  camera.aspect = w / h;
  fitCamera(w, h);
}

/* ---------- the frame ---------- */

function frame(now) {
  if (!root.isConnected) return;
  const dt = Math.min(100, now - (last || now));
  last = now;
  fpsLog.push(dt); if (fpsLog.length > 60) fpsLog.shift();

  walk(dt);
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, 0, walker.z);
  mon.board.position.y = bob;
  mon.board.scale.x = walker.flip ? -1 : 1;
  drawMon(dt);
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
  mats.final.uniforms.uFocus.value = (focus.clone().project(camera).y + 1) / 2;

  renderer.setRenderTarget(rt);
  renderer.render(scene, camera);
  mats.bright.uniforms.tScene.value = rt.texture;
  pass(mats.bright, bloomA);
  const [tx, ty] = mats.blur.userData.texel;
  for (let i = 0; i < 2; i++) {
    mats.blur.uniforms.tIn.value = bloomA.texture; mats.blur.uniforms.uDir.value.set(tx * (i + 1), 0); pass(mats.blur, bloomB);
    mats.blur.uniforms.tIn.value = bloomB.texture; mats.blur.uniforms.uDir.value.set(0, ty * (i + 1)); pass(mats.blur, bloomA);
  }
  mats.final.uniforms.tScene.value = rt.texture;
  mats.final.uniforms.tBloom.value = bloomA.texture;
  pass(mats.final, null);

  if (hud.fps) hud.fps.textContent = `${Math.round(1000 / (fpsLog.reduce((a, b) => a + b, 0) / fpsLog.length))} fps`;
  requestAnimationFrame(frame);
}

/** The 2D room instead, where there's no WebGL or no Three.js (offline). */
async function fallBack() {
  root.remove();
  (await import('./secret-base.js')).openBase();
}

export async function openBase3d() {
  calm = calmFx();
  root = document.createElement('section');
  root.className = 'base3d';
  root.innerHTML = `
    <div class="b3-stage">
      <canvas class="b3-view"></canvas>
      <header class="b3-top"><h2>Secret Base</h2><span class="b3-fps" hidden></span>
        <button type="button" class="b3-key b3-close" aria-label="Leave">✕</button></header>
    </div>
    <div class="b3-panel">
      <p class="b3-hint">Loading…</p>
      <div class="b3-row">
        <nav class="b3-tabs">
          <button type="button" class="b3-tab" data-tab="furniture">Furniture</button>
          <button type="button" class="b3-tab" data-tab="wall">Wallpaper</button>
          <button type="button" class="b3-tab" data-tab="floor">Floor</button>
        </nav>
        <div class="b3-acts" hidden>
          <button type="button" data-act="rotate">Rotate</button><button type="button" data-act="move">Move</button>
          <button type="button" data-act="store">Store</button><button type="button" data-act="done">Done</button>
          <button type="button" data-act="cancel">Cancel</button>
        </div>
      </div>
      <div class="b3-strip"></div>
    </div>`;
  document.body.append(root);
  view = root.querySelector('.b3-view');
  hud = { hint: root.querySelector('.b3-hint'), fps: null };
  if (new URLSearchParams(location.search).has('fps')) { hud.fps = root.querySelector('.b3-fps'); hud.fps.hidden = false; }
  root.querySelector('.b3-close').addEventListener('click', () => { location.href = location.pathname; });

  try {
    THREE = await import(THREE_URL);
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

  makePost();
  base = loadBase();
  buildRoom();
  buildPieces();
  mon = await makeMon();
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
  root.querySelectorAll('.b3-tab').forEach(b => b.addEventListener('click', () => tray(b.dataset.tab)));
  tray('furniture');
  refresh();
  requestAnimationFrame(frame);
}

function startTile() {
  for (let r = 0; r < COLS; r++) for (let y = ROWS - 2; y >= 0; y--) for (const x of [5 - r, 5 + r]) {
    if (x >= 0 && x < COLS && !blocked.has(key(x, y))) return { x, y };
  }
  return { x: 5, y: ROWS - 1 };
}
