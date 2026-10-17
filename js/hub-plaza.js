/* hub-plaza.js  -  the Trainer Plaza's board in the Clearing (the user's ask, 2026-10-17: "the physical 3D board"),
   on the lawn between the plaza and the Poké Mall: a notice board on two wooden posts under a little teal gable with a Poké Ball on
   its ridge, a TRAINER PLAZA plank, bunting along the eave and two lanterns that light up after dark, flower pots at its
   feet. Its cork face shows Polaroids of the trainers on lately (js/trainers.js's plazaTop()), each with their buddy,
   their card's colour and their name, yours with a gold YOU sticker; signed out, a notice to sign in. plazaBoard()
   builds it at the origin, its front towards +z; paint(list) redraws the cork, tick() sways the lanterns. */

let T;
const CORK_W = 1.7, CORK_H = 1.05, CW = 520, CH = 320;
const TIER = { green: ['#8ee0a8', '#2e8a58'], bronze: ['#f4c08a', '#a8582a'], silver: ['#e4ebf6', '#7a8aa8'], gold: ['#ffe48a', '#c8901a'], violet: ['#d8b4ff', '#6a3ac0'] };
const FONT = '"PokeDB Pixel", "Press Start 2P", monospace';

const seeded = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

function canvasTex(c) {
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Cork, speckled, a shade darker at its edges. */
function corkArt(g) {
  const rnd = seeded(23);
  g.fillStyle = '#c8935a'; g.fillRect(0, 0, CW, CH);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = ['#b07a44', '#dcac70', '#a46a38', '#e6bc84', '#8a5a2e'][Math.floor(rnd() * 5)];
    g.fillRect(rnd() * CW, rnd() * CH, 1 + rnd() * 2.4, 1 + rnd() * 2.4);
  }
  const edge = g.createRadialGradient(CW / 2, CH / 2, CH * 0.3, CW / 2, CH / 2, CW * 0.62);
  edge.addColorStop(0, 'rgba(60,30,10,0)'); edge.addColorStop(1, 'rgba(60,30,10,0.35)');
  g.fillStyle = edge; g.fillRect(0, 0, CW, CH);
}

function pin(g, x, y, colour = '#e8383a') {
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(x + 2, y + 3, 7, 0, Math.PI * 2); g.fill();
  const r = g.createRadialGradient(x - 2, y - 2, 1, x, y, 7);
  r.addColorStop(0, '#ffffff'); r.addColorStop(0.3, colour); r.addColorStop(1, '#5a0a10');
  g.fillStyle = r; g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill();
}

const fit = (g, text, max, size) => {
  let s = size;
  do { g.font = `${s}px ${FONT}`; } while (g.measureText(text).width > max && --s > 9);
};

const loadImg = (src) => new Promise(done => {
  const img = new Image();
  img.onload = () => done(img);
  img.onerror = () => done(null);
  img.src = src;
});

/** One Polaroid, its top left at (x, y), turned by `turn`: the photo in their card's colour with their buddy on it. */
function polaroid(g, x, y, turn, e, img) {
  const w = 132, h = 138, ph = 96;
  g.save();
  g.translate(x + w / 2, y + h / 2); g.rotate(turn); g.translate(-w / 2, -h / 2);
  g.fillStyle = 'rgba(40,20,5,0.35)'; g.fillRect(4, 5, w, h);
  g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h);
  const [hi, lo] = TIER[e?.tier] ?? ['#cfd6e2', '#7a8496'];
  const sky = g.createRadialGradient(w / 2, 62, 6, w / 2, 62, 80);
  sky.addColorStop(0, '#ffffff'); sky.addColorStop(0.45, hi); sky.addColorStop(1, lo);
  g.fillStyle = sky; g.fillRect(8, 8, w - 16, ph);
  g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.ellipse(w / 2, 92, 30, 7, 0, 0, Math.PI * 2); g.fill();
  if (img) {
    const s = Math.min(84 / img.width, 84 / img.height), iw = img.width * s, ih = img.height * s;
    g.imageSmoothingEnabled = false;
    if (e?.mon?.masked) {
      const c = new OffscreenCanvas(Math.ceil(iw), Math.ceil(ih)), cg = c.getContext('2d');
      cg.imageSmoothingEnabled = false;
      cg.drawImage(img, 0, 0, iw, ih); cg.globalCompositeOperation = 'source-in'; cg.fillStyle = '#1c1430'; cg.fillRect(0, 0, iw, ih);
      g.drawImage(c, w / 2 - iw / 2, 96 - ih);
    } else g.drawImage(img, w / 2 - iw / 2, 96 - ih, iw, ih);
  } else {
    g.fillStyle = 'rgba(28,20,48,0.55)'; fit(g, '?', 60, 44); g.textAlign = 'center'; g.fillText('?', w / 2, 80);
  }
  g.fillStyle = '#2a2238'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const name = e?.name ?? '???';
  fit(g, name, w - 14, 15);
  g.fillText(name, w / 2, h - 16);
  if (e?.mine) {
    g.fillStyle = '#ffd84a'; g.strokeStyle = '#8a5a00'; g.lineWidth = 2;
    g.beginPath(); g.arc(w - 12, 14, 15, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#6a3a00'; fit(g, 'YOU', 22, 10); g.fillText('YOU', w - 12, 18);
  }
  g.restore();
  pin(g, x + w / 2 + Math.sin(turn) * 60, y + 6, ['#e8383a', '#3a7ae8', '#f0c020', '#38b868'][Math.floor((x + y) / 7) % 4]);
}

/** A note pinned across the cork: a line or two in ink on paper. */
function notice(g, lines) {
  g.save();
  g.translate(CW / 2, CH / 2); g.rotate(-0.03);
  g.fillStyle = 'rgba(40,20,5,0.3)'; g.fillRect(-176, -56, 360, 120);
  g.fillStyle = '#fffbe8'; g.fillRect(-180, -60, 360, 120);
  g.fillStyle = '#e8383a'; g.fillRect(-180, -60, 360, 12);
  g.fillStyle = '#2a2238'; g.textAlign = 'center';
  lines.forEach((l, i) => { fit(g, l, 330, 18); g.fillText(l, 0, -12 + i * 34); });
  g.restore();
  pin(g, CW / 2 - 150, CH / 2 - 50); pin(g, CW / 2 + 150, CH / 2 - 52, '#3a7ae8');
}

/** The cork: `list` from plazaTop() (null signed out or offline, [] nobody yet). */
async function paintCork(c, list) {
  try { await document.fonts.load(`16px ${FONT}`); } catch (err) { /* the fallback font will do */ }
  const g = c.getContext('2d');
  corkArt(g);
  if (!list?.length) {
    const rnd = seeded(9);
    for (let i = 0; i < 3; i++) polaroid(g, 34 + i * 160, 26 + (i % 2) * 120, (rnd() - 0.5) * 0.2, null, null);
    notice(g, list ? ['NOBODY HERE YET!', 'CHECK BACK SOON'] : ['SIGN IN TO JOIN', 'THE TRAINER PLAZA!']);
    return;
  }
  const imgs = await Promise.all(list.map(e => loadImg(e.mon.src)));
  const rnd = seeded(31);
  list.slice(0, 6).forEach((e, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    polaroid(g, 22 + col * 166 + (rnd() - 0.5) * 10, 12 + row * 154 + (rnd() - 0.5) * 8, (rnd() - 0.5) * 0.18, e, imgs[i]);
  });
}

/** TRAINER PLAZA in gold on a teal plank. */
function plankArt() {
  const c = canvas(384, 72), g = c.getContext('2d');
  const wood = g.createLinearGradient(0, 0, 0, 72);
  wood.addColorStop(0, '#3cc0cc'); wood.addColorStop(0.55, '#1e8a9c'); wood.addColorStop(1, '#125a6a');
  g.fillStyle = wood; g.fillRect(0, 0, 384, 72);
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 4, 384, 3);
  g.strokeStyle = '#0a3a46'; g.lineWidth = 6; g.strokeRect(3, 3, 378, 66);
  for (const x of [16, 368]) { g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(x, 36, 5, 0, Math.PI * 2); g.fill(); }
  return c;
}
async function paintPlank(c) {
  try { await document.fonts.load(`16px ${FONT}`); } catch (err) { /* fallback */ }
  const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  fit(g, 'TRAINER PLAZA', 320, 30);
  g.fillStyle = '#0a3a46'; g.fillText('TRAINER PLAZA', 194, 40);
  g.fillStyle = '#ffe070'; g.fillText('TRAINER PLAZA', 192, 37);
}

export function plazaBoard(THREE, { glows, merge }) {
  T = THREE;
  const root = new T.Group(), still = new T.Group(), live = [];
  root.add(still);
  const add = (geo, m, x = 0, y = 0, z = 0, parent = still, shadow = true) => {
    const o = new T.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = shadow; o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const std = (o) => new T.MeshStandardMaterial({ roughness: 0.85, ...o });
  const wood = std({ color: '#9a6638' }), woodDark = std({ color: '#6a4222' }), stone = std({ color: '#c8c2b4', flatShading: true });
  const teal = std({ color: '#2a9fb0', roughness: 0.6 }), tealDark = std({ color: '#17707e', roughness: 0.6 }), gold = std({ color: '#f0c040', metalness: 0.5, roughness: 0.35 });

  // a stone step and the two posts, capped
  add(new T.BoxGeometry(2.3, 0.12, 0.62), stone, 0, 0.06, 0.02);
  for (const s of [-1, 1]) {
    add(new T.BoxGeometry(0.14, 2.42, 0.14), wood, s * 0.97, 1.33, 0);
    add(new T.BoxGeometry(0.2, 0.08, 0.2), woodDark, s * 0.97, 0.16, 0);
  }
  // the cork in its frame
  const cork = canvas(CW, CH);
  corkArt(cork.getContext('2d'));
  const corkTex = canvasTex(cork);
  add(new T.BoxGeometry(CORK_W + 0.04, CORK_H + 0.04, 0.06), woodDark, 0, 1.42, -0.02);
  const face = add(new T.PlaneGeometry(CORK_W, CORK_H), std({ map: corkTex, roughness: 0.95 }), 0, 1.42, 0.012, root, false);
  face.receiveShadow = true;
  for (const [w, h, x, y] of [[CORK_W + 0.2, 0.1, 0, 1.42 + CORK_H / 2 + 0.05], [CORK_W + 0.2, 0.1, 0, 1.42 - CORK_H / 2 - 0.05], [0.1, CORK_H, -CORK_W / 2 - 0.05, 1.42], [0.1, CORK_H, CORK_W / 2 + 0.05, 1.42]]) {
    add(new T.BoxGeometry(w, h, 0.1), wood, x, y, 0.01);
  }
  add(new T.BoxGeometry(CORK_W + 0.1, 0.05, 0.16), woodDark, 0, 1.42 - CORK_H / 2 - 0.12, 0.06);   // a ledge for chalk

  // the plank over it
  const plank = plankArt();
  const plankTex = canvasTex(plank);
  add(new T.BoxGeometry(1.5, 0.3, 0.06), tealDark, 0, 2.22, 0);
  add(new T.PlaneGeometry(1.46, 0.27), std({ map: plankTex, roughness: 0.6 }), 0, 2.22, 0.032, root, false);
  paintPlank(plank).then(() => { plankTex.needsUpdate = true; });

  // the gable: two teal slopes, a gold ridge with a Poké Ball on it
  for (const s of [-1, 1]) {
    const slope = add(new T.BoxGeometry(2.36, 0.07, 0.52), teal, 0, 2.62, s * 0.2);
    slope.rotation.x = s * 0.55;
    const trim = add(new T.BoxGeometry(2.4, 0.05, 0.05), gold, 0, 2.48, s * 0.42);
    trim.castShadow = false;
  }
  add(new T.CylinderGeometry(0.045, 0.045, 2.42, 8), gold, 0, 2.77, 0).rotation.z = Math.PI / 2;
  const ball = new T.Group();
  ball.position.set(0, 2.94, 0);
  add(new T.SphereGeometry(0.15, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), std({ color: '#e8383a', roughness: 0.4 }), 0, 0, 0, ball);
  add(new T.SphereGeometry(0.15, 18, 9, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std({ color: '#f8f8f8', roughness: 0.4 }), 0, 0, 0, ball);
  add(new T.TorusGeometry(0.15, 0.018, 6, 24), std({ color: '#1c1430' }), 0, 0, 0, ball).rotation.x = Math.PI / 2;
  add(new T.CylinderGeometry(0.045, 0.045, 0.03, 12), std({ color: '#ffffff' }), 0, 0, 0.15, ball).rotation.x = Math.PI / 2;
  root.add(ball);

  // bunting along the front eave, sagging between the posts
  const flagGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(-0.07, 0, 0), new T.Vector3(0.07, 0, 0), new T.Vector3(0, -0.15, 0)]);
  flagGeo.computeVertexNormals();
  const flags = ['#e8383a', '#f0c020', '#3a7ae8', '#38b868', '#f080b0'].map(c => std({ color: c, side: T.DoubleSide }));
  for (let i = 0; i < 11; i++) {
    const k = i / 10, x = -1.0 + k * 2.0, y = 2.42 - Math.sin(k * Math.PI) * 0.12;
    add(flagGeo, flags[i % flags.length], x, y, 0.46, still, false);
  }

  // two lanterns hanging off the eave's ends, lit after dark
  const glow = std({ color: '#fff0c0', emissive: new T.Color('#ffc860'), roughness: 0.4 });
  glow.userData.glow = 1.3; glow.userData.glowMin = 0.25;
  glows.push(glow);
  const lanterns = [];
  for (const s of [-1, 1]) {
    const l = new T.Group();
    l.position.set(s * 1.18, 2.44, 0.42);
    add(new T.CylinderGeometry(0.008, 0.008, 0.16, 4), woodDark, 0, -0.08, 0, l, false);
    add(new T.BoxGeometry(0.16, 0.04, 0.16), woodDark, 0, -0.17, 0, l);
    add(new T.BoxGeometry(0.13, 0.17, 0.13), glow, 0, -0.27, 0, l, false);
    add(new T.BoxGeometry(0.16, 0.04, 0.16), woodDark, 0, -0.37, 0, l);
    root.add(l);
    lanterns.push(l);
  }

  // a flower pot at each foot
  const pot = std({ color: '#c8643a' }), leaf = std({ color: '#4e9a3c' }), blooms = ['#f86878', '#f8d040', '#ffffff', '#b48af8'].map(c => std({ color: c, roughness: 0.6 }));
  const rnd = seeded(7), petal = new T.IcosahedronGeometry(0.06, 0), leafG = new T.IcosahedronGeometry(0.09, 0);
  for (const s of [-1, 1]) {
    const x = s * 1.35;
    add(new T.CylinderGeometry(0.2, 0.15, 0.26, 12), pot, x, 0.13, 0.12);
    for (let i = 0; i < 9; i++) {
      const a = rnd() * Math.PI * 2, d = rnd() * 0.12;
      add(leafG, leaf, x + Math.cos(a) * d, 0.3 + rnd() * 0.08, 0.12 + Math.sin(a) * d, still, false);
      add(petal, blooms[i % blooms.length], x + Math.cos(a) * d * 1.2, 0.38 + rnd() * 0.08, 0.12 + Math.sin(a) * d * 1.2, still, false);
    }
  }
  merge?.(still);

  const tick = (now, calm) => {
    const t = now / 1000;
    lanterns.forEach((l, i) => { l.rotation.z = calm ? 0 : Math.sin(t * 1.3 + i * 2) * 0.06; });
    if (!calm) ball.rotation.y = Math.sin(t * 0.7) * 0.25;
  };
  const paint = (list) => paintCork(cork, list).then(() => { corkTex.needsUpdate = true; });
  return { group: root, tick, paint };
}
