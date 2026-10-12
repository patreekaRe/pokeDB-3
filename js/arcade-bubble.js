/* arcade-bubble.js  -  Squirtle Bubble Shooter, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick, in
   place of Unown Word Search), after Puzzle Bobble: Squirtle fires coloured bubbles up into a cluster hanging from the
   ceiling. Three or more of a colour touching pop, and any bubbles left hanging from nothing fall for a bonus. Every few
   shots the ceiling drops a new row; a bubble past the line at the bottom ends it. Endless, faster rows as it goes.
   Drag to aim and let go to fire, or turn with the arrow keys and fire with Space; a tap on the next bubble swaps it. */

import { runArcade, drawMon, banner } from './arcade-kit.js';

const R = 15, COLS = 10, ROWH = R * Math.sqrt(3), TOP = 8, W = COLS * R * 2, H = 420;
const LINE = H - 78, GUN = [W / 2, H - 46], SPEED = 640, START_ROWS = 6;
const POP = 10, DROP = 20;
/* the bubbles' colours: water, fire, grass, electric, psychic, and their glyphs */
const COLOURS = [['#3a8ae8', '#a8d4ff'], ['#e8523a', '#ffb8a0'], ['#4ab84a', '#b8f0a8'], ['#f0c020', '#fff0a0'], ['#b060d0', '#e8c0ff']];
const TAU = Math.PI * 2;

export const openBubble = (onClose) => runArcade({
  id: 'bubble', title: 'Squirtle Bubble Shooter', colour: '#3a8ae8', W, H,
  intro: 'Match three bubbles to pop them! Drag to aim, let go to fire.',
  help: [['Drag to aim, let go to fire.', 'Or turn with the arrow keys and fire with Space. Bounce shots off the walls!'], ['Three or more of a colour touching pop.', `${POP} a bubble, and ${DROP} for each one left hanging that falls.`], ['Every few shots the ceiling drops a row.', 'Tap the next bubble to swap it. Don\'t let them past the line!']],
  make(api) {
    let rows = [], flip = 0, angle = -Math.PI / 2, aiming = false, shot = null, shots = 0, cur, next;
    const falling = [], bursts = [];
    let pressed = { left: false, right: false };
    const offset = (r) => ((r + flip) % 2 ? R : 0);
    const width = (r) => (offset(r) ? COLS - 1 : COLS);
    const pos = (r, c) => [R + c * R * 2 + offset(r), TOP + R + r * ROWH];
    const randomRow = (r, n = COLOURS.length) => Array.from({ length: width(r) }, () => Math.floor(Math.random() * n));
    const colours = () => { const s = new Set(); rows.forEach(row => row.forEach(v => v !== null && v !== undefined && s.add(v))); return [...s]; };
    const deal = () => { const c = colours(); return c.length ? c[Math.floor(Math.random() * c.length)] : Math.floor(Math.random() * COLOURS.length); };
    for (let r = 0; r < START_ROWS; r++) rows.push(randomRow(r, 4));
    cur = deal(); next = deal();
    const pushEvery = () => Math.max(4, 8 - Math.floor(api.score / 800));

    const neighbours = (r, c) => {
      const d = offset(r) ? [0, 1] : [-1, 0], out = [[r, c - 1], [r, c + 1]];
      for (const rr of [r - 1, r + 1]) for (const dc of d) out.push([rr, c + dc]);
      return out.filter(([a, b]) => a >= 0 && a < rows.length && b >= 0 && b < width(a));
    };
    const at = (r, c) => rows[r]?.[c] ?? null;
    const flood = (starts, same) => {
      const seen = new Set(starts.map(([r, c]) => `${r},${c}`)), list = [...starts];
      for (let i = 0; i < list.length; i++) {
        for (const [a, b] of neighbours(...list[i])) {
          const k = `${a},${b}`;
          if (seen.has(k) || at(a, b) === null || (same !== undefined && at(a, b) !== same)) continue;
          seen.add(k); list.push([a, b]);
        }
      }
      return list;
    };
    const lower = () => {
      flip ^= 1;
      rows.unshift(randomRow(0, Math.max(3, colours().length)));
    };
    const trim = () => { while (rows.length && rows[rows.length - 1].every(v => v === null)) rows.pop(); };
    const tooLow = () => rows.some((row, r) => row.some(v => v !== null) && pos(r, 0)[1] + R > LINE);

    /** The nearest empty cell to (x, y), touching the ceiling or a bubble. */
    const snap = (x, y) => {
      const guess = Math.max(0, Math.round((y - TOP - R) / ROWH));
      let bestCell = null, bestD = Infinity;
      for (let r = Math.max(0, guess - 1); r <= guess + 1; r++) {
        while (rows.length <= r) rows.push(Array(width(rows.length)).fill(null));
        for (let c = 0; c < width(r); c++) {
          if (at(r, c) !== null) continue;
          if (r > 0 && !neighbours(r, c).some(([a, b]) => at(a, b) !== null)) continue;
          const [px, py] = pos(r, c), d = (px - x) ** 2 + (py - y) ** 2;
          if (d < bestD) { bestD = d; bestCell = [r, c]; }
        }
      }
      return bestCell;
    };

    const land = (x, y, colour) => {
      const cell = snap(x, y);
      if (!cell) return;
      rows[cell[0]][cell[1]] = colour;
      const group = flood([cell], colour);
      if (group.length >= 3) {
        for (const [r, c] of group) { const [px, py] = pos(r, c); bursts.push({ x: px, y: py, colour, t: 0 }); rows[r][c] = null; }
        api.add(group.length * POP);
        api.sound('fx-bubble', 'plink-1');
        const tops = rows[0] ? rows[0].map((v, c) => [0, c]).filter(([r, c]) => at(r, c) !== null) : [];
        const held = new Set(flood(tops).map(([r, c]) => `${r},${c}`));
        let dropped = 0;
        rows.forEach((row, r) => row.forEach((v, c) => {
          if (v === null || held.has(`${r},${c}`)) return;
          const [px, py] = pos(r, c);
          falling.push({ x: px, y: py, vy: -60 - Math.random() * 80, vx: (Math.random() - 0.5) * 80, colour: v });
          rows[r][c] = null; dropped++;
        }));
        if (dropped) { api.add(dropped * DROP); api.say(`${dropped} dropped! +${dropped * DROP}`); api.sound('coins', 'plink-2'); }
        else if (group.length >= 5) api.say(`${group.length} popped! Splashing!`);
      } else api.sound('plink-0', 'select');
      trim();
      if (++shots % pushEvery() === 0) { lower(); api.say('The ceiling drops a row!'); }
      if (!rows.some(row => row.some(v => v !== null))) { api.add(500); api.say('Board cleared! +500'); for (let r = 0; r < START_ROWS; r++) rows.push(randomRow(r, 4)); }
      if (tooLow()) api.over('The bubbles reached the line!');
    };

    const fire = () => {
      if (shot) return;
      shot = { x: GUN[0], y: GUN[1], vx: Math.cos(angle) * SPEED, vy: Math.sin(angle) * SPEED, colour: cur };
      cur = next; next = deal();
      api.sound('select');
    };
    const aimAt = (x, y) => { angle = Math.max(-Math.PI + 0.18, Math.min(-0.18, Math.atan2(y - GUN[1], x - GUN[0]))); };
    const onNext = (x, y) => (x - (GUN[0] + 62)) ** 2 + (y - (GUN[1] + 14)) ** 2 < 22 ** 2;

    const bubble = (g, x, y, colour, r = R) => {
      const [base, light] = COLOURS[colour], grad = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      grad.addColorStop(0, light); grad.addColorStop(0.6, base); grad.addColorStop(1, base);
      g.fillStyle = grad; g.beginPath(); g.arc(x, y, r - 0.5, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255, 255, 255, 0.35)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = 'rgba(255, 255, 255, 0.75)'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.45, r * 0.28, r * 0.16, -0.5, 0, TAU); g.fill();
    };

    return {
      tick(dt) {
        const turn = (pressed.right ? 1 : 0) - (pressed.left ? 1 : 0);
        if (turn) aimAt(GUN[0] + Math.cos(angle + turn * 1.6 * dt) * 100, GUN[1] + Math.sin(angle + turn * 1.6 * dt) * 100);
        if (shot) {
          const steps = 6;
          for (let i = 0; i < steps && shot; i++) {
            shot.x += shot.vx * dt / steps; shot.y += shot.vy * dt / steps;
            if (shot.x < R) { shot.x = R; shot.vx = Math.abs(shot.vx); }
            if (shot.x > W - R) { shot.x = W - R; shot.vx = -Math.abs(shot.vx); }
            let hit = shot.y <= TOP + R;
            if (!hit) rows.forEach((row, r) => row.forEach((v, c) => { if (v === null || hit) return; const [px, py] = pos(r, c); if ((px - shot.x) ** 2 + (py - shot.y) ** 2 < (R * 1.75) ** 2) hit = true; }));
            if (hit) { const s = shot; shot = null; land(s.x, s.y, s.colour); }
          }
        }
        for (let i = falling.length - 1; i >= 0; i--) { const f = falling[i]; f.vy += 900 * dt; f.y += f.vy * dt; f.x += f.vx * dt; if (f.y > H + R) falling.splice(i, 1); }
        for (let i = bursts.length - 1; i >= 0; i--) if ((bursts[i].t += dt) > 0.35) bursts.splice(i, 1);
      },
      down(x, y) { if (onNext(x, y)) { [cur, next] = [next, cur]; api.sound('select'); return; } aiming = true; aimAt(x, y); },
      move(x, y, held) { if (held && aiming) aimAt(x, y); },
      up() { if (aiming) { aiming = false; fire(); } },
      key(k, down) { if (k === 'left' || k === 'right') pressed[k] = down; else if (k === 'act' && down) fire(); else if (k === 'down' && down) [cur, next] = [next, cur]; },
      draw(g, now) {
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0c3a6a'); bg.addColorStop(1, '#2a8ac8');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(255, 255, 255, 0.06)';
        for (let i = 0; i < 5; i++) { const x = (i * 71 + now / 60) % (W + 40) - 20; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 30, 0); g.lineTo(x - 30, H); g.lineTo(x - 50, H); g.fill(); }
        g.fillStyle = '#082848'; g.fillRect(0, 0, W, TOP);
        // the ceiling's stalactites so a dropped row reads as the ceiling coming down
        g.fillStyle = '#0a3058'; for (let i = 0; i < 15; i++) { g.beginPath(); g.moveTo(i * 20, TOP); g.lineTo(i * 20 + 10, TOP + 6); g.lineTo(i * 20 + 20, TOP); g.fill(); }
        rows.forEach((row, r) => row.forEach((v, c) => { if (v !== null) bubble(g, ...pos(r, c), v); }));
        for (const b of bursts) { g.strokeStyle = COLOURS[b.colour][1]; g.globalAlpha = 1 - b.t / 0.35; g.lineWidth = 2; g.beginPath(); g.arc(b.x, b.y, R * (1 + b.t * 3), 0, TAU); g.stroke(); g.globalAlpha = 1; }
        for (const f of falling) bubble(g, f.x, f.y, f.colour);
        g.strokeStyle = `rgba(255, 90, 90, ${0.5 + 0.3 * Math.sin(now / 200)})`; g.setLineDash([8, 6]); g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, LINE); g.lineTo(W, LINE); g.stroke(); g.setLineDash([]);
        // the aim: dots along the path, one bounce shown
        if (!shot) {
          let x = GUN[0], y = GUN[1], vx = Math.cos(angle), vy = Math.sin(angle);
          g.fillStyle = 'rgba(255, 255, 255, 0.7)';
          for (let i = 0; i < 26 && y > TOP + R; i++) {
            x += vx * 12; y += vy * 12;
            if (x < R || x > W - R) { vx = -vx; x = Math.max(R, Math.min(W - R, x)); }
            g.beginPath(); g.arc(x, y, i % 2 ? 1.6 : 2.4, 0, TAU); g.fill();
          }
        }
        g.fillStyle = '#0a2a4a'; g.fillRect(0, LINE + 6, W, H - LINE - 6);
        drawMon(g, 'squirtle', GUN[0] - 34, H - 4, 50);
        bubble(g, GUN[0], GUN[1], cur);
        if (shot) bubble(g, shot.x, shot.y, shot.colour);
        bubble(g, GUN[0] + 62, GUN[1] + 14, next, R * 0.8);
        banner(g, 'NEXT', GUN[0] + 62, GUN[1] - 8, 9, '#a8d4ff');
        banner(g, `Row in ${pushEvery() - (shots % pushEvery())}`, 40, H - 22, 11, '#ffffff');
      },
    };
  },
}, onClose);
