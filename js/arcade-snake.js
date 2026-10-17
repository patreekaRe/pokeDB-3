/* arcade-snake.js  -  Ekans Trail, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick), after Snake: Ekans
   winds round a field eating Berries, a segment longer and a little quicker with each. Swipe, tap a side of the head or
   use the arrow keys; Ekans can't turn back on itself. Biting its own tail, a wall or the fence ends it.
   Since 2026-10-17 (the user's ask: every arcade game far more detailed, with more in it, and harder the longer you
   last): stages. Eat a stage's Berries and the next field opens, painted in its own season (meadow, forest, beach,
   autumn) with fences, rocks and hedges laid out inside it, Ekans back to its short self but quicker each stage. Berries
   eaten in quick succession build a multiplier up to x4. Special finds: a golden Razz Berry (worth more, gone in a few
   seconds), a Chesto Berry that slows time, and a Rare Candy that sheds three segments. From stage 3 Diglett pop out of
   the ground (a dirt mound warns first) and biting one ends it, two at a time from stage 6. Past the eighth field the
   stages come round again quicker. */

import { runArcade, banner, stamp, rand, drawMon } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const COLS = 15, ROWS = 19, C = 20, TOP = 0, W = COLS * C, H = ROWS * C, TAU = Math.PI * 2;
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const BERRY = 10, GOLD = 50, GOLD_LIFE = 6, CANDY = 30, START = 0.17, FASTEST = 0.062, COMBO_S = 2.6;
/* each stage's walls as [x, y, w, h] blocks; row 9's left half stays clear for Ekans to start in */
const STAGES = [
  { name: 'Open Meadow', walls: [] },
  { name: 'Four Corners', walls: [[1, 1, 3, 1], [1, 1, 1, 3], [11, 1, 3, 1], [13, 1, 1, 3], [1, 17, 3, 1], [1, 15, 1, 3], [11, 17, 3, 1], [13, 15, 1, 3]] },
  { name: 'Twin Fences', walls: [[4, 4, 7, 1], [4, 14, 7, 1]] },
  { name: 'Pillars', walls: [[3, 2, 1, 5], [11, 2, 1, 5], [3, 12, 1, 5], [11, 12, 1, 5], [7, 4, 1, 4], [7, 11, 1, 4]] },
  { name: 'The Pen', walls: [[4, 5, 7, 1], [4, 13, 7, 1], [4, 5, 1, 3], [4, 11, 1, 3], [10, 5, 1, 3], [10, 11, 1, 3]] },
  { name: 'Comb', walls: [[3, 0, 1, 6], [7, 0, 1, 6], [11, 0, 1, 6], [5, 13, 1, 6], [9, 13, 1, 6], [13, 13, 1, 6]] },
  { name: 'Boulder Field', walls: [[2, 3, 2, 2], [6, 2, 2, 2], [11, 4, 2, 2], [9, 13, 2, 2], [3, 14, 2, 2], [12, 15, 2, 2], [7, 6, 1, 1], [7, 12, 1, 1], [12, 9, 1, 1]] },
  { name: 'Labyrinth', walls: [[0, 4, 6, 1], [9, 4, 6, 1], [0, 14, 6, 1], [9, 14, 6, 1], [7, 0, 1, 3], [7, 16, 1, 3], [12, 7, 1, 5], [7, 7, 1, 1], [7, 11, 1, 1]] },
];
/* [grass a, grass b, speck, wall kind, name] */
const THEMES = [['#8ccf6a', '#98d874', 'rgba(255, 255, 255, 0.35)', 'fence'], ['#5a9a4a', '#64a452', 'rgba(255, 220, 120, 0.3)', 'hedge'], ['#e8d49a', '#f0dca4', 'rgba(255, 255, 255, 0.45)', 'rock'], ['#c8a050', '#d0aa5a', 'rgba(255, 120, 40, 0.4)', 'fence']];

export const openSnake = (onClose) => runArcade({
  id: 'snake', title: 'Ekans Trail', colour: '#8a4ab8', W, H,
  swipe: true,
  sounds: ['fx-pop', 'fx-ding', 'fx-heal', 'hit'],
  intro: 'Eat the Berries and don\'t bite your tail! Swipe to steer.',
  help: [['Swipe anywhere, or tap beside Ekans\'s head, to turn.', 'The arrow keys work too.'], ['Each Berry makes Ekans longer and quicker.', 'Hit a wall, the fence or your own tail and it\'s over.'], ['Eat a stage\'s Berries to open the next field.', 'Each stage is quicker, with new walls. Diglett pop up from stage 3: don\'t bite them!'], [`Eat Berries quickly for up to x4.`, `Golden Razz ${GOLD} (gone in ${GOLD_LIFE} seconds), Chesto slows time, Rare Candy sheds three segments.`]],
  make(api) {
    let stage = 0, body, prev, dir, queue, step, acc, wait, berry, gold, chesto, candy, eaten, swipe = null, dead = false, gulp = 0, combo = 0, comboT = 0, slow = 0, shake = 0, clear = 0, flash = 0;
    let wall, digs = [], digT = 4;
    const bits = [], pops = [], calm = calmFx();
    const def = () => STAGES[stage % STAGES.length];
    const goal = () => Math.min(22, 10 + stage * 2);
    const theme = () => THEMES[stage % THEMES.length];
    const at = (list, p) => list.some(b => b[0] === p[0] && b[1] === p[1]);
    const setUp = () => {
      wall = new Set();
      for (const [x, y, w, h] of def().walls) for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) wall.add(`${x + i},${y + j}`);
      body = [[4, 9], [3, 9], [2, 9]]; prev = body.map(p => [...p]); dir = 'right'; queue = []; acc = 0; wait = 0.8;
      step = Math.max(FASTEST, START - stage * 0.009);
      eaten = 0; gold = null; chesto = null; candy = null; digs = []; digT = 4; slow = 0;
      berry = free();
    };
    const taken = (p) => wall.has(`${p[0]},${p[1]}`) || at(body, p) || (berry && at([berry], p)) || (gold && at([gold.at], p)) || (chesto && at([chesto.at], p)) || (candy && at([candy.at], p)) || digs.some(d => d.x === p[0] && d.y === p[1]);
    function free(far = 0) {
      for (let n = 0; n < 500; n++) {
        const p = [Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)];
        if (taken(p)) continue;
        if (far && body && Math.abs(p[0] - body[0][0]) + Math.abs(p[1] - body[0][1]) < far) continue;
        return p;
      }
      return null;
    }
    setUp();
    const popup = (p, text, c = '#fff') => pops.push({ x: (p[0] + 0.5) * C, y: TOP + p[1] * C, text, c, t: 0.9 });
    const burst = (p, c, n = 10) => { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(30, 110); bits.push({ x: (p[0] + 0.5) * C, y: TOP + (p[1] + 0.5) * C, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.3, 0.6), c }); } };
    const opposite = (a, b) => DIRS[a][0] === -DIRS[b][0] && DIRS[a][1] === -DIRS[b][1];
    const turn = (d) => {
      if (dead || !DIRS[d]) return;
      const last = queue[queue.length - 1] || dir;
      if (d === last || opposite(d, last) || queue.length >= 2) return;
      queue.push(d);
    };
    const die = (why) => { dead = true; if (!calm) shake = 6; flash = 0.4; api.sound('hit', 'cancel'); api.over(why); };
    const score = (base, p, c) => {
      combo = comboT > 0 ? Math.min(4, combo + 1) : 1; comboT = COMBO_S;
      const pts = base * combo;
      api.add(pts); popup(p, combo > 1 ? `+${pts} x${combo}` : `+${pts}`, c);
      return pts;
    };
    const advance = () => {
      if (queue.length) dir = queue.shift();
      const [dx, dy] = DIRS[dir], head = [body[0][0] + dx, body[0][1] + dy];
      const grow = berry && head[0] === berry[0] && head[1] === berry[1], golden = gold && at([gold.at], head);
      prev = body.map(p => [...p]);
      const keep = grow || golden ? body : body.slice(0, -1);
      if (head[0] < 0 || head[0] >= COLS || head[1] < 0 || head[1] >= ROWS) return die('Ekans hit the fence!');
      if (wall.has(`${head[0]},${head[1]}`)) return die(`Ekans hit the ${theme()[3]}!`);
      if (digs.some(d => d.x === head[0] && d.y === head[1] && d.up > 0)) return die('Ekans bit a Diglett!');
      if (at(keep, head)) return die('Ekans bit its tail!');
      body = [head, ...keep];
      if (grow || golden) prev.push([...prev[prev.length - 1]]);
      if (grow) {
        eaten += 1; score(BERRY, head, '#cfe0ff'); api.sound('plink-2'); gulp = 0.25; burst(head, '#6aa0ff', 8);
        step = Math.max(FASTEST, step - 0.0035);
        if (eaten >= goal()) return next();
        berry = free();
        if (!gold && eaten % 5 === 0) gold = { at: free(4), left: GOLD_LIFE };
        if (!chesto && Math.random() < 0.12) chesto = { at: free(4), left: 9 };
        if (!candy && body.length > 10 && Math.random() < 0.14) candy = { at: free(4), left: 9 };
      }
      if (golden) { score(GOLD, head, '#ffd84a'); api.sound('coins', 'stat-up'); gold = null; gulp = 0.4; burst(head, '#ffd84a', 14); api.say(`A golden Razz Berry! +${GOLD * combo}`); }
      if (chesto && at([chesto.at], head)) { chesto = null; slow = 5; api.add(15); popup(head, 'SLOW', '#d0a8ff'); api.sound('fx-heal', 'stat-up'); api.say('A Chesto Berry! Time slows for a moment.'); burst(head, '#b07ae0'); }
      if (candy && at([candy.at], head)) { candy = null; api.add(CANDY); popup(head, `+${CANDY}`, '#ffb0e0'); api.sound('fx-ding', 'stat-up'); burst(head, '#ff9ad0', 12); const shed = Math.min(3, body.length - 3); for (let i = 0; i < shed; i++) { burst(body[body.length - 1], '#9a5ac8', 4); body.pop(); prev.pop(); } api.say('A Rare Candy! Ekans sheds three segments.'); }
    };
    const next = () => {
      const bonus = 100 + stage * 75 + body.length * 5;
      api.add(bonus); stage += 1; clear = 2;
      api.sound('stat-up', 'coins');
      api.say(`Stage clear! +${bonus}. Stage ${stage + 1}: ${def().name}${stage === 2 ? '. Watch for Diglett!' : stage % STAGES.length === 0 ? ', quicker than ever!' : '.'}`);
      setUp();
    };
    const digger = () => {
      if (stage < 2) return;
      const most = stage >= 5 ? 2 : 1;
      if (digs.length >= most) return;
      const p = free(5);
      if (p) digs.push({ x: p[0], y: p[1], warn: 0.9, up: 0, life: 2.6 + Math.min(2, stage * 0.2) });
    };
    return {
      tick(dt) {
        if (dead) return;
        gulp = Math.max(0, gulp - dt); shake = Math.max(0, shake - dt * 25); clear = Math.max(0, clear - dt); flash = Math.max(0, flash - dt);
        if ((comboT -= dt) <= 0) { comboT = 0; combo = 0; }
        for (const s of bits) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.92; s.vy *= 0.92; s.t -= dt; }
        for (let i = bits.length - 1; i >= 0; i--) if (bits[i].t <= 0) bits.splice(i, 1);
        for (let i = pops.length - 1; i >= 0; i--) { pops[i].t -= dt; pops[i].y -= 26 * dt; if (pops[i].t <= 0) pops.splice(i, 1); }
        if (gold && (gold.left -= dt) <= 0) gold = null;
        if (chesto && (chesto.left -= dt) <= 0) chesto = null;
        if (candy && (candy.left -= dt) <= 0) candy = null;
        for (let i = digs.length - 1; i >= 0; i--) {
          const d = digs[i];
          if (d.warn > 0) { if ((d.warn -= dt) <= 0) { d.up = d.life; api.sound('fx-pop', 'plink-1'); } }
          else if ((d.up -= dt) <= 0) digs.splice(i, 1);
        }
        if ((digT -= dt) <= 0) { digT = Math.max(1.6, 4.5 - stage * 0.25); digger(); }
        slow = Math.max(0, slow - dt);
        if (wait > 0) { wait -= dt; return; }
        acc += dt * (slow > 0 ? 0.6 : 1);
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
        const n0 = stage % STAGES.length;
        stamp(g, `sn-field-${n0}`, 0, 0, W, TOP + H, (cg) => field(cg, n0));
        g.save();
        if (shake) g.translate(rand(-shake, shake), rand(-shake, shake));
        for (const d of digs) {
          const cx = (d.x + 0.5) * C, cy = TOP + (d.y + 0.5) * C;
          g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(cx, cy + 5, 8, 4, 0, 0, TAU); g.fill();
          g.fillStyle = '#4a2c18'; g.beginPath(); g.ellipse(cx, cy + 5, 5, 2.4, 0, 0, TAU); g.fill();
          if (d.warn > 0) { g.fillStyle = '#8a6a3a'; for (let i = 0; i < 3; i++) g.fillRect(cx - 6 + i * 5 + Math.sin(now / 40 + i) * 1.2, cy + 1 - (i % 2) * 2, 2, 2); }
          else { const rise = Math.min(1, (d.life - d.up) * 6, d.up * 6); drawMon(g, 'diglett', cx, cy + 6, 6 + 16 * rise); }
        }
        const pulse = (p, r) => [(p[0] + 0.5) * C, TOP + (p[1] + 0.5) * C + Math.sin(now / 300 + p[0]) * 1, r];
        if (berry) stamp(g, 'sn-berry-oran', berry[0] * C - 2, TOP + berry[1] * C - 4 + Math.sin(now / 300 + berry[0]), C + 4, C + 6, (cg) => berryArt(cg, '#a8d0ff', '#3a7ae0', '#1a3a8a'));
        if (gold?.at && (gold.left > 2 || Math.floor(now / 120) % 2)) {
          stamp(g, 'sn-berry-gold', gold.at[0] * C - 2, TOP + gold.at[1] * C - 4, C + 4, C + 6, (cg) => berryArt(cg, '#fff6c0', '#f4c430', '#b07a10'));
          const [cx, cy] = pulse(gold.at, 8), tw = 0.5 + 0.5 * Math.sin(now / 120);
          g.fillStyle = `rgba(255, 255, 255, ${tw})`; g.fillRect(cx - 11, cy - 9, 2, 2); g.fillRect(cx + 9, cy + 5, 2, 2);
        }
        if (chesto && (chesto.left > 2 || Math.floor(now / 120) % 2)) stamp(g, 'sn-berry-chesto', chesto.at[0] * C - 2, TOP + chesto.at[1] * C - 4, C + 4, C + 6, (cg) => berryArt(cg, '#e8c8ff', '#8a4ae0', '#3a1a6a'));
        if (candy && (candy.left > 2 || Math.floor(now / 120) % 2)) stamp(g, 'sn-candy', candy.at[0] * C, TOP + candy.at[1] * C, C, C, candyArt);
        const t = dead || wait > 0 ? 1 : Math.min(1, acc / step);
        const pts = body.map((p, i) => { const q = prev[i] || p; return [(q[0] + (p[0] - q[0]) * t + 0.5) * C, TOP + (q[1] + (p[1] - q[1]) * t + 0.5) * C]; });
        const n = pts.length;
        g.lineCap = 'round'; g.lineJoin = 'round';
        const path = () => { g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < n; i++) g.lineTo(...pts[i]); };
        g.strokeStyle = 'rgba(0, 0, 0, 0.18)'; g.lineWidth = C * 0.8; g.save(); g.translate(1.5, 2.5); path(); g.stroke(); g.restore();
        g.strokeStyle = '#5a2a80'; g.lineWidth = C * 0.82; path(); g.stroke();
        g.strokeStyle = slow > 0 ? '#b08ae0' : '#9a5ac8'; g.lineWidth = C * 0.66; path(); g.stroke();
        for (let i = n - 1; i >= 1; i--) {
          const [x, y] = pts[i], r = C * (0.34 - 0.1 * Math.max(0, (i - (n - 4)) / 4));
          const q = Math.round(r * 4) / 4;
          stamp(g, `sn-seg${q}`, x - q, y - q, q * 2, q * 2, (g) => {
            const sg = g.createRadialGradient(q * 0.65, q * 0.6, q * 0.1, q, q, q);
            sg.addColorStop(0, '#c89ae8'); sg.addColorStop(1, '#8a4ab8');
            g.fillStyle = sg; g.beginPath(); g.arc(q, q, q, 0, TAU); g.fill();
          });
          if (i % 3 === 0 && i < n - 1) { g.fillStyle = '#f0d050'; g.beginPath(); g.arc(x, y, r * 0.38, 0, TAU); g.fill(); }
        }
        const [tx, ty] = pts[n - 1];
        g.fillStyle = '#f0d050'; g.beginPath(); g.arc(tx, ty, C * 0.2, 0, TAU); g.fill();
        const [hx, hy] = pts[0], [dx, dy] = DIRS[queue[0] && t > 0.9 ? queue[0] : dir], a = Math.atan2(dy, dx), hr = C * 0.5 * (1 + gulp * 0.5);
        g.save(); g.translate(hx, hy); g.rotate(a);
        g.fillStyle = '#5a2a80'; g.beginPath(); g.ellipse(1, 0, hr * 1.05 + 1, hr * 0.85 + 1, 0, 0, TAU); g.fill();
        g.fillStyle = '#a868d8'; g.beginPath(); g.ellipse(1, 0, hr * 1.05, hr * 0.85, 0, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255, 255, 255, 0.3)'; g.beginPath(); g.ellipse(-2, -hr * 0.35, hr * 0.5, hr * 0.22, 0, 0, TAU); g.fill();
        g.fillStyle = '#f0d050'; g.beginPath(); g.ellipse(hr * 0.55, 0, hr * 0.32, hr * 0.42, 0, 0, TAU); g.fill();
        for (const s of [-1, 1]) {
          g.fillStyle = '#fff'; g.beginPath(); g.ellipse(hr * 0.2, s * hr * 0.42, hr * 0.26, hr * 0.22, 0, 0, TAU); g.fill();
          g.fillStyle = '#d02a2a'; g.beginPath(); g.arc(hr * 0.28, s * hr * 0.42, hr * 0.13, 0, TAU); g.fill();
          g.fillStyle = '#1a1020'; g.beginPath(); g.ellipse(hr * 0.3, s * hr * 0.42, hr * 0.04, hr * 0.11, 0, 0, TAU); g.fill();
        }
        if (Math.floor(now / 400) % 3 === 0 && !dead) {
          g.strokeStyle = '#e03050'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(hr * 1.05, 0); g.lineTo(hr * 1.5, 0); g.lineTo(hr * 1.7, -3); g.moveTo(hr * 1.5, 0); g.lineTo(hr * 1.7, 3); g.stroke();
        }
        g.restore();
        for (const s of bits) { g.globalAlpha = Math.max(0, s.t * 1.8); g.fillStyle = s.c; g.fillRect(s.x - 1.3, s.y - 1.3, 2.6, 2.6); }
        g.globalAlpha = 1;
        g.font = '800 11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (const p of pops) { g.globalAlpha = Math.min(1, p.t * 2); g.fillStyle = 'rgba(0, 0, 0, 0.6)'; g.fillText(p.text, p.x + 1, p.y + 1); g.fillStyle = p.c; g.fillText(p.text, p.x, p.y); }
        g.globalAlpha = 1;
        if (dead) banner(g, '✕', hx, hy - C, 16, '#ff6a6a');
        g.restore();
        if (flash) { g.fillStyle = `rgba(255, 60, 60, ${flash * 0.6})`; g.fillRect(0, 0, W, H); }
        g.fillStyle = 'rgba(20, 10, 30, 0.45)'; g.beginPath(); g.roundRect(4, 4, 112, 16, 8); g.fill();
        g.fillStyle = 'rgba(255, 255, 255, 0.25)'; g.fillRect(48, 10, 62, 4);
        g.fillStyle = '#7ad0ff'; g.fillRect(48, 10, 62 * Math.min(1, eaten / goal()), 4);
        g.font = '800 10px system-ui, sans-serif'; g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText(`STAGE ${stage + 1}`, 9, 12.5);
        if (api.score > 0) banner(g, String(api.score), W / 2 + 30, 13, 16, 'rgba(255, 255, 255, 0.9)');
        if (combo > 1) banner(g, `x${combo}`, W - 22, 13, 14 + (comboT / COMBO_S) * 4, '#ffd84a');
        if (slow > 0) banner(g, 'SLOW', W - 22, 32, 11, '#d0a8ff');
        if (clear > 0) { g.globalAlpha = Math.min(1, clear * 1.5); banner(g, `STAGE ${stage + 1}`, W / 2, H * 0.4, 30, '#ffd84a'); banner(g, def().name.toUpperCase(), W / 2, H * 0.4 + 26, 13, '#fff'); g.globalAlpha = 1; }
      },
    };
  },
}, onClose);

/** A Berry in a (C + 4) x (C + 6) box: its shadow, a glossy body, a leaf and stalk. */
function berryArt(g, light, mid, dark) {
  const cx = C / 2 + 2, cy = C / 2 + 4, r = 7;
  g.fillStyle = 'rgba(0, 0, 0, 0.2)'; g.beginPath(); g.ellipse(cx, cy + r * 0.9, r * 0.8, r * 0.3, 0, 0, TAU); g.fill();
  const bg = g.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
  bg.addColorStop(0, light); bg.addColorStop(0.55, mid); bg.addColorStop(1, dark);
  g.fillStyle = bg; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.7)'; g.beginPath(); g.ellipse(cx - 2.5, cy - 3, 2, 1.2, -0.6, 0, TAU); g.fill();
  g.fillStyle = '#4aa84e'; g.beginPath(); g.ellipse(cx + 3, cy - r + 1, 5, 2.5, -0.5, 0, TAU); g.fill();
  g.strokeStyle = '#2e6a32'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, cy - r + 2); g.lineTo(cx - 1, cy - r - 3); g.stroke();
}
/** A Rare Candy in a C x C box: a blue sweet wrapped with twisted ends. */
function candyArt(g) {
  const cx = C / 2, cy = C / 2;
  g.fillStyle = '#e8e8f0';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 5, cy); g.lineTo(cx + s * 10, cy - 4); g.lineTo(cx + s * 10, cy + 4); g.closePath(); g.fill(); }
  g.fillStyle = '#4a7af0'; g.beginPath(); g.ellipse(cx, cy, 6.5, 5.5, 0, 0, TAU); g.fill();
  g.strokeStyle = '#1a3a8a'; g.lineWidth = 1; g.stroke();
  g.fillStyle = '#fff'; g.font = '800 7px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('R', cx, cy + 0.5);
  g.fillStyle = 'rgba(255, 255, 255, 0.6)'; g.beginPath(); g.ellipse(cx - 2.5, cy - 2.5, 2, 1, -0.5, 0, TAU); g.fill();
}

/** A stage's field painted once: checked grass in its season, flowers or shells, the walls inside (a picket fence,
    a hedge or a rock pile by the theme) and the wooden fence round the edge. */
function field(g, n) {
  const [a, b, speck, kind] = THEMES[n % THEMES.length], walls = STAGES[n].walls;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { g.fillStyle = (x + y) % 2 ? a : b; g.fillRect(x * C, TOP + y * C, C, C); }
  g.fillStyle = speck;
  for (let i = 0; i < 26; i++) { const x = (i * 97 + n * 13) % W + 6, y = (i * 61 + n * 29) % H + 4; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(0, 0, 0, 0.12)'; g.lineWidth = 1;   // tufts
  for (let i = 0; i < 30; i++) { const x = (i * 53 + n * 7) % W, y = (i * 71 + n * 11) % H; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1.5, y - 4); g.moveTo(x + 2, y); g.lineTo(x + 2.5, y - 4); g.stroke(); }
  if (n % THEMES.length === 2) { g.fillStyle = 'rgba(80, 160, 220, 0.25)'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse((i * 113 + 40) % W, (i * 157 + 60) % H, 12, 5, 0, 0, TAU); g.fill(); } }
  if (n % THEMES.length === 3) { const leaf = ['#e86a2a', '#d84a1a', '#f0a030']; for (let i = 0; i < 24; i++) { g.fillStyle = leaf[i % 3]; g.beginPath(); g.ellipse((i * 67 + 9) % W, (i * 43 + 15) % H, 3, 1.6, i, 0, TAU); g.fill(); } }
  for (const [wx, wy, w, h] of walls) for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const x = (wx + i) * C, y = TOP + (wy + j) * C;
    g.fillStyle = 'rgba(0, 0, 0, 0.22)'; g.fillRect(x + 2, y + 3, C, C);
    if (kind === 'rock') {
      g.fillStyle = '#8a8478'; g.beginPath(); g.roundRect(x + 1, y + 1, C - 2, C - 2, 6); g.fill();
      g.fillStyle = '#a8a294'; g.beginPath(); g.roundRect(x + 3, y + 2, C - 8, C - 9, 4); g.fill();
      g.fillStyle = 'rgba(40, 30, 20, 0.3)'; g.beginPath(); g.arc(x + 13, y + 13, 2, 0, TAU); g.fill();
    } else if (kind === 'hedge') {
      g.fillStyle = '#2a6a2a'; g.fillRect(x, y, C, C);
      for (const [ox, oy] of [[5, 5], [14, 6], [7, 14], [15, 14], [10, 10]]) { g.fillStyle = '#3a8a3a'; g.beginPath(); g.arc(x + ox, y + oy, 5, 0, TAU); g.fill(); g.fillStyle = 'rgba(255, 255, 255, 0.12)'; g.beginPath(); g.arc(x + ox - 1.5, y + oy - 1.5, 2, 0, TAU); g.fill(); }
    } else {
      g.fillStyle = '#7a5430'; g.fillRect(x, y + 6, C, 3); g.fillRect(x, y + 13, C, 3);
      g.fillStyle = '#f4ecd8'; g.fillRect(x + 3, y + 2, 5, C - 3); g.fillRect(x + 12, y + 2, 5, C - 3);
      g.fillStyle = '#c8bca0'; g.fillRect(x + 6, y + 2, 2, C - 3); g.fillRect(x + 15, y + 2, 2, C - 3);
    }
  }
  g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.strokeRect(1.5, TOP + 1.5, W - 3, H - 3);
  g.fillStyle = '#8a6a3a'; for (let x = 0; x < W; x += 30) { g.fillRect(x, 0, 3, 3); g.fillRect(x, H - 3, 3, 3); }
}
