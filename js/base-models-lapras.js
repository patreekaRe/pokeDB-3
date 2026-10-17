/* base-models-lapras.js  -  the Lapras room's models (furniture expansion session a, 2026-10-17). js/base-models-f.js's
   head says how a batch works. Each upright and wall kind is the same list of parts its painting paints
   (js/base-furniture-lapras.js's BUILT, in painted units), built here as rounded blobs, boxes, lathes, cones, rings and
   tubes by one builder, `laprparts`, so the model and its picture agree part for part; the neck is a tube along the
   same curve the painting samples (`curve`). The wardrobe's and the ice box's shell doors swing (`K.door`). The rugs are
   their outlines (RUGS) cut out, the painting on top. All solo: Lapras's own colours. */

import { BUILT, RUGS, curve } from './base-furniture-lapras.js';

const u = (n) => n / 32;

export const SHAPES = {
  laprbed: { make: 'laprparts', seat: u(24) },
  laprlamp: { make: 'laprparts', play: { does: 'light' } },
  laprchair: { make: 'laprparts', seat: u(17.5) },
  laprsofa: { make: 'laprparts', seat: u(18) },
  laprtable: { make: 'laprparts', top: u(26) },
  laprdesk: { make: 'laprparts', top: u(29.5) },
  laprwardrobe: { make: 'laprparts', play: { does: 'door', inside: 'clothes' } },
  laprdresser: { make: 'laprparts', top: u(29) },
  laprshelf: { make: 'laprparts' },
  laprclock: { make: 'laprparts', play: { does: 'chime' } },
  laprtv: { make: 'laprparts', screen: { x: 0, y: u(30), w: u(42), h: u(28), z: u(8.3) + 0.004 }, play: { does: 'screen', show: ['cartoon', 'weather', 'battle', 'quiz', 'news'] } },
  laprmirror: { make: 'laprparts' },
  laprswimrug: { make: 'laprrug' },
  laprwaverug: { make: 'laprrug' },
  laprwheel: { make: 'laprparts' },
  laprwaves: { make: 'laprparts' },
  laprstool: { make: 'laprparts', seat: u(22) },
  laprrocker: { make: 'laprparts', seat: u(30.5), play: { does: 'rock' } },
  laprcoatstand: { make: 'laprparts' },
  laprchest: { make: 'laprparts', play: { does: 'treasure' } },
  laprfishbowl: { make: 'laprparts', play: { does: 'fish', at: 0.6 } },
  laprharp: { make: 'laprparts', play: { does: 'note', voice: 'pluck', high: true } },
  laprtub: { make: 'laprparts', play: { does: 'bubbles', foam: true } },
  laprplanter: { make: 'laprparts' },
  laprfridge: { make: 'laprparts', play: { does: 'door', inside: 'fridge' } },
};

/** As many sides as a part r units round needs. */
const segOf = (r) => Math.max(8, Math.min(24, Math.ceil(16 * Math.sqrt(2 * r / 32) / 4) * 4));

/** A tube through samples [[x, y, z, r]...] (model units), its rings turned along the curve; its ends are left open,
    capped by balls. */
function tube(THREE, S, seg) {
  const pos = [], idx = [], v = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  let n = null;
  S.forEach((p, i) => {
    const t = v(S[Math.min(S.length - 1, i + 1)]).sub(v(S[Math.max(0, i - 1)])).normalize();
    if (!n) n = Math.abs(t.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    n = n.clone().sub(t.clone().multiplyScalar(n.dot(t))).normalize();
    const b = new THREE.Vector3().crossVectors(t, n);
    for (let j = 0; j < seg; j++) {
      const a = j / seg * Math.PI * 2, c = Math.cos(a) * p[3], s = Math.sin(a) * p[3];
      pos.push(p[0] + n.x * c + b.x * s, p[1] + n.y * c + b.y * s, p[2] + n.z * c + b.z * s);
    }
    if (i) for (let j = 0; j < seg; j++) {
      const a = (i - 1) * seg + j, b2 = (i - 1) * seg + (j + 1) % seg, c = i * seg + j, d = i * seg + (j + 1) % seg;
      idx.push(a, b2, c, b2, d, c);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // keep the winding facing out whichever way the frame turned
  const p0 = v(S[0]), q = new THREE.Vector3(pos[0], pos[1], pos[2]).sub(p0), nn = new THREE.Vector3().fromBufferAttribute(g.attributes.normal, 0);
  if (q.dot(nn) < 0) { const ix = g.index.array; for (let k = 0; k < ix.length; k += 3) [ix[k + 1], ix[k + 2]] = [ix[k + 2], ix[k + 1]]; g.computeVertexNormals(); }
  return g;
}

function build(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  for (const q of parts) {
    if (q.paintOnly) continue;
    const m = mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'blob': put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), q.e ?? 1, q.ev ?? 1, segOf(Math.max(q.rx, q.ry, q.rz))), m, x, y, z, 0, 0, -(q.tilt || 0)); break;
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': put(L.cyl(u(q.r), u(q.hh), u(q.r), 20), m, x, y, z); break;
      case 'disc': put(L.cyl(u(q.r), u(q.th), u(q.r), 20).rotateX(Math.PI / 2), m, x, y, z); break;
      case 'cone': {
        const g = L.cyl(0.0005, u(q.hh), u(q.r), 12).translate(0, u(q.hh) / 2, 0);
        if (q.fwd) g.rotateX(Math.PI / 2); else if (q.tilt) g.rotateZ(-q.tilt);
        put(g, m, x, y, z);
        break;
      }
      case 'line': {
        // a bent line is two straight strokes through its middle
        const mid = [(q.x0 + q.x1) / 2, (q.h0 + q.h1) / 2 + q.bend], segs = q.bend ? [[[q.x0, q.h0], mid], [mid, [q.x1, q.h1]]] : [[[q.x0, q.h0], [q.x1, q.h1]]];
        for (const [[ax, ah], [bx, bh]] of segs) {
          const len = Math.hypot(bx - ax, bh - ah) + q.w * 0.6;
          put(L.rbox(u(len), u(q.w), u(0.8), 0.001).rotateZ(Math.atan2(bh - ah, bx - ax)), m, X((ax + bx) / 2), u((ah + bh) / 2), z);
        }
        break;
      }
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), 28), m, x, y, z); break;
      case 'ring': put(L.torus(u(q.R), u(q.r)), m, x, y, z); break;
      case 'tube': {
        const S = curve(q.pts).map(([px, ph, pz, r]) => [X(px), u(ph), u(pz), u(r)]), seg = Math.max(8, Math.min(12, segOf(q.pts[0][3])));
        put(tube(THREE, S, seg), m);
        for (const p of [S[0], S[S.length - 1]]) put(L.ball(p[3], seg, 6), m, p[0], p[1], p[2]);
        break;
      }
    }
  }
}

export const MAKES = {
  laprparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    build(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) build(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  laprrug(K, s, W, D, L) {
    const R = RUGS[K.p.fam], m = K.pic(K.p.art(0, L.HD));
    for (const [cx, cy, rx, ry] of R.ovals) {
      const g = L.cyl(1, 0.03, 1, 40).scale(u(rx), 1, u(ry)).translate(u(cx) - W / 2, 0.015, u(cy) - D / 2);
      K.put(g, m); L.topUV(g, W, D);
    }
  },
};
