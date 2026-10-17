/* base-models-stonezen.js  -  the Stone zen set's models (furniture expansion session h, 2026-10-17), for the backyard.
   js/base-models-f.js's head says how a batch works. Each upright kind is the same list of parts its painting paints
   (js/base-furniture-stonezen.js's BUILT, in painted units), built here by one builder, `stzparts`: boxes, cylinders and
   lathes (hexagonal lantern roofs turned flat to the front by `ry`; a `sq` lathe is square, its corners at 45 degrees so
   its front half-width is r), balls, discs, rings, rods (bamboo, iron, the lanterns' legs), extruded outlines (the bridge's
   arched slab, the shrine's gable, the screen's round window) and rocks: a sphere pushed out round its front by the
   painting's own outline (rockOutline()), cut flat underneath and faceted. Stone is plain, moss cloth, cedar and bamboo
   wood. The sundial's face and the signboard wear their crops of the front painting. The ground pieces are their
   outlines cut from a thin slab, the painting on top. All solo, fixed colours. */

import { BUILT, RUGS, rockOutline } from './base-furniture-stonezen.js';

const u = (n) => n / 32;

export const SHAPES = {
  stzbench: { make: 'stzparts', seat: u(18) },
  stztable: { make: 'stzparts', top: u(26.7) },
  stzstool: { make: 'stzparts', seat: u(15.6) },
  stzkasuga: { make: 'stzparts', play: { does: 'light' } },
  stzyukimi: { make: 'stzparts', play: { does: 'light' } },
  stztsukubai: { make: 'stzparts', play: { does: 'water' } },
  stzgravel: { make: 'stzrug' },
  stzwaves: { make: 'stzrug' },
  stzsteps: { make: 'stzrug' },
  stzstream: { make: 'stzrug' },
  stzrocks: { make: 'stzparts' },
  stzmoss: { make: 'stzparts' },
  stzpagoda: { make: 'stzparts' },
  stzbridge: { make: 'stzparts' },
  stzkoi: { make: 'stzparts', play: { does: 'water' } },
  stzscreen: { make: 'stzparts' },
  stzgate: { make: 'stzparts' },
  stzhokora: { make: 'stzparts' },
  stzrake: { make: 'stzparts' },
  stzpine: { make: 'stzparts' },
  stzsundial: { make: 'stzparts' },
  stzsign: { make: 'stzparts' },
  stzgeodude: { make: 'stzparts' },
  stzstonjourner: { make: 'stzparts' },
  stzbronzor: { make: 'stzparts' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropZn(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

/** A rock part: a faceted sphere whose front silhouette is the painting's outline, its foot flat on 0. */
function rockGeo(L, q) {
  const { f, base, cx, hx, top, fmax } = rockOutline(q), seg = q.seg ?? (q.rx + q.hh > 30 ? 10 : 8);
  const g = new L.THREE.SphereGeometry(1, seg, Math.max(5, Math.round(seg * 0.7))), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = f(Math.hypot(x, y) < 1e-6 ? 0 : Math.atan2(y, x));
    pos.setXYZ(i, (x * k - cx) / hx * u(q.rx), (Math.max(-base, y * k) + base) / (top + base) * u(q.hh), z * k / fmax * u(q.rz));
  }
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  return flat;
}

function buildZn(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => {
    const m = q.m || def;
    return m === 'glass' ? K.glass() : m === 'stone' ? K.plain(q.c) : m === 'moss' ? K.cloth(q.c) : K[m](q.c);
  };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': {
        const g = L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? 20);
        if (q.ry) g.rotateY(q.ry);
        put(g, m, x, y, z);
        break;
      }
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
      case 'lathe': {
        const k = q.sq ? Math.SQRT2 : 1, g = L.lathe(q.pts.map(([r, up]) => [u(r) * k, u(up)]), q.sq ? 4 : q.seg ?? 16, !!q.sq);
        if (q.sq) g.rotateY(Math.PI / 4);
        if (q.ry) g.rotateY(q.ry);
        if (q.rot) g.rotateZ(q.rot);
        put(g, m, x, y, z);
        break;
      }
      case 'ring': {
        const g = L.torus(u(q.r), u(q.tr), q.arc ?? Math.PI * 2, q.seg ?? 20);
        if (q.a0) g.rotateZ(q.a0);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        if (q.flat) g.rotateX(Math.PI / 2);
        put(g, m, x, y, z);
        break;
      }
      case 'rod': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.seg ?? (q.r >= 1.1 ? 8 : q.r >= 0.8 ? 6 : 4), q.r < 1);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        put(g, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'prism': {
        const sh = new THREE.Shape(q.pts.map(([px, ph]) => new THREE.Vector2(u(px), u(ph))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        break;
      }
      case 'rock': put(rockGeo(L, q), m, x, y, z); break;
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropZn(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  stzparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildZn(K, L, kind.parts, K.put, W, kind.mat);
  },

  /* a ground piece: its outline cut from a thin slab, the painting on top */
  stzrug(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUGS[K.p.fam].map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.03, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
