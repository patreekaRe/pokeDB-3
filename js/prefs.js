/* ============================================================
   prefs.js  -  what the Settings app's choices mean to the rest of the
   game (js/settings.js draws them). No DOM here, so the rules files and
   tests can import it.
   ============================================================ */

import { getSave } from './storage.js';

export const PREF_DEFAULTS = { textSpeed: 'mid', clock: 'auto', battleSpeed: 1, endTurnWarn: true, vibration: true };
export const pref = (key) => getSave()[key] ?? PREF_DEFAULTS[key];

// letters typed per tick and the tick's ms; null types the whole line at once
const PACE = { slow: [1, 34], mid: [2, 18], fast: [4, 14], instant: null };
/** The text boxes' typing pace, [letters, ms], or null for instant. */
export const textPace = () => (pref('textSpeed') in PACE ? PACE[pref('textSpeed')] : PACE.mid);

/** Buzz the phone, unless Vibration is off (iOS lets no page vibrate). */
export function vibrate(pattern) {
  if (pref('vibration') && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(pattern);
}
