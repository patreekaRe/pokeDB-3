/* holo-pick.js  -  the Buddy Projector's picker (js/hub-holo.js): a narrow cyan panel of light over the Clearing, the
   walking buddies you can pick in a grid (the PC's WALKING BUDDY page's choices, js/trainercard.js). Its Shiny switch is
   always there (the user's ask, 2026-10-22): every buddy's shiny, greyed till it's bought. A tap picks one and switches
   the projector off; a tap outside or Escape closes it. */

import { getSave, updateSave } from './storage.js';
import { buddy, buddyChoices } from './trainercard.js';
import { playSound, playCry } from './audio.js';
import { calmFx } from './prefs.js';

let root = null, shiny = null, onDone = null;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/** Opens the picker; `done(picked)` runs once it's closed, `picked` true when a new buddy was chosen. */
export function openBuddyPicker(done) {
  if (root) return;
  onDone = done;
  shiny = null;
  const me = root = el('div', `holo-pick${calmFx() ? ' calm' : ''}`);
  me.setAttribute('role', 'dialog');
  me.setAttribute('aria-label', 'Buddy Projector');
  me.addEventListener('pointerdown', (e) => { if (e.target === me) me.dataset.down = '1'; });
  me.addEventListener('pointerup', (e) => { const down = e.target === me && me.dataset.down; delete me.dataset.down; if (down) close(false); });
  addEventListener('keydown', onKey);
  document.body.append(root);
  playSound('select');
  draw();
}

function onKey(e) {
  if (e.key !== 'Escape') return;
  e.preventDefault();
  close(false);
}

function close(picked) {
  if (!root) return;
  if (!picked) playSound('cancel');
  removeEventListener('keydown', onKey);
  const gone = root;
  root = null;
  gone.classList.add('off');
  setTimeout(() => gone.remove(), calmFx() ? 0 : 220);
  onDone?.(picked);
}

function draw() {
  const save = getSave(), now = buddy(save), all = buddyChoices(save);
  shiny ??= !!now.shiny;
  const panel = el('div', 'holo-panel');
  const head = el('div', 'holo-head');
  head.append(el('b', 'holo-title', 'WALKING BUDDY'));
  const t = el('button', `pc-shiny${shiny ? ' on' : ''}`, '✨ Shiny');
  t.type = 'button';
  t.setAttribute('aria-pressed', shiny ? 'true' : 'false');
  t.addEventListener('click', () => { shiny = !shiny; playSound('select'); draw(); });
  head.append(t);
  // the shiny side lists every buddy's shiny, the ones not yet bought (the Game Corner's) greyed and locked
  const shown = all.filter(m => !m.shiny).map(m => !shiny ? m
    : all.find(s => s.shiny && s.id === m.id) ?? { ...m, src: m.src.replace(/-front\.gif$/, '-shiny-front.gif'), name: `Shiny ${m.name}`, locked: true });
  const grid = el('div', 'holo-grid');
  for (const m of shown) {
    const on = !m.locked && (m.key === now.key || (!now.key && m.src === now.src));
    const b = el('button', `holo-mon${on ? ' on' : ''}${m.locked ? ' locked' : ''}`);
    b.type = 'button';
    b.title = m.locked ? `${m.name}: not yours yet` : m.name;
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (m.locked) b.setAttribute('aria-disabled', 'true');
    const img = el('img', 'pixel');
    Object.assign(img, { src: m.src, alt: '', draggable: false });
    b.append(img);
    b.addEventListener('click', () => {
      if (m.locked) { playSound('cancel'); return; }
      if (on) return close(false);
      updateSave(d => { d.buddy = m.key; });
      playCry(m.cry);
      close(true);
    });
    grid.append(b);
  }
  panel.append(head, el('p', 'holo-now', `Now: ${now.name}`), grid);
  if (shiny && shown.some(m => m.locked)) panel.append(el('p', 'holo-hint', 'Greyed shinies are bought at the Game Corner.'));
  root.replaceChildren(panel);
}
