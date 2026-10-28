/* plaza-view.js  -  the Trainer Plaza's board full screen, the kiosk's Look in the Clearing (2026-10-28, the user's ask;
   a mock they loved): Polaroids of trainers on lately pinned to cork, one tapped lifting off into its own card with
   + Add and their Trainer Card (the Trainers app's page), and two notes pinned below: your code, and a box to add a
   friend by theirs. Signed out it asks you to sign in. `?plazaview` pins up made-up trainers; nothing is added or sent. */

import { plazaTop, trainerMon, myCode, addTrainer, addByCode, hasTrainer } from './trainers.js';
import { formatCode, lastSeen, FRIENDS_MAX } from './data/trainers.js';
import { cloudSession, openCloud } from './cloud.js';
import { el, closeX } from './ui.js';
import { playSound, playCry } from './audio.js';

const SAMPLE_ON = new URLSearchParams(location.search).has('plazaview');

const TIER = { green: ['#8ee0a8', '#2e8a58'], bronze: ['#f4c08a', '#a8582a'], silver: ['#e4ebf6', '#7a8aa8'], gold: ['#ffe48a', '#c8901a'], violet: ['#d8b4ff', '#6a3ac0'] };
const TIER_NAME = { green: 'Green', bronze: 'Bronze', silver: 'Silver', gold: 'Gold', violet: 'Violet' };
const PINS = ['#e8383a', '#3a7ae8', '#f0c020', '#38b868'];

const SAMPLE = [
  { uid: 's1', name: 'YOU', mine: true, tier: 'silver', buddy: 'starter:squirtle:1', badges: 18, wins: 12, seen: 'Online' },
  { uid: 's2', name: 'MISTY', tier: 'gold', buddy: 'starter:piplup', badges: 24, wins: 31, seen: 'Online' },
  { uid: 's3', name: 'BROCK', tier: 'bronze', buddy: 'starter:bulbasaur:shiny', badges: 9, wins: 4, seen: '2 h ago' },
  { uid: 's4', name: 'GARY', tier: 'violet', buddy: 'starter:charmander:2', badges: 40, wins: 88, seen: '5 h ago' },
  { uid: 's5', name: 'DAWN', tier: 'green', buddy: 'starter:chikorita', badges: 3, wins: 1, seen: '1 d ago' },
  { uid: 's6', name: 'RED', tier: 'gold', buddy: 'starter:rayquaza', badges: 31, wins: 52, seen: '1 d ago' },
];

function polaroid(e, i, onTap) {
  const [hi, lo] = TIER[e.tier] ?? ['#cfd6e2', '#7a8496'];
  const b = el('button', 'pv-pol');
  b.type = 'button';
  b.style.setProperty('--r', `${[-4, 3, -2, 5, -3, 2, -5, 4][i % 8]}deg`);
  b.setAttribute('aria-label', `${e.name}'s Polaroid`);
  const photo = el('span', 'pv-photo');
  photo.style.setProperty('--hi', hi); photo.style.setProperty('--lo', lo);
  const img = el('img', e.mon.masked ? 'unseen' : '');
  img.src = e.mon.src; img.alt = ''; img.draggable = false;
  photo.append(img);
  const pin = el('span', 'pv-pin');
  pin.style.setProperty('--pin', PINS[i % 4]);
  b.append(pin, photo, el('span', 'pv-name', e.name));
  if (e.mine) b.append(el('span', 'pv-you', 'YOU'));
  b.addEventListener('click', () => onTap(b));
  return b;
}

/** The Plaza's board, full screen; `onCard(uid)` opens a trainer's page in the Trainers app. */
export async function openPlazaView({ onCard } = {}) {
  playSound('confirm');
  const sample = SAMPLE_ON;
  const list = sample ? SAMPLE.map(e => ({ ...e, mon: trainerMon(e.buddy) }))
    : (await plazaTop(9).catch(() => null))?.map(e => ({ ...e, seen: e.mine ? 'Online' : lastSeen(e.at).replace(/^Seen /, '') }));
  const me = sample ? null : await cloudSession().then(s => s.user?.uid ?? null, () => null);
  const added = new Set(sample ? [] : list?.filter(e => hasTrainer(e.uid)).map(e => e.uid));

  const veil = el('div', 'pv-veil'), board = el('div', 'pv-board');
  const close = closeX();
  close.classList.add('pv-close');
  const shut = (quiet) => { if (quiet !== true) playSound('cancel'); veil.remove(); removeEventListener('keydown', esc); };
  const esc = (ev) => { if (ev.key === 'Escape') shut(); };
  addEventListener('keydown', esc);
  close.addEventListener('click', shut);
  veil.addEventListener('click', (ev) => { if (ev.target === veil) shut(); });

  const wall = el('div', 'pv-wall');
  const lift = (e, from) => {
    playSound('confirm');
    if (!e.mon.masked && e.mon.cry) playCry?.(e.mon.cry);
    from.classList.add('lifted');
    const zoom = el('div', 'pv-zoom'), big = el('div', 'pv-big');
    const pol = polaroid(e, 0, () => {});
    pol.style.setProperty('--r', '0deg'); pol.style.boxShadow = 'none'; pol.style.padding = '0'; pol.style.pointerEvents = 'none';
    pol.querySelector('.pv-name').remove();
    const stats = el('div', 'pv-stats');
    for (const [k, v] of [['Card', TIER_NAME[e.tier] ?? '-'], ['Badges', e.badges ?? '-'], ['Wins', e.wins ?? '-']]) { const s = el('span', '', k); s.prepend(el('b', '', String(v))); stats.append(s); }
    const keys = el('div', 'pv-keys');
    if (!e.mine) {
      const add = el('button', 'pv-btn', added.has(e.uid) ? '✓ Added' : '+ Add');
      add.type = 'button'; add.disabled = added.has(e.uid);
      add.addEventListener('click', () => {
        const why = sample ? null : addTrainer(e.uid, me);
        if (why && why !== 'already') { playSound('cancel'); add.textContent = why === 'full' ? `List full (${FRIENDS_MAX})` : 'Couldn\'t add'; return; }
        added.add(e.uid); add.textContent = '✓ Added'; add.disabled = true; playSound('item-get');
      });
      keys.append(add);
    }
    const card = el('button', 'pv-btn blue', 'Trainer Card');
    card.type = 'button';
    card.addEventListener('click', () => { playSound('confirm'); if (!sample) { shut(true); onCard?.(e.mine ? null : e.uid); } });
    keys.append(card);
    big.append(pol, el('span', 'pv-name', e.name), el('p', 'pv-sub', e.mine ? 'This is you!' : e.seen === 'Online' ? 'Online now' : e.seen ? `Seen ${e.seen}` : ''), stats, keys);
    zoom.append(big);
    zoom.addEventListener('click', (ev) => { if (ev.target === zoom) { from.classList.remove('lifted'); zoom.remove(); playSound('cancel'); } });
    board.append(zoom);
  };
  if (list?.length) list.forEach((e, i) => wall.append(polaroid(e, i, (b) => lift(e, b))));
  else {
    const n = el('div', 'pv-note pv-empty');
    n.append(el('b', '', list ? 'NOBODY HERE YET!' : 'SIGN IN TO JOIN!'), el('span', '', list ? 'Check back soon.' : 'Sign in to pin yourself up and add the trainers here.'));
    if (!list) {
      const b = el('button', 'pv-btn', 'Sign in');
      b.type = 'button';
      b.addEventListener('click', () => { shut(true); openCloud(); });
      n.append(b);
    }
    wall.append(n);
  }

  const notes = el('div', 'pv-notes');
  const mine = el('div', 'pv-note');
  const code = myCode();
  mine.append(el('span', '', 'Your trainer code'), el('b', '', sample ? 'ABCD-EFGH' : code ? formatCode(code) : '----'), el('span', '', code || sample ? 'Give it to a friend!' : 'Sign in to get yours.'));
  const addNote = el('div', 'pv-note');
  const form = el('form', ''), input = el('input', ''), go = el('button', 'pv-btn', 'Add');
  Object.assign(input, { placeholder: 'ABCD-EFGH', maxLength: 12, autocomplete: 'off', spellcheck: false });
  input.setAttribute('aria-label', 'A friend\'s code');
  go.type = 'submit';
  const said = el('p', 'pv-said', '');
  form.append(input, go);
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    go.disabled = true;
    said.textContent = 'Looking…';
    const why = sample ? (input.value.trim() ? null : 'Type a code first.') : await addByCode(input.value);
    go.disabled = false;
    said.textContent = why ?? 'Added! They\'ll see a TRAINER LINK next time they play.';
    playSound(why ? 'cancel' : 'item-get');
    if (!why) input.value = '';
  });
  addNote.append(el('span', '', 'Add a friend'), form, said);
  for (const [n, c] of [[mine, '#e8383a'], [addNote, '#3a7ae8']]) { const p = el('span', 'pv-pin'); p.style.setProperty('--pin', c); n.append(p); }
  notes.append(mine, addNote);

  board.append(close, el('div', 'pv-head', 'TRAINER PLAZA'), el('p', 'pv-sub', 'Trainers on lately. Tap a Polaroid!'), wall, notes);
  veil.append(board);
  document.body.append(veil);
}
