/* ============================================================
   house-kiosk.js  -  Timburr & Co.'s catalogue, opened at their stand beside the Secret Base's lot in the Clearing
   (docs/roadmap.md's "Secret Base houses", the user's call, 2026-10-23: a kiosk over the PC, so a pick is built on your
   real lot as a try-on before you pay). A merchant's card in the shops' look (Smeargle's garden catalogue, `.gmerch`)
   low on the screen, the lot in view above it (js/hub-3d.js turns the camera to it): Timburr's name tag and a line in
   its voice, a row of house cards each a still of its own 3D model (`snap`) with HOME / Owned / a price / Locked, and
   for the picked one its paints and one key: Buy (its first paint job free), Move in (free), Repaint (250) or the
   Secret Base itself before there is one. Restyled the same day (the user: "doesn't look that great"). The rules are
   js/data/houses.js's.
   ============================================================ */

import { HOUSES, HOUSES_BY_ID, TIERS, REPAINT_PRICE, housesOf, cantBuy, buyHouse, moveIn, repaint } from './data/houses.js';
import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el, confirmDialog, refreshCoins } from './ui.js';
import { smoothIcon } from './smooth-icons.js';

const BASE_PRICE = 1500, PIC = 180;
let sheet = null;
const pics = new Map();   // `${id}:${paint}` -> a still of that house, drawn once a page load
let queue = Promise.resolve();

/** `tryOn({ id, paint } | null)` builds that house on the lot (null: the one lived in); `buyBase(paint)` buys the
    Secret Base itself, true once bought; `snap(id, paint, canvas)` draws a still of a house; `onClose(changed)` once
    shut, `changed` if anything was bought or moved. */
export function openKiosk({ parent, tryOn, buyBase, rebuild, snap, onClose }) {
  if (sheet) return;
  const h = housesOf(getSave());
  let pick = h.home || 'cottage', paint = h.paint[pick] || 0, changed = false, note = '';
  sheet = el('div', 'hk-sheet');
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', 'House catalogue');
  const who = el('span', 'hk-who', 'TIMBURR & CO.'), coins = el('span', 'hk-coins'), shut = el('button', 'hk-x', '✕');
  shut.type = 'button';
  shut.setAttribute('aria-label', 'Close the catalogue');
  const line = el('p', 'hk-say'), row = el('div', 'hk-cards'), pickRow = el('div', 'hk-pick'), paints = el('div', 'hk-paints');
  line.setAttribute('aria-live', 'polite');
  sheet.append(who, coins, shut, line, row, pickRow);
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

  // a house's picture: drawn from the cache, or queued (the stills share one renderer, one at a time)
  const picture = (id, n) => {
    const c = el('canvas', 'hk-pic');
    c.width = c.height = PIC;
    const key = `${id}:${n}`, put = () => c.getContext('2d').drawImage(pics.get(key), 0, 0);
    if (pics.has(key)) put();
    else queue = queue.then(async () => {
      if (!pics.has(key)) {
        const art = document.createElement('canvas');
        art.width = art.height = PIC;
        try { await snap(id, n, art); } catch (err) { console.warn('house still failed', id, err); return; }
        pics.set(key, art);
      }
      put();
    });
    return c;
  };
  const dots = (house, i) => {
    const p = house.paints[i];
    return house.id === 'tree' ? [p.shade[1][0], p.lobe[1]] : [p.roof, p.wall];
  };
  function tagOf(house, now) {
    if (now.home === house.id) return ['HOME', 'home'];
    if (now.owned.includes(house.id)) return ['OWNED', 'own'];
    if (house.price == null) return ['LOCKED', 'lock'];
    return [(house.id === 'cottage' ? BASE_PRICE : house.price).toLocaleString(), 'price'];
  }

  function render() {
    if (!sheet) return;
    const s = getSave(), now = housesOf(s), base = !!s.baseOwned, house = HOUSES_BY_ID[pick];
    coins.replaceChildren(smoothIcon('coin', 'hk-coin'), (s.coins ?? 0).toLocaleString());

    // the cards, by tier; the tree only for a base that has it
    const keep = row.scrollLeft;
    row.replaceChildren();
    for (const t of TIERS) for (const x of HOUSES.filter(o => o.tier === t.id && (o.id !== 'tree' || now.owned.includes('tree')))) {
      const on = x.id === pick, b = el('button', `hk-card${on ? ' on' : ''}`), [tag, kind] = tagOf(x, now);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${x.name}, ${tag}`);
      const box = el('span', 'hk-box');
      box.append(picture(x.id, on ? paint : now.paint[x.id] || 0));
      const price = el('span', `hk-tag ${kind}`);
      if (kind === 'price') price.append(smoothIcon('coin', 'hk-coin'));
      price.append(tag);
      b.append(box, price);
      b.addEventListener('click', () => {
        if (pick === x.id) return;
        playSound('select');
        pick = x.id; paint = housesOf(getSave()).paint[pick] || 0; note = '';
        render(); show();
      });
      row.append(b);
    }
    row.scrollLeft = keep;

    // the picked house: its name, where it comes from, and its one key
    const key = el('button', 'room-ok hk-go');
    key.type = 'button';
    const owned = now.owned.includes(pick), worn = now.paint[pick] || 0;
    let tip = '';
    if (!base) {
      if (pick === 'cottage') { key.textContent = `Buy · ${BASE_PRICE.toLocaleString()}`; key.onclick = buyFirst; tip = 'This lot\'s for sale, the Starter Cottage with it! Pick its paint, and it\'s your Secret Base.'; }
      else { key.textContent = 'Lot first'; key.disabled = true; tip = 'Buy the lot with its Starter Cottage first. Then the crew can build any house on it!'; }
    } else if (pick === now.home && paint === worn) { key.textContent = 'Your home'; key.disabled = true; }
    else if (owned && paint === worn) { key.textContent = 'Move in'; key.onclick = moveHere; tip = 'It\'s yours already. Moving back is free!'; }
    else if (owned) { key.textContent = `Repaint · ${REPAINT_PRICE}`; key.onclick = repaintHere; tip = `${house.paints[paint].name}? A fresh coat is ${REPAINT_PRICE} PokéCoins${pick === now.home ? '' : ', and you move in'}.`; }
    else if (house.price == null) { key.textContent = 'Locked'; key.disabled = true; tip = `This one can't be bought. ${house.how}.`; }
    else { key.textContent = `Buy · ${house.price.toLocaleString()}`; key.onclick = buyHere; }
    // its name over its paints, the key beside them: one row, so the card stays low and the lot shows above it
    const name = el('span', 'hk-pick-name');
    name.append(el('b', '', house.name), paints);
    pickRow.replaceChildren(name, key);

    // its paints: a round swatch each, two-tone like the house, and the picked one's name (the first paint job comes free
    // with a new house)
    paints.replaceChildren(...house.paints.map((p, i) => {
      const b = el('button', `hk-sw${i === paint ? ' on' : ''}`), [c1, c2] = dots(house, i);
      b.type = 'button';
      b.title = p.name;
      b.setAttribute('aria-label', `${p.name} paint`);
      b.setAttribute('aria-pressed', String(i === paint));
      b.style.background = `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`;
      b.addEventListener('click', () => { if (paint === i) return; playSound('select'); paint = i; note = ''; render(); show(); });
      return b;
    }), el('span', 'hk-paint-name', house.paints[paint].name));
    line.textContent = note || tip || house.blurb;
  }

  async function buyFirst() {
    if (!(await confirmDialog(`Make this lot and its Starter Cottage (${HOUSES_BY_ID.cottage.paints[paint].name}) your Secret Base for ${BASE_PRICE.toLocaleString()} PokéCoins?`, `Buy (${BASE_PRICE.toLocaleString()})`))) return;
    if (!sheet || !(await buyBase(paint))) return render();
    changed = true;
    rebuild();
    say('It\'s all yours! The planks are off the door. Close the catalogue and walk in, or pick a new house any time.');
  }
  async function buyHere() {
    const house = HOUSES_BY_ID[pick], why = cantBuy(getSave(), pick);
    if (why === 'coins') { playSound('cancel'); return say(`That's ${(house.price - (getSave().coins ?? 0)).toLocaleString()} PokéCoins short. Come back when you've saved up!`); }
    if (why) { playSound('cancel'); return render(); }
    if (!(await confirmDialog(`Build a ${house.name} (${house.paints[paint].name}) on your lot for ${house.price.toLocaleString()} PokéCoins? You move in at once, and can move back any time for free.`, `Buy (${house.price.toLocaleString()})`))) return;
    let ok = false;
    updateSave(d => { ok = buyHouse(d, pick, paint); });
    if (!ok) { playSound('cancel'); return render(); }
    changed = true;
    playSound('buy');
    refreshCoins();
    say(`Built! Your ${house.name} is home now. Your rooms and furniture moved in with you.`);
    show();
  }
  function moveHere() {
    let ok = false;
    updateSave(d => { ok = moveIn(d, pick); });
    if (!ok) { playSound('cancel'); return; }
    changed = true;
    playSound('item-get');
    say(`Welcome back to your ${HOUSES_BY_ID[pick].name}!`);
    show();
  }
  function repaintHere() {
    if ((getSave().coins ?? 0) < REPAINT_PRICE) { playSound('cancel'); return say(`A fresh coat is ${REPAINT_PRICE} PokéCoins, and you have ${(getSave().coins ?? 0).toLocaleString()}.`); }
    let ok = false;
    updateSave(d => { ok = repaint(d, pick, paint) && moveIn(d, pick); });
    if (!ok) { playSound('cancel'); return render(); }
    changed = true;
    playSound('buy');
    refreshCoins();
    say(`Fresh paint! Your ${HOUSES_BY_ID[pick].name} is ${HOUSES_BY_ID[pick].paints[paint].name} now.`);
    show();
  }

  render();
  show();
  // the picked card in the middle of its row, by hand: scrollIntoView can shove a whole page on an iPhone
  const on = row.querySelector('.hk-card.on');
  if (on) row.scrollLeft = on.offsetLeft - (row.clientWidth - on.offsetWidth) / 2;
}
