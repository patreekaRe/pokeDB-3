/* drag-walk.js  -  hold and drag to walk, in every 3D place you walk about (the user's ask, 2026-10-12; the Clearing had
   it first, js/hub-3d.js): while the finger is down your partner heads for the tile under it, and the click that ends a
   drag is swallowed so it doesn't walk again or open what it lifted over. Each place hands over who may drag (`can`),
   the tile under a pointer (`tile`, null off the floor), how to head there (`go`) and what to do once it ends (`done`). */

const SLOP = 12;   // px a press moves before it counts as a drag, not a tap

export function dragWalk({ can, tile, go, done, target = window }) {
  let d = null, until = 0;
  const down = (e) => {
    if ((e.button ?? 0) > 0 || !e.isPrimary || !can(e)) return;
    d = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, last: '' };
  };
  const move = (e) => {
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < SLOP) return;
      d.moved = true;
    }
    const t = tile(e);
    if (!t || `${t.x},${t.y}` === d.last) return;
    d.last = `${t.x},${t.y}`;
    go(t);
  };
  const up = (e) => {
    if (!d || e.pointerId !== d.id) return;
    if (d.moved) { until = performance.now() + 400; done?.(); }   // a drag that ends off the view sends no click to clear it
    d = null;
  };
  target.addEventListener('pointerdown', down, true);
  addEventListener('pointermove', move, true);
  addEventListener('pointerup', up, true);
  addEventListener('pointercancel', up, true);
  return {
    /** True for the click that ends a drag. */
    swallowed: () => performance.now() < until,
    dragging: () => !!d?.moved,
    off() {
      target.removeEventListener('pointerdown', down, true);
      removeEventListener('pointermove', move, true);
      removeEventListener('pointerup', up, true);
      removeEventListener('pointercancel', up, true);
    },
  };
}

/** A route that finishes the step already under way first, so a drag never snaps your partner back to its last tile. */
export const reroute = (walker, route, to) => {
  const next = walker.path[0];
  return next ? [next, ...route(next, to)] : route(walker.tile, to);
};
