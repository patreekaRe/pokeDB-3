/* base-models-snorlax.js  -  the Snorlax room's models (furniture expansion session a, 2026-10-17). js/base-models-f.js's
   head says how a batch works. Each upright and wall kind is the same list of parts its painting paints
   (js/base-furniture-snorlax.js's BUILT, in painted units), built here as rounded blobs, boxes, lathes and cones by one
   builder, `laxparts`, so the model and its picture agree part for part; the wardrobe's and the fridge's belly doors
   swing (`K.door`). The rugs are their outlines (RUGS) cut out, the painting on top. All solo: Snorlax's own colours. */

import { BUILT, RUGS, zee } from './base-furniture-snorlax.js';

const u = (n) => n / 32;

export const SHAPES = {
  laxbed: { make: 'laxparts', seat: u(27) },
  laxbeanbag: { make: 'laxparts', seat: u(20) },
  laxchair: { make: 'laxparts', seat: u(18.5) },
  laxsofa: { make: 'laxparts', seat: u(18) },
  laxtable: { make: 'laxparts', top: u(26) },
  laxdesk: { make: 'laxparts', top: u(29.5) },
  laxwardrobe: { make: 'laxparts', play: { does: 'door', inside: 'clothes' } },
  laxdresser: { make: 'laxparts', top: u(27) },
  laxshelf: { make: 'laxparts' },
  laxlamp: { make: 'laxparts', play: { does: 'light' } },
  laxclock: { make: 'laxparts', play: { does: 'chime' } },
  laxtv: { make: 'laxparts', screen: { x: 0, y: u(30), w: u(42), h: u(28), z: u(8.3) + 0.004 }, play: { does: 'screen', show: ['cartoon', 'weather', 'battle', 'quiz', 'news'] } },
  laxmirror: { make: 'laxparts' },
  laxfootrug: { make: 'laxrug' },
  laxfacerug: { make: 'laxrug' },
  laxfridge: { make: 'laxparts', play: { does: 'door', inside: 'fridge' } },
  laxpillows: { make: 'laxparts', seat: u(24) },
  laxfootstool: { make: 'laxparts', seat: u(23.5) },
  laxbellydrum: { make: 'laxparts', play: { does: 'beat', hits: ['fx-drum', 'fx-drum', 'fx-taiko'] } },
  laxflute: { make: 'laxparts', play: { does: 'note', voice: 'flute', high: true } },
  laxzzz: { make: 'laxparts' },
  laxchest: { make: 'laxparts', play: { does: 'treasure' } },
  laxsnackjar: { make: 'laxparts', play: { does: 'give', gives: 'gumball' } },
  laxplanter: { make: 'laxparts' },
  laxbath: { make: 'laxparts', play: { does: 'bubbles', foam: true } },
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

/** As many sides as a part r units round needs. */
const segOf = (r) => Math.max(8, Math.min(24, Math.ceil(16 * Math.sqrt(2 * r / 32) / 4) * 4));

function build(K, L, parts, put, W, def) {
  const { THREE } = L, X = (x) => u(x) - W / 2;
  const mat = (q) => { const m = q.m || def; return m === 'glass' ? K.glass() : K[m](q.c); };
  for (const q of parts) {
    if (q.paintOnly) continue;
    const m = mat(q), x = X(q.x), y = u(q.h), z = u(q.z);
    switch (q.t) {
      case 'blob': put(L.blob(u(2 * q.rx), u(2 * q.ry), u(2 * q.rz), q.e ?? 1, q.ev ?? 1, segOf(Math.max(q.rx, q.ry, q.rz))), m, x, y, z, 0, 0, -(q.tilt || 0)); break;
      case 'box': put(L.rbox(u(q.w), u(q.hh), u(q.d), u(q.r)), m, x, y, z); break;
      case 'cyl': put(L.cyl(u(q.r), u(q.hh), u(q.rb ?? q.r), 20), m, x, y, z); break;
      case 'disc': {
        const g = L.cyl(u(q.r), u(q.th), u(q.r), 20).rotateX(Math.PI / 2);
        if (q.ry) g.scale(1, q.ry / q.r, 1);
        put(g, m, x, y, z);
        break;
      }
      case 'cone': {
        const g = L.cyl(0.0005, u(q.hh), u(q.r), 12).translate(0, u(q.hh) / 2, 0);
        if (q.fwd) g.rotateX(Math.PI / 2); else if (q.tilt) g.rotateZ(-q.tilt);
        put(g, m, x, y, z);
        break;
      }
      case 'line': {
        // a bent line is two straight strokes through its middle
        const mid = [(q.x0 + q.x1) / 2, (q.h0 + q.h1) / 2 + q.bend], segs = q.bend ? [[[q.x0, q.h0], mid], [mid, [q.x1, q.h1]]] : [[[q.x0, q.h0], [q.x1, q.h1]]];
        for (const [[ax, ah], [bx, bh]] of segs) {
          const len = Math.hypot(bx - ax, bh - ah) + q.w * 0.6;
          put(L.rbox(u(len), u(q.w), u(0.8), 0.001).rotateZ(Math.atan2(bh - ah, bx - ax)), m, X((ax + bx) / 2), u((ah + bh) / 2), z);
        }
        break;
      }
      case 'lathe': put(L.lathe(q.pts.map(([r, up]) => [u(r), u(up)]), 28), m, x, y, z); break;
      case 'rod': put(L.cyl(u(q.r), u(q.x1 - q.x0), u(q.r), 16).rotateZ(Math.PI / 2), m, x, y, z); break;
      case 'text': put(new THREE.PlaneGeometry(u(q.w), u(q.size * 1.3)), L.decal(label(q)), x, y, z + 0.002); break;
      case 'zee': {
        const shape = (d) => new THREE.Shape(zee(q.s, d).map(([px, py]) => new THREE.Vector2(u(px), -u(py))));
        put(new THREE.ExtrudeGeometry(shape(0), { depth: u(q.d), bevelEnabled: false }).translate(0, 0, -u(q.d) / 2), m, x, y, z);
        put(new THREE.ExtrudeGeometry(shape(q.s * 0.08), { depth: u(q.d) * 0.7, bevelEnabled: false }).translate(0, 0, -u(q.d) / 2 - 0.004), K.gloss(q.edge), x, y, z);
        break;
      }
    }
  }
}

export const MAKES = {
  laxparts(K, s, W, D, L) {
    const kind = BUILT[K.p.fam];
    build(K, L, kind.parts, K.put, W, kind.mat);
    for (const d of kind.doors) build(K, L, d.parts, K.door([u(d.hinge[0]) - W / 2, u(d.hinge[1])], d.side), W, kind.mat);
    if (kind.inside) { const r = kind.inside; K.inside = { x: u(r.x) - W / 2, y: u(r.h), w: u(r.w), h: u(r.hh), z: u(r.z) + 0.003 }; }
  },

  laxrug(K, s, W, D, L) {
    const { THREE } = L, R = RUGS[K.p.fam], m = K.pic(K.p.art(0, L.HD));
    for (const [cx, cy, rx, ry] of R.ovals) {
      const g = L.cyl(1, 0.03, 1, 40).scale(u(rx), 1, u(ry)).translate(u(cx) - W / 2, 0.015, u(cy) - D / 2);
      K.put(g, m); L.topUV(g, W, D);
    }
    for (const t of R.tris) {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(t.map(([px, py]) => new THREE.Vector2(u(px) - W / 2, D / 2 - u(py)))), { depth: 0.028, bevelEnabled: false }).rotateX(-Math.PI / 2);
      K.put(g, m); L.topUV(g, W, D);
    }
  },
};
