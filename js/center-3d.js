/* center-3d.js  -  the run's Pokémon Center as a 3D room you walk about (branch pokecenter-3d; the user's ask, 2026-10-09,
   after the Diamond / Pearl / Platinum Centers): orange walls over a red band, a cream tiled floor with the Poké Ball seal,
   the long red counter with Chansey behind it, the healing machine and its patient monitor, a PC on the counter, benches,
   plants and an escalator down in each front corner. It is only the scene: restSite() in js/run.js keeps the room's
   choices, text box and bar, and this lays the room under them (a canvas in place of the pixel scene). A tap on the
   machine, the PC or Chansey walks your Pokémon up to the counter and picks that choice; the doormat walks it to the door
   and presses Leave. The Secret Base's furniture models (js/base-mesh.js) are the machine, the PC and the decor. */

import { calmFx } from './prefs.js';
import { playSound, playCry } from './audio.js';
import { loadThree, tex, crop, monBoard, drawMon, createPost, doormat } from './hd2d.js';
import { fine, texOf, words, hubThree } from './hub-3d.js';
import { HD, sh as shadeOf } from './base-paint.js';
import { furnitureModel } from './base-mesh.js';
import { dressPlay, tickPlay } from './base-play.js';
import { PIECES } from './secret-base.js';

const COLS = 11, ROWS = 8;
const U = 20;                 // the paintings' units a tile
const TOP = 8;                // the walls' height, so a tall phone shows wall, not sky, over the counter
const PITCH = 0.62, ACROSS = 7.8, LOOK_Y = 0.9;
const COUNTER = { x0: 2, x1: 8, y: 2, h: 0.82, d: 0.9 };
// where your Pokémon stands for each choice (the option's index in restSite()), and what it faces
const SPOTS = {
  machine: { option: 0, step: { x: 3, y: 3 } },
  pc: { option: 1, step: { x: 7, y: 3 } },
  nurse: { option: 2, step: { x: 5, y: 3 } },
};
const DOOR = { x: 5, y: ROWS - 1 };
const ESCALATORS = [0, 9];   // each one's left tile; they take the front three rows

const C = { orange: ['#f8a060', '#f08040', '#e06830'], panel: '#f8b070', red: '#e03830', redDark: '#a82418', cream: ['#fdf2dc', '#f6e2c0'],
  tile: ['#fbeec4', '#f4e0a8'], grout: '#e6cc8c', ink: '#2a2238', skirting: '#7a2c1c' };

let THREE, renderer, scene, camera, post, view, hemi, sun;
let room, mon, nurse, monitor, machinePlay, plays = [], blocked = new Set(), mat = null;
let walker = { x: 0, z: 0, tile: { ...DOOR }, path: [], facing: 'back', flip: false, hop: 0 };
let opts = null, aim = null, busy = false, raf = 0, last = 0, calm = false, shot = null, viewW = 0, viewH = 0, camX = 0;
let vitals = { now: 0, coming: 0, blink: 0, drawn: '' }, healing = null, flashing = null, leftAt = 0, runId = null, sizeCheck = 0;

const tileX = (tx) => tx + 0.5 - COLS / 2;
const tileZ = (ty) => ty + 0.5 - ROWS / 2;
const key = (x, y) => `${x},${y}`;
const wx = (t) => (t + 0.4) * U;            // a room tile's x on the back wall's painting (it runs 0.4 past each side)
const wy = (y) => (TOP - y) * U;            // a height's y on it

/* ---------- painting ---------- */

function ball(g, x, y, r, ink = C.ink) {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = C.red; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill();
  g.strokeStyle = ink; g.lineWidth = r * 0.16;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r * 0.32, 0, Math.PI * 2); g.fill(); g.stroke();
}

/** The lower wall's orange, in panels a tile wide, the red band over it and the cream upper wall. */
function wallBands(f, W) {
  const { g, rr, lin } = f;
  g.fillStyle = lin(0, wy(TOP), 0, wy(2.9), ['#f6dcb4', C.cream[0], C.cream[1]]); g.fillRect(0, 0, W, wy(2.9));
  g.fillStyle = lin(0, wy(2.5), 0, wy(0), C.orange); g.fillRect(0, wy(2.5), W, wy(0) - wy(2.5));
  for (let x = 0; x < W; x += U) {
    rr(x + 2, wy(2.35), U - 4, wy(0.4) - wy(2.35), 1.5, lin(0, wy(2.35), 0, wy(0.4), [C.panel, '#f49058']));
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x + 2.5, wy(2.33), U - 5, 0.8);
  }
  g.fillStyle = lin(0, wy(2.9), 0, wy(2.5), ['#f05040', C.red, C.redDark]); g.fillRect(0, wy(2.9), W, wy(2.5) - wy(2.9));
  g.fillStyle = '#ffffff'; g.fillRect(0, wy(2.83), W, 0.9); g.fillRect(0, wy(2.58), W, 0.9);
  g.fillStyle = C.skirting; g.fillRect(0, wy(0.3), W, wy(0) - wy(0.3));
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, wy(0.3), W, 0.8);
}

/** A window of sky in a white frame, a curtain each side. */
function skyWindow(f, s, x0, x1, y0, y1) {
  const { g, rr, lin } = f;
  rr(x0 - 1.5, y0 - 1.5, x1 - x0 + 3, y1 - y0 + 3, 1.5, '#ffffff');
  g.fillStyle = lin(0, y0, 0, y1, ['#68b0f0', '#a8d8f8', '#e0f4ff']); g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.fillStyle = '#ffffff';
  for (const [cx, cy, r] of [[x0 + (x1 - x0) * 0.3, y0 + 9, 4], [x0 + (x1 - x0) * 0.42, y0 + 8, 5], [x0 + (x1 - x0) * 0.55, y0 + 9.5, 3.6]]) { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = lin(0, y0 + (y1 - y0) * 0.7, 0, y1, ['#78c060', '#58a048']); g.fillRect(x0, y0 + (y1 - y0) * 0.72, x1 - x0, (y1 - y0) * 0.28);
  g.strokeStyle = '#ffffff'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo((x0 + x1) / 2, y0); g.lineTo((x0 + x1) / 2, y1); g.moveTo(x0, (y0 + y1) / 2); g.lineTo(x1, (y0 + y1) / 2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(x0 + 2, y0); g.lineTo(x0 + 8, y0); g.lineTo(x0 + 1, y1); g.lineTo(x0, y1); g.lineTo(x0, y0 + 12); g.closePath(); g.fill();
  for (const [a, b] of [[x0 - 4, x0 + 3], [x1 - 3, x1 + 4]]) {
    g.fillStyle = lin(a, 0, b, 0, ['#f8d0d8', '#f0a8b8', '#f8d0d8']);
    g.beginPath(); g.moveTo(a, y0 - 3); g.lineTo(b, y0 - 3); g.quadraticCurveTo((a + b) / 2, (y0 + y1) / 2, b - 1, y1 + 2); g.lineTo(a + 1, y1 + 2); g.closePath(); g.fill();
  }
  rr(x0 - 6, y0 - 5, x1 - x0 + 12, 3, 1.5, '#c89060');
  s.fillStyle = '#304050'; s.fillRect(x0, y0, x1 - x0, y1 - y0);
}

/** The back wall, one painting: windows at either end, shelves of Poké Balls and medicine behind the counter, the red
    band, POKéMON CENTER on a red sign with the Poké Ball, and round ceiling lights. */
function wallArt() {
  const W = (COLS + 0.8) * U, H = TOP * U, f = fine(W, H, 5), { g, rr, lin, shine } = f, s = shine();
  wallBands(f, W);
  skyWindow(f, s, wx(0.15), wx(1.7), wy(2.15), wy(0.95));
  skyWindow(f, s, wx(9.3), wx(10.85), wy(2.15), wy(0.95));
  // shelves behind Chansey and the PC
  const sx0 = wx(5.1), sx1 = wx(8.9), sy0 = wy(2.3), sy1 = wy(0.95);
  rr(sx0 - 1.5, sy0 - 1.5, sx1 - sx0 + 3, sy1 - sy0 + 3, 1.5, '#a8582c');
  rr(sx0, sy0, sx1 - sx0, sy1 - sy0, 1, lin(0, sy0, 0, sy1, ['#fff2dc', '#f2dcb8']));
  for (const y of [sy0 + (sy1 - sy0) / 2, sy1 - 1.5]) rr(sx0, y, sx1 - sx0, 1.6, 0.4, '#c87840');
  for (let x = sx0 + 4; x < sx1 - 2; x += 6.5) {
    ball(g, x, sy0 + (sy1 - sy0) / 2 - 3.4, 2.8);
    const top = sy1 - 1.5, col = ['#b070e0', '#58a8f8', '#f87878', '#58c868'][Math.round((x - sx0) / 6.5) % 4];
    rr(x - 2, top - 7, 4, 7, 1, col); rr(x - 1, top - 9, 2, 2.4, 0.5, '#e8e8f0');
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(x - 1.4, top - 6, 0.8, 4.6);
  }
  // the sign
  const sw = 6.4 * U, sx = W / 2 - sw / 2, sy = wy(4.3);
  rr(sx - 2, sy - 2, sw + 4, 26, 6, '#ffffff');
  rr(sx, sy, sw, 22, 5, lin(0, sy, 0, sy + 22, ['#f05848', C.red, C.redDark]));
  ball(g, sx + 14, sy + 11, 7.5, '#5a1810');
  words(g, 'POKéMON CENTER', W / 2 + 9, sy + 11.6, 11, '#ffffff');
  s.fillStyle = '#c0a0a0'; s.beginPath(); s.roundRect(sx, sy, sw, 22, 5); s.fill();
  words(s, 'POKéMON CENTER', W / 2 + 9, sy + 11.6, 11, '#ffffff');
  ball(s, sx + 14, sy + 11, 7.5, '#000');
  // a cross either side, the Center's own sign
  for (const cx of [sx - 22, sx + sw + 22]) {
    rr(cx - 9, sy + 1, 18, 18, 4, '#ffffff');
    rr(cx - 2.5, sy + 4, 5, 12, 1, C.red); rr(cx - 6, sy + 7.5, 12, 5, 1, C.red);
  }
  // round ceiling lights, glowing
  for (let t = 1; t < COLS; t += 2.25) {
    const cx = wx(t + 0.5), cy = wy(TOP - 0.55);
    g.fillStyle = '#e8d8c0'; g.beginPath(); g.ellipse(cx, cy, 11, 3.6, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fffbe8'; g.beginPath(); g.ellipse(cx, cy + 0.6, 9, 2.6, 0, 0, Math.PI * 2); g.fill();
    s.fillStyle = '#ffffff'; s.beginPath(); s.ellipse(cx, cy + 0.6, 9.5, 3, 0, 0, Math.PI * 2); s.fill();
  }
  return f.c;
}

/** A side wall: the same bands, a framed poster of the Center's healing tips on each. */
function sideArt(left) {
  const W = ROWS * U, H = TOP * U, f = fine(W, H, 4), { g, rr } = f;
  wallBands(f, W);
  const px = left ? wx(1.4) : wx(4.4), py = wy(2.15);
  rr(px - 1.5, py - 1.5, 2 * U + 3, 1.2 * U + 3, 1.5, '#a8582c');
  rr(px, py, 2 * U, 1.2 * U, 1, '#fffaf0');
  ball(g, px + 8, py + 9, 4.5);
  rr(px + 16, py + 5, 20, 2, 1, C.red); rr(px + 16, py + 10, 16, 1.4, 0.7, '#a0a0b0'); rr(px + 16, py + 14, 18, 1.4, 0.7, '#a0a0b0');
  rr(px + 4, py + 18, 32, 1.4, 0.7, '#a0a0b0');
  return f.c;
}

/** Cream tiles in pairs a tile, the Poké Ball seal set in before the counter, and the escalators' wells cut out. */
function floorArt() {
  const T = 16, f = fine(COLS * T, ROWS * T, 5), { g, lin } = f;
  for (let y = 0; y < ROWS * 2; y++) for (let x = 0; x < COLS * 2; x++) {
    g.fillStyle = lin(x * 8, y * 8, x * 8 + 8, y * 8 + 8, (x + y) % 2 ? C.tile : [C.tile[1], C.tile[0]]);
    g.fillRect(x * 8, y * 8, 8, 8);
  }
  g.strokeStyle = C.grout; g.lineWidth = 0.35;
  for (let x = 0; x <= COLS * 2; x++) { g.beginPath(); g.moveTo(x * 8, 0); g.lineTo(x * 8, ROWS * T); g.stroke(); }
  for (let y = 0; y <= ROWS * 2; y++) { g.beginPath(); g.moveTo(0, y * 8); g.lineTo(COLS * T, y * 8); g.stroke(); }
  // the seal: a big ring, its line and its button, in white set into the tiles
  const cx = 5.5 * T, cy = 5.1 * T, R = 1.75 * T;
  g.fillStyle = 'rgba(240,200,120,0.35)'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#fffaf0'; g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - 7, cy); g.moveTo(cx + 7, cy); g.lineTo(cx + R, cy); g.stroke();
  g.beginPath(); g.arc(cx, cy, 7, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cy, 3.4, 0, Math.PI * 2); g.stroke();
  // a red runner from the door to the seal
  g.fillStyle = 'rgba(224,56,48,0.85)'; g.fillRect(cx - 7, cy + R + 3, 14, ROWS * T - cy - R - 3);
  g.fillStyle = '#f8d040'; g.fillRect(cx - 7, cy + R + 3, 1, ROWS * T); g.fillRect(cx + 6, cy + R + 3, 1, ROWS * T);
  // the escalators' wells
  g.globalCompositeOperation = 'destination-out';
  for (const x of ESCALATORS) g.fillRect(x * T, 5 * T, 2 * T, 3 * T);
  return f.c;
}

/** The counter's front: red, lighter panels, a white stripe with the Poké Ball in its middle. */
function counterFront(w) {
  const f = fine(w * 16, 14, 6), { g, rr, lin } = f, W = w * 16;
  g.fillStyle = lin(0, 0, 0, 14, ['#f05848', C.red, '#c02c20']); g.fillRect(0, 0, W, 14);
  for (let x = 1; x < W - 2; x += 16) rr(x + 1, 6, 14, 6.5, 1.2, 'rgba(255,255,255,0.12)');
  g.fillStyle = '#ffffff'; g.fillRect(0, 2.2, W, 2);
  g.fillStyle = C.redDark; g.fillRect(0, 13, W, 1);
  ball(g, W / 2, 6.8, 4.6, '#5a1810');
  return f.c;
}

/** The patient monitor's screen: your Pokémon's face, its name and HP in green phosphor, what resting would heal blinking
    on the end of the bar. Redrawn only when something on it changes. */
function drawVitals() {
  const m = monitor, { g, c } = m, k = vitals;
  const on = !k.coming || Math.floor(k.blink / 450) % 2 === 0;
  const sig = `${Math.round(k.now)}|${Math.round(k.coming)}|${on}|${m.faceReady}`;
  if (sig === k.drawn) return;
  k.drawn = sig;
  const W = c.width, H = c.height, max = opts.maxHp;
  g.fillStyle = '#0c2414'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120,255,160,0.08)'; g.lineWidth = 2;
  for (let y = 3; y < H; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  if (m.face) { g.imageSmoothingEnabled = false; g.drawImage(m.face, 8, 10, 104, 104); }
  g.fillStyle = '#9cffb4'; g.font = 'bold 26px "Trebuchet MS", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
  g.fillText(opts.name.toUpperCase(), 124, 14);
  const bx = 124, by = 54, bw = W - bx - 16, bh = 20;
  g.fillStyle = '#1c4026'; g.fillRect(bx, by, bw, bh);
  const fill = k.now / max, add = k.coming / max;
  g.fillStyle = fill > 0.5 ? '#58f080' : fill > 0.2 ? '#f8d048' : '#f86048';
  g.fillRect(bx, by, bw * fill, bh);
  if (on && add) { g.fillStyle = 'rgba(160,255,190,0.6)'; g.fillRect(bx + bw * fill, by, bw * add, bh); }
  g.strokeStyle = '#9cffb4'; g.lineWidth = 2; g.strokeRect(bx, by, bw, bh);
  g.fillStyle = '#9cffb4'; g.font = 'bold 24px "Trebuchet MS", sans-serif';
  g.fillText(`HP ${Math.round(k.now)}/${max}`, bx, 86);
  if (on && k.coming >= 1 && !healing && !k.fill) { g.textAlign = 'right'; g.fillStyle = '#d8ffe0'; g.fillText(`+${Math.round(k.coming)}`, W - 16, 86); }
  m.t.needsUpdate = true;
}

/* ---------- building the room ---------- */

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });

/** The Secret Base's mask: only the painting's glowing colours, for an emissive map. */
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

/** A furniture piece's 3D model, alive (its screen, its balls), feet on the floor at x, z. */
function piece(id, x, z, { turn = 0, scale = 1, y = 0, spot = null } = {}) {
  const p = PIECES[id];
  if (!p) return null;
  const model = furnitureModel(THREE, id, (art) => {
    const m = std({ map: tex(art), roughness: 0.9 });
    if (p.glow) { m.emissive = new THREE.Color('#ffd890'); m.emissiveMap = tex(mask(art, p.glow)); m.emissiveIntensity = 0.8; }
    return m;
  });
  if (!model) return null;
  const play = dressPlay(THREE, model, p);
  if (play) plays.push(play);
  model.traverse(o => { if (o.isMesh) { o.castShadow = o.castShadow !== false; o.receiveShadow = true; } if (spot) o.userData.spot = spot; });
  model.scale.setScalar(scale);
  model.position.set(x, y, z);
  model.rotation.y = turn;
  room.add(model);
  return model;
}

function box(w, h, d, mats, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  room.add(m);
  return m;
}

/** An escalator going down in a front corner: a well of steps sinking under the front edge between red balustrades
    capped with black handrails. */
function escalator(tx) {
  const x = tileX(tx) + 0.5, z0 = tileZ(5) - 0.5, z1 = ROWS / 2, n = 9, steel = std({ color: '#b8bcc8', metalness: 0.5, roughness: 0.35 });
  const tread = std({ color: '#8a8e9a', metalness: 0.4, roughness: 0.5 });
  for (let i = 0; i < n; i++) {
    const zz = z0 + (i + 0.5) * (z1 - z0) / n, top = -0.04 - i * 0.075;
    box(1.5, 0.08, (z1 - z0) / n, [steel, steel, tread, steel, steel, steel], x, top - 0.04, zz);
  }
  const comb = std({ color: '#f8d040', metalness: 0.3, roughness: 0.5 });
  box(1.5, 0.02, 0.06, comb, x, 0.0, z0 + 0.03);
  const red = std({ color: C.red, roughness: 0.6 }), white = std({ color: '#fbf6ea' }), rail = std({ color: '#1c1c24', roughness: 0.4 });
  for (const s of [-1, 1]) {
    const bx = x + s * 0.84;
    box(0.16, 0.95, z1 - z0 + 0.2, [red, red, white, red, red, red], bx, 0.475 - 0.5, (z0 + z1) / 2 + 0.1);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, z1 - z0 + 0.3, 12), rail);
    r.rotation.x = Math.PI / 2;
    r.position.set(bx, 0.49, (z0 + z1) / 2 + 0.1);
    room.add(r);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), rail);   // the rail's rounded back end
    cap.position.set(bx, 0.49, z0 - 0.05);
    room.add(cap);
  }
  for (let ty = 5; ty < ROWS; ty++) { blocked.add(key(tx, ty)); blocked.add(key(tx + 1, ty)); }
}

function buildRoom() {
  room = new THREE.Group();
  scene.add(room);
  const edge = std({ color: '#5a2418' });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(COLS, 0.6, ROWS), [edge, edge, std({ map: texOf(floorArt()), alphaTest: 0.5, roughness: 0.4, metalness: 0.05 }), edge, std({ color: '#d8c090' }), edge]);
  floor.position.y = -0.3;
  floor.receiveShadow = true;
  room.add(floor);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, 7, ROWS + 0.4), [edge, edge, std({ color: '#3a1810' }), edge, std({ color: '#5a2c1c' }), edge]);
  plinth.position.set(0, -0.62 - 3.5, -0.2);
  room.add(plinth);

  const wall = wallArt(), wm = std({ map: texOf(wall), roughness: 0.9, emissive: new THREE.Color('#fff4dc'), emissiveMap: texOf(wall.glow), emissiveIntensity: 0.9 });
  const cap = std({ color: '#d87040' });
  const back = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.8, TOP, 0.4), [cap, cap, cap, cap, wm, cap]);
  back.position.set(0, TOP / 2, -ROWS / 2 - 0.2);
  back.receiveShadow = true;
  room.add(back);
  for (const s of [-1, 1]) {
    const inside = std({ map: texOf(sideArt(s < 0)), roughness: 0.9 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, ROWS), s < 0 ? [inside, cap, cap, cap, cap, cap] : [cap, inside, cap, cap, cap, cap]);
    m.position.set(s * (COLS / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    room.add(m);
  }

  // the counter: red front with the Poké Ball, white top overhanging it, rounded ends
  const w = COUNTER.x1 - COUNTER.x0 + 1, cx = (tileX(COUNTER.x0) + tileX(COUNTER.x1)) / 2, cz = tileZ(COUNTER.y), H = COUNTER.h;
  const red = std({ color: C.red, roughness: 0.55 }), front = std({ map: texOf(counterFront(w)), roughness: 0.55 }), top = std({ color: '#fbf8f2', roughness: 0.3 });
  box(w, H - 0.08, COUNTER.d, [red, red, red, red, front, red], cx, (H - 0.08) / 2, cz);
  box(w + 0.16, 0.08, COUNTER.d + 0.16, top, cx, H - 0.04, cz + 0.02);
  for (const s of [-1, 1]) {
    const end = new THREE.Mesh(new THREE.CylinderGeometry(COUNTER.d / 2, COUNTER.d / 2, H - 0.08, 24, 1, false, s < 0 ? Math.PI : 0, Math.PI), red);
    end.position.set(cx + s * w / 2, (H - 0.08) / 2, cz);
    end.castShadow = end.receiveShadow = true;
    room.add(end);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(COUNTER.d / 2 + 0.08, COUNTER.d / 2 + 0.08, 0.08, 24, 1, false, s < 0 ? Math.PI : 0, Math.PI), top);
    lid.position.set(cx + s * w / 2, H - 0.04, cz + 0.02);
    room.add(lid);
  }
  for (let x = COUNTER.x0 - 1; x <= COUNTER.x1 + 1; x++) for (let y = 0; y <= COUNTER.y; y++) blocked.add(key(x, y));
  // a low back counter along the wall, under the shelves
  box(3.9, 0.6, 0.6, [red, red, top, red, std({ color: '#f05848', roughness: 0.6 }), red], tileX(7) - 0.05, 0.3, -ROWS / 2 + 0.3);

  // the healing machine behind the counter, its patient monitor on the wall over it
  const machine = piece('pokecenter', tileX(3) + 0.5, tileZ(0) + 0.2, { spot: 'machine', scale: 1.1 });
  machinePlay = machine?.userData.play ?? null;
  const mc = document.createElement('canvas');
  mc.width = 384; mc.height = 128;
  const mt = new THREE.CanvasTexture(mc);
  mt.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), new THREE.MeshBasicMaterial({ map: mt, toneMapped: false }));
  const bezel = box(1.66, 0.66, 0.08, std({ color: '#e8e8f0', roughness: 0.4 }), tileX(3) + 0.5, 2.0, -ROWS / 2 + 0.05);
  screen.position.set(0, 0, 0.045);
  bezel.add(screen);
  bezel.traverse(o => { o.userData.spot = 'machine'; });
  monitor = { c: mc, g: mc.getContext('2d'), t: mt, face: null };
  // the PC on the counter's right end
  piece('pc', tileX(7), cz - 0.05, { spot: 'pc', scale: 0.72, y: H });

  // plants in the back corners, benches by the side walls, a Poké Ball stand and the TM case at the back
  piece('centerplant', tileX(0), tileZ(0), { scale: 1.15 }); blocked.add(key(0, 0));
  piece('centerplant', tileX(10), tileZ(0), { scale: 1.15 }); blocked.add(key(10, 0));
  piece('balldisplay', tileX(1), tileZ(0)); blocked.add(key(1, 0));
  piece('tmcase', tileX(9), tileZ(0)); blocked.add(key(9, 0));
  piece('waitbench', tileX(0) - 0.05, tileZ(2) + 0.5, { turn: Math.PI / 2 }); blocked.add(key(0, 2)); blocked.add(key(0, 3));
  piece('waitbench', tileX(10) + 0.05, tileZ(2) + 0.5, { turn: -Math.PI / 2 }); blocked.add(key(10, 2)); blocked.add(key(10, 3));
  piece('centerplant', tileX(1), tileZ(4), { scale: 0.9 }); blocked.add(key(1, 4));
  piece('centerplant', tileX(9), tileZ(4), { scale: 0.9 }); blocked.add(key(9, 4));
  for (const tx of ESCALATORS) escalator(tx);

  const { step, mat: m } = doormat(tileX(DOOR.x), ROWS / 2 + 0.47, std({ color: '#c8b088' }));
  m.userData.spot = 'exit';
  room.add(step, m);
  mat = m.material;
}

/* ---------- walking ---------- */

const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const free = (c) => c.x >= 0 && c.y >= 0 && c.x < COLS && c.y < ROWS && !blocked.has(key(c.x, c.y));

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

/** Up to the counter for a choice, or to the door to leave; `aim` is acted on as it arrives. */
function goTo(kind) {
  const target = kind === 'exit' ? DOOR : SPOTS[kind].step;
  aim = kind;
  walker.path = route(walker.tile, target);
  if (!walker.path.length) arrived();
}

function arrived() {
  const kind = aim;
  aim = null;
  if (!kind) return;
  if (kind === 'exit') return opts.onLeave();
  if (walker.tile.x !== SPOTS[kind].step.x || walker.tile.y !== SPOTS[kind].step.y) return;
  walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
  if (kind === 'nurse') { playCry('chansey'); nurse.hopUntil = performance.now() + 600; }
  opts.onPick(SPOTS[kind].option);
}

/* ---------- taps ---------- */

function onTap(e) {
  if (busy || !alive()) return;
  if (e.target.closest('button, a, input, select, dialog, .reward-bottom, #room-bar, .room-hinge, .top-bar, #collection-screen, .over')) return;
  if (document.querySelector('dialog[open]')) return;
  const r = view.getBoundingClientRect();
  const v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  const ray = new THREE.Raycaster();
  ray.setFromCamera(v, camera);
  const hits = ray.intersectObjects([room, mon.group, nurse.group], true);
  const first = hits[0]?.object;
  if (first && first === mon.board) { playCry(mon.id); walker.hopUntil = performance.now() + 500; return; }
  let o = first;
  while (o && !o.userData.spot) o = o.parent;
  if (o?.userData.spot) { playSound('select'); return goTo(o.userData.spot); }
  const hit = new THREE.Vector3();
  if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
  const t = { x: Math.round(hit.x + COLS / 2 - 0.5), y: Math.round(hit.z + ROWS / 2 - 0.5) };
  if (t.y >= ROWS && Math.abs(t.x - DOOR.x) <= 1) return goTo('exit');   // the doorstep round the mat
  if (t.x < 0 || t.y < 0 || t.x >= COLS || t.y >= ROWS) return;
  aim = null;
  walker.path = route(walker.tile, t);
}

/* ---------- camera ---------- */

function aimCamera(x, d) {
  camera.position.set(x, LOOK_Y + Math.sin(PITCH) * d, Math.cos(PITCH) * d);
  camera.lookAt(x, LOOK_Y, 0);
  camera.updateMatrixWorld();
}

/** How much of the screen the room's bar, hinge and text box take at the bottom. */
function below() {
  const tops = ['#reward-screen .reward-bottom', '#room-bar', '#reward-screen .room-hinge']
    .map(s => document.querySelector(s)).filter(n => n?.offsetHeight).map(n => n.getBoundingClientRect().top);
  return tops.length ? Math.max(0, viewH - Math.min(...tops)) + 6 : 120;
}

/* The shot: ACROSS tiles at least, and far enough back that the room from the doorstep up to the sign fits over the
   bar and text box; a lens shift sets the doorstep just over them, so a shot held back by the room's width shows more
   wall, not more plinth. */
function fitShot() {
  const h = viewH;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const topGap = 10, low = below(), avail = Math.max(120, h - topGap - low), room = 2 * avail / h * 0.96;
  const span = (d) => {
    aimCamera(0, d);
    return [new THREE.Vector3(0, 4.7, -ROWS / 2).project(camera).y, new THREE.Vector3(0, -0.3, ROWS / 2 + 0.95).project(camera).y];
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
  if (!w || !h) return;
  renderer.setPixelRatio(1);
  const k = post.scale(w, h);
  renderer.setSize(Math.round(w * k), Math.round(h * k), false);
  post.size(w, h);
  camera.aspect = w / h;
  viewW = w; viewH = h;
  fitShot();
}

/* ---------- the frame ---------- */

/** Still in the Center: its room is up and showing. Anything else (a deck picker, the map) puts the 3D room away. */
const alive = () => !!document.querySelector('#reward-options.center-room') && !document.getElementById('reward-screen').hidden;

function frame(now) {
  raf = 0;
  if (!alive()) return unmount();
  const dt = Math.min(100, now - (last || now));
  last = now;
  if (walk(dt)) arrived();
  if (++sizeCheck % 30 === 0 && shot && Math.abs(below() - shot.low) > 4) fitShot();   // the text box grew or shrank
  const hopping = walker.hopUntil > now;
  const bob = calm ? 0 : walker.path.length ? Math.abs(Math.sin(walker.hop / 1000 * Math.PI * 4)) * 0.08 : hopping ? Math.abs(Math.sin((walker.hopUntil - now) / 500 * Math.PI * 2)) * 0.35 : 0;
  mon.group.position.set(walker.x, 0, walker.z);
  mon.board.position.y = bob;
  mon.board.scale.x = walker.flip ? -1 : 1;
  drawMon(mon, walker, dt);
  drawMon(nurse, { facing: 'front' }, dt);
  nurse.board.scale.x = walker.x > nurse.group.position.x + 0.3 ? -1 : 1;
  const left = (nurse.hopUntil || 0) - now;
  nurse.board.position.y = !calm && left > 0 ? Math.abs(Math.sin(left / 600 * Math.PI * 2)) * 0.3 : 0;
  for (const p of plays) tickPlay(p, now, dt);
  tickHeal(now);
  vitals.blink += dt;
  if (!monitor.face && mon.c.width) { monitor.face = mon.sheets.front.frames[0]?.bmp ?? null; monitor.faceReady = !!monitor.face; }
  drawVitals();
  if (!calm && mat) mat.emissiveIntensity = 0.12 + Math.sin(now / 420) * 0.1;
  placeCamera(dt);
  post.draw(scene, camera, (new THREE.Vector3(walker.x, 0.6, walker.z).project(camera).y + 1) / 2);
  raf = requestAnimationFrame(frame);
}

/** The machine's six balls: lit one by one as they go in, then flashing together while the chime plays. */
function setBalls(n, on = 1) {
  (machinePlay?.balls ?? []).forEach((b, i) => b.children.forEach(m => { m.material.emissiveIntensity = i < n ? 0.95 * on : 0; }));
}

function tickHeal(now) {
  if (healing) {
    const k = Math.min(1, (now - healing.from) / healing.ms);
    setBalls(Math.ceil(k * 6));
    if (k >= 1) { const done = healing.done; healing = null; done(); }
  } else if (flashing) {
    if (now > flashing.to) { flashing = null; setBalls(0); nurse.hopUntil = now + 600; }
    else setBalls(6, calm ? 1 : Math.floor((now - flashing.from) / 220) % 2 ? 0.25 : 1);
  }
  if (vitals.fill) {
    const f = vitals.fill, k = Math.min(1, (now - f.from) / f.ms);
    vitals.now = f.a + (f.b - f.a) * k;
    vitals.coming = (f.b - f.a) * (1 - k);
    if (k >= 1) vitals.fill = null;
  }
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
  busy = false; aim = null; healing = null; flashing = null;
}

/* ---------- in ---------- */

let warming = null;
/** Three.js loaded and the room built, before it is needed (the map calls it, so walking in is instant). */
export function warmCenter() {
  warming ??= (async () => {
    THREE = await loadThree();
    await hubThree();
    view = document.createElement('canvas');
    view.className = 'center3d-view';
    renderer = new THREE.WebGLRenderer({ canvas: view, antialias: false, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#3a1c14');
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
    post.final.uniforms.uBlur.value = 1.5;
    post.final.uniforms.uBand.value = 0.3;
    buildRoom();
    nurse = await monBoard({ src: 'assets/pokemon/chansey-front.gif', name: 'Chansey', cry: 'chansey' }, false);
    nurse.board.rotation.x = -PITCH;
    nurse.group.position.set(tileX(5), 0.12, tileZ(1));
    nurse.group.traverse(n => { n.userData.spot = 'nurse'; });
    scene.add(nurse.group);
    new ResizeObserver(() => { if (view.isConnected) resize(); }).observe(view);
  })();
  warming.catch(() => { warming = null; });
  return warming;
}

/** Lays the 3D Center under the room restSite() just showed. `o`: { run (to tell a new visit from coming back from the
    PC or Chansey), hp, maxHp, heal (what resting would heal), name, mate ({ src, name, cry }: your Pokémon),
    onPick(index): press that choice, onLeave(): press Leave }. Resolves the room's controls, or throws if Three.js won't
    load (the pixel room stays). */
export async function mountCenter(o) {
  const back = o.run === runId && performance.now() - leftAt < 20000;   // back from a deck picker, standing where it was
  runId = o.run;
  opts = o;
  calm = calmFx();
  await warmCenter();
  if (!alive()) return null;   // left while it loaded
  if (mon?.src !== o.mate.src) {
    if (mon) scene.remove(mon.group);
    mon = await monBoard(o.mate);
    mon.board.rotation.x = -PITCH;
    scene.add(mon.group);
    monitor.face = null;
  }
  if (!alive()) return null;
  if (!back) {
    walker = { x: tileX(DOOR.x), z: tileZ(DOOR.y), tile: { ...DOOR }, path: [], facing: mon.sheets.back ? 'back' : 'front', flip: false, hop: 0 };
    camX = walker.x;
  }
  walker.path = [];
  vitals = { now: o.hp, coming: o.heal, blink: 0, drawn: '' };
  setBalls(0);
  document.body.append(view);
  document.getElementById('reward-options').classList.add('c3d');
  addEventListener('click', onTap, true);
  addEventListener('resize', resize);
  resize();
  last = 0;
  if (!raf) raf = requestAnimationFrame(frame);
  requestAnimationFrame(() => view.classList.add('on'));
  return {
    /** The balls going into the machine one by one; resolves once they're all in. */
    heal() {
      busy = true;
      walker.path = []; aim = null;
      walker.facing = mon.sheets.back ? 'back' : 'front'; walker.flip = false;
      return new Promise(done => { healing = { from: performance.now(), ms: calm ? 150 : 1700, done }; });
    },
    /** The balls flashing while the chime plays, and the monitor's bar filling from `from` to `to`. */
    flash(seconds, from, to) {
      const now = performance.now();
      flashing = { from: now, to: now + seconds * 1000 };
      vitals.fill = { from: now, ms: seconds * 1000, a: from, b: to };
    },
  };
}
