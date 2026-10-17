/* pinball-rayquaza.js  -  Rayquaza's Sky Pillar Pinball, a home arcade table on js/pinball-kit.js (2026-10-17, the
   user's ask: four more tables after the rebuilt Pokémon Pinball, each completely different). A table nearly two
   screens tall that the camera scrolls, as the Game Boy's Pokémon Pinball does: the Sky Pillar's stone foot below,
   the dawn sky above, a pair of flippers for each. The SKY LIFT ramp in the tower carries the ball up to the sky and
   lights ASCEND; sinking ASCEND climbs a floor (five, each worth more, each with its own Pokémon on the cloud
   bumpers), and on the fifth it wakes Rayquaza, who circles the top: hit it eight times before it flies off to catch
   it and start 3-ball Dragon Ascent (the lift then scores Jackpots). Gusts blow across the clouds, S-K-Y lanes raise
   the bonus, the Trapinch bank lights the outlanes' kickbacks and evolves into Flygon. */

import { openTable, arc, bump, hitSeg, side, rails, slingArt, gateArt, rampArt, lampInsert, arrowInsert, arrowPath, label, hash, drawMon, stamp, TAU } from './pinball-kit.js';

const W = 300, H = 520, WH = 980;
const ARCH = { x: 150, y: 140, rx: 138, ry: 88 };
const LANES = [104, 140, 176], LANE_Y = 102, MULT = [104, 128, 152, 176], MULT_Y = 372;
const CLOUDS = [{ x: 108, y: 196 }, { x: 172, y: 196 }, { x: 140, y: 244 }], LOW = { x: 150, y: 612 }, BR = 15;
const FLOORS = ['swablu', 'altaria', 'dratini', 'dragonair', 'salamence'];
const ASCEND = { x: 66, y: 238 }, SPIN_Y = 410;
const WIND = { x0: 44, x1: 236, y0: 272, y1: 362 };
const TRAP = [118, 140, 162], TRAP_Y = 724, EVO = ['trapinch', 'vibrava', 'flygon'];
const LIFT = [[216, 640], [222, 560], [226, 470], [222, 400], [206, 340], [178, 312], [150, 300]];
const RAY = { x: 150, y: 198, rx: 80, ry: 46 };
const SLINGS = [
  { s: 'l', a: [62, 382], b: [88, 444], c: [62, 428] }, { s: 'r', a: [218, 382], b: [192, 444], c: [218, 428] },
  { s: 'l', a: [56, 830], b: [82, 892], c: [56, 876] }, { s: 'r', a: [224, 830], b: [198, 892], c: [224, 876] },
];
const DEFLECTS = [[12, 520, 44, 548], [268, 520, 236, 548]];   // one-way: up a channel passes, down it turns inward
const WALLS = [...arc(ARCH.x, ARCH.y, ARCH.rx, ARCH.ry, Math.PI, TAU, 28),
  [12, 140, 12, 1000], [288, 140, 288, 1000], [268, 170, 268, 1000],
  ...[86, 122, 158, 194].map(x => [x, 88, x, 116]),
  [40, 290, 40, 444], [40, 444, 101, 477], [240, 290, 240, 444], [240, 444, 179, 477],
  [34, 820, 34, 892], [34, 892, 95, 925], [246, 820, 246, 892], [246, 892, 185, 925],
  ...SLINGS.flatMap(({ a, b, c }) => [[...a, ...c], [...c, ...b]])];
const FLIPPERS = [
  { s: 'l', x: 98, y: 482, len: 36, rest: 0.52, up: -0.5 }, { s: 'r', x: 182, y: 482, len: 36, rest: Math.PI - 0.52, up: Math.PI + 0.5 },
  { s: 'l', x: 92, y: 930, len: 38, rest: 0.52, up: -0.5 }, { s: 'r', x: 188, y: 930, len: 38, rest: Math.PI - 0.52, up: Math.PI + 0.5 },
];
const NEED = 8, RAY_TIME = 30;

/* ---- the painted table ---- */
function cloud(g, x, y, s, a = 0.8) {
  g.fillStyle = `rgba(255, 255, 255, ${a})`;
  for (const [dx, dy, r] of [[-14, 2, 9], [-4, -4, 12], [9, -2, 10], [18, 3, 7], [0, 4, 10]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, TAU); g.fill(); }
}
function tableArt(g) {
  g.fillStyle = '#0a1a14'; g.fillRect(0, 0, W, WH);
  g.save();
  g.beginPath(); g.moveTo(12, WH + 20);
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; g.lineTo(ARCH.x + Math.cos(a) * ARCH.rx, ARCH.y + Math.sin(a) * ARCH.ry); }
  g.lineTo(288, WH + 20); g.closePath(); g.clip();
  // the dawn sky over the clouds, the tower's stone below them
  const sky = g.createLinearGradient(0, 40, 0, 560);
  sky.addColorStop(0, '#2a3a8a'); sky.addColorStop(0.3, '#7a5ab0'); sky.addColorStop(0.55, '#f08a7a'); sky.addColorStop(0.8, '#ffc890'); sky.addColorStop(1, '#a8d8e8');
  g.fillStyle = sky; g.fillRect(0, 0, W, 560);
  const sun = g.createRadialGradient(140, 330, 4, 140, 330, 120);
  sun.addColorStop(0, 'rgba(255, 240, 180, 0.8)'); sun.addColorStop(0.25, 'rgba(255, 210, 140, 0.35)'); sun.addColorStop(1, 'rgba(255, 200, 140, 0)');
  g.fillStyle = sun; g.fillRect(0, 160, W, 340);
  for (let i = 0; i < 50; i++) {   // the last stars, high up
    const x = 14 + hash(i) * 250, y = 50 + hash(i + 50) * 140;
    g.fillStyle = `rgba(255, 255, 255, ${0.3 + hash(i + 9) * 0.5})`; g.fillRect(x, y, 1, 1);
  }
  // Rayquaza's rings: a gold ring round the top, faint
  g.strokeStyle = 'rgba(255, 216, 74, 0.28)'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(RAY.x, RAY.y, RAY.rx + 8, RAY.ry + 8, 0, 0, TAU); g.stroke();
  g.lineWidth = 1; g.setLineDash([2, 6]); g.beginPath(); g.ellipse(RAY.x, RAY.y, RAY.rx + 16, RAY.ry + 16, 0, 0, TAU); g.stroke(); g.setLineDash([]);
  for (const [x, y, s] of [[60, 150, 0.9], [230, 290, 1.1], [70, 330, 0.8], [210, 140, 0.7], [140, 400, 1.2]]) cloud(g, x, y, s, 0.22);
  // the cloud bank at the halfway line, the tower rising out of it
  const stone = g.createLinearGradient(0, 480, 0, WH);
  stone.addColorStop(0, '#5a7a70'); stone.addColorStop(0.4, '#3a5a52'); stone.addColorStop(1, '#1a2e2a');
  g.fillStyle = stone; g.fillRect(0, 500, W, WH - 500);
  g.strokeStyle = 'rgba(0, 0, 0, 0.22)'; g.lineWidth = 1;
  for (let y = 520, row = 0; y < WH; y += 14, row++) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    for (let x = (row % 2) * 18; x < W; x += 36) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 14); g.stroke(); }
  }
  g.fillStyle = 'rgba(160, 255, 200, 0.05)';
  for (let i = 0; i < 40; i++) g.fillRect(14 + hash(i + 200) * 250, 520 + hash(i + 300) * 440, 3 + hash(i) * 10, 1.5);
  // Rayquaza's marks carved in the stone: gold rings and lines down the tower
  for (const [x, y, r] of [[150, 780, 46], [150, 780, 30]]) { g.strokeStyle = 'rgba(255, 216, 74, 0.22)'; g.lineWidth = r > 40 ? 4 : 2; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); }
  g.fillStyle = 'rgba(255, 216, 74, 0.16)';
  for (const y of [560, 680, 860]) { g.beginPath(); g.ellipse(150, y, 22, 4, 0, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(20, 60, 40, 0.5)'; g.fillRect(132, 760, 36, 40);
  for (let i = 0; i < 8; i++) cloud(g, 10 + i * 40, 500 + (i % 2) * 8, 1.4, 0.75);
  for (let i = 0; i < 6; i++) cloud(g, 30 + i * 50, 520 + (i % 3) * 6, 1.1, 0.5);
  // channel and lane floors
  g.fillStyle = 'rgba(0, 0, 0, 0.3)';
  g.fillRect(268, 150, 20, WH - 150); g.fillRect(12, 290, 28, 160); g.fillRect(240, 290, 28, 160);
  for (const x of LANES) g.fillRect(x - 18, 88, 36, 28);
  g.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  for (let y = 180; y < WH - 40; y += 8) { g.beginPath(); g.moveTo(270, y); g.lineTo(286, y); g.stroke(); }
  // aprons round both pairs of flippers
  for (const [top, dx] of [[444, 6], [892, 0]]) {
    const ap = g.createLinearGradient(0, top, 0, top + 80);
    ap.addColorStop(0, '#1a4a3a'); ap.addColorStop(1, '#0a2a20');
    g.fillStyle = ap;
    g.beginPath(); g.moveTo(34 + dx, top); g.lineTo(95 + dx, top + 33); g.lineTo(104, top + 70); g.lineTo(34 + dx, top + 70); g.fill();
    g.beginPath(); g.moveTo(246 - dx, top); g.lineTo(185 - dx, top + 33); g.lineTo(176, top + 70); g.lineTo(246 - dx, top + 70); g.fill();
  }
  g.fillStyle = 'rgba(0, 0, 0, 0.5)'; g.fillRect(104, 960, 72, 20);
  g.restore();

  // inserts
  for (const x of LANES) lampInsert(g, x, LANE_Y, 6, '#ffe050');
  label(g, 'S', 104, 80, 9, '#fff0b0'); label(g, 'K', 140, 80, 9, '#fff0b0'); label(g, 'Y', 176, 80, 9, '#fff0b0');
  MULT.forEach((x, i) => { lampInsert(g, x, MULT_Y, 7, '#ff9a30'); label(g, `${i + 2}×`, x, MULT_Y, 8, '#ffe0b0'); });
  [108, 124, 140, 156, 172].forEach((x, i) => { lampInsert(g, x, 400, 6, '#60ffa0'); label(g, `${i + 1}`, x, 400, 8, '#d8ffe8'); });
  label(g, 'FLOOR', 140, 416, 8, '#c8ffe0');
  for (let i = 0; i < 2; i++) arrowInsert(g, ASCEND.x, ASCEND.y + 26 + i * 12, 7, -Math.PI / 2, '#ffd84a');
  label(g, 'ASCEND', ASCEND.x, ASCEND.y + 56, 8, '#fff0a0');
  for (let i = 0; i < 3; i++) arrowInsert(g, 216, 690 - i * 14, 7, -Math.PI / 2, '#60e0ff');
  label(g, 'SKY LIFT', 216, 708, 8, '#b0f0ff');
  arrowInsert(g, 26, 470, 6, -Math.PI / 2, '#80ff90'); arrowInsert(g, 254, 470, 6, -Math.PI / 2, '#80ff90');
  for (const x of [23, 257]) { lampInsert(g, x, 912, 5, '#ffe050'); label(g, 'KICK', x, 942, 8, '#fff2a0', x < 140 ? -Math.PI / 2 : Math.PI / 2); }
  lampInsert(g, 140, 944, 7, '#ff5050'); label(g, 'SAVE', 140, 958, 8, '#ffb0b0');
  label(g, 'GUST', 140, 266, 8, '#e0f4ff');
  label(g, 'SKY PILLAR', 64, 970, 9, '#ffd84a'); label(g, 'RAYQUAZA', 216, 970, 9, '#ffd84a');
  label(g, 'LAUNCH', 278, 880, 8, '#ffd84a', -Math.PI / 2);
  // the ascend hole, a gold ring; Trapinch's sand pits; the cloud bumpers' bases
  g.fillStyle = '#b8862a'; g.beginPath(); g.arc(ASCEND.x, ASCEND.y, 13, 0, TAU); g.fill();
  g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(ASCEND.x, ASCEND.y, 13, Math.PI * 1.1, Math.PI * 1.7); g.lineTo(ASCEND.x, ASCEND.y); g.fill();
  g.fillStyle = '#05100a'; g.beginPath(); g.arc(ASCEND.x, ASCEND.y, 9.5, 0, TAU); g.fill();
  for (const x of TRAP) { g.fillStyle = '#c8a050'; g.beginPath(); g.ellipse(x, TRAP_Y + 3, 12, 4.5, 0, 0, TAU); g.fill(); g.fillStyle = '#8a6a30'; g.beginPath(); g.ellipse(x, TRAP_Y + 3, 6, 2, 0, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.beginPath(); g.ellipse(62, 700, 22, 6, 0, 0, TAU); g.fill();
  for (const p of [...CLOUDS, LOW]) {
    g.fillStyle = '#0a1a14'; g.beginPath(); g.arc(p.x, p.y + 2, BR + 3, 0, TAU); g.fill();
    g.fillStyle = '#f4f8ff'; g.beginPath(); g.arc(p.x, p.y, BR + 2, 0, TAU); g.fill();
    g.fillStyle = '#8ac8e8'; g.beginPath(); g.arc(p.x, p.y, BR - 1, 0, TAU); g.fill();
  }
  slingArt(g, SLINGS, '#2a9a6a', '#0a3a24');
  rails(g, WALLS, ['#0e2a20', '#b8c8c0', '#ffffff']);
  g.strokeStyle = '#ffd84a'; g.lineWidth = 1.5;
  g.beginPath();
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; g.lineTo(ARCH.x + Math.cos(a) * (ARCH.rx - 5), ARCH.y + Math.sin(a) * (ARCH.ry - 5)); }
  g.stroke();
  for (const s of [[288, 150, 262, 176], ...DEFLECTS]) gateArt(g, s);
  for (const x of [86, 122, 158, 194]) for (const y of [88, 116]) {
    g.fillStyle = '#2ab070'; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill();
    g.fillStyle = '#d0ffe0'; g.beginPath(); g.arc(x - 1, y - 1, 1.2, 0, TAU); g.fill();
  }
  for (const x of [12, 40]) { g.fillStyle = '#b8c8c0'; g.beginPath(); g.arc(x, SPIN_Y, 2.5, 0, TAU); g.fill(); }
  for (const f of FLIPPERS) { g.fillStyle = '#0a2a20'; g.beginPath(); g.arc(f.x, f.y, 9, 0, TAU); g.fill(); }
  g.fillStyle = '#1a2a26'; g.fillRect(268, 954, 20, 26);
}
function liftArt(g) {
  rampArt(g, LIFT, ['rgba(220, 255, 240, 0.5)', 'rgba(60, 200, 150, 0.5)']);
  g.fillStyle = '#ffd84a'; g.strokeStyle = '#3a2a08'; g.lineWidth = 1;
  g.beginPath(); g.rect(196, 648, 40, 12); g.fill(); g.stroke();
  g.font = '800 8px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2a3a10';
  g.fillText('SKY LIFT', 216, 654.5);
}
const BALL = {
  key: 'master',
  paint(g) {
    g.fillStyle = '#7a3ab8'; g.fillRect(-8, -8, 16, 8);
    g.fillStyle = '#f4f4f8'; g.fillRect(-8, 0, 16, 8);
    g.fillStyle = '#e8509a'; for (const x of [-4.6, 4.6]) { g.beginPath(); g.arc(x, -4, 2, 0, TAU); g.fill(); }
    g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.moveTo(-1.8, -2.4); g.lineTo(-1.8, -6); g.lineTo(0, -4); g.lineTo(1.8, -6); g.lineTo(1.8, -2.4); g.stroke();
    g.fillStyle = '#202028'; g.fillRect(-8, -1.1, 16, 2.2);
    g.beginPath(); g.arc(0, 0, 2.6, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 1.5, 0, TAU); g.fill();
  },
};

export const TABLE = {
  id: 'skypillar', title: 'Rayquaza\'s Sky Pillar Pinball', colour: '#30c070', W, H, worldH: WH,
  grav: 600, maxV: 1500, launch: 1.62, dmd: '#7affb0', bezel: '#ffd84a',
  lane: { x: 278, y: 946, top: 144, wall: 268, gate: [288, 150, 262, 176] },
  flippers: FLIPPERS, walls: WALLS, slings: SLINGS, ball: BALL,
  flip: { edge: '#0e3a2a', face: '#7ae0b0', rubber: '#ffd84a', pivot: '#ffd84a' },
  art: tableArt,
  intro: 'Climb the Sky Pillar! Flip with ◀ ▶ or the screen\'s halves.',
  go: 'LAUNCH up the long lane, then shoot the SKY LIFT to light ASCEND.',
  sounds: ['fx-zap', 'hit-weak', 'thunder', 'catch-success', 'run-away', 'ball-throw', 'coins'],
  help: [
    ['◀ ▶ flip every flipper on that side (or tap a half).', 'The table is two screens tall: the view follows the ball from the tower\'s foot up into the sky.'],
    ['Shoot the SKY LIFT ramp to light ASCEND,', 'then sink ASCEND at the top to climb a floor of the Sky Pillar. Each floor is worth more.'],
    ['On floor 5, ASCEND wakes RAYQUAZA.', `Hit it ${NEED} times as it circles before it flies off: catch it for 3-ball Dragon Ascent!`],
    ['Light S-K-Y for a bigger bonus; flipping moves the lit lanes.', 'Mind the gusts across the clouds: they push the ball sideways.'],
    ['Knock down the three Trapinch to light both KICKBACKs.', '3 balls, each with a ball saver. Catching Rayquaza gives an extra ball.'],
  ],
  make(t) {
    const api = t.api;
    let floor = 1, cycle = 0, ascendLit = false, ray = null, caught = 0, extraGiven = false;
    let lanes = [false, false, false], traps = [true, true, true], trapBack = 0, evo = 0, kick = false;
    let wind = { dir: 1, on: false, t: 3 }, spinA = 0, spinV = 0;
    const lit = { bump: [0, 0, 0, 0] };
    let bonus = { floors: 0, lifts: 0, targets: 0, spins: 0, lanes: 0 };
    const val = (n) => Math.round(n * (1 + (floor - 1) * 0.5) * (1 + cycle) / 10) * 10;

    const climb = () => {
      if (floor < 5) {
        floor++; bonus.floors++; t.stat('floor');
        const pts = val(2500); t.add(pts); t.sound('stat-up');
        t.shout(`FLOOR ${floor}!`, '#80ffb0'); t.say(`FLOOR ${floor} +${pts}`, 2);
        api.say(`Climbed to floor ${floor}! ${floor === 5 ? 'The top: sink ASCEND again to wake Rayquaza!' : 'Everything is worth more up here.'}`);
        t.boom(ASCEND.x, ASCEND.y, '#80ffb0', 18);
      } else startRay();
    };
    const startRay = () => {
      ray = { a: Math.PI, hits: 0, t: RAY_TIME, wobble: 0, cool: 0, appear: 0.8, x: RAY.x - RAY.rx, y: RAY.y, dir: 1 };
      t.stat('rayquaza'); t.sound('thunder', 'ball-throw');
      t.shout('RAYQUAZA!', '#ffd84a');
      api.say(`Rayquaza appeared over the Sky Pillar! Hit it ${NEED} times in ${RAY_TIME} seconds!`);
    };
    const hitRay = (n) => {
      if (!ray) return;
      ray.hits += n; ray.wobble = 0.3; t.add(val(1000)); t.sound('hit-weak', 'plink-2');
      t.boom(ray.x, ray.y, '#ffd84a', 10, 0.5);
      if (ray.hits < NEED) { t.say(`RAYQUAZA ${ray.hits}/${NEED}`, 1.4); return; }
      caught++; t.stat('caught');
      const pts = 50000 * (1 + cycle); t.add(pts);
      t.sound('catch-success', 'stat-up');
      t.shout('GOTCHA! RAYQUAZA', '#ffe060');
      api.say(`Gotcha! Rayquaza was caught! +${pts.toLocaleString()} Dragon Ascent: the Sky Lift scores Jackpots!`);
      t.boom(ray.x, ray.y, '#ffe060', 30, 1.4);
      ray = null; floor = 1; cycle++; ascendLit = false;
      t.startMulti(2); t.stat('multiball');
      if (!extraGiven) { extraGiven = true; t.extraBall('Rayquaza caught: an extra ball!'); }
    };
    const sink = () => {
      t.stat('ascend');
      if (ray) { hitRay(2); t.say('ASCEND ×2', 1.2); return; }
      if (ascendLit) { ascendLit = false; climb(); }
      else { t.add(val(500)); t.say('SKY LIFT LIGHTS ASCEND', 1.8); }
    };
    const lifted = () => {
      bonus.lifts++; t.stat('lift');
      if (ray) hitRay(1);
      if (t.multi) {
        const pts = val(10000); t.add(pts); t.shout('JACKPOT!', '#ff70e0'); t.sound('coins', 'stat-up');
        t.boom(150, 300, '#ff70e0', 24, 1.2); api.say(`Jackpot! +${pts.toLocaleString()}`); t.stat('jackpot');
        return;
      }
      t.add(val(1000)); t.sound('fx-ding', 'plink-2');
      if (!ascendLit && !ray) { ascendLit = true; t.say('ASCEND IS LIT!', 2); api.say('The Sky Lift lit ASCEND: sink it at the top-left!'); }
      else t.say(`SKY LIFT ${val(1000)}`, 1.4);
    };

    return {
      newBall() {
        lanes = [false, false, false]; ascendLit = false;
        bonus = { floors: 0, lifts: 0, targets: 0, spins: 0, lanes: 0 };
      },
      press(s) { if (s === 'l') lanes.push(lanes.shift()); else lanes.unshift(lanes.pop()); },
      ball(b, h, py) {
        if (b.lane) return;
        if (b.vy > 0) for (const d of DEFLECTS) if (side(b, d) * (d[0] < 140 ? 1 : -1) < 0) hitSeg(b, ...d, 0.2);
        const clouds = ray ? [LOW] : [...CLOUDS, LOW];
        clouds.forEach((p) => {
          const i = p === LOW ? 3 : CLOUDS.indexOf(p);
          if (!bump(b, p.x, p.y, BR, 300)) return;
          if (lit.bump[i] < 0.05) { t.add(val(100)); t.sound(i % 2 ? 'plink-2' : 'plink-1'); t.stat('bumper'); t.boom(b.x, b.y, '#e0f4ff', 5, 0.2); }
          lit.bump[i] = 0.14;
        });
        if (ray && ray.appear <= 0 && bump(b, ray.x, ray.y, 16, 240) && ray.cool <= 0) { ray.cool = 0.25; hitRay(1); }
        traps.forEach((up, i) => {
          if (!up || trapBack) return;
          if (!hitSeg(b, TRAP[i] - 10, TRAP_Y, TRAP[i] + 10, TRAP_Y, 0.5)) return;
          traps[i] = false; bonus.targets++; t.add(val(250)); t.sound('hit-weak', 'plink-2'); t.stat('trapinch');
          t.boom(TRAP[i], TRAP_Y - 8, '#e8c070', 8, 0.3);
          if (traps.some(Boolean)) return;
          trapBack = 1.4; kick = true; evo = Math.min(2, evo + 1);
          if (evo === 2) { t.add(val(10000)); t.shout('FLYGON!', '#80ff90'); api.say('Trapinch evolved all the way into Flygon! Both kickbacks are lit.'); evo = 0; }
          else { t.add(val(1000)); t.say(`${EVO[evo].toUpperCase()}! KICKBACK LIT`, 2.2); api.say(`Trapinch bank down: it evolved into ${EVO[evo] === 'vibrava' ? 'Vibrava' : 'Trapinch'}, and the kickbacks are lit.`); }
          t.sound('stat-up');
        });
        const cross = (y) => (py < y) !== (b.y < y);
        if (cross(LANE_Y)) LANES.forEach((x, i) => {
          if (Math.abs(b.x - x) > 14) return;
          t.stat('lanes');
          if (!lanes[i]) { lanes[i] = true; t.add(val(500)); t.sound('fx-ding', 'plink-2'); bonus.lanes++; } else t.add(val(100));
          if (lanes.every(Boolean)) {
            lanes = [false, false, false];
            if (t.mult < 5) { t.mult++; t.shout(`BONUS ${t.mult}×`, '#ffb050'); } else { t.add(val(5000)); t.shout('BONUS MAX', '#ffb050'); }
            t.sound('stat-up');
          }
        });
        if (b.x < 40 && cross(SPIN_Y)) spinV = Math.min(24, Math.abs(b.vy) / 30);
        if (wind.on && b.x > WIND.x0 && b.x < WIND.x1 && b.y > WIND.y0 && b.y < WIND.y1) { b.vx += wind.dir * 260 * h; b.windy = true; }
        else if (b.windy && b.y > WIND.y1) { b.windy = false; t.stat('wind'); }
        if (b.x > 200 && b.x < 232 && b.y > 628 && b.y < 652 && b.vy < -200) t.ride(b, LIFT, 600, lifted);
        if (Math.hypot(b.x - ASCEND.x, b.y - ASCEND.y) < 9 && Math.hypot(b.vx, b.vy) < 650) {
          t.hold(b, ASCEND.x, ASCEND.y, 1.1, () => t.spawn(ASCEND.x + 2, ASCEND.y + 10, 150 + Math.random() * 60, 120));
          t.sound('fx-bloop', 'select');
          sink();
        }
        if (kick && b.y > 900 && b.y < 960 && (b.x < 34 || b.x > 246)) {
          b.vy = -1000; b.vx = 0; kick = false; t.stat('kickback');
          t.sound('fx-zap', 'plink-2'); t.shout('KICKBACK!', '#80ff90'); t.boom(b.x, b.y, '#80ff90', 20, 1);
          api.say('Flygon\'s kickback flew it back up!');
        }
      },
      tick(dt) {
        if ((wind.t -= dt) <= 0) {
          wind.on = !wind.on; wind.t = wind.on ? 3 + Math.random() * 2 : 2.5 + Math.random() * 2.5;
          if (wind.on) { wind.dir = Math.random() < 0.5 ? -1 : 1; t.sound('fx-whoosh', 'select'); }
        }
        if (trapBack && (trapBack = Math.max(0, trapBack - dt)) === 0) traps = [true, true, true];
        if (spinV > 0.1) {
          const before = Math.floor(spinA / Math.PI);
          spinA += spinV * TAU * dt; spinV *= Math.exp(-dt * 1.6);
          const turns = Math.floor(spinA / Math.PI) - before;
          if (turns > 0) { bonus.spins += turns; t.add(val(50) * turns); t.stat('spins', turns); t.sound('fx-tick', 'select'); }
        } else spinV = 0;
        if (ray) {
          ray.appear = Math.max(0, ray.appear - dt); ray.wobble = Math.max(0, ray.wobble - dt); ray.cool = Math.max(0, ray.cool - dt);
          ray.a += dt * (1.1 + ray.hits * 0.06);
          const nx = RAY.x + Math.cos(ray.a) * RAY.rx, ny = RAY.y + Math.sin(ray.a) * RAY.ry;
          if (Math.abs(nx - ray.x) > 0.01) ray.dir = nx > ray.x ? 1 : -1;
          ray.x = nx; ray.y = ny;
          if ((ray.t -= dt) <= 0) {
            ray = null; ascendLit = false; t.sound('run-away', 'cancel'); t.say('RAYQUAZA FLEW OFF', 2.2);
            api.say('Rayquaza flew off! Light ASCEND with the Sky Lift and sink it to call it back.');
          }
        }
        lit.bump.forEach((v, i) => { lit.bump[i] = Math.max(0, v - dt); });
      },
      under(g, now) {
        const blink = (r) => t.blink(now, r);
        LANES.forEach((x, i) => { if (lanes[i]) t.glow(g, x, LANE_Y, 6, '#ffe860'); });
        MULT.forEach((x, i) => { if (t.mult >= i + 2) t.glow(g, x, MULT_Y, 7, '#ff9a30', 0.75); });
        [108, 124, 140, 156, 172].forEach((x, i) => { if (floor > i || (floor === i + 1 && ascendLit && blink(200))) t.glow(g, x, 400, 6, floor > i + 1 ? '#40e080' : '#a0ffc8', floor > i ? 0.85 : 0.5); });
        if (ascendLit && blink(180)) { g.fillStyle = '#ffd84a'; for (let i = 0; i < 2; i++) { arrowPath(g, ASCEND.x, ASCEND.y + 26 + i * 12, 7, -Math.PI / 2); g.fill(); } }
        for (let i = 0; i < 3; i++) if ((t.multi && blink(140)) || (!t.multi && !ascendLit && !ray && blink(260 + i * 40))) { g.fillStyle = t.multi ? '#ff70e0' : '#60e0ff'; arrowPath(g, 216, 690 - i * 14, 7, -Math.PI / 2); g.fill(); }
        if (kick && blink(220)) for (const x of [23, 257]) t.glow(g, x, 912, 5, '#ffe860');
        if (t.save > 0 && (t.save > 3 || blink(120))) t.glow(g, 140, 944, 7, '#ff5050');
        if (ray && blink(160)) { g.fillStyle = '#80ff90'; arrowPath(g, 26, 470, 6, -Math.PI / 2); g.fill(); arrowPath(g, 254, 470, 6, -Math.PI / 2); g.fill(); }
        // the gusts: streaks blowing across the clouds
        if (wind.on) {
          g.strokeStyle = 'rgba(255, 255, 255, 0.55)'; g.lineWidth = 1.2; g.lineCap = 'round';
          for (let i = 0; i < 9; i++) {
            const span = WIND.x1 - WIND.x0, x = WIND.x0 + ((((now * 0.22 * wind.dir + i * 61) % span) + span) % span), y = WIND.y0 + 8 + (i * 37) % (WIND.y1 - WIND.y0 - 16);
            g.beginPath(); g.moveTo(x, y); g.lineTo(x - wind.dir * 16, y); g.stroke();
          }
          g.fillStyle = '#e0f4ff'; arrowPath(g, 140 + wind.dir * 22, 266, 5, wind.dir > 0 ? 0 : Math.PI); g.fill();
        }
        // the floor's Pokémon on the clouds, or Rayquaza circling them
        if (!ray) CLOUDS.forEach((p, i) => {
          if (lit.bump[i]) t.glow(g, p.x, p.y, BR + 5, '#ffffff', 0.8);
          drawMon(g, FLOORS[floor - 1], p.x, p.y + 13 - (lit.bump[i] ? 2 : 0), 26);
        });
        if (lit.bump[3]) t.glow(g, LOW.x, LOW.y, BR + 5, '#ffffff', 0.8);
        drawMon(g, 'swablu', LOW.x, LOW.y + 12 - (lit.bump[3] ? 2 : 0), 24);
        traps.forEach((up, i) => {
          if (up && !trapBack) drawMon(g, 'trapinch', TRAP[i], TRAP_Y + 4, 22);
          else if (trapBack && trapBack < 0.4) drawMon(g, 'trapinch', TRAP[i], TRAP_Y + 4 + trapBack * 40, 22);
        });
        drawMon(g, EVO[evo], 62, 702 + (kick ? -Math.abs(Math.sin(now / 200)) * 3 : 0), 32);
        const sh = Math.abs(Math.cos(spinA)) * 6 + 0.8;
        g.fillStyle = Math.cos(spinA) > 0 ? '#e8f0ec' : '#ffd84a'; g.fillRect(14, SPIN_Y - sh / 2, 24, sh);
        g.strokeStyle = '#2a3a30'; g.lineWidth = 0.8; g.strokeRect(14, SPIN_Y - sh / 2, 24, sh);
        if (ray) {
          const k = 1 - ray.appear / 0.8;
          t.glow(g, ray.x, ray.y, 26 * k, 'rgba(255, 230, 120, 0.25)');
          drawMon(g, 'rayquaza', ray.x + (ray.wobble ? Math.sin(now / 20) * 3 : 0), ray.y + 24, 50 * k, ray.dir > 0);
          for (let i = 0; i < NEED; i++) {
            const a = -Math.PI / 2 + i / NEED * TAU;
            t.glow(g, RAY.x + Math.cos(a) * 26, RAY.y + Math.sin(a) * 18, 2.6, i < ray.hits ? '#ffe060' : 'rgba(255, 255, 255, 0.35)');
          }
          g.fillStyle = 'rgba(0, 0, 0, 0.55)'; g.fillRect(RAY.x - 30, RAY.y + 28, 60, 5);
          g.fillStyle = ray.t < 6 && blink(120) ? '#ff5050' : '#80ff90';
          g.fillRect(RAY.x - 30, RAY.y + 28, 60 * Math.max(0, ray.t) / RAY_TIME, 5);
        }
      },
      over(g) { stamp(g, 'sky-lift', 0, 0, W, WH, liftArt); },
      screen(g) {
        // where the view sits on the tall table
        const top = 40, len = H - 48, k = H / WH;
        g.fillStyle = 'rgba(0, 0, 0, 0.45)'; g.fillRect(1, top, 4, len);
        g.fillStyle = 'rgba(255, 216, 74, 0.85)'; g.fillRect(1, top + t.cam() / WH * len, 4, len * k);
        for (const b of t.field) if (!b.gone) { g.fillStyle = '#e8a0ff'; g.fillRect(0, top + b.y / WH * len - 1, 6, 2); }
      },
      dmd(now) {
        if (ray) return `RAYQUAZA ${ray.hits}/${NEED} ${Math.ceil(ray.t)}S`;
        const lines = [`FLOOR ${floor}/5  BALL ${t.ball}`, ascendLit ? 'ASCEND IS LIT' : floor === 5 ? 'LIFT · ASCEND: RAYQUAZA' : 'SKY LIFT LIGHTS ASCEND',
          kick ? 'KICKBACK LIT' : `TRAPINCH ${traps.filter(d => !d).length}/3`, `BONUS ${t.mult}X`, t.multi ? 'JACKPOT AT SKY LIFT' : `RAYQUAZA CAUGHT ${caught}`];
        return lines[Math.floor(now / 2200) % lines.length];
      },
      lost() { if (ray && t.inPlay() === 0) { ray = null; t.say('RAYQUAZA FLEW OFF', 2); } },
      bonus: () => bonus.floors * 2000 + bonus.lifts * 1000 + bonus.targets * 250 + bonus.spins * 25 + bonus.lanes * 200,
      overLine: () => caught ? `Rayquaza caught ×${caught}!` : `Reached floor ${floor} of the Sky Pillar!`,
    };
  },
};

export const openRayquaza = (onClose) => openTable(TABLE, onClose);
