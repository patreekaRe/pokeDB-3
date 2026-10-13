/* The Gym Leader's moments (js/data/gym.js): before their boss, they slide in from the right, their speech window up from
   below, and talk, a shadow until you've beaten
   them once, lit up as they speak; after you win, their last words and the badge. One layer over whatever is showing,
   a tap (or Enter / Space) for each line. */

import { el, sleep } from './ui.js';
import { playSound, playCry } from './audio.js';
import { getSave } from './storage.js';
import { spriteOf, gymWins, voiced } from './data/gym.js';
import { battleFx, calmFx } from './prefs.js';
import { auraOn } from './aura.js';

const fill = (line, vars) => line.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

/** Their lines with their name, badge and `vars` (`{boss}`) filled in, for the 3D gym's speech window. */
export const gymLines = (l, lines, vars = {}) => lines.map(line => typeof line === 'string' ? voiced(l, fill(line, { name: l.name, badge: l.badge, ...vars })) : line);

/** JONA takes the screen (Phil's demon, `demon` in js/data/gym.js): a black-out, violet static and a shudder, a crack of
    thunder. `infuse` is the dark pouring into his Pokémon: a violet burst instead of the black. Calm effects: one soft fade. */
export function demonSwap(infuse = false) {
  const fx = el('div', `jona-flash${infuse ? ' infuse' : ''}${calmFx() ? ' calm' : ''}`);
  fx.setAttribute('aria-hidden', 'true');
  document.body.append(fx);
  playSound(infuse ? 'charge' : 'gate-crack');
  if (!infuse) setTimeout(() => playSound('thunder'), 120);
  if (!calmFx()) {
    document.body.classList.remove('jona-shake');
    void document.body.offsetWidth;
    document.body.classList.add('jona-shake');
    setTimeout(() => document.body.classList.remove('jona-shake'), 700);
  }
  setTimeout(() => fx.remove(), 1300);
}

/** Their badge spinning in over the 3D gym as they hand it over. */
export function badgePop(l) {
  import('./trainercard.js').then(({ badgeArt }) => {
    const layer = el('div', 'gym-pop'), mark = el('img', 'gym-badge');
    mark.src = badgeArt(`gym-${l.id}`, true);
    mark.alt = l.badge;
    layer.append(mark);
    document.body.append(layer);
    playSound('achievement');
    setTimeout(() => { layer.classList.add('out'); setTimeout(() => layer.remove(), 400); }, 2600);
  });
}

/** Their lines, one a tap (`bubble`: no slide-in, no dim, only their speech window popping up, for talking to them in
    their gym after the fight; a line may be `{ text, plate: true }`, said as is under their own name). `badge` shows the badge they hand over with the last line (`'gold'` its Gold one). */
/* `possess` (Phil's, js/data/gym.js): on his second line the dark takes him (a shadow aura over his sprite, the layer
   thins so the boss shows behind), and after his last he pours it into his Pokémon on the battle screen (`infuse()`):
   `possess` is `{ img, box, spriteId, ignite }`, its sprite, its portrait box, its cry, and what lights its aura. */
export async function gymTalk(l, lines, { vars = {}, badge = false, again = 0, possess = null, lit = false, speed = null, bubble = false } = {}) {
  const calm = !battleFx();
  const layer = el('div', `gym-scene${possess ? ' possess' : ''}${bubble ? ' bubble' : ''}`);
  const shadow = !possess && !lit && gymWins(getSave(), l.id) === 0;   // after the fight they've been seen
  const who = el('img', `gym-trainer pixel${shadow ? ' shadow' : ''}`);
  who.src = l.talk || spriteOf(l);
  who.alt = '';
  const plate = el('div', 'gym-plate');
  plate.append(el('small', '', 'GYM LEADER '), l.name);
  const box = el('div', 'gym-say');
  const text = el('p', 'gym-text');
  box.append(plate, text, el('i', 'gym-more'));
  if (bubble) layer.append(box); else layer.append(who, box);
  document.body.append(layer);
  if (!calm) { await sleep(20); layer.classList.add('in'); if (speed === 'in') speedLines(layer); await sleep(bubble ? 300 : 600); } else layer.classList.add('in');

  const said = gymLines(l, lines, vars);
  let darkness = null;
  try { for (let i = 0; i < said.length; i++) {
    const line = said[i];
    if (line.plate) plate.replaceChildren(el('small', '', 'GYM LEADER '), l.name);   // a narrated line after a family's talk
    if (line.who) plate.replaceChildren(line.who);   // a family's lines: whoever is talking (js/data/gym.js `voices`)
    if (line.who) {
      if (line.demon && !layer.classList.contains('demon')) demonSwap();
      layer.classList.toggle('demon', !!line.demon);
    }
    text.textContent = line.text ?? line;
    if (!calm && i === (speed === 'last' ? said.length - 1 : speed)) speedLines(layer);   // a number: that line
    if (i === 0 && shadow && l.sprite) { await sleep(calm ? 0 : 260); who.classList.remove('shadow'); }
    if (possess && i === Math.min(1, said.length - 1)) {
      layer.classList.add('taken');
      try { darkness = auraOn(who, 3, 'dark'); } catch (e) { console.error(e); }   // the talk must go on without it
      playSound('power');
    }
    await tap(layer);
    playSound('confirm');
  }
  if (possess) await infuse(layer, who, possess, () => { darkness?.(); darkness = null; });
  if (badge) await badgeGet(layer, l, again, badge === 'gold');
  } catch (e) { console.error(e); }   // never leave the layer stuck over the battle
  layer.classList.remove('in');
  layer.classList.add('out');
  darkness?.();
  await sleep(calm ? 0 : 320);
  layer.remove();
}

/** Anime speed lines racing past for a beat: only as they call their Pokémon out (`speed: 'last'`) and as they slide in
    on the battle screen to send it out (`speed: 'in'`), the user's two. */
function speedLines(layer) {
  if (calmFx()) return;
  const lines = el('div', 'gym-speed');
  lines.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 18; i++) {
    const s = el('i');
    s.style.setProperty('--y', `${4 + Math.random() * 92}%`);
    s.style.setProperty('--w', `${30 + Math.random() * 50}%`);
    s.style.setProperty('--h', `${1 + Math.floor(Math.random() * 4)}px`);
    s.style.setProperty('--t', `${0.22 + Math.random() * 0.2}s`);
    s.style.setProperty('--d', `${-Math.random() * 0.4}s`);
    lines.append(s);
  }
  layer.prepend(lines);
  playSound('run-away');
  setTimeout(() => lines.remove(), 1400);
}

/** Their badge handed over, after their last words (the user's ask, 2026-10-13): the screen goes dark but for the badge on
    the gym's arch (or, without the 3D gym, the middle of the screen's top), glowing, and the badge is the only thing that
    takes a tap. Tapped, it spins ten turns on the arch like a Pokéstop, then pops off it, tumbles out towards you spinning and lands mid-screen with a flash, a
    shockwave and sparks; golden rays wheel open, a shine runs over it and YOU RECEIVED the badge rises under it. A tap
    after it lands goes on. Calm effects: it glides down, still. */
async function badgeGet(layer, l, again = 0, gold = false) {
  const calm = !battleFx() || calmFx();
  const { badgeArt } = await import('./trainercard.js');
  const room = await import('./event-3d.js').catch(() => null);
  const src = badgeArt(`gym-${l.id}${gold ? '-gold' : ''}`, true), name = gold ? `Gold ${l.badge}` : l.badge;
  const stage = el('div', `gym-get${calm ? ' calm' : ''}`);
  const spin = el('div', 'gym-get-badge'), mark = el('img', 'gym-get-mark'), shine = el('i', 'gym-get-shine');
  mark.src = src;
  mark.alt = name;
  mark.draggable = false;
  shine.style.maskImage = shine.style.webkitMaskImage = `url("${src}")`;
  spin.append(el('i', 'gym-get-halo'), mark, shine);
  spin.setAttribute('role', 'button');
  spin.setAttribute('aria-label', `Take the ${name}`);
  const sparks = el('div', 'gym-get-sparks');
  for (let i = 0; i < 28; i++) {
    const s = el('i');
    s.style.setProperty('--a', `${i * 360 / 28 + Math.random() * 8}deg`);
    s.style.setProperty('--d', `${120 + Math.random() * 140}px`);
    s.style.setProperty('--t', `${0.7 + Math.random() * 0.6}s`);
    sparks.append(s);
  }
  const cap = el('div', 'gym-get-cap');
  cap.append(el('small', '', 'YOU RECEIVED THE'), el('b', '', name.toUpperCase()));
  if (again) cap.append(el('small', '', `BEATEN ${again + 1} TIMES`));   // every win hands it over, a repeat counted (the user's call, 2026-10-13)
  const hint = el('div', 'gym-get-hint', 'TAP THE BADGE');
  stage.append(el('div', 'gym-get-rays'), el('i', 'gym-get-ring'), sparks, spin, el('i', 'gym-get-flash'), cap, hint);
  layer.classList.add('getting');
  layer.append(stage);
  // where it waits: over the badge on the arch, the same size, or near the top of the screen
  const box = stage.getBoundingClientRect(), size = spin.getBoundingClientRect().width || 160;
  const at = room?.gymBadgeAt?.() || { x: box.left + box.width / 2, y: box.top + box.height * 0.2, r: size * 0.32 };
  const from = `translate(${at.x - box.left - box.width / 2}px, ${at.y - box.top - box.height * 0.4}px) scale(${Math.max(0.15, at.r * 2 / size)})`;
  spin.style.transform = from;
  await sleep(20);
  stage.classList.add('go', 'wait');
  playSound('badge-ready');
  await new Promise(done => {
    const take = (e) => { e?.preventDefault?.(); spin.removeEventListener('pointerup', take); document.removeEventListener('keydown', key); done(); };
    const key = (e) => { if (e.key === 'Enter' || e.key === ' ') take(e); };
    setTimeout(() => { spin.addEventListener('pointerup', take); document.addEventListener('keydown', key); }, 350);
  });
  stage.classList.remove('wait');
  room?.gymBadgeShown?.(false);
  playSound('confirm');
  const settle = (keys, duration) => { const a = spin.animate(keys, { duration, fill: 'forwards' }); return a.finished.catch(() => {}).then(() => a); };
  const flights = [];
  if (calm) flights.push(await settle([{ transform: from }, { transform: 'none' }], 500));
  else {
    // spun on the arch like a Pokéstop: it swells up where it is, then whirls ten turns in a blur of light and slows to a
    // stop before it pops. The turn is the picture's own `rotate` (gymStopSpin in css/screens.css), apart from the
    // badge's place, and it swells to a size a phone can see: the arch's badge is small on one.
    const big = `${from} scale(${Math.max(1.3, 0.55 * size / Math.max(1, at.r * 2))})`;
    playSound('aug-silver');
    flights.push(await settle([{ transform: `${from} scale(1)` }, { transform: big, easing: 'cubic-bezier(.3, 1.5, .5, 1)' }], 320));
    stage.classList.add('spinning');
    playSound('badge-spin');
    setTimeout(() => playSound('aug-gold'), 1900);
    await sleep(2100);
    stage.classList.remove('spinning');
    stage.classList.add('popped');
    playSound('run-away');
    setTimeout(() => playSound('fw-launch'), 120);
    // it pops off the arch towards you, tumbles up over the screen and slams down in the middle (timed on the frames
    // drawn, so the landing's flash never comes before the badge does)
    flights.push(await settle([
      { transform: `${big} rotateY(0deg)` },
      { transform: `${big} translateY(-14%) scale(1.2) rotateY(180deg)`, offset: 0.19, easing: 'cubic-bezier(.4, 0, .6, 1)' },
      { transform: 'translate(0, -22vh) scale(1.6) rotateY(900deg) rotateZ(-12deg)', offset: 0.72, easing: 'cubic-bezier(.5, 0, .9, .5)' },
      { transform: 'translate(0, 0) scale(1.18, 0.82) rotateY(1440deg) rotateZ(0deg)' },
    ], 1300));
    stage.classList.add('land');
    playSound('fw-boom');
    setTimeout(() => playSound('fw-crackle'), 180);
    setTimeout(() => playSound('achievement'), 450);
    flights.push(await settle([
      { transform: 'translate(0, 0) scale(1.18, 0.82) rotateY(1440deg)', easing: 'ease-out' },
      { transform: 'translate(0, -3vh) scale(0.96, 1.06) rotateY(1440deg)', offset: 0.5, easing: 'ease-in' },
      { transform: 'none' },
    ], 260));
    await sleep(600);
  }
  if (calm) playSound('achievement');
  spin.style.transform = '';
  flights.forEach(a => a.cancel());
  stage.classList.add('done');
  await tap(layer);
  playSound('confirm');
}

/** Phil pours JONA into his Pokémon, on the battle screen: the speech window and the dim go, a stream of dark energy and
    tendrils flows from him into it while it writhes and cries, his aura gutters out and he goes grey and lifeless, then a
    violet burst, a shockwave, and it rises burning with JONA's aura, crying again in her echoing voice. Calm effects:
    the burst and the cries only. */
async function infuse(layer, who, { img, box, spriteId, ignite }, snuff) {
  const calm = !battleFx() || calmFx();
  layer.classList.add('infusing');
  const fx = el('canvas', 'gym-infuse');
  layer.append(fx);
  const dpr = Math.min(2, devicePixelRatio || 1);
  fx.width = innerWidth * dpr; fx.height = innerHeight * dpr;
  const g = fx.getContext('2d');
  const from = () => { const r = who.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.42]; };
  const to = () => { const r = img.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.6]; };
  const bits = [], rings = [];
  let pouring = !calm, start = performance.now(), live = true;
  const draw = (now) => {
    if (!live || !g) return;
    const t = (now - start) / 1000, [ax, ay] = from(), [bx, by] = to();
    const cx = (ax + bx) / 2 - 40, cy = Math.min(ay, by) - 120;   // the stream arcs up over the field
    const along = (k, wob = 0) => {
      const u = 1 - k;
      return [u * u * ax + 2 * u * k * cx + k * k * bx + Math.sin(k * 9 + t * 7 + wob) * 14 * Math.sin(k * Math.PI),
        u * u * ay + 2 * u * k * cy + k * k * by + Math.cos(k * 7 + t * 5 + wob) * 10 * Math.sin(k * Math.PI)];
    };
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, innerWidth, innerHeight);
    g.globalCompositeOperation = 'lighter';
    if (pouring) {
      for (let n = 0; n < 3; n++) {   // three tendrils writhing along the stream
        g.beginPath();
        for (let k = 0; k <= 1.001; k += 0.04) { const [x, y] = along(k, n * 2.1); k ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.strokeStyle = ['rgba(150, 60, 255, 0.55)', 'rgba(255, 60, 140, 0.35)', 'rgba(210, 150, 255, 0.4)'][n];
        g.lineWidth = [7, 4, 2][n] * (0.8 + 0.3 * Math.sin(t * 13 + n));
        g.stroke();
      }
      for (let n = 0; n < 6; n++) bits.push({ k: 0, v: 0.55 + Math.random() * 0.6, wob: Math.random() * 6, s: 2 + Math.random() * 4,
        c: ['#c878ff', '#8a34e0', '#ff3868', '#f8e8ff', '#3c0c66'][Math.floor(Math.random() * 5)] });
    }
    for (let i = bits.length - 1; i >= 0; i--) {
      const p = bits[i];
      p.k += p.v / 60;
      if (p.k >= 1) { bits.splice(i, 1); continue; }
      const [x, y] = along(p.k, p.wob);
      g.globalAlpha = Math.min(1, (1 - p.k) * 3, p.k * 6);
      g.fillStyle = p.c;
      g.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s);
    }
    g.globalAlpha = 1;
    for (let i = rings.length - 1; i >= 0; i--) {   // the burst's shockwaves
      const r = rings[i], age = (now - r.at) / 1000;
      if (age < 0) continue;
      if (age > r.life) { rings.splice(i, 1); continue; }
      const k = age / r.life;
      g.beginPath();
      g.arc(bx, by, r.r0 + k * r.grow, 0, Math.PI * 2);
      g.strokeStyle = `rgba(${r.c}, ${1 - k})`;
      g.lineWidth = r.w * (1 - k) + 1;
      g.stroke();
    }
    const swell = pouring ? Math.min(1, t / 1.4) : 0;
    if (swell) {   // the dark gathering round its Pokémon as it fills
      const glow = g.createRadialGradient(bx, by, 0, bx, by, 60 + 40 * swell);
      glow.addColorStop(0, `rgba(200, 110, 255, ${0.5 * swell})`);
      glow.addColorStop(1, 'rgba(60, 0, 120, 0)');
      g.fillStyle = glow;
      g.fillRect(bx - 110, by - 110, 220, 220);
    }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
  try {
    if (!calm) {
      playSound('charge');
      setTimeout(() => playSound('gate-hum'), 300);
      await sleep(500);
      box.classList.add('writhing');
      playCry(spriteId);   // it fights it
      await sleep(1500);
      snuff();
      who.classList.add('drained');
      playSound('gate-crack');
      await sleep(500);
      pouring = false;
      await sleep(250);
    } else snuff();
    box.classList.remove('writhing');
    demonSwap(true);
    playSound('thunder');
    const now = performance.now();
    if (!calm) for (const [i, r] of [[0, '255, 220, 255'], [140, '170, 60, 255'], [300, '255, 50, 110']].entries())
      rings.push({ at: now + r[0], r0: 10 + i * 6, grow: 220 + i * 60, w: 10 - i * 2, life: 0.9 + i * 0.2, c: r[1] });
    try { ignite(); } catch (e) { console.error(e); }   // battle.js lights it again once the talk is gone
    await sleep(calm ? 300 : 650);
    await Promise.race([playCry(spriteId, { rate: 0.72, echo: true }), sleep(2600)]);   // and it answers in JONA's voice
    if (!calm) { who.classList.add('gone'); await sleep(500); }
  } finally {
    live = false;
    box.classList.remove('writhing');
    fx.remove();
    fx.width = fx.height = 0;   // hand iOS its canvas memory back, for the aura
  }
}

/** One tap anywhere on the layer, or Enter / Space. `pointerup` as well as `click`: iOS sends no click for a tap on
    Phil once he shudders and his aura redraws under the finger, which left the talk stuck there. */
function tap(layer) {
  return new Promise(done => {
    const end = () => {
      layer.removeEventListener('pointerup', end); layer.removeEventListener('click', end);
      document.removeEventListener('keydown', key); done();
    };
    const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); end(); } };
    setTimeout(() => {
      layer.addEventListener('pointerup', end); layer.addEventListener('click', end); document.addEventListener('keydown', key);
    }, 150);
  });
}
