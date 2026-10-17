/* base-models-salon.js  -  the Salon set's models (furniture expansion session j, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-salon.js's BUILT, in painted units), built here by one builder, `slnparts`, as the Ramen
   set's: rounded boxes, cylinders, balls (the Furfrou, Smoochum, the wig, the bulbs), rods (the chrome frames, the
   shears' blades, the stems), lathes (the bottles, the basin, the dryer's hood, the pots), discs, rings and flat outlines
   extruded (the trims' hearts, stars and diamonds, the snake plant's blades, the headdress, the bows). A `pic` part (the
   signs, the price list, the magazine's cover, the trims board, the mirror's glass) wears its crop of the front
   painting, all of them one texture. The painting's `tex` (the hedge's leaves, the tufting, the headdress's stripes)
   stays in the painting: the model keeps plain colours, but for the barber pole's `spin` core, which wears a striped
   canvas of its own and turns about its middle when tapped (js/base-play.js's spinner, js/base-mesh.js's pivot). The
   floor mat is a thin slab, the painting on top. All solo, fixed colours. */

import { BUILT, RUG, SL } from './base-furniture-salon.js';

const u = (n) => n / 32, TAU = Math.PI * 2;

export const SHAPES = {
  slnchair: { make: 'slnparts', seat: u(18.5), play: { does: 'spin' } },
  slnstation: { make: 'slnparts', top: u(28), play: { does: 'whirr' } },
  slnbasin: { make: 'slnparts', seat: u(13), play: { does: 'water' } },
  slndryer: { make: 'slnparts', seat: u(14.6), play: { does: 'whirr' } },
  slnmanicure: { make: 'slnparts', top: u(27), play: { does: 'light' } },
  slnsteamer: { make: 'slnparts', top: u(36), play: { does: 'steam' } },
  slnshelf: { make: 'slnparts', top: u(52) },
  slndesk: { make: 'slnparts', top: u(33), play: { does: 'chime' } },
  slnsofa: { make: 'slnparts', seat: u(16) },
  slnmagtable: { make: 'slnparts', top: u(21) },
  slntrolley: { make: 'slnparts', top: u(30.6) },
  slnpole: { make: 'slnparts', play: { does: 'spin' } },
  slnhead: { make: 'slnparts' },
  slnmirror: { make: 'slnparts', play: { does: 'light' } },
  slnprices: { make: 'slnparts' },
  slndyechart: { make: 'slnparts' },
  slnplant: { make: 'slnparts' },
  slnmat: { make: 'slnmat' },
  slngroom: { make: 'slnparts', play: { does: 'bubbles', foam: true } },
  slntrims: { make: 'slnparts' },
  slnheart: { make: 'slnparts' },
  slnstar: { make: 'slnparts' },
  slndiamond: { make: 'slnparts' },
  slnreine: { make: 'slnparts', play: { does: 'squeak' } },
  slnpharaoh: { make: 'slnparts' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropSl(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

let stripes;
/** The barber pole's bands, red, white, blue, white, run on the diagonal so they wrap round its core as a helix. */
function stripeCanvas() {
  if (stripes) return stripes;
  const n = 64, c = new OffscreenCanvas(n, n), g = c.getContext('2d'), bands = [SL.red, SL.white, SL.blue, SL.white];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = bands[Math.floor(((i + j) / n) * 8) % 4]; g.fillRect(i, j, 1, 1); }
  return (stripes = c);
}

function buildSl(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': {
        const g = L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? 20);
        if (!q.spin) { put(g, m, x, y, z); break; }
        const t = L.canvasTex(stripeCanvas());
        t.repeat.set(1, q.hh / (TAU * q.r));
        const sm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.35 });
        sm.userData.kind = 'pic'; sm.userData.pivot = { y, tilt: 0 };
        put(g, sm, x, y, z);
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
        cropSl(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  slnparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildSl(K, L, kind.parts, K.put, W, kind.mat);
  },

  /* the floor mat: a thin slab, the painting on top */
  slnmat(K, s, W, D, L) {
    const { THREE } = L, sh = new THREE.Shape(RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, u(py) - D / 2)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.025, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 0.025, 0);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0, 0);
  },
};
