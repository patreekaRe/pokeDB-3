/* ============================================================
   settings.js  -  the Pokédex's Settings toggles (under the sound bars):
   battle speed (1x / 2x, read by js/battle.js) and the end-turn warning.
   ============================================================ */

import { $ } from './ui.js';
import { getSave, updateSave } from './storage.js';

function render() {
  const { battleSpeed = 1, endTurnWarn = true } = getSave();
  const speed = $('set-speed');
  speed.textContent = `${battleSpeed}x`;
  speed.classList.toggle('on', battleSpeed > 1);
  document.documentElement.classList.toggle('fast-battle', battleSpeed > 1);
  speed.title = battleSpeed > 1 ? 'Enemy turns and hits play twice as fast: tap for normal speed' : 'Tap to play enemy turns and hits twice as fast';
  const warn = $('set-warn');
  warn.textContent = endTurnWarn ? 'On' : 'Off';
  warn.classList.toggle('on', endTurnWarn);
  warn.setAttribute('aria-checked', String(endTurnWarn));
}

export function initSettings() {
  $('set-speed').addEventListener('click', () => { updateSave(d => { d.battleSpeed = (d.battleSpeed ?? 1) > 1 ? 1 : 2; }); render(); });
  $('set-warn').addEventListener('click', () => { updateSave(d => { d.endTurnWarn = !(d.endTurnWarn ?? true); }); render(); });
  render();
}
