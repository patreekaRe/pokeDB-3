/* pinball-charizard.js  -  Charizard's Volcano Pinball, a home arcade table on js/pinball-kit.js (2026-10-17, the user's
   ask: four more tables after the rebuilt Pokémon Pinball, each completely different). A fast, ramp-heavy table on a
   volcano: black rock, lava rivers and rising embers. Two ramps cross over the top (the left one drops the ball onto
   the right inlane, the right one onto the left), and ramps shot within 3 seconds of each other chain Combos. A third
   flipper on the left feeds the left ramp. Ramps, the right orbit, the Slugma bumpers and the F-I-R-E targets heat the
   volcano; at full HEAT the crater lights, and sinking it starts ERUPTION, three-ball multiball where ramps and the
   crater score Jackpots (a Super Jackpot at the crater with all three balls up). F-I-R-E evolves Charmander into
   Charmeleon, then Charizard, which lights BLAST BURN: the next crater shot is the table's biggest award. Rollover
   lanes the flippers rotate raise the bonus multiplier, the flashing one a Skill Shot just after launch. */

import { openTable, arc, bump, hitSeg, side, rails, slingArt, gateArt, rampArt, lampInsert, arrowInsert, arrowPath, label, hash, drawMon, stamp, TAU } from './pinball-kit.js';

const W = 300, H = 520;
const ARCH = { x: 150, y: 136, rx: 138, ry: 88 };
const LANES = [112, 150, 188], LANE_Y = 104;
const BUMPERS = [{ x: 64, y: 148 }, { x: 98, y: 138 }, { x: 80, y: 180 }], BR = 14;
const CRATER = { x: 150, y: 170 };
const TARGETS = [{ x: 108, l: 'F' }, { x: 126, l: 'I' }, { x: 174, l: 'R' }, { x: 192, l: 'E' }], TGT_Y = 214;
const SLINGS = [{ s: 'l', a: [56, 370], b: [82, 432], c: [56, 416] }, { s: 'r', a: [224, 370], b: [198, 432], c: [224, 416] }];
const DEFLECT = [268, 300, 238, 322];   // one-way: up the orbit passes, down it turns onto the right inlane
const L_RAMP = [[72, 234], [72, 160], [82, 118], [110, 92], [150, 80], [192, 70], [226, 82], [244, 116], [248, 180], [240, 300], [235, 368]];
const R_RAMP = [[222, 234], [222, 160], [214, 118], [188, 92], [150, 80], [108, 70], [72, 82], [54, 116], [48, 180], [48, 300], [45, 368]];
const MULT = [104, 128, 152, 176], MULT_Y = 318;
const EVO = ['charmander', 'charmeleon', 'charizard'], EVO_NAME = ['Charmander', 'Charmeleon', 'Charizard'];

const WALLS = [
  ...arc(ARCH.x, ARCH.y, ARCH.rx, ARCH.ry, Math.PI, TAU, 28),
  [12, 136, 12, 560], [288, 136, 288, 560], [268, 166, 268, 560],
  [34, 360, 34, 432], [34, 432, 95, 465], [246, 360, 246, 432], [246, 432, 185, 465],
  ...[93, 131, 169, 207].map(x => [x, 92, x, 116]),
  [12, 250, 30, 280],                          // the upper flipper's guide
  [50, 214, 50, 252], [94, 206, 94, 252],      // the left ramp's mouth
  [206, 206, 206, 252], [240, 196, 240, 300],  // the right ramp's mouth and the orbit's inner wall
  [136, 192, 136, 160], [136, 160, 150, 152], [150, 152, 164, 160], [164, 160, 164, 192],   // the crater's cup
  ...SLINGS.flatMap(({ a, b, c }) => [[...a, ...c], [...c, ...b]]),
];

function playfieldPath(g) {
  g.beginPath();
  g.moveTo(12, 560);
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; g.lineTo(ARCH.x + Math.cos(a) * ARCH.rx, ARCH.y + Math.sin(a) * ARCH.ry); }
  g.lineTo(288, 560); g.closePath();
}
/** A lava river: a dark crust, a hot body and a white-hot core along a wobbling line. */
function river(g, pts) {
  const path = () => { g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) { const [px, py] = pts[i - 1], [x, y] = pts[i]; g.quadraticCurveTo(px + (x - px) * 0.5 + (i % 2 ? 6 : -6), py + (y - py) * 0.5, x, y); } };
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [w, c] of [[16, 'rgba(255, 70, 10, 0.12)'], [10, 'rgba(255, 90, 20, 0.3)'], [6, '#e84a10'], [3, '#ff9a20'], [1.2, '#fff0a0']]) { path(); g.lineWidth = w; g.strokeStyle = c; g.stroke(); }
}

function tableArt(g) {
  g.fillStyle = '#100404'; g.fillRect(0, 0, W, H);
  const wood = g.createLinearGradient(0, 0, W, 0);
  wood.addColorStop(0, '#3a1408'); wood.addColorStop(0.5, '#1c0804'); wood.addColorStop(1, '#3a1408');
  g.fillStyle = wood; g.fillRect(0, 36, W, H - 36);
  g.save();
  playfieldPath(g); g.clip();
  const field = g.createLinearGradient(0, 40, 0, H);
  field.addColorStop(0, '#3a0c06'); field.addColorStop(0.4, '#24100c'); field.addColorStop(1, '#140808');
  g.fillStyle = field; g.fillRect(0, 0, W, H);
  // a hot sky glow behind the volcano
  const glow = g.createRadialGradient(150, 150, 8, 150, 150, 170);
  glow.addColorStop(0, 'rgba(255, 120, 30, 0.45)'); glow.addColorStop(1, 'rgba(255, 60, 10, 0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // cracked basalt: dark plates and their seams
  for (let i = 0; i < 46; i++) {
    const x = 14 + hash(i) * 252, y = 60 + hash(i + 40) * 420, r = 10 + hash(i + 80) * 16;
    g.fillStyle = `rgba(0, 0, 0, ${0.12 + hash(i + 5) * 0.16})`;
    g.beginPath();
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + hash(i + k) * 0.6; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7); }
    g.fill();
  }
  g.strokeStyle = 'rgba(255, 110, 30, 0.18)'; g.lineWidth = 0.8;
  for (let i = 0; i < 30; i++) {
    let x = 14 + hash(i + 200) * 252, y = 60 + hash(i + 300) * 420;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (hash(i * 7 + k) - 0.5) * 22; y += 4 + hash(i * 3 + k) * 10; g.lineTo(x, y); }
    g.stroke();
  }
  // the volcano: a dark cone, lava spilling down its sides into two rivers that run to the flippers
  const cone = g.createLinearGradient(0, 150, 0, 240);
  cone.addColorStop(0, '#4a2014'); cone.addColorStop(1, '#22100a');
  g.fillStyle = cone;
  g.beginPath(); g.moveTo(128, 156); g.lineTo(172, 156); g.lineTo(222, 244); g.lineTo(78, 244); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0, 0, 0, 0.5)'; g.lineWidth = 1;
  for (const x of [100, 120, 180, 200]) { g.beginPath(); g.moveTo(150 + (x - 150) * 0.3, 160); g.lineTo(x, 244); g.stroke(); }
  river(g, [[138, 190], [118, 236], [104, 282], [76, 330], [64, 362]]);
  river(g, [[162, 190], [182, 236], [196, 282], [224, 330], [234, 362]]);
  river(g, [[150, 250], [146, 300], [150, 350], [140, 420], [140, 470]]);
  for (let i = 0; i < 70; i++) {   // embers frozen in the rock
    const x = 14 + hash(i + 500) * 252, y = 50 + hash(i + 600) * 430;
    g.fillStyle = hash(i + 700) < 0.5 ? 'rgba(255, 170, 40, 0.6)' : 'rgba(255, 80, 20, 0.5)';
    g.fillRect(x, y, hash(i + 800) < 0.8 ? 0.8 : 1.5, hash(i + 800) < 0.8 ? 0.8 : 1.5);
  }
  // the big faded Charizard flame under everything
  g.globalAlpha = 0.14; g.fillStyle = '#ffb030';
  g.beginPath(); g.moveTo(140, 300); g.bezierCurveTo(90, 360, 120, 420, 140, 430); g.bezierCurveTo(160, 420, 190, 360, 140, 300); g.fill();
  g.globalAlpha = 1;
  // lanes' floors: the plunger lane, the orbit, the ramps' mouths, the top lanes
  g.fillStyle = 'rgba(0, 0, 0, 0.4)';
  g.fillRect(268, 150, 20, 410); g.fillRect(240, 196, 28, 110); g.fillRect(50, 210, 44, 44); g.fillRect(206, 206, 34, 46);
  for (const x of LANES) g.fillRect(x - 18, 92, 36, 24);
  g.strokeStyle = 'rgba(255, 255, 255, 0.07)'; g.lineWidth = 1;
  for (let y = 180; y < 480; y += 8) { g.beginPath(); g.moveTo(270, y); g.lineTo(286, y); g.stroke(); }
  // the apron round the flippers and the drain
  const apron = g.createLinearGradient(0, 430, 0, H);
  apron.addColorStop(0, '#3a1408'); apron.addColorStop(1, '#180804');
  g.fillStyle = apron;
  g.beginPath(); g.moveTo(34, 432); g.lineTo(95, 465); g.lineTo(104, 520); g.lineTo(34, 520); g.fill();
  g.beginPath(); g.moveTo(246, 432); g.lineTo(185, 465); g.lineTo(176, 520); g.lineTo(246, 520); g.fill();
  g.fillStyle = 'rgba(0, 0, 0, 0.5)'; g.fillRect(104, 500, 72, 20);
  g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.fillRect(12, 440, 22, 80); g.fillRect(246, 440, 22, 80);
  g.restore();

  // inserts: dim; lit ones are drawn over them each frame
  for (const x of LANES) lampInsert(g, x, LANE_Y, 6, '#ffb030');
  label(g, 'H', 112, 84, 9, '#ffd8a0'); label(g, 'O', 150, 84, 9, '#ffd8a0'); label(g, 'T', 188, 84, 9, '#ffd8a0');
  for (const tg of TARGETS) lampInsert(g, tg.x, TGT_Y + 14, 5.5, '#ff6020');
  for (const tg of TARGETS) label(g, tg.l, tg.x, TGT_Y + 14, 8, '#ffe0c0');
  for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(0, 0, 0, 0.5)'; g.fillRect(101 + i * 10, 237, 8, 6); g.fillStyle = 'rgba(255, 90, 20, 0.25)'; g.fillRect(102 + i * 10, 238, 6, 4); }
  label(g, 'HEAT', 150, 252, 8, '#ffb080');
  arrowInsert(g, CRATER.x, 204, 7, -Math.PI / 2, '#ff3010');
  for (let i = 0; i < 3; i++) arrowInsert(g, 72, 290 - i * 13, 7, -Math.PI / 2, '#ff8a20');
  label(g, 'FLAME', 72, 306, 8, '#ffc890');
  for (let i = 0; i < 3; i++) arrowInsert(g, 222, 290 - i * 13, 7, -Math.PI / 2, '#ffd030');
  label(g, 'BLAZE', 222, 306, 8, '#ffe8a0');
  for (let i = 0; i < 2; i++) arrowInsert(g, 254, 284 - i * 14, 6, -Math.PI / 2, '#ff6040');
  label(g, 'ORBIT', 254, 262, 8, '#ffc0b0', -Math.PI / 2);
  MULT.forEach((x, i) => { lampInsert(g, x, MULT_Y, 8, '#ff9a30'); label(g, `${i + 2}×`, x, MULT_Y, 8, '#ffe0b0'); });
  label(g, 'BONUS', 140, MULT_Y + 15, 8, '#ffcf9a');
  lampInsert(g, 140, 478, 7, '#ff5050'); label(g, 'SAVE', 140, 492, 8, '#ffb0b0');
  for (const x of [23, 45, 235, 257]) lampInsert(g, x, 400, 4.5, x === 23 || x === 257 ? '#ff5050' : '#ffb030');
  label(g, 'CHARIZARD\'S', 64, 506, 8, '#ffb040'); label(g, 'VOLCANO', 216, 506, 9, '#ffb040');
  label(g, 'LAUNCH', 278, 420, 8, '#ffb040', -Math.PI / 2);
  // the crater: a glowing throat in a ring of black rock
  g.fillStyle = '#1a0804'; g.beginPath(); g.ellipse(CRATER.x, CRATER.y, 15, 18, 0, 0, TAU); g.fill();
  const throat = g.createRadialGradient(CRATER.x, CRATER.y, 2, CRATER.x, CRATER.y, 13);
  throat.addColorStop(0, '#fff0a0'); throat.addColorStop(0.4, '#ff8a20'); throat.addColorStop(1, '#5a1004');
  g.fillStyle = throat; g.beginPath(); g.ellipse(CRATER.x, CRATER.y, 11, 13, 0, 0, TAU); g.fill();
  // standup targets' faces, the Slugma bumpers' bases
  for (const tg of TARGETS) { g.fillStyle = '#e8d8c8'; g.fillRect(tg.x - 7, TGT_Y - 2.5, 14, 5); g.fillStyle = '#c83010'; g.fillRect(tg.x - 6, TGT_Y - 1.5, 12, 3); }
  for (const p of BUMPERS) {
    g.fillStyle = '#0a0404'; g.beginPath(); g.arc(p.x, p.y + 2, BR + 3, 0, TAU); g.fill();
    g.fillStyle = '#d8a060'; g.beginPath(); g.arc(p.x, p.y, BR + 2, 0, TAU); g.fill();
    g.fillStyle = '#5a1808'; g.beginPath(); g.arc(p.x, p.y, BR - 1, 0, TAU); g.fill();
  }
  slingArt(g, SLINGS, '#d04010', '#4a1004');
  rails(g, WALLS.filter(w => !(w[0] >= 136 && w[0] <= 164 && w[1] >= 150 && w[1] <= 192)), ['#1a0804', '#b4aca8', '#ffffff']);
  g.lineCap = 'round';   // the crater's lip: black rock, not chrome
  for (const [w, c] of [[7, '#0a0402'], [4, '#3a1a10']]) { g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.moveTo(136, 192); g.lineTo(136, 160); g.lineTo(150, 152); g.lineTo(164, 160); g.lineTo(164, 192); g.stroke(); }
  g.strokeStyle = '#ffb030'; g.lineWidth = 1.5;   // a gold inner rail along the arch
  g.beginPath();
  for (let i = 0; i <= 40; i++) { const a = Math.PI + i / 40 * Math.PI; g.lineTo(ARCH.x + Math.cos(a) * (ARCH.rx - 5), ARCH.y + Math.sin(a) * (ARCH.ry - 5)); }
  g.stroke();
  gateArt(g, [288, 146, 262, 172]); gateArt(g, DEFLECT);
  for (const x of [93, 131, 169, 207]) for (const y of [92, 116]) {   // posts with orange rubbers
    g.fillStyle = '#e86018'; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill();
    g.fillStyle = '#ffe0b0'; g.beginPath(); g.arc(x - 1, y - 1, 1.2, 0, TAU); g.fill();
  }
  for (const [x, y] of [[92, 470], [188, 470], [38, 290]]) { g.fillStyle = '#1c0804'; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); }
  g.fillStyle = '#2a1a16'; g.fillRect(268, 494, 20, 26);
  g.strokeStyle = 'rgba(255, 255, 255, 0.15)'; g.strokeRect(268.5, 494.5, 19, 25);
}

/** Both ramps' plastic, tinted flame and blaze, and their signs. */
function rampsArt(g) {
  rampArt(g, R_RAMP, ['rgba(255, 240, 170, 0.5)', 'rgba(240, 160, 30, 0.5)']);
  rampArt(g, L_RAMP, ['rgba(255, 210, 160, 0.55)', 'rgba(230, 80, 20, 0.55)']);
  g.font = '800 8px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [x, text, bg] of [[72, 'FLAME', '#ff9a30'], [222, 'BLAZE', '#ffd84a']]) {
    g.fillStyle = bg; g.strokeStyle = '#5a1a04'; g.lineWidth = 1;
    g.beginPath(); g.rect(x - 18, 224, 36, 12); g.fill(); g.stroke();
    g.fillStyle = '#4a0c04'; g.fillText(text, x, 230.5);
  }
}

const BALL = (g) => {   // a Repeat Ball: an orange top with gold rings, a yellow bottom
  g.fillStyle = '#f06018'; g.fillRect(-8, -8, 16, 8);
  g.fillStyle = '#f8d040'; g.fillRect(-8, 0, 16, 8);
  g.strokeStyle = '#ffd030'; g.lineWidth = 1.2;
  for (const x of [-4.5, 4.5]) { g.beginPath(); g.arc(x, -4, 2.2, 0, TAU); g.stroke(); }
  g.fillStyle = '#202028'; g.fillRect(-8, -1.1, 16, 2.2);
  g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.fill();
};

export const TABLE = {
  id: 'volcano', title: 'Charizard\'s Volcano Pinball', colour: '#f06a20', W, H,
  grav: 680, maxV: 1250, walls: WALLS, slings: SLINGS,
  flippers: [
    { s: 'l', x: 92, y: 470, len: 38, rest: 0.52, up: -0.5 },
    { s: 'r', x: 188, y: 470, len: 38, rest: Math.PI - 0.52, up: Math.PI + 0.5 },
    { s: 'l', x: 38, y: 290, len: 30, rest: 0.5, up: -0.42 },
  ],
  ball: { key: 'repeat', paint: BALL },
  flip: { edge: '#120604', face: '#3e383c', rubber: '#ff7a1a', pivot: '#ffb030' },
  dmd: '#ff7a1a', bezel: '#ff9a30',
  art: tableArt,
  intro: 'Time the LAUNCH, then flip with ◀ ▶ or the screen\'s halves!',
  go: 'LAUNCH into the flashing HOT lane for a Skill Shot. ◀ works both left flippers.',
  sounds: ['hit-weak', 'stat-up', 'coins', 'catch-success', 'charmander', 'charmeleon', 'charizard', 'fx-crackle', 'fx-steam', 'fw-boom', 'fx-zap'],
  help: [
    ['◀ ▶ flip (or tap the halves); ◀ works both left flippers.', 'LAUNCH fires the plunger: roll through the flashing H-O-T lane for a Skill Shot. All three lit raises the bonus.'],
    ['The FLAME and BLAZE ramps cross over the volcano.', 'Shoot ramps and the orbit back to back for Combos: each one inside 3 seconds scores more.'],
    ['Ramps, the orbit, Slugma and F-I-R-E heat the volcano.', 'At full HEAT the crater lights: sink it for ERUPTION, three-ball multiball with Jackpots on every ramp.'],
    ['Hit all four F-I-R-E targets to evolve Charmander.', 'Charizard lights BLAST BURN: the next crater shot is the table\'s biggest award.'],
    ['3 balls, each starting with a ball saver.', 'A first Blast Burn and a third Eruption each give an extra ball.'],
  ],
  make(t) {
    const lit = { bump: [0, 0, 0], lanes: [false, false, false], tgt: [false, false, false, false], tflash: [0, 0, 0, 0], inl: [0, 0, 0, 0] };
    let heat = 0, ready = false, erupt = false, eruptions = 0, evo = 0, blast = false, burns = 0;
    let combo = 0, lastShot = -9, clock = 0, skill = 0, skillT = 0, fly = null, burst = 0;
    let bonus = {};
    const embers = [];

    const warm = (n) => {
      if (erupt || ready) return;
      heat = Math.min(100, heat + n);
      if (heat >= 100) { ready = true; t.say('CRATER IS LIT!', 2.5); t.api.say('The volcano is at full HEAT! Sink the crater for ERUPTION!'); t.sound('fx-steam', 'stat-up'); }
    };
    const shot = (kind) => {
      combo = clock - lastShot < 3 ? combo + 1 : 1;
      lastShot = clock;
      if (combo > 1) { t.add(2500 * (combo - 1)); t.say(`COMBO ×${combo}`, 1.4); if (combo >= 3) t.shout(`${combo}× COMBO!`, '#ffb030'); t.stat('combo'); }
      return kind;
    };
    const rampDone = (which) => {
      t.stat(which); bonus.ramps++; warm(20); shot(which);
      if (erupt) {
        const pts = 10000 + 5000 * eruptions;
        t.add(pts); t.shout('JACKPOT!', '#ffe060'); t.boom(which === 'leftRamp' ? 235 : 45, 360, '#ffb030', 24, 1.2);
        t.sound('coins', 'stat-up'); t.api.say(`Jackpot! +${pts.toLocaleString()}`); t.stat('jackpot');
        return;
      }
      t.add(1500 * Math.max(1, combo)); t.sound('fx-ding', 'plink-2');
      if (combo <= 1) t.say(`${which === 'leftRamp' ? 'FLAME' : 'BLAZE'} RAMP ${1500}`, 1.4);
    };
    const evolve = () => {
      lit.tgt = [false, false, false, false]; bonus.evos++; t.stat('evolve');
      if (evo < 2) {
        evo++;
        t.add(5000 * evo); t.shout(`${EVO_NAME[evo].toUpperCase()}!`, '#ffb030');
        t.sound(EVO[evo], 'stat-up'); t.boom(22, 340, '#ffb030', 22, 1);
        t.api.say(`${EVO_NAME[evo - 1]} evolved into ${EVO_NAME[evo]}!${evo === 2 ? ' BLAST BURN is lit: shoot the crater!' : ''}`);
        if (evo === 2) { blast = true; t.say('BLAST BURN IS LIT', 2.6); }
      } else { t.add(10000); t.say('F-I-R-E 10000'); t.sound('stat-up'); }
    };
    const crater = (b) => {
      t.stat('crater');
      t.hold(b, CRATER.x, CRATER.y, erupt ? 0.7 : 1.1, () => {
        const sgn = Math.random() < 0.5 ? -1 : 1;
        t.spawn(CRATER.x + sgn * 4, 138, sgn * (140 + Math.random() * 120), -(160 + Math.random() * 120));
        burst = 0.6;
        t.sound('fx-steam', 'plink-1');
      });
      t.sound('fx-bloop', 'select');
      if (blast) {
        const pts = 50000 + 25000 * burns;
        blast = false; burns++; evo = 0; bonus.burns++;
        t.add(pts); t.shout('BLAST BURN!', '#ff6020'); t.boom(CRATER.x, CRATER.y, '#ff6020', 40, 1.6);
        t.sound('charizard', 'stat-up'); t.stat('blastBurn');
        t.api.say(`Charizard used Blast Burn! +${pts.toLocaleString()}`);
        fly = { t: 0 };
        if (burns === 1) t.extraBall('Your first Blast Burn: an extra ball!');
        return;
      }
      if (erupt) {
        const sup = t.inPlay() >= 3, pts = sup ? 75000 : 20000;
        t.add(pts); t.shout(sup ? 'SUPER JACKPOT!' : 'JACKPOT!', sup ? '#ff60e0' : '#ffe060');
        t.boom(CRATER.x, CRATER.y, '#ffe060', sup ? 40 : 26, sup ? 1.6 : 1.2); t.sound('coins', 'stat-up');
        t.api.say(`${sup ? 'Super Jackpot' : 'Jackpot'}! +${pts.toLocaleString()}`); t.stat(sup ? 'superJackpot' : 'jackpot');
        return;
      }
      if (ready) {
        ready = false; heat = 0; erupt = true; eruptions++; bonus.erupts++; t.stat('eruption');
        t.add(10000); t.shout('ERUPTION!', '#ff5020'); t.boom(CRATER.x, CRATER.y, '#ff6020', 44, 1.7);
        t.sound('fw-boom', 'stat-up');
        t.startMulti(2, 'ERUPTION! Three balls: every ramp is a Jackpot, the crater with all three up a Super Jackpot!');
        if (eruptions === 3) t.extraBall('A third Eruption: an extra ball!');
        return;
      }
      t.add(2000); warm(10); t.say('CRATER 2000', 1.4);
    };

    return {
      newBall() {
        skill = Math.floor(Math.random() * 3); skillT = 0; combo = 0; erupt = false;
        lit.lanes = [false, false, false];
        bonus = { ramps: 0, targets: 0, orbits: 0, bumps: 0, evos: 0, erupts: 0, burns: 0 };
      },
      launch() { skillT = 5; },
      press(s) { if (s === 'l') lit.lanes.push(lit.lanes.shift()); else lit.lanes.unshift(lit.lanes.pop()); },
      sling() { warm(1); },
      multiEnd() { erupt = false; },
      ball(b, h, py) {
        if (!b.lane && b.vy > 0 && side(b, DEFLECT) > 0) hitSeg(b, ...DEFLECT, 0.2);
        BUMPERS.forEach((p, i) => {
          if (!bump(b, p.x, p.y, BR, 300)) return;
          if (lit.bump[i] < 0.05) { t.add(100); bonus.bumps++; warm(3); t.sound(i % 2 ? 'plink-2' : 'plink-1'); t.boom(b.x, b.y, '#ffb040', 5, 0.2); t.stat('bumper'); }
          lit.bump[i] = 0.14;
        });
        TARGETS.forEach((tg, i) => {
          const c = hitSeg(b, tg.x - 7, TGT_Y, tg.x + 7, TGT_Y, 0.55);
          if (!c || c.vn > -50 || lit.tflash[i] > 0.1) return;
          lit.tflash[i] = 0.25; bonus.targets++; warm(5); t.stat('target');
          if (!lit.tgt[i]) { lit.tgt[i] = true; t.add(300); t.sound('hit-weak', 'plink-2'); } else t.add(100);
          if (lit.tgt.every(Boolean)) evolve();
        });
        const cross = (y) => (py < y) !== (b.y < y);
        if (cross(LANE_Y)) LANES.forEach((x, i) => {
          if (Math.abs(b.x - x) > 14) return;
          if (skillT > 0 && i === skill && t.launched) { t.add(5000); warm(25); t.shout('SKILL SHOT!', '#ffe060'); t.sound('stat-up'); t.boom(x, LANE_Y, '#ffe060', 20); t.stat('skillShot'); }
          skillT = 0; t.stat('lane');
          if (!lit.lanes[i]) { lit.lanes[i] = true; t.add(500); t.sound('fx-ding', 'plink-2'); } else t.add(100);
          if (lit.lanes.every(Boolean)) {
            lit.lanes = [false, false, false];
            if (t.mult < 5) { t.mult++; t.shout(`BONUS ${t.mult}×`, '#ffb050'); } else { t.add(5000); t.shout('BONUS MAX', '#ffb050'); }
            t.sound('stat-up');
          }
        });
        if (cross(400) && b.vy > 0) {
          const j = b.x < 34 ? 0 : b.x < 56 ? 1 : b.x > 246 ? 3 : b.x > 224 ? 2 : -1;
          if (j >= 0) { lit.inl[j] = 1.2; if (j === 1 || j === 2) t.add(200); }
        }
        if (b.x > 242 && b.x < 268 && cross(250) && b.vy < 0) {
          t.stat('orbit'); bonus.orbits++; warm(15); shot('orbit');
          t.add(750 * Math.max(1, combo)); if (combo <= 1) t.say('ORBIT 750', 1.3); t.sound('fx-ding', 'plink-2');
        }
        if (b.y > 222 && b.y < 248 && b.vy < -200) {
          if (b.x > 58 && b.x < 88) t.ride(b, L_RAMP, 540, () => rampDone('leftRamp'));
          else if (b.x > 212 && b.x < 234) t.ride(b, R_RAMP, 540, () => rampDone('rightRamp'));
        }
        if (!b.gone && Math.hypot(b.x - CRATER.x, b.y - CRATER.y) < 12 && Math.hypot(b.vx, b.vy) < 700) crater(b);
      },
      tick(dt) {
        clock += dt;
        if (skillT > 0) skillT = Math.max(0, skillT - dt);
        lit.bump.forEach((v, i) => { lit.bump[i] = Math.max(0, v - dt); });
        lit.tflash.forEach((v, i) => { lit.tflash[i] = Math.max(0, v - dt); });
        lit.inl.forEach((v, i) => { lit.inl[i] = Math.max(0, v - dt); });
        burst = Math.max(0, burst - dt);
        if (fly && (fly.t += dt) > 2.2) fly = null;
        if (fly && Math.random() < 0.6) t.boom(-30 + fly.t * 170 - 18, 268 + Math.sin(fly.t * 5) * 14, Math.random() < 0.5 ? '#ff6020' : '#ffd030', 2, 0);
        if ((erupt || burst) && Math.random() < (erupt ? 0.35 : 0.6)) t.boom(CRATER.x + (Math.random() - 0.5) * 10, CRATER.y - 10, Math.random() < 0.5 ? '#ff5010' : '#ffc030', 2, 0);
        // a few embers drifting up off the lava, cosmetic
        if (embers.length < 14 && Math.random() < dt * 8) embers.push({ x: 40 + Math.random() * 200, y: 300 + Math.random() * 150, v: 14 + Math.random() * 20, t: 1.6 + Math.random() * 1.2 });
        for (let i = embers.length - 1; i >= 0; i--) { const e = embers[i]; e.y -= e.v * dt; e.x += Math.sin(clock * 3 + i) * 6 * dt; if ((e.t -= dt) <= 0) embers.splice(i, 1); }
      },
      under(g, now) {
        const blink = (r) => t.blink(now, r);
        for (const e of embers) { g.globalAlpha = Math.min(1, e.t) * 0.8; g.fillStyle = e.t % 0.4 < 0.2 ? '#ffd040' : '#ff6a20'; g.fillRect(e.x, e.y, 1.6, 1.6); }
        g.globalAlpha = 1;
        // the crater breathes; brighter when lit
        const pulse = 0.5 + 0.5 * Math.sin(now / (ready || erupt ? 120 : 600));
        t.glow(g, CRATER.x, CRATER.y, 12 + pulse * 3, ready || erupt || blast ? '#ffd040' : '#ff6020', (ready || erupt || blast ? 0.5 : 0.18) + pulse * 0.15);
        if ((ready || blast) && blink(180)) { g.fillStyle = blast ? '#ff3010' : '#ffd040'; arrowPath(g, CRATER.x, 204, 7, -Math.PI / 2); g.fill(); }
        LANES.forEach((x, i) => {
          if (lit.lanes[i]) t.glow(g, x, LANE_Y, 6, '#ffc040');
          else if ((skillT > 0 || !t.launched) && i === skill && blink(120)) t.glow(g, x, LANE_Y, 6, '#ffffff');
        });
        TARGETS.forEach((tg, i) => { if (lit.tgt[i] || lit.tflash[i]) t.glow(g, tg.x, TGT_Y + 14, 5.5, lit.tflash[i] ? '#ffffff' : '#ff7020', 0.85); });
        for (let i = 0; i < 10; i++) if (heat >= (i + 1) * 10 || ready) { g.fillStyle = ready && blink(150) ? '#ffffff' : i < 5 ? '#ffb030' : i < 8 ? '#ff7020' : '#ff3010'; g.fillRect(102 + i * 10, 238, 6, 4); }
        const chev = (x, colour, on) => { for (let i = 0; i < 3; i++) if (on(i)) { g.fillStyle = colour; arrowPath(g, x, 290 - i * 13, 7, -Math.PI / 2); g.fill(); } };
        const fresh = clock - lastShot < 3;
        chev(72, erupt ? '#ffe060' : '#ff8a20', (i) => (erupt && blink(140)) || (fresh && combo > i));
        chev(222, erupt ? '#ffe060' : '#ffd030', (i) => (erupt && blink(140)) || (fresh && combo > i));
        if (fresh && blink(200)) for (let i = 0; i < 2; i++) { g.fillStyle = '#ff6040'; arrowPath(g, 254, 284 - i * 14, 6, -Math.PI / 2); g.fill(); }
        MULT.forEach((x, i) => { if (t.mult >= i + 2) { t.glow(g, x, MULT_Y, 8, '#ff9a30', 0.75); g.fillStyle = '#fff'; g.font = '800 8px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`${i + 2}×`, x, MULT_Y); } });
        [23, 45, 235, 257].forEach((x, i) => { if (lit.inl[i]) t.glow(g, x, 400, 4.5, i === 0 || i === 3 ? '#ff5050' : '#ffb030', Math.min(1, lit.inl[i] * 2)); });
        if (t.save > 0 && (t.save > 3 || blink(120))) t.glow(g, 140, 478, 7, '#ff5050');
        BUMPERS.forEach((p, i) => {
          if (lit.bump[i]) t.glow(g, p.x, p.y, BR + 5, '#ffb040', 0.8);
          drawMon(g, 'slugma', p.x, p.y + 12 - (lit.bump[i] ? 2 : 0), 24);
        });
        // the Charmander line by the upper flipper, hopping when it's one step from Charizard
        const hop = blast ? Math.abs(Math.sin(now / 160)) * 3 : 0;
        drawMon(g, EVO[evo], 23, 356 - hop, evo === 2 ? 34 : 26);
      },
      over(g, now) {
        stamp(g, 'volcano-ramps', 0, 0, W, H, rampsArt);
        if (fly) {
          const x = -30 + fly.t * 170, y = 268 + Math.sin(fly.t * 5) * 14;
          t.glow(g, x, y - 20, 30, '#ff8a20', 0.25);
          drawMon(g, 'charizard', x, y, 60, true);
        }
      },
      dmd(now) {
        const lines = [`BALL ${t.ball}  BONUS ${t.mult}X`,
          erupt ? 'ERUPTION · JACKPOTS LIT' : ready ? 'CRATER LIT · SHOOT IT' : `HEAT ${heat}%`,
          blast ? 'BLAST BURN LIT · CRATER' : `F-I-R-E ${lit.tgt.filter(Boolean).length}/4 ${EVO_NAME[evo].toUpperCase()}`,
          `ERUPTIONS ${eruptions}  BURNS ${burns}`];
        return lines[Math.floor(now / 2200) % lines.length];
      },
      bonus: () => bonus.ramps * 1000 + bonus.targets * 250 + bonus.orbits * 500 + bonus.bumps * 20 + bonus.evos * 2500 + bonus.erupts * 5000 + bonus.burns * 10000,
      overLine: () => burns ? `${burns} Blast Burn${burns > 1 ? 's' : ''}!` : eruptions ? `${eruptions} Eruption${eruptions > 1 ? 's' : ''}!` : 'Last ball down!',
    };
  },
};

export const openCharizard = (onClose) => openTable(TABLE, onClose);
