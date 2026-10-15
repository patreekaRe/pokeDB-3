/* leader-homes.js  -  inside the Gym Leaders' houses in the towns (2026-10-14, the user's ask: "they're so small and very
   bland, we need to beef them up ALOT"). js/event-3d.js's buildHome() hands a leader's home here with its kit (K, the
   room being built and its helpers): a 13 x 10 room the shot slides about (LEADER_SIZE), the leader's own wallpaper and
   floor painted here, 25-odd pieces from the Secret Base's catalogue laid out in corners that say who they are, things
   hung on the walls, and props of their own built here (John's three handhelds, Clarence's stage and disco ball, Phil's
   chair rocking in its salt circle, the tree through Ricky's den...). Who each friend is: docs/reference/gym-leaders.md.
   Two point lights a room at most (they're dear on phones); everything else only glows, and the bloom does the rest. */

import { GYM_INK } from './data/gym.js';

export const LEADER_SIZE = { cols: 13, rows: 10, view: 8, across: 7.5 };

const U = 20, TOP = 8;
const wy = (y) => (TOP - y) * U;              // a height's y on a wall's painting
const BOLD = (px) => `900 ${px}px "Trebuchet MS", "Arial Black", sans-serif`;
const HAND = (px) => `700 ${px}px "Comic Sans MS", "Chalkboard SE", "Trebuchet MS", sans-serif`;

/* ---------- small helpers, on the room being built ---------- */

function part(K, geo, m, x, y, z, parent = K.B.group) {
  const o = new K.THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  parent.add(o);
  return o;
}
const lit = (K, col, o = {}) => new K.THREE.MeshBasicMaterial({ color: col, toneMapped: false, ...o });
const mat = (K, col, o = {}) => K.std({ color: col, ...o });
function block(K, x, y, w = 1, h = 1) { for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) K.B.blocked.add(`${i},${j}`); }
const ex = (K, e) => e - K.cols / 2;           // a tile edge's x in the room
const ez = (K, e) => e - K.rows / 2;
function lamp(K, col, k, dist, x, y, z) {
  const l = new K.THREE.PointLight(col, k, dist, 1.6);
  l.position.set(x, y, z);
  K.B.group.add(l);
  return l;
}
function group(K, x, y, z, ry = 0) {
  const g = new K.THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  K.B.group.add(g);
  return g;
}
const quiet = (o) => { o.traverse(n => { n.raycast = () => {}; }); return o; };   // a prop never takes a tap meant for the floor

/** A painting `w` x `h` units on a plane `pw` x `ph` in the room; its glow (f.shine()) lights it. */
function sheet(K, w, h, draw, pw, ph, x, y, z, { ry = 0, rx = 0, k = 5, glow = 0.9, parent, clear = false, bright = false } = {}) {
  const f = K.fine(w, h, k);
  draw(f);
  const map = K.texOf(f.c);
  const m = bright ? lit(K, '#ffffff', { map, transparent: clear }) : K.std({ map, roughness: 0.9, transparent: clear, alphaTest: clear ? 0.35 : 0 });
  if (f.c.glow && !bright) { m.emissive = new K.THREE.Color('#ffffff'); m.emissiveMap = K.texOf(f.c.glow); m.emissiveIntensity = glow; }
  const o = part(K, new K.THREE.PlaneGeometry(pw, ph), m, x, y, z, parent);
  o.rotation.set(rx, ry, 0);
  o.castShadow = false;
  o.raycast = () => {};
  return o;
}

function text(g, s, x, y, size, col, { font = BOLD, align = 'center', base = 'middle' } = {}) {
  g.font = font(size); g.textAlign = align; g.textBaseline = base; g.fillStyle = col; g.fillText(s, x, y);
}
/** Neon: the tube's colour on the painting and on its glow, with a halo. */
function neon(f, s, x, y, size, col, font = BOLD) {
  const { g } = f, gl = f.shine();
  for (const c of [g, gl]) {
    c.save(); c.shadowColor = col; c.shadowBlur = size * 0.6;
    text(c, s, x, y, size, col, { font }); c.shadowBlur = 0;
    text(c, s, x, y, size, '#ffffff', { font }); c.globalAlpha = 0.5; text(c, s, x, y, size, col, { font });
    c.restore();
  }
}

/** A piece from the catalogue; `mid` sets a two-wide one on the middle of its tiles (the room's an odd width). */
function put(K, id, x, y, o = {}) {
  const m = K.piece(id, x, y, o.mid ? { ...o, dx: (o.dx || 0) + 0.5 } : o);
  if (!m) { console.warn('leader-homes: no piece', id); return null; }
  if (o.mid && !o.free && K.PIECES[id].layer !== 'rug') { const p = K.PIECES[id], turned = Math.round((o.turn || 0) / (Math.PI / 2)) % 2 !== 0; block(K, x + (turned ? p.h : p.w), y, 1, turned ? p.w : p.h); }
  return m;
}
const topOf = (m) => (m?.userData.top ?? 0.6) * (m?.scale.y ?? 1);

/** A piece hung on a wall: the back wall at `x`, or a side one ('l' / 'r') at `row`. */
function hang(K, id, x, { y = 0, side = null, row = 0, scale = 1 } = {}) {
  if (!side) return put(K, id, x, -0.5, { free: true, y, scale });
  return put(K, id, side === 'l' ? -0.5 : K.cols - 0.5, row, { free: true, y, scale, turn: side === 'l' ? Math.PI / 2 : -Math.PI / 2 });
}

/* ---------- walls and floors ---------- */

/** A wall's painting: the leader's paper (`paint`), then the skirting and its rail. `back` is the back wall (its tiles
    0.4 in, windows and murals on it); `x(t)` a tile's left edge on it. */
function wallArt(K, L, width, back) {
  const f = K.fine(width, TOP * U, 5), s = f.shine();
  const x = back ? (t) => (t + 0.4) * U : (t) => t * U;
  L.paint(K, f, width, { back, x, s, time: K.time });
  if (L.skirt !== false) {
    const [a, b, line] = L.skirt || ['#6a4024', '#4a2a18', '#2a1a10'];
    f.g.fillStyle = f.lin(0, wy(0.9), 0, wy(0), [a, b]); f.g.fillRect(0, wy(0.9), width, 0.9 * U);
    f.g.fillStyle = line; f.g.fillRect(0, wy(0.9) - 1.2, width, 2.2); f.g.fillRect(0, wy(0) - 1.5, width, 1.5);
  }
  return f.c;
}

function sky(K, f, s, x0, x1, top, bottom, frame = '#5a3a22', curtain = null) {
  const t = K.time;
  K.skyWindow(f, s, x0, x1, wy(top), wy(bottom), { frame, curtain, night: t === 'night', sky: t === 'night' ? ['#101830', '#1a2850', '#283868'] : t === 'dusk' ? ['#f08850', '#f8b070', '#fcd8a0'] : ['#68b0f0', '#a8d8f8', '#e0f4ff'] });
}

function boards(K, f, w, cols, h = 6) {
  const r = K.seeded(w | 0);
  for (let y = 0; y < wy(0); y += h) { f.g.fillStyle = cols[Math.floor(r() * cols.length)]; f.g.fillRect(0, y, w, h); f.g.fillStyle = 'rgba(30,16,8,0.4)'; f.g.fillRect(0, y + h - 0.6, w, 0.6); }
}

function floorArt(K, L) {
  const T = 16, W = K.cols * T, H = K.rows * T, f = K.fine(W, H, 5);
  L.floor(K, f, W, H, T);
  return f.c;
}

function tatami(K, f, W, H, T, mat2, edge, gap = '#2a2418') {
  const { g, rr, lin } = f;
  g.fillStyle = gap; g.fillRect(0, 0, W, H);
  for (let y = 0; y < K.rows; y++) for (let x = (y % 2) * -1; x < K.cols; x += 2) {
    rr(x * T + 0.6, y * T + 0.6, 2 * T - 1.2, T - 1.2, 1, lin(0, y * T, 0, (y + 1) * T, mat2));
    g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 2; i < 2 * T - 2; i += 1.4) g.fillRect(x * T + i, y * T + 1, 0.3, T - 2);
    g.fillStyle = edge; g.fillRect(x * T + 0.6, y * T + 0.6, 2 * T - 1.2, 1.2); g.fillRect(x * T + 0.6, (y + 1) * T - 1.8, 2 * T - 1.2, 1.2);
  }
}

/** A circle of runes painted on the floor, glowing (Phil's, round the chair). */
function runeRing(f, cx, cy, r, col) {
  const gl = f.shine();
  for (const c of [f.g, gl]) {
    c.save(); c.strokeStyle = col; c.shadowColor = col; c.shadowBlur = 3; c.lineWidth = 0.7;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(cx, cy, r * 0.78, 0, Math.PI * 2); c.stroke();
    c.beginPath(); for (let i = 0; i <= 7; i++) { const a = -Math.PI / 2 + i * Math.PI * 4 / 7; c.lineTo(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78); } c.stroke();
    c.lineWidth = 0.45;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2, x = cx + Math.cos(a) * r * 0.89, y = cy + Math.sin(a) * r * 0.89;
      c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.beginPath();
      if (i % 3 === 0) { c.moveTo(-0.9, 0.9); c.lineTo(0, -0.9); c.lineTo(0.9, 0.9); } else if (i % 3 === 1) { c.moveTo(0, -1); c.lineTo(0, 1); c.moveTo(-0.8, 0); c.lineTo(0.8, -0.6); } else { c.arc(0, 0, 0.7, 0, Math.PI * 1.5); }
      c.stroke(); c.restore();
    }
    c.restore();
  }
}

/* ---------- props shared by more than one house ---------- */

/** A monitor on a stand, its screen painted (`draw` on a w x h painting), lit like a screen. */
function monitor(K, parent, x, y, z, ry, w, h, draw, { frame = '#18181e' } = {}) {
  const T = K.THREE, g = new T.Group();
  g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  part(K, K.rbox(w + 0.04, h + 0.04, 0.03, 0.012), mat(K, frame, { roughness: 0.4 }), 0, 0.14 + h / 2, 0, g);
  part(K, new T.BoxGeometry(0.035, 0.16, 0.025), mat(K, '#2a2a32'), 0, 0.08, -0.03, g);
  part(K, K.rbox(0.2, 0.014, 0.12, 0.006), mat(K, '#2a2a32'), 0, 0.007, -0.02, g);
  sheet(K, w * 60, h * 60, draw, w, h, 0, 0.14 + h / 2, 0.017, { parent: g, bright: true, k: 8 });
  return g;
}

/** A headset: the band, two cups, a mic boom on one. */
function headset(K, parent, x, y, z, col, ry = 0) {
  const T = K.THREE, g = new T.Group();
  g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const m = mat(K, '#1e1e24', { roughness: 0.5 }), c = mat(K, col, { roughness: 0.4 });
  part(K, new T.TorusGeometry(0.11, 0.014, 6, 16, Math.PI), m, 0, 0, 0, g);
  for (const s of [-1, 1]) { const cup = part(K, new T.CylinderGeometry(0.05, 0.05, 0.04, 12), c, s * 0.11, -0.02, 0, g); cup.rotation.z = Math.PI / 2; }
  const boom = part(K, new T.CylinderGeometry(0.006, 0.006, 0.12, 5), m, -0.09, -0.07, 0.04, g); boom.rotation.x = 1.2;
  return quiet(g);
}

/** A mug, `empty` showing its bottom ring. */
function mug(K, parent, x, y, z, col, { ry = 0, tipped = false } = {}) {
  const T = K.THREE, g = new T.Group();
  g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const m = mat(K, col, { roughness: 0.45 });
  part(K, new T.CylinderGeometry(0.055, 0.05, 0.12, 14, 1, true), Object.assign(m, { side: T.DoubleSide }), 0, 0.06, 0, g);
  part(K, new T.CylinderGeometry(0.05, 0.05, 0.01, 14), mat(K, '#5a3a24'), 0, 0.012, 0, g);
  part(K, new T.TorusGeometry(0.032, 0.01, 6, 10), m, 0.06, 0.06, 0, g).rotation.y = Math.PI / 2;
  if (tipped) { g.rotation.z = Math.PI / 2; g.position.y += 0.055; }
  return quiet(g);
}

/** A wall clock hung on the back wall: a face, numbers, hands; `fixed` [h, m] stops it (Ricky's is always 2:07), else
    it keeps your time. */
function wallClock(K, x, y, r, { rim = '#2a2a3a', face = '#fbf8ef', mark = null, fixed = null } = {}) {
  const T = K.THREE, z = ez(K, 0) + 0.04, g = group(K, x, y, z);
  part(K, new T.CylinderGeometry(r, r, 0.06, 32), mat(K, rim, { roughness: 0.4 }), 0, 0, 0, g).rotation.x = Math.PI / 2;
  sheet(K, 40, 40, (f) => {
    const { g: c } = f;
    c.fillStyle = face; c.beginPath(); c.arc(20, 20, 19, 0, Math.PI * 2); c.fill();
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; text(c, String(i), 20 + Math.cos(a) * 15, 20.4 + Math.sin(a) * 15, i === mark ? 6.4 : 4.6, i === mark ? '#e03040' : '#2a2a3a'); }
    if (mark) { c.strokeStyle = '#e03040'; c.lineWidth = 0.8; c.beginPath(); const a = mark / 12 * Math.PI * 2 - Math.PI / 2; c.arc(20 + Math.cos(a) * 15, 20 + Math.sin(a) * 15, 3.6, 0, Math.PI * 2); c.stroke(); }
  }, r * 1.9, r * 1.9, 0, 0, 0.032, { parent: g, k: 4 });
  const hand = (len, wid, col) => { const p = new T.Group(); p.position.z = 0.04; g.add(p); part(K, new T.BoxGeometry(wid, len, 0.01), mat(K, col), 0, len / 2 - 0.02, 0, p); return p; };
  const hr = hand(r * 0.5, 0.035, '#2a2a3a'), mn = hand(r * 0.78, 0.024, '#2a2a3a'), sc = fixed ? null : hand(r * 0.85, 0.01, '#e03040');
  const set = () => {
    const d = new Date(), h = fixed ? fixed[0] : d.getHours() % 12, m = fixed ? fixed[1] : d.getMinutes(), s = d.getSeconds() + d.getMilliseconds() / 1000;
    hr.rotation.z = -(h + m / 60) / 12 * Math.PI * 2; mn.rotation.z = -(m + s / 60) / 60 * Math.PI * 2;
    if (sc) sc.rotation.z = -Math.floor(s) / 60 * Math.PI * 2;
  };
  set();
  if (!fixed) K.B.ticks.push(set);
  return quiet(g);
}

/** Strings of fairy lights from one point to another, sagging, the bulbs twinkling. */
function fairyStrings(K, strands, cols = ['#fff0b0', '#ffd890', '#ffc0d8']) {
  const T = K.THREE, at = [];
  for (const [a, b, sag, n] of strands) {
    const pts = [];
    for (let i = 0; i <= 16; i++) { const k = i / 16; pts.push(new T.Vector3(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k - Math.sin(k * Math.PI) * sag, a[2] + (b[2] - a[2]) * k)); }
    const curve = new T.CatmullRomCurve3(pts);
    quiet(part(K, new T.TubeGeometry(curve, 32, 0.008, 4, false), mat(K, '#2a3a2a'), 0, 0, 0)).castShadow = false;
    for (let i = 1; i < n; i++) at.push(curve.getPoint(i / n));
  }
  const bulbs = new T.InstancedMesh(new T.SphereGeometry(0.03, 8, 6), lit(K, '#ffffff'), at.length), o = new T.Object3D(), c = new T.Color();
  at.forEach((p, i) => { o.position.copy(p); o.position.y -= 0.03; o.updateMatrix(); bulbs.setMatrixAt(i, o.matrix); bulbs.setColorAt(i, c.set(cols[i % cols.length])); });
  bulbs.raycast = () => {};
  K.B.group.add(bulbs);
  let next = 0;
  K.B.ticks.push((now) => {
    if (K.calm() || now < next) return;
    next = now + 140;
    const i = Math.floor(Math.random() * at.length), on = Math.random() < 0.7;
    bulbs.setColorAt(i, c.set(cols[i % cols.length]).multiplyScalar(on ? 1 : 0.35));
    bulbs.instanceColor.needsUpdate = true;
  });
  return bulbs;
}

/** A strip of LEDs (a thin glowing bar), its colour cycling round the wheel, or pulsing in `col`. */
function ledStrip(K, len, x, y, z, { col = null, ry = 0, light = null } = {}) {
  const T = K.THREE, m = new T.MeshStandardMaterial({ color: '#111111', emissive: new T.Color(col || '#ff0000'), emissiveIntensity: 1.6 });
  const o = quiet(part(K, new T.BoxGeometry(len, 0.022, 0.022), m, x, y, z));
  o.rotation.y = ry; o.castShadow = false;
  K.B.ticks.push((now) => {
    if (K.calm()) return;
    if (col) { m.emissiveIntensity = 1.2 + Math.sin(now / 700) * 0.5; return; }
    m.emissive.setHSL((now / 5000) % 1, 1, 0.5);
    if (light) light.color.copy(m.emissive);
  });
  return o;
}

/** Glowing motes adrift in a box: Phil's wisps, Pat's fireflies over the lagoon window. */
function motes(K, art, n, [x0, x1], [y0, y1], [z0, z1], size = 0.12) {
  const T = K.THREE, list = [];
  for (let i = 0; i < n; i++) {
    const sp = K.sprite(art(i), size * (0.7 + (i % 3) * 0.2));
    sp.material.blending = T.AdditiveBlending;
    sp.userData = { x: x0 + Math.random() * (x1 - x0), y: y0 + Math.random() * (y1 - y0), z: z0 + Math.random() * (z1 - z0), ph: Math.random() * 7 };
    sp.visible = true;
    list.push(sp);
  }
  K.B.ticks.push((now) => {
    const t = now / 1000;
    for (const sp of list) {
      const u = sp.userData;
      sp.position.set(u.x + Math.sin(t * 0.5 + u.ph) * 0.5, u.y + Math.sin(t * 0.8 + u.ph * 2) * 0.25, u.z + Math.cos(t * 0.4 + u.ph) * 0.4);
      sp.material.opacity = 0.45 + Math.sin(t * 1.7 + u.ph) * 0.35;
    }
  });
  return list;
}

/** A paper pinned to a wall with tape at its corners, written on. */
function note(K, x, y, z, w, h, draw, { ry = 0, tilt = 0, paper = '#fffaf0' } = {}) {
  return sheet(K, w * 40, h * 40, (f) => {
    const { g } = f;
    g.save(); g.translate(w * 20, h * 20); g.rotate(tilt); g.translate(-w * 20, -h * 20);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(3, 3.6, w * 40 - 5.4, h * 40 - 5.4);
    g.fillStyle = paper; g.fillRect(2.4, 2.4, w * 40 - 5.4, h * 40 - 5.4);
    draw(g, w * 40, h * 40);
    g.fillStyle = 'rgba(240,236,200,0.75)';
    for (const [tx, ty] of [[2, 1], [w * 40 - 9, 1]]) g.fillRect(tx, ty, 7, 3.2);
    g.restore();
  }, w, h, x, y, z, { ry, clear: true, k: 4 });
}

/* ---------- the leaders ---------- */

const NIGHT = (t) => t === 'night';

/** JONA, Phil's demon, in his back right corner (the user's sprite, 2026-10-15), facing the room, a violet glow behind
    her. Her board is built with the room and the sprite painted onto it once it loads: added after the build, she never
    showed on the user's screen. */
function jona(K) {
  const T = K.THREE, x = ex(K, 12.45), z = ez(K, 0.55), H = 2.05, CW = 38, CH = 67;   // CW x CH: the sprite's opaque box
  block(K, 12, 0);
  const dark = part(K, new T.CircleGeometry(0.55, 24), lit(K, '#000000', { transparent: true, opacity: 0.45, depthWrite: false }), x, 0.01, z);
  dark.rotation.x = -Math.PI / 2;
  quiet(dark);
  motes(K, () => K.fireflyArt('#9040e0'), 4, [x - 0.5, x + 0.3], [0.4, 2.1], [z - 0.3, z + 0.5], 0.1);
  const board = () => { const g = new T.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); return g; };
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const map = K.texOf(c), w = H * CW / CH;
  const m = new T.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.5, toneMapped: false, fog: false, side: T.DoubleSide });
  m.color.setRGB(1.75, 1.7, 1.8);   // lit as if by her own glow, or the dark corner turns her to a silhouette
  const her = part(K, board(), m, x, 0.02, z); her.scale.set(w, H, 1);
  const halo = document.createElement('canvas'); halo.width = halo.height = 64;
  const hg = halo.getContext('2d'), rg = hg.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(176,96,255,0.75)'); rg.addColorStop(0.5, 'rgba(120,48,220,0.3)'); rg.addColorStop(1, 'rgba(60,0,120,0)');
  hg.fillStyle = rg; hg.fillRect(0, 0, 64, 64); halo.hd = 2;
  const aura = part(K, board(), new T.MeshBasicMaterial({ map: K.texOf(halo), transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }), x, -0.4, z - 0.08);
  aura.scale.set(w * 2.4, H * 1.35, 1);
  her.castShadow = aura.castShadow = aura.receiveShadow = false;   // a board's shadow is its whole rectangle
  quiet(her); quiet(aura);
  const img = new Image();
  img.onload = () => {
    const g = c.getContext('2d', { willReadFrequently: true }), t = document.createElement('canvas');
    t.width = img.width; t.height = img.height;
    const tg = t.getContext('2d', { willReadFrequently: true }); tg.drawImage(img, 0, 0);
    const d = tg.getImageData(0, 0, t.width, t.height).data;
    let x0 = t.width, y0 = t.height;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 8) { x0 = Math.min(x0, (i >> 2) % t.width); y0 = Math.min(y0, (i >> 2) / t.width | 0); }
    g.drawImage(t, x0, y0, CW, CH, 0, 0, CW, CH);
    map.needsUpdate = true;
  };
  img.src = 'assets/trainers/gym/jona.png';
  K.B.ticks.push((now) => { if (!K.calm()) aura.material.opacity = 0.8 + Math.sin(now / 900) * 0.2; });
}

export const LEADER_HOMES = {
  /* JOHN: a tatami room in Lantern Village. The engineer's desk with a model jet on it, a Fire Emblem shrine of a TV
     corner, and the kotatsu with three handhelds charging on it, none picked. */
  john: {
    leaderAt: { x: 6, ty: 3.1 },
    mood: { hemi: ['#fff4e2', '#8a7050', 1.55], sun: ['#ffe8c8', 1.8], bloom: 0.85 },
    floor: (K, f, W, H, T) => tatami(K, f, W, H, T, ['#dcd494', '#c8bc78'], '#2c3c78'),
    skirt: ['#5a3a22', '#3a2414', '#1a1008'],
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f, ink = GYM_INK.john;
      g.fillStyle = lin(0, 0, 0, wy(3), ['#1a2050', '#2a3470']); g.fillRect(0, 0, w, wy(2.9));
      // seigaiha waves, a band of them in blue over the skirting
      g.fillStyle = ink[2]; g.fillRect(0, wy(1.55), w, 0.65 * U);
      for (let row = 0; row < 3; row++) for (let cx = (row % 2) * 3; cx < w + 6; cx += 6) {
        const cy = wy(0.9) - row * 4.2;
        for (const [r, col] of [[3, ink[1]], [2.2, '#e8ecff'], [1.5, ink[1]], [0.8, '#e8ecff']]) { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, r, Math.PI, 0); g.fill(); }
      }
      // shoji: paper lit from behind, a lattice of kumiko, a post a tile
      g.fillStyle = '#f6efd8'; g.fillRect(0, wy(2.9), w, wy(1.55) - wy(2.9));
      s.fillStyle = 'rgba(255,236,190,0.55)'; s.fillRect(0, wy(2.9), w, wy(1.55) - wy(2.9));
      g.fillStyle = '#6a4a2a';
      for (let i = 0; i < w; i += U / 3) g.fillRect(i - 0.3, wy(2.9), 0.6, wy(1.55) - wy(2.9));
      for (let yy = wy(2.9); yy < wy(1.55); yy += 6.75) g.fillRect(0, yy - 0.3, w, 0.6);
      g.fillStyle = '#3a2414';
      for (let t = 0; t <= w / U + 1; t++) g.fillRect(x(t) - 1.2, wy(3.1), 2.4, wy(1.55) - wy(3.1));
      g.fillRect(0, wy(3.05), w, 2.4); g.fillRect(0, wy(1.6), w, 1.6);
      if (back) {
        // the tokonoma: a recess behind the TV, its scroll of the Dilemma Badge's "?"
        g.fillStyle = '#c8b890'; g.fillRect(x(5.2), wy(2.85), 2.6 * U, wy(1.6) - wy(2.85));
        g.fillStyle = '#f4ecd8'; g.fillRect(x(6.2), wy(2.8), 0.6 * U, 1.1 * U);
        text(g, '?', x(6.5), wy(2.3), 11, ink[1], { font: HAND });
      }
    },
    furnish: [['shelf', 0, 0], ['bonsai', 2, 0], ['andon', 3, 0], ['console', 4, 0], ['tv', 5, 0, { mid: true }], ['wavebyobu', 8, 0], ['andon', 10, 0],
      ['desk', 11, 0], ['swivelchair', 11, 1], ['bindershelf', 12, 3], ['filing', 12, 4],
      ['futon', 0, 2], ['daruma', 1, 2], ['bookstack', 0, 4],
      ['kotatsu', 5, 4, { mid: true }], ['zabuton', 4, 4], ['zabuton', 8, 4], ['zabuton', 6, 6],
      ['mapcase', 11, 6], ['sakura', 0, 7], ['luckycat', 1, 8], ['teaset', 10, 8], ['plant', 12, 8], ['kadomatsu', 4, 9], ['kadomatsu', 8, 9]],
    hang: [['chochin', 1], ['cranescroll', 3], ['wallfan', 10], ['moonscroll', 12], ['koiscroll', 0, { side: 'l', row: 5 }], ['worldmap', 0, { side: 'r', row: 6 }]],
    props(K, P) {
      const T = K.THREE;
      // the three handhelds on the kotatsu, charging, none picked: a Steam Deck, a Switch 2, an AYN Thor
      const kt = P.kotatsu, top = topOf(kt), g = group(K, 0, top + 0.005, ez(K, 5));
      const dark = mat(K, '#26262c', { roughness: 0.5 }), screen = (w, h, draw) => sheet(K, w * 100, h * 100, draw, w, h, 0, 0, 0, { parent: g, bright: true, k: 5, rx: -Math.PI / 2 });
      const map = (f) => { const { g: c } = f; for (let yy = 0; yy < 12; yy += 2) for (let xx = 0; xx < 20; xx += 2) { c.fillStyle = (xx + yy) % 4 ? '#5aa040' : '#6ab04a'; c.fillRect(xx, yy, 2, 2); } c.fillStyle = 'rgba(220,40,40,0.45)'; c.fillRect(12, 2, 6, 6); c.fillStyle = '#3a6ae8'; c.fillRect(4.4, 6.4, 1.2, 1.2); c.fillRect(6.4, 4.4, 1.2, 1.2); c.fillStyle = '#e83a3a'; c.fillRect(14.4, 4.4, 1.2, 1.2); };
      const deck = new T.Group(); deck.position.set(-0.42, 0, 0.02); deck.rotation.y = 0.15; g.add(deck);
      part(K, K.rbox(0.42, 0.035, 0.16, 0.02), dark, 0, 0.018, 0, deck);
      const s1 = screen(0.2, 0.12, map); deck.add(s1); s1.position.set(0, 0.037, 0);
      const sw = new T.Group(); sw.position.set(0.02, 0, -0.08); sw.rotation.y = -0.1; g.add(sw);
      part(K, K.rbox(0.24, 0.028, 0.13, 0.01), dark, 0, 0.014, 0, sw);
      for (const [dx, col] of [[-0.15, '#3aa0e8'], [0.15, '#e84a4a']]) part(K, K.rbox(0.06, 0.03, 0.13, 0.02), mat(K, col, { roughness: 0.4 }), dx, 0.015, 0, sw);
      const s2 = screen(0.2, 0.11, (f) => { const { g: c } = f; c.fillStyle = '#1a2a5a'; c.fillRect(0, 0, 20, 11); c.fillStyle = '#e8e0c0'; c.fillRect(2, 2, 7, 7); c.fillRect(11, 2, 7, 7); c.fillStyle = '#3a6ae8'; c.fillRect(3, 6, 5, 2); c.fillStyle = '#e83a3a'; c.fillRect(12, 6, 3, 2); }); sw.add(s2); s2.position.set(0, 0.029, 0);
      const thor = new T.Group(); thor.position.set(0.44, 0, 0.04); thor.rotation.y = -0.25; g.add(thor);
      part(K, K.rbox(0.2, 0.022, 0.14, 0.01), mat(K, '#4a4a58', { roughness: 0.4 }), 0, 0.011, 0, thor);
      const s3 = screen(0.13, 0.08, map); thor.add(s3); s3.position.set(0, 0.023, 0.015);
      const lid = new T.Group(); lid.position.set(0, 0.022, -0.07); lid.rotation.x = -1.15; thor.add(lid);
      part(K, K.rbox(0.2, 0.012, 0.14, 0.006), mat(K, '#4a4a58', { roughness: 0.4 }), 0, 0, 0.07, lid);
      const s4 = screen(0.16, 0.1, (f) => { const { g: c } = f; c.fillStyle = '#20140c'; c.fillRect(0, 0, 16, 10); text(c, 'PICK ME', 8, 5, 3, '#f8d040'); }); lid.add(s4); s4.position.set(0, 0.007, 0.07);
      // their charging lights, blinking out of step
      const leds = [deck, sw, thor].map((d, i) => quiet(part(K, new T.SphereGeometry(0.012, 6, 4), lit(K, '#60ff80'), 0.13 - i * 0.02, 0.03, 0.07, d)));
      K.B.ticks.push((now) => { leds.forEach((l, i) => { l.visible = K.calm() || Math.sin(now / 600 + i * 2.1) > -0.3; }); });
      quiet(g);
      // a model jet on a stand, the part he designed for it, and its blueprint
      const desk = P.desk, b = group(K, ex(K, 11.5), topOf(desk) + 0.005, ez(K, 0.5), 0.1), hull = mat(K, '#d8dce2', { roughness: 0.4, metalness: 0.5 });
      part(K, new T.BoxGeometry(0.2, 0.02, 0.14), mat(K, '#3a3a42'), 0, 0.01, 0, b);
      part(K, new T.CylinderGeometry(0.008, 0.008, 0.17, 6), mat(K, '#9a948a'), 0, 0.1, 0, b);
      const body = part(K, new T.CylinderGeometry(0.035, 0.03, 0.56, 10), hull, 0, 0.2, 0, b); body.rotation.z = Math.PI / 2;
      const nose = part(K, new T.ConeGeometry(0.035, 0.12, 10), hull, 0.34, 0.2, 0, b); nose.rotation.z = -Math.PI / 2;
      const wing = part(K, new T.BoxGeometry(0.16, 0.01, 0.58), hull, 0.02, 0.19, 0, b); wing.rotation.y = 0.08;
      part(K, new T.BoxGeometry(0.08, 0.01, 0.22), hull, -0.25, 0.21, 0, b);
      part(K, new T.BoxGeometry(0.1, 0.12, 0.01), mat(K, '#c8483a', { roughness: 0.5, metalness: 0.3 }), -0.25, 0.27, 0, b);
      sheet(K, 40, 28, (f) => { const { g: c } = f; c.fillStyle = '#2a5ab0'; c.fillRect(0, 0, 40, 28); c.strokeStyle = '#d8e8ff'; c.lineWidth = 0.5; c.strokeRect(2, 2, 36, 24); c.beginPath(); c.moveTo(6, 11); c.lineTo(34, 11); c.moveTo(19, 4); c.lineTo(22, 11); c.lineTo(19, 18); c.moveTo(8, 8); c.lineTo(8, 14); c.stroke(); text(c, 'STRESS TEST', 20, 23, 3.4, '#ffffff'); }, 0.36, 0.25, 0.42, 0.006, 0.12, { parent: b, rx: -Math.PI / 2, k: 4 });
      quiet(b);
      // the Fire Emblem shrine over the byobu: a tactics map, danger zone in red
      sheet(K, 64, 44, (f) => {
        const { g: c, rr } = f;
        rr(0, 0, 64, 44, 2, '#e8d8a8'); rr(2, 2, 60, 40, 1, '#1a1a2a');
        for (let yy = 0; yy < 6; yy++) for (let xx = 0; xx < 10; xx++) { c.fillStyle = [[3, 4], [4, 4], [5, 3]].some(([a, bb]) => a === xx && bb === yy) ? '#4a7ad8' : (xx * 7 + yy * 3) % 5 ? '#5a9a42' : '#3a7a32'; c.fillRect(4 + xx * 5.6, 4 + yy * 5, 5.2, 4.6); }
        c.fillStyle = 'rgba(230,40,40,0.5)'; for (const [a, bb] of [[6, 1], [7, 1], [7, 2], [8, 2], [6, 2], [7, 3]]) c.fillRect(4 + a * 5.6, 4 + bb * 5, 5.2, 4.6);
        for (const [a, bb, col] of [[3, 4, '#3060e0'], [4, 3, '#3060e0'], [7, 2, '#e03030'], [8, 1, '#e03030']]) { c.fillStyle = col; c.beginPath(); c.arc(6.6 + a * 5.6, 6.3 + bb * 5, 1.8, 0, Math.PI * 2); c.fill(); }
        text(c, 'CLASSIC MODE', 32, 39.5, 4, '#f8e8b0');
      }, 1.1, 0.76, ex(K, 9), 2.25, ez(K, 0) + 0.02);
      // the kotatsu's warmth, under its quilt
      lamp(K, '#ffb070', NIGHT(K.time) ? 1.6 : 0.9, 4, ex(K, 6.5), 1.0, ez(K, 5.6));
    },
  },

  /* JAHMES: a PA's room cut in two. The bed side is navy and very calm (three alarm clocks, a clock that keeps your
     time, LIGHTS OUT at 11 in neon); the gaming side is SCREAMING (RGB on everything, two speaker stacks). */
  jahmes: {
    leaderAt: { x: 6, ty: 3.4 },
    mood: { hemi: ['#e0e6ff', '#4a4a70', 1.35], sun: ['#e8ecff', 1.55], bloom: 1.0 },
    floor: (K, f, W, H, T) => { K.planks(f, W, H, T, ['#7a6a62', '#685850']); },
    skirt: ['#1c2048', '#121636', '#0a0c20'],
    paint(K, f, w, { back, x, s, time }) {
      const { g, lin } = f, ink = GYM_INK.jahmes, r = K.seeded(w | 3);
      g.fillStyle = lin(0, 0, 0, wy(1), ['#0e1230', ink[1]]); g.fillRect(0, 0, w, wy(0.9));
      // glow-in-the-dark stars, brighter at night
      for (let i = 0; i < w / 3; i++) {
        const sx = r() * w, sy = wy(3.6) + r() * (wy(1.1) - wy(3.6)), k = 0.6 + r() * 1.2;
        for (const c of [g, s]) { c.fillStyle = time === 'night' ? '#e8ffb0' : '#c8d8a0'; c.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, d = j % 2 ? k * 0.45 : k; c.lineTo(sx + Math.cos(a) * d, sy + Math.sin(a) * d); } c.fill(); }
      }
      g.fillStyle = '#e8ecff'; g.fillRect(0, wy(1.25), w, 1.2);
      if (back) {
        sky(K, f, s, x(3.8), x(3.8) + 1.4 * U, 2.5, 1.35, '#e8ecff', ['#3a4a9a', '#2a3478']);
        // the gaming side: a hex grid, the Valorant-ish red of a hype screen
        for (let hx = x(8); hx < w; hx += 7) for (let hy = wy(2.9); hy < wy(1.3); hy += 6) { g.strokeStyle = 'rgba(255,80,110,0.35)'; g.lineWidth = 0.5; g.beginPath(); for (let j = 0; j <= 6; j++) { const a = j / 6 * Math.PI * 2; g.lineTo(hx + ((hy / 6) % 2) * 3.5 + Math.cos(a) * 3, hy + Math.sin(a) * 3); } g.stroke(); }
      }
    },
    furnish: [['starquilt', 0, 0], ['nightstand', 2, 0], ['moonlamp', 3, 0], ['alarmclock', 0, 3], ['alarmclock', 2, 1], ['slippers', 1, 3, { free: true }],
      ['speakerstack', 8, 0], ['desk', 9, 0], ['pc', 11, 0], ['speakerstack', 12, 0], ['swivelchair', 9, 1], ['minifridge', 12, 2], ['beanbag-great', 10, 3],
      ['ringsbigrug-great', 4, 3, { mid: true }], ['labcoat', 12, 5], ['medicineshelf', 12, 6], ['bookstack', 0, 6], ['laundrypile', 2, 7], ['plant', 0, 8], ['punchbag', 12, 8]],
    hang: [['neonsign', 9], ['firstaid', 0, { side: 'r', row: 4 }], ['dreamcatcher', 0, { side: 'l', row: 1 }], ['calendar', 0, { side: 'l', row: 5 }]],
    props(K, P) {
      const T = K.THREE, ns = P.nightstand;
      // the third alarm clock, on the nightstand, and the clock on the wall keeping your time, 11 circled
      K.piece('alarmclock', 2, 0, { y: topOf(ns), scale: 0.72, free: true });
      wallClock(K, ex(K, 3.2), 2.2, 0.34, { rim: '#38428c', mark: 11 });
      // LIGHTS OUT over the bed, lit at night
      sheet(K, 90, 26, (f) => { f.g.fillStyle = 'rgba(10,12,30,0.0)'; neon(f, 'LIGHTS OUT 11:00', 45, 13, 9, NIGHT(K.time) ? '#ff5a7a' : '#ff8aa0'); }, 1.9, 0.55, ex(K, 1.6), 2.75, ez(K, 0) + 0.03, { clear: true, glow: NIGHT(K.time) ? 1.4 : 0.7 });
      // RGB under the desk and along the speakers, every colour, lighting the gaming side
      const rgb = lamp(K, '#ff3060', 1.8, 5, ex(K, 10), 1.0, ez(K, 1.6));
      ledStrip(K, 2.0, ex(K, 10), 0.05, ez(K, 0.95), { light: rgb });
      ledStrip(K, 4.6, ex(K, 10.5), 1.25, ez(K, 0) + 0.03);
      // two monitors on the desk: the ARAM lobby, and the clock app, both screaming
      const desk = P.desk, y = topOf(desk);
      monitor(K, K.B.group, ex(K, 9.6), y, ez(K, 0.35), 0.12, 0.5, 0.3, (f) => { const { g } = f; g.fillStyle = '#0a1a2a'; g.fillRect(0, 0, 30, 18); text(g, "LET'S GOOOO", 15, 7, 4.6, '#ff4a6a'); text(g, 'VICTORY', 15, 13, 3.6, '#f8e070'); });
      monitor(K, K.B.group, ex(K, 10.5), y, ez(K, 0.35), -0.12, 0.5, 0.3, (f) => { const { g } = f; g.fillStyle = '#101020'; g.fillRect(0, 0, 30, 18); text(g, 'BED IN', 15, 6, 3.6, '#c8d0ff'); text(g, '00:47:12', 15, 12, 5.2, '#ffffff'); });
      headset(K, K.B.group, ex(K, 10.1), y + 0.05, ez(K, 0.75), '#ff3a5a', 0.2);
      // a warm reading light by the bed
      lamp(K, '#ffd8a0', NIGHT(K.time) ? 0.9 : 0.5, 3.5, ex(K, 2.5), 1.3, ez(K, 1.2));
    },
  },

  /* SHAUN: tech support by day, IGL by night, in a Cinder Springs lodge. Three monitors (the VOD, the ticket queue, the
     boys in voice), a tactics whiteboard, acoustic foam, a pile of laptops tagged FIXED. */
  shaun: {
    leaderAt: { x: 6, ty: 3.2 },
    blocks: [[0, 2, 2, 1]],   // what its own props stand on
    mood: { hemi: ['#e8fbff', '#406068', 1.4], sun: ['#eaf8ff', 1.6], bloom: 0.95 },
    floor: (K, f, W, H) => {
      const { g, lin } = f, r = K.seeded(41);
      g.fillStyle = lin(0, 0, W, H, ['#8a8e92', '#7a7e84', '#868a8e']); g.fillRect(0, 0, W, H);
      for (let i = 0; i < 140; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '40,40,48'},${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * W, r() * H, 2 + r() * 8, 1 + r() * 4, r() * 3, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(40,40,48,0.35)'; for (let x = 0; x < W; x += 48) g.fillRect(x, 0, 0.4, H); for (let y = 0; y < H; y += 48) g.fillRect(0, y, W, 0.4);
    },
    skirt: ['#2a3034', '#1a2024', '#0c1214'],
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f, ink = GYM_INK.shaun;
      g.fillStyle = lin(0, 0, 0, wy(3), ['#c8805a', '#d89068']); g.fillRect(0, 0, w, wy(3));   // the lodge's adobe up top
      g.fillStyle = '#20262a'; g.fillRect(0, wy(3), w, wy(0.9) - wy(3));
      // acoustic foam, wedge tiles in teal and charcoal, laid in a checker
      for (let ty = wy(2.9); ty < wy(1.15) - 4; ty += 9) for (let tx = 1; tx < w - 8; tx += 9) {
        const teal = ((tx / 9 | 0) + (ty / 9 | 0)) % 2;
        for (let i = 0; i < 4; i++) { g.fillStyle = teal ? ['#1a8a88', '#0e6a6a'][i % 2] : ['#2e3438', '#24282c'][i % 2]; if ((ty / 9 | 0) % 2) g.fillRect(tx + i * 2, ty, 2, 8); else g.fillRect(tx, ty + i * 2, 8, 2); }
      }
      for (const c of [g, s]) { c.fillStyle = ink[1]; c.fillRect(0, wy(1.12), w, 1); c.fillRect(0, wy(3.02), w, 1); }
      if (back) sky(K, f, s, x(5.2), x(5.2) + 1.6 * U, 2.6, 1.5, '#e8ecee');
    },
    furnish: [['laptopdesk', 0, 0], ['printer', 1, 0], ['copier', 2, 0], ['filing', 3, 0], ['bindershelf', 4, 0],
      ['desk', 8, 0], ['desk', 10, 0], ['serverrack', 12, 0], ['serverrack', 12, 1], ['swivelchair', 9, 1],
      ['paperboxes', 0, 3], ['watercooler', 0, 5], ['trophyshelf', 12, 3, { turn: -Math.PI / 2 }], ['beanbag-aqua', 10, 4],
      ['checkbigrug-aqua', 4, 3, { mid: true }], ['minifridge', 12, 7], ['cactus', 12, 8], ['plant', 0, 8], ['shredder', 1, 7], ['briefcase', 11, 8]],
    hang: [['saleschart', 0], ['pixelposter', 7], ['stickywall', 0, { side: 'l', row: 4 }], ['clock', 0, { side: 'r', row: 6 }]],
    props(K, P) {
      const T = K.THREE, y = topOf(P.desk);
      // the battle station: three monitors over the double desk
      const vod = (f) => {
        const { g, rr } = f;
        g.fillStyle = '#12161c'; g.fillRect(0, 0, 30, 18);
        rr(3, 2, 10, 5, 0.6, '#3a4a5a'); rr(16, 3, 11, 9, 0.6, '#3a4a5a'); rr(6, 9, 6, 6, 0.6, '#3a4a5a'); g.fillStyle = '#4a5a6a'; g.fillRect(9, 6, 9, 2.4);
        text(g, 'A', 8, 4.6, 3, '#f8d040'); text(g, 'B', 21.5, 7.5, 3, '#f8d040');
        for (const [a, b, col] of [[5, 5, '#3ae0d0'], [9, 12, '#3ae0d0'], [14, 7, '#3ae0d0'], [22, 9, '#ff4a5a'], [24, 5, '#ff4a5a']]) { g.fillStyle = col; g.beginPath(); g.arc(a, b, 0.8, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#2a2e34'; g.fillRect(1, 16, 28, 1); g.fillStyle = '#ff4a5a'; g.fillRect(1, 16, 17, 1);
        text(g, 'VOD: 34 KILLS, LOST', 15, 14.4, 1.9, '#c0fff4');
      };
      const tickets = (f) => {
        const { g } = f;
        g.fillStyle = '#f0f2f4'; g.fillRect(0, 0, 30, 18); g.fillStyle = '#20b8b0'; g.fillRect(0, 0, 30, 3.2);
        text(g, 'TICKETS (47)', 15, 1.7, 2.2, '#ffffff');
        const rows = ['"IT\'S THE INTERNET"', 'TURN IT OFF + ON', 'IS IT PLUGGED IN?', '"IT\'S THE INTERNET"', 'NOT THE INTERNET'];
        rows.forEach((t, i) => { g.fillStyle = i % 2 ? '#e2e6ea' : '#f8fafc'; g.fillRect(0, 3.4 + i * 2.9, 30, 2.9); g.fillStyle = ['#e85050', '#f8b030', '#30c060'][i % 3]; g.fillRect(1, 4.2 + i * 2.9, 1.4, 1.4); text(g, t, 3.4, 4.9 + i * 2.9, 1.7, '#2a3038', { align: 'left' }); });
      };
      const comms = (f) => {
        const { g } = f;
        g.fillStyle = '#2a2d36'; g.fillRect(0, 0, 30, 18); text(g, 'VOICE: THE BOYS', 15, 2, 2, '#a0a8c0');
        ['SHAUN', 'JAHMES', 'RICKY', 'CLARENCE', 'PHIL'].forEach((n, i) => { g.strokeStyle = i === 0 || i === 3 ? '#30e070' : '#4a4e5a'; g.lineWidth = 0.6; g.beginPath(); g.arc(4, 5 + i * 2.8, 1.1, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#8a90a8'; g.beginPath(); g.arc(4, 5 + i * 2.8, 0.8, 0, Math.PI * 2); g.fill(); text(g, n, 6.4, 5.1 + i * 2.8, 1.9, '#e8ecf4', { align: 'left' }); });
        text(g, 'STOP PEEKING', 22, 10, 2.2, '#ff5a6a');
      };
      monitor(K, K.B.group, ex(K, 9.1), y, ez(K, 0.42), 0.45, 0.56, 0.33, tickets);
      monitor(K, K.B.group, ex(K, 10), y, ez(K, 0.32), 0, 0.62, 0.36, vod);
      monitor(K, K.B.group, ex(K, 10.9), y, ez(K, 0.42), -0.45, 0.56, 0.33, comms);
      headset(K, K.B.group, ex(K, 10.9), y + 0.06, ez(K, 0.85), '#20b8b0', -0.4);
      ledStrip(K, 3.9, ex(K, 10), y - 0.03, ez(K, 0.97), { col: '#20d8c8' });
      // a pile of laptops on the floor, each tagged FIXED
      const pile = group(K, ex(K, 1), 0, ez(K, 2.6), 0.2);
      ['#b8bcc4', '#2a2a30', '#8a8e98', '#d8dce2', '#3a3a44'].forEach((col, i) => {
        const l = new T.Group(); l.position.set((i % 2 ? 0.05 : -0.04), 0.022 + i * 0.045, 0); l.rotation.y = (i * 0.37) % 0.6 - 0.3; pile.add(l);
        part(K, K.rbox(0.56, 0.04, 0.4, 0.01), mat(K, col, { roughness: 0.35, metalness: 0.4 }), 0, 0, 0, l);
        sheet(K, 16, 10, (f) => { f.rr(0, 0, 16, 10, 1.2, '#f8e050'); text(f.g, 'FIXED', 8, 5.2, 4, '#2a2a30'); }, 0.12, 0.075, 0.2, -0.05, 0.205, { parent: l, k: 4 });
      });
      quiet(pile);
      // the tactics board: B site, the smokes, the note to Ricky
      sheet(K, 80, 50, (f) => {
        const { g, rr } = f;
        rr(0, 0, 80, 50, 2, '#a8acb4'); rr(2, 2, 76, 46, 1, '#fbfcfd');
        g.strokeStyle = '#3a3e48'; g.lineWidth = 0.8; g.strokeRect(10, 8, 26, 18); g.strokeRect(46, 12, 24, 22); g.beginPath(); g.moveTo(36, 18); g.lineTo(46, 22); g.stroke();
        text(g, 'A', 23, 17, 8, '#3a3e48', { font: HAND }); text(g, 'B', 58, 23, 8, '#3a3e48', { font: HAND });
        g.strokeStyle = '#e04040'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(14, 40); g.quadraticCurveTo(30, 34, 50, 30); g.stroke();
        g.fillStyle = 'rgba(80,80,90,0.35)'; for (const [a, b] of [[52, 18], [64, 26]]) { g.beginPath(); g.arc(a, b, 4, 0, Math.PI * 2); g.fill(); }
        text(g, 'SMOKE', 58, 38, 3.6, '#3060d0', { font: HAND }); text(g, 'RICKY: DON\'T PEEK', 40, 45, 3.8, '#e04040', { font: HAND });
      }, 1.5, 0.94, ex(K, 2.5), 1.95, ez(K, 0) + 0.02);
      lamp(K, '#40f0e0', 1.6, 5, ex(K, 10), 1.2, ez(K, 1.4));
    },
  },

  /* CLARENCE: the show's the room. A stage in the corner under peach velvet, SHOWTIME in neon over it, a ring light and
     a webcam on tripods, a disco ball turning; a vanity, a wardrobe of costumes, the boa on the sofa. ON AIR is lit at
     night. */
  clarence: {
    leaderAt: { x: 7, ty: 3.4 },
    blocks: [[0, 0, 4, 2]],
    mood: { hemi: ['#fff0ea', '#9a5a60', 1.45], sun: ['#ffe0d8', 1.65], bloom: 1.05 },
    floor: (K, f, W, H, T) => {
      K.planks(f, W, H, T, ['#a86a4a', '#94583c']);
      const { g } = f; g.fillStyle = '#e8a090'; g.fillRect(4.5 * T, 2.5 * T, 6 * T, 5 * T); g.fillStyle = '#f8c0b0';
      for (let y = 2.5 * T + 2; y < 7.5 * T; y += 4) for (let x = 4.5 * T + 2 + (y % 8 ? 2 : 0); x < 10.5 * T; x += 4) g.fillRect(x, y, 0.8, 0.8);
      g.strokeStyle = '#d8b050'; g.lineWidth = 1; g.strokeRect(4.5 * T + 1, 2.5 * T + 1, 6 * T - 2, 5 * T - 2);
    },
    skirt: ['#7a2a3a', '#5a1a28', '#c8a040'],
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f, ink = GYM_INK.clarence;
      g.fillStyle = lin(0, 0, 0, wy(1), ['#c8604c', ink[1]]); g.fillRect(0, 0, w, wy(0.9));
      // gold damask diamonds
      g.strokeStyle = 'rgba(248,216,120,0.45)'; g.lineWidth = 0.5;
      for (let yy = wy(3.6); yy < wy(1); yy += 10) for (let xx = (yy / 10 % 2) * 5; xx < w; xx += 10) { g.beginPath(); g.moveTo(xx, yy - 4); g.lineTo(xx + 3, yy); g.lineTo(xx, yy + 4); g.lineTo(xx - 3, yy); g.closePath(); g.stroke(); g.fillStyle = 'rgba(248,216,120,0.35)'; g.beginPath(); g.arc(xx, yy, 0.7, 0, Math.PI * 2); g.fill(); }
      if (!back) return;
      // the stage's backdrop: peach velvet, swagged, gold fringe
      const x0 = x(0) - 8, x1 = x(4.1);
      for (let xx = x0; xx < x1; xx += 3) { g.fillStyle = lin(xx, 0, xx + 3, 0, ['#e88a74', '#ffc0a8', '#d8705c']); g.fillRect(xx, wy(3.6), 3, wy(0) - wy(3.6)); }
      g.fillStyle = '#b8485a'; g.beginPath(); g.moveTo(x0, wy(3.7)); for (let i = 0; i <= 4; i++) g.quadraticCurveTo(x0 + (i + 0.5) * (x1 - x0) / 4.4, wy(3.15), x0 + (i + 1) * (x1 - x0) / 4.4, wy(3.6)); g.lineTo(x1, wy(3.9)); g.lineTo(x0, wy(3.9)); g.fill();
      g.fillStyle = '#f0c850'; g.fillRect(x0, wy(3.62), x1 - x0, 1.2);
      neon(f, 'SHOWTIME', (x0 + x1) / 2 + 4, wy(2.95), 9, '#ff6ab4');
      for (const [sx, sy] of [[x(0.4), wy(2.2)], [x(3.6), wy(2.4)], [x(2), wy(1.6)]]) { for (const c of [g, s]) { c.fillStyle = '#ffe890'; c.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, d = j % 2 ? 0.9 : 2; c.lineTo(sx + Math.cos(a) * d, sy + Math.sin(a) * d); } c.fill(); } }
      sky(K, f, s, x(10.3), x(10.3) + 1.4 * U, 2.6, 1.5, '#f0c850', ['#ffc0d0', '#f090a8']);
    },
    furnish: [['speakerstack', 4, 0], ['dressingtable', 6, 0], ['standmirror', 7, 0], ['wardrobe', 8, 0], ['hatstand', 12, 0], ['coatrack', 12, 1],
      ['desk', 12, 3, { turn: -Math.PI / 2 }], ['swivelchair', 11, 3], ['micstand', 11, 5],
      ['sofa-pretty', 8, 7, { turn: Math.PI }], ['coffeetable', 8, 6, { scale: 0.85 }], ['heartchair', 10, 7], ['heartcushion', 0, 6], ['heartcushion', 1, 6], ['heartpillow', 0, 7],
      ['fluffyrug-pretty', 5, 5, { mid: true }], ['plant', 0, 8], ['rosebush', 12, 8], ['perfumevanity', 5, 0]],
    hang: [['hathooks', 0, { side: 'r', row: 6 }], ['concertposter', 0, { side: 'l', row: 4 }]],
    props(K, P) {
      const T = K.THREE, night = NIGHT(K.time);
      // the stage: a burgundy platform with a gold lip across the corner, wings either side
      const stage = mat(K, '#6a2238', { roughness: 0.55 });
      part(K, K.rbox(4.0, 0.24, 2.1, 0.04), stage, ex(K, 2), 0.12, ez(K, 1.05));
      part(K, new T.BoxGeometry(4.02, 0.035, 0.05), mat(K, '#f0c850', { metalness: 0.7, roughness: 0.3 }), ex(K, 2), 0.24, ez(K, 2.1));
      for (let i = 0; i < 6; i++) quiet(part(K, new T.SphereGeometry(0.035, 8, 6), lit(K, '#fff0c0'), ex(K, 0.3 + i * 0.68), 0.14, ez(K, 2.12)));
      for (const wx0 of [0.25, 3.75]) sheet(K, 20, 60, (f) => { const { g, lin } = f; for (let xx = 0; xx < 20; xx += 4) { g.fillStyle = lin(xx, 0, xx + 4, 0, ['#d8705c', '#ffb8a0', '#c8604c']); g.fillRect(xx, 0, 4, 60); } g.fillStyle = '#f0c850'; g.fillRect(0, 0, 20, 1.6); }, 0.5, 2.8, ex(K, wx0), 1.4, ez(K, 0.25), { ry: wx0 < 1 ? 0.25 : -0.25 });
      // the ring light, the phone in its middle, and the webcam, both on the stage
      const ring = group(K, ex(K, 3.3), 0.24, ez(K, 1.6), -0.6), leg = mat(K, '#1a1a20', { roughness: 0.4 });
      for (let i = 0; i < 3; i++) { const l = part(K, new T.CylinderGeometry(0.012, 0.012, 0.7, 5), leg, Math.sin(i * 2.1) * 0.14, 0.3, Math.cos(i * 2.1) * 0.14, ring); l.rotation.set(Math.cos(i * 2.1) * 0.4, 0, -Math.sin(i * 2.1) * 0.4); }
      part(K, new T.CylinderGeometry(0.014, 0.014, 0.9, 6), leg, 0, 1.05, 0, ring);
      quiet(part(K, new T.TorusGeometry(0.3, 0.035, 8, 32), lit(K, night ? '#fff8f0' : '#fff0e8'), 0, 1.55, 0, ring));
      part(K, K.rbox(0.08, 0.15, 0.012, 0.01), mat(K, '#20202a'), 0, 1.55, 0, ring);
      quiet(ring);
      const cam = group(K, ex(K, 2.6), 0.24, ez(K, 1.75), Math.PI * 0.08);
      for (let i = 0; i < 3; i++) { const l = part(K, new T.CylinderGeometry(0.01, 0.01, 0.62, 5), leg, Math.sin(i * 2.1) * 0.1, 0.28, Math.cos(i * 2.1) * 0.1, cam); l.rotation.set(Math.cos(i * 2.1) * 0.35, 0, -Math.sin(i * 2.1) * 0.35); }
      part(K, K.rbox(0.16, 0.08, 0.08, 0.02), mat(K, '#2a2a32'), 0, 0.64, 0, cam);
      part(K, new T.CylinderGeometry(0.03, 0.03, 0.04, 12), mat(K, '#101014', { metalness: 0.6 }), 0, 0.64, -0.06, cam).rotation.x = Math.PI / 2;
      const rec = quiet(part(K, new T.SphereGeometry(0.012, 6, 4), lit(K, '#ff2030'), 0.06, 0.67, 0.04, cam));
      quiet(cam);
      // the disco ball over the stage, turning, its sparkles wheeling round the room
      const ball = group(K, ex(K, 2), 0, ez(K, 1));
      quiet(part(K, new T.CylinderGeometry(0.006, 0.006, 1.2, 4), leg, 0, 3.5, 0, ball));
      const mirror = part(K, new T.IcosahedronGeometry(0.26, 2), K.std({ color: '#e8e8f0', metalness: 0.95, roughness: 0.12, flatShading: true, emissive: new T.Color('#605860') }), 0, 2.85, 0, ball);
      quiet(mirror);
      const glints = Array.from({ length: 18 }, (_, i) => { const sp = K.sprite(K.sparkArt(['#ffffff', '#ffd0e8', '#d0e8ff'][i % 3]), 0.16); sp.material.blending = T.AdditiveBlending; sp.visible = true; sp.userData = { a: i / 18 * Math.PI * 2, r: 1.6 + (i % 4) * 0.7, y: 0.6 + (i % 5) * 0.5 }; return sp; });
      K.B.ticks.push((now) => {
        const t = now / 1000;
        if (!K.calm()) mirror.rotation.y = t * 0.6;
        for (const sp of glints) { const u = sp.userData, a = u.a + t * 0.35; sp.position.set(ex(K, 2) + Math.cos(a) * u.r * 1.3, u.y, ez(K, 1) + 1.2 + Math.sin(a) * u.r * 0.6); sp.material.opacity = 0.35 + Math.sin(t * 3 + u.a * 5) * 0.3; }
        rec.visible = Math.sin(now / 400) > 0;
      });
      // ON AIR, over the door to the stage: lit for the boys from nine
      const air = new T.MeshStandardMaterial({ color: '#3a1010', emissive: new T.Color('#ff2a2a'), emissiveIntensity: night ? 1.6 : 0.12 });
      const sign = group(K, ex(K, 5.4), 2.75, ez(K, 0) + 0.05);
      part(K, K.rbox(0.9, 0.3, 0.06, 0.03), mat(K, '#1a1a1e'), 0, 0, 0, sign);
      sheet(K, 45, 15, (f) => { f.g.fillStyle = '#ffffff'; text(f.g, 'ON AIR', 22.5, 7.8, 10, '#ffffff'); }, 0.8, 0.26, 0, 0, 0.032, { parent: sign, clear: true });
      part(K, new T.BoxGeometry(0.84, 0.24, 0.01), air, 0, 0, 0.028, sign);
      quiet(sign);
      // the feather boa draped over the sofa's back
      const sb = new T.Box3().setFromObject(P['sofa-pretty']), pts = [];
      for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push(new T.Vector3(sb.min.x + 0.1 + k * (sb.max.x - sb.min.x - 0.2), sb.max.y - 0.02 - Math.sin(k * Math.PI) * 0.06 + (k < 0.1 || k > 0.9 ? -0.3 : 0), sb.max.z - 0.14 + Math.sin(k * 9) * 0.04)); }
      const boa = new T.CatmullRomCurve3(pts), fluff = new T.InstancedMesh(new T.IcosahedronGeometry(0.05, 0), K.std({ color: '#ff7ab8', roughness: 1, flatShading: true }), 60), o = new T.Object3D();
      for (let i = 0; i < 60; i++) { const p = boa.getPoint(i / 59); o.position.set(p.x + (Math.random() - 0.5) * 0.04, p.y + (Math.random() - 0.5) * 0.04, p.z + (Math.random() - 0.5) * 0.04); o.rotation.set(Math.random() * 3, Math.random() * 3, 0); o.scale.setScalar(0.8 + Math.random() * 0.6); o.updateMatrix(); fluff.setMatrixAt(i, o.matrix); }
      fluff.raycast = () => {};
      K.B.group.add(fluff);
      lamp(K, '#ff8ac0', night ? 2.4 : 1.6, 6, ex(K, 2), 2.2, ez(K, 2.4));
      lamp(K, '#fff0e0', 1.0, 4, ex(K, 3.3), 1.8, ez(K, 1.9));
    },
  },

  /* KAYL: lavender everything in a Driftwood bungalow. The music corner (the bass, the amp Reya sits on, the keyboard, a
     Tame Impala record on the player), the work desk buried in lease renewals and sticky notes, a cat tree, a mug
     Spooky knocked off. */
  kayl: {
    leaderAt: { x: 6, ty: 3.4 },
    blocks: [[0, 1, 1, 1], [8, 1, 1, 1], [10, 1, 1, 2], [5, 0, 1, 1], [7, 0, 1, 1], [12, 8, 1, 1], [0, 8, 1, 1]],
    castAt: [[1, 4.2, 0.12], [0, 0.95, 1.14]],
    mood: { hemi: ['#f8f0ff', '#8a7aa0', 1.6], sun: ['#fff0f8', 1.85], bloom: 0.9 },
    floor: (K, f, W, H, T) => K.planks(f, W, H, T, ['#e4d8c8', '#d2c4b2']),
    skirt: ['#c8b0a0', '#a89080', '#7a6050'],
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f, ink = GYM_INK.kayl;
      boards(K, f, w, ['#d8c8e8', '#ccbadf', '#e2d4f0', '#c4b0d8']);
      // psychedelic swirls across the top, the way the Currents sleeve feels: wavy lines in purple and tangerine
      for (let i = 0; i < 7; i++) {
        g.strokeStyle = ['#8a5ac8', '#b088e0', '#f08a5a', '#e86a8a', '#8a5ac8', '#6a3aa8', '#f0a060'][i]; g.lineWidth = 1.4; g.globalAlpha = 0.55;
        g.beginPath(); for (let xx = 0; xx <= w; xx += 2) g.lineTo(xx, wy(3.4) + i * 2.4 + Math.sin(xx / 14 + i * 0.5) * 3); g.stroke();
      }
      g.globalAlpha = 1;
      // little paw prints wandering along, the cats were here
      g.fillStyle = 'rgba(90,52,120,0.35)';
      for (let px = 6; px < w; px += 13) { const py = wy(1.3) - (px / 13 % 2) * 3; g.beginPath(); g.ellipse(px, py, 1.3, 1.1, 0, 0, Math.PI * 2); for (const [dx, dy] of [[-1.4, -1.6], [0, -2.2], [1.4, -1.6]]) g.ellipse(px + dx, py + dy, 0.5, 0.6, 0, 0, Math.PI * 2); g.fill(); }
      if (!back) return;
      sky(K, f, s, x(5.3), x(5.3) + 1.4 * U, 2.6, 1.5, '#f4f0ff', ['#c8a8f0', '#a888d8']);
      // sticky notes all over the wall by the desk
      const r = K.seeded(11), notes = ['CALL TENANT', 'KEYS??', 'WORK ORDER', 'BASS 7PM', 'FEED REYA', 'LEASE #412', 'KEYS!!', 'EMAIL BACK'];
      notes.forEach((n, i) => { const nx = x(8.4) + (i % 4) * 9 + r() * 2, ny = wy(2.75) + Math.floor(i / 4) * 9 + r() * 2; g.save(); g.translate(nx + 4, ny + 4); g.rotate((r() - 0.5) * 0.4); g.fillStyle = ['#fff07a', '#ffb0d0', '#a8f0c8', '#c8d8ff'][i % 4]; g.fillRect(-4, -4, 8, 8); text(g, n, 0, 0, 1.5, '#3a2a4a', { font: HAND }); g.restore(); });
      g.fillStyle = ink[2];
    },
    furnish: [['amplifier', 0, 0], ['guitar', 1, 0], ['piano', 2, 0], ['recordplayer', 4, 0],
      ['paperdesk', 8, 0], ['laptopdesk', 9, 0], ['paperboxes', 10, 0], ['filing', 11, 0], ['bindershelf', 12, 0], ['swivelchair-dragon', 9, 1],
      ['petbed', 1, 4], ['petbed', 7, 6], ['sofa-dragon', 4, 7], ['beanbag-master', 9, 5], ['lavalamp', 3, 1], ['fluffyrug-dragon', 5, 4, { mid: true }],
      ['aquarium', 11, 7], ['plant', 12, 4], ['notesrug', 2, 1]],
    hang: [['vinylwall', 2], ['fairylights', 6], ['calendar', 11], ['corkboard', 0, { side: 'l', row: 5 }], ['dreamcatcher', 0, { side: 'r', row: 3 }]],
    props(K, P) {
      const T = K.THREE, lav = '#b8a0d8';
      // the cat tree in the corner, Reya's: two sisal posts, carpeted perches, a cubby, a pompom swinging
      const tree = group(K, ex(K, 0.5), 0, ez(K, 1.5)), carpet = mat(K, lav, { roughness: 1 }), sisal = mat(K, '#d8c090', { roughness: 1 });
      part(K, K.rbox(0.8, 0.08, 0.8, 0.03), carpet, 0, 0.04, 0, tree);
      part(K, K.rbox(0.42, 0.36, 0.42, 0.06), carpet, 0.12, 0.26, 0.12, tree);
      quiet(part(K, new T.CircleGeometry(0.11, 16), mat(K, '#3a2a4a'), 0.12, 0.25, 0.335, tree));
      for (const [px, h] of [[-0.24, 1.1], [0.26, 0.62]]) part(K, new T.CylinderGeometry(0.06, 0.06, h, 10), sisal, px, h / 2, -0.2, tree);
      part(K, new T.CylinderGeometry(0.3, 0.3, 0.06, 18), carpet, -0.05, 1.1, -0.1, tree);
      part(K, new T.CylinderGeometry(0.22, 0.22, 0.05, 16), carpet, 0.26, 0.64, -0.2, tree);
      const pom = new T.Group(); pom.position.set(0.2, 1.08, 0.1); tree.add(pom);
      part(K, new T.CylinderGeometry(0.004, 0.004, 0.36, 3), mat(K, '#f0f0f0'), 0, -0.18, 0, pom);
      part(K, new T.IcosahedronGeometry(0.045, 1), mat(K, '#ff8ac0', { roughness: 1 }), 0, -0.38, 0, pom);
      K.B.ticks.push((now) => { if (!K.calm()) pom.rotation.z = Math.sin(now / 520) * 0.35; });
      quiet(tree);
      // the record on the player: a sleeve leaning against it, purple and tangerine waves
      sheet(K, 30, 30, (f) => { const { g } = f; g.fillStyle = '#5a2a8a'; g.fillRect(0, 0, 30, 30); for (let i = 0; i < 9; i++) { g.strokeStyle = i % 2 ? '#f07a4a' : '#e8d0ff'; g.lineWidth = 1.2; g.beginPath(); for (let xx = 0; xx <= 30; xx++) g.lineTo(xx, 4 + i * 3 + Math.sin(xx / 4 + i) * 2 * (xx / 30)); g.stroke(); } }, 0.42, 0.42, ex(K, 4.5) + 0.25, 0.25, ez(K, 0) + 0.68, { rx: -0.25, ry: -0.3 });
      // lease renewals, in piles on the floor by the desk, sticky notes poking out
      const paper = mat(K, '#f8f6f0', { roughness: 1 });
      [[8.2, 1.4, 0.32], [8.55, 1.8, 0.2], [10.4, 1.5, 0.4], [10.8, 2.1, 0.14]].forEach(([tx, ty, h], i) => {
        const p = group(K, ex(K, tx), 0, ez(K, ty), i * 0.4);
        part(K, new T.BoxGeometry(0.3, h, 0.22), paper, 0, h / 2, 0, p);
        quiet(part(K, new T.BoxGeometry(0.05, 0.005, 0.05), lit(K, ['#fff07a', '#ffb0d0'][i % 2]), 0.13, h * 0.7, 0.1, p));
        quiet(p);
      });
      // the mug Spooky knocked off the desk, on its side in its puddle
      mug(K, K.B.group, ex(K, 7.6), 0, ez(K, 1.3), '#b088e0', { tipped: true, ry: 0.6 });
      quiet(part(K, new T.CircleGeometry(0.2, 16), K.std({ color: '#6a4228', roughness: 0.15, transparent: true, opacity: 0.85 }), ex(K, 7.7), 0.006, ez(K, 1.45))).rotation.x = -Math.PI / 2;
      // pots of lavender along the window and by the door
      const pots = [[5.2, 0.45], [7.6, 0.45], [12.5, 8.5], [0.5, 8.5]], stem = mat(K, '#6a8a4a'), bloom = K.std({ color: '#9a7ad8', roughness: 1 });
      for (const [tx, ty] of pots) {
        const g = group(K, ex(K, tx), 0, ez(K, ty));
        part(K, new T.CylinderGeometry(0.17, 0.12, 0.26, 12), mat(K, '#c86a3a'), 0, 0.13, 0, g);
        const n = 14, st = new T.InstancedMesh(new T.CylinderGeometry(0.008, 0.008, 0.4, 3), stem, n), fl = new T.InstancedMesh(new T.CapsuleGeometry(0.02, 0.1, 2, 5), bloom, n), o = new T.Object3D();
        for (let i = 0; i < n; i++) { const a = i * 2.4, rr = 0.03 + (i % 4) * 0.025, lean = rr * 2.2; o.position.set(Math.cos(a) * rr, 0.46, Math.sin(a) * rr); o.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean); o.updateMatrix(); st.setMatrixAt(i, o.matrix); o.position.set(Math.cos(a) * (rr + lean * 0.22), 0.68, Math.sin(a) * (rr + lean * 0.22)); o.updateMatrix(); fl.setMatrixAt(i, o.matrix); }
        g.add(st, fl);
        quiet(g);
      }
      // Reya's food bowl, empty, as she keeps telling everyone
      const bowl = group(K, ex(K, 2.5), 0, ez(K, 4.6));
      part(K, new T.CylinderGeometry(0.13, 0.1, 0.06, 16), mat(K, '#e86a8a', { roughness: 0.4 }), 0, 0.03, 0, bowl);
      part(K, new T.CylinderGeometry(0.1, 0.1, 0.005, 16), mat(K, '#f4e8f0'), 0, 0.062, 0, bowl);
      quiet(bowl);
      lamp(K, '#d8a8ff', 1.1, 4.5, ex(K, 3.5), 1.0, ez(K, 1.6));
    },
  },

  /* PAT: a houseboat cabin. Fairy lights strung across the whole ceiling, portholes, a hammock, the guitar and the mic
     stand set up right where he "didn't know anyone was there", a rose in a bottle, love letters he never sent,
     lemonade on the table and a lemon tree in a tub. */
  pat: {
    leaderAt: { x: 6, ty: 3.4 },
    mood: { hemi: ['#fff6dc', '#9a8050', 1.5], sun: ['#fff0c8', 1.75], bloom: 1.05 },
    floor: (K, f, W, H, T) => {
      const { g } = f, r = K.seeded(5);
      for (let x = 0; x < W; x += T / 2) { g.fillStyle = ['#d8a868', '#c89a5a', '#dcae70', '#c4925a'][Math.floor(r() * 4)]; g.fillRect(x, 0, T / 2, H); g.fillStyle = 'rgba(60,30,10,0.55)'; g.fillRect(x, 0, 0.5, H); for (let y = r() * T * 2; y < H; y += T * 2.5) { g.fillRect(x, y, T / 2, 0.4); g.fillStyle = '#7a5a3a'; g.beginPath(); g.arc(x + 2, y + 1.5, 0.4, 0, Math.PI * 2); g.arc(x + T / 2 - 2, y + 1.5, 0.4, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(60,30,10,0.55)'; } }
    },
    skirt: ['#8a5a34', '#6a4024', '#3a2414'],
    paint(K, f, w, { back, x, s }) {
      const { g } = f, ink = GYM_INK.pat;
      boards(K, f, w, ['#e8c890', '#dcb880', '#f0d4a0', '#d4ae74'], 5);
      // a garland of hearts and lemons, looping along the top
      for (let i = 0; i * 9 < w; i++) {
        const cx = i * 9 + 4.5, cy = wy(3.1) + Math.sin(i * 1.3) * 0.6 + 2;
        g.strokeStyle = '#8a6a3a'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(cx - 4.5, wy(3.1)); g.quadraticCurveTo(cx, wy(3.1) + 3, cx + 4.5, wy(3.1)); g.stroke();
        if (i % 2) { g.fillStyle = '#f8d040'; g.beginPath(); g.ellipse(cx, cy, 2.2, 1.6, 0.3, 0, Math.PI * 2); g.fill(); g.fillStyle = '#5a9a3a'; g.beginPath(); g.ellipse(cx + 1.6, cy - 1.4, 0.9, 0.5, -0.6, 0, Math.PI * 2); g.fill(); }
        else { g.fillStyle = '#e8506a'; g.beginPath(); g.moveTo(cx, cy + 2); g.bezierCurveTo(cx - 3, cy - 0.5, cx - 1.2, cy - 2.6, cx, cy - 1); g.bezierCurveTo(cx + 1.2, cy - 2.6, cx + 3, cy - 0.5, cx, cy + 2); g.fill(); }
      }
      // music notes drifting up the boards
      g.fillStyle = 'rgba(176,90,24,0.45)';
      for (let i = 0; i < w / 18; i++) { const nx = 8 + i * 18, ny = wy(1.6 + (i % 3) * 0.35); g.beginPath(); g.ellipse(nx, ny, 1.4, 1, -0.4, 0, Math.PI * 2); g.fill(); g.fillRect(nx + 1, ny - 6, 0.5, 6); g.fillRect(nx + 1, ny - 6, 3, 0.8); }
      if (back) { sky(K, f, s, x(3.4), x(3.4) + 1.4 * U, 2.5, 1.5, '#f0e0b0', ['#ffe890', '#f8c860']); g.fillStyle = ink[2]; }
    },
    furnish: [['hammock', 0, 0], ['guitar', 2, 0], ['amplifier', 5, 0], ['recordplayer', 8, 0], ['bookstack', 9, 0], ['citrustree', 12, 0], ['rosebush', 11, 0],
      ['micstand', 7, 3], ['endtable', 3, 3], ['teatable', 10, 4], ['beanbag-pika', 11, 3], ['heartpillow', 0, 3], ['heartpillow', 1, 3],
      ['heartmat-pika', 5, 4, { mid: true }], ['candle', 0, 5], ['candle', 12, 5], ['anchor', 0, 7], ['ropecoil', 12, 7], ['fishbowl', 1, 8], ['citrustree', 11, 8], ['lounger', 2, 7]],
    hang: [['porthole', 6], ['shipwheel', 10], ['lifering', 12], ['concertposter', 1], ['porthole', 0, { side: 'l', row: 3 }], ['porthole', 0, { side: 'r', row: 2 }], ['shiplantern', 0, { side: 'r', row: 6 }]],
    props(K, P) {
      const T = K.THREE, B = ez(K, 0) + 0.05, F = ez(K, K.rows) - 1.4;
      // fairy lights the whole length of the cabin, crossing over
      fairyStrings(K, [
        [[ex(K, 0), 2.8, B], [ex(K, 13), 2.8, B], 0.35, 24],
        [[ex(K, 0), 2.9, B + 0.3], [ex(K, 13), 2.6, F], 0.5, 26],
        [[ex(K, 13), 2.9, B + 0.3], [ex(K, 0), 2.6, F], 0.5, 26],
        [[ex(K, 0), 2.7, ez(K, 5)], [ex(K, 13), 2.7, ez(K, 5)], 0.4, 24],
      ]);
      // the rose in a bottle, on the end table
      const et = P.endtable, rose = group(K, ex(K, 3.5), topOf(et), ez(K, 3.5));
      const pts = [[0.0, 0], [0.09, 0], [0.1, 0.02], [0.1, 0.24], [0.06, 0.32], [0.035, 0.36], [0.035, 0.42]].map(([a, b]) => new T.Vector2(a, b));
      quiet(part(K, new T.LatheGeometry(pts, 20), new T.MeshStandardMaterial({ color: '#d8f0e8', transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.1, depthWrite: false }), 0, 0, 0, rose)).castShadow = false;
      part(K, new T.CylinderGeometry(0.032, 0.03, 0.05, 10), mat(K, '#b88a5a'), 0, 0.44, 0, rose);
      part(K, new T.CylinderGeometry(0.005, 0.005, 0.18, 4), mat(K, '#3a7a3a'), 0, 0.1, 0, rose);
      const red = K.std({ color: '#d0203a', roughness: 0.6, emissive: new T.Color('#400008') });
      for (let i = 0; i < 6; i++) part(K, new T.SphereGeometry(0.03 - i * 0.002, 8, 6), red, Math.cos(i * 2.4) * 0.012, 0.22 + i * 0.004, Math.sin(i * 2.4) * 0.012, rose);
      for (const s of [-1, 1]) { const l = part(K, new T.SphereGeometry(0.02, 6, 4), mat(K, '#4a8a3a'), s * 0.025, 0.11, 0, rose); l.scale.set(1.4, 0.4, 0.8); }
      quiet(rose);
      // lemonade on the table: a pitcher and two glasses (one for her)
      const tt = P.teatable, lem = group(K, ex(K, 10.5), topOf(tt), ez(K, 4.5)), glass = new T.MeshStandardMaterial({ color: '#f0fff8', transparent: true, opacity: 0.3, roughness: 0.05, depthWrite: false }), juice = K.std({ color: '#f8e050', roughness: 0.3, emissive: new T.Color('#403000') });
      part(K, new T.CylinderGeometry(0.075, 0.065, 0.22, 14, 1, true), glass, 0, 0.11, 0, lem).castShadow = false;
      part(K, new T.CylinderGeometry(0.068, 0.06, 0.16, 14), juice, 0, 0.08, 0, lem);
      for (const [dx, dz] of [[0.16, 0.06], [-0.15, 0.1]]) { part(K, new T.CylinderGeometry(0.035, 0.03, 0.1, 10, 1, true), glass, dx, 0.05, dz, lem).castShadow = false; part(K, new T.CylinderGeometry(0.03, 0.027, 0.07, 10), juice, dx, 0.036, dz, lem); const sl = part(K, new T.CylinderGeometry(0.025, 0.025, 0.006, 10), mat(K, '#f8f070'), dx + 0.03, 0.1, dz, lem); sl.rotation.z = 1.2; }
      quiet(lem);
      // love letters, written and never sent, over the floor by the record player
      const r = K.seeded(7);
      for (let i = 0; i < 7; i++) {
        const l = sheet(K, 22, 15, (f) => { const { g } = f; f.rr(0, 0, 22, 15, 0.6, '#fbf4e4'); g.strokeStyle = '#d8c8a8'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(11, 8); g.lineTo(22, 0); g.stroke(); g.fillStyle = '#d02a4a'; g.beginPath(); g.moveTo(11, 10.4); g.bezierCurveTo(8.4, 8, 9.6, 6, 11, 7.4); g.bezierCurveTo(12.4, 6, 13.6, 8, 11, 10.4); g.fill(); }, 0.24, 0.16, ex(K, 7.2 + r() * 2.4), 0.008 + i * 0.002, ez(K, 1.2 + r() * 1.6), { rx: -Math.PI / 2, k: 4 });
        l.rotation.z = r() * 3;
      }
      motes(K, (i) => K.fireflyArt(i % 2 ? '#fff0a0' : '#ffd0e0'), 8, [ex(K, 3), ex(K, 5)], [1.6, 2.4], [ez(K, 0.2), ez(K, 0.8)], 0.1);
      lamp(K, '#ffd890', NIGHT(K.time) ? 2.0 : 1.2, 7, ex(K, 6.5), 2.4, ez(K, 4));
      lamp(K, '#ffb0c8', 0.9, 4, ex(K, 3.5), 1.2, ez(K, 3.6));
    },
  },

  /* PHIL: a haunted treehouse, and JONA's. Candles everywhere and seven of them floating, salt on the sills and in a
     ring round the rocking chair nobody sits in (it rocks anyway) over a circle of runes glowing violet; the ghost-
     hunting kit on the desk, its meter spiking; an organ; wisps. While Phil is home, JONA stands in the back corner
     facing the wall (the user's ask, 2026-10-15): her head turns round to watch you when you come near. */
  phil: {
    leaderAt: { x: 5, ty: 3.4 },
    blocks: [[8, 3, 3, 1], [8, 4, 1, 1], [10, 4, 1, 1], [8, 5, 3, 1]],
    castAt: [[3, 4.5, 0.5]],
    mood: { hemi: ['#d0c4f0', '#4a3a5a', 1.7], sun: ['#c8b8f0', 1.35], bloom: 1.1 },
    floor: (K, f, W, H, T) => { K.planks(f, W, H, T, ['#62566a', '#564a5e']); runeRing(f, 9.5 * T, 4.5 * T, 1.45 * T, '#b870ff'); },
    skirt: ['#2a1e30', '#1a1220', '#0a0610'],
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f, r = K.seeded(w | 7);
      boards(K, f, w, ['#5e5068', '#52465c', '#685a72', '#4a3e54']);
      g.fillStyle = lin(0, wy(4), 0, wy(1), ['rgba(10,4,20,0.3)', 'rgba(10,4,20,0)']); g.fillRect(0, 0, w, wy(1));
      // sigils, scratched in and faintly glowing
      for (let i = 0; i < w / 22; i++) {
        const cx = 10 + i * 22 + r() * 6, cy = wy(1.9 + r() * 1.2);
        for (const c of [g, s]) { c.strokeStyle = 'rgba(184,112,255,0.55)'; c.lineWidth = 0.5; c.beginPath(); c.arc(cx, cy, 3, 0, Math.PI * 2); c.moveTo(cx, cy - 3); c.lineTo(cx, cy + 3); c.moveTo(cx - 2.6, cy + 1.5); c.lineTo(cx + 2.6, cy - 1.5); c.stroke(); }
      }
      // claw marks
      g.strokeStyle = 'rgba(20,10,24,0.7)'; g.lineWidth = 0.6;
      for (const sx of [w * 0.3, w * 0.78]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(sx + k * 2, wy(2.4)); g.lineTo(sx + k * 2 + 4, wy(1.5)); g.stroke(); }
      if (!back) return;
      sky(K, f, s, x(7.3), x(7.3) + 1.4 * U, 2.6, 1.5, '#2a2030', ['#4a3a5a', '#3a2a4a']);
      g.fillStyle = '#f4f4ee'; g.fillRect(x(7.3) - 2, wy(1.5), 1.4 * U + 4, 1.4);   // salt along the sill
      for (let i = 0; i < 18; i++) g.fillRect(x(7.3) + r() * 1.4 * U, wy(1.5) - 0.6 - r() * 0.6, 0.6, 0.6);
    },
    furnish: [['witchshelf', 0, 0], ['organ', 1, 0], ['bookstack', 3, 0], ['lectern', 4, 0], ['candelabra', 6, 0], ['librarydesk', 10, 0], ['spookylamp', 12, 9],
      ['wingchair', 1, 5], ['raggeddoll', 0, 3], ['crystalball', 2, 3], ['candlestand', 0, 7], ['candlestand', 12, 7], ['candle', 4, 7], ['candle', 8, 8],
      ['ghostsheet', 12, 4], ['litwick', 12, 2], ['jackolantern', 0, 8], ['candelabra', 7, 0], ['rocker', 9, 4]],
    hang: [['cobweb', 0], ['hauntmirror', 5], ['hauntportrait', 9], ['cobweb', 12], ['chandelier', 4], ['hauntportrait', 0, { side: 'l', row: 3 }], ['batgarland', 0, { side: 'r', row: 5 }]],
    props(K, P) {
      const T = K.THREE;
      // the chair nobody sits in, in its salt ring: it rocks
      const chair = P.rocker;
      K.B.ticks.push((now) => { if (!K.calm()) chair.rotation.x = Math.sin(now / 900) * 0.09; });
      quiet(part(K, new T.TorusGeometry(0.82, 0.03, 5, 48), mat(K, '#f4f4ee', { roughness: 1 }), ex(K, 9.5), 0.012, ez(K, 4.5))).rotation.x = -Math.PI / 2;
      // the ghost-hunting kit on the desk: an EMF meter spiking, a camcorder, a torch, a tub of salt
      const desk = P.librarydesk, kit = group(K, ex(K, 11), topOf(desk), ez(K, 0.5));
      const emf = new T.Group(); emf.position.set(-0.4, 0, 0.05); emf.rotation.y = 0.3; kit.add(emf);
      part(K, K.rbox(0.12, 0.04, 0.22, 0.01), mat(K, '#2a2a30'), 0, 0.02, 0, emf);
      const leds = ['#40ff60', '#a0ff40', '#f8f040', '#ffa030', '#ff3030'].map((c, i) => ({ m: part(K, new T.BoxGeometry(0.018, 0.01, 0.018), lit(K, c), 0, 0.045, -0.07 + i * 0.03, emf), c }));
      const cam = new T.Group(); cam.position.set(0.05, 0, 0); cam.rotation.y = -0.4; kit.add(cam);
      part(K, K.rbox(0.24, 0.12, 0.1, 0.02), mat(K, '#1e1e24'), 0, 0.06, 0, cam);
      part(K, new T.CylinderGeometry(0.035, 0.04, 0.06, 12), mat(K, '#101014', { metalness: 0.6 }), 0.08, 0.07, 0.07, cam).rotation.x = Math.PI / 2;
      quiet(part(K, new T.SphereGeometry(0.01, 6, 4), lit(K, '#ff2030'), -0.08, 0.13, 0.03, cam));
      const torch = part(K, new T.CylinderGeometry(0.022, 0.022, 0.22, 10), mat(K, '#c8c8d0', { metalness: 0.7, roughness: 0.3 }), 0.4, 0.022, 0.08, kit); torch.rotation.z = Math.PI / 2;
      part(K, new T.CylinderGeometry(0.06, 0.06, 0.14, 14), mat(K, '#3a6ac8'), 0.38, 0.07, -0.12, kit);
      sheet(K, 20, 8, (f) => { f.g.fillStyle = '#ffffff'; f.g.fillRect(0, 0, 20, 8); text(f.g, 'SALT', 10, 4.2, 5, '#3a6ac8'); }, 0.12, 0.05, 0.38, 0.08, -0.059, { parent: kit, k: 4 });
      quiet(kit);
      let spike = 0;
      K.B.ticks.push((now) => {
        if (now > spike) spike = now + 1200 + Math.random() * 2600;
        const left = (spike - now) / 1200, lvl = left < 1 ? Math.ceil(Math.max(0, left) * 5) : 1;
        leds.forEach((l, i) => { l.m.material.color.set(i < lvl ? l.c : '#202020'); });
      });
      // seven candles floating over the room, bobbing, their flames flickering
      const wax = mat(K, '#f4ecd8', { roughness: 0.8 }), flames = [];
      [[2, 2.1, 2], [4.5, 2.4, 1.2], [7.5, 2.2, 2.8], [10.2, 2.5, 2.2], [3, 2.6, 5.5], [8.5, 2.3, 6.4], [11.5, 2.1, 5.6]].forEach(([tx, y, ty], i) => {
        const c = group(K, ex(K, tx), y, ez(K, ty));
        part(K, new T.CylinderGeometry(0.035, 0.035, 0.2, 10), wax, 0, 0, 0, c).castShadow = false;
        const fl = K.sprite(K.emberArt('#ffb040'), 0.16); fl.visible = true; fl.position.y = 0.15; fl.material.blending = T.AdditiveBlending; c.add(fl);
        quiet(c); flames.push({ c, fl, y, i });
      });
      K.B.ticks.push((now) => { const t = now / 1000; for (const f of flames) { f.c.position.y = f.y + (K.calm() ? 0 : Math.sin(t * 0.9 + f.i * 1.7) * 0.08); f.fl.material.opacity = 0.75 + Math.sin(t * 13 + f.i * 3) * 0.2; } });
      motes(K, (i) => K.fireflyArt(i % 2 ? '#c890ff' : '#90f0e0'), 10, [ex(K, 1), ex(K, 12)], [0.5, 2.4], [ez(K, 1), ez(K, 8)], 0.13);
      // the violet light over the chair breathes; one warm candle glow
      const v = lamp(K, '#b060ff', 2.0, 5, ex(K, 9.5), 1.4, ez(K, 4.5));
      K.B.ticks.push((now) => { if (!K.calm()) v.intensity = 1.6 + Math.sin(now / 900) * 0.8; });
      lamp(K, '#ffb060', 1.0, 4, ex(K, 2.5), 1.4, ez(K, 3));
      if (!K.away) jona(K);
    },
  },

  /* RICKY: the den round the living tree, its trunk up through the middle of his room, a headset hung on a peg in it.
     Blackout curtains (it's always 2:07 a.m. here), two monitors (the inbox, the lobby asking "one more?"), three empty
     mugs, energy drinks, the sleep maths on a whiteboard, an unmade bed. */
  ricky: {
    leaderAt: { x: 6, ty: 3.6 },
    blocks: [[0, 0, 3, 3], [10, 3, 1, 1]],
    mood: { hemi: ['#c0cae8', '#3a3a4a', 1.65], sun: ['#b0bce0', 1.25], bloom: 1.1 },
    floor: (K, f, W, H, T) => K.planks(f, W, H, T, ['#6e4e38', '#5c402c']),
    skirt: ['#3a2416', '#2a180e', '#140a04'],
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f;
      boards(K, f, w, ['#7a5a42', '#6e4e38', '#866248', '#664834']);
      g.fillStyle = lin(0, 0, 0, wy(1), ['rgba(10,12,30,0.4)', 'rgba(10,12,30,0.08)']); g.fillRect(0, 0, w, wy(1));
      if (!back) return;
      // the blackout curtains, drawn: heavy navy folds over the window, a slit of street light where they meet
      const x0 = x(3.6), x1 = x(5.9);
      for (let xx = x0; xx < x1; xx += 3) { g.fillStyle = lin(xx, 0, xx + 3, 0, ['#141a30', '#242c48', '#10162a']); g.fillRect(xx, wy(3.1), 3, wy(1.2) - wy(3.1)); }
      for (const c of [g, s]) { c.fillStyle = 'rgba(200,220,255,0.7)'; c.fillRect((x0 + x1) / 2 - 0.3, wy(3.0), 0.6, wy(1.3) - wy(3.0)); }
      g.fillStyle = '#5a4a3a'; g.fillRect(x0 - 3, wy(3.15), x1 - x0 + 6, 1.4);
    },
    furnish: [['desk', 8, 0], ['coffeecounter', 10, 0], ['minifridge', 11, 0], ['bookstack', 12, 0], ['swivelchair', 8, 1],
      ['bed-heavy', 11, 4], ['nightstand', 10, 4], ['laundrypile', 10, 7], ['beanbag-heavy', 3, 6], ['moonlamp', 0, 6], ['bookstack', 0, 8], ['slippers', 9, 6, { free: true }],
      ['plaidbigrug-heavy', 4, 3, { mid: true }], ['starprojector', 4, 0], ['plant', 12, 8], ['bin', 7, 1]],
    hang: [['calendar', 10], ['hathooks', 12], ['stickywall', 0, { side: 'r', row: 2 }], ['photowall', 0, { side: 'l', row: 5 }]],
    props(K, P) {
      const T = K.THREE;
      // the living tree, up through the den: a bark trunk, roots into the floor, a peg with his headset
      const tx = ex(K, 1.6), tz = ez(K, 1.6);
      const bark = K.fine(40, 80, 3); { const { g } = bark, r = K.seeded(3); g.fillStyle = '#5a3a24'; g.fillRect(0, 0, 40, 80); for (let i = 0; i < 40; i++) { g.fillStyle = ['#4a2e1a', '#6a4a30', '#3a2414'][i % 3]; g.fillRect(r() * 40, 0, 0.6 + r() * 1.6, 80); } for (let i = 0; i < 4; i++) { g.fillStyle = '#2a180c'; g.beginPath(); g.ellipse(r() * 40, r() * 80, 2, 3, 0, 0, Math.PI * 2); g.fill(); } }
      const bm = K.std({ map: K.texOf(bark.c), roughness: 1 });
      bm.map.wrapS = bm.map.wrapT = T.RepeatWrapping; bm.map.repeat.set(2, 3);
      quiet(part(K, new T.CylinderGeometry(0.62, 0.78, 8, 16), bm, tx, 4, tz));
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3, root = quiet(part(K, new T.ConeGeometry(0.22, 1.1, 6), bm, tx + Math.cos(a) * 0.82, 0.12, tz + Math.sin(a) * 0.82)); root.rotation.set(Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3); }
      part(K, new T.CylinderGeometry(0.02, 0.02, 0.2, 6), mat(K, '#8a6a4a'), tx + 0.3, 1.6, tz + 0.66).rotation.x = Math.PI / 2;
      headset(K, K.B.group, tx + 0.3, 1.52, tz + 0.74, '#a86c40');
      // the two monitors: the inbox, and the lobby asking for one more
      const desk = P.desk, y = topOf(desk);
      monitor(K, K.B.group, ex(K, 8.55), y, ez(K, 0.38), 0.2, 0.52, 0.31, (f) => { const { g } = f; g.fillStyle = '#f4f6fa'; g.fillRect(0, 0, 30, 18); g.fillStyle = '#3a6ac8'; g.fillRect(0, 0, 30, 3); text(g, 'INBOX (238)', 15, 1.6, 2, '#ffffff'); ['RE: RE: standup moved', 'Sync @ 9:00 AM', 'RE: RE: RE: quick q', 'Your manager: ?'].forEach((t, i) => { g.fillStyle = i % 2 ? '#e8ecf4' : '#ffffff'; g.fillRect(0, 3.4 + i * 3.4, 30, 3.4); text(g, t, 1.5, 5.2 + i * 3.4, 1.9, '#2a3040', { align: 'left' }); }); });
      monitor(K, K.B.group, ex(K, 9.45), y, ez(K, 0.38), -0.2, 0.52, 0.31, (f) => { const { g, rr } = f; g.fillStyle = '#0e141e'; g.fillRect(0, 0, 30, 18); text(g, 'ONE MORE?', 15, 6, 4.4, '#f4d8b0'); rr(8, 10, 14, 4.6, 1, '#30c060'); text(g, 'ACCEPT', 15, 12.4, 2.8, '#ffffff'); });
      // three empty mugs, energy drinks
      [[8.25, 0.75, '#e8e4dc'], [8.85, 0.82, '#a86c40'], [9.7, 0.78, '#3a5a8a']].forEach(([a, b, c], i) => mug(K, K.B.group, ex(K, a), y, ez(K, b), c, { ry: i }));
      for (let i = 0; i < 5; i++) { const can = part(K, new T.CylinderGeometry(0.035, 0.035, 0.13, 10), K.std({ color: ['#2a2a2e', '#30c060', '#2a2a2e', '#e8e8f0', '#30c060'][i], metalness: 0.6, roughness: 0.3 }), ex(K, 10.2) + (i % 3) * 0.08, 0.065 + ez(K, 3.6) + Math.floor(i / 3) * 0.1); if (i === 4) { can.rotation.z = Math.PI / 2; can.position.y = 0.035; } quiet(can); }
      // the sleep maths, and the clock that always says 2:07
      sheet(K, 70, 46, (f) => {
        const { g, rr } = f;
        rr(0, 0, 70, 46, 2, '#a8acb4'); rr(2, 2, 66, 42, 1, '#fbfcfd');
        const ln = (t, yy, col = '#2a3040') => text(g, t, 6, yy, 4.2, col, { font: HAND, align: 'left' });
        ln('NOW: 2:07 AM', 9); ln('STANDUP: 9:00', 16); ln('= 6h 53m', 23, '#3060d0'); ln('ONE MORE (40m)', 30, '#e04040'); ln('= 6h 13m. FINE.', 37, '#3060d0');
        g.strokeStyle = '#e04040'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(5, 23); g.lineTo(40, 22); g.stroke();
      }, 1.25, 0.82, ex(K, 6.75), 2.05, ez(K, 0) + 0.02);
      wallClock(K, ex(K, 2.9), 2.4, 0.26, { rim: '#40220e', fixed: [2, 7] });
      // the blue of the screens, the only light he has on
      lamp(K, '#6a9aff', 2.0, 5, ex(K, 9), 1.1, ez(K, 1.5));
      lamp(K, '#ffc890', 0.6, 3, ex(K, 10.5), 1.0, ez(K, 4.6));
    },
  },

  /* MACHEW: blackout cloth over every window in the Savanna sun, a blood moon painted on the wall, the (plastic) katana
     on a lacquered stand under a spotlight with its price sticker still on, a training dummy full of shuriken, a
     meditation cushion and one candle, a desk fan because it's 30 degrees, his work polo on the coat rack. */
  machew: {
    leaderAt: { x: 6, ty: 3.6 },
    blocks: [[0, 0, 3, 2]],
    mood: { hemi: ['#f0c4bc', '#4a2424', 1.65], sun: ['#f4d0b8', 1.3], bloom: 1.05 },
    floor: (K, f, W, H, T) => tatami(K, f, W, H, T, ['#5a5038', '#4a4230'], '#6a1018', '#140c08'),
    skirt: ['#1a0a0c', '#0e0406', '#a01020'],
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f, ink = GYM_INK.machew;
      g.fillStyle = lin(0, 0, 0, wy(1), ['#d8b890', '#c8a070']); g.fillRect(0, 0, w, wy(0.9));   // the kasbah's mud, under it all
      // black cloth draped over everything, in folds, nailed up
      for (let xx = 0; xx < w; xx += 4) { g.fillStyle = lin(xx, 0, xx + 4, 0, ['#1e1418', '#3a2a30', '#181014']); g.fillRect(xx, wy(3.6), 4, wy(1.0) - wy(3.6) + Math.sin(xx) * 1.4); }
      g.fillStyle = '#a01020'; for (let xx = 2; xx < w; xx += 12) { g.beginPath(); g.arc(xx, wy(3.55), 0.8, 0, Math.PI * 2); g.fill(); }
      if (!back) return;
      // the blood moon behind a lone figure on a cliff, his sword out, crows
      const cx = x(9.5), cy = wy(2.35);
      for (const c of [g, s]) { const rg = c.createRadialGradient(cx, cy, 2, cx, cy, 15); rg.addColorStop(0, '#ff4a4a'); rg.addColorStop(0.6, ink[1]); rg.addColorStop(1, 'rgba(160,16,32,0)'); c.fillStyle = rg; c.beginPath(); c.arc(cx, cy, 15, 0, Math.PI * 2); c.fill(); }
      g.fillStyle = '#050204';
      g.beginPath(); g.moveTo(cx - 24, wy(1.0)); g.lineTo(cx - 10, wy(1.55)); g.lineTo(cx + 3, wy(1.45)); g.lineTo(cx + 22, wy(1.0)); g.fill();
      g.fillRect(cx - 1.4, wy(2.05), 2.8, 6.6); g.beginPath(); g.arc(cx, wy(2.12), 1.6, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(cx - 1.2, wy(2.0)); g.lineTo(cx - 7, wy(1.62)); g.lineTo(cx - 6, wy(1.55)); g.lineTo(cx + 1, wy(1.9)); g.fill();
      g.strokeStyle = '#050204'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(cx + 1, wy(1.9)); g.lineTo(cx + 9, wy(2.6)); g.stroke();
      g.beginPath(); g.moveTo(cx - 1, wy(2.1)); g.quadraticCurveTo(cx - 6, wy(2.0), cx - 9, wy(2.15)); g.lineTo(cx - 1, wy(1.95)); g.fill();   // the scarf in the wind
      for (const [bx, by] of [[cx - 12, wy(2.9)], [cx + 10, wy(3.05)], [cx + 14, wy(2.75)]]) { g.lineWidth = 0.5; g.beginPath(); g.moveTo(bx - 2, by); g.quadraticCurveTo(bx - 1, by - 1.2, bx, by); g.quadraticCurveTo(bx + 1, by - 1.2, bx + 2, by); g.stroke(); }
      // the window under the cloth, a blinding slit of afternoon where a corner's come loose
      for (const c of [g, s]) { c.fillStyle = 'rgba(255,240,200,0.95)'; c.beginPath(); c.moveTo(x(4.2), wy(2.7)); c.lineTo(x(4.2) + 7, wy(2.7)); c.lineTo(x(4.2), wy(2.3)); c.fill(); }
    },
    furnish: [['swordrack', 4, 0], ['mysterybookcase', 5, 0], ['bookstack', 6, 0], ['tv', 7, 0], ['console', 7, 1], ['beanbag-shadow', 8, 2], ['punchbag', 12, 0],
      ['futon-shadow', 0, 4], ['fan', 1, 4], ['zabuton', 3, 6], ['candle', 3, 5], ['dummy', 11, 3], ['coatrack', 12, 6], ['shoji', 9, 8],
      ['zigzagbigrug-shadow', 4, 3, { mid: true }], ['bonsai', 0, 8], ['archerytarget', 12, 2], ['swordrack', 0, 6]],
    hang: [['swordtapestry', 3], ['mask', 12], ['hathooks', 0, { side: 'r', row: 5 }], ['swordsflag', 0, { side: 'l', row: 2 }]],
    props(K, P) {
      const T = K.THREE;
      // the katana on its stand, lit from above, the price sticker still on the saya
      const st = group(K, ex(K, 1.5), 0, ez(K, 0.6)), lac = mat(K, '#1a0a0c', { roughness: 0.25, metalness: 0.2 }), gold = mat(K, '#d8a838', { metalness: 0.8, roughness: 0.3 });
      part(K, K.rbox(1.3, 0.1, 0.4, 0.03), lac, 0, 0.05, 0, st);
      for (const s of [-1, 1]) { part(K, K.rbox(0.08, 0.62, 0.16, 0.02), lac, s * 0.48, 0.38, 0, st); for (const h of [0.42, 0.62]) part(K, new T.BoxGeometry(0.1, 0.04, 0.12), mat(K, '#a01020'), s * 0.48, h, 0.05, st); }
      for (const [h, len] of [[0.47, 1.2], [0.67, 0.86]]) {
        const sword = new T.Group(); sword.position.set(0, h, 0.06); sword.rotation.z = 0.04; st.add(sword);
        part(K, new T.BoxGeometry(len * 0.72, 0.035, 0.03), K.std({ color: '#0c0a0c', roughness: 0.15, metalness: 0.3 }), len * 0.1, 0, 0, sword);
        part(K, new T.BoxGeometry(len * 0.22, 0.04, 0.035), mat(K, '#3a0c10', { roughness: 0.9 }), -len * 0.37, 0, 0, sword);
        part(K, new T.CylinderGeometry(0.04, 0.04, 0.012, 14), gold, -len * 0.25, 0, 0, sword).rotation.z = Math.PI / 2;
        if (len > 1) sheet(K, 20, 10, (f) => { f.rr(0, 0, 20, 10, 1.5, '#f88a30'); text(f.g, '$14.99', 10, 5.2, 4.4, '#ffffff'); }, 0.1, 0.05, 0.3, 0, 0.018, { parent: sword, k: 4 });
      }
      quiet(st);
      const beam = new T.Mesh(new T.ConeGeometry(0.85, 2.7, 24, 1, true), new T.MeshBasicMaterial({ color: '#fff0e0', transparent: true, opacity: 0.07, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false }));
      beam.position.set(ex(K, 1.5), 1.6, ez(K, 0.7)); beam.raycast = () => {}; K.B.group.add(beam);
      quiet(part(K, new T.CylinderGeometry(0.1, 0.14, 0.14, 12), mat(K, '#1a1a1e', { metalness: 0.6 }), ex(K, 1.5), 3.0, ez(K, 0.7)));
      // shuriken in the training dummy
      const dummy = P.dummy, d = group(K, ex(K, 11.5), 0, ez(K, 3.5) + 0.22);
      const star = new T.Shape(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? 0.025 : 0.075; star[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
      const sg = new T.ShapeGeometry(star), steel = mat(K, '#a8aab4', { metalness: 0.85, roughness: 0.25, side: T.DoubleSide });
      [[-0.08, 0.7], [0.1, 0.95], [-0.02, 1.25], [0.12, 0.55]].forEach(([dx, h], i) => { const s = part(K, sg, steel, dx, h * (topOf(dummy) / 1.4), 0, d); s.rotation.set(0.3 - i * 0.2, 0.4 * i, i); });
      quiet(d);
      // the one candle, by the cushion, and the dark red of the room
      lamp(K, '#ff3a3a', 1.6, 6, ex(K, 6.5), 2.0, ez(K, 4));
      lamp(K, '#fff0d8', 2.2, 3.6, ex(K, 1.5), 2.4, ez(K, 0.9));
    },
  },

  /* JEROME: a Vice City sunset painted across his kasbah's wall, neon VI, palms in pots, a pink flamingo, an arcade
     racer. The PC with r/GTA6 open in eleven tabs; the crib, the baby asleep in it under a mobile, and over it the
     countdown taped to the wall. A note on the fridge from his wife. */
  jerome: {
    leaderAt: { x: 6, ty: 3.6 },
    blocks: [[11, 8, 1, 1], [8, 1, 1, 1]],
    mood: { hemi: ['#ffe4f0', '#8a5a6a', 1.5], sun: ['#ffd8c8', 1.75], bloom: 1.05 },
    floor: (K, f, W, H, T) => {
      const { g } = f;
      for (let y = 0; y < H; y += T / 2) for (let x = 0; x < W; x += T / 2) { g.fillStyle = ((x + y) / (T / 2)) % 2 ? '#d8906a' : '#c87c58'; g.fillRect(x + 0.2, y + 0.2, T / 2 - 0.4, T / 2 - 0.4); }
      g.fillStyle = 'rgba(80,40,20,0.4)'; for (let x = 0; x < W; x += T / 2) g.fillRect(x, 0, 0.3, H); for (let y = 0; y < H; y += T / 2) g.fillRect(0, y, W, 0.3);
    },
    skirt: ['#c86a3a', '#a85428', '#5a2a14'],
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f, ink = GYM_INK.jerome;
      g.fillStyle = lin(0, 0, 0, wy(1), ['#e4c69c', '#d8b88c']); g.fillRect(0, 0, w, wy(0.9));
      g.fillStyle = '#c86a3a'; g.fillRect(0, wy(1.3), w, 3);
      if (!back) { g.fillStyle = 'rgba(255,90,168,0.25)'; for (let xx = 0; xx < w; xx += 16) g.fillRect(xx, wy(3.5), 8, wy(1.3) - wy(3.5)); return; }
      // the sunset: purple to pink to orange, a striped sun, palms, a skyline in silhouette, neon over it
      const x0 = x(4.3), x1 = x(11.9), t0 = wy(3.4), t1 = wy(1.35);
      g.fillStyle = lin(0, t0, 0, t1, ['#3a1a6a', ink[2], ink[1], '#ff9a5a', '#ffd070']); g.fillRect(x0, t0, x1 - x0, t1 - t0);
      const sx = (x0 + x1) / 2, sy = t1 - 6;
      g.save(); g.beginPath(); g.rect(x0, t0, x1 - x0, t1 - t0); g.clip();
      g.fillStyle = lin(0, sy - 16, 0, sy + 4, ['#fff070', '#ff8a4a', '#ff4a8a']); g.beginPath(); g.arc(sx, sy, 15, Math.PI, 0); g.fill();
      g.fillStyle = ink[1]; for (let i = 0; i < 5; i++) g.fillRect(sx - 16, sy - 2 - i * 3.2, 32, 0.6 + i * 0.25);
      g.fillStyle = '#1a0a2a';
      for (let i = 0; i < 14; i++) { const bx = x0 + i * ((x1 - x0) / 14), bh = 4 + ((i * 7) % 9); g.fillRect(bx, t1 - bh, (x1 - x0) / 14 - 0.8, bh); }
      for (const [px, h, lean] of [[x0 + 8, 22, 0.3], [x0 + 14, 17, -0.2], [x1 - 9, 24, -0.3]]) {
        g.strokeStyle = '#1a0a2a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(px, t1); g.quadraticCurveTo(px + lean * 10, t1 - h / 2, px + lean * 14, t1 - h); g.stroke();
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.beginPath(); g.moveTo(px + lean * 14, t1 - h); g.quadraticCurveTo(px + lean * 14 + Math.cos(a) * 5, t1 - h - 3 + Math.sin(a) * 2, px + lean * 14 + Math.cos(a) * 8, t1 - h + 3 + Math.sin(a) * 2); g.lineWidth = 1; g.stroke(); }
      }
      g.restore();
      for (const c of [g, s]) { c.strokeStyle = '#ff5ab8'; c.lineWidth = 0.9; c.strokeRect(x0, t0, x1 - x0, t1 - t0); }
      neon(f, 'VI', sx, t0 + 9, 13, '#40f0e8');
      g.fillStyle = ink[2];
    },
    furnish: [['crib', 1, 0], ['highchair', 2, 0], ['toybox', 0, 3], ['fridge', 3, 0], ['palmtree', 4, 0], ['desk', 9, 0], ['pc', 11, 0], ['racercabinet', 12, 0], ['swivelchair-psychic', 9, 1],
      ['tv', 12, 3, { turn: -Math.PI / 2 }], ['console', 11, 4], ['sofa-psychic', 8, 3, { turn: Math.PI / 2 }],
      ['wavebigrug-psychic', 4, 3, { mid: true }], ['palmtree', 0, 8], ['palmtree', 12, 8], ['jukebox', 12, 6], ['plant', 0, 6], ['beanbag-psychic', 2, 7]],
    hang: [['starmobile', 0], ['neonsign', 0, { side: 'l', row: 5 }], ['pixelposter', 0, { side: 'r', row: 1 }]],
    props(K, P) {
      const T = K.THREE;
      // the countdown taped over the crib, counting the days
      const days = Math.max(0, Math.ceil((new Date(2026, 10, 19) - new Date()) / 864e5));
      note(K, ex(K, 1.5), 2.5, ez(K, 0) + 0.03, 0.9, 0.62, (g, w, h) => { text(g, 'GTA VI', w / 2, 8, 6, '#ff3a98'); text(g, days ? String(days) : 'OUT!!', w / 2, 15.5, 9, '#2a1a3a'); text(g, days ? 'DAYS' : 'GO GO GO', w / 2, 21.6, 3.6, '#2a1a3a'); }, { tilt: -0.05 });
      // the baby, swaddled, asleep on the crib's mattress
      const baby = group(K, ex(K, 1.5), 0.58, ez(K, 0.5), 0.3);
      const swaddle = part(K, new T.CapsuleGeometry(0.075, 0.2, 4, 10), K.std({ color: '#c8e8ff', roughness: 1 }), 0.02, 0.07, 0, baby); swaddle.rotation.z = Math.PI / 2;
      part(K, new T.SphereGeometry(0.075, 12, 10), K.std({ color: '#e8b890', roughness: 0.8 }), -0.2, 0.08, 0, baby);
      part(K, new T.SphereGeometry(0.05, 10, 8), K.std({ color: '#ff8ac0', roughness: 1 }), -0.24, 0.13, 0, baby).scale.set(1, 0.6, 1.1);
      quiet(baby);
      // the PC: eleven tabs of r/GTA6
      const y = topOf(P.desk);
      monitor(K, K.B.group, ex(K, 10), y, ez(K, 0.36), 0, 0.82, 0.44, (f) => {
        const { g, rr } = f, W = 49, H = 26;
        g.fillStyle = '#1a1a1e'; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 11; i++) rr(0.4 + i * 4.4, 0.4, 4.1, 2.2, 0.6, i === 10 ? '#3a3a42' : '#2a2a30');
        for (let i = 0; i < 11; i++) { g.fillStyle = '#ff4500'; g.beginPath(); g.arc(1.3 + i * 4.4, 1.5, 0.5, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#ff4500'; g.fillRect(0, 2.8, W, 3); text(g, 'r/GTA6', 3, 4.4, 2.2, '#ffffff', { align: 'left' }); text(g, 'NEW: trailer frame 1,847 ZOOMED', 30, 4.4, 1.6, '#ffffff');
        for (let i = 0; i < 3; i++) { rr(1, 6.6 + i * 6.4, W - 2, 5.8, 0.6, '#26262c'); g.fillStyle = ['#ff7ab8', '#40c8e0', '#f8a040'][i]; g.fillRect(2, 7.2 + i * 6.4, 8, 4.6); g.strokeStyle = '#ff3030'; g.lineWidth = 0.4; g.beginPath(); g.arc(6, 9.5 + i * 6.4, 1.6, 0, Math.PI * 2); g.stroke(); text(g, ['palm trees counted: 412', 'is that an alligator??', 'leak? (real) (not fake)'][i], 11.5, 9.5 + i * 6.4, 1.9, '#e8e8f0', { align: 'left' }); }
      });
      // a pink flamingo by the jukebox, on one leg
      const fl = group(K, ex(K, 11.5), 0, ez(K, 8.5), -0.5), pink = K.std({ color: '#ff7ab0', roughness: 0.5 });
      const body = part(K, new T.SphereGeometry(0.2, 14, 10), pink, 0, 0.72, 0, fl); body.scale.set(1.3, 0.8, 0.85);
      const neck = new T.CatmullRomCurve3([new T.Vector3(0.18, 0.78, 0), new T.Vector3(0.28, 0.98, 0), new T.Vector3(0.16, 1.14, 0), new T.Vector3(0.22, 1.28, 0)]);
      part(K, new T.TubeGeometry(neck, 12, 0.035, 6, false), pink, 0, 0, 0, fl);
      part(K, new T.SphereGeometry(0.06, 10, 8), pink, 0.24, 1.3, 0, fl);
      const beak = part(K, new T.ConeGeometry(0.03, 0.1, 8), mat(K, '#1a1a1e'), 0.32, 1.27, 0, fl); beak.rotation.z = -2.0;
      part(K, new T.CylinderGeometry(0.012, 0.012, 0.6, 5), mat(K, '#e86a90'), 0, 0.3, 0, fl);
      const knee = part(K, new T.CylinderGeometry(0.01, 0.01, 0.3, 5), mat(K, '#e86a90'), -0.06, 0.5, 0.04, fl); knee.rotation.z = 1.1;
      quiet(fl);
      // the note on the fridge
      const fr = P.fridge, fb = new T.Box3().setFromObject(fr);
      note(K, ex(K, 3.5), 1.05, fb.max.z + 0.01, 0.46, 0.4, (g, w, h) => { text(g, 'TAKE OUT', w / 2, 6.5, 3.2, '#2a2a3a', { font: HAND }); text(g, 'THE TRASH.', w / 2, 10.5, 3.2, '#2a2a3a', { font: HAND }); text(g, "I'M SERIOUS.", w / 2, 14.5, 3.2, '#e02040', { font: HAND }); }, { tilt: 0.06, paper: '#fff8a0' });
      // pizza boxes, stacked by the desk
      const pz = group(K, ex(K, 8.5), 0, ez(K, 1.5), 0.2);
      for (let i = 0; i < 5; i++) { const bx = part(K, new T.BoxGeometry(0.5, 0.05, 0.5), mat(K, '#d8b080', { roughness: 1 }), (i % 2) * 0.03, 0.025 + i * 0.05, 0, pz); bx.rotation.y = i * 0.15; }
      sheet(K, 20, 20, (f) => { const { g } = f; g.fillStyle = '#d8b080'; g.fillRect(0, 0, 20, 20); g.fillStyle = '#d03030'; g.beginPath(); g.arc(10, 10, 6, 0, Math.PI * 2); g.fill(); text(g, 'ZA', 10, 10.4, 5, '#ffffff'); }, 0.36, 0.36, 0.12, 0.252, 0, { parent: pz, rx: -Math.PI / 2, k: 4 });
      quiet(pz);
      lamp(K, '#ff5ab0', 1.8, 6, ex(K, 8), 2.0, ez(K, 1.5));
      lamp(K, '#40e8f0', 1.1, 5, ex(K, 3), 1.6, ez(K, 3));
    },
  },

  /* THE NIETOS: Law, Britt and baby Linc's house in the Clearing, and Kangaskhan's. Linc's nursery in the corner (the crib
     Kangaskhan rocks with one foot, the laundry it folds, his toys everywhere and Lego underfoot), two gaming desks side
     by side (Law's party waiting on him, Britt's Sage, her phone on Pokémon), the very tired couch, fish sticks on the
     stove, Britt's corner of papers to grade and the house's gold star chart, Law at the bottom. From seven at night
     (your clock, as the door says) Linc is asleep in his crib in his Pikachu suit and the night light is on. */
  nietos: {
    leaderAt: { x: 6, ty: 3.4 },
    castAt: [[1, 1.3, 0]],
    blocks: [[1, 1, 1, 1]],   // Kangaskhan, by the crib
    mood: { hemi: ['#fff8ec', '#8a7a68', 1.55], sun: ['#fff2dc', 1.8], bloom: 0.9 },
    floor: (K, f, W, H, T) => K.planks(f, W, H, T, ['#d4aa74', '#c49a64']),
    skirt: ['#f4ead8', '#ddceb2', '#a89070'],
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f, ink = GYM_INK.nietos, r = K.seeded((w | 0) + 7);
      // baby blue over a cream wainscot, soft clouds drifting along the top
      g.fillStyle = lin(0, 0, 0, wy(1.6), ['#bcdcf6', ink[0]]); g.fillRect(0, 0, w, wy(1.6));
      g.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < w / 26; i++) {
        const cx = 10 + i * 26 + r() * 8, cy = wy(3.2) + r() * 14;
        g.beginPath(); for (const [dx, dy, rr] of [[0, 0, 4], [4.5, 0.8, 3.2], [-4.5, 1, 3], [1.5, -2.4, 3]]) g.ellipse(cx + dx, cy + dy, rr * 1.2, rr, 0, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#f7f0e2'; g.fillRect(0, wy(1.6), w, wy(0.9) - wy(1.6));
      g.strokeStyle = 'rgba(150,128,96,0.4)'; g.lineWidth = 0.6;
      for (let px = 3; px < w - 10; px += 15) g.strokeRect(px, wy(1.48), 12, wy(1.0) - wy(1.48));
      g.fillStyle = '#ffffff'; g.fillRect(0, wy(1.6) - 1.4, w, 2.6);
      // Linc's crayon, at his height, all along the wainscot
      for (let i = 0; i < w / 30; i++) {
        const cx = 6 + i * 30 + r() * 12, cy = wy(1.25) + r() * 4;
        g.strokeStyle = ['#e83a3a', '#3a6ae8', '#3aa050', '#f0a020'][i % 4]; g.lineWidth = 0.9; g.globalAlpha = 0.7;
        g.beginPath(); for (let k = 0; k < 14; k++) g.lineTo(cx + k * 0.9, cy + Math.sin(k * 1.7 + i) * 2.4 + (r() - 0.5)); g.stroke();
      }
      g.globalAlpha = 1;
      if (!back) { text(g, 'LINC', w * 0.3, wy(1.2), 4.2, '#e83a3a', { font: HAND }); return; }
      sky(K, f, s, x(1.1), x(1.1) + 1.4 * U, 2.6, 1.75, '#ffffff', [ink[1], ink[2]]);
      // bunting over the nursery, L I N C
      g.strokeStyle = '#8a7a6a'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(x(-0.4), wy(3.45)); g.quadraticCurveTo(x(1.6), wy(3.2), x(3.8), wy(3.45)); g.stroke();
      'LINCLINC'.split('').forEach((ch, i) => {
        const fx = x(-0.15) + i * 9, fy = wy(3.45) + Math.sin((i + 0.5) / 8 * Math.PI) * 2.6;
        g.fillStyle = ['#f8d040', ink[1], '#f890b0', '#90d0a0'][i % 4]; g.beginPath(); g.moveTo(fx - 3.6, fy); g.lineTo(fx + 3.6, fy); g.lineTo(fx, fy + 7); g.fill();
        text(g, ch, fx, fy + 2.6, 3.4, '#ffffff', { font: HAND });
      });
      // the growth chart by the toy shelf: Linc's marks low down, everyone else's a long way up
      const gx = x(4.25), gw = 0.42 * U, top = wy(3.0), bot = wy(0.92);
      g.fillStyle = '#f8f0d8'; g.fillRect(gx, top, gw, bot - top);
      g.fillStyle = '#c8a870'; for (let yy = bot; yy > top; yy -= 2) g.fillRect(gx, yy, (Math.round((bot - yy) / 2) % 5) ? 1.6 : 3.2, 0.3);
      for (const [h, who, col] of [[1.12, 'LINC 1', '#3a6ae8'], [1.3, 'LINC 2', '#3a6ae8'], [2.42, 'BRITT', '#d04a8a'], [2.62, 'LAW', '#c83a3a'], [2.9, 'KANGASKHAN ^', '#8a6a3a']]) {
        g.fillStyle = col; g.fillRect(gx, wy(h), gw, 0.5); text(g, who, gx + gw - 0.6, wy(h) - 1.5, 1.7, col, { font: HAND, align: 'right' });
      }
      // their posters over the desks: Law's ranked red, Britt's Sage
      f.rr(x(9.15), wy(2.95), 1.5 * U, 1.0 * U, 1, '#1a1a24');
      g.fillStyle = '#ff4655'; g.beginPath(); g.moveTo(x(9.5), wy(2.8)); g.lineTo(x(9.9), wy(2.8)); g.lineTo(x(10.15), wy(2.3)); g.lineTo(x(10.4), wy(2.8)); g.lineTo(x(10.8), wy(2.8)); g.lineTo(x(10.15), wy(2.1)); g.fill();
      text(g, 'ONE MORE', x(9.9), wy(2.05), 3, '#ffffff');
      f.rr(x(11.15), wy(2.95), 1.5 * U, 1.0 * U, 1, '#1e6a62');
      g.strokeStyle = '#8ef0d8'; g.lineWidth = 0.8; g.beginPath(); for (let j = 0; j <= 6; j++) { const a = j / 6 * Math.PI * 2 + Math.PI / 6; g.lineTo(x(11.9) + Math.cos(a) * 6, wy(2.5) + Math.sin(a) * 6); } g.stroke();
      text(g, '+', x(11.9), wy(2.5), 8, '#ffffff');
      text(g, 'HEAL WALL REZ', x(11.9), wy(2.08), 2.4, '#d8fff4');
    },
    furnish: [['crib', 0, 0], ['dresser', 1, 0], ['blocktoyshelf', 3, 0], ['fireplace', 5, 0, { mid: true }], ['minifridge', 8, 0],
      ['desk', 9, 0], ['desk', 11, 0], ['laundrypile', 2, 1], ['swivelchair-fire', 9, 1], ['swivelchair-aqua', 11, 1],
      ['puzzlemat', 1, 2], ['stackrings', 3, 2], ['blocktower', 2, 3], ['toybox', 0, 3], ['rockinghorse', 0, 4], ['bigpikachudoll', 0, 5],
      ['fluffyrug-aqua', 5, 2, { mid: true }], ['checkbigrug-aqua', 8, 3], ['console', 12, 3],
      ['sofa-ragged', 8, 4, { turn: Math.PI / 2 }], ['coffeetable', 10, 4, { turn: Math.PI / 2 }], ['tv', 12, 4, { turn: -Math.PI / 2 }],
      ['highchair', 3, 6], ['fridge', 0, 7], ['stove', 1, 7], ['coffeecounter', 2, 7], ['bin', 0, 9],
      ['schoolbag', 9, 7], ['teacherdesk', 10, 7], ['bookcart', 12, 7], ['plant', 12, 9]],
    hang: [['starmobile', 0], ['kite', 0, { side: 'l', row: 2 }], ['calendar', 0, { side: 'l', row: 5 }], ['firstaid', 0, { side: 'r', row: 1 }]],
    props(K, P) {
      const T = K.THREE, hour = new Date().getHours(), asleep = !K.away && (hour >= 19 || hour < 6);
      // the family's photos over the fireplace
      put(K, 'photowall', 5, -0.5, { free: true, dx: 0.5 });
      // the changing table: a pad, a stack of nappies, the baby monitor (its sound bars dancing while he sleeps), the night light
      const dr = P.dresser, dy = topOf(dr), ct = group(K, ex(K, 2), dy, ez(K, 0.5));
      part(K, K.rbox(0.62, 0.08, 0.42, 0.04), mat(K, '#cfe6f8', { roughness: 0.9 }), -0.36, 0.04, 0.02, ct);
      for (let i = 0; i < 4; i++) part(K, K.rbox(0.16, 0.05, 0.12, 0.02), mat(K, '#fbfbf6', { roughness: 1 }), 0.2, 0.025 + i * 0.052, -0.06, ct);
      const mon = new T.Group(); mon.position.set(0.52, 0, 0.08); ct.add(mon);
      part(K, K.rbox(0.12, 0.16, 0.06, 0.02), mat(K, '#f4f4f0', { roughness: 0.4 }), 0, 0.08, 0, mon);
      part(K, new T.CylinderGeometry(0.008, 0.008, 0.1, 5), mat(K, '#d8d8d4'), 0.04, 0.2, 0, mon);
      const bars = [0, 1, 2].map(i => quiet(part(K, new T.BoxGeometry(0.02, 0.05, 0.005), lit(K, asleep ? '#60ff90' : '#3a8a5a'), -0.03 + i * 0.03, 0.1, 0.032, mon)));
      K.B.ticks.push((now) => { bars.forEach((b, i) => { b.scale.y = asleep && !K.calm() ? 0.35 + Math.abs(Math.sin(now / 260 + i * 1.3)) * 0.65 : 0.4; }); });
      quiet(ct);
      if (asleep) K.piece('starprojector', 1, 0, { y: dy, scale: 0.5, free: true, dx: 0.15 });
      // in the crib: Linc fast asleep in his Pikachu suit after seven, his Pikachu plush the rest of the day
      const crib = group(K, ex(K, 0.5), 0.58, ez(K, 0.5), 0.35);
      if (asleep) {
        const yel = K.std({ color: '#f8d030', roughness: 0.85 });
        part(K, new T.CapsuleGeometry(0.07, 0.16, 4, 10), yel, 0.04, 0.07, 0, crib).rotation.z = Math.PI / 2;
        part(K, new T.SphereGeometry(0.075, 12, 10), yel, -0.16, 0.085, 0, crib);
        part(K, new T.SphereGeometry(0.05, 10, 8), K.std({ color: '#f0c8a0', roughness: 0.8 }), -0.17, 0.08, 0.045, crib);
        for (const s of [-1, 1]) { const ear = part(K, new T.ConeGeometry(0.025, 0.12, 8), yel, -0.22, 0.12, s * 0.04, crib); ear.rotation.z = 1.1; ear.rotation.x = s * 0.4; }
        part(K, new T.SphereGeometry(0.012, 6, 4), lit(K, '#ff6a5a'), -0.19, 0.075, 0.07, crib);
        part(K, K.rbox(0.36, 0.03, 0.22, 0.015), K.std({ color: '#a8d4f4', roughness: 1 }), 0.08, 0.1, 0.02, crib);
        // z's drifting up out of the crib
        const zc = K.fine(16, 16, 6); text(zc.g, 'z', 8, 9, 12, '#eef4ff', { font: HAND });
        const zs = [0, 1, 2].map(() => { const sp = K.sprite(zc.c, 0.16); sp.visible = true; return sp; });
        K.B.ticks.push((now) => {
          zs.forEach((sp, i) => {
            const p = K.calm() ? 0.3 + i * 0.25 : ((now / 3200) + i / 3) % 1;
            sp.position.set(ex(K, 0.6) + p * 0.35 + Math.sin(p * 6) * 0.05, 0.95 + p * 0.8, ez(K, 0.5));
            sp.material.opacity = Math.sin(p * Math.PI) * 0.9;
            sp.scale.setScalar(0.1 + p * 0.1);
          });
        });
      } else K.piece('pikachudoll', 0, 0, { y: 0.58, scale: 0.5, free: true, dz: 0.05 });
      quiet(crib);
      // Lego, everywhere, the nursery worst of all ("mind the Lego")
      const r = K.seeded(23), cols = ['#e83a3a', '#3a7ae8', '#f8d040', '#3ab060', '#f8f8f4', '#f08a2a'], at = [];
      for (let i = 0; at.length < 34 && i < 600; i++) {
        const tx = r() < 0.55 ? 0.6 + r() * 4.2 : 0.6 + r() * 11.8, ty = 1.2 + r() * 7.6;
        if (K.B.blocked.has(`${Math.floor(tx)},${Math.floor(ty)}`) || (Math.abs(tx - 6.5) < 0.7 && ty > 7.5)) continue;
        at.push([tx, ty, r() * Math.PI, r() < 0.3]);
      }
      const bricks = new T.InstancedMesh(new T.BoxGeometry(0.12, 0.045, 0.06), K.std({ color: '#ffffff', roughness: 0.3 }), at.length);
      const studs = new T.InstancedMesh(new T.CylinderGeometry(0.017, 0.017, 0.022, 8), K.std({ color: '#ffffff', roughness: 0.3 }), at.length * 2);
      const o = new T.Object3D(), c = new T.Color();
      at.forEach(([tx, ty, a, tall], i) => {
        o.position.set(ex(K, tx), 0.0225, ez(K, ty)); o.rotation.set(0, a, 0); o.scale.set(1, tall ? 1.6 : 1, 1); o.updateMatrix();
        bricks.setMatrixAt(i, o.matrix); bricks.setColorAt(i, c.set(cols[i % cols.length]));
        for (const s of [-1, 1]) {
          o.position.set(ex(K, tx) + Math.cos(a) * s * 0.03, (tall ? 0.072 : 0.045) + 0.011, ez(K, ty) - Math.sin(a) * s * 0.03); o.scale.set(1, 1, 1); o.updateMatrix();
          studs.setMatrixAt(i * 2 + (s > 0), o.matrix); studs.setColorAt(i * 2 + (s > 0), c.set(cols[i % cols.length]));
        }
      });
      for (const m of [bricks, studs]) { m.castShadow = true; m.receiveShadow = true; m.raycast = () => {}; K.B.group.add(m); }
      // Cheerios round the high chair, a sippy cup on its tray
      const hc = P.highchair, cheer = new T.InstancedMesh(new T.TorusGeometry(0.016, 0.007, 5, 8), K.std({ color: '#e0b060', roughness: 0.9 }), 18);
      for (let i = 0; i < 18; i++) { const a = i * 2.4, d = 0.3 + (i % 5) * 0.08; o.position.set(ex(K, 3.5) + Math.cos(a) * d, 0.008, ez(K, 6.5) + Math.sin(a) * d * 0.8); o.rotation.set(-Math.PI / 2, 0, 0); o.updateMatrix(); cheer.setMatrixAt(i, o.matrix); }
      cheer.raycast = () => {}; K.B.group.add(cheer);
      const sip = group(K, ex(K, 3.5) + 0.1, topOf(hc), ez(K, 6.5) + 0.1);
      part(K, new T.CylinderGeometry(0.04, 0.036, 0.1, 12), mat(K, '#88c4f0', { roughness: 0.4 }), 0, 0.05, 0, sip);
      part(K, new T.CylinderGeometry(0.03, 0.04, 0.03, 12), mat(K, '#f8d040', { roughness: 0.4 }), 0, 0.115, 0, sip);
      quiet(sip);
      // fish sticks on the stove, just out of the oven
      const st = group(K, ex(K, 1.5), topOf(P.stove), ez(K, 7.5), 0.1);
      part(K, K.rbox(0.5, 0.02, 0.34, 0.01), mat(K, '#5a5a62', { metalness: 0.6, roughness: 0.4 }), 0, 0.01, 0, st);
      const crumb = K.std({ color: '#d88a3a', roughness: 0.9 });
      for (let i = 0; i < 8; i++) part(K, K.rbox(0.18, 0.035, 0.05, 0.012), crumb, -0.1 + (i % 2) * 0.2, 0.038, -0.12 + Math.floor(i / 2) * 0.08, st);
      quiet(st);
      mug(K, K.B.group, ex(K, 2.5) + 0.18, topOf(P.coffeecounter), ez(K, 7.5) + 0.12, '#f8f4ec');
      // the fridge: Linc's drawing of everyone (Kangaskhan biggest), dinner's timings, and while they're out, the note
      const fb = new T.Box3().setFromObject(P.fridge), fz = fb.max.z + 0.01;
      note(K, ex(K, 0.5) - 0.12, 1.25, fz, 0.42, 0.34, (g, w, h) => {
        g.lineWidth = 0.8; g.lineCap = 'round';
        for (const [px, size, col] of [[4.5, 4, '#3a6ae8'], [8, 4, '#d04a8a'], [11, 2.2, '#f0c020'], [15, 6, '#8a5a2a']]) {
          g.strokeStyle = col; g.beginPath(); g.arc(px, h - 5 - size * 1.6, size * 0.4, 0, Math.PI * 2); g.moveTo(px, h - 5 - size * 1.2); g.lineTo(px, h - 5 - size * 0.4); g.lineTo(px - size * 0.4, h - 4); g.moveTo(px, h - 5 - size * 0.4); g.lineTo(px + size * 0.4, h - 4); g.stroke();
        }
        g.fillStyle = '#f8c020'; g.beginPath(); g.arc(w - 3, 3.6, 1.6, 0, Math.PI * 2); g.fill();
      }, { tilt: -0.08 });
      note(K, ex(K, 0.5) + 0.14, 0.82, fz, 0.32, 0.26, (g, w) => { text(g, 'FISH STX', w / 2, 5.4, 2.4, '#2a2a3a', { font: HAND }); text(g, '425° 12m', w / 2, 8.6, 2.4, '#2a2a3a', { font: HAND }); }, { tilt: 0.06, paper: '#fff8a0' });
      if (K.away) note(K, ex(K, 0.5), 1.62, fz, 0.38, 0.26, (g, w) => { text(g, 'OUT!', w / 2, 5, 4, '#e02040', { font: HAND }); text(g, 'back soon - L&B', w / 2, 9, 1.8, '#2a2a3a', { font: HAND }); }, { tilt: 0.04 });
      // the desks, side by side: Law's party waiting on him, Britt mid-match as Sage
      const y = topOf(P.desk);
      monitor(K, K.B.group, ex(K, 10), y, ez(K, 0.36), 0.06, 0.62, 0.36, (f) => {
        const { g, rr } = f;
        g.fillStyle = '#10121a'; g.fillRect(0, 0, 37, 22); g.fillStyle = '#ff4655'; g.fillRect(0, 0, 37, 3.6);
        text(g, 'PARTY 4/5', 18.5, 1.9, 2.4, '#ffffff');
        for (let i = 0; i < 5; i++) { rr(2 + i * 6.8, 6, 5.8, 9, 0.6, i < 4 ? '#2a2e3e' : '#1a1c26'); if (i < 4) { g.fillStyle = '#ff8a90'; g.beginPath(); g.arc(4.9 + i * 6.8, 9.4, 1.6, 0, Math.PI * 2); g.fill(); } else text(g, '?', 4.9 + i * 6.8, 10.5, 5, '#ff4655'); }
        text(g, 'WAITING ON LAW...', 18.5, 18.6, 2.6, '#ffd0d4');
      });
      headset(K, K.B.group, ex(K, 9.4), y + 0.05, ez(K, 0.7), '#ff4655', 0.3);
      for (let i = 0; i < 3; i++) { const can = quiet(part(K, new T.CylinderGeometry(0.035, 0.035, 0.13, 10), mat(K, ['#3ad070', '#2a2a30', '#3ad070'][i], { metalness: 0.6, roughness: 0.3 }), ex(K, 10.7) + i * 0.08, y + 0.065, ez(K, 0.3) + (i % 2) * 0.08)); if (i === 1) { can.rotation.z = Math.PI / 2; can.position.y = y + 0.035; } }
      monitor(K, K.B.group, ex(K, 12), y, ez(K, 0.36), -0.06, 0.62, 0.36, (f) => {
        const { g, lin } = f;
        g.fillStyle = lin(0, 0, 0, 22, ['#2a5a6a', '#123038']); g.fillRect(0, 0, 37, 22);
        g.strokeStyle = '#8ef0d8'; g.lineWidth = 0.6; g.strokeRect(8, 4, 21, 9); g.fillStyle = 'rgba(142,240,216,0.25)'; g.fillRect(8, 4, 21, 9);
        text(g, 'SAGE', 18.5, 8.5, 4, '#ffffff');
        g.fillStyle = '#ff4655'; g.fillRect(2, 15.5, 33, 2.4); g.fillStyle = '#5af0c0'; g.fillRect(2, 15.5, 26, 2.4);
        text(g, 'REZ READY', 18.5, 20, 2.4, '#d8fff4');
      });
      headset(K, K.B.group, ex(K, 12.6), y + 0.05, ez(K, 0.7), '#40e0c0', -0.3);
      // her phone by the keyboard, on a Pokémon battle
      const ph = group(K, ex(K, 11.4), y + 0.008, ez(K, 0.75), 0.4);
      part(K, K.rbox(0.09, 0.012, 0.17, 0.012), mat(K, '#2a2a30'), 0, 0, 0, ph);
      sheet(K, 16, 30, (f) => { const { g, lin } = f; g.fillStyle = lin(0, 0, 0, 30, ['#a8e0ff', '#e8f8e0']); g.fillRect(0, 0, 16, 30); g.fillStyle = '#7ac860'; g.beginPath(); g.ellipse(11, 10, 5, 1.6, 0, 0, Math.PI * 2); g.ellipse(5, 21, 5.5, 1.8, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f8d030'; g.beginPath(); g.arc(5, 19, 2.4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e04a4a'; g.beginPath(); g.arc(11, 8, 2, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2a2a30'; g.fillRect(0, 25, 16, 5); }, 0.08, 0.15, 0, 0.007, 0, { parent: ph, bright: true, rx: -Math.PI / 2, k: 6 });
      quiet(ph);
      ledStrip(K, 1.9, ex(K, 10), 0.05, ez(K, 0.95), { col: '#ff4655' });
      ledStrip(K, 1.9, ex(K, 12), 0.05, ez(K, 0.95), { col: '#40e0c0' });
      // the coffee table: two controllers, juice boxes out of Kangaskhan's pouch, a bottle
      const tb = group(K, ex(K, 10.5), topOf(P.coffeetable), ez(K, 5));
      for (const [dz, col] of [[-0.42, '#c83a3a'], [-0.18, '#2a8a80']]) { const pad = part(K, K.rbox(0.16, 0.035, 0.1, 0.03), mat(K, col, { roughness: 0.4 }), 0.02, 0.018, dz, tb); pad.rotation.y = dz * 2; }
      for (const [dx, dz, col] of [[-0.1, 0.12, '#f05a8a'], [0.08, 0.2, '#f8a030'], [-0.04, 0.32, '#60b0f0']]) {
        part(K, new T.BoxGeometry(0.07, 0.11, 0.045), mat(K, col, { roughness: 0.6 }), dx, 0.055, dz, tb);
        part(K, new T.CylinderGeometry(0.004, 0.004, 0.07, 4), mat(K, '#f8f8f8'), dx + 0.02, 0.13, dz, tb).rotation.z = 0.25;
      }
      part(K, new T.CylinderGeometry(0.03, 0.03, 0.12, 10), new T.MeshStandardMaterial({ color: '#f8fbff', transparent: true, opacity: 0.6, roughness: 0.2 }), 0.08, 0.06, 0.42, tb);
      part(K, new T.ConeGeometry(0.025, 0.05, 10), mat(K, '#e8b880'), 0.08, 0.145, 0.42, tb);
      quiet(tb);
      // Britt's corner: papers to grade, the red pen, an apple, the gold star stickers
      const td = group(K, ex(K, 11), topOf(P.teacherdesk), ez(K, 7.5)), paper = mat(K, '#f8f6f0', { roughness: 1 });
      for (const [dx, h] of [[-0.55, 0.12], [-0.3, 0.07]]) part(K, new T.BoxGeometry(0.22, h, 0.28), paper, dx, h / 2, 0, td);
      part(K, new T.CylinderGeometry(0.006, 0.006, 0.14, 5), mat(K, '#e02030'), -0.3, 0.078, 0.06, td).rotation.z = Math.PI / 2;
      part(K, new T.SphereGeometry(0.05, 12, 10), K.std({ color: '#d82a2a', roughness: 0.35 }), 0.4, 0.05, 0.02, td);
      part(K, new T.CylinderGeometry(0.004, 0.004, 0.04, 4), mat(K, '#5a3a1a'), 0.4, 0.11, 0.02, td);
      part(K, new T.CylinderGeometry(0.045, 0.045, 0.09, 12), new T.MeshStandardMaterial({ color: '#f8f4e0', transparent: true, opacity: 0.45 }), 0.15, 0.045, -0.06, td);
      quiet(part(K, new T.CylinderGeometry(0.04, 0.04, 0.06, 12), lit(K, '#f8c830'), 0.15, 0.03, -0.06, td));
      mug(K, td, 0.6, 0, -0.08, '#d04a8a');
      quiet(td);
      // and the house's gold star chart on the wall over it, Law at the bottom
      sheet(K, 90, 56, (f) => {
        const { g, rr } = f;
        rr(0, 0, 90, 56, 2, '#fffaf0'); g.fillStyle = '#88c4f0'; g.fillRect(0, 0, 90, 10);
        text(g, 'GOLD STARS!', 45, 5.4, 6, '#ffffff', { font: HAND });
        const star = (cx, cy, k, col) => { g.fillStyle = col; g.beginPath(); for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + j * Math.PI / 5, d = j % 2 ? k * 0.45 : k; g.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); } g.fill(); };
        [['LINC', 6], ['KANGASKHAN', 5], ['BRITT', 4], ['LAW', 0]].forEach(([who, n], i) => {
          const ry = 17 + i * 10;
          g.fillStyle = 'rgba(136,196,240,0.35)'; g.fillRect(3, ry + 4.4, 84, 0.4);
          text(g, who, 4, ry, 4, '#2a3a5a', { font: HAND, align: 'left' });
          for (let j = 0; j < n; j++) star(42 + j * 7.4, ry, 3, '#f8c020');
          if (!n) text(g, 'see me.', 60, ry, 4, '#e02030', { font: HAND });
        });
      }, 1.6, 1.0, ex(K, K.cols) - 0.03, 1.75, ez(K, 7.6), { ry: -Math.PI / 2, k: 4 });
      // the fire's glow on the room, and the night light (or the lamp over the couch) on the other
      lamp(K, '#ffb060', NIGHT(K.time) ? 1.8 : 1.0, 5, ex(K, 6.5), 0.8, ez(K, 1.3));
      if (asleep) lamp(K, '#a8c0ff', 1.0, 3.5, ex(K, 1.2), 1.3, ez(K, 1.2));
      else lamp(K, '#ffe0b0', 0.9, 5, ex(K, 10), 2.2, ez(K, 4.6));
    },
  },
};

/** The room's light, by the leader's mood; night dims the room and lets its glows carry it. */
export function leaderEnv(id, time) {
  const m = LEADER_HOMES[id].mood, k = time === 'night' ? 0.72 : time === 'dusk' ? 0.88 : 1;
  return { hemi: [m.hemi[0], m.hemi[1], m.hemi[2] * k], sun: [m.sun[0], m.sun[1] * (k * k)], bloom: m.bloom + (1 - k) * 0.5 };
}

/** Builds a leader's home into the room being built (K.B). */
export function buildLeaderHome(K, id) {
  const L = LEADER_HOMES[id];
  K.shell({ floor: floorArt(K, L), wall: wallArt(K, L, (K.cols + 0.8) * U, true), side: () => wallArt(K, L, K.rows * U, false), edge: '#3a2418', cap: '#4a3020', under: '#20140c', bg: '#140c0a' });
  const P = {};
  for (const [pid, x, y, o] of L.furnish) { const m = put(K, pid, x, y, o); if (m && !P[pid]) P[pid] = m; }
  for (const [pid, x, o] of L.hang) hang(K, pid, x, o);
  for (const [x, y, w, h] of L.blocks || []) block(K, x, y, w, h);
  L.props(K, P);
  const at = L.leaderAt;
  block(K, Math.floor(at.x), Math.floor(at.ty));
  return L;
}
