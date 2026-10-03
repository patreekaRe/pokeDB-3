/* ============================================================
   safaridex.js  -  the Safari Pokédex window (roadmap: "Post-v1.0:
   the Safari Zone daily run", phase 3).

   A page per Safari area (data/safari.js SAFARI_DEX_PAGES): its wilds,
   then its rare spawns. Like the main Pokédex, an entry is a dark ???
   silhouette until met in a Safari run (save.safariDex.seen), then its
   picture and name, and gets a Poké Ball mark once caught; a caught
   entry shows its signature card. Opened from the Collection, the main
   Pokédex's Safari tab, and the Poké Ball menu during a Safari run.
   ============================================================ */

import { ENEMY_DEFS } from './data/enemies.js';
import { TYPES, CARDS_BY_ID, SIGNATURE_FOR } from './data/cards.js';
import { SAFARI_DEX_PAGES, SAFARI_NUMBER, SAFARI_ROSTER, SAFARI_AREA_COINS, RARE_BOOST, safariHomes, safariProgress } from './data/safari.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave } from './storage.js';
import { $, el, openDialog, makeCard } from './ui.js';
import { tipAt } from './tips.js';

const AREA_ICON = { meadow: '🌼', forest: '🌲', wetland: '💧', marsh: '🍄', peak: '🏔️', desert: '🌵' };

let page = 0;

const dexNo = (id) => `No.${String(SAFARI_NUMBER[id]).padStart(3, '0')}`;
const record = () => {
  const dex = getSave().safariDex;
  const caught = new Set(dex.caught);
  return { dex, caught, seen: new Set([...dex.seen, ...dex.caught]) };
};

function entryTile(id, rare, { seen, caught }) {
  const def = ENEMY_DEFS[id];
  const known = seen.has(id);
  const got = caught.has(id);
  const tile = el('button', `dex-entry${known ? '' : ' locked'}${got ? ' defeated safari-caught' : ''}${rare ? ' safari-rare' : ''}`);
  tile.type = 'button';
  const img = el('img', 'pixel dex-sprite');
  img.src = def.image;
  img.alt = '';
  img.draggable = false;
  tile.append(el('span', 'dex-no', dexNo(id)), img, el('strong', 'dex-name', known ? def.name : '???'));
  if (got) tile.append(el('span', 'dex-mark pokeball'));
  if (rare) tile.append(el('span', 'safari-rare-mark', '✦'));
  tile.title = !known ? `Not seen yet.${rare ? ' A rare spawn: look for a gold ✦ on the map.' : ''}`
    : got ? `${def.name}: caught. Tap for its entry` : `${def.name}: seen, not caught yet. Tap for its entry`;
  if (!known) tile.setAttribute('aria-disabled', 'true');
  tile.addEventListener('click', () => (known ? openEntry(id, tile) : tipAt(tile, tile.dataset.tip || tile.title)));
  return tile;
}

function areaBox(p, rec) {
  const { caught, seen, total } = safariProgress(p.ids, rec.dex);
  const earned = (rec.dex.done ?? []).includes(p.area);   // stays earned when a later batch adds Pokémon to the page
  const box = el('div', `dex-perk safari-area-box${earned ? ' earned' : ''}`);
  const text = el('div', 'dex-perk-text');
  const bar = el('div', 'ach-bar dex-bar');
  const fill = el('div', 'ach-fill');
  fill.style.width = `${(caught / total) * 100}%`;
  bar.append(fill);
  text.append(el('strong', '', `${earned ? '' : '🔒 '}${p.name}${caught === total ? ' complete!' : ''}`),
    el('span', '', `Reward: rare spawns ${RARE_BOOST === 2 ? 'twice' : `${RARE_BOOST}x`} as often here, on replays.`),
    el('small', '', earned ? `Earned, with 💰 ${SAFARI_AREA_COINS}. ${caught} caught · ${seen} seen of ${total}`
      : `Catch all ${total} to earn it, plus 💰 ${SAFARI_AREA_COINS}. ${caught} caught · ${seen} seen`), bar);
  box.append(el('span', 'dex-perk-icon', AREA_ICON[p.area] ?? '🌿'), text, el('b', 'dex-perk-count', `${earned ? '✦' : ''}${caught}/${total}`));
  box.title = `${p.name}: ${caught} of ${total} caught, ${seen} seen. Its days come round in the Safari Zone's daily run.`;
  return box;
}

/** The whole Safari Pokédex's prize, on every page: Rayquaza, a silhouette and never named until it's unlocked. */
function prizeBox(rec) {
  const ray = STARTERS_BY_ID.rayquaza;
  const won = !!rec.dex.complete;
  const all = safariProgress(SAFARI_ROSTER, rec.dex);
  const box = el('div', `dex-perk dex-goal safari-prize${won ? ' earned' : ''}`);
  const img = el('img', `pixel safari-prize-sprite${won ? '' : ' silhouette'}`);
  img.src = spriteUrl(ray, 'front', 0);
  img.alt = '';
  const text = el('div', 'dex-perk-text');
  const named = getSave().unlocked.includes('rayquaza');
  text.append(el('strong', '', `${won ? '✅ ' : '🔒 '}Every page: ${named ? ray.line[0].name : '???'}`),
    el('span', '', named ? `${ray.line[0].name} is yours: a Grass legendary.` : 'Complete the Safari Pokédex: a new Legendary awaits you.'));
  box.append(img, text, el('b', 'dex-perk-count', `${all.caught}/${all.total}`));
  return box;
}

function section(label, ids, rare, rec) {
  const head = el('div', 'index-head');
  const title = el('h3', 'index-heading', label);
  title.append(el('span', 'index-count', `${ids.filter(id => rec.caught.has(id)).length}/${ids.length}`));
  head.append(title);
  return [head, ...ids.map(id => entryTile(id, rare, rec))];
}

function render() {
  const rec = record();
  const p = SAFARI_DEX_PAGES[page];
  const body = [areaBox(p, rec), prizeBox(rec), ...section('Wild Pokémon', p.wild, false, rec)];
  if (p.rare.length) body.push(...section('Rare spawns', p.rare, true, rec));
  $('safari-dex-body').replaceChildren(...body);
  $('safari-dex-dialog').scrollTop = 0;
  const all = safariProgress(SAFARI_ROSTER, rec.dex);
  $('safari-dex-total').textContent = `${all.caught}/${all.total} · ${all.seen} seen`;
  $('safari-dex-total').title = `${all.caught} caught and ${all.seen} seen, of ${all.total} Safari Pokémon`;
  for (const btn of document.querySelectorAll('.safari-tab')) {
    const on = Number(btn.dataset.page) === page;
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
    btn.classList.toggle('complete', (rec.dex.done ?? []).includes(SAFARI_DEX_PAGES[btn.dataset.page].area));
  }
}

/** One entry blown up over the window: picture, type, where it lives, and once caught its signature card. */
function openEntry(id, from) {
  const def = ENEMY_DEFS[id];
  const got = record().caught.has(id);
  const card = el('div', 'dex-detail');
  const head = el('div', 'dex-detail-head');
  const img = el('img', 'pixel dex-detail-sprite');
  img.src = def.image;
  img.alt = '';
  const names = el('div', 'dex-detail-names');
  names.append(el('span', 'dex-no', dexNo(id)), el('strong', 'dex-detail-name', def.name),
    el('span', `index-only type-${def.type}`, `${TYPES[def.type].icon} ${TYPES[def.type].label}`));
  head.append(img, names);
  card.append(head);
  card.append(el('p', 'dex-detail-facts', safariHomes(id).map(h => `${AREA_ICON[SAFARI_DEX_PAGES.find(p => p.name === h.name).area] ?? ''} ${h.name}${h.rare ? ' ✦ rare' : ''}`).join(' · ')));
  card.append(el('p', `dex-detail-research${got ? ' done' : ''}`, got ? 'Caught!' : 'Seen, not caught yet. Wear it down and throw a ball for its card.'));
  if (def.description) card.append(el('p', 'dex-detail-text', def.description));
  const sig = CARDS_BY_ID[SIGNATURE_FOR[id]];
  if (sig) {
    card.append(el('h4', 'dex-moves-head', 'Signature card'));
    const wrap = el('div', 'safari-sig');
    if (got) wrap.append(makeCard(sig));
    else wrap.append(el('div', 'safari-sig-locked', '?'));
    wrap.title = got ? '' : 'Catch it to see its card.';
    card.append(wrap);
  }
  const layer = el('div', 'card-zoom dex-zoom');
  layer.append(card, el('p', 'focus-hint', 'Tap anywhere to close'));
  const close = () => {
    layer.remove();
    document.removeEventListener('keydown', onKey, true);
    from?.focus({ preventScroll: true });
  };
  const onKey = (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) { e.preventDefault(); e.stopPropagation(); close(); } };
  layer.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  $('safari-dex-dialog').append(layer);
}

function pick(i, focus = false) {
  page = i;
  render();
  if (focus) document.querySelector(`.safari-tab[data-page="${i}"]`).focus();
}

export function initSafariDex() {
  const tabs = $('safari-dex-tabs');
  tabs.replaceChildren(...SAFARI_DEX_PAGES.map((p, i) => {
    const btn = el('button', `index-tab dex-tab safari-tab area-${p.area}`);
    btn.type = 'button';
    btn.dataset.page = String(i);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', 'safari-dex-body');
    btn.append(el('span', 'index-tab-icon', AREA_ICON[p.area] ?? '🌿'), el('span', 'index-tab-label', p.name), el('span', 'safari-tab-star', '✦'));
    btn.addEventListener('click', () => pick(i));
    return btn;
  }));
  tabs.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    pick((page + step + SAFARI_DEX_PAGES.length) % SAFARI_DEX_PAGES.length, true);
  });
}

/** Opens on the given area's page (a Safari run's current one), else the last one looked at. */
export function openSafariDex(area) {
  const i = SAFARI_DEX_PAGES.findIndex(p => p.area === area);
  if (i >= 0) page = i;
  render();
  openDialog('safari-dex-dialog');
}

/** The Collection card's count. */
export const safariDexCount = () => safariProgress(SAFARI_ROSTER, getSave().safariDex);
