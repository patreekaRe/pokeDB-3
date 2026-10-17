/* base-models-bamboo.js  -  the Bamboo set's models (furniture expansion session h, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-bamboo.js's BUILT, in painted units), built here by one builder, `bmbparts`, as
   js/base-models-ranch.js builds the Ranch set: rounded boxes (square-edged slats at r 0), cylinders, balls, rods (the
   canes, their node rings and the cord lashings), lathes, discs, rings and flat outlines extruded (the leaves). A `pic`
   part (the clock's dial, Pangoro, Leafeon) wears its crop of the front painting, all of them one texture. The
   painting's `tex` (the weave, the ribs) stays in the painting: the model keeps plain colours. The wardrobe's slatted
   doors swing (`K.door`). The rug is a thin slab with its painting on top. All solo, fixed colours. */

import { BUILT } from './base-furniture-bamboo.js';

const u = (n) => n / 32;

export const SHAPES = {
  bmbbed: { make: 'bmbparts', seat: u(19.4) },
  bmbstool: { make: 'bmbparts', seat: u(20.1) },
  bmbchair: { make: 'bmbparts', seat: u(18.2) },
  bmbsofa: { make: 'bmbparts', seat: u(18) },
  bmbtable: { make: 'bmbparts', top: u(15.6) },
  bmbdesk: { make: 'bmbparts', top: u(27.7) },
  bmbwardrobe: { make: 'bmbparts', play: { does: 'door', inside: 'clothes', double: true } },
  bmbdresser: { make: 'bmbparts', top: u(33.8) },
  bmbshelf: { make: 'bmbparts' },
  bmblamp: { make: 'bmbparts', play: { does: 'light' } },
  bmblantern: { make: 'bmbparts', play: { does: 'light' } },
  bmbclock: { make: 'bmbparts', play: { does: 'chime' } },
  bmbscreen: { make: 'bmbparts' },
  bmbmirror: { make: 'bmbparts' },
  bmbrug: { make: 'bmbrug' },
  bmbwallshelf: { make: 'bmbparts' },
  bmbflutes: { make: 'bmbparts', play: { does: 'note', voice: 'flute', high: true } },
  bmbvase: { make: 'bmbparts' },
  bmbgrove: { make: 'bmbparts' },
  bmbpartition: { make: 'bmbparts' },
  bmbsteamer: { make: 'bmbparts', play: { does: 'steam' } },
  bmbdrum: { make: 'bmbparts', play: { does: 'beat', hits: ['fx-drum'] } },
  bmbchime: { make: 'bmbparts', play: { does: 'note', voice: 'mallet' } },
  bmbnightstand: { make: 'bmbparts', top: u(26) },
  bmbhamper: { make: 'bmbparts' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropBmb(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildBmb(K, L, parts, put, W, def) {
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
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.seg ?? (q.r > 1.2 ? 10 : q.r < 0.4 ? 5 : 8));
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
        cropBmb(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  bmbparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildBmb(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildBmb(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the woven mat: a thin slab, its painting on top */
  bmbrug(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape([[1, 1], [95, 1], [95, 63], [1, 63]].map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.03, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
