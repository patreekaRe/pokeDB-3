/* arcade-volley.js  -  Pikachu Volleyball, a home arcade game (js/arcade-kit.js), after the old PC classic: your Pikachu
   on the left of a beach net, a rival on the right. Since 2026-10-17 (the user's ask: every arcade game richer, harder
   and more detailed) it is a ladder of sets, each first to 5: Meowth, Marill, Persian, Raichu, Snorlax (huge and slow)
   and Scyther, then round again quicker. Each rival reads the ball sooner, runs faster, jumps better and spikes more;
   from the third set a sea wind pushes the ball. Press JUMP again in the air for a Thunder spike, a hard shot down into
   their court. Lose a set and the game is over. Every touch scores 1, a point 10 a set (15 off a spike), a set won 50 a
   set and a 5-0 set 100 more. */

import { runArcade, drawMon, banner, stamp, rand } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 340, H = 240, FLOOR = 214, NET_X = W / 2, NET_TOP = 150, BR = 11, GRAV = 520, PR = 20, TO = 5, TAU = Math.PI * 2;
const FOES = [
  { id: 'meowth', name: 'Meowth', speed: 150, react: 0.26, err: 26, jump: 0.35, spike: 0, r: PR },
  { id: 'marill', name: 'Marill', speed: 165, react: 0.22, err: 20, jump: 0.5, spike: 0.1, r: PR },
  { id: 'persian', name: 'Persian', speed: 195, react: 0.18, err: 15, jump: 0.6, spike: 0.25, r: PR },
  { id: 'raichu', name: 'Raichu', speed: 215, react: 0.14, err: 11, jump: 0.75, spike: 0.4, r: PR },
  { id: 'snorlax', name: 'Snorlax', speed: 120, react: 0.16, err: 8, jump: 0.3, spike: 0.2, r: 30 },
  { id: 'scyther', name: 'Scyther', speed: 245, react: 0.1, err: 6, jump: 0.85, spike: 0.55, r: PR },
];

/** The beach painted once: sky to the horizon, the sun, the sea with its foam, an island, palms, a parasol and towel,
    the sand, and the net on its posts. */
function beach(g) {
  const sky = g.createLinearGradient(0, 0, 0, 130); sky.addColorStop(0, '#3a98e8'); sky.addColorStop(1, '#bfe8ff');
  g.fillStyle = sky; g.fillRect(0, 0, W, 132);
  const sun = g.createRadialGradient(56, 36, 4, 56, 36, 46); sun.addColorStop(0, 'rgba(255, 250, 210, 1)'); sun.addColorStop(0.35, 'rgba(255, 236, 150, 0.9)'); sun.addColorStop(1, 'rgba(255, 236, 150, 0)');
  g.fillStyle = sun; g.fillRect(0, 0, 110, 90);
  g.fillStyle = '#5ab0a0'; g.beginPath(); g.moveTo(232, 128); g.quadraticCurveTo(262, 104, 296, 128); g.fill();   // the island
  g.strokeStyle = '#6a5030'; g.lineWidth = 2; g.beginPath(); g.moveTo(266, 116); g.quadraticCurveTo(268, 106, 262, 98); g.stroke();
  g.fillStyle = '#3a8a4a'; for (const a of [-2.6, -1.9, -1.2, -0.5]) { g.beginPath(); g.ellipse(262 + Math.cos(a) * 7, 98 + Math.sin(a) * 4, 8, 2.5, a, 0, TAU); g.fill(); }
  const sea = g.createLinearGradient(0, 126, 0, 168); sea.addColorStop(0, '#2a7ac8'); sea.addColorStop(1, '#5ac8e0');
  g.fillStyle = sea; g.fillRect(0, 126, W, 44);
  g.fillStyle = 'rgba(255, 255, 255, 0.3)'; for (let i = 0; i < 22; i++) g.fillRect((i * 47) % W, 132 + (i * 13) % 30, 10 + (i % 3) * 6, 1.2);
  const sand = g.createLinearGradient(0, 160, 0, H); sand.addColorStop(0, '#f6e4a8'); sand.addColorStop(1, '#e0c078');
  g.fillStyle = sand; g.beginPath(); g.moveTo(0, 170);
  for (let x = 0; x <= W; x += 10) g.lineTo(x, 166 + Math.sin(x / 23) * 2.5);
  g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.75)'; g.beginPath(); g.moveTo(0, 168);
  for (let x = 0; x <= W; x += 10) g.lineTo(x, 166 + Math.sin(x / 23) * 2.5);
  for (let x = W; x >= 0; x -= 10) g.lineTo(x, 170 + Math.sin(x / 23) * 2.5 + Math.sin(x / 7) * 1.2);
  g.fill();
  for (let i = 0; i < 90; i++) { g.fillStyle = i % 3 ? 'rgba(170, 130, 60, 0.35)' : 'rgba(255, 255, 255, 0.5)'; g.fillRect((i * 37) % W, 176 + (i * 23) % (H - 178), 1.4, 1.4); }
  g.fillStyle = 'rgba(160, 120, 60, 0.25)'; g.fillRect(0, FLOOR, W, 1.5);
  const palm = (x, lean, h) => {
    g.strokeStyle = '#8a6438'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, 172); g.quadraticCurveTo(x + lean * 0.3, 172 - h * 0.6, x + lean, 172 - h); g.stroke();
    g.strokeStyle = '#6a4a28'; g.lineWidth = 1.2;
    for (let k = 1; k < 8; k++) { const t = k / 8, px = x + lean * t * t, py = 172 - h * t; g.beginPath(); g.moveTo(px - 3, py); g.lineTo(px + 3, py - 2); g.stroke(); }
    const tx = x + lean, ty = 172 - h;
    for (const [a, l] of [[-2.9, 30], [-2.3, 34], [-1.6, 28], [-0.9, 34], [-0.25, 30], [0.4, 24], [2.6, 24]]) {
      g.fillStyle = '#2e8a3a'; g.beginPath(); g.moveTo(tx, ty);
      g.quadraticCurveTo(tx + Math.cos(a) * l * 0.6, ty + Math.sin(a) * l * 0.6 - 10, tx + Math.cos(a) * l, ty + Math.sin(a) * l + 6);
      g.quadraticCurveTo(tx + Math.cos(a) * l * 0.5, ty + Math.sin(a) * l * 0.5 - 2, tx, ty); g.fill();
    }
    g.fillStyle = '#7a4a20'; for (const d of [-3, 3]) { g.beginPath(); g.arc(tx + d, ty + 4, 3, 0, TAU); g.fill(); }
  };
  palm(10, 12, 92); palm(W - 12, -14, 86);
  g.strokeStyle = '#d0d0d0'; g.lineWidth = 2; g.beginPath(); g.moveTo(76, 188); g.lineTo(84, 140); g.stroke();   // the parasol
  for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? '#ffffff' : '#e84848'; g.beginPath(); g.moveTo(84, 138); g.arc(84, 146, 26, Math.PI + k * Math.PI / 6, Math.PI + (k + 1) * Math.PI / 6); g.closePath(); g.fill(); }
  g.fillStyle = '#58a8e8'; g.beginPath(); g.roundRect(244, 190, 40, 12, 2); g.fill();   // a towel
  g.fillStyle = '#ffffff'; for (let x = 248; x < 282; x += 8) g.fillRect(x, 190, 3, 12);
  for (const [x, c] of [[120, '#f0c0d0'], [300, '#ffe0b0'], [216, '#f8f0e0']]) { g.fillStyle = c; g.beginPath(); g.arc(x, 208, 3.5, Math.PI, 0); g.fill(); }
  g.fillStyle = '#8a8a8a'; g.fillRect(NET_X - 2.5, NET_TOP - 6, 5, FLOOR - NET_TOP + 8);   // the net
  g.strokeStyle = 'rgba(255, 255, 255, 0.75)'; g.lineWidth = 0.8;
  for (let y = NET_TOP; y <= NET_TOP + 34; y += 5) { g.beginPath(); g.moveTo(NET_X - 4, y); g.lineTo(NET_X + 4, y); g.stroke(); }
  g.fillStyle = '#f4f4f4'; g.fillRect(NET_X - 5, NET_TOP - 4, 10, 4);
  g.fillStyle = '#c83838'; g.beginPath(); g.arc(NET_X, NET_TOP - 7, 4, 0, TAU); g.fill();
  g.fillStyle = 'rgba(0, 0, 0, 0.2)'; g.beginPath(); g.ellipse(NET_X + 3, FLOOR + 2, 9, 2.5, 0, 0, TAU); g.fill();
}
/** The Poké Ball, painted in a 24 x 24 box (it spins as it flies). */
function ballArt(g) {
  const c = 12;
  g.fillStyle = '#e83a3a'; g.beginPath(); g.arc(c, c, BR, Math.PI, 0); g.fill();
  g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(c, c, BR, 0, Math.PI); g.fill();
  g.strokeStyle = '#202028'; g.lineWidth = 1.6; g.beginPath(); g.arc(c, c, BR, 0, TAU); g.moveTo(c - BR, c); g.lineTo(c + BR, c); g.stroke();
  g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(c, c, 3.2, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.6)'; g.beginPath(); g.ellipse(c - 4, c - 5, 3, 1.6, -0.6, 0, TAU); g.fill();
}

export const openVolley = (onClose) => runArcade({
  id: 'volley', title: 'Pikachu Volleyball', colour: '#f0c020', W, H,
  intro: 'Win every set to 5! Joystick to run, JUMP to jump, JUMP in the air to spike.',
  pad: [['JUMP', 'jump']],
  sounds: ['fx-whoosh', 'fx-zap', 'fx-coin', 'fx-drum'],
  help: [['Push the joystick to run, press JUMP to jump.', 'Or hold beside Pikachu to run and tap above it to jump (the arrow keys and Space work too).'], ['Press JUMP again in the air for a Thunder spike:', 'touch the ball while it crackles and it shoots down into their court.'], ['Keep the ball off your sand, in three touches at most.', 'Every touch scores 1, a point 10 a set, 15 off a spike.'], [`Each set is first to ${TO}.`, 'Six rivals, each sharper; a sea wind blows from set 3. Lose a set and it\'s over.']],
  make(api) {
    let foeDef = FOES[0], set = 1;
    const me = { x: 80, y: 0, vy: 0, spike: 0, squash: 0 }, foe = { x: W - 80, y: 0, vy: 0, spike: 0, squash: 0 };
    let ball = null, mine = 0, theirs = 0, serveTo = 'me', wait = 1.6, target = null, keyDir = 0, jumpAsk = false, spin = 0, lastTouch = null;
    let foeAim = W - 80, think = 0, wind = 0, intro = 1.6, setWon = 0, shake = 0, flash = 0, touches = 0;
    const puffs = [], pops = [], trail = [], sparks = [];
    const calm = calmFx();
    const rival = () => { const f = FOES[(set - 1) % FOES.length], lap = Math.floor((set - 1) / FOES.length); return { ...f, speed: f.speed * (1 + lap * 0.15), react: f.react * 0.85 ** lap, err: f.err * 0.75 ** lap, jump: Math.min(1, f.jump + lap * 0.1), spike: Math.min(0.8, f.spike + lap * 0.1) }; };
    const pop = (x, y, text, colour = '#fff070', size = 14) => pops.push({ x, y, text, colour, size, t: 1 });
    const puff = (x, n = 6) => { if (calm) n = Math.ceil(n / 2); for (let i = 0; i < n; i++) puffs.push({ x: x + rand(-6, 6), y: FLOOR - 2, vx: rand(-50, 50), vy: rand(-50, -15), t: rand(0.3, 0.5) }); };
    const radius = (p) => (p === foe ? foeDef.r : PR);
    const serve = () => { ball = { x: serveTo === 'me' ? 80 : W - 80, y: 60, vx: 0, vy: 0, hot: false }; lastTouch = null; touches = 0; trail.length = 0; };
    const jump = (p) => { if (p.y === 0) { p.vy = p === foe && foeDef.r > PR ? 290 : 330; puff(p.x, 5); return true; } return false; };
    const move = (p, dir, speed, dt, lo, hi) => { p.x = Math.max(lo, Math.min(hi, p.x + dir * speed * dt)); };
    const point = (toMe) => {
      const spiked = ball.hot;
      puff(ball.x, 12); if (!calm && spiked) shake = 0.35;
      ball = null; wait = 1; trail.length = 0;
      if (toMe) { mine += 1; const pts = (spiked ? 15 : 10) * set; api.add(pts); pop(W / 4, 70, `+${pts}`); api.sound('stat-up', 'plink-2'); }
      else { theirs += 1; api.sound('cancel'); }
      serveTo = toMe ? 'me' : 'foe';
      if (mine >= TO) {
        const win = 50 * set + (theirs === 0 ? 100 : 0); api.add(win);
        api.say(`${foeDef.name} beaten${theirs === 0 ? ' 5-0, perfect' : ''}! +${win}. Next: ${FOES[set % FOES.length].name}.`);
        api.sound('coins', 'stat-up'); setWon = 2.2; return;
      }
      if (theirs >= TO) return api.over(`${foeDef.name} takes set ${set}!`);
      api.say(`${mine} - ${theirs} against ${foeDef.name}.`);
    };
    const nextSet = () => {
      set++; foeDef = rival(); mine = 0; theirs = 0; serveTo = 'me'; wait = 1.6; intro = 1.6;
      wind = set >= 3 ? (Math.random() < 0.5 ? -1 : 1) * Math.min(70, 25 + set * 6) : 0;
      if (wind) api.say(`Set ${set} against ${foeDef.name}. A sea wind blows ${wind > 0 ? 'their' : 'your'} way!`);
    };
    /** Where the ball comes down to head height, bouncing off the side walls (the rival's guess). */
    const landing = () => {
      const head = FLOOR - PR * 2, a = (GRAV) / 2, b = ball.vy, c = ball.y - head;
      const t = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
      let x = ball.x + ball.vx * t + wind * t * t / 2;
      if (x > W - BR) x = 2 * (W - BR) - x;
      if (x < BR) x = 2 * BR - x;
      return x;
    };
    const bump = (p, dir) => {
      const r = radius(p), cx = p.x, cy = FLOOR - p.y - r, dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
      if (d >= BR + r || d === 0 || lastTouch === p && touches > 0 && ball.vy < 0) return false;
      const ux = dx / d, uy = dy / d, sp = Math.max(300, Math.hypot(ball.vx, ball.vy));
      ball.x = cx + ux * (BR + r); ball.y = cy + uy * (BR + r);
      if (p.spike > 0 && p.y > 20) {   // a spike: hard and down into the other court
        const high = ball.y < NET_TOP - 10;
        ball.vx = dir * rand(400, 460); ball.vy = high ? rand(80, 160) : -200; ball.hot = true;
        p.spike = 0; flash = 0.15; spin = dir * 30;
        pop(p.x + dir * 20, FLOOR - p.y - 50, 'SPIKE!', p === me ? '#fff070' : '#ff9070', 16);
        for (let i = 0; i < (calm ? 4 : 10); i++) { const a = rand(0, TAU); sparks.push({ x: ball.x, y: ball.y, vx: Math.cos(a) * rand(60, 160), vy: Math.sin(a) * rand(60, 160), t: rand(0.2, 0.4) }); }
        api.sound('fx-zap', 'thunder');
      } else {
        ball.vx = ux * sp * 0.9 + dir * 60; ball.vy = Math.min(-200, uy * sp * 0.9 - 120); ball.hot = false;
        spin = ball.vx / 20;
        api.sound('plink-1');
      }
      p.squash = 1;
      touches = lastTouch === p ? touches + 1 : 1; lastTouch = p;
      if (p === me) api.add(1);
      return touches > 3;
    };
    foeDef = rival();
    return {
      tick(dt) {
        for (const q of puffs) { q.x += q.vx * dt; q.y += q.vy * dt; q.t -= dt; }
        for (const q of pops) { q.y -= 20 * dt; q.t -= dt; }
        for (const q of sparks) { q.x += q.vx * dt; q.y += q.vy * dt; q.t -= dt; }
        while (puffs.length && puffs[0].t <= 0) puffs.shift();
        while (pops.length && pops[0].t <= 0) pops.shift();
        while (sparks.length && sparks[0].t <= 0) sparks.shift();
        shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
        if (setWon) { setWon -= dt; if (setWon <= 0) { setWon = 0; nextSet(); } return; }
        if (intro) { intro = Math.max(0, intro - dt); return; }
        let dir = keyDir;
        if (target != null) dir = Math.abs(target - me.x) < 6 ? 0 : Math.sign(target - me.x);
        move(me, dir, 190, dt, PR, NET_X - PR - 4);
        if (jumpAsk) { if (!jump(me) && me.y > 0) { me.spike = 0.32; api.sound('fx-whoosh', 'select'); } jumpAsk = false; }
        if (ball) {
          think -= dt;
          if (think <= 0) {
            think = foeDef.react;
            // a step behind where it comes down, so its bump carries the ball forward over the net
            foeAim = ball.x > NET_X - 40 || ball.vx > 60 ? Math.max(NET_X + foeDef.r + 4, Math.min(W - foeDef.r, landing() + 10 + rand(-foeDef.err, foeDef.err))) : W - 90;
          }
          move(foe, Math.abs(foeAim - foe.x) < 5 ? 0 : Math.sign(foeAim - foe.x), foeDef.speed, dt, NET_X + foeDef.r + 4, W - foeDef.r);
          const near = Math.abs(ball.x - foe.x) < 46 && ball.x > NET_X;
          if (near && ball.vy > 0 && ball.y > 70 && ball.y < FLOOR - 90 && Math.random() < foeDef.jump * dt * 6) jump(foe);
          if (foe.y > 30 && near && ball.y < FLOOR - foe.y - 10 && Math.abs(foe.x - NET_X) < 110 && !foe.spike && Math.random() < foeDef.spike * dt * 8) foe.spike = 0.3;
        }
        for (const p of [me, foe]) {
          const was = p.y;
          p.vy -= GRAV * 1.3 * dt; p.y = Math.max(0, p.y + p.vy * dt);
          if (p.y === 0) { if (was > 0) { puff(p.x, 4); p.squash = 0.6; } p.vy = 0; }
          p.spike = Math.max(0, p.spike - dt); p.squash = Math.max(0, p.squash - dt * 4);
        }
        if (!ball) { wait -= dt; if (wait <= 0) serve(); return; }
        const steps = 3;
        for (let n = 0; n < steps; n++) {
          const h = dt / steps;
          ball.vy += GRAV * h; ball.vx += wind * h; ball.x += ball.vx * h; ball.y += ball.vy * h;
          if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx) * 0.9; }
          if (ball.x > W - BR) { ball.x = W - BR; ball.vx = -Math.abs(ball.vx) * 0.9; }
          if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy); }
          if (ball.y > NET_TOP - BR && Math.abs(ball.x - NET_X) < BR + 3) {
            if (ball.y < NET_TOP) { ball.vy = -Math.abs(ball.vy) * 0.7; ball.y = NET_TOP - BR; }
            else { ball.vx = (ball.x < NET_X ? -1 : 1) * Math.abs(ball.vx) * 0.6; ball.x = NET_X + (ball.x < NET_X ? -1 : 1) * (BR + 3); }
            api.sound('fx-tick', 'select');
          }
          // a fourth touch in a row is a fault, as in volleyball: juggling the ball on one head stalled a rally for good
          if (bump(me, 1)) { pop(me.x, 70, 'Four touches!', '#ff9070'); return point(false); }
          if (bump(foe, -1)) { pop(foe.x, 70, 'Four touches!', '#a8ffb0'); return point(true); }
          if (ball.y > FLOOR - BR) return point(ball.x > NET_X);
        }
        trail.push(ball.x, ball.y); if (trail.length > 12) trail.splice(0, 2);
      },
      down(x, y) { if (y < FLOOR - me.y - PR * 2 - 6 && Math.abs(x - me.x) < 60) jumpAsk = true; else target = x; },
      move(x, y, pressed) { if (pressed && target != null) target = x; },
      up() { target = null; },
      jump() { jumpAsk = true; },
      key(k, down) { if (k === 'left' || k === 'right') keyDir = down ? (k === 'left' ? -1 : 1) : 0; else if ((k === 'up' || k === 'act') && down) jumpAsk = true; },
      draw(g, now) {
        g.save();
        if (shake) g.translate(Math.sin(now / 18) * shake * 10, 0);
        stamp(g, 'volley-beach', 0, 0, W, H, beach);
        g.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let i = 0; i < 3; i++) { const x = (i * 140 + now / (60 - wind * 0.4)) % (W + 80) - 40; g.beginPath(); g.ellipse(x, 22 + i * 16, 24, 7, 0, 0, TAU); g.ellipse(x + 12, 18 + i * 16, 14, 7, 0, 0, TAU); g.fill(); }
        g.strokeStyle = 'rgba(255, 255, 255, 0.5)'; g.lineWidth = 1;
        for (let i = 0; i < 4; i++) { const x = (i * 97 + now / 40) % (W + 40) - 20; g.beginPath(); g.moveTo(x, 140 + i * 6); g.lineTo(x + 14, 140 + i * 6); g.stroke(); }
        const wx = (now / 30) % (W + 200) - 100;   // a Wingull gliding over
        drawMon(g, 'wingull', wx, 64 + Math.sin(now / 400) * 6, 20, true);
        if (wind) {
          g.fillStyle = '#e84848'; const fl = wind > 0 ? 1 : -1, wave = Math.sin(now / 90) * 2;
          g.beginPath(); g.moveTo(NET_X, NET_TOP - 30); g.lineTo(NET_X + fl * 18, NET_TOP - 26 + wave); g.lineTo(NET_X, NET_TOP - 20); g.fill();
          g.fillStyle = '#999'; g.fillRect(NET_X - 1, NET_TOP - 32, 2, 26);
          g.strokeStyle = 'rgba(255, 255, 255, 0.55)'; g.lineWidth = 1.2;
          for (let i = 0; i < 4; i++) { const x = ((i * 91 + now * Math.abs(wind) / 400) % (W + 40)) - 20, xx = wind > 0 ? x : W - x, y = 40 + i * 24; g.beginPath(); g.moveTo(xx, y); g.lineTo(xx + fl * 16, y); g.stroke(); }
        }
        for (const p of [me, foe]) {
          const r = radius(p), s = Math.max(0.6, 1 - p.y / 140);
          g.fillStyle = 'rgba(80, 50, 10, 0.25)'; g.beginPath(); g.ellipse(p.x, FLOOR + 2, r * 0.9 * s, 3 * s, 0, 0, TAU); g.fill();
          g.save(); g.translate(p.x, FLOOR - p.y + 3); g.scale(1 + p.squash * 0.15, 1 - p.squash * 0.15);
          drawMon(g, p === me ? 'pikachu' : foeDef.id, 0, 0, r * 2.4, p === me);
          g.restore();
          if (p.spike) { g.strokeStyle = `rgba(255, 240, 90, ${0.5 + p.spike * 1.5})`; g.lineWidth = 2; g.beginPath(); for (let k = 0; k < 6; k++) { const a = now / 40 + k * 1.05; g.lineTo(p.x + Math.cos(a) * (r + 6 + (k % 2) * 4), FLOOR - p.y - r + Math.sin(a) * (r + 6 + (k % 2) * 4)); } g.stroke(); }
        }
        if (ball) {
          const sh = Math.max(0.3, 1 - (FLOOR - ball.y) / 220);
          g.fillStyle = 'rgba(80, 50, 10, 0.25)'; g.beginPath(); g.ellipse(ball.x, FLOOR + 3, 10 * sh, 3 * sh, 0, 0, TAU); g.fill();
          for (let i = 0; i < trail.length; i += 2) { g.globalAlpha = i / trail.length * (ball.hot ? 0.6 : 0.25); g.fillStyle = ball.hot ? '#ffe040' : '#ffffff'; g.beginPath(); g.arc(trail[i], trail[i + 1], BR * (0.4 + i / trail.length * 0.5), 0, TAU); g.fill(); }
          g.globalAlpha = 1;
          if (ball.hot) { g.fillStyle = 'rgba(255, 230, 60, 0.4)'; g.beginPath(); g.arc(ball.x, ball.y, BR + 5, 0, TAU); g.fill(); }
          stamp(g, 'volley-ball', ball.x - 12, ball.y - 12, 24, 24, ballArt);
          g.strokeStyle = 'rgba(32, 32, 40, 0.8)'; g.lineWidth = 1.6;   // the seam turning with its spin
          const a = now / 1000 * spin; g.beginPath(); g.moveTo(ball.x - Math.cos(a) * BR, ball.y - Math.sin(a) * BR); g.lineTo(ball.x + Math.cos(a) * BR, ball.y + Math.sin(a) * BR); g.stroke();
        } else if (wait > 0 && !intro && !setWon) {
          const sx = serveTo === 'me' ? 80 : W - 80;
          g.globalAlpha = 0.5 + 0.3 * Math.sin(now / 120); stamp(g, 'volley-ball', sx - 12, 48, 24, 24, ballArt); g.globalAlpha = 1;
        }
        for (const q of sparks) { g.fillStyle = '#fff8a0'; g.fillRect(q.x - 1.5, q.y - 1.5, 3, 3); }
        for (const q of puffs) { g.globalAlpha = Math.min(1, q.t * 2.5); g.fillStyle = '#f0dca0'; g.beginPath(); g.arc(q.x, q.y, 3 + (0.5 - q.t) * 6, 0, TAU); g.fill(); }
        g.globalAlpha = 1;
        for (const q of pops) { g.globalAlpha = Math.min(1, q.t * 2); banner(g, q.text, q.x, q.y, q.size, q.colour); }
        g.globalAlpha = 1;
        g.restore();
        if (flash) { g.fillStyle = `rgba(255, 255, 200, ${flash * (calm ? 1 : 2.5)})`; g.fillRect(0, 0, W, H); }
        g.fillStyle = 'rgba(10, 30, 60, 0.55)'; g.beginPath(); g.roundRect(W / 2 - 66, 4, 132, 26, 8); g.fill();
        banner(g, String(mine), W / 2 - 46, 18, 20, '#ffd84a'); banner(g, String(theirs), W / 2 + 46, 18, 20, '#ffffff');
        banner(g, `SET ${set}`, W / 2, 13, 10, '#bfe8ff');
        banner(g, foeDef.name.toUpperCase(), W / 2, 24, 10, '#ffffff', 60);
        if (intro) { g.globalAlpha = Math.min(1, intro * 2); banner(g, `SET ${set}`, W / 2, H * 0.4, 28, '#ffd84a'); banner(g, `vs ${foeDef.name.toUpperCase()}`, W / 2, H * 0.4 + 26, 15, '#fff'); g.globalAlpha = 1; }
        if (setWon) banner(g, 'SET WON!', W / 2, H * 0.42, 28 + Math.sin(now / 90) * 2, '#a8ffb0');
      },
    };
  },
}, onClose);
