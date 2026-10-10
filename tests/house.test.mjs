import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOM_KINDS, BUILDABLE, shapeOf, pipTile, freshHouse, fitRoom, fitsOf, addRoom, doorsOf, openPips, houseRooms, joinPips, joinRooms, removeRoom } from '../js/data/house.js';

const overlaps = (h) => {
  const seen = new Set();
  for (const r of houseRooms(h)) for (const k of r.shape.tiles) {
    const [x, y] = k.split(',').map(Number), g = `${r.lv}:${x + r.gx},${y + r.gy}`;
    if (seen.has(g)) return g;
    seen.add(g);
  }
  return null;
};

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

test('the small main room has nowhere to build; the big one can take a door anywhere along its walls, and has none yet', () => {
  const h = freshHouse();
  assert.equal(openPips(h).length, 0);
  h.big = true;
  assert.ok(openPips(h).length > 30);
  assert.deepEqual(doorsOf(h, 'main').map(d => !!d.exit), [true]);
});

test('a built room joins only where it was built, and never overlaps another', () => {
  const h = freshHouse();
  h.big = true;
  const a = addRoom(h, 'main', 0, 'cross');
  const b = addRoom(h, 'main', 1, 'lroom');
  const c = addRoom(h, 'main', 2, 'hall');
  assert.ok(a && b && c);
  assert.equal(h.links.length, 3);
  assert.deepEqual(doorsOf(h, a).map(d => d.to), ['main']);
  assert.equal(overlaps(h), null);
});

test('a room can be turned: each fit is a different footprint', () => {
  const h = freshHouse();
  h.big = true;
  const fits = fitsOf(h, 'main', 1, 'lroom');
  assert.ok(fits.length >= 2);
  const id = addRoom(h, 'main', 1, 'lroom', fits[1].rot);
  assert.equal(h.rooms.find(r => r.id === id).rot, fits[1].rot);
});

test('nothing is built over the path to the front door, and there is no limit on rooms', () => {
  const h = freshHouse();
  h.big = true;
  for (let tries = 0; tries < 400; tries++) {
    const open = openPips(h).filter(p => p.lv === 0);
    if (!open.length) break;
    const p = open[(tries * 7) % open.length], kind = BUILDABLE.find(k => fitRoom(h, p.room, p.pip, k));
    if (kind) addRoom(h, p.room, p.pip, kind);
  }
  assert.ok(h.rooms.length > 12, `${h.rooms.length} rooms`);
  assert.equal(overlaps(h), null);
  const entry = houseRooms(h)[0];
  for (const r of houseRooms(h).slice(1)) for (const k of r.shape.tiles) {
    const [x, y] = k.split(',').map(Number);
    assert.ok(!(y + r.gy >= entry.shape.h && y + r.gy < entry.shape.h + 2 && Math.abs(x + r.gx - 7) <= 1), 'blocks the front path');
  }
});

test('upstairs: a room a floor up, reached by stairs from a back wall, its tiles free of the ground floor', () => {
  const h = freshHouse();
  h.big = true;
  const back = shapeOf('bigmain').pips.findIndex(p => p[0] === 'n' && p[1] === 3);
  assert.equal(fitRoom(h, 'main', 1, 'den', null, true), null, 'only from a back wall');
  const up = addRoom(h, 'main', back, 'great', null, true);
  assert.ok(up);
  assert.equal(houseRooms(h).find(r => r.id === up).lv, 1);
  assert.deepEqual(doorsOf(h, 'main').filter(d => d.stairs).map(d => d.stairs), ['up']);
  assert.deepEqual(doorsOf(h, up).map(d => d.stairs), ['down']);
  assert.equal(overlaps(h), null);
});

test('rooms side by side can be joined, and a room is only taken down when nothing hangs off it', () => {
  const h = freshHouse();
  h.big = true;
  const w = addRoom(h, 'main', 1, 'den');
  const far = addRoom(h, w, openPips(h).find(p => p.room === w && fitRoom(h, w, p.pip, 'closet')).pip, 'closet');
  assert.ok(far);
  assert.equal(removeRoom(h, w), false, 'the closet is only reached through the den');
  assert.equal(removeRoom(h, 'main'), false);
  assert.ok(removeRoom(h, far));
  assert.ok(removeRoom(h, w));
  assert.equal(h.rooms.length, 0);
  assert.equal(h.links.length, 0);
  // a hallway off the back, then a den off its side, which also meets the main room's back wall
  const hall = addRoom(h, 'main', 0, 'hall');
  const hp = openPips(h).find(p => p.room === hall && p.side === 'w' && fitRoom(h, hall, p.pip, 'great'));
  if (hp) addRoom(h, hall, hp.pip, 'great');
  for (const j of joinPips(h, 0)) {
    assert.ok(joinRooms(h, j.room, j.pip, j.to, j.toPip));
    assert.equal(joinRooms(h, j.room, j.pip, j.to, j.toPip), false);
    break;
  }
});
