/* ============================================================
   settings.js  -  the Pokédex's Settings app, a games' OPTIONS screen
   (index.html's #dev-settings): under the sound bars (js/audio.js), a row
   of choices per option, each saved under its key. Battle speed is read
   by js/battle.js, the text speed by every typing text box, the clock by
   js/daytime.js and vibration by vibrate() (their meanings are in js/prefs.js).
   ============================================================ */

import { $, el } from './ui.js';
import { updateSave } from './storage.js';
import { setClock } from './daytime.js';
import { smoothIcon } from './smooth-icons.js';
import { pref as valueOf, vibrate } from './prefs.js';

const OPTIONS = {
  textSpeed: { values: [['slow', 'Slow'], ['mid', 'Mid'], ['fast', 'Fast'], ['instant', 'Instant']] },
  clock: {
    values: [['auto', 'Clock'], ['dawn', 'Dawn'], ['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']],
    // the title's sky repaints on resize; every other scene reads the time as it paints
    apply: (v, changed) => { setClock(v); if (changed) dispatchEvent(new Event('resize')); },
  },
  battleSpeed: { values: [[1, '1x'], [2, '2x']], apply: v => document.documentElement.classList.toggle('fast-battle', v > 1) },
  endTurnWarn: { values: [[true, 'On'], [false, 'Off']] },
  vibration: { values: [[true, 'On'], [false, 'Off']], apply: (v, changed) => { if (changed && v) vibrate(20); } },
};

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
