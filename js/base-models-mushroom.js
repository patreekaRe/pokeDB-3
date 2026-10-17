/* base-models-mushroom.js  -  the Mushroom set's models (furniture expansion session f, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-mushroom.js's BUILT, in painted units), built here by one builder, `shrmparts`, as
   js/base-models-elegant.js builds its own: rounded boxes, cylinders (halved against the wall for the bracket fungi),
   balls (every cap's spots), rods, lathes (the stalks, the domed caps and the cones of gills under them, squashed front to
   back where `sz` says), discs (turned to face the sides for the log's ends), rings and flat outlines extruded (the
   half-caps of the chair's, the sofa's and the screen's backs). A `pic` part (the dial, the screen's woods) wears its
   crop of the front painting, all of them one texture. The wardrobe's doors swing (`K.door`). The lamps' caps are
   `K.glow`, lit by a tap. The rug is its circle cut out, the painting on top. All solo, fixed colours. */

import { BUILT, RUGS } from './base-furniture-mushroom.js';

const u = (n) => n / 32;

export const SHAPES = {
  shrmbed: { make: 'shrmparts', seat: u(17.4) },
  shrmchair: { make: 'shrmparts', seat: u(17) },
  shrmsofa: { make: 'shrmparts', seat: u(16.5) },
  shrmtable: { make: 'shrmparts', top: u(24.6) },
  shrmdesk: { make: 'shrmparts', top: u(29.7) },
  shrmwardrobe: { make: 'shrmparts', play: { does: 'door', inside: 'clothes', double: true } },
  shrmdresser: { make: 'shrmparts', top: u(31.3) },
  shrmshelf: { make: 'shrmparts' },
  shrmlamp: { make: 'shrmparts', play: { does: 'light' } },
  shrmfloorlamp: { make: 'shrmparts', play: { does: 'light' } },
  shrmclock: { make: 'shrmparts', play: { does: 'chime' } },
  shrmscreen: { make: 'shrmparts' },
  shrmmirror: { make: 'shrmparts' },
  shrmwalllamp: { make: 'shrmparts', play: { does: 'light' } },
  shrmwallshelf: { make: 'shrmparts' },
  shrmcluster: { make: 'shrmparts' },
  shrmlog: { make: 'shrmparts', seat: u(17) },
  shrmshroomish: { make: 'shrmparts', seat: u(18.5) },
  shrmfoongus: { make: 'shrmparts', top: u(25.1) },
  shrmparasect: { make: 'shrmparts', play: { does: 'light' } },
  shrmshiinotic: { make: 'shrmparts', play: { does: 'light' } },
  shrmbreloom: { make: 'shrmparts' },
  shrmparasol: { make: 'shrmparts' },
  shrmbasket: { make: 'shrmparts' },
  shrmrug: { make: 'shrmrug' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropShrm(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildShrm(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r), q.seg ?? 2), m, x, y, z); break;
      case 'cyl': {
        const rt = u(q.r), rb = u(q.rb ?? q.r);
        const g = q.half ? new THREE.CylinderGeometry(rt, rb, u(q.hh), Math.max(6, Math.round(L.sides(Math.max(rt, rb), 20) / 2)), 1, false, -Math.PI / 2, Math.PI)
          : L.cyl(rt, u(q.hh), rb, q.seg ?? 24);
        put(g, m, x, y, z);
        break;
      }
      case 'ball': {
        const r = Math.max(q.rx, q.ry, q.rz), seg = q.seg ?? Math.max(8, L.sides(u(r), 20));
        put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), 1, 1, seg), m, x, y, z);
        break;
      }
      case 'disc': {
        const g = L.cyl(u(q.r), u(q.th), u(q.r), q.seg ?? 20);
        if (q.ax === 'x') g.rotateZ(Math.PI / 2); else { g.rotateX(Math.PI / 2); if (q.ry) g.scale(1, q.ry / q.r, 1); }
        put(g, m, x, y, z);
        break;
      }
      case 'lathe': {
        const g = L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), q.seg ?? 20);
        if (q.sz) g.scale(1, 1, q.sz);
        put(g, m, x, y, z);
        break;
      }
      case 'ring': {
        const g = L.torus(u(q.r), u(q.tr), q.arc ?? Math.PI * 2, 20);
        if (q.a0) g.rotateZ(q.a0);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        if (q.flat) g.rotateX(Math.PI / 2);
        put(g, m, x, y, z);
        break;
      }
      case 'rod': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.r > 1.2 ? 12 : q.r < 0.4 ? 5 : 8);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        put(g, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'prism': {
        const sh = new THREE.Shape(q.pts.map(([px, ph]) => new THREE.Vector2(u(px), u(ph))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false, curveSegments: 4 }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropShrm(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  shrmparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildShrm(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildShrm(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the round rug: its outline cut out, the painting on top */
  shrmrug(K, s, W, D, L) {
    const m = K.pic(K.p.art(0, L.HD));
    for (const [cx, cy, r] of RUGS[K.p.fam]) {
      const g = L.cyl(1, 0.03, 1, 40).scale(u(r), 1, u(r)).translate(u(cx) - W / 2, 0.015, u(cy) - D / 2);
      K.put(g, m); L.topUV(g, W, D);
    }
  },
};
