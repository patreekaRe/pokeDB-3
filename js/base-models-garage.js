/* base-models-garage.js  -  the Garage and workshop set's models (furniture expansion, room types, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-garage.js's BUILT, in painted units), built here by one builder, `grgparts`, as the Ranch
   set's: rounded boxes, cylinders (the tyres, the column, the drum), balls (Magnemite, the welding mask, the tank's
   ends), rods (the tools, the frames, the bicycle's tubes and spokes, the tripod), lathes (the gas bottle, the oil can,
   the chuck, the lamp's bulb, the bell), discs (`ax: 'x'` stands one side-on: the grinder's stones and motor, the
   tank, the welder's wheels), rings (whole or a part arc: the wheels and mudguards, Magnemite's magnets, the fan's
   cage, the hose coils) and flat outlines extruded (the saw, the fan blades, the flammable diamond). A `wedge` is a
   side profile extruded across (the bucket seat's back). A `pic` part (the hazard stripes, the labels, the welder's
   panel, the blueprints, the clock's dial, the diagnostics screen) wears its crop of the front painting, all of them
   one texture. The painting's `tex` (grain, tread, pegboard holes, cork, shutter slats) stays in the painting: the
   model keeps plain colours. The tool chest's cupboard door swings (`K.door`). The floor mat is a thin slab, the
   painting on top. All solo, fixed colours. */

import { BUILT, RUG } from './base-furniture-garage.js';

const u = (n) => n / 32;

export const SHAPES = {
  grgtoolchest: { make: 'grgparts', top: u(52.4), play: { does: 'door', inside: 'locker' } },
  grgbench: { make: 'grgparts', top: u(30.2) },
  grgpegboard: { make: 'grgparts' },
  grgdrill: { make: 'grgparts', play: { does: 'whirr' } },
  grggrinder: { make: 'grgparts', play: { does: 'zap' } },
  grgwelder: { make: 'grgparts', play: { does: 'light' } },
  grgtyres: { make: 'grgparts', seat: u(25.4), top: u(25.4) },
  grgjack: { make: 'grgparts' },
  grgoildrum: { make: 'grgparts', top: u(37.5) },
  grgjerry: { make: 'grgparts' },
  grgcreeper: { make: 'grgparts', seat: u(6.4) },
  grgengine: { make: 'grgparts', play: { does: 'whirr' } },
  grgbike: { make: 'grgparts' },
  grgcompressor: { make: 'grgparts', play: { does: 'steam' } },
  grgfan: { make: 'grgparts', play: { does: 'toggle', spin: true } },
  grgblueprints: { make: 'grgparts' },
  grgshutter: { make: 'grgparts' },
  grgmat: { make: 'grgmat' },
  grglamp: { make: 'grgparts', play: { does: 'light' } },
  grgshelf: { make: 'grgparts' },
  grgstool: { make: 'grgparts', seat: u(20) },
  grgclock: { make: 'grgparts', play: { does: 'chime' } },
  grgporygon: { make: 'grgparts', play: { does: 'screen', show: ['code', 'bars'] }, screen: { x: 0, y: u(40.6), w: u(18.4), h: u(12.4), z: u(7.5) } },
  grgcounter: { make: 'grgparts', top: u(36.2), play: { does: 'beat', hits: ['fx-ding'] } },
  grgbucket: { make: 'grgparts', seat: u(15) },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropGr(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildGr(K, L, parts, put, W, def) {
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
        const g = L.cyl(u(q.r), u(q.th), u(q.r), q.seg ?? 16);
        if (q.ax === 'x') g.rotateZ(Math.PI / 2);
        else { g.rotateX(Math.PI / 2); if (q.ry) g.scale(1, q.ry / q.r, 1); }
        put(g, m, x, y, z);
        break;
      }
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), q.seg ?? 16), m, x, y, z); break;
      case 'ring': {
        const g = L.torus(u(q.r), u(q.tr), q.arc ?? Math.PI * 2, q.ax === 'x' || q.r > 4 ? 20 : 12);
        if (q.a0) g.rotateZ(q.a0);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        if (q.flat) g.rotateX(Math.PI / 2);
        if (q.ax === 'x') g.rotateY(Math.PI / 2);
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
        cropGr(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  grgparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildGr(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildGr(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003, bare: !!r.bare }; }
  },

  /* the hazard floor mat: a thin slab, the painting on top */
  grgmat(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.025, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
