/* ============================================================
   map.js  -  the branching map of one biome.

   The map is built the way Slay the Spire builds its maps:

     1. A grid of COLS columns and FLOORS floors (floor 0 is the bottom).
     2. PATHS random paths are walked from the bottom to the top. Each
        step goes to the room straight above, or one column to the left
        or right. Paths may share rooms, but they may not cross.
        The first two paths must start in different columns, so there
        are always at least two places to start.
     3. Only rooms that a path went through exist. The rest are dropped.
     4. Each room gets a type. Some floors are fixed (fights at the
        bottom, treasure in the middle, rest sites at the top). The
        others are rolled from ROOM_ODDS, and rolls that break the rules
        below are re-rolled.
     5. Every room on the top floor connects to the biome's boss.

       boss             👑
                      /    \
       top floor     🏥    🏥      <- always rest sites
       ...
       bottom       ⚔️  ⚔️  ⚔️     <- you start here (always fights)

   generateMap() builds the data. renderMap() draws it.
   ============================================================ */

import { $, el } from './ui.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { TYPES } from './data/cards.js';

/* ---------- the knobs you can turn ---------- */
const COLS = 7;       // columns in the grid
const FLOORS = 10;    // floors per biome (Slay the Spire uses 15: a much longer run)
const PATHS = 6;      // how many random paths are walked

// Chance (in %) of each room type on floors that are not fixed.
// (Slay the Spire also has events. They aren't in this game yet,
//  so their share is added to plain fights. Add them here when they exist.)
const ROOM_ODDS = { fight: 60, elite: 16, rest: 12, shop: 12 };

// Where the special floors are, scaled to the number of floors
// (for 15 floors this gives: treasure on floor 9, no elites/rests below floor 6).
const TREASURE_FLOOR = Math.max(2, Math.round(FLOORS * 0.6) - 1);   // index, 0 = bottom
const MIN_ELITE_REST_FLOOR = Math.max(2, Math.round(FLOORS * 0.4) - 1);
const TOP_FLOOR = FLOORS - 1;                                         // always rest sites
const MIN_SHOP_FLOOR = MIN_ELITE_REST_FLOOR + 1;                      // a few fights in, so you have prize money to spend

export const NODE_INFO = {
  fight:    { icon: '⚔️', label: 'Wild fight' },
  elite:    { icon: '💀', label: 'Elite fight (harder, better rewards)' },
  rest:     { icon: '🏥', label: 'Pokémon Center (heal)' },
  treasure: { icon: '🎁', label: 'Treasure (choose a relic)' },
  shop:     { icon: '🏪', label: 'Poké Mart (spend ₽ on cards, relics and forgetting moves)' },
  boss:     { icon: '👑', label: 'Boss' },
};

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const randFloat = (min, max) => min + Math.random() * (max - min);

/* ============================================================
   BUILDING THE MAP
   ============================================================ */

/** Build a random map. Returns { floors: [[room...]...], boss, byId }. */
export function generateMap({ eliteMult = 1 } = {}) {
  const grid = Array.from({ length: FLOORS }, () => Array(COLS).fill(null));

  // Rooms are made on demand, so only rooms that a path visits exist.
  const roomAt = (floor, col) => {
    if (!grid[floor][col]) {
      grid[floor][col] = {
        id: `f${floor}c${col}`, floor, col, type: 'fight',
        next: [], prev: [], visited: false,
        jx: randFloat(-2, 2), jy: randFloat(-1.2, 1.2),   // small wobble so it looks hand-drawn
      };
    }
    return grid[floor][col];
  };
  const link = (from, to) => {
    if (!from.next.includes(to.id)) from.next.push(to.id);
    if (!to.prev.includes(from.id)) to.prev.push(from.id);
  };

  // 1. Walk the paths.
  let firstStart = -1;
  for (let p = 0; p < PATHS; p++) {
    let col = randInt(0, COLS - 1);
    if (p === 1) while (col === firstStart) col = randInt(0, COLS - 1);   // two different starts
    if (p === 0) firstStart = col;

    let room = roomAt(0, col);
    for (let floor = 0; floor < FLOORS - 1; floor++) {
      col = nextColumn(grid, floor, col);
      const above = roomAt(floor + 1, col);
      link(room, above);
      room = above;
    }
  }

  // 2. Collect the rooms that exist (pathless ones were never created).
  const floors = grid.map(row => row.filter(Boolean));
  const boss = {
    id: 'boss', floor: FLOORS, col: Math.floor(COLS / 2), type: 'boss',
    next: [], prev: [], visited: false, jx: 0, jy: 0,
  };
  floors[TOP_FLOOR].forEach(room => link(room, boss));

  // 3. Decide what each room is.
  assignTypes(floors, { ...ROOM_ODDS, elite: ROOM_ODDS.elite * eliteMult });

  const byId = {};
  [...floors.flat(), boss].forEach(room => { byId[room.id] = room; });
  return { floors, boss, byId };
}

/**
 * Pick the column for the next step of a path: straight up, or one to the
 * left or right. A step is not allowed if it would cross another path.
 */
function nextColumn(grid, floor, col) {
  const options = [col];
  if (col > 0) options.push(col - 1);
  if (col < COLS - 1) options.push(col + 1);

  const crosses = (target) => {
    // Going right crosses a path that goes from the room on our right to the column we're leaving...
    const neighbour = grid[floor][target];
    return target !== col && neighbour && neighbour.next.includes(`f${floor + 1}c${col}`);
  };
  const allowed = options.filter(target => !crosses(target));
  return allowed[randInt(0, allowed.length - 1)];
}

/* ---------- room types ---------- */

function assignTypes(floors, odds) {
  const byId = Object.fromEntries(floors.flat().map(r => [r.id, r]));
  const fix = (floor, type) => floors[floor].forEach(room => { room.type = type; room.decided = true; });

  // Fixed floors.
  fix(0, 'fight');
  fix(TREASURE_FLOOR, 'treasure');
  fix(TOP_FLOOR, 'rest');

  // Everything else is rolled, floor by floor from the bottom, so a room
  // can always look at the rooms below it that are already decided.
  const MAX_STRICT_TRIES = 25;
  for (let floor = 1; floor < TOP_FLOOR; floor++) {
    if (floor === TREASURE_FLOOR) continue;

    for (const room of floors[floor]) {
      let type = 'fight';
      for (let tries = 0; tries < 200; tries++) {
        type = rollType(odds);
        // The "different destinations" rule is dropped if it can't be met
        // (early floors only allow fights, so siblings can't all differ).
        const strict = tries < MAX_STRICT_TRIES;
        if (isAllowed(room, type, byId, strict)) break;
      }
      room.type = type;
      room.decided = true;
    }
  }
}

function rollType(odds) {
  const total = Object.values(odds).reduce((sum, n) => sum + n, 0);
  let roll = Math.random() * total;
  for (const [type, chance] of Object.entries(odds)) {
    if ((roll -= chance) < 0) return type;
  }
  return 'fight';
}

/** The rules a rolled room type must obey (same idea as Slay the Spire's). */
function isAllowed(room, type, byId, strict) {
  const parents = room.prev.map(id => byId[id]);

  // 1. Elites and rest sites can't be too low on the map.
  if ((type === 'elite' || type === 'rest') && room.floor < MIN_ELITE_REST_FLOOR) return false;

  if (type === 'shop' && room.floor < MIN_SHOP_FLOOR) return false;

  // 2. A rest site can't sit right under the top floor of rest sites.
  if (type === 'rest' && room.floor === TOP_FLOOR - 1) return false;

  // 3. Elites, rest sites and shops can't come twice in a row on the same path.
  if (type !== 'fight' && parents.some(p => p.type === type)) return false;

  // 4. Rooms that share a parent should lead to different things.
  if (strict) {
    for (const parent of parents) {
      const siblings = parent.next.map(id => byId[id]).filter(s => s !== room);
      if (siblings.some(s => s.decided && s.type === type)) return false;
    }
  }
  return true;
}

/* ============================================================
   WALKING THE MAP
   ============================================================ */

/** Which rooms can you walk to right now? */
export function reachableNodes(map, currentId) {
  if (!currentId) return map.floors[0];
  return map.byId[currentId].next.map(id => map.byId[id]);
}

/* ============================================================
   DRAWING THE MAP  -  in the style of a Pokégear town map

   Everything snaps to a grid of tiles. Terrain and routes are painted
   pixel by pixel onto a small canvas that CSS scales up with
   image-rendering: pixelated. The rooms are buttons laid over it.

   Every link runs straight up out of its room, jogs sideways on the
   row halfway to the next floor, then runs straight up into the next
   room. Paths never cross (see nextColumn), so links that share a
   jog row just merge into one route, like crossroads.
   ============================================================ */

const TILE = 8;                                   // canvas pixels per tile
const GRID_W = 3 + (COLS - 1) * 5 + 4;             // tiles across
const BOSS_ROW = 10;                              // leaves room above the boss for its silhouette
const rowY = (floor) => floor >= FLOORS ? BOSS_ROW : BOSS_ROW + 7 + (FLOORS - 1 - floor) * 6;   // tile row (boss on top)
const JOIN_ROW = rowY(0) + 3;                      // where the routes from the first rooms meet
const START_ROW = JOIN_ROW + 6;                    // the end of the single road up the middle, where you start
const GRID_H = START_ROW + 2;
const BOSS_COL = Math.floor(COLS / 2);
const CENTER_X = 3 + BOSS_COL * 5;                // tile column of the boss and the start road
const MAX_STEP = 8;                               // widest gap between columns, so a narrow map isn't stretched thin

let colX = (col) => 3 + col * 5;                  // tile column of a room, set per map by spreadColumns()

/** Paths can wander to one side, so spread the columns this map actually uses across the width, centred under the boss. */
function spreadColumns(map) {
  const cols = map.floors.flat().map(node => node.col);
  const lo = Math.min(...cols), hi = Math.max(...cols);
  const step = hi > lo ? Math.min(MAX_STEP, ((COLS - 1) * 5) / (hi - lo)) : 0;
  colX = (col) => Math.round(CENTER_X + (col - (lo + hi) / 2) * step);
}
const nodeX = (node) => (node.type === 'boss' ? CENTER_X : colX(node.col));

const PALETTES = {
  clearing: { ground: 'grass', blobs: [['water', 5, 20, 50], ['mountain', 4, 10, 26], ['trees', 4, 6, 16]] },
  shrine:   { ground: 'moss',  blobs: [['trees', 9, 14, 40], ['water', 3, 12, 28], ['mountain', 2, 8, 16]] },
  wastes:   { ground: 'dust',  blobs: [['mountain', 7, 14, 36], ['lava', 5, 12, 30]] },
};

// base, light, dark, edge (the 1px line where it meets other terrain)
const TERRAIN = {
  grass:    ['#58c040', '#88e060', '#389828'],
  moss:     ['#3f9a3f', '#66bd55', '#2a7a2e'],
  dust:     ['#c09460', '#dcb27c', '#8e6a40'],
  water:    ['#3878f0', '#a8d8f8', '#2858c0', '#e8f8ff'],
  lava:     ['#e04818', '#f8c030', '#a02808', '#601800'],
  mountain: ['#c08040', '#e8b070', '#7a4a20', '#5a3010'],
  trees:    ['#2f8a2f', '#58b848', '#185018', '#103810'],
};

// 8x8 motifs: . base, L light, D dark
const MOTIFS = {
  mountain: ['........', '...LL...', '..LL.D..', '.LL...D.', '.L....DD', 'L.....DD', '......DD', 'DDDDDDDD'],
  trees:    ['..LLL...', '.LL..D..', 'LL....D.', 'L.....D.', '.D...DD.', '..DDDD..', '...DD...', '........'],
};

const ROUTE = { edge: '#9a8448', fill: '#f8f0b8', walked: '#e83030', active: '#ffffff' };
let flowTimer = 0;

/** A small seeded random number generator (mulberry32), so a refresh draws the same terrain. */
function seeded(text) {
  let seed = 0;
  for (const ch of text) seed = Math.imul(seed ^ ch.charCodeAt(0), 2654435761);
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The routes as tile rectangles: [x1, y1, x2, y2, state]. */
function routeSegments(map, currentId, reachable) {
  const segs = [];
  const add = (x1, y1, x2, y2, state) => segs.push([Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2), state]);
  const link = (x1, y1, x2, y2, jog, state) => {
    add(x1, y1, x1, jog, state);
    add(x1, jog, x2, jog, state);
    add(x2, jog, x2, y2, state);
  };
  for (const node of Object.values(map.byId)) {
    for (const nextId of node.next) {
      const to = map.byId[nextId];
      const state = node.id === currentId && reachable.has(nextId) ? 'active' : node.visited && to.visited ? 'walked' : 'fill';
      link(nodeX(node), rowY(node.floor), nodeX(to), rowY(to.floor), rowY(node.floor) - 3, state);
    }
  }
  for (const node of map.floors[0]) {
    const state = !currentId ? 'active' : node.visited ? 'walked' : 'fill';
    link(CENTER_X, START_ROW, nodeX(node), rowY(0), JOIN_ROW, state);
  }
  return segs;
}

/** Which tiles are what: ground, water, mountain... Blobs grow in the gaps between routes. */
function terrainGrid(map, biomeId, segs, rand) {
  const palette = PALETTES[biomeId] || PALETTES.clearing;
  const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(palette.ground));

  // How far each tile is from a route or room, so blobs keep clear of them.
  const dist = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(Infinity));
  const queue = [];
  const block = (x, y) => { if (dist[y]?.[x] === Infinity) { dist[y][x] = 0; queue.push([x, y]); } };
  for (const [x1, y1, x2, y2] of segs) for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) block(x, y);
  for (const node of Object.values(map.byId)) {
    const r = node.type === 'boss' ? 2 : 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) block(nodeX(node) + dx, rowY(node.floor) + dy);
  }
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (dist[ny]?.[nx] === Infinity) { dist[ny][nx] = dist[y][x] + 1; queue.push([nx, ny]); }
    }
  }

  for (const [kind, count, min, max] of palette.blobs) {
    for (let n = 0; n < count; n++) {
      const seeds = [];
      for (let y = 0; y < GRID_H; y++) for (let x = 0; x < GRID_W; x++) {
        if (dist[y][x] >= 2 && grid[y][x] === palette.ground) seeds.push([x, y]);
      }
      if (!seeds.length) return grid;
      const size = min + Math.floor(rand() * (max - min + 1));
      const blob = [seeds[Math.floor(rand() * seeds.length)]];
      grid[blob[0][1]][blob[0][0]] = kind;
      for (let tries = 0; blob.length < size && tries < size * 20; tries++) {
        const [x, y] = blob[Math.floor(rand() * blob.length)];
        const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rand() * 4)];
        const nx = x + dx, ny = y + dy;
        if (dist[ny]?.[nx] >= 1 && grid[ny][nx] === palette.ground) { grid[ny][nx] = kind; blob.push([nx, ny]); }
      }
    }
  }
  return grid;
}

// ImageData wants ABGR on little-endian machines (all of them, in practice)
const abgr = (color) => {
  const n = parseInt(color.slice(1), 16);
  return ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
};

const ripple = (x, y) => (((x + y) % 6) + 6) % 6 === 0 && ((x - y) & 7) < 4;   // short diagonal dashes

function paintTerrain(canvas, map, biomeId, segs) {
  const rand = seeded(`${biomeId}|${Object.keys(map.byId).sort().join()}`);
  const grid = terrainGrid(map, biomeId, segs, rand);
  const w = GRID_W * TILE, h = GRID_H * TILE;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const px = new Uint32Array(img.data.buffer);
  const put = (x, y, c) => { px[y * w + x] = c; };
  const terrain = Object.fromEntries(Object.entries(TERRAIN).map(([k, v]) => [k, v.map(abgr)]));
  const route = Object.fromEntries(Object.entries(ROUTE).map(([k, v]) => [k, abgr(v)]));
  const flowing = [];   // [x, y, base, light, speed] for every water/lava pixel, redrawn as it drifts

  for (let ty = 0; ty < GRID_H; ty++) for (let tx = 0; tx < GRID_W; tx++) {
    const kind = grid[ty][tx];
    const [base, light, dark, edge] = terrain[kind];
    const motif = MOTIFS[kind];
    const tuft = !motif && rand() < 0.22 ? [1 + Math.floor(rand() * 4), 1 + Math.floor(rand() * 5)] : null;
    for (let ly = 0; ly < TILE; ly++) for (let lx = 0; lx < TILE; lx++) {
      const x = tx * TILE + lx, y = ty * TILE + ly;
      let c = base;
      if (kind === 'water' || kind === 'lava') {
        if (ripple(x, y)) c = light;
        flowing.push([x, y, base, light, kind === 'water' ? 1 : -0.5]);
      } else if (motif) {
        const m = motif[ly][lx];
        c = m === 'L' ? light : m === 'D' ? dark : base;
      } else if (tuft && ly === tuft[1] + 1 && (lx === tuft[0] || lx === tuft[0] + 2)) {
        c = dark;
      } else if (tuft && ly === tuft[1] && lx === tuft[0] + 1) {
        c = light;
      }
      put(x, y, c);
    }
    if (edge) {
      const other = (dx, dy) => (grid[ty + dy]?.[tx + dx] ?? kind) !== kind;
      for (let i = 0; i < TILE; i++) {
        if (other(0, -1)) put(tx * TILE + i, ty * TILE, edge);
        if (other(0, 1)) put(tx * TILE + i, ty * TILE + TILE - 1, edge);
        if (other(-1, 0)) put(tx * TILE, ty * TILE + i, edge);
        if (other(1, 0)) put(tx * TILE + TILE - 1, ty * TILE + i, edge);
      }
    }
  }

  // Routes: every edge first, then the fills, so routes that meet merge without a seam.
  // Walked routes keep the plain fill and get thick red dashes, like a trail.
  const rect = (x1, y1, x2, y2, c) => { for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) put(x, y, c); };
  for (const [x1, y1, x2, y2] of segs) rect(x1 * TILE, y1 * TILE, (x2 + 1) * TILE, (y2 + 1) * TILE, route.edge);
  for (const state of ['fill', 'walked', 'active']) {
    for (const [x1, y1, x2, y2, s] of segs) {
      if (s !== state) continue;
      rect(x1 * TILE + 1, y1 * TILE + 1, (x2 + 1) * TILE - 1, (y2 + 1) * TILE - 1, route[s === 'walked' ? 'fill' : s]);
      if (s !== 'walked') continue;
      if (y1 === y2 && x1 !== x2) {
        for (let x = x1 * TILE + 1; x < (x2 + 1) * TILE - 1; x++) if (x % 6 < 4) rect(x, y1 * TILE + 2, x + 1, y1 * TILE + TILE - 2, route.walked);
      } else {
        for (let y = y1 * TILE + 1; y < (y2 + 1) * TILE - 1; y++) if (y % 6 < 4) rect(x1 * TILE + 2, y, x1 * TILE + TILE - 2, y + 1, route.walked);
      }
    }
  }
  const draw = () => ctx.putImageData(img, 0, 0);
  draw();

  // Water and lava drift, a pixel at a time, while the map is on screen.
  clearInterval(flowTimer);
  if (!flowing.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let tick = 0;
  flowTimer = setInterval(() => {
    if (!canvas.isConnected) return clearInterval(flowTimer);
    if ($('map-screen').hidden) return;
    tick++;
    for (const [x, y, base, light, speed] of flowing) {
      put(x, y, ripple(x - Math.floor(tick * speed), y) ? light : base);
    }
    draw();
  }, 220);
}

/**
 * Draw the map into #map. onPick(node) is called when you click a reachable node.
 * biome is the biome id (it picks the terrain), trainer is your Pokémon's sprite url.
 */
export function renderMap(map, currentId, onPick, { biome = 'clearing', trainer, stage = 2 } = {}) {
  const box = $('map');
  box.replaceChildren();
  box.style.setProperty('--grid-w', GRID_W);
  box.style.setProperty('--grid-h', GRID_H);
  spreadColumns(map);
  const reachable = new Set(reachableNodes(map, currentId).map(n => n.id));
  const segs = routeSegments(map, currentId, reachable);

  const canvas = el('canvas', 'map-terrain');
  canvas.setAttribute('aria-hidden', 'true');
  paintTerrain(canvas, map, biome, segs);
  box.append(canvas);

  const place = (elem, x, y) => {
    elem.style.left = `${((x + 0.5) / GRID_W) * 100}%`;
    elem.style.top = `${((y + 0.5) / GRID_H) * 100}%`;
  };

  for (const node of Object.values(map.byId)) {
    const info = NODE_INFO[node.type];
    const btn = el('button', `map-node type-${node.type}`);
    btn.type = 'button';
    btn.append(el('span', 'map-town', info.icon));
    place(btn, nodeX(node), rowY(node.floor));
    let label = info.label;

    // Every fight is chosen ahead of time (so a refresh can't reroll it), but only elites and bosses are scouted.
    if (node.enemyId && node.type !== 'fight') {
      const def = ENEMY_DEFS[node.enemyId];
      const type = TYPES[def.type];
      label = `${info.label}: ${node.type === 'elite' ? 'Alpha ' : ''}${def.name} (${type.label} type)`;
      btn.append(el('span', `node-badge type-${def.type}`, type.icon));
    }
    btn.title = label;
    btn.setAttribute('aria-label', label);

    const canGo = reachable.has(node.id);
    if (node.visited) btn.classList.add('visited');
    if (node.id === currentId) btn.classList.add('current');
    if (canGo) btn.classList.add('reachable');
    btn.disabled = !canGo;
    if (canGo) btn.addEventListener('click', () => onPick(node));
    box.append(btn);
  }

  // The biome's boss waits above its room as a grey silhouette, a hint of what's coming.
  const boss = map.boss.enemyId && ENEMY_DEFS[map.boss.enemyId];
  if (boss?.image) {
    const img = el('img', 'map-boss-shadow');
    img.src = boss.image;
    img.alt = '';
    place(img, CENTER_X, rowY(FLOORS));
    box.append(img);
  }

  if (trainer) {
    const here = currentId && map.byId[currentId];
    const img = el('img', here ? 'map-trainer' : 'map-trainer at-start');
    img.dataset.stage = String(stage);
    img.src = trainer;
    img.alt = '';
    place(img, (here ? nodeX(here) : CENTER_X), here ? rowY(here.floor) : START_ROW);
    box.append(img);
  }
}
