/* ============================================================
   trainer-notice.js  -  the "added you" pop-up (the user's ask, 2026-10-17: "aesthetic, cool like it's from a video
   game or MMO, immersive Pokémon style"). A TRAINER LINK card drops in, in the adder's Trainer Card colour: a Poké
   Ball falls, wobbles and opens on their walking buddy, their name plate, and the games' text box typing out who
   added you, with A (Add back) and B (Later). Several queue up, 1/2, 2/2. Calm effects skip the ball and the flash.
   js/trainers.js decides who and when; this only shows them.
   ============================================================ */

import { el, rayWheel } from './ui.js';
import { playSound, playCry } from './audio.js';
import { calmFx } from './prefs.js';

const TIER_NAME = { green: 'GREEN CARD', bronze: 'BRONZE CARD', silver: 'SILVER CARD', gold: 'GOLD CARD', violet: 'VIOLET CARD' };
const wait = (ms) => new Promise(r => setTimeout(r, ms));

let root = null;

/** Shows each of `list` in turn: { name, tier, badges, wins, mon: { src, name, masked, cry }, mutual }. `addBack(n)`
    runs when A is pressed on one (it returns false if that failed), `seen(n)` once each has been answered. */
export function showTrainerNotices(list, { addBack, seen }) {
  if (root || !list.length) return;
  root = el('div', 'tn-scrim');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Trainer Link');
  document.body.append(root);
  let i = 0, busy = false;

  const close = () => {
    removeEventListener('keydown', onKey, true);
    const gone = root;
    root = null;
    gone.classList.add('out');
    setTimeout(() => gone.remove(), calmFx() ? 0 : 260);
  };
  const next = async () => {
    seen(list[i]);
    i += 1;
    if (i >= list.length) return close();
    busy = true;
    const card = root.querySelector('.tn-card');
    card?.classList.add('leave');
    await wait(calmFx() ? 0 : 240);
    show();
  };
  const onKey = (e) => {
    if (!root || busy) return;
    if (['Enter', ' ', 'a', 'A', 'z', 'Z'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); root.querySelector('.tn-a')?.click(); }
    else if (['Escape', 'b', 'B', 'x', 'X', 'Backspace'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); (root.querySelector('.tn-b') ?? root.querySelector('.tn-a'))?.click(); }
  };
  addEventListener('keydown', onKey, true);

  async function show() {
    const n = list[i], calm = calmFx();
    busy = true;
    const card = el('div', `tn-card${calm ? ' calm' : ''}`);
    card.dataset.tier = TIER_NAME[n.tier] ? n.tier : 'green';

    const head = el('div', 'tn-head');
    const signal = el('span', 'tn-signal');
    signal.innerHTML = '<svg viewBox="0 0 24 20" aria-hidden="true"><circle cx="12" cy="17" r="2.4"/><path d="M7.5 12.5a6.4 6.4 0 0 1 9 0"/><path d="M4.4 9.2a10.8 10.8 0 0 1 15.2 0"/><path d="M1.4 5.9a15 15 0 0 1 21.2 0"/></svg>';
    head.append(signal, el('b', 'tn-title', n.mutual ? 'TRAINER LINKED' : 'TRAINER LINK'), el('span', 'tn-count', list.length > 1 ? `${i + 1}/${list.length}` : ''));

    const stage = el('div', 'tn-stage');
    const ball = el('span', 'tn-ball');
    ball.append(el('i', 'tn-ball-top'), el('i', 'tn-ball-bot'), el('i', 'tn-ball-btn'));
    const mon = el('img', `pixel tn-mon${n.mon.masked ? ' unseen' : ''}`);
    Object.assign(mon, { src: n.mon.src, alt: '', draggable: false });
    const sparks = el('span', 'tn-sparks');
    for (let k = 0; k < 6; k++) sparks.append(el('i'));
    stage.append(rayWheel('tn-rays', 'rgba(255, 255, 255, 0.28)', { n: 320, solid: 0.08, fade: 0.9 }), el('span', 'tn-ground'), ball, el('span', 'tn-flash'), mon, sparks);

    const plate = el('div', 'tn-plate');
    const chips = el('span', 'tn-chips');
    chips.append(el('span', '', `BADGES ${n.badges}`), el('span', '', `WINS ${n.wins}`));
    plate.append(el('small', 'tn-tier', TIER_NAME[card.dataset.tier]), el('b', 'tn-name', n.name), chips);

    const box = el('div', 'tn-box');
    const text = el('p', 'tn-text');
    box.append(text, el('span', 'tn-more', '▼'));

    const keys = el('div', 'tn-keys');
    const key = (cls, letter, label) => {
      const b = el('button', `tn-key ${cls}`);
      b.type = 'button';
      b.append(el('span', 'tn-glyph', letter), el('span', '', label));
      return b;
    };
    const a = key('tn-a', 'A', n.mutual ? 'OK' : 'ADD BACK');
    const b = n.mutual ? null : key('tn-b', 'B', 'LATER');
    keys.append(...[a, b].filter(Boolean));
    keys.inert = true;

    card.append(head, stage, plate, box, keys);
    root.replaceChildren(card);

    a.addEventListener('click', async () => {
      if (busy) return;
      if (n.mutual) { playSound('confirm'); return next(); }
      busy = true;
      keys.inert = true;
      const ok = await addBack(n);
      if (!root) return;
      if (ok === false) { playSound('cancel'); await type(text, 'Couldn\'t reach the network. Try again from the Trainers app.'); busy = false; keys.inert = false; return; }
      playSound('item-get');
      card.classList.add('linked');
      plate.append(el('span', 'tn-stamp', 'LINKED!'));
      await type(text, `${n.name} is on your Trainers list now!`);
      await wait(calm ? 400 : 900);
      next();
    });
    b?.addEventListener('click', () => { if (busy) return; playSound('cancel'); next(); });

    if (calm) card.classList.add('open');
    else {
      playSound('ball-throw');
      await wait(900);
      if (!root) return;
      card.classList.add('open');
      playSound('ball-open');
      await wait(260);
    }
    if (!n.mon.masked && n.mon.cry) playCry(n.mon.cry);
    await type(text, n.mutual ? `${n.name} added you back! You're linked now.` : `Trainer ${n.name} added you to their Trainers! Add them back?`);
    if (!root) return;
    box.classList.add('done');
    keys.inert = false;
    busy = false;
    a.focus({ preventScroll: true });
  }

  function type(node, line) {
    node.parentNode.classList.remove('done');
    if (calmFx()) { node.textContent = line; node.parentNode.classList.add('done'); return Promise.resolve(); }
    return new Promise(done => {
      let k = 0;
      node.textContent = '';
      const t = setInterval(() => {
        if (!root) { clearInterval(t); return done(); }
        node.textContent = line.slice(0, ++k);
        if (k >= line.length) { clearInterval(t); node.parentNode.classList.add('done'); done(); }
      }, 22);
    });
  }

  show();
}

export const noticeOpen = () => !!root;
