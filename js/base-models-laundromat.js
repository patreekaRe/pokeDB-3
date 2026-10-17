/* base-models-laundromat.js  -  the Laundromat set's models (furniture expansion session j, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-laundromat.js's BUILT, in painted units), built here by one builder, `lndparts`, as the
   Ramen shop's: rounded boxes (the sign's A-frame boards leant back by `rx`), cylinders, balls (the laundry in the
   drums, Wooloo's wool, the gumballs), rods (the chrome legs and frames, the hangers, the neon tubes), lathes (the bell,
   the bag, the bottles), discs (the portholes' glass and drums; `ax: 'x'` the castors, side-on), rings (the portholes'
   chrome rims, the neon bubbles) and flat outlines extruded (the shirts, the socks, Rotom's plasma, the iron). A `pic`
   part (the timers, the labels, the dial, the Gyarados towel, the Lotad soap boxes, the signs' words) wears its crop of
   the front painting, all of them one texture. The painting's `tex` (basket mesh, towel ribs) stays in the painting:
   the model keeps plain colours. The coin washer's round door swings (`K.door`) on the drum and wash modelled behind it
   (`bare`). The floor mat is a thin slab, the painting on top. All solo, fixed colours. */

import { BUILT, RUG } from './base-furniture-laundromat.js';

const u = (n) => n / 32;

export const SHAPES = {
  lndwasher: { make: 'lndparts', play: { does: 'door', inside: 'clothes' } },
  lndrotom: { make: 'lndparts', play: { does: 'bubbles', foam: true } },
  lndstack: { make: 'lndparts', play: { does: 'whirr' } },
  lnddryers: { make: 'lndparts', play: { does: 'whirr' } },
  lndpress: { make: 'lndparts', play: { does: 'steam' } },
  lndvend: { make: 'lndparts', play: { does: 'give', gives: 'can' } },
  lndchange: { make: 'lndparts', play: { does: 'give', gives: 'coin' } },
  lndironing: { make: 'lndparts', top: u(31.8), play: { does: 'steam' } },
  lndseats: { make: 'lndparts', seat: u(17.3) },
  lndchair: { make: 'lndparts', seat: u(17.2) },
  lndfold: { make: 'lndparts', top: u(29.9) },
  lndmagtable: { make: 'lndparts', top: u(16) },
  lndcounter: { make: 'lndparts', top: u(34.1), play: { does: 'chime' } },
  lndcart: { make: 'lndparts' },
  lndbaskets: { make: 'lndparts' },
  lndsoap: { make: 'lndparts' },
  lndneon: { make: 'lndparts', play: { does: 'light' } },
  lndclock: { make: 'lndparts', play: { does: 'chime' } },
  lndsocks: { make: 'lndparts' },
  lndmat: { make: 'lndmat' },
  lndrail: { make: 'lndparts' },
  lndrack: { make: 'lndparts' },
  lndgumball: { make: 'lndparts', play: { does: 'give', gives: 'gumball' } },
  lndsign: { make: 'lndparts', play: { does: 'wobble' } },
  lndwooloo: { make: 'lndparts', play: { does: 'bounce' } },
};
/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropLd(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildLd(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': { const g = L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)); if (q.rx) g.rotateX(-q.rx); put(g, m, x, y, z); break; }
      case 'cyl': { const g = L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? 20); if (q.sz) g.scale(1, 1, q.sz); put(g, m, x, y, z); break; }
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
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh) / Math.cos(q.rx || 0));
        cropLd(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        if (q.rx) g.rotateX(-q.rx);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  lndparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildLd(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildLd(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003, bare: !!r.bare }; }
  },

  /* the tiled floor mat: a thin slab, the painting on top */
  lndmat(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.025, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
