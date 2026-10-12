/* base-models-kit.js  -  what the furniture batches (js/base-models-a.js to -k.js) share: reading a piece's front
   painting (its outline, a colour at a point, a crop of it) and `frontbox`, the box most machines and cabinets are.

   The pieces' paintings are front views, painted the same from every side, so carved they wore their front all round
   and came out oval (2026-10-12, the user's ask: "as clean as these cabinets"). A frontbox is a real box the size of the
   painting's outline, the painting on its front only, its sides, back and top a plain colour read off the painting's
   own edges, so every theme still matches. */

const SOLID = 40;
const cache = new Map();
const keep = (key, make) => { if (!cache.has(key)) { cache.set(key, make()); if (cache.size > 200) cache.delete(cache.keys().next().value); } return cache.get(key); };

const idOf = (K) => `${K.p.fam}|${K.p.theme || ''}`;
const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

/** The front painting at 1 unit a pixel, shadow-free, and its solid pixels' box in units: { x0, x1, y0, y1 } (y from the
    top of the canvas), with the canvas's size. */
export function outline(K) {
  return keep(idOf(K) + '|ol', () => {
    const art = K.p.art(0, 1, true), w = art.width, h = art.height, d = art.getContext('2d').getImageData(0, 0, w, h).data;
    let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > SOLID) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return { art, d, w, h, x0, x1: x1 + 1, y0, y1: y1 + 1 };
  });
}

/** The painting's colour at (fx, fy), fractions of its outline (0, 0 its top left), averaged over a little square. */
export function colourAt(K, fx, fy) {
  const o = outline(K), cx = o.x0 + fx * (o.x1 - o.x0), cy = o.y0 + fy * (o.y1 - o.y0);
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = Math.round(cy) - 1; y <= Math.round(cy) + 1; y++) for (let x = Math.round(cx) - 1; x <= Math.round(cx) + 1; x++) {
    if (x < 0 || y < 0 || x >= o.w || y >= o.h) continue;
    const i = (y * o.w + x) * 4;
    if (o.d[i + 3] <= SOLID) continue;
    r += o.d[i]; g += o.d[i + 1]; b += o.d[i + 2]; n++;
  }
  return n ? hex(r / n, g / n, b / n) : K.pal.c;
}

/** The body's colour: the painting averaged down a column `fx` across its outline, between fractions `fy0` and `fy1`
    of its height, its outline's dark pixels and bright highlights left out. */
export function columnColour(K, fx = 0.1, fy0 = 0, fy1 = 1) {
  const o = outline(K), x = Math.round(o.x0 + fx * (o.x1 - o.x0));
  let r = 0, g = 0, b = 0, n = 0;
  for (let y = Math.round(o.y0 + fy0 * (o.y1 - o.y0)); y < o.y0 + fy1 * (o.y1 - o.y0); y++) for (const dx of [-1, 0, 1]) {
    const i = (y * o.w + x + dx) * 4;
    if (o.d[i + 3] <= SOLID) continue;
    const l = o.d[i] + o.d[i + 1] + o.d[i + 2];
    if (l < 90 || l > 700) continue;
    r += o.d[i]; g += o.d[i + 1]; b += o.d[i + 2]; n++;
  }
  return n ? hex(r / n, g / n, b / n) : colourAt(K, fx, (fy0 + fy1) / 2);
}

/** A crop of the HD front painting, fractions of its outline [fx0, fy0, fx1, fy1] (default all of it), and its size in
    tiles. */
export function crop(K, L, box = [0, 0, 1, 1]) {
  const o = outline(K), hd = L.HD, [a, b, c, d] = box;
  const x = o.x0 + a * (o.x1 - o.x0), y = o.y0 + b * (o.y1 - o.y0), w = (c - a) * (o.x1 - o.x0), h = (d - b) * (o.y1 - o.y0);
  const canvas = keep(`${idOf(K)}|crop|${box}`, () => {
    const art = K.p.art(0, hd, true), out = new OffscreenCanvas(Math.max(1, Math.round(w * hd)), Math.max(1, Math.round(h * hd)));
    out.getContext('2d').drawImage(art, x * hd, y * hd, w * hd, h * hd, 0, 0, out.width, out.height);
    return out;
  });
  return { canvas, w: w * L.U, h: h * L.U, x: (x + w / 2) * L.U - o.w * L.U / 2, y: (o.h - y - h / 2) * L.U };
}

/** The painting's outline in tiles: its width, height (its feet at 0) and middle. */
export function size(K, L) {
  const o = outline(K);
  return { w: (o.x1 - o.x0) * L.U, h: (o.h - o.y0) * L.U, cx: ((o.x0 + o.x1) / 2 - o.w / 2) * L.U, foot: (o.h - o.y1) * L.U };
}

/** Puts a crop of the front painting flat on a face at depth z: lit like a screen with `lit`. */
export function face(K, L, box, z, { lit = 0, dx = 0, dy = 0 } = {}) {
  const c = crop(K, L, box), geo = new L.THREE.PlaneGeometry(c.w, c.h);
  K.put(geo, lit ? L.litPic(c.canvas, lit) : K.pic(c.canvas), c.x + dx, c.y + dy, z);
  return c;
}

/**
 * A box the size of the painting's outline, `d` tiles deep (shape `d`, default 0.62), the painting on its front, the
 * rest the colour of the painting's own left edge (`side` [fx, fy] to read it elsewhere), its top the colour at the
 * painting's top. `top` (a fraction of the outline from its top) ends the box lower: the painting above it is stood up
 * as a cut-out on top, for a thing sitting on the box. `plinth` darkens a strip at the foot.
 */
export function frontbox(K, s, W, D, L) {
  const { rbox } = L, d = s.d ?? 0.62, sz = size(K, L), cut = s.top ?? 0;
  const sideHex = s.side ? colourAt(K, ...s.side) : columnColour(K, 0.1, cut + 0.05, 0.95), topHex = s.topColour ? colourAt(K, ...s.topColour) : colourAt(K, 0.5, cut + 0.015);
  const body = K.gloss(sideHex), h0 = sz.foot, h1 = sz.foot + (sz.h - sz.foot) * (1 - cut), z = 0;
  const bh = h1 - h0, r = Math.min(0.03, bh / 6, sz.w / 8);
  K.put(rbox(sz.w, bh, d, r), body, sz.cx, h0 + bh / 2, z);
  K.put(rbox(sz.w - 0.02, 0.012, d - 0.02, 0.004), K.gloss(topHex), sz.cx, h1 - 0.004, z);
  if (s.plinth) K.put(rbox(sz.w - 0.02, s.plinth, d - 0.02, 0.01), K.plain(L.tone(sideHex, 0.45)), sz.cx, h0 + s.plinth / 2, z + 0.01);
  face(K, L, [0, cut, 1, 1], z + d / 2 + 0.002, { lit: s.lit || 0 });
  if (cut) {
    const up = crop(K, L, [0, 0, 1, cut]), geo = new L.THREE.PlaneGeometry(up.w, up.h);
    K.put(geo, L.decal(up.canvas), up.x, up.y, z + (s.upZ ?? 0) + 0.002);
    K.put(new L.THREE.PlaneGeometry(up.w, up.h), L.decal(up.canvas), up.x, up.y, z + (s.upZ ?? 0) - 0.002, Math.PI);
  }
}
