/* ============================================================
   trainer-notice.js  -  the Trainer Network's cards (the user's ask, 2026-10-17: "aesthetic, cool like it's from a
   video game or MMO, immersive Pokémon style"). A card drops in, in a Trainer Card's colour: a Poké Ball falls,
   wobbles and opens on a buddy, a name plate, and the games' text box typing out its lines with a blinking ▼, and
   A / B keys. Calm effects skip the ball and the flash. js/trainers.js decides who and when; this only shows them.
   - TRAINER LINK: someone added you (Add back / Later), several in turn, 1/2, 2/2.
   - TRAINER NETWORK: the welcome the first time the Trainers app opens (and its ? key), your code on the plate, its
     lines paged with A (Skip on B).
   ============================================================ */

import { el, rayWheel } from './ui.js';
import { playSound, playCry } from './audio.js';
import { calmFx } from './prefs.js';

const TIER_NAME = { green: 'GREEN CARD', bronze: 'BRONZE CARD', silver: 'SILVER CARD', gold: 'GOLD CARD', violet: 'VIOLET CARD' };
const SIGNAL = '<svg viewBox="0 0 24 20" aria-hidden="true"><circle cx="12" cy="17" r="2.4"/><path d="M7.5 12.5a6.4 6.4 0 0 1 9 0"/><path d="M4.4 9.2a10.8 10.8 0 0 1 15.2 0"/><path d="M1.4 5.9a15 15 0 0 1 21.2 0"/></svg>';
const wait = (ms) => new Promise(r => setTimeout(r, ms));

let root = null, onKey = null;

function open(label) {
  root = el('div', 'tn-scrim');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', label);
  document.body.append(root);
  // A is Enter / Space / A / Z, B is Escape / B / X / Backspace, as on the device
  onKey = (e) => {
    if (!root || root.dataset.busy) return;
    const a = ['Enter', ' ', 'a', 'A', 'z', 'Z'].includes(e.key), b = ['Escape', 'b', 'B', 'x', 'X', 'Backspace'].includes(e.key);
    if (!a && !b) return;
    e.preventDefault();
    e.stopPropagation();
    ((b && root.querySelector('.tn-b')) || root.querySelector('.tn-a'))?.click();
  };
  addEventListener('keydown', onKey, true);
}

function close() {
  if (!root) return;
  removeEventListener('keydown', onKey, true);
  const gone = root;
  root = null;
  gone.classList.add('out');
  setTimeout(() => gone.remove(), calmFx() ? 0 : 260);
}

const busy = (on) => { if (root) { if (on) root.dataset.busy = '1'; else delete root.dataset.busy; } };

/** One card: { tier, title, count, mon: { src, masked, cry }, over, name, chips: [..], a, b }. Returns its parts. */
function card({ tier, title, count = '', mon, over, name, chips = [], a, b = null }) {
  const calm = calmFx();
  const box = el('div', `tn-card${calm ? ' calm' : ''}`);
  box.dataset.tier = TIER_NAME[tier] ? tier : 'green';

  const head = el('div', 'tn-head');
  const signal = el('span', 'tn-signal');
  signal.innerHTML = SIGNAL;
  head.append(signal, el('b', 'tn-title', title), el('span', 'tn-count', count));

  const stage = el('div', 'tn-stage');
  const ball = el('span', 'tn-ball');
  ball.append(el('i', 'tn-ball-top'), el('i', 'tn-ball-bot'), el('i', 'tn-ball-btn'));
  const img = el('img', `pixel tn-mon${mon.masked ? ' unseen' : ''}`);
  Object.assign(img, { src: mon.src, alt: '', draggable: false });
  const sparks = el('span', 'tn-sparks');
  for (let k = 0; k < 6; k++) sparks.append(el('i'));
  stage.append(rayWheel('tn-rays', 'rgba(255, 255, 255, 0.28)', { n: 320, solid: 0.08, fade: 0.9 }), el('span', 'tn-ground'), ball, el('span', 'tn-flash'), img, sparks);

  const plate = el('div', 'tn-plate');
  const row = el('span', 'tn-chips');
  row.append(...chips.map(c => el('span', '', c)));
  plate.append(el('small', 'tn-tier', over ?? TIER_NAME[box.dataset.tier]), el('b', 'tn-name', name), ...(chips.length ? [row] : []));

  const talk = el('div', 'tn-box');
  const text = el('p', 'tn-text');
  talk.append(text, el('span', 'tn-more', '▼'));

  const keys = el('div', 'tn-keys');
  const key = (cls, letter, label) => {
    const k = el('button', `tn-key ${cls}`);
    k.type = 'button';
    k.append(el('span', 'tn-glyph', letter), el('span', 'tn-key-label', label));
    return k;
  };
  const ka = key('tn-a', 'A', a), kb = b ? key('tn-b', 'B', b) : null;
  keys.append(...[ka, kb].filter(Boolean));
  keys.inert = true;
  box.append(head, stage, plate, talk, keys);
  return { box, plate, text, keys, a: ka, b: kb, mon };
}

/** Drops a card in: the ball, its cry, then its first line typed out. */
async function drop(c, line) {
  busy(true);
  root.replaceChildren(c.box);
  if (calmFx()) c.box.classList.add('open');
  else {
    playSound('ball-throw');
    await wait(900);
    if (!root) return;
    c.box.classList.add('open');
    playSound('ball-open');
    await wait(260);
  }
  if (!c.mon.masked && c.mon.cry) playCry(c.mon.cry);
  await say(c, line);
}

/** Types a line into the card's box, then hands the keys back. */
function say(c, line) {
  busy(true);
  c.keys.inert = true;
  const box = c.text.parentNode;
  box.classList.remove('done');
  const finish = () => { box.classList.add('done'); c.keys.inert = false; busy(false); c.a.focus({ preventScroll: true }); };
  if (calmFx()) { c.text.textContent = line; finish(); return Promise.resolve(); }
  return new Promise(done => {
    let k = 0;
    c.text.textContent = '';
    const t = setInterval(() => {
      if (!root) { clearInterval(t); return done(); }
      c.text.textContent = line.slice(0, ++k);
      if (k >= line.length) { clearInterval(t); finish(); done(); }
    }, 22);
  });
}

async function leaveCard() {
  busy(true);
  root?.querySelector('.tn-card')?.classList.add('leave');
  await wait(calmFx() ? 0 : 240);
}

/** TRAINER LINK: each of `list` in turn, { name, tier, badges, wins, mon: { src, name, masked, cry }, mutual }.
    `addBack(n)` runs on A (false if it failed), `seen(n)` once each is answered. */
export function showTrainerNotices(list, { addBack, seen }) {
  if (root || !list.length) return;
  open('Trainer Link');
  let i = 0;
  const next = async () => {
    seen(list[i]);
    i += 1;
    if (i >= list.length) return close();
    await leaveCard();
    show();
  };
  function show() {
    const n = list[i];
    const c = card({ tier: n.tier, title: n.mutual ? 'TRAINER LINKED' : 'TRAINER LINK', count: list.length > 1 ? `${i + 1}/${list.length}` : '',
      mon: n.mon, name: n.name, chips: [`BADGES ${n.badges}`, `WINS ${n.wins}`], a: n.mutual ? 'OK' : 'ADD BACK', b: n.mutual ? null : 'LATER' });
    c.a.addEventListener('click', async () => {
      if (root?.dataset.busy) return;
      if (n.mutual) { playSound('confirm'); return next(); }
      busy(true);
      c.keys.inert = true;
      const ok = await addBack(n);
      if (!root) return;
      if (ok === false) { playSound('cancel'); return say(c, 'Couldn\'t reach the network. Try again from the Trainers app.'); }
      playSound('item-get');
      c.box.classList.add('linked');
      c.plate.append(el('span', 'tn-stamp', 'LINKED!'));
      await say(c, `${n.name} is on your Trainers list now!`);
      busy(true);
      await wait(calmFx() ? 400 : 900);
      next();
    });
    c.b?.addEventListener('click', () => { if (root?.dataset.busy) return; playSound('cancel'); next(); });
    drop(c, n.mutual ? `${n.name} added you back! You're linked now.` : `Trainer ${n.name} added you to their Trainers! Add them back?`);
  }
  show();
}

/** TRAINER NETWORK: the welcome, its `lines` paged with A, B skips; `done()` once it's shut either way. `me` is
    { tier, code, mon }. */
export function showTrainerWelcome(me, lines, done) {
  if (root) return;
  open('Trainer Network');
  let i = 0;
  const c = card({ tier: me.tier, title: 'TRAINER NETWORK', count: `1/${lines.length}`, mon: me.mon, over: 'YOUR TRAINER CODE', name: me.code, a: 'NEXT', b: 'SKIP' });
  c.box.classList.add('tn-welcome');
  const finish = () => { close(); done?.(); };
  c.a.addEventListener('click', async () => {
    if (root?.dataset.busy) return;
    if (i >= lines.length - 1) { playSound('item-get'); return finish(); }
    playSound('confirm');
    i += 1;
    c.box.querySelector('.tn-count').textContent = `${i + 1}/${lines.length}`;
    if (i === lines.length - 1) c.a.querySelector('.tn-key-label').textContent = 'LET\'S GO!';
    await say(c, lines[i]);
  });
  c.b.addEventListener('click', () => { if (root?.dataset.busy) return; playSound('cancel'); finish(); });
  drop(c, lines[0]);
}

export const noticeOpen = () => !!root;
