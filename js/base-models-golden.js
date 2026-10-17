/* base-models-golden.js  -  the Golden set's models (furniture expansion session e, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-golden.js's BUILT, in painted units), built here by one builder, `gldparts`, as
   js/base-models-antique.js does: rounded boxes, cylinders, balls, rods, lathes, discs, rings, flat outlines and side
   profiles extruded, and `plate`s, outlines seen from above extruded upwards (the grand piano's case, its lid tipped up
   about its straight side). A `pic` part (the clock's dial, the framed seascape) wears its crop of the front painting.
   The wardrobe's doors swing (`K.door`). The rug is a slab, the painting on top. All solo, fixed colours. */

import { BUILT } from './base-furniture-golden.js';

const u = (n) => n / 32;

export const SHAPES = {
  goldcandle: { make: 'gldparts', play: { does: 'light', flicker: true } },
  goldclock: { make: 'gldparts', play: { does: 'chime' } },
  goldchair: { make: 'gldparts', seat: u(18.1) },
  goldstool: { make: 'gldparts', seat: u(19.6) },
  goldlamp: { make: 'gldparts', play: { does: 'light' } },
  golddishes: { make: 'gldparts' },
  goldtable: { make: 'gldparts', top: u(25.5) },
  goldmirror: { make: 'gldparts' },
  goldshelf: { make: 'gldparts' },
  golddresser: { make: 'gldparts', top: u(34) },
  golddesk: { make: 'gldparts', top: u(30) },
  goldscreen: { make: 'gldparts' },
  goldframe: { make: 'gldparts' },
  goldsconce: { make: 'gldparts', play: { does: 'light', flicker: true } },
  goldrug: { make: 'gldrug' },
  goldsofa: { make: 'gldparts', seat: u(18.5) },
  goldwardrobe: { make: 'gldparts', play: { does: 'door', inside: 'clothes', double: true } },
  goldmagikarp: { make: 'gldparts', play: { does: 'boing' } },
  goldtoilet: { make: 'gldparts', seat: u(16.2), play: { does: 'flush' } },
  goldbath: { make: 'gldparts', play: { does: 'bubbles', foam: true } },
  goldpiano: { make: 'gldparts', play: { does: 'note', voice: 'piano' } },
  goldthrone: { make: 'gldparts', seat: u(21.2) },
  goldbed: { make: 'gldparts', seat: u(24.4) },
  goldchest: { make: 'gldparts', play: { does: 'treasure' } },
  goldvase: { make: 'gldparts' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropGld(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildGld(K, L, parts, put, W, def) {
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
        const g = L.torus(u(q.r), u(q.tr), Math.PI * 2, q.seg ?? 20);
        if (q.flat) g.rotateX(Math.PI / 2);
        put(g, m, x, y, z);
        break;
      }
      case 'rod': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.r > 1.2 ? 12 : q.r < 0.45 ? 6 : 8);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        put(g, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'prism': {
        const sh = new THREE.Shape(q.pts.map(([px, ph]) => new THREE.Vector2(u(px), u(ph))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        break;
      }
      case 'slab': {
        // the profile drawn in (z, h), run across x: the shape's x becomes z, its depth x
        const sh = new THREE.Shape(q.pts.map(([dz, dh]) => new THREE.Vector2(u(dz), u(dh))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.w), bevelEnabled: false }).translate(0, 0, -u(q.w) / 2).rotateY(-Math.PI / 2), m, x, y, z);
        break;
      }
      case 'plate': {
        // the outline drawn in (x, -z), extruded up: rotateX(-90deg) takes the shape's y to -z and its depth to y
        const px = X(q.px), sh = new THREE.Shape(q.pts.map(([ax, az]) => new THREE.Vector2(X(ax) - px, -u(az))));
        const g = new THREE.ExtrudeGeometry(sh, { depth: u(q.hh), bevelEnabled: false, curveSegments: 1 }).rotateX(-Math.PI / 2);
        if (q.roll) g.rotateZ(q.roll);
        put(g, m, px, y, 0);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropGld(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  gldparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildGld(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildGld(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the rug: a slab, its painting on top */
  gldrug(K, s, W, D, L) {
    const g = L.rbox(W - 0.02, 0.035, D - 0.02, 0.008);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0.0175, 0);
  },
};
