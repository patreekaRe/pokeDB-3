/*
 * The Sky Pillar's pixel art (roadmap item 18 b): the painters the tower's screen (js/tower.js), its guardian intros, the
 * fall and the battle arena (js/scene.js's `tower` backdrop) all share, so a floor looks the same everywhere.
 *
 * Everything paints into a buffer `{ W, H, px }` (px a Uint32Array of ABGR pixels, like every scene) in the tower's
 * world: FH pixels a floor, y up, floor 0 the lobby on the ground. A camera's `camY` is the world row at the screen's
 * bottom. The sky behind is a function of height (`skyRow()`): treetops round the foot, clouds about floor 10, the storm
 * about 20, a sunset over the cloud sea from 27, the aurora about 50, stars, then space, and at the very top the planet's
 * curve at dawn far below (the summit's win scene, `.hof-scene.summit`, is painted to match). Windows are holes: the
 * tower is painted over the sky and leaves them be, so every window shows the sky at its own height.
 */

export const FH = 56;      // a floor's height in pixels
export const SLAB = 5;     // its floor slab
export const TOP = 100;    // the summit (js/data/tower.js's TOP_FLOOR)
const WALL = 5;            // the tower's outer walls, cut away
const STAIR_W = 22;        // the spiral stair's well, at the right of every floor but the top

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
const band = (v, a, b, fade) => smooth((v - a) / fade) * smooth((b - v) / fade);   // 1 inside a..b, easing off over `fade`

const cache = new Map();
/** A hex colour as a pixel. */
export const K = (hex) => {
  let c = cache.get(hex);
  if (c === undefined) { const n = parseInt(hex.slice(1), 16); c = (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; cache.set(hex, c); }
  return c;
};
export function mix(a, b, t) {
  const n = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [n(a), n(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
/** Darken a hex towards night blue: the floors above you, not climbed yet. */
const dim = (h, k = 0.42) => mix(mix(h, '#0c1020', 1 - k), '#182448', 0.12);

export function makeBuffer(canvas, W, H) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  return { W, H, ctx, img, px: new Uint32Array(img.data.buffer) };
}
export const flush = (b) => b.ctx.putImageData(b.img, 0, 0);

export function put(b, x, y, c) {
  x |= 0; y |= 0;
  if (x >= 0 && y >= 0 && x < b.W && y < b.H) b.px[y * b.W + x] = c;
}
export function rect(b, x, y, w, h, c) {
  const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0), x1 = Math.min(b.W, (x + w) | 0), y1 = Math.min(b.H, (y + h) | 0);
  for (let yy = y0; yy < y1; yy++) b.px.fill(c, yy * b.W + x0, yy * b.W + Math.max(x0, x1));
}
export function disc(b, cx, cy, r, c, m = 1) {
  for (let y = Math.floor(-r); y <= r; y++) for (let x = Math.floor(-r); x <= r; x++) {
    if (x * x + y * y <= r * r + r * 0.6 && (m >= 1 || bay(cx + x, cy + y) < m)) put(b, cx + x, cy + y, c);
  }
}
/** A soft glow: dithered rings of `c` round a point, thinning out. */
export function glow(b, cx, cy, r, c, k = 0.5) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.sqrt(x * x + y * y) / r;
    if (d < 1 && bay(cx + x, cy + y) < (1 - d) * k) put(b, cx + x, cy + y, c);
  }
}
function line(b, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(b, Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c);
}

// a 3x5 pixel font for the floor numbers carved by each landing
const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
  '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111'];
export function digits(b, x, y, text, c, shade, s = 1) {
  for (const ch of String(text)) {
    const g = DIGITS[ch];
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') {
      const px = x + (i % 3) * s, py = y + Math.floor(i / 3) * s;
      if (shade) rect(b, px + 1, py + 1, s, s, shade);
      rect(b, px, py, s, s, c);
    }
    x += 4 * s;
  }
}

// a floor's number on an iron plaque by the outer wall, gold on black so it reads at a glance (the user found the carved
// one hard to see, 2026-10-08); the floors still to climb get a dimmer one
function floorPlaque(b, x, y, f, lit) {
  const w = String(f).length * 8 - 2 + 6, h = 10 + 6;
  rect(b, x, y, w, h, K(lit ? '#6a5428' : '#2e2a30'));
  rect(b, x + 1, y + 1, w - 2, h - 2, K(lit ? '#c8a048' : '#4a4652'));
  rect(b, x + 2, y + 2, w - 4, h - 4, K(lit ? '#1a140e' : '#121018'));
  digits(b, x + 3, y + 3, f, K(lit ? '#ffe890' : '#8a8494'), K(lit ? '#7a4a10' : '#000000'), 2);
}

/* ---------- the sky by height ---------- */

// the open sky's colour by floor: the day's blue, the cloud layer's haze, the storm, the sunset over the cloud sea, the
// aurora's night, then space
const SKY_STOPS = [[0, '#6cb4ec'], [4, '#8cc8f4'], [8, '#b4d8f0'], [12, '#a4b8d0'], [15, '#5c6884'], [20, '#363c56'], [25, '#444060'],
  [27, '#f4985c'], [30, '#e87070'], [34, '#a44c88'], [39, '#4a2e78'], [45, '#18204e'], [55, '#0a1636'], [70, '#060c24'], [85, '#030616'],
  [100, '#02030c'], [120, '#010208']];
const STEP = 8;   // sky table rows a floor
const LIMB = 100 + 30 / FH;   // the planet's curve, level with the summit's horizon
const SKY = (() => {
  const out = [];
  for (let i = 0; i <= 120 * STEP; i++) {
    const a = i / STEP;
    let k = SKY_STOPS.findIndex(([at]) => at > a);
    if (k < 1) k = SKY_STOPS.length - 1;
    const [a0, c0] = SKY_STOPS[k - 1], [a1, c1] = SKY_STOPS[k];
    out.push(mix(c0, c1, clamp01((a - a0) / (a1 - a0))));
  }
  return out;
})();
const SKY_PX = SKY.map(K);
export const skyHex = (alt) => SKY[Math.max(0, Math.min(SKY.length - 1, Math.round(alt * STEP)))];

const CLOUD = ['#ffffff', '#eef4fa', '#d0dcec', '#a8b8d0'];
const STORM = ['#4c546c', '#3a4058', '#2a2e42', '#1c1e2e'];
const SEA = ['#ffd8b0', '#f8a888', '#c87890', '#7a4c78', '#3e2c58'];   // the cloud sea's tops in the sunset, lit to shadow
const AURORA = ['#7cf8b0', '#40e0a0', '#30b8a8', '#4878c8', '#8858c8'];
const TREE = ['#5ab048', '#3e9040', '#2a7034', '#1a5026'];
const TREE_FAR = ['#6a9ab0', '#5a889c'];

/**
 * Paint the open sky over the whole buffer for a camera at world row `camY`, `t` frames in; `ox` slides it sideways
 * (the battle arena's windows). `flash` (0-1) is the storm's lightning.
 */
export function paintSky(b, camY, t, { ox = 0, flash = 0 } = {}) {
  const { W, H, px } = b;
  for (let sy = 0; sy < H; sy++) {
    const wy = camY + H - 1 - sy, f = wy / FH * STEP;
    const i = Math.max(0, Math.min(SKY_PX.length - 2, Math.floor(f))), m = f - i;
    const c0 = SKY_PX[i], c1 = SKY_PX[i + 1], row = sy * W;
    for (let x = 0; x < W; x++) px[row + x] = m > bay(x, sy) ? c1 : c0;
  }
  const top = camY + H, bottom = camY;
  const seen = (a0, a1) => top > a0 * FH && bottom < a1 * FH;
  if (seen(36, 130)) stars(b, camY, t, ox);
  if (seen(40, 66)) aurora(b, camY, t, ox);
  if (seen(84, 100)) nebula(b, camY, ox);
  if (seen(LIMB - 3.2, LIMB + 0.4)) limb(b, camY, t, ox);
  if (seen(26, 40)) sunset(b, camY, t, ox);
  if (seen(13, 29)) storm(b, camY, t, ox, flash);
  if (seen(4, 15)) clouds(b, camY, t, ox);
  if (bottom < 2.2 * FH) ground(b, camY, ox);
}

const sy = (b, camY, wy) => b.H - 1 - (wy - camY);

function stars(b, camY, t, ox) {
  const { W, H } = b;
  for (let s = 0; s < H; s++) {
    const wy = camY + H - 1 - s, alt = wy / FH;
    const dens = clamp01((alt - 36) / 40) * 0.007 + clamp01((alt - 80) / 20) * 0.006;
    if (dens <= 0) continue;
    for (let x = 0; x < W; x++) {
      const h = hash((x + ox) * 7.13 + wy * 131.7);
      if (h < dens) {
        const tw = Math.sin(t / 7 + h * 900);
        put(b, x, s, K(tw > 0.7 ? '#ffffff' : h < dens * 0.3 ? '#fff0c0' : tw < -0.6 ? '#7080b0' : '#c8d4ff'));
      }
    }
  }
}

function aurora(b, camY, t, ox) {
  const { W, H } = b;
  for (const [base, amp, speed, hue] of [[47.5, 1.1, 1, 0], [55, 0.9, -0.7, 1]]) {
    for (let x = 0; x < W; x++) {
      const X = x + ox;
      const edge = (base + amp * Math.sin(X / 23 + t * speed / 45) + 0.4 * Math.sin(X / 7.7 - t * speed / 21)) * FH;
      const shim = 0.55 + 0.45 * Math.sin(X / 4.3 + t / 9 + hue * 2);
      for (let k = 0; k < FH * 1.3; k++) {
        const s = sy(b, camY, edge + k);
        if (s < 0) break;
        if (s >= H) continue;
        const d = k / (FH * 1.3), m = (1 - d) ** 1.6 * shim * (k < 2 ? 1 : 0.8);
        if (m > bay(x, s) + 0.08) put(b, x, s, K(AURORA[Math.min(4, Math.floor(d * 4.6) + hue)]));
      }
    }
  }
}

function nebula(b, camY, ox) {
  const { W, H } = b;
  for (let s = 0; s < H; s++) {
    const alt = (camY + H - 1 - s) / FH;
    const m0 = band(alt, 86, 95, 3);
    if (m0 <= 0) continue;
    for (let x = 0; x < W; x++) {
      const X = x + ox, v = Math.sin(X / 17 + alt * 1.3) + Math.sin(X / 9 - alt * 2.1) * 0.6;
      const m = m0 * clamp01(v * 0.45 + 0.1);
      if (m > bay(x, s) + 0.15) put(b, x, s, K(m > 0.5 ? '#5a3a8a' : '#2e2458'));
    }
  }
  const my = sy(b, camY, 91.5 * FH), mx = W * 0.22 - ox * 0.2;   // a pale moon off to the left
  disc(b, mx, my, 7, K('#e8e4f4'));
  disc(b, mx + 3, my - 1, 5.5, K('#c8c4dc'), 0.5);
  disc(b, mx - 2, my + 2, 1.5, K('#b0acc8'));
}

/** The planet's curve far below the summit, dawn breaking along it: the summit scene's horizon. */
function limb(b, camY, t, ox) {
  const { W, H } = b;
  const cy = LIMB * FH, cx = W / 2 - ox * 0.5;
  for (let x = 0; x < W; x++) {
    const dx = (x - cx) / Math.max(W, 120);
    const edge = cy - dx * dx * 60;
    for (let k = -14; k < FH * 3; k++) {
      const s = sy(b, camY, edge - k);
      if (s < 0 || s >= H) continue;
      let c;
      if (k < 0) c = k > -3 ? '#5ad8f8' : k > -6 ? '#2a6ab8' : k > -10 ? '#1a3070' : null;   // the thin blue air above it
      else if (k < 2) c = '#fff4c8';
      else if (k < 4) c = Math.abs(dx) < 0.25 ? '#ffd890' : '#f8a860';
      else if (k < 22) c = (Math.sin((x + ox) / 5 + k / 3) > 0.4 && k < 14) ? '#3c3c78' : k < 9 ? '#e88a70' : '#22285a';   // the cloud sea, dawn on its tops
      else c = k < 40 && bay(x, s) < (40 - k) / 18 ? '#22285a' : '#12163a';   // the night side, far below
      if (k < -6 && bay(x, s) > 0.5) continue;
      if (c) put(b, x, s, K(c));
    }
  }
  const sun = sy(b, camY, cy + 2);   // the sun just breaking the curve
  glow(b, cx + W * 0.18, sun, 12, K('#fff0b0'), 0.6);
  disc(b, cx + W * 0.18, sun + 1, 3, K('#ffffff'));
}

function sunset(b, camY, t, ox) {
  const { W, H } = b;
  const sx = W * 0.78 - ox * 0.3, syy = sy(b, camY, 30.4 * FH);
  glow(b, sx, syy, 22, K('#f8c870'), 0.55);
  disc(b, sx, syy, 7, K('#fff0b0'));
  disc(b, sx, syy, 5, K('#ffffff'));
  for (let i = 0; i < 6; i++) {   // long thin clouds lit pink from below
    const y = (28.2 + i * 1.6) * FH, x0 = ((hash(i * 3.1) * W * 2 + t * (0.05 + i * 0.01)) % (W + 60)) - 40 - ox, w = 18 + hash(i) * 30;
    const s = sy(b, camY, y);
    rect(b, x0, s, w, 1, K(i % 2 ? '#f8b0a0' : '#e8889a'));
    rect(b, x0 + 4, s + 1, w - 10, 1, K('#a85888'));
  }
  // the cloud sea's lumpy top: the storm seen from above
  for (let x = 0; x < W; x++) {
    const X = x + ox, top = 27 * FH + 3 * Math.sin(X / 11 + t / 80) + 2 * Math.sin(X / 4.7) + 4 * Math.sin(X / 29);
    for (let k = 0; k < FH * 2; k++) {
      const s = sy(b, camY, top - k);
      if (s < 0) continue;
      if (s >= H) break;
      put(b, x, s, K(SEA[k < 1 ? 0 : k < 3 ? 1 : k < 8 ? 2 : k < 20 ? 3 : 4]));
    }
  }
}

function storm(b, camY, t, ox, flash) {
  const { W, H } = b;
  for (let s = 0; s < H; s++) {   // the storm's dark masses, churning
    const wy = camY + H - 1 - s, alt = wy / FH, m0 = band(alt, 14.5, 26.5, 1.6);
    if (m0 <= 0) continue;
    for (let x = 0; x < W; x++) {
      const X = x + ox;
      const v = Math.sin(X / 13 + alt * 2.2 + t / 60) + Math.sin(X / 6.1 - alt * 3.7 - t / 40) * 0.5 + Math.sin(alt * 1.4 + X / 31);
      const m = m0 * clamp01(0.45 + v * 0.3);
      if (m > bay(x, s)) put(b, x, s, K(STORM[m > 0.85 ? 3 : m > 0.65 ? 2 : m > 0.45 ? 1 : 0]));
    }
  }
  if (flash > 0) {   // lightning: the clouds light up, and a bolt forks down
    const f = K(flash > 0.6 ? '#e8f0ff' : '#a8b4d8');
    for (let s = 0; s < H; s++) {
      const alt = (camY + H - 1 - s) / FH;
      if (alt < 15 || alt > 26) continue;
      for (let x = 0; x < W; x++) if (bay(x, s) < flash * 0.5) put(b, x, s, f);
    }
  }
  const bolt = Math.floor(t / 70);
  if (t % 70 < 4) {
    let x = hash(bolt * 9.7) * W, y = 25 * FH - hash(bolt) * 2 * FH;
    const end = y - (2 + hash(bolt * 3) * 3) * FH;
    while (y > end) {
      const nx = x + (hash(x * 3 + y) - 0.5) * 8, ny = y - 4 - hash(y) * 5;
      line(b, x, sy(b, camY, y), nx, sy(b, camY, ny), K('#ffffff'));
      x = nx; y = ny;
    }
  }
  for (let i = 0; i < W * 3; i++) {   // rain, slanting
    const wy = (16 + hash(i * 1.7) * 10) * FH - ((t * 4 + i * 37) % FH);
    const s = sy(b, camY, wy);
    if (s < 0 || s >= H) continue;
    const x = (hash(i * 5.3) * (W + 20) + t * 1.6 + ox) % (W + 20) - 10;
    put(b, x, s, K('#8a98b8'));
    put(b, x - 1, s - 1, K('#6a7898'));
  }
}

function cloud(b, x, y, w) {
  for (let k = 0; k < 4; k++) {
    const r = w * [0.22, 0.3, 0.26, 0.18][k], cx = x + w * [0.2, 0.42, 0.66, 0.85][k];
    disc(b, cx, y - r * 0.5, r + 1, K(CLOUD[3]));
    disc(b, cx, y - r * 0.6, r, K(CLOUD[2]));
    disc(b, cx - 1, y - r * 0.8, r * 0.8, K(CLOUD[1]));
    disc(b, cx - 2, y - r, r * 0.45, K(CLOUD[0]));
  }
  rect(b, x + w * 0.1, y - 1, w * 0.85, 2, K(CLOUD[3]));
}

function clouds(b, camY, t, ox) {
  const { W } = b;
  for (let i = 0; i < 26; i++) {
    const alt = 5 + hash(i * 2.3) * 9, w = 14 + hash(i * 4.1) * 22, speed = 0.04 + hash(i) * 0.08;
    const x = ((hash(i * 7.9) * (W + 80) + t * speed - ox) % (W + 80) + W + 80) % (W + 80) - 40;
    cloud(b, x, sy(b, camY, alt * FH), w);
  }
}

/** The ground round the tower's foot: far hills, then a forest whose treetops the first floors look out over. */
function ground(b, camY, ox) {
  const { W, H } = b;
  for (let x = 0; x < W; x++) {   // far hills
    const X = x + ox, top = 22 + 6 * Math.sin(X / 19) + 3 * Math.sin(X / 7);
    for (let wy = 0; wy < top; wy++) put(b, x, sy(b, camY, wy), K(TREE_FAR[wy > top - 2 ? 0 : 1]));
  }
  for (let layer = 0; layer < 2; layer++) {
    for (let i = -2; i < W / 7 + 2; i++) {
      const X = i * 7 + (layer ? 3 : 0) - (ox % 7), id = Math.floor(i + ox / 7) * 2 + layer;
      const top = (layer ? 26 : 44) + hash(id * 1.9) * (layer ? 26 : 40), r = 5 + hash(id * 3.7) * 4;
      const cols = layer ? TREE : TREE.map(c => mix(c, '#3a6a70', 0.35));
      rect(b, X - 1, sy(b, camY, top - r * 1.6), 2, top, K(layer ? '#5a4030' : '#4a5048'));
      disc(b, X, sy(b, camY, top - r), r + 1, K(cols[3]));
      disc(b, X, sy(b, camY, top - r), r, K(cols[2]));
      disc(b, X - 1, sy(b, camY, top - r + 1.5), r * 0.7, K(cols[1]));
      disc(b, X - 2, sy(b, camY, top - r + 2.5), r * 0.35, K(cols[0]));
    }
  }
  for (let wy = -60; wy < 6; wy++) {   // the grass and the earth under it
    const s = sy(b, camY, wy);
    if (s < 0 || s >= H) continue;
    rect(b, 0, s, W, 1, K(wy > 3 ? '#68b848' : wy > 0 ? '#4e9a3c' : wy > -3 ? '#6a4a30' : wy > -20 ? '#4e3624' : '#3a281a'));
  }
}

/* ---------- the tower ---------- */

// the Clearing's tower's sage stone (js/hub-pillar.js's STONES) all the way up, mossy at the foot, cooler as the sky
// darkens, veined with jade at the summit (the user's ask, 2026-10-15: the climb to match the new 3D tower)
const TIERS = [
  { at: 0, wall: ['#b4baa4', '#a4aa94', '#949a84', '#6c7262'], cut: ['#dadecb', '#c3c8b6', '#8e947e'], moss: '#5a8a3e' },
  { at: 10, wall: ['#bcc2ae', '#acb29e', '#9ca28e', '#727866'], cut: ['#e2e6d4', '#cbd0be', '#949a84'], moss: '#76a84c' },
  { at: 30, wall: ['#b0b8aa', '#a0a89a', '#90988a', '#666e62'], cut: ['#d8dece', '#bec6b6', '#868e80'], moss: '#5a8a6a' },
  { at: 60, wall: ['#b2bab4', '#a0a8a4', '#8e9894', '#626c6a'], cut: ['#dce4dc', '#c2cac4', '#88928c'], moss: '#4a9a7a' },
  { at: 90, wall: ['#a8c0b0', '#96b0a0', '#84a090', '#5a7666'], cut: ['#d4ecdc', '#b4d4c0', '#7a9a86'], moss: '#40b880' },
];
const tierOf = (f) => TIERS.reduce((t, x) => (f >= x.at ? x : t), TIERS[0]);
const LIT_CACHE = new Map();
/** A floor's colours, lit (climbed, or where you stand) or dim (still above you). */
export function stone(f, lit) {
  const tier = tierOf(f), key = `${tier.at}${lit}`;
  if (!LIT_CACHE.has(key)) {
    const d = (list) => list.map(h => K(lit ? h : dim(h)));
    LIT_CACHE.set(key, { wall: d(tier.wall), cut: d(tier.cut), moss: K(lit ? tier.moss : dim(tier.moss)),
      slab: d(['#dadecf', '#b4baa6', '#8a907c', '#585e50']), wood: d(['#9a6838', '#7a4e28', '#5a3418', '#3a200c']),
      rune: d(['#5a6254', '#3e4438', '#2e3428']), glyph: K(lit ? '#7ae0b8' : dim('#7ae0b8')), jade: d(['#9af0c4', '#3aae7c', '#16603e']),
      iron: d(['#6a6a78', '#3a3a46']), gold: d(['#fff0a0', '#f8c830', '#b07818']), dark: K(lit ? '#140e18' : '#080610'),
      glow: K(mix(tier.wall[0], '#f8b050', 0.45)) });
  }
  return LIT_CACHE.get(key);
}

export const DOOR_GEM = { fight: '#f87830', elite: '#e83848', event: '#a868f0', shop: '#40a0f8', rest: '#f86890', boss: '#f8d040' };
const SPILL = { fight: '#f8b070', elite: '#f85858', event: '#c898ff', shop: '#a0d8ff', rest: '#fff0f4', boss: '#fff0a0' };
export const BANNER = { 0: ['#3e9a48', '#2a6a34', '#f8e070'], 1: ['#c83830', '#8a2020', '#f8f0d0'], 2: ['#e87020', '#a04010', '#2a1810'],
  top: ['#2a9a5a', '#186838', '#f8d040'] };

/** The tower's layout on a buffer: its outer edges, the stair's well and the doors' room. */
export function towerLayout(W) {
  const TW = Math.min(W - 4, 184), L = Math.floor((W - TW) / 2), iL = L + WALL, iR = L + TW - WALL;
  const stair = iR - STAIR_W;
  return { TW, L, R: L + TW, iL, iR, stair, stairX: stair + STAIR_W / 2, doorL: iL + 3, doorR: stair - 3 };
}

/** Where a floor's doors stand: their centres, spread over the room left of the stair (one, a guardian's, in the middle). */
export function doorXs(lay, n) {
  const span = lay.doorR - lay.doorL;
  return Array.from({ length: n }, (_, k) => Math.round(lay.doorL + span * (k + 0.5) / n));
}

/**
 * Paint the tower over the sky. `floors(f)` says what each floor holds: `{ doors: [{ type, open, taken }], lit, guardian,
 * banner }` (null for a floor with nothing to show but its walls). `t` animates the torches.
 */
export function paintTower(b, camY, lay, floors, t, { crack = 0, hole = null } = {}) {
  const { H } = b;
  if (!b.sky || b.sky.length !== b.px.length) b.sky = new Uint32Array(b.px.length);
  b.sky.set(b.px);   // the sky as painted, for the windows to show through
  const f0 = Math.max(0, Math.floor(camY / FH) - 1), f1 = Math.min(TOP, Math.ceil((camY + H) / FH));
  for (let f = f0; f <= f1; f++) paintFloor(b, camY, lay, f, floors(f) || {}, t);
  // the outer walls' cut faces, then the summit's broken crown
  for (let f = f0; f <= f1; f++) outerWalls(b, camY, lay, f, floors(f)?.lit ?? false);
  if (camY < 30 * FH && camY + H > 4 * FH) floaters(b, camY, lay, floors, t);
  if (camY + H > (TOP + 1) * FH - 30) crown(b, camY, lay);
  if (crack > 0 && hole) floorCrack(b, camY, lay, hole, crack, t);
}

function paintFloor(b, camY, lay, f, info, t) {
  const lit = info.lit ?? false, S = stone(f, lit);
  const base = sy(b, camY, f * FH), wallTop = sy(b, camY, (f + 1) * FH - 1), surf = base - SLAB;   // surf: the row feet stand on
  const top = f === TOP;
  // the back wall: courses of blocks, every other one offset; the summit has only a low parapet, then the sky
  const wallFrom = top ? surf - 12 : wallTop;
  for (let s = Math.max(0, wallFrom); s <= Math.min(b.H - 1, surf); s++) {
    const r = surf - s, course = Math.floor(r / 5), off = course % 2 ? 5 : 0;
    for (let x = lay.iL; x < lay.iR; x++) {
      const mortar = r % 5 === 4 || (x + off) % 10 === 0;
      const v = hash(Math.floor((x + off) / 10) * 13.1 + course * 7.7 + f * 3.3);
      let c = mortar ? S.wall[3] : v > 0.8 ? S.wall[0] : v > 0.3 ? S.wall[1] : S.wall[2];
      if (!mortar && r % 5 === 3 && bay(x, s) < 0.5) c = S.wall[0];
      if (!mortar && v > 0.9 && hash(x * 1.3 + s) > 0.6) c = S.moss;
      put(b, x, s, c);
    }
  }
  if (!top) runeBand(b, lay.iL, lay.iR, wallTop, S, lit || f === 0, t, f);
  if (f === 0) lobby(b, lay, surf, S, t);
  else if (top) summitHall(b, lay, surf, S, t, info);
  else if (info.guardian) guardianHall(b, lay, surf, S, t, info, lit);
  else roomWall(b, lay, surf, S, t, info, lit, f);
  if (!top && !info.noStair) stairWell(b, lay, surf, S, lit, f, t);
  // the floor slab, open over the stair of the floor below
  for (let k = 0; k < SLAB; k++) {
    const s = base - k;
    if (s < 0 || s >= b.H) continue;
    for (let x = lay.iL; x < lay.iR; x++) {
      if (f > 0 && !info.noStair && x >= lay.stair + 2 && x < lay.iR - 1) { if (k < SLAB - 1) put(b, x, s, S.wall[3]); continue; }   // the well up from the floor below
      put(b, x, s, k === SLAB - 1 ? S.slab[0] : k === SLAB - 2 ? S.slab[1] : k === 0 ? S.slab[3] : S.slab[2]);
    }
  }
  if (f > 0) floorPlaque(b, lay.iL + 1, surf - FH + SLAB + 2, f, lit);
}

/** A window: an arched hole in the wall (the sky shows through), its stone frame and a cross of lead. */
function windowHole(b, x, y, w, h, S, holes = true) {
  const r = Math.floor(w / 2);
  for (let yy = 0; yy < h; yy++) for (let xx = -1; xx <= w; xx++) {
    const dy = yy - r, dx = xx - (w - 1) / 2;
    const inArch = yy >= r || dx * dx + dy * dy <= r * r + 1;
    const frame = yy >= r ? (xx < 0 || xx >= w) : dx * dx + dy * dy > (r - 1) * (r - 1) + 1 && inArch;
    if (!inArch && !(xx < 0 || xx >= w)) continue;
    if (yy < r && !inArch) continue;
    const X = x + xx, Y = y + yy;
    if (frame) put(b, X, Y, S.cut[1]);
    else if (!holes) put(b, X, Y, S.dark);
    else if (b.sky && X >= 0 && Y >= 0 && X < b.W && Y < b.H) b.px[Y * b.W + X] = b.sky[Y * b.W + X];
  }
  rect(b, x - 1, y + h, w + 2, 1, S.cut[0]);   // the sill
  rect(b, x + Math.floor(w / 2), y + 1, 1, h - 1, S.iron[1]);
  rect(b, x, y + Math.floor(h * 0.55), w, 1, S.iron[1]);
}

/** A torch in its iron bracket; lit, its flame flickers and warms the wall round it. */
function torch(b, x, y, S, lit, t) {
  rect(b, x - 1, y + 2, 3, 1, S.iron[0]);
  rect(b, x, y, 1, 5, S.wood[2]);
  if (!lit) { put(b, x, y - 1, K('#2a2028')); return; }
  const f = Math.sin(t / 2 + x) + Math.sin(t / 3.3 + x * 0.7);
  glow(b, x, y - 3, 7, S.glow, 0.22);
  put(b, x, y - 1, K('#f87818'));
  put(b, x, y - 2, K(f > -0.5 ? '#f8c830' : '#f87818'));
  put(b, x + (f > 0.8 ? 1 : 0), y - 3, K('#fff4a0'));
  if (f > 0) put(b, x, y - 4, K('#f8c830'));
}

// the runes carved in the band under every cornice (js/hub-pillar.js's runeArt): a diamond, a ring and a bar
const GLYPHS = ['010111010', '010101010', '111010111'];

/** The band under a floor's ceiling: a pale lip, dark stone carved with jade runes, a shadow under. Lit, a shimmer runs
    along it. Five rows from `y`. */
export function runeBand(b, x0, x1, y, S, lit, t, seed = 0) {
  const w = x1 - x0;
  rect(b, x0, y, w, 1, S.cut[0]);
  rect(b, x0, y + 1, w, 1, S.rune[0]);
  rect(b, x0, y + 2, w, 2, S.rune[1]);
  rect(b, x0, y + 4, w, 1, S.rune[2]);
  const hot = K('#d8fff0');
  for (let gx = x0 + 2 - ((x0 + 2) % 6) + 6; gx + 3 <= x1; gx += 6) {
    const g = GLYPHS[Math.floor(hash(gx * 0.37 + seed * 5.1) * 3)];
    const c = lit && Math.sin(gx / 11 - t / 16 + seed) > 0.86 ? hot : S.glyph;
    for (let i = 0; i < 9; i++) if (g[i] === '1') put(b, gx + (i % 3), y + 1 + Math.floor(i / 3), c);
  }
}

/** Rayquaza's ring (js/hub-pillar.js's sealArt): a pale stone rim round a jade disc, a gold serpent coiling across it. */
export function raySeal(b, cx, cy, r, S, lit, t) {
  if (lit) glow(b, cx, cy, r + 7, K('#6af0c0'), 0.24 + 0.08 * Math.sin(t / 10));
  disc(b, cx, cy, r, S.cut[2]);
  disc(b, cx, cy, r - 0.8, S.cut[0]);
  const j = r * 0.74;
  disc(b, cx, cy, j, S.jade[2]);
  disc(b, cx, cy, j - 0.8, S.jade[1]);
  disc(b, cx - j * 0.3, cy - j * 0.3, j * 0.45, S.jade[0], 0.5);
  const gold = K(lit ? '#f8e488' : dim('#f8e488')), shade = K(lit ? '#8a5a10' : dim('#8a5a10'));
  const k = j / 6.4, P = [[-4, -3.8], [5.5, -4.4], [-5.5, 4.4], [4, 3.8]].map(([x, y]) => [cx + x * k, cy + y * k]);
  const n = Math.max(8, Math.round(j * 4));
  for (const [c, dy] of [[shade, 1], [gold, 0]]) for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u, a = v * v * v, bb = 3 * v * v * u, cc = 3 * v * u * u, d = u * u * u;
    put(b, Math.round(a * P[0][0] + bb * P[1][0] + cc * P[2][0] + d * P[3][0]), Math.round(a * P[0][1] + bb * P[1][1] + cc * P[2][1] + d * P[3][1]) + dy, c);
  }
  disc(b, Math.round(P[0][0]), Math.round(P[0][1]), Math.max(0.8, k), gold);   // its head
}

/** A jade crystal, long above and short below (the summit's, turning). */
function crystal(b, cx, cy, S, lit, t) {
  const up = 8, down = 4, turn = Math.sin(t / 14);
  for (let yy = -up; yy <= down; yy++) {
    const hw = Math.round(3.4 * (yy < 0 ? 1 + yy / (up + 0.5) : 1 - yy / (down + 0.5)));
    const mid = Math.round(turn * hw * 0.6);
    for (let x = -hw; x <= hw; x++) {
      const c = Math.abs(x) === hw ? S.jade[2] : x === mid ? K(lit ? '#e8fff4' : dim('#e8fff4')) : x < mid ? S.jade[0] : S.jade[1];
      put(b, cx + x, cy + yy, c);
    }
  }
}

/** A door: an arched stone frame round a plank door with iron bands, a gem in its keystone for what's behind it. */
export function door(b, x, surf, type, { open = 0, lit = true, taken = false, S = stone(1, lit), w = 13, h = 22 } = {}) {
  const x0 = x - Math.floor(w / 2), y0 = surf - h, r = Math.floor((w + 4) / 2);
  for (let yy = -3; yy <= h; yy++) for (let xx = -2; xx < w + 2; xx++) {   // the frame
    const dx = xx - (w - 1) / 2, dy = yy - (r - 3);
    if (yy < r - 3 && dx * dx + dy * dy > r * r) continue;
    put(b, x0 + xx, y0 + yy, (xx === -2 || xx === w + 1 || yy === -3 || dx * dx + dy * dy > (r - 1) * (r - 1)) ? S.cut[2] : S.cut[1]);
  }
  const panel = Math.round(w * (1 - open));
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const dx = xx - (w - 1) / 2, dy = yy - (r - 3);
    if (yy < r - 3 && dx * dx + dy * dy > (r - 2) * (r - 2)) continue;
    let c;
    if (xx >= panel) {   // the way through: dark, its light spilling
      c = S.dark;
      if (type === 'out' && b.sky) { const X = x0 + xx, Y = y0 + yy; if (X >= 0 && Y >= 0 && X < b.W && Y < b.H) c = b.sky[Y * b.W + X]; }   // the lobby's way in: daylight
      else if (open > 0.2 && lit && bay(x0 + xx, y0 + yy) < (yy / h) * 0.7 * open) c = K(SPILL[type] || '#fff0c0');
    } else {
      const plank = (xx * w / Math.max(1, panel)) | 0;
      c = plank % 4 === 3 ? S.wood[3] : yy % 7 === 0 ? S.wood[2] : S.wood[xx === 0 ? 2 : 1];
      if (yy === Math.floor(h * 0.3) || yy === Math.floor(h * 0.75)) c = S.iron[1];
      if (xx === panel - 3 && yy === Math.floor(h * 0.55)) c = S.gold[1];
    }
    put(b, x0 + xx, y0 + yy, c);
  }
  if (open > 0.2 && lit) for (let k = 0; k < 6; k++) rect(b, x0 - k + panel, surf + 1 + Math.floor(k / 2), w - panel + k * 2, 1, K(mix(SPILL[type] || '#fff0c0', '#000000', 0.35 + k * 0.08)));
  const gem = K(lit ? (taken ? '#888890' : DOOR_GEM[type] || '#f8f8f8') : dim(DOOR_GEM[type] || '#f8f8f8'));
  rect(b, x - 1, y0 - 3, 3, 3, S.cut[0]);
  put(b, x, y0 - 2, gem);
  if (lit && !taken) put(b, x, y0 - 3, K('#ffffff'));
}

function roomWall(b, lay, surf, S, t, info, lit, f) {
  const doors = info.doors || [];
  const xs = doorXs(lay, Math.max(doors.length, 1));
  // windows between the doors, high up, and torches by them
  const gaps = doors.length ? [lay.doorL - 1, ...xs.slice(0, -1).map((x, i) => (x + xs[i + 1]) / 2), lay.doorR + 1] : [lay.doorL + 10, lay.doorR - 10];
  gaps.forEach((gx, i) => {
    const inner = i > 0 && i < gaps.length - 1;
    if (inner || !doors.length) windowHole(b, Math.round(gx) - 3, surf - 44, 7, 13, S);
    torch(b, Math.round(gx) + (inner ? 0 : i ? -2 : 2), surf - (inner ? 24 : 30), S, lit, t);
  });
  if (!doors.length && f > 0) windowHole(b, Math.round((lay.doorL + lay.doorR) / 2) - 4, surf - 42, 9, 16, S);
  doors.forEach((d, k) => door(b, xs[k], surf, d.type, { open: d.open || 0, lit, taken: d.taken, S }));
}

/** A guardian's hall: banners, braziers and one great door. */
function guardianHall(b, lay, surf, S, t, info, lit) {
  const cx = Math.round((lay.doorL + lay.doorR) / 2), ban = (BANNER[info.banner] || BANNER[0]).map(h => K(lit ? h : dim(h)));
  for (const side of [-1, 1]) {
    const bx = cx + side * 24;
    windowHole(b, cx + side * 36 - 3, surf - 44, 7, 16, S);
    rect(b, bx - 5, surf - 45, 11, 1, S.gold[1]);   // a banner on its rod, hung from the cornice
    for (let yy = 0; yy < 22; yy++) {   // swallow-tailed, gold-edged, Rayquaza's ring at its head
      const tail = yy > 18 ? yy - 18 : 0, w = 9;
      for (let x = 0; x < w; x++) {
        if (tail && Math.abs(x - 4) < tail) continue;
        put(b, bx - 4 + x, surf - 44 + yy, x === 0 || x === w - 1 ? S.gold[2] : yy > 8 && yy < 18 && (yy - 9) % 3 === 0 && x === 4 ? S.gold[1] : bay(bx + x, yy) < 0.2 ? ban[1] : ban[0]);
      }
    }
    disc(b, bx, surf - 39, 2.2, S.gold[1]);
    disc(b, bx, surf - 39, 1, ban[1]);
    brazier(b, cx + side * 17, surf, S, lit, t);
  }
  // the great door, Rayquaza's ring over it as over the Clearing's tower's
  const w = 23, h = 30;
  door(b, cx, surf, 'boss', { open: info.doors?.[0]?.open || 0, lit, S, w, h });
  raySeal(b, cx, surf - h - 9, 6, S, lit, t);
}

function brazier(b, x, surf, S, lit, t) {
  rect(b, x - 1, surf - 10, 3, 10, S.iron[1]);
  rect(b, x - 3, surf - 12, 7, 2, S.iron[0]);
  rect(b, x - 2, surf - 10, 5, 1, S.iron[1]);
  if (!lit) return;
  glow(b, x, surf - 15, 10, S.glow, 0.3);
  for (let k = 0; k < 7; k++) {
    const f = Math.sin(t / 2.2 + k * 1.7 + x);
    const hh = 3 + Math.round(2 + f * 2) - Math.abs(k - 3);
    for (let yy = 0; yy < hh; yy++) put(b, x - 3 + k, surf - 13 - yy, K(yy > hh - 2 ? '#fff4a0' : yy > 1 ? '#f8c830' : '#f87818'));
  }
}

/** The lobby: the way in, and a stone plaque of the week's best climbers on the wall (named on the prep window's). */
function lobby(b, lay, surf, S, t) {
  const cx = Math.round((lay.doorL + lay.doorR) / 2);
  door(b, lay.doorL + 9, surf, 'out', { open: 1, lit: true, S, w: 13, h: 24 });   // the way in, daylight beyond
  raySeal(b, lay.doorL + 9, surf - 34, 4, S, true, t);
  rect(b, cx - 9, surf - 34, 22, 15, S.cut[2]);
  rect(b, cx - 8, surf - 33, 20, 13, K('#c8a050'));
  rect(b, cx - 7, surf - 32, 18, 11, K('#a87830'));
  for (let i = 0; i < 4; i++) rect(b, cx - 5, surf - 30 + i * 2.5, 14 - (i % 2) * 4, 1, K('#5a3a18'));
  torch(b, cx - 13, surf - 28, S, true, t);
  torch(b, cx + 17, surf - 28, S, true, t);
  windowHole(b, lay.doorR - 8, surf - 42, 7, 15, S);
}

/** Floor 100: the summit, open to the sky. Broken pillars and an altar where Rayquaza comes down. */
function summitHall(b, lay, surf, S, t, info) {
  const cx = Math.round((lay.doorL + Math.max(lay.doorR, lay.iR - 3)) / 2);
  for (const px of [lay.iL + 8, lay.iR - 9, cx - 30, cx + 30]) {
    const h = 26 + Math.round(hash(px) * 18);
    rect(b, px - 3, surf - h, 7, h, S.cut[1]);
    rect(b, px - 3, surf - h, 1, h, S.cut[0]);
    rect(b, px + 3, surf - h, 1, h, S.cut[2]);
    for (let k = 0; k < 4; k++) put(b, px - 3 + Math.round(hash(px + k) * 6), surf - h - 1, S.cut[1]);   // its broken top
    rect(b, px - 4, surf - 3, 9, 3, S.cut[2]);
    if (hash(px * 3) > 0.4) for (let k = 0; k < 6; k++) put(b, px - 2 + (k % 3), surf - h + 4 + k * 3, S.moss);
  }
  // the altar: three steps up to a jade dais, Rayquaza's mark glowing on it
  const lit = info.lit ?? true, open = info.doors?.[0]?.open || 0;
  rect(b, cx - 15, surf - 3, 31, 3, S.cut[2]);
  rect(b, cx - 11, surf - 6, 23, 3, S.cut[1]);
  rect(b, cx - 7, surf - 9, 15, 3, S.cut[0]);
  rect(b, cx - 3, surf - 21, 7, 12, S.cut[1]);
  rect(b, cx - 4, surf - 22, 9, 2, S.gold[1]);
  const pulse = 0.5 + 0.5 * Math.sin(t / 8), bob = Math.round(Math.sin(t / 20) * 1.5);
  glow(b, cx, surf - 28, 13 + Math.round(open * 10), K('#80f8b0'), 0.25 + pulse * 0.2 + open * 0.4);
  crystal(b, cx, surf - 28 + bob, S, lit, t);   // the jade crystal turning over it, the Clearing's tower's crown
}

/** The spiral stair up to the floor above: a stone newel with steps winding round it. */
function stairWell(b, lay, surf, S, lit, f, t) {
  const cx = lay.stairX, top = surf - FH + SLAB + 1;
  rect(b, lay.stair, top - SLAB, 1, FH, S.wall[3]);   // the well's shadowed edge
  const steps = stairSteps(cx, surf);
  const draw = (back) => steps.forEach(st => {
    if ((st.depth < 0) !== back) return;
    const c = st.depth < 0 ? S.slab[2] : st.depth > 0.6 ? S.slab[0] : S.slab[1];
    rect(b, st.x - 5, st.y, 11, 1, c);
    rect(b, st.x - 5, st.y + 1, 11, 1, S.slab[3]);
  });
  draw(true);
  rect(b, cx - 2, top - SLAB, 4, FH, S.cut[1]);   // the newel
  rect(b, cx - 2, top - SLAB, 1, FH, S.cut[0]);
  rect(b, cx + 1, top - SLAB, 1, FH, S.cut[2]);
  draw(false);
}

/** The steps of a floor's spiral stair, bottom to top: where each sits and whether it's in front of the newel. */
export function stairSteps(cx, surf) {
  const out = [], n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI;
    out.push({ x: Math.round(cx + Math.sin(a) * 6), y: surf - Math.round((i + 1) * (FH / n)), depth: Math.cos(a) });
  }
  return out;
}

/** The outer walls' cut faces: thick stone, the courses showing, moss and vines on the outside. */
function outerWalls(b, camY, lay, f, lit) {
  const S = stone(f, lit || f === 0);
  const y0 = sy(b, camY, (f + 1) * FH - 1), y1 = sy(b, camY, f * FH);
  const high = f === TOP ? sy(b, camY, f * FH + SLAB + 12) : y0;
  for (let s = Math.max(0, high); s <= Math.min(b.H - 1, y1); s++) {
    const r = y1 - s;
    for (const [x0, x1, outer] of [[lay.L, lay.iL, lay.L], [lay.iR, lay.R, lay.R - 1]]) {
      for (let x = x0; x < x1; x++) {
        let c = r % 6 === 5 ? S.cut[2] : x === outer ? S.cut[2] : S.cut[(x + r) % 9 === 0 ? 2 : 1];
        if (x === x0 + 1 && x0 === lay.L) c = S.cut[0];
        if (x === outer && hash(s * 3.1 + f) > 0.82) c = S.moss;
        put(b, x, s, c);
      }
    }
    if (hash(Math.floor(r / 3) + f * 9) > 0.7 + Math.min(0.3, f * 0.012)) { put(b, lay.L - 1, s, S.moss); put(b, lay.R, s, S.moss); }   // ivy, thinning out above the foot
    const big = f % 10 === 0 && f > 0;
    if (r < (big ? 4 : 2) && f < TOP) {   // a cornice at every floor, a deeper one every ten with its runes
      const c = r === (big ? 3 : 1) ? S.cut[0] : S.cut[2];
      for (let k = 1; k <= (big ? 2 : 1); k++) { put(b, lay.L - k, s, c); put(b, lay.R - 1 + k, s, c); }
      if (big && (r === 1 || r === 2)) for (const x of [lay.L + 2, lay.R - 3]) put(b, x, s, S.glyph);
    }
  }
}

/** Stones floating round the tower's middle, a few with a jade shard in them (the Clearing's tower's), where there's room. */
function floaters(b, camY, lay, floors, t) {
  const room = lay.L - 3;
  if (room < 12) return;
  for (let i = 0; i < 16; i++) {
    const alt = (5 + hash(i * 3.7) * 22) * FH, f = Math.floor(alt / FH);
    const s = Math.round(sy(b, camY, alt + Math.sin(t / 45 + i * 1.7) * 2.5));
    if (s < -8 || s > b.H + 8) continue;
    const S = stone(f, floors(f)?.lit ?? false), r = 1.4 + hash(i * 2.9) * 2.6, d = 4 + hash(i * 5.1) * (room - 9);
    const x = Math.round(i % 2 ? lay.R + d : lay.L - 1 - d);
    disc(b, x, s, r + 0.7, S.cut[2]);
    disc(b, x - 0.5, s - 0.5, r, S.cut[1]);
    disc(b, x - 1, s - 1, r * 0.45, S.cut[0]);
    put(b, x, s + Math.ceil(r) + 1, S.cut[2]);
    if (hash(i * 7.3) > 0.55) { put(b, x, s - Math.ceil(r) - 1, S.jade[0]); put(b, x, s - Math.ceil(r), S.jade[1]); }
  }
}

/** The summit's broken crown, over floor 100's parapet. */
function crown(b, camY, lay) {
  const S = stone(TOP, true), base = sy(b, camY, TOP * FH + SLAB + 12);
  for (let x = lay.L; x < lay.R; x += 7) {
    const h = 2 + Math.round(hash(x * 1.7) * 5);
    if (x > lay.iL + 2 && x < lay.iR - 6) continue;
    rect(b, x, base - h, 5, h, S.cut[1]);
    put(b, x, base - h, S.cut[0]);
  }
}

/** A floor giving way under you: cracks racing out from where you stand, then a hole. */
function floorCrack(b, camY, lay, hole, k, t) {
  const surf = sy(b, camY, hole.floor * FH + SLAB - 1), cx = hole.x;
  for (let i = 0; i < 9; i++) {
    let x = cx, y = surf;
    const dir = i % 2 ? 1 : -1, len = (8 + hash(i) * 26) * Math.min(1, k * 1.6);
    for (let s = 0; s < len; s++) { x += dir * (0.6 + hash(i * 7 + s) * 0.8); y += (hash(s + i * 3) - 0.5) * 1.4; put(b, x, Math.min(surf + SLAB - 1, Math.max(surf, y)), K('#1a1418')); }
  }
  if (k > 0.55) {
    const w = Math.round((k - 0.55) * 40);
    rect(b, cx - w, surf, w * 2 + 1, SLAB + 1, K('#0a080c'));
  }
}

/* ---------- the battle arena: one room of the tower, close up (js/scene.js's `tower` backdrop) ---------- */

/**
 * One of the tower's rooms filling a battle's background: the back wall down to `horizon` with tall windows on the sky at
 * `alt`, a flagged floor below. `kind` 'boss' hangs banners and lights braziers; `summit` is Rayquaza's: open to the sky.
 */
export function paintArena(b, horizon, { alt = 1, kind = 'wild', banner = 0 }, t, bare = false) {
  const { W, H } = b, summit = alt >= TOP;
  // the summit's open sky: the planet's curve just over its parapet; indoors the windows look out at the room's height
  const camY = summit ? LIMB * FH + 1 - H + horizon - 26 : alt * FH + 26 - (H - horizon);
  paintSky(b, camY, t, { ox: 40 });
  if (bare) return;   // the 3D room (js/arena-3d.js) stands in front: only its windows' sky is seen
  const S = stone(Math.floor(alt), true);
  const wallTop = summit ? horizon - 18 : 0;
  const winW = Math.max(9, Math.round(W * 0.11)), winH = Math.round(horizon * 0.62);
  const wins = summit ? [] : (W > 140 ? [0.12, 0.32, 0.68, 0.88] : [0.18, 0.82]).map(p => Math.round(W * p - winW / 2));
  const inWin = (x, y) => wins.some(wx => {
    const r = winW / 2, top = horizon - 14 - winH, dx = x - (wx + r - 0.5), dy = y - (top + r);
    return x >= wx && x < wx + winW && y >= top && y < horizon - 14 && (y >= top + r || dx * dx + dy * dy <= r * r);
  });
  for (let y = Math.max(0, wallTop); y < horizon; y++) {
    const r = horizon - y, course = Math.floor(r / 7), off = course % 2 ? 7 : 0;
    for (let x = 0; x < W; x++) {
      if (inWin(x, y)) continue;
      const mortar = r % 7 === 6 || (x + off) % 14 === 0;
      const v = hash(Math.floor((x + off) / 14) * 13.1 + course * 7.7);
      let c = mortar ? S.wall[3] : v > 0.8 ? S.wall[0] : v > 0.3 ? S.wall[1] : S.wall[2];
      if (!mortar && r % 7 === 5 && bay(x, y) < 0.5) c = S.wall[0];
      if (!mortar && v > 0.88 && hash(x * 1.3 + y) > 0.55) c = S.moss;
      put(b, x, y, c);
    }
  }
  const bandY = summit ? -1 : horizon - 14 - winH - 7;
  if (bandY >= 0) runeBand(b, 0, W, bandY, S, true, t);
  for (const wx of wins) {   // each window's frame and sill
    const top = horizon - 14 - winH;
    rect(b, wx - 1, top + winW / 2, 1, winH - winW / 2, S.cut[1]);
    rect(b, wx + winW, top + winW / 2, 1, winH - winW / 2, S.cut[1]);
    rect(b, wx - 2, horizon - 14, winW + 4, 2, S.cut[0]);
    rect(b, wx + Math.floor(winW / 2), top + 2, 1, winH - 2, S.iron[1]);
  }
  if (summit) {   // the parapet's broken pillars against the sky
    for (const p of [0.06, 0.24, 0.76, 0.94]) {
      const px = Math.round(W * p), h = Math.round(horizon * (0.35 + hash(p * 9) * 0.3));
      rect(b, px - 4, horizon - h, 9, h, S.cut[1]);
      rect(b, px - 4, horizon - h, 2, h, S.cut[0]);
      rect(b, px + 3, horizon - h, 2, h, S.cut[2]);
      for (let k = 0; k < 6; k++) put(b, px - 4 + Math.round(hash(p + k) * 8), horizon - h - 1, S.cut[1]);
    }
  } else {
    const tx = W > 140 ? [0.22, 0.5, 0.78] : [0.5];
    for (const p of tx) {
      const x = Math.round(W * p);
      if (kind === 'boss') brazier(b, x, horizon - 2, S, true, t);
      else torch(b, x, Math.round(horizon * 0.42), S, true, t);
    }
    if (kind === 'boss' || kind === 'elite') {
      const ban = (BANNER[banner] || BANNER[0]).map(K);
      const rod = bandY >= 0 ? bandY + 5 : 2;
      for (const p of W > 140 ? [0.41, 0.59] : [0.32, 0.68]) {
        const bx = Math.round(W * p);
        rect(b, bx - 5, rod, 11, 1, S.gold[1]);
        for (let yy = 0; yy < horizon * 0.5; yy++) {
          rect(b, bx - 4, rod + 1 + yy, 9, 1, yy % 11 === 6 ? ban[2] : ban[kind === 'elite' ? 1 : 0]);
          put(b, bx - 4, rod + 1 + yy, S.gold[2]); put(b, bx + 4, rod + 1 + yy, S.gold[2]);
        }
      }
      if (kind === 'boss') raySeal(b, Math.round(W / 2), Math.round(horizon * 0.4), Math.max(5, Math.min(9, Math.round(horizon * 0.11))), S, true, t);
    }
  }
  // the floor: flagstones in perspective, a runner up the middle for a guardian
  for (let y = horizon; y < H; y++) {
    const d = (y - horizon + 1) / (H - horizon), row = Math.floor(Math.sqrt(d) * 9), w = 10 + d * 22;
    for (let x = 0; x < W; x++) {
      const cx = (x - W / 2) / w + row * 0.5, edge = Math.abs(cx - Math.round(cx)) < 0.04 + 0.5 / w;
      const rowEdge = Math.floor(Math.sqrt((y - horizon) / (H - horizon)) * 9) !== Math.floor(Math.sqrt((y - horizon + 1) / (H - horizon)) * 9);
      let c = edge || rowEdge ? S.slab[3] : hash(Math.round(cx) * 3.7 + row * 11) > 0.5 ? S.slab[1] : S.slab[2];
      if (y === horizon) c = S.slab[0];
      if (kind === 'boss' && !summit && Math.abs(x - W / 2) < W * 0.08 + d * W * 0.12) c = Math.abs(x - W / 2) > W * 0.07 + d * W * 0.11 ? K('#f8c830') : K('#a02828');
      if (summit && !edge && !rowEdge && hash(Math.round(cx) * 5.3 + row * 17) > 0.86 && bay(x, y) < 0.4) c = S.moss;   // moss in the old flagstones
      put(b, x, y, c);
    }
  }
}

/** The summit's win scene backdrop (`.hof-scene.summit`, js/halloffame.js): floor 100 as the climb and Rayquaza's fight
    show it, its horizon at `horizon` CSS pixels from the top (behind the pedestal). */
export function paintSummit(canvas, horizon) {
  const P = innerWidth <= 720 ? 3 : 4, W = Math.ceil(innerWidth / P), H = Math.ceil(innerHeight / P);
  const b = makeBuffer(canvas, W, H);
  canvas.style.width = `${W * P}px`;
  canvas.style.height = `${H * P}px`;
  paintArena(b, Math.max(20, Math.min(H - 8, Math.round(horizon / P))), { alt: TOP, kind: 'boss' }, 0);
  flush(b);
}
