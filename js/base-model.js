/* base-model.js  -  an upright piece of furniture as a real 3D model, built from its own paintings (front, sides, back),
   so it turns like a thing in the room instead of a picture swapping round. Every painted pixel is a little cube (a
   voxel); a cube is kept where both the front and the side paintings have paint, which is how a chair gets four legs, a
   seat and a back from two pictures. A piece painted the same from every side (a plant, a lamp, a crate) is the one case
   two views can't tell apart: its rows are rounded off unless it reads as a box (most rows full width), and rows split in
   two (legs) stay square so the legs stand in the corners. The faces are merged into big rectangles (greedy meshing) and
   each wears the painting it faces, projected straight on, so the pixels stay crisp; a top wears the row just under the
   front's top edge (the edge itself is the dark outline). The geometry is the model's middle at the floor, one painted
   pixel a unit: scale it by the room's pixel. Built once per piece; pieceModel() makes fresh Three objects each time,
   since js/hd2d.js's dispose() frees them with the room. */

import { PIECES } from './secret-base.js';

const SOLID = 128;
const built = new Map(), KEEP = 80;   // models worked out, the least recently used dropped past KEEP

const pixels = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/** A canvas mirrored left to right. */
function mirror(src) {
  const c = new OffscreenCanvas(src.width, src.height), g = c.getContext('2d');
  g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
  return c;
}

/** A painting with every clear pixel filled from its nearest painted one, so a face can sample anywhere on it. `under`
    (a canvas the same size, or none) is laid beneath first, for a back or side painted narrower than the model. */
function filled(src, under) {
  const w = src.width, h = src.height, c = new OffscreenCanvas(w, h), g = c.getContext('2d');
  if (under) g.drawImage(under, 0, 0);
  g.drawImage(src, 0, 0);
  const im = g.getImageData(0, 0, w, h), d = im.data;
  let edge = [];
  for (let i = 0; i < w * h; i++) {
    if (d[i * 4 + 3] > SOLID) { d[i * 4 + 3] = 255; edge.push(i); } else d[i * 4 + 3] = 0;
  }
  if (!edge.length) return c;
  while (edge.length) {
    const next = [];
    for (const i of edge) {
      const x = i % w, y = (i - x) / w;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (d[j * 4 + 3]) continue;
        d[j * 4] = d[i * 4]; d[j * 4 + 1] = d[i * 4 + 1]; d[j * 4 + 2] = d[i * 4 + 2]; d[j * 4 + 3] = 255;
        next.push(j);
      }
    }
    edge = next;
  }
  g.putImageData(im, 0, 0);
  return c;
}

/** Which cubes of a W x D x H block are solid: the front and side paintings, read with row 0 the floor. */
function carve(front, side, W, D, H, round) {
  const fd = pixels(front), sd = pixels(side), fh = front.height, sh = side.height;
  const fOn = (i, j) => fd[((fh - 1 - j) * W + i) * 4 + 3] > SOLID;
  const sOn = (i, j) => sd[((sh - 1 - j) * D + i) * 4 + 3] > SOLID;
  const occ = new Uint8Array(W * D * H);
  let boxy = false, spans = [];
  if (round) {
    // each row's painted runs; a piece whose sides run mostly straight up (a crate, a present) is a box, not a pot
    let widest = 0;
    for (let j = 0; j < H; j++) {
      const runs = [];
      for (let i = 0; i < W; i++) if (fOn(i, j)) { const r = runs.at(-1); if (r && r[1] === i) r[1] = i + 1; else runs.push([i, i + 1]); }
      spans.push(runs);
      if (runs.length) widest = Math.max(widest, runs.at(-1)[1] - runs[0][0]);
    }
    const wide = (r) => r.length && r.at(-1)[1] - r[0][0] >= widest / 2;
    let rows = 0, straight = 0;
    for (let j = 0; j < H; j++) {
      const r = spans[j], q = spans[j - 1];
      if (!wide(r)) continue;
      rows++;
      if (q && q.length && q[0][0] === r[0][0] && q.at(-1)[1] === r.at(-1)[1]) straight++;
    }
    boxy = straight >= rows * 0.6;
  }
  for (let j = 0; j < H; j++) {
    const runs = spans[j], ring = round && !boxy && runs.length === 1 && runs[0];
    for (let k = 0; k < D; k++) for (let i = 0; i < W; i++) {
      if (!fOn(i, j) || !sOn(D - 1 - k, j)) continue;
      if (ring) {
        const r = (ring[1] - ring[0]) / 2, dx = i + 0.5 - (ring[0] + r), dz = k + 0.5 - D / 2;
        if (dx * dx + dz * dz > r * r + 0.5) continue;
      }
      occ[(j * D + k) * W + i] = 1;
    }
  }
  return occ;
}

/** The faces between solid and clear cubes, merged into rectangles, as arrays for a BufferGeometry with a group per
    painting: 0 front, 1 back, 2 right side (art 1), 3 left side (art 3). */
function mesh(occ, W, D, H, sizes) {
  const on = (i, k, j) => i >= 0 && k >= 0 && j >= 0 && i < W && k < D && j < H && occ[(j * D + k) * W + i];
  const out = [0, 1, 2, 3].map(() => ({ pos: [], nor: [], uv: [] }));
  const [fw, fh, bw, bh, sw, sh] = sizes;
  // a quad from four corners (anticlockwise seen from outside) with their uvs
  const quad = (m, n, pts, uvs) => {
    const o = out[m];
    for (const t of [0, 1, 2, 0, 2, 3]) { o.pos.push(...pts[t]); o.nor.push(...n); o.uv.push(...uvs[t]); }
  };
  // greedy merge one slice's face mask (a x b) into rectangles: emit(u, v, du, dv)
  const greedy = (A, B, has, emit) => {
    const done = new Uint8Array(A * B);
    for (let v = 0; v < B; v++) for (let u = 0; u < A; u++) {
      if (done[v * A + u] || !has(u, v)) continue;
      let du = 1;
      while (u + du < A && !done[v * A + u + du] && has(u + du, v)) du++;
      let dv = 1;
      grow: while (v + dv < B) {
        for (let x = u; x < u + du; x++) if (done[(v + dv) * A + x] || !has(x, v + dv)) break grow;
        dv++;
      }
      for (let y = v; y < v + dv; y++) for (let x = u; x < u + du; x++) done[y * A + x] = 1;
      emit(u, v, du, dv);
    }
  };
  const X = (i) => i - W / 2, Z = (k) => k - D / 2;
  // front (+z) and back (-z): slices along z, rectangles over x and y
  for (let k = 0; k < D; k++) {
    greedy(W, H, (i, j) => on(i, k, j) && !on(i, k + 1, j), (i, j, w, h) => {
      const z = Z(k + 1), u0 = i / fw, u1 = (i + w) / fw, v0 = j / fh, v1 = (j + h) / fh;
      quad(0, [0, 0, 1], [[X(i), j, z], [X(i + w), j, z], [X(i + w), j + h, z], [X(i), j + h, z]], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
    });
    greedy(W, H, (i, j) => on(i, k, j) && !on(i, k - 1, j), (i, j, w, h) => {
      const z = Z(k), u0 = (W - i) / bw, u1 = (W - i - w) / bw, v0 = j / bh, v1 = (j + h) / bh;
      quad(1, [0, 0, -1], [[X(i + w), j, z], [X(i), j, z], [X(i), j + h, z], [X(i + w), j + h, z]], [[u1, v0], [u0, v0], [u0, v1], [u1, v1]]);
    });
  }
  // right (+x, the side painting read front to back) and left (-x, back to front): slices along x, over z and y
  for (let i = 0; i < W; i++) {
    greedy(D, H, (k, j) => on(i, k, j) && !on(i + 1, k, j), (k, j, d, h) => {
      const x = X(i + 1), ua = (D - k) / sw, ub = (D - k - d) / sw, v0 = j / sh, v1 = (j + h) / sh;
      quad(2, [1, 0, 0], [[x, j, Z(k + d)], [x, j, Z(k)], [x, j + h, Z(k)], [x, j + h, Z(k + d)]], [[ub, v0], [ua, v0], [ua, v1], [ub, v1]]);
    });
    greedy(D, H, (k, j) => on(i, k, j) && !on(i - 1, k, j), (k, j, d, h) => {
      const x = X(i), ua = k / sw, ub = (k + d) / sw, v0 = j / sh, v1 = (j + h) / sh;
      quad(3, [-1, 0, 0], [[x, j, Z(k)], [x, j, Z(k + d)], [x, j + h, Z(k + d)], [x, j + h, Z(k)]], [[ua, v0], [ub, v0], [ub, v1], [ua, v1]]);
    });
  }
  // tops and undersides wear the front painting: a top the row under its outline, an underside its own row
  for (let j = 0; j < H; j++) {
    const vt = Math.max(0.5, j - 0.5) / fh, vb = (j + 0.5) / fh;
    greedy(W, D, (i, k) => on(i, k, j) && !on(i, k, j + 1), (i, k, w, d) => {
      const y = j + 1, u0 = i / fw, u1 = (i + w) / fw;
      quad(0, [0, 1, 0], [[X(i), y, Z(k + d)], [X(i + w), y, Z(k + d)], [X(i + w), y, Z(k)], [X(i), y, Z(k)]], [[u0, vt], [u1, vt], [u1, vt], [u0, vt]]);
    });
    if (j) greedy(W, D, (i, k) => on(i, k, j) && !on(i, k, j - 1), (i, k, w, d) => {
      const u0 = i / fw, u1 = (i + w) / fw;
      quad(0, [0, -1, 0], [[X(i), j, Z(k)], [X(i + w), j, Z(k)], [X(i + w), j, Z(k + d)], [X(i), j, Z(k + d)]], [[u0, vb], [u1, vb], [u1, vb], [u0, vb]]);
    });
  }
  return out;
}

/** A piece's model, worked out once: its arrays, the four paintings it wears (filled), and its height in pixels. */
function build(id) {
  if (built.has(id)) { const m = built.get(id); built.delete(id); built.set(id, m); return m; }
  const p = PIECES[id], art = [0, 1, 2, 3].map(d => p.art(d));
  const [front, right, back, left] = art;
  const W = front.width, D = right.width;
  const round = W === D && same(pixels(front), pixels(right));
  const H = Math.min(front.height, right.height);
  const occ = carve(front, right, W, D, H, round);
  let top = 0;
  for (let j = 0; j < H; j++) for (let n = 0; n < W * D; n++) if (occ[j * W * D + n]) { top = j + 1; break; }
  const faces = [filled(front), filled(back, mirror(front)), filled(right), filled(left, mirror(right))];
  const parts = mesh(occ, W, D, H, [front.width, front.height, back.width, back.height, right.width, right.height]);
  const model = { parts, faces, top, W, D };
  built.set(id, model);
  if (built.size > KEEP) built.delete(built.keys().next().value);
  return model;
}

/** A fresh mesh of an upright piece, its feet at y 0 and its middle at x, z 0, `px` world units a painted pixel.
    `material(canvas)` makes each painting's material (the caller's texture and glow rules). */
export function pieceModel(THREE, id, px, material) {
  const { parts, faces, top } = build(id);
  const geo = new THREE.BufferGeometry(), n = parts.reduce((s, o) => s + o.pos.length / 3, 0);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let at = 0;
  parts.forEach((o, m) => {
    const c = o.pos.length / 3;
    if (!c) return;
    geo.addGroup(at, c, m);
    pos.set(o.pos, at * 3); nor.set(o.nor, at * 3); uv.set(o.uv, at * 2);
    at += c;
  });
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.scale(px, px, px);
  const mesh = new THREE.Mesh(geo, faces.map(material));
  mesh.userData.top = top * px;
  return mesh;
}
