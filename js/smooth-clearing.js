/* ============================================================
   smooth-clearing.js  -  the Clearing painted smooth, a pilot of a
   modern look for the main game's scenery (the Sky Pillar lobby's,
   js/towerprep.js: full resolution, gradients, soft glows, clouds and
   canopies built from circles). Behind the ?smooth switch (saved per
   device; ?pixel turns it off), js/scene.js hands the Clearing's four
   places and its boss arena to this file instead of painting pixels.

   Everything is drawn in the pixel scene's own units (its W x H grid,
   scaled up to the screen), so the horizon, the battle pads and the
   landmarks stand exactly where the pixel version puts them, and the
   living parts reuse scene.js's `life` (clouds, grass, butterflies,
   fireflies, weather, rain): the same motion, drawn smooth.
   ============================================================ */

const TAU = Math.PI * 2;
const BLOOM_AT = 20;   // must match scene.js: the `bloom` sound is timed to it
const BLOSSOM = ['#a8406e', '#f07aa8', '#ffc4dc', '#f8e048'];
const WHITE = '#fffce8';

const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgba = (h, a = 1) => { const [r, g, b] = rgb(h); return `rgba(${r}, ${g}, ${b}, ${a})`; };
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`; };
/** One of scene.js's packed colours (ABGR) as CSS. */
const packed = (c, a = 1) => `rgba(${c & 255}, ${(c >> 8) & 255}, ${(c >>> 16) & 255}, ${a})`;
const noise = (a, b, c) => { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function layer(cw, ch, W, H) {
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const g = c.getContext('2d');
  g.setTransform(cw / W, 0, 0, ch / H, 0, 0);
  return [c, g];
}

/** A vertical gradient through `list` from y0 to y1, the bands bunched towards the top by `curve` (scene.js's bands()). */
function bandGradient(g, y0, y1, list, curve = 1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  list.forEach((c, i) => gr.addColorStop(Math.pow(i / Math.max(1, list.length - 1), 1 / curve), c));
  return gr;
}

/** A soft round glow (added light). */
function glow(g, x, y, r, colour, a, ry = r) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(colour, a));
  gr.addColorStop(0.4, rgba(colour, a * 0.45));
  gr.addColorStop(1, rgba(colour, 0));
  g.save();
  g.translate(x, y); g.scale(1, ry / r); g.translate(-x, -y);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}

/** A soft round glow as a ready-made sprite (fireflies, pollen: dozens a frame), drawn at `a` strength. */
const sprites = new Map();
function dot(g, x, y, r, colour, a) {
  let s = sprites.get(colour);
  if (!s) {
    s = document.createElement('canvas');
    s.width = s.height = 64;
    const c = s.getContext('2d'), gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, rgba(colour, 1)); gr.addColorStop(0.4, rgba(colour, 0.45)); gr.addColorStop(1, rgba(colour, 0));
    c.fillStyle = gr;
    c.fillRect(0, 0, 64, 64);
    sprites.set(colour, s);
  }
  g.globalAlpha = clamp(a);
  g.drawImage(s, x - r, y - r, r * 2, r * 2);
  g.globalAlpha = 1;
}

/** A soft dark oval on the ground under something standing on it. */
function contact(g, x, y, rx, ry, a = 0.3) {
  g.save();
  g.translate(x, y); g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, `rgba(10, 24, 12, ${a})`);
  gr.addColorStop(1, 'rgba(10, 24, 12, 0)');
  g.fillStyle = gr;
  g.fillRect(-rx, -rx, rx * 2, rx * 2);
  g.restore();
}

/** A leafy crown built of overlapping puffs, lit from the top right, darker underneath, with clumps of light on it. */
function canopy(g, cx, cy, r, [lit, leaf, shade, deep], rnd, puffs = 6, squash = 0.85) {
  const path = new Path2D(), parts = [[0, 0, 0.82]];
  for (let i = 0; i < puffs; i++) {
    const a = i / puffs * TAU + rnd() * 0.6, d = r * (0.42 + rnd() * 0.2);
    parts.push([Math.cos(a) * d, Math.sin(a) * d * squash, 0.48 + rnd() * 0.22]);
  }
  for (const [dx, dy, k] of parts) { path.moveTo(cx + dx + k * r, cy + dy); path.arc(cx + dx, cy + dy, k * r, 0, TAU); }
  const gr = g.createRadialGradient(cx + r * 0.4, cy - r * 0.5, r * 0.05, cx, cy, r * 1.45);
  gr.addColorStop(0, lit); gr.addColorStop(0.42, leaf); gr.addColorStop(0.8, shade); gr.addColorStop(1, deep);
  g.fillStyle = gr;
  g.fill(path);
  g.save();
  g.clip(path);
  for (let i = 0; i < puffs + 3; i++) {
    const a = rnd() * TAU, d = rnd() * r * 0.85, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8, rr = r * (0.2 + rnd() * 0.16);
    const up = y < cy + r * 0.1 && x > cx - r * 0.5;
    const lg = g.createRadialGradient(x + rr * 0.3, y - rr * 0.45, 0, x, y, rr);
    lg.addColorStop(0, rgba(up ? lit : leaf, up ? 0.7 : 0.4));
    lg.addColorStop(1, rgba(up ? lit : leaf, 0));
    g.fillStyle = lg;
    g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  const under = g.createLinearGradient(0, cy, 0, cy + r * 1.1);
  under.addColorStop(0, rgba(deep, 0));
  under.addColorStop(1, rgba(deep, 0.55));
  g.fillStyle = under;
  g.fillRect(cx - r * 2, cy, r * 4, r * 1.2);
  g.restore();
  return path;
}

/** A trunk from (x, top) to (x, foot), `w` wide, lit on its left. */
function trunk(g, x, top, foot, w, [light, dark]) {
  const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  gr.addColorStop(0, mix(light, '#ffffff', 0.12)); gr.addColorStop(0.45, light); gr.addColorStop(1, dark);
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(x - w * 0.42, top); g.lineTo(x + w * 0.42, top);
  g.lineTo(x + w * 0.5, foot); g.quadraticCurveTo(x + w * 0.9, foot + 0.4, x + w, foot + 0.6);
  g.lineTo(x - w, foot + 0.6); g.quadraticCurveTo(x - w * 0.9, foot + 0.4, x - w * 0.5, foot);
  g.closePath();
  g.fill();
}

/* ---------- the giant tree's numbers (scene.js's clearingTree()) ---------- */

function treeOf(W, H, horizon) {
  const cx = W * 0.5, half = Math.max(10, Math.round(Math.min(W * 0.16, horizon * 0.52)));
  return { cx, half, foot: horizon + 3, hx: cx - Math.round(half * 0.2), hy: Math.round(horizon * 0.62) };
}
const leanAt = (y, half, horizon) => Math.sin(y / Math.max(5, horizon * 0.12)) * Math.min(3, half * 0.08);

/* ============================================================
   THE STILL SCENE: two layers, the sky behind the clouds and the land in front of them
   ============================================================ */

/**
 * Paint a Clearing scene's still layers. `env`: { W, H, horizon (scene units), cw, ch (canvas pixels), raw (the look),
 * life (scene.js's: its landmark pick `mark`, the stream's `glints`), p (progress 0..1), stage, within (0..1 through the
 * place) }. Returns what the frames need.
 */
export function buildClearing(env) {
  const { W, H, horizon, cw, ch, raw, life } = env;
  const rnd = seeded(W * 977 + H * 31 + (raw.stage ?? 0) * 7 + (raw.seed ?? 0));
  const [back, b] = layer(cw, ch, W, H);
  const [front, f] = layer(cw, ch, W, H);
  const art = { W, H, horizon, cw, ch, raw, back, front, stage: raw.stage ?? 0, p: env.p, tree: treeOf(W, H, horizon) };

  paintSky(b, art, rnd);
  ridges(f, art);
  meadow(f, art, env, rnd);
  treeLine(f, art, env, rnd);
  if (art.stage === 1) berryBushes(f, art, rnd);
  if (life.mark) landmark(f, art, life.mark);
  art.shafts = art.stage >= 2 ? (raw.stars ? 0.5 : 1) : 0;
  art.stars = raw.stars ? Array.from({ length: Math.round(W * horizon / 70) }, () => ({ x: rnd() * W, y: rnd() * horizon * 0.85, r: 0.12 + rnd() * 0.2, ph: rnd() * 40, big: rnd() < 0.15 })) : [];
  return art;
}

function paintSky(g, art, rnd) {
  const { W, H, horizon, raw } = art;
  g.fillStyle = bandGradient(g, 0, horizon, raw.sky);
  g.fillRect(0, 0, W, horizon + 1);
  g.fillStyle = raw.sky[raw.sky.length - 1];
  g.fillRect(0, horizon, W, H - horizon);
  // a haze of the sky's light low down
  const haze = g.createLinearGradient(0, horizon * 0.55, 0, horizon);
  haze.addColorStop(0, rgba(raw.sky[raw.sky.length - 1], 0));
  haze.addColorStop(1, rgba(mix(raw.sky[raw.sky.length - 1], '#ffffff', 0.35), 0.5));
  g.fillStyle = haze;
  g.fillRect(0, horizon * 0.55, W, horizon * 0.45 + 1);
  if (raw.stars) {
    for (let i = 0, n = Math.round(W * horizon / 40); i < n; i++) {
      g.fillStyle = `rgba(200, 210, 255, ${0.25 + rnd() * 0.35})`;
      g.beginPath(); g.arc(rnd() * W, rnd() * horizon * 0.85, 0.08 + rnd() * 0.12, 0, TAU); g.fill();
    }
  }
  if (raw.light === 'sun') {
    const r = Math.max(3, Math.round(Math.min(W, H) * 0.03)), x = Math.round(W * 0.86), y = Math.max(r + 8, Math.round(horizon * (raw.sunLow ? 0.78 : 0.5)));
    art.sun = { x, y, r };
    glow(g, x, y, r * 6, raw.sun[2], 0.35);
    const d = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    d.addColorStop(0, raw.sun[0]); d.addColorStop(0.75, raw.sun[0]); d.addColorStop(1, raw.sun[1]);
    g.fillStyle = d;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  if (raw.light === 'moon') {
    const r = Math.max(4, Math.round(Math.min(W, H) * 0.04)), x = Math.round(W * 0.84), y = Math.max(r + 8, Math.round(horizon * 0.42));
    art.moon = { x, y, r };
    glow(g, x, y, r * 4, '#c8d4ff', 0.3);
    const d = g.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
    d.addColorStop(0, '#fbf8e4'); d.addColorStop(0.7, '#ece6c6'); d.addColorStop(1, '#d4cca8');
    g.fillStyle = d;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.fillStyle = 'rgba(160, 150, 120, 0.35)';
    for (const [dx, dy, k] of [[-0.3, -0.2, 0.2], [0.25, 0.3, 0.16], [-0.1, 0.45, 0.1], [0.35, -0.35, 0.12]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, k * r, 0, TAU); g.fill(); }
  }
}

/** The far hills and the near ones (scene.js's ridge(): the same waves, drawn as smooth curves). */
function ridges(g, art) {
  const { W, horizon, raw } = art;
  const wave = (x, w, seed) => 0.6 * Math.sin(x / w + seed) + 0.4 * Math.sin(x / (w * 0.37) + seed * 3);
  const hill = (top, height, w, seed, [lit, body, dark = body], shaded) => {
    const path = new Path2D();
    path.moveTo(-1, horizon + 1);
    for (let x = -1; x <= W + 1; x += 0.5) path.lineTo(x, top - height * wave(x, w, seed));
    path.lineTo(W + 1, horizon + 1);
    path.closePath();
    const gr = g.createLinearGradient(0, top - height, 0, horizon);
    gr.addColorStop(0, mix(lit, body, 0.2)); gr.addColorStop(0.5, body); gr.addColorStop(1, dark);
    g.fillStyle = gr;
    g.fill(path);
    g.save();
    g.clip(path);
    if (shaded) {
      const sh = g.createLinearGradient(0, 0, W, 0);
      for (let x = 0; x <= W; x += 2) sh.addColorStop(x / W, rgba(dark, clamp((-Math.sin(x / w + seed + 0.8) - 0.1) * 0.8, 0, 0.6)));
      g.fillStyle = sh;
      g.fillRect(0, top - height * 2, W, horizon - top + height * 2 + 1);
    }
    g.strokeStyle = rgba(mix(lit, '#ffffff', 0.25), 0.7);
    g.lineWidth = 0.6;
    g.stroke(path);
    g.restore();
  };
  hill(horizon - 9, 5, 23, 0.4, raw.farHills, false);
  // distance: the far hills sink into the sky's haze
  const haze = g.createLinearGradient(0, horizon - 16, 0, horizon);
  haze.addColorStop(0, rgba(raw.sky[raw.sky.length - 1], 0));
  haze.addColorStop(1, rgba(raw.sky[raw.sky.length - 1], 0.35));
  g.fillStyle = haze;
  g.fillRect(0, horizon - 16, W, 16);
  hill(horizon - 4, 4, 13, 2.1, raw.hills, true);
}

/** The ground: the meadow's bands, soft patches of thicker grass, pebbles, the stream, flowers, and the woods' shade. */
function meadow(g, art, env, rnd) {
  const { W, H, horizon, raw, p } = art;
  const depthOf = (y) => (y - horizon) / Math.max(1, H - horizon);
  g.fillStyle = bandGradient(g, horizon, H, raw.meadow, 0.8);
  g.fillRect(0, horizon, W, H - horizon);
  // light rolling over the ground: brighter far off, a darker foreground
  const roll = g.createLinearGradient(0, horizon, 0, H);
  roll.addColorStop(0, rgba(raw.blade[0], 0.25)); roll.addColorStop(0.3, rgba(raw.blade[0], 0)); roll.addColorStop(1, 'rgba(0, 20, 0, 0.12)');
  g.fillStyle = roll;
  g.fillRect(0, horizon, W, H - horizon);
  for (let n = 0, count = Math.round(W / 10 * (1 + p * 1.2)); n < count; n++) {
    const cy = horizon + 4 + rnd() * (H - horizon), depth = depthOf(cy), rx = 4 + rnd() * 10 * (0.5 + depth), ry = Math.max(1, rx * (0.15 + depth * 0.2));
    const cx = rnd() * W;
    g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, rgba(raw.patch, 0.7)); gr.addColorStop(0.6, rgba(raw.patch, 0.45)); gr.addColorStop(1, rgba(raw.patch, 0));
    g.fillStyle = gr;
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
  }
  for (let n = 0, count = Math.max(2, Math.round(W / 60 * (1 + p))); n < count; n++) {
    const y = horizon + 6 + rnd() * (H - horizon - 8);
    pebble(g, rnd() * W, y, depthOf(y) > 0.5 ? 1.6 : 0.9, raw.rock);
  }
  if (art.stage === 1) stream(g, art, rnd);
  // tufts of taller grass
  for (let n = 0, count = Math.round(W / 4); n < count; n++) {
    const y = horizon + 3 + rnd() ** 0.8 * (H - horizon), x = rnd() * W, s = 0.8 + depthOf(y) * 2.6;
    if (env.life.bare?.[Math.round(y) * W + Math.round(x)]) continue;
    for (let k = 0; k < 4; k++) {
      const dx = (k - 1.5) * s * 0.35, lean = (k - 1.5) * s * 0.3, h = s * (1.2 + noise(n, k, 3) * 0.9);
      g.strokeStyle = k % 2 ? raw.blade[1] : raw.blade[2];
      g.lineWidth = 0.18 + depthOf(y) * 0.25;
      g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + dx, y); g.quadraticCurveTo(x + dx + lean * 0.2, y - h * 0.6, x + dx + lean, y - h); g.stroke();
    }
  }
  flowers(g, art, Math.round(W / (raw.stars ? 14 : 9) * (1 - p * 0.75)), rnd, env.life);
  const reach = (H - horizon) * 0.3 * p;
  if (reach > 1) {
    const sh = g.createLinearGradient(0, horizon + 2, 0, horizon + 2 + reach);
    sh.addColorStop(0, 'rgba(8, 30, 14, 0.3)'); sh.addColorStop(1, 'rgba(8, 30, 14, 0)');
    g.fillStyle = sh;
    g.fillRect(0, horizon + 2, W, reach);
  }
}

function pebble(g, x, y, s, [lit, body, dark]) {
  contact(g, x + s * 0.2, y + s * 0.15, s * 1.4, s * 0.45, 0.3);
  const gr = g.createLinearGradient(x - s, y - s, x + s, y + s * 0.2);
  gr.addColorStop(0, lit); gr.addColorStop(0.5, body); gr.addColorStop(1, dark);
  g.fillStyle = gr;
  g.beginPath(); g.ellipse(x, y - s * 0.35, s, s * 0.6, 0, Math.PI, TAU); g.ellipse(x, y - s * 0.35, s, s * 0.3, 0, 0, Math.PI); g.fill();
}

function flowers(g, art, count, rnd, life) {
  const { W, H, horizon, raw } = art;
  for (let n = 0; n < count; n++) {
    const cy = horizon + 4 + rnd() * (H - horizon - 4), cx = rnd() * W, depth = (cy - horizon) / (H - horizon);
    const [petal, heart] = raw.flowers[Math.floor(rnd() * raw.flowers.length)];
    for (let k = 0, c = 2 + Math.floor(rnd() * 4); k < c; k++) {
      const x = cx + (rnd() - 0.5) * (6 + depth * 10), y = cy + (rnd() - 0.5) * (2 + depth * 4);
      if (life.bare?.[Math.round(y) * W + Math.round(x)]) continue;
      bloom(g, x, y, depth > 0.55 ? 0.55 + depth * 0.5 : 0.35 + depth * 0.4, petal, heart, rnd() * TAU);
    }
  }
}

/** A little five-petalled flower. */
function bloom(g, x, y, r, petal, heart, turn = 0) {
  g.strokeStyle = 'rgba(30, 80, 30, 0.6)';
  g.lineWidth = r * 0.25;
  g.beginPath(); g.moveTo(x, y + r * 0.2); g.lineTo(x, y + r * 1.6); g.stroke();
  g.fillStyle = petal;
  for (let k = 0; k < 5; k++) {
    const a = turn + k * TAU / 5;
    g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.45, r * 0.5, r * 0.36, a, 0, TAU); g.fill();
  }
  g.fillStyle = heart;
  g.beginPath(); g.arc(x, y, r * 0.3, 0, TAU); g.fill();
}

/** The stream (scene.js's winding(6, 0.72, 2.2): along the back from the left, bending towards you on the right). */
function streamPath(art) {
  const { W, H, horizon } = art;
  const depthOf = (y) => (y - horizon) / Math.max(1, H - horizon);
  const back = horizon + 6, bx = Math.round(W * 0.72), pts = [];
  for (let x = -4; x <= bx; x += 0.5) pts.push([x, back + Math.sin(x / 11) * 0.8]);
  for (let y = back + 1, x = bx; y < H + 6; y += 0.5) { x += (0.5 + depthOf(y) * 1.6 + Math.sin(y / 5) * 0.4) / 2; pts.push([x, y]); }
  return pts.map(([x, y]) => { const depth = clamp(depthOf(y)), r = 2.2 * (1 + depth * 3.5); return [x, y, r, Math.max(0.6, r * (0.35 + depth * 0.3))]; });
}

function stream(g, art) {
  const { horizon, H, raw } = art, [glint, lit, body, deep] = raw.marks.water, [bank] = raw.marks.bank;
  const pts = streamPath(art);
  const union = (k) => {
    const p = new Path2D();
    for (const [x, y, rx, ry] of pts) { p.moveTo(x + rx * k, y); p.ellipse(x, y, rx * k, ry * k, 0, 0, TAU); }
    return p;
  };
  g.fillStyle = rgba(bank, 0.75);
  g.fill(union(1.35));
  g.fillStyle = rgba(mix(bank, '#000000', 0.2), 0.6);
  g.fill(union(1.12));
  const water = union(1);
  const gr = g.createLinearGradient(0, horizon, 0, H);
  gr.addColorStop(0, mix(lit, raw.sky[raw.sky.length - 1], 0.4)); gr.addColorStop(0.35, body); gr.addColorStop(1, deep);
  g.fillStyle = gr;
  g.fill(water);
  g.save();
  g.clip(water);
  g.fillStyle = rgba(lit, 0.35);
  g.fill(union(0.5));
  g.fillStyle = rgba(glint, 0.25);
  g.fill(union(0.22));
  g.restore();
}

function treeLine(g, art, env, rnd) {
  const { W, H, horizon, raw, p, stage } = art, trees = raw.trees;
  if (stage === 2) deepWoods(g, art, env.within, rnd);
  if (p > 0.25) {   // a far wood over the hills, in the hills' hazy colours
    const far = [raw.hills[0], raw.hills[1], raw.hills[2], raw.hills[2]];
    for (let x = rnd() * 6; x < W + 6; x += 3 + rnd() * 5 * (1.3 - p)) {
      const r = 4 + rnd() * 3, cy = horizon - 12 - rnd() * (3 + p * 5);
      g.fillStyle = far[2];
      g.fillRect(x - r * 0.9, cy, r * 1.8, horizon + 1 - cy);
      canopy(g, x, cy, r, far, rnd, 4);
    }
  }
  for (let x = rnd() * 10; x < W + 8; x += (10 + rnd() * 16) * (1 - p * 0.5)) {
    const cy = horizon - 9 - rnd() * 4 - p * horizon * 0.14, r = 5 + rnd() * 3 + p * horizon * 0.06;
    trunk(g, x + 0.5, cy + r * 0.5, horizon + 1, Math.max(1.4, r * 0.28), raw.trunk);
    canopy(g, x + 0.5, cy, r, trees, rnd, 6);
  }
  for (let x = -4; x < W + 6; x += 3 + rnd() * 4) {
    const r = 3 + rnd() * 3 + p * 2, cy = horizon - 1 - rnd() * 3;
    canopy(g, x, cy, r, trees, rnd, 4, 0.7);
    g.fillStyle = trees[3];
    g.fillRect(x - r * 0.8, cy + r * 0.3, r * 1.6, horizon + 1.5 - cy - r * 0.3);
  }
  // the trees' foot: a dark seam where the wood meets the meadow
  const seam = g.createLinearGradient(0, horizon, 0, horizon + 4);
  seam.addColorStop(0, rgba(trees[3], 0.95)); seam.addColorStop(0.5, rgba(trees[3], 0.5)); seam.addColorStop(1, rgba(trees[3], 0));
  g.fillStyle = seam;
  g.fillRect(0, horizon, W, 4);
  if (stage === 3) giantTree(g, art, rnd);
  if (p >= 0.6) nearTrees(g, art, (p - 0.6) / 0.4, rnd);
}

/** Deep in the woods: a thick canopy closes over the top, with dark trunks rising into it at every depth. */
function deepWoods(g, art, k, rnd) {
  const { W, horizon, raw } = art, [lit, leaf, shade, deep] = raw.trees;
  const roof = horizon * (0.2 + k * 0.12);
  const gloom = g.createLinearGradient(0, roof, 0, horizon);
  gloom.addColorStop(0, rgba(deep, 0.95)); gloom.addColorStop(0.7, rgba(mix(shade, deep, 0.5), 0.9)); gloom.addColorStop(1, rgba(shade, 0.85));
  g.fillStyle = gloom;
  g.fillRect(0, roof - 2, W, horizon - roof + 2);
  // a little sky glimpsed far back through the wood, misty
  for (let n = 0; n < W / 9; n++) {
    const x = rnd() * W, y = roof + (horizon - roof) * (0.35 + rnd() * 0.5);
    glow(g, x, y, 3 + rnd() * 5, raw.sky[raw.sky.length - 1], 0.35, 2 + rnd() * 4);
  }
  const mist = g.createLinearGradient(0, horizon - (horizon - roof) * 0.5, 0, horizon);
  mist.addColorStop(0, rgba(raw.sky[raw.sky.length - 1], 0)); mist.addColorStop(1, rgba(raw.sky[raw.sky.length - 1], 0.25));
  g.fillStyle = mist;
  g.fillRect(0, horizon - (horizon - roof) * 0.5, W, (horizon - roof) * 0.5);
  for (let x = rnd() * 4; x < W; x += 5 + rnd() * 10) {
    const w = 2 + rnd() * 3, far = rnd() < 0.5;
    trunk(g, x + w / 2, roof - 2, horizon + 0.5, w, raw.trunk.map(c => mix(c, deep, far ? 0.55 : 0.3)));
  }
  const edge = new Path2D();
  edge.moveTo(-1, -1);
  for (let x = -1; x <= W + 1; x += 0.5) edge.lineTo(x, roof + 2.5 * Math.sin(x / 6) + 1.5 * Math.sin(x / 2.7 + 2));
  edge.lineTo(W + 1, -1);
  edge.closePath();
  const gr = g.createLinearGradient(0, 0, 0, roof + 3);
  gr.addColorStop(0, leaf); gr.addColorStop(0.7, shade); gr.addColorStop(1, deep);
  g.fillStyle = gr;
  g.fill(edge);
  for (let x = -2; x < W + 3; x += 2.5 + rnd() * 2) {
    const y = roof + 2.5 * Math.sin(x / 6) + 1.5 * Math.sin(x / 2.7 + 2);
    canopy(g, x, y - 1, 2 + rnd() * 2, [leaf, shade, deep, deep], rnd, 3);
  }
  g.save();
  g.clip(edge);
  for (let n = 0; n < W / 3; n++) {
    const x = rnd() * W, y = rnd() * (roof - 2);
    if (n % 4 === 0) glow(g, x, y, 1.2 + rnd() * 1.4, raw.sky[2], 0.8);
    else glow(g, x, y, 2 + rnd() * 3, lit, 0.4);
  }
  g.restore();
}

/** The boss's arena: an ancient giant tree, its trunk filling the back, roots spilling onto the grass, its crown the sky. */
function giantTree(g, art, rnd) {
  const { W, horizon, raw } = art, [lit, leaf, shade, deep] = raw.trees, bark = raw.marks.bark, moss = raw.marks.moss;
  const { cx, half, foot, hx, hy } = art.tree;
  const flareAt = (y) => (y > foot - half ? (y - foot + half) ** 2 / half * 1.2 : 0);
  const body = new Path2D();
  body.moveTo(cx - half + leanAt(0, half, horizon), -1);
  for (let y = 0; y <= foot; y += 0.5) body.lineTo(cx + leanAt(y, half, horizon) - half - flareAt(y), y);
  for (let y = foot; y >= 0; y -= 0.5) body.lineTo(cx + leanAt(y, half, horizon) + half + flareAt(y), y);
  body.closePath();
  contact(g, cx, foot + 1, half * 2.6, 3, 0.4);
  const gr = g.createLinearGradient(cx - half, 0, cx + half, 0);
  gr.addColorStop(0, bark[0]); gr.addColorStop(0.16, bark[1]); gr.addColorStop(0.7, bark[2]); gr.addColorStop(0.92, bark[3]); gr.addColorStop(1, bark[3]);
  g.fillStyle = gr;
  g.fill(body);
  g.save();
  g.clip(body);
  // grooves running up the bark
  g.lineCap = 'round';
  for (let i = -6; i <= 6; i++) {
    const x0 = i / 6 * half * 0.95;
    g.strokeStyle = rgba(bark[3], 0.35 + noise(i, 1, 2) * 0.2);
    g.lineWidth = 0.35 + noise(i, 2, 3) * 0.4;
    g.beginPath();
    for (let y = -1; y <= foot + 1; y += 1) {
      const x = cx + leanAt(y, half, horizon) + x0 * (1 + flareAt(y) / half) + Math.sin(y * 0.13 + i * 1.7) * 0.8;
      if (y < 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
    g.strokeStyle = rgba(bark[0], 0.18);
    g.lineWidth = 0.3;
    g.stroke();
  }
  // the light from the left, and a shadow down the right
  const side = g.createLinearGradient(cx - half * 1.4, 0, cx + half * 1.4, 0);
  side.addColorStop(0, 'rgba(255, 240, 200, 0.18)'); side.addColorStop(0.35, 'rgba(255, 240, 200, 0)'); side.addColorStop(0.7, 'rgba(0, 0, 0, 0)'); side.addColorStop(1, 'rgba(10, 6, 0, 0.35)');
  g.fillStyle = side;
  g.fillRect(cx - half * 3, 0, half * 6, foot + 2);
  for (let n = 0; n < half * 2.5; n++) {
    const x = cx + (rnd() * 2 - 1) * half * 0.9, y = rnd() * foot;
    glow(g, x, y, 0.8 + rnd() * 1.4, moss[rnd() < 0.5 ? 0 : 1], 0.7);
  }
  g.restore();
  // roots crawling out over the ground
  for (const s of [-1, 1]) for (let r = 0; r < 2; r++) {
    let x = cx + s * half * (1.3 + r * 0.4), y = foot - 2;
    const len = Math.round(half * (0.5 + r * 0.3)), pts = [];
    for (let n = 0; n < len; n++) { x += s * (0.8 + rnd() * 0.4); y += 0.2 + n / len * 0.4; pts.push([x, y, Math.max(0.5, (1 - n / len) * (3 - r))]); }
    root(g, pts, bark);
  }
  // grass growing up against its foot, so it stands in the meadow, not on a line
  g.lineCap = 'round';
  for (let x = cx - half * 2.5; x < cx + half * 2.5; x += 0.45) {
    const h = 1 + noise(x, 3, 9) * 2.2, lean = (noise(x, 4, 9) - 0.5) * 1.6;
    g.strokeStyle = noise(x, 5, 9) < 0.5 ? raw.blade[1] : raw.blade[2];
    g.lineWidth = 0.35;
    g.beginPath(); g.moveTo(x, foot + 0.8); g.quadraticCurveTo(x, foot - h * 0.5, x + lean, foot - h); g.stroke();
  }
  // the hollow, the heartwood glowing in it
  const hr = Math.max(3, Math.round(half * 0.32));
  const hollow = g.createRadialGradient(hx, hy, 0, hx, hy, hr * 1.25);
  hollow.addColorStop(0, bark[3]); hollow.addColorStop(0.5, mix(bark[3], bark[2], 0.4)); hollow.addColorStop(0.72, bark[2]); hollow.addColorStop(0.86, bark[1]); hollow.addColorStop(1, bark[0]);
  g.fillStyle = hollow;
  g.beginPath(); g.ellipse(hx, hy, hr * 1.2, hr * 1.8, 0, 0, TAU); g.fill();
  g.strokeStyle = rgba(bark[3], 0.5);
  g.lineWidth = 0.4;
  for (const k of [0.95, 0.75]) { g.beginPath(); g.ellipse(hx, hy, hr * 1.2 * k, hr * 1.8 * k, 0, 0, TAU); g.stroke(); }
  glow(g, hx, hy, 4, raw.pollen[0], 0.9, 3);
  glow(g, hx, hy, 9, raw.pollen[1], 0.35, 8);
  // the crown: a ceiling of leaves, heavier over the trunk
  const crownAt = (x) => horizon * (0.14 + Math.max(0, 1 - Math.abs(x - cx) / (W * 0.5)) * 0.2) + 4 * Math.sin(x / 5) + 3 * Math.sin(x / 2.3 + 1);
  const crown = new Path2D();
  crown.moveTo(-1, -1);
  for (let x = -1; x <= W + 1; x += 0.5) crown.lineTo(x, crownAt(x) - 2);
  crown.lineTo(W + 1, -1);
  crown.closePath();
  const cg = g.createLinearGradient(0, 0, 0, horizon * 0.36);
  cg.addColorStop(0, mix(leaf, deep, 0.35)); cg.addColorStop(0.6, leaf); cg.addColorStop(1, shade);
  g.fillStyle = cg;
  g.fill(crown);
  for (let x = -3; x < W + 4; x += 2.6 + rnd() * 2.4) canopy(g, x, crownAt(x) - 2.5, 2.6 + rnd() * 2.6, [lit, leaf, shade, deep], rnd, 4);
  g.save();
  g.clip(crown);
  for (let n = 0; n < W / 2; n++) {
    const x = rnd() * W, y = rnd() * crownAt(x);
    glow(g, x, y, 1.5 + rnd() * 2.5, Math.abs(x - cx) < half * 0.25 ? raw.sky[raw.sky.length - 1] : lit, Math.abs(x - cx) < half * 0.25 ? 0.7 : 0.35);
  }
  g.restore();
  // heavy, split boughs, so the hollow sits sheltered under them
  for (const [s, span, start, climb] of [[-1, 0.25, 0.44, 0.13], [1, 0.36, 0.5, 0.24]]) {
    const length = Math.max(12, Math.round(Math.min(W * span, half * (s < 0 ? 1.55 : 2.4)))), rise = Math.max(5, Math.round(horizon * climb));
    const pts = [];
    let twig = null;
    for (let n = 0; n <= length; n += 0.5) {
      const q = n / length, x = cx + s * (half * 0.35 + q * length * 0.72);
      const y = horizon * start - q * rise + Math.sin(q * Math.PI) * 2 + Math.sin(q * Math.PI * 2) * 1.5;
      pts.push([x, y, Math.max(0.6, (1 - q * 0.76) * Math.max(2, half * 0.11))]);
      if (!twig && n >= length * 0.48) twig = [x, y];
    }
    bough(g, pts, bark);
    const tw = Math.max(4, Math.round(horizon * 0.13));
    bough(g, Array.from({ length: tw + 1 }, (_, k) => [twig[0] + s * k * 0.42, twig[1] - k, Math.max(0.4, 1.1 * (1 - k / tw))]), bark);
    canopy(g, twig[0] + s * tw * 0.42, twig[1] - tw, 3, [lit, leaf, shade, deep], rnd, 4);
  }
}

/** A root: a tapering ribbon lit along its top, dark beneath. `pts` are [x, y, half-thickness]. */
function root(g, pts, bark) {
  if (pts.length < 2) return;
  const p = new Path2D();
  p.moveTo(pts[0][0], pts[0][1] - pts[0][2]);
  for (const [x, y, w] of pts) p.lineTo(x, y - w);
  for (let i = pts.length - 1; i >= 0; i--) p.lineTo(pts[i][0], pts[i][1] + pts[i][2]);
  p.closePath();
  const [x0, y0] = pts[0], [x1, y1] = pts[pts.length - 1];
  contact(g, (x0 + x1) / 2, (y0 + y1) / 2 + 1.5, Math.abs(x1 - x0) / 2 + 2, 1.5, 0.3);
  const gr = g.createLinearGradient(0, Math.min(y0, y1) - pts[0][2], 0, Math.max(y0, y1) + pts[0][2]);
  gr.addColorStop(0, bark[0]); gr.addColorStop(0.4, bark[1]); gr.addColorStop(1, bark[3]);
  g.fillStyle = gr;
  g.fill(p);
}

/** A bough: a tapering limb with a lit top edge. */
function bough(g, pts, bark) {
  g.lineCap = 'round';
  for (const [colour, k, dy] of [[bark[3], 1.15, 0.3], [bark[1], 1, 0], [bark[0], 0.35, -0.5]]) {
    g.strokeStyle = colour;
    for (let i = 1; i < pts.length; i++) {
      g.lineWidth = pts[i][2] * 2 * k;
      g.beginPath(); g.moveTo(pts[i - 1][0], pts[i - 1][1] + dy * pts[i][2]); g.lineTo(pts[i][0], pts[i][1] + dy * pts[i][2]); g.stroke();
    }
  }
}

/** Deep in the woods (k 0..1 from there to the boss): two big near trees frame the scene, their crowns hanging in from the
    top corners, and at the end a fringe of leaves closes the canopy overhead. */
function nearTrees(g, art, k, rnd) {
  const { W, H, horizon, raw } = art, [lit, leaf, shade, deep] = raw.trees;
  const r = Math.min(W * 0.12, horizon * 0.5) * (0.8 + k * 0.5), half = Math.max(1, r * 0.16);
  for (const [cx, reach] of [[W * 0.03, 0.2], [W * 0.96, 0.1]]) {
    const foot = horizon + (H - horizon) * reach;
    contact(g, cx, foot + 0.5, half * 4, 1.6, 0.4);
    trunk(g, cx, -1, foot, half * 2, raw.trunk);
    const rw = r * 1.4, cy = r * 0.3;
    canopy(g, cx - rw * 0.35, cy, r * 0.85, [lit, leaf, shade, deep], rnd, 5);
    canopy(g, cx + rw * 0.35, cy + r * 0.1, r * 0.8, [lit, leaf, shade, deep], rnd, 5);
    canopy(g, cx, cy - r * 0.2, r * 0.9, [lit, leaf, shade, deep], rnd, 6);
  }
  if (k < 0.5) return;
  const fringe = Math.max(2, horizon * 0.1 * (k - 0.3));
  for (let x = -2; x < W + 3; x += 2.2 + rnd() * 1.6) {
    const h = fringe * (1 + 0.5 * Math.sin(x / 5) + 0.3 * Math.sin(x / 2.3 + 1));
    canopy(g, x, h * 0.4, Math.max(1.5, h * 0.7), [leaf, shade, deep, deep], rnd, 3);
  }
}

function berryBushes(g, art, rnd) {
  const { W, horizon } = art;
  for (let n = 0; n < Math.max(2, Math.round(W / 70)); n++) {
    berryBush(g, art, rnd() < 0.5 ? W * (0.02 + rnd() * 0.18) : W * (0.8 + rnd() * 0.18), horizon + 2, 3, rnd);
  }
}

/** A berry bush: a round green mound speckled with berries. */
function berryBush(g, art, cx, foot, r, rnd) {
  const m = art.raw.marks, [berry, berryDark, shine] = m.berry;
  contact(g, cx, foot, r + 3, 1.2, 0.35);
  const path = new Path2D();
  for (const [dx, dy, k] of [[-0.55, -0.6, 0.65], [0.5, -0.65, 0.7], [0, -1.05, 0.75], [-0.1, -0.4, 0.8]]) {
    const x = cx + dx * (r + 2), y = foot + dy * r * 1.1, rr = k * (r + 1);
    path.moveTo(x + rr, y); path.arc(x, y, rr, 0, TAU);
  }
  g.save();
  g.beginPath(); g.rect(cx - r * 3, foot - r * 4, r * 6, r * 4); g.clip();
  const gr = g.createRadialGradient(cx + r * 0.4, foot - r * 1.6, 0, cx, foot - r * 0.6, r * 2.3);
  gr.addColorStop(0, m.leaf[0]); gr.addColorStop(0.45, m.leaf[1]); gr.addColorStop(0.85, m.leaf[2]); gr.addColorStop(1, m.leaf[3]);
  g.fillStyle = gr;
  g.fill(path);
  g.restore();
  for (let i = 0; i < r * 3; i++) {
    const a = rnd() * Math.PI + Math.PI, d = rnd() * r * 1.1, x = cx + Math.cos(a) * d * 1.3, y = foot - r * 0.7 + Math.sin(a) * d * 0.8;
    const s = 0.35 + rnd() * 0.25;
    const bg = g.createRadialGradient(x - s * 0.3, y - s * 0.3, 0, x, y, s);
    bg.addColorStop(0, shine); bg.addColorStop(0.3, berry); bg.addColorStop(1, berryDark);
    g.fillStyle = bg;
    g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
  }
}

/* ---------- the landmarks: the same pick and spot as the pixel version (scene.js's landmark()) ---------- */

function woodGrad(g, x0, x1, [lit, body, shade]) {
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, lit); gr.addColorStop(0.35, body); gr.addColorStop(1, shade);
  return gr;
}

function landmark(g, art, { name, cx, foot }) {
  const m = art.raw.marks, line = m.wood[3];
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const L = {
    signpost() {
      contact(g, cx + 1.5, foot, 5, 1.2);
      g.fillStyle = woodGrad(g, cx, cx + 3, m.wood);
      g.strokeStyle = line; g.lineWidth = 0.45;
      g.beginPath(); g.roundRect(cx, foot - 9, 3, 9.2, 0.6); g.fill(); g.stroke();
      for (const [y0, dir] of [[foot - 12, 1], [foot - 8, -1]]) {
        const x0 = cx - 5 + dir * 2, x1 = cx + 7 + dir * 2, tip = dir > 0 ? x1 + 1.6 : x0 - 1.6;
        const p = new Path2D();
        if (dir > 0) { p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(tip, y0 + 2); p.lineTo(x1, y0 + 4); p.lineTo(x0, y0 + 4); }
        else { p.moveTo(x1, y0); p.lineTo(x0, y0); p.lineTo(tip, y0 + 2); p.lineTo(x0, y0 + 4); p.lineTo(x1, y0 + 4); }
        p.closePath();
        const gr = g.createLinearGradient(0, y0, 0, y0 + 4);
        gr.addColorStop(0, m.wood[0]); gr.addColorStop(0.5, m.wood[1]); gr.addColorStop(1, m.wood[2]);
        g.fillStyle = gr; g.fill(p); g.stroke(p);
        g.strokeStyle = rgba(m.wood[2], 0.7); g.lineWidth = 0.25;
        g.beginPath(); g.moveTo(x0 + 1, y0 + 1.6); g.lineTo(x1 - 1, y0 + 1.6); g.moveTo(x0 + 2, y0 + 2.8); g.lineTo(x1 - 2, y0 + 2.8); g.stroke();
        g.strokeStyle = line; g.lineWidth = 0.45;
      }
    },
    fence() {
      contact(g, cx, foot + 0.3, 14, 1.2, 0.25);
      for (const k of [3, 6]) {
        const gr = g.createLinearGradient(0, foot - k - 0.2, 0, foot - k + 1.8);
        gr.addColorStop(0, m.wood[0]); gr.addColorStop(0.5, m.wood[1]); gr.addColorStop(1, m.wood[2]);
        g.fillStyle = gr; g.strokeStyle = line; g.lineWidth = 0.35;
        g.beginPath(); g.roundRect(cx - 11.5, foot - k - 0.2, 24, 1.9, 0.5); g.fill(); g.stroke();
      }
      for (let x = -11; x <= 11; x += 7) {
        g.fillStyle = woodGrad(g, cx + x, cx + x + 3, m.wood); g.strokeStyle = line; g.lineWidth = 0.45;
        g.beginPath(); g.moveTo(cx + x, foot); g.lineTo(cx + x, foot - 8.5); g.lineTo(cx + x + 1.5, foot - 9.8); g.lineTo(cx + x + 3, foot - 8.5); g.lineTo(cx + x + 3, foot); g.closePath(); g.fill(); g.stroke();
      }
    },
    boulder() { rock(g, cx, foot, 7, 5, m, true); },
    stump() { stump(g, cx, foot, 4, 5, m); },
    birdhouse() {
      contact(g, cx + 0.5, foot, 4, 1);
      g.fillStyle = woodGrad(g, cx - 0.2, cx + 1.8, m.wood);
      g.fillRect(cx - 0.2, foot - 10, 2, 10);
      g.fillStyle = woodGrad(g, cx - 3.5, cx + 4.5, m.wood); g.strokeStyle = line; g.lineWidth = 0.45;
      g.beginPath(); g.roundRect(cx - 3.5, foot - 17.5, 8, 7.5, 0.6); g.fill(); g.stroke();
      g.fillStyle = m.wood[3];
      g.beginPath(); g.arc(cx + 0.5, foot - 14, 1.2, 0, TAU); g.fill();
      g.fillStyle = m.wood[2]; g.fillRect(cx - 0.3, foot - 12.4, 1.6, 0.5);
      const [roof, roofDark] = m.roof;
      const rg = g.createLinearGradient(cx - 6, 0, cx + 7, 0);
      rg.addColorStop(0, mix(roof, '#ffffff', 0.2)); rg.addColorStop(0.5, roof); rg.addColorStop(1, roofDark);
      g.fillStyle = rg;
      g.beginPath(); g.moveTo(cx + 0.5, foot - 21.5); g.lineTo(cx + 6.5, foot - 17); g.lineTo(cx - 5.5, foot - 17); g.closePath(); g.fill(); g.stroke();
    },
    bridge() { log(g, cx, art.horizon + 6 + Math.sin(cx / 11) * 0.8, 9, 1.2, m); },
    berries() { berryBush(g, art, cx, foot, 5, seeded(cx * 7 + foot)); berryBush(g, art, cx + 8, foot + 1, 3, seeded(cx * 3 + 1)); },
    stones() { for (const dx of [-7, -1, 5]) rock(g, cx + dx, art.horizon + 7, 2.2, 1.2, m, false); },
    reeds() {
      const [lit, body] = m.fern, [cat, catDark] = m.cattail;
      contact(g, cx, foot, 8, 1.2, 0.3);
      for (let n = -3; n <= 3; n++) {
        const x = cx + n * 2, h = 8 + ((n * 7 + 11) % 5), bend = n % 2 ? 1 : -0.5;
        g.strokeStyle = n % 2 ? lit : body; g.lineWidth = 0.55;
        g.beginPath(); g.moveTo(x, foot); g.quadraticCurveTo(x, foot - h * 0.6, x + bend, foot - h); g.stroke();
        if (n % 2 === 0) {
          const cg = g.createLinearGradient(x - 0.7, 0, x + 0.9, 0);
          cg.addColorStop(0, cat); cg.addColorStop(1, catDark);
          g.fillStyle = cg;
          g.beginPath(); g.roundRect(x + bend * 0.85 - 0.75, foot - h + 0.6, 1.5, 3.4, 0.75); g.fill();
        } else {
          g.strokeStyle = body; g.lineWidth = 0.4;
          g.beginPath(); g.moveTo(x, foot - 2); g.quadraticCurveTo(x - 2, foot - h * 0.5, x - 2.8, foot - h * 0.55); g.stroke();
        }
      }
    },
    log() { log(g, cx, foot - 2, 8, 2, m); },
    mushrooms() { mushroom(g, cx - 4, foot, 3, m); mushroom(g, cx + 3, foot + 1, 2, m); mushroom(g, cx + 7, foot, 1.2, m); },
    hollowLog() { log(g, cx, foot - 3, 9, 3, m, true); },
    ferns() { ferns(g, cx, foot, 8, m); },
    mossRock() { rock(g, cx, foot, 8, 5, m, true, 0.1); ferns(g, cx + 7, foot, 4, m); },
    bigStump() { stump(g, cx, foot, 6, 9, m, true); mushroom(g, cx - 8, foot, 1.2, m); },
  };
  L[name]?.();
}

/** A boulder: a lit dome on the grass, a cap of moss on top (down to `mossTo` of the way) when `mossy`. */
function rock(g, cx, foot, rx, ry, m, mossy, mossTo = -0.45) {
  const [lit, body, shade, line] = m.stone;
  contact(g, cx + 1, foot + 0.2, rx * 1.4, 1.4, 0.35);
  const p = new Path2D();
  p.moveTo(cx - rx, foot);
  p.bezierCurveTo(cx - rx * 1.05, foot - ry * 1.4, cx - rx * 0.4, foot - ry * 2.05, cx + rx * 0.15, foot - ry * 2);
  p.bezierCurveTo(cx + rx * 0.8, foot - ry * 1.95, cx + rx * 1.05, foot - ry * 1.1, cx + rx, foot);
  p.closePath();
  const gr = g.createRadialGradient(cx - rx * 0.35, foot - ry * 1.5, 0, cx, foot - ry * 0.8, rx * 1.4);
  gr.addColorStop(0, lit); gr.addColorStop(0.45, body); gr.addColorStop(1, shade);
  g.fillStyle = gr;
  g.fill(p);
  g.save();
  g.clip(p);
  if (mossy) {
    const top = foot - ry * 2, to = foot - ry * (1 - mossTo);
    const mg = g.createLinearGradient(0, top, 0, to + ry * 0.4);
    mg.addColorStop(0, m.moss[0]); mg.addColorStop(0.7, m.moss[1]); mg.addColorStop(1, rgba(m.moss[1], 0));
    g.fillStyle = mg;
    g.beginPath(); g.moveTo(cx - rx * 1.2, to);
    for (let x = -1.2; x <= 1.2; x += 0.1) g.lineTo(cx + x * rx, to + Math.sin(x * 9) * ry * 0.18);
    g.lineTo(cx + rx * 1.2, top - 1); g.lineTo(cx - rx * 1.2, top - 1); g.closePath(); g.fill();
  }
  g.strokeStyle = rgba(shade, 0.6); g.lineWidth = 0.3;
  g.beginPath(); g.moveTo(cx + rx * 0.2, foot - ry * 0.4); g.lineTo(cx + rx * 0.45, foot - ry * 1.1); g.lineTo(cx + rx * 0.35, foot - ry * 1.4); g.stroke();
  g.restore();
  g.strokeStyle = rgba(line, 0.7); g.lineWidth = 0.4;
  g.stroke(p);
}

/** A stump: its cut top showing rings, bark down its sides, roots at its foot; `fungi` adds shelf mushrooms. */
function stump(g, cx, foot, half, tall, m, fungi = false) {
  const [lit, body, shade, line] = m.bark, [ring, ringDark] = m.wood;
  contact(g, cx + 0.5, foot + 0.2, half * 2.2, 1.5, 0.4);
  const top = foot - tall;
  const p = new Path2D();
  p.moveTo(cx - half - 1, top);
  p.lineTo(cx - half - 1.2, foot - 2);
  p.quadraticCurveTo(cx - half - 1.6, foot - 0.4, cx - half - 3, foot + 0.2);
  p.lineTo(cx + half + 3, foot + 0.2);
  p.quadraticCurveTo(cx + half + 1.6, foot - 0.4, cx + half + 1.2, foot - 2);
  p.lineTo(cx + half + 1, top);
  p.closePath();
  g.fillStyle = woodGrad(g, cx - half - 1, cx + half + 1, [lit, body, shade]);
  g.fill(p);
  g.strokeStyle = rgba(line, 0.5); g.lineWidth = 0.3;
  for (let x = -half; x <= half; x += 1.6) { g.beginPath(); g.moveTo(cx + x, top + 1); g.lineTo(cx + x * 1.1, foot - 0.5); g.stroke(); }
  g.strokeStyle = line; g.lineWidth = 0.45;
  g.stroke(p);
  const face = g.createRadialGradient(cx, top, 0, cx, top, half + 1);
  face.addColorStop(0, ring); face.addColorStop(0.3, ringDark); face.addColorStop(0.45, ring); face.addColorStop(0.7, ringDark); face.addColorStop(0.85, ring); face.addColorStop(1, ringDark);
  g.fillStyle = face;
  g.beginPath(); g.ellipse(cx, top, half + 1, 1.3, 0, 0, TAU); g.fill(); g.stroke();
  if (fungi) for (const [dy, s] of [[tall * 0.35, 1], [tall * 0.65, -1]]) {
    const x = cx + s * (half + 1.2), y = top + dy;
    const sg = g.createLinearGradient(0, y - 0.6, 0, y + 0.8);
    sg.addColorStop(0, m.stem[0]); sg.addColorStop(1, m.stem[1]);
    g.fillStyle = sg;
    g.beginPath(); g.ellipse(x + s * 1.5, y, 2, 0.8, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI * 1.5, s < 0); g.fill();
  }
}

/** A fallen log lying across, its cut end showing rings; `hollow` shows a dark hole in the near end. */
function log(g, cx, y, len, r, m, hollow = false) {
  const [lit, body, shade, line] = m.bark, [ring, ringDark] = m.wood;
  contact(g, cx, y + r + 0.3, len + 2, 1.2, 0.35);
  const gr = g.createLinearGradient(0, y - r, 0, y + r);
  gr.addColorStop(0, lit); gr.addColorStop(0.3, body); gr.addColorStop(1, shade);
  g.fillStyle = gr; g.strokeStyle = line; g.lineWidth = 0.4;
  g.beginPath(); g.roundRect(cx - len - 0.5, y - r - 0.4, len * 2 + 1, r * 2 + 0.8, r * 0.5); g.fill(); g.stroke();
  g.strokeStyle = rgba(shade, 0.7); g.lineWidth = 0.25;
  for (let x = -len + 2; x < len - 1; x += 3) { g.beginPath(); g.moveTo(cx + x, y - r * 0.4); g.lineTo(cx + x + 2, y - r * 0.3); g.stroke(); }
  g.fillStyle = rgba(m.moss[0], 0.85);
  for (let x = -len; x <= len; x += 1.4) { g.beginPath(); g.arc(cx + x, y - r - 0.1, 0.45 + noise(x, y, 1) * 0.4, 0, TAU); g.fill(); }
  const ex = cx + len + 0.5, ery = r + 0.4, erx = Math.max(0.9, r * 0.6);
  const face = g.createRadialGradient(ex, y, 0, ex, y, ery);
  face.addColorStop(0, hollow ? line : ring); face.addColorStop(hollow ? 0.55 : 0.3, hollow ? line : ringDark); face.addColorStop(hollow ? 0.6 : 0.55, ring); face.addColorStop(0.8, ringDark); face.addColorStop(1, ring);
  g.fillStyle = face; g.strokeStyle = line; g.lineWidth = 0.4;
  g.beginPath(); g.ellipse(ex, y, erx, ery, 0, 0, TAU); g.fill(); g.stroke();
}

/** A mushroom: a round spotted cap on a pale stem. */
function mushroom(g, cx, foot, r, m) {
  const [cap, capDark, spot] = m.cap, [stem, stemDark] = m.stem, line = m.bark[3];
  contact(g, cx + 0.5, foot + 0.1, r + 1, 0.6, 0.35);
  const sg = g.createLinearGradient(cx - 0.4, 0, cx + 1.4, 0);
  sg.addColorStop(0, stem); sg.addColorStop(1, stemDark);
  g.fillStyle = sg;
  g.beginPath(); g.moveTo(cx - 0.2, foot - r - 0.6); g.lineTo(cx + 1.2, foot - r - 0.6); g.lineTo(cx + 1.5, foot + 0.2); g.lineTo(cx - 0.5, foot + 0.2); g.closePath(); g.fill();
  const x = cx + 0.5, y = foot - r - 0.5;
  const cg = g.createRadialGradient(x - r * 0.4, y - r * 0.7, 0, x, y - r * 0.3, r * 1.3);
  cg.addColorStop(0, mix(cap, '#ffffff', 0.25)); cg.addColorStop(0.5, cap); cg.addColorStop(1, capDark);
  g.fillStyle = cg; g.strokeStyle = line; g.lineWidth = 0.35;
  g.beginPath(); g.ellipse(x, y, r + 0.6, r + 0.4, 0, Math.PI, TAU); g.quadraticCurveTo(x, y + 0.7, x - r - 0.6, y); g.fill(); g.stroke();
  g.fillStyle = spot;
  for (const [dx, dy, k] of [[-0.45, -0.45, 0.22], [0.25, -0.75, 0.18], [0.55, -0.25, 0.14]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, Math.max(0.25, k * r), 0, TAU); g.fill(); }
}

/** A clump of ferns: fronds arching out and down from the middle. */
function ferns(g, cx, foot, size, m) {
  const [lit, body, shade] = m.fern;
  contact(g, cx, foot + 0.2, size * 0.9, 1, 0.3);
  for (let f = -3; f <= 3; f++) {
    const dir = f < 0 ? -1 : 1, reach = size * (1 - Math.abs(f) * 0.08), lift = size * (0.9 - Math.abs(f) * 0.15), spread = 0.4 + Math.abs(f) * 0.2;
    const at = (t) => [cx + dir * t * reach * spread, foot - Math.sin(t * Math.PI * 0.9) * lift];
    g.strokeStyle = f === 0 ? lit : body; g.lineWidth = 0.4;
    g.beginPath();
    for (let t = 0; t <= 1.001; t += 0.1) { const [x, y] = at(t); if (t === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
    for (let t = 0.15; t < 1; t += 0.12) {
      const [x, y] = at(t), len = 1.4 * (1 - t * 0.6);
      g.fillStyle = t < 0.5 ? lit : body;
      g.beginPath(); g.ellipse(x - dir * 0.2, y - len * 0.5, 0.35, len * 0.6, dir * 0.5, 0, TAU); g.fill();
      g.fillStyle = shade;
      g.beginPath(); g.ellipse(x + dir * 0.3, y + len * 0.4, 0.3, len * 0.5, -dir * 0.6, 0, TAU); g.fill();
    }
  }
}

/* ============================================================
   THE FRAMES: the sky's light, clouds, birds, the land, then everything that moves over it
   ============================================================ */

/**
 * Draw one frame. `env`: { t (the scenery's clock, ticks), DT, FPS, life, storm, prelude ({ phase, age } or null), calm
 * (no flashes or shaking), rand, everyAt, bolt (the lightning bolt's points while it shows, else null), flash (0..2:
 * the sky's lightning flash) }.
 */
export function drawClearing(ctx, art, env) {
  const { W, H, horizon, cw, ch, raw } = art, { t, DT, life, storm, prelude } = env;
  const sx = cw / W, sy = ch / H;
  const shake = env.calm || !prelude ? 0 : shakeOf(prelude);
  const dx = shake ? (Math.floor(t) % 2 ? shake : -shake) : 0, dy = shake > 1 && Math.floor(t) % 3 === 0 ? 1 : 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  if (shake) { ctx.fillStyle = raw.sky[0]; ctx.fillRect(0, 0, cw, ch); }
  ctx.drawImage(art.back, dx * sx, dy * sy);
  ctx.setTransform(sx, 0, 0, sy, dx * sx, dy * sy);

  if (art.sun) {
    const k = 0.5 + 0.2 * Math.sin(t / 10);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, art.sun.x, art.sun.y, art.sun.r * (2.4 + k), raw.sun[2], 0.28 * k);
    ctx.globalCompositeOperation = 'source-over';
  }
  for (const s of art.stars) {
    const a = 0.35 + 0.65 * Math.max(0, Math.sin((t + s.ph) / 6));
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    if (s.big && a > 0.7) {
      const k = s.r * (3 + 4 * (a - 0.7));
      ctx.fillStyle = `rgba(210, 225, 255, ${(a - 0.7) * 2})`;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - k); ctx.quadraticCurveTo(s.x, s.y, s.x + k, s.y); ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + k);
      ctx.quadraticCurveTo(s.x, s.y, s.x - k, s.y); ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - k);
      ctx.fill();
    }
  }
  const shadows = [];
  if (life.clouds) for (const c of life.clouds) {
    c.x += (c.speed * (1 + 3 * storm.level)) * DT;
    const x = (c.x % (W + c.w * 2)) - c.w;
    if (c.near && raw.clouds?.shadows) shadows.push([x, c]);
    cloud(ctx, x, c.y, c.w, c.h, c.near, raw.cloud);
  }
  if (raw.life.includes('birds')) birds(ctx, art, env);
  if (prelude?.phase === 'awake') { ctx.fillStyle = 'rgba(12, 42, 28, 0.15)'; ctx.fillRect(0, 0, W, horizon + 2); }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(prelude?.phase === 'awake' ? wokenFront(art) : art.front, dx * sx, dy * sy);
  ctx.setTransform(sx, 0, 0, sy, dx * sx, dy * sy);

  if (art.shafts) shafts(ctx, art, t);
  for (const [x, c] of shadows) {
    const rx = c.w * 0.9, ry = Math.max(2, c.w * 0.18), cx = x + c.w / 2 - (c.shadowY - horizon) * 0.3;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, horizon + 3, W, H); ctx.clip();
    ctx.translate(cx, c.shadowY); ctx.scale(1, ry / rx);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, 'rgba(10, 40, 30, 0.12)'); gr.addColorStop(0.6, 'rgba(10, 40, 30, 0.08)'); gr.addColorStop(1, 'rgba(10, 40, 30, 0)');
    ctx.fillStyle = gr;
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
  }
  if (storm.level > 0 && raw.storm) stormLight(ctx, art, storm);
  if (life.glints && life.glintColour != null) {
    const c = raw.marks.water[0];
    for (const g of life.glints) {
      const s = Math.sin((t + g.phase) / 5);
      if (s > 0.8) sparkle(ctx, g.x + 0.5, g.y + 0.5, 0.5 + (s - 0.8) * 6, c, (s - 0.8) * 5);
    }
  }
  if (life.blades) blades(ctx, art, life.blades, t, storm);
  if (life.butterflies) butterflies(ctx, art, env);
  if (life.leaves) leaves(ctx, art, env);
  if (life.fireflies) fireflies(ctx, art, t, life.fireflies);
  if (life.motes) motes(ctx, art, env);
  if (life.weather && storm.level < 1 && raw.weather) weather(ctx, art, env);
  if (life.rain && storm.level > 0 && raw.storm) rain(ctx, art, env);
  if (env.bolt) lightning(ctx, art, env);
  if (prelude) {
    if (prelude.phase === 'portal') portal(ctx, art, env);
    else if (prelude.phase === 'awake') awake(ctx, art, env);
    else wake(ctx, art, env);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function shakeOf({ phase, age }) {
  if (phase === 'awake') return 0;
  if (phase === 'portal') return (age | 0) < 6 ? 2 : 0;
  const e = age - BLOOM_AT;
  if (e < 0) return age > 2 ? (age > 12 ? 2 : 1) : 0;
  return e < 4 ? 2 : 1;
}

/** A cloud of round puffs on a flat base, lit from above (scene.js's cloud(): the same size and place). */
function cloud(g, x0, y0, w, h, near, [lit, body, shade, under]) {
  const floor = y0 + h, puffs = near ? [[0.2, 0.55], [0.42, 1], [0.65, 0.8], [0.84, 0.5]] : [[0.3, 0.7], [0.62, 1]];
  const p = new Path2D();
  let top = floor;
  for (const [at, size] of puffs) {
    const r = Math.max(2, h * size * 0.8), cx = x0 + w * at, cy = floor - 2;
    p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, TAU);
    top = Math.min(top, cy - r);
  }
  p.rect(x0 + 1, floor - 2.5, w - 2, 2.5);
  const gr = g.createLinearGradient(0, top, 0, floor);
  if (near) { gr.addColorStop(0, lit); gr.addColorStop(0.5, body); gr.addColorStop(0.85, shade); gr.addColorStop(1, under); }
  else { gr.addColorStop(0, rgba(body, 0.8)); gr.addColorStop(1, rgba(under, 0.75)); }
  g.fillStyle = gr;
  g.fill(p);
}

function birds(g, art, env) {
  const { W, horizon, raw } = art, { life, t, DT, FPS, rand, everyAt } = env;
  if (!life.flock && everyAt(FPS * 14, FPS * 3)) {
    life.flock = { x: -12, y: 4 + Math.floor(rand() * Math.max(1, horizon * 0.5)), birds: [[0, 0], [-5, 3], [-9, -2]].slice(0, 2 + Math.floor(rand() * 2)) };
  }
  if (!life.flock) return;
  life.flock.x += 0.9 * DT;
  g.strokeStyle = raw.bird; g.lineWidth = 0.45; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [dx, dy] of life.flock.birds) {
    const x = life.flock.x + dx, y = life.flock.y + dy + Math.sin((t + dx) / 3), flap = Math.sin((t + dx) * Math.PI / 2) * 1.2;
    g.beginPath(); g.moveTo(x - 2.2, y - flap); g.quadraticCurveTo(x - 1, y - flap * 0.4 - 0.3, x, y); g.quadraticCurveTo(x + 1, y - flap * 0.4 - 0.3, x + 2.2, y - flap); g.stroke();
  }
  if (life.flock.x > W + 14) life.flock = null;
}

/** Light falling through the canopy in slanted shafts (scene.js's lightShafts(), breathing). */
function shafts(g, art, t) {
  const { W, H, horizon } = art, low = horizon + (H - horizon) * 0.5, k = art.shafts;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let c = -low * 0.45 - 38; c < W + 38; c += 38) {
    const a = (0.1 + 0.05 * Math.sin(t / 9 + c / 17)) * k;
    const gr = g.createLinearGradient(0, 0, 0, low);
    gr.addColorStop(0, `rgba(255, 250, 200, ${a})`); gr.addColorStop(0.6, `rgba(255, 250, 200, ${a * 0.6})`); gr.addColorStop(1, 'rgba(255, 250, 200, 0)');
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(c, 0); g.lineTo(c + 5, 0); g.lineTo(c + 5 + low * 0.45 + 3, low); g.lineTo(c + low * 0.45 - 1, low); g.closePath(); g.fill();
  }
  g.restore();
}

/** The storm's light: the sky and the ground darken as it rolls in (scene.js's stormLight()). */
function stormLight(g, art, storm) {
  const { W, H, horizon, raw } = art, L = storm.level * (storm.fury ? 1.4 : 1);
  const part = ([k, r, gr, b], y0, y1) => {
    const m = Math.round(255 * Math.max(0.15, 1 - (1 - k) * L));
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = `rgb(${m}, ${m}, ${m})`;
    g.fillRect(0, y0, W, y1 - y0);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgb(${Math.round(r * L)}, ${Math.round(gr * L)}, ${Math.round(b * L)})`;
    g.fillRect(0, y0, W, y1 - y0);
  };
  part(raw.storm.sky, 0, horizon);
  part(raw.storm.ground, horizon, H);
  g.globalCompositeOperation = 'source-over';
}

function sparkle(g, x, y, r, colour, a) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = rgba(colour, clamp(a));
  g.beginPath();
  g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r);
  g.fill();
  g.restore();
}

/** The grass swaying in the wind (the same blades and gusts as the pixel version), each a slim curved stroke. */
function blades(g, art, list, t, storm) {
  const [tip, mid] = art.raw.blade;
  const paths = [new Path2D(), new Path2D()];
  for (const b of list) {
    const wind = Math.sin(t / 5 - b.x / 9 + b.y / 23) + 0.6 * Math.sin(t / 13 - b.x / 31) + storm.level * 1.4;
    const lean = clamp(wind * 0.55, -1.1, 1.1) * b.h * 0.6, h = b.h * 1.25, x = b.x + 0.5, y = b.y + 1;
    const p = paths[b.h >= 3 ? 1 : 0];
    p.moveTo(x, y); p.quadraticCurveTo(x, y - h * 0.6, x + lean, y - h);
    if (b.twin) { p.moveTo(x + 1.6, y); p.quadraticCurveTo(x + 1.6, y - h * 0.4, x + 1.6 + lean * 0.8, y - h * 0.7); }
  }
  g.lineCap = 'round';
  g.strokeStyle = rgba(mid, 0.85); g.lineWidth = 0.3; g.stroke(paths[0]);
  g.strokeStyle = rgba(mix(tip, mid, 0.45), 0.9); g.lineWidth = 0.38; g.stroke(paths[1]);
}

function butterflies(g, art, env) {
  const { W, raw } = art, { t, DT, life } = env;
  for (const f of life.butterflies) {
    f.x += f.vx * DT;
    if (f.x < -4) f.x = W + 3; else if (f.x > W + 4) f.x = -3;
    const y = f.y + Math.sin((t + f.phase) / 4) * 2.5, open = Math.abs(Math.sin((t + f.phase) * 1.6));
    g.fillStyle = packed(f.colour);
    for (const s of [-1, 1]) {
      g.beginPath(); g.ellipse(f.x + s * 0.75 * open, y - 0.55, 0.85 * open + 0.15, 0.7, s * 0.4, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(f.x + s * 0.55 * open, y + 0.35, 0.55 * open + 0.1, 0.45, -s * 0.4, 0, TAU); g.fill();
    }
    g.fillStyle = raw.bird;
    g.beginPath(); g.ellipse(f.x, y, 0.22, 0.75, 0, 0, TAU); g.fill();
  }
}

function leaves(g, art, env) {
  const { W, H } = art, { t, DT, life, rand } = env;
  for (const l of life.leaves) {
    l.y += l.vy * DT; l.x += (Math.sin((t + l.phase) / 5) * 0.45 + 0.08) * DT;
    if (l.y > H + 2) { l.y = -2; l.x = rand() * W; }
    if (l.x > W + 2) l.x = -2;
    leaf(g, l.x, l.y, (t + l.phase) / 3, packed(l.colour[0]), packed(l.colour[1]));
  }
}

function leaf(g, x, y, spin, a, b) {
  const turn = Math.cos(spin);
  g.save();
  g.translate(x, y); g.rotate(spin * 0.7);
  g.fillStyle = turn > 0 ? a : b;
  g.beginPath(); g.ellipse(0, 0, 1.1, 0.5 * Math.max(0.2, Math.abs(turn)), 0, 0, TAU); g.fill();
  g.strokeStyle = b; g.lineWidth = 0.15;
  g.beginPath(); g.moveTo(-1, 0); g.lineTo(1, 0); g.stroke();
  g.restore();
}

function fireflies(g, art, t, list) {
  const { W, raw } = art, [hot, warm] = raw.firefly;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const f of list) {
    const x = f.x + Math.sin((t + f.phase) / 11) * 5 + t * f.drift % W, y = f.y + Math.sin((t + f.phase) / 7) * 3;
    const xx = ((x % W) + W) % W, b = Math.sin((t + f.phase) / 4);
    if (b <= 0) continue;
    dot(g, xx, y, 1 + b * 2.2, warm, 0.55 * b);
    g.fillStyle = rgba(hot, b);
    g.beginPath(); g.arc(xx, y, 0.35, 0, TAU); g.fill();
  }
  g.restore();
}

function motes(g, art, env) {
  const { W, H, horizon, raw } = art, { t, DT, life } = env;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const m of life.motes) {
    m.x += m.vx * DT; m.y += (m.vy + Math.sin((t + m.phase) / 6) * 0.05) * DT;
    if (m.x > W + 2) m.x = -2;
    if (m.y < horizon - 14) m.y = H - 1;
    const s = Math.sin((t + m.phase) / 5);
    if (s <= 0) continue;
    dot(g, m.x, m.y, 0.9, raw.pollen[1], 0.5 * s);
    g.fillStyle = rgba(raw.pollen[0], s);
    g.beginPath(); g.arc(m.x, m.y, 0.22, 0, TAU); g.fill();
  }
  g.restore();
}

/** The battle's light weather: a drizzle at dawn and night, leaves blowing by day and dusk (scene.js's drawWeather()). */
function weather(g, art, env) {
  const { W, H } = art, { t, DT, life, storm, rand } = env, w = art.raw.weather, c = w.colours.map(x => packed(x));
  const reset = (p) => { p.y = -2 - rand() * 6; p.x = rand() * (W + 20) - 10; };
  const n = Math.round(life.weather.length * (1 - storm.level));
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const p = life.weather[i], s = p.speed;
    if (w.kind === 'drizzle') {
      p.y += 2.2 * s * DT; p.x -= 0.7 * s * DT;
      if (p.y > H) reset(p);
      g.strokeStyle = s > 1 ? c[0] : c[1]; g.lineWidth = 0.22;
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + 0.9, p.y - 2.6); g.stroke();
    } else if (w.kind === 'leaves') {
      p.y += 0.35 * s * DT; p.x += (0.35 + Math.sin((t + p.phase) / 6) * 0.6) * DT;
      if (p.y > H + 2 || p.x > W + 3) reset(p);
      const pair = (i % 3) * 2;
      leaf(g, p.x, p.y, (t + p.phase) / 3, c[pair], c[pair + 1]);
    }
  }
}

function rain(g, art, env) {
  const { W, H, horizon, raw } = art, { DT, life, storm, rand } = env, [bright, dim] = raw.storm.rain, fall = raw.storm.fall;
  const count = Math.round(life.rain.length * storm.level);
  g.lineCap = 'round';
  g.lineWidth = 0.2;
  const streaks = new Path2D(), splash = new Path2D();
  for (let i = 0; i < count; i++) {
    const d = life.rain[i];
    d.y += fall * d.speed * DT;
    d.x -= fall * d.speed * 0.4 * DT;
    if (d.y >= d.land) {
      if (d.land < H) { splash.moveTo(d.x - 1, d.land); splash.quadraticCurveTo(d.x, d.land - 0.8, d.x + 1, d.land); }
      d.y = -rand() * 10; d.x = rand() * (W + H * 0.5); d.land = horizon + rand() * (H - horizon + 6);
      continue;
    }
    streaks.moveTo(d.x, d.y); streaks.lineTo(d.x + 1.2, d.y - 3);
  }
  g.strokeStyle = rgba(bright, 0.75); g.stroke(streaks);
  g.strokeStyle = rgba(dim, 0.8); g.stroke(splash);
}

function lightning(g, art, env) {
  const { W, horizon } = art, { bolt, flash } = env;
  if (flash > 0) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(200, 210, 255, ${flash > 1 ? 0.35 : 0.15})`;
    g.fillRect(0, 0, W, horizon);
    g.restore();
  }
  if (!bolt?.length) return;
  g.save();
  g.lineJoin = 'round';
  g.shadowColor = '#c8c0ff';
  g.shadowBlur = 12;
  for (const [colour, w] of [['rgba(200, 192, 255, 0.6)', 1.2], ['#fffff0', 0.4]]) {
    g.strokeStyle = colour; g.lineWidth = w;
    g.beginPath();
    bolt.forEach(([x, y], i) => (i ? g.lineTo(x + 0.5, y) : g.moveTo(x + 0.5, y)));
    g.stroke();
  }
  g.restore();
}

/* ---------- the boss prelude: the giant tree wakes, bursts into one colossal blossom, and flowers cover the screen ---------- */

function sapVeins(g, art, age, reach, dim) {
  const { horizon, raw } = art, { cx, half, foot } = art.tree, [hot, warm] = raw.firefly;
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const x0 = (i / 5 - 0.5) * half * 1.5, top = foot * (1 - clamp(reach * 1.3 - noise(i, 31, 0) * 0.3));
    const at = (y) => cx + leanAt(y, half, horizon) + x0 + Math.sin(y * 0.3 + i * 2.1) * 1.6;
    if (dim) {
      for (let k = 0; k < 3; k++) {
        const y = foot - ((age * 3 + i * 7 + k * 18) % Math.max(1, foot - top));
        dot(g, at(y), y, 2.2, warm, 0.6);
        g.fillStyle = rgba(hot, 0.9);
        g.beginPath(); g.arc(at(y), y, 0.45, 0, TAU); g.fill();
      }
      continue;
    }
    const p = new Path2D();
    for (let y = foot; y >= top; y -= 0.5) (y === foot ? p.moveTo(at(y), y) : p.lineTo(at(y), y));
    g.strokeStyle = rgba(warm, 0.18); g.lineWidth = 1.8; g.stroke(p);
    g.strokeStyle = rgba(hot, 0.6); g.lineWidth = 0.45; g.stroke(p);
    glow(g, at(top), top, 2.4, WHITE, 0.7);
  }
  g.restore();
}

function wakingRoots(g, art, age, reach, dim) {
  const { H, raw } = art, { cx, half, foot } = art.tree, bark = raw.marks.bark, [hot, warm] = raw.firefly;
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1, k = i >> 1;
    let x = cx + side * half * (0.9 + k * 0.45);
    const drift = side * (0.5 + k * 0.55), end = foot + (H - foot) * clamp(reach * 1.3 - k * 0.15);
    const pts = [];
    for (let y = foot; y < end; y++) {
      const near = (y - foot) / Math.max(1, H - foot), w = dim ? 0.8 : 1.5 + near * 3;
      x += drift * (1 + near) + (noise(i, y >> 1, 34) - 0.5) * 1.4;
      pts.push([x, y, w]);
    }
    if (pts.length < 2) continue;
    const p = new Path2D();
    p.moveTo(pts[0][0] - pts[0][2], pts[0][1]);
    for (const [px, py, w] of pts) p.lineTo(px - w, py);
    for (let j = pts.length - 1; j >= 0; j--) p.lineTo(pts[j][0] + pts[j][2], pts[j][1]);
    p.closePath();
    g.fillStyle = dim ? mix(bark[2], bark[3], 0.4) : bark[1];
    g.fill(p);
    g.strokeStyle = rgba(bark[3], 0.8); g.lineWidth = 0.35; g.stroke(p);
    if (dim) continue;
    const seam = new Path2D();
    pts.forEach(([px, py], j) => (j ? seam.lineTo(px, py) : seam.moveTo(px, py)));
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    g.strokeStyle = rgba(warm, 0.45); g.lineWidth = 1.6; g.stroke(seam);
    g.strokeStyle = rgba(hot, 0.9); g.lineWidth = 0.45; g.stroke(seam);
    g.restore();
    if (reach >= 1) continue;
    g.fillStyle = bark[2];
    for (let c = 0; c < 4; c++) {   // clods of earth flung off the tip
      const a = (age + c * 2) % 6;
      g.beginPath(); g.arc(x + (c - 1.5) * a * 0.8, end - a * (3 - a * 0.45), 0.55, 0, TAU); g.fill();
    }
  }
}

function bloomWave(g, art, age, awake) {
  const { W, H, horizon, raw } = art, { cx, foot } = art.tree, count = Math.round(W * (H - horizon) / 90);
  for (let i = 0; i < count; i++) {
    const x = noise(i, 41, 0) * W, y = horizon + 3 + noise(i, 41, 1) ** 0.8 * (H - horizon - 4);
    const a = awake ? 99 : age - (3 + Math.hypot(x - cx, (y - foot) * 2.2) / W * 20);
    if (a < 0 || (awake && i % 3)) continue;
    const [petal, heart] = raw.flowers[i % raw.flowers.length], depth = (y - horizon) / (H - horizon);
    if (a < 1.5) { sparkle(g, x, y, 2.4 - a, WHITE, 1 - a / 1.5); continue; }
    bloom(g, x, y, (depth > 0.4 ? 0.7 : 0.4) + depth * 0.6, petal, heart, i);
  }
}

function leafCyclone(g, art, age, burst) {
  const { W, raw } = art, { cx, half, foot } = art.tree, n = Math.min(90, 16 + age * 4);
  for (let i = 0; i < n; i++) {
    const angle = noise(i, 51, 0) * TAU + age * (0.3 + noise(i, 51, 1) * 0.25 + age * 0.012);
    let r = half * (1.15 + noise(i, 51, 2) * 1.4);
    if (burst >= 0) r += burst * burst * W * 0.04;
    const climb = foot - ((noise(i, 51, 3) * foot + age * (2 + noise(i, 51, 4) * 2)) % foot);
    const x = cx + Math.cos(angle) * r, y = climb + Math.sin(angle) * r * 0.18;
    if (Math.sin(angle) < 0 && Math.abs(x - cx) < half) continue;   // behind the trunk
    const [lit, dark] = raw.leaves[i % raw.leaves.length];
    leaf(g, x, y, age * 0.8 + i, lit, dark);
  }
}

function heartGlow(g, x, y, r) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  glow(g, x, y, r * 2.4, '#f8f8a0', 0.55, r * 3.2);
  glow(g, x, y, r, WHITE, 1, r * 1.5);
  g.restore();
}

const blossomSize = (art) => Math.round(Math.min(art.W * 0.3, art.H * 0.28));

/** A five-petalled blossom of radius r, turning slowly: a rim, a pale vein down each petal and a gold heart. */
function giantBlossom(g, cx, cy, r, spin, [rim, petal, lit, heart]) {
  if (r < 1) return;
  const turn = spin * 0.04, p = new Path2D();
  for (let a = 0; a <= TAU + 0.001; a += 0.04) {
    const d = r * (0.3 + 0.7 * Math.abs(Math.cos((a - turn) * 2.5)) ** 0.5);
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    if (a === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  p.closePath();
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
  gr.addColorStop(0, lit); gr.addColorStop(0.5, lit); gr.addColorStop(0.9, petal); gr.addColorStop(1, petal);
  g.fillStyle = gr;
  g.fill(p);
  g.strokeStyle = rim; g.lineWidth = Math.max(0.3, r * 0.04);
  g.stroke(p);
  g.strokeStyle = rgba(WHITE, 0.75); g.lineWidth = Math.max(0.2, r * 0.025); g.lineCap = 'round';
  for (let k = 0; k < 5; k++) {
    const a = turn + k * TAU / 5;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2); g.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); g.stroke();
  }
  g.fillStyle = heart;
  g.beginPath(); g.arc(cx, cy, r * 0.16, 0, TAU); g.fill();
  g.fillStyle = WHITE;
  g.beginPath(); g.arc(cx, cy, r * 0.07, 0, TAU); g.fill();
}

function petalGale(g, art, cx, cy, e) {
  const { W, H } = art, [rim, petal, lit] = BLOSSOM;
  for (let i = 0; i < 110; i++) {
    const a = e - noise(i, 71, 0) * 5;
    if (a < 0) continue;
    const side = i % 2 ? 1 : -1, speed = W * (0.05 + noise(i, 71, 1) * 0.09);
    const x = cx + side * (blossomSize(art) * 0.4 + a * speed);
    const y = cy + (noise(i, 71, 2) - 0.25) * H * 0.85 * Math.min(1, a / 2.5) + Math.sin(a * 1.9 + i) * 2 + a * a * 0.35;
    g.strokeStyle = rgba(petal, 0.35); g.lineWidth = 0.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - side * 5, y + 0.6); g.lineTo(x - side, y); g.stroke();
    g.save();
    g.translate(x, y); g.rotate(a * 2 + i);
    g.fillStyle = (a * 2 + i | 0) % 2 ? lit : petal;
    g.beginPath(); g.ellipse(0, 0, 1.3, 0.75, 0, 0, TAU); g.fill();
    g.strokeStyle = rim; g.lineWidth = 0.15; g.stroke();
    g.restore();
  }
}

function wake(g, art, env) {
  const { W, H, horizon } = art, { age } = env.prelude, { hx, hy } = art.tree;
  g.fillStyle = `rgba(12, 42, 28, ${Math.min(0.42, age / BLOOM_AT * 0.42)})`;
  g.fillRect(-4, -4, W + 8, H + 8);
  sapVeins(g, art, age, Math.min(1, age / 16), false);
  wakingRoots(g, art, age, Math.max(0, (age - 4) / 16), false);
  bloomWave(g, art, age, false);
  const e = age - BLOOM_AT;
  leafCyclone(g, art, age, e);
  if (e < 0) {
    const s = age / BLOOM_AT, beat = Math.max(0, Math.sin(age * (0.8 + s * 2.2))), r = 3 + s * 8 + beat * (2 + s * 4);
    g.save();
    g.globalCompositeOperation = 'lighter';
    // motes of light rise off the meadow and spiral into the heartwood
    for (let i = 0; i < 48; i++) {
      const a = age - i * 0.35;
      if (a < 0) continue;
      const lap = (a / 9) | 0, u = (a % 9) / 9, gx = noise(i, lap, 55) * W, gy = horizon + 4 + noise(i, lap, 56) * (H - horizon - 4);
      const swirl = Math.sin(u * 7 + i) * (1 - u) * 8, x = gx + (hx - gx) * u * u + swirl, y = gy + (hy - gy) * u * u;
      dot(g, x, y, 1.6, '#f8f8a0', 0.7);
    }
    // rays wheel out of it as it nears bursting
    if (s > 0.4) for (let k = 0; k < 10; k++) {
      const ang = k * Math.PI / 5 + age * 0.15, len = (s - 0.4) / 0.6 * W * 0.5;
      const gr = g.createRadialGradient(hx, hy, r, hx, hy, len);
      gr.addColorStop(0, 'rgba(255, 252, 220, 0.35)'); gr.addColorStop(1, 'rgba(255, 252, 220, 0)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(hx, hy);
      g.lineTo(hx + Math.cos(ang - 0.05) * len, hy + Math.sin(ang - 0.05) * len * 0.8);
      g.lineTo(hx + Math.cos(ang + 0.05) * len, hy + Math.sin(ang + 0.05) * len * 0.8);
      g.closePath(); g.fill();
    }
    g.restore();
    heartGlow(g, hx, hy, r);
    return;
  }
  // it bursts: a white flash, and the heartwood unfurls into one colossal blossom that gusts petals across the meadow
  if (Math.floor(e) === 0) { g.fillStyle = `rgba(255, 252, 232, ${env.calm ? 0.15 : 0.45})`; g.fillRect(-4, -4, W + 8, H + 8); }
  const big = blossomSize(art), open = Math.min(1, (e + 1) / 3) ** 0.7, ring = e * W * 0.13;
  if (ring > 1) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(255, 252, 232, 0.8)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(hx, hy + 4, ring, ring * 0.45, 0, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(248, 248, 160, 0.5)'; g.lineWidth = 2.4; g.stroke();
    g.restore();
  }
  giantBlossom(g, hx, hy, big * open, age, BLOSSOM);
  heartGlow(g, hx, hy, Math.max(2, 5 - e * 0.4));
  petalGale(g, art, hx, hy, e);
}

function portal(g, art, env) {
  const { W, H, raw } = art, { age } = env.prelude, frame = age | 0, { hx, hy } = art.tree;
  if ((frame === 6 || frame === 8) && !env.calm) { g.fillStyle = WHITE; g.fillRect(-4, -4, W + 8, H + 8); return; }
  g.fillStyle = 'rgba(12, 42, 28, 0.42)';
  g.fillRect(-4, -4, W + 8, H + 8);
  petalGale(g, art, hx, hy, age + 9);
  giantBlossom(g, hx, hy, blossomSize(art) * (1 + age * 0.12), age + 30, BLOSSOM);
  const cell = Math.max(10, Math.round(Math.min(W, H) / 4)), far = Math.hypot(W, H);
  const [rim, , lit] = BLOSSOM;
  const looks = [BLOSSOM, [rim, lit, WHITE, '#f8e048'], ...raw.flowers.map(([p, h]) => [rim, p, WHITE, h])];
  let n = 0;
  for (let gy = -cell / 2; gy < H + cell; gy += cell * 0.8) for (let gx = -cell / 2; gx < W + cell; gx += cell * 0.8, n++) {
    const x = gx + (noise(n, 81, 0) - 0.5) * cell * 0.6, y = gy + (noise(n, 81, 1) - 0.5) * cell * 0.6;
    const grow = Math.min(1, Math.max(0, (age - Math.hypot(x - hx, y - hy) / far * 3.5) / 1.6));
    giantBlossom(g, x, y, cell * 0.95 * grow, age * (n % 2 ? 1 : -1) + n * 9, looks[n % looks.length]);
  }
}

function awake(g, art, env) {
  const { age } = env.prelude, { hx, hy } = art.tree;
  sapVeins(g, art, age, 1, true);
  heartGlow(g, hx, hy, 3 + (Math.sin(age * 0.75) + 1));
}

/** The land once the tree has woken: its roots and a third of the flowers lie still over the fight, so they're painted
    into a copy of the front layer once (not another full-screen layer every frame). */
function wokenFront(art) {
  if (!art.woken) {
    const [c, w] = layer(art.cw, art.ch, art.W, art.H);
    w.save(); w.setTransform(1, 0, 0, 1, 0, 0); w.drawImage(art.front, 0, 0); w.restore();
    wakingRoots(w, art, 0, 0.35, true);
    bloomWave(w, art, 0, true);
    art.woken = c;
  }
  return art.woken;
}

/* ---------- the battle pad ---------- */

/** The grassy pad a Pokémon stands on, smooth: the same 48:16 frame and oval as scene.js's padImage(), 8x the pixels. */
export function smoothPad({ top, mid, low, rim, earth, blade }) {
  const k = 8, w = 48 * k, h = 16 * k;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const cx = w / 2, rx = (24 - 0.5) * k, ry = 4.5 * k, cy = 7 * k;
  // the earth showing under the turf's edge
  const eg = g.createLinearGradient(0, cy, 0, cy + ry + 2 * k);
  eg.addColorStop(0, earth); eg.addColorStop(1, mix(earth, '#000000', 0.35));
  g.fillStyle = eg;
  g.beginPath(); g.ellipse(cx, cy + 2 * k, rx, ry, 0, 0, TAU); g.fill();
  g.strokeStyle = rgba(rim, 0.85); g.lineWidth = k * 0.7;
  g.beginPath(); g.ellipse(cx, cy + 2 * k, rx, ry, 0, 0, Math.PI); g.stroke();
  // the turf
  const tg = g.createRadialGradient(cx, cy - ry * 0.9, rx * 0.05, cx, cy, rx * 1.05);
  tg.addColorStop(0, mix(top, '#ffffff', 0.15)); tg.addColorStop(0.35, top); tg.addColorStop(0.7, mid); tg.addColorStop(1, low);
  g.save();
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  g.fillStyle = tg; g.fill();
  g.clip();
  const shade = g.createLinearGradient(0, cy - ry, 0, cy + ry);
  shade.addColorStop(0, 'rgba(255, 255, 255, 0.12)'); shade.addColorStop(0.55, 'rgba(0, 0, 0, 0)'); shade.addColorStop(1, 'rgba(0, 20, 0, 0.22)');
  g.fillStyle = shade;
  g.fillRect(0, 0, w, h);
  g.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const a = noise(i, 3, 1) * TAU, d = Math.sqrt(noise(i, 4, 2)) * 0.92, x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    g.strokeStyle = rgba(i % 3 ? low : blade, 0.55); g.lineWidth = k * 0.35;
    g.beginPath(); g.moveTo(x, y + k * 0.6); g.quadraticCurveTo(x, y, x + (noise(i, 5, 3) - 0.5) * k, y - k * 0.8); g.stroke();
  }
  g.restore();
  g.strokeStyle = rgba(rim, 0.9); g.lineWidth = k * 0.6;
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.stroke();
  // blades round the rim
  for (let i = 0; i < 70; i++) {
    const a = Math.PI + (i / 69) * Math.PI + (noise(i, 6, 1) - 0.5) * 0.05, x = cx + Math.cos(a) * rx * 0.98, y = cy + Math.sin(a) * ry * 0.98;
    if (Math.abs(Math.cos(a)) > 0.97) continue;
    const hgt = k * (0.9 + noise(i, 7, 2) * 1.3), lean = (noise(i, 8, 3) - 0.5) * k * 1.2;
    g.strokeStyle = i % 2 ? blade : top; g.lineWidth = k * 0.4;
    g.beginPath(); g.moveTo(x, y + k * 0.3); g.quadraticCurveTo(x, y - hgt * 0.5, x + lean, y - hgt); g.stroke();
  }
  return c.toDataURL();
}
