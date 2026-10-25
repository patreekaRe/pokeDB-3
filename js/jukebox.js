/* jukebox.js  -  the records at home (js/data/records.js): the song a Secret Base plays, and the window a tap on a jukebox,
   record player or gramophone opens to pick it. The pick is the base's `song`; a friend's base on a visit plays theirs. */

import { getSave } from './storage.js';
import { playSound, playMusic } from './audio.js';
import { el } from './ui.js';
import { PIECES, allItems } from './secret-base.js';
import { RECORDS, RECORDS_BY_ID, PLAYERS, ownedRecords, recordsOpen } from './data/records.js';
import { TOWNS } from './data/towns.js';

export const isPlayer = (id) => recordsOpen() && PLAYERS.has(PIECES[id]?.fam);

/** The song a base plays: its record while a player stands somewhere in it, else the base's own. `mine` (your own
    base, not a friend's) also needs the record still held, so one lent by `?records=all` stops with the flag. */
export function baseSong(b, mine = true) {
  const r = recordsOpen() && RECORDS_BY_ID[b?.song] && (!mine || ownedRecords(getSave()).includes(b.song)) && RECORDS_BY_ID[b.song];
  return r && allItems(b).some(it => PLAYERS.has(PIECES[it.id]?.fam)) ? r.track : 'secret-base';
}

/** A record's face: a black disc, its grooves, a label in the record's colour. `spin` while it plays. */
export function disc(r, spin = false) {
  const d = el('span', `rec-disc${spin ? ' spin' : ''}`);
  d.style.setProperty('--ink', r ? r.ink : '#888');
  d.append(el('span', 'rec-label'));
  return d;
}

/** Pick the base's record. `b` is the base, `save()` keeps it. Resolves once the window shuts. */
export function openJukebox(b, save) {
  const owned = new Set(ownedRecords(getSave()));
  const d = el('dialog', 'dialog dev-window jukebox');
  const head = el('h2', '', 'JUKEBOX');
  const say = el('p', 'tshop-say');
  const list = el('div', 'rec-list');
  const screen = el('div', 'dev-screen');
  screen.append(say, list);
  const close = el('button', 'btn secondary', 'Done');
  const acts = el('div', 'dialog-actions');
  acts.append(close);
  d.append(head, screen, acts);
  document.body.append(d);
  const line = (r) => {
    say.textContent = r ? `Now playing: ${r.name}. Friends who visit hear it too.` : 'Playing the Secret Base\'s own song.';
  };
  const draw = () => {
    const on = RECORDS_BY_ID[b.song] && owned.has(b.song) ? b.song : null;
    const row = (r) => {
      const t = el('button', `rec-row${(r?.id ?? null) === on ? ' on' : ''}`);
      t.type = 'button';
      t.append(disc(r, (r?.id ?? null) === on), el('span', 'rec-name', r ? r.name : 'Secret Base'), el('span', 'rec-from', r ? TOWNS[r.town]?.name ?? '' : 'Its own song'));
      t.addEventListener('click', () => {
        if ((r?.id ?? null) === on) return;
        playSound('confirm');
        if (r) b.song = r.id; else delete b.song;
        save();
        playMusic(baseSong(b));
        line(r);
        draw();
      });
      return t;
    };
    list.replaceChildren(row(null), ...RECORDS.filter(r => owned.has(r.id)).map(row));
    if (!owned.size) list.append(el('p', 'rec-none', 'No records yet. Mend a town\'s Waystone, then visit its trader: they sell the songs from round there.'));
  };
  line(RECORDS_BY_ID[b.song] && owned.has(b.song) ? RECORDS_BY_ID[b.song] : null);
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(); }, { once: true });
    close.addEventListener('click', () => d.close());
    d.showModal();
  });
}
