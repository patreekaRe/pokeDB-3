/* base-furniture-figurines.js  -  the Figurines set (furniture expansion session c, 2026-10-17): a little PVC figure of
   each starter's first form and each legendary, the kind sold boxed at a Pokémon Center, small enough to stand on a
   table (js/secret-base.js's small()). The Pokémon is its own sprite in its own colours with a glossy sheen
   (js/base-figures.js's `pvc`), standing as a cut-out on a round display base: a starter's in its type's colour, a
   legendary's black with gold rims; a tiny name plate on the front. The sprites are fetched only where a figurine is
   shown (loadFigures()); until then it paints its bare base, and its `live()` changes once the figure is in. Shared
   with the models (js/base-models-figurines.js), so picture and model agree. All solo, fixed colours. */

import { R, sh, cyl, oval, floorShadow, ctx } from './base-paint.js';
import { STARTERS_BY_ID } from './data/starters.js';
import { FIGURINES, figureOf, figureAt } from './base-figures.js';

/** The bases' colours: a starter's by its type, a legendary's black and gold; the plates. */
export const FIG = {
  fire: '#e0483a', grass: '#46a84c', water: '#3a7cd8', legend: '#24222a', gold: '#e2b444',
  plate: '#f6f1e2', legendPlate: '#e8c050', ink: '#2c2830',
};

/** A figurine's base: its span x0..x1 and height h in painted pixels (32 a tile), its colour, and its name plate
    [x0, x1, y0, y1] (y up from the floor). */
export function figBase(kind) {
  const F = FIGURINES[kind], [x0, x1, h] = F.plinth, mid = (x0 + x1) / 2, pw = F.legend ? 18 : 16;
  const y0 = F.legend ? 1.6 : 1, y1 = h - (F.legend ? 2.2 : 1.6);
  return { x0, x1, h, legend: !!F.legend, colour: F.legend ? FIG.legend : FIG[STARTERS_BY_ID[F.mon].type], plate: [mid - pw / 2, mid + pw / 2, y0, y1] };
}

const nameOf = (kind) => STARTERS_BY_ID[FIGURINES[kind].mon].line[0].name;

function baseArt(x, b, kind, front) {
  const { x0, x1, h, legend, colour, plate } = figBase(kind), w = x1 - x0, cx = x + (x0 + x1) / 2;
  cyl(x + x0, b - h + 1, w, h - 1, colour);
  if (legend) {
    cyl(x + x0, b - 1.3, w, 1.3, FIG.gold);
    cyl(x + x0, b - h + 1, w, 1.3, FIG.gold);
    oval(cx, b - h + 1, w / 2, 1, FIG.gold);
    oval(cx, b - h + 1, w / 2 - 1.4, 0.6, sh(colour, 1));
  } else oval(cx, b - h + 1, w / 2, 1, sh(colour, 1));
  if (!front) return;
  const [p0, p1, py0, py1] = plate, g = ctx(), pc = legend ? FIG.legendPlate : FIG.plate;
  R(x + p0, b - py1, p1 - p0, py1 - py0, sh(pc, -1));
  R(x + p0 + 0.4, b - py1 + 0.4, p1 - p0 - 0.8, py1 - py0 - 0.8, pc);
  g.font = 'bold 3px system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = FIG.ink;
  g.fillText(nameOf(kind).toUpperCase(), cx, b - (py0 + py1) / 2 + 0.2, p1 - p0 - 1.6);
}

function figurineArt(kind) {
  return (x, b, vw, dir) => {
    floorShadow(x + 3, b, vw - 6);
    baseArt(x, b, kind, !dir);
    const f = figureOf(kind), at = figureAt(kind);
    if (!f) return;
    const g = ctx(), w = f.w * at.k, h = f.h * at.k;
    g.imageSmoothingEnabled = false;
    g.drawImage(f.c, x + at.cx - w / 2, b - at.y - h, w, h);
  };
}

export const FIGURINE_KINDS = Object.entries(FIGURINES).map(([id, F]) => ({
  id, name: `${nameOf(id)} figurine`, group: 'Figurines', solo: true, w: 1, h: 1, price: F.legend ? 900 : 450,
  live: () => (figureOf(id) ? 'figure' : ''), draw: figurineArt(id),
}));
