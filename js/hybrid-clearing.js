/* ============================================================
   hybrid-clearing.js  -  the Clearing's own light in the hybrid look
   (js/hybrid-light.js lights every biome): soft beams through the
   Deep Woods' and the Ancient Tree's canopy, and the boss prelude's
   heartwood, sap, rays, burst and shock ring as bloom.
   ============================================================ */

import { glow, dot } from './smooth-clearing.js';

const TAU = Math.PI * 2;
const BLOOM_AT = 20;   // must match scene.js: the heartwood bursts this many ticks into the wake
const WHITE = '#fffce8';

const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (h, a = 1) => { const [r, g, b] = rgb(h); return `rgba(${r}, ${g}, ${b}, ${a})`; };
const noise = (a, b, c) => { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/** The giant tree's numbers, rounded as scene.js's clearingTree() and trunkLean() round them. */
function treeOf(W, horizon) {
  const cx = Math.round(W * 0.5), half = Math.max(10, Math.round(Math.min(W * 0.16, horizon * 0.52)));
  return { cx, half, foot: horizon + 3, hx: cx - Math.round(half * 0.2), hy: Math.round(horizon * 0.62) };
}
const leanAt = (y, half, horizon) => Math.round(Math.sin(y / Math.max(5, horizon * 0.12)) * Math.min(3, half * 0.08));

export const clearingLight = {
  build(art) {
    art.tree = treeOf(art.W, art.horizon);
    art.beams = art.stage >= 2 ? (art.raw.stars ? 0.55 : 1) : 0;
  },
  draw(g, art, env, dim) {
    if (art.beams) beams(g, art, env.t, dim);
    const { prelude } = env;
    if (!prelude) return;
    if (prelude.phase === 'wake') wake(g, art, prelude.age, env.calm);
    else if (prelude.phase === 'portal') portal(g, art, prelude.age, env.calm);
    else if (prelude.phase === 'awake') awake(g, art, prelude.age);
  },
};

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
