/* pinball-kit.js  -  the shared engine under the arcade's pinball tables (2026-10-17, the user's ask: four more tables
   after the rebuilt Pokémon Pinball, each completely different, same look). Pokémon Pinball (js/arcade-pinball.js)
   keeps its own engine; these are its parts made general: any number of flippers (◀ works every left one), the
   plunger lane with its swinging gauge, slingshots, ramps a ball rides over the playfield (`ride`), saucers that hold a
   ball (`hold`), multiball, a ball saver, extra balls, a dot-matrix strip on top, each drained ball's bonus count, a
   camera that scrolls a table taller than the screen, and a ball search that nudges a ball sat still for 3 seconds.
   A table is a definition (`T`, see openTable) and make(t), which returns its hooks: what its own parts do to a
   ball each substep, its lamps, its words on the display. Still parts are painted once (`T.art` via the kit's
   `stamp()`). makeTable() runs without the cabinet, so tools/pinball-sim.mjs can play a table headless with a bot. */

import { runArcade, drawMon, banner, stamp } from './arcade-kit.js';
import { calmFx } from './prefs.js';

export const R = 8, TAU = Math.PI * 2;
export { drawMon, banner, stamp };

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Pushes ball `b` out of the segment, bouncing it; the contact's normal and how hard it came in, or null. */
export function hitSeg(b, x1, y1, x2, y2, bounce = 0.45, r = R) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  const t = clamp(((b.x - x1) * dx + (b.y - y1) * dy) / len2, 0, 1);
  const px = x1 + dx * t, py = y1 + dy * t, nx = b.x - px, ny = b.y - py, d = Math.hypot(nx, ny);
  if (d >= r || d === 0) return null;
  const ux = nx / d, uy = ny / d;
  b.x = px + ux * r; b.y = py + uy * r;
  const vn = b.vx * ux + b.vy * uy;
  if (vn < 0) { b.vx -= (1 + bounce) * vn * ux; b.vy -= (1 + bounce) * vn * uy; }
  return { ux, uy, vn };
}
/** Which side of the segment the ball's centre is on (>0 above a left-to-right line). */
export const side = (b, [x1, y1, x2, y2]) => (x2 - x1) * (b.y - y1) - (y2 - y1) * (b.x - x1);
/** A round post or pop bumper `r` round at (x, y): pushes the ball out, reflects it and kicks it `kick` harder. True on a hit. */
export function bump(b, x, y, r, kick = 300, bounce = 1) {
  const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy);
  if (d >= R + r || d === 0) return false;
  const ux = dx / d, uy = dy / d, vn = b.vx * ux + b.vy * uy;
  b.x = x + ux * (R + r); b.y = y + uy * (R + r);
  if (vn < 0) { b.vx -= (1 + bounce) * vn * ux; b.vy -= (1 + bounce) * vn * uy; }
  b.vx += ux * kick; b.vy += uy * kick;
  return true;
}
/** Segments round an ellipse's arc from angle a0 to a1, `n` of them. */
export function arc(cx, cy, rx, ry, a0, a1, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * i / n, b = a0 + (a1 - a0) * (i + 1) / n;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, cx + Math.cos(b) * rx, cy + Math.sin(b) * ry]);
  }
  return out;
}
/** A path of points as wall segments. */
export const chain = (pts) => pts.slice(1).map((p, i) => [...pts[i], ...p]);

/** A flipper is a tapered capsule turning about its pivot: the ball meets its surface moving at ω × r, so a hit near
    the tip flies harder than one by the pivot, as on a real table. `w` is its turn rate this substep. */
export function hitFlipper(b, f, ang, w) {
  const dx = Math.cos(ang) * f.len, dy = Math.sin(ang) * f.len;
  const t = clamp(((b.x - f.x) * dx + (b.y - f.y) * dy) / (f.len * f.len), 0, 1);
  const px = f.x + dx * t, py = f.y + dy * t, rr = R + 6 - 2.5 * t;
  let nx = b.x - px, ny = b.y - py;
  const d = Math.hypot(nx, ny);
  if (d >= rr || d === 0) return false;
  nx /= d; ny /= d;
  b.x = px + nx * rr; b.y = py + ny * rr;
  const sx = -w * (py - f.y), sy = w * (px - f.x), rvx = b.vx - sx, rvy = b.vy - sy, vn = rvx * nx + rvy * ny;
  if (vn < 0) {
    b.vx -= 1.35 * vn * nx; b.vy -= 1.35 * vn * ny;
    const vt = rvx * -ny + rvy * nx;
    b.vx -= vt * 0.04 * -ny; b.vy -= vt * 0.04 * nx;
  }
  return true;
}

/* ---- painting helpers for a table's art ---- */
export function lampInsert(g, x, y, r, colour) {
  g.fillStyle = 'rgba(0, 0, 0, 0.45)'; g.beginPath(); g.arc(x, y, r + 1.5, 0, TAU); g.fill();
  g.fillStyle = colour; g.globalAlpha = 0.28; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.globalAlpha = 1;
  g.strokeStyle = 'rgba(255, 255, 255, 0.25)'; g.lineWidth = 0.8; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
}
export function arrowPath(g, x, y, s, a) {
  const c = Math.cos(a), si = Math.sin(a), p = (u, v) => [x + u * c - v * si, y + u * si + v * c];
  g.beginPath(); g.moveTo(...p(s, 0)); g.lineTo(...p(-s * 0.6, s * 0.8)); g.lineTo(...p(-s * 0.2, 0)); g.lineTo(...p(-s * 0.6, -s * 0.8)); g.closePath();
}
export function arrowInsert(g, x, y, s, a, colour) {
  g.fillStyle = 'rgba(0, 0, 0, 0.45)'; arrowPath(g, x, y, s + 1.5, a); g.fill();
  g.fillStyle = colour; g.globalAlpha = 0.28; arrowPath(g, x, y, s, a); g.fill(); g.globalAlpha = 1;
}
export function label(g, text, x, y, size, colour, a = 0) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.font = `800 ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = size / 4; g.strokeStyle = 'rgba(0, 0, 0, 0.7)'; g.strokeText(text, 0, 0);
  g.fillStyle = colour; g.fillText(text, 0, 0);
  g.restore();
}
/** Pseudo-random from a seed, so painted stars and bubbles sit in the same places every time. */
export const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** The walls as chrome rails (`rail` a gold or coloured inner line, or none). */
export function rails(g, walls, tone = ['#22182e', '#aab4c8', '#ffffff']) {
  g.lineCap = 'round';
  for (const [w, c] of [[6, tone[0]], [3.5, tone[1]], [1.2, tone[2]]]) {
    g.lineWidth = w; g.strokeStyle = c;
    for (const s of walls) { g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke(); }
  }
}
/** Slingshots: coloured plastic, a white rubber along the kicking face. */
export function slingArt(g, slings, colour = '#c81e30', edge = '#4a0610') {
  for (const { a, b, c } of slings) {
    g.fillStyle = colour; g.strokeStyle = edge; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#f4f4f4'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke();
  }
}
/** A one-way wire gate. */
export function gateArt(g, [x1, y1, x2, y2]) {
  g.strokeStyle = '#d0d8e8'; g.lineWidth = 2; g.setLineDash([4, 2]);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x1, y1, 2.2, 0, TAU); g.fill();
}
/** A ramp's clear plastic along `pts`, tinted `tint` ([light, body] rgba strings). */
export function rampArt(g, pts, tint = ['rgba(200, 240, 255, 0.55)', 'rgba(70, 150, 230, 0.55)']) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  const line = () => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); };
  line(); g.strokeStyle = 'rgba(0, 0, 0, 0.25)'; g.lineWidth = 26; g.stroke();
  line(); g.strokeStyle = tint[0]; g.lineWidth = 23; g.stroke();
  line(); g.strokeStyle = tint[1]; g.lineWidth = 19; g.stroke();
  line(); g.strokeStyle = 'rgba(255, 255, 255, 0.35)'; g.lineWidth = 1.2; g.setLineDash([6, 6]); g.stroke(); g.setLineDash([]);
}

/** The dot-matrix display's dots, painted once and laid over the scaled-up text. */
function dotGrid(g) {
  g.fillStyle = '#05030a';
  for (let x = 0; x <= 280; x += 2) g.fillRect(x - 0.35, 0, 0.7, 30);
  for (let y = 0; y <= 30; y += 2) g.fillRect(0, y - 0.35, 280, 0.7);
}

const STD_BALL = (g) => {
  g.fillStyle = '#e83040'; g.beginPath(); g.arc(0, 0, R, Math.PI, 0); g.fill();
  g.fillStyle = '#f4f4f8'; g.beginPath(); g.arc(0, 0, R, 0, Math.PI); g.fill();
  g.fillStyle = '#202028'; g.fillRect(-R, -1.1, R * 2, 2.2);
  g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.fill();
};
const ballArts = new Map();
/** The table's ball, painted once a scale by `paint(g)` round 0, 0 (its outline added here). */
function ballArt(key, paint, s) {
  const k = `${key}@${s}`;
  if (ballArts.has(k)) return ballArts.get(k);
  const c = document.createElement('canvas'), px = Math.ceil((R + 1) * 2 * s);
  c.width = c.height = px;
  const g = c.getContext('2d');
  g.scale(s, s); g.translate(R + 1, R + 1);
  g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip(); paint(g); g.restore();
  g.strokeStyle = '#202028'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, R - 0.4, 0, TAU); g.stroke();
  ballArts.set(k, c);
  return c;
}

const LANE = { x: 278, y: 486, top: 140, wall: 268, gate: [288, 146, 262, 172] };
const FLIP = { edge: '#4a0610', face: '#f4f4f8', rubber: '#e83040', pivot: '#ffd84a' };

/** The table's engine and its hooks, without the cabinet. `T`:
    W, H the screen; `worldH` a taller table the camera scrolls (default H); `grav`, `maxV`, `drag` (speed lost a second,
    0..1); `balls` (3); `saver` seconds for each ball's saver ([8, 6, 4]); `lane` the plunger lane ({ x, y, top, wall,
    gate }, the right side by default); `flippers` [{ s: 'l'|'r', x, y, len, rest, up }]; `walls` segments; `slings`
    [{ s, a, b, c }]; `ball` (key, paint(g)) the ball's look; `flip` the flippers' colours; `art(g)` the still table,
    W x worldH; `dmd` the display's colour; and make(t) -> hooks:
    ball(b, h, py) each substep for each ball after the walls and flippers; tick(dt, now); under(g, now) lamps and parts
    under the balls; over(g, now) over them (ramps' plastic); screen(g, now) in screen space under the display;
    dmd(now) the display's idle text; bonus() a drained ball's base bonus; newBall(); launch(power); press(s, on);
    lost() a ball gone (multiball's end is `t.multiEnd`); grav() to change gravity. */
export function makeTable(T, api) {
  const W = T.W, H = T.H, WH = T.worldH || H, lane = { ...LANE, ...T.lane }, calm = api.calm ?? calmFx();
  const GRAV = T.grav ?? 600, MAXV = T.maxV ?? 1150, BALLS = T.balls ?? 3, SAVER = T.saver ?? [8, 6, 4];
  const flips = T.flippers.map(f => ({ ...f, ang: f.rest, w: 0 }));
  const sling = T.slings || [], slit = sling.map(() => 0);
  const dmd = { text: null, cv: typeof document !== 'undefined' ? Object.assign(document.createElement('canvas'), { width: 140, height: 15 }) : null };
  const flip = { l: false, r: false }, held = { l: 0, r: 0 };
  const rides = [], holds = [], parts = [];
  let cam = Math.max(0, WH - H), msg = '', msgT = 0, big = null, flash = 0, shake = 0, tally = null;

  const t = {
    api, W, H, WH, lane, calm, R,
    field: [], ball: 1, left: BALLS, mult: 1, multi: false, launched: false, save: 0, over: false, phase: 0, wait: 0,
    stats: {},
    add: (n) => api.add(n),
    sound: (...s) => api.sound(...s),
    stat(k, n = 1) { t.stats[k] = (t.stats[k] || 0) + n; },
    say(text, s = 2.2) { msg = text; msgT = s; },
    shout(text, colour = '#ffd84a') { big = { text, colour, t: 1.6 }; },
    boom(x, y, colour, n = 14, f = 1) {
      if (calm) n = Math.ceil(n / 3);
      for (let i = 0; i < n && parts.length < 160; i++) { const a = Math.random() * TAU, v = 60 + Math.random() * 160; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.5 + Math.random() * 0.4, c: colour }); }
      if (!calm) { flash = Math.max(flash, 0.35 * f); shake = Math.max(shake, 3 * f); }
    },
    flipping: (s) => flip[s],
    flippers: flips,
    blink: (now, rate = 160) => Math.floor(now / rate) % 2 === 0,
    glow(g, x, y, r, c, a = 1) { g.globalAlpha = a; g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.globalAlpha = 1; },
    /** A ball in the plunger lane, fired up it at once (multiball's new balls, a saved ball). */
    addBall(vy = -(1000 + Math.random() * 100)) { t.field.push({ x: lane.x, y: lane.y, vx: 0, vy, lane: true, spin: 0 }); },
    /** A ball set down anywhere on the table. */
    spawn(x, y, vx = 0, vy = 0, spin = 0) { const b = { x, y, vx, vy, lane: false, spin }; t.field.push(b); return b; },
    /** Takes `b` off the table onto a ramp along `pts` at `speed`; done(b) gets it back at the ramp's end. */
    ride(b, pts, speed, done) {
      b.gone = true;
      const len = pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
      rides.push({ pts, len, d: 0, speed, spin: b.spin, done });
      api.sound('fx-whoosh', 'select');
    },
    /** Sinks `b` into a hole at (x, y) for `secs`; done() puts a ball back (usually by t.spawn). */
    hold(b, x, y, secs, done) { b.gone = true; holds.push({ x, y, t: secs, full: secs, done }); },
    inPlay: () => t.field.filter(b => !b.gone).length + rides.length + holds.length + (hooks.held?.() || 0),
    waiting: () => t.field.find(b => b.lane && b.y >= lane.y - 0.5 && Math.abs(b.vy) < 1),
    power: () => 0.5 - 0.5 * Math.cos(t.phase),
    extraBall(why) { t.left++; t.shout('EXTRA BALL!', '#80ff90'); api.sound('heal', 'stat-up'); if (why) api.say(why); },
    startMulti(n = 1, why) {
      t.multi = true; t.save = Math.max(t.save, 8);
      for (let i = 0; i < n; i++) t.addBall(-(1040 + Math.random() * 80));
      if (why) api.say(why);
    },
    cam: () => cam,
  };
  const hooks = T.make(t);

  const launchBall = (power) => {
    const b = t.waiting();
    if (!b) return;
    b.vy = -(640 + 540 * power) * (T.launch ?? 1); b.vx = 0;
    api.sound('fx-whoosh', 'select');
    if (!t.launched) { t.launched = true; if (!t.save) t.save = SAVER[Math.min(SAVER.length - 1, t.ball - 1)]; }
    t.wait = 0;
    hooks.launch?.(power);
  };
  const press = (s, on) => {
    if (on && !flip[s]) { api.sound('fx-click', 'select'); hooks.press?.(s, true); }
    flip[s] = on;
  };
  const newBall = () => {
    t.field = [{ x: lane.x, y: lane.y, vx: 0, vy: 0, lane: true, spin: 0 }];
    t.launched = false; t.save = 0; t.mult = 1; t.multi = false; tally = null; t.phase = 0; t.wait = 0;
    hooks.newBall?.();
    t.say(`BALL ${t.ball}`, 1.6);
  };
  const drained = () => {
    api.sound('cancel');
    hooks.drained?.();
    const base = hooks.bonus?.() || 0;
    tally = { base, mult: t.mult, total: base * t.mult, t: 0 };
    api.say(`Ball ${t.ball} drained. Bonus ${base.toLocaleString()} × ${t.mult}.`);
  };
  const lost = () => {
    if (t.save > 0) {
      t.addBall();
      t.shout('BALL SAVED', '#80ff90'); api.sound('heal', 'confirm'); api.say('Ball saved! It\'s back in the lane.');
      return;
    }
    hooks.lost?.();
    if (t.inPlay() > 0) { if (t.inPlay() === 1 && t.multi) { t.multi = false; hooks.multiEnd?.(); t.say('MULTIBALL OVER', 1.8); } return; }
    drained();
  };

  const step = (h) => {
    const grav = hooks.grav?.() ?? GRAV;
    for (const f of flips) {
      const want = flip[f.s] ? f.up : f.rest, was = f.ang;
      f.ang += Math.sign(want - f.ang) * Math.min(Math.abs(want - f.ang), h * (flip[f.s] ? 26 : 14));
      f.w = (f.ang - was) / h;
    }
    const drag = T.drag ? Math.exp(-T.drag * h) : 1;
    for (const b of t.field) {
      if (b.gone) continue;
      const py = b.y;
      b.vy += grav * h; b.vx *= drag; b.vy *= drag;
      b.x += b.vx * h; b.y += b.vy * h;
      b.spin += b.vx * h / R;
      if (b.lane) {
        if (b.y < lane.top) b.lane = false;
        if (b.y > lane.y) { b.y = lane.y; b.vy = 0; b.vx = 0; b.x = lane.x; }
      } else if (side(b, lane.gate) > 0) hitSeg(b, ...lane.gate, 0.3);
      else if (b.x > lane.wall && b.y > lane.top) b.lane = true;
      for (const w of T.walls) hitSeg(b, ...w);
      sling.forEach((sl, i) => {
        const c = hitSeg(b, ...sl.a, ...sl.b, 0.4);
        if (c && c.vn < -40 && !slit[i]) {
          b.vx += c.ux * 360; b.vy += c.uy * 360; slit[i] = 0.12;
          api.add(10); api.sound('fx-pop', 'plink-1'); hooks.sling?.(sl);
        }
      });
      for (const f of flips) hitFlipper(b, f, f.ang, f.w);
      hooks.ball?.(b, h, py);
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > MAXV) { b.vx *= MAXV / sp; b.vy *= MAXV / sp; }
      // the ball search: a ball sat still away from the lane (wedged on a post) gets a nudge
      if (!b.lane && sp < 12) { b.still = (b.still || 0) + h; if (b.still > 3) { b.vx = (Math.random() - 0.5) * 300; b.vy = -260; b.still = 0; t.stat('nudged'); } }
      else b.still = 0;
    }
    const live = t.field.filter(b => !b.gone);
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {   // multiball: balls knock each other
      const a = live[i], b = live[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= R * 2 || d === 0) continue;
      const ux = dx / d, uy = dy / d, o = (R * 2 - d) / 2;
      a.x -= ux * o; a.y -= uy * o; b.x += ux * o; b.y += uy * o;
      const rel = (a.vx - b.vx) * ux + (a.vy - b.vy) * uy;
      if (rel > 0) { a.vx -= rel * ux; a.vy -= rel * uy; b.vx += rel * ux; b.vy += rel * uy; }
    }
    for (let i = t.field.length - 1; i >= 0; i--) {
      const b = t.field[i];
      if (b.gone) { t.field.splice(i, 1); continue; }
      if (b.y > WH + 24 || b.x < -40 || b.x > W + 40 || b.y < -200) { t.field.splice(i, 1); if (b.y <= WH + 24) t.stat('escaped'); lost(); }
    }
  };

  const tick = (dt, now) => {
    if (t.over) return;
    if (tally) {
      tally.t += dt;
      if (tally.t >= 2.2) {
        api.add(tally.total);
        t.left--; t.ball++;
        if (t.left <= 0) { t.over = true; tally = null; return api.over(hooks.overLine?.() || 'Last ball down!'); }
        newBall();
      }
      return;
    }
    const w = t.waiting();
    if (w) { t.phase += dt * TAU * 0.85; t.wait += dt; if (t.wait > 8) launchBall(0.45 + Math.random() * 0.3); }
    const fast = t.field.reduce((m, b) => Math.max(m, Math.hypot(b.vx, b.vy)), 0);
    const n = clamp(Math.ceil(fast * dt / 2.5), 6, 18);
    for (let i = 0; i < n; i++) step(dt / n);
    for (let i = rides.length - 1; i >= 0; i--) {
      const r = rides[i];
      r.d += dt * r.speed; r.spin -= dt * 18;
      if (r.d >= r.len) {
        rides.splice(i, 1);
        const [x1, y1] = r.pts[r.pts.length - 2], [x2, y2] = r.pts[r.pts.length - 1], l = Math.hypot(x2 - x1, y2 - y1) || 1;
        const v = Math.min(r.speed, 420), b = t.spawn(x2, y2, (x2 - x1) / l * v, (y2 - y1) / l * v, r.spin);
        r.done?.(b);
      }
    }
    for (let i = holds.length - 1; i >= 0; i--) if ((holds[i].t -= dt) <= 0) { const h = holds.splice(i, 1)[0]; h.done(); api.sound('fx-pop', 'plink-1'); }
    if (t.save > 0 && t.launched) t.save = Math.max(0, t.save - dt);
    slit.forEach((v, i) => { slit[i] = Math.max(0, v - dt); });
    hooks.tick?.(dt, now);
    msgT = Math.max(0, msgT - dt); flash = Math.max(0, flash - dt * 2.2); shake = Math.max(0, shake - dt * 14);
    if (big && (big.t -= dt) <= 0) big = null;
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if ((p.t -= dt) <= 0) parts.splice(i, 1); }
    if (WH > H) {   // the camera keeps the lowest ball (the one nearest the drain) in the lower half
      const live = t.field.filter(b => !b.gone), low = live.length ? Math.max(...live.map(b => b.y)) : WH;
      const want = clamp(low - H * 0.58, 0, WH - H);
      cam += (want - cam) * Math.min(1, dt * (want > cam ? 9 : 5));
    }
  };

  const ride = (r) => {
    let d = r.d;
    for (let i = 1; i < r.pts.length; i++) {
      const [x1, y1] = r.pts[i - 1], [x2, y2] = r.pts[i], l = Math.hypot(x2 - x1, y2 - y1);
      if (d <= l) return [x1 + (x2 - x1) * d / l, y1 + (y2 - y1) * d / l];
      d -= l;
    }
    return r.pts[r.pts.length - 1];
  };
  const dmdText = (now) => {
    if (tally) return `BONUS ${tally.total.toLocaleString()}`;
    if (msgT > 0) return msg;
    if (t.waiting() && !t.launched) return `BALL ${t.ball} · LAUNCH!`;
    return hooks.dmd?.(now) || `BALL ${t.ball}`;
  };
  const drawDmd = (g, now) => {
    const text = dmdText(now);
    if (text !== dmd.text) {
      dmd.text = text;
      const x = dmd.cv.getContext('2d');
      x.clearRect(0, 0, 140, 15);
      x.font = 'bold 11px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = T.dmd || '#ff9a2a';
      const w = x.measureText(text).width;
      if (w > 136) { x.save(); x.scale(136 / w, 1); x.fillText(text, 70 * w / 136, 8); x.restore(); } else x.fillText(text, 70, 8);
    }
    g.fillStyle = '#05030a'; g.fillRect(6, 2, W - 12, 34);
    g.strokeStyle = T.bezel || '#ffd84a'; g.lineWidth = 1.5; g.strokeRect(7, 3, W - 14, 32);
    g.fillStyle = '#1a0a02'; g.fillRect(10, 4, 280, 30);
    const smooth = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    g.drawImage(dmd.cv, 10, 4, 280, 30);
    g.imageSmoothingEnabled = smooth;
    stamp(g, 'pin-dots', 10, 4, 280, 30, dotGrid);
  };
  const fl = { ...FLIP, ...T.flip };
  newBall();

  const game = {
    t, step, hooks,
    tick,
    plunge() { launchBall(t.power()); },
    press,
    down(x) {
      const s = x < W / 2 ? 'l' : 'r';
      held[s]++; press(s, true);
      if (s === 'r' && t.waiting()) launchBall(t.power());
    },
    up(x) {
      const s = held.l && held.r ? (x < W / 2 ? 'l' : 'r') : held.l ? 'l' : 'r';
      held[s] = Math.max(0, held[s] - 1);
      if (!held[s]) press(s, false);
    },
    key(k, down) {
      if (k === 'left' || k === 'right') press(k[0], down);
      else if (k === 'down') { if (down) launchBall(t.power()); }
      else if (k === 'act') { if (down && t.waiting()) launchBall(t.power()); else { press('l', down); press('r', down); } }
    },
    draw(g, now) {
      const sc = g.getTransform().a;
      g.save();
      if (shake && !calm) g.translate(Math.round((Math.random() - 0.5) * shake * 2), Math.round((Math.random() - 0.5) * shake * 2));
      const cy = Math.round(cam * sc) / sc;
      g.translate(0, -cy);
      stamp(g, `pin-${T.id}`, 0, 0, W, WH, T.art);
      hooks.under?.(g, now);
      sling.forEach((sl, i) => { if (slit[i]) { g.strokeStyle = '#fff070'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(...sl.a); g.lineTo(...sl.b); g.stroke(); } });
      for (const f of flips) {
        const a = f.ang, ex = f.x + Math.cos(a) * f.len, ey = f.y + Math.sin(a) * f.len, nx = -Math.sin(a), ny = Math.cos(a);
        g.fillStyle = fl.edge;
        g.beginPath(); g.arc(f.x, f.y, 7.5, a + Math.PI / 2, a - Math.PI / 2); g.lineTo(ex + nx * -4.5, ey + ny * -4.5); g.arc(ex, ey, 4.5, a - Math.PI / 2, a + Math.PI / 2); g.closePath(); g.fill();
        g.fillStyle = fl.face;
        g.beginPath(); g.arc(f.x, f.y, 6, a + Math.PI / 2, a - Math.PI / 2); g.lineTo(ex + nx * -3.2, ey + ny * -3.2); g.arc(ex, ey, 3.2, a - Math.PI / 2, a + Math.PI / 2); g.closePath(); g.fill();
        g.strokeStyle = fl.rubber; g.lineWidth = 2; g.beginPath(); g.moveTo(f.x + nx * 3, f.y + ny * 3); g.lineTo(ex + nx * 1.5, ey + ny * 1.5); g.stroke();
        g.fillStyle = fl.pivot; g.beginPath(); g.arc(f.x, f.y, 2.2, 0, TAU); g.fill();
      }
      // the plunger, drawn back by the gauge while a ball waits on it
      const pw = t.waiting() ? t.power() : 0, top = lane.y + R + pw * 18, lx = lane.x - 6;
      g.strokeStyle = '#8a8a9a'; g.lineWidth = 1.2; g.beginPath();
      for (let i = 0; i <= 10; i++) g.lineTo(lx + (i % 2) * 12, top + 4 + i * (WH - top - 4) / 10);
      g.stroke();
      g.fillStyle = '#d8d8e4'; g.fillRect(lx + 2, top, 8, 4); g.fillStyle = fl.rubber; g.fillRect(lx + 1, top - 1, 10, 2);
      if (t.waiting()) {
        g.fillStyle = 'rgba(0, 0, 0, 0.6)'; g.fillRect(W - 9, lane.y - 106, 6, 100);
        g.fillStyle = pw > 0.8 ? '#ff5050' : pw > 0.45 ? '#ffd84a' : '#80ff90'; g.fillRect(W - 9, lane.y - 6 - 100 * pw, 6, 100 * pw);
      }
      const bimg = ballArt(T.ball?.key || 'poke', T.ball?.paint || STD_BALL, sc);
      const drawBall = (x, y, spin, k = 1) => {
        g.save(); g.translate(x, y); g.rotate(spin); g.scale(k, k);
        g.drawImage(bimg, -R - 1, -R - 1, bimg.width / sc, bimg.height / sc);
        g.restore();
        g.fillStyle = 'rgba(255, 255, 255, 0.85)'; g.beginPath(); g.arc(x - R * 0.35 * k, y - R * 0.4 * k, 1.8 * k, 0, TAU); g.fill();
      };
      t.drawBall = drawBall;
      for (const h of holds) drawBall(h.x, h.y, 0, 0.6 + 0.4 * clamp((h.t - h.full + 0.3) / 0.3, 0, 1));
      for (const b of t.field) drawBall(b.x, b.y, b.spin);
      hooks.over?.(g, now);
      for (const r of rides) { const [x, y] = ride(r); g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.arc(x + 3, y + 4, R, 0, TAU); g.fill(); drawBall(x, y, r.spin, 1.12); }
      for (const p of parts) { g.globalAlpha = Math.min(1, p.t * 2); g.fillStyle = p.c; g.fillRect(p.x - 1.2, p.y - 1.2, 2.4, 2.4); }
      g.globalAlpha = 1;
      g.restore();
      hooks.screen?.(g, now);
      drawDmd(g, now);
      if (big) {
        const k = Math.min(1, big.t / 0.4), pop = 1 + Math.max(0, big.t - 1.3) * 1.2;
        g.globalAlpha = k; banner(g, big.text, W / 2, 200, 22 * pop, big.colour, W * 0.86); g.globalAlpha = 1;
      }
      if (tally) {
        g.fillStyle = 'rgba(5, 3, 15, 0.72)'; g.fillRect(30, 170, 240, 120);
        g.strokeStyle = T.bezel || '#ffd84a'; g.lineWidth = 2; g.strokeRect(30, 170, 240, 120);
        const k = Math.min(1, tally.t / 1.2);
        banner(g, `BALL ${t.ball} BONUS`, W / 2, 192, 16, T.bezel || '#ffd84a');
        banner(g, Math.round(tally.base * k).toLocaleString(), W / 2, 222, 20, '#ffffff');
        if (tally.t > 1.2) banner(g, `× ${tally.mult}`, W / 2, 246, 16, '#ffb050');
        if (tally.t > 1.6) banner(g, `= ${tally.total.toLocaleString()}`, W / 2, 272, 18, '#80ff90');
      }
      if (t.waiting() && !t.launched && !tally && t.blink(now, 400)) banner(g, 'LAUNCH ▶', W - 78, H - 68, 12, T.bezel || '#ffd84a');
      if (flash && !calm) { g.fillStyle = `rgba(255, 255, 255, ${flash * 0.5})`; g.fillRect(0, 0, W, H); }
    },
  };
  return game;
}

/** Opens table `T` in the arcade cabinet: `id`, `title`, `colour`, `intro`, `go`, `help`, `sounds` as runArcade takes them. */
export const openTable = (T, onClose) => runArcade({
  id: T.id, title: T.title, colour: T.colour, W: T.W, H: T.H, intro: T.intro, go: T.go, help: T.help,
  keys: { left: [['◀', 'left']], right: [['▶', 'right']] },
  pad: [['LAUNCH', 'plunge']],
  sounds: ['fx-click', 'fx-pop', 'fx-ding', 'fx-whoosh', 'fx-bloop', 'fx-tick', 'heal', ...(T.sounds || [])],
  make: (api) => makeTable(T, api),
}, onClose);
