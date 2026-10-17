/* base-models-cruise.js  -  the Cruise cabin set's models (furniture expansion session l, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-cruise.js's BUILT, in painted units), built here by one builder, `crzparts`, as the Ramen
   set's: rounded boxes (the berths, the drawers, the trunk, the cushions), cylinders (the curtains' folds, the funnel,
   the posts), balls (the globe, the binnacle's balls, Wingull, Wailmer, Corsola), rods (the rails, the ladder, the
   lounger's arms, the rope, Corsola's horns), lathes (the cloche, the whistle, the binnacle's hood, the bollard's posts,
   Tentacool's dome), discs (the dials, the bolts, the cart's castors stood side-on with `ax: 'x'`, the armchair's rolled
   arms laid front to back), rings (the bezels, the life ring, the fiddle rail, the rope coils) and flat outlines extruded
   (the lounger's side frames, Wingull's wings, the mini bar's sunburst). A `pic` part (the trunk's labels, the chart,
   the dials, the settee's ticking) wears its crop of the front painting, all of them one texture. The trunk's and the mini
   bar's doors swing on their hinges over a modelled inside. The shuffleboard court is a thin slab, the painting on top.
   All solo, fixed colours. */

import { BUILT, RUG } from './base-furniture-cruise.js';

const u = (n) => n / 32;

export const SHAPES = {
  crzbunk: { make: 'crzparts', seat: u(17.6) },
  crzdresser: { make: 'crzparts', top: u(37) },
  crztrunk: { make: 'crzparts', play: { does: 'door', inside: 'clothes' } },
  crzvanity: { make: 'crzparts', top: u(29) },
  crzpouf: { make: 'crzparts', seat: u(18.4) },
  crzarmchair: { make: 'crzparts', seat: u(16.6) },
  crzsettee: { make: 'crzparts', seat: u(13.1) },
  crzlounger: { make: 'crzparts', seat: u(17.5) },
  crztable: { make: 'crzparts', top: u(27) },
  crzchartdesk: { make: 'crzparts', top: u(30) },
  crzservice: { make: 'crzparts', play: { does: 'steam' } },
  crzminibar: { make: 'crzparts', top: u(34), play: { does: 'door', inside: 'fridge' } },
  crzphone: { make: 'crzparts', play: { does: 'ring' } },
  crzwhistle: { make: 'crzparts', play: { does: 'note', voice: 'brass', low: true } },
  crzbinnacle: { make: 'crzparts', play: { does: 'light' } },
  crzrail: { make: 'crzparts', play: { does: 'light' } },
  crzbollard: { make: 'crzparts' },
  crzlifering: { make: 'crzparts' },
  crzclock: { make: 'crzparts', play: { does: 'chime' } },
  crzportmirror: { make: 'crzparts' },
  crzshuffle: { make: 'crzcourt' },
  crzwingull: { make: 'crzparts', play: { does: 'wobble' } },
  crzwailmer: { make: 'crzparts', seat: u(18), play: { does: 'rock' } },
  crzcorsola: { make: 'crzparts', play: { does: 'squeak' } },
  crztentacool: { make: 'crzparts', play: { does: 'light' } },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropCz(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildCz(K, L, parts, put, W, def) {
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
        const g = L.cyl(u(q.r), u(q.th), u(q.r), q.seg ?? 16);
        if (q.ax === 'x') g.rotateZ(Math.PI / 2); else g.rotateX(Math.PI / 2);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        put(g, m, x, y, z);
        break;
      }
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), q.seg ?? 16), m, x, y, z); break;
      case 'ring': {
        const g = L.torus(u(q.r), u(q.tr), q.arc ?? Math.PI * 2, q.flat ? 24 : 20);
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
        cropCz(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  crzparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildCz(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildCz(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the shuffleboard court: a thin slab of decking, the painting on top */
  crzcourt(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.025, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
