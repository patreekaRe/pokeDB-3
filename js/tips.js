/* ============================================================
   tips.js  -  pop-up hints in a mini copy of the battle text box.

   Status badges, the piles, the coins, the enemy's intent and more
   explain themselves in a `title`. Tapping or clicking anything with a
   title pops the text up, and it stays until the next tap or click
   anywhere (on the box itself too). Only a tap ever shows one: never a
   hover, focus, scroll or a screen opening under a resting mouse (the
   user's call, 2026-10-03: they popped up on their own over the title's
   gems and the Safari Pokédex). Hovering only hides the browser's own
   tooltip. Taps and clicks on buttons and other controls are left alone:
   they already do something (code that wants a note there calls tipAt()).
   A tip sits where it covers no button or tab, if it can.
   ============================================================ */

const CONTROLS = 'button, a, input, select, textarea, label, summary, [role="button"], [role="radio"], [role="tab"], [role="checkbox"]';
const MAX_MOVE = 10;        // px a finger can drift and still count as a tap
const SCROLL_QUIET = 400;   // ms after a scroll in which a tap is taken as stopping it, not asking for a hint
let lastScroll = -Infinity;

let tip = null;             // the bubble element
let owner = null;           // the element whose hint is showing
let pinned = false;         // shown by a tap/click, so it outlives the hover
let start = null;           // where the current tap began
let hovered = null;         // the titled element under the mouse

// While hovered, an element's title moves to data-tip so the browser's
// tooltip doesn't show on top of ours. Code may set a new title meanwhile
// (the enemy's intent changes each turn), so watch for that.
const watcher = new MutationObserver(() => {
  if (!hovered || !hovered.title) return;
  stash(hovered);
  if (owner === hovered) tip.textContent = hintOf(hovered);
});

/** Called once at startup. */
export function initTips() {
  tip = document.createElement('div');
  tip.className = 'tap-tip';
  tip.setAttribute('aria-hidden', 'true');   // the title is already read out by screen readers
  tip.hidden = true;

  document.addEventListener('pointerdown', (e) => {
    start = { x: e.clientX, y: e.clientY };
    if (owner && !owner.contains(e.target)) hideTip();
  }, true);

  // `click`, not pointerup: phones send no click for a swipe, nor for the tap that stops a scroll still gliding, which
  // popped tips up while scrolling (the user's report); a tap right after any scroll is ignored too
  document.addEventListener('click', (e) => {
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > MAX_MOVE) return;
    if (performance.now() - lastScroll < SCROLL_QUIET) return;
    start = null;
    const target = e.target instanceof Element ? e.target.closest('[title], [data-tip]') : null;
    if (!target || !hintOf(target) || e.target.closest(CONTROLS)) return;
    if (target === owner && pinned) return hideTip();
    showTip(target, true);
  }, true);

  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const target = e.target instanceof Element ? e.target.closest('[title], [data-tip]') : null;
    if (target === hovered) return;
    leave();
    if (!target || !hintOf(target)) return;
    hovered = target;
    stash(target);
    watcher.observe(target, { attributes: true, attributeFilter: ['title'] });
  }, true);

  document.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse' || !hovered) return;
    if (e.relatedTarget instanceof Node && hovered.contains(e.relatedTarget)) return;
    leave();
  }, true);

  addEventListener('scroll', () => { lastScroll = performance.now(); hideTip(); }, true);
  addEventListener('resize', hideTip);
}

function hintOf(el) {
  return el.title || el.dataset.tip || '';
}

function stash(el) {
  el.dataset.tip = el.title;
  el.removeAttribute('title');
}

/** The mouse left `hovered`: give its title back. */
function leave() {
  watcher.disconnect();
  if (!hovered) return;
  if (!hovered.title && hovered.dataset.tip) hovered.title = hovered.dataset.tip;
  delete hovered.dataset.tip;
  hovered = null;
}

/** Pin a note over an element, in the tapped-hint box: what a toast used to say (a locked starter's how-to-unlock). */
export const tipAt = (target, text) => (owner === target && pinned ? hideTip() : showTip(target, true, text));

function showTip(target, pin, text = hintOf(target)) {
  owner = target;
  pinned = pin;
  // a modal <dialog> sits in the top layer, above anything outside it
  (target.closest('dialog[open]') || document.body).append(tip);
  tip.textContent = text;
  tip.hidden = false;

  const box = target.getBoundingClientRect();
  const w = tip.offsetWidth, h = tip.offsetHeight;
  const clampX = (x) => Math.min(Math.max(8, x), innerWidth - w - 8);
  const clampY = (y) => Math.min(Math.max(8, y), innerHeight - h - 8);
  const midX = clampX(box.left + box.width / 2 - w / 2), midY = clampY(box.top + box.height / 2 - h / 2);
  const spots = [
    box.top - h - 12 >= 8 && [midX, box.top - h - 12],
    box.bottom + 12 + h <= innerHeight - 8 && [midX, box.bottom + 12],
    box.right + 12 + w <= innerWidth - 8 && [box.right + 12, midY],
    box.left - 12 - w >= 8 && [box.left - 12 - w, midY],
  ].filter(Boolean);
  if (!spots.length) spots.push([midX, clampY(box.bottom + 12)]);
  // the first spot that hides no button or tab, else the one hiding the least
  const controls = [...tip.parentElement.querySelectorAll(CONTROLS)]
    .filter((c) => c !== target && !c.contains(target) && !target.contains(c) && c.offsetParent)
    .map((c) => c.getBoundingClientRect());
  const covered = ([x, y]) => controls.reduce((sum, r) =>
    sum + Math.max(0, Math.min(x + w, r.right) - Math.max(x, r.left)) * Math.max(0, Math.min(y + h, r.bottom) - Math.max(y, r.top)), 0);
  const [left, top] = spots.reduce((best, s) => (covered(s) < covered(best) ? s : best));
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function hideTip() {
  if (!owner) return;
  owner = null;
  pinned = false;
  tip.hidden = true;
}
