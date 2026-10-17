/* pinball-lapras.js  -  Lapras's Lagoon Pinball, a home arcade table on js/pinball-kit.js (2026-10-17, the user's ask:
   four more tables after Pokémon Pinball, each completely different). A lagoon at sunset over a deep reef, and an
   underwater feel: lower gravity and drag, so the ball floats. No ramps: an open middle round a Whirlpool that pulls the
   ball in, spins it two turns and flings it back out. Staryu pop bumpers spin when struck; a Magikarp captive ball sits
   at the mouth of a short lane on the right, and knocking it up to the top is a Splash (six evolve it: Gyarados's
   Rampage, Staryu and the whirlpool 5× for 20 s). Three Shellder standups make a pearl (four pearls, an extra ball),
   W-A-V-E rollovers the flippers turn raise the bonus, and three left orbits start SURF: a wave rises over the drain,
   Lapras rides it, a second ball joins and the whirlpool scores Jackpots. Lapras herself rises as a post between the
   flippers while the ball saver runs. */

import { openTable, arc, bump, hitSeg, side, rails, slingArt, gateArt, lampInsert, arrowInsert, arrowPath, label, hash, drawMon, R, TAU } from './pinball-kit.js';
import { playCry } from './audio.js';

const W = 300, H = 520;
const ARCH = { x: 150, y: 136, rx: 138, ry: 88 };
const LANES = [92, 124, 156, 188], LANE_Y = 98, LETTERS = ['W', 'A', 'V', 'E'];
const STARS = [{ x: 104, y: 170 }, { x: 176, y: 170 }, { x: 140, y: 212 }], SR = 14;
const POOL = { x: 140, y: 300, r: 46 };
const KARP = { x: 253, rest: 258, top: 206, mouth: 272 };
const SHELL = [0, 1, 2].map(i => { const k0 = i / 3 + 0.03, k1 = (i + 1) / 3 - 0.03; return [66 + 14 * k0, 298 + 50 * k0, 66 + 14 * k1, 298 + 50 * k1]; });
const SHELL_N = [0.963, -0.27];   // the bank's face, toward the right flipper
const SLINGS = [{ s: 'l', a: [56, 370], b: [82, 432], c: [56, 416] }, { s: 'r', a: [224, 370], b: [198, 432], c: [224, 416] }];
const DEFLECTS = [[12, 262, 44, 290], [268, 292, 240, 318]];   // one-way: a ball coming down is turned into the field
const MULT = [104, 128, 152, 176], MULT_Y = 364;
const POST = { x: 140, y: 499 };
const SAVE_EXTRAS = 2, RAMPAGE = 20, SURF = 15;

const WALLS = [...arc(ARCH.x, ARCH.y, ARCH.rx, ARCH.ry, Math.PI, TAU, 28),
  [12, 136, 12, 560], [288, 136, 288, 560], [268, 166, 268, 560],
  [34, 360, 34, 432], [34, 432, 95, 465], [246, 360, 246, 432], [246, 432, 185, 465],
  ...[76, 108, 140, 172, 204].map(x => [x, 84, x, 112]), [38, 160, 38, 250],
  [238, 198, 238, KARP.mouth], [238, 204, 268, 190],
  ...SLINGS.flatMap(({ a, b, c }) => [[...a, ...c], [...c, ...b]])];

function playfieldPath(g) {
  g.beginPath(); g.moveTo(12, 560);
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; g.lineTo(ARCH.x + Math.cos(a) * ARCH.rx, ARCH.y + Math.sin(a) * ARCH.ry); }
  g.lineTo(288, 560); g.closePath();
}
function coral(g, x, y, s, colour, seed) {
  g.strokeStyle = colour; g.lineCap = 'round';
  const branch = (bx, by, a, len, w, n) => {
    const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
    g.lineWidth = w; g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke();
    if (n > 0) { branch(ex, ey, a - 0.45 - hash(seed + n) * 0.3, len * 0.72, w * 0.7, n - 1); branch(ex, ey, a + 0.4 + hash(seed + n + 9) * 0.3, len * 0.7, w * 0.7, n - 1); }
  };
  branch(x, y, -Math.PI / 2, 16 * s, 4 * s, 3);
}

function tableArt(g) {
  g.fillStyle = '#04121e'; g.fillRect(0, 0, W, H);
  const wood = g.createLinearGradient(0, 0, W, 0);
  wood.addColorStop(0, '#0e3a4a'); wood.addColorStop(0.5, '#082430'); wood.addColorStop(1, '#0e3a4a');
  g.fillStyle = wood; g.fillRect(0, 36, W, H - 36);
  g.save(); playfieldPath(g); g.clip();
  // the sunset sky over the water, the sun half sunk on the horizon
  const sky = g.createLinearGradient(0, 40, 0, 150);
  sky.addColorStop(0, '#5a3a9a'); sky.addColorStop(0.45, '#ff7a6a'); sky.addColorStop(1, '#ffc070');
  g.fillStyle = sky; g.fillRect(0, 0, W, 150);
  g.fillStyle = '#fff0a0'; g.beginPath(); g.arc(150, 150, 30, Math.PI, 0); g.fill();
  g.fillStyle = 'rgba(255, 240, 160, 0.35)'; g.beginPath(); g.arc(150, 150, 40, Math.PI, 0); g.fill();
  const sea = g.createLinearGradient(0, 150, 0, H);
  sea.addColorStop(0, '#2aa0d8'); sea.addColorStop(0.3, '#1670b0'); sea.addColorStop(0.65, '#0c4486'); sea.addColorStop(1, '#062456');
  g.fillStyle = sea; g.fillRect(0, 150, W, H);
  for (let i = 0; i < 7; i++) {   // the sun's path on the water, then light shafts down into the deep
    g.fillStyle = `rgba(255, 220, 140, ${0.5 - i * 0.06})`; g.fillRect(150 - 26 + i * 3, 153 + i * 4, 52 - i * 6, 1.6);
  }
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(200, 240, 255, ${0.04 + (i % 2) * 0.03})`;
    g.beginPath(); g.moveTo(60 + i * 36, 152); g.lineTo(20 + i * 60, H); g.lineTo(44 + i * 60, H); g.lineTo(74 + i * 36, 152); g.fill();
  }
  g.strokeStyle = 'rgba(255, 255, 255, 0.5)'; g.lineWidth = 1.2;   // the surface's ripple line
  g.beginPath(); for (let x = 12; x <= 288; x += 4) g.lineTo(x, 151 + Math.sin(x * 0.25) * 1.4); g.stroke();
  // the sand and the reef at the foot
  const sand = g.createLinearGradient(0, 440, 0, H);
  sand.addColorStop(0, 'rgba(200, 168, 104, 0)'); sand.addColorStop(0.4, '#b89458'); sand.addColorStop(1, '#8a6a38');
  g.fillStyle = sand; g.fillRect(0, 440, W, H);
  coral(g, 26, 360, 1.1, '#ff6a7a', 3); coral(g, 260, 356, 1, '#ff9a4a', 8); coral(g, 108, 520, 0.9, '#ff7ab0', 5); coral(g, 176, 520, 0.8, '#ffb050', 2);
  g.strokeStyle = 'rgba(80, 200, 120, 0.55)'; g.lineWidth = 2.5;
  for (const x of [48, 70, 214, 234]) { g.beginPath(); g.moveTo(x, 360); for (let y = 360; y > 300; y -= 6) g.lineTo(x + Math.sin(y * 0.18 + x) * 4, y); g.stroke(); }
  for (let i = 0; i < 70; i++) {   // bubbles
    const x = 16 + hash(i) * 250, y = 160 + hash(i + 40) * 330, r = 0.8 + hash(i + 3) * 2.2;
    g.strokeStyle = `rgba(220, 250, 255, ${0.2 + hash(i + 5) * 0.35})`; g.lineWidth = 0.7;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  }
  // the whirlpool's basin: dark water in rings, grooves spiralling to the eye
  const basin = g.createRadialGradient(POOL.x, POOL.y, 4, POOL.x, POOL.y, POOL.r + 6);
  basin.addColorStop(0, '#020c24'); basin.addColorStop(0.6, '#0a3270'); basin.addColorStop(1, 'rgba(40, 140, 220, 0.2)');
  g.fillStyle = basin; g.beginPath(); g.arc(POOL.x, POOL.y, POOL.r + 6, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(160, 230, 255, 0.18)'; g.lineWidth = 1.2;
  for (let k = 0; k < 5; k++) { g.beginPath(); for (let r = 4; r <= POOL.r; r += 2) { const a = k * TAU / 5 + r * 0.11; g.lineTo(POOL.x + Math.cos(a) * r, POOL.y + Math.sin(a) * r); } g.stroke(); }
  g.strokeStyle = 'rgba(255, 255, 255, 0.35)'; g.setLineDash([3, 4]); g.beginPath(); g.arc(POOL.x, POOL.y, POOL.r + 4, 0, TAU); g.stroke(); g.setLineDash([]);
  // floors of the lanes: the plunger, the left orbit, Magikarp's lane, the top lanes
  g.fillStyle = 'rgba(0, 0, 0, 0.3)';
  g.fillRect(268, 150, 20, 410); g.fillRect(12, 160, 26, 90); g.fillRect(238, 198, 30, KARP.mouth - 198);
  for (const x of LANES) g.fillRect(x - 16, 84, 32, 28);
  g.strokeStyle = 'rgba(255, 255, 255, 0.07)'; g.lineWidth = 1;
  for (let y = 180; y < 480; y += 8) { g.beginPath(); g.moveTo(270, y); g.lineTo(286, y); g.stroke(); }
  const apron = g.createLinearGradient(0, 430, 0, H);
  apron.addColorStop(0, '#0a3a5a'); apron.addColorStop(1, '#041a2e');
  g.fillStyle = apron;
  g.beginPath(); g.moveTo(34, 432); g.lineTo(95, 465); g.lineTo(104, 520); g.lineTo(34, 520); g.fill();
  g.beginPath(); g.moveTo(246, 432); g.lineTo(185, 465); g.lineTo(176, 520); g.lineTo(246, 520); g.fill();
  g.fillStyle = 'rgba(0, 0, 0, 0.45)'; g.fillRect(104, 504, 72, 16);
  g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.fillRect(12, 440, 22, 80); g.fillRect(246, 440, 22, 80);
  g.restore();

  // inserts: dim lamps and arrows, the lit ones drawn over them each frame
  LANES.forEach((x, i) => { lampInsert(g, x, LANE_Y, 6, '#7af0ff'); label(g, LETTERS[i], x, 76, 9, '#c8f8ff'); });
  MULT.forEach((x, i) => { lampInsert(g, x, MULT_Y, 7.5, '#ff9a6a'); label(g, `${i + 2}×`, x, MULT_Y, 8, '#ffe0d0'); });
  label(g, 'BONUS', 140, MULT_Y + 14, 8, '#ffcfb0');
  for (let i = 0; i < 3; i++) arrowInsert(g, 25, 238 - i * 14, 6, -Math.PI / 2, '#7af0ff');
  label(g, 'SURF', 25, 262, 8, '#c8f8ff', -Math.PI / 2);
  for (let i = 0; i < 6; i++) lampInsert(g, 230, 260 - i * 10, 3.5, '#ffa040');
  label(g, 'SPLASH', 253, 282, 8, '#ffd0a0');
  for (let i = 0; i < 4; i++) lampInsert(g, 52, 304 + i * 11, 3.5, '#f0e8ff');
  label(g, 'PEARLS', 30, 322, 8, '#f0e8ff', -Math.PI / 2);
  label(g, 'WHIRLPOOL', POOL.x, POOL.y + POOL.r + 2, 8, '#a8e8ff');
  for (const x of [23, 45, 235, 257]) lampInsert(g, x, 400, 4.5, x === 23 || x === 257 ? '#ff6a6a' : '#6affc0');
  lampInsert(g, 140, 476, 6, '#ff6a6a'); label(g, 'SAVE', 140, 488, 8, '#ffc0c0');
  label(g, 'LAPRAS\'S', 64, 506, 9, '#7af0ff'); label(g, 'LAGOON', 216, 506, 9, '#7af0ff');
  label(g, 'LAUNCH', 278, 420, 8, '#ffd84a', -Math.PI / 2);
  // the Staryu bumpers' bases: gold rings on the sand-coloured plastic
  for (const p of STARS) {
    g.fillStyle = '#04121e'; g.beginPath(); g.arc(p.x, p.y + 2, SR + 3, 0, TAU); g.fill();
    g.fillStyle = '#ffd88a'; g.beginPath(); g.arc(p.x, p.y, SR + 2, 0, TAU); g.fill();
    g.fillStyle = '#7a3a8a'; g.beginPath(); g.arc(p.x, p.y, SR - 1, 0, TAU); g.fill();
  }
  slingArt(g, SLINGS, '#ff6a5a', '#5a1010');
  rails(g, WALLS, ['#06202e', '#a8c8d8', '#ffffff']);
  g.strokeStyle = '#7af0ff'; g.lineWidth = 1.5;   // a sea-glass inner rail along the arch
  g.beginPath();
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; g.lineTo(ARCH.x + Math.cos(a) * (ARCH.rx - 5), ARCH.y + Math.sin(a) * (ARCH.ry - 5)); }
  g.stroke();
  for (const d of [[288, 146, 262, 172], ...DEFLECTS]) gateArt(g, d);
  for (const x of [76, 108, 140, 172, 204]) for (const y of [84, 112]) {
    g.fillStyle = '#ff6a5a'; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill();
    g.fillStyle = '#ffe0d0'; g.beginPath(); g.arc(x - 1, y - 1, 1.2, 0, TAU); g.fill();
  }
  for (const f of [[92, 470], [188, 470]]) { g.fillStyle = '#041a2e'; g.beginPath(); g.arc(f[0], f[1], 9, 0, TAU); g.fill(); }
  g.fillStyle = '#0e2a3a'; g.fillRect(268, 494, 20, 26);
  g.strokeStyle = 'rgba(255, 255, 255, 0.15)'; g.strokeRect(268.5, 494.5, 19, 25);
  g.fillStyle = '#062030'; g.beginPath(); g.arc(POST.x, POST.y + 2, 7, 0, TAU); g.fill();   // the hatch Lapras rises from
  g.strokeStyle = '#7af0ff'; g.lineWidth = 1; g.beginPath(); g.arc(POST.x, POST.y + 2, 7, 0, TAU); g.stroke();
}

/** The Dive Ball: blue over white, pale wave lines across the blue. */
function diveBall(g) {
  g.fillStyle = '#2a6ad8'; g.fillRect(-R, -R, R * 2, R);
  g.fillStyle = '#f4f8ff'; g.fillRect(-R, 0, R * 2, R);
  g.strokeStyle = '#8ae0ff'; g.lineWidth = 1;
  for (const y of [-5.5, -3]) { g.beginPath(); for (let x = -R; x <= R; x += 1) g.lineTo(x, y + Math.sin(x * 0.9) * 0.9); g.stroke(); }
  g.fillStyle = '#202028'; g.fillRect(-R, -1.1, R * 2, 2.2);
  g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.fill();
}

export const TABLE = {
  id: 'lapras', title: 'Lapras\'s Lagoon Pinball', colour: '#3aa0e0', W, H,
  grav: 500, drag: 0.18, launch: 0.94, maxV: 1050,
  walls: WALLS, slings: SLINGS,
  flippers: [{ s: 'l', x: 92, y: 470, len: 38, rest: 0.52, up: -0.5 }, { s: 'r', x: 188, y: 470, len: 38, rest: Math.PI - 0.52, up: Math.PI + 0.5 }],
  ball: { key: 'dive', paint: diveBall },
  flip: { edge: '#0a2a5a', face: '#e8f6ff', rubber: '#ff7a6a', pivot: '#ffd84a' },
  dmd: '#50e8ff', bezel: '#5ad8ff',
  art: tableArt,
  intro: 'Time the LAUNCH, then flip with ◀ ▶ or the screen\'s halves!',
  go: 'Ride the whirlpool, splash Magikarp, and SURF with three left orbits!',
  sounds: ['fx-splash', 'fx-bubble', 'fx-whirr', 'fx-boing', 'hit-weak', 'catch-success', 'thunder', 'run-away'],
  help: [
    ['◀ ▶ flip (or tap the left or right half).', 'LAUNCH (▼ or Space too) fires the plunger: roll through the flashing top lane for a Skill Shot.'],
    ['Ride the WHIRLPOOL in the middle.', 'It pulls the ball in, spins it round and flings it back out. Every turn scores.'],
    ['Knock the Magikarp captive ball up its lane: 6 SPLASHES evolve it.', 'Gyarados\'s Rampage makes the Staryu and the whirlpool worth 5× for 20 seconds.'],
    ['Light all three Shellder for a pearl: 4 pearls are an extra ball.', 'Light W-A-V-E for a bigger bonus (flipping moves the lit lanes).'],
    ['Shoot the left orbit 3 times to SURF:', 'Lapras rides a wave over the drain, a second ball joins and the whirlpool scores Jackpots.'],
  ],
  make: (t) => {
    const lit = { lanes: [false, false, false, false], star: [0, 0, 0], shell: [false, false, false], inl: [0, 0, 0, 0] };
    const spin = [0, 0, 0], spinV = [1.2, -1.2, 1.2];
    const karp = { y: KARP.rest, vy: 0, flop: 0 };
    const whirls = [];
    let skill = 0, skillT = 0, splashes = 0, splashNeed = 6, evos = 0, rampage = 0;
    let pearls = 0, pearlsAll = 0, extras = 0, orbits = 0, surf = 0, surfs = 0, wave = 0, laprasX = -40, post = 0;
    let swirlA = 0, bonus = {};
    const pts = (n) => n * (rampage > 0 ? 5 : 1);

    const swirl = (b) => {
      b.gone = true;
      const dx = b.x - POOL.x, dy = b.y - POOL.y;
      whirls.push({ a: Math.atan2(dy, dx), r: Math.max(8, Math.hypot(dx, dy)), turned: 0, spin: b.spin });
      t.sound('fx-whirr', 'fx-whoosh');
    };
    const fling = (w) => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 560 + Math.random() * 160;
      const b = t.spawn(POOL.x + Math.cos(a) * 12, POOL.y + Math.sin(a) * 12, Math.cos(a) * v, Math.sin(a) * v, w.spin);
      b.calm = 0.9;
      t.stat('swirls'); bonus.swirls++;
      if (surf > 0) {
        const p = 10000 + 2500 * surfs;
        t.add(p); t.shout('JACKPOT!', '#ff80e0'); t.boom(POOL.x, POOL.y, '#ff80e0', 26, 1.3); t.sound('coins', 'stat-up');
        t.api.say(`Whirlpool Jackpot! +${p.toLocaleString()}`); t.stat('jackpots');
      } else { t.add(pts(500)); t.say(rampage > 0 ? 'RAMPAGE SWIRL ×5' : 'WHIRLPOOL 500', 1.3); }
      t.sound('fx-splash', 'fx-pop');
    };
    const splash = () => {
      splashes++; bonus.splashes++; t.stat('splashes'); karp.flop = 0.8;
      t.add(pts(1000)); t.sound('fx-splash', 'plink-2');
      t.boom(KARP.x, KARP.top, '#a8e8ff', 12, 0.4);
      if (splashes < splashNeed) { t.say(`SPLASH ${splashes}/${splashNeed}`, 1.6); return; }
      splashes = 0; splashNeed += 2; evos++; bonus.evos++; rampage = RAMPAGE; t.stat('evolutions');
      t.add(10000 + 5000 * evos);
      t.shout('GYARADOS!', '#ff7070'); t.boom(210, 200, '#ff7070', 30, 1.5); t.sound('thunder', 'stat-up');
      playCry('gyarados');
      t.api.say('Magikarp evolved! Gyarados\'s Rampage: Staryu and the whirlpool score 5× for 20 seconds!');
    };
    const shellHit = (i) => {
      t.add(250); bonus.targets++; t.stat('shellder');
      if (lit.shell[i]) { t.sound('hit-weak', 'plink-1'); return; }
      lit.shell[i] = true; t.sound('fx-ding', 'plink-2');
      if (!lit.shell.every(Boolean)) return;
      lit.shell = [false, false, false]; pearls++; pearlsAll++; bonus.pearls++; t.stat('pearls');
      t.add(2000); t.boom(73, 323, '#f8f0ff', 16, 0.6);
      if (pearls >= 4 && extras < SAVE_EXTRAS) { pearls = 0; extras++; t.stat('extraBalls'); t.extraBall('Four pearls: an extra ball!'); }
      else { if (pearls >= 4) { pearls = 0; t.add(15000); } t.say(`PEARL ${pearls}/4`, 1.8); t.sound('stat-up'); }
    };
    const orbit = () => {
      bonus.orbits++; t.stat('orbits'); t.sound('fx-ding', 'plink-2');
      if (surf > 0) { t.add(2500); t.say('SURF ORBIT 2500', 1.4); return; }
      orbits++; t.add(750);
      if (orbits < 3) { t.say(`SURF ${orbits}/3`, 1.6); return; }
      orbits = 0; surf = SURF; surfs++; wave = 0; laprasX = -40; t.stat('surfs');
      t.shout('SURF!', '#7af0ff'); t.boom(140, 470, '#7af0ff', 30, 1.4);
      playCry('lapras');
      t.startMulti(1, 'SURF! Lapras rides the wave over the drain, and the whirlpool scores Jackpots!');
    };

    return {
      held: () => whirls.length,
      newBall() {
        skill = Math.floor(Math.random() * 4); skillT = 0; lit.lanes = [false, false, false, false];
        surf = 0; rampage = 0;
        bonus = { swirls: 0, splashes: 0, targets: 0, pearls: 0, orbits: 0, evos: 0 };
      },
      launch() { skillT = 5; },
      press(s) { if (s === 'l') lit.lanes.push(lit.lanes.shift()); else lit.lanes.unshift(lit.lanes.pop()); },
      multiEnd() { if (surf > 0) surf = Math.min(surf, 2); },
      ball(b, h, py) {
        if (b === t.field.find(x => !x.gone)) {   // Magikarp's captive ball moves once a substep
          karp.vy += 900 * h; karp.y += karp.vy * h;
          if (karp.y >= KARP.rest) { karp.y = KARP.rest; karp.vy = karp.vy > 40 ? -karp.vy * 0.2 : 0; }
          if (karp.y <= KARP.top) { karp.y = KARP.top; if (karp.vy < 0) { karp.vy = -karp.vy * 0.3; splash(); } }
        }
        if (b.lane) return;
        if (b.vy > 0) for (const d of DEFLECTS) if (side(b, d) * (d[0] < 140 ? 1 : -1) < 0) hitSeg(b, ...d, 0.2);
        {   // the play ball against the captive ball, which only slides up and down its lane
          const dx = b.x - KARP.x, dy = b.y - karp.y, d = Math.hypot(dx, dy);
          if (d < R * 2 && d > 0) {
            const nx = dx / d, ny = dy / d;
            b.x = KARP.x + nx * R * 2; b.y = karp.y + ny * R * 2;
            const vn = b.vx * nx + (b.vy - karp.vy) * ny;
            if (vn < 0) {
              const j = -1.6 * vn / (1 + ny * ny);
              b.vx += j * nx; b.vy += j * ny; karp.vy -= j * ny;
              if (j > 120) { t.add(50); t.stat('karpHits'); t.sound('hit-weak', 'plink-1'); }
            }
          }
        }
        STARS.forEach((p, i) => {
          if (!bump(b, p.x, p.y, SR, 280)) return;
          if (lit.star[i] < 0.05) { t.add(pts(100)); t.stat('staryu'); t.sound(i % 2 ? 'plink-2' : 'plink-1'); t.boom(b.x, b.y, rampage ? '#ff8080' : '#ffe080', 5, 0.2); }
          lit.star[i] = 0.14; spinV[i] = (spinV[i] < 0 ? -1 : 1) * 16;
        });
        SHELL.forEach((s, i) => {
          const c = hitSeg(b, ...s, 0.5);
          if (c && c.vn < -60 && c.ux * SHELL_N[0] + c.uy * SHELL_N[1] > 0.4) shellHit(i);
        });
        if (t.save > 0 && t.launched && post > 0.6) bump(b, POST.x, POST.y, 6, 60, 0.5);
        // the whirlpool: pulls inward and round; the eye takes the ball for a spin
        if (b.calm > 0) b.calm -= h;
        else {
          const dx = POOL.x - b.x, dy = POOL.y - b.y, d = Math.hypot(dx, dy);
          if (d < POOL.r) {
            const ux = dx / d, uy = dy / d, k = 1 - d / POOL.r;
            b.vx += (ux * (160 + 420 * k) + uy * 380 * k) * h;
            b.vy += (uy * (160 + 420 * k) - ux * 380 * k) * h;
            b.inPool = (b.inPool || 0) + h;
            if (d < 16 || b.inPool > 2.5) { b.inPool = 0; swirl(b); return; }
          } else b.inPool = 0;
        }
        const cross = (y) => (py < y) !== (b.y < y);
        if (cross(LANE_Y)) LANES.forEach((x, i) => {
          if (Math.abs(b.x - x) > 13) return;
          if (skillT > 0 && i === skill) { t.add(5000); t.shout('SKILL SHOT!', '#80e0ff'); t.sound('stat-up'); t.boom(x, LANE_Y, '#80e0ff', 20); t.stat('skill'); }
          skillT = 0;
          if (!lit.lanes[i]) { lit.lanes[i] = true; t.add(500); t.sound('fx-ding', 'plink-2'); } else t.add(100);
          t.stat('lanes');
          if (lit.lanes.every(Boolean)) {
            lit.lanes = [false, false, false, false];
            if (t.mult < 5) { t.mult++; t.shout(`BONUS ${t.mult}×`, '#ffb070'); } else { t.add(5000); t.shout('BONUS MAX', '#ffb070'); }
            t.sound('stat-up');
          }
        });
        if (cross(400) && b.vy > 0) {
          const j = b.x < 34 ? 0 : b.x < 56 ? 1 : b.x > 246 ? 3 : b.x > 224 ? 2 : -1;
          if (j >= 0) { lit.inl[j] = 1.2; if (j === 1 || j === 2) t.add(200); }
        }
        if (b.x < 38 && cross(230) && b.vy < 0) orbit();
        // SURF: the wave lifts a ball falling past the flippers back up the table
        if (surf > 0 && wave > 0.6 && b.y > 492 && b.vy > 0) {
          b.vy = -820 - Math.random() * 160; b.vx = (140 - b.x) * 1.4 + (Math.random() - 0.5) * 120;
          t.stat('surfSaves'); t.sound('fx-splash', 'fx-whoosh'); t.boom(b.x, 500, '#c8f8ff', 10, 0.3);
        }
      },
      tick(dt) {
        if (!t.field.some(b => !b.gone)) {
          karp.vy += 900 * dt; karp.y = Math.min(KARP.rest, karp.y + karp.vy * dt); if (karp.y >= KARP.rest) karp.vy = 0;
        }
        for (let i = whirls.length - 1; i >= 0; i--) {
          const w = whirls[i], da = dt * (7 + 10 * (1 - w.r / POOL.r));
          w.a += da; w.turned += da; w.r = Math.max(4, w.r - dt * 18); w.spin += dt * 20;
          const before = Math.floor((w.turned - da) / TAU), after = Math.floor(w.turned / TAU);
          if (after > before) { t.add(pts(250)); t.sound('fx-bubble', 'fx-tick'); }
          if (w.turned >= TAU * 2) { whirls.splice(i, 1); fling(w); }
        }
        swirlA += dt * (rampage > 0 ? 5 : 2.4);
        for (let i = 0; i < 3; i++) { spin[i] += spinV[i] * dt; const base = i === 1 ? -1.2 : 1.2; spinV[i] += (base - spinV[i]) * Math.min(1, dt * 2.5); lit.star[i] = Math.max(0, lit.star[i] - dt); }
        lit.inl.forEach((v, i) => { lit.inl[i] = Math.max(0, v - dt); });
        if (skillT > 0) skillT = Math.max(0, skillT - dt);
        karp.flop = Math.max(0, karp.flop - dt);
        if (rampage > 0 && (rampage -= dt) <= 0) { rampage = 0; t.say('RAMPAGE OVER', 1.8); t.sound('run-away', 'cancel'); }
        if (surf > 0) {
          surf = Math.max(0, surf - dt); wave = Math.min(1, wave + dt * 1.5); laprasX += dt * 90; if (laprasX > W + 40) laprasX = -40;
          if (surf === 0) t.say('THE WAVE IS GONE', 1.8);
        } else wave = Math.max(0, wave - dt * 1.2);
        const want = t.save > 0 && t.launched ? 1 : 0;
        post += (want - post) * Math.min(1, dt * 6);
      },
      under(g, now) {
        const blink = (r) => t.blink(now, r);
        LANES.forEach((x, i) => {
          if (lit.lanes[i]) t.glow(g, x, LANE_Y, 6, '#8af4ff');
          else if ((skillT > 0 || !t.launched) && i === skill && blink(120)) t.glow(g, x, LANE_Y, 6, '#ffe070');
        });
        MULT.forEach((x, i) => { if (t.mult >= i + 2) { t.glow(g, x, MULT_Y, 7.5, '#ff9a6a', 0.8); g.fillStyle = '#fff'; g.font = '800 8px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${i + 2}×`, x, MULT_Y); } });
        for (let i = 0; i < 3; i++) if ((surf > 0 && blink(140)) || (!surf && orbits > i)) { g.fillStyle = surf > 0 ? '#ff80e0' : '#7af0ff'; arrowPath(g, 25, 238 - i * 14, 6, -Math.PI / 2); g.fill(); }
        for (let i = 0; i < 6; i++) if (i < Math.round(splashes * 6 / splashNeed) || (rampage > 0 && blink(150))) t.glow(g, 230, 260 - i * 10, 3.5, rampage > 0 ? '#ff6060' : '#ffa040');
        for (let i = 0; i < 4; i++) if (i < pearls) t.glow(g, 52, 304 + i * 11, 3.5, '#ffffff');
        [23, 45, 235, 257].forEach((x, i) => { if (lit.inl[i]) t.glow(g, x, 400, 4.5, i === 0 || i === 3 ? '#ff6a6a' : '#6affc0', Math.min(1, lit.inl[i] * 2)); });
        if (t.save > 0 && t.launched && (t.save > 3 || blink(120))) t.glow(g, 140, 476, 6, '#ff6a6a');
        // the whirlpool turning
        g.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          g.strokeStyle = surf > 0 ? 'rgba(255, 150, 230, 0.55)' : rampage > 0 ? 'rgba(255, 120, 120, 0.5)' : 'rgba(170, 235, 255, 0.45)';
          g.lineWidth = 2.2; g.beginPath();
          for (let r = 5; r <= POOL.r - 2; r += 3) { const a = swirlA + k * TAU / 3 + r * 0.09; g.lineTo(POOL.x + Math.cos(a) * r, POOL.y + Math.sin(a) * r); }
          g.stroke();
        }
        t.glow(g, POOL.x, POOL.y, 5 + Math.sin(now / 200) * 1.5, 'rgba(255, 255, 255, 0.35)');
        // Shellder on the standups, open when lit
        SHELL.forEach((s, i) => {
          const mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2;
          g.strokeStyle = lit.shell[i] ? '#ffffff' : '#9a7ac8'; g.lineWidth = 4; g.lineCap = 'round';
          g.beginPath(); g.moveTo(s[0], s[1]); g.lineTo(s[2], s[3]); g.stroke();
          if (lit.shell[i]) t.glow(g, mx + 6, my - 2, 4, '#ffffff', 0.7);
          drawMon(g, 'shellder', mx - 6, my + 8, lit.shell[i] ? 18 : 15);
        });
        // the Staryu bumpers, turning, faster when struck
        STARS.forEach((p, i) => {
          if (lit.star[i]) t.glow(g, p.x, p.y, SR + 5, rampage ? '#ff8080' : '#fff090', 0.8);
          g.save(); g.translate(p.x, p.y); g.rotate(spin[i]);
          g.fillStyle = '#e8a040'; g.strokeStyle = '#7a4010'; g.lineWidth = 1;
          g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 5 : 12, a = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke();
          g.fillStyle = lit.star[i] ? '#ffffff' : '#ff4060'; g.beginPath(); g.arc(0, 0, 3.2, 0, TAU); g.fill();
          g.restore();
        });
        // Magikarp at the head of its lane, flopping on a splash; Gyarados over the reef in a Rampage
        drawMon(g, 'magikarp', KARP.x - 1, KARP.top - 4 - (karp.flop ? Math.abs(Math.sin(now / 60)) * 6 : 0), 22, karp.flop > 0 && blink(90));
        if (rampage > 0) {
          const k = Math.min(1, (RAMPAGE - rampage) / 0.5);
          drawMon(g, 'gyarados', 206 + Math.sin(now / 90) * 4, 244 + Math.cos(now / 130) * 2, 62 * k, Math.sin(now / 600) > 0);
          g.fillStyle = 'rgba(0, 0, 0, 0.55)'; g.fillRect(180, 248, 52, 4);
          g.fillStyle = rampage < 5 && blink(120) ? '#ffffff' : '#ff6060'; g.fillRect(180, 248, 52 * rampage / RAMPAGE, 4);
        }
        // Lapras rising between the flippers while the saver runs
        if (post > 0.05) drawMon(g, 'lapras', POST.x, POST.y + 8 - 2 * post, 22 * post);
      },
      over(g, now) {
        for (const w of whirls) t.drawBall(POOL.x + Math.cos(w.a) * w.r, POOL.y + Math.sin(w.a) * w.r, w.spin, 0.8 + 0.2 * w.r / POOL.r);
        g.fillStyle = '#f4f8ff';
        { const b = { x: KARP.x, y: karp.y }; t.drawBall(b.x, b.y, 0); g.fillStyle = '#ff8a3a'; g.beginPath(); g.arc(b.x, b.y, 3, 0, TAU); g.fill(); }
        if (wave > 0.02) {   // the wave over the drain, and Lapras riding it
          const top = 520 - 30 * wave;
          g.fillStyle = 'rgba(90, 200, 255, 0.45)';
          g.beginPath(); g.moveTo(12, 524);
          for (let x = 12; x <= 268; x += 6) g.lineTo(x, top + Math.sin(x * 0.07 + now / 180) * 4);
          g.lineTo(268, 524); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(255, 255, 255, 0.8)'; g.lineWidth = 1.5; g.beginPath();
          for (let x = 12; x <= 268; x += 6) g.lineTo(x, top + Math.sin(x * 0.07 + now / 180) * 4);
          g.stroke();
          if (surf > 0) drawMon(g, 'lapras', laprasX, top + 8 + Math.sin(laprasX * 0.07 + now / 180) * 4, 36);
        }
      },
      dmd(now) {
        if (rampage > 0) return `GYARADOS RAMPAGE ${Math.ceil(rampage)}S`;
        if (surf > 0) return `SURF! JACKPOT AT WHIRLPOOL ${Math.ceil(surf)}S`;
        const lines = [`BALL ${t.ball}  BONUS ${t.mult}X`, `MAGIKARP ${splashes}/${splashNeed} SPLASH`, `PEARLS ${pearls}/4`, `SURF ${orbits}/3 ORBITS`, `WHIRLPOOL ${bonus.swirls || 0}`];
        return lines[Math.floor(now / 2200) % lines.length];
      },
      bonus: () => bonus.swirls * 300 + bonus.splashes * 500 + bonus.targets * 200 + bonus.pearls * 2000 + bonus.orbits * 500 + bonus.evos * 5000,
      overLine: () => evos ? `Gyarados evolved ${evos > 1 ? `${evos} times` : 'once'}!` : pearlsAll ? `${pearlsAll} pearl${pearlsAll > 1 ? 's' : ''} found!` : 'Last ball down!',
    };
  },
};

export const openLapras = (onClose) => openTable(TABLE, onClose);
