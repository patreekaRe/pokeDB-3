/* arcade-rhythm.js  -  Jigglypuff's Sing-Along, a home arcade game (js/arcade-kit.js): Jigglypuff sings its song and the
   notes fall down three lanes to the hit line. Tap a lane (or the arrow keys) as a note reaches it: Perfect or Good,
   a combo raising the multiplier. A miss fills the sleepy meter, and full, you nod off. The song speeds up each verse. */

import { runArcade, drawMon, banner, rand } from './arcade-kit.js';

const W = 300, H = 380, LANES = 3, LW = 80, LX = (W - LANES * LW) / 2, HIT = 334, TOP = 120, PERFECT = 0.075, GOOD = 0.15, LATE = 0.17;
const COLS = ['#ff7ab8', '#ffd060', '#7ad0ff'], VOICE = 'flute';
const LANE_OF = [0, 0, 0, 0, 1, 1, 1, 2, 2, 2];
// [note, beats]: notes are FURNITURE_NOTES' major pentatonic from middle C, so every note is the synth's own
const SONG = [
  [7, 1], [6, 1], [5, 2], [7, 1], [6, 1], [5, 1], [3, 1], [5, 1], [6, 1], [7, 1], [8, 1], [7, 2], [6, 2],
  [5, 1], [6, 1], [7, 2], [6, 1], [5, 1], [3, 2], [2, 1], [3, 1], [5, 1], [6, 1], [5, 4],
  [3, 1], [2, 1], [1, 2], [3, 1], [2, 1], [1, 1], [0, 1], [2, 1], [3, 1], [5, 1], [6, 1], [5, 2], [3, 2],
  [7, 1], [8, 1], [9, 2], [8, 1], [7, 1], [6, 2], [5, 1], [6, 1], [7, 1], [6, 1], [5, 4],
];

export const openRhythm = (onClose) => runArcade({
  id: 'rhythm', title: 'Jigglypuff\'s Sing-Along', colour: '#f080b0', W, H,
  sounds: Array.from({ length: 10 }, (_, n) => `${VOICE}-${n}`),
  intro: 'Sing along with Jigglypuff! Tap the lanes as the notes reach the line.',
  go: 'Jiggly... puff! Tap each note on the line.',
  help: [['Tap a lane as its note reaches the line', '(or Left / Down / Right; Up or Space is the middle too).'], ['Perfect scores 10, Good 5,', 'times your combo: x2 at 10 in a row, up to x4.'], ['Every miss fills the sleepy meter.', 'Fill it and you fall asleep. The song speeds up each verse.']],
  make(api) {
    let clock = -1.6, cursor = 0, step = 0, verse = 0, combo = 0, bestCombo = 0, sleep = 0, ended = false, sang = 0;
    const notes = [], pops = [], glow = [0, 0, 0], floaters = [];
    const bpm = () => Math.min(168, 92 + verse * 10), fall = () => Math.min(330, 170 + verse * 22), lead = () => (HIT - TOP + 40) / fall();
    const lastIn = [-9, -9, -9];
    const spawn = () => {
      while (cursor < clock + lead()) {
        const [n, beats] = SONG[step], len = beats * 60 / bpm();
        const split = verse >= 2 && beats >= 2 && Math.random() < Math.min(0.5, verse * 0.12);
        const parts = split ? [[n, len / 2], [n === 9 ? 8 : n + 1, len / 2]] : [[n, len]];
        let t = cursor;
        for (const [m, l] of parts) {
          const lane = LANE_OF[m];
          if (t - lastIn[lane] >= 0.24) { notes.push({ t, lane, n: m, wob: rand(0, 6) }); lastIn[lane] = t; }
          t += l;
        }
        cursor += len;
        if (++step >= SONG.length) { step = 0; verse += 1; cursor += 60 / bpm() * 2; }
      }
    };
    spawn();
    const pop = (lane, text, colour) => pops.push({ x: LX + lane * LW + LW / 2, y: HIT - 34, text, colour, life: 0.7 });
    const mult = () => Math.min(4, 1 + Math.floor(combo / 10));
    const miss = (lane) => {
      combo = 0; sleep = Math.min(1, sleep + 0.13);
      pop(lane, 'MISS', '#b0b0d0'); api.sound('cancel');
      if (sleep >= 1 && !ended) { ended = true; api.over('Fell asleep!'); }
      else if (sleep > 0.6) api.say('Zzz... stay awake!');
    };
    const hit = (lane) => {
      if (ended) return;
      glow[lane] = 1;
      let best = null;
      for (const o of notes) if (o.lane === lane && !o.done && Math.abs(o.t - clock) <= GOOD && (!best || Math.abs(o.t - clock) < Math.abs(best.t - clock))) best = o;
      if (!best) return;
      best.done = true;
      const off = Math.abs(best.t - clock), perfect = off <= PERFECT;
      combo += 1; bestCombo = Math.max(bestCombo, combo);
      api.add((perfect ? 10 : 5) * mult());
      sleep = Math.max(0, sleep - (perfect ? 0.03 : 0.015));
      pop(lane, perfect ? 'PERFECT' : 'GOOD', perfect ? '#ffe060' : '#a8f0a0');
      api.sound(`${VOICE}-${best.n}`, 'plink-1');
      floaters.push({ x: W / 2 + rand(-30, 30), y: 70, vx: rand(-30, 30), life: 1.4, c: COLS[lane] });
      sang = 0.25;
      if (combo % 10 === 0) api.say(`${combo} in a row! x${mult()}`);
    };
    const laneAt = (x) => Math.max(0, Math.min(LANES - 1, Math.floor((x - LX) / LW)));
    const noteGlyph = (g, x, y, c, s) => {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.shadowColor = c; g.shadowBlur = 10;
      g.fillStyle = c; g.strokeStyle = c; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.ellipse(-3, 4, 9, 7, -0.4, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(5, 2); g.lineTo(5, -18); g.quadraticCurveTo(14, -14, 13, -4); g.stroke();
      g.shadowBlur = 0; g.fillStyle = 'rgba(255, 255, 255, 0.6)'; g.beginPath(); g.ellipse(-6, 2, 3, 2, -0.4, 0, Math.PI * 2); g.fill();
      g.restore();
    };
    return {
      tick(dt) {
        if (ended) return;
        clock += dt; spawn();
        for (const o of notes) if (!o.done && clock - o.t > LATE) { o.done = o.missed = true; miss(o.lane); }
        for (let i = notes.length - 1; i >= 0; i--) if (notes[i].done && clock - notes[i].t > 0.4) notes.splice(i, 1);
        for (let i = 0; i < LANES; i++) glow[i] = Math.max(0, glow[i] - dt * 5);
        for (const p of pops) { p.life -= dt; p.y -= dt * 30; }
        for (const f of floaters) { f.life -= dt; f.y -= dt * 40; f.x += f.vx * dt; }
        while (pops.length && pops[0].life <= 0) pops.shift();
        while (floaters.length && floaters[0].life <= 0) floaters.shift();
        sang = Math.max(0, sang - dt);
      },
      down(x, y) { if (y > TOP - 20) hit(laneAt(x)); },
      key(k, down) { if (down) hit({ left: 0, down: 1, up: 1, act: 1, right: 2 }[k]); },
      draw(g, now) {
        g.lineJoin = 'round';
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#5a2a6a'); bg.addColorStop(0.45, '#3a1a50'); bg.addColorStop(1, '#1e1030');
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        const spot = g.createRadialGradient(W / 2, 70, 6, W / 2, 70, 120); spot.addColorStop(0, 'rgba(255, 190, 230, 0.55)'); spot.addColorStop(1, 'rgba(255, 190, 230, 0)');
        g.fillStyle = spot; g.fillRect(0, 0, W, 200);
        for (let i = 0; i < 14; i++) { const sx = (i * 73) % W, sy = 12 + (i * 37) % 90; g.fillStyle = `rgba(255, 255, 255, ${0.25 + 0.25 * Math.sin(now / 400 + i)})`; g.beginPath(); g.arc(sx, sy, 1.3, 0, Math.PI * 2); g.fill(); }
        const beat = clock > 0 ? (clock * bpm() / 60) % 1 : 0, bob = Math.sin(beat * Math.PI) * 3;
        g.fillStyle = 'rgba(0, 0, 0, 0.3)'; g.beginPath(); g.ellipse(W / 2, 104, 34, 6, 0, 0, Math.PI * 2); g.fill();
        drawMon(g, 'jigglypuff', W / 2, 104 - bob, 64 * (1 + sang * 0.15));
        g.strokeStyle = '#8a8a9a'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2 + 22, 100 - bob); g.lineTo(W / 2 + 30, 76 - bob); g.stroke();
        const mic = g.createRadialGradient(W / 2 + 29, 70 - bob, 1, W / 2 + 31, 72 - bob, 8); mic.addColorStop(0, '#ffffff'); mic.addColorStop(1, '#6a6a7a');
        g.fillStyle = mic; g.beginPath(); g.arc(W / 2 + 31, 72 - bob, 7, 0, Math.PI * 2); g.fill();
        for (const f of floaters) { g.globalAlpha = Math.min(1, f.life); noteGlyph(g, f.x, f.y, f.c, 0.6); }
        g.globalAlpha = 1;
        g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.roundRect(10, 12, 86, 26, 13); g.fill();
        const sl = g.createLinearGradient(14, 0, 92, 0); sl.addColorStop(0, '#8ad0ff'); sl.addColorStop(1, '#b080ff');
        if (sleep > 0) { g.fillStyle = sl; g.beginPath(); g.roundRect(14, 26, Math.max(8, 78 * sleep), 8, 4); g.fill(); }
        g.font = '800 10px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#e8e0ff'; g.fillText('SLEEPY', 16, 19);
        g.fillText('z'.repeat(1 + Math.floor(sleep * 3)), 60, 19 + Math.sin(now / 300) * 1.5);
        g.fillStyle = 'rgba(0, 0, 0, 0.35)'; g.beginPath(); g.roundRect(W - 96, 12, 86, 26, 13); g.fill();
        g.textAlign = 'center'; g.fillStyle = '#ffe0f0'; g.fillText(`COMBO ${combo}`, W - 53, 19);
        g.fillStyle = mult() > 1 ? '#ffd84a' : '#c8b8e0'; g.font = '800 11px system-ui, sans-serif'; g.fillText(`x${mult()}`, W - 53, 31);
        for (let i = 0; i < LANES; i++) {
          const x = LX + i * LW, lg = g.createLinearGradient(0, TOP - 10, 0, H);
          lg.addColorStop(0, 'rgba(255, 255, 255, 0)'); lg.addColorStop(1, `rgba(255, 255, 255, ${0.07 + glow[i] * 0.18})`);
          g.fillStyle = lg; g.fillRect(x + 3, TOP - 10, LW - 6, H - TOP + 10);
          g.strokeStyle = 'rgba(255, 255, 255, 0.1)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 3, TOP); g.lineTo(x + 3, H); g.moveTo(x + LW - 3, TOP); g.lineTo(x + LW - 3, H); g.stroke();
          const cx = x + LW / 2, rg = g.createRadialGradient(cx, HIT, 4, cx, HIT, 24 + glow[i] * 6);
          rg.addColorStop(0, `rgba(255, 255, 255, ${0.15 + glow[i] * 0.5})`); rg.addColorStop(1, 'rgba(255, 255, 255, 0)');
          g.fillStyle = rg; g.beginPath(); g.arc(cx, HIT, 30, 0, Math.PI * 2); g.fill();
          g.strokeStyle = COLS[i]; g.lineWidth = 3; g.beginPath(); g.arc(cx, HIT, 18 + glow[i] * 3, 0, Math.PI * 2); g.stroke();
          g.fillStyle = 'rgba(255, 255, 255, 0.5)'; g.font = '800 10px system-ui, sans-serif'; g.fillText(['◀', '▼', '▶'][i], cx, HIT + 32);
        }
        g.strokeStyle = 'rgba(255, 255, 255, 0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(LX, HIT); g.lineTo(LX + LANES * LW, HIT); g.stroke();
        for (const o of notes) {
          if (o.done && !o.missed) continue;
          const y = HIT - (o.t - clock) * fall();
          if (y < TOP - 20) continue;
          g.globalAlpha = o.missed ? Math.max(0, 1 - (clock - o.t) * 3) : Math.min(1, (y - TOP + 20) / 30);
          noteGlyph(g, LX + o.lane * LW + LW / 2 + Math.sin(now / 250 + o.wob) * 3, y, o.missed ? '#707090' : COLS[o.lane], 1);
        }
        g.globalAlpha = 1;
        for (const p of pops) { g.globalAlpha = Math.min(1, p.life * 2); banner(g, p.text, p.x, p.y, 14 + (p.text === 'PERFECT' ? 2 : 0), p.colour); }
        g.globalAlpha = 1;
        if (clock < 0 && clock > -1.5) banner(g, clock < -0.75 ? 'READY?' : 'SING!', W / 2, 220, 30, '#ffd0ea');
        if (sleep > 0.5) { const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); v.addColorStop(0, 'rgba(10, 0, 30, 0)'); v.addColorStop(1, `rgba(10, 0, 30, ${(sleep - 0.5) * 1.4})`); g.fillStyle = v; g.fillRect(0, 0, W, H); }
      },
    };
  },
}, onClose);
