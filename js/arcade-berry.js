/* arcade-berry.js  -  Pachirisu Berry Catch, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick, in place
   of Jigglypuff's Sing-Along): Berries drop from the tree overhead and Pachirisu dashes along the ground to catch them.
   Catches in a row build a combo that multiplies the points; a Sitrus Berry is worth more and a rare golden Starf Berry
   most. Every Berry that hits the ground loses a heart, and so does a Pineco: it bursts. Three hearts; it all falls
   faster as the score climbs. Drag or tap where Pachirisu should go, or use the arrow keys. */

import { runArcade, drawMon, rand, banner } from './arcade-kit.js';

const W = 300, H = 380, GROUND = 340, PW = 46, CATCH_Y = GROUND - 30, HEARTS = 3, RUN = 330;
/* what falls: points, weight in the drop table, size, and its picture in assets/items */
const KINDS = {
  oran: { pts: 10, w: 60, r: 11, img: 'oran-berry' },
  sitrus: { pts: 25, w: 18, r: 12, img: 'sitrus-berry' },
  starf: { pts: 100, w: 3, r: 13, img: 'starf-berry', gold: true },
  pineco: { pts: 0, r: 15, bad: true },   // its weight grows with the score, roll()
};
const pics = new Map();
const pic = (id) => {
  if (!pics.has(id)) { const img = new Image(); img.src = `assets/items/${id}.png`; pics.set(id, img); }
  return pics.get(id);
};

export const openBerry = (onClose) => runArcade({
  id: 'berry', title: 'Pachirisu Berry Catch', colour: '#4aa8e8', W, H,
  intro: 'Catch the falling Berries! Drag or tap to run.',
  help: [['Drag, or tap where you want Pachirisu to run.', 'The arrow keys work too.'], [`A Berry is ${KINDS.oran.pts}, a Sitrus ${KINDS.sitrus.pts}, a golden Starf ${KINDS.starf.pts}.`, 'Catch them in a row for a combo: up to x5.'], ['A Berry that hits the ground costs a heart, and so does catching a Pineco.', `${HEARTS} hearts, and it all falls faster as you go.`]],
  make(api) {
    let x = W / 2, target = null, held = { left: false, right: false }, face = 1;
    let hearts = HEARTS, combo = 0, wait = 0.8, hurt = 0;
    const drops = [], pops = [];
    const level = () => Math.min(1, api.score / 1500);
    const roll = () => {
      const lv = level(), table = [['oran', KINDS.oran.w], ['sitrus', KINDS.sitrus.w], ['starf', KINDS.starf.w], ['pineco', 6 + lv * 16]];
      let n = Math.random() * table.reduce((s, [, w]) => s + w, 0);
      for (const [k, w] of table) if ((n -= w) < 0) return k;
      return 'oran';
    };
    const spawn = () => {
      const kind = roll(), k = KINDS[kind], lv = level();
      drops.push({ kind, x: rand(k.r + 6, W - k.r - 6), y: 52, vy: rand(60, 90) + lv * 90, spin: rand(-2, 2), a: 0 });
      wait = rand(0.55, 1.1) * (1 - lv * 0.55);
    };
    const pop = (text, px, py, colour) => pops.push({ text, x: px, y: py, colour, t: 0 });
    const lose = (why) => {
      hearts--; combo = 0; hurt = 0.6;
      api.sound('cancel', 'select');
      if (hearts <= 0) api.over(why);
    };
    return {
      tick(dt) {
        hurt = Math.max(0, hurt - dt);
        const dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
        if (dir) { target = null; x += dir * RUN * dt; face = dir; }
        else if (target !== null) {
          const d = target - x, step = RUN * 1.15 * dt;
          if (Math.abs(d) <= step) { x = target; target = null; } else { x += Math.sign(d) * step; face = Math.sign(d); }
        }
        x = Math.max(PW / 2, Math.min(W - PW / 2, x));
        if ((wait -= dt) <= 0) spawn();
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i], k = KINDS[d.kind];
          d.vy += (180 + level() * 160) * dt; d.y += d.vy * dt; d.a += d.spin * dt;
          if (d.y + k.r >= CATCH_Y && d.y - k.r <= CATCH_Y + 16 && Math.abs(d.x - x) < PW / 2 + k.r * 0.6) {
            drops.splice(i, 1);
            if (k.bad) { pop('OUCH!', d.x, CATCH_Y - 20, '#ff8080'); lose('A Pineco burst!'); continue; }
            combo++;
            const mult = Math.min(5, 1 + Math.floor(combo / 5)), got = k.pts * mult;
            api.add(got);
            pop(`+${got}`, d.x, CATCH_Y - 24, k.gold ? '#ffe060' : '#ffffff');
            api.sound(k.gold ? 'coins' : mult > 1 ? 'plink-2' : 'plink-1', 'select');
            if (mult > 1 && combo % 5 === 0) { pop(`COMBO x${mult}!`, W / 2, 110, '#ffd84a'); api.say(`Combo x${mult}! Keep catching!`); }
            continue;
          }
          if (d.y - k.r > GROUND) {
            drops.splice(i, 1);
            if (k.bad) { pop('Phew!', d.x, GROUND - 14, '#c8e8ff'); continue; }
            pop('Splat!', d.x, GROUND - 14, '#ff9a9a');
            lose('Too many Berries dropped!');
          }
        }
        for (let i = pops.length - 1; i >= 0; i--) if ((pops[i].t += dt) > 0.9) pops.splice(i, 1);
      },
      down(px) { target = px; },
      move(px, py, pressed) { if (pressed) target = px; },
      key(k, down) { if (k === 'left' || k === 'right') held[k] = down; },
      draw(g, now) {
        const sky = g.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#8ad0f8'); sky.addColorStop(1, '#d8f0ff');
        g.fillStyle = sky; g.fillRect(0, 0, W, GROUND);
        g.fillStyle = '#a8d890';
        for (const [cx, r] of [[40, 90], [160, 110], [270, 80]]) { g.beginPath(); g.arc(cx, GROUND + 30, r, Math.PI, 0); g.fill(); }
        // the Berry tree's canopy along the top, its fruit hanging
        g.fillStyle = '#3a8a3a'; g.fillRect(0, 0, W, 34);
        g.fillStyle = '#4aa848';
        for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(i * 38 + 6, 34 + Math.sin(i * 1.7) * 6, 26, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#5ac058';
        for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(i * 40 + 24, 22, 16, 0, Math.PI * 2); g.fill(); }
        for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#e84868' : '#3a7ae0'; g.beginPath(); g.arc(i * 52 + 26, 50 + Math.sin(now / 400 + i) * 1.5, 5, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#6aba48'; g.fillRect(0, GROUND, W, H - GROUND);
        g.fillStyle = '#4a9a38'; for (let i = 0; i < 20; i++) g.fillRect(i * 16 + 4, GROUND, 3, 6 + (i % 3) * 2);
        for (const d of drops) {
          const k = KINDS[d.kind];
          g.save(); g.translate(d.x, d.y); g.rotate(d.a);
          if (k.bad) {
            drawMon(g, 'pineco', 0, k.r * 1.2, k.r * 2.6);
          } else {
            if (k.gold) { g.shadowColor = '#ffe060'; g.shadowBlur = 12; }
            const img = pic(k.img);
            if (img.complete && img.naturalWidth) { g.imageSmoothingEnabled = false; g.drawImage(img, -k.r * 1.6, -k.r * 1.6, k.r * 3.2, k.r * 3.2); }
            else { g.fillStyle = k.gold ? '#ffd84a' : '#3a7ae0'; g.beginPath(); g.arc(0, 0, k.r, 0, Math.PI * 2); g.fill(); }
            g.shadowBlur = 0;
          }
          g.restore();
        }
        // Pachirisu, hopping as it runs, blinking red for a moment after a heart is lost
        const moving = target !== null || held.left || held.right;
        g.fillStyle = 'rgba(0, 0, 0, 0.15)'; g.beginPath(); g.ellipse(x, GROUND + 3, 18, 4, 0, 0, Math.PI * 2); g.fill();
        if (!(hurt > 0 && Math.floor(now / 80) % 2)) drawMon(g, 'pachirisu', x, GROUND + 2 - (moving ? Math.abs(Math.sin(now / 70)) * 5 : 0), 46, face > 0);
        for (const p of pops) { g.globalAlpha = 1 - p.t / 0.9; banner(g, p.text, p.x, p.y - p.t * 30, 14, p.colour); g.globalAlpha = 1; }
        for (let i = 0; i < HEARTS; i++) {
          const hx = 14 + i * 20, hy = H - 20;
          g.fillStyle = i < hearts ? '#e84860' : 'rgba(0, 0, 0, 0.3)';
          g.beginPath(); g.moveTo(hx, hy + 6); g.bezierCurveTo(hx - 9, hy - 2, hx - 4, hy - 9, hx, hy - 3); g.bezierCurveTo(hx + 4, hy - 9, hx + 9, hy - 2, hx, hy + 6); g.fill();
        }
        const mult = Math.min(5, 1 + Math.floor(combo / 5));
        if (combo > 1) banner(g, `${combo} in a row${mult > 1 ? ` · x${mult}` : ''}`, W - 70, H - 20, 12, mult > 1 ? '#ffd84a' : '#ffffff');
      },
    };
  },
}, onClose);
