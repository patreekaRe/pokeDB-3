/* ============================================================
   savanna-intro.js  -  arriving in the Sunscorch Savanna (roadmap item 20 part b).

   The same film as the other biomes' (run() in js/biome-intro.js plays
   it), with its own painter and camera: it rises up out of the tall
   grass, the blades parting and sinking away, onto a plain of gold under
   a huge sky, Sun Rock jutting up far off on the horizon, then pushes
   low over the grass between acacias (true 3D: each grows and slides
   out past the edge as you pass it) while the heat shimmers on the
   horizon. The wild Pokémon pop out of the grass.

   Layers (the far hills and Sun Rock, the plain) are painted once and
   pushed in about the vanishing point by the camera. The land colours
   come graded for the hour from run().
   ============================================================ */

import { ease, span, layer, settle, paintSky } from './biome-intro.js';
import { playSound } from './audio.js';

const PUSH = { far: 0.12, plain: 0.5 };

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const noise = (a, b, c) => { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); };
const word = (hex) => { const n = parseInt(hex.slice(1), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };

/** A layer painted pixel by pixel (ABGR words), turned into a canvas once it's done. */
function pixels(w, h) {
  const c = layer(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = new Uint32Array(img.data.buffer);
  return {
    w, h, d,
    put(x, y, hex) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) d[y * w + x] = typeof hex === 'string' ? word(hex) : hex; },
    done() { g.putImageData(img, 0, 0); return c; },
  };
}

/** An acacia as a sprite (w x h): a thin trunk forking under a wide, flat crown with a dark underside. */
function acaciaSprite(w, h, { bark, crown }) {
  const p = pixels(w, h), mid = Math.round(w / 2), crownH = Math.round(h * 0.28), trunkTop = crownH - 2;
  for (let y = trunkTop; y < h; y++) {
    const lean = Math.round((h - y) * 0.08);
    p.put(mid + lean, y, bark[0]); p.put(mid + lean + 1, y, bark[1]);
    if (y < trunkTop + h * 0.25) { const k = y - trunkTop; p.put(mid + lean - Math.round((h * 0.25 - k) * 0.8), y, bark[1]); }
  }
  for (let y = 0; y < crownH; y++) for (let x = 0; x < w; x++) {
    const u = (x - w / 2) / (w / 2), v = (y - crownH * 0.55) / (crownH * 0.55), edge = 1 - 0.15 * Math.abs(Math.sin(x * 0.7));
    if (u * u + v * v * 1.4 > edge) continue;
    p.put(x, y, y >= crownH - 2 ? crown[3] : v < -0.4 ? crown[0] : u > 0.4 ? crown[2] : bayer(x, y) < 3 ? crown[0] : crown[1]);
  }
  return p.done();
}

function savannaScene({ look, mini, land, sky, time, W, H, tall, rand, beats, live }) {
  const hz = Math.round(H * (tall ? 0.52 : 0.58)), VX = Math.round(W * 0.5), span0 = H - hz;
  const B = mini ? { RISE: [0, 1], PUSH: [0, beats.END] } : beats;
  const goal = look.goal || 1;
  const rise = (ms) => (mini ? 1 : ease(span(B.RISE, ms)));   // 0 down in the grass, 1 up over it
  const drop = (ms, k) => (1 - rise(ms)) * H * 0.35 * k;   // the land sits lower while the camera is still down in the grass
  const zoom = (ms) => (mini ? 0.3 : 0.5) * ease(span(B.PUSH, ms));
  const grow = (ms, k) => 1 + zoom(ms) * k;
  const { far, hill, rock, grass, track, bark, crown, blade } = land;

  // ---- the sky ----
  const skyC = layer(W, H);
  paintSky(skyC.getContext('2d'), W, H, hz, sky, time, rand);

  // ---- far off: the hills, and Sun Rock jutting up out of the plain, a little right of the way ----
  const farP = pixels(W, H);
  for (let x = 0; x < W; x++) {
    const top = Math.round(hz - H * 0.04 - H * 0.03 * (0.6 * Math.sin(x * 0.04 + 1) + 0.4 * Math.sin(x * 0.11 + 3)));
    for (let y = Math.max(0, top); y < hz; y++) farP.put(x, y, y === top ? far[0] : y < top + 3 ? far[1] : far[2]);
    const near = Math.round(hz - H * 0.015 - H * 0.012 * Math.sin(x * 0.09 + 2));
    for (let y = Math.max(0, near); y < hz; y++) farP.put(x, y, hill[y === near ? 0 : 1]);
  }
  {
    const h = Math.round(H * 0.16 * goal ** 0.5), tx = VX + Math.round(W * 0.02), bx = VX + Math.round(W * 0.09 * goal ** 0.4), right = VX + Math.round(W * 0.26 * goal ** 0.4);
    for (let x = tx; x <= right; x++) {
      const top = x < bx ? hz - h + (x - tx) * 0.15 : hz - h + (bx - tx) * 0.15 - h * 0.12 * Math.sin(Math.PI * (x - bx) / (right - bx + 1));
      const bottom = x < bx ? top + 1 + ((x - tx) / (bx - tx)) ** 1.8 * (hz - top - 1) : hz;
      for (let y = Math.round(top); y < bottom; y++) farP.put(x, y, y - top < 1.5 ? rock[0] : (y + x) % 5 === 0 ? rock[2] : x > right - (right - bx) * 0.3 ? rock[2] : rock[1]);
    }
  }
  for (let n = 0; n < Math.round(W / 22); n++) {   // far acacias along the horizon
    const x = Math.round(rand() * W), r = 2 + Math.floor(rand() * 2);
    if (Math.abs(x - VX - W * 0.13) < W * 0.15) continue;
    for (let y = hz - 4; y < hz; y++) farP.put(x, y, hill[2]);
    for (let k = -r * 2; k <= r * 2; k++) { farP.put(x + k, hz - 5, hill[2]); if (Math.abs(k) < r * 1.5) farP.put(x + k, hz - 6, hill[2]); }
  }

  // ---- the plain: golden grass with its grain, a track running in towards the rock ----
  const plainP = pixels(W, H), half = (k) => 0.4 + k * W * 0.08;
  for (let y = hz; y < H; y++) {
    const k = (y - hz) / span0, t = Math.min(2.99, k * 3), i = Math.floor(t);
    for (let x = 0; x < W; x++) {
      let c = bayer(x, y) < (t - i) * 16 ? grass[Math.min(3, i + 1)] : grass[i];
      if (noise(x, y, 11) < 0.12 + k * 0.1) c = blade[noise(x, y, 12) < 0.5 ? 1 : 2];
      plainP.put(x, y, c);
    }
    const cx = VX + Math.sin(k * 3 + 1) * k * W * 0.06 - k * W * 0.08, hw = half(k);
    for (let x = Math.round(cx - hw - 1); x <= cx + hw + 1; x++) {
      const e = Math.abs(x + 0.5 - cx) - hw;
      if (e < 0 || bayer(x, y) < (1 - e) * 8) plainP.put(x, y, noise(x >> 1, y >> 1, 13) < 0.3 ? track[1] : track[0]);
    }
  }
  const farC = farP.done(), plainC = plainP.done();

  // ---- the acacias either side of the way, in 3D ----
  const tree = acaciaSprite(40, 44, { bark, crown });
  const trees = [];
  for (let z = 1.6, side = 1; z < 18; z += (1.4 + rand() * 1.4) / (look.trees || 1) ** 0.5, side = -side) trees.push({ X: side * (0.55 + rand() * 0.9), Z: z, s: 0.8 + rand() * 0.5 });
  const camZ = (ms) => (mini ? 2.4 : 7) * ease(span(B.PUSH, ms));

  // ---- the tall grass the camera rises out of, then the grass along the bottom ----
  const curtain = pixels(W, Math.round(H * 1.6));
  for (let x = -2; x < W + 2; x++) for (let n = 0; n < 3; n++) {
    const h = curtain.h * (0.5 + noise(x, n, 14) * 0.5), lean = (noise(x, n, 15) - 0.5) * 0.5, c = blade[n];
    for (let k = 0; k < h; k++) curtain.put(x + Math.round(lean * k * (k / h)), curtain.h - 1 - k, k > h * 0.85 ? blade[0] : c);
  }
  const curtainC = curtain.done();
  const fore = pixels(W, H);
  for (let x = 0; x < W; x++) {
    const h = Math.round(H * (0.05 + noise(x, 1, 16) * 0.07)), lean = (noise(x, 2, 16) - 0.5) * 0.6;
    for (let k = 0; k < h; k++) fore.put(x + Math.round(lean * k * (k / h)), H - 1 - k, k > h * 0.7 ? blade[0] : k > h * 0.3 ? blade[1] : blade[2]);
  }
  const foreC = fore.done();

  // ---- where the Pokémon pop out of the grass, either side of the track ----
  const spots = beats.POPS.map((ms, i) => {
    const k = i + 3 - beats.POPS.length, depth = [0.34, 0.2, 0.56][k], y = Math.round(hz + span0 * depth), x = Math.round(W * [0.24, 0.72, 0.38][k]);
    return { ms, x, y, scale: 0.6 + depth * 0.6, size: Math.round(5 + depth * 12) };
  });
  const end = grow(beats.END, PUSH.plain);
  settle(spots, { way: (s) => { const k = (s.y - hz) / span0; return [VX + Math.sin(k * 3 + 1) * k * W * 0.06 - k * W * 0.08, 2 + half(k)]; }, view: () => [0, W], rest: [VX - VX / end, VX + (W - VX) / end] });
  const at = (x, y, ms, k) => { const s = grow(ms, k); return [VX + (x - VX) * s, hz + (y - hz) * s + drop(ms, 1)]; };

  const birds = Array.from({ length: 5 }, (_, i) => ({ x: -10 - i * 6, y: hz * (0.25 + (i % 3) * 0.05) + (i % 2) * 3 }));
  let lastMs = 0, rustled = false;

  function draw(bg, fg, ms, tick) {
    const R = bg.snap, dt = Math.min(0.1, (ms - lastMs) / 1000);
    lastMs = ms;
    const layerAt = (g, img, k, d) => { const s = grow(ms, k); g.drawImage(img, R(VX - VX * s), R(hz - hz * s + drop(ms, d)), R(W * s), R(H * s)); };
    bg.drawImage(skyC, 0, R(drop(ms, 0.2)));
    // the far land, its rows near the horizon shimmering in the heat
    const sf = grow(ms, PUSH.far), y0 = hz - hz * sf + drop(ms, 1);
    for (let y = 0; y < H; y += 2) {
      const heat = time === 'night' ? 0 : Math.max(0, 1 - Math.abs(y - hz) / (H * 0.06)), off = Math.sin(y * 0.9 + tick * 4) * 0.6 * heat;
      bg.drawImage(farC, 0, y, W, 2, R(VX - VX * sf + off), R(y0 + y * sf), R(W * sf), R(2 * sf));
    }
    layerAt(bg, plainC, PUSH.plain, 1);

    const cz = camZ(ms), lift = drop(ms, 1);
    for (const { t, zr } of trees.map(t => ({ t, zr: t.Z - cz })).filter(o => o.zr > 0.4).sort((a, b) => b.zr - a.zr)) {
      const k = 1 / zr, w = span0 * 1.1 * k * t.s, h = w * 1.1, x = VX + t.X * k * W * 0.5, foot = hz + k * span0 * 0.35 + lift;
      if (x + w / 2 < -2 || x - w / 2 > W + 2) continue;
      bg.drawImage(tree, R(x - w / 2), R(foot - h), R(w), R(h));
    }
    if (!mini && ms < 6000) for (const b of birds) {   // a flock crossing the sky
      b.x += dt * 14;
      bg.fillStyle = bark[1];
      const flap = Math.sin(ms / 120 + b.x) > 0;
      bg.fillRect(R(b.x), R(b.y + drop(ms, 0.2)), 1, 1); bg.fillRect(R(b.x - 1), R(b.y - (flap ? 1 : 0) + drop(ms, 0.2)), 1, 1); bg.fillRect(R(b.x + 1), R(b.y - (flap ? 1 : 0) + drop(ms, 0.2)), 1, 1);
    }

    fg.clearRect(0, 0, W, H);
    for (const s2 of spots) {   // the grass each Pokémon pops out of: it sways before it does
      const [x, y] = at(s2.x, s2.y, ms, PUSH.plain), sc = grow(ms, PUSH.plain), age = ms - s2.ms;
      const sway = age < 0 && age > -500 ? Math.sin(ms / 40) * 1.2 : 0;
      for (let n = -4; n <= 4; n++) {
        const len = s2.size * sc * (0.8 - Math.abs(n) * 0.06);
        for (let s = 0; s <= len; s++) {
          fg.fillStyle = s > len * 0.7 ? blade[0] : n % 2 ? blade[1] : blade[2];
          fg.fillRect(R(x + n * 0.9 * sc + sway * (s / len) + (n * 0.25) * (s / len) * 2), R(y + 1 - s * 0.8), Math.max(1, R(sc * 0.8)), 1);
        }
      }
    }
    const sfore = grow(ms, 1);
    fg.drawImage(foreC, R(VX - VX * sfore), R(H - H * sfore + drop(ms, 0.6)), R(W * sfore), R(H * sfore));
    if (!mini) {   // the tall grass the camera rises out of, sinking away below
      const r = rise(ms);
      if (r < 1) {
        if (!rustled && ms > 200) { rustled = true; if (live()) playSound('rustle'); }
        fg.drawImage(curtainC, 0, R(H - curtain.h + r * curtain.h * 1.05));
      }
    }
    if (!mini && ms < 400) { fg.fillStyle = `rgba(0, 0, 0, ${1 - ms / 400})`; fg.fillRect(0, 0, W, H); }
  }

  return {
    spots, walkX: VX, draw,
    monAt: (i, ms) => at(spots[i].x, spots[i].y, ms, PUSH.plain),
  };
}

export const SAVANNA_INTRO = {
  title: ['SUNSCORCH', 'SAVANNA'], ink: ['#fff4c8', '#e07020', '#3a1404'],
  land: {
    far: ['#e8c8a0', '#d8b48c', '#c8a07a'],
    hill: ['#c8a070', '#b08a5c', '#8a6a44'],
    rock: ['#e8c89a', '#b8906a', '#7a5a3e'],
    grass: ['#e8c870', '#dcb862', '#cca44e', '#b88e40'],
    track: ['#e8d0a0', '#c8a878'],
    bark: ['#6a5034', '#3e2c1a'],
    crown: ['#a8b858', '#7e943e', '#5a7030', '#3a4a20'],
    blade: ['#f8e090', '#d8b050', '#9a7a30'],
  },
  // the Burnt Plain's walk-on (Sun Rock nearer, fewer trees), then the Watering Hole's (nearer still)
  stages: [null, { goal: 1.7, trees: 0.6, shade: 0.1 }, { goal: 2.6, trees: 1.2 }],
  shaded: ['grass', 'blade', 'hill', 'far'], shadeTo: '#2a1a10',
  beats: { RISE: [200, 2800], PUSH: [1800, 9300], POPS: [4400, 5200, 5900], TITLE_AT: 6200, END: 9600 },
  pop: 'rustle',
  sounds: ['rustle'],
  scene: savannaScene,
};
