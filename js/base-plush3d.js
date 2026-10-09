/* base-plush3d.js  -  a Pokémon doll sewn as a real 3D plush (the user's ask, 2026-10-09: dolls puffed up from their
   paintings came out as melted candles). It reads the same PLUSH pattern the painting does (js/base-dolls.js) and lends
   that file a 3D pen, so every ear, tail and extra drawn there is sewn here too: a puff is a stuffed ellipsoid, a shape a
   soft extruded patch, a line a piped cord. Parts sit by where they're sewn: the head and body are the stuffing, a patch
   or a face hugs whatever is under it (each patch raises the surface for the next, so eyes sit on a face patch), an
   `under` part is sewn on the back, ears stand on the head and the tail swings round behind. Doll units: 100 tall, x
   across, y up, z towards you; `size` is the doll's height in painted units (32 a tile). */

import { BUILDS, EXTRAS, ear, tail, sewWith } from './base-dolls.js';
import { sh } from './base-paint.js';

let T, K, hosts, bumps, layer, finish, tailRoot;

// each build's stuffing in depth: [rz as a share of rx, z] for head and body, and where feet and arms sit
const DEPTH = {
  biped: { head: [0.86, 2], body: [0.85, 0], feet: (x) => [x, 9], arms: 5 },
  quad: { head: [0.86, 12], body: [1.15, -10], bodyW: 0.78, feet: (x) => (Math.abs(x) > 20 ? [x * 0.78, -26] : [x, 12]), arms: 0 },
  ball: { head: [0.9, 0], feet: (x) => [x, 12], arms: 2 },
  blob: { head: [0.8, 8], body: [0.75, 0], feet: (x) => [x, 10], arms: 0 },
  fish: { head: [0.82, 0], feet: (x) => [x, 10], arms: 0 },
};

const hexOf = (c) => {
  if (c[0] === '#') return c.length === 4 ? '#' + [...c.slice(1)].map(h => h + h).join('') : c;
  const m = c.match(/\d+/g) || [128, 128, 128];
  return '#' + m.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
};

/** The front (or back) of the stuffing at x, y, raised by the patches already sewn there. */
function surface(x, y, back) {
  let s = back ? Infinity : -Infinity;
  for (const h of hosts) {
    const q = ((x - h.x) / h.rx) ** 2 + ((y - h.y) / h.ry) ** 2, d = h.rz * Math.sqrt(Math.max(0, 1 - q));
    s = back ? Math.min(s, h.z - d) : Math.max(s, h.z + d);
  }
  if (back) return s;
  let lift = 0;
  for (const b of bumps) {
    const q = ((x - b.x) / b.rx) ** 2 + ((y - b.y) / b.ry) ** 2;
    if (q < 1) lift = Math.max(lift, b.t * Math.sqrt(1 - q));
  }
  return s + lift;
}

/** Smooth normals across seams and bevels: a plush has no hard edges. */
function soft(g) {
  if (g.index) g = g.toNonIndexed();
  g.computeVertexNormals();
  const pos = g.attributes.position, nor = g.attributes.normal, acc = new Map();
  const key = (i) => `${pos.getX(i).toFixed(2)},${pos.getY(i).toFixed(2)},${pos.getZ(i).toFixed(2)}`;
  for (let i = 0; i < pos.count; i++) {
    const kk = key(i), a = acc.get(kk) || [0, 0, 0];
    a[0] += nor.getX(i); a[1] += nor.getY(i); a[2] += nor.getZ(i);
    acc.set(kk, a);
  }
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = acc.get(key(i)), l = Math.hypot(x, y, z) || 1;
    nor.setXYZ(i, x / l, y / l, z / l);
  }
  return g;
}

/** Lays a part made around z 0 (thickness `t` each way) where the current layer sews it, then hands it to the kit. */
function place(g, hex, t, kind = 'cloth') {
  const pos = g.attributes.position;
  if (layer === 'front' || layer === 'under') {
    const back = layer === 'under';
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const s = surface(x, y, back), out = back ? -z : z;
      pos.setZ(i, s + (back ? -1 : 1) * (out > 0 ? out : out * 0.6));
    }
  } else if (layer === 'ear') {
    const h = hosts[0];
    g.translate(0, 0, h.z - h.rz * 0.12);
  } else if (layer === 'tail') {
    const [rx, rz] = tailRoot;
    g.translate(-rx, 0, 0);
    g.rotateY(0.95);
    g.translate(rx, 0, rz);
  }
  finish(soft(g), hex, kind);
  return g;
}

/** The 3D pen js/base-dolls.js draws with. */
const PEN = {
  puff(x, y, rx, ry, c, rot = 0, kind) {
    const t = layer === 'under' ? Math.min(rx, ry) * 0.75 : layer === 'front' ? Math.min(6, Math.min(rx, ry) * 0.45) : Math.min(rx, ry) * 0.7;
    const g = new T.SphereGeometry(1, 24, 16);
    g.scale(rx, ry, t);
    if (rot) g.rotateZ(-rot);
    g.translate(x, y, 0);
    place(g, hexOf(c), t, kind);
    if (layer === 'front') bumps.push({ x, y, rx, ry, t });
  },
  flat(x, y, rx, ry, c, rot = 0, kind) {
    const t = Math.max(0.5, Math.min(1.8, Math.min(rx, ry) * 0.3));
    const g = new T.SphereGeometry(1, 20, 12);
    g.scale(rx, ry, t);
    if (rot) g.rotateZ(-rot);
    g.translate(x, y, 0);
    place(g, hexOf(c), t, kind);
    if (layer === 'front') bumps.push({ x, y, rx, ry, t: t * 0.7 });
  },
  shape(pts, c, curve = true) {
    const s = new T.Shape(), n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (!curve) pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    else {
      const m0 = mid(pts[n - 1], pts[0]);
      s.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); s.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
    }
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const small = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    const depth = layer === 'front' ? 1.2 : Math.min(4, Math.max(1.5, small * 0.25)), bev = Math.max(0.3, Math.min(1.6, small * 0.18));
    const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelSegments: 3, curveSegments: 10 });
    g.translate(0, 0, -depth / 2);
    place(g, hexOf(c), depth / 2 + bev);
  },
  line(pts, c, w) {
    const v = pts.map(([x, y]) => new T.Vector3(x, y, 0));
    const path = v.length === 2 ? new T.LineCurve3(v[0], v[1]) : new T.CatmullRomCurve3(v, false, 'centripetal');
    cord(path, c, w);
  },
  curve(a, ctl, b, c, w) {
    cord(new T.QuadraticBezierCurve3(new T.Vector3(a[0], a[1], 0), new T.Vector3(ctl[0], ctl[1], 0), new T.Vector3(b[0], b[1], 0)), c, w);
  },
};
function cord(path, c, w, kind) {
  const r = Math.max(0.35, w / 2), g = new T.TubeGeometry(path, 24, r, 8, false);
  for (const p of [path.getPoint(0), path.getPoint(1)]) {
    const cap = new T.SphereGeometry(r, 8, 6);
    cap.translate(p.x, p.y, 0);
    place(cap, hexOf(c), r, kind);
  }
  place(g, hexOf(c), r, kind);
}

/* the extras that paint straight onto the canvas, sewn their own way */
const EXTRAS3 = {
  bulb: (d, L) => {
    const [x, y, , ry] = L.head, prev = layer;
    layer = 'free';
    const g = new T.SphereGeometry(1, 24, 16);
    g.scale(21, 19, 18); g.translate(x, y + ry - 4, hosts[0].z - hosts[0].rz * 0.75);
    finish(soft(g), '#4fa042', 'cloth');
    for (const a of [-0.9, 0, 0.9]) {
      const s = new T.TorusGeometry(19.5, 0.7, 6, 24, Math.PI);
      s.scale(1, 1, 0.95); s.rotateY(a + Math.PI / 2); s.translate(x, y + ry - 4, hosts[0].z - hosts[0].rz * 0.75);
      finish(soft(s), '#2f7a32', 'cloth');
    }
    layer = prev;
  },
  split: (d, L) => {
    const [x, y, rx, ry] = L.head, h = hosts[0];
    const g = new T.SphereGeometry(1, 28, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    g.scale(rx + 0.4, ry + 0.4, h.rz + 0.4); g.translate(x, y, h.z);
    finish(soft(g), '#f8f8f8', 'cloth');
    const r = new T.TorusGeometry(1, 0.02, 6, 40);
    r.rotateX(Math.PI / 2); r.scale(rx + 0.5, 30, h.rz + 0.5); r.translate(x, y, h.z);
    finish(soft(r), '#303038', 'cloth');
  },
  skull: (d, L) => {
    const [x, y, rx, ry] = L.head, h = hosts[0];
    const g = new T.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    g.scale(rx + 3, ry + 3, h.rz + 3); g.translate(x, y + 2, h.z);
    finish(soft(g), '#e8e0d0', 'cloth');
    hosts.push({ x, y: y + 2, rx: rx + 3, ry: ry + 3, rz: h.rz + 3, z: h.z });
    for (const s of [-1, 1]) PEN.shape([[x + s * (rx - 6), y + ry - 6], [x + s * (rx + 2), y + ry + 12], [x + s * (rx - 12), y + ry]], '#e8e0d0');
    PEN.flat(x - 11, y + 5, 7, 5, '#3a3030'); PEN.flat(x + 11, y + 5, 7, 5, '#3a3030');
  },
  swirl: (d, L) => {
    const [x, y] = L.head, pts = [];
    PEN.flat(x, y - 14, 15, 13, '#f8f8f8');
    for (let a = 0; a < Math.PI * 5; a += 0.25) { const r = 1 + a * 1.7; pts.push([x + Math.cos(a) * r * 0.9, y - 14 + Math.sin(a) * r * 0.75]); }
    PEN.line(pts, '#303038', 2);
  },
  leaves: (d, L) => {
    const [x, y, , ry] = L.head, prev = layer;
    layer = 'ear';
    for (const [a, l] of [[-0.6, 26], [-0.2, 30], [0.2, 30], [0.6, 26], [0, 22]]) PEN.puff(x + Math.sin(a) * l / 2, y + ry - 6 + Math.cos(a) * l / 2, 6, l / 2, d.leafc, a);
    layer = prev;
  },
  crescent: (d, L) => {
    const [x, y, , ry] = L.head, g = new T.TorusGeometry(5.5, 1.3, 8, 20, Math.PI * 1.3);
    g.rotateZ(Math.PI * 1.35); g.translate(x, y + ry - 10, 0);
    place(g, hexOf(d.moon), 1.3);
  },
};

/** Eyes, cheeks and mouth, as buttons and stitches. */
function face3(d, L) {
  const [hx, hy] = L.head, [ex, ey] = L.eye, mouthY = L.mouth ?? hy - 9, eye = d.eye || '#202028';
  if (d.cheeks) for (const s of [-1, 1]) PEN.flat(hx + s * (ex + 10), ey - 9, 5.5, 3.8, d.cheeks);
  for (const s of d.one ? [0] : [-1, 1]) {
    const x = hx + s * ex;
    if (d.eyes === 'shut') { PEN.curve([x - 5, ey], [x, ey - 3], [x + 5, ey], '#2a2028', 1.8); continue; }
    if (d.eyes === 'dot') { PEN.flat(x, ey, 2.4, 2.4, eye, 0, 'gloss'); PEN.flat(x - 0.8, ey + 0.9, 0.8, 0.8, '#ffffff', 0, 'gloss'); continue; }
    if (d.eyes === 'white') { PEN.flat(x, ey, 6, 7, '#ffffff'); PEN.flat(x + s * 0.5, ey - 0.5, 1.8, 1.8, '#202028', 0, 'gloss'); continue; }
    const rx = d.eyes === 'big' ? 6 : 4.6, ry = rx * 1.3;
    PEN.flat(x, ey, rx, ry, eye, 0, 'gloss');
    if (d.eyes === 'slant') PEN.flat(x + s * 1, ey + ry * 0.9, rx * 1.4, ry * 0.45, d.head || d.body, s * -0.45);
    PEN.flat(x - rx * 0.32, ey + ry * 0.38, rx * 0.34, rx * 0.34, '#ffffff', 0, 'gloss');
  }
  const ink = '#3a1a20';
  switch (d.mouth || 'smile') {
    case 'smile': PEN.curve([hx - 4, mouthY + 1], [hx, mouthY - 3], [hx + 4, mouthY + 1], ink, 1.4); break;
    case 'w': PEN.curve([hx - 5, mouthY + 1], [hx - 2.5, mouthY - 2.5], [hx, mouthY], ink, 1.3); PEN.curve([hx, mouthY], [hx + 2.5, mouthY - 2.5], [hx + 5, mouthY + 1], ink, 1.3); break;
    case 'open': PEN.flat(hx, mouthY - 2, 4.5, 3.2, '#b83848'); break;
    case 'grin': PEN.flat(hx, mouthY - 1, 13, 5, '#ffffff'); PEN.line([[hx - 11, mouthY - 1], [hx + 11, mouthY - 1]], '#a0a0a8', 0.8); break;
    case 'line': PEN.line([[hx - 4, mouthY], [hx + 4, mouthY]], ink, 1.3); break;
    case 'lips': PEN.puff(hx, mouthY - 1, 5, 3, d.lipc || '#d878c0'); break;
  }
}

/** Sews pattern `d` into kit `kit` (js/base-mesh.js's: put, cloth, gloss), `size` painted units tall. */
export function sewPlush(THREE, kit, d, size) {
  T = THREE; K = kit; hosts = []; bumps = [];
  const k = size / 100 / 32;
  finish = (g, hex, kind) => {
    g.scale(k, k, k);
    K.put(g, kind === 'gloss' ? K.gloss(hex) : K.cloth(hex));
  };
  const build = d.shape || 'biped', L = BUILDS[build], Z = DEPTH[build], body = d.body, head = d.head || body;
  const feet = d.feet || sh(body, -1), arms = d.arms || body;
  const stuff = (part, [share, z], c, wide = 1) => {
    const [x, y, rx0, ry] = part, rx = rx0 * wide, rz = rx0 * share;
    const g = new T.SphereGeometry(1, 32, 22);
    g.scale(rx, ry, rz); g.translate(x, y, z);
    finish(soft(g), hexOf(c), 'cloth');
    return { x, y, rx, ry, rz, z };
  };
  hosts.push(stuff(L.head, Z.head, head));
  if (L.body) hosts.push(stuff(L.body, Z.body, body, Z.bodyW || 1));
  const trunk = hosts[1] || hosts[0];
  sewWith(PEN);
  try {
    layer = 'under';
    for (const e of d.under || []) (EXTRAS3[e] || EXTRAS[e])(d, L);
    if (d.tail) { layer = 'tail'; tailRoot = [L.tail[0], trunk.z - trunk.rz * 0.6]; tail(d.tail, L.tail, d.tailc || body, d.tailtip); }
    if (d.ears) { layer = 'ear'; for (const s of [-1, 1]) ear(d.ears, s, L.ear, d.earc || head, d.eartip, d.earin); }
    layer = 'front';
    if (L.belly && d.belly) PEN.puff(L.belly[0], L.belly[1], L.belly[2], L.belly[3], d.belly);
    for (const e of d.mid || []) (EXTRAS3[e] || EXTRAS[e])(d, L);
    layer = 'free';
    for (const [x0, y, rx, ry] of L.feet) {
      const [x, z] = Z.feet(x0), g = new T.SphereGeometry(1, 20, 14);
      g.scale(rx, ry, rx * 1.2); g.translate(x, y, z);
      finish(soft(g), hexOf(feet), 'cloth');
    }
    if (!d.noarms) for (const [x, y, rx, ry, rot] of L.arms) {
      const g = new T.SphereGeometry(1, 20, 14);
      g.scale(rx, ry, rx * 1.1); g.rotateZ(-rot); g.translate(x, y, Z.arms);
      finish(soft(g), hexOf(arms), 'cloth');
    }
    layer = 'front';
    for (const e of d.top || []) (EXTRAS3[e] || EXTRAS[e])(d, L);
    face3(d, L);
  } finally { sewWith(null); }
}
