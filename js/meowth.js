/* meowth.js  -  how the Poké Mall's Game Corner opens (the user's asks, 2026-10-11): at the first crossroads a save reaches
   (the roads open after one won run), Meowth comes out of the trees, talks your ear off about PokéCoins and opens its shop
   in the mall (syncShop() in js/mall-3d.js). Every save meets it, however far along: an old one at its next crossroads.
   The Game Corner app in the Pokédex is open to everyone from the start. The save's `cornerOpen`. */

import { getSave, updateSave } from './storage.js';
import { trainerName } from './leaderboard.js';
import { el } from './ui.js';
import { playSound, playCry } from './audio.js';

export const cornerOpen = () => !!getSave().cornerOpen;

/** Whether this crossroads is Meowth's: any, till it has been met (`?meowth` shuts the shop again; `?crossroads&meowth` plays it). */
export const meowthDue = () => !cornerOpen();

/** What Meowth says, `{name}` the trainer's nickname. */
export function meowthLines() {
  const name = trainerName();
  return [
    `Meowth! Hold it right there, ${name}!`,
    'I saw ya beat that boss back there. Not bad, meow. Not bad at all.',
    'Name\'s Meowth. I\'ve got a nose for coins, and you, pal, smell like PokéCoins.',
    'Every run ya win, every boss ya beat, pays ya PokéCoins. And coins are for spendin\', meow!',
    'Ya know the Poké Mall back in the Clearing? That shop in the middle with the tape all over it? It\'s mine now!',
    'I\'m openin\' the Game Corner there for real. Prizes in a case, shinies on the wall, a machine for every perk.',
    'Finish your run, then come walk right in. Now go on, pick a road. Meowth, that\'s right!',
  ];
}

/**
 * Meowth's talk in a cream speech window over `host`: a tap anywhere (or Enter / Space) for the next line, the cry on the
 * first. Then the news, the Game Corner saved open on it, and a last tap. `onLine(i)` hears each line (-1 the news).
 */
export function meowthTalk(host, { onLine = () => {} } = {}) {
  const lines = meowthLines(), box = el('p', 'xr-talk'), text = el('span');
  box.setAttribute('aria-live', 'polite');
  box.append(el('b', '', 'Meowth'), text, el('i'));
  box.querySelector('i').setAttribute('aria-hidden', 'true');
  host.append(box);
  host.classList.add('talking');
  let i = -1, done = null, ready = 0;
  const shown = new Promise(r => { done = r; });
  const say = (line) => {
    text.textContent = line;
    box.classList.remove('xr-say'); void box.offsetWidth; box.classList.add('xr-say');
    ready = performance.now() + 250;   // a tap a hair after the last doesn't skip a line unread
  };
  const next = () => {
    if (performance.now() < ready) return;
    i++;
    if (i < lines.length) { if (i) playSound('stick'); onLine(i); return say(lines[i]); }
    if (i === lines.length) {
      meetMeowth();
      playSound('item-get');
      box.classList.add('xr-news');
      box.querySelector('b').textContent = 'Game Corner';
      onLine(-1);
      return say('🎰 The Game Corner in the Poké Mall is open!');
    }
    host.removeEventListener('pointerdown', tap, true);
    removeEventListener('keydown', key, true);
    host.classList.remove('talking');
    box.remove();
    done();
  };
  const tap = (e) => { e.stopPropagation(); e.preventDefault(); next(); };
  const key = (e) => {
    if (!['Enter', ' ', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (e.key === 'Enter' || e.key === ' ') next();
  };
  host.addEventListener('pointerdown', tap, true);
  addEventListener('keydown', key, true);
  playCry('meowth');
  next();
  return shown;
}

export const meetMeowth = () => updateSave(d => { d.cornerOpen = true; });
