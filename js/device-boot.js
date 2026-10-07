/* ============================================================
   device-boot.js  -  the Collection's cover-flip and hello
   (js/device.js) for the other screens that are the Pokédex device:
   the character select on New game, the map on Continue, and the
   Safari Zone and Sky Pillar lobbies (the user's call, 2026-10-07:
   every way into the game should open the Pokédex). The cover, its
   face (your partner, name and badges) and the boot screen's hello
   are the Collection's own.
   ============================================================ */

import { el } from './ui.js';
import { playSound } from './audio.js';
import { coverArt, splash } from './collection.js';

const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const settle = (anim) => anim.finished.catch(() => {});
const SWING = [
  { transform: 'perspective(1100px) rotateY(0deg)', opacity: 1 },
  { transform: 'perspective(1100px) rotateY(-80deg)', opacity: 1, offset: 0.8 },
  { transform: 'perspective(1100px) rotateY(-104deg)', opacity: 0 },
];
const LIFT = [{ transform: 'translateY(48px) scale(0.96)', opacity: 0 }, { transform: 'none', opacity: 1 }];


/**
 * Shows `host` (the device) closed under its cover, then swings it open; the cover starts under `below` (the lid with
 * the LCD) or at the top. The hello is shown over `screen` and fades; `onScreen` runs as the screen comes on (a
 * window's power-on flicker). A tap on the cover opens it at once.
 */
export async function bootDevice(host, { below = null, screen = null, onScreen = null } = {}) {
  host.querySelectorAll('.boot-cover, .boot-splash').forEach(n => n.remove());
  if (calm()) { playSound('dex-on'); onScreen?.(); return; }
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const cover = el('div', 'cdev-cover boot-cover');
  cover.append(el('span', 'pdx-cover-hinge'), ...coverArt());
  host.append(cover);
  let hello = null;
  if (screen) {   // inside the screen, so it sits wherever the screen ends up once laid out
    hello = el('div', 'cdev-splash boot-splash wait');
    hello.append(el('span', 'cdev-splash-ball'), el('span', 'cdev-splash-text', splash()));
    screen.append(hello);
  }
  cover.style.top = `${below ? below.offsetTop + below.offsetHeight : 0}px`;
  await settle(host.animate(LIFT, { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.25, 1)' }));
  await new Promise(done => {
    const t = setTimeout(done, 520);
    cover.addEventListener('pointerdown', () => { clearTimeout(t); done(); }, { once: true });
  });
  playSound('dex-on');
  host.classList.remove('booted');
  void host.offsetWidth;
  host.classList.add('booted');   // the lid's lights blink
  await settle(cover.animate(SWING, { duration: 520, easing: 'cubic-bezier(0.55, 0, 0.35, 1)' }));
  cover.remove();
  onScreen?.();
  if (!hello) return;
  hello.classList.remove('wait');
  hello.addEventListener('animationend', () => hello.remove());
}
