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
  const sideHex = s.side ? colourAt(K, ...s.side) : columnColour(K, 0.1, cut + 0.05, 0.95), topHex = s.topColour ? colourAt(K, ...s.topColour) : cut ? null : colourAt(K, 0.5, 0.015);
  const body = K.gloss(sideHex), lid = topHex || L.tone(sideHex, 0.85), h0 = sz.foot, h1 = sz.foot + (sz.h - sz.foot) * (1 - cut), z = 0;
  const bh = h1 - h0, r = Math.min(0.03, bh / 6, sz.w / 8);
  K.put(rbox(sz.w, bh, d, r), body, sz.cx, h0 + bh / 2, z);
  K.put(rbox(sz.w - 0.02, 0.012, d - 0.02, 0.004), K.gloss(lid), sz.cx, h1 - 0.004, z);
  if (s.plinth) K.put(rbox(sz.w - 0.02, s.plinth, d - 0.02, 0.01), K.plain(L.tone(sideHex, 0.45)), sz.cx, h0 + s.plinth / 2, z + 0.01);
  face(K, L, [0, cut, 1, 1], z + d / 2 + 0.002, { lit: s.lit || 0 });
  if (cut) {
    const at = { x: (f) => sz.cx - sz.w / 2 + f * sz.w, y: (f) => sz.h - f * (sz.h - sz.foot), top: h1, w: sz.w, d, side: sideHex };
    TOPS[s.on || K.p.fam](K, L, at);
  }
}

/* parts the batches share */
/** The top colour of a Poké Ball drawn in the theme, as js/base-furniture-rooms.js's `ballTop()`. */
export const ballTop = (K) => (K.pal.c === '#f4f4f0' ? K.pal.w : K.pal.c);

/** A Poké Ball of radius r at x, y, z, its button facing +z. */
export function pokeBall(K, L, x, y, z, r, top = ballTop(K)) {
  const { THREE } = L, dark = K.gloss('#26262e'), n = L.sides(r, 24), h = Math.max(4, Math.round(n * 10 / 24));
  K.put(new THREE.SphereGeometry(r, n, h, 0, Math.PI * 2, 0, Math.PI / 2), K.gloss(top), x, y, z);
  K.put(new THREE.SphereGeometry(r, n, h, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), K.gloss('#f6f6f2'), x, y, z);
  K.put(L.cyl(r * 1.01, r * 0.16, r * 1.01, 24), dark, x, y, z);
  K.put(L.cyl(r * 0.34, r * 0.2, r * 0.34, 18).rotateX(Math.PI / 2), dark, x, y, z + r * 0.92);
  K.put(L.cyl(r * 0.22, r * 0.12, r * 0.22, 18).rotateX(Math.PI / 2), K.gloss('#f6f6f2'), x, y, z + r * 1.02);
}

/** A tube along points [[x, y, z]...], radius r. */
export const tube = (L, pts, r, seg = 40) => new L.THREE.TubeGeometry(new L.THREE.CatmullRomCurve3(pts.map(p => new L.THREE.Vector3(...p))), seg, r, r < 0.03 ? 6 : r < 0.06 ? 8 : 10, false);

/** A rod from a to b ([x, y, z] each), radius r. */
export function rod(K, L, m, a, b, r) {
  const { THREE } = L, va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb);
  const g = L.cyl(r, len, r, 12);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  K.put(g, m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}

/* What stands on a frontbox, modelled (2026-10-12, the user's ask: no paper cut-outs). Each is placed by where it is in
   the painting: `at.x(f)` / `at.y(f)` turn fractions of the outline (0, 0 its top left) into tiles, `at.top` is the
   box's top, `at.d` its depth. */
const GOLD = '#d8b048';
export const TOPS = {
  fireplace(K, L, at) {
    const { rbox, cyl, lathe, ball } = L;
    K.put(rbox(at.w + 0.06, 0.06, at.d + 0.08, 0.015), K.wood(colourAt(K, 0.5, 0.17)), at.x(0.5), at.top + 0.03, 0.02);
    const y = at.top + 0.06;
    K.put(lathe([[0.05, 0], [0.03, 0.03], [0.045, 0.06], [0, 0.06]], 16), K.metal(GOLD), at.x(0.15), y, 0);
    K.put(ball(0.045, 16, 12), K.metal(GOLD), at.x(0.15), y + 0.1, 0);
    K.put(rbox(0.16, 0.12, 0.025, 0.008), K.wood('#c89a60'), at.x(0.36), y + 0.06, -0.04, 0, -0.15);
    K.put(new L.THREE.PlaneGeometry(0.12, 0.08), K.gloss('#9ad0f0'), at.x(0.36), y + 0.065, -0.026, 0, -0.15);
    K.put(cyl(0.035, 0.2, 0.035, 14), K.gloss(colourAt(K, 0.83, 0.05)), at.x(0.83), y + 0.1, 0);
    K.put(cyl(0.004, 0.03, 0.004, 6), K.plain('#2a2a2a'), at.x(0.83), y + 0.215, 0);
  },
  sink(K, L, at) {
    const { rbox, cyl, torus, ball } = L;
    const steel = K.metal('#c8ccd4'), y = at.top;
    K.put(rbox(at.w + 0.04, 0.05, at.d + 0.04, 0.012), K.gloss(colourAt(K, 0.5, 0.17)), at.x(0.5), y + 0.025, 0);
    K.put(L.lathe([[0.17, 0.051], [0.16, 0.02], [0.12, 0.0], [0, 0.0]], 28).scale(1, 1, 0.7), K.metal('#a8b0bc'), at.x(0.5), y + 0.002, 0.04);
    K.put(torus(0.17, 0.01, Math.PI * 2, 28).scale(1, 0.7, 1), steel, at.x(0.5), y + 0.052, 0.04, 0, Math.PI / 2);
    K.put(cyl(0.022, 0.2, 0.022, 12), steel, at.x(0.5), y + 0.15, -at.d / 2 + 0.09);
    K.put(cyl(0.018, 0.16, 0.018, 12).rotateX(Math.PI / 2), steel, at.x(0.5), y + 0.24, -at.d / 2 + 0.16);
    K.put(cyl(0.018, 0.04, 0.02, 12), steel, at.x(0.5), y + 0.22, -at.d / 2 + 0.235);
    for (const sg of [-1, 1]) { K.put(cyl(0.012, 0.05, 0.012, 8), steel, at.x(0.5) + sg * 0.12, y + 0.075, -at.d / 2 + 0.09); K.put(ball(0.03, 12, 10), K.gloss('#3a3a44'), at.x(0.5) + sg * 0.12, y + 0.11, -at.d / 2 + 0.09); }
  },
  grandclock(K, L, at) {
    const w = at.w, t = at.d, wood = K.wood(colourAt(K, 0.5, 0.08));
    K.put(L.profileSlab([[-w / 2, 0], [w / 2, 0], [0, at.y(0) - at.top]], t * 0.9, -t * 0.45).rotateY(Math.PI / 2), wood, at.x(0.5), at.top, 0);
    K.put(L.ball(0.03, 12, 10), K.metal(GOLD), at.x(0.5), at.y(0) + 0.01, 0);
  },
  watercooler(K, L, at) {
    const { lathe, cyl } = L;
    const blue = colourAt(K, 0.5, 0.15), y = at.top;
    K.put(cyl(0.07, 0.05, 0.09, 18), K.gloss('#e8eef4'), at.x(0.5), y + 0.025, 0);
    const r = (at.x(0.92) - at.x(0.08)) / 2, H = at.y(0) - y - 0.05;
    const jug = lathe([[0.035, 0], [0.045, H * 0.12], [r * 0.95, H * 0.2], [r, H * 0.28], [r, H * 0.94], [r * 0.9, H], [0, H]], 28);
    jug.translate(0, 0.05, 0);
    K.put(jug, K.M('glass', blue, { key: 'jug' }), at.x(0.5), y, 0);
    const water = lathe([[0.03, 0], [0.04, H * 0.12], [r * 0.9, H * 0.21], [r * 0.93, H * 0.28], [r * 0.93, H * 0.8], [0, H * 0.8]], 24);
    water.translate(0, 0.05, 0);
    K.put(water, K.gloss(blue), at.x(0.5), y, 0);
  },
  milkcrate(K, L, at) {
    const { lathe, cyl } = L;
    const cap = colourAt(K, 0.13, 0.07), band = colourAt(K, 0.13, 0.4);
    for (let i = 0; i < 4; i++) for (const z of [-0.1, 0.1]) {
      const x = at.x(0.12 + i * 0.25);
      K.put(lathe([[0.045, 0], [0.048, 0.01], [0.048, 0.22], [0.03, 0.28], [0.024, 0.32], [0, 0.32]], 16), K.gloss('#f6f6f0'), x, at.top, z);
      K.put(cyl(0.049, 0.05, 0.049, 16), K.gloss(band), x, at.top + 0.1, z);
      K.put(cyl(0.027, 0.03, 0.027, 12), K.gloss(cap), x, at.top + 0.335, z);
    }
  },
  register(K, L, at) {
    const { rbox } = L, dark = K.gloss(colourAt(K, 0.15, 0.24)), y = at.top;
    K.put(rbox(0.7, 0.12, 0.42, 0.03), dark, at.x(0.5), y + 0.06, 0.02);
    K.put(rbox(0.7, 0.14, 0.24, 0.03).rotateX(-0.35), dark, at.x(0.5), y + 0.16, -0.05);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) K.put(rbox(0.09, 0.03, 0.06, 0.01), K.gloss('#e8e8ee'), at.x(0.2 + c * 0.2), y + 0.21 - r * 0.03, -0.02 + r * 0.075, 0, -0.35);
    K.put(L.ball(0.03, 12, 10), K.gloss('#f0c030'), at.x(0.9), y + 0.2, 0.02);
    K.put(rbox(0.04, 0.12, 0.04, 0.01), dark, at.x(0.5), y + 0.28, -0.12);
    K.put(rbox(0.46, 0.18, 0.06, 0.02), dark, at.x(0.5), y + 0.4, -0.12, 0, -0.1);
    K.put(new L.THREE.PlaneGeometry(0.38, 0.11), K.glow('#58e080'), at.x(0.5), y + 0.4, -0.087, 0, -0.1);
  },
  cooler(K, L, at) {
    const { rbox } = L, lid = K.gloss(colourAt(K, 0.5, 0.25)), grey = K.gloss('#8a8e98');
    K.put(rbox(at.w + 0.02, 0.08, at.d + 0.02, 0.03), lid, at.x(0.5), at.top + 0.04, 0);
    for (const sg of [-1, 1]) K.put(rbox(0.04, 0.12, 0.05, 0.012), grey, at.x(0.5) + sg * 0.17, at.top + 0.12, 0);
    K.put(rbox(0.38, 0.04, 0.05, 0.015), grey, at.x(0.5), at.top + 0.17, 0);
  },
  organ(K, L, at) {
    const { cyl, rbox, lathe, ball } = L;
    const gold = K.metal(colourAt(K, 0.5, 0.2)), dark = K.plain('#2a2018'), y = at.top;
    K.put(rbox(at.w - 0.1, 0.06, 0.22, 0.015), K.wood(at.side), at.x(0.5), y + 0.03, -at.d / 2 + 0.16);
    const tall = [0.42, 0.62, 0.8, 0.94, 1, 0.94, 0.8, 0.62, 0.42], H = at.y(0) - y - 0.06;
    tall.forEach((t, i) => {
      const x = at.x(0.07 + i * 0.86 / 8), h = H * t;
      K.put(cyl(0.045, h, 0.045, 18), gold, x, y + 0.06 + h / 2, -at.d / 2 + 0.16);
      K.put(rbox(0.05, 0.035, 0.02, 0.006), dark, x, y + 0.13, -at.d / 2 + 0.205);
      K.put(lathe([[0.045, 0], [0.03, 0.04], [0.012, 0.06], [0, 0.06]], 14), gold, x, y + 0.06 - 0.06, -at.d / 2 + 0.16);
    });
    for (const f of [0.05, 0.95]) K.put(ball(0.04, 12, 10), K.gloss(colourAt(K, f, 0.83)), at.x(f), y + 0.12, -at.d / 2 + 0.24);
  },
  minifridge(K, L, at) {
    const { lathe, cyl } = L, terra = K.gloss(colourAt(K, 0.48, 0.28)), leaf = K.gloss(colourAt(K, 0.45, 0.1));
    K.put(lathe([[0.06, 0], [0.08, 0.13], [0.086, 0.14], [0.086, 0.16], [0, 0.16]], 20), terra, at.x(0.5), at.top, 0);
    K.put(cyl(0.075, 0.01, 0.075, 18), K.plain('#4a3020'), at.x(0.5), at.top + 0.16, 0);
    for (let i = 0; i < 9; i++) K.put(L.ball(0.06, 12, 10), leaf, at.x(0.5) + Math.cos(i * 2.4) * 0.06 * (i % 3 ? 1 : 0.3), at.top + 0.22 + (i % 3) * 0.04, Math.sin(i * 2.4) * 0.06);
  },
  shredder(K, L, at) {
    const { rbox } = L, y = at.top;
    K.put(rbox(at.w, 0.08, at.d, 0.02), K.gloss(colourAt(K, 0.5, 0.18)), at.x(0.5), y + 0.04, 0);
    K.put(rbox(at.w - 0.12, 0.012, 0.04, 0.004), K.plain('#1a1a20'), at.x(0.5), y + 0.081, 0);
    K.put(rbox(0.32, 0.2, 0.01, 0.002), K.plain('#f8f8f4'), at.x(0.5), y + 0.16, 0);
    for (let i = 0; i < 3; i++) K.put(rbox(0.22, 0.012, 0.004, 0.001), K.plain('#9aa0b0'), at.x(0.5), y + 0.2 - i * 0.04, 0.007);
    K.put(L.ball(0.016, 8, 6), K.glow('#58e080'), at.x(0.9), y + 0.06, at.d / 2);
  },
  espresso(K, L, at) {
    const { rbox, cyl, lathe } = L, y = at.top, body = K.gloss(colourAt(K, 0.5, 0.4)), steel = K.metal('#c8ccd4');
    K.put(rbox(at.w + 0.02, 0.04, at.d + 0.02, 0.01), K.gloss(colourAt(K, 0.5, 0.45)), at.x(0.5), y + 0.02, 0);
    K.put(rbox(0.66, 0.5, 0.4, 0.04), body, at.x(0.5), y + 0.31, -0.04);
    K.put(rbox(0.5, 0.1, 0.1, 0.02), body, at.x(0.5), y + 0.4, 0.2);
    for (const f of [0.38, 0.62]) {
      K.put(cyl(0.04, 0.08, 0.04, 14), steel, at.x(f), y + 0.31, 0.2);
      K.put(lathe([[0.03, 0], [0.04, 0.07], [0, 0.07]], 14), K.gloss('#f6f2ea'), at.x(f), y + 0.04, 0.18);
    }
    K.put(cyl(0.06, 0.06, 0.06, 20).rotateX(Math.PI / 2), K.gloss('#f6f2ea'), at.x(0.5), y + 0.48, 0.17);
    K.put(cyl(0.008, 0.04, 0.008, 6).rotateZ(-0.6), K.plain('#c83a3a'), at.x(0.5), y + 0.48, 0.21);
    for (const f of [0.25, 0.5, 0.75]) K.put(cyl(0.06, 0.14, 0.06, 16), K.gloss(colourAt(K, 0.33, 0.03)), at.x(f), y + 0.63, -0.08);
  },
  sciencebench(K, L, at) {
    const { rbox, cyl, lathe } = L, y = at.top + 0.012;
    K.put(rbox(at.w + 0.04, 0.05, at.d + 0.04, 0.012), K.gloss('#2a2c32'), at.x(0.5), at.top + 0.025, 0);
    K.put(lathe([[0.1, 0], [0.1, 0.01], [0.03, 0.17], [0.03, 0.22], [0, 0.22]], 24), K.M('glass', '#58e0a0', { key: 'flask' }), at.x(0.16), y + 0.04, 0);
    K.put(lathe([[0.085, 0], [0.025, 0.13], [0, 0.13]], 20), K.gloss('#58e0a0'), at.x(0.16), y + 0.045, 0);
    K.put(rbox(0.3, 0.05, 0.12, 0.01), K.gloss('#5a5a68'), at.x(0.4), y + 0.065, 0);
    ['#e85a5a', '#5a8ae8', '#e8c040', '#a060d0'].forEach((c, i) => {
      K.put(cyl(0.022, 0.26, 0.022, 10), K.M('glass', '#dff', { key: 'tube' }), at.x(0.32 + i * 0.055), y + 0.16, 0);
      K.put(cyl(0.02, 0.12, 0.02, 10), K.gloss(c), at.x(0.32 + i * 0.055), y + 0.1, 0);
    });
    K.put(cyl(0.09, 0.2, 0.09, 20), K.M('glass', '#fde', { key: 'beaker' }), at.x(0.79), y + 0.14, 0.02);
    K.put(cyl(0.085, 0.11, 0.085, 20), K.gloss('#f490b8'), at.x(0.79), y + 0.1, 0.02);
  },
  prizecounter(K, L, at) {
    const { rbox, ball, blob } = L, y = at.top, fur = K.cloth('#a8703a'), pale = K.cloth('#e8c898');
    K.put(rbox(at.w + 0.04, 0.05, at.d + 0.04, 0.015), K.wood(colourAt(K, 0.5, 0.33)), at.x(0.5), y + 0.025, 0);
    const bx = at.x(0.22), by = y + 0.05, S = 1.5;
    K.put(blob(0.26 * S, 0.24 * S, 0.2 * S, 0.8, 0.8), fur, bx, by + 0.12 * S, 0);
    K.put(ball(0.13 * S, 18, 14), fur, bx, by + 0.32 * S, 0.02);
    for (const sg of [-1, 1]) { K.put(ball(0.05 * S, 12, 10), fur, bx + sg * 0.1 * S, by + 0.43 * S, 0.01); K.put(ball(0.05 * S, 12, 10).scale(1.2, 0.8, 0.7), fur, bx + sg * 0.12 * S, by + 0.04 * S, 0.08 * S); }
    K.put(ball(0.05 * S, 12, 10).scale(1, 0.8, 0.8), pale, bx, by + 0.3 * S, 0.13 * S);
    for (const sg of [-1, 1]) K.put(ball(0.016 * S, 8, 6), K.gloss('#202028'), bx + sg * 0.05 * S, by + 0.35 * S, 0.13 * S);
    K.put(rbox(0.38, 0.26, 0.03, 0.02), K.gloss('#f0e0b0'), at.x(0.75), y + 0.2, 0, 0, -0.1);
    K.put(rbox(0.3, 0.17, 0.01, 0.01), K.gloss('#e84848'), at.x(0.75), y + 0.2, 0.018, 0, -0.1);
    for (let i = 0; i < 4; i++) K.put(rbox(0.015, 0.02, 0.01, 0.003), K.plain('#ffffff'), at.x(0.75), y + 0.26 - i * 0.04, 0.026, 0, -0.1);
  },
  navdesk(K, L, at) {
    const { rbox } = L, y = at.top, dark = K.gloss(L.tone(at.side, 1.1));
    K.put(rbox(at.w, 0.1, at.d + 0.1, 0.02).rotateX(0.35), dark, at.x(0.5), y + 0.05, 0.08);
    for (let i = 0; i < 12; i++) K.put(L.ball(0.022, 10, 8), K.glow(colourAt(K, 0.08 + i * 0.077, 0.47)), at.x(0.08 + i * 0.077), y + 0.1, 0.13);
    for (const f of [0.25, 0.75]) {
      K.put(rbox(0.08, 0.1, 0.06, 0.01), dark, at.x(f), y + 0.15, -0.16);
      K.put(rbox(0.66, 0.5, 0.06, 0.02), K.gloss('#1a1c22'), at.x(f), y + 0.45, -0.16);
      const c = crop(K, L, [f - 0.24, 0.02, f + 0.24, 0.3]);
      K.put(new L.THREE.PlaneGeometry(0.58, 0.42), L.litPic(c.canvas, 0.7), at.x(f), y + 0.45, -0.128);
    }
  },
};
const crate = (fruit) => (K, L, at) => {
  const R = K.r, y = at.top - 0.04;
  for (let i = 0; i < 14; i++) fruit(K, L, at.x(0.12 + (i % 5) * 0.19), y + (i > 9 ? 0.09 : 0), -0.14 + Math.floor(i / 5) % 3 * 0.14, R, i);
};
Object.assign(TOPS, {
  applecrate: crate((K, L, x, y, z, R) => { K.put(L.ball(0.085, 16, 12), K.gloss('#d83030'), x, y + 0.08, z); K.put(L.cyl(0.006, 0.05, 0.006, 6), K.wood('#6a4a2a'), x, y + 0.17, z); }),
  potatocrate: crate((K, L, x, y, z, R, i) => K.put(L.ball(0.085, 14, 10).scale(1.2, 0.8, 0.9), K.plain('#c89a60'), x, y + 0.07, z, i)),
  cabbagecrate: crate((K, L, x, y, z, R, i) => { if (i % 2) return; K.put(L.ball(0.12, 16, 12), K.cloth('#88c060'), x, y + 0.1, z); K.put(L.ball(0.13, 12, 10).scale(1, 0.6, 1), K.cloth('#a8d880'), x, y + 0.05, z); }),
  carrotcrate: crate((K, L, x, y, z, R, i) => {
    K.put(L.lathe([[0, 0], [0.03, 0.08], [0.04, 0.18], [0, 0.19]], 12), K.gloss('#f08020'), x, y, z);
    for (let k = 0; k < 3; k++) K.put(L.cyl(0.008, 0.14, 0.004, 6).translate(0, 0.07, 0).rotateZ((k - 1) * 0.35), K.gloss('#4aa838'), x, y + 0.18, z);
  }),
  corncrate: crate((K, L, x, y, z, R, i) => {
    K.put(L.ball(0.045, 12, 10).scale(1, 2.6, 1), K.gloss('#f0c830'), x, y + 0.14, z);
    for (const a of [-0.25, 0.25]) K.put(L.ball(0.05, 10, 8).scale(0.6, 2.8, 0.9).rotateZ(a), K.gloss('#78b048'), x, y + 0.14, z);
  }),
});
