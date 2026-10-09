/* hub-pc.js  -  the Clearing's PC as a real 3D model (the user's ask, 2026-10-09: smooth and 3D, like Pokopia's Pokémon
   Center PC): a white hood round a recessed cyan screen with a notch and camera, leaning back a little, on a white ledge
   over a red stand that swells out under it, a raised Poké Ball on its front, four white feet. Glossy plastic, every edge
   rounded. The screen is its glow (glowMats in js/hub-3d.js) and its scan lines roll (livePc()). */

let T, screen = null;

/** A box with rounded edges (js/base-mesh.js's rbox()). */
function rbox(w, h, d, r) {
  r = Math.min(r, w / 2, h / 2, d / 2) - 1e-4;
  const n = 5, g = new T.BoxGeometry(1, 1, 1, n, n, n).toNonIndexed();
  const pos = g.attributes.position, nor = g.attributes.normal, half = 0.5 / n, v = new T.Vector3();
  const bx = w / 2 - r, by = h / 2 - r, bz = d / 2 - r;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    v.set(x - Math.sign(x) * half, y - Math.sign(y) * half, z - Math.sign(z) * half).normalize();
    pos.setXYZ(i, bx * Math.sign(x) + v.x * r, by * Math.sign(y) + v.y * r, bz * Math.sign(z) + v.z * r);
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}

function roundRect(s, x0, y0, x1, y1, r) {
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

// the screen's outline: a rounded rectangle with the camera's notch dipping into its top edge
const SX = 0.47, SY0 = 0.085, SY1 = 0.76, NOTCH = { w: 0.17, dip: 0.055 };
function screenShape(s, inset = 0) {
  const x0 = -SX + inset, x1 = SX - inset, y0 = SY0 + inset, y1 = SY1 - inset, r = 0.07, nw = NOTCH.w, nd = NOTCH.dip;
  s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(nw + 0.05, y1); s.quadraticCurveTo(nw + 0.015, y1, nw - 0.005, y1 - nd * 0.5);
  s.quadraticCurveTo(nw - 0.03, y1 - nd, nw - 0.07, y1 - nd);
  s.lineTo(-nw + 0.07, y1 - nd); s.quadraticCurveTo(-nw + 0.03, y1 - nd, -nw + 0.005, y1 - nd * 0.5);
  s.quadraticCurveTo(-nw - 0.015, y1, -nw - 0.05, y1);
  s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

/** The screen's picture: Pokopia's pale cyan, fine scan lines, a glare and a brighter band rolling down. */
function paintScreen(now) {
  const { c, g } = screen, W = c.width, H = c.height;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#7eeaf6'); bg.addColorStop(0.5, '#3ed2ec'); bg.addColorStop(1, '#1cb2de');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const side = g.createLinearGradient(0, 0, W, 0);   // the hood's shade falling in from the left
  side.addColorStop(0, 'rgba(120,96,190,0.38)'); side.addColorStop(0.16, 'rgba(120,96,190,0.08)'); side.addColorStop(0.3, 'rgba(120,96,190,0)');
  g.fillStyle = side; g.fillRect(0, 0, W, H);
  const roll = ((now / 4200) % 1.4 - 0.2) * H, band = g.createLinearGradient(0, roll - 40, 0, roll + 40);
  band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.5, 'rgba(255,255,255,0.28)'); band.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = band; g.fillRect(0, roll - 40, W, 80);
  g.fillStyle = 'rgba(255,255,255,0.24)';
  for (let y = 3; y < H; y += 7) g.fillRect(0, y, W, 2.5);
  g.fillStyle = 'rgba(40,150,180,0.12)';
  for (let y = 6; y < H; y += 7) g.fillRect(0, y, W, 1);
  const glare = g.createLinearGradient(W * 0.3, 0, W * 0.75, H);
  glare.addColorStop(0, 'rgba(255,255,255,0)'); glare.addColorStop(0.42, 'rgba(255,255,255,0)'); glare.addColorStop(0.47, 'rgba(255,255,255,0.32)');
  glare.addColorStop(0.58, 'rgba(255,255,255,0.32)'); glare.addColorStop(0.62, 'rgba(255,255,255,0)'); glare.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = glare; g.fillRect(0, 0, W, H);
  screen.t.needsUpdate = true;
}

/** Rolls the screen's scan lines, ~15 times a second. */
export function livePc(now) {
  if (!screen || now - screen.at < 66) return;
  screen.at = now;
  paintScreen(now);
}

/** The PC, its feet at the origin, its front towards +z. `glows` takes the screen's material (js/hub-3d.js's glowMats). */
export function pcModel(THREE, glows) {
  T = THREE;
  const g = new T.Group();
  const add = (geo, m, x = 0, y = 0, z = 0, parent = g) => {
    const mesh = new T.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const white = new T.MeshStandardMaterial({ color: '#f6f7fb', roughness: 0.32 });
  const rim = new T.MeshStandardMaterial({ color: '#e9e6f4', roughness: 0.38 });   // the hood's sides and the screen's lilac-shaded walls
  const red = new T.MeshStandardMaterial({ color: '#e2403e', roughness: 0.34 });
  const redDeep = new T.MeshStandardMaterial({ color: '#b82a30', roughness: 0.4 });
  const ink = new T.MeshStandardMaterial({ color: '#2e3240', roughness: 0.2, metalness: 0.3 });

  // the stand: a side profile extruded across, flat in front, swelling out in a curve to meet the ledge
  const BW = 0.96, prof = new T.Shape();
  prof.moveTo(-0.3, 0.13); prof.lineTo(0.27, 0.13); prof.lineTo(0.27, 0.56);
  prof.bezierCurveTo(0.27, 0.74, 0.4, 0.8, 0.4, 0.93); prof.lineTo(0.4, 0.98); prof.lineTo(-0.3, 0.98); prof.closePath();
  const standGeo = new T.ExtrudeGeometry(prof, { depth: BW, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 6, curveSegments: 28 });
  standGeo.rotateY(-Math.PI / 2);
  standGeo.translate(BW / 2, 0, 0);
  standGeo.computeVertexNormals();
  add(standGeo, red);
  add(rbox(BW + 0.1, 0.035, 0.6, 0.017), redDeep, 0, 0.12, -0.02);   // a darker seam where it meets the feet

  // the Poké Ball on its front, raised: a white disc split by a red band, the button ringed in red
  const ball = new T.Group();
  ball.position.set(0, 0.36, 0.32);
  g.add(ball);
  const disc = (r, h, m, z) => add(new T.CylinderGeometry(r, r, h, 48), m, 0, 0, z, ball).rotation.x = Math.PI / 2;
  disc(0.165, 0.03, white, 0.015);
  add(rbox(0.36, 0.04, 0.034, 0.012), red, 0, 0, 0.018, ball);
  disc(0.088, 0.036, red, 0.02);
  disc(0.06, 0.044, white, 0.022);
  const dome = add(new T.SphereGeometry(0.05, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), white, 0, 0, 0.042, ball);
  dome.rotation.x = Math.PI / 2; dome.scale.set(1, 0.35, 1);

  // the feet, soft rounded pads under the corners
  for (const x of [-0.34, 0.34]) for (const z of [-0.2, 0.25]) add(rbox(0.28, 0.14, 0.24, 0.07), white, x, 0.07, z);

  // the ledge
  add(rbox(1.16, 0.09, 0.84, 0.04), white, 0, 1.02, 0.06);

  // the hood, leaning back: a frame round the screen's hole, a back box closing it, the screen set inside
  const hood = new T.Group();
  hood.position.set(0, 1.06, -0.05);
  hood.rotation.x = -0.09;
  g.add(hood);
  const HD = 0.26, frame = roundRect(new T.Shape(), -0.58, 0, 0.58, 0.86, 0.13);
  frame.holes.push(screenShape(new T.Path()));
  const frameGeo = new T.ExtrudeGeometry(frame, { depth: HD, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 5, curveSegments: 20 });
  add(frameGeo, [white, rim], 0, 0, 0, hood);
  add(rbox(1.1, 0.8, 0.28, 0.1), white, 0, 0.43, -0.12, hood);

  const c = document.createElement('canvas');
  c.width = 256; c.height = 192; c.fine = 1;
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4;
  screen = { c, g: c.getContext('2d'), t, at: 0 };
  paintScreen(0);
  const sg = new T.ShapeGeometry(screenShape(new T.Shape(), -0.01), 24), uv = sg.attributes.uv, sp = sg.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (sp.getX(i) + SX) / (2 * SX), (sp.getY(i) - SY0) / (SY1 - SY0));
  const sm = new T.MeshStandardMaterial({ map: t, emissive: '#ffffff', emissiveMap: t, roughness: 0.4 });
  sm.userData.glow = 0.9; sm.userData.glowMin = 0.55;
  glows.push(sm);
  add(sg, sm, 0, 0, 0.09, hood).castShadow = false;

  // the camera in the notch
  for (const [x, r] of [[-0.055, 0.012], [0, 0.02], [0.055, 0.012]]) {
    const dot = add(new T.SphereGeometry(r, 16, 10), ink, x, SY1 - NOTCH.dip / 2, HD + 0.035, hood);
    dot.scale.z = 0.4;
  }
  return g;
}
