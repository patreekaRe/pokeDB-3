/* ============================================================
   berrybooth.js  -  the Berry Booth by the Clearing's gate (2026-10-23, the user's idea): a digital kiosk whose window
   is the Safari lobby's Pokédex device (`.tower-lobby`). It is the one place to pack a run's Berry Pouch and run kit
   from what Kurt's Workshop keeps (Prepare only shows them, js/select.js's renderBring()). The window shows the loadout
   (the held slot, the pouch's, the kit's; tap one to take it out), and the keys are its apps sliding over the LCD:
   Pouch, Kit and Guide, a few steps played on the window that open by themselves the first time. The loadout is saved
   (`save.loadout`, held to what's kept by fitLoadout()), so it stays packed run after run. No perks (the user's call):
   still POUCH berries, one a biome, and one kit item.
   ============================================================ */

import { workshopOf, packable, fitLoadout, RECIPES_BY_ID } from './data/workshop.js';
import { HELD_BY_ID, POUCH } from './data/held.js';
import { getSave, updateSave } from './storage.js';
import { playSound } from './audio.js';
import { bootDevice } from './device-boot.js';
import { smoothIcon } from './smooth-icons.js';
import { $, el, openDialog, closeDialog, itemSprite } from './ui.js';

let lo = { berries: [], item: null };   // the loadout as packed here: held berry recipe ids (the first held), a kit recipe id
let onShut = null;
let ready = false;

const kept = (kind) => packable(workshopOf(getSave())).filter(o => o.recipe.kind === kind);
const left = (o) => o.n - lo.berries.filter(id => id === o.recipe.id).length;
const berryOf = (id) => HELD_BY_ID[RECIPES_BY_ID[id]?.makes];
const kitArt = (id) => itemSprite({ id: RECIPES_BY_ID[id].sprite, icon: '' }, 'bb-ico');

function keep() {
  updateSave(d => { d.loadout = { ...(d.loadout || {}), berries: [...lo.berries], item: lo.item }; });
}

function init() {
  ready = true;
  for (const node of document.querySelectorAll('#booth-dialog [data-icon]')) node.append(smoothIcon(node.dataset.icon));
  $('bb-done').addEventListener('click', () => {
    if (app?.def.a) { app.def.a(); return; }
    playSound('confirm');
    closeDialog('booth-dialog');
  });
  $('bb-close').addEventListener('click', back);
  for (const id of Object.keys(APPS)) $(id).addEventListener('click', () => (app?.key === id ? back() : openApp(id)));
  const dialog = $('booth-dialog');
  dialog.addEventListener('cancel', (e) => { if (app) { e.preventDefault(); back(); } });
  dialog.addEventListener('close', () => { closeApp(true); onShut?.(); onShut = null; });
}

/** The booth's device, `then` once it's shut (the Clearing's "!" follows the loadout). */
export function openBerryBooth(then) {
  if (!ready) init();
  onShut = then;
  lo = fitLoadout(getSave().loadout, workshopOf(getSave()));
  closeApp(true);
  render();
  openDialog('booth-dialog');
  const win = $('bb-top');
  win.classList.remove('power-on');
  bootDevice($('bb-page'), { below: $('bb-page').querySelector('.tdev-lid'), screen: win, onScreen: () => { void win.offsetWidth; win.classList.add('power-on'); } });
  if (!getSave().loadout?.guided) {
    updateSave(d => { d.loadout = { ...(d.loadout || {}), guided: true }; });
    openApp('bb-guide');
  }
}

/* ---------- the window: the loadout ---------- */

function slot(label, art, cls, onTake, name) {
  const cell = el('div', `bb-cell ${cls}`), b = el('button', `bb-slot${art ? ' full' : ''}`);
  b.type = 'button';
  b.disabled = !art || !onTake;
  b.setAttribute('aria-label', art ? `${label}: ${name}${onTake ? ', tap to take it out' : ''}` : `${label}: empty`);
  if (art) b.append(art);
  if (art && onTake) b.addEventListener('click', onTake);
  cell.append(b, el('small', '', label));
  return cell;
}

/** The loadout in the window: `show` a guide step's made-up one ({ berries, item, eaten, biome, swap }), else the real one. */
function paintLoad(show) {
  const live = !show, at = show || lo, from = show?.biome || 1;
  const cells = Array.from({ length: POUCH }, (_, i) => {
    const id = at.berries[i], h = berryOf(id);
    const label = i === 0 ? 'Held' : `Biome ${from + i}`;
    const take = live && h ? () => { lo.berries.splice(i, 1); playSound('cancel'); keep(); render(); } : null;
    const art = h ? itemSprite(h, 'bb-ico') : null;
    return slot(label, art, `${i === 0 ? 'held' : 'pouch'}${i === 0 && show?.eaten ? ' eaten' : ''}${show?.swap && i < 2 ? ' swap' : ''}`, take, h?.name);
  });
  const kit = RECIPES_BY_ID[at.item];
  const takeKit = live && kit ? () => { lo.item = null; playSound('cancel'); keep(); render(); } : null;
  const row = el('div', 'bb-slots');
  row.append(...cells, el('span', 'bb-split'), slot('Kit', kit ? kitArt(at.item) : null, 'kit', takeKit, kit?.name));
  $('bb-load').replaceChildren(row);
  $('bb-caption').textContent = show ? show.caption
    : !lo.berries.length && !lo.item ? 'Nothing packed yet'
    : `${lo.berries.length}/${POUCH} berries · ${lo.item ? 'kit packed' : 'no kit'}`;
}

/** The LCD at home: what's kept, and how the pouch works in three lines. */
function paintBase() {
  const berries = kept('held'), kits = kept('kit');
  const n = (list) => list.reduce((s, o) => s + o.n, 0);
  const stock = el('p', 'bb-stock', berries.length || kits.length
    ? `Kurt keeps for you: ${n(berries)} held berr${n(berries) === 1 ? 'y' : 'ies'}, ${n(kits)} run kit item${n(kits) === 1 ? '' : 's'}.`
    : 'Nothing kept yet. Kurt\'s Workshop turns your berries into held berries and run kit to pack here.');
  const tips = el('ul', 'bb-tips');
  for (const [icon, text] of [
    ['🫐', 'The first berry is held as you set out, eaten by itself when it\'s needed.'],
    ['👝', `The rest wait in the Berry Pouch (${POUCH} berries in all): one held berry a biome, put on from the map's Bag.`],
    ['🎒', 'One run kit item starts the run in your Bag.'],
    ['📌', 'What you pack stays packed for the next run, while Kurt still keeps it.'],
  ]) { const li = el('li'); li.append(el('span', 'bb-tip-icon', icon), el('span', '', text)); tips.append(li); }
  $('bb-base').replaceChildren(stock, tips);
}

function render() {
  if (app?.key !== 'bb-guide') paintLoad();
  paintBase();
  app?.def.app.refresh?.(app.panel);
}

/* ---------- the apps ---------- */

function emptyNote(text) { return el('p', 'bb-empty', text); }

const pouchApp = {
  mount(panel) { this.refresh(panel); },
  refresh(panel) {
    const berries = kept('held');
    const head = el('p', 'bb-app-head', lo.berries.length >= POUCH ? 'The pouch is full. Tap a slot above to take one out.'
      : lo.berries.length ? `Tap a berry for biome ${lo.berries.length + 1}.` : 'Tap a berry: the first one is held.');
    if (!berries.length) { panel.replaceChildren(head, emptyNote('No held berries kept. Grow berries in your backyard, then take them to Kurt\'s Workshop.')); return; }
    panel.replaceChildren(head, ...berries.map(o => {
      const h = HELD_BY_ID[o.recipe.makes], n = left(o), row = el('button', 'bb-row');
      row.type = 'button';
      row.disabled = !n || lo.berries.length >= POUCH;
      const text = el('span', 'bb-row-text');
      text.append(el('b', '', h.name), el('small', '', h.short));
      row.append(itemSprite(h, 'bb-ico'), text, el('span', 'bb-count', `×${n}`));
      row.addEventListener('click', () => {
        if (lo.berries.length >= POUCH || !left(o)) return;
        lo.berries.push(o.recipe.id);
        playSound('stick', 'confirm');
        keep();
        render();
      });
      return row;
    }));
  },
  unmount() {},
  back: () => false,
};

const kitApp = {
  mount(panel) { this.refresh(panel); },
  refresh(panel) {
    const kits = kept('kit');
    const head = el('p', 'bb-app-head', 'One item, in your Bag from the start. Tap it again to leave it.');
    if (!kits.length) { panel.replaceChildren(head, emptyNote('No run kit kept. Kurt makes Potions and more from berries and materials.')); return; }
    panel.replaceChildren(head, ...kits.map(o => {
      const r = o.recipe, row = el('button', `bb-row${lo.item === r.id ? ' on' : ''}`);
      row.type = 'button';
      row.setAttribute('aria-pressed', String(lo.item === r.id));
      const text = el('span', 'bb-row-text');
      text.append(el('b', '', r.name), el('small', '', r.text));
      row.append(kitArt(r.id), text, el('span', 'bb-count', `×${o.n}`));
      row.addEventListener('click', () => {
        lo.item = lo.item === r.id ? null : r.id;
        playSound(lo.item ? 'stick' : 'cancel', 'confirm');
        keep();
        render();
      });
      return row;
    }));
  },
  unmount() {},
  back: () => false,
};

// the guide's steps: its words on the LCD, a made-up loadout played on the window
const O = 'held-oran', P = 'held-pecha', L = 'held-lum';
const STEPS = [
  { text: 'Welcome to the Berry Booth! Pack your berries and one item here before you set out.', show: { berries: [], caption: 'Your loadout' } },
  { text: 'Your Pokémon holds the first berry. It eats it by itself, once, when it\'s needed: low on HP, a big hit, a status card.', show: { berries: [O], caption: 'Held as you set out' } },
  { text: `The rest wait in the Berry Pouch, ${POUCH} berries in all: one for each biome.`, show: { berries: [O, P, L], caption: 'One berry a biome' } },
  { text: 'Pick one run kit item. It starts the run in your Bag.', show: { berries: [O, P, L], item: 'kit-potion', caption: 'One kit item' } },
  { text: 'On the map, open the Bag\'s Items and tap Hold on a pouch berry. While the held one\'s uneaten, that\'s a swap.', show: { berries: [P, O, L], item: 'kit-potion', swap: true, caption: 'Bag: Hold swaps them' } },
  { text: 'Once the held berry is eaten in a fight, it\'s gone...', show: { berries: [P, O, L], item: 'kit-potion', eaten: true, caption: 'Eaten!' } },
  { text: '...and the next one goes on from the next biome: open the Bag and tap Hold again.', show: { berries: [O, L], item: 'kit-potion', biome: 2, caption: 'Biome 2: the next one on' } },
  { text: 'What you pack comes out of Kurt\'s stock as the run begins, and stays packed for the next one. Prepare shows what you\'re bringing.', show: { berries: [], caption: 'Now pack yours!' } },
];
let step = 0;
const guideApp = {
  mount(panel) { step = 0; this.panel = panel; this.draw(); },
  draw() {
    const s = STEPS[step], dots = el('p', 'bb-steps', STEPS.map((_, i) => (i === step ? '●' : '○')).join(' '));
    this.panel.replaceChildren(el('p', 'bb-guide-text', s.text), dots);
    paintLoad({ item: null, ...s.show });
    if (app) dressKeys();
  },
  next() {
    playSound('confirm');
    if (step < STEPS.length - 1) { step++; this.draw(); return; }
    closeApp();
  },
  unmount() { this.panel = null; },
  back() { if (!step) return false; step--; playSound('cancel'); this.draw(); return true; },
};

const APPS = {
  'bb-pouch': { name: 'Berry Pouch', app: pouchApp },
  'bb-kit': { name: 'Run kit', app: kitApp },
  'bb-guide': { name: 'Guide', app: guideApp, a: () => guideApp.next(), label: () => (step < STEPS.length - 1 ? 'Next' : 'Got it') },
};
const SLIDE = { duration: 260, easing: 'cubic-bezier(0.25, 0.8, 0.3, 1)' };
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let app = null;      // the open app: { key, def, panel }
let sliding = false;

function openApp(key) {
  if (sliding) return;
  if (app) closeApp(true);
  const def = APPS[key];
  playSound('confirm');
  const panel = el('div', 'cdev-app sp-app bb-app');
  $('bb-glass').append(panel);
  app = { key, def, panel };
  def.app.mount(panel);
  dressKeys();
  if (calm()) return;
  sliding = true;
  $('bb-base').animate([{ translate: '0 0', opacity: 1 }, { translate: '-30% 0', opacity: 0 }], SLIDE);
  panel.animate([{ translate: '100% 0' }, { translate: '0 0' }], SLIDE).finished.catch(() => {}).then(() => { sliding = false; });
}

function closeApp(now = false) {
  if (!app) return;
  const { def, panel } = app;
  app = null;
  dressKeys();
  paintLoad();
  const done = () => { def.app.unmount(); panel.remove(); };
  if (now || calm() || !$('booth-dialog').open) { done(); return; }
  sliding = true;
  $('bb-base').animate([{ translate: '-30% 0', opacity: 0 }, { translate: '0 0', opacity: 1 }], SLIDE);
  panel.animate([{ translate: '0 0' }, { translate: '100% 0' }], { ...SLIDE, fill: 'forwards' }).finished.catch(() => {}).then(() => { done(); sliding = false; });
}

/** B: the app steps back itself first (the guide a step), then home to the booth; there it shuts. */
function back() {
  if (sliding) return;
  if (app) {
    if (app.def.app.back()) return;
    playSound('cancel');
    closeApp();
    return;
  }
  playSound('cancel', 'confirm');
  closeDialog('booth-dialog');
}

function dressKeys() {
  for (const id of Object.keys(APPS)) {
    $(id).classList.toggle('on', app?.key === id);
    $(id).setAttribute('aria-pressed', String(app?.key === id));
  }
  $('bb-title').textContent = app ? app.def.name : 'Berry Booth';
  $('bb-base').inert = !!app;
  $('bb-done-label').textContent = app?.def.label?.() ?? 'Done';
}
