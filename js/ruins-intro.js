/* ============================================================
   ruins-intro.js  -  arriving in the Sunken Ruins (roadmap item 19 part b).

   The same film as the other biomes' (run() in js/biome-intro.js plays
   it: the title, the Pokémon popping out, your Pokémon walking on), with
   its own painter and camera: it tilts down out of a passing drizzle onto
   the lagoon, the drowned temple mirrored in it far off, then glides low
   over the water between half-sunk columns (true 3D: each one grows and
   slides out past the edge as you pass it) while the temple's runes wake
   one by one, each with a plink like a drop into still water. The wild
   Pokémon surface out of the water with a splash.

   Layers (the far cliffs and jungle, the temple, the lagoon) are painted
   once into ImageData and pushed in about the vanishing point by the
   camera; each has a mirrored twin, tinted with the water, drawn under it
   in rippling strips, so the whole picture is reflected. The land colours
   come graded for the hour from run(); the runes glow by themselves.
   ============================================================ */

import { ease, span, layer, settle, paintSky, cloudImage } from './biome-intro.js';
import { playSound } from './audio.js';

const PUSH = { far: 0.1, temple: 0.28, water: 0.5, fore: 1 };
const RUNE = ['#f0fffc', '#8af8e8', '#2ec8c0'];

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const noise = (a, b, c) => { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); };
const word = (hex) => { const n = parseInt(hex.slice(1), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
const mixW = (a, b, k) => { const f = (s) => Math.round(((a >>> s) & 255) * (1 - k) + ((b >>> s) & 255) * k); return (0xff000000 | (f(16) << 16) | (f(8) << 8) | f(0)) >>> 0; };

/** A layer painted pixel by pixel (ABGR words), turned into a canvas once it's done. */
function pixels(w, h) {
  const c = layer(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = new Uint32Array(img.data.buffer);
  return {
    w, h, d,
    put(x, y, hex) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) d[y * w + x] = typeof hex === 'string' ? word(hex) : hex; },
    done() { g.putImageData(img, 0, 0); return c; },
  };
}

/** The same layer upside down about row `hz`, tinted towards the water deepening towards you: its reflection. */
function mirrored(p, hz, H, water) {
  const m = pixels(p.w, p.h), [, lit, , deep] = water.map(word);
  for (let y = hz; y < H; y++) {
    const sy = 2 * hz - 1 - y, k = (y - hz) / Math.max(1, H - hz);
    if (sy < 0) break;
    const tint = mixW(lit, deep, Math.min(1, k * 1.3)), keep = 0.42 + k * 0.38;
    for (let x = 0; x < p.w; x++) {
      const c = p.d[sy * p.w + x];
      if (c >>> 24) m.d[y * p.w + x] = mixW(c, tint, keep);
    }
  }
  return m.done();
}

/** Courses of dressed stone over x0..x1, y0..y1, mossy in patches; `skip(x, y)` leaves holes. */
function masonry(p, x0, x1, y0, y1, stone, moss, seed, skip = null, shade = null) {
  for (let y = Math.max(0, Math.round(y0)); y <= y1; y++) {
    const row = Math.floor((y - y0) / 3), ry = Math.round(y - y0) % 3, off = (row & 1) * 3;
    for (let x = Math.max(0, Math.round(x0)); x <= x1; x++) {
      if (skip?.(x, y)) continue;
      let i = ry === 2 || (x - Math.round(x0) + off) % 7 === 0 ? 3 : ry === 0 ? 0 : noise(x >> 1, y >> 1, seed) < 0.2 ? 2 : 1;
      if (shade && bayer(x, y) < shade(x) * 16) i = Math.min(4, i + 1);
      p.put(x, y, i && noise(x >> 2, y >> 2, seed + 1) < 0.2 ? moss[i >= 3 ? 2 : 1] : stone[i]);
    }
  }
}

const inArch = (x, y, cx, foot, hw, h) => {
  const dx = x + 0.5 - cx, spring = foot - h + hw;
  return Math.abs(dx) <= hw && y <= foot && (y >= spring || dx * dx + (y + 0.5 - spring) ** 2 <= hw * hw);
};

/** A column as a sprite (w x h): base, fluted shaft lit on its left, a capital; `broken` snapped off jagged. */
function columnSprite(w, h, { stone, moss }, broken) {
  const p = pixels(w, h), hw = (w - 1) / 2, cap = broken ? 0 : Math.max(2, Math.round(w * 0.3));
  for (let y = 0; y < h; y++) {
    const up = h - 1 - y, isCap = y < cap, base = up < 3;
    const half = isCap || base ? hw : hw - 1;
    for (let x = 0; x < w; x++) {
      const dx = x - hw;
      if (Math.abs(dx) > half) continue;
      if (broken && y < Math.round(Math.abs(Math.sin(x * 1.9)) * w * 0.6)) continue;
      const u = (dx + half + 0.5) / (half * 2 + 1);
      let i = u < 0.22 ? 0 : u < 0.6 ? 1 : u < 0.86 ? 2 : 3;
      if (!isCap && !base && x % 2 === 0 && Math.abs(dx) < half) i = Math.min(4, i + 1);
      if (y === cap - 1 || up === 3 || dx === half) i = 4;
      p.put(x, y, up < h * 0.3 * noise(x, 3, 4) + 2 && noise(x, y >> 1, 5) < 0.6 ? moss[i >= 2 ? 2 : 1] : broken && y < w && noise(x, y, 6) < 0.4 ? moss[0] : stone[i]);
    }
  }
  return p;
}

function ruinsScene({ look, mini, land, sky, cloud, time, W, H, tall, rand, beats, live }) {
  const hz = Math.round(H * (tall ? 0.46 : 0.5)), VX = Math.round(W * 0.5), span0 = H - hz;
  const B = mini ? { TILT: [0, 1], PUSH: [0, beats.END], LIGHTS: [] } : beats;
  const goal = look.goal || 1;
  const tilt = (ms) => (mini ? 1 : ease(span(B.TILT, ms)));
  const drop = (ms, k) => (1 - tilt(ms)) * H * 0.9 * k;   // how far below its place a layer still is while the camera tilts down
  const zoom = (ms) => (mini ? 0.3 : 0.5) * ease(span(B.PUSH, ms));
  const grow = (ms, k) => 1 + zoom(ms) * k;
  const { far, jungle, trunk, stone, moss, water, lily, lotus, vine } = land;

  // ---- the sky ----
  const skyC = layer(W, H);
  paintSky(skyC.getContext('2d'), W, H, hz, sky, time, rand);
  const clouds = Array.from({ length: 4 }, (_, i) => ({ img: cloudImage(14 + Math.floor(rand() * 16), cloud, rand), x: rand() * W, y: hz * (0.08 + rand() * 0.4), v: 0.6 + rand() * 1.2 + i * 0.2 }));

  // ---- the far shore: cliffs with falls down them, the jungle, palms ----
  const farP = pixels(W, H);
  for (let x = 0; x < W; x++) {
    const top = Math.round(hz - H * 0.07 - H * 0.05 * (0.6 * Math.sin(x * 0.05 + 1.7) + 0.4 * Math.sin(x * 0.13 + 4)));
    for (let y = Math.max(0, top); y < hz; y++) farP.put(x, y, y === top ? far[0] : Math.sin(x * 0.05 + 2.5) < -0.3 && bayer(x, y) < 9 ? far[2] : far[1]);
  }
  for (const at of [0.22, 0.74]) {
    const x = Math.round(W * at);
    let y = 0;
    while (y < hz && !(farP.d[y * W + x] >>> 24)) y++;
    for (let yy = y + 1; yy < hz; yy++) { farP.put(x, yy, (yy % 5) < 2 ? water[0] : water[1]); if (W > 160) farP.put(x + 1, yy, water[1]); }
  }
  for (let x = -4; x < W + 4; x += 2 + Math.floor(rand() * 4)) {
    const r = 2 + Math.floor(rand() * H * 0.035), cy = hz - H * 0.025 - Math.floor(rand() * H * 0.02);
    for (let dy = -r; cy + dy < hz; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dy < 0 && dx * dx + dy * dy > r * r) continue;
      const l = (dx + dy * 1.2) / r;
      farP.put(x + dx, cy + dy, dy > r * 0.5 ? jungle[3] : l < -0.8 ? jungle[0] : l < 0.2 ? (bayer(x + dx, cy + dy | 0) < 4 ? jungle[0] : jungle[1]) : jungle[2]);
    }
  }
  for (let n = 0; n < Math.max(2, Math.round(W / 50)); n++) {   // palms
    const cx = rand() * W, foot = hz - H * 0.03, h = H * (0.07 + rand() * 0.06), lean = rand() < 0.5 ? -1 : 1;
    let x = cx;
    for (let k = 0; k < h; k++) { x = cx + lean * (k / h) ** 2 * h * 0.35; farP.put(x, foot - k, k % 3 ? trunk[0] : trunk[1]); }
    for (const [ang, len] of [[-2.8, 1], [-2.2, 0.7], [-0.9, 0.7], [-0.35, 1], [3.05, 0.6], [0.1, 0.6]]) {
      const L = Math.max(3, Math.round(h * 0.45 * len));
      for (let k = 1; k <= L; k++) { const fx = x + Math.cos(ang) * k, fy = foot - h + Math.sin(ang) * k + (k / L) ** 2 * L * 0.5; farP.put(fx, fy, jungle[k < L * 0.35 ? 1 : 0]); farP.put(fx, fy + 1, jungle[2]); }
    }
  }

  // ---- the temple, far across the lagoon: a stepped pyramid, its stair down into the water, runes by its door ----
  const templeP = pixels(W, H), sz = Math.round(Math.min(W * 0.34, H * 0.3) * goal ** 0.15), runes = [];
  {
    const cx = VX, foot = hz - 1, hw0 = Math.round(sz * 0.55), ph = Math.max(3, Math.round(sz * 0.2)), top0 = foot - ph;
    const right = (x0, x1) => (x) => Math.max(0, ((x - x0) / Math.max(1, x1 - x0) - 0.6) * 2);
    masonry(templeP, cx - hw0, cx + hw0, top0, foot, stone, moss, 11, null, right(cx - hw0, cx + hw0));
    for (let y = top0; y <= foot; y++) {
      const hf = Math.round(sz * (0.1 + 0.07 * (y - top0) / ph)), tread = (y - top0) % 2 === 0;
      for (let x = -hf - 1; x <= hf + 1; x++) templeP.put(cx + x, y, Math.abs(x) > hf ? stone[4] : tread ? stone[x < 0 ? 0 : 1] : stone[3]);
    }
    let y1 = top0 - 1;
    [[0.8, 0.2], [0.58, 0.15], [0.34, 0.15]].forEach(([wk, hk], i) => {
      const hw = Math.round(hw0 * wk), th = Math.max(3, Math.round(sz * hk)), y0 = y1 - th + 1;
      const cut = i === 1 ? (x, y) => x - (cx + hw - Math.round(hw * 0.3)) > y - y0 : null;
      masonry(templeP, cx - hw, cx + hw, y0, y1, stone, moss, 12 + i, cut, right(cx - hw, cx + hw));
      for (let x = cx - hw; x <= cx + hw; x++) if (!cut?.(x, y0)) templeP.put(x, y0, bayer(x, y0) < 6 ? moss[0] : stone[0]);
      for (let x = cx - hw; x <= cx + hw; x++) if (noise(x, i, 7) < 0.1) for (let k = 1; k < Math.min(th, 2 + noise(x, i, 8) * 6); k++) templeP.put(x, y0 + k, vine[k % 3 ? 1 : 0]);
      if (i === 0) {
        const dw = Math.max(1, Math.round(sz * 0.06)), dh = Math.max(3, Math.round(th * 0.7));
        for (let y = y1 - dh - 1; y <= y1; y++) for (let x = cx - dw - 1; x <= cx + dw + 1; x++) {
          if (inArch(x, y, cx, y1, dw, dh)) templeP.put(x, y, y > y1 - 2 ? water[3] : water[4]);
          else if (inArch(x, y, cx, y1, dw + 1, dh + 1)) templeP.put(x, y, x < cx ? stone[0] : stone[3]);
        }
        for (const s of [-1, 1]) for (let y = y1 - dh + 1; y < y1; y += 2) runes.push({ x: cx + s * (dw + 2), y });
      }
      if (i === 2) {
        for (let x = cx - hw - 2; x <= cx + hw + 2; x++) { templeP.put(x, y0 - 2, stone[0]); templeP.put(x, y0 - 1, stone[3]); }
        runes.push({ x: cx, y: y0 + Math.floor(th / 2) });
      }
      y1 = y0 - 1;
    });
    for (const p of runes) templeP.put(p.x, p.y, stone[4]);
  }
  // runes light in order: the door's from the bottom up, both sides together, then the eye on top
  runes.sort((a, b) => (a.x === VX) - (b.x === VX) || b.y - a.y);

  // ---- the lagoon, and the old paving glimpsed under it ----
  const waterP = pixels(W, H);
  for (let y = hz; y < H; y++) {
    const k = (y - hz) / span0, a = y - hz + 1, row = Math.floor(30 / a), joint = a >= 8 && row !== Math.floor(30 / (a + 1));
    const t = Math.min(1, 0.15 + k * 1.1) * 3, i = Math.min(2, Math.floor(t));
    for (let x = 0; x < W; x++) {
      let c = word(bayer(x, y) < (t - i) * 16 ? water[i + 2 > 4 ? 4 : i + 2] : water[i + 1]);
      const X = ((x + 0.5 - VX) / a) * 3 + (row & 1) * 0.5, X1 = ((x + 1.5 - VX) / a) * 3 + (row & 1) * 0.5;
      if (a >= 6 && (joint || Math.floor(X) !== Math.floor(X1))) c = mixW(c, word(water[4]), 0.16);
      if (noise(x >> 3, y, 9) > 0.86 && k < 0.6) c = mixW(c, word(water[0]), 0.22);
      waterP.d[y * W + x] = c;
    }
  }
  // the temple's stair carries on down under the water
  for (let y = hz; y < hz + span0 * 0.2; y++) {
    const hf = Math.round(sz * 0.17 + (y - hz) * 0.25), f = (y - hz) / (span0 * 0.2);
    for (let x = -hf; x <= hf; x++) { const i = y * W + VX + x; if (VX + x >= 0 && VX + x < W) waterP.d[i] = mixW(word((y - hz) % 2 ? stone[3] : stone[1]), waterP.d[i], 0.4 + f * 0.55); }
  }

  const skyRow = pixels(W, H);   // the sky, mirrored too
  { const g = skyC.getContext('2d'), d = new Uint32Array(g.getImageData(0, 0, W, H).data.buffer); skyRow.d.set(d); }
  const reflections = [mirrored(skyRow, hz, H, water), mirrored(farP, hz, H, water), mirrored(templeP, hz, H, water)];
  const farC = farP.done(), templeC = templeP.done(), waterC = waterP.done();

  // ---- the columns standing in the water either side of the way, in 3D, and their sprites ----
  const sprites = [false, true].map(broken => {
    const p = columnSprite(9, 60, { stone, moss }, broken);
    const m = pixels(9, 60), [, lit, , deep] = water.map(word);
    for (let y = 0; y < 60; y++) for (let x = 0; x < 9; x++) { const c = p.d[(59 - y) * 9 + x]; if (c >>> 24) m.d[y * 9 + x] = mixW(c, mixW(lit, deep, y / 60), 0.5 + y / 150); }
    return { img: p.done(), flip: m.done() };
  });
  const cols = [];
  for (let z = 2.2, side = 1; z < 16; z += 1.15 + rand() * 0.6, side = -side) {
    const dense = look.cols || 1;
    cols.push({ X: side * (0.62 + rand() * 0.45) / dense ** 0.3, Z: z, h: rand() < 0.35 ? 0.4 + rand() * 0.3 : 0.9 + rand() * 0.25, broken: rand() < 0.35 });
    if (dense > 1 && rand() < 0.6) cols.push({ X: -side * (0.6 + rand() * 0.3), Z: z + 0.5, h: 0.95, broken: false });
  }
  const camZ = (ms) => (mini ? 2.6 : 7.5) * ease(span(B.PUSH, ms));

  // ---- lily pads: sprites floating near, more of them in the Court ----
  const pads = Array.from({ length: Math.round(8 * (look.lilies || 1)) }, () => ({ X: (rand() < 0.5 ? -1 : 1) * (0.25 + rand() * 1.1), Z: 1.6 + rand() * 12, r: 0.06 + rand() * 0.05, bloom: rand() < 0.3 }));

  // ---- where the Pokémon surface: either side of the way, ahead of where the camera comes to rest ----
  const spots = beats.POPS.map((ms, i) => {
    const k = i + 3 - beats.POPS.length, depth = [0.36, 0.22, 0.58][k], y = Math.round(hz + span0 * depth), x = Math.round(W * [0.28, 0.7, 0.42][k]);
    return { ms, x, y, scale: 0.6 + depth * 0.6, size: Math.round(5 + depth * 12) };
  });
  const end = grow(beats.END, PUSH.water);
  settle(spots, { way: (s) => [VX, 2 + ((s.y - hz) / span0) * W * 0.12], view: () => [0, W], rest: [VX - VX / end, VX + (W - VX) / end] });
  const at = (x, y, ms, k) => { const s = grow(ms, k); return [VX + (x - VX) * s, hz + (y - hz) * s + drop(ms, 1)]; };

  const drizzle = Array.from({ length: Math.round(W * H / 90) }, () => ({ x: rand() * W, y: rand() * H, v: 0.8 + rand() * 0.5 }));
  let lastMs = 0;
  const plinked = new Set();

  function draw(bg, fg, ms, tick) {
    const R = bg.snap, dt = Math.min(0.1, (ms - lastMs) / 1000);
    lastMs = ms;
    const layerAt = (g, img, k, d) => { const s = grow(ms, k); g.drawImage(img, R(VX - VX * s), R(hz - hz * s + drop(ms, d)), R(W * s), R(H * s)); };
    // a reflection, cut into strips that each slide a little, so it ripples
    const rippled = (img, k, d) => {
      const s = grow(ms, k), x0 = VX - VX * s, y0 = hz - hz * s + drop(ms, d);
      for (let y = hz; y < H; y += 2) {
        const off = Math.sin(y * 0.7 - tick * 5) * (0.3 + (y - hz) / span0 * 1.2);
        bg.drawImage(img, 0, y, W, 2, R(x0 + off * s), R(y0 + y * s), R(W * s), R(2 * s));
      }
    };
    bg.fillStyle = sky[0];
    bg.fillRect(0, 0, W, Math.ceil(drop(ms, 0.25)) + 1);
    bg.drawImage(skyC, 0, R(drop(ms, 0.25)));
    for (const c of clouds) {
      c.x = ((c.x - c.v * dt * 3) % (W + 40) + W + 40) % (W + 40);
      bg.drawImage(c.img, R(c.x - 20), R(c.y + drop(ms, 0.3)));
    }
    layerAt(bg, waterC, PUSH.water, 1);
    rippled(reflections[0], PUSH.far, 1);
    rippled(reflections[1], PUSH.far, 1);
    rippled(reflections[2], PUSH.temple, 1);
    layerAt(bg, farC, PUSH.far, 1);
    layerAt(bg, templeC, PUSH.temple, 1);

    // the runes wake one by one
    const s = grow(ms, PUSH.temple), px = Math.max(1, Math.round(s));
    runes.forEach((p, i) => {
      const lit = mini || (B.LIGHTS[Math.min(B.LIGHTS.length - 1, Math.floor(i * B.LIGHTS.length / runes.length))] ?? 0) <= ms;
      if (!lit) return;
      const k = Math.floor(i * B.LIGHTS.length / runes.length);
      if (!mini && !plinked.has(k)) { plinked.add(k); if (live()) playSound(`plink-${k % 3}`); }
      const [x, y] = [VX + (p.x - VX) * s, hz + (p.y - hz) * s + drop(ms, 1)];
      bg.fillStyle = Math.sin(tick * 3 + i) > 0.2 ? RUNE[0] : RUNE[1];
      bg.fillRect(R(x), R(y), px, px);
      bg.fillStyle = RUNE[2];   // and its glint in the water
      bg.fillRect(R(x + Math.sin(tick * 5 + i)), R(2 * (hz + drop(ms, 1)) - y - px), px, px);
    });

    // the columns, far ones first, each over its own reflection
    const cz = camZ(ms), lift = drop(ms, 1);
    const near = cols.map(c => ({ c, zr: c.Z - cz })).filter(o => o.zr > 0.45).sort((a, b) => b.zr - a.zr);
    for (const { c, zr } of near) {
      const k = 1 / zr, h = span0 * 1.05 * k * c.h, w = Math.max(1, (h / c.h) / 6.5), x = VX + c.X * k * W * 0.5, foot = hz + k * span0 * 0.35 + lift;
      if (x + w < -2 || x - w > W + 2) continue;
      const sp = sprites[c.broken ? 1 : 0];
      bg.drawImage(sp.flip, R(x - w / 2), R(foot), R(w), R(h));
      bg.drawImage(sp.img, R(x - w / 2), R(foot - h), R(w), R(h));
      if (k > 0.25) {   // the water lapping round its foot
        bg.fillStyle = water[0];
        bg.fillRect(R(x - w / 2 - 1), R(foot - 0.5), R(w + 2), Math.max(0.5, R(k * 0.6)));
      }
    }

    fg.clearRect(0, 0, W, H);
    for (const p of pads) {   // lily pads drifting past
      const zr = p.Z - cz;
      if (zr < 0.5) continue;
      const k = 1 / zr, x = VX + p.X * k * W * 0.5, y = hz + k * span0 * 0.35 + lift, rx = Math.max(1, p.r * k * W), ry = Math.max(0.6, rx * 0.4);
      if (x + rx < 0 || x - rx > W || y > H + 2) continue;
      fg.fillStyle = lily[2]; fg.fillRect(R(x - rx), R(y), R(rx * 2), R(ry));
      fg.fillStyle = lily[1]; fg.fillRect(R(x - rx), R(y - ry * 0.6), R(rx * 1.6), R(ry));
      fg.fillStyle = lily[0]; fg.fillRect(R(x - rx * 0.8), R(y - ry * 0.6), R(rx * 0.7), R(ry * 0.5));
      if (p.bloom) { fg.fillStyle = lotus[0]; fg.fillRect(R(x), R(y - ry * 1.4), R(Math.max(1, rx * 0.4)), R(Math.max(1, ry))); }
    }
    for (const s2 of spots) {   // the water round each Pokémon: bubbles before it surfaces, a splash as it does, rings after
      const [x, y] = at(s2.x, s2.y, ms, PUSH.water), sc = grow(ms, PUSH.water), age = ms - s2.ms, rx = s2.size * 0.9 * sc, ry = Math.max(1.5, rx * 0.32);
      if (age < -450) continue;
      if (age < 0) {
        for (let n = 0; n < 4; n++) { const a = n * 1.7 + ms / 120; fg.fillStyle = water[0]; fg.fillRect(R(x + Math.cos(a) * rx * 0.5), R(y - 1 + Math.sin(a) * ry * 0.5), 1, 1); }
        continue;
      }
      // the water it stands in, waist-deep: an oval of the lagoon over its lower half, lit along its far rim
      const top = Math.round(y - ry * 0.6);
      for (let dy = 0; dy <= ry * 1.6; dy++) {
        const v = (dy - ry * 0.8) / (ry * 0.8), half = rx * Math.sqrt(Math.max(0, 1 - v * v));
        fg.fillStyle = dy === 0 ? water[1] : water[2];
        fg.fillRect(R(x - half), top + dy, R(half * 2), 1);
      }
      const ring = 1.05 + ((age / 900) % 1) * 0.6;   // a ring spreading out from it
      fg.fillStyle = water[0];
      fg.fillRect(R(x - rx * ring), top + Math.round(ry * 0.8), R(rx * 0.35), 1);
      fg.fillRect(R(x + rx * ring - rx * 0.35), top + Math.round(ry * 0.8), R(rx * 0.35), 1);
      if (age < 500) for (let n = 0; n < 10; n++) {   // the splash
        const a = -Math.PI * (0.1 + 0.8 * noise(n, 1, 2)), v = 6 + noise(n, 2, 3) * 8, tt = age / 1000;
        fg.fillStyle = n % 3 ? water[0] : water[1];
        fg.fillRect(R(x + Math.cos(a) * v * tt * sc * 2), R(y - ry + Math.sin(a) * v * tt * 3 * sc + 30 * tt * tt * sc), 1, 1);
      }
    }
    // the drizzle passing as the camera comes down
    const wet = mini ? 0 : 1 - span([1200, 3600], ms);
    if (wet > 0) {
      fg.fillStyle = cloud[1];
      for (const d of drizzle) {
        d.y += d.v * dt * 160; d.x -= d.v * dt * 40;
        if (d.y > H) { d.y -= H; d.x = Math.random() * W; }
        if (d.x < 0) d.x += W;
        if (noise(d.x | 0, 1, 1) < wet) fg.fillRect(R(d.x), R(d.y), 1, 2);
      }
    }
    if (!mini && ms < 400) { fg.fillStyle = `rgba(0, 0, 0, ${1 - ms / 400})`; fg.fillRect(0, 0, W, H); }
  }

  return {
    spots, walkX: VX, draw,
    monAt: (i, ms) => at(spots[i].x, spots[i].y, ms, PUSH.water),
  };
}

export const RUINS_INTRO = {
  title: ['SUNKEN', 'RUINS'], ink: ['#e8fffa', '#1f7c8c', '#06242a'],
  land: {
    far: ['#b4dcd4', '#94c4c0', '#7cb0b0'],
    jungle: ['#62c070', '#44a058', '#2c7c46', '#1c5634'],
    trunk: ['#8a7050', '#5a4430'],
    stone: ['#f0e2bc', '#cdbb90', '#ab9970', '#7c6c4e', '#463a2a'],
    moss: ['#a0d060', '#6aa044', '#447a36'],
    water: ['#f0ffff', '#8ae0d8', '#46b4b8', '#1f7c8c', '#0f4a5a'],
    lily: ['#8ccc58', '#549c3c', '#2e6a2a'],
    lotus: ['#f8a0c4', '#fff4f8'],
    vine: ['#8ac858', '#559a3c'],
  },
  // the Drowned Halls' walk-on (the temple nearer, columns crowding the way, the light under the roof dimmer), then the
  // Sunken Court's (lily pads everywhere)
  stages: [null, { goal: 1.7, cols: 2, shade: 0.22 }, { goal: 2.6, lilies: 3 }],
  shaded: ['far', 'jungle', 'stone', 'water', 'moss', 'vine'], shadeTo: '#082228',
  beats: { TILT: [0, 2600], PUSH: [1800, 9300], LIGHTS: [3300, 3650, 4000, 4300], POPS: [4500, 5300, 6000], TITLE_AT: 6300, END: 9600 },
  pop: 'splash',
  sounds: ['splash', 'plink-0', 'plink-1', 'plink-2'],
  scene: ruinsScene,
};
