/* arcade-whack.js  -  Whac-a-Diglett, a home arcade game (js/arcade-kit.js). Since 2026-10-17 (the user's ask: every
   arcade game richer, harder and more detailed) it is played in stages: each 20 seconds long with a quota of points to
   reach, the Diglett quicker, shorter-lived and more of them at once every stage, so a good player is pushed rather than
   coasting. Diglett 10, Dugtrio three bonks for 50, a golden Diglett 50 and two more seconds; a Voltorb costs 30 and
   stuns the mallet, an Electrode (stage 3 on) costs 50 and three seconds, and sneaky Diglett (stage 4 on) duck halfway.
   Hits in a row build a combo (x2 at 5, up to x5); a miss (which also stalls the mallet) or one that gets away breaks
   it, and a combo of 20 starts a Fever: Diglett only, popping fast, points doubled. Miss a stage's quota and the game
   is over. */

import { runArcade, drawMon, rand, banner, stamp, sprite } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 300, H = 330, TOPBAR = 40, STAGE_S = 20, FEVER_AT = 20, FEVER_S = 6;
const HOLES = Array.from({ length: 9 }, (_, i) => ({ x: 55 + (i % 3) * 95, y: 128 + Math.floor(i / 3) * 80 }));
const PTS = { diglett: 10, dugtrio: 50, golden: 50, voltorb: -30, electrode: -50 };
const TAU = Math.PI * 2;
const quota = (n) => 120 + (n - 1) * 90 + (n - 1) ** 2 * 10;

const golds = new Map();
/** Diglett washed in gold, copied once (there's no shiny Diglett GIF). */
function goldDiglett() {
  const s = golds.get('d');
  if (s) return s;
  const img = sprite('diglett');
  if (!img.complete || !img.naturalWidth) return null;
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255, 210, 40, 0.62)'; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(80, 60, 0, 0.35)'; x.fillRect(0, 0, c.width, c.height);
  golds.set('d', c);
  return c;
}

/** The field painted once: a sky over far hills, a picket fence, mown grass in stripes, flowers, and the nine holes'
    dirt mounds and dark mouths (their front lips are stamped over the Diglett afterwards). */
function field(g) {
  const sky = g.createLinearGradient(0, 0, 0, 90); sky.addColorStop(0, '#7cc8f8'); sky.addColorStop(1, '#d8f0ff');
  g.fillStyle = sky; g.fillRect(0, 0, W, 90);
  g.fillStyle = 'rgba(255, 255, 255, 0.9)';
  for (const [x, y, s] of [[50, 54, 1], [210, 48, 1.3], [275, 64, 0.8]]) { g.beginPath(); g.ellipse(x, y, 18 * s, 6 * s, 0, 0, TAU); g.ellipse(x + 10 * s, y - 4 * s, 12 * s, 6 * s, 0, 0, TAU); g.fill(); }
  g.fillStyle = '#6aa858'; g.beginPath(); g.moveTo(0, 90);
  for (let x = 0; x <= W; x += 10) g.lineTo(x, 70 - Math.sin(x / 47) * 10 - Math.sin(x / 19) * 3);
  g.lineTo(W, 90); g.fill();
  g.fillStyle = '#4e8e40'; g.beginPath(); g.moveTo(0, 92);
  for (let x = 0; x <= W; x += 10) g.lineTo(x, 80 - Math.cos(x / 31) * 6);
  g.lineTo(W, 92); g.fill();
  const lawn = g.createLinearGradient(0, 84, 0, H); lawn.addColorStop(0, '#8ccc5a'); lawn.addColorStop(1, '#4a9434');
  g.fillStyle = lawn; g.fillRect(0, 84, W, H - 84);
  g.fillStyle = 'rgba(255, 255, 255, 0.07)';
  for (let i = 0; i < 6; i++) g.fillRect(0, 96 + i * 40, W, 20);
  g.fillStyle = '#f4ecd8'; g.strokeStyle = '#a89878'; g.lineWidth = 1;   // the fence
  g.fillRect(0, 80, W, 3); g.fillRect(0, 88, W, 3);
  for (let x = 4; x < W; x += 14) { g.beginPath(); g.moveTo(x, 94); g.lineTo(x, 76); g.lineTo(x + 3, 72); g.lineTo(x + 6, 76); g.lineTo(x + 6, 94); g.closePath(); g.fill(); g.stroke(); }
  for (let i = 0; i < 70; i++) { g.fillStyle = i % 2 ? 'rgba(30, 80, 20, 0.35)' : 'rgba(200, 240, 140, 0.35)'; const x = (i * 53) % W, y = 100 + (i * 37) % (H - 104); g.fillRect(x, y, 1.5, 5); g.fillRect(x + 3, y + 1, 1.5, 4); }
  for (let i = 0; i < 16; i++) {   // flowers
    const x = (i * 71 + 13) % W, y = 104 + (i * 59) % (H - 110);
    if (HOLES.some(h => Math.abs(h.x - x) < 44 && Math.abs(h.y - y) < 26)) continue;
    g.fillStyle = ['#ffffff', '#ffd84a', '#ff8aa8', '#c8a0ff'][i % 4];
    for (let k = 0; k < 5; k++) { const a = k * TAU / 5; g.beginPath(); g.arc(x + Math.cos(a) * 2.2, y + Math.sin(a) * 2.2, 1.6, 0, TAU); g.fill(); }
    g.fillStyle = '#f0a020'; g.beginPath(); g.arc(x, y, 1.2, 0, TAU); g.fill();
  }
  for (const h of HOLES) {
    g.fillStyle = 'rgba(30, 50, 10, 0.35)'; g.beginPath(); g.ellipse(h.x + 3, h.y + 10, 44, 14, 0, 0, TAU); g.fill();
    const mound = g.createRadialGradient(h.x - 10, h.y - 8, 4, h.x, h.y, 46);
    mound.addColorStop(0, '#b88858'); mound.addColorStop(1, '#6a4424');
    g.fillStyle = mound; g.beginPath(); g.ellipse(h.x, h.y + 2, 42, 17, 0, 0, TAU); g.fill();
    for (let k = 0; k < 9; k++) { const a = k * TAU / 9 + 0.3; g.fillStyle = k % 2 ? '#8a6038' : '#a87848'; g.beginPath(); g.arc(h.x + Math.cos(a) * 38, h.y + 2 + Math.sin(a) * 14, 3 + (k % 3), 0, TAU); g.fill(); }
    g.fillStyle = '#2a160a'; g.beginPath(); g.ellipse(h.x, h.y, 31, 10, 0, 0, TAU); g.fill();
    g.fillStyle = '#120804'; g.beginPath(); g.ellipse(h.x, h.y + 2, 26, 7, 0, 0, TAU); g.fill();
  }
}
/** A hole's front lip, stamped over its Diglett so it rises out of the ground: an 84 x 20 box, the hole's middle at 42, 2. */
function lip(g) {
  g.fillStyle = '#8a5c34'; g.beginPath(); g.ellipse(42, 2, 33, 11, 0, 0, Math.PI); g.lineTo(9, 2); g.fill();
  g.fillStyle = '#a87446'; g.beginPath(); g.ellipse(42, 4, 33, 9, 0, 0.15, Math.PI - 0.15); g.lineTo(42, 4); g.fill();
  g.fillStyle = '#c89a62';
  for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(14 + k * 11, 7 + Math.sin(k * 1.7) * 2, 2.2, 0, TAU); g.fill(); }
}
/** The bar along the top: a wooden board for the clock, the stage's quota and the combo. */
function board(g) {
  const wood = g.createLinearGradient(0, 0, 0, TOPBAR); wood.addColorStop(0, '#8a5a30'); wood.addColorStop(1, '#5a3418');
  g.fillStyle = wood; g.fillRect(0, 0, W, TOPBAR);
  g.strokeStyle = 'rgba(0, 0, 0, 0.18)'; g.lineWidth = 1;
  for (let y = 6; y < TOPBAR; y += 8) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + 2, 180, y - 2, W, y + 1); g.stroke(); }
  g.fillStyle = '#3a2010'; g.fillRect(0, TOPBAR - 2, W, 2);
  g.fillStyle = '#2a160a'; g.beginPath(); g.roundRect(8, 7, 150, 9, 4); g.fill(); g.beginPath(); g.roundRect(8, 23, 150, 9, 4); g.fill();
  g.fillStyle = '#e8c070'; for (const x of [4, W - 4]) for (const y of [5, TOPBAR - 7]) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); }
}

export const openWhack = (onClose) => runArcade({
  id: 'whack', title: 'Whac-a-Diglett', colour: '#a8683a', W, H,
  stick: false,
  sounds: ['fx-pop', 'fx-boing', 'fx-coin', 'fx-zap', 'fx-firework'],
  intro: 'Bonk the Diglett before they dig back down! Reach each stage\'s quota.',
  help: [['Tap a Diglett before it hides.', 'Diglett 10, a golden one 50 and +2 seconds. Dugtrio takes three bonks: 50.'], ['Don\'t bonk a Voltorb or an Electrode!', 'Voltorb costs 30 and stuns your mallet; Electrode costs 50 and 3 seconds.'], ['Hit in a row for a combo:', 'x2 at 5, up to x5. A miss stalls your mallet and breaks it, as does an escape. Combo 20: Fever!'], [`Each stage is ${STAGE_S} seconds with a quota.`, 'Reach it to go on; every stage is quicker. Miss it and the game is over.']],
  make(api) {
    const mons = HOLES.map(() => null), pops = [], bits = [];
    let stage = 1, left = STAGE_S, got = 0, next = 0.6, shake = 0, combo = 0, fever = 0, stun = 0, mallet = null, intro = 1.6, clear = 0, flash = 0;
    const calm = calmFx();
    const mult = () => (fever ? 2 : 1) * Math.min(5, 1 + Math.floor(combo / 5));
    const say = (x, y, text, colour, size = 18) => pops.push({ x, y, text, colour, size, t: 0.8 });
    const dirt = (x, y, n = 8, c = '#7a4a24') => { if (calm) n = Math.ceil(n / 2); for (let i = 0; i < n; i++) bits.push({ x, y, vx: rand(-90, 90), vy: rand(-160, -60), t: rand(0.4, 0.7), c, r: rand(1.5, 3) }); };
    const pickKind = () => {
      if (fever) return 'diglett';
      const r = Math.random(), bomb = Math.min(0.24, 0.08 + stage * 0.02), elec = stage >= 3 ? Math.min(0.1, 0.03 + stage * 0.008) : 0;
      if (r < bomb) return 'voltorb';
      if (r < bomb + elec) return 'electrode';
      if (r < bomb + elec + 0.05) return 'golden';
      if (r < bomb + elec + 0.05 + Math.min(0.2, 0.08 + stage * 0.015)) return 'dugtrio';
      return 'diglett';
    };
    const spawn = () => {
      const free = mons.map((m, i) => (m ? -1 : i)).filter(i => i >= 0);
      if (!free.length) return;
      const i = free[Math.floor(Math.random() * free.length)], id = pickKind();
      const pace = Math.max(0.4, 1 - (stage - 1) * 0.085) * (1 - (STAGE_S - left) / STAGE_S * 0.2);
      const life = (id === 'golden' ? 0.6 : id === 'dugtrio' ? 1.9 : 1.15) * pace * rand(0.85, 1.2) * (fever ? 0.8 : 1);
      mons[i] = { id, up: 0, life, full: life, hit: false, hits: 0, sneak: id === 'diglett' && stage >= 4 && Math.random() < Math.min(0.4, (stage - 3) * 0.1), squash: 0 };
    };
    const lose = (m) => { if (m.id === 'voltorb' || m.id === 'electrode' || m.hit) return; if (combo >= 5) say(150, 70, 'Combo lost', '#ffb0a0', 13); combo = 0; };
    const startStage = () => { left = STAGE_S; got = 0; intro = 1.6; mons.fill(null); };
    return {
      tick(dt) {
        shake = Math.max(0, shake - dt); stun = Math.max(0, stun - dt); flash = Math.max(0, flash - dt);
        if (mallet) { mallet.t -= dt; if (mallet.t <= 0) mallet = null; }
        for (const b of bits) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 420 * dt; b.t -= dt; }
        for (const p of pops) { p.y -= 30 * dt; p.t -= dt; }
        for (let i = bits.length - 1; i >= 0; i--) if (bits[i].t <= 0) bits.splice(i, 1);
        for (let i = pops.length - 1; i >= 0; i--) if (pops[i].t <= 0) pops.splice(i, 1);
        if (clear) { clear -= dt; if (clear <= 0) { clear = 0; stage++; startStage(); } return; }
        if (intro) { intro = Math.max(0, intro - dt); return; }
        left -= dt;
        if (fever) { fever = Math.max(0, fever - dt); if (!fever) api.say('Fever over! Keep the combo going.'); }
        if (left <= 0) {
          left = 0;
          if (got >= quota(stage)) {
            const bonus = 100 * stage; api.add(bonus); clear = 2.2; fever = 0;
            api.say(`Stage ${stage} clear! +${bonus}. Stage ${stage + 1} is quicker.`); api.sound('stat-up', 'confirm');
            return;
          }
          return api.over(`Stage ${stage}: ${got} of ${quota(stage)}!`);
        }
        next -= dt;
        if (next <= 0) {
          spawn();
          if (Math.random() < Math.min(0.55, (stage - 1) * 0.08) || fever) spawn();
          next = rand(0.45, 0.8) * Math.max(0.38, 1 - (stage - 1) * 0.08) * (fever ? 0.45 : 1);
        }
        mons.forEach((m, i) => {
          if (!m) return;
          m.squash = Math.max(0, m.squash - dt * 4);
          m.life -= dt;
          const phase = 1 - m.life / m.full;
          const want = m.life <= 0 ? 0 : m.sneak && !m.hit && phase > 0.35 && phase < 0.6 ? 0.25 : 1;
          m.up += Math.sign(want - m.up) * Math.min(Math.abs(want - m.up), dt * (want ? 7 : 11));
          if (m.life <= 0 && m.up <= 0) { if (!m.hit) lose(m); mons[i] = null; }
        });
      },
      down(x, y) {
        if (clear || intro) return;
        mallet = { x, y, t: 0.16 };
        if (stun) { api.sound('fx-zap', 'cancel'); return; }
        let hitAny = false;
        mons.forEach((m, i) => {
          if (hitAny || !m || m.hit || m.up < 0.55) return;
          const h = HOLES[i];
          if (Math.abs(x - h.x) > 38 || y < h.y - 66 || y > h.y + 16) return;
          hitAny = true; m.squash = 1;
          if (m.id === 'dugtrio' && ++m.hits < 3) { dirt(h.x, h.y - 20, 4); api.sound('fx-boing', 'plink-1'); say(h.x, h.y - 52, `${3 - m.hits} more!`, '#fff', 13); m.life = Math.max(m.life, 0.5); return; }
          m.hit = true; m.life = Math.min(m.life, 0.12);
          const base = PTS[m.id];
          if (base < 0) {
            combo = 0; fever = 0;
            api.add(base); api.score = Math.max(0, api.score); got = Math.max(0, got + base);
            if (!calm) shake = 0.35;
            flash = 0.25;
            if (m.id === 'electrode') { left = Math.max(0.5, left - 3); say(h.x, h.y - 52, `${base} · -3s`, '#ff6060'); dirt(h.x, h.y - 20, 14, '#ffe060'); api.sound('fx-zap', 'thunder'); }
            else { stun = 0.6; say(h.x, h.y - 52, `${base}`, '#ff6060'); dirt(h.x, h.y - 20, 10, '#ffe060'); api.sound('thunder', 'cancel'); }
            api.say(m.id === 'electrode' ? 'Electrode exploded! Three seconds gone.' : 'Zapped by Voltorb! Your mallet tingles.');
            return;
          }
          combo++;
          const pts = base * mult();
          api.add(pts); got += pts;
          dirt(h.x, h.y - 10, 8);
          say(h.x, h.y - 52, `+${pts}`, m.id === 'golden' ? '#ffe040' : '#fff070', m.id === 'golden' || m.id === 'dugtrio' ? 22 : 18);
          if (m.id === 'golden') { left += 2; say(h.x, h.y - 30, '+2s', '#a8ffb0', 13); api.sound('fx-coin', 'coins'); }
          else api.sound(m.id === 'dugtrio' ? 'plink-2' : 'fx-pop', 'plink-1');
          if (combo === FEVER_AT && !fever) { fever = FEVER_S; flash = 0.3; api.say('FEVER! Diglett only, double points!'); api.sound('fx-firework', 'stat-up'); }
          else if (combo % 5 === 0) api.say(`Combo ${combo}! x${mult()}`);
        });
        // a miss stalls the mallet a moment, or tapping everywhere at once beat every quota
        if (!hitAny) { if (combo >= 5) say(x, y - 10, 'Miss!', '#ffb0a0', 13); combo = 0; stun = 0.35; dirt(x, y, 4, '#5a8a3a'); api.sound('fx-tick', 'select'); }
      },
      draw(g, now) {
        g.save();
        if (shake) g.translate(Math.sin(now / 18) * shake * 12, 0);
        stamp(g, 'whack-field', 0, 0, W, H, field);
        const gold = goldDiglett();
        HOLES.forEach((h, i) => {
          const m = mons[i];
          if (m && m.up > 0) {
            g.save(); g.beginPath(); g.rect(h.x - 42, h.y - 90, 84, 92); g.clip();
            const y = h.y + 6 + (1 - m.up) * 62, sq = m.squash;
            g.translate(h.x, y); g.scale(1 + sq * 0.25, 1 - sq * 0.3);
            if (m.id === 'golden') {
              if (gold) { const s = 52 / gold.height; g.imageSmoothingEnabled = false; g.drawImage(gold, -gold.width * s / 2, -52, gold.width * s, 52); }
            } else drawMon(g, m.id, 0, 0, m.id === 'dugtrio' ? 62 : 56);
            g.restore();
            if (m.id === 'golden' && m.up > 0.5) { g.fillStyle = `rgba(255, 250, 200, ${0.6 + 0.4 * Math.sin(now / 80)})`; for (let k = 0; k < 3; k++) { const a = now / 300 + k * TAU / 3; g.beginPath(); g.arc(h.x + Math.cos(a) * 24, h.y - 30 + Math.sin(a) * 10, 1.8, 0, TAU); g.fill(); } }
            if (m.hit && PTS[m.id] > 0) for (let k = 0; k < 3; k++) { const a = now / 120 + k * TAU / 3; banner(g, '★', h.x + Math.cos(a) * 16, h.y - 44 + Math.sin(a) * 5, 11, '#fff070'); }
            if (m.id === 'dugtrio' && m.hits && !m.hit) for (let k = 0; k < 3; k++) { g.fillStyle = k < m.hits ? '#ffd84a' : 'rgba(0, 0, 0, 0.4)'; g.beginPath(); g.arc(h.x - 10 + k * 10, h.y - 70, 3.5, 0, TAU); g.fill(); }
          }
          stamp(g, 'whack-lip', h.x - 42, h.y - 2, 84, 20, lip);
        });
        for (const b of bits) { g.globalAlpha = Math.min(1, b.t * 3); g.fillStyle = b.c; g.fillRect(b.x - b.r / 2, b.y - b.r / 2, b.r, b.r); }
        g.globalAlpha = 1;
        if (mallet) {
          const k = mallet.t / 0.16;
          g.save(); g.translate(mallet.x + 14, mallet.y + 4); g.rotate(-0.2 - k * 0.9);
          g.fillStyle = '#c89050'; g.fillRect(-2.5, -4, 5, 34);
          g.fillStyle = stun ? '#d0d040' : '#d83838'; g.beginPath(); g.roundRect(-14, -16, 28, 14, 4); g.fill();
          g.fillStyle = 'rgba(255, 255, 255, 0.45)'; g.fillRect(-11, -14, 22, 3);
          g.fillStyle = '#7a1818'; g.fillRect(-14, -6, 28, 2);
          g.restore();
        }
        for (const p of pops) { g.globalAlpha = Math.min(1, p.t * 2.5); banner(g, p.text, p.x, p.y, p.size, p.colour); }
        g.globalAlpha = 1;
        g.restore();
        if (fever) { g.fillStyle = `rgba(255, 200, 40, ${0.1 + 0.06 * Math.sin(now / 90)})`; g.fillRect(0, TOPBAR, W, H - TOPBAR); }
        if (flash) { g.fillStyle = `rgba(255, 255, 200, ${flash * (calmFx() ? 0.6 : 1.6)})`; g.fillRect(0, 0, W, H); }
        if (stun) { g.strokeStyle = '#ffe040'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += 12) g.lineTo(x, TOPBAR + 4 + ((x / 12) % 2 ? 6 : 0)); g.stroke(); }
        stamp(g, 'whack-board', 0, 0, W, TOPBAR, board);
        const q = quota(stage), tFrac = Math.min(1, left / STAGE_S);
        g.fillStyle = tFrac < 0.25 && Math.floor(now / 200) % 2 ? '#ff6040' : '#ffd84a'; g.fillRect(9, 8, 148 * tFrac, 7);
        g.fillStyle = got >= q ? '#78e078' : '#58b8f8'; g.fillRect(9, 24, 148 * Math.min(1, got / q), 7);
        g.font = '800 10px system-ui, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#fff';
        g.fillText(`${Math.ceil(left)}s`, 164, 12); g.fillText(`${got}/${q}`, 164, 28);
        banner(g, `STAGE ${stage}`, W - 46, 12, 12, '#ffe8b0');
        banner(g, fever ? `FEVER ${Math.ceil(fever)}` : combo >= 2 ? `COMBO ${combo} x${mult()}` : 'COMBO -', W - 46, 28, 11, fever ? '#ffd84a' : combo >= 5 ? '#a8ffb0' : '#fff');
        if (intro) { g.globalAlpha = Math.min(1, intro * 2); banner(g, `STAGE ${stage}`, W / 2, H * 0.45, 34, '#ffd84a'); banner(g, `Quota ${q}`, W / 2, H * 0.45 + 30, 16, '#fff'); g.globalAlpha = 1; }
        if (clear) banner(g, 'STAGE CLEAR!', W / 2, H * 0.48, 30 + Math.sin(now / 90) * 2, '#a8ffb0');
      },
    };
  },
}, onClose);
