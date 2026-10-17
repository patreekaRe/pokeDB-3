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
import { MAKES as MAKES_A } from './base-models-a.js';
import { MAKES as MAKES_B } from './base-models-b.js';
import { MAKES as MAKES_C } from './base-models-c.js';
import { MAKES as MAKES_D } from './base-models-d.js';
import { MAKES as MAKES_E } from './base-models-e.js';
import { MAKES as MAKES_F } from './base-models-f.js';
import { MAKES as MAKES_G } from './base-models-g.js';
import { MAKES as MAKES_H } from './base-models-h.js';
import { MAKES as MAKES_I } from './base-models-i.js';
import { MAKES as MAKES_J } from './base-models-j.js';
import { MAKES as MAKES_K } from './base-models-k.js';
import { MAKES as MAKES_W } from './base-models-w.js';
import { MAKES as MAKES_W2 } from './base-models-w2.js';
import { MAKES as MAKES_W3 } from './base-models-w3.js';
import { MAKES as MAKES_W4 } from './base-models-w4.js';
import { MAKES as MAKES_W5 } from './base-models-w5.js';
import { MAKES as MAKES_W6 } from './base-models-w6.js';
import { MAKES as MAKES_W7 } from './base-models-w7.js';
import { MAKES as MAKES_T, ITEMS } from './base-models-t.js';
import { MAKES as MAKES_Y } from './base-models-y.js';
import { MAKES as MAKES_FR } from './base-models-friends.js';
import { MAKES as MAKES_L } from './base-models-l.js';
import { MAKES as MAKES_M } from './base-models-m.js';
import { MAKES as MAKES_N } from './base-models-n.js';
import { MAKES as MAKES_O } from './base-models-o.js';
import { MAKES as MAKES_P } from './base-models-p.js';
import { MAKES as MAKES_Q } from './base-models-q.js';
import { MAKES as MAKES_R } from './base-models-r.js';
import { MAKES as MAKES_S } from './base-models-s.js';
import { MAKES as MAKES_U } from './base-models-u.js';
import { MAKES as MAKES_V } from './base-models-v.js';
import { MAKES as MAKES_X } from './base-models-x.js';
import { MAKES as MAKES_Z } from './base-models-z.js';
import { MAKES as MAKES_Y2 } from './base-models-y2.js';
import { MAKES as MAKES_GOLD } from './base-models-gold.js';
import { MAKES as MAKES_PIKACHU } from './base-models-pikachu.js';
import { MAKES as MAKES_EEVEE } from './base-models-eevee.js';
import { MAKES as MAKES_SNORLAX } from './base-models-snorlax.js';
import { MAKES as MAKES_JIGGLYPUFF } from './base-models-jigglypuff.js';
import { MAKES as MAKES_GENGAR } from './base-models-gengar.js';
import { MAKES as MAKES_LAPRAS } from './base-models-lapras.js';
import { MAKES as MAKES_BALL } from './base-models-balls.js';
import { MAKES as MAKES_MUSEUM } from './base-models-museum.js';
import { MAKES as MAKES_CONTEST } from './base-models-contest.js';
import { MAKES as MAKES_LEAGUE } from './base-models-league.js';
import { MAKES as MAKES_ROCKET } from './base-models-rocket.js';
import { MAKES as MAKES_DAYCARE } from './base-models-daycare.js';
import { MAKES as MAKES_PARTNER } from './base-models-partner.js';
import { MAKES as MAKES_FIGURINES } from './base-models-figurines.js';
import { MAKES as MAKES_ANTIQUE } from './base-models-antique.js';
import { MAKES as MAKES_RATTAN } from './base-models-rattan.js';
import { MAKES as MAKES_LOGCABIN } from './base-models-logcabin.js';
import { MAKES as MAKES_IRONWOOD } from './base-models-ironwood.js';
import { MAKES as MAKES_IMPERIAL } from './base-models-imperial.js';
import { MAKES as MAKES_DINER } from './base-models-diner.js';
import { MAKES as MAKES_CUTE } from './base-models-cute.js';
import { MAKES as MAKES_ELEGANT } from './base-models-elegant.js';
import { MAKES as MAKES_GOLDEN } from './base-models-golden.js';
import { MAKES as MAKES_SHELL } from './base-models-shell.js';
import { MAKES as MAKES_SAKURA } from './base-models-sakura.js';
import { MAKES as MAKES_MAPLE } from './base-models-maple.js';
import { MAKES as MAKES_ACORN } from './base-models-acorn.js';
import { MAKES as MAKES_MUSHROOM } from './base-models-mushroom.js';
import { MAKES as MAKES_BLOCK } from './base-models-block.js';
import { MAKES as MAKES_THROWBACK } from './base-models-throwback.js';
import { MAKES as MAKES_RANCH } from './base-models-ranch.js';
import { MAKES as MAKES_IRONGARDEN } from './base-models-irongarden.js';
import { MAKES as MAKES_BAMBOO } from './base-models-bamboo.js';
import { MAKES as MAKES_STONEZEN } from './base-models-stonezen.js';
import { MAKES as MAKES_CONSTELLATION } from './base-models-constellations.js';
import { MAKES as MAKES_CARAVAN } from './base-models-caravan.js';
import { MAKES as MAKES_HOSPITAL } from './base-models-hospital.js';
import { MAKES as MAKES_BISTRO } from './base-models-bistro.js';
import { MAKES as MAKES_BAKERY } from './base-models-bakery.js';
import { MAKES as MAKES_SUSHI } from './base-models-sushi.js';
import { MAKES as MAKES_RAMEN } from './base-models-ramen.js';
import { MAKES as MAKES_PIZZERIA } from './base-models-pizzeria.js';
import { MAKES as MAKES_CORNERSHOP } from './base-models-cornershop.js';
import { MAKES as MAKES_LAUNDROMAT } from './base-models-laundromat.js';
import { MAKES as MAKES_SALON } from './base-models-salon.js';
import { MAKES as MAKES_GARAGE } from './base-models-garage.js';
import { screenArt, marqueeArt, sideArt, whackFront, whackSign, pinField, pinGlass, cardFace, cardBack, feltArt, reelArt, slotBelly, plinkoFace } from './arcade-art.js';

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
  // as few bevel steps as stay under half a pixel close up (2026-10-16): uvs are moved to where `seg`'s would be, so a
  // picture on a face still covers the same share of it
  const was = seg, n0 = was * 2 + 1;
  seg = Math.min(seg, r < 0.05 ? 1 : r < 0.2 ? 2 : seg);
  if (r < 0.003) {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (was + uv.getX(i)) / n0, (was + uv.getY(i)) / n0);
    return g;
  }
  const n = seg * 2 + 1, g = new THREE.BoxGeometry(1, 1, 1, n, n, n).toNonIndexed();
  if (seg !== was) {
    const uv = g.attributes.uv, to = (f) => { const i = Math.round(f * n); return (i <= seg ? i * was / seg : n0 - (n - i) * was / seg) / n0; };
    for (let i = 0; i < uv.count; i++) uv.setXY(i, to(uv.getX(i)), to(uv.getY(i)));
  }
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
function blob(w, h, d, e = 0.45, ev = 0.5, seg) {
  const ws = seg || Math.max(12, Math.min(32, round4(52 * Math.sqrt(Math.max(w, h, d) / 2))));
  const g = new THREE.SphereGeometry(1, ws, Math.max(seg ? 6 : 8, 2 * Math.round(ws * 20 / 64))), pos = g.attributes.position;
  const sp = (v, k) => Math.sign(v) * Math.pow(Math.abs(v), k);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), c = Math.hypot(x, z);
    const cr = Math.pow(c, ev), ux = c > 1e-6 ? x / c : 0, uz = c > 1e-6 ? z / c : 0;
    pos.setXYZ(i, w / 2 * cr * sp(ux, e), h / 2 * sp(y, ev), d / 2 * cr * sp(uz, e));
  }
  g.computeVertexNormals();
  return weld(g);
}

/* Round parts get as many sides as keep their outline within half a pixel at 128 pixels a tile (2026-10-16: a 1x1 piece
   ran to 20k triangles of 20-sided bolts and knobs): asked for 12 or more sides, a part r round gets `sides(r)`, a
   multiple of 4 so its widest points stay where they were, never under 8. Fewer than 12 asked for is a shape (a hexagon,
   an octagon) and is kept; `exact` keeps the count for a part whose vertices are moved after (flutes, ribs). */
const round4 = (v) => Math.ceil(v / 4) * 4;
const sides = (r, seg) => seg < 12 ? seg : Math.max(8, Math.min(seg, round4(35 * Math.sqrt(Math.abs(r)))));
const cyl = (rt, h, rb = rt, seg = 20, open = false, exact = false) => new THREE.CylinderGeometry(rt, rb, h, exact ? seg : sides(Math.max(rt, rb), seg), 1, open);
const ball = (r, w = 20, h = 14) => {
  const w2 = sides(r, w);
  return new THREE.SphereGeometry(r, w2, w2 === w || h < 8 ? h : Math.max(6, 2 * Math.round(h * w2 / w / 2)));
};
const lathe = (pts, seg = 28, exact = false) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y)),
  exact ? seg : sides(Math.max(...pts.map(p => p[0])), seg));
const torus = (R, r, arc = Math.PI * 2, seg = 28) => {
  const f = Math.min(1, arc / (Math.PI * 2)), all = seg < 12 ? seg : Math.max(Math.ceil(8 * f), Math.min(seg, Math.ceil(sides(R + r, 99) * f)));
  return new THREE.TorusGeometry(R, r, r < 0.016 ? 4 : r < 0.04 ? 8 : 10, all, arc);
};

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
  const col = parts.some(g => g.attributes.color) ? new Float32Array(n * 3).fill(1) : null;
  let at = 0;
  for (const g of parts) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, at * 3);
    nor.set(g.attributes.normal.array, at * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, at * 2);
    if (col && g.attributes.color) col.set(g.attributes.color.array, at * 3);
    at += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
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
  const into = (to) => (geo, m, x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) => {
    if (rx) geo.rotateX(rx);
    if (rz) geo.rotateZ(rz);
    if (ry) geo.rotateY(ry);
    geo.translate(x, y, z);
    if (m.userData.kind === 'wood') worldUV(geo, 1.4);
    else if (m.userData.kind === 'cloth') worldUV(geo, 3);
    if (!to.has(m)) to.set(m, []);
    to.get(m).push(geo);
    return geo;
  };
  const put = into(bins), doors = [], parts = [];
  return {
    p, pal, M, pic, put, bins, doors, parts, r: rng(id),
    /** A part of its own that moves (a swing on its chains): `K.part(name, [x, y, z])` returns a put for its parts, built
        in the model's frame; it's turned about that point, found as `model.userData.parts[name]`. */
    part: (name, at) => {
      const d = { name, at, bins: new Map() }, put = into(d.bins);
      parts.push(d);
      return (geo, m, x = 0, y = 0, z = 0, ...turn) => put(geo, m, x - at[0], y - at[1], z - at[2], ...turn);
    },
    /** A door of its own for js/base-play.js to swing (a fridge's, a wardrobe's): `K.door([x, z], side)` returns a put
        for its parts, built shut in the model's frame, hinged at x, z (side 1 its left edge, -1 its right); `K.inside`
        `{ x, y, w, h, z }` is where the picture of what's inside goes, behind it (`bare: true` for none, when the inside is
        modelled behind glass). */
    door: (hinge, side = 1) => { const d = { hinge, side, bins: new Map() }; doors.push(d); return into(d.bins); },
    wood: (h = pal.w) => M('wood', h), cloth: (h = pal.c) => M('cloth', h), plain: (h) => M('plain', h),
    metal: (h = pal.m) => M('metal', h), gloss: (h) => M('gloss', h), glass: () => M('glass', '#cfe8f4'), glow: (h = pal.g) => M('glow', h),
  };
}

// parts of one kind differing only in colour are drawn as one, their colours riding along as vertex colours
// (2026-10-16: a doll sewn in seven cloths was seven draws, a fridge's plain parts were never baked as it has doors):
// wood and cloth share one grain or weave texture; a lamp's glows are tinted by the vertex colour too, and still
// switched as one. Not glass (sorted by its mesh), nor the lamps of what blinks: js/base-play.js sets every lamp of a
// crossing, a signal or a beacon red.
const TINTABLE = new Set(['wood', 'cloth', 'glow', 'plain', 'gloss', 'metal']), BLINKS = new Set(['crossing', 'railsignal', 'beacon']);
const tintKey = (m, fam) => {
  const glow = m.userData.kind === 'glow';
  if (!TINTABLE.has(m.userData.kind) || m.vertexColors || Object.keys(m.userData).length !== (glow ? 2 : 1) || (glow && (!m.userData.lamp || BLINKS.has(fam)))) return m;
  return [m.userData.kind, m.map?.uuid, m.roughness, m.metalness, m.side, m.transparent, m.opacity, m.alphaTest, m.depthWrite, m.depthTest,
    m.polygonOffset, m.polygonOffsetFactor, m.polygonOffsetUnits, m.blending, m.envMapIntensity, glow ? m.emissiveIntensity : m.emissive.getHex(), m.flatShading].join('|');
};
const glowTint = (m) => {
  m.emissive.set('#ffffff');
  m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= vColor.rgb;'); };
  m.customProgramCacheKey = () => 'glow-tint';
};

function assemble(K, bins = K.bins) {
  const g = new THREE.Group(), sets = new Map();
  for (const [m, geos] of bins) {
    const k = tintKey(m, K.p.fam);
    if (!sets.has(k)) sets.set(k, []);
    sets.get(k).push([m, geos]);
  }
  for (const list of sets.values()) {
    let [[m, geos]] = list;
    if (list.length > 1) {
      geos = list.flatMap(([mm, gs]) => gs.map(geo => {
        const n = geo.attributes.position.count, c = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) c.set([mm.color.r, mm.color.g, mm.color.b], i * 3);
        geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
        return geo;
      }));
      m = m.clone();
      m.color.set('#ffffff'); m.vertexColors = true;
      if (m.userData.kind === 'glow') glowTint(m);
    }
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
      K.put(ball(0.2 + R() * 0.05, 16, 10), p, x, 0.22, 0.12 + R() * 0.05);
      K.put(ball(0.24 + R() * 0.05, 16, 10), p, x, 0.62 + R() * 0.08, -0.22);
    }
    for (const x of [-W / 2 + 0.16, W / 2 - 0.16]) K.put(ball(0.22, 16, 10), p, x, 0.45, 0.06);
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
  if (s.items) ITEMS[K.p.fam.replace(/desk$/, '')](K, L, h);
  else if (s.thing) thing(K, s, D, 0.02);
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
  if (s.items) ITEMS[K.p.fam.replace(/counter$/, '')](K, L, h);
  else if (s.thing) thing(K, s, D, s.sink ? -0.05 : 0);
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
  const g = ball(1, 10, 4).scale(wid, 0.012, len / 2);
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
      const g = ball(1, 8, 4).scale(0.04, 0.008, 0.12);
      g.rotateY(a + Math.PI / 2); g.translate(x + Math.sin(a) * t * 0.6, y - t * t * 0.4, z + Math.cos(a) * t * 0.6);
      K.put(g, leafM[(s + 1) % 2]);
    }
  }
};

/* a globe and a drum kit, modelled (their paintings' side views came out as stacked blocks) */

/** An Earth for the globe: seas and a few seeded continents, wrapped round a sphere. */
function earth() {
  if (shared.earth) return shared.earth;
  const c = new OffscreenCanvas(512, 256), g = c.getContext('2d'), r = rng('earth');
  g.fillStyle = '#3f84d8'; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 9; i++) {
    const cx = r() * 512, cy = 50 + r() * 156, n = 6 + Math.floor(r() * 6);
    g.fillStyle = r() < 0.75 ? '#58b048' : '#c8a868';
    for (let k = 0; k < n; k++) { g.beginPath(); g.ellipse((cx + (r() - 0.5) * 90 + 512) % 512, cy + (r() - 0.5) * 50, 14 + r() * 26, 10 + r() * 18, r() * 3, 0, Math.PI * 2); g.fill(); }
  }
  g.fillStyle = '#f0f6fa'; g.fillRect(0, 0, 512, 14); g.fillRect(0, 242, 512, 14);
  return (shared.earth = canvasTex(c, false));
}
B.globe = (K) => {
  const wood = K.wood(), brass = K.metal('#d8b048'), R = 0.27, cy = 0.66, tilt = 0.41;
  K.put(lathe([[0.2, 0], [0.21, 0.03], [0.17, 0.06], [0.07, 0.12], [0.045, 0.2], [0.04, 0.3], [0.06, 0.33], [0.0, 0.34]], 28), wood, 0, 0, 0);
  const ring = torus(R + 0.04, 0.012, Math.PI * 1.1, 40);
  ring.rotateZ(-Math.PI * 0.05 - tilt); ring.rotateY(Math.PI / 2);
  K.put(ring, brass, 0, cy, 0);
  K.put(cyl(0.012, 0.1, 0.012, 8), brass, 0, 0.36, 0);
  const m = new THREE.MeshStandardMaterial({ map: earth(), roughness: 0.45 });
  m.userData.kind = 'pic'; m.userData.pivot = { y: cy, tilt };
  K.put(ball(R, 40, 28), m, 0, cy, 0);
};
B.drumkit = (K, s, W) => {
  const shell = K.gloss(K.pal.c || '#c83838'), head = K.plain('#f6f2ea'), chrome = K.metal('#d8dce4'), brass = K.metal('#e0b840');
  const drum = (r, d, x, y, z, tiltX = 0, tiltZ = 0) => {
    K.put(cyl(r, d, r, 32), shell, x, y, z, 0, tiltX, tiltZ);
    for (const sgn of [-1, 1]) K.put(cyl(r * 1.03, 0.02, r * 1.03, 32).translate(0, sgn * d / 2, 0), chrome, x, y, z, 0, tiltX, tiltZ);
    K.put(cyl(r * 0.97, d + 0.01, r * 0.97, 32), head, x, y, z, 0, tiltX, tiltZ);
  };
  // the bass drum on its side, its front head painted
  K.put(cyl(0.3, 0.32, 0.3, 36), shell, 0, 0.31, -0.05, 0, Math.PI / 2);
  for (const z of [-0.21, 0.11]) K.put(torus(0.3, 0.018, Math.PI * 2, 36), chrome, 0, 0.31, z);
  const face = new THREE.MeshStandardMaterial({ map: drumHead(K.pal.c || '#c83838'), roughness: 0.6 }); face.userData.kind = 'pic';
  K.put(new THREE.CircleGeometry(0.29, 36), face, 0, 0.31, 0.112);
  K.put(new THREE.CircleGeometry(0.29, 36), head, 0, 0.31, -0.212, Math.PI);
  // toms over it, the floor tom and the snare either side
  drum(0.13, 0.13, -0.15, 0.7, 0.0, 0.35, 0.1); drum(0.14, 0.14, 0.16, 0.7, 0.0, 0.35, -0.1);
  drum(0.18, 0.3, W / 2 - 0.3, 0.3, 0.1);
  drum(0.16, 0.1, -W / 2 + 0.34, 0.55, 0.12, 0.15);
  K.put(cyl(0.012, 0.5, 0.012, 8), chrome, -W / 2 + 0.34, 0.25, 0.12);
  // cymbals on stands
  for (const [x, z, h, r] of [[-W / 2 + 0.12, -0.05, 0.85, 0.15], [-0.42, -0.2, 1.15, 0.2], [W / 2 - 0.15, -0.18, 1.08, 0.21]]) {
    K.put(cyl(0.01, h, 0.01, 8), chrome, x, h / 2, z);
    for (const a of [0, 2.1, 4.2]) K.put(cyl(0.008, 0.16, 0.008, 6), chrome, x + Math.sin(a) * 0.06, 0.06, z + Math.cos(a) * 0.06, 0, Math.cos(a) * 0.6, -Math.sin(a) * 0.6);
    K.put(lathe([[r, 0], [r * 0.6, 0.012], [0.03, 0.03], [0.02, 0.045], [0, 0.045]], 32), brass, x, h, z, 0, 0.12);
  }
  K.put(cyl(0.16, 0.06, 0.16, 20), K.cloth('#303038'), 0.05, 0.5, -0.45);
  K.put(cyl(0.02, 0.48, 0.02, 8), chrome, 0.05, 0.24, -0.45);
};
function drumHead(colour) {
  const c = new OffscreenCanvas(256, 256), g = c.getContext('2d');
  g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = colour; g.beginPath(); g.arc(128, 128, 70, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f6f2ea'; g.beginPath(); g.arc(128, 128, 40, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#202028'; g.beginPath(); g.arc(128, 128, 6, 0, Math.PI * 2); g.fill();
  const t = canvasTex(c, false); t.userData.keep = false;
  return t;
}

/* the home arcade's machines (the user's ask, 2026-10-12: their painting showed on every side): modelled cabinets, the
   game only on the front, its pictures js/arcade-art.js's */
/* a picture is laid a hair over its surface, and seen from across the Game Corner the depth buffer can't tell them
   apart, so it flickered (2026-10-12): pulled forward in depth too */
const OVER = { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 };
function litPic(c, k = 0.55) {
  const key = 'lit:' + k;
  c.mats = c.mats || {};
  if (c.mats[key]) return c.mats[key];
  const t = canvasTex(c, false);
  const m = new THREE.MeshStandardMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: k, roughness: 0.35, ...OVER });
  m.userData.kind = 'pic';
  return (c.mats[key] = m);
}
function decal(c) {
  c.mats = c.mats || {};
  if (c.mats.decal) return c.mats.decal;
  const m = new THREE.MeshStandardMaterial({ map: canvasTex(c, false), roughness: 0.3, transparent: true, alphaTest: 0.05, depthWrite: false, ...OVER });
  m.userData.kind = 'pic';
  return (c.mats.decal = m);
}
/** A slab cut out of a side profile ([z, y] points), `t` thick, between x0 and x0 + t. */
function profileSlab(pts, t, x0, bevel = 0.012) {
  const sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: t - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2 });
  g.translate(0, 0, bevel);
  g.rotateY(-Math.PI / 2);
  g.translate(x0 + t, 0, 0);
  return g;
}
const CAB = [[-0.34, 0], [0.3, 0], [0.3, 0.8], [0.4, 0.86], [0.4, 0.94], [0.2, 1.06], [0.12, 1.5], [0.27, 1.58], [0.27, 1.92], [-0.34, 1.92]];
B.arcade = (K, s) => {
  const col = s.colour, half = 0.42, T = 0.07, body = K.gloss('#22222c'), side = K.gloss(col), trim = K.metal('#c8ccd8');
  // the two coloured sides, the black body between them, a chrome T-moulding along each side's front edge
  for (const x of [-half, half - T]) K.put(profileSlab(CAB, T, x), side);
  K.put(profileSlab(CAB, half * 2 - T * 2, -half + T, 0.004), body);
  const art = sideArt(col);
  for (const sg of [-1, 1]) {
    const pl = new THREE.PlaneGeometry(0.66, 0.66);
    K.put(pl, decal(art), sg * (half + 0.008), 0.5, -0.02, sg * Math.PI / 2);
  }
  for (const sg of [-1, 1]) {
    K.put(rbox(0.016, 0.8, 0.016, 0.006), trim, sg * (half - 0.004), 0.4, 0.302);
    K.put(rbox(0.016, 0.34, 0.016, 0.006), trim, sg * (half - 0.004), 1.75, 0.272);
  }
  // the lower front: coin door, slots lit, a kick plate
  K.put(rbox(0.26, 0.3, 0.02, 0.01), K.metal('#8a8e9a'), 0, 0.46, 0.306);
  for (const x of [-0.06, 0.06]) { K.put(rbox(0.05, 0.08, 0.012, 0.004), K.glow('#ff5a2a'), x, 0.52, 0.318); K.put(rbox(0.008, 0.04, 0.01), K.plain('#101014'), x, 0.52, 0.322); }
  K.put(rbox(0.04, 0.04, 0.012, 0.006), K.metal('#d8dce4'), 0.08, 0.38, 0.318);
  K.put(rbox(half * 2 - T * 2, 0.07, 0.02, 0.008), trim, 0, 0.035, 0.305);
  // the control deck on the slope, its stick and buttons standing up off it
  const deck = (geo, m, x, up, along) => { geo.translate(x, up, along); K.put(geo, m, 0, 1.0, 0.3, 0, 0.54); };
  deck(rbox(half * 2 - T * 2 - 0.02, 0.016, 0.22, 0.006), K.gloss(tone(col, 0.55)), 0, 0.008, 0);
  deck(cyl(0.04, 0.012, 0.04, 20), K.plain('#101014'), -0.16, 0.02, 0.01);
  deck(cyl(0.009, 0.08, 0.009, 10), trim, -0.16, 0.06, 0.01);
  deck(ball(0.032, 20, 14), K.gloss('#e83838'), -0.16, 0.11, 0.01);
  for (const [x, c] of [[0.02, '#f8d030'], [0.1, '#3a9af8'], [0.18, '#58d858']]) {
    deck(cyl(0.028, 0.012, 0.03, 18), K.plain('#101014'), x, 0.02, 0.02);
    deck(cyl(0.022, 0.022, 0.022, 18), K.gloss(c), x, 0.034, 0.02);
  }
  // the screen in its bezel, leaning back
  const lean = (geo, m, up, out) => { geo.translate(0, up, out); K.put(geo, m, 0, 1.28, 0.16, 0, -0.18); };
  lean(rbox(half * 2 - T * 2 - 0.02, 0.44, 0.02, 0.01), K.gloss('#0c0c12'), 0, 0.006);
  const scr = screenArt(K.p.fam);
  if (scr) lean(new THREE.PlaneGeometry(0.52, 0.39), litPic(scr, 0.8), 0, 0.03);
  lean(new THREE.PlaneGeometry(0.56, 0.42), K.glass(), 0, 0.045);
  // the marquee, lit, a glow strip under its hood and a cap on top
  K.put(new THREE.PlaneGeometry(0.66, 0.26), litPic(marqueeArt(s.name, col), 0.75), 0, 1.75, 0.285);
  K.put(rbox(half * 2 - T * 2, 0.02, 0.1, 0.008), K.glow('#fff4d0'), 0, 1.57, 0.22, 0, 0.5);
  K.put(rbox(half * 2 + 0.01, 0.03, 0.64, 0.012), side, 0, 1.935, -0.035);
};
B.whack = (K) => {
  const gold = K.gloss('#f0b028'), red = K.gloss('#d83a2a'), wood = K.wood('#9a6a3a'), dirt = K.cloth('#6a4224');
  K.put(rbox(0.86, 0.7, 0.82, 0.05), gold, 0, 0.35, 0);
  K.put(rbox(0.9, 0.06, 0.86, 0.025), K.plain('#3a2a1a'), 0, 0.03, 0);
  K.put(new THREE.PlaneGeometry(0.76, 0.5), litPic(whackFront(), 0.25), 0, 0.37, 0.42);
  // the play top: a padded red rim round the dirt, five holes, three Digletts up
  K.put(rbox(0.92, 0.08, 0.88, 0.035), red, 0, 0.73, 0);
  K.put(rbox(0.78, 0.04, 0.74, 0.015), dirt, 0, 0.76, 0);
  const holes = [[-0.24, -0.16], [0.24, -0.16], [0, 0], [-0.24, 0.17], [0.24, 0.17]];
  for (const [x, z] of holes) {
    K.put(cyl(0.1, 0.012, 0.1, 24), K.plain('#1a0e06'), x, 0.783, z);
    K.put(torus(0.1, 0.012, Math.PI * 2, 24), K.cloth('#8a5a30'), x, 0.783, z, 0, Math.PI / 2);
  }
  const mole = K.gloss('#a8683a'), nose = K.gloss('#f0a0a8'), eye = K.plain('#141418');
  for (const [i, up] of [[0, 0.16], [2, 0.11], [4, 0.19]]) {
    const [x, z] = holes[i], y = 0.78;
    K.put(cyl(0.068, up, 0.075, 20), mole, x, y + up / 2, z);
    K.put(ball(0.068, 20, 12), mole, x, y + up, z);
    K.put(blob(0.07, 0.042, 0.04, 0.7, 0.7), nose, x, y + up - 0.03, z + 0.06);
    for (const sg of [-1, 1]) K.put(blob(0.016, 0.034, 0.014, 0.8, 0.8), eye, x + sg * 0.022, y + up + 0.012, z + 0.058);
  }
  // the backboard and its lit sign, posts either side
  for (const sg of [-1, 1]) K.put(rbox(0.06, 0.62, 0.06, 0.02), red, sg * 0.42, 1.06, -0.4);
  K.put(rbox(0.9, 0.44, 0.06, 0.03), red, 0, 1.2, -0.41);
  K.put(new THREE.PlaneGeometry(0.82, 0.36), litPic(whackSign(), 0.7), 0, 1.2, -0.37);
  for (let i = 0; i < 7; i++) K.put(ball(0.018, 10, 8), K.glow('#ffe890'), -0.39 + i * 0.13, 1.44, -0.4);
  // the mallet lying across the front corner
  K.put(cyl(0.016, 0.42, 0.016, 10), wood, 0.2, 0.8, 0.36, -0.5, 0, Math.PI / 2);
  K.put(blob(0.12, 0.13, 0.13, 0.6, 0.9), K.gloss('#e83838'), 0.38, 0.81, 0.47, -0.5, 0, Math.PI / 2);
};
/* `s.table` one of the newer tables (js/pinball-*.js): its own cabinet colours and pictures */
const PIN_LOOK = { gengar: ['#2a1048', '#9cf060', '#b070ff'], lapras: ['#0a3a6a', '#f08a5a', '#5ad0ff'], volcano: ['#2a1410', '#f06a20', '#ffb030'], skypillar: ['#1a4a3a', '#f8d030', '#5ae0a0'] };
B.pinball = (K, s = {}) => {
  const [body, box, strip] = PIN_LOOK[s.table] || ['#3a1a6a', '#e8c030', '#ff70c0'];
  const purple = K.gloss(body), chrome = K.metal('#d8dce4'), yellow = K.gloss(box), W = 0.6, D = 0.94, tilt = -0.07;
  // legs, the tilted table on them, its playfield lit under the glass, a lockdown bar
  for (const [x, z, h] of [[-W / 2 + 0.04, D / 2 - 0.06, 0.62], [W / 2 - 0.04, D / 2 - 0.06, 0.62], [-W / 2 + 0.04, -D / 2 + 0.06, 0.7], [W / 2 - 0.04, -D / 2 + 0.06, 0.7]]) {
    K.put(cyl(0.024, h, 0.03, 12), chrome, x, h / 2, z);
    K.put(cyl(0.04, 0.03, 0.04, 14), chrome, x, 0.015, z);
  }
  const table = (geo, m, x, up, z) => { geo.translate(x, up, z); K.put(geo, m, 0, 0.79, 0, 0, tilt); };
  table(rbox(W, 0.22, D, 0.03), purple, 0, 0, 0);
  table(new THREE.PlaneGeometry(W - 0.08, D - 0.1).rotateX(-Math.PI / 2), litPic(pinField(s.table), 0.55), 0, 0.12, 0);
  table(new THREE.PlaneGeometry(W - 0.06, D - 0.08).rotateX(-Math.PI / 2), K.glass(), 0, 0.132, 0);
  for (const sg of [-1, 1]) table(rbox(0.03, 0.03, D - 0.02, 0.01), chrome, sg * (W / 2 - 0.015), 0.125, 0);
  table(rbox(W, 0.03, 0.06, 0.012), chrome, 0, 0.12, D / 2 - 0.03);
  // flipper buttons on the sides, the plunger at the front right, a coin door
  for (const sg of [-1, 1]) table(cyl(0.02, 0.025, 0.02, 14).rotateZ(Math.PI / 2), K.gloss('#e83838'), sg * (W / 2 + 0.01), 0.04, D / 2 - 0.14);
  table(cyl(0.012, 0.1, 0.012, 10).rotateX(Math.PI / 2), chrome, W / 2 - 0.08, 0.02, D / 2 + 0.05);
  table(ball(0.022, 14, 10), K.gloss('#e83838'), W / 2 - 0.08, 0.02, D / 2 + 0.1);
  table(rbox(0.2, 0.12, 0.012, 0.006), K.metal('#8a8e9a'), 0, -0.02, D / 2 + 0.004);
  for (const x of [-0.04, 0.04]) table(rbox(0.03, 0.05, 0.01, 0.004), K.glow('#ff5a2a'), x, -0.01, D / 2 + 0.012);
  // the backbox, its backglass lit, a speaker grille under it
  K.put(rbox(W + 0.02, 0.62, 0.16, 0.025), yellow, 0, 1.28, -D / 2 + 0.06);
  K.put(rbox(W - 0.06, 0.04, 0.12, 0.01), purple, 0, 0.95, -D / 2 + 0.07);
  K.put(new THREE.PlaneGeometry(W - 0.08, 0.5), litPic(pinGlass(s.table), 0.75), 0, 1.3, -D / 2 + 0.152);
  for (const sg of [-1, 1]) K.put(rbox(0.04, 0.5, 0.04, 0.015), K.glow(strip), sg * (W / 2 + 0.005), 1.3, -D / 2 + 0.13);
};

/* the Game Corner's games, played at home (2026-10-12, the user's ask: they were still their painting puffed up) */
B.slot = (K) => {
  const red = K.gloss('#c82838'), dark = K.gloss('#7a1020'), gold = K.metal('#e8b830'), chrome = K.metal('#d8dce4');
  // the base, its belly glass lit, a gold kick strip and the coin tray
  K.put(rbox(0.8, 0.62, 0.62, 0.04), red, 0, 0.31, 0);
  K.put(rbox(0.82, 0.06, 0.64, 0.02), gold, 0, 0.03, 0);
  K.put(new THREE.PlaneGeometry(0.62, 0.42), litPic(slotBelly(), 0.6), 0, 0.33, 0.312);
  K.put(rbox(0.5, 0.07, 0.14, 0.02), chrome, 0, 0.66, 0.28);
  for (const [x, z] of [[-0.12, 0.29], [-0.06, 0.3], [0.1, 0.28]]) K.put(cyl(0.03, 0.008, 0.03, 16), gold, x, 0.7, z);
  // the upper cabinet, the button deck sticking out under the reels
  K.put(rbox(0.76, 0.96, 0.5, 0.04), red, 0, 1.1, -0.05);
  K.put(rbox(0.78, 0.05, 0.2, 0.015), dark, 0, 0.74, 0.25);
  for (const [x, c] of [[-0.2, '#f8d030'], [-0.05, '#58b8f8'], [0.1, '#58d858'], [0.24, '#e83838']]) {
    K.put(cyl(0.032, 0.02, 0.034, 18), K.plain('#141418'), x, 0.775, 0.27);
    K.put(cyl(0.026, 0.024, 0.026, 18), K.glow(c), x, 0.79, 0.27);
  }
  // three reels on their drums behind the glass, a win line across them, a bezel round the window
  const reel = litPic(reelArt(), 0.45);
  for (const x of [-0.18, 0, 0.18]) {
    const g = cyl(0.15, 0.155, 0.15, 36), uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
    K.put(g, reel, x, 1.12, 0.06, 0, 0, Math.PI / 2);
  }
  K.put(rbox(0.6, 0.012, 0.01, 0.004), K.glow('#ff4040'), 0, 1.12, 0.215);
  for (const [w, h, x, y] of [[0.64, 0.06, 0, 1.33], [0.64, 0.06, 0, 0.91], [0.06, 0.48, -0.3, 1.12], [0.06, 0.48, 0.3, 1.12]]) K.put(rbox(w, h, 0.1, 0.02), gold, x, y, 0.2);
  K.put(new THREE.PlaneGeometry(0.56, 0.38), K.glass(), 0, 1.12, 0.24);
  for (const sg of [-1, 1]) K.put(new THREE.PlaneGeometry(0.5, 0.5), decal(sideArt('#c82838')), sg * 0.405, 0.36, -0.02, sg * Math.PI / 2);
  // the lever on the right, the topper with its lit name and a dome light
  K.put(ball(0.05, 18, 12), chrome, 0.41, 1.0, 0.02);
  K.put(cyl(0.016, 0.46, 0.016, 12), chrome, 0.44, 1.23, 0.02, 0, 0, -0.12);
  K.put(ball(0.055, 20, 14), K.gloss('#e83838'), 0.47, 1.47, 0.02);
  K.put(rbox(0.8, 0.3, 0.46, 0.05), dark, 0, 1.73, -0.04);
  K.put(new THREE.PlaneGeometry(0.72, 0.26), litPic(marqueeArt('SLOTS', '#d82838'), 0.75), 0, 1.73, 0.196);
  K.put(new THREE.SphereGeometry(0.09, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), K.glow('#ffd84a'), 0, 1.88, -0.04);
};

/** A card table, 2 tiles across: a half-round top on a pedestal or legs, its felt painted for the game, a padded rail
    round the players' side, cards dealt, and the game's name lit on a sign at the dealer's side. */
B.cardtable = (K, s) => {
  const bj = s.game === 'blackjack', H = 0.78, RX = 0.96, RZ = 0.86, BACK = -0.42;
  const edge = (k = 1, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n * Math.PI; return new THREE.Vector2(RX * k * Math.cos(t), -BACK - RZ * k * Math.sin(t)); });
  const flat = (geo) => { geo.rotateX(-Math.PI / 2); return geo; };
  const wood = K.wood(bj ? '#6a3a1a' : '#3a3a48'), leather = K.gloss('#1a1214'), gold = K.metal('#e8b830'), chrome = K.metal('#d8dce4');
  // the apron and top
  K.put(flat(new THREE.ExtrudeGeometry(new THREE.Shape(edge()), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 4 })), wood, 0, H - 0.12, 0);
  const felt = flat(new THREE.ShapeGeometry(new THREE.Shape(edge(0.93)), 4)), uv = felt.attributes.uv, pos = felt.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + RX) / (RX * 2), 1 - (pos.getZ(i) - BACK) / RZ);
  K.put(felt, litPic(feltArt(bj ? 'blackjack' : 'highlow'), 0.2), 0, H, 0);
  // the padded rail round the front, ending on brass caps at the dealer's side
  const curve = new THREE.CatmullRomCurve3(edge(0.97, 30).map(v => new THREE.Vector3(v.x, 0, -v.y)));
  K.put(new THREE.TubeGeometry(curve, 60, 0.045, 10, false), leather, 0, H + 0.02, 0);
  for (const sg of [-1, 1]) K.put(ball(0.048, 14, 10), gold, sg * RX * 0.97, H + 0.02, BACK);
  // the stand
  if (bj) {
    K.put(rbox(1.1, H - 0.16, 0.34, 0.06), wood, 0, (H - 0.16) / 2 + 0.04, 0);
    K.put(rbox(1.3, 0.06, 0.5, 0.025), K.plain('#2a1a10'), 0, 0.03, 0);
  } else {
    for (const [x, z] of [[-0.7, -0.3], [0.7, -0.3], [-0.5, 0.25], [0.5, 0.25]]) { K.put(cyl(0.025, H - 0.12, 0.03, 12), chrome, x, (H - 0.12) / 2, z); K.put(cyl(0.05, 0.03, 0.05, 14), chrome, x, 0.015, z); }
    K.put(rbox(1.3, 0.03, 0.04, 0.01), chrome, 0, 0.18, -0.3);
  }
  // cards: face up for the hands, a shoe or a deck for the dealer, every face read off one sheet so they draw as one
  // (2026-10-16: nine faces were nine draws), half a pixel in from each so a neighbour never bleeds in
  const deal = bj ? ['As', 'Kh', '9d', '7c', 'Qs', ''] : ['3h', '7s', '9d', ''], faces = remember(`cards|${s.game}`, () => {
    const c = new OffscreenCanvas(128 * deal.length, 176), g = c.getContext('2d');
    deal.forEach((f, i) => g.drawImage(f ? cardFace(f[0], f[1]) : cardBack(), i * 128, 0));
    return c;
  });
  const face = (f) => {
    const geo = new THREE.PlaneGeometry(0.12, 0.165), uv = geo.attributes.uv, i = deal.indexOf(f);
    for (let v = 0; v < uv.count; v++) uv.setX(v, (i * 128 + 0.5 + uv.getX(v) * 127) / faces.width);
    return geo;
  };
  const card = (rank, suit, x, z, turn = 0) => {
    K.put(rbox(0.13, 0.004, 0.18, 0.002), K.plain('#fffaf0'), x, H + 0.003, z, turn);
    K.put(face(rank ? rank + suit : ''), litPic(faces, 0.12), x, H + 0.0065, z, turn, -Math.PI / 2);
  };
  if (bj) {
    card('A', 's', -0.06, -0.18, 0.08); card('K', 'h', 0.06, -0.18, -0.06);
    card('9', 'd', -0.5, 0.14, 0.5); card('7', 'c', -0.42, 0.18, 0.4);
    card('Q', 's', 0.42, 0.18, -0.4); card(null, null, 0.5, 0.14, -0.5);
    K.put(rbox(0.16, 0.1, 0.24, 0.015), K.gloss('#2a1a10'), 0.62, H + 0.05, -0.28, -0.3);
    K.put(new THREE.PlaneGeometry(0.12, 0.08), litPic(cardBack(), 0.1), 0.66, H + 0.07, -0.18, -0.3, -0.5);
    // the dealer's chip tray and chips on the players' spots
    K.put(rbox(0.6, 0.03, 0.12, 0.01), K.plain('#141010'), 0, H + 0.015, -0.34);
    ['#d82838', '#2858b8', '#3a9a48', '#202028', '#e8b830'].forEach((c, i) => { for (let n = 0; n < 5; n++) K.put(cyl(0.024, 0.008, 0.024, 16), K.gloss(c), -0.22 + i * 0.11, H + 0.035 + n * 0.009, -0.34); });
    for (const [x, z, c, n] of [[-0.3, 0.3, '#d82838', 4], [0.3, 0.3, '#2858b8', 3], [0, 0.36, '#3a9a48', 5]]) for (let i = 0; i < n; i++) K.put(cyl(0.03, 0.01, 0.03, 18), K.gloss(c), x, H + 0.006 + i * 0.011, z);
  } else {
    card('3', 'h', -0.22, -0.02); card('7', 's', 0, -0.02); card('9', 'd', 0.22, -0.02);
    for (let i = 0; i < 8; i++) K.put(rbox(0.13, 0.006, 0.18, 0.002), K.plain(i % 2 ? '#f0e8d8' : '#fffaf0'), 0.02, H + 0.004 + i * 0.006, -0.3);
    K.put(face(''), litPic(faces, 0.12), 0.02, H + 0.053, -0.3, 0, -Math.PI / 2);
    // the HIGH and LOW buttons on the rail
    for (const [x, c] of [[-0.55, '#58d858'], [0.55, '#f05050']]) {
      K.put(cyl(0.07, 0.03, 0.075, 22), chrome, x, H + 0.02, 0.36);
      K.put(new THREE.SphereGeometry(0.06, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), K.glow(c), x, H + 0.035, 0.36);
    }
  }
  // the game's name lit over the dealer's side
  for (const sg of [-1, 1]) K.put(cyl(0.014, 0.42, 0.014, 10), chrome, sg * 0.36, H + 0.21, -0.45);
  K.put(rbox(0.84, 0.26, 0.04, 0.02), K.gloss('#141018'), 0, H + 0.5, -0.45);
  K.put(new THREE.PlaneGeometry(0.8, 0.22), litPic(marqueeArt(bj ? 'BLACKJACK' : 'HIGH-LOW', bj ? '#3a9a48' : '#2a6ad8'), 0.75), 0, H + 0.5, -0.428);
};

/** The Plinko board, hung on the wall (its back at z 0): a gold frame, the board's face, real pegs and a Poké Ball
    bouncing down them, a neon bar over it. */
B.plinko = (K) => {
  const W = 0.86, H = 1.78, Y = 1.86, gold = K.metal('#e8b830'), peg = K.metal('#e8ecf4');
  K.put(rbox(W, H, 0.07, 0.025), gold, 0, Y, 0.035);
  K.put(new THREE.PlaneGeometry(W - 0.08, H - 0.08), litPic(plinkoFace(), 0.5), 0, Y, 0.072);
  const rows = 10, gap = 0.08, top = Y + H / 2 - 0.26;
  for (let r = 0; r < rows; r++) {
    const n = r % 2 ? 8 : 9, x0 = -(n - 1) * gap / 2;
    for (let i = 0; i < n; i++) {
      K.put(cyl(0.011, 0.05, 0.011, 6), peg, x0 + i * gap, top - r * 0.11, 0.097, 0, Math.PI / 2);
      K.put(ball(0.014, 8, 4), peg, x0 + i * gap, top - r * 0.11, 0.122);
    }
  }
  const bx = 0.04, by = top - 3 * 0.11 + 0.035, bz = 0.12;
  K.put(new THREE.SphereGeometry(0.034, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), K.gloss('#e83838'), bx, by, bz);
  K.put(new THREE.SphereGeometry(0.034, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), K.gloss('#f4f4f4'), bx, by, bz);
  K.put(torus(0.034, 0.005, Math.PI * 2, 24), K.plain('#202028'), bx, by, bz, 0, Math.PI / 2);
  K.put(rbox(W * 0.7, 0.06, 0.06, 0.02), K.glow('#4ae8f0'), 0, Y + H / 2 + 0.05, 0.05);
};

B.pyramid = (K) => {
  const stone = K.plain('#d8b878'), dark = K.plain('#b89058');
  for (let i = 0; i < 6; i++) {
    const w = 0.84 - i * 0.14, h = 0.11;
    K.put(rbox(w, h, w, 0.01), i % 2 ? dark : stone, 0, 0.055 + i * h, 0);
  }
  const cap = new THREE.ConeGeometry(0.1, 0.14, 4); cap.rotateY(Math.PI / 4);
  K.put(cap, K.metal('#f0c848'), 0, 0.73, 0);
};
B.toilet = (K) => {
  const china = K.gloss('#f6f6f2');
  K.put(lathe([[0.13, 0], [0.12, 0.08], [0.15, 0.2], [0.21, 0.36], [0.2, 0.4], [0, 0.4]], 28), china, 0, 0, 0.06);
  const seat = torus(0.17, 0.03, Math.PI * 2, 28); seat.rotateX(Math.PI / 2); seat.scale(1, 1, 1.15);
  K.put(seat, K.gloss(K.pal.c || '#f6f6f2'), 0, 0.42, 0.06);
  K.put(rbox(0.42, 0.4, 0.17, 0.03), china, 0, 0.6, -0.24);
  K.put(rbox(0.46, 0.04, 0.2, 0.015), china, 0, 0.82, -0.24);
  K.put(rbox(0.08, 0.025, 0.03, 0.01), K.metal('#c8ccd4'), 0.13, 0.74, -0.14);
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

/** Taubin smoothing (a shrink step, then a grow step, so it doesn't shrink): the surface nets mesh steps a little at
    every painted row, which read as a 3D print's layers (the user's word, 2026-10-09). */
function taubin(P, idx, nv, passes) {
  const sum = new Float32Array(nv * 3), cnt = new Uint16Array(nv);
  for (let pass = 0; pass < passes * 2; pass++) {
    const k = pass % 2 ? -0.53 : 0.5;
    sum.fill(0); cnt.fill(0);
    for (let t = 0; t < idx.length; t += 3) for (let e = 0; e < 3; e++) {
      const a = idx[t + e], b = idx[t + (e + 1) % 3];
      for (const [p, q] of [[a, b], [b, a]]) { sum[p * 3] += P[q * 3]; sum[p * 3 + 1] += P[q * 3 + 1]; sum[p * 3 + 2] += P[q * 3 + 2]; cnt[p]++; }
    }
    for (let q = 0; q < nv; q++) if (cnt[q]) for (let c = 0; c < 3; c++) P[q * 3 + c] += k * (sum[q * 3 + c] / cnt[q] - P[q * 3 + c]);
  }
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
  taubin(P3, net.idx, nv, 8);
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
  const p = PIECES[id], full = p.art(0, 1, true);
  const ball = ORBS.has(p.fam) ? remember(`${p.fam}|ball`, () => ballOf(full, MERIDIAN.has(p.fam))) : null;
  // a ball's stand or base is made as before, from the rows under it
  const art = ball ? rowsBelow(full, ball.bottom) : full;
  const plan = remember(`${p.fam}|plan`, () => {
    const pl = roundPlan(art);
    if (pl && !pl.boxy && !ball && (!roundish(p) || p.group === 'Dolls')) pl.split = pl.j0;
    return pl;
  });
  if (!plan && !ball) return null;
  const mats = faces(p, id).map(paint), g = new THREE.Group();
  const add = (a, m) => { if (!a.pos.length) return; const geo = geoFrom(a); geo.scale(U, U, U); const mesh = new THREE.Mesh(geo, m); mesh.castShadow = mesh.receiveShadow = true; g.add(mesh); };
  if (plan) {
    const rows = rowsOf(art), j0 = rows.findIndex(r => r), j1 = rows.length - [...rows].reverse().findIndex(r => r);
    const split = plan.boxy ? j0 : plan.split;
    if (split > j0) {
      const arrs = remember(`${p.fam}|lathe`, () => latheArrays(full, j0, split));
      if (arrs) { add(arrs[0], mats[0]); add(arrs[1], mats[1]); }
    }
    if (split < j1) {
      const arrs = remember(`${p.fam}|hull`, () => hullArrays(p, split, j1, plan.boxy ? 'boxy' : roundish(p) ? 'round' : 'organic'));
      if (arrs) arrs.forEach((a, i) => add(a, mats[i]));
    }
  }
  if (ball) {
    // whatever stands on the ball (a stem, a cap) the same way
    if (ball.above) {
      const turns = ball.aboveTurns, arrs = remember(`${p.fam}|above`, () => turns ? latheArrays(full, ball.top, ball.j1) : hullArrays(p, ball.top, ball.j1, 'organic'));
      if (arrs) arrs.forEach((a, i) => add(a, mats[i]));
    }
    for (const mesh of ballMeshes(p, ball, mats, paint)) g.add(mesh);
  }
  return g.children.length ? g : null;
}

/* ---------- balls: a true sphere ---------- */

// round things whose hull came out lumpy (the user's ask, 2026-10-09: the item ball should be a whole sphere): the ball
// in their painting is a real one. Poké Balls wear a drawn ball, one button facing front (their paintings show it from
// every side); the rest wear their front painting on the front half and their back painting behind. A value in
// POKEBALLS is a fixed top colour, else the theme's, as `ballTop()` in js/base-furniture-rooms.js paints it.
const POKEBALLS = { itemball: null, balllamp: null, ballstatue: null, balldisplay: '#e04848' };
const ORBS = new Set([...Object.keys(POKEBALLS), 'beachball', 'redplanet', 'bandedplanet', 'blueplanet', 'greenplanet',
  'moonplanet', 'moonorb', 'crystalball', 'plasmaglobe', 'iceball', 'snowglobe', 'gumball', 'jackolantern']);
// model planets, painted under a metal meridian on their left and a pin on top (`planetStand()` in
// js/base-furniture-rooms4.js): the ball is read from its right half, and the meridian and pin are made, not painted on
const MERIDIAN = new Set(['redplanet', 'bandedplanet', 'blueplanet', 'greenplanet', 'moonplanet']);

/** The ball in a painting: its widest rows nearest the top, read as an ellipse (centre `cx`, `cy`, radii `rx`, `ry`, in
    painted units from the floor), `bottom` the row its stand or base starts under, `top` / `j1` the rows over it.
    `right`: read only the right half, the ball standing in the middle. */
function ballOf(art, right = false) {
  const rows = rowsOf(art), W = art.width;
  const j1 = rows.length - [...rows].reverse().findIndex(r => r);
  if (j1 > rows.length) return null;
  const half = right ? (r) => r.r - W / 2 : (r) => (r.r - r.l) / 2;
  let rx = 0, j = j1 - 1, was = Infinity, past = false;
  // down from the top past the widest row, while the rows keep narrowing: a neck or a wider base ends it
  for (; j >= 0 && rows[j]; j--) {
    const h = half(rows[j]);
    if (h > rx) rx = h;
    else if (h < rx - 0.5) past = true;
    if (past && (h > was + 0.5 || (h >= was && h < rx * 0.7))) break;
    was = h;
  }
  const bottom = j + 1, wide = [];
  for (let k = bottom; k < j1; k++) if (half(rows[k]) >= rx - 0.75) wide.push(k);
  const cy = (wide[0] + wide.at(-1)) / 2 + 0.5, mid = rows[Math.round(cy - 0.5)];
  // its height from how fast the rows narrow away from the middle, so a stem or a cap doesn't stretch it
  const est = [];
  for (let k = bottom; k < j1; k++) {
    const t = half(rows[k]) / rx, dy = Math.abs(k + 0.5 - cy);
    if (t > 0.35 && t < 0.92) est.push(dy / Math.sqrt(1 - t * t));
  }
  est.sort((a, b) => a - b);
  // a planet's meridian hugs it on both sides in the painting: its globe is 13 round
  if (right) rx = 13;
  const ry = right ? 13 : est.length ? Math.min(est[est.length >> 1], rx * 1.3) : rx;
  const top = Math.min(j1, Math.round(cy + ry * 0.9)), above = !right && j1 - (cy + ry) >= 2;
  const aboveTurns = above && rows.slice(top, j1).every(r => r && r.runs === 1 && Math.abs(r.l + r.r - W) <= 3);
  return { cx: right ? 0 : (mid.l + mid.r) / 2 - W / 2, cy, rx, ry, bottom, top, j1, above, aboveTurns, meridian: right, W, H: art.height };
}

/** A painting with only its rows under `j` (from the floor) left. */
function rowsBelow(art, j) {
  const c = new OffscreenCanvas(art.width, art.height);
  c.getContext('2d').drawImage(art, 0, art.height - j, art.width, j, 0, art.height - j, art.width, j);
  return c;
}

/** A Poké Ball drawn round a sphere (its uvs: u 0.25 faces front), `top` its upper half, `glow` its button's middle. */
function pokeBallArt(top, glow) {
  const c = new OffscreenCanvas(512, 256), g = c.getContext('2d');
  g.fillStyle = top; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#f4f4f0'; g.fillRect(0, 128, 512, 128);
  g.fillStyle = '#26262e'; g.fillRect(0, 120, 512, 16);
  const ring = (r, col) => { g.fillStyle = col; g.beginPath(); g.arc(128, 128, r, 0, Math.PI * 2); g.fill(); };
  ring(30, '#26262e'); ring(22, '#f4f4f0'); ring(15, '#d8d8d4'); ring(12.5, glow || '#fbfbf8');
  c.hd = HD;
  return c;
}

/** The ball as meshes, in tiles. */
function ballMeshes(p, b, mats, paint) {
  const at = (geo) => { geo.scale(b.rx, b.ry, b.rx); geo.translate(b.cx, b.cy, 0); geo.scale(U, U, U); return geo; };
  const mesh = (geo, m) => { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; return o; };
  if (p.fam in POKEBALLS) {
    const pal = p.pal || {}, top = POKEBALLS[p.fam] || (pal.c === '#f4f4f0' ? pal.w : pal.c) || '#e04848';
    const m = paint(pokeBallArt(top, p.glow?.[0]));
    m.roughness = 0.3;
    return [mesh(at(ball(1, 48, 32)), m)];
  }
  const out = [];
  if (b.meridian) {
    const pal = p.pal || {}, metal = new THREE.MeshStandardMaterial({ color: pal.m || '#5a5a68', roughness: 0.3, metalness: 0.45 });
    const arc = torus(b.rx + 2, 0.8, Math.PI, 32);
    arc.rotateZ(Math.PI / 2);
    arc.translate(b.cx, b.cy, 0);
    arc.scale(U, U, U);
    out.push(mesh(arc, metal));
    const pin = cyl(0.8, 3.5, 0.8, 12);
    pin.translate(b.cx, b.cy + b.ry + 2.5, 0);
    pin.scale(U, U, U);
    out.push(mesh(pin, new THREE.MeshStandardMaterial({ color: pal.a || '#e0b04a', roughness: 0.3, metalness: 0.45 })));
  }
  // each half wears its painting as seen straight on, read a little inside the outline so its rim never shows
  const k = 0.94;
  return out.concat([0, 1].map(back => {
    const geo = new THREE.SphereGeometry(1, 24, 32, back * Math.PI, Math.PI), pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = b.W / 2 + b.cx + pos.getX(i) * b.rx * k, y = b.cy + pos.getY(i) * b.ry * k;
      uv.setXY(i, back ? 1 - x / b.W : x / b.W, y / b.H);
    }
    return mesh(at(geo), mats[back]);
  }));
}

/* ---------- plants: a round pot, the leaves as crossed cards ---------- */

// plants on other shelves (every unshaped kind on the Plants shelf is one too), and open frames, ladders, stands and
// spindly things whose rounded hull lost their holes or their tops (the user's ask, 2026-10-09: the same as the plants)
const LEAFY = new Set(['alienplant', 'appletree', 'citrustree', 'datepalm', 'deadtree', 'palmtree', 'orchidstand',
  'topiary', 'tomatovine', 'kelp', 'iceflower', 'sakura', 'fancoral', 'beanpole', 'plantstair', 'gourdarch', 'cornrow',
  'coatrack', 'gong', 'slide', 'rosearch', 'hurdle', 'pullupbar', 'refstand', 'lifeguard', 'dumbbells', 'easel', 'ferriswheel',
  'bunkbed', 'towelladder', 'crib', 'skirack', 'xylophone', 'logpile', 'skates', 'satdish', 'teslacoil', 'catapult',
  'spinwheel', 'swordrack', 'marblerun', 'rockinghorse', 'candlestand', 'weathervane', 'teaset', 'libraryladder', 'bookarch',
  'mast', 'scrollrack', 'orrery', 'windpump', 'spyglass', 'beacon', 'plough', 'sprinkler', 'shipwreck', 'yukatarack',
  'cloudstair', 'skybell', 'dnamodel', 'tuba', 'woodstove', 'raggeddoll',
  // and from the part-lathed, part-hull ones (2026-10-09): stalls lost their awnings, statues and sculptures their shapes
  'trophy', 'umbrellas', 'scarecrow', 'well', 'gymstatue', 'coral', 'candelabra', 'hatstand', 'litwick', 'starprojector',
  'parasoltable', 'breadbasket', 'icestar', 'iceheart', 'icemoon', 'iceshards', 'lemonstall', 'balloonstall', 'applestall',
  'carouselhorse', 'balloons', 'kadomatsu', 'micstand', 'magnifier', 'parrotperch', 'tubecoral', 'stagcoral', 'bubblecoral',
  'anemone', 'papyrus', 'cobrastatue', 'flytrap', 'monstera', 'lilytub', 'crossing', 'wingstatue', 'beachumbrella',
  'tomatocrate', 'cocoastand', 'whackamole', 'castlecolumn',
  // boxed stalls without their awnings, and figures a lathe spun round (the last pass, 2026-10-09)
  'popcornstall', 'flossstall', 'prizestall', 'hoopshot', 'spacesuit', 'labcoat', 'toysoldier', 'bust', 'schoolbag',
  'birdhouse', 'suitcases', 'bufferstop']);
const POT_MAX = 21;   // the tallest pot potAt() paints, in units
const leafy = (p) => (p.w === p.h && p.group === 'Plants') || LEAFY.has(p.fam);
// only a plant's base is a pot to turn on a lathe; anything else's would spin a bag or a stack of cases round
const potted = (p) => p.group === 'Plants' || LEAFY.has(p.fam) && LEAFY_PLANTS.has(p.fam);
const LEAFY_PLANTS = new Set(['alienplant', 'appletree', 'citrustree', 'datepalm', 'deadtree', 'palmtree', 'orchidstand',
  'topiary', 'tomatovine', 'kelp', 'iceflower', 'sakura', 'fancoral', 'beanpole', 'plantstair', 'cornrow', 'kadomatsu', 'papyrus',
  'flytrap', 'monstera', 'lilytub', 'coral', 'tubecoral', 'stagcoral', 'bubblecoral', 'anemone', 'tomatocrate', 'umbrellas',
  'trophy', 'candelabra', 'litwick', 'gymstatue', 'cobrastatue', 'wingstatue', 'icestar', 'iceheart', 'icemoon', 'iceshards', 'breadbasket']);

/** A plant (the user's ask, 2026-10-09: leaves puffed into a hull came out a lumpy blob): its pot, the rows from the
    floor that are one centred run, turns on a lathe; above it the painting stands on two crossed cards, the front's
    and the side's, cut out by their alpha, so it reads as the painting from the front and still has a side. */
function leafyModel(id, paint) {
  const p = PIECES[id], art = p.art(0, 1, true), rows = rowsOf(art), W = art.width, H = art.height;
  const j0 = rows.findIndex(r => r), j1 = rows.length - [...rows].reverse().findIndex(r => r);
  if (j0 < 0) return null;
  let k = j0;
  while (k < Math.min(j1, j0 + POT_MAX) && rows[k] && rows[k].runs === 1 && Math.abs(rows[k].l + rows[k].r - W) <= 3) k++;
  const split = p.w === p.h && potted(p) && k - j0 >= 4 ? k : j0, g = new THREE.Group();
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

/* the furniture modelled after the arcade cabinets (2026-10-12, the user's ask: a table tennis table, a milk cooler and
   a potting bench looked nothing like themselves, carved from their paintings): each batch of shelves is a file of
   builders, js/base-models-*.js, handed this file's parts as `L` (they import nothing, so js/base-shapes.js can read
   their shapes without Three.js) */
const L = {
  get THREE() { return THREE; },
  rbox, blob, weld, cyl, ball, lathe, torus, sides, heart, profileSlab, litPic, decal, canvasTex, tone, mix, rng,
  leg, legsAt, thing, pot, leafAt, topUV, rowsOf, U, HD, FT,
};
for (const makes of [MAKES_A, MAKES_B, MAKES_C, MAKES_D, MAKES_E, MAKES_F, MAKES_G, MAKES_H, MAKES_I, MAKES_J, MAKES_K, MAKES_W, MAKES_W2, MAKES_W3, MAKES_W4, MAKES_W5, MAKES_W6, MAKES_W7, MAKES_T, MAKES_Y, MAKES_FR, MAKES_L, MAKES_M, MAKES_N, MAKES_O, MAKES_P, MAKES_Q, MAKES_R, MAKES_S, MAKES_U, MAKES_V, MAKES_X, MAKES_Z, MAKES_Y2, MAKES_GOLD, MAKES_PIKACHU, MAKES_EEVEE, MAKES_SNORLAX, MAKES_JIGGLYPUFF, MAKES_GENGAR, MAKES_LAPRAS, MAKES_BALL, MAKES_MUSEUM, MAKES_CONTEST, MAKES_LEAGUE, MAKES_ROCKET, MAKES_DAYCARE, MAKES_PARTNER, MAKES_FIGURINES, MAKES_ANTIQUE, MAKES_RATTAN, MAKES_LOGCABIN, MAKES_IRONWOOD, MAKES_IMPERIAL, MAKES_DINER, MAKES_CUTE, MAKES_ELEGANT, MAKES_GOLDEN, MAKES_SHELL, MAKES_SAKURA, MAKES_MAPLE, MAKES_ACORN, MAKES_MUSHROOM, MAKES_BLOCK, MAKES_THROWBACK, MAKES_RANCH, MAKES_IRONGARDEN, MAKES_BAMBOO, MAKES_STONEZEN, MAKES_CONSTELLATION, MAKES_CARAVAN, MAKES_HOSPITAL, MAKES_BISTRO, MAKES_BAKERY, MAKES_SUSHI, MAKES_RAMEN, MAKES_PIZZERIA, MAKES_CORNERSHOP, MAKES_LAUNDROMAT, MAKES_SALON, MAKES_GARAGE]) for (const [k, f] of Object.entries(makes)) {
  if (B[k]) throw new Error(`base-mesh: two builders named ${k}`);
  B[k] = f;
}

/** A statue's figure (js/base-figures.js, the gold statues): its picture as a cut-out standing at x, y, z, w x h tiles,
    its pivot at its feet, so js/base-3d.js can lean it back and turn it to the camera as it does the Pokémon. */
function figure(g, { c, w, h, x = 0, y = 0, z = 0 }, paint) {
  const geo = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), m = paint(c);
  m.alphaTest = 0.5; m.side = THREE.DoubleSide; m.userData.kind = 'pic';
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData.standee = true;
  g.add(mesh);
  return mesh;
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
    B[shape.make](K, shape, W, D, L);
    g = assemble(K);
    if (K.figure) g.userData.standee = figure(g, K.figure, paint);
    if (K.doors.length && K.inside) {
      g.userData.inside = K.inside;
      g.userData.doors = K.doors.map(d => { const leaf = assemble(K, d.bins); g.add(leaf); return { leaf, hinge: d.hinge, side: d.side }; });
    }
    if (K.parts.length) g.userData.parts = Object.fromEntries(K.parts.map(d => {
      const part = assemble(K, d.bins);
      part.position.set(...d.at);
      g.add(part);
      return [d.name, part];
    }));
    // a part that turns on its own (the globe's Earth) is moved to turn about its middle, tipped on its axis
    for (const mesh of g.children) {
      const pv = mesh.material?.userData.pivot;
      if (!pv) continue;
      mesh.geometry.translate(0, -pv.y, 0);
      mesh.position.y = pv.y;
      mesh.rotation.order = 'ZYX';
      mesh.rotation.z = pv.tilt;
      mesh.userData.spins = true;
    }
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
