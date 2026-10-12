/* arcade-stacker.js  -  Snorlax Stacker, a home arcade game (js/arcade-kit.js): a slab slides back and forth, a tap
   drops it; what hangs over the slab below is cut off, so the stack narrows. A perfect drop keeps the width. Each slab
   is a point; the stack scrolls down as it grows and the slabs speed up. */

import { runArcade, drawMon, banner } from './arcade-kit.js';

const W = 280, H = 360, SLAB = 22, START = 150, COLS = ['#3a7a8a', '#4a8a9a', '#e8dcc0', '#d8c8a8'];

export const openStacker = (onClose) => runArcade({
  id: 'stacker', title: 'Snorlax Stacker', colour: '#3a7a8a', W, H,
  intro: 'Stack them up for Snorlax\'s nap! Tap to drop each slab.',
  help: [['A slab slides back and forth.', 'Tap to drop it on the stack.'], ['Whatever hangs over the edge falls off,', 'so the stack gets narrower. Land it exactly for a Perfect!'], ['Each slab is a point.', 'Miss the stack completely and the game is over.']],
  make(api) {
    const stack = [{ x: (W - START) / 2, w: START }], falling = [];
    let mov = { x: 0, w: START, dir: 1 }, speed = 90, cam = 0, perfect = 0;
    const top = () => stack[stack.length - 1];
    const yOf = (n) => H - 40 - (n + 1) * SLAB + cam;
    return {
      tick(dt) {
        mov.x += mov.dir * speed * dt;
        if (mov.x < -mov.w * 0.4) { mov.x = -mov.w * 0.4; mov.dir = 1; }
        if (mov.x + mov.w > W + mov.w * 0.4) { mov.x = W + mov.w * 0.4 - mov.w; mov.dir = -1; }
        const want = Math.max(0, (stack.length - 9) * SLAB);
        cam += (want - cam) * Math.min(1, dt * 4);
        for (const f of falling) { f.vy += 900 * dt; f.y += f.vy * dt; }
        perfect = Math.max(0, perfect - dt);
      },
      down() {
        const t = top(), l = Math.max(mov.x, t.x), r = Math.min(mov.x + mov.w, t.x + t.w), n = stack.length;
        if (r - l <= 0) { falling.push({ x: mov.x, w: mov.w, y: yOf(n - 1), vy: 0 }); return api.over('It toppled!'); }
        if (Math.abs(mov.x - t.x) < 4) { stack.push({ x: t.x, w: t.w }); perfect = 0.8; api.sound('stat-up', 'plink-2'); }
        else {
          stack.push({ x: l, w: r - l });
          if (mov.x < l) falling.push({ x: mov.x, w: l - mov.x, y: yOf(n - 1), vy: 0 });
          if (mov.x + mov.w > r) falling.push({ x: r, w: mov.x + mov.w - r, y: yOf(n - 1), vy: 0 });
          api.sound('plink-1');
        }
        api.add(1);
        speed = Math.min(320, speed + 9);
        mov = { x: mov.dir > 0 ? -top().w * 0.3 : W - top().w * 0.7, w: top().w, dir: mov.dir };
      },
      draw(g, now) {
        const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1a2a5a'); sky.addColorStop(1, '#6a8ac8');
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        for (let i = 0; i < 25; i++) { g.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.3 * Math.sin(now / 500 + i)})`; g.fillRect((i * 97) % W, (i * 53 + cam * 0.3) % H, 2, 2); }
        g.fillStyle = '#4a7a3a'; g.fillRect(0, H - 40 + cam, W, 40);
        const slab = (x, y, w, i) => {
          g.fillStyle = COLS[i % 2 ? 0 : 1]; g.fillRect(x, y, w, SLAB - 2);
          g.fillStyle = COLS[2 + (i % 2)]; g.fillRect(x + w * 0.2, y + 3, w * 0.6, SLAB - 8);
          g.fillStyle = 'rgba(255, 255, 255, 0.25)'; g.fillRect(x, y, w, 3);
        };
        stack.forEach((s, i) => slab(s.x, yOf(i - 1), s.w, i));
        for (const f of falling) slab(f.x, f.y, f.w, 1);
        slab(mov.x, yOf(stack.length - 1), mov.w, stack.length);
        drawMon(g, 'snorlax', W - 34, H - 22 + cam, 46);
        banner(g, 'z', W - 18, H - 70 + cam - (now / 40) % 20, 14, '#c8e0ff');
        if (perfect) banner(g, 'PERFECT!', W / 2, 60, 26, '#ffd84a');
      },
    };
  },
}, onClose);
