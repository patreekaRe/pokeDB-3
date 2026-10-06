/* ============================================================
   safari-lobby.js  -  the Safari Zone lobby's backdrop (js/safariprep.js),
   the Sky Pillar lobby's twin: on one low-res canvas, the Zone's gate on
   its fenced meadow, a trail winding off to the far mountains, lit for the
   player's time of day (js/daytime.js); clouds, swaying grass, butterflies
   by day and fireflies by night.
   ============================================================ */

import { makeBuffer, flush, put, K, mix, bay, hash } from './tower-art.js';
import { timeOfDay, GRADES, gradeHex } from './daytime.js';

const SKY = {   // top, middle, horizon
  dawn: ['#283868', '#a07898', '#f8c098'],
  day: ['#4888e0', '#78b4f0', '#c0e4f8'],
  dusk: ['#282050', '#a04868', '#f89048'],
  night: ['#060a20', '#101a40', '#26365e'],
};

let sky = null;

export function stopGate() {
  if (sky?.timer) clearInterval(sky.timer);
  if (sky) sky.timer = 0;
}

/** Paint (and animate) the backdrop on `canvas` over `page`: `ground` is the grass line's CSS y, `top` the lowest CSS y
    the title takes, both from the page's top. Returns the grass line, snapped to whole pixels. */
export function startGate(canvas, page, ground, top) {
  stopGate();
  const PX = innerWidth <= 720 ? 3 : 4;
  const G = Math.round(ground / PX);
  const W = Math.ceil(page.clientWidth / PX), H = Math.ceil(page.clientHeight / PX);
  if (!W || !H) return G * PX;   // not laid out yet: the lobby's ResizeObserver paints it once it is
  canvas.style.width = `${W * PX}px`;
  canvas.style.height = `${H * PX}px`;
  sky = build(makeBuffer(canvas, W, H), G, Math.round(top / PX), timeOfDay());
  let t = 0;
  paint(sky, t);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) sky.timer = setInterval(() => paint(sky, ++t), 100);
  return G * PX;
}

function build(b, G, T, time) {
  const { W, H, px } = b;
  const L = (h) => K(time === 'day' ? h : gradeHex(h, GRADES[time].land));
  const night = time === 'night';
  const cx = Math.floor(W / 2);
  const Hz = G - Math.max(12, Math.round((G - T) * 0.32));   // the horizon, where the meadow meets the mountains

  // the sky, two dithered blends
  const [s0, s1, s2] = SKY[time];
  for (let y = 0; y < G; y++) {
    const f = Math.min(1, y / Math.max(1, Hz)) * 2, seg = f < 1 ? 0 : 1, m = f - seg;
    const a = K(seg ? s1 : s0), c = K(seg ? s2 : s1);
    for (let x = 0; x < W; x++) px[y * W + x] = m > bay(x, y) ? c : a;
  }
  // the sun, low at dawn and dusk; at night the moon
  const sun = time === 'day' ? [Math.round(W * 0.8), T + 10, 5, '#f8e878', '#f8f8c0']
    : time === 'night' ? [Math.round(W * 0.78), T + 10, 4, '#e8e8d0', '#ffffff']
    : [Math.round(W * (time === 'dawn' ? 0.22 : 0.78)), Hz - 9, 6, time === 'dawn' ? '#f8d090' : '#f87838', '#f8e0a0'];
  const [sx, sy, sr, sc, sh] = sun;
  for (let dy = -sr - 4; dy <= sr + 4; dy++) for (let dx = -sr - 4; dx <= sr + 4; dx++) {
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d <= sr) put(b, sx + dx, sy + dy, K(night && dx > 1 && d > sr - 2.2 ? '#b8b8a0' : d < sr * 0.45 && dx < 0 && dy < 0 ? sh : sc));
    else if (!night && d <= sr + 4 && bay(sx + dx, sy + dy) < (sr + 4 - d) / 8) put(b, sx + dx, sy + dy, K(mix(sc, s1, 0.5)));
  }

  // the far mountains, snow on the peaks
  const MT = ['#8ca0c4', '#7488b0', '#f0f4f8'].map(L);
  for (let x = 0; x < W; x++) {
    const h = Math.round(6 + 5 * Math.sin(x * 0.09 + 1.3) + 4 * Math.sin(x * 0.23) + 2 * hash(x * 0.7));
    for (let y = Hz - h; y < Hz; y++) put(b, x, y, (y < Hz - h + 2 && h > 11) ? MT[2] : (x + y) % 9 < 4 && y > Hz - h + 3 ? MT[1] : MT[0]);
  }
  // the meadow, paler far off; a treeline along the horizon
  for (let y = Hz; y < G; y++) {
    const t = (y - Hz) / Math.max(1, G - Hz);
    const c0 = L(mix('#a8d880', '#6cbc4c', t)), c1 = L(mix('#98cc70', '#5ab044', t));
    for (let x = 0; x < W; x++) px[y * W + x] = bay(x, y) < 0.5 ? c0 : c1;
  }
  const TREE = ['#4e9a40', '#3a7c34', '#2a5e2a'].map(L);
  for (let i = 0; i < W / 9; i++) {
    const x0 = Math.floor(hash(i * 4.7) * W), r = 2 + Math.floor(hash(i * 2.3) * 3);
    if (Math.abs(x0 - cx) < 8) continue;
    for (let dy = -r; dy <= 1; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + 1) put(b, x0 + dx, Hz + dy - 1, TREE[dx < -r / 3 && dy < 0 ? 0 : dx > r / 3 ? 2 : 1]);
  }

  // the trail: from the gate off to the horizon, winding as it goes
  const gw = Math.max(36, Math.min(48, Math.round(W * 0.3)));   // the gate's opening
  const DIRT = ['#e0c488', '#c8a468', '#a08048'].map(L);
  const pathAt = (y) => {
    const t = (y - Hz) / Math.max(1, G - Hz);
    return [cx + Math.round(Math.sin((1 - t) * 4.2) * (1 - t) * W * 0.12), Math.max(0.6, t * t * gw * 0.32 + t * 3)];
  };
  for (let y = Hz; y < G + 6 && y < H; y++) {
    const [pc, hw] = y < G ? pathAt(y) : [cx, gw * 0.32 + 3 + (y - G)];
    for (let x = Math.round(pc - hw); x <= Math.round(pc + hw); x++) {
      const e = hw >= 2.5 && Math.abs(x - pc) > hw - 1;
      if (y >= G + 3 && bay(x, y) < (y - G - 2) / 4) continue;
      put(b, x, y, e ? DIRT[2] : hash(x * 3.1 + y * 7.3) < 0.08 ? DIRT[1] : DIRT[0]);
    }
  }

  // the fence along the meadow's edge, either side of the gate
  const WOOD = ['#d09a5c', '#a87040', '#6a4020'].map(L);
  const gl = cx - gw / 2 - 3, gr = cx + gw / 2 + 3;
  const fy = G - 1;
  for (let x = 0; x < W; x++) {
    if (x > gl - 2 && x < gr + 2) continue;
    put(b, x, fy - 8, WOOD[0]); put(b, x, fy - 7, WOOD[1]);
    put(b, x, fy - 4, WOOD[0]); put(b, x, fy - 3, WOOD[1]);
    if (((x - cx) % 9 + 9) % 9 === 0) for (let y = fy - 10; y <= fy; y++) { put(b, x, y, WOOD[1]); put(b, x + 1, y, WOOD[2]); if (y === fy - 10) { put(b, x, y, WOOD[0]); } }
  }

  // the gate: two log posts, a green board with a Safari Ball, a thatched roof over it
  const gh = Math.max(34, Math.min(50, G - T - 18));
  const POST = WOOD;
  for (const px0 of [Math.round(gl) - 2, Math.round(gr) - 2]) {
    for (let y = G - gh; y <= G; y++) for (let k = 0; k < 5; k++) put(b, px0 + k, y, POST[k === 0 ? 0 : k === 4 ? 2 : (y % 6 === 0 ? 2 : 1)]);
  }
  const by = G - gh - 2, bh = 10, bx0 = Math.round(gl) - 5, bx1 = Math.round(gr) + 5;
  const BOARD = ['#68c858', '#2e8a34', '#14501c'].map(L);
  for (let y = by; y < by + bh; y++) for (let x = bx0; x <= bx1; x++) {
    const edge = y === by || y === by + bh - 1 || x === bx0 || x === bx1;
    put(b, x, y, edge ? BOARD[2] : y === by + 1 ? BOARD[0] : BOARD[1]);
  }
  // the Safari Ball on the board
  const bcx = cx, bcy = by + Math.floor(bh / 2);
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    const d = dx * dx + dy * dy;
    if (d > 11) continue;
    let c = d > 7 ? '#202018' : dy < 0 ? ((dx + dy) % 3 === 0 ? '#3a7a28' : '#88c040') : dy === 0 ? '#202018' : '#f0ead0';
    if (Math.abs(dx) <= 1 && dy === 0) c = '#ffffff';
    put(b, bcx + dx, bcy + dy, K(time === 'day' ? c : gradeHex(c, GRADES[time].land)));
  }
  // little rivets on the board either side, standing in for letters too small to read
  for (const x of [bx0 + 3, bx1 - 3]) put(b, x, bcy, BOARD[0]);
  const ROOF = ['#e8b860', '#c08840', '#8a5a28'].map(L);
  for (let k = 0; k < 7; k++) {
    const y = by - 7 + k, hw = Math.round((bx1 - bx0) / 2 + 3) - (6 - k) * 2;
    for (let x = cx - hw; x <= cx + hw; x++) put(b, x, y, k === 6 ? ROOF[2] : (x + k) % 4 === 0 ? ROOF[2] : x < cx - hw / 3 ? ROOF[0] : ROOF[1]);
  }
  // lanterns on the posts once the light goes
  const lamps = time === 'day' ? [] : [[Math.round(gl), G - gh + 10], [Math.round(gr), G - gh + 10]];
  for (const [lx, ly] of lamps) for (let dy = -1; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) put(b, lx + dx, ly + dy, K(dy === -1 ? '#3a2410' : '#f8d070'));

  // the grass lip, then dark soil under the lobby's buttons
  const GRASS = ['#78c858', '#5ab048', '#3e9040'].map(L);
  for (let y = G; y < H; y++) {
    const k = y - G, a = K(mix('#24301e', '#0e140c', Math.min(1, k / 60))), c = K(mix('#24301e', '#0e140c', Math.min(1, (k + 6) / 60)));
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (k < 3 && px[i] !== DIRT[0] && px[i] !== DIRT[1] && px[i] !== DIRT[2]) px[i] = GRASS[k];
      else if (k >= 3 && !(k < 6 && (px[i] === DIRT[0] || px[i] === DIRT[1] || px[i] === DIRT[2]))) px[i] = bay(x, y) < 0.5 ? a : c;
    }
  }

  const tufts = [];
  for (let x = 1; x < W - 1; x += 2 + Math.floor(hash(x) * 3)) {
    if (x > gl - 6 && x < gr + 6) continue;
    tufts.push([x, 3 + Math.floor(hash(x * 1.7) * 5), hash(x * 5.1) * 6.28]);
  }
  const stars = [];
  if (night || time === 'dawn') {
    for (let i = 0; i < W * Hz / (night ? 40 : 160); i++) {
      const x = Math.floor(hash(i * 3.1) * W), y = Math.floor(hash(i * 7.7 + 1) * (Hz - 14));
      if (Math.hypot(x - sx, y - sy) > sr + 3) stars.push([x, y, hash(i + 0.5) * 40 | 0]);
    }
  }
  const clouds = Array.from({ length: Math.max(2, Math.round(W / 50)) }, (_, i) => ({
    x: hash(i * 5.3) * (W + 40), y: T + 4 + Math.round(hash(i * 2.7) * Math.max(4, Hz - T - 24)), r: 3 + Math.round(hash(i * 9.1) * 4), v: 0.08 + hash(i) * 0.1,
  }));
  const bugs = Array.from({ length: 3 + Math.round(W / 60) }, (_, i) => ({ x: hash(i * 8.3) * W, y: Hz + 3 + hash(i * 3.9) * (G - Hz - 6), ph: hash(i) * 50 }));
  const CLOUD = (time === 'day' ? ['#ffffff', '#e4ecf6', '#c0d0e4'] : night ? ['#3a4870', '#2e3a60', '#24304e']
    : ['#f8e0d0', '#e8b0a8', '#b07890']).map(K);
  return { b, base: px.slice(), G, Hz, time, tufts, stars, clouds, bugs, CLOUD, GRASS, timer: 0 };
}

const STAR = ['#ffffff', '#c8d8ff', '#6878a8'].map(K);

function paint(s, t) {
  const { b, base, G, Hz, time, tufts, stars, clouds, bugs, CLOUD, GRASS } = s, { W, px } = b;
  px.set(base);
  for (const [x, y, ph] of stars) {
    const tw = (t + ph) % 40;
    put(b, x, y, tw < 3 ? STAR[0] : tw < 22 ? STAR[1] : STAR[2]);
  }
  for (const c of clouds) {
    const x0 = ((c.x + t * c.v) % (W + 40)) - 20;
    for (let dy = -c.r; dy <= Math.ceil(c.r / 2); dy++) for (let dx = -c.r * 2; dx <= c.r * 2; dx++) {
      if ((dx * dx) / 4 + dy * dy * (dy < 0 ? 1 : 3) > c.r * c.r) continue;
      const x = Math.round(x0 + dx), y = c.y + dy;
      if (x < 0 || x >= W || y < 0 || y >= Hz - 12) continue;
      px[y * W + x] = dy < -c.r / 2 ? CLOUD[0] : dy < c.r / 4 ? CLOUD[1] : CLOUD[2];
    }
  }
  // butterflies by day, fireflies after dark, over the meadow
  const day = time === 'day' || time === 'dawn';
  for (const [i, f] of bugs.entries()) {
    const x = Math.round(f.x + Math.sin((t + f.ph) * 0.05) * 14), y = Math.round(f.y + Math.sin((t + f.ph) * 0.13) * 2);
    if (day) {
      const flap = (t + i) % 4 < 2, c = K(i % 2 ? '#ffffff' : '#f8e070');
      put(b, x, y, c);
      if (flap) { put(b, x - 1, y - 1, c); put(b, x + 1, y - 1, c); } else { put(b, x - 1, y, c); put(b, x + 1, y, c); }
    } else if ((t + f.ph) % 30 < 18) {
      put(b, x, y, K('#e8f878'));
      if ((t + f.ph) % 30 < 8) { put(b, x - 1, y, K('#88a840')); put(b, x + 1, y, K('#88a840')); }
    }
  }
  // the tall grass along the fence, swaying
  for (const [x, h, ph] of tufts) {
    const lean = Math.round(Math.sin(t * 0.18 + ph) * 1.2);
    for (let k = 0; k < h; k++) {
      const dx = k > h / 2 ? lean : 0, c = GRASS[k > h - 2 ? 0 : k > h / 2 ? 1 : 2];
      put(b, x + dx, G + 1 - k, c);
      if (k < h - 2) put(b, x + 1, G + 1 - k, GRASS[2]);
    }
  }
  flush(b);
}
