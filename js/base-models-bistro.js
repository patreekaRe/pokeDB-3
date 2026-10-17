/* base-models-bistro.js  -  the Bistro kitchen set's models (furniture expansion session i, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-bistro.js's BUILT, in painted units), built here by one builder, `bstparts`, as the Desert
   caravan set's: rounded boxes, cylinders, balls, rods (the bentwood legs, the baguettes, the bottles lying in the rack),
   lathes (the bottles, glasses, cloches, the coffee machine's dome, the herb bundles), discs (the pans, the clock's case;
   `ax: 'x'` stands one side-on, the carts' wheels), rings (whole, a part arc or lying flat: the bentwood hoops, the gas
   flames, the pot handles) and flat outlines extruded (the copper hood, Pikachu's tail, the cheese wedge). A `pic` part
   (the menu, the specials board, the clock's dial) wears its crop of the front painting, all of them one texture. The
   painting's `tex` (tiles, brushed steel, marble veins, gingham, cane, tufting, stripes) stays in the painting: the model
   keeps plain colours. The range's oven door and the fridge's glass door swing (`K.door`; the fridge's inside is
   modelled, `bare`). The rug is a thin slab, the painting on top. All solo, fixed colours. */

import { BUILT, RUG } from './base-furniture-bistro.js';

const u = (n) => n / 32;

export const SHAPES = {
  bstrange: { make: 'bstparts', play: { does: 'door', inside: 'oven' } },
  bstprep: { make: 'bstparts' },
  bstpass: { make: 'bstparts' },
  bststockpot: { make: 'bstparts', play: { does: 'steam' } },
  bstfridge: { make: 'bstparts', play: { does: 'door', inside: 'fridge' } },
  bstsink: { make: 'bstparts', play: { does: 'water' } },
  bstbar: { make: 'bstparts', top: u(35), play: { does: 'steam' } },
  bstchair: { make: 'bstparts', seat: u(18.7) },
  bsttable: { make: 'bstparts', top: u(29.4) },
  bstbanquette: { make: 'bstparts', seat: u(14.4) },
  bstcheck: { make: 'bstparts', top: u(27.8) },
  bstmenu: { make: 'bstparts' },
  bstspecials: { make: 'bstparts' },
  bstpans: { make: 'bstparts' },
  bstherbs: { make: 'bstparts' },
  bstsconce: { make: 'bstparts', play: { does: 'light' } },
  bstlamp: { make: 'bstparts', play: { does: 'light' } },
  bstclock: { make: 'bstparts', play: { does: 'chime' } },
  bstrug: { make: 'bstrug' },
  bstrack: { make: 'bstparts' },
  bstcart: { make: 'bstparts' },
  bsttrolley: { make: 'bstparts' },
  bstcoat: { make: 'bstparts' },
  bstlectern: { make: 'bstparts' },
  bstslurpuff: { make: 'bstparts' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropBs(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildBs(K, L, parts, put, W, def) {
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
        if (q.ax === 'x') g.rotateZ(Math.PI / 2); else g.rotateX(Math.PI / 2);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        put(g, m, x, y, z);
        break;
      }
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), q.seg ?? 16), m, x, y, z); break;
      case 'ring': {
        const g = L.torus(u(q.r), u(q.tr), q.arc ?? Math.PI * 2, q.flat ? 24 : 18);
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
        cropBs(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  bstparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildBs(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildBs(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003, bare: !!r.bare }; }
  },

  /* the hex tile mat: a thin slab, the painting on top */
  bstrug(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.025, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
