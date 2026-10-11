/* event-3d.js  -  the run's indoor ? rooms as 3D rooms you walk about, like the Center (js/center-3d.js) and the Mart (the
   user's ask, 2026-10-11): the Move Tutor's dojo, the Move Deleter's study, the Day Care and the Fan Club. It is only the
   scene: eventRoom() in js/run.js keeps each room's choices (their two taps: the first says the hint, the second takes it),
   text box and bar, and this lays the room under them. A tap on a choice's prop, or its floating sign, walks your Pokémon
   up and presses that choice; the doormat walks it out. Each room's trainer stands in it as their sprite, blinking, and
   does what figureDoes() in js/run.js asks (nod, jump, shake their head, turn round); a choice plays out on the props
   (`act()`, in place of the pixel scene's ACTS). The decor is the Secret Base's furniture models (js/base-mesh.js). */

import { calmFx } from './prefs.js';
import { playSound, playCry } from './audio.js';
import { loadThree, tex, crop, monBoard, drawMon, createPost, doormat } from './hd2d.js';
import { fine, texOf, words, hubThree } from './hub-3d.js';
import { sh as shadeOf } from './base-paint.js';
import { furnitureModel } from './base-mesh.js';
import { dressPlay, tickPlay } from './base-play.js';
import { PIECES } from './secret-base.js';
import { DRAGONITE } from './scene.js';
import { GRADES, gradeHex, timeOfDay } from './daytime.js';

const COLS = 11, ROWS = 8;
const U = 20;                 // the paintings' units a tile
const TOP = 8;
const PITCH = 0.42, ACROSS = 6.4, LOOK_Y = 0.8;
const DOOR = { x: 5, y: ROWS - 1 };
const NPC_PX = 1 / 34;        // a trainer's sprite pixel, a touch under a Pokémon's, so they stand about a head taller
export const ROOMS_3D = ['tutor', 'deleter', 'daycare', 'fans', 'spring', 'altar', 'grotto'];

let THREE, renderer, scene, camera, post, view, hemi, sun;
let built = {}, R = null, mon = null, mat = null;
let walker = { x: 0, z: 0, tile: { ...DOOR }, path: [], facing: 'back', flip: false, hop: 0 };
let opts = null, aim = null, busy = false, raf = 0, last = 0, calm = false, shot = null, viewW = 0, viewH = 0, camX = 0;
let leftAt = 0, visit = null, acting = null, queued = [];

const tileX = (tx) => tx + 0.5 - COLS / 2;
const tileZ = (ty) => ty + 0.5 - ROWS / 2;
const key = (x, y) => `${x},${y}`;
const wx = (t) => (t + 0.4) * U;            // a room tile's x on the back wall's painting (it runs 0.4 past each side)
const wy = (y) => (TOP - y) * U;            // a height's y on it
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
const ease = (k) => k * k * (3 - 2 * k);
const BACK_Z = -ROWS / 2;

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
  if (!model) return null;
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
function shell({ floor, wall, side, edge = '#4a2a18', cap = '#6a4428', under = '#2a1810', bg = '#22140c', open = false }) {
  B.bg = bg;
  const e = std({ color: edge });
  const top = std({ map: texOf(floor), roughness: 0.6, emissive: new THREE.Color('#ffffff'), emissiveMap: floor.glow ? texOf(floor.glow) : null, emissiveIntensity: floor.glow ? 0.9 : 0 });
  const fl = new THREE.Mesh(new THREE.BoxGeometry(COLS, 0.6, ROWS), [e, e, top, e, std({ color: edge }), e]);
  fl.position.y = -0.3;
  fl.receiveShadow = true;
  B.group.add(fl);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 7, ROWS + 0.4), [e, e, std({ color: under }), e, std({ color: under }), e]);
  plinth.position.set(0, -0.62 - 3.5, -0.2);
  B.group.add(plinth);
  const c = open ? new THREE.MeshBasicMaterial({ color: cap, transparent: true, opacity: 0 }) : std({ color: cap });   // open air: no tops, the sky shows through
  const wm = std({ map: texOf(wall), alphaTest: open ? 0.5 : 0, roughness: 0.9, emissive: new THREE.Color('#fff4dc'), emissiveMap: wall.glow ? texOf(wall.glow) : null, emissiveIntensity: wall.glow ? 0.9 : 0 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, TOP, 0.4), [c, c, c, c, wm, c]);
  back.position.set(0, TOP / 2, BACK_Z - 0.2);
  back.receiveShadow = true;
  B.group.add(back);
  for (const s of [-1, 1]) {
    const inside = std({ map: texOf(side(s < 0)), alphaTest: open ? 0.5 : 0, roughness: 0.9 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, ROWS), s < 0 ? [inside, c, c, c, c, c] : [c, inside, c, c, c, c]);
    m.position.set(s * (COLS / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    B.group.add(m);
  }
  const { step, mat: m } = doormat(tileX(DOOR.x), ROWS / 2 + 0.47, std({ color: '#b89a78' }));
  m.userData.spot = 'exit';
  B.group.add(step, m);
  B.mat = m.material;
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
    eyes-closed copy for blinking. */
async function npcBoard(id) {
  const [open, shut] = await Promise.all([bitmap(`assets/trainers/${id}.png`), bitmap(`assets/trainers/${id}-blink.png`).catch(() => null)]);
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
  return { group, board, c, g, t, open, shut, top: (bottom + 1) * NPC_PX, blinkAt: 0, shut0: false, npc: true };
}

/** Someone standing in the room: a trainer or a Pokémon (a front GIF, `flip` facing right), at tile `at`, `y` up. */
async function figure(stand, f, at) {
  const who = f.npc ? await npcBoard(f.npc) : await monBoard({ src: f.src }, false);
  if (!f.npc) who.board.rotation.x = -PITCH;
  who.flip = !!f.flip;
  who.stand = stand;
  who.base = { x: tileX(at.x) + (at.dx || 0), y: at.y || 0, z: tileZ(at.ty) + (at.dz || 0) };
  who.group.position.set(who.base.x, who.base.y, who.base.z);
  who.group.traverse(n => { n.userData.who = stand; });
  if (at.sleep) who.sleeping = true;
  return who;
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
        const shutNow = !who.shut0 && who.shut && !calm;
        who.g.clearRect(0, 0, who.c.width, who.c.height);
        who.g.drawImage(shutNow ? who.shut : who.open, 0, 0);
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
      else if (m.name === 'npc-no') x = Math.sin(k * Math.PI * 6) * 0.07 * (1 - k);
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

/** The gold medallion with Dragonite in relief, the pixel arena's (DRAGONITE in js/scene.js), at radius `R`. */
function medallion(f, s, cx, cy, Rr) {
  const { g, lin } = f, k = Rr * 0.78 * 2 / DRAGONITE.length, Ri = DRAGONITE.length * k / 2;
  g.fillStyle = lin(cx - Rr, cy - Rr, cx + Rr, cy + Rr, ['#fff0a0', '#e8b030', '#a87010', '#f8d058']);
  g.beginPath(); g.arc(cx, cy, Rr, 0, Math.PI * 2); g.fill();
  g.fillStyle = lin(0, cy - Ri, 0, cy + Ri, ['#5a1410', '#2a0806']);
  g.beginPath(); g.arc(cx, cy, Ri * 1.04, 0, Math.PI * 2); g.fill();
  const col = { '#': '#f0c048', w: '#d89a28', '=': '#fff0b0', e: '#ff3020' };
  DRAGONITE.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!col[ch]) return;
    g.fillStyle = col[ch];
    g.fillRect(cx - Ri + x * k, cy - Ri + y * k, k + 0.05, k + 0.05);
    if (ch === 'e') { s.fillStyle = '#ff6040'; s.fillRect(cx - Ri + x * k - k, cy - Ri + y * k - k, k * 3, k * 3); }
  }));
  s.fillStyle = 'rgba(160,110,30,0.6)'; s.beginPath(); s.arc(cx, cy, Rr, 0, Math.PI * 2); s.arc(cx, cy, Ri * 1.04, 0, Math.PI * 2, true); s.fill();
}

function dojoWall() {
  const W = (COLS + 0.8) * U, H = TOP * U, f = fine(W, H, 5), { g, rr, lin, shine } = f, s = shine();
  dojoBands(f, W);
  // the alcove behind Ken: a dark wood recess, its shimenawa rope with paper zigzags, the medallion
  const a0 = wx(4.15), a1 = wx(5.85);
  rr(a0 - 3, wy(3.9), a1 - a0 + 6, wy(0) - wy(3.9), 1, lin(a0, 0, a1, 0, DOJO.wood));
  rr(a0, wy(3.7), a1 - a0, wy(0.3) - wy(3.7), 0.6, lin(0, wy(3.7), 0, wy(0.3), ['#3a2414', '#2a180c']));
  medallion(f, s, (a0 + a1) / 2, wy(2.05), U * 0.72);
  g.strokeStyle = '#d8c078'; g.lineWidth = 3.4;
  g.beginPath(); g.moveTo(a0 - 2, wy(3.55)); g.quadraticCurveTo((a0 + a1) / 2, wy(3.15), a1 + 2, wy(3.55)); g.stroke();
  g.strokeStyle = '#a88a48'; g.lineWidth = 0.6;
  for (let t = 0; t < 1; t += 0.05) { const x = a0 + (a1 - a0) * t, y = wy(3.55) + Math.sin(t * Math.PI) * (wy(3.15) - wy(3.55)); g.beginPath(); g.moveTo(x - 1.4, y - 1.4); g.lineTo(x + 1.4, y + 1.4); g.stroke(); }
  for (const t of [0.22, 0.5, 0.78]) {
    const x = a0 + (a1 - a0) * t, y = wy(3.55) + Math.sin(t * Math.PI) * (wy(3.15) - wy(3.55)) + 1.6;
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
  B.blocked.add(key(5, 1));
  const scroll = panel(scrollArt(0.12), 0.9, 2.2, tileX(3), 2.15, BACK_Z + 0.03, { live: true });
  scroll.userData.spot = 0;
  B.anchors[0] = new THREE.Vector3(tileX(3), 3.45, BACK_Z + 0.1);
  B.bag = sandbag(7, 2);
  B.anchors[2] = new THREE.Vector3(tileX(5), 2.5, tileZ(1));
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
  wood: ['#c89058', '#9a6438', '#6a4024'], trees: ['sakura', 'bonsai'], drift: ['#f86040', '#f8a040'],
};
const CEDAR = {
  ...GARDEN, look: 'cedar', sky: ['#4e7e58', '#7aa088', '#b8d0c0'], far: ['#7a9a84', '#6a8a74'], leaf: ['#6a9a70', '#4e7e58', '#3a6448', '#284a36'],
  trunk: ['#9a6a50', '#5a362a'], stone: ['#b8c0aa', '#a2ac94', '#909e86', '#7a8870'], gap: '#4e5a48', moss: '#7ab060',
  bamboo: ['#b0a070', '#8a7850', '#5e5034', '#2a2418'], rock: ['#d0d4c0', '#a8ae98', '#7c846e', '#4e5444'],
  water: ['#f0fff8', '#b0f0e0', '#70d0c0', '#3a9aa0', '#20687a'], edge: '#4a4a38', under: '#24241a',
  fence: ['#f87858', '#e04030', '#a82820'], roof: ['#88d0b0', '#4aa080', '#2e7458'], gravel: ['#c8ccb8', '#b4baa4'],
  trees: ['pine', 'bamboo'], mist: '#e8f0ec',
};
const ROCK = {
  ...GARDEN, look: 'rock', sky: ['#3a2a30', '#6a4040', '#b06848'], far: ['#5a4244', '#4a3638'], leaf: null,
  trunk: ['#5a4a46', '#3a2e2c'], stone: ['#6a5a56', '#5e4e4a', '#544440', '#4a3c3a'], gap: '#2a1e1c', moss: null,
  bamboo: ['#9a8a80', '#6a5a54', '#4a3c38', '#1a1012'], rock: ['#8a7068', '#6a5250', '#4e3c3a', '#2e2224'],
  water: ['#ffffff', '#e0f4f0', '#a8dcd8', '#78b8c0', '#4a8898'], edge: '#3a2a28', under: '#1a1012',
  fence: ['#8a7a74', '#6a5a54', '#4a3c38'], roof: ['#8a8a98', '#5e5e6a', '#3e3e48'], gravel: ['#5a4a46', '#4a3c3a'],
  wood: ['#7a6458', '#5a463e', '#3a2a24'], trees: ['deadtree', 'boulder'], vein: ['#f8b030', '#e05820'], drift: ['#fff0a0', '#f8a830'],
};
const LOOKS = {
  clearing: GARDEN, shrine: CEDAR, wastes: ROCK,
  thornwood: { ...GARDEN, sky: ['#4a8a58', '#7ab080', '#c0e0b8'], far: ['#5a8a5a', '#4a7a4a'], leaf: ['#68b048', '#3e8a34', '#286a2a', '#164a1e'], trees: ['fern', 'bamboo'], drift: ['#c8f078', '#78c048'] },
  savanna: { ...GARDEN, sky: ['#f0a860', '#f8c888', '#fce8c0'], far: ['#d8b070', '#c89c5c'], leaf: ['#b8b850', '#8a9a3a', '#6a7a2c', '#4a5a20'], stone: ['#e8d0a8', '#dcc298', '#ceb488', '#bca070'], gap: '#9a7a50', moss: '#b8a858', trees: ['cactus', 'boulder'], drift: ['#fff0a0', '#f8a830'] },
  ruins: { ...CEDAR, stone: ['#d8c8a0', '#c8b890', '#b8a880', '#a09068'], rock: ['#e0d0a8', '#c0b088', '#988860', '#6a5a40'], water: ['#f0fffc', '#a8e8f0', '#58c0d8', '#2888b0', '#145a88'], fence: ['#e8d8b0', '#c0a878', '#8a7450'], roof: ['#e0d0a8', '#b0a078', '#7a6a48'] },
  depths: { ...ROCK, sky: ['#140c24', '#2a1a48', '#4a2a70'], stone: ['#4a4058', '#40384e', '#383046', '#30283c'], gap: '#140c1c', rock: ['#6a5a80', '#4e4064', '#382c4a', '#20182c'], vein: ['#e0a0ff', '#a050f0'], roof: ['#6a5a80', '#4e4064', '#382c4a'], drift: ['#f0d0ff', '#b070f0'] },
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
    fence; the sky above them is left clear, for skyDome() behind. */
function scenery(W, L, time, fence, { side = false } = {}) {
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
    g.fillStyle = L.far[0]; g.beginPath(); g.moveTo(0, wy(4.6));
    for (let x = 0; x <= W; x += 10) g.lineTo(x, wy(4.6 + Math.sin(x / 37) * 0.5 + Math.sin(x / 13) * 0.15));
    g.lineTo(W, H); g.lineTo(0, H); g.fill();
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
      for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(232,240,236,0.22)'; g.fillRect(0, wy(2.6 + k * 1.1) + r() * 4, W, 5 + r() * 4); }
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
  const tiles = document.createElement('canvas');
  tiles.width = tiles.height = 64;
  const tg = tiles.getContext('2d');
  tg.fillStyle = L.roof[1]; tg.fillRect(0, 0, 64, 64);
  for (let x = 0; x < 64; x += 8) { tg.fillStyle = L.roof[0]; tg.fillRect(x + 1, 0, 3, 64); tg.fillStyle = L.roof[2]; tg.fillRect(x + 6, 0, 2, 64); }
  for (let y = 0; y < 64; y += 16) { tg.fillStyle = 'rgba(0,0,0,0.25)'; tg.fillRect(0, y, 64, 1.5); }
  const roofMap = new THREE.CanvasTexture(tiles);
  roofMap.wrapS = roofMap.wrapT = THREE.RepeatWrapping; roofMap.colorSpace = THREE.SRGBColorSpace; roofMap.repeat.set(1.6, 1.6);
  const roofMat = std({ map: roofMap, roughness: 0.6 }), eave = std({ color: L.roof[2], roughness: 0.7 });
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

function caveFloor(C) {
  const T = 16, W = COLS * T, H = ROWS * T, f = fine(W, H, 5), { g } = f, r = seeded(52), s = C.vein ? f.shine() : null;
  g.fillStyle = C.ground[1]; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 420; i++) { g.fillStyle = C.ground[Math.floor(r() * 4)]; g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 4, 0.8 + r() * 2.6, r() * 3, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 160; i++) { g.fillStyle = C.stone[2 + Math.floor(r() * 2)]; g.beginPath(); g.arc(r() * W, r() * H, 0.4 + r() * 0.9, 0, Math.PI * 2); g.fill(); }
  // the shaft's pool of light round the dais
  const x = 5.5 * T, y = 2.2 * T, l = g.createRadialGradient(x, y, 4, x, y, 3.4 * T);
  l.addColorStop(0, 'rgba(255,248,220,0.35)'); l.addColorStop(1, 'rgba(255,248,220,0)');
  g.fillStyle = l; g.fillRect(0, 0, W, H);
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

const BUILD = { tutor: buildTutor, deleter: buildDeleter, daycare: buildDaycare, fans: buildFans, spring: buildSpring, altar: buildAltar, grotto: buildGrotto };
/** The rooms built per biome and hour (the open-air ones and the grotto); the rest are one room wherever you are. */
const PER_BIOME = new Set(['spring', 'altar', 'grotto']);
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
  const d = Math.hypot(dx, dz), move = dt / 1000 * 3.4;
  if (Math.abs(dz) > Math.abs(dx)) w.facing = dz < 0 && mon.sheets.back ? 'back' : 'front';
  else { w.facing = 'front'; w.flip = dx > 0; }
  if (d <= move) { w.x = tx; w.z = tz; w.tile = step; w.path.shift(); }
  else { w.x += dx / d * move; w.z += dz / d * move; }
  w.hop += dt;
  return !w.path.length;
}

/** Up to a choice's prop, or to the door to leave; `aim` is acted on as it arrives. */
function goTo(kind) {
  const target = kind === 'exit' ? DOOR : R.spots[kind]?.step;
  if (!target) return;
  aim = kind;
  walker.path = route(walker.tile, target);
  if (!walker.path.length) arrived();
}

function arrived() {
  const kind = aim;
  aim = null;
  if (kind === null || kind === undefined) return;
  if (kind === 'exit') return opts.onLeave();
  const step = R.spots[kind].step;
  if (walker.tile.x !== step.x || walker.tile.y !== step.y) return;
  walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
  opts.onPick(kind);
}

/* ---------- taps ---------- */

function onTap(e) {
  if (busy || acting || !alive()) return;
  if (e.target.closest('button, a, input, select, dialog, .reward-bottom, #room-bar, .room-hinge, .top-bar, #collection-screen, .over, .gift-float, .floating-thing, .treasure-relic')) return;
  if (document.querySelector('dialog[open]')) return;
  const sign = signAt(e.clientX, e.clientY);
  if (sign !== null) { playSound('select'); return goTo(sign); }
  const r = view.getBoundingClientRect();
  const v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  const ray = new THREE.Raycaster();
  ray.setFromCamera(v, camera);
  const hits = ray.intersectObjects([R.group, mon.group, ...Object.values(R.who).map(w => w.group)], true);
  const first = hits[0]?.object;
  if (first && first === mon.board) { playCry(mon.id); walker.hopUntil = performance.now() + 500; return; }
  let o = first;
  while (o && o.userData.spot === undefined && !o.userData.who) o = o.parent;
  if (o?.userData.spot !== undefined && (o.userData.spot === 'exit' || R.spots[o.userData.spot])) { playSound('select'); return goTo(o.userData.spot); }
  if (o?.userData.who) {
    const who = R.who[o.userData.who];
    if (!who.npc) { playCry(who.id); does(who, 'hop'); return; }
  }
  const hit = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
  const t = { x: Math.round(hit.x + COLS / 2 - 0.5), y: Math.round(hit.z + ROWS / 2 - 0.5) };
  if (t.y >= ROWS && Math.abs(t.x - DOOR.x) <= 1) return goTo('exit');   // the doorstep round the mat
  if (t.x < 0 || t.y < 0 || t.x >= COLS || t.y >= ROWS) return;
  aim = null;
  walker.path = route(walker.tile, t);
}

/* ---------- camera (the Center's) ---------- */

function aimCamera(x, d) {
  camera.position.set(x, LOOK_Y + Math.sin(PITCH) * d, Math.cos(PITCH) * d);
  camera.lookAt(x, LOOK_Y, 0);
  camera.updateMatrixWorld();
}

function below() {
  const tops = ['#room-bar', '#reward-screen .room-hinge']
    .map(s => document.querySelector(s)).filter(n => n?.offsetHeight).map(n => n.getBoundingClientRect().top);
  return tops.length ? Math.max(0, viewH - Math.min(...tops)) + 6 : 120;
}

/** ACROSS tiles at least, and far enough back that the room from the doorstep up to its signs fits over the bar. */
function fitShot() {
  const h = viewH;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const topGap = 10, low = below(), avail = Math.max(120, h - topGap - low), room = 2 * avail / h * 0.96;
  const span = (d) => {
    aimCamera(0, d);
    return [new THREE.Vector3(0, R.shotTop ?? 3.4, BACK_Z).project(camera).y, new THREE.Vector3(0, -0.3, ROWS / 2 + 0.95).project(camera).y];
  };
  let lo = 2, hi = 80;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; const [t, b] = span(mid); if (t - b > room) lo = mid; else hi = mid; }
  const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
  const d = Math.max(hi, ACROSS / 2 / halfTan);
  const [, b] = span(d);
  shot = { dist: d, half: d * halfTan, shift: (1 - b) / 2 * h - (h - low - 2), low };
}

function placeCamera(dt) {
  if (!shot) return;
  const room = COLS / 2 + 0.4, half = shot.half;
  const want = half >= room ? 0 : Math.max(-room + half, Math.min(room - half, walker.x));
  camX = calm ? want : camX + (want - camX) * Math.min(1, dt / 1000 * 4);
  camera.setViewOffset(viewW, viewH, 0, shot.shift, viewW, viewH);
  aimCamera(camX, shot.dist);
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
const alive = () => !!(R && document.querySelector(`#reward-options${ROOM_OF(R.kind)}`)) && !document.getElementById('reward-screen').hidden;

function frame(now) {
  raf = 0;
  if (!alive()) return unmount();
  const dt = Math.min(100, now - (last || now));
  last = now;
  if (walk(dt)) arrived();
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x + (walker.ox || 0), walker.oy || 0, walker.z - (walker.lunge || 0) + (walker.oz || 0));
  mon.board.scale.set(walker.flip ? -1 : 1, 1, 1);
  mon.board.position.y = bob;
  drawMon(mon, walker, dt);
  tickFigures(now, dt);
  for (const p of R.plays) tickPlay(p, now, dt);
  for (const t of R.ticks) t(now, dt);
  tickAct(now);
  if (!calm && mat) mat.emissiveIntensity = 0.12 + Math.sin(now / 420) * 0.1;
  placeCamera(dt);
  placeSigns();
  post.draw(scene, camera, (new THREE.Vector3(walker.x, 0.6, walker.z).project(camera).y + 1) / 2);
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
    const p = at.clone().project(camera), x = Math.round(r.left + (p.x + 1) / 2 * r.width), y = Math.round(r.top + (1 - p.y) / 2 * r.height);
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
  removeEventListener('resize', resize);
  document.getElementById('reward-options')?.classList.remove('c3d');
  leftAt = performance.now();
  busy = false; aim = null;
  if (acting) { const done = acting.done; acting = null; done(); }
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
  const time = timeOfDay(), look = lookOf(at.biome), id = PER_BIOME.has(kind) ? `${kind}/${look === GARDEN && kind !== 'grotto' ? 'garden' : at.biome}/${time}/${kind === 'altar' ? at.type : ''}` : kind;
  // one at a time: a build fills the shared B
  built[id] ??= building = building.catch(() => {}).then(async () => {
    await warmEvent();
    B = { kind, group: new THREE.Group(), blocked: new Set(), anchors: {}, spots: [], who: {}, plays: [], ticks: [], acts: {}, mat: null, env: INDOORS };
    const b = B;
    await BUILD[kind](figs, { look, time, type: at.type, biome: at.biome });
    B = null;
    return b;
  });
  built[id].catch(() => { delete built[id]; });
  return built[id];
}

/** Builds a room ahead, while the map is up (`at` as room()'s). */
export function preloadEvent(kind, at = {}) {
  if (BUILD[kind]) room(kind, {}, at).catch(() => {});
}

/** Lays the 3D room `o.kind` under the event room eventRoom() just showed. `o`: { kind, run, node (to tell coming back from a
    picker from a new visit), mate ({ src, name, cry }: your Pokémon), figures (eventRoom's: who stands where), after (the
    trainer's reaction once a picker is done), biome (the open-air rooms' look), type (the Shrine's glow), onPick(index): press that choice, onLeave(): press Leave }. Resolves the
    room's controls, or null if it was left while it loaded; throws if Three.js won't load (the pixel room stays). */
export async function mountEvent(o) {
  const back = visit && visit.node === o.node && visit.run === o.run && performance.now() - leftAt < 30000;
  visit = { node: o.node, run: o.run };
  opts = o;
  calm = calmFx();
  const next = await room(o.kind, o.figures || {}, { biome: o.biome, type: o.type });
  const showing = () => document.querySelector(`#reward-options${ROOM_OF(o.kind)}`) && !document.getElementById('reward-screen').hidden;
  if (!showing() || opts !== o) return null;
  if (R !== next) {
    if (R) scene.remove(R.group);
    R = next;
    scene.add(R.group);
    for (const who of Object.values(R.who)) if (!who.group.parent) scene.add(who.group);
    scene.background = new THREE.Color(R.bg);
    hemi.color.set(R.env.hemi[0]); hemi.groundColor.set(R.env.hemi[1]); hemi.intensity = R.env.hemi[2];
    sun.color.set(R.env.sun[0]); sun.intensity = R.env.sun[1];
    post.final.uniforms.uBloom.value = R.env.bloom;
    mat = R.mat;
  }
  for (const who of Object.values(R.who)) { who.turned = false; who.move = null; }   // a room shown again faces you, like the pixel one
  if (!back) {
    if (R.scroll) { R.scroll.ink = 0.12; const m = R.scroll.mesh.material; m.map.dispose(); m.map = texOf(scrollArt(0.12)); m.needsUpdate = true; }
  }
  if (mon?.src !== o.mate.src) {
    if (mon) scene.remove(mon.group);
    mon = await monBoard(o.mate);
    mon.board.rotation.x = -PITCH;
    scene.add(mon.group);
  }
  if (!showing() || opts !== o) return null;
  if (!back) {
    walker = { x: tileX(DOOR.x), z: tileZ(DOOR.y), tile: { ...DOOR }, path: [], facing: mon.sheets.back ? 'back' : 'front', flip: false, hop: 0 };
    camX = walker.x;
  }
  walker.path = []; still();
  document.body.append(view);
  document.getElementById('reward-options').classList.add('c3d');
  for (const label of document.querySelectorAll('#reward-options .reward-option .center-label')) label.textContent = oneWord(label.textContent);
  addEventListener('click', onTap, true);
  addEventListener('resize', resize);
  resize();
  last = 0;
  if (!raf) raf = requestAnimationFrame(frame);
  requestAnimationFrame(() => view.classList.add('on'));
  for (const [stand, move, at] of queued.splice(0)) if (performance.now() - at < 3000) does(R.who[stand], move);
  if (o.after) does(R.who.npc, o.after);
  return controls;
}

const SHORT = { 'Forget a move': 'Forget one', 'Trade a move': 'Trade', 'Accept their gift': 'Gift', 'Soak: full HP': 'Soak' };
/** A word or two a sign this close in, the price kept (the hint says the rest). */
const oneWord = (text) => SHORT[text] ?? text;

/** What eventRoom()'s choices ask of the room. */
const controls = {
  /** Play a choice out on the props; resolves once it has (at once under reduced motion, its sounds still played). */
  act(name) {
    const act = R?.acts[name];
    if (!act || !alive()) return Promise.resolve();
    walker.path = []; aim = null;
    walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
    if (calm) { for (const [, s] of act.cues || []) playSound(s); act.start?.call(act); act.tick?.call(act, 1); still(); return Promise.resolve(); }
    return new Promise(done => {
      act.start?.call(act);
      acting = { name, act, from: performance.now(), ms: act.ms, cues: (act.cues || []).map(c => [...c]), done };
    });
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
export const eventRoom3d = () => (R && alive() ? controls : null);
