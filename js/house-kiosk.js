/* ============================================================
   house-kiosk.js  -  Timburr & Co.'s catalogue, opened at their stand beside the Secret Base's lot in the Clearing
   (docs/roadmap.md's "Secret Base houses", the user's call, 2026-10-23: a kiosk over the PC, so a pick is built on your
   real lot as a try-on before you pay). A sheet in the Pokédex's shell over the lower half of the screen, the lot in view
   above it (js/hub-3d.js turns the camera to it): the houses by tier, each with its tag (HOME, Owned, a price, Locked),
   and the picked one's paints, blurb and one key: Buy (its first paint job free), Move in (free), Repaint (250) or the
   Secret Base itself before there is one. The rules are js/data/houses.js's.
   ============================================================ */

import { HOUSES, HOUSES_BY_ID, TIERS, REPAINT_PRICE, housesOf, cantBuy, buyHouse, moveIn, repaint } from './data/houses.js';
import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el, confirmDialog, refreshCoins } from './ui.js';

const BASE_PRICE = 1500;
let sheet = null;

/** `tryOn({ id, paint } | null)` builds that house on the lot (null: the one lived in); `buyBase(paint)` buys the
    Secret Base itself, true once bought; `onClose(changed)` once shut, `changed` if anything was bought or moved. */
export function openKiosk({ parent, tryOn, buyBase, rebuild, onClose }) {
  if (sheet) return;
  const save = getSave(), h = housesOf(save);
  let pick = h.home || 'cottage', paint = h.paint[pick] || 0, changed = false, note = '';
  sheet = el('div', 'hk-sheet');
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', 'House catalogue');
  const head = el('div', 'hk-head'), coins = el('span', 'hk-coins'), shut = el('button', 'hk-x', '✕');
  shut.type = 'button';
  shut.setAttribute('aria-label', 'Close the catalogue');
  head.append(el('b', 'hk-title', 'TIMBURR & CO.'), coins, shut);
  const list = el('div', 'hk-list'), card = el('div', 'hk-card');
  sheet.append(head, el('div', 'hk-screen'));
  sheet.lastChild.append(list, card);
  parent.append(sheet);
  requestAnimationFrame(() => sheet?.classList.add('up'));

  const show = () => {
    const now = housesOf(getSave());
    tryOn(now.home === pick && (now.paint[pick] || 0) === paint ? null : { id: pick, paint });
  };
  const close = () => {
    if (!sheet) return;
    playSound('cancel');
    removeEventListener('keydown', onKey);
    const gone = sheet;
    sheet = null;
    gone.classList.remove('up');
    setTimeout(() => gone.remove(), 300);
    onClose?.(changed);
  };
  const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('dialog[open]')) { e.preventDefault(); close(); } };
  addEventListener('keydown', onKey);
  shut.addEventListener('click', close);
  const say = (text) => { note = text; render(); };

  const swatch = (house, i) => {
    const p = house.paints[i];
    return house.id === 'tree' ? [p.shade[1][0], p.lobe[1]] : [p.roof, p.wall];
  };
  function tagOf(house, now) {
    if (now.home === house.id) return ['HOME', 'home'];
    if (now.owned.includes(house.id)) return ['Owned', 'own'];
    if (house.price == null) return ['Locked', 'lock'];
    return [(house.id === 'cottage' ? BASE_PRICE : house.price).toLocaleString(), ''];
  }

  function render() {
    if (!sheet) return;
    const s = getSave(), now = housesOf(s), base = !!s.baseOwned, house = HOUSES_BY_ID[pick];
    coins.textContent = `${(s.coins ?? 0).toLocaleString()} coins`;
    list.replaceChildren();
    for (const t of TIERS) {
      const ofTier = HOUSES.filter(x => x.tier === t.id && (x.id !== 'tree' || now.owned.includes('tree')));
      if (!ofTier.length) continue;
      list.append(el('span', 'hk-tier', t.name));
      for (const x of ofTier) {
        const b = el('button', `hk-row${x.id === pick ? ' on' : ''}`), [tag, kind] = tagOf(x, now), [c1, c2] = swatch(x, x.id === pick ? paint : now.paint[x.id] || 0);
        b.type = 'button';
        const dot = el('i', 'hk-dot');
        dot.style.background = `linear-gradient(${c1} 50%, ${c2} 50%)`;
        b.append(dot, el('span', 'hk-name', x.name), el('span', `hk-tag ${kind}`, tag));
        b.addEventListener('click', () => {
          if (pick === x.id) return;
          playSound('select');
          pick = x.id; paint = housesOf(getSave()).paint[pick] || 0; note = '';
          render(); show();
        });
        list.append(b);
      }
    }
    // the picked house: its name, where it comes from, its paints and its one key
    const tier = TIERS.find(t => t.id === house.tier).name;
    const sws = el('div', 'hk-paints');
    house.paints.forEach((p, i) => {
      const b = el('button', `hk-sw${i === paint ? ' on' : ''}`), [c1, c2] = swatch(house, i);
      b.type = 'button';
      b.title = p.name;
      b.setAttribute('aria-label', `${p.name} paint`);
      b.setAttribute('aria-pressed', String(i === paint));
      b.style.background = `linear-gradient(${c1} 50%, ${c2} 50%)`;
      b.addEventListener('click', () => { if (paint === i) return; playSound('select'); paint = i; note = ''; render(); show(); });
      sws.append(b);
    });
    const key = el('button', 'room-ok hk-go');
    key.type = 'button';
    const owned = now.owned.includes(pick), worn = now.paint[pick] || 0;
    let tip = '';
    if (!base) {
      if (pick === 'cottage') { key.textContent = `Buy · ${BASE_PRICE.toLocaleString()}`; key.onclick = buyFirst; tip = 'Your Secret Base: this lot and its Starter Cottage, in the paint you pick.'; }
      else { key.textContent = 'Lot first'; key.disabled = true; tip = 'First the lot: buy it with its Starter Cottage, then any house can go up on it.'; }
    } else if (pick === now.home && paint === worn) { key.textContent = 'You live here'; key.disabled = true; }
    else if (owned && paint === worn) { key.textContent = 'Move in'; key.onclick = moveHere; tip = 'Moving is free once a house is yours.'; }
    else if (owned) { key.textContent = `Repaint · ${REPAINT_PRICE}`; key.onclick = repaintHere; tip = pick === now.home ? `${house.paints[paint].name} for ${REPAINT_PRICE} PokéCoins.` : `${house.paints[paint].name} for ${REPAINT_PRICE} PokéCoins, and you move in.`; }
    else if (house.price == null) { key.textContent = 'Locked'; key.disabled = true; tip = `${house.how}.`; }
    else { key.textContent = `Buy · ${house.price.toLocaleString()}`; key.onclick = buyHere; tip = 'Its first paint job comes with it. Only the outside changes: your rooms, furniture and yard stay as they are.'; }
    card.replaceChildren(
      el('b', 'hk-pick', house.name),
      el('small', 'hk-how', `${tier} · ${house.how}`),
      el('p', 'hk-blurb', house.blurb),
      (() => { const r = el('div', 'hk-row2'); r.append(sws, el('span', 'hk-paint', house.paints[paint].name), key); return r; })(),
      el('p', 'hk-note', note || tip),
    );
    card.lastChild.setAttribute('aria-live', 'polite');
  }

  async function buyFirst() {
    if (!(await confirmDialog(`Make this lot and its Starter Cottage (${HOUSES_BY_ID.cottage.paints[paint].name}) your Secret Base for ${BASE_PRICE.toLocaleString()} PokéCoins?`, `Buy (${BASE_PRICE.toLocaleString()})`))) return;
    if (!sheet || !(await buyBase(paint))) return render();
    changed = true;
    rebuild();
    say('It\'s yours! The planks are off the door: close the catalogue and walk in, or pick a new house any time.');
  }
  async function buyHere() {
    const house = HOUSES_BY_ID[pick], why = cantBuy(getSave(), pick);
    if (why === 'coins') { playSound('cancel'); return say(`You need ${(house.price - (getSave().coins ?? 0)).toLocaleString()} more PokéCoins.`); }
    if (why) { playSound('cancel'); return render(); }
    if (!(await confirmDialog(`Build a ${house.name} (${house.paints[paint].name}) on your lot for ${house.price.toLocaleString()} PokéCoins? You move in at once, and can move back any time for free.`, `Buy (${house.price.toLocaleString()})`))) return;
    let ok = false;
    updateSave(d => { ok = buyHouse(d, pick, paint); });
    if (!ok) { playSound('cancel'); return render(); }
    changed = true;
    playSound('buy');
    refreshCoins();
    say(`The crew built your ${house.name}! It's your home now; every house you own stays yours to move back to.`);
    show();
  }
  function moveHere() {
    let ok = false;
    updateSave(d => { ok = moveIn(d, pick); });
    if (!ok) { playSound('cancel'); return; }
    changed = true;
    playSound('item-get');
    say(`You moved into your ${HOUSES_BY_ID[pick].name}.`);
    show();
  }
  function repaintHere() {
    if ((getSave().coins ?? 0) < REPAINT_PRICE) { playSound('cancel'); return say(`A repaint is ${REPAINT_PRICE} PokéCoins, and you have ${(getSave().coins ?? 0).toLocaleString()}.`); }
    let ok = false;
    updateSave(d => { ok = repaint(d, pick, paint) && moveIn(d, pick); });
    if (!ok) { playSound('cancel'); return render(); }
    changed = true;
    playSound('buy');
    refreshCoins();
    say(`Fresh paint: your ${HOUSES_BY_ID[pick].name} is ${HOUSES_BY_ID[pick].paints[paint].name} now.`);
    show();
  }

  render();
  show();
}
