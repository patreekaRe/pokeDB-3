/* arcade-bubble.js  -  Squirtle Bubble Shooter, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick, in
   place of Unown Word Search), after Puzzle Bobble: Squirtle fires coloured bubbles up into a cluster hanging from the
   ceiling. Three or more of a colour touching pop, and any bubbles left hanging from nothing fall for a bonus. Every few
   shots the ceiling drops a new row; a bubble past the line at the bottom ends it. Endless, faster rows as it goes.
   Aim with the cabinet's joystick (or the arrow keys) and press SHOOT (or Space): a tap on the screen never aims or fires
   (the user's call, 2026-10-12), it only swaps the two bubbles at the bottom. The dotted path shows for the first
   AIM_SHOTS shots, then only the launcher's beam. The sea behind is painted once a scale (`seabed()`). Bubbles are drawn from sprites cached per colour and scale (a gradient each a frame lagged on phones), and a
   new row slides the cluster down instead of jumping. */

import { runArcade, drawMon, banner } from './arcade-kit.js';

const R = 15, COLS = 10, ROWH = R * Math.sqrt(3), TOP = 8, W = COLS * R * 2, H = 420;
const LINE = H - 78, GUN = [W / 2, H - 46], SPEED = 640, START_ROWS = 6;
const POP = 10, DROP = 20, AIM_SHOTS = 3, SWAP_X = W / 2 + 62;
/* the bubbles' colours: water, fire, grass, electric, psychic, and their glyphs */
const COLOURS = [['#3a8ae8', '#a8d4ff'], ['#e8523a', '#ffb8a0'], ['#4ab84a', '#b8f0a8'], ['#f0c020', '#fff0a0'], ['#b060d0', '#e8c0ff']];
const TAU = Math.PI * 2;

const sprites = new Map();
/** One bubble painted once at a scale, `r` units round, its canvas 1 unit wider each side. */
function bubbleSprite(colour, r, s) {
  const k = `${colour},${r},${s}`;
  if (sprites.has(k)) return sprites.get(k);
  const c = document.createElement('canvas'), px = Math.ceil((r + 1) * 2 * s);
  c.width = c.height = px;
  const g = c.getContext('2d');
  g.scale(s, s);
  const x = r + 1, y = r + 1, [base, light] = COLOURS[colour], grad = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  grad.addColorStop(0, light); grad.addColorStop(0.6, base); grad.addColorStop(1, base);
  g.fillStyle = grad; g.beginPath(); g.arc(x, y, r - 0.5, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255, 255, 255, 0.35)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.75)'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.45, r * 0.28, r * 0.16, -0.5, 0, TAU); g.fill();
  sprites.set(k, c);
  return c;
}

const WEEDS = [[6, 70, 0], [16, 46, 2], [W - 8, 64, 1], [W - 19, 40, 3]];
let bed = null;
/** The sea painted once a scale: deep water fading down, far rocks, the cave's rocky ceiling with stalactites, and the
    seabed under the line where Squirtle stands, sand, coral and shells. */
function seabed(scale) {
  if (bed?.scale === scale) return bed.cv;
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * scale); cv.height = Math.round(H * scale);
  const g = cv.getContext('2d');
  g.scale(scale, scale);
  const sea = g.createLinearGradient(0, 0, 0, LINE); sea.addColorStop(0, '#04203e'); sea.addColorStop(0.55, '#0c4a7e'); sea.addColorStop(1, '#1a78a8');
  g.fillStyle = sea; g.fillRect(0, 0, W, LINE + 6);
  const glow = g.createRadialGradient(W / 2, -40, 10, W / 2, -40, 260); glow.addColorStop(0, 'rgba(120, 220, 255, 0.35)'); glow.addColorStop(1, 'rgba(120, 220, 255, 0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, LINE);
  g.fillStyle = 'rgba(4, 30, 60, 0.55)';   // far rocks
  g.beginPath(); g.moveTo(0, LINE + 6);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, LINE - 30 - Math.abs(Math.sin(x * 0.031) * 40) - (x % 60 ? 0 : 14));
  g.lineTo(W, LINE + 6); g.fill();
  g.fillStyle = '#06182c'; g.fillRect(0, 0, W, TOP);   // the cave's ceiling
  for (let i = 0; i < 20; i++) { const x = i * 15 + 3, d = 5 + (i * 7) % 9; g.beginPath(); g.moveTo(x - 6, TOP); g.lineTo(x, TOP + d); g.lineTo(x + 7, TOP); g.fill(); }
  const sand = g.createLinearGradient(0, LINE + 6, 0, H); sand.addColorStop(0, '#c8a868'); sand.addColorStop(1, '#8a6a3a');
  g.fillStyle = sand; g.beginPath(); g.moveTo(0, LINE + 10);
  for (let x = 0; x <= W; x += 10) g.lineTo(x, LINE + 8 + Math.sin(x * 0.07) * 3);
  g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.fillStyle = 'rgba(255, 240, 200, 0.35)'; for (let i = 0; i < 40; i++) g.fillRect((i * 47) % W, LINE + 16 + (i * 13) % (H - LINE - 20), 1.5, 1.5);
  const coral = (x, y, c, s) => {   // a branching coral
    g.strokeStyle = c; g.lineCap = 'round';
    const branch = (bx, by, a, l, w) => { if (l < 4) return; const ex = bx + Math.cos(a) * l, ey = by + Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke(); branch(ex, ey, a - 0.5, l * 0.68, w * 0.75); branch(ex, ey, a + 0.45, l * 0.62, w * 0.75); };
    branch(x, y, -Math.PI / 2, 14 * s, 4 * s);
  };
  coral(22, H - 6, '#ff6a8a', 1.1); coral(W - 30, H - 4, '#ff9a4a', 1.2); coral(W - 12, H - 10, '#e85aa8', 0.8);
  for (const [x, c] of [[84, '#f0d0e0'], [W - 70, '#ffe0b0']]) { g.fillStyle = c; g.beginPath(); g.arc(x, H - 8, 5, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(120, 80, 60, 0.5)'; g.lineWidth = 0.8; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x, H - 8); g.lineTo(x + k * 2.2, H - 12.5); g.stroke(); } }
  bed = { scale, cv };
  return cv;
}

export const openBubble = (onClose) => runArcade({
  id: 'bubble', title: 'Squirtle Bubble Shooter', colour: '#3a8ae8', W, H,
  intro: 'Match three bubbles to pop them! Aim with the joystick, then press SHOOT.',
  go: 'Joystick to aim, SHOOT to fire. Tap the bubbles at the bottom to swap colours.',
  pad: [['SHOOT', 'fire']],
  help: [['Push the joystick left or right to aim, then press SHOOT.', 'The beam shows where it goes (arrow keys and Space work too). Bounce shots off the walls!'], ['Tap the bubbles at the bottom to swap.', 'The one in Squirtle\'s hands and the NEXT one trade places.'], ['Three or more of a colour touching pop.', `${POP} a bubble, and ${DROP} for each one left hanging that falls.`], ['Every few shots a new row pushes down.', 'Don\'t let them past the line!']],
  make(api) {
    let rows = [], flip = 0, angle = -Math.PI / 2, held = 0, shot = null, shots = 0, fired = 0, slide = 0, scale = 1, cur, next;
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
      slide += ROWH;
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
      fired++;
      cur = next; next = deal();
      api.sound('select');
    };
    const aimAt = (x, y) => { angle = Math.max(-Math.PI + 0.18, Math.min(-0.18, Math.atan2(y - GUN[1], x - GUN[0]))); };
    const onSwap = (x, y) => y > LINE + 6 && x > GUN[0] - R - 8 && x < SWAP_X + 26;
    const swap = () => { if (cur === next) return; [cur, next] = [next, cur]; api.sound('select'); };

    const bubble = (g, x, y, colour, r = R) => {
      const c = bubbleSprite(colour, r, scale);
      g.drawImage(c, x - r - 1, y - r - 1, c.width / scale, c.height / scale);
    };

    /** The launcher: a dial of ticks round the bubble, a glowing beam along the aim with chevrons streaming out and a
        bright head, all in the loaded bubble's colour. */
    const arrow = (g, now) => {
      const [base, light] = COLOURS[cur], cx = Math.cos(angle), cy = Math.sin(angle), nx = -cy, ny = cx;
      const [gx, gy] = GUN, pulse = Math.sin(now / 160);
      g.save();
      g.lineCap = 'round';
      for (let i = 0; i <= 16; i++) {   // the dial
        const a = -Math.PI + 0.18 + i * (Math.PI - 0.36) / 16, near = Math.abs(a - angle) < 0.12;
        g.strokeStyle = near ? light : 'rgba(168, 212, 255, 0.28)'; g.lineWidth = near ? 2.5 : 1.5;
        g.beginPath(); g.moveTo(gx + Math.cos(a) * (R + 9), gy + Math.sin(a) * (R + 9)); g.lineTo(gx + Math.cos(a) * (R + (i % 4 ? 13 : 16)), gy + Math.sin(a) * (R + (i % 4 ? 13 : 16))); g.stroke();
      }
      const len = 92, x0 = gx + cx * (R + 6), y0 = gy + cy * (R + 6), x1 = gx + cx * (R + len), y1 = gy + cy * (R + len);
      const beam = g.createLinearGradient(x0, y0, x1, y1);
      beam.addColorStop(0, base); beam.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.globalAlpha = 0.65; g.fillStyle = beam;   // the beam, a soft wedge
      g.beginPath(); g.moveTo(x0 + nx * 7, y0 + ny * 7); g.lineTo(x1 + nx * 2, y1 + ny * 2); g.lineTo(x1 - nx * 2, y1 - ny * 2); g.lineTo(x0 - nx * 7, y0 - ny * 7); g.fill();
      g.globalAlpha = 1;
      const t = (now / 600) % 1;
      for (let i = 0; i < 4; i++) {   // chevrons streaming out
        const f = (i + t) / 4, d = R + 14 + f * (len - 26), px = gx + cx * d, py = gy + cy * d, w = 7 - f * 3;
        g.globalAlpha = Math.sin(f * Math.PI) * 0.95;
        g.strokeStyle = light; g.lineWidth = 3;
        g.beginPath(); g.moveTo(px - cx * 5 + nx * w, py - cy * 5 + ny * w); g.lineTo(px, py); g.lineTo(px - cx * 5 - nx * w, py - cy * 5 - ny * w); g.stroke();
      }
      g.globalAlpha = 1;
      const hx = gx + cx * (R + 28 + pulse * 2), hy = gy + cy * (R + 28 + pulse * 2);   // the head
      g.fillStyle = light; g.globalAlpha = 0.35; g.beginPath(); g.arc(hx + cx * 4, hy + cy * 4, 15, 0, TAU); g.fill(); g.globalAlpha = 1;
      g.fillStyle = '#fff'; g.strokeStyle = base; g.lineWidth = 2; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(hx + cx * 15, hy + cy * 15); g.lineTo(hx - cx * 4 + nx * 12, hy - cy * 4 + ny * 12); g.lineTo(hx + cx * 2, hy + cy * 2); g.lineTo(hx - cx * 4 - nx * 12, hy - cy * 4 - ny * 12); g.closePath();
      g.fill(); g.stroke();
      g.restore();
    };

    return {
      tick(dt) {
        // the stick turns slowly at first for fine aim, then faster the longer it's held
        const turn = (pressed.right ? 1 : 0) - (pressed.left ? 1 : 0);
        held = turn ? held + dt : 0;
        const rate = 0.7 + Math.min(1.5, held * 2.2);
        if (turn) aimAt(GUN[0] + Math.cos(angle + turn * rate * dt) * 100, GUN[1] + Math.sin(angle + turn * rate * dt) * 100);
        if (shot) {
          const steps = 6;
          for (let i = 0; i < steps && shot; i++) {
            const lift = slide;
            shot.x += shot.vx * dt / steps; shot.y += shot.vy * dt / steps;
            if (shot.x < R) { shot.x = R; shot.vx = Math.abs(shot.vx); }
            if (shot.x > W - R) { shot.x = W - R; shot.vx = -Math.abs(shot.vx); }
            let hit = shot.y <= TOP + R;
            if (!hit) rows.forEach((row, r) => row.forEach((v, c) => { if (v === null || hit) return; const [px, py] = pos(r, c); if ((px - shot.x) ** 2 + (py - lift - shot.y) ** 2 < (R * 1.75) ** 2) hit = true; }));
            if (hit) { const s = shot; shot = null; land(s.x, s.y + lift, s.colour); }
          }
        }
        if (slide) { slide *= Math.exp(-dt * 9); if (slide < 0.2) slide = 0; }
        for (let i = falling.length - 1; i >= 0; i--) { const f = falling[i]; f.vy += 900 * dt; f.y += f.vy * dt; f.x += f.vx * dt; if (f.y > H + R) falling.splice(i, 1); }
        for (let i = bursts.length - 1; i >= 0; i--) if ((bursts[i].t += dt) > 0.35) bursts.splice(i, 1);
      },
      fire,
      down(x, y) { if (onSwap(x, y)) swap(); },
      key(k, down) { if (k === 'left' || k === 'right') pressed[k] = down; else if (k === 'act' && down) fire(); else if (k === 'down' && down) swap(); },
      draw(g, now) {
        scale = g.getTransform().a;
        g.drawImage(seabed(scale), 0, 0, W, H);
        g.fillStyle = 'rgba(200, 235, 255, 0.07)';   // light shafts drifting
        for (let i = 0; i < 4; i++) { const x = (i * 83 + now / 70) % (W + 80) - 26; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 26, 0); g.lineTo(x - 34, LINE); g.lineTo(x - 54, LINE); g.fill(); }
        for (const [sx, h, ph] of WEEDS) {   // kelp swaying up the walls
          g.strokeStyle = '#1e7a5a'; g.lineWidth = 5; g.lineCap = 'round';
          g.beginPath(); g.moveTo(sx, LINE + 6);
          for (let y = 1; y <= 6; y++) g.lineTo(sx + Math.sin(now / 700 + ph + y * 0.7) * y * 1.6, LINE + 6 - y * h / 6);
          g.stroke();
        }
        g.fillStyle = 'rgba(200, 235, 255, 0.35)';   // little bubbles rising
        for (let i = 0; i < 9; i++) { const y = LINE - ((i * 53 + now / 30) % (LINE + 6)), x = (i * 37) % W + Math.sin(now / 500 + i) * 4; g.beginPath(); g.arc(x, y, 1.2 + (i % 3) * 0.7, 0, TAU); g.fill(); }
        rows.forEach((row, r) => row.forEach((v, c) => { if (v === null) return; const [px, py] = pos(r, c); bubble(g, px, py - slide, v); }));
        for (const b of bursts) { g.strokeStyle = COLOURS[b.colour][1]; g.globalAlpha = 1 - b.t / 0.35; g.lineWidth = 2; g.beginPath(); g.arc(b.x, b.y, R * (1 + b.t * 3), 0, TAU); g.stroke(); g.globalAlpha = 1; }
        for (const f of falling) bubble(g, f.x, f.y, f.colour);
        g.strokeStyle = `rgba(255, 90, 90, ${0.5 + 0.3 * Math.sin(now / 200)})`; g.setLineDash([8, 6]); g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, LINE); g.lineTo(W, LINE); g.stroke(); g.setLineDash([]);
        // the aim: dots along the path for the first shots, one bounce shown; the arrow always
        if (!shot && fired < AIM_SHOTS) {
          let x = GUN[0], y = GUN[1], vx = Math.cos(angle), vy = Math.sin(angle);
          g.fillStyle = 'rgba(255, 255, 255, 0.7)';
          for (let i = 0; i < 26 && y > TOP + R; i++) {
            x += vx * 12; y += vy * 12;
            if (x < R || x > W - R) { vx = -vx; x = Math.max(R, Math.min(W - R, x)); }
            g.beginPath(); g.arc(x, y, i % 2 ? 1.6 : 2.4, 0, TAU); g.fill();
          }
        }
        if (!shot) arrow(g, now);
        drawMon(g, 'squirtle', GUN[0] - 34, H - 4, 50);
        bubble(g, GUN[0], GUN[1], cur);
        if (shot) bubble(g, shot.x, shot.y, shot.colour);
        bubble(g, SWAP_X, GUN[1] + 14, next, R * 0.8);
        banner(g, 'NEXT', SWAP_X, GUN[1] - 8, 9, '#a8d4ff');
        banner(g, '⇄', (GUN[0] + SWAP_X) / 2 + 2, GUN[1] + 8, 15, '#ffd84a');
        banner(g, 'TAP TO SWAP', (GUN[0] + SWAP_X) / 2 + 4, H - 9, 9, '#ffd84a');
        banner(g, `Row in ${pushEvery() - (shots % pushEvery())}`, 40, H - 22, 11, '#ffffff');
      },
    };
  },
}, onClose);
