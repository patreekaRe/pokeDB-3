/* base-models-ranch.js  -  the Ranch set's models (furniture expansion session g, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-ranch.js's BUILT, in painted units), built here by one builder, `rnchparts`: rounded boxes,
   cylinders, balls, rods, lathes (the milk can, the lantern's globe, the cactus, the hat), discs, rings (whole or a part
   arc: the horseshoes, the handles, the wagon wheels' tyres) and flat outlines extruded (the barn roof, the saddle, the
   sheriff's star). A `pic` part (the clock's dial, the WANTED poster, the Miltank label) wears its crop of the front
   painting, all of them one texture. The painting's `tex` (plank seams, straw, cactus ribs) stays in the painting: the
   model keeps plain colours. The barn wardrobe's doors swing (`K.door`). The rug is its cowhide outline cut out of a thin
   slab, the painting on top. All solo, fixed colours. */

import { BUILT, RUG } from './base-furniture-ranch.js';

const u = (n) => n / 32;

export const SHAPES = {
  rnchbed: { make: 'rnchparts', seat: u(20) },
  rnchchair: { make: 'rnchparts', seat: u(17.7) },
  rnchrocker: { make: 'rnchparts', seat: u(18.6), play: { does: 'rock' } },
  rnchsofa: { make: 'rnchparts', seat: u(16.3) },
  rnchtable: { make: 'rnchparts', top: u(27.9) },
  rnchdesk: { make: 'rnchparts', top: u(27.8) },
  rnchwardrobe: { make: 'rnchparts', play: { does: 'door', inside: 'clothes', double: true } },
  rnchdresser: { make: 'rnchparts', top: u(33.4) },
  rnchshelf: { make: 'rnchparts' },
  rnchlantern: { make: 'rnchparts', play: { does: 'light' } },
  rnchwheellamp: { make: 'rnchparts', play: { does: 'light' } },
  rnchclock: { make: 'rnchparts', play: { does: 'chime' } },
  rnchscreen: { make: 'rnchparts' },
  rnchmirror: { make: 'rnchparts' },
  rnchrug: { make: 'rnchrug' },
  rnchshoes: { make: 'rnchparts' },
  rnchwheel: { make: 'rnchparts' },
  rnchwanted: { make: 'rnchparts' },
  rnchsaddle: { make: 'rnchparts' },
  rnchhay: { make: 'rnchparts', seat: u(19.2) },
  rnchtrough: { make: 'rnchparts', play: { does: 'water' } },
  rnchmilk: { make: 'rnchparts' },
  rnchcactus: { make: 'rnchparts' },
  rnchpost: { make: 'rnchparts', play: { does: 'beat', hits: ['fx-drum'] } },
  rnchbar: { make: 'rnchparts', top: u(34.6) },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropRn(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildRn(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? 20), m, x, y, z); break;
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
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), q.seg ?? 16), m, x, y, z); break;
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
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.r > 1.2 ? 10 : q.r < 0.4 ? 5 : 8);
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
        cropRn(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  rnchparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildRn(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildRn(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the cowhide rug: its outline cut out of a thin slab, the painting on top */
  rnchrug(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.03, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
