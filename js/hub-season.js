/* hub-season.js  -  the Clearing's seasonal dress (js/season.js picks the season, js/hub-3d.js lays it out).
   Halloween: autumn leaves on every tree, fallen leaves in the grass, jack-o'-lanterns round the plaza and down the trail
   lit from dusk, an orange tint, orange and violet wisps for fireflies, ghosts in the flyers' round. Winter: snow on the
   ground and the treetops, a snowman by the plaza, snow falling, a cold light, Delibird flying over.
   Everything here is data and painters; nothing is placed or saved. */

// the trees' crowns, the far ones, and the bushes, in the order js/hub-3d.js's P keeps them (light to outline)
const LEAVES = {
  halloween: {
    trees: [['#f8c050', '#e88a30', '#b85424', '#5e2410'], ['#f89848', '#d85a2a', '#a03420', '#501808'], ['#e8d058', '#c8a030', '#8a6a1c', '#4a3410']],
    deep: [['#d8803a', '#a8502a', '#782e1e', '#3a160c'], ['#b8602a', '#8a3a20', '#5a2414', '#2a1008']],
  },
  winter: {
    trees: [['#5aa070', '#3a8058', '#245e40', '#123a24']],
    deep: [['#3e7a5a', '#285e44', '#18422e', '#0a2618']],
  },
};
export const leavesOf = (s) => LEAVES[s] || null;

/** The ground's colours for the season, over js/hub-3d.js's P: meadow, blades, flowers (none), path, fallen leaves. */
export function groundLook(s, P) {
  if (s === 'winter') return {
    meadow: ['#f6f9fd', '#ecf2f9', '#e2eaf5', '#d6e0ee', '#c8d4e6', '#b8c6dc'],
    blade: null, flowers: [],
    path: ['#e8e6e2', '#d8d2c6', '#c4b8a4', '#9a8c74'],
    snowy: true,
  };
  if (s === 'halloween') return {
    meadow: ['#a8c860', '#98bc50', '#88b044', '#7aa23c', '#6c9636', '#5e8a30'],
    blade: ['#c8d878', '#98b050', '#5a7a30'], flowers: [], path: P.path,
    leaves: ['#f8b040', '#e8702a', '#c8401e', '#f0d050', '#a85020'],
  };
  return { meadow: P.meadow, blade: P.blade, flowers: P.flowers, path: P.path };
}

/** The view past the Safari gate (js/hub-vista.js): its meadow, treeline and wildflowers for the season. */
export function vistaLook(s) {
  if (s === 'winter') return { meadow: ['#f0f4fa', '#e2eaf4', '#d6e0ee'], trees: ['#5a8a78', '#1e4a3a'], flowers: [] };
  if (s === 'halloween') return { meadow: ['#d8c878', '#c4b058', '#b09c48'], trees: ['#e8903a', '#8a3a1c'], flowers: ['#f8b040', '#e8702a', '#c8401e'] };
  return null;
}

/** Snow on every top edge of a pixel painting: a white rim two pixels deep, a blue-grey pixel under it here and there. */
export function snowCap(c) {
  const { width: w, height: h } = c, g = c.getContext('2d'), d = g.getImageData(0, 0, w, h), a = (x, y) => y < 0 || d.data[(y * w + x) * 4 + 3] < 8 ? 0 : 1;
  const tops = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a(x, y) && !a(x, y - 1)) tops.push([x, y]);
  for (const [x, y] of tops) {
    g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1);
    if (a(x, y + 1)) { g.fillStyle = '#e8f0fa'; g.fillRect(x, y + 1, 1, 1); }
    if (a(x, y + 2) && (x * 7 + y * 3) % 3) { g.fillStyle = '#c4d4ea'; g.fillRect(x, y + 2, 1, 1); }
  }
  return c;
}

/* The light, nudged towards the season's colours over js/hub-3d.js's LIGHT: [colour, how far] per part. */
const TINT = {
  halloween: {
    dawn: { bg: ['#f0a070', 0.35], sun: ['#ffa060', 0.3] },
    day: { bg: ['#f0b878', 0.45], sky: ['#ffd8a8', 0.3], sun: ['#ffc080', 0.35] },
    dusk: { bg: ['#e86830', 0.4], sun: ['#ff7030', 0.3] },
    night: { bg: ['#2a1438', 0.6], sky: ['#9a68c0', 0.35] },
  },
  winter: {
    dawn: { bg: ['#e8d0d8', 0.4], ground: ['#a8a8b8', 0.4] },
    day: { bg: ['#d8e6f4', 0.55], sun: ['#eef4ff', 0.5], ground: ['#c8d4e2', 0.5] },
    dusk: { bg: ['#c8a0b8', 0.35], ground: ['#806878', 0.4] },
    night: { bg: ['#16223c', 0.5], ground: ['#384868', 0.5], sky: ['#8aa0e0', 0.25] },
  },
};
export const tintOf = (s, time) => TINT[s]?.[time] || null;

// pollen and fireflies' colours: autumn flecks, then orange and violet wisps; winter has snow instead
export const BUG_LOOK = {
  halloween: { pollen: [[1, 0.62, 0.26]], fireflies: [[1, 0.55, 0.18], [0.72, 0.42, 1]] },
};

// Pokémon who join the flyers' round in their season (lit: they're guests, not unlocks), and their sprites
export const SEASON_FLYERS = { halloween: ['gastly', 'haunter', 'gengar', 'misdreavus', 'drifloon'], winter: ['delibird', 'vanillite'] };

/* ---------- painters (smooth, like the Clearing's places: drawn at k canvas pixels a painted pixel) ---------- */

function smooth(w, h, k) {
  const c = new OffscreenCanvas(w * k, h * k), g = c.getContext('2d');
  c.fine = k;
  g.scale(k, k);
  g.lineJoin = g.lineCap = 'round';
  const glowCtx = () => {
    if (!c.glow) {
      c.glow = new OffscreenCanvas(c.width, c.height); c.glow.fine = k;
      const gg = c.glow.getContext('2d');
      gg.fillStyle = '#000'; gg.fillRect(0, 0, c.width, c.height);
      gg.scale(k, k); gg.lineJoin = gg.lineCap = 'round';
    }
    return c.glow.getContext('2d');
  };
  return { c, g, glowCtx };
}

/** A pumpkin, 8 x 7 painted pixels: ribbed, a curly stem; `face` carves a jack-o'-lantern whose face is its glow. */
export function pumpkinArt(seed, face = true) {
  const { c, g, glowCtx } = smooth(8, 7.4, 12), wide = 1 + (seed % 3) * 0.06;
  const body = g.createLinearGradient(0, 1.4, 0, 7.4);
  body.addColorStop(0, '#ffb04a'); body.addColorStop(0.55, '#f07a1e'); body.addColorStop(1, '#b84c10');
  g.fillStyle = '#6a2806';
  for (const [x, r] of [[2.4, 2.2], [5.6, 2.2], [4, 2.5]]) { g.beginPath(); g.ellipse(x, 4.5, r * wide + 0.25, 2.85, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = body;
  for (const [x, r] of [[2.4, 2.2], [5.6, 2.2], [4, 2.5]]) { g.beginPath(); g.ellipse(x, 4.5, r * wide, 2.6, 0, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = 'rgba(120,40,6,0.55)'; g.lineWidth = 0.22;   // the ribs
  for (const x of [2.7, 5.3]) { g.beginPath(); g.moveTo(x, 2.2); g.quadraticCurveTo(x + (x < 4 ? -0.9 : 0.9), 4.5, x, 6.9); g.stroke(); }
  g.fillStyle = 'rgba(255,240,200,0.45)'; g.beginPath(); g.ellipse(2.6, 3.2, 0.8, 0.45, -0.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#4a6a1e'; g.lineWidth = 0.7;   // the stem, then its curl
  g.beginPath(); g.moveTo(4, 2.2); g.quadraticCurveTo(4.1, 1.1, 4.8, 0.6); g.stroke();
  g.strokeStyle = '#6a9a2e'; g.lineWidth = 0.25;
  g.beginPath(); g.moveTo(4.3, 1.7); g.bezierCurveTo(3, 1.6, 3, 0.4, 3.6, 0.5); g.stroke();
  if (!face) return c;
  const tri = (gg, pts) => { gg.beginPath(); pts.forEach(([x, y], i) => i ? gg.lineTo(x, y) : gg.moveTo(x, y)); gg.closePath(); gg.fill(); };
  const carve = (gg, col) => {
    gg.fillStyle = col;
    if (seed % 3 === 1) {   // round eyes and a wide, gap-toothed smile
      for (const x of [2.9, 5.1]) { gg.beginPath(); gg.ellipse(x, 3.7, 0.55, 0.65, 0, 0, Math.PI * 2); gg.fill(); }
      tri(gg, [[3.7, 4.9], [4, 4.3], [4.3, 4.9]]);
      gg.beginPath(); gg.moveTo(2.1, 5.2); gg.quadraticCurveTo(4, 7.3, 5.9, 5.2); gg.quadraticCurveTo(4, 6.2, 2.1, 5.2); gg.fill();
      return;
    }
    if (seed % 3 === 2) {   // a scowl: slanted eyes and a jagged frown
      tri(gg, [[2.1, 3.2], [3.7, 3.9], [2.5, 4.4]]);
      tri(gg, [[5.9, 3.2], [4.3, 3.9], [5.5, 4.4]]);
      tri(gg, [[2.2, 6.2], [2.8, 5.2], [3.3, 5.9], [4, 5.1], [4.7, 5.9], [5.2, 5.2], [5.8, 6.2], [5, 5.9], [4, 6.4], [3, 5.9]]);
      return;
    }
    gg.beginPath(); gg.moveTo(2.3, 4.2); gg.lineTo(3.2, 3); gg.lineTo(3.6, 4.3); gg.closePath(); gg.fill();
    gg.beginPath(); gg.moveTo(5.7, 4.2); gg.lineTo(4.8, 3); gg.lineTo(4.4, 4.3); gg.closePath(); gg.fill();
    gg.beginPath(); gg.moveTo(3.7, 4.9); gg.lineTo(4, 4.4); gg.lineTo(4.3, 4.9); gg.closePath(); gg.fill();
    gg.beginPath(); gg.moveTo(2, 5.3);   // a toothy grin
    for (const [x, y] of [[2.7, 6.3], [3.3, 5.8], [3.9, 6.5], [4.5, 5.8], [5.2, 6.3], [6, 5.3], [5.2, 5.7], [4.6, 5.4], [4, 5.8], [3.4, 5.4], [2.8, 5.7]]) gg.lineTo(x, y);
    gg.closePath(); gg.fill();
  };
  carve(g, '#4a1a04');
  carve(glowCtx(), '#ffffff');
  return c;
}

/** A snowman, 10 x 16 painted pixels: three snowballs, coal eyes and buttons, a carrot, twig arms, a red scarf and a hat. */
export function snowmanArt() {
  const { c, g } = smooth(12, 16.5, 10);
  const ball = (x, y, r) => {
    g.fillStyle = '#8a9ab8'; g.beginPath(); g.arc(x, y, r + 0.25, 0, Math.PI * 2); g.fill();
    const s = g.createRadialGradient(x - r * 0.4, y - r * 0.45, 0, x, y, r);
    s.addColorStop(0, '#ffffff'); s.addColorStop(0.7, '#e8eef8'); s.addColorStop(1, '#bccae0');
    g.fillStyle = s; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  g.strokeStyle = '#5a3a1c'; g.lineWidth = 0.45;   // the arms, behind
  g.beginPath(); g.moveTo(4, 8.6); g.lineTo(0.8, 6.6); g.moveTo(1.8, 7.2); g.lineTo(1.2, 5.9); g.moveTo(8, 8.6); g.lineTo(11.2, 6.4); g.moveTo(10.2, 7.1); g.lineTo(11, 5.8); g.stroke();
  ball(6, 13.2, 3.2); ball(6, 8.6, 2.4); ball(6, 4.9, 1.8);
  g.fillStyle = '#222833';
  for (const [x, y] of [[5.3, 4.5], [6.7, 4.5], [6, 7.9], [6, 9.1], [6, 12.2], [6, 13.6]]) { g.beginPath(); g.arc(x, y, 0.28, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#f08020'; g.beginPath(); g.moveTo(6, 5); g.lineTo(8.1, 5.5); g.lineTo(6, 5.6); g.closePath(); g.fill();
  g.fillStyle = '#d83a30'; g.beginPath(); g.roundRect(4, 6.3, 4, 0.9, 0.4); g.fill();   // the scarf, its end hanging
  g.beginPath(); g.roundRect(6.6, 6.6, 0.9, 2.4, 0.3); g.fill();
  g.fillStyle = '#f8f0e0'; g.fillRect(6.6, 8.3, 0.9, 0.25);
  g.fillStyle = '#2a2a38'; g.beginPath(); g.roundRect(3.9, 3.1, 4.2, 0.6, 0.25); g.fill();   // the hat
  g.beginPath(); g.roundRect(4.6, 0.8, 2.8, 2.5, 0.3); g.fill();
  g.fillStyle = '#d83a30'; g.fillRect(4.6, 2.4, 2.8, 0.5);
  return c;
}

/* ---------- Halloween's yard: graves, a scarecrow, a cauldron, candles, hay, lanterns, dead trees, glowing caps, bats.
   Their glow maps are drawn in the light's own colour, so js/hub-3d.js lights them with a white emissive. ---------- */

const circle = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
const blob = (g, x, y, rx, ry, a = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, Math.PI * 2); g.fill(); };
function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); }
function flame(g, x, y, s, glow) {
  const f = g.createRadialGradient(x, y - s * 0.3, 0, x, y - s * 0.4, s);
  f.addColorStop(0, '#fffbe0'); f.addColorStop(0.45, '#ffd040'); f.addColorStop(1, '#ff7a10');
  g.fillStyle = f;
  g.beginPath(); g.moveTo(x, y - s * 1.6); g.quadraticCurveTo(x + s * 0.75, y - s * 0.3, x, y); g.quadraticCurveTo(x - s * 0.75, y - s * 0.3, x, y - s * 1.6); g.fill();
  if (glow) {
    const h = glow.createRadialGradient(x, y - s * 0.5, 0, x, y - s * 0.5, s * 1.3);
    h.addColorStop(0, '#ffe8a0'); h.addColorStop(1, 'rgba(255,140,30,0)');
    glow.fillStyle = h; circle(glow, x, y - s * 0.5, s * 1.3);
  }
}
// a carved pumpkin's white glow, laid into another painting's glow map in the candle's orange
function pumpkinGlow(gl, p, x, y, w, h) {
  gl.save();
  gl.beginPath(); gl.rect(x, y, w, h); gl.clip();
  gl.drawImage(p.glow, 0, 0, p.width, p.height, x, y, w, h);
  gl.globalCompositeOperation = 'multiply'; gl.fillStyle = '#ffa040'; gl.fillRect(x, y, w, h);
  gl.restore();
}

/** A gravestone, 11 x 13: a round-topped slab, a cross or a pointed one by `seed`, mossy, cracked, RIP cut in it. */
export function graveArt(seed) {
  const { c, g } = smooth(11, 13, 12), kind = seed % 3, tilt = ((seed * 37) % 7 - 3) * 0.025;
  g.fillStyle = '#4a3a24'; blob(g, 5.5, 12.2, 5.2, 0.9);   // the mound
  g.fillStyle = '#6a8a3a'; blob(g, 5.5, 11.9, 4.6, 0.6);
  g.save(); g.translate(5.5, 12); g.rotate(tilt); g.translate(-5.5, -12);
  const st = g.createLinearGradient(1, 0, 10, 0);
  st.addColorStop(0, '#b4b8c4'); st.addColorStop(0.5, '#9298a8'); st.addColorStop(1, '#6a7084');
  const shape = () => {
    g.beginPath();
    if (kind === 0) { g.moveTo(1.6, 12); g.lineTo(1.6, 4.6); g.arc(5.5, 4.6, 3.9, Math.PI, 0); g.lineTo(9.4, 12); }
    else if (kind === 1) { for (const [x, y] of [[4.4, 12], [4.4, 5.4], [1.8, 5.4], [1.8, 3.6], [4.4, 3.6], [4.4, 0.8], [6.6, 0.8], [6.6, 3.6], [9.2, 3.6], [9.2, 5.4], [6.6, 5.4], [6.6, 12]]) g.lineTo(x, y); }
    else { g.moveTo(2.2, 12); g.lineTo(2.2, 4); g.lineTo(5.5, 0.8); g.lineTo(8.8, 4); g.lineTo(8.8, 12); }
    g.closePath();
  };
  g.fillStyle = '#3e4252'; g.save(); g.translate(0.35, 0.2); shape(); g.fill(); g.restore();
  g.fillStyle = st; shape(); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(kind === 1 ? 4.6 : 2.1, kind === 1 ? 1.2 : 4.5, 0.5, 6.5);
  g.fillStyle = '#5a6a30';   // moss creeping up from the foot
  for (let i = 0; i < 6; i++) blob(g, 2.4 + ((seed * 13 + i * 29) % 60) / 10, 11.4 - (i % 3) * 0.5, 0.9, 0.5);
  g.strokeStyle = '#4a4e5e'; g.lineWidth = 0.22;
  g.beginPath(); g.moveTo(kind === 1 ? 6.2 : 7.6, kind === 1 ? 6 : 5); g.lineTo(6.6, 7.2); g.lineTo(7.2, 8.4); g.lineTo(6.5, 9.6); g.stroke();
  if (kind !== 1) {
    g.font = '900 2.1px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillText('RIP', 5.55, 6.4);
    g.fillStyle = '#4e5464'; g.fillText('RIP', 5.5, 6.3);
    g.fillStyle = '#5e6474'; g.fillRect(3.4, 8.2, 4.2, 0.3); g.fillRect(3.9, 9.2, 3.2, 0.3);
  }
  g.restore();
  return c;
}

/** A bare, twisted tree, 26 x 34: crooked boughs, a cobweb in its fork, a crow on a bough and a lantern hung from another. */
export function deadTreeArt(seed) {
  const { c, g, glowCtx } = smooth(26, 34, 8), gl = glowCtx();
  if (seed % 2) for (const ctx of [g, gl]) { ctx.translate(26, 0); ctx.scale(-1, 1); }
  const bark = g.createLinearGradient(9, 0, 17, 0);
  bark.addColorStop(0, '#5a4a40'); bark.addColorStop(0.6, '#3a2e2a'); bark.addColorStop(1, '#221a18');
  g.strokeStyle = bark;
  const bough = (pts, w) => { g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
  g.fillStyle = bark;
  poly(g, [[9.5, 34], [11.5, 22], [11, 14], [13, 9], [15, 14], [14.8, 22], [17, 34]]);
  poly(g, [[8, 34], [10.5, 31], [12, 34]]); poly(g, [[15.5, 34], [17.5, 31], [19.5, 34]]);
  bough([[12, 16], [8, 11], [4, 10], [2, 7]], 1.3); bough([[6, 10.5], [5, 6.5], [6.5, 4]], 0.7);
  bough([[14, 15], [19, 11], [22, 11.5], [24.5, 8]], 1.2); bough([[20, 11], [20.5, 7], [19, 4.5]], 0.7);
  bough([[13, 10], [12.5, 5], [14, 1.5]], 0.9); bough([[12.6, 6], [10.5, 3.5]], 0.5);
  g.strokeStyle = 'rgba(240,240,250,0.75)'; g.lineWidth = 0.12;   // the cobweb between the left boughs
  const hub = [8.6, 8.4];
  for (const [x, y] of [[4.5, 9.8], [5.6, 6.2], [7, 4.6], [10.6, 5], [11.8, 9.8], [9.4, 12.6]]) { g.beginPath(); g.moveTo(...hub); g.lineTo(x, y); g.stroke(); }
  for (const r of [0.8, 1.6, 2.5, 3.3]) { g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; g.lineTo(hub[0] + Math.cos(a) * r, hub[1] + Math.sin(a) * r * 0.9); } g.stroke(); }
  g.fillStyle = '#1a1420'; circle(g, 9.6, 9.6, 0.45); circle(g, 9.6, 10.2, 0.3);
  g.fillStyle = '#1e1a2e';   // the crow, perched on the right bough
  blob(g, 21.6, 9.6, 1.5, 1.1); circle(g, 22.9, 8.4, 0.8);
  poly(g, [[20.4, 9.8], [18.4, 10.8], [20.6, 10.4]]); poly(g, [[23.4, 8.1], [24.8, 8.6], [23.5, 8.8]]);
  poly(g, [[22.4, 7.9], [21.6, 6.6], [22.9, 7.6]]);
  g.fillStyle = '#f8d040'; circle(g, 23.1, 8.25, 0.22);
  g.strokeStyle = '#2a2018'; g.lineWidth = 0.15;   // a lantern on a string from the left bough
  g.beginPath(); g.moveTo(3.4, 9.6); g.lineTo(3.4, 13.4); g.stroke();
  g.fillStyle = '#3a2a1a'; g.fillRect(2.4, 13.3, 2, 0.5); g.fillRect(2.4, 16.4, 2, 0.5);
  g.fillStyle = '#f8a040'; g.beginPath(); g.roundRect(2.5, 13.7, 1.8, 2.8, 0.6); g.fill();
  gl.fillStyle = '#ffb050'; gl.beginPath(); gl.roundRect(2.5, 13.7, 1.8, 2.8, 0.6); gl.fill();
  gl.fillStyle = '#f8d040'; circle(gl, 23.1, 8.25, 0.25);
  return c;
}

/** A scarecrow, 16 x 26: a post and crossbar, a patched plaid shirt, straw cuffs, a jack-o'-lantern head and a crooked hat. */
export function scarecrowArt() {
  const { c, g, glowCtx } = smooth(16, 26, 10);
  g.fillStyle = '#6a4a2a'; g.fillRect(7.3, 9, 1.4, 17); g.fillRect(1, 11.2, 14, 1.1);
  g.fillStyle = '#e8c860';   // straw at the cuffs and the hem
  for (const [x, d] of [[1.2, -1], [14.8, 1]]) for (let i = 0; i < 5; i++) poly(g, [[x, 11 + i * 0.3], [x + d * (1.4 + (i % 2) * 0.5), 10.8 + i * 0.6], [x, 11.6 + i * 0.3]]);
  for (let i = 0; i < 9; i++) poly(g, [[4.6 + i * 0.75, 18.6], [4.4 + i * 0.75 + (i % 2) * 0.3, 20.6 + (i % 3) * 0.4], [5.1 + i * 0.75, 18.6]]);
  const shirt = g.createLinearGradient(0, 10, 0, 19);
  shirt.addColorStop(0, '#c8402a'); shirt.addColorStop(1, '#8a2418');
  g.fillStyle = shirt;
  poly(g, [[4.4, 10.4], [11.6, 10.4], [14, 11], [14, 12.6], [11.4, 12.8], [11.8, 18.8], [4.2, 18.8], [4.6, 12.8], [2, 12.6], [2, 11]]);
  g.strokeStyle = 'rgba(40,10,6,0.45)'; g.lineWidth = 0.2;   // plaid
  for (const x of [5.6, 7.4, 9.2, 11]) { g.beginPath(); g.moveTo(x, 10.6); g.lineTo(x, 18.7); g.stroke(); }
  for (const y of [12.4, 14.6, 16.8]) { g.beginPath(); g.moveTo(4.4, y); g.lineTo(11.7, y); g.stroke(); }
  g.fillStyle = '#5a7ab8'; g.fillRect(9.4, 15.2, 1.8, 1.8);   // a patch
  g.strokeStyle = '#f8f0e0'; g.lineWidth = 0.12; g.setLineDash([0.3, 0.25]); g.strokeRect(9.4, 15.2, 1.8, 1.8); g.setLineDash([]);
  const head = pumpkinArt(4, true);
  g.drawImage(head, 0, 0, head.width, head.height, 4.2, 2.6, 7.6, 7);
  pumpkinGlow(glowCtx(), head, 4.2, 2.6, 7.6, 7);
  g.fillStyle = '#4a3a2a'; g.beginPath(); g.ellipse(8, 4.2, 5, 0.9, -0.08, 0, Math.PI * 2); g.fill();   // the hat's brim, then its crown
  poly(g, [[5.4, 4], [6.6, 0.6], [9.4, 0.2], [10.6, 3.9]]);
  g.fillStyle = '#8a3a8a'; g.fillRect(5.9, 2.7, 4.4, 0.7);
  return c;
}

/** A huddle of three to five candles, 10 x 9, dripping wax; their flames glow. */
export function candlesArt(seed) {
  const { c, g, glowCtx } = smooth(10, 9, 12), gl = glowCtx(), n = 3 + (seed % 3);
  const at = [[2.4, 4.2, 0.8], [5, 2.6, 0.95], [7.6, 4.8, 0.75], [3.8, 5.6, 0.6], [6.4, 5.2, 0.65]].slice(0, n).sort((a, b) => a[1] - b[1]);
  g.fillStyle = '#e8dcc0'; blob(g, 5, 8.4, 4.4, 0.6);
  for (const [x, top, r] of at) {
    const wax = g.createLinearGradient(x - r, 0, x + r, 0);
    wax.addColorStop(0, '#fff8ec'); wax.addColorStop(1, '#d8c8a8');
    g.fillStyle = wax; g.fillRect(x - r, top, r * 2, 8.4 - top);
    blob(g, x, top, r, 0.3);
    g.fillStyle = '#fffaf0'; g.beginPath(); g.roundRect(x + r * 0.2, top, 0.35, 1.2 + (x % 1), 0.17); g.fill();
    g.strokeStyle = '#2a2018'; g.lineWidth = 0.15; g.beginPath(); g.moveTo(x, top); g.lineTo(x, top - 0.4); g.stroke();
    flame(g, x, top - 0.3, 0.6, gl);
  }
  return c;
}

/** A hay bale, 15 x 11, a pumpkin and a gourd sat on it and a corn sheaf leaning behind. */
export function hayArt(seed) {
  const { c, g, glowCtx } = smooth(15, 11, 10);
  g.fillStyle = '#c8a040';   // the sheaf
  for (let i = 0; i < 7; i++) poly(g, [[11 + i * 0.35, 6], [10 + i * 0.6, 0.4 + (i % 3) * 0.4], [11.4 + i * 0.35, 6]]);
  const hay = g.createLinearGradient(0, 4, 0, 11);
  hay.addColorStop(0, '#f8dc78'); hay.addColorStop(1, '#c09030');
  g.fillStyle = hay; g.beginPath(); g.roundRect(0.6, 4.6, 13.8, 6.2, 1.2); g.fill();
  g.strokeStyle = 'rgba(120,80,20,0.4)'; g.lineWidth = 0.14;
  for (let i = 0; i < 26; i++) { const x = 1 + (i * 53 % 130) / 10, y = 5 + (i * 31 % 55) / 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.9, y + 0.2); g.stroke(); }
  g.fillStyle = '#7a3a1a'; g.fillRect(3.6, 4.6, 0.4, 6.2); g.fillRect(10.6, 4.6, 0.4, 6.2);
  const p = pumpkinArt(seed + 1, seed % 2 === 0);
  g.drawImage(p, 0, 0, p.width, p.height, 2.4, 0.2, 6, 5.6);
  if (p.glow) pumpkinGlow(glowCtx(), p, 2.4, 0.2, 6, 5.6);
  const gourd = g.createLinearGradient(8, 2, 11, 5);
  gourd.addColorStop(0, '#f8e870'); gourd.addColorStop(1, '#6a9a30');
  g.fillStyle = gourd; blob(g, 9.6, 3.9, 1.5, 1.1); blob(g, 9.2, 2.8, 0.7, 0.9, -0.3);
  return c;
}

/** A crooked lantern post, 9 x 26: a paper lantern with a bat cut in it swinging from its hook, leaves at its foot. */
export function lanternArt(seed) {
  const { c, g, glowCtx } = smooth(9, 26, 10), gl = glowCtx(), lean = ((seed * 17) % 5 - 2) * 0.02;
  for (const ctx of [g, gl]) { ctx.translate(2.4, 26); ctx.rotate(lean); ctx.translate(-2.4, -26); }
  const wood = g.createLinearGradient(1.6, 0, 3.2, 0);
  wood.addColorStop(0, '#7a5a3a'); wood.addColorStop(1, '#4a3420');
  g.fillStyle = wood; g.fillRect(1.6, 3, 1.6, 23); g.fillRect(1.6, 3, 5.4, 1);
  g.fillStyle = '#4a3420'; poly(g, [[3.2, 4], [4.6, 4], [3.2, 5.6]]);
  g.strokeStyle = '#2a2018'; g.lineWidth = 0.15; g.beginPath(); g.moveTo(6.2, 4); g.lineTo(6.2, 5.6); g.stroke();
  const paper = g.createRadialGradient(6, 8.2, 0.2, 6.2, 8.6, 3);
  paper.addColorStop(0, '#fff0b0'); paper.addColorStop(0.6, '#f8a040'); paper.addColorStop(1, '#c8601a');
  g.fillStyle = '#3a2a1a'; g.fillRect(5.2, 5.4, 2, 0.6); g.fillRect(5.2, 11.4, 2, 0.6);
  g.fillStyle = paper; blob(g, 6.2, 8.7, 2.3, 3);
  g.strokeStyle = 'rgba(140,60,10,0.4)'; g.lineWidth = 0.14;
  for (const y of [7, 8.7, 10.4]) { g.beginPath(); g.ellipse(6.2, y, 2.2, 0.35, 0, 0, Math.PI); g.stroke(); }
  gl.fillStyle = '#ffb860'; blob(gl, 6.2, 8.7, 2.2, 2.9);
  for (const ctx of [g, gl]) {   // a bat cut out of the paper
    ctx.fillStyle = ctx === g ? '#3a1a10' : '#000';
    poly(ctx, [[6.2, 8.2], [5.4, 7.6], [4.6, 8], [5, 8.4], [5.6, 8.6], [6.2, 9.1], [6.8, 8.6], [7.4, 8.4], [7.8, 8], [7, 7.6]]);
  }
  for (const ctx of [g, gl]) ctx.setTransform(c.fine, 0, 0, c.fine, 0, 0);
  g.fillStyle = '#e8702a'; blob(g, 1.2, 25.6, 1, 0.4, 0.3); g.fillStyle = '#c8401e'; blob(g, 3.8, 25.7, 0.9, 0.35, -0.4);
  return c;
}

/** Glowing toadstools, 10 x 7, in violet or ghost-green by `seed`; their caps glow. */
export function capsArt(seed) {
  const { c, g, glowCtx } = smooth(10, 7, 12), gl = glowCtx(), hue = seed % 2 ? ['#b070f0', '#6a2ab0', '#e0b8ff'] : ['#70f0b0', '#2a9a6a', '#c8ffe0'];
  for (const [x, h, r] of [[2.4, 3.6, 1.6], [8, 3, 1.3], [5.4, 5, 2.2]]) {
    g.fillStyle = '#efe6d6'; g.beginPath(); g.roundRect(x - r * 0.28, 7 - h, r * 0.56, h, 0.3); g.fill();
    const cap = g.createRadialGradient(x - r * 0.3, 7 - h - r * 0.4, 0, x, 7 - h, r * 1.1);
    cap.addColorStop(0, hue[2]); cap.addColorStop(0.5, hue[0]); cap.addColorStop(1, hue[1]);
    for (const [ctx, fill] of [[g, cap], [gl, hue[0]]]) { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, 7 - h, r, r * 0.75, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); }
    for (const ctx of [g, gl]) { ctx.fillStyle = '#fff'; for (const [dx, dy, s] of [[-0.4, -0.45, 0.16], [0.35, -0.3, 0.13], [0, -0.62, 0.1]]) circle(ctx, x + dx * r, 7 - h + dy * r, s * r); }
  }
  return c;
}

/** A bat, 12 x 7, wings up or down: two frames for js/hub-spooky.js to flap. */
export function batArt(up) {
  const { c, g, glowCtx } = smooth(12, 7, 8);
  g.fillStyle = '#2a1a3a';
  const wing = (d) => poly(g, [[6, 3.4], ...(up ? [[2, 1], [4, 0.2], [5.6, 1.4], [4.4, 2.2], [3.6, 3.4], [2.4, 3]] : [[2.2, 3.4], [4.6, 4.2], [5.8, 6], [4.2, 5.4], [3.2, 6.2], [2, 4.8]]).map(([x, y]) => [6 + d * x, y])]);
  wing(-1); wing(1);
  blob(g, 6, 3.8, 1.2, 1.5);
  poly(g, [[5.1, 2.8], [5.4, 1.6], [5.9, 2.6]]); poly(g, [[6.9, 2.8], [6.6, 1.6], [6.1, 2.6]]);
  const gl = glowCtx();
  for (const ctx of [g, gl]) { ctx.fillStyle = '#ff4060'; circle(ctx, 5.5, 3.3, 0.25); circle(ctx, 6.5, 3.3, 0.25); }
  return c;
}
