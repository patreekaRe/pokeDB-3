/* arcade-maze.js  -  Gastly Maze, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick), after Pac-Man:
   Pikachu eats the Oran Berries round a haunted maze while Gastly hunt it. A Lum Berry in each corner turns them pale and
   frightened for a while, and Pikachu can zap them back to the middle. Swipe, tap a side or use the arrow keys to steer.
   Three lives; a cleared maze fills again, the Gastly quicker. A tunnel through each side wall wraps to the other side. */

import { runArcade, drawMon, banner } from './arcade-kit.js';

/* # wall, . berry, o Lum Berry, G where the Gastly start, P Pikachu, T a tunnel to the other side */
const MAZE = [
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
];
const C = 20, TOP = 22, COLS = MAZE[0].length, ROWS = MAZE.length, W = COLS * C, H = ROWS * C + TOP;
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const find = (ch) => { const y = MAZE.findIndex(r => r.includes(ch)); return { x: MAZE[y].indexOf(ch), y }; };
const wrap = (x) => (x + COLS) % COLS;
const open = (x, y) => MAZE[y]?.[wrap(x)] !== undefined && MAZE[y][wrap(x)] !== '#';
const LIVES = 3, SCARED = 6;

export const openMaze = (onClose) => runArcade({
  id: 'maze', title: 'Gastly Maze', colour: '#7a4ac8', W, H,
  keys: { left: [['◀', 'left'], ['▶', 'right']], right: [['▲', 'up'], ['▼', 'down']] },
  intro: 'Eat every berry and dodge the Gastly! Steer with the arrows.',
  help: [['Steer Pikachu with the big arrow buttons:', '◀ ▶ under your left thumb, ▲ ▼ under your right. Swiping or the arrow keys work too.'], ['Eat every Oran Berry to clear the maze.', 'A Lum Berry scares the Gastly: zap them for 20!'], [`Gastly take a life; ${LIVES} and it\'s over.`, 'Berries 1, Lum Berries 5. Each new maze is quicker.']],
  make(api) {
    let food, left, lives = LIVES, level = 0, scared = 0, chain = 0, pause = 0.8, swipe = null, flash = 0, acc = 0;
    const start = find('P'), den = find('G');
    const mover = (at, speed) => ({ x: at.x, y: at.y, d: [0, 0], want: null, t: 0, speed });
    let me, ghosts;
    const fill = () => {
      food = MAZE.map(r => [...r].map(ch => (ch === '.' ? 1 : ch === 'o' ? 2 : 0)));
      left = food.flat().filter(Boolean).length;
    };
    const place = () => {
      me = mover(start, 4.6);
      ghosts = [0, 1, 2].map(i => ({ ...mover(den, 3.2 + level * 0.35), wake: i * 2.2, home: false }));
      scared = 0; pause = 0.8; acc = 0;
    };
    fill(); place();
    const step = (m, choose) => {
      if (m.d[0] || m.d[1]) {
        m.t += m.speed * (1 / 60);
        if (m.t < 1) return false;
        m.x = wrap(m.x + m.d[0]); m.y += m.d[1]; m.t -= 1;
      } else m.t = 0;
      choose(m);
      if (!open(m.x + m.d[0], m.y + m.d[1])) { m.d = [0, 0]; m.t = 0; }
      return true;
    };
    const steer = (m) => { if (m.want && open(m.x + m.want[0], m.y + m.want[1])) m.d = m.want; };
    const ghostTurn = (gh) => {
      const back = [-gh.d[0], -gh.d[1]];
      let ways = Object.values(DIRS).filter(([dx, dy]) => open(gh.x + dx, gh.y + dy) && !(dx === back[0] && dy === back[1]));
      if (!ways.length) ways = [back];
      const aim = gh.home ? den : me, run = scared > 0 && !gh.home;
      const dist = ([dx, dy]) => Math.hypot(gh.x + dx - aim.x, gh.y + dy - aim.y);
      if (!gh.home && Math.random() < 0.25) gh.d = ways[Math.floor(Math.random() * ways.length)];
      else gh.d = ways.reduce((a, b) => ((run ? dist(b) > dist(a) : dist(b) < dist(a)) ? b : a));
      if (gh.home && gh.x === den.x && gh.y === den.y) gh.home = false;
    };
    const pos = (m) => [m.x + m.d[0] * m.t, m.y + m.d[1] * m.t];
    const turn = (name) => {
      const d = DIRS[name];
      if (!d) return;
      me.want = d;
      if (d[0] === -me.d[0] && d[1] === -me.d[1] && (d[0] || d[1])) { me.x = wrap(me.x + me.d[0]); me.y += me.d[1]; me.d = d; me.t = 1 - me.t; }
    };
    return {
      tick(dt) {
        flash = Math.max(0, flash - dt);
        if (pause > 0) { pause -= dt; return; }
        scared = Math.max(0, scared - dt);
        if (!scared) chain = 0;
        for (acc += dt; acc >= 1 / 60; acc -= 1 / 60) {   // fixed steps, so a fast screen moves no quicker
          if (step(me, steer)) {
            const f = food[me.y][me.x];
            if (f) {
              food[me.y][me.x] = 0; left -= 1; api.add(f === 2 ? 5 : 1);
              if (f === 2) { scared = Math.max(3, SCARED - level * 0.6); chain = 0; api.sound('stat-up', 'plink-2'); } else if (left % 4 === 0) api.sound('plink-1');
              if (!left) { level += 1; api.add(50); api.say(`Maze cleared! +50. Maze ${level + 1}: the Gastly are quicker.`); api.sound('coins', 'select'); fill(); place(); return; }
            }
          }
          for (const gh of ghosts) {
            if (gh.wake > 0) { gh.wake -= 1 / 60; continue; }
            gh.speed = gh.home ? 8 : scared ? 2.2 : 3.2 + level * 0.35;
            step(gh, ghostTurn);
          }
          const [mx, my] = pos(me);
          for (const gh of ghosts) {
            if (gh.home || gh.wake > 0) continue;
            const [gx, gy] = pos(gh);
            if (Math.hypot(Math.min(Math.abs(mx - gx), COLS - Math.abs(mx - gx)), my - gy) > 0.6) continue;
            if (scared) { gh.home = true; chain += 1; api.add(20 * chain); api.sound('fx-zap', 'select'); flash = 0.15; api.say(`Zapped a Gastly! +${20 * chain}`); continue; }
            lives -= 1; api.sound('cancel');
            if (lives <= 0) return api.over('Gastly got you!');
            api.say(`Spooked! ${lives} ${lives > 1 ? 'lives' : 'life'} left.`);
            place(); return;
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
        g.fillStyle = flash ? '#3a2a6a' : '#140c26'; g.fillRect(0, 0, W, H);
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          const px = x * C, py = TOP + y * C;
          if (MAZE[y][x] === '#') {
            g.fillStyle = '#4a2a8a'; g.beginPath(); g.roundRect(px + 1, py + 1, C - 2, C - 2, 5); g.fill();
            g.fillStyle = '#6a4ab8'; g.fillRect(px + 4, py + 3, C - 8, 2);
          } else if (food[y][x] === 1) {
            g.fillStyle = '#3a8ae0'; g.beginPath(); g.arc(px + C / 2, py + C / 2, 2.6, 0, Math.PI * 2); g.fill();
          } else if (food[y][x] === 2) {
            const r = 5.5 + Math.sin(now / 160) * 1;
            g.fillStyle = '#58c858'; g.beginPath(); g.arc(px + C / 2, py + C / 2, r, 0, Math.PI * 2); g.fill();
            g.fillStyle = '#e8f8a0'; g.beginPath(); g.arc(px + C / 2 - 1.5, py + C / 2 - 1.5, r * 0.35, 0, Math.PI * 2); g.fill();
          }
        }
        for (let y = 0; y < ROWS; y++) if (MAZE[y][0] === 'T') for (const x of [0, COLS - 1]) {
          const tg = g.createLinearGradient(x ? W : 0, 0, x ? W - C : C, 0);
          tg.addColorStop(0, '#000'); tg.addColorStop(1, 'rgba(20, 12, 38, 0)');
          g.fillStyle = tg; g.fillRect(x * C, TOP + y * C, C, C);
          g.fillStyle = `rgba(216, 200, 255, ${0.35 + 0.25 * Math.sin(now / 220)})`;
          banner(g, x ? '›' : '‹', x * C + C / 2, TOP + y * C + C / 2, 14, g.fillStyle);
        }
        for (const gh of ghosts) {
          const [gx, gy] = pos(gh), cx = (gx + 0.5) * C, cy = TOP + (gy + 0.5) * C;
          if (gh.home) { g.globalAlpha = 0.35; drawMon(g, 'gastly', cx, cy + 12, 22); g.globalAlpha = 1; continue; }
          const blink = scared && scared < 1.5 && Math.floor(now / 150) % 2;
          if (scared) { g.globalAlpha = 0.55; g.fillStyle = blink ? '#ffffff' : '#7ab8ff'; g.beginPath(); g.arc(cx, cy, 10, 0, Math.PI * 2); g.fill(); }
          drawMon(g, 'gastly', cx, cy + 13 + Math.sin(now / 200 + gx) * 1.5, 26);
          g.globalAlpha = 1;
        }
        const [mx, my] = pos(me);
        drawMon(g, 'pikachu', (mx + 0.5) * C, TOP + (my + 0.5) * C + 11, 24, me.d[0] > 0);
        for (let i = 0; i < lives; i++) drawMon(g, 'pikachu', W - 12 - i * 18, 20, 16);
        banner(g, `MAZE ${level + 1}`, 42, 11, 11, '#d8c8ff');
        if (pause > 0) banner(g, 'READY!', W / 2, TOP + 7.5 * C, 20, '#ffd84a');
      },
    };
  },
}, onClose);
