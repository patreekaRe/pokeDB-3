/* arcade-breakout.js  -  Electrode Breakout, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick), after
   Breakout and Arkanoid: an Electrode bounces off your paddle into a wall of rock Pokémon. Drag (or the stick) to move,
   tap, Space or FIRE to launch. Where it strikes the paddle sets the angle.
   Since 2026-10-17 (the user's ask: every arcade game far more detailed, with more in it, and harder the longer you
   last): five painted caves the walls come round in, and brick kinds: Geodude (one hit), Graveler (two), Golem (three),
   a Voltorb that explodes and takes its neighbours with it (chaining into other Voltorb), steel that never breaks, and a
   glowing crystal that always drops a power-up. Some rows slide side to side. Power-ups: Wide, Multi-Electrode, Slow,
   Laser (FIRE shoots), Catch (the paddle holds Electrode), Explosion (Electrode ploughs through rock), an extra life,
   and from level 4 a red Tiny capsule to dodge. Bricks broken without touching the paddle build a combo multiplier.
   Every fifth level is a boss: Onix sweeps the top of the cave dropping boulders that stun the paddle. Electrode
   quickens through a level (after 4 and 12 hits, and the first time it reaches the roof) and each level starts quicker,
   so a good player is always being pushed. Three lives. */

import { runArcade, drawMon, banner, rand, pick, stamp } from './arcade-kit.js';
import { calmFx } from './prefs.js';

const W = 300, H = 380, TOP = 34, PY = H - 30, PH = 10, PW = 58, WIDE = 88, TINY = 36, BR = 7, COLS = 8, BW = 34, BH = 17, GAP = 2, LIVES = 3;
const BX = (W - COLS * (BW + GAP) + GAP) / 2, ROW0 = TOP + 22, TAU = Math.PI * 2;
/* g Geodude, G Graveler (2 hits), L Golem (3), V Voltorb (explodes), # steel (never breaks), c crystal (drops a power-up),
   . a gap; a row ending in ~ slides side to side */
const LAYOUTS = [
  { name: 'Rock Tunnel', rows: ['gggggggg', 'gggggggg', 'gggcgggg', 'gggggggg', 'GGGGGGGG'] },
  { name: 'Diamond', rows: ['...GG...', '..gggg..', '.ggVVgg.', 'GggccggG', '.gggggg.', '..gggg..'] },
  { name: 'Checkers', rows: ['GgGgGgGg', 'gGgGgGgG', 'GgVgGVgG', '........', '.gggggg.~', 'gggggggg'] },
  { name: 'Twin Towers', rows: ['gg.LL.gg', 'gg.GG.gg', 'ggVggVgg', 'G.g..g.G', 'gggcgggg', '#GGGGGG#'] },
  { name: 'Onix\'s Den', boss: true, rows: ['........', '........', '........', '........', 'g.gg.gg.', '#g#gg#g#'] },
  { name: 'The Vault', rows: ['LLLLLLLL', 'L......L', 'L.gVVg.L', 'L.gccg.L', 'L.gggg.L', '##g##g##'] },
  { name: 'Conveyor', rows: ['GGGGGGGG', '.gggggg.~', 'VgVgVgVg', '..gGGg..~', 'gggggggg', '.LLLLLL.~'] },
  { name: 'Fault Line', rows: ['#.#.#.#.', 'GLGLGLGL', 'gVgcgVgg', 'gggggggg', '.#.#.#.#', 'GGGGGGGG'] },
  { name: 'Crystal Cave', rows: ['c.c..c.c', 'LgLggLgL', 'gVggggVg', '.GGGGGG.~', 'gggggggg', '#.L##L.#'] },
  { name: 'Onix\'s Lair', boss: true, rows: ['........', '........', '........', '........', '#gVggVg#', 'LL#gg#LL'] },
];
const THEMES = [
  ['Rock Tunnel', '#3a2a40', '#4a3a3a', '#2a2020', 'rgba(255, 255, 255, 0.05)', '#7a6a5a'],
  ['Victory Road', '#2a2448', '#3a3060', '#181430', 'rgba(180, 160, 255, 0.07)', '#8a7ab8'],
  ['Mt. Moon', '#18243a', '#20304a', '#0c1424', 'rgba(140, 220, 255, 0.08)', '#5ab8e8'],
  ['Power Plant', '#3a3418', '#2a2a20', '#141410', 'rgba(255, 230, 90, 0.07)', '#d8b830'],
  ['Cerulean Cave', '#14303a', '#1a4048', '#081a20', 'rgba(120, 255, 220, 0.07)', '#4ad0b0'],
];
const KINDS = { g: { hp: 1, pts: 10, bits: '#a89c84' }, G: { hp: 2, pts: 25, bits: '#6a6458' }, L: { hp: 3, pts: 40, bits: '#5a6a48' }, V: { hp: 1, pts: 30, bits: '#e84040' }, '#': { hp: Infinity, pts: 0, bits: '#b8c0d0' }, c: { hp: 1, pts: 50, bits: '#a8f0ff' } };
const POWERS = {
  wide: ['W', '#40b0f0', 'Wide paddle!'], multi: ['M', '#f0a030', 'Multi-Electrode!'], slow: ['S', '#60c060', 'Slow down!'],
  laser: ['L', '#e050e0', 'Laser! Press FIRE to zap.'], catch: ['C', '#30c8b8', 'Catch! Electrode sticks to you.'],
  boom: ['E', '#ff6020', 'Explosion! Electrode ploughs through.'], life: ['1UP', '#ff5aa0', 'An extra life!'], tiny: ['T', '#c02020', 'Tiny paddle! Ouch.'],
};
const GOOD = ['wide', 'wide', 'multi', 'multi', 'slow', 'laser', 'laser', 'catch', 'boom'];

export const openBreakout = (onClose) => runArcade({
  id: 'breakout', title: 'Electrode Breakout', colour: '#e84040', W, H,
  intro: 'Smash the rock wall! Drag to move, tap or FIRE to launch.',
  pad: [['FIRE', 'fire']],
  sounds: ['fx-zap', 'fx-pop', 'fx-boing', 'fx-crackle', 'thunder'],
  help: [['Drag to move your paddle (or the stick).', 'Tap, FIRE or Space launches Electrode. Where it hits the paddle sets the angle.'], ['Geodude 1 hit, Graveler 2, Golem 3, steel never breaks.', 'Voltorb explode and take their neighbours; crystals always drop a power-up.'], ['Catch capsules: W wide, M multi, S slow, L laser,', 'C catch, E explosion, 1UP a life. Dodge the red T!'], ['Break rock without touching the paddle for a combo.', 'Every fifth level Onix attacks: hit it till it falls, and dodge its boulders.'], [`Electrode quickens as you play. ${LIVES} lives.`, 'A cleared wall adds 100 a level.']],
  make(api) {
    let px = W / 2, target = null, keyDir = 0, lives = LIVES, level = 0, flash = 0, bricks = [], balls = [], pause = 0, t = 0, shake = 0, combo = 0;
    let wide = 0, tiny = 0, slow = 0, laser = 0, grab = 0, boom = 0, cool = 0, stun = 0, hits = 0, roof = false, boost = 1, boss = null;
    const drops = [], bits = [], pops = [], bolts = [], rocks = [], blasts = [], fuses = [];
    const calm = calmFx();
    const layout = () => {
      if (level < LAYOUTS.length) return LAYOUTS[level];
      // past the hand-made ten: the same walls again, harder (Graveler for Geodude, Golem for Graveler, more Voltorb)
      const L = LAYOUTS[level % LAYOUTS.length], lap = Math.floor(level / LAYOUTS.length);
      return { ...L, rows: L.rows.map((r, i) => r.replace(/[gG]/g, (ch, c) => (ch === 'G' ? 'L' : (c * 7 + i * 3 + lap) % (6 - Math.min(3, lap)) === 0 ? 'V' : 'G'))) };
    };
    const theme = () => THEMES[level % THEMES.length];
    const pw = () => (tiny > 0 ? TINY : wide > 0 ? WIDE : PW);
    const base = () => Math.min(330, 195 + level * 13);
    const speed = () => Math.min(470, base() * boost) * (slow > 0 ? 0.7 : 1);
    const build = () => {
      bricks = []; boss = null;
      const L = layout();
      L.rows.forEach((raw, r) => {
        const row = raw.slice(0, COLS), slide = raw.endsWith('~'), cols = [...row].map((ch, c) => (ch !== '.' ? c : -1)).filter(c => c >= 0);
        const room = cols.length ? Math.min(BX + cols[0] * (BW + GAP), W - (BX + (cols[cols.length - 1] + 1) * (BW + GAP) - GAP)) - 3 : 0;
        [...row].forEach((ch, c) => {
          if (ch === '.') return;
          const k = KINDS[ch];
          bricks.push({ ch, bx: BX + c * (BW + GAP), x: BX + c * (BW + GAP), y: ROW0 + r * (BH + GAP), hp: k.hp, max: k.hp, seed: r * 9 + c * 5, slide: slide ? { amp: room, ph: r * 1.3, sp: 0.6 + level * 0.05 } : null, hit: 0 });
        });
      });
      if (L.boss) { const n = Math.floor(level / 5); boss = { x: W / 2, y: TOP + 40, vx: 46 + n * 10, hp: 14 + n * 6, max: 14 + n * 6, hit: 0, drop: 2.2, dying: 0 }; }
      hits = 0; roof = false; boost = 1;
    };
    const ready = () => { balls = [{ x: px, y: PY - BR, vx: 0, vy: 0, stuck: true, off: 0, spin: 0, trail: [] }]; drops.length = 0; bolts.length = 0; rocks.length = 0; };
    build(); ready();
    const left = () => bricks.filter(k => k.ch !== '#').length + (boss && !boss.dying ? 1 : 0);
    const shakeIt = (n) => { if (!calm) shake = Math.max(shake, n); };
    const popup = (x, y, text, c = '#fff') => pops.push({ x, y, text, c, t: 0.9 });
    const launch = () => {
      let any = false;
      for (const b of balls) if (b.stuck) { const a = b.off ? Math.max(-1, Math.min(1, b.off / (pw() / 2))) * 1.0 : rand(-0.4, 0.4), s = speed(); b.vx = Math.sin(a) * s; b.vy = -Math.cos(a) * s; b.stuck = false; any = true; }
      if (any) api.sound('confirm', 'select');
      return any;
    };
    const fire = () => {
      if (launch() || laser <= 0 || cool > 0 || pause > 0) return;
      cool = 0.32;
      const w = pw();
      bolts.push({ x: px - w / 2 + 5, y: PY - 2 }, { x: px + w / 2 - 5, y: PY - 2 });
      api.sound('fx-zap', 'select');
    };
    const crumble = (x, y, c, n = 9) => { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(30, 130); bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, t: rand(0.4, 0.8), c }); } };
    const quicken = (why) => { boost *= 1.07; for (const b of balls) if (!b.stuck) { const s = speed() / Math.hypot(b.vx, b.vy); b.vx *= s; b.vy *= s; } if (why) api.say(why); };
    const award = (k, x, y) => {
      combo += 1;
      const mult = Math.min(5, 1 + Math.floor(combo / 4)), pts = KINDS[k.ch].pts * mult;
      api.add(pts);
      popup(x, y, mult > 1 ? `${pts} x${mult}` : String(pts), mult > 1 ? '#ffd84a' : '#fff');
      if (combo === 8 || combo === 16 || combo === 24) { api.say(`${combo}-hit combo! x${mult}`); api.sound('stat-up', 'coins'); }
    };
    const kill = (k, chain) => {
      if (!bricks.includes(k)) return;
      bricks.splice(bricks.indexOf(k), 1);
      const cx = k.x + BW / 2, cy = k.y + BH / 2;
      award(k, cx, cy);
      crumble(cx, cy, KINDS[k.ch].bits, k.ch === 'c' ? 14 : 9);
      hits += 1;
      if (hits === 4 || hits === 12) quicken();
      if (k.ch === 'V') {
        blasts.push({ x: cx, y: cy, t: 0 }); shakeIt(5); api.sound('fx-pop', 'plink-2');
        const near = bricks.filter(o => o.ch !== '#' && Math.abs(o.x - k.x) < BW + GAP + 2 && Math.abs(o.y - k.y) < BH + GAP + 2);
        for (const o of near) fuses.push({ k: o, t: chain ? 0.09 : 0.06 });
      } else api.sound(k.ch === 'c' ? 'fx-ding' : 'plink-2', 'plink-2');
      const chance = k.ch === 'c' ? 1 : Math.max(0.07, 0.14 - level * 0.006);
      if (Math.random() < chance) {
        let kind = pick(GOOD);
        if (level >= 3 && Math.random() < Math.min(0.3, 0.12 + level * 0.015)) kind = 'tiny';
        else if (Math.random() < 0.05) kind = 'life';
        drops.push({ x: cx, y: cy, kind });
      }
    };
    const strike = (k) => {
      if (k.ch === '#') { api.sound('fx-tick', 'select'); k.hit = 0.15; return; }
      k.hp -= 1; k.hit = 0.15;
      if (k.hp > 0) { api.add(5); api.sound('plink-1'); crumble(k.x + BW / 2, k.y + BH / 2, '#8a8070', 5); return; }
      kill(k);
    };
    const power = (kind) => {
      api.say(POWERS[kind][2]);
      if (kind === 'tiny') { api.sound('cancel'); tiny = 8; wide = 0; return; }
      api.sound('stat-up', 'coins'); api.add(15); popup(px, PY - 14, '+15', '#a8f0ff');
      if (kind === 'wide') { wide = 12; tiny = 0; }
      if (kind === 'slow') { slow = 8; for (const b of balls) if (!b.stuck) { const s = speed() / Math.hypot(b.vx, b.vy); b.vx *= s; b.vy *= s; } }
      if (kind === 'laser') laser = 10;
      if (kind === 'catch') grab = 12;
      if (kind === 'boom') boom = 7;
      if (kind === 'life') lives = Math.min(5, lives + 1);
      if (kind === 'multi') {
        const from = balls.find(b => !b.stuck) || balls[0];
        for (const a of [-0.5, 0.5]) { const s = speed(), ang = a + rand(-0.15, 0.15); balls.push({ x: from.x, y: from.y, vx: Math.sin(ang) * s, vy: -Math.cos(ang) * s, stuck: false, off: 0, spin: 0, trail: [] }); }
      }
    };
    const defeat = () => {
      const n = Math.floor(level / 5) + 1;
      boss.dying = 1.6; api.add(800 * n); popup(boss.x, boss.y - 30, `+${800 * n}`, '#ffd84a');
      api.say(`Onix is down! +${800 * n}`); api.sound('thunder', 'stat-up'); shakeIt(9);
      for (const k of [...bricks]) if (k.ch !== '#') kill(k, true);
    };
    const wound = (n, pts) => {
      if (boss.hit > 0.1) return;
      boss.hp -= n; boss.hit = 0.25; shakeIt(3); combo += 1;
      api.add(pts); popup(boss.x, boss.y - 50, String(pts), '#ffd84a'); api.sound('hit', 'plink-2'); crumble(boss.x, boss.y - 20, '#a8a8b8', 6);
      if (boss.hp <= 0) defeat();
      else if (boss.hp <= boss.max / 2 && !boss.mad) { boss.mad = true; boss.vx *= 1.35; api.say('Onix is enraged!'); }
    };
    const hurtBoss = (b) => {
      if (!boss || boss.dying) return false;
      const bx = boss.x - 34, by = boss.y - 46, bw = 68, bh = 56;
      const cx = Math.max(bx, Math.min(b.x, bx + bw)), cy = Math.max(by, Math.min(b.y, by + bh)), dx = b.x - cx, dy = b.y - cy;
      if (dx * dx + dy * dy > BR * BR) return false;
      if (Math.abs(dx) > Math.abs(dy)) b.vx = dx < 0 ? -Math.abs(b.vx) : Math.abs(b.vx); else b.vy = dy < 0 ? -Math.abs(b.vy) : Math.abs(b.vy);
      b.x += Math.sign(b.vx) * 2; b.y += Math.sign(b.vy) * 2;
      wound(boom > 0 ? 2 : 1, 30);
      return true;
    };
    const move = (b, dt) => {
      b.x += b.vx * dt; b.y += b.vy * dt; b.spin += dt * (b.vx > 0 ? 6 : -6);
      if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx); }
      if (b.x > W - BR) { b.x = W - BR; b.vx = -Math.abs(b.vx); }
      if (b.y < TOP + BR) { b.y = TOP + BR; b.vy = Math.abs(b.vy); if (!roof) { roof = true; quicken(level >= 2 ? 'Electrode hit the roof and sped up!' : ''); } }
      const w = pw();
      if (b.vy > 0 && b.y + BR >= PY && b.y + BR <= PY + PH + 4 && Math.abs(b.x - px) < w / 2 + BR) {
        const off = Math.max(-1, Math.min(1, (b.x - px) / (w / 2))), s = speed(), a = off * 1.05;
        b.vx = Math.sin(a) * s; b.vy = -Math.cos(a) * s; b.y = PY - BR;
        combo = 0;
        if (grab > 0) { b.stuck = true; b.off = b.x - px; b.vx = b.vy = 0; b.held = 2.5; api.sound('fx-boing', 'select'); }
        else api.sound('select');
      }
      if (hurtBoss(b)) return;
      for (const k of bricks) {
        const cx = Math.max(k.x, Math.min(b.x, k.x + BW)), cy = Math.max(k.y, Math.min(b.y, k.y + BH)), dx = b.x - cx, dy = b.y - cy;
        if (dx * dx + dy * dy > BR * BR) continue;
        if (boom > 0 && k.ch !== '#') { k.hp = 0; kill(k); continue; }
        const ox = Math.min(b.x + BR - k.x, k.x + BW - (b.x - BR)), oy = Math.min(b.y + BR - k.y, k.y + BH - (b.y - BR));
        if (ox < oy) { b.vx = b.x < k.x + BW / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); b.x += b.vx > 0 ? ox : -ox; }
        else { b.vy = b.y < k.y + BH / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); b.y += b.vy > 0 ? oy : -oy; }
        if (Math.abs(b.vy) < 60) b.vy = (b.vy < 0 ? -1 : 1) * 60;
        strike(k);
        break;
      }
    };
    return {
      fire,
      tick(dt) {
        t += dt;
        const free = stun <= 0;
        if (free) { if (target != null) px += Math.max(-480 * dt, Math.min(480 * dt, target - px)); else px += keyDir * 310 * dt; }
        px = Math.max(pw() / 2, Math.min(W - pw() / 2, px));
        const down = (v) => Math.max(0, v - dt);
        wide = down(wide); tiny = down(tiny); laser = down(laser); grab = down(grab); boom = down(boom); cool = down(cool); stun = down(stun); flash = down(flash); shake = Math.max(0, shake - dt * 30);
        for (let i = fuses.length - 1; i >= 0; i--) if ((fuses[i].t -= dt) <= 0) { const { k } = fuses.splice(i, 1)[0]; k.hp = 0; kill(k, true); }
        if (slow > 0 && (slow -= dt) <= 0) { slow = 0; for (const b of balls) if (!b.stuck) { const s = speed() / Math.hypot(b.vx, b.vy); b.vx *= s; b.vy *= s; } }
        for (const s of bits) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 300 * dt; s.t -= dt; }
        for (let i = bits.length - 1; i >= 0; i--) if (bits[i].t <= 0) bits.splice(i, 1);
        for (let i = pops.length - 1; i >= 0; i--) { pops[i].t -= dt; pops[i].y -= 28 * dt; if (pops[i].t <= 0) pops.splice(i, 1); }
        for (let i = blasts.length - 1; i >= 0; i--) if ((blasts[i].t += dt) > 0.4) blasts.splice(i, 1);
        if (pause > 0) { pause -= dt; if (pause <= 0) { build(); ready(); } return; }
        for (const k of bricks) { k.hit = Math.max(0, k.hit - dt); if (k.slide) k.x = k.bx + Math.sin(t * k.slide.sp + k.slide.ph) * k.slide.amp; }
        if (boss) {
          boss.hit = Math.max(0, boss.hit - dt);
          if (boss.dying) { if ((boss.dying -= dt) <= 0) boss = null; }
          else {
            boss.x += boss.vx * dt;
            if (boss.x < 44 || boss.x > W - 44) { boss.vx = -boss.vx; boss.x = Math.max(44, Math.min(W - 44, boss.x)); }
            if ((boss.drop -= dt) <= 0) { boss.drop = Math.max(0.9, 2.2 - Math.floor(level / 5) * 0.3 - (boss.hp < boss.max / 2 ? 0.5 : 0)); rocks.push({ x: boss.x + rand(-20, 20), y: boss.y, vy: 80, spin: 0 }); api.sound('fx-whoosh', 'select'); }
          }
        }
        for (let i = rocks.length - 1; i >= 0; i--) {
          const r = rocks[i]; r.vy += 160 * dt; r.y += r.vy * dt; r.spin += dt * 5;
          if (r.y > PY - 6 && r.y < PY + PH + 6 && Math.abs(r.x - px) < pw() / 2 + 7) { rocks.splice(i, 1); stun = 1.1; shakeIt(4); api.sound('hit', 'cancel'); api.say('A boulder! The paddle is stunned.'); crumble(r.x, PY, '#8a7c64', 8); }
          else if (r.y > H + 10) rocks.splice(i, 1);
        }
        for (let i = bolts.length - 1; i >= 0; i--) {
          const z = bolts[i]; z.y -= 460 * dt;
          const k = bricks.find(k => z.x > k.x && z.x < k.x + BW && z.y > k.y && z.y < k.y + BH);
          let gone = z.y < TOP;
          if (k) { strike(k); gone = true; }
          else if (boss && !boss.dying && Math.abs(z.x - boss.x) < 30 && z.y < boss.y && z.y > boss.y - 46) { wound(1, 10); gone = true; }
          if (gone) bolts.splice(i, 1);
        }
        for (const b of balls) {
          if (b.stuck) { b.x = px + b.off; b.y = PY - BR; if (b.held !== undefined && (b.held -= dt) <= 0) { b.held = undefined; launch(); } continue; }
          b.trail.unshift([b.x, b.y]); if (b.trail.length > 6) b.trail.pop();
          const n = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 3);
          for (let i = 0; i < n; i++) move(b, dt / n);
        }
        balls = balls.filter(b => b.y < H + BR * 2);
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i]; d.y += (90 + level * 4) * dt;
          if (d.y > PY - 6 && d.y < PY + PH + 6 && Math.abs(d.x - px) < pw() / 2 + 10) { drops.splice(i, 1); power(d.kind); }
          else if (d.y > H + 10) drops.splice(i, 1);
        }
        if (!left() && !boss) {
          level += 1; api.add(100 * level); api.say(`Wall smashed! +${100 * level}. Level ${level + 1}: ${layout().name}${layout().boss ? '. Onix awaits!' : '.'}`);
          api.sound('stat-up', 'confirm'); pause = 1.6; balls = []; drops.length = 0; rocks.length = 0; bolts.length = 0;
          wide = tiny = slow = laser = grab = boom = stun = 0; combo = 0; return;
        }
        if (!balls.length) {
          lives -= 1; flash = 0.5; wide = tiny = slow = laser = grab = boom = 0; combo = 0; shakeIt(6); api.sound('cancel');
          if (lives <= 0) return api.over('Electrode fainted!');
          api.say(`Missed! ${lives} ${lives === 1 ? 'life' : 'lives'} left. Tap to launch.`); ready();
        }
      },
      down(x) { target = x; fire(); },
      move(x, y, pressed) { if (pressed) target = x; },
      up() { target = null; },
      key(k, down) { if (k === 'left' || k === 'right') keyDir = down ? (k === 'left' ? -1 : 1) : (keyDir === (k === 'left' ? -1 : 1) ? 0 : keyDir); if (down && (k === 'act' || k === 'up')) fire(); },
      draw(g, now) {
        const th = theme(), lv = level;
        stamp(g, `bo-bg-${lv % THEMES.length}`, 0, 0, W, H, (cg) => cave(cg, th, lv % THEMES.length));
        for (let i = 0; i < 7; i++) {   // the cave's crystals twinkling
          const a = 0.25 + 0.25 * Math.sin(now / 400 + i * 1.7);
          g.fillStyle = th[5]; g.globalAlpha = a; g.fillRect((i * 83 + 17) % (W - 10) + 4, 60 + (i * 131) % (H - 140), 2, 2); g.globalAlpha = 1;
        }
        g.save();
        if (shake) g.translate(rand(-shake, shake), rand(-shake, shake));
        g.font = '700 11px system-ui, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = 'rgba(255, 255, 255, 0.85)';
        g.fillText(`LV ${level + 1} · ${layout().name}`, 8, TOP / 2);
        for (let i = 0; i < lives; i++) stamp(g, 'bo-life', W - 20 - i * 16, TOP / 2 - 6, 12, 12, (cg) => electrode(cg, 6, 6, 6, 0));
        for (const k of bricks) {
          const key = k.ch === '#' ? 'bo-steel' : `bo-${k.ch}${k.seed % 6}-${k.hp}`;
          stamp(g, key, k.x - 2, k.y - 3, BW + 4, BH + 6, (cg) => { cg.translate(2, 3); brick(cg, k); });
          if (k.hit) { g.fillStyle = `rgba(255, 255, 255, ${k.hit * 3})`; g.fillRect(k.x, k.y, BW, BH); }
          if (k.ch === 'c') { g.fillStyle = `rgba(200, 250, 255, ${0.3 + 0.3 * Math.sin(now / 150 + k.seed)})`; g.fillRect(k.x + BW / 2 - 1, k.y + 2, 2, BH - 4); }
          if (k.ch === 'V' && Math.floor(now / 300 + k.seed) % 4 === 0) { g.fillStyle = 'rgba(255, 240, 120, 0.5)'; g.beginPath(); g.arc(k.x + BW / 2, k.y + BH / 2, 9, 0, TAU); g.fill(); }
        }
        if (boss) {
          const dy = Math.sin(now / 300) * 3;
          if (boss.dying) g.globalAlpha = Math.max(0, boss.dying / 1.6);
          if (boss.hit > 0 && Math.floor(now / 50) % 2) g.globalAlpha = 0.5;
          drawMon(g, 'onix', boss.x, boss.y + 10 + dy, 64, boss.vx > 0);
          g.globalAlpha = 1;
          g.fillStyle = 'rgba(0, 0, 0, 0.5)'; g.fillRect(W / 2 - 60, TOP + 3, 120, 6);
          g.fillStyle = boss.hp > boss.max / 2 ? '#58d058' : '#f05a4a'; g.fillRect(W / 2 - 60, TOP + 3, 120 * Math.max(0, boss.hp) / boss.max, 6);
        }
        for (const r of rocks) { drawMon(g, 'geodude', r.x, r.y + 9, 18, Math.sin(r.spin) > 0); }
        for (const s of bits) { g.globalAlpha = Math.max(0, s.t * 1.6); g.fillStyle = s.c; g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3); }
        g.globalAlpha = 1;
        for (const b of blasts) { const k = b.t / 0.4; g.strokeStyle = `rgba(255, 220, 90, ${1 - k})`; g.lineWidth = 4 * (1 - k) + 1; g.beginPath(); g.arc(b.x, b.y, 8 + k * 34, 0, TAU); g.stroke(); g.fillStyle = `rgba(255, 140, 40, ${0.5 * (1 - k)})`; g.beginPath(); g.arc(b.x, b.y, 6 + k * 20, 0, TAU); g.fill(); }
        for (const d of drops) stamp(g, `bo-cap-${d.kind}`, d.x - 14, d.y - 7, 28, 14, (cg) => capsule(cg, d.kind));
        g.fillStyle = '#ff80ff'; for (const z of bolts) g.fillRect(z.x - 1.5, z.y - 6, 3, 10);
        const w = pw();
        stamp(g, `bo-pad-${w}-${laser > 0 ? 1 : 0}-${grab > 0 ? 1 : 0}`, px - w / 2 - 2, PY - 6, w + 4, PH + 8, (cg) => paddle(cg, w, laser > 0, grab > 0));
        if (stun > 0) { g.fillStyle = '#ffd84a'; for (let i = 0; i < 3; i++) { const a = now / 150 + i * TAU / 3; g.fillRect(px + Math.cos(a) * 14 - 1.5, PY - 6 + Math.sin(a) * 4, 3, 3); } }
        for (const b of balls) {
          if (!b.stuck) b.trail.forEach(([x, y], i) => { g.globalAlpha = 0.28 - i * 0.04; g.fillStyle = boom > 0 ? '#ff8030' : '#fff0a0'; g.beginPath(); g.arc(x, y, BR - i * 0.6, 0, TAU); g.fill(); });
          g.globalAlpha = 1;
          if (boom > 0 || (!b.stuck && Math.hypot(b.vx, b.vy) > 300)) stamp(g, `bo-glow-${boom > 0 ? 1 : 0}`, b.x - BR - 9, b.y - BR - 9, BR * 2 + 18, BR * 2 + 18, (cg) => { const r = BR + 9, gl = cg.createRadialGradient(r, r, BR * 0.6, r, r, r); gl.addColorStop(0, boom > 0 ? 'rgba(255, 120, 40, 0.7)' : 'rgba(255, 240, 120, 0.55)'); gl.addColorStop(1, 'rgba(255, 232, 96, 0)'); cg.fillStyle = gl; cg.fillRect(0, 0, r * 2, r * 2); });
          const turn = Math.round((Math.sin(b.spin) * 0.25 + 0.25) / 0.5 * 4);
          stamp(g, `bo-el-${turn}`, b.x - BR - 1, b.y - BR - 1, BR * 2 + 2, BR * 2 + 2, (cg) => electrode(cg, BR + 1, BR + 1, BR, (turn / 4 * 0.5 - 0.25)));
        }
        g.font = '800 11px system-ui, sans-serif'; g.textAlign = 'center';
        for (const p of pops) { g.globalAlpha = Math.min(1, p.t * 2); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillText(p.text, p.x + 1, p.y + 1); g.fillStyle = p.c; g.fillText(p.text, p.x, p.y); }
        g.globalAlpha = 1;
        const on = [wide > 0 && `WIDE ${Math.ceil(wide)}`, tiny > 0 && `TINY ${Math.ceil(tiny)}`, slow > 0 && `SLOW ${Math.ceil(slow)}`, laser > 0 && `LASER ${Math.ceil(laser)}`, grab > 0 && `CATCH ${Math.ceil(grab)}`, boom > 0 && `BOOM ${Math.ceil(boom)}`].filter(Boolean);
        if (on.length) { g.font = '700 10px system-ui, sans-serif'; g.fillStyle = '#ffd84a'; g.fillText(on.join('  '), W / 2, H - 9); }
        if (combo >= 4) banner(g, `COMBO x${Math.min(5, 1 + Math.floor(combo / 4))}`, W - 50, H - 50, 12, '#ffd84a');
        g.restore();
        if (flash > 0) { g.fillStyle = `rgba(255, 60, 60, ${flash * 0.5})`; g.fillRect(0, 0, W, H); }
        if (pause > 0) { banner(g, `LEVEL ${level + 1}`, W / 2, H * 0.5, 30, '#ffd84a'); banner(g, layout().name.toUpperCase(), W / 2, H * 0.5 + 28, 13, '#fff'); }
        else if (balls.some(b => b.stuck && b.held === undefined)) banner(g, 'TAP TO LAUNCH', W / 2, H * 0.72, 14, `rgba(255, 255, 255, ${0.6 + 0.4 * Math.sin(now / 250)})`);
      },
    };
  },
}, onClose);

/** A cave painted once a theme: the rock face fading down, boulders and strata, crystals, and the roof's dark bar. */
function cave(g, [, a, b, c, haze, gem], n) {
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, a); bg.addColorStop(0.6, b); bg.addColorStop(1, c);
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = haze;
  for (let i = 0; i < 16; i++) { g.beginPath(); g.ellipse((i * 67 + n * 23) % W, 60 + (i * 97) % (H - 80), 22 + (i % 4) * 8, 12 + (i % 3) * 5, i, 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(0, 0, 0, 0.18)'; g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 90 + i * 48); for (let x = 0; x <= W; x += 30) g.lineTo(x, 90 + i * 48 + Math.sin(x * 0.04 + i + n) * 6); g.stroke(); }
  for (let i = 0; i < 6; i++) {   // crystal clusters along the floor and walls
    const x = (i * 59 + n * 31) % (W - 20) + 10, y = H - 8 - (i % 3) * 6;
    g.fillStyle = gem; g.globalAlpha = 0.55;
    for (const [dx, h, s] of [[-4, 12, -0.3], [0, 18, 0], [4, 10, 0.35]]) { g.save(); g.translate(x + dx, y); g.rotate(s); g.beginPath(); g.moveTo(-2.5, 0); g.lineTo(0, -h); g.lineTo(2.5, 0); g.fill(); g.restore(); }
    g.globalAlpha = 1;
  }
  g.fillStyle = 'rgba(0, 0, 0, 0.4)'; g.fillRect(0, 0, W, TOP);
  g.fillStyle = 'rgba(0, 0, 0, 0.35)';   // stalactites under the roof
  for (let i = 0; i < 22; i++) { const x = i * 14 + 2, d = 4 + (i * 7 + n * 3) % 9; g.beginPath(); g.moveTo(x - 5, TOP); g.lineTo(x, TOP + d); g.lineTo(x + 6, TOP); g.fill(); }
  g.fillStyle = 'rgba(255, 255, 255, 0.06)'; g.fillRect(0, PY + PH + 6, W, 1);
}

function electrode(g, x, y, r, tilt) {
  g.save(); g.translate(x, y); g.rotate(tilt);
  g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  const top = g.createRadialGradient(-r * 0.3, -r * 0.5, r * 0.1, 0, 0, r); top.addColorStop(0, '#ff7a6a'); top.addColorStop(1, '#c82020');
  g.fillStyle = top; g.beginPath(); g.arc(0, 0, r, Math.PI, TAU); g.lineTo(r, 0.6); g.lineTo(-r, 0.6); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0, 0, 0, 0.35)'; g.lineWidth = Math.max(0.8, r / 7); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
  g.fillStyle = '#fff'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * 0.38, -r * 0.3, r * 0.24, r * 0.2, s * -0.4, 0, TAU); g.fill(); }
  g.fillStyle = '#201818'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * r * 0.32, -r * 0.27, r * 0.11, 0, TAU); g.fill(); }
  g.strokeStyle = '#201818'; g.lineWidth = Math.max(0.6, r / 9);
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * r * 0.62, -r * 0.62); g.lineTo(s * r * 0.15, -r * 0.42); g.stroke(); }
  g.fillStyle = 'rgba(255, 255, 255, 0.55)'; g.beginPath(); g.ellipse(-r * 0.45, -r * 0.62, r * 0.18, r * 0.1, -0.6, 0, TAU); g.fill();
  g.restore();
}

/** The paddle, `w` wide, painted once a width: a steel bar with red Poké Ball caps, laser cannons, or Catch's green glue. */
function paddle(g, w, gun, glue) {
  const x = 2, y = 6;
  const pg = g.createLinearGradient(0, y, 0, y + PH); pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.5, '#d0d0dc'); pg.addColorStop(1, '#8a8a9c');
  g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.roundRect(x + 1, y + 2, w, PH, 5); g.fill();
  g.fillStyle = pg; g.beginPath(); g.roundRect(x, y, w, PH, 5); g.fill();
  g.fillStyle = '#e84040'; g.beginPath(); g.roundRect(x, y, 9, PH, [5, 0, 0, 5]); g.fill(); g.beginPath(); g.roundRect(x + w - 9, y, 9, PH, [0, 5, 5, 0]); g.fill();
  g.fillStyle = '#202028'; g.fillRect(x + 9, y, 1.2, PH); g.fillRect(x + w - 10.2, y, 1.2, PH);
  g.fillStyle = 'rgba(255, 255, 255, 0.7)'; g.fillRect(x + 12, y + 2, w - 24, 2);
  g.fillStyle = '#404050'; for (let i = x + 16; i < x + w - 14; i += 8) g.fillRect(i, y + PH - 3, 4, 1);
  if (gun) { g.fillStyle = '#a030a0'; for (const gx of [x + 3, x + w - 7]) { g.fillRect(gx, y - 6, 4, 7); g.fillStyle = '#ff80ff'; g.fillRect(gx + 1, y - 6, 2, 2); g.fillStyle = '#a030a0'; } }
  if (glue) { g.fillStyle = 'rgba(60, 220, 190, 0.75)'; g.beginPath(); g.roundRect(x + 10, y - 1.5, w - 20, 3, 1.5); g.fill(); for (let i = x + 16; i < x + w - 12; i += 11) { g.beginPath(); g.arc(i, y + 1.5, 1.6, 0, Math.PI); g.fill(); } }
}

/** A power-up capsule in a 28 x 14 box. */
function capsule(g, kind) {
  const [ch, c] = POWERS[kind];
  g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.roundRect(2, 2, 25, 11, 5.5); g.fill();
  g.fillStyle = c; g.beginPath(); g.roundRect(1, 1, 25, 11, 5.5); g.fill();
  g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.fillRect(1, 8, 25, 4);
  g.fillStyle = 'rgba(255, 255, 255, 0.5)'; g.beginPath(); g.roundRect(4, 2.5, 19, 3, 1.5); g.fill();
  g.strokeStyle = 'rgba(0, 0, 0, 0.45)'; g.lineWidth = 1; g.beginPath(); g.roundRect(1, 1, 25, 11, 5.5); g.stroke();
  g.font = `800 ${ch.length > 1 ? 7 : 9}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(0, 0, 0, 0.5)'; g.fillText(ch, 14, 7.5); g.fillStyle = '#fff'; g.fillText(ch, 13.5, 7);
}

/** One brick in a BW x BH box from 0, 0: a rock Pokémon's face, Golem's shell, a Voltorb, a steel plate or a crystal. */
function brick(g, k) {
  const { seed, ch, hp } = k, cx = BW / 2, cy = BH / 2;
  if (ch === '#') {
    const sg = g.createLinearGradient(0, 0, 0, BH); sg.addColorStop(0, '#e8eef8'); sg.addColorStop(0.5, '#9aa4b8'); sg.addColorStop(1, '#5a6478');
    g.fillStyle = sg; g.beginPath(); g.roundRect(0, 0, BW, BH, 3); g.fill();
    g.strokeStyle = '#30384a'; g.lineWidth = 1; g.stroke();
    g.fillStyle = '#30384a'; for (const [x, y] of [[3, 3], [BW - 3, 3], [3, BH - 3], [BW - 3, BH - 3]]) { g.beginPath(); g.arc(x, y, 1.2, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(255, 255, 255, 0.5)'; g.beginPath(); g.moveTo(5, BH / 2); g.lineTo(BW - 5, BH / 2); g.stroke();
    return;
  }
  if (ch === 'V') {
    g.fillStyle = '#f4f4f4'; g.beginPath(); g.arc(cx, cy, BH / 2 + 0.5, 0, TAU); g.fill();
    g.fillStyle = '#d02828'; g.beginPath(); g.arc(cx, cy, BH / 2 + 0.5, Math.PI, TAU); g.fill();
    g.strokeStyle = '#401010'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, BH / 2 + 0.5, 0, TAU); g.stroke();
    g.fillStyle = '#201818'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 3, cy - 2, 1.4, 1.8, 0, 0, TAU); g.fill(); }
    g.strokeStyle = '#ffd84a'; g.lineWidth = 1.4;   // fuse sparks either side: it's going to blow
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 11, cy - 4); g.lineTo(cx + s * 13, cy); g.lineTo(cx + s * 11, cy + 1); g.lineTo(cx + s * 14, cy + 5); g.stroke(); }
    return;
  }
  if (ch === 'c') {
    g.fillStyle = '#2a3a58'; g.beginPath(); g.roundRect(0, 2, BW, BH - 2, 4); g.fill();
    for (const [dx, h, w, col] of [[-9, 13, 5, '#7ad8ff'], [0, 17, 6, '#c8f4ff'], [9, 12, 5, '#5ab8f0']]) {
      g.fillStyle = col; g.beginPath(); g.moveTo(cx + dx - w, BH); g.lineTo(cx + dx - w * 0.7, BH - h * 0.7); g.lineTo(cx + dx, BH - h); g.lineTo(cx + dx + w * 0.7, BH - h * 0.7); g.lineTo(cx + dx + w, BH); g.fill();
      g.fillStyle = 'rgba(255, 255, 255, 0.6)'; g.beginPath(); g.moveTo(cx + dx - w * 0.5, BH - 2); g.lineTo(cx + dx, BH - h + 1); g.lineTo(cx + dx - w * 0.1, BH - 2); g.fill();
    }
    return;
  }
  g.save();
  g.beginPath();
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * TAU, wob = 1 + Math.sin(seed + i * 2.3) * 0.07;
    const px = cx + Math.cos(a) * (BW / 2) * wob, py = cy + Math.sin(a) * (BH / 2 + 1) * wob;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  const rg = g.createRadialGradient(cx - 6, cy - 5, 2, cx, cy, BW / 2);
  if (ch === 'L') { rg.addColorStop(0, '#a8b890'); rg.addColorStop(1, '#4a5a3a'); }
  else if (ch === 'G') { rg.addColorStop(0, '#a49a88'); rg.addColorStop(1, '#5a5244'); }
  else { rg.addColorStop(0, '#d4c8ae'); rg.addColorStop(1, '#8a7c64'); }
  g.fillStyle = rg; g.fill();
  g.strokeStyle = 'rgba(30, 24, 16, 0.55)'; g.lineWidth = 1; g.stroke();
  g.clip();
  g.fillStyle = 'rgba(40, 30, 20, 0.18)';
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(5 + ((seed * 7 + i * 9) % (BW - 8)), 4 + ((seed * 3 + i * 5) % (BH - 6)), 1.6 + (i % 2), 0, TAU); g.fill(); }
  if (ch === 'G') { g.strokeStyle = 'rgba(30, 24, 16, 0.4)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(6 + i * 10, 2); g.lineTo(9 + i * 10, BH - 2); g.stroke(); } }
  if (ch === 'L') { g.strokeStyle = 'rgba(20, 30, 10, 0.45)'; g.lineWidth = 1.2; for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(cx + i * 10, cy + 10, 10, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); } }
  if (hp < k.max) {
    g.strokeStyle = '#201810'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx - 8, 1); g.lineTo(cx - 2, cy - 1); g.lineTo(cx - 5, cy + 3); g.lineTo(cx + 3, BH); g.moveTo(cx - 2, cy - 1); g.lineTo(cx + 7, cy - 4); g.stroke();
    if (hp < k.max - 1) { g.beginPath(); g.moveTo(cx + 12, 1); g.lineTo(cx + 9, cy); g.lineTo(cx + 14, BH - 1); g.stroke(); }
  }
  g.restore();
  g.fillStyle = '#201810';
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 4.5, cy - 0.5, 1.6, 2.2, 0, 0, TAU); g.fill(); }
  g.strokeStyle = '#201810'; g.lineWidth = 1.2;
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 7.5, cy - 4.5); g.lineTo(cx + s * 2, cy - 3); g.stroke(); }
  g.beginPath(); g.moveTo(cx - 3, cy + 4); g.quadraticCurveTo(cx, cy + 2.5, cx + 3, cy + 4); g.stroke();
}
