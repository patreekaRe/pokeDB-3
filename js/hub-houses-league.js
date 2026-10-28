/* hub-houses-league.js  -  two of the Secret Base's earned houses (js/data/houses.js, session B, 2026-10-23), built from
   makeHouse()'s kit in js/hub-houses.js as the houses there are: the Gym Hall (every Gym Leader beaten) and the Poké
   Ball Dome (the Master Badge). Each returns its doorAt() door, the house's only tap. */

/** The Gym Hall: a League hall on a stepped stone plinth, four white columns under a pediment roof with a Poké Ball
    crest in its gable, banners either side of the door, lit windows down its sides, fire bowls by the steps and a
    Rhydon statue on a plinth at each front corner, as every Gym has. */
export function gymhall(k) {
  const { THREE, p, std, add, box, cyl, tiled, lit, gable, win, turned, many, tint, doorAt, trim, stone, fine, art } = k;
  const F = 0.28, CW = 3.0, CD = 2.0, WH = 1.5, E = F + WH, PZ = 0.42;
  const wall = tiled(art.ashlar(fine), 2, { color: p.wall, roughness: 0.9 }), roof = tiled(art.tile(fine), 2.4, { color: p.roof, roughness: 0.7 });
  const banner = std({ color: p.banner, side: THREE.DoubleSide, roughness: 0.9 }), gold = std({ color: '#e8c040', metalness: 0.6, roughness: 0.3 });
  // the plinth in two steps, and the steps up to the door
  box(3.8, F / 2, 2.95, stone, 0, F / 4, -0.92);
  box(3.6, F / 2, 2.8, stone, 0, F * 3 / 4, -0.95);
  box(1.5, F / 2, 0.26, stone, 0, F / 4, 0.68);
  // the hall itself, its corner pilasters
  box(CW, WH, CD, wall, 0, F + WH / 2, -CD / 2);
  for (const sx of [-1, 1]) box(0.14, WH, 0.1, trim, sx * (CW / 2 - 0.02), F + WH / 2, 0.01, { shadow: false });
  // the portico: four fluted columns on bases, capitals over them, an entablature with a band of the banner's colour
  const CX = [-1.45, -0.6, 0.6, 1.45];
  for (const x of CX) cyl(0.1, 0.115, WH - 0.16, trim, x, F + 0.08 + (WH - 0.16) / 2, PZ, 14);
  many(new THREE.BoxGeometry(0.3, 0.08, 0.3), trim, CX.flatMap(x => [[x, F + 0.04, PZ], [x, E - 0.04, PZ]]));
  box(3.5, 0.24, 2.6, std({ color: tint(p.wall, 0.94) }), 0, E + 0.12, -0.78);
  box(3.52, 0.06, 0.02, banner, 0, E + 0.13, 0.52, { shadow: false });
  box(3.58, 0.06, 2.66, trim, 0, E + 0.27, -0.78, { shadow: false });
  // the pediment: a gable whose ridge runs front to back, its triangle facing the steps
  const R = E + 0.3, RISE = 0.72;
  gable(2.6, 3.5, RISE, 0.12, roof, wall, 0, R, -0.78, { alongZ: true });
  // the crest in the gable: a Poké Ball, red over white, its black band and button
  const CY = R + 0.3, CZ = 0.53;
  add(new THREE.CircleGeometry(0.22, 24, 0, Math.PI), std({ color: '#e04040', roughness: 0.5 }), 0, CY, CZ, { shadow: false });
  add(new THREE.CircleGeometry(0.22, 24, Math.PI, Math.PI), std({ color: '#f6f6f6', roughness: 0.5 }), 0, CY, CZ, { shadow: false });
  const ink = std({ color: '#2a2a2a', roughness: 0.6 });
  box(0.44, 0.04, 0.01, ink, 0, CY, CZ + 0.004, { shadow: false });
  add(new THREE.TorusGeometry(0.22, 0.018, 6, 28), ink, 0, CY, CZ + 0.004, { shadow: false });
  add(new THREE.CircleGeometry(0.07, 16), ink, 0, CY, CZ + 0.006, { shadow: false });
  add(new THREE.CircleGeometry(0.045, 16), std({ color: '#ffffff' }), 0, CY, CZ + 0.008, { shadow: false });
  // the door's portal: a deep trim surround and a lintel with a gold boss
  for (const sx of [-1, 1]) box(0.1, 1.1, 0.06, trim, sx * 0.38, F + 0.55, 0.03, { shadow: false });
  box(0.86, 0.12, 0.08, trim, 0, F + 1.12, 0.04, { shadow: false });
  add(new THREE.SphereGeometry(0.05, 10, 8), gold, 0, F + 1.12, 0.09, { shadow: false });
  // the banners between the columns: hung from a gold rod, swallow-tailed, a gold emblem on each
  const tail = new THREE.Shape([[-0.15, 0], [0.15, 0], [0.15, -0.68], [0, -0.56], [-0.15, -0.68]].map(([a, b]) => new THREE.Vector2(a, b)));
  for (const sx of [-1, 1]) {
    const bx = sx * 1.02, by = E - 0.18;
    add(new THREE.ShapeGeometry(tail), banner, bx, by, 0.02, { shadow: false });
    box(0.38, 0.03, 0.03, gold, bx, by + 0.01, 0.04, { shadow: false });
    add(new THREE.CircleGeometry(0.075, 16), gold, bx, by - 0.24, 0.025, { shadow: false });
    add(new THREE.CircleGeometry(0.04, 12), banner, bx, by - 0.24, 0.028, { shadow: false });
  }
  // tall lit windows down both sides
  for (const sx of [-1, 1]) for (const wz of [-0.5, -1.5]) win(0, F + 0.8, 0, 0.3, 0.8, trim, { arch: true, to: turned(sx * CW / 2, 0, wz, sx * Math.PI / 2) });
  // fire bowls on posts by the steps, lit
  const fire = lit(std({ color: '#ffb040', emissive: new THREE.Color('#ff8a2a'), roughness: 0.4 }), 1.6, 0.45), iron = std({ color: '#3a3a42', metalness: 0.5, roughness: 0.5 });
  for (const sx of [-1, 1]) {
    cyl(0.04, 0.05, 0.5, iron, sx * 0.95, F + 0.25, 0.68, 8);
    add(new THREE.SphereGeometry(0.15, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), iron, sx * 0.95, F + 0.6, 0.68);
    add(new THREE.ConeGeometry(0.1, 0.24, 8), fire, sx * 0.95, F + 0.68, 0.68, { shadow: false });
  }
  // the statues at the front corners: a Rhydon in grey stone on a plinth, facing out over the steps
  const plinth = std({ color: '#b8b2a6', roughness: 0.9 }), rock = std({ color: '#9a968c', roughness: 0.85 });
  for (const sx of [-1, 1]) {
    const x = sx * 2.02, z = 0.62, y = 0.62;
    box(0.4, 0.56, 0.4, plinth, x, 0.28, z);
    box(0.46, 0.06, 0.46, plinth, x, 0.59, z, { shadow: false });
    const body = add(new THREE.SphereGeometry(0.17, 12, 10), rock, x, y + 0.24, z);
    body.scale.set(1, 1.35, 0.9);
    for (const lx of [-1, 1]) cyl(0.06, 0.07, 0.14, rock, x + lx * 0.09, y + 0.07, z + 0.02, 8);
    add(new THREE.SphereGeometry(0.115, 12, 10), rock, x, y + 0.52, z + 0.05).scale.set(1, 0.9, 1.15);
    const horn = add(new THREE.ConeGeometry(0.035, 0.12, 8), rock, x, y + 0.55, z + 0.17);
    horn.rotation.x = 0.9;
    for (const ex of [-1, 1]) add(new THREE.ConeGeometry(0.03, 0.08, 6), rock, x + ex * 0.07, y + 0.63, z + 0.01).rotation.z = -ex * 0.4;
    for (const ax of [-1, 1]) { const a = cyl(0.03, 0.035, 0.14, rock, x + ax * 0.16, y + 0.28, z + 0.06, 6); a.rotation.x = -0.9; }
    const t = add(new THREE.ConeGeometry(0.06, 0.26, 8), rock, x, y + 0.1, z - 0.2);
    t.rotation.x = -1.2;
  }
  return doorAt(0, F, { colour: p.door, frameM: trim });
}

/** The Poké Ball Dome: one round house shaped like a Poké Ball, its top half in the ball's colour (a Great Ball's
    patches or an Ultra Ball's bands in `mark`), the black band round its middle and the button over the door, which
    comes out to meet you in a black porch; portholes, an aerial with a lit red tip, a red mat and two ball lamps. */
export function balldome(k) {
  const { THREE, p, std, add, box, cyl, lit, porthole, turned, doorAt, stone } = k;
  const R = 1.5, CY = 1.2, Z = -1.2, DZ = 0.4, F = 0.12;
  const top = std({ color: p.top, roughness: 0.35, metalness: 0.1 }), bottom = std({ color: p.bottom, roughness: 0.4 });
  const band = std({ color: p.band, roughness: 0.6 }), mark = std({ color: p.mark, roughness: 0.35, metalness: 0.1 });
  const white = std({ color: p.door, roughness: 0.4 });
  // the stone ring it sits in, and the ball: top and bottom halves, the band round the middle
  cyl(1.08, 1.16, F, stone, 0, F / 2, Z, 28);
  add(new THREE.SphereGeometry(R, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), top, 0, CY, Z);
  add(new THREE.SphereGeometry(R, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bottom, 0, CY, Z);
  cyl(R + 0.015, R + 0.015, 0.17, band, 0, CY, Z, 32);
  // the marks on the top half, either side of the front (the same colour as the top on a plain Poké Ball)
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(R + 0.012, 10, 6, Math.PI / 2 + s * 0.95 - 0.28, 0.56, 0.42, 0.66), mark, 0, CY, Z, { shadow: false });
  // the button over the door: a black ring and its white face, standing out of the band
  const btn = new THREE.CylinderGeometry(0.5, 0.5, 0.14, 32);
  btn.rotateX(Math.PI / 2);
  add(btn, band, 0, CY, Z + R - 0.02);
  const face = new THREE.CylinderGeometry(0.36, 0.36, 0.06, 32);
  face.rotateX(Math.PI / 2);
  add(face, white, 0, CY, Z + R + 0.06);
  // the porch the door stands in: black, from the ball's foot out to the doorstep
  box(0.8, 0.95, 0.7, band, 0, F + 0.475, DZ - 0.35);
  box(0.9, F, 0.3, stone, 0, F / 2, DZ + 0.15);
  // portholes round the bottom half, tilted to the ball's face, framed in the bottom's colour
  for (const a of [-0.75, 0.75]) {
    const y = 0.72, tilt = new THREE.Group();
    tilt.position.set(0, CY, 0);
    tilt.rotation.x = -Math.asin((y - CY) / R);
    turned(0, 0, Z, a).add(tilt);
    porthole(0, 0, R + 0.008, 0.17, std({ color: '#d8d8d8', roughness: 0.4, metalness: 0.3 }), tilt);
  }
  // the aerial on top, its tip lit red
  const steel = std({ color: '#8a8f99', metalness: 0.6, roughness: 0.4 });
  cyl(0.025, 0.035, 0.55, steel, 0, CY + R + 0.25, Z, 8);
  add(new THREE.SphereGeometry(0.06, 10, 8), lit(std({ color: '#ff5a5a', emissive: new THREE.Color('#ff3030'), roughness: 0.3 }), 1.6, 0.4), 0, CY + R + 0.55, Z, { shadow: false });
  // a red mat at the step, and a little ball lamp on a post either side of it
  cyl(0.24, 0.24, 0.02, std({ color: '#e04040', roughness: 0.9 }), 0, 0.01, DZ + 0.3, 24, { shadow: false });
  const glow = lit(std({ color: '#fff4dc', emissive: new THREE.Color('#ffd890'), roughness: 0.3 }), 1.4, 0.3);
  for (const sx of [-1, 1]) {
    cyl(0.025, 0.03, 0.42, steel, sx * 0.75, 0.21, DZ + 0.35, 6);
    add(new THREE.SphereGeometry(0.1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), top, sx * 0.75, 0.47, DZ + 0.35, { shadow: false });
    add(new THREE.SphereGeometry(0.1, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glow, sx * 0.75, 0.47, DZ + 0.35, { shadow: false });
  }
  return doorAt(DZ, F, { arch: true, colour: p.door, frameM: band });
}
