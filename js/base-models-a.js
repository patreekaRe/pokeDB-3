/* base-models-a.js  -  Things, Classics and Seats pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. */

import { frontbox } from './base-models-kit.js';

export const SHAPES = {
  stove: { make: 'stove' },
  // boxes, the painting on the front only (js/base-models-kit.js)
  'vending fridge': { make: 'frontbox' },
  'washer': { make: 'frontbox', d: 0.6 },
  'pc': { make: 'frontbox', d: 0.5 },
  'piano': { make: 'frontbox', d: 0.55 },
  'aquarium': { make: 'frontbox', d: 0.5 },
  'fireplace': { make: 'frontbox', d: 0.5, top: 0.2 },
  'sink': { make: 'frontbox', d: 0.55, top: 0.2 },
  'heater': { make: 'frontbox', d: 0.22 },
  'grandclock': { make: 'frontbox', d: 0.4, top: 0.12 },
};

export const MAKES = {
  frontbox,

  stove(K, s, W, D, L) {
    const { THREE, rbox, cyl, lathe, torus } = L;
    const body = K.gloss('#3a3c44'), dark = K.plain('#1c1d22'), steel = K.metal('#c8ccd4'), brass = K.metal('#d8b048');
    const w = 0.84, d = 0.62, h = 0.84, f = d / 2;
    // the body on a dark plinth, a steel top
    K.put(rbox(w, h - 0.06, d, 0.03), body, 0, 0.06 + (h - 0.06) / 2, 0);
    K.put(rbox(w - 0.04, 0.06, d - 0.04, 0.015), dark, 0, 0.03, 0);
    K.put(rbox(w + 0.02, 0.03, d + 0.02, 0.01), steel, 0, h + 0.015, 0);
    // the oven door: a handle bar, a window glowing warm, a frame
    K.put(rbox(w - 0.1, 0.46, 0.03, 0.015), K.gloss('#2c2e34'), 0, 0.36, f + 0.01);
    K.put(new THREE.PlaneGeometry(w - 0.3, 0.2), K.glow('#ff9a3a'), 0, 0.36, f + 0.027);
    K.put(new THREE.PlaneGeometry(w - 0.28, 0.22), K.glass(), 0, 0.36, f + 0.03);
    K.put(L.cyl(0.015, w - 0.24, 0.015, 10).rotateZ(Math.PI / 2), steel, 0, 0.62, f + 0.06);
    for (const sg of [-1, 1]) K.put(rbox(0.03, 0.03, 0.05, 0.008), steel, sg * (w / 2 - 0.13), 0.62, f + 0.035);
    // the control strip: four brass knobs
    K.put(rbox(w - 0.04, 0.1, 0.03, 0.01), K.gloss('#2c2e34'), 0, h - 0.07, f + 0.01);
    for (let i = 0; i < 4; i++) K.put(cyl(0.025, 0.03, 0.028, 16).rotateX(Math.PI / 2), brass, -0.27 + i * 0.18, h - 0.07, f + 0.035);
    // four burners, two glowing, and a backsplash
    for (const [x, z, on] of [[-0.18, -0.1, 1], [0.18, -0.1, 0], [-0.18, 0.12, 0], [0.18, 0.12, 1]]) {
      K.put(cyl(0.11, 0.012, 0.11, 24), dark, x, h + 0.036, z);
      K.put(torus(0.07, 0.008, Math.PI * 2, 24), on ? K.glow('#ff5a2a') : K.plain('#3a3a40'), x, h + 0.044, z, 0, Math.PI / 2);
      K.put(torus(0.035, 0.007, Math.PI * 2, 18), on ? K.glow('#ff5a2a') : K.plain('#3a3a40'), x, h + 0.044, z, 0, Math.PI / 2);
    }
    K.put(rbox(w, 0.16, 0.04, 0.012), body, 0, h + 0.1, -f + 0.02);
    for (let i = 0; i < 3; i++) K.put(rbox(0.06, 0.02, 0.01, 0.005), K.glow('#7ad0ff'), -0.1 + i * 0.1, h + 0.12, -f + 0.045);
    // a little pot on the back burner and a pan at the front
    K.put(lathe([[0.085, 0], [0.09, 0.01], [0.09, 0.12], [0.094, 0.13], [0, 0.13]], 24), steel, 0.18, h + 0.042, -0.1);
    K.put(cyl(0.08, 0.012, 0.08, 20), steel, 0.18, h + 0.18, -0.1);
    K.put(L.ball(0.016, 10, 8), K.gloss('#1c1d22'), 0.18, h + 0.2, -0.1);
    K.put(lathe([[0.08, 0], [0.095, 0.035], [0.1, 0.04], [0, 0.04]], 24), K.gloss('#2a2a30'), -0.18, h + 0.042, 0.12);
    K.put(rbox(0.16, 0.02, 0.03, 0.008).translate(0.09, 0, 0).rotateY(-0.5), K.gloss('#2a2a30'), -0.08, h + 0.07, 0.12);
  },
};
