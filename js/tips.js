/* ============================================================
   tips.js  -  pop-up hints in a mini copy of the battle text box.

   Status badges, the piles, the coins, the enemy's intent and more
   explain themselves in a `title`. Tapping or clicking anything with a
   title pops the text up, and it stays until the next tap or click
   anywhere (on the box itself too). With a mouse, hovering shows it too,
   in place of the browser's own tooltip.
   Taps and clicks on buttons and other controls are left alone: they
   already do something. Hovering them still shows their hint.
   ============================================================ */

const CONTROLS = 'button, a, input, select, textarea, label, summary, [role="button"], [role="radio"], [role="tab"], [role="checkbox"]';
const MAX_MOVE = 10;        // px a finger can drift and still count as a tap
const HOVER_DELAY = 350;    // ms, so sweeping the mouse across the screen doesn't flicker

let tip = null;             // the bubble element
let owner = null;           // the element whose hint is showing
let pinned = false;         // shown by a tap/click, so it outlives the hover
let start = null;           // where the current tap began
let hovered = null;         // the titled element under the mouse
let hoverTimer = 0;

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

  document.addEventListener('pointerup', (e) => {
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > MAX_MOVE) return;
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
    hoverTimer = setTimeout(() => {
      if (hovered === target && target.isConnected && !pinned) showTip(target, false);
    }, HOVER_DELAY);
  }, true);

  document.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse' || !hovered) return;
    if (e.relatedTarget instanceof Node && hovered.contains(e.relatedTarget)) return;
    leave();
  }, true);

  addEventListener('scroll', hideTip, true);
  addEventListener('resize', hideTip);
}

function hintOf(el) {
  return el.title || el.dataset.tip || '';
}

function stash(el) {
  el.dataset.tip = el.title;
  el.removeAttribute('title');
}

/** The mouse left `hovered`: give its title back and drop a hover-only tip. */
function leave() {
  clearTimeout(hoverTimer);
  watcher.disconnect();
  if (!hovered) return;
  if (!hovered.title && hovered.dataset.tip) hovered.title = hovered.dataset.tip;
  delete hovered.dataset.tip;
  if (owner === hovered && !pinned) hideTip();
  hovered = null;
}

/** Pin a note over an element, in the tapped-hint box: what a toast used to say (a locked starter's how-to-unlock). */
export const tipAt = (target, text) => showTip(target, true, text);

function showTip(target, pin, text = hintOf(target)) {
  owner = target;
  pinned = pin;
  // a modal <dialog> sits in the top layer, above anything outside it
  (target.closest('dialog[open]') || document.body).append(tip);
  tip.textContent = text;
  tip.hidden = false;

  const box = target.getBoundingClientRect();
  const width = tip.offsetWidth, height = tip.offsetHeight;
  const left = Math.min(Math.max(8, box.left + box.width / 2 - width / 2), innerWidth - width - 8);
  const above = box.top - height - 12 >= 8;
  tip.style.left = `${left}px`;
  tip.style.top = `${above ? box.top - height - 12 : box.bottom + 12}px`;
}

function hideTip() {
  if (!owner) return;
  owner = null;
  pinned = false;
  tip.hidden = true;
}
