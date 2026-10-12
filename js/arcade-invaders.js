/* arcade-invaders.js  -  Beedrill Invaders, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick), after Space
   Invaders: Pikachu holds the ground under a swarm of Beedrill, Kakuna and Weedle marching side to side and stepping down,
   dropping Poison Stings. Drag (or the joystick or arrow keys) to move; the cabinet's FIRE button (or Space) fires a
   Thunderbolt (it was drawn under the ground on the screen until 2026-10-12, the user's call) (it fired by itself until 2026-10-12: the user found the constant zapping annoying). A Butterfree drifts over
   now and then for a bonus. Three lives; a cleared swarm brings a faster one, and the swarm reaching Pikachu ends it. */

import { runArcade, drawMon, banner, rand, pick } from './arcade-kit.js';

const W = 300, H = 408, GROUND = 380, LED = GROUND + 17, ME_Y = GROUND, ME_H = 30, COLS = 7, CW = 32, RH = 28, LIVES = 3, FIRE = 0.36;
const ROWS = [['beedrill', 30], ['kakuna', 20], ['kakuna', 20], ['weedle', 10], ['weedle', 10]];
const STARS = Array.from({ length: 40 }, (_, i) => [(i * 73) % W, (i * 131) % (GROUND - 40), 0.4 + (i % 5) / 6]);

export const openInvaders = (onClose) => runArcade({
  id: 'invaders', title: 'Beedrill Invaders', colour: '#e8b020', W, H,
  pad: [['FIRE', 'fire']],
  intro: 'Hold back the swarm! Drag to move, press FIRE to zap.',
  help: [['Drag left and right to move Pikachu', '(or hold the arrow keys).'], ['Press the round FIRE button (or Space) for a Thunderbolt.', 'Up to three can fly at once, and they knock Poison Stings out of the air.'], ['Dodge the Stings:', `one takes a life; ${LIVES} and it's over, or when the swarm reaches Pikachu.`], ['Weedle 10, Kakuna 20, Beedrill 30.', 'Zap the Butterfree for 50 to 150. A cleared swarm comes back faster.']],
  make(api) {
    let me = W / 2, target = null, keyDir = 0, cool = 0.6, lives = LIVES, wave = 0, hurt = 0, pause = 0, step = 0, dir = 1, ox, oy, fly = null, flyIn = rand(10, 18), shake = 0;
    let bugs = [];
    const bolts = [], stings = [], sparks = [], pops = [];
    const swarm = () => {
      bugs = [];
      ROWS.forEach(([id, pts], r) => { for (let c = 0; c < COLS; c++) bugs.push({ id, pts, r, c, hit: 0 }); });
      ox = (W - COLS * CW) / 2; oy = 56 + Math.min(4, wave) * 8; dir = 1; step = 0;
    };
    swarm();
    const at = (b) => [ox + b.c * CW + CW / 2, oy + b.r * RH + RH / 2];
    const burst = (x, y, c, n = 10) => { for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), s = rand(40, 140); sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.3, 0.6), c }); } };
    const fire = () => { if (cool > 0 || hurt > 1 || bolts.length >= 3) return; bolts.push({ x: me, y: ME_Y - ME_H + 4 }); cool = FIRE; api.sound('plink-1'); };
    const ouch = () => {
      lives -= 1; hurt = 1.6; shake = 0.4; stings.length = 0; burst(me, ME_Y - 14, '#c070e0', 16);
      api.sound('cancel');
      if (lives <= 0) return api.over('Pikachu fainted!');
      api.say(`Ouch! ${lives} ${lives === 1 ? 'life' : 'lives'} left.`);
    };
    return {
      tick(dt) {
        if (target != null) me += Math.max(-360 * dt, Math.min(360 * dt, target - me)); else me += keyDir * 240 * dt;
        me = Math.max(16, Math.min(W - 16, me));
        cool -= dt; hurt = Math.max(0, hurt - dt); shake = Math.max(0, shake - dt);
        for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 200 * dt; s.t -= dt; }
        for (const p of pops) { p.y -= 24 * dt; p.t -= dt; }
        while (sparks.length && sparks[0].t <= 0) sparks.shift();
        while (pops.length && pops[0].t <= 0) pops.shift();
        if (pause > 0) { pause -= dt; if (pause <= 0) swarm(); return; }
        const alive = bugs.filter(b => !b.hit);
        const speed = (18 + wave * 7) * (1 + 2.6 * (1 - alive.length / bugs.length));
        ox += dir * speed * dt; step += dt * speed / 12;
        const xs = alive.map(b => at(b)[0]);
        if ((dir > 0 && Math.max(...xs) > W - 14) || (dir < 0 && Math.min(...xs) < 14)) { dir = -dir; oy += 9; api.sound('plink-2'); }
        if (Math.max(...alive.map(b => at(b)[1])) + 12 >= ME_Y - ME_H + 6) { shake = 0.4; return api.over('The swarm reached Pikachu!'); }
        if (Math.random() < dt * (0.7 + wave * 0.25 + (1 - alive.length / bugs.length) * 0.8)) {
          const cols = new Map(); for (const b of alive) if (!cols.has(b.c) || cols.get(b.c).r < b.r) cols.set(b.c, b);
          const near = [...cols.values()].sort((a, b) => Math.abs(at(a)[0] - me) - Math.abs(at(b)[0] - me));
          const b = Math.random() < 0.45 ? near[0] : pick(near), [x, y] = at(b);
          stings.push({ x, y: y + 8, vy: 120 + wave * 12 + (b.id === 'beedrill' ? 30 : 0) });
        }
        flyIn -= dt;
        if (!fly && flyIn <= 0) { const l = Math.random() < 0.5; fly = { x: l ? -20 : W + 20, v: l ? 60 : -60, y: 32 }; }
        if (fly) { fly.x += fly.v * dt; if (fly.x < -30 || fly.x > W + 30) { fly = null; flyIn = rand(14, 24); } }
        for (let i = bolts.length - 1; i >= 0; i--) {
          const o = bolts[i]; o.y -= 330 * dt;
          let gone = o.y < -10;
          if (!gone && fly && Math.abs(o.x - fly.x) < 16 && Math.abs(o.y - fly.y) < 14) {
            const pts = pick([50, 100, 100, 150]); api.add(pts); pops.push({ x: fly.x, y: fly.y, t: 1, text: `+${pts}` });
            burst(fly.x, fly.y, '#a8d8ff', 16); api.sound('coins', 'stat-up'); fly = null; flyIn = rand(14, 24); gone = true;
          }
          if (!gone) for (const b of alive) {
            if (b.hit) continue;
            const [x, y] = at(b);
            if (Math.abs(o.x - x) < 12 && Math.abs(o.y - y) < 12) {
              b.hit = 1; api.add(b.pts); burst(x, y, b.id === 'beedrill' ? '#f0c020' : b.id === 'kakuna' ? '#e8d050' : '#e89040'); api.sound('select'); gone = true; break;
            }
          }
          if (!gone) for (let j = stings.length - 1; j >= 0; j--) if (Math.abs(stings[j].x - o.x) < 5 && Math.abs(stings[j].y - o.y) < 10) { stings.splice(j, 1); burst(o.x, o.y, '#fff8a0', 5); gone = true; break; }
          if (gone) bolts.splice(i, 1);
        }
        for (let i = stings.length - 1; i >= 0; i--) {
          const s = stings[i]; s.y += s.vy * dt;
          if (s.y > GROUND) { stings.splice(i, 1); continue; }
          if (!hurt && Math.abs(s.x - me) < 11 && s.y > ME_Y - ME_H + 6 && s.y < ME_Y) { ouch(); break; }
        }
        if (bugs.every(b => b.hit)) { wave += 1; api.add(50 * wave); api.say(`Swarm cleared! Wave ${wave + 1} is faster.`); api.sound('stat-up', 'confirm'); pause = 1.4; bolts.length = 0; stings.length = 0; }
      },
      down(x) { target = x; },
      move(x, y, pressed) { if (pressed) target = x; },
      up() { target = null; },
      fire,
      key(k, down) { if (k === 'left' || k === 'right') keyDir = down ? (k === 'left' ? -1 : 1) : (keyDir === (k === 'left' ? -1 : 1) ? 0 : keyDir); if (down && (k === 'act' || k === 'up')) fire(); },
      draw(g, now) {
        g.save();
        if (shake > 0) g.translate(Math.sin(now / 20) * shake * 8, 0);
        const sky = g.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#0c1030'); sky.addColorStop(0.7, '#23285a'); sky.addColorStop(1, '#3a3a6a');
        g.fillStyle = sky; g.fillRect(-10, 0, W + 20, GROUND);
        for (const [x, y, a] of STARS) { g.fillStyle = `rgba(255, 255, 240, ${a * (0.6 + 0.4 * Math.sin(now / 400 + x))})`; g.beginPath(); g.arc(x, y, 1.1, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#f4ecc8'; g.beginPath(); g.arc(W - 42, 40, 16, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#23285a'; g.beginPath(); g.arc(W - 35, 35, 14, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1a2a24';
        for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(i * 40 - 10, GROUND + 4, 26 + (i % 3) * 8, Math.PI, 0); g.fill(); }
        const gr = g.createLinearGradient(0, GROUND, 0, H); gr.addColorStop(0, '#4a9a3a'); gr.addColorStop(1, '#2a6a22');
        g.fillStyle = gr; g.fillRect(-10, GROUND, W + 20, H - GROUND);
        if (pause <= 0) for (const b of bugs) {
          if (b.hit) continue;
          const [x, y] = at(b), bob = Math.floor(step) % 2 ? -2 : 1;
          g.fillStyle = 'rgba(0, 0, 0, 0.18)'; g.beginPath(); g.ellipse(x, y + 12, 9, 2.5, 0, 0, Math.PI * 2); g.fill();
          drawMon(g, b.id, x, y + 12 + bob, b.id === 'beedrill' ? 28 : 24, dir < 0);
        }
        if (fly) drawMon(g, 'butterfree', fly.x, fly.y + 14 + Math.sin(now / 160) * 4, 30, fly.v < 0);
        for (const s of stings) {
          const sg = g.createLinearGradient(s.x, s.y - 10, s.x, s.y + 4); sg.addColorStop(0, 'rgba(160, 80, 220, 0)'); sg.addColorStop(1, '#c070f0');
          g.fillStyle = sg; g.beginPath(); g.moveTo(s.x - 2, s.y - 10); g.lineTo(s.x + 2, s.y - 10); g.lineTo(s.x, s.y + 5); g.closePath(); g.fill();
          g.fillStyle = '#f0d8ff'; g.beginPath(); g.arc(s.x, s.y + 2, 1.2, 0, Math.PI * 2); g.fill();
        }
        for (const o of bolts) {
          g.save(); g.shadowColor = '#fff070'; g.shadowBlur = 8; g.strokeStyle = '#ffe840'; g.lineWidth = 2.5; g.lineJoin = 'round';
          g.beginPath(); g.moveTo(o.x, o.y + 12); g.lineTo(o.x + 3, o.y + 7); g.lineTo(o.x - 3, o.y + 3); g.lineTo(o.x + 2, o.y - 3); g.lineTo(o.x, o.y - 7); g.stroke();
          g.strokeStyle = '#fffbe0'; g.lineWidth = 1; g.stroke(); g.restore();
        }
        if (!hurt || Math.floor(now / 90) % 2) {
          g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.beginPath(); g.ellipse(me, ME_Y, 12, 3, 0, 0, Math.PI * 2); g.fill();
          if (cool > FIRE - 0.1) { g.fillStyle = 'rgba(255, 240, 120, 0.35)'; g.beginPath(); g.arc(me, ME_Y - ME_H + 6, 9, 0, Math.PI * 2); g.fill(); }
          drawMon(g, 'pikachu', me, ME_Y + 1, ME_H);
        }
        for (const s of sparks) { g.globalAlpha = Math.max(0, s.t * 2); g.fillStyle = s.c; g.beginPath(); g.arc(s.x, s.y, 2, 0, Math.PI * 2); g.fill(); }
        g.globalAlpha = 1;
        for (const p of pops) { g.globalAlpha = Math.max(0, p.t); banner(g, p.text, p.x, p.y, 14, '#a8e0ff'); }
        g.globalAlpha = 1;
        g.restore();
        const panel = g.createLinearGradient(0, GROUND + 8, 0, H); panel.addColorStop(0, '#1c1a30'); panel.addColorStop(1, '#100e1e');
        g.fillStyle = panel; g.fillRect(0, GROUND + 8, W, H - GROUND - 8);
        g.fillStyle = 'rgba(255, 216, 74, 0.35)'; g.fillRect(0, GROUND + 8, W, 1.5);
        for (let i = 0; i < lives; i++) {
          const x = 18 + i * 16, y = LED;
          g.fillStyle = '#f8d030'; g.beginPath(); g.moveTo(x - 3, y - 7); g.lineTo(x + 4, y - 7); g.lineTo(x, y - 1); g.lineTo(x + 4, y - 1); g.lineTo(x - 4, y + 7); g.lineTo(x - 1, y + 1); g.lineTo(x - 5, y + 1); g.closePath(); g.fill();
        }
        g.font = '700 11px system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255, 255, 255, 0.85)';
        g.textAlign = 'center'; g.fillText(`WAVE ${wave + 1}`, W / 2, LED);
        if (pause > 0) banner(g, `WAVE ${wave + 1}`, W / 2, H * 0.42, 30, '#ffd84a');
      },
    };
  },
}, onClose);
