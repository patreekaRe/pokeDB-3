/* secret-base.js  -  the Secret Base (roadmap idea, part a's first pass): a room of your own, its furniture painted in
   code like the biomes' landmarks, placed on a tile grid with taps (no dragging, for phones). A tap on a piece in the
   tray then on the room places it; a tap on a placed piece gives Rotate / Move / Store. The layout is the save's
   `secretBase`. Only reached through ?base for now. */

import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { timeOfDay } from './daytime.js';

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
const box = (x, y, w, h, fill, edge) => { R(x, y, w, h, edge); R(x + 1, y + 1, w - 2, h - 2, fill); };

/* Flat pieces are painted top-down at their first facing and turned in 90° steps (exact for pixels); upright ones are
   painted per facing (front, side, back; the other side mirrored), standing up out of their tiles. */
const PIECES = {
  rug: { name: 'Round rug', w: 3, h: 2, layer: 'rug', flat(w, h) {
    R(2, 0, w - 4, h, '#b8443c'); R(0, 2, w, h - 4, '#b8443c');
    R(3, 2, w - 6, h - 4, '#e0b04a'); R(5, 4, w - 10, h - 8, '#b8443c');
    for (let x = 8; x < w - 8; x += 6) R(x, h / 2 - 1, 2, 2, '#f4e6c4');
  } },
  bed: { name: 'Bed', w: 2, h: 3, flat(w, h) {
    box(0, 0, w, h, '#a8723f', '#5a3a1e');
    R(0, 0, w, 6, '#6e4626');
    R(2, 6, w - 4, h - 8, '#f4f4f0');
    box(5, 8, w - 10, 7, '#ffffff', '#c8c8d0');
    R(2, 18, w - 4, h - 20, '#d0485a'); R(2, 18, w - 4, 2, '#f07888');
    for (let y = 24; y < h - 4; y += 6) R(4, y, w - 8, 1, '#a83448');
  } },
  table: { name: 'Table', w: 2, h: 2, flat(w, h) {
    box(1, 1, w - 2, h - 2, '#c48a52', '#5a3a1e');
    R(3, 3, w - 6, h - 6, '#f4f4f0');
    for (let i = 3; i < w - 3; i += 4) { R(i, 3, 2, 2, '#d0485a'); R(i, h - 5, 2, 2, '#d0485a'); }
    box(w / 2 - 3, h / 2 - 3, 6, 6, '#7ac8e8', '#3a7aa0');
  } },
  cushion: { name: 'Poké Ball cushion', w: 1, h: 1, flat() {
    R(3, 1, 10, 14, '#202028'); R(1, 3, 14, 10, '#202028');
    R(4, 2, 8, 6, '#e04848'); R(2, 4, 12, 4, '#e04848');
    R(4, 8, 8, 6, '#f4f4f0'); R(2, 8, 12, 4, '#f4f4f0');
    R(2, 7, 12, 2, '#202028'); box(6, 6, 4, 4, '#f4f4f0', '#202028');
  } },
  chair: { name: 'Chair', w: 1, h: 1, upright(x, y, dir) {
    const legs = () => { R(x + 3, y + 12, 2, 4, '#5a3a1e'); R(x + 11, y + 12, 2, 4, '#5a3a1e'); };
    const back = { 0: [x + 3, y - 8, 10, 12], 2: [x + 3, y + 2, 10, 12], 1: [x + 11, y - 6, 3, 16], 3: [x + 2, y - 6, 3, 16] }[dir];
    if (dir !== 2) box(...back, '#a8723f', '#5a3a1e');
    legs();
    box(x + 2, y + 4, 12, 9, '#c48a52', '#5a3a1e');
    R(x + 3, y + 5, 10, 2, '#e0b04a');
    if (dir === 2) box(...back, '#a8723f', '#5a3a1e');
  } },
  plant: { name: 'Potted plant', w: 1, h: 1, upright(x, y) {
    box(x + 4, y + 7, 8, 8, '#c86a3a', '#6a2e14'); R(x + 4, y + 7, 8, 2, '#e08a50');
    const leaf = '#4f9a42', lit = '#7cc860';
    box(x + 1, y - 4, 7, 9, leaf, '#24502a'); box(x + 8, y - 6, 7, 9, leaf, '#24502a'); box(x + 4, y - 11, 8, 10, leaf, '#24502a');
    R(x + 6, y - 9, 2, 3, lit); R(x + 10, y - 4, 2, 3, lit); R(x + 3, y - 2, 2, 3, lit);
  } },
  lamp: { name: 'Lamp', w: 1, h: 1, upright(x, y) {
    box(x + 4, y + 11, 8, 4, '#5a5a68', '#2a2a34');
    R(x + 7, y - 2, 2, 13, '#3a3a44');
    box(x + 2, y - 12, 12, 10, '#f4dc88', '#a8823a'); R(x + 3, y - 11, 10, 2, '#fff4c0');
  } },
  shelf: { name: 'Bookshelf', w: 2, h: 1, upright(x, y, dir) {
    if (dir % 2) {   // seen from the side: a tall narrow box, its open face towards where it faces
      box(x + 2, y - 22, 12, 52, '#a8723f', '#5a3a1e');
      R(dir === 1 ? x + 3 : x + 11, y - 21, 2, 50, '#6e4626');
      return;
    }
    box(x, y - 22, 32, 36, '#a8723f', '#5a3a1e');
    if (dir === 2) { for (let i = 0; i < 3; i++) R(x + 2, y - 14 + i * 10, 28, 1, '#8a5a30'); return; }
    const books = ['#d0485a', '#4a7ac8', '#e0b04a', '#4f9a42', '#8a5ab8', '#f4f4f0'];
    for (let row = 0; row < 3; row++) {
      const top = y - 20 + row * 11;
      R(x + 2, top, 28, 10, '#4a2e16');
      let bx = x + 3;
      for (let i = 0; bx < x + 28; i++) { const bw = 2 + ((row * 3 + i) % 3); R(bx, top + 2 + (i % 2), bw, 8 - (i % 2), books[(row + i) % books.length]); bx += bw + 1; }
      R(x + 1, top + 10, 30, 1, '#5a3a1e');
    }
  } },
  tv: { name: 'TV', w: 2, h: 1, upright(x, y, dir) {
    if (dir % 2) {
      R(x + 6, y + 8, 4, 8, '#3a3a44');
      box(x + 3, y - 10, 10, 30, '#5a5a68', '#202028');
      R(dir === 1 ? x + 3 : x + 11, y - 9, 2, 28, '#2a3a5a');
      return;
    }
    R(x + 13, y + 8, 6, 6, '#3a3a44'); R(x + 9, y + 13, 14, 2, '#3a3a44');
    box(x + 1, y - 12, 30, 22, '#5a5a68', '#202028');
    if (dir === 2) { for (let i = 0; i < 4; i++) R(x + 8, y - 6 + i * 3, 16, 1, '#3a3a44'); return; }
    R(x + 3, y - 10, 26, 16, '#2a4a8a'); R(x + 5, y - 8, 6, 2, '#a8d8f8'); R(x + 5, y - 6, 2, 3, '#a8d8f8');
    R(x + 24, y + 7, 2, 2, '#e04848');
  } },
  window: { name: 'Window', w: 2, h: 1, layer: 'wall', wall(x) {
    const sky = { dawn: '#f4b8a0', day: '#8cc8f4', dusk: '#e8885a', night: '#2a3a6a' }[timeOfDay()];
    box(x + 2, 8, 28, 28, sky, '#5a3a1e');
    R(x + 3, 26, 26, 9, timeOfDay() === 'night' ? '#1a2a4a' : '#6cbf58');
    R(x + 15, 9, 2, 26, '#a8723f'); R(x + 3, 21, 26, 2, '#a8723f');
    R(x + 1, 35, 30, 3, '#c48a52');
  } },
  poster: { name: 'Poster', w: 1, h: 1, layer: 'wall', wall(x) {
    box(x + 2, 10, 12, 18, '#f4f4f0', '#3a3a44');
    R(x + 4, 13, 8, 6, '#e0b04a'); R(x + 6, 15, 4, 2, '#202028'); R(x + 4, 21, 8, 1, '#3a3a44'); R(x + 4, 23, 6, 1, '#3a3a44');
  } },
  clock: { name: 'Clock', w: 1, h: 1, layer: 'wall', wall(x) {
    R(x + 4, 10, 8, 10, '#5a3a1e'); R(x + 2, 12, 12, 6, '#5a3a1e');
    R(x + 5, 11, 6, 8, '#f4f4f0'); R(x + 3, 13, 10, 4, '#f4f4f0');
    R(x + 7, 12, 2, 4, '#202028'); R(x + 8, 15, 3, 1, '#202028');
  } },
};

const freshBase = () => ({
  wall: 'cream', floor: 'wood',
  items: [{ id: 'window', x: 4 }, { id: 'rug', x: 4, y: 3, dir: 0 }, { id: 'bed', x: 0, y: 0, dir: 0 }, { id: 'plant', x: 10, y: 0, dir: 0 }],
});

const footprint = (it) => { const p = PIECES[it.id]; return it.dir % 2 ? [p.h, p.w] : [p.w, p.h]; };

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
  if (p.layer === 'wall') { p.wall(it.x * T); g.globalAlpha = 1; return; }
  const x = it.x * T, y = WALL + it.y * T, [fw, fh] = footprint(it);
  if (p.flat) {
    const off = new OffscreenCanvas(p.w * T, p.h * T), keep = g;
    g = off.getContext('2d');
    p.flat(p.w * T, p.h * T);
    g = keep;
    g.save();
    g.translate(x + fw * T / 2, y + fh * T / 2);
    g.rotate(it.dir * Math.PI / 2);
    g.drawImage(off, -p.w * T / 2, -p.h * T / 2);
    g.restore();
    if (p.layer !== 'rug') R(x + 1, y + fh * T - 2, fw * T - 2, 2, '#00000040');   // its side, so it stands off the floor
  } else {
    R(x + 2, y + fh * T - 3, fw * T - 4, 3, '#00000030');
    p.upright(x, y, it.dir);
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

function fits(it, skip = -1) {
  const p = PIECES[it.id], [fw, fh] = footprint(it);
  if (it.x < 0 || it.x + fw > COLS) return false;
  if (p.layer === 'wall') return base.items.every((o, i) => i === skip || PIECES[o.id].layer !== 'wall' || o.x + PIECES[o.id].w <= it.x || it.x + fw <= o.x);
  if (it.y < 0 || it.y + fh > ROWS) return false;
  const mine = new Set(cells(it)), rug = p.layer === 'rug';
  return base.items.every((o, i) => {
    if (i === skip || PIECES[o.id].layer === 'wall' || (PIECES[o.id].layer === 'rug') !== rug) return true;
    return !cells(o).some(c => mine.has(c));
  });
}

/** Where a tap lands: the piece's footprint centred on it, pulled inside the room. */
function aim(id, dir, lx, ly) {
  const p = PIECES[id], [fw, fh] = dir % 2 ? [p.h, p.w] : [p.w, p.h];
  const x = Math.max(0, Math.min(COLS - fw, Math.floor(lx / T - (fw - 1) / 2)));
  if (p.layer === 'wall') return { x };
  return { x, y: Math.max(0, Math.min(ROWS - fh, Math.floor((ly - WALL) / T - (fh - 1) / 2))) };
}

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
    if (sel >= 0) playSound('confirm');
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

function icon(id) {
  const p = PIECES[id], c = document.createElement('canvas');
  const it = p.layer === 'wall' ? { id, x: 0 } : { id, x: 0, y: 0, dir: 0 };
  const top = p.flat || p.layer === 'wall' ? 0 : 24;
  c.width = p.w * T; c.height = p.layer === 'wall' ? WALL : p.h * T + top;
  const keep = g;
  g = c.getContext('2d');
  g.translate(0, p.layer === 'wall' ? 0 : top - WALL);
  paintPiece(it);
  g = keep;
  return c;
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
  if (tab === 'furniture') for (const [id, p] of Object.entries(PIECES)) add(p.name, icon(id), holding?.id === id && !holding.back, () => {
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
  base = getSave().secretBase ?? freshBase();
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
