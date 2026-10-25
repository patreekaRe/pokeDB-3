/* hub-houses-lodges.js  -  two of the Secret Base's earned houses (docs/roadmap.md's "Secret Base houses", session B),
   built from js/hub-houses.js's makeHouse() kit `k` as its own builders are: the Hot-Spring Ryokan (every town's
   Waystone mended) and the Ranger Lodge (the whole Safari Pokédex). Each returns k.doorAt()'s door, at x 0. */

/** The ♨ the ryokan's noren carries: a white bowl and three wisps of steam on nothing, laid over the cloth. */
function springArt(k) {
  return k.once('lodges-spring', () => {
    const { c, g } = k.fine(16, 16, 8);
    g.strokeStyle = '#ffffff'; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(8, 10.5, 5.2, 3.2, 0, 0.15, Math.PI - 0.15); g.stroke();
    for (const x of [5, 8, 11]) {
      g.beginPath(); g.moveTo(x, 9); g.bezierCurveTo(x - 1.6, 7.4, x + 1.6, 5.6, x, 3.4); g.stroke();
    }
    return c;
  });
}

/** The Hot-Spring Ryokan (the mock-up's): plaster walls in a frame of dark timber on a stone plinth, an irimoya roof of
    ribbed tiles (a hip below, a gable with plaster ends above, its ridge capped and finished with onigawara), lit shoji
    either side, a little gabled porch over the door with a ♨ noren across it, paper lanterns at the eaves, and to the
    left a steaming spring ringed in stones behind a bamboo screen. */
export function ryokan(k) {
  const { THREE, p, std, add, box, cyl, tiled, lit, gable, hip, many, tint, doorAt, stone, winter, DH } = k;
  const F = 0.12, CX = 0.4, BW = 3.0, BD = 1.9, WH = 1.25, E = F + WH, CZ = -BD / 2;
  const plaster = std({ color: p.plaster, roughness: 0.9 }), timber = std({ color: p.wall, roughness: 0.85 });
  const tile = tiled(k.art.tile(k.fine), 2.4, { color: p.roof, roughness: 0.7 }), dark = std({ color: tint(p.roof, 0.7), roughness: 0.7 });
  box(BW + 0.14, F, BD + 0.14, stone, CX, F / 2, CZ);
  box(BW, WH, BD, plaster, CX, F + WH / 2, CZ);
  // the timber frame: posts down the front and at the back corners, a sill, a head beam and a rail at the door's head
  const L = CX - BW / 2, R = CX + BW / 2, posts = [];
  for (const x of [L, -0.42, 0.42, 1.25, R]) posts.push([x, F + WH / 2, 0.02]);
  for (const x of [L, R]) posts.push([x, F + WH / 2, -BD + 0.02], [x, F + WH / 2, -BD / 2]);
  many(new THREE.BoxGeometry(0.09, WH, 0.07), timber, posts);
  for (const y of [F + 0.05, F + DH + 0.12, E - 0.05]) box(BW + 0.04, 0.08, 0.06, timber, CX, y, 0.03, { shadow: false });
  for (const sx of [L, R]) box(0.06, 0.08, BD, timber, sx + (sx < CX ? -0.02 : 0.02), E - 0.05, CZ, { shadow: false });
  // the shoji: lit paper behind a grid of thin bars, one left of the door and two right
  const paper = lit(std({ color: '#f6f0dc', emissive: new THREE.Color('#ffd88a'), roughness: 0.9 }), 0.9, 0.12), bars = [], rails = [];
  for (const [x, w] of [[-0.76, 0.48], [0.84, 0.66], [1.6, 0.48]]) {
    box(w, 0.62, 0.02, paper, x, F + 0.6, 0.012, { shadow: false });
    for (let i = 1; i < 3; i++) bars.push([x - w / 2 + i * w / 3, F + 0.6, 0.03]);
    for (const dy of [-0.31, -0.1, 0.1, 0.31]) rails.push([x, F + 0.6 + dy, 0.03, w]);
  }
  many(new THREE.BoxGeometry(0.025, 0.62, 0.025), timber, bars, false);
  for (const [x, y, z, w] of rails) box(w + 0.04, 0.03, 0.03, timber, x, y, z, { shadow: false });
  // the irimoya: a hip from the eaves, and above where its slopes have closed in, a gable at the same pitch
  hip(BW + 0.7, BD + 0.7, 0.9, tile, CX, E, CZ);
  gable(2.0, 1.16, 0.4, 0.06, tile, plaster, CX, E + 0.5, CZ);
  for (const sx of [-1, 1]) box(0.05, 0.05, 1.3, timber, CX + sx * 1.02, E + 0.52, CZ, { shadow: false });
  box(2.3, 0.1, 0.16, dark, CX, E + 0.94, CZ);
  for (const sx of [-1, 1]) {
    box(0.14, 0.24, 0.2, dark, CX + sx * 1.15, E + 0.98, CZ);
    box(0.1, 0.07, 0.22, dark, CX + sx * 1.24, E + 1.1, CZ).rotation.z = sx * 0.6;
  }
  // the porch over the door: two posts, a little gable, and the noren on its front beam
  for (const sx of [-1, 1]) box(0.08, 1.04, 0.08, timber, sx * 0.45, F + 0.52, 0.6);
  box(1.0, 0.07, 0.07, timber, 0, F + 1.06, 0.6, { shadow: false });
  gable(0.72, 1.06, 0.32, 0.08, tile, plaster, 0, F + 1.1, 0.27, { alongZ: true });
  box(0.06, 0.06, 0.9, dark, 0, F + 1.45, 0.27, { shadow: false });
  box(0.9, 0.12, 0.5, stone, 0, 0.06, 0.32);
  const cloth = std({ color: p.noren, side: THREE.DoubleSide, roughness: 0.95 });
  for (let i = 0; i < 4; i++) add(new THREE.PlaneGeometry(0.195, 0.34), cloth, -0.3 + i * 0.2, F + 0.86, 0.63, { shadow: false });
  add(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshStandardMaterial({ map: k.texOf(springArt(k)), transparent: true, alphaTest: 0.4, roughness: 0.9 }), 0, F + 0.86, 0.636, { shadow: false });
  // paper lanterns hung from the eaves either side of the porch
  const lamp = lit(std({ color: '#f6eedc', emissive: new THREE.Color('#ffcf7a'), roughness: 0.6 }), 1.3, 0.35), ink = std({ color: '#22222a' });
  for (const x of [-0.78, 0.78]) {
    add(new THREE.SphereGeometry(0.11, 14, 10), lamp, x, F + 1.02, 0.3, { shadow: false }).scale.y = 1.35;
    for (const dy of [-0.15, 0.15]) cyl(0.06, 0.06, 0.035, ink, x, F + 1.02 + dy, 0.3, 10, { shadow: false });
    cyl(0.008, 0.008, 0.16, ink, x, F + 1.25, 0.3, 4, { shadow: false });
  }
  // the spring: stones in a ring, the water in it, a little steam standing over it, a bamboo screen behind
  const PX = -1.62, PZ = 0.3;
  add(new THREE.CircleGeometry(0.42, 28), std({ color: '#3f98ba', roughness: 0.15, metalness: 0.1 }), PX, 0.07, PZ, { shadow: false }).rotation.x = -Math.PI / 2;
  add(new THREE.CircleGeometry(0.27, 24), std({ color: '#7cd0e8', roughness: 0.1, metalness: 0.1 }), PX - 0.04, 0.075, PZ - 0.03, { shadow: false }).rotation.x = -Math.PI / 2;
  const rocks = [];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; rocks.push([PX + Math.cos(a) * 0.48, 0.06, PZ + Math.sin(a) * 0.48, a * 1.7]); }
  many(new THREE.SphereGeometry(0.1, 8, 6).scale(1.2, 0.65, 1), std({ color: '#8a8680', roughness: 1 }), rocks);
  const steam = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.32, depthWrite: false, roughness: 1 });
  many(new THREE.SphereGeometry(0.11, 10, 8).scale(1, 1.3, 1), steam, [[PX - 0.14, 0.24, PZ + 0.06], [PX + 0.1, 0.38, PZ - 0.06], [PX - 0.04, 0.56, PZ], [PX + 0.16, 0.2, PZ + 0.14]], false);
  const cane = std({ color: winter ? '#a8b88a' : '#8ab04a', roughness: 0.6 }), canes = [];
  for (let x = -2.18; x <= -1.16; x += 0.068) canes.push([x, 0.46, -0.32]);
  many(new THREE.CylinderGeometry(0.032, 0.032, 0.92, 6), cane, canes);
  for (const y of [0.3, 0.72]) box(1.08, 0.04, 0.04, std({ color: '#5a7a3a', roughness: 0.7 }), -1.67, y, -0.28, { shadow: false });
  return doorAt(0, F, { colour: tint(p.wall, 0.8), frameM: timber });
}

/** The Ranger Lodge (the mock-up's): a steep A-frame of shingles from the ground to its ridge on a field-stone footing,
    its front gable timber round one big lit window in a grid of mullions, the door at its foot, a plank deck with a
    railing either side of the steps, a stone chimney through the right slope, and a ranger's green flag on a pole. */
export function lodge(k) {
  const { THREE, p, std, add, box, cyl, tiled, lit, many, tint, doorAt, trim, stone, worldUV, DH } = k;
  const F = 0.28, HW = 1.75, H = 3.05, D = 2.5, OV = 0.22, T = 0.08;
  const roof = tiled(k.art.shingle(k.fine), 1.7, { color: p.roof, roughness: 0.75 }), wall = tiled(k.art.plank(k.fine), 2, { color: p.wall, roughness: 0.85 });
  box(2 * HW + 0.2, F, D + 0.2, stone, 0, F / 2, -D / 2);
  // the two slopes, each a slab from the footing's edge up to the ridge, out past the front and back
  const a = Math.atan2(H, HW), len = Math.hypot(HW, H) + 0.18;
  for (const s of [-1, 1]) {
    const slab = add(worldUV(new THREE.BoxGeometry(len, T, D + 2 * OV)), roof, s * (HW / 2 + Math.sin(a) * T / 2 + 0.04), F + H / 2 - 0.06 + Math.cos(a) * T / 2, -D / 2);
    slab.rotation.z = -s * a;
  }
  add(new THREE.CylinderGeometry(0.07, 0.07, D + 2 * OV, 8), std({ color: tint(p.roof, 0.7) }), 0, F + H + 0.02, -D / 2).rotation.x = Math.PI / 2;
  // the gable ends: planked triangles front and back, the barge boards along the front's edges in trim
  const IN = 0.12, tri = new THREE.Shape([[-HW + IN, 0], [HW - IN, 0], [0, H - IN * H / HW]].map(([x, y]) => new THREE.Vector2(x, y)));
  for (const [z, r] of [[0, 0], [-D, Math.PI]]) add(new THREE.ShapeGeometry(tri), wall, 0, F, z, { shadow: false }).rotation.y = r;
  // the big window: lit glass up the gable, a grid of mullions over it that leaves the door clear
  const glass = lit(std({ color: '#4a5a66', emissive: new THREE.Color('#ffd47a'), roughness: 0.25 }), 1.0, 0.15);
  const GW = 1.2, GH = 2.35, G0 = F + 0.08;
  add(new THREE.ShapeGeometry(new THREE.Shape([[-GW, 0], [GW, 0], [0, GH]].map(([x, y]) => new THREE.Vector2(x, y)))), glass, 0, G0, 0.012, { shadow: false });
  const halfAt = (y) => GW * (1 - (y - G0) / GH), door = F + DH + 0.08;
  for (const x of [-0.8, -0.4, 0.4, 0.8]) { const top = G0 + GH * (1 - Math.abs(x) / GW); box(0.05, top - G0, 0.04, trim, x, (top + G0) / 2, 0.03, { shadow: false }); }
  box(0.05, G0 + GH - door, 0.04, trim, 0, (G0 + GH + door) / 2, 0.03, { shadow: false });
  for (const y of [door, F + 1.6, F + 2.1]) box(2 * halfAt(y), 0.05, 0.04, trim, 0, y, 0.03, { shadow: false });
  for (const s of [-1, 1]) {
    const b = box(Math.hypot(GW, GH) + 0.04, 0.07, 0.05, trim, s * GW / 2, G0 + GH / 2, 0.035, { shadow: false });
    b.rotation.z = -s * Math.atan2(GH, GW);
  }
  box(2 * GW + 0.06, 0.07, 0.05, trim, 0, G0, 0.035, { shadow: false });
  // the deck: planks before the door, a railing either side of the steps, the steps down
  const deck = tiled(k.art.plank(k.fine), 2, { color: '#b08860' });
  box(2 * HW + 0.1, 0.07, 0.62, deck, 0, F - 0.035, 0.31);
  for (let i = 0; i < 2; i++) box(0.8, 0.09, 0.18, deck, 0, F * (1 - i) / 2 + 0.02, 0.68 + i * 0.16);
  const spokes = [];
  for (const [x0, x1] of [[-HW, -0.45], [0.45, HW]]) {
    box(x1 - x0, 0.05, 0.05, trim, (x0 + x1) / 2, F + 0.42, 0.6, { shadow: false });
    for (let x = x0; x <= x1 + 0.001; x += 0.1) spokes.push([x, F + 0.2, 0.6]);
  }
  many(new THREE.BoxGeometry(0.035, 0.4, 0.035), trim, spokes);
  // the chimney through the right slope, and its cap
  box(0.42, 3.1, 0.46, stone, 0.62, 1.55, -1.7);
  box(0.5, 0.08, 0.54, std({ color: '#6a665e' }), 0.62, 3.14, -1.7);
  // the ranger's flag: a pole at the deck's left corner, a green flag with a pale leaf on it
  const metal = std({ color: '#8a8f99', metalness: 0.45, roughness: 0.45 });
  cyl(0.025, 0.03, 3.5, metal, -2.1, 1.75, 0.72, 8);
  add(new THREE.SphereGeometry(0.05, 8, 6), std({ color: '#e8c050', metalness: 0.6, roughness: 0.35 }), -2.1, 3.52, 0.72, { shadow: false });
  const flag = add(new THREE.PlaneGeometry(0.62, 0.38), std({ color: '#4f9a44', side: THREE.DoubleSide, roughness: 0.9 }), -1.78, 3.2, 0.72);
  flag.rotation.y = -0.15;
  add(new THREE.CircleGeometry(0.1, 14), std({ color: p.trim, side: THREE.DoubleSide }), -1.76, 3.2, 0.735, { shadow: false }).rotation.y = -0.15;
  // a lantern by the door
  const lamp = lit(std({ color: '#fff0c0', emissive: new THREE.Color('#ffc860'), roughness: 0.3 }), 1.4, 0.3);
  box(0.1, 0.14, 0.1, lamp, 0.48, F + 0.72, 0.07, { shadow: false });
  return doorAt(0.04, F, { colour: p.door, frameM: trim });
}
