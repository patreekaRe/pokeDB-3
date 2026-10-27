/* dojo.js  -  Kenmatta's trial board (js/data/dojo.js), opened from his dojo in the Clearing (js/run.js's homeRoom()):
   your belt and what the next one needs, the trial ladder (a star a clear, each opening the next), the picked trial on
   a card with its Pokémon, foe and goal, and the furniture the belts and stars bring. Resolves the trial to fight, or
   null. */

import { getSave } from './storage.js';
import { playSound } from './audio.js';
import { el, scrollCue } from './ui.js';
import { STARTERS_BY_ID, spriteUrl, stageName } from './data/starters.js';
import { BELTS, TRIALS, DOJO_REWARDS, dojoOf, beltOf, nextBelt, starsOf, kenWinsOf, trialOpen, dojoEarned, dojoHow } from './data/dojo.js';
import { PIECES } from './secret-base.js';

/** `?trials` opens every trial for the page load, to playtest a late one on an empty save (stars won still count). */
const ALL_OPEN = new URLSearchParams(location.search).has('trials');
const isOpen = (save, i) => ALL_OPEN || trialOpen(save, i);

const ribbon = (b) => {
  const r = el('span', 'dojo-belt');
  r.style.setProperty('--belt', b.colour);
  r.style.setProperty('--knot', b.knot);
  return r;
};

function pieceArt(kind) {
  const p = PIECES[kind], c = document.createElement('canvas');
  if (!p) return c;
  const a = p.art(0, 2);
  c.width = a.width; c.height = a.height;
  c.getContext('2d').drawImage(a, 0, 0);
  return c;
}

export function openDojo() {
  const save = getSave(), ds = dojoOf(save), belt = beltOf(save), next = nextBelt(save);
  const d = el('dialog', 'dialog craft dojo-win');
  const head = el('div', 'craft-head');
  head.append(el('h2', '', 'KENMATTA\'S DOJO'), el('span', 'craft-sub', `★ ${starsOf(save)}/${TRIALS.length} · beaten ${kenWinsOf(save)}×`));
  // your belt, and the next
  const rank = el('div', 'dojo-rank');
  const now = BELTS[Math.max(belt, ds.belt)];
  rank.append(ribbon(now), el('div', 'dojo-rank-text'));
  rank.lastChild.append(el('b', '', now.name), el('span', '', next
    ? `Next, the ${next.belt.name}: ${[next.stars && `${next.stars} more star${next.stars === 1 ? '' : 's'}`, next.wins && `beat him ${next.wins} more time${next.wins === 1 ? '' : 's'} in a run`].filter(Boolean).join(' and ')}.`
    : 'The highest belt there is. Respect, bro.'));
  const ladder = el('div', 'dojo-belts');
  ladder.append(...BELTS.map((b, i) => { const r = ribbon(b); r.classList.toggle('dim', i > belt); r.title = b.name; return r; }));
  rank.append(ladder);
  const card = el('div', 'craft-card dojo-card'), list = el('div', 'craft-list');
  const gifts = el('div', 'dojo-gifts');
  gifts.append(el('p', 'craft-label', 'Belt and star rewards'), ...DOJO_REWARDS.map(r => {
    const got = dojoEarned(save, r.kind), tile = el('div', `dojo-gift${got ? ' got' : ''}`);
    const pic = el('span', 'craft-row-pic');
    pic.append(pieceArt(r.kind));
    tile.append(pic, el('span', 'dojo-gift-name', PIECES[r.kind]?.name ?? r.kind));
    tile.title = got ? 'In your Secret Base' : dojoHow(r.kind, save);
    return tile;
  }));
  const close = el('button', 'btn secondary craft-close', 'Close');
  close.type = 'button';
  d.append(head, rank, card, list, gifts, close);
  document.body.append(d);
  scrollCue(d, list);
  let picked = TRIALS.findIndex((t, i) => isOpen(save, i) && !ds.stars.includes(t.id));
  if (picked < 0) picked = 0;
  let chosen = null;
  const draw = () => {
    list.replaceChildren(...TRIALS.map((t, i) => {
      const open = isOpen(save, i), won = ds.stars.includes(t.id);
      const row = el('button', `craft-row dojo-row${i === picked ? ' on' : ''}${open ? '' : ' locked'}`);
      row.type = 'button';
      row.append(el('span', 'dojo-no', String(i + 1)), el('span', 'craft-row-name', open ? t.name : '???'),
        el('span', `craft-pill${won ? ' made' : open ? ' ready' : ''}`, won ? '★' : open ? 'OPEN' : 'LOCKED'));
      row.addEventListener('click', () => { playSound(open ? 'confirm' : 'cancel'); picked = i; draw(); });
      return row;
    }));
    const t = TRIALS[picked], open = isOpen(save, picked), won = ds.stars.includes(t.id), mon = STARTERS_BY_ID[t.starter];
    const pics = el('div', 'dojo-vs');
    const me = el('img', 'pixel'); me.src = spriteUrl(mon, 'front', 0); me.alt = '';
    const foe = el('img', 'pixel'); foe.src = t.foe.image; foe.alt = '';
    pics.append(me, el('span', 'dojo-vs-word', 'VS'), foe);
    const info = el('div', 'craft-info');
    info.append(el('h3', 'craft-name', `${picked + 1}. ${open ? t.name : '???'}`),
      el('p', 'craft-goes', open ? `${stageName(mon, 0)} (${t.hp}${t.maxHp ? `/${t.maxHp}` : ''} HP) vs ${t.foe.name} (${t.foe.hp} HP)` : 'Clear the trial before it to open this one.'),
      el('p', 'craft-text dojo-goal', open ? `Goal: ${t.goalText}` : ''), el('p', 'craft-text', open ? t.tip : ''));
    const go = el('button', `craft-make${open ? ' ready' : ''}`, !open ? 'Locked' : won ? 'Fight again' : 'Fight!');
    go.type = 'button';
    go.disabled = !open;
    go.addEventListener('click', () => { playSound('confirm'); chosen = t.id; d.close(); });
    card.replaceChildren(pics, info, go);
  };
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(chosen); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}
