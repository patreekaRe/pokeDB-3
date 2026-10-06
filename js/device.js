/* ============================================================
   device.js  -  the Collection device: the red handheld Pokédex
   (js/pokedex.js) grown into a general device. It comes up closed,
   its cover swings open on its left hinge and the screen boots onto
   a home screen (collection.js fills it); an app slides in over the
   home screen and fills the screen. The hardware: the D-pad moves the
   highlight on the home screen (inside an app it steps a Pokédex page
   or scrolls), A opens, B goes back, and B on the home screen shuts
   the device. Escape is B. Its cover (collection.js draws it) shows
   your partner and badges, and an LED that blinks for a new badge.
   The top bar's Pokédex opens it over whatever is showing, a run
   included (`over`), with a dock for Settings, Help, the Game Corner and
   Main menu; the Bag opens it straight into one app, and B out of that
   app shuts it again.
   ============================================================ */

import { $, el, showScreen } from './ui.js';
import { playSound } from './audio.js';

let drawHome = null;   // () => the home screen's nodes, a `.cdev-pick` on everything the D-pad can land on
let drawCover = null;  // () => the closed cover's nodes
let onShut = null;
let afterShut = null;
let direct = false;    // opened straight into an app: B out of it shuts the device
let app = null;        // the open app: { def, panel }
let busy = false;      // the cover or a slide is moving: taps and keys wait for it
let sel = null;        // the home screen's highlighted pick

const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const settle = (anim) => anim.finished.catch(() => {});
const EASE = 'cubic-bezier(0.2, 0.8, 0.25, 1)';
const SLIDE = { duration: 260, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)' };
// the cover stays solid until it's nearly edge-on, then fades as it folds away (the Pokédex's own swing)
const SWING = [
  { transform: 'perspective(1100px) rotateY(0deg)', opacity: 1 },
  { transform: 'perspective(1100px) rotateY(-80deg)', opacity: 1, offset: 0.8 },
  { transform: 'perspective(1100px) rotateY(-104deg)', opacity: 0 },
];
const LIFT = [{ transform: 'translateY(48px) scale(0.96)', opacity: 0 }, { transform: 'none', opacity: 1 }];

const shown = () => !$('collection-screen').hidden;
const home = () => $('cdev-home');

/** Called once at startup; `onBack` runs once the device has shut. */
export function initDevice({ onBack }) {
  onShut = onBack;
  $('cdev-b').addEventListener('click', back);
  $('cdev-a').addEventListener('click', press);
  for (const b of document.querySelectorAll('#cdev-dpad button')) b.addEventListener('click', () => dpad(b.dataset.dir));
  document.addEventListener('keydown', key);
  // wider than a phone the device stands on the title's sky: a tap on the sky around it shuts it, like a tap outside a
  // window. Pointer events, as iOS Safari sends no click for a tap on a plain section
  let down = null;
  const screen = $('collection-screen');
  screen.addEventListener('pointerdown', (e) => { down = e.target === screen && e.isPrimary ? [e.clientX, e.clientY] : null; });
  screen.addEventListener('pointerup', (e) => {
    if (!down || e.target !== screen || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 10) return;
    down = null;
    shut();
  });
}

/**
 * Shows the device closed, then opens it onto the home screen; `splash` is the boot screen's line. `start` (an app's
 * def, as openApp() takes) opens it straight into that app instead; `over` lays it over the current screen rather than
 * switching screens (a run's menu), and `onClose` then runs once it has shut. B out of a `start` app shuts the device,
 * unless `home`: then it steps out to the home screen.
 */
export async function openDevice({ render, cover, splash, start = null, home: toHome = false, over = false, onClose = null }) {
  if (busy) return;
  drawHome = render;
  drawCover = cover;
  direct = !!start && !toHome;
  afterShut = over ? onClose : onShut;
  const screen = $('collection-screen');
  screen.classList.toggle('over', over);
  if (over) screen.hidden = false;
  else showScreen('collection-screen');
  closeApp(true);
  const dev = $('cdev');
  dev.getAnimations({ subtree: true }).forEach(a => a.cancel());
  dev.querySelector('.cdev-cover')?.remove();
  dev.classList.remove('powered', 'keyed');
  sel = null;
  renderHome();
  setTitle('COLLECTION', '');
  if (start) openApp(start, true);   // under the cover, so it swings open onto the app
  if (calm()) { playSound('dex-on'); return; }
  busy = true;
  const lid = makeCover();
  await settle(dev.animate(LIFT, { duration: 320, easing: EASE }));
  // a beat closed so its face can be seen, longer while the LED blinks for a new badge; a tap on it opens it at once
  await held(lid, lid.querySelector('.cdev-led.on') ? 1300 : 420);
  playSound('dex-on');
  dev.classList.add('powered');
  // the hello is up before the lid swings, so the home screen is never seen ahead of it
  const hello = start ? null : splashOf(splash);
  await settle(lid.animate(SWING, { duration: 520, easing: 'cubic-bezier(0.55, 0, 0.35, 1)' }));
  lid.remove();
  bootScreen(hello);
  busy = false;
}

const held = (lid, ms) => new Promise(done => {
  const t = setTimeout(done, ms);
  lid.addEventListener('pointerdown', () => { clearTimeout(t); done(); }, { once: true });
});

function makeCover() {
  const c = el('div', 'cdev-cover');
  c.append(el('span', 'pdx-cover-hinge'), ...(drawCover?.() ?? [el('span', 'pdx-cover-mark')]));
  c.style.top = `${$('cdev').querySelector('.cdev-lid').getBoundingClientRect().bottom - $('cdev').getBoundingClientRect().top}px`;
  $('cdev').append(c);
  return c;
}

/** The screen warms up from a bright line, says hello, and the home screen's icons pop in. */
function bootScreen(hello) {
  const screen = $('cdev-screen');
  screen.classList.remove('power-on');
  void screen.offsetWidth;
  screen.classList.add('power-on');
  if (!hello) return;
  hello.classList.remove('wait');
  hello.addEventListener('animationend', () => hello.remove());
  home().classList.add('boot');
}

/** The boot screen's hello, held still over the home screen until bootScreen() lets it fade. */
function splashOf(splash) {
  if (!splash) return null;
  const s = el('div', 'cdev-splash wait');
  s.append(el('span', 'cdev-splash-ball'), el('span', 'cdev-splash-text', splash));
  $('cdev-screen').append(s);
  return s;
}

function renderHome() {
  const h = home();
  const keep = sel && [...h.querySelectorAll('.cdev-pick')].indexOf(sel);
  h.replaceChildren(...drawHome());
  h.classList.remove('boot');
  h.querySelectorAll('.cdev-pick').forEach((p, i) => p.style.setProperty('--i', i));
  const picks = [...h.querySelectorAll('.cdev-pick')];
  select(picks[keep > 0 ? keep : 0] ?? null, false);
}

function setTitle(name, count) {
  $('cdev-title').textContent = name;
  $('cdev-count').textContent = count || '';
}

/* ---------- apps ---------- */

/**
 * Opens an app in the screen. `def`: { id, name, count, cls, fill(panel) } for one that draws into the screen, or
 * { ..., app: { mount(panel), back(), key(e), unmount() } } for one that runs its own views (the Pokédex).
 */
export function openApp(def, now = false) {
  if (busy || app) return;
  if (!now) playSound('confirm');
  const panel = el('div', `cdev-app ${def.cls ?? 'cdev-win panel'}`);
  panel.dataset.app = def.id;
  $('cdev-screen').append(panel);
  if (def.app) def.app.mount(panel, def.at);
  else def.fill(panel);
  panel.scrollTop = 0;
  app = { def, panel };
  setTitle(def.name, def.count);
  home().inert = true;
  if (now || calm()) { home().hidden = true; return; }
  busy = true;
  home().animate([{ translate: '0 0', opacity: 1 }, { translate: '-30% 0', opacity: 0 }], { ...SLIDE, fill: 'forwards' });
  settle(panel.animate([{ translate: '100% 0' }, { translate: '0 0' }], SLIDE)).then(() => {
    home().getAnimations().forEach(a => a.cancel());
    home().hidden = true;
    busy = false;
  });
}

/** Leaves the open app for another straight away (the Pokédex's Safari banner opens the Safari Pokédex). */
export function swapApp(def) {
  if (busy) return;
  closeApp(true);
  openApp(def);
}

function closeApp(now = false) {
  if (!app) return;
  const { def, panel } = app;
  app = null;
  const h = home();
  h.hidden = false;
  h.inert = false;
  setTitle('COLLECTION', '');
  if (now || calm()) {
    def.app?.unmount();
    panel.remove();
    if (drawHome) renderHome();
    return;
  }
  renderHome();   // its counts may have moved (a badge seen on the Trainer Card)
  busy = true;
  h.animate([{ translate: '-30% 0', opacity: 0 }, { translate: '0 0', opacity: 1 }], SLIDE);
  settle(panel.animate([{ translate: '0 0' }, { translate: '100% 0' }], { ...SLIDE, fill: 'forwards' })).then(() => {
    def.app?.unmount();
    panel.remove();
    busy = false;
  });
}

/* ---------- the hardware ---------- */

/** B: an app steps back itself first (a Pokédex page to its biomes), then to the home screen; there it shuts the device. */
export function back() {
  if (busy || !shown()) return;
  if (app) {
    if (app.def.app?.back()) return;
    if (direct) { shut(); return; }
    playSound('cancel');
    closeApp();
    return;
  }
  shut();
}

async function shut() {
  if (busy || !shown()) return;
  busy = true;
  playSound('dex-off');
  const dev = $('cdev');
  if (!calm()) {
    const screen = $('cdev-screen');
    await settle(screen.animate([{ clipPath: 'inset(0 0 0 0)', filter: 'none' }, { clipPath: 'inset(49% 0 49% 0)', filter: 'brightness(3)' }], { duration: 180, easing: 'steps(4)', fill: 'forwards' }));
    const cover = makeCover();
    await settle(cover.animate(SWING.map(k => ({ ...k, ...(k.offset && { offset: 1 - k.offset }) })).reverse(),
      { duration: 340, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' }));
    await settle(dev.animate([...LIFT].reverse(), { duration: 220, easing: EASE, fill: 'forwards' }));
  }
  closeApp(true);
  busy = false;
  $('collection-screen').hidden = true;   // the title comes back over it as an overlay: hidden, it stops taking keys
  afterShut?.();
  dev.getAnimations({ subtree: true }).forEach(a => a.cancel());
  dev.querySelector('.cdev-cover')?.remove();
}

/** Puts the device away at once, no cover: a dock button that leaves for somewhere else (Main menu, the Game Corner). */
export function hideDevice() {
  if (!shown()) return;
  const dev = $('cdev');
  dev.getAnimations({ subtree: true }).forEach(a => a.cancel());
  dev.querySelector('.cdev-cover')?.remove();
  busy = false;
  closeApp(true);
  $('collection-screen').hidden = true;
  afterShut?.();
}

/** Laid over a screen (the top bar's Pokédex, the Bag), not the title's Collection. */
export const deviceOver = () => $('collection-screen').classList.contains('over');

/** A: opens the highlighted pick on the home screen. */
function press() {
  if (busy || !shown()) return;
  if (app) { app.def.app?.press?.(); return; }
  sel?.click();
}

function select(pick, scroll = true) {
  sel?.classList.remove('sel');
  sel = pick;
  if (!pick) return;
  pick.classList.add('sel');
  if (scroll) pick.scrollIntoView({ block: 'nearest' });
}

/** The pick nearest `from` in that direction, weighing sideways drift double. */
function nearest(from, dir) {
  const r = from.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let best = null, score = Infinity;
  for (const p of home().querySelectorAll('.cdev-pick')) {
    if (p === from) continue;
    const q = p.getBoundingClientRect();
    const x = q.left + q.width / 2 - cx, y = q.top + q.height / 2 - cy;
    const ahead = { up: -y, down: y, left: -x, right: x }[dir];
    if (ahead <= 4) continue;
    const d = ahead + 2 * (dir === 'up' || dir === 'down' ? Math.abs(x) : Math.abs(y));
    if (d < score) { score = d; best = p; }
  }
  return best;
}

const ARROW = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

function dpad(dir) {
  if (busy || !shown()) return;
  $('cdev').classList.add('keyed');   // the highlight shows once the D-pad or the keys are in use, not for taps
  if (!app) {
    const next = sel ? nearest(sel, dir) : home().querySelector('.cdev-pick');
    if (next) select(next);
    return;
  }
  if (app.def.app?.key({ key: ARROW[dir] })) return;
  if (dir === 'left' || dir === 'right') return;
  // up and down scroll whatever is scrolling in the app: the Pokédex's list or page, else the app itself
  const box = app.panel.querySelector('.pdx-stage:not([hidden])') ?? app.panel.querySelector('.pdx-list:not([inert])') ?? app.panel;
  box.scrollBy({ top: (dir === 'up' ? -1 : 1) * box.clientHeight * 0.4, behavior: calm() ? 'auto' : 'smooth' });
}

function key(e) {
  if (!shown() || document.querySelector('dialog[open]')) return;
  // the keys it takes go no further: over a run, the Bag and the battle listen for them too
  if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); back(); return; }
  if (e.target.matches?.('input[type="text"]')) return;   // Settings' name box: its arrows move the caret
  const dir = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
  if (dir) { e.preventDefault(); e.stopImmediatePropagation(); dpad(dir); return; }
  if ((e.key === 'Enter' || e.key === ' ') && (!app || app.def.app?.press) && !e.target.closest?.('button')) { e.preventDefault(); press(); }
}
