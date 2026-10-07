/* ============================================================
   thornwood-intro.js  -  arriving in the Thornwood Jungle (roadmap item 19 part d).

   The same film as the other biomes' (run() in js/biome-intro.js plays
   it), with its own painter and camera: it drops down through the
   canopy, big leaves parting and sliding up out of the way, into the
   green gloom under the roof, then pushes along the trail between giant
   trunks (true 3D: each grows and slides out past the edge as you pass
   it) towards the Heart Tree, far off at the trail's end, its heart
   glowing in a split in its trunk. The wild Pokémon pop out of the ferns.

   Layers (the far gloom and the Heart Tree, the roof, the floor) are
   painted once and pushed in about the vanishing point by the camera.
   The land colours come graded for the hour from run(); the heart and
   the spores glow by themselves.
   ============================================================ */

import { ease, span, layer, settle, paintSky } from './biome-intro.js';
import { playSound } from './audio.js';

const PUSH = { far: 0.14, roof: 0.3, floor: 0.5 };
const GLOW = ['#f8ffd8', '#c8f070', '#68c040'];

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

/** A giant trunk as a sprite (w x h): grooved bark lit on its left, buttress roots flaring out at its foot, moss in patches. */
function trunkSprite(w, h, { bark, moss }) {
  const p = pixels(w, h), mid = (w - 1) / 2, shaft = Math.max(2, w * 0.24), flareH = Math.round(h * 0.16);
  for (let y = 0; y < h; y++) {
    const up = h - 1 - y, half = shaft + (up < flareH ? ((flareH - up) / flareH) ** 2 * (mid - shaft) : 0);
    for (let x = 0; x < w; x++) {
      const dx = x - mid;
      if (Math.abs(dx) > half) continue;
      const u = dx / half, groove = Math.abs(Math.sin(x * 1.7 + y * 0.05)) < 0.25;
      let c = u < -0.55 ? bark[0] : u > 0.6 ? bark[3] : groove || u > 0.2 ? bark[2] : bark[1];
      if (up < flareH && Math.abs(Math.sin(dx * 2.2)) < 0.3) c = bark[3];   // the gaps between the buttresses
      if (noise(x >> 1, y >> 3, 3) < 0.14 && u < 0.4) c = moss[u < -0.2 ? 0 : 1];
      p.put(x, y, c);
    }
  }
  return p.done();
}

function thornScene({ look, mini, land, sky, time, W, H, tall, rand, beats, live }) {
  const hz = Math.round(H * (tall ? 0.5 : 0.55)), VX = Math.round(W * 0.5), span0 = H - hz;
  const B = mini ? { DROP: [0, 1], PUSH: [0, beats.END] } : beats;
  const goal = look.goal || 1;
  const fall = (ms) => (mini ? 1 : ease(span(B.DROP, ms)));   // 0 up in the canopy, 1 down on the forest floor
  const drop = (ms, k) => (1 - fall(ms)) * H * 0.9 * k;   // how far below its place a layer still is while the camera comes down
  const zoom = (ms) => (mini ? 0.3 : 0.5) * ease(span(B.PUSH, ms));
  const grow = (ms, k) => 1 + zoom(ms) * k;
  const { far, canopy, bark, ground, path, fern, moss, vine } = land;

  // ---- the sky, only glimpsed through the roof ----
  const skyC = layer(W, H);
  paintSky(skyC.getContext('2d'), W, H, hz, sky, time, rand);

  // ---- far off: the gloom at the trail's end, the far trunks, and the Heart Tree towering in it ----
  const farP = pixels(W, H);
  for (let y = 0; y < hz; y++) {
    const t = (y / hz) * 2, i = Math.min(1, Math.floor(t));
    for (let x = 0; x < W; x++) farP.put(x, y, bayer(x, y) < (t - i) * 16 ? far[Math.max(0, 2 - i - 1)] : far[2 - i]);
  }
  for (let x = Math.floor(rand() * 4); x < W; x += 3 + Math.floor(rand() * 6)) {
    const c = mixW(word(bark[2]), word(far[1]), 0.45 + rand() * 0.3), w = 1 + Math.floor(rand() * 2);
    for (let y = 0; y < hz; y++) for (let k = 0; k < w; k++) farP.put(x + k, y, c);
  }
  const heart = { x: VX, y: 0, r: 1 };
  {
    const half = Math.max(4, Math.round(Math.min(W * 0.075, H * 0.07) * goal ** 0.4)), foot = hz;
    for (let y = 0; y < foot; y++) {
      const up = foot - y, hw = half + (up < half * 2 ? ((half * 2 - up) / (half * 2)) ** 2 * half * 1.8 : 0);
      for (let x = Math.floor(-hw); x <= hw; x++) {
        const u = x / hw, a = u * 3 + y / (half * 1.4), f = a - Math.floor(a);
        farP.put(VX + x, y, f < 0.12 ? bark[3] : u < -0.5 ? bark[0] : (0.5 - f) - u * 0.6 > -0.2 ? bark[1] : bark[2]);
      }
    }
    heart.y = Math.round(hz * 0.5); heart.r = Math.max(1.5, half * 0.35);
    const sh = Math.max(3, Math.round(half * 0.9)), sw = Math.max(1, Math.round(half * 0.32));
    for (let y = heart.y - sh; y <= heart.y + sh; y++) {
      const w = sw * Math.sqrt(Math.max(0, 1 - ((y - heart.y) / sh) ** 2));
      for (let x = -Math.ceil(w); x <= w; x++) farP.put(VX + x, y, bark[3]);
    }
  }

  // ---- the roof: dense crowns along the top, a few gaps to the sky, vines hanging from it ----
  const roofP = pixels(W, H), roofAt = (x) => Math.round(hz * (0.3 + 0.06 * Math.sin(x / 7) + 0.04 * Math.sin(x / 2.9 + 1)));
  for (let x = 0; x < W; x++) {
    const h = roofAt(x);
    for (let y = 0; y <= h; y++) {
      const gap = Math.sin(x / 9 + y / 4) + Math.sin(x / 4.3 - y / 3) > 1.65 && y < h - 4;
      if (!gap) roofP.put(x, y, y >= h - 1 ? canopy[3] : y > h - 4 && bayer(x, y) < 9 ? canopy[2] : bayer(x + 1, y) < 3 ? canopy[0] : canopy[1]);
    }
    if (noise(x, 1, 7) < 0.08) for (let k = 1, len = 3 + Math.floor(noise(x, 2, 7) * hz * 0.35); k <= len; k++) roofP.put(x + (k % 7 === 3 ? 1 : 0), h + k, k === len ? vine[0] : vine[1]);
  }

  // ---- the forest floor, its trail running in to the Heart Tree's roots ----
  const floorP = pixels(W, H), half = (k) => 0.6 + k * W * 0.16;
  for (let y = hz; y < H; y++) {
    const k = (y - hz) / span0, t = Math.min(2.99, k * 3), i = Math.floor(t);
    for (let x = 0; x < W; x++) {
      let c = bayer(x, y) < (t - i) * 16 ? ground[Math.min(3, i + 1)] : ground[i];
      if (noise(x, y, 11) < 0.07) c = path[noise(x, y, 12) < 0.5 ? 0 : 2];   // fallen leaves
      floorP.put(x, y, c);
    }
    const cx = VX + Math.sin(k * 4) * k * W * 0.03, hw = half(k);
    for (let x = Math.round(cx - hw - 1); x <= cx + hw + 1; x++) {
      const e = Math.abs(x + 0.5 - cx) - hw;
      if (e < 0 || bayer(x, y) < (1 - e) * 8) floorP.put(x, y, noise(x >> 1, y >> 1, 13) < 0.3 ? path[1] : e > -1 ? path[2] : path[0]);
    }
  }
  for (const s of [-1, 1]) {   // roots crossing the floor from the trees at the sides
    for (let r = 0; r < 2; r++) {
      let x = s < 0 ? -1 : W, y = hz + span0 * (0.3 + r * 0.35);
      for (let n = 0, len = W * (0.18 + r * 0.06); n < len; n++) {
        const th = Math.max(0, Math.round((1 - n / len) * (1 + r)));
        x -= s; y += Math.sin(n * 0.2 + r) * 0.4;
        for (let k = -th - 1; k <= th; k++) floorP.put(x, y + k, k === -th - 1 ? bark[0] : k === th ? bark[3] : bark[1]);
      }
    }
  }

  const farC = farP.done(), roofC = roofP.done(), floorC = floorP.done();

  // ---- the giant trunks either side of the trail, in 3D ----
  const trunk = trunkSprite(16, 160, { bark, moss });
  const trees = [];
  const dense = look.trees || 1;
  for (let z = 1.8, side = 1; z < 16; z += (1.1 + rand() * 0.6) / dense ** 0.5, side = -side) trees.push({ X: side * (0.6 + rand() * 0.55), Z: z, w: 0.75 + rand() * 0.5 });
  const camZ = (ms) => (mini ? 2.4 : 7) * ease(span(B.PUSH, ms));

  // ---- the leaves the camera drops through at the start, then the ferns along the bottom ----
  const curtain = pixels(W, Math.round(H * 1.5));
  for (let n = 0; n < W * H / 50; n++) {
    const cx = rand() * W, cy = rand() * H * 1.5, len = H * (0.12 + rand() * 0.18), ang = (rand() - 0.5) * 1.4 + Math.PI / 2, wid = len * 0.22;
    const ux = Math.cos(ang), uy = Math.sin(ang), shade = rand();
    for (let s = 0; s <= len; s++) {
      const w = Math.sin(Math.PI * Math.min(1, s / len * 1.1)) * wid;
      for (let k = -w; k <= w; k += 0.6) {
        const c = Math.abs(k) < 0.6 ? canopy[0] : Math.abs(k) > w - 1 ? canopy[3] : k < 0 ? canopy[shade < 0.5 ? 1 : 0] : canopy[2];
        curtain.put(cx + ux * s - uy * k, cy + uy * s + ux * k, c);
      }
    }
  }
  const curtainC = curtain.done();
  const fore = pixels(W, H);
  for (let x = -6; x < W + 6; x += 4 + Math.floor(rand() * 5)) frond(fore, x, H + 1, H * (0.08 + rand() * 0.07), fern);
  const foreC = fore.done();

  // ---- where the Pokémon pop out of the ferns, either side of the trail ----
  const spots = beats.POPS.map((ms, i) => {
    const k = i + 3 - beats.POPS.length, depth = [0.34, 0.2, 0.56][k], y = Math.round(hz + span0 * depth), x = Math.round(W * [0.26, 0.72, 0.4][k]);
    return { ms, x, y, scale: 0.6 + depth * 0.6, size: Math.round(5 + depth * 12) };
  });
  const end = grow(beats.END, PUSH.floor);
  settle(spots, { way: (s) => [VX, 2 + half((s.y - hz) / span0)], view: () => [0, W], rest: [VX - VX / end, VX + (W - VX) / end] });
  const at = (x, y, ms, k) => { const s = grow(ms, k); return [VX + (x - VX) * s, hz + (y - hz) * s + drop(ms, 1)]; };

  const motes = Array.from({ length: Math.round(W / 4) }, () => ({ x: rand() * W, y: rand() * H, v: 0.2 + rand() * 0.5, phase: rand() * 6 }));
  let lastMs = 0, rustled = false;

  function draw(bg, fg, ms, tick) {
    const R = bg.snap, dt = Math.min(0.1, (ms - lastMs) / 1000);
    lastMs = ms;
    const layerAt = (g, img, k, d) => { const s = grow(ms, k); g.drawImage(img, R(VX - VX * s), R(hz - hz * s + drop(ms, d)), R(W * s), R(H * s)); };
    bg.drawImage(skyC, 0, R(drop(ms, 0.25)));
    layerAt(bg, farC, PUSH.far, 1);
    // the heart beats in the Heart Tree's trunk, far off
    const sf = grow(ms, PUSH.far), beat = Math.max(0, Math.sin(tick * 3)), hr = heart.r * sf * (1 + beat * 0.35);
    const [hx, hy] = [VX + (heart.x - VX) * sf, hz + (heart.y - hz) * sf + drop(ms, 1)];
    for (const [k, c] of [[2.2, GLOW[2]], [1.4, GLOW[1]], [0.7, GLOW[0]]]) {
      bg.fillStyle = c;
      bg.beginPath(); bg.ellipse(hx, hy, Math.max(0.6, hr * k * 0.6), hr * k, 0, 0, Math.PI * 2); bg.fill();
    }
    layerAt(bg, floorC, PUSH.floor, 1);

    // the trunks, far ones first
    const cz = camZ(ms), lift = drop(ms, 1);
    const near = trees.map(t => ({ t, zr: t.Z - cz })).filter(o => o.zr > 0.4).sort((a, b) => b.zr - a.zr);
    for (const { t, zr } of near) {
      const k = 1 / zr, w = Math.max(2, span0 * 0.6 * k * t.w), h = w * 10, x = VX + t.X * k * W * 0.5, foot = hz + k * span0 * 0.35 + lift;
      if (x + w < -2 || x - w > W + 2) continue;
      bg.globalAlpha = 1;
      bg.drawImage(trunk, R(x - w / 2), R(foot - h), R(w), R(h));
      if (k < 0.5) { bg.fillStyle = far[1]; bg.globalAlpha = (0.5 - k) * 1.1; bg.fillRect(R(x - w / 2), R(foot - h), R(w), R(h)); bg.globalAlpha = 1; }   // the haze between
    }
    layerAt(bg, roofC, PUSH.roof, 1);

    fg.clearRect(0, 0, W, H);
    for (const s2 of spots) {   // the ferns each Pokémon pops out of: they shake before it does
      const [x, y] = at(s2.x, s2.y, ms, PUSH.floor), sc = grow(ms, PUSH.floor), age = ms - s2.ms;
      const shake = age < 0 && age > -500 ? Math.sin(ms / 30) * 1.2 : 0;
      for (let n = -3; n <= 3; n++) {
        const len = s2.size * sc * (0.9 - Math.abs(n) * 0.1), ang = -Math.PI / 2 + n * 0.32 + shake * 0.1;
        for (let s = 0; s <= len; s++) {
          const fx = x + shake + Math.cos(ang) * s + n * 0.6 * sc, fy = y + 1 + Math.sin(ang) * s * 0.75 + (s / len) ** 2 * len * 0.35;
          fg.fillStyle = s > len * 0.6 ? fern[0] : n % 2 ? fern[1] : fern[2];
          fg.fillRect(R(fx), R(fy), Math.max(1, R(sc)), 1);
        }
      }
    }
    const lightK = mini ? 1 : span([B.DROP[1] - 600, B.DROP[1] + 1200], ms);   // shafts of light come in as you reach the floor
    if (lightK > 0) {
      fg.fillStyle = GLOW[0];
      for (let n = 0; n < 4; n++) {
        const x0 = W * (0.1 + n * 0.26) + Math.sin(tick * 0.4 + n) * 2;
        fg.globalAlpha = 0.07 * lightK * (0.6 + 0.4 * Math.sin(tick + n * 2));
        for (let y = 0; y < hz + span0 * 0.4; y += 2) fg.fillRect(R(x0 + y * 0.45), R(y + drop(ms, 1)), R(4 + y * 0.03), 2);
      }
      fg.globalAlpha = 1;
    }
    for (const m of motes) {   // spores drifting in the gloom
      m.y -= m.v * dt * 6; m.x += Math.sin(tick + m.phase) * dt * 3;
      if (m.y < 0) m.y += H;
      fg.fillStyle = Math.sin(tick * 2 + m.phase) > 0.3 ? GLOW[0] : GLOW[1];
      if (Math.sin(tick * 1.3 + m.phase) > -0.4) fg.fillRect(R(m.x), R(m.y + drop(ms, 1) * 0.5), 1, 1);
    }
    const sfore = grow(ms, 1);
    fg.drawImage(foreC, R(VX - VX * sfore), R(H - H * sfore + drop(ms, 1.2)), R(W * sfore), R(H * sfore));
    if (!mini) {   // the leaves the camera comes down through, parting and sliding up out of view
      const f = fall(ms);
      if (f < 1) {
        if (!rustled && ms > 250) { rustled = true; if (live()) playSound('rustle'); }
        for (const s of [-1, 1]) fg.drawImage(curtainC, 0, 0, W, curtain.h, R(s * f * W * 0.35), R(-f * curtain.h - f * H * 0.2), W, curtain.h);
      }
    }
    if (!mini && ms < 400) { fg.fillStyle = `rgba(0, 0, 0, ${1 - ms / 400})`; fg.fillRect(0, 0, W, H); }
  }

  return {
    spots, walkX: VX, draw,
    monAt: (i, ms) => at(spots[i].x, spots[i].y, ms, PUSH.floor),
  };
}

/** A fern frond rising from (x, foot) and arching over, leaflets along it. */
function frond(p, x, foot, len, [lit, body, dark]) {
  for (const a of [-0.9, -0.45, -0.1, 0.25, 0.6]) {
    for (let s = 1; s <= len; s++) {
      const fx = x + Math.sin(a) * s * 1.2, fy = foot - Math.cos(a) * s + (s / len) ** 2 * len * 0.6;
      p.put(fx, fy, a < 0 ? lit : body);
      if (s % 2 === 0) { p.put(fx - 1, fy, body); p.put(fx + 1, fy + 1, dark); }
    }
  }
}

export const THORNWOOD_INTRO = {
  title: ['THORNWOOD', 'JUNGLE'], ink: ['#f0ffd0', '#3e8a2a', '#0e2a0a'],
  land: {
    far: ['#7aa878', '#5e8e64', '#3e6a4a'],
    canopy: ['#6cc050', '#469a3c', '#2c7430', '#174a20'],
    bark: ['#9a7a54', '#6e5236', '#4a3420', '#22160a'],
    ground: ['#5e6c36', '#525e30', '#46522a', '#3a4424'],
    path: ['#a88a58', '#8a6e44', '#6a5232'],
    fern: ['#88d060', '#4e9a3c', '#2e6a2a'],
    moss: ['#9ad060', '#5e9a40'],
    vine: ['#8ac858', '#4e9a3c'],
  },
  // the Canopy Walk's walk-on (the Heart Tree nearer, trees crowding the trail), then the Strangler Grove's (darker)
  stages: [null, { goal: 1.7, trees: 1.6, shade: 0.12 }, { goal: 2.6, trees: 2.2, shade: 0.32 }],
  shaded: ['far', 'canopy', 'bark', 'ground', 'path', 'fern', 'moss', 'vine'], shadeTo: '#06140a',
  beats: { DROP: [300, 3000], PUSH: [2200, 9300], POPS: [4400, 5200, 5900], TITLE_AT: 6200, END: 9600 },
  pop: 'rustle',
  sounds: ['rustle'],
  scene: thornScene,
};
