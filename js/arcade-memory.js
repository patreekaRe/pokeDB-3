/* arcade-memory.js  -  Voltorb Memory, a home arcade game (js/arcade-kit.js): cards face down (a Voltorb on each back),
   pairs of Pokémon under them; flip two at a time, a pair stays up, and the clock running out ends it. Since 2026-10-17
   (the user's ask: every arcade game far more detailed, and harder the further you go) each board shows its cards for a
   moment first, shorter every board, and the boards grow (`BOARDS`: 12 cards up to 24); from the third, Voltorb hide
   among them and blow up when flipped (seconds lost, the open card shut); from the fifth, Ditto swaps two face-down
   cards after every few misses, in plain sight. A Chansey pair gives time back and a shiny pair scores big. Matches in a
   row score more (x5 at most), a board cleared pays its seconds left and more again with no misses. */

import { runArcade, drawMon, banner, stamp, rand, pick } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 300, H = 330, TOP = 40, GAP = 6, TAU = Math.PI * 2, BOOM = 5, CLOCK = 8;
const POOL = ['pikachu', 'bulbasaur', 'charmander', 'squirtle', 'eevee', 'jigglypuff', 'psyduck', 'clefairy', 'togepi', 'meowth', 'slowpoke', 'snorlax', 'diglett', 'magikarp', 'ponyta', 'seel', 'gastly', 'geodude', 'oddish', 'vulpix', 'growlithe', 'abra', 'machop', 'cubone'];
/* [columns, rows, Voltorb, seconds shown first, seconds to clear, misses between Ditto's swaps (0 none)] */
const BOARDS = [[4, 3, 0, 2.2, 40, 0], [4, 4, 0, 1.8, 50, 0], [4, 4, 2, 1.6, 50, 0], [5, 4, 2, 1.4, 60, 0], [5, 4, 2, 1.2, 55, 3], [6, 4, 2, 1.0, 65, 3], [6, 4, 4, 0.9, 62, 2]];
const boardFor = (n) => { const b = BOARDS[Math.min(n, BOARDS.length) - 1], past = Math.max(0, n - BOARDS.length); return [b[0], b[1], b[2], Math.max(0.4, b[3] - past * 0.1), Math.max(36, b[4] - past * 4), b[5]]; };

const arts = new Map();
/** A card's back or face painted once at its size and scale (it's drawn squashed while it turns, under a transform the
    kit's stamp() can't key on). */
function art(kind, w, h, s) {
  const k = `${kind},${w},${h},${s}`;
  if (arts.has(k)) return arts.get(k);
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * s); c.height = Math.ceil(h * s);
  const g = c.getContext('2d');
  g.scale(s, s);
  const r = Math.min(8, w / 6);
  if (kind === 'back') {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#e83a3a'); bg.addColorStop(1, '#a01c28');
    g.fillStyle = '#5a0c14'; g.beginPath(); g.roundRect(0, 0, w, h, r); g.fill();
    g.fillStyle = bg; g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, r - 1); g.fill();
    g.strokeStyle = 'rgba(255, 220, 200, 0.5)'; g.lineWidth = 1; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, r - 3); g.stroke();
    g.strokeStyle = 'rgba(255, 255, 255, 0.08)'; g.lineWidth = 2;
    for (let d = -h; d < w; d += 8) { g.beginPath(); g.moveTo(d, h); g.lineTo(d + h, 0); g.stroke(); }
    const v = Math.min(w, h) * 0.32, cx = w / 2, cy = h / 2;   // a Voltorb
    g.fillStyle = '#202028'; g.beginPath(); g.arc(cx, cy, v + 1.5, 0, TAU); g.fill();
    g.fillStyle = '#f04040'; g.beginPath(); g.arc(cx, cy, v, Math.PI, 0); g.fill();
    g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(cx, cy, v, 0, Math.PI); g.fill();
    g.fillStyle = '#202028'; g.fillRect(cx - v, cy - 1, v * 2, 2);
    g.beginPath(); g.moveTo(cx - v * 0.6, cy - v * 0.5); g.lineTo(cx - v * 0.2, cy - v * 0.3); g.lineTo(cx - v * 0.25, cy - v * 0.15); g.lineTo(cx - v * 0.6, cy - v * 0.3); g.fill();
    g.beginPath(); g.moveTo(cx + v * 0.6, cy - v * 0.5); g.lineTo(cx + v * 0.2, cy - v * 0.3); g.lineTo(cx + v * 0.25, cy - v * 0.15); g.lineTo(cx + v * 0.6, cy - v * 0.3); g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.7)'; g.beginPath(); g.ellipse(cx - v * 0.45, cy - v * 0.65, v * 0.22, v * 0.12, -0.6, 0, TAU); g.fill();
  } else {
    const [edge, fill, rim] = { face: ['#8a8070', '#fffaf0', '#e8dcc0'], done: ['#4a9a5a', '#f0fff0', '#b8e8c0'], shiny: ['#a87a10', '#fff8d0', '#ffd860'], clock: ['#c8608a', '#fff0f6', '#ffc0d8'], boom: ['#202028', '#ffe080', '#ff9a30'] }[kind];
    g.fillStyle = edge; g.beginPath(); g.roundRect(0, 0, w, h, r); g.fill();
    g.fillStyle = rim; g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, r - 1); g.fill();
    const in1 = Math.max(3, w * 0.08);
    g.fillStyle = fill; g.beginPath(); g.roundRect(in1, in1, w - in1 * 2, h - in1 * 2, Math.max(2, r - 3)); g.fill();
    g.fillStyle = 'rgba(0, 0, 0, 0.05)'; g.beginPath(); g.arc(w / 2, h / 2, Math.min(w, h) * 0.36, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.5)'; g.fillRect(in1 + 2, in1 + 1, w - in1 * 2 - 4, 2);
    if (kind === 'shiny') { g.fillStyle = '#ffd040'; for (const [x, y] of [[in1 + 5, in1 + 6], [w - in1 - 5, h - in1 - 6]]) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, d = i % 2 ? 1.5 : 4; g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } g.fill(); } }
  }
  arts.set(k, c);
  if (arts.size > 60) arts.delete(arts.keys().next().value);
  return c;
}
function tableArt(g) {
  const bg = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 260); bg.addColorStop(0, '#2e6a4a'); bg.addColorStop(1, '#0e2a1e');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255, 255, 255, 0.04)'; g.lineWidth = 1;
  for (let x = 0; x < W; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  g.strokeStyle = 'rgba(255, 216, 74, 0.35)'; g.lineWidth = 2; g.beginPath(); g.roundRect(3, TOP - 2, W - 6, H - TOP - 1, 10); g.stroke();
  g.fillStyle = '#1a0e1a'; g.fillRect(0, 0, W, TOP - 6);
  g.fillStyle = '#ffd84a'; for (let x = 6; x < W; x += 12) { g.beginPath(); g.arc(x, TOP - 8, 1.6, 0, TAU); g.fill(); }
}

export const openMemory = (onClose) => runArcade({
  id: 'memory', title: 'Voltorb Memory', colour: '#d83a3a', W, H,
  stick: false,
  intro: 'Find the matching pairs before the time runs out!',
  sounds: ['fx-pop', 'fx-zap', 'fx-poof', 'fx-ding', 'fx-whoosh'],
  help: [['Watch the cards while they\'re shown,', 'then tap one to flip it, then another. A pair stays up.'], ['Matches in a row score more, up to x5.', 'Clear the board for its seconds left, more with no misses.'], ['From board 3, Voltorb hide among them:', `flip one and it explodes, ${BOOM} seconds gone. A Chansey pair gives ${CLOCK} back; a shiny pair is worth 50.`], ['From board 5, Ditto swaps two cards', 'after a few misses: watch where they go. The clock running out ends it.']],
  make(api) {
    let cards = [], open = [], board = 0, left = 0, total = 1, wait = 0, flash = 0, peek = 0, combo = 0, misses = 0, boardMisses = 0, swapEvery = 0, cols = 4, rows = 3, shakeTo = 0, ditto = null;
    const bits = [], pops = [], calm = calmFx();
    const pop = (x, y, text, colour = '#ffd84a') => pops.push({ x, y, text, colour, t: 0 });
    const burst = (x, y, colour, n, sp = 120) => { for (let i = 0; i < n && bits.length < 140; i++) { const a = rand(0, TAU), v = rand(sp * 0.3, sp); bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.3, 0.7), colour, r: rand(1.5, 3) }); } };
    const cell = (i) => {
      const w = Math.min((W - 16 - GAP * (cols - 1)) / cols, ((H - TOP - 10 - GAP * (rows - 1)) / rows) / 1.2), h = w * 1.2;
      const ox = (W - (w * cols + GAP * (cols - 1))) / 2, oy = TOP + 4 + ((H - TOP - 10) - (h * rows + GAP * (rows - 1))) / 2;
      return { x: ox + (i % cols) * (w + GAP), y: oy + Math.floor(i / cols) * (h + GAP), w, h };
    };
    const deal = () => {
      board += 1;
      let volts, show;
      [cols, rows, volts, show, total, swapEvery] = boardFor(board);
      const pairs = (cols * rows - volts) / 2, mons = [...POOL].sort(() => Math.random() - 0.5).slice(0, pairs);
      const kinds = mons.map((id, i) => (board >= 2 && i === 0 ? 'clock' : board >= 4 && i === 1 ? 'shiny' : 'face'));
      if (board >= 2) mons[0] = 'chansey';
      const list = mons.flatMap((id, i) => [{ id, kind: kinds[i] }, { id, kind: kinds[i] }]);
      for (let i = 0; i < volts; i++) list.push({ id: 'voltorb', kind: 'boom', volt: true });
      cards = list.sort(() => Math.random() - 0.5).map((c, i) => ({ ...c, up: false, done: false, turn: 1, at: i, from: i, slide: 1, glow: 0 }));
      open = []; left = total; peek = show; boardMisses = 0; misses = 0;
    };
    deal();
    const where = (c) => { const a = cell(c.from), b = cell(c.at), k = c.slide < 1 ? 0.5 - Math.cos(c.slide * Math.PI) / 2 : 1; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k - Math.sin(c.slide * Math.PI) * 14, w: b.w, h: b.h }; };
    const centre = (c) => { const r = where(c); return [r.x + r.w / 2, r.y + r.h / 2]; };
    /** Ditto swaps two face-down cards, sliding them across each other so a watchful player can follow. */
    const swap = () => {
      const down = cards.filter(c => !c.up && !c.done);
      if (down.length < 2) return;
      const a = pick(down), b = pick(down.filter(c => c !== a));
      [a.from, b.from] = [a.at, b.at]; [a.at, b.at] = [b.at, a.at]; a.slide = b.slide = 0;
      ditto = { a, b, t: 0 };
      api.sound('fx-whoosh', 'select'); api.say('Ditto swapped two cards! Watch where they went.');
    };
    return {
      tick(dt) {
        flash = Math.max(0, flash - dt);
        for (const c of cards) {
          c.turn += ((c.up || c.done || peek > 0 ? 1 : 0) - c.turn) * Math.min(1, dt * 14);
          if (c.slide < 1) c.slide = Math.min(1, c.slide + dt / 0.7);
          c.glow = Math.max(0, c.glow - dt);
        }
        if (ditto && (ditto.t += dt) > 0.9) ditto = null;
        for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 160 * dt; if (b.life <= 0) bits.splice(i, 1); }
        for (let i = pops.length - 1; i >= 0; i--) if ((pops[i].t += dt) > 0.9) pops.splice(i, 1);
        if (peek > 0) { peek -= dt; if (peek <= 0) api.sound('fx-whoosh', 'select'); return; }
        left -= dt;
        if (wait > 0) { wait -= dt; if (wait <= 0) { for (const c of open) c.up = false; open = []; if (swapEvery && misses >= swapEvery) { misses = 0; swap(); } } }
        if (left <= 0) { left = 0; api.over('Time\'s up!'); }
      },
      down(x, y) {
        if (wait > 0 || peek > 0 || cards.some(c => c.slide < 1)) return;
        const c = cards.find(o => { const r = cell(o.at); return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h; });
        if (!c || c.up || c.done) return;
        c.up = true; api.sound('select');
        if (c.volt) {
          const [cx, cy] = centre(c);
          left -= BOOM; combo = 0; misses++; boardMisses++;
          burst(cx, cy, '#ffd040', 22, 200); burst(cx, cy, '#ffffff', 10, 120);
          pop(cx, cy - 20, `-${BOOM}s`, '#ff6060');
          if (!calm) shakeTo = performance.now() + 380;
          api.sound('fx-zap', 'cancel'); api.say('Voltorb used Self-Destruct!');
          open.push(c); wait = 0.8;
          return;
        }
        open.push(c);
        if (open.length < 2) return;
        if (open[0].id === open[1].id) {
          combo++;
          const n = (open[0].kind === 'shiny' ? 50 : 10) * Math.min(5, combo);
          for (const o of open) { o.done = true; o.glow = 0.6; const [cx, cy] = centre(o); burst(cx, cy, open[0].kind === 'shiny' ? '#ffd040' : '#ffffff', 8); }
          const [px, py] = centre(open[1]);
          pop(px, py - 20, `+${n}${combo > 1 ? ` x${Math.min(5, combo)}` : ''}`);
          if (open[0].kind === 'clock') { left = Math.min(total + CLOCK, left + CLOCK); pop(px, py, `+${CLOCK}s`, '#ff9ac8'); api.say(`Chansey! +${CLOCK} seconds.`); }
          else if (open[0].kind === 'shiny') api.say('A shiny pair!');
          api.add(n);
          open = []; api.sound(combo > 2 ? 'fx-ding' : 'plink-2', 'plink-2');
          if (cards.every(o => o.done || o.volt)) {
            const bonus = Math.ceil(left) * 2 + (boardMisses ? 0 : 50);
            api.add(bonus); api.sound('stat-up'); flash = 1.2;
            api.say(`Board ${board} cleared! +${bonus}${boardMisses ? '' : ' (no misses!)'}. Here comes the next one.`);
            deal();
          }
        } else { wait = 0.7; combo = 0; misses++; boardMisses++; api.sound('cancel'); }
      },
      draw(g, now) {
        const s = g.getTransform().a;
        g.save();
        if (now < shakeTo) { const k = (shakeTo - now) / 380 * 4; g.translate(rand(-k, k), rand(-k, k)); }
        stamp(g, 'memory-table', 0, 0, W, H, tableArt);
        for (const c of cards) {
          const r = where(c), sx = Math.abs(Math.cos(c.turn * Math.PI)), face = c.turn > 0.5;
          const w = Math.round(cell(0).w), h = Math.round(cell(0).h);
          g.save(); g.translate(r.x + r.w / 2, r.y + r.h / 2 - (c.glow ? Math.sin(c.glow / 0.6 * Math.PI) * 5 : 0)); g.scale(Math.max(0.05, sx), 1);
          g.drawImage(art(face ? (c.done ? (c.kind === 'face' ? 'done' : c.kind) : c.kind) : 'back', w, h, s), -r.w / 2, -r.h / 2, r.w, r.h);
          if (face) drawMon(g, c.id, 0, r.h / 2 - r.h * 0.12, r.h * 0.72);
          g.restore();
          if (c.done && c.kind === 'shiny' && Math.sin(now / 200 + c.at) > 0.85) { g.fillStyle = '#fff6b0'; g.fillRect(r.x + r.w * 0.8, r.y + 4, 3, 3); }
        }
        if (ditto) { const [ax, ay] = centre(ditto.a), [bx, by] = centre(ditto.b), k = ditto.t / 0.9; g.globalAlpha = 1 - k; drawMon(g, 'ditto', (ax + bx) / 2, (ay + by) / 2 + 10 - k * 20, 34); g.globalAlpha = 1; }
        for (const b of bits) { g.globalAlpha = Math.min(1, b.life * 3); g.fillStyle = b.colour; g.fillRect(b.x - b.r / 2, b.y - b.r / 2, b.r, b.r); }
        g.globalAlpha = 1;
        g.restore();
        g.fillStyle = 'rgba(0, 0, 0, 0.5)'; g.fillRect(8, 11, W - 100, 12);
        g.fillStyle = peek > 0 ? '#8ad0ff' : left < 10 ? (Math.floor(now / 200) % 2 ? '#ff6060' : '#ff9a9a') : '#ffd84a';
        g.fillRect(9, 12, (W - 102) * Math.max(0, Math.min(1, left / total)), 10);
        banner(g, `${Math.ceil(Math.max(0, left))}s`, W - 70, 17, 13);
        banner(g, `#${board}`, W - 24, 17, 13, '#c8c8f0');
        if (combo > 1) banner(g, `x${Math.min(5, combo)}`, 24, 34, 11, '#ffd84a');
        for (const p of pops) { g.globalAlpha = 1 - p.t / 0.9; banner(g, p.text, p.x, p.y - p.t * 26, 13, p.colour); }
        g.globalAlpha = 1;
        if (peek > 0) banner(g, 'MEMORISE!', W / 2, H / 2, 26 + Math.sin(now / 120) * 2, '#8ad0ff');
        if (flash) { g.globalAlpha = Math.min(1, flash); banner(g, 'CLEARED!', W / 2, H / 2, 32 * (1 + flash * 0.15), '#ffd84a'); g.globalAlpha = 1; }
      },
    };
  },
}, onClose);
