/* arcade-pong.js  -  Psyduck Pong, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick): your paddle at the
   bottom of a swimming pool, a rival's at the top, a Poké Ball between. Since 2026-10-17 (the user's ask: every arcade
   game richer, harder and more detailed) it is a ladder of rounds, each first to 5: Psyduck (who gets confused), Slowpoke
   (wide but slow to react), Golduck (smashes), Starmie (curve balls), Lapras (a wide board) and Gyarados (all of it),
   then round again quicker. Each rival reads the ball better, moves faster and serves harder; losing a round ends the
   game. The ball speeds up through a rally, a return hit while your paddle is moving is a smash with spin, and floating
   power-ups (a wider board, Ice Beam slowing the rival, a bubble shield, double points) go to whoever last hit the
   ball through them. A return scores 1 (more in a long rally), a point 10 a round, a round won 50 a round and a 5-0
   round 100 more. */

import { runArcade, drawMon, banner, stamp, rand } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 300, H = 380, PW = 64, PH = 10, ME_Y = H - 36, FOE_Y = 46, BR = 8, TO = 5, TAU = Math.PI * 2, MAXV = 540;
const FOES = [
  { id: 'psyduck', name: 'Psyduck', speed: 150, err: 30, react: 0.24, ball: 185, pw: 64, aim: 0.15, confused: true },
  { id: 'slowpoke', name: 'Slowpoke', speed: 175, err: 22, react: 0.34, ball: 200, pw: 80, aim: 0.3 },
  { id: 'golduck', name: 'Golduck', speed: 225, err: 16, react: 0.18, ball: 215, pw: 64, aim: 0.45, smash: 0.25 },
  { id: 'starmie', name: 'Starmie', speed: 255, err: 12, react: 0.14, ball: 228, pw: 60, aim: 0.6, curve: 0.45 },
  { id: 'lapras', name: 'Lapras', speed: 245, err: 9, react: 0.13, ball: 240, pw: 86, aim: 0.65, smash: 0.2 },
  { id: 'gyarados', name: 'Gyarados', speed: 310, err: 7, react: 0.1, ball: 255, pw: 66, aim: 0.8, smash: 0.3, curve: 0.3 },
];
const ITEMS = { grow: ['#58c858', '⇔', 'Wide board!'], ice: ['#78d0f8', '❄', 'Ice Beam! The rival slows.'], shield: ['#a878f8', '◯', 'Bubble shield!'], star: ['#ffd030', '★', 'Double points!'] };

/** The pool painted once: tiled deck round blue water, lane ropes of floats, a pool ladder each end and a chalk line. */
function pool(g) {
  g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120, 110, 90, 0.35)'; g.lineWidth = 1;
  for (let x = 0; x <= W; x += 12) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y <= H; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const water = g.createLinearGradient(0, 0, 0, H); water.addColorStop(0, '#1a78c8'); water.addColorStop(0.5, '#2a9ae0'); water.addColorStop(1, '#1a6ab8');
  g.fillStyle = '#0e4a8a'; g.fillRect(4, 4, W - 8, H - 8);
  g.fillStyle = water; g.fillRect(6, 6, W - 12, H - 12);
  g.strokeStyle = 'rgba(10, 40, 90, 0.35)'; g.lineWidth = 3;   // the floor's lane stripes under the water
  for (const x of [W * 0.25, W * 0.5, W * 0.75]) { g.beginPath(); g.moveTo(x, 30); g.lineTo(x, H - 30); g.stroke(); g.beginPath(); g.moveTo(x - 10, 30); g.lineTo(x + 10, 30); g.moveTo(x - 10, H - 30); g.lineTo(x + 10, H - 30); g.stroke(); }
  g.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < 18; i++) { const x = (i * 67) % W, y = (i * 103) % H; g.beginPath(); g.ellipse(x, y, 16, 5, (i % 3) * 0.4, 0, TAU); g.fill(); }
  for (let x = 12; x < W - 8; x += 10) {   // the halfway rope's floats
    g.fillStyle = Math.floor(x / 10) % 3 === 0 ? '#e83838' : '#f8f8f8';
    g.beginPath(); g.ellipse(x, H / 2, 4.5, 3, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0, 0, 0, 0.18)'; g.fillRect(x - 4, H / 2 + 1.5, 8, 1);
  }
  for (const [y, d] of [[8, 1], [H - 8, -1]]) for (const x of [26, W - 26]) {   // ladders
    g.strokeStyle = '#c8d0d8'; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x - 6, y + d * 18); g.moveTo(x + 6, y); g.lineTo(x + 6, y + d * 18); g.stroke();
    g.lineWidth = 1.6; for (let k = 1; k <= 3; k++) { g.beginPath(); g.moveTo(x - 6, y + d * k * 5); g.lineTo(x + 6, y + d * k * 5); g.stroke(); }
  }
}
/** A paddle as a surfboard, `w` wide, painted in a `w` x 12 box. */
const board = (w, top, stripe) => (g) => {
  g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.beginPath(); g.roundRect(1, 3, w - 2, PH, 6); g.fill();
  g.fillStyle = top; g.beginPath(); g.roundRect(0, 0, w, PH, 6); g.fill();
  g.fillStyle = stripe; g.fillRect(w / 2 - 3, 0.5, 6, PH - 1);
  g.fillStyle = 'rgba(255, 255, 255, 0.55)'; g.fillRect(6, 2, w - 12, 1.6);
  g.strokeStyle = 'rgba(0, 0, 0, 0.35)'; g.lineWidth = 1; g.beginPath(); g.roundRect(0.5, 0.5, w - 1, PH - 1, 6); g.stroke();
};
/** The Poké Ball, painted in an 18 x 18 box. */
function ballArt(g) {
  const x = 9, y = 9;
  g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(x, y, BR, 0, TAU); g.fill();
  g.fillStyle = '#e03838'; g.beginPath(); g.arc(x, y, BR, Math.PI, TAU); g.fill();
  g.fillStyle = '#202028'; g.fillRect(x - BR, y - 1, BR * 2, 2); g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
  g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.7)'; g.beginPath(); g.ellipse(x - 3, y - 4, 2.5, 1.4, -0.6, 0, TAU); g.fill();
}

export const openPong = (onClose) => runArcade({
  id: 'pong', title: 'Psyduck Pong', colour: '#e8c040', W, H,
  keys: { left: [['◀', 'left']], right: [['▶', 'right']] },
  sounds: ['fx-splash', 'fx-pop', 'fx-whoosh', 'fx-coin', 'fx-boing'],
  intro: 'Beat every rival to 5! Hold ◀ or ▶ to move your paddle.',
  help: [['Hold ◀ (left thumb) or ▶ (right thumb) to move.', 'Dragging on the screen or the arrow keys work too. Where the ball hits your board sets its angle.'], ['Hit it while moving for a smash:', 'faster, with spin. Long rallies speed the ball up and score more.'], ['Knock the ball through a power-up to take it:', 'a wider board, Ice Beam on the rival, a bubble shield or double points.'], [`Each round is first to ${TO}.`, 'Six rivals, each sharper, then round again quicker. Lose a round and the game is over.']],
  make(api) {
    let me = W / 2, myV = 0, foe = W / 2, target = null, keyDir = 0, mine = 0, theirs = 0, ball = null, wait = 1.6, serveMe = true, ouch = 0;
    let round = 1, foeAim = W / 2, think = 0, lastHit = null, rally = 0, dizzy = 0, dizzyIn = rand(3, 6), shake = 0, intro = 1.6, roundWon = 0;
    const fx = { grow: 0, ice: 0, star: 0, foeGrow: 0 }, trail = [], drops = [], pops = [], rings = [];
    let shield = false, foeShield = false, item = null, itemIn = rand(6, 10);
    const calm = calmFx();
    const rival = () => { const f = FOES[(round - 1) % FOES.length], lap = Math.floor((round - 1) / FOES.length); return { ...f, speed: f.speed * (1 + lap * 0.14), err: f.err * 0.75 ** lap, react: f.react * 0.85 ** lap, ball: f.ball + lap * 18 }; };
    let foeDef = rival();
    const myW = () => PW * (fx.grow ? 1.5 : 1), foeW = () => foeDef.pw * (fx.foeGrow ? 1.4 : 1);
    const splash = (x, y, n, c = '#d8f4ff') => { if (calm) n = Math.ceil(n / 2); for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(30, 130); drops.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: rand(0.3, 0.6), c }); } };
    const pop = (x, y, text, colour = '#fff070', size = 16) => pops.push({ x, y, text, colour, size, t: 1 });
    const serve = () => {
      const a = (Math.random() - 0.5) * (serveMe ? 0.8 : 0.6 + Math.min(0.5, round * 0.08)), sp = foeDef.ball;
      ball = { x: serveMe ? me : foe, y: serveMe ? ME_Y - BR - 2 : FOE_Y + PH + BR + 2, vx: Math.sin(a) * sp, vy: (serveMe ? -1 : 1) * Math.cos(a) * sp, curve: 0, hot: false };
      lastHit = serveMe ? 'me' : 'foe'; rally = 0; trail.length = 0;
      api.sound('fx-whoosh', 'select');
    };
    const point = (toMe) => {
      if (toMe ? foeShield : shield) {   // a bubble shield turns the ball back once
        if (toMe) foeShield = false; else shield = false;
        ball.vy = -ball.vy; ball.y = toMe ? FOE_Y - 4 : ME_Y + PH + 4; splash(ball.x, ball.y, 14, '#d8c0ff'); api.sound('fx-pop', 'plink-2'); pop(ball.x, ball.y + (toMe ? 20 : -20), 'Shield!', '#d8c0ff');
        return;
      }
      splash(ball.x, toMe ? 10 : H - 10, 20); rings.push({ x: ball.x, y: toMe ? 14 : H - 14, t: 0 });
      ball = null; wait = 1; trail.length = 0;
      if (toMe) {
        mine += 1; const pts = 10 * round * (fx.star ? 2 : 1); api.add(pts); pop(W / 2, H / 2 - 30, `+${pts}`); api.sound('stat-up', 'plink-2'); ouch = 1.2;
      } else { theirs += 1; api.sound('cancel'); if (!calm) shake = 0.3; }
      serveMe = !toMe;
      if (mine >= TO) {
        const win = 50 * round + (theirs === 0 ? 100 : 0); api.add(win);
        api.say(`${foeDef.name} beaten${theirs === 0 ? ' 5-0, perfect' : ''}! +${win}. Next up: ${FOES[round % FOES.length].name}.`);
        api.sound('coins', 'stat-up'); roundWon = 2.2; return;
      }
      if (theirs >= TO) return api.over(`${foeDef.name} wins round ${round}!`);
      api.say(`${mine} - ${theirs} against ${foeDef.name}.`);
    };
    const nextRound = () => {
      round++; foeDef = rival(); mine = 0; theirs = 0; serveMe = true; wait = 1.6; intro = 1.6;
      for (const k in fx) fx[k] = 0; shield = foeShield = false; item = null; itemIn = rand(6, 10);
    };
    /** Where the ball meets the rival's line, bouncing off the side walls on the way. */
    const landing = () => {
      let x = ball.x, vx = ball.vx; const t = (ball.y - (FOE_Y + PH + BR)) / -ball.vy;
      if (t <= 0) return x;
      x += vx * t + (ball.curve || 0) * t * t * 0.5 * 0.6;
      const span = W - BR * 2; x -= BR; x = ((x % (2 * span)) + 2 * span) % (2 * span); if (x > span) x = 2 * span - x;
      return x + BR;
    };
    const hit = (px, pw, down, mover) => {
      const off = Math.max(-1, Math.min(1, (ball.x - px) / (pw / 2)));
      let sp = Math.min(MAXV, Math.hypot(ball.vx, ball.vy) * 1.045);
      ball.curve = 0; ball.hot = false;
      let ang = off * 0.95;
      if (!down && Math.abs(mover) > 140) { sp = Math.min(MAXV, sp * 1.14); ball.curve = -Math.sign(mover) * 260; ball.hot = true; pop(ball.x, ball.y - 18, 'Smash!', '#ffb050', 13); api.sound('fx-whoosh', 'plink-2'); }
      if (down) {
        if (Math.random() < foeDef.aim) ang = (me < W / 2 ? 1 : -1) * rand(0.35, 0.8);   // aims away from you
        if (foeDef.smash && Math.random() < foeDef.smash) { sp = Math.min(MAXV, sp * 1.3); ball.hot = true; pop(ball.x, ball.y + 18, 'Smash!', '#ff8060', 13); api.sound('fx-whoosh', 'plink-2'); }
        if (foeDef.curve && Math.random() < foeDef.curve) { ball.curve = (Math.random() < 0.5 ? -1 : 1) * rand(220, 340); pop(ball.x, ball.y + 18, 'Swift!', '#ffe8a0', 13); }
      }
      ball.vx = Math.sin(ang) * sp; ball.vy = (down ? 1 : -1) * Math.cos(ang) * sp;
      rally++; lastHit = down ? 'foe' : 'me';
      splash(ball.x, ball.y, 5);
      api.sound('plink-1');
      if (!down) {
        const pts = (1 + Math.floor(rally / 6)) * (fx.star ? 2 : 1); api.add(pts);
        if (rally && rally % 10 === 0) { const b = rally * 2; api.add(b); pop(W / 2, H / 2 + 26, `Rally ${rally}! +${b}`, '#a8ffb0'); api.sound('fx-coin', 'coins'); }
      }
    };
    const grab = (kind) => {
      const mine_ = lastHit === 'me';
      if (kind === 'grow') mine_ ? (fx.grow = 10) : (fx.foeGrow = 10);
      else if (kind === 'ice') mine_ ? (fx.ice = 6) : null;
      else if (kind === 'shield') mine_ ? (shield = true) : (foeShield = true);
      else if (kind === 'star') mine_ ? (fx.star = 10) : null;
      const [c, , line] = ITEMS[kind];
      if (mine_) { api.say(line); api.sound('fx-coin', 'coins'); } else { api.say(kind === 'grow' ? `${foeDef.name} took a wide board!` : kind === 'shield' ? `${foeDef.name} took a bubble shield!` : `${foeDef.name} knocked it away.`); api.sound('cancel'); }
      splash(item.x, item.y, 12, c);
      item = null; itemIn = rand(8, 13);
    };
    return {
      tick(dt) {
        const was = me;
        if (target != null) me += Math.max(-430 * dt, Math.min(430 * dt, target - me)); else me += keyDir * 320 * dt;
        me = Math.max(myW() / 2, Math.min(W - myW() / 2, me));
        myV = myV * 0.6 + (me - was) / Math.max(dt, 0.001) * 0.4;
        ouch = Math.max(0, ouch - dt); shake = Math.max(0, shake - dt);
        for (const k in fx) fx[k] = Math.max(0, fx[k] - dt);
        for (const d of drops) { d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 0.94; d.vy *= 0.94; d.t -= dt; }
        for (const p of pops) { p.y -= 22 * dt; p.t -= dt; }
        for (const r of rings) r.t += dt;
        while (drops.length && drops[0].t <= 0) drops.shift();
        while (pops.length && pops[0].t <= 0) pops.shift();
        while (rings.length && rings[0].t > 0.8) rings.shift();
        if (roundWon) { roundWon -= dt; if (roundWon <= 0) { roundWon = 0; nextRound(); } return; }
        if (intro) intro = Math.max(0, intro - dt);
        // the rival: reads the ball's landing late and a little wrong, less so every round
        if (foeDef.confused) { dizzyIn -= dt; if (dizzyIn <= 0) { dizzy = 0.8; dizzyIn = rand(4, 7); } dizzy = Math.max(0, dizzy - dt); }
        think -= dt;
        if (think <= 0) { think = foeDef.react; foeAim = ball && ball.vy < 0 ? landing() + rand(-foeDef.err, foeDef.err) : W / 2 + Math.sin(performance.now() / 900) * 20; }
        const foeSpeed = foeDef.speed * (fx.ice ? 0.5 : 1) * (dizzy ? 0.1 : 1);
        foe += Math.max(-foeSpeed * dt, Math.min(foeSpeed * dt, foeAim - foe));
        foe = Math.max(foeW() / 2, Math.min(W - foeW() / 2, foe));
        itemIn -= dt;
        if (!item && itemIn <= 0 && ball) { const kinds = Object.keys(ITEMS); item = { kind: kinds[Math.floor(Math.random() * kinds.length)], x: rand(50, W - 50), y: rand(H * 0.33, H * 0.62), t: 0 }; }
        if (item) { item.t += dt; if (item.t > 9) { item = null; itemIn = rand(5, 9); } }
        if (!ball) { if (!intro) { wait -= dt; if (wait <= 0) serve(); } return; }
        const steps = 3;
        for (let n = 0; n < steps && ball; n++) {
          const h = dt / steps;
          if (ball.curve) { ball.vx += ball.curve * h; ball.curve *= Math.exp(-h * 1.6); if (Math.abs(ball.curve) < 10) ball.curve = 0; }
          ball.x += ball.vx * h; ball.y += ball.vy * h;
          if (ball.x < BR + 6) { ball.x = BR + 6; ball.vx = Math.abs(ball.vx); ball.curve = 0; rings.push({ x: 6, y: ball.y, t: 0 }); api.sound('fx-tick', 'select'); }
          if (ball.x > W - BR - 6) { ball.x = W - BR - 6; ball.vx = -Math.abs(ball.vx); ball.curve = 0; rings.push({ x: W - 6, y: ball.y, t: 0 }); api.sound('fx-tick', 'select'); }
          if (ball.vy > 0 && ball.y + BR >= ME_Y && ball.y + BR <= ME_Y + PH + 8 && Math.abs(ball.x - me) < myW() / 2 + BR) { ball.y = ME_Y - BR; hit(me, myW(), false, myV); }
          else if (ball.vy < 0 && ball.y - BR <= FOE_Y + PH && ball.y - BR >= FOE_Y - 8 && Math.abs(ball.x - foe) < foeW() / 2 + BR) { ball.y = FOE_Y + PH + BR; hit(foe, foeW(), true, 0); }
          if (item && Math.hypot(ball.x - item.x, ball.y - item.y) < BR + 12) grab(item.kind);
          if (ball.y > H + BR) point(false);
          else if (ball.y < -BR) point(true);
        }
        if (ball) { trail.push(ball.x, ball.y); if (trail.length > 16) trail.splice(0, 2); }
      },
      down(x) { target = x; },
      move(x, y, pressed) { if (pressed) target = x; },
      up() { target = null; },
      key(k, down) { if (k === 'left' || k === 'right') { const d = k === 'left' ? -1 : 1; keyDir = down ? d : keyDir === d ? 0 : keyDir; } },
      draw(g, now) {
        g.save();
        if (shake) g.translate(Math.sin(now / 18) * shake * 10, 0);
        stamp(g, 'pong-pool', 0, 0, W, H, pool);
        g.strokeStyle = 'rgba(255, 255, 255, 0.13)'; g.lineWidth = 1.5;   // light rippling on the water
        for (let i = 0; i < 6; i++) { const y0 = 40 + i * 58; g.beginPath(); for (let x = 8; x <= W - 8; x += 12) g.lineTo(x, y0 + Math.sin(x / 22 + now / 650 + i * 1.3) * 4); g.stroke(); }
        for (const r of rings) { g.strokeStyle = `rgba(230, 248, 255, ${0.7 - r.t * 0.85})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(r.x, r.y, 4 + r.t * 30, 2 + r.t * 12, 0, 0, TAU); g.stroke(); }
        banner(g, String(theirs), W - 24, H / 2 - 22, 22, 'rgba(255, 216, 74, 0.95)');
        banner(g, String(mine), W - 24, H / 2 + 22, 22, 'rgba(255, 255, 255, 0.95)');
        banner(g, `R${round}`, 22, H / 2 - 16, 12, '#d8f0ff');
        const fw = foeW(), mw = myW();
        drawMon(g, foeDef.id, foe + (dizzy ? Math.sin(now / 60) * 4 : 0), FOE_Y - 2 + (ouch > 0 ? Math.sin(now / 30) * 2 : 0), foeDef.id === 'gyarados' || foeDef.id === 'lapras' ? 46 : 40);
        if (ouch > 0 || dizzy) banner(g, '?!', foe + 26, FOE_Y - 32, 15, '#ffd84a');
        if (fx.ice) { g.fillStyle = 'rgba(160, 230, 255, 0.35)'; g.beginPath(); g.roundRect(foe - fw / 2 - 4, FOE_Y - 4, fw + 8, PH + 8, 7); g.fill(); }
        stamp(g, `pong-foe-${Math.round(fw)}`, foe - fw / 2, FOE_Y, fw, PH + 4, board(fw, '#f0c040', '#e86030'));
        stamp(g, `pong-me-${Math.round(mw)}`, me - mw / 2, ME_Y, mw, PH + 4, board(mw, '#f4f4f4', '#3a78e8'));
        for (const [on, y] of [[shield, ME_Y + PH + 6], [foeShield, FOE_Y - 6]]) if (on) { g.strokeStyle = `rgba(200, 170, 255, ${0.6 + 0.3 * Math.sin(now / 150)})`; g.lineWidth = 3; g.beginPath(); g.moveTo(10, y); g.lineTo(W - 10, y); g.stroke(); }
        if (item) {
          const [c, sym] = ITEMS[item.kind], bob = Math.sin(now / 250) * 3, a = item.t > 7 ? (Math.floor(now / 100) % 2 ? 0.4 : 1) : 1;
          g.globalAlpha = a;
          g.fillStyle = 'rgba(255, 255, 255, 0.35)'; g.beginPath(); g.arc(item.x, item.y + bob, 14 + Math.sin(now / 160) * 1.5, 0, TAU); g.fill();
          g.fillStyle = c; g.beginPath(); g.arc(item.x, item.y + bob, 11, 0, TAU); g.fill();
          banner(g, sym, item.x, item.y + bob + 1, 13, '#fff');
          g.globalAlpha = 1;
        }
        if (ball) {
          for (let i = 0; i < trail.length; i += 2) { g.globalAlpha = (i / trail.length) * 0.45; g.fillStyle = ball.hot ? '#ff9040' : '#ffffff'; g.beginPath(); g.arc(trail[i], trail[i + 1], BR * (0.4 + i / trail.length * 0.5), 0, TAU); g.fill(); }
          g.globalAlpha = 1;
          if (ball.hot) { g.fillStyle = 'rgba(255, 140, 40, 0.35)'; g.beginPath(); g.arc(ball.x, ball.y, BR + 4, 0, TAU); g.fill(); }
          g.fillStyle = 'rgba(0, 20, 60, 0.3)'; g.beginPath(); g.ellipse(ball.x + 3, ball.y + 5, BR, BR * 0.5, 0, 0, TAU); g.fill();
          stamp(g, 'pong-ball', ball.x - 9, ball.y - 9, 18, 18, ballArt);
        }
        for (const d of drops) { g.globalAlpha = Math.min(1, d.t * 3); g.fillStyle = d.c; g.fillRect(d.x - 1.2, d.y - 1.2, 2.4, 2.4); }
        g.globalAlpha = 1;
        for (const p of pops) { g.globalAlpha = Math.min(1, p.t * 2); banner(g, p.text, p.x, p.y, p.size, p.colour); }
        g.globalAlpha = 1;
        let fy = H / 2 + 46;
        for (const [k, label, c] of [['grow', 'WIDE', '#a8ffb0'], ['ice', 'ICE', '#b8ecff'], ['star', 'x2', '#ffe070']]) if (fx[k]) { banner(g, `${label} ${Math.ceil(fx[k])}`, 26, fy, 10, c); fy += 14; }
        if (rally >= 4 && ball) banner(g, `RALLY ${rally}`, 30, H / 2 + 20, 10, '#ffffff');
        g.restore();
        if (intro) { g.globalAlpha = Math.min(1, intro * 2); banner(g, `ROUND ${round}`, W / 2, H * 0.42, 30, '#ffd84a'); banner(g, `vs ${foeDef.name.toUpperCase()}`, W / 2, H * 0.42 + 30, 16, '#fff'); g.globalAlpha = 1; }
        if (roundWon) banner(g, 'ROUND WON!', W / 2, H * 0.44, 30 + Math.sin(now / 90) * 2, '#a8ffb0');
      },
    };
  },
}, onClose);
