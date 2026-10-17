/* base-models-figurines.js  -  the Figurines set's models (js/base-furniture-figurines.js; js/base-models-f.js's head
   says how a batch works). The round display base turned on a lathe in glossy PVC, a legendary's black with gold rims;
   the name plate a curved strip round its front wearing the painting's own plate; the Pokémon its sprite in its own
   colours (js/base-figures.js), a cut-out that faces the camera (js/base-mesh.js's figure()). A tap turns it round on
   its base, like a figure on a display turntable. */

import { FIGURINES, figureOf, figureAt } from './base-figures.js';
import { FIG, figBase } from './base-furniture-figurines.js';
import { cut } from './base-models-w.js';

const u = (n) => n / 32;

export const SHAPES = {
  [Object.keys(FIGURINES).join(' ')]: { make: 'figurineFig', play: { does: 'spin' } },
};

export const MAKES = {
  figurineFig(K, s, W, D, L) {
    const { x0, x1, h, legend, colour, plate } = figBase(K.p.fam), r = u((x1 - x0) / 2), top = u(h), e = u(0.7);
    const cx = u((x0 + x1) / 2) - W / 2;
    K.put(L.lathe([[0, 0], [r - e, 0], [r, e], [r, top - e], [r - e, top], [0, top]], 24), K.gloss(colour), cx, 0, 0);
    if (legend) {
      const gold = K.metal(FIG.gold);
      K.put(L.torus(r - u(0.6), u(0.7), Math.PI * 2, 24), gold, cx, top - u(0.4), 0, 0, Math.PI / 2);
      K.put(L.cyl(r + u(0.15), u(1.3), r + u(0.15), 24, true), gold, cx, u(0.65), 0);
    }
    // the plate: a strip of the painting curved round the base's front
    const [p0, p1, py0, py1] = plate, H = K.p.art(0, 1, true).height, arc = u(p1 - p0) / (r + u(0.2));
    const strip = new L.THREE.CylinderGeometry(r + u(0.2), r + u(0.2), u(py1 - py0), 8, 1, true, -arc / 2, arc);
    K.put(strip, K.pic(cut(K, L, [p0, H - py1, p1, H - py0])), cx, u((py0 + py1) / 2), 0);
    const f = figureOf(K.p.fam), at = figureAt(K.p.fam);
    if (f) K.figure = { c: f.c, w: u(f.w * at.k), h: u(f.h * at.k), x: u(at.cx) - W / 2, y: u(at.y), z: 0 };
  },
};
