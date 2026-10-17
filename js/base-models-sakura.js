/* base-models-sakura.js  -  the Cherry blossom series' models (furniture expansion session f, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-sakura.js's BUILT, in painted units), built here by one builder, `blsmparts`: rounded boxes,
   cylinders, balls, rods (the twigs), lathes, discs, rings, flat outlines extruded, and blossoms (flowerPts() extruded
   thin, a white five-sided centre on each). A `pic` part (the clock's dial, the screen's tree, the scroll) wears its
   crop of the front painting, all of them one texture. The wardrobe's doors swing (`K.door`). The rug is a slab, its
   painting on top. All solo, fixed colours. */

import { BUILT, flowerPts } from './base-furniture-sakura.js';

const u = (n) => n / 32;

export const SHAPES = {
  blsmbed: { make: 'blsmparts', seat: u(22) },
  blsmchair: { make: 'blsmparts', seat: u(19.5) },
  blsmsofa: { make: 'blsmparts', seat: u(16.2) },
  blsmtable: { make: 'blsmparts', top: u(28.2) },
  blsmdesk: { make: 'blsmparts', top: u(28.7) },
  blsmwardrobe: { make: 'blsmparts', play: { does: 'door', inside: 'clothes', double: true } },
  blsmdresser: { make: 'blsmparts', top: u(31.7) },
  blsmshelf: { make: 'blsmparts' },
  blsmlamp: { make: 'blsmparts', play: { does: 'light' } },
  blsmclock: { make: 'blsmparts', play: { does: 'chime' } },
  blsmscreen: { make: 'blsmparts' },
  blsmmirror: { make: 'blsmparts' },
  blsmrug: { make: 'blsmrug' },
  blsmhanging: { make: 'blsmparts' },
  blsmscroll: { make: 'blsmparts' },
  blsmwreath: { make: 'blsmparts' },
  blsmbonsai: { make: 'blsmparts' },
  blsmlantern: { make: 'blsmparts', play: { does: 'light' } },
  blsmumbrella: { make: 'blsmparts' },
  blsmtea: { make: 'blsmparts', play: { does: 'steam' } },
  blsmarch: { make: 'blsmparts' },
  blsmbasin: { make: 'blsmparts', play: { does: 'water' } },
  blsmcherrim: { make: 'blsmparts' },
  blsmhoppip: { make: 'blsmparts', play: { does: 'wobble' } },
  blsmcherubi: { make: 'blsmparts', play: { does: 'light' } },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropBl(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildBl(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q, m = q.m || def) => (m === 'glass' ? K.glass() : K[m](q.c));
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
        if (q.a0) g.rotateZ(q.a0);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        if (q.flat) g.rotateX(Math.PI / 2);
        put(g, m, x, y, z);
        break;
      }
      case 'rod': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.r > 1.2 ? 10 : q.r < 0.5 ? 5 : 7);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        put(g, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'prism': {
        const sh = new THREE.Shape(q.pts.map(([px, ph]) => new THREE.Vector2(u(px), u(ph))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        break;
      }
      case 'flower': {
        const sh = new THREE.Shape(flowerPts(u(q.r), q.rot).map(([px, py]) => new THREE.Vector2(px, py)));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        put(L.cyl(u(q.r * q.cr), u(q.d) * 0.6, u(q.r * q.cr), 5).rotateX(Math.PI / 2), q.m === 'glow' ? K.glow(q.cc) : K.plain(q.cc), x, y, z + u(q.d) * 0.55);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropBl(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  blsmparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildBl(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildBl(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the picnic rug: a slab, its painting on top */
  blsmrug(K, s, W, D, L) {
    const g = L.rbox(W - 0.02, 0.035, D - 0.02, 0.008);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0.0175, 0);
  },
};
