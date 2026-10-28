/* hub-houses-legend.js  -  two of the Secret Base's earned houses (docs/roadmap.md's "Secret Base houses", session B):
   the Sky Spire (the Sky Pillar's top) and the Crystal Palace (Eternatus beaten), built from makeHouse()'s `kit` in
   js/hub-houses.js as the houses there are, each returning its door. */

/** The Sky Spire: an eight-sided stone tower tapering like the Sky Pillar on a wide stepped base, bands of its colour up
    it, arched slit windows lit after dark, battlements round the top and a pennant on a pole; an arched porch for the
    door, little isles of grassy rock floating beside it and a cloud or two caught on it. */
export function spire(k) {
  const { THREE, p, std, add, box, cyl, many, lit, win, turned, doorAt, trim, winter } = k;
  const TZ = -1.1, Y0 = 0.28, TH = 3.3, R0 = 0.9, R1 = 0.68, C8 = Math.cos(Math.PI / 8);
  const rAt = (y) => R0 + (R1 - R0) * (y - Y0) / TH, eight = (geo) => { geo.rotateY(Math.PI / 8); return geo; };
  const masonry = (rep) => { const t = k.texOf(k.art.ashlar(k.fine)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, 1.2); return std({ map: t, color: p.wall, roughness: 0.95 }); };
  const wall = masonry(6), rough = k.tiled(k.art.stone(k.fine), 2, { color: k.tint(p.wall, 0.82), roughness: 1 });
  const band = std({ color: p.roof, roughness: 0.6 });
  // the base: two broad eight-sided steps of rough stone, a trim lip on each
  for (const [r, y, h] of [[1.55, 0.07, 0.14], [1.32, 0.21, 0.14]]) {
    add(eight(new THREE.CylinderGeometry(r, r + 0.03, h, 8)), rough, 0, y, TZ);
    add(eight(new THREE.CylinderGeometry(r + 0.01, r + 0.01, 0.03, 8)), trim, 0, y + h / 2, TZ, { shadow: false });
  }
  // the tower in four courses, a band of the paint between each
  const N = 4, S = TH / N;
  for (let i = 0; i < N; i++) {
    const a = Y0 + i * S, b = a + S;
    add(eight(new THREE.CylinderGeometry(rAt(b), rAt(a), S, 8)), wall, 0, (a + b) / 2, TZ);
    if (i) add(eight(new THREE.CylinderGeometry(rAt(a) + 0.04, rAt(a) + 0.04, 0.1, 8)), band, 0, a, TZ);
  }
  // the top: a corbelled lip, a stone floor and merlons round its edge, a pole with the pennant
  const T = Y0 + TH;
  add(eight(new THREE.CylinderGeometry(R1 + 0.16, R1 + 0.02, 0.18, 8)), wall, 0, T + 0.09, TZ);
  add(eight(new THREE.CylinderGeometry(R1 + 0.17, R1 + 0.17, 0.05, 8)), trim, 0, T + 0.2, TZ, { shadow: false });
  const merlons = [];
  for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * Math.PI * 2, r = (R1 + 0.1) * C8; merlons.push([Math.sin(a) * r, T + 0.34, TZ + Math.cos(a) * r, a]); }
  many(new THREE.BoxGeometry(0.16, 0.24, 0.12), wall, merlons);
  const pole = std({ color: '#6a5a4a', roughness: 0.7 });
  cyl(0.025, 0.03, 0.8, pole, 0, T + 0.6, TZ, 6);
  add(new THREE.SphereGeometry(0.045, 8, 6), std({ color: '#e8c040', metalness: 0.6, roughness: 0.3 }), 0, T + 1.02, TZ, { shadow: false });
  const flag = new THREE.Shape();
  flag.moveTo(0, 0); flag.lineTo(0.62, -0.06); flag.lineTo(0.42, -0.13); flag.lineTo(0.66, -0.24); flag.lineTo(0, -0.3); flag.lineTo(0, 0);
  add(new THREE.ShapeGeometry(flag), std({ color: p.roof, side: THREE.DoubleSide, roughness: 0.7 }), 0.02, T + 0.98, TZ, { shadow: false }).rotation.y = -0.35;
  // arched slit windows: up the front, and on the two faces either side of it a course higher
  for (const y of [2.05, 2.75, 3.3]) win(0, y, TZ + rAt(y) * C8 + 0.01, 0.14, 0.34, trim, { arch: true });
  for (const sx of [-1, 1]) for (const y of [1.65, 2.55]) {
    const d = rAt(y) * C8 + 0.01, a = sx * Math.PI / 4;
    win(0, y, 0, 0.13, 0.3, trim, { arch: true, to: turned(Math.sin(a) * d, 0, TZ + Math.cos(a) * d, a) });
  }
  // the porch: a stone arch stepped out from the tower, the door in it, a lamp each side
  const PZ0 = TZ + R0 * C8 - 0.08, PZ1 = 0.05, PW = 0.86, PH = 1.02;
  box(PW, PH, PZ1 - PZ0, wall, 0, Y0 + PH / 2, (PZ0 + PZ1) / 2);
  const vault = new THREE.CylinderGeometry(PW / 2, PW / 2, PZ1 - PZ0, 12, 1, false, -Math.PI / 2, Math.PI);
  vault.rotateX(Math.PI / 2);
  add(vault, wall, 0, Y0 + PH, (PZ0 + PZ1) / 2);
  add(new THREE.TorusGeometry(PW / 2 + 0.01, 0.035, 6, 14, Math.PI), band, 0, Y0 + PH, PZ1 + 0.01, { shadow: false });
  const lamp = lit(std({ color: '#fff0c0', emissive: new THREE.Color('#ffc860'), roughness: 0.3 }), 1.4, 0.3);
  for (const sx of [-1, 1]) {
    box(0.04, 0.1, 0.06, pole, sx * 0.55, Y0 + 0.92, PZ1 - 0.12, { shadow: false });
    box(0.1, 0.14, 0.1, lamp, sx * 0.55, Y0 + 0.82, PZ1 - 0.08, { shadow: false });
  }
  // the floating isles: an upturned cone of rock, a grassy top, a tuft
  const rock = std({ color: '#8f8a80', roughness: 1, flatShading: true }), grass = std({ color: winter ? '#e8eef2' : '#6aa04a', roughness: 0.9 });
  for (const [x, y, z, s] of [[-1.72, 2.3, -0.8, 1], [1.74, 2.95, -1.6, 0.85], [1.82, 1.5, -0.25, 0.7]]) {
    const cone = add(new THREE.ConeGeometry(0.34 * s, 0.5 * s, 7), rock, x, y - 0.25 * s, z);
    cone.rotation.x = Math.PI;
    add(new THREE.CylinderGeometry(0.36 * s, 0.34 * s, 0.07 * s, 7), grass, x, y + 0.03 * s, z);
    add(new THREE.ConeGeometry(0.06 * s, 0.16 * s, 5), grass, x + 0.12 * s, y + 0.14 * s, z - 0.05, { shadow: false });
  }
  // two clouds caught on it, flattened puffs
  const cloud = std({ color: '#ffffff', roughness: 1, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.25 });
  for (const [x, y, z] of [[-1.55, 3.4, -1.7], [1.5, 2.25, -2.0]]) for (const [dx, dy, r] of [[-0.24, 0, 0.17], [0, 0.05, 0.22], [0.25, 0, 0.16]]) add(new THREE.SphereGeometry(r, 10, 7), cloud, x + dx, y + dy, z, { shadow: false }).scale.y = 0.62;
  return doorAt(PZ1, Y0, { arch: true, colour: p.door, frameM: trim });
}

/** The Crystal Palace: a white stone hall on a plinth, a wide lower storey and a narrower one over it, grown through with
    six-sided crystal spires that glow after dark (their bodies the crystal, their tips its second colour), the tallest
    over the arched door; arched windows lit in crystal light, crystals at the plinth's corners and shards floating
    round it. */
export function crystal(k) {
  const { THREE, p, std, add, box, lit, doorAt, trim } = k;
  const wall = k.tiled(k.art.ashlar(k.fine), 2, { color: p.wall, roughness: 0.8 }), plinth = std({ color: k.tint(p.wall, 0.88), roughness: 0.9 });
  const body = lit(std({ color: p.crystal, emissive: new THREE.Color(p.crystal), roughness: 0.25, metalness: 0.15, flatShading: true }), 0.9, 0.18);
  const tip = lit(std({ color: p.crystal2, emissive: new THREE.Color(p.crystal2), roughness: 0.2, metalness: 0.1, flatShading: true }), 1.1, 0.22);
  const pane = lit(std({ color: p.crystal2, emissive: new THREE.Color(p.crystal2), roughness: 0.3 }), 1.2, 0.2);
  const F = 0.18, LZ = -1.15, LW = 3.5, LD = 1.7, LH = 0.78, L1 = F + LH, HZ = -1.3, HW = 2.0, HD = 1.3, HH = 0.92, H1 = L1 + HH;
  box(LW + 0.3, F, LD + 0.3, plinth, 0, F / 2, LZ);
  box(1.1, 0.09, 0.32, plinth, 0, 0.045, 0.28);
  box(LW, LH, LD, wall, 0, F + LH / 2, LZ);
  box(LW + 0.1, 0.08, LD + 0.1, trim, 0, L1, LZ, { shadow: false });
  box(HW, HH, HD, wall, 0, L1 + HH / 2, HZ);
  box(HW + 0.1, 0.08, HD + 0.1, trim, 0, H1, HZ, { shadow: false });
  // a crystal: a six-sided body and its pointed tip, leaning `lean` out from the middle
  const shard = (x, y, z, r, h, lean = 0, ry = 0) => {
    const g = new THREE.Group();
    g.position.set(x, y, z); g.rotation.set(0, ry, lean);
    k.still.add(g);
    const tipH = r * 2.4;
    add(new THREE.CylinderGeometry(r, r * 1.12, h - tipH, 6), body, 0, (h - tipH) / 2, 0, { to: g });
    add(new THREE.ConeGeometry(r, tipH, 6), tip, 0, h - tipH / 2, 0, { to: g });
  };
  // the crown of spires on the hall, the tallest over the door, and a lower one at each end of the lower storey
  shard(0, H1 - 0.1, HZ + 0.42, 0.21, 2.35, 0, 0.3);
  for (const sx of [-1, 1]) {
    shard(sx * 0.46, H1 - 0.1, HZ + 0.3, 0.17, 1.6, -sx * 0.08, 0.5);
    shard(sx * 0.82, H1 - 0.1, HZ + 0.1, 0.15, 1.05, -sx * 0.22, 0.2);
    shard(sx * 0.3, H1 - 0.1, HZ - 0.35, 0.16, 1.85, -sx * 0.05, 0.1);
    shard(sx * 1.5, L1 - 0.1, LZ + 0.25, 0.16, 1.25, -sx * 0.16, 0.4);
    shard(sx * 1.2, L1 - 0.1, LZ - 0.45, 0.13, 0.85, -sx * 0.3, 0.7);
  }
  // little crystals growing at the plinth's front corners
  for (const sx of [-1, 1]) for (const [dx, dz, r, h, lean] of [[0, 0, 0.1, 0.55, 0], [0.16, 0.08, 0.07, 0.34, -0.4], [-0.14, 0.1, 0.06, 0.28, 0.45]]) shard(sx * (1.88 + dx), 0, 0.18 + dz, r, h, sx * lean, dx * 3);
  // arched windows in crystal light: a pane, its round top, a white frame
  const arched = (x, y, z, w, h) => {
    add(new THREE.PlaneGeometry(w, h), pane, x, y, z + 0.012, { shadow: false });
    add(new THREE.CircleGeometry(w / 2, 12, 0, Math.PI), pane, x, y + h / 2, z + 0.012, { shadow: false });
    add(new THREE.TorusGeometry(w / 2 + 0.02, 0.025, 6, 14, Math.PI), trim, x, y + h / 2, z + 0.02, { shadow: false });
    box(w + 0.08, 0.05, 0.05, trim, x, y - h / 2 - 0.02, z + 0.02, { shadow: false });
    for (const sx of [-1, 1]) box(0.05, h + 0.06, 0.05, trim, x + sx * (w / 2 + 0.02), y, z + 0.02, { shadow: false });
  };
  for (const x of [-1.35, -0.85, 0.85, 1.35]) arched(x, F + 0.32, LZ + LD / 2, 0.24, 0.32);
  for (const x of [-0.62, 0.62]) arched(x, L1 + 0.36, HZ + HD / 2, 0.22, 0.36);
  // the porch: a white arch stepped out, the door in it, a crystal keystone
  const PZ0 = LZ + LD / 2 - 0.05, PZ1 = 0.08, PW = 0.84, PH = 0.98;
  box(PW, PH, PZ1 - PZ0, wall, 0, F + PH / 2, (PZ0 + PZ1) / 2);
  const vault = new THREE.CylinderGeometry(PW / 2, PW / 2, PZ1 - PZ0, 12, 1, false, -Math.PI / 2, Math.PI);
  vault.rotateX(Math.PI / 2);
  add(vault, wall, 0, F + PH, (PZ0 + PZ1) / 2);
  add(new THREE.TorusGeometry(PW / 2 + 0.01, 0.035, 6, 14, Math.PI), trim, 0, F + PH, PZ1 + 0.01, { shadow: false });
  add(new THREE.OctahedronGeometry(0.08), tip, 0, F + PH + PW / 2 + 0.02, PZ1 + 0.02, { shadow: false }).scale.y = 1.5;
  // shards floating round it, turning nowhere (still)
  const float = new THREE.OctahedronGeometry(0.1);
  float.scale(1, 2.1, 1);
  k.many(float, body, [[-1.92, 1.7, -0.6, 0.3], [1.9, 2.1, -0.9, 1.1], [-1.4, 2.9, -1.9, 0.6], [1.35, 3.1, -1.8, 2.0], [-1.95, 0.95, -1.7, 0.9]], false);
  return doorAt(PZ1, F, { arch: true, colour: p.door, frameM: trim });
}
