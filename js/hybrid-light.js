/* ============================================================
   hybrid-light.js  -  every biome in "HD-2D" (Octopath Traveler's
   look): the pixel scene exactly as it is, with only the light drawn
   smooth over it. Behind the ?hybrid switch (saved per device;
   ?pixel turns it off).

   js/scene.js paints its pixels on #scene-bg as always; this file
   paints #scene-light, a full-resolution canvas laid over it with
   `mix-blend-mode: screen` (css/screens.css), so it can only ever
   add light. It draws in the pixel scene's own units over the same
   `life` (the fireflies, the pollen, the stars), so every glow sits
   on the pixel it belongs to. What glows in a biome needs no code
   of its own: every pixel painted in one of the look's glowing
   colours (lava, lanterns, crystals, runes, spores: scene.js's
   GLOWS) blooms, read from the frame itself, preludes included.
   The Clearing adds its own beams and prelude (js/hybrid-clearing.js).
   ============================================================ */

import { glow, dot } from './smooth-clearing.js';
import { clearingLight } from './hybrid-clearing.js';

const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const rgba = (h, a = 1) => { const [r, g, b] = rgb(h); return `rgba(${r}, ${g}, ${b}, ${a})`; };
export const noise = (a, b, c) => { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); };
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const WHITE = '#fffce8';

/* The biomes' own light on top of what every biome gets. */
const EXTRA = { hills: clearingLight };

/* The light of each hour: a wash from the sun's (or moon's) side and a faint one over everything. */
const TINT = {
  dawn: { side: '#ff9e78', sideA: 0.32, all: '#ffb48a', allA: 0.08, top: '#d888c0', topA: 0.12 },
  day: { side: '#fff0b0', sideA: 0.1, all: '#fff4d0', allA: 0.02 },
  dusk: { side: '#ff7a38', sideA: 0.4, all: '#ff9450', allA: 0.1, top: '#b04c8c', topA: 0.14 },
  night: { side: '#7088d8', sideA: 0.1, all: '#3048a0', allA: 0.03 },
};
/* Under a roof (the Crystal Depths) there is no hour, only the glow of what's in it. */
const UNDERGROUND = new Set(['depths']);
/* Glowing keys that don't bloom here: the sun has its own, and these are pale enough to be clouds, chalk or snow too. */
const NO_BLOOM = new Set(['sun', 'daylight', 'steam', 'chalk', 'storm', 'coin', 'hp', 'heart', 'wish', 'firefly', 'pollen']);
const lum = ([r, g, b]) => (r * 0.3 + g * 0.55 + b * 0.15) / 255;

/** Every colour the look paints under a glowing key, with how hard it blooms (its brightest blooms most, its dark rims not at all). */
function emissive(raw, glows, abgr) {
  const out = new Map();
  const walk = (v, lit) => {
    if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) {
      const l = lum(rgb(v));
      if (lit && l > 0.42) out.set(abgr(v), Math.max(out.get(abgr(v)) || 0, clamp((l - 0.42) / 0.4)));
    } else if (Array.isArray(v)) v.forEach(x => walk(x, lit));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
      if (k === 'pad' || k === 'life' || k === 'kinds' || k === 'times') continue;
      walk(x, lit || (glows.has(k) && !NO_BLOOM.has(k)));
    }
  };
  walk(raw, false);
  return out;
}

/**
 * Build what stays still: the haze over the far hills and the hour's tint. `env`: { W, H, horizon (scene units), cw, ch
 * (canvas pixels), raw (the look), time, base (the still pixels, packed), far (Map of packed colour -> haze weight: the
 * hills' colours, so the haze settles on them and never on the trees in front), sun / moon ({ x, y, r } or null),
 * glows (scene.js's GLOWS), abgr (its colour packer), skyShare (0..1: how much of the picture is open sky) }.
 */
export function buildLight(env) {
  const { W, H, horizon, cw, ch, raw, base, far } = env;
  const under = UNDERGROUND.has(raw.backdrop), time = under ? null : env.time;
  const art = { W, H, horizon, cw, ch, raw, time, stage: raw.stage ?? 0, sun: env.sun, moon: env.moon, haze: raw.light === 'haze' };
  art.firefly = raw.firefly || ['#fff8a0', '#c8e040'];
  art.pollen = raw.pollen || ['#f8f0b0', '#f8d870'];
  art.bloom = emissive(raw, env.glows, env.abgr);
  art.bloomK = under ? 1 : { night: 1, dusk: 0.85, dawn: 0.75 }[time] ?? 0.55;
  art.extra = EXTRA[raw.backdrop] || null;
  art.mask = Object.assign(document.createElement('canvas'), { width: W, height: H });
  art.maskData = art.mask.getContext('2d').createImageData(W, H);
  art.mask32 = new Uint32Array(art.maskData.data.buffer);
  art.wide = Object.assign(document.createElement('canvas'), { width: Math.max(1, W >> 2), height: Math.max(1, H >> 2) });
  art.mid = Object.assign(document.createElement('canvas'), { width: Math.max(1, W >> 1), height: Math.max(1, H >> 1) });

  const still = document.createElement('canvas');
  still.width = cw; still.height = ch;
  const g = still.getContext('2d');

  if (far.size && raw.sky) {
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
  }

  g.setTransform(cw / W, 0, 0, ch / H, 0, 0);
  // the Clearing's open meadow takes the hour's full wash; the other biomes paint their own hours richer, so half of it
  const tint = time && TINT[time], light = art.sun || art.moon, tk = raw.backdrop === 'hills' ? 1 : 0.45 * clamp(env.skyShare * 2.5);   // under a roof of leaves, little of the hour gets in
  if (tint) {
    if (tint.all) { g.fillStyle = rgba(tint.all, tint.allA * tk); g.fillRect(0, 0, W, H); }
    if (tint.top) {
      const top = g.createLinearGradient(0, 0, 0, horizon);
      top.addColorStop(0, rgba(tint.top, tint.topA * tk)); top.addColorStop(1, rgba(tint.top, 0));
      g.fillStyle = top;
      g.fillRect(0, 0, W, horizon);
    }
    const sx = light ? light.x : W * 0.86, sy = light ? light.y : horizon * 0.5;
    glow(g, sx, sy, Math.max(W, H) * 0.9, tint.side, tint.sideA * tk, Math.max(W, H) * 0.7);
  }
  art.still = still;
  art.extra?.build?.(art);
  return art;
}

/**
 * Draw one frame of light. `env`: { t (the scenery's clock), DT, life, storm, prelude ({ phase, age } or null), calm,
 * dx, dy (the pixel picture's shake, in scene units), px (this frame's pixels, packed), sunSeen / moonSeen (0..1: how
 * much of the disc isn't hidden by a cloud or a tree), open(x, y) (is that pixel still sky) }.
 */
export function drawLight(ctx, art, env) {
  const { W, H, cw, ch } = art, { t, life, storm } = env;
  const sx = cw / W, sy = ch / H, dim = 1 - 0.75 * (storm?.level || 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, cw, ch);
  ctx.globalAlpha = dim;
  ctx.drawImage(art.still, env.dx * sx, env.dy * sy);
  ctx.globalAlpha = 1;
  bloom(ctx, art, env);
  ctx.setTransform(sx, 0, 0, sy, env.dx * sx, env.dy * sy);
  ctx.globalCompositeOperation = 'lighter';

  if (art.sun && env.sunSeen > 0) {
    const { x, y, r } = art.sun, k = (0.85 + 0.15 * Math.sin(t / 10)) * env.sunSeen * dim * (art.haze ? 0.55 : 1);
    const [, rim, halo] = art.raw.sun;
    glow(ctx, x + 0.5, y + 0.5, r * (art.haze ? 12 : 9), halo, 0.22 * k);
    glow(ctx, x + 0.5, y + 0.5, r * 3.2, rim, 0.45 * k);
    if (!art.haze) glow(ctx, x + 0.5, y + 0.5, r * 1.4, WHITE, 0.5 * k);
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
  art.extra?.draw?.(ctx, art, env, dim);
  if (life.fireflies) fireflies(ctx, art, t, life.fireflies);
  if (life.motes) pollen(ctx, art, t, life.motes, dim);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Every glowing pixel on screen this frame, laid over itself softly (a halo a pixel or two wide) and again spread wide
    (the bloom), so lava, lanterns, crystals and runes light the air round them. */
function bloom(ctx, art, env) {
  if (!art.bloom.size) return;
  const { W, H, cw, ch, mask32, bloom: lit } = art, px = env.px;
  let any = false;
  for (let i = 0, n = W * H; i < n; i++) {
    const w = lit.get(px[i]);
    if (!w) { mask32[i] = 0; continue; }
    any = true;
    const a = Math.round(255 * w);
    mask32[i] = ((a << 24) | (px[i] & 0xffffff)) >>> 0;
  }
  if (!any) return;
  art.mask.getContext('2d').putImageData(art.maskData, 0, 0);
  const mid = art.mid.getContext('2d'), wide = art.wide.getContext('2d');
  mid.imageSmoothingEnabled = wide.imageSmoothingEnabled = true;
  mid.clearRect(0, 0, art.mid.width, art.mid.height);
  mid.drawImage(art.mask, 0, 0, art.mid.width, art.mid.height);
  wide.clearRect(0, 0, art.wide.width, art.wide.height);
  wide.drawImage(art.mid, 0, 0, art.wide.width, art.wide.height);
  const ox = env.dx * cw / W, oy = env.dy * ch / H, k = art.bloomK * (1 - 0.4 * (env.storm?.level || 0));
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = 0.15 * k;
  ctx.drawImage(art.mask, ox, oy, cw, ch);
  ctx.globalAlpha = 0.3 * k;
  ctx.drawImage(art.mid, ox - cw / W, oy - ch / H, cw + 2 * cw / W, ch + 2 * ch / H);
  ctx.globalAlpha = 0.5 * k;
  ctx.drawImage(art.wide, ox - 3 * cw / W, oy - 3 * ch / H, cw + 6 * cw / W, ch + 6 * ch / H);
  ctx.globalAlpha = 1;
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
