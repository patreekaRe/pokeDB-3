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

const LEAN_BACK = 5, LIE_FORWARD = 2;

/** A crate of record sleeves to flip through: the front one faces you, the rest lean behind it showing their top
    edges, the ones flipped past lie forward over the crate's lip. A drag (sideways or down), the wheel, the arrow keys
    or the ◀ ▶ buttons flip; a tap on the front sleeve calls `onTap(r)`, a tap on one behind flips to it. `look(r)` says
    `{ out, note }`: the disc slid out and spinning, and the caption's second line. Only the sleeves near the front
    are drawn. */
export function recordCrate(recs, { at = 0, look = () => ({}), onFlip = () => {}, onTap = () => {} } = {}) {
  let cur = Math.max(0, Math.min(recs.length - 1, at)), drag = null, dragged = false, wheelAt = 0;
  const root = el('div', 'rec-crate-wrap');
  const crate = el('div', 'rec-crate');
  const name = el('p', 'rec-cap-name'), note = el('p', 'rec-cap-note'), count = el('p', 'rec-count');
  const prev = el('button', 'rec-step', '◀'), next = el('button', 'rec-step', '▶');
  prev.type = next.type = 'button';
  prev.setAttribute('aria-label', 'Previous record');
  next.setAttribute('aria-label', 'Next record');
  const words = el('div', 'rec-cap-words');
  words.append(name, note, count);
  const caption = el('div', 'rec-caption');
  caption.append(prev, words, next);
  const sleeves = recs.map((r, i) => {
    const s = el('button', 'rec-sleeve');
    s.type = 'button';
    s.style.setProperty('--ink', r.ink);
    s.setAttribute('aria-label', r.name);
    const game = r.name.match(/\(([^)]+)\)$/)?.[1];
    s.append(disc(r), el('span', 'rec-cover'), ...(game ? [el('span', 'rec-tag', game)] : []));
    s.addEventListener('click', () => {
      if (dragged) return;
      if (i === cur) onTap(r); else go(i);
    });
    return s;
  });
  crate.append(...sleeves);
  root.append(crate, caption);

  const refresh = () => {
    sleeves.forEach((s, i) => {
      const k = i - cur, c = Math.max(-LIE_FORWARD - 1, Math.min(LEAN_BACK + 1, k)), seen = k >= -LIE_FORWARD && k <= LEAN_BACK;
      s.style.transform = k < 0 ? `translateY(4px) rotateX(${76 - c * 6}deg)`
        : `translateY(${-c * 11}px) translateZ(${-c * 22}px) rotateX(-6deg)`;
      s.style.zIndex = k < 0 ? 60 + k : 50 - k;
      s.style.opacity = seen ? 1 : 0;
      s.style.visibility = seen ? '' : 'hidden';
      s.style.setProperty('--shade', k > 0 ? Math.min(0.6, k * 0.1) : k < 0 ? 0.25 : 0);
      s.tabIndex = k === 0 ? 0 : -1;
      const out = k === 0 && !!look(recs[i]).out;
      s.classList.toggle('front', k === 0);
      s.classList.toggle('out', out);
      s.firstChild.classList.toggle('spin', out);
    });
    const r = recs[cur];
    name.textContent = r?.name ?? '';
    note.textContent = r ? look(r).note ?? '' : '';
    count.textContent = `${cur + 1} / ${recs.length}`;
    prev.disabled = cur === 0;
    next.disabled = cur >= recs.length - 1;
  };
  const go = (i) => {
    i = Math.max(0, Math.min(recs.length - 1, i));
    if (i === cur) return;
    playSound('sleeve');
    cur = i;
    refresh();
    onFlip(recs[cur]);
  };
  prev.addEventListener('click', () => go(cur - 1));
  next.addEventListener('click', () => go(cur + 1));
  crate.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, from: cur }; dragged = false; });
  crate.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = drag.x - e.clientX, dy = e.clientY - drag.y, m = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    if (!dragged && Math.abs(m) > 8) { dragged = true; crate.setPointerCapture(e.pointerId); }
    if (dragged) go(drag.from + Math.trunc(m / 34));
  });
  const letGo = () => { drag = null; setTimeout(() => { dragged = false; }); };
  crate.addEventListener('pointerup', letGo);
  crate.addEventListener('pointercancel', letGo);
  crate.addEventListener('wheel', (e) => {
    e.preventDefault();
    const now = performance.now(), d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (!d || now - wheelAt < 90) return;
    wheelAt = now;
    go(cur + Math.sign(d));
  }, { passive: false });
  root.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    go(cur + step);
    sleeves[cur].focus({ preventScroll: true });
  });
  refresh();
  return { el: root, refresh, current: () => recs[cur] };
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

/* ---------- Smeargle brings the jukebox (js/base-3d.js's jukeboxIntro()) ---------- */

/** `?smeargle` (with `?records`): its talk again, even before the housewarming. */
export const replaySmeargle = () => new URLSearchParams(location.search).has('smeargle');

/** Whether Smeargle comes with the jukebox this time home: once, with your first Waystone mended, or at once for a
    player from before records (stampRecords()). `?smeargle` brings it again for a playtest (its gifts are kept). */
export function smeargleDue(save = getSave()) {
  if (!recordsOpen()) return false;
  if (replaySmeargle()) return true;
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
