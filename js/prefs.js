/* ============================================================
   prefs.js  -  what the Settings app's choices mean to the rest of the
   game (js/settings.js draws them). No DOM here, so the rules files and
   tests can import it.
   ============================================================ */

import { getSave } from './storage.js';

export const PREF_DEFAULTS = { textSpeed: 'mid', clock: 'auto', battleSpeed: 1, battleFx: true, calmFx: false, endTurnWarn: true, vibration: true, shell: 'red' };
export const pref = (key) => getSave()[key] ?? PREF_DEFAULTS[key];

/** Battle animations (the games' Battle Scene): off in Settings or under reduced motion, a fight skips its move effects
    and slow intros. */
export const battleFx = () => pref('battleFx') && !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

/** Reduce flashing / screen shake (Settings, or reduced motion): nothing shakes, and white-outs become a soft brightening. */
export const calmFx = () => pref('calmFx') || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

// letters typed per tick and the tick's ms; null types the whole line at once
const PACE = { slow: [1, 34], mid: [2, 18], fast: [4, 14], instant: null };
/** The text boxes' typing pace, [letters, ms], or null for instant. */
export const textPace = () => (pref('textSpeed') in PACE ? PACE[pref('textSpeed')] : PACE.mid);

/** Buzz the phone, unless Vibration is off. */
export function vibrate(pattern) {
  if (!pref('vibration') || navigator.userActivation?.hasBeenActive === false) return;
  if (navigator.vibrate) navigator.vibrate(pattern);
  else iosTick();
}

// iOS has no navigator.vibrate, but since iOS 18 toggling an <input switch> ticks the Taptic Engine, even through a hidden
// label's click. It only works inside a tap's handler and gives one tick, so a pattern becomes a single tap.
let tickLabel;
function iosTick() {
  if (typeof document === 'undefined' || !/iP(hone|ad|od)|Macintosh/.test(navigator.userAgent) || !('ontouchend' in document)) return;
  if (!tickLabel) {
    tickLabel = document.createElement('label');
    tickLabel.className = 'haptic';
    tickLabel.ariaHidden = 'true';
    tickLabel.style.display = 'none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    tickLabel.append(input);
    tickLabel.addEventListener('click', (e) => e.stopPropagation());
    document.head.append(tickLabel);
  }
  tickLabel.click();
}
