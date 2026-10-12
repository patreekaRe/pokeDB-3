/* meowth.js  -  how the Game Corner opens (the user's ask, 2026-10-11): at the first crossroads after Biome 1, Meowth comes
   out of the trees, talks your ear off about PokéCoins and opens it. Till then every way in (the top bar, the Pokédex's
   dock, the Safari's Buy, a skin's Game Corner button) is hidden. The save's `cornerOpen`; an old save that had already
   bought something keeps it open (boughtAny() in js/storage.js). */

import { getSave, updateSave } from './storage.js';
import { trainerName } from './leaderboard.js';
import { el } from './ui.js';
import { playSound, playCry } from './audio.js';

export const cornerOpen = () => !!getSave().cornerOpen;

/** Whether this crossroads is Meowth's: the fork after Biome 1, the Game Corner not open yet (`?meowth` locks it again; `?crossroads&meowth` plays it). */
export const meowthDue = (slot) => slot === 1 && !cornerOpen();

/** What Meowth says, `{name}` the trainer's nickname. */
export function meowthLines() {
  const name = trainerName();
  return [
    `Meowth! Hold it right there, ${name}!`,
    'I saw ya beat that boss back there. Not bad, meow. Not bad at all.',
    'Name\'s Meowth. I\'ve got a nose for coins, and you, pal, smell like PokéCoins.',
    'Every run ya win, every boss ya beat, pays ya PokéCoins. And coins are for spendin\', meow!',
    'So I\'m openin\' a Game Corner! New starters, perks, shiny colours, Poké Balls. All for coins.',
    'You\'ll find it on your Pokédex, any time ya like. Look for the slot machine, meow!',
    'Now go on, pick a road. I got a shop to set up. Meowth, that\'s right!',
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
      return say('🎰 The Game Corner is open! Find it on your Pokédex, beside Settings and Help.');
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

/** Shows or hides every way into the Game Corner outside a run's screens (showScreen() keeps the top bar's hidden in a run). */
export function syncCorner() {
  const open = cornerOpen();
  document.body.classList.toggle('corner-locked', !open);
}
