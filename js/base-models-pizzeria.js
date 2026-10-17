/* base-models-pizzeria.js  -  the Pizzeria set's models (furniture expansion session j, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-pizzeria.js's BUILT, in painted units), built here by one builder, `pzrparts`, as the Ramen
   set's: rounded boxes, cylinders (the pizzas and their trays, the flue, tins), balls (dough, tomatoes, gelato, garlic
   and the Pokémon), rods (the rolling pin, peel handles, the scooter's fork, the neon tubes), lathes (the oven's dome,
   bowls, the barrel, bottles and the fiasco necks), discs (log ends, wheels' hubs), rings (the scooter's tyres, the
   barrel's hoops, the caddy's handle) and flat outlines extruded (the oven's arches and flames, the peel's blade, the
   scooter's leg shield). A `wedge` is a side profile extruded across (the gelato glass, the register's keys, the shelf's
   brackets). A `pic` part (the menu, the poster, the signs, labels and the checked cloth's front) wears its crop of the
   front painting, all of them one texture. The painting's `tex` (grain, brick, flour, gingham, staves, straw) stays in
   the painting: the model keeps plain colours. The floor mat is a thin slab, the painting on top. All solo, fixed
   colours. */

import { BUILT, RUG } from './base-furniture-pizzeria.js';

const u = (n) => n / 32;

export const SHAPES = {
  pzroven: { make: 'pzrparts', play: { does: 'fire' } },
  pzrprep: { make: 'pzrparts', top: u(27.8) },
  pzrespresso: { make: 'pzrparts', play: { does: 'steam' } },
  pzrgelato: { make: 'pzrparts', play: { does: 'light' } },
  pzrslice: { make: 'pzrparts', play: { does: 'light' } },
  pzrtill: { make: 'pzrparts', play: { does: 'give', gives: 'coin', sound: 'fx-ding' } },
  pzrboxes: { make: 'pzrparts' },
  pzrpeel: { make: 'pzrparts' },
  pzrlogs: { make: 'pzrparts' },
  pzrcrates: { make: 'pzrparts' },
  pzrchair: { make: 'pzrparts', seat: u(20.1) },
  pzrstool: { make: 'pzrparts', seat: u(31) },
  pzrbooth: { make: 'pzrparts', seat: u(16) },
  pzrtable: { make: 'pzrparts', top: u(26.2) },
  pzrcafe: { make: 'pzrparts', top: u(27.2) },
  pzrbarrel: { make: 'pzrparts', top: u(28.8), play: { does: 'light' } },
  pzrcondiment: { make: 'pzrparts' },
  pzrscooter: { make: 'pzrparts', play: { does: 'light' } },
  pzrbasil: { make: 'pzrparts' },
  pzrmenu: { make: 'pzrparts' },
  pzrneon: { make: 'pzrparts', play: { does: 'light' } },
  pzrshelf: { make: 'pzrparts' },
  pzrposter: { make: 'pzrparts' },
  pzrmat: { make: 'pzrmat' },
  pzrlickitung: { make: 'pzrparts', play: { does: 'wobble' } },
};
/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropPz(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildPz(K, L, parts, put, W, def) {
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
        const g = L.torus(u(q.r), u(q.tr), q.arc ?? Math.PI * 2, q.r > 4 ? 20 : 12);
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
        cropPz(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  pzrparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildPz(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildPz(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the tiled floor mat: a thin slab, the painting on top */
  pzrmat(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.025, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
