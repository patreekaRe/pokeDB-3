/* hub-houses-season.js  -  the seasonal houses on the Secret Base's lot (docs/roadmap.md's "Secret Base houses", session
   B; sold only in their month, js/data/houses.js): the Haunted Chateau (October), the Snow Chalet (December) and, from
   session C, the Cherry Blossom Teahouse (April). Built
   from makeHouse()'s kit in js/hub-houses.js, as its own houses are. */

/** The Haunted Chateau: a crooked two-storey chateau, its walls leaning and its roof askew, two towers of different
    heights under bent witch-hat spires, arched windows lit a ghostly `glow` (a Gastly peeking out of one), a shutter
    hanging off its hinge, a crooked chimney, jack-o'-lanterns on the step, a dead tree, an iron fence and bats. */
export function chateau(k) {
  const { THREE, p, fine, texOf, still, std, add, box, cyl, tiled, lit, gable, turned, many, tint, doorAt, trim, stone } = k;
  const F = 0.14, BW = 2.4, BD = 1.8, WH = 1.9, E = F + WH, MID = F + 1.0, LEAN = -0.022;
  const wall = tiled(k.art.siding(fine), 2.4, { color: p.wall, roughness: 0.95 }), roof = tiled(k.art.shingle(fine), 1.9, { color: p.roof, roughness: 0.85 });
  const spireM = std({ color: p.roof, roughness: 0.8 }), iron = std({ color: '#1e1a24', roughness: 0.6, metalness: 0.3 });
  const ghost = lit(std({ map: texOf(k.art.window(fine)), color: tint(p.glow, 0.55), emissive: new THREE.Color(p.glow), emissiveMap: texOf(k.art.window(fine, true)), roughness: 0.4 }), 1.2, 0.4);
  // a window lit in the ghost light, arched unless told: the house's own win() lights warm
  const gwin = (wx, wy, wz, w, h, { arch = true, to = still } = {}) => {
    add(new THREE.PlaneGeometry(w, h), ghost, wx, wy, wz + 0.012, { shadow: false, to });
    if (arch) {
      add(new THREE.CircleGeometry(w / 2, 12, 0, Math.PI), ghost, wx, wy + h / 2, wz + 0.012, { shadow: false, to });
      add(new THREE.TorusGeometry(w / 2 + 0.02, 0.025, 6, 14, Math.PI), trim, wx, wy + h / 2, wz + 0.02, { shadow: false, to });
    } else box(w + 0.08, 0.05, 0.05, trim, wx, wy + h / 2 + 0.02, wz + 0.02, { shadow: false, to });
    box(w + 0.1, 0.05, 0.07, trim, wx, wy - h / 2 - 0.02, wz + 0.03, { shadow: false, to });
    for (const sx of [-1, 1]) box(0.05, h + 0.06, 0.05, trim, wx + sx * (w / 2 + 0.02), wy, wz + 0.02, { shadow: false, to });
  };

  // the body, leaning a little off true, its roof more so
  box(BW + 0.16, F, BD + 0.16, stone, 0, F / 2, -BD / 2);
  const body = turned(0, 0, 0, 0);
  body.rotation.z = LEAN;
  box(BW, WH, BD, wall, 0, F + WH / 2, -BD / 2, { to: body });
  box(BW + 0.08, 0.07, BD + 0.08, trim, 0, MID, -BD / 2, { shadow: false, to: body });
  box(BW + 0.12, 0.09, BD + 0.12, trim, 0, E - 0.03, -BD / 2, { shadow: false, to: body });
  const top = gable(BW, BD, 1.15, 0.16, roof, wall, -Math.sin(LEAN) * E, E, -BD / 2);
  top.rotation.z = LEAN * 2.2;
  gwin(-0.68, F + 0.52, 0, 0.34, 0.46, { to: body });
  gwin(0.68, F + 0.52, 0, 0.34, 0.46, { to: body });
  gwin(-0.6, MID + 0.26, 0, 0.3, 0.32, { to: body });
  gwin(0.6, MID + 0.26, 0, 0.3, 0.32, { to: body });
  gwin(0, MID + 0.28, 0, 0.26, 0.36, { to: body });
  // a round window high in the gable
  add(new THREE.CircleGeometry(0.14, 18), ghost, -0.05, E + 0.42, -BD / 2 + BD / 2 + 0.012, { shadow: false });
  add(new THREE.TorusGeometry(0.155, 0.03, 8, 20), trim, -0.05, E + 0.42, 0.02, { shadow: false });
  // a Gastly peering out of the right window downstairs: a dark ball, wide eyes, a grin, a wisp of gas
  const gas = std({ color: '#4a2a6a', roughness: 0.9 }), white = std({ color: '#ffffff', roughness: 0.5 }), pupil = std({ color: '#1a1020' });
  const gx = 0.7, gy = F + 0.5;
  add(new THREE.CircleGeometry(0.11, 16), gas, gx, gy, 0.03, { shadow: false, to: body });
  for (const sx of [-1, 1]) {
    add(new THREE.CircleGeometry(0.032, 10), white, gx + sx * 0.042, gy + 0.03, 0.035, { shadow: false, to: body });
    add(new THREE.CircleGeometry(0.014, 8), pupil, gx + sx * 0.036, gy + 0.025, 0.04, { shadow: false, to: body });
  }
  add(new THREE.CircleGeometry(0.05, 12, Math.PI, Math.PI), white, gx, gy - 0.025, 0.035, { shadow: false, to: body });
  add(new THREE.CircleGeometry(0.13, 16), std({ color: '#7a4aa8', transparent: true, opacity: 0.35, depthWrite: false }), gx, gy, 0.025, { shadow: false, to: body });
  // shutters, one hanging off its top hinge
  const shut = std({ color: tint(p.trim, 0.62), roughness: 0.9 });
  box(0.13, 0.5, 0.035, shut, -0.68 - 0.26, F + 0.52, 0.03, { to: body });
  const hang = box(0.13, 0.5, 0.035, shut, 0.68 + 0.3, F + 0.48, 0.04, { to: body });
  hang.rotation.z = 0.42;
  // the crooked chimney
  const chim = box(0.32, 1.25, 0.32, stone, 0.72, E + 0.82, -1.4);
  chim.rotation.z = -0.1;
  box(0.4, 0.08, 0.4, std({ color: '#3a3438' }), 0.78, E + 1.45, -1.4).rotation.z = -0.1;

  // the towers: eight-sided, a ghost window up each, witch-hat spires bent at the tip
  const tower = (TX, TZ, TR, TH, hat, bend) => {
    const face = TR * Math.cos(Math.PI / 8);
    cyl(TR, TR, TH - F, wall, TX, F + (TH - F) / 2, TZ, 8).geometry.rotateY(Math.PI / 8);
    cyl(TR + 0.05, TR + 0.05, F, stone, TX, F / 2, TZ, 8).geometry.rotateY(Math.PI / 8);
    cyl(TR + 0.04, TR + 0.04, 0.07, trim, TX, TH - 0.03, TZ, 8, { shadow: false }).geometry.rotateY(Math.PI / 8);
    for (const y of [F + 0.6, TH - 0.6]) gwin(0, y, face, 0.17, 0.36, { to: turned(TX, 0, TZ, 0) });
    const brim = cyl(TR + 0.14, TR + 0.14, 0.05, spireM, TX, TH + 0.03, TZ, 8);
    brim.geometry.rotateY(Math.PI / 8);
    const cone = add(new THREE.ConeGeometry(TR + 0.08, hat, 8), spireM, TX + bend * 0.06, TH + hat / 2, TZ);
    cone.geometry.rotateY(Math.PI / 8);
    cone.rotation.z = -bend * 0.1;
    const tip = add(new THREE.ConeGeometry(0.06, 0.32, 6), spireM, TX + bend * 0.2, TH + hat + 0.05, TZ);
    tip.rotation.z = -bend * 0.85;
  };
  tower(-1.62, -0.6, 0.42, 2.25, 1.15, -1);
  tower(1.66, -0.75, 0.37, 2.75, 1.25, 1);

  // the door, its step, and a jack-o'-lantern either side, lit
  box(0.9, 0.1, 0.34, stone, 0, 0.05, 0.17);
  const pumpkin = lit(std({ color: '#e8862a', emissive: new THREE.Color('#ff8a2a'), roughness: 0.6 }), 0.9, 0.25), carve = std({ color: '#3a1a0a' });
  for (const sx of [-1, 1]) {
    const px = sx * 0.62, pz = 0.3;
    add(new THREE.SphereGeometry(0.15, 14, 10), pumpkin, px, 0.12, pz).scale.y = 0.78;
    cyl(0.02, 0.025, 0.08, std({ color: '#4a6a2a' }), px, 0.26, pz, 6, { shadow: false });
    for (const ex of [-1, 1]) add(new THREE.CircleGeometry(0.03, 3), carve, px + ex * 0.05, 0.15, pz + 0.146, { shadow: false });
    add(new THREE.CircleGeometry(0.06, 10, Math.PI, Math.PI), carve, px, 0.09, pz + 0.146, { shadow: false });
  }

  // a dead tree at the front left, bare branches reaching
  const bark = std({ color: '#3a3230', roughness: 1 });
  const limb = (x, y, z, len, r0, r1, rz, rx = 0) => {
    const g = new THREE.CylinderGeometry(r1, r0, len, 6);
    g.translate(0, len / 2, 0);
    const o = add(g, bark, x, y, z);
    o.rotation.set(rx, 0, rz);
    return [x - Math.sin(rz) * len * Math.cos(rx), y + Math.cos(rz) * len * Math.cos(rx), z + Math.sin(rx) * len];
  };
  const tx = -1.88, tz = 0.5;
  let at = limb(tx, 0, tz, 1.0, 0.1, 0.07, 0.08);
  at = limb(...at, 0.7, 0.07, 0.045, -0.18);
  limb(...at, 0.5, 0.045, 0.02, 0.35, 0.1);
  limb(...at, 0.45, 0.04, 0.015, -0.7);
  limb(tx - 0.06, 0.95, tz, 0.4, 0.05, 0.02, 0.7, -0.2);
  limb(tx + 0.02, 1.25, tz, 0.5, 0.045, 0.015, -0.95, 0.15);

  // the iron fence along the front, a gap at the step: rails, posts and spikes
  const posts = [];
  for (const [x0, x1] of [[-2.2, -0.52], [0.52, 2.2]]) {
    for (const y of [0.16, 0.5]) box(x1 - x0, 0.03, 0.03, iron, (x0 + x1) / 2, y, 0.85, { shadow: false });
    for (let x = x0; x <= x1 + 0.001; x += 0.12) posts.push([x, 0.3, 0.85]);
  }
  many(new THREE.BoxGeometry(0.022, 0.6, 0.022), iron, posts, false);
  many(new THREE.ConeGeometry(0.03, 0.1, 4), iron, posts.map(([x, , z]) => [x, 0.64, z]), false);

  // bats about the spires
  const wing = new THREE.Shape([[0, 0.02], [0.05, 0.05], [0.12, 0.07], [0.1, 0.03], [0.14, 0.0], [0.08, -0.01], [0.04, -0.04], [0, -0.02], [-0.04, -0.04], [-0.08, -0.01], [-0.14, 0], [-0.1, 0.03], [-0.12, 0.07], [-0.05, 0.05]].map(([a, b]) => new THREE.Vector2(a, b)));
  many(new THREE.ShapeGeometry(wing).scale(1.6, 1.6, 1), std({ color: '#1e1a24', side: THREE.DoubleSide }), [[-1.15, 3.55, -0.3, 0.3], [0.9, 4.05, -0.4, -0.4], [-0.2, 3.85, -0.9, 0.1]], false);

  return doorAt(0, F, { arch: true, colour: p.door, frameM: trim });
}

/** The Snow Chalet: board-and-batten pine under a steep front gable thick with snow, icicles along its eaves, carved
    bargeboards, a balcony on brackets under a lit gable window, shuttered windows either side of the door, a stone
    chimney capped in snow, a lamp by the door, a snowman in a scarf and two snowy pines. */
export function chalet(k) {
  const { THREE, p, fine, still, std, add, box, cyl, tiled, lit, gable, win, many, tint, doorAt, trim, stone } = k;
  const F = 0.14, BW = 2.6, BD = 2.0, WH = 1.25, E = F + WH, RISE = 1.3, OH = 0.28;
  const boards = tiled(k.art.plank(fine), 2.2, { color: p.wall, roughness: 0.85 }), roof = tiled(k.art.shingle(fine), 1.8, { color: p.roof, roughness: 0.8 });
  const snow = std({ color: '#f4f8fc', roughness: 0.9 }), ice = std({ color: '#d8f0ff', roughness: 0.15, metalness: 0.1 });
  const batten = std({ color: tint(p.wall, 0.72), roughness: 0.85 }), doorM = std({ color: p.door, roughness: 0.7 });
  box(BW + 0.16, F, BD + 0.16, stone, 0, F / 2, -BD / 2);
  box(BW, WH, BD, boards, 0, F + WH / 2, -BD / 2);
  for (const sx of [-1, 1]) box(0.09, WH, 0.09, trim, sx * BW / 2, F + WH / 2, 0, { shadow: false });
  many(new THREE.BoxGeometry(0.035, WH, 0.03), batten, [-1.05, -0.62, 0.62, 1.05].map(x => [x, F + WH / 2, 0.012]), false);
  // the roof: its ridge running front to back, the gable facing out, and snow lying thick on both slopes
  gable(BD, BW, RISE, OH, roof, boards, 0, E, -BD / 2, { alongZ: true });
  const a = Math.atan2(RISE, BW / 2), run = BW / 2 + OH, len = run / Math.cos(a), T = 0.07, ST = 0.1, L = BD + 1.6 * OH;
  const g = new THREE.Group();
  g.position.set(0, E, -BD / 2); g.rotation.y = Math.PI / 2;
  still.add(g);
  for (const s of [-1, 1]) {
    // the snow lies on the upper two thirds, so the roof's colour shows along the eaves
    const cy = RISE - run / 2 * Math.tan(a) + T / 2 / Math.cos(a), cz = s * run / 2, up = T / 2 + ST / 2 - 0.01, back = len * 0.17;
    const sl = add(new THREE.BoxGeometry(L + 0.04, ST, len * 0.66), snow, 0, cy + Math.cos(a) * up + Math.sin(a) * back, cz + s * Math.sin(a) * up - s * Math.cos(a) * back, { to: g });
    sl.rotation.x = s * a;
  }
  add(new THREE.CylinderGeometry(0.09, 0.09, L + 0.04, 10), snow, 0, RISE + 0.08, 0, { to: g }).rotation.z = Math.PI / 2;
  // icicles under both eaves and down the front gable's edges
  const ex = run - 0.04, ey = E + RISE - run * Math.tan(a), front = L / 2 - BD / 2, sticks = [];
  for (const sx of [-1, 1]) for (let z = front - 0.06, i = 0; z > -BD - front + 0.05; z -= 0.14, i++) sticks.push([sx * ex, ey - 0.07 - (i % 3) * 0.02, z]);
  for (const sx of [-1, 1]) for (let t = 0.1, i = 0; t < 0.95; t += 0.1, i++) sticks.push([sx * ex * (1 - t), ey + run * Math.tan(a) * t - 0.08 - (i % 2) * 0.03, front - 0.02]);
  const cone = new THREE.ConeGeometry(0.025, 0.14, 5);
  cone.rotateX(Math.PI);
  many(cone, ice, sticks, false);
  // carved bargeboards down the gable's front edges, a round boss at each step
  const bl = Math.hypot(run, run * Math.tan(a));
  for (const sx of [-1, 1]) {
    const b = box(bl, 0.1, 0.05, trim, sx * run / 2, ey + run * Math.tan(a) / 2 + 0.03, front + 0.02, { shadow: false });
    b.rotation.z = -sx * a;
  }
  many(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 10).rotateX(Math.PI / 2), trim, [0.25, 0.5, 0.75].flatMap(t => [-1, 1].map(sx => [sx * run * (1 - t), ey + run * Math.tan(a) * t - 0.04, front + 0.05])), false);
  // the balcony under the gable window: a deck on two brackets, a rail on balusters
  const DK = 0.38, DY = E + 0.04;
  box(1.5, 0.07, DK, batten, 0, DY, DK / 2);
  for (const sx of [-1, 1]) { const br = box(0.06, 0.36, 0.06, batten, sx * 0.55, DY - 0.16, DK * 0.4); br.rotation.x = 0.7; }
  box(1.54, 0.05, 0.05, trim, 0, DY + 0.4, DK - 0.02, { shadow: false });
  for (const sx of [-1, 1]) box(0.05, 0.05, DK, trim, sx * 0.75, DY + 0.4, DK / 2, { shadow: false });
  const bal = [];
  for (let x = -0.7; x <= 0.71; x += 0.1) bal.push([x, DY + 0.2, DK - 0.02]);
  for (const sx of [-1, 1]) for (let z = 0.08; z < DK - 0.05; z += 0.1) bal.push([sx * 0.75, DY + 0.2, z]);
  many(new THREE.BoxGeometry(0.05, 0.36, 0.025), trim, bal, false);
  box(1.54, 0.04, 0.07, snow, 0, DY + 0.445, DK - 0.02, { shadow: false });
  win(0, DY + 0.55, 0, 0.44, 0.42, trim);
  // the ground floor: shuttered windows either side of the door, a lamp, the step
  for (const sx of [-1, 1]) win(sx * 0.84, F + 0.66, 0, 0.42, 0.42, trim, { shutters: doorM });
  for (const sx of [-1, 1]) box(0.62, 0.04, 0.09, snow, sx * 0.84, F + 0.9, 0.05, { shadow: false });
  const lamp = lit(std({ color: '#fff0c0', emissive: new THREE.Color('#ffc860'), roughness: 0.3 }), 1.4, 0.3);
  box(0.04, 0.12, 0.06, std({ color: '#2e2e38' }), 0.42, F + 0.76, 0.03, { shadow: false });
  box(0.1, 0.14, 0.1, lamp, 0.42, F + 0.66, 0.07, { shadow: false });
  box(0.9, 0.12, 0.34, stone, 0, 0.06, 0.17);
  // the stone chimney up through the left slope, snow on its cap
  box(0.36, 1.55, 0.36, stone, -0.68, E + 1.0, -1.35);
  box(0.44, 0.08, 0.44, std({ color: '#6a665e' }), -0.68, E + 1.8, -1.35);
  add(new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), snow, -0.68, E + 1.83, -1.35).scale.y = 0.35;
  // a snowman by the step: three balls, coal eyes, a carrot nose, a red scarf, twig arms
  const SX = 1.5, SZ = 0.45, coal = std({ color: '#1e1e24' }), twig = std({ color: '#6a4a2a' });
  add(new THREE.SphereGeometry(0.22, 14, 10), snow, SX, 0.2, SZ);
  add(new THREE.SphereGeometry(0.16, 14, 10), snow, SX, 0.52, SZ);
  add(new THREE.SphereGeometry(0.115, 14, 10), snow, SX, 0.75, SZ);
  for (const dx of [-0.04, 0.04]) add(new THREE.SphereGeometry(0.018, 6, 4), coal, SX + dx, 0.78, SZ + 0.105, { shadow: false });
  for (const y of [0.46, 0.56]) add(new THREE.SphereGeometry(0.02, 6, 4), coal, SX, y, SZ + 0.155, { shadow: false });
  add(new THREE.ConeGeometry(0.024, 0.14, 8).rotateX(Math.PI / 2), std({ color: '#e8862a' }), SX, 0.75, SZ + 0.17, { shadow: false });
  const scarf = std({ color: '#d8403a', roughness: 0.9 });
  add(new THREE.TorusGeometry(0.1, 0.035, 8, 16), scarf, SX, 0.65, SZ).rotation.x = Math.PI / 2;
  box(0.06, 0.2, 0.03, scarf, SX + 0.07, 0.55, SZ + 0.1).rotation.z = 0.25;
  for (const sx of [-1, 1]) cyl(0.012, 0.012, 0.32, twig, SX + sx * 0.27, 0.58, SZ, 5, { shadow: false }).rotation.z = sx * 1.0;
  // two snowy pines, and drifts along the walls
  const needle = std({ color: '#2f6a4a', roughness: 0.9 });
  for (const [px, pz, s] of [[-1.86, -0.15, 1], [1.92, -1.55, 0.85]]) {
    cyl(0.05 * s, 0.06 * s, 0.3 * s, twig, px, 0.15 * s, pz, 6);
    for (let i = 0; i < 3; i++) {
      const y = (0.35 + i * 0.36) * s, r = (0.36 - i * 0.09) * s;
      add(new THREE.ConeGeometry(r, 0.5 * s, 9), needle, px, y + 0.25 * s, pz);
      add(new THREE.ConeGeometry(r * 0.6, 0.24 * s, 9), snow, px, y + 0.4 * s, pz, { shadow: false });
    }
  }
  many(new THREE.SphereGeometry(0.2, 10, 6).scale(1.6, 0.35, 1), snow, [[-1.0, 0.03, 0.18], [1.0, 0.03, 0.2], [-1.45, 0.03, -1.0, 1.57], [1.45, 0.03, -0.6, 1.57], [0.7, 0.02, 0.62]], false);
  return doorAt(0, F, { colour: p.door, frameM: trim });
}

/** The Cherry Blossom Teahouse (April): a little teahouse of dark timber and plaster raised on posts over a veranda of
    planks, lit shoji along its front, a hip roof of tiles with its ridge capped, stepping stones up to the door, a
    cherry tree in full bloom beside it dropping petals on the moss, and a stone lantern. */
export function teahouse(k) {
  const { THREE, p, fine, std, add, box, cyl, tiled, lit, hip, many, tint, doorAt, stone } = k;
  const F = 0.34, BW = 2.3, BD = 1.6, WH = 1.05, CX = 0.25, CZ = -1.05, E = F + WH;
  const timber = std({ color: p.wall, roughness: 0.85 }), plaster = std({ color: p.plaster, roughness: 0.9 });
  const tile = tiled(k.art.tile(fine), 2.4, { color: p.roof, roughness: 0.7 }), dark = std({ color: tint(p.roof, 0.7), roughness: 0.7 });
  const deck = tiled(k.art.plank(fine), 2.4, { color: tint(p.wall, 1.25), roughness: 0.85 });
  const paper = lit(std({ color: '#f6f0dc', emissive: new THREE.Color('#ffd88a'), roughness: 0.9 }), 0.9, 0.12);
  // the veranda on its posts, and the room on it
  box(BW + 0.7, 0.08, BD + 0.75, deck, CX, F - 0.04, CZ + 0.2);
  const posts = [];
  for (const x of [CX - BW / 2 - 0.3, CX, CX + BW / 2 + 0.3]) for (const z of [CZ + BD / 2 + 0.52, CZ - BD / 2]) posts.push([x, (F - 0.08) / 2, z]);
  many(new THREE.BoxGeometry(0.1, F - 0.08, 0.1), timber, posts);
  box(BW, WH, BD, plaster, CX, F + WH / 2, CZ);
  const frame = [];
  for (const x of [CX - BW / 2, -0.42, 0.42, CX + BW / 2]) frame.push([x, F + WH / 2, CZ + BD / 2 + 0.02]);
  for (const x of [CX - BW / 2, CX + BW / 2]) frame.push([x, F + WH / 2, CZ - BD / 2]);
  many(new THREE.BoxGeometry(0.08, WH, 0.07), timber, frame);
  box(BW + 0.04, 0.07, 0.06, timber, CX, E - 0.04, CZ + BD / 2 + 0.03, { shadow: false });
  // the shoji: lit paper behind thin bars, left of the door and right
  const bars = [];
  for (const [x, w] of [[-0.66, 0.4], [0.92, 0.7]]) {
    box(w, 0.6, 0.02, paper, x, F + 0.55, CZ + BD / 2 + 0.012, { shadow: false });
    for (let i = 1; i < 4; i++) bars.push([x - w / 2 + i * w / 4, F + 0.55, CZ + BD / 2 + 0.03]);
    box(w, 0.025, 0.025, timber, x, F + 0.55, CZ + BD / 2 + 0.03, { shadow: false });
  }
  many(new THREE.BoxGeometry(0.02, 0.6, 0.02), timber, bars, false);
  // the roof: a broad tiled hip out over the veranda, its ridge capped and its ends turned up
  box(BW + 0.95, 0.05, BD + 1.15, dark, CX, E + 0.02, CZ + 0.15);
  hip(BW + 1.05, BD + 1.25, 0.85, tile, CX, E + 0.05, CZ + 0.15);
  const RL = (BW + 1.05) - (BD + 1.25) + 0.12;
  box(RL, 0.09, 0.14, dark, CX, E + 0.92, CZ + 0.15);
  for (const sx of [-1, 1]) box(0.12, 0.16, 0.16, dark, CX + sx * RL / 2, E + 0.97, CZ + 0.15);
  // stepping stones up to the door
  many(new THREE.CylinderGeometry(0.17, 0.19, 0.08, 9), stone, [[0, 0.1, 0.45], [0.06, 0.05, 0.75]]);
  box(0.6, 0.18, 0.3, stone, 0, 0.17, 0.12);
  // the cherry tree at the left: a crooked trunk and limbs, round clouds of blossom in two pinks, petals on the ground
  const bark = std({ color: '#4a3230', roughness: 1, flatShading: true });
  const TX = -1.56, TZ = 0.2;
  cyl(0.08, 0.12, 1.2, bark, TX, 0.6, TZ, 7).rotation.z = 0.12;
  for (const [rz, rx, l] of [[0.7, 0.2, 0.75], [-0.6, -0.3, 0.7], [0.1, 0.6, 0.6]]) {
    const g = new THREE.CylinderGeometry(0.035, 0.06, l, 6);
    g.translate(0, l / 2, 0);
    add(g, bark, TX - 0.07, 1.1, TZ).rotation.set(rx, 0, rz);
  }
  const bloomA = std({ color: p.blossom, roughness: 0.95, flatShading: true }), bloomB = std({ color: tint(p.blossom, 1.12), roughness: 0.95, flatShading: true });
  const puff = new THREE.IcosahedronGeometry(0.34, 1);
  many(puff, bloomA, [[TX - 0.3, 1.55, TZ], [TX + 0.3, 1.7, TZ - 0.1], [TX - 0.05, 1.95, TZ - 0.15], [TX - 0.2, 1.45, TZ + 0.3]]);
  many(puff.clone().scale(0.7, 0.7, 0.7), bloomB, [[TX + 0.35, 1.4, TZ + 0.2], [TX - 0.25, 2.1, TZ + 0.1], [TX + 0.1, 1.55, TZ + 0.4], [TX - 0.35, 1.85, TZ - 0.25]]);
  const fallen = [];
  for (let i = 0; i < 18; i++) { const a = i * 2.4, r = 0.25 + (i * 37 % 11) / 11 * 0.4; fallen.push([TX + Math.cos(a) * r, 0.012, TZ + Math.sin(a) * r * 0.8, a]); }
  many(new THREE.CircleGeometry(0.035, 5).rotateX(-Math.PI / 2), bloomB, fallen, false);
  // a stone lantern at the right
  const LX = 1.85, LZ = 0.35;
  cyl(0.12, 0.16, 0.08, stone, LX, 0.04, LZ, 6);
  cyl(0.05, 0.06, 0.36, stone, LX, 0.26, LZ, 6);
  box(0.24, 0.18, 0.24, stone, LX, 0.53, LZ);
  box(0.13, 0.1, 0.02, lit(std({ color: '#ffe0a0', emissive: new THREE.Color('#ffb850'), roughness: 0.4 }), 1.3, 0.3), LX, 0.53, LZ + 0.121, { shadow: false });
  add(new THREE.ConeGeometry(0.22, 0.14, 4), dark, LX, 0.69, LZ).rotation.y = Math.PI / 4;
  return doorAt(CZ + BD / 2 + 0.03, F, { colour: p.door, frameM: timber });
}
