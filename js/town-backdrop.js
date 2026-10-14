/* town-backdrop.js  -  what each gateway town sees past its edge (the user's ask, 2026-10-14: "refix the backgrounds of
   each town, mostly the exits, and make them all grand and aesthetic and animated... some clouds need to be higher too
   or cover much more vertically").

   The towns' ground rolls away (the curve, CURVE in js/hub-3d.js), so a painting stood on the back edge sank out of
   sight from most of the town and left a flat colour for a sky. This backdrop instead hangs far off behind everything,
   square to the camera, its horizon kept on the crest of the town's rolled ground every frame (place()), scaled to the
   band of sky above it. Its layers, back to front: the sky, high towering clouds drifting, the town's land with its
   landmark right behind the exit gate (it follows the gate across the screen), what moves there (mist, smoke, birds,
   glints, light shafts, lanterns), and a treeline in front with a gap where the road goes on. Painted once per visit.

   Units: one band is the sky from the horizon to the top of the screen; x runs 0..W, the landmark at W / 2. */

import { hash } from './tower-art.js';
import { GRADES, gradeHex } from './daytime.js';
import { rgba, puff, glow, vgrad } from './smooth-paint.js';

const W = 10, UP = 1.6, DOWN = 0.5;   // bands across, painted above and below the horizon
const PX = 180;                        // canvas pixels a band
const DEPTH = 128;                     // how far off it hangs, inside the camera's far plane (140)
const FAR = 0.85;                      // how closely the land follows the gate across the screen (the treeline: 1)

const SKIES = {   // top, middle, horizon, by the hour
  village: { day: ['#5a8ed0', '#a6cae0', '#e4efdc'], dawn: ['#3a4a80', '#c08aa0', '#f8d0a8'], dusk: ['#2a2858', '#b05878', '#f8a060'], night: ['#070b22', '#152048', '#2e4060'] },
  springs: { day: ['#5a4a62', '#b07868', '#f0b888'], dawn: ['#3a2a40', '#a05a58', '#f09060'], dusk: ['#24182a', '#80303a', '#e86030'], night: ['#0a0610', '#2a0e14', '#6a1e14'] },
  lagoon: { day: ['#2a7ad8', '#68b8f0', '#d8f4f8'], dawn: ['#2c3c70', '#b07ca0', '#ffc8a0'], dusk: ['#28205a', '#b04a70', '#ffa050'], night: ['#050a24', '#0e1c48', '#20406a'] },
  canopy: { day: ['#3a6a9a', '#7ab0b0', '#d6ecc2'], dawn: ['#2e3a6a', '#9a88a8', '#e8d0a8'], dusk: ['#1e1c48', '#6a4a78', '#d88a70'], night: ['#04081a', '#0c1e30', '#1e3a3a'] },
  bazaar: { day: ['#2a6ed0', '#78b4e8', '#f6e2b0'], dawn: ['#34386e', '#c07888', '#ffd098'], dusk: ['#2a1e50', '#c0506a', '#ffa040'], night: ['#060820', '#141a44', '#3a3050'] },
};
const PUFFS = { day: ['#ffffff', '#c4d0e4'], dawn: ['#fbe4d8', '#b88498'], dusk: ['#f8d0b8', '#94566e'], night: ['#3a4870', '#1e2846'] };
const CLOUDS = {   // towering cumulus (how many, how tall), loose puffs, high streaks of cirrus
  village: { towers: 7, tall: [0.35, 0.95], puffs: 22, cirrus: 10 },
  springs: { towers: 5, tall: [0.3, 0.8], puffs: 16, cirrus: 4, tint: { day: ['#b8a8a0', '#5a4a4c'], dawn: ['#d0a090', '#5a3a40'], dusk: ['#c07060', '#3a2028'], night: ['#4a3034', '#1a1014'] } },
  lagoon: { towers: 6, tall: [0.6, 1.4], puffs: 16, cirrus: 6 },
  canopy: { towers: 4, tall: [0.3, 0.75], puffs: 26, cirrus: 12, tint: { day: ['#f4f8ec', '#b4c8bc'] } },
  bazaar: { towers: 5, tall: [0.4, 1.05], puffs: 10, cirrus: 16 },
};
const LIT = { dawn: 0.45, day: 0.15, dusk: 0.8, night: 1 };   // how bright a lantern, a lava flow, a window shows

/* ---------- painting ---------- */

/** A canvas `w` bands wide, `up` above the horizon and `down` below it (negative: its foot is up in the sky), drawn in
    bands with the horizon at y 0 and up negative. */
function sheet(w, up, down, px = PX) {
  const c = new OffscreenCanvas(Math.round(w * px), Math.max(2, Math.round((up + down) * px))), g = c.getContext('2d');
  c.fine = px;
  g.scale(px, px);
  g.translate(0, up);
  return { c, g, w, up, down };
}

/** An alpha mask's canvas: black, so its grey levels are the alpha (an alphaMap reads the green channel). */
function maskSheet(w, up, down, px) {
  const s = sheet(w, up, down, px);
  s.g.fillStyle = '#000'; s.g.fillRect(-1, -up - 1, w + 2, up + down + 2);
  return s;
}

const sm = (x, s) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i * 1.7 + s) * (1 - u) + hash((i + 1) * 1.7 + s) * u; };
const fbm = (x, s) => sm(x, s) * 0.55 + sm(x * 2.1, s + 5) * 0.28 + sm(x * 4.7, s + 11) * 0.17;
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const clamp = (v, a) => Math.max(-a, Math.min(a, v));

/** A peak `h` high, `half` wide each side of `cx`, its flanks sagging, its edge ragged. */
function cone(x, cx, h, half, seed, sag = 1.35) {
  const d = Math.abs(x - cx) / half;
  return d >= 1 ? 0 : h * (1 - d) ** sag * (0.93 + 0.14 * fbm(x * 7, seed));
}

/** The outline of land whose height at x is `top(x)`, down to `bottom`. */
function shape(x0, x1, top, bottom = DOWN, step = 0.012) {
  const p = new Path2D();
  p.moveTo(x0, bottom);
  for (let x = x0; x <= x1 + 1e-6; x += step) p.lineTo(x, -top(x));
  p.lineTo(x1, bottom);
  p.closePath();
  return p;
}

function land(g, top, fill, x0 = -0.1, x1 = W + 0.1) {
  const p = shape(x0, x1, top);
  g.fillStyle = fill;
  g.fill(p);
  return p;
}

/** Haze lying over everything painted so far, thickest at the horizon. */
function haze(g, high, hex, a) {
  g.fillStyle = vgrad(g, -high, 0.05, [rgba(hex, 0), rgba(hex, a)]);
  g.fillRect(-0.1, -high, W + 0.2, high + 0.05);
}

/** A soft band of mist along `y`, `th` thick, ragged along its length. */
function mistBand(g, y, th, hex, a, seed, w = W, wrap = false) {
  for (let i = 0; i < w * 9; i++) {
    const x = (i + hash(i * 3.1 + seed)) / 9, rx = 0.18 + hash(i * 5.7 + seed) * 0.3, ry = th * (0.5 + hash(i * 2.3 + seed) * 0.7);
    for (const o of wrap ? [-w, 0, w] : [0]) {
      const cx = x + o, cy = y + (hash(i * 9.1 + seed) - 0.5) * th * 0.6;
      if (cx + rx < -0.05 || cx - rx > w + 0.05) continue;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rx);
      gr.addColorStop(0, rgba(hex, a)); gr.addColorStop(1, rgba(hex, 0));
      g.save(); g.translate(cx, cy); g.scale(1, ry / rx); g.translate(-cx, -cy);
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rx, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }
}

/** The sun, low at dawn and dusk, or the moon at night, `h` bands up. */
function sunMoon(g, t, x, h, r = 0.075) {
  const low = t.time === 'dawn' || t.time === 'dusk', y = -(low ? h * 0.35 : h);
  if (t.time === 'night') {
    glow(g, x, y, r * 6, '#c8d4ff', 0.22);
    g.fillStyle = '#f0eedc'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(160,160,180,0.35)';
    for (const [dx, dy, k] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.3], [0.05, 0.4, 0.16]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, k * r, 0, Math.PI * 2); g.fill(); }
    return;
  }
  const hot = t.time === 'day' ? '#fff6b0' : t.time === 'dawn' ? '#ffd0a0' : '#ff9048';
  glow(g, x, y, r * (low ? 10 : 7), hot, low ? 0.6 : 0.45);
  const sg = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  sg.addColorStop(0, '#fffef0'); sg.addColorStop(1, t.time === 'day' ? '#ffe878' : t.time === 'dawn' ? '#ffb070' : '#ff6a30');
  g.fillStyle = sg; g.beginPath(); g.arc(x, y, r * (low ? 1.25 : 1), 0, Math.PI * 2); g.fill();
}

/** A cedar: tiers of dark boughs to a point. */
function cedar(g, x, h, w, lit, dark) {
  g.fillStyle = dark; g.fillRect(x - w * 0.06, -h * 0.25, w * 0.12, h * 0.3);
  for (let i = 0; i < 4; i++) {
    const y0 = -h * (0.18 + i * 0.2), y1 = y0 - h * 0.42, ww = w * (1 - i * 0.2);
    g.fillStyle = vgrad(g, y1, y0, [lit, dark]);
    g.beginPath(); g.moveTo(x - ww / 2, y0); g.quadraticCurveTo(x - ww * 0.15, y0 - h * 0.1, x, y1); g.quadraticCurveTo(x + ww * 0.15, y0 - h * 0.1, x + ww / 2, y0); g.closePath(); g.fill();
  }
}

/** A palm: a leaning trunk, a burst of drooping fronds. */
function palm(g, x, h, lean, trunk, leaf) {
  const tx = x + lean * h, ty = -h;
  g.strokeStyle = trunk; g.lineWidth = 0.012; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, 0.02); g.quadraticCurveTo(x + lean * h * 0.2, -h * 0.6, tx, ty); g.stroke();
  g.strokeStyle = leaf; g.lineWidth = 0.009;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI + (i / 8) * Math.PI, len = h * (0.32 + (i % 3) * 0.05);
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.45 + len * 0.35;
    g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * len * 0.55, ty + Math.sin(a) * len * 0.7, ex, ey); g.stroke();
  }
}

/** An acacia: a forked trunk under a wide flat crown. */
function acacia(g, x, h, w, trunk, crown) {
  g.strokeStyle = trunk; g.lineWidth = Math.max(0.006, h * 0.05); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, 0.01); g.lineTo(x, -h * 0.45); g.lineTo(x - w * 0.22, -h * 0.85); g.moveTo(x, -h * 0.45); g.lineTo(x + w * 0.25, -h * 0.88); g.stroke();
  g.fillStyle = crown;
  g.beginPath(); g.ellipse(x, -h * 0.92, w / 2, h * 0.1, 0, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(x + (i / 5 - 0.5) * w * 0.8, -h * 0.97, w * 0.14, h * 0.07, 0, 0, Math.PI * 2); g.fill(); }
}

/** A flock in a loose V. */
function flock(g, x, y, n, s, hex, white = false) {
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, k = Math.ceil(i / 2), bx = x - k * s * 2.4, by = y + side * k * s * 1.3 + (hash(i * 3.3 + x) - 0.5) * s;
    g.strokeStyle = hex; g.lineWidth = s * 0.28; g.lineCap = 'round';
    g.beginPath(); g.moveTo(bx - s, by - s * 0.15); g.quadraticCurveTo(bx - s * 0.45, by - s * 0.6, bx, by); g.quadraticCurveTo(bx + s * 0.45, by - s * 0.6, bx + s, by - s * 0.15); g.stroke();
    if (white) { g.strokeStyle = '#3a3a44'; g.lineWidth = s * 0.2; g.beginPath(); g.moveTo(bx - s, by - s * 0.15); g.lineTo(bx - s * 0.75, by - s * 0.35); g.moveTo(bx + s, by - s * 0.15); g.lineTo(bx + s * 0.75, by - s * 0.35); g.stroke(); }
  }
}

/* ---------- the layers every town has ---------- */

function skyArt(t) {
  const [s0, s1, s2] = t.sky, S = sheet(W, UP, DOWN, 48), { g } = S;
  g.fillStyle = vgrad(g, -UP, 0, [s0, s0, s1, s2]); g.fillRect(-0.1, -UP, W + 0.2, UP + 0.01);
  g.fillStyle = s2; g.fillRect(-0.1, 0, W + 0.2, DOWN);
  if (t.time === 'night') for (let i = 0; i < 260; i++) {
    const x = hash(i * 3.1) * W, y = -0.15 - hash(i * 7.7 + 1) * (UP - 0.2), r = 0.006 + hash(i * 1.3) * 0.01;
    g.fillStyle = `rgba(255,255,255,${(0.35 + hash(i + 0.5) * 0.65) * Math.min(1, -y * 2)})`; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  return { c: S.c, w: W, up: UP, down: DOWN, on: 'sky' };
}

/** A towering cumulus: puffs stacked from a flat grey base up to a bright crown. */
function cumulus(g, x, base, tall, wide, tint, a) {
  const n = Math.max(3, Math.round(tall / 0.06));
  g.fillStyle = rgba(tint[1], a * 0.8);
  g.beginPath(); g.ellipse(x, -base + 0.01, wide * 1.1, 0.025, 0, 0, Math.PI * 2); g.fill();
  for (let j = 0; j < n; j++) {
    const k = j / (n - 1), y = -(base + k * tall), r = wide * (0.62 - 0.28 * k) * (0.8 + hash(x * 13 + j) * 0.4);
    puff(g, x + (hash(x * 7 + j) - 0.5) * wide * 0.5 - r * 0.2, y, r, [tint[0], mix(tint[1], tint[0], k * 0.6)], a);
  }
}

function cloudArt(t, style) {
  const C = CLOUDS[style], tint = C.tint?.[t.time] || PUFFS[t.time], a = t.time === 'night' ? 0.7 : 0.94;
  const S = sheet(W, UP, -0.03, PX * 0.5), { g } = S, wrap = (x, f) => { for (const o of [-W, 0, W]) f(x + o); };
  for (let i = 0; i < C.cirrus; i++) {   // high streaks, right up at the top of the sky
    const x = hash(i * 3.3 + 1) * W, y = -(1.0 + hash(i * 5.1) * 0.5), len = 0.4 + hash(i * 2.2) * 0.9;
    wrap(x, (cx) => { for (let k = 0; k < 4; k++) { g.fillStyle = rgba(tint[0], a * 0.22); g.beginPath(); g.ellipse(cx + k * len * 0.12, y + k * 0.012, len * (0.5 - k * 0.08), 0.01, -0.04, 0, Math.PI * 2); g.fill(); } });
  }
  for (let i = 0; i < C.towers; i++) {   // towers rising from just over the horizon high into the sky
    const x = (i + 0.2 + hash(i * 7.7) * 0.6) * W / C.towers, base = 0.1 + hash(i * 1.9) * 0.22, tall = C.tall[0] + hash(i * 4.4) * (C.tall[1] - C.tall[0]);
    wrap(x, (cx) => cumulus(g, cx, base, tall, 0.11 + hash(i * 6.6) * 0.09, tint, a));
  }
  for (let i = 0; i < C.puffs; i++) {
    const x = hash(i * 5.3 + 2) * W, y = -(0.3 + hash(i * 2.7) * 1.05), r = 0.035 + hash(i * 9.1) * 0.05;
    wrap(x, (cx) => puff(g, cx, y, r, tint, a * 0.9));
  }
  return { c: S.c, w: W, up: UP, down: -0.03, on: 'far', par: 0.4, wrap: true, dx: 0.012 };
}

function mistArt(t, hex, bands, dx = 0.02) {
  const S = sheet(W, 0.7, 0.12, PX * 0.35), { g } = S;
  bands.forEach(([y, th, a], i) => mistBand(g, -y, th, hex, a * (t.time === 'night' ? 0.6 : 1), i * 17 + 3, W, true));
  return { c: S.c, w: W, up: 0.7, down: 0.12, on: 'near', par: 0.9, wrap: true, dx };
}

function birdArt(t, hex, white, dx) {
  const S = sheet(W, 1.25, -0.3, PX * 0.6), { g } = S;
  for (let i = 0; i < 4; i++) {
    const x = (i + hash(i * 4.1)) * W / 4, y = -(0.45 + hash(i * 6.3) * 0.6), n = 3 + Math.floor(hash(i * 2.9) * 5);
    for (const o of [-W, 0, W]) flock(g, x + o, y, n, 0.018 + hash(i) * 0.01, hex, white);
  }
  return { c: S.c, w: W, up: 1.25, down: -0.3, on: 'far', par: 0.5, wrap: true, dx };
}

/* ---------- each town ---------- */

/* Lantern Village (the Shrine): ink-wash ranges in the mist and, behind the torii, the Lantern Mountain, a pagoda on its
   shoulder and a stair of lanterns climbing to it; cedars and maples in front, the stone path going on. */
function village(t) {
  const { L, sky } = t, hz = sky[2], cx = W / 2, F = sheet(W, UP, DOWN), { g } = F, glows = [];
  sunMoon(g, t, cx + 0.75, 0.95);
  land(g, x => 0.2 + fbm(x * 0.8, 3) * 0.3, mix(L('#94aab8'), hz, 0.5));
  mistBand(g, -0.18, 0.08, hz, 0.45, 1);
  const mtn = x => Math.max(0.1 + fbm(x * 1.1, 9) * 0.22, cone(x, cx, 0.86, 1.25, 4));
  const body = land(g, mtn, vgrad(g, -0.86, 0, [L('#8ea6b2'), L('#5e7c86')]));
  g.save(); g.clip(body);
  g.fillStyle = vgrad(g, -0.86, 0, [rgba(L('#1e2a3c'), 0.25), rgba(L('#1e2a3c'), 0.1)]); g.fillRect(cx + 0.02, -1, 1.4, 1.5);
  for (let i = 0; i < 18; i++) {   // gullies down its face
    const x = cx + (hash(i * 3.7) - 0.5) * 1.6, top = mtn(x);
    g.strokeStyle = rgba(L(i % 2 ? '#dfe8ee' : '#30404c'), 0.22); g.lineWidth = 0.006;
    g.beginPath(); g.moveTo(x, -top + 0.02); g.quadraticCurveTo(x + 0.03, -top * 0.6, x - 0.02 + (hash(i) - 0.5) * 0.1, -top * 0.2); g.stroke();
  }
  g.restore();
  // a waterfall off a cliff on its left
  const wx = cx - 0.2, wt = mtn(wx);
  g.fillStyle = vgrad(g, -wt * 0.78, -wt * 0.3, [rgba('#ffffff', 0.85), rgba('#e8f4ff', 0.4)]); g.fillRect(wx - 0.006, -wt * 0.78, 0.012, wt * 0.48);
  for (let k = 0; k < 6; k++) puff(g, wx - 0.035 + k * 0.014, -wt * 0.3 + 0.012, 0.014, ['#ffffff', '#dde8f0'], 0.45);
  // the pagoda on its shoulder and the lantern stair up to it
  const px = cx + 0.24, py = -mtn(px) + 0.006;
  const stair = [];
  for (let i = 0; i <= 44; i++) {
    const k = i / 44, x = cx - 0.42 + (px - cx + 0.42) * k + Math.sin(k * Math.PI * 5) * 0.07 * (1 - k), h = Math.min(-py * k, mtn(x) * 0.93);
    stair.push([x, -h]);
  }
  g.strokeStyle = rgba(L('#d8d0c0'), 0.45); g.lineWidth = 0.005; g.beginPath(); stair.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  stair.forEach(([x, y], i) => { if (i % 2) return; g.fillStyle = rgba('#ffd27a', 0.45 + 0.55 * t.lit); g.beginPath(); g.arc(x, y, 0.005, 0, Math.PI * 2); g.fill(); glows.push([x, y, 0.035, '#ffb050']); });
  const s = 0.075;
  for (let i = 0; i < 3; i++) {
    const w = s * (1 - i * 0.2), y0 = py - i * s * 0.5;
    g.fillStyle = L('#8a2c24'); g.fillRect(px - w * 0.3, y0 - s * 0.4, w * 0.6, s * 0.4);
    g.fillStyle = rgba('#ffd890', 0.3 + 0.7 * t.lit); g.fillRect(px - w * 0.12, y0 - s * 0.32, w * 0.24, s * 0.16);
    glows.push([px, y0 - s * 0.25, 0.06, '#ffc060']);
    g.fillStyle = L('#2a3434');
    g.beginPath(); g.moveTo(px - w * 0.62, y0 - s * 0.32); g.quadraticCurveTo(px - w * 0.36, y0 - s * 0.4, px - w * 0.2, y0 - s * 0.56); g.lineTo(px + w * 0.2, y0 - s * 0.56); g.quadraticCurveTo(px + w * 0.36, y0 - s * 0.4, px + w * 0.62, y0 - s * 0.32); g.closePath(); g.fill();
  }
  g.strokeStyle = L('#2a3434'); g.lineWidth = 0.004; g.beginPath(); g.moveTo(px, py - s * 1.5); g.lineTo(px, py - s * 1.85); g.stroke();
  mistBand(g, -0.34, 0.05, hz, 0.35, 11);
  // the near hills, cedars along their tops, maples turning
  const mid = x => 0.07 + fbm(x * 2.2, 17) * 0.13;
  land(g, mid, vgrad(g, -0.2, DOWN, [mix(L('#56786a'), hz, 0.15), L('#34503f')]));
  for (let x = 0; x < W; x += 0.02) { const h = mid(x), k = 0.025 + hash(x * 41) * 0.035; g.save(); g.translate(0, -h + 0.01); cedar(g, x, k, k * 0.45, L('#4a6a58'), L('#2e4a3c')); g.restore(); }
  for (let i = 0; i < 70; i++) { const x = hash(i * 5.1 + 2) * W, y = -mid(x) * (0.3 + hash(i * 2.2) * 0.6); g.fillStyle = L(['#c8582e', '#e09040', '#b8402a', '#d87038'][i % 4]); g.beginPath(); g.ellipse(x, y, 0.02 + hash(i) * 0.025, 0.012 + hash(i) * 0.012, 0, 0, Math.PI * 2); g.fill(); }
  mistBand(g, -0.04, 0.05, '#ffffff', 0.3, 13);

  const N = sheet(W, 0.5, DOWN), n = N.g, gap = 0.34;
  n.fillStyle = L('#22362a'); n.fillRect(-0.1, 0, W + 0.2, DOWN);
  for (let x = -0.05; x < W + 0.05; x += 0.026) {
    const d = Math.abs(x - cx);
    if (d < gap) continue;
    const h = (0.12 + hash(x * 31) * 0.18) * Math.min(1, 0.45 + (d - gap) * 1.4);
    cedar(n, x, h, h * 0.32, L('#3a5a48'), L('#1c3024'));
  }
  for (let i = 0; i < 60; i++) {
    const x = hash(i * 7.3) * W;
    if (Math.abs(x - cx) < gap + 0.04) continue;
    puff(n, x, -0.03 - hash(i * 3.1) * 0.06, 0.025 + hash(i * 1.1) * 0.02, [L(['#e8783a', '#d8502c', '#f0a040'][i % 3]), L('#8a2a1e')], 1);
  }
  n.fillStyle = vgrad(n, 0, DOWN, [L('#a8a698'), L('#7a786c')]);   // the stone path on through the gap
  n.beginPath(); n.moveTo(cx - 0.2, DOWN); n.lineTo(cx - 0.035, 0); n.lineTo(cx + 0.035, 0); n.lineTo(cx + 0.2, DOWN); n.closePath(); n.fill();
  for (let y = 0.02; y < DOWN; y += 0.03 + y * 0.12) { const hw = 0.035 + (y / DOWN) * 0.165; n.strokeStyle = rgba(L('#4a4a40'), 0.5); n.lineWidth = 0.003; n.beginPath(); n.moveTo(cx - hw, y); n.lineTo(cx + hw, y); n.stroke(); }
  for (const sx of [-1, 1]) {   // stone lanterns at its mouth
    const lx = cx + sx * 0.1, ly = 0.03;
    n.fillStyle = L('#8a8a80'); n.fillRect(lx - 0.006, ly - 0.05, 0.012, 0.05); n.fillRect(lx - 0.016, ly - 0.07, 0.032, 0.02);
    n.fillStyle = rgba('#ffd890', 0.4 + 0.6 * t.lit); n.fillRect(lx - 0.008, ly - 0.068, 0.016, 0.014);
    n.fillStyle = L('#6a6a62'); n.beginPath(); n.moveTo(lx - 0.022, ly - 0.07); n.lineTo(lx, ly - 0.09); n.lineTo(lx + 0.022, ly - 0.07); n.fill();
    glows.push([lx, ly - 0.06, 0.05, '#ffc060', 'near']);
  }

  const layers = [{ c: F.c, w: W, up: UP, down: DOWN, on: 'far' }, mistArt(t, '#ffffff', [[0.06, 0.05, 0.4], [0.22, 0.07, 0.3], [0.42, 0.06, 0.2]]), { c: N.c, w: W, up: 0.5, down: DOWN, on: 'near' }];
  if (t.time !== 'night') layers.splice(1, 0, birdArt(t, L('#f4f4f0'), true, 0.05));
  if (t.lit > 0.3) layers.push(glowArt(glows, 'far'), glowArt(glows, 'near', 0.5, DOWN));
  return layers;
}

/* Cinder Springs (the Wastes): a volcano behind the mine gate, lava running down it and smoke rolling up out of it high
   into an ashen sky, embers rising; jagged crags round about, steam off the vents. */
function springs(t) {
  const { L, sky } = t, hz = sky[2], cx = W / 2, F = sheet(W, UP, DOWN), { g } = F, flows = [];
  land(g, x => 0.12 + fbm(x * 3, 5) * 0.2 + sm(x * 9, 2) * 0.05, mix(L('#4a3440'), hz, 0.45));
  haze(g, 0.4, hz, 0.35);
  land(g, x => cone(x, cx - 1.7, 0.36, 0.6, 3, 1.2), mix(L('#4a3436'), hz, 0.3));   // a smaller cone off to the left, smoking
  for (let i = 0; i < 9; i++) puff(g, cx - 1.7 + i * 0.03, -0.38 - i * 0.05, 0.03 + i * 0.006, [L('#8a7a78'), L('#4a3a3c')], 0.5 - i * 0.04);
  const crater = 0.1, top = 0.66;
  const vol = (x) => { const d = Math.abs(x - cx); return d < crater ? top - 0.02 * Math.cos(d / crater * Math.PI / 2) : top * Math.max(0, 1 - (d - crater) / 1.4) ** 1.7; };
  const body = land(g, vol, vgrad(g, -top, 0, [L('#5e4038'), L('#3a2a28'), L('#2a2022')]));
  g.save(); g.clip(body);
  g.fillStyle = rgba(L('#120a0a'), 0.3); g.fillRect(cx + 0.03, -1, 1.6, 1.6);
  for (let i = 0; i < 26; i++) {   // ridged gullies
    const x0 = cx + (hash(i * 2.3) - 0.5) * crater * 2, x1 = cx + (hash(i * 4.9) - 0.5) * 2.4;
    g.strokeStyle = rgba(L(i % 3 ? '#1a1012' : '#7a5a50'), 0.35); g.lineWidth = 0.005;
    g.beginPath(); g.moveTo(x0, -top + 0.01); g.quadraticCurveTo((x0 + x1) / 2 + 0.05, -top * 0.5, x1, 0.02); g.stroke();
  }
  g.restore();
  for (let i = 0; i < 4; i++) {   // lava flows from the rim down the flanks
    const sx = cx + (i - 1.5) * 0.06, ex = cx + (i - 1.5) * 0.42 + (hash(i * 3) - 0.5) * 0.2, pts = [];
    for (let k = 0; k <= 30; k++) { const s = k / 30, x = sx + (ex - sx) * s + Math.sin(s * 9 + i) * 0.025 * s; pts.push([x, -vol(x) * (1 - s * 0.02) + 0.004]); }
    flows.push(pts);
    g.strokeStyle = '#c03810'; g.lineWidth = 0.012; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.strokeStyle = '#ffb040'; g.lineWidth = 0.004; g.stroke();
  }
  glow(g, cx, -top, 0.3, '#ff7030', 0.5 + 0.3 * t.lit);
  g.fillStyle = '#ffd060'; g.beginPath(); g.ellipse(cx, -top + 0.01, crater * 0.8, 0.012, 0, 0, Math.PI * 2); g.fill();
  haze(g, 0.12, hz, 0.4);
  const mid = x => 0.04 + fbm(x * 3.1, 21) * 0.1;
  land(g, mid, vgrad(g, -0.14, DOWN, [L('#3a2c2c'), L('#1e1618')]));
  for (let i = 0; i < 30; i++) { const x = hash(i * 6.1) * W, y = -mid(x) * hash(i * 2.5) * 0.7; g.strokeStyle = rgba('#ff7a30', 0.4 + 0.5 * t.lit); g.lineWidth = 0.003; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.04, y + 0.01); g.lineTo(x + 0.07, y - 0.004); g.stroke(); }

  const N = sheet(W, 0.5, DOWN), n = N.g, gap = 0.36;
  n.fillStyle = L('#1a1214'); n.fillRect(-0.1, 0, W + 0.2, DOWN);
  for (let x = -0.05; x < W + 0.05; x += 0.05 + hash(x * 13) * 0.05) {   // jagged black crags
    const d = Math.abs(x - cx);
    if (d < gap) continue;
    const h = (0.08 + hash(x * 17) * 0.24) * Math.min(1, 0.4 + (d - gap) * 1.5), w = 0.04 + hash(x * 5) * 0.06;
    n.fillStyle = vgrad(n, -h, 0, [L('#4a3a38'), L('#1a1214')]);
    n.beginPath(); n.moveTo(x - w, 0.02); n.lineTo(x - w * 0.4, -h * 0.6); n.lineTo(x - w * 0.1, -h); n.lineTo(x + w * 0.3, -h * 0.7); n.lineTo(x + w * 0.5, -h * 0.75); n.lineTo(x + w, 0.02); n.fill();
    if (hash(x * 3.3) > 0.8) for (let k = 0; k < 6; k++) puff(n, x + k * 0.008, -h - k * 0.03, 0.015 + k * 0.004, [L('#f0e8e8'), L('#a09898')], 0.4 - k * 0.05);
  }
  n.fillStyle = vgrad(n, 0, DOWN, [L('#5a4a40'), L('#2a2020')]);   // the road on out
  n.beginPath(); n.moveTo(cx - 0.22, DOWN); n.lineTo(cx - 0.04, 0); n.lineTo(cx + 0.04, 0); n.lineTo(cx + 0.22, DOWN); n.closePath(); n.fill();

  // the plume: smoke drawn on a loop, rolling up through a mask the shape of a column leaning off the wind
  const P = sheet(1.4, UP, -top + 0.02, PX * 0.45), p = P.g, ph = UP - top + 0.02;
  for (let i = 0; i < 70; i++) {
    const x = 0.7 + (hash(i * 3.9) - 0.5) * 0.9, y = -top - hash(i * 7.1) * ph, r = 0.06 + hash(i * 1.7) * 0.08;
    for (const o of [-ph, 0, ph]) puff(p, x, y + o, r, [L(t.time === 'night' ? '#5a4448' : '#8a7a76'), L('#3a2e30')], 0.85);
  }
  const M = maskSheet(1.4, UP, -top + 0.02, PX * 0.25), m = M.g;
  for (let k = 0; k <= 40; k++) {
    const s = k / 40, y = -top - s * ph, w = 0.06 + s * 0.5, x = 0.7 + s * s * 0.35;
    const gr = m.createRadialGradient(x, y, 0, x, y, w);
    gr.addColorStop(0, `rgba(255,255,255,${0.9 * (1 - s * 0.7)})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    m.fillStyle = gr; m.beginPath(); m.arc(x, y, w, 0, Math.PI * 2); m.fill();
  }
  // embers, rising out of the crater
  const E = sheet(1, 1.1, -top, PX * 0.6), e = E.g, eh = 1.1 - top;
  for (let i = 0; i < 50; i++) { const x = 0.5 + (hash(i * 2.1) - 0.5) * 0.5, y = -top - hash(i * 8.3) * eh; for (const o of [-eh, 0, eh]) { e.fillStyle = i % 3 ? '#ffb040' : '#ff6020'; e.beginPath(); e.arc(x, y + o, 0.004 + hash(i) * 0.004, 0, Math.PI * 2); e.fill(); } }
  const EM = maskSheet(1, 1.1, -top, PX * 0.2);
  EM.g.fillStyle = vgrad(EM.g, -1.1, -top, ['#000', '#666', '#fff']); EM.g.beginPath(); EM.g.moveTo(0.47, -top); EM.g.lineTo(0.2, -1.1); EM.g.lineTo(0.8, -1.1); EM.g.lineTo(0.53, -top); EM.g.fill();

  const L2 = sheet(W, UP, DOWN, PX * 0.5), l = L2.g;   // the lava's glow, breathing
  for (const pts of flows) { l.strokeStyle = '#ff6a20'; l.lineWidth = 0.03; l.lineJoin = 'round'; l.beginPath(); pts.forEach(([x, y], k) => (k ? l.lineTo(x, y) : l.moveTo(x, y))); l.stroke(); }
  glow(l, cx, -top, 0.4, '#ff8030', 0.8);

  return [
    { c: F.c, w: W, up: UP, down: DOWN, on: 'far' },
    { c: L2.c, w: W, up: UP, down: DOWN, on: 'far', add: true, pulse: [0.45 + 0.25 * t.lit, 0.3, 2600, 0] },
    { c: P.c, mask: M.c, w: 1.4, up: UP, down: -top + 0.02, on: 'far', x: 0, dy: 0.035 },
    { c: E.c, mask: EM.c, w: 1, up: 1.1, down: -top, on: 'far', x: 0, dy: 0.09, add: true },
    mistArt(t, L('#a08070'), [[0.05, 0.05, 0.3], [0.2, 0.06, 0.2]], 0.015),
    { c: N.c, w: W, up: 0.5, down: DOWN, on: 'near' },
  ];
}

/* Driftwood Landing (the Sunken Ruins): open sea to the horizon, karst islands crowned with jungle, and behind the temple
   gate the drowned temple itself, a stepped pyramid rising out of the water, a rainbow over it by day; palms in front,
   gulls wheeling, the sea glittering. */
function lagoon(t) {
  const { L, sky } = t, hz = sky[2], cx = W / 2, F = sheet(W, UP, DOWN), { g } = F;
  sunMoon(g, t, cx - 0.9, 0.9);
  if (t.time === 'day' || t.time === 'dawn') {   // the rainbow
    const cols = ['#ff6060', '#ffa040', '#fff060', '#60e070', '#60a0ff', '#a070f0'];
    cols.forEach((c, i) => { g.strokeStyle = rgba(c, t.time === 'day' ? 0.16 : 0.1); g.lineWidth = 0.02; g.beginPath(); g.arc(cx + 0.1, 0.1, 1.05 - i * 0.02, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); });
  }
  g.fillStyle = vgrad(g, 0, DOWN, [L('#8ad8e0'), L('#3aa0c0'), L('#1e6a98')]); g.fillRect(-0.1, 0, W + 0.2, DOWN);
  land(g, x => Math.max(0, fbm(x * 1.4, 31) - 0.55) * 0.25, mix(L('#4a8a78'), hz, 0.55));   // low islands on the horizon
  const towers = [];
  for (let i = 0; i < 16; i++) {
    const x = (i + hash(i * 3.3)) * W / 16;
    if (Math.abs(x - cx) < 0.6) continue;
    towers.push([x, 0.18 + hash(i * 5.5) * 0.4, 0.06 + hash(i * 2.2) * 0.1, hash(i * 9.9)]);
  }
  towers.sort((a, b) => b[3] - a[3]).forEach(([x, h, w, far]) => {   // karst towers, the further the paler
    const k = 0.25 + far * 0.45, rock = mix(L('#a8b4a0'), hz, k), shade = mix(L('#6a7a6a'), hz, k), green = mix(L('#3a7a44'), hz, k);
    g.fillStyle = vgrad(g, -h, 0, [rock, shade]);
    g.beginPath(); g.moveTo(x - w * 0.35, 0.005); g.bezierCurveTo(x - w * 0.7, -h * 0.5, x - w * 0.6, -h, x, -h); g.bezierCurveTo(x + w * 0.6, -h, x + w * 0.7, -h * 0.5, x + w * 0.38, 0.005); g.fill();
    for (let j = 0; j < 7; j++) puff(g, x + (j / 6 - 0.5) * w * 0.9, -h + 0.012 - hash(x + j) * 0.02, w * 0.18, [green, mix(green, '#000000', 0.25)], 1);
    g.strokeStyle = rgba(green, 0.7); g.lineWidth = 0.003;
    for (let j = 0; j < 4; j++) { const vx = x + (hash(x * 7 + j) - 0.5) * w; g.beginPath(); g.moveTo(vx, -h + 0.02); g.lineTo(vx + 0.004, -h * (0.4 + hash(j + x) * 0.4)); g.stroke(); }
    g.fillStyle = rgba('#ffffff', 0.25); g.fillRect(x - w * 0.5, 0, w, 0.006);
  });
  // the drowned temple
  const tiers = 6, base = 0.95, tip = 0.22, tall = 0.52, stone = L('#cdbd94'), dark = L('#8a7a5a');
  for (let i = 0; i < tiers; i++) {
    const w = base - (base - tip) * i / (tiers - 1), y0 = -tall * i / tiers, y1 = y0 - tall / tiers;
    g.fillStyle = vgrad(g, y1, y0, [stone, mix(stone, dark, 0.4)]);
    g.beginPath(); g.moveTo(cx - w / 2, y0); g.lineTo(cx - w / 2 + 0.02, y1); g.lineTo(cx + w / 2 - 0.02, y1); g.lineTo(cx + w / 2, y0); g.fill();
    g.fillStyle = rgba(L('#3a2e20'), 0.22); g.beginPath(); g.moveTo(cx + w * 0.15, y0); g.lineTo(cx + w * 0.15, y1); g.lineTo(cx + w / 2 - 0.02, y1); g.lineTo(cx + w / 2, y0); g.fill();
    for (let j = 0; j < 8; j++) { const bx = cx - w / 2 + 0.02 + hash(i * 9 + j) * (w - 0.04); g.fillStyle = rgba(L('#4e8a3a'), 0.85); g.beginPath(); g.ellipse(bx, y1 + 0.004, 0.012 + hash(j + i) * 0.02, 0.008, 0, 0, Math.PI * 2); g.fill(); }
  }
  g.fillStyle = vgrad(g, -tall - 0.04, -tall, [L('#bfae84'), dark]);   // the shrine on top, its doorway lit
  g.fillRect(cx - 0.07, -tall - 0.08, 0.14, 0.08);
  g.beginPath(); g.moveTo(cx - 0.09, -tall - 0.08); g.lineTo(cx, -tall - 0.13); g.lineTo(cx + 0.09, -tall - 0.08); g.fill();
  g.fillStyle = rgba('#a0f0ff', 0.4 + 0.5 * t.lit); g.beginPath(); g.moveTo(cx - 0.022, -tall); g.lineTo(cx - 0.022, -tall - 0.04); g.arc(cx, -tall - 0.04, 0.022, Math.PI, 0); g.lineTo(cx + 0.022, -tall); g.fill();
  g.fillStyle = rgba('#ffffff', 0.5); g.fillRect(cx - base / 2 - 0.03, 0, base + 0.06, 0.005);
  for (const [dx, h] of [[-0.62, 0.12], [-0.55, 0.07], [0.58, 0.1], [0.66, 0.05]]) { g.fillStyle = vgrad(g, -h, 0, [stone, dark]); g.fillRect(cx + dx - 0.012, -h, 0.024, h); g.fillRect(cx + dx - 0.018, -h - 0.008, 0.036, 0.01); }
  for (let y = 0.01; y < 0.12; y += 0.012) { g.fillStyle = rgba(stone, 0.18 * (1 - y / 0.12)); g.fillRect(cx - base / 2 * (1 - y * 3) + Math.sin(y * 300) * 0.01, y, base * (1 - y * 3), 0.004); }   // its reflection
  haze(g, 0.12, hz, 0.35);

  const N = sheet(W, 0.55, DOWN), n = N.g, gap = 0.5;
  n.fillStyle = vgrad(n, 0, DOWN, [L('#2a8aaa'), L('#16587a')]); n.fillRect(-0.1, 0.01, W + 0.2, DOWN);
  for (let x = -0.05; x < W + 0.05; x += 0.07) {
    const d = Math.abs(x - cx);
    if (d < gap) continue;
    const k = Math.min(1, 0.4 + (d - gap) * 1.2);
    for (let j = 0; j < 4; j++) puff(n, x + j * 0.02, 0.01 - hash(x + j) * 0.02, 0.03 * k, [L('#3a8a3a'), L('#1a4a24')], 1);
    if (hash(x * 9.1) > 0.45) palm(n, x, (0.18 + hash(x * 3.7) * 0.22) * k, (hash(x * 1.3) - 0.5) * 0.5 + (x < cx ? 0.15 : -0.15), L('#6a4a30'), L('#2a6a2a'));
  }
  const glint = (seed) => {
    const S = sheet(W, 0.02, DOWN * 0.5, PX * 0.6), s = S.g;
    for (let i = 0; i < 260; i++) { const y = hash(i * 3.7 + seed) ** 2 * DOWN * 0.5, x = hash(i * 1.9 + seed) * W, len = 0.01 + (1 - y / DOWN) * 0.02; s.fillStyle = `rgba(255,255,240,${0.5 + hash(i + seed) * 0.5})`; s.fillRect(x, y, len, 0.003); }
    return { c: S.c, w: W, up: 0.02, down: DOWN * 0.5, on: 'far', add: true };
  };
  return [
    { c: F.c, w: W, up: UP, down: DOWN, on: 'far' },
    { ...glint(1), pulse: [0.45, 0.4, 1700, 0] },
    { ...glint(7), pulse: [0.45, 0.4, 1700, Math.PI] },
    mistArt(t, '#f0fcff', [[0.03, 0.03, 0.35]], 0.03),
    ...(t.time === 'night' ? [] : [birdArt(t, L('#ffffff'), true, 0.07)]),
    { c: N.c, w: W, up: 0.55, down: DOWN, on: 'near' },
  ];
}

/* Highbough (Thornwood): colossal trees fading back into a green-gold haze, and behind the vine gate the Great Tree, its
   decks ringing the trunk, ghost-lanterns hung from its crown; light falling in shafts, mist drifting, wisps rising. */
function canopy(t) {
  const { L, sky } = t, hz = sky[2], cx = W / 2, F = sheet(W, UP, DOWN), { g } = F, glows = [];
  sunMoon(g, t, cx + 1.1, 1.05);
  g.fillStyle = vgrad(g, 0, DOWN, [mix(L('#4a7a5a'), hz, 0.4), L('#1e3a2a')]); g.fillRect(-0.1, 0, W + 0.2, DOWN);
  const giant = (x, h, w, k, seed) => {   // a straight trunk to a broad umbrella crown
    const bark = mix(L('#5a5040'), hz, k), crown = mix(L('#3e7a4a'), hz, k), top = mix(L('#7ab060'), hz, k);
    g.fillStyle = vgrad(g, -h, 0, [bark, mix(bark, '#000000', 0.2)]);
    g.beginPath(); g.moveTo(x - w * 1.6, 0.01); g.quadraticCurveTo(x - w * 0.6, -0.02, x - w * 0.5, -h * 0.2); g.lineTo(x - w * 0.35, -h); g.lineTo(x + w * 0.35, -h); g.lineTo(x + w * 0.5, -h * 0.2); g.quadraticCurveTo(x + w * 0.6, -0.02, x + w * 1.6, 0.01); g.fill();
    const cw = w * 5 + hash(seed) * w * 3;
    for (let j = 0; j < 9; j++) puff(g, x + (j / 8 - 0.5) * cw, -h + 0.01 - Math.sin(j / 8 * Math.PI) * 0.03, cw * 0.11, [top, crown], 1);
    for (let j = 0; j < 5; j++) { g.strokeStyle = rgba(crown, 0.6); g.lineWidth = 0.002; const vx = x + (hash(seed + j) - 0.5) * cw * 0.8; g.beginPath(); g.moveTo(vx, -h); g.lineTo(vx, -h + 0.08 + hash(j * 3 + seed) * 0.15); g.stroke(); }
  };
  for (const [n, k, lo, hi, w] of [[14, 0.62, 0.5, 0.8, 0.03], [10, 0.38, 0.65, 1.05, 0.05]]) {
    for (let i = 0; i < n; i++) {
      const x = (i + hash(i * 3.1 + n)) * W / n;
      if (Math.abs(x - cx) < 0.55) continue;
      giant(x, lo + hash(i * 5.3 + n) * (hi - lo), w * (0.8 + hash(i) * 0.4), k, i * 7 + n);
    }
    mistBand(g, -0.2 - k * 0.3, 0.1, hz, 0.4, n);
  }
  // the Great Tree
  const tall = 1.08, bark = L('#6a5038');
  g.fillStyle = vgrad(g, -tall, 0, [L('#7a6044'), bark, L('#3a2a1e')]);
  g.beginPath(); g.moveTo(cx - 0.42, 0.02); g.quadraticCurveTo(cx - 0.17, -0.02, cx - 0.14, -0.2); g.lineTo(cx - 0.1, -tall); g.lineTo(cx + 0.1, -tall); g.lineTo(cx + 0.14, -0.2); g.quadraticCurveTo(cx + 0.17, -0.02, cx + 0.42, 0.02); g.fill();
  g.strokeStyle = rgba(L('#2a1e14'), 0.4); g.lineWidth = 0.004;
  for (let i = 0; i < 12; i++) { const x = cx - 0.1 + i * 0.018; g.beginPath(); g.moveTo(x, -0.05); g.bezierCurveTo(x + 0.01, -0.4, x - 0.01, -0.7, x + 0.005, -tall); g.stroke(); }
  for (const [y, w] of [[0.36, 0.34], [0.62, 0.28], [0.86, 0.24]]) {   // its decks
    g.fillStyle = L('#8a6a44'); g.beginPath(); g.ellipse(cx, -y, w, 0.022, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = L('#5a4028'); g.fillRect(cx - w, -y, w * 2, 0.008);
    g.strokeStyle = L('#5a4028'); g.lineWidth = 0.003; g.beginPath(); g.moveTo(cx - w, -y - 0.02); g.lineTo(cx + w, -y - 0.02); g.stroke();
    for (let k = -w; k <= w; k += 0.03) { g.beginPath(); g.moveTo(cx + k, -y); g.lineTo(cx + k, -y - 0.02); g.stroke(); }
    for (const sx of [-1, 1]) { const lx = cx + sx * (w - 0.02); g.fillStyle = rgba('#d8a8ff', 0.5 + 0.5 * t.lit); g.beginPath(); g.arc(lx, -y + 0.03, 0.008, 0, Math.PI * 2); g.fill(); glows.push([lx, -y + 0.03, 0.05, '#c080ff']); }
  }
  for (let j = 0; j < 22; j++) {   // its crown, reaching off the top
    const a = j / 21, x = cx + (a - 0.5) * 1.5, y = -tall - Math.sin(a * Math.PI) * 0.3 - hash(j * 3.1) * 0.1;
    puff(g, x, y, 0.09 + hash(j * 1.7) * 0.06, [L('#6aa058'), L('#2a5a34')], 1);
  }
  for (let j = 0; j < 14; j++) { const x = cx + (hash(j * 5.9) - 0.5) * 1.3, y = -tall + 0.02, len = 0.1 + hash(j) * 0.25; g.strokeStyle = rgba(L('#2e5a30'), 0.8); g.lineWidth = 0.003; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 0.01, y + len * 0.6, x - 0.005, y + len); g.stroke(); g.fillStyle = rgba('#e0b8ff', 0.4 + 0.6 * t.lit); if (j % 2) { g.beginPath(); g.arc(x - 0.005, y + len, 0.007, 0, Math.PI * 2); g.fill(); glows.push([x - 0.005, y + len, 0.045, '#b070ff']); } }
  mistBand(g, -0.05, 0.08, hz, 0.45, 51);

  const N = sheet(W, 0.5, DOWN), n = N.g, gap = 0.38;
  n.fillStyle = L('#1a3020'); n.fillRect(-0.1, 0, W + 0.2, DOWN);
  for (let x = -0.05; x < W + 0.05; x += 0.04) {   // big leaves and ferns
    const d = Math.abs(x - cx);
    if (d < gap) continue;
    const k = Math.min(1, 0.4 + (d - gap) * 1.4), h = (0.06 + hash(x * 23) * 0.14) * k;
    n.fillStyle = vgrad(n, -h, 0, [L('#4a8a48'), L('#1a3a20')]);
    n.beginPath(); n.moveTo(x, 0.01); n.quadraticCurveTo(x - h * 0.5, -h * 0.5, x + (hash(x) - 0.5) * h * 0.4, -h); n.quadraticCurveTo(x + h * 0.5, -h * 0.5, x, 0.01); n.fill();
    n.strokeStyle = rgba(L('#2a5a2a'), 0.9); n.lineWidth = 0.004;
    for (let j = 0; j < 3; j++) { const a = -Math.PI / 2 + (j - 1) * 0.6; n.beginPath(); n.moveTo(x, 0); n.quadraticCurveTo(x + Math.cos(a) * h * 0.5, -h * 0.6, x + Math.cos(a) * h, -h * 0.4 + Math.sin(a) * h * 0.2); n.stroke(); }
  }

  const R = sheet(W, UP, 0, PX * 0.3), r = R.g;   // shafts of light falling through
  for (let i = 0; i < 9; i++) {
    const x = (i + hash(i * 4.4)) * W / 9, w = 0.04 + hash(i * 2.1) * 0.08, lean = 0.35;
    r.fillStyle = vgrad(r, -UP, 0, [rgba('#fff4c0', 0), rgba('#fff4c0', 0.22), rgba('#fff4c0', 0)]);
    r.beginPath(); r.moveTo(x - w * 0.3, -UP); r.lineTo(x + w * 0.3, -UP); r.lineTo(x + lean + w, 0); r.lineTo(x + lean - w, 0); r.fill();
  }
  const Wp = sheet(1.6, 1.2, 0, PX * 0.5), wp = Wp.g;   // wisps drifting up round the Great Tree
  for (let i = 0; i < 26; i++) { const x = 0.1 + hash(i * 3.7) * 1.4, y = -hash(i * 6.1) * 1.2; for (const o of [-1.2, 0, 1.2]) { wp.fillStyle = i % 2 ? '#d0a0ff' : '#a0f0e0'; wp.beginPath(); wp.arc(x, y + o, 0.006 + hash(i) * 0.005, 0, Math.PI * 2); wp.fill(); } }
  const WM = maskSheet(1.6, 1.2, 0, PX * 0.2);
  WM.g.fillStyle = vgrad(WM.g, -1.2, 0, ['#000', '#fff', '#888']); WM.g.fillRect(0, -1.2, 1.6, 1.2);

  return [
    { c: F.c, w: W, up: UP, down: DOWN, on: 'far' },
    ...(t.time === 'night' ? [] : [{ c: R.c, w: W, up: UP, down: 0, on: 'far', add: true, pulse: [0.6, 0.35, 5200, 0] }]),
    mistArt(t, mix(hz, '#ffffff', 0.4), [[0.08, 0.06, 0.4], [0.3, 0.08, 0.25], [0.55, 0.06, 0.18]], 0.015),
    { c: Wp.c, mask: WM.c, w: 1.6, up: 1.2, down: 0, on: 'far', x: 0, dy: 0.04, add: true },
    { c: N.c, w: W, up: 0.5, down: DOWN, on: 'near' },
    ...(t.lit > 0.3 ? [glowArt(glows, 'far')] : []),
  ];
}

/* Sunwell Bazaar (the Savanna): a great sun (the moon at night) sitting right behind the sun gate, mesas and a far snowy
   peak across a golden plain, a caravan crossing it; acacias in front, birds going over, dust drifting. */
function bazaar(t) {
  const { L, sky } = t, hz = sky[2], cx = W / 2, F = sheet(W, UP, DOWN), { g } = F;
  const low = t.time === 'dawn' || t.time === 'dusk', night = t.time === 'night', sy = night ? -0.62 : low ? -0.2 : -0.5, sr = night ? 0.12 : low ? 0.22 : 0.16;
  if (night) {
    glow(g, cx, sy, sr * 6, '#c8d4ff', 0.3);
    g.fillStyle = '#f4f0dc'; g.beginPath(); g.arc(cx, sy, sr, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(170,165,180,0.35)'; for (const [dx, dy, k] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.3], [0.05, 0.4, 0.16], [-0.4, 0.3, 0.12]]) { g.beginPath(); g.arc(cx + dx * sr, sy + dy * sr, k * sr, 0, Math.PI * 2); g.fill(); }
  } else {
    glow(g, cx, sy, 1.2, low ? '#ff9040' : '#fff0a0', low ? 0.6 : 0.45);
    const sg = g.createRadialGradient(cx, sy, 0, cx, sy, sr);
    sg.addColorStop(0, '#fffef0'); sg.addColorStop(0.7, low ? '#ffb060' : '#fff0a0'); sg.addColorStop(1, low ? '#ff6a30' : '#ffd860');
    g.fillStyle = sg; g.beginPath(); g.arc(cx, sy, sr, 0, Math.PI * 2); g.fill();
  }
  land(g, x => cone(x, cx - 1.9, 0.58, 1.0, 13, 1.1), mix(L('#a89080'), hz, 0.45));   // the far snowy peak
  g.fillStyle = mix('#ffffff', hz, 0.3);
  g.beginPath(); g.moveTo(cx - 2.12, -0.42); g.lineTo(cx - 1.9, -0.585); g.lineTo(cx - 1.66, -0.44); g.lineTo(cx - 1.74, -0.43); g.lineTo(cx - 1.8, -0.46); g.lineTo(cx - 1.9, -0.43); g.lineTo(cx - 2.0, -0.45); g.closePath(); g.fill();
  haze(g, 0.4, hz, 0.4);
  const mesas = [];
  for (let i = 0; i < 9; i++) { const x = (i + hash(i * 3.9)) * W / 9; if (Math.abs(x - cx) < 0.35) continue; mesas.push([x, 0.1 + hash(i * 6.2) * 0.24, 0.15 + hash(i * 2.7) * 0.4, hash(i * 8.8)]); }
  mesas.sort((a, b) => b[3] - a[3]).forEach(([x, h, w, far]) => {   // flat-topped mesas, striped, the further the paler
    const k = 0.2 + far * 0.5, rock = mix(L('#c87850'), hz, k), shade = mix(L('#8a4a30'), hz, k);
    g.fillStyle = vgrad(g, -h, 0, [rock, shade]);
    g.beginPath(); g.moveTo(x - w / 2 - 0.08, 0.005); g.quadraticCurveTo(x - w / 2, -h * 0.4, x - w / 2 + 0.02, -h); g.lineTo(x + w / 2 - 0.02, -h); g.quadraticCurveTo(x + w / 2, -h * 0.4, x + w / 2 + 0.08, 0.005); g.fill();
    for (let s = 1; s < 4; s++) { g.fillStyle = rgba(mix(shade, '#000000', 0.2), 0.3); g.fillRect(x - w / 2 + 0.01, -h + h * s / 4, w - 0.02, 0.005); }
    g.fillStyle = rgba(mix(shade, '#000000', 0.3), 0.3); g.beginPath(); g.moveTo(x + w * 0.15, -h); g.lineTo(x + w / 2 - 0.02, -h); g.quadraticCurveTo(x + w / 2, -h * 0.4, x + w / 2 + 0.08, 0.005); g.lineTo(x + w * 0.2, 0.005); g.fill();
  });
  haze(g, 0.15, hz, 0.4);
  g.fillStyle = vgrad(g, 0, DOWN, [L('#e8c878'), L('#c8a050'), L('#9a7838')]); g.fillRect(-0.1, 0, W + 0.2, DOWN);
  for (let i = 0; i < 40; i++) { const x = hash(i * 2.3 + 9) * W; if (Math.abs(x - cx) < 0.12) continue; acacia(g, x, 0.025 + hash(i * 4.1) * 0.03, 0.04 + hash(i) * 0.03, L('#6a5030'), mix(L('#6a7a30'), hz, 0.2)); }
  for (let i = 0; i < 7; i++) {   // a caravan on the horizon
    const x = cx + 0.7 + i * 0.035, y = -0.002;
    g.fillStyle = L('#5a4028');
    g.beginPath(); g.ellipse(x, y - 0.012, 0.011, 0.006, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(x - 0.002, y - 0.018, 0.004, 0.004, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(x + 0.008, y - 0.022, 0.002, 0.01); g.fillRect(x + 0.007, y - 0.024, 0.006, 0.003);
    g.fillRect(x - 0.008, y - 0.008, 0.002, 0.009); g.fillRect(x + 0.006, y - 0.008, 0.002, 0.009);
  }

  const N = sheet(W, 0.5, DOWN), n = N.g, gap = 0.4;
  n.fillStyle = vgrad(n, 0, DOWN, [L('#b89040'), L('#7a5a28')]); n.fillRect(-0.1, 0, W + 0.2, DOWN);
  for (let x = -0.05; x < W + 0.05; x += 0.012) { if (Math.abs(x - cx) < gap) continue; const h = 0.02 + hash(x * 71) * 0.04; n.strokeStyle = L(hash(x * 13) > 0.5 ? '#d8b860' : '#a88838'); n.lineWidth = 0.004; n.beginPath(); n.moveTo(x, 0.01); n.quadraticCurveTo(x + 0.005, -h * 0.5, x + 0.012, -h); n.stroke(); }
  for (let i = 0; i < 12; i++) { const x = (i + hash(i * 5.7)) * W / 12, d = Math.abs(x - cx); if (d < gap + 0.05) continue; const h = 0.18 + hash(i * 3.3) * 0.18; acacia(n, x, h, h * 1.6, L('#4a3420'), L('#4a5a24')); }
  n.fillStyle = vgrad(n, 0, DOWN, [L('#e0c890'), L('#b8985a')]);   // the road on
  n.beginPath(); n.moveTo(cx - 0.22, DOWN); n.lineTo(cx - 0.03, 0); n.lineTo(cx + 0.03, 0); n.lineTo(cx + 0.22, DOWN); n.closePath(); n.fill();

  const Gs = sheet(W, UP, DOWN, PX * 0.3);   // the sun's own glow, breathing
  if (night) glow(Gs.g, cx, sy, 0.8, '#b8c8ff', 0.35); else glow(Gs.g, cx, sy, 1.0, low ? '#ff8030' : '#fff0b0', 0.5);
  return [
    { c: Gs.c, w: W, up: UP, down: DOWN, on: 'far', add: true, pulse: [0.5, 0.25, 4400, 0] },
    { c: F.c, w: W, up: UP, down: DOWN, on: 'far' },
    mistArt(t, L('#f0d8a0'), [[0.03, 0.04, 0.45], [0.12, 0.05, 0.25]], 0.04),
    ...(night ? [] : [birdArt(t, L('#2a2420'), false, 0.06)]),
    { c: N.c, w: W, up: 0.5, down: DOWN, on: 'near' },
  ];
}

/** Lantern light and the like: a soft glow at each point, added on and breathing. */
function glowArt(glows, on, up = UP, down = DOWN) {
  const S = sheet(W, up, down, PX * 0.5);
  for (const [x, y, r, hex, which = 'far'] of glows) if (which === on) glow(S.g, x, y, r, hex, 0.55);
  return { c: S.c, w: W, up, down, on, add: true, pulse: [0.75, 0.25, 1900, on === 'near' ? 1 : 0] };
}

const TOWNS = { village, springs, lagoon, canopy, bazaar };

/* ---------- in the scene ---------- */

/** The backdrop for a town of `style` at `time`: `rig` to add to the room, `top` its sky's top colour (the room's
    background), `tick(now, dt)` to drift and breathe it, and `place(camera, k, bendZ, gateX, backZ)` every frame once
    the camera has moved, which hangs it on the rolled ground's crest and lines its landmark up behind the gate. */
export function townBackdrop(THREE, texOf, style, time) {
  const sky = (SKIES[style] || SKIES.village)[time], grade = time === 'day' ? null : GRADES[time].land;
  const t = { time, sky, lit: LIT[time], L: (h) => (grade ? gradeHex(h, grade) : h) };
  const layers = [skyArt(t), cloudArt(t, style), ...(TOWNS[style] || village)(t)];
  const rig = new THREE.Group(), v = new THREE.Vector3(), shift = { sky: 0, far: 0, near: 0 };
  rig.userData.noBend = true;
  layers.forEach((l, i) => {
    const map = texOf(l.c);
    if (l.wrap) map.wrapS = THREE.RepeatWrapping;
    if (l.dy) map.wrapT = THREE.RepeatWrapping;
    const mat = new THREE.MeshBasicMaterial({ map, alphaMap: l.mask ? texOf(l.mask) : null, transparent: true, depthWrite: false, fog: false, toneMapped: false, blending: l.add ? THREE.AdditiveBlending : THREE.NormalBlending });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l.w, l.up + l.down).translate(0, (l.up - l.down) / 2, 0), mat);
    m.renderOrder = -40 + i;
    m.frustumCulled = false;
    m.userData.noBend = true;
    m.raycast = () => {};
    rig.add(m);
    Object.assign(l, { m, ox: 0, oy: 0 });
  });
  return {
    rig,
    top: sky[0],
    tick(now, dt) {
      for (const l of layers) {
        if (l.dx) l.ox = (l.ox - l.dx * dt / 1000 / l.w) % 1;
        if (l.dy) l.m.material.map.offset.y = l.oy = (l.oy - l.dy * dt / 1000 / (l.up + l.down)) % 1;
        if (l.pulse) l.m.material.opacity = l.pulse[0] + l.pulse[1] * Math.sin(now / l.pulse[2] * Math.PI * 2 + l.pulse[3]);
      }
    },
    place(camera, k, bendZ, gateX, backZ) {
      let crest = -2;
      for (let i = 0; i <= 24; i++) {   // the highest the rolled ground reaches on screen, from the bend's focus to the back
        const z = bendZ + (backZ - bendZ) * i / 24, s = z - bendZ;
        v.set(camera.position.x, -k * s * s, z).project(camera);
        if (v.y > crest) crest = v.y;
      }
      const sc = Math.min(0.85, Math.max(0.42, 1 - crest)), a = camera.aspect;
      v.set(0, 0, -DEPTH).applyMatrix4(camera.projectionMatrix);
      v.set(0, crest, v.z).unproject(camera);
      rig.position.copy(v);
      rig.quaternion.copy(camera.quaternion);
      rig.scale.setScalar(DEPTH * Math.tan(camera.fov * Math.PI / 360) * sc);
      v.set(gateX, 0, backZ).project(camera);
      const room = Math.max(0, W / 2 - a / sc), want = v.x * a / sc;
      shift.far = clamp(want * FAR, room); shift.near = clamp(want, room);
      for (const l of layers) {
        if (l.wrap) l.m.material.map.offset.x = l.ox - shift[l.on] * l.par / l.w;
        else l.m.position.x = shift[l.on] + (l.x || 0);
      }
    },
  };
}
