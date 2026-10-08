/* ============================================================
   settings.js  -  the Pokédex's Settings app, a games' OPTIONS screen
   (index.html's #dev-settings): under the sound bars (js/audio.js), a row
   of choices per option, each saved under its key. Battle speed and animations are read
   by js/battle.js, the text speed by every typing text box, the clock by
   js/daytime.js, vibration by vibrate() and the device colour by css/base.css's
   data-shell colours (their meanings are in js/prefs.js).
   ============================================================ */

import { $, el, confirmDialog } from './ui.js';
import { updateSave, resetSave, clearRunData } from './storage.js';
import { cloudRemembered } from './cloud.js';
import { setClock } from './daytime.js';
import { refreshScenery } from './scene.js';
import { smoothIcon } from './smooth-icons.js';
import { pref as valueOf, vibrate } from './prefs.js';
import { pickedName, setTrainerName } from './leaderboard.js';
import { NAME_MAX } from './data/leaderboard.js';
import { playSound } from './audio.js';

// a choice's third entry is a swatch colour: the chip is drawn as that colour and its name shows after the option's name
const OPTIONS = {
  shell: {
    values: [['red', 'Red', '#c41f2a'], ['blue', 'Blue', '#245cc4'], ['yellow', 'Yellow', '#ecb818'], ['green', 'Green', '#229a3e'],
      ['pink', 'Pink', '#dc4c8c'], ['black', 'Black', '#383840']],
    apply: v => { if (v === 'red') delete document.documentElement.dataset.shell; else document.documentElement.dataset.shell = v; },
  },
  textSpeed: { values: [['slow', 'Slow'], ['mid', 'Mid'], ['fast', 'Fast'], ['instant', 'Instant']] },
  clock: {
    values: [['auto', 'Clock'], ['dawn', 'Dawn'], ['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']],
    // the title's sky repaints on resize; every other scene reads the time as it paints
    apply: (v, changed) => { setClock(v); if (changed) dispatchEvent(new Event('resize')); },
  },
  // the scene on screen repaints at once; the title's sky (and its light) on the resize
  scenery: { values: [['hybrid', 'Hybrid'], ['pixel', 'Pixel']], apply: (v, changed) => { if (changed) { refreshScenery(); dispatchEvent(new Event('resize')); } } },
  // the title as the walkable Clearing (js/hub-3d.js) or its menu signs; js/title.js swaps them at once
  titleHub: { values: [[true, 'Walk'], [false, 'Signs']], apply: (v, changed) => { if (changed) dispatchEvent(new Event('title-hub')); } },
  calmFx: { values: [[false, 'Full'], [true, 'Reduced']], apply: v => document.documentElement.classList.toggle('calm-fx', v) },
  battleSpeed: { values: [[1, '1x'], [2, '2x']], apply: v => document.documentElement.classList.toggle('fast-battle', v > 1) },
  battleFx: { values: [[true, 'On'], [false, 'Off']], apply: v => document.documentElement.classList.toggle('no-battle-fx', !v) },
  endTurnWarn: { values: [[true, 'On'], [false, 'Off']] },
  vibration: { values: [[true, 'On'], [false, 'Off']], apply: (v, changed) => { if (changed && v) vibrate(20); } },
};

function render() {
  for (const row of document.querySelectorAll('#dev-settings .set-opt[data-opt]')) {
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

const NAME_HINT = 'On your Trainer Card and the leaderboards';

/** The name box shows the nickname as it is now (the leaderboard's own box can change it too). */
export function showName() {
  $('set-name-input').value = pickedName();
  $('set-name-hint').textContent = NAME_HINT;
}

function initName() {
  const input = $('set-name-input');
  input.maxLength = NAME_MAX;
  $('set-name-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const kept = setTrainerName(input.value);
    input.value = kept;
    input.blur();
    playSound('confirm');
    $('set-name-hint').textContent = kept ? `Saved! Hello, ${kept}.` : 'Cleared: you\'re "Trainer" again.';
  });
}

/** The games' delete-save combo: two asks, then a fresh save (Settings' choices kept) and a reload onto the title. Signed in,
 * the reset save is the newer one, so js/cloud.js uploads it on the reload and every other device takes it. */
async function resetAll() {
  if (!(await confirmDialog('Reset your save? Every starter, badge, Pokédex entry, PokéCoin and record will be erased.', 'Reset'))) return;
  const cloud = cloudRemembered() ? ' Your cloud save, on every device, will be reset too.' : '';
  if (!(await confirmDialog(`Are you really sure? This can't be undone.${cloud}`, 'Erase it all'))) return;
  resetSave();
  clearRunData();
  location.reload();
}

export function initSettings() {
  initName();
  $('reset-btn').addEventListener('click', resetAll);
  for (const node of document.querySelectorAll('#dev-settings [data-icon]')) node.append(smoothIcon(node.dataset.icon));
  for (const row of document.querySelectorAll('#dev-settings .set-opt[data-opt]')) {
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
