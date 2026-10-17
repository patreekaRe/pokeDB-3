/* base-models-rocket.js  -  the Team Rocket hideout set's models (furniture expansion session b, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-rocket.js's BUILT, in painted units), built here by one builder, `rktparts`: rounded boxes,
   cylinders, balls, rods, lathes, discs and flat outlines extruded (the R, shared point for point with the painting). A
   `pic` part (a screen, a poster, a label) wears its crop of the front painting, all of them one texture; the safe's
   door swings (`K.door`). The rugs are slabs with their painting on top. All solo, fixed colours. */

import { BUILT } from './base-furniture-rocket.js';

const u = (n) => n / 32;

export const SHAPES = {
  rktrsign: { make: 'rktparts', play: { does: 'light' } },
  rktemblem: { make: 'rktparts' },
  rktmonitors: { make: 'rktparts', screen: { x: 0, y: u(60.5), w: u(16.5), h: u(14.5), z: u(-2.95) + 0.004 }, play: { does: 'screen', show: ['radar', 'code'] } },
  rktswitch: { make: 'rktparts', play: { does: 'give', gives: 'coin', sound: 'fx-ding' } },
  rktballoon: { make: 'rktparts', play: { does: 'sway' } },
  rktspinner: { make: 'rktrug' },
  rktwarp: { make: 'rktrug', play: { does: 'light' } },
  rktdesk: { make: 'rktparts', top: u(28.7) },
  rktchair: { make: 'rktparts', seat: u(20) },
  rktuniform: { make: 'rktparts' },
  rktcrates: { make: 'rktparts', top: u(34) },
  rktelevator: { make: 'rktparts' },
  rktscope: { make: 'rktparts' },
  rkttank: { make: 'rktparts', play: { does: 'bubbles' } },
  rktcage: { make: 'rktparts' },
  rktterminal: { make: 'rktparts', screen: { x: 0, y: u(51), w: u(21), h: u(18), z: u(4.05) + 0.004 }, play: { does: 'screen', show: ['code', 'pcbox'] } },
  rktwanted: { make: 'rktparts' },
  rktprepare: { make: 'rktparts' },
  rktradio: { make: 'rktparts', play: { does: 'player', voice: 'reed', static: true } },
  rktvending: { make: 'rktparts', play: { does: 'give', gives: 'can' } },
  rktflag: { make: 'rktparts' },
  rktsafe: { make: 'rktparts', top: u(37), play: { does: 'door', inside: 'gold' } },
  rktclaw: { make: 'rktparts', play: { does: 'give', gives: 'prize', wait: 1400 } },
  rktmecha: { make: 'rktparts', play: { does: 'light' } },
  rktbeacon: { make: 'rktparts', play: { does: 'light' } },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function crop(L, g, art, [x0, y0, x1, y1]) {
  const W = art.width / L.HD, H = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / W, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / H);
}

function build(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), 24), m, x, y, z); break;
      case 'ball': {
        const r = Math.max(q.rx, q.ry, q.rz), seg = Math.max(8, L.sides(u(r), 24));
        put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), 1, 1, seg), m, x, y, z);
        break;
      }
      case 'disc': {
        const g = L.cyl(u(q.r), u(q.th), u(q.r), 24).rotateX(Math.PI / 2);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        put(g, m, x, y, z);
        break;
      }
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), 20), m, x, y, z); break;
      case 'rod': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.r > 1.2 ? 12 : 8);
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
        crop(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, q.lit ? L.litPic(art, q.lit) : K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  rktparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    build(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) build(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* a floor panel: a steel slab, its painting on top, the warp panel's ring lit */
  rktrug(K, s, W, D, L) {
    const g = L.rbox(W - 0.02, 0.035, D - 0.02, 0.008);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0.0175, 0);
    if (K.p.fam === 'rktwarp') K.put(L.torus(u(11), u(0.9), Math.PI * 2, 28).rotateX(Math.PI / 2), K.glow('#5ad0f0'), 0, 0.036, 0);
  },
};
