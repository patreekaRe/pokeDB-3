/* arcade-berry.js  -  Pachirisu Berry Catch, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick, in place
   of Jigglypuff's Sing-Along): Berries drop from the tree overhead and Pachirisu dashes along the ground to catch them.
   Catches in a row build a combo that multiplies the points, up to x5. Since 2026-10-17 (the user's ask: every arcade
   game far more detailed, with more in it) it's played in stages: catch a stage's quota of Berries to clear it for a
   bonus, the day turning to sunset, night and dawn as they pass. Each stage drops faster and thicker, with more Pineco:
   from stage 3 two at once and gusts of wind that blow everything sideways, from stage 4 Pineco that weave, from stage
   5 heavy Forretress. Rare Berries help: a Lum Berry gives a heart back, an Enigma Berry turns Pachirisu into a magnet,
   a Kee Berry slows the fall; a Starf Berry is gold. A plain Berry that hits the ground costs a heart, and so does a
   Pineco caught. Three hearts. Drag or tap where Pachirisu should go, or use the arrow keys. */

import { runArcade, drawMon, rand, banner, stamp } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 300, H = 380, GROUND = 340, PW = 46, CATCH_Y = GROUND - 30, HEARTS = 3, RUN = 330, TAU = Math.PI * 2;
/* what falls: points, weight in the drop table, the first stage it falls in, size, its picture in assets/items, and
   whether letting it land costs a heart */
const KINDS = {
  oran: { pts: 10, w: 56, from: 1, r: 11, img: 'oran-berry', must: true },
  pecha: { pts: 15, w: 24, from: 1, r: 11, img: 'pecha-berry', must: true },
  sitrus: { pts: 25, w: 13, from: 1, r: 12, img: 'sitrus-berry', must: true },
  starf: { pts: 100, w: 2.5, from: 1, r: 13, img: 'starf-berry', gold: true },
  lum: { pts: 20, w: 2, from: 2, r: 12, img: 'lum-berry', power: 'heal' },
  enigma: { pts: 20, w: 2.2, from: 2, r: 12, img: 'enigma-berry', power: 'magnet' },
  kee: { pts: 20, w: 2, from: 3, r: 12, img: 'kee-berry', power: 'slow' },
  pineco: { r: 15, bad: true, mon: 'pineco', from: 1 },
  weaver: { r: 15, bad: true, mon: 'pineco', from: 4, weave: true },
  forretress: { r: 22, bad: true, mon: 'forretress', from: 5, heavy: true },
};
const POWER = { magnet: 7, slow: 5 };
const POWER_LOOK = { magnet: ['MAGNET', '#c070ff'], slow: ['SLOW', '#60d8ff'] };
const quota = (stage) => 12 + stage * 3;
const pics = new Map();
const pic = (id) => {
  if (!pics.has(id)) { const img = new Image(); img.src = `assets/items/${id}.png`; pics.set(id, img); }
  return pics.get(id);
};

/* four skies, turning every two stages: [top, bottom, hills near, hills far, sun or moon, label, as it turns] */
const SKIES = [
  ['#7ac8f8', '#d8f0ff', '#8ccc70', '#b8e0a0', 'sun', 'Morning', 'Morning comes.'],
  ['#f08a5a', '#ffd8a0', '#7a9a50', '#c09868', 'sunset', 'Sunset', 'The sun sets.'],
  ['#0c1438', '#2a3a78', '#2a4a3a', '#1a2a48', 'moon', 'Night', 'Night falls.'],
  ['#9a8ad8', '#ffd0d8', '#7ab070', '#b0a0c8', 'dawn', 'Dawn', 'Dawn breaks.'],
];
const sky = (stage) => (Math.floor((stage - 1) / 2)) % SKIES.length;

/** The world painted once a sky and a scale (the tree, hills, fence, flowers never change), copied in each frame:
    repainting it every frame made the game stutter. */
function scenery(g, i) {
  const [top, bottom, near, far, light] = SKIES[i];
  const s = g.createLinearGradient(0, 0, 0, GROUND); s.addColorStop(0, top); s.addColorStop(1, bottom);
  g.fillStyle = s; g.fillRect(0, 0, W, GROUND);
  if (light === 'moon') {
    g.fillStyle = '#fff';
    for (let k = 0; k < 40; k++) { const x = (k * 71) % W, y = 60 + (k * 37) % 190; g.globalAlpha = 0.3 + (k % 4) * 0.18; g.fillRect(x, y, 1.4, 1.4); }
    g.globalAlpha = 1;
    const m = g.createRadialGradient(238, 96, 4, 238, 96, 50); m.addColorStop(0, 'rgba(255, 250, 220, 0.5)'); m.addColorStop(1, 'rgba(255, 250, 220, 0)');
    g.fillStyle = m; g.fillRect(180, 40, 120, 120);
    g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(238, 96, 17, 0, TAU); g.fill();
    g.fillStyle = 'rgba(200, 190, 160, 0.5)'; for (const [x, y, r] of [[232, 90, 4], [244, 102, 3], [240, 88, 2]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  } else {
    const [x, y, c] = light === 'sun' ? [236, 92, '#fff4a0'] : light === 'sunset' ? [150, 238, '#ffb040'] : [60, 230, '#ffe0c0'];
    const glow = g.createRadialGradient(x, y, 6, x, y, 80); glow.addColorStop(0, c); glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    g.fillStyle = glow; g.fillRect(x - 80, y - 80, 160, 160);
    g.fillStyle = c; g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (const [cx, cy, k] of [[60, 120, 1], [190, 150, 0.8], [260, 190, 0.6]]) for (const [dx, dy, r] of [[0, 0, 14], [14, -6, 12], [28, 0, 13], [12, 6, 12]]) { g.beginPath(); g.arc(cx + dx * k, cy + dy * k, r * k, 0, TAU); g.fill(); }
  }
  g.fillStyle = far;
  for (const [cx, r] of [[30, 120], [170, 140], [290, 110]]) { g.beginPath(); g.arc(cx, GROUND + 70, r, Math.PI, 0); g.fill(); }
  g.fillStyle = near;
  for (const [cx, r] of [[80, 90], [220, 100]]) { g.beginPath(); g.arc(cx, GROUND + 40, r, Math.PI, 0); g.fill(); }
  g.fillStyle = light === 'moon' ? '#5a4030' : '#a87848'; g.strokeStyle = light === 'moon' ? '#3a2818' : '#6a4828'; g.lineWidth = 1;   // a fence
  g.fillRect(0, GROUND - 26, W, 3); g.fillRect(0, GROUND - 16, W, 3);
  for (let x = 6; x < W; x += 24) { g.fillRect(x, GROUND - 32, 5, 32); g.beginPath(); g.moveTo(x, GROUND - 32); g.lineTo(x + 2.5, GROUND - 36); g.lineTo(x + 5, GROUND - 32); g.fill(); }
  g.fillStyle = '#5a3a20'; g.fillRect(-4, 0, 16, GROUND); g.fillRect(W - 12, 0, 16, GROUND);   // the tree's two trunks
  g.fillStyle = '#7a5230'; g.fillRect(0, 0, 6, GROUND); g.fillRect(W - 9, 0, 4, GROUND);
  const leaf = light === 'moon' ? ['#163a28', '#1e4a30', '#28583a'] : ['#2e7a34', '#3e9a40', '#58b850'];
  g.fillStyle = leaf[0]; g.fillRect(0, 0, W, 30);
  for (let k = 0; k < 11; k++) { g.beginPath(); g.arc(k * 30 + 4, 32 + Math.sin(k * 1.7) * 7, 24, 0, TAU); g.fill(); }
  g.fillStyle = leaf[1];
  for (let k = 0; k < 10; k++) { g.beginPath(); g.arc(k * 32 + 18, 22 + Math.cos(k * 2.1) * 4, 18, 0, TAU); g.fill(); }
  g.fillStyle = leaf[2];
  for (let k = 0; k < 14; k++) { g.beginPath(); g.ellipse(k * 23 + 8, 14 + (k % 3) * 6, 8, 5, k, 0, TAU); g.fill(); }
  const grass = g.createLinearGradient(0, GROUND, 0, H); grass.addColorStop(0, light === 'moon' ? '#2a5a30' : '#6aba48'); grass.addColorStop(1, light === 'moon' ? '#183a20' : '#3a8a30');
  g.fillStyle = grass; g.fillRect(0, GROUND, W, H - GROUND);
  g.fillStyle = light === 'moon' ? '#1a4022' : '#4a9a38';
  for (let k = 0; k < 40; k++) { const x = k * 7.7 + 2; g.beginPath(); g.moveTo(x, GROUND + 2); g.lineTo(x + 1.5, GROUND - 4 - (k % 4) * 2); g.lineTo(x + 3, GROUND + 2); g.fill(); }
  for (let k = 0; k < 12; k++) {   // flowers in the grass
    const x = (k * 53 + 17) % W, y = GROUND + 10 + (k * 23) % 26, c = ['#ff7aa8', '#fff', '#ffe060', '#a8a0ff'][k % 4];
    g.fillStyle = c; for (let p = 0; p < 5; p++) { const a = p * TAU / 5; g.beginPath(); g.arc(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 1.6, 0, TAU); g.fill(); }
    g.fillStyle = '#ffb020'; g.beginPath(); g.arc(x, y, 1.2, 0, TAU); g.fill();
  }
}
const halos = new Map();
/** A soft glow painted once a colour (shadowBlur every frame cost the frame rate). */
function halo(c) {
  if (halos.has(c)) return halos.get(c);
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d'), r = g.createRadialGradient(32, 32, 6, 32, 32, 32);
  r.addColorStop(0, c); r.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  halos.set(c, cv);
  return cv;
}
const heart = (g, hx, hy, k, on) => {
  g.fillStyle = on ? '#e84860' : 'rgba(0, 0, 0, 0.3)';
  g.beginPath(); g.moveTo(hx, hy + 6 * k); g.bezierCurveTo(hx - 9 * k, hy - 2 * k, hx - 4 * k, hy - 9 * k, hx, hy - 3 * k); g.bezierCurveTo(hx + 4 * k, hy - 9 * k, hx + 9 * k, hy - 2 * k, hx, hy + 6 * k); g.fill();
  if (on) { g.fillStyle = 'rgba(255, 255, 255, 0.6)'; g.beginPath(); g.arc(hx - 3.5 * k, hy - 2.5 * k, 1.6 * k, 0, TAU); g.fill(); }
};

export const openBerry = (onClose) => runArcade({
  id: 'berry', title: 'Pachirisu Berry Catch', colour: '#4aa8e8', W, H,
  stick: false,
  sounds: ['fx-pop', 'fx-heal', 'fx-whoosh', 'fx-splash', 'fx-ding'],
  intro: 'Catch the falling Berries! Drag or tap to run.',
  help: [['Drag, or tap where you want Pachirisu to run.', 'The arrow keys work too.'], [`Berries are ${KINDS.oran.pts} to ${KINDS.sitrus.pts}, a golden Starf ${KINDS.starf.pts}.`, 'Catch them in a row for a combo: up to x5.'], ['Catch a stage\'s Berries to clear it.', 'Each stage falls faster, with more Pineco, wind gusts from stage 3 and heavy Forretress later.'], ['Rare Berries help:', 'Lum gives a heart back, Enigma pulls Berries to you, Kee slows the fall.'], ['A Berry that hits the ground costs a heart,', `and so does catching a Pineco. ${HEARTS} hearts.`]],
  make(api) {
    const calm = calmFx();
    let x = W / 2, target = null, held = { left: false, right: false }, face = 1, squash = 0;
    let hearts = HEARTS, combo = 0, wait = 1, hurt = 0, shake = 0, stage = 1, caught = 0, cleared = 0, rest = 0;
    let wind = 0, windT = rand(8, 12), windDir = 1, warn = 0;
    const power = { magnet: 0, slow: 0 };
    const drops = [], pops = [], bits = [], stains = [], leaves = [];
    const d = () => stage - 1;
    const roll = () => {
      const table = Object.entries(KINDS).filter(([, k]) => k.from <= stage && (k.power !== 'heal' || hearts < HEARTS)).map(([id, k]) => [id, k.bad ? (id === 'pineco' ? 7 + d() * 4 : id === 'weaver' ? 3 + d() * 2 : 2 + d() * 1.5) : k.w]);
      let n = Math.random() * table.reduce((s, [, w]) => s + w, 0);
      for (const [k, w] of table) if ((n -= w) < 0) return k;
      return 'oran';
    };
    const drop1 = (kind, px) => {
      const k = KINDS[kind];
      drops.push({ kind, x: px ?? rand(k.r + 14, W - k.r - 14), y: 46, vx: 0, vy: rand(50, 80) + d() * 14 + (k.heavy ? 70 : 0), spin: rand(-2, 2), a: 0, t: rand(0, 6), home: 0 });
      for (let i = 0; i < 4; i++) bits.push({ x: drops.at(-1).x + rand(-8, 8), y: 40, vx: rand(-30, 30), vy: rand(-20, 30), t: 0.6, c: '#3e9a40', leaf: true });
    };
    const spawn = () => {
      drop1(roll());
      if (stage >= 3 && Math.random() < Math.min(0.45, d() * 0.07)) { const a = drops.at(-1).x; drop1(Math.random() < 0.8 ? 'oran' : roll(), a < W / 2 ? rand(W / 2 + 20, W - 26) : rand(26, W / 2 - 20)); }
      wait = rand(0.6, 1.05) * Math.max(0.3, 1 - d() * 0.08);
    };
    const pop = (text, px, py, colour, big = 14) => pops.push({ text, x: px, y: py, colour, big, t: 0 });
    const burst = (px, py, c, n = 8) => { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(40, 120); bits.push({ x: px, y: py, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, t: rand(0.35, 0.6), c }); } };
    const lose = (why) => {
      hearts--; combo = 0; hurt = 0.7; if (!calm) shake = 0.3;
      api.sound('cancel', 'select');
      if (hearts <= 0) api.over(why);
    };
    const nextStage = () => {
      const bonus = 100 * stage;
      api.add(bonus); stage++; caught = 0; cleared = 2.2; rest = 1.4;
      api.sound('stat-up', 'coins');
      const say = stage === 3 ? ' Watch for the wind!' : stage === 4 ? ' Some Pineco weave now!' : stage === 5 ? ' Here come Forretress!' : '';
      api.say(`Stage ${stage - 1} cleared! +${bonus}.${sky(stage) !== sky(stage - 1) ? ` ${SKIES[sky(stage)][6]}` : ''}${say}`);
    };
    for (let i = 0; i < 4; i++) leaves.push({ x: rand(0, W), y: rand(40, GROUND), s: rand(0.6, 1.2), p: rand(0, 6) });
    return {
      tick(dt) {
        hurt = Math.max(0, hurt - dt); shake = Math.max(0, shake - dt); squash = Math.max(0, squash - dt); cleared = Math.max(0, cleared - dt);
        for (const k in power) power[k] = Math.max(0, power[k] - dt);
        const dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
        if (dir) { target = null; x += dir * RUN * dt; face = dir; }
        else if (target !== null) {
          const dd = target - x, step = RUN * 1.15 * dt;
          if (Math.abs(dd) <= step) { x = target; target = null; } else { x += Math.sign(dd) * step; face = Math.sign(dd); }
        }
        x = Math.max(PW / 2, Math.min(W - PW / 2, x));
        if (stage >= 3) {
          if (wind > 0) wind = Math.max(0, wind - dt);
          else if (warn > 0) { warn -= dt; if (warn <= 0) { wind = 2.4 + d() * 0.15; api.sound('fx-whoosh', 'select'); } }
          else if ((windT -= dt) <= 0) { windDir = Math.random() < 0.5 ? -1 : 1; warn = 1.1; windT = rand(9, 14) - Math.min(4, d() * 0.5); api.say(`A gust is coming from the ${windDir > 0 ? 'left' : 'right'}!`); }
        }
        if (rest > 0) rest -= dt;
        else if ((wait -= dt) <= 0) spawn();
        const fall = power.slow ? 0.45 : 1;
        for (let i = drops.length - 1; i >= 0; i--) {
          const o = drops[i], k = KINDS[o.kind], h = dt * fall;
          o.t += h;
          o.vy += (170 + d() * 26 + (k.heavy ? 160 : 0)) * h; o.y += o.vy * h; o.a += o.spin * h;
          if (wind > 0) o.vx += windDir * (110 + d() * 10) * h; else o.vx *= Math.exp(-2 * h);
          if (k.weave) o.vx = Math.cos(o.t * 3.4) * 90 + (wind ? windDir * 60 : 0);
          if (power.magnet && !k.bad && o.y > 110 && Math.abs(o.x - x) < 110) o.x += Math.sign(x - o.x) * Math.min(Math.abs(x - o.x), 170 * dt);
          o.x += o.vx * h;
          if (o.x < k.r + 8) { o.x = k.r + 8; o.vx = Math.abs(o.vx) * 0.5; } else if (o.x > W - k.r - 8) { o.x = W - k.r - 8; o.vx = -Math.abs(o.vx) * 0.5; }
          if (o.y + k.r >= CATCH_Y && o.y - k.r <= CATCH_Y + 16 && Math.abs(o.x - x) < PW / 2 + k.r * 0.6) {
            drops.splice(i, 1);
            if (k.bad) { pop('OUCH!', o.x, CATCH_Y - 20, '#ff8080'); burst(o.x, CATCH_Y, '#c0a050', 12); lose(k.heavy ? 'A Forretress exploded!' : 'A Pineco burst!'); continue; }
            combo++; squash = 0.18;
            const mult = Math.min(5, 1 + Math.floor(combo / 5)), got = k.pts * mult;
            api.add(got);
            pop(`+${got}`, o.x, CATCH_Y - 24, k.gold ? '#ffe060' : k.power ? POWER_LOOK[k.power]?.[1] || '#80ff9a' : '#ffffff');
            burst(o.x, CATCH_Y - 6, k.gold ? '#ffe060' : '#fff', k.gold ? 14 : 6);
            if (k.power === 'heal') { hearts = Math.min(HEARTS, hearts + 1); pop('+1 HEART', x, CATCH_Y - 50, '#ff7a9a', 16); api.sound('fx-heal', 'stat-up'); }
            else if (k.power) { power[k.power] = POWER[k.power]; pop(POWER_LOOK[k.power][0] + '!', x, CATCH_Y - 50, POWER_LOOK[k.power][1], 16); api.sound('fx-ding', 'stat-up'); api.say(k.power === 'magnet' ? 'Enigma Berry! Berries are pulled to you.' : 'Kee Berry! Everything falls slowly.'); }
            else api.sound(k.gold ? 'coins' : mult > 1 ? 'plink-2' : 'plink-1', 'select');
            if (mult > 1 && combo % 5 === 0) { pop(`COMBO x${mult}!`, W / 2, 110, '#ffd84a', 20); api.say(`Combo x${mult}! Keep catching!`); }
            if (k.must && ++caught >= quota(stage)) nextStage();
            continue;
          }
          if (o.y - k.r > GROUND) {
            drops.splice(i, 1);
            if (k.bad) { pop('Phew!', o.x, GROUND - 14, '#c8e8ff'); burst(o.x, GROUND, '#a09070', 6); api.sound('fx-poof', 'select'); continue; }
            if (!k.must) { pop('Missed', o.x, GROUND - 14, '#e0e0e0', 11); continue; }
            pop('Splat!', o.x, GROUND - 14, '#ff9a9a');
            stains.push({ x: o.x, t: 3, c: k.img === 'sitrus-berry' ? '#e8c040' : k.img === 'pecha-berry' ? '#ff90b0' : '#4a7ae0' });
            burst(o.x, GROUND, stains.at(-1).c, 10);
            api.sound('fx-splash', 'cancel');
            lose('Too many Berries dropped!');
          }
        }
        for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.vy += 300 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if ((b.t -= dt) <= 0) bits.splice(i, 1); }
        for (let i = stains.length - 1; i >= 0; i--) if ((stains[i].t -= dt) <= 0) stains.splice(i, 1);
        for (const l of leaves) { l.y += (24 + l.s * 20) * dt; l.x += (Math.sin(l.p + l.y / 30) * 20 + (wind ? windDir * 160 : 0)) * dt; if (l.y > GROUND || l.x < -10 || l.x > W + 10) { l.y = 30; l.x = rand(0, W); } }
        for (let i = pops.length - 1; i >= 0; i--) if ((pops[i].t += dt) > 0.9) pops.splice(i, 1);
      },
      down(px) { target = px; },
      move(px, py, pressed) { if (pressed) target = px; },
      key(k, down) { if (k === 'left' || k === 'right') held[k] = down; },
      draw(g, now) {
        const sk = sky(stage), night = SKIES[sk][4] === 'moon';
        g.save();
        if (shake) g.translate(Math.sin(now / 20) * shake * 12, Math.cos(now / 26) * shake * 6);
        stamp(g, `berry-sky${sk}`, 0, 0, W, H, (cg) => scenery(cg, sk));
        if (night) for (let i = 0; i < 7; i++) {   // fireflies
          const fx = (i * 47 + Math.sin(now / 900 + i) * 30 + 30) % W, fy = 150 + (i * 29) % 150 + Math.cos(now / 700 + i * 2) * 14;
          g.globalAlpha = 0.4 + 0.4 * Math.sin(now / 200 + i * 1.3); g.drawImage(halo('rgba(220, 255, 120, 0.9)'), fx - 6, fy - 6, 12, 12);
        }
        g.globalAlpha = 1;
        for (let i = 0; i < 7; i++) {   // Berries hanging in the canopy, swaying
          const bx = i * 44 + 18, by = 44 + Math.sin(now / 400 + i) * 1.5 + (i % 2) * 6;
          g.strokeStyle = '#2e5a20'; g.lineWidth = 1; g.beginPath(); g.moveTo(bx, by - 10); g.lineTo(bx, by - 4); g.stroke();
          g.fillStyle = ['#3a7ae0', '#ff8ab0', '#e8c040', '#3a7ae0'][i % 4]; g.beginPath(); g.arc(bx, by, 5, 0, TAU); g.fill();
          g.fillStyle = 'rgba(255, 255, 255, 0.6)'; g.beginPath(); g.arc(bx - 1.6, by - 1.6, 1.4, 0, TAU); g.fill();
        }
        for (const l of leaves) { g.fillStyle = night ? '#2a6a3a' : '#6ac050'; g.save(); g.translate(l.x, l.y); g.rotate(Math.sin(now / 300 + l.p) * 1.2); g.beginPath(); g.ellipse(0, 0, 4 * l.s, 2 * l.s, 0, 0, TAU); g.fill(); g.restore(); }
        for (const s of stains) { g.globalAlpha = Math.min(1, s.t) * 0.6; g.fillStyle = s.c; g.beginPath(); g.ellipse(s.x, GROUND + 4, 12, 3.5, 0, 0, TAU); g.fill(); }
        g.globalAlpha = 1;
        if (wind || warn > 0) {   // the gust's streaks, or its warning arrow
          if (wind) { g.strokeStyle = 'rgba(255, 255, 255, 0.45)'; g.lineWidth = 1.5; for (let i = 0; i < 9; i++) { const wy = 70 + i * 28, wx = ((now / 2.2 * windDir + i * 97) % (W + 60) + W + 60) % (W + 60) - 30; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx - windDir * 28, wy); g.stroke(); } }
          else banner(g, windDir > 0 ? 'GUST →' : '← GUST', W / 2, 90, 18, `rgba(200, 240, 255, ${0.6 + 0.4 * Math.sin(now / 80)})`);
        }
        for (const o of drops) {
          const k = KINDS[o.kind];
          if (k.bad) {
            const sw = k.weave ? Math.sin(o.t * 6) * 0.25 : 0;
            g.save(); g.translate(o.x, o.y); g.rotate(sw);
            if (k.weave) g.drawImage(halo('rgba(255, 110, 60, 0.55)'), -k.r * 1.8, -k.r * 1.8, k.r * 3.6, k.r * 3.6);
            drawMon(g, k.mon, 0, k.r * 1.2, k.r * (k.heavy ? 2.3 : 2.6));
            g.restore();
            continue;
          }
          g.save(); g.translate(o.x, o.y); g.rotate(o.a);
          if (k.gold) g.drawImage(halo('rgba(255, 224, 96, 0.9)'), -k.r * 2.4, -k.r * 2.4, k.r * 4.8, k.r * 4.8);
          else if (k.power) g.drawImage(halo(k.power === 'heal' ? 'rgba(120, 255, 150, 0.8)' : k.power === 'magnet' ? 'rgba(200, 120, 255, 0.8)' : 'rgba(110, 220, 255, 0.8)'), -k.r * 2.2, -k.r * 2.2, k.r * 4.4, k.r * 4.4);
          const img = pic(k.img);
          if (img.complete && img.naturalWidth) { g.imageSmoothingEnabled = false; g.drawImage(img, -k.r * 1.6, -k.r * 1.6, k.r * 3.2, k.r * 3.2); }
          else { g.fillStyle = k.gold ? '#ffd84a' : '#3a7ae0'; g.beginPath(); g.arc(0, 0, k.r, 0, TAU); g.fill(); }
          g.restore();
          if (o.y > 70 && o.y < CATCH_Y - 30) { g.fillStyle = 'rgba(0, 0, 0, 0.12)'; g.beginPath(); g.ellipse(o.x, GROUND + 3, k.r * 0.6, 2, 0, 0, TAU); g.fill(); }
        }
        for (const b of bits) { g.globalAlpha = Math.min(1, b.t * 2.5); g.fillStyle = b.c; if (b.leaf) { g.beginPath(); g.ellipse(b.x, b.y, 3, 1.6, b.t * 8, 0, TAU); g.fill(); } else g.fillRect(b.x - 1.5, b.y - 1.5, 3, 3); }
        g.globalAlpha = 1;
        // Pachirisu, hopping as it runs, squashing on a catch, blinking for a moment after a heart is lost
        const moving = target !== null || held.left || held.right;
        if (power.magnet) { g.globalAlpha = 0.45 + 0.2 * Math.sin(now / 90); g.drawImage(halo('rgba(200, 120, 255, 0.9)'), x - 50, GROUND - 70, 100, 100); g.globalAlpha = 1; }
        g.fillStyle = 'rgba(0, 0, 0, 0.18)'; g.beginPath(); g.ellipse(x, GROUND + 3, 18, 4, 0, 0, TAU); g.fill();
        if (!(hurt > 0 && Math.floor(now / 80) % 2)) {
          const sq = squash / 0.18;
          g.save(); g.translate(x, GROUND + 2 - (moving ? Math.abs(Math.sin(now / 70)) * 5 : 0)); g.scale(1 + sq * 0.18, 1 - sq * 0.16);
          drawMon(g, 'pachirisu', 0, 0, 46, face > 0);
          g.restore();
        }
        if (power.slow) { g.fillStyle = 'rgba(110, 200, 255, 0.1)'; g.fillRect(0, 0, W, H); }
        if (hurt > 0.4) { g.fillStyle = `rgba(255, 40, 60, ${(hurt - 0.4) * 0.6})`; g.fillRect(0, 0, W, H); }
        g.restore();
        for (const p of pops) { g.globalAlpha = 1 - p.t / 0.9; banner(g, p.text, p.x, p.y - p.t * 30, p.big, p.colour); g.globalAlpha = 1; }
        // the HUD: stage and its progress up top, hearts, combo and power-ups along the bottom
        g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.roundRect(W / 2 - 62, 4, 124, 22, 8); g.fill();
        banner(g, `STAGE ${stage}`, W / 2 - 24, 13, 10, '#ffd84a');
        g.fillStyle = 'rgba(255, 255, 255, 0.25)'; g.fillRect(W / 2 + 8, 10, 46, 6);
        g.fillStyle = '#7ae860'; g.fillRect(W / 2 + 8, 10, 46 * Math.min(1, caught / quota(stage)), 6);
        banner(g, `${caught}/${quota(stage)}`, W / 2 + 31, 21, 7, '#fff');
        for (let i = 0; i < HEARTS; i++) heart(g, 14 + i * 20, H - 20, 1, i < hearts);
        const mult = Math.min(5, 1 + Math.floor(combo / 5));
        if (combo > 1) banner(g, `${combo} in a row${mult > 1 ? ` · x${mult}` : ''}`, W - 70, H - 20, 12, mult > 1 ? '#ffd84a' : '#ffffff');
        let px = 82;
        for (const k of ['magnet', 'slow']) if (power[k]) {
          const [label, c] = POWER_LOOK[k];
          g.fillStyle = 'rgba(0, 0, 0, 0.4)'; g.beginPath(); g.roundRect(px, H - 30, 54, 18, 6); g.fill();
          g.fillStyle = c; g.fillRect(px + 3, H - 15, 48 * power[k] / POWER[k], 2);
          banner(g, label, px + 27, H - 22, 9, c);
          px += 58;
        }
        if (cleared) {
          g.globalAlpha = Math.min(1, cleared / 0.5);
          banner(g, 'STAGE CLEAR!', W / 2, 150, 28 + Math.max(0, cleared - 1.9) * 30, '#ffd84a');
          banner(g, `${SKIES[sky(stage)][5]} · Stage ${stage}`, W / 2, 180, 14, '#fff');
          g.globalAlpha = 1;
        }
      },
    };
  },
}, onClose);
