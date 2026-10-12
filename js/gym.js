/* The Gym Leader's moments (js/data/gym.js): before their boss, they slide in and talk, a shadow until you've beaten
   them once, lit up as they speak; after you win, their last words and the badge. One layer over whatever is showing,
   a tap (or Enter / Space) for each line. */

import { el, sleep } from './ui.js';
import { playSound } from './audio.js';
import { getSave } from './storage.js';
import { spriteOf, gymWins } from './data/gym.js';
import { battleFx } from './prefs.js';

const fill = (line, vars) => line.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

/** Their lines, one a tap. `badge` shows the badge they hand over with the last line. */
export async function gymTalk(l, lines, { vars = {}, badge = false } = {}) {
  const calm = !battleFx();
  const layer = el('div', 'gym-scene');
  const shadow = gymWins(getSave(), l.id) === 0;
  const who = el('img', `gym-trainer pixel${shadow ? ' shadow' : ''}`);
  who.src = spriteOf(l);
  who.alt = '';
  const plate = el('div', 'gym-plate');
  plate.append(el('small', '', 'GYM LEADER '), l.name);
  const box = el('div', 'gym-say');
  const text = el('p', 'gym-text');
  box.append(plate, text, el('i', 'gym-more'));
  layer.append(who, box);
  document.body.append(layer);
  if (!calm) { await sleep(20); layer.classList.add('in'); await sleep(450); } else layer.classList.add('in');

  let mark = null;
  if (badge) {
    const { badgeArt } = await import('./trainercard.js');
    mark = el('img', 'gym-badge');
    mark.src = badgeArt(`gym-${l.id}`, true);
    mark.alt = l.badge;
  }
  const said = lines.map(line => fill(line, { name: l.name, badge: l.badge, ...vars }));
  for (let i = 0; i < said.length; i++) {
    text.textContent = said[i];
    if (i === 0 && shadow && l.sprite) { await sleep(calm ? 0 : 260); who.classList.remove('shadow'); }
    if (mark && i === said.length - 1) { layer.append(mark); playSound('achievement'); }
    await tap(layer);
    playSound('confirm');
  }
  layer.classList.remove('in');
  layer.classList.add('out');
  await sleep(calm ? 0 : 320);
  layer.remove();
}

/** One tap anywhere on the layer, or Enter / Space. */
function tap(layer) {
  return new Promise(done => {
    const end = () => { layer.removeEventListener('click', end); document.removeEventListener('keydown', key); done(); };
    const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); end(); } };
    setTimeout(() => { layer.addEventListener('click', end); document.addEventListener('keydown', key); }, 150);
  });
}
