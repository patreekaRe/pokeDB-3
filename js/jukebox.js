/* jukebox.js  -  the records at home (js/data/records.js): the song a Secret Base plays, and the window a tap on a jukebox,
   record player or gramophone opens to pick it. The pick is the base's `song`; a friend's base on a visit plays theirs. */

import { getSave, updateSave } from './storage.js';
import { playSound, playMusic } from './audio.js';
import { el } from './ui.js';
import { PIECES, allItems } from './secret-base.js';
import { RECORDS, RECORDS_BY_ID, PLAYERS, PLAYER_KINDS, GIFT_RECORD, ownedRecords, recordsOpen } from './data/records.js';
import { TOWNS, RING, mended, townState } from './data/towns.js';

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
      t.append(disc(r, (r?.id ?? null) === on), el('span', 'rec-name', r ? r.name : 'Secret Base'), el('span', 'rec-from', r ? (r.gift ? 'A gift from Smeargle' : TOWNS[r.town]?.name ?? '') : 'Its own song'));
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

/* ---------- Smeargle brings the jukebox (js/base-3d.js's jukeboxVisit()) ---------- */

/** Whether Smeargle comes with the jukebox this time home: once, with your first Waystone mended, or at once for a
    player from before records (stampRecords()). `?smeargle` brings it again for a playtest (its gifts are kept). */
export function smeargleDue(save = getSave()) {
  if (!recordsOpen()) return false;
  if (new URLSearchParams(location.search).has('smeargle')) return true;
  return !save.recordsIntro && (!!save.recordsOld || ['clearing', ...RING.map(t => t.id)].some(id => mended(townState(save, id))));
}

/** Smeargle's gifts: the player you picked (one more of its kind, owned) and the Clearing's record, the intro heard. */
export function smeargleGift(b, kind) {
  b.owned[PIECES[kind].own] = (b.owned[PIECES[kind].own] || 0) + 1;
  updateSave(d => { d.records = [...new Set([...(Array.isArray(d.records) ? d.records : []), GIFT_RECORD])]; d.recordsIntro = 1; });
}

function pieceArt(id) {
  const a = PIECES[id].art(0, 2), c = document.createElement('canvas');
  c.width = a.width; c.height = a.height;
  c.getContext('2d').drawImage(a, 0, 0);
  c.className = 'tshop-pic';
  return c;
}

/** The one-time pick of a player, one of each kind. Resolves with the kind, or null if the window was shut unpicked. */
export function pickPlayer() {
  const d = el('dialog', 'dialog dev-window town-shop jukebox-pick');
  const say = el('p', 'tshop-say', 'Smeargle: Pick one! Whichever you like. You can only choose once, mind.');
  const grid = el('div', 'tshop-grid');
  const screen = el('div', 'dev-screen');
  screen.append(say, grid);
  const take = el('button', 'btn danger', 'Choose');
  const acts = el('div', 'dialog-actions');
  acts.append(take);
  d.append(el('h2', '', 'A GIFT FROM SMEARGLE'), screen, acts);
  document.body.append(d);
  let picked = null, chosen = null;
  const draw = () => {
    grid.replaceChildren(...PLAYER_KINDS.filter(id => PIECES[id]).map(id => {
      const t = el('button', `tshop-tile${picked === id ? ' on' : ''}`);
      t.type = 'button';
      t.append(pieceArt(id), el('span', 'tshop-name', PIECES[id].name));
      t.addEventListener('click', () => { playSound('confirm'); picked = id; say.textContent = `Smeargle: The ${PIECES[id].name.toLowerCase()}? Good eye!`; draw(); });
      return t;
    }));
    take.disabled = !picked;
  };
  take.addEventListener('click', () => { chosen = picked; d.close(); });
  draw();
  return new Promise(res => {
    d.addEventListener('close', () => { d.remove(); res(chosen); }, { once: true });
    d.showModal();
  });
}
