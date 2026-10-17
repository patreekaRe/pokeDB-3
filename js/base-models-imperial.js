/* base-models-imperial.js  -  the Imperial set's models (furniture expansion session d, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-imperial.js's BUILT, in painted units), built here by one builder, `impparts`: rounded and
   square-edged boxes (lattice bars), cylinders and cones, balls, rods, lathes, rings, discs and flat outlines extruded
   (roofs, the daybed's stepped back, the fan's pleats, Gyarados's fins). A `pic` part (the clock's dial, the screen's
   leaves, the scroll's painting) wears its crop of the front painting, all of them one texture. The rug is a slab with
   its painting on top. All solo, fixed colours. */

import { BUILT, RUGS } from './base-furniture-imperial.js';

const u = (n) => n / 32;

export const SHAPES = {
  impbed: { make: 'impparts', seat: u(21) },
  impchair: { make: 'impparts', seat: u(24.3) },
  impsofa: { make: 'impparts', seat: u(19) },
  imptable: { make: 'impparts', top: u(27.1) },
  impdesk: { make: 'impparts', top: u(29.2) },
  impwardrobe: { make: 'impparts', play: { does: 'door', inside: 'clothes', double: true } },
  impdresser: { make: 'impparts', top: u(40.2) },
  impshelf: { make: 'impparts' },
  implamp: { make: 'impparts', play: { does: 'light' } },
  impclock: { make: 'impparts', play: { does: 'chime' } },
  impscreen: { make: 'impparts' },
  impmirror: { make: 'impparts' },
  impgong: { make: 'impparts', play: { does: 'beat', hits: ['fx-gong'], swing: true } },
  impdrum: { make: 'impparts', play: { does: 'beat', hits: ['fx-drum'] } },
  impincense: { make: 'impparts', play: { does: 'steam' } },
  imptea: { make: 'impparts', play: { does: 'steam' } },
  impvase: { make: 'impparts' },
  impjade: { make: 'impparts' },
  implions: { make: 'impparts' },
  impdragon: { make: 'impparts' },
  impchest: { make: 'impparts', top: u(21.2), play: { does: 'treasure' } },
  imprug: { make: 'imprug' },
  impscroll: { make: 'impparts' },
  impfan: { make: 'impparts' },
  implattice: { make: 'impparts' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropImp(L, g, art, [x0, y0, x1, y1]) {
  const W = art.width / L.HD, H = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / W, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / H);
}

function buildImp(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? 20), m, x, y, z); break;
      case 'ball': {
        const r = Math.max(q.rx, q.ry, q.rz), seg = q.seg ?? (r > 8 ? 16 : r > 4 ? 12 : 8);
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
        const g = L.torus(u(q.r), u(q.tube), Math.PI * 2, q.seg ?? 24);
        put(q.flat ? g.rotateX(Math.PI / 2) : g, m, x, y, z);
        break;
      }
      case 'rod': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.r > 1.2 ? 12 : q.r > 0.5 ? 8 : 6);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        put(g, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'prism': {
        const ring = (pts) => pts.map(([px, ph]) => new THREE.Vector2(u(px), u(ph)));
        const sh = new THREE.Shape(ring(q.pts));
        for (const h of q.holes || []) sh.holes.push(new THREE.Path(ring(h)));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropImp(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  impparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildImp(K, L, kind.parts, K.put, W, kind.mat);
  },

  /* the rug: a slab, its painting on top */
  imprug(K, s, W, D, L) {
    const t = RUGS[K.p.fam] || 0.04, g = L.rbox(W - 0.02, t, D - 0.02, 0.012);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, t / 2, 0);
  },
};
