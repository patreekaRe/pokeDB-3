/*
 * The legendaries' Super Saiyan auras (tools/legendary-aura.py bakes theirs into GIFs), drawn live on a canvas over a
 * still sprite instead: Kenmatta powers up when you fight him (level 1) and goes Super Saiyan 2 at half HP (level 2),
 * the user's joke. The same steps as the script, frame by frame on its 16-frame loop: a body flash, flame tongues off
 * every upward edge and up the sides, rings of aura, rising embers, orbiting sparkles, and level 2's lightning. Only the
 * effect is drawn (the body's pixels stay clear, but for the flash), so the <img> underneath keeps its own animations.
 */
const FRAMES = 16, FRAME_MS = 80;
const GOLD = {   // Super Saiyan gold
  aura: ['#fffff0', '#fff070', '#ffd020', '#f0a000'],
  flare: ['#fffff0', '#fff060', '#ffc820', '#d88800'],
  bits: ['#fffff0', '#fff070', '#ffc820'],
};
const SPARK = [255, 255, 255, 255];
const BOLT = [[255, 255, 255, 255], [184, 224, 255, 255], [120, 170, 255, 255]];

const rgba = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).concat(255);
const lighten = (c, k) => c.slice(0, 3).map(v => Math.min(255, Math.round(v + (255 - v) * k))).concat(c[3]);

/** A small seeded random, so the lightning repeats with the loop like the GIFs'. */
function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** The level's 16 frames for a sprite's pixels (an ImageData), each a canvas of the padded size. */
function makeFrames(src, level) {
  const w0 = src.width, h0 = src.height;
  const pad = level === 2 ? Math.max(14, Math.round(Math.max(w0, h0) * 0.16)) : Math.max(10, Math.round(Math.max(w0, h0) * 0.1));
  const w = w0 + pad * 2, h = h0 + pad * 2;
  const aura = GOLD.aura.map(rgba), flare = GOLD.flare.map(rgba), bits = GOLD.bits.map(rgba);
  const body = new Uint8Array(w * h);
  for (let y = 0; y < h0; y++) for (let x = 0; x < w0; x++) if (src.data[(y * w0 + x) * 4 + 3] > 0) body[(y + pad) * w + x + pad] = 1;
  const inBody = (x, y) => x >= 0 && y >= 0 && x < w && y < h && body[y * w + x];
  const rnd = seeded(level * 7919 + w);
  const motes = Array.from({ length: level === 2 ? Math.max(8, Math.floor(w / 9)) : Math.max(4, Math.floor(w / 22)) }, () => ({
    x: pad * 0.6 + rnd() * (w - pad * 1.2), phase: rnd(), sway: 1 + rnd() * 2, speed: rnd() < 0.67 ? 1 : 2, c: Math.floor(rnd() * bits.length),
  }));
  const orbiters = level === 2 ? (w < 110 ? 3 : 4) : 2;
  const ringOf = (filled) => {
    const out = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (filled[y * w + x]) continue;
      if ((x > 0 && filled[y * w + x - 1]) || (x < w - 1 && filled[y * w + x + 1]) || (y > 0 && filled[(y - 1) * w + x]) || (y < h - 1 && filled[(y + 1) * w + x])) out.push([x, y]);
    }
    return out;
  };
  const edge = ringOf(body);
  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const t = i / FRAMES, canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d'), out = ctx.createImageData(w, h), px = out.data;
    const at = (x, y) => (y * w + x) * 4;
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) px.set(c, at(x, y)); };
    const empty = (x, y) => px[at(x, y) + 3] === 0;
    // the power pulse: the body flashes lighter twice a loop
    const pulse = Math.pow(Math.max(0, Math.cos(t * Math.PI * 4)), 6) * (level === 2 ? 0.45 : 0.18);
    if (pulse > 0.02) for (let y = 0; y < h0; y++) for (let x = 0; x < w0; x++) {
      const k = (y * w0 + x) * 4;
      if (src.data[k + 3]) put(x + pad, y + pad, lighten([...src.data.slice(k, k + 4)], pulse));
    }
    // flame tongues off every upward edge, shorter ones licking up the sides
    const reach = Math.max(pad * (level === 2 ? 0.6 : 0.4), level === 2 ? 5 : 3);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!body[y * w + x]) continue;
      const up = !inBody(x, y - 1), side = !inBody(x - 1, y) || !inBody(x + 1, y);
      if (!up && !side) continue;
      const wave = Math.sin(x * 0.9 + t * Math.PI * 6) + Math.sin(x * 0.37 + y * 0.2 - t * Math.PI * 4 + level);
      const tall = Math.floor(Math.max(0, wave + (up ? 0.7 : -0.2)) * reach * (up ? 1 : 0.5));
      const lean = up ? 0 : !inBody(x - 1, y) ? -1 : 1;
      for (let k = 1; k <= tall; k++) {
        const xx = x + lean * Math.floor(k / 3), yy = y - 1 - k;
        if (yy < 0 || xx < 0 || xx >= w || inBody(xx, yy)) continue;
        if (k === tall && (xx + i) % 2) continue;
        put(xx, yy, flare[Math.min(3, Math.floor((1 - k / (tall + 1)) * 4))]);
      }
    }
    // rings of aura, their colours cycling so the glow seems to pour outwards
    const filled = body.slice();
    for (let r = 0; r < (level === 2 ? 3 : 2); r++) {
      const rim = ringOf(filled);
      const c = level === 2 ? aura[(((r - i) % 4) + 4) % 4] : aura[(r + Math.floor(i / 3)) % 2];
      for (const [x, y] of rim) {
        if ((empty(x, y) || r === 0) && (r < 2 || (x + y + i) % 2 === 0)) put(x, y, c);
        filled[y * w + x] = 1;
      }
    }
    // rising embers
    for (const m of motes) {
      const p = (m.phase + t * m.speed) % 1;
      if (p > 0.85 && i % 2) continue;
      const y = Math.floor(h - 2 - p * (h - 4)), x = Math.floor(m.x + Math.sin(p * Math.PI * 2 * m.sway) * 3);
      for (const [dx, dy] of [[0, 0], [0, -1]]) if (!inBody(x + dx, y + dy)) put(x + dx, y + dy, bits[m.c]);
    }
    // sparkles orbiting on an ellipse, passing behind the body on the far side
    const cx = w / 2, cy = h / 2;
    for (let k = 0; k < orbiters; k++) for (let trail = 0; trail < (level === 2 ? 4 : 2); trail++) {
      const a = (t - trail * 0.018 + k / orbiters) * Math.PI * 2;
      const x = Math.floor(cx + Math.cos(a) * (w / 2 - 3)), y = Math.floor(cy + Math.sin(a) * (h / 2 - 3) * 0.55);
      if (Math.sin(a) < 0 || !inBody(x, y)) {
        put(x, y, trail === 0 ? SPARK : aura[Math.min(3, trail)]);
        if (trail === 0) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h && empty(x + dx, y + dy)) put(x + dx, y + dy, aura[0]);
        }
      }
    }
    // Super Saiyan 2's lightning: jagged bolts out from the body, new ones every other frame
    if (level === 2) {
      const zap = seeded(131 * w + Math.floor(i / 2) + 1);
      for (let n = 0; n < (w < 110 ? 3 : 4); n++) {
        if (!edge.length || zap() < 0.15) continue;
        let [x, y] = edge[Math.floor(zap() * edge.length)];
        let dx = x > w / 2 ? 1 : -1, dy = y < h * 0.6 ? -1 : 1;
        const run = 2 + Math.floor(zap() * 3), steps = 12 + Math.floor(zap() * 11);
        for (let s = 0; s < steps; s++) {
          if (s % run === 0) {
            if (zap() < 0.5) dy = -dy;
            else if (zap() < 0.3) dx = -dx;
          }
          x += dx;
          if (zap() < 0.7) y += dy;
          if (x < 0 || y < 0 || x >= w || y >= h) break;
          if (inBody(x, y)) continue;
          put(x, y, BOLT[0]);
          for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const qx = x + ex, qy = y + ey;
            if (qx >= 0 && qy >= 0 && qx < w && qy < h && !inBody(qx, qy) && px[at(qx, qy)] !== 255) put(qx, qy, BOLT[1]);
          }
        }
      }
    }
    ctx.putImageData(out, 0, 0);
    frames.push(canvas);
  }
  return { frames, pad, w0, h0 };
}

let live = null;

/** Light (or change) the aura over an <img> in a `position: relative` box; level 0 puts it out. */
export function setAura(img, level) {
  if (live && live.img === img && live.level === level) return;
  stopAura();
  if (!level) return;
  const go = () => {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (!w) return;
    const grab = document.createElement('canvas');
    grab.width = w; grab.height = h;
    const g = grab.getContext('2d');
    g.drawImage(img, 0, 0);
    const set = makeFrames(g.getImageData(0, 0, w, h), level);
    const canvas = document.createElement('canvas');
    canvas.className = 'aura-fx';
    canvas.width = set.w0 + set.pad * 2;
    canvas.height = set.h0 + set.pad * 2;
    img.after(canvas);
    const ctx = canvas.getContext('2d');
    let i = 0;
    const tick = () => {
      // follow the <img>'s drawn picture: object-fit contain at the bottom, moved by --shift / --drop (screens.css)
      const bw = img.offsetWidth, bh = img.offsetHeight, style = getComputedStyle(img);
      const scale = Math.min(bw / w, bh / h), shift = parseFloat(style.getPropertyValue('--shift')) || 0;
      const drop = parseFloat(style.getPropertyValue('--drop')) || 0;
      const left = img.offsetLeft + (bw - w * scale) / 2 + shift * bw, top = img.offsetTop + bh - h * scale + drop * bh;
      Object.assign(canvas.style, {
        left: `${left - set.pad * scale}px`, top: `${top - set.pad * scale}px`,
        width: `${canvas.width * scale}px`, height: `${canvas.height * scale}px`,
      });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(set.frames[i++ % FRAMES], 0, 0);
    };
    tick();
    live = { img, level, canvas, timer: setInterval(tick, FRAME_MS) };
  };
  live = { img, level, canvas: null, timer: 0 };
  if (img.complete && img.naturalWidth) go();
  else img.addEventListener('load', () => { if (live?.img === img && live.level === level) go(); }, { once: true });
}

export function stopAura() {
  if (!live) return;
  clearInterval(live.timer);
  live.canvas?.remove();
  live = null;
}
