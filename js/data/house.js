/* house.js  -  the Secret Base's house plan (House upgrades, 2026-10-10, the user's ask after World of Warcraft's housing
   blueprint): the main room, then rooms bought one at a time and joined door to door. Pure, so tests can run it.
   A room is a kind (its shape: rects of floor tiles, and pips, the spots on its edges a doorway can stand at), turned
   (`rot`, quarter turns clockwise) and placed on its floor's grid of tiles (`gx`, `gy`; the main room at 0, 0; `lv` the
   floor, 0 the ground, each one up a staircase from a back wall below). As many rooms as you like (the user's call).
   Each room is still walked as its own diorama (js/base-3d.js): a doorway between two takes you through to the other.
   The plan is the save's `secretBase.house`: { big, rooms: [{ id, kind, rot, gx, gy, lv }], links: [[a, pipA, b, pipB, 'up'?]] }:
   a link is a doorway, or with 'up' a staircase from `a`'s back wall up to `b`'s. */

export const BIG_PRICE = 500;    // PokéCoins: the main room made bigger, the first upgrade
export const ROOM_PRICE = 500;   // PokéCoins for each room added (the user's call, 2026-10-10)
export const DOOR_PRICE = 100;   // PokéCoins for a doorway between two rooms that already stand side by side

// rects are [x, y, w, h] in tiles; pips [side, along]: n / s at that column, w / e at that row. The authored pips come
// first (saved links name pips by their place in the list), then one on every other tile of every edge, so a doorway
// can go anywhere along a wall (the user's call: the big room's three fixed doors were too few and too fixed).
export const ROOM_KINDS = {
  main: { name: 'Main room', w: 11, h: 8, rects: [[0, 0, 11, 8]], pips: [] },
  bigmain: { name: 'Main room', w: 14, h: 10, rects: [[0, 0, 14, 10]], pips: [['n', 7], ['w', 5], ['e', 5]] },
  closet: { name: 'Closet', blurb: 'A snug little nook. Just right for storage or a reading corner.',
    w: 5, h: 4, rects: [[0, 0, 5, 4]], pips: [['s', 2]] },
  hall: { name: 'Hallway', blurb: 'A long, narrow hall, to reach more rooms.',
    w: 3, h: 8, rects: [[0, 0, 3, 8]], pips: [['s', 1], ['n', 1], ['w', 4], ['e', 4]] },
  bedroom: { name: 'Bedroom', blurb: 'A cosy room for a bed and a wardrobe.',
    w: 8, h: 7, rects: [[0, 0, 8, 7]], pips: [['s', 4], ['w', 3], ['e', 3]] },
  den: { name: 'Den', blurb: 'A roomy square den.',
    w: 10, h: 8, rects: [[0, 0, 10, 8]], pips: [['s', 5], ['n', 5], ['w', 4], ['e', 4]] },
  lroom: { name: 'L-shaped room', blurb: 'A room that turns a corner, with two nooks to fill.',
    w: 10, h: 9, rects: [[0, 0, 5, 9], [5, 4, 5, 5]], pips: [['s', 2], ['n', 2], ['s', 7], ['e', 6], ['w', 4]] },
  cross: { name: 'Cross-shaped room', blurb: 'Four wings round a middle.',
    w: 11, h: 11, rects: [[3, 0, 5, 11], [0, 3, 3, 5], [8, 3, 3, 5]], pips: [['s', 5], ['n', 5], ['w', 5], ['e', 5]] },
  great: { name: 'Great hall', blurb: 'As big as the main room made bigger. Room for everything.',
    w: 14, h: 10, rects: [[0, 0, 14, 10]], pips: [['s', 7], ['n', 7], ['w', 5], ['e', 5]] },
};
export const BUILDABLE = ['closet', 'hall', 'bedroom', 'den', 'lroom', 'cross', 'great'];

for (const [id, k] of Object.entries(ROOM_KINDS)) {
  if (id === 'main') continue;
  const have = new Set(k.pips.map(p => p.join()));
  for (const [side, n] of [['n', k.w], ['s', k.w], ['w', k.h], ['e', k.h]]) {
    for (let i = 1; i < n - 1; i++) if (!have.has(`${side},${i}`)) k.pips.push([side, i]);
  }
}

const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
const STEP = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const TURN = { n: 'e', e: 's', s: 'w', w: 'n' };

const shapes = new Map();
/** A kind turned `rot` quarter turns clockwise: its size, rects and pips, and the set of its floor tiles ("x,y"). */
export function shapeOf(kind, rot = 0) {
  const key = `${kind},${rot % 4}`;
  if (shapes.has(key)) return shapes.get(key);
  let { w, h, rects, pips } = ROOM_KINDS[kind];
  for (let r = 0; r < rot % 4; r++) {
    // a tile (x, y) of a w x h shape turns to (h - 1 - y, x) of an h x w one
    rects = rects.map(([x, y, rw, rh]) => [h - y - rh, x, rh, rw]);
    pips = pips.map(([side, at]) => [TURN[side], side === 'e' || side === 'w' ? h - 1 - at : at]);
    [w, h] = [h, w];
  }
  const tiles = new Set();
  for (const [x, y, rw, rh] of rects) for (let i = 0; i < rw; i++) for (let j = 0; j < rh; j++) tiles.add(`${x + i},${y + j}`);
  const s = { w, h, rects, pips, tiles };
  shapes.set(key, s);
  return s;
}

/** The floor tile a pip opens from, in the shape's own tiles: the edge tile of its row or column. */
export function pipTile(shape, [side, at]) {
  const on = (x, y) => shape.tiles.has(`${x},${y}`);
  if (side === 'n') { for (let y = 0; y < shape.h; y++) if (on(at, y)) return { x: at, y }; }
  if (side === 's') { for (let y = shape.h - 1; y >= 0; y--) if (on(at, y)) return { x: at, y }; }
  if (side === 'w') { for (let x = 0; x < shape.w; x++) if (on(x, at)) return { x, y: at }; }
  if (side === 'e') { for (let x = shape.w - 1; x >= 0; x--) if (on(x, at)) return { x, y: at }; }
  return null;
}

export const freshHouse = () => ({ big: false, rooms: [], links: [] });
const plan = (house) => house || freshHouse();

/** Every room of the house, the main one first, each with its shape and floor (`lv`). */
export function houseRooms(house) {
  const h = plan(house);
  return [{ id: 'main', kind: h.big ? 'bigmain' : 'main', rot: 0, gx: 0, gy: 0 }, ...h.rooms]
    .map(r => ({ ...r, lv: r.lv || 0, shape: shapeOf(r.kind, r.rot) }));
}
export const roomById = (house, id) => houseRooms(house).find(r => r.id === id);
export const roomName = (house, id) => ROOM_KINDS[roomById(house, id)?.kind]?.name ?? 'Room';
/** A floor's name: 1F for the ground, 2F up the stairs... */
export const floorName = (lv) => `${(lv || 0) + 1}F`;
export const topFloor = (house) => Math.max(0, ...houseRooms(house).map(r => r.lv));

/** The main room's front door, out to the Clearing: the middle of its front edge. */
export const entryOf = (house) => { const m = roomById(house, 'main'); return { side: 's', at: Math.floor(m.shape.w / 2) }; };

const globalTiles = (r) => [...r.shape.tiles].map(k => { const [x, y] = k.split(',').map(Number); return `${x + r.gx},${y + r.gy}`; });

// the path up to the front door is kept clear: three tiles across, two down, under the entry
function entryTiles(house) {
  const m = roomById(house, 'main'), e = entryOf(house), out = [];
  for (let i = -1; i <= 1; i++) for (let j = 0; j < 2; j++) out.push(`${e.at + i},${m.shape.h + j}`);
  return out;
}

/** Every tile a floor's rooms stand on (and on the ground, the path to the front door). */
export function takenOn(house, lv) {
  return new Set([...houseRooms(house).filter(r => r.lv === lv).flatMap(globalTiles), ...(lv ? [] : entryTiles(house))]);
}

export const linkOf = (house, id, pip) => plan(house).links.find(([a, pa, b, pb]) => (a === id && pa === pip) || (b === id && pb === pip));

/** A room's doorways: each joined pip, with the room and pip it leads to (`stairs` 'up' or 'down' for a staircase), and
    for the main room its front door (`exit`). */
export function doorsOf(house, id) {
  const r = roomById(house, id), out = [];
  r.shape.pips.forEach(([side, at], i) => {
    const l = linkOf(house, id, i);
    if (!l) return;
    const [a, pa, b, pb, up] = l, mine = a === id && pa === i;
    out.push({ side, at, pip: i, to: mine ? b : a, toPip: mine ? pb : pa, ...(up ? { stairs: mine ? 'up' : 'down' } : {}) });
  });
  if (id === 'main') out.push({ ...entryOf(house), exit: true });
  return out;
}

/** The pips a room could be built onto: not yet joined, on rooms that can have doors (the main room once it's big). */
export function openPips(house) {
  return houseRooms(house).flatMap(r => r.shape.pips.map((p, i) => ({ room: r.id, pip: i, side: p[0], at: p[1], lv: r.lv })))
    .filter(p => !linkOf(house, p.room, p.pip));
}

/** Where a room of `kind` would stand if built onto pip `pip` of room `id`, turned `rot` (or the first turn that fits
    when null): its pip on the facing side nearest that side's middle that reaches back through the doorway without
    overlapping another room or the path to the front door, or null. `up` builds it a floor higher instead, its own back
    wall's staircase coming down onto the tile of `id`'s back-wall pip. `taken` may be handed in (takenOn()) to save
    working it out again. */
export function fitRoom(house, id, pip, kind, rot = null, up = false, taken = null) {
  const h = plan(house), from = roomById(h, id), p = from.shape.pips[pip], [side] = p;
  if (up && side !== 'n') return null;
  const ft = pipTile(from.shape, p), [dx, dy] = up ? [0, 0] : STEP[side];
  const out = { x: from.gx + ft.x + dx, y: from.gy + ft.y + dy }, lv = from.lv + (up ? 1 : 0), want = up ? 'n' : OPP[side];
  taken ||= takenOn(h, lv);
  for (const r of rot == null ? [0, 1, 2, 3] : [rot]) {
    const s = shapeOf(kind, r), mid = ((want === 'n' || want === 's') ? s.w : s.h) / 2 - 0.5;
    const qs = s.pips.map((pp, q) => [pp, q]).filter(([pp]) => pp[0] === want).sort((a, b) => Math.abs(a[0][1] - mid) - Math.abs(b[0][1] - mid));
    for (const [pp, q] of qs) {
      const t = pipTile(s, pp), gx = out.x - t.x, gy = out.y - t.y;
      if ([...s.tiles].every(k => { const [x, y] = k.split(',').map(Number); return !taken.has(`${x + gx},${y + gy}`); })) return { kind, rot: r, gx, gy, pip: q, lv };
    }
  }
  return null;
}

/** Every different way a room of `kind` fits at that pip, one per turn (turns that give the same footprint once). */
export function fitsOf(house, id, pip, kind, up = false, taken = null) {
  taken ||= takenOn(plan(house), roomById(house, id).lv + (up ? 1 : 0));
  const seen = new Set(), out = [];
  for (let r = 0; r < 4; r++) {
    const f = fitRoom(house, id, pip, kind, r, up, taken);
    if (!f) continue;
    const key = [...shapeOf(kind, r).tiles].map(k => { const [x, y] = k.split(',').map(Number); return `${x + f.gx},${y + f.gy}`; }).sort().join(' ');
    if (!seen.has(key)) { seen.add(key); out.push(f); }
  }
  return out;
}

/** Build a room onto a pip, turned `rot` (the first that fits when null), or a floor up with `up`: it joins there and
    nowhere else, more doorways being the player's to add (joinRooms()). Returns its id, or null if it doesn't fit.
    Mutates the plan. */
export function addRoom(house, id, pip, kind, rot = null, up = false) {
  const at = fitRoom(house, id, pip, kind, rot, up);
  if (!at) return null;
  const nid = `r${1 + Math.max(0, ...house.rooms.map(r => +r.id.slice(1) || 0))}`;
  house.rooms.push({ id: nid, kind, rot: at.rot, gx: at.gx, gy: at.gy, ...(at.lv ? { lv: at.lv } : {}) });
  house.links.push([id, pip, nid, at.pip, ...(up ? ['up'] : [])]);
  return nid;
}

/** The doorways that could be opened between rooms already standing wall to wall on floor `lv`: an open pip of one
    whose tile beyond is an open pip of the other, facing it. Each pair once. */
export function joinPips(house, lv = 0) {
  const rooms = houseRooms(house).filter(r => r.lv === lv), at = new Map();
  for (const r of rooms) r.shape.pips.forEach((p, i) => {
    if (linkOf(house, r.id, i)) return;
    const t = pipTile(r.shape, p);
    at.set(`${p[0]},${r.gx + t.x},${r.gy + t.y}`, { room: r.id, pip: i });
  });
  const out = [];
  for (const [key, a] of at) {
    const [side, x, y] = key.split(','), [dx, dy] = STEP[side];
    const b = at.get(`${OPP[side]},${+x + dx},${+y + dy}`);
    if (b && b.room !== a.room && a.room < b.room) out.push({ room: a.room, pip: a.pip, to: b.room, toPip: b.pip, side, x: +x, y: +y });
  }
  return out;
}

/** Open a doorway between two neighbouring rooms (one of joinPips()). Mutates the plan. */
export function joinRooms(house, a, pa, b, pb) {
  if (linkOf(house, a, pa) || linkOf(house, b, pb)) return false;
  house.links.push([a, pa, b, pb]);
  return true;
}

/** Take a room down: false for the main room, or when another room is only reached through it. Mutates the plan. */
export function removeRoom(house, id) {
  if (id === 'main' || !house.rooms.some(r => r.id === id)) return false;
  const links = house.links.filter(l => l[0] !== id && l[2] !== id), left = house.rooms.filter(r => r.id !== id);
  const reached = new Set(['main']);
  for (let grew = true; grew;) {
    grew = false;
    for (const [a, , b] of links) {
      if (reached.has(a) !== reached.has(b)) { reached.add(a); reached.add(b); grew = true; }
    }
  }
  if (left.some(r => !reached.has(r.id))) return false;
  house.rooms = left;
  house.links = links;
  return true;
}

/** The pips of a room that a doorway now stands at, in its own tiles: what furniture must keep clear of. */
export function doorTiles(house, id) {
  const r = roomById(house, id);
  return doorsOf(house, id).filter(d => !d.exit).map(d => ({ ...d, tile: pipTile(r.shape, [d.side, d.at]) }));
}
