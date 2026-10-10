import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOM_KINDS, BUILDABLE, shapeOf, pipTile, freshHouse, fitRoom, addRoom, doorsOf, openPips, houseRooms, MAX_ROOMS } from '../js/data/house.js';

test('every pip opens from a floor tile on its own edge, at every turn', () => {
  for (const kind of Object.keys(ROOM_KINDS)) for (let rot = 0; rot < 4; rot++) {
    const s = shapeOf(kind, rot);
    for (const p of s.pips) {
      const t = pipTile(s, p);
      assert.ok(t, `${kind} rot ${rot} pip ${p}`);
      const out = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] }[p[0]];
      assert.ok(!s.tiles.has(`${t.x + out[0]},${t.y + out[1]}`), `${kind} rot ${rot} pip ${p} is on an edge`);
    }
  }
});

test('a room turned four times is itself again', () => {
  for (const kind of BUILDABLE) assert.deepEqual([...shapeOf(kind, 4).tiles].sort(), [...shapeOf(kind, 0).tiles].sort());
});

test('the small main room has no doors to build on; the big one has three', () => {
  const h = freshHouse();
  assert.equal(openPips(h).length, 0);
  h.big = true;
  assert.equal(openPips(h).length, 3);
});

test('a built room joins door to door and never overlaps another', () => {
  const h = freshHouse();
  h.big = true;
  const a = addRoom(h, 'main', 0, 'cross');
  const b = addRoom(h, 'main', 1, 'lroom');
  const c = addRoom(h, 'main', 2, 'hall');
  assert.ok(a && b && c);
  assert.ok(doorsOf(h, 'main').some(d => d.exit));
  assert.deepEqual(doorsOf(h, a).map(d => d.to), ['main']);
  const seen = new Set();
  for (const r of houseRooms(h)) for (const k of r.shape.tiles) {
    const [x, y] = k.split(',').map(Number), g = `${x + r.gx},${y + r.gy}`;
    assert.ok(!seen.has(g), `tile ${g} is in two rooms`);
    seen.add(g);
  }
});

test('nothing is built over the path to the front door, and the house stops at MAX_ROOMS', () => {
  const h = freshHouse();
  h.big = true;
  let n = 0;
  for (let tries = 0; tries < 200 && n < MAX_ROOMS + 3; tries++) {
    const open = openPips(h);
    if (!open.length) break;
    const p = open[tries % open.length], kind = BUILDABLE.find(k => fitRoom(h, p.room, p.pip, k));
    if (kind && addRoom(h, p.room, p.pip, kind)) n++;
  }
  assert.equal(h.rooms.length, Math.min(n, MAX_ROOMS));
  assert.ok(h.rooms.length <= MAX_ROOMS);
  const entry = houseRooms(h)[0];
  for (const r of houseRooms(h).slice(1)) for (const k of r.shape.tiles) {
    const [x, y] = k.split(',').map(Number);
    assert.ok(!(y + r.gy >= entry.shape.h && y + r.gy < entry.shape.h + 2 && Math.abs(x + r.gx - 7) <= 1), 'blocks the front path');
  }
});
