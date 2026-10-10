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
  const carve = (gg, col) => {
    gg.fillStyle = col;
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
