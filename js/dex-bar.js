/* The Clearing's bottom Pokédex bar (js/hub-3d.js's .hub-bar) for the 3D places it walks into, the Poké Mall's hall and
   shops and the Secret Base (the user's ask, 2026-10-13): lens, lights, the Home and How to play keys, the PokéCoins on
   their LCD and the place's name on the right. No run strip: that stays the Clearing's. */

import { getSave } from './storage.js';
import { playSound } from './audio.js';
import { smoothIcon, roundKey } from './smooth-icons.js';
import { deviceNews } from './trainercard.js';

/** The bar's element, put in `host`; `setPlace(name)`, `tick()` (the coins, each frame) and `refresh()`
    (the Home key's "!" too) keep it up. */
export function dexBar(host) {
  const bar = document.createElement('div');
  bar.className = 'hub-bar no-run place-bar';
  bar.innerHTML = `
    <div class="room-hinge"><span class="pdx-lens" aria-hidden="true"></span><span class="mdex-lights" aria-hidden="true"><span class="pdx-light red"></span><span class="pdx-light yellow"></span><span class="pdx-light green"></span></span>
      <div class="room-keys"><button type="button" class="room-home hub-dex" aria-label="Pokédex"></button><button type="button" class="room-home hub-help" title="How to play" aria-label="How to play"></button></div>
      <div class="room-sign hbar-cash" title="PokéCoins"><span class="hbar-coins">0</span></div>
      <div class="room-sign hbar-sign" aria-live="polite"><b></b></div></div>`;
  host.append(bar);
  const coins = bar.querySelector('.hbar-coins'), sign = bar.querySelector('.hbar-sign b');
  const dex = bar.querySelector('.hub-dex'), help = bar.querySelector('.hub-help');
  coins.before(smoothIcon('coin', 'hbar-coin'));
  dex.append(roundKey('home'));
  help.append(roundKey('help'));
  new ResizeObserver(() => host.style.setProperty('--place-bar-h', `${bar.offsetHeight}px`)).observe(bar);

  let shown = null;
  // every frame: a game or a buy changes the coins without telling the place
  const tick = () => {
    const n = getSave().coins ?? 0;
    if (n !== shown) { shown = n; coins.textContent = n.toLocaleString(); }
  };
  const refresh = () => { tick(); dex.classList.toggle('dex-news', deviceNews()); };
  // the device grows out of the key and shrinks back into it, as in the Clearing
  const open = async (key, how) => {
    if (bar.querySelector('.room-home.out')) return;
    playSound('confirm');
    key.classList.add('out');
    const m = await import('./collection.js');
    const shut = () => { key.classList.remove('out'); refresh(); };
    if (how === 'help') m.openHowto(key, shut);
    else m.openPokedex({}, { from: key, onClose: shut });
  };
  dex.addEventListener('click', () => open(dex, 'dex'));
  help.addEventListener('click', () => open(help, 'help'));
  refresh();

  return {
    el: bar,
    refresh,
    tick,
    setPlace(name) {
      refresh();
      if (sign.textContent === name) return;
      sign.textContent = name;
      sign.classList.remove('hbar-pop');
      void sign.offsetWidth;
      sign.classList.add('hbar-pop');
    },
  };
}
