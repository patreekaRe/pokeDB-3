/* plaza-view.js  -  a MOCK (2026-10-28, the user's ask): `?plazaview` makes the Trainer Plaza kiosk's Look open the board
   itself full screen: Polaroids of trainers on lately pinned to cork, one tapped lifting off into its own card with + Add,
   and paper notes pinned along the bottom with your code and a box to add a friend by theirs. Signed in it shows the
   real trainers (plazaTop()); otherwise made-up ones. Nothing is added, saved or sent from here yet. */

import { plazaTop, trainerMon, myCode } from './trainers.js';
import { formatCode } from './data/trainers.js';
import { el, closeX } from './ui.js';
import { playSound, playCry } from './audio.js';

export const PLAZA_VIEW = new URLSearchParams(location.search).has('plazaview');

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

let style = null;
function addStyle() {
  if (style) return;
  style = document.createElement('style');
  style.textContent = `
.pv-veil { position: fixed; inset: 0; z-index: 900; display: flex; align-items: center; justify-content: center; padding: 12px;
  background: rgba(10, 16, 28, 0.62); animation: pv-in 0.18s ease-out; font-family: "PokeDB Pixel", "Press Start 2P", monospace; }
@keyframes pv-in { from { opacity: 0; } }
.pv-board { position: relative; width: min(100%, 640px); max-height: 100%; display: flex; flex-direction: column;
  border: 14px solid #8a5a2e; border-radius: 10px; box-shadow: inset 0 0 0 3px #5a3418, 0 10px 30px rgba(0,0,0,0.5);
  background: radial-gradient(ellipse at center, #d4a068 0%, #c8935a 55%, #a87442 100%);
  background-image: radial-gradient(#a46a38 1px, transparent 1.5px), radial-gradient(#e6bc84 1px, transparent 1.5px),
    radial-gradient(ellipse at center, #d4a068 0%, #c8935a 55%, #a87442 100%);
  background-size: 9px 9px, 13px 13px, 100% 100%; background-position: 0 0, 4px 6px, 0 0;
  animation: pv-up 0.28s cubic-bezier(.2,1.3,.4,1); }
@keyframes pv-up { from { transform: translateY(30px) scale(0.92); } }
.pv-head { align-self: center; margin: -26px 0 6px; padding: 8px 22px; color: #ffe070; font-size: 18px; letter-spacing: 1px;
  text-shadow: 2px 2px 0 #0a3a46; background: linear-gradient(#3cc0cc, #1e8a9c 55%, #125a6a); border: 4px solid #0a3a46;
  border-radius: 6px; box-shadow: 0 4px 0 rgba(0,0,0,0.25); white-space: nowrap; }
.pv-head::before, .pv-head::after { content: '●'; color: #ffd84a; font-size: 12px; margin: 0 10px; vertical-align: 3px; }
.pv-close { position: absolute; top: -22px; right: -22px; z-index: 3; }
.pv-sub { text-align: center; color: #4a2a10; font-size: 12px; margin: 0 0 4px; }
.pv-wall { flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 10px; padding: 14px 12px 10px; }
@media (max-width: 520px) { .pv-wall { grid-template-columns: repeat(2, 1fr); } }
.pv-pol { position: relative; display: block; width: 100%; background: #fbf8f0; padding: 7px 7px 0; border: 0; cursor: pointer; font: inherit;
  box-shadow: 3px 4px 0 rgba(40,20,5,0.35); transform: rotate(var(--r)); transition: transform 0.15s; }
.pv-pol:hover, .pv-pol:focus-visible { transform: rotate(0deg) scale(1.05); z-index: 2; outline: none; }
.pv-pol.lifted { visibility: hidden; }
.pv-photo { position: relative; aspect-ratio: 1 / 0.82; display: flex; align-items: flex-end; justify-content: center;
  background: radial-gradient(circle at 50% 58%, #fff 0%, var(--hi) 45%, var(--lo) 100%); overflow: hidden; }
.pv-photo::after { content: ''; position: absolute; bottom: 8%; left: 30%; right: 30%; height: 8%; border-radius: 50%; background: rgba(0,0,0,0.16); }
.pv-photo img { position: relative; z-index: 1; width: 78%; height: 92%; object-fit: contain; object-position: bottom; image-rendering: pixelated; margin-bottom: 8%; }
.pv-photo img.unseen { filter: brightness(0) opacity(0.75); }
.pv-name { display: block; color: #2a2238; font-size: 12px; padding: 7px 0 9px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pv-pin { position: absolute; top: -6px; left: 50%; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; z-index: 2;
  background: radial-gradient(circle at 35% 35%, #fff 0, var(--pin) 35%, #5a0a10 100%); box-shadow: 1px 2px 0 rgba(0,0,0,0.3); }
.pv-you { position: absolute; top: 2px; right: 2px; z-index: 2; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
  background: #ffd84a; border: 2px solid #8a5a00; color: #6a3a00; font-size: 12px; transform: rotate(12deg); }
.pv-notes { display: flex; gap: 10px; padding: 6px 12px 14px; }
.pv-note { position: relative; flex: 1; background: #fffbe8; padding: 16px 10px 10px; color: #2a2238; font-size: 12px;
  box-shadow: 3px 4px 0 rgba(40,20,5,0.3); border-top: 10px solid #e8383a; }
.pv-note:nth-child(1) { transform: rotate(-1.5deg); }
.pv-note:nth-child(2) { transform: rotate(1deg); border-top-color: #3a7ae8; }
.pv-note b { display: block; font-size: 16px; margin: 6px 0 2px; letter-spacing: 1px; }
.pv-note form { display: flex; gap: 6px; margin-top: 6px; }
.pv-note input { flex: 1; min-width: 0; font: inherit; font-size: 12px; padding: 6px; border: 2px solid #2a2238; background: #fff; text-transform: uppercase; }
.pv-btn { font: inherit; font-size: 12px; padding: 6px 10px; border: 2px solid #1c1430; border-radius: 4px; cursor: pointer;
  background: linear-gradient(#ff6a6a, #d8303a); color: #fff; text-shadow: 1px 1px 0 #6a0a10; box-shadow: 0 3px 0 #6a0a10; }
.pv-btn.blue { background: linear-gradient(#6aa8ff, #2a6ad8); text-shadow: 1px 1px 0 #0a2a6a; box-shadow: 0 3px 0 #0a2a6a; }
.pv-btn:disabled { background: #8ac898; text-shadow: none; box-shadow: 0 3px 0 #2e6a3a; cursor: default; }
.pv-said { margin: 6px 0 0; min-height: 1em; color: #6a3a10; }
.pv-zoom { position: absolute; inset: 0; z-index: 4; display: flex; align-items: center; justify-content: center; background: rgba(40,20,5,0.45); }
.pv-big { position: relative; width: min(78%, 300px); background: #fbf8f0; padding: 12px 12px 14px; box-shadow: 6px 8px 0 rgba(0,0,0,0.35);
  animation: pv-lift 0.25s cubic-bezier(.2,1.3,.4,1); transform: rotate(-1.5deg); }
@keyframes pv-lift { from { transform: scale(0.5) rotate(-8deg); opacity: 0; } }
.pv-big .pv-name { font-size: 18px; padding: 10px 0 4px; }
.pv-stats { display: flex; justify-content: space-around; color: #4a3a58; font-size: 12px; margin: 4px 0 10px; text-align: center; }
.pv-stats b { display: block; font-size: 14px; color: #2a2238; }
.pv-big .pv-pol { display: block; width: 100%; }
.pv-keys { display: flex; gap: 8px; justify-content: center; }
`;
  document.head.append(style);
}

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

/** The Plaza's board, full screen. */
export async function openPlazaView() {
  addStyle();
  playSound('confirm');
  const real = await plazaTop(9).catch(() => null);
  const list = (real?.length ? real.map(e => ({ ...e, seen: e.mine ? 'Online' : '' })) : SAMPLE.map(e => ({ ...e, mon: trainerMon(e.buddy) })));
  const added = new Set();

  const veil = el('div', 'pv-veil'), board = el('div', 'pv-board');
  const close = closeX();
  close.classList.add('pv-close');
  const shut = () => { playSound('cancel'); veil.remove(); removeEventListener('keydown', esc); };
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
      add.addEventListener('click', () => { added.add(e.uid); add.textContent = '✓ Added'; add.disabled = true; playSound('item-get'); });
      keys.append(add);
    }
    const card = el('button', 'pv-btn blue', 'Trainer Card');
    card.type = 'button';
    card.addEventListener('click', () => playSound('confirm'));
    keys.append(card);
    big.append(pol, el('span', 'pv-name', e.name), el('p', 'pv-sub', e.mine ? 'This is you!' : e.seen === 'Online' ? 'Online now' : e.seen ? `Seen ${e.seen}` : ''), stats, keys);
    zoom.append(big);
    zoom.addEventListener('click', (ev) => { if (ev.target === zoom) { from.classList.remove('lifted'); zoom.remove(); playSound('cancel'); } });
    board.append(zoom);
  };
  list.forEach((e, i) => wall.append(polaroid(e, i, (b) => lift(e, b))));

  const notes = el('div', 'pv-notes');
  const mine = el('div', 'pv-note');
  const code = myCode();
  mine.append(el('span', '', 'Your trainer code'), el('b', '', code ? formatCode(code) : 'ABCD-EFGH'), el('span', '', 'Give it to a friend!'));
  const addNote = el('div', 'pv-note');
  const form = el('form', ''), input = el('input', ''), go = el('button', 'pv-btn', 'Add');
  Object.assign(input, { placeholder: 'ABCD-EFGH', maxLength: 12, autocomplete: 'off', spellcheck: false });
  input.setAttribute('aria-label', 'A friend\'s code');
  go.type = 'submit';
  const said = el('p', 'pv-said', '');
  form.append(input, go);
  form.addEventListener('submit', (ev) => { ev.preventDefault(); said.textContent = input.value.trim() ? 'Added! (mock: nothing sent)' : 'Type a code first.'; playSound(input.value.trim() ? 'item-get' : 'cancel'); });
  addNote.append(el('span', '', 'Add a friend'), form, said);
  for (const [n, c] of [[mine, '#e8383a'], [addNote, '#3a7ae8']]) { const p = el('span', 'pv-pin'); p.style.setProperty('--pin', c); n.append(p); }
  notes.append(mine, addNote);

  board.append(close, el('div', 'pv-head', 'TRAINER PLAZA'), el('p', 'pv-sub', 'Trainers on lately. Tap a Polaroid!'), wall, notes);
  veil.append(board);
  document.body.append(veil);
}
