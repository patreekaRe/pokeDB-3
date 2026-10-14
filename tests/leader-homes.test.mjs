// The Gym Leaders' homes (js/leader-homes.js): every piece is in the catalogue, nothing stands on anything else, and
// you can walk from the door to the leader and round the room.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.location ??= { search: '', hostname: 'localhost', href: 'http://localhost/' };
const { PIECES } = await import('../js/base-furniture.js');
const { LEADER_HOMES, LEADER_SIZE } = await import('../js/leader-homes.js');
const { cols: COLS, rows: ROWS } = LEADER_SIZE;

/** The tiles each piece takes, as buildLeaderHome() blocks them. */
function layout(L) {
  const taken = new Map(), clash = [];
  const take = (x, y, who) => {
    const k = `${x},${y}`;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) clash.push(`${who} off the room at ${k}`);
    else if (taken.has(k)) clash.push(`${who} on ${taken.get(k)} at ${k}`);
    else taken.set(k, who);
  };
  for (const [id, x, y, o = {}] of L.furnish) {
    const p = PIECES[id];
    if (!p || p.layer === 'rug' || o.free) continue;
    const turned = Math.round((o.turn || 0) / (Math.PI / 2)) % 2 !== 0, w = turned ? p.h : p.w, h = turned ? p.w : p.h;
    for (let i = 0; i < w + (o.mid ? 1 : 0); i++) for (let j = 0; j < h; j++) take(x + i, y + j, id);
  }
  for (const [x, y, w, h] of L.blocks || []) for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) take(x + i, y + j, 'a prop');
  take(Math.floor(L.leaderAt.x), Math.floor(L.leaderAt.ty), 'the leader');
  return { taken, clash };
}

function reach(taken) {
  const door = `${(COLS - 1) / 2},${ROWS - 1}`, seen = new Set([door]), queue = [[(COLS - 1) / 2, ROWS - 1]];
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

for (const [id, L] of Object.entries(LEADER_HOMES)) {
  test(`${id}'s home: every piece and hanging is in the catalogue`, () => {
    for (const [pid] of L.furnish) assert.ok(PIECES[pid], `${pid} isn't a piece`);
    for (const [pid] of L.hang) { assert.ok(PIECES[pid], `${pid} isn't a piece`); assert.equal(PIECES[pid].layer, 'wall', `${pid} hangs on a wall`); }
  });
  test(`${id}'s home: nothing stands on anything else`, () => {
    assert.deepEqual(layout(L).clash, []);
  });
  test(`${id}'s home: the leader and every free tile are reachable from the door`, () => {
    const { taken } = layout(L), seen = reach(taken);
    assert.ok(!taken.has(`${(COLS - 1) / 2},${ROWS - 1}`), 'the doorway is clear');
    const lx = Math.floor(L.leaderAt.x), ly = Math.floor(L.leaderAt.ty);
    assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${lx + dx},${ly + dy}`)), 'you can walk up to the leader');
    const stuck = [];
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if (!taken.has(`${x},${y}`) && !seen.has(`${x},${y}`)) stuck.push(`${x},${y}`);
    assert.deepEqual(stuck, [], 'no walled-off pockets');
  });
}
