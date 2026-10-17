/* base-models-rattan.js  -  the Rattan set's models (furniture expansion session d, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-rattan.js's BUILT, in painted units), built here by one builder, `rtnparts`: rounded boxes,
   cylinders, balls, rods, lathes, discs, rings (whole, oval or part arcs) and flat outlines extruded (the peacock fan,
   palm fronds). Woven cane wears the cloth weave in the cane's colour, no strands. A `pic` part (a dial, a leaf print)
   wears its crop of the front painting, all of them one texture. The wardrobe's doors swing (`K.door`). The jute rug is
   its round cut out, the painting on top. All solo, fixed colours. */

import { BUILT, RUGS } from './base-furniture-rattan.js';

const u = (n) => n / 32;

export const SHAPES = {
  rtnbed: { make: 'rtnparts', seat: u(22) },
  rtnpeacock: { make: 'rtnparts', seat: u(25) },
  rtneggchair: { make: 'rtnparts', seat: u(30), play: { does: 'rock' } },
  rtnsofa: { make: 'rtnparts', seat: u(22) },
  rtntable: { make: 'rtnparts', top: u(19.5) },
  rtndesk: { make: 'rtnparts', top: u(30.3) },
  rtnwardrobe: { make: 'rtnparts', play: { does: 'door', inside: 'clothes', double: true } },
  rtndresser: { make: 'rtnparts', top: u(35.2) },
  rtnladder: { make: 'rtnparts' },
  rtnlamp: { make: 'rtnparts', play: { does: 'light' } },
  rtnclock: { make: 'rtnparts', play: { does: 'chime' } },
  rtnscreen: { make: 'rtnparts' },
  rtnmirror: { make: 'rtnparts' },
  rtnlounger: { make: 'rtnparts', seat: u(19.5) },
  rtnbarcart: { make: 'rtnparts' },
  rtntrunk: { make: 'rtnparts', top: u(27), play: { does: 'treasure' } },
  rtnstool: { make: 'rtnparts', seat: u(25) },
  rtnhamper: { make: 'rtnparts' },
  rtnpalm: { make: 'rtnparts' },
  rtnrug: { make: 'rtnrug' },
  rtnsunburst: { make: 'rtnparts' },
  rtnbaskets: { make: 'rtnparts' },
  rtnwallshelf: { make: 'rtnparts' },
  rtnnightstand: { make: 'rtnparts', top: u(26.1) },
  rtnlantern: { make: 'rtnparts', play: { does: 'light' } },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropRt(L, g, art, [x0, y0, x1, y1]) {
  const W = art.width / L.HD, H = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / W, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / H);
}

function buildRt(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : m === 'weave' ? K.cloth(q.c) : K[m](q.c); };
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
        if (q.rot) g.rotateZ(q.rot);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
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
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropRt(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  rtnparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildRt(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildRt(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the jute rug: its round cut out, the painting on top */
  rtnrug(K, s, W, D, L) {
    const m = K.pic(K.p.art(0, L.HD));
    for (const [cx, cy, rx, ry] of RUGS[K.p.fam]) {
      const g = L.cyl(1, 0.03, 1, 40).scale(u(rx), 1, u(ry)).translate(u(cx) - W / 2, 0.015, u(cy) - D / 2);
      K.put(g, m); L.topUV(g, W, D);
    }
  },
};
