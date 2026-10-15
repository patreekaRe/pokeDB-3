/* hub-safari.js  -  the Safari Zone's gate in the Clearing as a real 3D model (the user's ask, 2026-10-15: the painted
   board was bland beside everything else gone 3D): a jungle lodge's gateway. Two lashed log towers on river-stone feet,
   each under a thatched cone with a waving pennant; a thatched roof across them over the SAFARI ZONE board, a big
   Safari Ball crest on its eave fanned with palm fronds; paper lanterns and bunting under the lower beam, tiki torches
   in front, a palm and ferns either side and a bamboo palisade out to the log fence (js/hub-3d.js's safariFence()). A
   plank threshold across the trail. Shut, a rope hangs across it with a CLOSED plank, and nothing is lit.
   safariGate() builds it at the origin, its front towards +z; tick() sways what moves. */
import { fine, texOf, glowing, mergeStatic } from './hub-3d.js';

let T;
export const TOWER_X = 1.72;      // each tower's middle, off the gate's
export const WING_X = 3.0;        // where the bamboo palisade meets the log fence
const POLE_H = 3.1;

const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

function canvasTex(c, repeat) {
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

/** Straw laid in courses: streaks down it, a darker line under each course. */
function thatchArt() {
  const c = new OffscreenCanvas(128, 128), g = c.getContext('2d'), rnd = seeded(5);
  g.fillStyle = '#d8a858'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 420; i++) {
    const x = rnd() * 128, y = rnd() * 128, l = 10 + rnd() * 22;
    g.strokeStyle = ['#f4d488', '#e8bc68', '#b88440', '#9a6a30', '#fbe4a4'][Math.floor(rnd() * 5)];
    g.lineWidth = 1 + rnd() * 1.4;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y + l); g.stroke();
  }
  for (const y of [30, 62, 94, 126]) {
    const s = g.createLinearGradient(0, y - 10, 0, y);
    s.addColorStop(0, 'rgba(90,50,16,0)'); s.addColorStop(1, 'rgba(90,50,16,0.55)');
    g.fillStyle = s; g.fillRect(0, y - 10, 128, 10);
  }
  return c;
}

/** Peeled log: warm wood, its grain running along it, a few knots. */
function barkArt() {
  const c = new OffscreenCanvas(64, 128), g = c.getContext('2d'), rnd = seeded(9);
  const s = g.createLinearGradient(0, 0, 64, 0);
  s.addColorStop(0, '#c88a50'); s.addColorStop(0.5, '#dca46a'); s.addColorStop(1, '#b07840');
  g.fillStyle = s; g.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 64;
    g.strokeStyle = rnd() < 0.6 ? 'rgba(110,62,26,0.35)' : 'rgba(255,228,180,0.3)';
    g.lineWidth = 0.6 + rnd();
    g.beginPath(); g.moveTo(x, rnd() * 128); g.lineTo(x + (rnd() - 0.5) * 4, rnd() * 128); g.stroke();
  }
  for (let i = 0; i < 4; i++) {
    g.fillStyle = 'rgba(80,44,18,0.6)';
    g.beginPath(); g.ellipse(rnd() * 64, rnd() * 128, 2, 3.5, 0, 0, Math.PI * 2); g.fill();
  }
  return c;
}

/** A palm frond, its stalk along the bottom edge's middle from the left (where it joins the crown) to its tip. */
function frondArt() {
  const c = new OffscreenCanvas(256, 64), g = c.getContext('2d');
  g.lineCap = 'round';
  for (let i = 0; i < 34; i++) {
    const t = i / 34, x = 18 + t * 230, len = 28 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08)) + 3;
    for (const side of [-1, 1]) {
      g.strokeStyle = i % 2 ? '#3e9a3a' : '#2e7e30'; g.lineWidth = 5 - t * 2.4;
      g.beginPath(); g.moveTo(x, 32); g.quadraticCurveTo(x + 8, 32 + side * len * 0.5, x + 16, 32 + side * len); g.stroke();
      g.strokeStyle = 'rgba(180,240,120,0.45)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x + 1, 32); g.quadraticCurveTo(x + 8, 32 + side * len * 0.45, x + 14, 32 + side * len * 0.9); g.stroke();
    }
  }
  g.strokeStyle = '#6a8a2a'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(0, 32); g.lineTo(250, 32); g.stroke();
  return c;
}

/** A Safari Ball's skin, wrapped round a sphere: green with darker spots above, a black band, cream below. */
function ballArt() {
  const c = new OffscreenCanvas(256, 128), g = c.getContext('2d'), rnd = seeded(3);
  const top = g.createLinearGradient(0, 0, 0, 64);
  top.addColorStop(0, '#b8e070'); top.addColorStop(1, '#5c9e32');
  g.fillStyle = top; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 26; i++) {
    const x = rnd() * 256, y = 8 + rnd() * 48, r = 4 + rnd() * 8;
    g.fillStyle = '#3a7a26';
    g.beginPath(); g.ellipse(x, y, r * 1.4, r, 0, 0, Math.PI * 2); g.fill();
  }
  const bot = g.createLinearGradient(0, 64, 0, 128);
  bot.addColorStop(0, '#fbf6e2'); bot.addColorStop(1, '#d8ceb0');
  g.fillStyle = bot; g.fillRect(0, 64, 256, 64);
  g.fillStyle = '#1e1e18'; g.fillRect(0, 59, 256, 10);
  return c;
}

/** The pennant: Safari green, a pale pawprint on it. */
function pennantArt() {
  const { c, g, fill, lin } = fine(22, 13, 12);
  fill(lin(0, 0, 22, 0, ['#4cb048', '#2e8434']), () => { g.moveTo(0, 0); g.lineTo(22, 6.5); g.lineTo(0, 13); g.closePath(); });
  fill('rgba(0,0,0,0.18)', () => g.rect(0, 0, 1.6, 13));
  const paw = 'rgba(248,232,150,0.95)';
  fill(paw, () => g.ellipse(7, 7.4, 2.2, 1.8, 0, 0, Math.PI * 2));
  for (const [x, y] of [[4.4, 4.6], [6.2, 3.6], [8.2, 3.7], [9.8, 5.0]]) fill(paw, () => g.arc(x, y, 0.85, 0, Math.PI * 2));
  return c;
}

/** The board over the way in: a dark wooden frame round a green board, SAFARI in cream over Z O N E in gold,
    pawprints and leaves at its corners. Its letters glow a little after dark (shine()). */
function signArt() {
  const W = 56, H = 16, { c, g, fill, rr, lin, shine } = fine(W, H, 12), glow = shine();
  rr(0, 0, W, H, 2.4, lin(0, 0, 0, H, ['#8a5a30', '#5a3418', '#3a2010']));
  rr(1.1, 1.1, W - 2.2, H - 2.2, 1.6, lin(0, 1, 0, H - 1, ['#6ccc5c', '#2e8a36', '#1a5e22']));
  rr(2.2, 1.7, W - 4.4, 0.7, 0.35, 'rgba(255,255,255,0.3)');
  for (const [x, y] of [[1.6, 1.6], [W - 1.6, 1.6], [1.6, H - 1.6], [W - 1.6, H - 1.6]]) {
    fill('#c8a050', () => g.arc(x, y, 0.55, 0, Math.PI * 2));
    fill('#6a4a20', () => g.arc(x + 0.12, y + 0.12, 0.2, 0, Math.PI * 2));
  }
  const leafAt = (x, y, a, s, col) => {
    g.save(); g.translate(x, y); g.rotate(a);
    fill(col, () => { g.moveTo(0, 0); g.quadraticCurveTo(s * 0.5, -s * 0.4, s, 0); g.quadraticCurveTo(s * 0.5, s * 0.4, 0, 0); });
    g.restore();
  };
  for (const [x, y, a] of [[1.2, 11.5, -0.6], [1.2, 12.5, 0.1], [W - 1.2, 11.5, Math.PI + 0.6], [W - 1.2, 12.5, Math.PI - 0.1]]) leafAt(x, y, a, 5, '#3e9a3a');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 8.4px "Trebuchet MS", "Arial Black", sans-serif';
  g.fillStyle = 'rgba(12,48,18,0.75)'; g.fillText('SAFARI', W / 2 + 0.45, 6.75);
  g.fillStyle = '#fff8e0'; g.fillText('SAFARI', W / 2, 6.3);
  glow.textAlign = 'center'; glow.textBaseline = 'middle'; glow.font = g.font;
  glow.fillStyle = '#ffe8b0'; glow.fillText('SAFARI', W / 2, 6.3);
  g.font = '800 3.4px "Trebuchet MS", sans-serif';
  g.fillStyle = '#f8d040'; g.fillText('Z  O  N  E', W / 2, 12.2);
  glow.font = g.font; glow.fillStyle = '#c89a20'; glow.fillText('Z  O  N  E', W / 2, 12.2);
  for (const x of [W / 2 - 11, W / 2 + 11]) {
    fill('#f8d040', () => g.ellipse(x, 12.5, 0.95, 0.8, 0, 0, Math.PI * 2));
    for (const dx of [-0.95, 0, 0.95]) fill('#f8d040', () => g.arc(x + dx, 11.1 - (dx ? 0 : 0.35), 0.4, 0, Math.PI * 2));
  }
  return c;
}

function closedArt() {
  const { c, g, rr, lin } = fine(20, 8, 12);
  rr(0.2, 0.2, 19.6, 7.6, 1.2, lin(0, 0, 0, 8, ['#e0b070', '#b88048', '#8a5a30']));
  g.strokeStyle = 'rgba(60,30,10,0.5)'; g.lineWidth = 0.3; g.strokeRect(0.8, 0.8, 18.4, 6.4);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 4px "Trebuchet MS", "Arial Black", sans-serif'; g.fillStyle = '#a02818'; g.fillText('CLOSED', 10, 4.2);
  return c;
}

/** A plane bent like a frond: arched up off its base and drooping to its tip. */
function frondGeo(len, wide) {
  const geo = new T.PlaneGeometry(len, wide, 8, 1);
  geo.translate(len / 2, 0, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) / len; p.setZ(i, Math.sin(x * Math.PI * 0.9) * len * 0.16 - x * x * len * 0.45); }
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/** The gate, built round the origin, its front towards +z. `open`: the Safari Zone is open (else shut and unlit).
    `glows` takes its lit materials (js/hub-3d.js's glowMats, set by the hour). */
export function safariGate(THREE, { open, glows }) {
  T = THREE;
  const root = new T.Group(), rnd = seeded(17), live = [];
  const add = (geo, m, x = 0, y = 0, z = 0, parent = root, shadow = true) => {
    const o = new T.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = shadow; o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const std = (o) => new T.MeshStandardMaterial({ roughness: 0.9, ...o });
  const lit = (m, k, min = 0) => { m.userData.glow = k; m.userData.glowMin = min; glows.push(m); return m; };

  const barkMap = canvasTex(barkArt(), [1, 1]), thatchMap = canvasTex(thatchArt(), [3, 1]);
  const wood = std({ map: barkMap }), woodDark = std({ color: '#6a4424' });
  const rope = std({ color: '#e0c890' }), stone = std({ color: '#a8a296', flatShading: true }), moss = std({ color: '#7a9a58', flatShading: true });
  const thatch = std({ map: thatchMap, flatShading: true, side: T.DoubleSide }), ridge = std({ color: '#a8743a' });
  const frond = std({ map: canvasTex(frondArt()), alphaTest: 0.5, side: T.DoubleSide, roughness: 0.8 });
  const fern = frond.clone(); fern.color = new T.Color('#c8f0a0');
  const plank = std({ color: '#c89a60' }), plankDark = std({ color: '#a87a44' });

  // the towers: four lashed poles on a river-stone foot, rails between them, a thatched cone with a pennant over it
  const poleGeo = new T.CylinderGeometry(0.075, 0.09, POLE_H, 8), railGeo = new T.CylinderGeometry(0.045, 0.045, 0.62, 6), lashGeo = new T.CylinderGeometry(0.098, 0.098, 0.08, 8);
  const pennants = [];
  for (const side of [-1, 1]) {
    const tx = side * TOWER_X;
    add(new T.CylinderGeometry(0.46, 0.56, 0.42, 9), stone, tx, 0.21, 0);
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2 + rnd(), r = 0.52 + rnd() * 0.08, s = 0.13 + rnd() * 0.1;
      add(new T.DodecahedronGeometry(s, 0), i % 3 ? stone : moss, tx + Math.cos(a) * r, s * 0.6, Math.sin(a) * r).rotation.set(rnd() * 3, rnd() * 3, 0);
    }
    for (const px of [-0.24, 0.24]) for (const pz of [-0.24, 0.24]) {
      add(poleGeo, wood, tx + px, 0.42 + POLE_H / 2 - 0.1, pz);
      for (const y of [0.95, 1.75, 2.55]) add(lashGeo, rope, tx + px, y, pz);
    }
    for (const y of [0.95, 1.75, 2.55]) for (const d of [-0.24, 0.24]) {
      add(railGeo, wood, tx, y, d).rotation.z = Math.PI / 2;
      add(railGeo, wood, tx + d, y, 0).rotation.x = Math.PI / 2;
    }
    // X braces across the tower's front, between its lowest rails
    for (const a of [-1, 1]) add(new T.CylinderGeometry(0.035, 0.035, 0.98, 6), woodDark, tx, 1.35, 0.27).rotation.z = a * 0.62;
    const top = 0.32 + POLE_H;
    add(new T.BoxGeometry(0.8, 0.08, 0.8), plankDark, tx, top, 0);
    add(new T.ConeGeometry(0.74, 0.86, 10, 1, true), thatch, tx, top + 0.4, 0);
    add(new T.CylinderGeometry(0.77, 0.8, 0.1, 10, 1, true), ridge, tx, top + 0.02, 0);
    add(new T.ConeGeometry(0.2, 0.26, 8), ridge, tx, top + 0.78, 0);
    add(new T.SphereGeometry(0.07, 10, 8), std({ color: '#f8d040', metalness: 0.4, roughness: 0.4 }), tx, top + 0.93, 0);
    // a pennant off a pole out of the cone's tip, flying outward
    add(new T.CylinderGeometry(0.018, 0.018, 0.75, 6), woodDark, tx, top + 1.2, 0);
    const pg = new T.PlaneGeometry(0.62, 0.36, 10, 2);
    pg.translate(0.31, 0, 0);
    const pf = add(pg, std({ map: canvasTex(pennantArt()), alphaTest: 0.5, side: T.DoubleSide }), tx, top + 1.38, 0, root, false);
    pf.scale.x = side;
    pf.userData.live = true;
    pennants.push({ mesh: pf, base: pg.attributes.position.array.slice(), side });
  }

  // the span: two logs through the towers, the board between them, a thatched roof over the top one
  const spanW = TOWER_X * 2 + 0.7;
  add(new T.CylinderGeometry(0.13, 0.13, spanW, 10), wood, 0, 2.86, 0).rotation.z = Math.PI / 2;
  add(new T.CylinderGeometry(0.11, 0.11, spanW - 0.2, 10), wood, 0, 1.92, 0).rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) for (const y of [1.92, 2.86]) add(new T.CylinderGeometry(0.135, 0.135, 0.1, 8), rope, side * (TOWER_X - 0.38), y, 0).rotation.z = Math.PI / 2;
  add(new T.BoxGeometry(2.66, 0.86, 0.08), woodDark, 0, 2.39, 0.1);
  const sc = signArt(), sm = std({ map: texOf(sc), roughness: 0.75 });
  glowing(sm, sc, null, '#ffe0a0', open ? 0.9 : 0, glows);
  sm.userData.glowMin = open ? 0.1 : 0;
  add(new T.PlaneGeometry(2.56, 0.73), sm, 0, 2.39, 0.15, root, false);

  // the roof between the towers: two thatched slopes off a bound ridge, a fringe of loose straw along the front eave
  const roofW = TOWER_X * 2 - 0.2, eave = 0.72, rise = 0.6, base = 3.0, ridgeY = base + rise, pitch = Math.atan2(rise, eave), L = Math.hypot(eave, rise) + 0.1;
  for (const s of [-1, 1]) {
    const hinge = new T.Group(), slope = new T.Group();
    hinge.position.set(0, ridgeY, 0); hinge.rotation.y = s < 0 ? Math.PI : 0; slope.rotation.x = pitch;
    hinge.add(slope); root.add(hinge);
    add(new T.BoxGeometry(roofW, 0.14, L), thatch, 0, 0, L / 2, slope);
    add(new T.BoxGeometry(roofW + 0.04, 0.1, 0.12), ridge, 0, -0.01, L - 0.04, slope);
  }
  add(new T.CylinderGeometry(0.1, 0.1, roofW + 0.1, 10), ridge, 0, ridgeY + 0.05, 0).rotation.z = Math.PI / 2;
  for (const x of [-1.3, -0.65, 0, 0.65, 1.3]) add(new T.CylinderGeometry(0.11, 0.11, 0.06, 10), woodDark, x, ridgeY + 0.05, 0).rotation.z = Math.PI / 2;
  const eaveY = ridgeY - L * Math.sin(pitch), eaveZ = L * Math.cos(pitch);
  for (let x = -roofW / 2 + 0.08; x < roofW / 2; x += 0.15) add(new T.ConeGeometry(0.055, 0.15 + rnd() * 0.08, 4), thatch, x, eaveY - 0.12, eaveZ).rotation.x = Math.PI;

  // the crest: a Safari Ball on the eave's middle, fronds fanned out behind it, gold ring round its button
  const crest = new T.Group();
  crest.position.set(0, base + 0.42, 0.7);
  root.add(crest);
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.08 + i / 6 * 0.84), f = add(frondGeo(0.95, 0.34), frond, 0, 0, -0.18, crest, false);
    f.rotation.set(Math.PI / 2 - 0.35, 0, a, 'ZYX');
  }
  const ball = new T.Group();
  crest.add(ball);
  ball.userData.live = true;
  const bm = add(new T.SphereGeometry(0.36, 32, 18), std({ map: canvasTex(ballArt()), roughness: 0.35 }), 0, 0, 0, ball);
  bm.userData.live = true;
  const ring = add(new T.TorusGeometry(0.36, 0.035, 8, 40), std({ color: '#1e1e18', roughness: 0.4 }), 0, 0, 0, ball);
  ring.rotation.x = Math.PI / 2; ring.userData.live = true;
  const disc = (r, d, m, z) => { const o = add(new T.CylinderGeometry(r, r, d, 28), m, 0, 0, z, ball); o.rotation.x = Math.PI / 2; o.userData.live = true; return o; };
  disc(0.135, 0.05, std({ color: '#1e1e18', roughness: 0.4 }), 0.34);
  disc(0.1, 0.06, std({ color: '#f8d040', metalness: 0.5, roughness: 0.3 }), 0.35);
  const btn = lit(std({ color: '#fbf6e2', emissive: new T.Color('#fff4c0'), roughness: 0.3 }), open ? 0.6 : 0);
  disc(0.07, 0.07, btn, 0.36);

  // under the lower beam: two paper lanterns and a string of bunting
  const lanterns = [];
  const glowLamp = open ? lit(std({ color: '#ffd090', emissive: new T.Color('#ffa040'), roughness: 0.6 }), 1.4, 0.25) : std({ color: '#e8b070' });
  for (const x of [-0.95, 0.95]) {
    const hang = new T.Group();
    hang.position.set(x, 1.82, 0.04);
    root.add(hang);
    hang.userData.live = true;
    const parts = [
      add(new T.CylinderGeometry(0.008, 0.008, 0.18, 4), woodDark, 0, -0.09, 0, hang, false),
      add(new T.CylinderGeometry(0.07, 0.07, 0.04, 10), woodDark, 0, -0.19, 0, hang, false),
      add(new T.SphereGeometry(0.13, 14, 10), glowLamp, 0, -0.33, 0, hang, false),
      add(new T.CylinderGeometry(0.06, 0.06, 0.035, 10), woodDark, 0, -0.47, 0, hang, false),
    ];
    parts[2].scale.y = 1.25;
    for (const o of parts) o.userData.live = true;
    lanterns.push(hang);
  }
  const sag = new T.QuadraticBezierCurve3(new T.Vector3(-TOWER_X + 0.3, 1.86, 0.1), new T.Vector3(0, 1.38, 0.18), new T.Vector3(TOWER_X - 0.3, 1.86, 0.1));
  add(new T.TubeGeometry(sag, 20, 0.008, 4), rope, 0, 0, 0, root, false);
  const flagCols = ['#4cb048', '#f8d040', '#fbf6e2', '#e8743a'].map(c => std({ color: c, side: T.DoubleSide }));
  const tri = new T.ShapeGeometry(new T.Shape([new T.Vector2(-0.07, 0), new T.Vector2(0.07, 0), new T.Vector2(0, -0.16)]));
  for (let i = 1; i < 12; i++) {
    const p = sag.getPoint(i / 12);
    add(tri, flagCols[i % 4], p.x, p.y, p.z, root, false);
  }

  // tiki torches out in front of the towers, lit while the Zone is open
  const flames = [];
  const flameM = lit(new T.MeshStandardMaterial({ color: '#ffb040', emissive: new T.Color('#ff8a20'), roughness: 1 }), 1.6, 1);
  const coreM = lit(new T.MeshStandardMaterial({ color: '#fff4b0', emissive: new T.Color('#ffe070'), roughness: 1 }), 1.6, 1);
  for (const side of [-1, 1]) {
    const x = side * 2.42, z = 0.32;
    add(new T.CylinderGeometry(0.035, 0.045, 1.3, 7), std({ color: '#b8a050' }), x, 0.65, z);
    for (const y of [0.3, 0.68, 1.02]) add(new T.CylinderGeometry(0.05, 0.05, 0.035, 7), std({ color: '#8a7432' }), x, y, z);
    add(new T.CylinderGeometry(0.1, 0.06, 0.16, 8), woodDark, x, 1.36, z);
    add(new T.TorusGeometry(0.1, 0.02, 6, 12), rope, x, 1.43, z).rotation.x = Math.PI / 2;
    if (!open) continue;
    const f = add(new T.ConeGeometry(0.085, 0.26, 8), flameM, x, 1.57, z, root, false), core = add(new T.ConeGeometry(0.045, 0.16, 6), coreM, x, 1.53, z + 0.01, root, false);
    f.userData.live = core.userData.live = true;
    flames.push(f, core);
  }

  // the bamboo palisade from each tower out to the log fence, pointed stakes tied with two ropes
  const stake = std({ color: '#c8b060' }), stakeDark = std({ color: '#9a8640' });
  for (const side of [-1, 1]) {
    const x0 = side * (TOWER_X + 0.36), x1 = side * WING_X, n = 8;
    for (let i = 0; i < n; i++) {
      const x = x0 + (x1 - x0) * i / (n - 1), h = 1.25 + Math.sin(i * 1.7) * 0.12 - i * 0.03;
      add(new T.CylinderGeometry(0.06, 0.065, h, 7), i % 2 ? stake : stakeDark, x, h / 2, -0.05);
      add(new T.ConeGeometry(0.06, 0.16, 7), stakeDark, x, h + 0.08, -0.05);
      add(new T.CylinderGeometry(0.066, 0.066, 0.03, 7), stakeDark, x, h * 0.55, -0.05);
    }
    for (const y of [0.4, 0.95]) add(new T.CylinderGeometry(0.018, 0.018, Math.abs(x1 - x0), 5), rope, (x0 + x1) / 2, y, 0.02).rotation.z = Math.PI / 2;
  }

  // a palm either side behind the palisade, ferns round the towers' feet
  const palm = (px, pz, lean) => {
    let x = px, y = 0, a = 0;
    for (let i = 0; i < 7; i++) {
      const len = 0.5, r = 0.13 - i * 0.008;
      a += lean * 0.07;
      const seg = add(new T.CylinderGeometry(r - 0.01, r + 0.01, len, 8), i % 2 ? wood : woodDark, x - Math.sin(a) * len / 2, y + Math.cos(a) * len / 2, pz);
      seg.rotation.z = a;
      x -= Math.sin(a) * len; y += Math.cos(a) * len * 0.98;
    }
    for (let i = 0; i < 9; i++) {
      const f = add(frondGeo(1.35, 0.5), frond, x, y, pz, root, true);
      f.rotation.set(0, i / 9 * Math.PI * 2 + 0.3, 0.3 + (i % 3) * 0.12, 'XYZ');
    }
    for (let i = 0; i < 3; i++) add(new T.SphereGeometry(0.075, 8, 6), woodDark, x + Math.cos(i * 2.1) * 0.1, y - 0.1, pz + Math.sin(i * 2.1) * 0.1);
  };
  palm(-(WING_X + 0.2), -0.45, -1);
  palm(WING_X + 0.1, -0.5, 1);
  const rosette = (px, pz, s) => {
    for (let i = 0; i < 7; i++) {
      const f = add(frondGeo(0.62 * s, 0.26 * s), fern, px, 0.02, pz, root, false);
      f.rotation.set(0, i / 7 * Math.PI * 2 + rnd(), 0.45 + rnd() * 0.3, 'XYZ');
    }
  };
  for (const side of [-1, 1]) { rosette(side * (TOWER_X + 0.6), 0.4, 1); rosette(side * (WING_X - 0.25), 0.22, 0.85); }
  const blossomM = [std({ color: '#f04868' }), std({ color: '#f8a0c8' }), std({ color: '#f8d040' })];
  for (const [x, z, k] of [[-2.15, 0.42, 0], [-2.0, 0.5, 1], [2.2, 0.45, 2], [2.05, 0.36, 0], [-2.8, 0.3, 2], [2.75, 0.32, 1]]) add(new T.SphereGeometry(0.055, 8, 6), blossomM[k], x, 0.2, z, root, false);

  // a plank threshold across the trail
  for (let i = 0; i < 5; i++) add(new T.BoxGeometry(2.3, 0.05, 0.17), i % 2 ? plank : plankDark, 0, 0.025, -0.36 + i * 0.18);
  for (const side of [-1, 1]) add(new T.BoxGeometry(0.06, 0.07, 0.95), woodDark, side * 1.12, 0.035, 0);

  if (!open) {   // a rope across, a CLOSED plank hanging off it
    const across = new T.QuadraticBezierCurve3(new T.Vector3(-TOWER_X + 0.24, 0.95, 0.26), new T.Vector3(0, 0.62, 0.34), new T.Vector3(TOWER_X - 0.24, 0.95, 0.26));
    add(new T.TubeGeometry(across, 20, 0.028, 6), std({ color: '#c83028' }), 0, 0, 0);
    add(new T.PlaneGeometry(0.62, 0.25), std({ map: texOf(closedArt()), side: T.DoubleSide }), 0, 0.6, 0.36, root, false);
  }

  mergeStatic(root, (o) => o.userData.live || o.parent?.userData.live);

  /** The pennants ripple, the ball rocks on its crest, the lanterns sway and the torches flicker; held still when calm. */
  const tick = (now, calm) => {
    const t = calm ? 0 : now / 1000;
    for (const { mesh, base: b } of pennants) {
      const p = mesh.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = b[i * 3], k = x / 0.62;
        p.setZ(i, Math.sin(t * 4 - x * 9) * 0.07 * k);
        p.setY(i, b[i * 3 + 1] - k * 0.04 + Math.sin(t * 3 - x * 7) * 0.015 * k);
      }
      p.needsUpdate = true;
    }
    ball.rotation.z = Math.sin(t * 0.9) * 0.08;
    ball.position.y = Math.sin(t * 1.4) * 0.025;
    lanterns.forEach((l, i) => { l.rotation.z = Math.sin(t * 1.3 + i * 2) * 0.07; l.rotation.x = Math.sin(t * 0.9 + i) * 0.04; });
    flames.forEach((f, i) => {
      const k = calm ? 1 : 0.85 + Math.sin(t * 17 + i * 1.7) * 0.1 + Math.sin(t * 29 + i) * 0.06;
      f.scale.set(1, k, 1);
    });
  };
  tick(0, true);
  return { group: root, tick };
}
