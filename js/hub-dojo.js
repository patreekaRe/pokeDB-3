/* hub-dojo.js  -  Chad Master Kenmatta's dojo in the Clearing, open (the user's ask, 2026-10-15: "super aesthetic... make
   it extravagant"; it was a small boarded-up hall under a COMING SOON banner). A temple hall on a two-tier granite
   podium: vermilion columns round a veranda, white walls of glowing shoji, a navy noren over the door, a curved gable
   (karahafu) over the entrance, two tiers of sweeping glazed roofs with gold eaves and hips, gold shachihoko on the
   ridge, a lacquered 道場 plaque, red paper lanterns, stone lanterns and victory banners at its foot (its two cherry
   trees taken out 2026-10-15, the user's call). js/hub-3d.js builds it as the 'dojo' place; its door walks you into the hall
   (js/event-3d.js's buildDojoHall()). Only emissive paint glows at night (no light of its own: a new light in the
   Clearing would recompile every material in it). */

const LIFT = 0.42;   // the podium's top

/** Glazed roof tiles: round channels running down the slope, a course line every row. */
function tileArt(fine) {
  const { c, g, lin } = fine(16, 16, 8);
  g.fillStyle = '#1c2c38'; g.fillRect(0, 0, 16, 16);
  for (let x = 0; x < 16; x += 4) { g.fillStyle = lin(x, 0, x + 4, 0, ['#22384a', '#4a7488', '#2e4a5c', '#1a2a36']); g.fillRect(x + 0.2, 0, 3.6, 16); }
  g.fillStyle = 'rgba(10,18,24,0.55)';
  for (let y = 3.6; y < 16; y += 4) g.fillRect(0, y, 16, 0.5);
  g.fillStyle = 'rgba(200,230,240,0.18)';
  for (let x = 1.4; x < 16; x += 4) g.fillRect(x, 0, 0.5, 16);
  return c;
}

/** The hall's front: white plaster over dark timber, glowing shoji bays either side, the doorway in the middle hung with
    a navy noren split in three, the fist crest on it, warm light behind. Its shine() lights the paper and the doorway. */
function frontArt(fine, w, h) {
  const k = 20, W = w * k, H = h * k, f = fine(W, H, 6), { g, rr, lin } = f, s = f.shine();
  g.fillStyle = lin(0, 0, 0, H, ['#f6f0e2', '#ece2cc']); g.fillRect(0, 0, W, H);
  const door = [W / 2 - 10, W / 2 + 10], top = 6, base = H - 2.4;
  // shoji bays: paper behind a fine lattice, framed in black timber
  const bays = [[2, door[0] - 3], [door[1] + 3, W - 2]];
  for (const [a, b] of bays) {
    const n = Math.max(1, Math.round((b - a) / 11));
    for (let i = 0; i < n; i++) {
      const x0 = a + (b - a) * i / n + 0.8, x1 = a + (b - a) * (i + 1) / n - 0.8;
      g.fillStyle = lin(0, top, 0, base, ['#fff8e4', '#f8e8c4']); g.fillRect(x0, top, x1 - x0, base - top);
      s.fillStyle = '#ffd890'; s.fillRect(x0, top, x1 - x0, base - top);
      g.strokeStyle = '#3a2416'; g.lineWidth = 0.35;
      for (let x = x0 + 2.3; x < x1 - 0.5; x += 2.3) { g.beginPath(); g.moveTo(x, top); g.lineTo(x, base); g.stroke(); }
      for (let y = top + 2.6; y < base - 0.5; y += 2.6) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
      g.strokeStyle = '#2a180c'; g.lineWidth = 1.1; g.strokeRect(x0, top, x1 - x0, base - top);
    }
  }
  // the timber frame: posts, the head rail and the sill
  g.fillStyle = '#2a180c';
  for (const x of [0, door[0] - 2, door[1] + 0.5, W - 1.5]) g.fillRect(x, 0, 1.5, H);
  g.fillRect(0, top - 1.6, W, 1.6); g.fillRect(0, base, W, H - base);
  g.fillStyle = '#c8a040'; g.fillRect(0, top - 2, W, 0.4); g.fillRect(0, base, W, 0.4);
  // the doorway: warm light inside, tatami glimpsed, the noren hanging half down it
  g.fillStyle = lin(0, top, 0, base, ['#f8c070', '#ffe2a8', '#e8a050']); g.fillRect(door[0], top, door[1] - door[0], base - top);
  s.fillStyle = '#ffc070'; s.fillRect(door[0], top, door[1] - door[0], base - top);
  g.fillStyle = '#c8b870'; g.fillRect(door[0], base - 3, door[1] - door[0], 3);
  const nb = top + (base - top) * 0.55, nw = (door[1] - door[0]) / 3;
  for (let i = 0; i < 3; i++) {
    const x = door[0] + i * nw;
    g.fillStyle = lin(x, 0, x + nw, 0, ['#1a2a5a', '#24387a', '#1a2a5a']);
    g.beginPath(); g.moveTo(x + 0.2, top); g.lineTo(x + nw - 0.2, top); g.lineTo(x + nw - 0.2 + (i - 1) * 0.3, nb); g.lineTo(x + 0.2 + (i - 1) * 0.3, nb); g.closePath(); g.fill();
    s.fillStyle = '#000'; s.fillRect(x, top, nw, nb - top);
  }
  g.fillStyle = '#f4f0e6'; g.fillRect(door[0], top, door[1] - door[0], 0.8);
  // the crest across the noren: a white ring, a red fist in it
  const cx = W / 2, cy = top + (nb - top) * 0.5;
  g.strokeStyle = '#f4f0e6'; g.lineWidth = 0.8; g.beginPath(); g.arc(cx, cy, 3.6, 0, Math.PI * 2); g.stroke();
  rr(cx - 1.9, cy - 1.6, 3.8, 3.2, 1, '#d83024');
  g.fillStyle = '#a81810'; for (let i = 0; i < 3; i++) g.fillRect(cx - 1.5 + i * 1.15, cy - 1.5, 0.25, 1.4);
  rr(cx - 2.4, cy - 0.6, 1.2, 2, 0.5, '#d83024');
  return f.c;
}

/** The lacquered plaque under the upper roof: 道場 in gold, framed in gold, KENMATTA under it. */
function plaqueArt(fine) {
  const { c, g, rr, lin } = fine(40, 18, 10);
  rr(0, 0, 40, 18, 1.6, lin(0, 0, 40, 18, ['#f8d870', '#b07818', '#f0c850']));
  rr(1.3, 1.3, 37.4, 15.4, 1, lin(0, 0, 0, 18, ['#2a1410', '#120806']));
  g.strokeStyle = '#d8a838'; g.lineWidth = 0.35; g.strokeRect(2.4, 2.4, 35.2, 13.2);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 9px "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif';
  g.fillStyle = '#ffe080'; g.fillText('道場', 20, 8);
  g.font = '900 3.1px "Trebuchet MS", "Arial Black", sans-serif';
  g.fillText('KENMATTA', 20, 14.2);
  return c;
}

/** The small board on the gable's lintel: KENMATTA DOJO in gold. */
function lintelArt(fine) {
  const { c, g, rr, lin } = fine(44, 8, 10);
  rr(0, 0, 44, 8, 1, lin(0, 0, 0, 8, ['#e8c058', '#a87018']));
  rr(0.8, 0.8, 42.4, 6.4, 0.6, '#1a0c08');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 4.2px "Trebuchet MS", "Arial Black", sans-serif';
  g.fillStyle = '#ffd860'; g.fillText('KENMATTA  DOJO', 22, 4.3);
  return c;
}

/** A victory banner: red, white edges, 必勝 down it in white, a gold fist at the head. */
function bannerArt(fine, red) {
  const { c, g, lin } = fine(8, 36, 12);
  g.fillStyle = lin(0, 0, 8, 0, red ? ['#a01810', '#d83024', '#a01810'] : ['#e8e0d0', '#fffaf0', '#e8e0d0']); g.fillRect(0, 0, 8, 36);
  g.fillStyle = red ? '#fff4e0' : '#c82818'; g.fillRect(0, 0, 0.8, 36); g.fillRect(7.2, 0, 0.8, 36);
  g.fillStyle = '#e8b840'; g.beginPath(); g.arc(4, 4.5, 2.4, 0, Math.PI * 2); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 5.6px "Hiragino Mincho ProN", "Yu Mincho", "MS Mincho", serif';
  g.fillStyle = red ? '#fff8e8' : '#b81810';
  g.fillText('必', 4, 13); g.fillText('勝', 4, 20.5);
  g.font = '900 2.2px "Trebuchet MS", sans-serif';
  g.fillText('FORTIFY', 4, 27.5); g.fillText('YOUR MIND', 4, 30.5);
  return c;
}

/** A hipped temple roof, ridge along x, its slopes sagging (steep at the ridge, flat at the eaves) and its corners
    sweeping up: the top surface, its soffit, and the curves of its eave and four hips for gold trim. */
function templeRoof(THREE, w, d, h, sweep) {
  const g = new THREE.PlaneGeometry(w, d, 44, 28);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, uv = g.attributes.uv, hw = w / 2, hd = d / 2;
  const at = (x, z) => {
    const e = Math.max(0, Math.min(hw - Math.abs(x), hd - Math.abs(z))), t = e / hd;
    return h * t ** 1.55 + sweep * (Math.abs(x) / hw) ** 6 * (Math.abs(z) / hd) ** 6;
  };
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, at(x, z));
    const side = hd - Math.abs(z) <= hw - Math.abs(x);
    uv.setXY(i, side ? x * 2.4 : z * 2.4, side ? z * 2.4 : x * 2.4);
  }
  g.computeVertexNormals();
  const eave = [];
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a), k = Math.max(Math.abs(cx) / hw, Math.abs(cz) / hd);
    const x = cx / k, z = cz / k;
    eave.push(new THREE.Vector3(x, at(x * 0.999, z * 0.999) - 0.02, z));
  }
  const ridge = hw - hd, hips = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const k = i / 10, x = sx * (ridge + (hw - ridge) * k), z = sz * hd * k; pts.push(new THREE.Vector3(x, at(x * 0.995, z * 0.995) + 0.03, z)); }
    hips.push(pts);
  }
  return { geo: g, eave, hips, ridge, at };
}

/** A gold shachihoko for a ridge's end: a curled fish, its tail flicked up, facing in. */
function shachi(THREE, m, s) {
  const o = new THREE.Group();
  const body = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.045, 8, 16, Math.PI * 1.1), m);
  body.rotation.set(0, 0, Math.PI * 0.05);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 4), m);
  tail.position.set(-0.1, 0.13, 0); tail.rotation.z = 0.7;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), m);
  head.position.set(0.11, 0, 0);
  o.add(body, tail, head);
  o.scale.x = s;
  o.traverse(n => { n.castShadow = true; });
  return o;
}

/** The dojo at (x, z): its group, the materials that glow at night (for the hub's glowMats) and a tick (lanterns
    swaying, banners stirring). `fine` / `texOf` are js/hub-3d.js's; `merge` its mergeStatic(). */
export function makeDojo(THREE, { x, z, fine, texOf, merge }) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  const still = new THREE.Group(), live = new THREE.Group();
  root.add(still, live);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });
  const add = (geo, m, px, py, pz, { to = still, shadow = true } = {}) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = shadow; o.receiveShadow = true; to.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, o) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, o);
  const glows = [];
  const lit = (m, k, min) => { m.userData.glow = k; m.userData.glowMin = min; glows.push(m); return m; };

  const granite = std({ color: '#cfc8b8', roughness: 0.95 }), graniteDark = std({ color: '#a8a090', roughness: 0.95 });
  const red = std({ color: '#c42a1e', roughness: 0.4 }), redDark = std({ color: '#8a1a12', roughness: 0.5 });
  const gold = std({ color: '#e8b848', metalness: 0.75, roughness: 0.28, emissive: new THREE.Color('#4a3008'), emissiveIntensity: 0.5 });
  const timber = std({ color: '#3a2214', roughness: 0.7 }), deck = std({ color: '#6a4026', roughness: 0.5 });
  const plaster = std({ color: '#f2ecde', roughness: 0.95 });
  const tiles = texOf(tileArt(fine));
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
  const roofM = std({ map: tiles, roughness: 0.38, metalness: 0.15 }), soffit = std({ color: '#2a1810', roughness: 0.8, side: THREE.BackSide });

  // the podium: two tiers of granite, gold-capped stairs up the front between stone cheeks
  const PZ = -0.5;   // the podium's middle (its front at 1.3)
  box(4.9, 0.2, 3.6, graniteDark, 0, 0.1, PZ);
  box(4.5, 0.22, 3.2, granite, 0, 0.31, PZ - 0.05);
  box(4.56, 0.03, 3.26, graniteDark, 0, LIFT - 0.01, PZ - 0.05);
  for (let i = 0; i < 4; i++) {
    const h = LIFT * (4 - i) / 5;
    box(1.5, h, 0.24, i % 2 ? graniteDark : granite, 0, h / 2, 1.3 + 0.12 + i * 0.24);
    box(1.5, 0.012, 0.035, gold, 0, h + 0.006, 1.3 + 0.24 * i + 0.22, { shadow: false });
  }
  for (const sx of [-1, 1]) {
    box(0.2, LIFT + 0.06, 1.0, graniteDark, sx * 0.85, (LIFT + 0.06) / 2, 1.75);
    add(new THREE.SphereGeometry(0.07, 12, 10), gold, sx * 0.85, LIFT + 0.13, 2.18);
    add(new THREE.ConeGeometry(0.04, 0.09, 10), gold, sx * 0.85, LIFT + 0.24, 2.18);
  }
  // red balustrade round the top, open at the stairs, gold knobs on its corners
  const railH = 0.26, top = LIFT + railH;
  const runs = [[-2.17, 1.06, -0.78, 1.06], [0.78, 1.06, 2.17, 1.06], [-2.17, -2.05, -2.17, 1.06], [2.17, -2.05, 2.17, 1.06]];
  for (const [x0, z0, x1, z1] of runs) {
    const len = Math.hypot(x1 - x0, z1 - z0), along = x0 === x1 ? 'z' : 'x', n = Math.round(len / 0.42);
    for (const y of [top, LIFT + 0.12]) {
      const rail = box(along === 'x' ? len : 0.05, 0.04, along === 'x' ? 0.05 : len, red, (x0 + x1) / 2, y, (z0 + z1) / 2);
      if (y === top) rail.scale.y = 1.4;
    }
    for (let i = 0; i <= n; i++) { const k = i / n; box(0.06, railH, 0.06, redDark, x0 + (x1 - x0) * k, LIFT + railH / 2, z0 + (z1 - z0) * k); }
  }
  for (const [px, pz] of [[-2.17, 1.06], [2.17, 1.06], [-0.78, 1.06], [0.78, 1.06]]) add(new THREE.SphereGeometry(0.045, 10, 8), gold, px, top + 0.05, pz);

  // the veranda's deck, the hall's walls and its colonnade of vermilion columns
  box(4.2, 0.04, 3.0, deck, 0, LIFT + 0.02, PZ - 0.05);
  const HW = 3.3, HH = 1.5, HD = 2.1, HZ = -0.75, FY = LIFT + 0.04;
  const front = frontArt(fine, HW, HH), fm = std({ map: texOf(front), roughness: 0.85 });
  fm.emissive = new THREE.Color('#ffc880'); fm.emissiveMap = texOf(front.glow); lit(fm, 1.1, 0.12);
  box(HW, HH, HD, [plaster, plaster, timber, timber, fm, plaster], 0, FY + HH / 2, HZ);
  for (const sx of [-1, 1]) for (const zz of [HZ - HD / 2 + 0.05, HZ]) box(0.08, HH, 0.08, timber, sx * (HW / 2 + 0.01), FY + HH / 2, zz);
  box(HW + 0.04, 0.1, 0.06, timber, 0, FY + HH * 0.55, HZ + HD / 2 + 0.01);
  const colH = 1.62, colGeo = new THREE.CylinderGeometry(0.075, 0.085, colH, 14), baseGeo = new THREE.CylinderGeometry(0.12, 0.13, 0.07, 14), bandGeo = new THREE.CylinderGeometry(0.088, 0.088, 0.05, 14);
  const cols = [];
  for (const cx of [-1.95, -1.22, -0.48, 0.48, 1.22, 1.95]) cols.push([cx, 0.92]);
  for (const sx of [-1.95, 1.95]) for (const cz of [0.12, -0.7, -1.5, -1.95]) cols.push([sx, cz]);
  for (const [cx, cz] of cols) {
    add(colGeo, red, cx, FY + colH / 2, cz);
    add(baseGeo, graniteDark, cx, FY + 0.035, cz);
    add(bandGeo, gold, cx, FY + colH - 0.1, cz, { shadow: false });
    // a bracket set on its head: two stepped blocks, gold-tipped
    box(0.2, 0.06, 0.2, timber, cx, FY + colH + 0.03, cz);
    box(0.32, 0.05, 0.14, timber, cx, FY + colH + 0.085, cz);
    box(0.04, 0.05, 0.15, gold, cx + 0.17, FY + colH + 0.085, cz, { shadow: false });
    box(0.04, 0.05, 0.15, gold, cx - 0.17, FY + colH + 0.085, cz, { shadow: false });
  }
  // the head beams over the columns, red, a gold line along them
  const beamY = FY + colH + 0.14;
  box(4.06, 0.1, 0.12, red, 0, beamY, 0.92);
  box(4.06, 0.018, 0.13, gold, 0, beamY - 0.06, 0.93, { shadow: false });
  for (const sx of [-1, 1]) box(0.12, 0.1, 2.95, red, sx * 1.95, beamY, -0.5);
  box(4.06, 0.06, 0.1, redDark, 0, FY + colH - 0.18, 0.92);

  // the lower roof, sweeping out past the colonnade, gold along its eaves and hips
  const lowY = beamY + 0.05;
  const low = templeRoof(THREE, 5.15, 3.75, 0.8, 0.26);
  add(low.geo, roofM, 0, lowY, -0.5);
  add(low.geo, soffit, 0, lowY - 0.03, -0.5, { shadow: false });
  const trim = (pts, r, closed, at) => {
    const t = add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, closed), closed ? 96 : 16, r, 6, closed), gold, at.x, at.y, at.z, { shadow: false });
    return t;
  };
  trim(low.eave, 0.035, true, { x: 0, y: lowY, z: -0.5 });
  for (const h of low.hips) trim(h, 0.04, false, { x: 0, y: lowY, z: -0.5 });

  // the curved gable over the door, its bargeboard dark wood edged in gold, the dojo's name on its lintel
  const bell = (u) => 0.46 * Math.exp(-((u / 0.5) ** 2)) + 0.05;
  const shape = new THREE.Shape(), N = 30, GW = 1.05;
  for (let i = 0; i <= N; i++) { const u = -GW + 2 * GW * i / N; i ? shape.lineTo(u, bell(u) + 0.11) : shape.moveTo(u, bell(u) + 0.11); }
  for (let i = N; i >= 0; i--) { const u = -GW + 2 * GW * i / N; shape.lineTo(u, bell(u)); }
  const gable = new THREE.ExtrudeGeometry(shape, { depth: 1.05, bevelEnabled: false, curveSegments: 4 });
  const gm = add(gable, [timber, roofM], 0, beamY + 0.02, 0.2);
  gm.receiveShadow = true;
  const face = [];
  for (let i = 0; i <= N; i++) { const u = -GW + 2 * GW * i / N; face.push(new THREE.Vector3(u, bell(u) + 0.115, 0)); }
  trim(face, 0.028, false, { x: 0, y: beamY + 0.02, z: 1.27 });
  const under = face.map(v => new THREE.Vector3(v.x, v.y - 0.115, 0));
  trim(under, 0.02, false, { x: 0, y: beamY + 0.02, z: 1.27 });
  add(new THREE.SphereGeometry(0.05, 10, 8), gold, 0, beamY + 0.02 + bell(0) + 0.14, 1.27);
  // gable's tympanum, shut with a gold-trimmed board and the dojo's name
  const sm = std({ map: texOf(lintelArt(fine)), roughness: 0.5 });
  sm.emissive = new THREE.Color('#ffd060'); sm.emissiveMap = sm.map; lit(sm, 0.35, 0.12);
  add(new THREE.PlaneGeometry(0.92, 0.17), sm, 0, beamY - 0.16, 1.0, { shadow: false });

  // the upper storey: a white box with a red-railed gallery, lattice windows lit, the plaque on its face
  const UY = lowY + 0.45, UH = 0.72, UW = 2.5, UD = 1.45, UZ = -0.62;
  const win = std({ color: '#fff0c8', roughness: 0.6, emissive: new THREE.Color('#ffc070') });
  lit(win, 1.0, 0.1);
  box(UW, UH, UD, plaster, 0, UY + UH / 2, UZ);
  for (const sx of [-1, 1]) {
    box(0.42, 0.3, 0.02, win, sx * 0.9, UY + 0.38, UZ + UD / 2 + 0.01, { shadow: false });
    for (let i = 0; i < 4; i++) box(0.015, 0.3, 0.025, timber, sx * 0.9 - 0.15 + i * 0.1, UY + 0.38, UZ + UD / 2 + 0.02, { shadow: false });
  }
  for (const sx of [-1, 0, 1]) box(0.07, UH, 0.07, timber, sx * UW / 2, UY + UH / 2, UZ + UD / 2 + 0.01);
  box(UW + 0.3, 0.05, UD + 0.3, timber, 0, UY + 0.06, UZ);
  for (const [w, d, zz, xx] of [[UW + 0.3, 0.04, UZ + UD / 2 + 0.15, 0], [0.04, UD + 0.3, UZ, UW / 2 + 0.15], [0.04, UD + 0.3, UZ, -UW / 2 - 0.15]]) {
    box(w, 0.035, d, red, xx, UY + 0.2, zz);
    const n = Math.round(Math.max(w, d) / 0.25);
    for (let i = 0; i <= n; i++) { const k = i / n - 0.5; box(0.03, 0.14, 0.03, redDark, xx + (w > d ? k * w : 0), UY + 0.13, zz + (w > d ? 0 : k * d)); }
  }
  const pq = plaqueArt(fine), pm = std({ map: texOf(pq), roughness: 0.4, metalness: 0.2 });
  pm.emissive = new THREE.Color('#ffd060'); pm.emissiveMap = pm.map; lit(pm, 0.45, 0.15);
  add(new THREE.PlaneGeometry(0.86, 0.39), pm, 0, UY + UH * 0.55, UZ + UD / 2 + 0.03, { shadow: false });

  // the upper roof: steeper, sweeping higher, a gold-capped ridge and a shachihoko at each end
  const upY = UY + UH - 0.02;
  const up = templeRoof(THREE, 3.6, 2.4, 0.95, 0.34);
  add(up.geo, roofM, 0, upY, UZ);
  add(up.geo, soffit, 0, upY - 0.03, UZ, { shadow: false });
  trim(up.eave, 0.035, true, { x: 0, y: upY, z: UZ });
  for (const h of up.hips) trim(h, 0.045, false, { x: 0, y: upY, z: UZ });
  const ridgeY = upY + 0.95;
  box(up.ridge * 2 + 0.2, 0.14, 0.14, timber, 0, ridgeY + 0.04, UZ);
  box(up.ridge * 2 + 0.22, 0.03, 0.16, gold, 0, ridgeY + 0.12, UZ, { shadow: false });
  for (const sx of [-1, 1]) {
    const f = shachi(THREE, gold, -sx);
    f.position.set(sx * (up.ridge + 0.1), ridgeY + 0.22, UZ);
    still.add(f);
  }
  add(new THREE.SphereGeometry(0.06, 12, 10), gold, 0, ridgeY + 0.19, UZ);

  // red paper lanterns hung from the head beam either side of the door, lit; they sway
  const lantern = lit(std({ color: '#e04a2c', roughness: 0.55, emissive: new THREE.Color('#ff7040') }), 1.6, 0.35);
  const cap = std({ color: '#1a1008', roughness: 0.6 });
  const swing = [];
  for (const sx of [-0.85, 0.85, -1.6, 1.6]) {
    const big = Math.abs(sx) < 1;
    const p = new THREE.Group();
    p.position.set(sx, beamY - 0.05, big ? 1.0 : 0.98);
    live.add(p);
    add(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 4), cap, 0, -0.06, 0, { to: p, shadow: false });
    const body = add(new THREE.SphereGeometry(big ? 0.15 : 0.11, 16, 12), lantern, 0, big ? -0.3 : -0.25, 0, { to: p });
    body.scale.y = 1.3;
    add(new THREE.CylinderGeometry(big ? 0.09 : 0.07, big ? 0.09 : 0.07, 0.04, 12), cap, 0, big ? -0.1 : -0.11, 0, { to: p, shadow: false });
    add(new THREE.CylinderGeometry(big ? 0.09 : 0.07, big ? 0.09 : 0.07, 0.04, 12), cap, 0, big ? -0.5 : -0.39, 0, { to: p, shadow: false });
    add(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 4), gold, 0, big ? -0.56 : -0.44, 0, { to: p, shadow: false });
    merge(p);
    swing.push({ p, at: sx * 3.1 });
  }

  // stone lanterns either side of the stairs, their fireboxes lit
  const fire = lit(std({ color: '#fff0c0', roughness: 0.5, emissive: new THREE.Color('#ffb050') }), 1.5, 0.2);
  for (const sx of [-1.55, 1.55]) {
    const sz = 1.85;
    box(0.36, 0.08, 0.36, graniteDark, sx, 0.04, sz);
    add(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 8), granite, sx, 0.33, sz);
    box(0.3, 0.06, 0.3, graniteDark, sx, 0.61, sz);
    box(0.22, 0.2, 0.22, granite, sx, 0.74, sz);
    box(0.12, 0.12, 0.23, fire, sx, 0.74, sz, { shadow: false });
    box(0.23, 0.12, 0.12, fire, sx, 0.74, sz, { shadow: false });
    const roof = add(new THREE.ConeGeometry(0.28, 0.2, 4), graniteDark, sx, 0.94, sz);
    roof.rotation.y = Math.PI / 4;
    add(new THREE.SphereGeometry(0.045, 8, 6), granite, sx, 1.07, sz);
  }

  // victory banners on poles at the podium's front corners, one red, one white
  const pole = std({ color: '#2a1a10', roughness: 0.6 });
  const flags = [];
  for (const [sx, redOne] of [[-2.32, true], [2.32, false]]) {   // only at the front: Halloween's cauldron stands just right of the hall
    const pz = 1.4;
    add(new THREE.CylinderGeometry(0.022, 0.026, 2.5, 8), pole, sx, 1.25, pz);
    add(new THREE.SphereGeometry(0.04, 8, 6), gold, sx, 2.52, pz, { shadow: false });
    box(0.36, 0.025, 0.025, pole, sx + Math.sign(sx) * -0.15, 2.38, pz, { shadow: false });
    const fg = new THREE.Group();
    fg.position.set(sx - Math.sign(sx) * 0.16, 2.37, pz + 0.02);
    live.add(fg);
    const m = std({ map: texOf(bannerArt(fine, redOne)), roughness: 0.9, side: THREE.DoubleSide });
    const plane = add(new THREE.PlaneGeometry(0.3, 1.35), m, 0, -0.675, 0, { to: fg });
    plane.castShadow = true;
    flags.push({ fg, at: sx });
  }


  merge(still);

  /** Lanterns sway, banners stir. */
  function tick(now, calm) {
    const t = now / 1000;
    for (const s of swing) s.p.rotation.z = calm ? 0 : Math.sin(t * 1.3 + s.at) * 0.05;
    for (const f of flags) f.fg.rotation.y = calm ? 0 : Math.sin(t * 1.1 + f.at) * 0.18;
  }
  return { group: root, glows, tick };
}
