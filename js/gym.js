/* The Gym Leader's moments (js/data/gym.js): before their boss, they slide in and talk, a shadow until you've beaten
   them once, lit up as they speak; after you win, their last words and the badge. One layer over whatever is showing,
   a tap (or Enter / Space) for each line. */

import { el, sleep } from './ui.js';
import { playSound } from './audio.js';
import { getSave } from './storage.js';
import { spriteOf, gymWins, voiced } from './data/gym.js';
import { battleFx, calmFx } from './prefs.js';
import { auraOn } from './aura.js';

const fill = (line, vars) => line.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

/** Their lines with their name, badge and `vars` (`{boss}`) filled in, for the 3D gym's speech window. */
export const gymLines = (l, lines, vars = {}) => lines.map(line => voiced(l, fill(line, { name: l.name, badge: l.badge, ...vars })));

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

/** Their lines, one a tap. `badge` shows the badge they hand over with the last line. */
/* `possess` (Phil's, js/data/gym.js): on his second line the dark takes him (a shadow aura over his sprite, the layer
   thins so the boss shows behind), and on his last `possess()` fills his Pokémon with it. */
export async function gymTalk(l, lines, { vars = {}, badge = false, possess = null } = {}) {
  const calm = !battleFx();
  const layer = el('div', `gym-scene${possess ? ' possess' : ''}`);
  const shadow = !possess && gymWins(getSave(), l.id) === 0;
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
  const said = gymLines(l, lines, vars);
  let darkness = null;
  try { for (let i = 0; i < said.length; i++) {
    const line = said[i];
    if (line.who) plate.replaceChildren(line.who);   // a family's lines: whoever is talking (js/data/gym.js `voices`)
    if (line.who) {
      if (line.demon && !layer.classList.contains('demon')) demonSwap();
      layer.classList.toggle('demon', !!line.demon);
    }
    text.textContent = line.text ?? line;
    if (i === 0 && shadow && l.sprite) { await sleep(calm ? 0 : 260); who.classList.remove('shadow'); }
    if (mark && i === said.length - 1) { layer.append(mark); playSound('achievement'); }
    if (possess && i === Math.min(1, said.length - 1)) {
      layer.classList.add('taken');
      try { darkness = auraOn(who, 2, 'dark'); } catch (e) { console.error(e); }   // the talk must go on without it
      playSound('power');
    }
    if (possess && i === said.length - 1) try { possess(); } catch (e) { console.error(e); }
    await tap(layer);
    playSound('confirm');
  } } catch (e) { console.error(e); }   // never leave the layer stuck over the battle
  layer.classList.remove('in');
  layer.classList.add('out');
  darkness?.();
  await sleep(calm ? 0 : 320);
  layer.remove();
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
