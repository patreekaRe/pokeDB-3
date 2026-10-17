/* base-models-logcabin.js  -  the Log cabin set's models (furniture expansion session d, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-logcabin.js's BUILT, in painted units), built here by one builder, `cabinparts`: rounded
   boxes, cylinders, balls, rods (the logs, their cut ends discs of their own), lathes, discs, rings and outlines extruded
   from the front or the side. A `pic` part (a dial) wears its crop of the front painting; a `plaid` part one shared
   check texture, mapped by where it sits so the check runs on across parts. The wardrobe's doors swing (`K.door`). The
   braided rug is its oval cut out, the plaid rug a slab, the painting on top of each. All solo, fixed colours. */

import { BUILT, RUGS, plaidOn } from './base-furniture-logcabin.js';

const u = (n) => n / 32;

export const SHAPES = {
  cabinbed: { make: 'cabinparts', seat: u(22) },
  cabinchair: { make: 'cabinparts', seat: u(19.5) },
  cabinrocker: { make: 'cabinparts', seat: u(22.8), play: { does: 'rock' } },
  cabinsofa: { make: 'cabinparts', seat: u(17) },
  cabintable: { make: 'cabinparts', top: u(28.5) },
  cabindesk: { make: 'cabinparts', top: u(29) },
  cabinwardrobe: { make: 'cabinparts', play: { does: 'door', inside: 'clothes', double: true } },
  cabindresser: { make: 'cabinparts', top: u(37.9) },
  cabinshelf: { make: 'cabinparts', top: u(63.2) },
  cabinlamp: { make: 'cabinparts', play: { does: 'light' } },
  cabinclock: { make: 'cabinparts', play: { does: 'chime' } },
  cabinstove: { make: 'cabinparts', play: { does: 'fire' } },
  cabinwoodbox: { make: 'cabinparts' },
  cabinstool: { make: 'cabinparts', seat: u(20.2) },
  cabincoatrack: { make: 'cabinparts' },
  cabinchest: { make: 'cabinparts', top: u(26.2), play: { does: 'treasure' } },
  cabinmirror: { make: 'cabinparts' },
  cabinscreen: { make: 'cabinparts' },
  cabinursaring: { make: 'cabinparts' },
  cabinteddiursa: { make: 'cabinparts' },
  cabinantlers: { make: 'cabinparts' },
  cabincuckoo: { make: 'cabinparts', play: { does: 'chime' } },
  cabinsnowshoes: { make: 'cabinparts' },
  cabinbraidrug: { make: 'cabinrug' },
  cabinplaidrug: { make: 'cabinrug' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropCabin(L, g, art, [x0, y0, x1, y1]) {
  const W = art.width / L.HD, H = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / W, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / H);
}

/* one texture per check, shared by every piece: 16 painted units of it, repeating */
const checks = {};
function plaidTex(THREE, pl) {
  if (checks[pl]) return checks[pl];
  const c = new OffscreenCanvas(128, 128), g = c.getContext('2d');
  g.scale(8, 8); plaidOn(g, 0, 0, 16, 16, pl);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return (checks[pl] = t);
}
/** Uvs from where each face sits (16 painted units a repeat), so a check runs on from part to part. */
function plaidUV(g) {
  const pos = g.attributes.position, nor = g.attributes.normal, k = 2;
  if (!g.attributes.uv) g.setAttribute('uv', new g.attributes.position.constructor(new Float32Array(pos.count * 2), 2));
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i)), nz = Math.abs(nor.getZ(i));
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (ny >= nx && ny >= nz) uv.setXY(i, x * k, z * k);
    else if (nx >= nz) uv.setXY(i, z * k, y * k);
    else uv.setXY(i, x * k, y * k);
  }
}

function buildCabin(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const plaids = K.cabinPlaids ||= {};
  const mat = (q) => {
    const m = q.m || def;
    if (m === 'glass') return K.glass();
    if (m === 'plaid') {
      if (!plaids[q.c]) { plaids[q.c] = new THREE.MeshStandardMaterial({ map: plaidTex(THREE, q.c), roughness: 0.95 }); plaids[q.c].userData.kind = 'pic'; }
      return plaids[q.c];
    }
    return K[m](q.c);
  };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': {
        const g = put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z, 0, 0, q.rot || 0);
        if (q.m === 'plaid') plaidUV(g);
        break;
      }
      case 'cyl': put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? 16), m, x, y, z); break;
      case 'ball': {
        const r = Math.max(q.rx, q.ry, q.rz), seg = q.seg ?? Math.max(8, L.sides(u(r), 16));
        put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), 1, 1, seg), m, x, y, z);
        break;
      }
      case 'disc': {
        const g = L.cyl(u(q.r), u(q.th), u(q.r), q.seg ?? (q.r > 2 ? 14 : 8));
        if (q.fx) g.rotateZ(Math.PI / 2);
        else { g.rotateX(Math.PI / 2); if (q.ry) g.scale(1, q.ry / q.r, 1); }
        put(g, m, x, y, z, 0, 0, q.rot || 0);
        break;
      }
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), q.seg ?? 14), m, x, y, z); break;
      case 'ring': put(L.torus(u(q.r), u(q.tr), Math.PI * 2, 12), m, x, y, z); break;
      case 'rod': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), q.r > 2.4 ? 12 : q.r > 1.2 ? 10 : 6);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        put(g, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'prism': {
        const sh = new THREE.Shape(q.pts.map(([px, ph]) => new THREE.Vector2(u(px), u(ph))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        break;
      }
      case 'pz': {
        const sh = new THREE.Shape(q.pts.map(([pz, ph]) => new THREE.Vector2(u(pz), u(ph))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2).rotateY(-Math.PI / 2), m, x, y, z);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropCabin(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  cabinparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildCabin(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildCabin(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* a rug: the braided one's oval cut out, the plaid one a slab, the painting on top */
  cabinrug(K, s, W, D, L) {
    const m = K.pic(K.p.art(0, L.HD)), shapes = RUGS[K.p.fam];
    if (!shapes) {
      const g = L.rbox(W - 0.02, 0.035, D - 0.04, 0.008);
      L.topUV(g, W, D);
      K.put(g, m, 0, 0.0175, 0);
      return;
    }
    for (const [cx, cy, rx, ry] of shapes) {
      const g = L.cyl(1, 0.03, 1, 40).scale(u(rx), 1, u(ry)).translate(u(cx) - W / 2, 0.015, u(cy) - D / 2);
      K.put(g, m); L.topUV(g, W, D);
    }
  },
};
