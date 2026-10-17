/* base-models-partner.js  -  the Partner care set's models (furniture expansion session c, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-partner.js's BUILT, in painted units), built here by one builder, `pcparts`: rounded boxes,
   cylinders, balls, rods, lathes, discs, rings and flat outlines extruded. A `pic` part (a dial, a label, a photo) wears
   its crop of the front painting, all of them one texture. The paw rug is its outline cut out (RUGS), the runner a slab,
   the painting on top of each. All solo, fixed colours. */

import { BUILT, RUGS } from './base-furniture-partner.js';

const u = (n) => n / 32;

export const SHAPES = {
  pcbowl: { make: 'pcparts' },
  pcdoublebowl: { make: 'pcparts' },
  pcbigbowl: { make: 'pcparts' },
  pcfountain: { make: 'pcparts', play: { does: 'water', fountain: true } },
  pcpuffstand: { make: 'pcparts', play: { does: 'give', gives: 'gumball' } },
  pcbeanjar: { make: 'pcparts', play: { does: 'give', gives: 'gumball' } },
  pcblockshelf: { make: 'pcparts', top: u(40.3) },
  pcgroomtable: { make: 'pcparts', top: u(25), play: { does: 'whirr' } },
  pcbrushrack: { make: 'pcparts' },
  pcbathtub: { make: 'pcparts', play: { does: 'bubbles', foam: true } },
  pccushbed: { make: 'pcparts', seat: u(9) },
  pcbasketbed: { make: 'pcparts', seat: u(13) },
  pcbigbed: { make: 'pcparts', seat: u(15.2) },
  pctower: { make: 'pcparts', seat: u(58) },
  pctoycrate: { make: 'pcparts', play: { does: 'treasure' } },
  pcperch: { make: 'pcparts', seat: u(51), play: { does: 'rock' } },
  pcheatrock: { make: 'pcparts', seat: u(9.5), play: { does: 'light' } },
  pcsunplanter: { make: 'pcparts', seat: u(13), play: { does: 'light' } },
  pcsplashtub: { make: 'pcparts', play: { does: 'fish' } },
  pcweigh: { make: 'pcparts', seat: u(5.5) },
  pcvitamins: { make: 'pcparts' },
  pcleash: { make: 'pcparts' },
  pcrosettes: { make: 'pcparts' },
  pcpawrug: { make: 'pcrug' },
  pctrailrug: { make: 'pcrug' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropPc(L, g, art, [x0, y0, x1, y1]) {
  const W = art.width / L.HD, H = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / W, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / H);
}

function buildPc(K, L, parts, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2, put = K.put;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
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
        const g = L.torus(u(q.r), u(q.tr), Math.PI * 2, 20);
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
        cropPc(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  pcparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildPc(K, L, kind.parts, W, kind.mat);
  },

  /* a rug: the paw rug's pad and toes cut out, the runner a slab, the painting on top */
  pcrug(K, s, W, D, L) {
    const m = K.pic(K.p.art(0, L.HD)), shapes = RUGS[K.p.fam];
    if (!shapes) {
      const g = L.rbox(W - 0.02, 0.035, D - 0.02, 0.008);
      L.topUV(g, W, D);
      K.put(g, m, 0, 0.0175, 0);
      return;
    }
    for (const [cx, cy, rx, ry] of shapes) {
      const g = L.cyl(1, 0.03, 1, 32).scale(u(rx), 1, u(ry)).translate(u(cx) - W / 2, 0.015, u(cy) - D / 2);
      K.put(g, m); L.topUV(g, W, D);
    }
  },
};
