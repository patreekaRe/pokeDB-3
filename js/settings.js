/* ============================================================
   settings.js  -  the Pokédex's Settings app, a games' OPTIONS screen
   (index.html's #dev-settings): under the sound bars (js/audio.js), a row
   of choices per option, each saved under its key. Battle speed and animations are read
   by js/battle.js, the text speed by every typing text box, the clock by
   js/daytime.js, vibration by vibrate(), the text size by css/base.css's html.large-text and the device colour by css/base.css's
   data-shell colours (their meanings are in js/prefs.js).
   ============================================================ */

import { $, el } from './ui.js';
import { updateSave } from './storage.js';
import { setClock } from './daytime.js';
import { smoothIcon } from './smooth-icons.js';
import { pref as valueOf, vibrate } from './prefs.js';

// a choice's third entry is a swatch colour: the chip is drawn as that colour and its name shows after the option's name
const OPTIONS = {
  shell: {
    values: [['red', 'Red', '#c41f2a'], ['blue', 'Blue', '#245cc4'], ['yellow', 'Yellow', '#ecb818'], ['green', 'Green', '#229a3e'],
      ['pink', 'Pink', '#dc4c8c'], ['black', 'Black', '#383840']],
    apply: v => { if (v === 'red') delete document.documentElement.dataset.shell; else document.documentElement.dataset.shell = v; },
  },
  textSize: { values: [['normal', 'Normal'], ['large', 'Large']], apply: v => document.documentElement.classList.toggle('large-text', v === 'large') },
  textSpeed: { values: [['slow', 'Slow'], ['mid', 'Mid'], ['fast', 'Fast'], ['instant', 'Instant']] },
  clock: {
    values: [['auto', 'Clock'], ['dawn', 'Dawn'], ['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']],
    // the title's sky repaints on resize; every other scene reads the time as it paints
    apply: (v, changed) => { setClock(v); if (changed) dispatchEvent(new Event('resize')); },
  },
  calmFx: { values: [[false, 'Full'], [true, 'Reduced']], apply: v => document.documentElement.classList.toggle('calm-fx', v) },
  battleSpeed: { values: [[1, '1x'], [2, '2x']], apply: v => document.documentElement.classList.toggle('fast-battle', v > 1) },
  battleFx: { values: [[true, 'On'], [false, 'Off']], apply: v => document.documentElement.classList.toggle('no-battle-fx', !v) },
  endTurnWarn: { values: [[true, 'On'], [false, 'Off']] },
  vibration: { values: [[true, 'On'], [false, 'Off']], apply: (v, changed) => { if (changed && v) vibrate(20); } },
};

function render() {
  for (const row of document.querySelectorAll('#dev-settings .set-opt')) {
    const now = valueOf(row.dataset.opt);
    for (const b of row.querySelectorAll('.set-chip')) b.setAttribute('aria-checked', String(b.value === String(now)));
    const named = row.querySelector('.set-picked');
    if (named) named.textContent = OPTIONS[row.dataset.opt].values.find(([v]) => String(v) === String(now))?.[1] ?? '';
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
    for (const [value, label, swatch] of OPTIONS[key].values) {
      const b = el('button', swatch ? 'set-chip swatch' : 'set-chip', swatch ? '' : label);
      b.type = 'button';
      if (swatch) {
        b.style.setProperty('--sw', swatch);
        b.setAttribute('aria-label', label);
        b.title = label;
      }
      b.value = String(value);
      b.setAttribute('role', 'radio');
      b.addEventListener('click', () => choose(key, value));
      chips.append(b);
    }
    if (OPTIONS[key].values[0][2]) row.querySelector('.set-name').append(' ', el('span', 'set-picked'));
    row.append(chips);
  }
  for (const key of Object.keys(OPTIONS)) OPTIONS[key].apply?.(valueOf(key), false);
  render();
}
