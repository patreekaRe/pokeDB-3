/* base-models-gold.js  -  the Grand Catalogue's gold statues (js/base-furniture-statues.js) built from parts (2026-10-16,
   the user's ask: "like how you made the gym leader statues using their sprites"; they were puffed up from their
   paintings, about 20k triangles each). The marble pedestal follows its painting: a plinth, a veined block with the
   gold name plate (the painting's own lettering), a cap; the starter stands on it as its gilded sprite, a cut-out that
   faces the camera (js/base-mesh.js's figure()). js/base-models-f.js's head says how a batch works. */

import { STARTERS } from './data/starters.js';
import { statueKind } from './data/catalogue.js';
import { statueFigure } from './base-furniture-statues.js';
import { cut } from './base-models-w.js';

const u = (n) => n / 32;
const MARBLE = '#e8e4da', VEIN = '#cfc8ba', PLATE = '#d8a830';

export const SHAPES = {
  [STARTERS.map(s => statueKind(s.id)).join(' ')]: { make: 'goldStatue' },
};

export const MAKES = {
  goldStatue(K, s, W, D, L) {
    const { rbox } = L, marble = K.gloss(MARBLE), H = K.p.art(0, 1, true).height, cx = W * 16;
    K.put(rbox(u(50), u(7), u(50), 0.02), K.gloss(L.tone(MARBLE, 0.9)), 0, u(3.5), 0);
    K.put(rbox(u(40), u(18), u(40), 0.015), marble, 0, u(16), 0);
    K.put(rbox(u(48), u(5), u(48), 0.015), K.gloss(L.tone(MARBLE, 1.04)), 0, u(27.5), 0);
    // veins down the block's sides as painted, and the plate with the painting's own lettering
    for (const [x, y, w] of [[-14, 22, 7], [6, 16, 9], [-6, 11, 5]]) K.put(rbox(u(w), u(0.6), u(0.4), 0.002), K.plain(VEIN), u(x + w / 2), u(y), u(20.05));
    K.put(rbox(u(28), u(9), u(1), 0.004), K.metal(PLATE), 0, u(16.5), u(20.3));
    K.put(new L.THREE.PlaneGeometry(u(26), u(7)), K.pic(cut(K, L, [cx - 13, H - 20, cx + 13, H - 13])), 0, u(16.5), u(20.82));
    const f = statueFigure(K.p.statueOf);
    if (f) { const k = Math.min(58 / f.w, 94 / f.h); K.figure = { c: f.c, w: u(f.w * k), h: u(f.h * k), y: u(30) }; }
  },
};
