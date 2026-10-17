/* base-models-daycare.js  -  the Day Care set's models (furniture expansion session c, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-daycare.js's BUILT, in painted units), built here by one builder, `dcparts`: rounded boxes,
   cylinders and cones, balls, rods, lathes, level rings, discs and flat outlines extruded (rockers, flames, the slide's
   chute). A `pic` part (a label, a sign, a block's letter) wears its crop of the front painting, all of them one texture.
   The rugs are slabs with their painting on top. All solo, fixed colours. */

import { BUILT, RUGS } from './base-furniture-daycare.js';

const u = (n) => n / 32;

export const SHAPES = {
  dceggbasket: { make: 'dcparts' },
  dceggtier: { make: 'dcparts' },
  dcincubator: { make: 'dcparts', play: { does: 'light' } },
  dchatchnest: { make: 'dcparts', play: { does: 'wobble' } },
  dccrib: { make: 'dcparts', seat: u(17.4) },
  dccradle: { make: 'dcparts', seat: u(22.2), play: { does: 'rock' } },
  dcplaypen: { make: 'dcparts', seat: u(3) },
  dchighchair: { make: 'dcparts', seat: u(31.1) },
  dcmilkrack: { make: 'dcparts', top: u(41.7) },
  dctoybox: { make: 'dcparts', top: u(22.7), play: { does: 'treasure' } },
  dcblocks: { make: 'dcparts', play: { does: 'wobble' } },
  dcponyta: { make: 'dcparts', seat: u(28.1), play: { does: 'rock' } },
  dcwalker: { make: 'dcparts', play: { does: 'bounce' } },
  dcnapmats: { make: 'dcrug' },
  dcchanging: { make: 'dcparts', top: u(32.5) },
  dccounter: { make: 'dcparts', top: u(32.4), play: { does: 'give', gives: 'coin', sound: 'fx-ding' } },
  dcsign: { make: 'dcparts' },
  dcstepchart: { make: 'dcparts' },
  dcheight: { make: 'dcparts' },
  dcabcrug: { make: 'dcrug' },
  dcnightlight: { make: 'dcparts', play: { does: 'light' } },
  dcslide: { make: 'dcparts' },
  dcballpit: { make: 'dcparts', seat: u(15), play: { does: 'boing' } },
  dcsandbox: { make: 'dcparts', seat: u(8) },
  dcmobile: { make: 'dcparts', play: { does: 'spin' } },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropDc(L, g, art, [x0, y0, x1, y1]) {
  const W = art.width / L.HD, H = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / W, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / H);
}

function buildDc(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), 24), m, x, y, z); break;
      case 'ball': {
        const r = Math.max(q.rx, q.ry, q.rz), seg = q.seg ?? Math.max(8, L.sides(u(r), 24));
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
      case 'ring': put(L.torus(u(q.r), u(q.tube), Math.PI * 2, q.seg ?? 24).rotateX(Math.PI / 2), m, x, y, z); break;
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
        cropDc(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, q.lit ? L.litPic(art, q.lit) : K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  dcparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildDc(K, L, kind.parts, K.put, W, kind.mat);
  },

  /* a soft mat: a slab, its painting on top */
  dcrug(K, s, W, D, L) {
    const t = RUGS[K.p.fam] || 0.04, g = L.rbox(W - 0.02, t, D - 0.02, 0.012);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, t / 2, 0);
  },
};
