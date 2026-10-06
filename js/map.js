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

       boss             👹
                      /    \
       top floor     🏥    🏥      <- always rest sites
       ...
       bottom       ⚔️  ⚔️  ⚔️     <- you start here (always fights)

   generateMap() builds the data. renderMap() draws it.
   ============================================================ */

import { TYPES } from './data/cards.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { buildingSvg } from './buildings.js';
import { random } from './rng.js';

// Map generation is also imported by the headless balance bot's Web Worker. Load DOM helpers only in a page so the
// worker can share generateMap() without evaluating UI modules that need document/window.
const UI = typeof document === 'undefined' ? {} : await import('./ui.js');
const TRANSITIONS = typeof document === 'undefined' ? {} : await import('./transition.js');
const { $, el } = UI;
const { preloadBoss } = TRANSITIONS;

/* ---------- the knobs you can turn ---------- */
const COLS = 7;       // columns in the grid
const MAP_FLOORS = 10;   // floors per biome (Slay the Spire uses 15: a much longer run)
const PATHS = 6;      // how many random paths are walked

// Chance (in %) of each room type on floors that are not fixed.
// Marts aren't rolled: placeMarts() puts them where most routes pass (see MART_ROUTE_SHARE).
const ROOM_ODDS = { fight: 45, event: 22, elite: 16, rest: 12, shop: 0 };

// Where the special floors are, scaled to the number of floors (a map's own: Mewtwo's sprint biomes have fewer)
// (for 15 floors this gives: treasure on floor 9, no elites/rests below floor 6).
let TREASURE_FLOOR, MIN_ELITE_REST_FLOOR, TOP_FLOOR, MIN_SHOP_FLOOR, MART_FLOORS;
function setFloors(floors) {
  TREASURE_FLOOR = Math.max(2, Math.round(floors * 0.6) - 1);   // index, 0 = bottom
  MIN_ELITE_REST_FLOOR = Math.max(2, Math.round(floors * 0.4) - 1);
  TOP_FLOOR = floors - 1;                                        // always rest sites
  MIN_SHOP_FLOOR = MIN_ELITE_REST_FLOOR + 1;                     // a few fights in, so you have prize money to spend
  // Prize money is only spent at a Mart, so after rolling, fights/events on these floors (after the
  // treasure, when you have ~5 fights of ₽) become Marts until this share of start-to-boss routes pass one.
  MART_FLOORS = [TREASURE_FLOOR + 1, Math.max(TREASURE_FLOOR + 1, TOP_FLOOR - 1)];
}
const MART_ROUTE_SHARE = 0.75;

// Rooms drawn as a building standing on the map instead of a framed square (js/buildings.js).
const BUILDINGS = ['shop', 'rest'];

export const NODE_INFO = {
  fight:    { icon: '⚔️', label: 'Wild fight' },
  elite:    { icon: '💀', label: 'Elite fight (harder, better rewards)' },
  rest:     { icon: '🏥', label: 'Pokémon Center (heal)' },
  treasure: { icon: '🎁', label: 'Treasure (choose a relic)' },
  shop:     { icon: '🏪', label: 'Poké Mart (spend ₽ on cards, relics and forgetting moves)' },
  event:    { icon: '❓', label: 'Mystery event (a choice, often with a cost)' },
  boss:     { icon: '👹', label: 'Boss' },
};

const randInt = (min, max) => min + Math.floor(random() * (max - min + 1));
const randFloat = (min, max) => min + random() * (max - min);

/* ============================================================
   BUILDING THE MAP
   ============================================================ */

/* A biome is 3 places plus the boss's arena (the scenery's stages, js/scene.js; their names are each biome's `stages`
   in js/data/enemies.js): floors 1-3, 4-6, 7-10, then the boss. The road in (floor 0) is the first place's too.
   A shorter map (Mewtwo's sprint through biomes 1-3) stays in the first place all the way to the boss. */
const STAGE_OF_FLOOR = [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2];

/** Which place a room is in (0-2, 3 the boss's arena) and how many floors into it (`step`, 0 at its first). */
export function stageOf(map, node) {
  if (node?.type === 'boss') return { stage: 3, step: 0 };
  const floor = node ? node.floor + 1 : 0;
  if (map && map.floors.length < MAP_FLOORS) return { stage: 0, step: floor };
  const stage = STAGE_OF_FLOOR[Math.min(floor, STAGE_OF_FLOOR.length - 1)];
  return { stage, step: floor - STAGE_OF_FLOOR.indexOf(stage) };
}

/** Where a room is on the biome's journey, for the scenery (showScene() in js/scene.js): `progress`, 0 on the road in
    to 1 at the boss (floor / (floors + 1), the same steps as the map's EXP bar), its stage and step, and a `seed` of the
    map's own, so each run deals the landmarks out afresh and a refresh draws the same ones. */
export function journey(map, node) {
  if (!map) return { progress: 0, stage: 0, step: 0, seed: 0 };
  const progress = node ? Math.min(1, (node.floor + 1) / (map.floors.length + 1)) : 0;
  let seed = 7;
  for (const id of Object.keys(map.byId)) for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) | 0;
  for (const n of Object.values(map.byId)) seed = (seed * 31 + n.type.length + (n.enemyId?.length || 0)) | 0;
  return { progress, ...stageOf(map, node), seed: seed >>> 0 };
}

/** Build a random map, `floors` high, or a single fixed road when `floors` is a list of room types (Mewtwo's sprint).
    Returns { floors: [[room...]...], boss, byId }. */
export function generateMap({ eliteMult = 1, floors: count = MAP_FLOORS } = {}) {
  if (Array.isArray(count)) return roadMap(count);
  setFloors(count);
  const grid = Array.from({ length: count }, () => Array(COLS).fill(null));

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
    for (let floor = 0; floor < count - 1; floor++) {
      col = nextColumn(grid, floor, col);
      const above = roomAt(floor + 1, col);
      link(room, above);
      room = above;
    }
  }

  // 2. Collect the rooms that exist (pathless ones were never created).
  const floors = grid.map(row => row.filter(Boolean));
  const boss = {
    id: 'boss', floor: count, col: Math.floor(COLS / 2), type: 'boss',
    next: [], prev: [], visited: false, jx: 0, jy: 0,
  };
  floors[TOP_FLOOR].forEach(room => link(room, boss));

  // 3. Decide what each room is.
  assignTypes(floors, { ...ROOM_ODDS, elite: ROOM_ODDS.elite * eliteMult });

  const byId = {};
  [...floors.flat(), boss].forEach(room => { byId[room.id] = room; });
  return { floors, boss, byId };
}

function roadMap(types) {
  const col = Math.floor(COLS / 2);
  const rooms = types.map((type, floor) => ({
    id: `f${floor}c${col}`, floor, col, type, decided: true, next: [], prev: [], visited: false,
    jx: randFloat(-2, 2), jy: randFloat(-1.2, 1.2),
  }));
  const boss = { id: 'boss', floor: types.length, col, type: 'boss', next: [], prev: [], visited: false, jx: 0, jy: 0 };
  [...rooms, boss].forEach((room, i, all) => {
    if (i) { room.prev.push(all[i - 1].id); all[i - 1].next.push(room.id); }
  });
  return { floors: rooms.map(room => [room]), boss, byId: Object.fromEntries([...rooms, boss].map(room => [room.id, room])) };
}

/** The Sky Pillar's flight (js/data/tower.js): one row of doors per landing, every door leading to every door of the
    landing above, then the guardian. Rendered as a normal map until the tower gets its own screen (roadmap item 18 b). */
export function landingMap(rows) {
  const SPREAD = { 1: [3], 2: [2, 4], 3: [1, 3, 5] };
  const floors = rows.map((types, floor) => types.map((type, k) => ({
    id: `f${floor}c${SPREAD[types.length][k]}`, floor, col: SPREAD[types.length][k], type, decided: true,
    next: [], prev: [], visited: false, jx: 0, jy: 0,
  })));
  const boss = { id: 'boss', floor: rows.length, col: Math.floor(COLS / 2), type: 'boss', next: [], prev: [], visited: false, jx: 0, jy: 0 };
  [...floors, [boss]].forEach((row, i, all) => {
    if (!i) return;
    for (const from of all[i - 1]) for (const to of row) { from.next.push(to.id); to.prev.push(from.id); }
  });
  return { floors, boss, byId: Object.fromEntries([...floors.flat(), boss].map(room => [room.id, room])) };
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

  placeMarts(floors, byId);
}

/** Turn the rooms that the most routes run through into Marts until MART_ROUTE_SHARE of the routes pass one. */
function placeMarts(floors, byId) {
  const fits = (room, strict) => ['fight', 'event'].includes(room.type)
    && room.floor >= MART_FLOORS[0] && room.floor <= MART_FLOORS[1]
    && room.next.every(id => byId[id].type !== 'shop')
    && isAllowed(room, 'shop', byId, strict);

  let share = martRouteShare(floors, byId);
  while (share < MART_ROUTE_SHARE) {
    let spots = floors.flat().filter(room => fits(room, true));
    if (!spots.length) spots = floors.flat().filter(room => fits(room, false));
    if (!spots.length) return;
    let best = null;
    for (const room of spots) {
      const type = room.type;
      room.type = 'shop';
      const gain = martRouteShare(floors, byId) + random() * 1e-6;
      room.type = type;
      if (!best || gain > best.gain) best = { room, gain };
    }
    best.room.type = 'shop';
    share = best.gain;
  }
}

/** The share of start-to-boss routes that pass at least one Mart. */
function martRouteShare(floors, byId) {
  const all = {}, dry = {};
  for (let f = floors.length - 1; f >= 0; f--) {
    for (const room of floors[f]) {
      const next = room.next.filter(id => id !== 'boss');
      all[room.id] = next.length ? next.reduce((sum, id) => sum + all[id], 0) : 1;
      dry[room.id] = room.type === 'shop' ? 0 : next.length ? next.reduce((sum, id) => sum + dry[id], 0) : 1;
    }
  }
  const total = floors[0].reduce((sum, room) => sum + all[room.id], 0);
  return 1 - floors[0].reduce((sum, room) => sum + dry[room.id], 0) / total;
}

function rollType(odds) {
  const total = Object.values(odds).reduce((sum, n) => sum + n, 0);
  let roll = random() * total;
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

  // 3. Elites, rest sites, shops and events can't come twice in a row on the same path.
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

   Everything snaps to a grid of tiles. Terrain is painted pixel by
   pixel onto a small canvas that CSS scales up with image-rendering:
   pixelated; the routes are smooth SVG lines over it, and the rooms are
   buttons laid over those.

   Every link is its own straight line from room to room (straight up,
   or diagonal to the next column), so routes only meet inside rooms: a
   shared sideways row would join routes from different rooms and look
   like a way that doesn't exist. Links to the boss all merge into one
   road, since they lead to the same room.
   ============================================================ */

const TILE = 8;                                   // canvas pixels per tile
const NARROW_W = 3 + (COLS - 1) * 5 + 4;           // tiles across on a phone
const WIDEST_W = 72;                              // tiles across at most, on a wide screen
const WIDE_TILE = 11;                             // CSS px per tile on a wide screen (css/screens.css)
let GRID_W = NARROW_W;                            // set per render by fitGrid()
const BOSS_ROW = 10;                              // leaves room above the boss for its silhouette
let rows = MAP_FLOORS;                            // the drawn map's floors (setRows())
const rowY = (floor) => floor >= rows ? BOSS_ROW : BOSS_ROW + 7 + (rows - 1 - floor) * 6;   // tile row (boss on top)
let JOIN_ROW, START_ROW, GRID_H;
function setRows(n) {
  rows = n;
  JOIN_ROW = rowY(0) + 3;                          // where the routes from the first rooms meet
  START_ROW = JOIN_ROW + 6;                        // the end of the single road up the middle, where you start
  GRID_H = START_ROW + 4;                          // room under the road for your Pokémon to stand at the start
}
setRows(MAP_FLOORS);
const BOSS_COL = Math.floor(COLS / 2);
let CENTER_X = 3 + BOSS_COL * 5;                  // tile column of the boss and the start road
const MAX_STEP = 8;                               // widest gap between columns on a phone, so a narrow map isn't stretched thin

let colX = (col) => 3 + col * 5;                  // tile column of a room, set per map by spreadColumns()

/**
 * The map always stays upright. A phone fits it to the screen's height (CSS: 78vh); a wider screen draws it
 * at WIDE_TILE px a tile and gives it more tiles across instead of stretching it, so it fills the width with
 * more terrain and the rooms spread further apart, and the page scrolls (showMap() keeps you in view).
 */
function fitGrid(box) {
  const room = Math.min(innerWidth, 1100) - 32 - 20;   // #map-screen's width and padding, then .map-wrap's (the screen may still be hidden)
  GRID_W = innerWidth <= 720 ? NARROW_W : Math.max(NARROW_W, Math.min(WIDEST_W, Math.floor(room / WIDE_TILE)));
  CENTER_X = Math.floor(GRID_W / 2);
}

/** Paths can wander to one side, so spread the columns this map actually uses across the width, centred under the boss. */
function spreadColumns(map) {
  const cols = map.floors.flat().map(node => node.col);
  const lo = Math.min(...cols), hi = Math.max(...cols);
  const step = hi > lo ? Math.min(MAX_STEP * GRID_W / NARROW_W, (GRID_W - 7) / (hi - lo)) : 0;
  colX = (col) => Math.round(CENTER_X + (col - (lo + hi) / 2) * step);
}
const nodeX = (node) => (node.type === 'boss' ? CENTER_X : colX(node.col));

const PALETTES = {
  clearing: { ground: 'grass', blobs: [['water', 5, 20, 50], ['mountain', 4, 10, 26], ['trees', 4, 6, 16]] },
  shrine:   { ground: 'mossy', blobs: [['ruins', 6, 10, 30], ['bamboo', 4, 10, 26], ['sakura', 5, 5, 14], ['lotus', 2, 10, 22], ['trees', 4, 8, 20]],
              props: [['torii', 2], ['lantern', 7]] },   // an overgrown temple ground, not the Clearing's meadow
  ruins:    { ground: 'mossy', blobs: [['water', 8, 14, 44], ['ruins', 6, 10, 30], ['lotus', 3, 10, 22]], props: [['lantern', 5]] },   // a flooded temple (part b paints its own)
  wastes:   { ground: 'dust',  blobs: [['mountain', 7, 14, 36], ['lava', 5, 12, 30]] },
  depths:   { ground: 'cave',  blobs: [['rift', 4, 10, 26], ['crystal', 6, 8, 26], ['geode', 4, 6, 18], ['pool', 2, 8, 18], ['boulder', 3, 5, 14]] },   // Mewtwo's Crystal Depths: energy rifts, amethyst and ice crystal
  // the Safari Zone's areas (js/data/safari.js)
  meadow:   { ground: 'grass', blobs: [['trees', 3, 6, 14], ['water', 2, 10, 24], ['mountain', 2, 8, 16]] },
  forest:   { ground: 'moss',  blobs: [['trees', 12, 14, 44], ['water', 2, 8, 18]] },
  wetland:  { ground: 'grass', blobs: [['water', 9, 16, 50], ['trees', 3, 6, 16]] },
  marsh:    { ground: 'bog',   blobs: [['pool', 8, 10, 30], ['trees', 5, 8, 22]] },
  peak:     { ground: 'grass', blobs: [['snow', 7, 14, 40], ['mountain', 5, 10, 28], ['trees', 3, 6, 14]] },
  desert:   { ground: 'sand',  blobs: [['mountain', 5, 12, 30], ['dune', 6, 12, 34], ['pool', 1, 8, 14]] },
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
  cave:     ['#3a3250', '#4e446a', '#2a2440'],
  crystal:  ['#6a40a8', '#d8b0ff', '#3e2468', '#1c1034'],
  geode:    ['#2a78b8', '#b0f0ff', '#184880', '#0c2240'],
  rift:     ['#c0207a', '#ff9ae0', '#7a0c48', '#3a0624'],   // Eternatus's energy breaking through the floor
  pool:     ['#2a5ab0', '#88e0f8', '#1a3a80', '#d8f8ff'],
  boulder:  ['#6a6078', '#9a90a8', '#40384c', '#241e2c'],
  bog:      ['#5e7a42', '#7e9a58', '#465e32'],
  sand:     ['#e8c888', '#f8e0a8', '#c8a468'],
  snow:     ['#e8f0f8', '#ffffff', '#b8c8e0', '#90a4c4'],
  dune:     ['#d8b070', '#f0d098', '#b08848', '#8a6a34'],
  // the Shrine's; a fifth colour is a motif's G (moss on stone, a bamboo node)
  mossy:    ['#3e7a3a', '#5e9a4a', '#2a5a2a'],
  ruins:    ['#8a9078', '#b2b69a', '#58624c', '#38422e', '#4e8a3a'],
  bamboo:   ['#24522a', '#8ccc58', '#5aa040', '#163a1a', '#d0ec90'],
  sakura:   ['#e890b8', '#ffd0e4', '#b05888', '#6a2848'],
  lotus:    ['#2a6a78', '#7cc0c0', '#1a4a58', '#c8e8d8'],
};

// the Shrine's landmarks, drawn over the ground: . see-through, R vermilion, K its shade, G moss, S stone, D its shade, Y lamp glow
const PROPS = {
  torii: ['................', 'RR............RR', 'RRRRRRRRRRRRRRRR', '.KKGKKKKKKKKGKK.', '...RR..G...RR...', '..RRRRRRRRRRRR..',
          '..KKKKKKKKKKKK..', '...RR......RR...', '...RG......RR...', '...RR......GR...', '...RR......RR...', '...GR......RR...',
          '...RR......RG...', '...RR......RR...', '..SSSS....SSSS..', '................'],
  lantern: ['...SS...', '.SGSSSG.', '..DDDD..', '..DYYD..', '..SSSS..', '...SD...', '...GD...', '..SSSS..'],
};
const PROP_INK = { R: '#c84a32', K: '#7a2418', G: '#58a040', S: '#d4d6c0', D: '#8a8e78', Y: '#ffe070' };

// 8x8 motifs: . base, L light, D dark
const MOTIFS = {
  mountain: ['........', '...LL...', '..LL.D..', '.LL...D.', '.L....DD', 'L.....DD', '......DD', 'DDDDDDDD'],
  trees:    ['..LLL...', '.LL..D..', 'LL....D.', 'L.....D.', '.D...DD.', '..DDDD..', '...DD...', '........'],
  geode:    ['..L.....', '..LL.L..', '.LLD.LL.', '.LDD.LD.', 'LLDD.LDD', 'LDDD.LDD', 'LDDDLLDD', 'DDDDDDDD'],
  crystal:  ['...L....', '..LL..L.', '..LD.LL.', '.LLD.LD.', '.LDD.LD.', 'LLDD.LDD', 'LLDDLLDD', 'DDDDDDDD'],
  boulder:  ['........', '..LLL...', '.LL..D..', '.L....D.', 'L.....DD', 'L....DDD', '.DDDDDD.', '........'],
  snow:     ['........', '...L....', '..LLL...', '........', '......L.', '.....LL.', '........', '........'],
  dune:     ['........', '..LLLL..', '.L....DD', 'L.......', '........', '...LLL..', '..L...DD', '........'],
  ruins:    ['LLL.DLL.', 'L...DL..', '....D...', 'DGDDDDGD', 'D.LLL...', 'D.L.....', 'G.......', 'DDDGDDGD'],
  bamboo:   ['.L..D.L.', '.G..D.L.', '.L..G.L.', '.L..D.G.', '.L..D.L.', '.L..D.L.', '.G..D.L.', '.L..G.L.'],
  sakura:   ['..LLL...', '.LL..D..', 'LL....D.', 'L.....D.', '.D...DD.', '..DDDD..', '...DD...', '........'],
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

/** The routes as lines through tile centres: [[x, y]...] points plus a state (fill, walked or active). */
function routeLines(map, currentId, reachable) {
  const lines = [];
  for (const node of Object.values(map.byId)) {
    for (const nextId of node.next) {
      const to = map.byId[nextId];
      const state = node.id === currentId && reachable.has(nextId) ? 'active' : node.visited && to.visited ? 'walked' : 'fill';
      lines.push({ points: linkPoints(node, to), state });
    }
  }
  for (const node of map.floors[0]) {
    const state = !currentId ? 'active' : node.visited ? 'walked' : 'fill';
    lines.push({ points: linkPoints(null, node), state });
  }
  return lines;
}

/** The route from one room to the next (from = null: the start road). The roads that merge (into the boss, out of the start) go up, sideways on a jog row, then up again. */
function linkPoints(from, to) {
  const [x2, y2] = [nodeX(to), rowY(to.floor)];
  const jogged = (x1, y1, jog) => [[x1, y1], [x1, jog], [x2, jog], [x2, y2]];
  if (!from) return jogged(CENTER_X, START_ROW, JOIN_ROW);
  const [x1, y1] = [nodeX(from), rowY(from.floor)];
  return to.type === 'boss' ? jogged(x1, y1, y1 - 3) : [[x1, y1], [x2, y2]];
}

/** Evenly spaced points along a route, about a tile apart, in order. Not snapped to tiles: that turned diagonals into staircases. */
function tileSteps(points) {
  const steps = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [[x1, y1], [x2, y2]] = [points[i - 1], points[i]];
    const n = Math.round(Math.hypot(x2 - x1, y2 - y1));
    for (let k = 1; k <= n; k++) steps.push([x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n]);
  }
  return steps;
}

/** Every tile a route passes through, so terrain keeps clear of the routes. */
function routeTiles(lines) {
  const tiles = [];
  for (const { points } of lines) {
    for (let i = 1; i < points.length; i++) {
      const [[x1, y1], [x2, y2]] = [points[i - 1], points[i]];
      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 4;
      for (let k = 0; k <= steps; k++) tiles.push([Math.round(x1 + (x2 - x1) * k / steps), Math.round(y1 + (y2 - y1) * k / steps)]);
    }
  }
  return tiles;
}

/* The routes are drawn as smooth lines over the pixel terrain (the user's call: pixel staircases for the
   diagonals looked too jagged). Every edge goes down first, then the fills, so routes that meet merge without a seam. */
const polyPoints = (points) => points.map(([x, y]) => `${x + 0.5},${y + 0.5}`).join(' ');

function drawRoutes(lines) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'map-routes');
  svg.setAttribute('viewBox', `0 0 ${GRID_W} ${GRID_H}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const path = ({ points }, color, width, dash) => {
    const line = document.createElementNS(NS, 'polyline');
    line.setAttribute('points', polyPoints(points));
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('stroke-linecap', dash ? 'butt' : 'square');   // square caps would fill the dash gaps
    line.setAttribute('stroke-linejoin', 'miter');
    if (dash) line.setAttribute('stroke-dasharray', dash);
    svg.append(line);
    return line;
  };
  svg.path = path;   // walkTo() draws the walked trail with it
  for (const line of lines) path(line, ROUTE.edge, 1);
  for (const state of ['fill', 'walked', 'active']) {
    for (const line of lines.filter(l => l.state === state)) path(line, ROUTE[state], 0.75);
  }
  return svg;
}

/** Which tiles are what: ground, water, mountain... Blobs grow in the gaps between routes. */
function terrainGrid(map, biomeId, tiles, rand) {
  const palette = PALETTES[biomeId] || PALETTES.clearing;
  const grid = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(palette.ground));

  // How far each tile is from a route or room, so blobs keep clear of them.
  const dist = Array.from({ length: GRID_H }, () => Array(GRID_W).fill(Infinity));
  const queue = [];
  const block = (x, y) => { if (dist[y]?.[x] === Infinity) { dist[y][x] = 0; queue.push([x, y]); } };
  for (const [x, y] of tiles) block(x, y);
  for (const node of Object.values(map.byId)) {
    const r = node.type === 'boss' || BUILDINGS.includes(node.type) ? 2 : 1;   // buildings are 4 tiles wide
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) block(nodeX(node) + dx, rowY(node.floor) + dy);
  }
  for (let dy = -4; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) block(CENTER_X + dx, START_ROW + dy);   // your Pokémon stands here at the start, not in a lake
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (dist[ny]?.[nx] === Infinity) { dist[ny][nx] = dist[y][x] + 1; queue.push([nx, ny]); }
    }
  }

  for (const [kind, count, min, max] of palette.blobs) {
    for (let n = 0; n < Math.round(count * GRID_W / NARROW_W); n++) {
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

  // Landmarks stand on open ground clear of the routes, never touching each other: [kind, tile x, tile y].
  grid.props = [];
  for (const [kind, count] of palette.props || []) {
    const span = PROPS[kind].length / TILE;
    for (let n = 0; n < Math.round(count * GRID_W / NARROW_W); n++) {
      const spots = [];
      for (let y = 0; y + span <= GRID_H; y++) for (let x = 0; x + span <= GRID_W; x++) {
        let open = true;
        for (let dy = -1; dy <= span && open; dy++) for (let dx = -1; dx <= span && open; dx++) {
          const inside = dy >= 0 && dy < span && dx >= 0 && dx < span;
          if (inside ? !(dist[y + dy][x + dx] >= 2 && grid[y + dy][x + dx] === palette.ground) : grid[y + dy]?.[x + dx] === 'prop') open = false;
        }
        if (open) spots.push([x, y]);
      }
      if (!spots.length) break;
      const [x, y] = spots[Math.floor(rand() * spots.length)];
      for (let dy = 0; dy < span; dy++) for (let dx = 0; dx < span; dx++) grid[y + dy][x + dx] = 'prop';
      grid.props.push([kind, x, y]);
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

function paintTerrain(canvas, map, biomeId, tiles, flow = true) {
  const rand = seeded(`${biomeId}|${Object.keys(map.byId).sort().join()}`);
  const grid = terrainGrid(map, biomeId, tiles, rand);
  const w = GRID_W * TILE, h = GRID_H * TILE;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const px = new Uint32Array(img.data.buffer);
  const put = (x, y, c) => { px[y * w + x] = c; };
  const terrain = Object.fromEntries(Object.entries(TERRAIN).map(([k, v]) => [k, v.map(abgr)]));
  const flowing = [];   // [x, y, base, light, speed] for every water/lava pixel, redrawn as it drifts
  const sparks = [];    // [x, y, colour] crystal tips that glint now and then
  const white = abgr('#ffffff');
  const [lily, lilyShade, lilyBloom] = ['#58a848', '#2e7a30', '#f8a8c8'].map(abgr);

  for (let ty = 0; ty < GRID_H; ty++) for (let tx = 0; tx < GRID_W; tx++) {
    const kind = grid[ty][tx] === 'prop' ? (PALETTES[biomeId] || PALETTES.clearing).ground : grid[ty][tx];   // a landmark is painted over its ground below
    const [base, light, dark, edge, moss] = terrain[kind];
    const motif = MOTIFS[kind];
    const tuft = !motif && rand() < 0.22 ? [1 + Math.floor(rand() * 4), 1 + Math.floor(rand() * 5)] : null;
    const petal = kind === 'mossy' && rand() < 0.14 ? [Math.floor(rand() * TILE), Math.floor(rand() * TILE)] : null;   // fallen cherry petals
    const pad = kind === 'lotus' && rand() < 0.4 ? [1 + Math.floor(rand() * 4), 1 + Math.floor(rand() * 5), rand() < 0.4] : null;   // a lily pad, maybe in flower
    for (let ly = 0; ly < TILE; ly++) for (let lx = 0; lx < TILE; lx++) {
      const x = tx * TILE + lx, y = ty * TILE + ly;
      let c = base;
      const onPad = pad && ly >= pad[1] && ly <= pad[1] + 1 && lx >= pad[0] && lx <= pad[0] + 2 && !(ly === pad[1] && lx === pad[0] + 2);
      if (onPad) {
        c = pad[2] && ly === pad[1] && lx === pad[0] + 1 ? lilyBloom : ly === pad[1] + 1 ? lilyShade : lily;
      } else if (kind === 'water' || kind === 'lava' || kind === 'pool' || kind === 'rift' || kind === 'lotus') {
        if (ripple(x, y)) c = light;
        flowing.push([x, y, base, light, kind === 'lava' ? -0.5 : kind === 'rift' ? 0.7 : kind === 'lotus' ? 0.5 : 1]);
      } else if (motif) {
        const m = motif[ly][lx];
        c = m === 'L' ? light : m === 'D' ? dark : m === 'G' ? moss : base;
        if (kind === 'ruins' && m === '.' && rand() < 0.07) c = moss;   // moss creeping over the paving
        if ((kind === 'crystal' || kind === 'geode') && m === 'L' && ly <= 1) sparks.push([x, y, light]);   // a crystal's tip, to twinkle
      } else if (petal && lx === petal[0] && ly === petal[1]) {
        c = terrain.sakura[1];
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

  for (const [kind, tx, ty] of grid.props) {
    PROPS[kind].forEach((row, ly) => [...row].forEach((m, lx) => {
      if (m === '.') return;
      const [x, y] = [tx * TILE + lx, ty * TILE + ly];
      put(x, y, abgr(PROP_INK[m]));
      if (m === 'Y') sparks.push([x, y, abgr(PROP_INK.Y)]);   // a lantern's flame flickers
    }));
  }

  const draw = () => ctx.putImageData(img, 0, 0);
  draw();

  // Water and lava drift, a pixel at a time, while the map is on screen.
  if (!flow) return;
  clearInterval(flowTimer);
  if (!flowing.length && !sparks.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let tick = 0;
  flowTimer = setInterval(() => {
    if (!canvas.isConnected) return clearInterval(flowTimer);
    if ($('map-screen').hidden) return;
    tick++;
    for (const [x, y, base, light, speed] of flowing) {
      put(x, y, ripple(x - Math.floor(tick * speed), y) ? light : base);
    }
    for (const [i, [x, y, light]] of sparks.entries()) put(x, y, (i * 7 + tick) % 23 === 0 ? white : light);
    draw();
  }, 220);
}

// Turning a tablet or resizing the window can change how many tiles fit across, so the map is drawn again.
let lastRender = null, resizeTimer = 0;
if (typeof addEventListener === 'function') addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!lastRender || $('map-screen').hidden) return;
    const before = GRID_W;
    fitGrid($('map'));
    if (GRID_W !== before) renderMap(...lastRender);
  }, 200);
});

/**
 * Draw the map into #map. onPick(node) is called when you click a reachable node.
 * biome is the biome id (it picks the terrain), trainer is your Pokémon's sprite url.
 */
export function renderMap(map, currentId, onPick, { biome = 'clearing', trainer, stage = 2, reveal = null, peek = null, ken = false } = {}) {
  // peek: a look-only copy drawn into another box (the Bag's map, from a battle or a reward), leaving the map screen's own alone
  // ken: Kenmatta has been beaten once, so the Move Tutor's ❓ room shows his face
  if (!peek) lastRender = [map, currentId, onPick, { biome, trainer, stage, reveal, ken }];
  const box = peek || $('map');
  box.replaceChildren(...box.querySelectorAll(':scope > .map-keep'));
  setRows(map.floors.length);
  fitGrid(box);
  box.style.setProperty('--grid-w', GRID_W);
  box.style.setProperty('--grid-h', GRID_H);
  spreadColumns(map);
  const reachable = new Set(reachableNodes(map, currentId).map(n => n.id));
  const lines = routeLines(map, currentId, reachable);

  const canvas = el('canvas', 'map-terrain');
  canvas.setAttribute('aria-hidden', 'true');
  paintTerrain(canvas, map, biome, routeTiles(lines), !peek);
  const routes = drawRoutes(lines);
  box.append(canvas, routes);
  if (!peek) {
    routesSvg = routes;
    trainerImg = null;
    walkFrom = currentId && map.byId[currentId];
  }

  for (const node of Object.values(map.byId)) {
    const info = NODE_INFO[node.type];
    const btn = el('button', `map-node type-${node.type}`);
    btn.type = 'button';
    if (BUILDINGS.includes(node.type)) {
      const house = el('span', 'map-building');
      house.innerHTML = buildingSvg(node.type);
      btn.append(house);
    } else btn.append(el('span', 'map-town', info.icon));
    place(btn, nodeX(node), rowY(node.floor));
    let label = info.label;
    if (ken && node.event?.id === 'move-tutor') {
      btn.querySelector('.map-town').replaceChildren(el('span', 'ken-face'));
      btn.classList.add('ken');
      label = 'Ken\'s dojo: the Move Tutor, Chad Master Kenmatta';
    }

    // Every fight is chosen ahead of time (so a refresh can't reroll it), but no room names its Pokémon (the user's call:
    // the tooltip gave elites and the boss away) unless the Silph Scope revealed it.
    if (node.enemyId && node.revealed) {
      const def = ENEMY_DEFS[node.enemyId];
      label = `${info.label}: ${node.type === 'elite' ? 'Alpha ' : ''}${def.name}`;   // no type badge: elites and bosses are all Normal (the user's call)
    }
    // a Safari rare spawn (markRares() in js/data/safari.js) shows as a sparkle over its room, like the games' shaking grass
    if (node.rare && !node.visited) {
      label = `${label}: a rare Pokémon was sighted! It runs off after a few turns.`;
      btn.classList.add('rare');
      btn.append(el('span', 'map-rare', '✦'));
    }
    btn.title = label;
    btn.setAttribute('aria-label', label);

    if (node.visited) btn.classList.add('visited');
    if (node.id === currentId) btn.classList.add('current');
    if (peek) {
      btn.classList.toggle('reachable', reachable.has(node.id));
      btn.disabled = true;
    } else if (reveal) {
      // picking a room for the Silph Scope: only unrevealed fight rooms you haven't been to light up
      const can = scopeable(node);
      btn.classList.toggle('scope-pick', can);
      btn.disabled = !can;
      if (can) btn.addEventListener('click', () => reveal(node));
    } else {
      const canGo = reachable.has(node.id);
      if (canGo) btn.classList.add('reachable');
      btn.disabled = !canGo;
      if (canGo) btn.addEventListener('click', () => walkTo(node, onPick));
    }
    box.append(btn);
    if (node.revealed && node.enemyId && !node.visited) box.append(revealedFigure(node));
  }

  // The biome's boss waits above its room as a grey silhouette, a hint of what's coming.
  const boss = map.boss.enemyId && ENEMY_DEFS[map.boss.enemyId];
  if (boss?.image) {
    const img = el('img', 'map-boss-shadow');
    img.src = boss.image;
    img.alt = '';
    place(img, CENTER_X, rowY(rows));
    box.append(img);
    if (!peek && reachable.has(map.boss.id)) preloadBoss(boss.spriteId);
  }

  if (trainer) {
    const here = currentId && map.byId[currentId];
    const img = el('img', here ? 'map-trainer' : 'map-trainer at-start');
    img.dataset.stage = String(stage);
    img.src = trainer;
    img.alt = '';
    place(img, (here ? nodeX(here) : CENTER_X), here ? rowY(here.floor) : START_ROW);
    box.append(img);
    if (!peek) trainerImg = img;
  }
}

/** A room the Silph Scope can reveal: a fight you haven't been to whose Pokémon isn't shown yet (the boss always is). */
export const scopeable = (node) => ['fight', 'elite'].includes(node.type) && node.enemyId && !node.visited && !node.revealed;

/* A revealed room's Pokémon stands above it in full colour (the boss's silhouette, coloured in), with its type's icon
   beside it for a wild one: elites are all Normal, so they show none (the user's call on the badges). */
function revealedFigure(node) {
  const def = ENEMY_DEFS[node.enemyId];
  const fig = el('span', 'map-revealed');
  const img = el('img', 'map-revealed-sprite');
  img.src = def.image;
  img.alt = '';
  fig.append(img);
  if (node.type === 'fight' && TYPES[def.type]) fig.append(el('span', `map-revealed-type type-${def.type}`, TYPES[def.type].icon));
  fig.title = `${node.type === 'elite' ? 'Alpha ' : ''}${def.name}${node.type === 'fight' ? ` (${TYPES[def.type].label} type)` : ''}`;
  place(fig, nodeX(node), rowY(node.floor));
  return fig;
}

function place(elem, x, y) {
  elem.style.left = `${((x + 0.5) / GRID_W) * 100}%`;
  elem.style.top = `${((y + 0.5) / GRID_H) * 100}%`;
}

/*
 * Tapping a reachable room walks your Pokémon there along its route a tile at a time, bobbing every other
 * step like the overworld walk, painting the road red behind it; the room opens once it
 * arrives, and taps are ignored meanwhile. Showdown front sprites face left, so it flips to walk right.
 */
const WALK_MS = [500, 850];    // one link's walk, from a short straight link to the long start road (the user's pace: 0.3-0.5 s zoomed past, 0.65-1.1 s dragged)
let walking = false, routesSvg = null, trainerImg = null, walkFrom = null;

function walkTo(node, onPick) {
  if (walking) return;
  const img = trainerImg;
  walking = true;
  const arrive = async () => {
    walking = false;
    onPick(node);
  };
  if (!img || matchMedia('(prefers-reduced-motion: reduce)').matches) return arrive();
  const points = linkPoints(walkFrom, node);
  const legs = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const length = legs.reduce((a, b) => a + b, 0);
  const hops = Math.max(1, Math.round(length / 2));
  const total = Math.min(WALK_MS[1], Math.max(WALK_MS[0], (tileSteps(points).length - 1) * 75));
  const dx = points.at(-1)[0] - points[0][0];
  img.classList.remove('at-start');
  img.classList.add('walking');
  if (dx) img.style.setProperty('--face', dx > 0 ? -1 : 1);
  const trail = routesSvg.path({ points: [] }, ROUTE.walked, 0.75);
  // Glides on `translate` from the start point (the GPU moves it), so the tile size is read once in px.
  const box = img.parentElement.getBoundingClientRect();
  const tw = box.width / GRID_W, th = box.height / GRID_H;
  const [x0, y0] = points[0];
  place(img, x0, y0);
  const at = (d) => {
    let i = 0;
    while (i < legs.length - 1 && d > legs[i]) d -= legs[i++];
    const k = legs[i] ? Math.min(1, d / legs[i]) : 1;
    const [[x1, y1], [x2, y2]] = [points[i], points[i + 1]];
    return { i, p: [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k] };
  };
  // mostly an even pace, eased a little into and out of the walk
  const ease = (t) => 0.7 * t + 0.3 * (0.5 - Math.cos(Math.PI * t) / 2);
  const start = performance.now();
  const frame = (now) => {
    const t = Math.min(1, (now - start) / total);
    const d = ease(t) * length;
    const { i, p } = at(d);
    const hop = Math.abs(Math.sin(Math.PI * hops * d / length)) * 0.35 * th;   // a little hop about every other tile, landing on arrival
    img.style.translate = `${(p[0] - x0) * tw}px ${(p[1] - y0) * th - hop}px`;
    trail.setAttribute('points', polyPoints([...points.slice(0, i + 1), p]));
    if (t < 1) return requestAnimationFrame(frame);
    place(img, ...points.at(-1));
    img.style.translate = '';
    setTimeout(arrive, 120);
  };
  requestAnimationFrame(frame);
}
