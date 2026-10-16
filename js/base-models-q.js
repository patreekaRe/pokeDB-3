/* base-models-q.js  -  the Game Corner's and the Station's machines that were plain boxes wearing their painting on the
   front (js/base-models-kit.js's `frontbox`), hand-built like the Game Corner's arcade cabinets (js/base-mesh.js's
   B.arcade; the user's ask, 2026-10-16: "3D detailed CLEAN models ... optimise them"): the six game cabinets on one
   cabinet profile, each with a deck of its own (a wheel and pedals for the racer, arrow pads for the rhythm game), the
   prize counter, the token and ticket machines, the photo booth, the coin pusher, the capsule toys and the news stand.
   js/base-models-f.js's head says how a batch works. Each builder follows its painting (js/base-furniture-rooms5.js)
   pixel for pixel: `u(n)` is n of its 32 pixels a tile, `X(n, W)` a pixel across it as x from the middle, and `shot()`
   cuts its pixels [x0, j0, x1, j1] (x from the left, j up from the floor) for a screen or a sign. */

import { pokeBall, rod } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const INK = '#303038', CHROME = '#c8ccd8', GOLD = '#f0c040', MARQUEE = '#fff4c0', PALE = '#e8f4f8', TICKET = '#f8f0d0';
const RAINBOW = ['#e04848', '#f08030', '#f8d030', '#58b848', '#4a98d8', '#5a58c8', '#a858d8'];
const LAMP = '#f8d860';
const NEON = ['#f858c8', '#58f0f8', '#f8f058', '#78f858'];
const HALF_PI = Math.PI / 2;

const crops = new Map();
/** The painting's pixels [x0, j0, x1, j1] as a canvas cut from its HD painting, kept per piece. */
function shot(K, L, box) {
  const key = `${K.p.fam}|${K.p.theme}|${box}`;
  let c = crops.get(key);
  if (!c) {
    const [x0, j0, x1, j1] = box, hd = L.HD, art = K.p.art(0, hd, true), H = art.height / hd;
    c = new OffscreenCanvas(Math.max(1, Math.round((x1 - x0) * hd)), Math.max(1, Math.round((j1 - j0) * hd)));
    c.getContext('2d').drawImage(art, x0 * hd, (H - j1) * hd, (x1 - x0) * hd, (j1 - j0) * hd, 0, 0, c.width, c.height);
    crops.set(key, c);
    if (crops.size > 160) crops.delete(crops.keys().next().value);
  }
  return c;
}
/** A plane the size of the painting's pixels `box`, wearing them lit `k` bright, and its material. */
const plate = (K, L, box, k) => [new L.THREE.PlaneGeometry(u(box[2] - box[0]), u(box[3] - box[1])), L.litPic(shot(K, L, box), k)];
/** A disc facing the front. */
const disc = (L, r, t, seg = 12) => L.cyl(r, t, r, seg).rotateX(HALF_PI);
const coin = (L) => L.cyl(0.036, 0.012, 0.036, 8);

export const SHAPES = {
  racercabinet: { make: 'gamecabQ', game: 'racer' },
  shootercabinet: { make: 'gamecabQ', game: 'shooter' },
  puzzlecabinet: { make: 'gamecabQ', game: 'puzzle' },
  fightercabinet: { make: 'gamecabQ', game: 'fighter' },
  mazecabinet: { make: 'gamecabQ', game: 'maze' },
  rhythmcabinet: { make: 'gamecabQ', game: 'rhythm' },
  prizecounter: { make: 'prizecounter', top: 1.16 },
  tokenmachine: { make: 'tokenmachine' },
  photobooth: { make: 'photobooth' },
  coinpusher: { make: 'coinpusher' },
  capsuletoy: { make: 'capsuletoy' },
  ticketmachine: { make: 'ticketmachine' },
  newsstand: { make: 'newsstand' },
};

export const MAKES = {
  gamecabQ(K, s, W, D, L) {
    const { rbox, cyl, ball, profileSlab, tone, torus } = L, col = K.pal.c, ink = K.gloss(INK), chrome = K.metal(CHROME);
    const half = u(14), T = 0.06, inner = half * 2 - T * 2, top = u(90);
    // the two sides cut to the cabinet's profile (points set in by their bevel), the darker body set back between them
    const side = [[-0.318, 0.012], [0.238, 0.012], [0.238, 1.24], [0.198, 1.5], [0.108, 2.38], [0.278, 2.42], [0.278, top - 0.012], [-0.318, top - 0.012]];
    const body = [[-0.306, 0.004], [0.222, 0.004], [0.222, 1.24], [0.187, 1.5], [0.097, 2.38], [0.266, 2.42], [0.266, top - 0.004], [-0.306, top - 0.004]];
    for (const x of [-half, half - T]) K.put(profileSlab(side, T, x), K.gloss(col));
    K.put(profileSlab(body, inner, -half + T, 0.004), K.gloss(tone(col, 0.78)));
    K.put(rbox(half * 2 + 0.012, 0.03, 0.63, 0.012, 1), K.gloss(col), 0, top - 0.015, -0.02);
    for (const sg of [-1, 1]) {
      K.put(rbox(0.006, 0.07, 0.5, 0.003, 1), K.gloss(K.pal.a), sg * (half + 0.003), 0.8, -0.05, 0, 0.5);
      K.put(rbox(0.014, 1.2, 0.014, 0.005, 1), chrome, sg * (half - 0.004), 0.62, 0.25);
      K.put(rbox(0.014, top - 2.44, 0.014, 0.005, 1), chrome, sg * (half - 0.004), (top + 2.42) / 2, 0.29);
    }
    // the marquee, flat on the hood: js/base-play.js's live screen lands on the painting's marquee (its glow colour), so
    // the picture there sits a hair over this plane
    K.put(...plate(K, L, [4, 78, 28, 88], 0.75), 0, u(83), 0.274);
    K.put(rbox(inner, 0.016, 0.1, 0.006, 1), K.glow(LAMP), 0, 2.392, 0.19);
    // the screen in its bezel, leaning back with the cabinet's front
    const lean = (geo, m, out) => { geo.translate(0, 0, out); K.put(geo, m, 0, u(62), 0.146, 0, -0.102); };
    lean(rbox(inner - 0.01, u(24), 0.024, 0.008, 1), ink, 0.012);
    const [sg, sm] = plate(K, L, [6, 52, 26, 72], 0.8);
    lean(sg, sm, 0.026);
    lean(new L.THREE.PlaneGeometry(u(22), u(22)), K.glass(), 0.034);
    // the coin door, its lit slots, a chrome kick plate
    K.put(rbox(u(10), u(12), 0.02, 0.008, 1), K.metal(K.pal.m), 0, u(26), 0.234);
    for (const x of [X(14), X(18)]) { K.put(rbox(u(2), u(4), 0.012, 0.004, 1), K.glow(LAMP), x, u(27), 0.246); K.put(rbox(0.008, 0.08, 0.01, 0.003, 1), ink, x, u(27), 0.252); }
    K.put(rbox(inner, 0.07, 0.02, 0.008, 1), chrome, 0, 0.035, 0.232);
    // the control deck, a wedge a pixel wider than the cabinet; its parts stand up off its slope
    K.put(profileSlab([[0.17, 1.232], [0.408, 1.232], [0.408, 1.318], [0.2, 1.488], [0.17, 1.488]], u(30), -u(15)), K.metal(K.pal.m));
    const deck = (geo, m, x, up, along) => { geo.translate(x, up, along); K.put(geo, m, 0, 1.412, 0.312, 0, 0.686); };
    deck(rbox(0.86, 0.01, 0.22, 0.004, 1), K.gloss(tone(col, 0.5)), 0, 0.004, 0);
    const stick = (x, along, knob = '#e04848') => {
      deck(cyl(0.04, 0.012, 0.04, 12), ink, x, 0.014, along);
      deck(cyl(0.01, 0.18, 0.01, 8), chrome, x, 0.1, along);
      deck(ball(0.045, 12, 8), K.gloss(knob), x, 0.2, along);
    };
    const button = (x, along, c, r = 0.03) => {
      deck(cyl(r + 0.008, 0.012, r + 0.01, 12), ink, x, 0.014, along);
      deck(cyl(r, 0.022, r, 12), K.gloss(c), x, 0.028, along);
    };
    const game = s.game;
    if (game === 'racer') {
      // a steering wheel on its column, a gear stick, and pedals on a foot plate
      const hub = [0, 1.6, 0.4], tilt = -0.5;
      rod(K, L, ink, [0, 1.5, 0.26], hub, 0.022);
      K.put(torus(0.14, 0.018, Math.PI * 2, 20), ink, ...hub, 0, tilt);
      K.put(disc(L, 0.04, 0.04, 12), chrome, ...hub, 0, tilt);
      K.put(disc(L, 0.022, 0.05, 10), K.gloss('#e04848'), ...hub, 0, tilt);
      for (const a of [-HALF_PI, Math.PI / 6, Math.PI * 5 / 6]) K.put(rbox(0.11, 0.02, 0.012, 0.005, 1).translate(0.075, 0, 0).rotateZ(a), ink, ...hub, 0, tilt);
      stick(X(26), -0.05, '#202028');
      button(X(19), -0.06, '#f8d030', 0.022);
      K.put(rbox(0.44, 0.024, 0.2, 0.008, 1), K.metal(K.pal.m), 0, 0.012, 0.36);
      K.put(rbox(0.1, 0.08, 0.016, 0.006, 1), chrome, -0.09, 0.07, 0.37, 0, -0.6);
      K.put(rbox(0.07, 0.14, 0.016, 0.006, 1), chrome, 0.09, 0.09, 0.37, 0, -0.6);
    } else if (game === 'rhythm') {
      // four arrow pads (left, down, up, right) and a speaker either side of the coin door
      [-HALF_PI, 0, Math.PI, HALF_PI].forEach((turn, i) => {
        const x = -0.3 + i * 0.2;
        deck(rbox(0.17, 0.02, 0.16, 0.01, 1), ink, x, 0.012, 0);
        deck(cyl(0.055, 0.014, 0.055, 3).rotateY(turn), K.gloss(NEON[i]), x, 0.028, 0);
      });
      for (const sg of [-1, 1]) {
        K.put(disc(L, 0.08, 0.012, 14), chrome, sg * 0.27, u(26), 0.23);
        K.put(disc(L, 0.066, 0.014, 14), ink, sg * 0.27, u(26), 0.234);
        K.put(ball(0.024, 8, 6), K.gloss(tone(col, 0.5)), sg * 0.27, u(26), 0.24);
      }
    } else if (game === 'fighter') {
      stick(X(8), -0.05);
      [['#e04848', '#f8d030', '#58b8f8'], ['#58d858', '#f8f8f8', '#f858c8']].forEach((row, r) => row.forEach((c, i) => button(X(16 + i * 5), r ? 0.05 : -0.045, c, 0.026)));
    } else if (game === 'puzzle') {
      stick(X(9), -0.05);
      button(X(19), 0.03, '#f8d030', 0.034);
      button(X(25), 0.0, '#58b8f8', 0.034);
      button(X(14), -0.09, '#f8f8f8', 0.016);
    } else if (game === 'maze') {
      stick(X(10), -0.05, '#e04848');
      button(X(22), 0.02, '#58d858', 0.032);
      button(X(26), -0.07, '#f8f8f8', 0.016);
    } else {
      stick(X(9), -0.05);
      for (const [x, c] of [[X(17), '#f8d030'], [X(21), '#58b8f8'], [X(25), '#58d858']]) button(x, 0.03, c);
    }
  },

  prizecounter(K, s, W, D, L) {
    const { rbox, ball, blob, cyl, tone } = L, col = K.pal.c, frame = K.gloss(col), d = 0.66, x = (n) => X(n, 2);
    // the counter: a plinth, posts at its ends, a top rail and a back, the glass front, a wooden top over it all
    K.put(rbox(u(62), u(8), d, 0.02, 1), frame, 0, u(4), 0);
    K.put(rbox(u(62), u(4), d, 0.015, 1), frame, 0, u(32), 0);
    for (const sg of [-1, 1]) K.put(rbox(u(3), u(22), d, 0.012, 1), frame, sg * x(61.5), u(19), 0);
    K.put(rbox(u(56), u(22), 0.03, 0.01, 1), K.gloss(K.pal.p), 0, u(19), -d / 2 + 0.03);
    K.put(new L.THREE.PlaneGeometry(u(56), u(22)), K.glass(), 0, u(19), d / 2 - 0.012);
    K.put(rbox(2, u(3), d + 0.06, 0.015, 1), K.wood(), 0, u(35.5), 0);
    // inside: a velvet step in front, gift boxes behind it
    K.put(rbox(u(56), 0.09, 0.3, 0.01, 1), K.gloss(tone(col, 0.6)), 0, u(8) + 0.045, 0.08);
    [-0.6, -0.15, 0.3, 0.7].forEach((gx, i) => {
      const h = 0.16 + (i % 2) * 0.06, y = u(8) + h / 2;
      K.put(rbox(0.18, h, 0.16, 0.01, 1), K.gloss(RAINBOW[(i * 2 + 4) % 7]), gx, y, -0.17);
      K.put(rbox(0.185, h + 0.004, 0.03, 0.004, 1), K.gloss('#f8f8f8'), gx, y, -0.17);
      K.put(rbox(0.03, h + 0.004, 0.165, 0.004, 1), K.gloss('#f8f8f8'), gx, y, -0.17);
    });
    // the prizes on the step: a Poké Ball, a pink plush, a row of wrapped sweets, a yellow plush with its ears
    const by = u(8) + 0.09;
    pokeBall(K, L, x(12), by + u(4), 0.1, u(4));
    K.put(ball(u(4), 14, 10), K.gloss('#f8a8c8'), x(23), by + u(4), 0.1);
    for (const sg of [-1, 1]) K.put(ball(0.014, 6, 4), K.gloss(INK), x(23) + sg * 0.04, by + u(4.6), 0.215);
    for (let n = 0; n < 5; n++) {
      const cx = x(32 + n * 4), cy = by + u(1.6), m = K.gloss(RAINBOW[n]);
      K.put(ball(u(1.5), 8, 6), m, cx, cy, 0.14);
      for (const sg of [-1, 1]) K.put(cyl(0, 0.03, 0.022, 6).rotateZ(sg * HALF_PI), m, cx + sg * 0.06, cy, 0.14);
    }
    K.put(ball(u(4), 14, 10), K.gloss('#f8d030'), x(54), by + u(4), 0.1);
    for (const sg of [-1, 1]) K.put(cyl(0.004, 0.11, 0.03, 8).rotateZ(-sg * 0.45), K.gloss('#f8d030'), x(54) + sg * 0.07, by + u(8) + 0.02, 0.1);
    // the teddy bear on top
    const fur = K.plain('#c8945a'), muzzle = K.plain('#e0b888'), bx = x(14), ty = u(37);
    K.put(blob(0.3, 0.26, 0.24, 0.8, 0.8), fur, bx, ty + 0.13, 0);
    K.put(ball(0.125, 14, 10), fur, bx, ty + 0.36, 0.01);
    for (const sg of [-1, 1]) {
      K.put(ball(0.05, 10, 8), fur, bx + sg * 0.11, ty + 0.46, 0);
      K.put(ball(0.045, 10, 8).scale(1.2, 0.8, 1), fur, bx + sg * 0.15, ty + 0.17, 0.06);
      K.put(ball(0.05, 10, 8).scale(1.1, 0.8, 1.2), fur, bx + sg * 0.09, ty + 0.04, 0.1);
      K.put(ball(0.016, 6, 4), K.gloss(INK), bx + sg * 0.045, ty + 0.4, 0.118);
    }
    K.put(ball(0.05, 10, 8).scale(1.1, 0.8, 0.8), muzzle, bx, ty + 0.33, 0.115);
    K.put(ball(0.018, 6, 4), K.gloss(INK), bx, ty + 0.35, 0.155);
    // the prize sign standing at the back: a red ticket, notched and perforated, on a cream board
    const sx = x(48), sy = u(47.5), sz = -0.12, board = K.gloss(MARQUEE);
    K.put(rbox(u(24), u(17), 0.04, 0.015, 1), board, sx, sy, sz);
    for (const sg of [-1, 1]) K.put(rbox(0.05, 0.07, 0.14, 0.01, 1), frame, sx + sg * 0.3, ty + 0.035, sz);
    K.put(rbox(u(18), u(9), 0.012, 0.006, 1), K.gloss('#f86060'), sx, sy, sz + 0.024);
    for (const sg of [-1, 1]) K.put(disc(L, u(1.5), 0.016, 10), board, sx + sg * u(9), sy, sz + 0.026);
    for (let n = 0; n < 4; n++) K.put(new L.THREE.PlaneGeometry(0.02, 0.03), K.plain('#ffffff'), x(45.5), sy + u(3) - n * u(2), sz + 0.031);
  },

  tokenmachine(K, s, W, D, L) {
    const { rbox, tone } = L, ink = K.gloss(INK), chrome = K.metal(CHROME), gold = K.metal(GOLD);
    // a metal body between two pillars in the theme's colour, on a dark plinth
    K.put(rbox(u(18), u(80) - 0.06, 0.46, 0.02, 1), K.metal(K.pal.m), 0, u(40) + 0.03, -0.01);
    for (const n of [5.5, 26.5]) K.put(rbox(u(3), u(80), 0.5, 0.02, 1), K.gloss(K.pal.c), X(n), u(40), 0);
    K.put(rbox(u(18), 0.06, 0.48, 0.01, 1), K.gloss(tone(K.pal.m, 0.5)), 0, 0.03, 0);
    // the header with its gold token
    K.put(rbox(u(18), u(8), 0.06, 0.015, 1), K.gloss(K.pal.c), 0, u(74), 0.24);
    K.put(disc(L, u(3), 0.02, 16), gold, 0, u(74), 0.276);
    K.put(disc(L, u(2), 0.026, 16), gold, 0, u(74), 0.276);
    // the count display: js/base-play.js's live screen lands on its digits
    K.put(rbox(u(17), u(9), 0.02, 0.006, 1), ink, 0, u(62), 0.224);
    K.put(...plate(K, L, [8, 58, 24, 66], 0.7), 0, u(62), 0.236);
    // a note slot, a coin slot, the red button
    K.put(rbox(u(15), u(3), 0.03, 0.008, 1), chrome, 0, u(53), 0.23);
    K.put(rbox(u(12), 0.014, 0.01, 0.003, 1), ink, 0, u(53), 0.246);
    K.put(rbox(u(4), u(7), 0.03, 0.008, 1), chrome, X(21), u(45.5), 0.23);
    K.put(rbox(0.014, u(4), 0.01, 0.003, 1), ink, X(21), u(45.5), 0.246);
    K.put(disc(L, u(2.8), 0.02, 12), ink, X(12), u(46), 0.228);
    K.put(disc(L, u(2), 0.03, 12), K.gloss('#e04848'), X(12), u(46), 0.236);
    // the token tray: a dark mouth under a chrome hood, a chrome cup with tokens in it
    K.put(rbox(u(16), u(8), 0.02, 0.006, 1), ink, 0, u(22), 0.226);
    K.put(rbox(u(17), 0.03, 0.08, 0.01, 1), chrome, 0, u(26) + 0.015, 0.25);
    K.put(rbox(u(17), 0.05, 0.12, 0.012, 1), chrome, 0, u(18), 0.26);
    for (let n = 0; n < 5; n++) K.put(coin(L), gold, X(11 + n * 2.5), u(18) + 0.031, 0.27 + (n % 2) * 0.02, 0, 0.12 * (n % 3 - 1));
  },

  photobooth(K, s, W, D, L) {
    const { THREE, rbox, cyl, tone } = L, metal = K.gloss(K.pal.m), d = 0.8, z = d / 2;
    // the booth: a thin left wall, the machine's column on the right, a back, a step, the roof with its lit sign
    K.put(rbox(u(4), u(92), d, 0.015, 1), metal, X(3), u(46), 0);
    K.put(rbox(u(6), u(92), d, 0.015, 1), metal, X(28), u(46), 0);
    K.put(rbox(u(20), u(78), 0.04, 0.01, 1), K.gloss(tone(K.pal.m, 0.55)), X(15), u(39), -z + 0.03);
    K.put(rbox(u(30), u(5), d, 0.012, 1), K.gloss(tone(K.pal.m, 0.75)), 0, u(2.5), 0);
    K.put(rbox(u(30), u(14), d, 0.015, 1), metal, 0, u(85), 0);
    K.put(...plate(K, L, [3, 81, 29, 90], 0.75), 0, u(85.5), z + 0.003);
    K.put(rbox(u(28), 0.02, 0.04, 0.006, 1), K.metal(CHROME), 0, u(80.6), z);
    // the curtain, pleated, on its rail; someone's shoes under it
    const w = u(20), n = 6, a = 0.018, t = 0.008, pts = [];
    for (let i = 0; i <= n * 4; i++) pts.push([-w / 2 + i / (n * 4) * w, Math.sin(i / 4 * Math.PI * 2) * a]);
    const shape = new THREE.Shape([...pts.map(([x, y]) => new THREE.Vector2(x, y + t / 2)), ...pts.reverse().map(([x, y]) => new THREE.Vector2(x, y - t / 2))]);
    const curtain = new THREE.ExtrudeGeometry(shape, { depth: u(66), bevelEnabled: false }).rotateX(-HALF_PI);
    K.put(curtain, K.cloth(K.pal.c), X(15), u(10), 0.33);
    K.put(cyl(0.012, u(22), 0.012, 8).rotateZ(HALF_PI), K.metal(CHROME), X(15), u(77), 0.33);
    for (const n of [12, 19]) K.put(rbox(u(4) + 0.02, u(3), 0.16, 0.025, 1), K.gloss(INK), X(n), u(6.5), 0.3);
    // the photo slot in the column, a strip of photos hanging out of it
    K.put(rbox(u(3), u(10), 0.02, 0.006, 1), K.metal(CHROME), X(28), u(39), z);
    K.put(rbox(0.012, u(9), 0.01, 0.003, 1), K.gloss(INK), X(28), u(39), z + 0.01);
    K.put(rbox(u(3), u(12), 0.006, 0.002, 1), K.plain('#ffffff'), X(29.5), u(32), z + 0.016);
    for (let i = 0; i < 3; i++) K.put(new THREE.PlaneGeometry(u(1.6), u(2.4)), K.plain('#a8c8e8'), X(29.5), u(36 - i * 4), z + 0.02);
  },

  coinpusher(K, s, W, D, L) {
    const { THREE, rbox, tone } = L, col = K.pal.c, body = K.gloss(col), chrome = K.metal(CHROME), gold = K.metal(GOLD), ink = K.gloss(INK), d = 0.7, z = d / 2, R = K.r;
    // the base with its payout tray, a coin slot over it
    K.put(rbox(u(30), u(36), d, 0.02, 1), body, 0, u(18), 0);
    K.put(rbox(u(20), u(8), 0.02, 0.006, 1), ink, 0, u(12), z);
    K.put(rbox(u(21), 0.025, 0.06, 0.008, 1), chrome, 0, u(16) + 0.012, z + 0.02);
    K.put(rbox(u(21), 0.05, 0.1, 0.012, 1), chrome, 0, u(8), z + 0.04);
    for (let n = 0; n < 6; n++) K.put(coin(L), gold, X(9 + n * 3), u(8) + 0.031, z + 0.04, 0, 0.15 * (n % 3 - 1));
    K.put(rbox(u(4), u(6), 0.02, 0.006, 1), chrome, 0, u(26), z);
    K.put(rbox(0.012, u(4), 0.01, 0.003, 1), ink, 0, u(26), z + 0.012);
    // the glass case: posts at its corners, a dark back, glass all round
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rbox(u(2), u(44), 0.05, 0.01, 1), body, sx * X(30), u(58), sz * (z - 0.03));
    K.put(rbox(u(26), u(44), 0.03, 0.006, 1), K.gloss(tone(col, 0.45)), 0, u(58), -z + 0.04);
    K.put(new THREE.PlaneGeometry(u(26), u(44)), K.glass(), 0, u(58), z - 0.02);
    for (const sx of [-1, 1]) K.put(new THREE.PlaneGeometry(d - 0.1, u(44)), K.glass(), sx * X(29.5), u(58), 0, sx * HALF_PI);
    // two tiers, the upper set back, each with its pusher and a field of coins; two coins dropping off the edges
    for (const [j, z0, z1] of [[41, -0.3, 0.3], [59, -0.3, 0.12]]) {
      const y = u(j + 3), dz = z1 - z0;
      K.put(rbox(u(24), u(3), dz, 0.008, 1), K.metal(K.pal.m), 0, u(j + 1.5), (z0 + z1) / 2);
      K.put(rbox(u(24), 0.08, 0.1, 0.01, 1), chrome, 0, y + 0.04, z0 + 0.06);
      for (let n = 0; n < 20; n++) {
        const cx = -0.34 + R() * 0.68, cz = z0 + 0.13 + R() * (dz - 0.15), layer = n % 4 === 0 ? 0.012 : 0;
        K.put(coin(L), gold, cx, y + 0.006 + layer, cz, R() * 3, (R() - 0.5) * 0.2);
      }
      for (let n = 0; n < 10; n++) K.put(coin(L), gold, X(5 + n * 2.4), y + 0.006 + (n % 3) * 0.012, z1 - 0.03, 0, 0.3 * (n % 2));
      K.put(coin(L).rotateX(HALF_PI), gold, X(27), u(j - 1), z1 - 0.02);
    }
    // the top with its lit marquee, a light along its underside
    K.put(rbox(u(30), u(10), d, 0.02, 1), body, 0, u(85), 0);
    K.put(...plate(K, L, [4, 83, 28, 87], 0.75), 0, u(85), z + 0.003);
    K.put(rbox(u(24), 0.015, 0.06, 0.006, 1), K.glow(MARQUEE), 0, u(80) - 0.012, z - 0.12);
  },

  capsuletoy(K, s, W, D, L) {
    const { THREE, rbox, ball, tone } = L, col = K.pal.c, chrome = K.metal(CHROME), ink = K.gloss(INK), R = K.r;
    const half = (r, c, x, y, z, turn) => {
      K.put(new THREE.SphereGeometry(r, 8, 3, 0, Math.PI * 2, 0, HALF_PI), K.gloss(c), x, y, z, 0, 0, turn);
      K.put(new THREE.SphereGeometry(r, 8, 3, 0, Math.PI * 2, HALF_PI, HALF_PI), K.gloss('#ffffff'), x, y, z, 0, 0, turn);
    };
    // two machines, one on the other: a body, a clear bubble of capsules, the crank and the chute
    for (const m of [0, 1]) {
      const j0 = m * 44, face = 0.275;
      K.put(rbox(u(26), u(44) - 0.01, 0.55, 0.02, 1), K.gloss(m ? tone(col, 1.15) : col), 0, u(j0 + 22), 0);
      K.put(rbox(u(24), u(24), 0.012, 0.006, 1), chrome, 0, u(j0 + 31), face);
      K.put(new THREE.PlaneGeometry(u(22), u(22)), K.gloss(PALE), 0, u(j0 + 31), face + 0.008);
      K.put(rbox(u(22), u(22), 0.16, 0.05, 2), K.glass(), 0, u(j0 + 31), face + 0.075);
      for (let n = 0; n < 12; n++) {
        const back = n >= 8, c = n % 4, r = Math.floor(n / 4) % 2;
        const x = X(8 + c * 5 + (back ? 2.5 : 0)), y = u(j0 + 25 + r * 5 + (back ? 9 : 0)), z = face + (back ? 0.07 : 0.1);
        if (back && c === 3) continue;
        half(u(2), RAINBOW[(n + m * 3) % 7], x, y, z, (R() - 0.5) * 0.8);
      }
      K.put(disc(L, u(3), 0.03, 14), chrome, X(12), u(j0 + 12), face + 0.015);
      K.put(rbox(u(5) + 0.03, 0.03, 0.03, 0.01, 1), ink, X(12), u(j0 + 12), face + 0.04);
      K.put(ball(0.022, 8, 6), ink, X(12) + 0.08, u(j0 + 12), face + 0.065);
      K.put(rbox(u(6), u(6), 0.02, 0.006, 1), ink, X(23), u(j0 + 13), face + 0.005);
      K.put(rbox(u(6), u(3), 0.012, 0.004, 1), chrome, X(23), u(j0 + 14.5), face + 0.02, 0, 0.4);
    }
    K.put(rbox(u(27), 0.03, 0.57, 0.01, 1), chrome, 0, u(44), 0);
  },

  ticketmachine(K, s, W, D, L) {
    const { rbox, tone } = L, ink = K.gloss(INK), chrome = K.metal(CHROME), z = 0.25;
    // the kiosk, its header band with a label, the route map screen under a visor
    K.put(rbox(u(26), u(82) - 0.05, 0.5, 0.025, 1), K.gloss(K.pal.c), 0, u(41) + 0.025, 0);
    K.put(rbox(u(26) + 0.01, 0.05, 0.52, 0.01, 1), K.gloss(tone(K.pal.c, 0.5)), 0, 0.025, 0);
    K.put(rbox(u(22), u(6), 0.04, 0.012, 1), K.metal(K.pal.m), 0, u(77), z);
    K.put(rbox(u(8), u(4), 0.01, 0.003, 1), K.plain(TICKET), 0, u(77), z + 0.022);
    K.put(rbox(u(21), u(17), 0.02, 0.006, 1), ink, 0, u(62), z);
    K.put(...plate(K, L, [6, 54, 26, 70], 0.7), 0, u(62), z + 0.012);
    K.put(rbox(u(22), 0.025, 0.08, 0.01, 1), K.metal(K.pal.m), 0, u(71) + 0.012, z + 0.04);
    // the keypad, the card slot, the coin slot
    K.put(rbox(u(13), u(13), 0.012, 0.004, 1), K.gloss(tone(K.pal.c, 0.7)), X(12.5), u(44.5), z);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) K.put(rbox(u(3), u(3), 0.025, 0.008, 1), chrome, X(8.5 + c * 4), u(48.5 - r * 4), z + 0.01);
    K.put(rbox(u(4), u(8), 0.025, 0.008, 1), chrome, X(23), u(47), z + 0.005);
    K.put(rbox(0.012, u(6), 0.01, 0.003, 1), ink, X(23), u(47), z + 0.019);
    K.put(rbox(u(7), u(3), 0.02, 0.006, 1), chrome, X(23), u(39.5), z + 0.004);
    K.put(rbox(u(5), 0.012, 0.01, 0.003, 1), ink, X(23), u(39.5), z + 0.015);
    // the ticket mouth, a ticket coming out of it
    K.put(rbox(u(16), u(6), 0.02, 0.006, 1), ink, 0, u(27), z);
    K.put(rbox(u(17), 0.02, 0.06, 0.006, 1), chrome, 0, u(24), z + 0.025);
    K.put(rbox(u(8), u(4), 0.006, 0.002, 1), K.plain(TICKET), 0, u(27.5), z + 0.03, 0, 0.35);
  },

  newsstand(K, s, W, D, L) {
    const { THREE, rbox, tone } = L, wood = K.wood();
    // the wooden stand, a board up the back for the awning
    K.put(rbox(u(28), u(60), 0.42, 0.02, 1), wood, 0, u(30), -0.04);
    K.put(rbox(u(28), 0.24, 0.03, 0.01, 1), wood, 0, u(60) + 0.1, -0.235);
    // three racks: a ledge and a lip, three magazines (newspapers on the bottom one) leaning back on each
    for (let r = 0; r < 3; r++) {
      const jt = 54 - r * 16;
      K.put(rbox(u(24), 0.02, 0.14, 0.006, 1), wood, 0, u(jt - 12.5), 0.24);
      K.put(rbox(u(24), u(2), 0.03, 0.008, 1), wood, 0, u(jt - 13), 0.3);
      for (let n = 0; n < 3; n++) {
        const paper = r === 2, c = paper ? '#f0f0e8' : RAINBOW[(r * 3 + n) % 7], mx = X(8.5 + n * 8), my = u(jt - 6);
        const lean = (geo, m, up) => { geo.translate(0, up, 0.009); K.put(geo, m, mx, my, 0.235, 0, -0.2); };
        K.put(rbox(u(7), u(12), 0.016, 0.004, 1), K.gloss(c), mx, my, 0.235, 0, -0.2);
        lean(new THREE.PlaneGeometry(u(5), u(1.4)), K.plain(paper ? INK : '#ffffff'), u(3.5));
        for (let l = 0; l < 3; l++) lean(new THREE.PlaneGeometry(u(5), u(0.8)), K.plain(paper ? '#a8a8a0' : tone(c, 0.8)), u(0.5 - l * 2));
      }
    }
    // the striped awning on two brackets, its valance scalloped
    const sw = u(30) / 8, slope = 0.177, a = (i) => (i % 2 ? K.plain(K.pal.c) : K.plain('#ffffff'));
    for (let i = 0; i < 8; i++) {
      const x = -u(15) + sw * (i + 0.5);
      K.put(rbox(sw, 0.014, 0.69, 0.004, 1), a(i), x, 2.04, 0.09, 0, slope);
      K.put(rbox(sw, 0.08, 0.012, 0.004, 1), a(i), x, 1.95, 0.42);
      K.put(disc(L, sw / 2, 0.012, 8), a(i), x, 1.91, 0.42);
    }
    for (const sg of [-1, 1]) rod(K, L, K.metal(K.pal.m), [sg * u(13), u(60) - 0.02, 0.1], [sg * u(13), 1.97, 0.4], 0.01);
  },
};
