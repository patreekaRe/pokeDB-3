/* base-models-v.js  -  the backyard's fences and playground (js/base-furniture-yard2.js), modelled from parts like the
   arcade cabinets (the user's ask, 2026-10-16: "3D detailed CLEAN models ... optimise them"): js/base-models-f.js's head
   says how a batch works. Each follows its painting pixel for pixel, `u(n)` n of its 32 pixels a tile and `X(n, W)` a
   pixel across it as x from the middle. A fence runs the whole width of its tile across its middle, so a row of them
   meets edge to edge. What moves: the gates and the playhouse door open (K.door), the merry-go-round's top and the
   tetherball turn on the spot (a part whose material carries a `pivot`, its colours riding as vertex colours so it's
   one draw), the tyre hangs on a swing part (K.part) like the swing set's, the lantern pier lights. */

import { tube, pokeBall } from './base-models-kit.js';

const u = (n) => n / 32;
const X = (n, W = 1) => n / 32 - W / 2;
const TAU = Math.PI * 2;
const STONES = ['#a8a49a', '#8e8a82', '#bab4a8', '#9a9488'], STONE = '#b0aca2', MORTAR = '#6e6a62';
const BAMBOO = '#c4c070', INK = '#2c2c34', CHAIN = '#b8bcc6', TYRE = '#34343c', CREAM = '#f8eac0', FLAME = '#f89038',
  FLAME2 = '#f8d038', SKY = '#a8d8f0', SAND = '#ecd6a2', HOOF = '#8a8a92';

/** A flat outline ([x, y] points) extruded `t` along z, centred on z 0. */
function face(L, pts, t, bevel = 0.006) {
  const { THREE } = L, s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, t - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 6 });
  return g.translate(0, 0, -t / 2 + bevel);
}
/** A picket's outline, `hw` half wide and `h` tall, its top rounded. */
const roundTop = (hw, h) => {
  const pts = [[-hw, 0], [hw, 0], [hw, h - hw]];
  for (let i = 1; i < 6; i++) { const a = i / 6 * Math.PI; pts.push([Math.cos(a) * hw, h - hw + Math.sin(a) * hw]); }
  return [...pts, [-hw, h - hw]];
};
/** A round rod from a to b ([x, y, z] each), placed: its geometry, for any put. */
function stick(L, a, b, r, seg = 8) {
  const { THREE } = L, va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const g = L.cyl(r, va.distanceTo(vb), r, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  return g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}
/** A board from a to b, `w` wide across, `t` thick in z: its geometry, placed. */
function boardGeo(L, a, b, w, t, r = 0.004) {
  const { THREE } = L, va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const g = L.rbox(w, va.distanceTo(vb), t, r);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  return g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}
/** A leaf lying flat to the front. */
const leafGeo = (L, r, tilt = 0) => L.ball(r, 8, 6).scale(1.3, 0.65, 0.3).rotateZ(tilt);
/** A five-petalled flower facing the front, its eye yellow, at x, y, z. */
function rose(K, L, x, y, z, c, r) {
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; K.put(L.ball(r * 0.6, 8, 4).scale(1, 1, 0.5), K.gloss(c), x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, z); }
  K.put(L.ball(r * 0.4, 8, 4), K.gloss('#f8d038'), x, y, z + r * 0.2);
}
/** A part that turns about the piece's upright middle (js/base-play.js's spin): one material carrying the pivot, each
    part's colour baked into its vertices, so the whole turning part is a single draw. Returns put(geo, hex, ...at). */
function turner(K, L) {
  const { THREE } = L, m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.1 });
  m.userData.kind = 'pic'; m.userData.pivot = { y: 0, tilt: 0 };
  return (geo, hex, ...at) => {
    const c = new THREE.Color(hex), n = geo.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return K.put(geo, m, ...at);
  };
}

export const SHAPES = {
  cottagepicket: { make: 'cottagepicket' },
  ranchrail: { make: 'ranchrail' },
  ironrailing: { make: 'ironrailing' },
  bambooscreen: { make: 'bambooscreen' },
  drystonewall: { make: 'drystonewall', top: 0.875 },
  copingwall: { make: 'copingwall', top: 0.81 },
  archgate: { make: 'archgate', play: { does: 'door', inside: 'gate' } },
  vinelattice: { make: 'vinelattice' },
  willowhurdle: { make: 'willowhurdle' },
  logpalisade: { make: 'logpalisade' },
  ballpostfence: { make: 'ballpostfence' },
  ropebarrier: { make: 'ropebarrier' },
  wirefence: { make: 'wirefence' },
  cornerpost: { make: 'cornerpost' },
  lanternpier: { make: 'lanternpier', play: { does: 'light' } },
  lidsandbox: { make: 'lidsandbox' },
  seesaw: { make: 'seesaw', seat: 0.56, play: { does: 'wobble' } },
  slidetower: { make: 'slidetower' },
  merrygoround: { make: 'merrygoround', play: { does: 'spin' } },
  junglegym: { make: 'junglegym' },
  ponytarider: { make: 'ponytarider', seat: 0.86, play: { does: 'wobble' } },
  monkeybars: { make: 'monkeybars' },
  tyreswing: { make: 'tyreswing', seat: 0.56 },
  playhouse: { make: 'playhouse', play: { does: 'door', inside: 'house' } },
  logbeam: { make: 'logbeam', seat: 0.47 },
  climbdome: { make: 'climbdome' },
  tetherpole: { make: 'tetherpole', play: { does: 'spin' } },
  playtunnel: { make: 'playtunnel' },
  minitrampoline: { make: 'minitrampoline', seat: 0.34, play: { does: 'boing' } },
};

export const MAKES = {
  /* ---------- fences ---------- */

  /** Round-topped pickets on two rails, dipping to the middle so a row of them scallops. */
  cottagepicket(K, s, W, D, L) {
    const white = K.wood(K.pal.p), rail = K.wood(L.tone(K.pal.p, 0.88));
    for (const y of [u(7.5), u(17.5)]) K.put(L.rbox(W, u(3), 0.035, 0.01), rail, 0, y, -0.03);
    for (let i = 0; i < 5; i++) K.put(face(L, roundTop(u(2), u(26 - 5 * Math.sin(Math.PI * (i + 0.5) / 5))), 0.03), white, X(3.2 + i * 6.4), 0, 0.005);
  },

  /** A split-rail fence: a square post, three rails split three-sided running through it. */
  ranchrail(K, s, W, D, L) {
    const post = K.wood(), rail = K.wood(L.tone(K.pal.w, 1.12));
    K.put(L.rbox(u(6), u(30), u(6), 0.015), post, 0, u(15), 0);
    K.put(L.cyl(0.001, u(1.5), u(4.2), 4).rotateY(Math.PI / 4), post, 0, u(30.75), 0);
    [25, 16, 7].forEach((y, i) => K.put(L.cyl(u(2.31), W, u(2.31), 3).rotateZ(Math.PI / 2).rotateX(i % 2 ? Math.PI : 0.3), rail, 0, u(y), 0));
  },

  /** A wrought-iron railing: rails top and bottom, a band of rings, bars topped with gilt spears and collars. */
  ironrailing(K, s, W, D, L) {
    const { rbox, cyl, ball, torus } = L, iron = K.metal(L.tone(K.pal.m, 0.7)), gold = K.metal(K.pal.a);
    K.put(rbox(W, u(2), u(2), 0.006), iron, 0, u(4), 0);
    K.put(rbox(W, u(2), u(2), 0.006), iron, 0, u(25), 0);
    K.put(rbox(W, u(1.5), u(1.5), 0.005), iron, 0, u(20.25), 0);
    for (let i = 1; i < 5; i++) K.put(torus(u(1.6), u(0.4), TAU, 12), iron, X(i * 6.4), u(23.4), 0);
    for (let i = 0; i < 5; i++) {
      const x = X(3.2 + i * 6.4);
      K.put(cyl(u(1), u(28), u(1), 8), iron, x, u(14), 0);
      K.put(ball(u(1.3), 8, 6), gold, x, u(25), 0);
      K.put(cyl(0.001, u(4), u(1.6), 4), gold, x, u(30), 0);
    }
  },

  /** A screen of bamboo canes, ringed at their nodes, bound between rails front and back with ties in the colour. */
  bambooscreen(K, s, W, D, L) {
    const { rbox, cyl } = L, dark = K.gloss(L.tone(BAMBOO, 0.7));
    for (let i = 0; i < 8; i++) {
      const x = X(2 + i * 4), top = i % 2 ? 34 : 36;
      K.put(cyl(u(2), u(top), u(2), 8), K.gloss(i % 2 ? L.tone(BAMBOO, 0.86) : BAMBOO), x, u(top / 2), 0);
      K.put(cyl(u(1.6), 0.004, u(1.6), 8), dark, x, u(top) + 0.002, 0);
      for (let y = top - 7 - (i % 3) * 2; y > 2; y -= 9) K.put(cyl(u(2.25), u(1), u(2.25), 8), dark, x, u(y), 0);
    }
    for (const y of [26.5, 8.5]) {
      for (const z of [-0.086, 0.086]) K.put(rbox(W, u(3), u(1.5), 0.008), K.wood(), 0, u(y), z);
      for (let i = 0; i < 4; i++) K.put(rbox(u(2), u(5), 0.23, 0.006), K.cloth(K.pal.c), X(4 + i * 8), u(y + 1), 0);
    }
  },

  /** A dry stone wall: three courses of stones broken-jointed through its depth, flat coping stones, moss in the cracks. */
  drystonewall(K, s, W, D, L) {
    const { rbox, ball } = L;
    K.put(rbox(W - 0.004, u(24), 0.26, 0.01), K.plain(MORTAR), 0, u(12), 0);
    [[8, 8, 9, 7], [5, 9, 8, 10], [9, 7, 8, 8]].forEach((row, r) => {
      let sx = 0;
      row.forEach((w, i) => {
        K.put(rbox(u(w - 1), u(7), 0.31 - ((i + r) % 2) * 0.02, 0.025), K.plain(STONES[(i + r * 2) % 4]), X(sx + w / 2), u(8 * r + 4), 0, ((i + r) % 3 - 1) * 0.03);
        sx += w;
      });
    });
    for (let i = 0; i < 4; i++) K.put(rbox(u(7), u(4), 0.33, 0.02), K.plain(K.pal.p), X(i * 8 + 4), u(26), 0);
    for (const [px, py] of [[6, 1], [21, 9], [13, 17], [28, 24]]) for (const z of [0.155, -0.155]) K.put(ball(u(2), 8, 6).scale(1.1, 0.55, 0.6), K.plain(K.pal.leaf), X(px), u(py), z);
  },

  /** A brick garden wall in stretcher bond, half bricks at the ends of every other course, a stone coping on top. */
  copingwall(K, s, W, D, L) {
    const { rbox } = L;
    K.put(rbox(W - 0.004, u(22), 0.24, 0.004), K.plain(L.tone(K.pal.p, 0.82)), 0, u(11), 0);
    for (let r = 0; r < 5; r++) {
      const joints = r % 2 ? [0, 4, 12, 20, 28, 32] : [0, 8, 16, 24, 32];
      for (let i = 0; i < joints.length - 1; i++) {
        const len = joints[i + 1] - joints[i];
        K.put(rbox(u(len - 0.6), u(3.6), 0.27, 0.005), K.plain((i + r) % 3 ? K.pal.w : L.tone(K.pal.w, 0.85)), X(joints[i] + len / 2), u(4.4 * r + 2.2), 0);
      }
    }
    K.put(rbox(W, u(4), 0.32, 0.012), K.plain(K.pal.p), 0, u(24), 0);
  },

  /** A garden gate under an arch: two posts, the arch over them with a climbing rose, a boarded gate that opens. */
  archgate(K, s, W, D, L) {
    const { rbox, torus } = L, post = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.85)), plank = K.wood(L.tone(K.pal.w, 1.12)), black = K.gloss(INK);
    for (const x of [X(2), X(30)]) K.put(rbox(u(4), u(40), u(4), 0.012), post, x, u(20), 0);
    const arch = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI - i / 12 * Math.PI; arch.push([Math.cos(a) * u(16), Math.sin(a) * u(16)]); }
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI; arch.push([Math.cos(a) * u(12), Math.sin(a) * u(12)]); }
    K.put(face(L, arch, u(4)), dark, 0, u(40), 0);
    for (const [a, c] of [[0.5, K.pal.c], [1.3, K.pal.a], [2.2, K.pal.c], [2.8, K.pal.a]]) {
      const x = -Math.cos(a) * u(14), y = u(40) + Math.sin(a) * u(14), z = u(2) + 0.012;
      K.put(leafGeo(L, u(1.8), -0.4), K.plain(K.pal.leaf), x - u(2), y - u(1), z - 0.004);
      K.put(leafGeo(L, u(1.8), 0.4), K.plain(K.pal.leaf), x + u(2), y + u(1), z - 0.004);
      rose(K, L, x, y, z, c, u(1.8));
    }
    // the gate, hinged on the left post: boards rising to an arch, ledges and a brace on the front, straps, a ring latch
    const door = K.door([X(4), 0], 1);
    for (let i = 0; i < 4; i++) {
      const top = 26 + 3 * Math.sin(Math.PI * (i + 0.5) / 4);
      door(rbox(u(5.6), u(top - 2), 0.035, 0.008), plank, X(7 + i * 6), u((top + 2) / 2), 0);
    }
    for (const y of [7.75, 21.75]) {
      door(rbox(u(24), u(2.5), 0.03, 0.008), post, X(16), u(y), 0.032);
      door(rbox(u(8), u(1.5), 0.01, 0.003), black, X(8), u(y), 0.05);
    }
    door(boardGeo(L, [X(6), u(8), 0.032], [X(26), u(20.5), 0.032], u(2), 0.03), post);
    door(torus(u(1.6), u(0.45), TAU, 12), black, X(24), u(15), 0.056);
    K.inside = { x: 0, y: u(15), w: u(24), h: u(28), z: -0.05, bare: true };
  },

  /** A trellis panel: diagonal slats crossing in a frame, a vine climbing it in leaf and flower. */
  vinelattice(K, s, W, D, L) {
    const { rbox } = L, frame = K.wood();
    for (const x of [X(1.5), X(30.5)]) K.put(rbox(u(3), u(46), u(3), 0.01), frame, x, u(23), 0);
    for (const y of [44.5, 4.5]) K.put(rbox(W, u(3), u(2.5), 0.01), frame, 0, u(y), 0);
    // each diagonal clipped to the panel, the two ways laid one over the other
    for (const [dir, z, m] of [[1, 0.012, K.wood(K.pal.p)], [-1, -0.012, K.wood(L.tone(K.pal.p, 0.88))]]) {
      for (let c = -40; c < 40; c += 6.5) {
        const t0 = Math.max(0, -c), t1 = Math.min(37, 26 - c);
        if (t1 - t0 < 1.5) continue;
        const at = (t) => [X(3 + c + t), u(dir > 0 ? 6 + t : 43 - t), z];
        K.put(boardGeo(L, at(t0), at(t1), u(1.4), 0.012, 0.002), m);
      }
    }
    const pts = [[6, 3], [10, 14], [20, 20], [22, 30], [13, 38], [24, 44]], zf = 0.035;
    K.put(tube(L, pts.map(([x, y]) => [X(x), u(y), zf]), u(0.6), 24), K.plain(L.tone(K.pal.leaf, 0.8)));
    pts.forEach(([x, y]) => {
      K.put(leafGeo(L, u(2), -0.4), K.plain(K.pal.leaf), X(x - 2.5), u(y - 1), zf + 0.006);
      K.put(leafGeo(L, u(2), 0.4), K.plain(L.tone(K.pal.leaf, 1.12)), X(x + 2.5), u(y + 1), zf + 0.006);
    });
    for (const [x, y, c] of [[11, 16, K.pal.c], [23, 28, K.pal.a], [14, 38, K.pal.c]]) rose(K, L, X(x), u(y), zf + 0.016, c, u(2));
  },

  /** A woven willow hurdle: four pointed stakes, seven withies woven over and under them. */
  willowhurdle(K, s, W, D, L) {
    const stake = K.wood(L.tone(K.pal.w, 0.75)), stakes = [4, 12, 20, 28];
    for (const x of stakes) {
      K.put(L.cyl(u(1.3), u(29), u(1.3), 8), stake, X(x), u(14.5), 0);
      K.put(L.cyl(0.001, u(3), u(1.3), 8), stake, X(x), u(30.5), 0);
    }
    for (let r = 0; r < 7; r++) {
      const y = u(6.6 + r * 3.4), pts = [[-W / 2, y, 0], ...stakes.map((x, i) => [X(x), y, (i + r) % 2 ? 0.075 : -0.075]), [W / 2, y, 0]];
      K.put(tube(L, pts, u(1.5), 14), K.wood(r % 2 ? L.tone(K.pal.w, 1.15) : K.pal.w));
    }
  },

  /** A palisade of four logs sharpened to points, lashed with two bands of rope. */
  logpalisade(K, s, W, D, L) {
    const { cyl, rbox, ball } = L;
    for (let i = 0; i < 4; i++) {
      const x = X(4 + i * 8), top = i % 2 ? 37 : 40;
      K.put(cyl(u(4), u(top), u(4), 12), K.wood(i % 2 ? L.tone(K.pal.w, 0.85) : K.pal.w), x, u(top / 2), 0);
      K.put(cyl(0.001, u(5), u(4), 12), K.wood(L.tone(K.pal.w, 1.15)), x, u(top + 2.5), 0);
      K.put(ball(u(1), 8, 6).scale(1, 1.4, 0.5), K.wood(L.tone(K.pal.w, 0.6)), x + u(1) - (i % 2) * u(2), u(14 + i * 5), u(3.9));
    }
    for (const y of [29.75, 9.75]) K.put(rbox(W, u(2.5), u(8) + 0.02, 0.008), K.cloth(K.pal.c), 0, u(y), 0);
  },

  /** A white post-and-rail fence, a pale either side of a post topped with a Poké Ball. */
  ballpostfence(K, s, W, D, L) {
    const { rbox } = L, white = K.wood(K.pal.p), rail = K.wood(L.tone(K.pal.p, 0.88));
    for (const y of [8.5, 18.5]) K.put(rbox(W, u(3), 0.035, 0.01), rail, 0, u(y), -0.03);
    for (const x of [X(7), X(27)]) K.put(rbox(u(4), u(22), 0.03, 0.008), white, x, u(11), 0.005);
    K.put(rbox(u(6), u(26), u(6), 0.015), white, 0, u(13), 0);
    K.put(rbox(u(7.5), u(1), u(7.5), 0.004), rail, 0, u(26.5), 0);
    pokeBall(K, L, 0, u(31.5), 0, u(4.5));
  },

  /** A post on an iron foot, a thick rope swagging from it to the next. */
  ropebarrier(K, s, W, D, L) {
    const { lathe, cyl, ball, torus } = L, iron = K.metal(K.pal.m);
    K.put(lathe([[u(6), 0], [u(6), u(0.8)], [u(3), u(2)], [u(2.2), u(2.4)], [0, u(2.4)]], 16), iron, 0, 0, 0);
    K.put(cyl(u(2), u(26), u(2), 12), K.wood(), 0, u(14), 0);
    K.put(cyl(u(2.4), u(1.5), u(2.4), 12), K.gloss(K.pal.a), 0, u(21.25), 0);
    K.put(ball(u(2.5), 12, 8), iron, 0, u(28.5), 0);
    K.put(torus(u(1.2), u(0.4), TAU, 12), iron, 0, u(24), u(2.2));
    const pts = [];
    for (let i = 0; i <= 16; i++) { const x = -W / 2 + i / 16 * W; pts.push([x, u(24 - 6 * Math.sin(Math.PI * Math.abs(x)) ** 2), u(2.2)]); }
    K.put(tube(L, pts, u(1.3), 24), K.cloth(L.tone(K.pal.c, 0.9)));
  },

  /** A round post with field wire stapled across it: four strands and the stays between them. */
  wirefence(K, s, W, D, L) {
    const { cyl, ball } = L, wire = K.metal(L.tone(K.pal.m, 1.5)), z = u(2.5);
    K.put(cyl(u(2), u(30), u(2), 12), K.wood(), 0, u(15), 0);
    K.put(cyl(0.001, u(2), u(2), 12), K.wood(L.tone(K.pal.w, 0.85)), 0, u(31), 0);
    for (const y of [6, 12, 19, 26]) {
      K.put(cyl(u(0.45), W, u(0.45), 6).rotateZ(Math.PI / 2), wire, 0, u(y), z);
      K.put(ball(u(0.8), 8, 6), wire, 0, u(y), z - 0.01);
    }
    for (const x of [4, 12, 20, 28]) K.put(cyl(u(0.35), u(20), u(0.35), 6), wire, X(x), u(16), z);
  },

  /** A stout square post for a fence's corner: a plinth, panelled sides, a collar and a ball finial. */
  cornerpost(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, white = K.wood(K.pal.p), shade = K.wood(L.tone(K.pal.p, 0.86));
    K.put(rbox(u(14), u(4), u(14), 0.012), shade, 0, u(2), 0);
    K.put(rbox(u(10), u(28), u(10), 0.015), white, 0, u(18), 0);
    for (let i = 0; i < 4; i++) K.put(rbox(u(6), u(20), 0.008, 0.003).translate(0, 0, u(5) + 0.002).rotateY(i * Math.PI / 2), shade, 0, u(18), 0);
    K.put(rbox(u(12), u(3), u(12), 0.01), K.gloss(K.pal.a), 0, u(33.5), 0);
    K.put(rbox(u(13), u(1.5), u(13), 0.006), white, 0, u(35.75), 0);
    K.put(cyl(u(1), u(2), u(1.2), 12), white, 0, u(37.5), 0);
    K.put(ball(u(5), 16, 12), K.gloss(K.pal.c), 0, u(43), 0);
  },

  /** A gate pier of dressed stone, its cap carrying a lantern of four lit panes under a pyramid roof. */
  lanternpier(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, iron = K.metal(K.pal.m);
    K.put(rbox(u(20), u(6), u(20), 0.015), K.plain(L.tone(STONE, 0.88)), 0, u(3), 0);
    for (let i = 0; i < 4; i++) K.put(rbox(u(16), u(10.2), u(16), 0.02), K.plain(i % 2 ? L.tone(STONE, 0.9) : STONE), 0, u(6 + 10.5 * i + 5.1), 0);
    K.put(rbox(u(20), u(4), u(20), 0.015), K.plain(L.tone(STONE, 1.12)), 0, u(50), 0);
    K.put(rbox(u(12), u(3), u(12), 0.008), iron, 0, u(53.5), 0);
    K.put(rbox(u(10), u(11), u(10), 0.006), K.glow(K.pal.g), 0, u(60.5), 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) K.put(rbox(u(2), u(11), u(2), 0.004), iron, x * u(5), u(60.5), z * u(5));
    K.put(rbox(u(10.4), u(1), u(10.4), 0.003), iron, 0, u(60.5), 0);
    K.put(cyl(0.001, u(7), u(16) / Math.SQRT2, 4).rotateY(Math.PI / 4), iron, 0, u(69.5), 0);
    K.put(ball(u(1.5), 8, 6), iron, 0, u(74), 0);
  },

  /* ---------- playground ---------- */

  /** A sandbox, its painted lid propped open at the back, sand in it, a bucket and a spade stuck in. */
  lidsandbox(K, s, W, D, L) {
    const { THREE, rbox, lathe, torus, blob } = L, wood = K.wood(), dark = K.wood(L.tone(K.pal.w, 0.8)), zb = -0.3, zf = 0.4, h = u(10);
    for (let i = 0; i < 2; i++) {
      for (const z of [zb, zf]) K.put(rbox(u(28), u(5), 0.05, 0.01), wood, 0, u(2.5 + i * 5), z - Math.sign(z) * 0.025);
      for (const x of [X(2.5), X(29.5)]) K.put(rbox(0.05, u(5), zf - zb - 0.1, 0.01), wood, x, u(2.5 + i * 5), (zb + zf) / 2);
    }
    for (const x of [X(2.5), X(29.5)]) for (const z of [zb, zf]) K.put(rbox(u(3), u(11), u(3), 0.008), dark, x, u(5.5), z - Math.sign(z) * u(1.5));
    K.put(rbox(u(26), 0.04, zf - zb - 0.1, 0.01), K.plain(SAND), 0, u(8.5), (zb + zf) / 2);
    K.put(blob(0.36, 0.08, 0.26, 0.5, 0.8), K.plain(L.tone(SAND, 0.94)), X(12), u(9), 0.08);
    // the lid on its hinge at the back, tipped a little past upright, its pale border on the face
    const lid = (geo, m, x, y, z) => K.put(geo.translate(x, y, z).rotateX(-0.26), m, 0, h, zb);
    lid(rbox(u(26), 0.72, 0.035, 0.01), K.wood(K.pal.c), 0, 0.36, 0);
    for (const y of [u(2.5), 0.72 - u(2.5)]) lid(rbox(u(22), u(1), 0.006, 0.002), K.plain(K.pal.p), 0, y, 0.02);
    for (const x of [-u(10.5), u(10.5)]) lid(rbox(u(1), 0.72 - u(5), 0.006, 0.002), K.plain(K.pal.p), x, 0.36, 0.02);
    // the bucket and its handle, the spade
    const bucket = K.gloss(K.pal.a);
    K.put(lathe([[u(3), 0], [u(4), u(8)], [u(3.6), u(8)], [u(2.6), u(0.6)], [0, u(0.6)]], 16), bucket, X(22), u(9), 0.12);
    K.put(torus(u(4), u(0.4), Math.PI, 12), K.gloss(L.tone(K.pal.a, 0.8)), X(22), u(17), 0.12);
    K.put(new THREE.CylinderGeometry(u(3.6), u(3.6), 0.004, 16), K.plain(L.tone(SAND, 0.9)), X(22), u(16.5), 0.12);
    K.put(stick(L, [X(10), u(9), 0.15], [X(8), u(20), 0.15], u(0.7)), K.gloss(K.pal.p));
    K.put(rbox(u(3), u(1.5), u(1.5), 0.004), K.gloss(K.pal.p), X(8), u(20.75), 0.15);
  },

  /** A seesaw: a plank on a pivot between two A-frames, a seat and a handle at each end, rubber stops under them. */
  seesaw(K, s, W, D, L) {
    const { rbox, cyl, blob } = L, frame = K.metal(K.pal.m), acc = K.gloss(K.pal.a);
    const stand = [[25, 0], [30, 14], [34, 14], [39, 0], [36, 0], [32, 10], [28, 0]].map(([x, y]) => [X(x, 2), u(y)]);
    for (const z of [-0.13, 0.13]) K.put(face(L, stand, 0.04), frame, 0, 0, z);
    K.put(rbox(u(16), u(1), 0.3, 0.004), frame, 0, u(0.5), 0);
    K.put(cyl(u(2.5), 0.3, u(2.5), 12).rotateX(Math.PI / 2), acc, 0, u(15), 0);
    K.put(cyl(u(1), 0.32, u(1), 8).rotateX(Math.PI / 2), K.gloss(L.tone(K.pal.a, 0.6)), 0, u(15), 0);
    K.put(rbox(u(60), u(4), 0.2, 0.015), K.wood(), 0, u(16), 0);
    for (const x of [X(10, 2), X(54, 2)]) {
      K.put(blob(u(12), u(4), 0.24, 0.3, 0.5), K.cloth(K.pal.c), x, u(20), 0);
      K.put(cyl(u(3), 0.16, u(3), 12).rotateX(Math.PI / 2), K.gloss(TYRE), x, u(3), 0);
    }
    for (const x of [X(19, 2), X(45, 2)]) {
      K.put(cyl(u(1), u(12), u(1), 8), acc, x, u(24), 0);
      K.put(cyl(u(1), 0.22, u(1), 8).rotateX(Math.PI / 2), K.gloss(L.tone(K.pal.a, 0.8)), x, u(30), 0);
    }
  },

  /** A slide tower: four posts up to a pyramid roof, a ladder up the front, a platform walled at the back and side,
      the slide curving down to the right on a leg. */
  slidetower(K, s, W, D, L) {
    const { rbox, cyl } = L, post = K.wood(), rung = K.wood(L.tone(K.pal.w, 1.12)), col = K.gloss(K.pal.c), cx = X(20, 2), e = 0.375;
    for (const x of [X(8, 2), X(32, 2)]) for (const z of [-e, e]) K.put(rbox(u(4), u(62), u(4), 0.015), post, x, u(31), z);
    for (let i = 0; i < 4; i++) K.put(cyl(u(1), u(20), u(1), 8).rotateZ(Math.PI / 2), rung, cx, u(6 + i * 6), e);
    K.put(rbox(u(28), u(3), u(28), 0.012), post, cx, u(29.5), 0);
    K.put(rbox(u(20), u(10), 0.03, 0.01), K.gloss(L.tone(K.pal.c, 0.85)), cx, u(37), -e);
    K.put(rbox(0.03, u(10), u(20), 0.01), K.gloss(L.tone(K.pal.c, 0.85)), X(8, 2), u(37), 0);
    K.put(rbox(u(20), u(2), u(2), 0.008), col, cx, u(41), e);
    K.put(rbox(0.04, u(2), u(20), 0.008), col, X(8, 2), u(41), 0);
    K.put(rbox(u(20), u(2), 0.04, 0.008), col, cx, u(41), -e);
    K.put(cyl(0.001, u(12), u(17) * Math.SQRT2, 4).rotateY(Math.PI / 4), col, cx, u(68), 0);
    // the slide: its bed from the platform's edge to the ground, lipped each side, a leg under its middle
    const top = [], bot = [];
    for (let i = 0; i <= 12; i++) {
      const f = i / 12, x = X(34 + f * 30, 2), y = u(4 + 25 * (1 - f) ** 1.6);
      top.push([x, y + u(2)]); bot.push([x, y - u(2.2)]);
    }
    K.put(face(L, [...top, ...bot.reverse()], u(10)), K.gloss(K.pal.a));
    for (const z of [-u(5), u(5)]) K.put(tube(L, top.map(([x, y]) => [x, y + u(0.6), z]), u(0.8), 16), K.gloss(L.tone(K.pal.a, 1.15)));
    K.put(cyl(u(1.5), u(10), u(1.5), 8), post, X(50.5, 2), u(5), 0);
  },

  /** A merry-go-round: a platform of six wedges in turn, bars from its rim to the hub, turning on a footing. */
  merrygoround(K, s, W, D, L) {
    const { THREE, cyl, ball, torus } = L, spin = turner(K, L), R = u(28), metal = L.tone(K.pal.m, 1.1);
    K.put(cyl(u(9), u(4), u(9.5), 16), K.metal(L.tone(K.pal.m, 0.8)), 0, u(2), 0);
    for (let i = 0; i < 6; i++) spin(new THREE.CylinderGeometry(R, R, u(5), 6, 1, false, i * TAU / 6, TAU / 6), i % 2 ? K.pal.a : K.pal.c, 0, u(6.5), 0);
    spin(torus(R, u(0.6), TAU, 24).rotateX(Math.PI / 2), metal, 0, u(9), 0);
    spin(cyl(u(2), u(16), u(2), 12), metal, 0, u(17), 0);
    spin(ball(u(3), 12, 8), K.pal.a, 0, u(25), 0);
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6, at = (r, y) => [Math.cos(a) * r, u(y), Math.sin(a) * r];
      spin(tube(L, [at(0.75, 9), at(0.75, 19), at(0.68, 20.5), at(0.2, 21.5), at(u(2), 21.5)], u(1), 12), metal);
    }
  },

  /** A jungle gym: a cube of bars three by three by three, knobs at every joint. */
  junglegym(K, s, W, D, L) {
    const { cyl, ball } = L, post = K.gloss(K.pal.c), bar = K.gloss(K.pal.a), knob = K.gloss(L.tone(K.pal.c, 1.15)), at = [X(5, 2), 0, X(59, 2)], span = at[2] - at[0];
    for (const x of at) for (const z of at) {
      K.put(cyl(u(1.5), u(49), u(1.5), 12), post, x, u(24.5), z);
      K.put(cyl(u(2.5), u(1), u(2.5), 8), K.gloss(INK), x, u(0.5), z);
    }
    for (const y of [16, 32, 48]) for (const a of at) {
      K.put(cyl(u(1.5), span, u(1.5), 8).rotateZ(Math.PI / 2), bar, 0, u(y), a);
      K.put(cyl(u(1.5), span, u(1.5), 8).rotateX(Math.PI / 2), bar, a, u(y), 0);
      for (const b of at) K.put(ball(u(2.2), 8, 6), knob, a, u(y), b);
    }
  },

  /** A spring rider: a Ponyta on a coil spring, facing right, a saddle on its back, handles through its head, its mane
      and tail in flames. */
  ponytarider(K, s, W, D, L) {
    const { lathe, cyl, ball, blob } = L, cream = K.gloss(CREAM), acc = K.gloss(K.pal.a);
    K.put(lathe([[u(10), 0], [u(10), u(1)], [u(8), u(2)], [0, u(2)]], 16), K.metal(K.pal.m), 0, 0, 0);
    const coil = [];
    for (let i = 0; i <= 36; i++) { const a = i / 8 * TAU; coil.push([Math.cos(a) * u(4), u(2.5) + i / 36 * u(12), Math.sin(a) * u(4)]); }
    K.put(tube(L, coil, u(0.8), 48), K.metal(L.tone(K.pal.m, 1.5)));
    K.put(cyl(u(3), u(1.5), u(3), 12), K.metal(K.pal.m), 0, u(15), 0);
    // the body, its folded legs and hooves, the neck up to its head
    K.put(ball(1, 16, 12).scale(u(9), u(5.5), u(5)), cream, 0, u(21), 0);
    for (const x of [11.2, 15.2, 19.2, 23.2]) for (const z of [-0.07, 0.07]) {
      K.put(cyl(u(1.2), u(4), u(1.2), 8), cream, X(x), u(16.5), z);
      K.put(cyl(u(1.3), u(1.4), u(1.3), 8), K.gloss(HOOF), X(x), u(14.7), z);
    }
    K.put(stick(L, [X(22.5), u(22), 0], [X(26.5), u(31.5), 0], u(2.3), 10), cream);
    K.put(ball(1, 12, 8).scale(u(4.5), u(3.2), u(3)), cream, X(26), u(32), 0);
    K.put(ball(1, 12, 8).scale(u(2), u(1.8), u(2)), cream, X(29.5), u(31), 0);
    for (const z of [-u(2.7), u(2.7)]) K.put(ball(u(0.8), 8, 6), K.gloss(INK), X(26.5), u(33), z);
    for (const z of [-u(1.5), u(1.5)]) K.put(cyl(0.001, u(3.5), u(1), 8), cream, X(25.3), u(36.75), z, 0, 0, 0.2);
    for (const [x, y, h, c, z] of [[21, 27, 6, FLAME, 0.03], [23, 32, 6, FLAME2, -0.03], [25, 35, 5, FLAME, 0], [19, 25, 5, FLAME2, -0.03]]) K.put(cyl(0.001, u(h + 2), u(1.8), 8), K.gloss(c), X(x - 0.5), u(y + h / 2 - 1), z, 0, 0, 0.35);
    for (const [y, h, c] of [[24, 7, FLAME], [21, 6, FLAME2], [19, 5, FLAME]]) K.put(cyl(0.001, u(h), u(1.8), 8), K.gloss(c), X(8 - h / 2), u(y + 1.5), 0, 0, 0, Math.PI / 2 - 0.35);
    // the saddle, the handles through its head, the footrest
    K.put(blob(u(9), u(3), u(8), 0.3, 0.5), K.cloth(K.pal.c), X(16.5), u(26.5), 0);
    K.put(cyl(u(1), 0.34, u(1), 8).rotateX(Math.PI / 2), acc, X(26), u(35), 0);
    for (const z of [-0.17, 0.17]) K.put(ball(u(1.5), 8, 6), acc, X(26), u(35), z);
    K.put(cyl(u(0.8), 0.36, u(0.8), 8).rotateX(Math.PI / 2), acc, X(21), u(15.25), 0);
  },

  /** Monkey bars: a ladder each end, two rails across the top, the bars hung between them. */
  monkeybars(K, s, W, D, L) {
    const { cyl, ball } = L, frame = K.gloss(K.pal.c), bar = K.gloss(K.pal.a), ends = [X(4.5, 2), X(59.5, 2)], zs = [-0.234, 0.234];
    for (const x of ends) {
      for (const z of zs) {
        K.put(cyl(u(1.5), u(52), u(1.5), 12), frame, x, u(26), z);
        K.put(ball(u(2), 8, 6), K.gloss(L.tone(K.pal.c, 1.15)), x, u(52), z);
        K.put(cyl(u(2.5), u(1), u(2.5), 8), K.gloss(INK), x, u(0.5), z);
      }
      for (const y of [12, 24, 36]) K.put(cyl(u(1), 0.468, u(1), 8).rotateX(Math.PI / 2), bar, x, u(y), 0);
    }
    for (const z of zs) K.put(cyl(u(1.5), u(55), u(1.5), 12).rotateZ(Math.PI / 2), frame, 0, u(50.5), z);
    for (let i = 0; i < 9; i++) K.put(cyl(u(1), 0.468, u(1), 8).rotateX(Math.PI / 2), bar, X(7.2 + i * 6.2, 2), u(49.5), 0);
  },

  /** A tyre swing: an A-frame, a beam across it, a tyre hung flat on four chains from a swivel (a swing part, as the
      swing set's, js/base-3d.js). */
  tyreswing(K, s, W, D, L) {
    const { cyl, ball, torus } = L, frame = K.gloss(K.pal.c), beam = K.wood(), top = u(56), chain = K.metal(CHAIN);
    for (const x of [X(3), X(29)]) {
      for (const z of [-0.42, 0.42]) K.put(stick(L, [x, 0, z], [x, top, 0], u(1.5), 12), frame);
      for (const z of [-0.42, 0.42]) K.put(cyl(u(2.5), u(1), u(2.5), 8), K.gloss(INK), x, u(0.5), z);
    }
    K.put(cyl(u(2), u(30), u(2), 12).rotateZ(Math.PI / 2), beam, 0, top, 0);
    for (const x of [X(1), X(31)]) K.put(ball(u(2), 8, 6), beam, x, top, 0);
    const put = K.part ? K.part('swing0', [0, top, 0]) : K.put;
    put(cyl(u(1), u(2), u(1), 8), chain, 0, u(53), 0);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; put(stick(L, [0, u(52), 0], [Math.cos(a) * 0.2, u(17.5), Math.sin(a) * 0.2], u(0.4), 6), chain); }
    put(torus(u(6.7), u(2.5), TAU, 20).rotateX(Math.PI / 2), K.gloss(TYRE), 0, u(15.5), 0);
  },

  /** A playhouse: plank walls and corner trims, a gable roof with a round window, a door that opens, a shuttered
      window over a box of flowers, a window each side. */
  playhouse(K, s, W, D, L) {
    const { rbox, cyl, ball } = L, walls = K.wood(K.pal.p), trim = K.wood(), lines = K.plain(L.tone(K.pal.p, 0.85)), hw = u(26), hd = 0.75, f = hd;
    K.put(rbox(u(52), u(36), hd * 2, 0.02), walls, 0, u(18), 0);
    for (let y = 3; y < 36; y += 4.5) {
      for (const z of [-f - 0.002, f + 0.002]) K.put(rbox(u(52) - 0.02, u(0.6), 0.004, 0.002), lines, 0, u(y), z);
      for (const x of [-hw - 0.002, hw + 0.002]) K.put(rbox(0.004, u(0.6), hd * 2 - 0.02, 0.002), lines, x, u(y), 0);
    }
    for (const x of [-1, 1]) for (const z of [-1, 1]) K.put(rbox(u(3), u(36), u(3), 0.008), trim, x * (hw - u(1.2)), u(18), z * (hd - u(1.2)));
    K.put(rbox(u(52) + 0.012, u(3), hd * 2 + 0.012, 0.008), trim, 0, u(1.5), 0);
    // the roof: two slabs meeting at the ridge over a gable, its round window
    const len = Math.hypot(30, 25), tilt = Math.atan2(25, 30);
    for (const sx of [-1, 1]) K.put(rbox(u(len), u(3.5), 1.7, 0.015), K.wood(K.pal.c), sx * -X(18.12, 2), u(46.16), 0, 0, 0, -sx * tilt);
    K.put(face(L, [[X(6, 2), u(35)], [0, u(56)], [X(58, 2), u(35)]], hd * 2, 0), walls);
    K.put(cyl(u(4), 0.02, u(4), 16).rotateX(Math.PI / 2), K.gloss(K.pal.a), 0, u(44), f + 0.01);
    K.put(cyl(u(3), 0.02, u(3), 16).rotateX(Math.PI / 2), K.gloss(SKY), 0, u(44), f + 0.018);
    // the door, a dark doorway behind it
    const dx = X(19, 2);
    K.put(rbox(u(13.6), u(25.6), 0.004, 0.002), K.plain('#2a2228'), dx, u(13), f + 0.004);
    const door = K.door([X(12, 2), f + 0.02], 1);
    door(rbox(u(14), u(26), 0.04, 0.01), K.wood(K.pal.a), dx, u(13), f + 0.026);
    door(cyl(u(2.5), 0.012, u(2.5), 16).rotateX(Math.PI / 2), K.gloss(SKY), dx, u(20), f + 0.048);
    door(ball(u(1), 8, 6), K.gloss(INK), X(23.5, 2), u(12), f + 0.052);
    K.inside = { x: dx, y: u(13), w: u(14), h: u(26), z: f, bare: true };
    // the front window, its shutters and flower box; a plain window on each side
    const wx = X(44, 2);
    K.put(rbox(u(16), u(14), 0.02, 0.004), K.gloss(SKY), wx, u(21), f + 0.004);
    K.put(rbox(u(1), u(14), 0.02, 0.003), trim, wx, u(21), f + 0.016);
    K.put(rbox(u(16), u(1), 0.02, 0.003), trim, wx, u(21), f + 0.016);
    for (const x of [X(34, 2), X(54, 2)]) K.put(rbox(u(4), u(14), 0.03, 0.006), K.wood(K.pal.c), x, u(21), f + 0.015);
    K.put(rbox(u(18), u(4), 0.12, 0.01), trim, wx, u(12), f + 0.06);
    for (let i = 0; i < 4; i++) {
      const x = X(38 + i * 4, 2);
      K.put(ball(u(1.6), 8, 6).scale(1.3, 0.6, 1), K.plain(K.pal.leaf), x, u(14.5), f + 0.06);
      K.put(ball(u(1.5), 8, 6), K.gloss(i % 2 ? K.pal.c : K.pal.a), x, u(16), f + 0.07);
    }
    for (const sx of [-1, 1]) {
      K.put(rbox(0.02, u(12), u(14), 0.004), K.gloss(SKY), sx * (hw + 0.004), u(21), 0);
      K.put(rbox(0.03, u(1), u(14), 0.003), trim, sx * (hw + 0.012), u(21), 0);
      K.put(rbox(0.03, u(12), u(1), 0.003), trim, sx * (hw + 0.012), u(21), 0);
    }
  },

  /** A log balance beam on two cradles, its end grain pale, a knot or two. */
  logbeam(K, s, W, D, L) {
    const { cyl, rbox, ball, torus } = L;
    K.put(cyl(u(4), u(60), u(4), 12).rotateZ(Math.PI / 2), K.wood(), 0, u(11), 0);
    for (const sx of [-1, 1]) {
      K.put(cyl(u(3.6), 0.012, u(3.6), 12).rotateZ(Math.PI / 2), K.wood(L.tone(K.pal.w, 1.35)), sx * (u(30) + 0.004), u(11), 0);
      K.put(torus(u(2), u(0.3), TAU, 12).rotateY(Math.PI / 2), K.wood(L.tone(K.pal.w, 0.9)), sx * (u(30) + 0.011), u(11), 0);
      K.put(rbox(u(8), u(7), 0.5, 0.015), K.wood(L.tone(K.pal.w, 0.78)), sx * -X(14, 2), u(3.5), 0);
    }
    for (const [x, y, z] of [[26, 12, u(3.8)], [44, 13, -u(3.7)], [12, 14.6, 0.04]]) K.put(ball(u(1.6), 8, 6).scale(1, 0.75, 0.5), K.wood(L.tone(K.pal.w, 0.7)), X(x, 2), u(y), z);
  },

  /** A climbing dome: four great arcs over the top, rings round it at three heights and the ground, knobs where they
      cross. */
  climbdome(K, s, W, D, L) {
    const { ball, torus } = L, R = u(28), arc = K.gloss(K.pal.c), hoop = K.gloss(K.pal.a), knob = K.gloss(L.tone(K.pal.c, 1.15));
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 4, pts = [];
      for (let i = 0; i <= 12; i++) { const t = -Math.PI / 2 + i / 12 * Math.PI; pts.push([R * Math.sin(t) * Math.cos(a), R * Math.cos(t), R * Math.sin(t) * Math.sin(a)]); }
      K.put(tube(L, pts, u(1), 16), arc);
    }
    for (const lat of [Math.PI / 8, Math.PI / 4, Math.PI * 3 / 8]) {
      K.put(torus(R * Math.cos(lat), u(1), TAU, 24).rotateX(Math.PI / 2), hoop, 0, R * Math.sin(lat), 0);
      for (let k = 0; k < 8; k++) { const p = k * Math.PI / 4; K.put(ball(u(1.6), 8, 6), knob, R * Math.cos(lat) * Math.cos(p), R * Math.sin(lat), R * Math.cos(lat) * Math.sin(p)); }
    }
    K.put(torus(R, u(1), TAU, 24).rotateX(Math.PI / 2), hoop, 0, u(1), 0);
    K.put(ball(u(2.5), 12, 8), arc, 0, R, 0);
  },

  /** A tetherball pole: a weighted foot, a striped pole, the ball on its rope (it goes round the pole when tapped). */
  tetherpole(K, s, W, D, L) {
    const { lathe, cyl, ball, torus } = L, acc = K.gloss(K.pal.a), spin = turner(K, L);
    K.put(lathe([[u(8), 0], [u(8), u(1.5)], [u(6.5), u(3)], [u(3), u(4)], [0, u(4)]], 16), K.metal(K.pal.m), 0, 0, 0);
    K.put(cyl(u(1.2), u(77), u(1.2), 12), K.gloss(K.pal.p), 0, u(41.5), 0);
    for (const y of [18.5, 42.5, 66.5]) K.put(cyl(u(1.4), u(3), u(1.4), 12), acc, 0, u(y), 0);
    K.put(ball(u(1.8), 12, 8), acc, 0, u(80.5), 0);
    spin(torus(u(1.5), u(0.4), TAU, 12).rotateX(Math.PI / 2), '#f4f4f0', 0, u(77), 0);
    spin(stick(L, [u(1.5), u(77), 0], [X(25.6), u(54), 0], u(0.45), 6), '#f4f4f0');
    spin(ball(u(4), 12, 8), K.pal.c, X(26), u(50), 0);
    spin(torus(u(4.05), u(0.3), TAU, 16).rotateZ(0.25), L.tone(K.pal.c, 0.6), X(26), u(50), 0);
  },

  /** A crawl tunnel along the piece's depth: six bands in turn, a rim round each opening, chocks under it. */
  playtunnel(K, s, W, D, L) {
    const { lathe, torus, rbox } = L, ro = u(13), ri = u(9.5), len = D - 0.1, cy = u(13), n = 6;
    for (let i = 0; i < n; i++) {
      const z0 = -len / 2 + i * len / n, z1 = z0 + len / n;
      // each corner twice, so the bands' edges stay crisp
      const prof = [[ri, z0], [ro, z0], [ro, z0], [ro, z1], [ro, z1], [ri, z1], [ri, z1], [ri, z0]];
      K.put(lathe(prof, 16).rotateX(Math.PI / 2), K.gloss(i % 2 === (n - 1) % 2 ? K.pal.c : K.pal.a), 0, cy, 0);
    }
    for (const z of [-len / 2 - 0.005, len / 2 + 0.005]) K.put(torus(u(12.3), u(0.8), TAU, 24), K.gloss(K.pal.a), 0, cy, z);
    for (const x of [X(6), X(26)]) for (const z of [-0.7, 0.7]) K.put(rbox(u(6), u(3), 0.12, 0.01), K.wood(), x, u(1.5), z);
  },

  /** A mini trampoline: six splayed legs, a frame, a padded rim round a black mat, a handlebar with foam grips. */
  minitrampoline(K, s, W, D, L) {
    const { cyl, ball, torus } = L, metal = K.metal(K.pal.m), acc = K.gloss(K.pal.a);
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6, c = Math.cos(a), sn = Math.sin(a);
      K.put(stick(L, [c * u(12), u(8.5), sn * u(12)], [c * u(14), u(1), sn * u(14)], u(0.8)), metal);
      K.put(ball(u(1.2), 8, 6), K.gloss(INK), c * u(14), u(1), sn * u(14));
    }
    K.put(torus(u(13), u(0.8), TAU, 24).rotateX(Math.PI / 2), metal, 0, u(8.5), 0);
    K.put(torus(u(14), u(2), TAU, 24).rotateX(Math.PI / 2), K.cloth(K.pal.c), 0, u(9.5), 0);
    K.put(cyl(u(12.5), u(0.6), u(12.5), 24), K.plain(INK), 0, u(9.4), 0);
    K.put(stick(L, [0, u(9), -u(12)], [0, u(37), -u(9)], u(1), 12), acc);
    K.put(cyl(u(1), u(14), u(1), 12).rotateZ(Math.PI / 2), acc, 0, u(37), -u(9));
    for (const x of [X(9), X(23)]) K.put(cyl(u(1.5), u(4), u(1.5), 12).rotateZ(Math.PI / 2), K.cloth(K.pal.c), x, u(37), -u(9));
  },
};
