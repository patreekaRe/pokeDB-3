/* hub-houses-feats.js  -  two of the Secret Base's earned houses (docs/roadmap.md's "Secret Base houses", session C): the
   Champion's Keep (a win on the top Trainer Level) and the Stargazer Observatory (the whole Pokédex researched), built
   from js/hub-houses.js's makeHouse() kit `k` as its own builders are, each returning k.doorAt()'s door at x 0. */

/** The Champion's Keep: a square keep of cut stone with battlements, two round towers at its front corners under
    pointed roofs, a gatehouse arch for the door with a portcullis drawn up, a long banner down the front with a gold
    crown on it, torches either side, a flag over it all and a carpet down the step. */
export function keep(k) {
  const { THREE, p, fine, std, add, box, cyl, lit, win, many, tint, doorAt, trim, DW, DH } = k;
  const BW = 2.4, BD = 1.9, H = 2.3, CZ = -1.15, FZ = CZ + BD / 2;
  const masonry = (rx, ry) => { const t = k.texOf(k.art.ashlar(fine)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return std({ map: t, color: p.wall, roughness: 0.95 }); };
  const wall = k.tiled(k.art.ashlar(fine), 1.6, { color: p.wall, roughness: 0.95 }), round = masonry(3, 1.6);
  const deep = std({ color: tint(p.wall, 0.7), roughness: 1 }), roofM = std({ color: p.roof, roughness: 0.7 });
  const banner = std({ color: p.banner, roughness: 0.9, side: THREE.DoubleSide }), gold = std({ color: p.trim, metalness: 0.6, roughness: 0.35 });
  box(BW + 0.2, 0.14, BD + 0.2, deep, 0, 0.07, CZ);
  box(BW, H, BD, wall, 0, 0.14 + H / 2, CZ);
  // the battlements round the keep's top
  const top = 0.14 + H, merl = [];
  box(BW + 0.12, 0.1, BD + 0.12, deep, 0, top + 0.05, CZ, { shadow: false });
  for (let x = -BW / 2 + 0.15; x <= BW / 2 - 0.14; x += 0.3) merl.push([x, top + 0.22, FZ + 0.02], [x, top + 0.22, CZ - BD / 2 - 0.02]);
  for (const sx of [-1, 1]) for (let z = FZ - 0.3; z > CZ - BD / 2 + 0.1; z -= 0.3) merl.push([sx * (BW / 2 + 0.02), top + 0.22, z]);
  many(new THREE.BoxGeometry(0.16, 0.24, 0.16), wall, merl);
  // the towers: round, taller than the keep, a ring of corbels, a pointed roof and a gold ball
  for (const sx of [-1, 1]) {
    const tx = sx * 1.55, tz = FZ - 0.2, TH = 2.95;
    cyl(0.5, 0.54, TH, round, tx, 0.14 + TH / 2, tz, 14);
    cyl(0.6, 0.56, 0.12, deep, tx, 0.14 + TH + 0.06, tz, 14);
    add(new THREE.ConeGeometry(0.64, 1.0, 14), roofM, tx, 0.14 + TH + 0.62, tz);
    add(new THREE.SphereGeometry(0.06, 10, 8), gold, tx, 0.14 + TH + 1.16, tz, { shadow: false });
    for (const y of [1.15, 2.2]) win(0, y, 0, 0.12, 0.3, deep, { arch: true, to: k.turned(tx, 0, tz + 0.53, 0) });
  }
  // the gatehouse: a stone arch stepped out round the door, the portcullis's teeth showing under its crown
  const GW = DW + 0.5, GH = DH + 0.42, GZ = FZ + 0.18;
  for (const sx of [-1, 1]) box(0.25, GH, 0.36, wall, sx * (DW / 2 + 0.125), 0.14 + GH / 2, FZ + 0.0);
  box(GW, 0.3, 0.36, wall, 0, 0.14 + GH + 0.15, FZ);
  add(new THREE.TorusGeometry(DW / 2 + 0.05, 0.05, 6, 16, Math.PI), deep, 0, 0.14 + DH - DW / 2, GZ, { shadow: false });
  const teeth = [];
  for (let x = -DW / 2 + 0.06; x <= DW / 2 - 0.05; x += 0.1) teeth.push([x, 0.14 + DH + 0.1, GZ - 0.02]);
  many(new THREE.ConeGeometry(0.025, 0.12, 4).rotateX(Math.PI), std({ color: '#3a3a40', metalness: 0.5, roughness: 0.5 }), teeth, false);
  box(DW, 0.04, 0.04, std({ color: '#3a3a40', metalness: 0.5, roughness: 0.5 }), 0, 0.14 + DH + 0.17, GZ - 0.02, { shadow: false });
  // windows up the keep's front and the long banner over the gate, a gold crown on it
  for (const sx of [-1, 1]) win(sx * 0.7, 1.75, FZ, 0.2, 0.36, deep, { arch: true });
  add(new THREE.PlaneGeometry(0.48, 0.7), banner, 0, top - 0.42, FZ + 0.2, { shadow: false });
  const tail = new THREE.Shape([[-0.24, 0], [0.24, 0], [0.24, -0.16], [0, -0.04], [-0.24, -0.16]].map(([a, b]) => new THREE.Vector2(a, b)));
  add(new THREE.ShapeGeometry(tail), banner, 0, top - 0.77, FZ + 0.2, { shadow: false });
  const crown = new THREE.Shape([[-0.13, 0], [0.13, 0], [0.15, 0.13], [0.07, 0.06], [0, 0.16], [-0.07, 0.06], [-0.15, 0.13]].map(([a, b]) => new THREE.Vector2(a, b)));
  add(new THREE.ShapeGeometry(crown), gold, 0, top - 0.5, FZ + 0.21, { shadow: false });
  box(0.56, 0.05, 0.05, gold, 0, top - 0.07, FZ + 0.2, { shadow: false });
  for (const sx of [-1, 1]) box(0.03, 0.03, 0.22, gold, sx * 0.26, top - 0.07, FZ + 0.1, { shadow: false });
  // the flag on a pole from the keep's roof
  cyl(0.025, 0.03, 1.0, std({ color: '#5a4a3a' }), 0, top + 0.5, CZ - 0.2, 6);
  add(new THREE.SphereGeometry(0.045, 8, 6), gold, 0, top + 1.02, CZ - 0.2, { shadow: false });
  const flag = add(new THREE.PlaneGeometry(0.6, 0.34), banner, 0.32, top + 0.82, CZ - 0.2, { shadow: false });
  flag.rotation.y = -0.3;
  // torches either side of the gate, lit
  const fire = lit(std({ color: '#ffb040', emissive: new THREE.Color('#ff8a2a'), roughness: 0.5 }), 1.5, 0.35);
  for (const sx of [-1, 1]) {
    const x = sx * 0.78;
    box(0.05, 0.22, 0.05, std({ color: '#3a2a20' }), x, 1.0, FZ + 0.1, { shadow: false }).rotation.z = -sx * 0.2;
    add(new THREE.ConeGeometry(0.06, 0.16, 7), fire, x + sx * 0.02, 1.18, FZ + 0.1, { shadow: false });
  }
  // the step and its carpet
  box(1.1, 0.12, 0.6, deep, 0, 0.06, FZ + 0.4);
  box(0.5, 0.02, 0.62, std({ color: p.banner, roughness: 0.95 }), 0, 0.13, FZ + 0.4, { shadow: false });
  return doorAt(FZ + 0.02, 0.14, { arch: true, colour: p.door, frameM: gold });
}

/** The Stargazer Observatory: a round drum of stone under a metal dome, its shutter open on a slit with a great
    telescope looking out, a low entrance hall in front with a flat roof and a lit fanlight, porthole windows round the
    drum, a gold star turning on the dome's top, and a little telescope on its tripod in the yard. */
export function observatory(k) {
  const { THREE, p, fine, std, add, box, cyl, lit, win, porthole, many, tint, doorAt, trim, stone } = k;
  const DX = 0, DZ = -1.3, R = 1.15, DH0 = 0.16, DRUM = 1.45, top = DH0 + DRUM;
  const tex = k.texOf(k.art.ashlar(fine)); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(5, 1.4);
  const drum = std({ map: tex, color: p.wall, roughness: 0.95 }), deep = std({ color: tint(p.wall, 0.72), roughness: 1 });
  const dome = std({ color: p.dome, roughness: 0.3, metalness: 0.55 }), slit = std({ color: '#141828', roughness: 0.9 });
  const brass = std({ color: '#c8963a', metalness: 0.7, roughness: 0.3 });
  cyl(R + 0.1, R + 0.12, DH0, stone, DX, DH0 / 2, DZ, 20);
  cyl(R, R, DRUM, drum, DX, DH0 + DRUM / 2, DZ, 20);
  cyl(R + 0.06, R + 0.06, 0.08, trim, DX, top, DZ, 20, { shadow: false });
  // portholes round the drum's front half
  for (const a of [-1.0, -0.5, 0.5, 1.0]) porthole(0, 1.05, 0, 0.12, trim, k.turned(DX + Math.sin(a) * (R + 0.005), 0, DZ + Math.cos(a) * (R + 0.005), a));
  // the dome, its ribs, and the shutter slit open from its foot over the top
  add(new THREE.SphereGeometry(R + 0.02, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), dome, DX, top + 0.04, DZ);
  const ribs = new THREE.Group();
  ribs.position.set(DX, top + 0.04, DZ);
  k.still.add(ribs);
  for (let i = 0; i < 8; i++) {
    const rib = add(new THREE.TorusGeometry(R + 0.035, 0.018, 4, 20, Math.PI / 2), trim, 0, 0, 0, { to: ribs, shadow: false });
    rib.rotation.set(0, i / 8 * Math.PI * 2 + Math.PI / 8, Math.PI / 2);
  }
  const SA = 0.45;
  add(new THREE.SphereGeometry(R + 0.03, 3, 10, Math.PI / 2 - 0.16, 0.32, 0, Math.PI / 2 - 0.02), slit, DX, top + 0.04, DZ, { shadow: false });
  // the telescope out of the slit: a long tube tilted up, a brass band and lens rim
  const tube = new THREE.Group();
  tube.position.set(DX, top + 0.5, DZ + 0.35); tube.rotation.x = -SA;
  k.still.add(tube);
  cyl(0.13, 0.11, 1.5, std({ color: '#e8e8f0', roughness: 0.4, metalness: 0.3 }), 0, 0, 0.35, 14, { to: tube }).rotation.x = Math.PI / 2;
  cyl(0.15, 0.15, 0.08, brass, 0, 0, 1.08, 14, { to: tube, shadow: false }).rotation.x = Math.PI / 2;
  cyl(0.14, 0.14, 0.06, brass, 0, 0, -0.1, 14, { to: tube, shadow: false }).rotation.x = Math.PI / 2;
  // the star on the dome's top, gold and lit after dark
  const starS = new THREE.Shape();
  for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 2, r = i % 2 ? 0.07 : 0.17; const pt = [Math.sin(a) * r, Math.cos(a) * r]; if (i) starS.lineTo(...pt); else starS.moveTo(...pt); }
  const star = lit(std({ color: p.star, emissive: new THREE.Color(p.star), roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide }), 1.2, 0.3);
  cyl(0.02, 0.02, 0.35, brass, DX, top + R + 0.2, DZ, 6, { shadow: false });
  add(new THREE.ExtrudeGeometry(starS, { depth: 0.04, bevelEnabled: false }), star, DX, top + R + 0.52, DZ - 0.02, { shadow: false });
  // the entrance hall in front: a low block with a flat roof, a lit fanlight over the door
  const HW = 1.3, HD = 0.75, HH = 1.2, HZ = DZ + R - 0.1, front = HZ + HD;
  box(HW + 0.12, DH0, HD + 0.06, stone, 0, DH0 / 2, HZ + HD / 2);
  box(HW, HH, HD, drum, 0, DH0 + HH / 2, HZ + HD / 2);
  box(HW + 0.14, 0.1, HD + 0.14, trim, 0, DH0 + HH + 0.05, HZ + HD / 2);
  for (const sx of [-1, 1]) box(0.09, HH, 0.09, trim, sx * HW / 2, DH0 + HH / 2, front, { shadow: false });
  win(0, DH0 + 1.02, front, 0.36, 0.12, trim);
  box(0.9, 0.12, 0.34, stone, 0, 0.06, front + 0.17);
  // the little telescope on its tripod, out on the lawn to the right
  const legs = std({ color: '#5a4a3a', roughness: 0.8 }), TX = 1.65, TZ = 0.25;
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2, leg = cyl(0.015, 0.015, 0.62, legs, TX + Math.sin(a) * 0.12, 0.3, TZ + Math.cos(a) * 0.12, 5);
    leg.rotation.set(Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35);
  }
  const scope = cyl(0.045, 0.035, 0.5, brass, TX, 0.68, TZ - 0.05, 10);
  scope.rotation.x = -1.0;
  return doorAt(front, DH0, { arch: true, colour: p.door, frameM: trim });
}
