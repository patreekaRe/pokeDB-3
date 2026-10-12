/* arcade-breakout.js  -  Electrode Breakout, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick), after
   Breakout: an Electrode bounces off your paddle into a wall of Geodude, the Graveler among them taking two hits. Drag
   (or the arrow keys) to move, tap (or Space) to launch. Where it strikes the paddle sets the angle. Broken rock now and
   then drops a power-up: a wider paddle, two more Electrode, or a slower bounce. Three lives; a cleared wall brings the
   next layout, quicker. */

import { runArcade, banner, rand, pick, stamp } from './arcade-kit.js';

const W = 300, H = 380, TOP = 34, PY = H - 30, PH = 10, PW = 58, WIDE = 88, BR = 7, COLS = 8, BW = 34, BH = 17, GAP = 2, LIVES = 3;
const BX = (W - COLS * (BW + GAP) + GAP) / 2;
/* g Geodude, G Graveler (two hits), . a gap */
const LAYOUTS = [
  ['gggggggg', 'gggggggg', 'gggggggg', 'gggggggg', 'GGGGGGGG'],
  ['...GG...', '..gggg..', '.gggggg.', 'GggggggG', '.gggggg.', '..gggg..'],
  ['GgGgGgGg', 'gGgGgGgG', 'GgGgGgGg', '........', 'gggggggg', 'gggggggg'],
  ['gg.GG.gg', 'gg.GG.gg', 'gggggggg', 'G.g..g.G', 'gggggggg', 'GGGGGGGG'],
  ['GGGGGGGG', 'G......G', 'G.gggg.G', 'G.gGGg.G', 'G.gggg.G', 'GGGGGGGG'],
];
const POWERS = { wide: ['W', '#40b0f0', 'Wide paddle!'], multi: ['M', '#f0a030', 'Multi-Electrode!'], slow: ['S', '#60c060', 'Slow down!'] };

export const openBreakout = (onClose) => runArcade({
  id: 'breakout', title: 'Electrode Breakout', colour: '#e84040', W, H,
  intro: 'Smash the Geodude wall! Drag to move, tap to launch.',
  help: [['Drag left and right to move your paddle', '(or hold the arrow keys). Tap or Space launches Electrode.'], ['Where Electrode hits the paddle sets its angle.', 'Graveler take two hits. Catch falling power-ups: W wider, M multi-ball, S slow.'], [`Miss every Electrode and lose a life; ${LIVES} and it's over.`, 'Geodude 10, Graveler 25. A cleared wall adds 100 a level.']],
  make(api) {
    let px = W / 2, target = null, keyDir = 0, lives = LIVES, level = 0, wide = 0, slow = 0, flash = 0, bricks = [], balls = [], pause = 0;
    const drops = [], bits = [];
    const pw = () => wide > 0 ? WIDE : PW;
    const base = () => 190 + level * 18;
    const build = () => {
      bricks = [];
      LAYOUTS[level % LAYOUTS.length].forEach((row, r) => [...row].forEach((ch, c) => {
        if (ch !== '.') bricks.push({ x: BX + c * (BW + GAP), y: TOP + 24 + r * (BH + GAP), hp: ch === 'G' ? 2 : 1, tough: ch === 'G', seed: r * 9 + c * 5 });
      }));
    };
    const ready = () => { balls = [{ x: px, y: PY - BR, vx: 0, vy: 0, stuck: true, spin: 0 }]; drops.length = 0; };
    build(); ready();
    const launch = () => {
      for (const b of balls) if (b.stuck) { const a = rand(-0.4, 0.4), s = base(); b.vx = Math.sin(a) * s; b.vy = -Math.cos(a) * s; b.stuck = false; api.sound('confirm', 'select'); }
    };
    const crumble = (k, c) => { for (let i = 0; i < 9; i++) { const a = rand(0, Math.PI * 2), s = rand(30, 120); bits.push({ x: k.x + BW / 2, y: k.y + BH / 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, t: rand(0.4, 0.8), c }); } };
    const strike = (k) => {
      k.hp -= 1;
      if (k.hp > 0) { api.add(5); api.sound('plink-1'); crumble(k, '#8a8070'); return; }
      api.add(k.tough ? 25 : 10); api.sound('plink-2'); crumble(k, k.tough ? '#6a6458' : '#a89c84');
      bricks.splice(bricks.indexOf(k), 1);
      if (Math.random() < 0.13) drops.push({ x: k.x + BW / 2, y: k.y + BH / 2, kind: pick(Object.keys(POWERS)) });
    };
    const power = (kind) => {
      api.say(POWERS[kind][2]); api.sound('stat-up', 'coins'); api.add(15);
      if (kind === 'wide') wide = 12;
      if (kind === 'slow') { if (slow <= 0) for (const b of balls) { b.vx *= 0.7; b.vy *= 0.7; } slow = 8; }
      if (kind === 'multi') {
        const from = balls.find(b => !b.stuck) || balls[0];
        for (const a of [-0.5, 0.5]) { const s = base() * (slow > 0 ? 0.7 : 1), ang = a + rand(-0.15, 0.15); balls.push({ x: from.x, y: from.y, vx: Math.sin(ang) * s, vy: -Math.cos(ang) * s, stuck: false, spin: 0 }); }
      }
    };
    const move = (b, dt) => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.spin += dt * (b.vx > 0 ? 6 : -6);
      if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx); }
      if (b.x > W - BR) { b.x = W - BR; b.vx = -Math.abs(b.vx); }
      if (b.y < TOP + BR) { b.y = TOP + BR; b.vy = Math.abs(b.vy); }
      const w = pw();
      if (b.vy > 0 && b.y + BR >= PY && b.y + BR <= PY + PH + 4 && Math.abs(b.x - px) < w / 2 + BR) {
        const off = Math.max(-1, Math.min(1, (b.x - px) / (w / 2))), s = Math.min(420, Math.hypot(b.vx, b.vy) * 1.01), a = off * 1.05;
        b.vx = Math.sin(a) * s; b.vy = -Math.cos(a) * s; b.y = PY - BR; api.sound('select');
      }
      for (const k of bricks) {
        const cx = Math.max(k.x, Math.min(b.x, k.x + BW)), cy = Math.max(k.y, Math.min(b.y, k.y + BH)), dx = b.x - cx, dy = b.y - cy;
        if (dx * dx + dy * dy > BR * BR) continue;
        const ox = Math.min(b.x + BR - k.x, k.x + BW - (b.x - BR)), oy = Math.min(b.y + BR - k.y, k.y + BH - (b.y - BR));
        if (ox < oy) { b.vx = b.x < k.x + BW / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); b.x += b.vx > 0 ? ox : -ox; }
        else { b.vy = b.y < k.y + BH / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); b.y += b.vy > 0 ? oy : -oy; }
        if (Math.abs(b.vy) < 50) b.vy = (b.vy < 0 ? -1 : 1) * 50;
        strike(k);
        break;
      }
    };
    return {
      tick(dt) {
        if (target != null) px += Math.max(-460 * dt, Math.min(460 * dt, target - px)); else px += keyDir * 300 * dt;
        px = Math.max(pw() / 2, Math.min(W - pw() / 2, px));
        wide = Math.max(0, wide - dt); flash = Math.max(0, flash - dt);
        if (slow > 0 && (slow -= dt) <= 0) for (const b of balls) { b.vx /= 0.7; b.vy /= 0.7; }
        for (const s of bits) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 300 * dt; s.t -= dt; }
        for (let i = bits.length - 1; i >= 0; i--) if (bits[i].t <= 0) bits.splice(i, 1);
        if (pause > 0) { pause -= dt; if (pause <= 0) { build(); ready(); } return; }
        for (const b of balls) {
          if (b.stuck) { b.x = px; b.y = PY - BR; continue; }
          const n = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 3);
          for (let i = 0; i < n; i++) move(b, dt / n);
        }
        balls = balls.filter(b => b.y < H + BR * 2);
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i]; d.y += 90 * dt;
          if (d.y > PY - 6 && d.y < PY + PH + 6 && Math.abs(d.x - px) < pw() / 2 + 8) { drops.splice(i, 1); power(d.kind); }
          else if (d.y > H + 10) drops.splice(i, 1);
        }
        if (!bricks.length) { level += 1; api.add(100 * level); api.say(`Wall smashed! Level ${level + 1}.`); api.sound('stat-up', 'confirm'); pause = 1.4; balls = []; drops.length = 0; wide = 0; slow = 0; return; }
        if (!balls.length) {
          lives -= 1; flash = 0.5; wide = 0; slow = 0; api.sound('cancel');
          if (lives <= 0) return api.over('Electrode fainted!');
          api.say(`Missed! ${lives} ${lives === 1 ? 'life' : 'lives'} left. Tap to launch.`); ready();
        }
      },
      down(x) { target = x; launch(); },
      move(x, y, pressed) { if (pressed) target = x; },
      up() { target = null; },
      key(k, down) { if (k === 'left' || k === 'right') keyDir = down ? (k === 'left' ? -1 : 1) : (keyDir === (k === 'left' ? -1 : 1) ? 0 : keyDir); if (down && (k === 'act' || k === 'up')) launch(); },
      draw(g, now) {
        stamp(g, 'bo-bg', 0, 0, W, H, (g) => {
          const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3a2a40'); bg.addColorStop(0.6, '#4a3a3a'); bg.addColorStop(1, '#2a2020');
          g.fillStyle = bg; g.fillRect(0, 0, W, H);
          g.fillStyle = 'rgba(255, 255, 255, 0.04)';
          for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse((i * 67) % W, 60 + (i * 97) % (H - 80), 22 + (i % 4) * 8, 12 + (i % 3) * 5, i, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.fillRect(0, 0, W, TOP);
        });
        g.font = '700 11px system-ui, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = 'rgba(255, 255, 255, 0.85)';
        g.fillText(`LEVEL ${level + 1}`, 10, TOP / 2);
        for (let i = 0; i < lives; i++) electrode(g, W - 14 - i * 18, TOP / 2, 6, 0);
        if (wide > 0 || slow > 0) { g.textAlign = 'center'; g.fillStyle = '#ffd84a'; g.fillText([wide > 0 && `WIDE ${Math.ceil(wide)}`, slow > 0 && `SLOW ${Math.ceil(slow)}`].filter(Boolean).join('  '), W / 2, TOP / 2); }
        for (const k of bricks) stamp(g, `bo-${k.seed}-${k.tough ? k.hp : 0}`, k.x - 2, k.y - 3, BW + 4, BH + 6, (cg) => { cg.translate(2 - k.x, 3 - k.y); rock(cg, k); });
        for (const s of bits) { g.globalAlpha = Math.max(0, s.t * 1.6); g.fillStyle = s.c; g.beginPath(); g.arc(s.x, s.y, 1.8, 0, Math.PI * 2); g.fill(); }
        g.globalAlpha = 1;
        for (const d of drops) {
          const [ch, c] = POWERS[d.kind];
          g.fillStyle = c; g.beginPath(); g.roundRect(d.x - 12, d.y - 6, 24, 12, 6); g.fill();
          g.fillStyle = 'rgba(255, 255, 255, 0.4)'; g.beginPath(); g.roundRect(d.x - 9, d.y - 4.5, 18, 3.5, 2); g.fill();
          g.font = '800 9px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(ch, d.x, d.y + 0.5);
        }
        const w = pw(), pg = g.createLinearGradient(0, PY, 0, PY + PH); pg.addColorStop(0, '#f8f8f8'); pg.addColorStop(1, '#b8b8c8');
        g.fillStyle = pg; g.beginPath(); g.roundRect(px - w / 2, PY, w, PH, 5); g.fill();
        g.fillStyle = '#e84040'; g.beginPath(); g.roundRect(px - w / 2, PY, 8, PH, [5, 0, 0, 5]); g.fill(); g.beginPath(); g.roundRect(px + w / 2 - 8, PY, 8, PH, [0, 5, 5, 0]); g.fill();
        g.fillStyle = 'rgba(255, 255, 255, 0.6)'; g.fillRect(px - w / 2 + 10, PY + 2, w - 20, 2);
        for (const b of balls) {
          if (!b.stuck && Math.hypot(b.vx, b.vy) > 260) stamp(g, 'bo-glow', b.x - BR - 9, b.y - BR - 9, BR * 2 + 18, BR * 2 + 18, (cg) => { const r = BR + 9, gl = cg.createRadialGradient(r, r, BR * 0.6, r, r, r); gl.addColorStop(0, 'rgba(255, 240, 120, 0.55)'); gl.addColorStop(1, 'rgba(255, 232, 96, 0)'); cg.fillStyle = gl; cg.fillRect(0, 0, r * 2, r * 2); });
          electrode(g, b.x, b.y, BR, b.spin);
        }
        if (flash > 0) { g.fillStyle = `rgba(255, 60, 60, ${flash * 0.5})`; g.fillRect(0, 0, W, H); }
        if (pause > 0) banner(g, `LEVEL ${level + 1}`, W / 2, H * 0.55, 30, '#ffd84a');
        else if (balls.some(b => b.stuck)) banner(g, 'TAP TO LAUNCH', W / 2, H * 0.68, 14, `rgba(255, 255, 255, ${0.6 + 0.4 * Math.sin(now / 250)})`);
      },
    };
  },
}, onClose);

function electrode(g, x, y, r, spin) {
  g.save(); g.translate(x, y); g.rotate(Math.sin(spin) * 0.25);
  g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
  const top = g.createRadialGradient(-r * 0.3, -r * 0.5, r * 0.1, 0, 0, r); top.addColorStop(0, '#ff7a6a'); top.addColorStop(1, '#c82020');
  g.fillStyle = top; g.beginPath(); g.arc(0, 0, r, Math.PI, Math.PI * 2); g.lineTo(r, 0.6); g.lineTo(-r, 0.6); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0, 0, 0, 0.35)'; g.lineWidth = Math.max(0.8, r / 7); g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#fff'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * 0.38, -r * 0.3, r * 0.24, r * 0.2, s * -0.4, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#201818'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * r * 0.32, -r * 0.27, r * 0.11, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = '#201818'; g.lineWidth = Math.max(0.6, r / 9);
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * r * 0.62, -r * 0.62); g.lineTo(s * r * 0.15, -r * 0.42); g.stroke(); }
  g.fillStyle = 'rgba(255, 255, 255, 0.55)'; g.beginPath(); g.ellipse(-r * 0.45, -r * 0.62, r * 0.18, r * 0.1, -0.6, 0, Math.PI * 2); g.fill();
  g.restore();
}

function rock(g, k) {
  const { x, y, seed, tough, hp } = k, cx = x + BW / 2, cy = y + BH / 2;
  g.save();
  g.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2, wob = 1 + Math.sin(seed + i * 2.3) * 0.07;
    const px = cx + Math.cos(a) * (BW / 2) * wob, py = cy + Math.sin(a) * (BH / 2 + 1) * wob;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  const rg = g.createRadialGradient(cx - 6, cy - 5, 2, cx, cy, BW / 2);
  if (tough) { rg.addColorStop(0, '#a49a88'); rg.addColorStop(1, '#5a5244'); } else { rg.addColorStop(0, '#d4c8ae'); rg.addColorStop(1, '#8a7c64'); }
  g.fillStyle = rg; g.fill();
  g.strokeStyle = 'rgba(30, 24, 16, 0.55)'; g.lineWidth = 1; g.stroke();
  g.clip();
  g.fillStyle = 'rgba(40, 30, 20, 0.18)';
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + 5 + ((seed * 7 + i * 9) % (BW - 8)), y + 4 + ((seed * 3 + i * 5) % (BH - 6)), 1.6 + (i % 2), 0, Math.PI * 2); g.fill(); }
  if (tough) { g.strokeStyle = 'rgba(30, 24, 16, 0.4)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x + 6 + i * 10, y + 2); g.lineTo(x + 9 + i * 10, y + BH - 2); g.stroke(); } }
  if (tough && hp < 2) { g.strokeStyle = '#201810'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - 8, y + 1); g.lineTo(cx - 2, cy - 1); g.lineTo(cx - 5, cy + 3); g.lineTo(cx + 3, y + BH); g.moveTo(cx - 2, cy - 1); g.lineTo(cx + 7, cy - 4); g.stroke(); }
  g.restore();
  g.fillStyle = '#201810';
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 4.5, cy - 0.5, 1.6, 2.2, 0, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = '#201810'; g.lineWidth = 1.2;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 7.5, cy - 4.5); g.lineTo(cx + s * 2, cy - 3); g.stroke(); }
  g.beginPath(); g.moveTo(cx - 3, cy + 4); g.quadraticCurveTo(cx, cy + 2.5, cx + 3, cy + 4); g.stroke();
}
