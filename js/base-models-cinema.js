/* base-models-cinema.js  -  the Cinema set's models (furniture expansion session k, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-cinema.js's BUILT, in painted units), built here by one builder, `cnmparts`, as the Ramen
   set's: rounded boxes (the seats, the counter, the cabinets), cylinders (the curtains' folds, the film cans, the posts),
   balls (the popcorn, Ditto, Smeargle), rods (the velvet rope, the easel's legs, the chair's X frame), lathes (the
   popcorn dome, the Pikachu bucket, the stanchions' feet, the cups), discs (the reels, the marquee's bulbs), rings (the
   reels' rims) and flat outlines extruded (the projector's beam, the deco crests, the sconce's fan, Pikachu's ears). A
   `pic` part (the posters, the signs' words, the clapperboard) wears its crop of the front painting, all of them one
   texture. The silver screen's picture is live (`screen`). The aisle carpet is a thin slab, the painting on top. All
   solo, fixed colours. */

import { BUILT, RUG } from './base-furniture-cinema.js';

const u = (n) => n / 32;

export const SHAPES = {
  cnmseats: { make: 'cnmparts', seat: u(14.8) },
  cnmseat: { make: 'cnmparts', seat: u(14.8) },
  cnmvip: { make: 'cnmparts', seat: u(15) },
  cnmscreen: { make: 'cnmparts', screen: { x: 0, y: u(42), w: u(54), h: u(40), z: u(-4.6) + 0.004 }, play: { does: 'screen', show: ['cartoon', 'battle', 'weather', 'quiz'] } },
  cnmprojector: { make: 'cnmparts', play: { does: 'light' } },
  cnmreels: { make: 'cnmparts', top: u(52) },
  cnmpopcorn: { make: 'cnmparts', play: { does: 'give', gives: 'popcorn' } },
  cnmcounter: { make: 'cnmparts', top: u(32) },
  cnmcandy: { make: 'cnmparts' },
  cnmsoda: { make: 'cnmparts', play: { does: 'water' } },
  cnmhotdog: { make: 'cnmparts', play: { does: 'steam' } },
  cnmpodium: { make: 'cnmparts', top: u(32.6), play: { does: 'give', gives: 'paper', sound: 'fx-whirr' } },
  cnmropes: { make: 'cnmparts' },
  cnmmarquee: { make: 'cnmparts', play: { does: 'light' } },
  cnmposters: { make: 'cnmparts' },
  cnmexit: { make: 'cnmparts', play: { does: 'light' } },
  cnmsconce: { make: 'cnmparts', play: { does: 'light' } },
  cnmchair: { make: 'cnmparts', seat: u(17.3) },
  cnmsmeargle: { make: 'cnmparts', play: { does: 'wobble' } },
  cnmcans: { make: 'cnmparts', top: u(15.2) },
  cnmditto: { make: 'cnmparts', play: { does: 'boing' } },
  cnmtorch: { make: 'cnmparts', play: { does: 'light' } },
  cnmcarpet: { make: 'cnmcarpet' },
  cnmpikabucket: { make: 'cnmparts', play: { does: 'give', gives: 'popcorn' } },
  cnmeasel: { make: 'cnmparts' },
};
/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropCn(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildCn(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': { const g = L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? 20); if (q.sz) g.scale(1, 1, q.sz); put(g, m, x, y, z); break; }
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
        cropCn(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  cnmparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildCn(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildCn(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the aisle carpet: a thin slab, the painting on top */
  cnmcarpet(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.025, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
