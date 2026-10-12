/* Kenmatta's medallion (js/arena-3d.js), Mortal Kombat's dragon medallion with a Dragonite for its dragon: a bevelled gold
   ring round a dark field, the Dragonite a smooth gold relief traced from its sprite (its silhouette blurred and cut again,
   so the pixel steps round off; its shading kept as the relief's). The trace is baked once by tools/medallion.html into
   assets/arena/: on the user's iPhone it never appeared when traced in the page, so the game only draws the PNGs. */

const canvas = (w, h) => { const c = Object.assign(document.createElement('canvas'), { width: w, height: h }); c.getContext('2d', { willReadFrequently: true }); return c; };
const DRAGONITE_EYE = [26, 19.5];   // the sprite's eye, in its pixels

/** Paints the medallion into `out.map` (colour) and `out.bump` (heights): without `img` just the ring and field, with
    Dragonite's sprite the relief too, and its eye's place (0-1 across the canvas) in `out.eye`. */
export function paintMedallion(img, out) {
  const N = out.map.width, g = out.map.getContext('2d'), b = out.bump.getContext('2d'), C = N / 2;
  const Ro = N * 0.49, Rr = N * 0.4, Rf = N * 0.37;   // the ring's outside, its inside, the field
  const disc = (ctx, rad, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(C, C, rad, 0, Math.PI * 2); ctx.fill(); };
  const lin = (ctx, stops, a = -0.785) => {
    const l = ctx.createLinearGradient(C + Math.cos(a) * Ro, C + Math.sin(a) * Ro, C - Math.cos(a) * Ro, C - Math.sin(a) * Ro);
    stops.forEach((s, i) => l.addColorStop(i / (stops.length - 1), s));
    return l;
  };
  // the ring: lit from the top left outside, the bevel turning the other way inside
  disc(g, Ro, lin(g, ['#fff4c0', '#f8c838', '#b07818', '#6a3e0c']));
  disc(g, Ro * 0.94, lin(g, ['#8a5410', '#d89a28', '#f8d060', '#fff0b0']));
  disc(g, Rr, lin(g, ['#fff0b0', '#e8b030', '#9a6414', '#5a3008']));
  g.strokeStyle = 'rgba(70,36,6,0.65)'; g.lineWidth = N * 0.004;
  for (let i = 0; i < 48; i++) {   // engraved ticks round it
    const a = i / 48 * Math.PI * 2;
    g.beginPath(); g.moveTo(C + Math.cos(a) * Rr * 1.04, C + Math.sin(a) * Rr * 1.04); g.lineTo(C + Math.cos(a) * Ro * 0.9, C + Math.sin(a) * Ro * 0.9); g.stroke();
  }
  for (let i = 0; i < 8; i++) {   // studs
    const a = i / 8 * Math.PI * 2 + Math.PI / 8, x = C + Math.cos(a) * (Rr + Ro * 0.94) / 2, y = C + Math.sin(a) * (Rr + Ro * 0.94) / 2, s = N * 0.022;
    const rg = g.createRadialGradient(x - s * 0.4, y - s * 0.4, 0, x, y, s);
    rg.addColorStop(0, '#fffbe0'); rg.addColorStop(0.5, '#f0c040'); rg.addColorStop(1, '#6a3e0c');
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, s, 0, Math.PI * 2); g.fill();
  }
  // the field: a dark crimson dish
  const field = g.createRadialGradient(C, C - Rf * 0.3, 0, C, C, Rf);
  field.addColorStop(0, '#4a1018'); field.addColorStop(1, '#14040a');
  disc(g, Rf, field);
  g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = N * 0.012; g.beginPath(); g.arc(C, C, Rf, 0, Math.PI * 2); g.stroke();
  // the relief's heights: the ring raised, the field sunk
  disc(b, Ro, '#a0a0a0'); disc(b, Ro * 0.94, '#c8c8c8'); disc(b, Rr, '#e0e0e0'); disc(b, Rf, '#202020');
  if (!img) return;

  // Dragonite: its first frame, cropped to its outline and fitted inside the field
  const sw = img.naturalWidth, sh = img.naturalHeight, src = canvas(sw, sh), sg = src.getContext('2d');
  sg.drawImage(img, 0, 0);
  const sp = sg.getImageData(0, 0, sw, sh).data;
  let x0 = sw, y0 = sh, x1 = 0, y1 = 0;
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (sp[(y * sw + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, k = Math.min(Rf * 1.72 / bh, Rf * 1.62 / bw);
  const W = Math.ceil(bw * k) + 40, H = Math.ceil(bh * k) + 40, ox = Math.round(C - W / 2 + Rf * 0.04), oy = Math.round(C - H / 2 + Rf * 0.04);
  const up = canvas(W, H), ug = up.getContext('2d');
  ug.imageSmoothingEnabled = true; ug.imageSmoothingQuality = 'high';
  ug.drawImage(src, x0, y0, bw, bh, 20, 20, bw * k, bh * k);
  const u = ug.getImageData(0, 0, W, H).data;
  // the alpha blurred by hand (Safari's canvas has no `filter`), two box passes each way, so the pixel steps round off
  const blurA = new Float32Array(W * H), tmp = new Float32Array(W * H), br = Math.max(1, Math.round(k * 0.4));
  for (let i = 0; i < W * H; i++) blurA[i] = u[i * 4 + 3] / 255;
  const box = (from, to, n, stride, lines, lineStride) => {   // a running-sum box blur along one axis
    for (let l = 0; l < lines; l++) {
      const o = l * lineStride;
      let t = 0;
      for (let j = -br; j <= br; j++) t += from[o + Math.min(n - 1, Math.max(0, j)) * stride];
      for (let j = 0; j < n; j++) {
        to[o + j * stride] = t / (2 * br + 1);
        t += from[o + Math.min(n - 1, j + br + 1) * stride] - from[o + Math.max(0, j - br) * stride];
      }
    }
  };
  for (let pass = 0; pass < 2; pass++) { box(blurA, tmp, W, 1, H, W); box(tmp, blurA, H, W, W, 1); }
  // the silhouette cut again from the blurred alpha (smooth edges); the colours' lightness kept for its shading
  const mask = new Float32Array(W * H), lum = new Float32Array(W * H);
  const step = (e0, e1, v) => { const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  for (let i = 0; i < W * H; i++) {
    const a = u[i * 4 + 3] / 255;
    mask[i] = step(0.4, 0.6, blurA[i]);
    lum[i] = a > 0.05 ? (u[i * 4] * 0.35 + u[i * 4 + 1] * 0.5 + u[i * 4 + 2] * 0.15) / a / 255 : 0;
  }
  const soft = new Float32Array(W * H);   // the mask blurred, for the bevel's light and shadow
  const R2 = Math.max(2, Math.round(k * 0.6));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let t = 0, n = 0;
    for (let dy = -R2; dy <= R2; dy += 2) for (let dx = -R2; dx <= R2; dx += 2) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H) { t += mask[yy * W + xx]; n++; }
    }
    soft[y * W + x] = t / n;
  }
  const field2 = g.getImageData(ox, oy, W, H), f = field2.data, bmp = b.getImageData(ox, oy, W, H), bd = bmp.data;
  const at = (arr, x, y) => arr[Math.max(0, Math.min(H - 1, y)) * W + Math.max(0, Math.min(W - 1, x))];
  const gold = [[90, 48, 10], [176, 112, 24], [236, 172, 48], [252, 220, 120], [255, 248, 210]];
  const ramp = (v) => { v = Math.max(0, Math.min(0.999, v)) * (gold.length - 1); const i = Math.floor(v), t = v - i; return gold[i].map((c, j) => c + (gold[i + 1][j] - c) * t); };
  const o = Math.round(k * 0.5);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, m = mask[i], dx = ox + x - C, dy = oy + y - C;
    if (Math.hypot(dx, dy) > Rf - N * 0.008) continue;
    const shadow = at(mask, x - o, y - o) * (1 - m);   // its shadow cast down and right on the field
    let r = f[i * 4], gg = f[i * 4 + 1], bl = f[i * 4 + 2];
    r *= 1 - shadow * 0.6; gg *= 1 - shadow * 0.6; bl *= 1 - shadow * 0.6;
    if (m > 0) {
      const light = (at(soft, x - 2, y - 2) - at(soft, x + 2, y + 2)) * 3;   // the bevel: lit top left, dark bottom right
      const edge = 1 - step(0.55, 0.95, soft[i]) * 0.35;   // a darker line round its outline, so it reads on the field
      const [cr, cg, cb] = ramp((0.18 + lum[i] * 0.78 + light * 0.5) * (0.7 + edge * 0.3) * (soft[i] < 0.6 ? 0.75 : 1));
      r = r * (1 - m) + cr * m; gg = gg * (1 - m) + cg * m; bl = bl * (1 - m) + cb * m;
    }
    f[i * 4] = r; f[i * 4 + 1] = gg; f[i * 4 + 2] = bl;
    const h = 32 + soft[i] * 150 + m * lum[i] * 60;
    bd[i * 4] = bd[i * 4 + 1] = bd[i * 4 + 2] = h;
  }
  g.putImageData(field2, ox, oy);
  b.putImageData(bmp, ox, oy);
  out.eye = [(ox + 20 + (DRAGONITE_EYE[0] - x0) * k) / N, (oy + 20 + (DRAGONITE_EYE[1] - y0) * k) / N];
}
