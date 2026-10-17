/* base-models-pikachu.js  -  the Pikachu room's models (furniture expansion session a, 2026-10-17), built from parts
   like the friends' pieces (js/base-models-f.js's head says how a batch works). Their store pictures are
   js/base-furniture-pikachu.js, whose shapes (the ear, the tail, the bolt, the turned stands) both read, so model and
   painting agree. Sizes are painted units (`u`), x round the piece's middle, y up from the floor; a wall piece's are
   units across its strip and down from its top, as js/base-models-w.js's. All in Pikachu's own colours, no theme. */

import { pokeBall } from './base-models-kit.js';
import { PIKA, PIKAD, CHEEK, INK, BROWN, CREAM, KETCHUP, WHITE, GLOW, NEON, NAVY, STONE, BOOKS, TIP, earR, TAIL_ROOT, TAIL_TOP,
  BOLT, CASE, inset, SHELVES, LIGHTSTAND, STONESTAND, KETCHUP_BOTTLE, NEON_EARS } from './base-furniture-pikachu.js';

const u = (n) => n / 32;
const TAU = Math.PI * 2;

/* ----- parts ----- */

/** A flat shape from points in units (y up), `t` units thick, its middle at z 0. */
function slab(L, pts, t, holes = []) {
  const { THREE } = L, b = Math.min(u(0.3), u(t) / 4), toV = (p) => p.map(([a, d]) => new THREE.Vector2(u(a), u(d)));
  const s = new THREE.Shape(toV(pts));
  for (const h of holes) s.holes.push(new THREE.Path(toV(h)));
  const g = new THREE.ExtrudeGeometry(s, { depth: u(t) - b * 2, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 8 });
  return g.translate(0, 0, -(u(t) - b * 2) / 2);
}
/** The tail, `s` units a unit, `t` thick: [its brown root, its yellow zigzag], standing on 0, mirrored when `flip`. */
const tailParts = (L, s, t, flip = false) => [TAIL_ROOT, TAIL_TOP].map(p => slab(L, p.map(([a, d]) => [a * s * (flip ? -1 : 1), d * s]), t));
/** A lightning bolt `w` x `h`, `t` thick, standing on 0 round x 0. */
const boltGeo = (L, w, h, t) => slab(L, BOLT.map(([a, d]) => [(a - 0.5) * w, d * h]), t);
/** An ellipsoid, radii in units. */
const egg = (L, rx, ry, rz, w = 24, h = 16) => L.ball(u(rx), w, h).scale(1, ry / rx, rz / rx);
/** Where the front of an ellipsoid centred (cx, cy, cz) is at (x, y), all in units. */
const ez = (cx, cy, cz, rx, ry, rz) => (x, y) => cz + rz * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2));

/** An ear's two parts along +y, `len` long, `w` its half-width, `flat` its thickness's share: [yellow, black tip]. */
function earGeos(L, len, w, flat = 0.45) {
  const turn = (t0, t1) => {
    const pts = [];
    for (let i = 0; i <= 5; i++) { const t = t0 + (t1 - t0) * i / 5; pts.push([u(earR(t) * w), u(t * len)]); }
    return L.lathe(pts, 12).scale(1, 1, flat);
  };
  return [turn(0, TIP), turn(TIP, 1)];
}
/** A pair of ears on `put`, their bases `gap` either side of x at (y, z), leant `ang` out; `soft` in cloth. */
function ears(K, L, put, x, y, z, gap, len, w, ang, soft = false) {
  const fur = soft ? K.cloth(PIKA) : K.gloss(PIKA), tip = soft ? K.cloth(INK) : K.gloss(INK);
  for (const sx of [-1, 1]) {
    const [a, b] = earGeos(L, len, w);
    put(a.rotateZ(-sx * ang), fur, u(x + sx * gap), u(y), u(z));
    put(b.rotateZ(-sx * ang), tip, u(x + sx * gap), u(y), u(z));
  }
}
/** Pikachu's face round (x, y), `s` its size (1 for a head 12 units round), each feature on the surface `zAt(x, y)`. */
function face(K, L, put, x, y, s, zAt, { eyes = true, mouth = true, cheeks = true } = {}) {
  const at = (px, py) => { const ax = x + px * s, ay = y - py * s; return [u(ax), u(ay), u(zAt(ax, ay))]; };
  const ink = K.gloss(INK), white = K.gloss('#ffffff');
  for (const sx of [-1, 1]) {
    if (eyes) {
      put(L.ball(u(2.2 * s), 10, 6).scale(1, 1.15, 0.45), ink, ...at(sx * 5, -1.5));
      const [gx, gy, gz] = at(sx * 5 - 0.7, -2.3);
      put(L.ball(u(0.8 * s), 8, 6).scale(1, 1, 0.5), white, gx, gy, gz + u(0.9 * s));
    }
    if (cheeks) put(L.ball(u(3 * s), 10, 6).scale(1, 1, 0.3), K.gloss(CHEEK), ...at(sx * 8.5, 3));
  }
  if (!mouth) return;
  put(L.ball(u(0.6 * s), 8, 6).scale(1, 0.8, 0.6), ink, ...at(0, 0.8));
  for (const sx of [-1, 1]) put(L.torus(u(1.2 * s), u(0.3 * s), Math.PI - 0.3, 8).rotateZ(Math.PI + 0.15), ink, ...at(sx * 1.2, 2.2));
}
/** A lathe from [radius, height] points in units. */
const turned = (L, pts, seg = 28) => L.lathe(pts.map(([r, y]) => [u(r), u(y)]), seg);
/** A disc facing +z, r units round, t thick. */
const disc = (L, r, t, seg = 20) => L.cyl(u(r), u(t), u(r), seg).rotateX(Math.PI / 2);
/** A closed neon tube through points (x, y, z in tiles), r round. */
function neon(L, pts, r, smooth = true) {
  const { THREE } = L, v = pts.map(p => new THREE.Vector3(...p));
  let curve;
  if (smooth) curve = new THREE.CatmullRomCurve3(v, true);
  else { curve = new THREE.CurvePath(); v.forEach((p, i) => curve.add(new THREE.LineCurve3(p, v[(i + 1) % v.length]))); }
  return new THREE.TubeGeometry(curve, smooth ? 40 : 70, r, 6, true);
}

export const SHAPES = {
  pikabed: { make: 'pikabed', seat: 0.75 },
  pikaarmchair: { make: 'pikaarmchair', seat: 0.55 },
  pikasofa: { make: 'pikasofa', seat: 0.58 },
  pikatable: { make: 'pikatable', top: 0.47 },
  pikadesk: { make: 'pikadesk', top: 0.81 },
  pikawardrobe: { make: 'pikawardrobe', play: { does: 'door', inside: 'clothes' } },
  pikadresser: { make: 'pikadresser', top: 0.93 },
  pikabookcase: { make: 'pikabookcase' },
  pikalamp: { make: 'pikalamp', play: { does: 'light' } },
  pikaclock: { make: 'pikaclock', play: { does: 'chime' } },
  pikatv: { make: 'pikatv', screen: { x: 0, y: u(32), w: u(35), h: u(22), z: u(5) }, play: { does: 'screen', show: ['cartoon', 'battle', 'quiz', 'weather', 'news'] } },
  pikamirror: { make: 'pikamirror' },
  pikaneon: { make: 'pikaneon', play: { does: 'light' } },
  pikafridge: { make: 'pikafridge', play: { does: 'door', inside: 'fridge' } },
  pikalightball: { make: 'pikalightball', play: { does: 'light' } },
  pikathunderstone: { make: 'pikathunderstone', play: { does: 'zap' } },
  pikapouf: { make: 'pikapouf', seat: 0.5 },
  pikatoybox: { make: 'pikatoybox', top: 0.76, play: { does: 'treasure' } },
  pikarocker: { make: 'pikarocker', play: { does: 'rock' } },
  pikapetbed: { make: 'pikapetbed', seat: 0.16 },
  pikaspeaker: { make: 'pikaspeaker', play: { does: 'note', voice: 'bass', low: true, thump: true } },
  pikawallshelf: { make: 'pikawallshelf' },
  pikanightstand: { make: 'pikanightstand', top: 0.875 },
};

export const MAKES = {
  pikabed(K, s, W, D, L) {
    const { rbox, blob, cyl } = L, yel = K.gloss(PIKA), yd = K.gloss(PIKAD), brown = K.gloss(BROWN);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(u(2), u(4), u(2), 12), brown, u(28 * sx), u(2), u(27 * sz));
    // the headboard: Pikachu's head on a board behind the mattress
    K.put(rbox(u(44), u(30), u(3), u(1)), yd, 0, u(19), u(-29.5));
    K.put(egg(L, 22, 18, 5), yel, 0, u(46), u(-27));
    ears(K, L, K.put, 0, 60, -27, 9, 28, 5, 0.45);
    face(K, L, K.put, 0, 46, 22 / 12, ez(0, 46, -27, 22, 18, 5));
    // the frame, the mattress, two cheek pillows, the duvet with its back stripes, the tail up at the foot
    K.put(rbox(u(60), u(10), u(60), u(1.5)), yd, 0, u(9), 0);
    K.put(rbox(u(56), u(6), u(56), u(1.5)), K.cloth(CREAM), 0, u(17), 0);
    for (const sx of [-1, 1]) K.put(blob(u(16), u(10), u(7), 0.6, 0.6, 16), K.cloth(CHEEK), u(12 * sx), u(24), u(-22));
    K.put(blob(u(60), u(8), u(40), 0.3, 0.5, 24), K.cloth(PIKA), 0, u(21), u(9));
    for (const z of [-2, 6]) K.put(blob(u(60.6), u(8.4), u(4), 0.3, 0.5, 16), K.cloth(BROWN), 0, u(21), u(z));
    const [root, top] = tailParts(L, 0.8, 3);
    K.put(top, yel, u(14), u(14), u(26)); K.put(root, brown, u(14), u(14), u(26));
  },

  pikaarmchair(K, s, W, D, L) {
    const { blob, ball } = L, fur = K.cloth(PIKA), brown = K.gloss(BROWN);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(ball(u(2), 10, 8), brown, u(10 * sx), u(2), u(9 * sz));
    K.put(blob(u(28), u(13), u(26), 0.55, 0.5, 16), fur, 0, u(9.5), 0);
    K.put(blob(u(24), u(14), u(8), 0.5, 0.5, 16), fur, 0, u(16), u(-8));
    K.put(blob(u(20), u(4), u(18), 0.5, 0.5, 16), K.cloth(CREAM), 0, u(16.5), u(3));
    for (const sx of [-1, 1]) {
      K.put(blob(u(6), u(9), u(22), 0.6, 0.6, 12), fur, u(12 * sx), u(19), u(1));
      K.put(ball(u(2.6), 10, 8).scale(1, 0.8, 1), fur, u(12 * sx), u(23.5), u(11));
    }
    // the back: Pikachu's head, its tail peeking out behind
    K.put(egg(L, 13, 12, 5, 20, 12), fur, 0, u(30), u(-8));
    ears(K, L, K.put, 0, 40, -8, 5.5, 17, 3.6, 0.4, true);
    face(K, L, K.put, 0, 30, 13 / 12, ez(0, 30, -8, 13, 12, 5));
    const [root, top] = tailParts(L, 0.55, 2.5);
    K.put(top, K.gloss(PIKA), u(6), u(12), u(-12)); K.put(root, brown, u(6), u(12), u(-12));
  },

  pikasofa(K, s, W, D, L) {
    const { rbox, blob, cyl } = L, fur = K.cloth(PIKA), brown = K.gloss(BROWN);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(u(2), u(3), u(2), 12), brown, u(25 * sx), u(1.5), u(9 * sz));
    K.put(rbox(u(54), u(10), u(26), u(2)), K.cloth(PIKAD), 0, u(8), 0);
    // the back with Pikachu's two stripes across it, its ears up at the corners
    K.put(blob(u(54), u(22), u(8), 0.4, 0.5, 24), fur, 0, u(23), u(-9));
    for (const y of [28.5, 23.5]) K.put(rbox(u(48), u(3), u(1), u(0.4)), K.cloth(BROWN), 0, u(y), u(-4.6));
    ears(K, L, K.put, 0, 32, -9, 21, 22, 4.5, 0.3, true);
    for (const sx of [-1, 1]) {
      K.put(blob(u(24), u(7), u(22), 0.4, 0.5, 16), fur, u(12.5 * sx), u(16), u(2));
      // a rolled arm, its round end a red cheek
      K.put(rbox(u(8), u(12), u(26), u(3)), fur, u(25 * sx), u(13), 0);
      K.put(cyl(u(5), u(26), u(5), 20).rotateX(Math.PI / 2), fur, u(25 * sx), u(19), 0);
      K.put(disc(L, 4, 0.8), K.gloss(CHEEK), u(25 * sx), u(19), u(13.3));
    }
  },

  pikatable(K, s, W, D, L) {
    const { cyl, ball, torus } = L, yel = K.gloss(PIKA), ink = K.gloss(INK);
    for (const sx of [-1, 1]) K.put(boltGeo(L, 12, 10, 10), K.gloss(PIKAD), u(12 * sx), 0, 0);
    // the top: an oval face looking up, its ears laid flat out to the sides
    K.put(cyl(u(22), u(5), u(22), 40).scale(1, 1, 13 / 22), yel, 0, u(12.5), 0);
    for (const sx of [-1, 1]) {
      const [a, b] = earGeos(L, 15, 3.5, 1);
      for (const [geo, m] of [[a, yel], [b, ink]]) K.put(geo.scale(0.6, 1, 1).rotateZ(-sx * Math.PI / 2).rotateY(sx * 0.35), m, u(17 * sx), u(13), u(-3));
      K.put(cyl(u(2.6), u(0.8), u(2.6), 16), ink, u(7 * sx), u(15.3), u(-3));
      K.put(ball(u(0.9), 8, 6).scale(1, 0.5, 1), K.gloss('#ffffff'), u(7 * sx - 0.8), u(15.8), u(-3.8));
      K.put(cyl(u(3.5), u(0.6), u(3.5), 16), K.gloss(CHEEK), u(13 * sx), u(15.3), u(4));
      K.put(torus(u(1.2), u(0.3), Math.PI - 0.3, 8).rotateZ(Math.PI + 0.15).rotateX(-Math.PI / 2), ink, u(1.3 * sx), u(15.1), u(2.8));
    }
    K.put(ball(u(0.7), 8, 6), ink, 0, u(15.1), u(1));
  },

  pikadesk(K, s, W, D, L) {
    const { rbox, ball } = L, yel = K.gloss(PIKA), brown = K.gloss(BROWN);
    K.put(rbox(u(62), u(4), u(30), u(1)), K.gloss(PIKAD), 0, u(24), 0);
    // the pedestal: two drawers, a brown stripe between them, cheek-red knobs
    K.put(rbox(u(20), u(22), u(28), u(1.5)), yel, u(-20), u(11), 0);
    for (const y of [16.5, 6]) {
      K.put(rbox(u(17), u(9), u(1.2), u(0.8)), K.gloss(L.tone(PIKA, 1.12)), u(-20), u(y), u(14.4));
      K.put(ball(u(1.6), 10, 8), K.gloss(CHEEK), u(-20), u(y), u(15.4));
    }
    K.put(rbox(u(20.4), u(2.4), u(28.4), u(0.4)), brown, u(-20), u(11), 0);
    // the other leg: the tail, as deep as the desk
    const [root, top] = tailParts(L, 0.58, 26);
    K.put(top, yel, u(16), 0, 0); K.put(root, brown, u(16), 0, 0);
    ears(K, L, K.put, 0, 26, -12, 24, 18, 4, 0.25);
  },

  pikawardrobe(K, s, W, D, L) {
    const { rbox, ball } = L, yel = K.gloss(PIKA), brown = K.gloss(BROWN);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(ball(u(2), 10, 8), brown, u(10 * sx), u(2), u(7 * sz));
    K.put(rbox(u(28), u(52), u(22), u(4)), yel, 0, u(30), u(-1));
    for (const y of [28.75, 20.75]) K.put(rbox(u(26), u(2.5), u(0.6), u(0.2)), brown, 0, u(y), u(-12.2));
    ears(K, L, K.put, 0, 54, -1, 7, 18, 4, 0.35);
    // the door, Pikachu's face on it
    const door = K.door([u(-12), u(10.8)], 1);
    door(rbox(u(24), u(46), u(1.6), u(1)), K.gloss(L.tone(PIKA, 1.1)), 0, u(30), u(10.8));
    face(K, L, door, 0, 41, 1.2, () => 11.6);
    door(ball(u(1.5), 10, 8), K.gloss(CHEEK), u(9.5), u(26), u(12));
    K.inside = { x: 0, y: u(30), w: u(22), h: u(42), z: u(10.05) };
  },

  pikadresser(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, brown = K.gloss(BROWN), light = K.gloss(L.tone(PIKA, 1.12));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(u(2), u(3), u(2), 12), brown, u(26 * sx), u(1.5), u(9 * sz));
    K.put(rbox(u(60), u(25), u(26), u(2)), K.gloss(PIKA), 0, u(15.5), 0);
    K.put(rbox(u(62), u(2), u(28), u(1)), K.gloss(PIKAD), 0, u(29), 0);
    for (const y of [10.75, 18.25]) K.put(rbox(u(60.4), u(1.6), u(26.4), u(0.3)), brown, 0, u(y), 0);
    for (const y of [7, 14.5, 22]) for (const sx of [-1, 1]) {
      K.put(rbox(u(26), u(6.4), u(1), u(0.8)), light, u(14 * sx), u(y), u(13.5));
      K.put(ball(u(1.6), 10, 8), K.gloss(CHEEK), u(14 * sx), u(y), u(14.4));
    }
    ears(K, L, K.put, 0, 30, -9, 24, 15, 3.5, 0.3);
  },

  pikabookcase(K, s, W, D, L) {
    const { rbox } = L, yel = K.gloss(PIKA);
    // a bolt stood on its point: a back, the bolt's walls round it, three shelves of books
    K.put(rbox(u(12), u(2), u(12), u(0.6)), K.gloss(BROWN), u(-7.5), u(1), 0);
    K.put(slab(L, CASE, 2), K.gloss(L.tone(PIKAD, 0.8)), 0, 0, u(-5));
    K.put(slab(L, CASE, 12, [inset(CASE, 2)]), yel, 0, 0, 0);
    let n = 0;
    for (const [y, x0, x1, hgt] of SHELVES) {
      K.put(rbox(u(x1 - x0), u(1.6), u(10), u(0.4)), yel, u((x0 + x1) / 2), u(y - 0.8), 0);
      let i = 0;
      for (let bx = x0 + 0.6; bx < x1 - 1.5; bx += 2.2) {
        const h = hgt - (i % 3) * 0.8;
        K.put(rbox(u(2), u(h), u(7), u(0.3)), K.plain(BOOKS[(n + i) % BOOKS.length]), u(bx + 1), u(y + h / 2), u(-1), 0, 0, (i % 5 === 4 ? 0.12 : 0));
        i++;
      }
      n += 2;
    }
  },

  pikalamp(K, s, W, D, L) {
    K.put(L.cyl(u(11), u(3), u(12), 24), K.gloss(BROWN), 0, u(1.5), 0);
    const [root, top] = tailParts(L, 1.3, 4);
    K.put(top, K.gloss(PIKA), u(-9), u(3), 0); K.put(root, K.gloss(BROWN), u(-9), u(3), 0);
    K.put(L.cyl(u(4), u(3), u(4), 16), K.gloss(PIKAD), u(4), u(55.5), 0);
    K.put(L.ball(u(8), 20, 14), K.glow(GLOW), u(4), u(63), 0);
  },

  pikaclock(K, s, W, D, L) {
    const ink = K.gloss(INK), y = (j) => 96 - j, zAt = ez(0, y(40), 1.5, 13, 11, 4);
    K.put(egg(L, 13, 11, 4), K.gloss(PIKA), 0, u(y(40)), u(1.5));
    ears(K, L, K.put, 0, y(31), 1.5, 6, 17, 3.8, 0.42);
    face(K, L, K.put, 0, y(39), 13 / 12, zAt, { mouth: false, cheeks: false });
    for (const sx of [-1, 1]) K.put(L.ball(u(2.8), 12, 8).scale(1, 1, 0.3), K.gloss(CHEEK), u(9.5 * sx), u(y(44.5)), u(zAt(9.5 * sx, y(44.5))));
    // the dial where its mouth would be: four marks, its hands at a quarter to twelve-ish
    const dz = zAt(0, y(43.5)) + 0.2;
    K.put(disc(L, 6.5, 1, 28), K.gloss(CREAM), 0, u(y(43.5)), u(dz));
    for (let h = 0; h < 4; h++) K.put(L.ball(u(0.6), 6, 4), ink, u(Math.sin(h * Math.PI / 2) * 5), u(y(43.5) + Math.cos(h * Math.PI / 2) * 5), u(dz + 0.5));
    K.put(L.rbox(u(0.9), u(4.2), u(0.4), u(0.15)), ink, u(0.05), u(y(41.6)), u(dz + 0.6));
    K.put(L.rbox(u(3.4), u(0.9), u(0.4), u(0.15)), ink, u(1.7), u(y(43.55)), u(dz + 0.7));
    K.put(L.ball(u(0.9), 8, 6), K.gloss(CHEEK), u(0.4), u(y(43.5)), u(dz + 0.8));
  },

  pikatv(K, s, W, D, L) {
    const { rbox } = L, ink = K.gloss(INK), brown = K.gloss(BROWN);
    // the stand: a Poké Ball, red over white, its black band and button
    K.put(rbox(u(56), u(7), u(26), u(2)), K.gloss('#f4f4f0'), 0, u(3.5), 0);
    K.put(rbox(u(56), u(7), u(26), u(2)), K.gloss('#e84838'), 0, u(10.5), 0);
    K.put(rbox(u(56.4), u(1.6), u(26.4), u(0.4)), ink, 0, u(7), 0);
    K.put(disc(L, 4, 1), ink, 0, u(7), u(13.2));
    K.put(disc(L, 3.2, 1.2), K.gloss('#ffffff'), 0, u(7), u(13.5));
    // the set: Pikachu's head, its screen, red cheeks either side, its ears up top
    K.put(rbox(u(54), u(34), u(14), u(6)), K.gloss(PIKA), 0, u(31), u(-3));
    for (const y of [36.75, 28.75]) K.put(rbox(u(52), u(2.5), u(0.6), u(0.2)), brown, 0, u(y), u(-10.2));
    K.put(rbox(u(38), u(25), u(1), u(0.8)), ink, 0, u(32), u(4.4));
    K.put(new L.THREE.PlaneGeometry(u(35), u(22)), K.gloss('#24345a'), 0, u(32), u(4.95));
    for (const sx of [-1, 1]) K.put(disc(L, 4.2, 0.6), K.gloss(CHEEK), u(22 * sx), u(27), u(4.2));
    face(K, L, K.put, 0, 16.6, 0.7, () => 4.1, { eyes: false, cheeks: false });
    ears(K, L, K.put, 0, 46, -3, 15, 22, 5, 0.5);
  },

  pikamirror(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, yel = K.gloss(PIKA);
    for (const sx of [-1, 1]) {
      K.put(rbox(u(7), u(3), u(18), u(1.2)), K.gloss(BROWN), u(12 * sx), u(1.5), 0);
      K.put(cyl(u(2), u(40), u(2), 12), yel, u(12 * sx), u(22), 0);
      K.put(ball(u(2.4), 12, 10), K.gloss(CHEEK), u(12 * sx), u(40), 0);
    }
    // the oval frame, the glass in it, Pikachu's ears on top
    const oval = (rx, ry) => { const p = new THREE.Path(); p.absellipse(0, 0, u(rx), u(ry), 0, TAU, false); return p.getPoints(40).map(v => [v.x * 32, v.y * 32]); };
    K.put(slab(L, oval(10, 15), 3, [oval(7.6, 12.6)]), yel, 0, u(40), 0);
    const glass = new THREE.MeshStandardMaterial({ color: '#cfe6f2', roughness: 0.08, metalness: 0.75, emissive: '#5a7488', emissiveIntensity: 0.35 });
    glass.userData.kind = 'plain';
    K.put(new THREE.CircleGeometry(u(7.8), 32).scale(1, 12.8 / 7.8, 1), glass, 0, u(40), u(0.3));
    K.put(new THREE.CircleGeometry(u(7.8), 32).scale(1, 12.8 / 7.8, 1).rotateY(Math.PI), K.gloss(PIKAD), 0, u(40), u(-0.3));
    ears(K, L, K.put, 0, 54, 0, 4.5, 16, 3.4, 0.35);
  },

  pikaneon(K, s, W, D, L) {
    // painted units across the strip from its middle, and up from the floor
    const x = (i) => u(i - 32), y = (j) => u(96 - j), z = u(3.2), r = u(0.9), lit = K.glow(NEON);
    K.put(L.rbox(u(56), u(38), u(2), u(1.5)), K.gloss(NAVY), 0, y(40), u(1));
    const loop = (cx, cy, rx, ry, n = 20) => Array.from({ length: n }, (_, k) => [x(cx + Math.cos(k / n * TAU) * rx), y(cy + Math.sin(k / n * TAU) * ry), z]);
    K.put(neon(L, loop(22, 44, 9, 7.5), r), lit);
    for (const pts of NEON_EARS) K.put(neon(L, pts.map(([i, j]) => [x(i), y(j), z]), r, false), lit);
    for (const sx of [-1, 1]) {
      K.put(neon(L, loop(22 + sx * 6, 46.5, 2, 2, 10), r), K.glow(CHEEK));
      K.put(L.ball(u(1.2), 10, 8), lit, x(22 + sx * 4), y(42), z);
    }
    K.put(neon(L, BOLT.map(([a, d]) => [x(38 + a * 16), y(55 - d * 30), z]), r, false), lit);
  },

  pikafridge(K, s, W, D, L) {
    const { THREE, rbox, cyl, ball } = L, red = K.gloss(KETCHUP), white = K.gloss(WHITE);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(ball(u(1.8), 10, 8), K.gloss(BROWN), u(9 * sx), u(1.8), u(7 * sz));
    // a ketchup bottle: its body, round shoulders, neck, cap and nozzle
    K.put(rbox(u(26), u(40), u(22), u(6)), red, 0, u(23), u(-1));
    K.put(new THREE.SphereGeometry(u(13), 24, 8, 0, TAU, 0, Math.PI / 2).scale(1, 8 / 13, 11 / 13), red, 0, u(40), u(-1));
    K.put(cyl(u(4.5), u(6), u(4.5), 16), red, 0, u(50), u(-1));
    K.put(cyl(u(5.4), u(6), u(5.4), 16), white, 0, u(55), u(-1));
    K.put(cyl(u(1.2), u(4), u(2.2), 12), white, 0, u(60), u(-1));
    // the door: a label with Pikachu on it, a handle
    const door = K.door([u(-11.5), u(11.2)], 1);
    door(rbox(u(23), u(34), u(1.6), u(1.5)), K.gloss(L.tone(KETCHUP, 1.12)), 0, u(23), u(11.2));
    door(disc(L, 9, 0.6, 28).scale(1, 10.4 / 9, 1), K.gloss(CREAM), 0, u(24), u(12.2));
    door(egg(L, 5.5, 4.6, 1.5, 16, 10), K.gloss(PIKA), 0, u(23), u(12.5));
    ears(K, L, door, 0, 27, 12.5, 2.4, 7, 1.6, 0.4);
    face(K, L, door, 0, 23, 0.46, ez(0, 23, 12.5, 5.5, 4.6, 1.5));
    door(rbox(u(1.6), u(10), u(2), u(0.6)), white, u(9), u(24), u(12.6));
    K.inside = { x: 0, y: u(23), w: u(20), h: u(30), z: u(10.2) };
  },

  pikalightball(K, s, W, D, L) {
    K.put(turned(L, LIGHTSTAND, 24), K.gloss(PIKA), 0, 0, 0);
    for (const y of [6, 8.6]) K.put(L.cyl(u(6.1), u(1.6), u(6.1), 20), K.gloss(BROWN), 0, u(y), 0);
    ears(K, L, K.put, 0, 10, 0, 6, 17, 3.2, 0.32);
    K.put(L.ball(u(8.5), 20, 14), K.glow(GLOW), 0, u(21), 0);
  },

  pikathunderstone(K, s, W, D, L) {
    const { THREE } = L;
    K.put(turned(L, STONESTAND, 28), K.gloss(PIKA), 0, 0, 0);
    for (const y of [12, 17]) K.put(L.cyl(u(7.1), u(2), u(7.1), 20), K.gloss(BROWN), 0, u(y), 0);
    K.put(L.blob(u(16), u(4), u(16), 0.6, 0.6, 16), K.cloth(CHEEK), 0, u(30.5), 0);
    // the stone: green, faceted, a bolt of yellow in it
    K.put(new THREE.IcosahedronGeometry(u(9), 1).scale(1, 1.15, 0.9), K.gloss(STONE), 0, u(41), 0);
    K.put(boltGeo(L, 8, 12, 1.6), K.gloss('#f8f0a0'), 0, u(35), u(7.2));
  },

  pikapouf(K, s, W, D, L) {
    K.put(L.cyl(u(12), u(3), u(12.5), 24), K.gloss(PIKA), 0, u(1.5), 0);
    K.put(L.blob(u(26), u(13), u(26), 0.85, 0.55, 24), K.cloth(CHEEK), 0, u(9.5), 0);
    K.put(L.ball(u(1.5), 10, 8).scale(1, 0.6, 1), K.gloss(L.tone(CHEEK, 0.75)), 0, u(15.8), 0);
    for (const [sx, y] of [[-7, 5], [0, 6], [7, 5]]) K.put(boltGeo(L, 5, 8, 1), K.gloss(PIKA), u(sx), u(y), u(13 * Math.sqrt(1 - (sx / 13) ** 2) - 0.4), Math.asin(sx / 13));
  },

  pikatoybox(K, s, W, D, L) {
    const { rbox } = L, brown = K.gloss(BROWN);
    K.put(rbox(u(26), u(1), u(20), u(0.3)), brown, 0, u(0.5), 0);
    K.put(rbox(u(28), u(20), u(22), u(2.5)), K.gloss(PIKA), 0, u(11), 0);
    for (const y of [13.8, 7.8]) K.put(rbox(u(26), u(2.4), u(0.6), u(0.2)), brown, 0, u(y), u(-11.2));
    K.put(rbox(u(30), u(4), u(24), u(2)), K.gloss(PIKAD), 0, u(22.5), 0);
    ears(K, L, K.put, 0, 23.5, -4, 8, 15, 3.5, 0.35);
    face(K, L, K.put, 0, 15.5, 1.18, () => 11);
  },

  pikarocker(K, s, W, D, L) {
    const { rbox, blob, ball, torus, cyl } = L, fur = K.gloss(PIKA), brown = K.gloss(BROWN);
    // two curved rockers and their crossbars, a platform on them
    for (const sx of [-1, 1]) K.put(torus(u(38), u(1.6), 0.8, 40), brown, u(9 * sx), u(39.6), 0, Math.PI / 2, 0, -Math.PI / 2 - 0.4);
    for (const sz of [-1, 1]) K.put(cyl(u(1.2), u(18), u(1.2), 10).rotateZ(Math.PI / 2), brown, 0, u(2.8), u(11 * sz));
    K.put(rbox(u(20), u(2.5), u(24), u(1)), brown, 0, u(5), 0);
    // Pikachu sitting up on it: body, stripes, feet, paws, head, ears and tail
    K.put(blob(u(18), u(16), u(20), 0.8, 0.8, 16), fur, 0, u(14), u(-1));
    K.put(blob(u(14), u(2.6), u(8), 0.8, 0.8, 12), brown, 0, u(18), u(-8.5));
    K.put(blob(u(15), u(2.6), u(8), 0.8, 0.8, 12), brown, 0, u(13), u(-9));
    for (const sx of [-1, 1]) {
      K.put(ball(u(3), 12, 8).scale(1, 0.7, 1.3), fur, u(5.5 * sx), u(7.5), u(6));
      K.put(ball(u(2.6), 12, 8), fur, u(5 * sx), u(17), u(8.5));
    }
    K.put(egg(L, 10, 9, 9, 20, 14), fur, 0, u(29), u(3));
    ears(K, L, K.put, 0, 36, 3, 4.5, 15, 3.2, 0.4);
    face(K, L, K.put, 0, 29, 10 / 12, ez(0, 29, 3, 10, 9, 9));
    const [root, top] = tailParts(L, 0.6, 2);
    K.put(top, fur, u(4), u(10), u(-10)); K.put(root, brown, u(4), u(10), u(-10));
  },

  pikapetbed(K, s, W, D, L) {
    const fur = K.cloth(PIKA);
    K.put(L.cyl(u(13), u(2), u(13.5), 28), K.gloss(PIKAD), 0, u(1), 0);
    K.put(L.cyl(u(9), u(2.5), u(9), 24), K.cloth(CREAM), 0, u(3.5), 0);
    K.put(L.torus(u(10.5), u(3.6), TAU, 32).rotateX(Math.PI / 2), fur, 0, u(5), 0);
    // the backrest: Pikachu's head, its ears up
    K.put(egg(L, 11, 9, 3.6, 20, 14), fur, 0, u(13), u(-9));
    ears(K, L, K.put, 0, 20.5, -9, 4.5, 14, 3.2, 0.42, true);
    face(K, L, K.put, 0, 13, 11 / 12, ez(0, 13, -9, 11, 9, 3.6));
  },

  pikaspeaker(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, brown = K.gloss(BROWN);
    K.put(rbox(u(24), u(1.5), u(16), u(0.5)), K.gloss(INK), 0, u(0.75), 0);
    K.put(rbox(u(26), u(36), u(18), u(3)), K.gloss(PIKA), 0, u(19.5), 0);
    for (const y of [30, 24]) K.put(rbox(u(26.2), u(2.6), u(0.6), u(0.2)), brown, 0, u(y), u(-9.2));
    // the cheeks are the woofers, the eyes the tweeters
    for (const sx of [-1, 1]) {
      K.put(disc(L, 4.8, 1, 24), K.gloss(CHEEK), u(7.5 * sx), u(12), u(9.3));
      K.put(ball(u(3), 14, 10).scale(1, 1, 0.3), K.gloss(L.tone(CHEEK, 0.72)), u(7.5 * sx), u(12), u(9.6));
      K.put(ball(u(1.1), 8, 6).scale(1, 1, 0.6), K.gloss(L.tone(CHEEK, 1.2)), u(7.5 * sx), u(12), u(10.3));
    }
    face(K, L, K.put, 0, 25.5, 1.15, () => 9, { cheeks: false });
    ears(K, L, K.put, 0, 36, 0, 7, 17, 3.8, 0.35);
  },

  pikawallshelf(K, s, W, D, L) {
    const { rbox, ball, cyl } = L, x = (i) => u(i - 32), y = (j) => u(96 - j);
    for (const i of [14, 50]) K.put(boltGeo(L, 13, 16, 6), K.gloss(PIKAD), x(i), y(66), u(3));
    K.put(rbox(u(56), u(6), u(10), u(1)), K.gloss(PIKA), 0, y(47), u(5));
    for (const i of [18, 46]) K.put(rbox(u(8), u(6.2), u(0.6), u(0.2)), K.gloss(BROWN), x(i), y(47), u(10.1));
    // on it: a ketchup bottle, a Poké Ball and an apple
    K.put(turned(L, KETCHUP_BOTTLE, 16), K.gloss(KETCHUP), x(14), y(44), u(5));
    K.put(cyl(u(1.4), u(1.6), u(1.4), 12), K.gloss(WHITE), x(14), y(44) + u(10.8), u(5));
    pokeBall(K, L, x(28), y(40), u(5), u(4), '#e84838');
    K.put(ball(u(3.6), 14, 10), K.gloss('#d83030'), x(40), y(40.4), u(5));
    K.put(cyl(u(0.4), u(2), u(0.4), 6), K.gloss(BROWN), x(40.1), y(36.4), u(5));
    K.put(ball(u(1.6), 8, 6).scale(1, 0.5, 0.6), K.gloss('#58b848'), x(41.6), y(36), u(5));
  },

  pikanightstand(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, brown = K.gloss(BROWN);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(cyl(u(1.6), u(4), u(1.6), 12), brown, u(9 * sx), u(2), u(7 * sz));
    K.put(rbox(u(26), u(22), u(22), u(4)), K.gloss(PIKA), 0, u(15), 0);
    K.put(rbox(u(26.3), u(1.6), u(22.3), u(0.3)), brown, 0, u(15.25), 0);
    K.put(rbox(u(27), u(2), u(23), u(1)), K.gloss(PIKAD), 0, u(27), 0);
    for (const y of [20.5, 10]) {
      K.put(rbox(u(21), u(8.5), u(1), u(0.8)), K.gloss(L.tone(PIKA, 1.12)), 0, u(y), u(11.2));
      for (const sx of [-1, 1]) K.put(ball(u(1.6), 10, 8), K.gloss(CHEEK), u(5 * sx), u(y), u(12));
    }
    ears(K, L, K.put, 0, 28, -5, 8, 14, 3.4, 0.3);
  },
};
