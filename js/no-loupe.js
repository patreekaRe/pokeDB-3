/* Turns off iOS's hold-to-magnify loupe everywhere (the user's ask, 2026-10-15). Holding a finger down is covered by
   css/base.css (no selecting, no callout), but a double tap held opens the loupe whatever user-select says, and only a
   cancelled touchstart stops it. Cancelling one also eats that tap's click, so the click is sent by hand on its touchend. */

const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const TYPED = 'input, textarea, select, [contenteditable]';
let lastEnd = { t: -1e9, x: 0, y: 0 }, held = null;

if (IOS) {
  document.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    if (e.defaultPrevented || e.touches.length > 1 || e.target.closest?.(TYPED)) return;
    if (performance.now() - lastEnd.t > 350 || Math.hypot(t.clientX - lastEnd.x, t.clientY - lastEnd.y) > 40) return;
    e.preventDefault();
    held = { id: t.identifier, target: e.target, x: t.clientX, y: t.clientY, at: performance.now() };
  }, { passive: false });

  document.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    lastEnd = { t: performance.now(), x: t.clientX, y: t.clientY };
    if (!held || held.id !== t.identifier) return;
    const { target, x, y, at } = held;
    held = null;
    if (performance.now() - at > 600 || Math.hypot(t.clientX - x, t.clientY - y) > 12 || !target.isConnected) return;
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: t.clientX, clientY: t.clientY, screenX: t.screenX, screenY: t.screenY }));
  }, { passive: true });

  document.addEventListener('touchcancel', () => { held = null; }, { passive: true });
}
