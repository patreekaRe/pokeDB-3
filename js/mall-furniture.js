/* mall-furniture.js  -  the Poké Mall's Furniture store (roadmap 5a; branch secret-base): its front in the hall, glass
   with two of the day's pieces on show behind it, and its two 3D shop floors, the day's stock (furnitureStock()) standing
   on plinths as the real pieces, each with its price tag. The second floor (`secretBase.upstairs`, bought once) holds the
   next STOCK pieces of the same day's shuffle; its stair at the back right is roped off until it's open. Painted smooth
   like the hall (fine()), the furniture in its own pixels (pieceArt()). js/mall-3d.js walks it; this file only builds it. */

import { PIECES, pieceArt, furnitureStock, UPSTAIRS_PRICE } from './secret-base.js';
import { tex, trim } from './hd2d.js';
import { fine, texOf, words, star } from './hub-3d.js';
import { RES } from './base-paint.js';

const PX = 1 / (16 * RES);   // one of a piece's painted pixels, in tiles
export const STAIR_H = 2.6;   // the stair's top, up at the back wall
export const STAIR = { x: 11, foot: { x: 11, y: 4 }, climb: [{ x: 11, y: 3 }, { x: 11, y: 2 }, { x: 11, y: 1 }, { x: 11, y: 0 }] };
// each plinth's top-left tile (2 x 2), the back row then the front row; you stand at `step` to look at it
const BAYS = [[0, 1], [3, 1], [6, 1], [9, 1], [0, 4], [3, 4], [6, 4], [9, 4]];
const LOOK = {
  1: { paper: ['#d6efe8', '#c2e4dc'], trim: '#2a9a90', dark: '#1a6a64', sign: '#2a9a90', floor: ['#c89a64', '#b4844e', '#9a6c3c'] },
  2: { paper: ['#f6e0d4', '#ecccbc'], trim: '#c8566a', dark: '#8a3448', sign: '#c8566a', floor: ['#7a5a8a', '#6a4a7a', '#4e3460'] },
};
export const STORE_COLOUR = LOOK[1].trim;

const price = (n) => n.toLocaleString();

/** A sofa, the store's sign: two arms, a back and a seat. */
function sofa(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath(); g.roundRect(x - r, y - r * 0.5, r * 2, r * 0.9, r * 0.25); g.fill();
  g.beginPath(); g.roundRect(x - r * 1.25, y - r * 0.1, r * 0.5, r * 0.9, r * 0.2); g.fill();
  g.beginPath(); g.roundRect(x + r * 0.75, y - r * 0.1, r * 0.5, r * 0.9, r * 0.2); g.fill();
  g.beginPath(); g.roundRect(x - r * 0.8, y + 0.2 * r, r * 1.6, r * 0.6, r * 0.15); g.fill();
}

/** The front on the hall's back wall, between x0 and x1 (the painting's units) from `top` to `foot`: a teal fascia saying
    FURNITURE, two warm-lit display windows (the pieces in them are real, set in front of this) and a glass door. */
export function frontArt(f, s, x0, x1, top, foot) {
  const { g, rr, lin } = f, L = LOOK[1], mid = (x0 + x1) / 2;
  rr(x0, top, x1 - x0, foot - top, 0, '#4a3a2e');
  rr(x0, top, x1 - x0, 12, 1, lin(0, top, 0, top + 12, [L.trim, L.trim, L.dark]));
  rr(x0 + 2, top + 2, x1 - x0 - 4, 8, 1, '#ffffff');
  sofa(g, x0 + 9, top + 6.4, 2.6, L.trim);
  words(g, 'FURNITURE', mid + 4, top + 6.2, 5.4, L.dark);
  s.fillStyle = '#c8c8c8'; s.beginPath(); s.roundRect(x0 + 2, top + 2, x1 - x0 - 4, 8, 1); s.fill();
  words(s, 'FURNITURE', mid + 4, top + 6.2, 5.4, '#40a0a0');
  const wt = top + 14, wb = foot - 4, dw = 14;
  for (const [a, b] of [[x0 + 2, mid - dw / 2 - 1.5], [mid + dw / 2 + 1.5, x1 - 2]]) {
    rr(a, wt, b - a, wb - wt, 0.8, lin(0, wt, 0, wb, ['#fff4d0', '#ffd890', '#e8b070']));
    g.fillStyle = 'rgba(120,70,40,0.18)'; g.fillRect(a, wb - 6, b - a, 6);   // the display's back, under the pieces
    s.fillStyle = '#a08060'; s.fillRect(a, wt, b - a, wb - wt - 6);
    rr(a - 0.6, wb, b - a + 1.2, 4, 0.4, '#e8dcc4');
  }
  rr(mid - dw / 2, wt - 2, dw, foot - wt + 2, 0.6, '#3a3a44');
  rr(mid - dw / 2 + 1.2, wt - 0.8, dw - 2.4, foot - wt + 0.8, 0.4, lin(0, wt, 0, foot, ['#cfeaff', '#9ac8e8', '#7aa8c8']));
  g.fillStyle = '#3a3a44'; g.fillRect(mid - 0.4, wt - 0.8, 0.8, foot - wt);
  for (const x of [mid - 2.4, mid + 1.6]) rr(x, (wt + foot) / 2, 0.8, 5, 0.4, '#d8dce6');
  rr(mid - 4.5, wt + 3, 9, 3.6, 0.8, '#ffffff');
  words(g, 'OPEN', mid, wt + 4.9, 2.6, L.trim);
}

/** Two of today's pieces in the front's windows (uprights, so they read as themselves), with the glass in front of them
    and a sill under each. `cx` is the front's middle, `z` the wall's face. */
export function frontWindow(THREE, cx, z) {
  const group = new THREE.Group(), stock = furnitureStock(), shown = stock.filter(id => !PIECES[id].flat && !PIECES[id].wall);
  const picks = [...shown, 'plant', 'lamp'].slice(0, 2);
  picks.forEach((id, i) => {
    const cut = trim(pieceArt(id, 0)), w = cut.w * PX, h = cut.h * PX, k = Math.min(1, 0.78 / w, 1.15 / h);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w * k, h * k), new THREE.MeshStandardMaterial({ map: tex(cut.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
    m.position.set(cx + (i ? 1 : -1), 0.42 + h * k / 2, z + 0.12);
    group.add(m);
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.95), new THREE.MeshStandardMaterial({ color: '#d8f0ff', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.3, depthWrite: false }));
  glass.position.set(cx, 0.98, z + 0.3);
  group.add(glass);
  return group;
}

/** A floor's back wall, one painting: wallpaper over a wood dado, the store's lit sign, shelves of little things high up,
    tall windows above for a tall phone, and on the ground floor the lit doorway the stair climbs to. */
function wallArt(floor, { cols, top: TOP, u: U }) {
  const W = (cols + 0.8) * U, H = TOP * U, L = LOOK[floor], f = fine(W, H, 4), { g, rr, lin, shine } = f, s = shine();
  const wx = (t) => (t + 0.4) * U, wy = (y) => (TOP - y) * U;
  g.fillStyle = L.paper[0]; g.fillRect(0, 0, W, H);
  g.fillStyle = L.paper[1];
  for (let x = 0; x < W; x += 8) g.fillRect(x, wy(5), 3.5, wy(0) - wy(5));
  // windows up high, sky through them
  const wt = wy(TOP - 0.4), wb = wy(5.6);
  for (let t = 0.4; t < cols - 0.4; t += 2.6) {
    const x0 = wx(t) + 4, x1 = wx(t + 2.6) - 4;
    rr(x0 - 1.5, wt - 1.5, x1 - x0 + 3, wb - wt + 3, 1, L.dark);
    g.fillStyle = lin(0, wt, 0, wb, ['#7ab8f0', '#a8d4f8', '#e0f0ff']); g.fillRect(x0, wt, x1 - x0, wb - wt);
    g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.moveTo((x0 + x1) / 2, wt); g.lineTo((x0 + x1) / 2, wb); g.stroke();
    s.fillStyle = '#404850'; s.fillRect(x0, wt, x1 - x0, wb - wt);
  }
  rr(0, wy(5.15), W, 2.4, 0, L.trim);
  // the sign, lit, over the middle of the back row
  const sx = wx(4.6), sw = 4.8 * U, sy = wy(4.6);
  rr(sx - sw / 2, sy, sw, 20, 3, L.sign);
  rr(sx - sw / 2 + 1.5, sy + 1.5, sw - 3, 17, 2.4, '#ffffff');
  sofa(g, sx - sw / 2 + 13, sy + 10, 5, L.sign);
  words(g, floor === 1 ? 'FURNITURE' : 'FURNITURE 2F', sx + 8, sy + 10.4, floor === 1 ? 10 : 8.6, L.dark);
  s.fillStyle = '#d0d0d0'; s.beginPath(); s.roundRect(sx - sw / 2 + 1.5, sy + 1.5, sw - 3, 17, 2.4); s.fill();
  words(s, floor === 1 ? 'FURNITURE' : 'FURNITURE 2F', sx + 8, sy + 10.4, floor === 1 ? 10 : 8.6, '#60c0c0');
  // little things on high shelves either side of it
  const things = ['#e86a5a', '#f0c040', '#5aa8e0', '#78c060', '#b07ad0', '#f0a0b8'];
  for (const [a, b] of [[wx(0.2), sx - sw / 2 - 8], [sx + sw / 2 + 8, wx(floor === 1 ? 10.6 : 12.6)]]) {
    if (b - a < 12) continue;
    const y = wy(3.6);
    rr(a, y, b - a, 2.4, 0.6, lin(0, y, 0, y + 2.4, ['#c89a64', '#8a5a32']));
    let i = 0;
    for (let x = a + 4; x < b - 4; x += 9, i++) {
      g.fillStyle = things[i % things.length];
      if (i % 3 === 0) { g.beginPath(); g.roundRect(x - 2.4, y - 7, 4.8, 7, [2, 2, 0.6, 0.6]); g.fill(); }
      else if (i % 3 === 1) { for (let k = 0; k < 3; k++) g.fillRect(x - 3 + k * 2.2, y - 6 - (k % 2), 1.8, 6 + (k % 2)); }
      else { g.beginPath(); g.arc(x, y - 3, 3, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3e7a34'; g.fillRect(x - 0.4, y - 9, 0.8, 3); }
    }
  }
  // hanging lamps along the top of the room
  for (let t = 1; t < cols; t += 2.4) {
    const x = wx(t), y = wy(5.4);
    g.strokeStyle = '#3a3a44'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x, wy(5.15)); g.lineTo(x, y); g.stroke();
    g.fillStyle = '#fff2c0'; g.beginPath(); g.arc(x, y + 2.4, 2.6, Math.PI, 0); g.fill();
    s.fillStyle = '#ffffff'; s.beginPath(); s.arc(x, y + 2.4, 3, Math.PI, 0); s.fill();
  }
  // a wood dado
  const dt = wy(1.1);
  rr(0, dt, W, wy(0) - dt, 0, lin(0, dt, 0, wy(0), ['#b48a5a', '#8a6038']));
  rr(0, dt - 1.6, W, 1.6, 0, L.trim);
  for (let x = 6; x < W; x += 14) { g.strokeStyle = 'rgba(60,30,10,0.3)'; g.lineWidth = 0.5; g.strokeRect(x, dt + 3, 10, wy(0) - dt - 6); }
  if (floor === 1) {
    const x0 = wx(STAIR.x) + 3, x1 = wx(STAIR.x + 2) - 3, top = wy(STAIR_H + 1.8), foot = wy(STAIR_H);
    rr(x0 - 2, top - 2, x1 - x0 + 4, foot - top + 2, 1.4, L.dark);
    rr(x0, top, x1 - x0, foot - top, 1, lin(0, top, 0, foot, ['#ffe8b0', '#ffc878', '#c8884a']));
    s.fillStyle = '#c0a070'; s.beginPath(); s.roundRect(x0, top, x1 - x0, foot - top, 1); s.fill();
    rr((x0 + x1) / 2 - 7, top - 13, 14, 9, 2, L.sign);
    words(g, '2F', (x0 + x1) / 2, top - 8.4, 6.4, '#ffffff');
    s.fillStyle = '#ffffff'; words(s, '2F', (x0 + x1) / 2, top - 8.4, 6.4, '#ffffff');
  }
  return f.c;
}

/** The floor: wood planks downstairs, a carpet upstairs, a welcome mat at the way in, and upstairs the stairwell going
    down at the back right, its steps darker the deeper they go. */
function floorArt(floor, { cols, rows }) {
  const T = 16, L = LOOK[floor], f = fine(cols * T, rows * T, 5), { g, rr, lin } = f;
  if (floor === 1) {
    for (let y = 0; y < rows * T; y += 4) {
      g.fillStyle = (y / 4) % 2 ? L.floor[0] : L.floor[1]; g.fillRect(0, y, cols * T, 4);
      g.fillStyle = 'rgba(60,30,10,0.35)'; g.fillRect(0, y + 3.7, cols * T, 0.3);
      for (let x = ((y / 4) % 3) * 9; x < cols * T; x += 27) g.fillRect(x, y, 0.3, 4);
    }
  } else {
    g.fillStyle = L.floor[0]; g.fillRect(0, 0, cols * T, rows * T);
    g.fillStyle = L.floor[1];
    for (let y = 0; y < rows * T; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < cols * T; x += 8) { g.beginPath(); g.arc(x, y, 1.2, 0, Math.PI * 2); g.fill(); }
  }
  rr(5.5 * T + 2, (rows - 1) * T + 2, 2 * T - 4, T - 4, 2, L.trim);
  words(g, 'WELCOME', 6.5 * T, (rows - 0.5) * T, 3.6, '#ffffff');
  if (floor === 2) {
    const x0 = STAIR.x * T, x1 = (STAIR.x + 2) * T, y1 = 4 * T;
    rr(x0, 0, x1 - x0, y1, 0, '#1a1420');
    for (let i = 0; i < 8; i++) {
      const y = y1 - (i + 1) * 8, k = 1 - i / 9;
      g.fillStyle = `rgb(${Math.round(200 * k)},${Math.round(160 * k)},${Math.round(120 * k)})`; g.fillRect(x0 + 1, y + 1, x1 - x0 - 2, 5.5);
      g.fillStyle = `rgba(0,0,0,${0.3 + i * 0.07})`; g.fillRect(x0 + 1, y + 6.5, x1 - x0 - 2, 1.5);
    }
    g.fillStyle = lin(0, 0, 0, y1, ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0)']); g.fillRect(x0, 0, x1 - x0, y1);
  }
  return f.c;
}

/** A price tag: a white card with the store's stripe, a gold coin and the price. */
function tagArt(text, colour) {
  const f = fine(40, 14, 6), { g, rr } = f;
  rr(0.5, 0.5, 39, 13, 2.4, '#ffffff');
  rr(0.5, 0.5, 6, 13, [2.4, 0, 0, 2.4], colour);
  g.fillStyle = '#f8d040'; g.beginPath(); g.arc(12, 7, 3.6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c89418'; star(g, 12, 7, 2);
  words(g, text, 26, 7.4, 7, '#2a2238');
  return f.c;
}

/** The rope across the stair's foot until the second floor is open: two brass posts, a red rope and its sign. */
function ropeArt() {
  const f = fine(30, 12, 6), { g, rr } = f;
  rr(0.5, 0.5, 29, 11, 2, LOOK[2].trim);
  rr(1.6, 1.6, 26.8, 8.8, 1.4, '#ffffff');
  words(g, '2F CLOSED', 15, 6.2, 4.4, LOOK[2].dark);
  return f.c;
}

/** One floor of the store. `size` is the hall's ({ cols, rows, top, u }), so one camera fits both. Returns its group,
    the tiles it blocks, the spots you can walk up to (a plinth each, and the stair), the gold ring that marks a picked
    plinth and the rope (hidden once the second floor is open). */
export function buildFloor(THREE, floor, size, upstairs) {
  const { cols, rows, top: TOP } = size, L = LOOK[floor];
  const tileX = (tx) => tx + 0.5 - cols / 2, tileZ = (ty) => ty + 0.5 - rows / 2;
  const group = new THREE.Group(), blocked = new Set(), spots = [];
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const lit = (src, colour, k = 1) => std({ map: texOf(src), emissive: new THREE.Color(colour), emissiveMap: texOf(src.glow), emissiveIntensity: k, roughness: 0.9 });
  const edge = std({ color: '#3a3040' });

  const floorBox = new THREE.Mesh(new THREE.BoxGeometry(cols, 0.6, rows), [edge, edge, std({ map: texOf(floorArt(floor, size)), roughness: 0.6 }), edge, std({ color: '#8a6038' }), edge]);
  floorBox.position.y = -0.3;
  floorBox.receiveShadow = true;
  group.add(floorBox);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, 7, rows + 0.4), [edge, edge, edge, edge, std({ color: '#5a4434' }), edge]);
  plinth.position.set(0, -0.6 - 3.5, -0.2);
  group.add(plinth);
  const cap = std({ color: L.dark });
  const back = new THREE.Mesh(new THREE.BoxGeometry(cols + 0.8, TOP, 0.4), [cap, cap, cap, cap, lit(wallArt(floor, size), '#fff4dc', 1), cap]);
  back.position.set(0, TOP / 2, -rows / 2 - 0.2);
  back.receiveShadow = true;
  group.add(back);
  const side = std({ color: L.paper[0] });
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, TOP, rows), side);
    m.position.set(s * (cols / 2 + 0.2), TOP / 2, 0);
    m.receiveShadow = true;
    group.add(m);
  }

  // the plinths and their pieces
  const top = std({ color: '#fbf6ea', roughness: 0.6 }), rim = std({ color: L.trim });
  const stock = furnitureStock(undefined, floor);
  stock.forEach((id, i) => {
    const [bx, by] = BAYS[i], p = PIECES[id], cx = tileX(bx) + 0.5, cz = tileZ(by) + 0.5;
    const spot = { id: `bay${i}`, kind: 'bay', piece: id, name: p.name, open: true, step: { x: bx + (by > 2 ? 1 : 0), y: by > 2 ? 6 : 3 }, at: { x: cx, z: cz } };
    spots.push(spot);
    for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) blocked.add(`${bx + x},${by + y}`);
    const bay = new THREE.Group();
    bay.position.set(cx, 0, cz);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 1.8), [rim, rim, top, rim, rim, rim]);
    slab.position.y = 0.08;
    slab.castShadow = slab.receiveShadow = true;
    bay.add(slab);
    if (p.flat) {
      const k = Math.min(1, 1.6 / Math.max(p.w, p.h)), h = Math.max(0.04, p.high * k), s = std({ color: p.side, roughness: 0.95 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(p.w * k, h, p.h * k), [s, s, std({ map: tex(pieceArt(id)), alphaTest: 0.5, roughness: 0.9 }), s, s, s]);
      box.position.y = 0.16 + h / 2;
      box.castShadow = h > 0.1; box.receiveShadow = true;
      bay.add(box);
    } else {
      const cut = trim(pieceArt(id, 0)), w = cut.w * PX, h = cut.h * PX, k = Math.min(1, 1.7 / w, 2.1 / h);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(w * k, h * k), std({ map: tex(cut.c), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }));
      board.position.set(0, 0.16 + h * k / 2, p.wall ? -0.3 : 0);
      board.castShadow = true;
      bay.add(board);
      if (p.wall) {   // a wall piece hangs on a little display board of its own
        const panel = new THREE.Mesh(new THREE.BoxGeometry(w * k + 0.16, h * k + 0.16, 0.06), std({ color: '#efe6d4' }));
        panel.position.set(0, 0.16 + h * k / 2, -0.35);
        panel.castShadow = true;
        bay.add(panel);
      }
    }
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.3), std({ map: texOf(tagArt(price(p.price), L.trim)), roughness: 0.7 }));
    tag.position.set(0, 0.24, 0.93);
    tag.rotation.x = -0.6;
    bay.add(tag);
    bay.traverse(o => { o.userData.front = spot; });
    group.add(bay);
  });

  // the stair: up to the doorway on the ground floor, a stairwell going down on the second
  for (let x = STAIR.x; x < STAIR.x + 2; x++) for (let y = 0; y < 4; y++) blocked.add(`${x},${y}`);
  const sx = tileX(STAIR.x) + 0.5, zFront = tileZ(3) + 0.5;
  const stair = { id: 'stairs', kind: 'stairs', name: floor === 1 ? 'Second floor' : 'Ground floor', open: true, step: { ...STAIR.foot } };
  spots.push(stair);
  const steel = std({ color: '#d8dce6', metalness: 0.6, roughness: 0.3 });
  const stairGroup = new THREE.Group();
  let rope = null;
  if (floor === 1) {
    const tread = std({ color: '#b4844e', roughness: 0.7 }), riser = std({ color: '#fbf6ea' });
    for (let i = 0; i < 8; i++) {
      const h = (i + 1) * STAIR_H / 8;
      const step = new THREE.Mesh(new THREE.BoxGeometry(2, h, 0.5), [riser, riser, tread, riser, riser, riser]);
      step.position.set(sx, h / 2, zFront - (i + 0.5) * 0.5);
      step.castShadow = step.receiveShadow = true;
      stairGroup.add(step);
    }
    const run = Math.hypot(4, STAIR_H), rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, run), steel);
    rail.position.set(sx - 0.97, STAIR_H / 2 + 0.75, zFront - 2);
    rail.rotation.x = Math.atan2(STAIR_H, 4);
    stairGroup.add(rail);
    for (let i = 0; i < 4; i++) {
      const z = zFront - 0.25 - i * 1.15, y = (zFront - z) / 4 * STAIR_H;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.75, 0.04), steel);
      post.position.set(sx - 0.97, y + 0.375, z);
      stairGroup.add(post);
    }
    if (!upstairs) {
      rope = new THREE.Group();
      const brass = std({ color: '#e0b040', metalness: 0.7, roughness: 0.3 });
      for (const x of [sx - 0.85, sx + 0.85]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.7, 10), brass);
        post.position.set(x, 0.35, zFront + 0.2);
        post.castShadow = true;
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), brass);
        knob.position.set(x, 0.72, zFront + 0.2);
        rope.add(post, knob);
      }
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(sx - 0.85, 0.66, zFront + 0.2), new THREE.Vector3(sx, 0.36, zFront + 0.2), new THREE.Vector3(sx + 0.85, 0.66, zFront + 0.2));
      rope.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.03, 6), std({ color: '#c8283a', roughness: 0.6 })));
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.24), std({ map: texOf(ropeArt()) }));
      sign.position.set(sx, 0.4, zFront + 0.24);
      rope.add(sign);
      stairGroup.add(rope);
    }
  } else {
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.55), std({ color: '#cfeaff', transparent: true, opacity: 0.3, roughness: 0.1, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide }));
    glass.rotation.y = Math.PI / 2;
    glass.position.set(sx - 1, 0.3, zFront - 2);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 4), steel);
    rail.position.set(sx - 1, 0.6, zFront - 2);
    stairGroup.add(glass, rail);
    for (let i = 0; i <= 4; i++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 0.04), steel);
      post.position.set(sx - 1, 0.3, zFront - i);
      stairGroup.add(post);
    }
  }
  // the stair answers a tap anywhere on it: an invisible board over the whole of it
  const tap = new THREE.Mesh(new THREE.BoxGeometry(2, floor === 1 ? STAIR_H + 0.6 : 0.4, 4), new THREE.MeshBasicMaterial({ visible: false }));
  tap.position.set(sx, floor === 1 ? (STAIR_H + 0.6) / 2 : 0.1, zFront - 2);
  stairGroup.add(tap);
  stairGroup.traverse(o => { o.userData.front = stair; });
  group.add(stairGroup);

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.12, 48), new THREE.MeshBasicMaterial({ color: '#f8d040', transparent: true, opacity: 0.9, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  ring.visible = false;
  ring.raycast = () => {};
  group.add(ring);

  return { group, blocked, spots, ring, rope, top: 4.4, title: floor === 1 ? 'Furniture' : 'Furniture 2F' };
}

/** How high (or, upstairs, how deep) your partner stands at world x, z: on the stair's tiles it rises with each step. */
export function stairLift(floor, x, z, { cols, rows }) {
  const x0 = STAIR.x - cols / 2, zFront = 3.5 - rows / 2 + 0.5;
  if (x < x0 || z > zFront) return 0;
  const t = Math.min(1, (zFront - z) / 4);
  return floor === 1 ? t * STAIR_H : -t * 2.2;
}

export const upstairsLine = () => `The second floor: 8 more pieces every day. Open it for ${price(UPSTAIRS_PRICE)} PokéCoins? Tap again.`;
