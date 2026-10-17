/* base-models-contest.js  -  the Contest Hall set's models (furniture expansion session b, 2026-10-17). js/base-models-f.js's
   head says how a batch works. As the Snorlax room's: each upright and wall kind is the same list of parts its painting
   paints (js/base-furniture-contest.js's BUILT, in painted units), built here by one builder, `conparts`, as rounded boxes,
   blobs, lathes, sticks and cut-out stars and hearts, so the model and its picture agree part for part. Labels and the
   poster are one cached canvas each. The star rug is its outline (STAR_RUG) cut out, the painting on top; the runner is
   the room's plain slab. All solo: the Contest Hall's own colours. */

import { BUILT, STAR_RUG } from './base-furniture-contest.js';

const u = (n) => n / 32;

export const SHAPES = {
  constage: { make: 'conparts', top: u(21) },
  concurtains: { make: 'conparts' },
  conspotlight: { make: 'conparts', play: { does: 'light' } },
  conribboncase: { make: 'conparts' },
  conribbonbox: { make: 'conparts' },
  conjudges: { make: 'conparts', top: u(29) },
  conapplause: { make: 'conparts', play: { does: 'light', stars: true } },
  conblender: { make: 'conparts', play: { does: 'whirr' } },
  conblockcase: { make: 'conparts' },
  conpoffinpot: { make: 'conparts', play: { does: 'steam' } },
  convanity: { make: 'conparts', top: u(29), play: { does: 'light' } },
  conrack: { make: 'conparts' },
  conaccessory: { make: 'conparts' },
  conmic: { make: 'conparts', play: { does: 'beat', hits: ['fx-squeak'] } },
  conconfetti: { make: 'conparts', play: { does: 'firework' } },
  conseats: { make: 'conparts', seat: u(20) },
  conticket: { make: 'conparts', play: { does: 'give', gives: 'coin', sound: 'fx-ding' } },
  conbanners: { make: 'conparts' },
  controphy: { make: 'conparts' },
  conposter: { make: 'conparts' },
  constarrug: { make: 'conrug' },
  constarprop: { make: 'conparts', play: { does: 'spin' } },
  conflowers: { make: 'conparts' },
  concurtaincall: { make: 'conparts', play: { does: 'light' } },
};

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
/* a picture part's canvas, 8 pixels a unit, cached by its painter */
const pics = new Map();
function picOf(q) {
  if (pics.has(q.fn)) return pics.get(q.fn);
  const s = 8, c = new OffscreenCanvas(Math.ceil(q.w * s), Math.ceil(q.hh * s)), g = c.getContext('2d');
  g.scale(s, s); q.fn(g, q.w, q.hh);
  pics.set(q.fn, c);
  return c;
}

/** As many sides as a part r units round needs. */
const segOf = (r) => Math.max(8, Math.min(24, Math.ceil(16 * Math.sqrt(2 * r / 32) / 4) * 4));

function build(K, L, parts, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  for (const q of parts) {
    const m = q.t === 'text' || q.t === 'pic' ? null : mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'blob': K.put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), q.e ?? 1, q.ev ?? 1, q.seg ?? segOf(Math.max(q.rx, q.rz, q.ry * 0.5))), m, x, y, z, 0, 0, -(q.tilt || 0)); break;
      case 'box': K.put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z, 0, q.tx || 0, -(q.tilt || 0)); break;
      case 'cyl': K.put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), 20), m, x, y, z); break;
      case 'disc': {
        const g = L.cyl(u(q.r), u(q.th), u(q.r), 20);
        K.put(q.ax === 'x' ? g.rotateZ(Math.PI / 2) : g.rotateX(Math.PI / 2), m, x, y, z);
        break;
      }
      case 'cone': {
        const g = L.cyl(0.0005, u(q.hh), u(q.r), 12).translate(0, u(q.hh) / 2, 0);
        if (q.fwd) g.rotateX(Math.PI / 2); else if (q.tilt) g.rotateZ(-q.tilt);
        K.put(g, m, x, y, z);
        break;
      }
      case 'lathe': K.put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), 28), m, x, y, z); break;
      case 'rod': K.put(L.cyl(u(q.r), u(q.x1 - q.x0), u(q.r), 16).rotateZ(Math.PI / 2), m, x, y, z); break;
      case 'stick': {
        const a = new THREE.Vector3(X(q.a[0]), u(q.a[1]), u(q.a[2])), b = new THREE.Vector3(X(q.b[0]), u(q.b[1]), u(q.b[2]));
        const g = L.cyl(u(q.r), a.distanceTo(b), u(q.r), 12);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
        K.put(g, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        break;
      }
      case 'shape': {
        const s = new THREE.Shape(q.pts.map(([px, ph]) => new THREE.Vector2(X(px), u(ph))));
        K.put(new THREE.ExtrudeGeometry(s, { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, 0, 0, z);
        break;
      }
      case 'ring': K.put(L.torus(u(q.R), u(q.r), Math.PI * 2, 20), m, x, y, z); break;
      case 'text': K.put(new THREE.PlaneGeometry(u(q.w), u(q.size * 1.3)), L.decal(label(q)), x, y, z + 0.002); break;
      case 'pic': { const c = picOf(q); K.put(new THREE.PlaneGeometry(u(q.w), u(q.hh)), q.cut ? L.decal(c) : K.pic(c), x, y, z + 0.002); break; }
    }
  }
}

export const MAKES = {
  conparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    build(K, L, kind.parts, W, kind.mat);
  },

  conrug(K, s, W, D, L) {
    const { THREE } = L, m = K.pic(K.p.art(0, L.HD));
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(STAR_RUG.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, D / 2 - u(py)))), { depth: 0.03, bevelEnabled: false }).rotateX(-Math.PI / 2);
    K.put(g, m); L.topUV(g, W, D);
  },
};
