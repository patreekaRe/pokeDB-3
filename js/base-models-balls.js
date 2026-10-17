/* base-models-balls.js  -  the Poké Ball collection set's models (furniture expansion session b, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-balls.js's BUILT, in painted units), built here by one builder, `pbparts`; every ball in it
   is `buildBall()`: one lathed sphere, its band and button, and its type's markings (BALLS) laid on it, the same ones
   the painting paints. The rug is its round outline cut out, the painting on top. All solo: each ball's own colours. */

import { BUILT, PLAYS, ballOf, markDir } from './base-furniture-balls.js';
import { rod } from './base-models-kit.js';

const u = (n) => n / 32;
const TAU = Math.PI * 2, RAD = Math.PI / 180;
const DOES = { ball: { does: 'ball' }, light: { does: 'light' }, chime: { does: 'chime' }, heal: { does: 'heal', balls: 0 }, bubbles: { does: 'bubbles' } };

export const SHAPES = { pbgreat: { make: 'pbrug' } };
for (const id of Object.keys(BUILT)) SHAPES[id] = PLAYS[id] ? { make: 'pbparts', play: DOES[PLAYS[id]] } : { make: 'pbparts' };

/** A non-indexed geometry's triangles each cut in four, `n` times over. */
function quarter(pos, n) {
  for (let k = 0; k < n; k++) {
    const out = new Float32Array(pos.length * 4);
    let o = 0;
    for (let i = 0; i < pos.length; i += 9) {
      const a = pos.slice(i, i + 3), b = pos.slice(i + 3, i + 6), c = pos.slice(i + 6, i + 9);
      const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      for (const t of [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]]) for (const p of t) { out.set(p, o); o += 3; }
    }
    pos = out;
  }
  return pos;
}

/** A Poké Ball of type `type`, radius r (tiles), its middle at x, y, z and its button facing +z. */
export function buildBall(K, L, x, y, z, r, type) {
  const { THREE } = L, T = ballOf(type);
  const half = (from, to) => Array.from({ length: 7 }, (_, i) => { const t = (from + (to - from) * i / 6) * RAD; return [r * Math.sin(t), r * Math.cos(t)]; });
  K.put(L.lathe(half(90, 0), 24), K.gloss(T.top), x, y, z);
  K.put(L.lathe(half(180, 90), 24), K.gloss(T.bot), x, y, z);
  K.put(L.cyl(r * 1.012, r * 0.16, r * 1.012, 24), K.gloss(T.band), x, y, z);
  K.put(L.cyl(r * 0.34, r * 0.2, r * 0.34, 16).rotateX(Math.PI / 2), K.gloss(T.ring), x, y, z + r * 0.92);
  K.put(L.cyl(r * 0.22, r * 0.12, r * 0.22, 16).rotateX(Math.PI / 2), K.gloss(T.btn), x, y, z + r * 1.02);
  for (const d of T.deco) {
    const m = K.gloss(d.c);
    if (d.k === 'patch') {
      const ws = Math.max(2, Math.ceil((d.a1 - d.a0) / 12)), hs = Math.max(1, Math.ceil((d.t1 - d.t0) / 12));
      K.put(new THREE.SphereGeometry(r * 1.014, ws, hs, (d.a0 + 90) * RAD, (d.a1 - d.a0) * RAD, d.t0 * RAD, (d.t1 - d.t0) * RAD), m, x, y, z);
    } else if (d.k === 'spot') {
      K.put(new THREE.SphereGeometry(r * 1.016, 10, 2, 0, TAU, 0, d.s * RAD).rotateX(d.t * RAD).rotateY(d.a * RAD), m, x, y, z);
    } else {
      // the mark flat, cut fine, then wrapped onto the sphere
      const sh = new THREE.Shape(d.pts.map(([a, b]) => new THREE.Vector2(a, b)));
      if (d.hole) sh.holes.push(new THREE.Path(d.hole.map(([a, b]) => new THREE.Vector2(a, b))));
      const pos = quarter(new THREE.ShapeGeometry(sh).toNonIndexed().attributes.position.array, 2), nor = new Float32Array(pos.length);
      for (let i = 0; i < pos.length; i += 3) {
        const n = markDir(d.a, d.t, pos[i], pos[i + 1]);
        nor.set(n, i); pos.set(n.map(c => c * r * 1.018), i);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      K.put(g, m, x, y, z);
    }
  }
}

/** A flat shape from points in units (y up), `t` units thick, its middle at z 0. */
function slab(L, pts, t, holes = []) {
  const { THREE } = L, b = Math.min(u(0.3), u(t) / 4), toV = (p) => p.map(([a, d]) => new THREE.Vector2(u(a), u(d)));
  const s = new THREE.Shape(toV(pts));
  for (const h of holes) s.holes.push(new THREE.Path(toV(h)));
  const g = new THREE.ExtrudeGeometry(s, { depth: u(t) - b * 2, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 8 });
  return g.translate(0, 0, -(u(t) - b * 2) / 2);
}

function build(K, L, parts) {
  const mat = (q) => { const m = q.m || 'gloss'; return m === 'glass' ? (q.tint ? K.M('glass', q.tint, { key: q.tint }) : K.glass()) : K[m](q.c); };
  for (const q of parts) {
    if (q.paintOnly) continue;
    const m = mat(q), x = u(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': K.put(L.rbox(u(q.w), u(q.hh), u(q.d), u(Math.min(q.r, q.w / 2.2, q.hh / 2.2, q.d / 2.2))), m, x, y, z); break;
      case 'cyl': K.put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? 20), m, x, y, z, q.seg === 6 ? Math.PI / 6 : 0); break;
      case 'disc': K.put(L.cyl(u(q.r), u(q.th), u(q.r), 20).rotateX(Math.PI / 2), m, x, y, z); break;
      case 'egg': K.put(L.ball(u(q.rx), 14, 10).scale(1, q.ry / q.rx, q.rz / q.rx), m, x, y, z, 0, 0, -(q.tilt || 0)); break;
      case 'lathe': K.put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), 24), m, x, y, z); break;
      case 'torus': {
        const g = L.torus(u(q.R), u(q.r), q.arc ?? TAU, 24);
        if (q.rot) g.rotateZ(q.rot);
        if (q.axis === 'y') g.rotateX(Math.PI / 2); else if (q.axis === 'x') g.rotateY(Math.PI / 2);
        K.put(g, m, x, y, z);
        break;
      }
      case 'slab': K.put(slab(L, q.pts, q.th, q.holes), m, x, y, z); break;
      case 'stick': rod(K, L, m, q.p0.map(u), q.p1.map(u), u(q.r)); break;
      case 'ball': buildBall(K, L, x, y, z, u(q.r), q.type); break;
    }
  }
}

export const MAKES = {
  pbparts(K, s, W, D, L) { build(K, L, BUILT[K.p.fam]); },

  pbrug(K, s, W, D, L) {
    const g = L.cyl(1, 0.03, 1, 40).scale(u(31), 1, u(31)).translate(0, 0.015, 0);
    K.put(g, K.pic(K.p.art(0, L.HD)));
    L.topUV(g, W, D);
  },
};
