/* base-models-haunted.js  -  the Haunted mansion set's models (furniture expansion session l, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-haunted.js's BUILT, in painted units), built here by one builder, `hntparts`, as the Ramen
   set's: rounded boxes (the chairs' seats and the upholstery, the cases, the trunk, the books), cylinders (the clock's
   columns, the candles, the hat), balls (Mismagius, Sableye, Shuppet, the armour's plates, the roses), rods (the
   cobwebs, the spindles, the cage's bars, the halberd), lathes (the turned legs and posts, the teapot, the urn, the
   helmet, Phantump's stump, the lamp's shade), discs (the pendulum, the mirror, the moth holes), rings (the mirror's
   frame, the scrolls, the cage's hoops), wedges (the rocker's runners) and flat outlines extruded (the lid, the
   crests, the drapes, the window's arch). A `pic` part (the portraits, the clock's dial, the harpsichord's keys) wears
   its crop of the front painting, all of them one texture. The bookcase's middle is a door of its own, swinging on the
   stone passage modelled behind it. The rug is a thin slab, the painting on top. All solo, fixed colours. */

import { BUILT, RUG } from './base-furniture-haunted.js';

const u = (n) => n / 32;

export const SHAPES = {
  hntharpsichord: { make: 'hntparts', play: { does: 'note', voice: 'pluck' } },
  hntclock: { make: 'hntparts', play: { does: 'chime' } },
  hntseance: { make: 'hntparts', play: { does: 'light' } },
  hntbookcase: { make: 'hntparts', play: { does: 'door', inside: 'ghost' } },
  hntdesk: { make: 'hntparts', top: u(24.4), play: { does: 'give', gives: 'paper', sound: 'fx-whoosh' } },
  hntlamp: { make: 'hntparts', play: { does: 'light' } },
  hntrocker: { make: 'hntparts', seat: u(20), play: { does: 'rock' } },
  hntwingback: { make: 'hntparts', seat: u(15.3) },
  hntchaise: { make: 'hntparts', seat: u(15) },
  hntchair: { make: 'hntparts', seat: u(18.3) },
  hnttable: { make: 'hntparts', top: u(24.2) },
  hnttrunk: { make: 'hntparts', top: u(23), play: { does: 'wobble' } },
  hntvanity: { make: 'hntparts', play: { does: 'treasure' } },
  hntwindow: { make: 'hntparts', play: { does: 'light' } },
  hntportraits: { make: 'hntparts' },
  hntsconce: { make: 'hntparts', play: { does: 'light', flicker: true } },
  hntrug: { make: 'hntrug' },
  hntarmour: { make: 'hntparts', play: { does: 'wobble' } },
  hntbirdcage: { make: 'hntparts', play: { does: 'wobble' } },
  hntphantump: { make: 'hntparts', play: { does: 'wobble' } },
  hntbed: { make: 'hntparts', seat: u(21) },
  hntbust: { make: 'hntparts', play: { does: 'look' } },
  hntcandles: { make: 'hntparts', play: { does: 'light', flicker: true } },
  hntconsole: { make: 'hntparts', top: u(30) },
  hntcoatstand: { make: 'hntparts', play: { does: 'wobble' } },
};
/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropHn(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildHn(K, L, parts, put, W, def) {
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
      case 'wedge': {
        // the profile drawn in the shape's (-z, up) plane, extruded w along its own z, then turned so that runs across x
        const sh = new THREE.Shape(q.pts.map(([pz, up]) => new THREE.Vector2(-u(pz), u(up))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.w), bevelEnabled: false }).translate(0, 0, -u(q.w) / 2).rotateY(Math.PI / 2), m, x, y, z);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropHn(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  hntparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildHn(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildHn(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003, bare: !!r.bare }; }
  },

  /* the damask rug: a thin slab, the painting on top */
  hntrug(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.025, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
