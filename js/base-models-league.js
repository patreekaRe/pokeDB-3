/* base-models-league.js  -  the Pokémon League set's models (furniture expansion session b, 2026-10-17).
   js/base-models-f.js's head says how a batch works. Each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-league.js's BUILT, in painted units), built here by one builder, `lgparts`: rounded boxes,
   blobs, lathes, cones, rings, outlines cut out (wings, flames, shields, the arch) and Poké Balls, so the model and its
   picture agree part for part. A screen or a board is its cached canvas on a plane. The crest rug is its round outline
   cut out, the painting on top. All solo: the League's own colours. */

import { BUILT, RUGS } from './base-furniture-league.js';

const u = (n) => n / 32;

export const SHAPES = {
  lgchampseat: { make: 'lgparts', seat: u(32.5) },
  lgicethrone: { make: 'lgparts', seat: u(22) },
  lgstonethrone: { make: 'lgparts', seat: u(21) },
  lgghostthrone: { make: 'lgparts', seat: u(22), play: { does: 'light', flicker: true } },
  lgdragonthrone: { make: 'lgparts', seat: u(23) },
  lghalloffame: { make: 'lgparts', play: { does: 'heal', balls: 0 } },
  lgcrestrug: { make: 'lgrug' },
  lgbanner: { make: 'lgparts' },
  lgtorch: { make: 'lgparts', play: { does: 'light', flicker: true } },
  lgchampcup: { make: 'lgparts', play: { does: 'treasure' } },
  lgstatue: { make: 'lgparts' },
  lgbadgewall: { make: 'lgparts' },
  lgheal: { make: 'lgparts', play: { does: 'heal', balls: 6 } },
  lggate: { make: 'lgparts' },
  lgbracket: { make: 'lgparts' },
  lgdesk: { make: 'lgparts', top: u(30), play: { does: 'beat', hits: ['fx-squeak'] } },
  lgbench: { make: 'lgparts', seat: u(18.5) },
  lglaurel: { make: 'lgparts' },
  lgwindow: { make: 'lgparts' },
  lgcape: { make: 'lgparts' },
  lgcolumn: { make: 'lgparts', top: u(82.2) },
  lgfanfare: { make: 'lgparts', play: { does: 'note', voice: 'brass', high: true } },
  lgeliteshields: { make: 'lgparts' },
  lgflag: { make: 'lgparts' },
};

const RED = '#c82838', WHITE = '#f8f8f4', INK = '#22242e';

/* a text label's picture, cached by what it says */
const labels = {};
function label(q) {
  const key = q.s + q.c + q.w + q.size;
  if (labels[key]) return labels[key];
  const h = 64, w = Math.min(512, Math.round(h * q.w / (q.size * 1.3))), c = new OffscreenCanvas(w, h), g = c.getContext('2d');
  g.font = `bold ${Math.round(h / 1.3)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = q.c; g.fillText(q.s, w / 2, h / 2 + 2, w);
  return (labels[key] = c);
}

/** As many sides as a part r units round needs. */
const segOf = (r) => Math.max(8, Math.min(24, Math.ceil(16 * Math.sqrt(2 * r / 32) / 4) * 4));

function build(K, L, parts, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2, put = K.put;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  for (const q of parts) {
    if (q.paintOnly) continue;
    const x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'blob': put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), q.e ?? 1, q.ev ?? 1, q.seg || segOf(Math.max(q.rx, q.ry, q.rz))), mat(q), x, y, z, 0, 0, -(q.tilt || 0)); break;
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), mat(q), x, y, z, 0, 0, -(q.tilt || 0)); break;
      case 'cyl': put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), 20), mat(q), x, y, z); break;
      case 'cone': {
        const g = L.cyl(0.0005, u(q.hh), u(q.r), 12).translate(0, u(q.hh) / 2, 0);
        if (q.fwd) g.rotateX(Math.PI / 2); else if (q.tilt) g.rotateZ(-q.tilt);
        put(g, mat(q), x, y, z);
        break;
      }
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), 24), mat(q), x, y, z); break;
      case 'rod': put(L.cyl(u(q.r), u(q.x1 - q.x0), u(q.r), 12).rotateZ(Math.PI / 2), mat(q), x, y, z); break;
      case 'shape': {
        const shape = new THREE.Shape(q.pts.map(([px, py]) => new THREE.Vector2(u(px), u(py))));
        put(new THREE.ExtrudeGeometry(shape, { depth: u(q.d), bevelEnabled: false, curveSegments: 4 }).translate(0, 0, -u(q.d) / 2), mat(q), x, y, z);
        break;
      }
      case 'ring': put(L.torus(u(q.R), u(q.r), q.arc, 24), mat(q), x, y, z, 0, 0, q.a0); break;
      case 'ball': {
        const r = u(q.r), seg = q.r > 3 ? 16 : 12;
        put(new THREE.SphereGeometry(r, seg, 4, 0, Math.PI * 2, 0, Math.PI / 2), K.gloss(RED), x, y, z);
        put(new THREE.SphereGeometry(r, seg, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), K.gloss(WHITE), x, y, z);
        put(L.cyl(r * 1.02, r * 0.2, r * 1.02, seg, true, true), K.plain(INK), x, y, z);
        put(L.cyl(r * 0.38, r * 0.16, r * 0.38, 8).rotateX(Math.PI / 2), K.plain(INK), x, y, z + r * 0.94);
        put(L.cyl(r * 0.24, r * 0.12, r * 0.24, 8).rotateX(Math.PI / 2), K.gloss(WHITE), x, y, z + r * 1.03);
        break;
      }
      case 'img': put(new THREE.PlaneGeometry(u(q.w), u(q.hh)), q.lit ? L.litPic(q.pic(), 0.5) : K.pic(q.pic()), x, y, z); break;
      case 'text': put(new THREE.PlaneGeometry(u(q.w), u(q.size * 1.3)), L.decal(label(q)), x, y, z + 0.002); break;
    }
  }
}

export const MAKES = {
  lgparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    build(K, L, kind.parts, W, kind.mat);
  },

  lgrug(K, s, W, D, L) {
    const m = K.pic(K.p.art(0, L.HD));
    for (const [cx, cy, rx, ry] of RUGS[K.p.fam]) {
      const g = L.cyl(1, 0.03, 1, 40).scale(u(rx), 1, u(ry)).translate(u(cx) - W / 2, 0.015, u(cy) - D / 2);
      K.put(g, m); L.topUV(g, W, D);
    }
  },
};
