/* ============================================================
   safaridex.js  -  the Safari Pokédex, an app of the Pokédex device
   (the Collection's Safari app, and the Safari lobby's Pokédex key).

   Made like the main Pokédex (the user's call, 2026-10-07): a banner
   per Safari area (data/safari.js SAFARI_DEX_PAGES) painted with that
   area's scene, then the red handheld on that area: one Pokémon at a
   time on its place's scenery, its text typing out, and the area's
   every Pokémon as slots, its wilds then its rare spawns. An entry is
   a silhouette and ??? until met in a Safari run (save.safariDex.seen)
   and gets a Poké Ball dot once caught; a caught one shows its
   signature card. It runs on shelfApp() (js/bagdex.js).
   ============================================================ */

import { ENEMY_DEFS } from './data/enemies.js';
import { CARDS_BY_ID, SIGNATURE_FOR } from './data/cards.js';
import { SAFARI_DEX_PAGES, SAFARI_NUMBER, SAFARI_ROSTER, SAFARI_AREA_COINS, RARE_BOOST, safariHomes, safariProgress } from './data/safari.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave } from './storage.js';
import { el, makeCard, zoomable } from './ui.js';
import { playCry } from './audio.js';
import { shelfApp, typed, typeChip } from './bagdex.js';
import { still, sceneImg, progressBar } from './pokedex.js';

const AREA_ICON = { meadow: '🌼', forest: '🌲', wetland: '💧', marsh: '🍄', peak: '🏔️', desert: '🌵' };
// each area's banner and handheld colours, like a biome's
const AREA_INK = {
  meadow: ['#8cd060', '#3a7a24'], forest: ['#4aa860', '#163e20'], wetland: ['#4ab0d8', '#164a78'],
  marsh: ['#9a80c0', '#2e2448'], peak: ['#9ab4d0', '#34466a'], desert: ['#eab860', '#8a5418'],
};

const dexNo = (id) => `No.${String(SAFARI_NUMBER[id]).padStart(3, '0')}`;
const record = () => {
  const dex = getSave().safariDex;
  return { dex, caught: new Set(dex.caught), seen: new Set([...dex.seen, ...dex.caught]) };
};

function sprite(id, cls) {
  const img = el('img', `pixel ${cls}`);
  img.src = ENEMY_DEFS[id].image;
  img.alt = '';
  img.draggable = false;
  return img;
}

/** The area's scenery for an entry: wilds through its first places, rare spawns deeper in. */
function shotFor(g, t) {
  const i = g.page.wild.indexOf(t.id);
  return still(g.page.area, 128, 64, 0.5, 'wild', t.rare ? 2 : i % 2);
}

function areaBox(p, rec) {
  const { caught, seen, total } = safariProgress(p.ids, rec.dex);
  const earned = (rec.dex.done ?? []).includes(p.area);   // stays earned when a later batch adds Pokémon to the page
  const box = el('div', `dex-perk safari-area-box${earned ? ' earned' : ''}`);
  const text = el('div', 'dex-perk-text');
  text.append(el('strong', '', `${earned ? '' : '🔒 '}${p.name}${caught === total ? ' complete!' : ''}`),
    el('span', '', `Reward: rare spawns ${RARE_BOOST === 2 ? 'twice' : `${RARE_BOOST}x`} as often here, on replays.`),
    el('small', '', earned ? `Earned, with 💰 ${SAFARI_AREA_COINS}. ${caught} caught · ${seen} seen of ${total}`
      : `Catch all ${total} to earn it, plus 💰 ${SAFARI_AREA_COINS}. ${caught} caught · ${seen} seen`),
    progressBar(caught, total));
  box.append(el('span', 'dex-perk-icon', AREA_ICON[p.area] ?? '🌿'), text, el('b', 'dex-perk-count', `${earned ? '✦' : ''}${caught}/${total}`));
  return box;
}

/** The whole Safari Pokédex's prize: Rayquaza, a silhouette and never named until it's unlocked. */
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
    el('span', '', named ? `${ray.line[0].name} is yours: a Grass legendary.` : 'Complete the Safari Pokédex: a new Legendary awaits you.'),
    progressBar(all.caught, all.total));
  box.append(img, text, el('b', 'dex-perk-count', `${all.caught}/${all.total}`));
  return box;
}

function signature(id, got) {
  const sig = CARDS_BY_ID[SIGNATURE_FOR[id]];
  if (!sig) return null;
  const box = el('div', 'pdx-lcd sdx-sig');
  box.append(el('h4', '', 'Signature card'));
  if (got) {
    const card = makeCard(sig);
    card.classList.add('small');
    zoomable(card, sig);
    box.append(card);
  } else {
    box.append(el('div', 'safari-sig-locked', '?'), el('small', '', 'Catch it to see its card.'));
  }
  return box;
}

const GROUPS = SAFARI_DEX_PAGES.map(p => {
  const things = p.ids.map(id => ({ id, rare: p.rare.includes(id) }));
  const [b1, b2] = AREA_INK[p.area] ?? ['#9ccf54', '#3e7a24'];
  return { id: p.area, name: p.name, sub: `${p.wild.length} wild · ${p.rare.length} rare`, b1, b2, scene: p.area, page: p, list: () => things };
});

export const safariDexApp = shelfApp({
  groups: GROUPS,
  deviceCls: 'sdx-device',
  known: (g, t) => record().seen.has(t.id),
  score: (g, things) => { const { caught } = record(); return [things.filter(t => caught.has(t.id)).length, things.length]; },
  no: (g, t) => dexNo(t.id),
  label: (g, t, known) => (known ? ENEMY_DEFS[t.id].name : '???'),
  medal(g) {
    const earned = (getSave().safariDex.done ?? []).includes(g.id);
    const m = el('span', `pdx-medal lv${earned ? 2 : 0}`, AREA_ICON[g.id] ?? '🌿');
    m.title = earned ? `${g.name}: every Pokémon caught` : `${g.name}: catch them all for its reward`;
    return m;
  },
  bannerArt(g) {   // a wild, the first rare spawn in the middle, another wild, like the Pokédex's three
    const { seen } = record();
    const ids = [g.page.wild[0], g.page.rare[0] ?? g.page.wild[2], g.page.wild[1]].filter(Boolean);
    const mons = el('span', 'pdx-banner-mons');
    mons.append(...ids.map(id => sprite(id, `pdx-banner-mon${seen.has(id) ? '' : ' unseen'}`)));
    return mons;
  },
  art: (g, t) => sprite(t.id, 'pdx-slot-mon'),
  slotCls: (g, t) => `sdx-slot${record().caught.has(t.id) ? ' caught' : ''}${t.rare ? ' rare' : ''}`,
  screenCls: (g, t) => `sdx-screen${shotFor(g, t) ? ' painted' : ''}`,
  screen(g, t, known) {
    const shot = shotFor(g, t);
    const pad = el('span', 'pdx-pad');
    if (shot?.pad) pad.style.backgroundImage = `url("${shot.pad}")`;
    const nodes = [sceneImg(shot, 'pdx-scene'), pad, sprite(t.id, 'pdx-mon bdx-art')];
    if (known) nodes.push(el('span', `pdx-role${t.rare ? ' sdx-rare' : ''}`, t.rare ? '✦ Rare' : 'Wild'));
    if (record().caught.has(t.id)) nodes.push(typeChip(ENEMY_DEFS[t.id].type), el('span', 'pdx-caught gold', 'Caught'));
    return nodes;
  },
  lines(g, t, known) {
    if (!known) {
      return [typed('muted', 'Not seen yet. Meet it in a Safari run to fill this in.'),
        ...(t.rare ? [typed('muted', 'A rare spawn: look for a gold ✦ on the map.')] : [])];
    }
    const def = ENEMY_DEFS[t.id];
    const got = record().caught.has(t.id);
    const homes = safariHomes(t.id).map(h => `${h.name}${h.rare ? ' (rare)' : ''}`).join(', ');
    const lines = [typed('', `Lives in: ${homes}.`)];
    const line = def.safariLine ?? def.description;   // a Pokémon a main biome shares keeps its Safari line here
    if (line) lines.push(typed('', line));
    lines.push(got ? el('div', 'pdx-lcd pdx-text gold', '● Caught!') : typed('muted', 'Seen, not caught yet. Wear it down and throw a ball for its card.'));
    const sig = signature(t.id, got);
    if (sig) lines.push(sig);
    return lines;
  },
  tally: (g, done) => (done ? `★ Every ${g.name} Pokémon caught` : 'Caught'),
  doneSub: 'Complete!',
  onShow: (g, t, known) => { if (known) playCry(ENEMY_DEFS[t.id].spriteId); },
  foot: (g) => { const rec = record(); return [areaBox(g.page, rec), prizeBox(rec)]; },
});

/** The Collection card's count. */
export const safariDexCount = () => safariProgress(SAFARI_ROSTER, getSave().safariDex);
