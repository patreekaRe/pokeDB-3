/* ============================================================
   settings.js  -  the Pokédex's Settings app, a games' OPTIONS screen
   (index.html's #dev-settings): under the sound bars (js/audio.js), a row
   of choices per option, each saved under its key. Battle speed is read
   by js/battle.js, the text speed by every typing text box, the clock by
   js/daytime.js and vibration by vibrate().
   ============================================================ */

import { $, el } from './ui.js';
import { getSave, updateSave } from './storage.js';
import { setClock } from './daytime.js';
import { smoothIcon } from './smooth-icons.js';

const OPTIONS = {
  textSpeed: { def: 'mid', values: [['slow', 'Slow'], ['mid', 'Mid'], ['fast', 'Fast'], ['instant', 'Instant']] },
  clock: {
    def: 'auto', values: [['auto', 'Clock'], ['dawn', 'Dawn'], ['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']],
    // the title's sky repaints on resize; every other scene reads the time as it paints
    apply: (v, changed) => { setClock(v); if (changed) dispatchEvent(new Event('resize')); },
  },
  battleSpeed: { def: 1, values: [[1, '1x'], [2, '2x']], apply: v => document.documentElement.classList.toggle('fast-battle', v > 1) },
  endTurnWarn: { def: true, values: [[true, 'On'], [false, 'Off']] },
  vibration: { def: true, values: [[true, 'On'], [false, 'Off']], apply: (v, changed) => { if (changed && v) vibrate(20); } },
};

const valueOf = (key) => getSave()[key] ?? OPTIONS[key].def;

// letters typed per tick and the tick's ms; null types the whole line at once
const PACE = { slow: [1, 34], mid: [2, 18], fast: [4, 14], instant: null };
/** The text boxes' typing pace, [letters, ms], or null for instant. */
export const textPace = () => PACE[valueOf('textSpeed')] ?? PACE.mid;

/** Buzz the phone, unless Vibration is off (iOS lets no page vibrate). */
export function vibrate(pattern) {
  if (valueOf('vibration') && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(pattern);
}

function render() {
  for (const row of document.querySelectorAll('#dev-settings .set-opt')) {
    const now = valueOf(row.dataset.opt);
    for (const b of row.querySelectorAll('.set-chip')) b.setAttribute('aria-checked', String(b.value === String(now)));
  }
}

function choose(key, value) {
  if (value === valueOf(key)) return;
  updateSave(d => { d[key] = value; });
  OPTIONS[key].apply?.(value, true);
  render();
}

export function initSettings() {
  for (const node of document.querySelectorAll('#dev-settings [data-icon]')) node.append(smoothIcon(node.dataset.icon));
  for (const row of document.querySelectorAll('#dev-settings .set-opt')) {
    const key = row.dataset.opt;
    const chips = el('div', 'set-chips');
    chips.setAttribute('role', 'radiogroup');
    chips.setAttribute('aria-label', row.querySelector('.set-name').textContent);
    chips.style.setProperty('--n', OPTIONS[key].values.length);
    for (const [value, label] of OPTIONS[key].values) {
      const b = el('button', 'set-chip', label);
      b.type = 'button';
      b.value = String(value);
      b.setAttribute('role', 'radio');
      b.addEventListener('click', () => choose(key, value));
      chips.append(b);
    }
    row.append(chips);
  }
  for (const key of Object.keys(OPTIONS)) OPTIONS[key].apply?.(valueOf(key), false);
  render();
}
