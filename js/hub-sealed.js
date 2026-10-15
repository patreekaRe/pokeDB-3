/* hub-sealed.js  -  the broken Sealed Gate standing in the Clearing, in 3D (the user's ask, 2026-10-15: it was a flat pixel
   painting, js/gate.js's open arch on a plane, "paper thin" among the Clearing's built places). The painting's design
   in the round: a carved obsidian arch trimmed with gold on a stepped dais, its runes glowing, a magenta gem in its crown
   between two curling gold horns, ice-blue crystal spires either side; the door is gone, its shards floating round the
   opening, the chains that held it snapped and hanging, and a vortex of the Crystal Depths' violet light turns where it
   stood, motes rising out of it. js/hub-3d.js builds it as the 'gate' place (makePlaces()) and ticks it each frame. */

const OW = 1.0, IW = 0.66, SPRING = 1.85, DEPTH = 0.46;   // the arch: outer and inner half-widths, where it springs, how deep
const LIFT = 0.3;          // the dais under it
const MOTES = 34;

function seeded(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** The Depths seen through the arch: a deep violet well, brightest at its heart, crystal glinting in the dark round it. */
function wellArt() {
  const S = 512, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d'), m = S / 2;
  const r = g.createRadialGradient(m, m, 0, m, m, m);
  [[0, '#fff2ff'], [0.08, '#e8c8ff'], [0.22, '#a070f0'], [0.45, '#4a2490'], [0.7, '#1a0c38'], [1, '#05020c']].forEach(([k, col]) => r.addColorStop(k, col));
  g.fillStyle = r; g.fillRect(0, 0, S, S);
  const rnd = seeded(77);
  for (let i = 0; i < 70; i++) {   // far-off crystal glints, more towards the rim
    const a = rnd() * Math.PI * 2, d = (0.3 + rnd() * 0.65) * m, s = 1 + rnd() * 2.5;
    g.fillStyle = `rgba(${200 + rnd() * 55 | 0}, ${170 + rnd() * 60 | 0}, 255, ${0.25 + rnd() * 0.5})`;
    g.beginPath(); g.ellipse(m + Math.cos(a) * d, m + Math.sin(a) * d, s, s * (1.5 + rnd() * 2), a, 0, Math.PI * 2); g.fill();
  }
  return c;
}

/** The vortex's arms: light curling in to the middle, clear between, for additive layers turning over the well. */
function swirlArt() {
  const S = 512, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d'), m = S / 2, ARMS = 5;
  g.lineCap = 'round';
  for (let k = 0; k < ARMS; k++) {
    const a0 = k / ARMS * Math.PI * 2;
    for (const [w, col, blur] of [[26, 'rgba(150, 80, 255, 0.28)', 30], [10, 'rgba(210, 160, 255, 0.55)', 14], [3, 'rgba(255, 235, 255, 0.85)', 6]]) {
      g.strokeStyle = col; g.shadowColor = 'rgba(180, 110, 255, 1)'; g.shadowBlur = blur;
      g.beginPath();
      for (let i = 0; i <= 60; i++) {
        const t = i / 60, rr = m * 0.98 * (1 - t) + 6, a = a0 + t * 4.2;
        const x = m + Math.cos(a) * rr, y = m + Math.sin(a) * rr;
        if (i) g.lineTo(x, y); else g.moveTo(x, y);
        g.lineWidth = w * (0.35 + 0.65 * (1 - t));
      }
      g.stroke();
    }
  }
  return c;
}

/** The arch's outline as a U, from its left foot up over the top and down to its right foot, `w` out from the middle. */
function archPath(THREE, w, y0 = 0) {
  const p = new THREE.Path();
  p.moveTo(-w, y0); p.lineTo(-w, SPRING); p.absarc(0, SPRING, w, Math.PI, 0, true); p.lineTo(w, y0);
  return p;
}

/** The gate standing at (x, z), its front to the camera; `merge` bakes its still meshes into one per material (js/hub-3d.js's
    mergeStatic()), `dot` is the motes' texture. tick(now, glow, calm) turns the vortex, floats the shards, sways the
    chains and lifts the motes; `glow` is the hour's (LIGHT[time].glow): the light reads stronger after dark. `smashed`:
    the Depths camp's (js/event-3d.js's buildCamp()), the door burst through, so more of its runes are dead, the band
    cracked all over, its left horn snapped off (the camp lays it on the floor) and the door's shards flung out wide.
    `hole` is the opening's meshes, for a tap on it. */
export function makeSealedGate(THREE, { x, z, dot, merge, smashed = false }) {
  const group = new THREE.Group(), still = new THREE.Group(), live = new THREE.Group();
  group.position.set(x, 0, z);
  group.add(still, live);
  const rnd = seeded(31);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.6, ...o });
  const add = (geo, m, px, py, pz, parent = still, shadow = true) => {
    const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
  };
  const obsidian = std({ color: '#2a2042', roughness: 0.32, metalness: 0.25 });
  const stone = std({ color: '#3a3256', roughness: 0.85, flatShading: true });
  const gold = std({ color: '#e8c460', metalness: 0.85, roughness: 0.3, emissive: new THREE.Color('#5a3c14'), emissiveIntensity: 0.4 });
  const ice = std({ color: '#86aef0', emissive: new THREE.Color('#4656b8'), emissiveIntensity: 0.7, roughness: 0.12, metalness: 0.1, flatShading: true, transparent: true, opacity: 0.9 });
  const rune = std({ color: '#f4d8ff', emissive: new THREE.Color('#c27aff'), emissiveIntensity: 1.6, roughness: 0.4 });
  const dead = std({ color: '#1a1428', roughness: 0.9 });
  const gem = std({ color: '#ff70b0', emissive: new THREE.Color('#e02a70'), emissiveIntensity: 1.4, roughness: 0.15, flatShading: true });
  const chain = std({ color: '#8a8aa4', metalness: 0.85, roughness: 0.35 });
  const shard = std({ color: '#341c58', emissive: new THREE.Color('#7a3ad8'), emissiveIntensity: 0.55, roughness: 0.2, metalness: 0.2, flatShading: true });
  const lit = [rune, gem, ice, shard], base = lit.map(m => m.emissiveIntensity);

  // the dais: three steps of dark stone, a gold lip on each
  [[2.9, 1.3], [2.5, 1.05], [2.1, 0.85]].forEach(([w, d], i) => {
    const h = LIFT / 3, y = h * i;
    add(new THREE.BoxGeometry(w, h, d), stone, 0, y + h / 2, 0);
    add(new THREE.BoxGeometry(w + 0.02, 0.025, 0.03), gold, 0, y + h - 0.012, d / 2, still, false);
  });

  // the arch: a U of obsidian with a bevelled edge, standing on a plinth each side
  const u = new THREE.Shape(), outer = archPath(THREE, OW).getPoints(24), inner = archPath(THREE, IW).getPoints(24).reverse();
  u.setFromPoints([...outer, ...inner]);
  const frameGeo = new THREE.ExtrudeGeometry(u, { depth: DEPTH, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2, curveSegments: 24 });
  frameGeo.translate(0, 0, -DEPTH / 2);
  add(frameGeo, obsidian, 0, LIFT, 0);
  const fz = DEPTH / 2 + 0.035;   // the frame's front face
  for (const sx of [-1, 1]) {
    const px = sx * (OW + IW) / 2, pw = OW - IW + 0.16;
    add(new THREE.BoxGeometry(pw, 0.26, DEPTH + 0.18), obsidian, px, LIFT + 0.13, 0);
    add(new THREE.BoxGeometry(pw + 0.02, 0.04, DEPTH + 0.2), gold, px, LIFT + 0.27, 0);
    add(new THREE.BoxGeometry(pw + 0.04, 0.12, DEPTH + 0.2), obsidian, px, LIFT + SPRING, 0);   // the impost the arch springs from
    add(new THREE.BoxGeometry(pw + 0.06, 0.035, DEPTH + 0.22), gold, px, LIFT + SPRING + 0.07, 0);
  }
  // gold piping round its outer and inner edges, front and back
  for (const w of [OW + 0.01, IW - 0.01]) for (const zz of [fz, -fz]) {
    const pts = archPath(THREE, w, 0.27).getSpacedPoints(90).map(p => new THREE.Vector3(p.x, p.y + LIFT, zz));
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.028, 6), gold, 0, 0, 0, still, false);
  }
  // runes along the band, most still lit, a few gone dark where it cracked
  const mid = (OW + IW) / 2, path = archPath(THREE, mid, 0.5).getSpacedPoints(22);
  path.forEach((p, i) => {
    if (i === 11) return;   // the crown's gem sits there
    const next = path[Math.min(path.length - 1, i + 1)], prev = path[Math.max(0, i - 1)];
    const o = add(new THREE.BoxGeometry(0.1, 0.055, 0.02), (smashed ? [2, 4, 7, 9, 13, 15, 16, 18, 20] : [4, 15, 18]).includes(i) ? dead : rune, p.x, p.y + LIFT, fz + 0.005, still, false);
    o.rotation.z = Math.atan2(next.y - prev.y, next.x - prev.x);
    const tick = add(new THREE.BoxGeometry(0.022, 0.1, 0.02), o.material, p.x, p.y + LIFT, fz + 0.006, still, false);
    tick.rotation.z = o.rotation.z + (i % 2 ? 0.5 : -0.5);
  });
  // cracks where the seal broke it: glowing seams across the band
  for (const [a, len] of [[2.35, 0.3], [0.62, 0.26], [0.95, 0.18], ...(smashed ? [[2.75, 0.34], [1.85, 0.22], [1.3, 0.28], [0.3, 0.3]] : [])]) {
    const cx = Math.cos(a) * mid, cy = Math.sin(a) * mid + SPRING + LIFT;
    const o = add(new THREE.BoxGeometry(len, 0.018, 0.02), rune, cx, cy, fz + 0.01, still, false);
    o.rotation.z = a + Math.PI / 2 + (rnd() - 0.5) * 0.6;
  }
  for (const [px, py, a] of [[-mid, 1.15, 1.2], [mid, 0.75, -1.3], ...(smashed ? [[-mid, 0.55, -1.1], [mid, 1.5, 1.4], [-mid - 0.04, 1.65, 1.9]] : [])]) add(new THREE.BoxGeometry(0.24, 0.018, 0.02), rune, px, py, fz + 0.01, still, false).rotation.z = a;

  // the crown: a gem set in gold at the top, a spike above it and a horn curling out either side
  const top = LIFT + SPRING + OW;
  add(new THREE.TorusGeometry(0.15, 0.035, 8, 20), gold, 0, top - 0.17, fz + 0.03, still, false);
  const crownGem = add(new THREE.OctahedronGeometry(0.14, 0), gem, 0, top - 0.17, fz + 0.05, live, false);
  crownGem.scale.set(0.85, 1.25, 0.6);
  add(new THREE.ConeGeometry(0.06, 0.42, 6), gold, 0, top + 0.17, 0);
  // each horn an arc from beside the gem up and over, curling down outwards (turned, not mirrored: mergeStatic() keeps
  // a mesh's winding, so a negative scale would turn it inside out)
  for (const sx of smashed ? [1] : [-1, 1]) add(new THREE.TorusGeometry(0.26, 0.035, 6, 18, 2.2), gold, sx * 0.3, top - 0.06, 0).rotation.z = sx < 0 ? 0 : Math.PI - 2.2;

  // the crystal spires: a tall one either side and a small shard leaning out of its foot, on a heap of rock
  for (const sx of [-1, 1]) {
    const crystal = (r, h, px, lean, py = LIFT * 0.4, pz = 0.05) => {
      const c = new THREE.Group();
      c.position.set(px, py, pz); c.rotation.z = -sx * lean; c.rotation.y = rnd();
      still.add(c);
      add(new THREE.CylinderGeometry(r, r * 1.12, h, 6), ice, 0, h / 2, 0, c);
      add(new THREE.ConeGeometry(r, r * 2.6, 6), ice, 0, h + r * 1.3, 0, c);
    };
    for (let i = 0; i < 3; i++) {
      const o = add(new THREE.DodecahedronGeometry(0.22 + rnd() * 0.08, 0), stone, sx * (1.25 + i * 0.1), 0.1, -0.1 + i * 0.16);
      o.scale.y = 0.6; o.rotation.set(rnd(), rnd(), rnd());
    }
    crystal(0.17, 2.0, sx * 1.27, 0.06);
    crystal(0.09, 0.85, sx * 1.45, 0.3, 0.15);
    crystal(0.06, 0.45, sx * 1.2, 0.25, 0.2, 0.3);
  }

  // the Depths through the opening: the well, and the vortex turning over it in two layers
  const OPEN = archPath(THREE, IW - 0.02, 0.0).getPoints(24), well = new THREE.Shape();
  well.setFromPoints(OPEN);
  const holeGeo = new THREE.ShapeGeometry(well, 24), CY = 1.35, SPAN = 3.4;
  const uv = holeGeo.attributes.uv, pos = holeGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / SPAN + 0.5, (pos.getY(i) - CY) / SPAN + 0.5);   // square, round the vortex's heart
  const wellMap = new THREE.CanvasTexture(wellArt());
  wellMap.colorSpace = THREE.SRGBColorSpace;
  const back = add(holeGeo, new THREE.MeshBasicMaterial({ map: wellMap, fog: false }), 0, LIFT, -0.04, live, false);
  const swirlCanvas = swirlArt(), swirls = [];
  for (const [zz, op] of [[0.0, 0.85], [0.05, 0.5]]) {
    const map = new THREE.CanvasTexture(swirlCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.center.set(0.5, 0.5);
    const m = new THREE.Mesh(holeGeo, new THREE.MeshBasicMaterial({ map, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    m.position.set(0, LIFT, zz);
    m.raycast = back.raycast;
    live.add(m);
    swirls.push({ m, map, op });
  }
  // the threshold: a gold sill and the light spilling out over the dais and the ground in front
  add(new THREE.BoxGeometry(IW * 2, 0.04, DEPTH + 0.1), gold, 0, LIFT + 0.02, 0, still, false);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: '#9a60f0', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.scale.set(1.2, 0.85, 1); pool.position.set(0, 0.035, 1.0);
  pool.raycast = () => {};
  live.add(pool);
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(IW * 2, 0.25), new THREE.MeshBasicMaterial({ color: '#b080ff', transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, LIFT + 0.005, 0.3);
  spill.raycast = () => {};
  live.add(spill);

  // the chains that held the door, snapped: hanging from a ring on each side of the opening, swaying
  const link = new THREE.TorusGeometry(0.055, 0.016, 6, 12), chains = [];
  for (const sx of [-1, 1]) {
    const anchor = new THREE.Group();
    anchor.position.set(sx * (IW + 0.03), LIFT + 1.55, fz + 0.04);
    live.add(anchor);
    add(new THREE.TorusGeometry(0.07, 0.02, 6, 14), gold, 0, 0, 0, anchor, false);
    const n = sx < 0 ? 6 : 4;
    for (let i = 0; i < n; i++) {
      const l = add(link, chain, sx * -0.02 * i, -0.1 - i * 0.1, 0.03, anchor);
      l.scale.set(1, 1.4, 1);
      l.rotation.y = i % 2 ? Math.PI / 2 : 0;
      if (i === n - 1) l.rotation.z = sx * 0.9;   // the snapped one, twisted off
    }
    merge?.(anchor);   // its links one mesh, swaying as one
    chains.push({ anchor, sx });
  }

  // the door's shards, floating round the opening and out over the spires, turning slowly
  const bits = [];
  const floatAt = [[-0.95, 2.55, 0.35, 0.16, 0], [0.98, 2.35, 0.4, 0.13, 0], [-0.55, 0.95, 0.45, 0.1, 0], [0.62, 1.25, 0.5, 0.12, 0],
    [-1.45, 2.6, 0.15, 0.09, 1], [1.5, 2.35, 0.1, 0.1, 1], [-0.8, 3.1, 0.3, 0.08, 1], [0.85, 3.2, 0.2, 0.07, 0],
    ...(smashed ? [[-0.3, 1.9, 0.9, 0.15, 0], [0.35, 2.3, 1.1, 0.12, 0], [-1.15, 1.6, 0.95, 0.13, 0], [1.2, 1.35, 1.0, 0.14, 0], [0.05, 2.95, 0.7, 0.1, 0], [-0.55, 2.7, 1.3, 0.08, 0], [0.7, 0.75, 1.25, 0.09, 0]] : [])];
  for (const [px, py, pz, s, iceOne] of floatAt) {
    const o = add(new THREE.OctahedronGeometry(s, 0), iceOne ? ice : shard, px, LIFT + py, pz, live);
    o.scale.set(1, 1.6 + rnd(), 0.7);
    bits.push({ o, y: o.position.y, ph: rnd() * Math.PI * 2, sp: 0.6 + rnd() * 0.6 });
  }

  // motes of the Depths' light rising out of the opening and drifting out towards you
  const mp = new Float32Array(MOTES * 3), mc = new Float32Array(MOTES * 3), seeds = [];
  for (let i = 0; i < MOTES; i++) seeds.push([(rnd() - 0.5) * IW * 1.7, rnd(), rnd(), 0.5 + rnd() * 0.8, i % 3 ? [0.75, 0.5, 1] : i % 2 ? [1, 0.55, 0.85] : [1, 0.95, 1]]);
  const mg = new THREE.BufferGeometry();
  mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  mg.setAttribute('color', new THREE.BufferAttribute(mc, 3));
  const motes = new THREE.Points(mg, new THREE.PointsMaterial({ size: 0.11, map: dot, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  motes.raycast = () => {};
  group.add(motes);

  merge?.(still);

  function tick(now, glow, calm) {
    const t = calm ? 0 : now / 1000, night = Math.min(1, glow), breathe = calm ? 1 : 0.85 + 0.15 * Math.sin(t * 1.4);
    lit.forEach((m, i) => { m.emissiveIntensity = base[i] * (0.75 + 0.45 * night) * (m === rune || m === gem ? breathe : 1); });
    swirls[0].map.rotation = -t * 0.35; swirls[1].map.rotation = t * 0.55 + 1;
    swirls[0].m.material.opacity = swirls[0].op * breathe;
    swirls[1].m.material.opacity = swirls[1].op * (calm ? 1 : 0.7 + 0.3 * Math.sin(t * 2.1));
    pool.material.opacity = (0.22 + 0.18 * night) * breathe;
    spill.material.opacity = (0.2 + 0.15 * night) * breathe;
    crownGem.rotation.y = t * 0.8;
    for (const { anchor, sx } of chains) anchor.rotation.z = calm ? 0 : sx * 0.06 + Math.sin(t * 1.1 + sx) * 0.07;
    for (const b of bits) {
      b.o.position.y = b.y + (calm ? 0 : Math.sin(t * b.sp + b.ph) * 0.07);
      b.o.rotation.y = b.ph + t * b.sp * 0.6;
      b.o.rotation.z = calm ? 0.2 : Math.sin(t * 0.7 + b.ph) * 0.3;
    }
    const p = mg.attributes.position, c = mg.attributes.color, h = SPRING + IW;
    seeds.forEach(([dx, y0, z0, sp, tint], i) => {
      const k = (y0 + t * sp * 0.1) % 1, fade = Math.sin(k * Math.PI) * (0.6 + 0.4 * night);
      p.setXYZ(i, dx * (1 + k * 0.6) + Math.sin(t * 0.8 * sp + i) * 0.1, LIFT + 0.1 + k * h, 0.1 + ((z0 + t * sp * 0.06) % 1) * 1.1);
      c.setXYZ(i, tint[0] * fade, tint[1] * fade, tint[2] * fade);
    });
    p.needsUpdate = c.needsUpdate = true;
  }
  tick(0, 1, true);

  return { group, tick, hole: [back, ...swirls.map(s => s.m)] };
}
