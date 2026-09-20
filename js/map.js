/* ============================================================
   map.js  -  the branching map of one biome.

   The map is a set of "floors". Each floor has a few nodes side by
   side. Each node connects to one or two nodes on the next floor, so
   you choose a path upward. The last floor leads to the boss.

       boss             👑
                      /    \
       floor 5       🏥    🏥
       ...
       floor 0     ⚔️  ⚔️  ⚔️     <- you start here

   generateMap() builds the data. renderMap() draws it.
   ============================================================ */

import { $, el } from './ui.js';

const FLOORS = 6;   // regular floors (the boss is one more on top)
const COLS = 5;     // how many columns the floors can use

export const NODE_INFO = {
  fight:    { icon: '⚔️', label: 'Wild fight' },
  elite:    { icon: '💀', label: 'Elite fight (harder, better rewards)' },
  rest:     { icon: '🏥', label: 'Pokémon Center (heal)' },
  treasure: { icon: '🎁', label: 'Treasure (choose a relic)' },
  boss:     { icon: '👑', label: 'Boss' },
};

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);

/** Build a random map. Returns { floors: [[node...]...], boss, byId }. */
export function generateMap() {
  const floors = [];

  // 1. Place the nodes on each floor.
  for (let f = 0; f < FLOORS; f++) {
    const count = f === 0 ? 3 : randInt(2, 4);
    const cols = shuffle([...Array(COLS).keys()]).slice(0, count).sort((a, b) => a - b);
    floors.push(cols.map(col => ({ id: `f${f}c${col}`, floor: f, col, type: 'fight', next: [], visited: false })));
  }
  const boss = { id: 'boss', floor: FLOORS, col: Math.floor(COLS / 2), type: 'boss', next: [], visited: false };

  // 2. Connect each floor to the next: every node links to nearby nodes above it.
  for (let f = 0; f < FLOORS - 1; f++) {
    for (const node of floors[f]) {
      const above = floors[f + 1];
      let options = above.filter(n => Math.abs(n.col - node.col) <= 1);
      if (options.length === 0) {
        const nearest = Math.min(...above.map(n => Math.abs(n.col - node.col)));
        options = above.filter(n => Math.abs(n.col - node.col) === nearest);
      }
      shuffle(options).slice(0, randInt(1, 2)).forEach(n => node.next.push(n.id));
    }
    // Make sure every node on the next floor can be reached from below.
    for (const target of floors[f + 1]) {
      if (floors[f].some(n => n.next.includes(target.id))) continue;
      const closest = [...floors[f]].sort((a, b) => Math.abs(a.col - target.col) - Math.abs(b.col - target.col))[0];
      closest.next.push(target.id);
    }
  }
  floors[FLOORS - 1].forEach(n => n.next.push(boss.id));

  // 3. Decide what each node is.
  assignTypes(floors);

  const byId = {};
  [...floors.flat(), boss].forEach(n => { byId[n.id] = n; });
  return { floors, boss, byId };
}

function assignTypes(floors) {
  const all = floors.flat();

  for (const node of all) {
    if (node.floor === 0) continue;                              // start with easy fights
    if (node.floor === FLOORS - 1) { node.type = 'rest'; continue; } // heal before the boss
    if (node.floor < 2) continue;                                // floor 1 is fights too

    const roll = Math.random() * 100;
    node.type = roll < 16 ? 'elite' : roll < 32 ? 'rest' : roll < 42 ? 'treasure' : 'fight';
  }

  // Never too many elites, but always at least one elite and one treasure.
  const middle = all.filter(n => n.floor >= 2 && n.floor < FLOORS - 1);
  const ofType = (t) => middle.filter(n => n.type === t);
  shuffle(ofType('elite')).slice(2).forEach(n => { n.type = 'fight'; });
  const convert = (to) => {
    const spot = shuffle(middle.filter(n => n.type === 'fight'))[0];
    if (spot) spot.type = to;
  };
  if (ofType('elite').length === 0) convert('elite');
  if (ofType('treasure').length === 0) convert('treasure');
}

/** Which nodes can you walk to right now? */
export function reachableNodes(map, currentId) {
  if (!currentId) return map.floors[0];
  return map.byId[currentId].next.map(id => map.byId[id]);
}

/* ---------- drawing ---------- */

const xOf = (col) => 10 + col * (80 / (COLS - 1));                 // % from the left
const yOf = (floor) => 93 - floor * (86 / FLOORS);                 // % from the top (floor 0 at the bottom)

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
      line.setAttribute('x1', `${xOf(node.col)}%`);
      line.setAttribute('y1', `${yOf(node.floor)}%`);
      line.setAttribute('x2', `${xOf(to.col)}%`);
      line.setAttribute('y2', `${yOf(to.floor)}%`);
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
    btn.style.left = `${xOf(node.col)}%`;
    btn.style.top = `${yOf(node.floor)}%`;
    btn.title = info.label;
    btn.setAttribute('aria-label', info.label);

    const canGo = reachable.has(node.id);
    if (node.visited) btn.classList.add('visited');
    if (node.id === currentId) btn.classList.add('current');
    if (canGo) btn.classList.add('reachable');
    btn.disabled = !canGo;
    if (canGo) btn.addEventListener('click', () => onPick(node));
    box.append(btn);
  }
}
