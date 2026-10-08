/* secret-base.js  -  the Secret Base (roadmap idea, part a's first pass): a room of your own, its furniture painted in
   code like the biomes' landmarks, placed on a tile grid with taps (no dragging, for phones). A tap on a piece in the
   tray then on the room places it; a tap on a placed piece gives Rotate / Move / Store. The layout is the save's
   `secretBase`. Since the 3D base (js/base-3d.js) this 2D room is only its fallback where WebGL fails (or ?base&flat);
   the 3D one builds from the paintings, rules and tray icons exported here. */

import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { PIECES, CATALOGUE, KINDS, colours } from './base-furniture.js';
import { RES } from './base-paint.js';
import { safariDay } from './data/safari.js';
import { streamOf, shuffled } from './rng.js';

const T = 16, COLS = 11, ROWS = 8, WALL = 48;
const W = COLS * T, H = WALL + ROWS * T;

const WALLPAPERS = [
  { id: 'cream', name: 'Cream stripes', look: 'stripe', a: '#f4e6c4', b: '#ead6a8', trim: '#a8794a' },
  { id: 'mint', name: 'Mint dots', look: 'dots', a: '#cdebd4', b: '#9fd2ad', trim: '#4f8a63' },
  { id: 'sky', name: 'Sky panels', look: 'panel', a: '#c8dcf4', b: '#9dbbe4', trim: '#4a6aa0' },
  { id: 'brick', name: 'Red brick', look: 'brick', a: '#b5573e', b: '#8e3f2c', trim: '#5a2a1e' },
];
const FLOORS = [
  { id: 'wood', name: 'Wood', look: 'wood', a: '#c48a52', b: '#a8723f', c: '#8a5a30' },
  { id: 'tile', name: 'Tiles', look: 'tile', a: '#e8e4dc', b: '#cfc8bb', c: '#a49c8e' },
  { id: 'carpet', name: 'Carpet', look: 'carpet', a: '#7a5aa8', b: '#6a4c96', c: '#8c6cba' },
  { id: 'grass', name: 'Grass', look: 'grass', a: '#6cbf58', b: '#58a848', c: '#86d46e' },
];

let g;   // the room's 2D context while painting
const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

const footprint = (it) => { const p = PIECES[it.id]; return it.dir % 2 ? [p.h, p.w] : [p.w, p.h]; };

// every new room is the same: a bed, a lamp, a rug under the window, and a present of starter furniture to open
const FIRST_ROOM = [{ id: 'window', x: 4 }, { id: 'rug', x: 4, y: 3, dir: 0 }, { id: 'bed', x: 0, y: 0, dir: 0 },
  { id: 'lamp', x: 2, y: 0, dir: 0 }, { id: 'gift', x: 5, y: 3, dir: 0 }];
const STARTER_GIFT = ['table', 'chair', 'chair', 'cushion', 'cushion', 'plant', 'shelf', 'tv', 'poster', 'clock'];
const STOCK = 8;   // pieces in the Furniture shop each day

const freshBase = (mons) => ({
  v: 2, wall: 'cream', floor: 'wood', items: FIRST_ROOM.map(it => ({ ...it })),
  owned: { window: 1, rug: 1, bed: 1, lamp: 1 }, ...(mons ? { mons } : {}),
});

export { PIECES, CATALOGUE, KINDS, colours, WALLPAPERS, FLOORS, T, WALL, COLS, ROWS, STARTER_GIFT, footprint, cells, fits, aimTile, icon };
/** The saved room, or the first one. A room from before furniture was owned (v 1, when every piece was free) starts
    over as the first room, keeping its Pokémon: only playtests of the unreleased branch made those. `?basefresh` does
    the same on purpose. */
export function loadBase() {
  const b = getSave().secretBase;
  if (!b || !(b.v >= 2) || new URLSearchParams(location.search).has('basefresh')) return freshBase(b?.mons);
  b.owned ||= {};
  // furniture was once owned colour by colour (`bed-fire`); now a kind is owned and every colour comes with it
  for (const id of Object.keys(b.owned)) {
    const kind = PIECES[id]?.fam;
    if (kind && kind !== id) { b.owned[kind] = (b.owned[kind] || 0) + b.owned[id]; delete b.owned[id]; }
  }
  return b;
}
export const saveBase = (b) => updateSave(d => { d.secretBase = b; });

/** `?allfurniture`: every catalogue piece to hand for a playtest, never saved as owned. */
export const lendAll = () => new URLSearchParams(location.search).has('allfurniture');

/** How many of a piece's kind are in storage, in any colour: owned, less those standing in the room. */
export function spare(b, id) {
  if (lendAll() && PIECES[id] && !PIECES[id].gift) return Infinity;
  const kind = PIECES[id].fam;
  return (b.owned[kind] || 0) - b.items.filter(it => PIECES[it.id].fam === kind).length;
}

/** Open the room's present: it's gone, and the starter furniture is in storage. Returns what was inside. */
export function openGift(b) {
  b.items = b.items.filter(it => it.id !== 'gift');
  for (const id of STARTER_GIFT) b.owned[id] = (b.owned[id] || 0) + 1;
  saveBase(b);
  return STARTER_GIFT;
}

/** The Furniture shop's stock for a UTC day: STOCK kinds, the same for everyone that day. */
export const furnitureStock = (day = safariDay()) => shuffled(KINDS, streamOf('furniture', day)).slice(0, STOCK);

/** Buy a piece for PokéCoins into storage. False if the coins aren't there. */
export function buyPiece(b, id) {
  const price = PIECES[id].price;
  if ((getSave().coins ?? 0) < price) return false;
  b.owned[PIECES[id].fam] = (b.owned[PIECES[id].fam] || 0) + 1;
  updateSave(d => { d.coins -= price; d.secretBase = b; });
  return true;
}

/** The wallpaper strip (WALL high) and the bare floor, painted on one canvas the room's size. */
export function roomArt(b) {
  const c = new OffscreenCanvas(W, H), keep = g, kept = base;
  g = c.getContext('2d'); base = b;
  paintWall(); paintFloor();
  g = keep; base = kept;
  return c;
}

/** One piece alone on a clear canvas, RES painted pixels to a room pixel (its `art()`): a flat one top-down at its first
    facing, a wall one as its strip, an upright one at `dir` with headroom above its tiles. */
export const pieceArt = (id, dir = 0) => PIECES[id].art(dir);

let base, canvas, holding = null, sel = -1, ghost = null, badGhost = 0, hint;

function paintWall() {
  const wp = WALLPAPERS.find(w => w.id === base.wall);
  R(0, 0, W, WALL, wp.a);
  for (let x = 0; x < W; x += 8) for (let y = 0; y < WALL - 4; y += 8) {
    if (wp.look === 'stripe' && x % 16 === 0) R(x, y, 4, 8, wp.b);
    if (wp.look === 'dots' && (x / 8 + y / 8) % 2 === 0) R(x + 3, y + 3, 2, 2, wp.b);
    if (wp.look === 'panel' && x % 32 === 0) { R(x + 3, 6, 26, 1, wp.b); R(x + 3, 6, 1, 30, wp.b); R(x + 3, 36, 26, 1, wp.trim); R(x + 28, 6, 1, 31, wp.trim); }
    if (wp.look === 'brick') { R(x, y + 7, 8, 1, wp.b); if ((x / 8 + (y / 8) % 2 * 1) % 2 === 0) R(x, y, 1, 7, wp.b); }
  }
  R(0, WALL - 5, W, 5, wp.trim); R(0, WALL - 5, W, 1, '#00000030');
}

function paintFloor() {
  const f = FLOORS.find(x => x.id === base.floor);
  R(0, WALL, W, H - WALL, f.a);
  for (let ty = 0; ty < ROWS * 2; ty++) for (let tx = 0; tx < COLS * 2; tx++) {
    const x = tx * 8, y = WALL + ty * 8;
    if (f.look === 'wood') { if ((tx + (ty % 2) * 3) % 6 === 0) R(x, y, 1, 8, f.c); R(x, y + 7, 8, 1, f.b); }
    if (f.look === 'tile') { if ((tx >> 1) % 2 === (ty >> 1) % 2) R(x, y, 8, 8, f.b); if (tx % 2 === 0) R(x, y, 1, 8, f.c); if (ty % 2 === 0) R(x, y, 8, 1, f.c); }
    if (f.look === 'carpet' && (tx * 7 + ty * 3) % 5 === 0) R(x + 3, y + 3, 1, 1, f.c);
    if (f.look === 'grass' && (tx * 5 + ty * 11) % 7 === 0) { R(x + 2, y + 3, 1, 3, f.c); R(x + 4, y + 2, 1, 4, f.c); R(x + 3, y + 5, 3, 1, f.b); }
  }
  R(0, WALL, W, 2, '#00000028');
}

function paintPiece(it, alpha = 1) {
  const p = PIECES[it.id];
  g.globalAlpha = alpha;
  if (p.layer === 'wall') { g.drawImage(p.art(), it.x * T, 0, p.w * T, WALL); g.globalAlpha = 1; return; }
  const x = it.x * T, y = WALL + it.y * T, [fw, fh] = footprint(it);
  if (p.flat) {
    g.save();
    g.translate(x + fw * T / 2, y + fh * T / 2);
    g.rotate(it.dir * Math.PI / 2);
    g.drawImage(p.art(), -p.w * T / 2, -p.h * T / 2, p.w * T, p.h * T);
    g.restore();
    if (p.layer !== 'rug') R(x + 1, y + fh * T - 2, fw * T - 2, 2, '#00000040');   // its side, so it stands off the floor
  } else {
    const art = p.art(it.dir);
    g.drawImage(art, x, y + fh * T - art.height / RES, art.width / RES, art.height / RES);
  }
  g.globalAlpha = 1;
}

function paint() {
  g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  paintWall();
  paintFloor();
  const order = base.items.map((it, i) => ({ it, i }));
  const rank = ({ it }) => PIECES[it.id].layer === 'wall' ? -2 : PIECES[it.id].layer === 'rug' ? -1 : it.y + footprint(it)[1];
  order.sort((a, b) => rank(a) - rank(b));
  for (const { it } of order) paintPiece(it);
  if (sel >= 0) outline(base.items[sel], '#ffe060');
  if (holding && ghost) {
    const it = { ...holding, ...ghost };
    paintPiece(it, 0.6);
    outline(it, fits(it) ? '#60e080' : '#ff5050');
  }
}

function outline(it, colour) {
  const p = PIECES[it.id], [fw, fh] = footprint(it);
  const x = it.x * T, y = p.layer === 'wall' ? 4 : WALL + it.y * T, w = fw * T, h = p.layer === 'wall' ? 38 : fh * T;
  g.strokeStyle = colour; g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

const cells = (it) => { const [fw, fh] = footprint(it), out = []; for (let i = 0; i < fw; i++) for (let j = 0; j < fh; j++) out.push(`${it.x + i},${it.y + j}`); return out; };

/** Whether a piece fits the room `b` (the 2D room's own by default), leaving out item `skip` (the one being moved). */
function fits(it, skip = -1, b = base) {
  const p = PIECES[it.id], [fw, fh] = footprint(it);
  if (it.x < 0 || it.x + fw > COLS) return false;
  if (p.layer === 'wall') return b.items.every((o, i) => i === skip || PIECES[o.id].layer !== 'wall' || o.x + PIECES[o.id].w <= it.x || it.x + fw <= o.x);
  if (it.y < 0 || it.y + fh > ROWS) return false;
  const mine = new Set(cells(it)), rug = p.layer === 'rug';
  return b.items.every((o, i) => {
    if (i === skip || PIECES[o.id].layer === 'wall' || (PIECES[o.id].layer === 'rug') !== rug) return true;
    return !cells(o).some(c => mine.has(c));
  });
}

/** Where a tap lands, in tiles (fractions allowed): the piece's footprint centred on it, pulled inside the room. */
function aimTile(id, dir, tx, ty) {
  const p = PIECES[id], [fw, fh] = dir % 2 ? [p.h, p.w] : [p.w, p.h];
  const x = Math.max(0, Math.min(COLS - fw, Math.floor(tx - (fw - 1) / 2)));
  if (p.layer === 'wall') return { x };
  return { x, y: Math.max(0, Math.min(ROWS - fh, Math.floor(ty - (fh - 1) / 2))) };
}
const aim = (id, dir, lx, ly) => aimTile(id, dir, lx / T, (ly - WALL) / T);

function pieceAt(lx, ly) {
  const tx = Math.floor(lx / T), ty = Math.floor((ly - WALL) / T);
  const hit = (it) => {
    if (PIECES[it.id].layer === 'wall') return ly < WALL && tx >= it.x && tx < it.x + PIECES[it.id].w;
    return ly >= WALL && cells(it).includes(`${tx},${ty}`);
  };
  const order = base.items.map((it, i) => i).filter(i => hit(base.items[i]));
  return order.find(i => PIECES[base.items[i].id].layer !== 'rug') ?? order[0] ?? -1;
}

const save = () => updateSave(d => { d.secretBase = base; });

function local(e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height];
}

function onTap(e) {
  const [lx, ly] = local(e);
  if (holding) {
    const it = { ...holding, ...aim(holding.id, holding.dir, lx, ly) };
    if (!fits(it)) { ghost = aim(holding.id, holding.dir, lx, ly); playSound('cancel'); clearTimeout(badGhost); badGhost = setTimeout(() => { ghost = null; paint(); }, 600); paint(); return; }
    delete it.back;
    base.items.push(PIECES[it.id].layer === 'wall' ? { id: it.id, x: it.x } : { id: it.id, x: it.x, y: it.y, dir: it.dir });
    holding = null; ghost = null;
    sel = base.items.length - 1;
    playSound('confirm');
    save();
  } else {
    sel = pieceAt(lx, ly);
    if (base.items[sel]?.id === 'gift') { openGift(base); sel = -1; playSound('item-get'); tray('furniture'); }
    else if (sel >= 0) playSound('confirm');
  }
  refresh();
}

function onMove(e) {
  if (!holding || e.pointerType !== 'mouse') return;
  const [lx, ly] = local(e);
  ghost = aim(holding.id, holding.dir, lx, ly);
  paint();
}

function act(kind) {
  const it = base.items[sel];
  if (!it) return;
  if (kind === 'rotate') {
    const turned = { ...it, dir: (it.dir + 1) % 4 };
    const [fw, fh] = footprint(turned);
    turned.x = Math.min(turned.x, COLS - fw); turned.y = Math.min(turned.y, ROWS - fh);
    if (fits(turned, sel)) { base.items[sel] = turned; save(); }
    else playSound('cancel');
  }
  if (kind === 'move') { holding = { ...it, back: it }; base.items.splice(sel, 1); sel = -1; ghost = null; }
  if (kind === 'store') { base.items.splice(sel, 1); sel = -1; playSound('cancel'); save(); }
  if (kind === 'done') sel = -1;
  refresh();
}

function cancelHold() {
  if (holding?.back) base.items.push(holding.back);
  holding = null; ghost = null;
  refresh();
}

const icons = new Map();
/** A piece's tray picture: painted once, then copied, since a tray can list hundreds. */
function icon(id) {
  const made = icons.get(id);
  if (made) { const c = document.createElement('canvas'); c.width = made.width; c.height = made.height; c.getContext('2d').drawImage(made, 0, 0); return c; }
  // the piece's own picture, cropped to what's painted
  const art = PIECES[id].art(0), d = art.getContext('2d').getImageData(0, 0, art.width, art.height).data;
  let x0 = art.width, y0 = art.height, x1 = 0, y1 = 0;
  for (let y = 0; y < art.height; y++) for (let x = 0; x < art.width; x++) if (d[(y * art.width + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const c = document.createElement('canvas');
  c.width = Math.max(1, x1 - x0 + 1); c.height = Math.max(1, y1 - y0 + 1);
  c.getContext('2d').drawImage(art, -x0, -y0);
  icons.set(id, c);
  return icon(id);
}

function tray(tab) {
  const list = document.getElementById('sb-list');
  list.replaceChildren();
  document.querySelectorAll('.sb-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const add = (label, art, on, pick) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sb-item' + (on ? ' on' : '');
    b.append(art, Object.assign(document.createElement('span'), { textContent: label }));
    b.addEventListener('click', pick);
    list.append(b);
  };
  if (tab === 'furniture') for (const id of KINDS.filter(id => spare(base, id) > 0)) add(PIECES[id].name, icon(id), holding?.id === id && !holding.back, () => {
    if (holding?.back) cancelHold();
    holding = holding?.id === id ? null : { id, dir: 0 }; sel = -1; ghost = null;
    refresh(); tray(tab);
  });
  const swatch = (list2, key) => list2.forEach(s => {
    const sw = document.createElement('span');
    sw.className = 'sb-swatch';
    sw.style.background = `repeating-linear-gradient(90deg, ${s.a} 0 6px, ${s.b} 6px 10px)`;
    add(s.name, sw, base[key] === s.id, () => { base[key] = s.id; save(); refresh(); tray(tab); });
  });
  if (tab === 'wall') swatch(WALLPAPERS, 'wall');
  if (tab === 'floor') swatch(FLOORS, 'floor');
}

function refresh() {
  paint();
  const bar = document.getElementById('sb-actions');
  bar.hidden = sel < 0 && !holding;
  bar.querySelectorAll('[data-act]').forEach(b => {
    const a = b.dataset.act, wall = sel >= 0 && PIECES[base.items[sel].id].layer === 'wall';
    b.hidden = holding ? a !== 'cancel' : a === 'cancel' || (a === 'rotate' && wall);
  });
  hint.textContent = holding ? `Tap where the ${PIECES[holding.id].name.toLowerCase()} goes.`
    : sel >= 0 ? PIECES[base.items[sel].id].name
    : 'Pick a piece below, then tap a spot in the room. Tap a piece in the room to rotate, move or store it.';
}

export function openBase() {
  base = loadBase();
  const root = document.createElement('section');
  root.className = 'secret-base';
  root.innerHTML = `
    <header class="sb-top"><h2>Secret Base</h2><button type="button" class="sb-close" aria-label="Leave">✕</button></header>
    <div class="sb-room"><canvas class="pixel" width="${W}" height="${H}"></canvas></div>
    <p class="sb-hint"></p>
    <div class="sb-actions" id="sb-actions" hidden>
      <button type="button" data-act="rotate">Rotate</button><button type="button" data-act="move">Move</button>
      <button type="button" data-act="store">Store</button><button type="button" data-act="done">Done</button>
      <button type="button" data-act="cancel">Cancel</button>
    </div>
    <nav class="sb-tabs">
      <button type="button" class="sb-tab" data-tab="furniture">Furniture</button>
      <button type="button" class="sb-tab" data-tab="wall">Wallpaper</button>
      <button type="button" class="sb-tab" data-tab="floor">Floor</button>
    </nav>
    <div class="sb-list" id="sb-list"></div>`;
  document.body.append(root);
  canvas = root.querySelector('canvas');
  hint = root.querySelector('.sb-hint');
  canvas.addEventListener('click', onTap);
  canvas.addEventListener('pointermove', onMove);
  root.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => b.dataset.act === 'cancel' ? cancelHold() || tray('furniture') : act(b.dataset.act)));
  root.querySelectorAll('.sb-tab').forEach(b => b.addEventListener('click', () => tray(b.dataset.tab)));
  root.querySelector('.sb-close').addEventListener('click', () => { location.href = location.pathname; });
  tray('furniture');
  refresh();
}
