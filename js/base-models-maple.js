/* base-models-maple.js  -  the Maple leaf set's models (furniture expansion session f, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-maple.js's BUILT, in painted units), built here by one builder, `mplparts`, as
   js/base-models-elegant.js builds its own: rounded boxes, cylinders, balls, rods, lathes, discs, rings and flat outlines
   extruded (every maple leaf, the ears, the shield), a `lie` outline laid flat (the leaves floating on the pond). A `pic`
   part (the dial, the screen's red maple, the pressed leaves) wears its crop of the front painting, all of them one
   texture. The wardrobe's doors swing (`K.door`). The rug is its leaf outline cut out, the painting on top. All solo,
   fixed colours. */

import { BUILT, RUG } from './base-furniture-maple.js';

const u = (n) => n / 32;

export const SHAPES = {
  mplbed: { make: 'mplparts', seat: u(23.5) },
  mplchair: { make: 'mplparts', seat: u(18) },
  mplarmchair: { make: 'mplparts', seat: u(15.6) },
  mplsofa: { make: 'mplparts', seat: u(15.8) },
  mpltea: { make: 'mplparts', play: { does: 'steam' } },
  mpldesk: { make: 'mplparts', top: u(27.7) },
  mplwardrobe: { make: 'mplparts', play: { does: 'door', inside: 'clothes', double: true } },
  mpldresser: { make: 'mplparts', top: u(36.4) },
  mplshelf: { make: 'mplparts' },
  mpllamp: { make: 'mplparts', play: { does: 'light' } },
  mplscreen: { make: 'mplparts' },
  mplbonsai: { make: 'mplparts' },
  mplheap: { make: 'mplparts', seat: u(12) },
  mplpond: { make: 'mplparts', play: { does: 'water', fountain: true } },
  mplumbrella: { make: 'mplparts' },
  mplbranches: { make: 'mplparts' },
  mpldeerling: { make: 'mplparts', seat: u(15.2) },
  mplleavanny: { make: 'mplparts' },
  mplnight: { make: 'mplparts', top: u(24.8) },
  mplmirror: { make: 'mplparts' },
  mplclock: { make: 'mplparts', play: { does: 'chime' } },
  mplgarland: { make: 'mplparts' },
  mplpressed: { make: 'mplparts' },
  mplsawsbuck: { make: 'mplparts' },
  mplrug: { make: 'mplrug' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropMp(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildMp(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(Math.min(q.r, q.w / 2, q.hh / 2, q.d / 2))), m, x, y, z); break;
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
        const g = new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -u(q.d) / 2);
        if (q.lie) g.rotateX(-Math.PI / 2);
        put(g, m, x, y, z);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropMp(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  mplparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildMp(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildMp(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the rug: its leaf outline cut out of a thin slab, the painting on top */
  mplrug(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.03, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
