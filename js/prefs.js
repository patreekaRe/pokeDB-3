/* ============================================================
   prefs.js  -  what the Settings app's choices mean to the rest of the
   game (js/settings.js draws them). No DOM here, so the rules files and
   tests can import it.
   ============================================================ */

import { getSave } from './storage.js';

export const PREF_DEFAULTS = { textSpeed: 'mid', textAuto: true, clock: 'auto', battleSpeed: 1, battleFx: true, cardFx: 'smooth', calmFx: false, endTurnWarn: true, vibration: true, shell: 'red', foil: true, scenery: 'hybrid', titleHub: true, sharpness: 'sharp' };
export const pref = (key) => getSave()[key] ?? PREF_DEFAULTS[key];

/** Battle animations (the games' Battle Scene): off in Settings or under reduced motion, a fight skips its move effects
    and slow intros. */
export const battleFx = () => pref('battleFx') && !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

/** The scenery's look: Hybrid (pixels under smooth light, the default since 2026-10-08) or plain Pixel (Settings, ?pixel). */
export const hybridScenery = () => pref('scenery') !== 'pixel';
/* How sharp the 3D places draw (the user's ask, 2026-10-16: things looked blurry). Soft is the old way: a smooth place drawn at
   most at CSS pixels (a third of an iPhone's), and a Home Screen app's tall screen a little smaller. Sharp draws up to 1.5x
   CSS pixels (about 2.25x the GPU work of Soft), Max up to 2x (about 4x). [scene size multiplier, most device px per CSS px] */
const SHARP = { soft: [1, 1], sharp: [1.5, 1.5], max: [2, 2] };
/** The Sharpness setting: `mult` on a smooth place's scene size, `cap` the most device pixels per CSS pixel, `soft` the
    old way (`?sharp=soft|sharp|max` for a page load). */
export function sharpness() {
  const q = typeof location === 'object' ? new URLSearchParams(location.search).get('sharp') : null;
  const [mult, cap] = SHARP[q] || SHARP[pref('sharpness')] || SHARP.sharp;
  const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
  return { mult, cap: Math.max(1, Math.min(cap, dpr)), soft: mult === 1 };
}
/** Reduce flashing / screen shake (Settings, or reduced motion): nothing shakes, and white-outs become a soft brightening. */
export const calmFx = () => pref('calmFx') || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);

// letters typed per tick and the tick's ms; null types the whole line at once
const PACE = { slow: [1, 34], mid: [2, 18], fast: [4, 14], instant: null };
/** The text boxes' typing pace, [letters, ms], or null for instant. */
export const textPace = () => (pref('textSpeed') in PACE ? PACE[pref('textSpeed')] : PACE.mid);
/** How long a typed line stays up before the text box moves on by itself (Settings' Text boxes: Auto), or null (Tap). */
export const textHold = (line) => (pref('textAuto') ? 900 + String(line ?? '').length * 24 : null);

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
