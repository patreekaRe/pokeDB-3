/* arcade-puzzle.js  -  Poké Puzzle, a home arcade game (js/arcade-kit.js) after Pokémon Puzzle League: a stack of type
   panels six wide creeps up from the bottom. Swap two side by side (tap one then its neighbour, or drag it sideways) to
   line up three or more of a type in a row or column; they flash and pop, and what stood on them falls. A clear made by
   falling panels is a chain, several groups or a long line at once a combo, both worth extra. The stack rises faster as
   time goes on, and pauses while panels pop; push one past the top and the game is over. Since 2026-10-17 (the user's
   ask: every arcade game far more detailed, with more in it) it climbs in levels every 30 seconds, each rising faster
   with no ceiling on the speed: five types to start and the sixth from level 4; from level 3 Trubbish drops garbage
   slabs on the stack, wider and more often each level (two rows tall from level 10), melted into panels by a clear
   beside them; combos and chains earn stop time that holds the stack still, and the odd Shiny panel pays 50 and a stop
   of its own. A stadium behind it, Eevee cheering chains. */

import { runArcade, banner, rand, stamp, drawMon } from './arcade-kit.js';

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
const BTN = { x: 220, y: 312, w: 64, h: 36 }, SWAP = { x: 252, y: 275, r: 30 };
const SIX_AT = 4, GARBAGE_AT = 3, SHINY = 0.035, SHINY_PTS = 50, MELT = 0.7, WARN = 1.6, TAU = Math.PI * 2;
const garbageEvery = (lv) => Math.max(7, 24 - lv * 1.4), garbageWide = (lv) => Math.min(6, 3 + Math.floor((lv - GARBAGE_AT) / 3));

/** The stadium behind the board, painted once: a night sky, floodlights, the crowd in the stands, a board frame of
    chrome and the sidebar's back. */
function stadium(g) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0a1a3a'); bg.addColorStop(0.55, '#1a4a5a'); bg.addColorStop(1, '#0c2230');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff';
  for (let i = 0; i < 30; i++) { g.globalAlpha = 0.2 + (i % 3) * 0.2; g.fillRect((i * 67) % W, (i * 23) % 120, 1.3, 1.3); }
  g.globalAlpha = 1;
  for (const lx of [30, 270]) {   // floodlights on their masts
    const gl = g.createRadialGradient(lx, 40, 2, lx, 40, 90); gl.addColorStop(0, 'rgba(255, 250, 220, 0.5)'); gl.addColorStop(1, 'rgba(255, 250, 220, 0)');
    g.fillStyle = gl; g.fillRect(lx - 90, 0, 180, 140);
    g.fillStyle = '#202838'; g.fillRect(lx - 2, 46, 4, 140);
    g.fillStyle = '#fff8d8'; for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) g.fillRect(lx - 10 + k * 7, 32 + j * 6, 5, 4);
  }
  g.fillStyle = '#132a3a'; g.beginPath(); g.moveTo(0, 150); g.quadraticCurveTo(W / 2, 110, W, 150); g.lineTo(W, 210); g.lineTo(0, 210); g.fill();
  const cols = ['#ff7a4a', '#5ab0ff', '#7ad860', '#ffe25a', '#ff8ad0', '#ffffff'];
  for (let i = 0; i < 90; i++) { const x = (i * 37) % W, y = 140 + (i * 13) % 60 + Math.abs(x - W / 2) * 0.12; g.fillStyle = cols[i % 6]; g.globalAlpha = 0.35; g.fillRect(x, y, 3, 3); }
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(0, 0, 0, 0.45)'; g.beginPath(); g.roundRect(GX - 4, TOP - 4, COLS * P + 8, GB - TOP + 8, 8); g.fill();
  const chrome = g.createLinearGradient(GX - 9, 0, GX + COLS * P + 9, 0); chrome.addColorStop(0, '#9ab8c8'); chrome.addColorStop(0.5, '#f0f8ff'); chrome.addColorStop(1, '#6a8898');
  g.strokeStyle = chrome; g.lineWidth = 4; g.beginPath(); g.roundRect(GX - 7, TOP - 7, COLS * P + 14, GB - TOP + 14, 10); g.stroke();
  g.strokeStyle = 'rgba(255, 255, 255, 0.05)'; g.lineWidth = 1;
  for (let c = 1; c < COLS; c++) { g.beginPath(); g.moveTo(GX + c * P, TOP); g.lineTo(GX + c * P, GB); g.stroke(); }
  g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.beginPath(); g.roundRect(208, TOP - 8, 88, 250, 10); g.fill();
}


export const openPuzzle = (onClose) => runArcade({
  id: 'puzzle', title: 'Poké Puzzle', colour: '#40b0a0', W, H,
  stick: false,
  intro: 'Swap panels to line up three of a type! Tap one, then its neighbour.',
  sounds: ['fx-pop', 'fx-crackle', 'fx-ding', 'fx-gong'],
  help: [['Swap two panels side by side:', 'tap one then the one beside it, or drag it left or right. Arrow keys move the cursor, Space swaps.'], ['Line up 3 or more of a type', 'in a row or a column to clear them. Panels on top fall, and a clear they make is a chain: x2, x3... for big points. Clearing 4 or more at once is a combo.'], ['Combos and chains earn STOP time:', `the stack holds still while it lasts. A sparkling Shiny panel pays ${SHINY_PTS} and a stop too.`], [`A new level every 30 seconds, faster each time.`, `A sixth type joins at level ${SIX_AT}; from level ${GARBAGE_AT} Trubbish drops garbage. Clear panels next to it to melt it into panels.`], ['The stack keeps rising.', 'The round SWAP key swaps the two panels in the cursor. Hold RAISE (or Down on the bottom row) to push it up sooner. A panel pushed past the top ends the game.']],
  make(api) {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    const make = (t, shiny = false) => ({ t, shiny, clear: 0, pop: 0, end: 0, chain: false, hang: 0, drop: 0, falling: false, sw: 0, melt: 0 });
    let time = 0;
    const level = () => Math.min(99, 1 + Math.floor(time / 30));
    const kinds = () => (level() >= SIX_AT ? 6 : 5);
    const avoid = (r, c, rows) => { const no = new Set(); if (c >= 2 && rows[r][c - 1]?.t === rows[r][c - 2]?.t && rows[r][c - 1]) no.add(rows[r][c - 1].t); if (r >= 2 && rows[r - 1][c] && rows[r - 1][c]?.t === rows[r - 2][c]?.t) no.add(rows[r - 1][c].t); return no; };
    const roll = (no) => { let t; do t = Math.floor(Math.random() * kinds()); while (no.has(t)); return t; };
    const heights = [5, 4, 6, 5, 3, 5].map((h) => h + Math.floor(rand(-1, 2)));
    for (let r = 0; r < 7; r++) for (let c = 0; c < COLS; c++) if (r < heights[c]) grid[r][c] = make(roll(avoid(r, c, grid)));
    const newRow = () => { const row = []; for (let c = 0; c < COLS; c++) { const no = new Set(); if (c >= 2 && row[c - 1].t === row[c - 2].t) no.add(row[c - 1].t); if (grid[0][c] && grid[1][c] && grid[0][c].t >= 0 && grid[0][c].t === grid[1][c].t) no.add(grid[0][c].t); row.push(make(roll(no), level() >= 2 && Math.random() < SHINY)); } return row; };
    let next = newRow(), off = 0, chain = 1, best = 1, grace = 0, raising = false, keyRaise = false, shake = 0;
    let cur = { r: 3, c: 2 }, sel = null, drag = null, pops = [], sparks = [];
    let stop = 0, lastLevel = 1, levelUp = 0, garbT = 18, warn = 0, gid = 0, cheer = 0, big = null;
    const groups = new Map();
    const at = (r, c) => (r >= 0 && r < ROWS && c >= 0 && c < COLS ? grid[r][c] : null);
    const busy = (p) => p && (p.clear || p.falling || p.hang > 0 || p.sw > 0 || p.t < 0 || p.melt > 0);
    const yOf = (r) => GB - off - (r + 1) * P;
    const speed = () => 3 + (level() - 1) * 1.6 + (time % 30) / 30;
    const clearing = () => grid.some((row) => row.some((p) => p?.clear || p?.melt > 0));

    /** Drops a slab of garbage `w` wide (and `tall` rows) into the top of the board, if there's room for it. */
    function dropGarbage(w, tall) {
      const c0 = Math.floor(Math.random() * (COLS - w + 1)), id = ++gid, cells = [];
      for (let k = 0; k < tall; k++) for (let c = c0; c < c0 + w; c++) if (grid[ROWS - 1 - k][c]) return false;
      for (let k = 0; k < tall; k++) for (let c = c0; c < c0 + w; c++) { const p = make(-1); p.gid = id; grid[ROWS - 1 - k][c] = p; cells.push(p); }
      groups.set(id, { drop: 0, w, tall });
      api.sound('fx-gong', 'cancel');
      shake = Math.max(shake, 0.2);
      return true;
    }
    /** Garbage falls as one slab, a row at a time, while nothing under any of it holds it up. */
    function garbageFall(dt) {
      for (const [id, gr] of groups) {
        const cells = [];
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]?.gid === id) cells.push([r, c]);
        if (!cells.length) { groups.delete(id); continue; }
        const free = cells.every(([r, c]) => r > 0 && (!grid[r - 1][c] || grid[r - 1][c].gid === id));
        if (!free) { if (gr.drop) { gr.drop = 0; for (const [r, c] of cells) grid[r][c].drop = 0; } continue; }
        gr.drop += dt * FALL;
        while (gr.drop >= 1 && cells.every(([r, c]) => r > 0 && (!grid[r - 1][c] || grid[r - 1][c].gid === id))) {
          for (const cell of cells) { const [r, c] = cell; grid[r - 1][c] = grid[r][c]; grid[r][c] = null; cell[0] = r - 1; }
          gr.drop -= 1;
        }
        for (const [r, c] of cells) grid[r][c].drop = Math.min(gr.drop, 0.99);
      }
    }
    /** A clear touching a slab melts all of it into panels, which can chain as they land. */
    function melt(cells) {
      const hit = new Set();
      for (const [r, c] of cells) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = at(r + dr, c + dc); if (q && q.t < 0) hit.add(q.gid); }
      for (const id of hit) {
        let n = 0;
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]?.gid === id) { const p = make(roll(new Set())); p.melt = MELT + n * 0.04; p.chain = true; grid[r][c] = p; n++; }
        groups.delete(id);
        api.add(n * 5);
        api.sound('fx-crackle', 'plink-2');
      }
      return hit.size;
    }

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
      const isChain = cells.some(([r, c]) => grid[r][c].chain), size = cells.length, shinies = cells.filter(([r, c]) => grid[r][c].shiny).length;
      if (isChain) chain += 1;
      const melted = melt(cells);
      const end = FLASH + size * POP + 0.1;
      cells.forEach(([r, c], i) => { const p = grid[r][c]; p.clear = end; p.pop = FLASH + i * POP; p.end = end; p.chain = false; });
      let pts = size * 10;
      const [tr, tc] = cells[0], px = GX + tc * P + P, py = yOf(tr);
      if (size > 3) { pts += (size - 3) * 30; pops.push({ x: px, y: py, text: `${size}`, col: '#ff6a4a', t: 1.2 }); }
      if (isChain) { pts += CHAIN_PTS[Math.min(chain, CHAIN_PTS.length - 1)] + Math.max(0, chain - 11) * 200; best = Math.max(best, chain); pops.push({ x: px, y: py - (size > 3 ? 22 : 0), text: `x${chain}`, col: '#ffd84a', t: 1.4 }); api.say(`${chain} chain!`); shake = 0.25; big = { text: `${chain} CHAIN!`, t: 1.2, col: '#ffd84a' }; cheer = 1; }
      else if (size > 3) { api.say(`Combo of ${size}!`); big = { text: `COMBO ${size}!`, t: 1, col: '#ff8a6a' }; }
      if (shinies) { pts += shinies * SHINY_PTS; stop += shinies * 1.5; pops.push({ x: px, y: py + 22, text: '✦', col: '#d080ff', t: 1.2 }); api.sound('fx-ding', 'coins'); }
      if (isChain || size > 3) stop = Math.min(8, stop + (isChain ? chain * 0.8 : 0) + Math.max(0, size - 3) * 0.6);
      if (melted) api.say(`Garbage melted!${isChain ? ` ${chain} chain!` : ''}`);
      api.add(pts);
      api.sound(isChain || size > 3 ? 'stat-up' : 'confirm', 'select');
    }

    function gravity(dt) {
      for (let r = 1; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const p = grid[r][c], below = grid[r - 1][c];
        if (!p || p.clear || p.sw > 0 || p.falling || p.t < 0) continue;
        if (below && !below.falling && !(below.hang > 0)) { p.hang = 0; continue; }
        if (p.hang > 0) { p.hang -= dt; if (p.hang <= 0) p.falling = true; }
        else if (!below) p.hang = HANG;
        else if (below.falling) p.falling = true;
        else p.hang = below.hang;
      }
      for (let r = 1; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const p = grid[r][c];
        if (!p || !p.falling || p.t < 0) continue;
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
    const inSwap = (x, y) => Math.hypot(x - SWAP.x, y - SWAP.y) <= SWAP.r + 4;
    let swapping = 0;

    return {
      tick(dt) {
        time += dt;
        shake = Math.max(0, shake - dt); levelUp = Math.max(0, levelUp - dt); cheer = Math.max(0, cheer - dt);
        if (big && (big.t -= dt) <= 0) big = null;
        if (level() > lastLevel) {
          lastLevel = level(); levelUp = 1.6;
          api.sound('fx-ding', 'stat-up');
          api.say(lastLevel === SIX_AT ? `Level ${lastLevel}! A sixth type joins the stack.` : lastLevel === GARBAGE_AT ? `Level ${lastLevel}! Trubbish starts dropping garbage. Clear beside it to melt it.` : `Level ${lastLevel}! The stack rises faster.`);
        }
        if (level() >= GARBAGE_AT) {
          if (warn > 0) { warn -= dt; if (warn <= 0) { const lv = level(); if (!dropGarbage(garbageWide(lv), lv >= 10 && Math.random() < 0.3 ? 2 : 1)) warn = 0.3; else garbT = garbageEvery(lv); } }
          else if ((garbT -= dt) <= 0) warn = WARN;
        }
        for (const row of grid) for (const p of row) if (p?.melt > 0) { p.melt -= dt; if (p.melt <= 0) { p.melt = 0; p.landed = true; } }
        swapping = Math.max(0, swapping - dt);
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
        garbageFall(dt);
        matches();
        for (const row of grid) for (const p of row) if (p?.landed) { p.landed = false; if (!p.clear) p.chain = false; }
        if (chain > 1 && !clearing() && !grid.some((row) => row.some((p) => p?.chain || p?.falling || p?.hang > 0))) chain = 1;
        const forced = raising || keyRaise;
        if (forced) stop = 0;
        if (!clearing() && stop > 0) stop = Math.max(0, stop - dt);
        else if (!clearing()) {
          const up = (forced ? 120 : speed()) * dt;
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
        if (inSwap(x, y)) { sel = null; swapping = 0.15; swap(cur.r, cur.c); return; }
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
        stamp(g, 'pz-stadium', 0, 0, W, H, stadium);
        for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(255, 255, 220, ${0.08 + 0.08 * Math.sin(now / 300 + i * 1.7)})`; g.fillRect((i * 53 + 11) % W, 150 + (i * 19) % 40, 3, 3); }   // flashbulbs in the stands
        const sx = shake > 0 ? Math.sin(now / 18) * 3 * shake / 0.25 : 0;
        g.save(); g.translate(sx, 0);
        const danger = grid[ROWS - 2].some(Boolean) || grid[ROWS - 1].some(Boolean);
        if (danger) { g.fillStyle = `rgba(255, 40, 40, ${0.12 + 0.08 * Math.sin(now / 120)})`; g.fillRect(GX - 4, TOP - 4, COLS * P + 8, GB - TOP + 8); }
        g.strokeStyle = danger ? `rgba(255, 80, 80, ${0.6 + 0.4 * Math.sin(now / 90)})` : 'rgba(160, 240, 230, 0.5)'; g.lineWidth = 2;
        g.beginPath(); g.roundRect(GX - 4, TOP - 4, COLS * P + 8, GB - TOP + 8, 8); g.stroke();
        g.save(); g.beginPath(); g.rect(GX - 2, 0, COLS * P + 4, GB); g.clip();
        const slabs = new Map();
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
          const p = grid[r][c];
          if (!p) continue;
          if (p.t < 0) { const b = slabs.get(p.gid) || { r0: r, r1: r, c0: c, c1: c, drop: p.drop }; b.r0 = Math.min(b.r0, r); b.r1 = Math.max(b.r1, r); b.c0 = Math.min(b.c0, c); b.c1 = Math.max(b.c1, c); slabs.set(p.gid, b); continue; }
          const x = GX + c * P + (p.sw > 0 ? p.dir * p.sw * P : 0), y = yOf(r) + (p.falling ? p.drop * P : 0);
          const age = p.clear ? p.end - p.clear : 0;
          if (p.clear && age >= p.pop) continue;
          const lift = r >= ROWS - 2 && danger ? Math.sin(now / 60 + c) * 1.2 : 0;
          panel(g, x, y + lift, p.t, p.clear ? (Math.floor(age * 16) % 2 ? 'white' : 'flash') : p.melt > 0 ? 'white' : null);
          if (p.shiny && !p.clear) sparkle(g, x + P / 2, y + lift + P / 2, now + c * 300 + r * 170);
        }
        for (const [, b] of slabs) slab(g, GX + b.c0 * P, yOf(b.r1) + b.drop * P, (b.c1 - b.c0 + 1) * P, (b.r1 - b.r0 + 1) * P, now);
        next.forEach((p, c) => panel(g, GX + c * P, GB - off, p.t, 'dim'));
        if (warn > 0) { g.fillStyle = `rgba(150, 90, 200, ${0.25 + 0.2 * Math.sin(now / 70)})`; g.fillRect(GX, TOP, COLS * P, P); }
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
        side('LEVEL', `Lv ${level()}`, TOP - 4, levelUp ? '#7ae8a0' : '#fff');
        side(stop > 0 ? 'STOP' : 'CHAIN', stop > 0 ? stop.toFixed(1) : chain > 1 ? `x${chain}` : '-', TOP + 46, stop > 0 ? '#7ad8ff' : chain > 1 ? '#ffd84a' : '#fff');
        side('BEST CHAIN', best > 1 ? `x${best}` : '-', TOP + 96);
        const hop = cheer ? Math.abs(Math.sin(now / 80)) * 8 : 0;
        if (level() >= GARBAGE_AT) {
          drawMon(g, 'trubbish', 232, TOP + 196 - (warn > 0 ? Math.abs(Math.sin(now / 60)) * 5 : 0), 34);
          drawMon(g, 'eevee', 272, TOP + 196 - hop, 34, true);
          const k = warn > 0 ? 1 : 1 - garbT / garbageEvery(level());
          g.fillStyle = 'rgba(0, 0, 0, 0.4)'; g.fillRect(216, TOP + 202, 72, 5);
          g.fillStyle = warn > 0 ? '#ff6a9a' : '#b080e0'; g.fillRect(216, TOP + 202, 72 * Math.max(0, Math.min(1, k)), 5);
        } else drawMon(g, 'eevee', 252, TOP + 200 - hop, 40, true);
        if (grace > 0) banner(g, 'DANGER!', 252, TOP + 151, 12, `rgba(255, 90, 90, ${0.6 + 0.4 * Math.sin(now / 80)})`);
        if (warn > 0) banner(g, 'GARBAGE!', GX + COLS * P / 2, TOP + 14, 14, `rgba(230, 180, 255, ${0.6 + 0.4 * Math.sin(now / 70)})`);
        if (big) { const pop = Math.max(0, big.t - 0.9) * 3; g.globalAlpha = Math.min(1, big.t * 2); banner(g, big.text, GX + COLS * P / 2, TOP + 120 - (1.2 - big.t) * 20, 22 * (1 + pop * 0.5), big.col, COLS * P); g.globalAlpha = 1; }
        if (levelUp) { g.globalAlpha = Math.min(1, levelUp); banner(g, `LEVEL ${level()}`, GX + COLS * P / 2, TOP + 80, 26, '#7ae8a0', COLS * P); g.globalAlpha = 1; }
        const sw = swapping > 0, sy = SWAP.y + (sw ? 3 : 0), sg = g.createRadialGradient(SWAP.x - 9, sy - 11, 4, SWAP.x, sy, SWAP.r);
        sg.addColorStop(0, sw ? '#fff4b0' : '#ffb0dc'); sg.addColorStop(1, sw ? '#e8a820' : '#d0408e');
        g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.arc(SWAP.x, SWAP.y + 4, SWAP.r, 0, Math.PI * 2); g.fill();
        g.fillStyle = sg; g.beginPath(); g.arc(SWAP.x, sy, SWAP.r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255, 255, 255, 0.55)'; g.lineWidth = 2; g.beginPath(); g.arc(SWAP.x, sy, SWAP.r - 3, Math.PI * 1.1, Math.PI * 1.75); g.stroke();
        banner(g, '⇄', SWAP.x, sy - 7, 20, '#fff');
        banner(g, 'SWAP', SWAP.x, sy + 12, 11, '#fff');
        const on = raising || keyRaise, gr = g.createLinearGradient(0, BTN.y, 0, BTN.y + BTN.h);
        gr.addColorStop(0, on ? '#ffe27a' : '#5ad8c4'); gr.addColorStop(1, on ? '#e8a820' : '#2a9a88');
        g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.roundRect(BTN.x, BTN.y + 3, BTN.w, BTN.h, 10); g.fill();
        g.fillStyle = gr; g.beginPath(); g.roundRect(BTN.x, BTN.y + (on ? 2 : 0), BTN.w, BTN.h, 10); g.fill();
        banner(g, '▲ RAISE', BTN.x + BTN.w / 2, BTN.y + BTN.h / 2 + (on ? 2 : 0), 10, '#fff');
      },
    };
  },
}, onClose);

/** A Shiny panel's twinkle: a four-point star turning over it. */
function sparkle(g, x, y, now) {
  const k = 0.6 + 0.4 * Math.sin(now / 160), r = 6 * k;
  g.fillStyle = `rgba(255, 255, 255, ${0.6 + 0.4 * k})`;
  g.beginPath(); g.moveTo(x + 7, y - 9 - r); g.lineTo(x + 8.5, y - 10.5); g.lineTo(x + 7 + r, y - 9); g.lineTo(x + 8.5, y - 7.5); g.lineTo(x + 7, y - 9 + r); g.lineTo(x + 5.5, y - 7.5); g.lineTo(x + 7 - r, y - 9); g.lineTo(x + 5.5, y - 10.5); g.closePath(); g.fill();
}

/** A garbage slab: dull purple stone, riveted, with a zigzag of hazard stripes and Trubbish's face on the middle. */
function slab(g, x, y, w, h, now) {
  g.fillStyle = '#4a3a5a'; g.beginPath(); g.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 7); g.fill();
  g.fillStyle = '#6a5a7a'; g.beginPath(); g.roundRect(x + 4, y + 4, w - 8, h * 0.35, 5); g.fill();
  g.strokeStyle = '#ffd84a'; g.lineWidth = 2; g.beginPath();
  for (let k = 0; k <= Math.floor((w - 12) / 8); k++) g.lineTo(x + 6 + k * 8, y + h - 7 - (k % 2) * 5);
  g.stroke();
  g.fillStyle = '#c8b8d8'; for (const [cx, cy] of [[x + 6, y + 6], [x + w - 6, y + 6], [x + 6, y + h - 6], [x + w - 6, y + h - 6]]) { g.beginPath(); g.arc(cx, cy, 1.6, 0, TAU); g.fill(); }
  g.strokeStyle = '#2a1e36'; g.lineWidth = 2; g.beginPath(); g.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, 7); g.stroke();
  const fx = x + w / 2, fy = y + h / 2 - 1, blink = Math.floor(now / 1800) % 5 === 0 && now % 1800 < 160;
  g.fillStyle = '#1e1428';
  if (blink) { g.fillRect(fx - 7, fy - 2, 5, 1.5); g.fillRect(fx + 2, fy - 2, 5, 1.5); }
  else { g.beginPath(); g.arc(fx - 4.5, fy - 2, 2, 0, TAU); g.arc(fx + 4.5, fy - 2, 2, 0, TAU); g.fill(); }
  g.beginPath(); g.arc(fx, fy + 3, 3, 0, Math.PI); g.fill();
}

const tiles = new Map();
/** A panel, painted once a look and size at the screen's scale and stamped after that: painting each one afresh (with a
    shadow under its symbol) every frame was what cost the game its frame rate (the user's ask, 2026-10-12). */
function panel(g, x, y, t, look, s = P) {
  const k = Math.round(g.getTransform().a * 100) / 100, id = `${t}|${look}|${s}|${k}`;
  let c = tiles.get(id);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = Math.ceil(s * k);
    const cg = c.getContext('2d');
    cg.scale(c.width / s, c.height / s);
    paint(cg, 0, 0, t, look, s);
    tiles.set(id, c);
  }
  g.drawImage(c, x, y, s, s);
}

function paint(g, x, y, t, look, s) {
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
