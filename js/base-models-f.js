/* base-models-f.js  -  Hot Spring, Arcade and Greenhouse pieces, modelled from parts like the arcade
   cabinets (the user's ask, 2026-10-12: "I want my furniture as clean as these cabinets"; a table tennis table, a milk
   cooler and a potting bench looked nothing like themselves, carved from their paintings).

   How a batch works (js/base-models-a.js to -k.js, one per run of shelves):
   - `SHAPES` maps a line of kind ids ('a b c') to a shape `{ make, ...options }`, read by js/base-shapes.js. A kind with
     a shape is built by its `make` instead of being carved from its painting. `seat` (the height in tiles a Pokémon sits
     at) and `top` (the height of a top small pieces can stand on) matter to the room's rules; leave them out otherwise.
   - `MAKES` holds the builders: `make(K, s, W, D, L)`, the piece W x D tiles, its feet at y 0, its middle at x, z 0, its
     front facing +z, sizes in tiles. `K.put(geometry, material, x, y, z, turnY, tiltX, tiltZ)` places a part (parts
     sharing a material are merged). Materials come in the piece's theme: `K.wood()`, `K.cloth()`, `K.metal()` default to
     the palette (`K.pal`: w wood, c colour, a accent, p pale, m metal, g glow, leaf, pot), and `K.wood(hex)`,
     `K.cloth(hex)`, `K.plain(hex)`, `K.gloss(hex)`, `K.metal(hex)`, `K.glow(hex)` (lit, switched by a lamp's tap) and
     `K.glass()` take a colour. `K.pic(canvas)` wears a picture; `L.litPic(canvas, k)` a lit one (a screen), `L.decal(c)`
     a cut-out sticker. `L` is js/base-mesh.js's kit: `L.THREE`, `rbox(w, h, d, r)` (a rounded box), `blob(w, h, d, e,
     ev)` (a cushion-like superellipsoid), `cyl(rTop, h, rBottom, seg)`, `ball(r)`, `lathe([[r, y]...])`, `torus(R, r,
     arc)`, `heart`, `profileSlab([[z, y]...], t, x0)` (a side profile extruded across x), `tone(hex, f)` (darker under 1,
     lighter over), `mix(a, b, f)`, `leg`, `legsAt`, `pot(K, r, h)`, `leafAt(K, m, y, a, tilt, len, wid)`, `canvasTex`,
     `rng`. `K.r()` is the piece's own seeded random.
   - Palette colours keep every theme and reskin working: use them for what the painting paints in them. */

/** A canvas `w` x `h`, drawn by `draw(g)`; its materials are cached on it. */
const sheet = (w, h, draw) => { const c = new OffscreenCanvas(w, h); draw(c.getContext('2d'), w, h); return c; };
const pics = {};
const once = (key, make) => pics[key] || (pics[key] = make());

/* the milk cooler's header: a milk bottle and MILK on the theme's colour */
const milkSign = (col) => once('milk' + col, () => sheet(256, 72, (g, w, h) => {
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, w, 10);
  g.fillStyle = '#ffffff';
  g.beginPath(); g.roundRect(30, 18, 22, 44, 6); g.fill(); g.fillRect(36, 10, 10, 10);
  g.fillStyle = col; g.fillRect(34, 30, 14, 4);
  g.font = 'bold 40px system-ui, sans-serif'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff';
  g.fillText('MILK', 70, h / 2 + 2);
}));

/* the table tennis top: green, white edges and a centre line */
const tennisTop = () => once('tt', () => sheet(512, 256, (g, w, h) => {
  g.fillStyle = '#2f7d5e'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#f6f6f2'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.lineWidth = 4; g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
}));
const netMesh = () => once('net', () => sheet(256, 32, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = 'rgba(30,30,36,0.9)'; g.lineWidth = 1.2;
  for (let x = 0; x <= w; x += 6) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, h); g.stroke(); }
  for (let y = 6; y <= h; y += 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 6);
}));

/** A milk bottle on a shelf: milk, a glass shoulder, a cap. */
function bottle(K, L, x, y, z, milk, cap) {
  K.put(L.lathe([[0.03, 0], [0.034, 0.01], [0.034, 0.09], [0.022, 0.12], [0.016, 0.135], [0, 0.135]], 14), K.gloss(milk), x, y, z);
  K.put(L.cyl(0.018, 0.014, 0.018, 12), K.gloss(cap), x, y + 0.14, z);
}

export const SHAPES = {
  milkfridge: { make: 'milkcooler' },
  pingpong: { make: 'pingpong' },
  pottingbench: { make: 'pottingbench' },
};

export const MAKES = {
  milkcooler(K, s, W, D, L) {
    const { THREE, rbox } = L;
    const body = K.gloss(K.pal.p), trim = K.metal('#c8ccd8'), col = K.pal.c;
    const w = 0.84, d = 0.7, h = 2.04, f = d / 2, t = 0.06;
    // the cabinet: sides, back, a coloured header with its sign, a dark plinth with vents
    for (const sg of [-1, 1]) K.put(rbox(t, h - 0.1, d, 0.025), body, sg * (w / 2 - t / 2), 0.1 + (h - 0.1) / 2, 0);
    K.put(rbox(w, h - 0.1, 0.04, 0.015), body, 0, 0.1 + (h - 0.1) / 2, -f + 0.02);
    K.put(rbox(w, 0.1, d, 0.03), K.gloss('#2a2a32'), 0, 0.05, 0);
    for (let i = 0; i < 7; i++) K.put(rbox(0.07, 0.03, 0.01, 0.006), K.plain('#101014'), -0.27 + i * 0.09, 0.05, f + 0.002);
    K.put(rbox(w, 0.3, d, 0.03), K.gloss(col), 0, h - 0.15, 0);
    K.put(new THREE.PlaneGeometry(w - 0.1, 0.24), L.litPic(milkSign(col), 0.35), 0, h - 0.15, f + 0.004);
    K.put(rbox(w - 2 * t, 0.06, d - 0.06, 0.01), body, 0, 0.13, 0.01);
    // inside: a pale lit lining, three wire shelves of bottles (milk, chocolate, strawberry)
    const inTop = h - 0.3, inBot = 0.16;
    K.put(new THREE.PlaneGeometry(w - 2 * t, inTop - inBot), K.glow('#e8f6ff'), 0, (inTop + inBot) / 2, -f + 0.045);
    const rows = [['#fbfbf6', '#3a8ae0'], ['#c8946a', '#7a4a2a'], ['#f8b8cc', '#e05888']];
    rows.forEach(([milk, cap], r) => {
      const y = inBot + 0.06 + r * 0.5;
      K.put(rbox(w - 2 * t - 0.01, 0.015, d - 0.14, 0.005), trim, 0, y, -0.02);
      for (let n = 0; n < 5; n++) for (const z of [-0.15, 0.03]) bottle(K, L, -0.28 + n * 0.14, y + 0.008, z, milk, cap);
    });
    // the glass door, hinged on its left, a chrome handle on its right
    const door = K.door([-w / 2 + t / 2, f + 0.02], 1), fw = w - 0.02, fh = inTop - inBot + 0.04, fy = (inTop + inBot) / 2, rail = 0.05, frame = K.gloss(L.tone(K.pal.m, 1.1));
    for (const sg of [-1, 1]) {
      door(rbox(rail, fh, 0.04, 0.012), frame, sg * (fw / 2 - rail / 2), fy, f + 0.02);
      door(rbox(fw, rail, 0.04, 0.012), frame, 0, fy + sg * (fh / 2 - rail / 2), f + 0.02);
    }
    door(new THREE.PlaneGeometry(fw - rail * 2, fh - rail * 2), K.glass(), 0, fy, f + 0.02);
    door(rbox(0.025, 0.5, 0.03, 0.01), trim, fw / 2 - 0.09, fy, f + 0.06);
    for (const sg of [-1, 1]) door(rbox(0.02, 0.02, 0.04, 0.006), trim, fw / 2 - 0.09, fy + sg * 0.22, f + 0.045);
    K.inside = { x: 0, y: fy, w: fw - rail * 2, h: fh - rail * 2, z: f - 0.02, bare: true };
  },

  pingpong(K, s, W, D, L) {
    const { THREE, rbox, cyl } = L;
    const metal = K.metal(K.pal.m), dark = K.gloss('#22262c'), top = 0.76, tw = W - 0.1, td = D - 0.06;
    // the top: green, white lines, a dark edge band under it
    const board = rbox(tw, 0.035, td, 0.008);
    board.translate(0, top - 0.0175, 0);
    K.put(board, dark);
    const face = new THREE.PlaneGeometry(tw - 0.006, td - 0.006).rotateX(-Math.PI / 2);
    face.translate(0, top + 0.0005, 0);
    K.put(face, K.pic(tennisTop()));
    // the undercarriage: two folding frames of legs on castors, an apron, a cross brace
    for (const sx of [-1, 1]) {
      const x = sx * tw * 0.3;
      K.put(rbox(0.05, 0.05, td - 0.18, 0.012), metal, x, top - 0.07, 0);
      for (const sz of [-1, 1]) {
        const z = sz * (td / 2 - 0.12);
        K.put(rbox(0.045, top - 0.12, 0.045, 0.012), metal, x, (top - 0.12) / 2 + 0.04, z);
        K.put(cyl(0.035, 0.03, 0.035, 14).rotateX(Math.PI / 2), dark, x, 0.035, z);
      }
      K.put(rbox(0.035, 0.035, td - 0.26, 0.01), metal, x, 0.22, 0);
    }
    K.put(rbox(tw * 0.6, 0.035, 0.035, 0.01), metal, 0, 0.3, 0);
    // the net across the middle on its two posts
    const netH = 0.15;
    for (const sz of [-1, 1]) {
      K.put(rbox(0.025, netH + 0.03, 0.025, 0.008), metal, 0, top + netH / 2 - 0.01, sz * (td / 2 + 0.03));
      K.put(rbox(0.05, 0.03, 0.06, 0.008), metal, 0, top - 0.015, sz * (td / 2 + 0.01));
    }
    for (const turn of [Math.PI / 2, -Math.PI / 2]) K.put(new THREE.PlaneGeometry(td + 0.06, netH), L.decal(netMesh()), 0, top + netH / 2, 0, turn);
    // two bats and a ball lying on the table
    const bat = (x, z, turn, col) => {
      K.put(cyl(0.075, 0.012, 0.075, 24).scale(1, 1, 1.1), K.gloss(col), x, top + 0.008, z);
      K.put(rbox(0.03, 0.02, 0.1, 0.008).translate(0, 0, 0.11).rotateY(turn), K.wood('#c89a60'), x, top + 0.012, z);
    };
    bat(-tw * 0.3, 0.05, 0.6, K.pal.c);
    bat(tw * 0.26, -0.1, -2.4, '#2a2a30');
    K.put(L.ball(0.02, 14, 10), K.gloss('#fff6e8'), tw * 0.12, top + 0.02, 0.18);
  },

  pottingbench(K, s, W, D, L) {
    const { rbox, cyl, lathe, pot, leafAt } = L;
    const wood = K.wood(), metal = K.metal(K.pal.m), terra = K.gloss(K.pal.pot), soil = K.plain('#4a3020');
    const top = 0.88, bw = W - 0.12, bd = D - 0.2, back = -bd / 2 + 0.04;
    // four legs, the two back ones running up to carry a shelf over the work top
    for (const sx of [-1, 1]) {
      K.put(rbox(0.07, top, 0.07, 0.015), wood, sx * (bw / 2 - 0.04), top / 2, bd / 2 - 0.04);
      K.put(rbox(0.07, 1.72, 0.07, 0.015), wood, sx * (bw / 2 - 0.04), 0.86, back);
    }
    // the slatted work top and its front rail, a slatted shelf near the floor
    for (let i = 0; i < 5; i++) K.put(rbox(bw, 0.045, bd / 5 - 0.012, 0.01), wood, 0, top - 0.022, -bd / 2 + (i + 0.5) * bd / 5);
    K.put(rbox(bw - 0.1, 0.09, 0.03, 0.01), wood, 0, top - 0.09, bd / 2 - 0.02);
    for (let i = 0; i < 4; i++) K.put(rbox(bw - 0.06, 0.03, bd / 4 - 0.02, 0.008), wood, 0, 0.18, -bd / 2 + (i + 0.5) * bd / 4);
    // the back board between the top and the shelf, a high shelf, a rail of hanging tools
    K.put(rbox(bw - 0.08, 0.62, 0.025, 0.008), K.wood(L.tone(K.pal.w, 1.15)), 0, top + 0.36, back - 0.01);
    K.put(rbox(bw, 0.04, 0.26, 0.01), wood, 0, 1.54, back + 0.1);
    K.put(rbox(bw - 0.1, 0.06, 0.03, 0.01), wood, 0, 1.5, back + 0.21);
    K.put(cyl(0.012, bw - 0.16, 0.012, 8).rotateZ(Math.PI / 2), metal, 0, 1.3, back + 0.03);
    const hang = (x, head) => {
      K.put(cyl(0.012, 0.22, 0.012, 8), K.wood('#c89a60'), x, 1.17, back + 0.05);
      head(x, 1.03, back + 0.05);
    };
    hang(-0.5, (x, y, z) => K.put(L.blob(0.08, 0.13, 0.016, 0.7, 0.6), metal, x, y - 0.02, z));
    hang(-0.3, (x, y, z) => { K.put(rbox(0.09, 0.02, 0.016, 0.005), metal, x, y + 0.03, z); for (const dx of [-0.035, 0, 0.035]) K.put(rbox(0.012, 0.1, 0.012, 0.004), metal, x + dx, y - 0.03, z); });
    hang(-0.1, (x, y, z) => K.put(L.blob(0.07, 0.11, 0.016, 0.9, 0.6), metal, x, y - 0.01, z));
    // on the high shelf a row of little pots; on the top a potted plant, a sack of soil, a seed packet, a trowel
    for (let n = 0; n < 4; n++) {
      const x = 0.15 + n * 0.17;
      K.put(lathe([[0.045, 0], [0.06, 0.09], [0.064, 0.1], [0.064, 0.115], [0, 0.115]], 18), terra, x, 1.56, back + 0.1);
      K.put(L.blob(0.07, 0.06, 0.07, 0.8, 0.8), K.gloss(K.pal.leaf), x, 1.69, back + 0.1);
    }
    const plantAt = (x, z) => {
      K.put(lathe([[0.09, 0], [0.12, 0.17], [0.13, 0.18], [0.13, 0.21], [0.115, 0.21], [0.11, 0.19], [0, 0.19]], 24), terra, x, top, z);
      K.put(cyl(0.11, 0.015, 0.11, 20), soil, x, top + 0.19, z);
      const leaf = K.gloss(K.pal.leaf);
      for (let i = 0; i < 7; i++) {
        const g = L.ball(1, 10, 8).scale(0.035, 0.008, 0.08);
        g.translate(0, 0, 0.08); g.rotateX(-(Math.PI / 2 - 0.7 - (i % 2) * 0.3)); g.rotateY(i / 7 * Math.PI * 2);
        K.put(g, leaf, x, top + 0.2, z);
      }
      K.put(L.ball(0.03, 12, 8), K.gloss(K.pal.c), x + 0.03, top + 0.3, z + 0.02);
    };
    plantAt(0.4, 0.02);
    K.put(L.blob(0.3, 0.24, 0.18, 0.4, 0.5), K.cloth('#c8a878'), -0.45, top + 0.12, 0.0, 0.2);
    K.put(L.blob(0.24, 0.05, 0.12, 0.5, 0.4), soil, -0.45, top + 0.23, 0.0, 0.2);
    K.put(rbox(0.1, 0.012, 0.14, 0.004), K.plain('#f4f0e0'), 0.0, top + 0.006, 0.12, -0.3);
    K.put(L.ball(0.025, 10, 8), K.gloss(K.pal.c), 0.0, top + 0.015, 0.11);
    K.put(cyl(0.012, 0.12, 0.012, 8).rotateZ(Math.PI / 2), K.wood('#c89a60'), -0.1, top + 0.015, 0.18, 0.4);
    K.put(L.blob(0.1, 0.012, 0.06, 0.7, 0.6), metal, -0.2, top + 0.012, 0.22, 0.4);
    // stacked pots under the bench
    for (let n = 0; n < 3; n++) for (let k = 0; k < 2; k++)
      K.put(lathe([[0.06, 0], [0.08, 0.12], [0.086, 0.13], [0.086, 0.15], [0.074, 0.15], [0.06, 0.02], [0, 0.02]], 18), terra, -0.5 + n * 0.25, 0.2 + k * 0.06, 0.02);
  },
};
