/* ============================================================
   foil.js  -  foil decks (the roadmap's Level 6-10 reward 6, 2026-10-23): a run with a starter won on Trainer Level 6-9
   wears its cards with a foil edge in that star's colour (ruby, emerald, sapphire, amethyst), and one won on Level 10 a
   rainbow edge and a holo sheen that follows the pointer, or the phone's tilt. `data-foil` on <html> is read by
   css/cards.css. Settings' Foil cards switch turns it off; under calmFx() the holo holds still. Not in the Safari,
   whose starter isn't yours.
   ============================================================ */

import { getSave } from './storage.js';
import { bestWin, MAX_LEVEL } from './data/difficulty.js';
import { pref, calmFx } from './prefs.js';

export const FOIL_FROM = 6;
// ?foil=8 lends that Level's foil to every run for a page load
const LENT = typeof location !== 'undefined' ? Number(new URLSearchParams(location.search).get('foil')) || 0 : 0;

/** Put on (or take off) the foil for a run's starter. */
export function wearFoil(run) {
  const lv = !run?.starter || run.safari || !pref('foil') ? -1 : Math.min(LENT || bestWin(getSave(), run.starter.id), MAX_LEVEL);
  const root = document.documentElement;
  if (lv >= FOIL_FROM) root.dataset.foil = String(lv); else delete root.dataset.foil;
  follow(lv >= MAX_LEVEL && !calmFx());
}

export function takeOffFoil() {
  delete document.documentElement.dataset.foil;
  follow(false);
}

let on = false, queued = false, x = 0.5, y = 0.5;
const clamp = (v) => Math.max(0, Math.min(1, v));
function paint() {
  queued = false;
  const s = document.documentElement.style;
  s.setProperty('--foil-x', x.toFixed(3));
  s.setProperty('--foil-y', y.toFixed(3));
}
const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
const onPointer = (e) => { x = clamp(e.clientX / innerWidth); y = clamp(e.clientY / innerHeight); queue(); };
// a phone held at about 45 degrees is the middle; 30 degrees either way sweeps the sheen across
const onTilt = (e) => { if (e.gamma == null) return; x = clamp(0.5 + e.gamma / 60); y = clamp(0.5 + (e.beta - 45) / 60); queue(); };

function follow(want) {
  if (want === on) return;
  on = want;
  const how = want ? 'addEventListener' : 'removeEventListener';
  window[how]('pointermove', onPointer, { passive: true });
  window[how]('deviceorientation', onTilt, { passive: true });
}

/** iPhones ask before a page reads the tilt, and only from a tap: Settings asks as the switch is turned on. */
export function askTilt() {
  const D = globalThis.DeviceOrientationEvent;
  if (typeof D?.requestPermission === 'function') D.requestPermission().catch(() => {});
}
