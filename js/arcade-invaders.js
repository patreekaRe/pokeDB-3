/* arcade-invaders.js  -  Beedrill Invaders, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick), after Space
   Invaders: Pikachu holds the ground under a swarm of Beedrill, Kakuna and Weedle marching side to side and stepping down,
   dropping Poison Stings. Drag (or the joystick or arrow keys) to move; the cabinet's FIRE button (or Space) fires a
   Thunderbolt (it fired by itself until 2026-10-12: the user found the constant zapping annoying). Since 2026-10-17 (the
   user's ask: every arcade game richer, harder and more detailed) the swarm comes in formations (a block, a V, a
   checkerboard, a diamond, pillars), Kakuna Harden from wave 3 and take two bolts, Beedrill peel off and dive at Pikachu
   from wave 2 (worth double in a dive), three berry bushes shelter Pikachu and wear away, and every fifth wave is
   Vespiquen, a boss with a health bar firing fans of stings and sending Combee down. Each wave is quicker, shoots more
   and dives more. Butterfree (and now and then a bug) drop power-ups: Double bolts, Rapid fire, a Light Screen that
   takes a hit, Thunder that zaps the lowest bug in every column, and a rare extra life. Hits in a row without a miss
   raise a multiplier to x4. Three lives (five at most); the swarm reaching Pikachu ends it. */

import { runArcade, drawMon, banner, rand, pick, stamp } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 300, H = 408, GROUND = 380, LED = GROUND + 17, ME_Y = GROUND, ME_H = 30, COLS = 7, CW = 32, RH = 26, LIVES = 3, MAX_LIVES = 5, FIRE = 0.36, TAU = Math.PI * 2;
const KIND = { B: ['beedrill', 30], K: ['kakuna', 20], W: ['weedle', 10] };
const FORMS = [
  ['BBBBBBB', 'KKKKKKK', 'KKKKKKK', 'WWWWWWW', 'WWWWWWW'],
  ['B.....B', 'BB...BB', 'KKK.KKK', '.KKWKK.', '..WWW..', '...W...'],
  ['B.B.B.B', '.K.K.K.', 'K.K.K.K', '.W.W.W.', 'W.W.W.W', '.W.W.W.'],
  ['...B...', '..BBB..', '.KKKKK.', 'KKWWWKK', '.WWWWW.', '..WWW..'],
  ['BB.B.BB', 'KK.K.KK', 'KK.K.KK', 'WW.W.WW', 'WW.W.WW'],
];
const BUNKERS = [60, 150, 240], BK_Y = ME_Y - 66, BK_C = 4, BK_W = 8, BK_H = 5;
const ITEMS = { double: ['#ffd84a', 'II', 'Double bolts!'], rapid: ['#ff8a4a', '»', 'Rapid fire!'], screen: ['#a8d8ff', '◇', 'Light Screen!'], thunder: ['#fff070', 'ϟ', 'Thunder!'], life: ['#ff7090', '♥', 'An extra life!'] };
const STARS = Array.from({ length: 50 }, (_, i) => [(i * 73) % W, (i * 131) % (GROUND - 70), 0.35 + (i % 5) / 8]);

/** The night painted once: a sky deepening to the ground, stars, a cratered moon, far mountains, a treeline, the grass
    and the panel under it. */
function night(g) {
  const sky = g.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#080a24'); sky.addColorStop(0.6, '#1e2458'); sky.addColorStop(1, '#3c3a70');
  g.fillStyle = sky; g.fillRect(0, 0, W, GROUND);
  for (const [x, y, a] of STARS) { g.fillStyle = `rgba(255, 255, 240, ${a * 0.7})`; g.fillRect(x, y, 1.3, 1.3); }
  const glow = g.createRadialGradient(W - 46, 42, 10, W - 46, 42, 60); glow.addColorStop(0, 'rgba(255, 250, 220, 0.25)'); glow.addColorStop(1, 'rgba(255, 250, 220, 0)');
  g.fillStyle = glow; g.fillRect(W - 110, 0, 110, 110);
  g.fillStyle = '#f4ecc8'; g.beginPath(); g.arc(W - 46, 42, 17, 0, TAU); g.fill();
  g.fillStyle = 'rgba(180, 170, 130, 0.5)'; for (const [x, y, r] of [[-5, -4, 4], [5, 3, 3], [-2, 8, 2.2], [7, -7, 2]]) { g.beginPath(); g.arc(W - 46 + x, 42 + y, r, 0, TAU); g.fill(); }
  g.fillStyle = '#2a2a58'; g.beginPath(); g.moveTo(0, GROUND - 40);
  for (let x = 0; x <= W; x += 15) g.lineTo(x, GROUND - 60 - Math.abs(Math.sin(x / 41)) * 40 - Math.sin(x / 13) * 4);
  g.lineTo(W, GROUND); g.lineTo(0, GROUND); g.fill();
  g.fillStyle = '#18243a';
  for (let i = 0; i < 26; i++) { const x = i * 12 - 4, h = 24 + (i * 7) % 16; g.beginPath(); g.moveTo(x - 9, GROUND); g.lineTo(x, GROUND - h); g.lineTo(x + 9, GROUND); g.fill(); }
  g.fillStyle = '#1a2a24'; g.fillRect(0, GROUND - 6, W, 8);
  const gr = g.createLinearGradient(0, GROUND, 0, GROUND + 8); gr.addColorStop(0, '#4a9a3a'); gr.addColorStop(1, '#2a6a22');
  g.fillStyle = gr; g.fillRect(0, GROUND, W, 8);
  g.fillStyle = '#6ac04a'; for (let x = 2; x < W; x += 5) g.fillRect(x, GROUND - 2 - (x * 7) % 4, 1.5, 3 + (x * 7) % 4);
  const panel = g.createLinearGradient(0, GROUND + 8, 0, H); panel.addColorStop(0, '#1c1a30'); panel.addColorStop(1, '#100e1e');
  g.fillStyle = panel; g.fillRect(0, GROUND + 8, W, H - GROUND - 8);
  g.fillStyle = 'rgba(255, 216, 74, 0.35)'; g.fillRect(0, GROUND + 8, W, 1.5);
}
/** A bush's leaf cell, 4 x 4. */
const leaf = (g) => { g.fillStyle = '#2e8a3a'; g.fillRect(0, 0, BK_C, BK_C); g.fillStyle = '#58c050'; g.fillRect(0, 0, BK_C - 1, 1.5); g.fillStyle = '#1a5a24'; g.fillRect(BK_C - 1, 1, 1, BK_C - 1); };
const berry = (g) => { leaf(g); g.fillStyle = '#e04060'; g.beginPath(); g.arc(2, 2, 1.4, 0, TAU); g.fill(); };

export const openInvaders = (onClose) => runArcade({
  id: 'invaders', title: 'Beedrill Invaders', colour: '#e8b020', W, H,
  pad: [['FIRE', 'fire']],
  sounds: ['fx-zap', 'fx-pop', 'fx-coin', 'fx-firework', 'fx-gong', 'fx-whoosh'],
  intro: 'Hold back the swarm! Drag to move, press FIRE to zap.',
  help: [['Drag left and right to move Pikachu', '(or the joystick, or the arrow keys). Press FIRE (or Space) for a Thunderbolt; they knock Stings out of the air.'], ['Dodge Stings and diving Beedrill:', `one takes a life; ${LIVES} and it's over, or when the swarm reaches Pikachu. The berry bushes shelter you till they wear away.`], ['Weedle 10, Kakuna 20, Beedrill 30 (60 diving).', 'Hardened Kakuna take two bolts. Hits in a row without a miss raise your multiplier to x4.'], ['Zap Butterfree for a power-up:', 'Double bolts, Rapid fire, a Light Screen, Thunder or a life. Every fifth wave is Vespiquen!']],
  make(api) {
    let me = W / 2, target = null, keyDir = 0, cool = 0.6, lives = LIVES, wave = 0, hurt = 0, pause = 0, step = 0, dir = 1, ox = 0, oy = 0, fly = null, flyIn = rand(8, 14), shake = 0, flash = 0;
    let bugs = [], boss = null, chain = 0, diveIn = 4, screen = false;
    const pw = { double: 0, rapid: 0 };
    const bolts = [], stings = [], sparks = [], pops = [], drops = [];
    let bushes = [];
    const calm = calmFx();
    const isBoss = () => wave % 5 === 4;
    const normal = () => wave - Math.floor((wave + 1) / 5);   // how many swarm waves came before this one
    const mult = () => Math.min(4, 1 + Math.floor(chain / 8));
    const plant = () => { bushes = BUNKERS.map(cx => ({ x0: cx - BK_W * BK_C / 2, cells: Array.from({ length: BK_W * BK_H }, (_, i) => { const c = i % BK_W, r = Math.floor(i / BK_W); return !(r >= 3 && c >= 3 && c <= 4) && !(r === 0 && (c === 0 || c === BK_W - 1)); }) })); };
    const swarm = () => {
      bugs = []; boss = null; stings.length = 0; bolts.length = 0;
      if (isBoss()) {
        const n = Math.floor(wave / 5) + 1;
        boss = { x: W / 2, y: 70, hp: 30 + n * 15, max: 30 + n * 15, n, t: 0, shot: 1.5, call: 4, hit: 0 };
        api.say(`Vespiquen, the swarm's queen! Wave ${wave + 1}.`); api.sound('fx-gong', 'thunder');
        return;
      }
      const n = normal(), form = FORMS[n % FORMS.length], armour = n >= 2 ? Math.min(0.75, 0.2 + (n - 2) * 0.12) : 0;
      form.forEach((row, r) => [...row].forEach((ch, c) => {
        if (ch === '.') return;
        const [id, pts] = KIND[ch];
        bugs.push({ id, pts, r, c, hp: id === 'kakuna' && Math.random() < armour ? 2 : 1, hit: 0, dive: null, flash: 0 });
      }));
      ox = (W - COLS * CW) / 2; oy = 52 + Math.min(5, n) * 7; dir = 1; step = 0; diveIn = rand(3, 5);
      if (n > 0 && n % FORMS.length === 0) api.say(`Wave ${wave + 1}: the swarm is back, faster!`);
    };
    plant(); swarm();
    const at = (b) => (b.dive ? [b.dive.x, b.dive.y] : [ox + b.c * CW + CW / 2, oy + b.r * RH + RH / 2]);
    const burst = (x, y, c, n = 10) => { if (calm) n = Math.ceil(n / 2); for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(40, 150); sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.3, 0.6), c }); } };
    const pop = (x, y, text, colour = '#a8e0ff', size = 13) => pops.push({ x, y, text, colour, size, t: 1 });
    const drop = (x, y, kind) => drops.push({ x, y, kind: kind || pick(lives < MAX_LIVES && Math.random() < 0.12 ? ['life'] : ['double', 'rapid', 'screen', 'thunder']) });
    const fire = () => {
      const max = pw.double ? 6 : 3;
      if (cool > 0 || hurt > 1 || pause > 0 || bolts.length >= max) return;
      if (pw.double) { bolts.push({ x: me - 6, y: ME_Y - ME_H + 4, vx: -30 }, { x: me + 6, y: ME_Y - ME_H + 4, vx: 30 }); }
      else bolts.push({ x: me, y: ME_Y - ME_H + 4, vx: 0 });
      cool = pw.rapid ? FIRE * 0.45 : FIRE; api.sound('plink-1');
    };
    const ouch = () => {
      if (screen) { screen = false; burst(me, ME_Y - 16, '#a8d8ff', 14); pop(me, ME_Y - 44, 'Blocked!'); api.sound('fx-pop', 'plink-2'); hurt = 0.6; return; }
      lives -= 1; hurt = 1.6; if (!calm) shake = 0.45; flash = 0.3; stings.length = 0; chain = 0; burst(me, ME_Y - 14, '#c070e0', 18);
      pw.double = pw.rapid = 0;
      api.sound('cancel');
      if (lives <= 0) return api.over(`Pikachu fainted on wave ${wave + 1}!`);
      api.say(`Ouch! ${lives} ${lives === 1 ? 'life' : 'lives'} left.`);
    };
    /** A Sting or bolt meeting a bush eats a leaf and maybe its neighbours; true if it was stopped. */
    const chew = (x, y, bite = 2) => {
      if (y < BK_Y || y >= BK_Y + BK_H * BK_C) return false;
      for (const b of bushes) {
        const c = Math.floor((x - b.x0) / BK_C), r = Math.floor((y - BK_Y) / BK_C);
        if (c < 0 || c >= BK_W || !b.cells[r * BK_W + c]) continue;
        b.cells[r * BK_W + c] = false; b.cv = null;
        for (let k = 0; k < bite; k++) { const cc = c + Math.floor(rand(-1, 2)), rr = r + Math.floor(rand(-1, 2)); if (cc >= 0 && cc < BK_W && rr >= 0 && rr < BK_H) b.cells[rr * BK_W + cc] = false; }
        burst(x, y, '#58c050', 4);
        return true;
      }
      return false;
    };
    const kill = (b, x, y) => {
      b.hit = 1; chain++;
      const pts = (b.dive ? b.pts * 2 : b.pts) * mult();
      api.add(pts);
      if (b.dive || pts >= 60) pop(x, y - 10, `+${pts}`, '#fff070');
      burst(x, y, b.id === 'beedrill' ? '#f0c020' : b.id === 'kakuna' ? '#e8d050' : b.id === 'combee' ? '#ffb030' : '#e89040');
      api.sound('select');
      if (chain % 8 === 0 && mult() > 1) { pop(me, ME_Y - 48, `x${mult()}!`, '#ffd84a', 15); api.sound('fx-coin', 'coins'); }
      if (Math.random() < 0.035) drop(x, y);
    };
    const tickBoss = (dt) => {
      const b = boss, mad = b.hp < b.max / 2;
      b.t += dt; b.hit = Math.max(0, b.hit - dt);
      b.x = W / 2 + Math.sin(b.t * (mad ? 1.1 : 0.7)) * (W / 2 - 40); b.y = 70 + Math.sin(b.t * 1.7) * 10;
      b.shot -= dt;
      if (b.shot <= 0) {
        const n = (mad ? 5 : 3) + Math.min(2, b.n - 1), sp = 130 + b.n * 15;
        for (let i = 0; i < n; i++) { const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.22; stings.push({ x: b.x, y: b.y + 26, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, pin: true }); }
        b.shot = (mad ? 1.1 : 1.6) - Math.min(0.5, b.n * 0.08); api.sound('fx-whoosh', 'plink-2');
      }
      b.call -= dt;
      if (b.call <= 0) {
        for (const s of [-1, 1]) bugs.push({ id: 'combee', pts: 40, r: 0, c: 0, hp: 1, hit: 0, flash: 0, dive: { x: b.x + s * 24, y: b.y + 10, vx: s * 60, vy: 90, back: false, shot: false, gone: true } });
        b.call = mad ? 3.5 : 5;
      }
    };
    return {
      tick(dt) {
        if (target != null) me += Math.max(-360 * dt, Math.min(360 * dt, target - me)); else me += keyDir * 240 * dt;
        me = Math.max(16, Math.min(W - 16, me));
        cool -= dt; hurt = Math.max(0, hurt - dt); shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
        for (const k in pw) pw[k] = Math.max(0, pw[k] - dt);
        for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 200 * dt; s.t -= dt; }
        for (const p of pops) { p.y -= 24 * dt; p.t -= dt; }
        for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].t <= 0) sparks.splice(i, 1);
        while (pops.length && pops[0].t <= 0) pops.shift();
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i]; d.y += 75 * dt;
          if (d.y > GROUND) { drops.splice(i, 1); continue; }
          if (Math.abs(d.x - me) < 16 && d.y > ME_Y - ME_H && hurt < 1) {
            drops.splice(i, 1);
            const [, , line] = ITEMS[d.kind];
            if (d.kind === 'double' || d.kind === 'rapid') pw[d.kind] = 10;
            else if (d.kind === 'screen') screen = true;
            else if (d.kind === 'life') lives = Math.min(MAX_LIVES, lives + 1);
            else if (d.kind === 'thunder') {
              flash = 0.25; stings.length = 0;
              const low = new Map(); for (const b of bugs) if (!b.hit && !b.dive && (!low.has(b.c) || low.get(b.c).r < b.r)) low.set(b.c, b);
              for (const b of low.values()) { const [x, y] = at(b); kill(b, x, y); }
              if (boss) { boss.hp -= 5; boss.hit = 0.2; }
            }
            pop(me, ME_Y - 44, line, ITEMS[d.kind][0], 13); api.sound('fx-coin', 'stat-up');
          }
        }
        if (pause > 0) { pause -= dt; if (pause <= 0) swarm(); return; }
        const n = normal(), lvl = isBoss() ? Math.floor(wave / 5) * 2 + 2 : n;
        const alive = bugs.filter(b => !b.hit), ranks = alive.filter(b => !b.dive && b.id !== 'combee');
        if (ranks.length) {
          const total = bugs.filter(b => b.id !== 'combee').length;
          const speed = (16 + n * 6) * (1 + 2.4 * (1 - ranks.length / total));
          ox += dir * speed * dt; step += dt * speed / 12;
          const xs = ranks.map(b => at(b)[0]);
          if ((dir > 0 && Math.max(...xs) > W - 14) || (dir < 0 && Math.min(...xs) < 14)) { dir = -dir; oy += Math.min(14, 9 + n * 0.6); api.sound('plink-2'); }
          const low = Math.max(...ranks.map(b => at(b)[1]));
          if (low + 12 >= BK_Y) for (const b of ranks) { const [x, y] = at(b); if (y + 12 >= BK_Y) for (let k = -10; k <= 10; k += 4) chew(x + k, Math.min(BK_Y + BK_H * BK_C - 1, y + 10), 0); }
          if (low + 12 >= ME_Y - ME_H + 6) { if (!calm) shake = 0.4; return api.over(`The swarm reached Pikachu on wave ${wave + 1}!`); }
          if (Math.random() < dt * (0.7 + n * 0.3 + (1 - ranks.length / total) * 0.9)) {
            const cols = new Map(); for (const b of ranks) if (!cols.has(b.c) || cols.get(b.c).r < b.r) cols.set(b.c, b);
            const near = [...cols.values()].sort((a, b) => Math.abs(at(a)[0] - me) - Math.abs(at(b)[0] - me));
            const b = Math.random() < 0.45 ? near[0] : pick(near), [x, y] = at(b), v = 120 + n * 14 + (b.id === 'beedrill' ? 30 : 0);
            stings.push({ x, y: y + 8, vx: 0, vy: v });
            if (b.id === 'beedrill' && n >= 4) stings.push({ x, y: y + 8, vx: (me - x) * 0.25, vy: v });
          }
          diveIn -= dt;
          if (n >= 1 && diveIn <= 0) {   // a Beedrill (or, later, anyone) peels off at Pikachu
            const cand = ranks.filter(b => b.id === 'beedrill' || (n >= 4 && Math.random() < 0.3));
            if (cand.length) { const b = pick(cand), [x, y] = at(b); b.dive = { x, y, vx: 0, vy: -60, back: false, shot: false }; api.sound('fx-whoosh', 'select'); }
            diveIn = Math.max(1.2, rand(4, 6) - n * 0.4);
          }
        }
        if (boss) tickBoss(dt);
        for (const b of alive) {
          const d = b.dive;
          b.flash = Math.max(0, b.flash - dt);
          if (!d) continue;
          if (d.back) {   // back in from the top to its place in the ranks
            const tx = ox + b.c * CW + CW / 2, ty = oy + b.r * RH + RH / 2;
            d.x += (tx - d.x) * Math.min(1, dt * 3); d.y += (ty - d.y) * Math.min(1, dt * 3);
            if (Math.hypot(tx - d.x, ty - d.y) < 2) b.dive = null;
            continue;
          }
          d.vy = Math.min(150 + lvl * 14, d.vy + 260 * dt);
          d.vx += Math.sign(me - d.x) * (140 + lvl * 10) * dt; d.vx = Math.max(-150, Math.min(150, d.vx));
          d.x += d.vx * dt; d.y += d.vy * dt;
          if (!d.shot && d.y > 180) { d.shot = true; stings.push({ x: d.x, y: d.y + 8, vx: (me - d.x) * 0.3, vy: 170 + lvl * 10 }); }
          if (!hurt && Math.abs(d.x - me) < 15 && d.y > ME_Y - ME_H && d.y < ME_Y + 4) { b.hit = 1; burst(d.x, d.y, '#f0c020', 12); ouch(); if (lives <= 0) return; continue; }
          if (d.y > H + 20) { if (d.gone) b.hit = 1; else { d.back = true; d.y = -20; d.x = rand(30, W - 30); } }
        }
        flyIn -= dt;
        if (!fly && flyIn <= 0 && !boss) { const l = Math.random() < 0.5; fly = { x: l ? -20 : W + 20, v: (l ? 1 : -1) * (60 + n * 4), y: 32 }; }
        if (fly) { fly.x += fly.v * dt; if (fly.x < -30 || fly.x > W + 30) { fly = null; flyIn = rand(12, 20); } }
        for (let i = bolts.length - 1; i >= 0; i--) {
          const o = bolts[i]; o.y -= 340 * dt; o.x += o.vx * dt;
          let gone = false;
          if (o.y < -10) { gone = true; if (chain >= 8) pop(me, ME_Y - 44, 'Chain lost', '#ffb0a0', 11); chain = 0; }
          if (!gone && chew(o.x, o.y, 1)) gone = true;
          if (!gone && fly && Math.abs(o.x - fly.x) < 16 && Math.abs(o.y - fly.y) < 14) {
            const pts = pick([50, 100, 150, 300]) * mult(); api.add(pts); pop(fly.x, fly.y, `+${pts}`);
            burst(fly.x, fly.y, '#a8d8ff', 16); api.sound('coins', 'stat-up'); drop(fly.x, fly.y); fly = null; flyIn = rand(12, 20); gone = true;
          }
          if (!gone && boss && Math.abs(o.x - boss.x) < 24 && Math.abs(o.y - boss.y) < 26) {
            boss.hp -= 1; boss.hit = 0.12; gone = true; burst(o.x, o.y, '#ffe060', 5); api.add(5); api.sound('fx-pop', 'select');
          }
          if (!gone) for (const b of alive) {
            if (b.hit) continue;
            const [x, y] = at(b);
            if (Math.abs(o.x - x) < 12 && Math.abs(o.y - y) < 12) {
              gone = true;
              if (--b.hp > 0) { b.flash = 0.15; burst(x, y, '#ffffff', 5); api.sound('fx-tick', 'select'); chain++; }
              else kill(b, x, y);
              break;
            }
          }
          // Vespiquen's Pin Missiles go through bolts, or her fan shielded her from a Pikachu standing under her
          if (!gone) for (let j = stings.length - 1; j >= 0; j--) if (!stings[j].pin && Math.abs(stings[j].x - o.x) < 5 && Math.abs(stings[j].y - o.y) < 10) { stings.splice(j, 1); burst(o.x, o.y, '#fff8a0', 5); gone = true; break; }
          if (gone) bolts.splice(i, 1);
        }
        for (let i = stings.length - 1; i >= 0; i--) {
          const s = stings[i]; s.x += s.vx * dt; s.y += s.vy * dt;
          if (s.y > GROUND || s.x < -10 || s.x > W + 10 || chew(s.x, s.y, 2)) { stings.splice(i, 1); continue; }
          if (!hurt && Math.abs(s.x - me) < 11 && s.y > ME_Y - ME_H + 6 && s.y < ME_Y) { stings.splice(i, 1); ouch(); if (lives <= 0) return; break; }
        }
        if (boss && boss.hp <= 0) {
          const pts = 500 * boss.n; api.add(pts); pop(boss.x, boss.y, `+${pts}`, '#ffd84a', 18);
          for (let k = 0; k < 4; k++) burst(boss.x + rand(-20, 20), boss.y + rand(-20, 20), pick(['#ffd84a', '#ff8a4a', '#ffffff']), 14);
          for (const b of bugs) if (!b.hit) { const [x, y] = at(b); b.hit = 1; burst(x, y, '#ffb030', 6); }
          drop(boss.x, boss.y, lives < MAX_LIVES ? 'life' : 'double');
          boss = null; wave += 1; pause = 2.2; plant(); stings.length = 0;
          api.say(`Vespiquen is beaten! +${pts}. The bushes grow back.`); api.sound('fx-firework', 'stat-up'); flash = 0.3;
          return;
        }
        if (!boss && bugs.length && bugs.every(b => b.hit)) {
          wave += 1; const pts = 50 * wave; api.add(pts);
          api.say(isBoss() ? `Swarm cleared! +${pts}. Something big is coming...` : `Swarm cleared! +${pts}. Wave ${wave + 1} is faster.`);
          api.sound('stat-up', 'confirm'); pause = 1.6; bolts.length = 0; stings.length = 0;
        }
      },
      down(x) { target = x; },
      move(x, y, pressed) { if (pressed) target = x; },
      up() { target = null; },
      fire,
      key(k, down) { if (k === 'left' || k === 'right') keyDir = down ? (k === 'left' ? -1 : 1) : (keyDir === (k === 'left' ? -1 : 1) ? 0 : keyDir); if (down && (k === 'act' || k === 'up')) fire(); },
      draw(g, now) {
        g.save();
        if (shake > 0) g.translate(Math.sin(now / 20) * shake * 8, 0);
        stamp(g, 'inv-night', 0, 0, W, H, night);
        for (let i = 0; i < 12; i++) { const [x, y] = STARS[i * 4]; g.fillStyle = `rgba(255, 255, 240, ${0.5 + 0.5 * Math.sin(now / 300 + i * 1.7)})`; g.fillRect(x - 0.5, y - 0.5, 2, 2); }
        const ss = (now / 6000) % 1;   // a shooting star now and then
        if (ss < 0.08) { const t = ss / 0.08, x = 40 + t * 160, y = 20 + t * 50; g.strokeStyle = `rgba(255, 255, 255, ${1 - t})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 18, y - 6); g.stroke(); }
        const sc = g.getTransform().a;
        for (const b of bushes) {   // a bush is repainted onto its own canvas only when a leaf goes
          if (!b.cv || b.sc !== sc) {
            b.cv = document.createElement('canvas'); b.sc = sc; b.cv.width = Math.ceil(BK_W * BK_C * sc); b.cv.height = Math.ceil(BK_H * BK_C * sc);
            const cg = b.cv.getContext('2d'); cg.scale(sc, sc);
            b.cells.forEach((on, i) => { if (!on) return; cg.save(); cg.translate((i % BK_W) * BK_C, Math.floor(i / BK_W) * BK_C); (i % 7 === 3 ? berry : leaf)(cg); cg.restore(); });
          }
          g.drawImage(b.cv, b.x0, BK_Y, BK_W * BK_C, BK_H * BK_C);
        }
        if (pause <= 0) for (const b of bugs) {
          if (b.hit) continue;
          const [x, y] = at(b), bob = Math.floor(step) % 2 ? -2 : 1;
          g.fillStyle = 'rgba(0, 0, 0, 0.18)'; g.beginPath(); g.ellipse(x, y + 12, 9, 2.5, 0, 0, TAU); g.fill();
          if (b.hp > 1) { g.fillStyle = 'rgba(200, 220, 255, 0.35)'; g.beginPath(); g.arc(x, y + 1, 12, 0, TAU); g.fill(); }
          drawMon(g, b.id, x, y + 12 + (b.dive ? 0 : bob), b.id === 'beedrill' ? 28 : b.id === 'combee' ? 22 : 24, b.dive ? b.dive.vx < 0 : dir < 0);
          if (b.flash) { g.fillStyle = 'rgba(255, 255, 255, 0.7)'; g.beginPath(); g.arc(x, y, 11, 0, TAU); g.fill(); }
          if (b.dive && !b.dive.back) { g.strokeStyle = 'rgba(255, 220, 80, 0.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x - b.dive.vx * 0.08, y - 12 - b.dive.vy * 0.08); g.stroke(); }
        }
        if (boss) {
          const mad = boss.hp < boss.max / 2;
          if (mad) { g.fillStyle = `rgba(255, 60, 60, ${0.15 + 0.1 * Math.sin(now / 100)})`; g.beginPath(); g.arc(boss.x, boss.y, 34, 0, TAU); g.fill(); }
          drawMon(g, 'vespiquen', boss.x, boss.y + 30 + Math.sin(now / 200) * 3, 62);
          if (boss.hit) { g.fillStyle = 'rgba(255, 255, 255, 0.5)'; g.beginPath(); g.arc(boss.x, boss.y, 26, 0, TAU); g.fill(); }
          g.fillStyle = 'rgba(0, 0, 0, 0.55)'; g.fillRect(40, 10, W - 80, 9);
          g.fillStyle = mad ? '#ff5a4a' : '#ffb030'; g.fillRect(41, 11, (W - 82) * Math.max(0, boss.hp / boss.max), 7);
          banner(g, 'VESPIQUEN', W / 2, 26, 10, '#ffe8b0');
        }
        if (fly) drawMon(g, 'butterfree', fly.x, fly.y + 14 + Math.sin(now / 160) * 4, 30, fly.v < 0);
        for (const d of drops) {
          const [c, sym] = ITEMS[d.kind];
          g.fillStyle = 'rgba(255, 255, 255, 0.3)'; g.beginPath(); g.arc(d.x, d.y, 11, 0, TAU); g.fill();
          g.fillStyle = c; g.beginPath(); g.arc(d.x, d.y, 8, 0, TAU); g.fill();
          banner(g, sym, d.x, d.y + 1, 10, '#202028');
        }
        g.lineCap = 'round';
        for (const s of stings) {
          const k = 0.05 / Math.max(1, Math.hypot(s.vx, s.vy) / 160);
          g.strokeStyle = s.pin ? 'rgba(255, 90, 90, 0.5)' : 'rgba(190, 110, 240, 0.45)'; g.lineWidth = s.pin ? 5 : 4; g.beginPath(); g.moveTo(s.x - s.vx * k * 1.6, s.y - s.vy * k * 1.6); g.lineTo(s.x, s.y); g.stroke();
          g.strokeStyle = s.pin ? '#ff9080' : '#d090ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(s.x - s.vx * k, s.y - s.vy * k); g.lineTo(s.x, s.y); g.stroke();
          g.fillStyle = '#f8e8ff'; g.fillRect(s.x - 1, s.y - 1, 2, 2);
        }
        g.lineJoin = 'round';
        for (const o of bolts) {
          const path = () => { g.beginPath(); g.moveTo(o.x, o.y + 12); g.lineTo(o.x + 3, o.y + 7); g.lineTo(o.x - 3, o.y + 3); g.lineTo(o.x + 2, o.y - 3); g.lineTo(o.x, o.y - 7); };
          path(); g.strokeStyle = 'rgba(255, 240, 112, 0.35)'; g.lineWidth = 6; g.stroke();
          g.strokeStyle = '#ffe840'; g.lineWidth = 2.5; g.stroke();
          g.strokeStyle = '#fffbe0'; g.lineWidth = 1; g.stroke();
        }
        g.lineCap = 'butt';
        if (!hurt || Math.floor(now / 90) % 2) {
          g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.beginPath(); g.ellipse(me, ME_Y, 12, 3, 0, 0, TAU); g.fill();
          if (cool > (pw.rapid ? FIRE * 0.45 : FIRE) - 0.1) { g.fillStyle = 'rgba(255, 240, 120, 0.35)'; g.beginPath(); g.arc(me, ME_Y - ME_H + 6, 9, 0, TAU); g.fill(); }
          drawMon(g, 'pikachu', me, ME_Y + 1, ME_H);
          if (screen) { g.strokeStyle = `rgba(168, 216, 255, ${0.6 + 0.3 * Math.sin(now / 120)})`; g.lineWidth = 2; g.beginPath(); g.arc(me, ME_Y - 14, 20, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
        }
        for (const s of sparks) { g.globalAlpha = Math.max(0, s.t * 2); g.fillStyle = s.c; g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3); }
        g.globalAlpha = 1;
        for (const p of pops) { g.globalAlpha = Math.max(0, p.t); banner(g, p.text, p.x, p.y, p.size, p.colour); }
        g.globalAlpha = 1;
        g.restore();
        if (flash) { g.fillStyle = `rgba(255, 250, 220, ${flash * (calm ? 0.8 : 2)})`; g.fillRect(0, 0, W, GROUND); }
        for (let i = 0; i < lives; i++) {
          const x = 14 + i * 13, y = LED;
          g.fillStyle = '#f8d030'; g.beginPath(); g.moveTo(x - 3, y - 7); g.lineTo(x + 4, y - 7); g.lineTo(x, y - 1); g.lineTo(x + 4, y - 1); g.lineTo(x - 4, y + 7); g.lineTo(x - 1, y + 1); g.lineTo(x - 5, y + 1); g.closePath(); g.fill();
        }
        g.font = '700 11px system-ui, sans-serif'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255, 255, 255, 0.85)';
        g.textAlign = 'center'; g.fillText(`WAVE ${wave + 1}`, W / 2, LED);
        g.textAlign = 'right';
        const tags = [mult() > 1 && `x${mult()}`, pw.double && 'II', pw.rapid && '»', screen && '◇'].filter(Boolean).join(' ');
        g.fillStyle = '#ffd84a'; g.fillText(tags, W - 10, LED);
        if (pause > 0) { banner(g, isBoss() ? 'WARNING!' : `WAVE ${wave + 1}`, W / 2, H * 0.42, 30, isBoss() ? '#ff6a5a' : '#ffd84a'); if (isBoss()) banner(g, 'VESPIQUEN APPROACHES', W / 2, H * 0.42 + 28, 13, '#fff'); }
      },
    };
  },
}, onClose);
