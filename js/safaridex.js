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
   signature card. It runs on shelfApp() (js/bagdex.js). A shiny that's
   yours (save.safariShinies) shows its Sparkle and a ✨ toggle on its
   page, and the Shiny Exchange's sealed capsules (save.exchange.sealed)
   show as a capsule on the page and the slot, with the totals.
   ============================================================ */

import { ENEMY_DEFS } from './data/enemies.js';
import { CARDS_BY_ID, SIGNATURE_FOR } from './data/cards.js';
import { SAFARI_DEX_PAGES, SAFARI_NUMBER, SAFARI_ROSTER, SAFARI_AREA_COINS, RARE_BOOST, safariHomes, safariProgress } from './data/safari.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { getSave, safariSparkle } from './storage.js';
import { el, makeCard, zoomable } from './ui.js';
import { playCry, playSound } from './audio.js';
import { calmFx } from './prefs.js';
import { shinyImage, SPARKLE_MAX, SHINY_ODDS } from './data/shinies.js';
import { sealedCount } from './data/exchange.js';
import { shelfApp, typed } from './bagdex.js';
import { REAL_TYPES, speciesTypes } from './data/real-types.js';
import { still, sceneImg, progressBar } from './pokedex.js';

const AREA_ICON = { meadow: '🌼', forest: '🌲', wetland: '💧', marsh: '🍄', peak: '🏔️', desert: '🌵', powerplant: '⚡', icecave: '🧊', dojomountain: '🥋' };
// each area's banner and handheld colours, like a biome's
const AREA_INK = {
  meadow: ['#8cd060', '#3a7a24'], forest: ['#4aa860', '#163e20'], wetland: ['#4ab0d8', '#164a78'],
  marsh: ['#9a80c0', '#2e2448'], peak: ['#9ab4d0', '#34466a'], desert: ['#eab860', '#8a5418'], powerplant: ['#e8c830', '#5a4a10'],
  icecave: ['#a8d8f0', '#2a5878'],
  dojomountain: ['#e09060', '#6a3420'],
};

const dexNo = (id) => `No.${String(SAFARI_NUMBER[id]).padStart(3, '0')}`;
const record = () => {
  const dex = getSave().safariDex;
  return { dex, caught: new Set(dex.caught), seen: new Set([...dex.seen, ...dex.caught]) };
};
const sealedOf = (id = null) => sealedCount(getSave().exchange?.sealed, id);
const shinyCount = (ids) => ids.filter(id => safariSparkle(id)).length;
const sealedIn = (ids) => ids.reduce((n, id) => n + sealedOf(id), 0);

// the ✨ toggle: kept while the app is open, so paging on keeps showing the shinies you own
let shinyView = false;
const showsShiny = (id) => shinyView && safariSparkle(id) > 0;

function sprite(id, cls) {
  const img = el('img', `pixel ${cls}`);
  img.src = showsShiny(id) ? shinyImage(id) : ENEMY_DEFS[id].image;
  img.dataset.mon = id;
  img.alt = '';
  img.draggable = false;
  return img;
}

let capId = 0;
/** A sealed capsule, the Shiny Exchange's smoked glass (js/exchange.js draws the live ones), still. */
function sealedCap(cls) {
  const u = `sdxc${++capId}`, wrap = el('span', cls);
  wrap.innerHTML = `<svg viewBox="-64 -64 128 128" aria-hidden="true"><defs>
    <radialGradient id="${u}t" cx="35%" cy="25%" r="85%"><stop offset="0" stop-color="#8a96aa"/><stop offset=".22" stop-color="#3a4660"/><stop offset=".55" stop-color="#161e30"/><stop offset="1" stop-color="#05070d"/></radialGradient>
    <radialGradient id="${u}p" cx="40%" cy="20%" r="90%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#eef2f8"/><stop offset="1" stop-color="#b6c2d4"/></radialGradient>
    <linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f9ff"/><stop offset=".45" stop-color="#a4b2c6"/><stop offset=".6" stop-color="#e6ecf4"/><stop offset="1" stop-color="#5e6c84"/></linearGradient></defs>
    <path d="M-52 0a52 52 0 0 1 104 0z" fill="url(#${u}t)" stroke="#5a6a8a" stroke-width="3"/>
    <ellipse cx="-20" cy="-32" rx="18" ry="7" transform="rotate(-28 -20 -32)" fill="#fff" opacity=".5"/>
    <path d="M-52 0a52 52 0 0 0 104 0z" fill="url(#${u}p)" stroke="#5a6a8a" stroke-width="3"/>
    <rect x="-52" y="-6" width="104" height="12" rx="3" fill="url(#${u}c)"/>
    <circle r="16" fill="#1a2232"/><circle r="11" fill="url(#${u}c)"/></svg>`;
  return wrap;
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

/* The banner's rare: the first only this page has, since Chansey and Kecleon spawn in two areas each and every banner
   showed the same two (the user's report, 2026-10-20) */
const RARE_PAGES = SAFARI_DEX_PAGES.flatMap(p => p.rare).reduce((n, id) => n.set(id, (n.get(id) ?? 0) + 1), new Map());
const bannerRare = (page) => page.rare.find(id => RARE_PAGES.get(id) === 1) ?? page.rare[0];

const GROUPS = SAFARI_DEX_PAGES.map(p => {
  const things = p.ids.map(id => ({ id, rare: p.rare.includes(id) }));
  const [b1, b2] = AREA_INK[p.area] ?? ['#9ccf54', '#3e7a24'];
  return { id: p.area, name: p.name, sub: `${p.wild.length} wild · ${p.rare.length} rare`, b1, b2, scene: p.area, page: p, list: () => things };
});

/** The shinies and sealed capsules, over the banners (`ids` every Pokémon) or under an area's slots. */
function shinyBar(ids, whole) {
  const owned = shinyCount(ids), sealed = sealedIn(ids);
  if (!owned && !sealed) return null;
  const bar = el('div', `pdx-lcd sdx-shinybar${whole ? ' whole' : ''}`);
  bar.append(el('span', 'sdx-shinycount', `✨ Shinies ${owned} / ${ids.length}`));
  if (sealed) {
    const s = el('span', 'sdx-sealedcount');
    s.append(sealedCap('sdx-cap'), el('span', '', `Sealed: ${sealed}`));
    s.title = 'Sealed capsules from the Shiny Exchange: catch the Pokémon in the Safari Zone to open them.';
    bar.append(s);
  }
  return bar;
}

/** Its page's ✨ switch: the shiny, sparkling, with its Sparkle, or back to its usual colours. */
function shinySwitch(id, level) {
  const b = el('button', `sdx-shinyflip${shinyView ? ' on' : ''}`, `✨ ★${level}`);
  b.type = 'button';
  b.setAttribute('aria-pressed', String(shinyView));
  b.setAttribute('aria-label', `Shiny, Sparkle ${level} of ${SPARKLE_MAX}`);
  b.title = shinyView ? 'Shiny on: tap for its usual colours' : 'Its shiny is yours: tap to see it';
  b.addEventListener('pointerdown', (e) => e.stopPropagation());   // not a swipe of the screen
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    shinyView = !shinyView;
    playSound(shinyView ? 'shiny' : 'cancel');
    const dev = b.closest('.pdx-device');
    for (const img of dev?.querySelectorAll('img[data-mon]') ?? []) {
      const mon = img.dataset.mon;
      if (safariSparkle(mon)) img.src = showsShiny(mon) ? shinyImage(mon) : ENEMY_DEFS[mon].image;
    }
    const screen = b.closest('.pdx-screen');
    screen?.classList.toggle('sdx-shiny', shinyView);
    screen?.querySelector('.shiny-aura')?.remove();
    if (shinyView && screen && !calmFx()) screen.append(twinkles());
    b.classList.toggle('on', shinyView);
    b.setAttribute('aria-pressed', String(shinyView));
    b.title = shinyView ? 'Shiny on: tap for its usual colours' : 'Its shiny is yours: tap to see it';
  });
  return b;
}

/** The battle's five twinkles (css/screens.css .shiny-aura), round a shiny on its page. */
function twinkles() {
  const aura = el('div', 'shiny-aura');
  aura.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 5; i++) aura.append(el('span', `shiny-twinkle t${i}`));
  return aura;
}

const stars = (n) => '★'.repeat(n) + '☆'.repeat(SPARKLE_MAX - n);

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
  bannerArt(g) {   // a wild, a rare spawn in the middle, another wild, like the Pokédex's three
    const { seen } = record();
    const ids = [g.page.wild[0], bannerRare(g.page) ?? g.page.wild[2], g.page.wild[1]].filter(Boolean);
    const mons = el('span', 'pdx-banner-mons');
    mons.append(...ids.map(id => sprite(id, `pdx-banner-mon${seen.has(id) ? '' : ' unseen'}`)));
    return mons;
  },
  art(g, t, known, where) {
    const img = sprite(t.id, 'pdx-slot-mon');
    if (where !== 'slot' || !sealedOf(t.id)) return img;
    const both = el('span', 'sdx-slot-art');   // the slot's sealed capsule, in its corner
    both.append(img, sealedCap('sdx-slot-cap'));
    return both;
  },
  slotCls: (g, t) => `sdx-slot${record().caught.has(t.id) ? ' caught' : ''}${t.rare ? ' rare' : ''}${safariSparkle(t.id) ? ' shiny' : ''}${sealedOf(t.id) ? ' sealed' : ''}`,
  screenCls: (g, t) => `sdx-screen${shotFor(g, t) ? ' painted' : ''}${showsShiny(t.id) ? ' sdx-shiny' : ''}`,
  screen(g, t, known) {
    const shot = shotFor(g, t);
    const pad = el('span', 'pdx-pad');
    if (shot?.pad) pad.style.backgroundImage = `url("${shot.pad}")`;
    const nodes = [sceneImg(shot, 'pdx-scene'), pad, sprite(t.id, 'pdx-mon bdx-art')];
    if (known) nodes.push(el('span', `pdx-role${t.rare ? ' sdx-rare' : ''}`, t.rare ? '✦ Rare' : 'Wild'));
    if (record().caught.has(t.id)) {   // its real types, as the Safari's battles use them (js/data/real-types.js)
      const chips = el('span', 'sdx-typechips');
      chips.append(...speciesTypes(ENEMY_DEFS[t.id]).map(type => el('span', `index-only type-${type}`, `${REAL_TYPES[type].icon} ${REAL_TYPES[type].label}`)));
      nodes.push(chips, el('span', 'pdx-caught gold', 'Caught'));
    }
    const level = safariSparkle(t.id), held = sealedOf(t.id);
    if (level) nodes.push(shinySwitch(t.id, level));
    if (showsShiny(t.id) && !calmFx()) nodes.push(twinkles());
    if (held) {
      const badge = el('span', 'sdx-sealbadge');
      badge.append(sealedCap('sdx-cap'), el('b', '', `×${held}`));
      badge.title = `${held} sealed capsule${held > 1 ? 's' : ''} from the Shiny Exchange: catch it to open`;
      nodes.push(badge);
    }
    return nodes;
  },
  lines(g, t, known) {
    const held = sealedOf(t.id);
    const sealedLine = held ? [el('div', 'pdx-lcd pdx-text sdx-sealedline', `🔒 ${held} sealed — catch to open`)] : [];
    if (!known) {
      return [...sealedLine, typed('muted', 'Not seen yet. Meet it in a Safari run to fill this in.'),
        ...(t.rare ? [typed('muted', 'A rare spawn: look for a gold ✦ on the map.')] : [])];
    }
    const def = ENEMY_DEFS[t.id];
    const got = record().caught.has(t.id);
    const homes = safariHomes(t.id).map(h => `${h.name}${h.rare ? ' (rare)' : ''}`).join(', ');
    const lines = [typed('', `Lives in: ${homes}.`)];
    const line = def.safariLine ?? def.description;   // a Pokémon a main biome shares keeps its Safari line here
    if (line) lines.push(typed('', line));
    lines.push(got ? el('div', 'pdx-lcd pdx-text gold', '● Caught!') : typed('muted', 'Seen, not caught yet. Wear it down and throw a ball for its card.'));
    lines.push(...sealedLine);
    const level = safariSparkle(t.id);
    if (level) lines.push(el('div', 'pdx-lcd pdx-text sdx-sparkleline', `✨ Its shiny is yours · Sparkle ${stars(level)}`));
    else if (got) lines.push(typed('muted', `Its shiny isn't yours yet: 1 wild in ${Math.round(1 / SHINY_ODDS)} is shiny, or pull it at the Shiny Exchange.`));
    const sig = signature(t.id, got);
    if (sig) lines.push(sig);
    return lines;
  },
  tally: (g, done) => (done ? `★ Every ${g.name} Pokémon caught` : 'Caught'),
  doneSub: 'Complete!',
  onShow: (g, t, known) => { if (known) playCry(ENEMY_DEFS[t.id].spriteId); },
  foot: (g) => { const rec = record(); return [shinyBar(g.page.ids, false), areaBox(g.page, rec), prizeBox(rec)].filter(Boolean); },
  top: () => shinyBar(SAFARI_ROSTER, true) ?? el('span', 'sdx-nobar'),
  subArt(g) {   // the banner's line: its wilds and rares, then its shinies and sealed capsules
    const owned = shinyCount(g.page.ids), sealed = sealedIn(g.page.ids), { caught } = record();
    return el('span', '', `${g.page.ids.every(id => caught.has(id)) ? 'Complete!' : g.sub}${owned ? ` · ✨${owned}` : ''}${sealed ? ` · Sealed: ${sealed}` : ''}`);
  },
});

/** The Collection card's count. */
export const safariDexCount = () => safariProgress(SAFARI_ROSTER, getSave().safariDex);
