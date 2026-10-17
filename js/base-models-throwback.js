/* base-models-throwback.js  -  the Throwback set's models (furniture expansion session g, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-throwback.js's BUILT, in painted units), built here by one builder, `thbparts`, as
   js/base-models-acorn.js builds the Acorn set's: rounded boxes, cylinders, balls, rods, lathes, discs, rings (whole, a
   part arc for the boombox's handle, squashed for the planet's) and flat outlines extruded (memphis triangles, stars,
   the moon, the mirror's wavy frame). A `pic` part (the memphis panels, the TV's picture, the handheld, the cassettes,
   the dial, the skateboard decks, the pocket pet's screen) wears its crop of the front painting, all of them one
   texture. The painting's `tex` (squiggles, confetti) stays in the painting: the model keeps plain colours. The
   wardrobe's doors swing (`K.door`); the TV's live screen sits on its painted one. The rug (`thbrug`) is a slab, the
   painting on top. All solo, fixed colours. */

import { BUILT } from './base-furniture-throwback.js';

const u = (n) => n / 32;

export const SHAPES = {
  thbbed: { make: 'thbparts', seat: u(21.3) },
  thbchair: { make: 'thbparts', seat: u(13), play: { does: 'squeak' } },
  thbsofa: { make: 'thbparts', seat: u(15) },
  thbtable: { make: 'thbparts', top: u(26.7) },
  thbdesk: { make: 'thbparts', top: u(27) },
  thbwardrobe: { make: 'thbparts', play: { does: 'door', inside: 'clothes', double: true } },
  thbdresser: { make: 'thbparts', top: u(30.4) },
  thbshelf: { make: 'thbparts' },
  thblamp: { make: 'thbparts', play: { does: 'light' } },
  thbclock: { make: 'thbparts', play: { does: 'chime' } },
  thbscreen: { make: 'thbparts' },
  thbmirror: { make: 'thbparts' },
  thbstars: { make: 'thbparts' },
  thbneon: { make: 'thbparts', play: { does: 'light' } },
  thbtv: { make: 'thbparts', screen: { x: u(-3), y: u(34.4), w: u(19.4), h: u(15.4), z: u(11.45) + 0.004 }, play: { does: 'screen', show: ['cartoon', 'battle', 'quiz', 'news', 'bars'] } },
  thbboombox: { make: 'thbparts', play: { does: 'player', voice: 'bass', bass: true } },
  thbtapes: { make: 'thbparts' },
  thbbeanbag: { make: 'thbparts', seat: u(13) },
  thbconsole: { make: 'thbparts', play: { does: 'beat', hits: ['fx-beep', 'fx-bloop'] } },
  thbphone: { make: 'thbparts', play: { does: 'ring' } },
  thbhoop: { make: 'thbparts', play: { does: 'strike' } },
  thbskate: { make: 'thbparts', play: { does: 'wobble' } },
  thbcage: { make: 'thbparts', play: { does: 'squeak' } },
  thbpet: { make: 'thbparts', play: { does: 'robot' } },
  thbrug: { make: 'thbrug' },
};

/** The plane's uvs moved to painted box [x0, y0, x1, y1] of the whole front painting, so every crop shares one texture. */
function cropTb(L, g, art, [x0, y0, x1, y1]) {
  const Wp = art.width / L.HD, Hp = art.height / L.HD, e = 0.5 / L.HD, uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + e + uv.getX(i) * (x1 - x0 - 2 * e)) / Wp, 1 - (y1 - e - uv.getY(i) * (y1 - y0 - 2 * e)) / Hp);
}

function buildTb(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  let art;
  for (const q of parts) {
    const m = q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), q.seg ?? L.sides(u(q.r), 16)), m, x, y, z); break;
      case 'ball': {
        const r = Math.max(q.rx, q.ry, q.rz), seg = q.seg ?? Math.max(8, L.sides(u(r), 16));
        put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), 1, 1, seg), m, x, y, z);
        break;
      }
      case 'disc': {
        const g = L.cyl(u(q.r), u(q.th), u(q.r), q.seg ?? L.sides(u(q.r), 16)).rotateX(Math.PI / 2);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        put(g, m, x, y, z);
        break;
      }
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), q.seg ?? 14), m, x, y, z); break;
      case 'ring': {
        const g = L.torus(u(q.r), u(q.tr), q.arc ?? Math.PI * 2, q.r > 6 ? 20 : 12);
        if (q.a0) g.rotateZ(q.a0);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        if (q.flat) g.rotateX(Math.PI / 2);
        put(g, m, x, y, z);
        break;
      }
      case 'rod': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), Math.max(0.002, a.distanceTo(b)), u(q.r), q.r > 2 ? 12 : q.r > 1.2 ? 8 : 6);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        put(g, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'prism': {
        const sh = new THREE.Shape(q.pts.map(([px, ph]) => new THREE.Vector2(u(px), u(ph))));
        put(new THREE.ExtrudeGeometry(sh, { depth: u(q.d), bevelEnabled: false, curveSegments: 4 }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        break;
      }
      case 'pic': {
        art ||= K.p.art(0, L.HD, true);
        const H = art.height / L.HD, g = new THREE.PlaneGeometry(u(q.w), u(q.hh));
        cropTb(L, g, art, [q.x - q.w / 2, H - q.h - q.hh / 2, q.x + q.w / 2, H - q.h + q.hh / 2]);
        put(g, K.pic(art), x, y, z + 0.002);
        break;
      }
    }
  }
}

export const MAKES = {
  thbparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    buildTb(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) buildTb(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  /* the confetti rug: a slab, its painting on top */
  thbrug(K, s, W, D, L) {
    const g = L.rbox(W - 0.02, 0.035, D - 0.02, 0.008);
    L.topUV(g, W, D);
    K.put(g, K.pic(K.p.art(0, L.HD)), 0, 0.0175, 0);
  },
};
