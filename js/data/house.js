/* house.js  -  the Secret Base's house plan (House upgrades, 2026-10-10, the user's ask after World of Warcraft's housing
   blueprint): the main room, then rooms bought one at a time and joined door to door. Pure, so tests can run it.
   A room is a kind (its shape: rects of floor tiles, and pips, the doorways on its edges a room can be joined at),
   turned (`rot`, quarter turns clockwise) and placed on the house's grid of tiles (`gx`, `gy`; the main room at 0, 0).
   Each room is still walked as its own diorama (js/base-3d.js): a doorway between two takes you through to the other.
   The plan is the save's `secretBase.house`: { big, rooms: [{ id, kind, rot, gx, gy }], links: [[a, pipA, b, pipB]] }. */

export const BIG_PRICE = 500;    // PokéCoins: the main room made bigger, the first upgrade, which opens its doors
export const ROOM_PRICE = 500;   // PokéCoins for each room added (the user's call, 2026-10-10)
export const MAX_ROOMS = 8;      // rooms added, beside the main one

// rects are [x, y, w, h] in tiles; pips [side, along]: n / s at that column, w / e at that row
export const ROOM_KINDS = {
  main: { name: 'Main room', w: 11, h: 8, rects: [[0, 0, 11, 8]], pips: [] },
  bigmain: { name: 'Main room', w: 14, h: 10, rects: [[0, 0, 14, 10]], pips: [['n', 7], ['w', 5], ['e', 5]] },
  closet: { name: 'Closet', blurb: 'A snug little nook with one door. Just right for storage or a reading corner.',
    w: 5, h: 4, rects: [[0, 0, 5, 4]], pips: [['s', 2]] },
  hall: { name: 'Hallway', blurb: 'A long, narrow hall with a door at each end and each side, to reach more rooms.',
    w: 3, h: 8, rects: [[0, 0, 3, 8]], pips: [['s', 1], ['n', 1], ['w', 4], ['e', 4]] },
  bedroom: { name: 'Bedroom', blurb: 'A cosy room for a bed and a wardrobe, with doors on three sides.',
    w: 8, h: 7, rects: [[0, 0, 8, 7]], pips: [['s', 4], ['w', 3], ['e', 3]] },
  den: { name: 'Den', blurb: 'A roomy square den with a door on every side.',
    w: 10, h: 8, rects: [[0, 0, 10, 8]], pips: [['s', 5], ['n', 5], ['w', 4], ['e', 4]] },
  lroom: { name: 'L-shaped room', blurb: 'A room that turns a corner, with two nooks to fill.',
    w: 10, h: 9, rects: [[0, 0, 5, 9], [5, 4, 5, 5]], pips: [['s', 2], ['n', 2], ['s', 7], ['e', 6], ['w', 4]] },
  cross: { name: 'Cross-shaped room', blurb: 'Four wings round a middle, a door at the end of each.',
    w: 11, h: 11, rects: [[3, 0, 5, 11], [0, 3, 3, 5], [8, 3, 3, 5]], pips: [['s', 5], ['n', 5], ['w', 5], ['e', 5]] },
  great: { name: 'Great hall', blurb: 'As big as the main room made bigger. Room for everything.',
    w: 14, h: 10, rects: [[0, 0, 14, 10]], pips: [['s', 7], ['n', 7], ['w', 5], ['e', 5]] },
};
export const BUILDABLE = ['closet', 'hall', 'bedroom', 'den', 'lroom', 'cross', 'great'];

const OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
const STEP = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const TURN = { n: 'e', e: 's', s: 'w', w: 'n' };

/** A kind turned `rot` quarter turns clockwise: its size, rects and pips, and the set of its floor tiles ("x,y"). */
export function shapeOf(kind, rot = 0) {
  let { w, h, rects, pips } = ROOM_KINDS[kind];
  for (let r = 0; r < rot % 4; r++) {
    // a tile (x, y) of a w x h shape turns to (h - 1 - y, x) of an h x w one
    rects = rects.map(([x, y, rw, rh]) => [h - y - rh, x, rh, rw]);
    pips = pips.map(([side, at]) => [TURN[side], side === 'e' || side === 'w' ? h - 1 - at : at]);
    [w, h] = [h, w];
  }
  const tiles = new Set();
  for (const [x, y, rw, rh] of rects) for (let i = 0; i < rw; i++) for (let j = 0; j < rh; j++) tiles.add(`${x + i},${y + j}`);
  return { w, h, rects, pips, tiles };
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

/** Every room of the house, the main one first, each with its shape. */
export function houseRooms(house) {
  const h = plan(house);
  return [{ id: 'main', kind: h.big ? 'bigmain' : 'main', rot: 0, gx: 0, gy: 0 }, ...h.rooms]
    .map(r => ({ ...r, shape: shapeOf(r.kind, r.rot) }));
}
export const roomById = (house, id) => houseRooms(house).find(r => r.id === id);
export const roomName = (house, id) => ROOM_KINDS[roomById(house, id)?.kind]?.name ?? 'Room';

/** The main room's front door, out to the Clearing: the middle of its front edge. */
export const entryOf = (house) => { const m = roomById(house, 'main'); return { side: 's', at: Math.floor(m.shape.w / 2) }; };

const globalTiles = (r) => [...r.shape.tiles].map(k => { const [x, y] = k.split(',').map(Number); return `${x + r.gx},${y + r.gy}`; });

// the path up to the front door is kept clear: three tiles across, two down, under the entry
function entryTiles(house) {
  const m = roomById(house, 'main'), e = entryOf(house), out = [];
  for (let i = -1; i <= 1; i++) for (let j = 0; j < 2; j++) out.push(`${e.at + i},${m.shape.h + j}`);
  return out;
}

export const linkOf = (house, id, pip) => plan(house).links.find(([a, pa, b, pb]) => (a === id && pa === pip) || (b === id && pb === pip));

/** A room's doorways: each joined pip, with the room and pip it leads to, and for the main room its front door (`exit`). */
export function doorsOf(house, id) {
  const r = roomById(house, id), out = [];
  r.shape.pips.forEach(([side, at], i) => {
    const l = linkOf(house, id, i);
    if (!l) return;
    const [a, pa, b, pb] = l, mine = a === id && pa === i;
    out.push({ side, at, pip: i, to: mine ? b : a, toPip: mine ? pb : pa });
  });
  if (id === 'main') out.push({ ...entryOf(house), exit: true });
  return out;
}

/** The pips a room could be built onto: not yet joined, on rooms that can have doors (the main room once it's big). */
export function openPips(house) {
  return houseRooms(house).flatMap(r => r.shape.pips.map((p, i) => ({ room: r.id, pip: i, side: p[0], at: p[1] })))
    .filter(p => !linkOf(house, p.room, p.pip));
}

/** Where a room of `kind` would stand if built onto pip `pip` of room `id`: the first turn and pip of it that reaches
    back through that doorway without overlapping another room or the path to the front door, or null. */
export function fitRoom(house, id, pip, kind) {
  const h = plan(house), from = roomById(h, id), [side] = from.shape.pips[pip];
  const ft = pipTile(from.shape, from.shape.pips[pip]), [dx, dy] = STEP[side];
  const out = { x: from.gx + ft.x + dx, y: from.gy + ft.y + dy };
  const taken = new Set([...houseRooms(h).flatMap(globalTiles), ...entryTiles(h)]);
  for (let rot = 0; rot < 4; rot++) {
    const s = shapeOf(kind, rot);
    for (let q = 0; q < s.pips.length; q++) {
      if (s.pips[q][0] !== OPP[side]) continue;
      const t = pipTile(s, s.pips[q]), gx = out.x - t.x, gy = out.y - t.y;
      if ([...s.tiles].every(k => { const [x, y] = k.split(',').map(Number); return !taken.has(`${x + gx},${y + gy}`); })) return { kind, rot, gx, gy, pip: q };
    }
  }
  return null;
}

/** Build a room onto a pip: it joins there, and any of its other pips that meet an open pip of a neighbour, door to door,
    join too. Returns the new room's id, or null if it doesn't fit or the house is full. Mutates the plan. */
export function addRoom(house, id, pip, kind) {
  if (house.rooms.length >= MAX_ROOMS) return null;
  const at = fitRoom(house, id, pip, kind);
  if (!at) return null;
  const nid = `r${1 + Math.max(0, ...house.rooms.map(r => +r.id.slice(1) || 0))}`;
  house.rooms.push({ id: nid, kind, rot: at.rot, gx: at.gx, gy: at.gy });
  house.links.push([id, pip, nid, at.pip]);
  const mine = roomById(house, nid);
  const gpip = (r, i) => { const t = pipTile(r.shape, r.shape.pips[i]); return { x: r.gx + t.x, y: r.gy + t.y, side: r.shape.pips[i][0] }; };
  mine.shape.pips.forEach((_, i) => {
    if (linkOf(house, nid, i)) return;
    const a = gpip(mine, i), [dx, dy] = STEP[a.side];
    for (const o of openPips(house)) {
      if (o.room === nid) continue;
      const b = gpip(roomById(house, o.room), o.pip);
      if (b.side === OPP[a.side] && b.x === a.x + dx && b.y === a.y + dy) { house.links.push([nid, i, o.room, o.pip]); break; }
    }
  });
  return nid;
}

/** The pips of a room that a doorway now stands at, in its own tiles: what furniture must keep clear of. */
export function doorTiles(house, id) {
  const r = roomById(house, id);
  return doorsOf(house, id).filter(d => !d.exit).map(d => ({ ...d, tile: pipTile(r.shape, [d.side, d.at]) }));
}
