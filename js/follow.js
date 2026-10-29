/* follow.js  -  you as a trainer, your buddy a step behind (2026-10-28, the user's ask: "choose a trainer so our buddy can
   follow us"), everywhere the buddy walks: the Clearing, the Secret Base, the mall, the towns, the Center, the Mart and
   the ? rooms. Each place still moves its `walker` and puts its buddy where the walker is; `lead()` then takes that spot
   for the trainer (so taps, the camera and the crowds go on reading the walker) and walks the buddy along the trainer's
   trail, a step behind. While the buddy acts there itself (a seat, a lunge at a choice, a soak), the two swap: the buddy
   keeps the spot and the trainer stands back on the trail. No look worn (`wornLook()`): no trainer, nothing changes. */

import { monBoard, drawMon } from './hd2d.js';
import { wornLook, lookSheet } from './data/looks.js';
import { getSave } from './storage.js';

// how far behind the buddy walks, in world units (about a tile); `?gap=N` tries another for a page load (2026-10-28:
// 0.85 sat the buddy on the trainer's heels once trainers were drawn smaller; the user asked for a tiny bit more)
const GAP = Number(new URLSearchParams(location.search).get('gap')) || 0.95;
const EASE = 90;        // ms: how quickly each board settles on where it should be
const STILL = 0.004;    // moved less than this in a frame: stood still
const JUMP = 2.5;       // the walker moved further than this in a frame: it was put somewhere new, not walked

/** A trainer for the place, or null when none is worn. `group`: where the buddy's group lives; `pitch`: the boards' lean (or a function for it);
    `dress(group)`: the place's own touch (a bend). */
export async function makeLead({ group, pitch, dress }) {
  const look = wornLook(getSave());
  if (!look) return null;
  const m = await monBoard({ sheet: lookSheet(look.id), name: look.name }, false);
  m.board.rotation.x = -(typeof pitch === 'function' ? pitch() : pitch);
  dress?.(m.group);
  group.add(m.group);
  const trail = [];
  const me = { x: 0, y: 0, z: 0 }, mate = { x: 0, y: 0, z: 0 };
  let started = false, dir = 'down', mateFacing = 'front', mateFlip = false;

  /** The point `gap` back along the trail from where you stand, or its oldest point. */
  function behind(from, gap) {
    let left = gap, prev = from;
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i], d = Math.hypot(p.x - prev.x, p.z - prev.z);
      if (d >= left) { const k = left / d; return { x: prev.x + (p.x - prev.x) * k, y: prev.y + (p.y - prev.y) * k, z: prev.z + (p.z - prev.z) * k }; }
      left -= d; prev = p;
    }
    return { ...prev };
  }

  const settle = (o, to, dt) => { const k = Math.min(1, dt / EASE); o.x += (to.x - o.x) * k; o.y += (to.y - o.y) * k; o.z += (to.z - o.z) * k; };

  /** The trainer drawn where `me` is now, facing where it walked from `mineWas`, and keeping that way when it stops. */
  function stride(mineWas, dt, visible) {
    const dx = me.x - mineWas.x, dz = me.z - mineWas.z, moving = Math.hypot(dx, dz) > STILL;
    if (moving) dir = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : (dz < 0 ? 'up' : 'down');
    m.group.position.set(me.x, me.y, me.z);
    m.group.visible = visible;
    drawMon(m, { dir, moving }, dt);
  }

  return {
    m, look: look.id,
    /** Call once the place has set the buddy's group where the walker stands (its bob on the board, not the group):
        the trainer takes it, the buddy goes a step back along the trail. `acting`: the buddy's doing something on that
        spot. Returns the pose to draw the buddy with: `{ facing, flip, sleeping, x, z }`. */
    lead(walker, mon, dt, acting = false) {
      const here = { x: mon.group.position.x, y: mon.group.position.y, z: mon.group.position.z };
      const was = trail[trail.length - 1];
      if (started && Math.hypot(here.x - was.x, here.z - was.z) > JUMP) { trail.length = 0; started = false; }   // a door, a warp
      if (!started) {   // you walk in first, your buddy just behind you, nearer the camera
        started = true;
        trail.push({ x: here.x, y: here.y, z: here.z + GAP });
        Object.assign(me, here); Object.assign(mate, trail[0]);
        dir = walker.facing === 'back' ? 'up' : 'down';
      }
      const last = trail[trail.length - 1];
      if (Math.hypot(here.x - last.x, here.z - last.z) > 0.05) {
        trail.push(here);
        if (trail.length > 40) trail.shift();
      }
      const mineWas = { ...me }, mateWas = { ...mate };
      if (acting) { settle(me, behind(here, GAP), dt); settle(mate, here, dt); }
      else {
        if (Math.hypot(me.x - here.x, me.z - here.z) < 0.25) Object.assign(me, here); else settle(me, here, dt);   // back from a swap
        settle(mate, behind(here, GAP), dt);
      }
      stride(mineWas, dt, mon.group.visible);
      const bx = mate.x - mateWas.x, bz = mate.z - mateWas.z;
      if (Math.hypot(bx, bz) > STILL) {
        if (Math.abs(bx) > 0.002) mateFlip = bx > 0;
        mateFacing = Math.abs(bz) > Math.abs(bx) && bz < 0 && mon.sheets.back ? 'back' : 'front';
      }
      mon.group.position.set(mate.x, mate.y, mate.z);
      return acting ? walker : { facing: mateFacing, flip: mateFlip, sleeping: walker.sleeping, x: mate.x, z: mate.z };   // x, z: an overworld sheet faces the way it moves
    },
    /** The trainer alone on `at` ({ x, y, z }), the buddy off on its own (the Secret Base, where it roams free). */
    solo(at, dt) {
      const mineWas = { ...me };
      if (!started || Math.hypot(at.x - me.x, at.z - me.z) > JUMP) { Object.assign(me, { x: at.x, y: at.y ?? 0, z: at.z }); mineWas.x = me.x; mineWas.z = me.z; }
      else settle(me, { x: at.x, y: at.y ?? 0, z: at.z }, dt);
      started = true;
      trail.length = 0;
      trail.push({ ...me });
      stride(mineWas, dt, true);
    },
    /** Back at the walker's spot, the trail forgotten (a new room, a jump across the map). */
    reset() { trail.length = 0; started = false; },
    dispose(free) { group.remove(m.group); free?.(m.group); },
  };
}

/** A place's trainer, kept to the look worn: built, swapped or dropped on the next frame after it changes (picked on the
    Trainer Card while you stand there, say). `opts` as makeLead()'s, plus `free(group)` (the place's dispose) and
    `fit(m)` (a place's own size cap). `lead()` draws as makeLead()'s does, or hands back the walker while there's none;
    `ready()` on each way in waits for it and starts its trail afresh. */
export function leadFor(opts) {
  let lead = null, loading = null;
  const sync = () => {
    const want = wornLook(getSave())?.id ?? null;
    if (loading || (lead?.look ?? null) === want) return;
    loading = (async () => {
      lead?.dispose(opts.free);
      lead = want ? await makeLead(opts) : null;
      if (lead) opts.fit?.(lead.m);
      loading = null;
    })();
  };
  return {
    get m() { return lead?.m ?? null; },
    async ready() { sync(); await loading; lead?.reset(); },
    lead(walker, mon, dt, acting) { sync(); return lead ? lead.lead(walker, mon, dt, acting) : walker; },
    solo(at, dt) { sync(); lead?.solo(at, dt); },
  };
}
