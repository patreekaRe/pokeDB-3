/* hub-pillar.js  -  the Sky Pillar in the Clearing (the user's ask, 2026-10-15: "a big change aesthetically"; it was a
   stone box 12 tall with a door painted on). Hoenn's tower, ruined and climbing into the sky: an octagonal shaft of
   sage stone in four tiers, each narrower, under a cornice with a band of jade runes; a porch round the arched door with
   Rayquaza's ring over it, jade banners either side, moss and fallen blocks round its foot. Stones float round its middle,
   a collar of cloud wraps it higher up, and on top, among broken columns, a jade crystal
   turns. Once the tower is open (a won run) its runes and crystal shine and two streams of wind spiral up it; before
   that it sleeps. js/hub-3d.js builds it as the 'pillar-tower' place. Only emissive paint glows at night (no light of
   its own: a new light in the Clearing would recompile every material in it). */

const SHARDS = 8;

function seeded(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export const STONES = ['#d2d6c4', '#c3c8b6', '#b2b8a5', '#a2a894'];

/** One face of the shaft (the texture repeats eight times round): weathered courses of sage stone, an arched window lit
    jade inside, a slit under it; `mossy` greens its foot and runs ivy up it. Its shine() is the windows. */
function faceArt(fine, mossy, seed) {
  const W = 20, H = 60, { c, g, fill, rr, lin, shine } = fine(W, H, 8), rnd = seeded(seed), s = shine();
  g.fillStyle = '#7c8274'; g.fillRect(0, 0, W, H);
  for (let row = 0; row * 4 < H; row++) {
    const y = row * 4, off = row % 2 ? 3.3 : 0;
    for (let x = -off; x < W; x += 6.6) {
      const n = rnd();
      rr(x + 0.25, y + 0.25, 6.1, 3.5, 0.6, STONES[n > 0.85 ? 0 : n > 0.45 ? 1 : n > 0.15 ? 2 : 3]);
      rr(x + 0.5, y + 0.4, 5.6, 0.55, 0.3, 'rgba(255,255,240,0.28)');
      rr(x + 0.5, y + 3.1, 5.6, 0.55, 0.3, 'rgba(50,56,44,0.22)');
      if (rnd() < 0.14) {
        const cx = x + 1.5 + rnd() * 3.5;
        g.strokeStyle = 'rgba(54,58,48,0.55)'; g.lineWidth = 0.2;
        g.beginPath(); g.moveTo(cx, y + 0.4); g.lineTo(cx + 0.7, y + 1.8); g.lineTo(cx + 0.2, y + 3.6); g.stroke();
      }
      for (let i = rnd() < 0.3 ? 3 : 0; i > 0; i--) fill('rgba(64,70,58,0.4)', () => g.arc(x + 1 + rnd() * 5, y + 0.8 + rnd() * 2.4, 0.22, 0, Math.PI * 2));
    }
  }
  // each face a touch darker at its edges, so the eight read apart
  g.fillStyle = lin(0, 0, W, 0, ['rgba(30,36,30,0.2)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(30,36,30,0.24)']); g.fillRect(0, 0, W, H);
  const win = (cx, w, top, bot) => {   // an arched window: a pale frame, dark inside, jade light at night
    const path = (gg, inset) => {
      const r = w / 2 - inset;
      gg.beginPath(); gg.moveTo(cx - r, bot); gg.lineTo(cx - r, top + w / 2); gg.arc(cx, top + w / 2, r, Math.PI, 0); gg.lineTo(cx + r, bot); gg.closePath();
    };
    g.fillStyle = lin(0, top, 0, bot, ['#e8ecdc', '#b8bea8']); path(g, -1.1); g.fill();
    g.fillStyle = lin(0, top, 0, bot, ['#1a2430', '#22343e', '#2c4a4a']); path(g, 0); g.fill();
    s.fillStyle = lin(0, top, 0, bot, ['#2a8870', '#5ad8b0', '#8af0d0']); path(s, 0); s.fill();
    rr(cx - w / 2 - 1.3, bot, w + 2.6, 1.2, 0.4, lin(0, bot, 0, bot + 1.2, ['#e8ecdc', '#8e947e']));
  };
  if (mossy) win(10, 2.6, 6, 14);
  else { win(10, 5.4, 14, 32); win(10, 2.2, 42, 49); }
  if (mossy) {
    g.fillStyle = lin(0, H - 30, 0, H, ['rgba(60,100,40,0)', 'rgba(60,100,40,0.42)']); g.fillRect(0, H - 30, W, 30);
    for (let i = 0; i < 26; i++) fill(`rgba(${rnd() < 0.5 ? '84,140,60' : '128,184,80'},0.55)`, () => g.ellipse(rnd() * W, H - rnd() * rnd() * 34, 0.8 + rnd() * 1.6, 0.5 + rnd() * 0.8, 0, 0, Math.PI * 2));
    for (let v = 0; v < 2; v++) {   // ivy up from the foot
      let x = 2 + rnd() * 16, y = H;
      const top = H - 18 - rnd() * 28;
      g.strokeStyle = '#2e5a24'; g.lineWidth = 0.35; g.beginPath(); g.moveTo(x, y);
      const leaves = [];
      while (y > top) { x = Math.max(0.5, Math.min(W - 0.5, x + (rnd() - 0.5) * 2)); y -= 1.8; g.lineTo(x, y); leaves.push([x, y]); }
      g.stroke();
      for (const [lx, ly] of leaves) fill(rnd() < 0.5 ? '#4a8a34' : '#6aac44', () => g.ellipse(lx + (rnd() - 0.5) * 1.2, ly, 0.9, 0.55, rnd() * 3, 0, Math.PI * 2));
    }
  } else {   // weathering streaks down from the cornice
    for (let i = 0; i < 4; i++) {
      const x = rnd() * W;
      g.fillStyle = lin(0, 0, 0, 20 + rnd() * 20, ['rgba(70,78,64,0.3)', 'rgba(70,78,64,0)']); g.fillRect(x, 0, 0.6 + rnd(), 40);
    }
  }
  return c;
}

/** The band under each cornice: dark stone carved with runes that shine jade (shine()). */
export function runeArt(fine) {
  const W = 24, H = 4, { c, g, lin, shine } = fine(W, H, 10), s = shine();
  g.fillStyle = lin(0, 0, 0, H, ['#5a6254', '#3e4438', '#2e3428']); g.fillRect(0, 0, W, H);
  const glyph = (gg, i, x) => {
    const m = H / 2;
    gg.beginPath();
    if (i % 3 === 0) { gg.moveTo(x, m - 1.2); gg.lineTo(x + 1, m); gg.lineTo(x, m + 1.2); gg.lineTo(x - 1, m); gg.closePath(); gg.fill(); }
    else if (i % 3 === 1) { gg.arc(x, m, 0.95, 0, Math.PI * 2); gg.stroke(); }
    else { gg.moveTo(x - 0.9, m - 1.1); gg.lineTo(x + 0.9, m - 1.1); gg.moveTo(x, m - 1.1); gg.lineTo(x, m + 1.1); gg.moveTo(x - 0.9, m + 1.1); gg.lineTo(x + 0.9, m + 1.1); gg.stroke(); }
  };
  for (const [gg, col] of [[g, '#7ae0b8'], [s, '#8affd0']]) {
    gg.fillStyle = gg.strokeStyle = col; gg.lineWidth = 0.4;
    for (let i = 0; i < 8; i++) glyph(gg, i, 1.5 + i * 3);
  }
  g.fillStyle = 'rgba(255,255,240,0.25)'; g.fillRect(0, 0, W, 0.35);
  return c;
}

/** The doorway: an arch onto the stair inside, climbing away lit jade from above. Its shine() is that light. */
function doorArt(fine) {
  const W = 12, H = 24, { c, g, rr, lin, shine } = fine(W, H, 12), s = shine();
  const arch = (gg) => { gg.beginPath(); gg.moveTo(0, H); gg.lineTo(0, W / 2); gg.arc(W / 2, W / 2, W / 2, Math.PI, 0); gg.lineTo(W, H); gg.closePath(); };
  g.fillStyle = lin(0, 0, 0, H, ['#081014', '#10222a', '#1e4a46']); arch(g); g.fill();
  s.fillStyle = lin(0, 0, 0, H, ['#0a2a26', '#1c6a5a', '#4ac8a0']); arch(s); s.fill();
  for (let i = 0; i < 9; i++) {   // the stair, each tread lit from above
    const y = H - 1.4 - i * 2, inset = 1 + i * 0.42, a = 0.95 - i * 0.09;
    rr(inset, y, W - inset * 2, 0.7, 0.3, `rgba(130,232,196,${a})`);
    s.fillStyle = `rgba(150,255,214,${a})`; s.beginPath(); s.roundRect(inset, y, W - inset * 2, 0.7, 0.3); s.fill();
  }
  return c;
}

/** Rayquaza's ring over the door: a jade disc, a gold serpent coiling across it. Its shine() is the jade and the coil. */
export function sealArt(fine) {
  const { c, g, lin, shine } = fine(16, 16, 12), s = shine(), o = 8;
  g.fillStyle = lin(0, 0, 0, 16, ['#f0f2e4', '#9aa08a']); g.beginPath(); g.arc(o, o, 8, 0, Math.PI * 2); g.fill();
  g.fillStyle = lin(2, 2, 14, 14, ['#9af0c4', '#3aae7c', '#16603e']); g.beginPath(); g.arc(o, o, 6.4, 0, Math.PI * 2); g.fill();
  s.fillStyle = '#2aa070'; s.beginPath(); s.arc(o, o, 6.4, 0, Math.PI * 2); s.fill();
  for (const [gg, col] of [[g, '#f8e488'], [s, '#fff2b0']]) {
    gg.strokeStyle = col; gg.lineWidth = 1.2; gg.lineCap = 'round';
    gg.beginPath(); gg.moveTo(o - 4, o - 3.8); gg.bezierCurveTo(o + 5.5, o - 4.4, o - 5.5, o + 4.4, o + 4, o + 3.8); gg.stroke();
    gg.fillStyle = col; gg.beginPath(); gg.arc(o - 4, o - 3.8, 1, 0, Math.PI * 2); gg.fill();
  }
  g.strokeStyle = '#2a3428'; g.lineWidth = 0.3; g.beginPath(); g.arc(o, o, 6.4, 0, Math.PI * 2); g.stroke();
  return c;
}

/** A banner: jade cloth (`cloth`, its middle and edge), gold edges, Rayquaza's ring at its head and a swallow-tailed foot. */
export function bannerArt(fine, cloth = ['#22885a', '#14583c']) {
  const W = 8, H = 34, { c, g, lin } = fine(W, H, 12);
  const shape = () => { g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, H); g.lineTo(W / 2, H - 4); g.lineTo(0, H); g.closePath(); };
  g.fillStyle = lin(0, 0, W, 0, [cloth[1], cloth[0], cloth[1]]); shape(); g.fill();
  g.strokeStyle = '#e8c050'; g.lineWidth = 0.7; shape(); g.stroke();
  g.strokeStyle = '#f8e090'; g.lineWidth = 0.9; g.beginPath(); g.arc(W / 2, 7, 2.6, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 0.7; g.beginPath(); g.moveTo(W / 2 - 1.6, 5.4); g.bezierCurveTo(W / 2 + 2.4, 5.2, W / 2 - 2.4, 8.8, W / 2 + 1.6, 8.6); g.stroke();
  g.fillStyle = '#e8c050';
  for (let i = 0; i < 4; i++) { const y = 14 + i * 4; g.beginPath(); g.moveTo(W / 2, y - 1.2); g.lineTo(W / 2 + 1, y); g.lineTo(W / 2, y + 1.2); g.lineTo(W / 2 - 1, y); g.closePath(); g.fill(); }
  return c;
}

/** A soft streak for the wind's streams, bright at its head and fading along its tail (an alpha map, read in green). */
function windArt() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 128, 8);
  for (const [x, l] of [[0, 52], [64, 30], [100, 18]]) {
    const s = g.createLinearGradient(x, 0, x + l, 0);
    s.addColorStop(0, 'rgba(255,255,255,0)'); s.addColorStop(0.85, 'rgba(255,255,255,1)'); s.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = s; g.fillRect(x, 1, l, 6);
  }
  return c;
}

/** The Sky Pillar at (x, z), its door facing +z: its group, the materials that glow at night (for the hub's glowMats)
    and a tick (stones floating, clouds turning, the crystal spinning, the wind climbing). `open`: the tower can be
    climbed, so it's awake. `fine` / `texOf` are js/hub-3d.js's; `merge` its mergeStatic(). */
export function makePillar(THREE, { x, z, open, fine, texOf, merge }) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  const still = new THREE.Group(), live = new THREE.Group();
  root.add(still, live);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.9, ...o });
  const add = (geo, m, px, py, pz, { to = still, shadow = true } = {}) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = shadow; o.receiveShadow = true; to.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, o) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, o);
  // an octagon with a flat face to the front (+z), so the door sits square on it
  const oct = (rt, rb, h, hollow = false) => new THREE.CylinderGeometry(rt, rb, h, 8, 1, hollow, -Math.PI / 8);
  const glows = [];
  const lit = (m, k, min) => { m.userData.glow = k; m.userData.glowMin = min; glows.push(m); return m; };
  const rnd = seeded(41);

  const pale = std({ color: '#dadecf', flatShading: true }), sage = std({ color: '#b4baa6', flatShading: true }), dark = std({ color: '#8a907c', roughness: 1, flatShading: true });
  const gold = std({ color: '#e8c058', metalness: 0.7, roughness: 0.3, emissive: new THREE.Color('#3a2a08'), emissiveIntensity: 0.5 });
  const jade = new THREE.Color('#6af0c0');
  const faceTex = (mossy, seed) => {
    const art = faceArt(fine, mossy, seed), map = texOf(art), glow = texOf(art.glow);
    for (const t of [map, glow]) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(8, 1); }
    return { map, glow };
  };
  const wall = (t, color) => lit(std({ map: t.map, color, emissive: jade, emissiveMap: t.glow, flatShading: true }), 1, 0.06);
  const low = faceTex(true, 7), high = faceTex(false, 8);
  const runeSrc = runeArt(fine), runeMap = texOf(runeSrc), runeGlow = texOf(runeSrc.glow);
  for (const t of [runeMap, runeGlow]) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(8, 1); }
  const runes = lit(std({ map: runeMap, emissive: jade, emissiveMap: runeGlow, roughness: 0.6, flatShading: true }), open ? 1.3 : 0.2, open ? 0.7 : 0.02);

  // the plinth: two octagonal steps, a stair up the front
  add(oct(1.62, 1.7, 0.2), dark, 0, 0.1, 0);
  add(oct(1.44, 1.5, 0.18), sage, 0, 0.29, 0);
  box(1.2, 0.25, 0.22, sage, 0, 0.125, 1.6);
  box(1.2, 0.125, 0.22, dark, 0, 0.0625, 1.8);

  // the four tiers, each narrower and paler than the one below, a cornice and a rune band over each
  const TIERS = [[0.38, 2.9, 1.25, 1.18, low, '#ffffff'], [3.06, 5.0, 1.06, 1.0, high, '#f4f6ee'], [5.16, 6.8, 0.92, 0.86, high, '#f0f4f2'], [6.96, 8.3, 0.8, 0.74, high, '#eef2f6']];
  for (const [y0, y1, rb, rt, t, color] of TIERS) {
    add(oct(rt, rb, y1 - y0, true), wall(t, color), 0, (y0 + y1) / 2, 0);
    add(oct(rt + 0.025, rt + 0.03, 0.16, true), runes, 0, y1 - 0.12, 0, { shadow: false });
    const cr = rt + 0.2;
    add(oct(cr, cr - 0.08, 0.1), pale, 0, y1 + 0.05, 0);
    add(oct(cr + 0.04, cr + 0.04, 0.06), pale, 0, y1 + 0.13, 0);
    add(oct(cr - 0.07, cr - 0.07, 0.025, true), gold, 0, y1 - 0.01, 0, { shadow: false });
  }
  const TOP = 8.46;   // low enough that a phone's view, at the door, still takes in the crystal
  // the 1st tier's corners carry engaged columns (but the two by the door, where the porch stands)
  for (let i = 1; i < 7; i++) {
    const a = Math.PI / 8 + i * Math.PI / 4, r = 1.23;
    add(new THREE.CylinderGeometry(0.075, 0.09, 2.52, 10), pale, Math.sin(a) * r, 0.38 + 1.26, Math.cos(a) * r);
    add(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 10), gold, Math.sin(a) * r, 2.66, Math.cos(a) * r, { shadow: false });
    add(new THREE.CylinderGeometry(0.12, 0.13, 0.1, 10), dark, Math.sin(a) * r, 0.43, Math.cos(a) * r);
  }

  // the porch: pilasters and an arch of pale stone round the doorway, a keystone, Rayquaza's ring over it
  const F = 1.17;   // just out from the 1st tier's front face (it leans in as it rises)
  const door = doorArt(fine), dm = std({ map: texOf(door), emissive: jade, emissiveMap: texOf(door.glow), transparent: true, alphaTest: 0.5, roughness: 1 });
  lit(dm, open ? 1.1 : 0.35, open ? 0.45 : 0.06);
  add(new THREE.PlaneGeometry(0.66, 1.32), dm, 0, 0.38 + 0.66, F, { shadow: false });
  for (const sx of [-1, 1]) {
    box(0.17, 1.1, 0.26, pale, sx * 0.42, 0.38 + 0.55, F + 0.09);
    box(0.22, 0.08, 0.3, dark, sx * 0.42, 0.42, F + 0.09);
    box(0.22, 0.06, 0.3, gold, sx * 0.42, 1.49, F + 0.09, { shadow: false });
  }
  const archGeo = new THREE.TorusGeometry(0.42, 0.09, 6, 18, Math.PI);
  archGeo.scale(1, 1, 1.45);
  add(archGeo, pale, 0, 1.48, F + 0.09);
  box(0.16, 0.2, 0.3, pale, 0, 1.94, F + 0.1);
  box(0.12, 0.04, 0.31, gold, 0, 2.05, F + 0.1, { shadow: false });
  const seal = sealArt(fine), sm = lit(std({ map: texOf(seal), emissive: jade, emissiveMap: texOf(seal.glow), roughness: 0.5 }), open ? 1 : 0.15, open ? 0.55 : 0.03);
  add(new THREE.CylinderGeometry(0.29, 0.29, 0.06, 28).rotateX(Math.PI / 2), gold, 0, 2.36, F - 0.04, { shadow: false });
  add(new THREE.CircleGeometry(0.25, 28), sm, 0, 2.36, F - 0.005, { shadow: false });

  // jade banners on the faces either side of the door, stirring in the wind
  const bm = std({ map: texOf(bannerArt(fine)), side: THREE.DoubleSide, alphaTest: 0.5, transparent: true, roughness: 0.95 });
  const flags = [];
  for (const sx of [-1, 1]) {
    const a = sx * Math.PI / 4, r = 1.1;
    const pivot = new THREE.Group();
    pivot.position.set(Math.sin(a) * r, 2.64, Math.cos(a) * r);
    pivot.rotation.y = a;
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 1.5, 1, 6), bm);
    cloth.position.set(0, -0.75, 0.05);
    cloth.castShadow = true;
    pivot.add(cloth);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.56, 6).rotateZ(Math.PI / 2), gold);
    rod.position.z = 0.06;
    pivot.add(rod);
    live.add(pivot);
    flags.push({ cloth, at: sx * 1.7 });
  }

  // the crown: a roof slab ringed with broken columns, an altar, the crystal turning over it
  add(oct(0.98, 0.94, 0.22), pale, 0, TOP + 0.11, 0);
  add(oct(0.5, 0.56, 0.24), sage, 0, TOP + 0.34, 0);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, h = 0.25 + rnd() * 0.85, r = 0.84;
    add(new THREE.CylinderGeometry(0.07, 0.08, h, 8), pale, Math.sin(a) * r, TOP + 0.22 + h / 2, Math.cos(a) * r);
    if (h > 0.8) add(new THREE.BoxGeometry(0.2, 0.06, 0.2), pale, Math.sin(a) * r, TOP + 0.25 + h, Math.cos(a) * r);
  }
  const gem = std({ color: open ? '#6ae8b8' : '#6e7468', emissive: open ? jade : new THREE.Color('#000'), emissiveIntensity: open ? 1.4 : 0, roughness: 0.25, metalness: 0.1, flatShading: true });
  const crystal = add(new THREE.OctahedronGeometry(0.28, 0), gem, 0, TOP + 0.85, 0, { to: live });
  crystal.scale.y = 1.7;
  const halo = open ? add(new THREE.SphereGeometry(0.62, 18, 12), new THREE.MeshBasicMaterial({ color: '#7af8c8', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }), 0, TOP + 0.85, 0, { to: live, shadow: false }) : null;
  if (halo) halo.raycast = () => {};

  // moss and fallen blocks round the foot
  const moss = std({ color: '#5a8a3e', roughness: 1, flatShading: true }), moss2 = std({ color: '#76a84c', roughness: 1, flatShading: true });
  for (const [mx, mz, r] of [[-1.3, 0.75, 0.24], [-1.5, 0.35, 0.17], [1.35, 0.6, 0.22], [1.0, -1.25, 0.26], [-0.9, -1.4, 0.2], [0.45, 1.42, 0.12]]) {
    add(new THREE.IcosahedronGeometry(r, 1), rnd() < 0.5 ? moss : moss2, mx, r * 0.45, mz).scale.y = 0.6;
  }
  for (const [bx, bz, a, s] of [[-1.42, 1.08, 0.4, 1], [1.62, -0.55, -0.3, 0.8], [-1.25, -1.35, 0.9, 0.9]]) {
    const b = box(0.36 * s, 0.24 * s, 0.26 * s, sage, bx, 0.12 * s, bz);
    b.rotation.set(0.12, a, 0.08);
  }

  // stones floating round its middle, some with a jade shard in them
  const rock = std({ color: '#a8ae9a', flatShading: true }), shard = std({ color: '#6ae8b8', emissive: jade, emissiveIntensity: open ? 1.2 : 0.1, flatShading: true, roughness: 0.3 });
  const shards = Array.from({ length: SHARDS }, (_, i) => {
    const r = 0.08 + rnd() * 0.13, o = add(new THREE.DodecahedronGeometry(r, 0), rock, 0, 0, 0, { to: live });
    o.scale.set(1, 0.7 + rnd() * 0.5, 1);
    if (i % 3 === 0) { const s = add(new THREE.OctahedronGeometry(r * 0.55, 0), shard, 0, r * 0.75, 0, { to: o, shadow: false }); s.scale.y = 1.8; }
    return { o, a: i / SHARDS * Math.PI * 2 + rnd() * 0.4, r: 1.6 + rnd() * 0.4, y: 3.25 + rnd() * 1.5, speed: 0.05 + rnd() * 0.05, bob: rnd() * 6, spin: rnd() - 0.5 };
  });

  // a collar of cloud round the 3rd tier, a thinner one round the 4th: one draw each, turning slowly
  const cloudM = std({ color: '#ffffff', emissive: new THREE.Color('#dce8ff'), emissiveIntensity: 0.25, roughness: 1, flatShading: true });
  const one = new THREE.Object3D();
  const collar = (n, y, r0, r1, s0, s1) => {
    const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), cloudM, n);
    im.position.y = y;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + rnd() * 0.3, r = r0 + rnd() * (r1 - r0), s = s0 + rnd() * (s1 - s0);
      one.position.set(Math.sin(a) * r, (rnd() - 0.5) * 0.45, Math.cos(a) * r);
      one.scale.set(s * 1.3, s * 0.62, s);
      one.rotation.set(0, rnd() * 3, 0);
      one.updateMatrix();
      im.setMatrixAt(i, one.matrix);
    }
    im.raycast = () => {};
    live.add(im);
    return im;
  };
  const clouds = [collar(22, 5.35, 1.1, 1.7, 0.3, 0.54), collar(14, 7.55, 0.9, 1.3, 0.22, 0.38)];

  // Rayquaza's wind: two streams spiralling up the tower, once it's open
  const winds = [];
  if (open) {
    const alpha = new THREE.CanvasTexture(windArt());
    alpha.wrapS = THREE.RepeatWrapping;
    alpha.repeat.set(5, 1);
    const wm = new THREE.MeshBasicMaterial({ color: '#8af8c8', alphaMap: alpha, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    for (const k of [0, 1]) {
      const pts = [];
      for (let i = 0; i <= 120; i++) {
        const t = i / 120, a = k * Math.PI + t * Math.PI * 2 * 1.75, r = 1.62 - t * 0.62;
        pts.push(new THREE.Vector3(Math.sin(a) * r, 3.15 + t * 6.6, Math.cos(a) * r));
      }
      const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.028 - k * 0.008, 5, false), wm);
      tube.raycast = () => {};
      live.add(tube);
      winds.push(tube);
    }
    winds.alpha = alpha;
  }

  merge(still);

  /** Stones drift round and bob, the clouds turn, the banners stir, the crystal spins and the wind runs up the tower. */
  function tick(now, calm) {
    const t = now / 1000;
    for (const f of flags) f.cloth.rotation.x = calm ? 0 : Math.sin(t * 1.2 + f.at) * 0.07 - 0.03;
    for (const s of shards) {
      const a = s.a + (calm ? 0 : t * s.speed);
      s.o.position.set(Math.sin(a) * s.r, s.y + (calm ? 0 : Math.sin(t * 0.8 + s.bob) * 0.12), Math.cos(a) * s.r);
      s.o.rotation.set(calm ? 0 : t * s.spin, a, 0);
    }
    if (calm) return;
    clouds[0].rotation.y = t * 0.03; clouds[1].rotation.y = -t * 0.045;
    crystal.rotation.y = t * 0.7;
    crystal.position.y = TOP + 0.85 + Math.sin(t * 1.1) * 0.08;
    if (open) {
      gem.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 1.7);
      halo.position.y = crystal.position.y;
      halo.material.opacity = 0.13 + 0.06 * Math.sin(t * 1.7);
      winds.alpha.offset.x = -t * 0.35;
      for (const w of winds) w.rotation.y = t * 0.12;
    }
  }
  tick(0, true);
  return { group: root, glows, tick };
}
