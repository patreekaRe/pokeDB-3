/* ground-beats.js  -  set paths for whoever walks about the Clearing's ground (the user's ask, 2026-10-28: "keep them on
   individual set paths like on the Pokemon games", and no two ever on one tile). Each walker paces its own beat, a fixed
   run of tiles out and back, and never steps onto a tile someone else stands on or is stepping to: it waits at its
   tile's middle until that one is clear, and turns back if it stays blocked. Used by js/corner-crowd.js (the Clearing's
   townspeople), js/hub-spooky.js (the Halloween ghosts) and js/hub-buddies.js (friends' buddies). */

export const same = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y;

/** Whether `t` is within a tile of any tile in `tiles` (kept a tile apart, so neighbours' sprites don't overlap). */
export const nearAny = (t, tiles) => tiles.some(o => Math.abs(o.x - t.x) <= 1 && Math.abs(o.y - t.y) <= 1);

/** A short beat from `home`: [home, ...] two or three tiles to a free end, every tile `ok`, or null. */
export function paceFrom(home, route, ok, rnd = Math.random) {
  const ends = [[2, 0], [-2, 0], [0, 2], [0, -2], [3, 0], [-3, 0], [2, 1], [-2, -1]].map(d => [rnd(), d]).sort((a, b) => a[0] - b[0]);
  for (const [, [dx, dy]] of ends) {
    const to = { x: home.x + dx, y: home.y + dy }, path = route(home, to);
    if (path.length >= 2 && path.length <= 4 && same(path.at(-1), to) && path.every(ok)) return [home, ...path];
  }
  return null;
}

/** The tiles from `tile` along `beat` to its end (`toEnd`) or back to its start, `tile` itself left out. */
export function beatPath(beat, tile, toEnd) {
  const i = beat.findIndex(t => same(t, tile));
  if (i < 0) return [];
  return toEnd ? beat.slice(i + 1) : beat.slice(0, i).reverse();
}

/** Which way to head from `tile` on `beat`: on to the far end from either end, else back the way it came. */
export const headTo = (beat, tile, wasToEnd) => same(tile, beat[0]) ? true : same(tile, beat.at(-1)) ? false : !wasToEnd;

/** One frame along `w.path` at `speed` tiles a second, never onto a tile `busy(t)` says is someone's: it claims the next
    tile (`w.claim`) as it sets off for it and lets go on arriving. 'blocked' (waiting, `w.waited` ms so far), 'moving' or
    'arrived'. Sets `w.dir` and `w.flip` the way it faces. */
export function stepBeat(w, dt, speed, tileX, tileZ, busy) {
  const next = w.path[0];
  if (!next) { w.blocked = false; return 'arrived'; }
  const tx = tileX(next.x), tz = tileZ(next.y), dx = tx - w.x, dz = tz - w.z, d = Math.hypot(dx, dz);
  if (d > 0.001) { w.dir = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : (dz < 0 ? 'up' : 'down'); if (Math.abs(dx) > 0.01) w.flip = dx > 0; }
  if (!same(w.claim, next)) {
    if (busy(next)) { w.waited = (w.waited ?? 0) + dt; w.blocked = true; return 'blocked'; }
    w.claim = { ...next };
  }
  w.waited = 0; w.blocked = false;
  const move = dt / 1000 * speed;
  w.hop += dt;
  if (d <= move) { w.x = tx; w.z = tz; w.tile = { ...next }; w.path.shift(); w.claim = null; return w.path.length ? 'moving' : 'arrived'; }
  w.x += dx / d * move; w.z += dz / d * move;
  return 'moving';
}

/** Whether any of `list` (each with a `w`) other than `but` stands on `t` or is stepping onto it. */
export const holdsTile = (list, t, but) => list.some(o => o !== but && (same(o.w.tile, t) || same(o.w.claim, t)));
