/* base-models-ironwood.js  -  the Ironwood set's models (furniture expansion session d, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-ironwood.js's BUILT, in painted units), built here by one builder, `iwparts`: rounded boxes,
   cylinders, balls, rods, lathes, discs, rings and flat outlines extruded; the lockers' doors swing (`K.door`). A `pic`
   part (a dial, a pegboard, a number plate) wears its crop of the front painting, all of them one texture. The rug is a
   slab with its painting on top. All solo, fixed colours. */

import { BUILT } from './base-furniture-ironwood.js';

const u = (n) => n / 32;

export const SHAPES = {
  iwbed: { make: 'iwparts', seat: u(20) },
  iwchair: { make: 'iwparts', seat: u(18.6) },
  iwstool: { make: 'iwparts', seat: u(27.8) },
  iwsofa: { make: 'iwparts', seat: u(17.5) },
  iwtable: { make: 'iwparts', top: u(26.3) },
  iwdesk: { make: 'iwparts', top: u(28.7) },
  iwlocker: { make: 'iwparts', play: { does: 'door', inside: 'clothes' } },
  iwdresser: { make: 'iwparts', top: u(33.6) },
  iwpipeshelf: { make: 'iwparts', top: u(76.1) },
  iwfloorlamp: { make: 'iwparts', play: { does: 'light' } },
  iwpostclock: { make: 'iwparts', play: { does: 'chime' } },
  iwworkbench: { make: 'iwparts', top: u(28.6) },
  iwcart: { make: 'iwparts', top: u(35.1) },
  iwcrate: { make: 'iwparts', top: u(26.4) },
  iwcoatrack: { make: 'iwparts' },
  iwscreen: { make: 'iwparts' },
  iwmirror: { make: 'iwparts' },
  iwtoolchest: { make: 'iwparts', top: u(36.2), play: { does: 'treasure' } },
  iwstove: { make: 'iwparts', play: { does: 'fire' } },
  iwtrunk: { make: 'iwparts', seat: u(23.8), play: { does: 'treasure' } },
  iwrug: { make: 'iwrug' },
  iwpegboard: { make: 'iwparts' },
  iwwallclock: { make: 'iwparts', play: { does: 'chime' } },
  iwwallshelf: { make: 'iwparts' },
  iwcagelamp: { make: 'iwparts', play: { does: 'light' } },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropIw(L, g, art, [x0, y0, x1, y1]) {
  const W = art.width / L.HD, H = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / W, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / H);
}

function buildIw(K, L, parts, put, W, def, pics) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.M('glass', q.c) : K[m](q.c); };
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
      case 'disc': put(L.cyl(u(q.r), u(q.th), u(q.r), q.seg ?? 16).rotateX(Math.PI / 2), m, x, y, z); break;
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), q.seg ?? 16), m, x, y, z); break;
      case 'ring': {
        const g = L.torus(u(q.r), u(q.tr), Math.PI * 2, 16);
        if (q.flat) g.rotateX(Math.PI / 2);
        put(g, m, x, y, z);
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
        const sh = new THREE.Shape(q.pts.map(([px, ph]) => new THREE.Vector2(u(px), u(ph))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        break;
      }
      case 'pic': {
        const art = pics.art ||= K.p.art(0, L.HD, true), H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropIw(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  iwparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam], pics = {};
    buildIw(K, L, kind.parts, K.put, W, kind.mat, pics);
    for (const d of kind.doors) buildIw(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat, pics);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the worn rug: a slab, its painting on top */
  iwrug(K, s, W, D, L) {
    const g = L.rbox(W - 0.02, 0.03, D - 0.02, 0.008);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0.015, 0);
  },
};
