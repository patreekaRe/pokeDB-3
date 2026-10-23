/* hub-houses-towns.js  -  two of the Secret Base's Estate houses after the gateway towns (docs/roadmap.md's "Secret Base
   houses", session C): the Desert Riad (Sunwell Bazaar's) and the Lantern Pagoda (Lantern Village's), built from
   js/hub-houses.js's makeHouse() kit `k` as its own builders are, each returning k.doorAt()'s door at x 0. */

/** The Desert Riad: two storeys of smooth adobe under a flat roof with a stepped parapet, a horseshoe arch for the door
    framed in tiles of the paint's colour, a band of the same tiles along the foot, arched windows behind carved wooden
    screens, a little domed tower on the roof with a gold finial, brass lanterns either side of the door, a palm and
    potted plants. */
export function riad(k) {
  const { THREE, p, fine, std, add, box, cyl, lit, win, many, tint, doorAt, trim, DW, DH } = k;
  const BW = 3.3, BD = 2.1, H = 2.15, CZ = -BD / 2;
  const adobe = std({ color: p.wall, roughness: 1 }), deep = std({ color: tint(p.wall, 0.82), roughness: 1 });
  const tile = std({ color: p.tile, roughness: 0.35, metalness: 0.1 }), wood = std({ color: tint(p.door, 0.8), roughness: 0.85 });
  const gold = std({ color: '#e0b040', metalness: 0.7, roughness: 0.3 });
  box(BW + 0.12, 0.1, BD + 0.12, deep, 0, 0.05, CZ);
  box(BW, H, BD, adobe, 0, 0.1 + H / 2, CZ);
  box(BW + 0.02, 0.22, 0.03, tile, 0, 0.21, 0.005, { shadow: false });
  box(BW + 0.06, 0.06, BD + 0.06, deep, 0, 0.1 + H * 0.52, CZ, { shadow: false });
  // the parapet: a lip round the roof, merlons stepped in threes along the front and sides
  const top = 0.1 + H;
  box(BW + 0.1, 0.1, BD + 0.1, deep, 0, top + 0.05, CZ);
  const merl = [];
  for (let x = -BW / 2 + 0.16; x <= BW / 2 - 0.15; x += 0.34) merl.push([x, top + 0.2, 0.0]);
  for (const sx of [-1, 1]) for (let z = -0.3; z > -BD + 0.1; z -= 0.34) merl.push([sx * (BW / 2 - 0.02), top + 0.2, z, Math.PI / 2]);
  many(new THREE.BoxGeometry(0.18, 0.22, 0.1), adobe, merl);
  // the door's frame: a tile panel, the horseshoe arch over it, a carved lintel band
  box(DW + 0.42, DH + 0.42, 0.04, tile, 0, 0.1 + (DH + 0.42) / 2, 0.02, { shadow: false });
  add(new THREE.TorusGeometry(DW / 2 + 0.1, 0.06, 6, 18, Math.PI * 1.2), deep, 0, 0.1 + DH - DW / 2, 0.05, { shadow: false }).rotation.z = -Math.PI * 0.1;
  box(DW + 0.6, 0.08, 0.06, deep, 0, 0.1 + DH + 0.48, 0.04, { shadow: false });
  box(1.1, 0.1, 0.36, deep, 0, 0.05, 0.18);
  // arched windows: two either side downstairs behind screens, three up top
  const screens = [];
  for (const x of [-1.15, 1.15]) {
    win(x, 0.85, 0, 0.36, 0.5, wood, { arch: true });
    for (let i = -1; i <= 1; i++) screens.push([x + i * 0.11, 0.85, 0.035]);
  }
  many(new THREE.BoxGeometry(0.025, 0.5, 0.02), wood, screens, false);
  for (const x of [-1.05, 0, 1.05]) win(x, 1.72, 0, 0.3, 0.4, trim, { arch: true });
  // a balcony of carved wood over the door
  box(0.9, 0.05, 0.22, wood, 0, 1.38, 0.11);
  const bal = [];
  for (let x = -0.4; x <= 0.41; x += 0.1) bal.push([x, 1.5, 0.21]);
  many(new THREE.BoxGeometry(0.03, 0.22, 0.03), wood, bal, false);
  box(0.92, 0.04, 0.04, wood, 0, 1.62, 0.21, { shadow: false });
  // the domed tower at the back right of the roof
  const TX = 0.95, TZ = -1.45;
  box(0.78, 0.62, 0.78, adobe, TX, top + 0.31, TZ);
  box(0.86, 0.06, 0.86, deep, TX, top + 0.65, TZ, { shadow: false });
  for (const sx of [-1, 1]) win(TX + sx * 0.18, top + 0.32, TZ + 0.39, 0.12, 0.26, trim, { arch: true });
  add(new THREE.SphereGeometry(0.38, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: p.dome, roughness: 0.4, metalness: 0.15 }), TX, top + 0.68, TZ).scale.y = 1.25;
  cyl(0.02, 0.02, 0.28, gold, TX, top + 1.3, TZ, 6, { shadow: false });
  add(new THREE.SphereGeometry(0.05, 10, 8), gold, TX, top + 1.2, TZ, { shadow: false });
  add(new THREE.TorusGeometry(0.06, 0.016, 6, 12, Math.PI * 1.5), gold, TX, top + 1.45, TZ, { shadow: false }).rotation.z = Math.PI * 0.75;
  // brass lanterns either side of the door, lit
  const glass = lit(std({ color: '#ffe0a0', emissive: new THREE.Color('#ffb850'), roughness: 0.3 }), 1.4, 0.3);
  for (const sx of [-1, 1]) {
    const x = sx * 0.66;
    box(0.03, 0.14, 0.12, gold, x, 1.0, 0.07, { shadow: false });
    add(new THREE.OctahedronGeometry(0.1, 0), glass, x, 0.83, 0.13, { shadow: false }).scale.y = 1.5;
    add(new THREE.ConeGeometry(0.07, 0.1, 6), gold, x, 0.99, 0.13, { shadow: false });
  }
  // a date palm at the front left: a leaning ringed trunk, a crown of fronds
  const palmBark = std({ color: '#8a6a44', roughness: 1, flatShading: true }), frond = std({ color: '#3f8a3a', roughness: 0.9, side: THREE.DoubleSide });
  let px = -1.82, py = 0;
  for (let i = 0; i < 6; i++) { cyl(0.075, 0.09, 0.42, palmBark, px, py + 0.21, 0.35, 7).rotation.z = -0.06; px += 0.025; py += 0.41; }
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, f = new THREE.Group();
    f.position.set(px, py, 0.35); f.rotation.y = a;
    k.still.add(f);
    const leaf = add(new THREE.PlaneGeometry(0.18, 0.6), frond, 0, 0.0, 0.27, { to: f, shadow: false });
    leaf.rotation.x = -1.1;
  }
  add(new THREE.SphereGeometry(0.06, 8, 6), std({ color: '#7a4a1a' }), px, py - 0.05, 0.42, { shadow: false });
  // potted plants on the step's sides
  const pot = std({ color: '#b8603a', roughness: 0.8 }), bush = std({ color: '#4f8a3a', roughness: 0.95, flatShading: true });
  for (const [x, z] of [[1.75, 0.3], [-0.8, 0.32]]) {
    cyl(0.13, 0.09, 0.22, pot, x, 0.11, z, 10);
    add(new THREE.IcosahedronGeometry(0.15, 0), bush, x, 0.32, z);
  }
  return doorAt(0.03, 0.1, { arch: true, colour: p.door, frameM: deep });
}

/** The Lantern Pagoda: three storeys on a stone base, each narrower, each under a broad tiled hip roof whose corners
    sweep up, red columns along the ground floor's front, lit shoji between them, paper lanterns hung at every corner of
    the eaves in the paint's glow, a gilt spire of rings on top, and a stone lantern either side of the step. */
export function pagoda(k) {
  const { THREE, p, fine, std, add, box, cyl, tiled, lit, hip, many, tint, doorAt, stone } = k;
  const CZ = -1.05;
  const col = std({ color: p.wall, roughness: 0.6 }), plaster = std({ color: p.plaster, roughness: 0.9 });
  const tile = tiled(k.art.tile(fine), 2.4, { color: p.roof, roughness: 0.7 }), dark = std({ color: tint(p.roof, 0.72), roughness: 0.7 });
  const gold = std({ color: '#e0b040', metalness: 0.7, roughness: 0.3 });
  const paper = lit(std({ color: '#f6f0dc', emissive: new THREE.Color('#ffd88a'), roughness: 0.9 }), 0.9, 0.12);
  const lantern = lit(std({ color: p.lantern, emissive: new THREE.Color(p.lantern), roughness: 0.6 }), 1.3, 0.35), ink = std({ color: '#22222a' });
  box(3.2, 0.22, 2.4, stone, 0, 0.11, CZ);
  box(1.0, 0.1, 0.3, stone, 0, 0.05, 0.27);
  // a storey: plaster walls with columns at its corners, its roof's soffit and hip, the corners swept up, lanterns
  const lamps = [], tips = [];
  const storey = (w, d, y, h, rw, rd, rise) => {
    box(w, h, d, plaster, 0, y + h / 2, CZ);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.11, h, 0.11, col, sx * w / 2, y + h / 2, CZ + sz * d / 2);
    box(w + 0.08, 0.08, d + 0.08, col, 0, y + h - 0.04, CZ, { shadow: false });
    const e = y + h;
    box(rw - 0.1, 0.06, rd - 0.1, dark, 0, e + 0.03, CZ);
    hip(rw, rd, rise, tile, 0, e + 0.06, CZ);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      tips.push([sx * (rw / 2 - 0.02), e + 0.12, CZ + sz * (rd / 2 - 0.02), Math.atan2(sx, sz)]);
      lamps.push([sx * (rw / 2 - 0.2), e - 0.12, CZ + sz * (rd / 2 - 0.2)]);
    }
    return e + 0.06 + rise;
  };
  let y = storey(2.3, 1.7, 0.22, 1.12, 3.1, 2.45, 0.5);
  // the ground floor's front: two more red columns, lit shoji either side of the door
  for (const sx of [-1, 1]) box(0.11, 1.12, 0.11, col, sx * 0.42, 0.22 + 0.56, CZ + 0.86);
  const bars = [];
  for (const x of [-0.8, 0.8]) {
    box(0.6, 0.62, 0.02, paper, x, 0.86, CZ + 0.86, { shadow: false });
    for (let i = 1; i < 4; i++) bars.push([x - 0.3 + i * 0.15, 0.86, CZ + 0.875]);
  }
  many(new THREE.BoxGeometry(0.022, 0.62, 0.022), col, bars, false);
  y = storey(1.6, 1.2, y - 0.38, 0.72, 2.3, 1.85, 0.42);
  for (const x of [-0.38, 0.38]) box(0.4, 0.38, 0.02, paper, x, y - 0.72, CZ + 0.61, { shadow: false });
  y = storey(1.05, 0.82, y - 0.34, 0.58, 1.65, 1.3, 0.62);
  box(0.42, 0.3, 0.02, paper, 0, y - 0.95, CZ + 0.42, { shadow: false });
  // the corners swept up: a little upturned spur on each hip's corner
  const spur = new THREE.ConeGeometry(0.06, 0.28, 5);
  spur.rotateX(-0.9);
  many(spur, dark, tips, false);
  // the spire: a base, nine gilt rings and a jewel on top
  box(0.26, 0.16, 0.26, dark, 0, y + 0.02, CZ);
  cyl(0.025, 0.025, 0.6, gold, 0, y + 0.4, CZ, 6, { shadow: false });
  many(new THREE.TorusGeometry(0.07, 0.018, 6, 14).rotateX(Math.PI / 2), gold, [...Array(7)].map((_, i) => [0, y + 0.18 + i * 0.065, CZ]), false);
  add(new THREE.SphereGeometry(0.06, 10, 8), gold, 0, y + 0.74, CZ, { shadow: false });
  // the paper lanterns under the eaves' corners
  const ball = new THREE.SphereGeometry(0.1, 12, 8);
  ball.scale(1, 1.3, 1);
  many(ball, lantern, lamps, false);
  many(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 8), ink, lamps.map(([x, ly, z]) => [x, ly + 0.13, z]), false);
  // a stone lantern either side of the step
  for (const sx of [-1, 1]) {
    const x = sx * 1.25, z = 0.38;
    cyl(0.12, 0.16, 0.08, stone, x, 0.04, z, 6);
    cyl(0.05, 0.06, 0.34, stone, x, 0.25, z, 6);
    box(0.24, 0.18, 0.24, stone, x, 0.5, z);
    box(0.13, 0.1, 0.02, lantern, x, 0.5, z + 0.121, { shadow: false });
    add(new THREE.ConeGeometry(0.22, 0.14, 4), dark, x, 0.66, z).rotation.y = Math.PI / 4;
  }
  return doorAt(CZ + 0.88, 0.22, { colour: p.door, frameM: col });
}
