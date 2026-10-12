/* arcade-bowling.js  -  Geodude Bowling, a home arcade game (js/arcade-kit.js): ten Geodude stand at the end of a lane
   in perspective; swipe up to roll a Poké Ball. Where the swipe starts places the ball, its direction aims, its speed
   sets the power and a bend at its end puts hook on it. Ball and pins knock each other about in lane space (units of one
   lane width). Ten frames of real bowling, strikes and spares, on a scorecard up top. */

import { runArcade, banner, rand } from './arcade-kit.js';

const W = 300, H = 380, HEAD = 4, END = 5.15, BR = 0.105, PR = 0.057, LAY = 0.085, BALL_Z = 0.25;
const PK = 985, PD = 4.28, HZ = -194, PC = 2310;
const sx = (x, z) => W / 2 + x * PK / (z + PD), sy = (z) => HZ + PC / (z + PD), sc = (z) => PK / (z + PD);
const RACK = [[0, 0], [-0.5, 1], [0.5, 1], [-1, 2], [0, 2], [1, 2], [-1.5, 3], [-0.5, 3], [0.5, 3], [1.5, 3]].map(([c, r]) => [c * 0.29, HEAD + r * 0.251]);

function card(rolls) {
  const out = [], sym = (n) => (n ? String(n) : '-');
  let i = 0, run = 0;
  for (let f = 0; f < 10 && i < rolls.length; f++) {
    const [a, b, c] = [rolls[i], rolls[i + 1], rolls[i + 2]];
    let marks, add = null;
    if (f < 9) {
      if (a === 10) { marks = ['', 'X']; if (b != null && c != null) add = 10 + b + c; i += 1; }
      else {
        const spare = b != null && a + b === 10;
        marks = [sym(a), b == null ? '' : spare ? '/' : sym(b)];
        if (b != null && (!spare || c != null)) add = a + b + (spare ? c : 0);
        i += 2;
      }
    } else {
      marks = [a === 10 ? 'X' : sym(a)];
      if (b != null) marks.push(a === 10 ? (b === 10 ? 'X' : sym(b)) : a + b === 10 ? '/' : sym(b));
      if (c != null) marks.push(a === 10 && b !== 10 ? (b + c === 10 ? '/' : sym(c)) : c === 10 ? 'X' : sym(c));
      if (b != null && (a + b < 10 || c != null)) add = a + b + (c || 0);
      i = rolls.length;
    }
    run = run == null || add == null ? null : run + add;
    out.push({ marks, total: run });
  }
  return out;
}

export const openBowling = (onClose) => runArcade({
  id: 'bowling', title: 'Geodude Bowling', colour: '#8a7a6a', W, H,
  intro: 'Bowl over the Geodude! Swipe up from the ball to roll it.',
  help: [['Swipe up from the bottom to roll.', 'Start the swipe where you want the ball, swipe the way you want it to go; a faster swipe rolls harder.'], ['Bend the end of your swipe', 'to put a hook on the ball: it curls that way near the pins.'], ['Ten frames, two rolls each.', 'A strike scores 10 plus your next two rolls, a spare 10 plus the next one. Arrow keys aim, up / down set the hook, Space rolls.']],
  make(api) {
    const rolls = [];
    let frame = 0, inFrame = 0, pins = [], ball = null, phase = 'ready', wait = 0, slow = 0, aim = 0, spin = 0, keyAim = 0, swipe = null, startX = 0, msg = null, gone = 0;
    const rack = () => { pins = RACK.map(([x, z]) => ({ x, z, vx: 0, vz: 0, down: false, fall: 0, fx: 0, fz: 1, out: false, wob: 0 })); };
    rack();
    const standing = () => pins.filter((p) => !p.down);
    const roll = (x, slope, speed, hook) => {
      ball = { x, z: BALL_Z, vx: slope * speed, vz: speed, spin: hook, gutter: false, turn: 0 };
      gone = standing().length; phase = 'roll'; slow = 0; api.sound('confirm', 'select');
    };
    const knock = (p, dx, dz) => {
      if (p.down) return;
      const d = Math.hypot(dx, dz) || 1;
      p.down = true; p.fx = dx / d; p.fz = dz / d; api.sound(Math.random() < 0.5 ? 'plink-1' : 'plink-2', 'select');
    };
    const bump = (a, b, ma, mb, ra, rb, e) => {
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      if (d >= ra + rb || d === 0) return 0;
      const nx = dx / d, nz = dz / d, rel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz, push = (ra + rb - d) / 2;
      a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push;
      if (rel <= 0) return 0;
      const j = (1 + e) * rel / (1 / ma + 1 / mb), wob = rand(-0.12, 0.12);
      const jx = j * (nx - nz * wob), jz = j * (nz + nx * wob);
      a.vx -= jx / ma; a.vz -= jz / ma; b.vx += jx / mb; b.vz += jz / mb;
      return rel;
    };
    const settle = () => {
      const fell = gone - standing().length, cleared = !standing().length, strike = gone === 10 && fell === 10;
      rolls.push(fell);
      msg = { text: strike ? 'STRIKE!' : cleared ? 'SPARE!' : fell ? `${fell} pin${fell > 1 ? 's' : ''}` : ball.gutter ? 'Gutter...' : 'Miss', t: 1.4 };
      api.sound(strike ? 'stat-up' : cleared ? 'coins' : fell ? 'select' : 'cancel', 'select');
      const last = card(rolls).filter((f) => f.total != null).pop();
      api.score = last ? last.total : 0;
      let fresh = false, over = false;
      if (frame < 9) {
        if (strike || inFrame === 1) { frame += 1; inFrame = 0; fresh = true; } else inFrame = 1;
      } else if (inFrame === 0) { inFrame = 1; fresh = strike; }
      else if (inFrame === 1) {
        const [a, b] = rolls.slice(-2);
        if (a === 10 || a + b === 10) { inFrame = 2; fresh = cleared; } else over = true;
      } else over = true;
      phase = 'show'; wait = 1.3; ball.next = { fresh, over };
      if (!over) api.say(`Frame ${frame + 1}, ball ${inFrame + 1}.`);
    };
    const physics = (h) => {
      if (ball && !ball.done) {
        const b = ball;
        if (!b.gutter) b.vx += b.spin * 0.95 * Math.min(1, Math.max(0, b.z / HEAD)) ** 1.5 * h;
        b.x += b.vx * h; b.z += b.vz * h; b.turn += b.vz * h * 9;
        if (!b.gutter && Math.abs(b.x) > 0.5 - BR * 0.4 && b.z < HEAD - 0.3) { b.gutter = true; b.x = Math.sign(b.x) * 0.57; b.vx = 0; api.sound('cancel'); }
        if (b.gutter) b.x = Math.sign(b.x) * 0.57;
        else for (const p of pins) if (!p.out) { const hit = bump(b, p, 4.5, 1, BR, p.down ? LAY : PR, 0.55); if (hit > 0.15) knock(p, p.vx, p.vz); }
        if (!b.gutter && Math.abs(b.x) > 0.62) { b.x = Math.sign(b.x) * 0.62; b.vx *= -0.4; }
        if (b.z > END + 0.2) b.done = true;
      }
      for (let i = 0; i < pins.length; i++) for (let k = i + 1; k < pins.length; k++) {
        const p = pins[i], q = pins[k];
        if (p.out || q.out) continue;
        const hit = bump(p, q, 1, 1, p.down ? LAY : PR, q.down ? LAY : PR, 0.75);
        if (hit > 0.2) { knock(p, p.vx, p.vz); knock(q, q.vx, q.vz); }
      }
      for (const p of pins) {
        if (p.out) continue;
        const f = Math.exp(-(p.down ? 1.6 : 6) * h); p.vx *= f; p.vz *= f;
        p.x += p.vx * h; p.z += p.vz * h;
        if (Math.abs(p.x) > 0.64) { p.x = Math.sign(p.x) * 0.64; p.vx *= -0.6; knock(p, p.vx, p.vz); }
        if (p.z > END || p.z < HEAD - 1.2) { p.out = true; p.down = true; }
      }
    };
    const fire = () => roll(startX, aim, 3.5, spin * 0.6);
    return {
      tick(dt) {
        if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
        for (const p of pins) { if (p.down) p.fall = Math.min(1, p.fall + dt * 4); p.wob = Math.max(0, p.wob - dt); }
        if (phase === 'ready') { aim = Math.max(-0.16, Math.min(0.16, aim + keyAim * 0.18 * dt)); return; }
        if (phase === 'roll') {
          for (let s = 0; s < 6; s++) physics(dt / 6);
          const moving = pins.some((p) => !p.out && Math.hypot(p.vx, p.vz) > 0.05);
          if (ball.done || ball.z > HEAD - 0.3) slow += dt;
          if ((ball.done && !moving) || slow > 3.5 || (ball.vz < 0.3 && ball.z < HEAD - 0.5)) settle();
        } else if (phase === 'show') {
          physics(dt);
          wait -= dt;
          if (wait <= 0) {
            const { fresh, over } = ball.next;
            if (over) return api.over(rolls.length === 12 && api.score === 300 ? 'Perfect game!' : 'Ten frames!');
            if (fresh) rack(); else pins = pins.filter((p) => !p.down);
            ball = null; phase = 'ready'; spin = 0; aim = 0;
          }
        }
      },
      down(x, y) {
        if (phase !== 'ready') return;
        swipe = [{ x, y, t: performance.now() }];
        startX = Math.max(-0.38, Math.min(0.38, (x - W / 2) / sc(BALL_Z)));
      },
      move(x, y, pressed) {
        if (!swipe || !pressed) return;
        swipe.push({ x, y, t: performance.now() });
        if (swipe.length > 60) swipe.splice(1, 1);
        if (swipe[0].y - y < 12) startX = Math.max(-0.38, Math.min(0.38, (x - W / 2) / sc(BALL_Z)));
      },
      up(x, y) {
        const s = swipe; swipe = null;
        if (!s || phase !== 'ready') return;
        const now = performance.now();
        s.push({ x, y, t: now });
        const a = s[0], z = s[s.length - 1];
        if (a.y - z.y < 30) return api.say('Swipe up towards the pins to roll!');
        const mid = s.find((p) => a.y - p.y >= (a.y - z.y) * 0.6) || z;
        const tail = s.find((p) => now - p.t <= 90) || s[Math.max(0, s.length - 3)];
        const v = Math.hypot(z.x - tail.x, z.y - tail.y) / Math.max(0.016, (now - tail.t) / 1000);
        const ang1 = Math.atan2(mid.x - a.x, a.y - mid.y), ang2 = z === mid ? ang1 : Math.atan2(z.x - mid.x, mid.y - z.y);
        const power = Math.max(0, Math.min(1, (v - 250) / 1900));
        roll(startX, Math.max(-0.2, Math.min(0.2, Math.tan(ang1) * 0.32)), 2.3 + power * 2.7, Math.max(-1, Math.min(1, (ang2 - ang1) * 1.3)));
      },
      key(k, down) {
        if (k === 'left' || k === 'right') keyAim = down ? (k === 'left' ? -1 : 1) : 0;
        if (!down || phase !== 'ready') return;
        if (k === 'up' || k === 'down') { spin = Math.max(-1, Math.min(1, spin + (k === 'up' ? 1 : -1))); api.say(spin ? `Hook ${spin < 0 ? 'left' : 'right'}.` : 'No hook.'); }
        if (k === 'act') fire();
      },
      draw(g, now) {
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1c1424'); bg.addColorStop(1, '#3a2a2a');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        const quad = (x0, x1, z0, z1, fill) => { g.fillStyle = fill; g.beginPath(); g.moveTo(sx(x0, z0), sy(z0)); g.lineTo(sx(x1, z0), sy(z0)); g.lineTo(sx(x1, z1), sy(z1)); g.lineTo(sx(x0, z1), sy(z1)); g.closePath(); g.fill(); };
        quad(-0.75, 0.75, -0.6, END, '#2a2026');
        for (const s of [-1, 1]) { const gg = g.createLinearGradient(sx(s * 0.5, 0), 0, sx(s * 0.64, 0), 0); gg.addColorStop(0, '#4a4048'); gg.addColorStop(1, '#2a2228'); quad(Math.min(s * 0.5, s * 0.64), Math.max(s * 0.5, s * 0.64), -0.6, END, gg); }
        const wood = g.createLinearGradient(0, sy(END), 0, H); wood.addColorStop(0, '#c89a5a'); wood.addColorStop(0.5, '#e8c088'); wood.addColorStop(1, '#d8a868');
        quad(-0.5, 0.5, -0.6, END, wood);
        quad(-0.5, 0.5, HEAD - 0.35, END, 'rgba(255, 240, 210, 0.35)');
        g.strokeStyle = 'rgba(120, 70, 30, 0.22)'; g.lineWidth = 0.8;
        for (let i = 1; i < 12; i++) { const x = -0.5 + i / 12; g.beginPath(); g.moveTo(sx(x, -0.6), sy(-0.6)); g.lineTo(sx(x, END), sy(END)); g.stroke(); }
        const sheen = g.createLinearGradient(sx(-0.2, 1), 0, sx(0.2, 1), 0); sheen.addColorStop(0, 'rgba(255, 255, 255, 0)'); sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.16)'); sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
        quad(-0.2, 0.2, -0.6, END, sheen);
        g.fillStyle = 'rgba(160, 40, 40, 0.7)'; g.fillRect(sx(-0.5, 0), sy(0) - 1, sx(0.5, 0) - sx(-0.5, 0), 2);
        for (let i = -3; i <= 3; i++) {
          const x = i * 0.12, z = 1.3 + Math.abs(i) * 0.12, s = sc(z);
          g.fillStyle = 'rgba(170, 50, 40, 0.75)'; g.beginPath(); g.moveTo(sx(x, z + 0.12), sy(z + 0.12)); g.lineTo(sx(x, z) + s * 0.02, sy(z)); g.lineTo(sx(x, z) - s * 0.02, sy(z)); g.fill();
        }
        const mask = g.createLinearGradient(0, 30, 0, sy(END)); mask.addColorStop(0, '#3a2048'); mask.addColorStop(1, '#5a3060');
        g.fillStyle = mask; g.fillRect(sx(-0.75, END), 34, sx(0.75, END) - sx(-0.75, END), sy(END) - 34);
        g.fillStyle = '#100810'; g.fillRect(sx(-0.75, END), sy(END) - 4, sx(0.75, END) - sx(-0.75, END), 6);
        banner(g, 'GEODUDE LANES', W / 2, 42, 8, '#ffd84a');
        if (phase === 'ready' && !swipe) {
          const x0 = sx(startX, BALL_Z), y0 = sy(BALL_Z);
          g.setLineDash([4, 6]); g.strokeStyle = `rgba(255, 216, 74, ${0.5 + 0.3 * Math.sin(now / 200)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y0);
          for (let z = BALL_Z; z < HEAD; z += 0.2) { const t = z - BALL_Z; g.lineTo(sx(startX + aim * t + spin * 0.09 * (Math.max(0, z / HEAD) ** 3.5) * t * 1.5, z), sy(z)); }
          g.stroke(); g.setLineDash([]);
        }
        const things = pins.filter((p) => !p.out).map((p) => ({ z: p.z, p }));
        if (ball && !ball.done) things.push({ z: ball.z, b: ball });
        things.sort((a, b) => b.z - a.z);
        for (const t of things) {
          if (t.p) geodude(g, t.p, now);
          else pokeBall(g, t.b);
        }
        if (phase === 'ready') pokeBall(g, { x: startX, z: BALL_Z, turn: 0 });
        if (swipe && swipe.length > 1) {
          g.strokeStyle = 'rgba(255, 255, 255, 0.55)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath();
          swipe.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); g.lineCap = 'butt';
        }
        if (phase === 'ready' && !swipe && !rolls.length) banner(g, 'SWIPE UP ↑', W / 2, sy(BALL_Z) - 46 + Math.sin(now / 300) * 3, 14, '#fff');
        if (msg) banner(g, msg.text, W / 2, 150 - (1.4 - msg.t) * 12, msg.text.endsWith('!') ? 30 : 20, msg.text === 'STRIKE!' ? '#ffd84a' : msg.text === 'SPARE!' ? '#8ae8ff' : '#fff');
        scorecard(g, card(rolls), frame, phase);
      },
    };
  },
}, onClose);

function geodude(g, p, now) {
  const s = sc(p.z), r = Math.max(PR * 1.55 * s, 6), x = sx(p.x, p.z), y = sy(p.z);
  const tilt = p.fall * Math.PI / 2 * (p.fx >= 0 ? 1 : -1) * Math.min(1, Math.abs(p.fx) + 0.35), drop = p.fall * r * 0.5;
  g.save();
  g.globalAlpha = p.z > END - 0.15 ? Math.max(0, (END - p.z) / 0.15) : 1;
  g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.beginPath(); g.ellipse(x, y, r * (1 + p.fall * 0.4), r * 0.35, 0, 0, Math.PI * 2); g.fill();
  g.translate(x, y - r * 0.9 + drop); g.rotate(tilt); g.scale(1, 1 - p.fall * 0.15);
  for (const side of [-1, 1]) {
    g.save(); g.scale(side, 1);
    const arm = g.createLinearGradient(r * 0.8, 0, r * 1.8, 0); arm.addColorStop(0, '#8a8478'); arm.addColorStop(1, '#a8a294');
    g.fillStyle = arm; g.beginPath(); g.ellipse(r * 1.15, r * 0.15, r * 0.45, r * 0.24, -0.5 - p.fall, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(r * 1.55, -r * 0.2 - p.fall * r * 0.3, r * 0.3, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  const rock = g.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r); rock.addColorStop(0, '#c8c2b4'); rock.addColorStop(0.7, '#958e80'); rock.addColorStop(1, '#6a6458');
  g.fillStyle = rock; g.beginPath();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, rr = r * (1 + 0.06 * Math.sin(i * 2.7)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.95); }
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(60, 54, 46, 0.5)'; g.lineWidth = Math.max(0.6, r * 0.06); g.beginPath(); g.moveTo(r * 0.35, -r * 0.75); g.lineTo(r * 0.2, -r * 0.5); g.lineTo(r * 0.45, -r * 0.4); g.stroke();
  const shut = p.down;
  g.strokeStyle = '#2a2622'; g.fillStyle = '#2a2622'; g.lineWidth = Math.max(0.7, r * 0.1);
  for (const side of [-1, 1]) {
    g.beginPath(); g.moveTo(side * r * 0.55, -r * 0.42); g.lineTo(side * r * 0.12, -r * 0.25); g.stroke();
    if (shut) { g.beginPath(); g.moveTo(side * r * 0.45, -r * 0.05); g.lineTo(side * r * 0.2, -r * 0.15); g.lineTo(side * r * 0.45, -r * 0.25); g.stroke(); }
    else { g.beginPath(); g.ellipse(side * r * 0.32, -r * 0.08, r * 0.1, r * 0.14, 0, 0, Math.PI * 2); g.fill(); }
  }
  g.beginPath();
  if (shut) { g.ellipse(0, r * 0.4, r * 0.14, r * 0.12, 0, 0, Math.PI * 2); g.fill(); }
  else { g.arc(0, r * 0.25, r * 0.28, 0.2, Math.PI - 0.2); g.stroke(); }
  g.restore();
}

function pokeBall(g, b) {
  const s = sc(b.z), r = BR * s, x = sx(b.x, b.z), y = sy(b.z) - r * 0.9;
  g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.beginPath(); g.ellipse(x, sy(b.z), r * 0.95, r * 0.3, 0, 0, Math.PI * 2); g.fill();
  g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
  const ph = Math.sin(b.turn || 0), seam = y + ph * r * 0.85, up = Math.cos(b.turn || 0) >= 0;
  g.fillStyle = up ? '#e83838' : '#f4f4f4'; g.fillRect(x - r, y - r, r * 2, seam - (y - r));
  g.fillStyle = up ? '#f4f4f4' : '#e83838'; g.fillRect(x - r, seam, r * 2, y + r - seam);
  g.fillStyle = '#202028'; g.fillRect(x - r, seam - r * 0.08, r * 2, r * 0.16);
  if (Math.abs(ph) < 0.8) { g.beginPath(); g.arc(x, seam, r * 0.26, 0, Math.PI * 2); g.fill(); g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(x, seam, r * 0.15, 0, Math.PI * 2); g.fill(); }
  const shine = g.createRadialGradient(x - r * 0.4, y - r * 0.45, 0, x - r * 0.2, y - r * 0.2, r * 1.2); shine.addColorStop(0, 'rgba(255, 255, 255, 0.6)'); shine.addColorStop(0.35, 'rgba(255, 255, 255, 0)'); shine.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
  g.fillStyle = shine; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
  g.strokeStyle = '#202028'; g.lineWidth = Math.max(1, r * 0.08); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
}

function scorecard(g, sheet, frame, phase) {
  const x0 = 4, y0 = 3, fw = 28, lw = 40, h = 28;
  g.fillStyle = '#f8f4e8'; g.beginPath(); g.roundRect(x0 - 1, y0 - 1, fw * 9 + lw + 2, h + 2, 4); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let f = 0; f < 10; f++) {
    const x = x0 + f * fw, w = f === 9 ? lw : fw, row = sheet[f], cur = f === frame && phase !== 'show';
    if (cur) { g.fillStyle = 'rgba(255, 216, 74, 0.55)'; g.fillRect(x, y0, w, h); }
    g.strokeStyle = '#6a5a4a'; g.lineWidth = 0.8; g.strokeRect(x, y0, w, h);
    const boxes = f === 9 ? 3 : 2, bw = 11;
    for (let k = 0; k < boxes; k++) {
      const bx = x + w - (boxes - k) * bw;
      g.strokeRect(bx, y0, bw, 11);
      const m = row?.marks[f === 9 ? k : k];
      if (m) { g.font = '800 8px system-ui, sans-serif'; g.fillStyle = m === 'X' ? '#c02828' : m === '/' ? '#2868c0' : '#2a2422'; g.fillText(m, bx + bw / 2, y0 + 6); }
    }
    if (row?.total != null) { g.font = '800 9px system-ui, sans-serif'; g.fillStyle = '#2a2422'; g.fillText(String(row.total), x + w / 2, y0 + 20); }
    else { g.font = '700 6px system-ui, sans-serif'; g.fillStyle = 'rgba(42, 36, 34, 0.35)'; g.fillText(String(f + 1), x + 5, y0 + 23); }
  }
}
