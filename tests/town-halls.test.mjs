// The towns' great halls (js/town-halls.js): every piece is in the catalogue, nothing stands on anything else, every
// free tile is reachable from the door, and each hall has a spot for every Pokemon its town's data puts in it.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location ??= { search: '', hostname: 'localhost', href: 'http://localhost/' };
const { PIECES } = await import('../js/base-furniture.js');
const { HALLS, HALL_SIZE } = await import('../js/town-halls.js');
const { TOWNS } = await import('../js/data/towns.js');
const { cols: COLS, rows: ROWS } = HALL_SIZE;

function layout(H) {
  const taken = new Map(), clash = [];
  const take = (x, y, who) => {
    const k = `${x},${y}`;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) clash.push(`${who} off the room at ${k}`);
    else if (taken.has(k)) clash.push(`${who} on ${taken.get(k)} at ${k}`);
    else taken.set(k, who);
  };
  for (const [id, x, y, o = {}] of H.furnish) {
    const p = PIECES[id];
    if (!p || p.layer === 'rug' || o.free) continue;
    const turned = Math.round((o.turn || 0) / (Math.PI / 2)) % 2 !== 0, w = turned ? p.h : p.w, h = turned ? p.w : p.h;
    for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) take(x + i, y + j, id);
  }
  for (const [x, y, w, h] of H.blocks || []) for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) take(x + i, y + j, `a prop at ${x},${y}`);
  return { taken, clash };
}

function reach(taken) {
  const door = [(COLS - 1) / 2, ROWS - 1], seen = new Set([door.join(',')]), queue = [door];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || taken.has(k) || seen.has(k)) continue;
      seen.add(k); queue.push([nx, ny]);
    }
  }
  return seen;
}

for (const [id, H] of Object.entries(HALLS)) {
  test(`the ${id}: every piece and hanging is in the catalogue`, () => {
    for (const [pid] of H.furnish) assert.ok(PIECES[pid], `${pid} isn't a piece`);
    for (const [pid] of H.hang || []) { assert.ok(PIECES[pid], `${pid} isn't a piece`); assert.equal(PIECES[pid].layer, 'wall', `${pid} hangs on a wall`); }
  });
  test(`the ${id}: nothing stands on anything else`, () => {
    assert.deepEqual(layout(H).clash, []);
  });
  test(`the ${id}: every free tile is reachable from the door`, () => {
    const { taken } = layout(H), seen = reach(taken);
    assert.ok(!taken.has(`${(COLS - 1) / 2},${ROWS - 1}`), 'the doorway is clear');
    const stuck = [];
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (!taken.has(`${x},${y}`) && !seen.has(`${x},${y}`)) stuck.push(`${x},${y}`);
    assert.deepEqual(stuck, [], 'no walled-off pockets');
  });
  test(`the ${id}: it's a home in its town, with a spot for each of its Pokemon`, () => {
    const home = TOWNS[H.town]?.homes?.[id];
    assert.ok(home, `${H.town} has no home ${id}`);
    assert.ok(H.castAt.length >= Object.keys(home.cast || {}).length, 'a spot for each');
    for (const [x, ty] of H.castAt) assert.ok(x >= 0 && x < COLS && ty >= 0 && ty < ROWS, `${x},${ty} is in the room`);
  });
}
