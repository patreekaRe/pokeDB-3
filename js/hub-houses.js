/* hub-houses.js  -  the Secret Base's houses on the Ancient Tree's lot, and the Timburr crew's builders' stand beside it
   (docs/roadmap.md's "Secret Base houses", the user's idea, 2026-10-23; js/data/houses.js holds what's sold and owned).
   Each house is a real model like the Nietos' mansion, built only while it stands on the lot (the one lived in, or the
   one tried on from the stand's catalogue): a Starter Cottage, a Log Cabin, a Seaside Bungalow. The Ancient Tree stays
   js/hub-3d.js's painted billboard. A house's door is its only tap (as the tree's, 2026-10-15) and swings open as your
   partner walks in. Paint colours multiply over grey paintings (siding, shingles, logs), so a repaint is a colour, not
   a new picture. js/hub-3d.js builds them as its 'base' and 'kiosk' places (makePlaces()). */

const cached = {};
function once(key, make) { return cached[key] ??= make(); }

/** Grey clapboard, a board every `n` painted pixels: the paint's colour multiplies over it. */
function sidingArt(fine) {
  return once('siding', () => {
    const { c, g, lin } = fine(16, 16, 4);
    for (let y = 0; y < 16; y += 4) {
      g.fillStyle = lin(0, y, 0, y + 4, ['#ffffff', '#f2f2f2', '#dcdcdc']); g.fillRect(0, y, 16, 4);
      g.fillStyle = '#b8b8b8'; g.fillRect(0, y + 3.6, 16, 0.4);
    }
    return c;
  });
}
/** Shingles in staggered rows, each with a shadowed foot. */
function shingleArt(fine) {
  return once('shingle', () => {
    const { c, g, lin } = fine(16, 16, 4);
    g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 16, 16);
    for (let r = 0; r < 4; r++) for (let i = -1; i < 4; i++) {
      const x = i * 4 + (r % 2) * 2, y = r * 4;
      g.fillStyle = lin(0, y, 0, y + 4, ['#ffffff', '#e4e4e4', '#c4c4c4']);
      g.beginPath(); g.roundRect(x + 0.2, y, 3.6, 4, [0, 0, 1.2, 1.2]); g.fill();
      g.fillStyle = '#a8a8a8'; g.fillRect(x + 0.2, y + 3.7, 3.6, 0.3);
    }
    return c;
  });
}
/** Round logs laid one on another, lit on top, grain along them. */
function logArt(fine) {
  return once('log', () => {
    const { c, g, lin } = fine(16, 16, 4);
    for (let y = 0; y < 16; y += 4) {
      g.fillStyle = lin(0, y, 0, y + 4, ['#c8c8c8', '#ffffff', '#e8e8e8', '#9a9a9a']); g.fillRect(0, y, 16, 4);
      g.strokeStyle = 'rgba(90,90,90,0.25)'; g.lineWidth = 0.15;
      for (const gy of [y + 1.4, y + 2.6]) { g.beginPath(); g.moveTo(0, gy); g.bezierCurveTo(5, gy - 0.3, 10, gy + 0.3, 16, gy); g.stroke(); }
    }
    return c;
  });
}
/** Planks for decks, porches and doors. */
function plankArt(fine) {
  return once('plank', () => {
    const { c, g, lin } = fine(16, 16, 4);
    for (let x = 0; x < 16; x += 4) {
      g.fillStyle = lin(x, 0, x + 4, 0, ['#f4f4f4', '#ffffff', '#dadada']); g.fillRect(x, 0, 4, 16);
      g.fillStyle = '#a0a0a0'; g.fillRect(x + 3.75, 0, 0.25, 16);
      g.fillStyle = 'rgba(120,120,120,0.4)'; g.fillRect(x + 1.6, (x * 3) % 13, 0.35, 0.35);
    }
    return c;
  });
}
/** Field stone: grey rounded stones in mortar. */
function stoneArt(fine) {
  return once('stone', () => {
    const { c, g, lin } = fine(16, 16, 4);
    g.fillStyle = '#8a857c'; g.fillRect(0, 0, 16, 16);
    const rows = [[0, 3.6], [3.8, 4], [8, 3.8], [12, 4]];
    rows.forEach(([y, h], r) => {
      for (let x = (r % 2) * -2.5; x < 16; x += 5) {
        g.fillStyle = lin(0, y, 0, y + h, ['#e4e0d6', '#c8c2b4', '#a8a294']);
        g.beginPath(); g.roundRect(x + 0.3, y + 0.3, 4.4, h - 0.5, 1.4); g.fill();
      }
    });
    return c;
  });
}
/** A lit window: four warm panes behind white mullions; `glow` paints its emissive map (the panes only). */
function windowArt(fine, glow = false) {
  return once(glow ? 'winGlow' : 'win', () => {
    const { c, g, lin } = fine(16, 16, 4);
    g.fillStyle = glow ? '#000' : '#ffffff'; g.fillRect(0, 0, 16, 16);
    g.fillStyle = glow ? '#ffd890' : lin(0, 1, 0, 15, ['#fff6d0', '#f8d278', '#e0a048']);
    for (const [x, y] of [[1.2, 1.2], [8.6, 1.2], [1.2, 8.6], [8.6, 8.6]]) g.fillRect(x, y, 6.2, 6.2);
    if (!glow) { g.fillStyle = 'rgba(255,255,255,0.45)'; for (const [x, y] of [[1.6, 1.6], [9, 1.6]]) { g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + 4, y); g.lineTo(x + 5.2, y); g.lineTo(x, y + 5.2); g.fill(); } }
    return c;
  });
}
/** Behind an open door: a warm room, dark at the top, lamplight on the floor. */
function insideArt(fine) {
  return once('inside', () => {
    const { c, g, lin } = fine(8, 16, 4);
    g.fillStyle = lin(0, 0, 0, 16, ['#1a0c04', '#4a2a10', '#c07a38', '#f0b860']); g.fillRect(0, 0, 8, 16);
    return c;
  });
}

/* The stand's paintings: its front panel (HOUSES, or FOR SALE before the base is bought), the crew's name board over it,
   and the awning's orange and cream stripes with a scalloped edge. */
function panelArt(fine, sale) {
  return once(sale ? 'panelSale' : 'panel', () => {
    const { c, g, rr, lin } = fine(40, 24, 8);
    rr(0, 0, 40, 24, 2, lin(0, 0, 0, 24, ['#c08a50', '#a26a3a']));
    for (let x = 0; x < 40; x += 5) { g.fillStyle = 'rgba(60,30,10,0.35)'; g.fillRect(x + 4.7, 0, 0.3, 24); }
    rr(3, 3, 34, 18, 1.6, sale ? '#d8402e' : '#fff6e0');
    rr(4, 4, 32, 16, 1.2, sale ? '#f04c38' : '#fffaf0');
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 7.4px "Trebuchet MS", "Arial Black", sans-serif';
    g.fillStyle = sale ? '#ffffff' : '#3a2410';
    if (sale) { g.fillText('FOR SALE', 20, 10.2); g.font = '900 4.6px "Trebuchet MS", sans-serif'; g.fillText('1,500 COINS', 20, 16.4); }
    else {
      g.fillText('HOUSES', 21.5, 12.3);
      g.fillStyle = '#d24a3c'; g.beginPath(); g.moveTo(5.5, 11.5); g.lineTo(9.5, 7.5); g.lineTo(13.5, 11.5); g.fill();
      g.fillStyle = '#f2d8a0'; g.fillRect(6.6, 11.5, 5.8, 4.6);
      g.fillStyle = '#8a5a34'; g.fillRect(8.7, 13, 1.6, 3.1);
    }
    return c;
  });
}
function crewArt(fine) {
  return once('crew', () => {
    const { c, g, rr, lin } = fine(48, 12, 8);
    rr(0, 0, 48, 12, 2.4, lin(0, 0, 0, 12, ['#5a3a20', '#3a2410']));
    rr(1, 1, 46, 10, 1.8, lin(0, 1, 0, 11, ['#f8d040', '#e0a020']));
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 5.6px "Trebuchet MS", "Arial Black", sans-serif'; g.fillStyle = '#3a2410';
    g.fillText('TIMBURR & CO.', 24, 5.2);
    g.font = '700 2.6px "Trebuchet MS", sans-serif'; g.fillText('BUILDERS', 24, 9.1);
    return c;
  });
}
function awningArt(fine) {
  return once('awning', () => {
    const { c, g } = fine(32, 20, 6);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#fff4dc' : '#f07c28';
      g.beginPath(); g.moveTo(i * 4, 0); g.lineTo(i * 4 + 4, 0); g.lineTo(i * 4 + 4, 16); g.arc(i * 4 + 2, 16, 2, 0, Math.PI); g.closePath(); g.fill();
    }
    return c;
  });
}

/* Each house sits with its front door on local z = DOOR_Z, the lot's middle column at x = 0; js/hub-3d.js stands the
   group a little behind the front row of the lot, so the step lands on the tile before the doorstep. */
const DW = 0.5, DH = 0.9;   // the door's width and height

/** A house on the lot: `id` and its paint `p` (a HOUSES paint), at (x, z); `boarded` nails planks over the door (the lot
    for sale). `fine`, `texOf` and `merge` are js/hub-3d.js's. Returns its `group`, `glows` (lit with the hour),
    open(on, snap) to swing its door (at once with `snap`), tick(dt, calm) to swing it, and `door` (the hit box: the house's only tap). */
export function makeHouse(THREE, { id, p, x, z, boarded = false, winter = false, fine, texOf, merge }) {
  const group = new THREE.Group(), still = new THREE.Group();
  group.position.set(x, 0, z);
  group.add(still);
  const glows = [];
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  const add = (geo, m, px, py, pz, { to = still, shadow = true } = {}) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = shadow; o.receiveShadow = true; to.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, o) => add(worldUV(new THREE.BoxGeometry(w, h, d)), m, px, py, pz, o);
  const cyl = (rt, rb, h, m, px, py, pz, seg = 12, o) => add(new THREE.CylinderGeometry(rt, rb, h, seg), m, px, py, pz, o);
  const tiled = (art, s, o = {}) => { const t = texOf(art); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(s, s); return std({ map: t, ...o }); };
  const lit = (m, k = 1.1, min = 0.15) => { m.userData.glow = k; m.userData.glowMin = min; glows.push(m); return m; };
  const winMat = lit(std({ map: texOf(windowArt(fine)), emissive: new THREE.Color('#ffd890'), emissiveMap: texOf(windowArt(fine, true)), roughness: 0.4 }));

  // box UVs in world units (a unit a repeat), so one tiled material wraps boxes of any size alike
  function worldUV(geo) {
    const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
      uv.setXY(i, nx > 0.5 ? pos.getZ(i) : pos.getX(i), ny > 0.5 ? pos.getZ(i) : pos.getY(i));
    }
    return geo;
  }
  // a gable roof whose ridge runs along x (along z when `alongZ`): over walls `d` deep and `w` long whose tops are at
  // the group's y, two slabs up `rise` to the ridge, out `oh` past the walls, and the walls' triangles under each end
  const gable = (w, d, rise, oh, roofM, wallM, px, py, pz, { alongZ = false } = {}) => {
    const g = new THREE.Group();
    g.position.set(px, py, pz);
    if (alongZ) g.rotation.y = Math.PI / 2;
    still.add(g);
    const a = Math.atan2(rise, d / 2), run = d / 2 + oh, len = run / Math.cos(a), T = 0.07;
    for (const s of [-1, 1]) {
      const slab = add(worldUV(new THREE.BoxGeometry(w + 1.6 * oh, T, len)), roofM, 0, rise - run / 2 * Math.tan(a) + T / 2 / Math.cos(a), s * run / 2, { to: g });
      slab.rotation.x = s * a;
    }
    add(new THREE.CylinderGeometry(0.05, 0.05, w + 1.6 * oh, 8), roofM, 0, rise + T / Math.cos(a) * 0.6, 0, { to: g }).rotation.z = Math.PI / 2;
    for (const sx of [-1, 1]) {
      const hw = d / 2, A = [sx * w / 2, 0, hw], B = [sx * w / 2, 0, -hw], C = [sx * w / 2, rise, 0], v = sx > 0 ? [A, B, C] : [B, A, C];
      const tri = new THREE.BufferGeometry();
      tri.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3));
      tri.setAttribute('uv', new THREE.Float32BufferAttribute(v.flatMap(([, y, zz]) => [zz, y]), 2));
      tri.computeVertexNormals();
      add(tri, wallM, 0, 0, 0, { to: g });
    }
    return g;
  };
  // a hip roof: four slopes from w x d at the eaves up `rise` to a ridge along x
  const hip = (w, d, rise, m, px, py, pz) => {
    const r = Math.max(0, (w - d) / 2), k = Math.hypot(rise, d / 2) / rise, H = (x, zz) => [x, 0, zz], R = (x) => [x, rise, 0];
    const faces = [
      [H(-w / 2, d / 2), H(w / 2, d / 2), R(r), R(-r)],
      [H(w / 2, d / 2), H(w / 2, -d / 2), R(r)],
      [H(w / 2, -d / 2), H(-w / 2, -d / 2), R(-r), R(r)],
      [H(-w / 2, -d / 2), H(-w / 2, d / 2), R(-r)],
    ];
    const pos = [], uv = [];
    faces.forEach((f, i) => {
      const tris = f.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2];
      for (const j of tris) { pos.push(...f[j]); uv.push(i % 2 ? f[j][2] : f[j][0], f[j][1] * k); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    return add(geo, m, px, py, pz);
  };
  // a lit window with a frame, a sill and (`shutters`) a shutter either side
  const win = (wx, wy, wz, w, h, frameM, { shutters = null, box: flowers = null } = {}) => {
    add(new THREE.PlaneGeometry(w, h), winMat, wx, wy, wz + 0.012, { shadow: false });
    for (const sy of [-1, 1]) box(w + 0.08, 0.05, 0.05, frameM, wx, wy + sy * (h / 2 + 0.02), wz + 0.02, { shadow: false });
    for (const sx of [-1, 1]) box(0.05, h + 0.1, 0.05, frameM, wx + sx * (w / 2 + 0.02), wy, wz + 0.02, { shadow: false });
    if (shutters) for (const sx of [-1, 1]) box(w * 0.36, h + 0.04, 0.035, shutters, wx + sx * (w / 2 + w * 0.2 + 0.05), wy, wz + 0.02);
    if (flowers) {
      box(w + 0.12, 0.1, 0.12, flowers, wx, wy - h / 2 - 0.09, wz + 0.07);
      for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.045, 8, 6), std({ color: ['#f86a8a', '#ffd84a', '#ffffff', '#f86a8a', '#b08af8'][i] }), wx - w / 2 + 0.06 + i * (w - 0.12) / 4, wy - h / 2 - 0.01, wz + 0.08, { shadow: false });
    }
  };
  // a porthole: a round lit window in a ring
  const porthole = (wx, wy, wz, r, ringM) => {
    add(new THREE.CircleGeometry(r, 20), winMat, wx, wy, wz + 0.012, { shadow: false });
    add(new THREE.TorusGeometry(r + 0.015, 0.03, 8, 24), ringM, wx, wy, wz + 0.02, { shadow: false });
  };

  // the door: on a hinge at its left edge, plank leaf in the paint's door colour, arched or square, a brass knob; the
  // warm room behind it shows as it swings out (open()), and a hit box over it is the house's only tap
  const doorAt = (dz, y0, { arch = false, colour, frameM }) => {
    const shape = new THREE.Shape(), r = DW / 2, top = DH - (arch ? r : 0);
    shape.moveTo(0, 0); shape.lineTo(DW, 0); shape.lineTo(DW, top);
    if (arch) shape.absarc(r, top, r, 0, Math.PI, false); else shape.lineTo(0, top);
    shape.lineTo(0, 0);
    const leafGeo = new THREE.ShapeGeometry(shape, 12), uv = leafGeo.attributes.uv, pos = leafGeo.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / DW * 2, pos.getY(i) / DH * 2);
    const holeGeo = leafGeo.clone();
    for (let i = 0; i < uv.count; i++) holeGeo.attributes.uv.setXY(i, pos.getX(i) / DW, pos.getY(i) / DH);
    const room = add(holeGeo, new THREE.MeshBasicMaterial({ map: texOf(insideArt(fine)) }), -r, y0, dz + 0.004, { shadow: false });
    room.raycast = () => {};
    const hinge = new THREE.Group();
    hinge.position.set(-r, y0, dz + 0.01);
    group.add(hinge);
    const t = texOf(plankArt(fine)); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const leaf = new THREE.Mesh(leafGeo, std({ map: t, color: colour, side: THREE.DoubleSide, roughness: 0.7 }));
    leaf.castShadow = true;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), std({ color: '#e8c050', metalness: 0.7, roughness: 0.3 }));
    knob.position.set(DW - 0.08, DH * 0.48, 0.03);
    hinge.add(leaf, knob);
    for (const o of [leaf, knob]) o.raycast = () => {};
    if (boarded) for (const [y, a] of [[DH * 0.62, -0.32], [DH * 0.36, 0.28]]) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(DW + 0.22, 0.09, 0.03), std({ color: '#a07a50' }));
      plank.position.set(r, y, 0.04); plank.rotation.z = a; plank.castShadow = true; plank.raycast = () => {};
      hinge.add(plank);
    }
    // the frame round it
    for (const sx of [-1, 1]) box(0.06, top, 0.06, frameM, sx * (r + 0.03), y0 + top / 2, dz + 0.02, { shadow: false });
    if (arch) add(new THREE.TorusGeometry(r + 0.03, 0.03, 6, 16, Math.PI), frameM, 0, y0 + top, dz + 0.02, { shadow: false });
    else box(DW + 0.12, 0.06, 0.06, frameM, 0, y0 + DH + 0.03, dz + 0.02, { shadow: false });
    const hit = new THREE.Mesh(new THREE.BoxGeometry(DW + 0.3, DH + 0.3, 0.5), new THREE.MeshBasicMaterial());
    hit.position.set(0, y0 + DH / 2, dz);
    hit.visible = false;
    hit.raycast = function (ray, out) { THREE.Mesh.prototype.raycast.call(this, ray, out); };
    group.add(hit);
    return { hinge, hit };
  };

  const trim = std({ color: p.trim || '#ffffff', roughness: 0.6 });
  const stone = tiled(stoneArt(fine), 2, { roughness: 1 });
  let door;
  if (id === 'cabin') door = cabin();
  else if (id === 'bungalow') door = bungalow();
  else door = cottage();
  merge(still);
  still.traverse(o => { if (o.isMesh) o.raycast = () => {}; });

  let target = 0, now = 0;
  return {
    group, glows, door: door.hit,
    open(on, snap = false) { target = on ? -1.75 : 0; if (snap) { now = target; door.hinge.rotation.y = now; } },
    tick(dt, calm) { now += (target - now) * (calm ? 1 : Math.min(1, dt / 1000 * 9)); door.hinge.rotation.y = now; },
  };

  /** The Starter Cottage (the mock-up's): cream clapboard on a stone plinth, a gabled roof with a cross gable over the
      arched door and a porthole in it, shuttered windows with flower boxes, a brick chimney, a red mailbox by the step. */
  function cottage() {
    const F = 0.16, BW = 3.2, BD = 2.0, WH = 1.2, E = F + WH;
    const wall = tiled(sidingArt(fine), 2, { color: p.wall }), roof = tiled(shingleArt(fine), 1.7, { color: p.roof, roughness: 0.75 });
    const shutter = std({ color: p.roof, roughness: 0.6 }), wood = std({ color: '#8a5a34' });
    box(BW + 0.2, F, BD + 0.2, stone, 0, F / 2, -BD / 2);
    box(BW, WH, BD, wall, 0, F + WH / 2, -BD / 2);
    for (const sx of [-1, 1]) box(0.08, WH, 0.08, trim, sx * BW / 2, F + WH / 2, 0, { shadow: false });
    box(BW + 0.12, 0.08, BD + 0.12, trim, 0, E - 0.02, -BD / 2, { shadow: false });
    gable(BW, BD, 0.95, 0.24, roof, wall, 0, E, -BD / 2);
    // the cross gable over the door, stepping out from the front
    const GW = 1.3, GD = 0.36;
    box(GW + 0.16, F, GD + 0.04, stone, 0, F / 2, GD / 2);
    box(GW, WH, GD, wall, 0, F + WH / 2, GD / 2);
    for (const sx of [-1, 1]) box(0.08, WH, 0.08, trim, sx * GW / 2, F + WH / 2, GD, { shadow: false });
    gable(1.25, GW, 0.72, 0.16, roof, wall, 0, E, GD - 0.625, { alongZ: true });
    porthole(0, E + 0.28, GD + 0.02, 0.13, trim);
    box(GW + 0.12, 0.08, GD + 0.06, trim, 0, E - 0.02, GD / 2, { shadow: false });
    for (const sx of [-1, 1]) win(sx * 1.05, F + 0.66, 0, 0.5, 0.5, trim, { shutters: shutter, box: wood });
    // the chimney, red brick with a cap
    const brick = std({ color: '#b0644a' });
    box(0.34, 1.25, 0.34, brick, 0.95, E + 0.75, -1.35);
    box(0.42, 0.08, 0.42, std({ color: '#8a4a36' }), 0.95, E + 1.41, -1.35);
    // the step and the mailbox
    box(0.9, 0.12, 0.34, stone, 0, 0.06, GD + 0.17);
    box(0.06, 0.62, 0.06, wood, 1.85, 0.31, GD + 0.2);
    box(0.24, 0.17, 0.32, std({ color: '#d8443a', roughness: 0.5 }), 1.85, 0.7, GD + 0.2);
    box(0.02, 0.12, 0.03, std({ color: '#ffd84a' }), 1.98, 0.76, GD + 0.12, { shadow: false });
    return doorAt(GD, F, { arch: true, colour: p.door, frameM: trim });
  }

  /** The Log Cabin: round logs over a stone footing, their ends crossing at the corners, a green roof running out over a
      plank porch on two posts, a stone chimney up the left end, a lamp by the door and a stack of firewood. */
  function cabin() {
    const F = 0.12, BW = 3.0, BD = 1.9, WH = 1.15, E = F + WH;
    const logs = tiled(logArt(fine), 1.8, { color: p.wall, roughness: 0.9 }), roof = tiled(plankArt(fine), 2, { color: p.roof, roughness: 0.8 });
    const end = std({ color: p.wall, roughness: 0.9 }), cut = std({ color: '#e6c08a', roughness: 0.9 });
    box(BW + 0.16, F, BD + 0.16, stone, 0, F / 2, -BD / 2);
    box(BW, WH, BD, logs, 0, F + WH / 2, -BD / 2);
    gable(BW, BD, 0.9, 0.16, roof, logs, 0, E, -BD / 2);
    // the log ends crossing at each corner: a stack of short logs sticking out both ways
    const ends = [];
    for (let y = F + 0.07; y < E; y += 0.14) for (const sx of [-1, 1]) for (const zz of [0, -BD]) ends.push([sx * (BW / 2 + 0.02), y, zz]);
    const at = new THREE.Object3D(), geo = new THREE.CylinderGeometry(0.075, 0.075, 0.26, 10);
    geo.rotateX(Math.PI / 2);
    const im = new THREE.InstancedMesh(geo, end, ends.length), caps = new THREE.InstancedMesh(new THREE.CircleGeometry(0.068, 10), cut, ends.length);
    ends.forEach(([px, py, pz], i) => {
      at.position.set(px, py, pz + (pz === 0 ? 0.05 : -0.05)); at.rotation.set(0, 0, 0); at.updateMatrix(); im.setMatrixAt(i, at.matrix);
      at.position.z = pz + (pz === 0 ? 0.181 : -0.181); at.rotation.y = pz === 0 ? 0 : Math.PI; at.updateMatrix(); caps.setMatrixAt(i, at.matrix);
    });
    im.castShadow = true; im.receiveShadow = caps.receiveShadow = true;
    still.add(im, caps);
    // the porch: planks out front on two posts, a lean-to roof over them
    const deck = tiled(plankArt(fine), 2, { color: '#b08860' }), post = std({ color: '#7a5030' });
    box(2.2, 0.1, 0.72, deck, 0, 0.05, 0.34);
    for (const sx of [-1, 1]) box(0.09, 0.86, 0.09, post, sx * 1.0, 0.53, 0.62);
    const lean = add(worldUV(new THREE.BoxGeometry(2.45, 0.06, 0.74)), roof, 0, 1.04, 0.35);
    lean.rotation.x = 0.27;
    win(-0.85, F + 0.62, 0, 0.46, 0.44, trim);
    win(0.85, F + 0.62, 0, 0.46, 0.44, trim);
    // the chimney up the left end, field stone, and its cap
    box(0.46, 2.7, 0.5, stone, -BW / 2 - 0.2, 1.35, -BD / 2);
    box(0.52, 0.08, 0.56, std({ color: '#6a665e' }), -BW / 2 - 0.2, 2.74, -BD / 2);
    // the lamp by the door
    const lamp = lit(std({ color: '#fff0c0', emissive: new THREE.Color('#ffc860'), roughness: 0.3 }), 1.4, 0.3);
    box(0.04, 0.12, 0.06, std({ color: '#2e2e38' }), 0.42, F + 0.76, 0.03, { shadow: false });
    box(0.1, 0.14, 0.1, lamp, 0.42, F + 0.66, 0.07, { shadow: false });
    // firewood stacked by the right corner
    const wood = [];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) wood.push([1.62 + (i - (3 - r) / 2) * 0.15 + 0.07, 0.07 + r * 0.13, 0.2]);
    const lg = new THREE.CylinderGeometry(0.068, 0.068, 0.36, 9);
    lg.rotateX(Math.PI / 2);
    const pile = new THREE.InstancedMesh(lg, std({ color: '#c08a50' }), wood.length);
    wood.forEach(([px, py, pz], i) => { at.position.set(px, py, pz); at.rotation.set(0, 0, 0); at.updateMatrix(); pile.setMatrixAt(i, at.matrix); });
    pile.castShadow = pile.receiveShadow = true;
    still.add(pile);
    return doorAt(0, F, { colour: p.door, frameM: trim });
  }

  /** The Seaside Bungalow: clapboard up on a boardwalk deck on posts, a hipped roof, porthole windows, a white railing
      either side of the steps, a life ring by the door and a palm at the corner. */
  function bungalow() {
    const D = 0.32, BW = 2.9, BD = 1.7, WH = 1.12, E = D + WH;
    const wall = tiled(sidingArt(fine), 2, { color: p.wall }), roof = tiled(shingleArt(fine), 1.7, { color: p.roof, roughness: 0.75 });
    const deck = tiled(plankArt(fine), 2, { color: '#c79a62' }), post = std({ color: '#8a6440' });
    box(3.7, 0.08, 2.6, deck, 0, D - 0.04, -0.75);
    for (const px of [-1.75, -0.6, 0.6, 1.75]) for (const pz of [0.45, -1.95]) box(0.1, D - 0.08, 0.1, post, px, (D - 0.08) / 2, pz);
    box(BW, WH, BD, wall, 0, D + WH / 2, -BD / 2 - 0.1);
    box(BW + 0.12, 0.08, BD + 0.12, trim, 0, E - 0.02, -BD / 2 - 0.1, { shadow: false });
    hip(BW + 0.5, BD + 0.5, 0.85, roof, 0, E + 0.02, -BD / 2 - 0.1);
    for (const sx of [-1, 1]) porthole(sx * 0.85, D + 0.6, -0.1, 0.17, trim);
    // the railing along the deck's front, a gap for the steps
    const rail = [];
    for (const [x0, x1] of [[-1.8, -0.5], [0.5, 1.8]]) {
      box(x1 - x0, 0.05, 0.05, trim, (x0 + x1) / 2, D + 0.42, 0.5, { shadow: false });
      for (let px = x0; px <= x1 + 0.001; px += 0.13) rail.push(px);
    }
    const at = new THREE.Object3D(), bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.4, 0.035), trim, rail.length);
    rail.forEach((px, i) => { at.position.set(px, D + 0.2, 0.5); at.updateMatrix(); bars.setMatrixAt(i, at.matrix); });
    bars.castShadow = true;
    still.add(bars);
    for (let i = 0; i < 2; i++) box(0.9, D / 2, 0.24, deck, 0, D / 4 * (2 - i) - 0.0, 0.62 + i * 0.22);
    // the life ring by the door: red, banded white
    const ring = add(new THREE.TorusGeometry(0.15, 0.045, 10, 24), std({ color: '#e8483e', roughness: 0.5 }), 0.62, D + 0.66, -0.06, { shadow: false });
    void ring;
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2;
      add(new THREE.BoxGeometry(0.06, 0.1, 0.1), std({ color: '#ffffff' }), 0.62 + Math.cos(a) * 0.15, D + 0.66 + Math.sin(a) * 0.15, -0.06, { shadow: false }).rotation.z = a;
    }
    // the palm at the front left: a leaning ringed trunk and a crown of fronds
    const bark = std({ color: '#9a7046' }), frond = std({ color: winter ? '#6a9a6a' : '#3f9446', side: THREE.DoubleSide, roughness: 0.9 });
    let px = -1.95, py = 0, pz = -0.2;
    for (let i = 0; i < 7; i++) {
      const seg = cyl(0.07 - i * 0.004, 0.08 - i * 0.004, 0.4, bark, px, py + 0.2, pz, 8);
      seg.rotation.z = -0.08 - i * 0.03;
      px += Math.sin(0.08 + i * 0.03) * 0.4; py += 0.39;
    }
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2, f = add(new THREE.PlaneGeometry(0.95, 0.22), frond, px + Math.cos(a) * 0.42, py + 0.02, pz + Math.sin(a) * 0.42);
      f.rotation.set(Math.PI / 2 - 0.4, 0, 0);
      f.rotation.order = 'YXZ'; f.rotation.y = -a; f.rotation.x = -0.45;
    }
    for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.07, 8, 6), std({ color: '#7a5a2a' }), px + Math.cos(i * 2.1) * 0.08, py - 0.06, pz + Math.sin(i * 2.1) * 0.08, { shadow: false });
    return doorAt(0, D, { arch: true, colour: p.door, frameM: trim });
  }
}

/** The Timburr crew's stand beside the lot: a plank counter under an orange-and-cream awning on two posts, TIMBURR &
    CO. over it and the catalogue on the counter; `sale` (no Secret Base yet) hangs FOR SALE on its front, else HOUSES.
    A traffic cone and a hard hat dress it. The crew itself is a Pokémon board js/hub-3d.js stands behind the counter. */
export function makeKiosk(THREE, { x, z, sale, fine, texOf, merge }) {
  const group = new THREE.Group(), still = new THREE.Group();
  group.position.set(x, 0, z);
  group.add(still);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });
  const add = (geo, m, px, py, pz, shadow = true) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.castShadow = shadow; o.receiveShadow = true; still.add(o); return o; };
  const box = (w, h, d, m, px, py, pz, shadow) => add(new THREE.BoxGeometry(w, h, d), m, px, py, pz, shadow);
  const wood = std({ color: '#a26a3a' }), dark = std({ color: '#6a4424' }), top = std({ color: '#c89a68', roughness: 0.6 });
  const W = 1.05, H = 0.78, Dp = 0.5;
  box(W, H, Dp, wood, 0, H / 2, 0);
  box(W + 0.1, 0.06, Dp + 0.12, top, 0, H + 0.03, 0.02);
  add(new THREE.PlaneGeometry(W - 0.08, (W - 0.08) * 0.6), std({ map: texOf(panelArt(fine, sale)), roughness: 0.7 }), 0, H * 0.5, Dp / 2 + 0.006, false);
  for (const sx of [-1, 1]) box(0.08, 2.0, 0.08, dark, sx * (W / 2 - 0.02), 1.0, -Dp / 2 + 0.02);
  const aw = add(new THREE.PlaneGeometry(W + 0.24, 0.82), std({ map: texOf(awningArt(fine)), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }), 0, 1.86, 0.1);
  aw.rotation.x = -1.15;
  box(W + 0.2, 0.3, 0.05, std({ map: texOf(crewArt(fine)), roughness: 0.7 }), 0, 2.2, -Dp / 2 + 0.02);
  // the catalogue on the counter, open, and a yellow hard hat
  box(0.34, 0.03, 0.24, std({ color: '#f6f0e0' }), -0.18, H + 0.075, 0.05, false);
  box(0.02, 0.035, 0.24, std({ color: '#c0392b' }), -0.18, H + 0.08, 0.05, false);
  const hat = add(new THREE.SphereGeometry(0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#f8c820', roughness: 0.4 }), 0.3, H + 0.06, 0.06);
  hat.scale.y = 0.8;
  add(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 14), std({ color: '#e8b010', roughness: 0.4 }), 0.3, H + 0.065, 0.08, false);
  // a traffic cone at its foot
  const cone = std({ color: '#f07028', roughness: 0.5 });
  add(new THREE.ConeGeometry(0.1, 0.32, 12), cone, -W / 2 - 0.08, 0.18, 0.28);
  add(new THREE.CylinderGeometry(0.066, 0.078, 0.06, 12), std({ color: '#ffffff' }), -W / 2 - 0.08, 0.15, 0.28, false);
  box(0.24, 0.03, 0.24, cone, -W / 2 - 0.08, 0.015, 0.28, false);
  merge(still);
  still.traverse(o => { if (o.isMesh) o.raycast = function (ray, out) { THREE.Mesh.prototype.raycast.call(this, ray, out); }; });
  return { group };
}
