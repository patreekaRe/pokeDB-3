/* arcade-crossing.js  -  Poliwag Crossing, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick), after
   Frogger: Poliwag hops a lane at a time over a road of charging Pokémon, rests on the bank, then rides Lapras and logs
   over the river to a free lily pad. Swipe, tap a side of Poliwag or use the arrow keys.
   Since 2026-10-17 (the user's ask: every arcade game far more detailed, with more in it, and harder the longer you
   last): a painted meadow, road and river with splashes, dust and hop squash; road lanes of Tauros, Rapidash, Ponyta
   and a slow, wide Snorlax; Lapras that dive under for a moment (ripples warn first, from crossing 2); an Ekans
   slithering along the bank (from crossing 3); an Arbok lurking in a lily pad now and then (from crossing 4); a
   Butterfree landing on a free pad for a bonus; a hop streak for every new lane in a row without stepping back. Each
   crossing is quicker, the river's lanes sparser and the clock shorter, without a ceiling. Three lives, and one back
   every third crossing. */

import { runArcade, drawMon, banner, rand, pick, stamp } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 300, TOP = 22, RH = 30, ROWS = 13, H = TOP + RH * ROWS, CW = 25, LIVES = 3, P = W + 140, HOP = 0.13;
const PADS = [30, 90, 150, 210, 270], START = 12, BANK = 6, TAU = Math.PI * 2;
/* bottom to top: the road's lanes (rows 11-7), then the river's (rows 5-1); [dir, speed, kind, width, count] */
const ROAD = [[-1, 38, 'tauros', 40, 3], [1, 52, 'ponyta', 34, 3], [-1, 90, 'rapidash', 42, 1], [1, 26, 'snorlax', 60, 2], [-1, 66, 'rapidash', 42, 2]];
const RIVER = [[1, 34, 'log', 78, 3], [-1, 46, 'lapras', 52, 4], [1, 60, 'log', 110, 2], [-1, 40, 'lapras', 52, 3], [1, 52, 'log', 70, 3]];
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
const rowY = (r) => TOP + r * RH;
const SIZE = { tauros: 30, ponyta: 26, rapidash: 32, snorlax: 36 };

export const openCrossing = (onClose) => runArcade({
  id: 'crossing', title: 'Poliwag Crossing', colour: '#3a8ae0', W, H,
  swipe: true,
  sounds: ['fx-splash', 'fx-boing', 'fx-ding', 'hit'],
  intro: 'Hop Poliwag over the road and river to the lily pads!',
  help: [['Swipe the screen to hop that way.', 'A tap beside Poliwag hops it there too, and the arrow keys work.'], ['Dodge the Tauros, Ponyta, Rapidash and Snorlax.', 'In the river ride Lapras and the logs, but Lapras dive now and then: watch for the ripples.'], ['Later crossings bring an Ekans on the bank', 'and an Arbok hiding in a pad. A Butterfree on a pad is a bonus!'], [`Fill all ${PADS.length} pads for the next crossing, quicker.`, `10 a new lane (more on a streak), 50 a pad plus the time left. ${LIVES} lives, one back every third crossing.`]],
  make(api) {
    let level = 0, lives = LIVES, lanes, filled, me, best, time, limit, dying = 0, cause = '', swipe = null, queued = null, cheer = 0, t = 0, streak = 0, shake = 0;
    let snake = null, lurk = { pad: -1, t: 4 }, fly = { pad: -1, t: 3 };
    const bits = [], pops = [], calm = calmFx();
    const build = () => {
      const fast = 1 + level * 0.15;
      lanes = {};
      const lay = (defs, first, wet) => defs.forEach(([dir, speed, kind, w, n], i) => {
        // the river thins as the crossings go on (one fewer log or Lapras a lane every other crossing, never under two)
        if (wet) n = Math.max(2, n - Math.floor((level + i) / 3));
        const span = P / n;
        lanes[first - i] = { dir, speed: speed * fast, kind, w, wet, dive: kind === 'lapras' && level >= 1, shift: rand(0, P), items: Array.from({ length: n }, (_, k) => ({ at: k * span + rand(0, Math.max(0, Math.min(24, span - w - 10))), ph: rand(0, TAU) })) };
      });
      lay(ROAD, 11, false); lay(RIVER, 5, true);
      filled = PADS.map(() => false);
      limit = Math.max(15, 30 - level * 2);
      snake = level >= 2 ? { x: -40, dir: 1, speed: 30 + level * 4 } : null;
    };
    const spawn = () => { me = { x: 6 * CW + CW / 2, r: START, fx: 0, fr: START, hop: 0 }; best = START; time = limit; queued = null; streak = 0; };
    const things = (lane) => lane.items.map(o => ({ x: ((o.at + lane.shift) % P + P) % P - 70 + lane.w / 2, o }));
    const under = (lane, o) => lane.dive && Math.sin(t * 0.9 + o.ph) < -0.6;
    const warn = (lane, o) => lane.dive && Math.sin(t * 0.9 + o.ph) < -0.25;
    const riding = (lane) => things(lane).some(({ x, o }) => Math.abs(x - me.x) < lane.w / 2 - 2 && !under(lane, o));
    const popup = (x, y, text, c = '#fff') => pops.push({ x, y, text, c, t: 0.9 });
    const burst = (x, y, c, n, up = 60) => { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(20, 80); bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - up, t: rand(0.35, 0.7), c }); } };
    const lose = (why, wet) => {
      if (dying) return;
      dying = 1.1; cause = why; streak = 0; if (!calm) shake = 5;
      api.sound(wet ? 'fx-splash' : 'hit', 'cancel'); api.say(why);
      if (wet) burst(me.x, rowY(me.r) + RH / 2, '#c8e8ff', 12, 90);
    };
    const hop = (d) => {
      if (dying) return;
      if (me.hop > 0) { queued = d; return; }
      const [dx, dr] = DIRS[d], r = me.r + dr;
      if (r > START || r < 0) return;
      let x = me.x + dx * CW;
      if (x < CW / 2 || x > W - CW / 2) return;
      if (!lanes[r]?.wet) x = Math.round((x - CW / 2) / CW) * CW + CW / 2;
      if (dr > 0) streak = 0;
      Object.assign(me, { fx: me.x, fr: me.r, x, r, hop: HOP });
      api.sound('plink-1');
    };
    const land = () => {
      const lane = lanes[me.r];
      if (me.r === 0) {
        const i = PADS.findIndex(px => Math.abs(px - me.x) < 18);
        if (i < 0 || filled[i]) return lose(i < 0 ? 'Poliwag bumped the hedge!' : 'That pad is taken!');
        if (lurk.pad === i && lurk.t > 0) return lose('An Arbok was hiding in that pad!');
        filled[i] = true; me.x = PADS[i];
        let pts = 50 + Math.ceil(time) * 2;
        const caught = fly.pad === i && fly.t > 0;
        if (caught) { pts += 200; fly.pad = -1; api.sound('fx-ding', 'coins'); api.say('Caught the Butterfree! +200'); }
        api.add(pts); popup(PADS[i], rowY(0) + 6, `+${pts}`, '#ffd84a'); api.sound('coins', 'confirm'); cheer = 1;
        burst(PADS[i], rowY(0) + RH / 2, '#9af09a', 10);
        if (filled.every(Boolean)) {
          const bonus = 300 + level * 100;
          api.add(bonus); level += 1; build(); api.sound('stat-up', 'confirm');
          if (level % 3 === 0 && lives < 5) lives += 1;
          const news = level === 1 ? ' Lapras dive now!' : level === 2 ? ' An Ekans prowls the bank!' : level === 3 ? ' Arbok hide in the pads!' : '';
          api.say(`Every pad filled! +${bonus}. Crossing ${level + 1}, quicker.${news}${level % 3 === 0 ? ' An extra life!' : ''}`);
        } else if (!caught) api.say(`Home! ${filled.filter(f => !f).length} pads to go.`);
        return spawn();
      }
      if (me.r < best) {
        best = me.r; streak += 1;
        const pts = 10 + Math.min(40, (streak - 1) * 5);
        api.add(pts); if (streak > 2) popup(me.x, rowY(me.r) - 2, `+${pts}`, '#cfe8ff');
      }
      if (lane?.wet && !riding(lane)) lose('Splash! Poliwag fell in.', true);
      if (!lane?.wet) burst(me.x, rowY(me.r) + RH - 3, lane ? '#8a8a96' : '#7ac85a', 4, 30);
    };
    build(); spawn();
    return {
      tick(dt) {
        t += dt; cheer = Math.max(0, cheer - dt); shake = Math.max(0, shake - dt * 25);
        for (const s of bits) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; s.t -= dt; }
        for (let i = bits.length - 1; i >= 0; i--) if (bits[i].t <= 0) bits.splice(i, 1);
        for (let i = pops.length - 1; i >= 0; i--) { pops[i].t -= dt; pops[i].y -= 24 * dt; if (pops[i].t <= 0) pops.splice(i, 1); }
        for (const lane of Object.values(lanes)) lane.shift += lane.dir * lane.speed * dt;
        if (snake) { snake.x += snake.dir * snake.speed * dt; if (snake.x > W + 40 || snake.x < -40) { snake.dir = -snake.dir; snake.x = Math.max(-40, Math.min(W + 40, snake.x)); } }
        if (level >= 3 && (lurk.t -= dt) <= -5) { const free = PADS.map((_, i) => i).filter(i => !filled[i] && i !== fly.pad); lurk = { pad: free.length ? pick(free) : -1, t: 3.5 }; }
        if ((fly.t -= dt) <= -6) { const free = PADS.map((_, i) => i).filter(i => !filled[i] && i !== lurk.pad); fly = { pad: free.length ? pick(free) : -1, t: 5 }; }
        if (dying) {
          dying -= dt;
          if (dying <= 0) { dying = 0; lives -= 1; if (lives <= 0) return api.over('Out of lives!'); spawn(); api.say(`${lives} ${lives === 1 ? 'life' : 'lives'} left. Hop on!`); }
          return;
        }
        time -= dt;
        if (time <= 0) return lose('Time\'s up!');
        if (me.hop > 0) { me.hop -= dt; if (me.hop <= 0) { me.hop = 0; land(); if (queued && !dying) { const q = queued; queued = null; hop(q); } } return; }
        if (snake && me.r === BANK && Math.abs(snake.x - me.x) < 18) return lose('Ekans snapped up Poliwag!');
        const lane = lanes[me.r];
        if (!lane) return;
        if (lane.wet) {
          me.x += lane.dir * lane.speed * dt;
          if (me.x < 4 || me.x > W - 4) return lose('Poliwag was swept away!', true);
          if (!riding(lane)) return lose(lane.kind === 'lapras' ? 'Lapras dived! Poliwag fell in.' : 'Splash! Poliwag fell in.', true);
        } else if (things(lane).some(({ x }) => Math.abs(x - me.x) < lane.w / 2 + 2)) lose(`${lane.kind[0].toUpperCase()}${lane.kind.slice(1)} ran Poliwag over!`);
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
        g.save();
        if (shake) g.translate(rand(-shake, shake), rand(-shake, shake));
        g.strokeStyle = 'rgba(255, 255, 255, 0.16)'; g.lineWidth = 1.5;   // the current's ripples
        for (let r = 1; r < BANK; r++) for (let i = 0; i < 5; i++) {
          const x = ((i * 70 + now / 30 * lanes[r].dir) % 350 + 350) % 350 - 25, y = rowY(r) + 8 + (i % 3) * 7;
          g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y - 3, x + 12, y); g.quadraticCurveTo(x + 18, y + 3, x + 24, y); g.stroke();
        }
        g.fillStyle = 'rgba(255, 255, 255, 0.5)';   // glints on the water
        for (let i = 0; i < 8; i++) { const a = 0.5 + 0.5 * Math.sin(now / 300 + i * 2.1); if (a > 0.8) g.fillRect((i * 41 + 13) % W, rowY(1 + (i % 5)) + 5 + (i * 7) % 20, 3, 1.2); }
        PADS.forEach((px, i) => {
          const y = rowY(0) + RH / 2 + 2;
          g.fillStyle = 'rgba(10, 40, 90, 0.5)'; g.beginPath(); g.ellipse(px, y + 1, 19, 13, 0, 0, TAU); g.fill();
          g.fillStyle = filled[i] ? '#6ad06a' : '#4aa84e'; g.beginPath(); g.moveTo(px, y); g.ellipse(px, y, 14, 9, 0, 0.35, TAU - 0.35); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(20, 60, 20, 0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(px, y); g.lineTo(px - 8, y - 4); g.moveTo(px, y); g.lineTo(px - 6, y + 6); g.moveTo(px, y); g.lineTo(px + 7, y + 5); g.stroke();
          if (filled[i]) drawMon(g, 'poliwag', px, y + 8, 22);
          else if (lurk.pad === i && lurk.t > 0) { const up = Math.min(1, (3.5 - lurk.t) * 3, lurk.t * 3); g.globalAlpha = up; drawMon(g, 'arbok', px, y + 9, 26 * up + 4); g.globalAlpha = 1; }
          else if (lurk.pad === i && lurk.t > -1.2 && lurk.t <= 0) { g.strokeStyle = 'rgba(160, 60, 200, 0.6)'; g.beginPath(); g.ellipse(px, y, 10 + (now / 60) % 6, 5, 0, 0, TAU); g.stroke(); }
          else { g.fillStyle = '#f4a8c8'; g.beginPath(); g.arc(px + 6, y - 2, 3, 0, TAU); g.fill(); g.fillStyle = '#fff4c0'; g.beginPath(); g.arc(px + 6, y - 2, 1.2, 0, TAU); g.fill(); }
          if (fly.pad === i && fly.t > 0 && !filled[i]) drawMon(g, 'butterfree', px + Math.sin(now / 200) * 6, y - 2 + Math.sin(now / 130) * 3, 24, Math.sin(now / 400) > 0);
        });
        for (const [r, lane] of Object.entries(lanes)) {
          const y = rowY(+r);
          for (const { x, o } of things(lane)) {
            if (x < -lane.w || x > W + lane.w) continue;
            if (lane.kind === 'log') {
              stamp(g, `cr-log-${lane.w}`, x - lane.w / 2, y + 3, lane.w, RH - 6, (cg) => logArt(cg, lane.w, RH - 6));
            } else if (lane.kind === 'lapras') {
              const dip = lane.dive ? Math.max(0, -Math.sin(t * 0.9 + o.ph) - 0.25) / 0.75 : 0;
              if (warn(lane, o)) { g.strokeStyle = `rgba(255, 255, 255, ${0.4 + 0.3 * Math.sin(now / 80)})`; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y + RH - 6, lane.w / 2 + 4 + (now / 50) % 5, 6, 0, 0, TAU); g.stroke(); }
              if (under(lane, o)) { g.fillStyle = 'rgba(10, 40, 90, 0.4)'; g.beginPath(); g.ellipse(x, y + RH - 8, lane.w / 2 - 6, 4, 0, 0, TAU); g.fill(); continue; }
              g.fillStyle = 'rgba(10, 40, 90, 0.35)'; g.beginPath(); g.ellipse(x, y + RH - 6, lane.w / 2, 6, 0, 0, TAU); g.fill();
              g.strokeStyle = 'rgba(255, 255, 255, 0.5)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y + RH - 6, lane.w / 2 + 2, 5, 0, 0, TAU); g.stroke();
              g.fillStyle = 'rgba(255, 255, 255, 0.45)'; g.beginPath(); g.ellipse(x - lane.dir * (lane.w / 2 + 3), y + RH - 6, 5, 2, 0, 0, TAU); g.fill();   // the wake
              g.globalAlpha = 1 - dip * 0.6; drawMon(g, 'lapras', x, y + RH - 2 + dip * 10, 34, lane.dir > 0); g.globalAlpha = 1;
            } else {
              g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.beginPath(); g.ellipse(x, y + RH - 4, lane.w / 2 - 2, 4, 0, 0, TAU); g.fill();
              const bob = lane.kind === 'snorlax' ? 0 : Math.abs(Math.sin(now / 90 + o.ph)) * 2;
              drawMon(g, lane.kind, x, y + RH - 2 - bob, SIZE[lane.kind], lane.dir > 0);
              if (lane.kind === 'rapidash' || lane.kind === 'ponyta') { g.fillStyle = 'rgba(255, 160, 40, 0.35)'; g.beginPath(); g.ellipse(x - lane.dir * lane.w * 0.55, y + RH / 2 + 2, 10, 4, 0, 0, TAU); g.fill(); }
              else { g.fillStyle = 'rgba(200, 190, 170, 0.35)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x - lane.dir * (lane.w / 2 + 4 + k * 5), y + RH - 5 - k, 2.5 - k * 0.5, 0, TAU); g.fill(); } }
            }
          }
        }
        if (snake) { const wig = Math.sin(now / 120) * 2; drawMon(g, 'ekans', snake.x, rowY(BANK) + RH - 1 + wig * 0.3, 26, snake.dir > 0); }
        if (dying || me) {
          const k = me.hop > 0 ? 1 - me.hop / HOP : 1, x = me.fx + (me.x - me.fx) * (me.hop > 0 ? k : 1), y = rowY(me.hop > 0 ? me.fr + (me.r - me.fr) * k : me.r) + RH - 3;
          const lift = me.hop > 0 ? Math.sin(k * Math.PI) * 8 : 0;
          if (dying && (lanes[me.r]?.wet || cause.includes('swept'))) {
            const d = 1 - dying / 1.1;
            g.strokeStyle = `rgba(255, 255, 255, ${1 - d})`; g.lineWidth = 2;
            for (const s of [1, 0.6]) { g.beginPath(); g.ellipse(x, y - 8, 6 + d * 18 * s, 3 + d * 7 * s, 0, 0, TAU); g.stroke(); }
          } else if (dying) {
            if (Math.floor(now / 90) % 2) drawMon(g, 'poliwag', x, y, 22);
            banner(g, '✕', x, y - 12, 16, '#ff6a6a');
          } else {
            g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.beginPath(); g.ellipse(x, y, 9 - lift / 2, 3, 0, 0, TAU); g.fill();
            drawMon(g, 'poliwag', x, y - lift, 24 + (me.hop > 0 ? Math.sin(k * Math.PI) * 3 : 0));
          }
        }
        for (const s of bits) { g.globalAlpha = Math.max(0, s.t * 1.5); g.fillStyle = s.c; g.fillRect(s.x - 1.2, s.y - 1.2, 2.4, 2.4); }
        g.globalAlpha = 1;
        g.font = '800 11px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        for (const p of pops) { g.globalAlpha = Math.min(1, p.t * 2); g.fillStyle = 'rgba(0, 0, 0, 0.6)'; g.fillText(p.text, p.x + 1, p.y + 1); g.fillStyle = p.c; g.fillText(p.text, p.x, p.y); }
        g.globalAlpha = 1;
        g.restore();
        for (let i = 0; i < lives; i++) drawMon(g, 'poliwag', 14 + i * 20, TOP - 2, 17);
        g.fillStyle = 'rgba(255, 255, 255, 0.15)'; g.beginPath(); g.roundRect(W - 112, 7, 100, 8, 4); g.fill();
        g.fillStyle = time > limit * 0.3 ? '#6ad06a' : '#f05a4a'; g.beginPath(); g.roundRect(W - 112, 7, 100 * Math.max(0, time) / limit, 8, 4); g.fill();
        g.font = '700 11px system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#cfe0f4'; g.fillText(`Lv ${level + 1}`, W - 118, 11);
        if (streak > 2 && !dying) { g.textAlign = 'center'; g.fillStyle = '#ffd84a'; g.fillText(`STREAK ${streak}`, W / 2 - 10, 11); }
        if (cheer > 0) banner(g, 'HOME!', W / 2, rowY(BANK) + RH / 2, 20 + (1 - cheer) * 6, '#ffd84a');
      },
    };
  },
}, onClose);

/** A log `w` long in a w x h box, painted once and stamped. */
function logArt(g, w, h) {
  const lg = g.createLinearGradient(0, 2, 0, h - 2); lg.addColorStop(0, '#b8844a'); lg.addColorStop(0.45, '#8a5a2c'); lg.addColorStop(1, '#5e3a1a');
  g.fillStyle = 'rgba(10, 40, 90, 0.4)'; g.beginPath(); g.roundRect(1, 4, w, h - 4, 10); g.fill();
  g.fillStyle = lg; g.beginPath(); g.roundRect(0, 2, w, h - 4, 10); g.fill();
  g.strokeStyle = 'rgba(60, 30, 10, 0.45)'; g.lineWidth = 1;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(10 + i * 4, 8 + i * 5); g.lineTo(w - 12 - i * 6, 8 + i * 5); g.stroke(); }
  g.fillStyle = '#4a7a2a'; for (let x = 16; x < w - 16; x += 23) { g.beginPath(); g.ellipse(x, 4, 4, 2, 0, 0, TAU); g.fill(); }   // moss
  g.fillStyle = '#5e3a1a'; g.beginPath(); g.ellipse(w * 0.6, h / 2 + 2, 3, 2, 0, 0, TAU); g.fill();   // a knot
  for (const ex of [4, w - 4]) {
    g.fillStyle = '#d8b07a'; g.beginPath(); g.ellipse(ex, h / 2, 4, (h - 4) / 2 - 1, 0, 0, TAU); g.fill();
    g.strokeStyle = '#a07a48'; g.beginPath(); g.ellipse(ex, h / 2, 2, 5, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(ex, h / 2, 0.8, 2, 0, 0, TAU); g.stroke();
  }
}

/** The board's still parts, painted once at the screen's scale: repainting their gradients every frame cost the game its
    frame rate (the user's ask, 2026-10-12). */
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
  const river = g.createLinearGradient(0, rowY(0), 0, rowY(BANK)); river.addColorStop(0, '#13509a'); river.addColorStop(1, '#2a80cc');
  g.fillStyle = river; g.fillRect(0, rowY(0), W, RH * BANK);
  g.fillStyle = 'rgba(255, 255, 255, 0.05)'; for (let r = 1; r < BANK; r++) g.fillRect(0, rowY(r) + RH - 2, W, 1);
  g.fillStyle = 'rgba(0, 20, 50, 0.25)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse((i * 53) % W, rowY(1) + (i * 37) % (RH * 5), 9, 3, 0, 0, TAU); g.fill(); }   // stones on the riverbed
  g.fillStyle = '#245a28'; g.fillRect(0, rowY(0), W, RH * 0.55);   // the far hedge, bushes and berries
  for (let x = 0; x < W; x += 16) { g.fillStyle = x % 32 ? '#3a8a3e' : '#347a38'; g.beginPath(); g.arc(x + 8, rowY(0) + 14, 11, 0, TAU); g.fill(); g.fillStyle = 'rgba(255, 255, 255, 0.12)'; g.beginPath(); g.arc(x + 5, rowY(0) + 9, 4, 0, TAU); g.fill(); }
  for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#e8384a' : '#5a7af0'; g.beginPath(); g.arc((i * 27 + 7) % W, rowY(0) + 6 + (i % 3) * 5, 1.6, 0, TAU); g.fill(); }
  for (const px of PADS) { g.fillStyle = '#2a7ac8'; g.beginPath(); g.ellipse(px, rowY(0) + RH / 2 + 2, 21, 14, 0, 0, TAU); g.fill(); }
  g.strokeStyle = '#3a7a3a'; g.lineWidth = 1.5;   // reeds along both banks of the river
  for (let i = 0; i < 18; i++) { const x = (i * 17 + 5) % W, y0 = rowY(BANK); g.beginPath(); g.moveTo(x, y0 + 2); g.quadraticCurveTo(x - 2, y0 - 6, x + 1, y0 - 11 - (i % 3) * 3); g.stroke(); if (i % 4 === 0) { g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(x + 1, y0 - 12 - (i % 3) * 3, 1.6, 3.5, 0, 0, TAU); g.fill(); } }
  grass(BANK, '#6ab84a', '#4e9a3a');
  g.fillStyle = 'rgba(255, 255, 255, 0.18)'; for (let i = 0; i < 20; i++) g.fillRect((i * 31) % W, rowY(BANK) + 6 + (i * 7) % 16, 1, 3);
  g.fillStyle = '#d8c890'; g.fillRect(0, rowY(BANK) + RH - 4, W, 4); g.fillRect(0, rowY(BANK), W, 3);
  const road = g.createLinearGradient(0, rowY(7), 0, rowY(12)); road.addColorStop(0, '#4a4a54'); road.addColorStop(1, '#3a3a44');
  g.fillStyle = road; g.fillRect(0, rowY(7), W, RH * 5);
  g.fillStyle = 'rgba(255, 255, 255, 0.05)'; for (let i = 0; i < 60; i++) g.fillRect((i * 47) % W, rowY(7) + (i * 29) % (RH * 5), 1.5, 1.5);   // grit
  g.fillStyle = 'rgba(0, 0, 0, 0.25)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse((i * 71 + 30) % W, rowY(8 + (i % 4)) + 14, 10, 3, 0.2, 0, TAU); g.fill(); }   // old cracks and patches
  g.fillStyle = '#b8b8c0'; g.fillRect(0, rowY(7), W, 2); g.fillRect(0, rowY(12) - 2, W, 2);   // the kerbs
  g.fillStyle = 'rgba(255, 230, 120, 0.7)';
  for (let r = 8; r < 12; r++) for (let x = 6; x < W; x += 30) g.fillRect(x, rowY(r) - 1, 14, 2);
  grass(START, '#7ac85a', '#5aa83e');
  for (let i = 0; i < 9; i++) { g.fillStyle = ['#f8f0a0', '#f8b0c8', '#ffffff'][i % 3]; g.beginPath(); g.arc(14 + i * 34, rowY(START) + 8 + (i % 2) * 14, 2.4, 0, TAU); g.fill(); g.fillStyle = '#f0c030'; g.beginPath(); g.arc(14 + i * 34, rowY(START) + 8 + (i % 2) * 14, 0.9, 0, TAU); g.fill(); }
}
