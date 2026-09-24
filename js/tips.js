/* ============================================================
   tips.js  -  tap-to-read hints for touch screens.

   Status badges, the piles, the coins, the enemy's intent and more
   explain themselves in a `title`, which only shows on mouse hover.
   On a touch screen, tapping anything with a title pops the same text
   up in a small Pokégear bubble; the next tap anywhere closes it.
   Buttons and other controls are left alone: tapping them already
   does something.
   ============================================================ */

const CONTROLS = 'button, a, input, select, textarea, label, summary, [role="button"], [role="radio"], [role="tab"], [role="checkbox"]';
const MAX_MOVE = 10;        // px a finger can drift and still count as a tap
const SHOW_MS = 5000;

let tip = null;             // the bubble element
let owner = null;           // the element whose hint is showing
let start = null;           // where the current touch began
let hideTimer = 0;

/** Called once at startup. */
export function initTips() {
  tip = document.createElement('div');
  tip.className = 'tap-tip';
  tip.setAttribute('aria-hidden', 'true');   // the title is already read out by screen readers
  tip.hidden = true;

  document.addEventListener('pointerdown', (e) => {
    start = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY };
    if (owner && !owner.contains(e.target)) hideTip();
  }, true);

  document.addEventListener('pointerup', (e) => {
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > MAX_MOVE) return;
    start = null;
    const target = e.target instanceof Element ? e.target.closest('[title]') : null;
    if (!target || !target.title || e.target.closest(CONTROLS)) return;
    if (target === owner) return hideTip();
    showTip(target);
  }, true);

  addEventListener('scroll', hideTip, true);
  addEventListener('resize', hideTip);
}

function showTip(target) {
  owner = target;
  // a modal <dialog> sits in the top layer, above anything outside it
  (target.closest('dialog[open]') || document.body).append(tip);
  tip.textContent = target.title;
  tip.hidden = false;

  const box = target.getBoundingClientRect();
  const width = tip.offsetWidth, height = tip.offsetHeight;
  const left = Math.min(Math.max(8, box.left + box.width / 2 - width / 2), innerWidth - width - 8);
  const above = box.top - height - 8 >= 8;
  tip.style.left = `${left}px`;
  tip.style.top = `${above ? box.top - height - 8 : box.bottom + 8}px`;
  tip.style.setProperty('--arrow-x', `${box.left + box.width / 2 - left}px`);
  tip.classList.toggle('below', !above);

  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideTip, SHOW_MS);
}

function hideTip() {
  if (!owner) return;
  owner = null;
  tip.hidden = true;
  clearTimeout(hideTimer);
}
