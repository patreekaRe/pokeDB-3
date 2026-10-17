/* pinball-gengar.js  -  Gengar's Haunted Pinball, a home arcade table on js/pinball-kit.js (2026-10-17, the user's ask:
   four more tables after the rebuilt Pokémon Pinball, each completely different). A night graveyard under a full moon:
   a haunted mansion in the middle whose gabled roof sheds the ball left and right and whose door is a scoop, three
   Gastly drifting about the graveyard as moving pop bumpers, a row of G-H-O-S-T tombstones to topple (that lights HAUNT
   at the door and the Duskull kickback in the left outlane), B-O-O rollovers the flippers turn (all lit raises the bonus
   multiplier) and a left orbit that comes back down the right side onto a small upper flipper aimed at the door. HAUNT:
   Gengar teleports round the table; hit him before he vanishes and Gengar's Party starts, two balls with the door a
   Jackpot. LIGHTS OUT (Night Shade), every third orbit or an unlit door: the table goes dark but for a light round each
   ball and the glowing ghosts, and everything scores double. */

import { openTable, arc, bump, hitSeg, side, rails, slingArt, gateArt, lampInsert, arrowPath, arrowInsert, label, hash, drawMon, TAU } from './pinball-kit.js';

const W = 300, H = 520;
const LANES = [104, 140, 176], LANE_Y = 98;
const ROOF = 128, HOUSE = { l: 108, r: 172, eave: 150, sill: 182 }, DOOR = { x: 140, y: 190 };
const STONES = [65, 79, 93, 107, 121], STONE_Y = 292;
const GASTLY = [
  { cx: 72, cy: 228, rx: 16, ry: 10, w: 0.9, f8: false },
  { cx: 210, cy: 226, rx: 16, ry: 10, w: -1.1, f8: false },
  { cx: 140, cy: 252, rx: 44, ry: 9, w: 0.55, f8: true },
];
const GR = 12;
const SPOTS = [{ x: 68, y: 146 }, { x: 212, y: 146 }, { x: 140, y: 226 }, { x: 186, y: 318 }], GENGAR_R = 15;
const MULT = [104, 128, 152, 176], MULT_Y = 352;
const SLINGS = [{ s: 'l', a: [56, 370], b: [82, 432], c: [56, 416] }, { s: 'r', a: [224, 370], b: [198, 432], c: [224, 416] }];
const DEFLECT = [12, 262, 44, 290];   // one-way: up the left orbit passes, down it turns the ball into the field
const GATE = [288, 146, 262, 172];
const MINI = { s: 'r', x: 260, y: 292, len: 30, rest: Math.PI - 0.5, up: Math.PI + 0.5 };

const WALLS = [
  ...arc(150, 136, 138, 88, Math.PI, Math.PI * 2, 28),
  [12, 136, 12, 560], [288, 136, 288, 560], [268, 166, 268, 560],
  [34, 360, 34, 432], [34, 432, 95, 465], [246, 360, 246, 432], [246, 432, 185, 465],
  ...[86, 122, 158, 194].map(x => [x, 84, x, 112]),
  [38, 170, 38, 260], [244, 200, 244, 272],
  [HOUSE.l, HOUSE.eave, 140, ROOF], [140, ROOF, HOUSE.r, HOUSE.eave],
  [HOUSE.l, HOUSE.eave, HOUSE.l, HOUSE.sill], [HOUSE.r, HOUSE.eave, HOUSE.r, HOUSE.sill], [HOUSE.l, HOUSE.sill, HOUSE.r, HOUSE.sill],
  ...SLINGS.flatMap(({ a, b, c }) => [[...a, ...c], [...c, ...b]]),
];

const gastlyAt = (p, clock) => {
  const a = clock * p.w;
  return p.f8 ? { x: p.cx + Math.sin(a) * p.rx, y: p.cy + Math.sin(a * 2) * p.ry } : { x: p.cx + Math.cos(a) * p.rx, y: p.cy + Math.sin(a) * p.ry };
};

/* ---- the painted table ---- */
function fieldPath(g) {
  g.beginPath(); g.moveTo(12, 560);
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; g.lineTo(150 + Math.cos(a) * 138, 136 + Math.sin(a) * 88); }
  g.lineTo(288, 560); g.closePath();
}
function tombDeco(g, x, y, s, tilt) {
  g.save(); g.translate(x, y); g.rotate(tilt); g.scale(s, s);
  g.fillStyle = '#2a2638'; g.beginPath(); g.moveTo(-7, 0); g.lineTo(-7, -10); g.arc(0, -10, 7, Math.PI, 0); g.lineTo(7, 0); g.closePath(); g.fill();
  g.fillStyle = '#3e3a52'; g.beginPath(); g.moveTo(-5, 0); g.lineTo(-5, -10); g.arc(0, -10, 5, Math.PI, 0); g.lineTo(5, 0); g.closePath(); g.fill();
  g.fillStyle = '#1a1626'; g.fillRect(-0.8, -13, 1.6, 7); g.fillRect(-3, -11, 6, 1.6);
  g.restore();
}
function deadTree(g, x, y, s, flip) {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
  g.strokeStyle = 'rgba(10, 4, 20, 0.85)'; g.lineCap = 'round';
  g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(2, -22); g.lineTo(-1, -40); g.stroke();
  g.lineWidth = 1.6; g.beginPath(); g.moveTo(1, -16); g.lineTo(12, -26); g.lineTo(16, -24); g.moveTo(1, -28); g.lineTo(-10, -36); g.lineTo(-13, -42);
  g.moveTo(-1, -38); g.lineTo(6, -48); g.moveTo(9, -24); g.lineTo(11, -32); g.stroke();
  g.restore();
}

function tableArt(g) {
  g.fillStyle = '#0a0612'; g.fillRect(0, 0, W, H);
  const wood = g.createLinearGradient(0, 0, W, 0);
  wood.addColorStop(0, '#24122e'); wood.addColorStop(0.5, '#140a1c'); wood.addColorStop(1, '#24122e');
  g.fillStyle = wood; g.fillRect(0, 36, W, H - 36);
  g.save();
  fieldPath(g); g.clip();
  const sky = g.createLinearGradient(0, 40, 0, H);
  sky.addColorStop(0, '#2a1250'); sky.addColorStop(0.4, '#1c1040'); sky.addColorStop(0.75, '#14202e'); sky.addColorStop(1, '#0c1a1a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) {   // stars, thinning towards the graveyard
    const x = 14 + hash(i) * 252, y = 50 + hash(i + 99) * 220, r = hash(i + 7) < 0.85 ? 0.6 : 1.2;
    g.fillStyle = `rgba(230, 220, 255, ${0.2 + hash(i + 3) * 0.5})`; g.fillRect(x, y, r, r);
  }
  // the full moon, its glow and craters
  const halo = g.createRadialGradient(50, 104, 8, 50, 104, 46);
  halo.addColorStop(0, 'rgba(255, 250, 210, 0.45)'); halo.addColorStop(1, 'rgba(255, 250, 210, 0)');
  g.fillStyle = halo; g.fillRect(0, 50, 110, 110);
  g.fillStyle = '#f4efcc'; g.beginPath(); g.arc(50, 104, 15, 0, TAU); g.fill();
  g.fillStyle = 'rgba(180, 170, 130, 0.5)';
  for (const [x, y, r] of [[45, 99, 3.5], [55, 108, 2.5], [47, 111, 2], [56, 98, 1.6]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  // a big faded Gengar grin over the middle
  g.globalAlpha = 0.13;
  g.fillStyle = '#b070ff';
  g.beginPath(); g.ellipse(140, 300, 92, 70, 0, 0, TAU); g.fill();
  g.fillStyle = '#ff3060'; g.beginPath(); g.ellipse(112, 278, 16, 9, 0.3, 0, TAU); g.ellipse(168, 278, 16, 9, -0.3, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(92, 312); g.quadraticCurveTo(140, 352, 188, 312); g.quadraticCurveTo(140, 330, 92, 312); g.fill();
  g.globalAlpha = 1;
  for (const [x, s, f] of [[226, 1.1, false], [262, 0.8, true], [46, 0.9, true]]) deadTree(g, x, x === 46 ? 168 : 132, s, f);
  // graveyard ground and its fog
  for (let i = 0; i < 9; i++) {
    const x = 20 + hash(i + 40) * 230, y = 236 + hash(i + 50) * 150;
    g.fillStyle = `rgba(160, 230, 200, ${0.04 + hash(i + 60) * 0.05})`;
    g.beginPath(); g.ellipse(x, y, 40 + hash(i + 70) * 40, 7 + hash(i + 80) * 6, 0, 0, TAU); g.fill();
  }
  for (const [x, y, s, a] of [[34, 340, 0.9, -0.15], [250, 336, 0.8, 0.12], [118, 392, 0.7, 0.08], [168, 396, 0.75, -0.1], [60, 250, 0.7, 0.1], [228, 300, 0.6, -0.08]]) tombDeco(g, x, y, s, a);
  // lanes' floors: plunger lane, the orbits, the top lanes
  g.fillStyle = 'rgba(0, 0, 0, 0.35)';
  g.fillRect(268, 150, 20, 410); g.fillRect(12, 170, 26, 92); g.fillRect(244, 200, 24, 72);
  for (const x of LANES) g.fillRect(x - 18, 84, 36, 28);
  g.strokeStyle = 'rgba(255, 255, 255, 0.07)'; g.lineWidth = 1;
  for (let y = 180; y < 480; y += 8) { g.beginPath(); g.moveTo(270, y); g.lineTo(286, y); g.stroke(); }
  // the apron, a graveyard fence along it
  const apron = g.createLinearGradient(0, 430, 0, H);
  apron.addColorStop(0, '#24103a'); apron.addColorStop(1, '#0e0618');
  g.fillStyle = apron;
  g.beginPath(); g.moveTo(34, 432); g.lineTo(95, 465); g.lineTo(104, 520); g.lineTo(34, 520); g.fill();
  g.beginPath(); g.moveTo(246, 432); g.lineTo(185, 465); g.lineTo(176, 520); g.lineTo(246, 520); g.fill();
  g.fillStyle = 'rgba(0, 0, 0, 0.5)'; g.fillRect(104, 500, 72, 20);
  g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.fillRect(12, 440, 22, 80); g.fillRect(246, 440, 22, 80);
  g.strokeStyle = 'rgba(20, 10, 30, 0.9)'; g.lineWidth = 1.4;
  for (let x = 40; x < 240; x += 7) { if (x > 96 && x < 184) continue; const y = x < 140 ? 480 + (x - 40) * 0.1 : 480 + (240 - x) * 0.1; g.beginPath(); g.moveTo(x, y + 14); g.lineTo(x, y); g.lineTo(x + 1.5, y - 2.5); g.stroke(); }
  g.restore();

  // the mansion: stone walls, a dark gabled roof, lit windows, the door under a gold arch
  g.fillStyle = '#2e2244'; g.fillRect(HOUSE.l, HOUSE.eave, HOUSE.r - HOUSE.l, HOUSE.sill - HOUSE.eave);
  g.strokeStyle = 'rgba(0, 0, 0, 0.35)'; g.lineWidth = 0.8;
  for (let y = HOUSE.eave + 5; y < HOUSE.sill; y += 5) { g.beginPath(); g.moveTo(HOUSE.l, y); g.lineTo(HOUSE.r, y); g.stroke(); }
  g.fillStyle = '#4a2f6a';
  g.beginPath(); g.moveTo(HOUSE.l - 4, HOUSE.eave + 2); g.lineTo(140, ROOF - 4); g.lineTo(HOUSE.r + 4, HOUSE.eave + 2); g.closePath(); g.fill();
  g.fillStyle = '#1a1028';
  g.beginPath(); g.moveTo(HOUSE.l + 2, HOUSE.eave); g.lineTo(140, ROOF + 1); g.lineTo(HOUSE.r - 2, HOUSE.eave); g.closePath(); g.fill();
  g.fillStyle = '#2a1a3e'; g.fillRect(150, ROOF - 2, 6, 12);   // the chimney
  for (const x of [116, 152]) {
    g.fillStyle = '#0c0814'; g.fillRect(x, 156, 12, 10);
    g.fillStyle = 'rgba(200, 255, 120, 0.35)'; g.fillRect(x + 1, 157, 10, 8);
    g.fillStyle = '#2e2244'; g.fillRect(x + 5.5, 156, 1, 10); g.fillRect(x, 160.5, 12, 1);
  }
  g.fillStyle = '#ffd84a'; g.beginPath(); g.moveTo(131, HOUSE.sill); g.lineTo(131, 172); g.arc(140, 172, 9, Math.PI, 0); g.lineTo(149, HOUSE.sill); g.closePath(); g.fill();
  g.fillStyle = '#05020a'; g.beginPath(); g.moveTo(133, HOUSE.sill); g.lineTo(133, 172); g.arc(140, 172, 7, Math.PI, 0); g.lineTo(147, HOUSE.sill); g.closePath(); g.fill();
  label(g, 'MANSION', 140, 142, 7, '#d8c0ff');

  // inserts: lamps, arrows and words, dim; lit ones are drawn over them each frame
  for (const x of LANES) lampInsert(g, x, LANE_Y, 6, '#80ff90');
  label(g, 'B', 104, 76, 9, '#c8ffc0'); label(g, 'O', 140, 76, 9, '#c8ffc0'); label(g, 'O', 176, 76, 9, '#c8ffc0');
  STONES.forEach(x => lampInsert(g, x, STONE_Y + 12, 4.5, '#80ff90'));
  MULT.forEach((x, i) => { lampInsert(g, x, MULT_Y, 8, '#c070ff'); label(g, `${i + 2}×`, x, MULT_Y, 8, '#e8d0ff'); });
  label(g, 'BONUS', 140, MULT_Y + 15, 8, '#d8b8ff');
  arrowInsert(g, DOOR.x, 210, 8, -Math.PI / 2, '#ff4080'); label(g, 'HAUNT', DOOR.x, 202 + 22, 7, '#ffb0d0');
  for (let i = 0; i < 3; i++) arrowInsert(g, 25, 246 - i * 14, 6, -Math.PI / 2, '#80ff90');
  label(g, 'ORBIT', 25, 182, 7, '#c0ffc8', -Math.PI / 2);
  for (const x of [23, 45, 235, 257]) lampInsert(g, x, 400, 4.5, x === 23 || x === 257 ? '#ff5050' : '#50ffa0');
  lampInsert(g, 140, 478, 7, '#ff5050'); label(g, 'SAVE', 140, 492, 8, '#ffb0b0');
  lampInsert(g, 23, 452, 6, '#b080ff');
  label(g, 'KICK', 23, 472, 8, '#e0c8ff', -Math.PI / 2);
  label(g, 'HAUNTED', 64, 506, 9, '#b080ff'); label(g, 'PINBALL', 216, 506, 9, '#b080ff');
  label(g, 'LAUNCH', 278, 420, 8, '#b080ff', -Math.PI / 2);
  for (const x of STONES) { g.fillStyle = '#1a0e08'; g.beginPath(); g.ellipse(x, STONE_Y + 1, 7, 2.5, 0, 0, TAU); g.fill(); }
  for (const p of GASTLY) { g.strokeStyle = 'rgba(180, 120, 255, 0.12)'; g.lineWidth = 1; g.setLineDash([2, 4]); g.beginPath();
    for (let i = 0; i <= 48; i++) { const q = gastlyAt(p, i / 48 * TAU / Math.abs(p.w)); g.lineTo(q.x, q.y); } g.stroke(); g.setLineDash([]); }

  slingArt(g, SLINGS, '#5a2a8a', '#1a0830');
  rails(g, WALLS, ['#1a0c26', '#9a8ab8', '#e8dcff']);
  g.strokeStyle = '#80ff90'; g.lineWidth = 1.2; g.globalAlpha = 0.6;   // a green inner rail along the arch
  g.beginPath();
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; g.lineTo(150 + Math.cos(a) * 133, 136 + Math.sin(a) * 83); }
  g.stroke(); g.globalAlpha = 1;
  gateArt(g, GATE); gateArt(g, DEFLECT);
  for (const x of [86, 122, 158, 194]) for (const y of [84, 112]) {
    g.fillStyle = '#7a3ac8'; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill();
    g.fillStyle = '#e0c8ff'; g.beginPath(); g.arc(x - 1, y - 1, 1.2, 0, TAU); g.fill();
  }
  for (const f of [{ x: 92, y: 470 }, { x: 188, y: 470 }, MINI]) { g.fillStyle = '#140a1c'; g.beginPath(); g.arc(f.x, f.y, 9, 0, TAU); g.fill(); }
  g.fillStyle = '#2a2236'; g.fillRect(268, 494, 20, 26);
  g.strokeStyle = 'rgba(255, 255, 255, 0.15)'; g.strokeRect(268.5, 494.5, 19, 25);
}

/** A Dusk Ball: a green top laced with black, an orange band, a black bottom. */
function duskBall(g) {
  g.fillStyle = '#1c1c24'; g.fillRect(-9, -9, 18, 18);
  g.fillStyle = '#2f8a44'; g.beginPath(); g.arc(0, 0, 8, Math.PI, 0); g.fill();
  g.strokeStyle = '#101418'; g.lineWidth = 1.1;
  g.beginPath(); g.moveTo(-6, -2.5); g.quadraticCurveTo(-3, -7.5, 0, -3); g.quadraticCurveTo(3, -7.5, 6, -2.5); g.stroke();
  g.beginPath(); g.moveTo(-3, -7); g.lineTo(-1.5, -4.5); g.moveTo(3, -7); g.lineTo(1.5, -4.5); g.stroke();
  g.fillStyle = '#f08a20'; g.fillRect(-8, -1.2, 16, 2.4);
  g.fillStyle = '#101418'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
  g.fillStyle = '#ffd070'; g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.fill();
}

export const TABLE = {
  id: 'gengar', title: 'Gengar\'s Haunted Pinball', colour: '#9a5ae0', W, H,
  intro: 'Time the LAUNCH, then flip with ◀ ▶ or the screen\'s halves!',
  go: 'Topple G-H-O-S-T, then sink the mansion door to face Gengar.',
  sounds: ['gengar', 'gastly', 'duskull', 'fx-poof', 'fx-zap', 'fx-gong', 'catch-success', 'stat-up', 'hit-weak', 'run-away', 'coins'],
  help: [
    ['◀ ▶ flip (or tap a half): ▶ works the upper flipper too.', 'LAUNCH fires the plunger as its gauge swings: roll through the flashing top lane for a Skill Shot.'],
    ['Light B-O-O for a bigger bonus.', 'Flipping moves the lit lanes. The Gastly drift about as bumpers; the orbit comes back down onto the upper flipper.'],
    ['Topple the G-H-O-S-T tombstones to light HAUNT,', 'then sink the mansion door: hit Gengar as he teleports, before he vanishes!'],
    ['Bust Gengar for Gengar\'s Party: two balls, the door a Jackpot.', 'Every third orbit turns the LIGHTS OUT: only the ball and the ghosts glow, and everything scores double.'],
    ['3 balls, each starting with a ball saver.', 'G-H-O-S-T lights the Duskull kickback. Bust Gengar twice for an extra ball, and again on the fifth.'],
  ],
  walls: WALLS, slings: SLINGS, lane: { gate: GATE },
  flippers: [
    { s: 'l', x: 92, y: 470, len: 38, rest: 0.52, up: -0.5 },
    { s: 'r', x: 188, y: 470, len: 38, rest: Math.PI - 0.52, up: Math.PI + 0.5 },
    MINI,
  ],
  flip: { edge: '#12061e', face: '#4a2a6a', rubber: '#60e070', pivot: '#a0ff90' },
  ball: { key: 'dusk', paint: duskBall },
  dmd: '#8aff6a', bezel: '#b080ff',
  art: tableArt,
  make(t) {
    let clock = 0, lanes = [false, false, false], skill = Math.floor(Math.random() * 3), skillT = 0;
    let stones = [true, true, true, true, true], stoneBack = 0, doorLit = false, kick = false;
    let haunt = null, busted = 0, party = false, dark = 0, orbits = 0;
    const glit = [0, 0, 0], inl = [0, 0, 0, 0];
    let bonus = { stones: 0, orbits: 0, ghosts: 0, doors: 0, gastly: 0 };
    let dk = null;

    const score = (n) => t.add(n * (dark > 0 ? 2 : 1));
    const lightsOut = (why) => {
      if (dark <= 0) { t.shout('LIGHTS OUT!', '#80ff90'); t.sound('fx-zap', 'select'); t.api.say(`${why} Lights out: everything scores double!`); }
      dark = Math.min(30, Math.max(dark, 0) + 20); t.stat('dark');
    };
    const startHaunt = () => {
      doorLit = false;
      const need = Math.min(6, 3 + busted);
      haunt = { hits: 0, need, t: 25, full: 25, spot: 2, hop: 3.2, appear: 0.6, hitT: 0, wob: 0 };
      t.sound('gengar', 'confirm'); t.shout('GENGAR APPEARS!', '#c080ff'); t.stat('haunt');
      t.api.say(`Gengar appeared! Hit him ${need} times before he vanishes!`);
    };
    const teleport = () => {
      const list = SPOTS.map((_, i) => i).filter(i => i !== haunt.spot);
      haunt.spot = list[Math.floor(Math.random() * list.length)];
      haunt.hop = Math.max(1.8, 3.4 - busted * 0.3); haunt.appear = 0.45;
      t.sound('fx-poof', 'select');
    };
    const hitGengar = (b) => {
      haunt.hits++; haunt.wob = 0.3; haunt.hitT = 0.3; score(1500);
      t.sound('hit-weak', 'plink-2'); t.boom(b.x, b.y, '#c080ff', 10, 0.5);
      if (haunt.hits < haunt.need) { haunt.hop = 0.35; return; }
      const sp = SPOTS[haunt.spot], pts = 10000 + 5000 * busted;
      busted++; bonus.ghosts++; score(pts); t.stat('defeat');
      t.shout('GENGAR BUSTED!', '#ffe060'); t.sound('catch-success', 'stat-up'); t.boom(sp.x, sp.y, '#c080ff', 30, 1.4);
      t.api.say(`Gengar busted! +${pts.toLocaleString()} (${busted} so far). Gengar's Party: the door is a Jackpot!`);
      haunt = null; kick = true;
      if (busted === 2 || busted === 5) t.extraBall(`${busted} Gengar busted: an extra ball!`);
      if (!t.multi) { party = true; t.stat('party'); t.startMulti(1); }
    };
    const sinkDoor = (b) => {
      t.hold(b, DOOR.x, DOOR.y, 1.1, () => { const nb = t.spawn(DOOR.x, DOOR.y + 15, (Math.random() < 0.5 ? -1 : 1) * (110 + Math.random() * 90), 200); nb.cool = 0.5; });
      t.sound('fx-gong', 'select'); bonus.doors++; t.stat('door');
      if (party && t.multi) {
        const pts = 20000 + 5000 * busted; score(pts); t.stat('jackpot');
        t.shout('JACKPOT!', '#ff70e0'); t.boom(DOOR.x, DOOR.y, '#ff70e0', 26, 1.3); t.sound('coins', 'stat-up'); t.api.say(`Jackpot! +${pts.toLocaleString()}`);
      } else if (haunt) { score(2000); haunt.hop = Math.min(haunt.hop, 0.4); t.say('DOOR 2000', 1.4); }
      else if (doorLit) startHaunt();
      else { score(500); t.say('DOOR 500', 1.4); lightsOut('The door creaks...'); }
    };
    const orbit = () => {
      orbits++; bonus.orbits++; score(750); t.stat('orbit'); t.sound('fx-ding', 'plink-2');
      if (haunt) haunt.hop = Math.min(haunt.hop, 0.4);
      if (orbits % 3 === 0) lightsOut('Third orbit!'); else t.say(`ORBIT ${orbits % 3}/3 NIGHT SHADE`, 1.6);
    };

    return {
      newBall() {
        lanes = [false, false, false]; skill = Math.floor(Math.random() * 3); skillT = 0; dark = 0; party = false;
        bonus = { stones: 0, orbits: 0, ghosts: 0, doors: 0, gastly: 0 };
      },
      launch() { if (!skillT) skillT = 5; },
      press(s) { if (s === 'l') lanes.push(lanes.shift()); else lanes.unshift(lanes.pop()); },
      multiEnd() { party = false; },
      drained() {
        if (haunt) { t.say('GENGAR ESCAPED', 2); haunt = null; doorLit = true; }
        dark = 0;
      },
      held: () => 0,
      bonus: () => bonus.stones * 250 + bonus.orbits * 500 + bonus.ghosts * 5000 + bonus.doors * 1000 + bonus.gastly * 20,
      overLine: () => busted ? `${busted} ghost${busted > 1 ? 's' : ''} busted!` : 'Last ball down!',
      ball(b, h, py) {
        if (b.cool) b.cool = Math.max(0, b.cool - h);
        if (!b.lane && b.vy > 0 && side(b, DEFLECT) < 0) hitSeg(b, ...DEFLECT, 0.2);
        GASTLY.forEach((p, i) => {
          const q = gastlyAt(p, clock);
          if (!bump(b, q.x, q.y, GR, 260)) return;
          if (glit[i] < 0.05) { score(100); bonus.gastly++; t.stat('gastly'); t.sound(i % 2 ? 'plink-2' : 'plink-1'); t.boom(b.x, b.y, '#c8a0ff', 5, 0.2); }
          glit[i] = 0.16;
        });
        if (haunt && haunt.appear <= 0.1) {
          const sp = SPOTS[haunt.spot];
          if (bump(b, sp.x, sp.y, GENGAR_R, 220) && haunt.hitT <= 0) hitGengar(b);
        }
        stones.forEach((up, i) => {
          if (!up || stoneBack) return;
          const x = STONES[i];
          const c = hitSeg(b, x - 7, STONE_Y, x + 7, STONE_Y, 0.5) || hitSeg(b, x - 7, STONE_Y - 12, x + 7, STONE_Y - 12, 0.5);
          if (!c) return;
          stones[i] = false; bonus.stones++; score(250); t.stat('stone'); t.sound('hit-weak', 'plink-2');
          t.boom(x, STONE_Y - 8, '#9a94b0', 8, 0.3);
          if (!stones.some(Boolean)) {
            stoneBack = 1.4; score(1000);
            if (!kick) kick = true;
            if (!haunt && !doorLit) { doorLit = true; t.say('HAUNT IS LIT!', 2.5); t.api.say('G-H-O-S-T! HAUNT is lit at the door, and the kickback too.'); t.sound('stat-up'); }
            else t.say('GHOST BANK 1000');
          }
        });
        const cross = (y) => (py < y) !== (b.y < y);
        if (cross(LANE_Y)) LANES.forEach((x, i) => {
          if (Math.abs(b.x - x) > 14) return;
          if (skillT > 0 && i === skill && t.launched) { score(5000); t.shout('SKILL SHOT!', '#80ffc0'); t.sound('stat-up'); t.boom(x, LANE_Y, '#80ffc0', 20); t.stat('skill'); }
          skillT = 0;
          if (!lanes[i]) { lanes[i] = true; score(500); t.sound('fx-ding', 'plink-2'); t.stat('boo'); } else score(100);
          if (lanes.every(Boolean)) {
            lanes = [false, false, false];
            if (t.mult < 5) { t.mult++; t.shout(`BONUS ${t.mult}×`, '#c080ff'); } else { score(5000); t.shout('BONUS MAX', '#c080ff'); }
            t.sound('stat-up');
          }
        });
        if (cross(400) && b.vy > 0) {
          const j = b.x < 34 ? 0 : b.x < 56 ? 1 : b.x > 246 ? 3 : b.x > 224 ? 2 : -1;
          if (j >= 0) { inl[j] = 1.2; if (j === 1 || j === 2) score(200); }
        }
        if (b.x < 38 && cross(220) && b.vy < 0) orbit();
        if (b.x > 244 && b.x < 268 && cross(240) && b.vy > 0 && !b.lane) t.stat('rightOrbit');
        if (!b.cool && Math.hypot(b.x - DOOR.x, b.y - DOOR.y) < 12) return sinkDoor(b);
        // Duskull's kickback sends a ball in the left outlane back up the orbit
        if (!b.lane && kick && b.y > 440 && b.y < 500 && b.x < 34) {
          b.vy = -1000; b.vx = 0; kick = false; t.stat('kickback');
          t.sound('duskull', 'plink-2'); t.shout('DUSKULL!', '#c8a0ff'); t.boom(b.x, b.y, '#c8a0ff', 20, 1);
          t.api.say('Duskull kicked it back up the orbit!');
        }
      },
      tick(dt) {
        clock += dt;
        if (skillT > 0) skillT = Math.max(0, skillT - dt);
        if (stoneBack && (stoneBack = Math.max(0, stoneBack - dt)) === 0) stones = [true, true, true, true, true];
        if (dark > 0 && (dark -= dt) <= 0) { dark = 0; t.say('LIGHTS ON', 1.6); }
        if (haunt) {
          haunt.t -= dt; haunt.hitT = Math.max(0, haunt.hitT - dt); haunt.wob = Math.max(0, haunt.wob - dt); haunt.appear = Math.max(0, haunt.appear - dt);
          if ((haunt.hop -= dt) <= 0) teleport();
          if (haunt.t <= 0) {
            t.say('GENGAR VANISHED', 2.2); t.sound('run-away', 'cancel');
            t.api.say('Gengar vanished! Topple G-H-O-S-T to light HAUNT again.'); haunt = null;
          }
        }
        glit.forEach((v, i) => { glit[i] = Math.max(0, v - dt); });
        inl.forEach((v, i) => { inl[i] = Math.max(0, v - dt); });
      },
      under(g, now) {
        const blink = (r) => t.blink(now, r), glow = t.glow;
        LANES.forEach((x, i) => {
          if (lanes[i]) glow(g, x, LANE_Y, 6, '#90ff90');
          else if ((skillT > 0 || !t.launched) && i === skill && blink(120)) glow(g, x, LANE_Y, 6, '#80ffe0');
        });
        MULT.forEach((x, i) => { if (t.mult >= i + 2) { glow(g, x, MULT_Y, 8, '#c070ff', 0.75); g.fillStyle = '#fff'; g.font = '800 8px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${i + 2}×`, x, MULT_Y); } });
        if ((doorLit && blink(200)) || (party && t.multi && blink(120))) { g.fillStyle = party ? '#ff70e0' : '#ff4080'; arrowPath(g, DOOR.x, 210, 8, -Math.PI / 2); g.fill(); }
        for (let i = 0; i < 3; i++) if (orbits % 3 > i || (dark > 0 && blink(160))) { g.fillStyle = '#80ff90'; arrowPath(g, 25, 246 - i * 14, 6, -Math.PI / 2); g.fill(); }
        [23, 45, 235, 257].forEach((x, i) => { if (inl[i]) glow(g, x, 400, 4.5, i === 0 || i === 3 ? '#ff5050' : '#50ffa0', Math.min(1, inl[i] * 2)); });
        if (t.save > 0 && (t.save > 3 || blink(120))) glow(g, 140, 478, 7, '#ff5050');
        if (kick && blink(260)) glow(g, 23, 452, 6, '#c080ff', 0.9);
        // the mansion's windows flare in the dark, and its door glows when HAUNT is lit
        if (dark > 0 || doorLit || haunt) for (const x of [116, 152]) { g.globalAlpha = 0.5 + 0.3 * Math.sin(now / 140 + x); g.fillStyle = '#d8ff70'; g.fillRect(x + 1, 157, 10, 8); g.globalAlpha = 1; }
        if (doorLit || party) glow(g, DOOR.x, 176, 9, party ? '#ff70e0' : '#c080ff', 0.35 + 0.25 * Math.sin(now / 120));
        // the tombstones, standing or toppled, their letters' lamps under them
        stones.forEach((up, i) => {
          const x = STONES[i];
          if (up && !stoneBack) {
            g.fillStyle = '#4a465e'; g.beginPath(); g.moveTo(x - 7, STONE_Y); g.lineTo(x - 7, STONE_Y - 10); g.arc(x, STONE_Y - 10, 7, Math.PI, 0); g.lineTo(x + 7, STONE_Y); g.closePath(); g.fill();
            g.fillStyle = '#7a7690'; g.beginPath(); g.moveTo(x - 5.5, STONE_Y - 1); g.lineTo(x - 5.5, STONE_Y - 10); g.arc(x, STONE_Y - 10, 5.5, Math.PI, 0); g.lineTo(x + 5.5, STONE_Y - 1); g.closePath(); g.fill();
            g.font = '800 8px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#26223a'; g.fillText('GHOST'[i], x, STONE_Y - 8);
          } else {
            g.fillStyle = '#5a5470'; g.fillRect(x - 7, STONE_Y - 2, 14, 3);
            glow(g, x, STONE_Y + 12, 4.5, '#90ff90');
          }
        });
        GASTLY.forEach((p, i) => {
          const q = gastlyAt(p, clock);
          glow(g, q.x, q.y, GR + 6, glit[i] ? '#e0c8ff' : '#7a40c0', glit[i] ? 0.7 : 0.25);
          drawMon(g, 'gastly', q.x, q.y + 15 - (glit[i] ? 2 : 0), 30, Math.cos(clock * p.w) < 0);
        });
        if (haunt) {
          const sp = SPOTS[haunt.spot], k = 1 - haunt.appear / 0.6;
          glow(g, sp.x, sp.y, 26 * Math.max(0.2, k), '#a050ff', 0.35);
          g.globalAlpha = Math.max(0.15, k);
          drawMon(g, 'gengar', sp.x + (haunt.wob ? Math.sin(now / 20) * 3 : 0), sp.y + 18, 40);
          g.globalAlpha = 1;
          for (let i = 0; i < haunt.need; i++) {
            const a = -Math.PI / 2 + i / haunt.need * TAU;
            glow(g, sp.x + Math.cos(a) * 26, sp.y + Math.sin(a) * 26, 2.6, i < haunt.hits ? '#ffe060' : 'rgba(255, 255, 255, 0.3)');
          }
          g.fillStyle = 'rgba(0, 0, 0, 0.55)'; g.fillRect(sp.x - 22, sp.y + 22, 44, 4);
          g.fillStyle = haunt.t < 5 && blink(120) ? '#ff5050' : '#80ff90'; g.fillRect(sp.x - 22, sp.y + 22, 44 * Math.max(0, haunt.t) / haunt.full, 4);
        }
        drawMon(g, 'duskull', 23, 520 - (kick ? Math.abs(Math.sin(now / 200)) * 3 : 0), 24);
        drawMon(g, 'misdreavus', 257, 520, 24, true);
      },
      screen(g, now) {
        if (dark <= 0) return;
        if (!dk) dk = Object.assign(document.createElement('canvas'), { width: W, height: H });
        const x = dk.getContext('2d');
        x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
        x.fillStyle = 'rgba(4, 0, 14, 0.88)'; x.fillRect(0, 36, W, H - 36);
        x.globalCompositeOperation = 'destination-out';
        const hole = (cx, cy, r) => {
          const gr = x.createRadialGradient(cx, cy, r * 0.35, cx, cy, r);
          gr.addColorStop(0, 'rgba(0, 0, 0, 1)'); gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
          x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
        };
        for (const b of t.field) hole(b.x, b.y, 48);
        GASTLY.forEach(p => { const q = gastlyAt(p, clock); hole(q.x, q.y, 22); });
        if (haunt) hole(SPOTS[haunt.spot].x, SPOTS[haunt.spot].y, 30);
        for (const f of t.flippers) hole(f.x + Math.cos(f.ang) * f.len / 2, f.y + Math.sin(f.ang) * f.len / 2, 26);
        g.globalAlpha = Math.min(1, dark / 0.6, 1);
        g.drawImage(dk, 0, 0, W, H);
        g.globalAlpha = 1;
        if (t.blink(now, 500)) label(g, 'LIGHTS OUT · 2×', W / 2, 52, 10, '#90ff90');
      },
      dmd(now) {
        if (haunt) return `GENGAR ${haunt.hits}/${haunt.need} ${Math.ceil(haunt.t)}S`;
        if (dark > 0) return `LIGHTS OUT 2X ${Math.ceil(dark)}S`;
        if (party && t.multi) return 'JACKPOT · THE DOOR';
        const lines = [`BALL ${t.ball}  BONUS ${t.mult}X`, doorLit ? 'HAUNT LIT · DOOR' : `G-H-O-S-T ${stones.filter(s => !s).length}/5`,
          `ORBIT ${orbits % 3}/3 NIGHT SHADE`, kick ? 'KICKBACK LIT' : 'KICKBACK: G-H-O-S-T', `BUSTED ${busted}`];
        return lines[Math.floor(now / 2200) % lines.length];
      },
    };
  },
};

export const openGengar = (onClose) => openTable(TABLE, onClose);
