/* move-stick.js  -  an on-screen stick to walk with (the user's ask, 2026-10-16, a test): held over, your partner walks
   tile by tile the way it leans, like the arrow keys; let go and it stops on the next tile. Shown on touch screens, or
   anywhere with ?stick (?nostick hides it). Each place hands over who may walk (`can`), a step (`nudge(dx, dy)`, true if
   it took), what to do on letting go (`stop`) and what it stands above (`above`, a selector: the rooms' Pokédex bar,
   whose Leave key it would cover, and their text box). */

const DEAD = 0.3;   // of the stick's reach, before a lean counts

export const stickOn = () => {
  const q = new URLSearchParams(location.search);
  return !q.has('nostick') && (q.has('stick') || matchMedia('(pointer: coarse)').matches);
};

export function moveStick({ can, nudge, stop, above = null, className = '' }) {
  const el = document.createElement('div');
  el.className = `move-stick ${className}`.trim();
  el.innerHTML = '<span class="move-knob"></span>';
  const knob = el.firstChild;
  let held = null, lean = null, raf = 0;

  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!lean || !can()) return;
    const [x, y] = lean, ax = Math.abs(x), ay = Math.abs(y);
    const [main, side] = ax > ay ? [[Math.sign(x), 0], [0, Math.sign(y)]] : [[0, Math.sign(y)], [Math.sign(x), 0]];
    // leaning on the slant, a blocked step slides along the wall the other way
    if (!nudge(...main) && Math.min(ax, ay) > DEAD * 0.6) nudge(...side);
  };
  const aim = (e) => {
    const r = el.getBoundingClientRect(), reach = r.width / 2;
    let x = (e.clientX - r.left - reach) / reach, y = (e.clientY - r.top - reach) / reach;
    const d = Math.hypot(x, y);
    if (d > 1) { x /= d; y /= d; }
    knob.style.translate = `${x * reach * 0.55}px ${y * reach * 0.55}px`;
    lean = d > DEAD ? [x, y] : null;
    el.classList.toggle('leaning', !!lean);
  };
  const let_go = (e) => {
    if (held === null || e.pointerId !== held) return;
    held = null; lean = null;
    knob.style.translate = '';
    el.classList.remove('held', 'leaning');
    cancelAnimationFrame(raf); raf = 0;
    stop?.();
  };
  el.addEventListener('pointerdown', (e) => {
    if (held !== null || (e.button ?? 0) > 0) return;
    e.preventDefault(); e.stopPropagation();
    held = e.pointerId;
    el.setPointerCapture?.(e.pointerId);
    el.classList.add('held');
    aim(e);
    if (!raf) tick();
  });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === held) aim(e); });
  el.addEventListener('pointerup', let_go);
  el.addEventListener('pointercancel', let_go);
  el.addEventListener('lostpointercapture', let_go);
  el.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  // over the bar's top edge while it's up, else the corner's own place
  const lift = () => {
    const tops = [...document.querySelectorAll(above)].map(e => e.getBoundingClientRect()).filter(r => r.height && r.top < innerHeight).map(r => r.top);
    el.style.bottom = tops.length ? `${Math.round(innerHeight - Math.min(...tops) + 12)}px` : '';
  };
  const bars = new ResizeObserver(lift);
  return {
    el,
    /** Into the page, over `above` once it's laid out. */
    show(parent = document.body) {
      parent.append(el);
      if (!above) return;
      lift();
      for (const bar of document.querySelectorAll(above)) bars.observe(bar);
      addEventListener('resize', lift);
      setTimeout(lift, 500);
    },
    hide() {
      this.release();
      el.remove();
      bars.disconnect();
      removeEventListener('resize', lift);
    },
    /** Let go as if lifted: the place is leaving. */
    release() { if (held !== null) let_go({ pointerId: held }); },
  };
}
