/* ============================================================
   safari-intro.js  -  the Safari Zone's six areas arriving (2026-10-02).

   The same film as the main biomes' (run() in js/biome-intro.js plays
   it: the title, the Pokémon popping out of the grass, your Pokémon
   walking on), with one painter for all six areas and a camera move of
   each area's own:

     Meadow   down through the clouds, then a pan across to the Lone Tree
     Forest   a slow push in between the trunks towards the sunlit glade
     Wetland  gliding down and along the lake to the lilies' bloom
     Marsh    the mist parting as you creep in on the Great Snag
     Peak     rising out of the alpine grass to the summit
     Desert   a whip pan over the dunes, pulling back to the oasis

   Five layers (far, mid with the area's goal, back, ground, fore) slid by
   the camera at their own speeds, grown about the goal for a push, like
   the Clearing's. Every area keeps the Zone's own look from js/scene.js:
   its ranch fence, the games' tall grass, the green signboard at the
   entrance and the rest house by the boss, and the one road (the trail)
   running from your feet to the goal.
   ============================================================ */

import { ease, easeOut, span, layer, disc, mix, dither, paintSky, cloudImage, paintFar, tallGrass, paintFore, rockImage, deadTreeImage } from './biome-intro.js';
import { playSound } from './audio.js';

const SPEED = { far: 0.1, mid: 0.35, back: 0.6, ground: 0.85, fore: 1.3, near: 1.6 };
const LIFT = { far: 0.7, mid: 0.8, back: 0.9, ground: 1, fore: 1.3, near: 1.3 };
const DOLLY = { far: 0.03, mid: 0.25, back: 0.45, ground: 0.75, fore: 1.2, near: 2.4 };

/* Each area's camera: `pan` how far it travels (in screen widths), `below` how far under the rest frame it starts
   (a rise needs the layers painted that much lower), `at(ms, beats, H)` -> { lift, pan (0-1), z (the push) }. */
const CAMS = {
  drop: { pan: 1.5, at: (ms, b, H) => ({ lift: (1 - easeOut(span(b.TILT, ms))) * H * 1.05, pan: ease(span(b.PAN, ms)), z: 0 }) },
  push: { pan: 0, at: (ms, b) => ({ lift: 0, pan: 0, z: ease(span(b.PUSH, ms)) * 0.55 }) },
  glide: { pan: 1.3, at: (ms, b, H) => ({ lift: (1 - easeOut(span(b.DESCEND, ms))) * H * 0.4, pan: 1 - ease(span(b.PAN, ms)), z: 0 }) },
  mist: { pan: 0.45, at: (ms, b) => ({ lift: 0, pan: ease(span(b.PAN, ms)), z: ease(span(b.PUSH, ms)) * 0.3 }) },
  crane: { pan: 0, below: 0.6, at: (ms, b, H) => ({ lift: -(1 - ease(span(b.RISE, ms))) * H * 0.6, pan: 0, z: 0 }) },
  sweep: { pan: 1.6, at: (ms, b) => ({ lift: 0, pan: easeOut(span(b.PAN, ms)), z: (1 - easeOut(span(b.PULL, ms))) * 0.45 }) },
};

// the Zone's own colours, the same in every area (js/scene.js's SAFARI_MARKS)
const ZONE = {
  fence: ['#f0dcb0', '#c09a68', '#7a5a34'],
  board: ['#68c858', '#2e8a34', '#14501c'], ink: ['#fff8e0'], post: ['#9a7448', '#5a3e20'],
  roof: ['#68c058', '#3e9038', '#245a22'], wall: ['#fff4dc', '#e0cca0', '#a88c60'],
};

// each later place nearer the goal; the boss's place has the rest house beside it
const NEARER = [null, { goal: 1.35 }, { goal: 1.8 }, { goal: 2.4, house: true }];
const nearer = (extra = []) => NEARER.map((s, i) => s && { ...s, ...extra[i] });

const SKY_FOREST = {
  day: { sky: ['#8cbcd8', '#9ec8dc', '#b0d2e0', '#c2dce2', '#d2e6e2'], cloud: ['#ffffff', '#e0ecf0', '#b8ccd4'] },
  dawn: { sky: ['#a898b8', '#bca4b8', '#d0b0b4', '#e0c0b4', '#ecd2bc'], cloud: ['#fce0e0', '#e0b8c4', '#a88898'] },
  dusk: { sky: ['#3a3460', '#5a4470', '#8a5878', '#b86e74', '#d88c74'], cloud: ['#e8a088', '#b06878', '#6a4060'] },
  night: { sky: ['#06101e', '#0a1828', '#102034', '#162a40', '#1e344a'], cloud: ['#2a3a48', '#1e2c38', '#142028'] },
};
const SKY_MARSH = {
  day: { sky: ['#7a8c84', '#8a9a90', '#9aa89c', '#aab6a8', '#bac2b2', '#c8cebc'], cloud: ['#d8dcd0', '#b8c0b4', '#98a298'] },
  dawn: { sky: ['#8a8098', '#9c8ea0', '#b09ea4', '#c2aea8', '#d2bcae', '#dccab8'], cloud: ['#e0d0d0', '#c0aab0', '#988890'] },
  dusk: { sky: ['#2e2c44', '#443a52', '#60485a', '#7c5a60', '#987068', '#ae8470'], cloud: ['#a88078', '#806068', '#584450'] },
  night: { sky: ['#060c10', '#0a141a', '#0e1c22', '#14242a', '#1a2c32', '#203438'], cloud: ['#2a3432', '#1e2826', '#141c1a'] },
};

const film = (id, o) => ({ safari: true, title: ['SAFARI', 'ZONE'], scene: safariScene, ...o, art: { id, ...o.art } });

export const SAFARI_INTROS = {
  meadow: film('meadow', {
    ink: ['#fff8d0', '#3a8a2a', '#123a10'],
    land: {
      far: ['#9cc4b8', '#b0d4c8'], hill: ['#a8d078', '#90bc64', '#7aa854'],
      crown: ['#a0d060', '#78b048', '#56903a', '#2e5a24'], bark: ['#8a6440', '#4e3418'],
      ground: ['#b8dc74', '#aad268', '#9cc85e', '#8ebc54', '#80b04a', '#72a442'], blade: ['#d8f498', '#94c858', '#508a34'],
      tall: ['#78c850', '#4e9a38', '#164418'], fore: ['#8cd058', '#62a840', '#3e8030', '#1e4a18'],
      flowers: ['#ffffff', '#f8d848', '#f8a0c8', '#f87850'], trail: ['#f0dca8', '#dcc08a', '#b89c68', '#8aa050'],
      ...ZONE,
    },
    glow: { aura: ['#fffce0', '#fff0a0', '#e8f080'], pollen: ['#fffce0', '#f8f0a0'], wing: ['#ffffff', '#f8d848', '#f8a040'], firefly: ['#f8f8a0', '#c8e858'] },
    stages: nearer([null, { flowers: 3 }, { patches: 1 }]),
    beats: { TILT: [0, 2600], PAN: [500, 7300], POPS: [2500, 3500, 4500], TITLE_AT: 4900, END: 8900 },
    art: { move: 'drop', far: meadowFar, mid: meadowMid, back: fenceBack, ground: meadowGround, trail: [{ at: 0, style: 'dirt' }], birds: '#34405c', air: ['pollen', 'butterflies'] },
  }),
  forest: film('forest', {
    ink: ['#f0ffd8', '#2a6a34', '#0c2a12'], skies: SKY_FOREST,
    land: {
      far: ['#8cb4a0', '#7aa490'], woods: ['#3e7048', '#2c5838', '#1e4228'],
      crown: ['#64b050', '#44903e', '#2c6e32', '#1a4c24'], bark: ['#7a5a3c', '#5a4028', '#3a2818'],
      glade: ['#fffbe0', '#f4f4b8', '#d8ec98', '#b0d870', '#88c058'],
      ground: ['#6aa44a', '#5e9844', '#528c3e', '#468038', '#3a7432', '#2e682c'], blade: ['#a0d070', '#5e9448', '#2e5c2a'],
      tall: ['#62b048', '#3e8a36', '#103a16'], fore: ['#6ab048', '#4a903c', '#2e6a2e', '#143a18'],
      fern: ['#88c860', '#5a9a44', '#2e6a2c'], cap: ['#f05040', '#ffffff', '#a8302a'],
      flowers: ['#f8f0f8', '#b0a0f8'], trail: ['#b89a70', '#9a7c56', '#7a5e3e', '#4e7a34'],
      ...ZONE,
    },
    glow: { aura: ['#fffce8', '#fff4b8', '#f0f0a0'], leaf: ['#d8c050', '#88c058', '#e88a38'], firefly: ['#f8f8a0', '#c8e858'] },
    stages: nearer([null, { shade: 0.12 }, { shade: 0.3 }, { shade: 0 }]),
    beats: { PUSH: [0, 7600], POPS: [2400, 3400, 4400], TITLE_AT: 5000, END: 9000 },
    art: { move: 'push', far: forestFar, mid: forestMid, back: forestBack, ground: forestGround, near: forestNear, trail: [{ at: 0, style: 'dirt' }], air: ['shafts', 'leaves'] },
  }),
  wetland: film('wetland', {
    ink: ['#f0fcff', '#2a78c0', '#0a2a50'],
    land: {
      far: ['#88b4c8', '#a0c8d8'], trees: ['#70c068', '#50a058', '#368048', '#226038'],
      lake: ['#c8f0ff', '#90d4f4', '#68bcec', '#4ca4e0', '#3a8cd0'], ripple: ['#e8fcff', '#3070b8'],
      lily: ['#78d058', '#3e9038', '#f8a8d0', '#fff4fa', '#e870a8'], reed: ['#d0e078', '#90b048', '#5a7a30', '#8a5a30'],
      wood: ['#e8b878', '#c89458', '#8a5e30', '#4a2e14'],
      ground: ['#a0d870', '#90cc62', '#80c056', '#70b44a', '#62a840', '#549c38'], blade: ['#c8f090', '#80c050', '#3e8830'],
      tall: ['#6cc048', '#46963a', '#123e18'], fore: ['#80cc58', '#58a840', '#367a30', '#164418'],
      flowers: ['#ffffff', '#f8d848', '#a8c8f8'], trail: ['#ece0b4', '#d8c896', '#b8a874', '#7aa848'],
      ...ZONE,
    },
    glow: { aura: ['#fff4fa', '#f8c0e0', '#f8a8d0'], glint: ['#ffffff', '#e8fcff'], firefly: ['#f8f8a0', '#c8e858'] },
    stages: nearer([null, { lake: 1.5 }, { lake: 2 }, { lake: 2.6 }]),
    beats: { DESCEND: [0, 3200], PAN: [0, 7200], POPS: [2800, 3800, 4800], TITLE_AT: 5200, END: 9000 },
    art: { move: 'glide', far: wetlandFar, mid: wetlandMid, back: wetlandBack, ground: plainGround, shore: 0.09, trail: [{ at: 0, style: 'dirt' }, { at: 1, style: 'planks', key: 'wood' }], birds: '#f8f8f8', air: ['glints', 'butterflies'] },
  }),
  marsh: film('marsh', {
    ink: ['#eef4e0', '#4e6a3a', '#1a2614'], skies: SKY_MARSH,
    land: {
      far: ['#7a8a7c', '#6a7a6c'], crown: ['#6a8a50', '#527440', '#3e5c34', '#2a4226'], bark: ['#5a4836', '#3a2e22'],
      dead: ['#8a7c68', '#625646', '#3e342a'], snag: ['#9a8a74', '#6e604e', '#463c30', '#2a241c'],
      bog: ['#9aa898', '#4a5a4a', '#3a4a3e', '#283430'], algae: ['#9ab848', '#6a8a34'], hill: ['#6e8448', '#5a7040', '#4a5e36'],
      ground: ['#6e8448', '#627842', '#566c3c', '#4a6036', '#3e5430', '#32482a'], blade: ['#98b068', '#5e7c40', '#34502a'],
      tall: ['#6a9048', '#4a7036', '#162c14'], fore: ['#7a9a50', '#587a3c', '#3a5a2c', '#1a2c14'],
      reed: ['#b8b860', '#7e8a3c', '#4e5a28', '#6a4028'], mist: ['#e0e8e0'],
      flowers: ['#f8f0f8', '#f8e070'], trail: ['#a8987a', '#8a7a5e', '#6a5a44', '#2e261c'],
      ...ZONE,
    },
    glow: { aura: ['#e8fff0', '#b8f0d0', '#88d8b0'], wisp: ['#e8fff0', '#a8f0c8'], firefly: ['#e8f8a0', '#a8d858'] },
    stages: nearer([null, { mist: 1.2 }, { mist: 1.45 }, { mist: 1.7 }]),
    beats: { CLEAR: [300, 4800], PAN: [0, 8000], PUSH: [0, 8600], POPS: [3400, 4300, 5200], TITLE_AT: 5600, END: 9400 },
    art: { move: 'mist', far: marshFar, mid: marshMid, back: marshBack, ground: marshGround, trail: [{ at: 0, style: 'planks', key: 'trail' }], air: ['mist', 'wisps'] },
  }),
  peak: film('peak', {
    ink: ['#ffffff', '#4a70b8', '#16244a'],
    land: {
      range: ['#b0c4e0', '#98aed0', '#8098c0'], snow: ['#ffffff', '#e4eef8', '#bccfe6'],
      cliff: ['#a8a8b4', '#86868e', '#62626c', '#3e3e46'], pines: ['#4a8462', '#2c5c46'], bark: ['#5a4030', '#38281c'],
      hill: ['#a0bc84', '#88a870', '#6e9060'],
      ground: ['#b0c890', '#a0bc84', '#90b078', '#80a46c', '#729862', '#648c58'], blade: ['#d0e4b0', '#90ac78', '#566e48'],
      snowField: ['#ffffff', '#f2f8fc', '#e4eef8', '#d6e2f2'],
      tall: ['#88b870', '#5e9054', '#1c3e24'], fore: ['#9cc884', '#6e9e5c', '#4a7646', '#24402a'],
      pole: ['#ffffff', '#f07830', '#a84818'], rock: ['#e0e0e8', '#b4b4c0', '#80808c', '#4a4a56'],
      flowers: ['#b0a0f8', '#ffffff', '#f8e048'], trail: ['#d0c4a8', '#b0a488', '#8c8068', '#6a7a50'], track: ['#ffffff', '#e4ecf6', '#b8c6dc', '#c8d8ec'],
      ...ZONE,
    },
    glow: { aura: ['#ffffff', '#fff8e0', '#f8f0c0'], flake: ['#ffffff', '#d8e4f4'], firefly: ['#f8f8a0', '#c8e858'] },
    stages: nearer([null, { snow: 0.25 }, { snow: 0.7 }, { snow: 1 }]),
    beats: { RISE: [200, 4000], POPS: [4300, 5000, 5700], TITLE_AT: 5300, END: 9200 },
    sounds: ['gust'],
    art: { move: 'crane', house: 'back', far: peakFar, mid: peakMid, back: peakBack, ground: peakGround, fence: false, trail: [{ at: 0, style: 'dirt' }, { at: 2, style: 'snow', key: 'track' }], birds: '#3a4058', air: ['snow'] },
  }),
  desert: film('desert', {
    ink: ['#fff4d0', '#c07830', '#4a2408'],
    land: {
      far: ['#dcc08a', '#ecd4a0'], farMesas: ['#d8a888', '#c8987a', '#b88a6e'], mesas: ['#e89a68', '#c87448', '#a05838', '#7a402c'],
      dunes: ['#f4dca4', '#e4c486', '#c8a46a'],
      palm: ['#80c858', '#50983c', '#2e6a2a'], palmTrunk: ['#c09060', '#8a6438', '#5a4022'],
      lake: ['#c8f0ff', '#90d4f4', '#68bcec', '#3a8cd0'], cactus: ['#90b858', '#5a8a3c', '#3a5e28'],
      bone: ['#fffcf0', '#d8d0bc', '#8a8070'], rock: ['#f0d8b0', '#e0c8a0', '#b09070', '#7a604a'],
      ground: ['#f6e0a8', '#f0d8a0', '#e8ce94', '#dec288', '#d4b67e', '#c8aa72'], blade: ['#fff0c8', '#d8bc88', '#b89a68'],
      tall: ['#d8c870', '#b0a048', '#4a4418'], fore: ['#e0cc78', '#b8a050', '#8a7834', '#4a4418'],
      weed: ['#c8a868', '#8a6c3c'], sand: ['#fff4d8', '#f0dcb0'],
      flowers: ['#f87850', '#f8d848'], trail: ['#fff0cc', '#f0dcb0', '#d8bc88', '#e0c890'],
      ...ZONE,
    },
    glow: { aura: ['#fffff0', '#e8fcff', '#c8f0ff'], glint: ['#ffffff', '#e8fcff'], firefly: ['#f8f8a0', '#c8e858'] },
    stages: nearer(),
    beats: { PAN: [0, 5200], PULL: [0, 5600], POPS: [3000, 3900, 4800], TITLE_AT: 5200, END: 9000 },
    sounds: ['gust'],
    art: { move: 'sweep', house: 'back', far: desertFar, mid: desertMid, back: desertBack, ground: desertGround, trail: [{ at: 0, style: 'sand' }], birds: '#3a2a28', air: ['sand', 'tumbleweed', 'shimmer'] },
  }),
};

/* ---------------- brushes ---------------- */

const wave = (rand, amp, freq) => {
  const a = rand() * 6, b = rand() * 6;
  return (x) => amp * (0.6 * Math.sin(x * freq + a) + 0.4 * Math.sin(x * freq * 2.3 + b));
};

/** Everything under a ridge line `top(x)`, down to the canvas's bottom, lit along its top. */
function fillRidge(g, w, h, top, body, lit) {
  for (let x = 0; x < w; x++) {
    const y = Math.round(top(x));
    g.fillStyle = body; g.fillRect(x, y, 1, h - y);
    if (lit) { g.fillStyle = lit; g.fillRect(x, y, 1, 1); }
  }
}

function ellipse(g, cx, cy, rx, ry, colour) {
  ry = Math.max(1, ry);
  g.fillStyle = colour;
  for (let y = -Math.round(ry); y <= Math.round(ry); y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)));
    g.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1);
  }
}

function line(g, x0, y0, x1, y1, colour, w = 1) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  g.fillStyle = colour;
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n - (w >> 1)), Math.round(y0 + (y1 - y0) * i / n), w, 1);
}

const hazed = (list, to, t) => list.map(c => mix(c, to, t));

/** The ground: dithered bands from the back to your feet, blades of grass bigger nearer. */
function paintGround(g, w, h, H, top, cols, [lit, body, dark], rand) {
  const n = cols.length - 1;
  for (let y = top; y < h; y++) {
    const t = Math.min(1, (y - top) / (H - top)) * n, i = Math.min(n - 1, Math.floor(t));
    for (let x = 0; x < w; x++) { g.fillStyle = dither(x, y, t - i) ? cols[i + 1] : cols[i]; g.fillRect(x, y, 1, 1); }
  }
  for (let k = 0; k < w * (h - top) / 34; k++) {
    const y = top + Math.floor(rand() ** 0.7 * (h - top)), x = Math.floor(rand() * w), near = Math.min(1, (y - top) / (H - top));
    g.fillStyle = rand() < 0.3 ? lit : near < 0.4 ? body : dark;
    if (near < 0.3) { g.fillRect(x, y, 1, 1); continue; }
    const tall = near > 0.65 ? 3 : 2;
    g.fillRect(x, y - tall + 1, 1, tall);
    g.fillRect(x - 1, y - 1, 1, 1); g.fillRect(x + 1, y - 1, 1, 1);
  }
}

/** The road: from the goal's foot to your feet, widening as it nears, each surface its own way, posts along it. */
function paintTrail(g, H, top, vx, style, [lit, body, edge, verge], rand, marks) {
  const bend = rand() * 6;
  for (let y = top; y < H; y++) {
    const t = (y - top) / (H - top), cx = vx + Math.sin(t * 4 + bend) * t * 3, half = 0.5 + t * t * H * 0.15 + t * 2;
    const x0 = Math.round(cx - half), wd = Math.round(half * 2);
    g.fillStyle = style === 'planks' ? edge : verge; g.fillRect(x0 - 1, y, wd + 2, 1);
    if (style === 'planks') {   // boards across, a seam every few rows, more rows a board nearer
      const every = Math.max(2, Math.round(1.5 + t * 5));
      g.fillStyle = (y - top) % every === 0 ? edge : (y - top) % every === 1 ? lit : body;
      g.fillRect(x0, y, wd, 1);
      continue;
    }
    g.fillStyle = body; g.fillRect(x0, y, wd, 1);
    if (style === 'snow') {   // two ruts trodden in it
      g.fillStyle = edge;
      g.fillRect(Math.round(cx - half * 0.45), y, Math.max(1, Math.round(t * 2)), 1);
      g.fillRect(Math.round(cx + half * 0.35), y, Math.max(1, Math.round(t * 2)), 1);
    } else if (style === 'sand' ? (y - top) % 3 === 0 && rand() < 0.6 : rand() < 0.4) {
      g.fillStyle = lit; g.fillRect(Math.round(x0 + rand() * wd), y, style === 'sand' ? 2 + Math.round(t * 3) : 1, 1);
    }
  }
  // posts along both sides (rope posts, railings, stakes, the Peak's orange-tipped snow poles)
  for (const t of [0.12, 0.24, 0.4, 0.62, 0.9]) {
    const y = Math.round(top + t * (H - top)), cx = vx + Math.sin(t * 4 + bend) * t * 3, half = 0.5 + t * t * H * 0.15 + t * 2;
    const ph = Math.max(2, Math.round(1 + t * H * 0.07)), pw = Math.max(1, Math.round(t * 2.5));
    for (const side of [-1, 1]) {
      const x = Math.round(cx + side * (half + 1 + t * 4)) - (side < 0 ? pw : 0);
      g.fillStyle = marks[1]; g.fillRect(x, y - ph, pw, ph);
      g.fillStyle = marks[0]; g.fillRect(x, y - ph, pw, Math.max(1, Math.round(ph * 0.3)));
    }
  }
}

/** The Zone's ranch fence along the back of the land, gaps in the wilder areas. */
function paintFence(g, w, foot, H, [lit, body, dark], rand, gaps = 0, skip = () => false) {
  const ph = Math.max(3, Math.round(H * 0.03)), every = Math.max(5, Math.round(H * 0.045));
  for (let x = 0; x < w; x += every) {
    if (skip(x) || skip(x + every)) continue;
    g.fillStyle = dark; g.fillRect(x, foot - ph, 1, ph + 1);
    g.fillStyle = lit; g.fillRect(x, foot - ph, 1, 1);
    if (rand() < gaps) continue;
    for (const r of [ph - 1, Math.round(ph * 0.45)]) {
      g.fillStyle = lit; g.fillRect(x + 1, foot - r, every - 1, 1);
      g.fillStyle = body; g.fillRect(x + 1, foot - r + 1, every - 1, 1);
    }
  }
}

/** The Zone's green signboard by the entrance, its lettering a few cream strokes. */
function signboard(g, x, foot, s, { board, ink, post }) {
  const bw = Math.round(s * 2.6), bh = Math.round(s * 1.3), top = foot - Math.round(s * 2.3);
  for (const px of [x + Math.round(bw * 0.2), x + Math.round(bw * 0.8)]) {
    g.fillStyle = post[1]; g.fillRect(px, top, Math.max(1, Math.round(s * 0.18)), foot - top);
    g.fillStyle = post[0]; g.fillRect(px, top, 1, foot - top);
  }
  g.fillStyle = board[2]; g.fillRect(x - 1, top - 1, bw + 2, bh + 2);
  g.fillStyle = board[1]; g.fillRect(x, top, bw, bh);
  g.fillStyle = board[0]; g.fillRect(x, top, bw, 1);
  g.fillStyle = ink[0];
  const rows = Math.max(1, Math.round(bh / 4));
  for (let r = 0; r < rows; r++) {
    const y = top + 2 + Math.round(r * (bh - 3) / rows);
    for (let k = 2; k < bw - 2; k += 3) if ((k + r * 2) % 7 !== 0) g.fillRect(x + k, y, 2, 1);
  }
}

/** The Zone's rest house: cream walls, a door and a window, a green roof. */
function restHouse(g, cx, foot, s, { roof, wall, post }) {
  const half = Math.round(s), wh = Math.round(s * 0.9), rh = Math.round(s * 0.7);
  for (let y = 0; y < wh; y++) { g.fillStyle = y === 0 ? wall[2] : wall[0]; g.fillRect(cx - half, foot - wh + y, half * 2, 1); g.fillStyle = wall[1]; g.fillRect(cx + half - 2, foot - wh + y, 2, 1); }
  g.fillStyle = post[1]; g.fillRect(cx - Math.round(s * 0.5), foot - Math.round(wh * 0.7), Math.max(1, Math.round(s * 0.3)), Math.round(wh * 0.7));
  g.fillStyle = '#7ab8e0'; g.fillRect(cx + Math.round(s * 0.2), foot - Math.round(wh * 0.75), Math.max(1, Math.round(s * 0.35)), Math.max(1, Math.round(s * 0.25)));
  for (let k = 0; k < rh; k++) {
    const w = Math.round(half * 1.2 - k * half * 0.9 / rh);
    g.fillStyle = k === 0 ? roof[2] : k % 2 ? roof[1] : roof[0];
    g.fillRect(cx - w, foot - wh - k, w * 2, 1);
  }
}

/** A flat-topped acacia: a thin leaning trunk forking into the umbrella crown of the savanna. Returns its crown. */
function acacia(g, cx, foot, h, [lit, body, shade, dark], [bl, bd], rand, spread = 1) {
  const top = foot - h, cw = h * 0.72 * spread, tw = Math.max(1, Math.round(h * 0.06)), fork = foot - h * 0.5, cy = top + h * 0.18;
  for (let y = foot; y > fork; y--) {
    const x = Math.round(cx + (foot - y) * 0.06);
    g.fillStyle = bd; g.fillRect(x, y, tw, 1);
    g.fillStyle = bl; g.fillRect(x, y, 1, 1);
  }
  const fx = cx + (foot - fork) * 0.06;
  for (const [dx, wd] of [[-0.6, 1], [-0.15, 1], [0.5, 1]]) line(g, fx, fork, cx + dx * cw, cy + 1, bd, Math.max(1, Math.round(tw * 0.6 * wd)));
  const puffs = [];
  for (let n = 0; n < 9; n++) { const u = n / 8; puffs.push([cx - cw + u * cw * 2 + (rand() - 0.5) * cw * 0.15, cy - Math.sin(Math.PI * u) * h * 0.05, cw * (0.2 + rand() * 0.1), h * (0.07 + rand() * 0.03)]); }
  for (const [x, y, rx, ry] of puffs) ellipse(g, x, y + 1, rx, ry, dark);
  for (const [x, y, rx, ry] of puffs) ellipse(g, x, y, rx, ry, shade);
  for (const [x, y, rx, ry] of puffs) ellipse(g, x - rx * 0.1, y - ry * 0.35, rx * 0.85, ry * 0.65, body);
  for (const [x, y, rx, ry] of puffs) ellipse(g, x - rx * 0.25, y - ry * 0.7, rx * 0.5, ry * 0.3, lit);
  return { x: cx, y: cy, w: cw, h: h * 0.15 };
}

/** A pine: tiers of boughs narrowing to a point, lit on the left, snow on each tier's top if `snow`. */
function pine(g, cx, foot, h, [lit, body], [, bd], snow) {
  const top = foot - h, stem = Math.round(h * 0.12);
  g.fillStyle = bd; g.fillRect(cx, foot - stem, 1, stem + 1);
  for (let y = top; y < foot - stem; y++) {
    const f = (y - top) / (h - stem), tier = (f * 3.5) % 1, w = Math.round(h * 0.3 * f * (0.55 + 0.45 * tier));
    g.fillStyle = body; g.fillRect(cx - w, y, w * 2 + 1, 1);
    g.fillStyle = snow && tier < 0.2 ? snow : lit; g.fillRect(cx - w, y, Math.max(1, snow && tier < 0.2 ? w * 2 + 1 : Math.round(w * 0.7)), 1);
  }
}

/** A palm: a curving ringed trunk and drooping fronds. Returns its crown. */
function palm(g, cx, foot, h, lean, [fl, fb, fd], [tl, tb, td]) {
  const tx = cx + lean * h * 0.35, ty = foot - h, tw = Math.max(1, Math.round(h * 0.05));
  for (let k = 0; k <= h; k++) {
    const t = k / h, x = Math.round(cx + lean * h * 0.35 * t * t), y = foot - k;
    g.fillStyle = k % 3 === 0 ? td : tb; g.fillRect(x, y, tw, 1);
    g.fillStyle = tl; g.fillRect(x, y, 1, 1);
  }
  for (let f = 0; f < 7; f++) {
    const a = (f / 6) * Math.PI, len = h * (0.42 + (f % 2) * 0.08), dir = Math.cos(a);
    for (let s = 0; s <= len; s++) {
      const u = s / len, x = tx + dir * s, y = ty - Math.sin(a) * len * 0.35 * u + u * u * len * 0.55;
      g.fillStyle = u < 0.5 ? fb : fd; g.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (s % 2 === 0 && u > 0.15) { g.fillStyle = u < 0.6 ? fl : fb; g.fillRect(Math.round(x), Math.round(y) + 1, 1, Math.max(1, Math.round(len * 0.08 * (1 - u)))); }
    }
  }
  g.fillStyle = td; g.fillRect(Math.round(tx) - 1, ty - 1, 3, 2);
  return { x: tx, y: ty, w: h * 0.4, h: h * 0.2 };
}

/** A saguaro: a ribbed column with an arm either side. */
function cactus(g, cx, foot, h, [lit, body, dark]) {
  const w = Math.max(2, Math.round(h * 0.16));
  const column = (x, y0, y1, ww) => {
    for (let y = y0; y <= y1; y++) {
      const round = y - y0 < ww * 0.5 ? 1 : 0;
      g.fillStyle = body; g.fillRect(x + round, y, ww - round * 2, 1);
      g.fillStyle = lit; g.fillRect(x + round, y, 1, 1);
      g.fillStyle = dark; g.fillRect(x + ww - 1 - round, y, 1, 1);
    }
  };
  column(cx - (w >> 1), foot - h, foot, w);
  const aw = Math.max(1, w - 1);
  const ay = foot - Math.round(h * 0.45), by = foot - Math.round(h * 0.6);
  g.fillStyle = body; g.fillRect(cx - (w >> 1) - aw * 2, ay, aw * 2, aw);
  column(cx - (w >> 1) - aw * 2, ay - Math.round(h * 0.25), ay + aw - 1, aw);
  g.fillStyle = body; g.fillRect(cx + (w >> 1), by, aw * 2, aw);
  column(cx + (w >> 1) + aw, by - Math.round(h * 0.2), by + aw - 1, aw);
}

/** A weeping willow: a dome of leaves pouring down in a curtain of strands. */
function willow(g, cx, foot, h, [lit, body, shade, dark], [, bd], rand) {
  const r = h * 0.35, cy = foot - h + r;
  g.fillStyle = bd; g.fillRect(cx - 1, cy, Math.max(2, Math.round(h * 0.07)), foot - cy);
  disc(g, cx, cy + 1, r, dark); disc(g, cx, cy, r - 1, shade); disc(g, cx - r * 0.25, cy - r * 0.3, r * 0.55, body);
  for (let x = -Math.round(r * 1.1); x <= Math.round(r * 1.1); x++) {
    const len = Math.round((foot - cy) * (0.55 + rand() * 0.4) * Math.sqrt(1 - (x / (r * 1.15)) ** 2));
    g.fillStyle = x % 2 ? shade : body; g.fillRect(cx + x, cy, 1, len);
    if (rand() < 0.3) { g.fillStyle = lit; g.fillRect(cx + x, cy + Math.floor(rand() * len), 1, 1); }
  }
}

/** The Great Snag: a vast dead tree, its trunk flaring into roots, gnarled limbs clawing up. Returns its crown. */
function snag(g, cx, foot, h, [lit, body, shade, dark], rand) {
  const tw = Math.max(2, Math.round(h * 0.09)), split = foot - h * 0.55;
  for (let y = foot; y > split; y--) {
    const t = (foot - y) / (foot - split), half = Math.round(tw * (1 + (1 - t) ** 3 * 1.6));
    g.fillStyle = body; g.fillRect(cx - half, y, half * 2 + 1, 1);
    g.fillStyle = lit; g.fillRect(cx - half, y, Math.max(1, Math.round(half * 0.4)), 1);
    g.fillStyle = shade; g.fillRect(cx + Math.round(half * 0.5), y, Math.max(1, half - Math.round(half * 0.5)), 1);
    if ((y * 5) % 7 < 1) { g.fillStyle = dark; g.fillRect(cx - Math.round(half * 0.2), y, 1, 2); }
  }
  g.fillStyle = dark; g.fillRect(cx - 1, Math.round(foot - h * 0.3), Math.max(2, Math.round(tw * 0.6)), Math.max(2, Math.round(tw * 0.9)));   // its hollow
  const limb = (x, y, len, ang, w) => {
    for (let k = 0; k < len; k++) {
      ang += (rand() - 0.5) * 0.35;
      x += Math.cos(ang); y -= Math.sin(ang);
      g.fillStyle = body; g.fillRect(Math.round(x), Math.round(y), w, 1);
      g.fillStyle = lit; g.fillRect(Math.round(x), Math.round(y), 1, 1);
      if (w > 1 && k > len * 0.3 && rand() < 0.12) limb(x, y, len * 0.5, ang + (rand() < 0.5 ? -0.7 : 0.7), w - 1);
    }
  };
  for (const [a, l] of [[2.3, 0.5], [1.75, 0.45], [1.3, 0.42], [0.85, 0.5]]) limb(cx + (a > 1.6 ? -1 : 1), split, h * l, a, Math.max(1, Math.round(tw * 0.55)));
  return { x: cx, y: split - h * 0.2, w: h * 0.4, h: h * 0.3 };
}

/** The summit: a great peak with a shoulder on one side, lit on the left, a jagged snowcap dripping down its gullies.
    `spread` widens it where it can't grow taller. Returns its top. */
function mountain(g, cx, foot, h, [cl, cb, cs, cd], [s0, s1, s2], rand, spread = 1) {
  const half = h * 1.1 * spread, jag = wave(rand, 1, 0.55), snowLine = wave(rand, h * 0.07, 0.3), split = wave(rand, 1.5, 0.4);
  const top = (x) => {
    const d = Math.abs(x - cx) / half, shoulder = x < cx ? 0.58 * Math.max(0, 1 - Math.abs(d - 0.55) / 0.3) : 0;
    return foot - h * Math.max((1 - d) ** 1.15, shoulder) + Math.abs(jag(x)) * h * 0.025 * Math.min(1, d * 4);
  };
  for (let x = Math.floor(cx - half); x <= Math.ceil(cx + half); x++) {
    const y0 = Math.round(Math.min(top(x), foot));
    for (let y = y0; y <= foot; y++) {
      const height = (foot - y) / h, lit = x < cx + split(y) - (cx - x > half * 0.4 ? 0 : (foot - y) * 0.05);
      const edge = 0.56 + snowLine(x) / h, snowy = height > edge || (height > edge - 0.08 && Math.sin(x * 1.3) > 0.3 + (edge - height) * 8);
      g.fillStyle = snowy ? (lit ? (y - y0 < 1 ? s0 : s0) : (y - y0 < 1 ? s1 : s2)) : lit ? (y - y0 < 1 ? cl : cb) : y - y0 < 1 ? cb : cs;
      g.fillRect(x, y, 1, 1);
    }
  }
  for (let n = 0; n < 9; n++) {   // gullies in the bare rock below the snow
    let x = cx + (rand() - 0.5) * half * 1.4, y = foot - h * (0.2 + rand() * 0.3);
    if (y < top(x) + 2) continue;
    for (let k = 0; k < h * 0.18 && y < foot; k++) { g.fillStyle = x < cx ? cs : cd; g.fillRect(Math.round(x), Math.round(y), 1, 1); y += 1; x += (x < cx ? -0.4 : 0.4) + (rand() - 0.5) * 0.5; }
  }
  return { x: cx, y: foot - h * 0.9, w: h * 0.25, h: h * 0.15 };
}

/** A mesa: a flat-topped butte of banded rock. */
function mesa(g, x0, foot, w, h, [lit, body, shade, dark]) {
  for (let y = 0; y < h; y++) {
    const inset = Math.round((1 - y / h) * w * 0.15), x = x0 + inset, ww = w - inset * 2;
    g.fillStyle = y === 0 ? lit : Math.floor(y / 3) % 2 ? body : shade; g.fillRect(x, foot - h + y, ww, 1);
    g.fillStyle = lit; g.fillRect(x, foot - h + y, 1, 1);
    g.fillStyle = dark; g.fillRect(x + ww - 1, foot - h + y, 1, 1);
  }
}

/* ---------------- each area's layers ---------------- */
// every painter gets (g, p): p = { w, h, W, H, hz, gTop, gx (the goal's x in this layer), goal (its size), cap, haze, land, look, mini, tall, rand }

function meadowFar(g, p) { paintFar(g, p.w, p.H, p.hz, [p.land.far[0], p.land.far[1], p.land.far[1]], p.rand); }

function meadowMid(g, { w, h, H, hz, gx, goal, cap, spread, haze, land, look, rand }) {
  const size = Math.min(goal, cap), kw = size * 1.1 * spread, kh = H * 0.015 + size * 0.08, roll = wave(rand, H * 0.02, 0.05);
  const top = (x) => { const d = Math.abs(x - gx) / kw; return hz - H * 0.02 - roll(x) - (d < 1 ? kh * (0.5 + 0.5 * Math.cos(Math.PI * d)) : 0); };
  fillRidge(g, w, h, top, land.hill[1], land.hill[0]);
  g.fillStyle = land.hill[2];
  for (let x = 0; x < w; x++) for (let y = Math.round(top(x)) + 3; y < hz + 6; y++) if (dither(x, y, 0.2)) g.fillRect(x, y, 1, 1);
  for (let x = rand() * 20; x < w; x += 18 + rand() * 40) {   // far acacias dotted over the plain
    if (Math.abs(x - gx) < size * 1.2) continue;
    acacia(g, Math.round(x), Math.round(top(x)) + 1, Math.round(H * (0.03 + rand() * 0.04)), hazed(land.crown, haze, 0.4), hazed(land.bark, haze, 0.4), rand);
  }
  if (look.house) restHouse(g, Math.round(gx - size * 0.95), Math.round(top(gx - size * 0.95)) + 2, size * 0.22, land);
  return acacia(g, gx, Math.round(top(gx)) + 1, size, look.goal ? land.crown : hazed(land.crown, haze, 0.15), land.bark, rand, spread);
}

function fenceBack(g, { w, H, gTop, gx, land, rand }, gaps = 0) {
  paintFence(g, w, gTop, H, land.fence, rand, gaps, (x) => Math.abs(x - gx) < 3);
}

function meadowGround(g, { w, H, gTop, land, look, rand }) {
  for (let n = 0; n < w * (look.flowers || 1) / 5; n++) {
    const fx = rand() * w, fy = gTop + 3 + rand() * (H - gTop - 3), c = land.flowers[Math.floor(rand() * land.flowers.length)];
    g.fillStyle = c;
    for (let k = 0; k < 4; k++) g.fillRect(Math.round(fx + (rand() - 0.5) * 7), Math.round(fy + (rand() - 0.5) * 3), 1, 1);
  }
}

function forestFar(g, { w, h, hz, H, land, rand }) {
  g.fillStyle = land.far[1]; g.fillRect(0, hz - 2, w, h);
  for (let x = -4; x < w + 4; x += 2 + Math.floor(rand() * 3)) {
    const ph = Math.round(H * (0.06 + rand() * 0.07)), c = land.far[rand() < 0.5 ? 0 : 1];
    for (let k = 0; k < ph; k++) { g.fillStyle = c; const ww = Math.round(k * 0.3); g.fillRect(x - ww, hz - ph + k, ww * 2 + 1, 1); }
  }
}

function forestMid(g, { w, h, H, hz, gx, goal, land, look, rand }) {
  const r = Math.min(goal * 0.42, (hz - H * 0.16) / 1.6), oy = hz - r * 0.55, rx = Math.max(r, goal * 0.42 * 0.8);
  const inside = (x, y) => ((x - gx) / rx) ** 2 + ((y - oy) / (r * 1.15)) ** 2;
  const woods = look.shade ? land.woods.map(c => mix(c, '#06120a', look.shade)) : land.woods;
  for (let y = 0; y < h; y++) {
    const t = Math.min(1, y / hz) * 2, i = Math.min(1, Math.floor(t));
    for (let x = 0; x < w; x++) {
      const d = inside(x, y);
      if (d < 1 && y <= hz + 1) {   // the glade beyond, bright in the opening
        const k = Math.min(3, Math.floor(d * 4 + (dither(x, y, (d * 4) % 1) ? 1 : 0)));
        g.fillStyle = y > hz - r * 0.15 ? (dither(x, y, 0.5) ? land.glade[3] : land.glade[4]) : land.glade[k];
      } else g.fillStyle = y > hz ? woods[2] : dither(x, y, t - i) ? woods[i + 1] : woods[i];
      g.fillRect(x, y, 1, 1);
    }
  }
  for (let x = 0; x < w; x += 2 + Math.floor(rand() * 4)) {   // far trunks, a few black against the glade's light
    const tw = 1 + Math.floor(rand() * 2), c = mix(land.bark[2], woods[0], 0.4);
    for (let y = 0; y <= hz; y++) if (inside(x, y) > 1.15 || (rand() < 0.9 && Math.abs(x - gx) > r * 0.45 && x % 3 === 0)) { g.fillStyle = c; g.fillRect(x, y, tw, 1); }
  }
  for (let x = -6; x < w + 6; x += 4 + Math.floor(rand() * 5)) {   // the canopy overhead
    const rr = 4 + Math.floor(rand() * H * 0.05), y = Math.round(rand() * H * 0.06);
    disc(g, x, y + 1, rr, woods[2]); disc(g, x, y, rr - 1, woods[1]); disc(g, x - 1, y - 1, Math.max(1, rr - 4), woods[0]);
  }
  if (look.house) restHouse(g, Math.round(gx + r * 0.55), hz + 1, r * 0.22, land);
  return { x: gx, y: oy, w: r, h: r };
}

function forestBack(g, { w, H, hz, gTop, gx, goal, land, rand }) {
  const r = goal * 0.42;
  for (let x = rand() * 10; x < w; x += H * 0.08 + rand() * H * 0.1) {
    if (Math.abs(x - gx) < r * 1.1) continue;
    const tw = Math.round(2 + rand() * H * 0.025), x0 = Math.round(x);
    for (let y = 0; y <= gTop; y++) {
      const flare = Math.max(0, y - (gTop - 4));
      g.fillStyle = land.bark[1]; g.fillRect(x0 - flare, y, tw + flare * 2, 1);
      g.fillStyle = land.bark[0]; g.fillRect(x0 - flare, y, 1, 1);
      g.fillStyle = land.bark[2]; g.fillRect(x0 + tw - 1 + flare, y, 1, 1);
    }
    for (let k = 0; k < 5; k++) { const fx = x0 + (rand() - 0.3) * tw * 3; disc(g, fx, gTop - 1, 1 + rand() * 2, land.fern[k % 3]); }
  }
  for (let x = -6; x < w + 6; x += 5 + Math.floor(rand() * 6)) {   // the nearer leaf roof, hanging lower at the sides
    const rr = 5 + Math.floor(rand() * H * 0.05), y = Math.round(rand() * H * 0.05 - 2);
    disc(g, x, y + 1, rr, land.crown[3]); disc(g, x, y, rr - 1, land.crown[2]); disc(g, x - 1, y - 2, Math.max(1, rr - 3), land.crown[1]);
  }
  paintFence(g, w, gTop, H, ZONE.fence.map(c => mix(c, land.bark[2], 0.35)), rand, 0.35, (x) => Math.abs(x - gx) < 3);
}

function forestGround(g, { w, H, gTop, land, rand }) {
  for (let n = 0; n < w / 9; n++) {
    const x = rand() * w, y = gTop + 3 + rand() ** 1.4 * (H - gTop - 3), s = 1 + (y - gTop) / (H - gTop) * 4;
    if (rand() < 0.75) for (let k = 0; k < 5; k++) line(g, x, y, x + (k - 2) * s * 0.7, y - s * (1 - Math.abs(k - 2) * 0.2), land.fern[k % 3]);
    else { disc(g, x, y - s * 0.6, Math.max(1, s * 0.5), land.cap[0]); g.fillStyle = land.cap[1]; g.fillRect(Math.round(x), Math.round(y - s * 0.8), 1, 1); g.fillStyle = land.cap[1]; g.fillRect(Math.round(x), Math.round(y - s * 0.2), 1, Math.max(1, Math.round(s * 0.3))); }
  }
}

/** The great trunks either side you push in between (the Forest's film), and the leaves overhead. */
function forestNear(g, { W, H, land, rand }) {
  const dark = (c, t) => mix(c, '#06100a', t);
  for (const side of [0, 1]) {
    const tw = Math.round(W * (0.13 + rand() * 0.04)), x0 = side ? W - tw : 0;
    for (let y = 0; y < H; y++) {
      const flare = y > H * 0.82 ? Math.round(((y - H * 0.82) / (H * 0.18)) ** 2 * tw * 0.7) : 0;
      const x = side ? x0 - flare : x0, wide = tw + flare;
      g.fillStyle = dark(land.bark[1], 0.45); g.fillRect(x, y, wide, 1);
      g.fillStyle = dark(land.bark[0], 0.3); g.fillRect(side ? x : x + wide - 2, y, 2, 1);
      if ((y * 5) % 9 < 2) { g.fillStyle = dark(land.bark[2], 0.5); g.fillRect(x + Math.round(wide * 0.4), y, 1, 2); }
    }
  }
  for (let x = -4; x < W + 4; x += 3 + Math.floor(rand() * 4)) {
    const rr = 5 + Math.floor(rand() * H * 0.04), y = Math.round(rand() * H * 0.04) - 2;
    disc(g, x, y + 1, rr, dark(land.crown[3], 0.4)); disc(g, x, y, rr - 1, dark(land.crown[2], 0.3));
  }
}

function wetlandFar(g, { w, H, hz, land, haze, rand }) {
  paintFar(g, w, H, hz - 1, [land.far[0], land.far[1], land.far[1]], rand);
  const trees = hazed(land.trees, haze, 0.35);
  for (let x = -3; x < w + 3; x += 2 + Math.floor(rand() * 3)) {   // woods along the far shore
    const r = 1 + Math.floor(rand() * 3), y = hz - r;
    disc(g, x, y + 1, r, trees[3]); disc(g, x, y, Math.max(1, r - 1), trees[1]);
  }
}

function wetlandMid(g, { w, h, H, hz, gTop, gx, goal, land, rand, look }) {
  for (let y = hz; y < h; y++) {
    const t = Math.min(1, (y - hz) / Math.max(1, gTop - hz)) * 3, i = Math.min(2, Math.floor(t));
    for (let x = 0; x < w; x++) { g.fillStyle = dither(x, y, t - i) ? land.lake[i + 2] : land.lake[i + 1]; g.fillRect(x, y, 1, 1); }
  }
  g.fillStyle = mix(land.trees[3], land.lake[2], 0.5); g.fillRect(0, hz, w, 1);   // the far shore's reflection
  for (let n = 0; n < w * (gTop - hz) / 25; n++) {
    const y = hz + 1 + Math.floor(rand() * (gTop - hz)), x = Math.floor(rand() * w), len = 1 + Math.round((y - hz) / Math.max(1, gTop - hz) * 4);
    g.fillStyle = rand() < 0.6 ? land.ripple[0] : land.lake[4]; g.fillRect(x, y, len, 1);
  }
  // the pier, out from the near shore on its stilts
  const px = gx - Math.round(w * 0.12 + goal * 0.6), reach = Math.round((gTop - hz) * 0.55);
  for (let k = 0; k < reach; k++) {
    const y = gTop - k, half = Math.max(1, Math.round(3 - k * 2 / reach + (gTop - hz) * 0.02));
    g.fillStyle = k % 2 ? land.wood[1] : land.wood[0]; g.fillRect(px - half, y, half * 2, 1);
    if (k % 4 === 0) { g.fillStyle = land.wood[3]; g.fillRect(px - half, y + 1, 1, 2); g.fillRect(px + half - 1, y + 1, 1, 2); }
  }
  // Lily Lake's bloom: pads all round a great pink flower on the water
  const s = Math.max(4, goal * 0.4), cy = Math.round(hz + (gTop - hz) * 0.42);
  for (let n = 0; n < 9; n++) {
    const a = rand() * Math.PI * 2, d = s * (0.5 + rand() * 0.9), x = gx + Math.cos(a) * d * 1.4, y = cy + Math.sin(a) * d * 0.3, rx = s * (0.18 + rand() * 0.14);
    ellipse(g, x, y + 1, rx, rx * 0.3, land.lily[1]); ellipse(g, x, y, rx, rx * 0.28, land.lily[0]);
    g.fillStyle = land.lake[2]; g.fillRect(Math.round(x), Math.round(y - rx * 0.28), 1, Math.max(1, Math.round(rx * 0.28)));
    if (rand() < 0.4) disc(g, x - rx * 0.2, y - 1, Math.max(1, rx * 0.2), land.lily[2]);
  }
  ellipse(g, gx, cy + 1, s * 0.5, s * 0.14, land.lily[1]);
  for (let tier = 0; tier < 3; tier++) {
    const pr = s * (0.32 - tier * 0.08), py = cy - s * (0.08 + tier * 0.1);
    for (let k = -2; k <= 2; k++) {
      const x = gx + k * pr * 0.4, tip = py - pr * (1 - Math.abs(k) * 0.25);
      line(g, x, py, gx + k * pr * 0.55, tip, tier === 2 ? land.lily[3] : k ? land.lily[2] : land.lily[4], Math.max(1, Math.round(pr * 0.35)));
    }
  }
  if (look.house) restHouse(g, Math.round(gx + s * 2.2), gTop, s * 0.45, land);
  const glints = Array.from({ length: 14 }, () => [Math.floor(rand() * w), hz + 1 + Math.floor(rand() * (gTop - hz - 1))]);
  return { x: gx, y: cy - s * 0.2, w: s * 0.8, h: s * 0.4, glints };
}

function wetlandBack(g, { w, H, gTop, gx, land, rand }) {
  for (let x = rand() * 6; x < w; x += 3 + rand() * 10) {   // reed beds along the shore
    if (Math.abs(x - gx) < 5) continue;
    for (let k = 0; k < 4; k++) {
      const rx = Math.round(x + k * 1.5), rh = Math.round(H * (0.025 + rand() * 0.04));
      g.fillStyle = land.reed[k % 3]; g.fillRect(rx, gTop - rh, 1, rh + 1);
      if (rand() < 0.4) { g.fillStyle = land.reed[3]; g.fillRect(rx, gTop - rh, 1, 2); }
    }
  }
  paintFence(g, w, gTop + 1, H, land.fence, rand, 0.4, (x) => Math.abs(x - gx) < 3);
}

function plainGround(g, { w, H, gTop, land, rand }) {
  for (let n = 0; n < w / 9; n++) {
    const fx = rand() * w, fy = gTop + 3 + rand() * (H - gTop - 3), c = land.flowers[Math.floor(rand() * land.flowers.length)];
    g.fillStyle = c;
    for (let k = 0; k < 3; k++) g.fillRect(Math.round(fx + (rand() - 0.5) * 6), Math.round(fy + (rand() - 0.5) * 3), 1, 1);
  }
}

function marshFar(g, { w, h, H, hz, land, rand }) {
  g.fillStyle = land.far[1]; g.fillRect(0, hz - 1, w, h);
  for (let x = -5; x < w + 5; x += 3 + Math.floor(rand() * 4)) {
    const r = 2 + Math.floor(rand() * H * 0.03);
    disc(g, x, hz - r * 0.5, r, land.far[1]); disc(g, x - 1, hz - r * 0.5 - 1, Math.max(1, r - 2), land.far[0]);
  }
}

function marshMid(g, { w, h, H, hz, gx, goal, cap, land, look, rand }) {
  const mist = land.mist[0], far = 0.45 / (look.mist || 1), roll = wave(rand, H * 0.008, 0.08);
  fillRidge(g, w, h, (x) => hz - H * 0.01 - roll(x), mix(land.hill[1], mist, far * 0.6), mix(land.hill[0], mist, far * 0.6));
  for (let x = rand() * 15; x < w; x += 14 + rand() * 30) {   // willows and dead trees in the mist
    if (Math.abs(x - gx) < goal * 0.6) continue;
    const th = Math.round(H * (0.05 + rand() * 0.06));
    if (rand() < 0.55) willow(g, Math.round(x), hz, th, hazed(land.crown, mist, far), hazed(land.bark, mist, far), rand);
    else g.drawImage(deadTreeImage(th, hazed(land.dead, mist, far), rand), Math.round(x - th * 0.45), hz - th);
  }
  for (let n = 0; n < w / 30; n++) {   // murky pools
    const x = rand() * w, y = hz + 2 + rand() * H * 0.03, rx = 3 + rand() * 8;
    ellipse(g, x, y, rx, rx * 0.2, mix(land.bog[2], mist, far)); g.fillStyle = mix(land.bog[0], mist, far); g.fillRect(Math.round(x - rx * 0.4), Math.round(y - rx * 0.1), Math.round(rx * 0.6), 1);
  }
  const size = Math.min(goal * 1.15, cap);
  if (look.house) restHouse(g, Math.round(gx - size * 0.6), hz + 1, size * 0.13, land);
  return snag(g, gx, hz + 1, size, hazed(land.snag, mist, far * 0.7), rand);
}

function marshBack(g, { w, H, gTop, gx, land, rand }) {
  for (let x = rand() * 8; x < w; x += 6 + rand() * 14) {
    if (Math.abs(x - gx) < 6) continue;
    if (rand() < 0.3) { g.drawImage(rockImage(4 + Math.floor(rand() * 4), [land.dead[0], land.dead[1], land.dead[2], land.bark[1]], rand, 3), Math.round(x), gTop - 3); continue; }
    for (let k = 0; k < 5; k++) {   // cattails
      const rx = Math.round(x + k * 1.3), rh = Math.round(H * (0.03 + rand() * 0.04));
      g.fillStyle = land.reed[k % 3]; g.fillRect(rx, gTop - rh, 1, rh + 1);
      if (k % 2 === 0) { g.fillStyle = land.reed[3]; g.fillRect(rx, gTop - rh, 1, 3); }
    }
  }
  paintFence(g, w, gTop, H, land.fence.map(c => mix(c, land.bog[3], 0.3)), rand, 0.55, (x) => Math.abs(x - gx) < 3);
}

function marshGround(g, { w, H, gTop, land, rand }) {
  for (let n = 0; n < w / 22; n++) {
    const y = gTop + 4 + rand() * (H - gTop - 8), t = (y - gTop) / (H - gTop), x = rand() * w, rx = 3 + t * 16 + rand() * 6;
    ellipse(g, x, y, rx + 1, rx * 0.22 + 1, land.ground[5]);
    ellipse(g, x, y, rx, rx * 0.22, land.bog[2]);
    g.fillStyle = land.bog[0]; g.fillRect(Math.round(x - rx * 0.5), Math.round(y - rx * 0.1), Math.round(rx * 0.7), 1);
    for (let k = 0; k < rx / 2; k++) { g.fillStyle = land.algae[k % 2]; g.fillRect(Math.round(x + (rand() - 0.5) * rx * 1.6), Math.round(y + (rand() - 0.5) * rx * 0.3), 1 + Math.round(t), 1); }
  }
}

function peakFar(g, { w, H, hz, land, rand }) {
  for (const [k, amp, base] of [[0, 0.16, 0.06], [1, 0.1, 0.03]]) {
    const r = wave(rand, H * amp * 0.5, 0.06 + k * 0.03), body = k ? land.range[1] : land.range[0];
    for (let x = 0; x < w; x++) {
      const top = Math.round(hz - H * base - H * amp * 0.5 - r(x));
      g.fillStyle = body; g.fillRect(x, top, 1, hz - top + 4);
      g.fillStyle = k ? land.snow[2] : land.snow[1]; g.fillRect(x, top, 1, Math.max(1, Math.round((hz - H * base - top) * 0.35)));
    }
  }
}

function peakMid(g, { w, h, H, hz, gx, goal, land, look, rand }) {
  const size = Math.min(goal * 1.15, hz - H * 0.12);
  const crown = mountain(g, gx, hz + 1, size, land.cliff, land.snow, rand, Math.max(1, goal * 1.15 / size) ** 0.6);
  const roll = wave(rand, H * 0.015, 0.07);
  fillRidge(g, w, h, (x) => hz - H * 0.015 - roll(x), land.hill[1], land.hill[0]);
  return crown;
}

function peakBack(g, { w, H, gTop, gx, land, rand }) {
  for (let x = rand() * 4; x < w; x += 2 + rand() * 6) {
    if (Math.abs(x - gx) < 6) continue;
    pine(g, Math.round(x), gTop + 1, Math.round(H * (0.04 + rand() * 0.06)), land.pines, land.bark, land.snow[0]);
  }
}

function peakGround(g, { w, h, H, gTop, land, look, rand }) {
  const snow = look.snow || 0;
  for (let n = 0; n < w * (h - gTop) / (220 - snow * 150); n++) {   // snow lying in drifts, more further up
    const y = gTop + 2 + rand() * (h - gTop - 2), t = Math.min(1, (y - gTop) / (H - gTop)), x = rand() * w, rx = 2 + t * 14 + rand() * (4 + snow * 12);
    ellipse(g, x, y, rx, rx * 0.22, land.snowField[1 + (n % 3)]);
    g.fillStyle = land.snowField[0]; g.fillRect(Math.round(x - rx * 0.6), Math.round(y - rx * 0.2), Math.round(rx * 0.9), 1);
  }
  for (let n = 0; n < w / 25; n++) {
    const y = gTop + 4 + rand() * (H - gTop - 4), t = (y - gTop) / (H - gTop), s = Math.round(3 + t * 8);
    g.drawImage(rockImage(s, land.rock, rand), Math.round(rand() * w), Math.round(y - s * 0.7));
  }
}

function desertFar(g, { w, h, H, hz, land, rand }) {
  for (let x = rand() * 20 - 10; x < w; x += 25 + rand() * 50) mesa(g, Math.round(x), hz + 1, Math.round(10 + rand() * 22), Math.round(H * (0.04 + rand() * 0.05)), [land.farMesas[0], land.farMesas[1], land.farMesas[2], land.farMesas[2]]);
  const r = wave(rand, H * 0.01, 0.04);
  fillRidge(g, w, h, (x) => hz - H * 0.008 - r(x), land.far[0], land.far[1]);
}

function desertMid(g, { w, h, H, hz, gx, goal, cap, spread, land, look, rand }) {
  const size = Math.min(goal * 0.95, cap), pw = size * spread;
  for (let x = rand() * 30; x < w; x += 60 + rand() * 90) {   // the near mesas, red and banded
    if (Math.abs(x - gx) < size * 1.4) continue;
    mesa(g, Math.round(x), hz + 2, Math.round(H * (0.12 + rand() * 0.1)), Math.round(H * (0.06 + rand() * 0.06)), land.mesas);
  }
  const roll = wave(rand, H * 0.018, 0.05);
  const top = (x) => hz - H * 0.012 - roll(x);
  for (let x = 0; x < w; x++) {   // dunes, each crest lit on its windward side
    const y = Math.round(top(x));
    g.fillStyle = land.dunes[1]; g.fillRect(x, y, 1, h - y);
    g.fillStyle = Math.sin(x * 0.05) > 0 ? land.dunes[0] : land.dunes[2]; g.fillRect(x, y, 1, 2);
  }
  const foot = Math.round(top(gx)) + 2;
  ellipse(g, gx, foot + 1, pw * 0.75, size * 0.09, land.lake[3]);   // the oasis's pool
  ellipse(g, gx, foot, pw * 0.68, size * 0.07, land.lake[1]);
  g.fillStyle = land.lake[0]; g.fillRect(Math.round(gx - size * 0.3), foot - 1, Math.round(size * 0.25), 1);
  for (let x = -pw * 0.75; x <= pw * 0.75; x += 2) { g.fillStyle = land.palm[Math.round(x) % 4 ? 1 : 2]; g.fillRect(Math.round(gx + x), foot - Math.round(size * 0.07 * Math.sqrt(Math.max(0, 1 - (x / (pw * 0.76)) ** 2))) - 1, 1, 2); }
  let crown = null;
  for (const [dx, hh, lean] of [[-0.45, 0.72, -0.5], [0.4, 0.62, 0.6], [0.05, 1, 0.15], [-0.15, 0.55, -0.9]]) {
    const c = palm(g, Math.round(gx + dx * pw), foot, Math.round(size * hh), lean, land.palm, land.palmTrunk);
    if (hh === 1) crown = c;
  }
  return { ...crown, y: foot - size * 0.5, w: size * 0.8, h: size * 0.4 };
}

function desertBack(g, { w, H, gTop, gx, land, rand }) {
  for (let x = rand() * 10; x < w; x += 10 + rand() * 25) {
    if (Math.abs(x - gx) < 6) continue;
    if (rand() < 0.65) cactus(g, Math.round(x), gTop, Math.round(H * (0.04 + rand() * 0.06)), land.cactus);
    else g.drawImage(rockImage(4 + Math.floor(rand() * 5), land.rock, rand), Math.round(x), gTop - 4);
  }
  paintFence(g, w, gTop, H, land.fence, rand, 0.6, (x) => Math.abs(x - gx) < 3);
}

function desertGround(g, { w, H, gTop, land, rand }) {
  for (let y = gTop + 3; y < H; y += 3 + Math.round((y - gTop) / (H - gTop) * 5)) {   // wind ripples
    const ph = rand() * 6;
    for (let x = 0; x < w; x++) if (Math.sin(x * 0.18 + ph + y) > 0.55) { g.fillStyle = land.blade[0]; g.fillRect(x, y + Math.round(Math.sin(x * 0.07 + ph) * 1.5), 1, 1); }
  }
  for (let n = 0; n < w / 40; n++) {   // bleached bones
    const x = rand() * w, y = gTop + 6 + rand() * (H - gTop - 10), s = 2 + (y - gTop) / (H - gTop) * 5;
    line(g, x, y, x + s * 2, y, land.bone[1], Math.max(1, Math.round(s * 0.4)));
    disc(g, x, y, Math.max(1, s * 0.4), land.bone[0]); disc(g, x + s * 2, y, Math.max(1, s * 0.4), land.bone[0]);
  }
}

/* ---------------- the film ---------------- */

function safariScene({ film, look, stage, mini, time, land, sky, cloud, W, H, tall, rand, beats, live }) {
  const art = film.art, cam = CAMS[art.move], b = beats;
  const hz = Math.round(H * (tall ? 0.58 : 0.55));
  const gTop = hz + Math.round(H * (art.shore ?? 0.035) * (look.lake || 1));
  const PAN_PX = mini ? 0 : Math.round(W * cam.pan), BELOW = mini ? 0 : Math.ceil((cam.below || 0) * H);
  const camAt = mini ? (ms) => ({ lift: 0, pan: 0, z: 0.32 * ease(Math.min(1, ms / b.END)) }) : (ms) => cam.at(ms, b, H);
  const endPan = camAt(b.END).pan, startPan = camAt(0).pan;
  const GX = Math.round(W * (tall || mini ? 0.5 : 0.68)), VX = GX, VY = hz;
  const wide = (k) => W + Math.ceil(PAN_PX * SPEED[k]) + 8;
  const high = (k) => H + Math.ceil(BELOW * LIFT[k]);
  const haze = sky[sky.length - 1];
  const goal = Math.round(Math.min(H * (tall ? 0.3 : 0.42), W * 0.5) * (look.goal || 1));
  const cap = hz - Math.round(H * 0.07);
  const spread = Math.max(1, goal / cap) ** 0.7;   // a goal that can't grow taller grows wider as you near it

  const view = (k, c) => ({ x0: -Math.round(c.pan * PAN_PX * SPEED[k]), y0: Math.round(c.lift * LIFT[k]), s: 1 + c.z * DOLLY[k] });
  const toScreen = (k, u, v, c) => { const { x0, y0, s } = view(k, c); return [VX + (x0 + u - VX) * s, VY + (y0 + v - VY) * s, s]; };
  const toLayer = (k, X, Y, c) => { const { x0, y0, s } = view(k, c); return [(X - VX) / s + VX - x0, (Y - VY) / s + VY - y0]; };
  const put = (ctx, img, k, c) => {
    const { x0, y0, s } = view(k, c);
    if (s === 1) return ctx.drawImage(img, x0, y0);
    ctx.drawImage(img, Math.round(VX + (x0 - VX) * s), Math.round(VY + (y0 - VY) * s), Math.round(img.width * s), Math.round(img.height * s));
  };

  // ---- paint every layer once ----
  const skyC = layer(W, H);
  paintSky(skyC.getContext('2d'), W, H, hz, sky, time, rand);
  const L = {}, P = {};
  for (const k of ['far', 'mid', 'back', 'ground', 'fore']) {
    L[k] = layer(wide(k), high(k));
    P[k] = { w: L[k].width, h: L[k].height, W, H, hz, gTop, gx: GX + Math.round(endPan * PAN_PX * SPEED[k]), goal, cap, spread, haze, land, look, mini, tall, rand };
  }
  art.far(L.far.getContext('2d'), P.far);
  const crown = art.mid(L.mid.getContext('2d'), P.mid);
  art.back(L.back.getContext('2d'), P.back);
  if (look.house && art.house === 'back') restHouse(L.back.getContext('2d'), Math.round(P.back.gx - W * (tall ? 0.3 : 0.24)), gTop + 1, Math.max(4, H * 0.045), land);   // by the road, in front of the trees

  // where the Pokémon pop up: in view at their moment, nearer ones lower down
  const spots = b.POPS.map((ms, i) => {
    const depth = [0.4, 0.22, 0.68][i], c = camAt(ms + 700);
    const [u, v] = toLayer('ground', W * [0.27, 0.72, 0.44][i], gTop + (H * 0.93 - gTop) * depth, c);
    return { ms, u: Math.round(u), v: Math.round(v), size: Math.round(7 + depth * 12), scale: 0.6 + depth * 0.6 };
  });
  const gg = L.ground.getContext('2d');
  paintGround(gg, P.ground.w, P.ground.h, H, gTop, land.ground, land.blade, rand);
  art.ground?.(gg, P.ground);
  const road = [...art.trail].reverse().find(t => stage >= t.at);
  paintTrail(gg, H, gTop, P.ground.gx, road.style, land[road.key || 'trail'], rand, road.style === 'snow' ? land.pole : road.style === 'planks' ? [land.trail[2], land.trail[3]] : land.fence);
  if (!mini) {   // the Zone's signboard at the entrance, where the film starts
    const [u] = toLayer('ground', W * (tall ? 0.16 : 0.2), 0, camAt(0));
    signboard(gg, Math.round(u), Math.round(gTop + (H - gTop) * 0.22), Math.max(3, Math.round(H * 0.022)), land);
  }
  if (look.patches) for (let n = 0; n < 6; n++) { const s = 6 + Math.floor(rand() * 8); tallGrass(gg, Math.floor(rand() * P.ground.w), Math.round(gTop + 4 + rand() * (H - gTop) * 0.6), s * 2, Math.ceil(s * 0.6), land.tall); }
  for (const s of spots) tallGrass(gg, s.u - s.size - 2, s.v - 2 - Math.round(s.size * 0.4), s.size * 2 + 4, Math.ceil(s.size * 0.6) + Math.round(s.size * 0.4), land.tall);
  const tufts = spots.map(s => { const c = layer(s.size * 2 + 4, s.size + 2); tallGrass(c.getContext('2d'), 0, 0, s.size * 2 + 4, Math.ceil(s.size * 0.6), land.tall); return c; });
  const fg2 = L.fore.getContext('2d');
  paintFore(fg2, P.fore.w, H, land.fore, land.flowers, rand);
  for (let y = H; y < P.fore.h; y++) for (let x = 0; x < P.fore.w; x++) {   // a rise starts down in the grass: blades all the way down
    fg2.fillStyle = (x * 7 + Math.floor(y / 3) * 3) % 5 === 0 ? land.fore[0] : x % 3 ? land.fore[2] : land.fore[1];
    fg2.fillRect(x, y, 1, 1);
  }
  let nearC = null;
  if (art.near) { nearC = layer(W, H); art.near(nearC.getContext('2d'), { W, H, land, rand }); }

  // ---- the air ----
  const air = new Set(art.air);
  const clouds = [];
  const cloudy = art.move === 'drop' || ['meadow', 'wetland', 'peak', 'desert'].includes(art.id);
  if (cloudy) for (let n = 0; n < (art.id === 'desert' ? 3 : 6); n++) clouds.push({ img: cloudImage(Math.round(W * (0.22 + rand() * 0.3)), cloud, rand), x: rand() * W * 1.6 - W * 0.3, y: -H * 0.3 + rand() * hz * 0.9, lift: 0.5, drift: 0.6 + rand() });
  if (!mini && art.move === 'drop') for (let n = 0; n < 3; n++) clouds.push({ img: cloudImage(Math.round(W * (0.7 + rand() * 0.4)), cloud, rand), x: rand() * W - W * 0.3, y: -H * 1.25 + rand() * H * 0.5, lift: 1.7, drift: 2 });
  const motes = Array.from({ length: 40 }, () => ({ x: rand(), y: rand(), speed: 0.5 + rand(), wob: rand() * 6, c: Math.floor(rand() * 3) }));
  const wings = Array.from({ length: 3 }, (_, i) => ({ x: rand(), y: 0.2 + rand() * 0.5, phase: rand() * 6, c: i }));
  const dark = time === 'night' || time === 'dusk';
  const flies = dark || air.has('wisps') ? Array.from({ length: air.has('wisps') ? 10 : 14 }, () => ({ x: rand(), y: rand(), phase: rand() * 6 })) : [];
  const shafts = air.has('shafts') ? Array.from({ length: 4 }, (_, i) => ({ dx: (i - 1.5) * 0.45 + (rand() - 0.5) * 0.2, w: 2 + rand() * 4, phase: rand() * 6 })) : [];
  const mists = air.has('mist') ? Array.from({ length: 5 }, () => ({ img: cloudImage(Math.round(W * (0.6 + rand() * 0.5)), [land.mist[0], land.mist[0], land.mist[0]], rand), x: rand() * W * 1.4 - W * 0.4, y: hz - H * 0.1 + rand() * H * 0.35, drift: 1 + rand() * 2 })) : [];
  const glints = crown?.glints || [];
  let gusted = false;

  function draw(bg, fg, ms, tick) {
    const c = camAt(ms), lift = c.lift;
    if (!gusted && !mini && film.sounds) { gusted = true; if (live()) playSound('gust'); }
    bg.drawImage(skyC, 0, 0);
    for (const cl of clouds) {
      if (cl.lift > 1) continue;
      const x = Math.round(((cl.x - c.pan * PAN_PX * 0.05 + tick * cl.drift) % (W * 1.8) + W * 1.8) % (W * 1.8) - W * 0.4);
      bg.drawImage(cl.img, x, Math.round(cl.y + Math.max(0, lift) * cl.lift + Math.min(0, lift) * 0.5));
    }
    if (art.birds && !mini && ms < 5200) {   // a flock crossing as you arrive
      const fx = -10 + (ms / 5200) * (W + 30), fy = H * 0.3 + lift * 0.3 - ms / 400;
      bg.fillStyle = art.birds;
      for (let n = 0; n < 5; n++) {
        const bx = Math.round(fx - Math.abs(n - 2) * 4), by = Math.round(fy + Math.abs(n - 2) * 3), up = (Math.floor(ms / 140) + n) % 2;
        bg.fillRect(bx - 1, by - up, 1, 1); bg.fillRect(bx, by, 1, 1); bg.fillRect(bx + 1, by - up, 1, 1);
      }
    }
    put(bg, L.far, 'far', c);
    if (crown) {   // the goal's light, breathing slowly
      const [tx, ty, sh] = toScreen('mid', crown.x, crown.y, c), breath = 0.5 + 0.5 * Math.sin(tick * 1.6);
      for (const [k, r] of [[0.08, 1.6], [0.12, 1.2], [0.16, 0.9]]) {
        bg.globalAlpha = k * (0.7 + 0.5 * breath) * (time === 'night' ? 1.5 : 1);
        bg.fillStyle = film.glow.aura[1];
        bg.beginPath(); bg.ellipse(Math.round(tx), Math.round(ty), Math.max(2, crown.w * sh * r), Math.max(2, crown.h * sh * r * 1.4), 0, 0, Math.PI * 2); bg.fill();
      }
      bg.globalAlpha = 1;
    }
    put(bg, L.mid, 'mid', c);
    for (const [n, [gx, gy]] of glints.entries()) {   // the lake sparkling
      if (Math.sin(tick * 3 + n * 1.7) < 0.6) continue;
      const [x, y] = toScreen('mid', gx, gy, c);
      bg.fillStyle = film.glow.glint[n % 2]; bg.fillRect(Math.round(x), Math.round(y), 2, 1);
    }
    if (air.has('shimmer')) {   // the heat over the sand
      for (let y = Math.max(0, hz - Math.round(H * 0.18)); y < hz + 3; y++) {
        const off = Math.round(Math.sin(y * 0.9 + tick * 7) * 0.8);
        if (off) bg.drawImage(bg.canvas, 0, y, W, 1, off, y, W, 1);
      }
    }
    for (const s of shafts) {   // light falling out of the glade
      const [tx, ty] = toScreen('mid', crown.x, crown.y, c);
      bg.globalAlpha = 0.09 + 0.05 * Math.sin(tick * 1.3 + s.phase);
      bg.fillStyle = film.glow.aura[0];
      bg.beginPath();
      bg.moveTo(tx + s.dx * crown.w, ty - crown.h * 0.6); bg.lineTo(tx + s.dx * crown.w + s.w, ty - crown.h * 0.6);
      bg.lineTo(tx + s.dx * W * 0.9 + s.w * 3, H); bg.lineTo(tx + s.dx * W * 0.9, H);
      bg.fill();
    }
    bg.globalAlpha = 1;
    put(bg, L.back, 'back', c);
    if (mists.length) {   // mist lying over the bog
      for (const m of mists) {
        bg.globalAlpha = 0.28 * Math.min(1.6, look.mist || 1);
        bg.drawImage(m.img, Math.round(((m.x + tick * m.drift - c.pan * PAN_PX * 0.5) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.5), Math.round(m.y));
      }
      bg.globalAlpha = 1;
    }
    put(bg, L.ground, 'ground', c);

    fg.clearRect(0, 0, W, H);
    for (const [i, s] of spots.entries()) {   // the tall grass each Pokémon hides in, shaking just before it pops out
      const [x, y, sc] = toScreen('ground', s.u, s.v, c), img = tufts[i];
      const rustle = ms > s.ms - 350 && ms < s.ms + 200 ? ((Math.floor(ms / 60) % 2) ? 1 : -1) : 0;
      if (sc === 1) fg.drawImage(img, Math.round(x - s.size - 2 + rustle), Math.round(y - 2));
      else fg.drawImage(img, Math.round(x - (s.size + 2) * sc + rustle), Math.round(y - 2 * sc), Math.round(img.width * sc), Math.round(img.height * sc));
    }
    const drift = c.pan * PAN_PX * 0.3;
    if (air.has('pollen') || air.has('leaves')) for (const p of motes.slice(0, 24)) {
      const leaf = air.has('leaves');
      const x = Math.round(((p.x * W * 1.3 + tick * p.speed * (leaf ? 6 : 14) + Math.sin(tick * 2 + p.wob) * (leaf ? 6 : 2) - drift) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15);
      const y = Math.round(((p.y * H + tick * p.speed * (leaf ? 14 : 4)) % H + H) % H);
      fg.fillStyle = leaf ? film.glow.leaf[p.c] : film.glow.pollen[p.c % 2];
      fg.fillRect(x, y, leaf ? (Math.floor(tick * 4 + p.wob) % 2) + 1 : 1, 1);
    }
    if (air.has('snow')) for (const p of motes) {
      const x = Math.round(((p.x * W * 1.2 + tick * p.speed * 9 + Math.sin(tick * 1.5 + p.wob) * 3) % (W * 1.2) + W * 1.2) % (W * 1.2) - W * 0.1);
      const y = Math.round(((p.y * H + tick * p.speed * 12 + Math.max(0, -lift) * 0.4) % H + H) % H);
      fg.fillStyle = film.glow.flake[p.c % 2]; fg.fillRect(x, y, p.c ? 1 : 2, p.c ? 1 : 2);
    }
    if (air.has('sand')) {   // sand blowing low across
      fg.globalAlpha = 0.55;
      for (const p of motes) {
        const x = Math.round(((p.x * W * 1.5 + tick * p.speed * W * 0.5 - drift) % (W * 1.5) + W * 1.5) % (W * 1.5) - W * 0.25);
        fg.fillStyle = land.sand[p.c % 2]; fg.fillRect(x, Math.round(gTop + p.y * (H - gTop) + Math.sin(tick * 3 + p.wob) * 2), 2 + p.c * 2, 1);
      }
      fg.globalAlpha = 1;
    }
    if (air.has('tumbleweed') && (mini || ms > 1800)) {
      const t = (tick * 0.12 + 0.3) % 1, x = -6 + t * (W + 12), y = gTop + (H - gTop) * 0.35 - Math.abs(Math.sin(tick * 4)) * H * 0.03, r = Math.max(2, H * 0.02);
      for (let a = 0; a < 10; a++) { const ang = a * 0.63 + tick * 5; fg.fillStyle = land.weed[a % 2]; fg.fillRect(Math.round(x + Math.cos(ang) * r), Math.round(y + Math.sin(ang) * r), 1, 1); fg.fillRect(Math.round(x + Math.cos(ang * 1.7) * r * 0.5), Math.round(y + Math.sin(ang * 1.3) * r * 0.5), 1, 1); }
    }
    if (air.has('butterflies') && !dark) for (const f of wings) {
      const x = Math.round(f.x * W + Math.sin(tick * 0.7 + f.phase) * W * 0.15), y = Math.round(gTop - H * 0.02 + f.y * (H - gTop) * 0.6 + Math.sin(tick * 2.3 + f.phase) * 4);
      const open = Math.floor(tick * 8 + f.phase) % 2;
      fg.fillStyle = film.glow.wing?.[f.c] || '#ffffff';
      fg.fillRect(x - open, y, 1 + open * 2, 1);
    }
    for (const f of flies) {
      if (Math.sin(tick * 3 + f.phase) < 0.2) continue;
      fg.fillStyle = (film.glow.wisp || film.glow.firefly)[0];
      fg.fillRect(Math.round(f.x * W + Math.sin(tick + f.phase) * 4), Math.round(gTop - 8 + f.y * (H - gTop) * 0.8 + Math.sin(tick * 0.8 + f.phase) * 3), 1, 1);
    }
    put(fg, L.fore, 'fore', c);
    if (nearC) put(fg, nearC, 'near', c);
    for (const cl of clouds) {   // the big near clouds you fall through
      if (cl.lift <= 1) continue;
      const y = Math.round(cl.y + lift * cl.lift);
      if (y < -cl.img.height || y > H) continue;
      fg.drawImage(cl.img, Math.round(cl.x - c.pan * PAN_PX * 0.2 + tick * cl.drift), y);
    }
    if (art.move === 'mist' && !mini) {   // the mist parting as you come in
      fg.globalAlpha = (1 - easeOut(span(b.CLEAR, ms))) * 0.92;
      fg.fillStyle = land.mist[0]; fg.fillRect(0, 0, W, H);
      fg.globalAlpha = 1;
    }
  }

  const monAt = (i, ms) => { const [x, y] = toScreen('ground', spots[i].u, spots[i].v, camAt(ms)); return [Math.round(x), Math.round(y)]; };
  return { spots, walkX: VX, draw, monAt };
}
