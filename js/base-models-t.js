/* base-models-t.js  -  touch-ups (the survey of 2026-10-12 found these floor pieces weak): what stands on the kitchen
   counters and office desks, modelled near life size instead of their paintings puffed up (too small to read, some
   thin as a card from the side), and the tall Center plant's leaves modelled instead of crossed cards.
   js/base-models-f.js's head says how a batch works. A counter's or desk's thing is `ITEMS[s.item]`, built by
   B.counter / B.desk in js/base-mesh.js on their top, `y` its height; the top's middle is x, z 0, its front +z. */

import { tube, rod } from './base-models-kit.js';
import { leaf } from './base-models-b.js';

const u = (n) => n / 32;
const TAU = Math.PI * 2;
const INK = '#26262e', CHROME = '#c8ccd8', CREAM = '#f8e8d0', TOAST = '#d8a058', CRUST = '#a8702a';

const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* a computer screen: a window, lines of text, a bar */
const screen = (bg) => once('screen' + bg, () => sheet(128, 96, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, bg); gr.addColorStop(1, '#2a58a8');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f4f8ff'; g.fillRect(10, 12, 70, 52);
  g.fillStyle = '#4a88d8'; g.fillRect(10, 12, 70, 8);
  g.fillStyle = '#a8b8d0'; for (let j = 0; j < 5; j++) g.fillRect(16, 26 + j * 7, 30 + (j * 17) % 30, 3);
  g.fillStyle = '#f8d030'; g.fillRect(88, 14, 28, 20); g.fillStyle = '#58b848'; g.fillRect(88, 40, 28, 20);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, h - 10, w, 10);
}));
/* a typed page */
const page = () => once('page', () => sheet(64, 80, (g, w, h) => {
  g.fillStyle = '#fffbe8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7a7a88'; for (let j = 0; j < 8; j++) g.fillRect(8, 10 + j * 8, 44 - (j * 13) % 20, 2);
}));
/* a keyboard's keys from above */
const keys = (base, key) => once('keys' + base + key, () => sheet(128, 48, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.fillStyle = key;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) g.fillRect(4 + c * 10 + (r % 2) * 3, 4 + r * 10, 8, 8);
  g.fillRect(30, 44 - 4, 60, 4);
}));

/** A Berry or fruit: a ball, a dimple, its stem. */
function fruit(K, L, x, y, z, r, col, stem = '#6a4a2a') {
  K.put(L.ball(r, 16, 12), K.gloss(col), x, y, z);
  K.put(L.cyl(0.004, r * 0.5, 0.004, 6), K.plain(stem), x, y + r * 1.05, z, 0, 0.2);
}

/** A handle loop on a mug or kettle: a torus arc standing up, facing `turn`. */
function loop(K, L, m, x, y, z, r, t, turn = 0) {
  K.put(L.torus(r, t, Math.PI, 12).rotateZ(-Math.PI / 2), m, x, y, z, turn);
}

export const ITEMS = {
  /* ----- the kitchen counters ----- */
  toaster(K, L, y) {
    const { rbox, cyl } = L, body = K.metal(), dark = K.plain(INK);
    K.put(rbox(0.46, 0.27, 0.3, 0.07), body, 0, y + 0.135, 0);
    K.put(rbox(0.47, 0.03, 0.31, 0.012), K.metal(L.tone(K.pal.m, 1.25)), 0, y + 0.07, 0);
    for (const x of [-0.09, 0.09]) K.put(rbox(0.15, 0.012, 0.055, 0.005), dark, x, y + 0.27, 0);
    // two slices up out of the slots, browned at the crust
    for (const [x, up, c] of [[-0.09, 0.06, TOAST], [0.09, 0.035, L.tone(TOAST, 0.85)]]) {
      K.put(rbox(0.13, 0.12, 0.03, 0.03), K.plain(CRUST), x, y + 0.24 + up, 0);
      K.put(rbox(0.115, 0.105, 0.032, 0.025), K.plain(c), x, y + 0.24 + up + 0.004, 0);
    }
    K.put(rbox(0.035, 0.05, 0.06, 0.012), K.gloss(K.pal.a), 0.245, y + 0.19, 0.02);
    K.put(cyl(0.03, 0.02, 0.03, 16).rotateX(Math.PI / 2), K.gloss(K.pal.a), 0.12, y + 0.08, 0.155);
    for (const [x, z] of [[-0.17, -0.1], [0.17, -0.1], [-0.17, 0.1], [0.17, 0.1]]) K.put(cyl(0.02, 0.012, 0.02, 10), dark, x, y + 0.006, z);
  },

  kettle(K, L, y) {
    const { lathe, cyl, ball, torus } = L, body = K.gloss(K.pal.c), steel = K.metal();
    K.put(cyl(0.17, 0.03, 0.18, 28), K.gloss(INK), 0, y + 0.015, 0);
    K.put(lathe([[0.15, 0], [0.18, 0.04], [0.19, 0.1], [0.17, 0.18], [0.12, 0.23], [0.08, 0.245], [0.001, 0.245]], 32), body, 0, y + 0.03, 0);
    K.put(lathe([[0.085, 0], [0.07, 0.02], [0.03, 0.03], [0.001, 0.03]], 20), steel, 0, y + 0.27, 0);
    K.put(ball(0.03, 12, 10), K.gloss(K.pal.a), 0, y + 0.31, 0);
    // the spout out of its side, the handle arching over the top
    K.put(tube(L, [[0.15, y + 0.11, 0], [0.22, y + 0.17, 0], [0.27, y + 0.26, 0]], 0.03, 16), body);
    K.put(torus(0.13, 0.022, Math.PI, 20), K.gloss(INK), -0.02, y + 0.25, 0, Math.PI / 2);
    // steam
    for (const [x, yy, r] of [[0.28, 0.32, 0.025], [0.3, 0.37, 0.032], [0.27, 0.43, 0.026]]) K.put(ball(r, 10, 8), K.gloss('#ffffff'), x, y + yy, 0);
  },

  microwave(K, L, y) {
    const { rbox, cyl } = L, body = K.metal(), dark = K.plain(INK);
    K.put(rbox(0.66, 0.36, 0.42, 0.03), body, 0, y + 0.18, -0.02);
    // the door: a dark window onto the lit inside, its plate and a dish, a handle
    K.put(rbox(0.44, 0.3, 0.02, 0.015), K.metal(L.tone(K.pal.m, 0.9)), -0.1, y + 0.18, 0.195);
    K.put(rbox(0.36, 0.22, 0.01, 0.01), dark, -0.1, y + 0.18, 0.205);
    K.put(rbox(0.3, 0.16, 0.012, 0.01), K.glow('#d8b860'), -0.1, y + 0.18, 0.206);
    K.put(cyl(0.12, 0.01, 0.12, 24).scale(1, 1, 0.25), K.gloss('#f4f0e0'), -0.1, y + 0.12, 0.214);
    K.put(rbox(0.36, 0.22, 0.01, 0.01), K.glass(), -0.1, y + 0.18, 0.214);
    K.put(rbox(0.025, 0.2, 0.03, 0.01), K.metal(CHROME), 0.1, y + 0.18, 0.225);
    // the panel: a green clock, a pad of buttons, a dial
    K.put(rbox(0.11, 0.045, 0.012, 0.006), K.glow('#68e868'), 0.23, y + 0.3, 0.2);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) K.put(rbox(0.026, 0.022, 0.01, 0.005), K.gloss(L.tone(K.pal.m, 1.3)), 0.195 + i * 0.035, y + 0.24 - j * 0.032, 0.2);
    K.put(cyl(0.03, 0.02, 0.03, 18).rotateX(Math.PI / 2), K.gloss(K.pal.a), 0.23, y + 0.08, 0.2);
  },

  mixer(K, L, y) {
    const { rbox, cyl, lathe, blob, ball } = L, body = K.gloss(K.pal.c), steel = K.metal(CHROME);
    K.put(rbox(0.36, 0.05, 0.3, 0.025), body, 0, y + 0.025, 0);
    K.put(blob(0.13, 0.36, 0.14, 0.35, 0.45), body, 0.12, y + 0.2, -0.06);
    // the head over the bowl, tipped down a little
    K.put(blob(0.42, 0.13, 0.15, 0.35, 0.5), body, 0.0, y + 0.37, -0.03, 0, 0, 0.05);
    K.put(cyl(0.035, 0.02, 0.035, 14), K.metal(CHROME), -0.2, y + 0.36, -0.03, 0, 0, Math.PI / 2);
    K.put(lathe([[0.06, 0], [0.12, 0.03], [0.15, 0.14], [0.155, 0.16], [0.14, 0.16], [0.13, 0.04], [0.001, 0.02]], 32), steel, -0.06, y + 0.05, 0.02);
    K.put(cyl(0.13, 0.04, 0.12, 28), K.plain('#fff4e0'), -0.06, y + 0.17, 0.02);
    K.put(ball(0.06, 14, 10).scale(1, 0.6, 1), K.plain('#fff4e0'), -0.06, y + 0.19, 0.02);
    K.put(cyl(0.012, 0.12, 0.012, 8), steel, -0.06, y + 0.25, 0.02);
    K.put(ball(0.045, 12, 10).scale(0.6, 1.3, 0.6), steel, -0.06, y + 0.2, 0.02);
  },

  coffee(K, L, y) {
    const { rbox, cyl, lathe, ball } = L, body = K.metal(), coffee = K.plain('#4a2614');
    K.put(rbox(0.34, 0.04, 0.3, 0.015), body, 0, y + 0.02, 0);
    K.put(rbox(0.14, 0.44, 0.28, 0.025), body, 0.1, y + 0.22, -0.01);
    K.put(rbox(0.36, 0.09, 0.3, 0.025), body, 0.0, y + 0.45, -0.01);
    K.put(rbox(0.2, 0.07, 0.25, 0.02), K.plain(L.tone(K.pal.m, 0.7)), -0.06, y + 0.37, 0.0);
    // the glass jug on its hot plate, coffee in it, its handle
    K.put(cyl(0.1, 0.012, 0.1, 24), K.plain(INK), -0.07, y + 0.046, 0.03);
    K.put(lathe([[0.095, 0], [0.1, 0.06], [0.08, 0.17], [0.065, 0.2], [0.07, 0.22], [0.001, 0.22]], 28), K.glass(), -0.07, y + 0.052, 0.03);
    K.put(lathe([[0.088, 0], [0.093, 0.06], [0.085, 0.1], [0.001, 0.1]], 28), coffee, -0.07, y + 0.056, 0.03);
    K.put(cyl(0.072, 0.03, 0.072, 24), K.plain(INK), -0.07, y + 0.27, 0.03);
    loop(K, L, K.plain(INK), -0.17, y + 0.17, 0.03, 0.05, 0.014, Math.PI);
    K.put(ball(0.022, 12, 10), K.glow('#e04848'), 0.1, y + 0.2, 0.14);
    K.put(rbox(0.07, 0.03, 0.012, 0.005), K.glow('#68e868'), 0.1, y + 0.28, 0.135);
  },

  ricecooker(K, L, y) {
    const { lathe, cyl, ball, rbox, torus } = L, body = K.gloss(K.pal.p);
    K.put(lathe([[0.17, 0], [0.2, 0.03], [0.21, 0.16], [0.19, 0.2], [0.001, 0.2]], 36), body, 0, y, 0);
    K.put(lathe([[0.19, 0], [0.17, 0.05], [0.1, 0.085], [0.001, 0.09]], 36), K.gloss(L.tone(K.pal.p, 1.06)), 0, y + 0.2, 0);
    K.put(torus(0.2, 0.008, TAU, 36), K.gloss(L.tone(K.pal.p, 0.8)), 0, y + 0.2, 0, 0, Math.PI / 2);
    K.put(ball(0.03, 12, 10), K.gloss(K.pal.c), 0, y + 0.29, 0);
    K.put(torus(0.1, 0.018, Math.PI, 16), K.gloss(L.tone(K.pal.p, 0.85)), 0, y + 0.24, -0.02);
    // the panel on its front: a dark window, a green light, a button
    K.put(rbox(0.14, 0.07, 0.03, 0.012).rotateX(-0.1), K.plain('#3a4a5a'), 0, y + 0.11, 0.195);
    K.put(rbox(0.05, 0.025, 0.01, 0.005), K.glow('#68e868'), -0.025, y + 0.115, 0.212);
    K.put(cyl(0.015, 0.012, 0.015, 12).rotateX(Math.PI / 2), K.gloss(K.pal.c), 0.04, y + 0.11, 0.212);
  },

  breadbox(K, L, y) {
    const { rbox, ball, cyl, profileSlab } = L, wood = K.wood(), w = 0.5, d = 0.3, hy = 0.7, z0 = -0.08;
    // a box with a roll-top front, its slats and knob; a loaf on a board before it
    const arc = [];
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; arc.push([-d / 2 + Math.sin(a) * d, Math.cos(a) * d * hy]); }
    K.put(profileSlab([[d / 2, 0], [-d / 2, 0], ...arc], w, -w / 2), wood, 0, y, z0);
    for (let i = 2; i < 12; i += 1.5) {
      const a = i / 12 * Math.PI / 2, zz = -d / 2 + Math.sin(a) * (d + 0.003), yy = Math.cos(a) * (d + 0.003) * hy;
      K.put(cyl(0.004, w - 0.02, 0.004, 6).rotateZ(Math.PI / 2), K.wood(L.tone(K.pal.w, 0.75)), 0, y + yy, z0 + zz);
    }
    K.put(ball(0.022, 12, 10), K.gloss(K.pal.a), 0, y + 0.07, z0 + d / 2 - 0.02);
    K.put(rbox(0.36, 0.022, 0.16, 0.01), K.wood('#c8965a'), 0.0, y + 0.011, 0.26);
    K.put(ball(1, 20, 14).scale(0.15, 0.065, 0.065), K.plain(TOAST), 0.0, y + 0.075, 0.26);
    for (const x of [-0.07, 0, 0.07]) K.put(rbox(0.012, 0.01, 0.07, 0.004), K.plain(CRUST), x, y + 0.135, 0.26, 0.4);
  },

  fruitbowl(K, L, y) {
    const { lathe } = L;
    K.put(lathe([[0.08, 0], [0.12, 0.01], [0.22, 0.07], [0.26, 0.12], [0.25, 0.125], [0.2, 0.08], [0.001, 0.03]], 36), K.gloss(K.pal.c), 0, y, 0);
    // apples, an orange, Berries, a banana and grapes heaped in it
    for (const [x, yy, z, r, c] of [[-0.1, 0.12, 0.05, 0.065, '#e04848'], [0.09, 0.12, 0.06, 0.07, '#f08030'], [0.0, 0.12, -0.08, 0.068, '#78c048'],
      [0.12, 0.13, -0.08, 0.055, '#e04848'], [-0.11, 0.13, -0.09, 0.055, '#a858d8'], [0.0, 0.2, 0.0, 0.07, '#f8d030']]) fruit(K, L, x, y + yy, z, r, c);
    K.put(tube(L, [[-0.18, y + 0.16, 0.12], [-0.06, y + 0.12, 0.17], [0.08, y + 0.14, 0.16], [0.17, y + 0.2, 0.11]], 0.03, 20), K.gloss('#f8d850'));
    leaf(K, L, K.gloss(K.pal.leaf), 0.0, y + 0.28, 0.0, 0.6, 0.6, 0.09, 0.035, 0.2);
  },

  cake(K, L, y) {
    const { lathe, cyl, ball } = L, plate = K.metal(CHROME), sponge = K.gloss(CREAM), band = K.gloss(K.pal.c);
    K.put(lathe([[0.1, 0], [0.04, 0.03], [0.03, 0.09], [0.06, 0.11], [0.24, 0.115], [0.24, 0.125], [0.001, 0.125]], 32), plate, 0, y, 0);
    // two tiers, a ribbon of icing round each, cream dabs, a Berry on top
    const t1 = y + 0.125;
    K.put(cyl(0.19, 0.14, 0.19, 36), sponge, 0, t1 + 0.07, 0);
    K.put(cyl(0.192, 0.03, 0.192, 36), band, 0, t1 + 0.05, 0);
    const t2 = t1 + 0.14;
    K.put(cyl(0.12, 0.11, 0.12, 32), sponge, 0, t2 + 0.055, 0);
    K.put(cyl(0.122, 0.022, 0.122, 32), band, 0, t2 + 0.04, 0);
    for (let n = 0; n < 12; n++) { const a = n / 12 * TAU; K.put(ball(0.022, 10, 8), K.gloss('#ffffff'), Math.cos(a) * 0.17, t2 + 0.005, Math.sin(a) * 0.17); }
    for (let n = 0; n < 8; n++) { const a = n / 8 * TAU; K.put(ball(0.018, 10, 8), K.gloss('#ffffff'), Math.cos(a) * 0.1, t2 + 0.115, Math.sin(a) * 0.1); }
    fruit(K, L, 0, t2 + 0.15, 0, 0.04, '#e04848', K.pal.leaf);
  },

  dishrack(K, L, y) {
    const { rbox, cyl, torus } = L, wire = K.metal(), plates = [K.gloss(K.pal.p), K.gloss('#ffffff')];
    K.put(rbox(0.56, 0.03, 0.3, 0.012), wire, 0, y + 0.015, 0);
    for (let i = 0; i < 9; i++) for (const z of [-0.1, 0.1]) K.put(cyl(0.005, 0.1, 0.005, 6), wire, -0.24 + i * 0.06, y + 0.08, z);
    // plates on edge between the wires, a cup upside down beside them
    for (let i = 0; i < 6; i++) {
      const x = -0.22 + i * 0.06;
      K.put(cyl(0.12, 0.012, 0.12, 28).rotateZ(Math.PI / 2), plates[i % 2], x, y + 0.15, 0, 0, 0, 0.12);
      K.put(torus(0.1, 0.006, TAU, 28).rotateY(Math.PI / 2), K.gloss(K.pal.c), x + 0.008, y + 0.15, 0, 0, 0, 0.12);
    }
    K.put(cyl(0.05, 0.11, 0.045, 20), K.gloss(K.pal.c), 0.2, y + 0.085, 0.05);
    loop(K, L, K.gloss(K.pal.c), 0.25, y + 0.085, 0.05, 0.035, 0.01);
  },

  chopping(K, L, y) {
    const { rbox, lathe, cyl, ball } = L;
    K.put(rbox(0.56, 0.03, 0.34, 0.03), K.wood(L.tone(K.pal.w, 1.15)), 0, y + 0.015, 0.02);
    const top = y + 0.03;
    // a carrot and its tops, its slices, an onion, a knife
    K.put(lathe([[0.001, 0], [0.025, 0.06], [0.035, 0.2], [0.03, 0.22], [0.001, 0.22]], 16).rotateZ(-Math.PI / 2 + 0.05), K.gloss('#f08030'), -0.2, top + 0.035, -0.04, 0.25);
    for (let i = 0; i < 3; i++) leaf(K, L, K.gloss(K.pal.leaf), -0.21, top + 0.04, -0.04 + (i - 1) * 0.015, Math.PI + 0.25 + (i - 1) * 0.4, 0.5, 0.1, 0.015);
    for (let i = 0; i < 4; i++) K.put(cyl(0.03, 0.012, 0.03, 16), K.gloss(i % 2 ? '#f8a050' : '#f08030'), 0.04 + i * 0.045, top + 0.006, 0.1 - i * 0.012, 0, 0.1 * i, 0.05);
    K.put(lathe([[0.001, 0], [0.05, 0.02], [0.065, 0.06], [0.04, 0.11], [0.005, 0.14], [0.001, 0.14]], 20), K.gloss('#e8d0a8'), 0.15, top, -0.07);
    K.put(rbox(0.2, 0.004, 0.045, 0.002), K.metal(CHROME), 0.0, top + 0.006, 0.03, -0.4);
    K.put(rbox(0.1, 0.022, 0.03, 0.01), K.plain(INK), -0.14, top + 0.012, 0.13, -0.4);
    K.put(ball(0.004, 6, 4), K.metal(CHROME), -0.12, top + 0.024, 0.122);
  },

  blender(K, L, y) {
    const { rbox, lathe, cyl, ball } = L;
    K.put(rbox(0.22, 0.13, 0.22, 0.04), K.metal(), 0, y + 0.065, 0);
    K.put(cyl(0.025, 0.02, 0.025, 14).rotateX(Math.PI / 2), K.gloss(K.pal.a), -0.04, y + 0.07, 0.11);
    K.put(cyl(0.02, 0.02, 0.02, 14).rotateX(Math.PI / 2), K.glow('#68e868'), 0.05, y + 0.07, 0.11);
    // the jug: glass flaring up, the smoothie inside, a lid, a handle
    const j = y + 0.13;
    K.put(lathe([[0.06, 0], [0.085, 0.03], [0.11, 0.3], [0.001, 0.3]], 28), K.glass(), 0, j, 0);
    K.put(lathe([[0.055, 0], [0.08, 0.03], [0.095, 0.18], [0.001, 0.18]], 28), K.gloss(K.pal.c), 0, j + 0.005, 0);
    K.put(ball(0.07, 14, 10).scale(1, 0.4, 1), K.gloss(L.tone(K.pal.c, 1.15)), 0, j + 0.185, 0);
    K.put(cyl(0.115, 0.03, 0.112, 28), K.metal(), 0, j + 0.315, 0);
    K.put(cyl(0.03, 0.03, 0.03, 14), K.metal(), 0, j + 0.345, 0);
    K.put(rbox(0.03, 0.2, 0.05, 0.012), K.glass(), 0.13, j + 0.17, 0);
    rod(K, L, K.glass(), [0.1, j + 0.27, 0], [0.13, j + 0.27, 0], 0.012);
  },

  spices(K, L, y) {
    const { rbox, cyl } = L, wood = K.wood();
    // a little stepped rack, jars along both steps, their lids in the accent
    K.put(rbox(0.56, 0.03, 0.26, 0.01), wood, 0, y + 0.015, 0);
    K.put(rbox(0.56, 0.08, 0.1, 0.01), wood, 0, y + 0.07, -0.08);
    K.put(rbox(0.56, 0.22, 0.02, 0.008), wood, 0, y + 0.11, -0.13);
    const fill = ['#c84830', '#e8b030', '#6a9a3a', '#8a4a2a', '#f4f0e0', '#d87830', '#a8302a', '#e0d050', '#5a7a3a'];
    let n = 0;
    for (const [z, base, count] of [[-0.08, y + 0.11, 4], [0.07, y + 0.03, 5]]) for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 0.105, h = 0.1 + (n % 3) * 0.015;
      K.put(cyl(0.04, h, 0.04, 18), K.glass(), x, base + h / 2, z);
      K.put(cyl(0.036, h * 0.72, 0.036, 18), K.plain(fill[n % fill.length]), x, base + h * 0.36, z);
      K.put(cyl(0.042, 0.03, 0.042, 18), K.gloss(n % 2 ? K.pal.a : L.tone(K.pal.a, 0.8)), x, base + h + 0.015, z);
      K.put(cyl(0.041, 0.035, 0.041, 18), K.plain('#f4f0e0'), x, base + h * 0.5, z + 0.001);
      n++;
    }
  },

  herbs(K, L, y) {
    const { rbox, lathe, cyl, ball } = L, R = K.r;
    K.put(rbox(0.6, 0.025, 0.24, 0.01), K.wood(), 0, y + 0.012, 0);
    // three pots of herbs: basil, chives, a round-leaved one
    for (const [x, kind, pot] of [[-0.19, 0, K.gloss(K.pal.pot)], [0, 1, K.gloss(L.tone(K.pal.pot, 1.12))], [0.19, 2, K.gloss(K.pal.pot)]]) {
      const b = y + 0.025;
      K.put(lathe([[0.055, 0], [0.07, 0.11], [0.08, 0.115], [0.08, 0.14], [0.072, 0.14], [0.001, 0.13]], 24), pot, x, b, 0);
      K.put(cyl(0.07, 0.006, 0.07, 18), K.plain('#3a2416'), x, b + 0.13, 0);
      const g = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.15)), K.gloss(L.tone(K.pal.leaf, 0.85))], s = b + 0.13;
      if (kind === 1) for (let i = 0; i < 14; i++) {
        const a = i * 2.4, tip = 0.15 + R() * 0.35, h = 0.17 + R() * 0.08;
        rod(K, L, g[i % 3], [x + Math.cos(a) * 0.02, s, Math.sin(a) * 0.02], [x + Math.cos(a) * h * Math.sin(tip), s + h * Math.cos(tip), Math.sin(a) * h * Math.sin(tip)], 0.006);
      } else for (let i = 0; i < 14; i++) {
        const a = i * 2.4 + R() * 0.3, t = i / 14;
        leaf(K, L, g[i % 3], x, s + 0.02 + t * 0.1, 0, a, 0.5 + t * 0.5, kind ? 0.06 : 0.08, kind === 2 ? 0.035 : 0.03, 0.3);
      }
      if (kind === 2) for (let i = 0; i < 3; i++) K.put(ball(0.012, 8, 6), K.gloss('#f8f8f0'), x + (i - 1) * 0.03, s + 0.15, (R() - 0.5) * 0.04);
    }
  },

  /* ----- the office desks ----- */
  laptop(K, L, y) {
    const { rbox, cyl } = L, shell = K.metal();
    K.put(rbox(0.44, 0.022, 0.3, 0.012), shell, -0.06, y + 0.011, 0.06);
    K.put(new L.THREE.PlaneGeometry(0.38, 0.15).rotateX(-Math.PI / 2), K.pic(keys(L.tone(K.pal.m, 0.5), L.tone(K.pal.m, 1.3))), -0.06, y + 0.023, 0.01);
    K.put(rbox(0.13, 0.002, 0.07, 0.004), K.gloss(L.tone(K.pal.m, 1.2)), -0.06, y + 0.023, 0.15);
    // the lid tipped back from the back edge, its screen lit
    const lid = rbox(0.44, 0.29, 0.016, 0.01).translate(0, 0.145, 0).rotateX(-0.28);
    K.put(lid, shell, -0.06, y + 0.022, -0.09);
    const scr = new L.THREE.PlaneGeometry(0.39, 0.25).translate(0, 0.15, 0.009).rotateX(-0.28);
    K.put(scr, L.litPic(screen('#68b8f0'), 0.6), -0.06, y + 0.022, -0.09);
    // a mug
    K.put(cyl(0.05, 0.11, 0.045, 20), K.gloss(K.pal.c), 0.27, y + 0.055, 0.08);
    K.put(cyl(0.042, 0.004, 0.042, 18), K.plain('#5a3018'), 0.27, y + 0.1, 0.08);
    loop(K, L, K.gloss(K.pal.c), 0.32, y + 0.055, 0.08, 0.035, 0.01);
  },

  typewriter(K, L, y) {
    const { rbox, cyl, profileSlab } = L, body = K.gloss(K.pal.c), dark = K.plain(INK);
    K.put(profileSlab([[0.17, 0], [-0.15, 0], [-0.15, 0.15], [-0.05, 0.16], [0.17, 0.06]], 0.5, -0.25), body, 0, y, 0);
    // three rows of round cream keys on the slope, the space bar
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
      const z = 0.12 - r * 0.05, yy = 0.065 + r * 0.023;
      K.put(cyl(0.017, 0.02, 0.017, 12), K.gloss('#f4f4f0'), -0.17 + i * 0.042 + (r % 2) * 0.02, y + yy + 0.01, z, 0, -0.35);
      K.put(cyl(0.004, 0.03, 0.004, 6), dark, -0.17 + i * 0.042 + (r % 2) * 0.02, y + yy - 0.01, z, 0, -0.35);
    }
    K.put(rbox(0.24, 0.015, 0.03, 0.007), K.gloss('#f4f4f0'), 0, y + 0.06, 0.16, 0, -0.35);
    // the platen roller, its knobs and return lever, the page rolled in
    K.put(cyl(0.035, 0.52, 0.035, 18).rotateZ(Math.PI / 2), dark, 0, y + 0.19, -0.1);
    for (const sx of [-1, 1]) K.put(cyl(0.03, 0.03, 0.03, 14).rotateZ(Math.PI / 2), K.metal(CHROME), sx * 0.275, y + 0.19, -0.1);
    K.put(cyl(0.008, 0.12, 0.008, 8), K.metal(CHROME), -0.29, y + 0.24, -0.07, 0, 0.5, 0.3);
    K.put(new L.THREE.PlaneGeometry(0.22, 0.26).translate(0, 0.13, 0).rotateX(-0.2), K.pic(page()), 0, y + 0.2, -0.12);
    K.put(new L.THREE.PlaneGeometry(0.22, 0.26).translate(0, 0.13, 0).rotateX(-0.2).rotateY(Math.PI), K.plain('#fffbe8'), 0, y + 0.2, -0.122);
  },

  paper(K, L, y) {
    const { rbox, cyl } = L, R = K.r, sheets = [K.plain('#f8f8f0'), K.plain('#ecece2')];
    // a wire tray of letters, two loose stacks, a pen
    K.put(rbox(0.3, 0.012, 0.24, 0.004), K.metal(), -0.16, y + 0.006, -0.06);
    for (const sx of [-1, 1]) K.put(rbox(0.012, 0.06, 0.24, 0.004), K.metal(), -0.16 + sx * 0.15, y + 0.03, -0.06);
    for (const [x, z, n, base] of [[-0.16, -0.06, 10, 0.012], [0.14, -0.08, 22, 0], [0.12, 0.13, 6, 0]]) {
      for (let i = 0; i < n; i++) K.put(rbox(0.24, 0.006, 0.18, 0.002), sheets[i % 2], x + (R() - 0.5) * 0.02, y + base + 0.003 + i * 0.0062, z + (R() - 0.5) * 0.015, (R() - 0.5) * 0.12);
    }
    K.put(new L.THREE.PlaneGeometry(0.24, 0.18).rotateX(-Math.PI / 2), K.pic(page()), 0.12, y + 0.04, 0.13, 0.05);
    K.put(cyl(0.008, 0.16, 0.008, 10).rotateZ(Math.PI / 2), K.gloss(K.pal.c), -0.12, y + 0.008, 0.16, 0.5);
  },

  phone(K, L, y) {
    const { rbox, blob, cyl, ball, lathe, torus } = L, body = K.gloss(K.pal.c), dark = K.gloss(L.tone(K.pal.c, 0.75));
    // a desk phone: its body, the handset on its cradle, the dial, its curly cord
    K.put(blob(0.26, 0.11, 0.22, 0.4, 0.5), body, -0.12, y + 0.055, 0.05);
    for (const sx of [-1, 1]) K.put(rbox(0.03, 0.04, 0.05, 0.012), dark, -0.12 + sx * 0.09, y + 0.12, 0.03);
    K.put(cyl(0.022, 0.24, 0.022, 14).rotateZ(Math.PI / 2), dark, -0.12, y + 0.15, 0.03);
    for (const sx of [-1, 1]) K.put(ball(0.04, 14, 10).scale(1, 0.7, 1.1), dark, -0.12 + sx * 0.12, y + 0.15, 0.03);
    K.put(cyl(0.06, 0.012, 0.06, 24).rotateX(Math.PI / 2 - 0.5), K.gloss('#f4f4f0'), -0.12, y + 0.08, 0.15);
    K.put(torus(0.04, 0.006, TAU, 18).rotateX(-0.5), K.gloss(INK), -0.12, y + 0.08, 0.157);
    const coil = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * TAU * 7; coil.push([-0.26 + Math.cos(a) * 0.012 - t * 0.02, y + 0.13 - t * 0.12 + Math.sin(a) * 0.012, 0.03 + t * 0.06]); }
    K.put(tube(L, coil, 0.004, 120), dark);
    // a banker's lamp at the back right
    K.put(lathe([[0.08, 0], [0.07, 0.025], [0.02, 0.035], [0.001, 0.035]], 24), K.metal(), 0.2, y, -0.12);
    K.put(cyl(0.012, 0.24, 0.012, 10), K.metal(), 0.2, y + 0.15, -0.12);
    K.put(cyl(0.05, 0.08, 0.1, 20, true), K.gloss(K.pal.a), 0.2, y + 0.29, -0.08, 0, 0.45);
    K.put(ball(0.03, 12, 10), K.glow('#fff0b0'), 0.2, y + 0.26, -0.065);
  },

  monitor(K, L, y) {
    const { rbox, ball } = L, dark = K.plain(INK), stand = K.metal();
    // two screens turned in a little, on stands; a keyboard and a mouse before them
    for (const sx of [-1, 1]) {
      const x = sx * 0.19, turn = -sx * 0.25;
      K.put(rbox(0.16, 0.012, 0.12, 0.006), stand, x, y + 0.006, -0.12);
      K.put(rbox(0.04, 0.14, 0.02, 0.008), stand, x, y + 0.08, -0.14);
      K.put(rbox(0.36, 0.24, 0.025, 0.012), dark, x, y + 0.27, -0.12, turn);
      K.put(new L.THREE.PlaneGeometry(0.33, 0.21).translate(0, 0, 0.0135).rotateY(turn), L.litPic(screen(sx < 0 ? '#68b8f0' : '#58c8a0'), 0.6), x, y + 0.27, -0.12);
    }
    K.put(rbox(0.38, 0.02, 0.13, 0.008), dark, -0.02, y + 0.01, 0.13);
    K.put(new L.THREE.PlaneGeometry(0.36, 0.11).rotateX(-Math.PI / 2), K.pic(keys(INK, '#8a8a98')), -0.02, y + 0.021, 0.13);
    K.put(ball(1, 14, 10).scale(0.03, 0.018, 0.045), K.gloss(L.tone(K.pal.m, 1.2)), 0.26, y + 0.01, 0.14);
  },
};

export const SHAPES = {
  'toastercounter kettlecounter microwavecounter mixercounter coffeecounter ricecookercounter breadboxcounter fruitbowlcounter cakecounter dishrackcounter choppingcounter blendercounter spicescounter herbscounter':
    { make: 'counter', top: 0.85, kitchen: true, items: 'counter' },
  'laptopdesk typewriterdesk paperdesk phonedesk monitordesk': { make: 'desk', top: 0.75, items: 'desk' },
  centerplant: { make: 'centerplant' },
};

export const MAKES = {
  centerplant(K, s, W, D, L) {
    const { lathe, cyl } = L, R = K.r;
    // a tall round planter in the pale colour, a band round it
    K.put(lathe([[u(9), 0], [u(9.5), u(1)], [u(10), u(15)], [u(11), u(15.5)], [u(11), u(18)], [u(10), u(18)], [u(9.4), u(17)], [0.001, u(17)]], 32), K.gloss(K.pal.p), 0, 0, 0);
    K.put(cyl(u(10.08), u(3), u(9.88), 32), K.gloss(K.pal.c), 0, u(12.5), 0);
    K.put(cyl(u(9.3), 0.01, u(9.3), 28), K.plain('#3a2416'), 0, u(17), 0);
    // three canes, each with leaves in pairs up it and a tuft on top
    const g = [K.gloss(K.pal.leaf), K.gloss(L.tone(K.pal.leaf, 1.12)), K.gloss(L.tone(K.pal.leaf, 0.86))];
    for (const [x, z, h, lean] of [[-u(3.5), u(1.5), u(44), -0.08], [u(1.5), -u(2), u(56), 0.03], [u(4.5), u(2.5), u(38), 0.12]]) {
      const top = [x + Math.sin(lean) * h, u(17) + h, z];
      rod(K, L, K.wood(), [x, u(16), z], top, u(1.1));
      for (let n = 0, y = u(17) + h * 0.35; y < top[1] - u(4); n++, y += u(5)) {
        const f = (y - u(17)) / h, at = x + Math.sin(lean) * (y - u(17)), a = n * 2.1 + R() * 0.4;
        for (const flip of [0, Math.PI]) leaf(K, L, g[(n + (flip ? 1 : 0)) % 3], at, y, z, a + flip, 0.95 + R() * 0.2, u(9) + f * u(3), u(2.3), 0.35);
      }
      for (let i = 0; i < 7; i++) leaf(K, L, g[i % 3], top[0], top[1], z, i * 0.9 + R() * 0.3, 0.25 + (i % 3) * 0.3, u(10) + R() * u(2), u(2.4), 0.25);
    }
  },
};
