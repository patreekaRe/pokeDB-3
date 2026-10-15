/* hub-arch.js  -  the garden arch beside the Ancient Tree, the way into the Secret Base's backyard (the user's ask,
   2026-10-15: "the entrance to the backyard from outside, an archway you unlock"; it was a back door of the main room).
   A wooden trellis arch grown over with ivy and flowers, a picket gate in it and a lantern hung under its crown. Until
   the backyard is bought brambles choke the opening and a padlock holds the gate, the dark of a thicket behind; bought,
   the lawn shows through, and the gate swings open to walk in. js/hub-3d.js builds it as the 'backyard' place
   (makePlaces()) and ticks it each frame. */

const HW = 0.6, POST_H = 1.5, DEEP = 0.17;   // half the opening's width, where the arch springs, the posts' half-depth
const GATE_H = 0.92, OPEN = 1.25;            // the gate's height, and how far each leaf swings in
const CLEAR = 900;                           // ms the brambles take to wither away once it's bought

function seeded(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** What shows through the arch: the backyard's lawn in the sun, its picket fence and the trees past it, stepping stones
    leading in; `owned` false, the dark of an overgrown thicket instead. */
function throughArt(owned, leaf, winter) {
  const W = 128, H = 192, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d'), rnd = seeded(owned ? 5 : 9);
  if (!owned) {
    const v = g.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, '#0c160c'); v.addColorStop(0.6, '#142414'); v.addColorStop(1, '#22301a');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {   // leaves glinting in the gloom
      g.fillStyle = `rgba(${60 + rnd() * 40 | 0}, ${100 + rnd() * 50 | 0}, ${50 + rnd() * 30 | 0}, ${0.25 + rnd() * 0.35})`;
      g.beginPath(); g.ellipse(rnd() * W, rnd() * H, 3 + rnd() * 6, 2 + rnd() * 4, rnd() * 3, 0, Math.PI * 2); g.fill();
    }
    return c;
  }
  const sky = g.createLinearGradient(0, 0, 0, 90);
  sky.addColorStop(0, winter ? '#dfe8f4' : '#a8d4f4'); sky.addColorStop(1, winter ? '#f4f6fa' : '#e4f4fc');
  g.fillStyle = sky; g.fillRect(0, 0, W, 90);
  for (let x = -10; x < W + 10; x += 13) {   // the trees round the yard
    g.fillStyle = leaf[2 + (x % 2 ? 1 : 0)] || leaf[2];
    g.beginPath(); g.arc(x + rnd() * 6, 74 + rnd() * 8, 14 + rnd() * 7, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = leaf[3] || leaf[2]; g.fillRect(0, 80, W, 16);
  const lawn = winter ? ['#f2f6fb', '#e4ecf6'] : ['#8ad064', '#78c052'];
  for (let i = 0; i < 6; i++) { g.fillStyle = lawn[i % 2]; g.fillRect(i * W / 6, 94, W / 6 + 1, H - 94); }
  g.fillStyle = winter ? '#d8d0c0' : '#f2ead8';   // the picket fence across the back of the lawn
  for (let x = 2; x < W; x += 8) { g.fillRect(x, 84, 4, 16); g.beginPath(); g.moveTo(x, 84); g.lineTo(x + 2, 80); g.lineTo(x + 4, 84); g.fill(); }
  g.fillRect(0, 88, W, 2); g.fillRect(0, 95, W, 2);
  g.fillStyle = winter ? '#c8c4bc' : '#d8d4c8';   // stepping stones in, nearer ones bigger
  for (const [y, r] of [[176, 15], [148, 11], [126, 8], [110, 6]]) { g.beginPath(); g.ellipse(W / 2 + (y % 3 - 1) * 4, y, r, r * 0.4, 0, 0, Math.PI * 2); g.fill(); }
  return c;
}

/** The arch at (`x`, `z`), its opening facing the view. `owned`: the backyard is bought, so no brambles or lock.
    `leaf` the Clearing's crown colours for the season, `winter` snow on it and no flowers, `merge` js/hub-3d.js's
    mergeStatic(). Returns its `group`, the `glows` (the lantern's pane, lit with the hour like the Clearing's lamps),
    swing(open) to swing the gate in or shut, clear() to wither the brambles away (a just-bought one), and
    tick(now, calm, dark), `dark` the hour's glow (LIGHT[time].glow), dimming the lawn seen through it after dusk. */
export function makeGardenArch(THREE, { x, z, owned, leaf, winter = false, merge }) {
  const group = new THREE.Group(), still = new THREE.Group();
  group.position.set(x, 0, z);
  group.add(still);
  const rnd = seeded(23);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const add = (geo, m, px, py, pz, parent = still, shadow = true) => {
    const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
  };
  const wood = std({ color: '#a8784a' }), dark = std({ color: '#6e4a2a' }), paint = std({ color: winter ? '#e8e2d8' : '#f0e6d2', roughness: 0.7 });
  const stone = std({ color: '#b8b4a8', flatShading: true });
  const leaves = [0, 1, 2].map(i => std({ color: leaf[i] || leaf[0], flatShading: true, roughness: 0.9 }));
  const PX = HW + 0.07;   // the posts' middle, either side of the opening

  // the lawn (or thicket) seen through it: an arch-shaped plane a little behind the gate
  const shape = new THREE.Shape();
  shape.moveTo(-HW, 0); shape.lineTo(HW, 0); shape.lineTo(HW, POST_H); shape.absarc(0, POST_H, HW, 0, Math.PI, false); shape.lineTo(-HW, 0);
  const holeGeo = new THREE.ShapeGeometry(shape, 16), uv = holeGeo.attributes.uv, pos = holeGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + HW) / (2 * HW), pos.getY(i) / (POST_H + HW));
  const art = throughArt(owned, leaf, winter), map = new THREE.CanvasTexture(art);
  map.colorSpace = THREE.SRGBColorSpace;
  const through = new THREE.MeshBasicMaterial({ map });
  add(holeGeo, through, 0, 0.01, -DEEP - 0.02, group, false);

  // stone footings, two posts a side (front and back) with slats between, and the arch over them, front and back
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(0.3, 0.14, 2 * DEEP + 0.16), stone, s * PX, 0.07, 0);
    for (const dz of [-DEEP, DEEP]) add(new THREE.BoxGeometry(0.11, POST_H, 0.11), wood, s * PX, POST_H / 2 + 0.1, dz);
    for (let y = 0.4; y < POST_H; y += 0.28) add(new THREE.BoxGeometry(0.05, 0.035, 2 * DEEP), dark, s * PX, y, 0, still, false);
  }
  for (const dz of [-DEEP, DEEP]) {
    const ring = add(new THREE.TorusGeometry(PX, 0.055, 6, 22, Math.PI), wood, 0, POST_H + 0.1, dz);
    ring.scale.z = 1.6;
  }
  for (let i = 1; i < 8; i++) {   // slats over the top, front to back
    const a = Math.PI * i / 8;
    add(new THREE.BoxGeometry(0.05, 0.035, 2 * DEEP + 0.06), dark, Math.cos(a) * PX, POST_H + 0.1 + Math.sin(a) * PX, 0, still, false).rotation.z = a;
  }

  // ivy climbing both posts and over the top, flowers in it (none in winter, snow on the crown instead)
  const blob = [new THREE.IcosahedronGeometry(0.1, 0), new THREE.IcosahedronGeometry(0.14, 0)];
  const ivy = (px, py, pz, big) => {
    const o = add(blob[big ? 1 : 0], leaves[Math.floor(rnd() * 3)], px, py, pz);
    o.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    o.scale.setScalar(0.8 + rnd() * 0.5);
  };
  for (const s of [-1, 1]) for (let y = 0.15; y < POST_H; y += 0.09) {
    const a = y * 5 + s;
    ivy(s * PX + Math.cos(a) * 0.1, y + 0.1, DEEP * Math.sin(a) * 1.3, rnd() < 0.3);
  }
  for (let i = 0; i <= 26; i++) {
    const a = Math.PI * i / 26, r = PX + (rnd() - 0.3) * 0.1;
    for (const dz of [-DEEP, 0, DEEP]) if (rnd() < 0.85) ivy(Math.cos(a) * r, POST_H + 0.1 + Math.sin(a) * r, dz + (rnd() - 0.5) * 0.1, rnd() < 0.5);
  }
  // trailing strands hanging off the arch's front
  for (const [ax, n] of [[-0.42, 4], [0.36, 3], [0.05, 2]]) for (let k = 0; k < n; k++) {
    const a = Math.acos(Math.max(-1, Math.min(1, ax / PX)));
    ivy(ax + (rnd() - 0.5) * 0.05, POST_H + 0.1 + Math.sin(a) * PX - 0.12 - k * 0.11, DEEP + 0.06, false);
  }
  if (winter) {
    const snow = std({ color: '#f8fbff', roughness: 1, flatShading: true });
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * (0.12 + 0.76 * i / 14), r = PX + 0.1;
      add(blob[1], snow, Math.cos(a) * r, POST_H + 0.12 + Math.sin(a) * r, (rnd() - 0.5) * DEEP, still, false).scale.set(1.1, 0.55, 1.4);
    }
  } else {
    const petals = ['#f890b8', '#fff4f8', '#f8d050', '#c8a0f8'].map(color => std({ color, roughness: 0.6 }));
    const bud = new THREE.SphereGeometry(0.045, 6, 4);
    for (let i = 0; i < 26; i++) {
      const up = rnd() < 0.6;
      if (up) {
        const a = Math.PI * (0.05 + rnd() * 0.9), r = PX + 0.08;
        add(bud, petals[i % 4], Math.cos(a) * r, POST_H + 0.1 + Math.sin(a) * r, DEEP + 0.04 - rnd() * 0.1, still, false);
      } else {
        const s = rnd() < 0.5 ? -1 : 1;
        add(bud, petals[i % 4], s * PX + (rnd() - 0.5) * 0.18, 0.3 + rnd() * (POST_H - 0.3), DEEP + 0.08, still, false);
      }
    }
  }
  // a shrub at each foot
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) ivy(s * (PX + 0.22 + rnd() * 0.12), 0.12 + rnd() * 0.18, DEEP * 0.5 + (rnd() - 0.3) * 0.25, true);

  // the lantern hung under the crown, its glass lit with the hour
  const glass = std({ color: '#fff4d0', emissive: new THREE.Color('#ffd070'), roughness: 0.3 });
  glass.userData.glow = 1.4; glass.userData.glowMin = 0.05;
  const iron = std({ color: '#3a3e48', roughness: 0.5, metalness: 0.3 }), top = POST_H + 0.1 + PX;
  add(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 4), iron, 0, top - 0.17, DEEP, still, false);
  add(new THREE.BoxGeometry(0.13, 0.17, 0.13), glass, 0, top - 0.36, DEEP, still, false);
  add(new THREE.ConeGeometry(0.11, 0.08, 4), iron, 0, top - 0.24, DEEP, still, false).rotation.y = Math.PI / 4;
  add(new THREE.BoxGeometry(0.15, 0.025, 0.15), iron, 0, top - 0.45, DEEP, still, false);
  merge(still);

  // the gate: two picket leaves hinged on the posts, swinging in (away from the view)
  const leavesOf = [-1, 1].map(s => {
    const hinge = new THREE.Group();
    hinge.position.set(s * HW, 0, DEEP * 0.4);
    const w = HW - 0.02, mid = -s * w / 2;
    for (const y of [0.3, 0.72]) add(new THREE.BoxGeometry(w, 0.06, 0.035), paint, mid, y, 0, hinge);
    for (let k = 0; k < 4; k++) {
      const px = -s * (0.08 + k * (w - 0.12) / 3), h = GATE_H - 0.12 + (k / 3) * 0.12;   // the pickets rise towards the middle
      add(new THREE.BoxGeometry(0.075, h, 0.03), paint, px, h / 2 + 0.1, 0.02, hinge);
      add(new THREE.ConeGeometry(0.053, 0.08, 4), paint, px, h + 0.14, 0.02, hinge).rotation.y = Math.PI / 4;
    }
    group.add(hinge);
    return { hinge, s };
  });

  // until it's bought: a padlock holding the gate, and brambles across the opening, thorns and dark leaves on them
  let bramble = null, lock = null;
  if (!owned) {
    bramble = new THREE.Group();
    const vine = std({ color: '#3e3a22', roughness: 0.95 }), thorn = std({ color: '#7a5a3a' }), gloom = std({ color: '#2a4a24', flatShading: true });
    const thornGeo = new THREE.ConeGeometry(0.02, 0.07, 4);
    for (let i = 0; i < 7; i++) {
      const y0 = 0.15 + rnd() * 1.4, y1 = 0.15 + rnd() * 1.4, pts = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        pts.push(new THREE.Vector3(-PX + t * 2 * PX, y0 + (y1 - y0) * t + Math.sin(t * Math.PI * (2 + i % 3)) * 0.12, DEEP + 0.05 + Math.sin(t * 7 + i) * 0.05));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      add(new THREE.TubeGeometry(curve, 24, 0.022, 5), vine, 0, 0, 0, bramble);
      for (let k = 1; k < 10; k++) {
        const p = curve.getPoint(k / 10), o = add(thornGeo, thorn, p.x, p.y, p.z, bramble, false);
        o.rotation.z = (k % 2 ? 1 : -1) * 1.2; o.rotation.x = rnd();
        if (k % 3 === 0) add(blob[0], gloom, p.x, p.y + 0.04, p.z + 0.02, bramble).scale.setScalar(0.7);
      }
    }
    group.add(bramble);
    lock = new THREE.Group();
    const brass = std({ color: '#d8a838', metalness: 0.8, roughness: 0.35 });
    add(new THREE.BoxGeometry(0.12, 0.1, 0.05), brass, 0, 0, 0, lock);
    add(new THREE.TorusGeometry(0.04, 0.012, 4, 10, Math.PI), brass, 0, 0.05, 0, lock);
    lock.position.set(0, 0.6, DEEP * 0.4 + 0.06);
    group.add(lock);
  }

  let angle = 0, want = 0, clearAt = 0;
  return {
    group, glows: [glass],
    swing(open) { want = open ? OPEN : 0; },
    clear() { clearAt = performance.now(); return CLEAR; },
    tick(now, calm, dark = 0) {
      angle = calm ? want : angle + (want - angle) * 0.12;
      for (const { hinge, s } of leavesOf) hinge.rotation.y = -s * angle;
      const dim = owned ? Math.max(0.4, 1 - dark * 0.38) : 1;
      through.color.setScalar(dim);
      if (!clearAt || !bramble) return;
      const t = Math.min(1, (now - clearAt) / CLEAR), k = calm ? 0 : 1 - t * t;
      bramble.scale.set(1, Math.max(0.001, k), 1);
      bramble.position.y = (1 - k) * 0.1;
      lock.position.y = 0.6 - t * 0.55;
      lock.rotation.z = t * 1.4;
      if (t >= 1 || calm) { bramble.visible = lock.visible = false; }
    },
  };
}
