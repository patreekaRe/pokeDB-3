/* ============================================================
   look-window.js  -  the trainer window (2026-10-28, the user's design: "a combination of the Timburr house select and
   the Game Corner prize window"): Timburr's catalogue card (js/house-kiosk.js, `.hk-*`: cream, a gold rim, the keeper's
   name tag askew, the keeper's line, coins and a round ✕) round Meowth's prize screen (js/showcase.js: one thing big,
   ◀ / ▶). One trainer big in a spotlit box walking in place, turning through its four ways; under it a sideways row of
   small trainer cards (OWNED, WORN or the price) to jump to one; Wear or Buy on the gold key. No names anywhere (the
   user's call): the keeper's line says what the one shown is like.
   At the Trainer Tailor (js/mall-tailor.js, `shop`) Kecleon keeps it and it sells, and the one shown is tried on as you
   browse (`onTry`). On the Trainer Card (`shop` false) it only switches between looks owned: the rest are greyed, "At the
   Trainer Tailor", and Walk alone takes the look off. Buying is the tailor's only (the user's call, 2026-10-28).
   ============================================================ */

import { LOOKS, LOOK_PRICE, lookSheet, ownsLook, wornLook } from './data/looks.js';
import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el, lookArt, confirmDialog, refreshCoins } from './ui.js';
import { smoothIcon } from './smooth-icons.js';
import { calmFx } from './prefs.js';

const WAYS = [0, 1, 3, 2];   // the sheet's rows (down, left, right, up) in turning order: down, left, up, right
const TURN_MS = 2200;

/** Builds the window. `shop`: Kecleon's, selling; `start` the look shown first (default the one worn); `onTry(id)` each
    time the one shown changes (the tailor tries it on); `onChange()` after a buy or a wear; `onClose()` from its ✕ (or
    Escape, or Back on the card). Returns `{ node, close }`: the caller puts `node` where it goes (the tailor's stage, the
    Trainer Card's body). `booth`: from a fitting room (the user's ask, 2026-10-28: the camera zooms in on the booth and
    the booth is the window), so no big trainer box or row of cards, only Kecleon's card low down and ◀ / ▶ either
    side of the screen, in `sides`, which the caller puts over the view too. */
export function lookWindow({ shop = false, booth = false, start = null, onTry = null, onChange = null, onClose = null } = {}) {
  const save = getSave();
  let at = Math.max(0, LOOKS.findIndex(l => l.id === (start ?? save.look ?? wornLook(save)?.id)));
  let note = '', shut = false, turner = 0, way = 0;
  const node = el('div', `lw-sheet${shop ? ' lw-shop' : ' lw-card'}${booth ? ' lw-in-booth' : ''}`);
  node.setAttribute('role', 'dialog');
  node.setAttribute('aria-label', shop ? 'Trainer Tailor' : 'Your trainer');
  const who = el('span', 'hk-who lw-who', shop ? 'KECLEON' : 'WARDROBE'), coins = el('span', 'hk-coins lw-coins'), x = el('button', 'hk-x lw-x', '✕');
  x.type = 'button';
  x.setAttribute('aria-label', shop ? 'Close the Trainer Tailor' : 'Back to your Trainer Card');
  const line = el('p', 'hk-say lw-say');
  line.setAttribute('aria-live', 'polite');

  // the big one: ◀, the spotlit box with the trainer walking in place, ▶
  const stage = el('div', 'lw-stage'), box = el('div', 'lw-box'), big = el('span', 'look-art lw-big');
  const prev = el('button', 'lw-arrow', '◀'), next = el('button', 'lw-arrow', '▶');
  for (const [b, label] of [[prev, 'Previous trainer'], [next, 'Next trainer']]) { b.type = 'button'; b.setAttribute('aria-label', label); }
  const tag = el('span', 'hk-tag lw-tag');
  box.append(el('span', 'lw-spot'), big, tag);
  stage.append(prev, box, next);

  // the row of small cards
  const row = el('div', 'hk-cards lw-cards');
  const cards = LOOKS.map((look, i) => {
    const b = el('button', 'hk-card lw-mini');
    b.type = 'button';
    const pic = el('span', 'hk-box lw-mini-box');
    pic.append(lookArt(lookSheet(look.id)));
    b.append(pic, el('span', 'hk-tag'));
    b.addEventListener('click', () => { if (at !== i) { playSound('select'); go(i); } });
    return b;
  });
  row.append(...cards);

  const keys = el('div', 'lw-keys'), key = el('button', 'room-ok lw-go'), alone = el('button', 'lw-alone', 'Walk alone');
  key.type = alone.type = 'button';
  alone.title = 'No trainer: your partner walks by itself';
  keys.append(...(shop ? [] : [alone]), key);
  const count = el('span', 'lw-count'), sides = el('div', 'lw-sides');
  if (booth) {
    prev.classList.add('lw-side'); next.classList.add('lw-side');
    sides.append(prev, next);
    keys.prepend(tag, count);
    node.append(who, coins, x, line, keys);
  } else node.append(who, ...(shop ? [coins, x] : []), line, stage, row, keys);   // the Trainer Card has its own Back, and sells nothing

  const tagOf = (look, s) => {
    if (s.look === look.id && wornLook(s)?.id === look.id) return ['WORN', 'home'];
    if (ownsLook(s, look.id)) return ['OWNED', 'own'];
    return shop ? [LOOK_PRICE.toLocaleString(), 'price'] : ['TAILOR', 'lock'];
  };
  const fillTag = (t, look, s) => {
    const [text, kind] = tagOf(look, s);
    t.className = `hk-tag ${kind}${t === tag ? ' lw-tag' : ''}`;
    t.replaceChildren(...(kind === 'price' ? [smoothIcon('coin', 'hk-coin')] : []), text);
  };

  function render() {
    if (shut) return;
    const s = getSave(), look = LOOKS[at], owned = ownsLook(s, look.id), wearing = s.look === look.id;
    coins.replaceChildren(smoothIcon('coin', 'hk-coin'), (s.coins ?? 0).toLocaleString());
    big.style.backgroundImage = `url("${lookSheet(look.id)}")`;
    big.classList.toggle('locked', !shop && !owned);
    fillTag(tag, look, s);
    count.textContent = `${at + 1} / ${LOOKS.length}`;
    cards.forEach((b, i) => {
      const l = LOOKS[i], mine = ownsLook(s, l.id);
      b.classList.toggle('on', i === at);
      b.classList.toggle('locked', !shop && !mine);
      b.setAttribute('aria-pressed', String(i === at));
      fillTag(b.lastChild, l, s);
      b.setAttribute('aria-label', `${l.name}, ${tagOf(l, s)[0]}`);
    });
    key.disabled = false;
    key.onclick = null;
    let tip = look.line;
    if (wearing) { key.textContent = 'Wearing'; key.disabled = true; }
    else if (owned) { key.textContent = 'Wear'; key.onclick = wear; }
    else if (shop) { key.textContent = `Buy · ${LOOK_PRICE.toLocaleString()}`; key.onclick = buy; }
    else { key.textContent = 'At the Trainer Tailor'; key.disabled = true; tip = 'Sold at the Trainer Tailor in the Poké Mall. Try it on there first!'; }
    alone.hidden = !s.look;
    line.textContent = note || tip;
  }

  function go(i, quiet = false) {
    at = (i + LOOKS.length) % LOOKS.length;
    note = '';
    way = 0; turnSoon();
    big.style.backgroundPositionY = '0%';
    render();
    const on = cards[at];
    if (on.offsetLeft < row.scrollLeft || on.offsetLeft + on.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
    if (!quiet) onTry?.(LOOKS[at].id);
  }
  prev.addEventListener('click', () => { playSound('select'); go(at - 1); });
  next.addEventListener('click', () => { playSound('select'); go(at + 1); });

  function wear() {
    const id = LOOKS[at].id;
    updateSave(d => { d.look = id; d.lookChosen = true; });
    playSound('confirm');
    note = shop ? 'Looking sharp! Your partner\'s right behind you.' : 'Your partner walks a step behind you.';
    render();
    onChange?.();
  }
  alone.addEventListener('click', () => {
    updateSave(d => { d.look = null; d.lookChosen = true; });
    playSound('cancel');
    note = 'Your partner walks alone.';
    render();
    onChange?.();
  });
  async function buy() {
    const look = LOOKS[at], coinsNow = getSave().coins ?? 0;
    if (coinsNow < LOOK_PRICE) { playSound('cancel'); note = `That one's ${LOOK_PRICE} PokéCoins, and you have ${coinsNow.toLocaleString()}. Come back soon!`; return render(); }
    if (!(await confirmDialog(`Buy this outfit for ${LOOK_PRICE} PokéCoins? You walk out wearing it, and you can switch back any time on your Trainer Card.`, `Buy (${LOOK_PRICE})`))) return;
    if (shut) return;
    let ok = false;
    updateSave(d => {
      if ((d.coins ?? 0) < LOOK_PRICE || ownsLook(d, look.id)) return;
      d.coins -= LOOK_PRICE; d.looks = [...new Set([...(d.looks || []), look.id])]; d.look = look.id; d.lookChosen = true;
      ok = true;
    });
    if (!ok) { playSound('cancel'); return render(); }
    playSound('buy');
    refreshCoins();
    note = 'It fits like it was made for you! Switch outfits any time on your Trainer Card.';
    render();
    onChange?.();
  }

  // the big one walks in place, turning a quarter every TURN_MS (still under calm effects); a timer, not a frame loop
  const calm = calmFx() || matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.classList.toggle('lw-calm', calm);
  function turnSoon() { clearTimeout(turner); if (!shut && !booth) turner = setTimeout(turn, TURN_MS); }
  function turn() {
    if (shut) return;
    if (!node.isConnected) return detach();
    turnSoon();
    if (calm || !node.getClientRects().length) return;
    way = (way + 1) % WAYS.length;
    big.style.backgroundPositionY = `${WAYS[way] * 100 / 3}%`;
  }
  turnSoon();

  // The Trainer Card shut from outside (a tap off it, Escape) or the Collection's app closed takes this window with it
  // without a close(): its Escape listener then held that card and this window, ~250 listeners each (2026-10-29), and an
  // Escape later redrew every card left so. A window no longer on the page lets go of itself.
  function detach() { shut = true; clearTimeout(turner); removeEventListener('keydown', onKey); }
  const close = () => {
    if (shut) return;
    detach();
    onClose?.();
  };
  const onKey = (e) => {
    if (!node.isConnected) return detach();
    if (e.key === 'Escape' && node.getClientRects().length && !document.querySelector('dialog[open]')) { e.preventDefault(); playSound('cancel'); close(); }
  };
  addEventListener('keydown', onKey);
  x.addEventListener('click', () => { playSound('cancel'); close(); });

  render();
  requestAnimationFrame(() => go(at, true));
  return { node, sides, close, get look() { return LOOKS[at].id; }, show: (id) => { const i = LOOKS.findIndex(l => l.id === id); if (i >= 0) go(i, true); }, refresh: render };
}

