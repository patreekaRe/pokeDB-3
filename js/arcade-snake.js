/* arcade-snake.js  -  Ekans Trail, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick), after Snake: Ekans
   winds round a meadow eating Berries, a segment longer and a little quicker with each. Now and then a golden Berry
   shows up for a while, worth more. Swipe, tap a side of the head or use the arrow keys; Ekans can't turn back on
   itself. Biting its own tail or hitting the fence ends it. */

import { runArcade, banner } from './arcade-kit.js';

const COLS = 15, ROWS = 19, C = 20, TOP = 0, W = COLS * C, H = ROWS * C;
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const BERRY = 10, GOLD = 50, GOLD_LIFE = 6, START = 0.17, FASTEST = 0.075;

export const openSnake = (onClose) => runArcade({
  id: 'snake', title: 'Ekans Trail', colour: '#8a4ab8', W, H,
  swipe: true,
  intro: 'Eat the Berries and don\'t bite your tail! Swipe to steer.',
  help: [['Swipe anywhere, or tap beside Ekans\'s head, to turn.', 'The arrow keys work too.'], ['Each Berry makes Ekans longer and a little quicker.', 'Hit the fence or your own tail and it\'s over.'], [`A Berry is ${BERRY}.`, `A golden Berry is ${GOLD}, but it vanishes after ${GOLD_LIFE} seconds.`]],
  make(api) {
    let body = [[4, 9], [3, 9], [2, 9]], prev = body.map(p => [...p]), dir = 'right', queue = [], step = START, acc = 0, wait = 0.5;
    let berry = null, gold = null, eaten = 0, swipe = null, dead = false, gulp = 0;
    const free = () => {
      for (let n = 0; n < 400; n++) {
        const p = [Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)];
        if (!body.some(b => b[0] === p[0] && b[1] === p[1]) && !(berry && berry[0] === p[0] && berry[1] === p[1]) && !(gold && gold.at[0] === p[0] && gold.at[1] === p[1])) return p;
      }
      return null;
    };
    berry = free();
    const opposite = (a, b) => DIRS[a][0] === -DIRS[b][0] && DIRS[a][1] === -DIRS[b][1];
    const turn = (d) => {
      if (dead || !DIRS[d]) return;
      const last = queue[queue.length - 1] || dir;
      if (d === last || opposite(d, last) || queue.length >= 2) return;
      queue.push(d);
    };
    const advance = () => {
      if (queue.length) dir = queue.shift();
      const [dx, dy] = DIRS[dir], head = [body[0][0] + dx, body[0][1] + dy];
      const grow = berry && head[0] === berry[0] && head[1] === berry[1], golden = gold && head[0] === gold.at[0] && head[1] === gold.at[1];
      prev = body.map(p => [...p]);
      const keep = grow || golden ? body : body.slice(0, -1);
      if (head[0] < 0 || head[0] >= COLS || head[1] < 0 || head[1] >= ROWS) { dead = true; return api.over('Ekans hit the fence!'); }
      if (keep.some(b => b[0] === head[0] && b[1] === head[1])) { dead = true; return api.over('Ekans bit its tail!'); }
      body = [head, ...keep];
      if (grow || golden) prev.push([...prev[prev.length - 1]]);
      if (grow) {
        eaten += 1; api.add(BERRY); api.sound('plink-2'); gulp = 0.25;
        step = Math.max(FASTEST, START - eaten * 0.004);
        berry = free();
        if (!gold && eaten % 5 === 0) gold = { at: free(), left: GOLD_LIFE };
        if (eaten % 10 === 0) api.say(`${eaten} Berries! Ekans is ${body.length} long.`);
      }
      if (golden) { api.add(GOLD); api.sound('coins', 'stat-up'); gold = null; gulp = 0.4; api.say(`A golden Berry! +${GOLD}`); }
    };
    const berryArt = (g, x, y, r, now, shine) => {
      const cx = x * C + C / 2, cy = TOP + y * C + C / 2 + Math.sin(now / 300 + x) * 1;
      g.fillStyle = 'rgba(0, 0, 0, 0.2)'; g.beginPath(); g.ellipse(cx, cy + r * 0.9, r * 0.8, r * 0.3, 0, 0, Math.PI * 2); g.fill();
      const bg = g.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      if (shine) { bg.addColorStop(0, '#fff6c0'); bg.addColorStop(0.5, '#f4c430'); bg.addColorStop(1, '#b07a10'); } else { bg.addColorStop(0, '#a8d0ff'); bg.addColorStop(0.55, '#3a7ae0'); bg.addColorStop(1, '#1a3a8a'); }
      g.fillStyle = bg; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4aa84e'; g.beginPath(); g.ellipse(cx + 3, cy - r + 1, 5, 2.5, -0.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#2e6a32'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy - r + 2); g.lineTo(cx - 1, cy - r - 3); g.stroke();
      if (shine) {
        const tw = 0.5 + 0.5 * Math.sin(now / 120);
        g.fillStyle = `rgba(255, 255, 255, ${tw})`;
        for (const [ox, oy, s] of [[-r - 3, -r, 3], [r + 2, r - 3, 2.4]]) { g.beginPath(); g.moveTo(cx + ox, cy + oy - s); g.lineTo(cx + ox + s / 3, cy + oy); g.lineTo(cx + ox, cy + oy + s); g.lineTo(cx + ox - s / 3, cy + oy); g.closePath(); g.fill(); g.beginPath(); g.moveTo(cx + ox - s, cy + oy); g.lineTo(cx + ox, cy + oy + s / 3); g.lineTo(cx + ox + s, cy + oy); g.lineTo(cx + ox, cy + oy - s / 3); g.closePath(); g.fill(); }
      }
    };
    return {
      tick(dt) {
        if (dead) return;
        gulp = Math.max(0, gulp - dt);
        if (gold && (gold.left -= dt) <= 0) gold = null;
        if (wait > 0) { wait -= dt; return; }
        acc += dt;
        while (acc >= step && !dead) { acc -= step; advance(); }
      },
      down(x, y) { swipe = [x, y, false]; },
      move(x, y, pressed) {
        if (!pressed || !swipe) return;
        const dx = x - swipe[0], dy = y - swipe[1];
        if (Math.hypot(dx, dy) < 14) return;
        swipe[2] = true; swipe[0] = x; swipe[1] = y;
        turn(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
      },
      up(x, y) {
        if (swipe && !swipe[2]) {
          const hx = (body[0][0] + 0.5) * C, hy = TOP + (body[0][1] + 0.5) * C, dx = x - hx, dy = y - hy;
          turn(DIRS[dir][0] ? (dy < 0 ? 'up' : 'down') : (dx < 0 ? 'left' : 'right'));
        }
        swipe = null;
      },
      key(k, down) { if (down) turn(k); },
      draw(g, now) {
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { g.fillStyle = (x + y) % 2 ? '#8ccf6a' : '#98d874'; g.fillRect(x * C, TOP + y * C, C, C); }
        g.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let i = 0; i < 14; i++) { const x = (i * 97) % W + 6, y = (i * 61) % H + 4; g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill(); }
        g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.strokeRect(1.5, TOP + 1.5, W - 3, H - 3);
        if (berry) berryArt(g, berry[0], berry[1], 7, now, false);
        if (gold?.at && (gold.left > 2 || Math.floor(now / 120) % 2)) berryArt(g, gold.at[0], gold.at[1], 8, now, true);
        const t = dead || wait > 0 ? 1 : Math.min(1, acc / step);
        const pts = body.map((p, i) => { const q = prev[i] || p; return [(q[0] + (p[0] - q[0]) * t + 0.5) * C, TOP + (q[1] + (p[1] - q[1]) * t + 0.5) * C]; });
        const n = pts.length;
        g.lineCap = 'round'; g.lineJoin = 'round';
        const path = () => { g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < n; i++) g.lineTo(...pts[i]); };
        g.strokeStyle = 'rgba(0, 0, 0, 0.18)'; g.lineWidth = C * 0.8; g.save(); g.translate(1.5, 2.5); path(); g.stroke(); g.restore();
        g.strokeStyle = '#5a2a80'; g.lineWidth = C * 0.82; path(); g.stroke();
        g.strokeStyle = '#9a5ac8'; g.lineWidth = C * 0.66; path(); g.stroke();
        for (let i = n - 1; i >= 1; i--) {
          const [x, y] = pts[i], r = C * (0.34 - 0.1 * Math.max(0, (i - (n - 4)) / 4));
          const sg = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
          sg.addColorStop(0, '#c89ae8'); sg.addColorStop(1, '#8a4ab8');
          g.fillStyle = sg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
          if (i % 3 === 0 && i < n - 1) { g.fillStyle = '#f0d050'; g.beginPath(); g.arc(x, y, r * 0.38, 0, Math.PI * 2); g.fill(); }
        }
        const [tx, ty] = pts[n - 1];
        g.fillStyle = '#f0d050'; g.beginPath(); g.arc(tx, ty, C * 0.2, 0, Math.PI * 2); g.fill();
        const [hx, hy] = pts[0], [dx, dy] = DIRS[queue[0] && t > 0.9 ? queue[0] : dir], a = Math.atan2(dy, dx), hr = C * 0.5 * (1 + gulp * 0.5);
        g.save(); g.translate(hx, hy); g.rotate(a);
        const hg = g.createRadialGradient(-2, -4, 2, 0, 0, hr);
        hg.addColorStop(0, '#d0a8f0'); hg.addColorStop(1, '#8a4ab8');
        g.fillStyle = hg; g.beginPath(); g.ellipse(1, 0, hr * 1.05, hr * 0.85, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#5a2a80'; g.lineWidth = 1.2; g.stroke();
        g.fillStyle = '#f0d050'; g.beginPath(); g.ellipse(hr * 0.55, 0, hr * 0.32, hr * 0.42, 0, 0, Math.PI * 2); g.fill();
        for (const s of [-1, 1]) {
          g.fillStyle = '#fff'; g.beginPath(); g.ellipse(hr * 0.2, s * hr * 0.42, hr * 0.26, hr * 0.22, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#d02a2a'; g.beginPath(); g.arc(hr * 0.28, s * hr * 0.42, hr * 0.13, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#1a1020'; g.beginPath(); g.ellipse(hr * 0.3, s * hr * 0.42, hr * 0.04, hr * 0.11, 0, 0, Math.PI * 2); g.fill();
        }
        if (Math.floor(now / 400) % 3 === 0 && !dead) {
          g.strokeStyle = '#e03050'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(hr * 1.05, 0); g.lineTo(hr * 1.5, 0); g.lineTo(hr * 1.7, -3); g.moveTo(hr * 1.5, 0); g.lineTo(hr * 1.7, 3); g.stroke();
        }
        g.restore();
        if (dead) banner(g, '✕', hx, hy - C, 16, '#ff6a6a');
        if (api.score > 0) banner(g, String(api.score), W / 2, 22, 22, 'rgba(255, 255, 255, 0.85)');
      },
    };
  },
}, onClose);
