/* town-halls.js  -  the towns' great halls, inside (2026-10-14, the user's ask: "i want to revamp all the town special
   houses like aquarium, bathhouse, greenroom etc. they SUCK the insides need to be HUGE and be super aesthetic and make
   sense"). js/event-3d.js's buildHome() hands one here with the room's kit (K), like a Gym Leader's home
   (js/leader-homes.js, whose helpers these share). Each is 17 x 12 (HALL_SIZE; the old ones were 11 x 9, a leader's 13
   x 10), the shot sliding round it, and built as the place it says it is: Lantern Village's Noh stage under its own roof,
   Cinder Springs' sento under a volcano mural, Driftwood Landing's aquarium with a tank the width of the hall, Highbough's
   dead Victorian conservatory with Chandelure for its chandelier, and Sunwell Bazaar's arcaded caravanserai round a
   fountain. Each hall's five Pokemon (its `cast` in js/data/towns.js) stand at `castAt` ([x, ty, y, scale]). Two point
   lights a hall at most; the rest glows. */

import { U, TOP, wy, BOLD, part, lit, mat, block, ex, ez, lamp, group, quiet, sheet, text, put, hang, motes, topOf } from './leader-homes.js';

export const HALL_SIZE = { cols: 17, rows: 12, view: 9, across: 8, shadow: 11 };
const C = HALL_SIZE.cols, R = HALL_SIZE.rows;

/** Tiles whose middles sit within `r` of (cx, cy) (tile edges): a round pool's footprint, as `blocks`. */
function round(cx, cy, r) {
  const out = [];
  for (let x = 0; x < C; x++) for (let y = 0; y < R; y++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < r) out.push([x, y, 1, 1]);
  return out;
}

/* ---------- small helpers ---------- */

/** Many of one thing, one draw: each [x, y, z, scale, turn, colour, scaleY, tiltX, tiltZ]. */
function many(K, geo, m, list, { shadow = true } = {}) {
  const T = K.THREE, o = new T.InstancedMesh(geo, m, list.length), d = new T.Object3D(), col = new T.Color();
  list.forEach(([x, y, z, s = 1, ry = 0, c, sy, rx = 0, rz = 0], i) => {
    d.position.set(x, y, z); d.rotation.set(rx, ry, rz); d.scale.set(s, sy ?? s, s); d.updateMatrix();
    o.setMatrixAt(i, d.matrix);
    if (c) o.setColorAt(i, col.set(c));
  });
  o.castShadow = shadow; o.receiveShadow = true;
  K.B.group.add(o);
  return o;
}

/** A painting turned into a texture once; `wrap` lets it tile and scroll. */
function paint(K, w, h, draw, { k = 4, wrap = false } = {}) {
  const f = K.fine(w, h, k);
  draw(f);
  const t = K.texOf(f.c);
  if (wrap) t.wrapS = t.wrapT = K.THREE.RepeatWrapping;
  return { t, glow: f.c.glow ? K.texOf(f.c.glow) : null, c: f.c };
}

/** A canvas span between two of a wall's tile edges, whichever way the wall runs. */
const span = (x, a, b) => [Math.min(x(a), x(b)), Math.abs(x(b) - x(a))];

/** Water that shimmers: a ripple painting that tiles, drifting. */
function ripples(K, [deep, mid, hi], seed = 3) {
  return paint(K, 48, 48, (f) => {
    const { g, lin } = f, r = K.seeded(seed);
    g.fillStyle = lin(0, 0, 48, 48, [deep, mid, deep]); g.fillRect(0, 0, 48, 48);
    g.strokeStyle = hi; g.lineWidth = 0.6; g.globalAlpha = 0.55;
    for (let i = 0; i < 16; i++) {
      const x = r() * 48, y = r() * 48, s = 2.5 + r() * 6;
      for (const ox of [-48, 0, 48]) for (const oy of [-48, 0, 48]) { g.beginPath(); g.moveTo(x + ox - s, y + oy); g.quadraticCurveTo(x + ox, y + oy - s * 0.5, x + ox + s, y + oy); g.stroke(); }
    }
    g.globalAlpha = 1;
  }, { wrap: true });
}
function water(K, w, d, x, y, z, cols, { disc = false, op = 0.8, speed = 0.025, glow = 0.3 } = {}) {
  const T = K.THREE, { t } = ripples(K, cols, Math.round(w * 7 + d));
  t.repeat.set(Math.max(1, w / 2), Math.max(1, d / 2));
  const m = K.std({ map: t, transparent: true, opacity: op, roughness: 0.12, metalness: 0.1, emissive: new T.Color(cols[1]), emissiveIntensity: glow, depthWrite: false });
  const o = part(K, disc ? new T.CircleGeometry(w / 2, 48) : new T.PlaneGeometry(w, d), m, x, y, z);
  o.rotation.x = -Math.PI / 2;
  o.castShadow = false;
  K.B.ticks.push((now) => { if (!K.calm()) t.offset.set(now / 1000 * speed, Math.sin(now / 2600) * 0.06); });
  return o;
}

/** Sprites that rise, drift and fade on a loop (bubbles, petals falling with `fall`, embers, the jet's drops). */
function drift(K, art, n, place, { size = 0.12, period = 6, spin = 0 } = {}) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const sp = K.sprite(art(i), size * (0.75 + (i % 3) * 0.18));
    sp.visible = true;
    sp.userData = { ph: i / n + Math.random() * 0.3, sp: 1 / (period * (0.8 + Math.random() * 0.4)), seed: Math.random() * 7, i };
    list.push(sp);
  }
  const step = (now) => {
    for (const sp of list) {
      const u = sp.userData, t = (now / 1000 * u.sp + u.ph) % 1;
      place(sp.position, t, u);
      sp.material.opacity = Math.min(1, t * 6, (1 - t) * 5);
      if (spin) sp.material.rotation = t * spin + u.seed;
    }
  };
  step(0);
  K.B.ticks.push((now) => { if (!K.calm()) step(now); });
  return list;
}

function dotArt(K, col, ring = false) {
  const f = K.fine(8, 8, 8), { g } = f;
  if (ring) { g.strokeStyle = col; g.lineWidth = 0.9; g.beginPath(); g.arc(4, 4, 2.8, 0, Math.PI * 2); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(3, 3, 0.8, 0, Math.PI * 2); g.fill(); }
  else { const r = g.createRadialGradient(4, 4, 0, 4, 4, 4); r.addColorStop(0, '#ffffff'); r.addColorStop(0.35, col); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 8, 8); }
  return f.c;
}

/** Red paper lanterns, ribbed, black-capped, glowing and breathing a little. */
function chochins(K, at, col = '#e8402c') {
  const T = K.THREE, { t } = paint(K, 24, 24, (f) => {
    const { g, lin } = f;
    g.fillStyle = lin(0, 0, 24, 0, ['#b02018', col, '#ff7a50', col, '#b02018']); g.fillRect(0, 0, 24, 24);
    g.fillStyle = 'rgba(60,10,6,0.35)'; for (let y = 1; y < 24; y += 2.4) g.fillRect(0, y, 24, 0.4);
    g.fillStyle = '#2a0c08'; g.font = BOLD(9); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('祭', 12, 12.5);
  });
  const body = new T.SphereGeometry(0.2, 16, 12); body.scale(1, 1.3, 1);
  const m = K.std({ map: t, emissive: new T.Color('#ffffff'), emissiveMap: t, emissiveIntensity: 0.85, roughness: 0.8 });
  many(K, body, m, at.map(([x, y, z, ry = 0]) => [x, y, z, 1, ry]), { shadow: false });
  const black = mat(K, '#1a1414', { roughness: 0.6 });
  many(K, new T.CylinderGeometry(0.11, 0.12, 0.07, 12), black, at.flatMap(([x, y, z]) => [[x, y + 0.27, z], [x, y - 0.27, z]]), { shadow: false });
  many(K, new T.CylinderGeometry(0.008, 0.008, 0.7, 4), black, at.map(([x, y, z]) => [x, y + 0.65, z]), { shadow: false });
  K.B.ticks.push((now) => { if (!K.calm()) m.emissiveIntensity = 0.82 + Math.sin(now / 430) * 0.07 + Math.sin(now / 170) * 0.03; });
}

/** The sky by the hour, for a courtyard's top or a window. */
function skyCols(time) {
  return time === 'night' ? ['#0c1430', '#1a2850', '#2a3a6a'] : time === 'dusk' ? ['#4a3a78', '#e87850', '#f8c080'] : time === 'dawn' ? ['#7a9ad0', '#f8b8a0', '#fce0c8'] : ['#3a88d8', '#78b8ec', '#c8e4f8'];
}

/* ---------- paintings ---------- */

/** The Noh stage's back wall: an old pine on gold boards. */
function pinePainting(g, a, b, top, bot) {
  const W = b - a, H = bot - top, X = (u) => a + u * W, Y = (v) => top + v * H;
  g.lineCap = 'round';
  g.strokeStyle = '#4a2e1a'; g.lineWidth = W * 0.04;
  g.beginPath(); g.moveTo(X(0.4), Y(1.02)); g.bezierCurveTo(X(0.3), Y(0.72), X(0.56), Y(0.56), X(0.48), Y(0.2)); g.stroke();
  g.strokeStyle = '#6a4428'; g.lineWidth = W * 0.012;
  g.beginPath(); g.moveTo(X(0.385), Y(1)); g.bezierCurveTo(X(0.3), Y(0.74), X(0.55), Y(0.56), X(0.47), Y(0.22)); g.stroke();
  g.strokeStyle = '#4a2e1a';
  for (const [x0, y0, x1, y1, wd] of [[0.44, 0.5, 0.1, 0.4, 0.016], [0.46, 0.56, 0.88, 0.46, 0.018], [0.5, 0.32, 0.78, 0.18, 0.012], [0.48, 0.28, 0.2, 0.14, 0.011], [0.42, 0.7, 0.66, 0.66, 0.01]]) {
    g.lineWidth = W * wd; g.beginPath(); g.moveTo(X(x0), Y(y0)); g.quadraticCurveTo(X((x0 + x1) / 2), Y(Math.min(y0, y1) - 0.08), X(x1), Y(y1)); g.stroke();
  }
  for (const [u, v, r] of [[0.1, 0.38, 0.12], [0.88, 0.43, 0.14], [0.77, 0.15, 0.11], [0.2, 0.12, 0.1], [0.48, 0.15, 0.14], [0.66, 0.63, 0.09], [0.3, 0.45, 0.08], [0.62, 0.3, 0.08]]) {
    for (const [dy, col, k] of [[0.025, '#1a3418', 1], [0, '#2a5426', 0.9], [-0.025, '#467636', 0.66], [-0.04, '#6a9a4a', 0.36]]) {
      g.fillStyle = col; g.beginPath(); g.ellipse(X(u), Y(v + dy), r * W * k, r * W * 0.32 * k, 0, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = '#8ab860'; g.lineWidth = 0.4;
    for (let i = 0; i < 18; i++) { const t = i / 17 * Math.PI, px = X(u) + Math.cos(t) * r * W * 0.85, py = Y(v) - Math.sin(t) * r * W * 0.26; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(t) * 1.6, py - 1.4); g.stroke(); }
  }
}

function bamboo(g, a, b, top, bot) {
  for (let i = 0, x = a + 3; x < b - 2; i++, x += 7 + (i % 3) * 2) {
    g.fillStyle = i % 2 ? '#5a8a3a' : '#6a9a44'; g.fillRect(x, top, 2.6, bot - top);
    g.fillStyle = '#3a5a26'; for (let y = top + 6 + i * 3; y < bot; y += 14) g.fillRect(x - 0.4, y, 3.4, 0.9);
    g.fillStyle = '#4a7a30';
    for (let y = top + 10 + i * 5; y < bot - 6; y += 22) for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + 1.3 + s * 4.5, y, 4.5, 1.1, s * 0.4, 0, Math.PI * 2); g.fill(); }
  }
}

/** Gold clouds, the kind on a lacquer screen. */
function kumo(g, x, y, s, col = '#e0b450') {
  g.strokeStyle = col; g.lineWidth = s * 0.14; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - s * 1.6, y); g.lineTo(x + s * 1.6, y); g.stroke();
  for (const [dx, r] of [[-0.8, 0.5], [0, 0.7], [0.8, 0.45]]) { g.beginPath(); g.arc(x + dx * s, y - 0.05 * s, r * s, Math.PI, 0); g.stroke(); }
}

/** Cinder Springs' sento mural: the volcano that heats the water, a lake under it, tiled. */
function volcanoMural(f, s, a, b, top, bot) {
  const { g, lin } = f, W = b - a, H = bot - top, X = (u) => a + u * W, Y = (v) => top + v * H;
  g.fillStyle = lin(0, top, 0, bot, ['#2a62b8', '#5a9ae0', '#a8d4f2', '#f8dcb0']); g.fillRect(a, top, W, H);
  const cloud = (cx, cy, k) => { g.fillStyle = '#ffffff'; for (const [dx, dy, r] of [[-1.2, 0.2, 0.6], [-0.4, -0.2, 0.85], [0.5, -0.05, 0.75], [1.2, 0.25, 0.5]]) { g.beginPath(); g.arc(cx + dx * k, cy + dy * k, r * k, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#d8e8f8'; g.fillRect(cx - 1.8 * k, cy + 0.3 * k, 3.6 * k, 0.5 * k); };
  for (const [u, v, k] of [[0.1, 0.16, 6], [0.3, 0.08, 4.5], [0.76, 0.12, 6.5], [0.93, 0.27, 4], [0.6, 0.06, 3.5]]) cloud(X(u), Y(v), k);
  g.fillStyle = '#8a96c8'; g.beginPath(); g.moveTo(a, Y(0.8)); for (let u = 0; u <= 1.001; u += 0.05) g.lineTo(X(u), Y(0.7 + Math.sin(u * 13) * 0.04 + Math.sin(u * 5) * 0.03)); g.lineTo(b, Y(0.86)); g.lineTo(a, Y(0.86)); g.fill();
  g.fillStyle = lin(0, Y(0.26), 0, Y(0.86), ['#7a5068', '#5a3a50', '#3a2838']);
  g.beginPath(); g.moveTo(X(0.16), Y(0.87)); g.quadraticCurveTo(X(0.36), Y(0.64), X(0.43), Y(0.28)); g.lineTo(X(0.57), Y(0.28)); g.quadraticCurveTo(X(0.64), Y(0.64), X(0.86), Y(0.87)); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(X(0.43), Y(0.28)); g.quadraticCurveTo(X(0.38), Y(0.6), X(0.24), Y(0.87)); g.lineTo(X(0.34), Y(0.87)); g.quadraticCurveTo(X(0.44), Y(0.6), X(0.47), Y(0.3)); g.fill();
  for (const c of [g, s]) {
    c.strokeStyle = '#ff7a28'; c.lineWidth = 1.3; c.lineCap = 'round';
    for (const [u1, u2, v2] of [[0.47, 0.37, 0.66], [0.53, 0.62, 0.7], [0.5, 0.49, 0.56]]) { c.beginPath(); c.moveTo(X(u1), Y(0.3)); c.quadraticCurveTo(X((u1 + u2) / 2 + 0.02), Y(0.48), X(u2), Y(v2)); c.stroke(); }
    c.fillStyle = '#ffc040'; c.fillRect(X(0.435), Y(0.27), X(0.565) - X(0.435), 1.5);
  }
  for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(${210 + i * 4},${206 + i * 4},${220 + i * 3},0.92)`; g.beginPath(); g.arc(X(0.5 + i * 0.022 + Math.sin(i) * 0.01), Y(0.25 - i * 0.028), W * (0.018 + i * 0.004), 0, Math.PI * 2); g.fill(); }
  g.fillStyle = lin(0, Y(0.86), 0, bot, ['#3a7ac0', '#24589a']); g.fillRect(a, Y(0.86), W, H * 0.14);
  g.fillStyle = 'rgba(122,80,104,0.45)'; g.beginPath(); g.moveTo(X(0.22), Y(0.865)); g.lineTo(X(0.8), Y(0.865)); g.lineTo(X(0.56), Y(0.98)); g.lineTo(X(0.44), Y(0.98)); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 14; i++) g.fillRect(X((i * 0.37) % 1), Y(0.89 + (i % 4) * 0.025), 5 + (i % 3) * 3, 0.5);
  g.fillStyle = '#1e3a24';
  for (const [u, k] of [[0.04, 1], [0.09, 0.8], [0.95, 1.1], [0.9, 0.75]]) { for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(X(u) - 5 * k + j * 0.6, Y(0.86) - j * 5 * k); g.lineTo(X(u) + 5 * k - j * 0.6, Y(0.86) - j * 5 * k); g.lineTo(X(u), Y(0.86) - (j + 1.4) * 5 * k); g.fill(); } }
  g.fillStyle = 'rgba(255,255,255,0.16)';
  for (let x = a; x < b; x += 4) g.fillRect(x, top, 0.3, H);
  for (let y = top; y < bot; y += 4) g.fillRect(a, y, W, 0.3);
}

/** The aquarium's tank, painted on the wall behind the glass: deep water, rays of light, rocks and kelp far off. */
function tankPainting(f, s, a, b, top, bot) {
  const { g, lin } = f, W = b - a, H = bot - top, X = (u) => a + u * W, Y = (v) => top + v * H;
  g.fillStyle = lin(0, top, 0, bot, ['#4ac0e8', '#1a7ab8', '#0c4a88', '#082a58']); g.fillRect(a, top, W, H);
  s.fillStyle = lin(0, top, 0, bot, ['rgba(80,200,240,0.7)', 'rgba(30,110,180,0.45)', 'rgba(10,50,110,0.25)']); s.fillRect(a, top, W, H);
  for (const c of [g, s]) {
    c.globalAlpha = c === g ? 0.16 : 0.12; c.fillStyle = '#e8fcff';
    for (const [u, w] of [[0.1, 0.05], [0.27, 0.03], [0.44, 0.07], [0.63, 0.04], [0.8, 0.06], [0.93, 0.03]]) { c.beginPath(); c.moveTo(X(u), top); c.lineTo(X(u + w), top); c.lineTo(X(u + w + 0.12), bot); c.lineTo(X(u + 0.08), bot); c.fill(); }
    c.globalAlpha = 1;
  }
  g.fillStyle = '#0a3060';
  g.beginPath(); g.moveTo(a, bot); for (let u = 0; u <= 1.001; u += 0.04) g.lineTo(X(u), Y(0.72 + Math.sin(u * 17) * 0.05 + Math.sin(u * 7 + 1) * 0.06)); g.lineTo(b, bot); g.fill();
  g.fillStyle = '#0e3e72';
  g.beginPath(); g.moveTo(a, bot); for (let u = 0; u <= 1.001; u += 0.05) g.lineTo(X(u), Y(0.82 + Math.sin(u * 11 + 2) * 0.05)); g.lineTo(b, bot); g.fill();
  g.strokeStyle = '#124a5a'; g.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const u = (i * 0.137 + 0.03) % 1, h = 0.35 + (i % 4) * 0.1; g.lineWidth = 1.6; g.beginPath(); g.moveTo(X(u), bot); g.bezierCurveTo(X(u + 0.02), Y(1 - h * 0.4), X(u - 0.02), Y(1 - h * 0.7), X(u + 0.01), Y(1 - h)); g.stroke(); }
  g.fillStyle = 'rgba(10,40,80,0.55)';
  for (let i = 0; i < 22; i++) { const u = (i * 0.211) % 1, v = 0.25 + ((i * 0.37) % 0.4); g.beginPath(); g.ellipse(X(u), Y(v), 1.6, 0.7, 0, 0, Math.PI * 2); g.fill(); }
}

/** Highbough's conservatory glass: gothic lancets in rusting white iron, grimed, cracked, a pane or two gone, the
    canopy dark beyond and ivy climbing in. */
function conservatoryGlass(K, f, s, x0, x1, top, bot, seed) {
  const { g, lin } = f, r = K.seeded(seed), night = K.time === 'night';
  g.fillStyle = lin(0, top, 0, bot, night ? ['#0a1222', '#121e30', '#18283a'] : ['#24382c', '#2e4834', '#3a5640']); g.fillRect(x0, top, x1 - x0, bot - top);
  g.fillStyle = night ? 'rgba(20,34,40,0.9)' : 'rgba(20,40,24,0.85)';
  for (let i = 0; i < (x1 - x0) / 5; i++) { g.beginPath(); g.ellipse(x0 + r() * (x1 - x0), top + r() * (bot - top) * 0.8, 4 + r() * 8, 2 + r() * 4, r() * 3, 0, Math.PI * 2); g.fill(); }
  if (night) { s.fillStyle = 'rgba(150,170,230,0.18)'; s.fillRect(x0, top, x1 - x0, (bot - top) * 0.5); }
  g.fillStyle = lin(0, top, 0, bot, ['rgba(90,110,80,0.05)', 'rgba(70,80,50,0.35)', 'rgba(60,60,36,0.6)']); g.fillRect(x0, top, x1 - x0, bot - top);
  const bay = 2 * U, iron = '#c8ccc0', rust = '#8a6a48';
  for (let x = x0; x < x1 - 1; x += bay) {
    const mid = x + bay / 2, arch = top + 0.4 * U;
    g.strokeStyle = iron; g.lineWidth = 1.8;
    for (const [l, rr] of [[x + 2, mid - 1], [mid + 1, x + bay - 2]]) {
      const c = (l + rr) / 2;
      g.beginPath(); g.moveTo(l, bot); g.lineTo(l, arch + 8); g.quadraticCurveTo(l, arch + 1, c, arch - 3); g.quadraticCurveTo(rr, arch + 1, rr, arch + 8); g.lineTo(rr, bot); g.stroke();
      g.lineWidth = 0.8; for (let y = arch + 14; y < bot; y += 11) { g.beginPath(); g.moveTo(l, y); g.lineTo(rr, y); g.stroke(); }
      g.beginPath(); g.moveTo(c, arch - 2); g.lineTo(c, bot); g.stroke(); g.lineWidth = 1.8;
    }
    g.beginPath(); g.arc(mid, arch - 6, 3, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(138,106,72,0.5)'; for (let i = 0; i < 6; i++) g.fillRect(x + 2 + r() * (bay - 4), arch + r() * (bot - arch), 0.8, 2 + r() * 4);
    if (r() < 0.55) {   // a pane gone: black, its jagged edge
      const px = x + 3 + r() * (bay - 9), py = arch + 16 + r() * (bot - arch - 30);
      g.fillStyle = '#05080a'; g.beginPath(); g.moveTo(px, py); for (let k = 0; k < 9; k++) g.lineTo(px + 3 + Math.cos(k * 0.7) * (2 + r() * 2.5), py + 5 + Math.sin(k * 0.7) * (3 + r() * 2)); g.fill();
    }
    g.strokeStyle = 'rgba(230,240,240,0.55)'; g.lineWidth = 0.4;
    for (let k = 0; k < 2; k++) { let cx = x + r() * bay, cy = arch + 10 + r() * (bot - arch - 20); g.beginPath(); g.moveTo(cx, cy); for (let j = 0; j < 4; j++) { cx += (r() - 0.5) * 7; cy += 2 + r() * 4; g.lineTo(cx, cy); } g.stroke(); }
  }
  g.fillStyle = rust; g.fillRect(x0, bot - 1.5, x1 - x0, 1.5);
  g.strokeStyle = '#2a3a22'; g.lineWidth = 1;
  for (let k = 0; k < (x1 - x0) / 40; k++) {
    let vx = x0 + r() * (x1 - x0), vy = bot; g.beginPath(); g.moveTo(vx, vy);
    const leaves = [];
    for (let j = 0; j < 9; j++) { vx += (r() - 0.5) * 9; vy -= 4 + r() * 5; g.lineTo(vx, vy); leaves.push([vx, vy]); }
    g.stroke();
    for (const [lx, ly] of leaves) { g.fillStyle = r() < 0.6 ? '#5a4a2a' : '#2e4a24'; g.beginPath(); g.ellipse(lx + 1.5, ly, 2, 1.1, r() * 3, 0, Math.PI * 2); g.fill(); }
  }
}

/** A caravanserai's upper storey: pointed arches in sandstone, cedar lattice screens in them, a striped band. */
function upperStorey(g, x0, x1, top, bot, bayW) {
  g.fillStyle = '#e0bc88'; g.fillRect(x0, top, x1 - x0, bot - top);
  for (let y = top; y < bot; y += 5) for (let x = x0 - ((y / 5) % 2) * 6; x < x1; x += 12) { g.fillStyle = 'rgba(150,100,50,0.12)'; g.fillRect(x, y, 0.4, 5); }
  g.fillStyle = 'rgba(150,100,50,0.15)'; for (let y = top; y < bot; y += 5) g.fillRect(x0, y, x1 - x0, 0.4);
  for (let x = x0 + bayW / 2; x < x1; x += bayW) {
    const w = bayW * 0.46, h = (bot - top) * 0.62, b = bot - (bot - top) * 0.12, t = b - h;
    g.fillStyle = '#6a3a1c';
    g.beginPath(); g.moveTo(x - w / 2, b); g.lineTo(x - w / 2, t + w * 0.5); g.quadraticCurveTo(x - w / 2, t, x, t - w * 0.2); g.quadraticCurveTo(x + w / 2, t, x + w / 2, t + w * 0.5); g.lineTo(x + w / 2, b); g.fill();
    g.strokeStyle = '#c8955a'; g.lineWidth = 0.5;
    for (let i = -w / 2 + 2; i < w / 2; i += 2.2) { g.beginPath(); g.moveTo(x + i, t + 2); g.lineTo(x + i, b); g.stroke(); }
    for (let j = t + 3; j < b; j += 2.2) { g.beginPath(); g.moveTo(x - w / 2, j); g.lineTo(x + w / 2, j); g.stroke(); }
    g.strokeStyle = '#a0562c'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(x - w / 2 - 1.5, b); g.lineTo(x - w / 2 - 1.5, t + w * 0.5); g.quadraticCurveTo(x - w / 2 - 1.5, t - 1.5, x, t - w * 0.2 - 2); g.quadraticCurveTo(x + w / 2 + 1.5, t - 1.5, x + w / 2 + 1.5, t + w * 0.5); g.lineTo(x + w / 2 + 1.5, b); g.stroke();
    g.fillStyle = '#7a4a26'; g.fillRect(x - w / 2 - 3, b, w + 6, 2.2);
  }
  for (let x = x0; x < x1; x += 4) { g.fillStyle = (x / 4) % 2 ? '#2a6a8a' : '#e8d8b0'; g.fillRect(x, bot - 2, 4, 2); }
}

/** A Moroccan eight-point star of zellige round the fountain, painted on the flags. */
function zelligeStar(g, cx, cy, r) {
  const star = (rad, col) => { g.fillStyle = col; for (const turn of [0, Math.PI / 4]) { g.save(); g.translate(cx, cy); g.rotate(turn); g.fillRect(-rad * 0.71, -rad * 0.71, rad * 1.42, rad * 1.42); g.restore(); } };
  star(r, '#1e4e7a'); star(r * 0.9, '#f0e6cc'); star(r * 0.8, '#2a7a8a');
  g.fillStyle = '#e8b04a'; g.beginPath(); g.arc(cx, cy, r * 0.66, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f0e6cc'; g.beginPath(); g.arc(cx, cy, r * 0.6, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; g.fillStyle = i % 2 ? '#1e4e7a' : '#3a8a5a'; g.beginPath(); g.ellipse(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72, r * 0.05, r * 0.05, 0, 0, Math.PI * 2); g.fill(); }
}

/* ---------- the halls ---------- */

const NIGHT = (t) => t === 'night';

export const HALLS = {
  /* LANTERN VILLAGE'S DANCE THEATER: a Noh stage under its own gabled roof on four cypress pillars, the old pine painted
     on gold behind it, the bridge off to the striped curtain on the left, the drums on the right, petals falling over
     the five dancers, red lanterns down both walls and the audience's cushions on tatami either side of a red aisle. */
  theater: {
    town: 'shrine',
    shotTop: 4.8,
    mood: { hemi: ['#ffe6cc', '#5a3a30', 1.4], sun: ['#ffd8a8', 1.55], bloom: 1.0 },
    beat: 900, flip: (i, n) => i < n / 2,
    castAt: [[5.1, 1.5, 0.55, 0.95], [6.8, 2.5, 0.55, 0.95], [8.5, 1.3, 0.55, 0.95], [10.2, 2.5, 0.55, 0.95], [11.9, 1.5, 0.55, 0.95]],
    floor(K, f, W, H, T) {
      const { g, rr, lin } = f;
      K.planks(f, W, H, T, ['#5a3a22', '#4a2e1a']);
      g.fillStyle = 'rgba(255,220,170,0.06)'; g.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 2) { const r = (x * 7) % 5; g.fillStyle = ['#e8e2d4', '#d4ccbc', '#f4efe4', '#c8c0b0', '#ddd6c8'][r]; g.beginPath(); g.ellipse(x + 1, 4 * T + 2 + (x * 13) % (T - 4), 0.9, 0.6, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(232,226,212,0.55)'; g.fillRect(0, 4 * T, W, T);
      for (const x0 of [1, 10]) for (let y = 5; y < 11; y++) for (let x = x0; x < x0 + 6; x += 2) {
        rr(x * T + 0.5, y * T + 0.5, 2 * T - 1, T - 1, 1, lin(0, y * T, 0, (y + 1) * T, ['#d8d090', '#c4b870']));
        g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 2; i < 2 * T - 2; i += 1.3) g.fillRect(x * T + i, y * T + 1, 0.3, T - 2);
        g.fillStyle = '#2a3a2a'; g.fillRect(x * T + 0.5, y * T + 0.5, 2 * T - 1, 1.1); g.fillRect(x * T + 0.5, (y + 1) * T - 1.6, 2 * T - 1, 1.1);
      }
      g.fillStyle = '#a81c28'; g.fillRect(7.7 * T, 4.6 * T, 1.6 * T, H - 4.6 * T);
      g.fillStyle = '#e0b040'; g.fillRect(7.7 * T, 4.6 * T, 0.6, H); g.fillRect(9.3 * T - 0.6, 4.6 * T, 0.6, H);
      g.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = 5 * T; y < H; y += 3) g.fillRect(7.8 * T, y, 1.4 * T, 0.4);
    },
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f;
      g.fillStyle = '#1a0e0a'; g.fillRect(0, 0, w, TOP * U);
      g.fillStyle = lin(0, wy(1), 0, wy(0), ['#3a2416', '#22140c']); g.fillRect(0, wy(1), w, U);
      // the ranma: a band of paper lattice lit from behind, all the way round
      g.fillStyle = '#f2e4c0'; g.fillRect(0, wy(4.4), w, wy(3.6) - wy(4.4));
      s.fillStyle = 'rgba(255,210,150,0.55)'; s.fillRect(0, wy(4.4), w, wy(3.6) - wy(4.4));
      g.strokeStyle = '#3a2214'; g.lineWidth = 0.6;
      for (let i = -20; i < w + 20; i += 4) { g.beginPath(); g.moveTo(i, wy(4.4)); g.lineTo(i + 16, wy(3.6)); g.moveTo(i + 16, wy(4.4)); g.lineTo(i, wy(3.6)); g.stroke(); }
      g.fillStyle = '#2a160c'; g.fillRect(0, wy(4.55), w, 3); g.fillRect(0, wy(3.6) - 1, w, 3);
      g.fillStyle = '#e0b450'; g.fillRect(0, wy(3.6) + 2, w, 0.8);
      if (back) {
        const a = x(3.2), b = x(13.8), top = wy(3.45), bot = wy(0.55);
        for (let i = a; i < b; i += 6) { g.fillStyle = lin(i, 0, i + 6, 0, ['#d4ac5c', '#ecc878', '#cca252']); g.fillRect(i, top, 6, bot - top); g.fillStyle = 'rgba(90,60,20,0.3)'; g.fillRect(i, top, 0.4, bot - top); }
        s.fillStyle = 'rgba(255,220,150,0.22)'; s.fillRect(a, top, b - a, bot - top);
        pinePainting(g, a, b, top, bot);
        g.fillStyle = '#2a160c'; g.fillRect(a - 2, top - 2, b - a + 4, 2.5);
        g.fillStyle = '#d4ac5c'; g.fillRect(x(13.9), wy(3.4), x(17.2) - x(13.9), wy(0.2) - wy(3.4));
        bamboo(g, x(13.9), x(17.2), wy(3.4), wy(0.2));
        g.fillStyle = lin(0, wy(3.4), 0, wy(0.5), ['#3a2216', '#2a180e']); g.fillRect(x(-0.4), wy(3.4), x(3.1) - x(-0.4), wy(0.5) - wy(3.4));
        for (let t = 0; t < 3; t++) kumo(g, x(t + 0.6), wy(2.2 - (t % 2) * 0.6), 2.4);
      } else {
        for (let r = 0; r < R; r += 2) {
          const [a, wd] = span(x, r, r + 2);
          g.fillStyle = lin(a, 0, a + wd, 0, ['#6a1414', '#8a2018', '#6a1414']); g.fillRect(a + 2, wy(3.4), wd - 4, wy(1.1) - wy(3.4));
          g.strokeStyle = '#d0a040'; g.lineWidth = 0.6; g.strokeRect(a + 4, wy(3.2), wd - 8, wy(1.3) - wy(3.2));
          kumo(g, a + wd * 0.35, wy(2.6), 3); kumo(g, a + wd * 0.65, wy(1.9), 2.4);
          g.fillStyle = '#e0b450'; g.beginPath(); g.arc(a + wd / 2, wy(2.25), 3.2, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#6a1414'; g.beginPath(); for (let k = 0; k < 5; k++) { const an = k / 5 * Math.PI * 2 - Math.PI / 2; g.lineTo(a + wd / 2 + Math.cos(an) * 2.6, wy(2.25) + Math.sin(an) * 2.6); g.lineTo(a + wd / 2 + Math.cos(an + 0.63) * 1.1, wy(2.25) + Math.sin(an + 0.63) * 1.1); } g.fill();
          g.fillStyle = '#1a0c06'; g.fillRect(x(r) - 1.6, wy(3.6), 3.2, wy(0) - wy(3.6));
        }
      }
    },
    furnish: [['pine', 0, 2, { scale: 0.62 }], ['pine', 1, 2, { scale: 0.5 }], ['pine', 2, 2, { scale: 0.62 }],
      ['wavebyobu', 14, 0], ['gong', 16, 0], ['taiko', 14, 1], ['taiko', 15, 1],
      ['kimonostand', 0, 4], ['kimonostand', 16, 4], ['andon', 0, 8], ['andon', 16, 8], ['bonsai', 16, 6], ['teaset', 0, 6],
      ['andon', 0, 11], ['andon', 16, 11], ['kadomatsu', 6, 11], ['kadomatsu', 10, 11]],
    hang: [['wallfan', 0, { side: 'l', row: 10, y: 1.6 }], ['wallfan', 0, { side: 'r', row: 10, y: 1.6 }]],
    blocks: [[3, 0, 11, 4], [0, 0, 3, 2], [8, 4, 1, 1], [2, 6, 5, 1], [10, 6, 5, 1], [2, 8, 5, 1], [10, 8, 5, 1]],
    props(K) {
      const T = K.THREE, cyp = mat(K, '#d6ae78', { roughness: 0.55 }), dark = mat(K, '#2a1a12', { roughness: 0.8 }), gold = mat(K, '#e8c050', { metalness: 0.7, roughness: 0.3 });
      const hinoki = paint(K, 64, 32, (f) => K.planks(f, 64, 32, 16, ['#f0d4a4', '#e0c08c'])).t;
      hinoki.wrapS = hinoki.wrapT = T.RepeatWrapping; hinoki.repeat.set(2.6, 1.6);
      const top = K.std({ map: hinoki, roughness: 0.4 });
      // the stage: hinoki boards a step up, a gold lip, footlights, three steps down to the gravel
      const SH = 0.55, sx = ex(K, 8.5), sz = ez(K, 2), x0 = ex(K, 3.2), x1 = ex(K, 13.8), z0 = ez(K, 0.25), z1 = ez(K, 3.8);
      part(K, new T.BoxGeometry(11, SH, 4), [dark, dark, top, dark, dark, dark], sx, SH / 2, sz);
      part(K, new T.BoxGeometry(11.04, 0.05, 0.08), gold, sx, SH, ez(K, 4));
      many(K, new T.BoxGeometry(0.26, 0.07, 0.08), lit(K, '#fff2c8'), Array.from({ length: 10 }, (_, i) => [sx - 4.5 + i, 0.32, ez(K, 4) + 0.05]), { shadow: false });
      for (let i = 0; i < 3; i++) part(K, new T.BoxGeometry(1.2, SH * (3 - i) / 3, 0.3), cyp, sx, SH * (3 - i) / 6, ez(K, 4) + 0.15 + i * 0.28);
      // four pillars, gold-shod, holding the roof
      const PH = 2.95, RY = SH + PH;
      for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
        part(K, new T.CylinderGeometry(0.13, 0.15, PH, 14), cyp, px, SH + PH / 2, pz);
        part(K, new T.CylinderGeometry(0.19, 0.19, 0.1, 14), gold, px, SH + 0.05, pz);
        part(K, new T.CylinderGeometry(0.17, 0.17, 0.12, 14), gold, px, RY - 0.06, pz);
      }
      for (const pz of [z0, z1]) part(K, new T.BoxGeometry(x1 - x0 + 0.5, 0.26, 0.26), cyp, sx, RY + 0.13, pz);
      for (const px of [x0, x1]) part(K, new T.BoxGeometry(0.26, 0.26, z1 - z0), cyp, px, RY + 0.13, (z0 + z1) / 2);
      // the roof: a gable with curving slopes facing the hall, its front lattice and gold, a crest at the peak
      const L = (x1 - x0) / 2 + 0.9, rise = 1.25, sh = new T.Shape();
      sh.moveTo(-L, -0.1); sh.lineTo(-L, 0.06); sh.quadraticCurveTo(-L * 0.45, 0.32, 0, rise); sh.quadraticCurveTo(L * 0.45, 0.32, L, 0.06); sh.lineTo(L, -0.1); sh.closePath();
      const cap = paint(K, Math.round(2 * L * 20), Math.round((rise + 0.1) * 20), (f) => {
        const { g } = f, Wd = 2 * L * 20, Ht = (rise + 0.1) * 20, cx = (u) => (u + L) * 20, cy = (y) => (rise - y) * 20;
        g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, Wd, Ht);
        g.strokeStyle = '#3a2216'; g.lineWidth = 1;
        for (let i = 0; i < Wd; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, Ht); g.stroke(); }
        for (let j = 0; j < Ht; j += 4) { g.beginPath(); g.moveTo(0, j); g.lineTo(Wd, j); g.stroke(); }
        g.strokeStyle = '#2a160c'; g.lineWidth = 5;
        g.beginPath(); g.moveTo(cx(-L), cy(0.0)); g.quadraticCurveTo(cx(-L * 0.45), cy(0.26), cx(0), cy(rise - 0.04)); g.quadraticCurveTo(cx(L * 0.45), cy(0.26), cx(L), cy(0.0)); g.stroke();
        g.strokeStyle = '#e8c050'; g.lineWidth = 1.2; g.stroke();
        g.fillStyle = '#2a160c'; g.fillRect(0, cy(0.12), Wd, 0.22 * 20);
        g.fillStyle = '#e8c050'; g.fillRect(0, cy(0.12), Wd, 1);
        for (const ctx of [g, f.shine()]) { ctx.fillStyle = '#e8c050'; ctx.beginPath(); ctx.arc(cx(0), cy(0.62), 5.5, 0, Math.PI * 2); ctx.fill(); }
        g.fillStyle = '#7a1414'; g.beginPath(); for (let k = 0; k < 5; k++) { const an = k / 5 * Math.PI * 2 - Math.PI / 2; g.lineTo(cx(0) + Math.cos(an) * 4.5, cy(0.62) + Math.sin(an) * 4.5); g.lineTo(cx(0) + Math.cos(an + 0.63) * 1.9, cy(0.62) + Math.sin(an + 0.63) * 1.9); } g.fill();
        g.fillStyle = '#e8c050'; g.beginPath(); g.moveTo(cx(0), cy(rise - 0.08)); g.lineTo(cx(0) - 5, cy(rise - 0.42)); g.quadraticCurveTo(cx(0), cy(rise - 0.3), cx(0) + 5, cy(rise - 0.42)); g.fill();
      });
      cap.t.repeat.set(1 / (2 * L), 1 / (rise + 0.1)); cap.t.offset.set(0.5, 0.1 / (rise + 0.1));
      const capM = K.std({ map: cap.t, roughness: 0.8, emissive: new T.Color('#ffffff'), emissiveMap: cap.glow, emissiveIntensity: 0.8 });
      const roof = new T.ExtrudeGeometry(sh, { depth: z1 - z0 + 1.3, bevelEnabled: false, curveSegments: 16 });
      part(K, roof, [capM, mat(K, '#3a2e2a', { roughness: 0.9 })], sx, RY + 0.26, z0 - 0.65);
      part(K, new T.BoxGeometry(0.22, 0.16, z1 - z0 + 1.4), mat(K, '#2a2220'), sx, RY + 0.26 + rise + 0.04, (z0 + z1) / 2);
      for (const zz of [z0 - 0.7, z1 + 0.7]) part(K, new T.BoxGeometry(0.34, 0.3, 0.12), gold, sx, RY + 0.3 + rise, zz);
      // the valance under the front beam, purple with white crests, a red tassel at each corner
      sheet(K, 220, 12, (f) => {
        const { g } = f;
        g.fillStyle = '#4a2a6a'; g.fillRect(0, 0, 220, 12);
        g.fillStyle = '#e8c050'; g.fillRect(0, 10.5, 220, 1.5);
        for (let i = 10; i < 220; i += 20) { g.fillStyle = '#f4efe0'; g.beginPath(); g.arc(i, 5.5, 3.4, 0, Math.PI * 2); g.fill(); g.fillStyle = '#4a2a6a'; g.beginPath(); g.arc(i, 5.5, 1.6, 0, Math.PI * 2); g.fill(); }
      }, x1 - x0, 0.34, sx, RY - 0.17, z1 + 0.14, { k: 4 });
      for (const px of [x0, x1]) {
        part(K, new T.SphereGeometry(0.07, 10, 8), gold, px, RY - 0.12, z1 + 0.2);
        part(K, new T.CylinderGeometry(0.04, 0.09, 0.5, 10), mat(K, '#c8302a', { roughness: 0.9 }), px, RY - 0.42, z1 + 0.2);
      }
      // the bridge off to the curtain, railed
      part(K, new T.BoxGeometry(3, 0.5, 1.5), [dark, dark, top, dark, dark, dark], ex(K, 1.5), 0.25, ez(K, 1));
      many(K, new T.BoxGeometry(0.07, 0.48, 0.07), cyp, [0.2, 1.0, 1.8, 2.6].flatMap((t) => [[ex(K, t), 0.74, ez(K, 1.7)], [ex(K, t), 0.74, ez(K, 0.3)]]));
      for (const zz of [ez(K, 1.7), ez(K, 0.3)]) part(K, new T.BoxGeometry(3, 0.06, 0.08), cyp, ex(K, 1.5), 0.98, zz);
      sheet(K, 60, 44, (f) => {
        const { g } = f;
        ['#2e7a4a', '#e8c040', '#c83a2a', '#f4efe0', '#6a3a8a'].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 12, 2, 12, 42); });
        g.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 60; i += 3) g.fillRect(i, 2, 0.6, 42);
        g.fillStyle = '#2a160c'; g.fillRect(0, 0, 60, 2.5);
      }, 1.5, 1.95, ex(K, 0) + 0.03, 1.47, ez(K, 1), { ry: Math.PI / 2, k: 4 });
      // the audience's cushions, crimson with gold tassels at their corners
      const seats = [];
      for (const y of [6, 8]) for (const xs of [2, 10]) for (let i = 0; i < 5; i++) seats.push([ex(K, xs + i + 0.5), 0.06, ez(K, y + 0.5), 1, (i % 2) * 0.08 - 0.04]);
      many(K, K.rbox(0.72, 0.12, 0.72, 0.05), mat(K, '#8a2238', { roughness: 0.9 }), seats);
      many(K, new T.SphereGeometry(0.03, 6, 4), gold, seats.flatMap(([sx2, , sz2]) => [[sx2 - 0.33, 0.1, sz2 - 0.33], [sx2 + 0.33, 0.1, sz2 + 0.33]]), { shadow: false });
      // lanterns down both walls and two from the stage's eaves
      const at = [];
      for (const side of [-1, 1]) for (const r of [4.5, 6, 7.5, 9, 10.5]) at.push([side * (C / 2 - 0.38), 2.9, ez(K, r)]);
      for (const px of [x0 - 0.7, x1 + 0.7]) at.push([px, RY - 0.3, z1 + 0.5]);
      chochins(K, at);
      // petals falling over the stage
      const petal = () => { const f = K.fine(8, 8, 8); f.g.fillStyle = '#ffc4d4'; f.g.beginPath(); f.g.ellipse(4, 4, 3.2, 1.7, 0.5, 0, Math.PI * 2); f.g.fill(); f.g.fillStyle = '#fff0f4'; f.g.beginPath(); f.g.ellipse(3.2, 3.4, 1.2, 0.6, 0.5, 0, Math.PI * 2); f.g.fill(); return f.c; };
      const art = petal();
      drift(K, () => art, 16, (p, t, u) => p.set(x0 + ((u.i * 0.37) % 1) * (x1 - x0) + Math.sin(t * 9 + u.seed) * 0.35, 3.3 - t * 2.7, z0 + ((u.i * 0.61) % 1) * (z1 - z0 + 0.4)), { size: 0.13, period: 9, spin: 8 });
      lamp(K, '#ffd8a0', NIGHT(K.time) ? 2.4 : 1.6, 9, sx, 2.7, ez(K, 3.4));
    },
  },

  /* CINDER SPRINGS' BATHHOUSE: a sento. The great hinoki tub under a tiled mural of the volcano that heats it, a
     rust-red hot spring in lava rock in the corner, washing stations (stool, bucket, mirror, taps) along both walls,
     a low screen with the indigo ゆ noren to the changing room: wooden lockers, the counter, the milk fridge, the
     massage chairs and a ping-pong table, as every onsen has. */
  bath: {
    town: 'wastes',
    shotTop: 4.6,
    mood: { hemi: ['#fff0e2', '#7a6a60', 1.6], sun: ['#ffe2c4', 1.75], bloom: 1.0 },
    beat: 2600,
    castAt: [[4.6, 1.2, -0.22], [7.1, 2.4, -0.22], [9.5, 1.1, -0.22], [11.9, 2.3, -0.22], [15.0, 0.9, -0.2]],
    floor(K, f, W, H, T) {
      const { g } = f;
      K.planks(f, W, H, T, ['#c8a274', '#b48c60']);
      for (let y = 0; y < 7 * T; y += 4) for (let x = 0; x < W; x += 4) { g.fillStyle = (x + y) % 8 ? '#e8f0f4' : '#bcd6e6'; g.fillRect(x, y, 4, 4); }
      g.fillStyle = 'rgba(80,110,130,0.35)'; for (let x = 0; x < W; x += 4) g.fillRect(x, 0, 0.3, 7 * T); for (let y = 0; y < 7 * T; y += 4) g.fillRect(0, y, W, 0.3);
      g.fillStyle = '#7ab0d0'; g.fillRect(0, 4 * T + 1, W, 1.4);
      g.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 18; i++) { g.beginPath(); g.ellipse((i * 47) % W, 4.6 * T + (i * 29) % (2 * T), 6, 2.4, 0, 0, Math.PI * 2); g.fill(); }
      // the changing room's woven mat
      g.fillStyle = '#c8b480'; g.fillRect(3 * T, 7.5 * T, 9 * T, 3 * T);
      g.fillStyle = 'rgba(120,90,40,0.35)'; for (let x = 3 * T; x < 12 * T; x += 2) g.fillRect(x, 7.5 * T, 0.5, 3 * T);
      g.fillStyle = '#5a3a20'; g.fillRect(3 * T, 7.5 * T, 9 * T, 1); g.fillRect(3 * T, 10.5 * T - 1, 9 * T, 1);
    },
    paint(K, f, w, { back, left, x, s }) {
      const { g, lin } = f;
      g.fillStyle = lin(0, 0, 0, wy(4.6), ['#3a2a20', '#5a4232']); g.fillRect(0, 0, w, TOP * U);
      const tiles = (x0, wd, y0, y1) => { for (let yy = y0; yy < y1; yy += 4) for (let xx = x0; xx < x0 + wd; xx += 4) { g.fillStyle = ((xx - x0) + yy) % 8 ? '#eef4f6' : '#c8dcea'; g.fillRect(xx, yy, 4, 4); } g.fillStyle = 'rgba(80,110,130,0.3)'; for (let xx = x0; xx < x0 + wd; xx += 4) g.fillRect(xx, y0, 0.3, y1 - y0); for (let yy = y0; yy < y1; yy += 4) g.fillRect(x0, yy, wd, 0.3); };
      if (back) {
        tiles(0, w, wy(0.85), wy(0));
        g.fillStyle = '#5a3a24'; g.fillRect(x(0.4) - 3, wy(4.55) - 3, x(16.6) - x(0.4) + 6, wy(0.85) - wy(4.55) + 6);
        volcanoMural(f, s, x(0.4), x(16.6), wy(4.55), wy(0.85));
        g.fillStyle = '#e8c070'; g.fillRect(x(0.4) - 1, wy(4.55) - 1, x(16.6) - x(0.4) + 2, 0.8); g.fillRect(x(0.4) - 1, wy(0.85), x(16.6) - x(0.4) + 2, 0.8);
        for (let t = 1; t < 17; t += 3) { const sky = skyCols(K.time); g.fillStyle = lin(0, wy(5.8), 0, wy(4.9), sky); g.fillRect(x(t), wy(5.8), 2 * U, wy(4.9) - wy(5.8)); s.fillStyle = 'rgba(255,240,220,0.35)'; s.fillRect(x(t), wy(5.8), 2 * U, wy(4.9) - wy(5.8)); g.strokeStyle = '#3a2416'; g.lineWidth = 1.2; g.strokeRect(x(t), wy(5.8), 2 * U, wy(4.9) - wy(5.8)); g.beginPath(); g.moveTo(x(t + 1), wy(5.8)); g.lineTo(x(t + 1), wy(4.9)); g.stroke(); }
      } else {
        const [a, wd] = span(x, 0, 6.6);
        tiles(a, wd, wy(2.3), wy(0));
        g.fillStyle = '#7ab0d0'; g.fillRect(a, wy(2.3), wd, 1.6);
        g.fillStyle = '#e8dcc4'; g.fillRect(a, wy(4.6), wd, wy(2.3) - wy(4.6));
        const [b0, bw] = span(x, 6.6, R);
        g.fillStyle = lin(0, wy(4.6), 0, wy(0), ['#d8c0a0', '#c8a880']); g.fillRect(b0, wy(4.6), bw, wy(0) - wy(4.6));
        g.fillStyle = '#7a5434'; for (let r = 7; r <= R; r++) g.fillRect(x(r) - 1, wy(4.6), 2, wy(0) - wy(4.6));
        g.fillStyle = lin(0, wy(1), 0, wy(0), ['#8a6040', '#6a4428']); g.fillRect(b0, wy(1), bw, U);
        g.fillStyle = '#4a3020'; g.fillRect(0, wy(4.7), w, 4); g.fillRect(0, wy(1) - 1, w, 2);
        if (!left) {   // over the counter: the price board
          const [p0, pw] = span(x, 8.6, 11.4);
          g.fillStyle = '#3a2416'; g.fillRect(p0 - 2, wy(3.7) - 2, pw + 4, wy(2.3) - wy(3.7) + 4);
          g.fillStyle = '#f4ecd8'; g.fillRect(p0, wy(3.7), pw, wy(2.3) - wy(3.7));
          text(g, 'BATH', p0 + pw * 0.3, wy(3.35), 7, '#2a3a6a'); text(g, '₽450', p0 + pw * 0.72, wy(3.35), 7, '#c83a2a');
          text(g, 'MILK', p0 + pw * 0.3, wy(2.72), 7, '#2a3a6a'); text(g, '₽120', p0 + pw * 0.72, wy(2.72), 7, '#c83a2a');
        }
      }
    },
    furnish: [['shishiodoshi', 14, 3],
      ['bathstool', 0, 0], ['bathstool', 0, 1], ['bathstool', 0, 2], ['bathstool', 0, 3], ['bathstool', 0, 4],
      ['bathstool', 16, 3], ['bathstool', 16, 4], ['bathstool', 16, 5],
      ['scale', 3, 7], ['bench', 1, 9], ['fan', 2, 11], ['getarack', 5, 11], ['umbrellas', 11, 11],
      ['pingpong', 9, 8], ['yukatarack', 13, 7], ['towelbasket', 14, 7], ['milkfridge', 16, 7], ['massagechair', 16, 8], ['massagechair', 16, 9],
      ['counter', 14, 10], ['register', 15, 10, { y: 0.62, scale: 0.72, free: true }], ['luckycat', 14, 10, { y: 0.62, scale: 0.6, free: true }],
      ['bathmat', 7, 7, { free: true }]],
    hang: [['onsensign', 0, { side: 'l', row: 8, y: 1.4 }]],
    blocks: [[3, 0, 11, 4], [14, 0, 3, 3], [2, 0, 1, 1], [0, 6, 7, 1], [10, 6, 7, 1], [0, 7, 1, 4]],
    props(K) {
      const T = K.THREE, r = K.seeded(41);
      const boards = paint(K, 32, 16, (f) => { const { g, lin } = f; for (let i = 0; i < 32; i += 4) { g.fillStyle = lin(i, 0, i + 4, 0, ['#e0c494', '#d4b484', '#c8a878']); g.fillRect(i, 0, 4, 16); g.fillStyle = 'rgba(90,60,30,0.3)'; g.fillRect(i, 0, 0.4, 16); } }).t;
      boards.wrapS = boards.wrapT = T.RepeatWrapping; boards.repeat.set(3, 1);
      const hin = K.std({ map: boards, roughness: 0.55 }), rim = mat(K, '#e8cc9c', { roughness: 0.45 }), dark = mat(K, '#4a3020', { roughness: 0.8 });
      // the great tub against the mural
      const px0 = ex(K, 3), px1 = ex(K, 14), pz0 = ez(K, 0), pz1 = ez(K, 4), mx = (px0 + px1) / 2, mz = (pz0 + pz1) / 2, PH = 0.55;
      part(K, new T.BoxGeometry(px1 - px0, PH, 0.22), hin, mx, PH / 2, pz1 - 0.11);
      for (const xx of [px0 + 0.11, px1 - 0.11]) part(K, new T.BoxGeometry(0.22, PH, pz1 - pz0), hin, xx, PH / 2, mz);
      part(K, new T.BoxGeometry(px1 - px0 + 0.1, 0.07, 0.3), rim, mx, PH + 0.035, pz1 - 0.11);
      for (const xx of [px0 + 0.11, px1 - 0.11]) part(K, new T.BoxGeometry(0.3, 0.07, pz1 - pz0), rim, xx, PH + 0.035, mz);
      water(K, px1 - px0 - 0.44, pz1 - pz0 - 0.3, mx, 0.46, mz - 0.04, ['#2e7aa8', '#5ab4d4', '#e0fbff'], { op: 0.78 });
      part(K, new T.BoxGeometry(1.2, 0.22, 0.34), hin, mx, 0.11, pz1 + 0.17);
      // the hot spring in the corner: lava rock round rust-red water, a sign on a stake
      const hx = ex(K, 15.5), hz = ez(K, 1.5), rocks = [];
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; rocks.push([hx + Math.cos(a) * 1.22, 0.12, hz + Math.sin(a) * 1.18, 0.3 + r() * 0.14, a, ['#4a3a38', '#5a4844', '#3a2e2c'][i % 3], 0.22 + r() * 0.1]); }
      many(K, new T.DodecahedronGeometry(1, 0), K.std({ color: '#ffffff', roughness: 1, flatShading: true }), rocks);
      water(K, 2.2, 2.2, hx, 0.3, hz, ['#7a3a18', '#b86434', '#f8c890'], { disc: true, op: 0.88, glow: 0.4 });
      part(K, new T.BoxGeometry(0.06, 0.9, 0.06), dark, hx - 0.85, 0.45, hz + 1.05);
      sheet(K, 40, 20, (f) => { const { g } = f; g.fillStyle = '#e8d4a8'; g.fillRect(0, 0, 40, 20); g.strokeStyle = '#5a3a20'; g.lineWidth = 1.4; g.strokeRect(1, 1, 38, 18); text(g, 'HOT 46°', 20, 10.5, 8, '#c8301e'); }, 0.62, 0.31, hx - 0.85, 0.95, hz + 1.09, { k: 4 });
      K.puffs([[mx - 3.5, 0.5, mz], [mx - 1, 0.5, mz + 0.6], [mx + 1.5, 0.5, mz - 0.5], [mx + 3.8, 0.5, mz + 0.4], [hx, 0.35, hz], [hx + 0.3, 0.35, hz - 0.4]], { col: 'rgba(255,255,255,0.7)', n: 3, size: 0.9, rise: 2.0, speed: 0.13 });
      // washing stations: a mirror, two taps, a shower head and a shelf of bottles over each stool
      const st = [...[0, 1, 2, 3, 4].map((y) => [-1, y]), ...[3, 4, 5].map((y) => [1, y])], mir = [], frames = [], taps = [], heads = [], shelves = [], bottles = [];
      for (const [side, y] of st) {
        const wx = side * (C / 2 - 0.03), z = ez(K, y + 0.5), ry = side < 0 ? Math.PI / 2 : -Math.PI / 2, i = -side;
        mir.push([wx + i * 0.01, 1.25, z, 1, ry]); frames.push([wx, 1.25, z, 1, ry]);
        taps.push([wx + i * 0.06, 0.6, z - 0.12, 1, 0, '#d83a2a'], [wx + i * 0.06, 0.6, z + 0.12, 1, 0, '#3a6ad8']);
        heads.push([wx + i * 0.1, 1.82, z, 1, 0, null, 1, 0, i * 0.6]);
        shelves.push([wx + i * 0.08, 0.86, z, 1, ry]);
        for (let k = 0; k < 3; k++) bottles.push([wx + i * 0.09, 0.95, z - 0.18 + k * 0.17, 1, 0, ['#f8f0f0', '#f0a8c0', '#88c8e8'][k]]);
      }
      many(K, new T.PlaneGeometry(0.6, 0.48), K.std({ color: '#d8e6ee', metalness: 0.7, roughness: 0.12, emissive: new T.Color('#405060'), emissiveIntensity: 0.4 }), mir, { shadow: false });
      many(K, new T.BoxGeometry(0.66, 0.54, 0.02), dark, frames, { shadow: false });
      many(K, new T.SphereGeometry(0.045, 10, 8), K.std({ color: '#ffffff', roughness: 0.3 }), taps, { shadow: false });
      many(K, new T.CylinderGeometry(0.07, 0.05, 0.06, 12), mat(K, '#c0c8cc', { metalness: 0.8, roughness: 0.25 }), heads, { shadow: false });
      many(K, new T.BoxGeometry(0.62, 0.03, 0.14), mat(K, '#e8e8e4', { roughness: 0.4 }), shelves, { shadow: false });
      many(K, new T.CylinderGeometry(0.03, 0.03, 0.14, 8), K.std({ color: '#ffffff', roughness: 0.35 }), bottles, { shadow: false });
      // a wooden bucket by each stool and a pyramid of them by the tub (the catalogue's is too fine to have nine of)
      const pails = st.map(([side, y]) => [side * (C / 2 - 0.42), 0.1, ez(K, y + 0.5) + 0.3]);
      for (const [i, n] of [[0, 3], [1, 2], [2, 1]]) for (let k = 0; k < n; k++) pails.push([ex(K, 2.5) + (k - (n - 1) / 2) * 0.31, 0.1 + i * 0.21, ez(K, 0.5)]);
      many(K, new T.CylinderGeometry(0.15, 0.125, 0.2, 14), mat(K, '#d8b480', { roughness: 0.6 }), pails);
      many(K, new T.CylinderGeometry(0.152, 0.15, 0.025, 14), mat(K, '#5a4a3a', { metalness: 0.4, roughness: 0.5 }), pails.flatMap(([x, y, z]) => [[x, y + 0.06, z], [x, y - 0.05, z, 0.88]]), { shadow: false });
      // the screen to the changing room and the noren in its doorway
      for (const [a, b] of [[0, 7], [10, 17]]) {
        part(K, new T.BoxGeometry(b - a, 0.9, 0.16), hin, ex(K, (a + b) / 2), 0.45, ez(K, 6.5));
        part(K, new T.BoxGeometry(b - a + 0.04, 0.06, 0.24), dark, ex(K, (a + b) / 2), 0.93, ez(K, 6.5));
      }
      many(K, new T.BoxGeometry(0.1, 0.92, 0.2), dark, [1.75, 3.5, 5.25, 11.75, 13.5, 15.25].map((t) => [ex(K, t), 0.46, ez(K, 6.5)]));
      for (const t of [7.08, 9.92]) part(K, new T.BoxGeometry(0.16, 2.5, 0.2), dark, ex(K, t), 1.25, ez(K, 6.5));
      part(K, new T.BoxGeometry(3.1, 0.18, 0.22), dark, ex(K, 8.5), 2.45, ez(K, 6.5));
      sheet(K, 120, 36, (f) => {
        const { g } = f;
        for (let i = 0; i < 3; i++) { g.fillStyle = '#243a6a'; g.fillRect(i * 40 + 1, 0, 38, 36); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(i * 40 + 1, 0, 38, 2); }
        g.fillStyle = '#f4efe0'; g.font = BOLD(22); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ゆ', 60, 18);
      }, 2.7, 0.82, ex(K, 8.5), 1.95, ez(K, 6.5) + 0.12, { k: 4 });
      // the lockers: wooden doors, brass numbers, three left open
      const lockers = paint(K, 80, 40, (f) => {
        const { g } = f;
        g.fillStyle = '#5a3a20'; g.fillRect(0, 0, 80, 40);
        for (let row = 0; row < 4; row++) for (let col = 0; col < 8; col++) {
          const n = row * 8 + col + 1, open = n === 6 || n === 19 || n === 27, dx = col * 10 + 0.8, dy = row * 10 + 0.8;
          g.fillStyle = open ? '#1a0e06' : (col + row) % 2 ? '#b48a58' : '#a87e4c'; g.fillRect(dx, dy, 8.4, 8.4);
          if (open) continue;
          g.fillStyle = '#e8c860'; g.fillRect(dx + 2.2, dy + 1.2, 4, 2.4);
          g.fillStyle = '#3a2410'; g.font = BOLD(2.4); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), dx + 4.2, dy + 2.5);
          g.fillStyle = '#2a1a0a'; g.beginPath(); g.arc(dx + 4.2, dy + 6, 0.7, 0, Math.PI * 2); g.fill();
        }
      });
      const lm = K.std({ map: lockers.t, roughness: 0.7 }), lw = mat(K, '#6a4428', { roughness: 0.8 });
      part(K, new T.BoxGeometry(0.85, 2.0, 4), [lm, lw, lw, lw, lw, lw], ex(K, 0) + 0.43, 1.0, ez(K, 9));
      lamp(K, '#ffd8b0', 1.3, 10, mx, 3.2, mz + 1.2);
    },
  },

  /* DRIFTWOOD LANDING'S AQUARIUM: one tank the width of the hall, fish crossing it, kelp swaying, light coming down
     through the water and bubbles going up, Mantine gliding in it; Lapras in the round pool in the middle; Corsola's
     rock pool ("please don't touch"); Chinchou and Lanturn blinking in their dark one; two columns of jellyfish; the
     sea's light rippling over the floor. */
  aquarium: {
    town: 'ruins',
    shotTop: 5.0,
    mood: { hemi: ['#b8dcff', '#1a2a40', 1.15], sun: ['#c8e8ff', 1.15], bloom: 1.15 },
    beat: 2600,
    castAt: [[8, 5.5, -0.22, 1.0], [5.8, 0.6, 1.5, 0.95], [2.1, 5.2, -0.04, 0.85], [13.8, 4.7, -0.12, 0.8], [14.9, 5.5, -0.15, 0.85]],
    edge: '#101c28', cap: '#14202c', bg: '#060c14',
    floor(K, f, W, H, T) {
      const { g } = f, s = f.shine(), r = K.seeded(7);
      for (let y = 0; y < H; y += T) for (let x = 0; x < W; x += T) { g.fillStyle = ['#2a3a48', '#26364a', '#30404e'][Math.floor(r() * 3)]; g.fillRect(x + 0.3, y + 0.3, T - 0.6, T - 0.6); }
      g.fillStyle = '#18222c'; for (let x = 0; x < W; x += T) g.fillRect(x - 0.3, 0, 0.6, H); for (let y = 0; y < H; y += T) g.fillRect(0, y - 0.3, W, 0.6);
      const cx = 8.5 * T, cy = 6 * T;
      for (const [rad, col] of [[3.0, '#1e5a7a'], [2.8, '#e8f4f0'], [2.62, '#2a7a9a']]) { g.fillStyle = col; g.beginPath(); g.arc(cx, cy, rad * T, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#e8f4f0';
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * 2.42 * T, cy + Math.sin(a) * 2.42 * T, 2.4, Math.PI + a, a); g.fill(); }
      for (let i = 0; i < 70; i++) { s.fillStyle = 'rgba(120,220,255,0.5)'; s.fillRect(r() * W, r() * H, 0.6, 0.6); }
      g.fillStyle = '#c8a870'; g.fillRect(0, 0, W, 1.8 * T);
    },
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f;
      g.fillStyle = lin(0, 0, 0, wy(0), ['#08141e', '#102434', '#16304a']); g.fillRect(0, 0, w, TOP * U);
      g.fillStyle = lin(0, wy(0.9), 0, wy(0), ['#1a2632', '#121c26']); g.fillRect(0, wy(0.9), w, 0.9 * U);
      if (back) {
        tankPainting(f, s, x(1), x(16), wy(4.5), wy(0.4));
      } else {
        for (let i = 0; i < w; i += 8) for (const [y, c] of [[wy(3.5), '#2a8aa8'], [wy(3.35), '#e8f8f8']]) { g.fillStyle = c; g.beginPath(); g.arc(i + 4, y, 4, Math.PI, 0); g.fill(); }
        g.fillStyle = '#16304a'; g.fillRect(0, wy(3.35), w, 3);
        for (const row of [3.5, 7, 10.5]) {
          const cx = x(row), cy = wy(2.2);
          g.fillStyle = '#b08a4a'; g.beginPath(); g.arc(cx, cy, 13, 0, Math.PI * 2); g.fill();
          for (const c of [g, s]) { c.fillStyle = lin(0, cy - 11, 0, cy + 11, ['#3ab0e0', '#0c4a88']); c.beginPath(); c.arc(cx, cy, 11, 0, Math.PI * 2); c.fill(); }
          g.fillStyle = 'rgba(8,30,60,0.7)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(cx - 6 + k * 4, cy - 3 + (k % 2) * 6, 2.2, 1, 0, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = '#e8c870'; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, 0.9, 0, Math.PI * 2); g.fill(); }
        }
      }
    },
    furnish: [['tablecoral', 3, 0, { free: true, y: 0.6 }], ['braincoral', 6, 1, { free: true, y: 0.6, scale: 0.9 }], ['fancoral', 10, 0, { free: true, y: 0.6 }], ['tubecoral', 13, 1, { free: true, y: 0.6 }], ['stagcoral', 15, 0, { free: true, y: 0.6, scale: 0.9 }],
      ['bubblecolumn', 0, 0], ['bubblecolumn', 16, 0], ['bench', 4, 3, { turn: Math.PI }], ['bench', 11, 3, { turn: Math.PI }],
      ['braincoral', 1, 4, { free: true, scale: 0.45, y: 0.05 }], ['anemone', 3, 6, { free: true, scale: 0.5, y: 0.05 }], ['fancoral', 1, 6, { free: true, scale: 0.45, y: 0.05 }],
      ['aquarium', 0, 10], ['aquarium', 15, 10], ['divinghelmet', 0, 11], ['seahorse', 16, 11], ['jellylamp', 0, 6], ['jellylamp', 16, 6]],
    hang: [['lifering', 0, { side: 'l', row: 9, y: 1.4 }], ['shipwheel', 0, { side: 'r', row: 9, y: 1.3 }]],
    blocks: [[1, 0, 15, 2], ...round(8.5, 6, 2.3), [1, 4, 3, 3], [13, 4, 3, 3], [0, 8, 1, 1], [16, 8, 1, 1]],
    props(K) {
      const T = K.THREE, r = K.seeded(23), stone = mat(K, '#2a3a4a', { roughness: 0.75 }), brass = mat(K, '#c8a050', { metalness: 0.8, roughness: 0.3 });
      // the great tank: a stone plinth, sand, a brass-trimmed frame, the name over it and the glass in front
      const tx0 = ex(K, 1), tx1 = ex(K, 16), tz0 = ez(K, 0), tz1 = ez(K, 1.6), tcx = (tx0 + tx1) / 2, G0 = 0.45, G1 = 4.5;
      part(K, new T.BoxGeometry(tx1 - tx0 + 0.3, G0, 1.75), stone, tcx, G0 / 2, tz0 + 0.875);
      part(K, new T.BoxGeometry(tx1 - tx0, 0.16, 1.55), mat(K, '#d8c088', { roughness: 1 }), tcx, G0 + 0.08, (tz0 + tz1) / 2);
      for (const xx of [tx0 - 0.1, tx1 + 0.1]) part(K, new T.BoxGeometry(0.34, G1 + 0.62, 0.5), stone, xx, (G1 + 0.62) / 2, tz1);
      part(K, new T.BoxGeometry(tx1 - tx0 + 0.6, 0.6, 0.5), stone, tcx, G1 + 0.3, tz1);
      for (const yy of [G0, G1]) part(K, new T.BoxGeometry(tx1 - tx0 + 0.04, 0.05, 0.08), brass, tcx, yy, tz1 + 0.22);
      sheet(K, 200, 18, (f) => {
        const { g, lin } = f, gl = f.shine();
        g.fillStyle = lin(0, 0, 0, 18, ['#1a4a5a', '#0e3040']); g.fillRect(0, 0, 200, 18);
        for (let i = 0; i < 200; i += 10) { g.strokeStyle = 'rgba(160,230,240,0.35)'; g.lineWidth = 0.6; g.beginPath(); g.arc(i + 5, 18, 5, Math.PI, 0); g.stroke(); }
        for (const c of [g, gl]) text(c, 'LAGOON  AQUARIUM', 100, 9.5, 10, '#f0d080');
      }, 6.4, 0.58, tcx, G1 + 0.3, tz1 + 0.26, { k: 4, glow: 0.7 });
      const glass = paint(K, 64, 32, (f) => {
        const { g } = f;
        g.fillStyle = 'rgba(120,220,255,0.06)'; g.fillRect(0, 0, 64, 32);
        g.fillStyle = 'rgba(255,255,255,0.14)';
        for (const [x0, w] of [[6, 3], [11, 1], [30, 4], [37, 1.2], [52, 2.5]]) { g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + w, 0); g.lineTo(x0 + w - 10, 32); g.lineTo(x0 - 10, 32); g.fill(); }
      });
      const gm = new T.MeshBasicMaterial({ map: glass.t, transparent: true, depthWrite: false, toneMapped: false });
      const gp = part(K, new T.PlaneGeometry(tx1 - tx0, G1 - G0), gm, tcx, (G0 + G1) / 2, tz1); gp.castShadow = gp.receiveShadow = false;
      const rocks = [];
      for (let i = 0; i < 12; i++) rocks.push([tx0 + 0.6 + r() * (tx1 - tx0 - 1.2), G0 + 0.12, tz0 + 0.3 + r() * 1.0, 0.18 + r() * 0.26, r() * 6, ['#4a5a6a', '#6a6050', '#3a4a5a'][i % 3], 0.14 + r() * 0.16]);
      many(K, new T.DodecahedronGeometry(1, 0), K.std({ color: '#ffffff', roughness: 1, flatShading: true }), rocks);
      // kelp swaying in the tank
      const kelpArt = paint(K, 12, 64, (f) => { const { g } = f; g.fillStyle = '#2e7a3a'; g.beginPath(); g.moveTo(6, 64); for (let y = 64; y > 0; y -= 4) g.quadraticCurveTo(6 + Math.sin(y / 6) * 5, y - 2, 6 + Math.sin(y / 8) * 2, y - 4); for (let y = 0; y < 64; y += 4) g.lineTo(6 + Math.sin(y / 8) * 2 + 2.4, y); g.fill(); g.fillStyle = '#5aa84a'; for (let y = 6; y < 60; y += 7) { g.beginPath(); g.ellipse(6 + Math.sin(y / 8) * 2 + (y % 14 ? 3 : -2), y, 2.6, 1.2, y % 14 ? 0.6 : -0.6, 0, Math.PI * 2); g.fill(); } }).t;
      const km = K.std({ map: kelpArt, transparent: true, alphaTest: 0.4, side: T.DoubleSide, roughness: 0.9, emissive: new T.Color('#1a5a2a'), emissiveIntensity: 0.4 });
      const kgeo = new T.PlaneGeometry(0.36, 2.6); kgeo.translate(0, 1.3, 0);
      const kelp = [1.6, 2.4, 4.6, 7.4, 8.1, 11.6, 12.4, 14.4, 15.4].map((t, i) => { const o = part(K, kgeo, km, ex(K, t), G0 + 0.12, tz0 + 0.25 + (i % 3) * 0.3); o.scale.y = 0.8 + (i % 4) * 0.22; o.castShadow = false; o.userData.ph = i * 1.7; return o; });
      // fish, four kinds, crossing back and forth at their own depths and speeds
      const kinds = [['#f88a30', '#f8d048', '#ffffff'], ['#3a74e0', '#f8e048', '#1a2a6a'], ['#f8e048', '#f8a828', null], ['#e8505a', '#f8a0a0', '#ffd8d8']].map(([body, fin, stripe]) => {
        const { t } = paint(K, 32, 16, (f) => {
          const { g } = f;
          g.fillStyle = fin; g.beginPath(); g.moveTo(9, 8); g.lineTo(1, 2); g.lineTo(3, 8); g.lineTo(1, 14); g.fill();
          g.beginPath(); g.moveTo(12, 4); g.quadraticCurveTo(17, -1, 22, 4); g.fill();
          g.fillStyle = body; g.beginPath(); g.ellipse(17, 8, 11, 5.4, 0, 0, Math.PI * 2); g.fill();
          if (stripe) { g.save(); g.beginPath(); g.ellipse(17, 8, 11, 5.4, 0, 0, Math.PI * 2); g.clip(); g.fillStyle = stripe; g.fillRect(13, 0, 2.2, 16); g.fillRect(20, 0, 1.8, 16); g.restore(); }
          g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(18, 6, 6, 1.6, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#ffffff'; g.beginPath(); g.arc(23.5, 6.8, 1.6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#101010'; g.beginPath(); g.arc(24, 6.8, 0.9, 0, Math.PI * 2); g.fill();
        });
        return K.std({ map: t, transparent: true, alphaTest: 0.4, side: T.DoubleSide, roughness: 0.6, emissive: new T.Color('#ffffff'), emissiveMap: t, emissiveIntensity: 0.35 });
      });
      const fgeo = new T.PlaneGeometry(1, 0.5), fish = [];
      for (let i = 0; i < 18; i++) {
        const o = part(K, fgeo, kinds[i % 4], 0, 0, 0); o.castShadow = false;
        o.userData = { k: 0.38 + (i % 4) * 0.08 + r() * 0.1, y: G0 + 0.6 + r() * 3.2, z: tz0 + 0.3 + r() * 1.1, sp: 0.025 + r() * 0.035, ph: r() * 2, bob: r() * 6 };
        fish.push(o);
      }
      const school = paint(K, 48, 24, (f) => { const { g } = f; const rr2 = K.seeded(5); for (let i = 0; i < 40; i++) { const x = 4 + rr2() * 40, y = 4 + rr2() * 16; g.fillStyle = 'rgba(220,240,255,0.9)'; g.beginPath(); g.ellipse(x, y, 1.4, 0.5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(x - 1.3, y); g.lineTo(x - 2.2, y - 0.6); g.lineTo(x - 2.2, y + 0.6); g.fill(); } }).t;
      const sm = new T.MeshBasicMaterial({ map: school, transparent: true, depthWrite: false, opacity: 0.85, side: T.DoubleSide });
      const schools = [0, 1].map((i) => { const o = part(K, new T.PlaneGeometry(2.2, 1.1), sm, 0, 0, 0); o.castShadow = false; o.userData = { y: 2.4 + i * 1.2, z: tz0 + 0.5 + i * 0.6, ph: i * 0.9 }; return o; });
      const swim = (now) => {
        const t = now / 1000;
        for (const o of fish) {
          const u = o.userData, p = (t * u.sp + u.ph) % 2, k = p < 1 ? p : 2 - p;
          o.position.set(tx0 + 0.6 + k * (tx1 - tx0 - 1.2), u.y + Math.sin(t * 1.3 + u.bob) * 0.12, u.z);
          o.scale.set((p < 1 ? 1 : -1) * u.k, u.k, 1);
        }
        for (const o of schools) { const u = o.userData, p = (t * 0.012 + u.ph) % 2, k = p < 1 ? p : 2 - p; o.position.set(tx0 + 1.5 + k * (tx1 - tx0 - 3), u.y + Math.sin(t * 0.6 + u.ph) * 0.25, u.z); o.scale.x = p < 1 ? 1 : -1; }
        for (const o of kelp) o.rotation.z = Math.sin(t * 0.8 + o.userData.ph) * 0.09;
      };
      swim(0);
      K.B.ticks.push((now) => { if (!K.calm()) swim(now); });
      // light down through the water, bubbles up it
      const shaft = paint(K, 16, 64, (f) => { const { g } = f, l = g.createLinearGradient(0, 0, 0, 64); l.addColorStop(0, 'rgba(220,250,255,0.9)'); l.addColorStop(1, 'rgba(220,250,255,0)'); g.fillStyle = l; g.fillRect(0, 0, 16, 64); g.globalCompositeOperation = 'destination-out'; const e = g.createLinearGradient(0, 0, 16, 0); e.addColorStop(0, '#000'); e.addColorStop(0.35, 'rgba(0,0,0,0)'); e.addColorStop(0.65, 'rgba(0,0,0,0)'); e.addColorStop(1, '#000'); g.fillStyle = e; g.fillRect(0, 0, 16, 64); }).t;
      const shafts = [2.5, 6.5, 10, 13.5].map((t, i) => {
        const m = new T.MeshBasicMaterial({ map: shaft, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0.35, toneMapped: false });
        const o = part(K, new T.PlaneGeometry(1.4, G1 - G0), m, ex(K, t), (G0 + G1) / 2, tz0 + 0.4 + (i % 2) * 0.4); o.rotation.z = -0.22; o.castShadow = false; o.userData.ph = i * 2.1; return o;
      });
      K.B.ticks.push((now) => { if (!K.calm()) for (const o of shafts) o.material.opacity = 0.26 + Math.sin(now / 1700 + o.userData.ph) * 0.12; });
      const bub = dotArt(K, 'rgba(220,250,255,0.9)', true);
      drift(K, () => bub, 16, (p, t, u) => p.set(ex(K, [3.2, 8.6, 13.8][u.i % 3]) + Math.sin(t * 12 + u.seed) * 0.08, G0 + 0.3 + t * (G1 - G0 - 0.5), tz0 + 0.6 + (u.i % 2) * 0.4), { size: 0.12, period: 5 });
      // Lapras's round pool, a mosaic ring round it on the floor
      const lx = ex(K, 8.5), lz = ez(K, 6), R0 = 2.15, R1 = 1.9, pale = mat(K, '#d8e4e8', { roughness: 0.4 });
      part(K, new T.CylinderGeometry(R0, R0 + 0.05, 0.55, 56, 1, true), stone, lx, 0.275, lz);
      const ring = part(K, new T.RingGeometry(R1, R0 + 0.06, 56), pale, lx, 0.553, lz); ring.rotation.x = -Math.PI / 2;
      part(K, new T.CylinderGeometry(R1, R1, 0.55, 56, 1, true), K.std({ color: '#3a8ab0', roughness: 0.4, side: T.BackSide }), lx, 0.275, lz);
      water(K, 2 * R1, 2 * R1, lx, 0.47, lz, ['#0e4a7a', '#2a8ac0', '#c8f4ff'], { disc: true, op: 0.72, glow: 0.4 });
      // Corsola's rock pool and its sign
      const cx = ex(K, 2.5), cz = ez(K, 5.5), cr = [];
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; cr.push([cx + Math.cos(a) * 1.3, 0.1, cz + Math.sin(a) * 1.28, 0.22 + r() * 0.12, a, ['#6a6050', '#7a7060', '#5a5244'][i % 3], 0.2 + r() * 0.1]); }
      many(K, new T.DodecahedronGeometry(1, 0), K.std({ color: '#ffffff', roughness: 1, flatShading: true }), cr);
      water(K, 2.4, 2.4, cx, 0.17, cz, ['#2a8a9a', '#6ad0c8', '#e8fff8'], { disc: true, op: 0.62, glow: 0.3 });
      part(K, new T.BoxGeometry(0.05, 0.7, 0.05), mat(K, '#6a4a2a'), ex(K, 3.7), 0.35, ez(K, 6.85));
      sheet(K, 48, 20, (f) => { const { g } = f; g.fillStyle = '#f4ecd0'; g.fillRect(0, 0, 48, 20); g.strokeStyle = '#2a6a7a'; g.lineWidth = 1.4; g.strokeRect(1, 1, 46, 18); text(g, 'PLEASE', 24, 6.6, 6, '#2a4a5a'); text(g, "DON'T TOUCH", 24, 13.6, 6, '#c8302a'); }, 0.6, 0.25, ex(K, 3.7), 0.78, ez(K, 6.85) + 0.04, { k: 4 });
      // the dark pool, and Chinchou's and Lanturn's lights
      const dx = ex(K, 14.5), dz = ez(K, 5.5);
      for (const [w, d, ox, oz] of [[3, 0.2, 0, 1.4], [3, 0.2, 0, -1.4], [0.2, 2.6, 1.4, 0], [0.2, 2.6, -1.4, 0]]) part(K, new T.BoxGeometry(w, 0.42, d), stone, dx + ox, 0.21, dz + oz);
      water(K, 2.6, 2.6, dx, 0.34, dz, ['#040c20', '#0c2448', '#3a6aa8'], { op: 0.92, glow: 0.2 });
      sheet(K, 48, 14, (f) => { const { g } = f; g.fillStyle = '#10202e'; g.fillRect(0, 0, 48, 14); g.strokeStyle = '#e8c870'; g.lineWidth = 0.8; g.strokeRect(1, 1, 46, 12); text(g, 'LIGHTS LOW', 24, 7.5, 6, '#e8d898'); }, 0.75, 0.22, dx, 0.32, dz + 1.52, { k: 4 });
      const glowA = K.sprite(K.haloArt('#fff4a0'), 0.7), glowB = K.sprite(K.haloArt('#a0f0ff'), 0.9);
      for (const [sp, x2, y2, z2] of [[glowA, 13.8, 0.95, 4.7], [glowB, 14.9, 1.2, 5.5]]) { sp.visible = true; sp.material.blending = T.AdditiveBlending; sp.position.set(ex(K, x2 + 0.5) - 0.2, y2, ez(K, z2 + 0.5) + 0.15); }
      K.B.ticks.push((now) => { if (K.calm()) return; glowA.material.opacity = Math.sin(now / 520) > 0 ? 0.85 : 0.08; glowB.material.opacity = 0.55 + Math.sin(now / 1300) * 0.3; });
      // two columns of jellyfish
      const jelly = (i) => { const f = K.fine(16, 16, 8), { g } = f, col = ['#f8a0d8', '#c8a0f8', '#a0d8f8'][i % 3]; g.fillStyle = col; g.globalAlpha = 0.85; g.beginPath(); g.arc(8, 7, 5, Math.PI, 0); g.quadraticCurveTo(8, 9.5, 3, 7); g.fill(); g.strokeStyle = col; g.lineWidth = 0.5; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(4.5 + k * 1.7, 8); g.quadraticCurveTo(4 + k * 1.7, 11, 5 + k * 1.7, 15); g.stroke(); } return f.c; };
      for (const tx of [0, 16]) {
        const x2 = ex(K, tx + 0.5), z2 = ez(K, 8.5);
        part(K, new T.CylinderGeometry(0.46, 0.5, 0.3, 24), brass, x2, 0.15, z2);
        part(K, new T.CylinderGeometry(0.46, 0.46, 0.18, 24), brass, x2, 2.79, z2);
        part(K, new T.CylinderGeometry(0.4, 0.4, 2.4, 24, 1, true), new T.MeshBasicMaterial({ color: '#1a3a8a', transparent: true, opacity: 0.4, side: T.BackSide, depthWrite: false }), x2, 1.5, z2).castShadow = false;
        part(K, new T.CylinderGeometry(0.41, 0.41, 2.4, 24, 1, true), new T.MeshBasicMaterial({ color: '#c8f0ff', transparent: true, opacity: 0.12, depthWrite: false }), x2, 1.5, z2).castShadow = false;
        drift(K, jelly, 3, (p, t, u) => p.set(x2 + Math.sin(t * 6 + u.seed) * 0.12, 0.55 + t * 1.95, z2 + Math.cos(t * 5 + u.seed) * 0.1), { size: 0.36, period: 11 });
      }
      // the sea's light rippling over the floor
      const caustic = paint(K, 64, 64, (f) => {
        const { g } = f, rr2 = K.seeded(11);
        g.fillStyle = '#000000'; g.fillRect(0, 0, 64, 64);
        g.strokeStyle = '#ffffff'; g.lineWidth = 0.9; g.globalAlpha = 0.7;
        for (let i = 0; i < 26; i++) { const x = rr2() * 64, y = rr2() * 64, s = 4 + rr2() * 7; for (const ox of [-64, 0, 64]) for (const oy of [-64, 0, 64]) { g.beginPath(); g.ellipse(x + ox, y + oy, s, s * 0.7, rr2() * 3, 0, Math.PI * 1.6); g.stroke(); } }
      }, { wrap: true });
      const c2 = caustic.t.clone(); c2.needsUpdate = true;
      const layers = [caustic.t, c2].map((t, i) => {
        t.repeat.set(4 + i, 3 + i);
        const o = part(K, new T.PlaneGeometry(C, R), new T.MeshBasicMaterial({ map: t, color: '#6ad8ff', transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }), 0, 0.014 + i * 0.002, 0);
        o.rotation.x = -Math.PI / 2; o.castShadow = o.receiveShadow = false; return t;
      });
      K.B.ticks.push((now) => { if (K.calm()) return; const t = now / 1000; layers[0].offset.set(t * 0.011, t * 0.005); layers[1].offset.set(-t * 0.008, t * 0.01); });
      lamp(K, '#60c8ff', 1.6, 10, tcx, 2.6, tz1 + 1.2);
      lamp(K, '#80e0ff', 0.9, 6, lx, 1.6, lz);
    },
  },

  /* HIGHBOUGH'S WITHERED NURSERY: a dead Victorian conservatory. Iron ribs up the walls, lancet windows grimed and
     cracked with the canopy dark beyond, two dead palms in their urns, a dry fountain choked with leaves under
     Chandelure (hung there as its chandelier), Cofagrigus laid in a stone niche between candles, potting benches of
     toppled pots, Spiritomb in a ring of little candles, moonlight down through the broken panes and wisps adrift. */
  nursery: {
    town: 'thornwood',
    shotTop: 4.6,
    mood: { hemi: ['#a8b8d8', '#282034', 1.05], sun: ['#b8c8f0', 0.95], bloom: 1.2 },
    beat: 2600,
    castAt: [[8, 5.0, 2.25, 0.9], [8, 0.35, 0.3, 0.9], [2.7, 1.9, 0, 0.9], [11.2, 6.6, 0, 0.9], [14.2, 2.1, 0, 0.9]],
    edge: '#1e1a24', cap: '#2a2430', bg: '#08060c',
    floor(K, f, W, H, T) {
      const { g } = f, s = f.shine(), r = K.seeded(13);
      for (let y = 0; y < H; y += T / 2) for (let x = 0; x < W; x += T / 2) {
        const t = T / 2, odd = ((x + y) / t) % 2;
        g.fillStyle = odd ? '#b8603a' : '#e8dcc0'; g.fillRect(x, y, t, t);
        g.fillStyle = odd ? '#e8dcc0' : '#2a2a30'; g.beginPath(); g.moveTo(x + t / 2, y + 1.2); g.lineTo(x + t - 1.2, y + t / 2); g.lineTo(x + t / 2, y + t - 1.2); g.lineTo(x + 1.2, y + t / 2); g.fill();
      }
      g.fillStyle = 'rgba(30,24,20,0.45)'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(60,80,40,0.5)'; g.beginPath(); g.ellipse(r() * W, r() * H, 4 + r() * 9, 2 + r() * 5, r() * 3, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = 'rgba(10,8,6,0.7)'; g.lineWidth = 0.5;
      for (let i = 0; i < 18; i++) { let x = r() * W, y = r() * H; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (r() - 0.5) * 14; y += (r() - 0.5) * 14; g.lineTo(x, y); } g.stroke(); }
      for (let i = 0; i < 160; i++) { g.fillStyle = ['#6a4a2a', '#8a5a2a', '#5a3a1e', '#7a6a3a'][i % 4]; g.beginPath(); g.ellipse(r() * W, r() * H, 1.4 + r(), 0.7, r() * 3, 0, Math.PI * 2); g.fill(); }
      for (let i = 0; i < 40; i++) { const x = r() * W, y = r() * H; s.fillStyle = 'rgba(200,220,255,0.8)'; s.fillRect(x, y, 0.8, 0.4); g.fillStyle = 'rgba(220,235,255,0.7)'; g.fillRect(x, y, 0.8, 0.4); }
    },
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f;
      g.fillStyle = '#0c0a10'; g.fillRect(0, 0, w, TOP * U);
      conservatoryGlass(K, f, s, 0, w, wy(4.6), wy(0.9), Math.round(w));
      for (let y = wy(0.9); y < wy(0); y += 3) for (let i = -((y / 3) % 2) * 3; i < w; i += 6) { g.fillStyle = ['#5a2a22', '#6a3226', '#4a241e'][Math.floor(Math.abs(i * 7 + y) % 3)]; g.fillRect(i + 0.2, y + 0.2, 5.6, 2.6); }
      g.fillStyle = 'rgba(40,60,30,0.45)'; g.fillRect(0, wy(0.4), w, 0.4 * U);
      g.fillStyle = '#6a6a62'; g.fillRect(0, wy(0.95), w, 2);
      if (back) {
        // Cofagrigus's niche: a pointed stone arch, dark inside
        const a = x(6.9), b = x(10.1), m = (a + b) / 2, top = wy(3.4), bot = wy(0);
        g.fillStyle = '#5a5650'; g.beginPath(); g.moveTo(a - 4, bot); g.lineTo(a - 4, top + 18); g.quadraticCurveTo(a - 4, top - 4, m, top - 12); g.quadraticCurveTo(b + 4, top - 4, b + 4, top + 18); g.lineTo(b + 4, bot); g.fill();
        g.fillStyle = lin(0, top, 0, bot, ['#0a080c', '#16121a']); g.beginPath(); g.moveTo(a, bot); g.lineTo(a, top + 18); g.quadraticCurveTo(a, top, m, top - 7); g.quadraticCurveTo(b, top, b, top + 18); g.lineTo(b, bot); g.fill();
        g.fillStyle = '#3a3428'; g.fillRect(x(3), wy(3.9), x(5.6) - x(3), 9);
        g.fillStyle = '#a08a50'; g.fillRect(x(3) + 1, wy(3.9) + 1, x(5.6) - x(3) - 2, 7);
        text(g, 'HIGHBOUGH NURSERY', (x(3) + x(5.6)) / 2, wy(3.9) + 4.8, 4.2, '#2a2014');
      }
    },
    furnish: [['candelabra', 6, 0], ['candelabra', 10, 0], ['amphora', 3, 0, { scale: 1.1 }],
      ['pottingbench', 0, 4, { turn: Math.PI / 2 }], ['seedtrays', 0, 7, { turn: Math.PI / 2 }], ['pottingbench', 16, 4, { turn: -Math.PI / 2 }],
      ['compostbin', 16, 7], ['wateringcan', 16, 8], ['wheelbarrow', 2, 10], ['pumpkins', 14, 10], ['ghostsheet', 15, 9],
      ['spookylamp', 0, 11], ['spookylamp', 16, 11], ['litwick', 12, 9]],
    hang: [['cobweb', 2, { y: 2.6 }], ['cobweb', 14, { y: 2.6 }], ['cobweb', 0, { side: 'l', row: 2, y: 2.6 }], ['cobweb', 0, { side: 'r', row: 9, y: 2.6 }]],
    blocks: [[0, 0, 2, 2], [15, 0, 2, 2], [7, 0, 3, 1], [4, 0, 2, 1], [11, 0, 2, 1], ...round(8.5, 5.5, 1.6), [3, 2, 1, 1], [11, 6, 1, 1], [14, 2, 1, 1]],
    props(K, P, all) {
      const T = K.THREE, r = K.seeded(31), iron = mat(K, '#8a908a', { metalness: 0.55, roughness: 0.6 }), stone = mat(K, '#7a7c74', { roughness: 0.95 }), moss = mat(K, '#4a5a3a', { roughness: 1 });
      // iron columns up both walls, curving over at the top
      for (const side of [-1, 1]) for (const row of [3, 6, 9]) {
        const x = side * (C / 2 - 0.12), z = ez(K, row);
        part(K, new T.CylinderGeometry(0.06, 0.08, 3.2, 8), iron, x, 1.6, z);
        part(K, new T.BoxGeometry(0.2, 0.12, 0.2), iron, x, 3.2, z);
        const arc = part(K, new T.TorusGeometry(0.62, 0.035, 6, 18, Math.PI / 2), iron, x - side * 0.62, 3.2, z);
        arc.rotation.z = side < 0 ? Math.PI / 2 : 0;
      }
      // the dry fountain, choked with leaves, moss on its rim
      const fx = ex(K, 8.5), fz = ez(K, 5.5);
      part(K, new T.CylinderGeometry(1.45, 1.55, 0.5, 8, 1, true), stone, fx, 0.25, fz);
      const rimR = part(K, new T.RingGeometry(1.25, 1.55, 8), mat(K, '#8e9086'), fx, 0.5, fz); rimR.rotation.x = -Math.PI / 2;
      part(K, new T.CylinderGeometry(1.27, 1.3, 0.5, 8, 1, true), K.std({ color: '#3a3a34', side: T.BackSide }), fx, 0.25, fz);
      const leaves = paint(K, 32, 32, (f) => { const { g } = f, rr2 = K.seeded(2); g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, 32, 32); for (let i = 0; i < 90; i++) { g.fillStyle = ['#7a5228', '#9a6a30', '#5a3a1e', '#8a7a40'][i % 4]; g.beginPath(); g.ellipse(rr2() * 32, rr2() * 32, 1.8, 0.9, rr2() * 3, 0, Math.PI * 2); g.fill(); } }).t;
      const bed = part(K, new T.CircleGeometry(1.3, 8), K.std({ map: leaves, roughness: 1 }), fx, 0.22, fz); bed.rotation.x = -Math.PI / 2;
      part(K, new T.CylinderGeometry(0.16, 0.26, 1.1, 8), stone, fx, 0.77, fz);
      part(K, new T.CylinderGeometry(0.72, 0.24, 0.26, 8), stone, fx, 1.42, fz);
      part(K, new T.ConeGeometry(0.1, 0.32, 8), stone, fx, 1.71, fz);
      many(K, new T.SphereGeometry(1, 8, 6), moss, Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2 + r(); return [fx + Math.cos(a) * 1.4, 0.5, fz + Math.sin(a) * 1.4, 0.12 + r() * 0.1, 0, null, 0.05]; }));
      // Chandelure hangs here, on a chain into the dark
      part(K, new T.CylinderGeometry(0.018, 0.018, 3.6, 5), mat(K, '#2a2a2e', { metalness: 0.7 }), fx, 5.8, fz);
      const glow = lamp(K, '#b070ff', 2.0, 7, fx, 2.6, fz + 0.3);
      K.B.ticks.push((now) => { if (!K.calm()) glow.intensity = 1.8 + Math.sin(now / 260) * 0.25 + Math.sin(now / 97) * 0.12; });
      // Cofagrigus's plinth in its niche
      part(K, new T.BoxGeometry(2.6, 0.3, 1.0), stone, ex(K, 8.5), 0.15, ez(K, 0.5));
      for (const s of [-1, 1]) part(K, new T.BoxGeometry(0.3, 2.9, 0.26), mat(K, '#5a5650'), ex(K, 8.5) + s * 1.5, 1.45, ez(K, 0) + 0.13);
      // two dead palms in iron-banded urns, fronds hanging brown
      const frond = paint(K, 48, 16, (f) => { const { g } = f, rr2 = K.seeded(9); g.strokeStyle = '#6a4a28'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 8); g.lineTo(48, 8); g.stroke(); for (let x = 2; x < 46; x += 1.6) { if (rr2() < 0.25) continue; g.strokeStyle = ['#8a6a3a', '#a07a44', '#6a5030'][Math.floor(rr2() * 3)]; g.lineWidth = 0.8; const l = 7 * (1 - x / 56); g.beginPath(); g.moveTo(x, 8); g.lineTo(x + 3, 8 - l); g.moveTo(x, 8); g.lineTo(x + 3, 8 + l); g.stroke(); } }).t;
      const fm = K.std({ map: frond, transparent: true, alphaTest: 0.35, side: T.DoubleSide, roughness: 1 });
      const fgeo = new T.PlaneGeometry(1.7, 0.56); fgeo.translate(0.85, 0, 0); fgeo.rotateX(-Math.PI / 2);
      const bark = mat(K, '#6a5a48', { roughness: 1 }), urn = mat(K, '#4a4440', { roughness: 0.8, metalness: 0.3 });
      for (const [tx, tz, h] of [[1, 1, 3.1], [16, 1, 3.4]]) {
        const px = ex(K, tx), pz = ez(K, tz);
        part(K, new T.CylinderGeometry(0.62, 0.46, 0.66, 8), urn, px, 0.33, pz);
        part(K, new T.CylinderGeometry(0.68, 0.68, 0.08, 8), iron, px, 0.66, pz);
        part(K, new T.CylinderGeometry(0.1, 0.16, h, 8), bark, px, 0.66 + h / 2, pz);
        many(K, new T.CylinderGeometry(0.17, 0.17, 0.05, 8), mat(K, '#4a3a2c'), Array.from({ length: 9 }, (_, i) => [px, 0.9 + i * (h - 0.4) / 9, pz, 1 - i * 0.04]));
        for (let i = 0; i < 9; i++) {
          const gr = group(K, px, 0.66 + h, pz, i / 9 * Math.PI * 2 + r() * 0.3), o = part(K, fgeo, fm, 0, 0, 0, gr);
          o.rotation.z = -(0.55 + r() * 0.7); o.scale.setScalar(i % 4 === 3 ? 0.6 : 0.85 + r() * 0.3);
        }
      }
      // two raised beds of brick against the glass, everything in them long dead
      const brick = mat(K, '#6a3428', { roughness: 0.95 }), shrubs = [];
      for (const t of [5, 12]) {
        part(K, new T.BoxGeometry(1.9, 0.5, 0.85), brick, ex(K, t), 0.25, ez(K, 0.5));
        part(K, new T.BoxGeometry(2.0, 0.07, 0.95), stone, ex(K, t), 0.52, ez(K, 0.5));
        part(K, new T.BoxGeometry(1.75, 0.02, 0.7), mat(K, '#2a2018', { roughness: 1 }), ex(K, t), 0.555, ez(K, 0.5));
        for (let k = 0; k < 5; k++) shrubs.push([ex(K, t) - 0.7 + k * 0.35, 0.68, ez(K, 0.5) + (k % 2 ? 0.12 : -0.1), 0.16 + r() * 0.08, r() * 6, ['#5a4a2c', '#6a5432', '#4a3e26'][k % 3], 0.13 + r() * 0.06]);
      }
      many(K, new T.DodecahedronGeometry(1, 0), K.std({ color: '#ffffff', roughness: 1, flatShading: true }), shrubs);
      many(K, new T.CylinderGeometry(0.008, 0.014, 0.5, 4), mat(K, '#4a3a28'), shrubs.flatMap(([x, , z]) => [[x - 0.05, 0.82, z, 1, 0, null, 1, 0, 0.3], [x + 0.05, 0.84, z, 1, 0, null, 1, 0, -0.35]]), { shadow: false });
      // pots on the benches, toppled, dead sticks in them
      const pots = [], sticks = [];
      for (const [pid, x, y, m] of all) {
        if (pid !== 'pottingbench') continue;
        const top = topOf(m), turned = Math.abs(m.rotation.y) > 0.1;
        for (let k = 0; k < 3; k++) {
          const along = -0.6 + k * 0.6, px = turned ? m.position.x : m.position.x + along, pz = turned ? m.position.z + along : m.position.z, tip = (k + x + y) % 3 === 1;
          pots.push([px, top + (tip ? 0.1 : 0.12), pz, 1, r() * 6, ['#b86a40', '#a85a34', '#c87a48'][k], 1, 0, tip ? Math.PI / 2 : 0]);
          if (!tip) for (let j = 0; j < 3; j++) sticks.push([px + (j - 1) * 0.04, top + 0.34, pz, 1, 0, null, 1, 0, (j - 1) * 0.35]);
        }
      }
      many(K, new T.CylinderGeometry(0.11, 0.08, 0.2, 10), K.std({ color: '#ffffff', roughness: 0.9 }), pots);
      many(K, new T.CylinderGeometry(0.008, 0.012, 0.36, 4), mat(K, '#4a3a28'), sticks, { shadow: false });
      // Spiritomb's ring of little candles
      const sx = ex(K, 11.7), sz = ez(K, 7.1), flames = [];
      many(K, new T.CylinderGeometry(0.035, 0.035, 0.12, 8), mat(K, '#e8e0d0'), Array.from({ length: 7 }, (_, i) => { const a = i / 7 * Math.PI * 2; const p = [sx + Math.cos(a) * 0.62, 0.06, sz + Math.sin(a) * 0.5]; flames.push(p); return p; }), { shadow: false });
      const fl = dotArt(K, '#c890ff');
      for (const [x2, , z2] of flames) { const sp = K.sprite(fl, 0.14); sp.visible = true; sp.material.blending = T.AdditiveBlending; sp.position.set(x2, 0.17, z2); }
      // moonlight down through the broken panes, dust turning in it, wisps adrift
      const beam = paint(K, 16, 64, (f) => { const { g } = f, l = g.createLinearGradient(0, 0, 0, 64); l.addColorStop(0, 'rgba(210,225,255,0.85)'); l.addColorStop(1, 'rgba(210,225,255,0)'); g.fillStyle = l; g.fillRect(0, 0, 16, 64); g.globalCompositeOperation = 'destination-out'; const e = g.createLinearGradient(0, 0, 16, 0); e.addColorStop(0, '#000'); e.addColorStop(0.3, 'rgba(0,0,0,0)'); e.addColorStop(0.7, 'rgba(0,0,0,0)'); e.addColorStop(1, '#000'); g.fillStyle = e; g.fillRect(0, 0, 16, 64); }).t;
      const beams = [[-5, -2.2], [-0.5, 1.4], [4.4, -3.4]].map(([x2, z2], i) => {
        const o = part(K, new T.PlaneGeometry(1.3, 5.4), new T.MeshBasicMaterial({ map: beam, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0.22, toneMapped: false }), x2, 2.5, z2);
        o.rotation.z = 0.32; o.castShadow = o.receiveShadow = false; o.userData.ph = i * 2; return o;
      });
      K.B.ticks.push((now) => { if (!K.calm()) for (const o of beams) o.material.opacity = 0.18 + Math.sin(now / 2300 + o.userData.ph) * 0.07; });
      motes(K, () => K.fireflyArt('#dce6ff'), 10, [-6, 6], [0.4, 3.4], [-4, 2], 0.07);
      motes(K, (i) => K.fireflyArt(i % 2 ? '#a060f0' : '#60e0f0'), 8, [-7, 7], [0.6, 2.8], [-5, 4], 0.14);
    },
  },

  /* SUNWELL BAZAAR'S CARAVANSERAI: a courtyard open to the sky. An arcade of pointed arches across the back, striped
     red and cream, its middle one a tall iwan under the hall's name; a stall in each bay out of the sun, hay and
     troughs and the caravans' Pokemon dozing; a brass lantern in every arch; an eight-point star of zellige round a
     fountain in the middle; palms, a well, rolled carpets and a tea corner on a kilim. */
  caravanserai: {
    town: 'savanna',
    shotTop: 4.8,
    mood: { hemi: ['#fff4e0', '#a08060', 1.6], sun: ['#ffe6bc', 2.3], bloom: 0.8 },
    beat: 2600,
    castAt: [[1.5, 1.4, 0, 0.9], [5.0, 1.2, 0, 0.9], [11.9, 1.2, 0, 0.9], [15.1, 1.4, 0, 0.9], [10.9, 6.6, 0, 0.9]],
    edge: '#8a6a48', cap: '#c8a070', bg: '#2a1c10',
    floor(K, f, W, H, T) {
      const { g } = f, r = K.seeded(19);
      g.fillStyle = '#b89a70'; g.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 6) for (let x = -((y / 6) % 2) * 5; x < W; x += 10) { g.fillStyle = ['#e4cca4', '#dcc29a', '#d4b890', '#e8d2ac'][Math.floor(r() * 4)]; g.fillRect(x + 0.4, y + 0.4, 9.2, 5.2); }
      g.fillStyle = '#c8a46a'; g.fillRect(0, 0, W, 2.6 * T);
      for (let i = 0; i < 420; i++) { g.strokeStyle = ['#e8c878', '#d4b060', '#b89448'][i % 3]; g.lineWidth = 0.35; const x = r() * W, y = r() * 2.6 * T, a = r() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); g.stroke(); }
      zelligeStar(g, 8.5 * T, 6.5 * T, 2.7 * T);
      g.fillStyle = 'rgba(80,50,20,0.12)'; g.fillRect(0, 2.6 * T, W, 0.6 * T);
    },
    paint(K, f, w, { back, x, s }) {
      const { g, lin } = f, sky = skyCols(K.time);
      g.fillStyle = lin(0, 0, 0, wy(4.9), sky); g.fillRect(0, 0, w, wy(4.9));
      if (NIGHT(K.time)) for (let i = 0; i < 40; i++) { g.fillStyle = '#ffffff'; g.fillRect((i * 37.7) % w, (i * 13.3) % wy(5.4), 0.7, 0.7); }
      g.fillStyle = '#c89a62'; for (let i = 0; i < w; i += 7) { g.fillRect(i, wy(5.15), 4, wy(4.9) - wy(5.15)); }
      g.fillStyle = '#c89a62'; g.fillRect(0, wy(4.95), w, wy(4.9) - wy(4.95) + 1);
      upperStorey(g, 0, w, wy(4.9), wy(3.45), back ? 3.4 * U : 3 * U);
      if (back) {
        g.fillStyle = lin(0, wy(3.45), 0, wy(0), ['#d8c4a0', '#e6d4b4']); g.fillRect(0, wy(3.45), w, wy(0) - wy(3.45));
        for (const [c, wd] of [[1.75, 1.2], [5, 1], [12, 1], [15.25, 1.2]]) {
          g.fillStyle = '#6a4024'; g.beginPath(); g.moveTo(x(c - wd / 2), wy(0)); g.lineTo(x(c - wd / 2), wy(1.4)); g.quadraticCurveTo(x(c - wd / 2), wy(1.95), x(c), wy(2.05)); g.quadraticCurveTo(x(c + wd / 2), wy(1.95), x(c + wd / 2), wy(1.4)); g.lineTo(x(c + wd / 2), wy(0)); g.fill();
          g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x(c) - 0.4, wy(1.9), 0.8, wy(0) - wy(1.9));
          g.fillStyle = '#c8a050'; g.beginPath(); g.arc(x(c) + 3, wy(0.9), 0.9, 0, Math.PI * 2); g.fill();
        }
        // the iwan's great door: cedar, brass studs, a carved arch over it
        const a = x(7.2), b = x(9.8), m = (a + b) / 2;
        g.fillStyle = '#2a6a8a'; g.beginPath(); g.moveTo(a - 5, wy(0)); g.lineTo(a - 5, wy(2.1)); g.quadraticCurveTo(a - 5, wy(2.9), m, wy(3.15)); g.quadraticCurveTo(b + 5, wy(2.9), b + 5, wy(2.1)); g.lineTo(b + 5, wy(0)); g.fill();
        g.fillStyle = '#5a3018'; g.beginPath(); g.moveTo(a, wy(0)); g.lineTo(a, wy(2.0)); g.quadraticCurveTo(a, wy(2.65), m, wy(2.85)); g.quadraticCurveTo(b, wy(2.65), b, wy(2.0)); g.lineTo(b, wy(0)); g.fill();
        g.fillStyle = '#3a1e0c'; g.fillRect(m - 0.5, wy(2.8), 1, wy(0) - wy(2.8));
        g.fillStyle = '#e8c060'; for (let yy = wy(2.3); yy < wy(0.2); yy += 5) for (let xx = a + 3; xx < b - 2; xx += 5) { if (Math.abs(xx - m) < 1.5) continue; g.beginPath(); g.arc(xx, yy, 0.7, 0, Math.PI * 2); g.fill(); }
        for (const xx of [m - 3, m + 3]) { g.strokeStyle = '#e8c060'; g.lineWidth = 0.8; g.beginPath(); g.arc(xx, wy(1.1), 1.8, 0, Math.PI * 2); g.stroke(); }
      } else {
        g.fillStyle = lin(0, wy(3.45), 0, wy(0), ['#dcc49c', '#e8d4b0']); g.fillRect(0, wy(3.45), w, wy(0) - wy(3.45));
        for (let r = 1.5; r < R; r += 3) {
          const c = x(r), hw = 0.95 * U;
          g.fillStyle = '#c8a070'; g.beginPath(); g.moveTo(c - hw - 3, wy(0)); g.lineTo(c - hw - 3, wy(1.9)); g.quadraticCurveTo(c - hw - 3, wy(2.75), c, wy(2.95)); g.quadraticCurveTo(c + hw + 3, wy(2.75), c + hw + 3, wy(1.9)); g.lineTo(c + hw + 3, wy(0)); g.fill();
          g.fillStyle = '#7a4a26'; g.beginPath(); g.moveTo(c - hw, wy(0)); g.lineTo(c - hw, wy(1.9)); g.quadraticCurveTo(c - hw, wy(2.6), c, wy(2.75)); g.quadraticCurveTo(c + hw, wy(2.6), c + hw, wy(1.9)); g.lineTo(c + hw, wy(0)); g.fill();
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(c - 0.4, wy(2.5), 0.8, wy(0) - wy(2.5));
          g.setLineDash([2.4, 2.4]); g.strokeStyle = '#a8462c'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(c - hw - 1.5, wy(1.9)); g.quadraticCurveTo(c - hw - 1.5, wy(2.68), c, wy(2.86)); g.quadraticCurveTo(c + hw + 1.5, wy(2.68), c + hw + 1.5, wy(1.9)); g.stroke(); g.setLineDash([]);
        }
        g.fillStyle = 'rgba(60,30,10,0.18)'; g.fillRect(0, wy(1), w, U);
      }
      for (let i = 0; i < w; i += 4) { g.fillStyle = (i / 4) % 2 ? '#2a6a8a' : '#e8d8b0'; g.fillRect(i, wy(0.5), 4, 2); }
    },
    furnish: [['haybale', 0, 0], ['trough', 1, 0], ['haybale', 4, 0], ['waterjar', 5, 0], ['waterjar', 7, 0], ['goldurn', 9, 0], ['feedsack', 11, 0], ['haybale', 12, 0],
      ['trough', 14, 0], ['haybale', 16, 0], ['haybale', 16, 1],
      ['datepalm', 4, 4], ['datepalm', 12, 4], ['datepalm', 0, 10], ['datepalm', 16, 10],
      ['crate', 0, 5], ['crate', 1, 5], ['waterjar', 0, 6], ['well', 3, 9],
      ['dunerug', 12, 8, { free: true }], ['teapottable', 12, 8], ['pouf', 13, 8], ['pouf', 12, 9],
      ['crate', 16, 5], ['barrel', 16, 6], ['waterjar', 15, 5]],
    blocks: [[3, 0, 1, 3], [6, 0, 1, 3], [10, 0, 1, 3], [13, 0, 1, 3], ...round(8.5, 6.5, 1.65), [0, 7, 1, 2], [2, 1, 1, 1], [5, 1, 1, 1], [12, 1, 1, 1], [15, 1, 1, 1], [11, 6, 1, 1]],
    props(K) {
      const T = K.THREE, sand = mat(K, '#dcb98a', { roughness: 0.95 }), wood = mat(K, '#8a5a34', { roughness: 0.85 }), brass = mat(K, '#d8a848', { metalness: 0.75, roughness: 0.32 });
      // the arcade: one face of sandstone with five pointed arches cut through it, ablaq stripes round them
      const bays = [[0.25, 3.25], [3.75, 6.25], [6.75, 10.25], [10.75, 13.25], [13.75, 16.75]], HW = C / 2, FH = 3.3, SPRING = 2.0;
      const sh = new T.Shape();
      sh.moveTo(-HW, 0);
      for (const [a, b] of bays) {
        const xl = a - HW, xr = b - HW, xc = (xl + xr) / 2, apex = (b - a) > 3.2 ? 3.05 : 2.8;
        sh.lineTo(xl, 0); sh.lineTo(xl, SPRING); sh.quadraticCurveTo(xl + 0.04, apex - 0.25, xc, apex); sh.quadraticCurveTo(xr - 0.04, apex - 0.25, xr, SPRING); sh.lineTo(xr, 0);
      }
      sh.lineTo(HW, 0); sh.lineTo(HW, FH); sh.lineTo(-HW, FH); sh.closePath();
      const face = paint(K, C * 20, FH * 20, (f) => {
        const { g } = f, cy = (y) => (FH - y) * 20, cx = (xx) => (xx + HW) * 20;
        g.fillStyle = '#e2c290'; g.fillRect(0, 0, C * 20, FH * 20);
        g.fillStyle = 'rgba(150,100,50,0.14)'; for (let y = 0; y < FH * 20; y += 5) g.fillRect(0, y, C * 20, 0.4);
        for (const [a, b] of bays) {
          const xl = a - HW, xr = b - HW, xc = (xl + xr) / 2, apex = (b - a) > 3.2 ? 3.05 : 2.8, path = (o) => { g.beginPath(); g.moveTo(cx(xl - o), cy(SPRING)); g.quadraticCurveTo(cx(xl + 0.04 - o), cy(apex - 0.25 + o), cx(xc), cy(apex + o)); g.quadraticCurveTo(cx(xr - 0.04 + o), cy(apex - 0.25 + o), cx(xr + o), cy(SPRING)); };
          g.lineWidth = 5; g.setLineDash([3, 3]);
          g.strokeStyle = '#b04a2c'; path(0.14); g.stroke();
          g.lineDashOffset = 3; g.strokeStyle = '#f4e6c8'; path(0.14); g.stroke();
          g.setLineDash([]); g.lineDashOffset = 0;
          g.strokeStyle = '#8a5a30'; g.lineWidth = 0.8; path(0.28); g.stroke();
        }
        for (let i = 0; i < C * 20; i += 4) { g.fillStyle = (i / 4) % 3 === 0 ? '#1e4e7a' : (i / 4) % 3 === 1 ? '#3a8a5a' : '#f0e6cc'; g.fillRect(i, 1, 4, 4); }
        g.fillStyle = '#8a5a30'; g.fillRect(0, 5, C * 20, 0.8);
      });
      face.t.repeat.set(1 / C, 1 / FH); face.t.offset.set(0.5, 0);
      const fz = ez(K, 2.5);
      part(K, new T.ExtrudeGeometry(sh, { depth: 0.4, bevelEnabled: false, curveSegments: 12 }), [K.std({ map: face.t, roughness: 0.9 }), sand], 0, 0, fz);
      part(K, new T.BoxGeometry(C, 0.22, fz + 0.4 - ez(K, 0)), sand, 0, FH + 0.11, (ez(K, 0) + fz + 0.4) / 2);
      // the iwan's tall frame over the middle arch, the hall's name in tile, merlons along the top
      sheet(K, 92, 22, (f) => {
        const { g } = f, gl = f.shine();
        g.fillStyle = '#1e4e7a'; g.fillRect(0, 0, 92, 22);
        for (let i = 0; i < 92; i += 4) for (let j = 0; j < 22; j += 4) { g.fillStyle = (i + j) % 8 ? 'rgba(255,255,255,0.06)' : 'rgba(60,140,110,0.4)'; g.fillRect(i, j, 4, 4); }
        g.strokeStyle = '#e8c060'; g.lineWidth = 1.2; g.strokeRect(1.5, 1.5, 89, 19);
        for (const c of [g, gl]) text(c, 'CARAVANSERAI', 46, 11.5, 9, '#f4d878');
      }, 4.6, 1.1, ex(K, 8.5), FH + 0.77, fz + 0.42, { k: 4, glow: 0.6 });
      part(K, new T.BoxGeometry(4.8, 1.15, 0.36), sand, ex(K, 8.5), FH + 0.77, fz + 0.2);
      const merl = [];
      for (let xx = -HW + 0.3; xx < HW; xx += 0.62) if (Math.abs(xx) > 2.5) merl.push([xx, FH + 0.36, fz + 0.3]);
      for (let xx = -2.2; xx <= 2.21; xx += 0.62) merl.push([xx, FH + 1.48, fz + 0.2]);
      many(K, new T.BoxGeometry(0.3, 0.3, 0.16), sand, merl);
      // the stalls' wooden partitions, a lantern hung in every arch
      for (const t of [3.5, 6.5, 10.5, 13.5]) {
        part(K, new T.BoxGeometry(0.12, 1.1, 2.3), wood, ex(K, t), 0.55, ez(K, 1.15));
        part(K, new T.BoxGeometry(0.16, 0.08, 2.4), mat(K, '#5a3a20'), ex(K, t), 1.12, ez(K, 1.15));
      }
      const pierced = paint(K, 16, 16, (f) => { const { g } = f, gl = f.shine(); g.fillStyle = '#5a3a14'; g.fillRect(0, 0, 16, 16); for (const c of [g, gl]) { c.fillStyle = '#ffd880'; for (let i = 1; i < 16; i += 3) for (let j = 1; j < 16; j += 3) { c.beginPath(); c.arc(i + ((j / 3) % 2) * 1.5, j, 0.8, 0, Math.PI * 2); c.fill(); } } });
      const lm = K.std({ map: pierced.t, emissive: new T.Color('#ffffff'), emissiveMap: pierced.glow, emissiveIntensity: NIGHT(K.time) ? 2.0 : 1.1, roughness: 0.5, metalness: 0.4 });
      const swing = bays.map(([a, b], i) => {
        const xc = ex(K, (a + b) / 2), apex = (b - a) > 3.2 ? 3.05 : 2.8, gr = group(K, xc, apex - 0.05, fz + 0.2);
        part(K, new T.CylinderGeometry(0.01, 0.01, 0.6, 4), mat(K, '#3a2a14'), 0, -0.3, 0, gr);
        part(K, new T.CylinderGeometry(0.13, 0.1, 0.3, 8), lm, 0, -0.75, 0, gr);
        part(K, new T.ConeGeometry(0.15, 0.2, 8), brass, 0, -0.5, 0, gr);
        part(K, new T.ConeGeometry(0.06, 0.12, 8), brass, 0, -0.96, 0, gr).rotation.x = Math.PI;
        gr.userData.ph = i * 1.3; return gr;
      });
      K.B.ticks.push((now) => { if (!K.calm()) for (const gr of swing) gr.rotation.z = Math.sin(now / 1400 + gr.userData.ph) * 0.05; });
      // the fountain: an octagon of zellige, a bowl on a stem, its jet
      const zel = paint(K, 64, 12, (f) => { const { g } = f; g.fillStyle = '#f0e6cc'; g.fillRect(0, 0, 64, 12); for (let i = 0; i < 64; i += 4) { g.fillStyle = ['#1e4e7a', '#3a8a5a', '#e8b04a', '#1e4e7a'][(i / 4) % 4]; g.save(); g.translate(i + 2, 6); g.rotate(Math.PI / 4); g.fillRect(-1.4, -1.4, 2.8, 2.8); g.restore(); } g.fillStyle = '#1e4e7a'; g.fillRect(0, 0, 64, 1.2); g.fillRect(0, 10.8, 64, 1.2); });
      zel.t.wrapS = T.RepeatWrapping; zel.t.repeat.set(4, 1);
      const ox = ex(K, 8.5), oz = ez(K, 6.5), marble = mat(K, '#f0e8d8', { roughness: 0.35 });
      part(K, new T.CylinderGeometry(1.55, 1.6, 0.5, 8, 1, true), K.std({ map: zel.t, roughness: 0.4 }), ox, 0.25, oz);
      const rim2 = part(K, new T.RingGeometry(1.32, 1.62, 8), marble, ox, 0.5, oz); rim2.rotation.x = -Math.PI / 2;
      part(K, new T.CylinderGeometry(1.34, 1.36, 0.5, 8, 1, true), K.std({ color: '#2a7a9a', side: T.BackSide }), ox, 0.25, oz);
      water(K, 2.7, 2.7, ox, 0.42, oz, ['#2a7a9a', '#5ab8c8', '#e8fcff'], { disc: true, op: 0.8 });
      part(K, new T.CylinderGeometry(0.12, 0.2, 1.0, 8), marble, ox, 0.6, oz);
      part(K, new T.CylinderGeometry(0.55, 0.2, 0.2, 8), marble, ox, 1.15, oz);
      water(K, 0.95, 0.95, ox, 1.24, oz, ['#2a7a9a', '#5ab8c8', '#e8fcff'], { disc: true, op: 0.85 });
      const drop = dotArt(K, '#d8f8ff');
      drift(K, () => drop, 14, (p, t, u) => { const a = u.i / 14 * Math.PI * 2; p.set(ox + Math.cos(a) * t * 0.95, 1.5 + t * 0.55 - t * t * 1.55, oz + Math.sin(a) * t * 0.95); }, { size: 0.09, period: 1.1 });
      // rolled carpets stacked by the wall
      const rolls = [];
      for (let i = 0; i < 5; i++) rolls.push([ex(K, 0.5) + (i < 3 ? (i - 1) * 0.27 : (i - 3.5) * 0.27), 0.13 + (i < 3 ? 0 : 0.24), ez(K, 8), 1, 0, ['#b8302a', '#2a5a8a', '#d8a040', '#7a2a5a', '#3a7a4a'][i], 1, Math.PI / 2]);
      many(K, new T.CylinderGeometry(0.13, 0.13, 1.7, 14), K.std({ color: '#ffffff', roughness: 0.95 }), rolls);
      if (NIGHT(K.time)) lamp(K, '#ffc070', 1.6, 10, ox, 2.4, ez(K, 3.2));
    },
  },
};

/** The hall's light, by its mood; night dims it and lets the glows carry it (a caravanserai's sky goes dark too). */
export function hallEnv(id, time) {
  const m = HALLS[id].mood, k = time === 'night' ? 0.72 : time === 'dusk' ? 0.88 : 1;
  return { hemi: [m.hemi[0], m.hemi[1], m.hemi[2] * k], sun: [m.sun[0], m.sun[1] * (k * k)], bloom: m.bloom + (1 - k) * 0.5 };
}

/** A wall's painting: the back (`x(t)` a tile's left edge on it, 0.4 in) or a side (`x(r)` a row's edge, the left wall
    running front to back). */
function hallWall(K, H, width, back, left) {
  const f = K.fine(width, TOP * U, 5), s = f.shine();
  const x = back ? (t) => (t + 0.4) * U : left ? (r) => (K.rows - r) * U : (r) => r * U;
  H.paint(K, f, width, { back, left, x, s });
  return f.c;
}

/** Builds a hall into the room being built (K.B). */
export function buildHall(K, id) {
  const H = HALLS[id], T = 16, W = K.cols * T, Hh = K.rows * T, fl = K.fine(W, Hh, 5);
  H.floor(K, fl, W, Hh, T);
  K.shell({ floor: fl.c, wall: hallWall(K, H, (K.cols + 0.8) * U, true), side: (left) => hallWall(K, H, K.rows * U, false, left), edge: H.edge || '#3a2418', cap: H.cap || '#4a3020', under: '#20140c', bg: H.bg || '#140c0a' });
  const P = {}, all = [];
  for (const [pid, x, y, o] of H.furnish) { const m = put(K, pid, x, y, o); if (m) { all.push([pid, x, y, m]); P[pid] ??= m; } }
  for (const [pid, x, o] of H.hang || []) hang(K, pid, x, o);
  for (const [x, y, w, h] of H.blocks || []) block(K, x, y, w, h);
  const n = K.B.group.children.length;
  H.props(K, P, all);
  for (const o of K.B.group.children.slice(n)) quiet(o);
  return H;
}
