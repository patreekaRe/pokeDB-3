/* ============================================================
   buildings.js  -  the Poké Mart and Pokémon Center as little pixel
   buildings standing on the map (in place of a framed room square),
   after the Gen 3 overworld: a big gridded roof, the Poké Ball emblem
   over the door, a white base with windows and a red sign.

   Each building is drawn by rules on a 24x20 grid (not a hand-typed
   pixel map), then turned into SVG with a black outline, like the
   12x12 icons in icons.js.
   ============================================================ */

const W = 24, H = 20;

const STYLES = {
  shop: {   // Poké Mart: blue roof, a blue ring emblem, "MART" in red
    a: '#a8d0f8', b: '#6898e8', c: '#4878d0', d: '#2850a0',
    e: '#3070d8', s: '#d83828', ball: false,
  },
  rest: {   // Pokémon Center: red roof, a Poké Ball emblem, "P.C" in red
    a: '#f8a898', b: '#e86858', c: '#c84838', d: '#901818',
    e: '#e03828', s: '#d83828', ball: true,
  },
};
const COMMON = { w: '#f8f8f8', l: '#c8d0e0', g: '#8890a8', o: '#5890e0', O: '#2850a0', k: '#181010' };

// the sign on the left of the wall, 5x2, in tiny pixel letters
const SIGNS = { shop: ['s.s.s', 'sssss'], rest: ['ss..s', 'ss.ss'] };

function pixel(kind, x, y) {
  const st = STYLES[kind];
  // the emblem over the door: a white plate with a ring (Mart) or a Poké Ball (Center)
  const dx = x - 11.5, dy = y - 8;
  if (Math.abs(dx) <= 4 && y >= 6 && y <= 10 && !(Math.abs(dx) === 4 && (y === 6 || y === 10))) {
    const d = Math.hypot(dx, dy);
    if (d <= 2.4) {
      if (st.ball) return y === 8 ? 'k' : y < 8 ? 'e' : 'w';
      return d >= 1.3 ? 'e' : y === 8 ? 'e' : 'w';
    }
    return Math.abs(dx) === 4 || y === 10 ? 'l' : 'w';
  }
  // the roof, with a grid of tiles, lit on its left
  if (y <= 6) {
    const lo = y === 0 ? 3 : y === 1 ? 2 : 1, hi = W - 1 - lo;
    if (x < lo || x > hi) return '.';
    if (y === 0 || x === lo) return 'a';
    if (x === hi) return 'd';
    return (x - 1) % 3 === 0 || y % 3 === 0 ? 'c' : 'b';
  }
  if (y <= 8) return y === 7 ? 'c' : 'd';   // the overhanging eave
  // the walls
  if (x < 1 || x > W - 2) return '.';
  if (y === 9 || y === H - 1) return 'g';
  if (x >= 10 && x <= 13 && y >= 12) return y === 12 ? 'O' : 'o';   // the door
  if ((x === 8 || x === 9 || x === 14 || x === 15) && y >= 11) return 'l';   // its frame
  if (y >= 10 && y <= 11 && ((x >= 3 && x <= 5) || (x >= 18 && x <= 20))) return 'o';   // windows
  const sign = SIGNS[kind];
  if (y >= 14 && y <= 15 && x >= 2 && x <= 6 && sign[y - 14][x - 2] === 's') return 's';
  return x === 1 || x === W - 2 ? 'l' : 'w';
}

const cache = {};

/** The building for a map room ('shop' | 'rest') as SVG markup. */
export function buildingSvg(kind) {
  if (cache[kind]) return cache[kind];
  const colours = { ...COMMON, ...STYLES[kind] };
  const grid = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => pixel(kind, x, y)));
  const filled = (x, y) => (grid[y]?.[x] ?? '.') !== '.';
  let rects = '';
  for (let y = -1; y <= H; y++) {
    for (let x = -1; x <= W; x++) {
      let c = grid[y]?.[x] ?? '.';
      if (c === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oy]) => filled(x + ox, y + oy))) c = 'k';
      if (c !== '.') rects += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="${colours[c]}"/>`;
    }
  }
  return (cache[kind] = `<svg viewBox="0 0 ${W + 2} ${H + 2}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`);
}
