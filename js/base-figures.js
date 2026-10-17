/* base-figures.js  -  the backyard's Pokémon statues as their own sprites (2026-10-16, the user's ask: "like the gym
   leader statues", js/event-3d.js's stoneBoard(); the sculpted low-poly ones, and the Bulbasaur topiary most, read
   oddly). A sprite's first frame is recoloured down a ramp by its brightness (grey stone, hedge greens), the light
   kept, and cropped to what is painted; it stands on its plinth as a cut-out that faces the camera (a standee, leaned
   back by js/base-3d.js like the Pokémon). The sprites are fetched only when needed (loadFigures(): the Secret Base and
   the garden catalogue wait for it), as the gold statues' are (js/base-furniture-statues.js); until then a kind paints
   its bare plinth, and its `live()` changes once the figure is in, so its pictures are painted afresh. Shared by the
   paintings (js/base-furniture-yard5.js) and the models (js/base-models-y2.js), so the two agree.
   The Figurines set's PVC figures (js/base-furniture-figurines.js, 2026-10-17) load here too, in their own colours
   (`pvc`: the sprite kept, a touch brighter, a glossy sheen along its top-left), each loaded only where it is shown. */

const RAMPS = {
  stone: ['#55514b', '#716d65', '#8d8980', '#a8a49a', '#c0bcb0', '#d8d4c8', '#f0ece2'],
  leaf: ['#1c4418', '#285c22', '#35722c', '#448a38', '#56a046', '#6eb658', '#8ccc70'],
};

/* Each statue: its Pokémon, its ramp, and its stand in painted pixels (32 a tile, x from the painting's left): a plinth
   [x0, x1, h, depth] (a planter of soil if `bed`, a mound of earth if `mound`), and the box [w, h] the figure fits in. */
export const FIGURES = {
  articunostatue: { mon: 'articuno', ramp: 'stone', plinth: [12, 52, 14, 24], box: [62, 76] },
  zapdosstatue: { mon: 'zapdos', ramp: 'stone', plinth: [12, 52, 14, 24], box: [62, 76] },
  moltresstatue: { mon: 'moltres', ramp: 'stone', plinth: [12, 52, 14, 24], box: [62, 76] },
  lugiastatue: { mon: 'lugia', ramp: 'stone', plinth: [14, 50, 16, 52], box: [62, 104] },
  hoohstatue: { mon: 'hooh', ramp: 'stone', plinth: [14, 50, 16, 52], box: [62, 104] },
  suicunestatue: { mon: 'suicune', ramp: 'stone', plinth: [6, 58, 12, 24], box: [60, 72] },
  pikachustatue: { mon: 'pikachu', ramp: 'stone', plinth: [4, 28, 12, 24], box: [30, 46] },
  snorlaxstatue: { mon: 'snorlax', ramp: 'stone', plinth: [4, 60, 8, 24], box: [60, 64] },
  onixstatue: { mon: 'onix', ramp: 'stone', plinth: [8, 56, 10, 52], box: [62, 108] },
  bulbatopiary: { mon: 'bulbasaur', ramp: 'leaf', plinth: [4, 60, 8, 24], bed: true, box: [58, 60] },
  dugtriorocks: { mon: 'dugtrio', ramp: 'stone', plinth: [3, 29, 4, 26], mound: true, box: [30, 46] },
};

/* The figurines: each starter's first form and each legendary (never the secret one), on a round display base [x0, x1,
   h, depth] the size of a table ornament, a legendary's a little grander. Kept apart from FIGURES, which the yard's
   statue model (js/base-models-y2.js) is listed by. */
export const FIGURINE_STARTERS = ['charmander', 'bulbasaur', 'squirtle', 'cyndaquil', 'chikorita', 'totodile', 'tepig', 'snivy',
  'oshawott', 'torchic', 'treecko', 'mudkip', 'chimchar', 'turtwig', 'piplup'];
export const FIGURINE_LEGENDS = ['moltres', 'virizion', 'suicune', 'entei', 'celebi', 'kyogre', 'hooh', 'lugia', 'palkia', 'reshiram',
  'victini', 'heatran', 'manaphy', 'keldeo', 'rayquaza'];
export const FIGURINES = Object.fromEntries([
  ...FIGURINE_STARTERS.map(mon => [`fig${mon}`, { mon, ramp: 'pvc', plinth: [4, 28, 6, 24], box: [28, 32] }]),
  ...FIGURINE_LEGENDS.map(mon => [`fig${mon}`, { mon, ramp: 'pvc', legend: true, plinth: [3, 29, 7, 26], box: [32, 44] }]),
]);
const ALL = { ...FIGURES, ...FIGURINES };

const PICS = {}, loading = {};
const can = () => typeof createImageBitmap === 'function' && typeof OffscreenCanvas === 'function';
const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));

/** A PVC figure's paint: the sprite's own colours a little richer, and a sheen just inside its top-left edge. */
function glaze(d, w) {
  const h = d.length / 4 / w, on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  const shine = [];
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    const p = i >> 2, x = p % w, y = (p - x) / w, grey = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    for (let j = 0; j < 3; j++) d[i + j] = Math.max(0, Math.min(255, grey + (d[i + j] - grey) * 1.18 + 6));
    // two pixels in from an edge facing the light, past the sprite's dark outline
    if (grey > 50 && on(x - 1, y - 1) && !(on(x - 2, y - 2) && on(x, y - 2) && on(x - 2, y))) shine.push(i);
  }
  for (const i of shine) for (let j = 0; j < 3; j++) d[i + j] += (255 - d[i + j]) * 0.38;
}

/** A sprite's frame recoloured down a ramp (or glazed, `pvc`) and cropped: { c, w, h }. */
function recolour(bmp, ramp) {
  const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data, pvc = ramp === 'pvc', stops = pvc ? [] : RAMPS[ramp].map(rgb), n = stops.length - 1;
  let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) { d[i + 3] = 0; continue; }
    const p = i >> 2, x = p % c.width, y = (p - x) / c.width;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    if (pvc) { d[i + 3] = 255; continue; }
    // the sprite's own shading, stretched a little so a pale Pokémon still has its shadows
    const lum = Math.min(1, Math.max(0, ((0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255 - 0.5) * 1.3 + 0.55)) * n;
    const j = Math.min(n - 1, Math.floor(lum)), f = lum - j, a = stops[j], b = stops[j + 1];
    d[i] = a[0] + (b[0] - a[0]) * f; d[i + 1] = a[1] + (b[1] - a[1]) * f; d[i + 2] = a[2] + (b[2] - a[2]) * f; d[i + 3] = 255;
  }
  if (x1 < 0) return null;
  if (pvc) glaze(d, c.width);
  g.putImageData(im, 0, 0);
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = new OffscreenCanvas(w, h);
  out.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h);
  return { c: out, w, h };
}

/** Fetch and recolour these kinds' figures (every statue and figurine by default; any other id is passed over, so a
    caller can hand it every piece it shows). Resolves when all are in. */
export function loadFigures(kinds = Object.keys(ALL)) {
  if (!can()) return Promise.resolve();
  return Promise.all(kinds.filter(k => ALL[k]).map(k => loading[k] ||= fetch(new URL(`../assets/pokemon/${ALL[k].mon}-front.gif`, import.meta.url))
    .then(r => (r.ok ? r.blob() : null)).then(b => b && createImageBitmap(b)).then(bmp => { PICS[k] = bmp ? recolour(bmp, ALL[k].ramp) : null; })
    .catch(() => { PICS[k] = null; })));
}

/** A kind's figure, { c, w, h }, once it's in. */
export const figureOf = (kind) => PICS[kind] || null;

/** The kinds among `ids` (piece ids or kinds) whose figures aren't in yet (nor have failed, nor never can). */
export const figuresToLoad = (ids) => can() ? ids.filter(k => ALL[k] && !(k in PICS)) : [];

/** Where a kind's figure stands, in painted pixels: its scale `k`, the plinth's top `y` and the figure's middle `cx`. */
export function figureAt(kind) {
  const F = ALL[kind], f = PICS[kind], [x0, x1, h] = F.plinth;
  return f ? { k: Math.min(F.box[0] / f.w, F.box[1] / f.h), y: F.bed || F.mound ? h - 2 : h, cx: (x0 + x1) / 2 } : null;
}
