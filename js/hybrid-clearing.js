/* ============================================================
   hybrid-clearing.js  -  the Clearing in "HD-2D" (Octopath
   Traveler's look): the pixel scene exactly as it is, with only the
   light drawn smooth over it. Behind the ?hybrid switch (saved per
   device like ?smooth; ?pixel turns both off).

   js/scene.js paints its pixels on #scene-bg as always; this file
   paints #scene-light, a full-resolution canvas laid over it with
   `mix-blend-mode: screen` (css/screens.css), so it can only ever
   add light. It draws in the pixel scene's own units over the same
   `life` (the fireflies, the pollen, the stars), so every glow sits
   on the pixel it belongs to.
   ============================================================ */

import { glow, dot } from './smooth-clearing.js';

const TAU = Math.PI * 2;
const BLOOM_AT = 20;   // must match scene.js: the heartwood bursts this many ticks into the wake
const WHITE = '#fffce8';

const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (h, a = 1) => { const [r, g, b] = rgb(h); return `rgba(${r}, ${g}, ${b}, ${a})`; };
const noise = (a, b, c) => { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/* The light of each hour: a wash from the sun's (or moon's) side and a faint one over everything. */
const TINT = {
  dawn: { side: '#ff9e78', sideA: 0.32, all: '#ffb48a', allA: 0.08, top: '#d888c0', topA: 0.12 },
  day: { side: '#fff0b0', sideA: 0.1, all: '#fff4d0', allA: 0.02 },
  dusk: { side: '#ff7a38', sideA: 0.4, all: '#ff9450', allA: 0.1, top: '#b04c8c', topA: 0.14 },
  night: { side: '#7088d8', sideA: 0.1, all: '#3048a0', allA: 0.03 },
};

/** The giant tree's numbers, rounded as scene.js's clearingTree() and trunkLean() round them. */
function treeOf(W, horizon) {
  const cx = Math.round(W * 0.5), half = Math.max(10, Math.round(Math.min(W * 0.16, horizon * 0.52)));
  return { cx, half, foot: horizon + 3, hx: cx - Math.round(half * 0.2), hy: Math.round(horizon * 0.62) };
}
const leanAt = (y, half, horizon) => Math.round(Math.sin(y / Math.max(5, horizon * 0.12)) * Math.min(3, half * 0.08));

/**
 * Build what stays still: the haze over the far hills and the hour's tint. `env`: { W, H, horizon (scene units), cw, ch
 * (canvas pixels), raw (the look), time, base (the still pixels, packed), far (Map of packed colour -> haze weight:
 * the hills' colours, so the haze settles on them and never on the trees in front), sun / moon ({ x, y, r } or null) }.
 */
export function buildLight(env) {
  const { W, H, horizon, cw, ch, raw, time, base, far } = env;
  const art = { W, H, horizon, cw, ch, raw, time, stage: raw.stage ?? 0, sun: env.sun, moon: env.moon, tree: treeOf(W, horizon) };
  art.firefly = raw.firefly || ['#fff8a0', '#c8e040'];
  art.pollen = raw.pollen || ['#f8f0b0', '#f8d870'];
  art.beams = art.stage >= 2 ? (raw.stars ? 0.55 : 1) : 0;

  const still = document.createElement('canvas');
  still.width = cw; still.height = ch;
  const g = still.getContext('2d');

  // the haze: a mask the size of the pixel scene, scaled up smooth, so it lies on the far hills with soft edges
  const mask = document.createElement('canvas');
  mask.width = W; mask.height = H;
  const m = mask.getContext('2d'), data = m.createImageData(W, H), d = data.data;
  const [hr, hg, hb] = rgb(raw.sky[raw.sky.length - 1]).map(v => Math.round(v + (255 - v) * 0.3));
  for (let y = 0; y < Math.min(H, horizon + 2); y++) {
    const low = clamp(1 - (horizon - y) / 22);   // thicker near the horizon, as air is
    for (let x = 0; x < W; x++) {
      const w = far.get(base[y * W + x]);
      if (!w) continue;
      const i = (y * W + x) * 4;
      d[i] = hr; d[i + 1] = hg; d[i + 2] = hb; d[i + 3] = Math.round(255 * w * (0.25 + 0.75 * low) * (raw.stars ? 0.45 : 0.6));
    }
  }
  m.putImageData(data, 0, 0);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(mask, 0, 0, cw, ch);

  g.setTransform(cw / W, 0, 0, ch / H, 0, 0);
  const tint = TINT[time] || TINT.day, light = art.sun || art.moon;
  if (tint.all) { g.fillStyle = rgba(tint.all, tint.allA); g.fillRect(0, 0, W, H); }
  if (tint.top) {
    const top = g.createLinearGradient(0, 0, 0, horizon);
    top.addColorStop(0, rgba(tint.top, tint.topA)); top.addColorStop(1, rgba(tint.top, 0));
    g.fillStyle = top;
    g.fillRect(0, 0, W, horizon);
  }
  const sx = light ? light.x : W * 0.86, sy = light ? light.y : horizon * 0.5;
  glow(g, sx, sy, Math.max(W, H) * 0.9, tint.side, tint.sideA, Math.max(W, H) * 0.7);
  art.still = still;
  return art;
}

/**
 * Draw one frame of light. `env`: { t (the scenery's clock), DT, life, storm, prelude ({ phase, age } or null), calm,
 * dx, dy (the pixel picture's shake, in scene units), sunSeen / moonSeen (0..1: how much of the disc isn't hidden by a
 * cloud or a tree), open(x, y) (is that pixel still sky) }.
 */
export function drawLight(ctx, art, env) {
  const { W, H, horizon, cw, ch } = art, { t, life, storm, prelude } = env;
  const sx = cw / W, sy = ch / H, dim = 1 - 0.75 * (storm?.level || 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, cw, ch);
  ctx.globalAlpha = dim;
  ctx.drawImage(art.still, env.dx * sx, env.dy * sy);
  ctx.globalAlpha = 1;
  ctx.setTransform(sx, 0, 0, sy, env.dx * sx, env.dy * sy);
  ctx.globalCompositeOperation = 'lighter';

  if (art.sun && env.sunSeen > 0) {
    const { x, y, r } = art.sun, k = (0.85 + 0.15 * Math.sin(t / 10)) * env.sunSeen * dim, [, rim, halo] = art.raw.sun;
    glow(ctx, x + 0.5, y + 0.5, r * 9, halo, 0.22 * k);
    glow(ctx, x + 0.5, y + 0.5, r * 3.2, rim, 0.45 * k);
    glow(ctx, x + 0.5, y + 0.5, r * 1.4, WHITE, 0.5 * k);
  }
  if (art.moon && env.moonSeen > 0) {
    const { x, y, r } = art.moon, k = env.moonSeen * dim;
    glow(ctx, x + 0.5, y + 0.5, r * 7, '#8aa0ff', 0.14 * k);
    glow(ctx, x + 0.5, y + 0.5, r * 2.6, '#e8ecff', 0.32 * k);
  }
  if (life.stars) for (const s of life.stars) {
    const b = Math.sin((t + s.phase) / 6);
    if (b > 0.5 && env.open(s.x, s.y)) dot(ctx, s.x + 0.5, s.y + 0.5, 1.6 + (b - 0.5) * 3, '#c8d4ff', (b - 0.5) * 1.4 * dim);
  }
  if (art.beams) beams(ctx, art, t, dim);
  if (life.fireflies) fireflies(ctx, art, t, life.fireflies);
  if (life.motes) pollen(ctx, art, t, life.motes, dim);
  if (prelude) {
    if (prelude.phase === 'wake') wake(ctx, art, prelude.age, env.calm);
    else if (prelude.phase === 'portal') portal(ctx, art, prelude.age, env.calm);
    else if (prelude.phase === 'awake') awake(ctx, art, prelude.age);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Light through the canopy, where scene.js's lightShafts() dithers its bands, as soft beams breathing in and out, dust
    turning in them. */
function beams(g, art, t, dim) {
  const { W, H, horizon, raw } = art, low = horizon + Math.round((H - horizon) * 0.5), k = art.beams * dim;
  const colour = raw.stars ? '#c8d8ff' : '#fff2c0';
  for (let c = -Math.ceil(low * 0.45 / 38) * 38; c < W + 38; c += 38) {
    const a = (0.13 + 0.06 * Math.sin(t / 9 + c / 17)) * k;
    const gr = g.createLinearGradient(c, 0, c + low * 0.45, low);
    gr.addColorStop(0, rgba(colour, a * 0.5)); gr.addColorStop(0.35, rgba(colour, a)); gr.addColorStop(1, rgba(colour, 0));
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(c - 1.5, 0); g.lineTo(c + 6.5, 0);
    g.lineTo(c + 6.5 + low * 0.45 + 4, low); g.lineTo(c - 1.5 + low * 0.45 - 2, low);
    g.closePath();
    g.fill();
    g.fillStyle = rgba(colour, a * 0.9);   // the bright core of the beam
    g.beginPath();
    g.moveTo(c + 1, 0); g.lineTo(c + 3.5, 0); g.lineTo(c + 3.5 + low * 0.45, low); g.lineTo(c + 1 + low * 0.45, low);
    g.closePath();
    g.globalAlpha = 0.5;
    g.fill();
    g.globalAlpha = 1;
    for (let i = 0; i < 5; i++) {   // dust caught in it
      const u = ((t * 0.006 + noise(c, i, 3)) % 1), y = u * low, x = c + 2.5 + y * 0.45 + Math.sin(t / 7 + i * 2) * 2;
      const s = Math.sin(t / 5 + i * 1.7 + c);
      if (s > 0) dot(g, x, y, 0.9, colour, s * 0.7 * k * (1 - u));
    }
  }
}

/** The fireflies as scene.js moves them, each a warm glow round its pixel. */
function fireflies(g, art, t, list) {
  const { W } = art, [hot, warm] = art.firefly;
  for (const f of list) {
    const x = f.x + Math.sin((t + f.phase) / 11) * 5 + t * f.drift % W, y = f.y + Math.sin((t + f.phase) / 7) * 3;
    const xx = ((x % W) + W) % W, b = Math.sin((t + f.phase) / 4);
    if (b <= 0.1) continue;
    const cx = Math.floor(xx) + 0.5, cy = Math.floor(y) + 0.5;
    dot(g, cx, cy, 2 + b * 3.5, warm, 0.45 * b);
    dot(g, cx, cy, 1 + b, hot, 0.8 * b);
  }
}

/** The pollen (scene.js has already moved it this frame), a soft gold glow on each lit mote. */
function pollen(g, art, t, list, dim) {
  const [lit, warm] = art.pollen;
  for (const m of list) {
    const s = Math.sin((t + m.phase) / 5);
    if (s <= 0.2) continue;
    const cx = Math.floor(m.x) + 0.5, cy = Math.floor(m.y) + 0.5;
    dot(g, cx, cy, 1.4 + s, warm, 0.35 * s * dim);
    if (s > 0.8) dot(g, cx, cy, 0.8, lit, 0.6 * dim);
  }
}

/* ---------- the boss prelude's light (scene.js's drawClearingAwakening() / drawClearingPortal()) ---------- */

function veinAt(art, i, y) {
  const { horizon } = art, { cx, half } = art.tree, x0 = (i / 5 - 0.5) * half * 1.5;
  return cx + leanAt(y, half, horizon) + Math.round(x0 + Math.sin(y * 0.3 + i * 2.1) * 1.6) + 0.5;
}

function heartBloom(g, art, r, k = 1) {
  const { hx, hy } = art.tree;
  glow(g, hx + 0.5, hy + 0.5, r * 4, '#f8f070', 0.35 * k, r * 5);
  glow(g, hx + 0.5, hy + 0.5, r * 1.6, WHITE, 0.6 * k, r * 2.2);
}

function wake(g, art, age, calm) {
  const { W, H, horizon } = art, { foot, hx, hy } = art.tree, [, warm] = art.firefly;
  // the sap climbing the trunk glows, brightest at its tip
  const reach = Math.min(1, age / 16);
  for (let i = 0; i < 6; i++) {
    const top = Math.round(foot * (1 - clamp(reach * 1.3 - noise(i, 31, 0) * 0.3)));
    for (let y = foot; y >= top; y -= 3) dot(g, veinAt(art, i, y), y, 2.6, warm, 0.18);
    dot(g, veinAt(art, i, top), top, 4, WHITE, 0.55);
  }
  const e = age - BLOOM_AT;
  if (e < 0) {
    const s = age / BLOOM_AT, beat = Math.max(0, Math.sin(age * (0.8 + s * 2.2))), r = 3 + s * 8 + beat * (2 + s * 4);
    for (let i = 0; i < 48; i++) {   // the motes of light spiralling into the heartwood
      const a = age - i * 0.35;
      if (a < 0) continue;
      const lap = (a / 9) | 0, u = (a % 9) / 9, gx = noise(i, lap, 55) * W, gy = horizon + 4 + noise(i, lap, 56) * (H - horizon - 4);
      const swirl = Math.sin(u * 7 + i) * (1 - u) * 8, x = gx + (hx - gx) * u * u + swirl, y = gy + (hy - gy) * u * u;
      dot(g, Math.floor(x) + 0.5, Math.floor(y) + 1, 2.2 + u * 1.5, '#f8f8a0', 0.4 + u * 0.4);
    }
    if (s > 0.4) for (let k = 0; k < 10; k++) {   // its rays, as god rays
      const ang = k * Math.PI / 5 + age * 0.15, len = (s - 0.4) / 0.6 * W * 0.5;
      const gr = g.createRadialGradient(hx, hy, r, hx, hy, len);
      gr.addColorStop(0, 'rgba(255, 250, 210, 0.3)'); gr.addColorStop(1, 'rgba(255, 250, 210, 0)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(hx + 0.5, hy + 0.5);
      g.lineTo(hx + Math.cos(ang - 0.07) * len, hy + Math.sin(ang - 0.07) * len * 0.8);
      g.lineTo(hx + Math.cos(ang + 0.07) * len, hy + Math.sin(ang + 0.07) * len * 0.8);
      g.closePath(); g.fill();
    }
    heartBloom(g, art, r, 0.6 + s * 0.6);
    return;
  }
  // the burst: a bloom of white over everything, a glowing shock ring, then the great blossom's own light
  const flash = Math.max(0, 1 - e / 3) * (calm ? 0.25 : 1);
  if (flash > 0) glow(g, hx + 0.5, hy + 0.5, Math.max(W, H) * 1.1, WHITE, 0.7 * flash, Math.max(W, H) * 0.9);
  const ring = e * W * 0.13, fade = clamp(1 - e / 10);
  if (ring > 1 && fade > 0) {
    g.strokeStyle = rgba('#f8f8a0', 0.25 * fade); g.lineWidth = 4;
    g.beginPath(); g.ellipse(hx + 0.5, hy + 4.5, ring, ring * 0.45, 0, 0, TAU); g.stroke();
    g.strokeStyle = rgba(WHITE, 0.5 * fade); g.lineWidth = 1.2; g.stroke();
  }
  const big = Math.round(Math.min(W * 0.3, H * 0.28)), open = Math.min(1, (e + 1) / 3) ** 0.7;
  glow(g, hx + 0.5, hy + 0.5, big * open * 1.8, '#ffc4dc', 0.35);
  heartBloom(g, art, Math.max(2, 5 - e * 0.4), 1);
}

function portal(g, art, age, calm) {
  const { W, H } = art, { hx, hy } = art.tree, frame = age | 0;
  if ((frame === 6 || frame === 8) && !calm) return;   // scene.js's white-out frames
  const big = Math.round(Math.min(W * 0.3, H * 0.28)) * (1 + age * 0.12);
  glow(g, hx + 0.5, hy + 0.5, big * 1.6, '#ffc4dc', 0.4);
  heartBloom(g, art, 4 + age * 0.6, 1);
  glow(g, hx + 0.5, hy + 0.5, Math.max(W, H), WHITE, clamp(age / 6) * (calm ? 0.12 : 0.35), Math.max(W, H) * 0.8);
}

function awake(g, art, age) {
  const { foot } = art.tree, [hot, warm] = art.firefly;
  for (let i = 0; i < 6; i++) for (let y = foot; y >= 0; y--) {   // the pulses of sap still rising
    if ((y + age * 3 + i * 7) % 18 >= 2) continue;
    dot(g, veinAt(art, i, y), y + 0.5, 2.4, warm, 0.4);
    dot(g, veinAt(art, i, y), y + 0.5, 1, hot, 0.6);
    y -= 2;
  }
  heartBloom(g, art, 3 + (Math.sin(age * 0.75) + 1), 0.8);
}
