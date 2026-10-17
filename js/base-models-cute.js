/* base-models-cute.js  -  the Cute set's models (furniture expansion session e, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-cute.js's BUILT, in painted units), built here by one builder, `cuteparts`, as
   js/base-models-antique.js builds its own: rounded boxes, cylinders, balls, rods, lathes, discs, rings, flat outlines
   extruded (every heart and bow, the hearts with a soft bevel kept inside their outline) and side profiles run across
   (the rocker's runners, the music box's lid). `sheer` is see-through tinted cloth (the canopy's tent). A `pic` part
   (a dial) wears its crop of the front painting. The wardrobe's and the fridge's doors swing (`K.door`). The rug is its
   scalloped outline cut out, the painting on top. All solo, fixed colours. */

import { BUILT, RUG } from './base-furniture-cute.js';

const u = (n) => n / 32;

export const SHAPES = {
  cutebed: { make: 'cuteparts', seat: u(21.4) },
  cutechair: { make: 'cuteparts', seat: u(18.7) },
  cutesofa: { make: 'cuteparts', seat: u(17) },
  cutetable: { make: 'cuteparts', top: u(23.7) },
  cutedesk: { make: 'cuteparts', top: u(30.1) },
  cutewardrobe: { make: 'cuteparts', play: { does: 'door', inside: 'clothes', double: true } },
  cutedresser: { make: 'cuteparts', top: u(32) },
  cutevanity: { make: 'cuteparts', top: u(24.9) },
  cuteshelf: { make: 'cuteparts' },
  cutelamp: { make: 'cuteparts', play: { does: 'light' } },
  cuteclock: { make: 'cuteparts', play: { does: 'chime' } },
  cutescreen: { make: 'cuteparts' },
  cutemirror: { make: 'cuteparts' },
  cutewallclock: { make: 'cuteparts', play: { does: 'chime' } },
  cuteheartshelf: { make: 'cuteparts' },
  cutegarland: { make: 'cuteparts' },
  cutecanopy: { make: 'cuteparts', seat: u(9), play: { does: 'light' } },
  cuteteaset: { make: 'cuteparts', play: { does: 'steam' } },
  cutecakestand: { make: 'cuteparts' },
  cutemusicbox: { make: 'cuteparts', play: { does: 'player', voice: 'musicbox' } },
  cutefridge: { make: 'cuteparts', top: u(60), play: { does: 'door', inside: 'fridge' } },
  cutepouf: { make: 'cuteparts', seat: u(15), play: { does: 'boing' } },
  cutedollhouse: { make: 'cuteparts', play: { does: 'light' } },
  cuterocker: { make: 'cuteparts', seat: u(18.7), play: { does: 'rock' } },
  cuterug: { make: 'cuterug' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropCute(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildCute(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => {
    const m = q.m || def;
    if (m === 'glass') return K.glass();
    if (m === 'sheer') return K.M('glass', q.c, { key: 'sheer' });
    return K[m](q.c);
  };
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
        const g = L.torus(u(q.r), u(q.tr), Math.PI * 2, 20);
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
        const bev = q.bev ? Math.min(u(q.bev), u(q.d) * 0.45) : 0;
        const g = bev
          ? new THREE.ExtrudeGeometry(sh, { depth: u(q.d) - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelOffset: -bev, bevelSegments: 2 }).translate(0, 0, -u(q.d) / 2 + bev)
          : new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2);
        put(g, m, x, y, z);
        break;
      }
      case 'slab': {
        // the profile drawn in (z, h), run across x: the shape's x becomes z, its depth x
        const sh = new THREE.Shape(q.pts.map(([dz, dh]) => new THREE.Vector2(u(dz), u(dh))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.w), bevelEnabled: false }).translate(0, 0, -u(q.w) / 2).rotateY(-Math.PI / 2), m, x, y, z);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropCute(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  cuteparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildCute(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildCute(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the rug: its scalloped outline cut out of a thin slab, the painting on top */
  cuterug(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.03, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
