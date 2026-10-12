/* arcade-puzzle.js  -  Poké Puzzle, a home arcade game (js/arcade-kit.js) after Pokémon Puzzle League: a stack of type
   panels six wide creeps up from the bottom. Swap two side by side (tap one then its neighbour, or drag it sideways) to
   line up three or more of a type in a row or column; they flash and pop, and what stood on them falls. A clear made by
   falling panels is a chain, several groups or a long line at once a combo, both worth extra. The stack rises faster as
   time goes on, and pauses while panels pop; push one past the top and the game is over. */

import { runArcade, banner, rand } from './arcade-kit.js';

const W = 300, H = 380, COLS = 6, ROWS = 11, P = 30, GX = 16, GB = 362, TOP = GB - ROWS * P;
const FLASH = 0.55, POP = 0.09, FALL = 14, HANG = 0.12, GRACE = 2.2;
const KINDS = [
  { name: 'fire', a: '#ff7a4a', b: '#d83a2a' },
  { name: 'water', a: '#5ab0ff', b: '#2a62d8' },
  { name: 'grass', a: '#7ad860', b: '#2e9a3a' },
  { name: 'electric', a: '#ffe25a', b: '#e0a818' },
  { name: 'psychic', a: '#ff8ad0', b: '#c03a98' },
  { name: 'ice', a: '#a8f0f0', b: '#40a8c0' },
];
const CHAIN_PTS = [0, 0, 50, 80, 150, 300, 400, 500, 700, 900, 1100, 1300];
const BTN = { x: 212, y: 296, w: 80, h: 54 };

export const openPuzzle = (onClose) => runArcade({
  id: 'puzzle', title: 'Poké Puzzle', colour: '#40b0a0', W, H,
  intro: 'Swap panels to line up three of a type! Tap one, then its neighbour.',
  help: [['Swap two panels side by side:', 'tap one then the one beside it, or drag it left or right. Arrow keys move the cursor, Space swaps.'], ['Line up 3 or more of a type', 'in a row or a column to clear them. Panels on top fall, and a clear they make is a chain: x2, x3... for big points. Clearing 4 or more at once is a combo.'], ['The stack keeps rising, faster as you go.', 'Hold RAISE (or Down on the bottom row) to push it up sooner. A panel pushed past the top ends the game.']],
  make(api) {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const make = (t) => ({ t, clear: 0, pop: 0, end: 0, chain: false, hang: 0, drop: 0, falling: false, sw: 0 });
    const avoid = (r, c, rows) => { const no = new Set(); if (c >= 2 && rows[r][c - 1]?.t === rows[r][c - 2]?.t && rows[r][c - 1]) no.add(rows[r][c - 1].t); if (r >= 2 && rows[r - 1][c] && rows[r - 1][c]?.t === rows[r - 2][c]?.t) no.add(rows[r - 1][c].t); return no; };
    const roll = (no) => { let t; do t = Math.floor(Math.random() * KINDS.length); while (no.has(t)); return t; };
    const heights = [5, 4, 6, 5, 3, 5].map((h) => h + Math.floor(rand(-1, 2)));
    for (let r = 0; r < 7; r++) for (let c = 0; c < COLS; c++) if (r < heights[c]) grid[r][c] = make(roll(avoid(r, c, grid)));
    const newRow = () => { const row = []; for (let c = 0; c < COLS; c++) { const no = new Set(); if (c >= 2 && row[c - 1].t === row[c - 2].t) no.add(row[c - 1].t); if (grid[0][c] && grid[1][c] && grid[0][c].t === grid[1][c].t) no.add(grid[0][c].t); row.push(make(roll(no))); } return row; };
    let next = newRow(), off = 0, time = 0, chain = 1, best = 1, grace = 0, raising = false, keyRaise = false, shake = 0;
    let cur = { r: 3, c: 2 }, sel = null, drag = null, pops = [], sparks = [];
    const at = (r, c) => (r >= 0 && r < ROWS && c >= 0 && c < COLS ? grid[r][c] : null);
    const busy = (p) => p && (p.clear || p.falling || p.hang > 0 || p.sw > 0);
    const yOf = (r) => GB - off - (r + 1) * P;
    const speed = () => 3.2 + time / 14;
    const level = () => Math.min(99, 1 + Math.floor(time / 30));
    const clearing = () => grid.some((row) => row.some((p) => p?.clear));

    function swap(r, c) {
      const a = at(r, c), b = at(r, c + 1);
      if (c < 0 || c >= COLS - 1 || r < 0 || r >= ROWS || (!a && !b) || busy(a) || busy(b)) return false;
      if ((a && !b && at(r + 1, c + 1)?.hang > 0) || (b && !a && at(r + 1, c)?.hang > 0)) return false;
      grid[r][c] = b; grid[r][c + 1] = a;
      if (a) { a.sw = 1; a.dir = -1; a.chain = false; }
      if (b) { b.sw = 1; b.dir = 1; b.chain = false; }
      api.sound('select');
      return true;
    }

    function matches() {
      const hit = new Set(), ok = (p) => p && !busy(p);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const p = grid[r][c];
        if (!ok(p)) continue;
        let n = 1; while (c + n < COLS && ok(grid[r][c + n]) && grid[r][c + n].t === p.t) n++;
        if (n >= 3) for (let k = 0; k < n; k++) hit.add(`${r},${c + k}`);
        n = 1; while (r + n < ROWS && ok(grid[r + n][c]) && grid[r + n][c].t === p.t) n++;
        if (n >= 3) for (let k = 0; k < n; k++) hit.add(`${r + k},${c}`);
      }
      if (!hit.size) return;
      const cells = [...hit].map((s) => s.split(',').map(Number)).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
      const isChain = cells.some(([r, c]) => grid[r][c].chain), size = cells.length;
      if (isChain) chain += 1;
      const end = FLASH + size * POP + 0.1;
      cells.forEach(([r, c], i) => { const p = grid[r][c]; p.clear = end; p.pop = FLASH + i * POP; p.end = end; p.chain = false; });
      let pts = size * 10;
      const [tr, tc] = cells[0], px = GX + tc * P + P, py = yOf(tr);
      if (size > 3) { pts += (size - 3) * 30; pops.push({ x: px, y: py, text: `${size}`, col: '#ff6a4a', t: 1.2 }); }
      if (isChain) { pts += CHAIN_PTS[Math.min(chain, CHAIN_PTS.length - 1)] + Math.max(0, chain - 11) * 200; best = Math.max(best, chain); pops.push({ x: px, y: py - (size > 3 ? 22 : 0), text: `x${chain}`, col: '#ffd84a', t: 1.4 }); api.say(`${chain} chain!`); shake = 0.25; }
      else if (size > 3) api.say(`Combo of ${size}!`);
      api.add(pts);
      api.sound(isChain || size > 3 ? 'stat-up' : 'confirm', 'select');
    }

    function gravity(dt) {
      for (let r = 1; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const p = grid[r][c], below = grid[r - 1][c];
        if (!p || p.clear || p.sw > 0 || p.falling) continue;
        if (below && !below.falling && !(below.hang > 0)) { p.hang = 0; continue; }
        if (p.hang > 0) { p.hang -= dt; if (p.hang <= 0) p.falling = true; }
        else if (!below) p.hang = HANG;
        else if (below.falling) p.falling = true;
        else p.hang = below.hang;
      }
      for (let r = 1; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const p = grid[r][c];
        if (!p || !p.falling) continue;
        p.drop += dt * FALL;
        let rr = r;
        while (p.drop >= 1 && rr > 0 && !grid[rr - 1][c]) { grid[rr - 1][c] = p; grid[rr][c] = null; rr -= 1; p.drop -= 1; }
        if (rr === 0 || grid[rr - 1][c]) { if (!grid[rr - 1]?.[c]?.falling) { p.falling = false; p.drop = 0; p.landed = true; } else p.drop = Math.min(p.drop, 0.99); }
      }
    }

    function push() {
      if (grid[ROWS - 1].some(Boolean)) return false;
      grid.pop(); grid.unshift(next); next = newRow(); off -= P;
      cur.r = Math.min(ROWS - 1, cur.r + 1); if (sel) sel.r += 1; if (drag) drag.r += 1;
      return true;
    }

    function cell(x, y) { return { r: Math.floor((GB - off - y) / P), c: Math.floor((x - GX) / P) }; }
    const inBtn = (x, y) => x >= BTN.x && x <= BTN.x + BTN.w && y >= BTN.y && y <= BTN.y + BTN.h;

    return {
      tick(dt) {
        time += dt;
        shake = Math.max(0, shake - dt);
        for (const row of grid) for (const p of row) if (p) { if (p.sw > 0) p.sw = Math.max(0, p.sw - dt * 14); }
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const p = grid[r][c];
          if (!p?.clear) continue;
          const before = p.clear;
          p.clear -= dt;
          const age = p.end - p.clear;
          if (age >= p.pop && p.end - before < p.pop) { api.sound(Math.random() < 0.5 ? 'plink-1' : 'plink-2'); for (let k = 0; k < 5; k++) sparks.push({ x: GX + c * P + P / 2, y: yOf(r) + P / 2, vx: rand(-60, 60), vy: rand(-80, 20), t: 0.5, col: KINDS[p.t].a }); }
          if (p.clear <= 0) {
            grid[r][c] = null;
            for (let k = r + 1; k < ROWS && grid[k][c]; k++) if (!grid[k][c].clear) grid[k][c].chain = true;
          }
        }
        gravity(dt);
        matches();
        for (const row of grid) for (const p of row) if (p?.landed) { p.landed = false; if (!p.clear) p.chain = false; }
        if (chain > 1 && !clearing() && !grid.some((row) => row.some((p) => p?.chain || p?.falling || p?.hang > 0))) chain = 1;
        if (!clearing()) {
          const up = (raising || keyRaise ? 120 : speed()) * dt;
          if (off + up >= P) {
            off = P;
            if (!push()) { grace += dt; if (grace > GRACE) return api.over('Topped out!'); }
            else { grace = 0; if (raising || keyRaise) api.add(1); }
          } else { off += up; if (!grid[ROWS - 1].some(Boolean)) grace = 0; }
        }
        for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; s.t -= dt; }
        sparks = sparks.filter((s) => s.t > 0);
        for (const p of pops) p.t -= dt;
        pops = pops.filter((p) => p.t > 0);
      },
      down(x, y) {
        if (inBtn(x, y)) { raising = true; return; }
        const { r, c } = cell(x, y);
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) { sel = null; return; }
        if (sel && sel.r === r && Math.abs(sel.c - c) === 1) { swap(r, Math.min(c, sel.c)); sel = null; drag = null; return; }
        sel = { r, c }; drag = at(r, c) ? { r, c, moved: false } : null; cur = { r, c: Math.min(c, COLS - 2) };
      },
      move(x, y, pressed) {
        if (!pressed || !drag) return;
        const c = Math.floor((x - GX) / P);
        if (c === drag.c || c < 0 || c >= COLS) return;
        const to = drag.c + Math.sign(c - drag.c);
        if (swap(drag.r, Math.min(to, drag.c))) { drag.c = to; drag.moved = true; sel = null; cur = { r: drag.r, c: Math.min(to, COLS - 2) }; }
      },
      up() { raising = false; if (drag?.moved) sel = null; drag = null; },
      key(k, down) {
        if (k === 'down' && !down) keyRaise = false;
        if (!down) return;
        sel = null;
        if (k === 'left') cur.c = Math.max(0, cur.c - 1);
        else if (k === 'right') cur.c = Math.min(COLS - 2, cur.c + 1);
        else if (k === 'up') cur.r = Math.min(ROWS - 1, cur.r + 1);
        else if (k === 'down') { if (cur.r === 0) keyRaise = true; cur.r = Math.max(0, cur.r - 1); }
        else if (k === 'act') swap(cur.r, cur.c);
      },
      draw(g, now) {
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a4a5a'); bg.addColorStop(1, '#10283a');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(255, 255, 255, 0.04)';
        for (let i = 0; i < 9; i++) { g.beginPath(); g.arc((i * 73) % W, (i * 131 + now / 40) % (H + 60) - 30, 18 + (i % 3) * 10, 0, Math.PI * 2); g.fill(); }
        const sx = shake > 0 ? Math.sin(now / 18) * 3 * shake / 0.25 : 0;
        g.save(); g.translate(sx, 0);
        g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.roundRect(GX - 4, TOP - 4, COLS * P + 8, GB - TOP + 8, 8); g.fill();
        const danger = grid[ROWS - 2].some(Boolean) || grid[ROWS - 1].some(Boolean);
        g.strokeStyle = danger ? `rgba(255, 80, 80, ${0.6 + 0.4 * Math.sin(now / 90)})` : 'rgba(160, 240, 230, 0.5)'; g.lineWidth = 2;
        g.beginPath(); g.roundRect(GX - 4, TOP - 4, COLS * P + 8, GB - TOP + 8, 8); g.stroke();
        g.save(); g.beginPath(); g.rect(GX - 2, 0, COLS * P + 4, GB); g.clip();
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const p = grid[r][c];
          if (!p) continue;
          const x = GX + c * P + (p.sw > 0 ? p.dir * p.sw * P : 0), y = yOf(r) + (p.falling ? p.drop * P : 0);
          const age = p.clear ? p.end - p.clear : 0;
          if (p.clear && age >= p.pop) continue;
          const lift = r >= ROWS - 2 && danger ? Math.sin(now / 60 + c) * 1.2 : 0;
          panel(g, x, y + lift, p.t, p.clear ? (Math.floor(age * 16) % 2 ? 'white' : 'flash') : null);
        }
        next.forEach((p, c) => panel(g, GX + c * P, GB - off, p.t, 'dim'));
        g.restore();
        g.fillStyle = '#0c1c28'; g.fillRect(GX - 4, GB + 4, COLS * P + 8, H - GB);
        const cy = yOf(cur.r), cx = GX + cur.c * P, pulse = 1 + Math.sin(now / 160) * 0.8;
        g.strokeStyle = '#fff'; g.lineWidth = 2.5;
        for (const [x, y, dx, dy] of [[cx, cy, 1, 1], [cx + 2 * P, cy, -1, 1], [cx, cy + P, 1, -1], [cx + 2 * P, cy + P, -1, -1]]) {
          const ox = x - dx * pulse, oy = y - dy * pulse;
          g.beginPath(); g.moveTo(ox, oy + dy * 9); g.lineTo(ox, oy); g.lineTo(ox + dx * 9, oy); g.stroke();
        }
        if (sel) { g.strokeStyle = '#ffd84a'; g.lineWidth = 3; g.beginPath(); g.roundRect(GX + sel.c * P + 1, yOf(sel.r) + 1, P - 2, P - 2, 7); g.stroke(); }
        for (const s of sparks) { g.globalAlpha = s.t / 0.5; g.fillStyle = s.col; g.beginPath(); g.arc(s.x, s.y, 2.5, 0, Math.PI * 2); g.fill(); }
        g.globalAlpha = 1;
        for (const p of pops) {
          const y = p.y - (1.4 - p.t) * 18;
          g.fillStyle = p.col; g.beginPath(); g.roundRect(p.x - 16, y - 10, 32, 20, 6); g.fill();
          banner(g, p.text, p.x, y, 13, '#fff');
        }
        g.restore();
        const side = (label, val, y, col = '#fff') => {
          g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.roundRect(212, y, 80, 44, 8); g.fill();
          g.font = '700 9px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(200, 240, 235, 0.8)'; g.fillText(label, 252, y + 12);
          banner(g, String(val), 252, y + 29, 16, col);
        };
        side('SPEED', `Lv ${level()}`, TOP - 4);
        side('CHAIN', chain > 1 ? `x${chain}` : '-', TOP + 48, chain > 1 ? '#ffd84a' : '#fff');
        side('BEST CHAIN', best > 1 ? `x${best}` : '-', TOP + 100);
        KINDS.forEach((k, i) => panel(g, 214 + (i % 3) * 26, TOP + 158 + Math.floor(i / 3) * 26, i, null, 24));
        if (grace > 0) banner(g, 'DANGER!', 252, TOP + 222, 14, `rgba(255, 90, 90, ${0.6 + 0.4 * Math.sin(now / 80)})`);
        const on = raising || keyRaise, gr = g.createLinearGradient(0, BTN.y, 0, BTN.y + BTN.h);
        gr.addColorStop(0, on ? '#ffe27a' : '#5ad8c4'); gr.addColorStop(1, on ? '#e8a820' : '#2a9a88');
        g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.roundRect(BTN.x, BTN.y + 4, BTN.w, BTN.h, 12); g.fill();
        g.fillStyle = gr; g.beginPath(); g.roundRect(BTN.x, BTN.y + (on ? 3 : 0), BTN.w, BTN.h, 12); g.fill();
        banner(g, '▲', BTN.x + BTN.w / 2, BTN.y + 18 + (on ? 3 : 0), 14, '#fff');
        banner(g, 'RAISE', BTN.x + BTN.w / 2, BTN.y + 38 + (on ? 3 : 0), 12, '#fff');
      },
    };
  },
}, onClose);

function panel(g, x, y, t, look, s = P) {
  const k = KINDS[t], pad = s * 0.05, w = s - pad * 2;
  g.save();
  g.translate(x + pad, y + pad);
  const gr = g.createLinearGradient(0, 0, 0, w);
  gr.addColorStop(0, look === 'white' ? '#ffffff' : k.a); gr.addColorStop(1, look === 'white' ? '#e8f4ff' : k.b);
  g.fillStyle = gr; g.beginPath(); g.roundRect(0, 0, w, w, w * 0.22); g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.28)'; g.beginPath(); g.roundRect(w * 0.1, w * 0.06, w * 0.8, w * 0.3, w * 0.14); g.fill();
  g.strokeStyle = 'rgba(0, 0, 0, 0.25)'; g.lineWidth = Math.max(1, w * 0.04); g.beginPath(); g.roundRect(0, 0, w, w, w * 0.22); g.stroke();
  g.translate(w / 2, w / 2);
  g.scale(w / 28, w / 28);
  symbol(g, k.name, look === 'white' ? k.b : '#fff');
  g.restore();
  if (look === 'dim') { g.fillStyle = 'rgba(10, 20, 30, 0.55)'; g.beginPath(); g.roundRect(x + pad, y + pad, w, w, w * 0.22); g.fill(); }
  if (look === 'flash') { g.fillStyle = 'rgba(255, 255, 255, 0.45)'; g.beginPath(); g.roundRect(x + pad, y + pad, w, w, w * 0.22); g.fill(); }
}

function symbol(g, name, col) {
  g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(0, 0, 0, 0.3)'; g.shadowOffsetY = 1;
  g.beginPath();
  if (name === 'fire') {
    g.moveTo(0, -10); g.bezierCurveTo(5, -4, 9, 0, 8, 5); g.bezierCurveTo(7, 10, -7, 10, -8, 5); g.bezierCurveTo(-9, 0, -5, -1, -3, -6); g.bezierCurveTo(-2, -2, 0, -2, 0, -10); g.fill();
  } else if (name === 'water') {
    g.moveTo(0, -10); g.bezierCurveTo(4, -4, 8, 1, 8, 4); g.arc(0, 4, 8, 0, Math.PI); g.bezierCurveTo(-8, 1, -4, -4, 0, -10); g.fill();
  } else if (name === 'grass') {
    g.moveTo(-8, 8); g.bezierCurveTo(-9, -4, -2, -9, 9, -9); g.bezierCurveTo(9, 2, 4, 9, -8, 8); g.fill();
    g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(0, 0, 0, 0.2)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-8, 8); g.lineTo(5, -5); g.stroke();
  } else if (name === 'electric') {
    g.moveTo(3, -11); g.lineTo(-7, 2); g.lineTo(-1, 2); g.lineTo(-4, 11); g.lineTo(7, -2); g.lineTo(1, -2); g.closePath(); g.fill();
  } else if (name === 'psychic') {
    g.lineWidth = 2.6; g.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(0, 0, 3.6, 0, Math.PI * 2); g.fill();
  } else {
    g.lineWidth = 2.4;
    for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); g.lineTo(-Math.cos(a) * 10, -Math.sin(a) * 10); }
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, c = Math.cos(a), s = Math.sin(a); g.moveTo(c * 6 - s * 3, s * 6 + c * 3); g.lineTo(c * 9, s * 9); g.lineTo(c * 6 + s * 3, s * 6 - c * 3); }
    g.stroke();
  }
  g.shadowColor = 'transparent';
}
