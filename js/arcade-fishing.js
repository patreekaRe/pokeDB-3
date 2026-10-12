/* arcade-fishing.js  -  Magikarp Fishing, a home arcade game (js/arcade-kit.js): tap to cast, wait for the bite, tap
   while the "!" shows to hook it. Magikarp 1, Goldeen 2, Poliwag 3, Staryu 4, a rare Gyarados 10. Three that get away
   end the game; the bite window shrinks as you catch more. */

import { runArcade, drawMon, rand, banner } from './arcade-kit.js';

const W = 300, H = 330, SHORE = 120, LIVES = 3;
const FISH = [['magikarp', 1, 48], ['goldeen', 2, 20], ['poliwag', 3, 14], ['staryu', 4, 10], ['gyarados', 10, 3]];
const catchOne = () => { let r = Math.random() * FISH.reduce((a, f) => a + f[2], 0); for (const f of FISH) if ((r -= f[2]) < 0) return f; return FISH[0]; };

export const openFishing = (onClose) => runArcade({
  id: 'fishing', title: 'Magikarp Fishing', colour: '#3a8ae0', W, H,
  intro: 'Cast your line, wait for the bite, then tap fast!',
  help: [['Tap to cast your line.', 'Then wait: don\'t tap too early or it gets away.'], ['When the "!" pops up, tap!', 'Magikarp 1, Goldeen 2, Poliwag 3, Staryu 4, Gyarados 10.'], [`${LIVES} that get away end the game.`, 'The more you catch, the quicker you have to be.']],
  make(api) {
    let phase = 'idle', t = 0, wait = 0, bobX = 150, bobY = 220, lives = LIVES, caught = 0, shown = null, window_ = 0.9;
    const lose = (why) => {
      lives -= 1; api.sound('cancel'); api.say(why);
      if (lives <= 0) return api.over('Out of bait!');
      phase = 'idle'; t = 0;
    };
    return {
      tick(dt) {
        t += dt;
        if (phase === 'cast' && t > 0.5) { phase = 'wait'; t = 0; wait = rand(1.2, 3.8); }
        else if (phase === 'wait' && t > wait) { phase = 'bite'; t = 0; api.sound('plink-2'); }
        else if (phase === 'bite' && t > window_) lose('Too slow, it got away!');
        else if (phase === 'reel' && t > 1.4) { phase = 'idle'; t = 0; }
      },
      down() {
        if (phase === 'idle') { phase = 'cast'; t = 0; bobX = rand(70, 230); bobY = rand(180, 280); api.sound('select'); api.say('Wait for it...'); }
        else if (phase === 'wait' || phase === 'cast') lose('Too early, it swam off!');
        else if (phase === 'bite') {
          const [id, pts] = catchOne();
          shown = id; caught += 1; api.add(pts);
          window_ = Math.max(0.42, 0.9 - caught * 0.03);
          phase = 'reel'; t = 0;
          api.sound(id === 'gyarados' ? 'stat-up' : 'coins', 'select');
          api.say(id === 'gyarados' ? 'A GYARADOS! +10!' : `Caught a ${id[0].toUpperCase()}${id.slice(1)}! +${pts}`);
        }
      },
      draw(g, now) {
        const sky = g.createLinearGradient(0, 0, 0, SHORE); sky.addColorStop(0, '#8ad0f8'); sky.addColorStop(1, '#d8f0f8');
        g.fillStyle = sky; g.fillRect(0, 0, W, SHORE);
        g.fillStyle = '#5a9a4a'; g.beginPath(); g.moveTo(0, SHORE); for (let x = 0; x <= W; x += 30) g.lineTo(x, SHORE - 18 - Math.sin(x / 40) * 10); g.lineTo(W, SHORE); g.fill();
        const sea = g.createLinearGradient(0, SHORE, 0, H); sea.addColorStop(0, '#3a9ae0'); sea.addColorStop(1, '#1a4a90');
        g.fillStyle = sea; g.fillRect(0, SHORE, W, H - SHORE);
        g.strokeStyle = 'rgba(255, 255, 255, 0.25)'; g.lineWidth = 2;
        for (let i = 0; i < 8; i++) { const y = SHORE + 20 + i * 26, x = ((now / 30 + i * 70) % (W + 60)) - 30; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30, y); g.stroke(); }
        const rodX = 30, rodY = H - 10, tipX = 110, tipY = SHORE + 30;
        g.strokeStyle = '#6a4020'; g.lineWidth = 5; g.beginPath(); g.moveTo(rodX, rodY); g.lineTo(tipX, tipY); g.stroke();
        if (phase !== 'idle') {
          const dip = phase === 'bite' ? 6 + Math.sin(now / 40) * 4 : Math.sin(now / 300) * 2;
          const k = phase === 'cast' ? Math.min(1, t / 0.5) : 1, bx = tipX + (bobX - tipX) * k, by = tipY + (bobY - tipY) * k - Math.sin(k * Math.PI) * 60;
          g.strokeStyle = 'rgba(255, 255, 255, 0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tipX, tipY); g.lineTo(bx, by + dip); g.stroke();
          if (phase !== 'cast') { g.strokeStyle = 'rgba(255, 255, 255, 0.5)'; g.beginPath(); g.ellipse(bx, by + 4, 14 + (now / 30) % 10, 4, 0, 0, Math.PI * 2); g.stroke(); }
          g.fillStyle = '#e83a3a'; g.beginPath(); g.arc(bx, by + dip, 6, Math.PI, 0); g.fill();
          g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(bx, by + dip, 6, 0, Math.PI); g.fill();
          if (phase === 'bite') banner(g, '!', bx, by - 30, 40, '#ffd84a');
          if (phase === 'reel' && shown) drawMon(g, shown, W / 2, SHORE + 20 + Math.min(1, t * 2) * 60, shown === 'gyarados' ? 140 : 90);
        } else banner(g, 'TAP TO CAST', W / 2, SHORE + 90, 18, 'rgba(255, 255, 255, 0.85)');
        for (let i = 0; i < LIVES; i++) { g.globalAlpha = i < lives ? 1 : 0.25; drawMon(g, 'magikarp', W - 20 - i * 26, 30, 24); }
        g.globalAlpha = 1;
      },
    };
  },
}, onClose);
