/* base-models-irongarden.js  -  the Iron garden set's models (furniture expansion session g, 2026-10-17), for the backyard.
   js/base-models-f.js's head says how a batch works. Each upright kind is the same list of parts its painting paints
   (js/base-furniture-irongarden.js's BUILT, in painted units), built here by one builder, `igdparts`: flat bars (square
   boxes, 12 triangles), rods (the scrolls, lattices and pickets: open thin tubes of 4 to 6 sides, so a curl is a few
   dozen triangles), lathes (pots, basins, the gazebo's hexagonal roof, turned to its posts by `ry`), balls (roses, the
   Pokémon), discs, rings, extruded outlines (ivy leaves, valances, Butterfree's wings) and glass. The clock's dial wears its
   crop of the front painting. The cabinet's glass doors and the gate's leaves swing (`K.door`), what's behind them
   modelled (`bare`). The rug is its circle cut out of a thin slab, the mosaic on top. All solo, fixed colours. */

import { BUILT, RUG } from './base-furniture-irongarden.js';

const u = (n) => n / 32;

export const SHAPES = {
  igdbed: { make: 'igdparts', seat: u(18.5) },
  igdchair: { make: 'igdparts', seat: u(17) },
  igdbench: { make: 'igdparts', seat: u(17.2) },
  igdtable: { make: 'igdparts', top: u(25.1) },
  igddesk: { make: 'igdparts', top: u(26.8) },
  igdcabinet: { make: 'igdparts', play: { does: 'door', inside: 'pantry', double: true } },
  igdstand: { make: 'igdparts' },
  igdetagere: { make: 'igdparts' },
  igdlamp: { make: 'igdparts', play: { does: 'light' } },
  igdclock: { make: 'igdparts', play: { does: 'chime' } },
  igdscreen: { make: 'igdparts' },
  igdmirror: { make: 'igdparts' },
  igdrug: { make: 'igdrug' },
  igdarch: { make: 'igdparts' },
  igdgazebo: { make: 'igdparts' },
  igdbirdbath: { make: 'igdparts', play: { does: 'water', fountain: true } },
  igdfountain: { make: 'igdparts', play: { does: 'water', fountain: true } },
  igdbaskets: { make: 'igdparts' },
  igdfence: { make: 'igdparts' },
  igdgate: { make: 'igdparts', play: { does: 'door', inside: 'pantry', double: true } },
  igdswing: { make: 'igdparts', seat: u(18.1), play: { does: 'rock' } },
  igdcart: { make: 'igdparts' },
  igdlantern: { make: 'igdparts', play: { does: 'light' } },
  igdbirdcage: { make: 'igdparts' },
  igdplanter: { make: 'igdparts' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropIg(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildIg(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': {
        const g = L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? 20);
        if (q.ry) g.rotateY(q.ry);
        put(g, m, x, y, z);
        break;
      }
      case 'ball': {
        const r = Math.max(q.rx, q.ry, q.rz), seg = q.seg ?? Math.max(8, L.sides(u(r), 16));
        put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), 1, 1, seg), m, x, y, z);
        break;
      }
      case 'disc': {
        const g = L.cyl(u(q.r), u(q.th), u(q.r), q.seg ?? 16).rotateX(Math.PI / 2);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        put(g, m, x, y, z);
        break;
      }
      case 'lathe': {
        const g = L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), q.seg ?? 16);
        if (q.ry) g.rotateY(q.ry);
        if (q.rot) g.rotateZ(q.rot);
        put(g, m, x, y, z);
        break;
      }
      case 'ring': {
        const g = L.torus(u(q.r), u(q.tr), q.arc ?? Math.PI * 2, q.seg ?? 20);
        if (q.a0) g.rotateZ(q.a0);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        if (q.flat) g.rotateX(Math.PI / 2);
        put(g, m, x, y, z);
        break;
      }
      case 'rod': {
        // thin iron: an open tube of few sides (its ends meet the next rod, a post or the floor)
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.seg ?? (q.r >= 1.1 ? 8 : q.r >= 0.8 ? 6 : 4), q.r < 1);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        put(g, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'prism': {
        const sh = new THREE.Shape(q.pts.map(([px, ph]) => new THREE.Vector2(u(px), u(ph))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropIg(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  igdparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildIg(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildIg(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003, bare: !!r.bare }; }
  },

  /* the mosaic paving: its circle cut out of a thin slab, the painting on top */
  igdrug(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.03, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
