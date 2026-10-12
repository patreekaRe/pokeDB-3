/* showcase.js  -  a Game Corner showcase's big screen, up close (2026-10-10, the user's ask: the shiny case was too
   small): one thing at a time, blown up on a Pokédex screen, ◀ / ▶ (or the arrow keys, or a swipe) to step through the
   row, Buy twice to have it. The rows are js/shop.js's cornerEntries(): 'skins', 'shiny', 'perks', 'balls'. */

import { cornerEntries, buyCorner } from './shop.js';
import { getSave } from './storage.js';
import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { openPanel, key } from './corner-panel.js';

export const SHOWCASES = {
  skins: { title: 'POKéMON', colour: '#4ac0f0' },
  shiny: { title: 'SHINY', colour: '#ffd84a' },
  perks: { title: 'PERKS', colour: '#9cf060' },
  balls: { title: 'POKé BALLS', colour: '#ff5ab8' },
  prizes: { title: 'PRIZES', colour: '#ff8a3a' },
};

/* A row from somewhere other than js/shop.js (Meowth's prize counter, js/prizes.js): { entries(), buy(e) }. An entry may
   carry `art`, a node painted for the screen, in place of a sprite. */
const SOURCES = {};
export const showcaseSource = (id, src) => { SOURCES[id] = src; };
const entriesOf = (id) => SOURCES[id]?.entries() ?? cornerEntries(id);

let panel = null, row = null, at = 0, armed = false, news = null, onStep = null;

/** Opens on `row`'s entry `start`; `step(i)` follows along (the 3D screen shows the same one), `close` when shut. */
export function openShowcase(rowId, start = 0, { step, close, say } = {}) {
  row = rowId; at = start; armed = false; news = say ? [say] : null; onStep = step ?? null;
  preloadSounds('stick', 'buy');
  panel = openPanel('sc', `${SHOWCASES[row].title} showcase`, { onClose: close });
  panel.root.style.setProperty('--sc', SHOWCASES[row].colour);
  document.addEventListener('keydown', onKey, true);
  const off = new MutationObserver(() => { if (!panel.root.isConnected) { document.removeEventListener('keydown', onKey, true); off.disconnect(); } });
  off.observe(document.body, { childList: true });
  render();
}

function onKey(e) {
  const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
  if (d) { e.preventDefault(); move(d); }
  else if (e.key === 'Enter') { e.preventDefault(); buy(); }
}

function move(d) {
  const n = entriesOf(row).length;
  at = (at + d + n) % n;
  armed = false; news = null;
  playSound('stick', 'confirm');
  onStep?.(at);
  render(d);
}

function render(dir = 0) {
  const list = entriesOf(row), e = list[at], coins = getSave().coins ?? 0;
  const screen = el('div', `sc-screen${dir ? (dir > 0 ? ' from-right' : ' from-left') : ''}`);
  screen.append(el('span', 'sc-rays'));
  if (e.art) screen.append(e.art());
  else if (e.sprite) {
    const img = el('img', `pixel sc-art${e.dark ? ' dark' : ''}`);
    img.src = e.sprite; img.alt = '';
    screen.append(img);
  } else screen.append(el('span', 'sc-icon', e.icon));
  if (e.tier) screen.append(pips(e.tier));
  if (e.done) screen.append(el('span', 'sc-owned', e.done.toUpperCase()));
  screen.append(el('span', 'sc-count', `${at + 1} / ${list.length}`));

  const prev = key('◀', 'sc-arrow', () => move(-1)), next = key('▶', 'sc-arrow', () => move(1));
  prev.setAttribute('aria-label', 'Previous'); next.setAttribute('aria-label', 'Next');
  const stage = el('div', 'sc-stage');
  stage.append(prev, screen, next);
  swipe(screen);

  const lcd = el('div', 'sc-lcd');
  lcd.append(el('strong', '', e.name), el('span', '', news ? news.join(' ') : e.text));
  const foot = el('div', 'sc-foot');
  if (e.tier) foot.append(el('span', 'sc-level', tierLine(e.tier)));
  else if (e.level) foot.append(el('span', 'sc-level', e.level));
  if (!e.done) {
    const price = el('span', `sc-price${coins < e.cost || e.blocked ? ' short' : ''}`, `💰 ${e.cost.toLocaleString()}`);
    foot.append(price);
  }
  lcd.append(foot);

  const buyKey = key(e.done ? e.done : e.blocked ? 'Locked' : armed ? 'Sure? Buy!' : e.tier?.of > 1 ? `Buy Level ${e.tier.have + 1}` : 'Buy', `vf-go sc-buy${armed ? ' armed' : ''}`, buy);
  buyKey.disabled = !!e.done || e.blocked || coins < e.cost;
  const keys = el('div', 'vf-keys');
  keys.append(buyKey, key('Close', 'vf-close', () => panel.shut()));

  const head = el('div', 'sc-hinge');
  head.append(el('span', 'sc-lens'), el('span', 'sc-light r'), el('span', 'sc-light y'), el('span', 'sc-light g'), el('strong', 'sc-title', SHOWCASES[row].title));
  const box = el('div', 'sc-shell');
  box.append(head, stage, lcd, keys);
  panel.root.replaceChildren(box);
}

/** A perk's levels as a row of pips over the screen: bought ones gold, the one Buy gets you blinking, the rest empty. */
function pips({ have, of }) {
  const row = el('span', 'sc-pips');
  row.append(el('b', '', of > 1 ? 'LEVEL' : 'ONE-TIME'));
  for (let n = 0; n < of; n++) row.append(el('i', n < have ? 'on' : n === have ? 'next' : ''));
  return row;
}

const tierLine = ({ have, of }) => (have >= of ? `All ${of} level${of > 1 ? 's' : ''} owned`
  : of > 1 ? `Level ${have} of ${of} owned` : 'Not owned yet');

function buy() {
  const e = entriesOf(row)[at];
  if (e.done || e.blocked || (getSave().coins ?? 0) < e.cost) return;
  if (!armed) { armed = true; news = null; playSound('select'); return render(); }
  armed = false;
  news = SOURCES[row] ? SOURCES[row].buy(e) : buyCorner(e);
  if (news) playSound('buy');
  onStep?.(at);
  render();
}

/** A swipe across the screen steps it, like turning a Pokédex page. */
function swipe(node) {
  let x0 = null;
  node.addEventListener('pointerdown', (ev) => { x0 = ev.clientX; });
  node.addEventListener('pointerup', (ev) => {
    if (x0 == null) return;
    const dx = ev.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
  });
}
