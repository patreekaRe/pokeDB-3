/* arcade-maze.js  -  Gastly Maze, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick), after Pac-Man:
   Pikachu eats the Oran Berries round a haunted maze while ghosts hunt it. A Lum Berry in each corner turns them pale
   and frightened for a while, and Pikachu can zap them back to their den. Swipe, tap a side or use the arrow keys.
   A tunnel through each side wall wraps to the other side.
   Since 2026-10-17 (the user's ask: every arcade game far more detailed, with more in it, and harder the longer you
   last): four mazes in turn (Pokémon Tower, Lavender, the Old Chateau, the Crossroads), each painted in its own glow,
   and four ghosts with Pac-Man's personalities: Gastly chases, Haunter cuts Pikachu off ahead, Gengar flanks from
   Gastly's side, and Misdreavus loses its nerve close up. They scatter to their corners now and then, less as the
   mazes go on. Zaps chain 200, 400, 800, 1600; a bonus Berry shows twice a maze, worth more each maze; an extra life at
   every 10,000. Each maze the ghosts are quicker, frightened for less time, out of the den sooner, and Gastly speeds up
   when the berries run low. */

import { runArcade, drawMon, banner, stamp, rand } from './arcade-kit.js';
import { calmFx } from './prefs.js';

/* # wall, . berry, o Lum Berry, G the ghosts' den, P Pikachu, T a tunnel to the other side */
const MAZES = [
  { name: 'Pokémon Tower', glow: ['#4a2a8a', '#8a6af0', '#140c26'], rows: [
    '###############',
    '#o.....#.....o#',
    '#.###.....###.#',
    '#.............#',
    '#.##.#.#.#.##.#',
    '#....#.G.#....#',
    '###.##...##.###',
    'T.....#.#.....T',
    '#.###.....###.#',
    '#o..#.###.#..o#',
    '#.#.#..P..#.#.#',
    '#.............#',
    '###############',
  ] },
  { name: 'Lavender', glow: ['#1a5a6a', '#4ae0d0', '#08161c'], rows: [
    '###############',
    '#o...#...#...o#',
    '#.#..#.#.#..#.#',
    '#.#....#....#.#',
    '#.##.#####.##.#',
    '#....#.G.#....#',
    'T.##.#...#.##.T',
    '#....##.##....#',
    '#.##.......##.#',
    '#o.#.##.##.#.o#',
    '#..#...P...#..#',
    '#....#...#....#',
    '###############',
  ] },
  { name: 'Old Chateau', glow: ['#6a1a2a', '#f06a7a', '#1c080c'], rows: [
    '###############',
    '#o...........o#',
    '#.###.#.#.###.#',
    '#.#.........#.#',
    '#.#.##.#.##.#.#',
    '#....#.G.#....#',
    '####.#...#.####',
    'T....##.##....T',
    '#.##.......##.#',
    '#.#..#.#.#..#.#',
    '#o..##.P.##..o#',
    '#.............#',
    '###############',
  ] },
  { name: 'Crossroads', glow: ['#2a5a1a', '#8af06a', '#0c1608'], rows: [
    '###############',
    '#o.#.......#.o#',
    '#..#.##.##.#..#',
    '##...#...#...##',
    'T..#...#...#..T',
    '#.##.#.G.#.##.#',
    '#....#...#....#',
    '#.##.##.##.##.#',
    '#..#.......#..#',
    '##.#.#...#.#.##',
    '#o....#P#....o#',
    '#.............#',
    '###############',
  ] },
];
const C = 20, TOP = 22, COLS = 15, ROWS = 13, W = COLS * C, H = ROWS * C + TOP, TAU = Math.PI * 2;
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const wrap = (x) => (x + COLS) % COLS;
const LIVES = 3, DOT = 10, LUM = 50, LIFE_AT = 10000;
/* the ghosts: [sprite, personality, scatter corner] */
const GHOSTS = [['gastly', 'chase', [COLS - 2, -2]], ['haunter', 'ahead', [1, -2]], ['gengar', 'flank', [COLS - 1, ROWS + 1]], ['misdreavus', 'shy', [0, ROWS + 1]]];
const FRUITS = [['Razz', '#e83a5a', '#4aa84e', 100], ['Pecha', '#ffa0c0', '#4aa84e', 300], ['Leppa', '#e8603a', '#3a8a3a', 500], ['Sitrus', '#f0d040', '#4aa84e', 700], ['Lansat', '#e04040', '#c8a030', 1000], ['Starf', '#6ad0f0', '#e8e8f8', 2000]];

export const openMaze = (onClose) => runArcade({
  id: 'maze', title: 'Gastly Maze', colour: '#7a4ac8', W, H,
  keys: { left: [['◀', 'left'], ['▶', 'right']], right: [['▲', 'up'], ['▼', 'down']] },
  sounds: ['fx-zap', 'fx-ding', 'fx-pop', 'hit'],
  intro: 'Eat every berry and dodge the ghosts! Steer with the arrows.',
  help: [['Steer Pikachu with the big arrow buttons:', '◀ ▶ under your left thumb, ▲ ▼ under your right. Swiping or the arrow keys work too.'], ['Eat every Oran Berry to clear the maze.', 'A Lum Berry frightens the ghosts: zap them for 200, 400, 800, 1600!'], ['Each ghost hunts its own way:', 'Gastly chases, Haunter heads you off, Gengar flanks, Misdreavus is shy up close.'], [`Bonus Berries appear twice a maze. ${LIVES} lives,`, `one more every ${LIFE_AT.toLocaleString()}. Each maze is quicker and the fright shorter.`]],
  make(api) {
    let maze, food, total, left, lives = LIVES, level = 0, scared = 0, chain = 0, pause = 1.2, swipe = null, acc = 0, mode = 0, modeT = 0, dying = 0, clearing = 0, fruit = null, shake = 0, nextLife = LIFE_AT, t = 0;
    const pops = [], bits = [], calm = calmFx();
    const M = () => maze.rows;
    const find = (ch) => { const y = M().findIndex(r => r.includes(ch)); return { x: M()[y].indexOf(ch), y }; };
    const open = (x, y) => M()[y]?.[wrap(x)] !== undefined && M()[y][wrap(x)] !== '#';
    const mover = (at, speed) => ({ x: at.x, y: at.y, d: [0, 0], want: null, t: 0, speed });
    let me, ghosts, start, den;
    const fright = () => Math.max(1.6, 6.5 - level * 0.8);
    const ghostSpeed = () => Math.min(5.6, 3.5 + level * 0.32);
    // scatter / chase in turn, the scatters shorter each maze and gone after the third phase
    const phases = () => [Math.max(2, 6 - level), 18 + level * 2, Math.max(1.5, 5 - level), 20 + level * 3, Math.max(1, 4 - level), Infinity];
    const fill = () => {
      maze = MAZES[level % MAZES.length];
      food = M().map(r => [...r].map(ch => (ch === '.' ? 1 : ch === 'o' ? 2 : 0)));
      total = left = food.flat().filter(Boolean).length;
      start = find('P'); den = find('G'); fruit = null;
    };
    const place = () => {
      me = mover(start, Math.min(5.8, 4.8 + level * 0.12));
      const out = Math.max(0.4, 1 - level * 0.12);
      ghosts = GHOSTS.map(([id, kind, corner], i) => ({ ...mover(den, ghostSpeed()), id, kind, corner, wake: i * 2.2 * out, home: false, x: den.x + [0, -1, 1, 0][i], y: den.y + [0, 0, 0, 1][i] }));
      scared = 0; pause = 1.2; acc = 0; mode = 0; modeT = 0; chain = 0;
    };
    fill(); place();
    const popup = (x, y, text, c = '#fff') => pops.push({ x, y, text, c, t: 1 });
    const burst = (x, y, c, n = 12) => { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(40, 130); bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.3, 0.7), c }); } };
    const score = (n) => { api.add(n); if (api.score >= nextLife) { nextLife += LIFE_AT; lives = Math.min(6, lives + 1); api.say('An extra life!'); api.sound('stat-up', 'coins'); } };
    const step = (m, choose) => {
      if (m.d[0] || m.d[1]) {
        const tunnel = m !== me && (m.x <= 1 || m.x >= COLS - 2) && M()[m.y][0] === 'T';
        m.t += m.speed * (tunnel ? 0.55 : 1) * (1 / 60);
        if (m.t < 1) return false;
        m.x = wrap(m.x + m.d[0]); m.y += m.d[1]; m.t -= 1;
      } else m.t = 0;
      choose(m);
      if (!open(m.x + m.d[0], m.y + m.d[1])) { m.d = [0, 0]; m.t = 0; }
      return true;
    };
    const steer = (m) => { if (m.want && open(m.x + m.want[0], m.y + m.want[1])) m.d = m.want; };
    const target = (gh) => {
      if (gh.home) return den;
      if (mode % 2 === 0) return { x: gh.corner[0], y: gh.corner[1] };
      const md = me.d[0] || me.d[1] ? me.d : [0, -1];
      if (gh.kind === 'ahead') return { x: me.x + md[0] * 4, y: me.y + md[1] * 4 };
      if (gh.kind === 'flank') { const lead = ghosts[0], px = me.x + md[0] * 2, py = me.y + md[1] * 2; return { x: px * 2 - lead.x, y: py * 2 - lead.y }; }
      if (gh.kind === 'shy' && Math.hypot(gh.x - me.x, gh.y - me.y) < 5) return { x: gh.corner[0], y: gh.corner[1] };
      return me;
    };
    const ghostTurn = (gh) => {
      const back = [-gh.d[0], -gh.d[1]];
      let ways = Object.values(DIRS).filter(([dx, dy]) => open(gh.x + dx, gh.y + dy) && !(dx === back[0] && dy === back[1]));
      if (!ways.length) ways = [back];
      if (scared > 0 && !gh.home) gh.d = ways[Math.floor(Math.random() * ways.length)];
      else {
        const aim = target(gh), dist = ([dx, dy]) => Math.hypot(gh.x + dx - aim.x, gh.y + dy - aim.y);
        gh.d = ways.reduce((a, b) => (dist(b) < dist(a) ? b : a));
      }
      if (gh.home && gh.x === den.x && gh.y === den.y) gh.home = false;
    };
    const pos = (m) => [m.x + m.d[0] * m.t, m.y + m.d[1] * m.t];
    const turn = (name) => {
      const d = DIRS[name];
      if (!d || dying || clearing) return;
      me.want = d;
      if (d[0] === -me.d[0] && d[1] === -me.d[1] && (d[0] || d[1])) { me.x = wrap(me.x + me.d[0]); me.y += me.d[1]; me.d = d; me.t = 1 - me.t; }
    };
    const reverse = () => { for (const gh of ghosts) if (!gh.home && gh.wake <= 0 && (gh.d[0] || gh.d[1]) && open(gh.x - gh.d[0], gh.y - gh.d[1])) { gh.x = wrap(gh.x + gh.d[0]); gh.y += gh.d[1]; gh.d = [-gh.d[0], -gh.d[1]]; gh.t = 1 - gh.t; } };
    return {
      tick(dt) {
        t += dt; shake = Math.max(0, shake - dt * 25);
        for (const s of bits) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.93; s.vy *= 0.93; s.t -= dt; }
        for (let i = bits.length - 1; i >= 0; i--) if (bits[i].t <= 0) bits.splice(i, 1);
        for (let i = pops.length - 1; i >= 0; i--) { pops[i].t -= dt; pops[i].y -= 18 * dt; if (pops[i].t <= 0) pops.splice(i, 1); }
        if (clearing > 0) { if ((clearing -= dt) <= 0) { level += 1; fill(); place(); api.say(`Maze ${level + 1}: ${maze.name}. The ghosts are quicker!`); } return; }
        if (dying > 0) {
          if ((dying -= dt) <= 0) {
            lives -= 1;
            if (lives <= 0) return api.over('The ghosts got you!');
            api.say(`Spooked! ${lives} ${lives > 1 ? 'lives' : 'life'} left.`); place();
          }
          return;
        }
        if (pause > 0) { pause -= dt; return; }
        if (fruit && (fruit.left -= dt) <= 0) fruit = null;
        if (scared > 0) { scared = Math.max(0, scared - dt); if (!scared) chain = 0; }
        else if ((modeT += dt) >= phases()[mode]) { modeT = 0; mode = Math.min(phases().length - 1, mode + 1); reverse(); }
        for (acc += dt; acc >= 1 / 60; acc -= 1 / 60) {   // fixed steps, so a fast screen moves no quicker
          if (step(me, steer)) {
            const f = food[me.y][me.x];
            if (f) {
              food[me.y][me.x] = 0; left -= 1; score(f === 2 ? LUM : DOT);
              if (f === 2) { scared = fright(); chain = 0; reverse(); api.sound('stat-up', 'plink-2'); api.say('Lum Berry! The ghosts are frightened!'); } else if (left % 4 === 0) api.sound('plink-1');
              const eaten = total - left;
              if (eaten === Math.floor(total * 0.35) || eaten === Math.floor(total * 0.7)) { const [name, , , pts] = FRUITS[Math.min(level, FRUITS.length - 1)]; fruit = { x: start.x, y: start.y, left: 9, pts, i: Math.min(level, FRUITS.length - 1) }; api.say(`A ${name} Berry appeared!`); }
              if (!left) { const b = 500 + level * 250; score(b); popup(W / 2, TOP + 3 * C, `+${b}`, '#ffd84a'); api.say(`Maze cleared! +${b}`); api.sound('coins', 'select'); clearing = 1.8; return; }
            }
            if (fruit && fruit.x === me.x && fruit.y === me.y) { score(fruit.pts); popup((fruit.x + 0.5) * C, TOP + fruit.y * C, `+${fruit.pts}`, '#ffd84a'); burst((fruit.x + 0.5) * C, TOP + (fruit.y + 0.5) * C, FRUITS[fruit.i][1]); api.sound('fx-ding', 'coins'); fruit = null; }
          }
          for (const gh of ghosts) {
            if (gh.wake > 0) { gh.wake -= 1 / 60; if (gh.wake <= 0) { gh.x = den.x; gh.y = den.y; } continue; }
            const elroy = gh.kind === 'chase' && left < total * 0.15 ? 0.6 : 0;
            gh.speed = gh.home ? 9 : scared ? 2.4 : ghostSpeed() + elroy;
            step(gh, ghostTurn);
          }
          const [mx, my] = pos(me);
          for (const gh of ghosts) {
            if (gh.home || gh.wake > 0) continue;
            const [gx, gy] = pos(gh);
            if (Math.hypot(Math.min(Math.abs(mx - gx), COLS - Math.abs(mx - gx)), my - gy) > 0.6) continue;
            if (scared) {
              gh.home = true; chain += 1; const pts = 100 * 2 ** chain; score(pts);
              popup((gx + 0.5) * C, TOP + gy * C, String(pts), '#7ad8ff'); burst((gx + 0.5) * C, TOP + (gy + 0.5) * C, '#ffe860', 14);
              api.sound('fx-zap', 'select'); if (!calm) shake = 3; api.say(`Zapped ${gh.id[0].toUpperCase()}${gh.id.slice(1)}! +${pts}`); continue;
            }
            dying = 1.5; if (!calm) shake = 6; api.sound('hit', 'cancel'); burst((mx + 0.5) * C, TOP + (my + 0.5) * C, '#ffd84a', 16);
            return;
          }
        }
      },
      down(x, y) { swipe = [x, y, false]; },
      move(x, y, pressed) {
        if (!pressed || !swipe || swipe[2]) return;
        const dx = x - swipe[0], dy = y - swipe[1];
        if (Math.hypot(dx, dy) < 14) return;
        swipe[2] = true;
        turn(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
      },
      up(x, y) {
        if (swipe && !swipe[2]) {
          const [mx, my] = pos(me), dx = x - (mx + 0.5) * C, dy = y - TOP - (my + 0.5) * C;
          turn(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
        }
        swipe = null;
      },
      key(k, down) { if (down) turn(k); },
      draw(g, now) {
        const n = level % MAZES.length, white = clearing > 0 && Math.floor(now / 200) % 2;
        stamp(g, `mz-${n}-${white ? 1 : 0}`, 0, 0, W, H, (cg) => walls(cg, MAZES[n], white));
        g.save();
        if (shake) g.translate(rand(-shake, shake), rand(-shake, shake));
        g.fillStyle = '#5aa8ff'; g.beginPath();   // every dot in one path, one fill
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (food[y][x] === 1) { const cx = x * C + C / 2, cy = TOP + y * C + C / 2; g.moveTo(cx + 2.6, cy); g.arc(cx, cy, 2.6, 0, TAU); }
        g.fill();
        g.fillStyle = 'rgba(255, 255, 255, 0.7)'; g.beginPath();
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (food[y][x] === 1) { const cx = x * C + C / 2 - 0.9, cy = TOP + y * C + C / 2 - 0.9; g.rect(cx, cy, 1, 1); }
        g.fill();
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (food[y][x] === 2) {
          const px = x * C, py = TOP + y * C, r = 5.5 + Math.sin(now / 160) * 1;
          g.fillStyle = 'rgba(120, 255, 120, 0.25)'; g.beginPath(); g.arc(px + C / 2, py + C / 2, r + 3, 0, TAU); g.fill();
          g.fillStyle = '#58c858'; g.beginPath(); g.arc(px + C / 2, py + C / 2, r, 0, TAU); g.fill();
          g.fillStyle = '#e8f8a0'; g.beginPath(); g.arc(px + C / 2 - 1.5, py + C / 2 - 1.5, r * 0.35, 0, TAU); g.fill();
        }
        if (fruit && (fruit.left > 2.5 || Math.floor(now / 120) % 2)) stamp(g, `mz-fruit-${fruit.i}`, fruit.x * C - 2, TOP + fruit.y * C - 2 + Math.sin(now / 250) * 1.5, C + 4, C + 4, (cg) => berry(cg, FRUITS[fruit.i]));
        for (let y = 0; y < ROWS; y++) if (M()[y][0] === 'T') for (const x of [0, COLS - 1]) banner(g, x ? '›' : '‹', x * C + C / 2, TOP + y * C + C / 2, 14, `rgba(216, 200, 255, ${0.35 + 0.25 * Math.sin(now / 220)})`);
        for (const gh of ghosts) {
          const [gx, gy] = pos(gh), cx = (gx + 0.5) * C, cy = TOP + (gy + 0.5) * C;
          if (dying > 0 && dying < 1) continue;
          if (gh.home) { g.globalAlpha = 0.3; drawMon(g, gh.id, cx, cy + 12, 20); g.globalAlpha = 1; g.fillStyle = '#fff'; for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 3, cy - 1, 2.2, 0, TAU); g.fill(); } continue; }
          const blink = scared && scared < 1.6 && Math.floor(now / 150) % 2;
          if (scared) { g.globalAlpha = 0.6; g.fillStyle = blink ? '#ffffff' : '#3a5af0'; g.beginPath(); g.arc(cx, cy, 10, 0, TAU); g.fill(); g.globalAlpha = 0.6; }
          else if (gh.wake > 0) g.globalAlpha = 0.7;
          drawMon(g, gh.id, cx, cy + 13 + Math.sin(now / 200 + gx) * 1.5, gh.id === 'gengar' ? 26 : 25, gh.d[0] > 0);
          g.globalAlpha = 1;
          if (scared) { g.strokeStyle = blink ? '#e83a3a' : '#ffffff'; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i < 5; i++) g.lineTo(cx - 6 + i * 3, cy + 5 + (i % 2) * 2); g.stroke(); }
        }
        const [mx, my] = pos(me);
        if (dying > 0) {
          const k = 1 - dying / 1.5;
          if (k < 0.85) { g.save(); g.translate((mx + 0.5) * C, TOP + (my + 0.5) * C); g.rotate(k * 12); drawMon(g, 'pikachu', 0, 11 * (1 - k), 24 * (1 - k * 0.9)); g.restore(); }
        } else {
          const bob = (me.d[0] || me.d[1]) ? Math.abs(Math.sin(now / 70)) * 1.5 : 0;
          drawMon(g, 'pikachu', (mx + 0.5) * C, TOP + (my + 0.5) * C + 11 - bob, 24, me.d[0] > 0);
          if (scared && Math.floor(now / 90) % 2) { g.strokeStyle = '#ffe860'; g.lineWidth = 1.4; g.beginPath(); g.moveTo((mx + 0.5) * C - 9, TOP + (my + 0.5) * C - 8); g.lineTo((mx + 0.5) * C - 5, TOP + (my + 0.5) * C - 4); g.lineTo((mx + 0.5) * C - 8, TOP + (my + 0.5) * C - 2); g.stroke(); }
        }
        for (const s of bits) { g.globalAlpha = Math.max(0, s.t * 1.6); g.fillStyle = s.c; g.fillRect(s.x - 1.2, s.y - 1.2, 2.4, 2.4); }
        g.globalAlpha = 1;
        g.font = '800 11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (const p of pops) { g.globalAlpha = Math.min(1, p.t * 2); g.fillStyle = 'rgba(0, 0, 0, 0.7)'; g.fillText(p.text, p.x + 1, p.y + 1); g.fillStyle = p.c; g.fillText(p.text, p.x, p.y); }
        g.globalAlpha = 1;
        g.restore();
        for (let i = 0; i < lives; i++) drawMon(g, 'pikachu', W - 12 - i * 18, 20, 16);
        banner(g, `MAZE ${level + 1}`, 34, 11, 11, '#d8c8ff');
        stamp(g, `mz-fruit-${Math.min(level, FRUITS.length - 1)}`, 66, 1, C, C, (cg) => berry(cg, FRUITS[Math.min(level, FRUITS.length - 1)]));
        if (scared) { g.fillStyle = 'rgba(255, 255, 255, 0.2)'; g.fillRect(96, 8, 80, 5); g.fillStyle = '#7ab8ff'; g.fillRect(96, 8, 80 * scared / fright(), 5); }
        if (pause > 0 && !dying) { banner(g, 'READY!', W / 2, TOP + 7.5 * C, 20, '#ffd84a'); banner(g, maze.name.toUpperCase(), W / 2, TOP + 3.5 * C, 13, '#fff'); }
      },
    };
  },
}, onClose);

/** A bonus Berry in a 24 x 24 box. */
function berry(g, [, body, leaf]) {
  const cx = 12, cy = 13;
  g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.beginPath(); g.ellipse(cx, cy + 7, 6, 2, 0, 0, TAU); g.fill();
  const bg = g.createRadialGradient(cx - 2.5, cy - 2.5, 1, cx, cy, 7.5); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.25, body); bg.addColorStop(1, '#301018');
  g.fillStyle = bg; g.beginPath(); g.arc(cx, cy, 7, 0, TAU); g.fill();
  g.fillStyle = leaf; g.beginPath(); g.ellipse(cx + 3, cy - 7, 4.5, 2, -0.5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx - 3, cy - 7, 4, 1.8, 0.5, 0, TAU); g.fill();
}

/** A maze's still parts painted once: the floor, a glowing double outline round every wall, little candles and webs,
    the den's gate; `white` paints the cleared maze's flash. */
function walls(g, { rows, glow: [fill, edge, floor] }, white) {
  g.fillStyle = floor; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255, 255, 255, 0.025)';
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2) g.fillRect(x * C, TOP + y * C, C, C);
  g.fillStyle = 'rgba(0, 0, 0, 0.5)'; g.fillRect(0, 0, W, TOP);
  const wall = (x, y) => rows[y]?.[x] === '#';
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (wall(x, y)) {
    const px = x * C, py = TOP + y * C;
    g.fillStyle = white ? '#f0f0ff' : fill; g.fillRect(px, py, C, C);
    g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.fillRect(px + 3, py + 3, C - 6, C - 6);
  }
  g.strokeStyle = white ? '#ffffff' : edge; g.lineWidth = 2; g.lineCap = 'round';
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (wall(x, y)) {
    const px = x * C, py = TOP + y * C, i = 2;
    g.beginPath();
    if (!wall(x, y - 1) && y > 0) { g.moveTo(px - (wall(x - 1, y) ? 0 : -i), py + i); g.lineTo(px + C - (wall(x + 1, y) ? 0 : i), py + i); }
    if (!wall(x, y + 1) && y < ROWS - 1) { g.moveTo(px - (wall(x - 1, y) ? 0 : -i), py + C - i); g.lineTo(px + C - (wall(x + 1, y) ? 0 : i), py + C - i); }
    if (!wall(x - 1, y) && x > 0) { g.moveTo(px + i, py - (wall(x, y - 1) ? 0 : -i)); g.lineTo(px + i, py + C - (wall(x, y + 1) ? 0 : i)); }
    if (!wall(x + 1, y) && x < COLS - 1) { g.moveTo(px + C - i, py - (wall(x, y - 1) ? 0 : -i)); g.lineTo(px + C - i, py + C - (wall(x, y + 1) ? 0 : i)); }
    g.stroke();
  }
  g.strokeStyle = white ? '#ffffff' : edge; g.lineWidth = 3; g.strokeRect(1.5, TOP + 1.5, W - 3, ROWS * C - 3);
  if (white) return;
  const den = rows.findIndex(r => r.includes('G')), dx = rows[den].indexOf('G');
  g.fillStyle = 'rgba(255, 255, 255, 0.05)'; g.fillRect((dx - 1) * C, TOP + den * C, C * 3, C * 2);
  g.strokeStyle = '#f0a0d0'; g.lineWidth = 2; g.beginPath(); g.moveTo((dx - 1) * C + 4, TOP + den * C + 1); g.lineTo((dx + 2) * C - 4, TOP + den * C + 1); g.stroke();
  for (let i = 0; i < 6; i++) {   // candles on the walls' tops
    const y = 1 + (i * 5) % (ROWS - 2), x = [0, COLS - 1][i % 2];
    if (!wall(x, y)) continue;
    const px = x * C + C / 2, py = TOP + y * C + C / 2;
    g.fillStyle = '#f0e8d0'; g.fillRect(px - 2, py - 2, 4, 7);
    g.fillStyle = 'rgba(255, 200, 80, 0.3)'; g.beginPath(); g.arc(px, py - 4, 5, 0, TAU); g.fill();
    g.fillStyle = '#ffc040'; g.beginPath(); g.ellipse(px, py - 4, 1.5, 2.5, 0, 0, TAU); g.fill();
  }
  g.strokeStyle = 'rgba(255, 255, 255, 0.18)'; g.lineWidth = 0.7;   // cobwebs in the top corners
  for (const [x, s] of [[3, 1], [W - 3, -1]]) { const y = TOP + 3; for (let r = 5; r <= 15; r += 5) { g.beginPath(); g.arc(x, y, r, s > 0 ? 0 : Math.PI / 2, s > 0 ? Math.PI / 2 : Math.PI); g.stroke(); } for (const a of [0.2, 0.8, 1.3]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * Math.cos(a) * 16, y + Math.sin(a) * 16); g.stroke(); } }
}
