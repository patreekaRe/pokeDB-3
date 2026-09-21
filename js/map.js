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
const FLOORS = 8;     // floors per biome (Slay the Spire uses 15: a much longer run)
const PATHS = 6;      // how many random paths are walked

// Chance (in %) of each room type on floors that are not fixed.
// (Slay the Spire also has events and shops. They aren't in this game yet,
//  so their share is added to plain fights. Add them here when they exist.)
const ROOM_ODDS = { fight: 72, elite: 16, rest: 12 };

// Where the special floors are, scaled to the number of floors
// (for 15 floors this gives: treasure on floor 9, no elites/rests below floor 6).
const TREASURE_FLOOR = Math.max(2, Math.round(FLOORS * 0.6) - 1);   // index, 0 = bottom
const MIN_ELITE_REST_FLOOR = Math.max(2, Math.round(FLOORS * 0.4) - 1);
const TOP_FLOOR = FLOORS - 1;                                         // always rest sites

export const NODE_INFO = {
  fight:    { icon: '⚔️', label: 'Wild fight' },
  elite:    { icon: '💀', label: 'Elite fight (harder, better rewards)' },
  rest:     { icon: '🏥', label: 'Pokémon Center (heal)' },
  treasure: { icon: '🎁', label: 'Treasure (choose a relic)' },
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

  // 2. A rest site can't sit right under the top floor of rest sites.
  if (type === 'rest' && room.floor === TOP_FLOOR - 1) return false;

  // 3. Elites and rest sites can't come twice in a row on the same path.
  if ((type === 'elite' || type === 'rest') && parents.some(p => p.type === type)) return false;

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
   DRAWING THE MAP
   ============================================================ */

const xOf = (node) => 8 + node.col * (84 / (COLS - 1)) + node.jx;            // % from the left
const yOf = (node) => 93 - node.floor * (86 / FLOORS) + node.jy;             // % from the top (floor 0 at the bottom)

/** Draw the map into #map. onPick(node) is called when you click a reachable node. */
export function renderMap(map, currentId, onPick) {
  const box = $('map');
  box.replaceChildren();

  // Lines first, so the nodes sit on top of them.
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'map-lines');
  const reachable = new Set(reachableNodes(map, currentId).map(n => n.id));

  for (const node of Object.values(map.byId)) {
    for (const nextId of node.next) {
      const to = map.byId[nextId];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', `${xOf(node)}%`);
      line.setAttribute('y1', `${yOf(node)}%`);
      line.setAttribute('x2', `${xOf(to)}%`);
      line.setAttribute('y2', `${yOf(to)}%`);
      const active = node.id === currentId && reachable.has(nextId);
      line.setAttribute('class', `map-line${node.visited && to.visited ? ' walked' : ''}${active ? ' active' : ''}`);
      svg.append(line);
    }
  }
  box.append(svg);

  for (const node of Object.values(map.byId)) {
    const info = NODE_INFO[node.type];
    const btn = el('button', `map-node type-${node.type}`, info.icon);
    btn.type = 'button';
    btn.style.left = `${xOf(node)}%`;
    btn.style.top = `${yOf(node)}%`;
    let label = info.label;

    // Elites and bosses are chosen ahead of time, so show who is waiting (scouting).
    if (node.enemyId) {
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
}
