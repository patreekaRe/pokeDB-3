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

import { HOUSES, HOUSES_BY_ID, TIERS, REPAINT_PRICE, housesOf, cantBuy, buyHouse, moveIn, repaint, earnedOf, earnProgress, onSale, seasonName, FREE } from './data/houses.js';
import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { el, confirmDialog, refreshCoins, fitText } from './ui.js';
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
  let pick = h.home || FREE[0], paint = h.paint[pick] || 0, changed = false, note = '';
  sheet = el('div', 'hk-sheet');
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', 'House catalogue');
  const who = el('span', 'hk-who', 'TIMBURR & CO.'), coins = el('span', 'hk-coins'), shut = el('button', 'hk-x', '✕');
  shut.type = 'button';
  shut.setAttribute('aria-label', 'Close the catalogue');
  const line = el('p', 'hk-say'), row = el('div', 'hk-cards'), pickRow = el('div', 'hk-pick'), paints = el('div', 'hk-paints');
  line.setAttribute('aria-live', 'polite');
  // a "more" pill over the row's right edge while houses sit past it (the user, 2026-10-27: players didn't know the
  // row scrolled); a tap nudges the row along
  const shelf = el('div', 'hk-shelf'), more = el('button', 'hk-more');
  more.type = 'button';
  more.setAttribute('aria-label', 'More houses');
  more.append(el('span', 'hk-more-pill', 'MORE ›'));
  more.addEventListener('click', () => row.scrollBy({ left: row.clientWidth * 0.8, behavior: 'smooth' }));
  const hint = () => more.classList.toggle('gone', row.scrollLeft + row.clientWidth >= row.scrollWidth - 8);
  row.addEventListener('scroll', hint, { passive: true });
  shelf.append(row, more);
  sheet.append(who, coins, shut, line, shelf, pickRow);
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
    return house.id === 'tree' ? [p.shade[1][0], p.lobe[1]] : (house.swatch || ['roof', 'wall']).map(k => p[k]);
  };
  // a card's tag: HOME, OWNED, EARNED (before there's a lot to build it on), LOCKED (earned houses not yet earned), a
  // seasonal house's month out of season, or its price
  function tagOf(house, now, save) {
    if (now.home === house.id) return ['HOME', 'home'];
    if (now.owned.includes(house.id)) return ['OWNED', 'own'];
    if (house.earn) return earnedOf(save).includes(house.id) ? ['EARNED', 'own'] : ['LOCKED', 'lock'];
    if (!onSale(house)) return [seasonName(house).slice(0, 3).toUpperCase(), 'lock'];
    return [(FREE.includes(house.id) ? BASE_PRICE : house.price).toLocaleString(), 'price'];
  }
  // Timburr on a house that can't be bought: what earns it (and how far along), or the month it's sold in
  function lockedLine(house, save) {
    if (!house.earn) return `Only sold in ${seasonName(house)}. Come back then! Once it's built, it's yours for good.`;
    const n = earnProgress(save, house.earn), far = n && n[0] ? ` (${n[0]} of ${n[1]} so far)` : '';
    return `Not for sale, at any price! ${house.how}${far}, and the crew builds it for you, free.`;
  }

  function render() {
    if (!sheet) return;
    const s = getSave(), now = housesOf(s), base = !!s.baseOwned, house = HOUSES_BY_ID[pick];
    coins.replaceChildren(smoothIcon('coin', 'hk-coin'), (s.coins ?? 0).toLocaleString());

    // the cards, by tier
    const keep = row.scrollLeft;
    row.replaceChildren();
    for (const t of TIERS) for (const x of HOUSES.filter(o => o.tier === t.id)) {
      const on = x.id === pick, [tag, kind] = tagOf(x, now, s), b = el('button', `hk-card${on ? ' on' : ''}${kind === 'lock' ? ' locked' : ''}`);
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
    hint();

    // the picked house: its name, where it comes from, and its one key
    const key = el('button', 'room-ok hk-go');
    key.type = 'button';
    const owned = now.owned.includes(pick), worn = now.paint[pick] || 0;
    let tip = '';
    if (!base) {
      if (FREE.includes(pick)) { key.textContent = `Buy · ${BASE_PRICE.toLocaleString()}`; key.onclick = buyFirst; tip = 'This lot\'s for sale, the Ancient Tree and the Starter Cottage with it! Pick one and its paint, and it\'s your Secret Base.'; }
      else { key.textContent = 'Lot first'; key.disabled = true; tip = 'Buy the lot first, the Ancient Tree with it. Then the crew can build any house on it!'; }
    } else if (pick === now.home && paint === worn) { key.textContent = 'Your home'; key.disabled = true; }
    else if (owned && paint === worn) { key.textContent = 'Move in'; key.onclick = moveHere; tip = house.earn ? `You earned this one, so it's built free. Moving in is free too, and so is moving back.` : 'It\'s yours already. Moving back is free!'; }
    else if (owned) { key.textContent = `Repaint · ${REPAINT_PRICE}`; key.onclick = repaintHere; tip = `${house.paints[paint].name}? A fresh coat is ${REPAINT_PRICE} PokéCoins${pick === now.home ? '' : ', and you move in'}.`; }
    else if (house.price == null || !onSale(house)) { key.textContent = house.earn ? 'Locked' : `${seasonName(house).slice(0, 3)} only`; key.disabled = true; tip = lockedLine(house, s); }
    else { key.textContent = `Buy · ${house.price.toLocaleString()}`; key.onclick = buyHere; }
    if (!base && house.earn && earnedOf(s).includes(pick)) tip = `You've earned this one! Buy the lot first, and the crew builds it free.`;
    // its name on a line of its own, the card's whole width (the user, 2026-10-23: long names were cut off), shrunk
    // only if even that is too narrow; under it the paint picked over its eight paints, the key beside them (the paints
    // scroll sideways where a narrow phone can't fit them)
    const title = el('b', 'hk-pick-title', house.name), name = el('span', 'hk-pick-name'), keys = el('div', 'hk-pick-row');
    name.append(el('span', 'hk-paint-name', house.paints[paint].name), paints);
    keys.append(name, key);
    pickRow.replaceChildren(title, keys);
    fitText(title, 12);

    // its paints: a round swatch each, two-tone like the house, and the picked one's name (the first paint job comes free
    // with a new house)
    const strip = paints.scrollLeft;
    paints.replaceChildren(...house.paints.map((p, i) => {
      const b = el('button', `hk-sw${i === paint ? ' on' : ''}`), [c1, c2] = dots(house, i);
      b.type = 'button';
      b.title = p.name;
      b.setAttribute('aria-label', `${p.name} paint`);
      b.setAttribute('aria-pressed', String(i === paint));
      b.style.background = `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)`;
      b.addEventListener('click', () => { if (paint === i) return; playSound('select'); paint = i; note = ''; render(); show(); });
      return b;
    }));
    paints.scrollLeft = strip;
    const sw = paints.children[paint];
    if (sw && (sw.offsetLeft < paints.scrollLeft || sw.offsetLeft + sw.offsetWidth > paints.scrollLeft + paints.clientWidth)) paints.scrollLeft = sw.offsetLeft - (paints.clientWidth - sw.offsetWidth) / 2;
    line.textContent = note || tip || house.blurb;
  }

  async function buyFirst() {
    const house = HOUSES_BY_ID[pick];
    if (!(await confirmDialog(`Make this lot your Secret Base for ${BASE_PRICE.toLocaleString()} PokéCoins, moving into the ${house.name} (${house.paints[paint].name})? The ${HOUSES_BY_ID[FREE.find(id => id !== pick)].name} comes with it too.`, `Buy (${BASE_PRICE.toLocaleString()})`))) return;
    if (!sheet || !(await buyBase(paint, pick))) return render();
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
  hint();
}
