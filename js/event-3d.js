/* event-3d.js  -  the run's ? rooms and treasure grotto as 3D places you walk about, like the Center (js/center-3d.js) and
   the Mart (the user's ask, 2026-10-11): the Move Tutor's dojo, the Move Deleter's study, the Day Care and the Fan Club
   indoors; the Hot Spring and the Shrine in the open air; the treasure grotto; and the Berry Tree, Wishing Well, Item Ball
   and Team Rocket on a patch of the biome's own ground. The open-air rooms and the grotto wear the biome they're in. It is
   only the scene: eventRoom() in js/run.js keeps each room's choices (their two taps: the first says the hint, the second takes it),
   text box and bar, and this lays the room under them. A tap on a choice's prop, or its floating sign, walks your Pokémon
   up and presses that choice; the doormat walks it out. Each room's trainer stands in it as their sprite, blinking, and
   does what figureDoes() in js/run.js asks (nod, jump, shake their head, turn round); a choice plays out on the props
   (`act()`, in place of the pixel scene's ACTS). The decor is the Secret Base's furniture models (js/base-mesh.js). */

import { calmFx } from './prefs.js';
import { playSound, playCry, hushBlip } from './audio.js';
import { dragWalk, reroute } from './drag-walk.js';
import { loadThree, tex, crop, monBoard, drawMon, createPost, doormat, dispose, MON_PX, warmShaders, wakeGL, restGL, pickingOver, bend, bendFine, unbend } from './hd2d.js';
import { makeCrowd } from './corner-crowd.js';
import { fine, texOf, words, hubThree, CURVE, newsArt } from './hub-3d.js';
import { townBackdrop } from './town-backdrop.js';
import { sh as shadeOf, HD } from './base-paint.js';
import { furnitureModel } from './base-mesh.js';
import { dressPlay, tickPlay } from './base-play.js';
import { PIECES, pieceArt } from './secret-base.js';
import { LEADER_HOMES, LEADER_SIZE, buildLeaderHome, leaderEnv } from './leader-homes.js';
import { paintMedallion } from './medallion-art.js';
import { getSave } from './storage.js';
import { RING, shardsLit } from './data/towns.js';
import { gymWins, GYM_INK as LEADER_INK } from './data/gym.js';
import { GRADES, gradeHex, timeOfDay } from './daytime.js';
import { ENEMY_DEFS } from './data/enemies.js';

// the room's size in tiles: 11 x 8, or its kind's in SIZES (a gym is a long hall); set for the room built or shown, useSize()
let COLS = 11, ROWS = 8;
const U = 20;                 // the paintings' units a tile
const TOP = 8;
const ACROSS = 6.4, LOOK_Y = 0.8;
let PITCH = 0.42;   // the camera's tilt: a town's is higher, to show its layout (useSize())
let DOOR = { x: 5, y: ROWS - 1 };
const NPC_PX = 1 / 34;        // a trainer's sprite pixel, a touch under a Pokémon's, so they stand about a head taller
export const ROOMS_3D = ['tutor', 'deleter', 'daycare', 'fans', 'spring', 'altar', 'grotto', 'berry', 'well', 'itemball', 'rocket', 'gym', 'town', 'home'];

let THREE, renderer, scene, camera, post, view, hemi, sun;
let built = {}, R = null, mon = null, mat = null;
let walker = { x: 0, z: 0, tile: { ...DOOR }, path: [], facing: 'back', flip: false, hop: 0 };
let frozen = false;   // a Gym Leader is about to talk or talking: you can't walk (freezeEvent())
let opts = null, aim = null, busy = false, raf = 0, last = 0, calm = false, shot = null, viewW = 0, viewH = 0, camX = 0, camZ = NaN;
let leftAt = 0, visit = null, acting = null, queued = [];

const tileX = (tx) => tx + 0.5 - COLS / 2;
const tileZ = (ty) => ty + 0.5 - ROWS / 2;
const key = (x, y) => `${x},${y}`;
const wx = (t) => (t + 0.4) * U;            // a room tile's x on the back wall's painting (it runs 0.4 past each side)
const wy = (y) => (TOP - y) * U;            // a height's y on it
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
const ease = (k) => k * k * (3 - 2 * k);
let BACK_Z = -ROWS / 2;
let FOLLOW = false;          // a big room (a town): the sun's shadow box goes with the camera, not the room's middle
/** A kind's size, its doorway at the front's middle; `view` rows of it in the shot at once, which slides with you. */
const SIZES = { gym: { cols: 13, rows: 16, view: 8, across: 5.2, shadow: 12 } };
/** A town's size is its map's, a home's its HOMES entry's. */
function sizeOf(kind, at) {
  if (kind === 'town' && at.town) return { cols: at.town.map[0].length, rows: at.town.map.length, door: at.town.door.x, view: 12, across: 12, shadow: 16, pitch: 0.7, follow: true };
  if (kind === 'home') return homeSize(at.town?.id, at.home);
  return SIZES[kind];
}
function useSize(r) {
  const z = r.size || SIZES[r.kind] || {};
  COLS = z.cols || 11; ROWS = z.rows || 8;
  DOOR = { x: z.door ?? (COLS - 1) / 2, y: ROWS - 1 };
  PITCH = z.pitch ?? 0.42;
  FOLLOW = !!z.follow;
  BACK_Z = -ROWS / 2;
  if (sun) { const k = z.shadow || 9; Object.assign(sun.shadow.camera, { left: -k, right: k, top: k, bottom: -k }); sun.shadow.camera.updateProjectionMatrix(); }
}

function seeded(n) { return () => { n = (n + 0x6d2b79f5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- shared painting ---------- */

/** A window of sky in a frame, curtains either side; its pane glows a little at night-free rooms' sky colour. */
function skyWindow(f, s, x0, x1, y0, y1, { frame = '#ffffff', curtain = ['#f8d0d8', '#f0a8b8'], sky = ['#68b0f0', '#a8d8f8', '#e0f4ff'], night = false } = {}) {
  const { g, rr, lin } = f;
  rr(x0 - 1.5, y0 - 1.5, x1 - x0 + 3, y1 - y0 + 3, 1.5, frame);
  g.fillStyle = lin(0, y0, 0, y1, sky); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (night) {
    g.fillStyle = '#fff8d8'; g.beginPath(); g.arc(x0 + (x1 - x0) * 0.68, y0 + 9, 4.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = sky[0]; g.beginPath(); g.arc(x0 + (x1 - x0) * 0.68 + 1.8, y0 + 8, 3.6, 0, Math.PI * 2); g.fill();
    const r = seeded(5);
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 14; i++) g.fillRect(x0 + r() * (x1 - x0), y0 + r() * (y1 - y0) * 0.7, 0.6, 0.6);
    s.fillStyle = '#806a40'; s.beginPath(); s.arc(x0 + (x1 - x0) * 0.68, y0 + 9, 4.4, 0, Math.PI * 2); s.fill();
  } else {
    g.fillStyle = '#ffffff';
    for (const [cx, cy, r] of [[x0 + (x1 - x0) * 0.3, y0 + 9, 4], [x0 + (x1 - x0) * 0.42, y0 + 8, 5], [x0 + (x1 - x0) * 0.55, y0 + 9.5, 3.6]]) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = lin(0, y0 + (y1 - y0) * 0.7, 0, y1, ['#78c060', '#58a048']); g.fillRect(x0, y0 + (y1 - y0) * 0.72, x1 - x0, (y1 - y0) * 0.28);
    s.fillStyle = '#304050'; s.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  g.strokeStyle = frame; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo((x0 + x1) / 2, y0); g.lineTo((x0 + x1) / 2, y1); g.moveTo(x0, (y0 + y1) / 2); g.lineTo(x1, (y0 + y1) / 2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.moveTo(x0 + 2, y0); g.lineTo(x0 + 8, y0); g.lineTo(x0 + 1, y1); g.lineTo(x0, y1); g.lineTo(x0, y0 + 12); g.closePath(); g.fill();
  if (!curtain) return;
  for (const [a, b] of [[x0 - 4, x0 + 3], [x1 - 3, x1 + 4]]) {
    g.fillStyle = lin(a, 0, b, 0, [curtain[0], curtain[1], curtain[0]]);
    g.beginPath(); g.moveTo(a, y0 - 3); g.lineTo(b, y0 - 3); g.quadraticCurveTo((a + b) / 2, (y0 + y1) / 2, b - 1, y1 + 2); g.lineTo(a + 1, y1 + 2); g.closePath(); g.fill();
  }
  rr(x0 - 6, y0 - 5, x1 - x0 + 12, 3, 1.5, '#a87850');
}

/** A picture in a gilt frame: a coloured ground and a round friendly face, enough to read as a portrait. */
function portrait(f, x, y, w, h, ground, face) {
  const { g, rr, lin } = f;
  rr(x - 2, y - 2, w + 4, h + 4, 1.2, lin(x, y, x + w, y + h, ['#f8d878', '#c8902c', '#f0c860']));
  rr(x, y, w, h, 0.6, lin(0, y, 0, y + h, ground));
  g.fillStyle = face; g.beginPath(); g.ellipse(x + w / 2, y + h * 0.58, w * 0.3, h * 0.28, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(x + w * 0.3, y + h * 0.3, w * 0.09, h * 0.16, -0.4, 0, Math.PI * 2); g.ellipse(x + w * 0.7, y + h * 0.3, w * 0.09, h * 0.16, 0.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2a2238';
  g.beginPath(); g.arc(x + w * 0.4, y + h * 0.55, w * 0.04, 0, Math.PI * 2); g.arc(x + w * 0.6, y + h * 0.55, w * 0.04, 0, Math.PI * 2); g.fill();
}

/** Planks a tile wide across the floor, staggered; `tone` their two colours. */
function planks(f, W, H, T, tone) {
  const { g, lin } = f, r = seeded(9);
  for (let y = 0; y < H; y += T / 2) {
    const off = (y / (T / 2)) % 2 ? T * 0.5 : 0;
    for (let x = -off; x < W; x += T * 1.5) {
      g.fillStyle = lin(x, y, x, y + T / 2, r() < 0.5 ? tone : [tone[1], tone[0]]);
      g.fillRect(x, y, T * 1.5, T / 2);
      g.fillStyle = 'rgba(80,40,10,0.25)'; g.fillRect(x, y, 0.4, T / 2);
      g.fillStyle = 'rgba(80,40,10,0.08)';
      for (let i = 0; i < 3; i++) g.fillRect(x + 1 + r() * T * 1.3, y + 1 + r() * (T / 2 - 2), 2 + r() * 4, 0.25);
    }
    g.fillStyle = 'rgba(80,40,10,0.3)'; g.fillRect(0, y, W, 0.35);
  }
}

/** The Secret Base's mask: only the painting's glowing colours, for an emissive map. */
function mask(src, colours) {
  const keep = colours.flatMap(h => [-1, 0, 1, 2].map(n => shadeOf(h, n))).map(h => { const v = parseInt(h.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; });
  const c = crop(src, 0, 0, src.width, src.height), g = c.getContext('2d');
  c.hd = src.hd;
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let near = 1e9;
    for (const [r, gg, b] of keep) near = Math.min(near, Math.abs(d[i] - r) + Math.abs(d[i + 1] - gg) + Math.abs(d[i + 2] - b));
    const k = Math.max(0, 1 - near / 70);
    d[i] *= k; d[i + 1] *= k; d[i + 2] *= k;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/* ---------- building blocks, into the room being built (B) ---------- */

let B = null;

/** A furniture piece's 3D model, alive (its screen, its light), its footprint's tiles blocked; `tx`, `ty` its first tile. */
function piece(id, tx, ty, { turn = 0, scale = 1, y = 0, dx = 0, dz = 0, free = false } = {}) {
  const p = PIECES[id];
  if (!p) return null;
  const model = furnitureModel(THREE, id, (art) => {
    const m = std({ map: tex(art), roughness: 0.9 });
    if (p.glow) { m.emissive = new THREE.Color('#ffd890'); m.emissiveMap = tex(mask(art, p.glow)); m.emissiveIntensity = 0.8; }
    return m;
  });
  if (!model) return p.flat ? flatPiece(id, p, tx, ty, turn, dx, dz) : null;
  const play = dressPlay(THREE, model, p);
  if (play) B.plays.push(play);
  model.traverse(o => { if (o.isMesh) { o.castShadow = o.castShadow !== false; o.receiveShadow = true; } });
  model.scale.setScalar(scale);
  const turned = Math.round(turn / (Math.PI / 2)) % 2 !== 0, w = turned ? p.h : p.w, h = turned ? p.w : p.h;
  model.position.set(tx - COLS / 2 + w / 2 + dx, y, ty - ROWS / 2 + h / 2 + dz);
  model.rotation.y = turn;
  B.group.add(model);
  if (!free) for (let x = tx; x < tx + w; x++) for (let yy = ty; yy < ty + h; yy++) B.blocked.add(key(x, yy));
  return model;
}

/** A flat piece with no model (a rug, a mat): its painting on the floor, never in your way. */
function flatPiece(id, p, tx, ty, turn, dx, dz) {
  const m = std({ map: tex(pieceArt(id, 0, HD)), alphaTest: 0.5, roughness: 0.95 });
  const o = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), m);
  const turned = Math.round(turn / (Math.PI / 2)) % 2 !== 0, w = turned ? p.h : p.w, h = turned ? p.w : p.h;
  o.rotation.set(-Math.PI / 2, 0, turn);
  o.position.set(tx - COLS / 2 + w / 2 + dx, 0.012 + (B.rugs = (B.rugs || 0) + 1) * 0.002, ty - ROWS / 2 + h / 2 + dz);
  o.receiveShadow = true;
  B.group.add(o);
  return o;
}

function box(w, h, d, mats, x, y, z, parent = B.group) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

function mesh(geo, m, x, y, z, parent = B.group) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  parent.add(o);
  return o;
}

/** A box with rounded edges (js/hub-pc.js's). */
function rbox(w, h, d, r) {
  r = Math.min(r, w / 2, h / 2, d / 2) - 1e-4;
  const n = 5, g = new THREE.BoxGeometry(1, 1, 1, n, n, n).toNonIndexed();
  const pos = g.attributes.position, nor = g.attributes.normal, half = 0.5 / n, v = new THREE.Vector3();
  const bx = w / 2 - r, by = h / 2 - r, bz = d / 2 - r;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    v.set(x - Math.sign(x) * half, y - Math.sign(y) * half, z - Math.sign(z) * half).normalize();
    pos.setXYZ(i, bx * Math.sign(x) + v.x * r, by * Math.sign(y) + v.y * r, bz * Math.sign(z) + v.z * r);
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

/** A painting on a plane, standing in the room (a scroll, a plaque): `c` a fine() canvas, `w` x `h` in tiles. */
function panel(c, w, h, x, y, z, { glow = null, live = false } = {}) {
  const map = texOf(c), m = std({ map, transparent: true, alphaTest: 0.4, roughness: 0.95 });
  if (glow) { m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = texOf(glow); m.emissiveIntensity = 0.9; }
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  o.position.set(x, y, z);
  o.receiveShadow = true;
  if (live) o.userData.map = map;
  B.group.add(o);
  return o;
}

/** The floor, the back wall and the side walls from their paintings, the plinth under them and the doormat out. */
function shell({ floor, wall, side, edge = '#4a2a18', cap = '#6a4428', under = '#2a1810', bg = '#22140c', open = false, mat = true, holes = false, walled = true }) {
  B.bg = bg;
  const e = std({ color: edge });
  const top = std({ map: texOf(floor), alphaTest: holes ? 0.5 : 0, roughness: 0.6, emissive: new THREE.Color('#ffffff'), emissiveMap: floor.glow ? texOf(floor.glow) : null, emissiveIntensity: floor.glow ? 0.9 : 0 });
  const fl = new THREE.Mesh(new THREE.BoxGeometry(COLS, 0.6, ROWS), [e, e, top, e, std({ color: edge }), e]);
  fl.position.y = -0.3;
  fl.receiveShadow = true;
  B.group.add(fl);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 7, ROWS + 0.4), [e, e, std({ color: under }), e, std({ color: under }), e]);
  plinth.position.set(0, -0.62 - 3.5, -0.2);
  B.group.add(plinth);
  const c = open ? new THREE.MeshBasicMaterial({ color: cap, transparent: true, opacity: 0 }) : std({ color: cap });   // open air: no tops, the sky shows through
  if (walled) {   // a town's back is open, its backdrop hangs out past it instead (js/town-backdrop.js)
    const wm = std({ map: texOf(wall), alphaTest: open ? 0.5 : 0, roughness: 0.9, emissive: new THREE.Color('#fff4dc'), emissiveMap: wall.glow ? texOf(wall.glow) : null, emissiveIntensity: wall.glow ? 0.9 : 0 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, TOP, 0.4), [c, c, c, c, wm, c]);
    back.position.set(0, TOP / 2, BACK_Z - 0.2);
    back.receiveShadow = true;
    B.group.add(back);
  }
  for (const s of [-1, 1]) {
    const inside = std({ map: texOf(side(s < 0)), alphaTest: open ? 0.5 : 0, roughness: 0.9 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, ROWS), s < 0 ? [inside, c, c, c, c, c] : [c, inside, c, c, c, c]);
    m.position.set(s * (COLS / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    B.group.add(m);
  }
  // a room you can't walk out of yet (Team Rocket's) still gets its mat, shown once the way out is open (mountEvent())
  const { step, mat: m } = doormat(tileX(DOOR.x), ROWS / 2 + 0.47, std({ color: '#b89a78' }));
  m.userData.spot = 'exit';
  B.group.add(step, m);
  B.mat = m.material;
  B.exitParts = [step, m];
  B.lockedExit = !mat;
}

/** Glowing bits that rise and fade: sparkles off a book, hearts over the fans, the Z's over a sleeping Slowpoke. */
function sprite(c, size) {
  const m = new THREE.SpriteMaterial({ map: texOf(c), transparent: true, depthWrite: false, toneMapped: false });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  s.visible = false;
  s.raycast = () => {};
  B.group.add(s);
  return s;
}

function heartArt(col) {
  const { c, g } = fine(12, 12, 8);
  g.fillStyle = col;
  g.beginPath(); g.moveTo(6, 10.5); g.bezierCurveTo(-1, 5.5, 2, -0.5, 6, 3.4); g.bezierCurveTo(10, -0.5, 13, 5.5, 6, 10.5); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(4, 4, 1.4, 0.9, -0.6, 0, Math.PI * 2); g.fill();
  return c;
}

function sparkArt(col) {
  const { c, g } = fine(12, 12, 8);
  const r = g.createRadialGradient(6, 6, 0, 6, 6, 6);
  r.addColorStop(0, '#ffffff'); r.addColorStop(0.3, col); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 12, 12);
  g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(6, 0); g.lineTo(6.6, 5.4); g.lineTo(12, 6); g.lineTo(6.6, 6.6); g.lineTo(6, 12); g.lineTo(5.4, 6.6); g.lineTo(0, 6); g.lineTo(5.4, 5.4); g.fill();
  return c;
}

/** A spray of sprites from `at`, rising (or falling, `fall`) and fading over the act; returns its tick. */
function burst(pool, at, { spread = 0.6, rise = 1.2, fall = false, spin = false } = {}) {
  const r = seeded(Math.floor(Math.random() * 1e6));
  const each = pool.map(s => ({ s, dx: (r() - 0.5) * spread * 2, dz: (r() - 0.5) * spread, delay: r() * 0.35, up: rise * (0.6 + r() * 0.6), sway: r() * Math.PI * 2 }));
  return (k) => {
    for (const p of each) {
      const t = Math.max(0, Math.min(1, (k - p.delay) / (1 - p.delay)));
      p.s.visible = t > 0 && t < 1;
      if (!p.s.visible) continue;
      const y = fall ? at.y - t * p.up : at.y + ease(t) * p.up;
      p.s.position.set(at.x + p.dx * (fall ? 1 : t) + Math.sin(t * 6 + p.sway) * 0.08, y, at.z + p.dz);
      p.s.material.opacity = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.6) / 0.4);
      if (spin) p.s.material.rotation = t * 8 + p.sway;
    }
  };
}

/* ---------- the trainers: still sprites that blink and react ---------- */

async function bitmap(src) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(src);
  return createImageBitmap(await res.blob());
}

/** A trainer's sprite on a billboard, feet at its group's origin (found from the sprite's lowest opaque row), with its
    eyes-closed copy for blinking. `id` is a trainer in assets/trainers/, or a whole path (a Gym Leader's, no blink). */
async function npcBoard(id) {
  const path = id.includes('/');
  const [open, shut] = await Promise.all([bitmap(path ? id : `assets/trainers/${id}.png`), path ? null : bitmap(`assets/trainers/${id}-blink.png`).catch(() => null)]);
  const w = open.width, h = open.height, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(open, 0, 0);
  const d = g.getImageData(0, 0, w, h).data;
  let bottom = 0, left = w, right = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { bottom = y; left = Math.min(left, x); right = Math.max(right, x); }
  const t = tex(c), m = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w * NPC_PX, h * NPC_PX), m);
  board.castShadow = true;
  board.geometry.translate((w / 2 - (left + right + 1) / 2) * NPC_PX, (bottom + 1 - h / 2) * NPC_PX, 0);
  board.rotation.x = -PITCH;
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.36, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.011;
  blob.raycast = () => {};
  const group = new THREE.Group();
  group.add(board, blob);
  // their silhouette, for a Gym Leader you haven't beaten yet (setDark())
  const dark = new OffscreenCanvas(w, h), dg = dark.getContext('2d');
  dg.drawImage(open, 0, 0); dg.globalCompositeOperation = 'source-in'; dg.fillStyle = '#0c0a14'; dg.fillRect(0, 0, w, h);
  const who = { group, board, c, g, t, open, shut, dark, top: (bottom + 1) * NPC_PX, blinkAt: 0, shut0: false, npc: true, dim: false };
  who.setDark = (on) => { who.dim = on; who.blinkAt = 0; };
  return who;
}

/** Someone standing in the room: a trainer or a Pokémon (a front GIF, `flip` facing right), at tile `at`, `y` up. */
async function figure(stand, f, at) {
  const who = f.npc ? await npcBoard(f.npc) : await monBoard({ src: f.src }, false);
  if (!f.npc) who.board.rotation.x = -PITCH;
  who.flip = !!f.flip;
  who.stand = stand;
  who.base = { x: tileX(at.x) + (at.dx || 0), y: at.y || 0, z: tileZ(at.ty) + (at.dz || 0) };
  who.group.position.set(who.base.x, who.base.y, who.base.z);
  if (at.scale) who.group.scale.setScalar(at.scale);
  if (at.feet) standOnFeet(who);
  who.group.traverse(n => { n.userData.who = stand; });
  if (at.sleep) who.sleeping = true;
  return who;
}

/** A trainer's GIF has no SPRITE_FIT line: its board is lifted so its feet, the lowest opaque row, touch the ground. */
function standOnFeet(who) {
  const bmp = who.sheets.front.frames[0]?.bmp;
  if (!bmp) return;
  const c = document.createElement('canvas');
  c.width = bmp.width; c.height = bmp.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let bottom = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 8) bottom = Math.floor(i / 4 / c.width);
  who.board.geometry.translate(0, (c.height - 1 - bottom) * MON_PX, 0);
}

/** A reaction, run off the clock in tickFigures(): jump, nod, no (a head shake), turn (faces away until the room closes),
    hop (the fans' bounce). */
function does(who, move) {
  if (!who) return;
  if (move === 'npc-turn') { who.turned = true; return; }
  who.move = { name: move, from: performance.now() };
}

function tickFigures(now, dt) {
  for (const who of Object.values(R.who)) {
    if (who.npc) {
      if (now > who.blinkAt) {
        const shutNow = !who.shut0 && who.shut && !calm && !who.dim;
        who.g.clearRect(0, 0, who.c.width, who.c.height);
        who.g.drawImage(who.dim ? who.dark : shutNow ? who.shut : who.open, 0, 0);
        who.t.needsUpdate = true;
        who.shut0 = shutNow;
        who.blinkAt = now + (shutNow ? 120 : 2000 + Math.random() * 4000);
      }
    } else drawMon(who, { facing: 'front', sleeping: who.sleeping }, dt);
    let y = 0, x = 0, sy = 1;
    const m = who.move;
    if (m && !calm) {
      const k = (now - m.from) / 700;
      if (k >= 1) who.move = null;
      else if (m.name === 'npc-jump' || m.name === 'hop') y = Math.abs(Math.sin(k * Math.PI * 2)) * (m.name === 'hop' ? 0.28 : 0.34);
      else if (m.name === 'npc-nod') sy = 1 - Math.abs(Math.sin(k * Math.PI * 2)) * 0.06;
      else if (m.name === 'npc-no' || m.name === 'shake') x = Math.sin(k * Math.PI * 6) * 0.07 * (1 - k);
    } else if (m) who.move = null;
    // a trainer breathes, a touch, like the pixel room's
    if (who.npc && !calm) sy *= 1 + Math.sin(now / 2800 * Math.PI * 2 + who.base.x) * 0.012;
    const face = (who.flip ? -1 : 1) * (who.turned ? -1 : 1);
    who.board.scale.set(face, sy, 1);
    who.group.position.set(who.base.x + x, who.base.y + y, who.base.z);
  }
}

/* ---------- the Move Tutor's dojo ---------- */

const DOJO = { wood: ['#7a4a26', '#5a3418', '#3a2010'], paper: ['#fbf4e2', '#f2e6c8'], plaster: ['#e8d4ac', '#dcc498'], tatami: ['#d8d08c', '#c8bc74'] };

/** Shoji between dark timber posts over a wooden wainscot, a heavy beam, plaster above. */
function dojoBands(f, W, posts = 2) {
  const { g, rr, lin } = f;
  g.fillStyle = lin(0, 0, 0, wy(3.7), DOJO.plaster); g.fillRect(0, 0, W, wy(3.7));
  g.fillStyle = lin(0, wy(3.4), 0, wy(0.6), DOJO.paper); g.fillRect(0, wy(3.4), W, wy(0.6) - wy(3.4));
  g.strokeStyle = 'rgba(90,52,24,0.85)'; g.lineWidth = 0.7;
  for (let x = 0; x < W; x += U / 3) { g.beginPath(); g.moveTo(x, wy(3.4)); g.lineTo(x, wy(0.6)); g.stroke(); }
  for (let y = 0.6; y < 3.4; y += 0.45) { g.beginPath(); g.moveTo(0, wy(y)); g.lineTo(W, wy(y)); g.stroke(); }
  for (let x = 0; x < W + 1; x += U * posts) rr(x - 2, wy(3.7), 4, wy(0) - wy(3.7), 0.6, lin(x - 2, 0, x + 2, 0, DOJO.wood));
  g.fillStyle = lin(0, wy(3.75), 0, wy(3.35), DOJO.wood); g.fillRect(0, wy(3.75), W, wy(3.35) - wy(3.75));
  g.fillStyle = lin(0, wy(0.6), 0, wy(0), [DOJO.wood[0], DOJO.wood[1]]); g.fillRect(0, wy(0.6), W, wy(0) - wy(0.6));
  g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(0, wy(0.6), W, 0.6);
  g.fillStyle = DOJO.wood[2]; g.fillRect(0, wy(TOP), W, 4);
}

/* Kenmatta's arena medallion (js/arena-3d.js's, the relief baked into assets/arena/), hung in the alcove over his head: the
   painted one sat behind him (the user's ask, 2026-10-11). */
const MEDALLION = ['assets/arena/ken-medallion.jpg', 'assets/arena/ken-medallion-bump.jpg'];

function medallion3d(x, y, z, r) {
  const N = 1024, mk = () => Object.assign(document.createElement('canvas'), { width: N, height: N, fine: true });
  const out = { map: mk(), bump: mk() };
  paintMedallion(null, out);   // the ring at once, the Dragonite once its pictures load
  const map = texOf(out.map), bumpMap = texOf(out.bump);
  MEDALLION.forEach((src, i) => {
    const img = new Image();
    img.onload = () => {
      try { (i ? out.bump : out.map).getContext('2d').drawImage(img, 0, 0, N, N); } catch { return; }
      (i ? bumpMap : map).needsUpdate = true;
    };
    img.src = src;
  });
  const face = std({ map, bumpMap, bumpScale: 3, metalness: 0.25, roughness: 0.4, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.35 });
  mesh(new THREE.CircleGeometry(r, 64), face, x, y, z + 0.06).castShadow = false;
  const rim = mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.12, 64, 1, true), std({ color: '#a86a18', metalness: 0.5, roughness: 0.4 }), x, y, z);
  rim.rotation.x = Math.PI / 2;
}

function dojoWall() {
  const W = (COLS + 0.8) * U, H = TOP * U, f = fine(W, H, 5), { g, rr, lin, shine } = f, s = shine();
  dojoBands(f, W);
  // the alcove behind Ken: a dark wood recess, its shimenawa rope with paper zigzags (the medallion hangs over it, medallion3d())
  const a0 = wx(4.65), a1 = wx(6.35);   // centred on Ken's tile, 5 (wx() is a tile's left edge)
  rr(a0 - 3, wy(3.9), a1 - a0 + 6, wy(0) - wy(3.9), 1, lin(a0, 0, a1, 0, DOJO.wood));
  rr(a0, wy(3.7), a1 - a0, wy(0.3) - wy(3.7), 0.6, lin(0, wy(3.7), 0, wy(0.3), ['#9a6236', '#7a4a26']));
  {   // planked in warm wood, the medallion's backboard
    const n = 6, w = (a1 - a0) / n, r = seeded(17);
    for (let i = 0; i < n; i++) {
      const x = a0 + i * w;
      g.fillStyle = `rgba(${r() < 0.5 ? '255,220,170' : '60,30,10'},${0.06 + r() * 0.08})`; g.fillRect(x, wy(3.7), w, wy(0.3) - wy(3.7));
      g.strokeStyle = 'rgba(90,50,20,0.35)'; g.lineWidth = 0.3;
      for (let k = 0; k < 3; k++) { const gx = x + w * (0.25 + r() * 0.5); g.beginPath(); g.moveTo(gx, wy(3.7)); g.bezierCurveTo(gx + 0.8, wy(2.6), gx - 0.8, wy(1.4), gx + 0.3, wy(0.3)); g.stroke(); }
      g.fillStyle = '#4a2a14'; g.fillRect(x - 0.3, wy(3.7), 0.6, wy(0.3) - wy(3.7));
    }
  }
  g.strokeStyle = '#d8c078'; g.lineWidth = 3.4;
  g.beginPath(); g.moveTo(a0 - 2, wy(3.8)); g.quadraticCurveTo((a0 + a1) / 2, wy(3.6), a1 + 2, wy(3.8)); g.stroke();
  g.strokeStyle = '#a88a48'; g.lineWidth = 0.6;
  for (let t = 0; t < 1; t += 0.05) { const x = a0 + (a1 - a0) * t, y = wy(3.8) + Math.sin(t * Math.PI) * (wy(3.6) - wy(3.8)); g.beginPath(); g.moveTo(x - 1.4, y - 1.4); g.lineTo(x + 1.4, y + 1.4); g.stroke(); }
  for (const t of [0.14, 0.86]) {
    const x = a0 + (a1 - a0) * t, y = wy(3.8) + Math.sin(t * Math.PI) * (wy(3.6) - wy(3.8)) + 1.6;
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(x - 1.5, y); g.lineTo(x + 1.5, y); g.lineTo(x + 0.4, y + 3); g.lineTo(x + 1.6, y + 3); g.lineTo(x + 0.2, y + 6.5); g.lineTo(x - 1.5, y + 3.5); g.lineTo(x - 0.3, y + 3.5); g.closePath(); g.fill();
  }
  // TEST YOUR MIGHT, gold on a red plaque, right of the alcove
  const px = wx(8.1), py = wy(3.25);
  rr(px - 1.5, py - 1.5, 2.5 * U + 3, 22 + 3, 2, '#2a1408');
  rr(px, py, 2.5 * U, 22, 1.5, lin(0, py, 0, py + 22, ['#c82818', '#8a1408']));
  for (const [t, y] of [['TEST YOUR', py + 7.5], ['MIGHT', py + 15.5]]) { words(g, t, px + 1.25 * U, y, 6.5, '#ffd858'); words(s, t, px + 1.25 * U, y, 6.5, '#806020'); }
  // paper lanterns hung from the beam, lit
  for (const t of [0.6, 10.4]) {
    const x = wx(t), y = wy(4.4);
    g.strokeStyle = DOJO.wood[2]; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, wy(TOP)); g.lineTo(x, y - 7); g.stroke();
    rr(x - 5, y - 7, 10, 14, 5, lin(x - 5, 0, x + 5, 0, ['#e85838', '#ffa060', '#e85838']));
    g.fillStyle = '#2a1408'; g.fillRect(x - 3, y - 8, 6, 1.6); g.fillRect(x - 3, y + 6.4, 6, 1.6);
    s.fillStyle = '#c06030'; s.beginPath(); s.roundRect(x - 5, y - 7, 10, 14, 5); s.fill();
  }
  return f.c;
}

function dojoSide() {
  const W = ROWS * U, H = TOP * U, f = fine(W, H, 4);
  dojoBands(f, W);
  return f.c;
}

/** Tatami mats, two tiles long, laid in the usual pinwheel, each with its black cloth border. */
function dojoFloor() {
  const T = 16, W = COLS * T, H = ROWS * T, f = fine(W, H, 5), { g, lin } = f;
  g.fillStyle = '#2a2014'; g.fillRect(0, 0, W, H);
  const mat = (x, y, w, h) => {
    g.fillStyle = lin(x, y, x + w, y + h, DOJO.tatami); g.fillRect(x + 0.4, y + 0.4, w - 0.8, h - 0.8);
    g.strokeStyle = 'rgba(120,110,50,0.35)'; g.lineWidth = 0.25;
    if (w > h) for (let i = x + 1; i < x + w; i += 1.1) { g.beginPath(); g.moveTo(i, y + 1); g.lineTo(i, y + h - 1); g.stroke(); }
    else for (let i = y + 1; i < y + h; i += 1.1) { g.beginPath(); g.moveTo(x + 1, i); g.lineTo(x + w - 1, i); g.stroke(); }
    g.fillStyle = '#2c2a26';
    if (w > h) { g.fillRect(x + 0.4, y + 0.4, w - 0.8, 1.4); g.fillRect(x + 0.4, y + h - 1.8, w - 0.8, 1.4); }
    else { g.fillRect(x + 0.4, y + 0.4, 1.4, h - 0.8); g.fillRect(x + w - 1.8, y + 0.4, 1.4, h - 0.8); }
  };
  for (let y = 0; y < ROWS; y += 2) for (let x = 0; x < COLS; x++) {
    if ((x + y / 2) % 3 === 0 && x + 1 < COLS) { mat(x * T, y * T, 2 * T, T); mat(x * T, (y + 1) * T, 2 * T, T); x++; }
    else mat(x * T, y * T, T, 2 * T);
  }
  return f.c;
}

/** The hanging scroll beside the alcove: blank paper on a brocade mount, its ink brushed down it during a lesson. */
function scrollArt(ink) {
  const f = fine(18, 44, 10), { g, rr, lin } = f;
  rr(1, 2, 16, 40, 0.6, lin(0, 0, 18, 0, ['#4a6a58', '#6a8a70', '#4a6a58']));
  rr(3, 5, 12, 33, 0.3, lin(0, 5, 0, 38, ['#fbf6e6', '#f0e6cc']));
  rr(0, 0, 18, 2.6, 1.2, lin(0, 0, 0, 2.6, ['#8a5a30', '#4a2a14']));
  rr(-0.5, 41.4, 19, 2.6, 1.2, lin(0, 41.4, 0, 44, ['#8a5a30', '#4a2a14']));
  g.fillStyle = '#ffe8a0'; g.fillRect(-0.5, 42.2, 1.2, 1); g.fillRect(17.3, 42.2, 1.2, 1);
  const r = seeded(31), strokes = [];
  for (let col = 0; col < 2; col++) for (let i = 0; i < 6; i++) {
    const x = 11 - col * 5, y = 7.5 + i * 4.6;
    strokes.push([x - 1.6 + r() * 0.6, y, x + 1.4 + r() * 0.6, y + 0.4 + r() * 0.6]);
    strokes.push([x + r() * 0.8 - 0.4, y - 1 + r() * 0.4, x - 0.2 + r(), y + 3]);
    if (r() < 0.6) strokes.push([x - 1.4, y + 2.2, x + 1.2, y + 1.8 + r()]);
  }
  const n = Math.floor(strokes.length * ink);
  g.strokeStyle = '#1a1410'; g.lineCap = 'round';
  strokes.slice(0, n).forEach(([x0, y0, x1, y1], i) => { g.lineWidth = 0.7 + (i % 3) * 0.2; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 0.4, (y0 + y1) / 2 - 0.3, x1, y1); g.stroke(); });
  g.fillStyle = '#c82818'; g.fillRect(3.6, 33.5, 2.4, 2.4);   // the master's seal
  return f.c;
}

/** The sandbag on its A-frame: a red leather bag swinging on a chain from the crossbar. */
function sandbag(tx, ty) {
  const x = tileX(tx), z = tileZ(ty), wood = std({ color: '#6a4224', roughness: 0.8 }), chain = std({ color: '#9a9aa8', metalness: 0.6, roughness: 0.35 });
  for (const s of [-1, 1]) {
    const leg = mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.5, 10), wood, x + s * 0.55, 1.2, z);
    leg.rotation.z = s * 0.12;
  }
  const bar = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 10), wood, x, 2.42, z);
  bar.rotation.z = Math.PI / 2;
  const pivot = new THREE.Group();
  pivot.position.set(x, 2.38, z);
  B.group.add(pivot);
  mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6), chain, 0, -0.2, 0, pivot);
  const leather = std({ color: '#c8382a', roughness: 0.55 });
  mesh(new THREE.CapsuleGeometry(0.26, 0.8, 8, 20), leather, 0, -0.95, 0, pivot);
  mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.08, 20), std({ color: '#2a2a30', roughness: 0.5 }), 0, -0.75, 0, pivot);
  mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.08, 20), std({ color: '#2a2a30', roughness: 0.5 }), 0, -1.2, 0, pivot);
  pivot.traverse(o => { o.userData.spot = 1; });
  B.blocked.add(key(tx, ty));
  B.anchors[1] = new THREE.Vector3(x, 2.85, z);
  return pivot;
}

async function buildTutor(figs) {
  shell({ floor: dojoFloor(), wall: dojoWall(), side: dojoSide, edge: '#3a2414', cap: '#5a3418', under: '#24140a', bg: '#1a0e08' });
  // Kenmatta on his red cushion before the alcove (his challenge), the scroll (a lesson) and the sandbag (training)
  piece('zabuton', 5, 1, { scale: 1.1 });
  medallion3d(tileX(5), 2.5, BACK_Z, 0.84);
  B.blocked.add(key(5, 1));
  const scroll = panel(scrollArt(0.12), 0.9, 2.2, tileX(3), 2.15, BACK_Z + 0.03, { live: true });
  scroll.userData.spot = 0;
  B.anchors[0] = new THREE.Vector3(tileX(3), 3.45, BACK_Z + 0.1);
  B.bag = sandbag(7, 2);
  B.anchors[2] = new THREE.Vector3(tileX(5), 0.5, tileZ(1) + 0.55);   // at his cushion, the medallion over his head
  B.spots = [{ step: { x: 3, y: 1 } }, { step: { x: 7, y: 3 } }, { step: { x: 5, y: 2 } }];
  piece('scrollrack', 0, 0); piece('bonsai', 1, 0); piece('swordrack', 10, 0); piece('stonelantern', 8, 0, { scale: 0.85 });
  piece('dummy', 10, 2); piece('drum', 0, 3); piece('dumbbells', 10, 5); piece('getarack', 0, 6);
  B.scroll = { mesh: scroll, ink: 0.12 };
  B.who.npc = await figure('npc', figs.npc ?? { npc: 'alder' }, { x: 5, ty: 1, y: 0.1, dz: 0.05 });
  B.who.npc.group.traverse(o => { o.userData.spot = 2; });
  B.acts = {
    lesson: { ms: 1500, tick(k) {
      const ink = 0.12 + ease(k) * 0.88;
      if (Math.abs(ink - R.scroll.ink) < 0.04 && k < 1) return;
      R.scroll.ink = ink;
      const m = R.scroll.mesh.material;
      m.map.dispose(); m.map = texOf(scrollArt(ink)); m.needsUpdate = true;
    }, cues: [[0, 'stick'], [0.45, 'stick'], [0.85, 'stamp']] },
    train: { ms: 2500, tick(k) {
      const hits = [0.1, 0.34, 0.58], since = Math.min(...hits.map(h => (k >= h ? k - h : 9)));
      R.bag.rotation.x = -Math.sin(Math.min(1, since / 0.3) * Math.PI) * 0.35 * Math.exp(-since * 3) - (k > 0.6 ? Math.sin((k - 0.6) * 18) * 0.12 * (1 - k) : 0);
      walker.lunge = since < 0.12 ? Math.sin(since / 0.12 * Math.PI) * 0.35 : 0;
    }, cues: [[0.1, 'hit'], [0.34, 'hit'], [0.58, 'hit']] },
  };
}

/* ---------- the Move Deleter's study ---------- */

function studyBands(f, W) {
  const { g, rr, lin } = f, r = seeded(3);
  g.fillStyle = lin(0, 0, 0, wy(1.2), ['#2c4a3c', '#36584a']); g.fillRect(0, 0, W, wy(1.2));
  g.fillStyle = 'rgba(200,180,110,0.16)';   // the damask's little gold lilies
  for (let y = 6; y < wy(1.3); y += 9) for (let x = (y / 9) % 2 ? 4.5 : 0; x < W; x += 9) {
    g.beginPath(); g.ellipse(x, y, 1.2, 2.4, 0, 0, Math.PI * 2); g.ellipse(x - 1.8, y + 1.2, 1.6, 0.8, 0.5, 0, Math.PI * 2); g.ellipse(x + 1.8, y + 1.2, 1.6, 0.8, -0.5, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = lin(0, wy(1.25), 0, wy(0), ['#6a3e22', '#4a2814']); g.fillRect(0, wy(1.25), W, wy(0) - wy(1.25));
  for (let x = 2; x < W; x += U) rr(x, wy(1.05), U - 4, wy(0.25) - wy(1.05), 0.8, lin(0, wy(1.05), 0, wy(0.25), ['#7a4a2a', '#5a3218']));
  g.fillStyle = lin(0, wy(1.35), 0, wy(1.2), ['#d8b060', '#9a7030']); g.fillRect(0, wy(1.35), W, wy(1.2) - wy(1.35));
  g.fillStyle = lin(0, wy(TOP), 0, wy(TOP - 0.35), ['#4a2814', '#7a4a2a']); g.fillRect(0, wy(TOP), W, 0.35 * U);
  g.fillStyle = '#d8b060'; g.fillRect(0, wy(TOP - 0.35), W, 0.8);
  void r;
}

function studyWall() {
  const W = (COLS + 0.8) * U, H = TOP * U, f = fine(W, H, 5), { g, rr, lin, shine } = f, s = shine();
  studyBands(f, W);
  // a tall arched window behind the Deleter onto a moonlit night
  const x0 = wx(4.15), x1 = wx(5.85), y0 = wy(4.2), y1 = wy(1.55), mid = (x0 + x1) / 2, rad = (x1 - x0) / 2;
  g.save(); g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + rad); g.arc(mid, y0 + rad, rad, Math.PI, 0); g.lineTo(x1, y1); g.closePath(); g.clip();
  skyWindow(f, s, x0, x1, y0, y1, { frame: '#5a3218', curtain: null, sky: ['#141a3c', '#24306a', '#3a4a8a'], night: true });
  g.restore();
  g.strokeStyle = '#5a3218'; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0 + rad); g.arc(mid, y0 + rad, rad, Math.PI, 0); g.lineTo(x1, y1); g.stroke();
  rr(x0 - 4, y1, x1 - x0 + 8, 2.4, 0.8, '#7a4a2a');
  for (const [a, b] of [[x0 - 8, x0 + 1], [x1 - 1, x1 + 8]]) {
    g.fillStyle = lin(a, 0, b, 0, ['#7a1c2a', '#a83040', '#7a1c2a']);
    g.beginPath(); g.moveTo(a, y0 - 6); g.lineTo(b, y0 - 6); g.quadraticCurveTo((a + b) / 2 + 1, (y0 + y1) / 2, b - 1, y1 + 4); g.lineTo(a + 1, y1 + 4); g.closePath(); g.fill();
  }
  rr(x0 - 12, y0 - 9, x1 - x0 + 24, 3, 1.5, '#c8a050');
  // two old portraits of scholars, and a framed chart of forgotten moves
  portrait(f, wx(2.2), wy(3.9), 22, 28, ['#8a7058', '#5a4430'], '#e8c0a0');
  portrait(f, wx(7.15), wy(3.9), 22, 28, ['#6a7a8a', '#3a4858'], '#f0d0a8');
  const cx = wx(1.6), cy = wy(5.3);
  rr(cx - 2, cy - 2, 34, 18, 1, '#c8a050');
  rr(cx, cy, 30, 14, 0.5, '#f4ecd4');
  g.strokeStyle = '#6a5440'; g.lineWidth = 0.4;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx + 3, cy + 3 + i * 2.8); g.lineTo(cx + 27 - (i % 2) * 6, cy + 3 + i * 2.8); g.stroke(); }
  g.strokeStyle = '#c82818'; g.lineWidth = 0.6;
  g.beginPath(); g.moveTo(cx + 3, cy + 5.8); g.lineTo(cx + 22, cy + 5.8); g.stroke();
  // brass wall lamps, lit
  for (const t of [3.4, 6.6]) {
    const x = wx(t), y = wy(3.0);
    rr(x - 1, y, 2, 6, 0.6, '#b08838');
    g.fillStyle = lin(x - 4, 0, x + 4, 0, ['#f8d888', '#fff4c8', '#f8d888']); g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.lineTo(x + 2.4, y - 6); g.lineTo(x - 2.4, y - 6); g.closePath(); g.fill();
    s.fillStyle = '#c8a050'; s.beginPath(); s.moveTo(x - 4, y); s.lineTo(x + 4, y); s.lineTo(x + 2.4, y - 6); s.lineTo(x - 2.4, y - 6); s.closePath(); s.fill();
  }
  return f.c;
}

function studySide() {
  const W = ROWS * U, H = TOP * U, f = fine(W, H, 4);
  studyBands(f, W);
  portrait(f, wx(3), wy(3.8), 22, 28, ['#7a5a6a', '#4a3040'], '#f0c8b0');
  return f.c;
}

function studyFloor() {
  const T = 16, W = COLS * T, H = ROWS * T, f = fine(W, H, 5), { g, lin } = f;
  planks(f, W, H, T, ['#7a4a2a', '#6a3e22']);
  // a worn red rug with a gold border under the Deleter's things
  const x = 1.4 * T, y = 1.5 * T, w = 8.2 * T, h = 3.6 * T;
  g.fillStyle = lin(x, y, x + w, y + h, ['#8a2030', '#a83040', '#8a2030']); g.fillRect(x, y, w, h);
  g.strokeStyle = '#d8b060'; g.lineWidth = 1.2; g.strokeRect(x + 2, y + 2, w - 4, h - 4);
  g.lineWidth = 0.5; g.strokeRect(x + 4, y + 4, w - 8, h - 8);
  g.fillStyle = 'rgba(216,176,96,0.35)';
  for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(x + w * (0.15 + i * 0.175), y + h / 2, 4, 6, 0, 0, Math.PI * 2); g.fill(); }
  return f.c;
}

/** The hypnotist's pendulum: a brass frame on the floor, a spiral disc swinging from its crossbar. */
function spiralArt() {
  const f = fine(24, 24, 10), { g } = f;
  const r = g.createRadialGradient(12, 12, 0, 12, 12, 12);
  r.addColorStop(0, '#fff6d8'); r.addColorStop(0.9, '#f0c048'); r.addColorStop(1, '#a87010');
  g.fillStyle = r; g.beginPath(); g.arc(12, 12, 11.6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#6a2a9a'; g.lineWidth = 1.5;
  g.beginPath();
  for (let a = 0; a < Math.PI * 8; a += 0.1) { const d = a / (Math.PI * 8) * 10.5; g.lineTo(12 + Math.cos(a) * d, 12 + Math.sin(a) * d); }
  g.stroke();
  const s = f.shine();
  s.strokeStyle = '#7a3aaa'; s.lineWidth = 1.5;
  s.beginPath();
  for (let a = 0; a < Math.PI * 8; a += 0.1) { const d = a / (Math.PI * 8) * 10.5; s.lineTo(12 + Math.cos(a) * d, 12 + Math.sin(a) * d); }
  s.stroke();
  return f.c;
}

function pendulum(tx, ty) {
  const x = tileX(tx), z = tileZ(ty), brass = std({ color: '#c8a048', metalness: 0.7, roughness: 0.3 }), dark = std({ color: '#4a2814', roughness: 0.7 });
  box(1.1, 0.12, 0.6, dark, x, 0.06, z);
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.9, 12), brass, x + s * 0.45, 1.0, z);
  const bar = mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.0, 12), brass, x, 1.95, z);
  bar.rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.07, 14, 10), brass, x + s * 0.5, 1.95, z);
  const pivot = new THREE.Group();
  pivot.position.set(x, 1.92, z);
  B.group.add(pivot);
  mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9, 6), brass, 0, -0.45, 0, pivot);
  const art = spiralArt(), m = std({ map: texOf(art), roughness: 0.3, metalness: 0.3, emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.25 });
  const disc = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 40), [std({ color: '#a87010', metalness: 0.7, roughness: 0.3 }), m, m], 0, -1.05, 0, pivot);
  disc.rotation.x = Math.PI / 2;
  disc.rotation.y = 0;
  pivot.traverse(o => { o.userData.spot = 1; });
  B.blocked.add(key(tx, ty));
  B.anchors[1] = new THREE.Vector3(x, 2.4, z);
  return { pivot, disc, glow: m };
}

/** An open book on the lectern glowing, its words lifting off as sparkles when a move is forgotten. */
async function buildDeleter(figs) {
  shell({ floor: studyFloor(), wall: studyWall(), side: studySide, edge: '#3a2010', cap: '#4a2814', under: '#1c100a', bg: '#140c08' });
  const lectern = piece('lectern', 3, 2);
  lectern?.traverse(o => { o.userData.spot = 0; });
  B.anchors[0] = new THREE.Vector3(tileX(3), 2.0, tileZ(2));
  B.pend = pendulum(7, 2);
  B.spots = [{ step: { x: 3, y: 3 } }, { step: { x: 7, y: 3 } }];
  piece('shelf', 0, 0); piece('bindershelf', 2, 0); piece('writingdesk', 3, 0); piece('grandclock', 7, 0); piece('shelf', 9, 0);
  piece('candlestand', 0, 3); piece('bookcart', 10, 3); piece('bookstack', 0, 5); piece('globe', 10, 5);
  B.who.npc = await figure('npc', figs.npc ?? { npc: 'deleter' }, { x: 5, ty: 1 });
  B.who.mon = await figure('mon', figs.mon ?? { src: 'assets/pokemon/slowpoke-front.gif' }, { x: 5, ty: 2, dz: 0.15, sleep: true });
  B.blocked.add(key(5, 1)); B.blocked.add(key(5, 2));
  // the Slowpoke dozes: Z's drift up off it
  const zArt = (() => { const { c, g } = fine(10, 10, 8); words(g, 'Z', 5, 5.4, 9, '#ffffff'); g.strokeStyle = '#4a5a8a'; g.lineWidth = 0.6; g.font = '900 9px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('Z', 5, 5.4); return c; })();
  const zs = [0, 1, 2].map(() => sprite(zArt, 0.3));
  const slow = B.who.mon;
  B.ticks.push((now) => {
    if (calm) return;
    zs.forEach((s, i) => {
      const t = ((now / 2400) + i / 3) % 1;
      s.visible = true;
      s.position.set(slow.base.x + 0.3 + t * 0.35 + Math.sin(t * 6) * 0.05, 0.9 + t * 0.9, slow.base.z);
      s.material.opacity = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
      s.scale.setScalar(0.18 + t * 0.2);
    });
  });
  B.ticks.push((now) => {
    if (acting?.name === 'hypno') return;
    R.pend.pivot.rotation.z = calm ? 0 : Math.sin(now / 1000 * Math.PI) * 0.22;
  });
  const sparks = Array.from({ length: 14 }, (_, i) => sprite(sparkArt(i % 2 ? '#a8f0c8' : '#e8ffd8'), 0.22));
  const glowing = [];
  lectern?.traverse(o => { if (o.material?.emissiveMap) glowing.push(o.material); });
  B.acts = {
    erase: { ms: 1750, start() { this.fly = burst(sparks, new THREE.Vector3(tileX(3), 1.25, tileZ(2) + 0.1), { spread: 0.35, rise: 1.4 }); },
      tick(k) { this.fly(k); for (const m of glowing) m.emissiveIntensity = 0.8 + Math.sin(k * Math.PI) * 2; }, cues: [[0, 'spirit']] },
    hypno: { ms: 2000, tick(k) {
      const amp = 0.22 + Math.sin(k * Math.PI) * 0.45;
      R.pend.pivot.rotation.z = Math.sin(k * Math.PI * 7) * amp;
      R.pend.disc.rotation.y = k * Math.PI * 6;
      R.pend.glow.emissiveIntensity = 0.25 + Math.sin(k * Math.PI) * 1.6;
    }, cues: [[0, 'spirit'], [0.5, 'spirit']] },
  };
}

/* ---------- the Day Care ---------- */

function careBands(f, W) {
  const { g, rr, lin } = f;
  g.fillStyle = lin(0, 0, 0, wy(1), ['#fde6d0', '#f8d8bc']); g.fillRect(0, 0, W, wy(1));
  // tiny eggs and Poké Balls on the paper
  for (let y = 8; y < wy(1.2); y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < W; x += 12) {
    if ((x + y) % 24 < 12) { g.fillStyle = 'rgba(240,170,140,0.45)'; g.beginPath(); g.ellipse(x, y, 1.6, 2.1, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(120,190,130,0.5)'; g.fillRect(x - 1, y - 0.6, 0.8, 0.8); }
    else { g.fillStyle = 'rgba(130,180,220,0.4)'; g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); }
  }
  g.fillStyle = lin(0, wy(1.05), 0, wy(0), ['#ffffff', '#f0ece2']); g.fillRect(0, wy(1.05), W, wy(0) - wy(1.05));
  for (let x = 0; x < W; x += 5) { g.fillStyle = 'rgba(170,150,120,0.25)'; g.fillRect(x, wy(1.0), 0.4, wy(0.15) - wy(1.0)); }
  g.fillStyle = '#88c8a0'; g.fillRect(0, wy(1.1), W, 1.2);
  g.fillStyle = '#a07850'; g.fillRect(0, wy(0.15), W, wy(0) - wy(0.15));
  g.fillStyle = lin(0, wy(TOP), 0, wy(TOP - 0.3), ['#88c8a0', '#a8e0b8']); g.fillRect(0, wy(TOP), W, 0.3 * U);
  void rr;
}

function careWall() {
  const W = (COLS + 0.8) * U, H = TOP * U, f = fine(W, H, 5), { g, rr, lin, shine } = f, s = shine();
  careBands(f, W);
  skyWindow(f, s, wx(1.2), wx(2.8), wy(3.1), wy(1.6), { curtain: ['#c8f0d0', '#98d8b0'] });
  skyWindow(f, s, wx(7.2), wx(8.8), wy(3.1), wy(1.6), { curtain: ['#c8f0d0', '#98d8b0'] });
  // DAY CARE on a wooden board, a bunting of pastel flags under it
  const bw = 4.6 * U, bx = (W - bw) / 2, by = wy(4.6);
  rr(bx - 1.5, by - 1.5, bw + 3, 21, 3, '#6a4428');
  rr(bx, by, bw, 18, 2.4, lin(0, by, 0, by + 18, ['#f0c890', '#d8a868']));
  words(g, 'DAY CARE', bx + bw / 2, by + 9.4, 10.5, '#7a3a20');
  g.fillStyle = '#f8a8a0'; g.beginPath(); g.ellipse(bx + 8, by + 9, 3.6, 4.6, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(bx + bw - 8, by + 9, 3.6, 4.6, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#58b878'; g.fillRect(bx + bw - 10, by + 8, 1.6, 1.6); g.fillRect(bx + bw - 7, by + 10.5, 1.4, 1.4);
  const cols = ['#f8a8a0', '#a8d8f8', '#f8e088', '#b8e8a8', '#e0b8f0'];
  g.strokeStyle = '#a07850'; g.lineWidth = 0.5;
  g.beginPath(); g.moveTo(wx(0), wy(5.2)); g.quadraticCurveTo(W / 2, wy(4.6), wx(10.2), wy(5.2)); g.stroke();
  for (let i = 0; i < 24; i++) {
    const t = (i + 0.5) / 24, x = wx(0) + (wx(10.2) - wx(0)) * t, y = wy(5.2) + Math.sin(t * Math.PI) * (wy(4.6) - wy(5.2)) * 0.98;
    if (x > bx - 4 && x < bx + bw + 4) continue;
    g.fillStyle = cols[i % cols.length]; g.beginPath(); g.moveTo(x - 2.6, y); g.lineTo(x + 2.6, y); g.lineTo(x, y + 5); g.closePath(); g.fill();
  }
  // crayon pictures pinned up
  portrait(f, wx(4.0), wy(2.9), 14, 12, ['#ffffff', '#f4f4f4'], '#f8c0c8');
  portrait(f, wx(5.6), wy(2.9), 14, 12, ['#ffffff', '#f4f4f4'], '#a8d0f8');
  return f.c;
}

function careSide(left) {
  const W = ROWS * U, H = TOP * U, f = fine(W, H, 4), s = f.shine();
  careBands(f, W);
  skyWindow(f, s, wx(left ? 3.4 : 2.4), wx(left ? 5 : 4), wy(3.1), wy(1.6), { curtain: ['#c8f0d0', '#98d8b0'] });
  return f.c;
}

function careFloor() {
  const T = 16, W = COLS * T, H = ROWS * T, f = fine(W, H, 5), { g, lin } = f;
  planks(f, W, H, T, ['#e8c08c', '#dcb07a']);
  // a round play rug, soft green with a ring of colours
  const cx = 5.5 * T, cy = 3.6 * T;
  for (const [r, col] of [[3.1, '#a8d8a0'], [2.6, '#f8e8a8'], [2.2, '#b8e0f0'], [1.8, '#c8ecc0']]) { g.fillStyle = col; g.beginPath(); g.ellipse(cx, cy, r * T, r * T * 0.72, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = lin(cx - T, cy - T, cx + T, cy + T, ['#e0f4d8', '#c0e4b8']); g.beginPath(); g.ellipse(cx, cy, 1.3 * T, 0.94 * T, 0, 0, Math.PI * 2); g.fill();
  return f.c;
}

/** The Egg in its straw nest, wobbling when a trade is fetched. */
function nest(tx, ty) {
  const x = tileX(tx), z = tileZ(ty), straw = std({ color: '#d8b060', roughness: 1 }), dark = std({ color: '#b08838', roughness: 1 });
  const ring = mesh(new THREE.TorusGeometry(0.34, 0.13, 10, 28), straw, x, 0.12, z);
  ring.rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.1, 24), dark, x, 0.06, z);
  const r = seeded(17);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = 0.3 + r() * 0.12, s = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), r() < 0.5 ? straw : dark, x + Math.cos(a) * d, 0.18, z + Math.sin(a) * d);
    s.rotation.set(r() * 1.4 - 0.7, a, Math.PI / 2 + r() * 0.6 - 0.3);
  }
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fbf6e8'; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#78c088';
  for (const [sx, sy, sr] of [[20, 40, 12], [64, 30, 9], [100, 50, 13], [40, 80, 10], [86, 92, 11], [8, 100, 8]]) { g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill(); }
  const egg = new THREE.Group();
  egg.position.set(x, 0.14, z);
  const shell0 = mesh(new THREE.SphereGeometry(0.22, 32, 24), std({ map: tex(c), roughness: 0.45 }), 0, 0.27, 0, egg);
  shell0.scale.set(1, 1.3, 1);
  B.group.add(egg);
  egg.traverse(o => { o.userData.spot = 0; });
  ring.userData.spot = 0;
  B.blocked.add(key(tx, ty));
  B.anchors[0] = new THREE.Vector3(x, 1.2, z);
  return egg;
}

async function buildDaycare(figs) {
  shell({ floor: careFloor(), wall: careWall(), side: careSide, edge: '#8a6440', cap: '#a07850', under: '#4a3020', bg: '#2a1c12' });
  B.egg = nest(5, 2);
  B.spots = [{ step: { x: 6, y: 3 } }];
  piece('crib', 1, 0); piece('toybox', 9, 0); piece('eggbasket', 3, 0); piece('woolbasket', 7, 0);
  piece('haybale', 0, 3); piece('milkchurn', 0, 2); piece('plant', 10, 3); piece('toytrain', 9, 5, { free: true });
  B.blocked.add(key(9, 5));
  B.who.npc = await figure('npc', figs.npc ?? { npc: 'daycare' }, { x: 5, ty: 1 });
  B.who.left = await figure('left', figs.left ?? { src: 'assets/pokemon/miltank-front.gif', flip: true }, { x: 2, ty: 2 });
  B.who.right = await figure('right', figs.right ?? { src: 'assets/pokemon/marill-front.gif' }, { x: 8, ty: 2 });
  for (const t of [[5, 1], [2, 2], [8, 2]]) B.blocked.add(key(...t));
  const sparks = Array.from({ length: 10 }, (_, i) => sprite(sparkArt(i % 2 ? '#f8e088' : '#ffffff'), 0.2));
  B.acts = {
    trade: { ms: 2250, start() { this.fly = burst(sparks, new THREE.Vector3(tileX(5), 0.5, tileZ(2) + 0.1), { spread: 0.4, rise: 1.1 }); },
      tick(k) {
        const w = k < 0.75 ? Math.sin(k * Math.PI * 10) * 0.25 * Math.sin(k / 0.75 * Math.PI) : 0;
        R.egg.rotation.z = w;
        R.egg.position.y = 0.14 + (k > 0.7 && k < 0.85 ? Math.sin((k - 0.7) / 0.15 * Math.PI) * 0.12 : 0);
        if (k > 0.7) this.fly((k - 0.7) / 0.3);
      }, cues: [[0.05, 'rustle'], [0.4, 'rustle'], [0.72, 'item']] },
  };
}

/* ---------- the Fan Club ---------- */

function fanBands(f, W) {
  const { g, lin } = f;
  for (let x = 0, i = 0; x < W; x += 6, i++) { g.fillStyle = i % 2 ? '#fbe8d8' : '#e8a0a8'; g.fillRect(x, 0, 6, wy(1)); }
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, 0, W, wy(1));
  g.fillStyle = lin(0, wy(3.65), 0, wy(3.45), ['#f8d878', '#b88828']); g.fillRect(0, wy(3.65), W, wy(3.45) - wy(3.65));
  g.fillStyle = lin(0, wy(1.05), 0, wy(0), ['#a82838', '#781828']); g.fillRect(0, wy(1.05), W, wy(0) - wy(1.05));
  g.fillStyle = '#f8d878'; g.fillRect(0, wy(1.05), W, 1);
  g.fillStyle = lin(0, wy(TOP), 0, wy(TOP - 0.35), ['#781828', '#a82838']); g.fillRect(0, wy(TOP), W, 0.35 * U);
  g.fillStyle = '#f8d878'; g.fillRect(0, wy(TOP - 0.35), W, 0.8);
}

function fanWall() {
  const W = (COLS + 0.8) * U, H = TOP * U, f = fine(W, H, 5), { g, rr, lin, shine } = f, s = shine();
  fanBands(f, W);
  // the stage's backdrop: a draped red curtain, FAN CLUB in lights over it
  const x0 = wx(2.9), x1 = wx(7.1), top = wy(4.2);
  g.fillStyle = lin(x0, 0, x1, 0, ['#8a1020', '#c82838', '#8a1020', '#c82838', '#8a1020', '#c82838', '#8a1020']);
  g.fillRect(x0, top, x1 - x0, wy(0.4) - top);
  for (let x = x0; x < x1; x += 5) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, top, 1.2, wy(0.4) - top); }
  for (const [a, b, dir] of [[x0 - 4, x0 + 16, 1], [x1 + 4, x1 - 16, -1]]) {
    g.fillStyle = lin(a, 0, b, 0, ['#c82838', '#e84858']);
    g.beginPath(); g.moveTo(a, top - 2); g.lineTo(b, top - 2); g.quadraticCurveTo(a + (b - a) * 0.25, wy(2.2), a + dir * 2, wy(1.4)); g.lineTo(a, wy(0.4)); g.closePath(); g.fill();
  }
  rr(x0 - 6, top - 6, x1 - x0 + 12, 6, 2, lin(0, top - 6, 0, top, ['#f8d878', '#b88828']));
  const sx = W / 2, sy = wy(4.75);
  rr(sx - 36, sy - 8, 72, 16, 4, '#3a1020');
  words(g, 'FAN CLUB', sx, sy + 0.6, 10, '#ffe88a');
  words(s, 'FAN CLUB', sx, sy + 0.6, 10, '#c0a050');
  for (let i = 0; i < 18; i++) {
    const t = i / 17, x = sx - 34 + t * 68;
    for (const y of [sy - 6.5, sy + 6.5]) { g.fillStyle = '#fff4c8'; g.beginPath(); g.arc(x, y, 0.8, 0, Math.PI * 2); g.fill(); s.fillStyle = '#c0b080'; s.beginPath(); s.arc(x, y, 1.1, 0, Math.PI * 2); s.fill(); }
  }
  // portraits of the club's favourites, and pennants
  portrait(f, wx(0.45), wy(3.0), 18, 22, ['#f8e0a0', '#e8c070'], '#f8f0d8');
  portrait(f, wx(1.6), wy(3.15), 16, 20, ['#c8e0f8', '#98c0e8'], '#d8d0c8');
  portrait(f, wx(8.3), wy(3.15), 16, 20, ['#e0c8f0', '#b898d8'], '#f0e0d0');
  portrait(f, wx(9.4), wy(3.0), 18, 22, ['#c8f0c8', '#98d098'], '#f8e8c0');
  const cols = ['#f8d040', '#58a8f0', '#f05878', '#68c868'];
  for (let i = 0; i < 4; i++) {
    const x = wx(0.4 + i * 0.6 + (i > 1 ? 7.7 : 0)), y = wy(4.0);
    g.fillStyle = cols[i]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 9, y + 2.5); g.lineTo(x, y + 5); g.closePath(); g.fill();
    g.fillStyle = '#6a4428'; g.fillRect(x - 0.6, y - 0.5, 0.8, 6);
  }
  return f.c;
}

function fanSide() {
  const W = ROWS * U, H = TOP * U, f = fine(W, H, 4);
  fanBands(f, W);
  portrait(f, wx(1.6), wy(3.1), 18, 22, ['#f8d0d8', '#e8a8b8'], '#fff4e0');
  portrait(f, wx(4.6), wy(3.1), 18, 22, ['#d0e8f8', '#a8c8e8'], '#f0e8d8');
  return f.c;
}

function fanFloor() {
  const T = 16, W = COLS * T, H = ROWS * T, f = fine(W, H, 5), { g, lin } = f;
  planks(f, W, H, T, ['#c88a52', '#b87a44']);
  g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, W, H);
  // the red carpet from the door up to the stage, gold edged
  const x = 4.6 * T, w = 1.8 * T;
  g.fillStyle = lin(x, 0, x + w, 0, ['#a81828', '#d03040', '#a81828']); g.fillRect(x, 1.6 * T, w, H);
  g.fillStyle = '#f8d878'; g.fillRect(x, 1.6 * T, 1.2, H); g.fillRect(x + w - 1.2, 1.6 * T, 1.2, H);
  return f.c;
}

/** The stage at the back: a raised platform with a red skirt and gold trim, two steps up in the middle. */
function stage() {
  const x = tileX(5), z = BACK_Z + 0.85, w = 4.6, d = 1.7, h = 0.42;
  const wood = std({ color: '#d8a868', roughness: 0.5 }), red = std({ color: '#c02838', roughness: 0.7 }), gold = std({ color: '#f0c048', metalness: 0.6, roughness: 0.3 });
  box(w, h - 0.04, d, [red, red, wood, red, red, red], x, (h - 0.04) / 2, z);
  box(w + 0.08, 0.05, d + 0.04, wood, x, h - 0.02, z);
  box(w + 0.1, 0.05, 0.05, gold, x, h - 0.06, z + d / 2 + 0.03);
  box(w + 0.1, 0.04, 0.05, gold, x, 0.04, z + d / 2 + 0.03);
  for (let i = 0; i < 2; i++) box(1.2, (h * (2 - i)) / 3, 0.22, wood, x, (h * (2 - i)) / 6, z + d / 2 + 0.11 + i * 0.22);
  for (let tx = 3; tx <= 7; tx++) { B.blocked.add(key(tx, 0)); B.blocked.add(key(tx, 1)); }
  return h;
}

/** A spotlight's cone of light from up by the ceiling down onto the stage, see-through. */
function beam(x, z, to) {
  const from = new THREE.Vector3(x, TOP - 0.8, z), dir = to.clone().sub(from), len = dir.length();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, len, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: '#fff4c8', transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  cone.raycast = () => {};
  cone.position.y = -len / 2;   // its point at the lamp
  const g = new THREE.Group();
  g.position.copy(from);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
  g.add(cone);
  B.group.add(g);
  return g;
}

async function buildFans(figs) {
  shell({ floor: fanFloor(), wall: fanWall(), side: fanSide, edge: '#6a2018', cap: '#781828', under: '#2a0c0c', bg: '#1c0a0c' });
  const h = stage();
  piece('micstand', 6, 0, { y: h, dz: 0.45, free: true });
  piece('speakerstack', 2, 0); piece('speakerstack', 8, 0); piece('balloons', 0, 0); piece('trophyshelf', 9, 3, { turn: -Math.PI / 2 });
  piece('balloons', 10, 0); piece('plant', 0, 3);
  const aimAt = new THREE.Vector3(tileX(5), h, BACK_Z + 1.1);
  B.beams = [beam(-3.4, BACK_Z + 2.6, aimAt), beam(3.4, BACK_Z + 2.6, aimAt)];
  B.who.npc = await figure('npc', figs.npc ?? { npc: 'chairman' }, { x: 5, ty: 0, y: h, dz: 0.45 });
  B.who.npc.group.traverse(o => { o.userData.spot = 0; });
  B.who.left = await figure('left', figs.left ?? { src: 'assets/pokemon/persian-front.gif', flip: true }, { x: 3, ty: 3 });
  B.who.right = await figure('right', figs.right ?? { src: 'assets/pokemon/cinccino-front.gif' }, { x: 7, ty: 3 });
  B.blocked.add(key(3, 3)); B.blocked.add(key(7, 3));
  B.anchors[0] = new THREE.Vector3(tileX(5), h + 2.5, BACK_Z + 0.95);
  B.spots = [{ step: { x: 5, y: 2 } }];
  B.ticks.push((now) => { if (!calm) R.beams.forEach((b, i) => { b.children[0].material.opacity = 0.1 + Math.sin(now / 700 + i * 2) * 0.03 + (acting?.name === 'cheer' ? 0.08 : 0); }); });
  const confetti = Array.from({ length: 40 }, (_, i) => {
    const { c, g } = fine(4, 6, 6);
    g.fillStyle = ['#f8d040', '#58a8f0', '#f05878', '#68c868', '#ffffff', '#c878f0'][i % 6]; g.fillRect(0, 0, 4, 6);
    return sprite(c, 0.14);
  });
  const hearts = Array.from({ length: 10 }, (_, i) => sprite(heartArt(i % 2 ? '#f05878' : '#ff90b0'), 0.32));
  B.acts = {
    cheer: { ms: 2250, start() {
      this.rain = burst(confetti, new THREE.Vector3(tileX(5), 4.2, tileZ(1.5)), { spread: 3, rise: 4.4, fall: true, spin: true });
      this.left = burst(hearts.slice(0, 5), new THREE.Vector3(tileX(3), 1.1, tileZ(3)), { spread: 0.3, rise: 1.3 });
      this.right = burst(hearts.slice(5), new THREE.Vector3(tileX(7), 1.1, tileZ(3)), { spread: 0.3, rise: 1.3 });
    }, tick(k) { this.rain(k); this.left(k); this.right(k); }, cues: [[0, 'fw-pop'], [0.15, 'fw-pop'], [0.3, 'stat-up']] },
  };
}

/* ---------- the open-air rooms: the Hot Spring and the Shrine ---------- */

/* A look per biome, after the pixel scenes' (PLACE_ART.spring / .altar in js/scene.js): a sunny garden, misty cedars, a
   cliff of volcanic rock; the newer biomes are one of those three in their own colours. A Safari area is a garden. */
const GARDEN = {
  look: 'garden', sky: ['#68b8f0', '#a0d8f8', '#e0f4f8'], far: ['#b0dcc0', '#98cca8'], leaf: ['#a8e070', '#78c050', '#54a040', '#347a30'],
  trunk: ['#8a5a34', '#5e3a20'], stone: ['#dcdcd2', '#c8c8be', '#b4b4aa', '#9a9a90'], gap: '#7a8a68', moss: '#8ac860',
  bamboo: ['#c8e878', '#90c050', '#5a8a30', '#2a4418'], rock: ['#e4e4dc', '#c4c4bc', '#a0a098', '#787870'],
  water: ['#f0fffc', '#a8f0f0', '#60d0dc', '#3a9ac0', '#246a98'], edge: '#6a5a44', under: '#3a2e22',
  fence: ['#f0c888', '#c08850', '#7a4c28'], roof: ['#b87860', '#8a4c3a', '#5e2e24'], gravel: ['#ece4cc', '#dcd2b6'],
  wood: ['#c89058', '#9a6438', '#6a4024'], drift: ['#f86040', '#f8a040'],
  grass: ['#98d868', '#7ac050', '#5aa040'], dirt: ['#d8b888', '#b89868'],
};
const CEDAR = {
  ...GARDEN, look: 'cedar', sky: ['#6a8cb4', '#9cb8d0', '#dce6e8'], far: ['#7a9a84', '#6a8a74'], leaf: ['#6a9a70', '#4e7e58', '#3a6448', '#284a36'],
  trunk: ['#9a6a50', '#5a362a'], stone: ['#b8c0aa', '#a2ac94', '#909e86', '#7a8870'], gap: '#4e5a48', moss: '#7ab060',
  bamboo: ['#b0a070', '#8a7850', '#5e5034', '#2a2418'], rock: ['#d0d4c0', '#a8ae98', '#7c846e', '#4e5444'],
  water: ['#f0fff8', '#b0f0e0', '#70d0c0', '#3a9aa0', '#20687a'], edge: '#4a4a38', under: '#24241a',
  fence: ['#f87858', '#e04030', '#a82820'], roof: ['#88d0b0', '#4aa080', '#2e7458'], gravel: ['#c8ccb8', '#b4baa4'],
  grass: ['#88b070', '#6a9a58', '#4e7e48'], dirt: ['#b0a080', '#8a7a5c'],
};
const ROCK = {
  ...GARDEN, look: 'rock', sky: ['#3a2a30', '#6a4040', '#b06848'], far: ['#5a4244', '#4a3638'], leaf: null,
  trunk: ['#5a4a46', '#3a2e2c'], stone: ['#6a5a56', '#5e4e4a', '#544440', '#4a3c3a'], gap: '#2a1e1c', moss: null,
  bamboo: ['#9a8a80', '#6a5a54', '#4a3c38', '#1a1012'], rock: ['#8a7068', '#6a5250', '#4e3c3a', '#2e2224'],
  water: ['#ffffff', '#e0f4f0', '#a8dcd8', '#78b8c0', '#4a8898'], edge: '#3a2a28', under: '#1a1012',
  fence: ['#8a7a74', '#6a5a54', '#4a3c38'], roof: ['#8a8a98', '#5e5e6a', '#3e3e48'], gravel: ['#5a4a46', '#4a3c3a'],
  wood: ['#7a6458', '#5a463e', '#3a2a24'], vein: ['#f8b030', '#e05820'], drift: ['#fff0a0', '#f8a830'],
  grass: ['#5e4e4a', '#504240', '#443836'], dirt: ['#6e5e58', '#5a4a44'],
};
const LOOKS = {
  clearing: GARDEN, shrine: CEDAR, wastes: ROCK,
  thornwood: { ...GARDEN, sky: ['#4a8ed0', '#8cc0e4', '#d4ecf0'], far: ['#5a8a5a', '#4a7a4a'], leaf: ['#68b048', '#3e8a34', '#286a2a', '#164a1e'], drift: ['#c8f078', '#78c048'], grass: ['#5aa048', '#3e8a38', '#2a6a2c'], dirt: ['#8a6a48', '#6a5038'] },
  savanna: { ...GARDEN, sky: ['#f0a860', '#f8c888', '#fce8c0'], far: ['#d8b070', '#c89c5c'], leaf: ['#b8b850', '#8a9a3a', '#6a7a2c', '#4a5a20'], stone: ['#e8d0a8', '#dcc298', '#ceb488', '#bca070'], gap: '#9a7a50', moss: '#b8a858', drift: ['#fff0a0', '#f8a830'], grass: ['#e0c878', '#c8b060', '#a89048'], dirt: ['#e8d0a0', '#c8a878'] },
  ruins: { ...CEDAR, stone: ['#d8c8a0', '#c8b890', '#b8a880', '#a09068'], rock: ['#e0d0a8', '#c0b088', '#988860', '#6a5a40'], water: ['#f0fffc', '#a8e8f0', '#58c0d8', '#2888b0', '#145a88'], fence: ['#e8d8b0', '#c0a878', '#8a7450'], roof: ['#e0d0a8', '#b0a078', '#7a6a48'], grass: ['#8ab878', '#6a9a60', '#4a7a4c'], dirt: ['#d8c8a0', '#b8a880'] },
  depths: { ...ROCK, sky: ['#140c24', '#2a1a48', '#4a2a70'], stone: ['#4a4058', '#40384e', '#383046', '#30283c'], gap: '#140c1c', rock: ['#6a5a80', '#4e4064', '#382c4a', '#20182c'], vein: ['#e0a0ff', '#a050f0'], roof: ['#6a5a80', '#4e4064', '#382c4a'], drift: ['#f0d0ff', '#b070f0'], grass: ['#4a4060', '#3e3652', '#322a44'], dirt: ['#5a5070', '#4a4060'] },
};

/** The light outdoors by the time of day ([colour, intensity] for the sky light and the sun); the rock looks keep a dusk. */
const SKY_LIGHT = {
  dawn: { hemi: ['#ffe0d0', '#7a6a70', 1.45], sun: ['#ffc898', 1.9], bg: 0.9 },
  day: { hemi: ['#f0f6ff', '#8a9a70', 1.7], sun: ['#fff4e0', 2.3], bg: 1 },
  dusk: { hemi: ['#ffd0b0', '#6a5060', 1.35], sun: ['#ff9a60', 1.8], bg: 0.8 },
  night: { hemi: ['#8aa0d8', '#303050', 0.95], sun: ['#a8c0ff', 0.7], bg: 0.35 },
};
const INDOORS = { hemi: ['#fff8ec', '#9a7a60', 1.75], sun: ['#fff2dc', 2.1], bloom: 0.75 };
export const TYPE_GLOW = { fire: '#f8a030', water: '#60b0f8', grass: '#80d850', psychic: '#f878c8', normal: '#fff0a0' };

/** Which look a biome's open-air rooms wear (a Safari area's is the garden's). */
export const lookOf = (biome) => LOOKS[biome] || GARDEN;

const graded = (hex, time) => (GRADES[time] ? gradeHex(hex, GRADES[time].sky) : hex);

/** Trees in clumps of leafy circles, lit from the upper left. */
function clump(f, x, y, r, leaf, rnd) {
  const { g } = f;
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * r * 0.55, cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * 0.7, rr = r * (0.45 + rnd() * 0.3);
    g.fillStyle = leaf[2 + (i % 2)]; g.beginPath(); g.arc(cx + 1, cy + 1.2, rr, 0, Math.PI * 2); g.fill();
    g.fillStyle = leaf[1]; g.beginPath(); g.arc(cx, cy, rr * 0.92, 0, Math.PI * 2); g.fill();
    g.fillStyle = leaf[0]; g.beginPath(); g.arc(cx - rr * 0.3, cy - rr * 0.3, rr * 0.5, 0, Math.PI * 2); g.fill();
  }
}

/** A fence along the foot of a painting: bamboo poles bound with rope, or a plank fence on posts (the shrine's). */
function paintFence(f, W, kind, L) {
  const { g, rr, lin } = f, top = wy(1.45), foot = wy(0);
  if (kind === 'none') {   // the wild's edge: a hedge of bushes, or tumbled rocks
    const r = seeded(17);
    for (let x = -6; x < W + 6; x += 7 + r() * 4) {
      if (L.leaf) clump(f, x, wy(0.55 + r() * 0.4), 6 + r() * 3, L.leaf, r);
      else { g.fillStyle = L.rock[1 + Math.floor(r() * 2)]; g.beginPath(); g.ellipse(x, wy(0.4), 6 + r() * 4, 5 + r() * 3, 0, Math.PI, 0); g.lineTo(x + 8, foot); g.lineTo(x - 8, foot); g.fill(); }
    }
    g.fillStyle = L.leaf ? L.leaf[3] : L.rock[3]; g.fillRect(0, foot - 1.5, W, 1.5);
    return;
  }
  if (kind === 'bamboo') {
    const r = seeded(13);
    for (let x = 0; x < W; x += 3.2) {
      const h = top + r() * 2;
      g.fillStyle = lin(x, 0, x + 3, 0, [L.bamboo[1], L.bamboo[0], L.bamboo[2]]); g.fillRect(x, h, 3, foot - h);
      g.fillStyle = L.bamboo[3]; g.fillRect(x, h, 3, 0.8);
      for (let y = h + 6 + r() * 4; y < foot; y += 9) { g.fillStyle = L.bamboo[2]; g.fillRect(x, y, 3, 0.7); g.fillStyle = L.bamboo[0]; g.fillRect(x, y + 0.7, 3, 0.4); }
    }
    for (const y of [top + 6, foot - 8]) {
      g.fillStyle = lin(0, y - 1.4, 0, y + 1.4, [L.bamboo[0], L.bamboo[2]]); g.fillRect(0, y - 1.4, W, 2.8);
      for (let x = 6; x < W; x += U) { g.fillStyle = '#3a2412'; g.fillRect(x, y - 2, 1.6, 4); }
    }
    return;
  }
  const [a, b, c] = L.fence;
  for (const y of [top + 4, foot - 9]) rr(0, y - 1.6, W, 3.2, 0.8, lin(0, y - 1.6, 0, y + 1.6, [a, c]));
  for (let x = 1; x < W; x += 4.2) rr(x, top + 6, 3.2, foot - top - 6, 0.6, lin(x, 0, x + 3.2, 0, [a, b]));
  for (let x = 0; x < W + 1; x += U) { rr(x - 2.2, top - 1, 4.4, foot - top + 1, 0.8, lin(x - 2, 0, x + 2, 0, [b, c])); rr(x - 2.8, top - 2.2, 5.6, 2.2, 0.8, c); }
}

/** The scenery behind a fence, for an open-air room's back wall and sides: the biome's trees, cedars or cliff, then the
    fence; the sky above them is left clear, for skyDome() behind. `bare`: a town's sides, trees only, with no flat band of
    far hills or mist over them (the user's ask, 2026-10-14: "I don't like that wall of green"). */
function scenery(W, L, time, fence, { side = false, bare = false } = {}) {
  const H = TOP * U, f = fine(W, H, side ? 4 : 5), { g, lin } = f, s = f.shine(), r = seeded(side ? 21 : 7);
  if (L.look === 'rock') {
    // a cliff of cut volcanic rock, facets and glowing veins
    g.fillStyle = L.far[0]; g.beginPath(); g.moveTo(0, wy(6.4));
    for (let x = 0; x <= W; x += 14) g.lineTo(x, wy(5.6 + r() * 1.6));
    g.lineTo(W, H); g.lineTo(0, H); g.fill();
    for (let y = wy(5.4); y < wy(1); y += 10) for (let x = (y / 10) % 2 ? -6 : -12; x < W; x += 14 + r() * 8) {
      const w = 14 + r() * 10, h = 10 + r() * 5;
      g.fillStyle = L.rock[1 + Math.floor(r() * 3)];
      g.beginPath(); g.moveTo(x + r() * 3, y); g.lineTo(x + w, y + r() * 3); g.lineTo(x + w - r() * 3, y + h); g.lineTo(x, y + h - r() * 2); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 1, y + 0.5, w * 0.6, 1);
    }
    // glowing seams in the rock, short and branching, not bolts
    for (let i = 0; i < (side ? 4 : 9); i++) {
      let x = r() * W, y = wy(1.6 + r() * 3.6);
      for (const ctx of [g, s]) { ctx.strokeStyle = L.vein[i % 2]; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y); }
      for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 12; y += 1 + r() * 4; g.lineTo(x, y); s.lineTo(x, y); }
      g.stroke(); s.stroke();
    }
  } else {
    // far hills, then trees: round clumps in the garden, cedars in the mist
    if (!bare) {
      g.fillStyle = L.far[0]; g.beginPath(); g.moveTo(0, wy(4.6));
      for (let x = 0; x <= W; x += 10) g.lineTo(x, wy(4.6 + Math.sin(x / 37) * 0.5 + Math.sin(x / 13) * 0.15));
      g.lineTo(W, H); g.lineTo(0, H); g.fill();
    }
    if (L.look === 'cedar') {
      for (let i = 0; i < W / 14; i++) {
        const x = r() * W, foot = wy(1), tall = wy(6.6 + r() * 1.2);
        g.fillStyle = lin(x - 3, 0, x + 3, 0, [L.trunk[0], L.trunk[1]]); g.fillRect(x - 2.6, tall + 10, 5.2, foot - tall);
        for (let k = 0; k < 5; k++) {
          const y = tall + k * 11, w = 7 + k * 3.4;
          g.fillStyle = L.leaf[3 - (k % 2)]; g.beginPath(); g.moveTo(x, y - 3); g.lineTo(x + w, y + 12); g.lineTo(x - w, y + 12); g.closePath(); g.fill();
          g.fillStyle = L.leaf[1]; g.beginPath(); g.moveTo(x - 1, y - 2); g.lineTo(x - w * 0.8, y + 10); g.lineTo(x - w * 0.2, y + 10); g.closePath(); g.fill();
        }
      }
      if (!side) {
        // the sacred cedar, roped with a shimenawa, a little right of the middle
        const x = W * 0.62, top = wy(TOP), foot = wy(1);
        g.fillStyle = lin(x - 10, 0, x + 10, 0, [L.trunk[0], '#b88a68', L.trunk[1]]); g.fillRect(x - 10, top, 20, foot - top);
        g.strokeStyle = 'rgba(40,20,10,0.35)'; g.lineWidth = 0.6;
        for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x - 8 + k * 3.2, top); g.lineTo(x - 8 + k * 3.2 + r() * 2 - 1, foot); g.stroke(); }
        g.strokeStyle = '#e0cc88'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x - 11, wy(3.1)); g.quadraticCurveTo(x, wy(2.8), x + 11, wy(3.1)); g.stroke();
        for (const dx of [-6, 0, 6]) { g.fillStyle = '#ffffff'; g.fillRect(x + dx - 1, wy(2.95), 2, 4); g.fillRect(x + dx, wy(2.95) + 4, 2, 4); }
      }
      if (!bare) for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(232,240,236,0.22)'; g.fillRect(0, wy(2.6 + k * 1.1) + r() * 4, W, 5 + r() * 4); }
    } else {
      for (let i = 0; i < W / 22; i++) {
        const x = i * 22 + r() * 12, y = wy(3.4 + r() * 1.1);
        g.fillStyle = L.trunk[1]; g.fillRect(x - 1.6, y, 3.2, wy(1) - y);
        clump(f, x, y, 13 + r() * 6, L.leaf, r);
      }
      for (let i = 0; i < W / 12; i++) clump(f, i * 12 + r() * 6, wy(1.9), 7 + r() * 3, L.leaf, r);
    }
  }
  paintFence(f, W, fence, L);
  return f.c;
}

/** The sky behind the scenery, by the hour, lighting itself (the scenery's painted sky went grey under the room's light). */
function skyDome(L, time) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 256;
  const g = c.getContext('2d'), sky = L.sky.map(h => graded(h, time)), l = g.createLinearGradient(0, 0, 0, 256);
  sky.forEach((h, i) => l.addColorStop(0.25 + i / (sky.length - 1) * 0.6, h));
  g.fillStyle = l; g.fillRect(0, 0, 64, 256);
  if (time === 'night') { const r = seeded(19); g.fillStyle = '#ffffff'; for (let i = 0; i < 40; i++) g.fillRect(r() * 64, r() * 170, r() < 0.2 ? 1 : 0.6, 1); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(70, 36), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, fog: false }));
  m.position.set(0, 8, BACK_Z - 10);
  m.raycast = () => {};
  B.group.add(m);
}

/** Flagstones over the ground, moss or gravel between, a path of bigger stones from the door if `path`. */
function yardFloor(L, { path = false, gravel = false, cracks = false } = {}) {
  const T = 16, W = COLS * T, H = ROWS * T, f = fine(W, H, 5), { g, lin } = f, r = seeded(41);
  const s = cracks ? f.shine() : null;
  g.fillStyle = gravel ? L.gravel[0] : L.gap; g.fillRect(0, 0, W, H);
  if (gravel) {
    for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? L.gravel[1] : 'rgba(255,255,255,0.35)'; g.fillRect(r() * W, r() * H, 0.6, 0.6); }
    g.strokeStyle = L.gravel[1]; g.lineWidth = 0.35;   // raked
    for (let y = 2; y < H; y += 2.2) { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin(x / 9) * 0.4); g.stroke(); }
  } else {
    for (let y = 0; y < H; y += 7) for (let x = -(r() * 6); x < W; x += 8 + r() * 4) {
      const w = 6 + r() * 5, h = 5 + r() * 2;
      g.fillStyle = L.stone[Math.floor(r() * 4)];
      g.beginPath(); g.roundRect(x + 0.6, y + 0.6, w, h, 1.6); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 1.4, y + 1, w * 0.6, 0.6);
    }
    if (L.moss) for (let i = 0; i < 260; i++) { g.fillStyle = L.moss; g.globalAlpha = 0.5; g.beginPath(); g.arc(r() * W, r() * H, 0.5 + r(), 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
  }
  if (path) {
    for (let y = H - 6; y > 2 * T; y -= 9) {
      const x = 5.5 * T + (r() - 0.5) * 2, w = 1.5 * T + r() * 3;
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.roundRect(x - w / 2 + 0.6, y - 3.4, w, 8, 2); g.fill();
      g.fillStyle = lin(0, y - 4, 0, y + 4, [L.stone[0], L.stone[2]]); g.beginPath(); g.roundRect(x - w / 2, y - 4, w, 8, 2); g.fill();
    }
  }
  if (cracks) for (let i = 0; i < 9; i++) {
    let x = r() * W, y = r() * H;
    for (const ctx of [g, s]) { ctx.strokeStyle = L.vein[i % 2]; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y); }
    for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 9; y += (r() - 0.5) * 9; g.lineTo(x, y); s.lineTo(x, y); }
    g.stroke(); s.stroke();
  }
  return f.c;
}

/** An open-air room's shell: the yard's floor, the scenery all round, the light by the hour. */
function yard(L, time, floor, fence) {
  const sky = graded(L.sky[0], time);
  shell({ floor, wall: scenery((COLS + 0.8) * U, L, time, fence), side: () => scenery(ROWS * U, L, time, fence, { side: true }), edge: L.edge, cap: sky, under: L.under, bg: sky, open: true });
  skyDome(L, time);
  const light = SKY_LIGHT[L.look === 'rock' && time === 'day' ? 'dusk' : time];
  B.env = { hemi: light.hemi, sun: light.sun, bloom: 0.3 };
  B.drift = L.drift;
}

/** A rough boulder: a lumpy, flat-shaded icosahedron. */
function boulder(x, z, size, cols, rnd, { squash = 0.6, y = 0 } = {}) {
  const geo = new THREE.IcosahedronGeometry(1, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.82 + rnd() * 0.3; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const m = mesh(geo, std({ color: cols[Math.floor(rnd() * cols.length)], roughness: 0.95, flatShading: true }), x, y + size * squash * 0.55, z);
  m.scale.set(size, size * squash, size * (0.8 + rnd() * 0.3));
  m.rotation.y = rnd() * Math.PI;
  return m;
}

/** The water in a pool: ripples on a teal ground, tiled, slid along every frame. */
function waterTex(W) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d'), r = seeded(77);
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 180);
  grd.addColorStop(0, W[2]); grd.addColorStop(1, W[3]);
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = W[1]; g.lineCap = 'round';
  for (let i = 0; i < 60; i++) {
    const x = r() * 256, y = r() * 256, l = 10 + r() * 26;
    g.globalAlpha = 0.25 + r() * 0.4; g.lineWidth = 1 + r() * 2;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 4, x + l, y); g.stroke();
    g.beginPath(); g.moveTo(x + 256, y); g.quadraticCurveTo(x + 256 + l / 2, y - 4, x + 256 + l, y); g.stroke();
    g.beginPath(); g.moveTo(x - 256, y); g.quadraticCurveTo(x - 256 + l / 2, y - 4, x - 256 + l, y); g.stroke();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A rock-ringed pool, an ellipse `rx` x `rz` tiles round (`cx`, `cz`): its basin, steaming water and its ring of stones. */
function pool(cx, cz, rx, rz, L, seed) {
  const rnd = seeded(seed), W = L.water;
  const basin = mesh(new THREE.CircleGeometry(1, 48), std({ color: W[4], roughness: 1 }), cx, 0.012, cz);
  basin.rotation.x = -Math.PI / 2; basin.scale.set(rx, rz, 1);
  const map = waterTex(W);
  map.repeat.set(rx * 0.7, rz * 0.7);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 48), std({ map, color: '#ffffff', transparent: true, opacity: 0.86, roughness: 0.12, metalness: 0.15, emissive: new THREE.Color(W[2]), emissiveIntensity: 0.18 }));
  water.rotation.x = -Math.PI / 2; water.scale.set(rx, rz, 1);
  water.position.set(cx, 0.17, cz);
  water.receiveShadow = true;
  B.group.add(water);
  const n = Math.round((rx + rz) * 6.5);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + rnd() * 0.1;
    boulder(cx + Math.cos(a) * (rx + 0.08), cz + Math.sin(a) * (rz + 0.08), 0.22 + rnd() * 0.14, L.rock, rnd);
  }
  for (let x = Math.floor(cx - rx + COLS / 2); x <= Math.floor(cx + rx + COLS / 2 - 0.01); x++)
    for (let y = Math.floor(cz - rz + ROWS / 2); y <= Math.floor(cz + rz + ROWS / 2 - 0.01); y++) B.blocked.add(key(x, y));
  B.ticks.push((now) => { if (!calm) map.offset.set(now / 60000, Math.sin(now / 3000) * 0.02); });
  return { water, map, cx, cz, rx, rz };
}

/** Soft white puffs rising off the water all the time, thicker while someone soaks. */
function steam(p, n, { thick = () => 0 } = {}) {
  const { c, g } = fine(16, 16, 8), grd = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  grd.addColorStop(0, 'rgba(255,255,255,0.9)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 16, 16);
  const puffs = Array.from({ length: n }, (_, i) => ({ s: sprite(c, 1), a: i / n * Math.PI * 2, d: Math.sqrt((i * 0.618) % 1), phase: i / n }));
  B.ticks.push((now) => {
    const more = thick();
    for (const q of puffs) {
      const t = calm ? 0.5 : (now / 5200 + q.phase) % 1;
      q.s.visible = true;
      q.s.position.set(p.cx + Math.cos(q.a) * q.d * p.rx * 0.8 + Math.sin(t * 5 + q.a) * 0.12, 0.25 + t * (1.6 + more * 1.2), p.cz + Math.sin(q.a) * q.d * p.rz * 0.8);
      q.s.scale.setScalar(0.5 + t * (1 + more * 1.4));
      q.s.material.opacity = Math.sin(t * Math.PI) * (0.2 + more * 0.45);
    }
  });
}

/** The rubber duck: a yellow body, a head and an orange beak, bobbing round the big pool. */
function duck(p) {
  const yellow = std({ color: '#f8e048', roughness: 0.35 }), orange = std({ color: '#f89830', roughness: 0.4 }), black = std({ color: '#1a1a1a', roughness: 0.3 });
  const d = new THREE.Group();
  mesh(new THREE.SphereGeometry(0.15, 20, 14), yellow, 0, 0.06, 0, d).scale.set(1, 0.72, 1.25);
  mesh(new THREE.SphereGeometry(0.1, 18, 12), yellow, 0, 0.2, 0.11, d);
  mesh(new THREE.ConeGeometry(0.045, 0.1, 12), orange, 0, 0.19, 0.23, d).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.016, 8, 6), black, s * 0.055, 0.24, 0.18, d);
  mesh(new THREE.ConeGeometry(0.06, 0.1, 10), yellow, 0, 0.12, -0.18, d).rotation.x = -Math.PI / 3;
  d.traverse(o => { o.raycast = () => {}; });
  B.group.add(d);
  B.ticks.push((now) => {
    const a = calm ? 1 : now / 9000 * Math.PI * 2;
    d.position.set(p.cx + Math.cos(a) * p.rx * 0.55, 0.15 + (calm ? 0 : Math.sin(now / 520) * 0.025), p.cz + Math.sin(a) * p.rz * 0.5);
    d.rotation.y = -a;
    d.rotation.z = calm ? 0 : Math.sin(now / 700) * 0.1;
  });
}

/** Rings spreading on a pool's water and fading: `from` the time they start (ms), `at` where. */
function ripples(n, col) {
  return Array.from({ length: n }, () => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.raycast = () => {};
    B.group.add(m);
    return m;
  });
}
const ringAt = (m, x, y, z, t, size) => { m.position.set(x, y, z); m.scale.setScalar(0.05 + t * size); m.material.opacity = t > 0 && t < 1 ? (1 - t) * 0.7 : 0; };

/** The bamboo spout over the little pool: a post, a pipe angled down and the stream pouring out of it. */
function spout(p, L) {
  const green = std({ color: L.bamboo[1], roughness: 0.6 }), node = std({ color: L.bamboo[2], roughness: 0.6 });
  const px = p.cx + p.rx + 0.35, pz = p.cz - 0.2;
  mesh(new THREE.CylinderGeometry(0.075, 0.08, 1.5, 14), green, px, 0.75, pz);
  for (const y of [0.4, 0.9, 1.3]) mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 14), node, px, y, pz);
  const pipe = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.95, 14), green, px - 0.42, 1.28, pz);
  pipe.rotation.z = Math.PI / 2 - 0.25;
  const mouth = new THREE.Vector3(px - 0.86, 1.16, pz);
  const flow = waterTex(['#ffffff', '#ffffff', '#c8f4f8', '#90e0f0', '#70d0e8']);
  flow.repeat.set(1, 2);
  const stream = mesh(new THREE.CylinderGeometry(0.035, 0.05, mouth.y - 0.17, 10, 1, true), new THREE.MeshBasicMaterial({ map: flow, transparent: true, opacity: 0.75, depthWrite: false }), mouth.x, (mouth.y + 0.17) / 2, mouth.z);
  stream.castShadow = false; stream.raycast = () => {};
  const rings = ripples(2, '#ffffff');
  B.ticks.push((now) => {
    if (!calm) flow.offset.y = now / 400;
    rings.forEach((m, i) => ringAt(m, mouth.x, 0.18, mouth.z, calm ? 0.5 : (now / 1100 + i / 2) % 1, 0.45));
  });
  B.blocked.add(key(Math.floor(px + COLS / 2), Math.floor(pz + ROWS / 2)));
}

/** A painted board on two posts (the ♨ sign). */
function signboard(art, x, z, w, h, post = 1.25) {
  const wood = std({ color: '#6a4428', roughness: 0.8 });
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.04, 0.045, post + h / 2, 8), wood, x + s * (w / 2 - 0.08), (post + h / 2) / 2, z);
  return panel(art, w, h, x, post, z + 0.05);
}

function onsenArt() {
  const f = fine(40, 22, 8), { g, rr, lin } = f;
  rr(0, 0, 40, 22, 2, '#5a3418');
  rr(1.6, 1.6, 36.8, 18.8, 1.4, lin(0, 0, 0, 22, ['#fff8e4', '#f0e2c0']));
  // ♨: a bowl and three wavy plumes of steam
  g.strokeStyle = '#e03828'; g.lineWidth = 2.2; g.lineCap = 'round';
  g.beginPath(); g.ellipse(20, 14.5, 8, 3.2, 0, 0, Math.PI); g.stroke();
  g.beginPath(); g.moveTo(12, 14.5); g.lineTo(28, 14.5); g.stroke();
  for (const dx of [-5, 0, 5]) { g.beginPath(); g.moveTo(20 + dx, 12); g.bezierCurveTo(20 + dx - 2.4, 9.5, 20 + dx + 2.4, 7.5, 20 + dx, 4.5); g.stroke(); }
  return f.c;
}

/** A tree of the look's, modelled: a round leafy one in the garden, a cedar in the mist, a dead one among the rocks;
    blocking its tile. */
function tree(L, tx, ty, rnd, tall = 1) {
  const x = tileX(tx), z = tileZ(ty), bark = std({ color: L.trunk[0], roughness: 0.95 });
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  B.group.add(g);
  if (L.look === 'rock') {
    // bare and twisted, its branches forking off
    const limb = (from, len, r, ang, tilt, depth) => {
      const dir = new THREE.Vector3(Math.sin(tilt) * Math.cos(ang), Math.cos(tilt), Math.sin(tilt) * Math.sin(ang)), to = from.clone().addScaledVector(dir, len);
      const m = mesh(new THREE.CylinderGeometry(r * 0.65, r, len, 8), bark, (from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2, g);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      if (depth) for (let i = 0; i < 2; i++) limb(to, len * 0.68, r * 0.62, ang + (i ? 1 : -1) * (0.6 + rnd()), tilt + 0.35 + rnd() * 0.3, depth - 1);
    };
    limb(new THREE.Vector3(0, 0, 0), 1.2 * tall, 0.13, rnd() * 6, 0.08, 3);
  } else if (L.look === 'cedar') {
    mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.4 * tall, 10), bark, 0, 0.7 * tall, 0, g);
    for (let i = 0; i < 4; i++) {
      const r = 0.85 - i * 0.17, y = (0.9 + i * 0.55) * tall;
      mesh(new THREE.ConeGeometry(r, 0.95, 9), std({ color: L.leaf[i % 2 ? 1 : 2], roughness: 0.9, flatShading: true }), 0, y, 0, g).rotation.y = rnd() * 3;
    }
  } else {
    mesh(new THREE.CylinderGeometry(0.08, 0.13, 1.3 * tall, 10), bark, 0, 0.65 * tall, 0, g);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + rnd(), d = i ? 0.35 : 0, r = 0.42 + rnd() * 0.2;
      const geo = new THREE.IcosahedronGeometry(r, 1);
      const m = mesh(geo, std({ color: L.leaf[1 + Math.floor(rnd() * 3)], roughness: 0.9, flatShading: true }), Math.cos(a) * d, (1.45 + (i ? rnd() * 0.3 : 0.45)) * tall, Math.sin(a) * d * 0.8, g);
      m.rotation.set(rnd() * 3, rnd() * 3, 0);
    }
  }
  B.blocked.add(key(tx, ty));
  return g;
}

/** Things standing round a yard: the look's trees in the corners. */
function dressYard(L, places) {
  const rnd = seeded(61);
  places.forEach(([tx, ty, tall]) => tree(L, tx, ty, rnd, tall));
}

async function buildSpring(figs, { look: L, time }) {
  yard(L, time, yardFloor(L), 'bamboo');
  B.shotTop = 3.0;
  const big = pool(tileX(3.6), tileZ(3.3), 1.8, 1.45, L, 3);
  const small = pool(tileX(7.2), tileZ(3.8), 0.78, 0.7, L, 8);
  spout(small, L);
  duck(big);
  let soaking = 0;
  steam(big, 12, { thick: () => soaking });
  steam(small, 5);
  signboard(onsenArt(), tileX(5.5), BACK_Z + 0.35, 1.3, 0.72);
  B.blocked.add(key(5, 0));
  for (const [id, tx, ty, o] of [['stonelantern', 1, 1, { scale: 1.3 }], ['stonelantern', 9, 2, { scale: 1.2 }], ['okebucket', 9, 5], ['bathstool', 9, 4], ['towelbasket', 1, 6], [L.look === 'rock' ? 'steamrocks' : 'mossrock', 0, 4]]) piece(id, tx, ty, o);
  dressYard(L, [[0, 0, 1.3], [3, 0, 1.15], [8, 0, 1.25], [10, 1, 1.4], [0, 2, 1]]);
  B.spots = [{ step: { x: 4, y: 6 } }, { step: { x: 7, y: 6 } }];
  B.anchors[0] = new THREE.Vector3(big.cx, 1.75, big.cz - 0.4);
  B.anchors[1] = new THREE.Vector3(small.cx, 1.55, small.cz - 0.2);
  for (const o of [big.water, small.water]) o.userData.spot = o === big.water ? 0 : 1;
  const rings = ripples(3, '#ffffff');
  const sparks = Array.from({ length: 10 }, (_, i) => sprite(sparkArt(i % 2 ? '#a8f0f0' : '#ffffff'), 0.2));
  const hop = (k, a, b, h) => ({ x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, y: Math.sin(k * Math.PI) * h });
  B.acts = {
    soak: { ms: 3000, start() { this.from = { x: walker.x, z: walker.z }; this.to = { x: big.cx + 0.3, z: big.cz + 0.35 }; },
      tick(k) {
        soaking = Math.sin(Math.min(1, k * 1.4) * Math.PI);
        let at;
        if (k < 0.22) { at = hop(k / 0.22, this.from, this.to, 0.6); at.y -= ease(k / 0.22) * 0.38; }
        else if (k < 0.78) at = { ...this.to, y: -0.38 + Math.sin((k - 0.22) * 14) * 0.02 };
        else { at = hop((k - 0.78) / 0.22, this.to, this.from, 0.6); at.y += -0.38 * (1 - ease((k - 0.78) / 0.22)); }
        if (k >= 1) at = { ...this.from, y: 0 };
        walker.ox = at.x - walker.x; walker.oz = at.z - walker.z; walker.oy = at.y;
        rings.forEach((m, i) => ringAt(m, this.to.x, 0.18, this.to.z, (k - 0.2 - i * 0.08) / 0.4, 1.2));
      }, cues: [[0.2, 'splash'], [0.3, 'fx-steam'], [0.8, 'splash']] },
    dip: { ms: 1700, start() { this.fly = burst(sparks, new THREE.Vector3(small.cx, 0.3, small.cz), { spread: 0.35, rise: 1 }); },
      tick(k) {
        walker.lunge = Math.sin(Math.min(1, k / 0.5) * Math.PI) * 0.4;
        rings.forEach((m, i) => ringAt(m, small.cx, 0.18, small.cz + 0.1, (k - 0.2 - i * 0.12) / 0.6, 0.85));
        if (k > 0.3) this.fly((k - 0.3) / 0.7);
      }, cues: [[0.22, 'splash']] },
  };
}

/* ---------- the Shrine ---------- */

/** The hall's front: lattice doors over a lit inside, glowing in your type's colour. */
function latticeArt(glow) {
  const f = fine(60, 34, 6), { g, rr, lin } = f, s = f.shine();
  g.fillStyle = '#1a0e0a'; g.fillRect(0, 0, 60, 34);
  for (const ctx of [g, s]) {
    const r = ctx.createRadialGradient(30, 20, 2, 30, 20, 26);
    r.addColorStop(0, '#ffffff'); r.addColorStop(0.35, glow); r.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = r; ctx.fillRect(14, 3, 32, 31);
  }
  for (const x0 of [14, 30]) {
    g.strokeStyle = '#5a2e1a'; g.lineWidth = 1;
    for (let x = x0; x <= x0 + 16; x += 2.7) { g.beginPath(); g.moveTo(x, 3); g.lineTo(x, 34); g.stroke(); }
    for (let y = 3; y <= 34; y += 2.7) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + 16, y); g.stroke(); }
    s.strokeStyle = '#000'; s.lineWidth = 1;
    for (let x = x0; x <= x0 + 16; x += 2.7) { s.beginPath(); s.moveTo(x, 3); s.lineTo(x, 34); s.stroke(); }
    for (let y = 3; y <= 34; y += 2.7) { s.beginPath(); s.moveTo(x0, y); s.lineTo(x0 + 16, y); s.stroke(); }
  }
  for (const x of [0, 12, 46]) rr(x, 0, 14, 34, 0.4, lin(x, 0, x + 14, 0, ['#8a5a34', '#6a4024', '#8a5a34']));
  g.fillStyle = '#3a2010'; g.fillRect(0, 0, 60, 3); g.fillRect(29.4, 3, 1.2, 31);
  return f.c;
}

/** Paper zigzags (shide) hung off the straw rope. */
function shideArt() {
  const f = fine(8, 16, 10), { g } = f;
  g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(1, 0); g.lineTo(5, 0); g.lineTo(5, 4); g.lineTo(7, 4); g.lineTo(7, 9); g.lineTo(3, 9); g.lineTo(3, 12); g.lineTo(5, 12); g.lineTo(5, 16); g.lineTo(1, 16); g.lineTo(1, 12); g.lineTo(3, 12); g.lineTo(3, 9); g.lineTo(3, 4); g.lineTo(1, 4); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(1, 4, 6, 1); g.fillRect(1, 12, 4, 1);
  return f.c;
}

/** The bell's cord: red and white, braided. */
function cordArt() {
  const f = fine(8, 64, 6), { g } = f;
  for (let y = -8; y < 64; y += 5) {
    g.fillStyle = '#e83828'; g.beginPath(); g.moveTo(0, y); g.lineTo(8, y + 4); g.lineTo(8, y + 6.5); g.lineTo(0, y + 2.5); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, y + 2.5); g.lineTo(8, y + 6.5); g.lineTo(8, y + 9); g.lineTo(0, y + 5); g.fill();
  }
  return f.c;
}

/** Roof tiles in rows, `cols` [light, mid, dark], repeated `u` x `v` times. */
function roofTiles(cols, u, v) {
  const tiles = document.createElement('canvas');
  tiles.width = tiles.height = 64;
  const tg = tiles.getContext('2d');
  tg.fillStyle = cols[1]; tg.fillRect(0, 0, 64, 64);
  for (let x = 0; x < 64; x += 8) { tg.fillStyle = cols[0]; tg.fillRect(x + 1, 0, 3, 64); tg.fillStyle = cols[2]; tg.fillRect(x + 6, 0, 2, 64); }
  for (let y = 0; y < 64; y += 16) { tg.fillStyle = 'rgba(0,0,0,0.25)'; tg.fillRect(0, y, 64, 1.5); }
  const map = new THREE.CanvasTexture(tiles);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.repeat.set(u, v);
  return map;
}

/** The roof's curve, front eave to ridge to back eave, `t` thick: eaves swept up at the tips, a sag in the slopes. */
function roofShape(half, rise, t) {
  const s = new THREE.Shape();
  s.moveTo(-half, 0.08);
  s.quadraticCurveTo(-half * 0.45, rise * 0.32, 0, rise);
  s.quadraticCurveTo(half * 0.45, rise * 0.32, half, 0.08);
  s.lineTo(half - 0.05, -t + 0.04);
  s.quadraticCurveTo(half * 0.45, rise * 0.32 - t, 0, rise - t);
  s.quadraticCurveTo(-half * 0.45, rise * 0.32 - t, -half + 0.05, -t + 0.04);
  s.closePath();
  return s;
}

/** The Ilex Forest shrine, after the pixel room's: stone steps, a wooden hall with lattice doors, a flared roof with
    crossed chigi, a straw rope with paper zigzags, the bell and its cord, an offering box. Glows in `glow`. */
function shrineModel(L, glow) {
  const g = new THREE.Group(), cx = tileX(5), cz = BACK_Z + 1.25;
  g.position.set(cx, 0, cz);
  B.group.add(g);
  const add = (geo, m, x, y, z) => mesh(geo, m, x, y, z, g);
  const stone = std({ color: L.rock[1], roughness: 0.95 }), stoneTop = std({ color: L.rock[0], roughness: 0.9 });
  const wood = std({ color: L.wood[0], roughness: 0.7 }), dark = std({ color: L.wood[2], roughness: 0.75 }), mid = std({ color: L.wood[1], roughness: 0.7 });
  // the stone base, two tiers, and steps up the middle
  add(new THREE.BoxGeometry(4.6, 0.3, 2.5), [stone, stone, stoneTop, stone, stone, stone], 0, 0.15, 0);
  add(new THREE.BoxGeometry(3.9, 0.28, 2.05), [stone, stone, stoneTop, stone, stone, stone], 0, 0.44, -0.12);
  for (let i = 0; i < 2; i++) add(new THREE.BoxGeometry(1.5, 0.29 - i * 0.01, 0.26), [stone, stone, stoneTop, stone, stone, stone], 0, 0.15 + (i + 1) * 0.14, 1.03 - i * 0.24);
  // the hall
  const base = 0.58, hgt = 1.55, w = 3.0, d = 1.55, zc = -0.35;
  const art = latticeArt(glow), front = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.9, roughness: 0.8 });
  add(new THREE.BoxGeometry(w, hgt, d), [mid, mid, dark, dark, front, mid], 0, base + hgt / 2, zc);
  add(new THREE.BoxGeometry(w + 0.5, 0.07, d + 0.55), wood, 0, base + 0.035, zc + 0.12);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(0.085, 0.09, hgt + 0.02, 12), dark, sx * (w / 2 + 0.05), base + hgt / 2, zc + sz * (d / 2 + 0.05));
  add(new THREE.BoxGeometry(w + 0.4, 0.16, 0.16), dark, 0, base + hgt - 0.02, zc + d / 2 + 0.06);
  // the roof: two sweeping slopes, a ridge, crossed chigi at each gable and katsuogi along the ridge
  const roofMat = std({ map: roofTiles(L.roof, 1.6, 1.6), roughness: 0.6 }), eave = std({ color: L.roof[2], roughness: 0.7 });
  const geo = new THREE.ExtrudeGeometry(roofShape(1.55, 1.0, 0.13), { depth: w + 1.1, bevelEnabled: false, curveSegments: 16 });
  geo.rotateY(Math.PI / 2); geo.translate(-(w + 1.1) / 2, 0, 0);
  add(geo, [roofMat, eave], 0, base + hgt + 0.02, zc);
  const top = base + hgt + 0.02 + 1.0;
  add(new THREE.BoxGeometry(w + 1.2, 0.14, 0.2), std({ color: L.roof[2], roughness: 0.6 }), 0, top + 0.02, zc);
  for (const sx of [-1, 1]) for (const tilt of [-0.62, 0.62]) {
    const c = add(new THREE.BoxGeometry(0.07, 0.95, 0.09), dark, sx * (w / 2 + 0.56), top - 0.05, zc);
    c.rotation.x = tilt;
  }
  for (const x of [-0.9, 0, 0.9]) { const k = add(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12), mid, x, top + 0.15, zc); k.rotation.x = Math.PI / 2; }
  // the straw rope under the eaves, paper zigzags off it
  const ropeZ = zc + d / 2 + 0.2, ropeY = base + hgt - 0.12;
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.45, ropeY, ropeZ), new THREE.Vector3(-0.7, ropeY - 0.2, ropeZ + 0.02), new THREE.Vector3(0, ropeY - 0.26, ropeZ + 0.03), new THREE.Vector3(0.7, ropeY - 0.2, ropeZ + 0.02), new THREE.Vector3(1.45, ropeY, ropeZ)]);
  add(new THREE.TubeGeometry(curve, 40, 0.075, 10, false), std({ color: '#e0cc88', roughness: 1 }), 0, 0, 0);
  const shide = std({ map: texOf(shideArt()), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 });
  for (const t of [0.18, 0.4, 0.6, 0.82]) {
    const p = curve.getPoint(t), m = add(new THREE.PlaneGeometry(0.16, 0.32), shide, p.x, p.y - 0.22, p.z + 0.03);
    m.castShadow = false;
  }
  // the bell, hung from the rope's middle, its red-and-white cord down to where you can ring it
  const bell = new THREE.Group();
  bell.position.set(0, ropeY - 0.24, ropeZ + 0.08);
  g.add(bell);
  const gold = std({ color: '#f0c040', metalness: 0.75, roughness: 0.28 });
  const pts = [[0, -0.2], [0.1, -0.19], [0.17, -0.12], [0.19, -0.04], [0.15, 0.06], [0.08, 0.12], [0.02, 0.14], [0, 0.14]].map(([x, y]) => new THREE.Vector2(x, y));
  mesh(new THREE.LatheGeometry(pts, 24), gold, 0, -0.22, 0, bell);
  mesh(new THREE.BoxGeometry(0.26, 0.015, 0.02), std({ color: '#3a2008' }), 0, -0.34, 0.15, bell);
  const cord = mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 10), std({ map: texOf(cordArt()), roughness: 0.9 }), 0, -0.93, 0.02, bell);
  mesh(new THREE.SphereGeometry(0.05, 12, 8), std({ color: '#e83828' }), 0, -1.45, 0.02, bell);
  void cord;
  // the offering box before the steps
  const box0 = add(new THREE.BoxGeometry(0.85, 0.42, 0.45), wood, 0, 0.21, 1.55);
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.8, 0.025, 0.05), dark, 0, 0.43, 1.38 + i * 0.075);
  add(new THREE.BoxGeometry(0.9, 0.05, 0.5), dark, 0, 0.02, 1.55);
  void box0;
  // the light inside, in your type's colour
  const lamp = new THREE.PointLight(glow, 2.2, 6, 1.6);
  lamp.position.set(0, base + 0.8, zc + d / 2 + 0.6);
  g.add(lamp);
  g.traverse(o => { if (o.isMesh) o.userData.spot = 0; });
  for (let x = 3; x <= 7; x++) for (let y = 0; y <= 2; y++) B.blocked.add(key(x, y));
  return { group: g, bell, front, lamp, door: new THREE.Vector3(cx, base + 0.75, cz + zc + d / 2 + 0.02), roof: new THREE.Vector3(cx, top + 0.3, cz + zc) };
}

async function buildAltar(figs, { look: L, time, type }) {
  const glow = TYPE_GLOW[type] || TYPE_GLOW.normal;
  yard(L, time, yardFloor(L, { path: true, gravel: L.look === 'garden', cracks: L.look === 'rock' }), 'planks');
  B.shotTop = 3.9;
  const s = shrineModel(L, glow);
  B.shrine = s;
  // big stone lanterns either side, lit in your type's colour
  const lit = [];
  for (const tx of [2, 8]) {
    const m = piece('stonelantern', tx, 3, { scale: 1.45 });
    m?.traverse(o => { if (o.material?.emissiveMap) { o.material.emissive = new THREE.Color(glow); lit.push(o.material); } });
  }
  dressYard(L, [[1, 0, 1.5], [9, 0, 1.6], [0, 2, 1.2], [10, 3, 1.3], [0, 5, 1], [10, 6, 1.1]]);
  B.spots = [{ step: { x: 5, y: 3 } }];
  B.anchors[0] = new THREE.Vector3(s.roof.x, s.roof.y + 0.55, s.roof.z + 0.6);
  const motes = Array.from({ length: 14 }, (_, i) => sprite(sparkArt(i % 2 ? '#f05878' : '#ffd0d8'), 0.22));
  const rise = sprite(sparkArt(glow), 0.6);
  const r = seeded(5), arcs = motes.map(() => ({ delay: r() * 0.3, side: (r() - 0.5) * 1.6, up: 0.4 + r() * 0.8 }));
  B.ticks.push((now) => {
    if (acting?.name === 'pray') return;
    const k = calm ? 0 : Math.sin(now / 1400) * 0.15;
    s.lamp.intensity = 2.2 + k * 2;
    s.front.emissiveIntensity = 0.9 + k;
    s.bell.rotation.x = calm ? 0 : Math.sin(now / 1900) * 0.02;
  });
  B.acts = {
    pray: { ms: 2600, start() { this.from = new THREE.Vector3(walker.x, 0.6, walker.z); },
      tick(k) {
        // the bell rung, the HP drawn in as red motes, the shrine flaring, then a spark rising out of it
        s.bell.rotation.x = Math.sin(Math.min(1, k / 0.3) * Math.PI * 4) * 0.35 * (1 - Math.min(1, k / 0.3));
        motes.forEach((m, i) => {
          const a = arcs[i], t = Math.max(0, Math.min(1, (k - 0.1 - a.delay) / 0.35));
          m.visible = t > 0 && t < 1;
          if (!m.visible) return;
          const p = this.from.clone().lerp(s.door, ease(t));
          p.x += Math.sin(t * Math.PI) * a.side; p.y += Math.sin(t * Math.PI) * a.up;
          m.position.copy(p);
          m.material.opacity = t < 0.2 ? t / 0.2 : 1;
        });
        const flare = Math.max(0, Math.sin(Math.max(0, Math.min(1, (k - 0.5) / 0.4)) * Math.PI));
        s.lamp.intensity = 2.2 + flare * 9;
        s.front.emissiveIntensity = 0.9 + flare * 2.5;
        for (const m of lit) m.emissiveIntensity = 0.8 + flare * 2;
        post.final.uniforms.uBloom.value = R.env.bloom + flare * 0.7;
        const u = Math.max(0, (k - 0.62) / 0.38);
        rise.visible = u > 0 && u < 1;
        rise.position.set(s.door.x, s.door.y + ease(u) * 2.1, s.door.z + 0.7);
        rise.material.opacity = Math.min(1, u * 5) * (1 - Math.max(0, u - 0.7) / 0.3);
        rise.material.rotation = u * 6;
        rise.scale.setScalar(0.4 + Math.sin(u * Math.PI) * 0.35);
      }, cues: [[0, 'bell'], [0.15, 'spirit'], [0.55, 'stat-up']] },
  };
}

/* ---------- the treasure grotto ---------- */

/* Its look per biome, after the pixel grotto's (PLACE_ART.treasure in js/scene.js): the rock, the crystals, what else
   grows or glows there, and the ball its chest is made like (`lid`, `marks`). */
const CAVE = {
  clearing: { rock: ['#7a8a92', '#627078', '#4c5860', '#3a444c', '#262e36'], crystal: ['#f0ffff', '#a0e4f8', '#50a8e0', '#2c64a0'], ground: ['#58646a', '#4e5a60', '#465056', '#3e474d'], stone: ['#c8ccc4', '#a4aaa2', '#7c827c', '#565c58'], beam: '#fff4c0', moss: ['#8ac860', '#5a9a44', '#3a6e30'], lid: ['#ff8070', '#e83830', '#b82020'], marks: 'poke' },
  shrine: { rock: ['#8a8898', '#6c6a7c', '#545264', '#403e50', '#2a2838'], crystal: ['#fff4fa', '#f8b8d8', '#d86aa0', '#8a3868'], ground: ['#5c5a6a', '#524f60', '#484656', '#403e4c'], stone: ['#d0ccc0', '#aca698', '#848070', '#5c584c'], beam: '#fff0f4', moss: ['#7aa870', '#4e7e50', '#2e5438'], wisp: '#98e0f8', lid: ['#88c0ff', '#3878f0', '#2850b8'], marks: 'great', mark: '#e03830' },
  wastes: { rock: ['#6a5250', '#523e3e', '#3e2e30', '#2e2224', '#1a1214'], crystal: ['#fff4c0', '#f8b048', '#e86020', '#982818'], ground: ['#4a3a38', '#423432', '#3a2e2c', '#332826'], stone: ['#9a8a80', '#7a6a62', '#5a4c46', '#3a302c'], beam: '#ffd8a0', vein: ['#f8b030', '#e05820'], ember: '#f8a830', lid: ['#70707e', '#46464e', '#303036'], marks: 'ultra', mark: '#f8d030' },
  depths: { rock: ['#5e5276', '#4a405e', '#3a324c', '#2a2438', '#181424'], crystal: ['#f8f0ff', '#d0a8f8', '#9058e0', '#502898'], ground: ['#3e3650', '#383048', '#322a40', '#2c2438'], stone: ['#a8a0c0', '#867ea0', '#645c7c', '#443e58'], beam: '#f0e0ff', vein: ['#ff8ae0', '#f0349a'], ember: '#c878f8', lid: ['#d0a0ff', '#8048c8', '#5a2c98'], marks: 'master', mark: '#f070a8' },
  ruins: { rock: ['#8a8068', '#6e6652', '#565040', '#423c30', '#2c281e'], crystal: ['#f0fffc', '#98f0e0', '#40c0b8', '#1e7878'], ground: ['#5e5848', '#544e40', '#4a4438', '#403c30'], stone: ['#e0d4b0', '#c0b088', '#988a66', '#6a5e46'], beam: '#e8fff8', moss: ['#7ab860', '#4e8a48', '#2e5a34'], tide: ['#e8fffc', '#c8fff8', '#58c0c0', '#2e8a98', '#1e7080'], lid: ['#98d8ff', '#3890e0', '#2060b0'], marks: 'dive', mark: '#78d0f8' },
  savanna: { rock: ['#c09068', '#a07450', '#80583c', '#62402a', '#40281a'], crystal: ['#fffce0', '#f8e070', '#f0a830', '#a86018'], ground: ['#8a6a48', '#7e6040', '#72563a', '#664c32'], stone: ['#f0d8b0', '#d0b088', '#a08060', '#6a5038'], beam: '#fff4c8', roots: ['#a08060', '#6e5236'], ember: '#f8c850', lid: ['#fff080', '#f8d030', '#d8a818'], marks: 'great', mark: '#e03828' },
  thornwood: { rock: ['#8a6a4a', '#6e5236', '#56402a', '#40301e', '#281c10'], crystal: ['#fffce0', '#f8d070', '#e09a30', '#985818'], ground: ['#5a4a32', '#50422c', '#463a26', '#3c3220'], stone: ['#c8b890', '#a8946c', '#806c4c', '#584830'], beam: '#f8ffd0', moss: ['#9ad060', '#5e9a40', '#3a6a2c'], roots: ['#8a6a4a', '#5a4430'], lid: ['#a8e880', '#58b048', '#3a8a34'], marks: 'nest', mark: '#c8e060' },
};
/** A Safari area's grotto (it has none: the ? never rolls one there) and any new biome's: the Clearing's. */
const caveOf = (biome) => CAVE[biome] || CAVE.clearing;

/** A cave wall: faceted rock fading to dark overhead, crystals glinting in it, and the biome's moss, veins or roots. */
function caveWall(W, C, side) {
  const H = TOP * U, f = fine(W, H, side ? 4 : 5), { g, lin } = f, s = f.shine(), r = seeded(side ? 33 : 34);
  g.fillStyle = lin(0, 0, 0, H, [C.rock[4], C.rock[3], C.rock[2]]); g.fillRect(0, 0, W, H);
  for (let y = wy(6); y < H; y += 8) for (let x = -10 + r() * 6; x < W; x += 10 + r() * 8) {
    const w = 10 + r() * 9, h = 8 + r() * 5, k = Math.min(1, (y - wy(6)) / (H - wy(6)));
    g.fillStyle = C.rock[Math.min(4, Math.max(0, 3 - Math.floor(k * 3 + r() * 1.5)))];
    g.beginPath(); g.moveTo(x + r() * 3, y); g.lineTo(x + w, y + r() * 3); g.lineTo(x + w - r() * 3, y + h); g.lineTo(x, y + h - r() * 2); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(x + 1, y + 0.4, w * 0.5, 0.8);
  }
  g.fillStyle = lin(0, 0, 0, wy(4.5), ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']); g.fillRect(0, 0, W, wy(4.5));
  for (let i = 0; i < (side ? 8 : 14); i++) {   // little crystals in the rock
    const x = r() * W, y = wy(0.6 + r() * 4), h = 3 + r() * 5;
    for (const ctx of [g, s]) { ctx.fillStyle = C.crystal[1 + Math.floor(r() * 2)]; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1.6, y - h); ctx.lineTo(x + 3.2, y); ctx.closePath(); ctx.fill(); }
  }
  if (C.vein) for (let i = 0; i < (side ? 4 : 8); i++) {
    let x = r() * W, y = wy(0.4 + r() * 4.5);
    for (const ctx of [g, s]) { ctx.strokeStyle = C.vein[i % 2]; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y); }
    for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 12; y += (r() - 0.6) * 6; g.lineTo(x, y); s.lineTo(x, y); }
    g.stroke(); s.stroke();
  }
  if (C.moss) for (let i = 0; i < W / 5; i++) { g.fillStyle = C.moss[i % 3]; g.beginPath(); g.ellipse(r() * W, wy(r() * 1.4), 2 + r() * 4, 1 + r() * 1.6, 0, 0, Math.PI * 2); g.fill(); }
  if (C.roots) for (let i = 0; i < (side ? 4 : 7); i++) {
    let x = r() * W, y = wy(TOP * 0.55);
    g.strokeStyle = C.roots[i % 2]; g.lineWidth = 2.2 + r() * 2; g.beginPath(); g.moveTo(x, y);
    while (y < H) { x += (r() - 0.5) * 9; y += 6 + r() * 6; g.lineTo(x, y); }
    g.stroke();
  }
  return f.c;
}

/** `pools`: [tx, ty, colour, radius] of light on it (the grotto's: the shaft's round the dais). */
function caveFloor(C, pools = [[5.5, 2.2, 'rgba(255,248,220,0.35)', 3.4]]) {
  const T = 16, W = COLS * T, H = ROWS * T, f = fine(W, H, 5), { g } = f, r = seeded(52), s = C.vein ? f.shine() : null;
  g.fillStyle = C.ground[1]; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 420; i++) { g.fillStyle = C.ground[Math.floor(r() * 4)]; g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 4, 0.8 + r() * 2.6, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 160; i++) { g.fillStyle = C.stone[2 + Math.floor(r() * 2)]; g.beginPath(); g.arc(r() * W, r() * H, 0.4 + r() * 0.9, 0, Math.PI * 2); g.fill(); }
  for (const [tx, ty, col, rad] of pools) {
    const x = tx * T, y = ty * T, l = g.createRadialGradient(x, y, 4, x, y, rad * T);
    l.addColorStop(0, col); l.addColorStop(1, col.replace(/[\d.]+\)$/, '0)'));
    g.fillStyle = l; g.fillRect(0, 0, W, H);
  }
  if (C.moss) for (let i = 0; i < 26; i++) { g.fillStyle = C.moss[i % 3]; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(r() * W, r() * H, 2 + r() * 6, 1.4 + r() * 3, r() * 3, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  if (s) for (let i = 0; i < 10; i++) {
    let px = r() * W, py = r() * H;
    for (const ctx of [g, s]) { ctx.strokeStyle = C.vein[i % 2]; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(px, py); }
    for (let k = 0; k < 5; k++) { px += (r() - 0.5) * 10; py += (r() - 0.5) * 10; g.lineTo(px, py); s.lineTo(px, py); }
    g.stroke(); s.stroke();
  }
  return f.c;
}

/** A cluster of glowing crystals, tapered hexagonal prisms leaning out from (`x`, `z`). */
function crystals(x, z, size, C, rnd, { n = 5, y = 0 } = {}) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  B.group.add(g);
  const mats = [1, 2].map(i => std({ color: C.crystal[i], emissive: new THREE.Color(C.crystal[i + 1]), emissiveIntensity: 0.55, roughness: 0.15, metalness: 0.1, flatShading: true, transparent: true, opacity: 0.92 }));
  for (let i = 0; i < n; i++) {
    const h = size * (0.5 + rnd() * 0.8) * (i ? 0.75 : 1.2), rad = size * (0.1 + rnd() * 0.07);
    const m = mesh(new THREE.CylinderGeometry(rad * 0.18, rad, h, 6), mats[i % 2], 0, 0, 0, g);
    const lean = i ? 0.25 + rnd() * 0.45 : rnd() * 0.15, a = rnd() * Math.PI * 2;
    m.rotation.set(Math.cos(a) * lean, rnd() * 3, Math.sin(a) * lean);
    m.position.set(Math.sin(a) * lean * h * 0.35, h / 2 * Math.cos(lean), Math.cos(a) * lean * h * 0.35);
    m.raycast = () => {};
  }
  B.glowing.push(...mats);
  return g;
}

/** The Poké Ball chest's lid painting: the ball's colour and its marks (a Great Ball's stripes, an Ultra Ball's H...). */
function lidArt(C) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d'), l = g.createLinearGradient(0, 0, 128, 0);
  l.addColorStop(0, C.lid[2]); l.addColorStop(0.5, C.lid[0]); l.addColorStop(1, C.lid[2]);   // u runs round the dome
  g.fillStyle = l; g.fillRect(0, 0, 128, 128);
  g.fillStyle = C.mark;
  if (C.marks === 'great') for (const v of [26, 102]) { g.beginPath(); g.ellipse(64, v, 34, 13, 0, 0, Math.PI * 2); g.fill(); }
  if (C.marks === 'ultra') { for (const v of [22, 106]) g.fillRect(0, v - 10, 128, 20); g.fillRect(52, 22, 24, 84); }
  if (C.marks === 'master') { for (const v of [30, 98]) { g.beginPath(); g.arc(64, v, 15, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#ffffff'; g.font = '900 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.save(); g.translate(64, 64); g.rotate(Math.PI / 2); g.fillText('M', 0, 2); g.restore(); }
  if (C.marks === 'dive') { g.strokeStyle = C.mark; g.lineWidth = 7; for (const v of [34, 64, 94]) { g.beginPath(); for (let u = 0; u <= 128; u += 4) g.lineTo(u, v + Math.sin(u / 10) * 6); g.stroke(); } }
  if (C.marks === 'nest') { g.strokeStyle = C.mark; g.lineWidth = 5; for (let u = 16; u < 128; u += 24) { g.beginPath(); g.moveTo(u, 0); g.lineTo(u + 40, 128); g.moveTo(u + 40, 0); g.lineTo(u, 128); g.stroke(); } }
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(40, 64, 7, 40, 0, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The chest on its dais: a white body, the ball's black band and button for a latch, the lid a dome in the ball's colours,
    hinged at the back. */
function ballChest(x, y, z, C) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  B.group.add(g);
  const white = std({ color: '#f4f4f8', roughness: 0.35 }), black = std({ color: '#26262e', roughness: 0.4 });
  mesh(rbox(0.9, 0.4, 0.62, 0.07), white, 0, 0.2, 0, g);
  mesh(new THREE.BoxGeometry(0.93, 0.06, 0.65), black, 0, 0.41, 0, g);
  const latch = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24), black, 0, 0.4, 0.33, g);
  latch.rotation.x = Math.PI / 2;
  const button = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 24), std({ color: '#ffffff', roughness: 0.25, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.1 }), 0, 0.4, 0.35, g);
  button.rotation.x = Math.PI / 2;
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.44, -0.31);
  g.add(hinge);
  const lid = mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.9, 32, 1, false, 0, Math.PI), std({ map: lidArt(C), roughness: 0.3 }), 0, 0, 0.31, hinge);
  lid.rotation.z = Math.PI / 2;
  lid.scale.set(0.82, 1, 1);
  lid.material.side = THREE.DoubleSide;
  mesh(new THREE.BoxGeometry(0.9, 0.03, 0.62), std({ color: C.lid[2], roughness: 0.5 }), 0, 0.005, 0.31, hinge);   // its underside
  mesh(new THREE.BoxGeometry(0.93, 0.05, 0.65), black, 0, -0.02, 0.31, hinge);
  // the light pouring out of the open box
  const pour = mesh(new THREE.PlaneGeometry(0.8, 0.54), new THREE.MeshBasicMaterial({ color: C.beam, transparent: true, opacity: 0, toneMapped: false }), 0, 0.435, 0, g);
  pour.rotation.x = -Math.PI / 2;
  const inside = new THREE.PointLight(C.beam, 0, 4, 1.5);
  inside.position.set(0, 0.7, 0.1);
  g.add(inside);
  g.traverse(o => { if (o.isMesh) o.userData.spot = 0; });
  return { group: g, hinge, inside, button, pour };
}

/** The light falling through the roof's hole onto the dais: a soft column, brightest low down, dust turning in it. */
function shaftOfLight(x, z, col) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 128;
  const g = c.getContext('2d'), l = g.createLinearGradient(0, 0, 0, 128);
  l.addColorStop(0, 'rgba(255,255,255,0)'); l.addColorStop(0.35, 'rgba(255,255,255,0.55)'); l.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = l; g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c), h = 8;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.25, h, 40, 1, true),
    new THREE.MeshBasicMaterial({ map: t, color: col, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
  m.position.set(x, h / 2, z);
  m.raycast = () => {};
  const ray = new THREE.Group();
  ray.add(m);
  B.group.add(ray);
  return ray;
}

/** The stone dais the chest stands on, two round tiers. */
function dais(x, z, C) {
  const top = std({ color: C.stone[0], roughness: 0.9 }), side = std({ color: C.stone[2], roughness: 0.95 });
  mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.22, 40), [side, top, side], x, 0.11, z);
  mesh(new THREE.CylinderGeometry(0.75, 0.82, 0.2, 40), [side, top, side], x, 0.32, z);
  return 0.42;
}

async function buildGrotto(figs, { biome }) {
  const C = caveOf(biome);
  B.glowing = [];
  shell({ floor: caveFloor(C), wall: caveWall((COLS + 0.8) * U, C, false), side: (left) => caveWall(ROWS * U, C, left), edge: C.rock[3], cap: C.rock[4], under: C.rock[4], bg: '#06060a' });
  B.env = { hemi: [C.crystal[1], C.rock[4], 0.75], sun: [C.beam, 0.55], bloom: 0.65 };
  B.shotTop = 3.2;
  const rnd = seeded(71), cx = tileX(5), cz = tileZ(2);
  const h = dais(cx, cz, C);
  const chest = ballChest(cx, h, cz, C);
  chest.group.scale.setScalar(1.45);
  B.chest = chest;
  for (let x = 4; x <= 6; x++) for (let y = 1; y <= 3; y++) B.blocked.add(key(x, y));
  // the shaft of light down through a hole in the roof onto the dais
  const shaft = new THREE.SpotLight(C.beam, 60, 0, 0.32, 0.6, 1.4);
  shaft.position.set(cx - 0.6, 11, cz - 1.2);
  shaft.target.position.set(cx, 0, cz);
  shaft.castShadow = true;
  shaft.shadow.mapSize.set(512, 512);
  B.group.add(shaft, shaft.target);
  const ray = shaftOfLight(cx, cz, C.beam);
  // crystals along the walls and round the dais, stalagmites in the corners, coins spilled on the floor
  for (const [tx, ty, s] of [[0, 0, 1.3], [2, 0, 0.9], [8, 0, 1.1], [10, 0, 1.4], [0, 3, 1], [10, 4, 1.1], [0, 6, 0.8], [10, 6, 0.9], [3, 1, 0.55], [7, 2, 0.6]]) {
    crystals(tileX(tx) + (tx === 0 ? -0.2 : tx === 10 ? 0.2 : 0), tileZ(ty) - (ty === 0 ? 0.2 : 0), s, C, rnd, { n: s > 0.8 ? 6 : 4 });
    B.blocked.add(key(tx, ty));
  }
  const spike = std({ color: C.rock[1], roughness: 0.95, flatShading: true });
  for (const [tx, ty] of [[1, 0], [9, 0], [0, 1], [10, 2]]) {
    for (let i = 0; i < 2; i++) mesh(new THREE.ConeGeometry(0.22 - i * 0.07, 1.4 - i * 0.6, 7), spike, tileX(tx) + (i ? 0.25 : -0.1), (1.4 - i * 0.6) / 2, tileZ(ty) + (i ? 0.2 : 0));
    B.blocked.add(key(tx, ty));
  }
  const gold = std({ color: '#f8c830', metalness: 0.8, roughness: 0.3 });
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2, d = 1.1 + rnd() * 0.9, coin = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 14), gold, cx + Math.cos(a) * d, 0.012 + rnd() * 0.02, cz + Math.sin(a) * d * 0.8);
    coin.rotation.set((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5);
    coin.raycast = () => {};
  }
  if (C.tide) pool(tileX(8.6), tileZ(5.4), 0.9, 0.65, { water: C.tide, rock: C.stone }, 12);   // a tide pool in the drowned vault
  if (C.roots) {   // roots running in over the floor
    const root = std({ color: C.roots[0], roughness: 1 });
    for (const [x0, z0, x1, z1] of [[-5.6, -3.4, -3, -1.8], [5.6, -2.6, 3.2, -0.6], [-5.6, 1.4, -3.6, 2.6]]) {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x0, 0.3, z0), new THREE.Vector3((x0 + x1) / 2, 0.12, (z0 + z1) / 2 + 0.3), new THREE.Vector3(x1, 0.02, z1)]);
      mesh(new THREE.TubeGeometry(curve, 20, 0.09, 8, false), root, 0, 0, 0).raycast = () => {};
    }
  }
  const glowing = B.glowing;
  // motes drifting in the light; wisps, embers
  const motes = Array.from({ length: 12 }, (_, i) => ({ s: sprite(sparkArt(C.beam), 0.1), a: i * 2.4, r: 0.2 + (i % 4) * 0.18, phase: i / 12 }));
  const drift = C.wisp || C.ember;
  const floaters = drift ? Array.from({ length: 8 }, (_, i) => ({ s: sprite(sparkArt(drift), C.wisp ? 0.3 : 0.14), x: (rnd() - 0.5) * 9, z: (rnd() - 0.5) * 5 - 1, phase: i / 8 })) : [];
  B.ticks.push((now) => {
    for (const m of motes) {
      const t = calm ? m.phase : (now / 9000 + m.phase) % 1;
      m.s.visible = true;
      m.s.position.set(cx + Math.cos(m.a + t * 3) * m.r, 0.6 + t * 3.2, cz + Math.sin(m.a + t * 3) * m.r * 0.7);
      m.s.material.opacity = Math.sin(t * Math.PI) * 0.8;
    }
    for (const f of floaters) {
      const t = calm ? f.phase : (now / (C.wisp ? 7000 : 4200) + f.phase) % 1;
      f.s.visible = true;
      f.s.position.set(f.x + Math.sin(t * 6 + f.x) * 0.3, 0.3 + t * 2.6, f.z);
      f.s.material.opacity = Math.sin(t * Math.PI) * 0.85;
    }
    if (!calm) for (const m of glowing) m.emissiveIntensity = 0.5 + Math.sin(now / 900 + m.id) * 0.12;
  });
  B.spots = [{ step: { x: 5, y: 4 } }];
  B.anchors[0] = new THREE.Vector3(cx, h + 1.05, cz + 0.1);
  // the chest follows the page's: it wobbles while `.shaking`, and once `.opened` its lid flies up and the light pours out
  const sparks = Array.from({ length: 16 }, (_, i) => sprite(sparkArt(i % 2 ? C.beam : C.crystal[1]), 0.24));
  let state = '', since = 0, fly = null;
  B.ticks.push((now) => {
    const btn = document.querySelector('#reward-options.c3d .treasure-chest');
    const was = state;
    state = btn?.classList.contains('opened') ? 'opened' : btn?.classList.contains('shaking') ? 'shaking' : '';
    if (state !== was) {
      since = now;
      if (state === 'opened') fly = burst(sparks, new THREE.Vector3(cx, h + 0.8, cz), { spread: 0.5, rise: 1.6 });
    }
    const k = (now - since) / 1000, c = chest;
    if (state === 'shaking' && !calm) {
      const w = k / 1.1, at = [[0.08, -0.16], [0.16, 0.14], [0.24, 0], [0.36, 0], [0.44, -0.12], [0.52, 0.1], [0.6, 0], [0.72, 0], [0.8, -0.09], [0.88, 0]];
      let z = 0, prev = [0, 0];
      for (const p of at) { if (w <= p[0]) { z = prev[1] + (p[1] - prev[1]) * ((w - prev[0]) / (p[0] - prev[0])); break; } prev = p; }
      c.group.rotation.z = z;
    } else c.group.rotation.z = 0;
    if (state === 'opened') {
      const u = calm ? 1 : Math.min(1, k / 0.45);
      c.hinge.rotation.x = -1.95 * (1 - Math.pow(1 - u, 3)) - (calm ? 0 : Math.sin(Math.min(1, k / 0.8) * Math.PI) * 0.1);
      c.inside.intensity = 3.5 + (calm ? 0 : Math.sin(now / 500) * 0.8);
      c.pour.material.opacity = Math.min(1, u * 2);
      ray.children[0].material.opacity = 0.15;
      if (fly && !calm) { fly(Math.min(1, k / 1.4)); if (k > 1.4) fly = null; }
    } else { c.hinge.rotation.x = 0; c.inside.intensity = 0; c.pour.material.opacity = 0; ray.children[0].material.opacity = 0.09; }
  });
}

/* ---------- the outdoor four: a patch of the biome itself ---------- */

/** Wild ground: grass with tufts and flowers in the garden, moss and fallen leaves under the cedars, ash with glowing
    cracks among the rocks, and a worn path from where you came in up to the thing. */
function wildFloor(L, { to = 2 } = {}) {
  const T = 16, W = COLS * T, H = ROWS * T, f = fine(W, H, Math.min(5, 2560 / Math.max(W, H))), { g } = f, r = seeded(43);
  const s = L.vein ? f.shine() : null, more = Math.max(1, COLS * ROWS / 88);   // a town's ground keeps the rooms' density
  g.fillStyle = L.grass[1]; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900 * more; i++) { g.fillStyle = L.grass[Math.floor(r() * 3)]; g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 3, 0.6 + r() * 1.4, r() * 3, 0, Math.PI * 2); g.fill(); }
  if (L.look !== 'rock') {
    g.strokeStyle = L.grass[2]; g.lineWidth = 0.4;
    for (let i = 0; i < 700 * more; i++) { const x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 1.4, y - 1.6 - r()); g.stroke(); }
  }
  // the path: worn earth from the doorstep up to the middle
  for (let y = H + 4; y > to * T; y -= 3) {
    const x = COLS / 2 * T + Math.sin(y / 23) * 3, w = 1.3 * T + Math.sin(y / 11) * 2;
    g.fillStyle = L.dirt[0]; g.beginPath(); g.ellipse(x, y, w / 2, 3.2, 0, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 120; i++) { const y = to * T + r() * (H - to * T), x = COLS / 2 * T + (r() - 0.5) * T; g.fillStyle = L.dirt[1]; g.fillRect(x, y, 0.8, 0.8); }
  if (L.look === 'garden') for (let i = 0; i < 70; i++) {   // wildflowers
    const x = r() * W, y = r() * H;
    if (Math.abs(x - COLS / 2 * T) < T) continue;
    g.fillStyle = ['#ffffff', '#f8e060', '#f890b0', '#b0a0f8'][i % 4]; g.beginPath(); g.arc(x, y, 0.9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f8c838'; g.fillRect(x - 0.25, y - 0.25, 0.5, 0.5);
  }
  if (L.look === 'cedar') for (let i = 0; i < 90 * more; i++) { g.fillStyle = L.drift[i % 2]; g.beginPath(); g.ellipse(r() * W, r() * H, 1.3, 0.7, r() * 3, 0, Math.PI * 2); g.fill(); }
  if (s) for (let i = 0; i < 8; i++) {
    let x = r() * W, y = r() * H;
    for (const ctx of [g, s]) { ctx.strokeStyle = L.vein[i % 2]; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y); }
    for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 10; y += (r() - 0.5) * 10; g.lineTo(x, y); s.lineTo(x, y); }
    g.stroke(); s.stroke();
  }
  return f.c;
}

/** Tufts of grass (pebbles among the rocks) over the free ground, off the path. */
function tufts(L, n, rnd) {
  const blade = [0, 1, 2].map(i => std({ color: L.grass[i], roughness: 1 }));
  const stone = std({ color: L.rock[2], roughness: 1, flatShading: true });
  for (let i = 0; i < n; i++) {
    const tx = Math.floor(rnd() * COLS), ty = Math.floor(rnd() * ROWS);
    if (B.blocked.has(key(tx, ty)) || (Math.abs(tx - DOOR.x) < 1 && ty > 1)) continue;
    const x = tileX(tx) + (rnd() - 0.5) * 0.7, z = tileZ(ty) + (rnd() - 0.5) * 0.7;
    if (L.look === 'rock') { boulder(x, z, 0.06 + rnd() * 0.08, L.rock, rnd); continue; }
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    for (let k = 0; k < 4; k++) {
      const m = mesh(new THREE.ConeGeometry(0.035, 0.22 + rnd() * 0.16, 4), blade[k % 3], (rnd() - 0.5) * 0.12, 0.13, (rnd() - 0.5) * 0.08, g);
      m.rotation.set((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.6);
      m.castShadow = false; m.raycast = () => {};
    }
    B.group.add(g);
  }
}

/** The outdoor rooms' shell: the biome's scenery all round with no fence (a hedge, or rocks, at its foot), wild ground,
    the sky and the light by the hour, a few of the look's trees standing about, tufts over the rest. */
function wild(L, time, { to = 2, trees = [], exit = true, ground = (c) => c, holes = false, walled = true } = {}) {
  const sky = graded(L.sky[0], time);
  shell({ floor: ground(wildFloor(L, { to })), wall: walled && scenery((COLS + 0.8) * U, L, time, 'none'), side: () => scenery(ROWS * U, L, time, 'none', { side: true, bare: !walled }), edge: L.edge, cap: sky, under: L.under, bg: sky, open: true, mat: exit, holes, walled });
  if (walled) skyDome(L, time);
  const light = SKY_LIGHT[L.look === 'rock' && time === 'day' ? 'dusk' : time];
  B.env = { hemi: light.hemi, sun: light.sun, bloom: 0.3 };
  const rnd = seeded(29);
  for (const [tx, ty, tall] of trees) tree(L, tx, ty, rnd, tall);
  return rnd;
}

/* the Berry Tree: an Oran Berry tree over a plot of soil (eat), an empty plot beside it with a sign (plant) */

function soil(x, z, w, d) {
  const m = mesh(rbox(w, 0.16, d, 0.07), std({ color: '#6a4428', roughness: 1 }), x, 0.05, z);
  for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(w - 0.3, 0.03, 0.05), std({ color: '#4a2c18', roughness: 1 }), x, 0.135, z - d / 3 + i * d / 3).raycast = () => {};
  return m;
}

function plotSign() {
  const f = fine(24, 16, 8), { g, rr, lin } = f;
  rr(0, 0, 24, 16, 1.6, '#6a4428');
  rr(1.2, 1.2, 21.6, 13.6, 1, lin(0, 0, 0, 16, ['#f0c890', '#d8a868']));
  g.fillStyle = '#3a78d8'; g.beginPath(); g.arc(8, 9, 3.6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#88c8ff'; g.beginPath(); g.arc(7, 7.8, 1.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#4a9a38'; g.beginPath(); g.ellipse(9.5, 4.6, 2.4, 1, -0.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#7a3a20'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(14, 8); g.lineTo(19, 8); g.moveTo(16.5, 5.5); g.lineTo(16.5, 10.5); g.stroke();
  return f.c;
}

async function buildBerry(figs, { look: L, time }) {
  wild(L, time, { to: 3, trees: [[0, 0, 1.4], [10, 0, 1.3], [0, 3, 1.1], [10, 5, 1.2], [1, 6, 0.9]] });
  B.shotTop = 3.4;
  const tx = tileX(3.5), tz = tileZ(2), leaf = L.leaf || ['#c8c070', '#a8a050', '#88883c', '#5e6028'], rnd = seeded(83);
  soil(tx, tz, 2.2, 1.8);
  // the tree
  mesh(new THREE.CylinderGeometry(0.13, 0.2, 1.5, 12), std({ color: L.trunk[0], roughness: 0.95 }), tx, 0.85, tz);
  const crown = new THREE.Group();
  crown.position.set(tx, 2.05, tz);
  B.group.add(crown);
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2, d = i ? 0.55 : 0, rr = 0.6 + rnd() * 0.2;
    mesh(new THREE.IcosahedronGeometry(rr, 1), std({ color: leaf[Math.floor(rnd() * 3)], roughness: 0.9, flatShading: true }), Math.cos(a) * d, (i ? rnd() * 0.4 - 0.15 : 0.35), Math.sin(a) * d * 0.8, crown);
  }
  const blue = std({ color: '#3a78d8', roughness: 0.3, emissive: new THREE.Color('#1a3a80'), emissiveIntensity: 0.25 }), cap = std({ color: '#4a9a38', roughness: 0.6 });
  const berries = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * 0.9 + i / 9 * Math.PI * 0.8 + (rnd() - 0.5) * 0.15, y = 1.55 + (i % 3) * 0.32 + rnd() * 0.12, rad = 1.05 + rnd() * 0.12;
    const b = new THREE.Group(), home = new THREE.Vector3(tx + Math.cos(a) * rad, y, tz - Math.sin(a) * rad * 0.95);
    mesh(new THREE.SphereGeometry(0.1, 16, 12), blue, 0, 0, 0, b);
    mesh(new THREE.ConeGeometry(0.05, 0.08, 6), cap, 0, 0.1, 0, b);
    b.position.copy(home);
    B.group.add(b);
    berries.push({ b, home });
  }
  // the empty plot and its sign, the sprout that comes up in it
  const px = tileX(7.5), pz = tileZ(2.5);
  soil(px, pz, 1.3, 1.1);
  signboard(plotSign(), px + 0.75, pz - 0.6, 0.6, 0.4, 0.5);
  const sprout = new THREE.Group();
  sprout.position.set(px, 0.13, pz);
  mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.3, 6), cap, 0, 0.15, 0, sprout);
  for (const s of [-1, 1]) { const l = mesh(new THREE.SphereGeometry(0.09, 10, 8), std({ color: '#68c048', roughness: 0.7 }), s * 0.09, 0.3, 0, sprout); l.scale.set(1, 0.35, 0.6); l.rotation.z = s * 0.4; }
  B.group.add(sprout);
  for (let x = 2; x <= 4; x++) for (let y = 1; y <= 2; y++) B.blocked.add(key(x, y));
  B.blocked.add(key(7, 2)); B.blocked.add(key(8, 2));
  crown.traverse(o => { o.userData.spot = 0; });
  berries.forEach(({ b }) => b.traverse(o => { o.userData.spot = 0; }));
  sprout.traverse(o => { o.userData.spot = 1; });
  B.spots = [{ step: { x: 3, y: 3 } }, { step: { x: 7, y: 3 } }];
  B.anchors[0] = new THREE.Vector3(tx, 3.2, tz);
  B.anchors[1] = new THREE.Vector3(px, 1.3, pz);
  tufts(L, 60, rnd);
  B.ticks.push((now) => { if (!calm && !acting) crown.rotation.z = Math.sin(now / 1700) * 0.02; });
  B.reset = () => { berries.forEach(({ b, home }) => { b.position.copy(home); b.scale.setScalar(1); b.visible = true; }); sprout.visible = false; sprout.scale.setScalar(0.01); };
  B.reset();
  const low = () => [...berries].sort((a, c) => a.home.y - c.home.y);
  B.acts = {
    eat: { ms: 1800, start() { this.fall = low().slice(0, 3); },
      tick(k) {
        crown.rotation.z = Math.sin(k * Math.PI * 8) * 0.06 * (1 - k);
        this.fall.forEach(({ b, home }, i) => {
          const t = Math.max(0, Math.min(1, (k - i * 0.1) / 0.45)), y = home.y + (0.1 - home.y) * t * t;
          b.position.set(home.x + (walker.x - home.x) * 0.3 * t, y, home.z + (walker.z - home.z) * 0.3 * t);
          b.scale.setScalar(k > 0.7 ? Math.max(0.01, 1 - (k - 0.7) / 0.25) : 1);
        });
        walker.oy = k > 0.65 && k < 0.95 ? Math.abs(Math.sin((k - 0.65) / 0.3 * Math.PI * 2)) * 0.15 : 0;
      }, cues: [[0, 'rustle'], [0.4, 'stick'], [0.75, 'stick']] },
    plant: { ms: 2000, start() { this.seed = low().pop(); },
      tick(k) {
        const { b, home } = this.seed, t = Math.min(1, k / 0.45);
        b.position.set(home.x + (px - home.x) * t, home.y + (0.15 - home.y) * t + Math.sin(t * Math.PI) * 1.2, home.z + (pz - home.z) * t);
        b.scale.setScalar(k > 0.45 ? Math.max(0.01, 1 - (k - 0.45) / 0.1) : 1);
        sprout.visible = k > 0.55;
        sprout.scale.setScalar(Math.max(0.01, ease(Math.min(1, (k - 0.55) / 0.35)) * 2));
      }, cues: [[0, 'rustle'], [0.45, 'stick'], [0.6, 'stat-up']] },
  };
}

/* the Wishing Well: an old stone well under a roof, a crank and a bucket, coins glinting in the water; its left side the
   small toss, its right the big one */

function bricks(L) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 64;
  const g = c.getContext('2d'), r = seeded(57), cols = L.look === 'garden' ? ['#e0e4ec', '#c8ccd8', '#b4bac8', '#9aa0b0'] : L.stone;
  g.fillStyle = '#5a5a60'; g.fillRect(0, 0, 256, 64);
  for (let y = 0; y < 64; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < 256; x += 32) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.beginPath(); g.roundRect(x + 1.5, y + 1.5, 29, 13, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 4, y + 3, 18, 2); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(2, 1);
  return t;
}

async function buildWell(figs, { look: L, time }) {
  const rnd = wild(L, time, { to: 3, trees: [[0, 0, 1.3], [10, 0, 1.4], [1, 1, 1], [9, 1, 1.1], [0, 5, 1.2], [10, 6, 1]] });
  B.shotTop = 3.2;
  const cx = tileX(5), cz = tileZ(2), wood = std({ color: L.wood[1], roughness: 0.8 }), dark = std({ color: L.wood[2], roughness: 0.8 });
  const well = new THREE.Group();
  B.group.add(well);
  const brick = std({ map: bricks(L), roughness: 0.9 }), inner = std({ color: '#2a2a30', roughness: 1, side: THREE.BackSide });
  mesh(new THREE.CylinderGeometry(0.9, 0.95, 0.85, 32, 1, true), brick, cx, 0.425, cz, well);
  mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.85, 32, 1, true), inner, cx, 0.425, cz, well);
  const rim = mesh(new THREE.RingGeometry(0.68, 0.94, 32), std({ color: L.look === 'garden' ? '#c8ccd8' : L.stone[0], roughness: 0.85 }), cx, 0.86, cz, well);
  rim.rotation.x = -Math.PI / 2;
  const map = waterTex(['#ffffff', '#88b8f0', '#4a7ab8', '#1e3c70', '#0c1a38']);
  const water = mesh(new THREE.CircleGeometry(0.7, 32), std({ map, roughness: 0.15, emissive: new THREE.Color('#2a4a90'), emissiveIntensity: 0.25 }), cx, 0.5, cz, well);
  water.rotation.x = -Math.PI / 2;
  const gold = std({ color: '#f8c830', metalness: 0.8, roughness: 0.3 });
  for (let i = 0; i < 9; i++) { const a = rnd() * 6.3, d = rnd() * 0.5; mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 12), gold, cx + Math.cos(a) * d, 0.505, cz + Math.sin(a) * d).raycast = () => {}; }
  for (const s of [-1, 1]) box(0.12, 2.2, 0.12, wood, cx + s * 0.98, 1.1, cz, well);
  const roof = L.look === 'garden' ? ['#f87858', '#e04030', '#a82820'] : L.roof;
  const tiled = std({ map: roofTiles(roof, 3, 1), roughness: 0.6 }), edge = std({ color: roof[2], roughness: 0.6 });
  for (const s of [-1, 1]) { const r = box(1.7, 0.08, 0.95, [edge, edge, tiled, dark, edge, edge], cx, 2.3, cz + s * 0.4, well); r.rotation.x = s * 0.72; }
  box(1.8, 0.12, 0.14, edge, cx, 2.62, cz, well);
  const axle = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.9, 12), wood, cx, 1.75, cz, well);
  axle.rotation.z = Math.PI / 2;
  const crank = new THREE.Group();
  crank.position.set(cx + 1.05, 1.75, cz);
  well.add(crank);
  box(0.05, 0.3, 0.05, dark, 0, -0.12, 0, crank);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), dark, 0.08, -0.26, 0, crank).rotation.z = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.55, 6), std({ color: '#c8a868' }), cx, 1.45, cz, well);
  const bucket = mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.22, 16), wood, cx, 1.06, cz, well);
  for (const y of [-0.06, 0.06]) mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.02, 16), std({ color: '#505058', metalness: 0.5 }), 0, y, 0, bucket);
  for (let x = 4; x <= 6; x++) for (let y = 1; y <= 2; y++) B.blocked.add(key(x, y));
  B.spots = [{ step: { x: 4, y: 3 } }, { step: { x: 6, y: 3 } }];
  B.anchors[0] = new THREE.Vector3(cx - 0.75, 3.0, cz);
  B.anchors[1] = new THREE.Vector3(cx + 0.75, 3.0, cz);
  well.userData.spotAt = (p) => (p.x < cx ? 0 : 1);   // its two halves are the two tosses
  tufts(L, 50, rnd);
  B.ticks.push((now) => { if (!calm) map.offset.set(now / 50000, 0); });
  const coin = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), gold, 0, 0, 0);
  const nugget = mesh(new THREE.IcosahedronGeometry(0.12, 0), std({ color: '#f8c830', metalness: 0.9, roughness: 0.25, flatShading: true }), 0, 0, 0);
  const rings = ripples(3, '#c8e0ff');
  const drops = Array.from({ length: 8 }, () => sprite(sparkArt('#c8e8ff'), 0.16));
  const wishes = Array.from({ length: 14 }, (_, i) => sprite(sparkArt(i % 2 ? '#fff8d0' : '#ffe080'), 0.26));
  const column = mesh(new THREE.CylinderGeometry(0.55, 0.65, 4, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff4c0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), cx, 2.5, cz);
  column.castShadow = false; column.raycast = () => {};
  B.reset = () => { coin.visible = nugget.visible = false; column.material.opacity = 0; };
  B.reset();
  B.acts = {
    toss: { ms: (o) => (o?.win ? 2800 : 1600), cues: (o) => [[0.05, 'stick'], [o?.win ? 0.25 : 0.4, 'splash'], ...(o?.win ? [[0.4, 'spirit'], [0.55, 'stat-up']] : [])],
      start(o) { this.o = o || {}; this.ball = this.o.big ? nugget : coin; this.from = new THREE.Vector3(walker.x, 0.7, walker.z); this.land = this.o.win ? 0.25 : 0.4; this.splash = burst(drops, new THREE.Vector3(cx, 0.55, cz), { spread: 0.3, rise: 0.6 }); this.rise = burst(wishes, new THREE.Vector3(cx, 0.6, cz), { spread: 0.4, rise: 2.4 }); },
      tick(k) {
        const t = Math.min(1, k / this.land), b = this.ball;
        b.visible = t < 1;
        b.position.lerpVectors(this.from, new THREE.Vector3(cx, 0.5, cz), t);
        b.position.y += Math.sin(t * Math.PI) * 1.3;
        b.rotation.set(t * 9, 0, t * 4);
        crank.rotation.x = k * 4;
        const u = (k - this.land) / (1 - this.land);
        rings.forEach((m, i) => ringAt(m, cx, 0.51, cz, (u - i * 0.12) / 0.5, 0.65));
        if (u > 0) this.splash(Math.min(1, u * 2));
        if (this.o.win) {
          const w = Math.max(0, (k - 0.35) / 0.65);
          column.material.opacity = Math.sin(w * Math.PI) * 0.35;
          water.material.emissiveIntensity = 0.25 + Math.sin(w * Math.PI) * 1.5;
          if (w > 0) this.rise(w);
        }
      } },
  };
}

/* the Item Ball: a Poké Ball lying in a patch of the games' tall grass (or a Voltorb...) */

function tallGrass(cx, cz, w, d, L, rnd, clear) {
  const cols = L.look === 'rock' ? ['#a8a058', '#88883c', '#5e6028'] : [L.grass[0], L.grass[1], L.grass[2]];
  const mats = cols.map(c => std({ color: c, roughness: 0.9, flatShading: true }));
  const clumps = [];
  for (let x = -w / 2 + 0.15; x <= w / 2; x += 0.3) for (let z = -d / 2 + 0.15; z <= d / 2; z += 0.3) {
    const g = new THREE.Group();
    g.position.set(cx + x + (rnd() - 0.5) * 0.12, 0, cz + z + (rnd() - 0.5) * 0.12);
    if (Math.hypot(g.position.x - clear.x, g.position.z - clear.z) < 0.32) continue;   // round the ball, so it shows
    for (let k = 0; k < 4; k++) {
      const h = 0.36 + rnd() * 0.22, m = mesh(new THREE.ConeGeometry(0.07, h, 4), mats[k % 3], (rnd() - 0.5) * 0.15, h / 2, (rnd() - 0.5) * 0.12, g);
      m.rotation.set((rnd() - 0.5) * 0.35, rnd() * 3, (rnd() - 0.5) * 0.45);
      m.raycast = () => {};
    }
    B.group.add(g);
    clumps.push({ g, phase: rnd() * 6, near: Math.hypot(x, z) });
  }
  return clumps;
}

function voltorbEyes(top) {
  const eyes = new THREE.Group();
  const white = std({ color: '#ffffff', roughness: 0.4 }), black = std({ color: '#101010', roughness: 0.4 });
  for (const s of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(0.045, 12, 8), white, s * 0.06, 0.07, 0.15, eyes);
    e.scale.set(1.2, 0.8, 0.4);
    mesh(new THREE.SphereGeometry(0.022, 8, 6), black, s * 0.055, 0.07, 0.17, eyes);
    const brow = mesh(new THREE.BoxGeometry(0.08, 0.014, 0.01), black, s * 0.06, 0.115, 0.165, eyes);
    brow.rotation.z = s * 0.45;
  }
  top.add(eyes);
  return eyes;
}

async function buildItemball(figs, { look: L, time }) {
  const rnd = wild(L, time, { to: 3, trees: [[0, 0, 1.4], [10, 0, 1.3], [2, 0, 1.1], [8, 0, 1.2], [0, 4, 1], [10, 3, 1.1], [10, 6, 0.9]] });
  B.shotTop = 2.6;
  const cx = tileX(5), cz = tileZ(2.4);
  const clumps = tallGrass(cx, cz, 2.6, 1.6, L, rnd, { x: cx, z: cz + 0.6 });
  // the ball: red top on a hinge, white bottom, the black band and its button
  const ball = new THREE.Group();
  ball.position.set(cx, 0.17, cz + 0.6);
  B.group.add(ball);
  const red = std({ color: '#e83828', roughness: 0.3, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 }), white = std({ color: '#f4f4f8', roughness: 0.3 }), black = std({ color: '#202026', roughness: 0.4 });
  mesh(new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), white, 0, 0, 0, ball);
  const hinge = new THREE.Group();
  hinge.position.set(0, 0, -0.17);
  ball.add(hinge);
  const top = new THREE.Group();
  top.position.set(0, 0, 0.17);
  hinge.add(top);
  mesh(new THREE.SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), red, 0, 0, 0, top);
  mesh(new THREE.CircleGeometry(0.17, 24), std({ color: '#f4e8c8', side: THREE.DoubleSide }), 0, 0.001, 0, top).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.173, 0.173, 0.03, 24), black, 0, 0, 0, ball);
  const ring = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), black, 0, 0, 0.165, ball);
  ring.rotation.x = Math.PI / 2;
  const button = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.035, 20), white, 0, 0, 0.175, ball);
  button.rotation.x = Math.PI / 2;
  const eyes = voltorbEyes(top);
  ball.traverse(o => { o.userData.spot = 0; });
  const scorch = mesh(new THREE.CircleGeometry(0.7, 28), new THREE.MeshBasicMaterial({ color: '#1a1410', transparent: true, opacity: 0, depthWrite: false }), cx, 0.012, cz + 0.6);
  scorch.rotation.x = -Math.PI / 2; scorch.raycast = () => {};
  B.blocked.add(key(5, 2));
  B.spots = [{ step: { x: 5, y: 3 } }];
  B.anchors[0] = new THREE.Vector3(cx, 1.15, cz + 0.6);
  tufts(L, 50, rnd);
  let rustle = 0;
  B.ticks.push((now) => {
    if (calm) return;
    const walking = walker.path.length && Math.abs(walker.x - cx) < 1.6 && walker.z < cz + 1.4;
    for (const c of clumps) c.g.rotation.z = Math.sin(now / 900 + c.phase) * 0.05 + (walking || rustle ? Math.sin(now / 70 + c.phase) * 0.12 * (rustle || 0.6) * Math.max(0, 1 - c.near / 1.6) : 0);
  });
  const flash = sprite(sparkArt('#ffffff'), 1);
  const sparks = Array.from({ length: 12 }, (_, i) => sprite(sparkArt(i % 2 ? '#fff8c0' : '#ffffff'), 0.22));
  const smoke = (() => { const { c, g } = fine(16, 16, 8), grd = g.createRadialGradient(8, 8, 0, 8, 8, 8); grd.addColorStop(0, 'rgba(90,80,80,0.9)'); grd.addColorStop(1, 'rgba(90,80,80,0)'); g.fillStyle = grd; g.fillRect(0, 0, 16, 16); return c; })();
  const puffs = Array.from({ length: 10 }, () => sprite(smoke, 0.8));
  B.reset = () => { ball.visible = true; ball.rotation.set(0, 0, 0); hinge.rotation.x = 0; eyes.visible = false; red.emissiveIntensity = 0; scorch.material.opacity = 0; flash.visible = false; };
  B.reset();
  B.acts = {
    pickup: { ms: (o) => (o?.trap ? 2600 : 1800), cues: (o) => (o?.trap ? [[0.05, 'rustle'], [0.6, 'hit']] : [[0.05, 'rustle'], [0.45, 'ball-open']]),
      start(o) { this.trap = !!o?.trap; this.pop = burst(sparks, new THREE.Vector3(cx, 0.4, cz + 0.6), { spread: 0.4, rise: 1.2 }); this.boom = burst(puffs, new THREE.Vector3(cx, 0.3, cz + 0.6), { spread: 0.9, rise: 1.4 }); },
      tick(k) {
        rustle = k < 0.3 ? 1 : 0;
        walker.lunge = Math.sin(Math.min(1, k / 0.3) * Math.PI) * 0.3;
        const wob = k > 0.12 && k < 0.42 ? Math.sin((k - 0.12) / 0.3 * Math.PI * 6) * 0.35 * Math.sin((k - 0.12) / 0.3 * Math.PI) : 0;
        ball.rotation.z = wob;
        if (!this.trap) {
          const u = Math.max(0, (k - 0.45) / 0.2);
          hinge.rotation.x = -1.9 * ease(Math.min(1, u));
          flash.visible = u > 0 && u < 1.5;
          flash.position.set(cx, 0.45, cz + 0.65); flash.scale.setScalar(0.4 + u * 1.2); flash.material.opacity = Math.max(0, 1 - u / 1.5);
          if (u > 0) this.pop(Math.min(1, (k - 0.45) / 0.55));
          return;
        }
        // a Voltorb: it opens its eyes, flashes faster and faster, and blows up
        eyes.visible = k > 0.35;
        if (k > 0.35) ball.rotation.y = Math.sin(k * 60) * 0.06;
        red.emissiveIntensity = k > 0.35 && k < 0.6 ? (Math.sin((k - 0.35) * (40 + k * 120)) > 0 ? 0.9 : 0) : 0;
        if (k >= 0.6) {
          const u = (k - 0.6) / 0.4;
          ball.visible = false;
          flash.visible = u < 0.5;
          flash.position.set(cx, 0.4, cz + 0.65); flash.scale.setScalar(1 + u * 5); flash.material.opacity = 1 - u * 2;
          this.boom(u);
          scorch.material.opacity = Math.min(0.55, u * 2);
          walker.oz = Math.sin(Math.min(1, u * 2) * Math.PI / 2) * 0.5;
          walker.oy = Math.sin(Math.min(1, u * 2.5) * Math.PI) * 0.3;
        }
      } },
  };
}

/* Team Rocket: a black-and-red roadblock with the R board, the grunt and their Alpha standing at it, a bush to run
   through; no way back the way you came */

function stripes() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 16;
  const g = c.getContext('2d');
  g.fillStyle = '#202028'; g.fillRect(0, 0, 128, 16);
  g.fillStyle = '#e03830';
  for (let x = -16; x < 140; x += 16) { g.beginPath(); g.moveTo(x, 16); g.lineTo(x + 8, 0); g.lineTo(x + 16, 0); g.lineTo(x + 8, 16); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(3, 1);
  return t;
}

function rArt() {
  const f = fine(24, 24, 10), { g, rr } = f;
  rr(0, 0, 24, 24, 2, '#101014');
  rr(1.5, 1.5, 21, 21, 1.5, '#f4f4f8');
  g.fillStyle = '#e03830'; g.font = '900 19px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('R', 12, 13);
  return f.c;
}

async function buildRocket(figs, { look: L, time }) {
  const rnd = wild(L, time, { to: 2, trees: [[0, 0, 1.4], [10, 0, 1.3], [0, 2, 1.1], [10, 2, 1.2], [0, 5, 1], [1, 6, 0.9]], exit: false });
  B.shotTop = 3.0;
  const z = tileZ(1), board = std({ map: stripes(), roughness: 0.6 }), legs = std({ color: '#303038', roughness: 0.6 });
  for (const y of [0.5, 0.95]) box(5.2, 0.28, 0.08, [legs, legs, legs, legs, board, board], 0, y, z);
  for (const x of [-2.4, 0, 2.4]) for (const s of [-1, 1]) { const l = box(0.08, 1.25, 0.08, legs, x, 0.6, z + s * 0.12); l.rotation.x = s * 0.22; }
  box(0.1, 1.9, 0.1, legs, 1.3, 0.95, z - 0.12);
  const r = panel(rArt(), 0.8, 0.8, 1.3, 1.75, z - 0.05);
  r.castShadow = true;
  for (let x = 2; x <= 8; x++) B.blocked.add(key(x, 1));
  // the bush you'd run through
  const leaf = L.leaf || ['#b8b060', '#88883c', '#5e6028', '#2a2a10'];
  const bush = new THREE.Group();
  bush.position.set(tileX(7.4), 0, tileZ(3.4));
  B.group.add(bush);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, d = i ? 0.38 : 0;
    mesh(new THREE.IcosahedronGeometry(0.42 + rnd() * 0.15, 1), std({ color: leaf[Math.floor(rnd() * 3)], roughness: 0.9, flatShading: true }), Math.cos(a) * d, 0.45 + (i ? rnd() * 0.25 : 0.35), Math.sin(a) * d * 0.7, bush);
  }
  bush.traverse(o => { o.userData.spot = 2; });
  B.blocked.add(key(7, 3));
  B.who.trainer = await figure('trainer', figs.trainer ?? { src: 'assets/trainers/grunt-m.gif' }, { x: 3, ty: 2, dz: -0.2, scale: 0.94, feet: true });
  B.who.mon = await figure('mon', figs.mon ?? { src: 'assets/pokemon/rattata-front.gif', alpha: true }, { x: 5, ty: 2, dz: -0.2, scale: (figs.mon ?? {}).alpha === false ? 1 : 1.35 });
  B.who.trainer.group.traverse(o => { o.userData.spot = 0; });
  B.who.mon.group.traverse(o => { o.userData.spot = 1; });
  B.blocked.add(key(3, 2)); B.blocked.add(key(5, 2));
  B.spots = [{ step: { x: 3, y: 4 } }, { step: { x: 5, y: 4 } }, { step: { x: 7, y: 4 } }];
  B.anchors[0] = new THREE.Vector3(tileX(3), 2.35, tileZ(2) - 0.2);
  B.anchors[1] = new THREE.Vector3(tileX(5), 2.15, tileZ(2) - 0.2);
  B.anchors[2] = new THREE.Vector3(tileX(7.4), 1.6, tileZ(3.4));
  tufts(L, 50, rnd);
  const gold = std({ color: '#f8c830', metalness: 0.8, roughness: 0.3 });
  const coins = [0, 1, 2].map(() => { const c = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 14), gold, 0, 0, 0); c.visible = false; c.raycast = () => {}; return c; });
  const leaves = Array.from({ length: 10 }, (_, i) => sprite(heartArt(leaf[i % 3]), 0.16));
  B.acts = {
    pay: { ms: 1400, start() { this.from = new THREE.Vector3(walker.x, 0.7, walker.z); },
      tick(k) {
        const hand = new THREE.Vector3(tileX(3) + 0.15, 1.05, tileZ(2) - 0.1);
        coins.forEach((c, i) => {
          const t = Math.max(0, Math.min(1, (k - i * 0.15) / 0.5));
          c.visible = t > 0 && t < 1;
          c.position.lerpVectors(this.from, hand, t); c.position.y += Math.sin(t * Math.PI) * 0.8; c.rotation.x = t * 12;
        });
      }, cues: [[0.4, 'fx-coin'], [0.55, 'fx-coin'], [0.7, 'fx-coin']] },
    run: { ms: 1500, start() { this.fly = burst(leaves, new THREE.Vector3(bush.position.x, 0.8, bush.position.z), { spread: 0.6, rise: 0.9 }); },
      tick(k) {
        const t = ease(Math.min(1, k / 0.4));
        walker.ox = (bush.position.x - walker.x) * t * 0.9; walker.oz = (bush.position.z - walker.z) * t * 0.9;
        walker.oy = Math.sin(t * Math.PI) * 0.2;
        const s = k > 0.3 ? Math.sin((k - 0.3) * 40) * 0.12 * (1 - k) : 0;
        bush.rotation.z = s; bush.scale.set(1 + Math.abs(s) * 0.5, 1 - Math.abs(s) * 0.4, 1);
        if (k > 0.3) this.fly((k - 0.3) / 0.7);
      }, cues: [[0.3, 'rustle'], [0.55, 'rustle']] },
  };
}

/* ---------- a Gym Leader's gym (js/gym.js): walked in before their boss, a long hall in the biome's own ground. Stone
   statues of their Pokémon guard the doorway, an avenue of fire pillars runs up either side of the battle court, each
   pair lighting with a drum beat as you pass, and at the far end the leader stands on a two-tier dais before a round stone arch on
   fluted columns, GYM LEADER and their name carved on its lintel, their badge turning in the lunette over it in a sunburst (in full colour, shining brighter once earned), fire on the lintel's ends, light pouring down on the dais; as they speak the great braziers flare with a gong and the shot
   draws in on them. ---------- */

const GYM_INK = { clearing: '#4aa04a', shrine: '#d84838', wastes: '#e0602a', ruins: '#2f94b8', thornwood: '#2e7a3a', savanna: '#e0a030' };
const AVENUE = [12, 10, 8, 6, 4];   // the fire pillars' rows, from the door up
const MID = 6;                      // the hall's middle column (13 wide)

/** Pokéball, painted at `x`, `y`, radius `r`, onto a fine() painting. */
function ballMark(g, x, y, r, top = '#e83c30') {
  g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = top; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill();
  g.fillStyle = '#28242c'; g.fillRect(x - r, y - r * 0.12, r * 2, r * 0.24);
  g.beginPath(); g.arc(x, y, r * 0.36, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(x, y, r * 0.2, 0, Math.PI * 2); g.fill();
}

/** The ground: a flagstone causeway from the door to the court, the court (your half blue, theirs in the gym's colour,
    white lines, a Poké Ball at the middle), then the causeway on up to the dais. */
function court(ink, L) {
  return (c) => {
    const g = c.getContext('2d'), T = 16, x0 = 4 * T + 2, x1 = 9 * T - 2, y0 = 4 * T + 2, y1 = 12 * T - 2, mid = (y0 + y1) / 2, r = seeded(61);
    g.save();
    const flags = (from, to) => {
      for (let y = from; y < to; y += 8) for (let x = MID * T - 4 + ((y / 8) % 2) * 4; x < (MID + 1) * T + 4; x += 8) {
        g.fillStyle = L.stone[1 + Math.floor(r() * 2)]; g.globalAlpha = 0.9;
        g.beginPath(); g.roundRect(x + 0.4, y + 0.4, 7.2, 7.2, 1.2); g.fill();
      }
    };
    flags(y1, ROWS * T); flags(2 * T, y0);
    g.globalAlpha = 0.22; g.fillStyle = ink; g.fillRect(x0, y0, x1 - x0, mid - y0);
    g.fillStyle = '#3a78d8'; g.fillRect(x0, mid, x1 - x0, y1 - mid);
    g.globalAlpha = 0.85; g.strokeStyle = '#ffffff'; g.lineWidth = 1.2;
    g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    g.beginPath(); g.moveTo(x0, mid); g.lineTo(x1, mid); g.stroke();
    g.strokeRect(x0 + 1.2 * T, y0, x1 - x0 - 2.4 * T, 1.1 * T);
    g.strokeRect(x0 + 1.2 * T, y1 - 1.1 * T, x1 - x0 - 2.4 * T, 1.1 * T);
    g.beginPath(); g.arc((x0 + x1) / 2, mid, 1.4 * T, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 0.9;
    ballMark(g, (x0 + x1) / 2, mid, 0.9 * T, ink);
    g.restore();
    return c;
  };
}

/** The arch's lintel: a dark stone plaque trimmed in gold, GYM LEADER over their name between two Poké Balls in the
    gym's colour (the user's call, 2026-10-13: the hinge's LCD already says POKéMON GYM, and the name ribbon hid the badge). */
function gymPlaqueArt(ink, name) {
  const f = fine(64, 14, 8), { g, rr, lin } = f;
  rr(0, 0, 64, 14, 2.4, '#1e1a22');
  rr(1, 1, 62, 12, 1.8, lin(0, 0, 0, 14, ['#3a3440', '#2a2430', '#1a161e']));
  g.strokeStyle = '#e8c050'; g.lineWidth = 0.5; g.beginPath(); g.roundRect(2.2, 2.2, 59.6, 9.6, 1.2); g.stroke();
  ballMark(g, 7, 7, 3, ink); ballMark(g, 57, 7, 3, ink);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const carve = (text, y, px, room) => {
    g.font = `900 ${px}px "Trebuchet MS", sans-serif`;
    const k = Math.min(1, room / g.measureText(text).width);
    g.save(); g.translate(32, y); g.scale(k, 1);
    g.fillStyle = '#5a3a10'; g.fillText(text, 0.3, 0.4);
    g.fillStyle = lin(0, -px / 2, 0, px / 2, ['#fff4b0', '#f0c850', '#b07a20']); g.fillText(text, 0, 0);
    g.restore();
  };
  carve('GYM LEADER', 4.6, 2.6, 30);
  carve(name.toUpperCase(), 8.6, 5, 40);
  return f.c;
}

/** Light pouring down on the dais: a soft band, bright at the top, fading to nothing at its foot. */
function shaftArt(col) {
  const { c, g } = fine(8, 32, 8), l = g.createLinearGradient(0, 0, 0, 32);
  l.addColorStop(0, col); l.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = l; g.fillRect(0, 0, 8, 32);
  const e = g.createLinearGradient(0, 0, 8, 0);
  e.addColorStop(0, 'rgba(0,0,0,1)'); e.addColorStop(0.3, 'rgba(0,0,0,0)'); e.addColorStop(0.7, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = e; g.fillRect(0, 0, 8, 32);
  return c;
}

/** Rays round the badge, a sunburst in the gym's colour turning slowly behind it. */
function burstArt(col) {
  const { c, g } = fine(32, 32, 8);
  g.translate(16, 16);
  for (let i = 0; i < 16; i++) {
    g.rotate(Math.PI / 8);
    const l = g.createLinearGradient(0, 0, 16, 0);
    l.addColorStop(0, col); l.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = l; g.globalAlpha = i % 2 ? 0.55 : 1;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(16, -1.6); g.lineTo(16, 1.6); g.closePath(); g.fill();
  }
  return c;
}

/** The leader's badge as a painting for the crest, in full colour even before it's won, so you see what you're fighting for. */
async function crestArt(id) {
  const { badgeArt } = await import('./trainercard.js');
  const img = new Image();
  img.src = badgeArt(`gym-${id}`, true);
  await img.decode().catch(() => {});
  const f = fine(36, 36, 8);
  try { f.g.drawImage(img, 0, 0, 36, 36); } catch {}
  return f.c;
}

/** The crest over the arch: the leader's badge, a thick cut-out turning slowly in a glow, a ring of motes round it. */
async function gymCrest(leader, ink, y, z, back = z - 0.3) {
  const earned = !!leader && gymWins(getSave(), leader.id) > 0;
  const art = await crestArt(leader?.id), map = texOf(art), group = new THREE.Group(), size = 1.5;
  const face = std({ map, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, metalness: earned ? 0.5 : 0.1, roughness: 0.35 });
  if (earned) { face.emissive = new THREE.Color('#ffffff'); face.emissiveMap = map; face.emissiveIntensity = 0.25; }
  const edge = std({ map, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, color: earned ? '#8a6020' : '#3a3440', roughness: 0.6 });
  const plane = new THREE.PlaneGeometry(size, size);
  for (let i = 0; i <= 8; i++) {
    const m = new THREE.Mesh(plane, i === 0 || i === 8 ? face : edge);
    m.position.z = (i - 4) * 0.014;
    m.castShadow = i === 4;
    group.add(m);
  }
  const glowCol = earned ? '#ffe9a0' : ink;
  const halo = sprite(haloArt(glowCol), 3.2);
  const burst = sprite(burstArt(glowCol), 4.4);
  burst.visible = true;
  burst.material.blending = THREE.AdditiveBlending;
  burst.material.opacity = earned ? 0.55 : 0.35;
  burst.position.set(0, y, back);
  halo.visible = true;
  halo.material.blending = THREE.AdditiveBlending;
  halo.material.opacity = earned ? 0.7 : 0.4;
  halo.position.set(0, y, z - 0.2);
  const motes = Array.from({ length: 10 }, (_, i) => {
    const s = sprite(sparkArt(i % 2 ? '#fff4b0' : ink), 0.16);
    s.visible = true;
    return s;
  });
  group.position.set(0, y, z);
  B.group.add(group);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(size * 0.62, 0.035, 8, 48), std({ color: '#e8c050', metalness: 0.8, roughness: 0.25 }));
  ring.position.set(0, y, z - 0.12);
  B.group.add(ring);
  // out in front of the arch and drawn over it, so turning or spinning it never sinks into the stones (the user's ask)
  for (const o of [ring, ...group.children]) { o.material.depthTest = false; o.renderOrder = 2; }
  let spinUntil = 0;
  const parts = [group, ring, halo, burst, ...motes];
  return {
    flare() { spinUntil = performance.now() + 1400; },
    /** Where it is on the screen, in CSS px: its middle and its half width (badgeGet() in js/gym.js lays the badge over it). */
    at() {
      const r = view.getBoundingClientRect(), on = (v) => { v.project(camera); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; };
      const [x, y] = on(new THREE.Vector3(0, group.position.y, z)), [ex] = on(new THREE.Vector3(size / 2, group.position.y, z));
      return { x, y, r: Math.abs(ex - x) };
    },
    show(on) { for (const o of parts) o.visible = on; },
    tick(now) {
      if (calm) return;
      const fast = Math.max(0, (spinUntil - now) / 1400);
      group.rotation.y = Math.sin(now / 1800) * 0.55 + fast * fast * Math.PI * 4;
      group.position.y = y + Math.sin(now / 900) * 0.06;
      ring.rotation.z = now / 2600;
      burst.material.rotation = now / 9000;
      burst.material.opacity = (earned ? 0.5 : 0.3) + Math.sin(now / 700) * 0.06 + fast * 0.4;
      halo.material.opacity = (earned ? 0.6 : 0.32) + Math.sin(now / 500) * 0.08 + fast * 0.5;
      motes.forEach((s, i) => {
        const a = now / 1600 + i * Math.PI * 2 / motes.length;
        s.position.set(Math.cos(a) * 1.15, y + Math.sin(a) * 0.95 + Math.sin(now / 300 + i) * 0.05, z + Math.sin(a * 2) * 0.1);
      });
    },
  };
}

/** A flame: a teardrop from a white-hot core out to the fire's colour. */
function flameArt(col) {
  const { c, g } = fine(16, 24, 8);
  const tear = (s) => { g.beginPath(); g.moveTo(8, 24 - 22 * s); g.bezierCurveTo(8 + 7 * s, 24 - 12 * s, 8 + 7 * s, 23, 8, 23); g.bezierCurveTo(8 - 7 * s, 23, 8 - 7 * s, 24 - 12 * s, 8, 24 - 22 * s); g.fill(); };
  g.fillStyle = col; g.globalAlpha = 0.85; tear(1);
  g.fillStyle = '#ffd860'; g.globalAlpha = 0.95; tear(0.68);
  g.fillStyle = '#fffbe8'; tear(0.36);
  return c;
}

/** A soft round glow, drawn over a fire so it lights the air round it (no light of its own: a dozen would cost a phone). */
function haloArt(col) {
  const { c, g } = fine(16, 16, 8), l = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  l.addColorStop(0, col); l.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = l; g.fillRect(0, 0, 16, 16);
  return c;
}

/** A fire in a stone bowl at tile `tx`, `ty`, on a pillar `tall` high; `big` ones light the court (a point light). */
function brazier(tx, ty, L, fire, { tall = 0.95, big = false } = {}) {
  const x = tileX(tx), z = tileZ(ty), stone = std({ color: L.stone[1], roughness: 0.9 }), dark = std({ color: L.stone[3], roughness: 0.9 });
  const w = big ? 1.25 : 1;
  mesh(rbox(0.5 * w, 0.14, 0.5 * w, 0.04), dark, x, 0.07, z);
  mesh(new THREE.CylinderGeometry(0.15 * w, 0.2 * w, tall, 10), stone, x, tall / 2 + 0.1, z);
  mesh(new THREE.CylinderGeometry(0.34 * w, 0.2 * w, 0.22, 14), dark, x, tall + 0.2, z);
  const ember = mesh(new THREE.CylinderGeometry(0.26 * w, 0.26 * w, 0.02, 14), new THREE.MeshBasicMaterial({ color: '#ff7030', toneMapped: false }), x, tall + 0.31, z);
  ember.raycast = () => {};
  const flame = sprite(flameArt(fire), 0.5);
  flame.visible = true;
  flame.center.set(0.5, 0);
  flame.position.set(x, tall + 0.28, z);
  const halo = sprite(haloArt(fire), 1.4 * w);
  halo.material.blending = THREE.AdditiveBlending;
  halo.material.opacity = 0.5;
  halo.position.set(x, tall + 0.6, z);
  let light = null;
  if (big) {
    light = new THREE.PointLight('#ffb060', 2.4, 6, 1.5);
    light.position.set(x, tall + 0.8, z);
    B.group.add(light);
  }
  B.blocked.add(key(tx, ty));
  return { flame, halo, light, ember, w, z, seed: tx * 7 + ty, lit: true, at: 0 };
}

/** A fire in a small gold bowl on the arch's lintel, lit with the great braziers. */
function lintelFire(x, y, z, fire) {
  const gold = std({ color: '#e8c050', metalness: 0.75, roughness: 0.3 });
  mesh(new THREE.CylinderGeometry(0.26, 0.14, 0.2, 14), gold, x, y, z);
  const ember = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.02, 14), new THREE.MeshBasicMaterial({ color: '#ff7030', toneMapped: false }), x, y + 0.1, z);
  ember.raycast = () => {};
  const flame = sprite(flameArt(fire), 0.5);
  flame.visible = true;
  flame.center.set(0.5, 0);
  flame.position.set(x, y + 0.08, z);
  const halo = sprite(haloArt(fire), 1.4);
  halo.material.blending = THREE.AdditiveBlending;
  halo.position.set(x, y + 0.4, z);
  return { flame, halo, light: null, ember, w: 1, z, seed: Math.round(x * 13), lit: true, at: 0 };
}

/** A fire's look this frame: out (an ember), lighting (whooshing up past its size and settling) or burning. */
function tickFire(f, now) {
  const since = now - f.at, up = !f.lit ? 0 : calm || since > 700 ? 1 : since < 220 ? ease(since / 220) * 1.6 : 1.6 - ease((since - 220) / 480) * 0.6;
  const k = calm ? 0 : Math.sin(now / 90 + f.seed) * 0.5 + Math.sin(now / 37 + f.seed * 3) * 0.5;
  f.flame.visible = up > 0.02;
  f.flame.scale.set((0.42 + k * 0.04) * f.w * up, (0.66 + k * 0.1) * f.w * up, 1);
  f.halo.visible = up > 0.02;
  f.halo.material.opacity = Math.min(1, up) * (0.42 + k * 0.06);
  f.ember.material.color.set(f.lit ? '#ffd070' : '#a83818');
  if (f.light) f.light.intensity = (2.4 + k * 0.4) * Math.min(1.4, up);
}

/** A stone statue of a Pokémon from its sprite's first frame, grey with the light kept, on a plinth with a gold plate. */
/** A Pokémon's sprite's first frame in grey stone, the light kept, standing on its feet at `x`, `y`, `z`, `k` times life size. */
async function stoneBoard(src, L, x, y, z, k = 1) {
  const bmp = await bitmap(src).catch(() => null);
  if (!bmp) return null;
  const w = bmp.width, h = bmp.height, c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  const img = g.getImageData(0, 0, w, h), d = img.data, lo = new THREE.Color(L.stone[3]), hi = new THREE.Color('#f4efe6'), col = new THREE.Color();
  let bottom = 0, left = w, right = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    const p = i / 4, lum = Math.min(1, Math.max(0, ((0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255 - 0.5) * 1.3 + 0.55));
    col.copy(lo).lerp(hi, lum);
    d[i] = col.r * 255; d[i + 1] = col.g * 255; d[i + 2] = col.b * 255; d[i + 3] = 255;
    bottom = Math.max(bottom, Math.floor(p / w)); left = Math.min(left, p % w); right = Math.max(right, p % w);
  }
  g.putImageData(img, 0, 0);
  const px = MON_PX * 0.85 * k, board = new THREE.Mesh(new THREE.PlaneGeometry(w * px, h * px), std({ map: tex(c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95 }));
  board.geometry.translate((w / 2 - (left + right + 1) / 2) * px, (bottom + 1 - h / 2) * px, 0);
  board.rotation.x = -PITCH;
  board.position.set(x, y, z);
  board.castShadow = true;
  B.group.add(board);
  return board;
}

async function statue(src, tx, ty, L, ink) {
  const x = tileX(tx), z = tileZ(ty), stone = std({ color: L.stone[1], roughness: 0.9 }), dark = std({ color: L.stone[3], roughness: 0.9 });
  mesh(rbox(1.0, 0.16, 1.0, 0.04), dark, x, 0.08, z);
  mesh(rbox(0.82, 0.62, 0.82, 0.05), stone, x, 0.47, z);
  mesh(rbox(0.94, 0.1, 0.94, 0.03), dark, x, 0.83, z);
  mesh(new THREE.BoxGeometry(0.42, 0.16, 0.02), std({ color: '#e8c050', metalness: 0.7, roughness: 0.3 }), x, 0.5, z + 0.42);
  mesh(new THREE.BoxGeometry(0.82, 0.05, 0.84), std({ color: ink, roughness: 0.7 }), x, 0.2, z);
  B.blocked.add(key(tx, ty));
  if (src) await stoneBoard(src, L, x, 0.88, z);
}

/** The gym's back: a dark stone wall in place of the woods, a colonnade before it, and their ace twice over in stone,
    colossi on tall plinths flanking the arch (the user's picks, 2026-10-13). */
async function gymBack(L, ink, ace) {
  const wz = BACK_Z + 0.12, wall = std({ color: shadeOf(L.stone[3], -1), roughness: 0.9 }), stone = std({ color: L.stone[1], roughness: 0.85 });
  const dark = std({ color: L.stone[3], roughness: 0.9 }), inkStone = std({ color: shadeOf(ink, -1), roughness: 0.8 });
  mesh(new THREE.BoxGeometry(COLS + 0.8, 7.2, 0.12), wall, 0, 3.6, wz - 0.06).raycast = () => {};
  mesh(rbox(COLS + 0.9, 0.4, 0.7, 0.06), dark, 0, 7.2, wz).raycast = () => {};
  mesh(new THREE.BoxGeometry(COLS + 0.8, 0.12, 0.05), inkStone, 0, 6.85, wz + 0.02).raycast = () => {};
  for (let x = -COLS / 2 + 0.6; x <= COLS / 2 - 0.5; x += 1.45) {
    if (Math.abs(x) < 3.4) continue;   // the arch stands there
    const col = mesh(new THREE.CylinderGeometry(0.22, 0.26, 6.6, 14), stone, x, 3.4, wz + 0.25); col.raycast = () => {};
    mesh(rbox(0.6, 0.22, 0.6, 0.04), dark, x, 6.8, wz + 0.25).raycast = () => {};
    mesh(rbox(0.6, 0.2, 0.6, 0.04), dark, x, 0.1, wz + 0.25).raycast = () => {};
  }
  if (!ace) return;
  for (const sx of [-1, 1]) {
    const x = sx * 3.8, z = wz + 0.6, tall = 2.4;
    mesh(rbox(1.2, tall, 0.9, 0.06), dark, x, tall / 2, z).raycast = () => {};
    mesh(rbox(1.32, 0.14, 1.02, 0.04), inkStone, x, tall, z).raycast = () => {};
    mesh(rbox(1.32, 0.14, 1.02, 0.04), inkStone, x, 0.07, z).raycast = () => {};
    const b = await stoneBoard(ace, L, x, tall + 0.05, z, 2.2);
    if (b) { b.raycast = () => {}; b.scale.x = sx; b.rotation.x = 0; }   // upright: leaning back like the others, it sank into the wall
  }
}

/** The arch behind the dais: fluted columns on stepped bases, the lintel the plaque hangs on, and a round arch of wedge
    stones over it, a gold-trimmed keystone with a gem in the biome's colour, its lunette glowing with the great fires
    (the user's ask, 2026-10-13: the square posts read as a doorframe). Returns the lintel's fires, the lunette's
    material, which the gym's tick lights, and the lintel's height for the plaque. */
function gymArch(L, ink, fire, az) {
  const stoneA = std({ color: L.stone[1], roughness: 0.85 }), stoneB = std({ color: L.stone[3], roughness: 0.9 });
  const pale = std({ color: shadeOf(L.stone[1], 1), roughness: 0.8 }), inkStone = std({ color: shadeOf(ink, -1), roughness: 0.75 });
  const gold = std({ color: '#e8c050', metalness: 0.75, roughness: 0.3 });
  const glow = new THREE.MeshBasicMaterial({ color: shadeOf(ink, 1), toneMapped: false });
  const flat = (o) => { o.raycast = () => {}; return o; };
  const ring = (r, t, y, x, m) => { const o = flat(mesh(new THREE.TorusGeometry(r, t, 8, 32), m, x, y, az)); o.rotation.x = Math.PI / 2; return o; };
  const shaft = (h) => {
    const g = new THREE.CylinderGeometry(0.27, 0.3, h, 64, 1), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z);
      if (r < 0.01) continue;
      const k = 1 - 0.07 * Math.max(0, Math.cos(Math.atan2(z, x) * 16)) ** 2;
      pos.setX(i, x * k); pos.setZ(i, z * k);
    }
    g.computeVertexNormals();
    return g;
  };
  const top = 3.13, low = 0.3, neck = top - 0.31;
  for (const s of [-1, 1]) {
    const x = s * 2.5;
    mesh(rbox(1.0, 0.16, 1.0, 0.04), stoneB, x, 0.08, az);
    mesh(rbox(0.84, 0.16, 0.84, 0.04), stoneA, x, 0.23, az);
    ring(0.31, 0.05, low + 0.05, x, gold);
    mesh(shaft(neck - low), pale, x, (low + neck) / 2, az);
    ring(0.3, 0.06, 1.1, x, inkStone);
    ring(0.31, 0.015, 1.1, x, glow);
    ring(0.28, 0.035, neck - 0.04, x, gold);
    mesh(new THREE.CylinderGeometry(0.45, 0.29, 0.18, 32), stoneA, x, neck + 0.09, az);
    mesh(rbox(0.96, 0.13, 0.96, 0.03), stoneB, x, top - 0.065, az);
  }
  const ly = top + 0.475, spring = ly + 0.475 + 0.12;
  mesh(rbox(6.1, 0.95, 0.8, 0.08), stoneB, 0, ly, az);
  mesh(rbox(6.4, 0.12, 0.86, 0.03), gold, 0, ly + 0.535, az);
  const torches = [-1, 1].map(s => lintelFire(s * 2.88, spring + 0.1, az, fire));
  // the arch: wedge stones in two shades, the keystone standing proud
  const ri = 1.85, ro = 2.32, n = 11, gap = 0.014, depth = 0.62;
  const wedge = (a0, a1, r0, r1, d) => {
    const sh = new THREE.Shape();
    sh.moveTo(r0 * Math.cos(a0), r0 * Math.sin(a0));
    sh.lineTo(r1 * Math.cos(a0), r1 * Math.sin(a0));
    sh.absarc(0, 0, r1, a0, a1, false);
    sh.lineTo(r0 * Math.cos(a1), r0 * Math.sin(a1));
    sh.absarc(0, 0, r0, a1, a0, true);
    const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2, curveSegments: 6 });
    g.translate(0, 0, -d / 2);
    return g;
  };
  for (let i = 0; i < n; i++) {
    const a0 = i * Math.PI / n + gap, a1 = (i + 1) * Math.PI / n - gap, keystone = i === (n - 1) / 2;
    const o = keystone ? wedge(a0 - 0.02, a1 + 0.02, ri - 0.1, ro + 0.22, depth + 0.14) : wedge(a0, a1, ri, ro, depth);
    flat(mesh(o, keystone ? inkStone : i % 2 ? stoneA : pale, 0, spring, az));
  }
  const keyTop = spring + ro + 0.22;
  flat(mesh(rbox(0.62, 0.08, depth + 0.24, 0.02), gold, 0, keyTop + 0.03, az));
  const gem = flat(mesh(new THREE.OctahedronGeometry(0.13), std({ color: ink, emissive: new THREE.Color(shadeOf(ink, 1)), emissiveIntensity: 0.8, metalness: 0.3, roughness: 0.2 }), 0, spring + ro - 0.08, az + depth / 2 + 0.12));
  gem.scale.set(1, 1.35, 0.6);
  const trim = flat(mesh(new THREE.TorusGeometry(ro + 0.04, 0.035, 8, 64, Math.PI), gold, 0, spring, az + depth / 2 + 0.01));
  trim.castShadow = false;
  flat(mesh(new THREE.TorusGeometry(ri - 0.03, 0.025, 8, 64, Math.PI), gold, 0, spring, az + depth / 2 + 0.01)).castShadow = false;
  // the lunette under it, dark stone that glows in the biome's colour once the great fires are lit
  const lunette = std({ color: shadeOf(L.stone[3], -1), roughness: 0.9, emissive: new THREE.Color(ink), emissiveIntensity: 0.12 });
  flat(mesh(new THREE.CircleGeometry(ri + 0.02, 48, 0, Math.PI), lunette, 0, spring, az - 0.26));
  return { torches, lunette, ly };
}

/** A ring of runes laid in the court round its Poké Ball, dark until the great fires light it. */
function runeRingArt(col) {
  const { c, g } = fine(64, 64, 8);
  g.translate(32, 32);
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 0.9;
  for (const r of [24, 30]) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke(); }
  const r0 = seeded(77);
  for (let i = 0; i < 24; i++) {
    g.save(); g.rotate(i * Math.PI / 12); g.translate(0, -27);
    g.beginPath();
    const n = 2 + Math.floor(r0() * 3);
    for (let k = 0; k < n; k++) { const a = (r0() - 0.5) * 3, b = (r0() - 0.5) * 3; g.moveTo(a, -2); g.lineTo(b, 2); }
    g.moveTo(-1.6, 0); g.lineTo(1.6, r0() - 0.5);
    g.stroke(); g.restore();
  }
  for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * Math.PI / 4 + Math.PI / 8); g.beginPath(); g.arc(0, -30, 1.4, 0, Math.PI * 2); g.fill(); g.restore(); }
  return c;
}

async function buildGym(figs, { look: L, time, biome, leader }) {
  const ink = GYM_INK[biome] || '#e85848', fire = L.drift?.[1] || '#f8a040';
  const sides = [];
  for (let y = 5; y < ROWS - 1; y += 2) sides.push([0, y, 1 + (y % 4) * 0.08], [COLS - 1, y + 1, 1.1 - (y % 4) * 0.05]);
  const rnd = wild(L, time, { to: 2, trees: sides, exit: false, ground: court(ink, L) });
  B.shotTop = 7.6;
  const aces = (leader?.bosses || []).map(id => ENEMY_DEFS[id]?.image).filter(Boolean);
  await gymBack(L, ink, aces[0]);
  // the dais: a broad lower tier, the leader's upper one, a carpet down both and the steps out front
  const low = 0.32, high = 0.7, dz = tileZ(1), stoneA = std({ color: L.stone[1], roughness: 0.85 }), stoneB = std({ color: L.stone[3], roughness: 0.9 });
  mesh(rbox(5.6, 0.12, 3.3, 0.05), stoneB, 0, 0.06, dz);
  mesh(rbox(5.4, low, 3.1, 0.08), stoneA, 0, low / 2, dz);
  mesh(rbox(3.2, high, 1.9, 0.08), stoneA, 0, high / 2, tileZ(0.6));
  mesh(rbox(3.4, 0.08, 2.05, 0.04), stoneB, 0, high - 0.02, tileZ(0.6));
  const carpet = std({ color: shadeOf(ink, -1), roughness: 0.9 });
  mesh(new THREE.BoxGeometry(1.1, 0.02, 3.1), carpet, 0, low + 0.01, dz).raycast = () => {};
  mesh(new THREE.BoxGeometry(1.1, 0.02, 1.9), carpet, 0, high + 0.03, tileZ(0.6)).raycast = () => {};
  for (let i = 0; i < 3; i++) mesh(rbox(1.6, low * (3 - i) / 3, 0.22, 0.03), stoneA, 0, low * (3 - i) / 6, tileZ(2.5) + 0.06 + i * 0.22);
  for (let x = MID - 2; x <= MID + 2; x++) for (let y = 0; y <= 2; y++) B.blocked.add(key(x, y));
  // a stone arch behind the dais, GYM LEADER and their name on its lintel, their badge turning in the lunette over it,
  // fire on the lintel's ends and light pouring down on the dais
  const az = BACK_Z + 0.5, { torches, lunette, ly } = gymArch(L, ink, fire, az);
  panel(gymPlaqueArt(ink, leader?.name || 'Gym Leader'), 5.2, 1.14, 0, ly, az + 0.43);
  const crest = B.crest = await gymCrest(leader, ink, 5.2, az + 0.75, az - 0.2);
  const shafts = [[-0.9, 0.12], [0.2, -0.05], [1.1, -0.14]].map(([x, tilt], i) => {
    const m = new THREE.MeshBasicMaterial({ map: texOf(shaftArt('#fff4d0')), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    const o = new THREE.Mesh(new THREE.PlaneGeometry(0.9 + i * 0.25, 6.4), m);
    o.geometry.translate(0, -3.2, 0);
    o.position.set(x, 7.2, tileZ(0.6) - 0.4);
    o.rotation.z = tilt;
    o.raycast = () => {};
    B.group.add(o);
    return o;
  });
  // a ring of runes round the court's Poké Ball, lit with the great fires, and embers rising off the stage
  const runes = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ map: texOf(runeRingArt(shadeOf(ink, 1))), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  runes.rotation.x = -Math.PI / 2;
  runes.position.set(0, 0.02, 8 - ROWS / 2);
  runes.raycast = () => {};
  B.group.add(runes);
  const embers = Array.from({ length: 26 }, (_, i) => {
    const e = sprite(sparkArt(i % 3 ? fire : shadeOf(ink, 1)), 0.12 + (i % 4) * 0.03);
    e.material.blending = THREE.AdditiveBlending;
    e.userData = { x: (Math.random() - 0.5) * 7, z: BACK_Z + 0.8 + Math.random() * 3.2, at: Math.random(), speed: 0.06 + Math.random() * 0.08, sway: Math.random() * 6 };
    return e;
  });
  for (const tx of [MID - 3, MID + 3]) B.blocked.add(key(tx, 0));   // the arch's and the colossi's feet
  // the great braziers by the steps, and the avenue of fire pillars down to the door
  const great = [brazier(MID - 3, 2, L, fire, { tall: 1.2, big: true }), brazier(MID + 3, 2, L, fire, { tall: 1.2, big: true })];
  const avenue = AVENUE.map(y => [brazier(MID - 3, y, L, fire, { tall: 1.35 }), brazier(MID + 3, y, L, fire, { tall: 1.35 })]);
  // their Pokémon in stone either side of the doorway
  await Promise.all([statue(aces[0], MID - 2, ROWS - 2, L, ink), statue(aces[1] || aces[0], MID + 2, ROWS - 2, L, ink)]);
  // tufts round the court and the causeway, never on them
  const keep = [];
  for (let x = 2; x <= COLS - 3; x++) for (let y = 2; y <= ROWS - 1; y++) if (!B.blocked.has(key(x, y)) && (Math.abs(x - MID) <= 1 || (x >= 4 && x <= 8 && y >= 4 && y <= 11))) { B.blocked.add(key(x, y)); keep.push(key(x, y)); }
  tufts(L, 70, rnd);
  for (const k of keep) B.blocked.delete(k);
  // the leader up on the dais; a tap on them walks you up to talk
  B.who.npc = await figure('npc', figs.npc, { x: MID, ty: 0.5, y: high, dz: 0, scale: 1 });
  B.who.npc.group.traverse(o => { o.userData.spot = 0; });
  // stood upright and stretched to look the same: leaning back like the others, a tall leader's head (Phil's) sank
  // behind the arch's plaque (the user's ask, 2026-10-13)
  const stretch = 1 / Math.cos(PITCH);
  B.who.npc.board.rotation.x = 0;
  B.who.npc.group.scale.y = stretch;
  // walking up the court to the steps, or a tap anywhere on the dais, is going to talk to them too (`area`, `walkUp`)
  B.spots = [{ step: { x: MID, y: 3 }, walkUp: true, area: (t) => Math.abs(t.x - MID) <= 2 && t.y <= 2 }];
  B.anchors[0] = new THREE.Vector3(0, high + B.who.npc.top * stretch + 0.3, tileZ(0.5));
  const focus = B.focus = { z: tileZ(1.5), k: 0, on: false };
  // the sparkle as they light up
  const sparks = Array.from({ length: 18 }, (_, i) => sprite(sparkArt(i % 2 ? '#fff4b0' : ink), 0.26));
  let fly = null, from = 0, enteredAt = 0;
  B.shine = () => { if (calm) return; from = performance.now(); fly = burst(sparks, new THREE.Vector3(0, high + 0.6, tileZ(0.6)), { spread: 0.8, rise: 1.8 }); };
  // the walk up: out till you're in, then each pair lights as you come level with it (all burning once they're beaten)
  B.reset = () => {
    enteredAt = performance.now();
    const lit = !!opts?.spent;
    for (const f of [...avenue.flat(), ...great, ...torches]) { f.lit = lit; f.at = 0; }
    focus.on = false; focus.k = 0;
    crest.show(true);
  };
  B.flare = () => {
    focus.on = true;
    crest.flare();
    if (great[0].lit) return;
    const now = performance.now();
    for (const f of [...great, ...torches]) { f.lit = true; f.at = now; }
    playSound('fx-gong');
  };
  B.ticks.push((now, dt) => {
    if (now - enteredAt > 450) avenue.forEach((pair, i) => {
      if (pair[0].lit || walker.z > pair[0].z + 3.4 || (i && !avenue[i - 1][0].lit)) return;
      for (const f of pair) { f.lit = true; f.at = now; }
      playSound('fx-taiko');
    });
    if (!great[0].lit && avenue.at(-1)[0].lit && walker.z < tileZ(4.5)) {   // reached the court's head: the great fires too
      for (const f of [...great, ...torches]) { f.lit = true; f.at = now; }
      playSound('fx-whoosh');
    }
    for (const pair of avenue) for (const f of pair) tickFire(f, now);
    for (const f of [...great, ...torches]) tickFire(f, now);
    crest.tick(now);
    const glow = great[0].lit ? Math.min(1, (now - great[0].at) / 900) : 0;
    runes.material.opacity = calm ? glow * 0.8 : glow * (0.65 + Math.sin(now / 600) * 0.15);
    runes.rotation.z = calm ? 0 : now / 14000;
    for (const e of embers) {
      const u = e.userData, t = calm ? 0.5 : (u.at + now / 1000 * u.speed) % 1;
      e.visible = !calm && glow > 0;
      e.position.set(u.x + Math.sin(t * 6 + u.sway) * 0.25, 0.4 + t * 6.5, u.z);
      e.material.opacity = Math.min(1, t * 6) * (1 - t) * glow;
    }
    lunette.emissiveIntensity = 0.12 + glow * (calm ? 0.5 : 0.45 + Math.sin(now / 800) * 0.08);
    shafts.forEach((o, i) => { o.material.opacity = (great[0].lit ? 0.22 : 0.08) + (calm ? 0 : Math.sin(now / 1300 + i * 2) * 0.03); });
    const near = Math.hypot(walker.x - tileX(MID), walker.z - tileZ(3)) < 1.6;
    const want = focus.on && near ? 1 : 0;
    focus.k = calm ? want : focus.k + (want - focus.k) * Math.min(1, dt / 1000 * 1.6);
    if (!fly) return;
    const k = Math.min(1, (now - from) / 1300);
    fly(k);
    if (k >= 1) { fly = null; for (const s of sparks) s.visible = false; }
  });
  B.reset();
}

/* ---------- the gateway towns (js/data/towns.js) ---------- */

/* A town is laid out like a Pokémon town from above (the user's ask, 2026-10-13, after their picture): `town.map` is a
   tile map, a ring of forest round stone roads, rows of houses, tall grass and flowers; you come in at the bottom and go
   on through a torii at the top, into the biome. Some houses you walk into (`home`, built by buildHome() as rooms of
   their own), the rest are locked. The camera is higher than the other rooms' (`pitch`) to show the layout. Lantern
   Village is the Shrine's, after Ecruteak: Japanese houses in Pokémon roof colours, a pagoda, stone lanterns, cedars and
   maples dropping their leaves. Townsfolk come and go on the crowd code (townCrowd()). */
const MAPLE = ['#f8b868', '#ec7030', '#c84a24', '#8a2c18'];
const VERMILION = '#d8402c';
const ROADY = new Set(['#', 'R', 'b']);

/** A building's tiles on the map (its letter): its corners, size and middle. */
function footprint(map, ch) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  map.forEach((row, y) => [...row].forEach((c, x) => { if (c === ch) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } }));
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1, cx: tileX((x0 + x1) / 2), cz: tileZ((y0 + y1) / 2) };
}

/** The ground from the map: the forest's floor, roads of stone flags, plots under the buildings, tall grass and flowers,
    the mine's rails and the springs' wet rims; the litter over it all is the town's (`S.litter`). */
function townGround(L, map, S) {
  return (c) => {
    const g = c.getContext('2d'), T = 16, r = seeded(71), W = COLS * T, H = ROWS * T;
    const each = (fn) => map.forEach((row, y) => [...row].forEach((ch, x) => fn(ch, x, y)));
    g.save();
    each((ch, x, y) => {
      if (ch === 'T') { g.fillStyle = S.under; g.fillRect(x * T, y * T, T, T); }
      else if (ch === ',') { g.fillStyle = S.scrub; g.fillRect(x * T - 1, y * T - 1, T + 2, T + 2); }
      else if (ch === 'o') { g.fillStyle = 'rgba(30,24,22,0.55)'; g.beginPath(); g.roundRect(x * T - 3, y * T - 3, T + 6, T + 6, 5); g.fill(); }
      else if (/[A-Z]/.test(ch) && ch !== 'T' && ch !== 'L' && ch !== 'R') { g.fillStyle = L.stone[3]; g.globalAlpha = 0.55; g.fillRect(x * T - 2, y * T - 2, T + 4, T + 4); g.globalAlpha = 1; }
    });
    if (S.soft) softRoads(g, map, L, r, T);
    else {
      const roads = () => { g.beginPath(); each((ch, x, y) => { if (ROADY.has(ch)) g.rect(x * T, y * T, T, T); }); };
      g.save(); roads(); g.fillStyle = 'rgba(40,30,20,0.4)'; g.translate(0.8, 1.4); g.fill(); g.restore();
      roads(); g.fillStyle = L.gap; g.fill();
      g.clip();
      for (let y = 0; y < H; y += 7) for (let x = -((y / 7) % 2) * 3.5; x < W; x += 7) {
        g.fillStyle = L.stone[Math.floor(r() * 3)];
        g.beginPath(); g.roundRect(x + 0.35, y + 0.35, 6.3, 6.3, 1.3); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.13)'; g.fillRect(x + 1.1, y + 0.9, 3.2, 0.6);
        if (r() < 0.2) { g.fillStyle = L.moss; g.globalAlpha = 0.45; g.beginPath(); g.arc(x + r() * 7, y + r() * 7, 0.8 + r(), 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
      }
    }
    g.restore();
    rails(g, map, T);
    g.save();
    each((ch, x, y) => {
      if (ch !== 'f') return;
      for (let i = 0; i < 7; i++) {
        const fx = x * T + 2 + r() * (T - 4), fy = y * T + 2 + r() * (T - 4);
        g.fillStyle = S.flowers[i % 4]; g.beginPath(); g.arc(fx, fy, 1.3, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#f8c838'; g.fillRect(fx - 0.35, fy - 0.35, 0.7, 0.7);
      }
    });
    // the koi pond's bridge (`-`): vermilion-edged planks laid across its way; pebbles round the pond's edge
    const wet = (x, y) => map[y]?.[x] === '~';
    each((ch, x, y) => {
      const X = x * T, Y = y * T;
      if (ch === '-') {
        const along = map[y - 1]?.[x] !== '-' && map[y + 1]?.[x] !== '-';   // a bridge running east-west: its planks the other way
        g.fillStyle = '#3a2418'; g.fillRect(X, Y, T, T);
        for (let i = 0; i < 4; i++) {
          g.fillStyle = (S.bridge?.planks ?? ['#a8784c', '#98683e', '#b88a5a', '#8a5e38'])[Math.floor(r() * 4)];
          if (along) g.fillRect(X + i * 4 + 0.3, Y, 3.4, T); else g.fillRect(X, Y + i * 4 + 0.3, T, 3.4);
        }
        g.fillStyle = S.bridge?.trim ?? VERMILION;
        if (wet(x - 1, y)) g.fillRect(X, Y, 2, T);
        if (wet(x + 1, y)) g.fillRect(X + T - 2, Y, 2, T);
        return;
      }
      if (ch === '~' || !STEPS.some(([dx, dy]) => wet(x + dx, y + dy))) return;
      for (const [dx, dy] of STEPS) {
        if (!wet(x + dx, y + dy)) continue;
        for (let i = 0; i < 6; i++) {
          const along = 1 + r() * (T - 2), into = r() * 3.5;
          const px = dx ? (dx > 0 ? X + T - into : X + into) : X + along, py = dy ? (dy > 0 ? Y + T - into : Y + into) : Y + along;
          g.fillStyle = ['#b8b4a8', '#9a968c', '#d0ccc0'][Math.floor(r() * 3)];
          g.beginPath(); g.ellipse(px, py, 1.2 + r() * 1.2, 0.9 + r() * 0.8, r() * 3, 0, Math.PI * 2); g.fill();
        }
      }
    });
    for (let i = 0; i < 900; i++) {
      const x = r() * W, y = r() * H, road = ROADY.has(map[Math.floor(y / T)]?.[Math.floor(x / T)]);
      if (road && r() < 0.75) continue;
      g.save(); g.translate(x, y); g.rotate(r() * 6.3);
      S.litter(g, r);
      g.restore();
    }
    g.restore();
    // the pond cut out of the ground (the style's `holes`), its land rounded off where water's on two sides
    g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath();
    each((ch, x, y) => { if (ch === '~') g.rect(x * T, y * T, T, T); });
    each((ch, x, y) => {
      if (ch === '~' || ch === '-') return;
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        if (!wet(x + dx, y) || !wet(x, y + dy)) continue;
        const cx = (x + (dx > 0 ? 1 : 0)) * T, cy = (y + (dy > 0 ? 1 : 0)) * T, k = 7;
        g.moveTo(cx, cy); g.lineTo(cx - dx * k, cy); g.arcTo(cx, cy, cx, cy - dy * k, k); g.closePath();
      }
    });
    g.fill();
    g.restore();
    return c;
  };
}

/** The village's roads, soft (the user's ask, 2026-10-14: "more aesthetic and less blocky"): the tiles' outline rounded
    at every corner, outside and in, slabs of uneven length laid in courses, a kerb of darker stone round the edge and
    grass creeping over it. Off the map's edge a road runs on, so it isn't rounded off there. */
function softRoads(g, map, L, r, T) {
  const k = 6, rows = map.length, cols = map[0].length, W = cols * T, H = rows * T;
  const road = (x, y) => ROADY.has(map[Math.max(0, Math.min(rows - 1, y))][Math.max(0, Math.min(cols - 1, x))]);
  const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const each = (fn) => { for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) fn(x, y, road(x, y)); };
  const round = (x, y, dx, dy) => !road(x + dx, y) && !road(x, y + dy);
  // a quarter circle into the corner (cx, cy), from the direction (dx, dy) points
  const quarter = (cx, cy, dx, dy) => { g.moveTo(cx, cy - dy * k); g.arcTo(cx, cy, cx - dx * k, cy, k); };
  const outline = () => {
    g.beginPath();
    each((x, y, on) => {
      if (on) { g.roundRect(x * T, y * T, T, T, CORNERS.map(([dx, dy]) => (round(x, y, dx, dy) ? k : 0))); return; }
      for (const [dx, dy] of CORNERS) {
        if (!road(x + dx, y) || !road(x, y + dy)) continue;
        const cx = (x + (dx > 0 ? 1 : 0)) * T, cy = (y + (dy > 0 ? 1 : 0)) * T;
        g.moveTo(cx, cy); g.lineTo(cx - dx * k, cy); g.arcTo(cx, cy, cx, cy - dy * k, k); g.closePath();
      }
    });
  };
  g.save(); outline(); g.fillStyle = 'rgba(40,30,20,0.35)'; g.translate(0.6, 1.2); g.fill(); g.restore();
  g.save(); outline(); g.fillStyle = L.gap; g.fill(); g.clip();
  for (let y = 0; y < H; y += 5.2) for (let x = -r() * 9; x < W;) {
    const w = 5 + r() * 6;
    g.fillStyle = L.stone[Math.floor(r() * 3)];
    g.beginPath(); g.roundRect(x + 0.45, y + 0.45, w - 0.9, 4.3, 1.6); g.fill();
    if (r() < 0.5) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,30,20'},${0.04 + r() * 0.07})`; g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x + 1.4, y + 0.9, w - 3, 0.5);
    if (L.moss && r() < 0.14) { g.fillStyle = L.moss; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(x + (r() < 0.5 ? 0.2 : w - 0.2), y + r() * 5, 0.6 + r() * 0.6, 1 + r(), 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
    x += w;
  }
  g.restore();
  // the kerb: only the road's outer edge (each open side of a road tile, cut short where its corner rounds) and the arcs
  const edge = [];
  g.beginPath();
  each((x, y, on) => {
    for (const [dx, dy] of CORNERS) {
      if (on ? round(x, y, dx, dy) : road(x + dx, y) && road(x, y + dy)) quarter((x + (dx > 0 ? 1 : 0)) * T, (y + (dy > 0 ? 1 : 0)) * T, dx, dy);
    }
    if (!on) return;
    for (const [sx, sy] of STEPS) {
      if (road(x + sx, y + sy)) continue;
      const ex = sy ? 1 : 0, ey = sx ? 1 : 0;   // along the side
      const cut = (e) => (!road(x + ex * e, y + ey * e) || road(x + ex * e + sx, y + ey * e + sy) ? k : 0);
      const ox = (x + (sx > 0 ? 1 : 0)) * T, oy = (y + (sy > 0 ? 1 : 0)) * T;
      const a = [ox + (sy ? cut(-1) : 0), oy + (sx ? cut(-1) : 0)], b = [ox + (sy ? T - cut(1) : 0), oy + (sx ? T - cut(1) : 0)];
      g.moveTo(...a); g.lineTo(...b);
      edge.push([a, b, sx, sy]);
    }
  });
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = L.stone[3] ?? L.gap; g.lineWidth = 2.8; g.stroke();
  g.setLineDash([3.2, 0.9]); g.strokeStyle = L.stone[2]; g.lineWidth = 1.6; g.stroke();
  g.restore();
  // grass over the kerb here and there, so the edge isn't ruled
  for (const [[ax, ay], [bx, by], sx, sy] of edge) {
    const n = Math.hypot(bx - ax, by - ay) / 2.4;
    for (let i = 0; i < n; i++) {
      if (r() < 0.45) continue;
      const t = r(), out = 0.4 + r() * 1.4;
      g.fillStyle = L.grass[Math.floor(r() * 3)];
      g.beginPath(); g.ellipse(ax + (bx - ax) * t + sx * out, ay + (by - ay) * t + sy * out, sx ? 0.9 + r() : 1.4 + r() * 1.4, sy ? 0.9 + r() : 1.4 + r() * 1.4, 0, 0, Math.PI * 2); g.fill();
    }
  }
}

/** A fallen maple leaf, at the origin. */
function mapleLitter(g, r) {
  g.fillStyle = MAPLE[Math.floor(r() * 4)]; g.globalAlpha = 0.85;
  g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.lineTo(Math.cos(a) * 1.5, Math.sin(a) * 1.5); g.lineTo(Math.cos(a + 0.63) * 0.6, Math.sin(a + 0.63) * 0.6); } g.fill();
  g.globalAlpha = 1;
}

/** Ash drifted on the ground, a cinder now and then. */
function ashLitter(g, r) {
  const ember = r() < 0.12;
  g.fillStyle = ember ? (r() < 0.5 ? '#e8702a' : '#f8a830') : ['#8a827c', '#a69e96', '#6a625c'][Math.floor(r() * 3)];
  g.globalAlpha = ember ? 0.9 : 0.55;
  g.beginPath(); g.ellipse(0, 0, ember ? 0.6 : 1.4 + r(), ember ? 0.6 : 0.7, 0, 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
}

/** The mine's rails on their tiles ('='): ballast, sleepers across, two rails along, joined to the next rail tile. */
function rails(g, map, T) {
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '=') return;
    const across = row[x - 1] === '=' || row[x + 1] === '=';
    g.save();
    g.translate(x * T + T / 2, y * T + T / 2);
    if (!across) g.rotate(Math.PI / 2);
    g.fillStyle = 'rgba(40,32,28,0.6)'; g.fillRect(-T / 2, -5.5, T, 11);
    g.fillStyle = '#5a3e2c';
    for (let i = -T / 2 + 1.5; i < T / 2; i += 4) g.fillRect(i, -5, 2.2, 10);
    for (const ry of [-3, 3]) { g.fillStyle = '#3a3438'; g.fillRect(-T / 2, ry - 0.7, T, 1.4); g.fillStyle = '#a8a4ac'; g.fillRect(-T / 2, ry - 0.7, T, 0.5); }
    g.restore();
  }));
}

/** Many of one shape, cheaply: an instanced mesh over `at` ([x, z, scale, turn, colour?]). */
function instanced(geo, m, at) {
  const o = new THREE.InstancedMesh(geo, m, at.length), d = new THREE.Object3D(), col = new THREE.Color();
  at.forEach(([x, z, k, turn, c, y = 0], i) => {
    d.position.set(x, y, z); d.scale.setScalar(k); d.rotation.set(0, turn, 0); d.updateMatrix();
    o.setMatrixAt(i, d.matrix);
    if (c) o.setColorAt(i, col.set(c));
  });
  o.castShadow = o.receiveShadow = true;
  o.raycast = () => {};
  B.group.add(o);
  return o;
}

/** The forest round the town, a tree a tile: cedars, a maple now and then; a lone maple (`|`) in a garden, bigger. */
function forest(map, L, rnd) {
  const cedars = [], maples = [], bushes = [], gate = B.town?.gate;
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'T' && ch !== '|') return;
    B.blocked.add(key(x, y));
    if (gate && ch === 'T' && y <= 2 && Math.abs(x - gate.x - 0.5) <= 2.5) return;   // a glade round the gate, so it's seen whole
    if (ch === '|') { maples.push([tileX(x), tileZ(y), 1.3 + rnd() * 0.15, rnd() * 6]); return; }
    const at = [tileX(x) + (rnd() - 0.5) * 0.5, tileZ(y) + (rnd() - 0.5) * 0.5, 1 + rnd() * 0.55, rnd() * 6];
    if (y >= ROWS - 2) bushes.push([at[0], at[1], 0.7 + rnd() * 0.4, at[3], L.leaf[1 + Math.floor(rnd() * 3)]]);   // the front edge low, so it never hides you
    else (rnd() < 0.16 ? maples : cedars).push(at);
  }));
  const bush = new THREE.IcosahedronGeometry(0.55, 1); bush.scale(1, 0.7, 1); bush.translate(0, 0.3, 0);
  instanced(bush, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), bushes);
  const bark = std({ color: L.trunk[0], roughness: 0.95 });
  const trunk = new THREE.CylinderGeometry(0.1, 0.16, 1.4, 8); trunk.translate(0, 0.7, 0);
  instanced(trunk, bark, [...cedars, ...maples]);
  for (let i = 0; i < 4; i++) {
    const cone = new THREE.ConeGeometry(0.85 - i * 0.17, 0.95, 9); cone.translate(0, 0.9 + i * 0.55, 0);
    instanced(cone, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), cedars.map(a => [...a, L.leaf[i % 2 ? 1 : 2 + Math.floor(rnd() * 2)]]));
  }
  for (const [dy, r] of [[1.45, 0.72], [1.9, 0.5]]) {
    const blob = new THREE.IcosahedronGeometry(r, 1); blob.translate(0, dy, 0);
    instanced(blob, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), maples.map(a => [...a, MAPLE[1 + Math.floor(rnd() * 3)]]));
  }
}

/** Tall grass on its tiles, blades in clumps (walked through, as in the games). */
function townGrass(map, L, rnd) {
  const at = [];
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== ',') return;
    for (let i = 0; i < 16; i++) at.push([tileX(x) + (rnd() - 0.5) * 0.95, tileZ(y) + (rnd() - 0.5) * 0.95, 0.8 + rnd() * 0.5, rnd() * 6, L.grass[Math.floor(rnd() * 3)]]);
  }));
  const blade = new THREE.ConeGeometry(0.08, 0.5, 4); blade.translate(0, 0.25, 0);
  instanced(blade, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), at).castShadow = false;
}

/* ---------- tiled roofs (the town's houses and theater) ---------- */

/** One column of kawara for a roof slope, courses down it: `cols` [light, mid, dark]. u runs along the ridge (a column a
    repeat), v down the slope (four courses a repeat). */
function kawaraArt(cols) {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 64;
  const g = c.getContext('2d'), lin = g.createLinearGradient(0, 0, 32, 0);
  lin.addColorStop(0, cols[2]); lin.addColorStop(0.3, cols[1]); lin.addColorStop(0.5, cols[0]); lin.addColorStop(0.72, cols[1]); lin.addColorStop(1, cols[2]);
  g.fillStyle = lin; g.fillRect(0, 0, 32, 64);
  for (let y = 0; y < 64; y += 16) {
    const sh = g.createLinearGradient(0, y, 0, y + 6);
    sh.addColorStop(0, 'rgba(0,0,0,0.42)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh; g.fillRect(0, y, 32, 6);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(6, y + 13, 20, 1.5);
  }
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  return map;
}

/** A crest disc for a house you can walk into: a Poké Ball for a shop, a Gym Leader's initial in their colours. */
function houseCrest(kind, ink, letter) {
  const f = fine(32, 32, 8), { g } = f;
  g.fillStyle = '#c8902c'; g.beginPath(); g.arc(16, 16, 15.5, 0, Math.PI * 2); g.fill();
  if (kind === 'ball') {
    g.fillStyle = '#e83828'; g.beginPath(); g.arc(16, 16, 13, Math.PI, 0); g.fill();
    g.fillStyle = '#f8f4ec'; g.beginPath(); g.arc(16, 16, 13, 0, Math.PI); g.fill();
    g.fillStyle = '#2a1c18'; g.fillRect(3, 14.6, 26, 2.8);
    g.beginPath(); g.arc(16, 16, 4.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f8f4ec'; g.beginPath(); g.arc(16, 16, 2.8, 0, Math.PI * 2); g.fill();
  } else {
    g.fillStyle = ink[1]; g.beginPath(); g.arc(16, 16, 13, 0, Math.PI * 2); g.fill();
    g.strokeStyle = ink[0]; g.lineWidth = 1.4; g.beginPath(); g.arc(16, 16, 10.5, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ffffff'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(letter, 16, 17);
  }
  return f.c;
}

/** A Japanese tiled roof, ridge along x, `length` long, its curve roofShape(half, rise, t) on the parent at height `y`:
    ribbed columns of kawara down both slopes, round tile ends along the eaves, a stacked ridge with onigawara at each end,
    dark bargeboards round each gable with a gold gegyo at the apex. `fancy` (a house you walk into) adds gold
    shachihoko-ish finials on the ridge. Returns the front slope's height at a z (`slopeAt`) for things set on it. */
function kawaraRoof(parent, { length, half, rise, t, y, z = 0, roof, fancy = false, back = true }) {
  const g = new THREE.Group();
  g.position.set(0, y, z);
  parent.add(g);
  const eave = std({ color: roof[2], roughness: 0.7 }), ridgeMat = std({ color: shadeOf(roof[2], -1), roughness: 0.6 });
  const wood = std({ color: '#3a241a', roughness: 0.75 }), gold = std({ color: '#e8b040', metalness: 0.7, roughness: 0.3 });
  // the shell, plain, under the tiles: it closes the gables' edges
  const shell = new THREE.ExtrudeGeometry(roofShape(half, rise, t), { depth: length, bevelEnabled: false, curveSegments: 12 });
  shell.rotateY(Math.PI / 2); shell.translate(-length / 2, 0, 0);
  mesh(shell, eave, 0, 0, 0, g);
  // the front half of the curve: eave (s = 0) to ridge (s = 1), as roofShape draws it
  const at = (s) => { const a = (1 - s) ** 2, b = 2 * (1 - s) * s, c = s * s; return [a * half + b * half * 0.45, a * 0.08 + b * rise * 0.32 + c * rise]; };
  const slopeAt = (zz) => { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (at(m)[0] > zz) lo = m; else hi = m; } return at(lo)[1]; };
  const COL = 0.24, cols = Math.max(4, Math.round(length / COL)), cw = length / cols, PER = 4, NT = 14, RIB = 0.04;
  const map = kawaraArt(roof), tiles = std({ map, roughness: 0.5 });
  const pos = [], uv = [], idx = [];
  const ends = [];
  for (const side of back ? [1, -1] : [1]) {
    const base = pos.length / 3;
    let arc = 0, prev = at(0);
    for (let j = 0; j <= NT; j++) {
      const s = j / NT, [pz, py] = at(s), [qz, qy] = at(Math.min(1, s + 0.01)), [rz, ry] = at(Math.max(0, s - 0.01));
      if (j) arc += Math.hypot(pz - prev[0], py - prev[1]);
      prev = [pz, py];
      let tz = qz - rz, ty = qy - ry; const n = Math.hypot(tz, ty) || 1; tz /= n; ty /= n;
      const nz = ty, ny = -tz;   // the outward normal of the front slope
      for (let i = 0; i <= cols * PER; i++) {
        const x = -length / 2 + i * cw / PER, k = (i % PER) / PER, bump = 0.012 + RIB * Math.sin(Math.PI * k) ** 0.8;
        pos.push(x, py + ny * bump, side * (pz + nz * bump));
        uv.push(i / PER, arc / 0.62);
      }
    }
    const row = cols * PER + 1;
    for (let j = 0; j < NT; j++) for (let i = 0; i < row - 1; i++) {
      const a = base + j * row + i, b = a + 1, c = a + row, d = c + 1;
      if (side > 0) idx.push(a, b, d, a, d, c); else idx.push(a, d, b, a, c, d);
    }
    const [ez, ey] = at(0);
    for (let i = 0; i < cols; i++) ends.push([-length / 2 + (i + 0.5) * cw, ey + 0.035, side * (ez + 0.01), side]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  mesh(geo, tiles, 0, 0, 0, g).receiveShadow = true;
  // the round tile ends along the eaves
  const disc = new THREE.CylinderGeometry(0.075, 0.075, 0.06, 12); disc.rotateX(Math.PI / 2);
  const caps = new THREE.InstancedMesh(disc, std({ color: shadeOf(roof[1], -1), roughness: 0.5 }), ends.length), o = new THREE.Object3D();
  ends.forEach(([x, yy, zz, side], i) => { o.position.set(x, yy, zz); o.rotation.set(side * 0.35, 0, 0); o.updateMatrix(); caps.setMatrixAt(i, o.matrix); });
  caps.castShadow = false; caps.raycast = () => {};
  g.add(caps);
  // the ridge: a stack of flat tiles under a round cap, onigawara at its ends
  mesh(new THREE.BoxGeometry(length + 0.1, 0.16, 0.24), ridgeMat, 0, rise + 0.02, 0, g);
  const cap = new THREE.CylinderGeometry(0.1, 0.1, length + 0.16, 14); cap.rotateZ(Math.PI / 2);
  mesh(cap, eave, 0, rise + 0.12, 0, g);
  for (const sx of [-1, 1]) {
    const oni = mesh(rbox(0.14, 0.36, 0.34, 0.06), ridgeMat, sx * (length / 2 + 0.06), rise + 0.12, 0, g);
    const boss = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12); boss.rotateZ(Math.PI / 2);
    mesh(boss, fancy ? gold : eave, sx * (length / 2 + 0.14), rise + 0.12, 0, g);
    if (fancy) {   // a gold finial curling up off each end of the ridge
      const fin = mesh(new THREE.ConeGeometry(0.07, 0.34, 8), gold, sx * (length / 2 + 0.02), rise + 0.42, 0, g);
      fin.rotation.z = -sx * 0.45;
      mesh(new THREE.SphereGeometry(0.07, 12, 8), gold, sx * (length / 2 + 0.07), rise + 0.3, 0, g);
    }
    oni.castShadow = true;
    // the bargeboard round the gable and the gegyo hanging at its apex
    const barge = new THREE.ExtrudeGeometry(roofShape(half + 0.03, rise + 0.035, t + 0.08), { depth: 0.07, bevelEnabled: false, curveSegments: 12 });
    barge.rotateY(Math.PI / 2);
    mesh(barge, wood, sx > 0 ? length / 2 - 0.02 : -length / 2 - 0.05, 0, 0, g);
    const gegyo = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 6), fancy ? gold : wood, sx * (length / 2 + 0.03), rise - t - 0.12, 0, g);
    gegyo.rotation.z = Math.PI / 2;
  }
  return { group: g, slopeAt, ridge: rise + 0.22 };
}

/** The gable's plaster under a roof's curve at x, with a dark tie beam (the house's ends were open under its roof). */
function gableWall(parent, x, { half, rise, t, wide, y, z = 0 }) {
  const sh = new THREE.Shape(), a = (s) => { const p = (1 - s) ** 2, q = 2 * (1 - s) * s, c = s * s; return [p * half + q * half * 0.45, p * 0.08 + q * rise * 0.32 + c * rise - t - 0.01]; };
  const pts = [];
  for (let i = 0; i <= 16; i++) { const [zz, yy] = a(i / 16); if (zz <= wide) pts.push([zz, yy]); }
  sh.moveTo(-wide, 0); sh.lineTo(wide, 0);
  for (const [zz, yy] of pts) sh.lineTo(zz, Math.max(0, yy));
  for (const [zz, yy] of pts.reverse()) sh.lineTo(-zz, Math.max(0, yy));
  sh.closePath();
  const geo = new THREE.ShapeGeometry(sh); geo.rotateY(Math.PI / 2);
  const m = mesh(geo, std({ color: '#efe4cc', roughness: 0.95, side: THREE.DoubleSide }), x, y, z, parent);
  m.castShadow = false;
  mesh(new THREE.BoxGeometry(0.06, 0.07, wide * 2), std({ color: '#3a241a', roughness: 0.75 }), x, y + rise * 0.3, z, parent);
}

/** A house's front gable (chidori-hafu) over the door of a house you walk into: a little tiled roof set on the front
    slope, its ridge running to you, plaster in its triangle and a crest. */
function frontGable(parent, main, { zf, y, roof, crest }) {
  const wide = 0.85, rise = 0.85, t = 0.09, zFront = zf - 0.05, foot = main.slopeAt(zFront);
  let len = 0.6;
  while (len < zFront - 0.15 && main.slopeAt(zFront - len) - foot < rise + 0.1) len += 0.05;   // its ridge runs back into the main roof
  const g = new THREE.Group();
  g.position.set(0, y + foot - 0.02, zFront - len / 2);
  g.rotation.y = -Math.PI / 2;   // its local +x is towards you
  parent.add(g);
  kawaraRoof(g, { length: len, half: wide, rise, t, y: 0, roof, fancy: true });
  // its triangle, facing you, and the crest on it
  gableWall(g, len / 2 - 0.03, { half: wide, rise, t, wide: wide - 0.06, y: 0 });
  if (crest) {
    const c = panel(crest, 0.5, 0.5, 0, 0, 0);
    c.parent?.remove(c); g.add(c);
    c.position.set(len / 2 + 0.02, rise * 0.4, 0); c.rotation.set(0, Math.PI / 2, 0); c.rotateX(-0.35);   // tipped up to the camera
  }
}

/** A name on a little wooden plaque, over a door. */
function nameArt(text) {
  const f = fine(64, 16, 8), { g, rr } = f;
  rr(0, 0, 64, 16, 2, '#4a2c18');
  rr(1.5, 1.5, 61, 13, 1.4, '#f4e6c4');
  g.fillStyle = '#4a2c18'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 9px sans-serif';
  g.fillText(text, 32, 8.5, 58);
  return f.c;
}

/** A town house over its footprint, its front to you: a lattice front lit from inside, plaster sides, dark posts, a tiled
    roof in its Pokémon colour, a paper lantern by the door, a name plate over a home you can visit. A tap on it is its door. */
function house(b, f, L, lit) {
  const leader = b.home && B.town?.homes?.[b.home]?.leader;
  if (leader) return manor(b, f, L, lit, leader);
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz + 0.05);
  B.group.add(g);
  const w = f.w - 0.35, d = f.h - 0.6, h = 1.55;
  const plaster = std({ color: '#efe4cc', roughness: 0.95 }), dark = std({ color: '#3a241a', roughness: 0.75 });
  const art = latticeArt('#ffc070'), front = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.8 });
  lit.push(front);
  mesh(rbox(w + 0.25, 0.16, d + 0.25, 0.03), std({ color: L.stone[2], roughness: 0.95 }), 0, 0.08, 0, g);
  mesh(new THREE.BoxGeometry(w, h, d), [plaster, plaster, dark, dark, front, plaster], 0, 0.16 + h / 2, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.12, h + 0.02, 0.12), dark, sx * (w / 2 + 0.01), 0.16 + h / 2, sz * (d / 2 + 0.01), g);
  mesh(new THREE.BoxGeometry(w + 0.1, 0.1, 0.1), dark, 0, 0.16 + h * 0.66, d / 2 + 0.03, g);
  const roof = [shadeOf(b.roof, 1), b.roof, shadeOf(b.roof, -1)];
  const eave = std({ color: roof[2], roughness: 0.7 });
  // a tiled roof, plaster in its gables; a house you walk into gets gold on its ridge and a front gable with its crest
  const top = { length: w + 0.55, half: d / 2 + 0.45, rise: 1.0, t: 0.12, y: 0.16 + h };
  const main = kawaraRoof(g, { ...top, roof, fancy: !!b.home });
  for (const sx of [-1, 1]) gableWall(g, sx * (w / 2 + 0.005), { ...top, wide: d / 2 });
  if (b.home) {
    const leader = B.town?.homes?.[b.home]?.leader, ink = leader && LEADER_INK[leader];
    frontGable(g, main, { zf: top.half, y: top.y, roof, crest: b.kind === 'shop' || !ink ? houseCrest('ball') : houseCrest('ink', ink, (b.name || leader)[0]) });
  }
  const pentTiles = kawaraArt(roof); pentTiles.repeat.set(w * 0.6 / 0.24, 0.8);
  const small = mesh(new THREE.BoxGeometry(w * 0.6, 0.06, 0.5), [eave, eave, std({ map: pentTiles, roughness: 0.5 }), eave, eave, eave], 0, 0.16 + h * 0.72, d / 2 + 0.22, g);
  small.rotation.x = 0.32;
  const glow = std({ color: '#e84a30', emissive: new THREE.Color('#ff9050'), emissiveIntensity: 0.8, roughness: 0.6 });
  lit.push(glow);
  const ball = mesh(new THREE.SphereGeometry(0.14, 16, 12), glow, w / 2 - 0.3, 0.16 + h * 0.6, d / 2 + 0.25, g);
  ball.scale.y = 1.3; ball.castShadow = false;
  if (b.name) panel(nameArt(b.name), 1.15, 0.29, f.cx, 0.16 + h * 0.86, f.cz + 0.05 + d / 2 + 0.04);
  if (b.kind === 'shop') {   // a shop's noren across its door
    const noren = std({ color: roof[2], roughness: 0.95, side: THREE.DoubleSide });
    for (const dx of [-0.3, 0, 0.3]) mesh(new THREE.BoxGeometry(0.28, 0.4, 0.02), noren, dx, 0.16 + h * 0.66 - 0.22, d / 2 + 0.07, g).castShadow = false;
  }
  return g;
}

/** A Gym Leader's banner (nobori): their colours, a gold band, their initial on a white disc, gold diamonds, a fringe. */
function noboriArt(ink, letter) {
  const f = fine(16, 64, 8), { g, rr, lin } = f;
  rr(0, 0, 16, 64, 0.6, lin(0, 0, 16, 0, [ink[2], ink[1], ink[1], ink[2]]));
  g.fillStyle = '#e8b040'; g.fillRect(0, 0, 16, 5); g.fillRect(0, 57, 16, 1.4);
  g.fillStyle = ink[0]; g.fillRect(1.6, 5, 1.2, 52); g.fillRect(13.2, 5, 1.2, 52);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(8, 17, 5.6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#e8b040'; g.lineWidth = 0.9; g.stroke();
  g.fillStyle = ink[2]; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, 8, 17.5);
  g.fillStyle = '#e8b040';
  for (const y of [30, 38, 46]) { g.beginPath(); g.moveTo(8, y - 2.6); g.lineTo(10.2, y); g.lineTo(8, y + 2.6); g.lineTo(5.8, y); g.closePath(); g.fill(); }
  g.fillStyle = ink[2];
  for (let x = 0.5; x < 16; x += 2) g.fillRect(x, 58.4, 1.1, 5.6);
  return f.c;
}

/** A Gym Leader's home in Lantern Village (the user's ask, 2026-10-14: "more grand and extravagant and aesthetic", for
    every Gym Leader's house to come too): a manor on a stone podium up a flight of steps, a vermilion veranda under a
    deep tiled roof, a gold-leafed upper storey (Kinkaku-ji's) under a second roof with a gold jewel on its ridge, a gabled
    porch over the door with the leader's crest and a sacred rope, stone lanterns at the steps, paper lanterns and tall
    banners in the leader's colours. Its lot is 5 x 4 tiles. A tap anywhere on it is its door. */
function manor(b, f, L, lit, leader) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const ink = LEADER_INK[leader] || ['#ffe0c0', '#d84838', '#5a1810'], letter = (b.name || leader)[0].toUpperCase();
  const roof = [shadeOf(b.roof, 1), b.roof, shadeOf(b.roof, -1)];
  const W = f.w - 0.3, D = f.h - 0.3, P = 0.48;
  const plaster = std({ color: '#f2e8d2', roughness: 0.95 }), dark = std({ color: '#2e1c14', roughness: 0.7 }), red = std({ color: VERMILION, roughness: 0.5 });
  const gold = std({ color: '#e8b040', metalness: 0.75, roughness: 0.28, emissive: new THREE.Color('#7a4a10'), emissiveIntensity: 0.35 });
  const leaf = std({ color: '#d8a838', metalness: 0.85, roughness: 0.32, emissive: new THREE.Color('#6a4008'), emissiveIntensity: 0.3 });
  const stone = std({ color: L.stone[2], roughness: 0.95 }), cope = std({ color: L.stone[1], roughness: 0.9 });
  const art = latticeArt('#ffc070'), front = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.8 });
  lit.push(front);
  // the podium: battered stone, a coping round its top, steps up the front
  mesh(rbox(W, P - 0.06, D, 0.05), stone, 0, (P - 0.06) / 2, 0, g);
  mesh(rbox(W + 0.1, 0.07, D + 0.1, 0.03), cope, 0, P - 0.035, 0, g);
  for (let i = 0; i < 3; i++) mesh(rbox(1.5 - i * 0.06, P / 3, 0.2, 0.02), cope, 0, P / 6 + i * P / 3, D / 2 + 0.36 - i * 0.18, g);
  // the hall: lattice front lit from inside, dark posts, a gold frieze under the eaves; a veranda of vermilion pillars
  const hw = W - 0.8, hd = 2.0, hz = -0.5, H = 1.45, top = P + H;
  mesh(new THREE.BoxGeometry(hw, H, hd), [plaster, plaster, dark, dark, front, plaster], 0, P + H / 2, hz, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.13, H, 0.13), dark, sx * (hw / 2 + 0.01), P + H / 2, hz + sz * (hd / 2 + 0.01), g);
  mesh(new THREE.BoxGeometry(hw + 0.06, 0.08, 0.04), gold, 0, top - 0.1, hz + hd / 2 + 0.02, g);
  mesh(rbox(hw + 0.5, 0.07, 0.95, 0.02), std({ color: L.wood[1], roughness: 0.8 }), 0, P + 0.035, hz + hd / 2 + 0.47, g);
  const vz = hz + hd / 2 + 0.85;
  for (let i = 0; i < 6; i++) {
    const x = -hw / 2 - 0.15 + i * (hw + 0.3) / 5;
    mesh(new THREE.CylinderGeometry(0.075, 0.085, H, 14), red, x, P + H / 2, vz, g);
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 14), gold, x, P + 0.03, vz, g).castShadow = false;
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 14), gold, x, top - 0.18, vz, g).castShadow = false;
  }
  mesh(rbox(hw + 0.5, 0.14, 0.16, 0.02), red, 0, top - 0.07, vz, g);
  for (let i = 0; i < 9; i++) mesh(new THREE.SphereGeometry(0.03, 8, 6), gold, -hw / 2 - 0.1 + i * (hw + 0.2) / 8, top - 0.07, vz + 0.08, g).castShadow = false;
  // the deep lower roof over hall and veranda, its gables plastered
  const low = { length: W + 0.5, half: D / 2 + 0.25, rise: 1.05, t: 0.13, y: top };
  kawaraRoof(g, { ...low, roof, fancy: true });
  for (const sx of [-1, 1]) gableWall(g, sx * (hw / 2 + 0.25), { ...low, wide: D / 2 - 0.2 });
  // the upper storey, gold-leafed with a lit lattice front, a vermilion rail round it, under its own roof
  const uw = W * 0.5, ud = 1.3, uh = 1.05, uy = top + 0.42;
  const uart = latticeArt('#ffd890'), ufront = std({ map: texOf(uart), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(uart.glow), emissiveIntensity: 0.6, roughness: 0.6 });
  lit.push(ufront);
  mesh(new THREE.BoxGeometry(uw, uh, ud), [leaf, leaf, dark, dark, ufront, leaf], 0, uy + uh / 2, 0, g);
  for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.1, uh, 0.1), dark, sx * (uw / 2 + 0.01), uy + uh / 2, ud / 2 + 0.01, g);
  mesh(rbox(uw + 0.4, 0.05, 0.32, 0.02), dark, 0, uy + 0.24, ud / 2 + 0.12, g);
  mesh(rbox(uw + 0.3, 0.05, 0.05, 0.02), red, 0, uy + 0.64, ud / 2 + 0.24, g);
  mesh(rbox(uw + 0.3, 0.04, 0.04, 0.02), red, 0, uy + 0.42, ud / 2 + 0.24, g);
  for (let i = 0; i < 9; i++) mesh(new THREE.BoxGeometry(0.035, 0.4, 0.035), red, -uw / 2 - 0.12 + i * (uw + 0.24) / 8, uy + 0.46, ud / 2 + 0.24, g).castShadow = false;
  const up = { length: uw + 0.6, half: ud / 2 + 0.45, rise: 0.85, t: 0.11, y: uy + uh };
  const upper = kawaraRoof(g, { ...up, roof, fancy: true });
  for (const sx of [-1, 1]) gableWall(g, sx * (uw / 2 + 0.005), { ...up, wide: ud / 2 });
  frontGable(g, upper, { zf: up.half, y: up.y, roof, crest: houseCrest('ink', ink, letter) });
  // a gold jewel (hoju) on a stepped base in the middle of the top ridge
  const ry = up.y + upper.ridge;
  mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.1, 12), gold, 0, ry, 0, g);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 8), gold, 0, ry + 0.2, 0, g);
  for (let k = 0; k < 3; k++) mesh(new THREE.TorusGeometry(0.09 - k * 0.018, 0.018, 6, 14), gold, 0, ry + 0.12 + k * 0.08, 0, g).rotation.x = Math.PI / 2;
  const jewel = mesh(new THREE.SphereGeometry(0.12, 14, 10), gold, 0, ry + 0.46, 0, g);
  jewel.scale.y = 1.15;
  mesh(new THREE.ConeGeometry(0.06, 0.16, 10), gold, 0, ry + 0.62, 0, g);
  // the porch over the steps: a little gabled roof, its ridge to you, on two pillars, the leader's crest in its gable
  const pz0 = vz - 0.1, pz1 = D / 2 + 0.25, plen = pz1 - pz0, ph = H + 0.05;
  for (const sx of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.09, 0.1, ph, 14), red, sx * 0.62, P + ph / 2, pz1 - 0.2, g);
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 14), gold, sx * 0.62, P + 0.03, pz1 - 0.2, g).castShadow = false;
  }
  mesh(rbox(1.5, 0.13, 0.15, 0.02), red, 0, P + ph - 0.05, pz1 - 0.2, g);
  const porch = new THREE.Group();
  porch.position.set(0, P + ph + 0.02, pz0 + plen / 2);
  porch.rotation.y = -Math.PI / 2;
  g.add(porch);
  const pr = { length: plen, half: 0.85, rise: 0.62, t: 0.09, y: 0 };
  kawaraRoof(porch, { ...pr, roof, fancy: true });
  gableWall(porch, plen / 2 - 0.03, { ...pr, wide: 0.78 });
  const pc = panel(houseCrest('ink', ink, letter), 0.42, 0.42, 0, 0, 0);
  pc.parent?.remove(pc); porch.add(pc);
  pc.position.set(plen / 2 + 0.01, 0.26, 0); pc.rotation.set(0, Math.PI / 2, 0); pc.rotateX(-0.3);
  // the sacred rope sagging between the porch pillars, paper streamers hung off it
  const ropeY = P + ph - 0.22;
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: 7 }, (_, i) => { const t = i / 6 * 2 - 1; return new THREE.Vector3(t * 0.55, ropeY - 0.12 * (1 - t * t), pz1 - 0.12); }));
  mesh(new THREE.TubeGeometry(curve, 24, 0.045, 8), std({ color: '#d8c080', roughness: 0.95 }), 0, 0, 0, g).castShadow = false;
  const shide = std({ map: texOf(shideArt()), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 });
  for (const t of [-0.5, 0, 0.5]) {
    const s = mesh(new THREE.PlaneGeometry(0.1, 0.22), shide, t * 0.55, ropeY - 0.12 * (1 - t * t) - 0.14, pz1 - 0.1, g);
    s.castShadow = false;
  }
  // paper lanterns in the leader's colours hung from the veranda beam
  const glow = std({ color: ink[1], emissive: new THREE.Color(ink[0]), emissiveIntensity: 0.8, roughness: 0.6 });
  lit.push(glow);
  for (const sx of [-1, 1]) {
    const x = sx * (hw / 2 - 0.35);
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), dark, x, top - 0.22, vz, g).castShadow = false;
    const ball = mesh(new THREE.SphereGeometry(0.15, 16, 12), glow, x, top - 0.47, vz, g);
    ball.scale.y = 1.35; ball.castShadow = false;
    for (const dy of [-0.2, 0.2]) mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12), dark, x, top - 0.47 + dy, vz, g).castShadow = false;
  }
  // a stone lantern either side of the steps, lit
  for (const sx of [-1, 1]) {
    const wx = f.cx + sx * 1.25, wz = f.cz + D / 2 - 0.3;
    const m = piece('stonelantern', wx + COLS / 2 - 0.5, wz + ROWS / 2 - 0.5, { scale: 0.8, y: P, free: true });
    if (!m) continue;
    m.traverse(o => { if (o.material?.emissiveMap) { o.material.emissive = new THREE.Color('#ffc070'); lit.push(o.material); } });
    g.attach(m);
  }
  // two tall banners at the podium's front corners, swaying a little
  const cloth = std({ map: texOf(noboriArt(ink, letter)), side: THREE.DoubleSide, roughness: 0.95 });
  const flags = [-1, 1].map(sx => {
    const x = sx * (W / 2 - 0.12), z = D / 2 - 0.12, tall = 2.7;
    mesh(new THREE.CylinderGeometry(0.035, 0.04, tall, 8), dark, x, P + tall / 2, z, g);
    mesh(new THREE.SphereGeometry(0.06, 10, 8), gold, x, P + tall + 0.04, z, g).castShadow = false;
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 6), dark, x - sx * 0.22, P + tall - 0.1, z, g).rotation.z = Math.PI / 2;
    const hang = new THREE.Group();
    hang.position.set(x - sx * 0.22, P + tall - 0.12, z + 0.02);
    g.add(hang);
    const m = mesh(new THREE.PlaneGeometry(0.4, 1.6), cloth, 0, -0.8, 0, hang);
    m.castShadow = false;
    return hang;
  });
  B.ticks.push((now) => { if (!calm) flags.forEach((h, i) => { h.rotation.y = Math.sin(now / 900 + i * 2) * 0.12; h.rotation.x = Math.sin(now / 1300 + i) * 0.04; }); });
  return g;
}

/** A wide sign, gold on black (the theater's). */
function signArt(text) {
  const f = fine(96, 20, 8), { g, rr, lin } = f;
  rr(0, 0, 96, 20, 2.5, '#c8902c');
  rr(2, 2, 92, 16, 1.6, lin(0, 0, 0, 20, ['#2a1c18', '#120a08']));
  g.fillStyle = '#f0c860'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 11px sans-serif';
  g.fillText(text, 48, 10.5, 88);
  return f.c;
}

/** The Dance Theater: a great hall on a veranda of red pillars, two tiers of roof, its name in gold over the doors. */
function theater(b, f, L, lit) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz - 0.1);
  B.group.add(g);
  const w = f.w - 0.4, d = f.h - 1.0, h = 1.9;
  const plaster = std({ color: '#efe4cc', roughness: 0.95 }), dark = std({ color: '#3a241a', roughness: 0.75 }), red = std({ color: VERMILION, roughness: 0.55 });
  const art = latticeArt('#ffb860'), front = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.8 });
  lit.push(front);
  mesh(rbox(w + 0.9, 0.22, d + 1.2, 0.04), std({ color: L.stone[2], roughness: 0.95 }), 0, 0.11, 0.2, g);
  mesh(rbox(w + 0.5, 0.1, 0.8, 0.03), std({ color: L.wood[1], roughness: 0.8 }), 0, 0.27, d / 2 + 0.45, g);
  mesh(new THREE.BoxGeometry(w, h, d), [plaster, plaster, dark, dark, front, plaster], 0, 0.22 + h / 2, 0, g);
  for (let i = 0; i < 6; i++) mesh(new THREE.CylinderGeometry(0.09, 0.1, h, 12), red, -w / 2 + 0.1 + i * (w - 0.2) / 5, 0.22 + h / 2, d / 2 + 0.75, g);
  const roof = [shadeOf(b.roof, 1), b.roof, shadeOf(b.roof, -1)];
  const low = { length: w + 0.9, half: d / 2 + 1.0, rise: 1.1, t: 0.14, y: 0.22 + h, z: 0.25 };
  kawaraRoof(g, { ...low, roof, fancy: true });
  for (const sx of [-1, 1]) gableWall(g, sx * (w / 2 + 0.005), { ...low, wide: d / 2 });
  mesh(new THREE.BoxGeometry(w * 0.55, 0.5, d * 0.45), plaster, 0, 0.22 + h + 1.25, 0.25, g);
  const up = { length: w * 0.55 + 0.7, half: d * 0.3 + 0.45, rise: 0.8, t: 0.12, y: 0.22 + h + 1.5, z: 0.25 };
  kawaraRoof(g, { ...up, roof, fancy: true });
  for (const sx of [-1, 1]) gableWall(g, sx * (w * 0.275 + 0.005), { ...up, wide: d * 0.225 });
  panel(signArt(b.name), 2.6, 0.54, f.cx, 0.22 + h + 0.22, f.cz - 0.1 + d / 2 + 1.27);   // big enough to read from the lane
  for (const sx of [-1, 1]) {   // paper lanterns hung from the eaves
    const glow = std({ color: '#f04a30', emissive: new THREE.Color('#ff9050'), emissiveIntensity: 0.8, roughness: 0.6 });
    lit.push(glow);
    const ball = mesh(new THREE.SphereGeometry(0.17, 16, 12), glow, sx * (w / 2 - 0.5), 0.22 + h - 0.35, d / 2 + 0.85, g);
    ball.scale.y = 1.3; ball.castShadow = false;
  }
  return g;
}

/** The town's name on the torii's plaque: gold on black, framed. */
function plaqueArt(name) {
  const f = fine(40, 54, 8), { g, rr, lin } = f;
  rr(0, 0, 40, 54, 2.5, '#c8902c');
  rr(2.5, 2.5, 35, 49, 1.6, lin(0, 0, 0, 54, ['#2a1c18', '#120a08']));
  g.fillStyle = '#f0c860'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const words = name.toUpperCase().split(' ');
  g.font = `bold ${words.length > 1 ? 9 : 11}px sans-serif`;
  words.forEach((w, i) => g.fillText(w, 20, 27 + (i - (words.length - 1) / 2) * 13, 32));
  return f.c;
}

/** One torii's frame into `g`: two pillars on black feet with gold bands, the tie beam, the top beam swept up at the
    ends and capped in gold. */
function toriiFrame(g, span, tall, z, red, black, gold) {
  for (const s of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.15, 0.19, tall, 20), red, s * span / 2, tall / 2, z, g);
    mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.3, 20), black, s * span / 2, 0.15, z, g);
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20), gold, s * span / 2, 0.32, z, g);
    mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.05, 20), gold, s * span / 2, tall - 0.75, z, g);
  }
  mesh(rbox(span + 0.85, 0.2, 0.24, 0.03), red, 0, tall - 0.55, z, g);
  mesh(rbox(span + 1.05, 0.18, 0.3, 0.03), red, 0, tall + 0.02, z, g);
  const half = span / 2 + 1.05, sh = new THREE.Shape();
  sh.moveTo(-half, 0.38); sh.quadraticCurveTo(-half * 0.55, 0.02, 0, 0); sh.quadraticCurveTo(half * 0.55, 0.02, half, 0.38);
  sh.lineTo(half + 0.05, 0.62); sh.quadraticCurveTo(half * 0.55, 0.26, 0, 0.24); sh.quadraticCurveTo(-half * 0.55, 0.26, -half - 0.05, 0.62); sh.closePath();
  const beam = new THREE.ExtrudeGeometry(sh, { depth: 0.38, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 14 });
  beam.translate(0, 0, -0.19);
  mesh(beam, black, 0, tall + 0.11, z, g);
  for (const s of [-1, 1]) mesh(rbox(0.16, 0.22, 0.42, 0.03), gold, s * (half - 0.02), tall + 0.11 + 0.5, z, g).rotation.z = -s * 0.22;
  mesh(rbox(0.14, 0.55, 0.16, 0.02), red, 0, tall - 0.28, z, g);
}

/** The light in the gate's opening: bright at the foot, fading up and to the sides. */
function veilArt() {
  const f = fine(32, 64, 4), { g } = f;
  const v = g.createLinearGradient(0, 64, 0, 0);
  v.addColorStop(0, 'rgba(255,236,170,0.95)'); v.addColorStop(0.35, 'rgba(255,190,120,0.5)'); v.addColorStop(1, 'rgba(255,140,180,0)');
  g.fillStyle = v; g.fillRect(0, 0, 32, 64);
  g.globalCompositeOperation = 'destination-in';
  const h = g.createLinearGradient(0, 0, 32, 0);
  h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.25, 'rgba(0,0,0,1)'); h.addColorStop(0.75, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = h; g.fillRect(0, 0, 32, 64);
  return f.c;
}

/** A pool of light on the ground, a ring round a soft middle. */
function poolArt() {
  const f = fine(64, 64, 4), { g } = f, r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,230,160,0.55)'); r.addColorStop(0.62, 'rgba(255,200,120,0.18)'); r.addColorStop(0.78, 'rgba(255,220,150,0.7)'); r.addColorStop(0.86, 'rgba(255,200,130,0.1)'); r.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return f.c;
}

/** The far gate out to the Shrine, made to be seen from the far end of the village: a great vermilion torii trimmed in
    gold with a second, smaller one behind it (the start of the Shrine's tunnel of gates), a sacred rope hung with paper
    streamers between the pillars, red paper lanterns swinging from the beam's ends, and the way through glowing: a veil
    of light in the opening, motes rising through it, a ring of light on the road and a warm lamp that brightens at
    night. Its pillars block their tiles; the way between them is `R.exitAt`. */
function torii(x, z, span, tall, name, lit = [], time = 'day') {
  const red = std({ color: VERMILION, roughness: 0.45 }), black = std({ color: '#241a18', roughness: 0.55 });
  const gold = std({ color: '#d8a838', metalness: 0.6, roughness: 0.35, emissive: new THREE.Color('#7a4a10'), emissiveIntensity: 0.4 });
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  B.group.add(g);
  B.reach = 1.8;   // the camera may lean past the back row, so the whole gate shows when you walk up to it
  toriiFrame(g, span, tall, 0, red, black, gold);
  const at = B.town?.gate;   // two great stone lanterns in the glade either side (forest() leaves it clear)
  if (at) for (const dx of [-2, 3]) piece('stonelantern', at.x + dx, 1, { scale: 1.4 })?.traverse(o => { if (o.material?.emissiveMap) { o.material.emissive = new THREE.Color('#ffc070'); lit.push(o.material); } });
  const back = new THREE.Group();   // the next gate up the stair, smaller and in the trees' shade
  back.position.set(0, 0, -1.15); back.scale.setScalar(0.8);
  g.add(back);
  toriiFrame(back, span, tall, 0, std({ color: '#b8341f', roughness: 0.5 }), black, gold);
  const plaque = plaqueArt(name);
  panel(plaque, 0.62, 0.84, x, tall - 0.27, z + 0.14, { glow: plaque }).userData.spot = 'exit';
  // the sacred rope, thick twisted straw sagging between the pillars, its paper streamers swaying
  const ropeY = tall - 0.85, sag = 0.22, w = span / 2 - 0.12;
  const curve = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => { const t = i / 8 * 2 - 1; return new THREE.Vector3(t * w, ropeY - sag * (1 - t * t), 0.12); }));
  const straw = std({ color: '#d8c080', roughness: 0.95 });
  mesh(new THREE.TubeGeometry(curve, 40, 0.075, 10), straw, 0, 0, 0, g);
  for (const [r, off] of [[0.035, 0.05], [0.035, -0.05]]) {
    const twist = new THREE.CatmullRomCurve3(Array.from({ length: 33 }, (_, i) => { const t = i / 32, p = curve.getPoint(t); return new THREE.Vector3(p.x, p.y + Math.sin(t * 40 + off * 60) * 0.05, p.z + Math.cos(t * 40 + off * 60) * 0.05); }));
    mesh(new THREE.TubeGeometry(twist, 96, r, 6), std({ color: '#b89a58', roughness: 1 }), 0, 0, 0, g).castShadow = false;
  }
  const paper = std({ map: texOf(shideArt()), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 });
  const shide = [-0.62, -0.2, 0.2, 0.62].map((t, i) => {
    const p = curve.getPoint((t * 0.9 + 1) / 2), pivot = new THREE.Group();
    pivot.position.set(p.x, p.y - 0.04, 0.13); g.add(pivot);
    const m = mesh(new THREE.PlaneGeometry(0.16, 0.42), paper, 0, -0.21, 0, pivot);
    m.castShadow = false; m.userData.i = i;
    return pivot;
  });
  // red paper lanterns hung from the top beam's ends, outside the pillars
  const paperGlow = std({ color: '#e04a30', emissive: new THREE.Color('#ff7040'), emissiveIntensity: 1, roughness: 0.7 });
  lit.push(paperGlow);
  const lanterns = [-1, 1].map(s => {
    const pivot = new THREE.Group();
    pivot.position.set(s * (span / 2 + 0.62), tall - 0.06, 0.05); g.add(pivot);
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 4), black, 0, -0.18, 0, pivot).castShadow = false;
    const body = mesh(new THREE.SphereGeometry(0.2, 18, 14), paperGlow, 0, -0.56, 0, pivot);
    body.scale.y = 1.25; body.castShadow = false;
    for (const dy of [-0.31, 0.31]) mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 14), black, 0, -0.56 + dy * 0.8, 0, pivot);
    return pivot;
  });
  // the way through, glowing: a veil of light, a ring on the road, motes rising, a lamp
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(span - 0.3, tall - 0.6), new THREE.MeshBasicMaterial({ map: texOf(veilArt()), transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false }));
  veil.position.set(0, (tall - 0.6) / 2, -0.02); veil.raycast = () => {}; g.add(veil);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(span + 0.6, span + 0.6), new THREE.MeshBasicMaterial({ map: texOf(poolArt()), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.03, 0.25); pool.raycast = () => {}; g.add(pool);
  const dark = time === 'night' ? 1.6 : time === 'dusk' ? 1.2 : time === 'dawn' ? 0.9 : 0.5;
  const lamp = new THREE.PointLight('#ffb870', 2.2 * dark, 6, 1.5);
  lamp.position.set(0, 1.3, 0.6); g.add(lamp);
  const motes = Array.from({ length: 26 }, (_, i) => {
    const sp = sprite(emberArt(['#ffe090', '#ffb070', '#ff90c0'][i % 3]), 0.1 + (i % 4) * 0.03);
    sp.material.blending = THREE.AdditiveBlending;
    sp.userData = { x: (Math.random() - 0.5) * (span - 0.4), at: Math.random(), speed: 0.12 + Math.random() * 0.1, sway: Math.random() * 6 };
    return sp;
  });
  B.ticks.push((now) => {
    const pulse = 0.5 + Math.sin(now / 900) * 0.5;
    veil.material.opacity = calm ? 0.5 : 0.42 + pulse * 0.25;
    pool.material.opacity = calm ? 0.7 : 0.55 + pulse * 0.35;
    pool.scale.setScalar(calm ? 1 : 0.96 + pulse * 0.06);
    lamp.intensity = 2.2 * dark * (calm ? 1 : 0.85 + pulse * 0.3);
    for (const [i, p] of lanterns.entries()) p.rotation.z = calm ? 0 : Math.sin(now / 1100 + i * 1.7) * 0.07;
    for (const p of shide) p.rotation.x = calm ? 0 : Math.sin(now / 650 + p.children[0].userData.i) * 0.22;
    for (const sp of motes) {
      const u = sp.userData, t = (u.at + now / 1000 * u.speed) % 1;
      sp.visible = !calm;
      sp.position.set(x + u.x + Math.sin(t * 7 + u.sway) * 0.15, 0.15 + t * (tall - 0.4), z + Math.cos(t * 5 + u.sway) * 0.15);
      sp.material.opacity = Math.min(1, t * 6, (1 - t) * 3);
    }
  });
  // the way through, unseen: a tap in the opening (the scenery beyond shows there) is the gate too
  const way = mesh(new THREE.PlaneGeometry(span - 0.2, tall), new THREE.MeshBasicMaterial({ visible: false }), 0, tall / 2, 0.05, g);
  way.castShadow = way.receiveShadow = false;
  g.traverse(o => { o.userData.spot = 'exit'; });
  return g;
}

/** A town's broken Waystone (js/data/towns.js), the plaza's middle: a stepped stone plinth in a ring of runes, the stone
    split and its top fallen at its foot, a faint light flickering in the crack and the runes. Mended (the next session's)
    it will stand whole and blaze. */
function waystone(f, L, mended = false) {
  if (mended) return wholeWaystone(f, L);
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  g.scale.setScalar(1.45);   // the plaza's centrepiece, over the lanterns
  B.group.add(g);
  const stone = std({ color: L.stone[1], roughness: 0.95, flatShading: true }), dark = std({ color: L.stone[3], roughness: 1, flatShading: true });
  const glow = std({ color: '#2a4060', emissive: new THREE.Color('#70d8ff'), emissiveIntensity: 0.6, roughness: 0.5 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.22, 48), std({ color: '#203040', emissive: new THREE.Color('#58c0f0'), emissiveIntensity: 0.35, transparent: true, opacity: 0.7, roughness: 1 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; ring.raycast = () => {}; ring.receiveShadow = true;
  g.add(ring);
  for (let i = 0; i < 8; i++) {   // rune stones round the ring, a gap where the light went out
    if (i === 5) continue;
    const a = i / 8 * Math.PI * 2, m = mesh(new THREE.BoxGeometry(0.16, 0.05, 0.1), glow, Math.cos(a) * 1.14, 0.04, Math.sin(a) * 1.14, g);
    m.rotation.y = -a; m.castShadow = false;
  }
  mesh(new THREE.CylinderGeometry(0.9, 0.98, 0.18, 8), dark, 0, 0.09, 0, g);
  mesh(new THREE.CylinderGeometry(0.66, 0.74, 0.16, 8), stone, 0, 0.26, 0, g);
  // the standing half, split down the middle, the two shards leaning apart; the crack between them lit
  const shard = (sx, tall, lean) => {
    const geo = new THREE.CylinderGeometry(0.17, 0.26, tall, 4, 1); geo.translate(0, tall / 2, 0); geo.rotateY(Math.PI / 4);
    const m = mesh(geo, stone, sx * 0.15, 0.34, 0, g);
    m.scale.set(1, 1, 1.25); m.rotation.z = lean;
    return m;
  };
  shard(-1, 1.6, 0.06); shard(1, 1.25, -0.1);
  const crack = mesh(new THREE.BoxGeometry(0.05, 1.15, 0.2), glow, 0, 0.34 + 0.6, 0, g); crack.castShadow = false;
  // the top, broken off, lying at its foot, and rubble
  const top = new THREE.CylinderGeometry(0.02, 0.24, 0.7, 4, 1); top.rotateY(Math.PI / 4);
  const fallen = mesh(top, stone, 0.62, 0.42, 0.5, g); fallen.rotation.set(0.3, 0.7, Math.PI / 2.3);
  const rnd = seeded(7);
  for (let i = 0; i < 6; i++) {
    const a = rnd() * Math.PI * 2, r = 0.55 + rnd() * 0.5;
    const m = mesh(new THREE.DodecahedronGeometry(0.06 + rnd() * 0.07, 0), i % 2 ? stone : dark, Math.cos(a) * r, 0.36, Math.sin(a) * r, g);
    m.position.y = r > 0.7 ? 0.22 : 0.4; m.rotation.set(rnd() * 3, rnd() * 3, 0);
  }
  B.ticks.push((now) => {   // a weak, uneven flicker: something still alive in it (blazing as the shard sinks in, mendStone())
    const k = calm ? 0.5 : 0.5 + 0.25 * Math.sin(now / 900) * Math.sin(now / 370 + 1);
    glow.emissiveIntensity = k + (g.userData.boost || 0);
  });
  return g;
}

/** A mended Waystone (friendship MEND_AT, js/data/towns.js; session 2, 2026-10-14): the stone whole again on its plinth,
    every rune round its ring lit, runes glowing up its faces, a crystal turning over its tip and a soft light on the
    plaza. Its crystal on the Clearing's Waystone is lit, and a tap here on a visit from home travels back. */
function wholeWaystone(f, L) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  g.scale.setScalar(1.45);
  B.group.add(g);
  const stone = std({ color: L.stone[1], roughness: 0.9, flatShading: true }), dark = std({ color: L.stone[3], roughness: 1, flatShading: true });
  const glow = std({ color: '#2a5070', emissive: new THREE.Color('#8ae8ff'), emissiveIntensity: 1.4, roughness: 0.4 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.22, 48), std({ color: '#205060', emissive: new THREE.Color('#70e0ff'), emissiveIntensity: 1, transparent: true, opacity: 0.85, roughness: 1 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; ring.raycast = () => {};
  g.add(ring);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, m = mesh(new THREE.BoxGeometry(0.16, 0.05, 0.1), glow, Math.cos(a) * 1.14, 0.04, Math.sin(a) * 1.14, g);
    m.rotation.y = -a; m.castShadow = false;
  }
  mesh(new THREE.CylinderGeometry(0.9, 0.98, 0.18, 8), dark, 0, 0.09, 0, g);
  mesh(new THREE.CylinderGeometry(0.66, 0.74, 0.16, 8), stone, 0, 0.26, 0, g);
  const geo = new THREE.CylinderGeometry(0.04, 0.27, 1.9, 4, 1); geo.translate(0, 0.95, 0); geo.rotateY(Math.PI / 4);
  mesh(geo, stone, 0, 0.34, 0, g).scale.set(1, 1, 1.25);
  for (const [y, w] of [[0.7, 0.16], [0.98, 0.13], [1.26, 0.1], [1.52, 0.07]]) {   // runes up its front and back
    for (const z of [0.2, -0.2]) mesh(new THREE.BoxGeometry(w, 0.05, 0.02), glow, 0, y, z * (1.8 - y) / 1.4, g).castShadow = false;
  }
  const gem = mesh(new THREE.OctahedronGeometry(0.16, 0), glow, 0, 2.55, 0, g);
  gem.castShadow = false;
  const light = new THREE.PointLight('#8ae8ff', 2.2, 7, 1.6);
  light.position.set(0, 2, 0.4);
  g.add(light);
  B.ticks.push((now) => {
    const k = calm ? 1.3 : 1.3 + 0.3 * Math.sin(now / 700);
    glow.emissiveIntensity = k;
    gem.rotation.y = calm ? 0 : now / 900;
    gem.position.y = 2.55 + (calm ? 0 : Math.sin(now / 600) * 0.06);
  });
  return g;
}

/** The five-storey pagoda over the rooftops, its roofs copper-green, a gold spire on top. */
function pagoda(x, z, L) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  B.group.add(g);
  const stone = std({ color: L.stone[2], roughness: 0.95 }), red = std({ color: VERMILION, roughness: 0.6 }), white = std({ color: '#efe6d2', roughness: 0.9 });
  const roofMat = std({ map: roofTiles(['#9ad8bc', '#5aa88a', '#2e7458'], 2, 1), roughness: 0.6, flatShading: true });
  const gold = std({ color: '#e8c050', metalness: 0.7, roughness: 0.3 });
  mesh(rbox(2.0, 0.3, 2.0, 0.04), stone, 0, 0.15, 0, g);
  let y = 0.3;
  for (let i = 0; i < 5; i++) {
    const s = 1.45 - i * 0.17, hgt = i ? 0.42 : 0.6;
    mesh(new THREE.BoxGeometry(s, hgt, s), [red, red, white, white, red, red], 0, y + hgt / 2, 0, g);
    mesh(new THREE.BoxGeometry(s + 0.06, 0.07, s + 0.06), white, 0, y + hgt - 0.08, 0, g);
    y += hgt;
    const roof = mesh(new THREE.CylinderGeometry(0.12, s * 0.98, 0.32, 4, 1), roofMat, 0, y + 0.12, 0, g);
    roof.rotation.y = Math.PI / 4;
    y += 0.22;
  }
  mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.1, 10), gold, 0, y + 0.55, 0, g);
  for (let k = 0; k < 6; k++) mesh(new THREE.TorusGeometry(0.11 - k * 0.008, 0.02, 6, 16), gold, 0, y + 0.18 + k * 0.12, 0, g).rotation.x = Math.PI / 2;
  mesh(new THREE.SphereGeometry(0.07, 12, 10), gold, 0, y + 1.12, 0, g);
  return g;
}

/** A house's name board on its post (`n`, beside the door): big white letters on deep indigo, a gold second line, so
    it reads from the path (the Clearing's lesson, 2026-10-14: pale small signs couldn't be read). */
function nameBoardArt(lines) {
  const f = fine(48, 24, 8), { g, rr, lin } = f;
  rr(0, 0, 48, 24, 2.4, '#e8c060');
  rr(1.4, 1.4, 45.2, 21.2, 1.6, lin(0, 0, 0, 24, ['#2c3a78', '#1a2456']));
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ffffff'; g.font = 'bold 10px sans-serif'; g.fillText(lines[0], 24, lines[1] ? 9 : 12.5, 42);
  if (lines[1]) { g.fillStyle = '#ffd860'; g.font = 'bold 7px sans-serif'; g.fillText(lines[1], 24, 18, 42); }
  return f.c;
}

/** A name board by each named house (`n`, or `at`: Driftwood Landing's `n` is a net): the nearest named building's
    name, a leader's with GYM LEADER under it. Lantern Village's, Cinder Springs' and Driftwood Landing's (the user's ask,
    2026-10-14: every name readable from the path). */
function nameBoards(town, at = 'n') {
  const { map } = town;
  for (const [x, y] of map.flatMap((row, y) => [...row].map((ch, x) => (ch === at ? [x, y] : null)).filter(Boolean))) {
    const named = town.buildings.filter(b => b.name).map(b => ({ b, f: footprint(map, b.at) }))
      .sort((p, q) => Math.hypot(Math.max(p.f.x0 - x, 0, x - p.f.x1), Math.max(p.f.y0 - y, 0, y - p.f.y1)) - Math.hypot(Math.max(q.f.x0 - x, 0, x - q.f.x1), Math.max(q.f.y0 - y, 0, y - q.f.y1)))[0]?.b;
    if (!named) continue;
    const leader = town.homes?.[named.home]?.leader, words = named.name.split(' ');
    const lines = leader ? [named.name, 'GYM LEADER'] : named.name.length > 9 ? [words[0], words.slice(1).join(' ')] : [named.name];
    signboard(nameBoardArt(lines), tileX(x), tileZ(y) + 0.35, 1.4, 0.7, 0.62).raycast = () => {};
    (B.signs ??= {})[named.id] = [tileX(x), 0.97, tileZ(y) + 0.4];   // a quest's "!" floats over it (markQuests())
    B.blocked.add(key(x, y));
  }
}

/** Lantern Village's own (the user's ask, 2026-10-14): the koi pond cut into the west garden (`~`, the ground's `holes`),
    its bed and still jade water, a stone lip, irises and lily pads, koi circling under the surface; the vermilion bridge
    over it (`-`), railings arching a little along it on posts down to the bed, gold caps on the posts; and a name board
    by each named house (`n`). */
const POND_Y = -0.16, POND_BED = -0.5;
function villageExtras(town, L) {
  const { map } = town, wet = (x, y) => map[y]?.[x] === '~', deck = (x, y) => map[y]?.[x] === '-';
  const pond = [];
  map.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '~') { pond.push([x, y]); B.blocked.add(key(x, y)); } }));
  nameBoards(town);
  if (!pond.length) return;
  const r = seeded(43), T = 16, f = fine(COLS * T, ROWS * T, 2), { g } = f, W = COLS * T, H = ROWS * T;
  g.fillStyle = '#3a4634'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 600; i++) { g.fillStyle = ['#46543e', '#2e3a2a', '#56604a', '#6a6c5a'][i % 4]; g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 4, 1 + r() * 3, r() * 3, 0, Math.PI * 2); g.fill(); }
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), std({ map: texOf(f.c), roughness: 1 }));
  bed.rotation.x = -Math.PI / 2; bed.position.y = POND_BED; bed.receiveShadow = true; bed.raycast = () => {};
  B.group.add(bed);
  const wc = document.createElement('canvas');
  wc.width = wc.height = 128;
  const wg = wc.getContext('2d'), wr = seeded(11);
  wg.fillStyle = '#d8e8e0'; wg.fillRect(0, 0, 128, 128);
  wg.strokeStyle = '#ffffff'; wg.lineWidth = 1.2;
  for (let i = 0; i < 18; i++) {
    const x = wr() * 128, y = wr() * 128, w = 8 + wr() * 16;
    for (const ox of [0, -128, 128]) for (const oy of [0, -128, 128]) { wg.beginPath(); wg.moveTo(x + ox - w / 2, y + oy); wg.quadraticCurveTo(x + ox, y + oy - 2.5, x + ox + w / 2, y + oy); wg.stroke(); }
  }
  const ripple = new THREE.CanvasTexture(wc);
  ripple.wrapS = ripple.wrapT = THREE.RepeatWrapping; ripple.colorSpace = THREE.SRGBColorSpace; ripple.repeat.set(COLS / 5, ROWS / 5);
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), std({ color: '#4a9a88', map: ripple, emissive: new THREE.Color('#184e46'), emissiveIntensity: 0.3, transparent: true, opacity: 0.66, roughness: 0.05, metalness: 0.25, depthWrite: false }));
  surface.rotation.x = -Math.PI / 2; surface.position.y = POND_Y; surface.receiveShadow = true; surface.raycast = () => {};
  surface.renderOrder = 1;
  B.group.add(surface);
  // the banks sloping down under the stone lip, stones along it, irises on some of it; lily pads out on the water
  const banks = [], stones = [], blades = [], irises = [], pads = [];
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '~') {
      if (r() < 0.3 && !STEPS.some(([dx, dy]) => deck(x + dx, y + dy))) pads.push([tileX(x) + (r() - 0.5) * 0.6, tileZ(y) + (r() - 0.5) * 0.6, 0.7 + r() * 0.5, r() * 6, ['#5aa848', '#4a9a3e', '#6ab858'][Math.floor(r() * 3)], POND_Y + 0.005]);
      return;
    }
    if (deck(x, y) || !STEPS.some(([dx, dy]) => wet(x + dx, y + dy))) return;
    banks.push([tileX(x), tileZ(y), 1, Math.PI / 4, L.stone[3], -0.01]);
    for (const [dx, dy] of STEPS) {
      if (!wet(x + dx, y + dy)) continue;
      for (let i = 0; i < 2; i++) {
        const along = (r() - 0.5) * 0.8;
        stones.push([tileX(x) + dx * 0.44 + (dy ? along : 0), tileZ(y) + dy * 0.44 + (dx ? along : 0), 0.14 + r() * 0.1, r() * 6, ['#a8a49a', '#8a867c', '#c0bcb0'][Math.floor(r() * 3)], 0.02]);
      }
      if (r() < 0.45) for (let i = 0; i < 7; i++) {
        const along = (r() - 0.5) * 0.7, px = tileX(x) + dx * 0.3 + (dy ? along : 0), pz = tileZ(y) + dy * 0.3 + (dx ? along : 0);
        blades.push([px, pz, 0.8 + r() * 0.4, r() * 6, ['#4e8a3a', '#3e7a32', '#5e9a46'][Math.floor(r() * 3)]]);
        if (i % 3 === 0) irises.push([px, pz, 0.9 + r() * 0.3, r() * 6, r() < 0.7 ? '#7a5ad8' : '#f4f0ff', 0.5 + r() * 0.1]);
      }
    }
  }));
  const bank = new THREE.CylinderGeometry(0.707, 0.95, 0.6, 4, 1, true); bank.translate(0, -0.3, 0);
  instanced(bank, std({ color: '#ffffff', roughness: 1 }), banks).castShadow = false;
  const stone = new THREE.DodecahedronGeometry(1, 0); stone.scale(1, 0.55, 0.85);
  instanced(stone, std({ color: '#ffffff', roughness: 0.95, flatShading: true }), stones).castShadow = false;
  const blade = new THREE.ConeGeometry(0.022, 0.55, 4); blade.translate(0, 0.27, 0);
  instanced(blade, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), blades).castShadow = false;
  instanced(new THREE.OctahedronGeometry(0.055, 0), std({ color: '#ffffff', roughness: 0.7, flatShading: true }), irises).castShadow = false;
  const pad = new THREE.CylinderGeometry(0.16, 0.16, 0.01, 14, 1, false, 0.3, Math.PI * 2 - 0.6);
  instanced(pad, std({ color: '#ffffff', roughness: 0.6 }), pads).castShadow = false;
  // the bridge: posts down to the bed at each corner over the water, two rails between them arching a little along it,
  // a vermilion board along each edge over the water, gold caps on the posts
  const runOf = (x, y) => {
    const vert = deck(x, y - 1) || deck(x, y + 1);
    let a = vert ? y : x, b = a;
    while (vert ? deck(x, a - 1) : deck(a - 1, y)) a--;
    while (vert ? deck(x, b + 1) : deck(b + 1, y)) b++;
    return { vert, a, n: b - a + 1 };
  };
  const arch = (t) => Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
  const posts = [], caps = [], rails = [], fascia = [], seen = new Set();
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '-') return;
    const run = runOf(x, y), t = (u) => (u - run.a) / run.n;
    for (const [dx, dy] of STEPS) {
      if (!wet(x + dx, y + dy)) continue;
      const side = !!dx === run.vert;   // the edge runs along the bridge
      fascia.push([tileX(x) + dx * 0.48, tileZ(y) + dy * 0.48, dx ? Math.PI / 2 : 0]);
      if (!side) continue;
      const ends = run.vert ? [[x + (dx > 0 ? 1 : 0), y], [x + (dx > 0 ? 1 : 0), y + 1]] : [[x, y + (dy > 0 ? 1 : 0)], [x + 1, y + (dy > 0 ? 1 : 0)]];
      const [h0, h1] = ends.map(([cx, cy]) => arch(t(run.vert ? cy : cx)));
      const [ax, ay] = ends[0], mx = run.vert ? ax - COLS / 2 - dx * 0.06 : ax + 0.5 - COLS / 2, mz = run.vert ? ay + 0.5 - ROWS / 2 : ay - ROWS / 2 - dy * 0.06;
      for (const [hgt, k] of [[0.5, 0.12], [0.27, 0.06]]) rails.push([mx, hgt + (h0 + h1) / 2 * k, mz, run.vert ? -Math.PI / 2 : 0, Math.atan((h1 - h0) * k)]);
      for (const [[cx, cy], h] of [[ends[0], h0], [ends[1], h1]]) {
        const c = `${cx},${cy},${dx},${dy}`;
        if (seen.has(c)) continue;
        seen.add(c);
        const px = cx - COLS / 2 - dx * 0.06, pz = cy - ROWS / 2 - dy * 0.06, top = 0.56 + h * 0.12;
        posts.push([px, POND_BED, pz, 0, 0, top - POND_BED]);
        caps.push([px, pz, 1, 0, null, top + 0.03]);
      }
    }
  }));
  const red = std({ color: VERMILION, roughness: 0.55 }), o = new THREE.Object3D();
  const bars = (geo, items, set) => {
    const m = new THREE.InstancedMesh(geo, red, items.length);
    items.forEach((it, i) => { set(o, it); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.castShadow = true; m.raycast = () => {};
    B.group.add(m);
  };
  const post = new THREE.CylinderGeometry(0.045, 0.05, 1, 8); post.translate(0, 0.5, 0);
  bars(post, posts, (d, [x, y, z, , , h]) => { d.position.set(x, y, z); d.rotation.set(0, 0, 0); d.scale.set(1, h, 1); });
  bars(new THREE.BoxGeometry(1.02, 0.06, 0.06), rails, (d, [x, y, z, turn, tilt]) => { d.position.set(x, y, z); d.rotation.set(0, turn, tilt); d.scale.set(1, 1, 1); });
  const board = new THREE.BoxGeometry(1.0, 0.14, 0.05); board.translate(0, -0.07, 0);
  bars(board, fascia, (d, [x, z, turn]) => { d.position.set(x, 0, z); d.rotation.set(0, turn, 0); d.scale.set(1, 1, 1); });
  instanced(new THREE.SphereGeometry(0.055, 10, 8), std({ color: '#e8c050', metalness: 0.7, roughness: 0.3 }), caps).castShadow = false;
  // koi circling under the surface, each on its own loop round the pond's middle
  const xs = pond.map(p => p[0]), ys = pond.map(p => p[1]);
  const cx = tileX((Math.min(...xs) + Math.max(...xs)) / 2), cz = tileZ((Math.min(...ys) + Math.max(...ys)) / 2);
  const rx = (Math.max(...xs) - Math.min(...xs) + 1) / 2 - 1.1, rz = (Math.max(...ys) - Math.min(...ys) + 1) / 2 - 0.9;
  const fish = Array.from({ length: 7 }, (_, i) => ({ k: 0.55 + r() * 0.45, a: r() * 6.3, speed: (0.12 + r() * 0.1) * (i % 3 ? 1 : -1), sway: r() * 6 }));
  const body = new THREE.SphereGeometry(1, 12, 8); body.scale(0.19, 0.045, 0.07);
  const tail = new THREE.ConeGeometry(0.06, 0.13, 6); tail.rotateZ(Math.PI / 2); tail.scale(1, 0.4, 1); tail.translate(-0.22, 0, 0);
  const koi = [body, tail].map(geo => {
    const m = new THREE.InstancedMesh(geo, std({ color: '#ffffff', roughness: 0.5 }), fish.length), col = new THREE.Color();
    fish.forEach((_, i) => m.setColorAt(i, col.set(['#f87830', '#f8f4ec', '#e83a28', '#f8b040', '#fff4e0', '#f06030', '#2a2422'][i])));
    m.castShadow = false; m.raycast = () => {}; m.renderOrder = 0;
    B.group.add(m);
    return m;
  });
  let drawn = false;
  B.ticks.push((now) => {
    if (calm && drawn) return;
    drawn = true;
    fish.forEach((p, i) => {
      const a = p.a + now / 1000 * p.speed, dir = Math.sign(p.speed);
      o.position.set(cx + Math.cos(a) * rx * p.k, POND_Y - 0.12, cz + Math.sin(a) * rz * p.k);
      o.rotation.set(0, Math.atan2(-Math.cos(a) * rz * dir, -Math.sin(a) * rx * dir) + (calm ? 0 : Math.sin(now / 320 + p.sway) * 0.18), 0);
      o.scale.setScalar(p.k * 1.2);
      o.updateMatrix();
      for (const m of koi) m.setMatrixAt(i, o.matrix);
    });
    for (const m of koi) m.instanceMatrix.needsUpdate = true;
  });
}

/** Fades a building while your Pokémon is behind it (Highbough's crowns do the same, `B.crowns`), so a roof or the
    pagoda never hides it: everything in `g`, back from its back wall as far as its height hides from the camera. */
function fadeBehind(g) {
  const mats = new Map();
  g.traverse(o => { if (o.material) for (const m of [].concat(o.material)) if (!mats.has(m)) { mats.set(m, [m, m.opacity, m.depthWrite]); m.transparent = true; } });
  const box = new THREE.Box3().setFromObject(g);
  if (!B.fades) {
    B.fades = [];
    const list = B.fades;
    B.ticks.push(() => {
      for (const h of list) {
        const to = walker.x > h.x0 && walker.x < h.x1 && walker.z < h.back + 0.5 && walker.z > h.back - h.reach ? 0.3 : 1;
        if (h.op === to) continue;
        h.op = calm || Math.abs(to - h.op) < 0.02 ? to : h.op + (to - h.op) * 0.15;
        for (const [m, base, dw] of h.mats) { m.opacity = base * h.op; m.depthWrite = h.op > 0.95 && dw; }
      }
    });
  }
  B.fades.push({ x0: box.min.x - 0.2, x1: box.max.x + 0.2, back: box.min.z, reach: box.max.y / Math.tan(PITCH) + 0.4, mats: [...mats.values()], op: 1 });
}

/** The request board's face: planks, papers pinned up, one stamped. */
function boardArt() {
  const f = fine(56, 36, 8), { g, rr, lin } = f, r = seeded(83);
  rr(0, 0, 56, 36, 2, '#5a3418');
  rr(1.8, 1.8, 52.4, 32.4, 1.2, lin(0, 0, 0, 36, ['#b88050', '#9a6438']));
  g.fillStyle = 'rgba(60,30,10,0.35)'; for (let y = 8; y < 34; y += 7) g.fillRect(2, y, 52, 0.5);
  const notes = [[5, 5, 13, 12], [21, 4, 14, 15], [38, 6, 12, 11], [7, 20, 15, 12], [26, 22, 11, 10], [40, 20, 11, 13]];
  notes.forEach(([x, y, w, h], i) => {
    g.save(); g.translate(x + w / 2, y + h / 2); g.rotate((r() - 0.5) * 0.12);
    rr(-w / 2 + 0.5, -h / 2 + 0.6, w, h, 0.4, 'rgba(0,0,0,0.25)');
    rr(-w / 2, -h / 2, w, h, 0.4, i === 1 ? '#fff6dc' : '#f4ead0');
    g.fillStyle = '#5a4a3a';
    for (let k = 0; k < 4; k++) g.fillRect(-w / 2 + 2, -h / 2 + 3 + k * 2.4, (w - 4) * (0.5 + r() * 0.5), 0.6);
    if (i === 1) { g.strokeStyle = '#d83828'; g.lineWidth = 0.9; g.beginPath(); g.arc(w / 2 - 3.5, h / 2 - 3.5, 2.2, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#d83828'; g.beginPath(); g.arc(0, -h / 2 + 1, 0.8, 0, Math.PI * 2); g.fill();
    g.restore();
  });
  return f.c;
}

/** The request board by the road: a roofed frame on two posts. */
function noticeBoard(x, z, turn, L) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = turn;
  B.group.add(g);
  const dark = std({ color: '#4a2c18', roughness: 0.8 }), roofMat = std({ map: roofTiles(['#5a6a78', '#3e4a58', '#28323e'], 0.8, 0.6), roughness: 0.55 });
  for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.1, 1.75, 0.1), dark, s * 0.72, 0.875, 0, g);
  const face = std({ map: texOf(boardArt()), roughness: 0.9 });
  mesh(new THREE.BoxGeometry(1.4, 0.9, 0.06), [dark, dark, dark, dark, face, dark], 0, 1.15, 0.02, g);
  const geo = new THREE.ExtrudeGeometry(roofShape(0.32, 0.26, 0.05), { depth: 1.75, bevelEnabled: false, curveSegments: 8 });
  geo.rotateY(Math.PI / 2); geo.translate(-0.875, 0, 0);
  mesh(geo, [roofMat, dark], 0, 1.72, 0, g);
  g.traverse(o => { o.userData.spot = 0; });
  return g;
}

/** A maple leaf, for the ones drifting down. */
function leafArt(col) {
  const f = fine(12, 12, 8), { g } = f;
  g.fillStyle = col; g.translate(6, 6);
  g.beginPath(); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * 5.4, Math.sin(a) * 5.4); g.lineTo(Math.cos(a + 0.63) * 2.2, Math.sin(a + 0.63) * 2.2); } g.fill();
  g.strokeStyle = 'rgba(80,20,10,0.5)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 5); g.stroke();
  return f.c;
}

/* Cinder Springs, the Wastes' (Lavaridge's): crags and dead trees for its forest, adobe houses on stone with clay roofs
   and smoking chimneys, a bathhouse, the mine's headframe and rails, steaming springs, a timber mine gate out, ash
   drifting down and embers rising. */

/** The crags round the town, a rock a tile: boulders, spires of rock, a dead tree now and then; the front rows rubble. */
function crags(map, L, rnd) {
  const rocks = [], spires = [], dead = [];
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'T') return;
    B.blocked.add(key(x, y));
    const cx = tileX(x) + (rnd() - 0.5) * 0.4, cz = tileZ(y) + (rnd() - 0.5) * 0.4;
    if (y >= ROWS - 2) { rocks.push([cx, cz, 0.45 + rnd() * 0.3, rnd() * 6, L.rock[1 + Math.floor(rnd() * 2)]]); return; }   // low, so it never hides you
    if (map[y + 1]?.[x] === '~') return;   // clear in front of the lavafall (lavaField()), so it's seen whole
    const k = rnd();
    if (k < 0.4) spires.push([cx, cz, 0.7 + rnd() * 0.8, rnd() * 6, L.rock[Math.floor(rnd() * 3)]]);
    else if (k < 0.48) dead.push([cx, cz, 0.8 + rnd() * 0.5, rnd() * 6]);
    rocks.push([cx + (rnd() - 0.5) * 0.3, cz + (rnd() - 0.5) * 0.3, 0.7 + rnd() * 0.6, rnd() * 6, L.rock[Math.floor(rnd() * 3)]]);
  }));
  const rock = new THREE.DodecahedronGeometry(0.62, 0); rock.scale(1, 0.72, 1); rock.translate(0, 0.32, 0);
  instanced(rock, std({ color: '#ffffff', roughness: 1, flatShading: true }), rocks);
  const spire = new THREE.ConeGeometry(0.42, 2.3, 6, 2); spire.translate(0, 1.15, 0);
  instanced(spire, std({ color: '#ffffff', roughness: 1, flatShading: true }), spires);
  const bark = std({ color: '#4a3a34', roughness: 1 });
  const trunk = new THREE.CylinderGeometry(0.05, 0.11, 1.7, 6); trunk.translate(0, 0.85, 0);
  instanced(trunk, bark, dead);
  for (const [tilt, up, len] of [[0.9, 1.0, 0.7], [-0.8, 1.3, 0.55], [0.6, 1.55, 0.4]]) {
    const b = new THREE.CylinderGeometry(0.02, 0.045, len, 5); b.translate(0, len / 2, 0); b.rotateZ(tilt); b.translate(0, up, 0);
    instanced(b, bark, dead);
  }
}

/** A soft puff, for chimney smoke and the springs' steam. */
function puffArt(col) {
  const f = fine(16, 16, 6), { g } = f, r = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  r.addColorStop(0, col); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 16, 16);
  return f.c;
}

/** Puffs rising off `from` ([x, y, z] each), swelling and fading as they go: `n` a source, `size`, `rise` in tiles. */
function puffs(from, { col = 'rgba(240,240,236,0.85)', n = 3, size = 0.6, rise = 1.6, speed = 0.18 } = {}) {
  const art = puffArt(col), all = [];
  for (const [x, y, z] of from) for (let i = 0; i < n; i++) {
    const sp = sprite(art, size);
    sp.userData = { x, y, z, at: i / n + Math.random() * 0.1, speed: speed * (0.8 + Math.random() * 0.4), sway: Math.random() * 6 };
    all.push(sp);
  }
  B.ticks.push((now) => {
    for (const sp of all) {
      const u = sp.userData, t = (u.at + now / 1000 * u.speed) % 1;
      sp.visible = !calm;
      sp.position.set(u.x + Math.sin(t * 4 + u.sway) * 0.2 + t * 0.3, u.y + t * rise, u.z);
      sp.scale.setScalar(size * (0.5 + t * 1.2));
      sp.material.opacity = Math.min(1, t * 6) * (1 - t);
    }
  });
}

/** An adobe house's front: a plank door with a little lit window, a lit window either side, a stone footing. */
function cabinFront(w) {
  const W = Math.round(w * 20), f = fine(W, 30, 6), { g, rr, lin } = f, s = f.shine();
  g.fillStyle = lin(0, 0, 0, 30, ['#e4cca8', '#d4b892']); g.fillRect(0, 0, W, 30);
  g.fillStyle = 'rgba(120,80,50,0.12)'; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * W, Math.random() * 30, 2, 0.6);
  for (let x = 0; x < W; x += 5) for (const y of [25, 27.5]) rr(x + ((y > 26) ? 2.5 : 0) + 0.3, y, 4.4, 2.3, 0.6, ['#8a7a6c', '#a0907e', '#766658'][Math.floor(Math.random() * 3)]);
  const lit = (x, y, w, h) => {
    rr(x - 1, y - 1, w + 2, h + 2, 0.6, '#4a2e1c');
    for (const ctx of [g, s]) { const r = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w); r.addColorStop(0, '#fff4c8'); r.addColorStop(1, '#f8a040'); ctx.fillStyle = r; ctx.fillRect(x, y, w, h); }
    for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#000' : '#4a2e1c'; ctx.fillRect(x + w / 2 - 0.4, y, 0.8, h); ctx.fillRect(x, y + h / 2 - 0.4, w, 0.8); }
  };
  const mid = W / 2;
  rr(mid - 5, 9, 10, 21, 0.8, '#4a2e1c');
  rr(mid - 4, 10, 8, 20, 0.6, lin(mid - 4, 0, mid + 4, 0, ['#8a5a34', '#a06a40', '#8a5a34']));
  g.fillStyle = 'rgba(40,20,10,0.4)'; for (let x = mid - 2; x < mid + 4; x += 2) g.fillRect(x, 10, 0.5, 20);
  lit(mid - 1.8, 12.5, 3.6, 3.2);
  g.fillStyle = '#e8c050'; g.beginPath(); g.arc(mid + 2.6, 21, 0.7, 0, Math.PI * 2); g.fill();
  if (W > 40) { lit(mid - 14, 10, 6, 6); lit(mid + 8, 10, 6, 6); }
  return f.c;
}

/** A gable roof's end: two straight slopes, `t` thick. */
function gableShape(half, rise, t) {
  const s = new THREE.Shape();
  s.moveTo(-half, 0); s.lineTo(0, rise); s.lineTo(half, 0); s.lineTo(half, -t); s.lineTo(0, rise - t); s.lineTo(-half, -t); s.closePath();
  return s;
}

/** The hot-spring mark, ♨: a bowl and three wavy plumes (drawn, so no font needs the glyph). */
function onsenMark(g, x, y, k, col) {
  g.strokeStyle = col; g.lineWidth = 1.4 * k; g.lineCap = 'round';
  g.beginPath(); g.ellipse(x, y + 3 * k, 6 * k, 3 * k, 0, 0.15, Math.PI - 0.15); g.stroke();
  for (const dx of [-3, 0, 3]) {
    g.beginPath(); g.moveTo(x + dx * k, y + 2 * k);
    g.bezierCurveTo(x + (dx - 1.6) * k, y - 1 * k, x + (dx + 1.6) * k, y - 3 * k, x + dx * k, y - 6 * k); g.stroke();
  }
}

/** The bathhouse's banner: indigo, the ♨ mark, its name. */
function bathSign(name) {
  const f = fine(96, 22, 8), { g, rr, lin } = f;
  rr(0, 0, 96, 22, 2.5, '#2a3a5a');
  rr(1.8, 1.8, 92.4, 18.4, 1.6, lin(0, 0, 0, 22, ['#3a5a8a', '#2a4268']));
  onsenMark(g, 13, 11.5, 1, '#f8f0e0');
  g.fillStyle = '#f8f0e0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 11px sans-serif';
  g.fillText(name, 55, 12, 66);
  return f.c;
}

/** A wall of fieldstone, a tile of it that repeats: rounded stones of a few greys in dark mortar. */
function fieldstoneArt() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), r = seeded(19);
  g.fillStyle = '#3a302a'; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 8) for (let x = -((y / 8) % 2) * 6; x < 64; x += 12) {
    const w = 9 + r() * 3;
    g.fillStyle = ['#7a6e64', '#6a5e56', '#867a6e', '#5e544c'][Math.floor(r() * 4)];
    g.beginPath(); g.roundRect(x + 0.8, y + 0.8, w, 6.4, 2.4); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 2, y + 1.4, w - 3, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Brick, a tile of it that repeats, smoke-blackened, for the forge's stack. */
function brickArt() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), r = seeded(23);
  g.fillStyle = '#3a2620'; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 6) for (let x = -((y / 6) % 2) * 5; x < 64; x += 10) {
    g.fillStyle = ['#8a4a34', '#7a3e2c', '#9a5a40', '#6a3424'][Math.floor(r() * 4)];
    g.fillRect(x + 0.6, y + 0.6, 8.8, 4.8);
  }
  const fade = g.createLinearGradient(0, 0, 0, 64);
  fade.addColorStop(0, 'rgba(20,14,12,0.55)'); fade.addColorStop(1, 'rgba(20,14,12,0)');
  g.fillStyle = fade; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The forge's front: fieldstone, a pale arch of voussoirs round its mouth, the furnace glowing inside behind a grate. */
function forgeFront(w, h) {
  const W = Math.round(w * 20), H = Math.round(h * 20), f = fine(W, H, 6), { g, rr } = f, s = f.shine(), r = seeded(31);
  g.fillStyle = '#3a302a'; g.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 4.2) for (let x = -(Math.round(y / 4.2) % 2) * 3; x < W; x += 6.4) rr(x + 0.4, y + 0.4, 5.2 + r() * 1.2, 3.4, 1.2, ['#7a6e64', '#6a5e56', '#867a6e', '#5e544c'][Math.floor(r() * 4)]);
  const mid = W / 2, aw = 9.5, top = H - 20;
  g.strokeStyle = '#b4a48c'; g.lineWidth = 3.2;
  g.beginPath(); g.moveTo(mid - aw, H); g.lineTo(mid - aw, top + aw); g.arc(mid, top + aw, aw, Math.PI, 0); g.lineTo(mid + aw, H); g.stroke();
  g.strokeStyle = '#5a4c40'; g.lineWidth = 0.5;
  for (let k = 0; k <= 8; k++) { const a = Math.PI + k / 8 * Math.PI; g.beginPath(); g.moveTo(mid + Math.cos(a) * (aw - 1.6), top + aw + Math.sin(a) * (aw - 1.6)); g.lineTo(mid + Math.cos(a) * (aw + 1.6), top + aw + Math.sin(a) * (aw + 1.6)); g.stroke(); }
  rr(mid - 1.8, top - 2.2, 3.6, 3.4, 0.6, '#c8b89c');
  for (const ctx of [g, s]) {
    const fire = ctx.createRadialGradient(mid, H - 3, 0, mid, H - 3, aw * 1.6);
    fire.addColorStop(0, '#fff4b0'); fire.addColorStop(0.35, '#f8a030'); fire.addColorStop(1, '#a02a08');
    ctx.fillStyle = fire;
    ctx.beginPath(); ctx.moveTo(mid - aw + 1.6, H); ctx.lineTo(mid - aw + 1.6, top + aw); ctx.arc(mid, top + aw, aw - 1.6, Math.PI, 0); ctx.lineTo(mid + aw - 1.6, H); ctx.fill();
  }
  g.fillStyle = '#1a1210';
  for (let x = mid - 6; x <= mid + 6; x += 2.4) g.fillRect(x - 0.4, H - 6, 0.8, 6);
  g.fillRect(mid - 7, H - 6.4, 14, 0.9);
  return f.c;
}

/** The forge's sign, hung on chains under the eave: dark planks in an iron frame, a gold anvil and the word FORGE. */
function forgeSignArt() {
  const f = fine(64, 24, 8), { g, rr, lin } = f;
  rr(0, 0, 64, 24, 2, '#26201e');
  rr(1.6, 1.6, 60.8, 20.8, 1.4, lin(0, 0, 0, 24, ['#6a4428', '#4e3018']));
  g.fillStyle = 'rgba(30,16,8,0.4)'; for (let y = 7; y < 22; y += 5) g.fillRect(2, y, 60, 0.5);
  g.fillStyle = '#e8b040';
  g.beginPath(); g.moveTo(5, 8); g.lineTo(18, 8); g.lineTo(18, 11); g.quadraticCurveTo(14, 12, 13.5, 14); g.lineTo(15.5, 17); g.lineTo(7.5, 17); g.lineTo(9.5, 14); g.quadraticCurveTo(9, 11.5, 5, 10); g.closePath(); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 12px sans-serif'; g.fillText('FORGE', 40, 12.5, 40);
  return f.c;
}

/** Heatmor's Forge, Cinder Springs' trade house (the user's ask, 2026-10-14: "better designs of the other houses...
    especially the trade house"): a smithy of fieldstone on a basalt plinth, its arched mouth glowing with the furnace
    inside, a tiled roof in its colour and its sign hung under the eave; a great tapered brick stack at its back,
    smoking, embers spitting off its top; beside it an open lean-to on timber posts over the anvil, a hearth of glowing
    coals under an iron hood and a quench tub. Its lot is 4 x 3. A tap anywhere is its door. */
function forge(b, f, L, lit, smoke) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const W = f.w - 0.3, D = f.h - 0.4, P = 0.16;
  const roof = [shadeOf(b.roof, 1), b.roof, shadeOf(b.roof, -1)];
  const basalt = std({ color: '#3e3432', roughness: 1, flatShading: true }), cope = std({ color: '#8a7a6a', roughness: 1 });
  const wall = fieldstoneArt(), wood = std({ color: '#5a3c26', roughness: 0.9 }), dark = std({ color: '#2a201c', roughness: 0.8 });
  const iron = std({ color: '#2a2624', roughness: 0.45, metalness: 0.6 }), roofMat = std({ map: roofTiles(roof, 1.4, 1.4), roughness: 0.7 }), eave = std({ color: roof[2], roughness: 0.8 });
  const coals = std({ color: '#f87a20', emissive: new THREE.Color('#ff6010'), emissiveIntensity: 1, roughness: 0.6 });
  lit.push(coals);
  const small = (m) => { m.castShadow = false; return m; };
  mesh(rbox(W, P, D, 0.04), basalt, 0, P / 2, 0, g);
  // the smithy: fieldstone, its glowing mouth to you, the tiled roof over it, its sign under the eave
  const sw = 2.25, sd = D - 0.3, sh = 1.7, sx = -W / 2 + sw / 2 + 0.06, sz = -0.12, front = sz + sd / 2;
  const sideMat = (u) => { const t = wall.clone(); t.repeat.set(u, sh); return std({ map: t, roughness: 1 }); };
  const art = forgeFront(sw, sh), face = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.9, roughness: 0.95 });
  lit.push(face);
  const ends = sideMat(sd), back = sideMat(sw);
  mesh(new THREE.BoxGeometry(sw, sh, sd), [ends, ends, dark, dark, face, back], sx, P + sh / 2, sz, g);
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) small(mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), cope, sx + s * (sw / 2 + 0.01), P + 0.14 + k * 0.44, front + 0.01, g));
  const geo = new THREE.ExtrudeGeometry(gableShape(sd / 2 + 0.28, 0.8, 0.1), { depth: sw + 0.3, bevelEnabled: false });
  geo.rotateY(Math.PI / 2); geo.translate(-(sw + 0.3) / 2, 0, 0);
  mesh(geo, [roofMat, eave], sx, P + sh, sz, g);
  for (const s of [-1, 1]) small(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4), iron, sx + s * 0.45, P + sh - 0.06, front + 0.12, g));
  g.attach(panel(forgeSignArt(), 1.1, 0.41, f.cx + sx, P + sh - 0.38, f.cz + front + 0.13));
  // the stack: tapered brick at the back, a soot-black cap glowing inside, smoke and embers off its top
  const kx = sx - sw / 2 + 0.45, kz = sz - sd / 2 + 0.42, kh = 3.0, bricks = brickArt();
  bricks.repeat.set(2, 4);
  mesh(new THREE.CylinderGeometry(0.28, 0.42, kh, 8), std({ map: bricks, roughness: 1 }), kx, P + kh / 2, kz, g);
  mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 8), dark, kx, P + kh + 0.07, kz, g);
  small(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 8), coals, kx, P + kh + 0.15, kz, g));
  smoke.push([f.cx + kx, P + kh + 0.3, f.cz + kz, false]);
  const sparks = Array.from({ length: 8 }, (_, i) => { const sp = sprite(emberArt(i % 2 ? '#ffd060' : '#ff8020'), 0.09); sp.userData = { at: i / 8, sway: i * 1.7 }; return sp; });
  const ox = f.cx + kx, oy = P + kh + 0.2, oz = f.cz + kz;
  B.ticks.push((now) => {
    for (const sp of sparks) {
      const u = sp.userData, t = (u.at + now / 2600) % 1;
      sp.visible = !calm;
      sp.position.set(ox + Math.sin(t * 7 + u.sway) * 0.25 + t * 0.3, oy + t * 1.6, oz + Math.cos(t * 5 + u.sway) * 0.15);
      sp.material.opacity = Math.min(1, t * 10) * (1 - t);
    }
  });
  // the lean-to: posts and a sloped roof off the smithy's side, the hearth and its hood at the back, the anvil, a tub
  const lx0 = sx + sw / 2, lw = W / 2 - lx0, lx = lx0 + lw / 2, hi = P + 1.45, lo = P + 1.1;
  for (const z of [front - 0.12, sz - sd / 2 + 0.12]) mesh(new THREE.BoxGeometry(0.09, lo - P, 0.09), wood, W / 2 - 0.1, P + (lo - P) / 2, z, g);
  mesh(new THREE.BoxGeometry(0.08, 0.1, sd), wood, W / 2 - 0.1, lo - 0.02, sz, g);
  const lean = mesh(new THREE.BoxGeometry(Math.hypot(lw + 0.2, hi - lo), 0.05, sd + 0.3), [eave, eave, roofMat, eave, eave, eave], lx + 0.05, (hi + lo) / 2 + 0.03, sz, g);
  lean.rotation.z = -Math.atan2(hi - lo, lw + 0.2);
  const hz = sz - sd / 2 + 0.38;
  mesh(new THREE.BoxGeometry(0.75, 0.48, 0.5), std({ map: bricks, roughness: 1 }), lx, P + 0.24, hz, g);
  small(mesh(new THREE.BoxGeometry(0.6, 0.04, 0.36), coals, lx, P + 0.49, hz, g));
  const hood = new THREE.ConeGeometry(0.45, 0.42, 4, 1, true); hood.rotateY(Math.PI / 4);
  mesh(hood, std({ color: '#2a2624', roughness: 0.45, metalness: 0.6, side: THREE.DoubleSide }), lx, P + 0.95, hz, g);
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8), iron, lx, P + 1.35, hz, g);
  const anvil = piece('anvil', f.cx + lx + COLS / 2 - 0.5, f.cz + front - 0.55 + ROWS / 2 - 0.5, { scale: 0.75, y: P, free: true });
  if (anvil) g.attach(anvil);
  const tub = mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.34, 12), wood, W / 2 - 0.3, P + 0.17, front + 0.12, g);
  for (const y of [0.08, 0.26]) small(mesh(new THREE.TorusGeometry(0.195, 0.014, 4, 16), iron, 0, y - 0.17, 0, tub)).rotation.x = Math.PI / 2;
  small(mesh(new THREE.CircleGeometry(0.17, 14), std({ color: '#3a5a60', roughness: 0.15, metalness: 0.2 }), 0, 0.15, 0, tub)).rotation.x = -Math.PI / 2;
  return g;
}

/** A cottage's ground-floor front: adobe, an arched plank door with a lamp-lit pane, a lit window either side between
    shutters in the house's colour, a box of fire lilies under each. */
function cottageFront(w, h, shutter) {
  const W = Math.round(w * 20), H = Math.round(h * 20), f = fine(W, H, 6), { g, rr, lin } = f, s = f.shine(), r = seeded(41);
  g.fillStyle = lin(0, 0, 0, H, ['#ead4ae', '#d8bc94']); g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(120,80,50,0.14)'; for (let i = 0; i < 50; i++) g.fillRect(r() * W, r() * H, 1.6 + r() * 2, 0.6);
  g.fillStyle = 'rgba(90,60,40,0.22)'; g.fillRect(0, H - 2.5, W, 2.5);
  const glass = (x, y, w, h) => {
    for (const ctx of [g, s]) { const gr = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w); gr.addColorStop(0, '#fff4c8'); gr.addColorStop(1, '#f8a040'); ctx.fillStyle = gr; ctx.fillRect(x, y, w, h); }
    for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#000' : '#4a2e1c'; ctx.fillRect(x + w / 2 - 0.35, y, 0.7, h); ctx.fillRect(x, y + h / 2 - 0.35, w, 0.7); }
  };
  const mid = W / 2;
  g.fillStyle = '#4a2e1c'; g.beginPath(); g.moveTo(mid - 5, H); g.lineTo(mid - 5, 9); g.arc(mid, 9, 5, Math.PI, 0); g.lineTo(mid + 5, H); g.fill();
  g.fillStyle = lin(mid - 4, 0, mid + 4, 0, ['#8a5a34', '#a86e42', '#8a5a34']); g.beginPath(); g.moveTo(mid - 4, H); g.lineTo(mid - 4, 9); g.arc(mid, 9, 4, Math.PI, 0); g.lineTo(mid + 4, H); g.fill();
  g.fillStyle = 'rgba(40,20,10,0.4)'; for (let x = mid - 2; x < mid + 4; x += 2) g.fillRect(x, 6, 0.5, H - 6);
  glass(mid - 1.6, 8, 3.2, 3);
  g.fillStyle = '#e8c050'; g.beginPath(); g.arc(mid + 2.5, H - 8, 0.7, 0, Math.PI * 2); g.fill();
  for (const x of [mid - 16, mid + 9]) {
    rr(x - 0.8, 6.2, 8.6, 8.6, 0.6, '#4a2e1c');
    glass(x, 7, 7, 7);
    for (const sx of [x - 3.4, x + 7.4]) { rr(sx, 6.2, 3, 8.6, 0.5, shutter); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 7.4; y < 14.4; y += 1.4) g.fillRect(sx + 0.4, y, 2.2, 0.4); }
    rr(x - 1, 15, 9, 2.4, 0.5, '#6a4428');
    for (let k = 0; k < 6; k++) { g.fillStyle = ['#f86030', '#f8a030', '#e83a3a', '#f8d050'][k % 4]; g.beginPath(); g.arc(x + 0.4 + k * 1.45, 14.6 - (k % 2) * 0.6, 0.9, 0, Math.PI * 2); g.fill(); }
  }
  return f.c;
}

/** A cottage's upper room's front: adobe, one lit window between shutters. */
function upperFront(w, h, shutter) {
  const W = Math.round(w * 20), H = Math.round(h * 20), f = fine(W, H, 6), { g, rr, lin } = f, s = f.shine();
  g.fillStyle = lin(0, 0, 0, H, ['#ead4ae', '#dcc29c']); g.fillRect(0, 0, W, H);
  const x = W / 2 - 3.5, y = H / 2 - 3.2;
  rr(x - 0.8, y - 0.8, 8.6, 8.2, 0.6, '#4a2e1c');
  for (const ctx of [g, s]) { const gr = ctx.createRadialGradient(x + 3.5, y + 3.3, 0, x + 3.5, y + 3.3, 7); gr.addColorStop(0, '#fff4c8'); gr.addColorStop(1, '#f8a040'); ctx.fillStyle = gr; ctx.fillRect(x, y, 7, 6.6); }
  for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#000' : '#4a2e1c'; ctx.fillRect(x + 3.15, y, 0.7, 6.6); ctx.fillRect(x, y + 2.95, 7, 0.7); }
  for (const sx of [x - 3.4, x + 7.4]) rr(sx, y - 0.8, 3, 8.2, 0.5, shutter);
  return f.c;
}

/** A Cinder Springs cottage (the user's ask, 2026-10-14: better designs for the town's other houses): stepped adobe on
    a stone footing, the ground floor flat-roofed with beam ends along its top and a low parapet, an upper room set back
    on one side under a tiled gable in the house's colour, a ladder up the other side to the roof, a chimney smoking, a
    tiled porch on two posts over an arched door with a string of red chillies, and fire lilies in pots. */
function cottage(b, f, L, lit, smoke) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const w = f.w - 0.4, d = f.h - 0.8, h = 1.2, P = 0.18, top = P + h, fz = d / 2 - 0.1, side = b.id.charCodeAt(0) % 2 ? 1 : -1;
  const roof = [shadeOf(b.roof, 1), b.roof, shadeOf(b.roof, -1)];
  const adobe = std({ color: '#e2caa4', roughness: 1 }), deep = std({ color: '#c8aa82', roughness: 1 }), dark = std({ color: '#4a2e1c', roughness: 0.8 });
  const wood = std({ color: '#6a4a32', roughness: 0.9 }), stone = std({ color: '#8a7a6c', roughness: 1, flatShading: true });
  const roofMat = std({ map: roofTiles(roof, 1.2, 1.2), roughness: 0.7 }), eave = std({ color: roof[2], roughness: 0.8 });
  const lights = (art) => { const m = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.9 }); lit.push(m); return m; };
  const small = (m) => { m.castShadow = false; return m; };
  mesh(rbox(w + 0.2, P, d + 0.2, 0.05), stone, 0, P / 2, -0.1, g);
  mesh(new THREE.BoxGeometry(w, h, d), [adobe, adobe, deep, dark, lights(cottageFront(w, h, roof[1])), adobe], 0, P + h / 2, -0.1, g);
  mesh(rbox(w + 0.1, 0.12, d + 0.1, 0.04), deep, 0, top + 0.02, -0.1, g);
  for (const [lw, ld, x, z] of [[w + 0.1, 0.1, 0, fz + 0.05], [0.1, d + 0.1, -w / 2, -0.1], [0.1, d + 0.1, w / 2, -0.1]]) small(mesh(rbox(lw, 0.16, ld, 0.03), adobe, x, top + 0.14, z, g));
  for (let i = 0; i < 6; i++) small(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 8), wood, -w / 2 + 0.25 + i * (w - 0.5) / 5, top - 0.14, fz + 0.1, g)).rotation.x = Math.PI / 2;
  // the upper room, set back on one side, under its gable
  const uw = 1.2, ud = 1.15, uh = 0.8, ux = side * (w / 2 - uw / 2 - 0.08), uz = -0.1 - d / 2 + ud / 2 + 0.08;
  mesh(new THREE.BoxGeometry(uw, uh, ud), [adobe, adobe, deep, dark, lights(upperFront(uw, uh, roof[1])), adobe], ux, top + 0.08 + uh / 2, uz, g);
  const geo = new THREE.ExtrudeGeometry(gableShape(ud / 2 + 0.2, 0.55, 0.08), { depth: uw + 0.3, bevelEnabled: false });
  geo.rotateY(Math.PI / 2); geo.translate(-(uw + 0.3) / 2, 0, 0);
  mesh(geo, [roofMat, eave], ux, top + 0.08 + uh, uz, g);
  // a chimney on the low roof behind, smoking; a ladder up the other side
  const cx = -side * (w / 2 - 0.35), cz = -0.1 - d / 2 + 0.35;
  mesh(new THREE.BoxGeometry(0.26, 0.7, 0.26), stone, cx, top + 0.35, cz, g);
  mesh(new THREE.BoxGeometry(0.32, 0.06, 0.32), dark, cx, top + 0.7, cz, g);
  smoke.push([f.cx + cx, top + 0.8, f.cz + cz, false]);
  const lad = new THREE.Group(), lh = top + 0.45;
  lad.position.set(-side * (w / 2 + 0.4), 0, -0.25);
  lad.rotation.z = -side * 0.22;
  g.add(lad);
  for (const z of [-0.17, 0.17]) small(mesh(new THREE.BoxGeometry(0.04, lh, 0.04), wood, 0, lh / 2, z, lad));
  for (let k = 1; k < 6; k++) small(mesh(new THREE.BoxGeometry(0.03, 0.03, 0.34), wood, 0, k * lh / 6, 0, lad));
  // the porch: two posts, a beam, a tiled roof; a ristra of chillies off the beam; fire lilies in pots by the door
  const pz = fz + 0.42, ph = 1.05;
  for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.07, ph, 0.07), wood, s * 0.55, P + ph / 2, pz, g);
  small(mesh(new THREE.BoxGeometry(1.25, 0.07, 0.07), wood, 0, P + ph, pz, g));
  const porch = mesh(new THREE.BoxGeometry(1.4, 0.05, 0.62), [eave, eave, roofMat, eave, eave, eave], 0, P + ph + 0.1, fz + 0.24, g);
  porch.rotation.x = 0.3;
  const chilli = std({ color: '#d82a18', roughness: 0.5 }), pod = new THREE.ConeGeometry(0.035, 0.1, 6);
  for (let k = 0; k < 6; k++) small(mesh(pod, chilli, 0.42 + (k % 2 ? 0.03 : -0.03), P + ph - 0.1 - k * 0.07, pz - 0.02, g)).rotation.z = Math.PI + (k % 2 ? 0.3 : -0.3);
  const clay = std({ color: '#b8603a', roughness: 0.9 }), leaf = std({ color: '#5a8a3a', roughness: 0.9 });
  const lily = [std({ color: '#f86030', roughness: 0.6 }), std({ color: '#f8a030', roughness: 0.6 })];
  for (const s of [-1, 1]) {
    const x = s * 0.82, z = fz + 0.22;
    small(mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.18, 10), clay, x, P + 0.09, z, g));
    small(mesh(new THREE.ConeGeometry(0.1, 0.2, 6), leaf, x, P + 0.26, z, g));
    for (let k = 0; k < 3; k++) small(mesh(new THREE.SphereGeometry(0.045, 8, 6), lily[k % 2], x + (k - 1) * 0.06, P + 0.34 + (k % 2) * 0.04, z + 0.02, g));
  }
  const glow = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.8, roughness: 0.6 });
  lit.push(glow);
  small(mesh(new THREE.BoxGeometry(0.11, 0.15, 0.11), glow, -0.42, P + 0.85, fz + 0.12, g));
  return g;
}

/** Cinder Springs' houses, its front to you: leaders live in lodge()s, the forge is forge(), the bathhouse is
    bathhouse() and the rest are cottage()s. A tap is its door. */
function cabin(b, f, L, lit, smoke) {
  const leader = b.home && B.town?.homes?.[b.home]?.leader;
  if (leader) return lodge(b, f, L, lit, smoke, leader);
  if (b.kind === 'shop') return forge(b, f, L, lit, smoke);
  if (b.kind === 'bathhouse') return bathhouse(b, f, lit, smoke);
  return cottage(b, f, L, lit, smoke);
}

/** The bathhouse hall's front: plaster over a wainscot of dark boards, timber posts, a band of lit lattice windows,
    the lit sliding doors of the way in at its middle. */
function bathFront(w, h) {
  const W = Math.round(w * 20), H = Math.round(h * 20), f = fine(W, H, 6), { g, rr, lin } = f, s = f.shine(), mid = W / 2;
  g.fillStyle = lin(0, 0, 0, H, ['#f2e8d2', '#e6d8bc']); g.fillRect(0, 0, W, H);
  g.fillStyle = '#4a2e1c'; g.fillRect(0, H - 9, W, 9);
  g.fillStyle = 'rgba(0,0,0,0.3)'; for (let x = 1; x < W; x += 3) g.fillRect(x, H - 9, 0.5, 9);
  g.fillStyle = '#3a241a'; g.fillRect(0, 3.2, W, 2.2); g.fillRect(0, H - 10.2, W, 1.6);
  const pane = (x, y, ww, hh) => {
    rr(x - 0.8, y - 0.8, ww + 1.6, hh + 1.6, 0.4, '#3a241a');
    for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#ffd890' : lin(0, y, 0, y + hh, ['#fff4d0', '#f8c070']); ctx.fillRect(x, y, ww, hh); }
    for (const ctx of [g, s]) {
      ctx.fillStyle = ctx === s ? '#000' : '#3a241a';
      for (let xx = x + 2.4; xx < x + ww - 0.5; xx += 2.4) ctx.fillRect(xx - 0.25, y, 0.5, hh);
      for (let yy = y + 2.6; yy < y + hh - 0.5; yy += 2.6) ctx.fillRect(x, yy - 0.25, ww, 0.5);
    }
  };
  const door = 12, spans = [[mid - door, mid + door]];
  for (const side of [-1, 1]) for (let x = mid + side * (door + 3); side > 0 ? x < W - 6 : x > 6; x += side * 15) spans.push(side > 0 ? [x, x + 10] : [x - 10, x]);
  for (const [x0, x1] of spans.slice(1)) pane(x0, 8, x1 - x0, 8);
  for (const dx of [-door, 0]) pane(mid + dx + 0.8, 7.5, door - 1.6, H - 8.5);
  // posts at its ends and in the gaps between the windows
  spans.sort((p, q) => p[0] - q[0]);
  g.fillStyle = '#3a241a';
  for (const x of [1, W - 1, ...spans.slice(1).map((p, i) => (spans[i][1] + p[0]) / 2)]) g.fillRect(x - 1, 0, 2, H);
  return f.c;
}

/** The bathhouse's crest for its gable: an indigo disc in a gold ring, the ♨ mark in white. */
function onsenCrest() {
  const f = fine(32, 32, 8), { g } = f;
  g.fillStyle = '#e8b040'; g.beginPath(); g.arc(16, 16, 15.5, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2a4a7a'; g.beginPath(); g.arc(16, 16, 13.2, 0, Math.PI * 2); g.fill();
  onsenMark(g, 16, 17, 1.35, '#f8f0e0');
  return f.c;
}

/** The noren across the bathhouse's way in: three indigo panels with slits between, a white ♨ across the middle one. */
function norenArt() {
  const f = fine(48, 28, 8), { g, rr } = f;
  for (let i = 0; i < 3; i++) rr(i * 16 + 0.5, 2, 15, 26, 0.6, '#2a4a7a');
  g.fillStyle = '#1a2e4e'; g.fillRect(0, 0, 48, 3.2);
  g.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 3; i++) g.fillRect(i * 16 + 2, 4, 1.2, 23);
  onsenMark(g, 24, 15, 1.25, '#f8f0e0');
  return f.c;
}

/** A karahafu: the curved gable of a bathhouse's porch, its ridge running to you, `len` deep from `z0`, `half` wide
    each way and `rise` high on the parent at `y`. Its curve swells up to a round ridge and sweeps out at the eaves, all
    ribbed kawara, round tile ends along both eaves, a dark bargeboard round its front with gold fittings, plaster in it. */
function karahafu(parent, { half, rise, t, len, z0, y, roof, crest }) {
  const g = new THREE.Group();
  g.position.set(0, y, z0);
  parent.add(g);
  const curve = (u) => 0.06 + rise * ((1 + Math.cos(Math.PI * u)) / 2) + 0.12 * u ** 8;
  const at = (u) => [u * half, curve(u)];
  const eave = std({ color: roof[2], roughness: 0.7 }), wood = std({ color: '#3a241a', roughness: 0.75 });
  const gold = std({ color: '#e8b040', metalness: 0.7, roughness: 0.3 });
  const band = (lift, drop, n = 24) => {
    const sh = new THREE.Shape();
    for (let i = 0; i <= n; i++) { const [x, yy] = at(-1 + 2 * i / n); sh[i ? 'lineTo' : 'moveTo'](x, yy + lift); }
    for (let i = n; i >= 0; i--) { const [x, yy] = at(-1 + 2 * i / n); sh.lineTo(x, yy - drop); }
    sh.closePath();
    return sh;
  };
  mesh(new THREE.ExtrudeGeometry(band(0, t), { depth: len, bevelEnabled: false }), eave, 0, 0, 0, g);
  // the ribbed tiles over it: columns down each side of the curve, side by side along its depth
  const COL = 0.24, cols = Math.max(3, Math.round(len / COL)), cw = len / cols, PER = 4, NT = 22, RIB = 0.035;
  const pos = [], uv = [], idx = [];
  let arc = 0, prev = at(-1);
  for (let j = 0; j <= NT; j++) {
    const u = -1 + 2 * j / NT, [px, py] = at(u), [qx, qy] = at(Math.min(1, u + 0.01)), [rx, ry] = at(Math.max(-1, u - 0.01));
    if (j) arc += Math.hypot(px - prev[0], py - prev[1]);
    prev = [px, py];
    let tx = qx - rx, ty = qy - ry; const n = Math.hypot(tx, ty) || 1; tx /= n; ty /= n;
    for (let i = 0; i <= cols * PER; i++) {
      const k = (i % PER) / PER, bump = 0.012 + RIB * Math.sin(Math.PI * k) ** 0.8;
      pos.push(px - ty * bump, py + tx * bump, i * cw / PER);
      uv.push(i / PER, arc / 0.62);
    }
  }
  const row = cols * PER + 1;
  for (let j = 0; j < NT; j++) for (let i = 0; i < row - 1; i++) { const a = j * row + i, b = a + 1, c = a + row, d = c + 1; idx.push(a, b, d, a, d, c); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  mesh(geo, std({ map: kawaraArt(roof), roughness: 0.5 }), 0, 0, 0, g).receiveShadow = true;
  const disc = new THREE.CylinderGeometry(0.075, 0.075, 0.06, 12); disc.rotateZ(Math.PI / 2);
  const caps = new THREE.InstancedMesh(disc, std({ color: shadeOf(roof[1], -1), roughness: 0.5 }), cols * 2), o = new THREE.Object3D();
  for (let i = 0; i < cols; i++) for (const s of [-1, 1]) { o.position.set(s * (half + 0.02), curve(1) + 0.02, (i + 0.5) * cw); o.updateMatrix(); caps.setMatrixAt(i * 2 + (s > 0), o.matrix); }
  caps.castShadow = false; caps.raycast = () => {};
  g.add(caps);
  const ridge = new THREE.CylinderGeometry(0.1, 0.1, len + 0.06, 14); ridge.rotateX(Math.PI / 2);
  mesh(ridge, eave, 0, curve(0) + 0.05, len / 2, g);
  const boss = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 14); boss.rotateX(Math.PI / 2);
  mesh(boss, gold, 0, curve(0) + 0.05, len + 0.05, g);
  // the bargeboard round its front, gold at its tips and a gold gegyo under its peak, plaster and the crest inside it
  mesh(new THREE.ExtrudeGeometry(band(0.04, t + 0.12), { depth: 0.08, bevelEnabled: false }), wood, 0, 0, len - 0.02, g);
  for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.055, 10, 8), gold, s * half, curve(1) - 0.05, len + 0.06, g).castShadow = false;
  const gegyo = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 6), gold, 0, curve(0) - t - 0.2, len + 0.07, g);
  gegyo.rotation.x = Math.PI / 2; gegyo.castShadow = false;
  const fill = new THREE.Shape(), n = 20;
  fill.moveTo(-half + 0.1, 0);
  for (let i = 0; i <= n; i++) { const u = -1 + 2 * i / n, [x, yy] = at(u); if (Math.abs(x) < half - 0.1) fill.lineTo(x, Math.max(0, yy - t - 0.12)); }
  fill.lineTo(half - 0.1, 0); fill.closePath();
  mesh(new THREE.ShapeGeometry(fill), std({ color: '#efe4cc', roughness: 0.95 }), 0, 0, len - 0.06, g).castShadow = false;
  if (crest) {
    const c = panel(crest, 0.46, 0.46, 0, 0, 0);
    c.parent?.remove(c); g.add(c);
    c.position.set(0, (curve(0) - t) * 0.42, len - 0.04);
  }
  return g;
}

/** The bathhouse (the user's ask, 2026-10-14: the old two-storey box was "so stupid looking"): a sento, wide and low on
    a stone footing, timbered plaster with a band of lit lattice windows, under a deep kawara roof with a steam vent on
    its ridge; a karahafu porch over the way in with the ♨ crest in its gable, the bathhouse's sign under it and indigo
    noren between its posts, red paper lanterns either side; a tall round brick chimney smoking at its back, wooden tubs
    stacked by the door and a woodpile for the boiler. A tap is its door. */
function bathhouse(b, f, lit, smoke) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const roof = [shadeOf(b.roof, 1), b.roof, shadeOf(b.roof, -1)];
  const W = f.w - 0.3, P = 0.3;
  const plaster = std({ color: '#efe4cc', roughness: 0.95 }), dark = std({ color: '#3a241a', roughness: 0.75 });
  const stone = std({ color: '#7a6e64', roughness: 1, flatShading: true }), cope = std({ color: '#a89a8a', roughness: 1 });
  const tub = std({ color: '#c89a60', roughness: 0.8 }), hoop = std({ color: '#5a4a3a', metalness: 0.4, roughness: 0.5 });
  const small = (m) => { m.castShadow = false; m.raycast = () => {}; return m; };
  // the footing: fieldstone under a pale coping, a step up to the porch
  mesh(rbox(W, P - 0.06, 4.4, 0.05), stone, 0, (P - 0.06) / 2, 0.05, g);
  mesh(rbox(W + 0.08, 0.07, 4.48, 0.03), cope, 0, P - 0.035, 0.05, g);
  mesh(rbox(1.8, P / 2, 0.3, 0.03), cope, 0, P / 4, 2.38, g);
  // the hall: wide and low, its front lit, dark posts at its corners, plaster in its gables under the roof
  const hw = W - 0.8, hd = 3.0, hz = -0.5, H = 1.65, fz = hz + hd / 2;
  const art = bathFront(hw, H), front = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.85 });
  lit.push(front);
  mesh(new THREE.BoxGeometry(hw, H, hd), [plaster, plaster, dark, dark, front, plaster], 0, P + H / 2, hz, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.13, H + 0.02, 0.13), dark, sx * (hw / 2 + 0.01), P + H / 2, hz + sz * (hd / 2 + 0.01), g);
  const top = { length: hw + 0.6, half: hd / 2 + 0.5, rise: 1.25, t: 0.12, y: P + H, z: hz };
  kawaraRoof(g, { ...top, roof, fancy: true });
  for (const sx of [-1, 1]) gableWall(g, sx * (hw / 2 + 0.005), { ...top, wide: hd / 2 });
  // the steam vent on the ridge: a slatted box under its own little roof, steam pouring out of it
  const ry = P + H + top.rise + 0.2;
  mesh(new THREE.BoxGeometry(1.5, 0.42, 0.55), dark, 0, ry + 0.17, hz, g);
  const slat = std({ color: '#ffd890', emissive: new THREE.Color('#ffc070'), emissiveIntensity: 0.5, roughness: 0.8 });
  lit.push(slat);
  for (let i = 0; i < 6; i++) small(mesh(new THREE.BoxGeometry(0.12, 0.26, 0.02), slat, -0.6 + i * 0.24, ry + 0.17, hz + 0.28, g));
  kawaraRoof(g, { length: 1.8, half: 0.5, rise: 0.36, t: 0.07, y: ry + 0.38, z: hz, roof });
  for (const x of [-0.45, 0.45]) smoke.push([f.cx + x, ry + 0.5, f.cz + hz, true]);
  // the porch: two posts, a beam, the karahafu over it running back into the main roof
  const pf = 2.2, ph = P + 1.5;
  for (const s of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.14, ph - P, 0.14), dark, s * 0.82, P + (ph - P) / 2, pf - 0.08, g);
    small(mesh(rbox(0.24, 0.08, 0.24, 0.02), cope, s * 0.82, P + 0.04, pf - 0.08, g));
  }
  mesh(new THREE.BoxGeometry(1.95, 0.14, 0.16), dark, 0, ph + 0.02, pf - 0.08, g);
  mesh(new THREE.BoxGeometry(1.95, 0.08, pf - fz), dark, 0, ph + 0.04, (pf + fz) / 2, g);
  karahafu(g, { half: 1.0, rise: 0.85, t: 0.1, len: pf + 0.1 - (hz + 0.2), z0: hz + 0.2, y: ph + 0.1, roof, crest: onsenCrest() });   // its back end buried in the main roof
  g.attach(panel(bathSign(b.name), 1.5, 0.34, f.cx, ph - 0.2, f.cz + pf + 0.01));
  const noren = panel(norenArt(), 1.4, 0.82, f.cx, ph - 0.78, f.cz + pf - 0.1);
  noren.material.side = THREE.DoubleSide;
  g.attach(noren);
  // red paper lanterns hung off the porch's corners
  const paper = std({ color: '#e84a3a', emissive: new THREE.Color('#ff5a3a'), emissiveIntensity: 0.8, roughness: 0.7 });
  lit.push(paper);
  const lantern = new THREE.SphereGeometry(0.15, 14, 10); lantern.scale(1, 1.3, 1);
  for (const s of [-1, 1]) {
    small(mesh(lantern, paper, s * 1.08, ph - 0.32, pf + 0.02, g));
    for (const y of [0.2, -0.2]) small(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 10), dark, s * 1.08, ph - 0.32 + y, pf + 0.02, g));
    small(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4), dark, s * 1.08, ph - 0.0, pf + 0.02, g));
  }
  // the chimney: tall round brick, iron hoops, smoking over the roof at the back
  const bricks = brickArt(); bricks.repeat.set(3, 9);
  const cx = -hw / 2 + 0.45, cz = hz - hd / 2 + 0.05, ch = 4.1;
  mesh(new THREE.CylinderGeometry(0.24, 0.34, ch, 16), std({ map: bricks, roughness: 1 }), cx, P + ch / 2, cz, g);
  for (const y of [0.4, 0.62, 0.86]) small(mesh(new THREE.CylinderGeometry(0.26 + (1 - y) * 0.1, 0.26 + (1 - y) * 0.1, 0.05, 16), hoop, cx, P + ch * y, cz, g));
  mesh(new THREE.CylinderGeometry(0.31, 0.26, 0.16, 16), dark, cx, P + ch + 0.05, cz, g);
  smoke.push([f.cx + cx, P + ch + 0.25, f.cz + cz, false]);
  // wooden tubs stacked by the door, a woodpile for the boiler on the other side
  const pail = new THREE.CylinderGeometry(0.15, 0.12, 0.15, 14), band = new THREE.CylinderGeometry(0.152, 0.152, 0.025, 14);
  for (const [x, y, z] of [[1.42, 0, 2.05], [1.74, 0, 2.05], [1.58, 0.15, 2.05], [1.58, 0, 1.75]]) {
    small(mesh(pail, tub, x, P + 0.075 + y, z, g));
    small(mesh(band, hoop, x, P + 0.1 + y, z, g));
  }
  const log = new THREE.CylinderGeometry(0.08, 0.08, 0.62, 8); log.rotateX(Math.PI / 2);
  const bark = std({ color: '#6a4a32', roughness: 1 });
  for (const [x, y] of [[-1.72, 0], [-1.54, 0], [-1.36, 0], [-1.63, 0.15], [-1.45, 0.15], [-1.54, 0.3]]) small(mesh(log, bark, x, P + 0.08 + y, 1.95, g));
  return g;
}

/** A Gym Leader's home in Cinder Springs (the user's ask, 2026-10-14: every leader's house "more grand and extravagant
    and aesthetic", each town in its own style; Lantern Village's are manor()s): a two-storey adobe lodge on a basalt
    podium up steps, beam ends along its top and a band in the leader's colour, its flat roof a terrace railed in that
    colour, the upper storey under a clay roof with a gable to you and the leader's crest in it, a tall stack steaming,
    braziers at the steps, an awning over the door and two banners. Its lot is 5 x 4 tiles. A tap anywhere is its door. */
function lodge(b, f, L, lit, smoke, leader) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const ink = LEADER_INK[leader] || ['#ffe0c0', '#e0602a', '#5a1810'], letter = (b.name || leader)[0].toUpperCase();
  const roof = [shadeOf(b.roof, 1), b.roof, shadeOf(b.roof, -1)];
  const W = f.w - 0.3, D = f.h - 0.3, P = 0.42;
  const adobe = std({ color: '#e2cba6', roughness: 1 }), dark = std({ color: '#3a2418', roughness: 0.8 }), wood = std({ color: '#6a4a32', roughness: 0.9 });
  const basalt = std({ color: '#4a3e3c', roughness: 1, flatShading: true }), cope = std({ color: '#9a8a7a', roughness: 1 }), stone = std({ color: '#8a7a6c', roughness: 1, flatShading: true });
  const gold = std({ color: '#e8b040', metalness: 0.75, roughness: 0.28, emissive: new THREE.Color('#7a4a10'), emissiveIntensity: 0.35 });
  const inked = std({ color: ink[1], roughness: 0.7 });
  const roofMat = std({ map: roofTiles(roof, 1.4, 1.4), roughness: 0.7 }), eave = std({ color: roof[2], roughness: 0.8 });
  const lights = (art) => { const m = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.9 }); lit.push(m); return m; };
  const small = (m) => { m.castShadow = false; return m; };
  // the podium: basalt, a pale coping, steps up the front
  mesh(rbox(W, P - 0.06, D, 0.05), basalt, 0, (P - 0.06) / 2, 0, g);
  mesh(rbox(W + 0.1, 0.07, D + 0.1, 0.03), cope, 0, P - 0.035, 0, g);
  for (let i = 0; i < 3; i++) mesh(rbox(1.4 - i * 0.06, P / 3, 0.2, 0.02), cope, 0, P / 6 + i * P / 3, D / 2 + 0.36 - i * 0.18, g);
  // the hall: a lit front, stone quoins up its corners, beam ends along the top over a band in the leader's colour
  const hw = W - 0.5, hd = 2.3, hz = -0.3, H = 1.5, top = P + H, fz = hz + hd / 2;
  mesh(new THREE.BoxGeometry(hw, H, hd), [adobe, adobe, dark, dark, lights(cabinFront(hw)), adobe], 0, P + H / 2, hz, g);
  for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) small(mesh(new THREE.BoxGeometry(0.17, 0.22, 0.17), stone, sx * (hw / 2 + 0.01), P + 0.14 + k * 0.4, fz + 0.01, g));
  small(mesh(new THREE.BoxGeometry(hw + 0.04, 0.1, 0.04), inked, 0, top - 0.38, fz + 0.02, g));
  for (let i = 0; i < 8; i++) small(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 8), wood, -hw / 2 + 0.3 + i * (hw - 0.6) / 7, top - 0.18, fz + 0.1, g)).rotation.x = Math.PI / 2;
  // its flat roof a terrace, railed in the leader's colour along the front, gold knobs on the bigger posts
  mesh(rbox(hw + 0.24, 0.12, hd + 0.24, 0.03), cope, 0, top + 0.06, hz, g);
  const rz = fz + 0.06;
  for (const y of [top + 0.28, top + 0.5]) small(mesh(rbox(hw + 0.1, 0.05, 0.05, 0.015), inked, 0, y, rz, g));
  for (let i = 0; i <= 10; i++) {
    const x = -hw / 2 - 0.05 + i * (hw + 0.1) / 10, post = !(i % 5);
    small(mesh(new THREE.BoxGeometry(post ? 0.07 : 0.035, 0.42, post ? 0.07 : 0.035), post ? inked : wood, x, top + 0.33, rz, g));
    if (post) small(mesh(new THREE.SphereGeometry(0.05, 10, 8), gold, x, top + 0.58, rz, g));
  }
  // the upper storey, set back on the terrace, under a clay roof with a gable to you and the leader's crest in it
  const uw = hw * 0.6, ud = 1.3, uh = 1.05, uy = top + 0.12, uz = hz - 0.25, uf = uz + ud / 2, ry = uy + uh;
  mesh(new THREE.BoxGeometry(uw, uh, ud), [adobe, adobe, dark, dark, lights(cabinFront(uw)), adobe], 0, uy + uh / 2, uz, g);
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) small(mesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), stone, sx * (uw / 2 + 0.01), uy + 0.14 + k * 0.36, uf + 0.01, g));
  const geo = new THREE.ExtrudeGeometry(gableShape(ud / 2 + 0.32, 0.8, 0.1), { depth: uw + 0.4, bevelEnabled: false });
  geo.rotateY(Math.PI / 2); geo.translate(-(uw + 0.4) / 2, 0, 0);
  mesh(geo, [roofMat, eave], 0, ry, uz, g);
  const cd = ud / 2 + 0.42;
  mesh(new THREE.ExtrudeGeometry(gableShape(0.66, 0.62, 0.09), { depth: cd, bevelEnabled: false }), [roofMat, eave], 0, ry, uz, g);
  const tri = new THREE.Shape();
  tri.moveTo(-0.58, 0); tri.lineTo(0, 0.54); tri.lineTo(0.58, 0); tri.closePath();
  small(mesh(new THREE.ShapeGeometry(tri), adobe, 0, ry, uz + cd - 0.1, g));
  g.attach(panel(houseCrest('ink', ink, letter), 0.34, 0.34, f.cx, ry + 0.2, f.cz + uz + cd - 0.08));
  // a tall stone stack on the terrace, steaming
  const sx = hw / 2 - 0.45, sz = hz - hd / 2 + 0.4;
  mesh(new THREE.BoxGeometry(0.42, 2.0, 0.42), stone, sx, top + 1.0, sz, g);
  mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), dark, sx, top + 2.0, sz, g);
  smoke.push([f.cx + sx, top + 2.1, f.cz + sz, true]);
  // an awning over the door in the leader's colour, gold along its edge
  small(mesh(new THREE.BoxGeometry(1.3, 0.05, 0.55), inked, 0, P + 1.2, fz + 0.24, g)).rotation.x = 0.35;
  small(mesh(new THREE.BoxGeometry(1.32, 0.04, 0.04), gold, 0, P + 1.11, fz + 0.5, g));
  // a brazier either side of the steps, lit
  for (const s of [-1, 1]) {
    const m = piece('brazier', f.cx + s * 1.15 + COLS / 2 - 0.5, f.cz + D / 2 - 0.25 + ROWS / 2 - 0.5, { scale: 0.62, y: P, free: true });
    if (!m) continue;
    m.traverse(o => { if (o.material?.emissiveMap) { o.material.emissive = new THREE.Color('#ffc070'); lit.push(o.material); } });
    g.attach(m);
  }
  // two tall banners at the podium's front corners, swaying a little
  const cloth = std({ map: texOf(noboriArt(ink, letter)), side: THREE.DoubleSide, roughness: 0.95 });
  const flags = [-1, 1].map(s => {
    const x = s * (W / 2 - 0.12), z = D / 2 - 0.12, tall = 2.7;
    mesh(new THREE.CylinderGeometry(0.035, 0.04, tall, 8), dark, x, P + tall / 2, z, g);
    small(mesh(new THREE.SphereGeometry(0.06, 10, 8), gold, x, P + tall + 0.04, z, g));
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 6), dark, x - s * 0.22, P + tall - 0.1, z, g).rotation.z = Math.PI / 2;
    const hang = new THREE.Group();
    hang.position.set(x - s * 0.22, P + tall - 0.12, z + 0.02);
    g.add(hang);
    small(mesh(new THREE.PlaneGeometry(0.4, 1.6), cloth, 0, -0.8, 0, hang));
    return hang;
  });
  B.ticks.push((now) => { if (!calm) flags.forEach((h, i) => { h.rotation.y = Math.sin(now / 900 + i * 2) * 0.12; h.rotation.x = Math.sin(now / 1300 + i) * 0.04; }); });
  return g;
}

/** The mine gate out, timber on stone cairns: two posts, braces, a beam with the town's name hung from it on chains, a
    lamp on each post. Its posts block their tiles; the way between them is `R.exitAt`. */
function mineGate(x, z, span, tall, name, lit) {
  const wood = std({ color: '#6a4a32', roughness: 0.9 }), dark = std({ color: '#3a2a20', roughness: 0.9 }), stone = std({ color: '#7a6a62', roughness: 1, flatShading: true });
  const iron = std({ color: '#3a3a40', metalness: 0.6, roughness: 0.5 });
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  B.group.add(g);
  for (const sgn of [-1, 1]) {
    const px = sgn * span / 2;
    mesh(new THREE.DodecahedronGeometry(0.38, 0), stone, px, 0.2, 0, g).scale.set(1, 0.6, 1);
    mesh(rbox(0.24, tall, 0.24, 0.03), wood, px, tall / 2, 0, g);
    const brace = mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), wood, px - sgn * 0.3, tall - 0.75, 0, g);
    brace.rotation.z = sgn * 0.75;
    const glow = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.8, roughness: 0.6 });
    lit.push(glow);
    mesh(new THREE.BoxGeometry(0.14, 0.2, 0.14), glow, px, tall * 0.55, 0.18, g).castShadow = false;
    mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), iron, px, tall * 0.55 + 0.12, 0.18, g);
  }
  mesh(rbox(span + 0.8, 0.22, 0.28, 0.03), wood, 0, tall, 0, g);
  mesh(rbox(span + 0.3, 0.14, 0.22, 0.03), dark, 0, tall - 0.42, 0, g);
  for (const sx of [-0.7, 0.7]) mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), iron, sx, tall - 0.62, 0.08, g);
  panel(signArt(name.toUpperCase()), 1.7, 0.36, x, tall - 0.95, z + 0.1).userData.spot = 'exit';
  const way = mesh(new THREE.PlaneGeometry(span - 0.3, tall), new THREE.MeshBasicMaterial({ visible: false }), 0, tall / 2, 0.05, g);
  way.castShadow = way.receiveShadow = false;
  g.traverse(o => { o.userData.spot = 'exit'; });
  return g;
}

/** The mine head over its footprint: a shed with the shaft's dark mouth, a timber headframe over it whose wheel turns,
    and a mine cart on the rails out front. */
function minehead(f, L, lit) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const wood = std({ color: '#6a4a32', roughness: 0.9 }), dark = std({ color: '#2a1e18', roughness: 0.9 }), iron = std({ color: '#4a4a52', metalness: 0.6, roughness: 0.45 });
  const plank = std({ color: '#8a6a4a', roughness: 0.95 }), stone = std({ color: '#7a6a62', roughness: 1, flatShading: true });
  const w = f.w - 0.6, d = f.h - 0.8;
  mesh(rbox(w + 0.3, 0.2, d + 0.3, 0.04), stone, 0, 0.1, 0, g);
  mesh(new THREE.BoxGeometry(w, 1.3, d * 0.55), plank, 0, 0.85, d * 0.2, g);
  const roofMat = std({ map: roofTiles(['#8a8a96', '#62626e', '#44444e'], 2, 1), roughness: 0.6, metalness: 0.3 });
  const geo = new THREE.ExtrudeGeometry(gableShape(d * 0.3 + 0.25, 0.55, 0.08), { depth: w + 0.3, bevelEnabled: false });
  geo.rotateY(Math.PI / 2); geo.translate(-(w + 0.3) / 2, 0, 0);
  mesh(geo, [roofMat, dark], 0, 1.5, d * 0.2, g);
  mesh(new THREE.BoxGeometry(1.0, 1.0, 0.1), dark, 0, 0.7, d * 0.2 + d * 0.275 + 0.01, g);   // the shaft's mouth
  for (const sx of [-0.55, 0.55]) mesh(new THREE.BoxGeometry(0.14, 1.2, 0.14), wood, sx, 0.8, d * 0.2 + d * 0.275 + 0.05, g);
  mesh(new THREE.BoxGeometry(1.3, 0.16, 0.16), wood, 0, 1.38, d * 0.2 + d * 0.275 + 0.05, g);
  // the headframe: four legs leaning in, braced, the wheel on top
  const top = 3.6, bz = -d * 0.2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = mesh(new THREE.BoxGeometry(0.12, top + 0.2, 0.12), wood, sx * 0.75, top / 2, bz + sz * 0.55, g);
    leg.rotation.z = -sx * 0.12; leg.rotation.x = sz * 0.08;
  }
  for (let k = 1; k < 4; k++) {
    const y = k * top / 4, s = 0.75 - k * 0.11;
    for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(s * 2 + 0.1, 0.08, 0.08), wood, 0, y, bz + sz * (0.55 - k * 0.07), g);
    for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.08, 0.08, (0.55 - k * 0.07) * 2 + 0.1), wood, sx * s, y, bz, g);
  }
  mesh(new THREE.BoxGeometry(0.7, 0.12, 1.0), wood, 0, top, bz, g);
  const wheel = new THREE.Group();
  wheel.position.set(0, top + 0.6, bz);
  g.add(wheel);
  mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 28), iron, 0, 0, 0, wheel);
  for (let k = 0; k < 6; k++) mesh(new THREE.BoxGeometry(0.03, 1.0, 0.03), iron, 0, 0, 0, wheel).rotation.z = k * Math.PI / 6;
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 10), iron, 0, 0, 0, wheel).rotation.x = Math.PI / 2;
  for (const sx of [-0.3, 0.3]) mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), wood, sx, top + 0.3, bz, g);
  mesh(new THREE.CylinderGeometry(0.012, 0.012, top - 0.2, 4), iron, 0.5, (top + 0.4) / 2, bz, g);
  const glow = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.8, roughness: 0.6 });
  lit.push(glow);
  mesh(new THREE.BoxGeometry(0.14, 0.18, 0.14), glow, 0.7, 1.15, d * 0.2 + d * 0.275 + 0.12, g).castShadow = false;
  B.ticks.push((now) => { if (!calm) wheel.rotation.z = -now / 2600; });
  return g;
}

/** A mine cart standing on the rails, full of ore. */
function mineCart(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  B.group.add(g);
  const iron = std({ color: '#5a5258', metalness: 0.5, roughness: 0.55 }), rust = std({ color: '#8a4a2c', roughness: 0.8 });
  mesh(rbox(0.8, 0.42, 0.55, 0.05), rust, 0, 0.4, 0, g);
  mesh(new THREE.BoxGeometry(0.84, 0.05, 0.59), iron, 0, 0.6, 0, g);
  for (const sx of [-0.25, 0.25]) for (const sz of [-0.24, 0.24]) mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 12), iron, sx, 0.1, sz, g).rotation.x = Math.PI / 2;
  const ore = std({ color: '#4a4044', roughness: 1, flatShading: true }), gem = std({ color: '#f0a040', emissive: new THREE.Color('#f08030'), emissiveIntensity: 0.6, roughness: 0.4 });
  const rnd = seeded(5);
  for (let i = 0; i < 7; i++) mesh(new THREE.DodecahedronGeometry(0.09 + rnd() * 0.05, 0), i % 3 ? ore : gem, (rnd() - 0.5) * 0.5, 0.64 + rnd() * 0.06, (rnd() - 0.5) * 0.3, g);
  return g;
}

/** The springs ('o' tiles): steaming water a hand below the ground, rimmed with rocks. Their steam rises from `steam`. */
function springs(map, L, steam) {
  const water = std({ color: '#68c8d0', emissive: new THREE.Color('#3aa0b0'), emissiveIntensity: 0.25, roughness: 0.1, metalness: 0.1 });
  const rim = [], rnd = seeded(61), isO = (x, y) => map[y]?.[x] === 'o';
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'o') return;
    B.blocked.add(key(x, y));
    const m = mesh(new THREE.BoxGeometry(1.02, 0.06, 1.02), water, tileX(x), 0.05, tileZ(y));
    m.castShadow = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (isO(x + dx, y + dy)) continue;
      for (let i = 0; i < 3; i++) {
        const along = (i - 1) * 0.34 + (rnd() - 0.5) * 0.1;
        rim.push([tileX(x) + dx * 0.5 + (dy ? along : 0), tileZ(y) + dy * 0.5 + (dx ? along : 0), 0.28 + rnd() * 0.16, rnd() * 6, L.rock[Math.floor(rnd() * 2)]]);
      }
    }
    if (rnd() < 0.6) steam.push([tileX(x) + (rnd() - 0.5) * 0.4, 0.15, tileZ(y) + (rnd() - 0.5) * 0.4]);
  }));
  const rock = new THREE.DodecahedronGeometry(0.5, 0); rock.scale(1, 0.6, 1); rock.translate(0, 0.12, 0);
  instanced(rock, std({ color: '#ffffff', roughness: 1, flatShading: true }), rim);
  B.ticks.push((now) => { water.emissiveIntensity = calm ? 0.25 : 0.25 + Math.sin(now / 900) * 0.06; });
}

/** Molten lava, a tile of it that repeats: deep orange, hotter swirls, bright yellow veins. */
function lavaArt() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d'), r = seeded(29), wrap = (fn) => { for (const ox of [0, -128, 128]) for (const oy of [0, -128, 128]) fn(ox, oy); };
  g.fillStyle = '#c8380c'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 40; i++) {
    const x = r() * 128, y = r() * 128, rad = 6 + r() * 16, col = ['#e85a14', '#f07a1c', '#d8460e', '#f8962a'][i % 4];
    wrap((ox, oy) => { const rg = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(200,56,12,0)'); g.fillStyle = rg; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2); });
  }
  g.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const x = r() * 128, y = r() * 128, a = r() * 6.3, len = 14 + r() * 26, bend = (r() - 0.5) * 20;
    g.strokeStyle = i % 3 ? '#ffc040' : '#fff0a0'; g.lineWidth = 1 + r() * 2;
    wrap((ox, oy) => { g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(x + ox + Math.cos(a) * len / 2 - Math.sin(a) * bend, y + oy + Math.sin(a) * len / 2 + Math.cos(a) * bend, x + ox + Math.cos(a) * len, y + oy + Math.sin(a) * len); g.stroke(); });
  }
  return c;
}

/** The crust riding on the lava, a tile of it that repeats: dark cooled plates with the glow showing in the cracks. */
function crustArt() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d'), r = seeded(37);
  for (let i = 0; i < 16; i++) {
    const x = r() * 128, y = r() * 128, rad = 7 + r() * 13, n = 6 + Math.floor(r() * 3), k = Array.from({ length: n }, () => 0.7 + r() * 0.35);
    g.fillStyle = ['#2a1610', '#3a2016', '#22120e'][i % 3];
    for (const ox of [0, -128, 128]) for (const oy of [0, -128, 128]) {
      g.beginPath();
      k.forEach((s, j) => { const a = j / n * Math.PI * 2; g[j ? 'lineTo' : 'moveTo'](x + ox + Math.cos(a) * rad * s, y + oy + Math.sin(a) * rad * s * 0.8); });
      g.closePath(); g.fill();
    }
  }
  return c;
}

/** Cinder Springs' lava field (the user's ask, 2026-10-14: "make it look something cool how you did the thornwood one"):
    lava under the ground's holes (`~`), glowing, its crust drifting and bubbles swelling and bursting on it; dark basalt
    banks down into it; the lavafall pouring off the crags into its pool, steam and smoke rising; basalt bridges (`-`)
    with iron railings along their sides and an ember lamp on each post; and a name board by each named house (`n`). */
const LAVA_Y = -0.34;
function lavaField(town, L, lit) {
  const { map } = town, hot = (x, y) => map[y]?.[x] === '~', deck = (x, y) => map[y]?.[x] === '-';
  nameBoards(town);
  const pool = [];
  map.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '~') { pool.push([x, y]); B.blocked.add(key(x, y)); } }));
  if (!pool.length) return;
  const r = seeded(53), molten = lavaArt();
  const tile = (c, rx, ry) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(rx, ry); return t; };
  const glow = tile(molten, COLS / 6, ROWS / 6), crust = tile(crustArt(), COLS / 7, ROWS / 7), fall = glow.clone();   // a clone shares its picture on the GPU
  fall.repeat.set(1, 2);
  const hotMat = std({ map: glow, emissive: new THREE.Color('#ffffff'), emissiveMap: glow, emissiveIntensity: 0.95, roughness: 0.6 });
  const lava = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), hotMat);
  lava.rotation.x = -Math.PI / 2; lava.position.y = LAVA_Y; lava.raycast = () => {};
  B.group.add(lava);
  const skin = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), std({ map: crust, transparent: true, depthWrite: false, roughness: 1 }));
  skin.rotation.x = -Math.PI / 2; skin.position.y = LAVA_Y + 0.01; skin.raycast = () => {}; skin.renderOrder = 1;
  B.group.add(skin);
  // the banks: basalt sloping down into the lava under every edge of land, rocks along the lip
  const banks = [], rocks = [];
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '~' || deck(x, y) || !STEPS.some(([dx, dy]) => hot(x + dx, y + dy))) return;
    banks.push([tileX(x), tileZ(y), 1, Math.PI / 4, ['#2c2422', '#342a26', '#262020'][Math.floor(r() * 3)], -0.01]);
    if (ROADY.has(ch) || ch === 'T') return;
    for (const [dx, dy] of STEPS) {
      if (!hot(x + dx, y + dy) || r() < 0.4) continue;
      const along = (r() - 0.5) * 0.8;
      rocks.push([tileX(x) + dx * 0.42 + (dy ? along : 0), tileZ(y) + dy * 0.42 + (dx ? along : 0), 0.13 + r() * 0.1, r() * 6, ['#3a302c', '#4a3c36', '#2a2220'][Math.floor(r() * 3)], 0.02]);
    }
  }));
  const bank = new THREE.CylinderGeometry(0.707, 0.95, 0.6, 4, 1, true); bank.translate(0, -0.3, 0);
  instanced(bank, std({ color: '#ffffff', roughness: 1 }), banks).castShadow = false;
  const stone = new THREE.DodecahedronGeometry(1, 0); stone.scale(1, 0.55, 0.85);
  instanced(stone, std({ color: '#ffffff', roughness: 0.95, flatShading: true }), rocks).castShadow = false;
  // the bridges: a basalt slab under each tile; along each side over the lava an iron railing on posts, ember lamps on them
  const slabs = [], posts = [], rails = [], embers = [], seen = new Set();
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '-') return;
    slabs.push([tileX(x), tileZ(y), 1, 0, ['#3a302c', '#342a28'][(x + y) % 2], -0.145]);
    for (const [dx, dy] of STEPS) {
      if (!hot(x + dx, y + dy)) continue;
      const ex = tileX(x) + dx * 0.44, ez = tileZ(y) + dy * 0.44;
      for (const h of [0.5, 0.26]) rails.push([ex, h, ez, dx ? Math.PI / 2 : 0]);
      for (const s of [-0.5, 0.5]) {
        const px = dy ? tileX(x) + s : ex, pz = dx ? tileZ(y) + s : ez, k = `${px.toFixed(2)},${pz.toFixed(2)}`;
        if (seen.has(k)) continue;
        seen.add(k);
        posts.push([px, pz]);
        if (!deck(x + (dy ? Math.sign(s) : 0), y + (dx ? Math.sign(s) : 0))) embers.push([px, pz, 1, 0, null, 0.66]);   // the bridge's ends
      }
    }
  }));
  const slab = new THREE.BoxGeometry(1.0, 0.26, 1.0);
  instanced(slab, std({ color: '#ffffff', roughness: 1 }), slabs).castShadow = false;
  const iron = std({ color: '#2e2826', roughness: 0.55, metalness: 0.45 }), o = new THREE.Object3D();
  const bars = (geo, items, set) => {
    const m = new THREE.InstancedMesh(geo, iron, items.length);
    items.forEach((it, i) => { set(o, it); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
    m.castShadow = true; m.raycast = () => {};
    B.group.add(m);
  };
  const post = new THREE.CylinderGeometry(0.045, 0.06, 0.6, 8); post.translate(0, 0.3, 0);
  bars(post, posts, (d, [x, z]) => { d.position.set(x, 0, z); d.rotation.set(0, 0, 0); });
  bars(new THREE.BoxGeometry(1.0, 0.05, 0.05), rails, (d, [x, y, z, turn]) => { d.position.set(x, y, z); d.rotation.set(0, turn, 0); });
  const emberMat = std({ color: '#ffb040', emissive: new THREE.Color('#ff7a20'), emissiveIntensity: 1, roughness: 0.4 });
  lit.push(emberMat);
  instanced(new THREE.IcosahedronGeometry(0.08, 0), emberMat, embers).castShadow = false;
  // the lavafall: off the crags into the pool at the top, a cliff of basalt behind it, steam where it lands
  const top = Math.min(...pool.map(p => p[1])), xs = pool.filter(p => p[1] === top).map(p => p[0]);
  const fx = tileX((Math.min(...xs) + Math.max(...xs)) / 2), fz = tileZ(top) - 0.42, fw = Math.min(3.4, xs.length - 2.6);
  const cliff = [];
  for (let i = 0; i < 6; i++) cliff.push([fx + (i - 2.5) * 0.95 + (r() - 0.5) * 0.2, fz - 0.65 - r() * 0.3, 1.4 + r() * 0.4, r() * 6, ['#3a302c', '#2c2422', '#463a34'][i % 3]]);
  const crag = new THREE.DodecahedronGeometry(0.7, 0); crag.scale(1, 2.0, 0.8); crag.translate(0, 0.9, 0);
  instanced(crag, std({ color: '#ffffff', roughness: 1, flatShading: true }), cliff);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(fw, 2.6 - LAVA_Y, 1, 6), std({ map: fall, emissive: new THREE.Color('#ffffff'), emissiveMap: fall, emissiveIntensity: 1.05, roughness: 0.5 }));
  sheet.geometry.translate(0, (2.6 - LAVA_Y) / 2, 0);
  const pos = sheet.geometry.attributes.position;   // the sheet pours out over the lip and falls in a curve, as a stream does
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sqrt(Math.max(0, 1 - pos.getY(i) / (2.6 - LAVA_Y))) * 0.55 - 0.1);
  pos.needsUpdate = true; sheet.geometry.computeVertexNormals();
  sheet.position.set(fx, LAVA_Y, fz + 0.3); sheet.raycast = () => {};
  B.group.add(sheet);
  const splash = Array.from({ length: 4 }, (_, i) => [fx + (i - 1.5) * fw / 4, LAVA_Y + 0.1, fz + 0.4]);
  puffs(splash, { col: 'rgba(250,236,220,0.8)', n: 3, size: 0.7, rise: 2.2, speed: 0.22 });
  // smoke curling off the lava here and there
  const smoke = pool.filter(() => r() < 0.12).slice(0, 10).map(([x, y]) => [tileX(x), LAVA_Y + 0.1, tileZ(y)]);
  puffs(smoke, { col: 'rgba(110,92,84,0.55)', n: 2, size: 0.55, rise: 1.6, speed: 0.12 });
  // bubbles swelling and bursting on the lava
  const spots = pool.filter(([x, y]) => !STEPS.some(([dx, dy]) => deck(x + dx, y + dy)) && r() < 0.35).slice(0, 16)
    .map(([x, y]) => ({ x: tileX(x) + (r() - 0.5) * 0.5, z: tileZ(y) + (r() - 0.5) * 0.5, at: r(), speed: 0.25 + r() * 0.3, k: 0.7 + r() * 0.6 }));
  const blob = new THREE.SphereGeometry(0.13, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const bubbles = new THREE.InstancedMesh(blob, std({ color: '#ffa030', emissive: new THREE.Color('#ff6a10'), emissiveIntensity: 1.1, roughness: 0.4 }), spots.length);
  bubbles.raycast = () => {}; bubbles.castShadow = false;
  B.group.add(bubbles);
  let drawn = false;
  B.ticks.push((now) => {
    if (calm && drawn) return;
    drawn = true;
    const s = calm ? 0 : now / 1000;
    glow.offset.set(s * 0.012, s * 0.02);
    crust.offset.set(s * 0.02, s * 0.032);
    fall.offset.set(0, s * 0.45);
    hotMat.emissiveIntensity = 0.95 + (calm ? 0 : Math.sin(now / 1300) * 0.1);
    spots.forEach((p, i) => {
      const t = calm ? 0.5 : (p.at + s * p.speed) % 1, grow = t < 0.8 ? t / 0.8 : 0;
      o.position.set(p.x, LAVA_Y, p.z); o.rotation.set(0, 0, 0); o.scale.setScalar(grow * p.k);
      o.updateMatrix(); bubbles.setMatrixAt(i, o.matrix);
    });
    bubbles.instanceMatrix.needsUpdate = true;
  });
}

/** An ember, for the ones rising off the town. */
function emberArt(col) {
  const f = fine(8, 8, 8), { g } = f, r = g.createRadialGradient(4, 4, 0, 4, 4, 4);
  r.addColorStop(0, '#fff4c0'); r.addColorStop(0.35, col); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 8, 8);
  return f.c;
}

/** A flake of ash, for the ones falling. */
function ashArt() {
  const f = fine(8, 8, 8), { g } = f;
  g.fillStyle = '#b8b0a8'; g.beginPath(); g.ellipse(4, 4, 2.6, 1.6, 0.4, 0, Math.PI * 2); g.fill();
  return f.c;
}

/* Driftwood Landing, the Sunken Ruins' (a stilted fishing village): the lagoon under it all (the ground is cut away over
   its water, `holes` in wild(), so the boardwalks stand on posts over a drowned temple's floor), jungle banks of palms
   round it, thatched huts on stilts, the aquarium's glass dome, Pat's houseboat, the old beacon on its rock, drowned
   columns and moored boats, nets drying on the beaches, and the temple's arch out. */
const WATER_Y = -0.26, BED_Y = -0.6;
const PALM = ['#6ab84a', '#4e9a3a', '#3a7a30', '#80c858'];
const SAND = { sand: '#d8c890', stone: '#a8a080', rock: '#7a7468', bank: '#4a4028', deck: '#5a3c24' };

/** What each tile of a lagoon town is: water (a houseboat's too), deck (a boardwalk, a hut's platform), sand, stone, the
    jungle bank or the beacon's rock; a prop stands on what's round it. */
function lagoonKinds(town) {
  const { map } = town, at = (x, y) => map[y]?.[x];
  const wet = new Set(town.buildings.filter(b => b.kind === 'houseboat').map(b => b.at));
  const rock = new Set(town.buildings.filter(b => b.kind === 'beacon').map(b => b.at));
  return (x, y) => {
    const ch = at(x, y);
    if (ch === undefined || ch === 'T') return 'bank';
    if (ch === '~' || ch === 'y' || ch === '|' || wet.has(ch)) return 'water';
    if (ch === '-') return 'deck';
    if (ch === '.' || ch === ',' || ch === 'f') return 'sand';
    if (ch === '#' || ch === 'W') return 'stone';
    if (rock.has(ch)) return 'rock';
    if (/[A-Z]/.test(ch) && ch !== 'L' && ch !== 'R') return 'deck';
    const near = STEPS.map(([dx, dy]) => at(x + dx, y + dy));
    return near.includes('#') ? 'stone' : near.some(c => c === '.' || c === ',') ? 'sand' : near.includes('-') ? 'deck' : 'sand';
  };
}

/** The ground of a lagoon town: nothing over the water (the lagoon shows through), planks on the boardwalks and the huts'
    platforms, sand with shells, the temple's paving, the jungle's dark earth; land rounded where it meets the water. */
function lagoonGround(town) {
  const kind = lagoonKinds(town), { map } = town;
  return (c) => {
    const g = c.getContext('2d'), T = 16, r = seeded(73);
    g.clearRect(-1, -1, COLS * T + 2, ROWS * T + 2);
    const wet = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && kind(x, y) === 'water';
    map.forEach((row, y) => [...row].forEach((ch, x) => {
      const k = kind(x, y), X = x * T, Y = y * T;
      if (k === 'water') return;
      g.save();
      // land is rounded off at a corner with water on both sides; decks stay square, cut timber
      g.beginPath();
      const rad = (dx, dy) => (k !== 'deck' && wet(x + dx, y) && wet(x, y + dy) ? 7 : 0);
      g.roundRect(X, Y, T, T, [rad(-1, -1), rad(1, -1), rad(1, 1), rad(-1, 1)]);
      g.clip();
      if (k === 'deck') {
        const along = ['-', 'n'].includes(map[y][x - 1]) || ['-', 'n'].includes(map[y][x + 1]) || /[A-Z]/.test(ch);
        g.fillStyle = '#3a2414'; g.fillRect(X, Y, T, T);
        for (let i = 0; i < 4; i++) {
          g.fillStyle = ['#b08458', '#a07448', '#c0956a', '#94683e'][Math.floor(r() * 4)];
          if (along) g.fillRect(X + i * 4 + 0.3, Y, 3.4, T); else g.fillRect(X, Y + i * 4 + 0.3, T, 3.4);
          g.fillStyle = 'rgba(60,30,10,0.35)';
          for (let n = 0; n < 2; n++) { const o = 2 + n * 11; if (along) g.fillRect(X + i * 4 + 1.6, Y + o, 0.7, 0.7); else g.fillRect(X + o, Y + i * 4 + 1.6, 0.7, 0.7); }
          g.fillStyle = 'rgba(255,240,200,0.12)';
          if (along) g.fillRect(X + i * 4 + 0.5, Y, 0.6, T); else g.fillRect(X, Y + i * 4 + 0.5, T, 0.6);
        }
      } else if (k === 'stone') {
        g.fillStyle = L_RUIN.gap; g.fillRect(X, Y, T, T);
        for (let sy = 0; sy < T; sy += 8) for (let sx = (sy / 8 % 2) * -4; sx < T; sx += 8) {
          g.fillStyle = L_RUIN.stone[Math.floor(r() * 3)];
          g.beginPath(); g.roundRect(X + sx + 0.4, Y + sy + 0.4, 7.2, 7.2, 1.2); g.fill();
          if (r() < 0.3) { g.fillStyle = 'rgba(90,140,70,0.5)'; g.beginPath(); g.arc(X + sx + r() * 8, Y + sy + r() * 8, 1 + r() * 1.5, 0, Math.PI * 2); g.fill(); }
        }
      } else if (k === 'rock') {
        g.fillStyle = '#8a8478'; g.fillRect(X, Y, T, T);
        for (let i = 0; i < 6; i++) { g.fillStyle = ['#9a9488', '#6e685e', '#a8a296'][i % 3]; g.beginPath(); g.ellipse(X + r() * T, Y + r() * T, 2 + r() * 3, 1.5 + r() * 2, r() * 3, 0, Math.PI * 2); g.fill(); }
      } else if (k === 'bank') {
        g.fillStyle = '#4a4028'; g.fillRect(X, Y, T, T);
        for (let i = 0; i < 10; i++) { g.fillStyle = ['#3a5a28', '#5a4a30', '#2e4a22', '#6a5a36'][i % 4]; g.beginPath(); g.ellipse(X + r() * T, Y + r() * T, 1 + r() * 1.6, 0.6 + r(), r() * 3, 0, Math.PI * 2); g.fill(); }
      } else {
        g.fillStyle = '#e4d4a4'; g.fillRect(X, Y, T, T);
        for (let i = 0; i < 14; i++) { g.fillStyle = ['#d4c08c', '#f0e4c0', '#c8b480'][i % 3]; g.fillRect(X + r() * T, Y + r() * T, 0.8, 0.8); }
        if (r() < 0.25) { g.fillStyle = ['#f8e8e0', '#f0b8a8', '#fff4d8'][Math.floor(r() * 3)]; g.beginPath(); g.ellipse(X + 3 + r() * 10, Y + 3 + r() * 10, 1.4, 1, r() * 3, 0, Math.PI * 2); g.fill(); }
        if (ch === 'f') for (let i = 0; i < 5; i++) {   // hibiscus
          const fx = X + 3 + r() * 10, fy = Y + 3 + r() * 10;
          g.fillStyle = '#3e8a34'; g.beginPath(); g.ellipse(fx + 1.5, fy + 1, 2, 1, 0.5, 0, Math.PI * 2); g.fill();
          g.fillStyle = ['#e83a5a', '#f8708a', '#f8a030'][i % 3];
          for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; g.beginPath(); g.arc(fx + Math.cos(a) * 1.3, fy + Math.sin(a) * 1.3, 1.1, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = '#f8e050'; g.fillRect(fx - 0.4, fy - 0.4, 0.8, 0.8);
        }
      }
      // a soft dark lip where it meets the water
      if (k === 'deck') {   // a pale trim just inside the railing, so the boardwalk's edge reads at a glance (as Highbough's)
        g.fillStyle = 'rgba(248,232,196,0.6)';
        if (wet(x - 1, y)) g.fillRect(X + 1.6, Y, 1.2, T);
        if (wet(x + 1, y)) g.fillRect(X + T - 2.8, Y, 1.2, T);
        if (wet(x, y - 1)) g.fillRect(X, Y + 1.6, T, 1.2);
        if (wet(x, y + 1)) g.fillRect(X, Y + T - 2.8, T, 1.2);
      }
      g.fillStyle = 'rgba(20,30,30,0.28)';
      if (wet(x - 1, y)) g.fillRect(X, Y, 1.6, T);
      if (wet(x + 1, y)) g.fillRect(X + T - 1.6, Y, 1.6, T);
      if (wet(x, y - 1)) g.fillRect(X, Y, T, 1.6);
      if (wet(x, y + 1)) g.fillRect(X, Y + T - 1.6, T, 1.6);
      g.restore();
    }));
    return c;
  };
}
const L_RUIN = { stone: ['#d8c8a0', '#c8b890', '#b8a880'], gap: '#7a6a48' };

/** The lagoon under the town: its bed (silt, weed, the drowned temple's courtyard in a great ring of flagstones, its runes
    faintly lit) and the water over it, clear, rippling, lily pads afloat. */
function lagoonWater(town) {
  const kind = lagoonKinds(town), T = 16, f = fine(COLS * T, ROWS * T, 2), { g } = f, s = f.shine(), r = seeded(91);
  const W = COLS * T, H = ROWS * T, cx = W / 2, cy = H / 2;
  g.fillStyle = '#86a888'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 500; i++) { g.fillStyle = ['#76987a', '#96b494', '#a8c09c', '#6a8a70'][i % 4]; g.beginPath(); g.ellipse(r() * W, r() * H, 3 + r() * 10, 2 + r() * 6, r() * 3, 0, Math.PI * 2); g.fill(); }
  // the courtyard: rings of flagstones round the island, broken, half silted over
  for (let ring = 0; ring < 9; ring++) {
    const rad = (5.5 + ring * 1.15) * T, n = Math.round(rad / 7);
    for (let i = 0; i < n; i++) {
      if (r() < 0.3) continue;
      const a = i / n * Math.PI * 2 + ring * 0.2;
      g.save(); g.translate(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); g.rotate(a + (r() - 0.5) * 0.2);
      g.fillStyle = ['#9a9a80', '#8a8c74', '#a8a68a'][Math.floor(r() * 3)]; g.globalAlpha = 0.55 + r() * 0.3;
      g.beginPath(); g.roundRect(-3, -7, 6.2, 13, 1.5); g.fill();
      g.restore();
    }
  }
  g.globalAlpha = 1;
  // runes round the courtyard's rim, lit
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2, x = cx + Math.cos(a) * 15.6 * T, y = cy + Math.sin(a) * 15.6 * T;
    for (const ctx of [g, s]) {
      ctx.strokeStyle = '#78e0f0'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(x, y, 3.2, a, a + 4); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke();
    }
  }
  g.globalAlpha = s.globalAlpha = 1;
  for (let i = 0; i < 160; i++) {   // waterweed
    const x = r() * W, y = r() * H;
    g.strokeStyle = ['#3e6a3a', '#4e8a46', '#2e5a30'][i % 3]; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 3, y - 4, x - 3, y - 7, x + 1, y - 10); g.stroke();
  }
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), std({ map: texOf(f.c), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(f.c.glow), emissiveIntensity: 0.7, roughness: 1 }));
  bed.rotation.x = -Math.PI / 2; bed.position.y = BED_Y; bed.receiveShadow = true; bed.raycast = () => {};
  B.group.add(bed);
  // the surface: clear blue-green, a ripple pattern drifting over it
  const wc = document.createElement('canvas');
  wc.width = wc.height = 128;
  const wg = wc.getContext('2d'), wr = seeded(5);
  wg.fillStyle = '#c8e4e8'; wg.fillRect(0, 0, 128, 128);
  wg.strokeStyle = '#ffffff'; wg.lineWidth = 1.4;
  for (let i = 0; i < 26; i++) {
    const x = wr() * 128, y = wr() * 128, w = 8 + wr() * 18;
    for (const ox of [0, -128, 128]) for (const oy of [0, -128, 128]) { wg.beginPath(); wg.moveTo(x + ox - w / 2, y + oy); wg.quadraticCurveTo(x + ox, y + oy - 3, x + ox + w / 2, y + oy); wg.stroke(); }
  }
  const map = new THREE.CanvasTexture(wc);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.repeat.set(COLS / 4, ROWS / 4);
  const water = std({ color: '#48c0c4', map, emissive: new THREE.Color('#1a7888'), emissiveIntensity: 0.35, transparent: true, opacity: 0.58, roughness: 0.06, metalness: 0.2, depthWrite: false });   // a little light of its own, so dusk keeps it lagoon blue
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), water);
  surface.rotation.x = -Math.PI / 2; surface.position.y = WATER_Y; surface.receiveShadow = true; surface.raycast = () => {};
  surface.renderOrder = 1;
  B.group.add(surface);
  B.ticks.push((now) => { if (!calm) map.offset.set(now / 70000, Math.sin(now / 9000) * 0.04 + now / 110000); });
  // lily pads, some in flower, away from the boardwalks
  const pads = [], blooms = [], rnd = seeded(37);
  town.map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== '~' || rnd() > 0.16 || STEPS.some(([dx, dy]) => kind(x + dx, y + dy) === 'deck')) return;
    for (let i = 0; i < 1 + Math.floor(rnd() * 3); i++) {
      const px = tileX(x) + (rnd() - 0.5) * 0.8, pz = tileZ(y) + (rnd() - 0.5) * 0.8;
      pads.push([px, pz, 0.6 + rnd() * 0.6, rnd() * 6, ['#5aa848', '#4a9a3e', '#6ab858'][Math.floor(rnd() * 3)], WATER_Y + 0.005]);
      if (rnd() < 0.3) blooms.push([px, pz, 0.8 + rnd() * 0.4, rnd() * 6, rnd() < 0.5 ? '#f8a8c8' : '#ffffff', WATER_Y + 0.03]);
    }
  }));
  const pad = new THREE.CylinderGeometry(0.16, 0.16, 0.01, 14, 1, false, 0.3, Math.PI * 2 - 0.6);
  instanced(pad, std({ color: '#ffffff', roughness: 0.6 }), pads).castShadow = false;
  const bloom = new THREE.ConeGeometry(0.06, 0.08, 6); bloom.translate(0, 0.04, 0); bloom.rotateX(Math.PI);
  bloom.translate(0, 0.08, 0);
  instanced(bloom, std({ color: '#ffffff', roughness: 0.6, flatShading: true }), blooms).castShadow = false;
  town.map.forEach((row, y) => [...row].forEach((ch, x) => { if (kind(x, y) === 'water') B.blocked.add(key(x, y)); }));
}

/** What the town stands on: land as a bank sloping down into the water, the boardwalks and huts on posts to the bed, a
    fascia board along every edge over the water. */
function lagoonSupports(town) {
  const kind = lagoonKinds(town), banks = [], posts = [], fascia = [], corners = new Set(), tops = [], ropes = [], railPosts = new Map();
  const wet = (x, y) => kind(x, y) === 'water', moored = new Set(town.buildings.filter(b => b.kind === 'houseboat').map(b => b.at));
  town.map.forEach((row, y) => [...row].forEach((ch, x) => {
    const k = kind(x, y);
    if (k === 'water') return;
    if (k !== 'deck') { if (STEPS.some(([dx, dy]) => wet(x + dx, y + dy))) banks.push([tileX(x), tileZ(y), 1, Math.PI / 4, SAND[k], -0.01]); return; }
    for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      if (!wet(x + dx, y) && !wet(x, y + dy) && !wet(x + dx, y + dy)) continue;
      const cx = x + (dx > 0 ? 1 : 0), cy = y + (dy > 0 ? 1 : 0), c = `${cx},${cy}`;
      if (corners.has(c)) continue;
      corners.add(c);
      posts.push([cx - COLS / 2 - dx * 0.06, cy - ROWS / 2 - dy * 0.06, 1, 0, null, 0]);
    }
    for (const [dx, dy] of STEPS) if (wet(x + dx, y + dy)) fascia.push([tileX(x) + dx * 0.48, tileZ(y) + dy * 0.48, 1, dx ? Math.PI / 2 : 0, null, 0]);
    if (/[A-Z]/.test(ch)) return;   // a hut's own platform: the hut stands to its edges
    for (const [dx, dy] of STEPS) {   // a railing along every boardwalk edge over the water (the user's ask, 2026-10-14: where you can walk reads at a glance), open to a houseboat's gangway
      if (!wet(x + dx, y + dy) || moored.has(town.map[y + dy]?.[x + dx])) continue;
      const [ax, ay] = dx ? [0, 1] : [1, 0], ex = tileX(x) + dx * 0.44, ez = tileZ(y) + dy * 0.44;
      const end = (s) => (wet(x + ax * s, y + ay * s) ? 0.44 : 0.5), a = [ex - ax * end(-1), ez - ay * end(-1)], b = [ex + ax * end(1), ez + ay * end(1)];
      for (const [h, list] of [[0.5, tops], [0.28, ropes]]) list.push([a[0], h, a[1], b[0], h, b[1]]);
      for (const [px, pz] of [a, b]) railPosts.set(`${px.toFixed(2)},${pz.toFixed(2)}`, [px, pz, 1, 0, null, 0]);
    }
  }));
  beams(tops, 0.028, std({ color: '#7a5434', roughness: 0.85 }), { shadow: false });
  beams(ropes, 0.016, std({ color: '#d8c8a0', roughness: 0.95 }), { shadow: false });
  const railPost = new THREE.CylinderGeometry(0.035, 0.042, 0.56, 6); railPost.translate(0, 0.28, 0);
  instanced(railPost, std({ color: '#5a3c24', roughness: 0.9 }), [...railPosts.values()]).castShadow = false;
  const bank = new THREE.CylinderGeometry(0.707, 0.95, 0.6, 4, 1, true); bank.translate(0, -0.3, 0);
  instanced(bank, std({ color: '#ffffff', roughness: 1 }), banks).castShadow = false;
  const post = new THREE.CylinderGeometry(0.055, 0.07, 0.66, 7); post.translate(0, BED_Y + 0.33, 0);   // poking up a hand at the corners
  instanced(post, std({ color: '#4a3020', roughness: 0.95 }), posts);
  const board = new THREE.BoxGeometry(1.0, 0.13, 0.05); board.translate(0, -0.075, 0);
  instanced(board, std({ color: '#5a3c24', roughness: 0.9 }), fascia).castShadow = false;
}

/** The jungle on the banks round the lagoon, a tree a tile: palms leaning out over the water, broadleaf trees, an old
    column stub in the green; the front rows ferns, low, so they never hide you. */
function lagoonJungle(map, L, rnd) {
  const palms = [], broad = [], ferns = [], stubs = [];
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'T') return;
    B.blocked.add(key(x, y));
    const at = [tileX(x) + (rnd() - 0.5) * 0.5, tileZ(y) + (rnd() - 0.5) * 0.5, 0.85 + rnd() * 0.45, rnd() * 6];
    if (y >= ROWS - 2) { ferns.push([at[0], at[1], 0.7 + rnd() * 0.4, at[3], PALM[Math.floor(rnd() * 3)]]); return; }
    const k = rnd();
    if (k < 0.5) palms.push(at); else if (k < 0.93) broad.push([...at, PALM[1 + Math.floor(rnd() * 2)]]); else stubs.push([at[0], at[1], 0.8 + rnd() * 0.5, at[3]]);
  }));
  const fern = new THREE.IcosahedronGeometry(0.55, 1); fern.scale(1, 0.55, 1); fern.translate(0, 0.25, 0);
  instanced(fern, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), ferns);
  // palms: a curved trunk, seven drooping fronds and coconuts at its top
  const H = 2.4, lean = 0.5;
  const trunk = new THREE.CylinderGeometry(0.07, 0.12, H, 7, 8); trunk.translate(0, H / 2, 0);
  const p = trunk.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = p.getY(i) / H; p.setX(i, p.getX(i) + lean * t * t); }
  trunk.computeVertexNormals();
  instanced(trunk, std({ color: '#8a6a48', roughness: 0.95 }), palms);
  for (let k = 0; k < 7; k++) {
    const leaf = new THREE.ConeGeometry(0.2, 1.35, 4); leaf.translate(0, 0.675, 0); leaf.scale(0.2, 1, 1);   // flat once it's laid out
    leaf.rotateZ(-Math.PI / 2 - 0.15 - (k % 2) * 0.25); leaf.rotateY(k / 7 * Math.PI * 2); leaf.translate(lean, H - 0.02, 0);
    instanced(leaf, std({ color: '#ffffff', roughness: 0.85, flatShading: true }), palms.map(a => [...a, PALM[k % 4]]));
  }
  const nut = new THREE.SphereGeometry(0.07, 8, 6); nut.translate(lean, H - 0.12, 0.06);
  instanced(nut, std({ color: '#6a4a2a', roughness: 0.7 }), palms);
  const bark = new THREE.CylinderGeometry(0.11, 0.17, 1.5, 8); bark.translate(0, 0.75, 0);
  instanced(bark, std({ color: '#6a5038', roughness: 0.95 }), broad);
  for (const [dy, rad, dx] of [[1.5, 0.8, 0], [2.0, 0.55, 0.25], [1.8, 0.6, -0.3]]) {
    const blob = new THREE.IcosahedronGeometry(rad, 1); blob.translate(dx, dy, 0);
    instanced(blob, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), broad);
  }
  const stub = new THREE.CylinderGeometry(0.26, 0.3, 0.9, 10); stub.translate(0, 0.45, 0);
  instanced(stub, std({ color: L.stone[1], roughness: 1 }), stubs);
}

/** Weathered boards up a wall, for the huts' sides and backs. */
function boardsArt() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const g = c.getContext('2d'), r = seeded(19);
  for (let x = 0; x < 64; x += 8) {
    g.fillStyle = ['#c8b088', '#bca07a', '#d4bc94', '#b09470'][Math.floor(r() * 4)]; g.fillRect(x, 0, 8, 32);
    g.fillStyle = 'rgba(60,40,20,0.45)'; g.fillRect(x, 0, 1, 32);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 1, 0, 1, 32);
  }
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** A hut's front: weathered boards, a door painted its colour, lit windows behind shutters of the same, a float hung up. */
function hutFront(w, col, { aqua = false } = {}) {
  const W = Math.round(w * 20), Hh = aqua ? 30 : 26, f = fine(W, Hh, 6), { g, rr, lin } = f, s = f.shine(), r = seeded(W);
  for (let x = 0; x < W; x += 4) { g.fillStyle = ['#c8b088', '#bca07a', '#d4bc94', '#b09470'][Math.floor(r() * 4)]; g.fillRect(x, 0, 4, Hh); g.fillStyle = 'rgba(60,40,20,0.4)'; g.fillRect(x, 0, 0.5, Hh); }
  const lit = (x, y, w, h, round = false) => {
    rr(x - 1, y - 1, w + 2, h + 2, round ? (w + 2) / 2 : 0.8, '#4a2e1c');
    for (const ctx of [g, s]) {
      const rg = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w);
      rg.addColorStop(0, aqua ? '#e8ffff' : '#fff4c8'); rg.addColorStop(1, aqua ? '#40b0e0' : '#f8a040');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.roundRect(x, y, w, h, round ? w / 2 : 0.4); ctx.fill();
    }
    if (aqua) for (let i = 0; i < 3; i++) {   // fish going by
      const fx = x + 2 + r() * (w - 4), fy = y + 2 + r() * (h - 4);
      for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#000' : ['#f86030', '#f8d040', '#3a5aa8'][i]; ctx.beginPath(); ctx.ellipse(fx, fy, 1.6, 0.9, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx + 1.4, fy); ctx.lineTo(fx + 2.6, fy - 0.9); ctx.lineTo(fx + 2.6, fy + 0.9); ctx.fill(); }
    } else for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#000' : '#4a2e1c'; ctx.fillRect(x + w / 2 - 0.3, y, 0.6, h); }
  };
  const mid = W / 2;
  rr(mid - 4.6, Hh - 17, 9.2, 17, 0.8, '#3a2414');
  rr(mid - 3.8, Hh - 16.2, 7.6, 16.2, 0.6, lin(mid - 4, 0, mid + 4, 0, [shadeOf(col, -1), col, shadeOf(col, -1)]));
  g.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = mid - 2; x < mid + 4; x += 2) g.fillRect(x, Hh - 16, 0.4, 16);
  g.fillStyle = '#e8c050'; g.beginPath(); g.arc(mid + 2.4, Hh - 8, 0.7, 0, Math.PI * 2); g.fill();
  if (aqua) { lit(4, 5, mid - 10, Hh - 11); lit(mid + 6, 5, W - mid - 10, Hh - 11); }
  else if (W > 40) for (const x of [mid - 15, mid + 7]) { rr(x - 2.6, 6, 2.2, 9, 0.4, col); rr(x + 8.4, 6, 2.2, 9, 0.4, col); lit(x, 7, 8, 7); }
  else lit(mid - 13 < 2 ? 2 : mid - 13, 7, 6, 6, true);
  return f.c;
}

/** Thatch, rows of it, for the huts' roofs. */
function thatchArt() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), r = seeded(23);
  g.fillStyle = '#c8a860'; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 1.5) { g.fillStyle = ['#d8b870', '#b89850', '#e4c880', '#a88a48'][Math.floor(r() * 4)]; g.fillRect(x, y, 1.2, 7 + r() * 2); }
    g.fillStyle = 'rgba(70,50,20,0.45)'; g.fillRect(0, y + 7, 64, 1.2);
  }
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** A hip roof `w` x `d` at its eaves, `rise` tall: thatch, a cap painted the hut's colour over its top, a finial. */
function hipRoof(parent, { w, d, rise, y, col, crest, thatch = thatchArt() }) {
  const geo = new THREE.CylinderGeometry(0.0, Math.SQRT1_2, 1, 4, 1); geo.rotateY(Math.PI / 4); geo.translate(0, 0.5, 0);
  thatch.repeat.set(Math.max(w, d) / 1.2, rise * 2);
  const roof = mesh(geo, std({ map: thatch, roughness: 0.95, flatShading: true }), 0, y, 0, parent);
  roof.scale.set(w, rise, d);
  const cap = mesh(geo, std({ color: col, roughness: 0.6, flatShading: true }), 0, y + rise * 0.55, 0, parent);
  cap.scale.set(w * 0.47, rise * 0.47, d * 0.47);
  mesh(new THREE.SphereGeometry(0.08, 10, 8), std({ color: shadeOf(col, 1), roughness: 0.4 }), 0, y + rise + 0.03, 0, parent);
  mesh(rbox(w + 0.04, 0.07, d + 0.04, 0.02), std({ color: '#7a5a34', roughness: 0.9 }), 0, y + 0.02, 0, parent).castShadow = false;
  if (crest) {
    const c = panel(crest, 0.42, 0.42, 0, 0, 0);
    c.parent?.remove(c); parent.add(c);
    c.position.set(0, y + rise * 0.42, d * 0.29 + 0.03); c.rotation.x = -(Math.PI / 2 - Math.atan2(rise, d / 2));   // lying on the front slope
  }
}

/** A home on its platform over the water: Kayl's stilt manor, Pelipper's bait shop, a locked bungalow, or the aquarium:
    the big hall of weathered boards, glass in its front and a glass dome lit blue on top, its sign on the roof's edge, a
    lantern by the door, a net and floats on its side. A tap is its door. */
function stiltHut(b, f, L, lit, smoke) {
  const leader = b.home && B.town?.homes?.[b.home]?.leader;
  if (leader) return stiltManor(b, f, L, lit, leader);
  if (b.kind === 'shop') return baitShop(b, f, L, lit, smoke);
  if (b.kind !== 'aquarium') return bungalow(b, f, L, lit);
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz - 0.05);
  B.group.add(g);
  const w = f.w - 0.5, d = f.h - 0.9, h = 1.5;
  const sides = boardsArt(); sides.repeat.set(d / 1.4, h / 0.9);
  const wall = std({ map: sides, roughness: 0.95 }), dark = std({ color: '#3a2414', roughness: 0.8 });
  const art = hutFront(w, b.roof, { aqua: true }), front = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.85 });
  lit.push(front);
  mesh(new THREE.BoxGeometry(w, h, d), [wall, wall, dark, dark, front, wall], 0, h / 2, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.1, h + 0.02, 0.1), dark, sx * (w / 2 + 0.01), h / 2, sz * (d / 2 + 0.01), g);
  mesh(rbox(w + 0.3, 0.14, d + 0.3, 0.04), std({ color: '#e8eef0', roughness: 0.6 }), 0, h + 0.07, 0, g);
  const glass = std({ color: '#90d8f0', emissive: new THREE.Color('#3aa8e0'), emissiveIntensity: 0.5, transparent: true, opacity: 0.75, roughness: 0.1, metalness: 0.3 });
  lit.push(glass);
  const dome = mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, h + 0.14, -0.1, g);
  dome.scale.set(1.25, 0.8, 1);
  const frame = std({ color: '#e8eef0', roughness: 0.5, metalness: 0.3 });
  for (let k = 0; k < 6; k++) { const rib = mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.42, 0.018, 4, 24, Math.PI), frame, 0, h + 0.14, -0.1, g); rib.rotation.y = k * Math.PI / 6; rib.scale.set(1.25, 0.8, 1); }
  g.attach(panel(aquaSign(b.name), 1.9, 0.42, f.cx, h + 0.36, f.cz - 0.05 + d / 2 + 0.12));   // standing on the roof's front edge
  // a net and two floats on the side wall
  const side = (b.id.charCodeAt(0) % 2 ? 1 : -1);
  const net = mesh(new THREE.PlaneGeometry(d * 0.6, h * 0.55), std({ map: texOf(netArt()), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 }), side * (w / 2 + 0.02), h * 0.55, 0, g);
  net.rotation.y = side * Math.PI / 2; net.castShadow = false;
  for (const dz of [-0.2, 0.15]) mesh(new THREE.SphereGeometry(0.07, 10, 8), std({ color: dz < 0 ? '#f05a30' : '#f8f0e0', roughness: 0.5 }), side * (w / 2 + 0.06), h * 0.35, dz, g).castShadow = false;
  const glow = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.8, roughness: 0.6 });
  lit.push(glow);
  const lamp = mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.18, 8), glow, 1.1, h * 0.72, d / 2 + 0.1, g);
  lamp.castShadow = false;
  return g;
}

/** Stretches a geometry's UVs, so one shared texture tiles across faces of any size. */
function uvScale(geo, u, v) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  return geo;
}

/** A tiling texture from a small canvas painter. */
function tiling(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  paint(c.getContext('2d'));
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** Woven bamboo matting, for the bungalows' walls. */
function wovenArt() {
  return tiling(32, 32, (g) => {
    g.fillStyle = '#7a5a2c'; g.fillRect(0, 0, 32, 32);
    for (let y = 0; y < 32; y += 4) for (let x = 0; x < 32; x += 4) {
      const across = ((x + y) / 4) % 2;
      g.fillStyle = across ? '#dcc080' : '#c4a462'; g.fillRect(x + 0.3, y + 0.3, 3.4, 3.4);
      g.fillStyle = 'rgba(90,60,24,0.4)';
      if (across) g.fillRect(x + 0.3, y + 1.8, 3.4, 0.5); else g.fillRect(x + 1.8, y + 0.3, 0.5, 3.4);
    }
  });
}

/** Straw ends hanging off a thatch's eave, ragged. */
function fringeArt() {
  return tiling(64, 16, (g) => {
    const r = seeded(37);
    for (let x = 0; x < 64; x += 1.3) { g.fillStyle = ['#d8b870', '#b89850', '#e4c880', '#a88a48'][Math.floor(r() * 4)]; g.fillRect(x, 0, 1.2, 7 + r() * 9); }
  });
}

/** A saddle roof's gable end, painted in the house's colour: diamonds in cream and a darker shade. */
function gableArt(col) {
  return tiling(32, 32, (g) => {
    const dia = (x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.fill(); };
    g.fillStyle = col; g.fillRect(0, 0, 32, 32);
    dia(16, 16, 10, shadeOf(col, -1)); dia(16, 16, 6, '#f4ead0'); dia(16, 16, 2.6, col);
    for (const [x, y] of [[0, 0], [32, 0], [0, 32], [32, 32]]) { dia(x, y, 6, '#f4ead0'); dia(x, y, 3, shadeOf(col, -1)); }
  });
}

/** A bungalow's front: woven bamboo between a sill and a head, a round-topped door painted the house's colour with a
    lit porthole and shells strung over it, a wide lit window between propped shutters, hibiscus in a box under it. */
function bungalowFront(w, h, col, door) {
  const W = Math.round(w * 20), Hh = Math.round(h * 20), f = fine(W, Hh, 6), { g, rr, lin } = f, s = f.shine();
  for (let y = 0; y < Hh; y += 2) for (let x = 0; x < W; x += 2) { g.fillStyle = ((x + y) / 2) % 2 ? '#dcc080' : '#c4a462'; g.fillRect(x, y, 2, 2); }
  g.fillStyle = 'rgba(90,60,24,0.28)'; for (let y = 0; y < Hh; y += 2) g.fillRect(0, y, W, 0.25);
  rr(0, 0, W, 2.2, 0, '#8a6a38'); rr(0, Hh - 1.4, W, 1.4, 0, '#6a4a28');
  const glow = (x, y, w, h, r) => {
    for (const ctx of [g, s]) {
      const rg = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h));
      rg.addColorStop(0, '#fff4c8'); rg.addColorStop(1, '#f8a040');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    }
  };
  const dw = 9, dh = 17, x0 = door - dw / 2, dy = Hh - dh;
  rr(x0 - 0.9, dy - 0.9, dw + 1.8, dh + 0.9, [5.4, 5.4, 0, 0], '#4a2e1c');
  rr(x0, dy, dw, dh, [4.5, 4.5, 0, 0], lin(x0, 0, x0 + dw, 0, [shadeOf(col, -1), col, shadeOf(col, -1)]));
  g.fillStyle = 'rgba(0,0,0,0.22)'; for (let x = x0 + 2.2; x < x0 + dw - 1; x += 2.2) g.fillRect(x, dy + 2, 0.4, dh - 2);
  g.fillStyle = '#4a2e1c'; g.beginPath(); g.arc(door, dy + 5, 2.5, 0, Math.PI * 2); g.fill();
  glow(door - 1.7, dy + 3.3, 3.4, 3.4, 1.7);
  g.fillStyle = '#e8c050'; g.beginPath(); g.arc(x0 + dw - 1.8, Hh - 8, 0.7, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 5; i++) { const a = Math.PI * (0.2 + i * 0.15); g.fillStyle = i % 2 ? '#f0b8a8' : '#f8ece0'; g.beginPath(); g.ellipse(door - Math.cos(a) * 6.4, dy + 4.6 - Math.sin(a) * 6.4 + 2, 1.1, 0.8, a, 0, Math.PI * 2); g.fill(); }
  const wx = door + dw / 2 + 6, ww = Math.min(15, W - wx - 5), wy = 5, wh = 9;
  for (const sx of [wx - 4, wx + ww + 1]) { rr(sx, wy - 0.5, 3, wh + 1, 0.4, col); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = wy + 1; y < wy + wh; y += 1.6) g.fillRect(sx + 0.4, y, 2.2, 0.4); }
  rr(wx - 1, wy - 1, ww + 2, wh + 2, 0.6, '#5a3a20');
  glow(wx, wy, ww, wh, 0.4);
  for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#000' : '#5a3a20'; ctx.fillRect(wx + ww / 2 - 0.35, wy, 0.7, wh); ctx.fillRect(wx, wy + wh / 2 - 0.35, ww, 0.7); }
  rr(wx - 1.6, wy + wh + 1.2, ww + 3.2, 2.6, 0.5, '#6a4a28');
  for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#3e8a30' : '#5aaa44'; g.beginPath(); g.ellipse(wx + i * ww / 8, wy + wh + 1.1, 1.3, 0.9, 0, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 6; i++) { g.fillStyle = ['#e83a4a', '#f8c040', '#f06aa0'][i % 3]; g.beginPath(); g.arc(wx + 0.8 + i * (ww - 1.6) / 5, wy + wh + 0.7, 1.05, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff4c8'; g.beginPath(); g.arc(wx + 0.8 + i * (ww - 1.6) / 5, wy + wh + 0.7, 0.3, 0, Math.PI * 2); g.fill(); }
  return f.c;
}

/** A locked home in Driftwood Landing (the user's ask, 2026-10-14: the other homes "more cool and aesthetic"): an
    overwater bungalow on a raised deck up two steps, walls of woven bamboo between bamboo poles, a porch railed in
    bamboo, glass floats lit in the house's colour strung under the eaves, a lantern by the door; its roof a deep thatch
    in two tiers with straw hanging off the lower, or (`shape: 'saddle'`) a saddle roof swept up into horns at both
    ends, its gables painted in diamonds. A surfboard against one wall, a potted palm on the porch, a net and floats on
    the other side. Its lot is 4 x 3; the door is over its step, half a tile left of the middle. A tap is its door. */
function bungalow(b, f, L, lit) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const kit = B.lagoonKit ??= { weave: wovenArt(), fringe: fringeArt(), boards: boardsArt() };
  const col = b.roof, saddle = b.shape === 'saddle', side = b.id.charCodeAt(0) % 2 ? 1 : -1;
  const W = f.w - 0.25, D = f.h - 0.2, P = 0.26, dx = -0.5;
  const dark = std({ color: '#3a2414', roughness: 0.8 }), cane = std({ color: '#c8a460', roughness: 0.65 }), node = std({ color: '#8a6a38', roughness: 0.8 });
  const paint = std({ color: col, roughness: 0.6 }), wood = std({ color: '#8a6440', roughness: 0.85 });
  const small = (m) => { m.castShadow = false; return m; };
  mesh(uvScale(new THREE.BoxGeometry(W, P, D), W / 1.2, D / 1.2), [dark, dark, std({ map: kit.boards, roughness: 0.9 }), dark, dark, dark], 0, P / 2, 0, g);
  small(mesh(new THREE.BoxGeometry(W + 0.04, 0.07, D + 0.04), paint, 0, P - 0.1, 0, g));
  for (let i = 0; i < 2; i++) mesh(rbox(0.95 - i * 0.05, P / 2, 0.22, 0.02), wood, dx, P / 4 + i * P / 2, D / 2 + 0.2 - i * 0.16, g);
  // the house: woven walls, the lit front, a bamboo pole at each corner
  const hw = 2.5, hd = 1.6, H = 1.2, hz = -0.42, top = P + H, fz = hz + hd / 2, vz = D / 2 - 0.12;
  const wall = std({ map: kit.weave, roughness: 0.9 });
  const art = bungalowFront(hw, H, col, (dx + hw / 2) * 20), front = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.85 });
  lit.push(front);
  mesh(uvScale(new THREE.BoxGeometry(hw, H, hd), hd / 0.8, H / 0.8), [wall, wall, dark, dark, front, wall], 0, P + H / 2, hz, g);
  const knots = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (hw / 2 + 0.02), z = hz + sz * (hd / 2 + 0.02);
    mesh(new THREE.CylinderGeometry(0.05, 0.055, H, 8), cane, x, P + H / 2, z, g);
    for (let y = 0.3; y < H - 0.1; y += 0.42) knots.push([x, P + y, z]);
  }
  instancedIn(g, new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8), node, knots);
  // the roof: two tiers of thatch, or a saddle swept up at both ends
  const back = hz - hd / 2 - 0.3, fore = vz + 0.3, rz = (back + fore) / 2, half = (fore - back) / 2;
  let under, eave;
  if (saddle) {
    const Rw = W + 0.35, R = 1.25, K = 0.7, hr = Rw / 2;
    const roofY = (x, z) => { const u = Math.min(1, Math.abs(x) / hr) ** 4, v = Math.min(1, Math.abs(z - rz) / half); const lo = top + 0.04 + 0.22 * u, hi = top + R + K * u; return lo + (hi - lo) * (1 - v) ** 1.2; };
    const geo = new THREE.PlaneGeometry(Rw, half * 2, 28, 14), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = rz - p.getY(i); p.setXYZ(i, x, roofY(x, z), z); }
    geo.computeVertexNormals();
    const thatch = thatchArt();
    mesh(uvScale(geo, Rw / 1.2, half * 2 / 0.9), std({ map: thatch, roughness: 0.95, side: THREE.DoubleSide }), 0, 0, 0, g);
    const pts = Array.from({ length: 11 }, (_, i) => { const x = -hr + i * Rw / 10; return new THREE.Vector3(x, roofY(x, rz) + 0.03, rz); });
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.065, 6), paint, 0, 0, 0, g);
    for (const s of [-1, 1]) {
      const horn = mesh(new THREE.ConeGeometry(0.07, 0.42, 8), dark, s * (hr + 0.08), roofY(hr, rz) + 0.2, rz, g);
      horn.rotation.z = -s * 0.55;
      small(mesh(new THREE.SphereGeometry(0.08, 12, 8), paint, s * (hr - 0.02), roofY(hr, rz) + 0.05, rz, g));
      const sh = new THREE.Shape(), z0 = hz - hd / 2, z1 = fz, xg = s * hw / 2;
      sh.moveTo(z0, 0);
      for (let k = 0; k <= 10; k++) { const z = z0 + (z1 - z0) * k / 10; sh.lineTo(z, roofY(xg, z) - top - 0.05); }
      sh.lineTo(z1, 0); sh.closePath();
      const gg = new THREE.ShapeGeometry(sh); gg.rotateY(-Math.PI / 2);
      small(mesh(uvScale(gg, 2, 2), std({ map: gableArt(col), roughness: 0.8, side: THREE.DoubleSide }), xg + s * 0.005, top, 0, g));
    }
    under = (x, z) => roofY(x, z) - 0.03;
    eave = (x) => roofY(x, fore - 0.13) - 0.14;
  } else {
    const sw = W + 0.1, rs = 0.9, uw = hw + 0.6, ud = half * 2 - 0.8;
    const lower = new THREE.Group(); lower.position.z = rz; g.add(lower);
    hipRoof(lower, { w: sw, d: half * 2, rise: rs, y: top, col: shadeOf(col, -1) });
    const upper = new THREE.Group(); upper.position.z = rz; g.add(upper);
    hipRoof(upper, { w: uw, d: ud, rise: 1.5, y: top + 0.25, col });
    const fringe = std({ map: kit.fringe, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 });
    for (const [len, x, z, turn] of [[sw, 0, fore, 0], [sw, 0, back, 0], [half * 2, -sw / 2, rz, Math.PI / 2], [half * 2, sw / 2, rz, Math.PI / 2]]) {
      const fr = small(mesh(uvScale(new THREE.PlaneGeometry(len, 0.2), len / 1.6, 1), fringe, x, top - 0.08, z, g));
      fr.rotation.y = turn; fr.raycast = () => {};
    }
    const ft = top + 0.25 + 1.5;
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), dark, 0, ft + 0.15, rz, g);
    for (let k = 0; k < 3; k++) small(mesh(new THREE.SphereGeometry(0.07 - k * 0.012, 12, 8), k % 2 ? std({ color: '#f4ead0', roughness: 0.5 }) : paint, 0, ft + 0.12 + k * 0.12, rz, g));
    small(mesh(new THREE.ConeGeometry(0.04, 0.16, 8), dark, 0, ft + 0.5, rz, g));
    under = (x, z) => top + rs * (1 - Math.max(Math.abs(x) / (sw / 2), Math.abs(z - rz) / half)) - 0.03;
    eave = () => top - 0.2;
  }
  // the porch: bamboo posts up to the eaves, a bamboo rail either side of the steps and down its ends
  const px = W / 2 - 0.14;
  for (const x of [-px, px]) mesh(new THREE.CylinderGeometry(0.05, 0.055, under(x, vz) - P, 8), cane, x, (under(x, vz) + P) / 2, vz, g);
  const rails = [[-px, dx - 0.5], [dx + 0.5, px]].filter(([a, c]) => c - a > 0.2);
  for (const [a, c] of rails) for (const y of [P + 0.44, P + 0.22]) small(mesh(new THREE.CylinderGeometry(0.025, 0.025, c - a, 6), cane, (a + c) / 2, y, vz, g)).rotation.z = Math.PI / 2;
  for (const x of [-px, px]) for (const y of [P + 0.44, P + 0.22]) small(mesh(new THREE.CylinderGeometry(0.025, 0.025, vz - fz, 6), cane, x, y, (vz + fz) / 2, g)).rotation.x = Math.PI / 2;
  const sticks = [];
  for (const [a, c] of rails) for (let x = a + 0.14; x < c - 0.05; x += 0.14) sticks.push([x, P, vz]);
  for (const x of [-px, px]) for (let z = fz + 0.14; z < vz - 0.05; z += 0.14) sticks.push([x, P, z]);
  instancedIn(g, (() => { const c = new THREE.CylinderGeometry(0.018, 0.018, 0.44, 5); c.translate(0, 0.22, 0); return c; })(), cane, sticks);
  // glass floats lit in the house's colour, strung under the front eave
  const glass = std({ color: col, emissive: new THREE.Color(shadeOf(col, 1)), emissiveIntensity: 0.8, roughness: 0.2, transparent: true, opacity: 0.88 });
  lit.push(glass);
  const floats = [-1.35, -0.75, 0.15, 0.75, 1.35].map((x, i) => [x, eave(x) - (i % 2) * 0.05, fore - 0.16]);
  instancedIn(g, new THREE.SphereGeometry(0.075, 12, 8), glass, floats);
  instancedIn(g, (() => { const c = new THREE.CylinderGeometry(0.006, 0.006, 0.2, 4); c.translate(0, 0.1, 0); return c; })(), dark, floats);
  // a lantern by the door
  const flame = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.8, roughness: 0.6 });
  lit.push(flame);
  small(mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.18, 8), flame, dx + 0.62, top - 0.36, fz + 0.12, g));
  small(mesh(new THREE.ConeGeometry(0.1, 0.08, 8), dark, dx + 0.62, top - 0.23, fz + 0.12, g));
  // a surfboard against one wall, a potted palm on the porch, the net and floats on the other wall
  const tint = ['#f8f4ec', '#f06a4a', '#3ab0c8', '#f8c840'][b.id.charCodeAt(0) % 4];
  const lean = new THREE.Group(); lean.position.set(side * (hw / 2 + 0.12), P, hz + 0.25); lean.rotation.z = side * 0.14; g.add(lean);
  const surf = mesh(new THREE.CapsuleGeometry(0.15, 0.95, 4, 12), std({ color: tint, roughness: 0.4 }), 0, 0.64, 0, lean);
  surf.rotation.y = Math.PI / 2; surf.scale.z = 0.16;
  small(mesh(new THREE.BoxGeometry(0.05, 1.12, 0.34), paint, 0, 0, 0, surf));
  const pot = new THREE.Group(); pot.position.set(-side * (W / 2 - 0.34), P, vz - 0.28); g.add(pot);
  mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.22, 10), std({ color: '#c86a40', roughness: 0.8 }), 0, 0.11, 0, pot);
  mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.5, 6), std({ color: '#8a6a48', roughness: 0.95 }), 0, 0.45, 0, pot);
  const frond = new THREE.ConeGeometry(0.1, 0.48, 4); frond.translate(0, 0.24, 0); frond.scale(0.3, 1, 1); frond.rotateZ(-Math.PI / 2 - 0.45);
  instancedIn(pot, frond, std({ color: '#4e9a3a', roughness: 0.85, flatShading: true }), Array.from({ length: 6 }, (_, k) => [0, 0.7, 0, k * Math.PI / 3]));
  const net = small(mesh(new THREE.PlaneGeometry(hd * 0.6, H * 0.55), std({ map: texOf(netArt()), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 }), -side * (hw / 2 + 0.03), P + H * 0.55, hz, g));
  net.rotation.y = Math.PI / 2;
  for (const dz of [-0.2, 0.15]) small(mesh(new THREE.SphereGeometry(0.07, 10, 8), std({ color: dz < 0 ? '#f05a30' : '#f8f0e0', roughness: 0.5 }), -side * (hw / 2 + 0.07), P + H * 0.35, hz + dz, g));
  return g;
}

/** Lap boards, painted, for the bait shop's walls. */
function clapArt(col) {
  return tiling(32, 32, (g) => {
    const r = seeded(13);
    for (let y = 0; y < 32; y += 4) {
      g.fillStyle = col; g.fillRect(0, y, 32, 4);
      g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(0, y, 32, 0.8);
      g.fillStyle = 'rgba(0,40,50,0.25)'; g.fillRect(0, y + 3.2, 32, 0.8);
      for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(r() * 32, y + 1 + r() * 2, 2 + r() * 5, 0.5); }
    }
  });
}

/** The bait shop's front: lap boards in sea-glass blue, a door in the shop's colour with a lit pane, a lit window either
    side in white frames, jars of bait in one, rods and a fish hung up in the other. */
function baitFront(w, h, col, door) {
  const W = Math.round(w * 20), Hh = Math.round(h * 20), f = fine(W, Hh, 6), { g, rr, lin } = f, s = f.shine();
  for (let y = 0; y < Hh; y += 2) { g.fillStyle = y % 4 ? '#62b8c2' : '#6cc2cc'; g.fillRect(0, y, W, 2); g.fillStyle = 'rgba(0,40,50,0.25)'; g.fillRect(0, y + 1.6, W, 0.4); }
  const pane = (x, y, w, h) => {
    rr(x - 1.2, y - 1.2, w + 2.4, h + 2.4, 0.6, '#f4f0e6');
    for (const ctx of [g, s]) { const rg = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h)); rg.addColorStop(0, '#fff6d0'); rg.addColorStop(1, '#f8b050'); ctx.fillStyle = rg; ctx.fillRect(x, y, w, h); }
  };
  const ink = (paint) => { for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#000' : 'rgba(60,36,20,0.85)'; ctx.strokeStyle = ctx.fillStyle; paint(ctx); } };
  const dw = 9, dh = 20, x0 = door - dw / 2;
  rr(x0 - 1.2, Hh - dh - 1.2, dw + 2.4, dh + 1.2, 0.6, '#f4f0e6');
  rr(x0, Hh - dh, dw, dh, 0.4, lin(x0, 0, x0 + dw, 0, [shadeOf(col, -1), col, shadeOf(col, -1)]));
  pane(x0 + 1.6, Hh - dh + 2, dw - 3.2, 6);
  for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#000' : '#f4f0e6'; ctx.fillRect(door - 0.3, Hh - dh + 2, 0.6, 6); }
  g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x0 + 1.6, Hh - dh + 10, dw - 3.2, 0.5); g.fillRect(x0 + 1.6, Hh - 5, dw - 3.2, 0.5);
  g.fillStyle = '#e8c050'; g.beginPath(); g.arc(x0 + dw - 1.6, Hh - 9, 0.7, 0, Math.PI * 2); g.fill();
  const lx = 8, lw = x0 - 3.5 - lx, rx = x0 + dw + 3.5, rw = W - 3.5 - rx, wy = 6, wh = 11;
  pane(lx, wy, lw, wh);
  ink((c) => { for (let i = 0; i < 2; i++) { const x = lx + 1 + i * (lw - 2) / 2; c.beginPath(); c.roundRect(x, wy + wh - 5.5, (lw - 2) / 2 - 0.8, 5.5, 1); c.fill(); c.fillRect(x + 0.4, wy + wh - 6.5, (lw - 2) / 2 - 1.6, 1); } c.fillRect(lx, wy + wh - 6.8 - 0.4, lw, 0.6); });
  pane(rx, wy, rw, wh);
  ink((c) => { c.lineWidth = 0.5; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(rx + 1 + i * 2.6, wy + wh); c.lineTo(rx + 3 + i * 2.6, wy); c.stroke(); } c.beginPath(); c.ellipse(rx + rw - 3.5, wy + 5, 1.6, 3.2, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(rx + rw - 3.5, wy + 7.6); c.lineTo(rx + rw - 5, wy + 10); c.lineTo(rx + rw - 2, wy + 10); c.fill(); });
  for (const x of [lx, rx]) rr(x - 1.8, wy + wh + 1, (x === lx ? lw : rw) + 3.6, 1.4, 0.4, '#f4f0e6');
  return f.c;
}

/** Striped awning canvas in the shop's colour and white; `valance`: its hem, scalloped. */
function awningArt(col, valance = false) {
  return tiling(64, valance ? 16 : 32, (g) => {
    for (let x = 0; x < 64; x += 16) { g.fillStyle = col; g.fillRect(x, 0, 8, 32); g.fillStyle = '#f8f4ec'; g.fillRect(x + 8, 0, 8, 32); }
    g.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 0.6, 32);
    if (!valance) return;
    g.globalCompositeOperation = 'destination-out';
    for (let x = 4; x < 64; x += 8) { g.beginPath(); g.arc(x + 4, 16, 4, 0, Math.PI * 2); g.fill(); }
  });
}

/** The fish-shaped sign hung under the stall's awning: an orange fish with BAIT across it. */
function baitSignArt(col) {
  const f = fine(52, 24, 8), { g, lin } = f;
  g.fillStyle = '#5a3418';
  g.beginPath(); g.ellipse(22, 12, 20, 10.5, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(38, 12); g.lineTo(51.5, 2); g.lineTo(51.5, 22); g.fill();
  g.fillStyle = lin(0, 2, 0, 22, [shadeOf(col, 1), col, shadeOf(col, -1)]);
  g.beginPath(); g.ellipse(22, 12, 18.6, 9.1, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(39, 12); g.lineTo(50, 4.2); g.lineTo(50, 19.8); g.fill();
  g.fillStyle = '#2a1c18'; g.beginPath(); g.arc(8.5, 10, 1.4, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 12px sans-serif'; g.fillText('BAIT', 24, 12.5, 26);
  return f.c;
}

/** Pelipper's flag: sea blue over white, an orange beak across it. */
function peliFlagArt(col) {
  const f = fine(30, 20, 6), { g } = f;
  g.fillStyle = '#3a8ac8'; g.fillRect(0, 0, 30, 10); g.fillStyle = '#f8f4ec'; g.fillRect(0, 10, 30, 10);
  g.fillStyle = col; g.beginPath(); g.moveTo(6, 7); g.quadraticCurveTo(18, 4, 25, 10); g.quadraticCurveTo(18, 16, 6, 13); g.closePath(); g.fill();
  g.fillStyle = '#2a1c18'; g.beginPath(); g.arc(7.5, 6.5, 1.1, 0, Math.PI * 2); g.fill();
  return f.c;
}

/** Pelipper's Bait & Tackle, Driftwood Landing's trade house (the user's ask, 2026-10-14: the homes "more cool and
    aesthetic, especially the trade house"): a seaside shack of sea-glass lap boards on a raised deck, white trim, a
    tin roof with its gable to you and the Poké Ball crest in it, a fish weathervane; a striped awning over the door and
    windows, a life ring on the wall, bait barrel and crates by the steps; beside it an open fish stall under its own
    striped lean-to, fish on ice, rods racked against the wall, the BAIT sign standing on it; a stovepipe smoking the
    catch, and Pelipper's flag on a mast with bunting strung to the roof. Its lot is 4 x 3. A tap anywhere is its door. */
function baitShop(b, f, L, lit, smoke) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const kit = B.lagoonKit ??= { weave: wovenArt(), fringe: fringeArt(), boards: boardsArt() };
  const col = b.roof, W = f.w - 0.25, D = f.h - 0.2, P = 0.24, dx = -0.5;
  const dark = std({ color: '#3a2414', roughness: 0.8 }), wood = std({ color: '#8a6440', roughness: 0.85 }), white = std({ color: '#f4f0e6', roughness: 0.6 });
  const sea = std({ color: '#3a9aa8', roughness: 0.6 }), paint = std({ color: col, roughness: 0.55 });
  const iron = std({ color: '#3a3a3c', roughness: 0.45, metalness: 0.6 }), copper = std({ color: '#c87a40', roughness: 0.35, metalness: 0.7 });
  const small = (m) => { m.castShadow = false; return m; };
  mesh(uvScale(new THREE.BoxGeometry(W, P, D), W / 1.2, D / 1.2), [dark, dark, std({ map: kit.boards, roughness: 0.9 }), dark, dark, dark], 0, P / 2, 0, g);
  small(mesh(new THREE.BoxGeometry(W + 0.04, 0.07, D + 0.04), sea, 0, P - 0.1, 0, g));
  for (let i = 0; i < 2; i++) mesh(rbox(0.95 - i * 0.05, P / 2, 0.22, 0.02), wood, dx, P / 4 + i * P / 2, D / 2 + 0.2 - i * 0.16, g);
  // the shack: lap boards, its lit front, white corner boards, a tin roof with its gable to you
  const sw = 2.4, sd = 1.7, H = 1.4, sx = -0.45, sz = -0.45, fz = sz + sd / 2, top = P + H;
  const clap = clapArt('#66bcc6'), wall = std({ map: clap, roughness: 0.8 });
  const art = baitFront(sw, H, col, (dx - sx + sw / 2) * 20), face = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.8 });
  lit.push(face);
  mesh(uvScale(new THREE.BoxGeometry(sw, H, sd), sd, H), [wall, wall, dark, dark, face, wall], sx, P + H / 2, sz, g);
  for (const cx of [-1, 1]) for (const cz of [-1, 1]) small(mesh(new THREE.BoxGeometry(0.08, H, 0.08), white, sx + cx * (sw / 2 + 0.01), P + H / 2, sz + cz * (sd / 2 + 0.01), g));
  const half = sw / 2 + 0.3, rise = 0.9, deep = sd + 0.5;
  const rg = new THREE.ExtrudeGeometry(gableShape(half, rise, 0.1), { depth: deep, bevelEnabled: false });
  rg.translate(0, 0, -deep / 2);
  mesh(rg, [white, std({ map: roofTiles(['#5ab0c0', '#2a7a8a', '#1a5a68'], 0.8, 0.8), roughness: 0.5, metalness: 0.2 })], sx, top, sz, g);
  const gable = new THREE.Shape(); gable.moveTo(-sw / 2, 0); gable.lineTo(sw / 2, 0); gable.lineTo(0, 0.72); gable.closePath();
  for (const z of [fz + 0.005, sz - sd / 2 - 0.005]) { const m = mesh(new THREE.ShapeGeometry(gable), std({ map: clap, roughness: 0.8, side: THREE.DoubleSide }), sx, top, z, g); m.castShadow = false; }
  g.attach(panel(houseCrest('ball'), 0.38, 0.38, f.cx + sx, top + 0.3, f.cz + fz + 0.02));
  const vane = new THREE.Group(); vane.position.set(sx, top + rise, sz); g.add(vane);
  mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), iron, 0, 0.25, 0, vane);
  const fish = new THREE.Shape(); fish.moveTo(-0.22, 0); fish.quadraticCurveTo(-0.05, 0.11, 0.12, 0.02); fish.lineTo(0.24, 0.09); fish.lineTo(0.22, -0.08); fish.lineTo(0.12, -0.02); fish.quadraticCurveTo(-0.05, -0.11, -0.22, 0);
  const fin = small(mesh(new THREE.ShapeGeometry(fish), std({ color: '#c87a40', roughness: 0.35, metalness: 0.7, side: THREE.DoubleSide }), 0, 0.42, 0, vane));
  fin.rotation.y = Math.PI / 2;
  // a stovepipe smoking the catch
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 10), iron, sx - 0.6, top + 0.62, sz - 0.4, g);
  small(mesh(new THREE.ConeGeometry(0.14, 0.1, 10), iron, sx - 0.6, top + 1.07, sz - 0.4, g));
  smoke?.push([f.cx + sx - 0.6, top + 1.15, f.cz + sz - 0.4, false]);
  // the striped awning over the door and windows, a ship's lantern at each end
  const stripes = awningArt(col), hem = awningArt(col, true);
  const out = 0.55, drop = 0.3, aw = sw + 0.1, hi = top - 0.1, lo = hi - drop;
  const slope = mesh(uvScale(new THREE.PlaneGeometry(aw, Math.hypot(out, drop)), aw / 0.5, 1), std({ map: stripes, roughness: 0.9, side: THREE.DoubleSide }), sx, (hi + lo) / 2, fz + out / 2, g);
  slope.rotation.x = -Math.atan2(out, drop);
  const val = small(mesh(uvScale(new THREE.PlaneGeometry(aw, 0.15), aw / 0.5, 1), std({ map: hem, transparent: true, alphaTest: 0.5, roughness: 0.9, side: THREE.DoubleSide }), sx, lo - 0.075, fz + out, g));
  val.raycast = () => {};
  const glow = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.8, roughness: 0.6 });
  lit.push(glow);
  for (const s of [-1, 1]) {
    const x = sx + s * (aw / 2 - 0.08), z = fz + out - 0.05;
    small(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 4), iron, x, lo - 0.06, z, g));
    small(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.15, 8), glow, x, lo - 0.2, z, g));
    for (const y of [lo - 0.12, lo - 0.28]) small(mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.025, 8), iron, x, y, z, g));
  }
  // a life ring on the wall, a bait barrel and crates by the steps
  const ring = [white, std({ color: '#e83a2a', roughness: 0.5 })];
  for (let k = 0; k < 4; k++) small(mesh(new THREE.TorusGeometry(0.13, 0.035, 8, 10, Math.PI / 2), ring[k % 2], sx - sw / 2 + 0.17, P + 0.82, fz + 0.04, g)).rotation.z = k * Math.PI / 2;
  const tile = (x, z) => [f.cx + x + COLS / 2 - 0.5, f.cz + z + ROWS / 2 - 0.5];
  for (const [id, x, z, k, y, turn] of [['barrel', 0.35, 1.0, 0.6, 0, 0], ['crate', -1.4, 0.95, 0.55, 0, 0], ['crate', -1.4, 0.95, 0.42, 0.3, 0.5]]) {
    const at = tile(x, z), m = piece(id, at[0], at[1], { scale: k, y: P + y, free: true, turn });
    if (m) g.attach(m);
  }
  // the fish stall beside it: posts, a striped lean-to, fish on ice, rods racked against the wall, the BAIT sign
  const lx0 = sx + sw / 2, lx1 = W / 2 - 0.02, lz0 = sz - sd / 2 + 0.12, lz1 = fz + 0.35, lhi = top - 0.06, llo = P + 1.0, ly = (x) => lhi - (lhi - llo) * (x - lx0) / (lx1 - lx0);
  mesh(new THREE.CylinderGeometry(0.04, 0.045, llo - P, 8), wood, lx1 - 0.08, (llo + P) / 2, lz1 - 0.06, g);
  const lg = uvScale(new THREE.PlaneGeometry(lz1 - lz0, Math.hypot(lx1 - lx0, lhi - llo)), (lz1 - lz0) / 0.5, 1).rotateX(-Math.PI / 2).rotateY(Math.PI / 2);
  mesh(lg, std({ map: stripes, roughness: 0.9, side: THREE.DoubleSide }), (lx0 + lx1) / 2, (lhi + llo) / 2, (lz0 + lz1) / 2, g).rotation.z = -Math.atan2(lhi - llo, lx1 - lx0);
  const cx = (lx0 + lx1) / 2 + 0.04, cz = fz - 0.05;
  mesh(new THREE.BoxGeometry(0.85, 0.48, 0.5), wood, cx, P + 0.24, cz, g);
  small(mesh(new THREE.BoxGeometry(0.8, 0.05, 0.46), std({ color: '#e8f4f8', roughness: 0.3 }), cx, P + 0.5, cz, g));
  const fishGeo = new THREE.SphereGeometry(0.07, 10, 6); fishGeo.scale(1.9, 0.55, 0.85);
  const catchAt = [[-0.27, -0.1], [-0.05, 0.08], [0.18, -0.06], [0.28, 0.12], [-0.2, 0.14]].map(([x, z], i) => [cx + x, P + 0.55, cz + z, i * 0.7]);
  const caught = instancedIn(g, fishGeo, std({ color: '#ffffff', roughness: 0.35, metalness: 0.25 }), catchAt), tone = new THREE.Color();
  ['#f08a40', '#8ab0c8', '#f0c040', '#e8607a', '#7ac0a0'].forEach((c, i) => caught.setColorAt(i, tone.set(c)));
  const rod = new THREE.CylinderGeometry(0.008, 0.016, 1.6, 5); rod.translate(0, 0.8, 0); rod.rotateX(-0.16);
  const rods = [0.12, 0.3, 0.48, 0.66, 0.84].map(x => [lx0 + x, P, lz0 + 0.06]);
  instancedIn(g, rod, std({ color: '#3a2a20', roughness: 0.5 }), rods);
  const reel = new THREE.CylinderGeometry(0.035, 0.035, 0.03, 10); reel.rotateZ(Math.PI / 2); reel.translate(0, 0.42, -0.045);
  instancedIn(g, reel, std({ color: '#d8d8d0', roughness: 0.3, metalness: 0.6 }), rods);
  small(mesh(new THREE.BoxGeometry(0.95, 0.05, 0.05), wood, (lx0 + lx1) / 2, P + 0.85, lz0 + 0.05, g));
  const sign = new THREE.Group(); sign.position.set(cx, ly(cx) - 0.02, lz1 - 0.04); g.add(sign);   // standing on the lean-to's front edge, so it never hides the catch
  for (const s of [-1, 1]) small(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 5), iron, s * 0.22, 0.1, -0.01, sign));
  const board = panel(baitSignArt(col), 0.7, 0.32, 0, 0, 0); board.removeFromParent(); sign.add(board); board.position.y = 0.22;
  // the mast at the back corner, Pelipper's flag on it, bunting strung to the roof's peak
  const mx = lx1 - 0.08, mz = lz0 + 0.06, mh = P + 2.75;
  mesh(new THREE.CylinderGeometry(0.03, 0.04, mh, 8), wood, mx, mh / 2, mz, g);
  small(mesh(new THREE.SphereGeometry(0.05, 10, 8), copper, mx, mh + 0.03, mz, g));
  const flag = new THREE.Group(); flag.position.set(mx, mh - 0.2, mz); g.add(flag);
  small(mesh(new THREE.PlaneGeometry(0.5, 0.33), std({ map: texOf(peliFlagArt(col)), side: THREE.DoubleSide, roughness: 0.9 }), -0.26, 0, 0, flag));
  const a = new THREE.Vector3(mx, mh - 0.45, mz), c = new THREE.Vector3(sx, top + rise + 0.25, sz), tri = new THREE.Shape();
  tri.moveTo(-0.07, 0); tri.lineTo(0.07, 0); tri.lineTo(0, -0.15); tri.closePath();
  const pennants = Array.from({ length: 9 }, (_, i) => { const t = (i + 0.5) / 9; return [a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t - 0.2 * 4 * t * (1 - t), a.z + (c.z - a.z) * t, 0]; });
  const bunting = instancedIn(g, new THREE.ShapeGeometry(tri), std({ color: '#ffffff', roughness: 0.9, side: THREE.DoubleSide }), pennants);
  pennants.forEach((_, i) => bunting.setColorAt(i, tone.set([col, '#f8f4ec', '#3a8ac8', '#e83a4a'][i % 4])));
  const cord = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => { const t = i / 8; return new THREE.Vector3(a.x + (c.x - a.x) * t, a.y + (c.y - a.y) * t - 0.2 * 4 * t * (1 - t), a.z + (c.z - a.z) * t); })), 16, 0.006, 4);
  small(mesh(cord, dark, 0, 0, 0, g)).raycast = () => {};
  B.ticks.push((now) => {
    if (calm) return;
    vane.rotation.y = Math.sin(now / 3200) * 0.5;
    flag.rotation.y = Math.sin(now / 800) * 0.18;
  });
  return g;
}

/** Many small copies of one thing inside a group that moves (a houseboat rocking): one instanced mesh, untappable. */
function instancedIn(parent, geo, m, at) {
  const o = new THREE.InstancedMesh(geo, m, at.length), d = new THREE.Object3D();
  at.forEach(([x, y, z, turn = 0], i) => { d.position.set(x, y, z); d.rotation.set(0, turn, 0); d.updateMatrix(); o.setMatrixAt(i, d.matrix); });
  o.castShadow = false; o.raycast = () => {};
  parent.add(o);
  return o;
}

/** A Gym Leader's home in Driftwood Landing (the user's ask, 2026-10-14: every leader's house "more grand and extravagant
    and aesthetic", each town in its own style; the village's are manor()s, the Springs' lodge()s): a great stilt house
    on a raised deck over the lagoon, up steps, a veranda across its front on posts in the leader's colour, railed, gold
    bands on the posts, glass fishing-float lanterns lit in their colour under the eaves, a deep thatched roof with an
    upper storey rising out of it under a second, taller thatch, the crest on its front slope and a gold spire on top,
    lavender in planters and two banners. Its lot is 5 x 4 tiles. A tap anywhere is its door. */
function stiltManor(b, f, L, lit, leader) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const ink = LEADER_INK[leader] || ['#f0e0ff', '#b088e0', '#523478'], letter = (b.name || leader)[0].toUpperCase();
  const W = f.w - 0.3, D = f.h - 0.25, P = 0.36;
  const dark = std({ color: '#3a2414', roughness: 0.8 }), wood = std({ color: '#8a6440', roughness: 0.85 });
  const gold = std({ color: '#e8b040', metalness: 0.75, roughness: 0.28, emissive: new THREE.Color('#7a4a10'), emissiveIntensity: 0.35 });
  const inked = std({ color: ink[1], roughness: 0.6 }), deep = std({ color: ink[2], roughness: 0.7 });
  const lights = (art) => { const m = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.85 }); lit.push(m); return m; };
  const small = (m) => { m.castShadow = false; return m; };
  // the raised deck: planks on a dark skirt, a band in the leader's colour and a gold line round it, steps down the front
  const planks = boardsArt(); planks.repeat.set(W / 1.2, D / 1.2);
  mesh(new THREE.BoxGeometry(W, P, D), [dark, dark, std({ map: planks, roughness: 0.9 }), dark, dark, dark], 0, P / 2, 0, g);
  small(mesh(new THREE.BoxGeometry(W + 0.04, 0.09, D + 0.04), deep, 0, P - 0.14, 0, g));
  small(mesh(new THREE.BoxGeometry(W + 0.06, 0.025, D + 0.06), gold, 0, P - 0.07, 0, g));
  for (let i = 0; i < 3; i++) mesh(rbox(1.3 - i * 0.06, P / 3, 0.22, 0.02), wood, 0, P / 6 + i * P / 3, D / 2 + 0.33 - i * 0.18, g);
  // the hall: weathered boards, its front lit
  const hw = W - 0.9, hd = 2.1, hz = -0.55, H = 1.4, top = P + H;
  const sides = boardsArt(); sides.repeat.set(hd / 1.4, H / 0.9);
  const wall = std({ map: sides, roughness: 0.95 });
  mesh(new THREE.BoxGeometry(hw, H, hd), [wall, wall, dark, dark, lights(hutFront(hw, b.roof)), wall], 0, P + H / 2, hz, g);
  // the veranda: posts in the leader's colour with gold bands, a railing either side of the steps and down its ends
  const vz = D / 2 - 0.2, px = W / 2 - 0.28, fz = hz + hd / 2, posts = [-px, -px * 0.62, -0.66, 0.66, px * 0.62, px];
  for (const x of posts) {
    mesh(new THREE.CylinderGeometry(0.075, 0.085, H, 10), inked, x, P + H / 2, vz, g);
    for (const y of [P + 0.04, P + H - 0.12]) small(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 10), gold, x, y, vz, g));
  }
  for (const s of [-1, 1]) {
    const x0 = s * 0.66, x1 = s * px, mid = (x0 + x1) / 2, span = Math.abs(x1 - x0);
    for (const y of [P + 0.46, P + 0.24]) small(mesh(rbox(span, 0.045, 0.045, 0.015), y > P + 0.3 ? inked : wood, mid, y, vz, g));
    for (const y of [P + 0.46, P + 0.24]) small(mesh(rbox(0.045, 0.045, vz - fz, 0.015), y > P + 0.3 ? inked : wood, x1, y, (vz + fz) / 2, g));
  }
  const balusters = [];
  for (const s of [-1, 1]) for (let i = 1; i < 8; i++) balusters.push([s * (0.66 + i * (px - 0.66) / 8), P + 0.24, vz]);
  instancedIn(g, (() => { const p = new THREE.BoxGeometry(0.03, 0.22, 0.03); p.translate(0, 0.11, 0); return p; })(), wood, balusters);
  // lavender in planters at the veranda's ends (Kayl's: lavender everywhere), sprigs on one mesh
  const sprigs = [];
  for (const s of [-1, 1]) {
    small(mesh(rbox(0.6, 0.2, 0.24, 0.02), dark, s * (px - 0.42), P + 0.1, vz - 0.32, g));
    for (let i = 0; i < 6; i++) sprigs.push([s * (px - 0.42) - 0.24 + i * 0.096, P + 0.2, vz - 0.32 + (i % 2 ? 0.05 : -0.05), i]);
  }
  instancedIn(g, (() => { const c = new THREE.ConeGeometry(0.045, 0.3, 5); c.translate(0, 0.15, 0); return c; })(), std({ color: '#9a78d8', roughness: 0.8 }), sprigs);
  // the deep lower thatch over hall and veranda, a gold line along its front eave
  const back = hz - hd / 2 - 0.35, front = vz + 0.38, rd = front - back, rz = (front + back) / 2, rw = W + 0.05;
  const lower = new THREE.Group(); lower.position.z = rz; g.add(lower);
  hipRoof(lower, { w: rw, d: rd, rise: 1.15, y: top, col: b.roof });
  small(mesh(new THREE.BoxGeometry(rw + 0.08, 0.035, 0.035), gold, 0, top + 0.07, front + 0.04, g));
  // the upper storey rising out of the thatch, lit, under a taller thatch with the crest on its front and a gold spire
  const uw = 2.5, ud = 1.5, uy = top + 0.74, uh = 0.9;
  const usides = boardsArt(); usides.repeat.set(ud / 1.4, uh / 0.9);
  const uwall = std({ map: usides, roughness: 0.95 });
  mesh(new THREE.BoxGeometry(uw, uh, ud), [uwall, uwall, dark, dark, lights(hutFront(uw, b.roof)), uwall], 0, uy + uh / 2, rz, g);
  for (const sx of [-1, 1]) small(mesh(new THREE.BoxGeometry(0.1, uh, 0.1), inked, sx * (uw / 2 + 0.01), uy + uh / 2, rz + ud / 2 + 0.01, g));
  const upper = new THREE.Group(); upper.position.z = rz; g.add(upper);
  const ur = 1.2, ut = uy + uh;
  hipRoof(upper, { w: uw + 0.75, d: ud + 0.75, rise: ur, y: ut, col: b.roof, crest: houseCrest('ink', ink, letter) });
  small(mesh(new THREE.BoxGeometry(uw + 0.83, 0.035, 0.035), gold, 0, ut + 0.07, rz + (ud + 0.75) / 2 + 0.04, g));
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), gold, 0, ut + ur + 0.2, rz, g);
  for (let k = 0; k < 3; k++) small(mesh(new THREE.TorusGeometry(0.08 - k * 0.016, 0.016, 6, 14), gold, 0, ut + ur + 0.1 + k * 0.08, rz, g)).rotation.x = Math.PI / 2;
  mesh(new THREE.ConeGeometry(0.06, 0.2, 10), gold, 0, ut + ur + 0.48, rz, g);
  // glass fishing floats lit in the leader's colour, hung from the lower eave
  const glow = std({ color: ink[1], emissive: new THREE.Color(ink[0]), emissiveIntensity: 0.8, roughness: 0.25, transparent: true, opacity: 0.9 });
  lit.push(glow);
  for (const x of [-px * 0.81, -0.33, 0, 0.33, px * 0.81]) {
    const y = top - 0.3 - (x ? 0 : 0.06);
    small(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 4), dark, x, y + 0.22, vz + 0.12, g));
    small(mesh(new THREE.SphereGeometry(0.11, 14, 10), glow, x, y, vz + 0.12, g));
    small(mesh(new THREE.TorusGeometry(0.11, 0.012, 4, 14), dark, x, y, vz + 0.12, g));
  }
  // two banners at the deck's front corners, swaying a little
  const cloth = std({ map: texOf(noboriArt(ink, letter)), side: THREE.DoubleSide, roughness: 0.95 });
  const flags = [-1, 1].map(s => {
    const x = s * (W / 2 + 0.1), z = vz, tall = 2.6;   // just clear of the thatch, on mooring poles down into the water
    mesh(new THREE.CylinderGeometry(0.035, 0.045, tall + P - WATER_Y, 8), dark, x, (P + tall + WATER_Y) / 2, z, g);
    small(mesh(new THREE.SphereGeometry(0.06, 10, 8), gold, x, P + tall + 0.04, z, g));
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 6), dark, x + s * 0.22, P + tall - 0.1, z, g).rotation.z = Math.PI / 2;
    const hang = new THREE.Group();
    hang.position.set(x + s * 0.22, P + tall - 0.12, z + 0.02);
    g.add(hang);
    small(mesh(new THREE.PlaneGeometry(0.4, 1.5), cloth, 0, -0.75, 0, hang));
    return hang;
  });
  B.ticks.push((now) => { if (!calm) flags.forEach((h, i) => { h.rotation.y = Math.sin(now / 900 + i * 2) * 0.12; h.rotation.x = Math.sin(now / 1300 + i) * 0.04; }); });
  return g;
}

/** The aquarium's sign: deep blue, a fish, its name. */
function aquaSign(name) {
  const f = fine(96, 22, 8), { g, rr, lin } = f;
  rr(0, 0, 96, 22, 3, '#e8eef0');
  rr(1.8, 1.8, 92.4, 18.4, 2, lin(0, 0, 0, 22, ['#2a7ab8', '#1a4a88']));
  g.fillStyle = '#f8b040'; g.beginPath(); g.ellipse(13, 11, 5.5, 3.2, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(17.5, 11); g.lineTo(21.5, 7.5); g.lineTo(21.5, 14.5); g.fill();
  g.fillStyle = '#1a2a48'; g.beginPath(); g.arc(10.5, 10, 0.9, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f8f8f0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 11px sans-serif';
  g.fillText(name, 57, 12, 66);
  return f.c;
}

/** A fishing net's mesh, with a ragged edge. */
function netArt() {
  const f = fine(32, 24, 6), { g } = f;
  g.strokeStyle = '#e8dcb8'; g.lineWidth = 0.6;
  for (let i = -24; i < 40; i += 3) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 20, 24); g.stroke(); g.beginPath(); g.moveTo(i + 20, 0); g.lineTo(i, 24); g.stroke(); }
  g.strokeStyle = '#8a6a40'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(0, 0.8); g.lineTo(32, 0.8); g.stroke();
  return f.c;
}

/** A net drying on its rack: two posts, a pole, the net hung over it with floats along its foot. */
function netRack(x, z, turn) {
  const g = new THREE.Group();
  g.position.set(x, 0, z); g.rotation.y = turn;
  B.group.add(g);
  const wood = std({ color: '#6a4a30', roughness: 0.9 });
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.1, 6), wood, s * 0.45, 0.55, 0, g);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6), wood, 0, 1.08, 0, g).rotation.z = Math.PI / 2;
  const net = mesh(new THREE.PlaneGeometry(0.9, 0.8), std({ map: texOf(netArt()), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 }), 0, 0.68, 0, g);
  net.castShadow = false;
  for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(0.05, 8, 6), std({ color: i % 2 ? '#f05a30' : '#f8f0e0', roughness: 0.5 }), -0.33 + i * 0.22, 0.3, 0, g).castShadow = false;
  return g;
}

/** A rowboat moored on the water, bobbing: a pointed hull, a seat across it, an oar laid in. */
function rowboat(x, z, turn, col) {
  const g = new THREE.Group();
  g.position.set(x, WATER_Y, z); g.rotation.y = turn;
  B.group.add(g);
  const s = new THREE.Shape();
  s.moveTo(-0.62, 0); s.quadraticCurveTo(-0.5, 0.26, 0, 0.27); s.quadraticCurveTo(0.45, 0.26, 0.68, 0); s.quadraticCurveTo(0.45, -0.26, 0, -0.27); s.quadraticCurveTo(-0.5, -0.26, -0.62, 0);
  const hull = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 12 });
  hull.rotateX(-Math.PI / 2); hull.translate(0, -0.06, 0);
  mesh(hull, [std({ color: '#6a4a30', roughness: 0.8 }), std({ color: col, roughness: 0.6 })], 0, 0, 0, g);
  mesh(new THREE.BoxGeometry(0.08, 0.03, 0.46), std({ color: '#a07448', roughness: 0.8 }), 0.05, 0.13, 0, g);
  const oar = mesh(new THREE.BoxGeometry(0.9, 0.02, 0.05), std({ color: '#c09a68', roughness: 0.8 }), -0.05, 0.15, 0.1, g);
  oar.rotation.y = 0.15;
  const k = Math.random() * 6;
  B.ticks.push((now) => { if (calm) return; g.position.y = WATER_Y + Math.sin(now / 1100 + k) * 0.015; g.rotation.z = Math.sin(now / 1500 + k) * 0.04; });
  return g;
}

/** A drowned column standing in the water, broken off, moss at the waterline. */
function drownedColumn(x, z, tall, L) {
  const g = new THREE.Group();
  g.position.set(x, BED_Y, z);
  B.group.add(g);
  const stone = std({ color: L.stone[1], roughness: 1, flatShading: true });
  mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.14, 10), stone, 0, 0.07, 0, g);
  const shaft = new THREE.CylinderGeometry(0.24, 0.26, tall, 12, 1); shaft.translate(0, tall / 2 + 0.14, 0);
  const p = shaft.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > tall) p.setY(i, p.getY(i) - (Math.atan2(p.getZ(i), p.getX(i)) + Math.PI) / (Math.PI * 2) * 0.25);   // snapped off on a slant
  shaft.computeVertexNormals();
  mesh(shaft, stone, 0, 0, 0, g);
  mesh(new THREE.TorusGeometry(0.255, 0.04, 6, 16), std({ color: '#4a7a3a', roughness: 1 }), 0, -BED_Y + WATER_Y + 0.03, 0, g).rotation.x = Math.PI / 2;
  return g;
}

/** Pat's houseboat, moored by its gangway, grand as a Gym Leader's home (the user's ask, 2026-10-14: every leader's house
    "more grand and extravagant and aesthetic", each town in its own style): a long two-deck riverboat, its hull white with
    a stripe in his colour, his crest on its side and a gold rub rail; a cabin lit along its length, its roof an upper
    deck railed in his colours with gold knobs, a wheelhouse under a rounded roof with his crest over its eave; a
    paddlewheel turning slowly at the stern, fairy lights strung mast to flagstaff and along the rail, his banners on
    both, a hammock at the bow, a rose in a bottle. Its lot is 6 x 3 tiles of water; it rocks. A tap is its door. */
function houseboat(b, f, L, lit) {
  const leader = b.home && B.town?.homes?.[b.home]?.leader;
  const ink = LEADER_INK[leader] || [shadeOf(b.roof, 1), b.roof, shadeOf(b.roof, -1)], letter = (b.name || '?')[0].toUpperCase();
  const g = new THREE.Group(), boat = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  g.add(boat);
  boat.position.x = 0.25;   // its bow to the east, room for the wheel at the stern
  const len = f.w - 0.8, beam = f.h - 0.45, hl = len / 2, hb = beam / 2;
  const white = std({ color: '#f4f0e6', roughness: 0.55 }), wood = std({ color: '#8a6a48', roughness: 0.8 });
  const gold = std({ color: '#e8b040', metalness: 0.75, roughness: 0.28, emissive: new THREE.Color('#7a4a10'), emissiveIntensity: 0.35 });
  const inked = std({ color: ink[1], roughness: 0.55 }), deep = std({ color: ink[2], roughness: 0.6 }), rose = std({ color: b.roof, roughness: 0.5 });
  const lights = (art) => { const m = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.85 }); lit.push(m); return m; };
  const small = (m) => { m.castShadow = false; return m; };
  const plate = (art, w, h, x, y, z, tilt = 0) => { const p = panel(art, w, h, 0, 0, 0); p.removeFromParent(); boat.add(p); p.position.set(x, y, z); p.rotation.x = tilt; return p; };
  // the hull, a stripe in his colour round it, a gold rub rail at the deck's edge, his crest on its side
  const s = new THREE.Shape();
  s.moveTo(-hl, -hb * 0.9); s.lineTo(hl * 0.55, -hb); s.quadraticCurveTo(hl * 1.05, -hb * 0.6, hl * 1.1, 0); s.quadraticCurveTo(hl * 1.05, hb * 0.6, hl * 0.55, hb); s.lineTo(-hl, hb * 0.9); s.closePath();
  const band = (depth, k) => { const e = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 14 }); e.rotateX(-Math.PI / 2); e.scale(k, 1, k); return e; };
  const hullGeo = new THREE.ExtrudeGeometry(s, { depth: 0.5, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2, curveSegments: 14 });
  hullGeo.rotateX(-Math.PI / 2);
  const deckArt = boardsArt(); deckArt.repeat.set(len, beam); deckArt.rotation = Math.PI / 2;
  mesh(hullGeo, [std({ map: deckArt, roughness: 0.85 }), white], 0, WATER_Y - 0.12, 0, boat);
  mesh(band(0.09, 1.012), rose, 0, WATER_Y + 0.1, 0, boat);
  small(mesh(band(0.03, 1.02), gold, 0, WATER_Y + 0.4, 0, boat));
  plate(houseCrest('ink', ink, letter), 0.34, 0.34, hl * 0.45, WATER_Y + 0.25, hb * 0.98 + 0.05);
  const top = WATER_Y + 0.42;
  // the cabin, long and lit, a gold band under its eave, lifebuoys on its side
  const cw = len * 0.6, cd = beam * 0.68, ch = 0.82, cx = -hl * 0.12;
  mesh(new THREE.BoxGeometry(cw, ch, cd), [white, white, white, white, lights(hutFront(cw, b.roof)), white], cx, top + ch / 2, 0, boat);
  small(mesh(new THREE.BoxGeometry(cw + 0.02, 0.05, cd + 0.02), gold, cx, top + ch - 0.07, 0, boat));
  for (const dx of [-cw * 0.4, cw * 0.4]) small(mesh(new THREE.TorusGeometry(0.11, 0.04, 8, 18), std({ color: '#f05a30', roughness: 0.5 }), cx + dx, top + 0.5, cd / 2 + 0.04, boat));
  // the upper deck: its lip in his deepest colour, a railing round it in his colour, gold knobs at the corners
  const ut = top + ch, rw = cw + 0.2, rd = cd + 0.2, ry = ut + 0.08;
  mesh(rbox(cw + 0.3, 0.08, cd + 0.3, 0.03), deep, cx, ut + 0.04, 0, boat);
  for (const y of [ry + 0.36, ry + 0.18]) for (const sz of [-1, 1]) {
    small(mesh(rbox(rw, 0.035, 0.035, 0.01), y > ry + 0.3 ? inked : white, cx, y, sz * rd / 2, boat));
    small(mesh(rbox(0.035, 0.035, rd, 0.01), y > ry + 0.3 ? inked : white, cx + sz * rw / 2, y, 0, boat));
  }
  const rp = [], nx = Math.round(rw / 0.32), nz = Math.round(rd / 0.32);
  for (let i = 0; i <= nx; i++) for (const sz of [-1, 1]) rp.push([cx - rw / 2 + i * rw / nx, ry, sz * rd / 2]);
  for (let j = 1; j < nz; j++) for (const sx of [-1, 1]) rp.push([cx + sx * rw / 2, ry, -rd / 2 + j * rd / nz]);
  instancedIn(boat, (() => { const p = new THREE.BoxGeometry(0.03, 0.36, 0.03); p.translate(0, 0.18, 0); return p; })(), white, rp);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) small(mesh(new THREE.SphereGeometry(0.045, 10, 8), gold, cx + sx * rw / 2, ry + 0.4, sz * rd / 2, boat));
  // the wheelhouse at the stern end of the upper deck, its rounded roof in his colour, his crest over its eave
  const ww = cw * 0.4, wd = cd * 0.7, wh = 0.62, wx = cx - cw / 2 + ww / 2 + 0.18;
  mesh(new THREE.BoxGeometry(ww, wh, wd), [white, white, white, white, lights(hutFront(ww, b.roof)), white], wx, ry + wh / 2, 0, boat);
  const roofGeo = new THREE.CylinderGeometry(wd * 0.62, wd * 0.62, ww + 0.2, 20, 1, false, 0, Math.PI);
  roofGeo.rotateZ(Math.PI / 2); roofGeo.scale(1, 0.45, 1);
  mesh(roofGeo, std({ color: b.roof, roughness: 0.5, side: THREE.DoubleSide }), wx, ry + wh, 0, boat);
  small(mesh(new THREE.BoxGeometry(ww + 0.22, 0.04, 0.04), gold, wx, ry + wh + 0.02, wd * 0.62, boat));
  plate(houseCrest('ink', ink, letter), 0.36, 0.36, wx, ry + wh + 0.16, wd * 0.62 + 0.03, -0.35);
  // the paddlewheel at the stern under its white guard, turning slowly
  const wheel = new THREE.Group();
  wheel.position.set(-hl - 0.42, WATER_Y + 0.18, 0);
  boat.add(wheel);
  for (const z of [-0.36, 0.36]) small(mesh(new THREE.TorusGeometry(0.46, 0.03, 6, 24), deep, 0, 0, z, wheel));
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.84, 12), gold, 0, 0, 0, wheel).rotation.x = Math.PI / 2;
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2, p = mesh(new THREE.BoxGeometry(0.05, 0.3, 0.72), k % 2 ? rose : inked, Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0, wheel); p.rotation.z = a + Math.PI / 2; }
  const guard = new THREE.CylinderGeometry(0.56, 0.56, 0.86, 20, 1, true, -Math.PI / 2, Math.PI);
  guard.rotateX(Math.PI / 2);
  mesh(guard, std({ color: '#f4f0e6', roughness: 0.55, side: THREE.DoubleSide }), -hl - 0.42, WATER_Y + 0.18, 0, boat);
  small(mesh(new THREE.TorusGeometry(0.56, 0.025, 6, 20, Math.PI), gold, -hl - 0.42, WATER_Y + 0.18, 0.43, boat));
  // a mast at the bow, a flagstaff at the stern, his banners on both and a pennant up top
  const mastX = hl * 0.72, staffX = -hl + 0.14, tall = 2.5;
  const cloth = std({ map: texOf(noboriArt(ink, letter)), side: THREE.DoubleSide, roughness: 0.95 });
  const flags = [[mastX, 1], [staffX, -1]].map(([x, sd]) => {
    mesh(new THREE.CylinderGeometry(0.03, 0.04, tall, 8), wood, x, top + tall / 2, 0, boat);
    small(mesh(new THREE.SphereGeometry(0.05, 10, 8), gold, x, top + tall + 0.03, 0, boat));
    mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 6), wood, x - sd * 0.2, top + tall - 0.35, 0.05, boat).rotation.z = Math.PI / 2;
    const hang = new THREE.Group();
    hang.position.set(x - sd * 0.2, top + tall - 0.37, 0.07);
    boat.add(hang);
    small(mesh(new THREE.PlaneGeometry(0.34, 1.2), cloth, 0, -0.6, 0, hang));
    return hang;
  });
  const pennant = small(mesh(new THREE.ConeGeometry(0.1, 0.4, 3), inked, mastX + 0.2, top + tall - 0.1, 0, boat));
  pennant.rotation.z = -Math.PI / 2; pennant.scale.z = 0.15;
  // fairy lights, sagging from the mast to the flagstaff over the wheelhouse, and along the upper deck's front rail
  const bulbs = [[], [], []];
  for (let i = 0; i <= 22; i++) { const t = i / 22; bulbs[i % 3].push([mastX + (staffX - mastX) * t, top + tall - 0.12 - Math.sin(t * Math.PI) * 0.4, 0]); }
  for (let i = 0; i <= 14; i++) bulbs[i % 3].push([cx - rw / 2 + i * rw / 14, ry + 0.33 - (i % 2) * 0.05, rd / 2 + 0.03]);
  const bulb = new THREE.SphereGeometry(0.035, 8, 6);
  ['#ffd060', ink[0], '#ff8090'].forEach((c, i) => {
    const m = std({ color: '#fff0c0', emissive: new THREE.Color(c), emissiveIntensity: 1, roughness: 0.4 });
    lit.push(m);
    instancedIn(boat, bulb, m, bulbs[i]);
  });
  // a hammock slung from the mast to the cabin's bow end, and a rose in a bottle on the bow
  const hy = top + 0.62, hx0 = mastX - 0.06, hx1 = cx + cw / 2 + 0.02;
  const sling = new THREE.CatmullRomCurve3(Array.from({ length: 7 }, (_, i) => { const t = i / 6; return new THREE.Vector3(hx0 + (hx1 - hx0) * t, hy - Math.sin(t * Math.PI) * 0.26, 0); }));
  const hammock = new THREE.TubeGeometry(sling, 20, 0.07, 8);
  hammock.scale(1, 0.55, 1.6);
  small(mesh(hammock, std({ color: b.roof, roughness: 0.9 }), 0, 0, 0.12, boat));
  mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.2, 10), std({ color: '#90d0a0', transparent: true, opacity: 0.7, roughness: 0.1 }), mastX + 0.3, top + 0.1, -hb * 0.35, boat);
  mesh(new THREE.SphereGeometry(0.06, 10, 8), std({ color: '#e0284a', roughness: 0.5 }), mastX + 0.3, top + 0.32, -hb * 0.35, boat);
  // the gangway, from the door onto the deck on the door's side of the boat
  const rel = tileZ(b.door.y) - f.cz, side = Math.sign(rel) || -1, z0 = rel - side * 0.3, z1 = side * (beam / 2 - 0.25);
  const way = mesh(new THREE.BoxGeometry(0.42, 0.04, Math.hypot(z1 - z0, top)), std({ color: '#a07448', roughness: 0.85 }), tileX(b.door.x) - f.cx, (top + 0.02) / 2, (z0 + z1) / 2, g);
  way.rotation.x = -Math.atan2(top - 0.02, z1 - z0);
  B.ticks.push((now) => {
    if (calm) return;
    boat.position.y = Math.sin(now / 1500) * 0.025; boat.rotation.x = Math.sin(now / 1900) * 0.015; boat.rotation.z = Math.sin(now / 2300) * 0.02;
    wheel.rotation.z = now / 2600;
    flags.forEach((h, i) => { h.rotation.y = Math.sin(now / 900 + i * 2) * 0.12; h.rotation.x = Math.sin(now / 1300 + i) * 0.04; });
  });
  return g;
}

/** The old beacon on its rock: a stone tower banded white and sea green, a gallery, its lamp room lit, a Wingull's nest on
    its cap; its light sweeps round slowly. A tap is its (stuck) door. */
function beacon(f, L, lit) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const rnd = seeded(13), rockAt = [];
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; rockAt.push([f.cx + Math.cos(a) * 1.15, f.cz + Math.sin(a) * 1.0, 0.5 + rnd() * 0.35, rnd() * 6, ['#7a7468', '#8a8478', '#6a645a'][i % 3]]); }
  const rock = new THREE.DodecahedronGeometry(0.6, 0); rock.scale(1, 0.6, 1); rock.translate(0, 0.05, 0);
  instanced(rock, std({ color: '#ffffff', roughness: 1, flatShading: true }), rockAt);
  const bands = document.createElement('canvas');
  bands.width = 8; bands.height = 64;
  const bg = bands.getContext('2d');
  for (let y = 0; y < 64; y += 16) { bg.fillStyle = '#f0ece0'; bg.fillRect(0, y, 8, 8); bg.fillStyle = '#3a9a8a'; bg.fillRect(0, y + 8, 8, 8); }
  const bmap = new THREE.CanvasTexture(bands); bmap.colorSpace = THREE.SRGBColorSpace;
  const tall = 3.0;
  mesh(new THREE.CylinderGeometry(0.42, 0.62, tall, 18), std({ map: bmap, roughness: 0.8 }), 0, tall / 2, 0, g);
  mesh(new THREE.BoxGeometry(0.34, 0.55, 0.06), std({ color: '#3a2414', roughness: 0.8 }), 0, 0.3, 0.58, g);
  mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 18), std({ color: '#3a3a40', roughness: 0.6, metalness: 0.4 }), 0, tall + 0.04, 0, g);
  const light = std({ color: '#fff4c0', emissive: new THREE.Color('#ffd070'), emissiveIntensity: 1.2, transparent: true, opacity: 0.85, roughness: 0.2 });
  lit.push(light);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.45, 14), light, 0, tall + 0.3, 0, g).castShadow = false;
  mesh(new THREE.ConeGeometry(0.42, 0.45, 14), std({ color: '#d84a3a', roughness: 0.5 }), 0, tall + 0.75, 0, g);
  mesh(new THREE.TorusGeometry(0.16, 0.06, 6, 12), std({ color: '#8a6a40', roughness: 1 }), 0, tall + 0.98, 0, g).rotation.x = Math.PI / 2;
  const beam = new THREE.Group();
  beam.position.y = tall + 0.3;
  g.add(beam);
  const ray = std({ color: '#fff4c0', emissive: new THREE.Color('#fff0b0'), emissiveIntensity: 0.6, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const cone = mesh(new THREE.ConeGeometry(0.35, 3.2, 12, 1, true), ray, s * 1.6, 0, 0, beam); cone.rotation.z = s * Math.PI / 2; cone.castShadow = cone.receiveShadow = false; cone.raycast = () => {}; }
  const night = ['dusk', 'night'].includes(timeOfDay());
  beam.visible = night;
  B.ticks.push((now) => { if (!calm) beam.rotation.y = now / 3000; });
  return g;
}

/** A stone tablet, the town's name carved in it (the temple arch's). */
function tabletArt(name) {
  const f = fine(96, 22, 8), { g, rr, lin } = f;
  rr(0, 0, 96, 22, 2, '#8a7a58');
  rr(1.8, 1.8, 92.4, 18.4, 1.4, lin(0, 0, 0, 22, ['#d8c8a0', '#b8a880']));
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 10px sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillText(name.toUpperCase(), 48.5, 12.5, 86);
  g.fillStyle = '#4a3a24'; g.fillText(name.toUpperCase(), 48, 12, 86);
  return f.c;
}

/** The temple gate's frieze: carved waves curling along the lintel, a rune glowing between each. */
function friezeArt(L) {
  const f = fine(160, 20, 4), { g } = f, s = f.shine();
  g.fillStyle = L.stone[0]; g.fillRect(0, 0, 160, 20);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, 160, 1.4); g.fillRect(0, 18.6, 160, 1.4);
  for (let x = 4; x < 160; x += 20) {
    for (const [col, off] of [['rgba(0,0,0,0.35)', 0.6], ['rgba(255,255,255,0.22)', 0]]) {
      g.strokeStyle = col; g.lineWidth = 1.4; g.beginPath();
      g.moveTo(x + off, 15 + off); g.quadraticCurveTo(x + 6 + off, 3 + off, x + 12 + off, 9 + off);
      g.arc(x + 9.5 + off, 9.5 + off, 2.6, 0, Math.PI * 1.5); g.stroke();
    }
  }
  for (let x = 24; x < 160; x += 40) for (const ctx of [g, s]) {
    ctx.fillStyle = ctx === s ? '#70e0f0' : '#a8f4ff';
    ctx.beginPath(); ctx.moveTo(x - 2.4, 10); ctx.lineTo(x, 6); ctx.lineTo(x + 2.4, 10); ctx.lineTo(x, 14); ctx.closePath(); ctx.fill();
  }
  return f.c;
}

/** The great wheel in the gate's crown: a carved disc, a wave curling round its middle, eight runes glowing round its rim. */
function wheelArt(L) {
  const f = fine(48, 48, 6), { g } = f, s = f.shine();
  g.fillStyle = L.stone[2]; g.beginPath(); g.arc(24, 24, 23.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.2;
  for (const r of [22, 15.5]) { g.beginPath(); g.arc(24, 24, r, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1.6; g.beginPath();
  for (let k = 0; k <= 60; k++) { const a = k / 60 * Math.PI * 3.2, r = 2 + k / 60 * 11; g.lineTo(24 + Math.cos(a) * r, 24 + Math.sin(a) * r); }
  g.stroke();
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2, x = 24 + Math.cos(a) * 18.8, y = 24 + Math.sin(a) * 18.8;
    for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#70e0f0' : '#a8f4ff'; ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillRect(-0.6, -2.2, 1.2, 4.4); ctx.fillRect(-1.8, -0.6, 2.4, 1.2); ctx.restore(); }
  }
  for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#70e0f0' : '#c8f8ff'; ctx.beginPath(); ctx.arc(24, 24, 2.4, 0, Math.PI * 2); ctx.fill(); }
  return f.c;
}

/** The temple floor's old mosaic laid in front of the gate: rings of worn tiles, runes glowing round it, faint. */
function mosaicArt(L) {
  const f = fine(64, 64, 4), { g } = f, s = f.shine(), r = seeded(61);
  for (let ring = 0; ring < 5; ring++) {
    const r0 = 31 - ring * 6, n = 8 + (4 - ring) * 6;
    for (let k = 0; k < n; k++) {
      const a0 = k / n * Math.PI * 2 + ring * 0.2, a1 = (k + 1) / n * Math.PI * 2 + ring * 0.2 - 0.04;
      g.fillStyle = [L.stone[0], L.stone[1], L.stone[2], '#5a9aa0'][Math.floor(r() * (ring === 2 ? 4 : 3))];
      g.beginPath(); g.arc(32, 32, r0, a0, a1); g.arc(32, 32, r0 - 5.4, a1, a0, true); g.closePath(); g.fill();
    }
  }
  for (let k = 0; k < 12; k++) {
    const a = k / 12 * Math.PI * 2, x = 32 + Math.cos(a) * 22.3, y = 32 + Math.sin(a) * 22.3;
    for (const ctx of [g, s]) { ctx.fillStyle = ctx === s ? '#3a8a98' : '#90e8f4'; ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill(); }
  }
  g.fillStyle = 'rgba(40,60,40,0.35)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(r() * 64, r() * 64, 1 + r() * 2.5, 0.8 + r() * 1.5, r() * 3, 0, Math.PI * 2); g.fill(); }
  g.globalCompositeOperation = 'destination-in'; g.beginPath(); g.arc(32, 32, 31.5, 0, Math.PI * 2); g.fill();
  return f.c;
}

/** The light hanging in the gate's opening: pale streaks rising, brightest at the threshold. */
function templeVeilArt() {
  const f = fine(32, 64, 2), { g } = f, r = seeded(17);
  for (let i = 0; i < 26; i++) {
    const x = r() * 32, w = 0.6 + r() * 2, h = 20 + r() * 44, l = g.createLinearGradient(0, 64, 0, 64 - h);
    l.addColorStop(0, `rgba(150,240,255,${0.35 + r() * 0.4})`); l.addColorStop(1, 'rgba(150,240,255,0)');
    g.fillStyle = l; g.fillRect(x, 64 - h, w, h);
  }
  return f.c;
}

/** The way out, the drowned temple's great gate on the far shore (the user's ask, 2026-10-14: the exit "more cool and
    aesthetic"): an old mosaic glowing on the paving under it; two pillars on stepped plinths, banded with carved waves
    and runes; a stepped crown, its frieze of waves and runes, the town's name on its tablet, a great wheel at its top
    with its runes turning; braziers of blue spirit-fire on the crown's shoulders; pale light hanging in the opening;
    corbels stepping in at its top corners; broken columns either side, coral and shells at their feet, kelp hanging off
    the crown. Its pillars and columns block their tiles; the way between them is `R.exitAt`. */
function templeArch(x, z, span, tall, name, L, lit) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  B.group.add(g);
  B.reach = 2;   // the camera may lean past the back row, so the whole gate shows when you walk up to it
  const stone = std({ color: L.stone[0], roughness: 0.95 }), carved = std({ color: L.stone[2], roughness: 1 }), worn = std({ color: L.stone[1], roughness: 1, flatShading: true });
  const rune = std({ color: '#20404a', emissive: new THREE.Color('#70e0f0'), emissiveIntensity: 0.8, roughness: 0.5 });
  const moss = std({ color: '#4a7a3a', roughness: 1 });
  lit.push(rune);
  const small = (m) => { m.castShadow = false; return m; };
  const flat = (m) => { m.castShadow = false; m.raycast = () => {}; return m; };
  // the mosaic on the paving in front
  const mos = mosaicArt(L), floor = std({ map: texOf(mos), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(mos.glow), emissiveIntensity: 0.6, transparent: true, alphaTest: 0.3, roughness: 1 });
  lit.push(floor);
  flat(mesh(new THREE.CircleGeometry(1.05, 48), floor, 0, 0.012, 0.1, g)).rotation.x = -Math.PI / 2;
  // the pillars: stepped plinths, shafts banded with carved waves, runes, flared capitals
  const px = span / 2 + 0.1, inner = px - 0.31;
  for (const s of [-1, 1]) {
    const cx = s * px;
    mesh(rbox(0.95, 0.18, 0.95, 0.04), worn, cx, 0.09, 0, g);
    mesh(rbox(0.8, 0.2, 0.8, 0.04), carved, cx, 0.28, 0, g);
    mesh(rbox(0.62, tall, 0.62, 0.05), stone, cx, tall / 2 + 0.38, 0, g);
    for (const y of [0.85, 1.75, 2.6]) {
      small(mesh(new THREE.BoxGeometry(0.66, 0.12, 0.66), carved, cx, y, 0, g));
      small(mesh(new THREE.BoxGeometry(0.67, 0.03, 0.67), rune, cx, y, 0, g));
    }
    for (const y of [1.3, 2.18]) {
      small(mesh(new THREE.BoxGeometry(0.06, 0.24, 0.02), rune, cx, y, 0.315, g));
      small(mesh(new THREE.BoxGeometry(0.2, 0.06, 0.02), rune, cx, y + 0.04, 0.315, g));
    }
    mesh(rbox(0.74, 0.14, 0.74, 0.03), carved, cx, tall + 0.3, 0, g);
    mesh(rbox(0.86, 0.14, 0.86, 0.03), stone, cx, tall + 0.42, 0, g);
    // corbels stepping in at the opening's top corners
    small(mesh(new THREE.BoxGeometry(0.3, 0.2, 0.6), carved, s * (inner - 0.15), tall + 0.39, 0, g));
    small(mesh(new THREE.BoxGeometry(0.18, 0.12, 0.56), carved, s * (inner - 0.39), tall + 0.43, 0, g));
  }
  // the crown: three tiers stepping up, the frieze along the first, the name on its tablet
  const c0 = tall + 0.49, t1 = 0.52, t2 = 0.36, t3 = 0.3, w1 = span + 1.7;
  const frieze = friezeArt(L), face = std({ map: texOf(frieze), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(frieze.glow), emissiveIntensity: 0.6, roughness: 0.95 });
  lit.push(face);
  mesh(new THREE.BoxGeometry(w1, t1, 0.92), [stone, stone, carved, stone, face, stone], 0, c0 + t1 / 2, 0, g);
  small(mesh(new THREE.BoxGeometry(w1 + 0.08, 0.06, 0.98), carved, 0, c0 + t1, 0, g));
  mesh(rbox(span + 0.4, t2, 0.78, 0.04), stone, 0, c0 + t1 + t2 / 2, -0.04, g);
  mesh(rbox(1.5, t3, 0.66, 0.04), carved, 0, c0 + t1 + t2 + t3 / 2, -0.08, g);
  // the crack down the crown, and a block fallen off its corner
  small(mesh(new THREE.BoxGeometry(0.04, t1 + 0.02, 0.94), std({ color: '#3a3020', roughness: 1 }), 0.62, c0 + t1 / 2, 0, g));
  const chip = mesh(new THREE.DodecahedronGeometry(0.24, 0), worn, px + 0.75, 0.16, 0.6, g);
  chip.rotation.set(0.5, 0.3, 0.2);
  // the wheel, its rune ring turning, a halo of glowing rune in a ring round it
  const wy = c0 + t1 + t2 + 0.36;   // a medallion on the crown's face, in front of its upper tiers
  const disc = mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.16, 32), carved, 0, wy, 0.37, g);
  disc.rotation.x = Math.PI / 2;
  const wart = wheelArt(L), wface = std({ map: texOf(wart), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(wart.glow), emissiveIntensity: 0.7, transparent: true, roughness: 0.9 });
  lit.push(wface);
  const wheel = small(mesh(new THREE.CircleGeometry(0.56, 40), wface, 0, wy, 0.455, g));
  const halo = small(mesh(new THREE.TorusGeometry(0.62, 0.03, 6, 40), rune, 0, wy, 0.42, g));
  // braziers of blue spirit-fire on the crown's shoulders
  const fire = new THREE.MeshBasicMaterial({ color: '#58d8f0', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
  const core = new THREE.MeshBasicMaterial({ color: '#e8ffff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const flames = [-1, 1].map(s => {
    const bx = s * (w1 / 2 - 0.32), by = c0 + t1 + 0.04;
    mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.12, 12), carved, bx, by + 0.06, 0, g);
    mesh(new THREE.CylinderGeometry(0.26, 0.12, 0.2, 14), stone, bx, by + 0.22, 0, g);
    small(mesh(new THREE.TorusGeometry(0.26, 0.025, 6, 20), rune, bx, by + 0.32, 0, g)).rotation.x = Math.PI / 2;
    const fl = new THREE.Group(); fl.position.set(bx, by + 0.3, 0); g.add(fl);
    flat(mesh(new THREE.ConeGeometry(0.17, 0.52, 12), fire, 0, 0.26, 0, fl));
    flat(mesh(new THREE.ConeGeometry(0.08, 0.3, 10), core, 0, 0.15, 0, fl));
    return fl;
  });
  // the light hanging in the opening
  const veilMap = texOf(templeVeilArt()); veilMap.wrapS = THREE.RepeatWrapping;
  const veil = new THREE.MeshBasicMaterial({ map: veilMap, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  flat(mesh(new THREE.PlaneGeometry(inner * 2 - 0.04, tall + 0.1), veil, 0, (tall + 0.1) / 2 + 0.02, 0, g));
  // broken columns either side, coral and shells at their feet
  const shaft = (cx, h, lean) => {
    mesh(rbox(0.6, 0.16, 0.6, 0.03), worn, cx, 0.08, -0.3, g);
    const geo = new THREE.CylinderGeometry(0.22, 0.25, h, 12, 1); geo.translate(0, h / 2, 0);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > h - 0.01) p.setY(i, p.getY(i) - (Math.atan2(p.getZ(i), p.getX(i)) + Math.PI) / (Math.PI * 2) * 0.3);
    geo.computeVertexNormals();
    const col = mesh(geo, stone, cx, 0.16, -0.3, g); col.rotation.z = lean;
    small(mesh(new THREE.TorusGeometry(0.245, 0.04, 6, 16), moss, cx, 0.28, -0.3, g)).rotation.x = Math.PI / 2;
  };
  shaft(-(w1 / 2 + 0.75), 1.55, 0.04); shaft(w1 / 2 + 0.75, 1.0, -0.06);
  const twig = new THREE.CylinderGeometry(0.02, 0.035, 0.32, 5); twig.translate(0, 0.16, 0); twig.rotateZ(0.35);
  const coralAt = [];
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) coralAt.push([s * (px + 0.32) + (k - 2) * 0.05, 0.18, 0.42 + (k % 2) * 0.08, k * 1.3 + s]);
  const reef = instancedIn(g, twig, std({ color: '#ffffff', roughness: 0.8 }), coralAt), tone = new THREE.Color();
  coralAt.forEach((_, i) => reef.setColorAt(i, tone.set(['#f07888', '#f8a060', '#e85a8a'][i % 3])));
  const shell = new THREE.SphereGeometry(0.06, 10, 6); shell.scale(1, 0.45, 1.2);
  instancedIn(g, shell, std({ color: '#f8e4d8', roughness: 0.5 }), [[-px - 0.55, 0.03, 0.62, 0.4], [px + 0.62, 0.03, 0.4, 1.2], [1.7, 0.03, 0.75, 2], [-1.75, 0.03, 0.8, 0.8]]);
  // kelp hanging off the crown's front, leaves along each strand
  const r = seeded(41), strands = [], leaves = [];
  for (let i = 0; i < 12; i++) {
    const vx = -w1 / 2 + 0.1 + r() * (w1 - 0.2);
    if (Math.abs(vx) < inner && r() < 0.6) continue;
    const len = 0.4 + r() * 1.0;
    strands.push([vx, c0 + t1 - 0.02, 0.47, len]);
    for (let y = 0.15; y < len; y += 0.17) leaves.push([vx, c0 + t1 - 0.02 - y, 0.48, (y * 7) % 2 ? 0.5 : -0.5]);
  }
  for (const [vx, y0, vz, len] of strands) flat(mesh(new THREE.BoxGeometry(0.035, len, 0.02), moss, vx, y0 - len / 2, vz, g));
  const leaf = new THREE.SphereGeometry(0.06, 6, 4); leaf.scale(1.4, 0.5, 0.4);
  instancedIn(g, leaf, std({ color: '#5a9a42', roughness: 0.9 }), leaves);
  panel(tabletArt(name), 1.75, 0.4, x, c0 + t1 / 2, z + 0.47).userData.spot = 'exit';
  for (const cx of [-px, px, -(w1 / 2 + 0.75), w1 / 2 + 0.75]) for (const y of [0, 1]) B.blocked.add(key(Math.round(x + cx + COLS / 2 - 0.5), y));
  const way = mesh(new THREE.PlaneGeometry(span - 0.2, tall), new THREE.MeshBasicMaterial({ visible: false }), 0, tall / 2, 0.05, g);
  way.castShadow = way.receiveShadow = false;
  B.ticks.push((now) => {
    if (calm) return;
    wheel.rotation.z = now / 6000;
    halo.rotation.z = -now / 4000;
    flames.forEach((fl, i) => { fl.scale.set(1 + Math.sin(now / 130 + i * 2) * 0.06, 1 + Math.sin(now / 170 + i) * 0.14, 1); });
    veilMap.offset.x = now / 9000;
    veil.opacity = 0.38 + Math.sin(now / 1400) * 0.08;
  });
  g.traverse(o => { o.userData.spot = 'exit'; });
  return g;
}

/** A leaf blown off the palms, long and pointed. */
function leafletArt(col) {
  const f = fine(12, 12, 8), { g } = f;
  g.fillStyle = col; g.translate(6, 6); g.rotate(0.6);
  g.beginPath(); g.moveTo(-5.5, 0); g.quadraticCurveTo(0, -2.6, 5.5, 0); g.quadraticCurveTo(0, 2.6, -5.5, 0); g.fill();
  g.strokeStyle = 'rgba(30,60,20,0.5)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.stroke();
  return f.c;
}

/** The lagoon's own things from the map: moored boats, drowned columns, nets drying, the lagoon and what holds the town up. */
function lagoonExtras(town, L) {
  lagoonWater(town);
  lagoonSupports(town);
  nameBoards(town, 's');
  const rnd = seeded(57), kind = lagoonKinds(town);
  town.map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === 'y') {
      const along = STEPS.some(([dx]) => dx && kind(x + dx, y) !== 'water');
      rowboat(tileX(x), tileZ(y), (along ? Math.PI / 2 : 0) + (rnd() - 0.5) * 0.3, ['#3a8ab8', '#d85a48', '#e8c050', '#4aa060'][Math.floor(rnd() * 4)]);
    }
    if (ch === '|') drownedColumn(tileX(x) + (rnd() - 0.5) * 0.2, tileZ(y) + (rnd() - 0.5) * 0.2, 0.7 + rnd() * 0.9, L);
    if (ch === 'n') { netRack(tileX(x), tileZ(y), (rnd() - 0.5) * 0.4); B.blocked.add(key(x, y)); }
  }));
}

/* Highbough, Thornwood's (Fortree's): a village up in the canopy. The ground is cut away everywhere but the platforms
   (`holes`), so you walk on round decks of planks round the giant trunks and on rope bridges between them, with the
   jungle floor far below in the mist; treehouses with leaf-shingle roofs, their trees going up through them into crowns;
   the Great Tree in the middle, its deck in rings of planks round it; lone giants standing in the drop; lifts on their
   ropes; the vine gate out. */
const DROP = -7;   // the jungle floor, far below the decks: deep, so it reads as a long way down from the treetops
const ROUND = 0.45;  // a platform's outside corners are rounded this far (in tiles), its rim curving round with them
const CANOPY = { deck: ['#b07a4c', '#a06c40', '#c08a58', '#946238'], seam: '#4a2c18', rim: '#5a3a22', leaf: ['#4e9a3a', '#3a7e30', '#2a6226', '#6ab04a'], bark: '#6a4a32', barkDark: '#4a3222' };

/** What each tile of a canopy town is: open air (a lone trunk's and a lift's too), a rope bridge, a platform's planks, the
    Great Tree's deck or the canopy round the town; a prop stands on what's round it. */
function canopyKinds(town) {
  const { map } = town, at = (x, y) => map[y]?.[x];
  const great = new Set(town.buildings.filter(b => b.kind === 'greattree' || b.kind === 'waystone').map(b => b.at));
  return (x, y) => {
    const ch = at(x, y);
    if (ch === undefined || ch === 'T') return 'canopy';
    if (ch === '~' || ch === '|' || ch === 'y') return 'air';
    if (ch === '-') return 'bridge';
    if (ch === '#' || great.has(ch)) return 'plaza';
    if ('LbckRf'.includes(ch)) return STEPS.some(([dx, dy]) => at(x + dx, y + dy) === '#') ? 'plaza' : 'deck';
    return 'deck';
  };
}

/** Which way each rope bridge tile runs, from how far the bridge reaches through it each way (bridges are two tiles wide,
    the user's ask: a big Pokémon looked to hang off a one-tile one): 'h' across, 'v' up and down, 'x' a landing. */
function bridgeAxes(town) {
  const at = (x, y) => town.map[y]?.[x] === '-';
  const reach = (x, y, dx, dy) => { let n = 1; for (let a = x + dx, b = y + dy; at(a, b); a += dx, b += dy) n++; for (let a = x - dx, b = y - dy; at(a, b); a -= dx, b -= dy) n++; return n; };
  return (x, y) => {
    if (!at(x, y)) return null;
    const h = reach(x, y, 1, 0), v = reach(x, y, 0, 1);
    return h > v ? 'h' : v > h ? 'v' : 'x';
  };
}

/** The ground of a canopy town: nothing over the drop, rope bridges of slats with gaps you see down through, platforms of
    planks with planters and moss, the Great Tree's deck in rings round its trunk, the canopy's leaves round the edge. */
function canopyGround(town) {
  const kind = canopyKinds(town), axis = bridgeAxes(town), { map } = town;
  const tree = footprint(map, town.buildings.find(b => b.kind === 'greattree')?.at ?? '?');
  return (c) => {
    const g = c.getContext('2d'), T = 16, r = seeded(83);
    g.clearRect(-1, -1, COLS * T + 2, ROWS * T + 2);
    const open = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && kind(x, y) === 'air';
    const each = (fn) => map.forEach((row, y) => [...row].forEach((ch, x) => fn(ch, x, y, kind(x, y))));
    // the Great Tree's deck first: rings of planks round the trunk, painted apart and stamped tile by tile onto its deck (a
    // clip over its tiles let the rings run over the whole town on the user's phone, hiding the drop)
    const k = c.width / (COLS * T), rings = document.createElement('canvas');
    rings.width = c.width; rings.height = c.height;
    const rg = rings.getContext('2d');
    rg.scale(k, k);
    const cx = (tree.x0 + tree.x1 + 1) / 2 * T, cy = (tree.y0 + tree.y1 + 1) / 2 * T;
    rg.fillStyle = CANOPY.seam; rg.fillRect(0, 0, COLS * T, ROWS * T);
    for (let rad = 6, n = 0; rad < 14 * T; rad += 4.2, n++) {
      const segs = Math.max(6, Math.round(rad / 9));
      for (let i = 0; i < segs; i++) {
        const a0 = (i + (n % 2) * 0.5) / segs * Math.PI * 2, a1 = a0 + Math.PI * 2 / segs - 0.7 / rad;
        rg.strokeStyle = CANOPY.deck[Math.floor(r() * 4)]; rg.lineWidth = 3.5; rg.lineCap = 'butt';
        rg.beginPath(); rg.arc(cx, cy, rad, a0, a1); rg.stroke();
      }
      rg.strokeStyle = 'rgba(255,240,210,0.12)'; rg.lineWidth = 0.6; rg.beginPath(); rg.arc(cx, cy, rad - 1.2, 0, Math.PI * 2); rg.stroke();
    }
    each((ch, x, y, kd) => { if (kd === 'plaza') g.drawImage(rings, x * T * k, y * T * k, T * k, T * k, x * T, y * T, T, T); });
    each((ch, x, y, k) => {
      if (k === 'air' || k === 'plaza') return;
      const X = x * T, Y = y * T;
      g.save();
      g.beginPath();
      const rad = (dx, dy) => (k !== 'bridge' && open(x + dx, y) && open(x, y + dy) ? ROUND * T : 0);
      g.roundRect(X, Y, T, T, [rad(-1, -1), rad(1, -1), rad(1, 1), rad(-1, 1)]);
      g.clip();
      if (k === 'canopy') {   // the canopy's top: a mat of leaves, darker in its gaps
        g.fillStyle = '#20381a'; g.fillRect(X, Y, T, T);
        for (let i = 0; i < 16; i++) { g.fillStyle = CANOPY.leaf[Math.floor(r() * 4)]; g.beginPath(); g.ellipse(X + r() * T, Y + r() * T, 1.6 + r() * 2.4, 1 + r() * 1.4, r() * 3, 0, Math.PI * 2); g.fill(); }
      } else if (k === 'bridge') {
        // slats across the way you walk, a gap between each, edge to edge over both lanes, carried on a rope down each
        // side over the drop; a landing is laid solid
        const ax = axis(x, y), lane = (dx, dy) => map[y + dy]?.[x + dx] === '-';
        if (ax === 'x') { g.fillStyle = CANOPY.seam; g.fillRect(X, Y, T, T); for (let i = 0.5; i < T; i += 3.4) { g.fillStyle = CANOPY.deck[Math.floor(r() * 4)]; g.fillRect(X, Y + i, T, 2.8); } }
        else {
          const across = ax === 'h';   // slats stand across a bridge running left to right
          const a = (across ? lane(0, -1) : lane(-1, 0)) ? 0 : 2.2, b = (across ? lane(0, 1) : lane(1, 0)) ? 0 : 2.2;
          for (let i = 0; i < T; i += 4) {
            g.fillStyle = CANOPY.deck[Math.floor(r() * 4)];
            if (across) g.fillRect(X + i + 0.3, Y + a, 3, T - a - b); else g.fillRect(X + a, Y + i + 0.3, T - a - b, 3);
            g.fillStyle = 'rgba(255,240,200,0.16)';
            if (across) g.fillRect(X + i + 0.5, Y + a, 0.5, T - a - b); else g.fillRect(X + a, Y + i + 0.5, T - a - b, 0.5);
          }
          g.strokeStyle = '#e8d098'; g.lineWidth = 1.1;
          g.beginPath();
          if (across) { if (a) { g.moveTo(X, Y + 2.6); g.lineTo(X + T, Y + 2.6); } if (b) { g.moveTo(X, Y + T - 2.6); g.lineTo(X + T, Y + T - 2.6); } }
          else { if (a) { g.moveTo(X + 2.6, Y); g.lineTo(X + 2.6, Y + T); } if (b) { g.moveTo(X + T - 2.6, Y); g.lineTo(X + T - 2.6, Y + T); } }
          g.stroke();
        }
      } else {
        // a platform's planks, laid across (a planter stands on them in 3D, planters())
        g.fillStyle = CANOPY.seam; g.fillRect(X, Y, T, T);
        for (let i = 0; i < 4; i++) {
          const off = ((x * 7 + i * 3) % 4) * 4;
          for (let sx = -off; sx < T; sx += 16) {
            g.fillStyle = CANOPY.deck[Math.floor(r() * 4)]; g.fillRect(X + sx + 0.3, Y + i * 4 + 0.3, 15.4, 3.4);
            g.fillStyle = 'rgba(60,30,10,0.4)'; g.fillRect(X + sx + 1.2, Y + i * 4 + 1.6, 0.7, 0.7); g.fillRect(X + sx + 14, Y + i * 4 + 1.6, 0.7, 0.7);
          }
          g.fillStyle = 'rgba(255,240,200,0.12)'; g.fillRect(X, Y + i * 4 + 0.6, T, 0.5);
        }
      }
      if (k !== 'bridge') {   // a dark lip where it drops away, and on a deck a pale trim inside it, so the edge reads
        g.fillStyle = k === 'canopy' ? 'rgba(10,20,8,0.4)' : 'rgba(30,16,8,0.55)';
        if (open(x - 1, y)) g.fillRect(X, Y, 1.4, T);
        if (open(x + 1, y)) g.fillRect(X + T - 1.4, Y, 1.4, T);
        if (open(x, y - 1)) g.fillRect(X, Y, T, 1.4);
        if (open(x, y + 1)) g.fillRect(X, Y + T - 1.4, T, 1.4);
        if (k !== 'canopy') {
          g.fillStyle = 'rgba(255,232,170,0.55)';
          if (open(x - 1, y)) g.fillRect(X + 1.4, Y, 1, T);
          if (open(x + 1, y)) g.fillRect(X + T - 2.4, Y, 1, T);
          if (open(x, y - 1)) g.fillRect(X, Y + 1.4, T, 1);
          if (open(x, y + 1)) g.fillRect(X, Y + T - 2.4, T, 1);
        }
      }
      g.restore();
    });
    // the drop cut out last, whatever was painted: the open air clear, a platform's rounded corners clear outside the curve
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    each((ch, x, y, kd) => {
      if (kd === 'air') { g.fillRect(x * T - 0.05, y * T - 0.05, T + 0.1, T + 0.1); return; }
      if (kd !== 'deck' && kd !== 'plaza') return;
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        if (!open(x + dx, y) || !open(x, y + dy)) continue;
        const ox = (x + (dx > 0)) * T, oy = (y + (dy > 0)) * T, R = ROUND * T;
        g.beginPath(); g.moveTo(ox - dx * R, oy); g.arcTo(ox, oy, ox, oy - dy * R, R); g.lineTo(ox, oy); g.closePath(); g.fill();
      }
    });
    g.restore();
    return c;
  };
}

/** Many beams between pairs of points ([ax, ay, az, bx, by, bz]), cheaply: struts, ropes, vines. */
function beams(list, r, m, { taper = 1, sides = 6, shadow = true } = {}) {
  if (!list.length) return null;
  const geo = new THREE.CylinderGeometry(r * taper, r, 1, sides);
  const o = new THREE.InstancedMesh(geo, m, list.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), p = new THREE.Vector3(), s = new THREE.Vector3();
  list.forEach(([ax, ay, az, bx, by, bz], i) => {
    d.set(bx - ax, by - ay, bz - az);
    const len = d.length();
    q.setFromUnitVectors(up, d.normalize());
    o.setMatrixAt(i, m4.compose(p.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), q, s.set(1, len, 1)));
  });
  o.castShadow = shadow; o.receiveShadow = true;
  o.raycast = () => {};
  B.group.add(o);
  return o;
}

/** A rope from a to b sagging `sag` at its middle, as `n` beams, onto `out`. */
function sagging(out, [ax, ay, az], [bx, by, bz], sag, n = 6) {
  const pt = (t) => [ax + (bx - ax) * t, ay + (by - ay) * t - Math.sin(t * Math.PI) * sag, az + (bz - az) * t];
  for (let i = 0; i < n; i++) out.push([...pt(i / n), ...pt((i + 1) / n)]);
}

/** Bark: grooves down a trunk, for its texture. */
function barkArt() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d'), r = seeded(61);
  g.fillStyle = CANOPY.bark; g.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 26; i++) {
    let x = r() * 64;
    g.strokeStyle = r() < 0.5 ? CANOPY.barkDark : '#8a6648'; g.lineWidth = 1 + r() * 2.2;
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= 128; y += 16) { x += (r() - 0.5) * 5; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 30; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,150,60,0.55)' : 'rgba(40,24,14,0.4)'; g.beginPath(); g.ellipse(r() * 64, r() * 128, 2 + r() * 4, 1 + r() * 2, 0, 0, Math.PI * 2); g.fill(); }
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace;
  return map;
}
let barkMat = null;
const bark = () => (barkMat ??= std({ map: barkArt(), roughness: 0.95 }));

/** A crown of leaves at (x, y, z), `k` its size: a few lumpy blobs, flat shaded. */
function crown(parent, x, y, z, k, rnd, { cols = CANOPY.leaf } = {}) {
  const leaf = cols.map(c => std({ color: c, roughness: 0.9, flatShading: true, transparent: true }));
  const at = parent === B.group ? { x, z } : { x: parent.position.x + x, z: parent.position.z + z };
  if (!B.crowns) {   // a crown between the camera and your Pokémon fades, so the trees never hide it
    B.crowns = [];
    const list = B.crowns;
    B.ticks.push(() => {
      for (const c of list) {
        const behind = Math.abs(walker.x - c.x) < c.r && walker.z < c.z + 0.6 && walker.z > c.z - c.y * 1.3;
        const to = behind ? 0.28 : 1, op = c.leaf[0].opacity + (to - c.leaf[0].opacity) * 0.15;
        for (const m of c.leaf) { m.opacity = op; m.depthWrite = op > 0.95; }
      }
    });
  }
  B.crowns.push({ ...at, y, r: k * 1.5 + 0.4, leaf });
  for (const [dx, dy, dz, rr] of [[0, 0, 0, 1], [0.55, -0.15, 0.2, 0.75], [-0.5, -0.1, -0.15, 0.78], [0.1, 0.35, -0.3, 0.7], [-0.2, -0.25, 0.45, 0.62]]) {
    const m = mesh(new THREE.IcosahedronGeometry(rr * k, 1), leaf[Math.floor(rnd() * leaf.length)], x + dx * k, y + dy * k, z + dz * k, parent);
    m.scale.y = 0.72;
    m.raycast = () => {};
  }
}

/** The canopy round the town, a tree a tile: trunks from the jungle floor, crowns over the edge; the front rows only the
    leaves' tops, low, so they never hide you; vines hanging from the crowns over the drop. */
function canopyRim(map, L, rnd) {
  const trees = [], tops = [], vines = [];
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'T') return;
    B.blocked.add(key(x, y));
    const at = [tileX(x) + (rnd() - 0.5) * 0.5, tileZ(y) + (rnd() - 0.5) * 0.5, 0.9 + rnd() * 0.5, rnd() * 6];
    if (y >= ROWS - 2) { tops.push([at[0], at[1], 0.75 + rnd() * 0.4, at[3], CANOPY.leaf[Math.floor(rnd() * 4)]]); return; }
    trees.push([...at, CANOPY.leaf[Math.floor(rnd() * 4)]]);
    tops.push([at[0] + (rnd() - 0.5) * 0.4, at[1] + (rnd() - 0.5) * 0.4, 0.7 + rnd() * 0.3, at[3], CANOPY.leaf[Math.floor(rnd() * 4)]]);
    if (rnd() < 0.3) { const vx = at[0] + (rnd() - 0.5) * 0.8, vz = at[1] + 0.4; vines.push([vx, 2.0, vz, vx + (rnd() - 0.5) * 0.2, 0.4 - rnd() * 1.6, vz + 0.1]); }
  }));
  const top = new THREE.IcosahedronGeometry(0.62, 1); top.scale(1, 0.55, 1); top.translate(0, 0.22, 0);
  instanced(top, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), tops);
  const trunk = new THREE.CylinderGeometry(0.16, 0.24, 2.4 - DROP, 8); trunk.translate(0, (2.4 + DROP) / 2, 0);
  instanced(trunk, bark(), trees);
  for (const [dy, rad, dx] of [[2.3, 0.85, 0], [2.75, 0.62, 0.3], [2.55, 0.66, -0.35]]) {
    const blob = new THREE.IcosahedronGeometry(rad, 1); blob.scale(1, 0.75, 1); blob.translate(dx, dy, 0);
    instanced(blob, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), trees);
  }
  beams(vines, 0.025, std({ color: '#3e7a2e', roughness: 0.9 }), { sides: 4, shadow: false });
}

/** The jungle floor far below, through the mist: dark loam, roots, ferns and a stream; glow caps lit at night. */
function jungleFloor(town, lit) {
  const T = 16, f = fine(COLS * T, ROWS * T, 2), { g } = f, s = f.shine(), r = seeded(97), W = COLS * T, H = ROWS * T;
  g.fillStyle = '#2a3a1a'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { g.fillStyle = ['#3a4a22', '#2a4a1e', '#46582a', '#22381a', '#3a3420'][i % 5]; g.beginPath(); g.ellipse(r() * W, r() * H, 3 + r() * 9, 2 + r() * 5, r() * 3, 0, Math.PI * 2); g.fill(); }
  // a stream winding down the middle
  g.strokeStyle = '#2a6a6a'; g.lineWidth = 11; g.beginPath();
  for (let y = -10; y <= H + 10; y += 20) g.lineTo(W * 0.5 + Math.sin(y / 90) * W * 0.28 + Math.sin(y / 31) * 14, y);
  g.stroke();
  for (const ctx of [g, s]) { ctx.strokeStyle = ctx === s ? 'rgba(60,140,140,0.6)' : '#4a9a9a'; ctx.lineWidth = 4; ctx.beginPath(); for (let y = -10; y <= H + 10; y += 20) ctx.lineTo(W * 0.5 + Math.sin(y / 90) * W * 0.28 + Math.sin(y / 31) * 14, y); ctx.stroke(); }
  for (let i = 0; i < 90; i++) {   // roots snaking over it
    let x = r() * W, y = r() * H;
    g.strokeStyle = r() < 0.5 ? '#4a3622' : '#5a442c'; g.lineWidth = 1.5 + r() * 2.5;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 30; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 160; i++) {   // glow caps, lit
    const x = r() * W, y = r() * H, col = ['#9af0c0', '#c8f070', '#70d8f8'][i % 3];
    for (const ctx of [g, s]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 1 + r() * 1.2, 0, Math.PI * 2); ctx.fill(); }
  }
  const m = std({ map: texOf(f.c), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(f.c.glow), emissiveIntensity: 0.6, roughness: 1 });
  lit.push(m);
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), m);
  bed.rotation.x = -Math.PI / 2; bed.position.y = DROP; bed.receiveShadow = true; bed.raycast = () => {};
  B.group.add(bed);
  // ferns and bushes on it
  const kind = canopyKinds(town), ferns = [], saplings = [], rnd = seeded(11);
  town.map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (kind(x, y) !== 'air') return;
    for (let i = 0; i < 3; i++) if (rnd() < 0.65) ferns.push([tileX(x) + (rnd() - 0.5) * 0.95, tileZ(y) + (rnd() - 0.5) * 0.95, 0.8 + rnd() * 0.8, rnd() * 6, ['#3e7a2e', '#4a8a34', '#2e6a28', '#5a9a3a'][Math.floor(rnd() * 4)], DROP]);
    if (rnd() < 0.12) saplings.push([tileX(x) + (rnd() - 0.5) * 0.6, tileZ(y) + (rnd() - 0.5) * 0.6, 0.8 + rnd() * 0.5, rnd() * 6, CANOPY.leaf[Math.floor(rnd() * 4)], DROP]);
  }));
  const fern = new THREE.IcosahedronGeometry(0.5, 1); fern.scale(1, 0.5, 1); fern.translate(0, 0.18, 0);
  instanced(fern, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), ferns).castShadow = false;
  const sapling = new THREE.IcosahedronGeometry(0.45, 1); sapling.scale(1, 1.3, 1); sapling.translate(0, 0.9, 0);
  instanced(sapling, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), saplings);
  const stem = new THREE.CylinderGeometry(0.04, 0.06, 0.6, 5); stem.translate(0, 0.3, 0);
  instanced(stem, bark(), saplings);
}

/** The mist between the decks and the floor: two soft layers drifting, so the drop reads deep. */
function canopyMist() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d'), r = seeded(3);
  for (let i = 0; i < 40; i++) {
    const x = r() * 128, y = r() * 128, rad = 10 + r() * 26;
    for (const ox of [0, -128, 128]) for (const oy of [0, -128, 128]) {
      const rg = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
      rg.addColorStop(0, 'rgba(225,245,230,0.55)'); rg.addColorStop(1, 'rgba(225,245,230,0)');
      g.fillStyle = rg; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
    }
  }
  const tint = { night: '#2a3a4c', dusk: '#e8c8a8', dawn: '#f0d8d0' }[timeOfDay()] ?? '#dcece0';   // mist takes no light: it's tinted by the hour
  const layers = [[DROP * 0.3, 0.12, 1], [DROP * 0.55, 0.18, -1.3], [DROP * 0.8, 0.26, 0.8]].map(([y, op, dir]) => {
    const map = new THREE.CanvasTexture(c);
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.repeat.set(COLS / 9, ROWS / 9);
    const o = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), new THREE.MeshBasicMaterial({ map, transparent: true, opacity: op, depthWrite: false, color: tint }));
    o.rotation.x = -Math.PI / 2; o.position.y = y; o.raycast = () => {}; o.renderOrder = 1;
    B.group.add(o);
    return { map, dir };
  });
  B.ticks.push((now) => { if (!calm) for (const { map, dir } of layers) map.offset.set(now / 90000 * dir, now / 140000); });
  // and a haze just over the floor, so it fades away below like the bottom of a deep gorge
  const haze = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), new THREE.MeshBasicMaterial({ color: { night: '#0a1220', dusk: '#3a2a2a', dawn: '#5a5050' }[timeOfDay()] ?? '#6a8a78', transparent: true, opacity: 0.45, depthWrite: false }));
  haze.rotation.x = -Math.PI / 2; haze.position.y = DROP + 0.9; haze.raycast = () => {}; haze.renderOrder = 1;
  B.group.add(haze);
}

/** The connected platforms (decks and the Great Tree's, not the bridges): their tiles, and a trunk to stand each on. */
function platformsOf(town) {
  const kind = canopyKinds(town), seen = new Set(), out = [];
  const on = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && ['deck', 'plaza'].includes(kind(x, y));
  town.map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!on(x, y) || seen.has(key(x, y))) return;
    const tiles = [], q = [[x, y]];
    seen.add(key(x, y));
    while (q.length) {
      const [a, b] = q.pop();
      tiles.push([a, b]);
      for (const [dx, dy] of STEPS) if (on(a + dx, b + dy) && !seen.has(key(a + dx, b + dy))) { seen.add(key(a + dx, b + dy)); q.push([a + dx, b + dy]); }
    }
    const letters = new Set(tiles.map(([a, b]) => town.map[b][a]));
    const b = town.buildings.find(o => letters.has(o.at) && o.kind === 'greattree') ?? town.buildings.find(o => letters.has(o.at) && o.kind !== 'waystone');
    let ax, az;
    if (b) { const f = footprint(town.map, b.at); ax = f.cx; az = b.kind === 'greattree' ? f.cz : f.cz - f.h / 2 + 0.35; }
    else { ax = tiles.reduce((s, [a]) => s + tileX(a), 0) / tiles.length; az = tiles.reduce((s, [, b2]) => s + tileZ(b2), 0) / tiles.length; }
    out.push({ tiles, b, ax, az });
  }));
  return out;
}

/** What holds the town up: a trunk under each platform from the jungle floor, struts from its edges in to the trunk, a
    deep rim of boards round every edge; the rope bridges' posts, hand ropes sagging between them, netting down their sides
    and the ropes under their slats. */
function canopySupports(town) {
  const kind = canopyKinds(town), air = (x, y) => kind(x, y) === 'air';
  const rims = [], leafRims = [], struts = [], trunks = [];
  // one edge of a tile over the drop: its straight run, short of any rounded corner at either end, and that corner's arc
  // (a quarter turn: 1 south-east, 2 north-east, 3 north-west, 4 south-west, the arc's own start round the y axis)
  const edge = (out, x, y, dx, dy, col) => {
    const [ax, ay] = dx ? [0, 1] : [1, 0], round = (s) => air(x + ax * s, y + ay * s) && air(x + dx, y + dy);
    const lo = round(-1) ? ROUND : 0, hi = round(1) ? ROUND : 0, len = 1 - lo - hi, mid = (lo - hi) / 2;
    const at = [tileX(x) + dx * 0.47 + ax * mid, tileZ(y) + dy * 0.47 + ay * mid, 1, dx ? Math.PI / 2 : 0, col, 0];
    at.len = Math.round(len * 100) / 100;
    if (len > 0.01) out.push(at);
    for (const s of [-1, 1]) {
      if (!round(s) || dx) continue;   // each corner once, from its north or south edge
      const ex = dx || ax * s, ey = dy || ay * s;
      const q = ex > 0 ? (ey > 0 ? 1 : 2) : (ey > 0 ? 4 : 3);
      const c = [tileX(x) + ex * (0.5 - ROUND), tileZ(y) + ey * (0.5 - ROUND), 1, 0, col, 0];
      c.corner = q;
      out.push(c);
    }
  };
  const rails = [], railPosts = new Map();   // a rope railing round every deck where it drops away, so where you can walk reads at a glance
  const rail = (x, y, dx, dy) => {
    const [ax, ay] = dx ? [0, 1] : [1, 0], round = (s) => air(x + ax * s, y + ay * s) && air(x + dx, y + dy);
    const ex = tileX(x) + dx * 0.42, ez = tileZ(y) + dy * 0.42, lo = round(-1) ? ROUND : 0, hi = round(1) ? ROUND : 0;
    const a = [ex - ax * (0.5 - lo), ez - ay * (0.5 - lo)], b = [ex + ax * (0.5 - hi), ez + ay * (0.5 - hi)];
    for (const h of [0.46, 0.24]) rails.push([a[0], h, a[1], b[0], h, b[1]]);
    for (const [px, pz] of [a, b]) railPosts.set(`${px.toFixed(2)},${pz.toFixed(2)}`, [px, pz]);
    for (const s of [-1, 1]) {   // round a rounded corner in three bends, each corner once from its north or south edge
      if (!round(s) || dx) continue;
      const cx = tileX(x) + ax * s * (0.5 - ROUND), cz = tileZ(y) + dy * (0.5 - ROUND), r = ROUND - 0.08;
      const pt = (t) => [cx + Math.cos(t) * r * s, cz + Math.sin(t) * r * dy];
      for (let i = 0; i < 3; i++) { const p0 = pt(i / 3 * Math.PI / 2), p1 = pt((i + 1) / 3 * Math.PI / 2); for (const h of [0.46, 0.24]) rails.push([p0[0], h, p0[1], p1[0], h, p1[1]]); }
    }
  };
  for (const p of platformsOf(town)) {
    if (p.b?.kind !== 'greattree') trunks.push([p.ax, -0.06, p.az, p.tiles.length > 14 ? 0.5 : 0.36]);   // its top just under the planks: level with them it flickered through (the start deck, with no house over it)
    for (const [x, y] of p.tiles) for (const [dx, dy] of STEPS) {
      if (!air(x + dx, y + dy)) continue;
      edge(rims, x, y, dx, dy, null);
      rail(x, y, dx, dy);
      if ((x * 3 + y * 5) % 3 === 0) struts.push([tileX(x) + dx * 0.4, -0.3, tileZ(y) + dy * 0.4, p.ax + (tileX(x) - p.ax) * 0.15, -1.7, p.az + (tileZ(y) - p.az) * 0.15]);
    }
  }
  town.map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (kind(x, y) !== 'canopy') return;
    for (const [dx, dy] of STEPS) if (air(x + dx, y + dy)) edge(leafRims, x, y, dx, dy, CANOPY.leaf[(x + y) % 4]);
  }));
  const rimMat = std({ color: CANOPY.rim, roughness: 0.9 }), leafMat = std({ color: '#ffffff', roughness: 0.9, flatShading: true });
  for (const len of new Set(rims.filter(a => !a.corner).map(a => a.len))) {
    const rim = new THREE.BoxGeometry(len, 0.3, 0.08); rim.translate(0, -0.16, 0);
    instanced(rim, rimMat, rims.filter(a => !a.corner && a.len === len)).castShadow = false;
  }
  for (const len of new Set(leafRims.filter(a => !a.corner).map(a => a.len))) {
    const lr = new THREE.BoxGeometry(len, 0.5, 0.16); lr.translate(0, -0.22, 0);
    instanced(lr, leafMat, leafRims.filter(a => !a.corner && a.len === len)).castShadow = false;
  }
  for (let q = 0; q < 4; q++) {   // the curved rim round each rounded corner, a quarter turn of it per corner
    const arc = new THREE.CylinderGeometry(ROUND - 0.03, ROUND - 0.03, 0.3, 8, 1, true, q * Math.PI / 2, Math.PI / 2); arc.translate(0, -0.15, 0);
    instanced(arc, std({ color: CANOPY.rim, roughness: 0.9, side: THREE.DoubleSide }), rims.filter(a => a.corner === q + 1)).castShadow = false;
    const leafArc = new THREE.CylinderGeometry(ROUND - 0.04, ROUND - 0.04, 0.5, 8, 1, true, q * Math.PI / 2, Math.PI / 2); leafArc.translate(0, -0.22, 0);
    instanced(leafArc, std({ color: '#ffffff', roughness: 0.9, flatShading: true, side: THREE.DoubleSide }), leafRims.filter(a => a.corner === q + 1)).castShadow = false;
  }
  beams(struts, 0.07, std({ color: '#5a3c24', roughness: 0.9 }));
  for (const [x, y, z, r] of trunks) {
    const geo = new THREE.CylinderGeometry(r, r * 1.5, y - DROP, 12); geo.translate(0, (y + DROP) / 2, 0);
    mesh(geo, bark(), x, 0, z).raycast = () => {};
    const flare = mesh(new THREE.ConeGeometry(r * 2.4, 0.7, 12, 1, true), bark(), x, DROP + 0.35, z); flare.raycast = () => {};
  }
  // the rope bridges: along each run, a hand rope on each side where it isn't against a deck, posts, netting, ropes under
  const hands = [], under = [], posts = [], nets = [];
  const runs = [], axis = bridgeAxes(town);
  for (const horiz of [true, false]) {
    const seen = new Set(), goes = (a, b) => [horiz ? 'h' : 'v', 'x'].includes(axis(a, b));
    town.map.forEach((row, y) => [...row].forEach((ch, x) => {
      if (!goes(x, y) || seen.has(key(x, y))) return;
      const [dx, dy] = horiz ? [1, 0] : [0, 1];
      const tiles = [];
      let a = x, b = y;
      while (goes(a, b)) { tiles.push([a, b]); seen.add(key(a, b)); a += dx; b += dy; }
      if (tiles.length > 1 || axis(x, y) !== 'x') runs.push({ tiles, horiz });
    }));
  }
  for (const { tiles, horiz } of runs) {
    const [dx, dy] = horiz ? [1, 0] : [0, 1];
    for (const side of [-1, 1]) {
      const [sx, sy] = horiz ? [0, side] : [side, 0];
      let stretch = [];
      const flush = () => {
        if (!stretch.length) return;
        const [fx, fy] = stretch[0], [lx, ly] = stretch[stretch.length - 1];
        const a = [tileX(fx) - dx * 0.5 + sx * 0.38, 0, tileZ(fy) - dy * 0.5 + sy * 0.38];
        const b = [tileX(lx) + dx * 0.5 + sx * 0.38, 0, tileZ(ly) + dy * 0.5 + sy * 0.38];
        const len = stretch.length, sag = 0.05 + len * 0.025;
        sagging(hands, [a[0], 0.62, a[2]], [b[0], 0.62, b[2]], sag, Math.max(3, len * 2));
        sagging(hands, [a[0], 0.32, a[2]], [b[0], 0.32, b[2]], sag * 0.6, Math.max(3, len * 2));
        for (let i = 0; i <= len; i += Math.max(1, Math.min(2, len))) posts.push([a[0] + (b[0] - a[0]) * i / len, a[2] + (b[2] - a[2]) * i / len]);
        if (len % 2) posts.push([b[0], b[2]]);
        for (const [x, y] of stretch) nets.push([tileX(x) + sx * 0.38, tileZ(y) + sy * 0.38, 1, horiz ? 0 : Math.PI / 2, null, 0]);
        stretch = [];
      };
      for (const [x, y] of tiles) { if (air(x + sx, y + sy)) stretch.push([x, y]); else flush(); }
      flush();
    }
    const [fx, fy] = tiles[0], [lx, ly] = tiles[tiles.length - 1];
    for (const s of [-0.3, 0.3]) {
      const ox = horiz ? 0 : s, oz = horiz ? s : 0;
      sagging(under, [tileX(fx) - dx * 0.5 + ox, -0.04, tileZ(fy) - dy * 0.5 + oz], [tileX(lx) + dx * 0.5 + ox, -0.04, tileZ(ly) + dy * 0.5 + oz], 0, 1);
    }
  }
  const rope = std({ color: '#c8b080', roughness: 0.9 });
  beams(rails, 0.02, rope, { sides: 5, shadow: false });
  const railPost = new THREE.CylinderGeometry(0.03, 0.04, 0.55, 6); railPost.translate(0, 0.24, 0);
  instanced(railPost, std({ color: '#6a4a2c', roughness: 0.9 }), [...railPosts.values()].map(([x, z]) => [x, z, 1, 0]));
  beams(hands, 0.022, rope, { sides: 5, shadow: false });
  beams(under, 0.035, rope, { sides: 5 });
  const post = new THREE.CylinderGeometry(0.04, 0.05, 0.85, 6); post.translate(0, 0.32, 0);
  instanced(post, std({ color: '#6a4a2c', roughness: 0.9 }), posts.map(([x, z]) => [x, z, 1, 0]));
  const net = new THREE.PlaneGeometry(1, 0.6); net.translate(0, 0.32, 0);
  instanced(net, std({ map: texOf(netArt()), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 }), nets).castShadow = false;
  town.map.forEach((row, y) => [...row].forEach((ch, x) => { if (air(x, y)) B.blocked.add(key(x, y)); }));
}

/** A lone giant standing in the drop ('|'): a great trunk from the floor, bracket fungi up it (lit), a crown, vines. */
function loneGiant(x, z, rnd, lit) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  B.group.add(g);
  const r = 0.34 + rnd() * 0.14, tall = 2.2 + rnd() * 0.8;
  const geo = new THREE.CylinderGeometry(r * 0.8, r * 1.3, tall - DROP, 12); geo.translate(0, (tall + DROP) / 2, 0);
  mesh(geo, bark(), 0, 0, 0, g).raycast = () => {};
  const cap = std({ color: '#e8d8a0', emissive: new THREE.Color('#a8f070'), emissiveIntensity: 0.6, roughness: 0.6 });
  lit.push(cap);
  for (let i = 0; i < 3; i++) {
    const a = rnd() * Math.PI * 2, y = -1.6 + i * 1.1 + rnd() * 0.4;
    const m = mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.05, 10, 1, false, 0, Math.PI), cap, Math.cos(a) * r, y, Math.sin(a) * r, g);
    m.rotation.y = -a + Math.PI / 2; m.castShadow = false;
  }
  crown(g, 0, tall + 0.2, 0, 0.95 + rnd() * 0.3, rnd);
  const vines = [];
  for (let i = 0; i < 4; i++) { const a = rnd() * Math.PI * 2, vx = Math.cos(a) * 0.7, vz = Math.sin(a) * 0.7; vines.push([x + vx, tall, z + vz, x + vx * 1.1, tall - 1.2 - rnd() * 1.6, z + vz * 1.1]); }
  beams(vines, 0.025, std({ color: '#3e7a2e', roughness: 0.9 }), { sides: 4, shadow: false });
  return g;
}

/** A lift ('y'): a mast up from the jungle floor with a pulley arm, a basket on its rope going up and down. */
function lift(x, z, rnd) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  B.group.add(g);
  const wood = std({ color: '#6a4a2c', roughness: 0.9 }), rope = std({ color: '#c8b080', roughness: 0.9 });
  const geo = new THREE.CylinderGeometry(0.07, 0.09, 1.9 - DROP, 8); geo.translate(0, (1.9 + DROP) / 2, 0);
  mesh(geo, wood, -0.3, 0, 0, g);
  mesh(new THREE.BoxGeometry(0.7, 0.07, 0.07), wood, 0.02, 1.85, 0, g);
  const wheel = mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 14), wood, 0.3, 1.78, 0, g);
  const basket = new THREE.Group();
  g.add(basket);
  const weave = std({ color: '#b08850', roughness: 0.95 });
  mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.32, 12, 1, true), weave, 0, 0.16, 0, basket).material.side = THREE.DoubleSide;
  mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 12), weave, 0, 0.01, 0, basket);
  mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 16), wood, 0, 0.32, 0, basket).rotation.x = Math.PI / 2;
  basket.position.set(0.3, -1, 0);
  const line = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 4), rope, 0.3, 0, 0, g);
  line.castShadow = false;
  const k = rnd() * 20000;
  B.ticks.push((now) => {
    const t = calm ? 0.5 : ((now + k) % 24000) / 24000;   // up, a wait at the top, down, a wait below
    const h = t < 0.3 ? t / 0.3 : t < 0.5 ? 1 : t < 0.8 ? 1 - (t - 0.5) / 0.3 : 0;
    const y = DROP + 0.3 + ease(h) * (-0.1 - DROP - 0.3);
    basket.position.y = y;
    line.scale.y = 1.78 - y - 0.32; line.position.y = (1.78 + y + 0.32) / 2;
    wheel.rotation.z = y * 3;
  });
  return g;
}

/** Leaf shingles, overlapping rows of them, for the treehouses' roofs (the cap over them is the house's colour). */
function shinglesArt() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), r = seeded(29);
  g.fillStyle = '#2e5a22'; g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 72; y += 8) for (let x = -8 + (y / 8 % 2) * 4; x < 72; x += 8) {
    g.fillStyle = ['#4e9a3a', '#3e8a30', '#5aaa44', '#468e36'][Math.floor(r() * 4)];
    g.beginPath(); g.ellipse(x, y, 4.6, 6, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(20,50,16,0.5)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x, y + 5); g.stroke();
  }
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** Round logs laid up a wall, for the treehouses' sides and backs. */
function logsArt(dark = false) {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 64;
  const g = c.getContext('2d'), r = seeded(dark ? 5 : 31);
  for (let y = 0; y < 64; y += 8) {
    const l = g.createLinearGradient(0, y, 0, y + 8), base = dark ? ['#4a3a4a', '#3a2c3a', '#241a24'] : ['#b08058', '#946640', '#5a3a22'];
    l.addColorStop(0, base[0]); l.addColorStop(0.55, base[1]); l.addColorStop(1, base[2]);
    g.fillStyle = l; g.fillRect(0, y, 32, 8);
    g.fillStyle = 'rgba(0,0,0,0.2)'; for (let i = 0; i < 3; i++) g.fillRect(r() * 32, y + 2 + r() * 4, 4 + r() * 8, 0.6);
  }
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** A round window for a hut: a log frame, its panes lit, a cross of bars, shutters in the house's colour. */
function hutWindowArt(col, glow) {
  const f = fine(28, 20, 8), { g, rr } = f, s = f.shine();
  for (const x of [0.5, 21.5]) {
    rr(x, 2.5, 6, 15, 1, col);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 2.7, 3.5, 0.6, 13); g.fillRect(x + 0.8, 9.6, 4.4, 0.8);
  }
  g.fillStyle = '#4a2e1c'; g.beginPath(); g.arc(14, 10, 8.8, 0, Math.PI * 2); g.fill();
  for (const ctx of [g, s]) {
    const rg = ctx.createRadialGradient(14, 10, 0, 14, 10, 7.2);
    rg.addColorStop(0, glow[0]); rg.addColorStop(1, glow[1]);
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(14, 10, 7.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ctx === s ? '#000' : '#4a2e1c'; ctx.fillRect(13.6, 2.8, 0.8, 14.4); ctx.fillRect(6.8, 9.6, 14.4, 0.8);
  }
  return f.c;
}

/** A hut's door: round-topped, planks painted its colour, a gold knob, a little round window lit in it. */
function hutDoorArt(col, glow) {
  const f = fine(20, 34, 8), { g, lin } = f, s = f.shine();
  g.fillStyle = '#3a2414'; g.beginPath(); g.roundRect(0, 0, 20, 34, [10, 10, 0, 0]); g.fill();
  g.fillStyle = lin(2, 0, 18, 0, [shadeOf(col, -1), col, shadeOf(col, -1)]); g.beginPath(); g.roundRect(1.6, 1.6, 16.8, 32.4, [8.4, 8.4, 0, 0]); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.22)'; for (let x = 5.6; x < 17; x += 4) g.fillRect(x, 3, 0.5, 31);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(1.6, 16, 16.8, 1.2); g.fillRect(1.6, 27, 16.8, 1.2);
  g.fillStyle = '#3a2414'; g.beginPath(); g.arc(10, 9, 4.4, 0, Math.PI * 2); g.fill();
  for (const ctx of [g, s]) {
    const rg = ctx.createRadialGradient(10, 9, 0, 10, 9, 3.3);
    rg.addColorStop(0, glow[0]); rg.addColorStop(1, glow[1]);
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(10, 9, 3.3, 0, Math.PI * 2); ctx.fill();
  }
  g.fillStyle = '#e8c050'; g.beginPath(); g.arc(15, 21, 1.1, 0, Math.PI * 2); g.fill();
  return f.c;
}

/** A hut on its platform, Fortree's: round log walls built round its tree, a porch railed all round but for the door,
    a round-topped door and round windows with shutters and flower boxes in its colour, a flared cone of leaf shingles
    banded in its colour, its tree coming out of the top into a crown high over it, moss hanging off the eaves, a lantern
    by the door (the user's ask, 2026-10-14: the square treehouses were "lame"). The shop has an awning and its sign; a
    house with `tree: false` a spire instead of a tree. A Gym Leader's is grand (`canopyManor()`). A tap is its door. */
function treehouse(b, f, L, lit) {
  const leader = b.home && B.town?.homes?.[b.home]?.leader;
  if (leader) return canopyManor(b, f, L, lit, leader);
  const g = new THREE.Group(), rnd = seeded(b.id.charCodeAt(0) * 7), z0 = -0.15;
  g.position.set(f.cx, 0, f.cz + z0);
  B.group.add(g);
  const rx = (f.w - 1.0) / 2, rz = (f.h - 1.1) / 2, h = 1.35, base = 0.12, tree = b.tree !== false;
  const wx = (x) => f.cx + x, wz = (z) => f.cz + z0 + z;
  const wood = std({ color: '#7a5232', roughness: 0.9 }), rim = std({ color: CANOPY.rim, roughness: 0.9 });
  const glow = ['#fff4c8', '#f8a040'];
  // the porch: a ring of planks round the hut, railed but for the way in
  const px = rx + 0.38, pz = rz + 0.38;
  mesh(new THREE.CylinderGeometry(1, 1, base, 28), [rim, std({ color: CANOPY.deck[0], roughness: 0.9 }), rim], 0, base / 2, 0, g).scale.set(px, 1, pz);
  const N = 16, post = new THREE.CylinderGeometry(0.035, 0.04, 0.5, 6), rails = [], kept = [];
  for (let i = 0; i <= N; i++) {
    const a = i / N * Math.PI * 2, open = Math.cos(a) > 0.95;
    kept.push(open ? null : [(px - 0.07) * Math.sin(a), (pz - 0.07) * Math.cos(a)]);
    if (!open && i < N) mesh(post, wood, kept[i][0], base + 0.25, kept[i][1], g).castShadow = false;
  }
  for (let i = 0; i < N; i++) {
    const p = kept[i], q = kept[i + 1];
    if (!p || !q) continue;
    for (const y of [base + 0.27, base + 0.48]) rails.push([wx(p[0]), y, wz(p[1]), wx(q[0]), y, wz(q[1])]);
  }
  beams(rails, 0.022, wood, { sides: 5, shadow: false });
  // the walls: round logs all the way round
  const sides = logsArt(); sides.repeat.set(Math.round((rx + rz) * 2.5), h);
  mesh(new THREE.CylinderGeometry(1, 1, h, 28, 1, true), std({ map: sides, roughness: 0.95 }), 0, base + h / 2, 0, g).scale.set(rx, 1, rz);
  const onWall = (t, y, o, geo, m) => {   // set on the wall at angle t, facing out
    const nx = Math.sin(t) / rx, nz = Math.cos(t) / rz, n = Math.hypot(nx, nz);
    const p = mesh(geo, m, rx * Math.sin(t) + nx / n * o, y, rz * Math.cos(t) + nz / n * o, g);
    p.rotation.y = Math.atan2(nx, nz); p.castShadow = false;
    return p;
  };
  const art = (c) => { const m = std({ map: texOf(c), transparent: true, alphaTest: 0.4, emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(c.glow), emissiveIntensity: 0.6, roughness: 0.85 }); lit.push(m); return m; };
  onWall(0, base + 0.5, 0.045, new THREE.PlaneGeometry(0.56, 0.95), art(hutDoorArt(b.roof, glow)));
  const win = art(hutWindowArt(b.roof, glow));
  const box = std({ color: shadeOf(b.roof, -1), roughness: 0.8 }), soil = std({ color: '#3a2a1a', roughness: 1 });
  const blooms = ['#f84a8a', '#f8d040', '#ffffff', '#b070f0'].map(c => std({ color: c, roughness: 0.6 }));
  for (const s of [-1, 1]) {
    const t = s * 0.8;
    onWall(t, base + 0.82, 0.05, new THREE.PlaneGeometry(0.6, 0.43), win);
    const fb = onWall(t, base + 0.56, 0.1, new THREE.BoxGeometry(0.4, 0.09, 0.12), box);   // a flower box under it
    mesh(new THREE.BoxGeometry(0.36, 0.02, 0.09), soil, 0, 0.045, 0, fb);
    for (let k = 0; k < 4; k++) mesh(new THREE.SphereGeometry(0.035 + rnd() * 0.015, 8, 6), blooms[(k + (s > 0 ? 1 : 0)) % 4], -0.14 + k * 0.095, 0.08, (rnd() - 0.5) * 0.04, fb).castShadow = false;
  }
  // the roof: a flared cone of leaf shingles, banded in its colour where it meets the walls
  const ex = rx + 0.55, ez = rz + 0.55, rh = 1.2, ry = base + h - 0.04, top = tree ? 0.3 : 0;
  const shingles = shinglesArt(); shingles.repeat.set(Math.round((ex + ez) * 2.4), 2);
  const leafRoof = std({ map: shingles, roughness: 0.95 });
  mesh(new THREE.CylinderGeometry(top / Math.min(ex, ez), 0.92, rh, 28, 1, true), leafRoof, 0, ry + 0.16 + rh / 2, 0, g).scale.set(ex, 1, ez);
  mesh(new THREE.CylinderGeometry(0.92, 1, 0.2, 28, 1, true), leafRoof, 0, ry + 0.06, 0, g).scale.set(ex, 1, ez);
  const band = std({ color: b.roof, roughness: 0.6 });
  const ring = mesh(new THREE.TorusGeometry(1, 0.05, 6, 40), band, 0, ry - 0.04, 0, g);
  ring.rotation.x = Math.PI / 2; ring.scale.set(ex, ez, 1); ring.castShadow = false;
  const crestTop = ry + 0.16 + rh;
  if (tree) {   // its tree, out through the top of the roof into a crown high over it
    const tall = crestTop + 1.2;
    const trunk = new THREE.CylinderGeometry(0.24, 0.32, tall, 12); trunk.translate(0, tall / 2, 0);
    mesh(trunk, bark(), 0, 0, 0, g).raycast = () => {};
    const collar = mesh(new THREE.TorusGeometry(0.29, 0.05, 6, 18), band, 0, crestTop, 0, g);
    collar.rotation.x = Math.PI / 2; collar.castShadow = false;
    for (const s of [-1, 1]) {
      const bough = new THREE.CylinderGeometry(0.05, 0.1, 0.9, 7); bough.translate(0, 0.45, 0);
      const m = mesh(bough, bark(), s * 0.1, tall - 0.4, 0, g); m.rotation.z = -s * 0.9; m.raycast = () => {};
    }
    crown(g, 0, tall + 0.35, -0.1, 0.9 + rnd() * 0.15, rnd);
  } else {   // a spire in its colour
    mesh(new THREE.SphereGeometry(0.1, 12, 8), band, 0, crestTop + 0.02, 0, g);
    mesh(new THREE.ConeGeometry(0.04, 0.35, 8), std({ color: '#e8b040', metalness: 0.7, roughness: 0.3 }), 0, crestTop + 0.25, 0, g).castShadow = false;
  }
  // moss hanging off the eaves, none over the door
  const moss = [];
  for (let i = 0; i < 14; i++) {
    const a = (i + rnd() * 0.6) / 14 * Math.PI * 2;
    if (Math.cos(a) > 0.8) continue;
    const x = wx(Math.sin(a) * ex * 0.98), z = wz(Math.cos(a) * ez * 0.98), y = ry - 0.02;
    moss.push([x, y, z, x + (rnd() - 0.5) * 0.04, y - 0.18 - rnd() * 0.3, z]);
  }
  beams(moss, 0.02, std({ color: '#3e6a2e', roughness: 1 }), { taper: 0.3, sides: 4, shadow: false });
  if (b.kind === 'shop') {   // a striped awning over the door, a basket of fruit by it
    const stripes = document.createElement('canvas'); stripes.width = 16; stripes.height = 2;
    const sg = stripes.getContext('2d'); for (let x = 0; x < 16; x += 4) { sg.fillStyle = x % 8 ? '#f8f0e0' : b.roof; sg.fillRect(x, 0, 4, 2); }
    const sm = new THREE.CanvasTexture(stripes); sm.colorSpace = THREE.SRGBColorSpace; sm.repeat.set(1, 1); sm.wrapS = THREE.RepeatWrapping;
    const awning = mesh(new THREE.PlaneGeometry(1.0, 0.45), std({ map: sm, roughness: 0.8, side: THREE.DoubleSide }), 0, base + 1.08, rz + 0.18, g);
    awning.rotation.x = -1.0; awning.castShadow = false;
    for (let i = 0; i < 4; i++) mesh(new THREE.SphereGeometry(0.07, 8, 6), std({ color: ['#f84a5a', '#f8c040', '#70c050', '#f89040'][i], roughness: 0.5 }), 0.62 - (i % 2) * 0.12, base + 0.1 + Math.floor(i / 2) * 0.1, rz + 0.22, g).castShadow = false;
  }
  // a lantern on a bracket by the door
  const lamp = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.8, roughness: 0.6 });
  lit.push(lamp);
  const lx = 0.48, lz = rz * Math.sqrt(Math.max(0, 1 - (lx / rx) ** 2));
  mesh(new THREE.BoxGeometry(0.03, 0.03, 0.2), wood, lx, base + 1.08, lz + 0.08, g).castShadow = false;
  mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.18, 8), lamp, lx, base + 0.96, lz + 0.17, g).castShadow = false;
  return g;
}

/** A Gym Leader's treehouse front: logs, double doors in the house's colour under a lit fanlight, tall windows lit
    either side, a gold frieze along the top. Phil's: dark logs, pointed windows lit violet, one boarded over, a cobweb.
    `door: false` for an upper storey, its windows spread along it. */
function grandFront(w, h, col, haunted, door = true) {
  const W = Math.round(w * 20), Hh = Math.round(h * 20), f = fine(W, Hh, 6), { g, lin } = f, s = f.shine();
  for (let y = 0; y < Hh; y += 4) {
    g.fillStyle = lin(0, y, 0, y + 4, haunted ? ['#4a3a4a', '#3a2c3a', '#241a24'] : ['#b88a60', '#9a6c44', '#5e3c22']);
    g.fillRect(0, y, W, 4);
  }
  const glow = haunted ? ['#f0d0ff', '#a050f0'] : ['#fff4c8', '#f8a040'], frame = haunted ? '#1a121a' : '#4a2e1c', mid = W / 2;
  const arch = (ctx, x, y, ww, hh) => {
    ctx.beginPath();
    if (haunted) { ctx.moveTo(x, y + hh); ctx.lineTo(x, y + ww * 0.5); ctx.quadraticCurveTo(x, y, x + ww / 2, y - ww * 0.35); ctx.quadraticCurveTo(x + ww, y, x + ww, y + ww * 0.5); ctx.lineTo(x + ww, y + hh); ctx.closePath(); }
    else ctx.roundRect(x, y, ww, hh, [ww / 2, ww / 2, 0.6, 0.6]);
  };
  const pane = (x, y, ww, hh) => {
    g.fillStyle = frame; arch(g, x - 1.2, y - 1.2, ww + 2.4, hh + 2.4); g.fill();
    for (const ctx of [g, s]) {
      const rg = ctx.createRadialGradient(x + ww / 2, y + hh / 2, 0, x + ww / 2, y + hh / 2, hh * 0.7);
      rg.addColorStop(0, glow[0]); rg.addColorStop(1, glow[1]);
      ctx.fillStyle = rg; arch(ctx, x, y, ww, hh); ctx.fill();
      ctx.fillStyle = ctx === s ? '#000' : frame; ctx.fillRect(x + ww / 2 - 0.3, y - 1, 0.6, hh + 1); ctx.fillRect(x, y + hh * 0.55, ww, 0.6);
    }
  };
  const top = haunted ? 8 : 6, wh = Hh - top - 9;
  const n = Math.max(2, Math.floor(W / 15));
  const spots = door ? [mid - 27, mid - 17, mid + 10, mid + 20] : Array.from({ length: n }, (_, i) => (i + 0.5) * W / n - 3.5);
  for (const x of spots) pane(x, top, 7, wh);
  if (door) {   // the double doors under a fanlight
    g.fillStyle = frame; g.beginPath(); g.roundRect(mid - 7.6, 5.4, 15.2, Hh - 5.4, [7.6, 7.6, 0, 0]); g.fill();
    for (const ctx of [g, s]) {
      const rg = ctx.createRadialGradient(mid, 12, 0, mid, 12, 6);
      rg.addColorStop(0, glow[0]); rg.addColorStop(1, glow[1]);
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(mid, 12.6, 6.2, Math.PI, 0); ctx.fill();
      ctx.fillStyle = ctx === s ? '#000' : frame; for (const a of [-0.5, 0, 0.5]) ctx.fillRect(mid + Math.sin(a) * 3 - 0.3, 7, 0.6, 5.6);
    }
    g.fillStyle = lin(mid - 6.2, 0, mid + 6.2, 0, [shadeOf(col, -1), col, shadeOf(col, 1), col, shadeOf(col, -1)]); g.fillRect(mid - 6.2, 13.4, 12.4, Hh - 13.4);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(mid - 0.3, 13.4, 0.6, Hh - 13.4);
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 0.5; for (const dx of [-5, 0.8]) g.strokeRect(mid + dx, 15.5, 4.2, Hh - 18);
    g.fillStyle = '#e8c050'; for (const dx of [-1.4, 1.4]) { g.beginPath(); g.arc(mid + dx, Hh - 8, 0.8, 0, Math.PI * 2); g.fill(); }
  }
  g.fillStyle = '#e8b040'; g.fillRect(0, 0.6, W, 1.3);
  for (let x = 3; x < W; x += 6) { g.beginPath(); g.arc(x, 3.2, 0.7, 0, Math.PI * 2); g.fill(); }
  if (haunted) {   // a window boarded over, a cobweb in the corner
    const bx = spots[spots.length - 1] + 3.5, by = top + wh / 2;
    g.fillStyle = '#6a5040'; g.save(); g.translate(bx, by); g.rotate(0.4); g.fillRect(-6, -1, 12, 2); g.rotate(-0.8); g.fillRect(-6, -1, 12, 2); g.restore();
    g.strokeStyle = 'rgba(240,240,250,0.7)'; g.lineWidth = 0.35;
    for (let i = 0; i < 4; i++) { const a = i / 3 * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); g.stroke(); }
    for (const rad of [2.5, 4.8, 7]) { g.beginPath(); g.arc(0, 0, rad, 0, Math.PI / 2); g.stroke(); }
  }
  return f.c;
}

/** A Gym Leader's home in Highbough (the user's ask, 2026-10-14: grand, like Lantern Village's manors, in the town's own
    style): a two-storey treehouse on a podium of planks railed round and up a flight of steps, a log hall with a veranda
    of posts on gold collars under a leaf-shingle roof, a gable over the steps with the leader's crest, the hall's roof a
    terrace railed in the leader's colour, banners at the front and lanterns at the steps. Ricky's is built round a living
    tree: a round den up top, its band of windows cycling his monitors' colours, a dish and an aerial, fairy lights strung
    to the banners, the tree out of its roof into a crown. Phil's is dark and crooked: windows lit violet, a steep gabled
    upper storey leaning a little, a witch-hat turret, a dead tree up through the terrace hung with violet lanterns,
    candles on the steps. Its lot is 5 x 4 tiles. A tap anywhere is its door. */
function canopyManor(b, f, L, lit, leader) {
  const haunted = b.kind === 'haunted', g = new THREE.Group(), rnd = seeded(b.id.charCodeAt(0) * 13);
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const ink = LEADER_INK[leader] || ['#e0f0d0', '#2e7a3a', '#0e2a12'], letter = (b.name || leader)[0].toUpperCase();
  const W = f.w - 0.3, D = f.h - 0.3, P = 0.4;
  const wx = (x) => f.cx + x, wz = (z) => f.cz + z, small = (m) => { m.castShadow = false; return m; };
  const wood = std({ color: haunted ? '#3a2c34' : '#7a5232', roughness: 0.9 }), dark = std({ color: haunted ? '#1a121a' : '#3a2414', roughness: 0.8 });
  const planks = std({ color: haunted ? '#5a4a52' : CANOPY.deck[0], roughness: 0.9 }), rim = std({ color: haunted ? '#2a1e26' : CANOPY.rim, roughness: 0.9 });
  const gold = std({ color: '#e8b040', metalness: 0.75, roughness: 0.28, emissive: new THREE.Color('#7a4a10'), emissiveIntensity: 0.35 });
  const inked = std({ color: ink[1], roughness: 0.7 });
  const logWall = (u, v) => { const t = logsArt(haunted); t.repeat.set(u, v); return std({ map: t, roughness: 0.95 }); };
  const leafy = (u, v) => { const t = shinglesArt(); t.repeat.set(u, v); return std({ map: t, color: haunted ? '#8a7a9a' : '#ffffff', roughness: 0.95 }); };
  const lights = (art) => { const m = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.9 }); lit.push(m); return m; };
  const glowOf = (col, emit) => std({ color: col, emissive: new THREE.Color(emit), emissiveIntensity: 0.9, roughness: 0.6 });
  const flicker = (m, k = 0) => B.ticks.push((now) => { if (!calm) m.emissiveIntensity = Math.sin(now / 230 + k) * Math.sin(now / 1700 + k * 3) > 0.6 ? 0.25 : 1.1; });
  // the podium: planks on a dark rim, gold along its front, steps up to it, a railing round it but for the steps
  mesh(rbox(W, P - 0.06, D, 0.06), rim, 0, (P - 0.06) / 2, 0, g);
  mesh(rbox(W - 0.08, 0.07, D - 0.08, 0.02), planks, 0, P - 0.035, 0, g);
  small(mesh(new THREE.BoxGeometry(W + 0.02, 0.05, 0.03), gold, 0, P - 0.12, D / 2 + 0.01, g));
  for (let i = 0; i < 3; i++) mesh(rbox(1.5 - i * 0.06, P / 3, 0.2, 0.02), planks, 0, P / 6 + i * P / 3, D / 2 + 0.36 - i * 0.18, g);
  const hx = W / 2 - 0.08, hz = D / 2 - 0.08, rails = [];
  const fence = [[-0.95, hz], [-hx, hz], [-hx, -hz], [hx, -hz], [hx, hz], [0.95, hz]];
  for (let i = 0; i < fence.length - 1; i++) {
    const [ax, az] = fence[i], [bx, bz] = fence[i + 1], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 0.55));
    for (const y of [P + 0.24, P + 0.44]) rails.push([wx(ax), y, wz(az), wx(bx), y, wz(bz)]);
    for (let k = 0; k <= n; k++) {
      const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n;
      small(mesh(new THREE.BoxGeometry(0.06, 0.48, 0.06), wood, x, P + 0.24, z, g));
      if (k === 0 || k === n) small(mesh(new THREE.SphereGeometry(0.045, 10, 8), gold, x, P + 0.5, z, g));
    }
  }
  beams(rails, 0.022, wood, { sides: 5, shadow: false });
  // the hall: log walls, its lit front, thick log posts at the corners, a gold frieze along the top
  const hw = W - 0.9, hd = 2.0, hz0 = -0.45, H = 1.45, top = P + H, fz = hz0 + hd / 2;
  const side = logWall(hd / 1.2, H), back = logWall(hw / 1.2, H);
  mesh(new THREE.BoxGeometry(hw, H, hd), [side, side, dark, dark, lights(grandFront(hw, H, b.roof, haunted)), back], 0, P + H / 2, hz0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(new THREE.CylinderGeometry(0.11, 0.12, H + 0.04, 10), wood, sx * hw / 2, P + H / 2, hz0 + sz * hd / 2, g);
  // the veranda: posts on gold collars, a beam, a leaf-shingle roof sloping down to it, lanterns in the leader's colours
  const vz = fz + 0.7, vh = H - 0.4, vy = P + vh;
  for (const x of [-(hw / 2 + 0.05), -0.75, 0.75, hw / 2 + 0.05]) {
    mesh(new THREE.CylinderGeometry(0.07, 0.08, vh, 10), wood, x, P + vh / 2, vz, g);
    for (const y of [P + 0.03, vy - 0.05]) small(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), gold, x, y, vz, g));
  }
  mesh(rbox(hw + 0.4, 0.14, 0.16, 0.03), wood, 0, vy + 0.07, vz, g);
  small(mesh(new THREE.BoxGeometry(hw + 0.42, 0.035, 0.02), gold, 0, vy + 0.02, vz + 0.09, g));
  const slopeZ = vz + 0.2 - fz, slopeY = top + 0.02 - (vy + 0.16), len = Math.hypot(slopeZ, slopeY);
  const pent = mesh(new THREE.BoxGeometry(hw + 0.5, 0.07, len), leafy((hw + 0.5) / 1.2, len), 0, (top + 0.02 + vy + 0.16) / 2, (fz + vz + 0.2) / 2, g);
  pent.rotation.x = Math.atan2(slopeY, slopeZ);
  small(mesh(new THREE.BoxGeometry(hw + 0.52, 0.05, 0.05), gold, 0, vy + 0.15, vz + 0.22, g));
  const paper = haunted ? glowOf('#8040c0', '#b060ff') : glowOf(ink[1], ink[0]);
  if (!haunted) lit.push(paper); else flicker(paper);
  for (const sx of [-1, 1]) {
    const x = sx * 1.4;
    small(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), dark, x, vy - 0.08, vz, g));
    const ball = small(mesh(new THREE.SphereGeometry(0.14, 16, 12), paper, x, vy - 0.32, vz, g));
    ball.scale.y = 1.3;
    for (const dy of [-0.18, 0.18]) small(mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 12), dark, x, vy - 0.32 + dy, vz, g));
  }
  // a gable over the steps, its roof in leaf shingles, the leader's crest on gold in it, their name hung under the beam
  const gr = haunted ? 0.78 : 0.56, gw = 0.78, gy = vy + 0.15, gz = vz + 0.22;
  const tri = new THREE.Shape(); tri.moveTo(-gw, 0); tri.lineTo(0, gr); tri.lineTo(gw, 0); tri.closePath();
  small(mesh(new THREE.ShapeGeometry(tri), inked, 0, gy, gz, g));
  const pitch = Math.atan2(gr, gw), plen = Math.hypot(gr, gw) + 0.14;
  for (const s of [-1, 1]) {
    const slab = mesh(new THREE.BoxGeometry(plen, 0.07, 0.75), leafy(plen / 1.2, 0.6), s * gw / 2, gy + gr / 2 + 0.05, gz - 0.3, g);
    slab.rotation.z = -s * pitch;
    small(mesh(new THREE.BoxGeometry(plen, 0.05, 0.04), gold, s * gw / 2, gy + gr / 2 + 0.02, gz + 0.08, g)).rotation.z = -s * pitch;
  }
  small(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24), gold, 0, gy + gr * 0.4, gz + 0.02, g)).rotation.x = Math.PI / 2;
  g.attach(panel(houseCrest('ink', ink, letter), 0.36, 0.36, wx(0), gy + gr * 0.4, wz(gz + 0.04)));
  small(mesh(new THREE.SphereGeometry(0.06, 10, 8), gold, 0, gy + gr + 0.1, gz + 0.04, g));
  // the hall's roof a terrace, railed in the leader's colour, gold knobs on its posts
  mesh(rbox(hw + 0.24, 0.12, hd + 0.24, 0.03), rim, 0, top + 0.06, hz0, g);
  const ty = top + 0.12, tf = fz + 0.06, tb = hz0 - hd / 2 - 0.06, trail = [];
  for (const [ax, az, bx, bz] of [[-hw / 2 - 0.06, tf, hw / 2 + 0.06, tf], [-hw / 2 - 0.06, tf, -hw / 2 - 0.06, tb], [hw / 2 + 0.06, tf, hw / 2 + 0.06, tb]]) {
    for (const y of [ty + 0.2, ty + 0.38]) trail.push([wx(ax), y, wz(az), wx(bx), y, wz(bz)]);
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 0.6));
    for (let k = 0; k <= n; k++) {
      const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n;
      small(mesh(new THREE.BoxGeometry(0.06, 0.42, 0.06), inked, x, ty + 0.21, z, g));
      small(mesh(new THREE.SphereGeometry(0.045, 10, 8), gold, x, ty + 0.45, z, g));
    }
  }
  beams(trail, 0.02, inked, { sides: 5, shadow: false });
  if (haunted) {
    // the upper storey, leaning a little, under a steep roof with its gable to you, a round window lit in the gable
    const uw = 2.3, ud = 1.4, uh = 1.15, up = new THREE.Group();
    up.position.set(-0.45, ty, hz0 - 0.2); up.rotation.z = 0.035;
    g.add(up);
    const uside = logWall(ud / 1.2, uh);
    mesh(new THREE.BoxGeometry(uw, uh, ud), [uside, uside, dark, dark, lights(grandFront(uw, uh, b.roof, true, false)), uside], 0, uh / 2, 0, up);
    const rise = 1.25, geo = new THREE.ExtrudeGeometry(gableShape(uw / 2 + 0.25, rise, 0.1), { depth: ud + 0.5, bevelEnabled: false });
    geo.translate(0, 0, -(ud + 0.5) / 2);
    mesh(geo, [leafy(1, 1), dark], 0, uh, 0, up);
    const gable = new THREE.Shape(); gable.moveTo(-uw / 2, 0); gable.lineTo(0, rise - 0.12); gable.lineTo(uw / 2, 0); gable.closePath();
    small(mesh(new THREE.ShapeGeometry(gable), dark, 0, uh, ud / 2 + 0.005, up));
    const eye = glowOf('#a050f0', '#c070ff');
    flicker(eye, 2);
    small(mesh(new THREE.CircleGeometry(0.2, 20), eye, 0, uh + 0.42, ud / 2 + 0.02, up));
    small(mesh(new THREE.TorusGeometry(0.21, 0.03, 6, 20), gold, 0, uh + 0.42, ud / 2 + 0.03, up));
    for (const s of [-1, 1]) small(mesh(new THREE.BoxGeometry(Math.hypot(uw / 2 + 0.25, rise) + 0.05, 0.06, 0.04), gold, s * (uw / 4 + 0.12), uh + rise / 2 - 0.02, ud / 2 + 0.26, up)).rotation.z = -s * Math.atan2(rise, uw / 2 + 0.25);
    small(mesh(new THREE.ConeGeometry(0.04, 0.4, 8), gold, 0, uh + rise + 0.2, ud / 2 + 0.2, up));
    // a witch-hat turret at the front corner, its window flickering violet
    const tx = hw / 2 - 0.4, tz = fz - 0.45, th = 1.75, tr = 0.4;
    mesh(new THREE.CylinderGeometry(tr, tr + 0.04, th, 16), logWall(2.5, th), tx, ty + th / 2, tz, g);
    const slit = glowOf('#a050f0', '#c070ff');
    flicker(slit, 5);
    const win = new THREE.Shape(); win.moveTo(-0.09, 0); win.lineTo(-0.09, 0.3); win.quadraticCurveTo(0, 0.48, 0.09, 0.3); win.lineTo(0.09, 0); win.closePath();
    small(mesh(new THREE.ShapeGeometry(win), slit, tx, ty + th - 0.75, tz + tr + 0.02, g));
    small(mesh(new THREE.TorusGeometry(tr + 0.05, 0.035, 6, 24), gold, tx, ty + th, tz, g)).rotation.x = Math.PI / 2;
    const hat = new THREE.Group();
    hat.position.set(tx, ty + th, tz); hat.rotation.set(-0.06, 0, -0.14);
    g.add(hat);
    const tip = new THREE.ConeGeometry(0.62, 1.55, 18); tip.translate(0, 0.775, 0);
    mesh(tip, leafy(2, 1.4), 0, 0, 0, hat);
    small(mesh(new THREE.SphereGeometry(0.06, 10, 8), gold, 0, 1.6, 0, hat));
    small(mesh(new THREE.TorusGeometry(0.1, 0.022, 6, 16, Math.PI * 1.3), gold, 0, 1.78, 0, hat)).rotation.z = 0.9;
    // a dead tree up through the terrace, bare, violet lanterns hung off its boughs
    const dx = 1.15, dz = hz0 - 0.55, tall = ty + 2.6;
    const trunk = new THREE.CylinderGeometry(0.11, 0.24, tall, 9); trunk.translate(0, tall / 2, 0);
    const dead = std({ color: '#4a3e44', roughness: 1 });
    mesh(trunk, dead, dx, 0, dz, g).rotation.z = -0.05;
    const boughs = [], hang = [], lamp = glowOf('#8040c0', '#b060ff');
    flicker(lamp, 7);
    for (let i = 0; i < 6; i++) {
      const a = i * 2.2 + 0.4, y0 = ty + 0.9 + i * 0.28, l = 0.7 + rnd() * 0.5;
      const ax = wx(dx + 0.02 * i), az = wz(dz), bx = ax + Math.cos(a) * l, bz = az + Math.sin(a) * l * 0.7, by = y0 + 0.35 + rnd() * 0.3;
      boughs.push([ax, y0, az, bx, by, bz]);
      boughs.push([bx, by, bz, bx + Math.cos(a + 0.6) * 0.3, by + 0.25, bz + Math.sin(a + 0.6) * 0.2]);
      if (i % 2) {
        hang.push([bx, by, bz, bx, by - 0.35, bz]);
        small(mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.15, 8), lamp, bx - f.cx, by - 0.43, bz - f.cz, g));
      }
    }
    beams(boughs, 0.05, dead, { taper: 0.45, sides: 6 });
    beams(hang, 0.008, dark, { sides: 4, shadow: false });
    // candles on the steps, guttering
    const wax = std({ color: '#efe6d0', roughness: 0.8 }), flame = glowOf('#ffd890', '#ffb040');
    flicker(flame, 11);
    for (const [x, i] of [[-0.62, 0], [0.62, 0], [-0.55, 1], [0.58, 2]]) {
      const y = P / 3 * (i + 1), z = D / 2 + 0.36 - i * 0.18;
      small(mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1 + i * 0.03, 8), wax, x, y + 0.05, z, g));
      small(mesh(new THREE.SphereGeometry(0.02, 8, 6), flame, x, y + 0.14 + i * 0.03, z, g)).scale.y = 1.6;
    }
  } else {
    // a round den up top built round the living tree, its band of windows cycling his monitors' colours
    const dz = hz0 - 0.15, dr = 0.85, dh = 1.2;
    mesh(new THREE.CylinderGeometry(dr, dr, dh, 28, 1, true), logWall(5, dh), 0, ty + dh / 2, dz, g);
    const screen = std({ color: '#203050', emissive: new THREE.Color('#40a0ff'), emissiveIntensity: 1, roughness: 0.3 });
    small(mesh(new THREE.CylinderGeometry(dr + 0.012, dr + 0.012, 0.4, 28, 1, true, -1.05, 2.1), screen, 0, ty + 0.66, dz, g));
    for (let k = 0; k < 5; k++) {
      const a = -1.05 + k * 0.525;
      small(mesh(new THREE.BoxGeometry(0.05, 0.46, 0.05), dark, (dr + 0.02) * Math.sin(a), ty + 0.66, dz + (dr + 0.02) * Math.cos(a), g)).rotation.y = a;
    }
    const sill = small(mesh(new THREE.TorusGeometry(dr + 0.03, 0.03, 6, 32), gold, 0, ty + dh - 0.04, dz, g));
    sill.rotation.x = Math.PI / 2;
    B.ticks.push((now) => { if (!calm) screen.emissive.setHSL((now / 7000) % 1, 0.75, 0.55); });
    const cone = 0.95, roofTop = ty + dh + cone;
    mesh(new THREE.CylinderGeometry(0.34, dr + 0.45, cone, 28, 1, true), leafy(6, 1.6), 0, ty + dh + cone / 2, dz, g);
    const band = std({ color: b.roof, roughness: 0.6 });
    for (const [r, y] of [[dr + 0.45, ty + dh], [0.36, roofTop]]) small(mesh(new THREE.TorusGeometry(r, 0.05, 6, 32), band, 0, y, dz, g)).rotation.x = Math.PI / 2;
    const tall = roofTop + 1.5, trunk = new THREE.CylinderGeometry(0.28, 0.4, tall, 14); trunk.translate(0, tall / 2, 0);
    mesh(trunk, bark(), 0, 0, dz, g).raycast = () => {};
    for (let i = 0; i < 3; i++) {
      const bough = new THREE.CylinderGeometry(0.06, 0.13, 1.1, 7); bough.translate(0, 0.55, 0);
      const m = mesh(bough, bark(), 0, tall - 0.5, dz, g); m.rotation.set(0, i * 2.1, 0.95); m.raycast = () => {};
    }
    crown(g, 0, tall + 0.4, dz - 0.1, 1.25, rnd);
    for (const s of [-1, 1]) crown(g, s * 1.05, tall - 0.05, dz - 0.35, 0.75, rnd);
    // a dish and an aerial on the den's roof, the aerial's light blinking
    const metal = std({ color: '#c8ccd4', roughness: 0.4, metalness: 0.5 });
    const dish = mesh(new THREE.SphereGeometry(0.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 3), metal, 0.72, ty + dh + 0.32, dz + 0.3, g);
    dish.rotation.set(-0.9, 0.5, 0); dish.material.side = THREE.DoubleSide;
    mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 5), metal, -0.75, ty + dh + 0.5, dz + 0.2, g);
    const blink = std({ color: '#f04040', emissive: new THREE.Color('#ff3030'), emissiveIntensity: 1, roughness: 0.5 });
    small(mesh(new THREE.SphereGeometry(0.035, 8, 6), blink, -0.75, ty + dh + 1.06, dz + 0.2, g));
    B.ticks.push((now) => { blink.emissiveIntensity = calm ? 1 : (now % 1600) < 800 ? 1.4 : 0.15; });
    // fairy lights strung from the den to the banners
    const bulbs = ['#ff5a8a', '#5ad0ff', '#ffd04a', '#7aff7a'].map(c => glowOf(c, c));
    lit.push(...bulbs);
    const string = [];
    for (const s of [-1, 1]) {
      const a = [wx(s * 0.75), ty + dh - 0.1, wz(dz + 0.4)], e = [wx(s * (W / 2 - 0.12)), P + 2.55, wz(D / 2 - 0.12)];
      sagging(string, a, e, 0.35, 10);
      for (let k = 1; k < 10; k++) {
        const t = k / 10, x = a[0] + (e[0] - a[0]) * t, y = a[1] + (e[1] - a[1]) * t - Math.sin(t * Math.PI) * 0.35, zz = a[2] + (e[2] - a[2]) * t;
        small(mesh(new THREE.SphereGeometry(0.04, 8, 6), bulbs[k % 4], x - f.cx, y - 0.05, zz - f.cz, g));
      }
    }
    beams(string, 0.008, dark, { sides: 4, shadow: false });
  }
  // a lantern either side of the steps
  for (const s of [-1, 1]) {
    const m = piece('lantern', wx(s * 1.15) + COLS / 2 - 0.5, wz(D / 2 - 0.3) + ROWS / 2 - 0.5, { scale: 0.7, y: P, free: true });
    if (!m) continue;
    m.traverse(o => { if (o.material?.emissiveMap) { o.material.emissive = new THREE.Color(haunted ? '#c070ff' : '#ffc070'); lit.push(o.material); } });
    g.attach(m);
  }
  // two tall banners at the podium's front corners, swaying a little
  const cloth = std({ map: texOf(noboriArt(ink, letter)), side: THREE.DoubleSide, roughness: 0.95 });
  const flags = [-1, 1].map(s => {
    const x = s * (W / 2 - 0.12), z = D / 2 - 0.12, tall = 2.7;
    mesh(new THREE.CylinderGeometry(0.035, 0.04, tall, 8), dark, x, P + tall / 2, z, g);
    small(mesh(new THREE.SphereGeometry(0.06, 10, 8), gold, x, P + tall + 0.04, z, g));
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 6), dark, x - s * 0.22, P + tall - 0.1, z, g).rotation.z = Math.PI / 2;
    const hang = new THREE.Group();
    hang.position.set(x - s * 0.22, P + tall - 0.12, z + 0.02);
    g.add(hang);
    small(mesh(new THREE.PlaneGeometry(0.4, 1.6), cloth, 0, -0.8, 0, hang));
    return hang;
  });
  B.ticks.push((now) => { if (!calm) flags.forEach((h, i) => { h.rotation.y = Math.sin(now / 900 + i * 2) * 0.12; h.rotation.x = Math.sin(now / 1300 + i) * 0.04; }); });
  return g;
}

/** The Withered Nursery (the user's ask, 2026-10-14: the glass box was "lame"): a Victorian conservatory gone to ruin, a
    glass rotunda under a ribbed dome with a lantern and finial between two wings under glass barrel vaults, white iron
    frames and cresting, panes grimed and some broken, ivy creeping up it, dead plants inside and a ghost's glow drifting
    among them. A tap is its door. */
function nursery(b, f, L, lit) {
  const g = new THREE.Group(), rnd = seeded(17);
  g.position.set(f.cx, 0, f.cz - 0.05);
  B.group.add(g);
  const w = f.w - 0.4, d = f.h - 0.6, base = 0.3, small = (m) => { m.castShadow = false; return m; };
  const frame = std({ color: '#e8eae0', roughness: 0.5, metalness: 0.2 });
  const glass = std({ color: '#a8d8b8', emissive: new THREE.Color('#3a8a5a'), emissiveIntensity: 0.35, transparent: true, opacity: 0.36, roughness: 0.08, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const grime = std({ color: '#4a5a40', transparent: true, opacity: 0.7, roughness: 1, depthWrite: false, side: THREE.DoubleSide });
  lit.push(glass);
  const pane = (m) => { m.castShadow = false; m.renderOrder = 2; return m; };
  // the plinth: stone on a log footing, a step to the door
  mesh(rbox(w, base, d, 0.05), std({ color: '#8a8478', roughness: 1 }), 0, base / 2, 0, g);
  mesh(rbox(w + 0.08, 0.06, d + 0.08, 0.02), std({ color: '#a8a294', roughness: 1 }), 0, base - 0.03, 0, g);
  mesh(rbox(0.9, base / 2, 0.24, 0.02), std({ color: '#a8a294', roughness: 1 }), 0, base / 4, d / 2 + 0.1, g);
  // the rotunda: an octagon of glass, white posts at its corners, a ribbed dome, a little lantern and a finial on top
  const r = 0.95, rh = 1.25, ry = base + rh;
  pane(mesh(new THREE.CylinderGeometry(r, r, rh, 8, 1, true), glass, 0, base + rh / 2, 0, g)).rotation.y = Math.PI / 8;
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4 + Math.PI / 8;
    mesh(new THREE.BoxGeometry(0.06, rh, 0.06), frame, r * Math.sin(a), base + rh / 2, r * Math.cos(a), g).rotation.y = a;
  }
  for (const y of [base + 0.04, base + rh * 0.62, ry]) small(mesh(new THREE.TorusGeometry(r, 0.03, 4, 8), frame, 0, y, 0, g)).rotation.set(Math.PI / 2, 0, Math.PI / 8);
  const dome = pane(mesh(new THREE.SphereGeometry(r, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, ry, 0, g));
  dome.scale.y = 0.85;
  for (let k = 0; k < 4; k++) { const rib = small(mesh(new THREE.TorusGeometry(r, 0.025, 4, 24, Math.PI), frame, 0, ry, 0, g)); rib.rotation.y = k * Math.PI / 4; rib.scale.set(1, 0.85, 1); }
  const lt = ry + r * 0.85;
  pane(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8, 1, true), glass, 0, lt + 0.11, 0, g));
  mesh(new THREE.ConeGeometry(0.26, 0.22, 8), frame, 0, lt + 0.35, 0, g);
  mesh(new THREE.SphereGeometry(0.05, 10, 8), frame, 0, lt + 0.5, 0, g);
  small(mesh(new THREE.ConeGeometry(0.025, 0.24, 6), frame, 0, lt + 0.64, 0, g));
  // the wings, set back so the rotunda stands proud: glass boxes under barrel vaults, mullions and cresting in white iron
  const ww = (w - 2 * r) / 2 + 0.15, wd = d - 0.6, wh = 0.95, wy = base + wh, vr = wd / 2, back = -0.15;
  for (const s of [-1, 1]) {
    const wg = new THREE.Group();
    wg.position.set(s * (r - 0.15 + ww / 2), 0, back);
    g.add(wg);
    pane(mesh(new THREE.BoxGeometry(ww, wh, wd), glass, 0, base + wh / 2, 0, wg));
    const vault = pane(mesh(new THREE.CylinderGeometry(vr, vr, ww, 18, 1, true, 0, Math.PI), glass, 0, wy, 0, wg));
    vault.rotation.z = Math.PI / 2; vault.scale.set(0.55, 1, 1);
    const cap = pane(mesh(new THREE.CircleGeometry(vr, 18, 0, Math.PI), glass, s * ww / 2, wy, 0, wg));
    cap.rotation.y = Math.PI / 2; cap.scale.y = 0.55;
    for (let i = 0; i <= 4; i++) {
      const x = -ww / 2 + i * ww / 4;
      for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.045, wh, 0.045), frame, x, base + wh / 2, sz * wd / 2, wg);
      const rib = small(mesh(new THREE.TorusGeometry(vr, 0.022, 4, 18, Math.PI), frame, x, wy, 0, wg));
      rib.rotation.y = Math.PI / 2; rib.scale.set(1, 0.55, 1);
    }
    for (const sz of [-1, 1]) small(mesh(new THREE.BoxGeometry(ww, 0.05, 0.05), frame, 0, wy, sz * wd / 2, wg));
    small(mesh(new THREE.BoxGeometry(ww, 0.035, 0.035), frame, 0, wy + vr * 0.55, 0, wg));
    for (let i = 0; i < 7; i++) small(mesh(new THREE.ConeGeometry(0.03, 0.12, 4), frame, -ww / 2 + 0.1 + i * (ww - 0.2) / 6, wy + vr * 0.55 + 0.07, 0, wg));
    for (let i = 0; i < 4; i++) {   // grime and broken panes on its front
      if (rnd() < 0.45) continue;
      const hh = 0.25 + rnd() * 0.4;
      pane(mesh(new THREE.PlaneGeometry(ww / 4 - 0.06, hh), grime, -ww / 2 + (i + 0.5) * ww / 4, base + 0.05 + hh / 2, wd / 2 + 0.005, wg));
    }
  }
  // the door: glass doors in a white frame under a little pediment, the sign over it
  const fz = r * Math.cos(Math.PI / 8);
  mesh(new THREE.BoxGeometry(0.62, 0.98, 0.04), frame, 0, base + 0.49, fz + 0.01, g);
  small(mesh(new THREE.BoxGeometry(0.52, 0.88, 0.05), std({ color: '#3a5a48', emissive: new THREE.Color('#4a9a6a'), emissiveIntensity: 0.4, roughness: 0.2 }), 0, base + 0.47, fz + 0.02, g));
  small(mesh(new THREE.BoxGeometry(0.02, 0.88, 0.06), frame, 0, base + 0.47, fz + 0.03, g));
  const ped = new THREE.Shape(); ped.moveTo(-0.42, 0); ped.lineTo(0, 0.24); ped.lineTo(0.42, 0); ped.closePath();
  small(mesh(new THREE.ShapeGeometry(ped), frame, 0, base + 0.98, fz + 0.04, g));
  panel(greenSign(b.name), 1.5, 0.34, f.cx, ry + 0.12, f.cz - 0.05 + fz + 0.12);
  // dead plants inside, a dead palm under the dome, a ghost's glow drifting among them
  const pots = std({ color: '#8a5a40', roughness: 0.9 }), dead = ['#6a5a3a', '#5a4a30', '#7a6a48', '#4a5a38'].map(c => std({ color: c, roughness: 1, flatShading: true }));
  for (let i = 0; i < 8; i++) {
    const s = i < 4 ? -1 : 1, k = i % 4, x = s * (r + 0.05 + (k % 2) * (ww - 0.6) / 1.4), z = back + (k < 2 ? -1 : 1) * (wd / 2 - 0.3);
    mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.18, 10), pots, x, base + 0.09, z, g);
    const m = mesh(new THREE.IcosahedronGeometry(0.16 + rnd() * 0.08, 0), dead[i % 4], x, base + 0.3, z, g);
    m.scale.set(1, 0.7, 1); m.rotation.z = (rnd() - 0.5) * 0.8;
  }
  const palm = new THREE.CylinderGeometry(0.06, 0.09, 1.3, 8); palm.translate(0, 0.65, 0);
  mesh(palm, std({ color: '#6a5440', roughness: 1 }), -0.15, base, -0.25, g).rotation.z = 0.12;
  const frond = [], px = f.cx - 0.3, py = base + 1.28, pz = f.cz - 0.3;   // its fronds hang dead off the top
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; frond.push([px, py, pz, px + Math.sin(a) * 0.55, py - 0.3 - rnd() * 0.15, pz + Math.cos(a) * 0.45]); }
  beams(frond, 0.03, std({ color: '#7a6a40', roughness: 1 }), { taper: 0.2, sides: 4, shadow: false });
  const wisp = std({ color: '#c8a0ff', emissive: new THREE.Color('#b080ff'), emissiveIntensity: 1.2, transparent: true, opacity: 0.85, roughness: 0.4 });
  const wisps = [0, 1, 2].map(i => small(mesh(new THREE.SphereGeometry(0.07, 12, 8), wisp, 0, base + 0.6, 0, g)));
  B.ticks.push((now) => {
    wisps.forEach((m, i) => {
      const t = calm ? i : now / 2600 + i * 2.1;
      m.position.set(Math.sin(t) * (w / 2 - 0.5), base + 0.55 + Math.sin(t * 1.7) * 0.18, Math.cos(t * 1.3) * 0.25);
    });
  });
  // ivy creeping up its corners and over the vaults
  const ivy = ['#2e5a24', '#3a6a2a', '#24461e'].map(c => std({ color: c, roughness: 0.95, flatShading: true }));
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
    const t = i / 8, x = s * (w / 2 - 0.05 - t * 0.6), y = base + t * (wh + 0.35), z = back + wd / 2 + 0.06;
    small(mesh(new THREE.IcosahedronGeometry(0.1 + rnd() * 0.06, 0), ivy[i % 3], x, y, z, g)).scale.set(1, 0.8, 0.6);
  }
  for (let i = 0; i < 6; i++) small(mesh(new THREE.IcosahedronGeometry(0.09 + rnd() * 0.05, 0), ivy[i % 3], -r * 0.7 + i * 0.05, base + 0.2 + i * 0.22, r * 0.72, g)).scale.set(1, 0.8, 0.6);
  return g;
}

/** The Nursery's sign: leaf green, a sprout, its name. */
function greenSign(name) {
  const f = fine(96, 22, 8), { g, rr, lin } = f;
  rr(0, 0, 96, 22, 3, '#f4f4ec');
  rr(1.8, 1.8, 92.4, 18.4, 2, lin(0, 0, 0, 22, ['#5ab84a', '#2e8a34']));
  g.fillStyle = '#c8f070'; g.beginPath(); g.ellipse(10, 9, 4, 2, -0.5, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(16, 9, 4, 2, 0.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#c8f070'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(13, 18); g.lineTo(13, 10); g.stroke();
  g.fillStyle = '#f8f8f0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 11px sans-serif';
  g.fillText(name, 57, 12, 66);
  return f.c;
}

/** The Great Tree in the middle of town: a vast trunk from the jungle floor, roots spread over its deck, a hollow in its
    front glowing amber (a tap knocks), bracket fungi up it lit at night, a ring of lanterns strung round it, and a crown
    spread wide and low over the deck. */
function greatTree(b, f, L, lit) {
  const g = new THREE.Group(), rnd = seeded(23);
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const R0 = 1.25, tall = 3.4;
  const trunk = new THREE.CylinderGeometry(R0 * 0.75, R0 * 1.05, tall - DROP, 20, 6); trunk.translate(0, (tall + DROP) / 2, 0);
  const p = trunk.attributes.position;
  for (let i = 0; i < p.count; i++) {   // buttressed, not a pipe
    const a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + Math.sin(a * 5) * 0.08 + Math.sin(a * 3 + p.getY(i)) * 0.05;
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k);
  }
  trunk.computeVertexNormals();
  const barkMap = barkArt(); barkMap.repeat.set(3, 3);
  const bigBark = std({ map: barkMap, roughness: 0.95 });
  mesh(trunk, bigBark, 0, 0, 0, g);
  for (let i = 0; i < 7; i++) {   // roots spread over the deck
    const a = i / 7 * Math.PI * 2 + 0.3, len = 0.9 + rnd() * 0.5;
    if (Math.abs(a - Math.PI / 2) < 0.4) continue;   // none across the hollow's way in
    const root = new THREE.CylinderGeometry(0.06, 0.26, len, 8); root.translate(0, len / 2, 0); root.rotateZ(-Math.PI / 2 - 0.08);
    const m = mesh(root, bigBark, Math.cos(a) * R0 * 0.85, 0.05, Math.sin(a) * R0 * 0.85, g);
    m.rotation.y = -a;
  }
  // the hollow, facing you, warm inside
  const glowIn = std({ color: '#3a2010', emissive: new THREE.Color('#f8a040'), emissiveIntensity: 0.5, roughness: 1 });
  lit.push(glowIn);
  const hollow = new THREE.Shape(); hollow.moveTo(-0.38, 0); hollow.lineTo(-0.38, 0.75); hollow.quadraticCurveTo(-0.38, 1.25, 0, 1.3); hollow.quadraticCurveTo(0.38, 1.25, 0.38, 0.75); hollow.lineTo(0.38, 0); hollow.closePath();
  mesh(new THREE.ShapeGeometry(hollow), glowIn, 0, 0.02, R0 * 0.96, g).castShadow = false;
  // bracket fungi up it, lit
  const cap = std({ color: '#f0e0b0', emissive: new THREE.Color('#c8f080'), emissiveIntensity: 0.6, roughness: 0.6 });
  lit.push(cap);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, y = -2.8 + i * 0.6, rr2 = R0 * (0.95 - (y + 3) * 0.03);
    if (y > -0.1 && y < 1.5 && Math.abs(((a % (Math.PI * 2)) - Math.PI / 2)) < 0.6) continue;
    const m = mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.06, 12, 1, false, 0, Math.PI), cap, Math.cos(a) * rr2, y, Math.sin(a) * rr2, g);
    m.rotation.y = -a + Math.PI / 2; m.castShadow = false;
  }
  // a ring of lanterns strung round it
  const bulb = new THREE.SphereGeometry(0.06, 8, 6), ropes = [];
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2, rr2 = R0 + 0.35, y = 2.1 + Math.sin(i * 1.7) * 0.06;
    const m = std({ color: '#fff0c0', emissive: new THREE.Color(['#ffc060', '#ff8060', '#ffe080'][i % 3]), emissiveIntensity: 1, roughness: 0.4 });
    lit.push(m);
    mesh(bulb, m, Math.cos(a) * rr2, y - 0.12, Math.sin(a) * rr2, g).castShadow = false;
    const a2 = (i + 1) / 14 * Math.PI * 2;
    sagging(ropes, [f.cx + Math.cos(a) * rr2, y, f.cz + Math.sin(a) * rr2], [f.cx + Math.cos(a2) * rr2, y, f.cz + Math.sin(a2) * rr2], 0.08, 2);
  }
  beams(ropes, 0.012, std({ color: '#3a2a1a', roughness: 0.9 }), { sides: 4, shadow: false });
  // the crown: boughs out, then leaves spread wide and low
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + 0.6, bough = new THREE.CylinderGeometry(0.1, 0.3, 1.9, 8); bough.translate(0, 0.95, 0);
    const m = mesh(bough, bigBark, 0, tall - 0.6, 0, g); m.rotation.set(0, -a, 1.0); m.raycast = () => {};
  }
  crown(g, 0, tall + 0.6, -0.3, 1.7, rnd);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.6; crown(g, Math.cos(a) * 1.7, tall + 0.3, Math.sin(a) * 1.3 - 0.4, 0.95, rnd); }
  return g;
}

/** A sign carved in a plank, hung on two ropes (the vine gate's). */
function plankArt(name) {
  const f = fine(96, 22, 8), { g, rr, lin } = f;
  rr(0, 0, 96, 22, 4, '#4a2c18');
  rr(1.6, 1.6, 92.8, 18.8, 3, lin(0, 0, 0, 22, ['#c89a68', '#9a6a40']));
  g.strokeStyle = 'rgba(80,46,20,0.35)'; g.lineWidth = 0.5;
  for (let y = 5; y < 20; y += 3.5) { g.beginPath(); g.moveTo(4, y); g.bezierCurveTo(30, y - 1, 60, y + 1, 92, y); g.stroke(); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 10px sans-serif';
  g.fillStyle = 'rgba(255,240,210,0.4)'; g.fillText(name.toUpperCase(), 48.5, 12.5, 84);
  g.fillStyle = '#3a2212'; g.fillText(name.toUpperCase(), 48, 12, 84);
  return f.c;
}

/** Highbough's name board (the user's ask, 2026-10-14: readable signs for the Gym Leaders and the trade house): a dark
    walnut plank, mossy along the top, big cream letters, the second line in the leader's ink (the Curio Shop's in ghost
    violet), a gold rim for a leader. */
function boughBoardArt(lines, ink) {
  const f = fine(64, 28, 8), { g, rr, lin } = f;
  rr(0, 2, 64, 26, 3, ink ? '#d8b050' : '#2a1a10');
  rr(1.4, 3.4, 61.2, 23.2, 2.2, lin(0, 0, 0, 28, ['#6a4428', '#3e2616']));
  g.strokeStyle = 'rgba(20,10,4,0.4)'; g.lineWidth = 0.5;
  for (let y = 8; y < 26; y += 4) { g.beginPath(); g.moveTo(3, y); g.bezierCurveTo(22, y - 1.2, 42, y + 1.2, 61, y); g.stroke(); }
  g.fillStyle = '#c8a060';
  for (const x of [4.5, 59.5]) { g.beginPath(); g.arc(x, 7, 1, 0, Math.PI * 2); g.fill(); }
  const r = seeded(lines[0].length * 7 + 3);
  for (let i = 0; i < 26; i++) { g.fillStyle = ['#4a7a30', '#3a6a2a', '#5a8a3a'][i % 3]; g.beginPath(); g.ellipse(2 + r() * 60, 3 + r() * 1.6, 1.4 + r() * 2, 0.9 + r() * 1.1, 0, 0, Math.PI * 2); g.fill(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 11px sans-serif'; g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText(lines[0], 32.4, (lines[1] ? 12 : 15.5) + 0.5, 56);
  g.fillStyle = '#fff4dc'; g.fillText(lines[0], 32, lines[1] ? 12 : 15.5, 56);
  if (lines[1]) { g.font = 'bold 7px sans-serif'; g.fillStyle = ink || '#d0a0ff'; g.fillText(lines[1], 32, 21.5, 56); }
  return f.c;
}

/** A name board by each of Highbough's named houses (`s`): the board hung on two ropes from a log crossbar, swaying a
    little, a ghost lantern off one end. */
function boughBoards(town, lit) {
  const { map } = town, wood = bark(), rope = std({ color: '#b89a6a', roughness: 1 });
  const ghost = std({ color: '#b070ff', emissive: new THREE.Color('#c890ff'), emissiveIntensity: 0.9, roughness: 0.5 });
  lit.push(ghost);
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 's') return;
    const near = (f) => Math.hypot(Math.max(f.x0 - x, 0, x - f.x1), Math.max(f.y0 - y, 0, y - f.y1));
    const named = town.buildings.filter(b => b.name).map(b => ({ b, d: near(footprint(map, b.at)) })).sort((p, q) => p.d - q.d)[0]?.b;
    if (!named) return;
    const leader = town.homes?.[named.home]?.leader;
    const lines = leader ? [named.name, 'GYM LEADER'] : named.kind === 'shop' ? [named.name, 'TRADE HOUSE'] : [named.name];
    const g = new THREE.Group(), W = 1.3, H = 0.57, top = 1.62;
    g.position.set(tileX(x), 0, tileZ(y) + 0.3);
    (B.signs ??= {})[named.id] = [tileX(x), top + 0.1, tileZ(y) + 0.3];
    B.group.add(g);
    for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.06, 0.08, top + 0.08, 10), wood, sx * (W / 2 + 0.04), (top + 0.08) / 2, 0, g);
    mesh(new THREE.CylinderGeometry(0.055, 0.055, W + 0.36, 10), wood, 0.06, top, 0, g).rotation.z = Math.PI / 2;
    const swing = new THREE.Group();
    swing.position.set(0, top - 0.02, 0.04);
    g.add(swing);
    for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 5), rope, sx * (W / 2 - 0.12), -0.15, 0, swing).castShadow = false;
    const board = panel(boughBoardArt(lines, leader && LEADER_INK[leader]?.[0]), W, W * 28 / 64, 0, -0.3 - H / 2, 0);
    board.removeFromParent(); swing.add(board); board.raycast = () => {};
    const lamp = new THREE.Group();
    lamp.position.set(W / 2 + 0.2, top - 0.04, 0.02);
    g.add(lamp);
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), rope, 0, -0.08, 0, lamp).castShadow = false;
    mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.15, 8), ghost, 0, -0.24, 0, lamp).castShadow = false;
    mesh(new THREE.ConeGeometry(0.08, 0.06, 8), wood, 0, -0.14, 0, lamp).castShadow = false;
    const s = x * 0.7 + y;
    B.ticks.push((now) => { swing.rotation.z = calm ? 0 : Math.sin(now / 1500 + s) * 0.035; lamp.rotation.z = calm ? 0 : Math.sin(now / 1100 + s) * 0.09; });
    B.blocked.add(key(x, y));
  }));
}


/** The way out, the Bough Gate (the user's ask, 2026-10-14: the exit "more grand", noticeable as the way out): two giant
    trunks on flaring roots, wound with vines and thorns, growing together overhead into a living arch crowned with leaves
    and lit with ghost-blooms; vines hanging off its shoulders, a ghost-lantern swaying either side under it, wisps of
    ghost-fire drifting round it, the town's name on a wide plank swinging under the lintel, a lantern on each post. Its
    posts block their tiles; the way between them is `R.exitAt`. */
function vineGate(x, z, span, tall, name, L, lit) {
  const g = new THREE.Group(), rnd = seeded(47);
  g.position.set(x, 0, z);
  B.group.add(g);
  B.reach = 2;   // the camera may lean past the back row, so the whole arch shows when you walk up to it
  const R = span / 2 + 0.12, up = new THREE.Vector3(0, 1, 0);
  const logGeo = (r, len) => { const geo = new THREE.CylinderGeometry(r * 0.88, r, len, 14); geo.translate(0, len / 2, 0); return geo; };
  const vine = std({ color: '#3e7a2e', roughness: 0.9 }), thorn = std({ color: '#5a3a2a', roughness: 0.8 });
  const ghost = std({ color: '#b070ff', emissive: new THREE.Color('#c890ff'), emissiveIntensity: 0.9, roughness: 0.5 });
  lit.push(ghost);
  const wound = [], hang = [], blooms = [];
  for (const s of [-1, 1]) {
    const px = s * R;
    mesh(logGeo(0.36, tall + 0.1), bark(), px, 0, 0, g);
    for (let i = 0; i < 5; i++) {   // roots flaring out over the deck, thick at the trunk
      const a = i / 5 * Math.PI * 2 + s * 0.6, root = mesh(new THREE.ConeGeometry(0.12, 0.9, 6), bark(), px + Math.cos(a) * 0.4, 0.17, Math.sin(a) * 0.4, g);
      root.quaternion.setFromUnitVectors(up, new THREE.Vector3(Math.cos(a), -0.2, Math.sin(a)).normalize());
      root.castShadow = false;
    }
    for (let i = 0; i < 22; i++) {   // a vine spiralling up it, thorns on it
      const a0 = i * 0.9 + s, a1 = a0 + 0.9, y0 = i * tall / 22, y1 = y0 + tall / 22;
      wound.push([x + px + Math.cos(a0) * 0.37, y0, z + Math.sin(a0) * 0.37, x + px + Math.cos(a1) * 0.37, y1, z + Math.sin(a1) * 0.37]);
      if (i % 3 === 1) { const t = mesh(new THREE.ConeGeometry(0.04, 0.16, 4), thorn, px + Math.cos(a0) * 0.41, y0, Math.sin(a0) * 0.41, g); t.rotation.z = -Math.cos(a0) * 1.4; t.rotation.x = Math.sin(a0) * 1.4; t.castShadow = false; }
    }
    crown(g, px + s * 0.4, 0.3, 0.15, 0.42, rnd, { cols: ['#3a6a2a', '#2e5a24', '#4a7a30'] });   // brambles at its foot
    for (let i = 0; i < 5; i++) {   // vines hanging off the arch's shoulder, by the trunk, clear of the way through
      const t = 0.12 + i * 0.09, vx = x + s * (Math.cos(t) * R + 0.06), vy = tall + Math.sin(t) * R;
      hang.push([vx, vy, z + 0.22, vx + s * 0.04, vy - 0.7 - rnd() * 0.9, z + 0.26]);
    }
  }
  beams(wound, 0.035, vine, { sides: 5, shadow: false });
  beams(hang, 0.02, vine, { sides: 4, shadow: false });
  // the arch: the two trunks' boughs grown together overhead, a thinner one twisted round it; the lintel under it
  mesh(new THREE.TorusGeometry(R, 0.27, 10, 30, Math.PI), bark(), 0, tall, 0, g);
  const twist = mesh(new THREE.TorusGeometry(R + 0.06, 0.11, 8, 30, Math.PI), bark(), 0, tall, 0.04, g);
  twist.rotation.y = 0.28; twist.castShadow = false;
  const beam = mesh(new THREE.CylinderGeometry(0.2, 0.22, span + 0.6, 12), bark(), 0, tall - 0.05, 0.05, g);
  beam.rotation.z = Math.PI / 2;
  crown(g, 0, tall + R + 0.25, 0, 0.62, rnd);
  for (const s of [-1, 1]) crown(g, s * R * 0.78, tall + R * 0.62 + 0.1, 0.05, 0.46, rnd);
  for (let i = 0; i < 14; i++) {   // ghost-blooms along the arch's face
    const t = 0.15 + i / 13 * (Math.PI - 0.3);
    blooms.push([x + Math.cos(t) * R, z + 0.26, 0.8 + rnd() * 0.6, rnd() * 6, null, tall + Math.sin(t) * R + (rnd() - 0.5) * 0.12]);
  }
  instanced(new THREE.IcosahedronGeometry(0.06, 0), ghost, blooms).castShadow = false;
  // the name on a wide plank, swinging on its ropes from the lintel
  const ropes = [];
  for (const s of [-1, 1]) ropes.push([x + s * 0.8, tall - 0.2, z + 0.24, x + s * 0.8, tall - 0.5, z + 0.24]);
  beams(ropes, 0.015, std({ color: '#c8b080', roughness: 0.9 }), { sides: 4, shadow: false });
  const sign = panel(plankArt(name), 2.0, 0.46, x, tall - 0.72, z + 0.24);
  sign.userData.spot = 'exit';
  // a ghost-lantern swaying either side under the arch, a warm lantern on each post
  const swings = [];
  for (const s of [-1, 1]) {
    const t = Math.acos(0.62 / R), pivot = new THREE.Group();
    pivot.position.set(s * 0.62, tall + Math.sin(t) * R - 0.05, 0.12);
    g.add(pivot);
    const cord = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 4), std({ color: '#2a1e26', roughness: 0.9 }), 0, -0.18, 0, pivot); cord.castShadow = false;
    const paper = mesh(new THREE.SphereGeometry(0.15, 14, 10), ghost, 0, -0.5, 0, pivot); paper.scale.y = 1.3; paper.castShadow = false;
    for (const dy of [-0.2, 0.2]) mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10), thorn, 0, -0.5 + dy, 0, pivot).castShadow = false;
    swings.push([pivot, s]);
  }
  const glow = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.9, roughness: 0.6 });
  lit.push(glow);
  for (const s of [-1, 1]) {
    mesh(new THREE.BoxGeometry(0.34, 0.05, 0.05), thorn, s * (R + 0.3), tall - 0.45, 0.3, g);
    mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.24, 8), glow, s * (R + 0.45), tall - 0.66, 0.3, g).castShadow = false;
  }
  // wisps of ghost-fire drifting up and over the arch, round and round
  const wisps = Array.from({ length: 7 }, (_, i) => { const sp = sprite(emberArt(i % 2 ? '#c890ff' : '#90f0d0'), 0.2); sp.visible = true; return [sp, i / 7, 0.2 + rnd() * 0.25]; });
  B.ticks.push((now) => {
    sign.rotation.z = calm ? 0 : Math.sin(now / 1300) * 0.04;
    for (const [pivot, s] of swings) pivot.rotation.z = calm ? 0 : Math.sin(now / 1100 + s) * 0.1;
    for (const [sp, k, out] of wisps) {
      const t = calm ? k : (k + now / 16000) % 1, a = t * Math.PI, rr = R + out + Math.sin(t * 19) * 0.08;
      sp.position.set(x + Math.cos(a) * rr, tall + Math.sin(a) * rr + 0.1, z + 0.35 + Math.sin(t * 11 + k * 6) * 0.15);
      sp.material.opacity = Math.min(1, t * 6, (1 - t) * 6);
    }
  });
  for (const s of [-1, 1]) for (const y of [0, 1]) B.blocked.add(key(Math.round(x + s * R + COLS / 2 - 0.5), y));
  const way = mesh(new THREE.PlaneGeometry(span - 0.2, tall), new THREE.MeshBasicMaterial({ visible: false }), 0, tall / 2, 0.05, g);
  way.castShadow = way.receiveShadow = false;
  g.traverse(o => { o.userData.spot = 'exit'; });
  return g;
}

/** A planter box on each `f` (the user's ask, 2026-10-14: painted ones read as paper crates of fruit): a plank box with a
    dark rim, soil, three leafy clumps and ghost-town blooms (violet, pink, pale) over them. */
function planters(town) {
  const boxes = [], clumps = [], blooms = [], rnd = seeded(29);
  town.map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'f') return;
    B.blocked.add(key(x, y));
    const cx = tileX(x), cz = tileZ(y);
    boxes.push([cx, cz, 1, 0]);
    for (const dx of [-0.22, 0, 0.22]) {
      clumps.push([cx + dx, cz + (rnd() - 0.5) * 0.06, 0.9 + rnd() * 0.25, rnd() * 6, CANOPY.leaf[Math.floor(rnd() * 4)], 0.36]);
      for (let i = 0; i < 3; i++) blooms.push([cx + dx + (rnd() - 0.5) * 0.2, cz + (rnd() - 0.5) * 0.18, 1, rnd() * 6, ['#c890ff', '#f07ab8', '#f4eefc', '#9a70e8'][Math.floor(rnd() * 4)], 0.47 + rnd() * 0.07]);
    }
  }));
  if (!boxes.length) return;
  const box = new THREE.BoxGeometry(0.78, 0.32, 0.46); box.translate(0, 0.16, 0);
  instanced(box, std({ map: boardsArt(), color: '#a87850', roughness: 0.9 }), boxes);
  const lip = new THREE.BoxGeometry(0.84, 0.06, 0.52); lip.translate(0, 0.32, 0);
  instanced(lip, std({ color: CANOPY.rim, roughness: 0.9 }), boxes).castShadow = false;
  const soil = new THREE.BoxGeometry(0.7, 0.02, 0.38); soil.translate(0, 0.33, 0);
  instanced(soil, std({ color: '#3a2a1a', roughness: 1 }), boxes).castShadow = false;
  const clump = new THREE.IcosahedronGeometry(0.16, 0); clump.scale(1, 0.8, 1);
  instanced(clump, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), clumps).castShadow = false;
  instanced(new THREE.IcosahedronGeometry(0.045, 0), std({ color: '#ffffff', roughness: 0.6 }), blooms).castShadow = false;
}

/** The canopy's own things from the map: the floor far below and the mist over it, what holds the town up, the lone
    giants in the drop and the lifts. */
function canopyExtras(town, L, lit) {
  const plinth = B.group.children.find(o => o.geometry?.parameters?.height === 7);   // the room's plinth would be a lid over the drop
  if (plinth) plinth.position.y = DROP - 3.6;
  jungleFloor(town, lit);
  canopyMist();
  canopySupports(town);
  planters(town);
  boughBoards(town, lit);
  const rnd = seeded(71);
  town.map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '|') loneGiant(tileX(x) + (rnd() - 0.5) * 0.2, tileZ(y) + (rnd() - 0.5) * 0.2, rnd, lit);
    if (ch === 'y') lift(tileX(x) - 0.1, tileZ(y), rnd);
  }));
}

/** A firefly, a soft green-gold spot of light. */
/* Sunwell Bazaar, the Savanna's (a caravan trading post): one dusty caravan road straight across the map on the diagonal,
   a market where it crosses the middle, the watering hole cut into the ground off to one side (`holes` in wild(), its
   muddy bed and still brown-green water under it, reeds round its banks, a plank jetty out over it, a windpump by it),
   round mud huts under conical thatch, a great striped tent for Persian's bazaar, the sandstone caravanserai, wagons
   drawn up in a ring, a kopje of boulders, the bush round it all (flat-topped acacias, baobabs, termite mounds), and a
   sandstone gate under a sun disc out towards Sun Rock. Dust drifts up off the road. */
const HOLE_Y = -0.2, MUD_Y = -0.55;
const SAVANNA = {
  grass: ['#d8b860', '#c8a450', '#e4c878', '#b8944a'], road: ['#c88a58', '#b87a4a', '#d49a68', '#a86c40'],
  mud: ['#6a4a2c', '#5a3e24', '#7a5634'], earth: ['#b89060', '#a88050'], leaf: ['#8a9a38', '#6e8030', '#a8b048', '#5a6a28'],
  rock: ['#c09068', '#a87a52', '#8a6040', '#e0b088'], stripe: ['#c83a5a', '#e8a030', '#3a7ab8', '#2e9a6a', '#8a4ab0'],
};

/** What each tile of a savanna town is: the watering hole, the jetty, the road (and the market's props on it), a building's
    plot, the bush round the town or dry grass. */
function savannaKinds(town) {
  const { map } = town, at = (x, y) => map[y]?.[x];
  const props = new Set(['R', 'n', 'L', 'b', 'c', 'k']);
  return (x, y) => {
    const ch = at(x, y);
    if (ch === undefined || ch === 'T') return 'bush';
    if (ch === '~') return 'water';
    if (ch === '-') return 'deck';
    if (ch === '#') return 'road';
    if (props.has(ch)) return STEPS.some(([dx, dy]) => at(x + dx, y + dy) === '#') ? 'road' : 'grass';
    if (/[A-Z]/.test(ch)) return 'plot';
    return 'grass';
  };
}

/** The ground of a savanna town: nothing over the watering hole (its water shows through, the land rounded where it meets
    it), cracked mud and hoofprints round its rim, the red-earth road worn into ruts along the diagonal, packed earth under
    the huts, dry golden grass everywhere else, the bush's floor darker. */
function savannaGround(town) {
  const kind = savannaKinds(town), { map } = town;
  return (c) => {
    const g = c.getContext('2d'), T = 16, r = seeded(97), W = COLS * T, H = ROWS * T;
    const each = (fn) => map.forEach((row, y) => [...row].forEach((ch, x) => fn(ch, x, y)));
    const wet = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && kind(x, y) === 'water';
    g.clearRect(-1, -1, W + 2, H + 2);
    g.save();
    g.beginPath();
    each((ch, x, y) => {
      if (wet(x, y)) return;
      const rad = (dx, dy) => (wet(x + dx, y) && wet(x, y + dy) ? 7 : 0);
      g.roundRect(x * T, y * T, T, T, kind(x, y) === 'deck' ? 0 : [rad(-1, -1), rad(1, -1), rad(1, 1), rad(-1, 1)]);
    });
    g.clip();
    g.fillStyle = SAVANNA.grass[1]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.fillStyle = SAVANNA.grass[Math.floor(r() * 4)]; g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 3.5, 0.6 + r() * 1.4, r() * 3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(120,90,40,0.5)'; g.lineWidth = 0.4;
    for (let i = 0; i < 2400; i++) { const x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 1.6, y - 1.4 - r() * 1.4); g.stroke(); }
    each((ch, x, y) => {
      const k = kind(x, y), X = x * T, Y = y * T;
      if (k === 'bush') { g.fillStyle = 'rgba(110,80,40,0.45)'; g.fillRect(X - 1, Y - 1, T + 2, T + 2); }
      if (ch === ',') { g.fillStyle = 'rgba(150,120,50,0.35)'; g.beginPath(); g.ellipse(X + T / 2, Y + T / 2, T * 0.7, T * 0.7, 0, 0, Math.PI * 2); g.fill(); }
      if (k === 'plot') { g.fillStyle = SAVANNA.earth[0]; g.globalAlpha = 0.7; g.beginPath(); g.roundRect(X - 3, Y - 3, T + 6, T + 6, 6); g.fill(); g.globalAlpha = 1; }
    });
    // the rim of the watering hole: pale dried mud fading out, then dark wet mud at the edge, hoofprints in it
    each((ch, x, y) => { if (!wet(x, y)) return; g.fillStyle = 'rgba(200,170,120,0.55)'; g.beginPath(); g.arc(x * T + T / 2, y * T + T / 2, T * 1.45, 0, Math.PI * 2); g.fill(); });
    each((ch, x, y) => { if (!wet(x, y)) return; g.fillStyle = SAVANNA.mud[0]; g.beginPath(); g.arc(x * T + T / 2, y * T + T / 2, T * 0.98, 0, Math.PI * 2); g.fill(); });
    each((ch, x, y) => {
      if (wet(x, y) || !STEPS.some(([dx, dy]) => wet(x + dx, y + dy))) return;
      for (let i = 0; i < 4; i++) {
        const px = x * T + 2 + r() * (T - 4), py = y * T + 2 + r() * (T - 4);
        g.fillStyle = SAVANNA.mud[1]; g.beginPath(); g.ellipse(px, py, 1.1, 1.4, r() * 3, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(px + 1.8, py + 0.4, 1.1, 1.4, r() * 3, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = 'rgba(60,40,20,0.4)'; g.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) { let px = x * T + r() * T, py = y * T + r() * T; g.beginPath(); g.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (r() - 0.5) * 7; py += (r() - 0.5) * 7; g.lineTo(px, py); } g.stroke(); }
    });
    // the road: packed red earth with soft edges, ruts and hoofprints along the diagonal, pebbles
    // each road tile a disc, so the diagonal reads as one smooth band, not stairs; the market (road all round) square
    const isRoad = (x, y) => kind(x, y) === 'road';
    const roads = () => {
      g.beginPath();
      each((ch, x, y) => {
        if (!isRoad(x, y)) return;
        if (STEPS.every(([dx, dy]) => isRoad(x + dx, y + dy))) g.rect(x * T - 2, y * T - 2, T + 4, T + 4);
        else { g.moveTo(x * T + T / 2 + T * 0.92, y * T + T / 2); g.arc(x * T + T / 2, y * T + T / 2, T * 0.92, 0, Math.PI * 2); }
      });
    };
    g.save(); g.shadowColor = SAVANNA.road[1]; g.shadowBlur = 10; roads(); g.fillStyle = SAVANNA.road[0]; g.fill(); g.restore();
    g.save(); roads(); g.clip();
    for (let i = 0; i < 1400; i++) { g.fillStyle = SAVANNA.road[Math.floor(r() * 4)]; g.globalAlpha = 0.6; g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 3, 0.6 + r() * 1.5, r() * 3, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    // the wheel ruts, a pair of grooves down the road's middle from the way in to the gate, broken off across the market
    let px = town.door.x + 0.5, runs = [[]];
    for (let y = ROWS - 1; y >= 0; y--) {
      const row = map[y];
      let a = Math.floor(px), lo, hi;
      for (const d of [0, -1, 1, -2, 2]) if (row[a + d] === '#') { a += d; break; }
      if (row[a] !== '#') { runs.push([]); continue; }
      for (lo = a; row[lo - 1] === '#'; lo--);
      for (hi = a; row[hi + 1] === '#'; hi++);
      if (hi - lo > 3) { runs.push([]); continue; }
      px = (lo + hi + 1) / 2;
      runs[runs.length - 1].push([px * T, (y + 0.5) * T]);
    }
    const smooth = (pts) => pts.map(([, y], i) => { const near = pts.slice(Math.max(0, i - 2), i + 3); return [near.reduce((s, q) => s + q[0], 0) / near.length, y]; });
    for (const pts of runs.filter(p => p.length > 1).map(smooth)) for (const off of [-4.2, 4.2]) {
      g.strokeStyle = 'rgba(110,60,30,0.3)'; g.lineWidth = 1.8;
      g.beginPath();
      pts.forEach(([x, y], i) => { const [nx, ny] = pts[Math.min(i + 1, pts.length - 1)], [qx, qy] = pts[Math.max(i - 1, 0)], dx = nx - qx, dy = ny - qy, l = Math.hypot(dx, dy) || 1; g[i ? 'lineTo' : 'moveTo'](x - dy / l * off, y + dx / l * off); });
      g.stroke();
    }
    each((ch, x, y) => {
      if (map[y]?.[x] !== '#') return;
      for (let i = 0; i < 2; i++) { g.fillStyle = 'rgba(100,60,30,0.3)'; g.beginPath(); g.ellipse(x * T + r() * T, y * T + r() * T, 0.9, 1.2, r() * 3, 0, Math.PI * 2); g.fill(); }
      for (let i = 0; i < 3; i++) { g.fillStyle = ['#e8c8a0', '#8a6040', '#d0a880'][i]; g.beginPath(); g.arc(x * T + r() * T, y * T + r() * T, 0.5 + r() * 0.6, 0, Math.PI * 2); g.fill(); }
    });
    g.restore();
    each((ch, x, y) => {
      const X = x * T, Y = y * T;
      if (ch === 'f') for (let i = 0; i < 7; i++) {   // desert roses and yellow star flowers
        const fx = X + 2 + r() * (T - 4), fy = Y + 2 + r() * (T - 4);
        g.fillStyle = ['#e85a7a', '#f8d040', '#f8f0e0', '#f88a40'][i % 4]; g.beginPath(); g.arc(fx, fy, 1.3, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#7a4a20'; g.fillRect(fx - 0.35, fy - 0.35, 0.7, 0.7);
      }
      if (kind(x, y) === 'deck') {
        g.fillStyle = '#3a2414'; g.fillRect(X, Y, T, T);
        for (let i = 0; i < 4; i++) {
          g.fillStyle = ['#a07a50', '#8e6a42', '#b08a5e', '#7e5e3a'][Math.floor(r() * 4)]; g.fillRect(X, Y + i * 4 + 0.3, T, 3.4);
          g.fillStyle = 'rgba(60,30,10,0.4)'; g.fillRect(X + 2, Y + i * 4 + 1.6, 0.7, 0.7); g.fillRect(X + 13, Y + i * 4 + 1.6, 0.7, 0.7);
        }
        const wet = (dx, dy) => kind(x + dx, y + dy) === 'water';   // a pale trim just inside the railing, as Driftwood Landing's
        g.fillStyle = 'rgba(248,232,196,0.6)';
        if (wet(-1, 0)) g.fillRect(X + 1.6, Y, 1.2, T);
        if (wet(1, 0)) g.fillRect(X + T - 2.8, Y, 1.2, T);
        if (wet(0, -1)) g.fillRect(X, Y + 1.6, T, 1.2);
      }
    });
    for (let i = 0; i < 500; i++) {   // fallen acacia pods and pebbles
      const x = r() * W, y = r() * H, k = kind(Math.floor(x / T), Math.floor(y / T));
      if (k === 'road' || k === 'deck' || k === 'water') continue;
      g.save(); g.translate(x, y); g.rotate(r() * 6.3);
      g.fillStyle = r() < 0.5 ? '#8a6a3a' : '#a89070'; g.globalAlpha = 0.7;
      g.beginPath(); g.ellipse(0, 0, r() < 0.5 ? 2 : 0.8, 0.6, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    g.restore();
    return c;
  };
}

/** The watering hole under the cut-away ground: its bed of mud and stones, the water over it, still and brown-green with
    the sky in it, banks sloping down to it, reeds and papyrus round its edge, the jetty on its posts. */
function wateringHole(town) {
  const kind = savannaKinds(town), T = 16, f = fine(COLS * T, ROWS * T, 2), { g } = f, r = seeded(31), W = COLS * T, H = ROWS * T;
  g.fillStyle = '#5a4a32'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 700; i++) { g.fillStyle = ['#4a3a26', '#6a5838', '#7a6a48', '#3e3020'][i % 4]; g.beginPath(); g.ellipse(r() * W, r() * H, 2 + r() * 7, 1.5 + r() * 4, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 200; i++) { g.fillStyle = ['#8a7a60', '#a09070', '#6a5c48'][i % 3]; g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 2, 0.8 + r() * 1.4, r() * 3, 0, Math.PI * 2); g.fill(); }
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), std({ map: texOf(f.c), roughness: 1 }));
  bed.rotation.x = -Math.PI / 2; bed.position.y = MUD_Y; bed.receiveShadow = true; bed.raycast = () => {};
  B.group.add(bed);
  const wc = document.createElement('canvas');
  wc.width = wc.height = 128;
  const wg = wc.getContext('2d'), wr = seeded(9);
  wg.fillStyle = '#d0dcc8'; wg.fillRect(0, 0, 128, 128);
  wg.strokeStyle = '#ffffff'; wg.lineWidth = 1.2;
  for (let i = 0; i < 18; i++) {
    const x = wr() * 128, y = wr() * 128, w = 8 + wr() * 16;
    for (const ox of [0, -128, 128]) for (const oy of [0, -128, 128]) { wg.beginPath(); wg.moveTo(x + ox - w / 2, y + oy); wg.quadraticCurveTo(x + ox, y + oy - 2.5, x + ox + w / 2, y + oy); wg.stroke(); }
  }
  const map = new THREE.CanvasTexture(wc);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.repeat.set(COLS / 5, ROWS / 5);
  const water = std({ color: '#6a9a80', map, emissive: new THREE.Color('#2a5a50'), emissiveIntensity: 0.3, transparent: true, opacity: 0.72, roughness: 0.05, metalness: 0.25, depthWrite: false });
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(COLS, ROWS), water);
  surface.rotation.x = -Math.PI / 2; surface.position.y = HOLE_Y; surface.receiveShadow = true; surface.raycast = () => {};
  surface.renderOrder = 1;
  B.group.add(surface);
  B.ticks.push((now) => { if (!calm) map.offset.set(now / 90000, Math.sin(now / 8000) * 0.03); });
  const wet = (x, y) => kind(x, y) === 'water', banks = [], reeds = [], heads = [], posts = [], fascia = [], corners = new Set();
  const tops = [], ropes = [], railPosts = new Map(), rim = [];
  town.map.forEach((row, y) => [...row].forEach((ch, x) => {
    const k = kind(x, y);
    if (k === 'water') { B.blocked.add(key(x, y)); return; }
    const shore = STEPS.some(([dx, dy]) => wet(x + dx, y + dy));
    if (!shore) return;
    if (k === 'deck') {
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const cx = x + (dx > 0 ? 1 : 0), cy = y + (dy > 0 ? 1 : 0), c = `${cx},${cy}`;
        if (corners.has(c) || (!wet(x + dx, y) && !wet(x, y + dy))) continue;
        corners.add(c);
        posts.push([cx - COLS / 2 - dx * 0.07, cy - ROWS / 2 - dy * 0.07, 1, 0]);
      }
      for (const [dx, dy] of STEPS) if (wet(x + dx, y + dy)) fascia.push([tileX(x) + dx * 0.48, tileZ(y) + dy * 0.48, 1, dx ? Math.PI / 2 : 0]);
      for (const [dx, dy] of STEPS) {   // a rope railing along the jetty over the water, as Driftwood Landing's (the handoff's checklist, 2026-10-14: where you can walk reads at a glance)
        if (!wet(x + dx, y + dy)) continue;
        const [ax, ay] = dx ? [0, 1] : [1, 0], ex = tileX(x) + dx * 0.44, ez = tileZ(y) + dy * 0.44;
        const end = (s) => (wet(x + ax * s, y + ay * s) ? 0.44 : 0.5), a = [ex - ax * end(-1), ez - ay * end(-1)], b = [ex + ax * end(1), ez + ay * end(1)];
        for (const [h, list] of [[0.5, tops], [0.28, ropes]]) list.push([a[0], h, a[1], b[0], h, b[1]]);
        for (const [px, pz] of [a, b]) railPosts.set(`${px.toFixed(2)},${pz.toFixed(2)}`, [px, pz, 1, 0]);
      }
      return;
    }
    // pale stones laid along the bank, so the water's edge reads at a glance
    for (const [dx, dy] of STEPS) {
      if (!wet(x + dx, y + dy)) continue;
      for (let i = 0; i < 4; i++) {
        const along = -0.375 + i * 0.25 + (r() - 0.5) * 0.06;
        rim.push([tileX(x) + dx * 0.42 + (dy ? along : 0), tileZ(y) + dy * 0.42 + (dx ? along : 0), 0.85 + r() * 0.3, r() * 6, r() < 0.6 ? SAVANNA.rock[3] : SAVANNA.rock[0], 0]);
      }
    }
    banks.push([tileX(x), tileZ(y), 1, Math.PI / 4, SAVANNA.mud[Math.floor(r() * 3)], -0.01]);
    if (k !== 'grass' || r() < 0.35) return;
    for (const [dx, dy] of STEPS) {
      if (!wet(x + dx, y + dy)) continue;
      for (let i = 0; i < 9; i++) {
        const along = (r() - 0.5) * 0.9, px = tileX(x) + dx * 0.42 + (dy ? along : 0), pz = tileZ(y) + dy * 0.42 + (dx ? along : 0);
        reeds.push([px, pz, 0.7 + r() * 0.6, r() * 6, ['#7a9a40', '#5e8030', '#9ab050'][Math.floor(r() * 3)]]);
        if (r() < 0.3) heads.push([px, pz, 0.7 + r() * 0.5, 0, '#6a4a2a', 0.55 + r() * 0.2]);
      }
    }
  }));
  const bank = new THREE.CylinderGeometry(0.707, 0.95, 0.6, 4, 1, true); bank.translate(0, -0.3, 0);
  instanced(bank, std({ color: '#ffffff', roughness: 1 }), banks).castShadow = false;
  const reed = new THREE.ConeGeometry(0.025, 0.85, 4); reed.translate(0, 0.42 + HOLE_Y, 0);
  instanced(reed, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), reeds).castShadow = false;
  const head = new THREE.CapsuleGeometry(0.03, 0.09, 3, 6);   // bulrush heads
  instanced(head, std({ color: '#ffffff', roughness: 0.9 }), heads).castShadow = false;
  const post = new THREE.CylinderGeometry(0.05, 0.065, 0.62, 7); post.translate(0, MUD_Y + 0.31, 0);
  instanced(post, std({ color: '#4a3020', roughness: 0.95 }), posts);
  const board = new THREE.BoxGeometry(1.0, 0.13, 0.05); board.translate(0, -0.075, 0);
  instanced(board, std({ color: '#5a3c24', roughness: 0.9 }), fascia).castShadow = false;
  beams(tops, 0.028, std({ color: '#7a5434', roughness: 0.85 }), { shadow: false });
  beams(ropes, 0.016, std({ color: '#d8c8a0', roughness: 0.95 }), { shadow: false });
  const railPost = new THREE.CylinderGeometry(0.035, 0.042, 0.56, 6); railPost.translate(0, 0.28, 0);
  instanced(railPost, std({ color: '#5a3c24', roughness: 0.9 }), [...railPosts.values()]).castShadow = false;
  const stone = new THREE.DodecahedronGeometry(0.09, 0); stone.scale(1.3, 0.55, 1); stone.translate(0, 0.02, 0);
  instanced(stone, std({ color: '#ffffff', roughness: 1, flatShading: true }), rim).castShadow = false;
}

/** The bush round the town, a tree a tile: flat-topped acacias, a baobab now and then, termite mounds, boulders, dry
    thornbush; the front rows only the low bush, so it never hides you. A lone acacia (`|`) stands in the town itself. */
function savannaBush(map, L, rnd) {
  const acacias = [], baobabs = [], mounds = [], bushes = [], rocks = [];
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'T' && ch !== '|') return;
    B.blocked.add(key(x, y));
    const cx = tileX(x) + (rnd() - 0.5) * 0.5, cz = tileZ(y) + (rnd() - 0.5) * 0.5;
    if (ch === '|') { acacias.push([cx, cz, 1.25 + rnd() * 0.25, rnd() * 6, SAVANNA.leaf[Math.floor(rnd() * 3)]]); return; }
    if (y >= ROWS - 2) { bushes.push([cx, cz, 0.6 + rnd() * 0.35, rnd() * 6, SAVANNA.leaf[1 + Math.floor(rnd() * 3)]]); return; }
    const k = rnd();
    if (k < 0.34) acacias.push([cx, cz, 0.9 + rnd() * 0.4, rnd() * 6, SAVANNA.leaf[Math.floor(rnd() * 4)]]);
    else if (k < 0.41) baobabs.push([cx, cz, 0.85 + rnd() * 0.35, rnd() * 6]);
    else if (k < 0.5) mounds.push([cx, cz, 0.7 + rnd() * 0.6, rnd() * 6]);
    else if (k < 0.6) rocks.push([cx, cz, 0.5 + rnd() * 0.5, rnd() * 6, SAVANNA.rock[Math.floor(rnd() * 3)]]);
    else if (k < 0.9) bushes.push([cx, cz, 0.7 + rnd() * 0.5, rnd() * 6, SAVANNA.leaf[Math.floor(rnd() * 4)]]);
  }));
  const bush = new THREE.IcosahedronGeometry(0.5, 1); bush.scale(1.1, 0.6, 1); bush.translate(0, 0.25, 0);
  instanced(bush, std({ color: '#ffffff', roughness: 0.95, flatShading: true }), bushes);
  const rock = new THREE.DodecahedronGeometry(0.55, 0); rock.scale(1, 0.7, 1); rock.translate(0, 0.28, 0);
  instanced(rock, std({ color: '#ffffff', roughness: 1, flatShading: true }), rocks);
  // acacias: a leaning trunk forking in two, a wide flat crown of two layers
  const bark = std({ color: '#5a4030', roughness: 1 });
  const trunk = new THREE.CylinderGeometry(0.06, 0.11, 1.5, 6); trunk.translate(0, 0.75, 0); trunk.rotateZ(0.08);
  instanced(trunk, bark, acacias);
  for (const [tilt, turn] of [[0.55, 0], [0.5, Math.PI * 0.9]]) {
    const b = new THREE.CylinderGeometry(0.035, 0.06, 0.8, 5); b.translate(0, 0.4, 0); b.rotateZ(tilt); b.rotateY(turn); b.translate(-0.08, 1.35, 0);
    instanced(b, bark, acacias);
  }
  for (const [dy, sx, sz, ox, k] of [[2.0, 1.25, 0.95, 0, 1], [2.18, 0.8, 0.65, 0.25, 0.85]]) {
    const crown = new THREE.IcosahedronGeometry(1, 1); crown.scale(sx, 0.2, sz); crown.translate(ox, dy, 0);
    instanced(crown, std({ color: '#ffffff', roughness: 0.9, flatShading: true }), acacias.map(a => [a[0], a[1], a[2], a[3], shadeOf(a[4], k === 1 ? 0 : 1)]));
  }
  // baobabs: a fat bottle trunk, stubby branches like roots in the air, a little crown on each
  const fat = new THREE.CylinderGeometry(0.32, 0.45, 1.7, 10); fat.translate(0, 0.85, 0);
  instanced(fat, std({ color: '#9a8070', roughness: 1 }), baobabs);
  for (let k = 0; k < 5; k++) {
    const a = k / 5 * Math.PI * 2, b = new THREE.CylinderGeometry(0.03, 0.08, 0.6, 5);
    b.translate(0, 0.3, 0); b.rotateZ(0.7); b.rotateY(a); b.translate(0, 1.65, 0);
    instanced(b, std({ color: '#8a7060', roughness: 1 }), baobabs);
    const tuft = new THREE.IcosahedronGeometry(0.2, 0); tuft.translate(Math.cos(a) * 0.38, 2.0, -Math.sin(a) * 0.38);
    instanced(tuft, std({ color: '#7a8a34', roughness: 0.9, flatShading: true }), baobabs);
  }
  // termite mounds: red-earth spires, lumpy
  const mound = new THREE.ConeGeometry(0.32, 1.5, 7, 3); mound.translate(0, 0.75, 0);
  const p = mound.attributes.position, mr = seeded(3);
  for (let i = 0; i < p.count; i++) if (p.getY(i) < 1.4) { const k = 1 + (mr() - 0.5) * 0.35; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  mound.computeVertexNormals();
  instanced(mound, std({ color: '#b0683c', roughness: 1, flatShading: true }), mounds);
  const lump = new THREE.ConeGeometry(0.16, 0.7, 6); lump.translate(0.22, 0.35, 0.05);
  instanced(lump, std({ color: '#a05c34', roughness: 1, flatShading: true }), mounds);
}

/** A round hut's wall, wrapped round it once (u = 0.5 is its front): mud plaster, a band of painted zigzags in its colour,
    a plank door with a lit doorway either side of it, two small lit windows. */
function rondavelArt(col, circ) {
  const W = 128, f = fine(W, 32, 6), { g, rr, lin } = f, s = f.shine();
  g.fillStyle = lin(0, 0, 0, 32, ['#e0c49a', '#d2b088']); g.fillRect(0, 0, W, 32);
  g.fillStyle = 'rgba(120,80,40,0.14)'; for (let i = 0; i < 120; i++) g.fillRect(Math.random() * W, Math.random() * 32, 2.5, 0.6);
  g.fillStyle = '#8a5a34'; g.fillRect(0, 28, W, 4);
  for (const y of [6, 22]) {
    g.fillStyle = col; g.fillRect(0, y - 1.6, W, 3.2);
    g.fillStyle = '#3a2418';
    g.beginPath(); for (let x = 0; x <= W; x += 4) g.lineTo(x, y + (x % 8 ? -1.4 : 1.4)); g.lineTo(W, y + 3); g.lineTo(0, y + 3); g.closePath(); g.globalAlpha = 0.25; g.fill(); g.globalAlpha = 1;
    g.strokeStyle = '#f8ecd0'; g.lineWidth = 0.6; g.beginPath(); for (let x = 0; x <= W; x += 4) g.lineTo(x, y + (x % 8 ? -1.1 : 1.1)); g.stroke();
  }
  const mid = W / 2, px = W / circ, dw = 0.46 * px;   // the door the same size on a big hut as a small one
  rr(mid - dw / 2 - 0.8, 9, dw + 1.6, 19.5, [3, 3, 0, 0], '#3a2418');
  for (const ctx of [g, s]) { const r = ctx.createLinearGradient(0, 10, 0, 28); r.addColorStop(0, '#fff0b0'); r.addColorStop(1, '#f89a40'); ctx.fillStyle = r; ctx.beginPath(); ctx.roundRect(mid - dw / 2, 10, dw, 18, [2.5, 2.5, 0, 0]); ctx.fill(); }
  g.fillStyle = lin(mid - dw / 2, 0, mid + dw / 2, 0, ['#7a4a2a', '#9a6438']); g.fillRect(mid - dw / 2, 11, dw * 0.55, 17);
  g.fillStyle = 'rgba(40,20,10,0.4)'; for (let x = mid - dw / 2 + 1.2; x < mid + dw * 0.05; x += 1.6) g.fillRect(x, 11, 0.4, 17);
  for (const wx of [mid - 0.62 * px, mid + 0.62 * px]) {
    const ww = 0.24 * px;
    rr(wx - ww / 2 - 0.6, 12.4, ww + 1.2, 4.2, 1.2, '#3a2418');
    for (const ctx of [g, s]) { ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.roundRect(wx - ww / 2, 13, ww, 3, 1); ctx.fill(); }
  }
  return f.c;
}

/** A round mud hut over its footprint, its door to you: a mud wall with a painted band, a conical thatched roof with a
    knot of straw at its point and its rim trimmed in its colour, a lamp. A Gym Leader's home is a kasbah(). */
function rondavel(b, f, L, lit) {
  const leader = b.home && B.town?.homes?.[b.home]?.leader;
  if (leader) return kasbah(b, f, L, lit, leader);
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const rad = Math.min(f.w, f.h) / 2 - 0.15, h = 1.25, circ = rad * Math.PI * 2;
  const art = rondavelArt(b.roof, circ), wall = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 1 });
  lit.push(wall);
  mesh(new THREE.CylinderGeometry(rad + 0.15, rad + 0.22, 0.16, 28), std({ color: '#a07a50', roughness: 1 }), 0, 0.08, 0, g);
  mesh(new THREE.CylinderGeometry(rad, rad, h, 32, 1, false, -Math.PI, Math.PI * 2), wall, 0, 0.16 + h / 2, 0, g);
  const thatch = thatchArt(); thatch.repeat.set(circ / 1.1, 2);
  const cone = new THREE.ConeGeometry(rad + 0.42, 1.35, 32, 3, true); cone.translate(0, 0.675, 0);
  mesh(cone, std({ map: thatch, roughness: 1, side: THREE.DoubleSide }), 0, 0.16 + h - 0.08, 0, g);
  mesh(new THREE.TorusGeometry(rad + 0.38, 0.05, 6, 32), std({ color: b.roof, roughness: 0.8 }), 0, 0.16 + h - 0.06, 0, g).rotation.x = Math.PI / 2;
  mesh(new THREE.ConeGeometry(0.12, 0.35, 8), std({ color: '#a88a48', roughness: 1 }), 0, 0.16 + h + 1.35, 0, g);
  mesh(new THREE.SphereGeometry(0.07, 10, 8), std({ color: b.roof, roughness: 0.6 }), 0, 0.16 + h + 1.52, 0, g);
  const glow = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.8, roughness: 0.6 });
  lit.push(glow);
  mesh(new THREE.BoxGeometry(0.11, 0.16, 0.11), glow, rad * 0.55, 0.16 + 0.9, rad * 0.84 + 0.06, g).castShadow = false;
  return g;
}

/** A pointed arch on a canvas, `w2` its half width, from its springing at `top` down to `bot`. */
function pointedArch(ctx, cx, w2, top, bot) {
  ctx.beginPath(); ctx.moveTo(cx - w2, bot); ctx.lineTo(cx - w2, top + w2 * 0.9);
  ctx.quadraticCurveTo(cx - w2, top, cx, top - w2 * 0.45); ctx.quadraticCurveTo(cx + w2, top, cx + w2, top + w2 * 0.9);
  ctx.lineTo(cx + w2, bot); ctx.closePath();
}

/** A kasbah's wall, `w` x `h`: hand-smoothed red mud, a band of zigzags in the leader's colour under the parapet, a tiled
    dado in their colours along its foot, and arched windows at `wins` (fractions across), lit behind carved screens. */
function kasbahWall(w, h, ink, wins) {
  const W = Math.round(w * 24), Hp = Math.round(h * 24), f = fine(W, Hp, 6), { g, lin } = f, s = f.shine(), r = seeded(W + Hp);
  g.fillStyle = lin(0, 0, 0, Hp, ['#d69a66', '#c27e4c']); g.fillRect(0, 0, W, Hp);
  g.fillStyle = 'rgba(110,60,30,0.16)'; for (let i = 0; i < W * 1.5; i++) g.fillRect(r() * W, r() * Hp, 2 + r() * 3, 0.6);
  g.fillStyle = ink[1]; g.fillRect(0, 1.6, W, 3.4);
  g.strokeStyle = '#f8e8c8'; g.lineWidth = 0.7; g.beginPath(); for (let x = 0; x <= W; x += 4) g.lineTo(x, 3.3 + (x % 8 ? -1.1 : 1.1)); g.stroke();
  g.fillStyle = '#e8b040'; g.fillRect(0, 5, W, 0.8);
  if (Hp > 30) {
    for (let x = 0; x < W; x += 3) for (const [y, c, k] of [[Hp - 6.4, ink[2], 0], [Hp - 3.4, ink[1], 1]]) { g.fillStyle = (x / 3 + k) % 2 ? c : '#f4e8d0'; g.fillRect(x, y, 3, 3); }
    g.fillStyle = '#e8b040'; g.fillRect(0, Hp - 7.2, W, 0.8);
  }
  const top = Hp > 30 ? 12 : 9, bot = Hp > 30 ? Hp - 11 : Hp - 3;
  for (const u of wins) {
    const cx = u * W;
    g.fillStyle = '#7a4424'; pointedArch(g, cx, 4.6, top, bot + 0.8); g.fill();
    for (const ctx of [g, s]) { const gr = ctx.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, '#fff2c0'); gr.addColorStop(1, '#f0a040'); ctx.fillStyle = gr; pointedArch(ctx, cx, 3.6, top + 0.8, bot); ctx.fill(); }
    g.strokeStyle = ink[2]; g.lineWidth = 0.6; g.globalAlpha = 0.85;   // the mashrabiya: a lattice over the light
    g.save(); pointedArch(g, cx, 3.6, top + 0.8, bot); g.clip();
    for (let k = -12; k < 12; k += 2) { g.beginPath(); g.moveTo(cx + k, top - 2); g.lineTo(cx + k + 14, bot + 2); g.moveTo(cx + k + 14, top - 2); g.lineTo(cx + k, bot + 2); g.stroke(); }
    g.restore(); g.globalAlpha = 1;
    g.fillStyle = '#e8b040'; g.fillRect(cx - 5, bot + 0.8, 10, 1.2);
  }
  return f.c;
}

/** A kasbah's great portal (its pishtaq): a tall frame in the leader's deepest colour lined in gold, their crest at its
    head, a band of diamonds in their colour, and a great pointed arch lit inside, its carved doors standing open. */
function kasbahPortal(w, h, ink, letter) {
  const W = Math.round(w * 24), Hp = Math.round(h * 24), f = fine(W, Hp, 6), { g, rr, lin } = f, s = f.shine(), mid = W / 2;
  g.fillStyle = lin(0, 0, 0, Hp, ['#e4ac76', '#cc8a56']); g.fillRect(0, 0, W, Hp);
  rr(1.6, 3, W - 3.2, Hp - 3, 1, ink[2]);
  rr(2.8, 4.2, W - 5.6, Hp - 4.2, 0.8, '#e8b040');
  rr(3.8, 5.2, W - 7.6, Hp - 5.2, 0.6, lin(0, 0, 0, Hp, ['#e4ac76', '#cc8a56']));
  g.fillStyle = ink[1];
  for (let x = 6; x < W - 5; x += 4.4) { g.beginPath(); g.moveTo(x, 7.2); g.lineTo(x + 2, 8.8); g.lineTo(x, 10.4); g.lineTo(x - 2, 8.8); g.fill(); }
  const cy = 17;   // the crest
  for (const ctx of [g, s]) { ctx.fillStyle = '#e8b040'; ctx.beginPath(); ctx.arc(mid, cy, 5.4, 0, Math.PI * 2); ctx.fill(); }
  g.fillStyle = ink[1]; g.beginPath(); g.arc(mid, cy, 4.3, 0, Math.PI * 2); g.fill();
  g.strokeStyle = ink[0]; g.lineWidth = 0.5; g.beginPath(); g.arc(mid, cy, 3.5, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#ffffff'; g.font = 'bold 6px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, mid, cy + 0.4);
  const top = 30, w2 = Math.min(9.5, W / 2 - 6);
  g.fillStyle = ink[2]; pointedArch(g, mid, w2 + 1.6, top, Hp); g.fill();
  g.fillStyle = '#e8b040'; pointedArch(g, mid, w2 + 0.7, top, Hp); g.fill();
  for (const ctx of [g, s]) { const gr = ctx.createLinearGradient(0, top - 4, 0, Hp); gr.addColorStop(0, '#fff4c8'); gr.addColorStop(1, '#e8903a'); ctx.fillStyle = gr; pointedArch(ctx, mid, w2, top, Hp); ctx.fill(); }
  g.fillStyle = 'rgba(90,40,20,0.35)'; g.fillRect(mid - w2, Hp - 5, w2 * 2, 5);
  for (const sx of [-1, 1]) {   // the doors, folded back against the jambs, studded in gold
    const x0 = sx < 0 ? mid - w2 : mid + w2 - 4.2;
    g.fillStyle = lin(x0, 0, x0 + 4.2, 0, ['#5a2e18', '#7a4226']); g.fillRect(x0, top + 3, 4.2, Hp - top - 3);
    g.fillStyle = '#e8b040'; for (let y = top + 6; y < Hp - 2; y += 3.2) for (const dx of [1.2, 3]) { g.beginPath(); g.arc(x0 + dx, y, 0.45, 0, Math.PI * 2); g.fill(); }
  }
  return f.c;
}

/** A Gym Leader's home in Sunwell Bazaar (the user's ask, 2026-10-14: every leader's house "more grand and extravagant and
    aesthetic", each town in its own style; the village's are manor()s, the Landing's stiltManor()s): a kasbah of red mud
    on a raised plinth up steps, Djenné's buttresses up its front with ostrich eggs and gold on their pinnacles, wooden
    beams poking out of its sides, a great portal over its door with their crest at its head, striped awnings in their
    colours over its windows, brass lanterns lit in their colour, an upper storey set back with a gilded dome, palms in
    urns by the steps and two banners. Its lot is 5 x 4 tiles. A tap anywhere is its door. */
function kasbah(b, f, L, lit, leader) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const ink = LEADER_INK[leader] || ['#fff0c0', '#e0a030', '#5a3010'], letter = (b.name || leader)[0].toUpperCase();
  const W = f.w - 0.3, D = f.h - 0.25, P = 0.3;
  const mud = std({ color: '#c98a58', roughness: 1 }), pale = std({ color: '#dcaa78', roughness: 1 }), wood = std({ color: '#6a4228', roughness: 0.9 });
  const gold = std({ color: '#e8b040', metalness: 0.75, roughness: 0.28, emissive: new THREE.Color('#7a4a10'), emissiveIntensity: 0.35 });
  const inked = std({ color: ink[1], roughness: 0.6 }), deep = std({ color: ink[2], roughness: 0.7 }), egg = std({ color: '#f4ecdc', roughness: 0.5 });
  const lights = (art) => { const m = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.95 }); lit.push(m); return m; };
  const small = (m) => { m.castShadow = false; return m; };
  // the plinth: packed earth, a band in the leader's deepest colour and a gold line round it, steps up the front
  mesh(rbox(W, P, D, 0.04), pale, 0, P / 2, 0, g);
  small(mesh(new THREE.BoxGeometry(W + 0.03, 0.08, D + 0.03), deep, 0, P - 0.13, 0, g));
  small(mesh(new THREE.BoxGeometry(W + 0.05, 0.025, D + 0.05), gold, 0, P - 0.07, 0, g));
  for (let i = 0; i < 3; i++) mesh(rbox(1.4 - i * 0.08, P / 3, 0.22, 0.02), pale, 0, P / 6 + i * P / 3, D / 2 + 0.33 - i * 0.18, g);
  // the hall: its front lit, windows either side of the portal, a parapet of rounded merlons round its roof
  const hw = W - 0.7, hd = 2.0, hz = -0.5, H = 1.5, top = P + H, fz = hz + hd / 2;
  mesh(new THREE.BoxGeometry(hw, H, hd), [mud, mud, pale, mud, lights(kasbahWall(hw, H, ink, [0.125, 0.875])), mud], 0, P + H / 2, hz, g);
  mesh(new THREE.BoxGeometry(hw + 0.1, 0.08, hd + 0.1), wood, 0, top + 0.04, hz, g);
  const merlon = new THREE.ConeGeometry(0.075, 0.26, 4, 1); merlon.rotateY(Math.PI / 4); merlon.translate(0, 0.13, 0);
  const merlons = [];
  for (let x = -hw / 2 + 0.14; x <= hw / 2 - 0.1; x += 0.28) for (const z of [fz, hz - hd / 2]) merlons.push([x, top + 0.08, z]);
  for (let z = hz - hd / 2 + 0.28; z < fz - 0.1; z += 0.28) for (const x of [-hw / 2, hw / 2]) merlons.push([x, top + 0.08, z]);
  instancedIn(g, merlon, mud, merlons);
  // the toron: palm beams poking out of its side walls in rows
  const toron = new THREE.CylinderGeometry(0.02, 0.02, hw + 0.36, 5); toron.rotateZ(Math.PI / 2);
  const beamsAt = [];
  for (const y of [P + 0.55, P + 1.05]) for (let z = hz - hd / 2 + 0.3; z < fz - 0.1; z += 0.36) beamsAt.push([0, y, z]);
  instancedIn(g, toron, wood, beamsAt);
  // Djenné's buttresses up the corners and either side of the portal, pinnacles with an ostrich egg and gold on each
  const pillars = [[-hw / 2, fz], [hw / 2, fz], [-hw / 2, hz - hd / 2], [hw / 2, hz - hd / 2], [-0.95, fz + 0.06], [0.95, fz + 0.06]];
  for (const [x, z] of pillars) {
    const tall = H + (Math.abs(x) < 1.5 ? 0.75 : 0.55);
    const p = new THREE.CylinderGeometry(0.15, 0.24, tall, 4); p.rotateY(Math.PI / 4);
    mesh(p, mud, x, P + tall / 2, z, g);
    mesh(new THREE.ConeGeometry(0.13, 0.3, 4).rotateY(Math.PI / 4), mud, x, P + tall + 0.15, z, g);
    small(mesh(new THREE.SphereGeometry(0.06, 10, 8), egg, x, P + tall + 0.33, z, g)).scale.y = 1.35;
    small(mesh(new THREE.ConeGeometry(0.025, 0.12, 6), gold, x, P + tall + 0.46, z, g));
  }
  // the portal, standing proud of the front and up past the parapet, crowned in merlons, lanterns either side of it
  const pw = 1.5, ph = H + 0.8;
  mesh(new THREE.BoxGeometry(pw, ph, 0.26), [mud, mud, pale, mud, lights(kasbahPortal(pw, ph, ink, letter)), mud], 0, P + ph / 2, fz + 0.13, g);
  const crown = [];
  for (let x = -pw / 2 + 0.12; x <= pw / 2 - 0.1; x += 0.25) crown.push([x, P + ph, fz + 0.2]);
  instancedIn(g, merlon, pale, crown);
  const glow = std({ color: ink[1], emissive: new THREE.Color(ink[0]), emissiveIntensity: 0.8, roughness: 0.3, transparent: true, opacity: 0.92 });
  lit.push(glow);
  const brass = std({ color: '#c8963a', metalness: 0.7, roughness: 0.3 });
  const lantern = (x, y, z) => {
    small(mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.2, 6), glow, x, y, z, g));
    small(mesh(new THREE.ConeGeometry(0.09, 0.14, 6), brass, x, y + 0.17, z, g));
    small(mesh(new THREE.TorusGeometry(0.03, 0.008, 4, 10), brass, x, y + 0.27, z, g));
    small(mesh(new THREE.ConeGeometry(0.05, 0.07, 6), brass, x, y - 0.13, z, g)).rotation.x = Math.PI;
  };
  for (const sx of [-1, 1]) {   // hung off the buttresses either side of the portal
    small(mesh(new THREE.BoxGeometry(0.03, 0.03, 0.3), brass, sx * 0.95, P + 1.28, fz + 0.3, g));
    lantern(sx * 0.95, P + 1.05, fz + 0.42);
  }
  // striped awnings in the leader's colours over the windows, on poles banded in gold
  const awn = std({ map: stripeArt(ink[1], 4), roughness: 0.9, side: THREE.DoubleSide });
  for (const sx of [-1, 1]) {
    const x = sx * 1.5;
    const a = mesh(new THREE.BoxGeometry(0.72, 0.03, 0.62), awn, x, P + 1.2, fz + 0.28, g);
    a.rotation.x = 0.38;
    for (const dx of [-0.32, 0.32]) {
      mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.08, 6), inked, x + dx, P + 0.54, fz + 0.56, g);
      small(mesh(new THREE.SphereGeometry(0.04, 8, 6), gold, x + dx, P + 1.1, fz + 0.56, g));
    }
  }
  // the upper storey, set back, lit, its parapet of merlons, a gilded dome on a drum with a gold finial
  const uw = 2.3, ud = 1.3, uh = 0.95, uz = hz - 0.2, ut = top + 0.08 + uh;
  mesh(new THREE.BoxGeometry(uw, uh, ud), [mud, mud, pale, mud, lights(kasbahWall(uw, uh, ink, [0.2, 0.5, 0.8])), mud], 0, top + 0.08 + uh / 2, uz, g);
  mesh(new THREE.BoxGeometry(uw + 0.08, 0.06, ud + 0.08), wood, 0, ut + 0.03, uz, g);
  const upper = [];
  for (let x = -uw / 2 + 0.13; x <= uw / 2 - 0.1; x += 0.26) for (const z of [uz + ud / 2, uz - ud / 2]) upper.push([x, ut + 0.06, z]);
  instancedIn(g, merlon, mud, upper);
  mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 20), pale, 0, ut + 0.17, uz, g);
  small(mesh(new THREE.TorusGeometry(0.42, 0.02, 4, 24), gold, 0, ut + 0.27, uz, g)).rotation.x = Math.PI / 2;
  mesh(new THREE.SphereGeometry(0.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, ut + 0.28, uz, g).scale.y = 1.3;
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), gold, 0, ut + 0.95, uz, g);
  small(mesh(new THREE.SphereGeometry(0.06, 10, 8), gold, 0, ut + 1.05, uz, g));
  small(mesh(new THREE.ConeGeometry(0.035, 0.16, 8), gold, 0, ut + 1.17, uz, g));
  // date palms in clay urns by the steps
  const fronds = [];
  for (const sx of [-1, 1]) {
    const x = sx * 0.9, z = D / 2 - 0.25;
    mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.3, 12), std({ color: '#b0582e', roughness: 0.9 }), x, P + 0.15, z, g);
    small(mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 14), gold, x, P + 0.3, z, g)).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.7, 6), wood, x, P + 0.6, z, g);
    for (let k = 0; k < 7; k++) fronds.push([x, P + 0.95, z, k / 7 * Math.PI * 2]);
  }
  const frond = new THREE.ConeGeometry(0.055, 0.45, 4); frond.scale(1, 1, 0.3); frond.translate(0, 0.22, 0); frond.rotateX(1.15);
  instancedIn(g, frond, std({ color: '#5a8a34', roughness: 0.85, flatShading: true }), fronds);
  // two banners at the plinth's front corners, swaying a little
  const cloth = std({ map: texOf(noboriArt(ink, letter)), side: THREE.DoubleSide, roughness: 0.95 });
  const flags = [-1, 1].map(s => {
    const x = s * (W / 2 - 0.08), z = D / 2 - 0.12, tall = 2.6;
    mesh(new THREE.CylinderGeometry(0.035, 0.045, tall, 8), wood, x, P + tall / 2, z, g);
    small(mesh(new THREE.SphereGeometry(0.06, 10, 8), gold, x, P + tall + 0.04, z, g));
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 6), wood, x - s * 0.22, P + tall - 0.1, z, g).rotation.z = Math.PI / 2;
    const hang = new THREE.Group();
    hang.position.set(x - s * 0.22, P + tall - 0.12, z + 0.02);
    g.add(hang);
    small(mesh(new THREE.PlaneGeometry(0.4, 1.5), cloth, 0, -0.75, 0, hang));
    return hang;
  });
  B.ticks.push((now) => { if (!calm) flags.forEach((h, i) => { h.rotation.y = Math.sin(now / 900 + i * 2) * 0.12; h.rotation.x = Math.sin(now / 1300 + i) * 0.04; }); });
  return g;
}

/** Stripes for a tent's canvas, `col` and cream, down it (u across). */
function stripeArt(col, n = 8) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 32;
  const g = c.getContext('2d');
  for (let i = 0; i < n * 2; i++) { g.fillStyle = i % 2 ? '#f4e8d0' : col; g.fillRect(i * 128 / (n * 2), 0, 128 / (n * 2) + 0.5, 32); }
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 28, 128, 4);
  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** The tent's front: a doorway with its flaps tied back, rugs and lamplight inside. */
function tentFront(w, col) {
  const W = Math.round(w * 24), f = fine(W, 36, 6), { g, rr, lin } = f, s = f.shine();
  for (let i = 0; i < W / 6; i++) { g.fillStyle = i % 2 ? '#f4e8d0' : col; g.fillRect(i * 6, 0, 6.2, 36); }
  const mid = W / 2;
  for (const ctx of [g, s]) { const r = ctx.createRadialGradient(mid, 26, 2, mid, 26, 16); r.addColorStop(0, '#fff0b8'); r.addColorStop(1, '#c8702a'); ctx.fillStyle = r; ctx.beginPath(); ctx.moveTo(mid - 9, 36); ctx.lineTo(mid - 4, 8); ctx.lineTo(mid + 4, 8); ctx.lineTo(mid + 9, 36); ctx.fill(); }
  rr(mid - 7, 31, 14, 4, 0.6, '#a83a3a'); g.fillStyle = '#e8c050'; g.fillRect(mid - 6, 32.6, 12, 0.6);
  g.fillStyle = shadeOf(col, -1);
  g.beginPath(); g.moveTo(mid - 4, 7); g.quadraticCurveTo(mid - 12, 18, mid - 11, 36); g.lineTo(mid - 13, 36); g.lineTo(mid - 6, 7); g.fill();
  g.beginPath(); g.moveTo(mid + 4, 7); g.quadraticCurveTo(mid + 12, 18, mid + 11, 36); g.lineTo(mid + 13, 36); g.lineTo(mid + 6, 7); g.fill();
  g.fillStyle = '#e8c050'; g.beginPath(); g.arc(mid - 10.5, 20, 0.9, 0, Math.PI * 2); g.arc(mid + 10.5, 20, 0.9, 0, Math.PI * 2); g.fill();
  return f.c;
}

/** A Poké Ball, `r` its radius, its button to the front and lit a little at night. */
function pokeBall(r, lit) {
  const g = new THREE.Group(), black = std({ color: '#201818', roughness: 0.5 });
  const btn = std({ color: '#ffffff', emissive: new THREE.Color('#fff4d8'), emissiveIntensity: 0.5, roughness: 0.3 });
  lit.push(btn);
  mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#e03028', roughness: 0.35 }), 0, 0, 0, g);
  mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std({ color: '#f6f2ea', roughness: 0.4 }), 0, 0, 0, g);
  mesh(new THREE.CylinderGeometry(r * 1.015, r * 1.015, r * 0.15, 24), black, 0, 0, 0, g);
  mesh(new THREE.CylinderGeometry(r * 0.36, r * 0.36, r * 0.2, 16), black, 0, 0, r * 0.93, g).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(r * 0.23, r * 0.23, r * 0.24, 16), btn, 0, 0, r * 0.97, g).rotation.x = Math.PI / 2;
  return g;
}

/** A little Poké Ball painted on a canvas. */
function ballIcon(g, cx, cy, r) {
  g.fillStyle = '#201818'; g.beginPath(); g.arc(cx, cy, r + 0.7, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#e83828'; g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.fill();
  g.fillStyle = '#f8f4ec'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI); g.fill();
  g.fillStyle = '#201818'; g.fillRect(cx - r, cy - r * 0.12, r * 2, r * 0.24);
  g.beginPath(); g.arc(cx, cy, r * 0.38, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f8f4ec'; g.beginPath(); g.arc(cx, cy, r * 0.22, 0, Math.PI * 2); g.fill();
}

/** A trade house's hanging board: TRADE in big cream letters on a deep shade of its colour, a Poké Ball either side. */
function tradeBoardArt(col) {
  const f = fine(52, 22, 8), { g, rr, lin } = f, deep = shadeOf(col, -1);
  rr(0, 0, 52, 22, 2.4, '#d8a838');
  rr(1.4, 1.4, 49.2, 19.2, 1.6, lin(0, 0, 0, 22, [deep, shadeOf(deep, -1)]));
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.roundRect(1.4, 1.4, 49.2, 19.2, 1.6); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 11px sans-serif';
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillText('TRADE', 26.4, 9.4, 30);
  g.fillStyle = '#fff6e0'; g.fillText('TRADE', 26, 9, 30);
  g.font = 'bold 7px sans-serif'; g.fillStyle = '#ffe08a'; g.fillText('HOUSE', 26, 17, 30);
  for (const cx of [7, 45]) ballIcon(g, cx, 11, 4.2);
  return f.c;
}

/** Every town's trade house wears one (the user's ask, 2026-10-14: "all trade homes should have some kind of sign and a
    pokeball sign too"): a post at its front corner away from the door, a Poké Ball turning slowly on top, and a TRADE
    board swinging off an arm. */
function tradePost(b, f, lit) {
  const g = new THREE.Group(), side = b.door && tileX(b.door.x) > f.cx ? -1 : 1, H = 2.2;
  g.position.set(f.cx + side * (f.w / 2 - 0.16), 0, f.cz + f.h / 2 - 0.16);
  B.group.add(g);
  const wood = std({ color: '#5a3a24', roughness: 0.85 }), brass = std({ color: '#d8a838', metalness: 0.7, roughness: 0.3 });
  mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.14, 12), std({ color: '#8a8478', roughness: 1 }), 0, 0.07, 0, g);
  mesh(new THREE.CylinderGeometry(0.055, 0.07, H, 10), wood, 0, H / 2, 0, g);
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 12), brass, 0, H + 0.03, 0, g);
  const ball = pokeBall(0.3, lit);
  ball.position.y = H + 0.34; g.add(ball);
  mesh(new THREE.BoxGeometry(0.95, 0.06, 0.06), wood, side * 0.45, H - 0.3, 0, g);
  mesh(new THREE.SphereGeometry(0.05, 10, 8), brass, side * 0.92, H - 0.3, 0, g);
  const swing = new THREE.Group();
  swing.position.set(side * 0.5, H - 0.33, 0.03); g.add(swing);
  for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 4), brass, sx * 0.4, -0.07, 0, swing).castShadow = false;
  const board = panel(tradeBoardArt(b.roof || '#c83a3a'), 1.18, 0.5, 0, 0, 0);
  board.removeFromParent(); board.position.set(0, -0.39, 0); swing.add(board);
  B.ticks.push((now) => { if (!calm) { ball.rotation.y = Math.sin(now / 1400) * 0.5; swing.rotation.z = Math.sin(now / 900) * 0.04; } });
  return g;
}

/** Persian's marquee: a crimson board with an arched top, gold-rimmed and studded, Persian's red charm in gold at its
    head, the bazaar's name big in cream and TRADE HOUSE under it between two Poké Balls. */
function marqueeArt(name, col) {
  const W = 120, H = 36, f = fine(W, H, 8), { g, lin } = f;
  const shape = (ctx, i) => { ctx.beginPath(); ctx.moveTo(i, H - i); ctx.lineTo(i, 12 + i * 0.5); ctx.quadraticCurveTo(W * 0.25, 7 + i, W / 2, i); ctx.quadraticCurveTo(W * 0.75, 7 + i, W - i, 12 + i * 0.5); ctx.lineTo(W - i, H - i); ctx.closePath(); };
  g.fillStyle = '#5a2a16'; shape(g, 0); g.fill();
  g.fillStyle = '#e8b040'; shape(g, 1.3); g.fill();
  g.fillStyle = lin(0, 0, 0, H, [shadeOf(col, -1), '#4a0e1c']); shape(g, 2.6); g.fill();
  g.fillStyle = '#e8b040';
  for (let x = 8; x < W - 6; x += 7) { g.beginPath(); g.arc(x, H - 4.6, 0.8, 0, Math.PI * 2); g.fill(); }
  g.beginPath(); g.ellipse(W / 2, 8.4, 4.6, 3.6, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#d81830'; g.beginPath(); g.ellipse(W / 2, 8.4, 3, 2.2, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(W / 2 - 1, 7.6, 1, 0.6, 0, 0, Math.PI * 2); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 12px sans-serif';
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText(name, W / 2 + 0.5, 19.5, 100);
  g.fillStyle = '#fff4d8'; g.fillText(name, W / 2, 19, 100);
  g.font = 'bold 7px sans-serif'; g.fillStyle = '#f8d060'; g.fillText('TRADE HOUSE', W / 2, 27.6, 60);
  for (const cx of [W / 2 - 34, W / 2 + 34]) ballIcon(g, cx, 27.6, 3.4);
  return f.c;
}

/** Persian's bazaar, a great striped tent over its footprint: canvas walls, a peaked roof on a centre pole with a pennant,
    a scalloped valance, its doorway open and lit, brass lamps hung either side, its name over the door. */
function bazaarTent(b, f, L, lit) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const w = f.w - 0.3, d = f.h - 0.5, h = 1.2, cream = std({ color: '#f4e8d0', roughness: 0.95 });
  const side = stripeArt(b.roof, 6), sideM = std({ map: side, roughness: 0.95 });
  side.repeat.set(1, 1);
  const art = tentFront(w, b.roof), front = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.7, roughness: 0.95 });
  lit.push(front);
  mesh(new THREE.BoxGeometry(w, h, d), [sideM, sideM, cream, cream, front, sideM], 0, h / 2, 0, g);
  const roofTex = stripeArt(b.roof, 12);
  const roof = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1, true); roof.rotateY(Math.PI / 4); roof.translate(0, 0.5, 0);
  const top = mesh(roof, std({ map: roofTex, roughness: 0.9, side: THREE.DoubleSide, flatShading: true }), 0, h, 0, g);
  top.scale.set(w + 0.5, 1.4, d + 0.5);
  const val = new THREE.Group(); val.position.y = h - 0.02; g.add(val);
  const valMat = std({ color: shadeOf(b.roof, -1), roughness: 0.9, side: THREE.DoubleSide }), scallop = new THREE.CircleGeometry(0.16, 10, Math.PI, Math.PI);
  for (const [sx, sz, len] of [[0, 1, w + 0.5], [0, -1, w + 0.5], [1, 0, d + 0.5], [-1, 0, d + 0.5]]) {
    const n = Math.round(len / 0.32);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n - 0.5, m = mesh(scallop, valMat, sx * (w + 0.5) / 2 + (sz ? t * len : 0), 0, sz * (d + 0.5) / 2 + (sx ? t * len : 0), val);
      m.rotation.y = sx ? Math.PI / 2 : 0; m.castShadow = false;
    }
  }
  const brass = std({ color: '#d8a838', metalness: 0.7, roughness: 0.3 });
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 8), brass, 0, h + 1.65, 0, g);
  const flag = mesh(new THREE.PlaneGeometry(0.42, 0.22), std({ color: '#f8d040', roughness: 0.8, side: THREE.DoubleSide }), 0.22, h + 1.88, 0, g);
  flag.castShadow = false;
  B.ticks.push((now) => { if (!calm) flag.rotation.y = Math.sin(now / 600) * 0.35; });
  for (const sx of [-1, 1]) {
    const glow = std({ color: '#f8b040', emissive: new THREE.Color('#ffb860'), emissiveIntensity: 0.8, roughness: 0.4 });
    lit.push(glow);
    mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), brass, sx * (w / 2 - 0.25), h - 0.16, d / 2 + 0.3, g);
    const lamp = mesh(new THREE.SphereGeometry(0.1, 12, 8), glow, sx * (w / 2 - 0.25), h - 0.4, d / 2 + 0.3, g);
    lamp.scale.y = 1.2; lamp.castShadow = false;
    mesh(new THREE.ConeGeometry(0.08, 0.1, 10), brass, sx * (w / 2 - 0.25), h - 0.28, d / 2 + 0.3, g);
  }
  mesh(new THREE.BoxGeometry(1.6, 0.03, 0.8), std({ color: '#a83a3a', roughness: 1 }), 0, 0.015, d / 2 + 0.45, g).castShadow = false;
  // (the user's ask, 2026-10-14: "Persian needs a better trade sign") a great marquee over the tent's front on two carved
  // posts at its corners, a Poké Ball turning on top; it stands in for the town's tradePost()
  const mw = w + 0.2, mz = f.h / 2 - 0.12, mh = (mw - 0.16) * 36 / 120, carved = std({ color: '#6a3a22', roughness: 0.8 });
  for (const sx of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.55, 10), carved, sx * mw / 2, 1.275, mz, g);
    mesh(new THREE.SphereGeometry(0.1, 12, 10), brass, sx * mw / 2, 2.6, mz, g);
  }
  g.attach(panel(marqueeArt(b.name || 'BAZAAR', b.roof), mw - 0.16, mh, f.cx, 1.55 + mh / 2, f.cz + mz + 0.02));
  const ball = pokeBall(0.26, lit);
  ball.position.set(0, 1.55 + mh + 0.3, mz); g.add(ball);
  B.ticks.push((now) => { if (!calm) ball.rotation.y = Math.sin(now / 1400) * 0.5; });
  g.userData.signed = true;
  return g;
}

/** The caravanserai's front: sandstone blocks, a great pointed arch lit inside, small arched windows, a carved band. */
function serailFront(w) {
  const W = Math.round(w * 24), f = fine(W, 44, 6), { g, rr, lin } = f, s = f.shine(), r = seeded(W);
  g.fillStyle = '#dcb888'; g.fillRect(0, 0, W, 44);
  for (let y = 0; y < 44; y += 5) for (let x = -(y / 5 % 2) * 4; x < W; x += 8) { g.fillStyle = ['#e4c294', '#d4ae7c', '#ceaa78'][Math.floor(r() * 3)]; g.fillRect(x + 0.3, y + 0.3, 7.4, 4.4); }
  g.fillStyle = '#b07a4a'; g.fillRect(0, 6, W, 2.4);
  for (let x = 2; x < W; x += 5) { g.fillStyle = '#e8c860'; g.beginPath(); g.moveTo(x, 6); g.lineTo(x + 1.5, 7.2); g.lineTo(x, 8.4); g.lineTo(x - 1.5, 7.2); g.fill(); }
  const arch = (ctx, cx, w2, top, bot) => { ctx.beginPath(); ctx.moveTo(cx - w2, bot); ctx.lineTo(cx - w2, top + w2 * 0.9); ctx.quadraticCurveTo(cx - w2, top, cx, top - w2 * 0.35); ctx.quadraticCurveTo(cx + w2, top, cx + w2, top + w2 * 0.9); ctx.lineTo(cx + w2, bot); ctx.closePath(); };
  const mid = W / 2;
  g.fillStyle = '#9a6a3e'; arch(g, mid, 10.5, 15, 44); g.fill();
  for (const ctx of [g, s]) { const gr = ctx.createLinearGradient(0, 14, 0, 44); gr.addColorStop(0, '#fff0c0'); gr.addColorStop(1, '#e8903a'); ctx.fillStyle = gr; arch(ctx, mid, 9, 16.5, 44); ctx.fill(); }
  g.fillStyle = 'rgba(90,50,20,0.55)'; g.fillRect(mid - 9, 36, 18, 8);
  for (let i = 0; i < 3; i++) { g.fillStyle = '#e8c050'; g.fillRect(mid - 6 + i * 6, 37, 0.8, 7); }
  for (const wx of [mid - 22, mid - 32, mid + 22, mid + 32]) {
    if (wx < 4 || wx > W - 4) continue;
    g.fillStyle = '#9a6a3e'; arch(g, wx, 3.2, 17, 28); g.fill();
    for (const ctx of [g, s]) { ctx.fillStyle = '#ffd890'; arch(ctx, wx, 2.4, 18, 27.5); ctx.fill(); }
  }
  return f.c;
}

/** The caravanserai: a sandstone hall of blocks round a courtyard, crenellated, a great arch for its gate, a gilded dome
    over one corner, a wind tower over the other, its name over the arch, striped awnings and torches. */
function caravanserai(b, f, L, lit) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const w = f.w - 0.3, d = f.h - 0.5, h = 1.9;
  const stone = std({ color: '#d8b484', roughness: 1 }), dark = std({ color: '#b08458', roughness: 1 });
  const art = serailFront(w), front = std({ map: texOf(art), emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(art.glow), emissiveIntensity: 0.65, roughness: 1 });
  lit.push(front);
  mesh(rbox(w + 0.3, 0.18, d + 0.3, 0.04), dark, 0, 0.09, 0, g);
  mesh(new THREE.BoxGeometry(w, h, d), [stone, stone, stone, stone, front, stone], 0, 0.18 + h / 2, 0, g);
  mesh(new THREE.BoxGeometry(w + 0.12, 0.1, d + 0.12), dark, 0, 0.18 + h, 0, g);
  const n = Math.round(w / 0.42);
  for (let i = 0; i < n; i++) for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.22, 0.22, 0.16), stone, -w / 2 + (i + 0.5) * w / n, 0.18 + h + 0.16, sz * (d / 2 - 0.02), g);
  for (let i = 0; i < Math.round(d / 0.42); i++) for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.16, 0.22, 0.22), stone, sx * (w / 2 - 0.02), 0.18 + h + 0.16, -d / 2 + (i + 0.5) * d / Math.round(d / 0.42), g);
  const gold = std({ color: b.roof, metalness: 0.5, roughness: 0.35 });
  mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.4, 20), stone, -w / 2 + 0.95, 0.18 + h + 0.2, -0.2, g);
  mesh(new THREE.SphereGeometry(0.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), gold, -w / 2 + 0.95, 0.18 + h + 0.4, -0.2, g).scale.y = 1.25;
  mesh(new THREE.ConeGeometry(0.06, 0.4, 8), gold, -w / 2 + 0.95, 0.18 + h + 1.35, -0.2, g);
  mesh(new THREE.BoxGeometry(0.7, 1.2, 0.7), stone, w / 2 - 0.7, 0.18 + h + 0.6, -0.3, g);   // the wind tower, its vents dark
  for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(0.42, 0.42, 0.02), std({ color: '#5a3a22', roughness: 1 }), w / 2 - 0.7, 0.18 + h + 0.9, -0.3 + sz * 0.36, g);
  mesh(new THREE.BoxGeometry(0.82, 0.08, 0.82), dark, w / 2 - 0.7, 0.18 + h + 1.24, -0.3, g);
  const awn = std({ map: stripeArt('#2e7a9a', 4), roughness: 0.9, side: THREE.DoubleSide });
  for (const sx of [-1, 1]) {
    const a = mesh(new THREE.BoxGeometry(0.9, 0.04, 0.5), awn, sx * (w / 2 - 0.95), 0.18 + 1.25, d / 2 + 0.22, g);
    a.rotation.x = 0.4;
    const glow = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.8, roughness: 0.6 });
    lit.push(glow);
    mesh(new THREE.BoxGeometry(0.12, 0.18, 0.12), glow, sx * 0.85, 0.18 + 1.05, d / 2 + 0.08, g).castShadow = false;
  }
  if (b.name) g.attach(panel(signArt(b.name), 1.9, 0.4, f.cx, 0.18 + h - 0.22, f.cz + d / 2 + 0.03));
  return g;
}

/** A caravan wagon, lengthwise over its footprint: a plank bed on four spoked wheels, a canvas hood on hoops in its
    colour, its front laced shut with a lamp hung on it, the drawbar resting on the ground, a barrel strapped to its side. */
function wagon(b, f, L, lit) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const len = f.w - 0.5, wide = f.h - 0.75, wood = std({ color: '#7a5434', roughness: 0.9 }), dark = std({ color: '#3a2618', roughness: 0.9 });
  const iron = std({ color: '#3a3438', metalness: 0.5, roughness: 0.5 });
  mesh(rbox(len, 0.3, wide, 0.03), wood, 0, 0.62, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wheel = new THREE.Group();
    wheel.position.set(sx * (len / 2 - 0.35), 0.38, sz * (wide / 2 + 0.06));
    g.add(wheel);
    mesh(new THREE.TorusGeometry(0.34, 0.04, 6, 20), dark, 0, 0, 0, wheel);
    for (let k = 0; k < 6; k++) mesh(new THREE.BoxGeometry(0.03, 0.66, 0.03), wood, 0, 0, 0, wheel).rotation.z = k * Math.PI / 6;
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), iron, 0, 0, 0, wheel).rotation.x = Math.PI / 2;
  }
  const canvas = std({ color: b.roof, roughness: 0.95, side: THREE.DoubleSide });
  const R = wide / 2 + 0.06, hood = new THREE.CylinderGeometry(R, R, len - 0.1, 20, 1, true, 0, Math.PI);
  hood.rotateZ(Math.PI / 2);
  mesh(hood, canvas, 0, 0.78, 0, g).scale.set(1, 1.5, 1);
  for (let i = 0; i < 4; i++) {
    const hoop = mesh(new THREE.TorusGeometry(R + 0.01, 0.022, 5, 18, Math.PI), wood, -len / 2 + 0.1 + i * (len - 0.2) / 3, 0.78, 0, g);
    hoop.scale.set(1, 1.5, 1); hoop.rotation.y = Math.PI / 2;
  }
  const endArt = fine(24, 24, 6), { g: eg } = endArt;
  eg.fillStyle = shadeOf(b.roof, -1); eg.beginPath(); eg.arc(12, 24, 12, Math.PI, 0); eg.fill();
  eg.strokeStyle = '#5a3a22'; eg.lineWidth = 0.6; for (let y = 14; y < 24; y += 2.4) { eg.beginPath(); eg.moveTo(10, y); eg.lineTo(14, y + 1.2); eg.moveTo(14, y); eg.lineTo(10, y + 1.2); eg.stroke(); }
  for (const sx of [-1, 1]) { const end = panel(endArt.c, 2 * R, 3 * R, f.cx + sx * (len / 2 - 0.06), 0.77 + 1.5 * R, f.cz); end.rotation.y = sx * Math.PI / 2; g.attach(end); }
  const bar = mesh(new THREE.BoxGeometry(1.1, 0.06, 0.06), wood, len / 2 + 0.5, 0.35, 0, g);
  bar.rotation.z = 0.45;
  const glow = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.8, roughness: 0.6 });
  lit.push(glow);
  mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), glow, len / 2 + 0.02, 1.15, wide / 2 - 0.1, g).castShadow = false;
  mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.38, 12), wood, -0.2, 0.62, wide / 2 + 0.2, g);
  return g;
}

/** The windpump by the watering hole: a lattice tower of four legs and braces, its fan of blades turning in the wind with
    a tail vane, a pipe down to a stone trough. */
function windpump(f, L) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const iron = std({ color: '#7a7a82', metalness: 0.5, roughness: 0.5 }), rust = std({ color: '#a05a34', metalness: 0.3, roughness: 0.7 });
  const top = 3.1;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = mesh(new THREE.BoxGeometry(0.06, top + 0.1, 0.06), iron, sx * 0.42, top / 2, sz * 0.42, g);
    leg.rotation.z = -sx * 0.11; leg.rotation.x = sz * 0.11;
  }
  for (let k = 1; k < 5; k++) {
    const y = k * top / 5, s = 0.42 - k * 0.07;
    for (const sz of [-1, 1]) mesh(new THREE.BoxGeometry(s * 2, 0.035, 0.035), iron, 0, y, sz * s, g);
    for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.035, 0.035, s * 2), iron, sx * s, y, 0, g);
  }
  mesh(new THREE.BoxGeometry(0.22, 0.14, 0.4), rust, 0, top + 0.05, 0, g);
  const fan = new THREE.Group();
  fan.position.set(0, top + 0.12, 0.26);
  g.add(fan);
  const blade = std({ color: '#d8d8dc', metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide });
  for (let k = 0; k < 14; k++) {
    const m = mesh(new THREE.BoxGeometry(0.1, 0.55, 0.01), blade, 0, 0, 0, fan);
    m.geometry.translate(0, 0.38, 0); m.rotation.z = k / 14 * Math.PI * 2; m.rotation.y = 0.35;
  }
  mesh(new THREE.TorusGeometry(0.62, 0.015, 4, 28), iron, 0, 0, 0, fan);
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 10), rust, 0, 0, 0, fan).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.02, 0.4, 0.6), rust, 0, top + 0.12, -0.55, g);
  mesh(new THREE.CylinderGeometry(0.02, 0.02, top, 6), iron, 0.12, top / 2, 0.12, g);
  mesh(rbox(0.9, 0.3, 0.45, 0.04), std({ color: '#a8a090', roughness: 1 }), 0.15, 0.15, 0.62, g);
  const w = mesh(new THREE.BoxGeometry(0.78, 0.02, 0.33), std({ color: '#5a8a80', roughness: 0.1, metalness: 0.2 }), 0.15, 0.29, 0.62, g);
  w.castShadow = false;
  B.ticks.push((now) => { if (!calm) fan.rotation.z = -now / 900; });
  return g;
}

/** A kopje over its footprint: great rounded granite boulders heaped up, one balanced on top, an acacia growing out of
    the cracks, grass round its foot. */
function kopje(f) {
  const g = new THREE.Group();
  g.position.set(f.cx, 0, f.cz);
  B.group.add(g);
  const rnd = seeded(13), cols = SAVANNA.rock;
  const stone = (x, y, z, s, sq) => {
    const m = mesh(new THREE.DodecahedronGeometry(1, 1), std({ color: cols[Math.floor(rnd() * cols.length)], roughness: 1, flatShading: true }), x, y, z, g);
    m.scale.set(s, s * sq, s * (0.8 + rnd() * 0.3)); m.rotation.set(rnd() * 0.4, rnd() * 3, rnd() * 0.3);
    return m;
  };
  stone(-0.4, 0.45, 0.1, 0.85, 0.65); stone(0.55, 0.4, -0.2, 0.75, 0.6); stone(0.1, 0.35, 0.65, 0.55, 0.6);
  stone(-0.1, 1.15, -0.15, 0.6, 0.75); stone(0.15, 1.75, -0.1, 0.32, 0.9);
  stone(-0.9, 0.2, 0.7, 0.3, 0.6); stone(0.95, 0.18, 0.6, 0.25, 0.7);
  const bark = std({ color: '#5a4030', roughness: 1 });
  const t = mesh(new THREE.CylinderGeometry(0.04, 0.07, 1.1, 6), bark, 0.62, 1.35, -0.35, g); t.rotation.z = -0.35;
  const crown = mesh(new THREE.IcosahedronGeometry(1, 1), std({ color: SAVANNA.leaf[0], roughness: 0.9, flatShading: true }), 0.85, 1.95, -0.35, g);
  crown.scale.set(0.75, 0.14, 0.6);
  return g;
}

/** A sun disc for the gate: gold rays round a face. */
function sunDiscArt() {
  const f = fine(48, 48, 8), { g } = f, s = f.shine();
  for (const ctx of [g, s]) {
    ctx.save(); ctx.translate(24, 24);
    for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.fillStyle = i % 2 ? '#f8c040' : '#e89a28'; ctx.beginPath(); ctx.moveTo(-3, 9); ctx.lineTo(0, i % 2 ? 23 : 20); ctx.lineTo(3, 9); ctx.fill(); }
    const r = ctx.createRadialGradient(-3, -3, 1, 0, 0, 12); r.addColorStop(0, '#fff4b0'); r.addColorStop(1, '#e8a028');
    ctx.fillStyle = r; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  g.strokeStyle = '#8a5418'; g.lineWidth = 1; g.beginPath(); g.arc(24, 24, 11, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#8a5418'; g.beginPath(); g.arc(20, 22, 1.2, 0, Math.PI * 2); g.arc(28, 22, 1.2, 0, Math.PI * 2); g.fill();
  g.lineWidth = 1; g.beginPath(); g.arc(24, 25, 4, 0.3, Math.PI - 0.3); g.stroke();
  return f.c;
}

/** The sun gate out, towards Sun Rock: two sandstone pillars, stepped, a lintel carved with the town's name, a gold sun
    disc on top, striped banners hung from the lintel and a torch on each pillar. The way between is `R.exitAt`. */
function sunGate(x, z, span, tall, name, L, lit) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  B.group.add(g);
  const stone = std({ color: '#d8b080', roughness: 1 }), dark = std({ color: '#a87a4c', roughness: 1 });
  for (const sx of [-1, 1]) {
    const px = sx * span / 2;
    mesh(new THREE.BoxGeometry(0.62, 0.3, 0.62), dark, px, 0.15, 0, g);
    mesh(new THREE.BoxGeometry(0.44, tall, 0.44), stone, px, 0.3 + tall / 2, 0, g);
    mesh(new THREE.BoxGeometry(0.54, 0.12, 0.54), dark, px, 0.3 + tall * 0.7, 0, g);
    const glow = std({ color: '#f8a040', emissive: new THREE.Color('#ffb060'), emissiveIntensity: 0.9, roughness: 0.6 });
    lit.push(glow);
    mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.16, 8), dark, px, 0.3 + tall * 0.55, 0.3, g);
    const flame = mesh(new THREE.ConeGeometry(0.08, 0.22, 8), glow, px, 0.3 + tall * 0.55 + 0.17, 0.3, g);
    flame.castShadow = false;
  }
  mesh(rbox(span + 0.9, 0.34, 0.5, 0.04), stone, 0, 0.3 + tall + 0.17, 0, g);
  mesh(new THREE.BoxGeometry(span + 1.1, 0.1, 0.56), dark, 0, 0.3 + tall + 0.39, 0, g);
  const sun = sunDiscArt(), disc = panel(sun, 0.95, 0.95, x, 0.3 + tall + 0.9, z + 0.05, { glow: sun.glow });
  lit.push(disc.material);
  disc.userData.spot = 'exit';
  const banner = std({ map: stripeArt('#c83a3a', 3), roughness: 0.95, side: THREE.DoubleSide });
  const banners = [-1, 1].map(sx => { const m = mesh(new THREE.PlaneGeometry(0.34, 0.8), banner, sx * (span / 2 - 0.42), 0.3 + tall - 0.4, 0.26, g); m.castShadow = false; return m; });
  B.ticks.push((now) => { if (!calm) banners.forEach((m, i) => { m.rotation.x = Math.sin(now / 700 + i) * 0.08; }); });
  panel(signArt(name.toUpperCase()), 1.7, 0.33, x, 0.3 + tall + 0.17, z + 0.26).userData.spot = 'exit';
  const way = mesh(new THREE.PlaneGeometry(span - 0.3, tall), new THREE.MeshBasicMaterial({ visible: false }), 0, tall / 2, 0.05, g);
  way.castShadow = way.receiveShadow = false;
  g.traverse(o => { o.userData.spot = 'exit'; });
  return g;
}

/** A Sunwell Bazaar name board's face: gold-rimmed, the leader's deepest colour with zigzags in theirs along top and
    foot, their crest on the left, the name in white and GYM LEADER in their light colour. */
function bazaarBoardArt(lines, ink, letter) {
  const f = fine(64, 28, 8), { g, rr, lin } = f;
  rr(0, 0, 64, 28, 2.6, '#e8b040');
  rr(1.5, 1.5, 61, 25, 1.8, lin(0, 0, 0, 28, [ink[2], shadeOf(ink[2], -1)]));
  g.strokeStyle = ink[1]; g.lineWidth = 1.1;
  for (const y of [4.4, 23.6]) { g.beginPath(); for (let x = 3; x <= 61; x += 3) g.lineTo(x, y + (x % 6 ? -1.2 : 1.2)); g.stroke(); }
  if (letter) {
    g.fillStyle = '#e8b040'; g.beginPath(); g.arc(11, 14, 6.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = ink[1]; g.beginPath(); g.arc(11, 14, 5.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letter, 11, 14.5);
  }
  const cx = letter ? 37 : 32, mw = letter ? 44 : 56;
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 11px sans-serif';
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillText(lines[0], cx + 0.4, (lines[1] ? 11.5 : 14) + 0.5, mw);
  g.fillStyle = '#ffffff'; g.fillText(lines[0], cx, lines[1] ? 11.5 : 14, mw);
  if (lines[1]) { g.font = 'bold 7px sans-serif'; g.fillStyle = ink[0]; g.fillText(lines[1], cx, 19.5, mw); }
  return f.c;
}

/** Sunwell Bazaar's name boards (`s`; the user's ask, 2026-10-14: the leaders' signs in the town's own look, as
    Highbough's are): a painted board in the leader's colours on two carved posts, brass knobs on top, a little striped
    awning over it and a lantern lit in their colour hung off each post. */
function bazaarBoards(town, lit) {
  const { map } = town;
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 's') return;
    const near = (f) => Math.hypot(Math.max(f.x0 - x, 0, x - f.x1), Math.max(f.y0 - y, 0, y - f.y1));
    const named = town.buildings.filter(b => b.name).map(b => ({ b, d: near(footprint(map, b.at)) })).sort((p, q) => p.d - q.d)[0]?.b;
    if (!named) return;
    const leader = town.homes?.[named.home]?.leader, ink = (leader && LEADER_INK[leader]) || ['#ffe08a', named.roof || '#c83a5a', '#4a1820'];
    const lines = leader ? [named.name, 'GYM LEADER'] : named.kind === 'shop' ? [named.name, 'TRADE HOUSE'] : [named.name];
    const g = new THREE.Group(), W = 1.5, H = W * 28 / 64, top = 1.55;
    g.position.set(tileX(x), 0, tileZ(y) + 0.3);
    (B.signs ??= {})[named.id] = [tileX(x), top + 0.4, tileZ(y) + 0.3];
    B.group.add(g);
    const wood = std({ color: '#6a4228', roughness: 0.85 }), brass = std({ color: '#d8a838', metalness: 0.7, roughness: 0.3 });
    const glow = std({ color: ink[1], emissive: new THREE.Color(ink[0]), emissiveIntensity: 0.8, roughness: 0.4 });
    lit.push(glow);
    for (const sx of [-1, 1]) {
      const px = sx * (W / 2 + 0.04);
      mesh(new THREE.CylinderGeometry(0.055, 0.07, top + 0.3, 10), wood, px, (top + 0.3) / 2, 0, g);
      mesh(new THREE.SphereGeometry(0.075, 12, 10), brass, px, top + 0.34, 0, g);
      mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), wood, px + sx * 0.1, top - 0.2, 0, g);
      mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 4), brass, px + sx * 0.18, top - 0.27, 0, g).castShadow = false;
      const lamp = mesh(new THREE.SphereGeometry(0.07, 12, 8), glow, px + sx * 0.18, top - 0.38, 0, g);
      lamp.scale.y = 1.25; lamp.castShadow = false;
      mesh(new THREE.ConeGeometry(0.06, 0.07, 10), brass, px + sx * 0.18, top - 0.29, 0, g).castShadow = false;
    }
    const awn = mesh(new THREE.BoxGeometry(W + 0.32, 0.03, 0.36), std({ map: stripeArt(ink[1], 5), roughness: 0.9 }), 0, top + 0.16, 0.12, g);
    awn.rotation.x = 0.35;
    g.attach(panel(bazaarBoardArt(lines, ink, leader ? (named.name || leader)[0].toUpperCase() : ''), W, H, tileX(x), top - H / 2 - 0.02, tileZ(y) + 0.36));
    g.traverse(o => { o.raycast = () => {}; });
    B.blocked.add(key(x, y));
  }));
}

/** A kilim for a stall's back or the market floor: a border, a field and a stepped diamond, its colours from `cols`. */
function kilimArt(cols, seed) {
  const f = fine(40, 26, 6), { g } = f, r = seeded(seed);
  g.fillStyle = cols[0]; g.fillRect(0, 0, 40, 26);
  g.fillStyle = cols[1]; g.fillRect(2, 2, 36, 22);
  g.fillStyle = cols[2]; g.fillRect(4, 4, 32, 18);
  g.fillStyle = cols[3];
  for (let x = 5; x < 36; x += 4) for (const y of [3, 23]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y - 1.5); g.lineTo(x + 2, y + 1.5); g.fill(); }
  for (const [s, c] of [[9, cols[1]], [6.5, cols[3]], [4, cols[0]], [1.8, cols[1]]]) { g.fillStyle = c; g.beginPath(); g.moveTo(20, 13 - s); g.lineTo(20 + s * 1.5, 13); g.lineTo(20, 13 + s); g.lineTo(20 - s * 1.5, 13); g.closePath(); g.fill(); }
  for (const cx of [9, 31]) { g.fillStyle = cols[3]; g.beginPath(); g.moveTo(cx, 9 + r()); g.lineTo(cx + 2.5, 13); g.lineTo(cx, 17 - r()); g.lineTo(cx - 2.5, 13); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = 0; y < 26; y += 1.5) g.fillRect(0, y, 40, 0.4);
  return f.c;
}

/** A row of pennants on a string, for over a stall. */
function buntingArt(n, rnd) {
  const f = fine(n * 10, 10, 6), { g } = f;
  g.strokeStyle = '#f4e8d0'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(0, 1.4); g.lineTo(n * 10, 1.4); g.stroke();
  for (let i = 0; i < n; i++) { g.fillStyle = SAVANNA.stripe[Math.floor(rnd() * SAVANNA.stripe.length)]; g.beginPath(); g.moveTo(i * 10 + 1, 1.4); g.lineTo(i * 10 + 9, 1.4); g.lineTo(i * 10 + 5, 9.4); g.closePath(); g.fill(); }
  return f.c;
}

/** A stall's scalloped valance in its colour, gold-edged, a tassel at each point. */
function valanceArt(col, n) {
  const f = fine(n * 8, 8, 6), { g } = f;
  g.fillStyle = col; g.fillRect(0, 0, n * 8, 3);
  for (let i = 0; i < n; i++) { g.beginPath(); g.arc(i * 8 + 4, 3, 4, 0, Math.PI); g.fill(); }
  g.fillStyle = '#e8b040'; g.fillRect(0, 0, n * 8, 0.9);
  for (let i = 0; i < n; i++) { g.beginPath(); g.arc(i * 8 + 4, 7.2, 0.8, 0, Math.PI * 2); g.fill(); }
  return f.c;
}

/** A long market stall (the user's ask, 2026-10-14: the old one-tile stalls were "so lame and dinky"), `len` tiles along
    its counter, turned by `turn`: carved posts with brass knobs, a striped awning sloping to the front under a scalloped
    valance, a kilim hung across its back, a counter heaped with wares a tile at a time (spice cones in trays, glazed jars,
    fruit in baskets, bolts of cloth, brass lamps), lanterns hung along its front, pennants strung over it and a flag at
    each end. Its materials are its own, so it fades by itself when you walk behind it. */
function bazaarStall(x, z, len, turn, col, rnd, lit, Gm) {
  const g = new THREE.Group();
  g.position.set(x, 0, z); g.rotation.y = turn;
  B.group.add(g);
  const W = len - 0.1, D = 0.84, wood = std({ color: '#6a4428', roughness: 0.85 }), brass = std({ color: '#d8a838', metalness: 0.7, roughness: 0.3 });
  const px = (i) => -W / 2 + i * W / len;
  for (let i = 0; i <= len; i++) for (const [pz, ph] of [[-D / 2, 1.9], [D / 2, 1.58]]) {
    const hh = (i === 0 || i === len) && pz < 0 ? 2.45 : ph;
    mesh(Gm.post, wood, px(i), hh / 2, pz, g).scale.y = hh;
    mesh(Gm.knob, brass, px(i), hh + 0.03, pz, g).castShadow = false;
  }
  const tex = stripeArt(col, 4); tex.repeat.set(len, 1);
  const awn = mesh(new THREE.BoxGeometry(W + 0.26, 0.035, D + 0.3), std({ map: tex, roughness: 0.9 }), 0, 1.76, 0.02, g);
  awn.rotation.x = Math.atan2(0.32, D);
  const hang = (art, w, h, y, z) => { const p = panel(art, w, h, 0, 0, 0); p.removeFromParent(); p.position.set(0, y, z); p.castShadow = false; g.add(p); return p; };
  hang(valanceArt(col, len * 4), W + 0.26, 0.26, 1.47, D / 2 + 0.17);
  hang(kilimArt([shadeOf(col, -1), '#f4e2b8', col, '#2a1c18'], len * 7), W - 0.08, 1.0, 1.05, -D / 2 + 0.03);
  hang(buntingArt(len * 5, rnd), W, 0.2, 2.18, -D / 2 + 0.02);
  const flagM = std({ color: col, roughness: 0.8, side: THREE.DoubleSide }), flags = [];
  for (const i of [0, len]) { const fl = mesh(Gm.flag, flagM, px(i) + 0.17, 2.34, -D / 2, g); fl.castShadow = false; flags.push(fl); }
  const cloth = std({ color: shadeOf(col, -1), roughness: 0.95 }), top = std({ color: '#8a6040', roughness: 0.85 });
  mesh(new THREE.BoxGeometry(W - 0.04, 0.52, 0.42), [wood, wood, top, wood, cloth, wood], 0, 0.26, D / 2 - 0.24, g);
  mesh(new THREE.BoxGeometry(W - 0.02, 0.05, 0.03), brass, 0, 0.47, D / 2 - 0.02, g).castShadow = false;
  mesh(new THREE.BoxGeometry(W - 0.1, 0.05, 0.26), wood, 0, 0.62, -D / 2 + 0.16, g);
  const glow = std({ color: '#f8b040', emissive: new THREE.Color('#ffb860'), emissiveIntensity: 0.8, roughness: 0.4 });
  lit.push(glow);
  const pick = (a) => a[Math.floor(rnd() * a.length)], kinds = ['spice', 'jars', 'fruit', 'cloth', 'brass'], small = (o) => { o.castShadow = false; return o; };
  let k = Math.floor(rnd() * kinds.length);
  for (let i = 0; i < len; i++) {
    const cx = -W / 2 + (i + 0.5) * W / len, wz = D / 2 - 0.24, y = 0.53, kind = kinds[k++ % kinds.length];
    if (kind === 'spice') for (let j = 0; j < 3; j++) {
      const sx = cx + (j - 1) * 0.27;
      small(mesh(Gm.tray, top, sx, y, wz, g));
      small(mesh(Gm.mound, std({ color: pick(['#e8702a', '#c8301e', '#f0c030', '#8a9a30', '#a0522d']), roughness: 1 }), sx, y + 0.07, wz, g));
    } else if (kind === 'jars') for (let j = 0; j < 3; j++) {
      const m = std({ color: pick(['#c8763a', '#3a6ab0', '#2e8a7a', '#b8502a', '#e0c890']), roughness: 0.35 }), s = 0.8 + rnd() * 0.5, jz = wz + (rnd() - 0.5) * 0.08;
      small(mesh(Gm.jar, m, cx + (j - 1) * 0.26, y + 0.09 * s, jz, g)).scale.set(s, s * 1.25, s);
      small(mesh(Gm.neck, m, cx + (j - 1) * 0.26, y + 0.2 * s, jz, g));
    } else if (kind === 'fruit') for (let j = 0; j < 2; j++) {
      const bx = cx + (j ? 0.18 : -0.18), fm = std({ color: pick(['#e85a3a', '#f8c040', '#7ab040', '#d83a6a']), roughness: 0.6 });
      small(mesh(Gm.basket, std({ color: '#b8904a', roughness: 1, side: THREE.DoubleSide }), bx, y + 0.05, wz, g));
      for (let q = 0; q < 4; q++) small(mesh(Gm.fruit, fm, bx + (q % 2 - 0.5) * 0.08, y + 0.08 + (q > 1 ? 0.05 : 0), wz + (q > 1 ? 0 : (q - 0.5) * 0.06), g));
    } else if (kind === 'cloth') for (let j = 0; j < 4; j++) {
      small(mesh(Gm.bolt, std({ color: pick([...SAVANNA.stripe, '#f4e8d0', '#2a1c18']), roughness: 0.95 }), cx + (j % 2 - 0.5) * 0.36, y + 0.05 + Math.floor(j / 2) * 0.09, wz, g));
    } else for (let j = 0; j < 3; j++) {
      const lx = cx + (j - 1) * 0.26;
      small(mesh(Gm.lamp, brass, lx, y + 0.06, wz, g)).scale.set(1, 0.55, 0.75);
      small(mesh(Gm.spout, brass, lx + 0.1, y + 0.08, wz, g)).rotation.z = -1.1;
    }
    for (let j = 0; j < 3; j++) small(mesh(Gm.jar, std({ color: pick(['#c8763a', '#e0c890', '#8a5a3a', '#3a6ab0']), roughness: 0.5 }), cx + (j - 1) * 0.24, 0.71, -D / 2 + 0.16, g));
    small(mesh(Gm.cord, brass, cx, 1.42, D / 2 + 0.12, g));
    small(mesh(Gm.lantern, glow, cx, 1.3, D / 2 + 0.12, g)).scale.y = 1.3;
  }
  if (rnd() < 0.7) small(mesh(Gm.roll, std({ color: pick(['#a83a3a', '#3a5a9a', '#c87a2a']), roughness: 0.95 }), W / 2 - 0.06, 0.55, D / 2 + 0.1, g)).rotation.z = 0.28;
  B.ticks.push((now) => { if (!calm) flags.forEach((fl, i) => { fl.rotation.y = Math.sin(now / 650 + i * 2 + x) * 0.4; }); });
  g.traverse(o => { o.raycast = () => {}; });
  return g;
}

/** The savanna's own things from the map: the watering hole under it all, a name board by each leader's home (`s`), the
    market's stalls (a run of `n` is one long stall; a column of them faces in across the square) and kilims laid out on
    its floor in front of some. */
function savannaExtras(town, L, lit) {
  wateringHole(town);
  bazaarBoards(town, lit);
  const { map } = town, rnd = seeded(41), n = (x, y) => map[y]?.[x] === 'n', seen = new Set(), runs = [];
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'n' || seen.has(key(x, y))) return;
    let len = 1; while (n(x + len, y)) len++;
    if (len > 1) { for (let i = 0; i < len; i++) seen.add(key(x + i, y)); runs.push({ x: x + (len - 1) / 2, y, len }); return; }
    let h = 1; while (n(x, y + h) && !n(x - 1, y + h) && !n(x + 1, y + h)) h++;
    for (let i = 0; i < h; i++) seen.add(key(x, y + i));
    runs.push({ x, y: y + (h - 1) / 2, len: h, v: h > 1 });
  }));
  if (!runs.length) return;
  const mid = runs.reduce((s, r) => s + r.x, 0) / runs.length;
  const Gm = { post: new THREE.CylinderGeometry(0.035, 0.042, 1, 8), knob: new THREE.SphereGeometry(0.05, 10, 8), flag: new THREE.PlaneGeometry(0.32, 0.2),
    tray: new THREE.CylinderGeometry(0.12, 0.1, 0.04, 14), mound: new THREE.ConeGeometry(0.1, 0.13, 14), jar: new THREE.SphereGeometry(0.075, 12, 10),
    neck: new THREE.CylinderGeometry(0.03, 0.04, 0.06, 10), basket: new THREE.CylinderGeometry(0.13, 0.1, 0.1, 14, 1, true), fruit: new THREE.SphereGeometry(0.045, 8, 6),
    bolt: new THREE.BoxGeometry(0.32, 0.08, 0.24), lamp: new THREE.SphereGeometry(0.07, 12, 8), spout: new THREE.ConeGeometry(0.02, 0.12, 8),
    cord: new THREE.CylinderGeometry(0.006, 0.006, 0.16, 4), lantern: new THREE.SphereGeometry(0.06, 10, 8), roll: new THREE.CylinderGeometry(0.06, 0.06, 1.0, 10) };
  runs.forEach((r, i) => {
    for (let k = 0; k < r.len; k++) B.blocked.add(r.v ? key(r.x, r.y - (r.len - 1) / 2 + k) : key(r.x - (r.len - 1) / 2 + k, r.y));
    const col = SAVANNA.stripe[i % SAVANNA.stripe.length];
    fadeBehind(bazaarStall(tileX(r.x), tileZ(r.y), r.len, r.v ? (r.x < mid ? Math.PI / 2 : -Math.PI / 2) : 0, col, rnd, lit, Gm));
    if (i % 2) return;
    const fx = r.v ? r.x + (r.x < mid ? 1 : -1) : r.x, fy = r.v ? r.y : r.y + 1;
    if (map[fy]?.[Math.round(fx)] !== '#') return;
    const rc = SAVANNA.stripe[(i + 2) % SAVANNA.stripe.length];
    const rug = panel(kilimArt([rc, '#f4e2b8', shadeOf(rc, -1), '#2a1c18'], i + 3), r.v ? 2.2 : Math.min(2.2, r.len - 0.4), 0.9, tileX(fx), 0.015, tileZ(fy));
    rug.rotation.x = -Math.PI / 2; rug.rotation.z = r.v ? Math.PI / 2 : 0; rug.raycast = () => {}; rug.castShadow = false;
  });
}

/** A mote of dust, gold, for the ones drifting up off the road. */
function dustArt() {
  const f = fine(8, 8, 8), { g } = f, r = g.createRadialGradient(4, 4, 0, 4, 4, 4);
  r.addColorStop(0, 'rgba(255,240,200,0.95)'); r.addColorStop(1, 'rgba(255,220,150,0)');
  g.fillStyle = r; g.fillRect(0, 0, 8, 8);
  return f.c;
}

function fireflyArt(col) {
  const f = fine(12, 12, 8), { g } = f;
  const rg = g.createRadialGradient(6, 6, 0, 6, 6, 6);
  rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.3, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 12, 12);
  return f.c;
}

/** How each town's dressed (js/data/towns.js's `style`; the Shrine's is the village): the ground's tints, its flowers and
    litter, its forest, houses and gate, what drifts through the air, and its lamps. */
const TOWN_STYLES = {
  village: { under: 'rgba(30,50,30,0.45)', scrub: 'rgba(40,90,40,0.35)', flowers: ['#ffffff', '#f8d040', '#f890b0', '#f8a060'], litter: mapleLitter,
    holes: true, fade: true, soft: true, extras: villageExtras,
    trees: (map, L, rnd) => forest(map, L, rnd), house: (b, f, L, lit) => house(b, f, L, lit), lamp: 'stonelantern',
    gate: (town, lit, L, time) => torii(tileX(town.gate.x) + 0.5, tileZ(1) + 0.3, 2.4, 3.3, town.name, lit, time),
    drift: (i) => ({ art: leafArt(MAPLE[i % 4]), size: 0.18 + (i % 3) * 0.03 }) },
  springs: { under: 'rgba(40,26,22,0.5)', scrub: 'rgba(110,84,44,0.4)', flowers: ['#f86030', '#f8a030', '#f8d050', '#e83a3a'], litter: ashLitter,
    holes: true, fade: true, extras: lavaField, bridge: { planks: ['#4a3e38', '#3e3430', '#564840', '#362c28'], trim: '#1e1816' },
    look: { stone: ['#b4a08c', '#a08c78', '#8c7864', '#5a4a40'], gap: '#3a2c26', moss: '#6a5a48', grass: ['#b09a60', '#94804a', '#78663a'] },
    trees: crags, house: (b, f, L, lit, smoke) => cabin(b, f, L, lit, smoke), lamp: 'brazier', lampScale: 0.62,
    gate: (town, lit) => mineGate(tileX(town.gate.x) + 0.5, tileZ(1) + 0.3, 2.4, 2.7, town.name, lit),
    drift: (i) => (i % 3 ? { art: ashArt(), size: 0.1 } : { art: emberArt(i % 2 ? '#f8a030' : '#f06020'), size: 0.12, rise: true }) },
  lagoon: { holes: true, fade: true, ground: lagoonGround, trees: lagoonJungle, lamp: 'tikitorch', lampScale: 0.9,
    house: (b, f, L, lit, smoke) => (b.kind === 'houseboat' ? houseboat(b, f, L, lit) : b.kind === 'beacon' ? beacon(f, L, lit) : stiltHut(b, f, L, lit, smoke)),
    gate: (town, lit, L) => templeArch(tileX(town.gate.x) + 0.5, tileZ(1) + 0.3, 2.4, 2.5, town.name, L, lit),
    extras: lagoonExtras,
    drift: (i) => (i % 2 ? { art: emberArt(i % 4 === 1 ? '#d8ff70' : '#a0f0ff'), size: 0.09, rise: true } : { art: leafletArt(PALM[i % 4]), size: 0.17 }) },
  canopy: { holes: true, neat: true, ground: canopyGround, trees: canopyRim, lamp: 'lantern', lampScale: 0.8,
    house: (b, f, L, lit) => (b.kind === 'greattree' ? greatTree(b, f, L, lit) : b.kind === 'nursery' ? nursery(b, f, L, lit) : treehouse(b, f, L, lit)),
    gate: (town, lit, L) => vineGate(tileX(town.gate.x) + 0.5, tileZ(1) + 0.3, 2.4, 2.8, town.name, L, lit),
    extras: canopyExtras,
    drift: (i) => (i % 3 ? { art: leafletArt(CANOPY.leaf[i % 4]), size: 0.16 } : { art: fireflyArt(i % 2 ? '#c890ff' : '#90f0e0'), size: 0.13, rise: true }) },   // will-o'-wisps: it's a ghost town
  bazaar: { holes: true, fade: true, ground: savannaGround, trees: savannaBush, lamp: 'tikitorch', lampScale: 0.85,
    house: (b, f, L, lit) => (b.kind === 'shop' ? bazaarTent(b, f, L, lit) : b.kind === 'caravanserai' ? caravanserai(b, f, L, lit) : b.kind === 'wagon' ? wagon(b, f, L, lit) : rondavel(b, f, L, lit)),
    gate: (town, lit, L) => sunGate(tileX(town.gate.x) + 0.5, tileZ(1) + 0.3, 2.4, 2.3, town.name, L, lit),
    extras: savannaExtras,
    drift: (i) => (i % 4 ? { art: dustArt(), size: 0.08, rise: true } : { art: leafletArt(SAVANNA.grass[i % 3]), size: 0.14 }) },
};

async function buildTown(figs, { look, time, town, mended = false }) {
  const S = TOWN_STYLES[town.style || 'village'], L = { ...look, ...S.look };
  const map = town.map, rnd = wild(L, time, { to: ROWS + 1, ground: S.ground ? S.ground(town) : townGround(L, map, S), holes: S.holes, walled: false });
  const sky = townBackdrop(THREE, texOf, town.style || 'village', time);   // what lies past the town, its landmark behind the gate
  sky.rig.visible = !AERIAL;
  B.group.add(sky.rig);
  B.ticks.push((now, dt) => { if (!calm) sky.tick(now, dt); });
  B.sky = { place: sky.place, gateX: tileX(town.gate.x) + 0.5 };
  B.bg = sky.top;
  for (const part of B.exitParts) B.group.remove(part);   // you came in off the road: the way on is the gate
  B.exitParts = [];
  B.town = town;
  B.talks = new Set();
  B.shotTop = 2.4;
  B.speed = 5.6;
  const lit = [], smoke = [], steam = [];
  S.trees(map, L, rnd);
  townGrass(map, L, rnd);
  S.gate(town, lit, L, time);
  B.exitAt = { ...town.gate };
  B.doors = {};
  const LANDMARKS = { pagoda: (b, f) => pagoda(f.cx, f.cz, L), theater: (b, f) => theater(b, f, L, lit), waystone: (b, f) => (B.stone = { f, L, g: waystone(f, L, mended), fade: !!S.fade, spot: b.door ? `door:${b.id}` : null }).g, minehead: (b, f) => minehead(f, L, lit), windpump: (b, f) => windpump(f, L), kopje: (b, f) => kopje(f) };
  for (const b of town.buildings) {
    const f = footprint(map, b.at);
    for (let x = f.x0; x <= f.x1; x++) for (let y = f.y0; y <= f.y1; y++) B.blocked.add(key(x, y));
    const g = LANDMARKS[b.kind]?.(b, f) ?? S.house(b, f, L, lit, smoke);
    if (b.kind === 'shop' && !g.userData.signed) g.attach(tradePost(b, f, lit));
    if (S.fade) fadeBehind(g);
    if (!b.door) continue;
    B.doors[`door:${b.id}`] = { id: b.id, step: { ...b.door }, g };
    g.traverse(o => { o.userData.spot = `door:${b.id}`; });
  }
  let board = null;
  map.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === 'L' || ch === 'b' || ch === 'c' || ch === 'k') {
      const m = piece({ L: S.lamp, b: 'bench', c: 'crate', k: 'barrel' }[ch], x, y, { scale: ch === 'L' ? S.lampScale ?? 0.95 : 0.9, turn: ch === 'c' && !S.neat ? (x % 2) * 0.4 : 0 });
      m?.traverse(o => { if (o.material?.emissiveMap) { o.material.emissive = new THREE.Color('#ffc070'); lit.push(o.material); } });
      B.blocked.add(key(x, y));
    }
    if (ch === 'R') { noticeBoard(tileX(x), tileZ(y) - 0.1, 0, L); B.blocked.add(key(x, y)); board = { x, y }; }
  }));
  B.spots = [{ step: { x: board.x, y: board.y + 1 } }];
  B.boardAt = board;
  B.anchors[0] = new THREE.Vector3(tileX(board.x), 2.25, tileZ(board.y));
  const cart = map.findLastIndex(row => row.includes('='));   // a mine cart at the rails' far end, away from the mine's door
  if (cart >= 0) { const x = map[cart].lastIndexOf('='); mineCart(tileX(x), tileZ(cart)); B.blocked.add(key(x, cart)); }
  springs(map, L, steam);
  S.extras?.(town, L, lit);
  if (smoke.length) puffs(smoke.map(([x, y, z]) => [x, y, z]), { col: 'rgba(150,140,136,0.7)', n: 3, size: 0.5, rise: 1.8, speed: 0.14 });
  const stacks = smoke.filter(s => s[3]);
  if (stacks.length || steam.length) puffs([...steam, ...stacks.map(([x, y, z]) => [x, y, z])], { col: 'rgba(250,250,248,0.8)', n: 2, size: 0.7, rise: 1.4, speed: 0.2 });
  // lanterns glow brighter as it gets dark; the town's leaves (or ash and embers) drift through the air
  const dark = time === 'night' ? 1.6 : time === 'dusk' ? 1.2 : time === 'dawn' ? 0.9 : 0.55;
  const leaves = Array.from({ length: Math.min(90, Math.round(COLS * ROWS / 12)) }, (_, i) => {
    const d = S.drift(i), sp = sprite(d.art, d.size);
    sp.userData = { x: (Math.random() - 0.5) * COLS, z: (Math.random() - 0.5) * ROWS, at: Math.random(), speed: 0.05 + Math.random() * 0.05, sway: Math.random() * 6, rise: d.rise };
    return sp;
  });
  B.ticks.push((now) => {
    const k = calm ? 0 : Math.sin(now / 1700) * 0.08;
    for (const m of lit) m.emissiveIntensity = dark + k;
    for (const sp of leaves) {
      const u = sp.userData, t = (u.at + now / 1000 * u.speed) % 1;
      sp.visible = !calm;
      sp.position.set(u.x + Math.sin(t * 9 + u.sway) * 0.4, u.rise ? 0.3 + t * 4 : 4.2 - t * 4.2, u.z + Math.cos(t * 5 + u.sway) * 0.2);
      sp.material.opacity = Math.min(1, t * 8, (1 - t) * 6);
      sp.material.rotation = t * 7 + u.sway;
    }
  });
}

/* ---------- inside a town's houses ---------- */

/** A town's homes (by town, then its `homes` key): the room's size (the theater and bathhouse are bigger), the floor,
    what stands in it ([piece, x, y, options]), where its Gym Leader stands (`leaderAt`) and its cast (`castAt`: the
    bathers, each [x, ty, y] in a pool). A Gym Leader's home in a town (and the Nietos' in the Clearing) is
    js/leader-homes.js's instead. */
const HOMES = {
  // the Clearing's own houses, walked in from the hub (js/data/towns.js's CLEARING); the Nietos' is js/leader-homes.js's
  clearing: {
    // Kurt's Workshop: his workbench across the back with Kurt before it, the cauldron and its fire, Apricorn trees
    workshop: { floor: 'planks', walls: 'boards', kurtAt: { x: 4, ty: 1.5 }, castAt: [[6.6, 2.2, 0]],
      furnish: [['shelf', 0, 0], ['balldisplay', 2, 0], ['pottingbench', 3, 0], ['anvil', 5, 0], ['cauldron', 6, 0], ['brazier', 7, 0], ['balldisplay', 8, 0],
        ['appletree', 0, 3], ['appletree', 8, 3], ['crate', 0, 5], ['crate', 1, 5], ['barrel', 8, 5], ['barrel', 7, 5]] },
  },
  shrine: {
  shop: { floor: 'planks', furnish: [['shelf', 0, 0], ['shelf', 7, 0], ['cupboard', 2, 0], ['cupboard', 6, 0], ['counter', 2, 2], ['counter', 4, 2], ['register', 5, 2, { y: 0.62, scale: 0.72, free: true }], ['candyjar', 2, 2, { y: 0.62, scale: 0.72, free: true }], ['crate', 0, 3], ['crate', 0, 4], ['barrel', 8, 3], ['umbrellas', 8, 4], ['plant', 8, 1], ['balldisplay', 1, 1]] },
  theater: { cols: 11, rows: 9, floor: 'stage', stage: true, furnish: [['taiko', 0, 2], ['taiko', 10, 2], ['kimonostand', 0, 0], ['kimonostand', 10, 0], ['zabuton', 3, 5], ['zabuton', 5, 5], ['zabuton', 7, 5], ['zabuton', 4, 6], ['zabuton', 6, 6], ['andon', 1, 6], ['andon', 9, 6]] },
  },
  wastes: {
    shop: { floor: 'flags', furnish: [['shelf', 0, 0], ['shelf', 7, 0], ['brazier', 2, 0], ['anvil', 6, 0], ['counter', 2, 2], ['counter', 4, 2], ['register', 5, 2, { y: 0.62, scale: 0.72, free: true }], ['crate', 0, 3], ['crate', 0, 4], ['barrel', 8, 3], ['barrel', 8, 4], ['steamrocks', 1, 1], ['plant', 8, 1]] },
    bath: { cols: 11, rows: 9, floor: 'tiles', castAt: [[1.5, 0.5, -0.3], [4.5, 0.5, -0.3], [7.5, 0.5, -0.3], [2.5, 3.5, -0.3], [6.5, 3.5, -0.3]],
      furnish: [['onsenpool', 1, 0], ['onsenpool', 4, 0], ['onsenpool', 7, 0], ['onsenpool', 2, 3], ['onsenpool', 6, 3], ['steamrocks', 0, 0], ['steamrocks', 10, 0], ['okebucket', 0, 2], ['okebucket', 10, 2], ['milkfridge', 0, 6], ['massagechair', 10, 6], ['yukatarack', 10, 4], ['washbasin', 0, 4], ['shishiodoshi', 9, 3]] },
  },
  ruins: {
    shop: { floor: 'planks', walls: 'boards', furnish: [['barrel', 0, 0], ['crate', 1, 0], ['surfboard', 7, 0], ['surfboard', 8, 0], ['aquarium', 3, 0], ['counter', 2, 2], ['counter', 4, 2], ['register', 5, 2, { y: 0.62, scale: 0.72, free: true }], ['fishbowl', 2, 2, { y: 0.62, scale: 0.72, free: true }], ['barrel', 0, 3], ['barrel', 0, 4], ['crate', 8, 3], ['milkcrate', 8, 4], ['seashells', 8, 1], ['tikitorch', 0, 2]] },
    aquarium: { cols: 11, rows: 9, floor: 'tiles', walls: 'aqua', cold: true, castAt: [[1.5, 0.5, -0.18], [4.5, 0.5, -0.18], [7.5, 0.5, -0.18], [2.5, 3.5, -0.18], [7.5, 3.5, -0.18]],
      furnish: [['onsenpool', 1, 0], ['onsenpool', 4, 0], ['onsenpool', 7, 0], ['onsenpool', 2, 3], ['onsenpool', 7, 3], ['bubblecolumn', 0, 0], ['bubblecolumn', 10, 0], ['aquarium', 0, 7], ['aquarium', 9, 7], ['jellylamp', 0, 4], ['jellylamp', 10, 4], ['kelp', 0, 2], ['kelp', 10, 2], ['bench', 3, 7], ['bench', 6, 7]] },
  },
  thornwood: {
    shop: { floor: 'planks', walls: 'dusk', furnish: [['witchshelf', 0, 0], ['witchshelf', 7, 0], ['candelabra', 2, 0], ['hauntmirror', 5, 0], ['cupboard', 6, 0], ['counter', 2, 2], ['counter', 4, 2], ['register', 5, 2, { y: 0.62, scale: 0.72, free: true }], ['crystalball', 2, 2, { y: 0.62, scale: 0.72, free: true }], ['coffin', 0, 3], ['hatstand', 0, 4], ['pumpkins', 8, 3], ['deadtree', 8, 4], ['spookylamp', 8, 1], ['broom', 1, 1]] },
    nursery: { cols: 11, rows: 9, floor: 'planks', walls: 'glass', castAt: [[1.5, 0.6, 0.3], [4.5, 0.6, 0.3], [7.5, 0.6, 0.3], [2.5, 3.6, 0.3], [6.5, 3.6, 0.3]],
      furnish: [['webrug', 1, 0, { free: true }], ['webrug', 4, 0, { free: true }], ['webrug', 7, 0, { free: true }], ['webrug', 2, 3, { free: true }], ['webrug', 6, 3, { free: true }], ['spookylamp', 0, 0], ['spookylamp', 10, 0], ['deadtree', 0, 2], ['deadtree', 10, 2], ['roundgrave', 0, 4], ['squaregrave', 10, 4], ['obeliskgrave', 10, 6], ['jackolantern', 0, 7], ['pumpkins', 2, 7], ['candelabra', 8, 7], ['ghostsheet', 10, 8]] },
  },
  savanna: {
    shop: { floor: 'planks', walls: 'tent', furnish: [['canopicjars', 0, 0], ['goldurn', 1, 0], ['featherfan', 7, 0], ['scarablamp', 8, 0], ['dunerug', 3, 4, { free: true }], ['counter', 2, 2], ['counter', 4, 2], ['register', 5, 2, { y: 0.62, scale: 0.72, free: true }], ['waterjar', 2, 2, { y: 0.62, scale: 0.72, free: true }], ['crate', 0, 3], ['waterjar', 0, 4], ['barrel', 8, 3], ['cobrastatue', 8, 4], ['datepalm', 8, 1], ['pharaohthrone', 6, 0]] },
    caravanserai: { cols: 11, rows: 9, floor: 'flags', walls: 'sandstone', castAt: [[1.6, 2.0, 0], [5.0, 1.5, 0], [8.4, 2.0, 0], [3.6, 4.8, 0], [7.2, 4.8, 0]],
      furnish: [['haybale', 0, 0], ['haybale', 1, 0], ['trough', 4, 0], ['waterjar', 3, 0], ['waterjar', 6, 0], ['haybale', 9, 0], ['haybale', 10, 0], ['lotuscolumn', 0, 3], ['lotuscolumn', 10, 3], ['haybale', 0, 6], ['crate', 10, 6], ['barrel', 10, 7], ['datepalm', 0, 8], ['waterjar', 10, 8]] },
  },
};
// the Depths camp (js/data/camp.js): no clock, a crystal miners' camp in the Depths' cave (buildCamp())
HOMES.depths = {
  camp: { cols: 13, rows: 9, camp: true, mewtwoAt: { x: 7.8, ty: 1.1, scale: 1.1 } },
};
const homeSize = (town, id) => { if (LEADER_HOMES[id]) return LEADER_SIZE; const h = HOMES[town]?.[id]; return { cols: h?.cols || 9, rows: h?.rows || 7, across: h?.cols ? 7.5 : 6.2 }; };

function homeFloor(kind) {
  const T = 16, W = COLS * T, H = ROWS * T, f = fine(W, H, 5), { g, rr, lin } = f;
  if (kind === 'tatami') {
    g.fillStyle = '#4a3a20'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < ROWS; y += 1) for (let x = (y % 2) * -1; x < COLS; x += 2) {
      rr(x * T + 0.6, y * T + 0.6, 2 * T - 1.2, T - 1.2, 1, lin(0, y * T, 0, (y + 1) * T, ['#dcd494', '#c8bc78']));
      g.fillStyle = '#3a5a3a'; g.fillRect(x * T + 0.6, y * T + 0.6, 2 * T - 1.2, 1.2); g.fillRect(x * T + 0.6, (y + 1) * T - 1.8, 2 * T - 1.2, 1.2);
    }
  } else if (kind === 'flags') {   // the forge's flagstones
    g.fillStyle = '#3a302c'; g.fillRect(0, 0, W, H);
    const r = seeded(17);
    for (let y = 0; y < H; y += 8) for (let x = -(y / 8 % 2) * 5; x < W; x += 10) rr(x + 0.4, y + 0.4, 9.2, 7.2, 1.2, ['#8a7a6e', '#7a6a60', '#968678'][Math.floor(r() * 3)]);
  } else if (kind === 'tiles') {   // the bathhouse's blue and white tiles
    for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) { g.fillStyle = (x + y) % 8 ? '#e8f0f4' : '#b8d4e4'; g.fillRect(x, y, 4, 4); }
    g.fillStyle = 'rgba(80,110,130,0.35)'; for (let x = 0; x < W; x += 4) g.fillRect(x, 0, 0.3, H); for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 0.3);
  } else planks(f, W, H, T, kind === 'stage' ? ['#a87048', '#8a5a38'] : ['#c89a68', '#b0845a']);
  if (kind === 'stage') { g.fillStyle = 'rgba(160,30,40,0.85)'; g.fillRect(W / 2 - T, 4 * T, 2 * T, H - 4 * T); }
  return f.c;
}

function homeWall(width, time, { window: win = true, curtain = false, walls = 'plaster' } = {}) {
  const f = fine(width, TOP * U, 5), { g, lin } = f, s = f.shine();
  g.fillStyle = lin(0, wy(TOP), 0, wy(1), ['#e8dcc0', '#f4ead4']); g.fillRect(0, 0, width, TOP * U);
  if (walls === 'boards' || walls === 'dusk') {   // a lagoon home's: weathered boards, laid across (Phil's, dark and cold)
    const r = seeded(width);
    for (let y = 0; y < wy(1); y += 6) { g.fillStyle = (walls === 'dusk' ? ['#4a3e52', '#3e3446', '#54485c', '#362c3e'] : ['#c8a87c', '#bc9a6c', '#d4b688', '#b08e62'])[Math.floor(r() * 4)]; g.fillRect(0, y, width, 6); g.fillStyle = 'rgba(60,36,16,0.45)'; g.fillRect(0, y + 5.4, width, 0.6); }
  } else if (walls === 'glass') {   // the Nursery's: panes in white frames, the canopy's green through them
    g.fillStyle = lin(0, 0, 0, wy(1), ['#a8e0b0', '#d8f4d0']); g.fillRect(0, 0, width, wy(1));
    const r = seeded(width);
    for (let i = 0; i < width / 4; i++) { g.fillStyle = ['rgba(80,160,70,0.5)', 'rgba(50,120,50,0.45)', 'rgba(110,180,80,0.4)'][i % 3]; g.beginPath(); g.ellipse(r() * width, wy(2.2) + r() * (wy(1) - wy(2.2)), 3 + r() * 6, 2 + r() * 3, r() * 3, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#f4f4ec';
    for (let x = 0; x <= width; x += U) g.fillRect(x - 1, 0, 2, wy(1));
    for (let y = wy(TOP); y < wy(1); y += U) g.fillRect(0, y - 1, width, 2);
  } else if (walls === 'tent') {   // Persian's: the tent's canvas, striped, seen from inside, lamplight on it
    for (let x = 0; x < width; x += 8) { g.fillStyle = (x / 8) % 2 ? '#f4e2c0' : '#c8486a'; g.fillRect(x, 0, 8, wy(1)); }
    g.fillStyle = lin(0, 0, 0, wy(1), ['rgba(60,20,10,0.35)', 'rgba(255,200,120,0.1)']); g.fillRect(0, 0, width, wy(1));
  } else if (walls === 'mud') {   // a round hut's: mud plaster, a painted band of zigzags
    g.fillStyle = lin(0, 0, 0, wy(1), ['#d8b88c', '#e4c69c']); g.fillRect(0, 0, width, wy(1));
    g.fillStyle = '#c86a3a'; g.fillRect(0, wy(2.5), width, 5);
    g.strokeStyle = '#f8ecd0'; g.lineWidth = 1; g.beginPath(); for (let x = 0; x <= width; x += 6) g.lineTo(x, wy(2.5) + (x % 12 ? 1 : 4)); g.stroke();
  } else if (walls === 'sandstone') {   // the caravanserai's: blocks of sandstone, a carved band
    const r = seeded(width);
    for (let y = 0; y < wy(1); y += 6) for (let x = -(y / 6 % 2) * 6; x < width; x += 12) { g.fillStyle = ['#e0be90', '#d4b080', '#caa676'][Math.floor(r() * 3)]; g.fillRect(x + 0.4, y + 0.4, 11.2, 5.2); }
    g.fillStyle = '#b07a4a'; g.fillRect(0, wy(2.4), width, 3);
  } else if (walls === 'aqua') {   // the aquarium's: deep water blue, bubbles rising
    g.fillStyle = lin(0, 0, 0, wy(1), ['#1a4a78', '#3a8ab8']); g.fillRect(0, 0, width, wy(1));
    const r = seeded(width);
    for (let i = 0; i < width / 6; i++) { g.strokeStyle = 'rgba(200,240,255,0.5)'; g.lineWidth = 0.6; g.beginPath(); g.arc(r() * width, r() * wy(1), 0.8 + r() * 2, 0, Math.PI * 2); g.stroke(); }
  }
  g.fillStyle = lin(0, wy(1), 0, wy(0), ['#8a5a34', '#6a4024']); g.fillRect(0, wy(1), width, U);
  g.fillStyle = '#3a241a';
  if (walls === 'plaster') for (let x = 0; x <= width; x += 2 * U) g.fillRect(x - 1.5, 0, 3, TOP * U);
  g.fillRect(0, wy(2.7), width, 3); g.fillRect(0, wy(1) - 1.5, width, 3);
  if (win) skyWindow(f, s, width * 0.25, width * 0.25 + 1.6 * U, wy(2.4), wy(1.3), { frame: '#5a3a22', curtain: null, night: time === 'night', sky: time === 'night' ? ['#101830', '#1a2850', '#283868'] : time === 'dusk' ? ['#f08850', '#f8b070', '#fcd8a0'] : ['#68b0f0', '#a8d8f8', '#e0f4ff'] });
  if (curtain) {   // the theater's stage curtains, red, swagged
    for (const [a, b] of [[0, width * 0.32], [width * 0.68, width]]) { g.fillStyle = lin(a, 0, b, 0, ['#a01828', '#d83040', '#a01828']); g.fillRect(a, wy(3.4), b - a, wy(0) - wy(3.4)); }
    g.fillStyle = lin(0, wy(3.6), 0, wy(2.9), ['#d83040', '#a01828']); g.fillRect(0, wy(3.6), width, wy(2.9) - wy(3.6));
    g.fillStyle = '#e8c050'; g.fillRect(0, wy(2.9) - 1, width, 1.5);
  }
  return f.c;
}

async function buildHome(figs, { time, town, home, gift }) {
  const L = town.homes[home]?.leader && LEADER_HOMES[home];   // a Gym Leader's own (js/leader-homes.js)
  const h = L ? { leaderAt: L.leaderAt, castAt: L.castAt, furnish: [] } : HOMES[town.id]?.[home] || {};
  if (h.camp) return buildCamp(figs, h);
  if (L) buildLeaderHome({ THREE, B, time, cols: COLS, rows: ROWS, piece, std, rbox, fine, texOf, tileX, tileZ, skyWindow, planks, seeded, sprite, sparkArt, emberArt, fireflyArt, shell, PIECES, calm: () => calm, buddy: () => walker, away: !figs[town.homes[home].leader] }, home);
  else shell({ floor: homeFloor(h.floor), wall: homeWall((COLS + 0.8) * U, time, { window: !h.stage && h.walls !== 'glass' && h.walls !== 'tent', curtain: !!h.stage, walls: h.walls }), side: () => homeWall(ROWS * U, time, { window: false, walls: h.walls }), edge: '#3a2418', cap: '#4a3020', under: '#20140c', bg: '#1a120c' });
  B.shotTop = L ? 3.1 : 2.1;
  B.talks = new Set();
  if (!L) for (const [id, x, y, o] of h.furnish || []) piece(id, x, y, o);
  if (home === 'shop' && figs.trader) {
    B.who.trader = await figure('trader', figs.trader, { x: 3.5, ty: 1.2, scale: 0.9 });
    B.who.trader.group.traverse(o => { o.userData.spot = 0; });
    B.spots = [{ step: { x: 4, y: 3 } }];
    B.anchors[0] = new THREE.Vector3(tileX(3.5), 2.2, tileZ(1.2));
  }
  if (h.kurtAt && figs.kurt) {   // a tap on Kurt is his Workshop's window, like the shop's keeper
    B.who.kurt = await figure('kurt', figs.kurt, h.kurtAt);
    B.who.kurt.group.traverse(o => { o.userData.spot = 0; });
    B.spots = [{ step: { x: Math.round(h.kurtAt.x), y: Math.round(h.kurtAt.ty) + 1 } }];
    B.anchors[0] = new THREE.Vector3(tileX(h.kurtAt.x), 2.4, tileZ(h.kurtAt.ty));
  }
  const leader = town.homes[home]?.leader;
  if (leader && figs[leader]) {
    const at = h.leaderAt ?? { x: 3, ty: 2.4 };
    B.who[leader] = await figure(leader, figs[leader], at);
    B.talks.add(leader);
    if (L?.with) {   // someone who lives with them (Phil's JONA), stood like them, lit a little by their own light
      const w = B.who[L.with.id] = await figure(L.with.id, { npc: L.with.src }, L.with.at);
      B.talks.add(L.with.id);
      if (L.with.glow) { w.board.material.emissive.set('#ffffff'); w.board.material.emissiveMap = w.t; w.board.material.emissiveIntensity = L.with.glow; }
    }
    if (gift) {   // a gift from Kurt's Workshop held: its sign beside them, a step in front of them its spot
      const x = Math.round(at.x), y = Math.round(at.ty) + 1;   // the nearest free tile in front of them (John's kotatsu is right there)
      const step = [[x, y], [x + 1, y], [x - 1, y], [x, y + 1], [x + 1, y + 1], [x - 1, y + 1]].find(([i, j]) => j < ROWS && !B.blocked.has(key(i, j))) ?? [x, y + 1];
      B.spots = [{ step: { x: step[0], y: step[1] } }];
      B.anchors[0] = new THREE.Vector3(tileX(at.x) + 0.9, 2.3, tileZ(at.ty));
    }
  }
  if (h.castAt) {   // the bathers, up to their chins in the pools, bobbing now and then
    const ids = Object.keys(figs).filter(k => k.startsWith('cast:'));
    for (const [i, k] of ids.entries()) {
      const [x, ty, y] = h.castAt[i % h.castAt.length], id = k.slice(5);
      B.who[id] = await figure(id, { ...figs[k], flip: i % 2 === 1 }, { x, ty, y, scale: 0.85 });
      B.talks.add(id);
    }
    const steam = h.cold ? [] : h.furnish.filter(([id]) => id === 'onsenpool').map(([, x, y]) => [tileX(x + 0.5), 0.3, tileZ(y + 0.5)]);
    puffs(steam, { col: 'rgba(255,255,255,0.7)', n: 3, size: 0.8, rise: 1.6, speed: 0.15 });
    let next = 0, turn = 0;
    const who = B.who;
    B.ticks.push((now) => {
      if (calm || now < next || !ids.length) return;
      next = now + 2600;
      does(who[ids[turn++ % ids.length].slice(5)], 'hop');
    });
  }
  if (h.stage) {
    // the stage across the back, the five dancers on it, one after another stepping out in a hop
    const stage = std({ color: '#7a4a2a', roughness: 0.7 });
    mesh(rbox(COLS - 2.2, 0.4, 3.2, 0.05), stage, 0, 0.2, tileZ(1));
    mesh(new THREE.BoxGeometry(COLS - 2.1, 0.04, 0.12), std({ color: '#e8c050', metalness: 0.6, roughness: 0.3 }), 0, 0.41, tileZ(1) + 1.58);
    for (let x = 1; x < COLS - 1; x++) for (let y = 0; y < 3; y++) B.blocked.add(key(x, y));
    const ids = Object.keys(figs).filter(k => k.startsWith('cast:'));
    for (const [i, k] of ids.entries()) {
      const id = k.slice(5);
      B.who[id] = await figure(id, { ...figs[k], flip: i < ids.length / 2 }, { x: 2.3 + i * 1.6, ty: 1 + (i % 2) * 0.6, y: 0.4 });
      B.talks.add(id);
    }
    let next = 0, turn = 0;
    const who = B.who;
    B.ticks.push((now) => {
      if (calm || now < next || !ids.length) return;
      next = now + 900;
      does(who[ids[turn++ % ids.length].slice(5)], 'hop');
    });
  }
  B.env = L ? leaderEnv(home, time) : INDOORS;
}

/* ---------- the Depths camp (docs/roadmap.md's Towns step 5) ---------- */

/** A miners' A-frame tent, its flap open on the front (+z before `turn`). */
function tent(x, z, turn, cloth) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = turn;
  B.group.add(g);
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.78, 0), new THREE.Vector2(0.78, 0), new THREE.Vector2(0, 1.1)]), { depth: 1.5, bevelEnabled: false });
  geo.translate(0, 0, -0.75);
  mesh(geo, std({ color: cloth[0], roughness: 1, flatShading: true }), 0, 0, 0, g);
  const door = mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.4, 0), new THREE.Vector2(0.4, 0), new THREE.Vector2(0, 0.74)])), new THREE.MeshBasicMaterial({ color: '#140a1e' }), 0, 0.002, 0.755, g);
  door.castShadow = false;
  const flap = mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.42, 0), new THREE.Vector2(0, 0.76)])), std({ color: cloth[1], roughness: 1, side: THREE.DoubleSide }), 0.02, 0.002, 0.77, g);
  flap.rotation.y = -0.5;
  const pole = std({ color: '#5a3a24', roughness: 0.9 });
  for (const zz of [-0.82, 0.82]) mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.24, 6), pole, 0, 0.62, zz, g);
  return g;
}

/** A rusty mine cart on its wheels, heaped with crystal. */
function crystalCart(x, z, C, rnd) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  B.group.add(g);
  const rust = std({ color: '#7a4a3a', roughness: 0.7, metalness: 0.35 }), iron = std({ color: '#3a3440', metalness: 0.6, roughness: 0.5 });
  mesh(rbox(0.66, 0.42, 0.92, 0.05), rust, 0, 0.44, 0, g);
  mesh(new THREE.BoxGeometry(0.7, 0.05, 0.96), iron, 0, 0.66, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 14), iron, sx * 0.34, 0.15, sz * 0.27, g);
    w.rotation.z = Math.PI / 2;
  }
  crystals(x, z, 0.42, C, rnd, { n: 4, y: 0.6 });
}

/** The rails from the way in, out into the camp. */
function mineRails(x, z0, z1) {
  const iron = std({ color: '#5a5260', metalness: 0.7, roughness: 0.4 }), wood = std({ color: '#4a3020', roughness: 0.95 });
  for (const dx of [-0.28, 0.28]) mesh(new THREE.BoxGeometry(0.05, 0.05, z1 - z0), iron, x + dx, 0.05, (z0 + z1) / 2).raycast = () => {};
  for (let z = z0 + 0.15; z < z1; z += 0.42) mesh(new THREE.BoxGeometry(0.8, 0.04, 0.14), wood, x, 0.02, z).raycast = () => {};
}

/** A miner's lamp on a post, its glass lit (a halo, no light of its own: the fire and the way in light the camp). */
function minerLamp(tx, ty) {
  const x = tileX(tx), z = tileZ(ty), wood = std({ color: '#4a3020', roughness: 0.95 }), iron = std({ color: '#2e2a34', metalness: 0.5, roughness: 0.5 });
  mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), wood, x, 0.75, z);
  mesh(new THREE.BoxGeometry(0.42, 0.06, 0.06), wood, x + 0.16, 1.45, z);
  mesh(new THREE.BoxGeometry(0.18, 0.04, 0.18), iron, x + 0.32, 1.38, z);
  mesh(new THREE.BoxGeometry(0.14, 0.2, 0.14), std({ color: '#ffe0a0', emissive: new THREE.Color('#ffc860'), emissiveIntensity: 1.6 }), x + 0.32, 1.26, z);
  const halo = sprite(haloArt('#ffc870'), 0.9);
  halo.visible = true;
  halo.material.blending = THREE.AdditiveBlending;
  halo.material.opacity = 0.5;
  halo.position.set(x + 0.32, 1.26, z + 0.05);
  B.blocked.add(key(tx, ty));
}

/** The way into the Depths proper: an old mine mouth shored up with timber in the back wall, violet light far down it. */
function wayIn(x, C) {
  const z = BACK_Z, f = fine(40, 48, 4), { g, lin } = f;
  g.fillStyle = lin(0, 0, 0, 48, ['#05020a', '#120626', '#3a1468']); g.fillRect(0, 0, 40, 48);
  const glow = g.createRadialGradient(20, 44, 1, 20, 44, 26);
  glow.addColorStop(0, 'rgba(240,200,255,0.95)'); glow.addColorStop(0.35, 'rgba(176,96,240,0.55)'); glow.addColorStop(1, 'rgba(176,96,240,0)');
  g.fillStyle = glow; g.fillRect(0, 0, 40, 48);
  g.fillStyle = 'rgba(0,0,0,0.5)'; for (let i = 0; i < 6; i++) g.fillRect(0, 10 + i * 6, 40, 1);
  const mouth = mesh(new THREE.PlaneGeometry(1.7, 2.1), new THREE.MeshBasicMaterial({ map: texOf(f.c), toneMapped: false }), x, 1.05, z + 0.02);
  mouth.castShadow = mouth.receiveShadow = false;
  const wood = std({ color: '#5a3a24', roughness: 0.95 }), dark = std({ color: '#3a2416', roughness: 0.95 });
  for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.22, 2.3, 0.22), wood, x + s * 0.95, 1.15, z + 0.12);
  mesh(new THREE.BoxGeometry(2.3, 0.26, 0.26), wood, x, 2.36, z + 0.12);
  mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), dark, x - 0.6, 2.36, z + 0.12).rotation.z = 0.9;
  mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), dark, x + 0.6, 2.36, z + 0.12).rotation.z = -0.9;
  // a board over it, its letters scratched in
  const sign = fine(48, 12, 4);
  sign.g.fillStyle = '#7a5434'; sign.g.fillRect(0, 0, 48, 12);
  sign.g.fillStyle = '#2a1608'; sign.g.font = '7px "PokeDB Pixel", monospace'; sign.g.textAlign = 'center'; sign.g.textBaseline = 'middle'; sign.g.fillText('DEPTHS', 24, 6.5);
  mesh(new THREE.PlaneGeometry(1.2, 0.3), std({ map: texOf(sign.c), roughness: 1 }), x, 2.7, z + 0.27);
  const light = new THREE.PointLight('#c070ff', 3, 6, 1.6);
  light.position.set(x, 1.1, z + 0.8);
  B.group.add(light);
  const halo = sprite(haloArt('#c890ff'), 2.4);
  halo.visible = true;
  halo.material.blending = THREE.AdditiveBlending;
  halo.material.opacity = 0.35;
  halo.position.set(x, 0.9, z + 0.3);
  return { light, halo, mouth };
}

/** The pentagram of Mewtwo's seal on a stone dais: a star carved in its top, a shard socket at each point, the towns'
    shards back glowing in their ring colours (`lit`: [colour or null] in the ring's order). */
function sealDais(x, z, C, lit) {
  const top = std({ color: C.stone[0], roughness: 0.9 }), side = std({ color: C.stone[2], roughness: 0.95 });
  mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.22, 40), [side, top, side], x, 0.11, z);
  mesh(new THREE.CylinderGeometry(1.0, 1.08, 0.2, 40), [side, top, side], x, 0.32, z);
  const f = fine(64, 64, 4), s = f.shine(), at = (k, r) => { const a = (-90 + k * 72) * Math.PI / 180; return [32 + Math.cos(a) * r, 32 + Math.sin(a) * r]; };
  const power = lit.filter(Boolean).length / lit.length;
  for (const ctx of [f.g, s]) {
    ctx.strokeStyle = C.crystal[2]; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(32, 32, 29, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = ctx === s ? 0.35 + power * 0.65 : 1;
    ctx.beginPath();
    for (const [i, k] of [0, 2, 4, 1, 3, 0].entries()) { const [px, py] = at(k, 26); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const star = mesh(new THREE.PlaneGeometry(2.0, 2.0), std({ map: texOf(f.c), transparent: true, alphaTest: 0.3, roughness: 0.9, emissive: new THREE.Color('#ffffff'), emissiveMap: texOf(f.c.glow), emissiveIntensity: 1.1 }), x, 0.425, z);
  star.rotation.x = -Math.PI / 2;
  star.castShadow = false;
  const gems = [];
  lit.forEach((col, k) => {
    const [u, v] = at(k, 26), gx = x + (u - 32) / 32, gz = z + (v - 32) / 32;
    mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.06, 12), side, gx, 0.45, gz);
    const gem = mesh(new THREE.OctahedronGeometry(0.12, 0), col
      ? std({ color: col, emissive: new THREE.Color(col), emissiveIntensity: 1.4, roughness: 0.2, flatShading: true })
      : std({ color: '#2a2238', roughness: 0.6, flatShading: true }), gx, 0.62, gz);
    gem.scale.y = 1.7;
    gems.push({ gem, col, k });
    if (col) {
      const halo = sprite(haloArt(col), 0.7);
      halo.visible = true;
      halo.material.blending = THREE.AdditiveBlending;
      halo.material.opacity = 0.55;
      halo.position.set(gx, 0.66, gz);
    }
  });
  return gems;
}


/** The Depths camp (js/data/camp.js), a crystal miners' camp: where every won run lands once the gate is broken, and
    Mewtwo's own runs before the Depths proper (their "Go down" is the way in at the back). The seal's pentagram on a
    stone dais holds the shards placed, lit in their towns' colours (shardsLit(), so the room is built anew as one comes
    back: room()'s id). Mewtwo stands by the way in (`figs.mewtwo`; a tap on it is its talk and the pentagram window,
    homeRoom() in js/run.js). */
async function buildCamp(figs, h) {
  const C = caveOf('depths');
  B.glowing = [];
  shell({ floor: caveFloor(C, [[9, 4.2, 'rgba(255,170,90,0.35)', 3.2], [3.5, 3.5, 'rgba(200,150,255,0.3)', 2.6], [6.5, 0.6, 'rgba(190,110,255,0.4)', 3]]),
    wall: caveWall((COLS + 0.8) * U, C, false), side: (left) => caveWall(ROWS * U, C, left), edge: C.rock[3], cap: C.rock[4], under: C.rock[4], bg: '#06040c' });
  B.env = { hemi: ['#c8b0f0', C.rock[4], 0.85], sun: ['#e8d8ff', 0.6], bloom: 0.8 };
  B.shotTop = 3.2;
  B.talks = new Set();
  const rnd = seeded(91), mid = 6;
  // the way in at the back, the rails out of it and a cart left on them; only Mewtwo goes past it (its "Go down")
  const mouth = wayIn(tileX(mid), C);
  mineRails(tileX(mid), BACK_Z + 0.2, tileZ(5.4));
  crystalCart(tileX(mid), tileZ(4.6), C, rnd);
  for (const k of [key(mid - 1, 0), key(mid + 1, 0), key(mid, 4), key(mid, 5)]) B.blocked.add(k);
  // Mewtwo's own run (no second Mewtwo here) fell in and goes on down: its way out is the mine, and there's no doormat
  // back up. Everyone else's is the doormat, to their win; the mine is Mewtwo's alone
  if (!figs.mewtwo) {
    for (const part of B.exitParts) B.group.remove(part);
    B.exitParts = [];
    B.exitAt = { x: mid, y: 0 };
    mouth.mouth.userData.spot = 'exit';
  } else B.blocked.add(key(mid, 0));
  // the seal's pentagram on its dais, the camp's two tents, the fire between them, crates and lamps
  const dx = tileX(3), dz = tileZ(3);
  const lit = shardsLit(getSave());
  const gems = sealDais(dx, dz, C, RING.map((t, i) => (lit[i] ? t.glow : null)));
  for (let x = 2; x <= 4; x++) for (let y = 2; y <= 4; y++) B.blocked.add(key(x, y));
  tent(tileX(10.5), tileZ(1.6), -0.25, ['#c8a878', '#b08e60']);
  tent(tileX(10.9), tileZ(5.6), -Math.PI / 2 - 0.15, ['#9aa070', '#80885a']);
  for (const [x, y] of [[10, 1], [11, 1], [10, 2], [11, 2], [10, 5], [11, 5], [10, 6], [11, 6]]) B.blocked.add(key(x, y));
  // the fire, with a log either side to sit on
  const fx = tileX(8.5), fz = tileZ(4.1), stone = std({ color: C.stone[2], roughness: 0.95 }), log = std({ color: '#5a3a24', roughness: 0.95 });
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; mesh(new THREE.DodecahedronGeometry(0.1, 0), stone, fx + Math.cos(a) * 0.38, 0.06, fz + Math.sin(a) * 0.32); }
  for (const a of [0.5, -0.6, 1.8]) mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 7), log, fx, 0.08, fz).rotation.set(Math.PI / 2, 0, a);
  for (const sx of [-1.15, 1.15]) mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 10), log, fx + sx, 0.16, fz + 0.1).rotation.set(Math.PI / 2, 0, 0);
  const ember = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 14), new THREE.MeshBasicMaterial({ color: '#ff7030', toneMapped: false }), fx, 0.14, fz);
  ember.raycast = () => {};
  const flame = sprite(flameArt('#ff8030'), 0.5);
  flame.visible = true;
  flame.center.set(0.5, 0);
  flame.position.set(fx, 0.12, fz);
  const glowHalo = sprite(haloArt('#ff9040'), 1.8);
  glowHalo.material.blending = THREE.AdditiveBlending;
  glowHalo.position.set(fx, 0.5, fz);
  const light = new THREE.PointLight('#ffb060', 2.4, 6, 1.5);
  light.position.set(fx, 0.9, fz);
  B.group.add(light);
  const fire = { flame, halo: glowHalo, light, ember, w: 1.1, seed: 17, lit: true, at: 0 };
  for (const k of [key(7, 4), key(8, 4), key(9, 4), key(10, 4)]) B.blocked.add(k);
  const crate = std({ color: '#8a6440', roughness: 0.9 });
  for (const [x, y, h, r] of [[0.9, 5.4, 0, 0.1], [1.0, 5.4, 0.5, -0.2], [1.9, 6.2, 0, 0.4]]) mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), crate, tileX(x), 0.25 + h, tileZ(y)).rotation.y = r;
  for (const k of [key(0, 5), key(1, 5), key(1, 6), key(2, 6)]) B.blocked.add(k);
  mesh(rbox(0.5, 0.08, 1.1, 0.04), std({ color: '#7a3a3a', roughness: 1 }), tileX(9.6), 0.04, tileZ(5.6)).raycast = () => {};   // a bedroll by the fire
  const pick = new THREE.Group();
  pick.position.set(tileX(4.7), 0, tileZ(0.5));
  pick.rotation.z = 0.35;
  B.group.add(pick);
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6), log, 0, 0.55, 0, pick);
  mesh(new THREE.BoxGeometry(0.6, 0.07, 0.07), std({ color: '#4a4652', metalness: 0.6, roughness: 0.4 }), 0, 1.08, 0, pick);
  for (const [tx, ty] of [[1, 1], [4, 7], [11, 8]]) minerLamp(tx, ty);
  for (const [tx, ty, sz] of [[0, 0, 1.3], [12, 0, 1.4], [2, 0, 0.8], [9, 0, 0.9], [0, 3, 1], [12, 4, 1.1], [0, 7, 0.8], [12, 7, 0.9]]) {
    crystals(tileX(tx) + (tx === 0 ? -0.2 : tx === 12 ? 0.2 : 0), tileZ(ty) - (ty === 0 ? 0.2 : 0), sz, C, rnd, { n: sz > 0.8 ? 6 : 4 });
    B.blocked.add(key(tx, ty));
  }
  // Mewtwo by the way in, watching it (not when you are Mewtwo)
  if (figs.mewtwo) {
    B.who.mewtwo = await figure('mewtwo', figs.mewtwo, h.mewtwoAt);
    B.talks.add('mewtwo');
    for (const k of [key(7, 1), key(8, 1)]) B.blocked.add(k);
  }
  const glowing = B.glowing;
  const motes = Array.from({ length: 10 }, (_, i) => ({ s: sprite(sparkArt(C.ember), 0.12), x: tileX(mid) + (rnd() - 0.5) * 1.4, phase: i / 10 }));
  const sparks = Array.from({ length: 6 }, (_, i) => ({ s: sprite(sparkArt('#ffb060'), 0.08), a: rnd() * 6, phase: i / 6 }));
  B.ticks.push((now) => {
    tickFire(fire, now);
    if (!calm) {
      for (const m of glowing) m.emissiveIntensity = 0.5 + Math.sin(now / 900 + m.id) * 0.12;
      mouth.light.intensity = 3 + Math.sin(now / 700) * 0.6;
      mouth.halo.material.opacity = 0.3 + Math.sin(now / 700) * 0.08;
      for (const { gem, col, k } of gems) { gem.rotation.y = now / 1400 + k; if (col) gem.material.emissiveIntensity = 1.3 + Math.sin(now / 500 + k) * 0.3; }
    }
    for (const m of motes) {   // the Depths' light drifting up out of the way in
      const t = calm ? m.phase : (now / 6000 + m.phase) % 1;
      m.s.visible = true;
      m.s.position.set(m.x + Math.sin(t * 5 + m.phase * 9) * 0.2, 0.2 + t * 2.6, BACK_Z + 0.4 + t * 0.8);
      m.s.material.opacity = Math.sin(t * Math.PI) * 0.85;
    }
    for (const p of sparks) {   // the fire's sparks
      const t = calm ? p.phase : (now / 1600 + p.phase) % 1;
      p.s.visible = !calm;
      p.s.position.set(fx + Math.sin(p.a + t * 4) * 0.18, 0.4 + t * 1.4, fz + Math.cos(p.a + t * 3) * 0.12);
      p.s.material.opacity = (1 - t) * 0.9;
    }
  });
}


/** The town's folk (js/data/towns.js's `folk`): the Game Corner's crowd code, a few about at once, coming and going up
    the road from the door. Their lines go in the room's speech window. */
let folkLayer = null;
function townCrowd(town, chats) {
  return makeCrowd({
    THREE, group: R.group, monBoard: async (...a) => { const m = await monBoard(...a); bendAll(m.group); return m; }, drawMon, dispose, PITCH, spots: [], door: DOOR, cols: COLS, rows: ROWS,
    route, free, tileX, tileZ, camera, view, stage: folkLayer, drawn,
    say: ({ line, who }) => opts?.onSay?.(who, line), partner: () => walker, keeper: () => null, calm: () => calm,
    cast: town.folk, shared: town.shared, chats, seed: `town-${town.id}`, size: 7, castSize: 10, castHours: 6,
    stations: town.stands.map(([x, y]) => ({ spot: { id: `stand-${x},${y}`, step: { x, y } }, kind: 'stand' })),
    wants: ['stand', 'stand', 'stand', 'stand', null, null, null], swap: [30000, 60000],
    walkers: 2,   // most stand at their spots, one or two about at a time (the user's ask, 2026-10-14)
  });
}

const BUILD = { tutor: buildTutor, deleter: buildDeleter, daycare: buildDaycare, fans: buildFans, spring: buildSpring, altar: buildAltar, grotto: buildGrotto,
  berry: buildBerry, well: buildWell, itemball: buildItemball, rocket: buildRocket, gym: buildGym, town: buildTown, home: buildHome };
/** The rooms built per biome and hour (the open-air ones and the grotto); the rest are one room wherever you are. */
const PER_BIOME = new Set(['spring', 'altar', 'grotto', 'berry', 'well', 'itemball', 'rocket', 'gym', 'town', 'home']);
/** A room's choices on the page (its layout's classes on #reward-options) and the buttons its signs are: the grotto is
    treasureRoom()'s, its one sign the chest. */
const ROOM_OF = (kind) => (kind === 'grotto' ? '.treasure-room' : `.event-room.${kind}-room`);
const SIGNS_OF = (kind) => (kind === 'grotto' ? '.treasure-chest' : '.reward-option');

/* ---------- walking ---------- */

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const free = (c) => c.x >= 0 && c.y >= 0 && c.x < COLS && c.y < ROWS && !R.blocked.has(key(c.x, c.y));

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
  const d = Math.hypot(dx, dz), move = dt / 1000 * (R.speed ?? 3.4);
  if (Math.abs(dz) > Math.abs(dx)) w.facing = dz < 0 && mon.sheets.back ? 'back' : 'front';
  else { w.facing = 'front'; w.flip = dx > 0; }
  if (d <= move) { w.x = tx; w.z = tz; w.tile = step; w.path.shift(); }
  else { w.x += dx / d * move; w.z += dz / d * move; }
  w.hop += dt;
  return !w.path.length;
}

/** Up to a choice's prop, or to the door to leave; `aim` is acted on as it arrives. */
function goTo(kind) {
  if (kind === 'exit' && R.noExit) return;   // Team Rocket's: no way back past them
  const target = kind === 'exit' ? R.exitAt ?? DOOR : R.doors?.[kind]?.step ?? R.spots[kind]?.step;   // a town's way on is its far gate, its houses' doors their own
  if (!target) return;
  aim = kind;
  walker.path = route(walker.tile, target);
  if (!walker.path.length) arrived();
}

function arrived() {
  let kind = aim;
  aim = null;
  if ((kind === null || kind === undefined) && R.exitAt && walker.tile.x === R.exitAt.x && walker.tile.y === R.exitAt.y) kind = 'exit';   // walked into a town's far gate
  if (kind === null || kind === undefined) kind = R.spots.findIndex(s => s.walkUp && s.step.x === walker.tile.x && s.step.y === walker.tile.y);
  if (kind === null || kind === undefined || kind < 0) return;
  hushBlip();
  if (kind === 'exit') return opts.onLeave();
  if (R.doors?.[kind]) { walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false; return opts.onDoor?.(R.doors[kind].id); }   // at a town house's door
  const step = R.spots[kind].step;
  if (walker.tile.x !== step.x || walker.tile.y !== step.y) return;
  walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
  opts.onPick(kind);
}

/* ---------- taps ---------- */

const canWalk = (e) => !busy && !acting && !frozen && !document.querySelector('.gym-scene') && inRoom() && !document.querySelector('dialog[open]')
  && !e.target.closest('button, a, input, select, dialog, .reward-bottom, #room-bar, .room-hinge, .top-bar, #collection-screen, .over, .gift-float, .floating-thing, .treasure-relic');

/** The screen's ray through a pointer as straight pieces of the world: one, or in a rolling town many short ones, each put
    back where it stands unbent, as the bend only moves what is drawn (the Clearing's tapRays()). Made once and reused,
    as a drag asks on every move. `rays.from` / `rays.n`: the pieces to try, nearest first. */
let rays = null;
function tapRays(e) {
  const STEP = 1.5;
  rays ??= Object.assign(Array.from({ length: 61 }, () => new THREE.Raycaster()), { at: new THREE.Vector2(), a: new THREE.Vector3(), b: new THREE.Vector3(), hit: new THREE.Vector3(), floor: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0) });
  const r = view.getBoundingClientRect(), aim = rays[0];
  aim.setFromCamera(rays.at.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), camera);
  if (!BEND.k.value) { rays.from = 0; rays.n = 1; return rays; }
  const o = aim.ray.origin, d = aim.ray.direction;
  for (let i = 1; i < rays.length; i++) {
    const a = unbend(rays.a.copy(o).addScaledVector(d, (i - 1) * STEP), BEND), b = unbend(rays.b.copy(o).addScaledVector(d, i * STEP), BEND), p = rays[i];
    p.ray.origin.copy(a); p.ray.direction.subVectors(b, a).normalize(); p.near = 0; p.far = a.distanceTo(b); p.camera = camera;
  }
  rays.from = 1; rays.n = rays.length;
  return rays;
}

/** What the pointer's pieces hit first, nearest first ([] for nothing). */
function hitsOf(rs, objects) {
  for (let i = rs.from; i < rs.n; i++) { const hits = rs[i].intersectObjects(objects, true); if (hits.length) return hits; }
  return [];
}

/** Where the pointer's pieces meet the floor (rays.hit), or null. */
function floorHit(rs) {
  for (let i = rs.from; i < rs.n; i++) if (rs[i].ray.intersectPlane(rs.floor, rs.hit) && rs.hit.distanceTo(rs[i].ray.origin) <= rs[i].far) return rs.hit;
  return null;
}

/** The floor tile under a pointer, or null off the floor. */
function floorTile(e) {
  const hit = floorHit(tapRays(e));
  if (!hit) return null;
  const t = { x: Math.round(hit.x + COLS / 2 - 0.5), y: Math.round(hit.z + ROWS / 2 - 0.5) };
  return t.x < 0 || t.y < 0 || t.x >= COLS || t.y >= ROWS ? null : t;
}
let drags = null;

/** Off to what was tapped: the confirm blip now, as you tap (the user's ask, 2026-10-12), not when you get there. */
function tapTo(spot) {
  if (spot === 'exit' && R.noExit) return;
  playSound('confirm');
  goTo(spot);
}

function onTap(e) {
  if (drags?.swallowed()) { e.stopPropagation(); e.preventDefault(); return; }
  if (!canWalk(e)) return;
  const sign = signAt(e.clientX, e.clientY);
  if (sign !== null) return tapTo(sign);
  const rs = tapRays(e);
  const hits = hitsOf(rs, [R.group, mon.group, ...Object.values(R.who).map(w => w.group)]);
  const first = hits[0]?.object;
  if (first && first === mon.board) { playCry(mon.id); walker.hopUntil = performance.now() + 500; return; }
  if (R.crowd?.tap(first)) return;   // a townsperson stops to talk
  let o = first;
  while (o && o.userData.spot === undefined && !o.userData.spotAt && !o.userData.who) o = o.parent;
  const spot = o?.userData.spotAt ? o.userData.spotAt(hits[0].point) : o?.userData.spot;   // the well: a toss a half
  if (spot !== undefined && (spot === 'exit' || R.spots[spot] || R.doors?.[spot])) return tapTo(spot);
  if (o?.userData.who) {
    const who = R.who[o.userData.who];
    if (who && R.talks?.has(o.userData.who)) { opts.onTalk?.(o.userData.who); if (!who.npc) playCry(who.id); does(who, who.npc ? 'npc-nod' : 'hop'); return; }   // a town's Gym Leaders and stall keeper chat
    if (who && !who.npc) { playCry(who.id); does(who, 'hop'); return; }
  }
  const hit = floorHit(rs);
  if (!hit) return;
  const t = { x: Math.round(hit.x + COLS / 2 - 0.5), y: Math.round(hit.z + ROWS / 2 - 0.5) };
  if (!R.exitAt && t.y >= ROWS && Math.abs(t.x - DOOR.x) <= 1) return tapTo('exit');   // the doorstep round the mat
  if (t.x < 0 || t.y < 0 || t.x >= COLS || t.y >= ROWS) return;
  const near = R.spots.findIndex(s => s.area?.(t));
  if (near >= 0) return tapTo(near);
  aim = null;
  walker.path = route(walker.tile, t);
  if (!walker.path.length) arrived();
}

/* ---------- camera (the Center's) ---------- */

function aimCamera(x, d, z = 0) {
  camera.position.set(x, LOOK_Y + Math.sin(PITCH) * d, z + Math.cos(PITCH) * d);
  camera.lookAt(x, LOOK_Y, z);
  camera.updateMatrixWorld();
}

// the text box over the bar: a room says something nearly all the time, so the shot always leaves it this much room
// (measuring the box itself swung the camera every time it came and went) and the doormat shows above it
const BOX_ROOM = 104;
const PUSH = 0.3;   // how far in the shot draws on a Gym Leader as they speak

function below() {
  const tops = ['#room-bar', '#reward-screen .room-hinge']
    .map(s => document.querySelector(s)).filter(n => n?.offsetHeight).map(n => n.getBoundingClientRect().top);
  return tops.length ? Math.max(0, viewH - Math.min(...tops)) + 6 : 120;
}

/** ACROSS tiles at least, and far enough back that the room from the doorstep up to its signs fits over the bar; a room
    longer than its `view` fits that many rows, the shot sliding up it with you (placeCamera()). */
function fitShot() {
  const h = viewH;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const topGap = 10, low = below() + BOX_ROOM, avail = Math.max(120, h - topGap - low), room = 2 * avail / h * 0.96;
  const span = (d) => {
    aimCamera(0, d);
    const half = Math.min(ROWS, R.view ?? ROWS) / 2;
    return [new THREE.Vector3(0, R.shotTop ?? 3.4, -half).project(camera).y, new THREE.Vector3(0, -0.3, half + 0.95).project(camera).y];
  };
  let lo = 2, hi = 80;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const [t, b] = span(mid); if (t - b > room) lo = mid; else hi = mid; }
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
  const d = Math.max(hi, (R.across ?? ACROSS) / 2 / halfTan);
  const [, b] = span(d);
  shot = { dist: d, half: d * halfTan, shift: (1 - b) / 2 * h - (h - low - 2), low };
}

// ?aerial: a whole town from high above, to see its layout at a glance (the Clearing's has the same)
const AERIAL = new URLSearchParams(location.search).has('aerial');

/* A town rolls away like the Clearing (the user's ask, 2026-10-14: "the animal crossing log style thing applied to ALL
   towns"), at the Clearing's strength (CURVE, ?curve=N, flat under ?aerial); a house's inside stays flat, as in Animal
   Crossing. A town's things are bent once as it's built, the crowd's as they come and your Pokémon's always; the strength
   is one uniform, 0 in every other room, so your Pokémon and anything a town shares with another room draw straight
   there. `z` follows the shot's focus every frame. */
const BEND = { k: { value: 0 }, z: { value: 0 } };

/** bendFine() cuts only boxes and planes. A rounded box's top, a gable or a pond's rim is still a few long triangles,
    and the bend draws straight between their corners, so a manor's plinth sagged a fifth of a tile under its own walls.
    So any other shape's triangles are halved along their longest side till none is two tiles long (a fifth of that
    sag), once, every copy of the shape sharing the cut; one that would need too many is left as it is. */
const cut = new WeakMap();
function fineTris(o) {
  const g = o.geometry;
  if (o.material.userData?.upright || !g?.attributes.position || g.morphAttributes.position) return;
  if (cut.has(g)) { o.geometry = cut.get(g); return; }
  if (Object.values(g.attributes).some(a => a.isInterleavedBufferAttribute)) { cut.set(g, g); return; }
  o.updateWorldMatrix(true, false);
  const sc = o.getWorldScale(new THREE.Vector3());
  let grow = Math.max(sc.x, sc.y, sc.z);
  if (o.isInstancedMesh) {   // a railing's ropes are one shape stretched along each run: cut for the longest
    const m = new THREE.Matrix4(), e = m.elements;
    let most = 0;
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); most = Math.max(most, Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10])); }
    grow *= most || 1;
  }
  const lim = (2.2 / grow) ** 2, budget = o.isInstancedMesh ? Math.max(200, 60000 / Math.max(1, o.count)) : 20000;   // lim: past a fine box's cell, corner to corner
  const p0 = g.attributes.position.array, ix = g.index?.array, corner = (t) => (ix ? ix[t] : t) * 3;
  const d2 = (i, j) => (p0[i] - p0[j]) ** 2 + (p0[i + 1] - p0[j + 1]) ** 2 + (p0[i + 2] - p0[j + 2]) ** 2;
  let long = false;
  for (let t = 0, n = ix ? ix.length : p0.length / 3; t + 2 < n && !long; t += 3) { const a = corner(t), b = corner(t + 1), c = corner(t + 2); long = d2(a, b) > lim || d2(b, c) > lim || d2(c, a) > lim; }
  if (!long) { cut.set(g, g); return; }
  const src = g.index ? g.toNonIndexed() : g, names = Object.keys(src.attributes), attrs = names.map(n => src.attributes[n]);
  const pos = src.attributes.position, len2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const vert = (i) => { const v = [pos.getX(i), pos.getY(i), pos.getZ(i)]; for (const a of attrs) for (let c = 0; c < a.itemSize; c++) v.push(a.array[i * a.itemSize + c]); return v; };
  const nor = names.indexOf('normal'), off = []; let at = 3;
  for (const a of attrs) { off.push(at); at += a.itemSize; }
  const mid = (a, b) => { const m = a.map((x, i) => (x + b[i]) / 2); if (nor >= 0) { const p = off[nor], l = Math.hypot(m[p], m[p + 1], m[p + 2]) || 1; m[p] /= l; m[p + 1] /= l; m[p + 2] /= l; } return m; };
  const out = attrs.map(() => []), groups = [], ranges = src.groups.length ? src.groups : [{ start: 0, count: pos.count, materialIndex: 0 }];
  let tris = 0;
  for (const r of ranges) {
    const from = tris;
    for (let i = r.start; i + 2 < Math.min(pos.count, r.start + r.count); i += 3) {
      const stack = [[vert(i), vert(i + 1), vert(i + 2)]];
      while (stack.length) {
        let [a, b, c] = stack.pop();
        const ab = len2(a, b), bc = len2(b, c), ca = len2(c, a);
        if (Math.max(ab, bc, ca) > lim && tris < budget) {
          if (bc >= ab && bc >= ca) [a, b, c] = [b, c, a]; else if (ca >= ab) [a, b, c] = [c, a, b];
          const m = mid(a, b);
          stack.push([a, m, c], [m, b, c]);
          continue;
        }
        for (const v of [a, b, c]) attrs.forEach((x, k) => { for (let q = 0; q < x.itemSize; q++) out[k].push(v[off[k] + q]); });
        tris++;
      }
    }
    groups.push([from * 3, (tris - from) * 3, r.materialIndex ?? 0]);
  }
  if (tris >= budget) { cut.set(g, g); return; }
  const made = new THREE.BufferGeometry();
  attrs.forEach((x, k) => made.setAttribute(names[k], new THREE.BufferAttribute(new x.array.constructor(out[k]), x.itemSize, x.normalized)));
  if (src.groups.length) for (const [s, n, m] of groups) made.addGroup(s, n, m);
  made.computeBoundingBox(); made.computeBoundingSphere();
  cut.set(g, made); cut.set(made, made);
  o.geometry = made;
}

const bendOne = (o) => {
  if (!o.material || o.userData.noBend) return;   // the towns' backdrop hangs on the crest itself (js/town-backdrop.js)
  if (o.isMesh) { bendFine(o); fineTris(o); }
  if (Array.isArray(o.material)) for (const m of o.material) bend(m, BEND); else bend(o.material, BEND);
};
const bendAll = (o) => { if (CURVE) o.traverse(bendOne); return o; };
/** A point in the world where a town draws it, dropped with the ground round it. */
const drawn = (v) => { v.y -= BEND.k.value * (v.z - BEND.z.value) ** 2; return v; };

function aerialShot() {
  const d = Math.max(ROWS / 2 + 2, (COLS / 2 + 2) / camera.aspect) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.far = Math.max(140, d * 1.6);
  camera.clearViewOffset();
  camera.position.set(0, d * 0.94, d * 0.34);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const k = Math.max(COLS, ROWS) / 2 + 2, c = sun.shadow.camera;
  if (c.right !== k) { Object.assign(c, { left: -k, right: k, top: k, bottom: -k }); c.updateProjectionMatrix(); }
  if (sun.target.position.x || sun.target.position.z) { sun.position.set(-4, 12, 7); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld(); }
}

function placeCamera(dt) {
  if (!shot) return;
  if (AERIAL && R.kind === 'town') return aerialShot();
  const room = COLS / 2 + 0.4, push = R.focus?.k || 0, half = shot.half * (1 - push * PUSH);
  const want = half >= room ? 0 : Math.max(-room + half, Math.min(room - half, walker.x));
  camX = calm ? want : camX + (want - camX) * Math.min(1, dt / 1000 * 4);
  // a long room: the shot a little ahead of you, up to its back; drawn in on whoever you walked up to (R.focus)
  const v = Math.min(ROWS, R.view ?? ROWS) / 2, far = BACK_Z + v - (R.reach ?? 0), near = ROWS / 2 - v;   // `reach`: past the back, for a gate too tall for the shot
  let wantZ = Math.max(far, Math.min(near, walker.z - v * 0.25));
  if (push) wantZ += (R.focus.z - wantZ) * push;
  camZ = calm || !Number.isFinite(camZ) ? wantZ : camZ + (wantZ - camZ) * Math.min(1, dt / 1000 * 3);
  camera.setViewOffset(viewW, viewH, 0, shot.shift, viewW, viewH);
  aimCamera(camX, shot.dist * (1 - push * PUSH), camZ);
  const sx = FOLLOW ? Math.round(camX) : 0, sz = FOLLOW ? Math.round(camZ) : 0;   // whole tiles, so the shadows don't crawl
  if (sun.target.position.x !== sx || sun.target.position.z !== sz) {
    sun.position.set(sx - 4, 12, sz + 7); sun.target.position.set(sx, 0, sz); sun.target.updateMatrixWorld();
  }
}

function resize() {
  const w = view.clientWidth, h = view.clientHeight;
  if (!w || !h || !R) return;
  renderer.setPixelRatio(1);
  const k = post.scale(w, h);
  renderer.setSize(Math.round(w * k), Math.round(h * k), false);
  post.size(w, h);
  camera.aspect = w / h;
  viewW = w; viewH = h;
  fitShot();
}

/* ---------- the frame ---------- */

/** Still in this room: it is up and showing. A deck picker, a reward or the map puts the 3D room away. */
const inRoom = () => !!(R && document.querySelector(`#reward-options${ROOM_OF(R.kind)}`)) && !document.getElementById('reward-screen').hidden;
/** Held behind a found item or relic the room just gave (hold()): the room keeps running under that screen. */
const heldUnder = () => !!(R?.held && document.querySelector('#reward-options.item-found')) && !document.getElementById('reward-screen').hidden;
const alive = () => inRoom() || heldUnder() || pickingOver();   // the Move Deleter's or the Day Care's deck picker stands over the room

function frame(now) {
  raf = 0;
  if (!alive()) return unmount();
  document.body.classList.toggle('ev3d-held', heldUnder());
  const dt = Math.min(100, now - (last || now));
  last = now;
  if (walk(dt)) arrived();
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x + (walker.ox || 0), walker.oy || 0, walker.z - (walker.lunge || 0) + (walker.oz || 0));
  mon.board.scale.set(walker.flip ? -1 : 1, 1, 1);
  mon.board.position.y = bob;
  if (warp) liveWarp(now);
  drawMon(mon, walker, dt);
  tickFigures(now, dt);
  for (const p of R.plays) tickPlay(p, now, dt);
  for (const t of R.ticks) t(now, dt);
  R.crowd?.tick(now, dt, inRoom());
  tickAct(now);
  if (!calm && mat) mat.emissiveIntensity = 0.12 + Math.sin(now / 420) * 0.1;
  placeCamera(dt);
  if (Number.isFinite(camZ)) BEND.z.value = camZ;
  if (R.sky && !AERIAL) R.sky.place(camera, BEND.k.value, BEND.z.value, R.sky.gateX, BACK_Z);
  placeSigns();
  post.draw(scene, camera, (drawn(new THREE.Vector3(walker.x, 0.6, walker.z)).project(camera).y + 1) / 2);
  raf = requestAnimationFrame(frame);
}

function tickAct(now) {
  if (!acting) return;
  const a = acting, k = Math.min(1, (now - a.from) / a.ms);
  for (const cue of a.cues) if (!cue.done && k >= cue[0]) { cue.done = true; playSound(cue[1]); }
  a.act.tick?.call(a.act, k);
  if (k >= 1) { acting = null; still(); a.done(); }
}

/** Your Pokémon back where it stood, once an act has moved it (a lunge, a soak in the pool). */
function still() { walker.lunge = walker.ox = walker.oy = walker.oz = 0; }

/** The room's own signs, floating over their props. */
function placeSigns() {
  const btns = document.querySelectorAll(`#reward-options.c3d ${SIGNS_OF(R.kind)}`), r = view.getBoundingClientRect();
  R.spots.forEach((spot, i) => {
    const b = btns[i], at = R.anchors[i];
    if (!b || !at) return;
    const p = drawn(at.clone()).project(camera), x = Math.round(r.left + (p.x + 1) / 2 * r.width), y = Math.round(r.top + (1 - p.y) / 2 * r.height);
    if (b.dataset.at === `${x},${y}`) return;
    b.dataset.at = `${x},${y}`;
    Object.assign(b.style, { left: `${x}px`, top: `${y}px`, width: '0px', height: '0px' });
    const label = b.querySelector('.center-label');
    if (label) label.style.marginLeft = label.style.marginBottom = '';
  });
}

/** The choice whose floating sign is under a tap, if any. */
function signAt(x, y) {
  const btns = document.querySelectorAll(`#reward-options.c3d ${SIGNS_OF(R.kind)}`);
  for (let i = 0; i < R.spots.length; i++) {
    const r = btns[i]?.querySelector('.center-label')?.getBoundingClientRect();
    if (r && r.width && x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 12) return i;
  }
  return null;
}

function unmount() {
  cancelAnimationFrame(raf);
  raf = 0;
  view?.classList.remove('on');
  view?.remove();
  removeEventListener('click', onTap, true);
  drags?.off(); drags = null;
  removeEventListener('resize', resize);
  document.getElementById('reward-options')?.classList.remove('c3d');
  document.body.classList.remove('ev3d-held');
  R?.crowd?.hide();
  folkLayer?.remove();
  if (R) R.held = false;
  leftAt = performance.now();
  busy = false; aim = null; frozen = false;
  if (acting) { const done = acting.done; acting = null; done(); }
  endWarp();
}

/* ---------- in ---------- */

let warming = null;
/** Three.js loaded and the renderer made, before it is needed (the map calls it, so walking in is quick). */
export function warmEvent() {
  warming ??= (async () => {
    THREE = await loadThree();
    await hubThree();
    view = document.createElement('canvas');
    view.className = 'center3d-view';
    renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, 1, 0.5, 140);
    hemi = new THREE.HemisphereLight('#fff8ec', '#9a7a60', 1.75);
    sun = new THREE.DirectionalLight('#fff2dc', 2.1);
    sun.position.set(-4, 12, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
    sun.shadow.bias = -0.0015;
    sun.shadow.normalBias = 0.02;
    scene.add(hemi, sun);
    post = createPost(renderer, { short: 760, crisp: false });
    post.final.uniforms.uBlur.value = 0;
    new ResizeObserver(() => { if (view.isConnected) resize(); }).observe(view);
  })();
  warming.catch(() => { warming = null; });
  return warming;
}

/** A room built once a page load (its trainer and Pokémon with it), kept for the next visit; an open-air one per biome's
    look, hour and (the Shrine's glow) type. `at`: { biome, type }. */
let building = Promise.resolve();
function room(kind, figs, at = {}) {
  const time = timeOfDay(), look = lookOf(at.biome), id = PER_BIOME.has(kind) ? `${kind}/${look === GARDEN && kind !== 'grotto' && kind !== 'gym' && kind !== 'town' && kind !== 'home' ? 'garden' : at.biome}/${time}/${kind === 'altar' ? at.type : kind === 'gym' ? at.leader?.id : kind === 'town' ? `${at.town?.id}${at.mended ? ':lit' : ''}` : kind === 'home' ? `${at.town?.id}:${at.home}${at.away ? ':away' : ''}${at.gift ? ':gift' : ''}${at.town?.id === 'depths' ? `:${shardsLit(getSave()).map(Number).join('')}${figs.mewtwo ? '' : ':self'}` : ''}` : ''}` : kind;
  if (built[id]) { const kept = built[id]; delete built[id]; built[id] = kept; }   // the newest last, for forgetRooms()
  // one at a time: a build fills the shared B
  built[id] ??= building = building.catch(() => {}).then(async () => {
    await warmEvent();
    const size = sizeOf(kind, at);
    B = { id, kind, size, group: new THREE.Group(), blocked: new Set(), anchors: {}, spots: [], who: {}, plays: [], ticks: [], acts: {}, mat: null, env: INDOORS, view: size?.view, across: size?.across };
    const b = B;
    useSize(b);
    try { await BUILD[kind](figs, { look, time, type: at.type, biome: at.biome, leader: at.leader, town: at.town, home: at.home, mended: at.mended, gift: at.gift }); }
    finally { B = null; if (R) useSize(R); }
    if (kind === 'town') { bendAll(b.group); for (const who of Object.values(b.who)) bendAll(who.group); }   // before its first draw, so the finer ground is the only one sent to the GPU
    await warmShaders(renderer, b.group, camera, scene);
    restGL(renderer);
    return b;
  });
  built[id].catch(() => { delete built[id]; });
  const asked = built[id];
  forgetRooms();
  return asked;
}

/** Only the last few rooms built are kept for a visit back: a long session's towns, homes and gyms would otherwise all
    stay in memory, which on an iPhone ends with Safari reloading the tab. */
const KEEP_ROOMS = 3;   // the next step's rooms (the map builds only those): a gym alone paints ~40MB of textures
let entering = null;   // the room mountEvent() is walking into
function forgetRooms() {
  const ids = Object.keys(built);
  for (const id of ids.slice(0, Math.max(0, ids.length - KEEP_ROOMS))) {
    const kept = built[id];
    if (kept === entering) continue;
    delete built[id];
    kept.then(b => {
      if (b === R || kept === entering) { built[id] ??= kept; return; }   // still standing in it, or about to be
      b.crowd?.hide();
      for (const who of Object.values(b.who)) { scene.remove(who.group); dispose(who.group); }
      dispose(b.group);
    }).catch(() => {});
  }
}

/** Builds a room ahead, while the map is up (`at` as room()'s). */
export function preloadEvent(kind, at = {}, figs = {}) {
  if (BUILD[kind] && kind !== 'rocket') room(kind, figs, at).catch(() => {});   // Team Rocket's is built for its grunt and Alpha
}

/** Lays the 3D room `o.kind` under the event room eventRoom() just showed. `o`: { kind, run, node (to tell coming back from a
    picker from a new visit), mate ({ src, name, cry }: your Pokémon), figures (eventRoom's: who stands where), after (the
    trainer's reaction once a picker is done), biome (the open-air rooms' look), type (the Shrine's glow), onPick(index): press that choice, onLeave(): press Leave }. Resolves the
    room's controls, or null if it was left while it loaded; throws if Three.js won't load (the pixel room stays). */
export async function mountEvent(o) {
  const back = visit && visit.node === o.node && visit.run === o.run && (o.spent || view?.isConnected || performance.now() - leftAt < 30000);   // a done room keeps its eaten berry, its picked-up ball
  visit = { node: o.node, run: o.run };
  opts = o;
  frozen = !!o.frozen;
  calm = calmFx();
  const next = await (entering = room(o.kind, o.figures || {}, { biome: o.biome, type: o.type, leader: o.leader, town: o.town, home: o.home, away: o.away, gift: o.gift, mended: o.mended }));
  const showing = () => document.querySelector(`#reward-options${ROOM_OF(o.kind)}`) && !document.getElementById('reward-screen').hidden;
  if (!showing() || opts !== o) return null;
  await wakeGL(renderer);
  if (!showing() || opts !== o) return null;
  useSize(next);
  if (R !== next) {
    if (R) { scene.remove(R.group); for (const who of Object.values(R.who)) scene.remove(who.group); }   // its people stand in the scene, not its group
    R = next;
    scene.add(R.group);
    for (const who of Object.values(R.who)) if (!who.group.parent) scene.add(who.group);
    scene.background = new THREE.Color(R.bg);
    hemi.color.set(R.env.hemi[0]); hemi.groundColor.set(R.env.hemi[1]); hemi.intensity = R.env.hemi[2];
    sun.color.set(R.env.sun[0]); sun.intensity = R.env.sun[1];
    post.final.uniforms.uBloom.value = R.env.bloom;
    mat = R.mat;
  }
  markQuests(o.marks);
  BEND.k.value = R.kind === 'town' ? CURVE : 0;
  if (R.kind === 'town') { bendAll(R.group); for (const who of Object.values(R.who)) bendAll(who.group); }   // anything it's grown since it was built
  for (const who of Object.values(R.who)) { who.turned = false; who.move = null; }   // a room shown again faces you, like the pixel one
  R.who.npc?.setDark?.(!!o.dark);   // a Gym Leader you haven't beaten: their silhouette till they speak
  R.held = false;
  document.body.classList.remove('ev3d-held');
  R.noExit = !!R.lockedExit && !o.spent;   // Team Rocket's way out opens once you've paid or run
  for (const part of R.exitParts || []) part.visible = !R.noExit;
  if (!back) {
    R.reset?.();   // a berry eaten, a sprout planted, a ball picked up last time: whole again
    if (R.scroll) { R.scroll.ink = 0.12; const m = R.scroll.mesh.material; m.map.dispose(); m.map = texOf(scrollArt(0.12)); m.needsUpdate = true; }
  }
  if (mon?.src !== o.mate.src) {
    if (mon) scene.remove(mon.group);
    mon = await monBoard(o.mate);
    scene.add(bendAll(mon.group));
  }
  mon.board.rotation.x = -PITCH;   // leaning back to the camera, whose tilt is this room's
  if (!showing() || opts !== o) return null;
  if (!back || o.at) {   // `at`: back out of a town's house, on its doorstep
    const at = o.at ?? DOOR;
    walker = { x: tileX(at.x), z: tileZ(at.y), tile: { ...at }, path: [], facing: o.at || !mon.sheets.back ? 'front' : 'back', flip: false, hop: 0 };
    camX = walker.x; camZ = NaN;
  }
  walker.path = []; still();
  document.body.append(view);
  if (R.town) {   // a town's folk, walked by the Game Corner's crowd code (js/corner-crowd.js), their bubbles on a layer of their own
    folkLayer ??= Object.assign(document.createElement('div'), { className: 'town-stage' });
    document.body.append(folkLayer);
    // their chats follow the town's story (js/data/towns.js's folkChats(), handed in as `o.chats`): one array kept per room,
    // refilled on every visit, as the crowd reads it each time two folk talk
    R.chats ??= [];
    R.chats.splice(0, R.chats.length, ...(o.chats ?? R.town.chats));
    R.crowd ??= townCrowd(R.town, R.chats);
    R.crowd.enter();
  }
  document.getElementById('reward-options').classList.add('c3d');
  for (const label of document.querySelectorAll('#reward-options .reward-option .center-label')) label.textContent = oneWord(label.textContent);
  addEventListener('click', onTap, true);
  drags?.off();
  drags = dragWalk({ can: canWalk, tile: floorTile, go: (t) => { aim = null; walker.path = reroute(walker, route, t); } });
  addEventListener('resize', resize);
  resize();
  last = 0;
  if (!raf) raf = requestAnimationFrame(frame);
  requestAnimationFrame(() => view.classList.add('on'));
  for (const [stand, move, at] of queued.splice(0)) if (performance.now() - at < 3000) does(R.who[stand], move);
  if (o.after) does(R.who.npc, o.after);
  return controls;
}

/** A bobbing "!" (the user's ask, 2026-10-14): `door:<id>` over a town house's name sign (the user's call: the sign,
    not the roof; the roof if it has none) while a step's ready to hand its Gym Leader, `who:<id>` over someone in the
    room (that leader at home), `board` over a town's quest board till you've read it. Made once a room, shown on the
    visits that ask. */
function markQuests(ids = []) {
  R.marks ??= {};
  for (const m of Object.values(R.marks)) if (m) m.visible = false;
  for (const id of ids) {
    if (!(id in R.marks)) R.marks[id] = questMark(id);
    if (R.marks[id]) R.marks[id].visible = true;
  }
}

function questMark(id) {
  const [kind, name] = id.split(':'), door = kind === 'door' && R.doors?.[id], who = kind === 'who' && R.who[name];
  const at = kind === 'board' ? R.boardAt && [tileX(R.boardAt.x), 2.9, tileZ(R.boardAt.y)] : door && R.signs?.[name] && [...R.signs[name]];
  if (!door && !who && !at) return null;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texOf(newsArt()), transparent: true, depthWrite: false, toneMapped: false }));
  s.raycast = () => {};
  s.userData.noBend = true;   // a sprite's shader isn't bent: it drops with the ground below on the CPU instead (drawn())
  let y;
  if (at) {
    s.scale.set(0.5, 0.65, 1);
    s.position.set(at[0], (y = at[1] + 0.5), at[2]);
    R.group.add(s);
  } else if (door) {
    const box = new THREE.Box3().setFromObject(door.g);
    s.scale.set(0.62, 0.8, 1);
    s.position.set(tileX(door.step.x), (y = box.max.y + 0.75), (box.min.z + box.max.z) / 2);
    R.group.add(s);
  } else {
    s.scale.set(0.42, 0.55, 1);
    s.position.set(0, (y = (who.top ?? 1.4) + 0.45), 0);
    who.group.add(s);
  }
  // a town's ground rolls away over the horizon (CURVE, the user's call, 2026-10-14: the "!" stays on what it's over)
  R.ticks.push((now) => { if (s.visible) s.position.y = y + (calm ? 0 : Math.sin(now / 380) * 0.08) - (who ? 0 : BEND.k.value * (s.position.z - BEND.z.value) ** 2); });
  return s;
}

const SHORT = { 'Forget a move': 'Forget one', 'Trade a move': 'Trade', 'Accept their gift': 'Gift', 'Soak: full HP': 'Soak' };
/** A word or two a sign this close in, the price kept (the hint says the rest). */
const oneWord = (text) => SHORT[text] ?? text.replace(/^(Plant) \+\d+ max HP$/, '$1');

/** What eventRoom()'s choices ask of the room. */
const controls = {
  /** Keep the room running under the found item or relic screen it is about to show (the Item Ball, the Wishing Well). */
  hold() { if (R && inRoom()) R.held = true; },
  /** Play a choice out on the props (`opts` how it goes: a big toss, a win, a Voltorb); resolves once it has (at once under
      reduced motion, its sounds still played). */
  act(name, opts) {
    const act = R?.acts[name];
    if (!act || !alive()) return Promise.resolve();
    walker.path = []; aim = null;
    walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
    const of = (v) => (typeof v === 'function' ? v(opts) : v), cues = of(act.cues) || [];   // a toss's or a pickup's depend on how it goes
    if (calm) { for (const [, s] of cues) playSound(s); act.start?.call(act, opts); act.tick?.call(act, 1); still(); return Promise.resolve(); }
    return new Promise(done => {
      act.start?.call(act, opts);
      acting = { name, act, from: performance.now(), ms: of(act.ms), cues: cues.map(c => [...c]), done };
    });
  },
  /** A Gym Leader's silhouette lit up as they start to speak, with a sparkle. */
  light() {
    const who = R?.who.npc;
    if (alive()) R.flare?.();
    if (!who?.dim || !alive()) return;
    who.setDark(false);
    playSound('stat-up');
    R.shine?.();
  },
  /** Someone in the room reacts (figureDoes()). */
  does(stand, move) {
    if (R && alive()) does(R.who[stand], move);
    else queued.push([stand, move, performance.now()]);
  },
};

/** figureDoes() in js/run.js: to the room, or held for it while it mounts (a picker's Back shows the room again). */
export const figure3d = (stand, move) => controls.does(stand, move);

/** The room's controls while one is up, for figureDoes() and playOut() in js/run.js. */
/** Hold your Pokémon where it stands, or let it walk again: a Gym Leader's talks, from the first beat of their slide-in
    to their last line (the user's ask, 2026-10-13: you only click through, then you're free). */
export function freezeEvent(on) {
  frozen = !!on;
  if (on) { walker.path = []; aim = null; }
}

/** JONA possessing Phil (a tap on her in his home, the user's ask, 2026-10-15): `on`, she flies into `into` and he lifts
    off the floor, shuddering in her violet light; off, she leaves him and drifts back to her corner. Resolves once there. */
export function possess(from, into, on) {
  const a = R?.who[from], b = R?.who[into];
  if (!a || !b) return Promise.resolve();
  let st = R.possession;
  if (!st) {
    st = R.possession = { f: 0, to: 0, done: null };
    const mb = b.board.material, va = new THREE.Vector3(), vb = new THREE.Vector3();
    mb.emissive.set('#b060ff'); mb.emissiveMap = b.t; mb.emissiveIntensity = 0; mb.needsUpdate = true;
    a.board.material.transparent = true;
    let last = performance.now();
    R.ticks.push((now) => {   // after tickFigures(), so it has the last word on where they stand
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      st.f = st.to > st.f ? Math.min(st.to, st.f + dt / (calm ? 0.01 : 0.9)) : Math.max(st.to, st.f - dt / (calm ? 0.01 : 1.2));
      if (st.f === st.to && st.done) { const d = st.done; st.done = null; d(); }
      const e = st.f * st.f * (3 - 2 * st.f), held = Math.max(0, st.f * 2 - 1);   // she's in him for the second half
      va.set(a.base.x, a.base.y, a.base.z);
      vb.set(b.base.x, b.base.y + 0.6, b.base.z + 0.05);
      a.group.position.lerpVectors(va, vb, e);
      a.group.scale.setScalar(1 - e * 0.75);
      a.board.material.opacity = 1 - held;
      a.group.visible = st.f < 0.98;
      if (!st.f) return;
      const sway = calm ? 0 : 1;
      b.group.position.y = b.base.y + held * 0.35 + Math.sin(now / 320) * 0.06 * held * sway;
      b.group.position.x = b.base.x + Math.sin(now / 31) * 0.025 * held * sway;   // a shudder
      mb.emissiveIntensity = held * (1 + Math.sin(now / 160) * 0.3 * sway);
    });
  }
  st.to = on ? 1 : 0;
  return new Promise((done) => { if (st.f === st.to) done(); else st.done = done; });
}

let warp = null, warpBeam = null;   // a Waystone's light setting your Pokémon down in a town it's visiting (in) or carrying it home (out)

/** A visit from home (visitTown() in js/run.js) arriving and leaving the way the Clearing's Waystone sends it off and
    takes it back (liveWarp() in js/hub-3d.js): a column of the town's light (its RING colour) round your Pokémon, which
    comes down out of it (`out` false, after `delay` ms, with a hop and its cry) or fades up into it. You can't walk
    meanwhile. Resolves once it's done (at once under reduced motion). */
export function townWarp(town, out, delay = 0) {
  endWarp();
  if (!alive() || calm) return Promise.resolve();
  walker.path = []; aim = null; walker.facing = 'front'; walker.flip = false;
  if (out) playSound('gate-hum');
  const colour = RING.find(o => o.id === town)?.glow ?? '#d8f0ff', was = frozen, ms = out ? 900 : 1100;
  frozen = true;
  // ended by a timer, not the frames, as the hub's warpTo() is: a tab that stops drawing never strands you in the light
  return new Promise(done => {
    const w = warp = { at: performance.now() + delay, ms, out, colour, was, done };
    w.timer = setTimeout(() => {
      if (warp !== w) return;
      w.ended = true;
      if (out) return done();   // held up in the light till the curtain falls and the room goes
      frozen = was;
      walker.hopUntil = performance.now() + 500;
      playCry(mon.id);
      endWarp();
      done();
    }, delay + ms);
  });
}

function liveWarp(now) {
  if (!warpBeam) {
    warpBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
    warpBeam.raycast = () => {};
    scene.add(bendAll(warpBeam));
  }
  const t = Math.max(0, Math.min(1, (now - warp.at) / warp.ms));
  const k = warp.out ? t : 1 - t;   // how far into the light
  warpBeam.visible = true;
  warpBeam.material.color.set(warp.colour);
  warpBeam.position.set(walker.x, 3, walker.z);
  warpBeam.scale.set(0.4 + k * 0.6, 1, 0.4 + k * 0.6);
  warpBeam.material.opacity = Math.min(0.75, Math.sin(Math.min(1, warp.out ? t * 1.3 : t + 0.15) * Math.PI) * 0.8);
  mon.board.scale.x *= 1 - k * 0.6;
  mon.board.scale.y = 1 - k * 0.6;
  mon.board.position.y += k * 1.4;
}

/** The light gone, your Pokémon whole again (a room left, or a new warp). */
function endWarp() {
  if (!warp) return;
  const w = warp;
  warp = null;
  clearTimeout(w.timer);
  if (warpBeam) warpBeam.visible = false;
  if (!w.ended) { frozen = w.was; w.done(); }
}

/** The gym's badge on its arch: where it is on the screen (null without the 3D gym), and taking it down as it's grabbed
    or putting it back (badgeGet() in js/gym.js). */
export const gymBadgeAt = () => (R?.crest && alive() ? R.crest.at() : null);
export function gymBadgeShown(on) { if (alive()) R?.crest?.show(on); }

/** Your Pokémon as it is now, swapped in where it stands: it evolved in the room (a Gym Leader's, after the badge). */
export async function swapMate(mate) {
  if (!alive() || !mon || mon.src === mate.src) return;
  const next = await monBoard(mate);
  if (!alive()) return;
  next.board.rotation.x = -PITCH;
  scene.remove(mon.group);
  mon = next;
  scene.add(mon.group);
  if (opts) opts.mate = mate;
}

export const eventRoom3d = () => (R && alive() ? controls : null);

/** A Waystone's rune circle, white (the material tints it): two rings, a band of runes between them, a star. */
function runeCircleArt() {
  const n = 256, r = n / 2, c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d');
  if (!g) return c;
  g.translate(r, r);
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round';
  const ring = (rad, w) => { g.lineWidth = w; g.beginPath(); g.arc(0, 0, rad, 0, Math.PI * 2); g.stroke(); };
  ring(122, 4); ring(112, 2); ring(84, 3); ring(40, 2);
  g.lineWidth = 3;
  for (let i = 0; i < 24; i++) {   // the runes: a few strokes each, from a little stroke alphabet
    g.save(); g.rotate(i / 24 * Math.PI * 2); g.translate(0, -98);
    const k = (i * 7) % 5;
    g.beginPath();
    g.moveTo(0, -8); g.lineTo(0, 8);
    if (k === 0) { g.moveTo(-5, -8); g.lineTo(5, 0); }
    if (k === 1) { g.moveTo(-5, 0); g.lineTo(5, -6); g.moveTo(-5, 6); g.lineTo(5, 0); }
    if (k === 2) { g.moveTo(0, -2); g.lineTo(6, -8); g.moveTo(0, -2); g.lineTo(-6, -8); }
    if (k === 3) { g.moveTo(-6, 8); g.lineTo(6, -8); }
    if (k === 4) { g.moveTo(-5, -4); g.lineTo(5, -4); g.moveTo(-5, 4); g.lineTo(5, 4); }
    g.stroke(); g.restore();
  }
  g.lineWidth = 2.5;
  g.beginPath();
  for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 4 / 5; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 84, Math.sin(a) * 84); }
  g.stroke();
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; g.beginPath(); g.arc(Math.cos(a) * 84, Math.sin(a) * 84, 6, 0, Math.PI * 2); g.fill(); }
  return c;
}

/** The shard put back (docs/roadmap.md's Towns step 6, session 4; made far grander 2026-10-15, the user's ask): a crystal
    in the town's colour (`glowCol`) rises off your Pokémon and arcs over to the town's broken Waystone, where it hangs and
    spins as a rune circle burns into the ground round the stone and motes of light spiral in from all over the plaza; it
    sinks into the crack, the stone shudders and blazes, and with a flash (`onFlash`, the screen's own white-out and shake,
    js/gym.js's wayFlash()) the stone stands whole (wholeWaystone()): two shockwaves roll out, sparks burst, a pillar of
    light goes up into the sky with motes riding it, and the circle flares out and fades. Under reduced motion it's only
    the swap. The room is kept as the town's mended one (its `:lit` id), so the board's redraw after needs no rebuild.
    Resolves once it's done. */
export function mendStone(glowCol = '#8ae8ff', onFlash = null) {
  const room = R, st = room?.stone;
  if (!alive() || room.kind !== 'town' || !st || st.whole) return Promise.resolve();
  st.whole = true;
  walker.path = []; aim = null;
  const { f } = st, S = 1.45, top = new THREE.Vector3(f.cx, 2.75 * S / 1.45 + 0.5, f.cz), crack = new THREE.Vector3(f.cx, 0.95 * S, f.cz + 0.05);
  const from = new THREE.Vector3(walker.x, 0.9, walker.z), col = new THREE.Color(glowCol);
  const made = [], add = (o) => { scene.add(o); made.push(o); return o; };
  const glowMat = (c = col) => new THREE.SpriteMaterial({ map: texOf(haloArt('#ffffff')), color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const flat = (o) => new THREE.MeshBasicMaterial({ color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, ...o });
  const gem = add(new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.8, roughness: 0.3, flatShading: true })));
  gem.scale.y = 1.6;
  const halo = add(new THREE.Sprite(glowMat()));
  halo.scale.setScalar(0.9);
  const flare = add(new THREE.Sprite(glowMat(new THREE.Color('#ffffff'))));
  flare.visible = false;
  // the rune circle burning into the ground round the stone
  const circle = add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flat({ map: texOf(runeCircleArt()), opacity: 0 })));
  circle.rotation.x = -Math.PI / 2;
  const rings = [0, 1].map(() => {
    const o = add(new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 64), flat()));
    o.rotation.x = -Math.PI / 2;
    o.visible = false;
    return o;
  });
  const beamGeo = new THREE.CylinderGeometry(0.28, 0.5, 40, 24, 1, true); beamGeo.translate(0, 20, 0);
  const beam = add(new THREE.Mesh(beamGeo, flat({ opacity: 0 })));
  const coreGeo = new THREE.CylinderGeometry(0.1, 0.16, 40, 12, 1, true); coreGeo.translate(0, 20, 0);
  const core = add(new THREE.Mesh(coreGeo, flat({ color: '#ffffff', opacity: 0 })));
  beam.visible = core.visible = false;
  // motes of light: spiralling in to the gem as it hangs, then riding the pillar up; sparks: bursting off the flash
  const moteMat = glowMat(col.clone().lerp(new THREE.Color('#ffffff'), 0.35)), sparkMat = glowMat(col.clone().lerp(new THREE.Color('#ffffff'), 0.6));
  const motes = Array.from({ length: 44 }, (_, i) => {
    const s = add(new THREE.Sprite(moteMat));
    s.visible = false;
    return { s, a: i / 44 * Math.PI * 2 * 3 + Math.random(), r: 3 + Math.random() * 3.5, y: 0.2 + Math.random() * 2.5, at: Math.random() * 0.45, size: 0.1 + Math.random() * 0.14 };
  });
  const sparks = Array.from({ length: 40 }, () => {
    const s = add(new THREE.Sprite(sparkMat));
    s.visible = false;
    const a = Math.random() * Math.PI * 2, v = 2.5 + Math.random() * 4.5;
    return { s, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vy: 2 + Math.random() * 5, size: 0.08 + Math.random() * 0.12 };
  });
  for (const o of made) o.raycast = () => {};
  const place = (o, v) => o.position.copy(drawn(v.clone()));   // with the town's bend, where the ground under it is drawn
  const stoneAt = st.g.position.clone();
  // the stone made whole, in place of the broken one: built in the room's kit as buildTown() would have
  const swap = () => {
    st.g.position.copy(stoneAt);
    B = room;
    let g;
    try {
      g = wholeWaystone(f, st.L);
      if (st.fade) {
        const old = new Set();
        st.g.traverse(o => { for (const m of [].concat(o.material || [])) old.add(m); });
        if (room.fades) room.fades.splice(0, room.fades.length, ...room.fades.filter(h => !old.has(h.mats[0]?.[0])));
        fadeBehind(g);
      }
    } finally { B = null; }
    if (st.spot) g.traverse(o => { o.userData.spot = st.spot; });
    bendAll(g);
    room.group.remove(st.g);
    dispose(st.g);
    st.g = g;
    // kept as the town's mended room: the board's redraw (mended) finds it built
    const id = room.id, lit = `${id}:lit`;
    if (id && !id.endsWith(':lit') && built[id]) { built[lit] = built[id]; delete built[id]; room.id = lit; }
  };
  const done = () => {
    room.ticks.splice(room.ticks.indexOf(tick) >>> 0, 1);
    room.focus = null;
    const mats = new Set();
    for (const o of made) { scene.remove(o); o.geometry?.dispose(); mats.add(o.material); }
    for (const m of mats) { m.map?.dispose(); m.dispose(); }
  };
  if (calm) {
    playSound('core-surge');
    swap();
    done();
    return Promise.resolve();
  }
  // its beats, in ms: up off your Pokémon, over to the stone, hanging over its tip as the circle burns in and the motes
  // gather, sinking into the crack (the stone shuddering), the flash, and the pillar of light fading
  const UP = 800, OVER = 1900, HANG = 3500, SINK = 4300, FLASH = 4500, END = 8200;
  const t0 = performance.now(), cues = [[0, 'crystal-0'], [OVER, 'crystal-1'], [OVER + 100, 'gate-hum'], [OVER + 700, 'charge'], [HANG - 300, 'rumble-far'], [HANG, 'crystal-2'],
    [FLASH, 'core-surge'], [FLASH + 60, 'sunburst'], [FLASH + 300, 'thunder'], [FLASH + 1400, 'crystal-2']];
  room.focus = { z: f.cz, k: 0 };
  let swapped = false, over = false, tick;
  return new Promise(resolve => {
    const finish = () => {
      if (over) return;
      over = true;
      if (!swapped) { swapped = true; swap(); onFlash?.(); }
      done();
      resolve();
    };
    setTimeout(finish, END + 2000);   // the room stopped drawing (left, or the tab hidden): mended all the same
    tick = (now) => {
      const t = now - t0, v = new THREE.Vector3();
      while (cues.length && t >= cues[0][0]) playSound(cues.shift()[1]);
      const gather = Math.max(0, Math.min(1, (t - OVER) / (HANG - OVER))), sinking = Math.max(0, Math.min(1, (t - HANG) / (SINK - HANG)));
      // drawn in on the stone, closer as it gathers, easing back once the light is up
      room.focus.k = (Math.min(1, t / 900) * 0.55 + gather * 0.3) * (t > FLASH + 1800 ? Math.max(0, 1 - (t - FLASH - 1800) / 1400) : 1);
      if (t < UP) v.lerpVectors(from, from.clone().setY(1.9), ease(t / UP));
      else if (t < OVER) {
        const k = ease((t - UP) / (OVER - UP));
        v.lerpVectors(from.clone().setY(1.9), top, k);
        v.y += Math.sin(k * Math.PI) * 1.1;
      } else if (t < HANG) v.copy(top).setY(top.y + gather * 0.35 + Math.sin((t - OVER) / 140) * 0.05);
      else v.lerpVectors(top.clone().setY(top.y + 0.35), crack, ease(sinking));
      place(gem, v);
      place(halo, v);
      gem.rotation.y = t / (t < OVER ? 220 : 90 - gather * 50);
      gem.visible = halo.visible = t < FLASH;
      halo.scale.setScalar(0.9 + gather * 0.8 + sinking * 1.4 + Math.sin(t / (120 - gather * 60)) * (0.08 + gather * 0.2));
      if (!swapped) {
        st.g.userData.boost = gather * 1.5 + sinking * 3 + Math.max(0, (t - SINK) / (FLASH - SINK)) * 3;
        const quake = gather * 0.015 + sinking * 0.05;   // the stone shudders as it takes the shard
        st.g.position.set(stoneAt.x + (Math.random() - 0.5) * quake, stoneAt.y, stoneAt.z + (Math.random() - 0.5) * quake);
      }
      if (t >= FLASH && !swapped) { swapped = true; swap(); onFlash?.(); }
      // the circle: burning in as the motes gather, spinning, then flaring out wide after the flash and fading
      const after = t - FLASH;
      const cIn = after < 0 ? Math.max(0, (t - OVER + 300) / (HANG - OVER)) : 1;
      circle.visible = cIn > 0 && after < 2600;
      if (circle.visible) {
        place(circle, new THREE.Vector3(f.cx, 0.07, f.cz));
        circle.rotation.z = t / 1600;
        const flareOut = after < 0 ? 0 : ease(Math.min(1, after / 2600));
        circle.scale.setScalar(3.6 + Math.min(1, cIn) * 0.6 + sinking * 0.4 + flareOut * 7);
        circle.material.opacity = Math.min(1, cIn) * (0.75 + (after < 0 ? Math.sin(t / 90) * 0.15 * sinking : 0.25)) * (1 - flareOut);
      }
      for (const m of motes) {   // spiralling in: each starts on its own beat, closing in fast
        const k = (gather - m.at) / (1 - m.at + 0.15);
        m.s.visible = after < 0 && k > 0 && k < 1;
        if (m.s.visible) {
          const e = k * k, r = m.r * (1 - e), a = m.a + e * 5;
          place(m.s, new THREE.Vector3(v.x + Math.cos(a) * r, m.y + (v.y - m.y) * e, v.z + Math.sin(a) * r));
          m.s.scale.setScalar(m.size * (0.4 + Math.sin(k * Math.PI)));
        }
      }
      if (after >= 0) {
        const k = Math.min(1, after / 1500);
        flare.visible = after < 1100;
        place(flare, new THREE.Vector3(f.cx, crack.y, f.cz + 0.4));
        flare.scale.setScalar(2 + Math.min(1, after / 220) * 11);
        flare.material.opacity = Math.max(0, 1 - after / 1100);
        rings.forEach((ring, i) => {   // two shockwaves, the second a beat behind and wider
          const rk = Math.min(1, Math.max(0, after - i * 260) / (1400 + i * 400));
          ring.visible = rk > 0 && rk < 1;
          place(ring, new THREE.Vector3(f.cx, 0.08 + i * 0.02, f.cz));
          ring.scale.setScalar(1 + ease(rk) * (10 + i * 5));
          ring.material.opacity = (1 - rk) * (0.95 - i * 0.25);
        });
        const PILLAR = END - FLASH - 300, pk = Math.min(1, after / PILLAR);
        beam.visible = core.visible = pk < 1;
        place(beam, new THREE.Vector3(f.cx, 0, f.cz));
        place(core, new THREE.Vector3(f.cx, 0, f.cz));
        const swell = Math.min(1, after / 160), fade = 1 - ease(Math.max(0, (pk - 0.45) / 0.55));
        beam.material.opacity = swell * fade * 0.6;
        core.material.opacity = swell * fade * 0.9;
        const w = 1.8 - Math.min(1, after / 500) * 0.8 + Math.sin(after / 70) * 0.06;   // bursts wide, then settles to a steady column
        beam.scale.set(w * (1 + k * 0.4), 1, w * (1 + k * 0.4));
        core.scale.set(w, 1, w);
        for (const m of motes) {   // riding the pillar up into the sky
          const mk = (after / 2600 - m.at * 0.8);
          m.s.visible = mk > 0 && mk < 1 && pk < 1;
          if (m.s.visible) {
            const a = m.a + after / 400, r = 0.35 + m.size * 2;
            place(m.s, new THREE.Vector3(f.cx + Math.cos(a) * r, 0.4 + mk * 9, f.cz + Math.sin(a) * r));
            m.s.scale.setScalar(m.size * 1.4 * (1 - mk));
          }
        }
        const sk = after / 1000;   // sparks off the flash, falling back to the ground
        for (const p of sparks) {
          p.s.visible = sk < 1.6;
          if (!p.s.visible) continue;
          const y = crack.y + p.vy * sk - 4.9 * sk * sk;
          p.s.visible = y > 0.02;
          place(p.s, new THREE.Vector3(f.cx + p.vx * sk, Math.max(0.02, y), f.cz + p.vz * sk));
          p.s.scale.setScalar(p.size * (1 - sk / 1.6));
        }
      }
      if (t >= END) finish();
    };
    room.ticks.push(tick);
  });
}


