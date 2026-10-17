/* base-models-shell.js  -  the Mermaid set's models (furniture expansion session e, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-shell.js's BUILT, in painted units), built here by one builder, `merparts`, as
   js/base-models-antique.js builds its set: rounded boxes, cylinders, balls, rods, lathes, discs, rings (or a ring's arc,
   a wave's curl), flat outlines extruded (a scallop shell, leaning back by its `tilt` for the clam's lid) and side
   profiles. A `pic` part (the dial, the sea glass) wears its crop of the front painting, all of them one texture. The
   wardrobe's doors swing (`K.door`). The rug is a slab, the painting on top. All solo, fixed colours. */

import { BUILT } from './base-furniture-shell.js';

const u = (n) => n / 32;

export const SHAPES = {
  merbed: { make: 'merparts', seat: u(22) },
  merchair: { make: 'merparts', seat: u(17.6) },
  mersofa: { make: 'merparts', seat: u(17.6) },
  mertable: { make: 'merparts', top: u(25.4) },
  merdesk: { make: 'merparts', top: u(28) },
  merwardrobe: { make: 'merparts', play: { does: 'door', inside: 'clothes', double: true } },
  merdresser: { make: 'merparts', top: u(30.8) },
  mershelf: { make: 'merparts' },
  merlamp: { make: 'merparts', play: { does: 'light' } },
  merscreen: { make: 'merparts' },
  mervanity: { make: 'merparts' },
  merwallshelf: { make: 'merparts' },
  mernet: { make: 'merparts' },
  merwallclock: { make: 'merparts', play: { does: 'chime' } },
  merharp: { make: 'merparts', play: { does: 'note', voice: 'pluck', high: true } },
  merfountain: { make: 'merparts', play: { does: 'water', fountain: true } },
  mertank: { make: 'merparts', play: { does: 'bubbles' } },
  merchandelier: { make: 'merparts', play: { does: 'light' } },
  mercorsola: { make: 'merparts' },
  merclam: { make: 'merparts', play: { does: 'treasure' } },
  mernightstand: { make: 'merparts', top: u(23.2) },
  merthrone: { make: 'merparts', seat: u(17.9) },
  merseahorse: { make: 'merparts', seat: u(22.8), play: { does: 'rock' } },
  merstool: { make: 'merparts', seat: u(18) },
  merrug: { make: 'merrug' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropMer(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildMer(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? 24), m, x, y, z); break;
      case 'ball': {
        const r = Math.max(q.rx, q.ry, q.rz), seg = q.seg ?? Math.max(8, L.sides(u(r), 20));
        put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), 1, 1, seg), m, x, y, z);
        break;
      }
      case 'disc': {
        const g = L.cyl(u(q.r), u(q.th), u(q.r), q.seg ?? 20).rotateX(Math.PI / 2);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        put(g, m, x, y, z);
        break;
      }
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), q.seg ?? 20), m, x, y, z); break;
      case 'ring': {
        const g = L.torus(u(q.r), u(q.tr), q.arc ?? Math.PI * 2, 20);
        if (q.arc) g.rotateZ(q.rot || 0);
        if (q.flat) g.rotateX(Math.PI / 2);
        put(g, m, x, y, z);
        break;
      }
      case 'rod': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.r > 1.2 ? 12 : 8);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        put(g, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'prism': {
        const sh = new THREE.Shape(q.pts.map(([px, ph]) => new THREE.Vector2(u(px), u(ph))));
        const g = new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -u(q.d) / 2);
        if (q.tilt) g.rotateX(-q.tilt);
        put(g, m, x, y, z);
        break;
      }
      case 'slab': {
        // the profile drawn in (z, h), run across x: the shape's x becomes z, its depth x
        const sh = new THREE.Shape(q.pts.map(([dz, dh]) => new THREE.Vector2(u(dz), u(dh))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.w), bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -u(q.w) / 2).rotateY(-Math.PI / 2), m, x, y, z);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropMer(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  merparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildMer(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildMer(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the rug: a slab, its painting on top */
  merrug(K, s, W, D, L) {
    const g = L.rbox(W - 0.02, 0.035, D - 0.02, 0.008);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0.0175, 0);
  },
};
