/* hub-houses-country.js  -  two of the Secret Base's Homestead houses (docs/roadmap.md's "Secret Base houses", session C):
   the Treehouse and the Windmill Farmhouse, built from js/hub-houses.js's makeHouse() kit `k` as its own builders are,
   each returning k.doorAt()'s door at x 0. */

/** The Treehouse: a great trunk on spreading roots, its door at the foot, and up on a plank deck braced to the trunk a
    little cabin the trunk grows up through, a rope ladder down from the deck, a lantern at the rail and a round crown of
    leaves over it all. */
export function treehouse(k) {
  const { THREE, p, fine, std, add, box, cyl, tiled, lit, gable, win, porthole, many, tint, doorAt, trim } = k;
  const TZ = -0.72, DY = 1.85, CW = 2.1, CD = 1.5, CH = 0.95, CZ = -0.9;
  const bark = std({ color: p.bark, roughness: 1, flatShading: true }), barkDark = std({ color: tint(p.bark, 0.72), roughness: 1, flatShading: true });
  const planks = tiled(k.art.plank(fine), 2, { color: p.wall, roughness: 0.85 }), roof = tiled(k.art.shingle(fine), 1.8, { color: p.roof, roughness: 0.8 });
  const deck = tiled(k.art.plank(fine), 2.4, { color: tint(p.wall, 0.82), roughness: 0.9 });
  // the trunk: thick at the foot, tapering up through the deck and the cabin's roof into the crown
  cyl(0.62, 0.78, DY, bark, 0, DY / 2, TZ, 9);
  cyl(0.4, 0.58, 1.5, bark, 0, DY + 0.75, TZ - 0.05, 9);
  cyl(0.26, 0.4, 0.9, bark, 0, DY + 1.95, TZ - 0.05, 8);
  // roots spreading from the foot, and a flat of bark round the door so it sits square in the round trunk
  for (const [a, l] of [[-2.3, 0.7], [-1.0, 0.62], [0.9, 0.66], [2.4, 0.72], [3.6, 0.6]]) {
    const r = add(new THREE.ConeGeometry(0.2, l, 6), barkDark, Math.sin(a) * 0.72, 0.1, TZ + Math.cos(a) * 0.72);
    r.rotation.set(Math.cos(a) * 1.25, 0, -Math.sin(a) * 1.25);
  }
  box(0.78, 1.08, 0.16, barkDark, 0, 0.54, -0.06);
  // the deck: planks on the trunk, two braces under it, a rail round its front and sides
  box(3.3, 0.12, 2.3, deck, 0, DY, -0.85);
  for (const sx of [-1, 1]) { const b = box(0.1, 1.2, 0.1, barkDark, sx * 0.62, DY - 0.5, TZ + 0.05); b.rotation.z = -sx * 0.75; }
  const rails = [];
  for (let x = -1.55; x <= 1.56; x += 0.31) rails.push([x, DY + 0.24, 0.27]);
  for (const sx of [-1, 1]) for (let z = 0.0; z > -1.95; z -= 0.33) rails.push([sx * 1.6, DY + 0.24, z]);
  many(new THREE.BoxGeometry(0.06, 0.36, 0.06), trim, rails);
  box(3.26, 0.05, 0.07, trim, 0, DY + 0.43, 0.27, { shadow: false });
  for (const sx of [-1, 1]) box(0.07, 0.05, 2.25, trim, sx * 1.6, DY + 0.43, -0.85, { shadow: false });
  // the cabin round the trunk: plank walls, a window and a porthole, a gable roof the trunk comes up through
  const CY = DY + 0.06;
  box(CW, CH, CD, planks, 0, CY + CH / 2, CZ);
  for (const sx of [-1, 1]) box(0.07, CH, 0.07, trim, sx * CW / 2, CY + CH / 2, CZ + CD / 2, { shadow: false });
  gable(CW, CD, 0.62, 0.2, roof, planks, 0, CY + CH, CZ);
  win(-0.55, CY + 0.52, CZ + CD / 2, 0.4, 0.38, trim);
  porthole(0.5, CY + 0.55, CZ + CD / 2, 0.14, trim);
  box(0.5, 0.75, 0.04, std({ color: p.door, roughness: 0.7 }), 0.0, CY + 0.38, CZ + CD / 2 + 0.02);
  // a lantern hung from the rail's corner, lit after dark
  const lamp = lit(std({ color: '#fff0c0', emissive: new THREE.Color('#ffc860'), roughness: 0.3 }), 1.4, 0.3);
  box(0.03, 0.18, 0.03, std({ color: '#2e2e38' }), 1.45, DY + 0.36, 0.27, { shadow: false });
  box(0.12, 0.15, 0.12, lamp, 1.45, DY + 0.2, 0.27, { shadow: false });
  // the rope ladder down from the deck's right, swaying a little off true
  const rope = std({ color: '#c8a870', roughness: 1 }), RX = 1.05, RZ = 0.33;
  for (const dx of [-0.17, 0.17]) cyl(0.015, 0.015, DY, rope, RX + dx, DY / 2, RZ, 5, { shadow: false });
  const rungs = [];
  for (let y = 0.22; y < DY - 0.1; y += 0.24) rungs.push([RX, y, RZ]);
  many(new THREE.BoxGeometry(0.38, 0.035, 0.06), std({ color: '#8a5a34', roughness: 0.9 }), rungs);
  // the crown: two greens in round clumps over the cabin, never past the lot's edge
  const leafA = std({ color: p.leaf, roughness: 0.95, flatShading: true }), leafB = std({ color: p.leaf2, roughness: 0.95, flatShading: true });
  const clump = new THREE.IcosahedronGeometry(0.6, 1);
  many(clump, leafA, [[-1.15, 3.35, -1.2], [1.2, 3.3, -1.3], [0, 3.95, -1.0], [-0.55, 3.6, -1.85], [0.7, 3.75, -1.9], [0, 3.3, -2.0]]);
  many(clump.clone().scale(0.75, 0.75, 0.75), leafB, [[-0.6, 4.05, -0.6], [0.7, 4.1, -0.65], [-1.6, 3.05, -0.6], [1.62, 3.0, -0.75], [0.05, 4.2, -1.45]]);
  // a step stone at the door
  box(0.8, 0.08, 0.32, k.stone, 0, 0.04, 0.2);
  return doorAt(0.03, 0, { arch: true, colour: p.door, frameM: barkDark });
}

/** The Windmill Farmhouse: a whitewashed farmhouse under a steep gable, a hood over its door, shuttered windows with
    flower boxes and a chimney, and joined to its right a tapering windmill tower, its cap turned to the front and four
    lattice sails on their stocks; sunflowers along the wall and a cart wheel against it. */
export function windmill(k) {
  const { THREE, p, fine, std, add, box, cyl, tiled, gable, win, many, tint, doorAt, trim, stone } = k;
  const F = 0.14, HX = -0.45, BW = 2.7, BD = 1.8, WH = 1.15, E = F + WH;
  const wall = tiled(k.art.siding(fine), 2, { color: p.wall, roughness: 0.9 }), roof = tiled(k.art.shingle(fine), 1.7, { color: p.roof, roughness: 0.8 });
  const shutter = std({ color: p.door, roughness: 0.6 }), wood = std({ color: '#8a5a34', roughness: 0.9 });
  box(BW + 0.16, F, BD + 0.16, stone, HX, F / 2, -BD / 2);
  box(BW, WH, BD, wall, HX, F + WH / 2, -BD / 2);
  for (const x of [HX - BW / 2, HX + BW / 2]) box(0.08, WH, 0.08, trim, x, F + WH / 2, 0, { shadow: false });
  gable(BW, BD, 1.05, 0.22, roof, wall, HX, E, -BD / 2);
  win(-1.15, F + 0.66, 0, 0.46, 0.46, trim, { shutters: shutter, box: wood });
  win(0.62, F + 0.7, 0, 0.32, 0.36, trim);
  // the hood over the door on two brackets
  const hood = add(k.worldUV(new THREE.BoxGeometry(0.9, 0.05, 0.42)), roof, 0, F + 1.06, 0.18);
  hood.rotation.x = 0.35;
  for (const sx of [-1, 1]) { const b = box(0.05, 0.22, 0.05, trim, sx * 0.36, F + 0.94, 0.12, { shadow: false }); b.rotation.x = 0.7; }
  box(0.9, 0.12, 0.34, stone, 0, 0.06, 0.17);
  // the chimney up the left slope
  box(0.32, 1.3, 0.32, std({ color: '#b0644a' }), -1.25, E + 0.75, -1.3);
  box(0.4, 0.08, 0.4, std({ color: '#8a4a36' }), -1.25, E + 1.42, -1.3);
  // the tower: a tapering octagon of white board on a stone foot, a gallery round it, a cap like an upturned boat
  const TX = 1.38, TZ = -1.05, TH = 2.6, eight = (geo) => { geo.rotateY(Math.PI / 8); return geo; };
  add(eight(new THREE.CylinderGeometry(0.66, 0.7, 0.3, 8)), stone, TX, 0.15, TZ);
  add(eight(new THREE.CylinderGeometry(0.44, 0.64, TH, 8)), wall, TX, 0.3 + TH / 2, TZ);
  add(eight(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 8)), wood, TX, 1.55, TZ);
  const gal = [];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; gal.push([TX + Math.sin(a) * 0.6, 1.72, TZ + Math.cos(a) * 0.6]); }
  many(new THREE.BoxGeometry(0.035, 0.3, 0.035), trim, gal, false);
  add(new THREE.TorusGeometry(0.6, 0.02, 4, 24), trim, TX, 1.87, TZ, { shadow: false }).rotation.x = Math.PI / 2;
  const CAP = 0.3 + TH;
  add(new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), roof, TX, CAP, TZ).scale.set(1, 0.85, 1.2);
  win(TX, 2.25, TZ + 0.5, 0.2, 0.3, trim, { arch: true });
  // the sails: a hub on the cap's front, four stocks crossed at 45°, each with its lattice sail on one side
  const HY = CAP + 0.15, HZ = TZ + 0.6, sailM = std({ color: p.sail, roughness: 0.9, side: THREE.DoubleSide });
  cyl(0.09, 0.09, 0.22, wood, TX, HY, HZ - 0.05, 10).rotation.x = Math.PI / 2;
  const spokes = new THREE.Group();
  spokes.position.set(TX, HY, HZ + 0.07); spokes.rotation.z = Math.PI / 4;
  k.still.add(spokes);
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = i * Math.PI / 2;
    spokes.add(arm);
    box(0.05, 0.98, 0.04, wood, 0, 0.52, 0, { to: arm });
    add(new THREE.PlaneGeometry(0.22, 0.72), sailM, 0.14, 0.6, 0.01, { to: arm, shadow: false });
    for (let j = 0; j < 4; j++) box(0.24, 0.02, 0.02, wood, 0.14, 0.27 + j * 0.22, 0.02, { to: arm, shadow: false });
  }
  // sunflowers along the front left, and a cart wheel leaning by the tower
  const stem = std({ color: '#4a7a3a' }), petal = std({ color: '#f0c020', roughness: 0.8 }), seed = std({ color: '#5a3a1a' });
  for (const x of [-1.75, -1.5, 0.95]) {
    cyl(0.015, 0.02, 0.62, stem, x, 0.31, 0.22, 5, { shadow: false });
    add(new THREE.CircleGeometry(0.11, 12), petal, x, 0.65, 0.24, { shadow: false });
    add(new THREE.CircleGeometry(0.05, 10), seed, x, 0.65, 0.25, { shadow: false });
  }
  const wheel = add(new THREE.TorusGeometry(0.28, 0.035, 6, 18), wood, 1.92, 0.3, -0.1);
  wheel.rotation.set(0, -0.6, 0.15);
  return doorAt(0, F, { colour: p.door, frameM: trim });
}
