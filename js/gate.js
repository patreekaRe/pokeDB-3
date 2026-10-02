/*
 * The Sealed Gate's art (docs/roadmap.md, "The Sealed Gate", part B): a door of dark crystal in a carved obsidian frame
 * trimmed with gold, its runes glowing, between two spires of ice-blue crystal, with shards floating beside it. It's
 * chained shut, and Eternatus's seal turns on it as a magic circle. It shows its damage as it falls: cracks spread out
 * from the seal and leak light, the crystal cracks too, the frame's runes go out from the bottom up, a chain snaps at half
 * HP and the other near the end, chunks of the door fall away, and from about half HP the light behind the door rises and
 * Mewtwo's silhouette shows against it, its eyes glowing now and then. Broken, the arch stands open over steps down into
 * the Crystal Depths' violet light. (It was a stone arch in a brick wall until 2026-10-02; the user wanted it less blocky
 * and more fantasy.)
 *
 * Painted pixel by pixel into a W x H buffer, so it stays crisp when scaled up with image-rendering: pixelated. Every
 * crack, chunk and mote comes from a seeded random, so a gate at a given HP always looks the same.
 */
import { getSave } from './storage.js';
import { GATE_HP } from './data/gate.js';

const rgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const P = Object.fromEntries(Object.entries({
  outline: '#0e0818',
  ice0: '#1c1448', ice1: '#2c2a78', ice2: '#4656b8', ice3: '#78a0e8', ice4: '#c8f0ff',
  frame0: '#120c22', frame1: '#21183c', frame2: '#302652',
  gold0: '#5a3c14', gold1: '#a87c2c', gold2: '#e8c460', gold3: '#fff2b8',
  stone0: '#221c36', stone1: '#3a3256', stone2: '#544a78', stone3: '#7a6ea2', stone4: '#a498c8',
  mortar: '#18122a',
  door0: '#0c0618', door1: '#170c2c', door2: '#22123e', door3: '#341c58', doorEdge: '#5a3a8a',
  seal0: '#8a1040', seal1: '#e02a70', seal2: '#ff6aa8', seal3: '#ffd0e8',
  leak: '#ff58a8', leakHot: '#ffd8f0', white: '#ffffff',
  back0: '#6a3cc0', back1: '#b070ff', back2: '#e8c8ff',
  shadow: '#07020e', eye: '#f070ff',
  chain0: '#2a2a3a', chain1: '#6a6a82', chain2: '#b0b0c8', chain3: '#e8e8f4',
  gem0: '#5a0c38', gem1: '#c02068', gem2: '#ff70b0',
  depth0: '#04020a', depth1: '#1a0c38', depth2: '#4a2490', depth3: '#9a60f0', depth4: '#e0c0ff',
}).map(([k, v]) => [k, rgb(v)]));

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const dither = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** The gate's HP: the save's, or `?gate=NNN` while playtesting (never saved). */
export function gateHp() {
  const pin = new URLSearchParams(location.search).get('gate');
  if (pin !== null && pin !== '' && !Number.isNaN(Number(pin))) return Math.max(0, Math.min(GATE_HP, Math.round(Number(pin))));
  return getSave().gateHp;
}

/* Mewtwo's silhouette, from its front sprite's first frame: a mask, and where its eyes are (sprite pixels). */
const EYES = [[25, 18], [29, 18]];
let figure = null;
const figureReady = new Promise(resolve => {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, c.width, c.height).data;
    const mask = new Uint8Array(c.width * c.height);
    let top = c.height, bottom = 0, left = c.width, right = 0;
    for (let i = 0; i < mask.length; i++) {
      if (data[i * 4 + 3] < 128) continue;
      mask[i] = 1;
      const x = i % c.width, y = (i / c.width) | 0;
      top = Math.min(top, y); bottom = Math.max(bottom, y); left = Math.min(left, x); right = Math.max(right, x);
    }
    figure = { w: c.width, mask, top, bottom, left, right };
    resolve();
  };
  img.onerror = () => resolve();
  img.src = 'assets/pokemon/mewtwo-front.gif';
});
export const gateReady = () => figureReady;

/**
 * A gate W x H pixels. Returns its layout and paint(ctx, state), which draws it at (0, 0) of ctx's canvas.
 * state: { hp (0..1, below 0 for the break's extra cracks), t (seconds), flash (0..1 to white), seal (0..1 extra flare),
 * eyes (0..1), figure (0..1: the silhouette solid in the open arch), open (the door gone), chains (how many still hold,
 * else from hp), mute (no light: a locked look) }.
 */
export function makeGate(W, H) {
  const steps = Math.max(2, Math.round(H * 0.05));
  const floorY = H - steps;
  const pw = Math.max(4, Math.round(W * 0.15));      // the crystal spires either side
  const band = Math.max(3, Math.round(W * 0.055));   // the carved frame round the door
  const top = Math.max(3, Math.round(H * 0.07));     // the frame's crown
  const ox0 = pw + band + 1, ox1 = W - pw - band - 2;
  const r = (ox1 - ox0 + 1) / 2, cx = (ox0 + ox1) / 2;
  const archY = top + band + r;
  const sealY = Math.round(archY + (floorY - archY) * 0.2);
  const sealR = Math.max(3, Math.round(r * 0.55));
  const gemY = top + Math.floor(band / 2), gemR = Math.max(1.5, band * 0.75);
  const baseH = Math.max(3, Math.round(H * 0.07));

  // the spires: a tall one and a small shard leaning on its outer side, each a point on top of a straight shaft
  const SPIRES = [
    { xc: pw * 0.55, half: pw * 0.45, tip: 1, shoulder: Math.round(H * 0.3) },
    { xc: pw * 0.15, half: pw * 0.24, tip: Math.round(H * 0.38), shoulder: Math.round(H * 0.55) },
  ];
  const spireAt = (x, y) => {
    const fx = x < W / 2 ? x : W - 1 - x;
    for (let k = SPIRES.length - 1; k >= 0; k--) {   // the small one stands in front
      const sp = SPIRES[k];
      if (y < sp.tip || y >= floorY) continue;
      const half = y >= sp.shoulder ? sp.half : sp.half * (y - sp.tip + 0.5) / (sp.shoulder - sp.tip);
      if (Math.abs(fx - sp.xc) <= half) return { sp, rel: (fx - sp.xc) / Math.max(0.5, half), mirror: x >= W / 2 };
    }
    return null;
  };

  // materials: 0 empty, 1 crystal spire, 2 frame, 3 door, 4 steps, 5 crown gem, 6 rock under the spires, 7 gold crown
  const mat = new Uint8Array(W * H);
  const inArch = (x, y) => x >= ox0 && x <= ox1 && y < floorY && y > top && (y >= archY || Math.hypot(x - cx, y - archY) <= r - 0.25);
  const inFrame = (x, y) => {
    if (y >= floorY || inArch(x, y)) return false;
    if (y >= archY) return (x >= ox0 - band && x < ox0) || (x > ox1 && x <= ox1 + band);
    const d = Math.hypot(x - cx, y - archY);
    return d > r - 0.25 && d <= r + band - 0.25;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let m = 0;
    const fx = x < W / 2 ? x : W - 1 - x;
    if (y >= floorY) {
      const k = y - floorY, inset = Math.max(0, steps - 1 - k);   // each step a little wider than the one above
      if (x >= inset && x < W - inset) m = 4;
    } else if (inArch(x, y)) m = 3;
    else if (inFrame(x, y)) m = 2;
    else if (fx <= pw + 1 && y >= floorY - baseH + Math.round(((fx - pw * 0.5) / (pw * 0.75)) ** 2 * baseH * 0.6)) m = 6;
    else if (spireAt(x, y)) m = 1;
    // the crown: a spike over the gem and two horns curling out from it
    const dx = Math.abs(x - cx);
    if (!m && dx < 0.6 && y >= gemY - gemR - Math.max(2, band) && y < gemY) m = 7;
    if (!m && dx >= gemR && dx <= gemR + band * 2) {
      const hy = top - Math.round(((dx - gemR) / (band * 2)) ** 0.8 * Math.min(top - 1, band));
      if (y === hy || y === hy + 1) m = 7;
    }
    if (Math.abs(x - cx) + Math.abs(y - gemY) * 0.8 <= gemR) m = 5;
    mat[y * W + x] = m;
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : mat[y * W + x];

  // where each frame pixel is along the frame (s, from its foot up to the crown) and across it (k, 0 at the door's edge)
  const fs = new Float32Array(W * H), fk = new Int8Array(W * H);
  const frameLen = (floorY - archY) + Math.PI / 2 * (r + band / 2);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (mat[i] !== 2) continue;
    if (y >= archY) { fs[i] = floorY - 1 - y; fk[i] = x < cx ? ox0 - 1 - x : x - ox1 - 1; }
    else {
      const d = Math.hypot(x - cx, y - archY);
      fk[i] = Math.min(band - 1, Math.floor(d - (r - 0.25)));
      fs[i] = (floorY - archY) + Math.atan2(archY - y, Math.abs(x - cx)) * (r + band / 2);
    }
  }
  const GLYPHS = [0b101111, 0b111010, 0b010111, 0b110011, 0b011110, 0b101101, 0b111001, 0b100111];

  // crystal shards floating in the corners between the spires and the frame
  const floaters = [];
  for (const [fx, fy, h] of [[pw + band * 0.5, top + H * 0.02, 4], [pw + band * 1.4, top + H * 0.12, 3], [pw + 1, top + H * 0.2, 3]]) {
    for (const x of [Math.round(fx), Math.round(W - 1 - fx)]) {
      const y = Math.round(fy);
      let clear = true;
      for (let dy = -1; dy <= h + 2; dy++) for (let dx = -2; dx <= 2; dx++) if (at(x + dx, y + dy)) clear = false;
      if (clear) floaters.push([x, y, h, floaters.length]);
    }
  }

  // the cracks: lines out from the seal across the door, branches off them, and a few in the stone. Each starts showing at
  // its own damage and grows from there.
  const rand = seeded(W * 131 + H);
  const cracks = [];
  const walk = (x, y, angle, max, kind, start, wobble) => {
    const pts = [];
    let px = Math.round(x), py = Math.round(y);
    for (let i = 0; i < max; i++) {
      angle += (rand() - 0.5) * wobble;
      x += Math.cos(angle); y += Math.sin(angle);
      const nx = Math.round(x), ny = Math.round(y);
      const m = at(nx, ny);
      if (kind === 'door' ? m !== 3 : !(m === 1 || m === 2 || m === 6 || m === 4)) break;
      if (nx !== px || ny !== py) pts.push(ny * W + nx);
      px = nx; py = ny;
    }
    return pts;
  };
  const mains = 9;
  const order = Array.from({ length: mains }, (_, i) => i).sort(() => rand() - 0.5);
  for (let i = 0; i < mains; i++) {
    const a = (i / mains) * Math.PI * 2 + (rand() - 0.5) * 0.5;
    const start = 0.03 + order[i] * 0.085;
    const pts = walk(cx + Math.cos(a) * sealR * 0.6, sealY + Math.sin(a) * sealR * 0.6, a, W + H, 'door', start, 0.7);
    cracks.push({ pts, start, grow: 0.28, glow: true });
    for (let b = 0; b < 2; b++) {
      if (pts.length < 6) continue;
      const from = pts[Math.floor(pts.length * (0.3 + rand() * 0.5))];
      const pts2 = walk(from % W, (from / W) | 0, a + (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.5), 6 + rand() * W * 0.3, 'door', 0, 0.9);
      cracks.push({ pts: pts2, start: start + 0.2 + rand() * 0.2, grow: 0.2, glow: true });
    }
  }
  for (let i = 0; i < 9; i++) {   // down the spires, across the frame, along the steps
    const left = rand() < 0.5, a0 = Math.PI * (1.1 + rand() * 0.8);
    const spots = [
      [left ? pw * 0.55 : W - 1 - pw * 0.55, H * (0.3 + rand() * 0.5), Math.PI / 2 + (rand() - 0.5)],
      [cx + Math.cos(a0) * (r + 1), archY + Math.sin(a0) * (r + 1), a0 + (rand() - 0.5) * 0.8],
      [W * (0.1 + rand() * 0.8), floorY, (rand() - 0.5) * 0.6 + (rand() < 0.5 ? 0 : Math.PI)],
    ];
    const [x, y, a] = spots[i % 3];
    cracks.push({ pts: walk(x, y, a, 5 + rand() * H * 0.18, 'stone', 0, 1.1), start: 0.4 + rand() * 0.55, grow: 0.25, glow: false });
  }

  // where each chain runs: corner to corner across the door, crossing over the seal
  const chainA = [[ox0 + 1, archY - r * 0.45], [ox1 - 1, floorY - 3]];
  const chainB = [[ox1 - 1, archY - r * 0.45], [ox0 + 1, floorY - 3]];

  // Mewtwo, scaled to stand in the doorway
  let fig = null;
  const fitFigure = () => {
    if (!figure) return null;
    const fh = figure.bottom - figure.top + 1, fw = figure.right - figure.left + 1;
    const s = Math.min((floorY - (archY - r)) * 0.86 / fh, (ox1 - ox0 + 1) * 0.92 / fw);
    const mask = new Uint8Array(W * H);
    const dw = Math.round(fw * s), dh = Math.round(fh * s);
    const x0 = Math.round(cx - dw / 2), y0 = floorY - dh;
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const sx = figure.left + Math.floor(x / s), sy = figure.top + Math.floor(y / s);
      if (figure.mask[sy * figure.w + sx] && at(x0 + x, y0 + y) === 3) mask[(y0 + y) * W + x0 + x] = 1;
    }
    const eyes = EYES.map(([ex, ey]) => [x0 + Math.round((ex - figure.left) * s), y0 + Math.round((ey - figure.top) * s)]);
    return { mask, eyes };
  };

  const img = new ImageData(W, H);
  const lit = new Uint8Array(W * H);    // cracks showing at this HP
  const glow = new Float32Array(W * H);

  function paint(ctx, state = {}) {
    const { hp = 1, t = 0, flash = 0, seal = 0, eyes = 0, open = false, mute = false } = state;
    if (!fig && figure) fig = fitFigure();
    const dmg = 1 - hp;
    const data = img.data;
    lit.fill(0); glow.fill(0);
    if (!open) for (const c of cracks) {
      const shown = clamp01((dmg - c.start) / c.grow);
      const n = Math.round(c.pts.length * shown);
      for (let i = 0; i < n; i++) lit[c.pts[i]] = c.glow ? 2 : 1;
    }
    // light spills a pixel or two either side of a glowing crack
    const flicker = 0.75 + 0.25 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
    if (!open && !mute) for (let i = 0; i < lit.length; i++) {
      if (lit[i] !== 2) continue;
      const x = i % W, y = (i / W) | 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const j = (y + dy) * W + x + dx;
        if (x + dx < 0 || x + dx >= W || y + dy < 0 || y + dy >= H) continue;
        const d = Math.abs(dx) + Math.abs(dy);
        glow[j] = Math.max(glow[j], d === 1 ? 0.55 : d === 2 ? 0.25 : d === 3 ? 0.1 : 0);
      }
    }
    // from about half HP the light behind the door rises, and the silhouette blocks it
    const back = open ? 0 : clamp01((0.55 - hp) / 0.5) * (mute ? 0.4 : 1);
    const holes = clamp01((dmg - 0.72) / 0.28);
    const chainsLeft = state.chains ?? (open ? 0 : hp <= 0.06 ? 0 : hp <= 0.5 ? 1 : 2);
    const pulse = mute ? 0.3 : 0.7 + 0.3 * Math.sin(t * 2.6) + seal;
    const unstable = hp < 0.3 && !mute ? (hash(Math.floor(t * 12), 3) < (0.3 - hp) * 1.6 ? 0.35 : 1) : 1;
    const figMask = fig?.mask;

    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, m = mat[i];
      let c = null;
      if (m === 0) { data[i * 4 + 3] = 0; continue; }
      const edge = at(x - 1, y) === 0 || at(x + 1, y) === 0 || at(x, y - 1) === 0 || at(x, y + 1) === 0;
      if (m === 3) {
        if (open) c = depths(x, y, t);
        else {
          // dark crystal: a sheen down it, a groove inside the arch, the seam between its two leaves
          const v = (y - top) / (floorY - top);
          const sheen = ((x - ox0) + y * 0.5) % 11 < 2 ? 1 : 0;
          c = v < 0.3 ? P.door2 : v < 0.75 ? P.door1 : P.door0;
          if (sheen && dither(x, y) < 0.6) c = mix(c, P.door3, 0.7);
          const inner = !inArch(x - 2, y) || !inArch(x + 2, y) || !inArch(x, y - 2);
          if (inner && inArch(x - 1, y) && inArch(x + 1, y) && inArch(x, y - 1)) c = P.door3;
          if (!inArch(x - 1, y) || !inArch(x + 1, y) || !inArch(x, y - 1)) c = P.door0;
          if (Math.abs(x - cx) < 0.6 && y > archY - r * 0.6) c = P.door0;
          // the seal's glow on the crystal round it
          const sd = Math.hypot(x - cx, y - sealY) - sealR;
          if (!mute && sd > 0 && sd < 4 && dither(x, y) < (1 - sd / 4) * 0.5 * pulse) c = mix(c, P.seal0, 0.6);
          if (back > 0) {
            const near = 1 - Math.min(1, Math.hypot(x - cx, (y - sealY) * 0.8) / (r * 1.5));
            const amount = back * (0.55 + 0.45 * near) * (0.88 + 0.12 * Math.sin(t * 2 + y * 0.3));
            const rim = figMask && !figMask[i] && (figMask[i - 1] || figMask[i + 1] || figMask[i - W] || figMask[i + W]);
            if (figMask?.[i]) c = mix(c, P.shadow, Math.min(1, back * 1.6));
            else if (rim) c = mix(c, P.back2, Math.min(1, back * 1.8));   // light catching the edge of the figure
            else if (dither(x, y) < amount * 1.6) c = mix(c, amount > 0.6 ? P.back2 : amount > 0.3 ? P.back1 : P.back0, Math.min(1, 0.3 + amount));
          }
          if (holes > 0 && hash(x, y) < holes * 0.9 && nearLit(x, y)) c = figMask?.[i] ? P.shadow : mix(P.back2, P.white, 0.4);
        }
      } else if (m === 5) {
        const pulseGem = mute ? 0.2 : 0.6 + 0.4 * Math.sin(t * 2.6);
        c = edge ? P.outline : (x + y) % 3 === 0 ? mix(P.gem1, P.gem2, pulseGem) : y < gemY ? P.gem2 : P.gem1;
        if (hp <= 0 || open) c = edge ? P.outline : P.stone1;   // the gem goes dark once the gate falls
      } else {
        c = m === 2 ? frame(i, x, y, open ? 0 : hp, t, mute) : stone(m, x, y, t);
        const seam = (m === 1 || m === 6) && (at(x - 1, y) === 2 || at(x + 1, y) === 2);
        if ((edge && m !== 7) || seam) c = P.outline;
      }
      if (lit[i]) c = lit[i] === 2 ? (mute ? P.door0 : mix(P.leak, P.leakHot, clamp01(dmg * 1.1 - 0.2) * flicker)) : P.mortar;
      else if (glow[i] && m === 3) c = mix(c, P.leak, glow[i] * (0.6 + 0.4 * dmg) * flicker);
      if (flash) c = mix(c, P.white, flash);
      data[i * 4] = c[0]; data[i * 4 + 1] = c[1]; data[i * 4 + 2] = c[2]; data[i * 4 + 3] = 255;
    }

    floating(data, t, flash);
    if (!open) {
      drawChain(data, chainA, chainsLeft >= 1 ? 1 : 0.32, flash);
      drawChain(data, chainB, chainsLeft >= 2 ? 1 : 0.32, flash);
      drawSeal(data, pulse * unstable, hp, flash, mute, t);
      if (fig && back > 0.15 && eyes > 0) for (const [ex, ey] of fig.eyes) {
        put(data, ex, ey, mix(P.eye, P.white, eyes * 0.6), eyes);
        put(data, ex, ey - 1, P.eye, eyes * 0.4); put(data, ex - 1, ey, P.eye, eyes * 0.3); put(data, ex + 1, ey, P.eye, eyes * 0.3);
      }
      if (!mute) motes(data, t, dmg);
    } else {
      rubble(data);
      hangingChains(data);
      if (state.figure && fig) for (let i = 0; i < W * H; i++) if (fig.mask[i]) {
        const c = mix(P.shadow, P.white, flash);
        data[i * 4] = c[0]; data[i * 4 + 1] = c[1]; data[i * 4 + 2] = c[2];
      }
      if (state.figure && fig && eyes > 0) for (const [ex, ey] of fig.eyes) put(data, ex, ey, P.eye, eyes);
    }
    ctx.putImageData(img, 0, 0);

    function nearLit(x, y) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (lit[(y + dy) * W + x + dx] === 2) return true;
      return false;
    }
  }

  // the spires, the rock they grow from and the steps, lit from the top left
  function stone(m, x, y, t) {
    if (m === 4) {   // smooth steps, a light tread on each, a gold inlay along the top one
      const k = y - floorY;
      if (k === 1 && Math.abs(x - cx) < r + band && x % 4 === 1) return P.gold1;
      return k === 0 ? P.stone3 : k === steps - 1 ? P.stone0 : k % 2 ? P.stone1 : P.stone2;
    }
    if (m === 7) return y < top - 1 || Math.abs(x - cx) < 0.6 ? P.gold2 : P.gold1;
    if (m === 6) {   // dark rock with a crystal or two poking out
      const yTop = at(x, y - 1) !== 6;
      if (hash(x, y) < 0.06) return P.ice2;
      return yTop ? P.stone2 : hash(x * 3, y) < 0.2 ? P.stone0 : P.stone1;
    }
    // ice crystal: a bright ridge down the middle, the lit left face, the shaded right one, facet lines across
    const { sp, rel, mirror } = spireAt(x, y);
    const lr = mirror ? -rel : rel;   // the light comes from the left on both sides
    const facet = ((y + Math.abs(x - (mirror ? W - 1 - sp.xc : sp.xc)) * 1.6) | 0) % 9 === 0;
    let c = Math.abs(rel) < 0.2 ? P.ice4 : lr < -0.5 ? P.ice3 : lr < 0 ? P.ice2 : lr < 0.6 ? P.ice1 : P.ice0;
    if (facet) c = lr < 0 ? P.ice1 : P.ice2;
    if (y < sp.tip + 3) c = mix(c, P.ice4, 0.5);
    if (hash(x, y) < 0.025 && Math.sin(t * 3 + hash(y, x) * 20) > 0.6) c = P.white;   // a glint now and then
    return c;
  }

  /* The frame: obsidian with gold trim, and a line of glyphs running up both sides and round the arch, glowing with the
     seal. They go out from the bottom up as the gate weakens, the seal's power failing. */
  function frame(i, x, y, hp, t, mute) {
    const k = fk[i], s = fs[i];
    const lit = y < archY - r * 0.4 || x < cx;
    if (k === 0) return P.gold1;
    if (k === band - 1) return lit ? P.gold2 : P.gold1;
    const row = k - 1, col = Math.floor(s) % 4;
    const glyph = GLYPHS[(Math.floor(s / 4) * 5 + (x < cx ? 0 : 3)) % GLYPHS.length];
    const on = col < 3 && row < 2 && (glyph >> (row * 3 + col)) & 1;
    if (!on) return (x + y) % 7 === 0 ? P.frame2 : P.frame1;
    if (mute || s / frameLen < 1 - hp) return P.frame0;
    const shimmer = 0.6 + 0.4 * Math.sin(t * 2.6 - s * 0.15);
    return mix(P.seal1, P.seal3, shimmer * 0.5);
  }

  // the floating shards bob up and down
  function floating(data, t, flash) {
    for (const [x, y0, h, n] of floaters) {
      const y = y0 + Math.round(Math.sin(t * 1.6 + n * 1.3));
      for (let dy = 0; dy < h; dy++) {
        const w = dy === 0 || dy === h - 1 ? 0 : 1;
        for (let dx = -w; dx <= w; dx++) plot(data, x + dx, y + dy, mix(dy === 0 ? P.ice4 : dx < 0 ? P.ice3 : dx > 0 ? P.ice1 : P.ice2, P.white, flash));
      }
    }
  }
  function plot(data, x, y, c) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
  }

  function put(data, x, y, c, a = 1) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H || a <= 0) return;
    const i = (y * W + x) * 4;
    if (!data[i + 3]) return;
    const old = [data[i], data[i + 1], data[i + 2]], n = mix(old, c, Math.min(1, a));
    data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
  }

  // a chain of links, two pixels thick; a broken one hangs from its top anchor
  function drawChain(data, [[x0, y0], [x1, y1]], reach, flash) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.ceil(len * reach);
    for (let s = 0; s <= steps; s++) {
      let x = x0 + (x1 - x0) * (s / len), y = y0 + (y1 - y0) * (s / len);
      if (reach < 1) { x = x0 + (x1 - x0) * (s / len) * 0.35; y = y0 + s; }   // snapped: it swings down from the anchor
      const k = s % 4;
      const c = mix(k === 0 ? P.chain3 : k === 1 ? P.chain2 : k === 2 ? P.chain1 : P.chain0, P.white, flash);
      put(data, x, y, c);
      put(data, x, y + 1, k === 3 ? P.chain0 : P.chain1);
      if (k === 0) put(data, x, y - 1, P.chain0);
    }
    if (reach < 1) {   // the other half lies in a heap on the steps
      for (let s = 0; s < 6; s++) put(data, x1 + (x1 < cx ? s : -s) * 0.8, floorY - 1 - (s % 2), s % 2 ? P.chain1 : P.chain2);
    }
  }

  // the seal: a magic circle turning slowly, a ring of rune ticks inside its rim, a six-point star turning the other way
  // with an orb on each point, and a burning core that cracks white once the gate is below half
  function drawSeal(data, glowAmt, hp, flash, mute, t) {
    const g = clamp01(glowAmt);
    const hot = mute ? P.seal0 : mix(P.seal1, P.seal3, Math.max(0, glowAmt - 0.8));
    const mid = mute ? P.door3 : mix(P.seal0, P.seal2, g);
    const f = (c) => mix(c, P.white, flash);
    const spin = mute ? 0 : t * 0.3;
    const at2 = (a, rr) => [cx + Math.cos(a) * rr, sealY + Math.sin(a) * rr];
    for (let a = 0; a < 360; a += 2) {
      const rad = a * Math.PI / 180;
      put(data, ...at2(rad, sealR), f(hot));
      put(data, ...at2(rad, sealR + 1), f(P.seal0), 0.6);
    }
    for (let k = 0; k < 24; k++) {
      if (k % 4 === 3) continue;
      const a = k * Math.PI / 12 + spin;
      put(data, ...at2(a, sealR - 2), f(mid));
      if (k % 4 === 0 && sealR >= 8) put(data, ...at2(a, sealR - 3), f(mid), 0.8);
    }
    const inner = Math.max(2, sealR * 0.62);
    for (let a = 0; a < 360; a += 6) put(data, ...at2(a * Math.PI / 180, inner), f(P.seal0), 0.8);
    for (const turn of [0, Math.PI]) {
      const pts = [0, 1, 2].map(k => at2(turn - Math.PI / 2 - spin * 1.5 + k * 2 * Math.PI / 3, inner));
      for (let k = 0; k < 3; k++) {
        const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % 3];
        const n = Math.ceil(Math.hypot(bx - ax, by - ay));
        for (let s = 0; s <= n; s++) put(data, ax + (bx - ax) * s / n, ay + (by - ay) * s / n, f(mid));
      }
      for (const [px, py] of pts) put(data, px, py, f(hot));
    }
    const core = Math.max(1, Math.round(sealR * 0.2));
    for (let dy = -core; dy <= core; dy++) for (let dx = -core; dx <= core; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > core) continue;
      put(data, cx + dx, sealY + dy, f(Math.abs(dx) + Math.abs(dy) < core ? (hp < 0.5 && !mute ? P.white : hot) : mid));
    }
  }

  // motes of light drifting up off the cracks, more of them as the damage grows
  function motes(data, t, dmg) {
    const pts = [];
    for (let i = 0; i < lit.length; i += 1) if (lit[i] === 2) pts.push(i);
    if (!pts.length) return;
    const n = Math.round(2 + dmg * 14);
    for (let k = 0; k < n; k++) {
      const speed = 0.25 + hash(k, 1) * 0.35;
      const life = (t * speed + hash(k, 2)) % 1;
      const from = pts[Math.floor(hash(k, Math.floor(t * speed + hash(k, 2))) * pts.length)];
      const x = (from % W) + Math.sin(life * 6 + k) * 1.5, y = ((from / W) | 0) - life * H * 0.25;
      put(data, x, y, life < 0.5 ? P.leakHot : P.leak, 1 - life);
    }
  }

  // broken: the door's shards on the steps, chains hanging off the pillars
  function rubble(data) {
    const rr = seeded(7);
    for (let k = 0; k < Math.round(W * 0.35); k++) {
      const x = ox0 - 2 + rr() * (ox1 - ox0 + 4), y = floorY - 1 + rr() * steps;
      const s = 1 + Math.floor(rr() * 2.5);
      for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s + 1 - dy; dx++) put(data, x + dx, y - dy, dy === s - 1 ? P.door3 : (dx + dy) % 2 ? P.door2 : P.door1);
    }
  }
  function hangingChains(data) {
    for (const [x0, y0] of [chainA[0], chainB[0]]) {
      for (let s = 0; s < (floorY - y0) * 0.45; s++) {
        const k = s % 4;
        put(data, x0 + Math.sin(s * 0.2) * 0.6, y0 + s, k === 0 ? P.chain3 : k === 1 ? P.chain2 : k === 2 ? P.chain1 : P.chain0);
      }
    }
  }

  // steps down into the Crystal Depths' violet light, crystals glinting either side
  function depths(x, y, t) {
    const v = (y - (archY - r)) / (floorY - (archY - r));
    const fromMid = Math.abs(x - cx) / r;
    const vanish = archY + (floorY - archY) * 0.15;
    let c = v < 0.35 ? P.depth0 : v < 0.6 ? P.depth1 : P.depth2;
    // the light swells from deep inside, a little brighter in the middle, and fills the arch with a dim glow
    const swell = 0.85 + 0.15 * Math.sin(t * 1.7);
    const light = clamp01((v - 0.3) * 1.4) * (1 - fromMid * 0.6) * swell;
    const haze = clamp01(1 - Math.hypot(x - cx, (y - floorY) * 0.6) / (r * 1.6)) * swell;
    if (dither(x, y) < haze * 0.9) c = mix(c, haze > 0.5 ? P.depth2 : P.depth1, 0.8);
    if (dither(x, y) < light) c = mix(c, light > 0.7 ? P.depth4 : P.depth3, 0.65);
    // stair edges, closer together the deeper they go
    if (y > vanish) {
      const d = y - vanish, row = Math.sqrt(d) * 1.6;
      if (Math.abs(row - Math.round(row)) < 0.18 * Math.min(1, d / 6) && fromMid < 0.15 + d / (floorY - vanish) * 0.8) c = mix(c, P.depth4, 0.55);
    }
    // a crystal or two on each wall
    const wall = 1 - fromMid;
    if (wall < 0.22 && hash(Math.floor(x / 2), Math.floor(y / 3)) < 0.35) c = mix(P.depth3, P.depth4, (Math.sin(t * 3 + y) + 1) / 2 * 0.6);
    return c;
  }

  return {
    W, H, cx, sealY, sealR, archY, r, floorY, ox0, ox1, top,
    paint,
    /** The door's pixels, for the break scene to throw as shards. */
    doorPixels: () => { const out = []; for (let i = 0; i < mat.length; i++) if (mat[i] === 3) out.push(i); return out; },
    figureFit: () => (fig ??= fitFigure()),
  };
}
