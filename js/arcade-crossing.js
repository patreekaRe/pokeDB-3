/* arcade-crossing.js  -  Poliwag Crossing, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick), after
   Frogger: Poliwag hops a lane at a time over a road of charging Tauros and Rapidash, rests on the bank, then rides Lapras
   and logs over the river to a free lily pad. Swipe, tap a side of Poliwag or use the arrow keys. Three lives; every pad
   filled starts a quicker crossing. */

import { runArcade, drawMon, banner, rand } from './arcade-kit.js';

const W = 300, TOP = 22, RH = 30, ROWS = 13, H = TOP + RH * ROWS, CW = 25, LIVES = 3, TIME = 30, P = W + 140;
const PADS = [30, 90, 150, 210, 270], START = 12, BANK = 6;
/* bottom to top: the road's lanes (rows 11-7), then the river's (rows 5-1); [dir, speed, kind, width, count, gap] */
const ROAD = [[-1, 38, 'tauros', 40, 3], [1, 52, 'tauros', 40, 2], [-1, 90, 'rapidash', 42, 1], [1, 44, 'tauros', 40, 3], [-1, 66, 'rapidash', 42, 2]];
const RIVER = [[1, 34, 'log', 78, 3], [-1, 46, 'lapras', 52, 4], [1, 60, 'log', 110, 2], [-1, 40, 'lapras', 52, 3], [1, 52, 'log', 70, 3]];
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const rowY = (r) => TOP + r * RH;

export const openCrossing = (onClose) => runArcade({
  id: 'crossing', title: 'Poliwag Crossing', colour: '#3a8ae0', W, H,
  swipe: true,
  intro: 'Hop Poliwag over the road and river to the lily pads!',
  help: [['Swipe the screen to hop that way.', 'A tap beside Poliwag hops it there too, and the arrow keys work.'], ['Dodge the Tauros and Rapidash on the road.', 'In the river, ride Lapras and the logs: the water is too fast to swim.'], [`Fill all ${PADS.length} lily pads for a quicker crossing.`, `10 a new lane, 50 a pad plus the time left, 200 for all five. ${LIVES} lives.`]],
  make(api) {
    let level = 0, lives = LIVES, lanes, filled, me, best, time, dying = 0, cause = '', swipe = null, queued = null, cheer = 0;
    const build = () => {
      const fast = 1 + level * 0.18;
      lanes = {};
      const lay = (defs, first, wet) => defs.forEach(([dir, speed, kind, w, n], i) => {
        const span = P / n;
        lanes[first - i] = { dir, speed: speed * fast, kind, w, wet, shift: rand(0, P), items: Array.from({ length: n }, (_, k) => k * span + rand(0, Math.min(24, span - w - 10))) };
      });
      lay(ROAD, 11, false); lay(RIVER, 5, true);
      filled = PADS.map(() => false);
    };
    const spawn = () => { me = { x: 6 * CW + CW / 2, r: START, fx: 0, fr: START, hop: 0 }; best = START; time = TIME; queued = null; };
    const things = (lane) => lane.items.map(o => ((o + lane.shift) % P + P) % P - 70 + lane.w / 2);
    const lose = (why) => { if (dying) return; dying = 1.1; cause = why; api.sound('cancel'); api.say(why); };
    const hop = (d) => {
      if (dying) return;
      if (me.hop > 0) { queued = d; return; }
      const [dx, dr] = DIRS[d], r = me.r + dr;
      if (r > START) return;
      let x = me.x + dx * CW;
      if (x < CW / 2 || x > W - CW / 2) return;
      if (!lanes[r]?.wet) x = Math.round((x - CW / 2) / CW) * CW + CW / 2;
      Object.assign(me, { fx: me.x, fr: me.r, x, r, hop: 0.13 });
      api.sound('plink-1');
    };
    const land = () => {
      const lane = lanes[me.r];
      if (me.r === 0) {
        const i = PADS.findIndex(px => Math.abs(px - me.x) < 18);
        if (i < 0 || filled[i]) return lose(i < 0 ? 'Poliwag bumped the hedge!' : 'That pad is taken!');
        filled[i] = true; me.x = PADS[i];
        api.add(50 + Math.ceil(time) * 2); api.sound('coins', 'confirm'); cheer = 1;
        if (filled.every(Boolean)) {
          api.add(200); level += 1; build(); api.sound('stat-up', 'confirm');
          api.say(`Every pad filled! Crossing ${level + 1}, and quicker.`);
        } else api.say(`Home! ${filled.filter(f => !f).length} pads to go.`);
        return spawn();
      }
      if (me.r < best) { best = me.r; api.add(10); }
      if (lane?.wet && !things(lane).some(x => Math.abs(x - me.x) < lane.w / 2 - 2)) lose('Splash! Poliwag fell in.');
    };
    build(); spawn();
    return {
      tick(dt) {
        cheer = Math.max(0, cheer - dt);
        for (const lane of Object.values(lanes)) lane.shift += lane.dir * lane.speed * dt;
        if (dying) {
          dying -= dt;
          if (dying <= 0) { dying = 0; lives -= 1; if (lives <= 0) return api.over('Out of lives!'); spawn(); api.say(`${lives} ${lives === 1 ? 'life' : 'lives'} left. Hop on!`); }
          return;
        }
        time -= dt;
        if (time <= 0) return lose('Time\'s up!');
        if (me.hop > 0) { me.hop -= dt; if (me.hop <= 0) { me.hop = 0; land(); if (queued && !dying) { const q = queued; queued = null; hop(q); } } return; }
        const lane = lanes[me.r];
        if (!lane) return;
        if (lane.wet) {
          me.x += lane.dir * lane.speed * dt;
          if (me.x < 4 || me.x > W - 4) return lose('Poliwag was swept away!');
          if (!things(lane).some(x => Math.abs(x - me.x) < lane.w / 2 - 2)) return lose('Splash! Poliwag fell in.');
        } else if (things(lane).some(x => Math.abs(x - me.x) < lane.w / 2 + 2)) lose(lane.kind === 'rapidash' ? 'Rapidash ran Poliwag over!' : 'Tauros trampled Poliwag!');
      },
      down(x, y) { swipe = [x, y, false]; },
      move(x, y, pressed) {
        if (!pressed || !swipe || swipe[2]) return;
        const dx = x - swipe[0], dy = y - swipe[1];
        if (Math.hypot(dx, dy) < 16) return;
        swipe[2] = true;
        hop(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
      },
      up(x, y) {
        if (swipe && !swipe[2]) {
          const dx = x - me.x, dy = y - (rowY(me.r) + RH / 2);
          hop(Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
        }
        swipe = null;
      },
      key(k, down) { if (down && DIRS[k]) hop(k); },
      draw(g, now) {
        g.drawImage(backdrop(g), 0, 0, W, H);
        g.strokeStyle = 'rgba(255, 255, 255, 0.14)'; g.lineWidth = 1.5;
        for (let r = 1; r < BANK; r++) for (let i = 0; i < 5; i++) {
          const x = ((i * 70 + now / 30 * (r % 2 ? 1 : -1)) % 350 + 350) % 350 - 25, y = rowY(r) + 8 + (i % 3) * 7;
          g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 3, x + 12, y); g.quadraticCurveTo(x + 18, y + 3, x + 24, y); g.stroke();
        }
        PADS.forEach((px, i) => {
          const y = rowY(0) + RH / 2 + 2;
          g.fillStyle = '#1e5aa0'; g.beginPath(); g.ellipse(px, y, 19, 13, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = filled[i] ? '#6ad06a' : '#4aa84e'; g.beginPath(); g.moveTo(px, y); g.ellipse(px, y, 14, 9, 0, 0.35, Math.PI * 2 - 0.35); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(20, 60, 20, 0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px, y); g.lineTo(px - 8, y - 4); g.moveTo(px, y); g.lineTo(px - 6, y + 6); g.stroke();
          if (filled[i]) drawMon(g, 'poliwag', px, y + 8, 22);
          else { g.fillStyle = '#f4a8c8'; g.beginPath(); g.arc(px + 6, y - 2, 3, 0, Math.PI * 2); g.fill(); }
        });
        for (const [r, lane] of Object.entries(lanes)) {
          const y = rowY(+r);
          let lg = null;
          if (lane.kind === 'log') { lg = g.createLinearGradient(0, y + 4, 0, y + RH - 4); lg.addColorStop(0, '#a8743e'); lg.addColorStop(0.5, '#8a5a2c'); lg.addColorStop(1, '#5e3a1a'); }
          for (const x of things(lane)) {
            if (lane.kind === 'log') {
              g.fillStyle = lg; g.beginPath(); g.roundRect(x - lane.w / 2, y + 5, lane.w, RH - 10, 10); g.fill();
              g.strokeStyle = 'rgba(60, 30, 10, 0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - lane.w / 2 + 12, y + 12); g.lineTo(x + lane.w / 2 - 16, y + 12); g.moveTo(x - lane.w / 2 + 20, y + 19); g.lineTo(x + lane.w / 2 - 10, y + 19); g.stroke();
              g.fillStyle = '#d8b07a'; g.beginPath(); g.ellipse(x + lane.dir * (lane.w / 2 - 4), y + RH / 2, 4, 9, 0, 0, Math.PI * 2); g.fill();
              g.strokeStyle = '#a07a48'; g.beginPath(); g.ellipse(x + lane.dir * (lane.w / 2 - 4), y + RH / 2, 2, 5, 0, 0, Math.PI * 2); g.stroke();
            } else if (lane.kind === 'lapras') {
              g.fillStyle = 'rgba(10, 40, 90, 0.35)'; g.beginPath(); g.ellipse(x, y + RH - 6, lane.w / 2, 6, 0, 0, Math.PI * 2); g.fill();
              g.strokeStyle = 'rgba(255, 255, 255, 0.5)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y + RH - 6, lane.w / 2 + 2, 5, 0, 0, Math.PI * 2); g.stroke();
              drawMon(g, 'lapras', x, y + RH - 2, 34, lane.dir > 0);
            } else {
              g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.beginPath(); g.ellipse(x, y + RH - 4, lane.w / 2 - 2, 4, 0, 0, Math.PI * 2); g.fill();
              drawMon(g, lane.kind, x, y + RH - 2, lane.kind === 'rapidash' ? 32 : 30, lane.dir > 0);
              if (lane.kind === 'rapidash') { g.fillStyle = 'rgba(255, 160, 40, 0.35)'; g.beginPath(); g.ellipse(x - lane.dir * 24, y + RH / 2 + 2, 10, 4, 0, 0, Math.PI * 2); g.fill(); }
            }
          }
        }
        if (dying || me) {
          const t = me.hop > 0 ? 1 - me.hop / 0.13 : 1, x = me.fx + (me.x - me.fx) * (me.hop > 0 ? t : 1), y = rowY(me.hop > 0 ? me.fr + (me.r - me.fr) * t : me.r) + RH - 3;
          const lift = me.hop > 0 ? Math.sin(t * Math.PI) * 7 : 0;
          if (dying && lanes[me.r]?.wet) {
            const k = 1 - dying / 1.1;
            g.strokeStyle = `rgba(255, 255, 255, ${1 - k})`; g.lineWidth = 2;
            for (const s of [1, 0.6]) { g.beginPath(); g.ellipse(x, y - 8, 6 + k * 18 * s, 3 + k * 7 * s, 0, 0, Math.PI * 2); g.stroke(); }
          } else if (dying) {
            if (Math.floor(now / 90) % 2) drawMon(g, 'poliwag', x, y, 22);
            banner(g, '✕', x, y - 12, 16, '#ff6a6a');
          } else {
            g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.beginPath(); g.ellipse(x, y, 9 - lift / 2, 3, 0, 0, Math.PI * 2); g.fill();
            drawMon(g, 'poliwag', x, y - lift, 24);
          }
        }
        for (let i = 0; i < lives; i++) drawMon(g, 'poliwag', 14 + i * 20, TOP - 2, 17);
        g.fillStyle = 'rgba(255, 255, 255, 0.15)'; g.beginPath(); g.roundRect(W - 112, 7, 100, 8, 4); g.fill();
        g.fillStyle = time > 8 ? '#6ad06a' : '#f05a4a'; g.beginPath(); g.roundRect(W - 112, 7, 100 * Math.max(0, time) / TIME, 8, 4); g.fill();
        g.font = '700 11px system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#cfe0f4'; g.fillText(`Lv ${level + 1}`, W - 118, 11);
        if (cheer > 0) banner(g, 'HOME!', W / 2, rowY(BANK) + RH / 2, 20 + (1 - cheer) * 6, '#ffd84a');
      },
    };
  },
}, onClose);

/** The board's still parts (the bar, the river's water, the hedge, the bank, the road and the start), painted once at the
    screen's scale: repainting their gradients every frame cost the game its frame rate (the user's ask, 2026-10-12). */
let still = null;
function backdrop(g) {
  const k = g.getTransform().a;
  if (still?.k === k) return still.c;
  const c = document.createElement('canvas');
  c.width = Math.ceil(W * k); c.height = Math.ceil(H * k);
  const bg = c.getContext('2d');
  bg.scale(k, k);
  paintBackdrop(bg);
  still = { k, c };
  return c;
}
function paintBackdrop(g) {
  g.fillStyle = '#1e2a3a'; g.fillRect(0, 0, W, TOP);
  const grass = (r, a, b) => { const gg = g.createLinearGradient(0, rowY(r), 0, rowY(r) + RH); gg.addColorStop(0, a); gg.addColorStop(1, b); g.fillStyle = gg; g.fillRect(0, rowY(r), W, RH); };
  const river = g.createLinearGradient(0, rowY(0), 0, rowY(BANK)); river.addColorStop(0, '#1a5aa8'); river.addColorStop(1, '#2a7ac8');
  g.fillStyle = river; g.fillRect(0, rowY(0), W, RH * BANK);
  g.fillStyle = '#2e6a32'; g.fillRect(0, rowY(0), W, RH * 0.55);
  for (let x = 0; x < W; x += 16) { g.fillStyle = x % 32 ? '#3a8a3e' : '#347a38'; g.beginPath(); g.arc(x + 8, rowY(0) + 14, 11, 0, Math.PI * 2); g.fill(); }
  grass(BANK, '#6ab84a', '#4e9a3a');
  g.fillStyle = '#d8c890'; g.fillRect(0, rowY(BANK) + RH - 4, W, 4); g.fillRect(0, rowY(BANK), W, 3);
  const road = g.createLinearGradient(0, rowY(7), 0, rowY(12)); road.addColorStop(0, '#4a4a54'); road.addColorStop(1, '#3a3a44');
  g.fillStyle = road; g.fillRect(0, rowY(7), W, RH * 5);
  g.fillStyle = 'rgba(255, 230, 120, 0.7)';
  for (let r = 8; r < 12; r++) for (let x = 6; x < W; x += 30) g.fillRect(x, rowY(r) - 1, 14, 2);
  grass(START, '#7ac85a', '#5aa83e');
  for (let i = 0; i < 9; i++) { g.fillStyle = ['#f8f0a0', '#f8b0c8', '#ffffff'][i % 3]; g.beginPath(); g.arc(14 + i * 34, rowY(START) + 8 + (i % 2) * 14, 2.4, 0, Math.PI * 2); g.fill(); }
}
