/* mall-hall.js  -  the Poké Mall hall's 3D dressing (2026-10-12, the user's ask: the hall was bland and small, its palms and
   benches flat paintings, its shop entrances plain). Everything here is modelled: two fountains either side of the carpet (a Poké Ball
   on top spraying, water spilling off its upper bowl, rings spreading in the basin), palms and topiary in stone planters,
   wooden benches on cast-iron frames, lamp posts, two escalators up to the mezzanine, the columns holding it up, vending
   machines and a directory against the back wall, banners swaying off the mezzanine. dressFronts() builds every shop's
   entrance out from the wall: pilasters, a lit sign box over the doors, then the shop's own: the Furniture store a green
   striped awning and flower troughs, the Game Corner a marquee of chasing bulbs, gold star posts and velvet ropes along
   its carpet, the shuttered shop a barrier and cones. mall-3d.js lays the hall out and calls dressHall() / dressFronts();
   each returns its tick(now, dt), and `block(x, y)` is told every tile a thing stands on. */

import { fine, texOf, words, star, GC } from './hub-3d.js';

let THREE;
const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.6, ...o });
const V2 = (r, y) => new THREE.Vector2(r, y);

function put(parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  parent.add(m);
  return m;
}

const lathe = (pts, n = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => V2(r, y)), n);

let MAT = null;
function mats() {
  if (MAT) return MAT;
  MAT = {
    stone: std({ color: '#f4eee2', roughness: 0.32 }),
    stoneDark: std({ color: '#cfc4b0', roughness: 0.5 }),
    gold: std({ color: '#e8b848', metalness: 0.85, roughness: 0.22 }),
    brass: std({ color: '#d8a838', metalness: 0.75, roughness: 0.3 }),
    iron: std({ color: '#2a3430', metalness: 0.55, roughness: 0.4 }),
    steel: std({ color: '#d8dce6', metalness: 0.7, roughness: 0.25 }),
    soil: std({ color: '#4a3424', roughness: 1 }),
    rubber: std({ color: '#1e1e24', roughness: 0.5 }),
    glass: std({ color: '#cfeaff', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3, depthWrite: false, side: THREE.DoubleSide }),
  };
  const grain = fine(32, 32, 6), { g, lin } = grain;
  g.fillStyle = lin(0, 0, 0, 32, ['#c99058', '#b47a44', '#c48a52']); g.fillRect(0, 0, 32, 32);
  g.strokeStyle = 'rgba(90,50,20,0.28)'; g.lineWidth = 0.35;
  for (let y = 1; y < 32; y += 1.7) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(10, y + 0.8, 20, y - 0.8, 32, y + 0.3); g.stroke(); }
  const t = texOf(grain.c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  MAT.wood = std({ map: t, roughness: 0.55 });
  return MAT;
}

/* ---------- the fountain ---------- */

/** The hall's two fountains (tiles), either side of the carpet; mall-3d.js paints a ring under each. */
export const FOUNTAINS = [[6, 5], [14, 5]];
export const FOUNTAIN_SCALE = 0.62;

function rippleArt() {
  const f = fine(64, 64, 4), { g, lin } = f;
  g.fillStyle = lin(0, 0, 64, 64, ['#4aa8e0', '#68c4f0', '#4aa0d8']); g.fillRect(0, 0, 64, 64);
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.6;
  for (let i = 0; i < 26; i++) {
    const x = (i * 37) % 64, y = (i * 23) % 64, w = 4 + (i % 5) * 2;
    g.beginPath(); g.ellipse(x, y, w, w * 0.35, (i % 3) * 0.4, 0, Math.PI); g.stroke();
    g.beginPath(); g.ellipse((x + 32) % 64, y, w, w * 0.35, (i % 3) * 0.4, 0, Math.PI); g.stroke();
  }
  return f.c;
}

function streakArt() {
  const f = fine(32, 32, 4), { g } = f;
  g.clearRect(0, 0, 32, 32);
  for (let i = 0; i < 18; i++) {
    const x = (i * 13) % 32, a = 0.25 + (i % 4) * 0.15;
    g.fillStyle = `rgba(220,245,255,${a})`;
    g.fillRect(x, (i * 7) % 32, 1 + (i % 3) * 0.6, 10 + (i % 5) * 4);
    g.fillRect(x, (i * 7) % 32 - 32, 1 + (i % 3) * 0.6, 10 + (i % 5) * 4);
  }
  return f.c;
}

function dotArt() {
  const c = new OffscreenCanvas(32, 32), g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(220,245,255,0.8)'); r.addColorStop(1, 'rgba(200,235,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  return c;
}

const wrapTex = (c, rx, ry) => { const t = texOf(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };

/** A Poké Ball sculpture, its button facing the front. */
function pokeBall(r) {
  const g = new THREE.Group(), M = mats();
  const red = std({ color: '#e03a30', roughness: 0.18, metalness: 0.1 }), white = std({ color: '#fbf8f2', roughness: 0.18 });
  put(g, new THREE.SphereGeometry(r, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), red);
  put(g, new THREE.SphereGeometry(r, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), white);
  const band = put(g, new THREE.TorusGeometry(r * 1.005, r * 0.07, 10, 48), M.rubber);
  band.rotation.x = Math.PI / 2;
  const b = put(g, new THREE.CylinderGeometry(r * 0.3, r * 0.3, r * 0.2, 28), M.rubber, 0, 0, r * 0.93);
  b.rotation.x = Math.PI / 2;
  const w = put(g, new THREE.CylinderGeometry(r * 0.2, r * 0.2, r * 0.12, 28), white, 0, 0, r * 1.05);
  w.rotation.x = Math.PI / 2;
  return g;
}

function fountain(parent, x, z, calm, scale = 1) {
  const g = new THREE.Group(), M = mats();
  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  parent.add(g);
  put(g, lathe([[0, 0], [1.46, 0], [1.5, 0.06], [1.5, 0.34], [1.44, 0.4], [1.32, 0.4], [1.28, 0.34], [1.26, 0.14], [0, 0.14]], 72), M.stone);
  put(g, new THREE.TorusGeometry(1.38, 0.04, 10, 72), M.gold, 0, 0.41, 0).rotation.x = Math.PI / 2;
  put(g, new THREE.TorusGeometry(1.5, 0.025, 8, 72), M.gold, 0, 0.08, 0).rotation.x = Math.PI / 2;
  const ripple = wrapTex(rippleArt(), 3, 3);
  const water = put(g, new THREE.CircleGeometry(1.27, 64), std({ map: ripple, color: '#ffffff', transparent: true, opacity: 0.88, roughness: 0.04, metalness: 0.15, emissive: '#1a5a8a', emissiveIntensity: 0.35 }), 0, 0.3, 0, false);
  water.rotation.x = -Math.PI / 2;
  put(g, lathe([[0.24, 0.14], [0.3, 0.2], [0.2, 0.3], [0.16, 0.62], [0.2, 0.7], [0.14, 0.78], [0.13, 0.98], [0, 0.98]], 32), M.stone);
  put(g, new THREE.TorusGeometry(0.17, 0.025, 8, 32), M.gold, 0, 0.66, 0).rotation.x = Math.PI / 2;
  put(g, lathe([[0, 0.94], [0.2, 0.95], [0.5, 1.02], [0.66, 1.14], [0.7, 1.2], [0.64, 1.21], [0.5, 1.12], [0, 1.1]], 56), M.stone);
  put(g, new THREE.TorusGeometry(0.69, 0.022, 8, 56), M.gold, 0, 1.2, 0).rotation.x = Math.PI / 2;
  const upper = put(g, new THREE.CircleGeometry(0.62, 48), water.material, 0, 1.17, 0, false);
  upper.rotation.x = -Math.PI / 2;
  const streaks = wrapTex(streakArt(), 6, 1);
  const curtainMat = new THREE.MeshStandardMaterial({ map: streaks, alphaMap: streaks, color: '#e8f8ff', transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide, roughness: 0.1, emissive: '#7ac8f0', emissiveIntensity: 0.35 });
  const sheet = put(g, new THREE.CylinderGeometry(0.71, 0.98, 0.9, 56, 1, true), curtainMat, 0, 0.75, 0, false);
  sheet.raycast = () => {};
  put(g, new THREE.CylinderGeometry(0.06, 0.1, 0.22, 16), M.gold, 0, 1.28, 0);
  const ball = pokeBall(0.26);
  ball.position.set(0, 1.62, 0);
  g.add(ball);

  // spray: drops arcing out of the ball's crown and falling into the upper bowl and the basin
  const N = calm ? 0 : Math.round(150 * scale), pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
  const spawn = (i, age = 0) => {
    const a = Math.random() * Math.PI * 2, out = 0.35 + Math.random() * 0.75, up = 1.9 + Math.random() * 0.7;
    pos[i * 3] = Math.cos(a) * 0.05; pos[i * 3 + 1] = 1.9; pos[i * 3 + 2] = Math.sin(a) * 0.05;
    vel[i * 3] = Math.cos(a) * out; vel[i * 3 + 1] = up; vel[i * 3 + 2] = Math.sin(a) * out;
    for (let k = 0; k < age; k++) step(i, 0.03);
  };
  const step = (i, t) => {
    vel[i * 3 + 1] -= 6.5 * t;
    pos[i * 3] += vel[i * 3] * t; pos[i * 3 + 1] += vel[i * 3 + 1] * t; pos[i * 3 + 2] += vel[i * 3 + 2] * t;
  };
  for (let i = 0; i < N; i++) spawn(i, Math.floor(Math.random() * 40));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const spray = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.075 * scale, map: texOf(dotArt()), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#cfefff' }));
  spray.raycast = () => {};
  g.add(spray);
  // rings spreading where the sheet meets the basin
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
  const rings = [0, 1, 2].map(i => {
    const r = put(g, new THREE.RingGeometry(0.96, 1.0, 64), ringMat.clone(), 0, 0.305, 0, false);
    r.rotation.x = -Math.PI / 2; r.raycast = () => {}; r.userData.at = i / 3;
    return r;
  });

  return (now, dt) => {
    if (calm) return;
    const t = dt / 1000;
    ripple.offset.set(now / 9000, now / 13000);
    streaks.offset.y = now / 700;
    for (let i = 0; i < N; i++) {
      step(i, t);
      const y = pos[i * 3 + 1], r = Math.hypot(pos[i * 3], pos[i * 3 + 2]);
      if (vel[i * 3 + 1] < 0 && ((r < 0.66 && y < 1.18) || y < 0.3)) spawn(i);
    }
    geo.attributes.position.needsUpdate = true;
    for (const r of rings) {
      const k = (now / 2400 + r.userData.at) % 1;
      r.scale.setScalar(1 + k * 0.28);
      r.material.opacity = 0.45 * (1 - k);
    }
  };
}

/* ---------- planters, palms, topiary ---------- */

/** A round stone planter: a fluted bowl on a foot, a gold band, soil. */
function planter(parent, r = 0.42, h = 0.5) {
  const M = mats();
  put(parent, lathe([[0, 0], [r * 0.62, 0], [r * 0.66, h * 0.1], [r * 0.6, h * 0.2], [r * 0.92, h * 0.55], [r, h * 0.92], [r * 1.06, h], [r * 0.92, h], [r * 0.9, h * 0.94], [0, h * 0.94]], 40), M.stone);
  put(parent, new THREE.TorusGeometry(r * 0.94, 0.022, 8, 40), M.gold, 0, h * 0.7, 0).rotation.x = Math.PI / 2;
  put(parent, new THREE.CircleGeometry(r * 0.9, 32), M.soil, 0, h * 0.93, 0, false).rotation.x = -Math.PI / 2;
}

function frondArt() {
  const f = fine(24, 96, 5), { g, lin } = f;
  g.clearRect(0, 0, 24, 96);
  for (let y = 4; y < 94; y += 2.2) {
    const k = 1 - y / 100, len = 10.5 * Math.sin(Math.min(1, (y + 6) / 30) * Math.PI / 2) * (0.35 + k * 0.65);
    for (const s of [-1, 1]) {
      g.fillStyle = lin(12, y, 12 + s * len, y + 3, ['#3e8a34', '#5cb046', '#78c858']);
      g.save(); g.translate(12, y); g.rotate(s * 0.9);
      g.beginPath(); g.ellipse(0, s * len / 2, 0.9, len / 2, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  }
  g.strokeStyle = '#6a8a30'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(12, 0); g.lineTo(12, 96); g.stroke();
  return f.c;
}

let FROND = null;
/** One frond: a strip arching up and drooping out along +z, folded into a V down its midrib. */
function frondGeo() {
  if (FROND) return FROND;
  const rows = 12, cols = [-1, -0.5, 0, 0.5, 1], pos = [], uv = [], idx = [];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, w = 0.26 * Math.sin(Math.min(1, t * 1.15 + 0.12) * Math.PI) + 0.02;
    for (const c of cols) {
      const x = c * w, z = t, y = 0.42 * t - 0.95 * t * t - Math.abs(c) * w * 0.55;
      pos.push(x, y, z); uv.push((c + 1) / 2, 1 - t);
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols.length - 1; j++) {
    const a = i * cols.length + j, b = a + cols.length;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  FROND = new THREE.BufferGeometry();
  FROND.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  FROND.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  FROND.setIndex(idx);
  FROND.computeVertexNormals();
  return FROND;
}

let frondMat = null;
/** A palm in a planter: a ringed trunk leaning a little, a crown of fronds that sway. */
function palm(parent, x, z, h = 2.1, seed = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  planter(g, 0.46, 0.52);
  frondMat ??= std({ map: texOf(frondArt()), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7 });
  const bark = [std({ color: '#8a6440', roughness: 0.9 }), std({ color: '#a47a4e', roughness: 0.9 })];
  const lean = 0.12 + (seed % 3) * 0.05, dir = seed * 1.7, n = 9, seg = (h - 0.5) / n;
  let px = 0, pz = 0, py = 0.48;
  for (let i = 0; i < n; i++) {
    const k = i / n, r0 = 0.1 - k * 0.035, dx = Math.cos(dir) * lean * k * k * 0.5, dz = Math.sin(dir) * lean * k * k * 0.5;
    const s = put(g, new THREE.CylinderGeometry(r0 * 0.92, r0 * 1.12, seg, 10), bark[i % 2], px + dx, py + seg / 2, pz + dz);
    s.rotation.set(Math.sin(dir) * lean * k, 0, -Math.cos(dir) * lean * k);
    px += dx; pz += dz; py += seg * 0.98;
  }
  const crown = new THREE.Group();
  crown.position.set(px, py, pz);
  g.add(crown);
  for (let i = 0; i < 10; i++) {
    const f = new THREE.Mesh(frondGeo(), frondMat), len = 0.95 + ((i * 7 + seed) % 4) * 0.12;
    f.scale.set(len, len, len);
    f.rotation.order = 'YXZ';
    f.rotation.y = i / 10 * Math.PI * 2 + seed;
    f.rotation.x = -0.25 + (i % 3) * 0.18;
    f.castShadow = true;
    crown.add(f);
  }
  for (const [a, b] of [[0.06, 0.04], [-0.05, 0.05], [0.0, -0.06]]) put(crown, new THREE.SphereGeometry(0.055, 12, 8), std({ color: '#6a4a2a' }), a, -0.04, b);
  return (now) => { crown.rotation.z = Math.sin(now / 1700 + seed) * 0.035; crown.rotation.x = Math.cos(now / 2100 + seed) * 0.03; };
}

/** A clipped ball of leaves on a short stem in a square planter, gold trimmed. */
function topiary(parent, x, z, r = 0.3, seed = 0) {
  const M = mats(), g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  put(g, new THREE.BoxGeometry(0.5, 0.42, 0.5), M.stone, 0, 0.21, 0);
  put(g, new THREE.BoxGeometry(0.56, 0.05, 0.56), M.gold, 0, 0.43, 0);
  put(g, new THREE.BoxGeometry(0.44, 0.02, 0.44), M.soil, 0, 0.45, 0, false);
  put(g, new THREE.CylinderGeometry(0.025, 0.035, 0.3, 8), std({ color: '#6a4a2a' }), 0, 0.58, 0);
  const geo = new THREE.IcosahedronGeometry(r, 4), p = geo.attributes.position, col = [];
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i), n = Math.sin(v.x * 31 + seed) * Math.sin(v.y * 27) * Math.sin(v.z * 29 + seed);
    v.multiplyScalar(1 + n * 0.07);
    p.setXYZ(i, v.x, v.y, v.z);
    const k = 0.75 + (v.y / r) * 0.2 + n * 0.3;
    col.push(0.24 * k, 0.56 * k, 0.22 * k);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  put(g, geo, std({ vertexColors: true, roughness: 0.9 }), 0, 0.72 + r * 0.8, 0);
  return g;
}

/* ---------- benches, lamps, columns ---------- */

/** A park bench: wooden slats on cast-iron ends with curled arms, facing +z before `ry` turns it. */
function bench(parent, x, z, ry, len = 1.4) {
  const M = mats(), g = new THREE.Group();
  g.position.set(x, 0, z); g.rotation.y = ry;
  parent.add(g);
  for (const dz of [-0.13, 0, 0.13]) put(g, new THREE.BoxGeometry(len, 0.04, 0.11), M.wood, 0, 0.42, dz + 0.02);
  for (const [y, t] of [[0.6, -0.2], [0.76, -0.24]]) {
    const s = put(g, new THREE.BoxGeometry(len, 0.11, 0.035), M.wood, 0, y, t);
    s.rotation.x = -0.14;
  }
  for (const sx of [-1, 1]) {
    const ex = sx * (len / 2 - 0.06);
    put(g, new THREE.BoxGeometry(0.04, 0.4, 0.04), M.iron, ex, 0.2, 0.16);
    const back = put(g, new THREE.BoxGeometry(0.04, 0.84, 0.04), M.iron, ex, 0.42, -0.2);
    back.rotation.x = -0.12;
    put(g, new THREE.BoxGeometry(0.04, 0.04, 0.42), M.iron, ex, 0.39, 0);
    const arm = put(g, new THREE.TorusGeometry(0.1, 0.018, 8, 16, Math.PI * 1.3), M.iron, ex, 0.56, 0.1);
    arm.rotation.y = Math.PI / 2;
    for (const fz of [0.16, -0.24]) put(g, new THREE.BoxGeometry(0.08, 0.02, 0.08), M.iron, ex, 0.01, fz);
  }
  return g;
}

/** A street lamp: a fluted iron post on a stepped foot, a scroll arm each side, three warm globes. */
function lamp(parent, x, z, glows) {
  const M = mats(), g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  put(g, lathe([[0, 0], [0.16, 0], [0.16, 0.06], [0.11, 0.1], [0.11, 0.2], [0.06, 0.28], [0.045, 0.32], [0, 0.32]], 24), M.iron);
  put(g, new THREE.CylinderGeometry(0.035, 0.045, 1.9, 12), M.iron, 0, 1.25, 0);
  put(g, new THREE.TorusGeometry(0.05, 0.015, 8, 16), M.gold, 0, 0.5, 0).rotation.x = Math.PI / 2;
  const glow = std({ color: '#fff4d8', emissive: '#ffd890', emissiveIntensity: 1.6, roughness: 0.2 });
  glows.push(glow);
  for (const [gx, gy] of [[0, 2.32], [-0.26, 2.08], [0.26, 2.08]]) {
    if (gx) { const arm = put(g, new THREE.TorusGeometry(0.13, 0.016, 8, 16, Math.PI / 2), M.iron, gx / 2, 2.02, 0); arm.rotation.z = gx < 0 ? Math.PI / 2 : 0; }
    put(g, new THREE.SphereGeometry(0.11, 20, 14), glow, gx, gy, 0, false);
    put(g, new THREE.CylinderGeometry(0.05, 0.07, 0.04, 12), M.iron, gx, gy - 0.11, 0);
  }
  put(g, new THREE.ConeGeometry(0.04, 0.1, 8), M.gold, 0, 2.48, 0);
}

function fluteArt() {
  const f = fine(32, 8, 6), { g, lin } = f;
  for (let x = 0; x < 32; x += 4) { g.fillStyle = lin(x, 0, x + 4, 0, ['#ffffff', '#f2ece0', '#d8ccb6']); g.fillRect(x, 0, 4, 8); }
  return f.c;
}

/** A marble column from the floor to the mezzanine's underside, fluted, a gold base and capital. */
function column(parent, x, z, h) {
  const M = mats(), g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  const t = texOf(fluteArt()); t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1);
  put(g, new THREE.CylinderGeometry(0.17, 0.19, h - 0.5, 32), std({ map: t, roughness: 0.3 }), 0, h / 2, 0);
  put(g, lathe([[0, 0], [0.28, 0], [0.28, 0.1], [0.22, 0.14], [0.22, 0.22], [0.19, 0.26], [0, 0.26]], 32), M.stone);
  put(g, new THREE.TorusGeometry(0.2, 0.025, 8, 32), M.gold, 0, 0.27, 0).rotation.x = Math.PI / 2;
  put(g, lathe([[0, h - 0.26], [0.18, h - 0.26], [0.22, h - 0.2], [0.3, h - 0.1], [0.32, h], [0, h]], 32), M.gold);
}

/* ---------- escalators ---------- */

/** An escalator up to the mezzanine at `x`, its foot at `z0` on the floor, its head at `z1`, `rise` up: a steel truss,
    glass balustrades under black handrails, and steps gliding up it. */
function escalator(parent, x, z0, z1, rise, calm) {
  const M = mats(), g = new THREE.Group(), run = z0 - z1, L = Math.hypot(run, rise), a = Math.atan2(rise, run), w = 1.3;
  g.position.set(x, 0, 0);
  parent.add(g);
  const slope = new THREE.Group();
  slope.position.set(0, rise / 2, (z0 + z1) / 2);
  slope.rotation.x = a;
  g.add(slope);
  put(slope, new THREE.BoxGeometry(w + 0.3, 0.32, L + 0.4), M.steel, 0, -0.2, 0);
  for (const s of [-1, 1]) {
    put(slope, new THREE.BoxGeometry(0.08, 0.12, L + 0.5), M.steel, s * (w / 2 + 0.06), 0.02, 0);
    put(slope, new THREE.BoxGeometry(0.03, 0.78, L + 0.3), M.glass, s * (w / 2 + 0.06), 0.47, 0, false);
    put(slope, new THREE.BoxGeometry(0.1, 0.07, L + 0.6), M.rubber, s * (w / 2 + 0.06), 0.89, 0);
  }
  // the foot's comb plate and newels
  put(g, new THREE.BoxGeometry(w + 0.3, 0.05, 0.7), M.steel, 0, 0.025, z0 + 0.25);
  for (const s of [-1, 1]) {
    const newel = put(g, new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16, 1, false, 0, Math.PI), M.rubber, s * (w / 2 + 0.06), 0.88, z0 + 0.3);
    newel.rotation.z = Math.PI / 2;
    put(g, new THREE.BoxGeometry(0.1, 0.84, 0.36), M.steel, s * (w / 2 + 0.06), 0.42, z0 + 0.42);
  }
  const N = 16, d = L / N, stepGeo = new THREE.BoxGeometry(w, d * Math.sin(a) + 0.03, d * Math.cos(a));
  const steps = new THREE.InstancedMesh(stepGeo, std({ color: '#7a808c', metalness: 0.6, roughness: 0.35 }), N);
  steps.castShadow = steps.receiveShadow = true;
  g.add(steps);
  const m = new THREE.Matrix4(), place = (off) => {
    for (let i = 0; i < N; i++) {
      const u = ((i + off) % N) / N, y = u * rise, zz = z0 - u * run;
      m.makeTranslation(0, y + (d * Math.sin(a)) / 2 - 0.04, zz - (d * Math.cos(a)) / 2);
      steps.setMatrixAt(i, m);
    }
    steps.instanceMatrix.needsUpdate = true;
  };
  place(0);
  return (now) => { if (!calm) place((now / 700) % N); };
}

/* ---------- along the back wall ---------- */

function vendArt(body, dark, label, cans) {
  const f = fine(16, 34, 8), { g, rr, lin, shine } = f, s = shine();
  rr(0, 0, 16, 34, 1.2, lin(0, 0, 16, 0, [dark, body, body, dark]));
  rr(1.2, 1.2, 13.6, 5, 0.8, '#ffffff');
  words(g, label, 8, 3.8, 3, dark);
  s.fillStyle = '#ffffff'; s.fillRect(1.2, 1.2, 13.6, 5);
  rr(1.4, 7.4, 9.6, 18, 0.6, lin(0, 7, 0, 25, ['#f8fbff', '#dceaf6']));
  s.fillStyle = '#c8d8e8'; s.fillRect(1.4, 7.4, 9.6, 18);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const x = 2.4 + c * 2.2, y = 8.6 + r * 4.2;
    rr(x, y, 1.6, 3.2, 0.6, cans[(r + c) % cans.length]);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x + 0.3, y + 0.4, 0.35, 2.4);
    rr(x - 0.2, y + 3.3, 2, 0.5, 0.2, '#e84838');
  }
  rr(11.8, 7.4, 2.8, 9, 0.5, '#2a2a34');
  for (let i = 0; i < 6; i++) rr(12.4 + (i % 2) * 1.1, 8.4 + Math.floor(i / 2) * 2.2, 0.8, 1.2, 0.3, '#f8d040');
  rr(12, 18, 2.4, 1.2, 0.4, '#1a1a20');
  rr(1.4, 27.4, 13.2, 4.6, 0.6, '#1a1a22');
  words(g, 'PUSH', 8, 29.8, 2, '#8a8a98');
  return f.c;
}

/** A vending machine against the wall, its front lit. */
function vending(parent, x, z, art, glows) {
  const M = mats(), face = std({ map: texOf(art), emissive: '#ffffff', emissiveMap: texOf(art.glow), emissiveIntensity: 0.6, roughness: 0.3 });
  glows.push(face);
  const side = std({ color: '#d8dce4', metalness: 0.4, roughness: 0.4 });
  const m = put(parent, new THREE.BoxGeometry(0.8, 1.7, 0.6), [side, side, side, side, face, side], x, 0.85, z);
  put(parent, new THREE.BoxGeometry(0.84, 0.06, 0.64), M.steel, x, 1.73, z);
  return m;
}

function directoryArt() {
  const f = fine(30, 40, 8), { g, rr, lin, shine } = f, s = shine();
  rr(0, 0, 30, 40, 1.6, '#2a3a5a');
  rr(1.4, 1.4, 27.2, 6.4, 1, lin(0, 1, 0, 8, ['#e84838', '#b8302a']));
  words(g, 'MALL GUIDE', 15, 4.8, 3.6, '#ffffff');
  rr(1.4, 9, 27.2, 29.6, 1, lin(0, 9, 0, 38, ['#fbf6ea', '#ece2cc']));
  s.fillStyle = '#ffffff'; s.fillRect(1.4, 9, 27.2, 29.6); s.fillStyle = '#ffffff'; s.fillRect(1.4, 1.4, 27.2, 6.4);
  const shops = [['#58a858', 'FURNITURE', 6], ['#5a3a8a', 'GAME CORNER', 15], ['#e88a30', 'SOON', 24]];
  for (const [col, name, x] of shops) {
    rr(x - 4, 11, 8, 7, 0.6, col);
    words(g, name, x, 20.4, name.length > 8 ? 1.5 : 1.8, '#3a3040');
  }
  rr(13, 23, 4, 10, 0.4, '#d8b8a0');
  g.fillStyle = '#7ac0e8'; g.beginPath(); g.arc(15, 27, 2.2, 0, Math.PI * 2); g.fill();
  rr(3, 23, 7, 5, 0.4, '#d8d0c0'); rr(20, 23, 7, 5, 0.4, '#d8d0c0');
  rr(3, 30, 7, 5, 0.4, '#d8d0c0'); rr(20, 30, 7, 5, 0.4, '#d8d0c0');
  g.fillStyle = '#e84838'; g.beginPath(); g.arc(15, 35.4, 1.3, 0, Math.PI * 2); g.fill();
  words(g, 'YOU ARE HERE', 15, 37.6, 1.5, '#e84838');
  return f.c;
}

/** The mall guide: a lit map on a steel stand. */
function directory(parent, x, z, glows) {
  const M = mats(), art = directoryArt(), g = new THREE.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  const face = std({ map: texOf(art), emissive: '#ffffff', emissiveMap: texOf(art.glow), emissiveIntensity: 0.55, roughness: 0.35 });
  glows.push(face);
  const frame = std({ color: '#3a3e4c', metalness: 0.5, roughness: 0.35 });
  put(g, new THREE.BoxGeometry(0.86, 1.14, 0.1), [frame, frame, frame, frame, face, frame], 0, 1.12, 0);
  for (const s of [-1, 1]) put(g, new THREE.BoxGeometry(0.07, 0.6, 0.07), M.steel, s * 0.32, 0.3, 0);
  put(g, new THREE.BoxGeometry(0.9, 0.05, 0.36), M.steel, 0, 0.025, 0);
  const cap = put(g, new THREE.CylinderGeometry(0.06, 0.06, 0.9, 12, 1, false, 0, Math.PI), std({ color: '#e84838' }), 0, 1.7, 0);
  cap.rotation.z = Math.PI / 2;
}

function bannerArt(col, dark, motif) {
  const f = fine(10, 30, 8), { g, lin } = f;
  g.fillStyle = lin(0, 0, 10, 0, [dark, col, dark]);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(10, 0); g.lineTo(10, 30); g.lineTo(5, 26); g.lineTo(0, 30); g.closePath(); g.fill();
  g.fillStyle = '#f8d040'; g.fillRect(0, 1.4, 10, 0.7); g.fillRect(0, 22.6, 10, 0.5);
  g.fillStyle = '#ffffff';
  if (motif === 'ball') {
    g.beginPath(); g.arc(5, 12, 3.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = dark; g.beginPath(); g.arc(5, 12, 3.4, Math.PI, 0); g.fill();
    g.fillStyle = '#2a2238'; g.fillRect(1.6, 11.7, 6.8, 0.6);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(5, 12, 1.1, 0, Math.PI * 2); g.fill();
  } else star(g, 5, 12, 3.6);
  return f.c;
}

/** The hall: everything but the floor, walls and mezzanine. `at(tx, ty)` is a tile's middle in the hall's units. */
export function dressHall(three, { group, at, cols, rows, deck, deckD, block, calm }) {
  THREE = three;
  const ticks = [], glows = [], wallZ = -rows / 2, mid = (cols - 1) / 2;
  // twin fountains either side of the red carpet, so it runs clear from the doors to the Game Corner (the user found
  // one big fountain in the middle too big and in the way, 2026-10-12)
  for (const [fx, fy] of FOUNTAINS) {
    ticks.push(fountain(group, ...at(fx, fy), calm, FOUNTAIN_SCALE));
    for (let x = fx - 1; x <= fx + 1; x++) for (let y = fy - 1; y <= fy + 1; y++) block(x, y);
  }
  // escalators up each side to the mezzanine
  const zFoot = at(0, 6)[1] + 0.5, zHead = wallZ + deckD;
  for (const [x0, x1] of [[0, 1], [cols - 2, cols - 1]]) {
    ticks.push(escalator(group, (at(x0, 0)[0] + at(x1, 0)[0]) / 2, zFoot, zHead, deck + 0.22, calm));
    for (let y = 1; y <= 6; y++) { block(x0, y); block(x1, y); }
  }
  // the mezzanine's columns, between the fronts
  for (const x of [mid - 3, mid + 3]) { column(group, at(x, 0)[0], wallZ + deckD - 0.18, deck); block(x, 0); }
  // vending machines and the guide in the gaps
  vending(group, at(mid - 4, 0)[0], wallZ + 0.32, vendArt('#e84838', '#a82820', 'SODA POP', ['#e84838', '#f8d040', '#ff9a30']), glows);
  vending(group, at(mid - 2, 0)[0], wallZ + 0.32, vendArt('#3a8ad8', '#2a5a9a', 'FRESH WATER', ['#7ac8f0', '#ffffff', '#4aa8e0']), glows);
  block(mid - 4, 0); block(mid - 2, 0);
  directory(group, at(mid + 2, 0)[0], wallZ + 0.4, glows);
  block(mid + 2, 0);
  topiary(group, ...at(mid + 4, 0), 0.26, 6);
  block(mid + 4, 0);
  // the tall palms keep to the room's sides, beside the outer shops and in the front corners (the user's call, 2026-10-12)
  for (const [x, y, s, z] of [[2, 0, 3, 0.05], [cols - 3, 0, 4, 0.05], [0, rows - 2, 1, 0], [cols - 1, rows - 2, 2, 0]]) { ticks.push(palm(group, ...at(x, y).map((v, i) => v + (i ? z : 0)), 1.9, s)); block(x, y); }
  // benches by the fountains (the two at the front taken out, 2026-10-12, the user's call), lamps and topiary lining the carpet
  const [lf, rf] = FOUNTAINS;
  bench(group, ...at(lf[0] - 3, lf[1]), Math.PI / 2); block(lf[0] - 3, lf[1]);
  bench(group, ...at(rf[0] + 3, rf[1]), -Math.PI / 2); block(rf[0] + 3, rf[1]);
  for (const [x, y] of [[mid - 1, 3], [mid + 1, 3], [mid - 1, 7], [mid + 1, 7]]) { lamp(group, ...at(x, y), glows); block(x, y); }
  for (const [x, y, s] of [[mid - 2, 5, 1], [mid + 2, 5, 2]]) { topiary(group, ...at(x, y), 0.26, s); block(x, y); }
  // banners off the mezzanine, either side of each column
  const banners = [];
  [[mid - 4, '#e84838', '#a82820', 'ball'], [mid - 2, '#3a8ad8', '#2a5a9a', 'star'], [mid + 2, '#58b048', '#3a7a30', 'star'], [mid + 4, '#f0a830', '#c07818', 'ball']].forEach(([x, c, d, m], i) => {
    const geo = new THREE.PlaneGeometry(0.36, 1.0, 1, 6);
    geo.translate(0, -0.5, 0);
    const b = new THREE.Mesh(geo, std({ map: texOf(bannerArt(c, d, m)), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }));
    b.position.set(at(x, 0)[0], deck - 0.02, wallZ + deckD + 0.25);
    b.castShadow = true; b.userData.phase = i * 1.3;
    group.add(b); banners.push(b);
  });
  ticks.push((now) => { if (!calm) for (const b of banners) { b.rotation.x = Math.sin(now / 1500 + b.userData.phase) * 0.05; b.rotation.y = Math.sin(now / 2300 + b.userData.phase) * 0.08; } });
  return { tick: (now, dt) => { for (const t of ticks) t(now, dt); }, glows };
}

/* ---------- the shop entrances ---------- */

function signArt(kind) {
  const f = fine(66, 13, 10), { g, rr, lin, shine } = f, s = shine();
  if (kind === 'furniture') {
    rr(0, 0, 66, 13, 2, lin(0, 0, 0, 13, ['#8a5a30', '#6a4020']));
    rr(1, 1, 64, 11, 1.6, lin(0, 1, 0, 12, ['#c89060', '#b07848', '#a06838']));
    g.strokeStyle = 'rgba(90,50,20,0.3)'; g.lineWidth = 0.3;
    for (let y = 2.5; y < 12; y += 1.6) { g.beginPath(); g.moveTo(1, y); g.bezierCurveTo(20, y + 0.4, 40, y - 0.4, 65, y); g.stroke(); }
    g.fillStyle = '#4aa860';
    g.beginPath(); g.ellipse(9, 6.5, 3.4, 4.6, 0.5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#d8f0c0'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(7.2, 9.6); g.lineTo(10.6, 3.6); g.stroke();
    g.lineWidth = 1.1; g.strokeStyle = '#4a2c14';
    g.font = '900 7px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeText('FURNITURE', 37, 7); words(g, 'FURNITURE', 37, 7, 7, '#fff4dc');
    s.fillStyle = '#806040'; s.fillRect(0, 0, 66, 13);
    words(s, 'FURNITURE', 37, 7, 7, '#ffe8c0');
  } else if (kind === 'corner') {
    rr(0, 0, 66, 13, 2, GC.goldDark);
    rr(0.8, 0.8, 64.4, 11.4, 1.6, lin(0, 0, 0, 13, ['#6a44a0', GC.violet, GC.violetDark]));
    g.fillStyle = GC.gold; star(g, 6, 6.5, 3); star(g, 60, 6.5, 3);
    g.lineWidth = 1.2; g.strokeStyle = '#2a1040';
    g.font = '900 7.4px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeText('GAME CORNER', 33, 7); words(g, 'GAME CORNER', 33, 7, 7.4, '#ffe060');
    s.fillStyle = '#301850'; s.fillRect(0, 0, 66, 13);
    words(s, 'GAME CORNER', 33, 7, 7.4, '#ffe890');
    s.fillStyle = '#ffe890'; star(s, 6, 6.5, 3); star(s, 60, 6.5, 3);
  } else {
    rr(0, 0, 66, 13, 2, '#8a4410');
    rr(1, 1, 64, 11, 1.6, lin(0, 0, 0, 13, ['#ffa040', '#e87a20', '#c85e10']));
    g.lineWidth = 1.1; g.strokeStyle = '#7a3a08';
    g.font = '900 7px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeText('COMING SOON', 33, 7); words(g, 'COMING SOON', 33, 7, 7, '#fff8ec');
    s.fillStyle = '#402008'; s.fillRect(1, 1, 64, 11);
    words(s, 'COMING SOON', 33, 7, 7, '#ffe0b0');
  }
  return f.c;
}

function awningArt() {
  const f = fine(64, 24, 6), { g } = f;
  for (let x = 0; x < 64; x += 8) { g.fillStyle = (x / 8) % 2 ? '#fbf3e0' : '#4aa860'; g.fillRect(x, 0, 8, 24); }
  g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 20, 64, 4);
  return f.c;
}

function valanceArt() {
  const f = fine(64, 8, 8), { g } = f;
  g.clearRect(0, 0, 64, 8);
  for (let x = 0; x < 64; x += 8) {
    g.fillStyle = (x / 8) % 2 ? '#fbf3e0' : '#4aa860';
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, 0); g.lineTo(x + 8, 4); g.arc(x + 4, 4, 4, 0, Math.PI); g.closePath(); g.fill();
  }
  g.fillStyle = '#3a8a4c'; g.fillRect(0, 0, 64, 1);
  return f.c;
}

function stripeArt() {
  const f = fine(32, 4, 6), { g } = f;
  for (let x = -4; x < 36; x += 6) { g.fillStyle = '#e84838'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 3, 0); g.lineTo(x + 7, 4); g.lineTo(x + 4, 4); g.closePath(); g.fill(); }
  g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, 32, 4);
  return f.c;
}

function hoardArt() {
  const f = fine(40, 20, 8), { g, rr, lin } = f;
  rr(0, 0, 40, 20, 1, lin(0, 0, 0, 20, ['#f8d070', '#f0b848']));
  rr(1.2, 1.2, 37.6, 17.6, 0.8, '#fff8e8');
  words(g, 'SOMETHING NEW', 20, 6.6, 3.8, '#c86a18');
  words(g, 'IS COMING!', 20, 11, 3.8, '#c86a18');
  g.fillStyle = '#e8a830';
  for (const x of [5, 35]) star(g, x, 8.6, 2.2);
  words(g, '? ? ?', 20, 15.6, 3, '#8a7a68');
  return f.c;
}

/** Each shop's entrance built out from the wall. `fronts` are the hall's FRONTS, `at` a tile's middle, `wallZ` the back
    wall's face; tagged with its front so a tap on any of it walks there. */
export function dressFronts(three, { group, fronts, at, wallZ, block, calm }) {
  THREE = three;
  const M = mats(), glows = [], bulbs = [[], [], []], ticks = [];
  const bulbMats = [0, 1, 2].map(() => std({ color: '#fff6d0', emissive: '#ffe08a', emissiveIntensity: 1.2, roughness: 0.3 }));
  const bulbGeo = new THREE.SphereGeometry(0.035, 10, 8);
  for (const fr of fronts) {
    const g = new THREE.Group(), [cx] = at(fr.x, 0);
    g.position.set(cx, 0, wallZ);
    group.add(g);
    const pil = fr.id === 'corner' ? std({ color: GC.violetDark, roughness: 0.4 }) : fr.id === 'furniture' ? M.wood : M.stone;
    for (const s of [-1, 1]) {
      put(g, new THREE.BoxGeometry(0.2, 2.5, 0.16), pil, s * 1.52, 1.25, 0.08);
      put(g, new THREE.BoxGeometry(0.26, 0.08, 0.2), fr.id === 'east' ? M.stoneDark : M.gold, s * 1.52, 0.04, 0.1);
    }
    const art = signArt(fr.id), face = std({ map: texOf(art), emissive: '#ffffff', emissiveMap: texOf(art.glow), emissiveIntensity: 0.9, roughness: 0.35 });
    glows.push(face);
    const trim = fr.id === 'corner' ? M.gold : fr.id === 'furniture' ? std({ color: '#6a4020' }) : std({ color: '#c86a18' });
    put(g, new THREE.BoxGeometry(3.3, 0.66, 0.24), [trim, trim, trim, trim, face, trim], 0, 2.25, 0.12);
    if (fr.id === 'furniture') {
      const roof = new THREE.PlaneGeometry(3.24, 0.66, 1, 1);
      const aw = put(g, roof, std({ map: texOf(awningArt()), side: THREE.DoubleSide, roughness: 0.85 }), 0, 1.78, 0.3);
      aw.rotation.x = -Math.PI / 2 + 0.5;
      const val = put(g, new THREE.PlaneGeometry(3.24, 0.18), std({ map: texOf(valanceArt()), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 }), 0, 1.55, 0.6);
      val.castShadow = true;
      put(g, new THREE.CylinderGeometry(0.012, 0.012, 3.24, 6), M.iron, 0, 1.64, 0.6).rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) {   // flower troughs under the windows
        put(g, new THREE.BoxGeometry(0.86, 0.22, 0.22), M.wood, s * 0.95, 0.11, 0.45);
        const cols = ['#e86a8a', '#f8d040', '#ffffff', '#e84838', '#b070e0'];
        for (let i = 0; i < 9; i++) {
          const fx = s * 0.95 - 0.36 + i * 0.09, fz = 0.42 + ((i * 5) % 3 - 1) * 0.05;
          put(g, new THREE.SphereGeometry(0.06, 10, 8), std({ color: '#58a848', roughness: 0.9 }), fx, 0.25, fz, false);
          put(g, new THREE.SphereGeometry(0.035, 10, 8), std({ color: cols[i % cols.length], roughness: 0.6 }), fx + 0.02, 0.31 + (i % 2) * 0.03, fz + 0.03, false);
        }
      }
    } else if (fr.id === 'corner') {
      put(g, new THREE.BoxGeometry(3.4, 0.07, 0.72), std({ color: GC.violetDark, roughness: 0.4 }), 0, 1.86, 0.36);
      put(g, new THREE.BoxGeometry(3.42, 0.05, 0.05), M.gold, 0, 1.86, 0.72);
      let i = 0;
      const bulb = (x, y, z) => { const b = put(g, bulbGeo, bulbMats[i % 3], x, y, z, false); bulbs[i % 3].push(b); i++; };
      for (let x = -1.6; x <= 1.61; x += 0.16) { bulb(x, 2.6, 0.25); bulb(x, 1.9, 0.25); }
      for (let y = 2.0; y <= 2.5; y += 0.15) { bulb(-1.66, y, 0.25); bulb(1.66, y, 0.25); }
      for (let x = -1.6; x <= 1.61; x += 0.2) bulb(x, 1.8, 0.72);
      for (const s of [-1, 1]) {   // gold star finials on the pilasters
        const shape = new THREE.Shape();
        for (let k = 0; k < 10; k++) { const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.07 : 0.16; k ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
        const st = put(g, new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }), M.gold, s * 1.52, 2.78, 0.06);
        st.userData.spin = s;
        ticks.push((now) => { if (!calm) st.rotation.y = Math.sin(now / 900 + s) * 0.5; });
      }
      // velvet ropes along the carpet: brass stanchions and a sagging red rope between them
      const rope = std({ color: '#b01828', roughness: 0.6 });
      for (const s of [-1, 1]) {
        const posts = [[s * 0.82, 1.15], [s * 0.82, 1.95]];
        for (const [px, pz] of posts) {
          put(g, new THREE.CylinderGeometry(0.03, 0.03, 0.78, 10), M.brass, px, 0.39, pz);
          put(g, new THREE.SphereGeometry(0.055, 14, 10), M.brass, px, 0.8, pz);
          put(g, new THREE.CylinderGeometry(0.13, 0.15, 0.04, 18), M.brass, px, 0.02, pz);
        }
        const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * 0.82, 0.74, 1.15), new THREE.Vector3(s * 0.82, 0.48, 1.55), new THREE.Vector3(s * 0.82, 0.74, 1.95));
        put(g, new THREE.TubeGeometry(curve, 16, 0.022, 8), rope);
        block(fr.x + s, 1);
      }
    } else {
      // the shuttered shop: a striped barrier on trestles, cones, a board
      const stripe = texOf(stripeArt());
      stripe.wrapS = THREE.RepeatWrapping; stripe.repeat.set(2.5, 1);
      put(g, new THREE.BoxGeometry(2.2, 0.16, 0.05), std({ map: stripe, roughness: 0.5 }), 0, 0.62, 0.95);
      for (const s of [-1, 1]) for (const d of [-1, 1]) {
        const leg = put(g, new THREE.BoxGeometry(0.05, 0.72, 0.05), std({ color: '#e8e8ec' }), s * 0.9, 0.34, 0.95 + d * 0.1);
        leg.rotation.x = d * 0.22;
      }
      const cone = std({ color: '#ff7a20', roughness: 0.5 }), band = std({ color: '#ffffff', roughness: 0.4 });
      for (const s of [-1.35, 1.35]) {
        put(g, new THREE.BoxGeometry(0.3, 0.03, 0.3), cone, s, 0.015, 1.1);
        put(g, new THREE.ConeGeometry(0.11, 0.42, 20), cone, s, 0.24, 1.1);
        put(g, new THREE.CylinderGeometry(0.068, 0.082, 0.07, 20), band, s, 0.26, 1.1);
      }
      const board = put(g, new THREE.BoxGeometry(1.4, 0.7, 0.04), [M.wood, M.wood, M.wood, M.wood, std({ map: texOf(hoardArt()), roughness: 0.6 }), M.wood], 0, 1.18, 0.5);
      board.rotation.x = -0.05;
      for (let x = fr.x - 1; x <= fr.x + 1; x++) block(x, 0);
    }
    g.traverse(o => { o.userData.front = fr; });
  }
  ticks.push((now) => {
    const k = calm ? -1 : Math.floor(now / 160) % 3;
    bulbMats.forEach((m, i) => { m.emissiveIntensity = k < 0 ? 1 : i === k ? 2.4 : 0.35; });
  });
  return { tick: (now, dt) => { for (const t of ticks) t(now, dt); }, glows };
}
