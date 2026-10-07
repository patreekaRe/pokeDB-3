/* ============================================================
   bagdex.js  -  the Collection device's Relics and Items apps, made
   like its Pokédex app (js/pokedex.js; the user's call, 2026-10-06:
   "immersive too, Pokédex style"). A banner per group (relics by
   where they turn up, items by the games' Bag pockets), then the red
   handheld on that group: one thing at a time, blown up on a screen in
   the group's colours (the user's call, 2026-10-06: the painted places
   hid the item), its text typing itself out, and the group's every
   thing as slots to jump between. A thing not found yet is a dark
   silhouette and ???, like an unseen Pokémon. shelfApp() is that
   engine; the Achievements app (js/records.js) runs on it too.
   ============================================================ */

import { RELICS, ABILITIES, relicTerms } from './data/relics.js';
import { ITEMS } from './data/items.js';
import { TYPES } from './data/cards.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave } from './storage.js';
import { el, itemSprite, termKind } from './ui.js';
import { playCry, playSound } from './audio.js';
import { typeOut, finishTyping, progressBar, still, sceneImg } from './pokedex.js';

const isMedicine = (i) => i.map || i.effects.revive;

/* Each group: its banner and screen colours (`b1`/`b2`, like a biome's) and the line saying where its things are found. */
const GROUPS = {
  relics: [
    { id: 'ability', name: 'Abilities', sub: 'One per type', b1: '#ff9a5a', b2: '#9a3a1a',
      list: () => Object.values(ABILITIES).filter(a => a.id !== 'pressure' || getSave().unlocked.includes('mewtwo')),
      where: 'Every starter of its type has it from the start.' },
    { id: 'common', name: 'Common', sub: 'Everyday finds', b1: '#e86a5a', b2: '#8a2a22',
      list: () => RELICS.filter(r => !r.boss && !r.unique && r.rarity === 'common'), where: 'Found in treasure rooms, from Alphas and at the Poké Mart.' },
    { id: 'uncommon', name: 'Uncommon', sub: 'Great finds', b1: '#5a8ef0', b2: '#24448a',
      list: () => RELICS.filter(r => !r.boss && !r.unique && r.rarity === 'uncommon'), where: 'Found in treasure rooms, from Alphas and at the Poké Mart.' },
    { id: 'rare', name: 'Rare', sub: 'Ultra finds', b1: '#e8b830', b2: '#6a4a08',
      list: () => RELICS.filter(r => !r.boss && !r.unique && r.rarity === 'rare'), where: 'Found in treasure rooms, from Alphas and at the Poké Mart.' },
    { id: 'boss', name: 'Boss', sub: 'Power at a price', b1: '#d04848', b2: '#3a0c14',
      list: () => RELICS.filter(r => r.boss), where: 'Only offered after beating a biome\'s boss.' },
    { id: 'special', name: 'Special', sub: 'From the dojo', b1: '#c8a040', b2: '#4a2a10',
      list: () => RELICS.filter(r => r.unique), where: 'Won by beating Chad Master Kenmatta in his dojo.' },
  ],
  items: [
    { id: 'medicine', name: 'Medicine', sub: 'Heal up', b1: '#f0708a', b2: '#8a2440',
      list: () => ITEMS.filter(isMedicine), where: 'Dropped after fights and sold at the Poké Mart.' },
    { id: 'battle', name: 'Battle Items', sub: 'For the fight', b1: '#4aa8e0', b2: '#1c4a8a',
      list: () => ITEMS.filter(i => !i.only && !isMedicine(i)), where: 'Dropped after fights and sold at the Poké Mart.' },
    { id: 'type', name: 'Type Items', sub: 'One type each', b1: '#9a70e0', b2: '#3e2482',
      list: () => ITEMS.filter(i => i.only), where: 'Only turn up for a starter of their type.' },
  ],
};

const RARITY = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare' };
const STARTER_OF = { fire: 'charmander', grass: 'bulbasaur', water: 'squirtle', psychic: 'mewtwo' };
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- item sprites trimmed to what's drawn: their PNGs carry uneven empty margins, so they sat small and off-centre ---------- */

const trims = new Map();
function trimmedSrc(src) {
  if (!trims.has(src)) {
    trims.set(src, new Promise((done) => {
      const probe = new Image();
      probe.onload = () => {
        try {
          const { width: w, height: h } = probe;
          const c = document.createElement('canvas');
          c.width = w; c.height = h;
          const g = c.getContext('2d');
          g.drawImage(probe, 0, 0);
          const px = g.getImageData(0, 0, w, h).data;
          let x0 = w, y0 = h, x1 = -1, y1 = -1;
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            if (px[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          }
          if (x1 < 0) return done(null);
          const bw = x1 - x0 + 1, bh = y1 - y0 + 1, side = Math.max(bw, bh);
          const out = document.createElement('canvas');
          out.width = out.height = side;
          out.getContext('2d').drawImage(c, x0, y0, bw, bh, Math.floor((side - bw) / 2), Math.floor((side - bh) / 2), bw, bh);
          done(out.toDataURL());
        } catch { done(null); }
      };
      probe.onerror = () => done(null);
      probe.src = src;
    }));
  }
  return trims.get(src);
}

/** itemSprite(), its picture trimmed to fill its box. */
export function thingArt(thing, cls) {
  const box = itemSprite(thing, cls);
  const img = box.querySelector('img');
  if (img) trimmedSrc(img.src).then(url => { if (url) img.src = url; });
  return box;
}

/** A line of the device's LCD text that types itself out. */
export const typed = (cls, text) => el('div', `pdx-lcd pdx-text pdx-type${cls ? ` ${cls}` : ''}`, text);

/** A type's chip, top right of the screen. */
export const typeChip = (type) => el('span', `index-only type-${type}`, `${TYPES[type].icon} ${TYPES[type].label}`);

/* ---------- the engine ---------- */

/** A banner-and-handheld app for the Collection device (js/device.js). `spec`:
    groups      [{ id, name, sub, b1, b2, list(), mask?() }]: mask() gives a { name, sub } to show while the group is a secret
    known(g, t) whether the thing counts as found (lit up, counted)
    no(g, t)    the nameplate's number
    art(g, t, known, where)  its picture, `where` 'banner' | 'slot'
    screen(g, t, known)      the screen's nodes, one with the class `bdx-art` (it slides)
    screenCls(g, t, known)   more classes for the screen
    lines(g, t, known)       the LCD lines under the screen (`typed()` ones type out)
    label(g, t, known)       the nameplate's name and the slot's label
    tally(g, done)           the tally's words
    doneSub                  the banner's sub once all are found
    onShow(g, t, known)      after stepping to a thing (a cry)
    count(g, things)         a plain count for the banner and tally, for a shelf where nothing is ever "not found" (the books)
    direct                   no banners: the device opens straight on the first group, and B leaves the app
    sheet(g, t, known)       the thing's full page (nodes, or null for none): a tap on the screen or A slides it over the device
    press(g, t, known)       what A does instead of opening the sheet
    score(g, things)         [n, of] for the banner, the tally and "complete" instead of the known count (the Safari's caught)
    medal(g)                 a medal for the banner's corner
    bannerArt(g, things)     the banner's own art instead of its first three things
    slotCls(g, t, known)     more classes for a slot
    foot(g)                  nodes under the tally (a page's prize)
    top()                    a node above the banners (a window's own title bar)
    empty(g)                 a group with nothing in it still gets a banner, saying this, that doesn't open (the leaderboards)
    A group's `scene` (a biome or Safari area) paints its banner with that place, as the Pokédex's are. */
export function shelfApp(spec) {
  const groups = spec.groups;
  let host, list, stage, sheet;
  let view = 'list', group = null, at = 0, busy = false;

  function renderList() {
    const banners = groups.map(g => {
      const things = g.list();
      if (!things.length) return spec.empty ? emptyBanner(g) : null;
      const [n, of] = scoreOf(g, things);
      const counted = spec.count?.(g, things);
      const all = !counted && n === of;
      const mask = g.mask?.();
      const b = el('button', `pdx-banner bdx-banner${all ? ' complete' : ''}${mask ? ' masked' : ''}`);
      b.type = 'button';
      b.dataset.group = g.id;
      b.style.setProperty('--b1', g.b1);
      b.style.setProperty('--b2', g.b2);
      if (g.scene) b.append(sceneImg(still(g.scene, 150, 46, 0.56), 'pdx-banner-art'), el('span', 'pdx-banner-shade'));
      b.append(el('span', 'pdx-stripe'),
        el('strong', 'pdx-banner-name', mask?.name ?? g.name), el('span', 'pdx-banner-sub', mask?.sub ?? (all ? spec.doneSub : g.sub)),
        el('span', 'pdx-banner-count', counted ?? `${n} / ${of}`));
      if (!counted) b.append(progressBar(n, of));
      if (spec.medal) b.append(spec.medal(g));
      if (spec.bannerArt) b.append(spec.bannerArt(g, things));
      else {
        const shelf = el('span', 'pdx-banner-mons bdx-banner-things');
        for (const t of things.slice(0, 3)) shelf.append(spec.art(g, t, spec.known(g, t), 'banner'));
        b.append(shelf);
      }
      b.addEventListener('click', () => openGroup(g, b));
      return b;
    }).filter(Boolean);
    const wrap = el('div', 'pdx-banners');
    wrap.append(...banners);
    list.replaceChildren(...(spec.top ? [spec.top()] : []), wrap);
  }

  /** A group with nothing in it yet, as a banner that says so and doesn't open. */
  function emptyBanner(g) {
    const b = el('div', 'pdx-banner bdx-banner empty');
    b.style.setProperty('--b1', g.b1);
    b.style.setProperty('--b2', g.b2);
    if (g.scene) b.append(sceneImg(still(g.scene, 150, 46, 0.56), 'pdx-banner-art'), el('span', 'pdx-banner-shade'));
    b.append(el('span', 'pdx-stripe'), el('strong', 'pdx-banner-name', g.name), el('span', 'pdx-banner-sub', spec.empty(g)));
    return b;
  }

  const scoreOf = (g, things) => spec.score?.(g, things) ?? [things.filter(t => spec.known(g, t)).length, things.length];

  function renderPage() {
    const dev = el('div', `pdx-device bdx-device bdx-${group.id}${spec.deviceCls ? ` ${spec.deviceCls}` : ''}`);
    dev.style.setProperty('--b1', group.b1);
    dev.style.setProperty('--b2', group.b2);
    const body = el('div', 'pdx-body');
    body.addEventListener('click', finishTyping);
    const controls = el('div', 'pdx-controls');
    const step = (dir, label, glyph) => {
      const b = el('button', 'pdx-round', glyph);
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.addEventListener('click', () => show(at + dir, dir));
      return b;
    };
    controls.append(step(-1, 'Previous', '◀'), el('span', 'pdx-lcd pdx-counter'), step(1, 'Next', '▶'));
    dev.append(body, controls);
    stage.replaceChildren(dev);
    fill(0);
  }

  function fill(dir) {
    const things = group.list();
    const thing = things[at];
    const known = spec.known(group, thing);
    const dev = stage.querySelector('.pdx-device');
    const body = dev.querySelector('.pdx-body');
    const old = body.querySelector('.pdx-screen');

    const nameplate = el('div', 'pdx-lcd pdx-nameplate');
    nameplate.append(el('span', 'pdx-name', spec.label(group, thing, known)), el('span', 'pdx-no', spec.no(group, thing)));

    const extra = spec.screenCls?.(group, thing, known);
    const screen = el('div', `pdx-screen bdx-screen${known ? '' : ' unseen'}${extra ? ` ${extra}` : ''}`);
    screen.append(el('span', 'pdx-stripe bdx-dots'), ...spec.screen(group, thing, known));
    swipe(screen);
    if (spec.sheet?.(group, thing, known)) {
      screen.classList.add('opens');
      screen.addEventListener('click', () => { if (!swiped) openSheet(); });
    }

    const slots = el('div', 'pdx-slots bdx-slots');
    things.forEach((t, i) => {
      const k = spec.known(group, t);
      const more = spec.slotCls?.(group, t, k);
      const s = el('button', `pdx-slot bdx-slot${i === at ? ' on' : ''}${k ? '' : ' unseen'}${more ? ` ${more}` : ''}`);
      s.type = 'button';
      s.setAttribute('aria-label', spec.label(group, t, k));
      s.append(spec.art(group, t, k, 'slot'));
      s.addEventListener('click', () => show(i, Math.sign(i - at)));
      slots.append(s);
    });
    const [n, of] = scoreOf(group, things);
    const counted = spec.count?.(group, things);
    const tally = el('div', `pdx-lcd bdx-tally${!counted && n === of ? ' done' : ''}`);
    tally.append(el('span', '', spec.tally(group, n === of)), el('b', '', counted ?? `${n}/${of}`));
    if (!counted) tally.append(progressBar(n, of));
    const lines = spec.lines(group, thing, known);
    if (screen.classList.contains('opens')) {
      const open = el('button', 'pdx-lcd bdx-open', `${spec.sheetLabel ?? 'Full record'} ▶`);
      open.type = 'button';
      open.addEventListener('click', openSheet);
      lines.push(open);
    }
    body.replaceChildren(nameplate, screen, ...lines, slots, tally, ...(spec.foot?.(group) ?? []));
    dev.querySelector('.pdx-counter').textContent = `${at + 1} / ${things.length}`;

    typeOut([...body.querySelectorAll('.pdx-type')]);
    if (dir && old && !calm()) slide(old, screen, dir);
  }

  /** The old thing slides off the screen as the new one slides on. */
  function slide(old, screen, dir) {
    const ease = { duration: 280, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)' };
    const was = old.querySelector('.bdx-art'), now = screen.querySelector('.bdx-art');
    if (!was || !now) return;
    const ghost = was.cloneNode(true);
    ghost.classList.add('pdx-ghost');
    if (old.classList.contains('unseen')) ghost.classList.add('unseen');
    screen.append(ghost);
    // items are centred with translate: -50% -50%, so the slide must start and end there or they jump
    const [bx, by] = (getComputedStyle(now).translate === 'none' ? '0px 0px' : getComputedStyle(now).translate).split(' ');
    const pos = (dx) => `calc(${bx} + ${dx}%) ${by || '0px'}`;
    ghost.animate([{ translate: pos(0), opacity: 1 }, { translate: pos(-dir * 120), opacity: 0 }], ease).finished.then(() => ghost.remove(), () => ghost.remove());
    now.animate([{ translate: pos(dir * 120), opacity: 0 }, { translate: pos(0), opacity: 1 }], ease);
  }

  let swiped = false;   // a swipe's pointerup is followed by a click: it mustn't open the sheet too
  function swipe(node) {
    let x0 = null;
    node.addEventListener('pointerdown', (e) => { x0 = e.clientX; swiped = false; });
    node.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) { swiped = true; show(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }
    });
    node.addEventListener('pointercancel', () => { x0 = null; });
  }

  /* the thing's full page, slid in over the device; B (or its own back button) slides it away */
  function openSheet() {
    const thing = group.list()[at];
    const nodes = spec.sheet?.(group, thing, spec.known(group, thing));
    if (busy || sheet || !nodes) return;
    playSound('confirm');
    sheet = el('div', 'pdx-stage bdx-sheet');
    const back = el('button', 'pdx-lcd bdx-sheet-back', '◀ Back');
    back.type = 'button';
    back.addEventListener('click', closeSheet);
    sheet.append(back, ...nodes);
    stage.inert = true;
    host.append(sheet);
    if (!calm()) sheet.animate([{ translate: '100% 0' }, { translate: '0 0' }], { duration: 260, easing: EASE });
  }

  function closeSheet() {
    if (!sheet) return;
    const was = sheet;
    sheet = null;
    stage.inert = false;
    playSound('cancel');
    if (calm()) { was.remove(); return; }
    settle(was.animate([{ translate: '0 0' }, { translate: '100% 0' }], { duration: 220, easing: EASE, fill: 'forwards' })).then(() => was.remove());
  }

  function show(i, dir = 0) {
    if (busy || sheet) return;
    const things = group.list();
    at = (i + things.length) % things.length;
    fill(dir);
    spec.onShow?.(group, things[at], spec.known(group, things[at]));
  }

  /* opening and shutting: the banner zooms up into the device and its screen flickers on, and back */
  const EASE = 'cubic-bezier(0.2, 0.8, 0.25, 1)';
  const settle = (anim) => anim.finished.catch(() => {});
  function overBanner(dev, box) {
    const d = dev.getBoundingClientRect();
    const h = Math.max(1, Math.min(d.height, innerHeight - Math.max(0, d.top)));
    return `translate(${box.left - d.left}px, ${box.top - d.top}px) scale(${box.width / d.width}, ${box.height / h})`;
  }

  async function openGroup(g, from) {
    if (busy) return;
    group = g;
    at = Math.max(0, g.list().findIndex(t => spec.known(g, t)));
    view = 'page';
    list.inert = true;
    stage.hidden = false;
    stage.scrollTop = 0;
    renderPage();
    const dev = stage.querySelector('.pdx-device');
    playSound('dex-on');
    if (calm()) { dev.classList.add('powered'); return; }
    busy = true;
    stage.classList.add('zooming');
    const fade = list.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, fill: 'forwards' });
    await settle(dev.animate([{ transformOrigin: '0 0', transform: overBanner(dev, from.getBoundingClientRect()), opacity: 0.6 },
      { transformOrigin: '0 0', transform: 'none', opacity: 1 }], { duration: 360, easing: EASE }));
    stage.classList.remove('zooming');
    fade.cancel();
    dev.classList.add('powered');
    dev.querySelector('.pdx-screen')?.classList.add('power-on');
    busy = false;
  }

  async function backToList() {
    if (busy || view === 'list') return;
    const dev = stage.querySelector('.pdx-device');
    playSound('dex-off');
    if (!calm() && dev) {
      busy = true;
      stage.scrollTop = 0;
      const box = list.querySelector(`.bdx-banner[data-group="${group.id}"]`)?.getBoundingClientRect();
      stage.classList.add('zooming');
      list.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      await settle(box && box.bottom > 0 && box.top < innerHeight
        ? dev.animate([{ transformOrigin: '0 0', transform: 'none', opacity: 1 }, { transformOrigin: '0 0', transform: overBanner(dev, box), opacity: 0.5 }], { duration: 300, easing: EASE, fill: 'forwards' })
        : dev.animate([{ opacity: 1 }, { transform: 'scale(0.94) translateY(12px)', opacity: 0 }], { duration: 240, easing: EASE, fill: 'forwards' }));
      stage.classList.remove('zooming');
      busy = false;
    }
    view = 'list';
    stage.hidden = true;
    list.inert = false;
    renderList();
  }

  return {
    /** `open`: a group's id to open straight onto (a Safari run's own area), else the banners. */
    mount(panel, open) {
      host = panel;
      list = el('div', 'pdx-list');
      stage = el('div', 'pdx-stage');
      stage.hidden = true;
      host.append(list, stage);
      view = 'list';
      busy = false;
      sheet = null;
      const start = groups.find(g => g.id === open && g.list().length);
      if (!spec.direct && !start) { renderList(); return; }
      group = start ?? groups[0];
      at = start ? Math.max(0, group.list().findIndex(t => spec.known(group, t))) : 0;
      view = 'page';
      if (start) { renderList(); list.inert = true; }
      else list.hidden = true;
      stage.hidden = false;
      renderPage();
      stage.querySelector('.pdx-device').classList.add('powered');
      stage.querySelector('.pdx-screen')?.classList.add('power-on');
      const first = group.list()[at];
      spec.onShow?.(group, first, start ? spec.known(group, first) : true);
    },
    back() {
      if (busy || spec.busy?.()) return true;
      if (sheet) { closeSheet(); return true; }
      if (view === 'list' || spec.direct) return false;
      backToList();
      return true;
    },
    key(e) {
      if (spec.busy?.()) return true;
      const step = view === 'page' && !sheet && { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step) return false;
      show(at + step, step);
      return true;
    },
    /** A: the sheet, or the spec's own `press`. */
    press() {
      if (busy || spec.busy?.() || view !== 'page' || sheet) return;
      const thing = group.list()[at];
      if (spec.press) spec.press(group, thing, spec.known(group, thing));
      else openSheet();
    },
    unmount() { busy = false; sheet = null; },
  };
}

/* ---------- Relics and Items ---------- */

/** An Ability's starter: the type's first free starter (Mewtwo for Psychic), standing on the screen. */
function starterImg(ability, cls) {
  const type = Object.keys(ABILITIES).find(t => ABILITIES[t] === ability);
  const img = el('img', `pixel ${cls}`);
  img.src = spriteUrl(STARTERS_BY_ID[STARTER_OF[type]], 'front', 0);
  img.alt = '';
  img.draggable = false;
  img.dataset.type = type;
  return img;
}

/** The Relics ('relics') or Items ('items') app for the Collection device (js/device.js). */
export function bagApp(kind) {
  const all = kind === 'relics' ? RELICS : ITEMS;
  return shelfApp({
    groups: GROUPS[kind],
    known: (g, t) => g.id === 'ability' || getSave().seen[kind].includes(t.id),
    no: (g, t) => (all.includes(t) ? `No.${String(all.indexOf(t) + 1).padStart(3, '0')}` : 'Ability'),
    label: (g, t, known) => (known ? t.name : '???'),
    art: (g, t, known, where) => {
      if (g.id === 'ability') return starterImg(t, where === 'banner' ? 'bdx-banner-mon' : 'pdx-slot-mon');
      return thingArt(t, where === 'banner' ? `bdx-banner-thing${known ? '' : ' unseen'}` : 'bdx-slot-thing');
    },
    screenCls: (g, t) => (t.boss ? 'boss' : ''),
    screen(g, t, known) {
      if (g.id === 'ability') {
        const mon = starterImg(t, 'pdx-mon bdx-art');
        return [el('span', 'pdx-pad'), mon, typeChip(mon.dataset.type)];
      }
      const nodes = [el('span', 'bdx-glow'), thingArt(t, 'bdx-thing bdx-art')];
      const tag = t.boss ? 'Boss' : t.unique ? 'Special' : RARITY[t.rarity];
      if (tag) nodes.push(el('span', `pdx-role bdx-rarity rarity-${t.boss ? 'boss' : t.unique ? 'special' : t.rarity}`, tag));
      if (known && t.only) nodes.push(typeChip(t.only));
      return nodes;
    },
    lines(g, t, known) {
      if (!known) return [typed('muted', 'Not found yet.'), typed('muted', g.where)];
      const lines = [typed('', t.text)];
      const terms = relicTerms(t);
      if (terms.length) {
        const box = el('div', 'pdx-lcd bdx-terms');
        for (const [label, text] of terms) {
          const line = el('div', 'bdx-term');
          line.append(el('b', `term-${termKind(label)}`, label), ` ${text}`);
          box.append(line);
        }
        lines.push(box);
      }
      return lines;
    },
    tally: (g, done) => (done ? `★ Every ${g.id === 'ability' ? 'Ability' : `${g.name.toLowerCase()} ${kind === 'relics' ? 'relic' : 'item'}`} found` : 'Found'),
    doneSub: 'All found!',
    onShow: (g, t) => { if (g.id === 'ability') playCry(STARTER_OF[Object.keys(ABILITIES).find(k => ABILITIES[k] === t)]); },
  });
}
