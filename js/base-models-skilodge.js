/* base-models-skilodge.js  -  the Ski lodge set's models (furniture expansion session l, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-skilodge.js's BUILT, in painted units), built here by one builder, `sklparts`, as the Cinema
   set's: rounded boxes (the counters, the cushions, the boots, the cabin's shell), cylinders (the hearth's ring, the
   flue, the log legs, the lamp's shade), balls (the hearth's stones, the sheepskin, Swinub's nose, Delibird, Cubchoo),
   rods (the lift's frame and cable, the forks, the handles), lathes (the copper hood and pots, the flames, the bobble
   hats, the mugs), discs (the snowboards' ends, the snowmobile's wheels), rings (the mugs' handles) and flat outlines
   extruded (the sled's hull, the arrows, the old skis, the windscreen). A `pic` part (the signs, the trail map, the
   window's view) wears its crop of the front painting, all of them one texture. The locker's door swings on its
   hinge; the kiosk's screen is live (`screen`). The knit rug is a thin slab, the painting on top. All solo, fixed
   colours. */

import { BUILT, RUG } from './base-furniture-skilodge.js';

const u = (n) => n / 32;

export const SHAPES = {
  sklhearth: { make: 'sklparts', play: { does: 'fire' } },
  sklcocoa: { make: 'sklparts', top: u(29), play: { does: 'steam' } },
  sklfondue: { make: 'sklparts', play: { does: 'brew' } },
  sklbootdryer: { make: 'sklparts', play: { does: 'whirr' } },
  sklrental: { make: 'sklparts', top: u(31.6), play: { does: 'give', gives: 'paper', sound: 'fx-ding' } },
  skltickets: { make: 'sklparts', screen: { x: 0, y: u(36), w: u(16), h: u(11), z: u(8.8) + 0.004 }, play: { does: 'screen', show: ['ticket'], gives: 'coin' } },
  skllift: { make: 'sklparts', seat: u(20) },
  sklgondola: { make: 'sklparts', seat: u(16) },
  sklsofa: { make: 'sklparts', seat: u(15) },
  sklarmchair: { make: 'sklparts', seat: u(15.4) },
  skltable: { make: 'sklparts', top: u(16.4) },
  sklwaxbench: { make: 'sklparts', play: { does: 'steam' } },
  skllocker: { make: 'sklparts', play: { does: 'door', inside: 'locker' } },
  sklboardrack: { make: 'sklparts' },
  sklcubbies: { make: 'sklparts', top: u(40) },
  sklmap: { make: 'sklparts', play: { does: 'light' } },
  sklwindow: { make: 'sklparts' },
  sklskis: { make: 'sklparts' },
  sklrug: { make: 'sklrug' },
  sklsnowmobile: { make: 'sklparts', seat: u(23.6), play: { does: 'whirr' } },
  skldelibird: { make: 'sklparts', play: { does: 'wobble' } },
  sklcubchoo: { make: 'sklparts', play: { does: 'steam' } },
  sklpatrol: { make: 'sklparts', play: { does: 'rock' } },
  sklsignpost: { make: 'sklparts' },
  skllamp: { make: 'sklparts', play: { does: 'light' } },
};
/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropSk(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildSk(K, L, parts, put, W, def) {
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
        cropSk(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  sklparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildSk(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildSk(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the knit rug: a thin slab, the painting on top */
  sklrug(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.025, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
