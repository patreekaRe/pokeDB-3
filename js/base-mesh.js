/* base-mesh.js  -  the Secret Base's furniture as real 3D models (the user's ask, 2026-10-09: carved and flat-topped pieces
   looked blocky, some had no side and some didn't turn). `furnitureModel()` gives any catalogue piece as a Three group in
   tiles, its feet at y 0, its middle at x, z 0, its front facing +z:
   - a kind with a shape (js/base-shapes.js) is modelled from parts: rounded boxes, plump superellipsoid cushions, lathed
     pots and legs, in its theme's colours, with a wood grain or a cloth weave; a flat kind's painting goes on its top (a
     table's cloth, a bed's quilt, a cushion's face), and a `thing` on a desk or counter is its painting, puffed up;
   - a round piece painted the same from every side is turned on a lathe from its silhouette, front and back wearing
     their paintings; one that isn't a solid of turning (a plant's leaves, a doll) is puffed up from its painting like a
     plush (an inflated sprite: the height over each pixel solves Poisson's equation inside its outline), so it has depth
     and turns with the piece, where it used to stand as a flat picture facing the camera;
   - anything else is carved from its paintings as before (js/base-model.js).
   Parts sharing a material are merged into one mesh, so a sofa is a few draw calls. Shared textures (the grain, the
   weave) are marked `keep` so js/hd2d.js's dispose() leaves them for the next room. */

import { tex } from './hd2d.js';
import { HD, FT } from './base-paint.js';
import { pieceModel, filled, mirror } from './base-model.js';
import { shapeOf } from './base-shapes.js';
import { PIECES } from './base-furniture.js';
import { PLUSH } from './base-dolls.js';
import { sewPlush } from './base-plush3d.js';

let THREE = null;
const U = 1 / FT;   // a painted unit, in tiles
const SOLID = 128;

/* ---------- helpers ---------- */

function rng(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
const tone = (hex, f) => {
  const c = new THREE.Color(hex);
  if (f <= 1) c.multiplyScalar(f); else c.lerp(new THREE.Color('#ffffff'), Math.min(1, f - 1));
  return '#' + c.getHexString();
};
const mix = (a, b, f) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), f).getHexString();

/* ---------- shared textures ---------- */

const shared = {};
function canvasTex(c, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.userData.keep = true;
  return t;
}
/** A pale wood grain, multiplied by each piece's wood colour. */
function grain() {
  if (shared.grain) return shared.grain;
  const c = new OffscreenCanvas(256, 256), g = c.getContext('2d'), r = rng('grain');
  g.fillStyle = '#e6e6e6'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) {
    const y0 = r() * 256, amp = 2 + r() * 5, ph = r() * 6, dark = r() < 0.7;
    g.strokeStyle = dark ? `rgba(90,90,90,${0.08 + r() * 0.16})` : `rgba(255,255,255,${0.1 + r() * 0.2})`;
    g.lineWidth = 0.6 + r() * 2.2;
    g.beginPath();
    for (let x = -8; x <= 264; x += 8) g.lineTo(x, y0 + Math.sin(x / 38 + ph) * amp + Math.sin(x / 11 + ph * 2) * 0.8);
    g.stroke();
  }
  for (let i = 0; i < 6; i++) {   // a knot or two
    const x = r() * 256, y = r() * 256;
    for (let k = 5; k > 0; k--) { g.strokeStyle = `rgba(80,80,80,${0.08})`; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, k * 3, k * 1.2, 0, 0, 7); g.stroke(); }
  }
  return (shared.grain = canvasTex(c));
}
/** A soft cloth weave. */
function weave() {
  if (shared.weave) return shared.weave;
  const c = new OffscreenCanvas(128, 128), g = c.getContext('2d'), r = rng('weave');
  g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 2) { g.fillStyle = `rgba(0,0,0,${0.035 + r() * 0.03})`; g.fillRect(0, y, 128, 1); }
  for (let x = 0; x < 128; x += 2) { g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.03})`; g.fillRect(x, 0, 1, 128); }
  for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.07)'; g.fillRect(r() * 128, r() * 128, 1, 1); }
  return (shared.weave = canvasTex(c));
}

/* ---------- geometry ---------- */

/** A box with rounded edges (three.js's RoundedBoxGeometry's trick: only the middle segment of each face stays flat). */
function rbox(w, h, d, r = 0.03, seg = 2) {
  r = Math.max(0.002, Math.min(r, w / 2, h / 2, d / 2) - 1e-4);
  const n = seg * 2 + 1, g = new THREE.BoxGeometry(1, 1, 1, n, n, n).toNonIndexed();
  const pos = g.attributes.position, nor = g.attributes.normal, half = 0.5 / n, v = new THREE.Vector3();
  const bx = w / 2 - r, by = h / 2 - r, bz = d / 2 - r;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    v.set(x - Math.sign(x) * half, y - Math.sign(y) * half, z - Math.sign(z) * half).normalize();
    pos.setXYZ(i, bx * Math.sign(x) + v.x * r, by * Math.sign(y) + v.y * r, bz * Math.sign(z) + v.z * r);
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

/** Normals averaged over vertices in the same place, so a sphere's seam and poles don't crease. */
function weld(g) {
  const pos = g.attributes.position, nor = g.attributes.normal, acc = new Map();
  const key = (i) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i), a = acc.get(k) || [0, 0, 0];
    a[0] += nor.getX(i); a[1] += nor.getY(i); a[2] += nor.getZ(i);
    acc.set(k, a);
  }
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = acc.get(key(i)), l = Math.hypot(x, y, z) || 1;
    nor.setXYZ(i, x / l, y / l, z / l);
  }
  return g;
}

/** A superellipsoid: e (round) 1 is a sphere's sides, near 0 a box's; ev the same up and down. Cushions, mattresses,
    arms, beanbags, clouds. */
function blob(w, h, d, e = 0.45, ev = 0.5) {
  const g = new THREE.SphereGeometry(1, 32, 20), pos = g.attributes.position;
  const sp = (v, k) => Math.sign(v) * Math.pow(Math.abs(v), k);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), c = Math.hypot(x, z);
    const cr = Math.pow(c, ev), ux = c > 1e-6 ? x / c : 0, uz = c > 1e-6 ? z / c : 0;
    pos.setXYZ(i, w / 2 * cr * sp(ux, e), h / 2 * sp(y, ev), d / 2 * cr * sp(uz, e));
  }
  g.computeVertexNormals();
  return weld(g);
}

const cyl = (rt, h, rb = rt, seg = 20, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const ball = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);
const lathe = (pts, seg = 28) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y)), seg);
const torus = (R, r, arc = Math.PI * 2, seg = 28) => new THREE.TorusGeometry(R, r, 10, seg, arc);

/** A heart, extruded with rounded edges, `s` across, `t` thick, lying in the x-y plane. */
function heart(s, t) {
  const sh = new THREE.Shape(), k = s / 2;
  sh.moveTo(0, -k * 0.9);
  sh.bezierCurveTo(-k * 0.2, -k * 0.6, -k, -k * 0.2, -k, k * 0.25);
  sh.bezierCurveTo(-k, k * 0.75, -k * 0.35, k * 0.95, 0, k * 0.55);
  sh.bezierCurveTo(k * 0.35, k * 0.95, k, k * 0.75, k, k * 0.25);
  sh.bezierCurveTo(k, -k * 0.2, k * 0.2, -k * 0.6, 0, -k * 0.9);
  const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: t * 0.4, bevelSize: t * 0.4, bevelSegments: 3, curveSegments: 16 });
  g.translate(0, 0, -t / 2);
  return g;
}

/** Uvs from the world position along the face's main axis, `k` repeats a tile, so a grain runs the same on every part. */
function worldUV(g, k) {
  const pos = g.attributes.position, nor = g.attributes.normal;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (ny >= nx && ny >= nz) uv.setXY(i, x * k, z * k);
    else if (nx >= nz) uv.setXY(i, z * k, y * k * 0.25);
    else uv.setXY(i, x * k, y * k * 0.25);
  }
}

/** Uvs looking straight down on a W x D footprint: a flat piece's painting laid over its top. */
function topUV(g, W, D) {
  const pos = g.attributes.position;
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + W / 2) / W, 1 - (pos.getZ(i) + D / 2) / D);
}

/** Geometries merged into one, unindexed, with position, normal and uv. */
function merge(geos) {
  const parts = geos.map(g => g.index ? g.toNonIndexed() : g);
  const n = parts.reduce((s, g) => s + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let at = 0;
  for (const g of parts) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, at * 3);
    nor.set(g.attributes.normal.array, at * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, at * 2);
    at += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}

/* ---------- a model's parts and materials ---------- */

/** What a builder draws with: `put(geometry, material, x, y, z, turnY, tiltX, tiltZ)` and its materials. `paint(canvas)`
    is the caller's material for a painting (it adds a lamp's glow). */
function kit(id, paint) {
  const p = PIECES[id], pal = p.pal, bins = new Map(), made = new Map();
  const M = (kind, hex = '#ffffff', extra = {}) => {
    const key = kind + hex + (extra.key || '');
    if (made.has(key)) return made.get(key);
    const o = { color: hex, roughness: 0.7 };
    if (kind === 'wood') Object.assign(o, { map: grain(), roughness: 0.55 });
    if (kind === 'cloth') Object.assign(o, { map: weave(), roughness: 0.95 });
    if (kind === 'metal') Object.assign(o, { roughness: 0.3, metalness: 0.45 });
    if (kind === 'gloss') Object.assign(o, { roughness: 0.25 });
    if (kind === 'glass') Object.assign(o, { roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false });
    if (kind === 'glow') Object.assign(o, { emissive: hex, emissiveIntensity: 0.6, roughness: 0.6 });
    const m = new THREE.MeshStandardMaterial(o);
    m.userData.kind = kind;
    if (kind === 'glow') m.userData.lamp = true;
    made.set(key, m);
    return m;
  };
  const pics = new Map();
  const pic = (canvas) => {
    if (!pics.has(canvas)) { const m = paint(canvas); m.userData.kind = 'pic'; pics.set(canvas, m); }
    return pics.get(canvas);
  };
  const put = (geo, m, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) => {
    if (rx) geo.rotateX(rx);
    if (rz) geo.rotateZ(rz);
    if (ry) geo.rotateY(ry);
    geo.translate(x, y, z);
    if (m.userData.kind === 'wood') worldUV(geo, 1.4);
    else if (m.userData.kind === 'cloth') worldUV(geo, 3);
    if (!bins.has(m)) bins.set(m, []);
    bins.get(m).push(geo);
    return geo;
  };
  return {
    p, pal, M, pic, put, bins, r: rng(id),
    wood: (h = pal.w) => M('wood', h), cloth: (h = pal.c) => M('cloth', h), plain: (h) => M('plain', h),
    metal: (h = pal.m) => M('metal', h), gloss: (h) => M('gloss', h), glass: () => M('glass', '#cfe8f4'), glow: (h = pal.g) => M('glow', h),
  };
}

function assemble(K) {
  const g = new THREE.Group();
  for (const [m, geos] of K.bins) {
    const mesh = new THREE.Mesh(merge(geos), m);
    mesh.castShadow = m.userData.kind !== 'glass';
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  return g;
}

/* ---------- reading paintings ---------- */

const alphaOf = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
/** Each painted row's leftmost and rightmost solid pixel, from the floor up (row 0 the bottom), or null. */
function rowsOf(c) {
  const d = alphaOf(c), w = c.width, h = c.height, out = [];
  for (let j = 0; j < h; j++) {
    const y = h - 1 - j;
    let l = -1, r = -1, runs = 0, on = false;
    for (let i = 0; i < w; i++) {
      const a = d[(y * w + i) * 4 + 3] > SOLID;
      if (a) { if (l < 0) l = i; r = i + 1; if (!on) runs++; }
      on = a;
    }
    out.push(l < 0 ? null : { l, r, runs });
  }
  return out;
}

const recipes = new Map(), KEEP = 120;
function remember(key, make) {
  if (recipes.has(key)) { const v = recipes.get(key); recipes.delete(key); recipes.set(key, v); return v; }
  const v = make();
  recipes.set(key, v);
  if (recipes.size > KEEP) recipes.delete(recipes.keys().next().value);
  return v;
}

/** A painting's rows `rows` (from the floor, [j0, j1)) puffed up into a rounded solid: arrays for the front and back
    faces. Its depth at each pixel is 2·sqrt(u), u solving Δu = -1 inside the outline (a disc comes out a ball, a strip a
    sausage), eased off towards `maxZ` painted units each side. */
function puffArrays(art, j0, j1, maxZ) {
  const W = art.width, H = art.height, d = alphaOf(art);
  const y0 = H - j1, h = j1 - j0;
  let x0 = W, x1 = -1, t0 = h, t1 = -1;
  for (let j = 0; j < h; j++) for (let i = 0; i < W; i++) if (d[((y0 + j) * W + i) * 4 + 3] > SOLID) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); t0 = Math.min(t0, j); t1 = Math.max(t1, j); }
  if (x1 < 0) return null;
  const w = x1 - x0 + 1, rows = t1 - t0 + 1, top = y0 + t0;
  const inside = new Uint8Array((w + 2) * (rows + 2)), u = new Float32Array((w + 2) * (rows + 2)), at = (i, j) => (j + 1) * (w + 2) + i + 1;
  for (let j = 0; j < rows; j++) for (let i = 0; i < w; i++) if (d[((top + j) * W + x0 + i) * 4 + 3] > SOLID) inside[at(i, j)] = 1;
  const iters = Math.min(260, Math.max(60, Math.round(Math.max(w, rows) * 2.2)));
  for (let it = 0; it < iters; it++) for (let j = 0; j < rows; j++) for (let i = 0; i < w; i++) {
    const k = at(i, j);
    if (!inside[k]) continue;
    const g = (u[k - 1] + u[k + 1] + u[k - w - 2] + u[k + w + 2] + 1) / 4;
    u[k] += (g - u[k]) * 1.85;
  }
  // corner heights: 0 on the outline, else the cells round it, softened twice
  const cw = w + 1, ch = rows + 1, z = new Float32Array(cw * ch), edge = new Uint8Array(cw * ch);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const cells = [at(i - 1, j - 1), at(i, j - 1), at(i - 1, j), at(i, j)];
    if (cells.some(k => !inside[k])) { edge[j * cw + i] = 1; continue; }
    z[j * cw + i] = cells.reduce((s, k) => s + Math.sqrt(Math.max(0, u[k])), 0) / 4 * 2 * 0.8;
  }
  for (let pass = 0; pass < 2; pass++) {
    const was = z.slice();
    for (let j = 1; j < ch - 1; j++) for (let i = 1; i < cw - 1; i++) {
      const k = j * cw + i;
      if (!edge[k]) z[k] = (was[k] * 4 + was[k - 1] + was[k + 1] + was[k - cw] + was[k + cw]) / 8;
    }
  }
  for (let k = 0; k < z.length; k++) z[k] = maxZ * Math.tanh(z[k] / maxZ);
  const face = (back) => {
    const pos = [], uv = [], idx = [], id = new Int32Array(cw * ch).fill(-1);
    const vert = (i, j) => {
      const k = j * cw + i;
      if (id[k] >= 0) return id[k];
      const px = x0 + i, py = top + j;
      pos.push(px - W / 2, H - py, back ? -z[k] : z[k]);
      uv.push(back ? 1 - px / W : px / W, 1 - py / H);
      return (id[k] = pos.length / 3 - 1);
    };
    for (let j = 0; j < rows; j++) for (let i = 0; i < w; i++) {
      if (!inside[at(i, j)]) continue;
      const a = vert(i, j), b = vert(i + 1, j), c = vert(i + 1, j + 1), e = vert(i, j + 1);
      if (back) idx.push(a, c, e, a, b, c); else idx.push(a, e, c, a, c, b);
    }
    return { pos: new Float32Array(pos), uv: new Float32Array(uv), idx };
  };
  return { front: face(false), back: face(true) };
}

/** A painting turned on a lathe: rows [j0, j1) from the floor, each a ring as wide as the painted row (smoothed). Front
    half wears the front painting, back half the back one; normals from the silhouette's slope. */
function latheArrays(art, j0, j1, seg = 36) {
  const W = art.width, H = art.height, rows = rowsOf(art), cx = W / 2, prof = [];
  for (let j = j0; j < j1; j++) {
    const r = rows[j];
    if (r) prof.push([Math.max(cx - r.l, r.r - cx), j + 0.5]);
  }
  if (prof.length < 2) return null;
  for (let pass = 0; pass < 2; pass++) {
    const was = prof.map(p => p[0]);
    for (let k = 1; k < prof.length - 1; k++) prof[k][0] = (was[k - 1] + was[k] * 2 + was[k + 1]) / 4;
  }
  prof.unshift([prof[0][0], prof[0][1] - 0.5]);
  prof.push([prof.at(-1)[0] * 0.6, prof.at(-1)[1] + 0.4], [0, prof.at(-1)[1] + 0.5]);
  const n = prof.length, slope = prof.map((p, k) => {
    const a = prof[Math.max(0, k - 1)], b = prof[Math.min(n - 1, k + 1)];
    const dy = b[1] - a[1] || 1e-3, dr = b[0] - a[0], l = Math.hypot(dy, dr);
    return [dy / l, -dr / l];   // (radial, up)
  });
  const out = [0, 1].map(() => ({ pos: [], nor: [], uv: [] }));
  const vtx = (k, t, back) => {
    const [r, y] = prof[k], [nr, ny] = slope[k], s = Math.sin(t), c = Math.cos(t), x = r * s;
    const o = out[back ? 1 : 0];
    o.pos.push(x, y, r * c); o.nor.push(nr * s, ny, nr * c);
    o.uv.push(back ? (cx - x) / W : (cx + x) / W, y / H);
  };
  for (let k = 0; k < n - 1; k++) for (let a = 0; a < seg; a++) {
    const t0 = a / seg * Math.PI * 2, t1 = (a + 1) / seg * Math.PI * 2, back = Math.cos((t0 + t1) / 2) < 0;
    for (const [kk, tt] of [[k, t0], [k + 1, t1], [k + 1, t0], [k, t0], [k, t1], [k + 1, t1]]) vtx(kk, tt, back);
  }
  return out.map(o => ({ pos: new Float32Array(o.pos), nor: new Float32Array(o.nor), uv: new Float32Array(o.uv) }));
}

function geoFrom(a) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.pos.slice(), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(a.uv.slice(), 2));
  if (a.idx) { g.setIndex(a.idx); g.computeVertexNormals(); }
  else g.setAttribute('normal', new THREE.BufferAttribute(a.nor.slice(), 3));
  return g;
}

/** How a round piece is best made: its rows from the bottom that are one centred run turn on a lathe, the rest puffs. */
function roundPlan(art) {
  const rows = rowsOf(art), W = art.width;
  const painted = rows.flatMap((r, j) => r ? [j] : []);
  if (!painted.length) return null;
  const j0 = painted[0], j1 = painted.at(-1) + 1, N = j1 - j0;
  // a box fills its outline's bounding box: a cabinet does, a doll or a plant doesn't
  const d = alphaOf(art);
  let area = 0, x0 = W, x1 = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > SOLID) { area++; const x = (i >> 2) % W; x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1); }
  if (area >= (x1 - x0) * N * 0.82) return { boxy: true, j0, j1 };
  const turns = (r) => r && r.runs === 1 && Math.abs(r.l + r.r - W) <= 3;
  let k = j0;
  while (k < j1 && turns(rows[k])) k++;
  return { j0, j1, split: k - j0 >= N * 0.85 ? j1 : k - j0 >= Math.max(8, N * 0.25) ? k : j0 };
}

/* ---------- builders: one per `make` in js/base-shapes.js ---------- */

const B = {};

const legsAt = (W, D, inset) => [[-W / 2 + inset, -D / 2 + inset], [W / 2 - inset, -D / 2 + inset], [-W / 2 + inset, D / 2 - inset], [W / 2 - inset, D / 2 - inset]];

/** A tapered leg from the floor to `h`, or a turned one. */
function leg(K, m, x, z, h, r = 0.04, style) {
  if (style === 'turned') return K.put(lathe([[r * 0.8, 0], [r, h * 0.08], [r * 0.7, h * 0.3], [r * 1.25, h * 0.45], [r * 0.75, h * 0.62], [r * 1.1, h * 0.85], [r * 1.1, h]], 14), m, x, 0, z);
  return K.put(cyl(r, h, r * 0.72, 12), m, x, h / 2, z);
}

/* seats */

B.chair = (K, s, W, D) => {
  const sh = s.seat, wood = K.wood(), m = s.back === 'folding' ? K.metal(tone(K.pal.m, 1.4)) : wood, R = K.r;
  const legH = sh - 0.08, sw = W * 0.8, sd = D * 0.74;
  if (s.rockers) for (const x of [-sw / 2 + 0.06, sw / 2 - 0.06]) K.put(torus(1.6, 0.025, 0.6, 20), wood, x, 1.62, 0, Math.PI / 2, 0, -Math.PI / 2 - 0.3);
  const lift = s.rockers ? 0.06 : 0;
  for (const [x, z] of legsAt(sw, sd, 0.07)) leg(K, m, x, z, legH + 0.02 - lift, 0.035).translate(0, lift, 0);
  if (s.back !== 'folding') for (const z of [-sd / 2 + 0.07, sd / 2 - 0.07]) K.put(cyl(0.015, sw - 0.14, 0.015, 8), wood, 0, 0.16 + lift, z, 0, 0, Math.PI / 2);
  K.put(rbox(sw, 0.07, sd, 0.025), wood, 0, sh - 0.075, 0);
  K.put(blob(sw - 0.06, 0.1, sd - 0.06, 0.3, 0.5), K.cloth(), 0, sh - 0.015, 0.01);
  const bz = -sd / 2 + 0.05, by = sh - 0.04;
  const posts = (h, r = 0.032) => { for (const x of [-sw / 2 + 0.05, sw / 2 - 0.05]) K.put(cyl(r * 0.85, h, r, 12), m, x, by + h / 2, bz); };
  switch (s.back) {
    case 'ladder': posts(0.72); for (let i = 0; i < 3; i++) K.put(rbox(sw - 0.1, 0.07, 0.035, 0.015), wood, 0, by + 0.32 + i * 0.16, bz); break;
    case 'spindle':
      posts(0.74); K.put(rbox(sw, 0.1, 0.06, 0.03), wood, 0, by + 0.72, bz);
      for (let i = 0; i < 4; i++) K.put(cyl(0.014, 0.6, 0.018, 8), wood, -sw / 2 + 0.18 + i * (sw - 0.36) / 3, by + 0.38, bz);
      break;
    case 'slat':
      posts(0.74); K.put(rbox(sw, 0.09, 0.05, 0.025), wood, 0, by + 0.7, bz);
      for (let i = 0; i < 3; i++) K.put(rbox(0.09, 0.56, 0.03, 0.012), wood, -0.16 + i * 0.16, by + 0.38, bz);
      break;
    case 'round':
      posts(0.3);
      K.put(cyl(0.3, 0.06, 0.3, 32), K.cloth(), 0, by + 0.5, bz, 0, Math.PI / 2 - 0.08);
      K.put(torus(0.3, 0.03, Math.PI * 2, 32), wood, 0, by + 0.5, bz, 0, -0.08);
      break;
    case 'heart':
      posts(0.3);
      K.put(heart(0.62, 0.07), K.cloth(), 0, by + 0.52, bz, 0, -0.1);
      break;
    case 'ball': {
      posts(0.22);
      const y = by + 0.5;
      // the half disc on +z ends up facing down once stood upright: it's the white half
      K.put(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 32, 1, false, -Math.PI / 2, Math.PI), K.gloss('#f4f4f0'), 0, y - 0.02, bz, 0, Math.PI / 2 - 0.08);
      K.put(new THREE.CylinderGeometry(0.33, 0.33, 0.08, 32, 1, false, Math.PI / 2, Math.PI), K.gloss(K.pal.c), 0, y + 0.02, bz, 0, Math.PI / 2 - 0.08);
      K.put(rbox(0.68, 0.05, 0.085, 0.02), K.gloss('#303038'), 0, y, bz, 0, -0.08);
      K.put(cyl(0.085, 0.1, 0.085, 24), K.gloss('#303038'), 0, y, bz + 0.01, 0, Math.PI / 2 - 0.08);
      K.put(cyl(0.05, 0.11, 0.05, 24), K.gloss('#ffffff'), 0, y, bz + 0.015, 0, Math.PI / 2 - 0.08);
      break;
    }
    case 'folding':
      posts(0.66, 0.02);
      K.put(rbox(sw - 0.04, 0.3, 0.04, 0.02), K.cloth(), 0, by + 0.5, bz);
      for (const x of [-sw / 2 + 0.06, sw / 2 - 0.06]) K.put(cyl(0.018, 0.75, 0.018, 8), m, x, sh / 2, 0, 0, 0.5);
      break;
    case 'bentwood':
      posts(0.36, 0.025);
      K.put(torus(sw / 2 - 0.05, 0.03, Math.PI, 24), wood, 0, by + 0.36, bz, 0, -0.06);
      K.put(torus(sw / 2 - 0.16, 0.022, Math.PI, 24), wood, 0, by + 0.36, bz, 0, -0.06);
      break;
    case 'throne': {
      const gold = K.gloss(K.pal.a);
      K.put(rbox(sw + 0.06, 1.15, 0.12, 0.05), gold, 0, by + 0.58, bz - 0.02);
      K.put(blob(sw - 0.16, 0.95, 0.08, 0.3, 0.3), K.cloth(), 0, by + 0.56, bz + 0.05);
      for (const x of [-0.24, 0, 0.24]) {
        K.put(new THREE.ConeGeometry(0.06, 0.18, 12), gold, x, by + 1.24, bz - 0.02);
        K.put(ball(0.035), K.gloss('#e04848'), x, by + 1.35, bz - 0.02);
      }
      K.put(ball(0.06), K.gloss('#58a8f0'), 0, by + 1.02, bz + 0.06);
      break;
    }
    case 'captain':
      K.put(torus(sw / 2 - 0.02, 0.035, Math.PI * 1.1, 24), wood, 0, by + 0.42, 0, 0, -Math.PI / 2, Math.PI * -0.05);
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * (0.1 + i * 0.2);
        K.put(cyl(0.016, 0.4, 0.02, 8), wood, Math.cos(a) * (sw / 2 - 0.04), by + 0.22, -Math.sin(a) * (sw / 2 - 0.04) * 0.9);
      }
      break;
    default:   // classic: posts, a top rail and a padded back
      posts(0.74);
      K.put(rbox(sw, 0.12, 0.06, 0.03), wood, 0, by + 0.72, bz);
      K.put(rbox(sw - 0.1, 0.05, 0.04, 0.015), wood, 0, by + 0.18, bz);
      K.put(blob(sw - 0.2, 0.36, 0.07, 0.3, 0.4), K.cloth(), 0, by + 0.44, bz + 0.02);
  }
  if (s.arms && s.back !== 'captain') for (const x of [-sw / 2 + 0.03, sw / 2 - 0.03]) {
    K.put(rbox(0.07, 0.05, sd - 0.04, 0.02), s.back === 'throne' ? K.gloss(K.pal.a) : wood, x, sh + 0.25, 0.02);
    K.put(cyl(0.022, 0.26, 0.026, 8), wood, x, sh + 0.12, sd / 2 - 0.08);
  }
  if (s.tray) K.put(rbox(sw + 0.1, 0.04, 0.3, 0.02), K.gloss(K.pal.p), 0, sh + 0.24, sd / 2 + 0.06);
  if (s.back === 'throne') K.put(rbox(sw + 0.1, 0.06, sd + 0.04, 0.02), K.gloss(K.pal.a), 0, 0.03, 0);
};

B.swivel = (K, s) => {
  const sh = s.seat, dark = K.metal(tone(K.pal.m, 1.1));
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    K.put(rbox(0.32, 0.035, 0.05, 0.015), dark, Math.sin(a) * 0.16, 0.06, Math.cos(a) * 0.16, a + Math.PI / 2);
    K.put(ball(0.035), K.plain('#222228'), Math.sin(a) * 0.3, 0.035, Math.cos(a) * 0.3);
  }
  K.put(cyl(0.03, sh - 0.12, 0.035, 12), K.metal('#9aa0aa'), 0, (sh - 0.06) / 2 + 0.04, 0);
  K.put(blob(0.66, 0.13, 0.6, 0.35, 0.5), K.cloth(), 0, sh - 0.02, 0.02);
  K.put(blob(0.6, 0.66, 0.12, 0.4, 0.45), K.cloth(), 0, sh + 0.42, -0.27, 0, -0.12);
  for (const x of [-0.34, 0.34]) {
    K.put(rbox(0.05, 0.03, 0.34, 0.015), dark, x, sh + 0.2, 0.0);
    K.put(cyl(0.015, 0.2, 0.015, 8), dark, x, sh + 0.09, -0.04);
  }
};

B.stool = (K, s) => {
  const sh = s.seat, wood = K.wood(), r = s.low ? 0.24 : 0.25;
  const n = s.bar ? 4 : 3, spread = s.bar ? 0.2 : 0.18;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + 0.4, x = Math.sin(a) * spread, z = Math.cos(a) * spread;
    K.put(cyl(0.028, sh - 0.06, 0.034, 10), s.bar ? K.metal('#a8acb4') : wood, x, (sh - 0.06) / 2, z, 0, Math.cos(a) * 0.08, -Math.sin(a) * 0.08);
  }
  if (s.bar) K.put(torus(0.2, 0.016), K.metal('#a8acb4'), 0, 0.28, 0, 0, Math.PI / 2);
  K.put(cyl(r, 0.06, r, 28), wood, 0, sh - 0.07, 0);
  K.put(blob(r * 2 - 0.02, 0.1, r * 2 - 0.02, 1, 0.5), K.cloth(), 0, sh - 0.01, 0);
};

B.mushroom = (K, s) => {
  K.put(lathe([[0.14, 0], [0.12, 0.08], [0.1, 0.25], [0.11, s.seat - 0.08], [0, s.seat - 0.06]]), K.plain(tone(K.pal.p, 0.95)), 0, 0, 0);
  const cap = new THREE.SphereGeometry(0.34, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.scale(1, 0.5, 1);
  K.put(cap, K.gloss(K.pal.c), 0, s.seat - 0.12, 0);
  K.put(cyl(0.34, 0.03, 0.3, 28), K.plain(tone(K.pal.p, 0.9)), 0, s.seat - 0.125, 0);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, t = 0.35 + (i % 3) * 0.22, x = Math.sin(a) * 0.34 * Math.sin(t * 1.4), z = Math.cos(a) * 0.34 * Math.sin(t * 1.4);
    const y = s.seat - 0.12 + Math.cos(t * 1.4) * 0.17;
    K.put(ball(0.045, 10, 8).scale(1, 0.45, 1), K.plain('#ffffff'), x, y, z, 0, -Math.cos(a) * t * 1.2, Math.sin(a) * t * 1.2);
  }
};

B.stump = (K, s) => {
  const bark = K.wood(tone(K.pal.w, 0.7));
  K.put(lathe([[0.36, 0], [0.3, 0.06], [0.3, s.seat - 0.04], [0.28, s.seat]], 24), bark, 0, 0, 0);
  for (let i = 0; i < 3; i++) K.put(cyl(0.05, 0.14, 0.07, 8), bark, Math.sin(i * 2.1) * 0.3, 0.05, Math.cos(i * 2.1) * 0.3, 0, Math.cos(i * 2.1) * 0.9, -Math.sin(i * 2.1) * 0.9);
  K.put(cyl(0.28, 0.02, 0.28, 24), K.plain(tone(K.pal.w, 1.25)), 0, s.seat, 0);
  for (const r of [0.08, 0.15, 0.22]) K.put(torus(r, 0.006, Math.PI * 2, 24), K.plain(tone(K.pal.w, 0.9)), 0, s.seat + 0.01, 0, 0, Math.PI / 2);
};

B.pouf = (K, s) => {
  if (s.cloud) {
    const c = K.plain(tone(K.pal.p, 1)), R = K.r;
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; K.put(ball(0.17 + R() * 0.05), c, Math.sin(a) * 0.2, 0.2 + R() * 0.06, Math.cos(a) * 0.2); }
    K.put(ball(0.24), c, 0, 0.26, 0);
    return;
  }
  K.put(blob(0.68, s.seat, 0.68, 1, 0.55), K.cloth(), 0, s.seat / 2, 0);
  K.put(cyl(0.04, 0.03, 0.04, 12), K.cloth(tone(K.pal.c, 0.8)), 0, s.seat - 0.005, 0);
};

B.beanbag = (K, s) => {
  const c = K.cloth();
  K.put(blob(0.86, s.seat, 0.82, 1, 0.7), c, 0, s.seat / 2, 0.04);
  K.put(blob(0.7, 0.5, 0.36, 1, 0.8), c, 0, 0.42, -0.24, 0, -0.35);
};

/** Sofas, armchairs and booths: a base, plump seat and back cushions, arms. */
function couch(K, s, W, D, opts = {}) {
  const c = K.cloth(), cDark = K.cloth(tone(K.pal.c, 0.85)), wood = K.wood(), sh = s.seat;
  const armW = opts.armW ?? 0.2, inner = W - (s.booth ? 0.08 : armW * 2) - 0.04, n = Math.max(1, Math.round(inner / 0.8));
  if (s.cloud) {
    const p = K.plain(K.pal.p), R = K.r;
    for (let x = -W / 2 + 0.2; x <= W / 2 - 0.2; x += 0.22) {
      K.put(ball(0.2 + R() * 0.05), p, x, 0.22, 0.12 + R() * 0.05);
      K.put(ball(0.24 + R() * 0.05), p, x, 0.62 + R() * 0.08, -0.22);
    }
    for (const x of [-W / 2 + 0.16, W / 2 - 0.16]) K.put(ball(0.22), p, x, 0.45, 0.06);
    K.put(blob(W - 0.3, 0.16, D - 0.35, 0.4, 0.5), K.cloth(K.pal.c), 0, sh - 0.06, 0.08);
    return;
  }
  for (const [x, z] of legsAt(W - 0.1, D - 0.14, 0.06)) leg(K, wood, x, z, 0.1, 0.035);
  K.put(rbox(W - 0.04, 0.22, D - 0.1, 0.05), cDark, 0, 0.21, 0);
  const backH = s.booth ? 0.95 : opts.recline ? 0.8 : 0.6, bz = -D / 2 + 0.11;
  K.put(rbox(W - 0.04, backH, 0.18, 0.07), cDark, 0, 0.3 + backH / 2, bz);
  const cw = inner / n;
  for (let i = 0; i < n; i++) {
    const x = -inner / 2 + cw * (i + 0.5);
    K.put(blob(cw - 0.03, 0.17, D - 0.3, 0.35, 0.45), c, x, 0.39, 0.06);
    if (s.tufted) continue;
    K.put(blob(cw - 0.05, backH - 0.12, 0.2, 0.4, 0.45), c, x, 0.36 + backH / 2, bz + 0.15, 0, -0.14);
  }
  if (s.tufted) for (let i = 0; i < Math.round(inner / 0.16); i++) for (let j = 0; j < 3; j++) {
    K.put(ball(0.018, 8, 6), cDark, -inner / 2 + 0.08 + i * 0.16 + (j % 2) * 0.08, 0.5 + j * 0.13, bz + 0.095);
  }
  if (s.booth) return;
  for (const x of [-W / 2 + armW / 2 + 0.01, W / 2 - armW / 2 - 0.01]) {
    if (s.rolled || opts.wing) {
      K.put(rbox(armW, 0.4, D - 0.08, 0.06), c, x, 0.3, 0.0);
      K.put(cyl(armW * 0.62, D - 0.08, armW * 0.62, 20), c, x, 0.56, 0, 0, Math.PI / 2);
      K.put(cyl(armW * 0.5, 0.02, armW * 0.5, 20), cDark, x, 0.56, D / 2 - 0.035, 0, Math.PI / 2);
    } else K.put(blob(armW, 0.5, D - 0.08, 0.35, 0.4), c, x, 0.36, 0);
  }
  if (opts.wing) for (const x of [-W / 2 + 0.12, W / 2 - 0.12]) K.put(blob(0.12, 0.62, 0.36, 0.5, 0.5), c, x, 0.88, bz + 0.12);
  if (opts.recline) K.put(blob(W - 0.2, 0.14, 0.4, 0.4, 0.5), c, 0, 0.26, D / 2 + 0.1, 0, 0.3);
}
B.sofa = (K, s, W, D) => couch(K, s, W, D);
B.armchair = (K, s, W, D) => couch(K, s, W, D, { armW: s.wing ? 0.17 : 0.18, wing: s.wing, recline: s.recline });

B.bench = (K, s, W, D) => {
  const wood = K.wood(), metal = K.metal(tone(K.pal.m, 1.2)), sh = s.seat;
  if (s.padded) {
    for (const [x, z] of legsAt(W - 0.1, D - 0.4, 0.05)) leg(K, wood, x, z, sh - 0.12, 0.04, 'turned');
    K.put(rbox(W - 0.1, 0.06, D - 0.36, 0.02), wood, 0, sh - 0.12, 0);
    K.put(blob(W - 0.1, 0.13, D - 0.34, 0.3, 0.5), K.cloth(), 0, sh - 0.04, 0);
    return;
  }
  const sd = 0.5, legs = s.metal ? metal : wood;
  for (const x of [-W / 2 + 0.14, W / 2 - 0.14]) {
    K.put(rbox(0.06, sh - 0.06, sd - 0.06, 0.02), legs, x, (sh - 0.06) / 2, 0.02);
    if (s.back) K.put(rbox(0.05, 0.52, 0.05, 0.02), legs, x, sh + 0.24, -sd / 2 + 0.04, 0, -0.12);
  }
  const planks = s.slats ? 4 : 3;
  for (let i = 0; i < planks; i++) K.put(rbox(W - 0.06, 0.05, sd / planks - 0.02, 0.015), wood, 0, sh - 0.03, -sd / 2 + (i + 0.5) * sd / planks + 0.02);
  if (s.back) for (let i = 0; i < 2; i++) K.put(rbox(W - 0.06, 0.1, 0.035, 0.015), wood, 0, sh + 0.2 + i * 0.2, -sd / 2 + 0.04 - i * 0.025, 0, -0.12);
};

B.deckchair = (K, s, W, D) => {
  const wood = K.wood();
  for (const x of [-0.3, 0.3]) {
    K.put(rbox(0.04, 0.04, 1.0, 0.012), wood, x, 0.42, 0.0, 0, 0.62);
    K.put(rbox(0.04, 0.04, 0.6, 0.012), wood, x, 0.22, 0.12, 0, -0.75);
  }
  const sling = new THREE.PlaneGeometry(0.56, 0.95, 1, 10), pos = sling.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, -Math.cos(pos.getY(i) / 0.95 * Math.PI) * 0.05 - 0.05);
  sling.computeVertexNormals();
  const m = K.cloth(); m.side = THREE.DoubleSide;
  K.put(sling, m, 0, 0.44, 0.02, 0, -Math.PI / 2 + 0.62);
};

B.lounger = (K, s, W, D) => {
  const wood = K.wood(), c = K.cloth();
  for (const [x, z] of legsAt(W - 0.2, D - 0.3, 0.04)) leg(K, wood, x, z, 0.24, 0.03);
  K.put(rbox(W - 0.16, 0.06, D - 0.3, 0.02), wood, 0, 0.26, 0);
  K.put(blob(W * 0.62, 0.1, D - 0.34, 0.3, 0.5), c, W * 0.17, s.seat - 0.05, 0);
  K.put(blob(W * 0.34, 0.1, D - 0.34, 0.3, 0.5), c, -W / 2 + W * 0.2, 0.52, 0, 0, 0, -0.6);
  K.put(blob(0.2, 0.1, D - 0.4, 0.5, 0.6), K.cloth(K.pal.p), -W / 2 + 0.2, 0.74, 0, 0, 0, -0.6);
};

/* tables */

/** A painting cut above its base and puffed: what stands on a desk, counter or café table, set on `top`. */
function thing(K, s, D, z = 0) {
  const art = K.p.art(0, 1, true), rows = rowsOf(art);
  let base = 0, cut = -1;
  for (let j = 0; j < rows.length * 0.6; j++) if (rows[j]) base = Math.max(base, rows[j].r - rows[j].l);
  for (let j = 4; j < rows.length; j++) {
    const r = rows[j];
    if (cut < 0 && r && r.r - r.l < base * 0.82 && rows[j - 1] && rows[j - 1].r - rows[j - 1].l >= base * 0.82) cut = j;
  }
  if (cut < 0) return;
  const top = rows.reduce((t, r, j) => r ? j + 1 : t, 0);
  if (top - cut < 4) return;
  const arrays = remember(`${K.p.fam}|thing`, () => puffArrays(art, cut, top, Math.min(D * FT * 0.32, 9)));
  if (!arrays) return;
  const front = geoFrom(arrays.front), back = geoFrom(arrays.back);
  for (const g of [front, back]) { g.translate(0, -cut, 0); g.scale(U, U, U); }
  K.put(front, K.pic(K.p.art(0, HD)), 0, s.top, z);
  K.put(back, K.pic(K.p.art(2, HD)), 0, s.top, z);
}

B.table = (K, s, W, D) => {
  const wood = K.wood(), t = 0.07, h = s.top, round = s.round;
  const tw = W - 0.06, td = D - 0.06;
  let topGeo = round ? cyl(0.5, t, 0.5, 40) : rbox(tw, t, td, 0.03);
  if (round) topGeo.scale(tw, 1, td);
  topGeo.translate(0, h - t / 2, 0);
  if (s.glass) {
    K.put(topGeo, K.glass());
    const frame = round ? torus(0.5, 0.02, Math.PI * 2, 40).scale(tw, td, 1) : null;
    if (frame) K.put(frame, K.metal(K.pal.m), 0, h - t / 2, 0, 0, Math.PI / 2);
  } else if (s.plain || !K.p.flat) {
    K.put(topGeo, wood);
  } else {
    topUV(topGeo, W, D);
    K.put(topGeo, K.pic(K.p.art(0, HD)));
  }
  if (s.cloth) {
    const cl = rbox(tw + 0.06, 0.22, td + 0.06, 0.03);
    K.put(cl, K.cloth(K.pal.p), 0, h - 0.1, 0);
  }
  const legM = s.glass ? K.metal(tone(K.pal.m, 1.3)) : wood;
  if (s.pedestal) {
    K.put(lathe([[0.22, 0], [0.2, 0.03], [0.06, 0.07], [0.045, 0.2], [0.07, h * 0.5], [0.045, h - 0.15], [0.12, h - t]], 24), legM, 0, 0, 0);
  } else {
    const stubby = s.legs === 'stubby', r = stubby ? 0.055 : 0.042;
    const pts = round ? [0, 1, 2, 3].map(i => { const a = i / 4 * Math.PI * 2 + Math.PI / 4; return [Math.sin(a) * tw * 0.33, Math.cos(a) * td * 0.33]; }) : legsAt(tw, td, 0.09);
    for (const [x, z] of pts) leg(K, legM, x, z, h - t, r, s.legs === 'turned' ? 'turned' : null);
    if (!round && !stubby && !s.cloth) {
      K.put(rbox(tw - 0.14, 0.08, 0.03, 0.01), legM, 0, h - t - 0.04, -td / 2 + 0.08);
      K.put(rbox(tw - 0.14, 0.08, 0.03, 0.01), legM, 0, h - t - 0.04, td / 2 - 0.08);
      K.put(rbox(0.03, 0.08, td - 0.14, 0.01), legM, -tw / 2 + 0.08, h - t - 0.04, 0);
      K.put(rbox(0.03, 0.08, td - 0.14, 0.01), legM, tw / 2 - 0.08, h - t - 0.04, 0);
    }
  }
  if (s.thing) thing(K, s, D);
};

B.picnic = (K, s, W, D) => {
  const wood = K.wood(), h = s.top;
  const top = rbox(W - 0.06, 0.06, D * 0.5, 0.02);
  top.translate(0, h - 0.03, 0);
  topUV(top, W, D);
  K.put(top, K.pic(K.p.art(0, HD)));
  for (const z of [-D * 0.36, D * 0.36]) K.put(rbox(W - 0.06, 0.05, D * 0.16, 0.02), wood, 0, 0.42, z);
  for (const x of [-W / 2 + 0.25, W / 2 - 0.25]) {
    for (const k of [-1, 1]) K.put(rbox(0.06, 0.86, 0.06, 0.015), wood, x, 0.38, 0, 0, k * 0.55, 0);
    K.put(rbox(0.05, 0.05, D * 0.9, 0.015), wood, x, 0.36, 0);
  }
};

B.kotatsu = (K, s, W, D) => {
  const top = rbox(W - 0.04, 0.06, D - 0.04, 0.025);
  top.translate(0, s.top - 0.03, 0);
  topUV(top, W, D);
  K.put(top, K.pic(K.p.art(0, HD)));
  K.put(blob(W + 0.08, s.top - 0.04, D + 0.08, 0.25, 0.3), K.cloth(), 0, (s.top - 0.06) / 2 + 0.01, 0);
  K.put(rbox(W - 0.1, 0.05, D - 0.1, 0.02), K.wood(), 0, s.top - 0.085, 0);
};

B.desk = (K, s, W, D) => {
  const wood = K.wood(), h = s.top, dd = D - 0.12;
  K.put(rbox(W - 0.04, 0.07, dd, 0.025), wood, 0, h - 0.035, 0);
  if (s.school) {
    const m = K.metal(tone(K.pal.m, 1.3));
    for (const [x, z] of legsAt(W - 0.12, dd - 0.1, 0.03)) K.put(cyl(0.022, h - 0.07, 0.022, 8), m, x, (h - 0.07) / 2, z);
    K.put(rbox(W - 0.16, 0.12, dd - 0.16, 0.015), wood, 0, h - 0.17, -0.02);
  } else if (W >= 2) {
    const pw = 0.62, px = W / 2 - pw / 2 - 0.04;
    K.put(rbox(pw, h - 0.08, dd - 0.06, 0.02), wood, px, (h - 0.07) / 2, 0);
    for (let i = 0; i < 3; i++) {
      const y = 0.12 + i * (h - 0.2) / 3 + (h - 0.2) / 6;
      K.put(rbox(pw - 0.08, (h - 0.2) / 3 - 0.04, 0.03, 0.015), K.wood(tone(K.pal.w, 1.1)), px, y, dd / 2 - 0.02);
      K.put(ball(0.022), K.gloss(K.pal.a), px, y, dd / 2 + 0.01);
    }
    K.put(rbox(0.06, h - 0.08, dd - 0.06, 0.02), wood, -W / 2 + 0.07, (h - 0.07) / 2, 0);
    K.put(rbox(W - pw - 0.2, h * 0.5, 0.03, 0.01), wood, -pw / 2 + 0.02, h * 0.55, -dd / 2 + 0.06);
  } else {
    for (const [x, z] of legsAt(W - 0.08, dd - 0.06, 0.06)) leg(K, wood, x, z, h - 0.07, 0.035);
    K.put(rbox(W - 0.18, 0.12, dd - 0.12, 0.015), wood, 0, h - 0.13, 0);
    K.put(ball(0.022), K.gloss(K.pal.a), 0, h - 0.13, dd / 2 - 0.05);
  }
  if (s.mirror) {
    K.put(torus(0.26, 0.03, Math.PI * 2, 32).scale(0.85, 1.1, 1), K.gloss(K.pal.a), 0, h + 0.4, -dd / 2 + 0.08);
    K.put(cyl(0.25, 0.02, 0.25, 32).scale(0.85, 1, 1.1), K.gloss('#cfe6f4'), 0, h + 0.4, -dd / 2 + 0.07, 0, Math.PI / 2);
    K.put(rbox(0.06, 0.16, 0.04, 0.01), K.gloss(K.pal.a), 0, h + 0.08, -dd / 2 + 0.08);
  }
  if (s.thing) thing(K, s, D, 0.02);
};

/* storage */

B.drawers = (K, s, W, D) => {
  const body = s.metal ? K.gloss(tone(K.pal.m, 1.6)) : K.wood(), face = s.metal ? K.gloss(tone(K.pal.m, 1.8)) : K.wood(tone(K.pal.w, 1.12));
  const h = s.h, dd = D - 0.2, cols = s.cols || 1, rows = s.rows;
  for (const [x, z] of legsAt(W - 0.08, dd - 0.04, 0.06)) K.put(cyl(0.03, 0.07, 0.035, 10), body, x, 0.035, z);
  K.put(rbox(W - 0.06, h - 0.1, dd, 0.03), body, 0, 0.07 + (h - 0.1) / 2, 0);
  K.put(rbox(W - 0.02, 0.05, dd + 0.04, 0.02), body, 0, h - 0.02, 0.01);
  const fw = (W - 0.14) / cols, fh = (h - 0.2) / rows;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const x = -W / 2 + 0.07 + fw * (c + 0.5), y = 0.12 + fh * (r + 0.5);
    K.put(rbox(fw - 0.03, fh - 0.03, 0.04, 0.012), face, x, y, dd / 2 + 0.005);
    if (s.metal) K.put(rbox(0.16, 0.025, 0.03, 0.01), K.metal('#d8dce4'), x, y + fh * 0.2, dd / 2 + 0.03);
    else K.put(ball(0.025), K.gloss(K.pal.a), x, y, dd / 2 + 0.035);
  }
};

B.cabinet = (K, s, W, D) => {
  const body = s.metal ? K.gloss(tone(K.pal.m, 1.6)) : K.wood(), face = s.metal ? K.gloss(tone(K.pal.m, 1.75)) : K.wood(tone(K.pal.w, 1.1));
  const h = s.h, dd = D - 0.24;
  for (const [x, z] of legsAt(W - 0.08, dd - 0.04, 0.06)) K.put(cyl(0.035, 0.08, 0.04, 10), body, x, 0.04, z);
  K.put(rbox(W - 0.06, h - 0.14, dd, 0.03), body, 0, 0.08 + (h - 0.14) / 2, 0);
  K.put(rbox(W, 0.08, dd + 0.06, 0.025), body, 0, h - 0.04, 0.01);
  const n = s.metal ? W : 2, dw = (W - 0.12) / n;
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + 0.06 + dw * (i + 0.5);
    K.put(rbox(dw - 0.03, h - 0.3, 0.035, 0.012), face, x, 0.08 + (h - 0.22) / 2 + 0.02, dd / 2 + 0.005);
    if (s.vents) for (let v = 0; v < 4; v++) K.put(rbox(dw * 0.5, 0.02, 0.01, 0.004), K.plain('#2a2a32'), x, h - 0.32 - v * 0.05, dd / 2 + 0.025);
    else for (const [y, hh] of [[0.12 + (h - 0.3) * 0.72, (h - 0.3) * 0.36], [0.12 + (h - 0.3) * 0.28, (h - 0.3) * 0.36]]) {
      K.put(rbox(dw - 0.16, hh, 0.02, 0.01), K.wood(tone(K.pal.w, 0.92)), x, y, dd / 2 + 0.028);
    }
    const hx = n === 2 ? (i ? -1 : 1) * (dw / 2 - 0.07) : dw / 2 - 0.08;
    K.put(cyl(0.012, 0.16, 0.012, 8), s.metal ? K.metal('#d8dce4') : K.gloss(K.pal.a), x + hx, h * 0.5, dd / 2 + 0.05);
  }
};

const SPINES = ['#c84848', '#3a6ac8', '#e8b030', '#4a9a52', '#8a4ab0', '#e07038', '#2a8a8a', '#d8d0c0', '#5a3a2a', '#e86a9a'];
B.bookcase = (K, s, W, D) => {
  const wood = K.wood(), h = s.h, dd = Math.min(D - 0.3, 0.6), R = K.r, z0 = -0.5 + dd / 2 + 0.02;
  K.put(rbox(0.06, h, dd, 0.02), wood, -W / 2 + 0.06, h / 2, z0);
  K.put(rbox(0.06, h, dd, 0.02), wood, W / 2 - 0.06, h / 2, z0);
  K.put(rbox(W - 0.06, 0.06, dd + 0.04, 0.02), wood, 0, h - 0.03, z0);
  K.put(rbox(W - 0.12, 0.1, dd, 0.02), wood, 0, 0.05, z0);
  K.put(rbox(W - 0.12, h - 0.1, 0.03, 0.01), K.wood(tone(K.pal.w, 0.75)), 0, h / 2, z0 - dd / 2 + 0.015);
  const shelves = Math.max(3, Math.round((h - 0.2) / 0.45)), step = (h - 0.16) / shelves;
  for (let i = 1; i < shelves; i++) K.put(rbox(W - 0.12, 0.04, dd - 0.02, 0.012), wood, 0, 0.1 + i * step, z0);
  for (let i = 0; i < shelves; i++) {
    const floor = 0.1 + i * step + (i ? 0.02 : 0.0), roomH = step - 0.06;
    let x = -W / 2 + 0.11;
    while (x < W / 2 - 0.14) {
      if (R() < 0.12 && x < W / 2 - 0.4) { x += 0.12 + R() * 0.15; continue; }
      const bw = 0.04 + R() * 0.04, bh = roomH * (0.6 + R() * 0.35), bd = dd * (0.7 + R() * 0.2);
      if (x + bw > W / 2 - 0.12) break;
      const lean = R() < 0.08 ? 0.18 : 0;
      K.put(rbox(bw, bh, bd, 0.008, 1), K.plain(SPINES[Math.floor(R() * SPINES.length)]), x + bw / 2, floor + bh / 2, z0 + 0.01, 0, 0, lean);
      x += bw + 0.005 + (lean ? 0.05 : 0);
    }
  }
};

B.counter = (K, s, W, D) => {
  const body = K.wood(), h = s.top, dd = D - 0.12;
  K.put(rbox(W - 0.04, 0.08, dd - 0.06, 0.02), K.plain('#2a2420'), 0, 0.04, -0.03);
  K.put(rbox(W - 0.06, h - 0.13, dd - 0.04, 0.02), body, 0, 0.07 + (h - 0.13) / 2, 0);
  K.put(rbox(W, 0.06, dd + 0.04, 0.02), s.kitchen || s.sink ? K.gloss(tone(K.pal.p, 0.96)) : K.wood(tone(K.pal.w, 1.15)), 0, h - 0.03, 0.01);
  const n = Math.max(1, W * (s.kitchen ? 1 : 2)), dw = (W - 0.12) / n;
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + 0.06 + dw * (i + 0.5);
    K.put(rbox(dw - 0.04, h - 0.3, 0.03, 0.012), K.wood(tone(K.pal.w, 1.1)), x, 0.11 + (h - 0.27) / 2, dd / 2);
    K.put(rbox(0.12, 0.02, 0.025, 0.008), K.gloss(K.pal.a), x, h - 0.2, dd / 2 + 0.025);
  }
  if (s.sink) {
    K.put(rbox(0.46, 0.03, 0.34, 0.03), K.gloss('#dfe6ec'), 0, h + 0.001, 0.04);
    K.put(cyl(0.02, 0.18, 0.025, 10), K.metal('#c8ccd4'), 0, h + 0.09, -0.16);
    K.put(torus(0.07, 0.016, Math.PI, 12), K.metal('#c8ccd4'), 0, h + 0.18, -0.09, Math.PI / 2);
  }
  if (s.thing) thing(K, s, D, s.sink ? -0.05 : 0);
};

B.crate = (K, s, W, D) => {
  const wood = K.wood(), dark = K.wood(tone(K.pal.w, 0.82)), h = s.top, w = W - 0.12;
  K.put(rbox(w - 0.06, h - 0.06, w - 0.06, 0.01), K.plain(tone(K.pal.w, 0.45)), 0, h / 2, 0);
  for (let side = 0; side < 4; side++) for (let i = 0; i < 3; i++) {
    const a = side * Math.PI / 2, ph = (h - 0.04) / 3 - 0.015;
    K.put(rbox(w - 0.08, ph, 0.035, 0.01), i % 2 ? dark : wood, Math.sin(a) * (w / 2 - 0.0175), 0.02 + ph / 2 + i * (ph + 0.015), Math.cos(a) * (w / 2 - 0.0175), a);
  }
  for (const [x, z] of legsAt(w, w, 0.03)) K.put(rbox(0.07, h, 0.07, 0.015), wood, x, h / 2, z);
  for (let i = 0; i < 4; i++) K.put(rbox(w - 0.02, 0.035, (w - 0.02) / 4 - 0.015, 0.01), i % 2 ? dark : wood, 0, h - 0.0175, -w / 2 + (i + 0.5) * w / 4);
};

B.barrel = (K, s) => {
  const h = s.top, wood = K.wood(), band = K.metal(tone(K.pal.m, 1.2));
  const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([0.3 + Math.sin(t * Math.PI) * 0.06, t * h]); }
  pts.push([0.28, h], [0, h]);
  K.put(lathe(pts, 28), wood, 0, 0, 0);
  for (const t of [0.12, 0.88, 0.38, 0.62]) K.put(torus(0.3 + Math.sin(t * Math.PI) * 0.06 + 0.004, 0.012, Math.PI * 2, 28), band, 0, t * h, 0, 0, Math.PI / 2);
};

B.chest = (K, s, W, D) => {
  const wood = K.wood(), gold = K.gloss(K.pal.a), w = W - 0.16, d = D - 0.36;
  K.put(rbox(w, 0.42, d, 0.03), wood, 0, 0.21, 0);
  const lid = new THREE.CylinderGeometry(d / 2, d / 2, w, 24, 1, false, 0, Math.PI);
  K.put(lid, wood, 0, 0.42, 0, 0, 0, Math.PI / 2);
  for (const x of [-w / 2 + 0.08, w / 2 - 0.08]) {
    K.put(rbox(0.06, 0.43, d + 0.02, 0.01), gold, x, 0.215, 0);
    K.put(torus(d / 2 + 0.006, 0.02, Math.PI, 20), gold, x, 0.42, 0, Math.PI / 2);
  }
  K.put(rbox(0.12, 0.14, 0.04, 0.01), gold, 0, 0.36, d / 2 + 0.01);
};

B.tv = (K, s, W, D) => {
  const wood = K.wood(), dd = D - 0.3;
  K.put(rbox(W - 0.1, 0.36, dd, 0.03), wood, 0, 0.2, 0);
  for (const [x, z] of legsAt(W - 0.16, dd - 0.06, 0.05)) K.put(cyl(0.025, 0.04, 0.03, 8), wood, x, 0.02, z);
  K.put(rbox(W * 0.42, 0.2, 0.02, 0.01), K.wood(tone(K.pal.w, 0.85)), -W * 0.2, 0.2, dd / 2);
  K.put(rbox(0.16, 0.06, 0.08, 0.02), K.plain('#2a2a32'), 0, 0.42, -0.02);
  K.put(rbox(0.06, 0.12, 0.04, 0.01), K.plain('#2a2a32'), 0, 0.48, -0.02);
  const sw = W - 0.24, shh = sw * 0.58, y = 0.56 + shh / 2;
  K.put(rbox(sw, shh, 0.07, 0.025), K.gloss(tone(K.pal.m, 0.7)), 0, y, -0.02);
  // the screen is the painting's own picture, lit
  const art = K.p.art(0, HD), u = (v) => v * HD, H = art.height / HD, c = new OffscreenCanvas(u(W * FT - 12), u(28));
  c.getContext('2d').drawImage(art, u(6), u(H - 50), c.width, c.height, 0, 0, c.width, c.height);
  c.hd = HD;
  const screen = new THREE.PlaneGeometry(sw - 0.08, shh - 0.08);
  const m = K.pic(c);
  m.emissive = new THREE.Color('#ffffff'); m.emissiveMap = m.map; m.emissiveIntensity = 0.55;
  K.put(screen, m, 0, y, 0.016);
};

/* beds */

function duvet(K, s, W, D, w, d, y, z) {
  const g = blob(w, 0.12, d, 0.22, 0.4);
  g.translate(0, y, z);
  if (s.quilt) {
    // the quilt is the painting's own, read off its lower part
    const art = K.p.art(0, HD), c = new OffscreenCanvas(art.width, art.height);
    c.getContext('2d').drawImage(art, 0, 0);
    c.hd = HD;
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.12 + (pos.getX(i) + w / 2) / w * 0.76, 1 - (0.42 + (pos.getZ(i) - (z - d / 2)) / d * 0.52));
    K.put(g, K.pic(c));
  } else K.put(g, K.cloth());
}

B.bed = (K, s, W, D) => {
  const wood = K.wood(), sh = s.seat, cloud = s.cloud;
  const sheet = K.cloth(tone(K.pal.p, 1)), pillow = K.cloth('#ffffff');
  if (cloud) {
    const p = K.plain(K.pal.p), R = K.r;
    for (let x = -W / 2 + 0.25; x <= W / 2 - 0.2; x += 0.3) for (let z = -D / 2 + 0.25; z <= D / 2 - 0.2; z += 0.35) K.put(ball(0.22 + R() * 0.06), p, x, 0.18, z);
    for (let x = -W / 2 + 0.2; x <= W / 2 - 0.2; x += 0.26) K.put(ball(0.28 + R() * 0.06), p, x, 0.5 + R() * 0.1, -D / 2 + 0.2);
  } else {
    for (const [x, z] of legsAt(W - 0.06, D - 0.06, 0.06)) leg(K, wood, x, z, 0.12, 0.04);
    K.put(rbox(W - 0.04, 0.2, D - 0.08, 0.03), wood, 0, 0.2, 0.0);
    const hb = s.posts ? 1.15 : 0.95;
    K.put(rbox(W, hb, 0.1, 0.04), wood, 0, hb / 2, -D / 2 + 0.05);
    K.put(rbox(W - 0.24, hb - 0.4, 0.04, 0.02), K.wood(tone(K.pal.w, 1.12)), 0, hb / 2 + 0.12, -D / 2 + 0.1);
    K.put(rbox(W, 0.52, 0.08, 0.03), wood, 0, 0.26, D / 2 - 0.04);
  }
  K.put(blob(W - 0.16, 0.18, D - 0.24, 0.25, 0.35), sheet, 0, sh - 0.08, 0.02);
  const pillows = W >= 2 ? 2 : 1, pw = (W - 0.3) / pillows;
  for (let i = 0; i < pillows; i++) K.put(blob(pw - 0.06, 0.13, 0.36, 0.45, 0.5), pillow, -W / 2 + 0.15 + pw * (i + 0.5), sh + 0.05, -D / 2 + 0.36);
  duvet(K, s, W, D, W - 0.1, D * 0.66, sh + 0.02, D / 2 - D * 0.33 - 0.06);
  if (s.posts) for (const [x, z] of legsAt(W, D, 0.05)) {
    const ph = s.canopy ? 2.05 : (z < 0 ? 1.45 : 0.9);
    K.put(lathe([[0.05, 0], [0.045, ph * 0.3], [0.06, ph * 0.33], [0.035, ph * 0.4], [0.035, ph]], 14), wood, x, 0, z);
    K.put(ball(0.06), K.gloss(K.pal.a), x, ph + 0.04, z);
  }
  if (s.canopy) {
    K.put(rbox(W, 0.06, D, 0.02), wood, 0, 2.06, 0);
    const drape = K.cloth(K.pal.a);
    K.put(blob(W + 0.04, 0.16, D + 0.04, 0.2, 0.6), drape, 0, 2.02, 0);
    for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) for (const z of [-D / 2 + 0.12, D / 2 - 0.12]) K.put(blob(0.12, 1.7, 0.2, 0.6, 0.15), drape, x, 1.1, z);
  }
};

B.futon = (K, s, W, D) => {
  K.put(blob(W - 0.08, 0.14, D - 0.1, 0.25, 0.35), K.cloth(K.pal.p), 0, 0.07, 0);
  K.put(blob(Math.min(0.7, W - 0.3), 0.12, 0.34, 0.45, 0.5), K.cloth('#ffffff'), 0, 0.19, -D / 2 + 0.3);
  duvet(K, { quilt: false }, W, D, W - 0.06, D * 0.64, 0.17, D / 2 - D * 0.32 - 0.05);
};

/** A flat cushion: a plump pillow wearing its own painting on top, round if the painting's corners are clear. */
B.cushion = (K, s, W, D) => {
  const art = K.p.art(0), a = alphaOf(art), round = a[3] < SOLID && a[(art.width - 1) * 4 + 3] < SOLID;
  const h = Math.max(0.16, s.seat + 0.04);
  const g = blob(W - 0.06, h, D - 0.06, round ? 1 : 0.3, 0.55);
  g.translate(0, h / 2, 0);
  topUV(g, W, D);
  K.put(g, K.pic(K.p.art(0, HD)));
};

/* lamps and plants */

B.lamp = (K) => {
  K.put(lathe([[0.17, 0], [0.18, 0.04], [0.2, 0.12], [0.15, 0.3], [0.06, 0.4], [0.05, 0.42]], 24), K.gloss(K.pal.w), 0, 0, 0);
  K.put(cyl(0.022, 0.38, 0.022, 10), K.metal('#c8b078'), 0, 0.6, 0);
  const shade = lathe([[0.3, 0], [0.18, 0.4]], 28);
  const m = K.glow(K.pal.g); m.side = THREE.DoubleSide;
  K.put(shade, m, 0, 0.7, 0);
  K.put(ball(0.07), K.glow('#fff4d0'), 0, 0.82, 0);
};

B.floorlamp = (K) => {
  K.put(cyl(0.2, 0.05, 0.22, 24), K.metal(K.pal.m), 0, 0.025, 0);
  K.put(cyl(0.02, 1.7, 0.025, 10), K.metal(K.pal.m), 0, 0.88, 0);
  K.put(cyl(0.05, 0.05, 0.05, 12), K.gloss(K.pal.a), 0, 1.0, 0);
  const m = K.glow(K.pal.g); m.side = THREE.DoubleSide;
  K.put(lathe([[0.32, 0], [0.2, 0.42]], 28), m, 0, 1.68, 0);
  K.put(ball(0.07), K.glow('#fff4d0'), 0, 1.82, 0);
};

function pot(K, r, h) {
  const m = K.gloss(K.pal.pot);
  K.put(lathe([[r * 0.75, 0], [r * 0.8, 0.02], [r, h * 0.85], [r * 1.12, h * 0.86], [r * 1.12, h], [r * 1.02, h], [r * 0.95, h * 0.92], [0, h * 0.92]], 28), m, 0, 0, 0);
  K.put(cyl(r * 0.94, 0.02, r * 0.94, 24), K.plain('#4a3020'), 0, h * 0.92, 0);
}
/** A leaf: a flattened ellipsoid tipped out from the stem at `a` round and `tilt` from upright. */
function leafAt(K, m, y, a, tilt, len, wid) {
  const g = ball(1, 10, 8).scale(wid, 0.012, len / 2);
  g.translate(0, 0, len / 2);
  g.rotateX(-(Math.PI / 2 - tilt));
  g.rotateY(a);
  g.translate(0, y, 0);
  K.put(g, m);
}

B.plant = (K) => {
  pot(K, 0.22, 0.4);
  const R = K.r, greens = [K.plain(K.pal.leaf), K.plain(tone(K.pal.leaf, 1.15)), K.plain(tone(K.pal.leaf, 0.85))];
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4 + R() * 0.5, tilt = 0.25 + (i / 16) * 0.9 + R() * 0.15;
    leafAt(K, greens[i % 3], 0.38 + R() * 0.05, a, tilt, 0.32 + R() * 0.22, 0.09 + R() * 0.03);
  }
};

B.palm = (K) => {
  pot(K, 0.27, 0.48);
  const trunk = K.wood(), R = K.r;
  let x = 0, z = 0, y = 0.45;
  for (let i = 0; i < 7; i++) {
    const h = 0.17, nx = x + (R() - 0.5) * 0.04, nz = z + (R() - 0.5) * 0.04;
    K.put(cyl(0.055 - i * 0.003, h, 0.068 - i * 0.003, 12), i % 2 ? trunk : K.wood(tone(K.pal.w, 0.85)), (x + nx) / 2, y + h / 2, (z + nz) / 2);
    x = nx; z = nz; y += h - 0.01;
  }
  const leafM = [K.plain(K.pal.leaf), K.plain(tone(K.pal.leaf, 0.85))];
  for (let f = 0; f < 8; f++) {
    const a = f / 8 * Math.PI * 2 + R() * 0.3;
    for (let s = 0; s < 6; s++) {
      const t = s / 6, droop = 0.5 + t * 1.3;
      leafAt(K, leafM[s % 2], y - Math.pow(t, 2) * 0.3, a, Math.min(1.5, droop), 0.18, 0.05 + (1 - t) * 0.04);
      const g = ball(1, 8, 6).scale(0.04, 0.008, 0.12);
      g.rotateY(a + Math.PI / 2); g.translate(x + Math.sin(a) * t * 0.6, y - t * t * 0.4, z + Math.cos(a) * t * 0.6);
      K.put(g, leafM[(s + 1) % 2]);
    }
  }
};

B.vase = (K) => {
  K.put(lathe([[0.1, 0], [0.16, 0.06], [0.2, 0.2], [0.17, 0.34], [0.08, 0.44], [0.07, 0.52], [0.1, 0.56], [0.08, 0.57]], 28), K.gloss(K.pal.c), 0, 0, 0);
  K.put(torus(0.2, 0.014, Math.PI * 2, 28), K.gloss(K.pal.a), 0, 0.2, 0, 0, Math.PI / 2);
  const R = K.r, blooms = [K.pal.a === K.pal.p ? '#e04848' : K.pal.a, K.pal.p, tone(K.pal.c, 1.2)];
  for (let i = 0; i < 5; i++) {
    const a = i * 1.3, lean = 0.15 + R() * 0.2, len = 0.3 + R() * 0.15;
    const tip = [Math.sin(a) * Math.sin(lean) * len, 0.55 + Math.cos(lean) * len, Math.cos(a) * Math.sin(lean) * len];
    K.put(cyl(0.008, len, 0.008, 6), K.plain(tone(K.pal.leaf, 0.85)), tip[0] / 2, 0.55 + (tip[1] - 0.55) / 2, tip[2] / 2, a, lean);
    const m = K.plain(blooms[i % 3]);
    for (let p = 0; p < 5; p++) { const b = p / 5 * Math.PI * 2; K.put(ball(0.035, 8, 6), m, tip[0] + Math.sin(b) * 0.035, tip[1], tip[2] + Math.cos(b) * 0.035); }
    K.put(ball(0.025, 8, 6), K.plain('#f8d848'), tip[0], tip[1] + 0.012, tip[2]);
    if (i < 3) leafAt(K, K.plain(K.pal.leaf), 0.6, a + 0.6, 0.9, 0.14, 0.04);
  }
};

/* ---------- the model ---------- */

/* ---------- a rounded hull: any piece from its front and side paintings ---------- */

/** Chamfer distances (3 a step, 4 a diagonal) over a grid, in place. */
function chamfer(d, w, h) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 3);
    if (y > 0) { v = Math.min(v, d[i - w] + 3); if (x > 0) v = Math.min(v, d[i - w - 1] + 4); if (x < w - 1) v = Math.min(v, d[i - w + 1] + 4); }
    d[i] = v;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x;
    let v = d[i];
    if (x < w - 1) v = Math.min(v, d[i + 1] + 3);
    if (y < h - 1) { v = Math.min(v, d[i + w] + 3); if (x < w - 1) v = Math.min(v, d[i + w + 1] + 4); if (x > 0) v = Math.min(v, d[i + w - 1] + 4); }
    d[i] = v;
  }
}
/** A mask's signed distance to its outline, in painted units, positive inside. */
function sdf2(mask, w, h) {
  const a = new Float32Array(w * h), b = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) { a[i] = mask[i] ? 1e6 : 0; b[i] = mask[i] ? 0 : 1e6; }
  chamfer(a, w, h); chamfer(b, w, h);
  for (let i = 0; i < w * h; i++) out[i] = mask[i] ? a[i] / 3 - 0.5 : -(b[i] / 3 - 0.5);
  return out;
}
/** For each pixel of a mask, the left and right ends of the run it's in, row by row. */
function runs(mask, w, h) {
  const L = new Int16Array(w * h).fill(-1), R = new Int16Array(w * h).fill(-1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w;) {
    if (!mask[y * w + x]) { x++; continue; }
    let e = x;
    while (e < w && mask[y * w + e]) e++;
    for (let i = x; i < e; i++) { L[y * w + i] = x; R[y * w + i] = e; }
    x = e;
  }
  return [L, R];
}

/** Naive surface nets over a field (positive inside) on an nx x ny x nz grid: a vertex in each cell the surface
    crosses, at the mean of its edges' crossings, and a quad round each crossing edge. */
function surfaceNets(f, nx, ny, nz) {
  const at = (i, j, k) => (k * ny + j) * nx + i;
  const cell = new Int32Array(nx * ny * nz).fill(-1), pos = [], idx = [];
  const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let ins = 0;
    for (let c = 0; c < 8; c++) { v[c] = f[at(i + C[c][0], j + C[c][1], k + C[c][2])]; if (v[c] > 0) ins++; }
    if (!ins || ins === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of E) {
      if ((v[a] > 0) === (v[b] > 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      sx += C[a][0] + (C[b][0] - C[a][0]) * t; sy += C[a][1] + (C[b][1] - C[a][1]) * t; sz += C[a][2] + (C[b][2] - C[a][2]) * t;
      n++;
    }
    cell[at(i, j, k)] = pos.length / 3;
    pos.push(i + sx / n, j + sy / n, k + sz / n);
  }
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d); };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const in0 = f[at(i, j, k)] > 0;
    if (in0 !== (f[at(i + 1, j, k)] > 0)) quad(cell[at(i, j - 1, k - 1)], cell[at(i, j, k - 1)], cell[at(i, j, k)], cell[at(i, j - 1, k)], !in0);
    if (in0 !== (f[at(i, j + 1, k)] > 0)) quad(cell[at(i - 1, j, k - 1)], cell[at(i - 1, j, k)], cell[at(i, j, k)], cell[at(i, j, k - 1)], !in0);
    if (in0 !== (f[at(i, j, k + 1)] > 0)) quad(cell[at(i - 1, j - 1, k)], cell[at(i, j - 1, k)], cell[at(i, j, k)], cell[at(i - 1, j, k)], !in0);
  }
  return { pos, idx };
}

/** The piece's rows [j0, j1) (from the floor) as a rounded solid: inside both its front and its side silhouettes (the
    visual hull carving used to cut), its edges rounded off and each slice an ellipse (`organic`, exponent 2.3) or a
    rounded box (`boxy`, exponent 8) across the runs it sits in. A piece painted the same from every side (`round`)
    has no side to cut by: each run of each row is a round tube, so a doll's two ears stay two. Arrays per painting it
    wears, as js/base-model.js orders them: front, back, right side, left side. */
function hullArrays(p, j0, j1, mode) {
  const fa = p.art(0, 1, true), sa = p.art(1, 1, true), W = fa.width, D = sa.width, Hf = fa.height, Hs = sa.height, n = j1 - j0;
  const fd = alphaOf(fa), sd = alphaOf(sa), mf = new Uint8Array(W * n), ms = new Uint8Array(D * n);
  for (let r = 0; r < n; r++) {
    const yf = Hf - 1 - (j0 + r), ys = Hs - 1 - (j0 + r);
    if (yf >= 0) for (let x = 0; x < W; x++) mf[r * W + x] = fd[(yf * W + x) * 4 + 3] > SOLID ? 1 : 0;
    if (ys >= 0) for (let x = 0; x < D; x++) ms[r * D + x] = sd[(ys * D + x) * 4 + 3] > SOLID ? 1 : 0;
  }
  const df = sdf2(mf, W, n), ds = sdf2(ms, D, n), [fL, fR] = runs(mf, W, n), [sL, sR] = runs(ms, D, n);
  const round = mode === 'round', R0 = mode === 'boxy' ? 1.6 : 5, P = mode === 'boxy' ? 8 : round ? 2 : 2.3;
  const nx = W + 2, ny = n + 2, nz = D + 2, f = new Float32Array(nx * ny * nz);
  for (let kk = 0; kk < nz; kk++) for (let jj = 0; jj < ny; jj++) for (let ii = 0; ii < nx; ii++) {
    const i = ii - 1, r = jj - 1, k = kk - 1, o = (kk * ny + jj) * nx + ii;
    if (i < 0 || r < 0 || k < 0 || i >= W || r >= n || k >= D) { f[o] = -1; continue; }
    const s = D - 1 - k, a = df[r * W + i], b = ds[r * D + s];
    if (round) {
      if (a <= 0) { f[o] = a; continue; }
      const ha = (fR[r * W + i] - fL[r * W + i]) / 2, hb = Math.min(ha, D / 2 - 0.5);
      const dx = Math.abs(i + 0.5 - (fL[r * W + i] + ha)) / ha, dz = Math.abs(s + 0.5 - D / 2) / hb;
      f[o] = Math.min(a, (1 - Math.hypot(dx, dz)) * hb);
      continue;
    }
    if (a <= 0 || b <= 0) { f[o] = Math.min(a, b); continue; }
    const g = R0 - Math.hypot(Math.max(0, R0 - a), Math.max(0, R0 - b));
    const ha = (fR[r * W + i] - fL[r * W + i]) / 2, hb = (sR[r * D + s] - sL[r * D + s]) / 2;
    const dx = Math.abs(i + 0.5 - (fL[r * W + i] + ha)) / ha, dz = Math.abs(s + 0.5 - (sL[r * D + s] + hb)) / hb;
    const e = (1 - Math.pow(Math.pow(dx, P) + Math.pow(dz, P), 1 / P)) * Math.min(ha, hb);
    f[o] = Math.min(g, e);
  }
  const net = surfaceNets(f, nx, ny, nz);
  if (!net.idx.length) return null;
  const P3 = net.pos, nv = P3.length / 3;
  for (let q = 0; q < nv; q++) {
    P3[q * 3] = P3[q * 3] - 0.5 - W / 2;
    P3[q * 3 + 1] = P3[q * 3 + 1] - 0.5 + j0;
    P3[q * 3 + 2] = P3[q * 3 + 2] - 0.5 - D / 2;
  }
  // smooth normals, area weighted
  const nor = new Float32Array(nv * 3), fnor = [];
  for (let t = 0; t < net.idx.length; t += 3) {
    const a = net.idx[t], b = net.idx[t + 1], c = net.idx[t + 2];
    const ux = P3[b * 3] - P3[a * 3], uy = P3[b * 3 + 1] - P3[a * 3 + 1], uz = P3[b * 3 + 2] - P3[a * 3 + 2];
    const vx = P3[c * 3] - P3[a * 3], vy = P3[c * 3 + 1] - P3[a * 3 + 1], vz = P3[c * 3 + 2] - P3[a * 3 + 2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    fnor.push(cx, cy, cz);
    for (const q of [a, b, c]) { nor[q * 3] += cx; nor[q * 3 + 1] += cy; nor[q * 3 + 2] += cz; }
  }
  for (let q = 0; q < nv; q++) { const l = Math.hypot(nor[q * 3], nor[q * 3 + 1], nor[q * 3 + 2]) || 1; nor[q * 3] /= l; nor[q * 3 + 1] /= l; nor[q * 3 + 2] /= l; }
  // each triangle wears the painting it faces most; a top or bottom the front's, read a little below the outline
  const out = [0, 1, 2, 3].map(() => ({ pos: [], nor: [], uv: [] }));
  for (let t = 0; t < net.idx.length; t += 3) {
    const nx3 = fnor[t], ny3 = fnor[t + 1], nz3 = fnor[t + 2], ax = Math.abs(nx3), ay = Math.abs(ny3), az = Math.abs(nz3);
    // a round piece wraps its front and back paintings round it, as on a lathe
    const g = round ? (nz3 >= 0 ? 0 : 1) : az >= ax && az >= ay * 0.7 ? (nz3 >= 0 ? 0 : 1) : ax >= ay * 0.7 ? (nx3 >= 0 ? 2 : 3) : (nz3 >= -0.2 * ay ? 0 : 1);
    const lift = ay > ax && ay > az && ny3 > 0 ? 2.5 : 0;
    for (let e = 0; e < 3; e++) {
      const q = net.idx[t + e], x = P3[q * 3], y = P3[q * 3 + 1], z = P3[q * 3 + 2], o = out[g];
      o.pos.push(x, y, z); o.nor.push(nor[q * 3], nor[q * 3 + 1], nor[q * 3 + 2]);
      if (g === 0) o.uv.push((x + W / 2) / W, (y - lift) / Hf);
      else if (g === 1) o.uv.push((W / 2 - x) / W, (y - lift) / Hf);
      else if (g === 2) o.uv.push((D / 2 - z) / D, y / Hs);
      else o.uv.push((z + D / 2) / D, y / Hs);
    }
  }
  return out.map(o => ({ pos: new Float32Array(o.pos), nor: new Float32Array(o.nor), uv: new Float32Array(o.uv) }));
}

/* ---------- pieces without a shape ---------- */

const faceCache = new Map(), FACES_KEEP = 36;
/** The four HD paintings a model wears (front, back, right, left), every clear pixel filled from its nearest painted
    one so a face sampled near its outline never reads clear. */
function faces(p, id) {
  if (faceCache.has(id)) { const v = faceCache.get(id); faceCache.delete(id); faceCache.set(id, v); return v; }
  const [hf, hr, hb, hl] = [0, 1, 2, 3].map(d => p.art(d, HD));
  // a doll is painted the same from behind, face and all: its back is the front's colours, softened past any face
  const v = [filled(hf), p.group === 'Dolls' ? soften(filled(mirror(hf))) : filled(hb, mirror(hf)), filled(hr), filled(hl, mirror(hr))];
  v.forEach(c => { c.hd = HD; });
  faceCache.set(id, v);
  if (faceCache.size > FACES_KEEP) faceCache.delete(faceCache.keys().next().value);
  return v;
}

/** A painting blurred by shrinking it and growing it back. */
function soften(src) {
  const w = src.width, h = src.height, small = new OffscreenCanvas(Math.max(1, w >> 4), Math.max(1, h >> 4)), out = new OffscreenCanvas(w, h);
  const sg = small.getContext('2d'), og = out.getContext('2d');
  sg.imageSmoothingQuality = og.imageSmoothingQuality = 'high';
  sg.drawImage(src, 0, 0, small.width, small.height);
  og.drawImage(small, 0, 0, w, h);
  return out;
}

/** Whether a piece is painted the same from the front and the side (a round thing). */
function roundish(p) {
  if (p.w !== p.h) return false;
  const a = alphaOf(p.art(0, 1, true)), b = alphaOf(p.art(1, 1, true));
  if (a.length !== b.length) return false;
  for (let i = 3; i < a.length; i += 12) if ((a[i] > SOLID) !== (b[i] > SOLID)) return false;
  return true;
}

/** A piece with no shape: a round one's bottom that is one centred run a row turns on a lathe; everything else is its
    rounded hull, soft for an organic outline, nearly square for a boxy one. */
function autoModel(id, paint) {
  const p = PIECES[id], art = p.art(0, 1, true);
  const plan = remember(`${p.fam}|plan`, () => {
    const pl = roundPlan(art);
    if (pl && !pl.boxy && (!roundish(p) || p.group === 'Dolls')) pl.split = pl.j0;
    return pl;
  });
  if (!plan) return null;
  const rows = rowsOf(art), j0 = rows.findIndex(r => r), j1 = rows.length - [...rows].reverse().findIndex(r => r);
  const split = plan.boxy ? j0 : plan.split;
  const mats = faces(p, id).map(paint), g = new THREE.Group();
  const add = (a, m) => { if (!a.pos.length) return; const geo = geoFrom(a); geo.scale(U, U, U); const mesh = new THREE.Mesh(geo, m); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); };
  if (split > j0) {
    const arrs = remember(`${p.fam}|lathe`, () => latheArrays(art, j0, split));
    if (arrs) { add(arrs[0], mats[0]); add(arrs[1], mats[1]); }
  }
  if (split < j1) {
    const arrs = remember(`${p.fam}|hull`, () => hullArrays(p, split, j1, plan.boxy ? 'boxy' : roundish(p) ? 'round' : 'organic'));
    if (arrs) arrs.forEach((a, i) => add(a, mats[i]));
  }
  return g.children.length ? g : null;
}

/* ---------- plants: a round pot, the leaves as crossed cards ---------- */

// plants on other shelves (every unshaped kind on the Plants shelf is one too), and open frames, ladders, stands and
// spindly things whose rounded hull lost their holes or their tops (the user's ask, 2026-10-09: the same as the plants)
const LEAFY = new Set(['alienplant', 'appletree', 'citrustree', 'datepalm', 'deadtree', 'palmtree', 'centerplant', 'orchidstand',
  'topiary', 'tomatovine', 'kelp', 'iceflower', 'sakura', 'fancoral', 'beanpole', 'plantstair', 'gourdarch', 'cornrow',
  'coatrack', 'gong', 'slide', 'rosearch', 'hurdle', 'pullupbar', 'refstand', 'lifeguard', 'dumbbells', 'easel', 'ferriswheel',
  'bunkbed', 'towelladder', 'crib', 'skirack', 'xylophone', 'logpile', 'skates', 'satdish', 'teslacoil', 'catapult',
  'spinwheel', 'swordrack', 'marblerun', 'rockinghorse', 'candlestand', 'weathervane', 'teaset', 'libraryladder', 'bookarch',
  'mast', 'scrollrack', 'orrery', 'windpump', 'spyglass', 'beacon', 'plough', 'sprinkler', 'shipwreck', 'yukatarack',
  'cloudstair', 'skybell', 'dnamodel', 'tuba', 'woodstove', 'raggeddoll']);
const POT_MAX = 21;   // the tallest pot potAt() paints, in units
const leafy = (p) => (p.w === p.h && p.group === 'Plants') || LEAFY.has(p.fam);

/** A plant (the user's ask, 2026-10-09: leaves puffed into a hull came out a lumpy blob): its pot, the rows from the
    floor that are one centred run, turns on a lathe; above it the painting stands on two crossed cards, the front's
    and the side's, cut out by their alpha, so it reads as the painting from the front and still has a side. */
function leafyModel(id, paint) {
  const p = PIECES[id], art = p.art(0, 1, true), rows = rowsOf(art), W = art.width, H = art.height;
  const j0 = rows.findIndex(r => r), j1 = rows.length - [...rows].reverse().findIndex(r => r);
  if (j0 < 0) return null;
  let k = j0;
  while (k < Math.min(j1, j0 + POT_MAX) && rows[k].runs === 1 && Math.abs(rows[k].l + rows[k].r - W) <= 3) k++;
  const split = p.w === p.h && k - j0 >= 4 ? k : j0, g = new THREE.Group();
  if (split > j0) {
    const mats = faces(p, id).map(paint), arrs = remember(`${p.fam}|pot`, () => latheArrays(art, j0, split));
    if (arrs) arrs.forEach((a, i) => { const geo = geoFrom(a); geo.scale(U, U, U); const m = new THREE.Mesh(geo, mats[i]); m.castShadow = m.receiveShadow = true; g.add(m); });
  }
  // the cards start a unit into the pot, so no gap shows between the soil and the leaves
  const c0 = Math.max(j0, split - 1);
  for (const [dir, turn] of [[0, 0], [1, Math.PI / 2]]) {
    const pic = p.art(dir, HD), m = paint(pic);
    Object.assign(m, { alphaTest: 0.5, side: THREE.DoubleSide, transparent: false });
    const geo = new THREE.PlaneGeometry(pic.width / HD * U, (j1 - c0) * U), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, (c0 + uv.getY(i) * (j1 - c0)) / H);
    geo.translate(0, (c0 + j1) / 2 * U, 0);
    geo.rotateY(turn);
    const mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = mesh.receiveShadow = true;
    g.add(mesh);
  }
  return g;
}

/** Any piece as a 3D group (see the file's head); null for a flat piece with no shape (the caller lays it as a slab).
    `paint(canvas)` makes the material for a painting. */
export function furnitureModel(three, id, paint) {
  THREE = three;
  const p = PIECES[id], shape = shapeOf(p.fam, p), W = p.w, D = p.h;
  let g = null;
  if (p.doll && PLUSH[p.doll[0]]) {
    const K = kit(id, paint);
    sewPlush(THREE, K, PLUSH[p.doll[0]], p.doll[1]);
    g = assemble(K);
  } else if (shape && B[shape.make]) {
    const K = kit(id, paint);
    B[shape.make](K, shape, W, D);
    g = assemble(K);
  } else if (p.flat || p.wall) return null;
  else g = leafy(p) ? leafyModel(id, paint) : autoModel(id, paint);
  if (!g) {
    const mesh = pieceModel(THREE, id, U, paint);
    g = new THREE.Group();
    g.add(mesh);
    if (mesh.userData.standee) g.userData.standee = mesh;
  }
  g.userData.top = new THREE.Box3().setFromObject(g).max.y;
  return g;
}
