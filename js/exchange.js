/* exchange.js  -  the Shiny Exchange's window (2026-10-18, the user's ask; agreed on the mock's boards 3-5). Opened
   from its kiosk in the Safari Outfitter (js/mall-outfitter.js). Dark and hi-tech, not the Pokédex's look: six biome
   banners, each a capsule machine of the Safari Pokémon you've caught there (js/data/exchange.js has the rules and
   js/storage.js's exchangePull() / exchangePick() pay and save), and the reveal: the capsule drops into the tray (a gold
   one lands plain, then turns gold), a tap cracks it along its band and it bursts open, the shadow holds on the screen
   (a gold one shakes), a flash, the shiny. A Pokémon not caught yet stays a shadow: its capsule is sealed, and a Safari
   catch of it opens it (openSealedReveal(), from js/run.js), the dark glass clearing before the same reveal.
   The capsules are SVG, so the window adds no WebGL context, and they move only by transform and opacity (no animated
   blur or masks); calmFx() turns every bit of it off. Closing it removes it from the page, timers and all. */

import { getSave, exchangePull, exchangePick, exchangeCaught, staleSealed, openSealedCapsules } from './storage.js';
import { playSound, playCry } from './audio.js';
import { calmFx } from './prefs.js';
import { refreshCoins } from './ui.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { SAFARI_DEX_PAGES, SAFARI_ROSTER } from './data/safari.js';
import { shinyImage, sparkleOf, SPARKLE_MAX } from './data/shinies.js';
import { PULL_COST, PULL_TEN, TEN_COST, STARS_FOR_PICK, EXCHANGE_INK, goldOdds, sealedCount } from './data/exchange.js';

const fmt = (n) => n.toLocaleString('en-US');
const nameOf = (id) => ENEMY_DEFS[id]?.name ?? id;
const sealedOf = (id = null) => sealedCount(getSave().exchange?.sealed, id);
const STAR4 = 'M0 -6 1.4 -1.4 6 0 1.4 1.4 0 6 -1.4 1.4 -6 0 -1.4 -1.4Z';
const STAR5 = 'M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7.3L12 17.8 5.8 21.5l1.6-7.3L2 9.5l7.1-.6z';
const COIN = '<svg class="sx-coin" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#ffd36b"/><circle cx="8" cy="8" r="4.2" fill="none" stroke="#b8901a" stroke-width="1.6"/></svg>';
const sparkle = (n) => '★'.repeat(n) + '☆'.repeat(SPARKLE_MAX - n);
const starLine = (stars) => (stars >= STARS_FOR_PICK ? `★ ${stars} Lucky Stars: enough for a free pick!` : `★ Lucky Stars ${stars} / ${STARS_FOR_PICK}`);

/** Hex `a` mixed toward `b` by `k`. */
function mix(a, b, k) {
  const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('')}`;
}

/* ---------- the capsules ---------- */

/** A capsule's colours: an area's (its ink), 'gold', 'prism' (the Lucky Star pick) or 'sealed' (smoked dark glass). */
function lookOf(kind) {
  if (kind === 'sealed') return { stops: ['#8a96aa', '#3a4660', '#161e30', '#05070d'], glow: '#5a6a8a', emblem: '#8a96aa', inside: '#05070d' };
  if (kind === 'gold') return { stops: ['#fffbe6', '#ffe590', '#f0b830', '#7a5200'], glow: '#ffd36b', emblem: '#7a5200', inside: '#5a3c00' };
  if (kind === 'prism') return { prism: true, glow: '#c8a0ff', emblem: '#8a5cff', inside: '#2a1a4a' };
  const [ink, deep] = EXCHANGE_INK[kind];
  return { stops: ['#ffffff', mix(ink, '#ffffff', 0.6), ink, deep], glow: ink, emblem: deep, inside: mix(deep, '#000000', 0.35) };
}

let uid = 0;
/** A capsule, smooth SVG: a see-through top in its colour with sparkles drifting inside, a pearl base, a chrome band
    and button, a rim light. `live` turns it slowly (its two buttons, front and back, pass round) and drifts the
    sparkles; the reveal's classes crack it (`cracking`) and burst it (`opening`). */
function capsule(kind, live = false, cls = '') {
  const u = ++uid, L = lookOf(kind);
  const top = L.prism
    ? `<linearGradient id="t${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9ae0"/><stop offset=".3" stop-color="#ffd36b"/><stop offset=".55" stop-color="#9af0b0"/><stop offset=".78" stop-color="#6fe8ff"/><stop offset="1" stop-color="#b49cff"/></linearGradient>`
    : `<radialGradient id="t${u}" cx="35%" cy="25%" r="85%">${L.stops.map((c, i) => `<stop offset="${[0, 0.22, 0.55, 1][i]}" stop-color="${c}"/>`).join('')}</radialGradient>`;
  const button = (k) => `<g class="sx-turn${k ? ` ${k}` : ''}"><circle r="16" fill="#1a2232"/><circle r="12" fill="url(#c${u})"/><path d="${STAR4}" transform="scale(1.35)" fill="${L.emblem}"/></g>`;
  const motes = [[-30, -12, 0.9, 0], [-8, -30, 0.7, 0.9], [16, -14, 1, 1.7], [30, -26, 0.6, 2.4], [2, -8, 0.8, 3.1], [-20, -34, 0.6, 1.3]]
    .map(([x, y, s, d]) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="sx-mote" style="animation-delay:-${d}s" d="${STAR4}" fill="#fffbe6"/></g>`).join('');
  return `<svg class="sx-cap${live ? ' live' : ''} ${cls}" viewBox="-64 -64 128 128" aria-hidden="true">
    <defs>${top}
      <radialGradient id="p${u}" cx="40%" cy="20%" r="90%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#eef2f8"/><stop offset="1" stop-color="#b6c2d4"/></radialGradient>
      <linearGradient id="c${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f9ff"/><stop offset=".45" stop-color="#a4b2c6"/><stop offset=".6" stop-color="#e6ecf4"/><stop offset="1" stop-color="#5e6c84"/></linearGradient>
      <radialGradient id="g${u}"><stop offset=".55" stop-color="${L.glow}" stop-opacity=".6"/><stop offset="1" stop-color="${L.glow}" stop-opacity="0"/></radialGradient>
      <clipPath id="k${u}"><path d="M-50 0a50 50 0 0 1 100 0z"/></clipPath>
      <clipPath id="b${u}"><circle r="51"/></clipPath>
    </defs>
    <circle class="sx-cap-glow" r="64" fill="url(#g${u})"/>
    <g class="sx-cap-top">
      <path d="M-52 0a52 52 0 0 1 104 0z" fill="${L.inside}"/>
      <g clip-path="url(#k${u})">${motes}</g>
      <path d="M-52 0a52 52 0 0 1 104 0z" fill="url(#t${u})" opacity=".74"/>
      <path d="M-44 -4a44 44 0 0 1 88 0" fill="none" stroke="#ffffff" stroke-opacity=".4" stroke-width="2"/>
      <ellipse cx="-20" cy="-32" rx="20" ry="8" transform="rotate(-28 -20 -32)" fill="#ffffff" opacity=".78"/>
      <circle cx="12" cy="-40" r="3" fill="#ffffff" opacity=".85"/>
      <path d="M-52 -1a52 52 0 0 1 104 0" fill="none" stroke="${L.glow}" stroke-width="2.5"/>
    </g>
    <g class="sx-cap-bot">
      <path d="M-52 0a52 52 0 0 0 104 0z" fill="url(#p${u})"/>
      <path d="M-38 24a44 44 0 0 0 76 0" fill="none" stroke="#14203a" stroke-opacity=".16" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="-18" cy="26" rx="12" ry="4" transform="rotate(22 -18 26)" fill="#ffffff" opacity=".6"/>
      <path d="M-52 1a52 52 0 0 0 104 0" fill="none" stroke="${L.glow}" stroke-opacity=".7" stroke-width="2"/>
    </g>
    <g class="sx-cap-band">
      <rect x="-52" y="-5" width="104" height="10" rx="3" fill="url(#c${u})"/>
      <g clip-path="url(#b${u})">${live ? button('a') + button('b') : button('')}</g>
    </g>
    <rect class="sx-crack" x="-54" y="-2.5" width="108" height="5" rx="2.5" fill="#fffbe6"/>
  </svg>`;
}

/** The burst as a capsule opens: rays and stars flying out. */
const burst = () => `<svg class="sx-rays" viewBox="0 0 240 240" aria-hidden="true"><path d="M150 120L232 120M146 135L217 176M135 146L176 217M120 150L120 232M105 146L64 217M94 135L23 176M90 120L8 120M94 105L23 64M105 94L64 23M120 90L120 8M135 94L176 23M146 105L217 64" stroke="#fff6c8" stroke-width="5" stroke-linecap="round"/></svg>`
  + [[-90, -64], [86, -70], [-104, 8], [100, 4], [-52, 74], [56, 78], [0, -96]].map(([x, y], i) =>
    `<svg class="sx-fly" style="--dx:${x}px;--dy:${y}px" viewBox="-7 -7 14 14" aria-hidden="true"><path d="${STAR4}" fill="${i % 2 ? '#ffd36b' : '#fff6c8'}"/></svg>`).join('');

/* ---------- the window ---------- */

let dlg = null, onDone = null, timers = [];
const S = { area: null, filter: 'all', picking: false, reveal: null, after: false };   // after: the window is only a catch's reveal, closed with it
const later = (ms, fn) => timers.push(setTimeout(fn, calmFx() ? 0 : ms));
const stopTimers = () => { timers.forEach(clearTimeout); timers = []; };

function toast(text) {
  const t = dlg.querySelector('.sx-toast');
  t.textContent = text;
  t.hidden = false;
  t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { if (t.isConnected) t.hidden = true; }, 2800);
}

/** How a Pokémon's tile reads in a machine: owned (its Sparkle), in the capsules, or not caught yet. */
function tile(id, rare, caught) {
  const lvl = sparkleOf(getSave().safariShinies, id), have = caught.has(id), take = S.picking && have, held = !have && sealedOf(id);
  const tag = lvl ? sparkle(lvl) : held ? `SEALED ×${held}` : take ? `FREE · ${STARS_FOR_PICK}★` : rare ? 'GOLD CAPSULE' : 'IN CAPSULES';
  const label = !have ? `Not caught yet${held ? `, ${held} sealed capsule${held > 1 ? 's' : ''}: catch it to open` : ''}` : `${nameOf(id)}, ${lvl ? `shiny owned, Sparkle ${lvl}` : 'shiny not owned yet'}${take ? ', free with your Lucky Stars' : ''}`;
  const src = have ? shinyImage(id) : ENEMY_DEFS[id]?.image ?? shinyImage(id);
  return `<button type="button" class="sx-mon${lvl ? ' owned' : ''}${have ? '' : ' unknown'}${held ? ' sealed' : ''}${take ? ' take' : ''}" data-id="${id}" aria-label="${label}"${take ? '' : ' aria-disabled="true"'}>
    ${rare ? '<span class="sx-rare">RARE</span>' : ''}${held ? `<span class="sx-seal">${capsule('sealed')}</span>` : ''}
    <img class="pixel" src="${src}" alt="" loading="lazy" decoding="async">
    <b>${have ? nameOf(id) : '???'}</b><small>${tag}</small></button>`;
}

function homeView(save, caught) {
  const owned = SAFARI_ROSTER.filter(id => sparkleOf(save.safariShinies, id)).length, stars = save.exchange?.stars ?? 0, held = sealedOf();
  const row = Array.from({ length: STARS_FOR_PICK }, (_, k) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR5}" fill="${k < stars ? '#ffd36b' : '#2a3a5c'}"/></svg>`).join('');
  const banners = SAFARI_DEX_PAGES.map((p, i) => {
    const [ink, deep] = EXCHANGE_INK[p.area];
    const shinies = p.ids.filter(id => sparkleOf(save.safariShinies, id)).length, sealed = p.ids.reduce((n, id) => n + sealedOf(id), 0);
    const peek = [...p.ids].sort((a, b) => sparkleOf(save.safariShinies, b) - sparkleOf(save.safariShinies, a) || caught.has(b) - caught.has(a)).slice(0, 3);
    return `<button type="button" class="sx-banner" data-area="${p.area}" style="--ink:${ink};--deep:${deep};animation-delay:${i * 40}ms" aria-label="${p.name}: ${shinies} of ${p.ids.length} shinies">
      <span class="sx-banner-text"><b>${p.name.toUpperCase()}</b>
        <span class="sx-pills"><i>Shinies ${shinies} / ${p.ids.length}</i><i class="cy">${sealed ? `${sealed} sealed` : `Caught ${p.ids.filter(id => caught.has(id)).length} / ${p.ids.length}`}</i></span></span>
      <span class="sx-peek">${peek.map(id => `<img class="pixel${sparkleOf(save.safariShinies, id) ? '' : ' shade'}" src="${sparkleOf(save.safariShinies, id) ? shinyImage(id) : ENEMY_DEFS[id]?.image}" alt="" loading="lazy">`).join('')}</span>
      <span class="sx-chev" aria-hidden="true">›</span>
      <span class="sx-bar"><i style="width:${Math.round(shinies / p.ids.length * 100)}%"></i></span>
    </button>`;
  }).join('');
  return `<section class="sx-card">
      <div class="sx-row"><span class="sx-label">YOUR SHINIES</span><span class="sx-big">${owned}<small> / ${SAFARI_ROSTER.length}</small></span></div>
      <span class="sx-bar gold"><i style="width:${Math.max(1, Math.round(owned / SAFARI_ROSTER.length * 100))}%"></i></span>
      <div class="sx-row"><span class="sx-label">LUCKY STARS${stars > STARS_FOR_PICK ? ` · ${stars}` : ''}</span><span class="sx-stars">${row}</span></div>
      <p>Every capsule pays a Lucky Star, a repeat 2 (3 once it's at ★5). ${STARS_FOR_PICK} of them pick any shiny you've caught, free.</p>
      ${held ? `<div class="sx-row"><span class="sx-label">SEALED CAPSULES</span><span class="sx-big cy">${held}</span></div><p>A Pokémon you haven't caught comes out sealed. Catch it in the Safari Zone and its capsule opens.</p>` : ''}
      ${S.picking ? '<button type="button" class="sx-btn ghost" data-act="unpick">Not now: keep my stars</button>'
        : stars >= STARS_FOR_PICK && caught.size ? `<button type="button" class="sx-btn gold" data-act="pick">USE ${STARS_FOR_PICK} STARS: PICK ANY SHINY</button>`
        : stars >= STARS_FOR_PICK ? '<p class="sx-note">Catch a Pokémon in the Safari Zone to pick its shiny with them.</p>' : ''}
    </section>
    <p class="sx-note">${S.picking ? 'Open a biome and tap any Pokémon you\'ve caught.' : `${PULL_COST} PokéCoins a capsule. A pull of ${PULL_TEN} always holds a gold one.`}</p>
    ${banners}`;
}

function areaView(save, caught) {
  const p = SAFARI_DEX_PAGES.find(x => x.area === S.area), [ink, deep] = EXCHANGE_INK[p.area];
  const coins = save.coins ?? 0, stars = save.exchange?.stars ?? 0, sealed = p.ids.reduce((n, id) => n + (caught.has(id) ? 0 : sealedOf(id)), 0);
  const shinies = p.ids.filter(id => sparkleOf(save.safariShinies, id)).length;
  const keep = { all: () => true, owned: id => sparkleOf(save.safariShinies, id), new: id => !sparkleOf(save.safariShinies, id), sealed: id => !caught.has(id) && sealedOf(id), rare: id => p.rare.includes(id) };
  if (S.filter === 'sealed' && !sealed) S.filter = 'all';
  const chips = [['all', 'All'], ['owned', 'Owned'], ['new', 'Not owned'], ...(sealed ? [['sealed', 'Sealed']] : []), ['rare', 'Rare']]
    .map(([id, label]) => `<button type="button" class="sx-chip${S.filter === id ? ' on' : ''}" data-filter="${id}" aria-pressed="${S.filter === id}">${label}</button>`).join('');
  const odds = Math.round(goldOdds(save.exchange?.pity ?? 0) * 100);
  return `<section class="sx-head-banner" style="--ink:${ink};--deep:${deep}">
      <b>${p.name.toUpperCase()}</b><span>Caught ${p.ids.filter(id => caught.has(id)).length} / ${p.ids.length} · Shinies ${shinies}${sealed ? ` · Sealed ${sealed}` : ''}</span></section>
    <section class="sx-card machine">
      <div class="sx-machine">${capsule(p.area, !calmFx(), 'sx-icon')}
        <div><b>SHINY CAPSULES</b><p>All ${p.ids.length} of the area's Pokémon are in this machine. A repeat raises its Sparkle; one you haven't caught comes out sealed till you catch it.</p></div></div>
      <p class="sx-odds"><i class="gold-dot"></i>Gold capsule (a rare spawn): ${odds}%, up ${Math.round(goldOdds(1) * 100) - Math.round(goldOdds(0) * 100)}% each plain one</p>
      <div class="sx-pulls">
        <button type="button" class="sx-btn line" data-pull="1"${coins < PULL_COST ? ' disabled' : ''}><b>PULL ×1</b><small>${fmt(PULL_COST)} coins</small></button>
        <button type="button" class="sx-btn cyan" data-pull="${PULL_TEN}"${coins < TEN_COST ? ' disabled' : ''}><b>PULL ×${PULL_TEN}</b><small>${fmt(TEN_COST)} · a gold one</small></button>
      </div>
      <p class="sx-starline${S.picking ? ' on' : ''}">${S.picking ? `★ Tap any caught Pokémon below to take its shiny free.` : stars >= STARS_FOR_PICK ? starLine(stars) : `${starLine(stars)}. Each capsule adds one.`}</p>
    </section>
    <div class="sx-label">${S.picking ? 'TAKE ONE FREE' : 'IN THIS MACHINE'}</div>
    <div class="sx-chips">${chips}</div>
    <div class="sx-grid">${[...p.wild, ...p.rare].filter(keep[S.filter]).map(id => tile(id, p.rare.includes(id), caught)).join('') || '<p class="sx-note">None here yet.</p>'}</div>`;
}

function render() {
  if (!dlg) return;
  const save = getSave(), caught = new Set(exchangeCaught());
  const body = dlg.querySelector('.sx-body'), at = S.area ? SAFARI_DEX_PAGES.find(x => x.area === S.area) : null;
  dlg.querySelector('.sx-back').hidden = !at;
  dlg.querySelector('.sx-close').hidden = !!at;
  dlg.querySelector('.sx-sub').textContent = at ? `${at.name} · pull a capsule` : 'Safari Zone shinies, by biome';
  dlg.querySelector('.sx-coins b').textContent = fmt(save.coins ?? 0);
  body.innerHTML = at ? areaView(save, caught) : homeView(save, caught);
}

/* ---------- the reveal ---------- */

/** `unseal`: sealed capsules a catch opens, their dark glass clearing as they land. */
function startReveal(list, free = false, unseal = false) {
  stopTimers();
  S.reveal = { list, i: 0, free, unseal, phase: 'drop' };
  dlg.querySelector('.sx-reveal').hidden = false;
  showCapsule();
}

/** The current capsule drops into the tray; a gold one lands plain, then turns gold. */
function showCapsule() {
  const R = S.reveal, c = R.list[R.i], calm = calmFx();
  R.phase = 'drop';
  drawReveal();
  playSound('select');
  if (calm) { R.phase = 'wait'; drawReveal(); return; }
  later(650, () => {
    R.phase = 'wait';
    drawReveal();
    if (c.gold && !R.free) later(420, () => { dlg?.querySelector('.sx-tray')?.classList.add('golden'); playSound('stat-up'); });
    if (R.unseal) later(300, () => { dlg?.querySelector('.sx-tray')?.classList.add('cleared'); playSound('stat-up'); });
  });
}

/** A tap on the capsule: a crack of light along its band, it bursts open, the shadow holds (a gold one shakes), a flash,
    the shiny. */
function openCapsule() {
  const R = S.reveal;
  if (R?.phase !== 'wait') return;
  const c = R.list[R.i], tray = dlg.querySelector('.sx-tray');
  if (calmFx()) return showShiny();
  R.phase = 'crack';
  tray.classList.add('cracking');
  later(420, () => {
    R.phase = 'open';
    tray.classList.add('opening');
    playSound('ball-open');
    later(380, () => {
      R.phase = 'shadow';
      drawScreen();
      later(c.gold ? 1700 : 950, () => {
        if (c.sealed) return showShiny();   // it stays a shadow: no flash
        dlg.querySelector('.sx-screen').classList.add('flash');
        later(160, showShiny);
      });
    });
  });
}

function showShiny() {
  const R = S.reveal, c = R.list[R.i];
  R.phase = 'shiny';
  drawReveal();
  playSound(c.sealed ? 'select' : 'shiny');
  playCry(ENEMY_DEFS[c.id]?.spriteId ?? c.id);
}

function nextCapsule() {
  const R = S.reveal;
  stopTimers();
  if (R.i + 1 >= R.list.length) { R.phase = 'done'; drawReveal(); return; }
  R.i++;
  showCapsule();
}

function closeReveal() {
  if (S.after) return close();
  stopTimers();
  S.reveal = null;
  const r = dlg.querySelector('.sx-reveal');
  r.hidden = true;
  r.replaceChildren();
  render();
}

/** What the capsule did, in a word or two: new, its Sparkle, or the stars a ★5 repeat paid. */
const gainText = (c) => (c.sealed ? 'SEALED' : c.gain.isNew ? 'NEW SHINY' : c.gain.maxed ? `★5 · +${c.stars} LUCKY STARS` : `SPARKLE ★${c.gain.was} → ★${c.gain.level}`);
/** A sealed one's name, once you've met it in the Safari; ??? till then. */
const seenName = (id) => (getSave().safariDex?.seen?.includes(id) ? nameOf(id) : '???');

function drawScreen() {
  const R = S.reveal, c = R.list[Math.min(R.i, R.list.length - 1)], ph = R.phase, inner = dlg.querySelector('.sx-led');
  const area = SAFARI_DEX_PAGES.find(p => p.ids.includes(c.id)), ink = EXCHANGE_INK[area.area][0], gold = c.gold && !R.free;
  const screen = dlg.querySelector('.sx-screen');
  screen.style.setProperty('--glow', ph === 'shadow' ? (gold ? '#ffd36bee' : `${ink}dd`) : ph === 'shiny' ? (gold ? '#ffd36b66' : `${ink}66`) : `${ink}33`);
  screen.classList.toggle('gold', gold && (ph === 'shadow' || ph === 'shiny'));
  screen.classList.remove('flash');
  if (ph === 'shadow' || (R.unseal && ph === 'wait')) {
    inner.innerHTML = `<div class="sx-shadow${gold ? ' shake' : ''}"><img class="pixel" src="${shinyImage(c.id)}" alt="A shadow"><b>${R.unseal && ph === 'wait' ? 'TAP TO OPEN' : gold ? '★ RARE ★' : '???'}</b></div>`;
  } else if (ph === 'shiny' && c.sealed) {
    inner.innerHTML = `<div class="sx-shown sealed"><img class="pixel" src="${shinyImage(c.id)}" alt="A sealed shadow"><b>${seenName(c.id)}</b>
      <span class="sx-tags"><i style="background:${ink}">${area.name.toUpperCase()}</i><i class="dark">${gold ? 'RARE · ' : ''}SEALED</i></span>
      <span class="sx-sealnote">Catch it in the Safari Zone to open it</span></div>`;
  } else if (ph === 'shiny') {
    inner.innerHTML = `<div class="sx-shown"><span class="sx-twinkles">${[0, 1, 2].map(k => `<svg viewBox="-7 -7 14 14" aria-hidden="true" style="animation-delay:${k * 0.45}s"><path d="${STAR4}" fill="${k === 1 ? '#ffd36b' : '#fff6c8'}"/></svg>`).join('')}</span>
      <img class="pixel" src="${shinyImage(c.id)}" alt="Shiny ${nameOf(c.id)}"><b>${nameOf(c.id).toUpperCase()}</b>
      <span class="sx-tags"><i style="background:${ink}">${area.name.toUpperCase()}</i><i class="gold">${R.free ? 'LUCKY STAR PICK · ' : gold ? 'RARE · ' : ''}${gainText(c)}</i></span>
      <span class="sx-sparkle" aria-label="Sparkle ${c.gain.level}">${sparkle(c.gain.level)}</span></div>`;
  } else {
    inner.innerHTML = `<div class="sx-idle"><b>?</b><span>${R.unseal ? 'IT\'S REACTING!' : ph === 'wait' ? 'TAP THE CAPSULE' : 'DISPENSING...'}</span></div>`;
  }
}

function drawReveal() {
  const R = S.reveal, box = dlg.querySelector('.sx-reveal'), multi = R.list.length > 1, ph = R.phase, stars = getSave().exchange?.stars ?? 0;
  const c = R.list[Math.min(R.i, R.list.length - 1)], area = SAFARI_DEX_PAGES.find(p => p.ids.includes(c.id)).area;
  const kind = R.free ? 'prism' : area, last = R.i + 1 >= R.list.length;
  const foot = R.unseal ? 'Caught in the Safari Zone: its sealed capsule opened!' : starLine(stars);
  const dots = R.list.map((x, k) => {
    const shown = ph === 'done' || k < R.i || (k === R.i && ph === 'shiny');
    return `<i class="${shown ? 'on' : ''}${shown && x.gold ? ' gold' : ''}"></i>`;
  }).join('');
  if (ph === 'done') {
    const sealed = R.list.filter(x => x.sealed).length;
    box.innerHTML = `<header class="sx-rv-top"><b>${R.list.length} CAPSULES</b></header><div class="sx-dots">${dots}</div>
      <div class="sx-all"><h3>${(n => `${n} NEW SHIN${n === 1 ? 'Y' : 'IES'}`)(R.list.filter(x => x.gain?.isNew).length)}${sealed ? ` · ${sealed} SEALED` : ''}</h3><div class="sx-all-grid">${R.list.map((x, k) => `<div class="sx-got${x.gold ? ' gold' : ''}${x.sealed ? ' sealed' : ''}" style="animation-delay:${k * 50}ms">
        <img class="pixel" src="${shinyImage(x.id)}" alt=""><b>${x.sealed ? seenName(x.id) : nameOf(x.id)}</b><small>${x.sealed ? 'SEALED' : x.gain.isNew ? 'NEW' : x.gain.maxed ? `+${x.stars}★` : `★${x.gain.level}`}</small></div>`).join('')}</div></div>
      <footer class="sx-rv-foot"><p>${foot}</p><button type="button" class="sx-btn line" data-act="done">Done</button></footer>`;
    return;
  }
  const trayCls = ph === 'drop' ? 'drop' : ph === 'wait' && calmFx() ? (R.unseal ? 'cleared' : c.gold && !R.free ? 'golden' : '') : '';
  const what = R.free ? 'LUCKY STAR CAPSULE' : R.unseal ? 'SEALED CAPSULE' : multi ? 'CAPSULE' : 'SHINY CAPSULE';
  box.innerHTML = `<header class="sx-rv-top"><b>${multi ? `${what} ${R.i + 1} / ${R.list.length}` : what}</b>
      ${multi ? '<button type="button" class="sx-btn ghost small" data-act="skip">Skip to all</button>' : ''}</header>
    <div class="sx-dots">${dots}</div>
    <div class="sx-screen"><div class="sx-led"></div><i class="sx-scan" aria-hidden="true"></i><i class="sx-dotmask" aria-hidden="true"></i></div>
    <div class="sx-tray ${trayCls}${c.gold && !R.free ? ' has-gold' : ''}">
      ${ph === 'shiny' ? '<span class="sx-tray-label">CAPSULE TRAY</span>' : `<button type="button" class="sx-tray-cap" data-act="open" aria-label="Open the capsule"${ph === 'wait' ? '' : ' disabled'}>
        <span class="sx-cap-wrap plain">${capsule(R.unseal ? 'sealed' : kind, !calmFx())}</span>
        ${R.unseal ? `<span class="sx-cap-wrap clear">${capsule(kind, !calmFx())}</span>` : ''}
        ${c.gold && !R.free ? `<span class="sx-cap-wrap goldcap">${capsule('gold', !calmFx())}</span><span class="sx-ring" aria-hidden="true"></span>` : ''}
        <span class="sx-burst" aria-hidden="true">${burst()}</span></button><span class="sx-tray-shadow" aria-hidden="true"></span>`}
    </div>
    <footer class="sx-rv-foot"><p>${foot}</p>
      ${ph === 'shiny' && multi ? `<button type="button" class="sx-btn cyan" data-act="next">${last ? 'SEE THEM ALL' : 'NEXT CAPSULE'}</button>` : ''}
      ${ph === 'shiny' && !multi && !R.free && !R.unseal && S.area ? `<button type="button" class="sx-btn gold" data-act="again"${(getSave().coins ?? 0) < PULL_COST ? ' disabled' : ''}>PULL AGAIN · ${fmt(PULL_COST)}</button>` : ''}
      ${ph === 'shiny' && !multi ? '<button type="button" class="sx-btn line" data-act="done">Done</button>' : ''}
    </footer>`;
  drawScreen();
}

/* ---------- taps ---------- */

function pull(n) {
  const got = exchangePull(S.area, n);
  if (!got) { playSound('cancel'); return toast('Not enough PokéCoins for that.'); }
  playSound('buy');
  refreshCoins();
  render();
  startReveal(got);
}

function take(id) {
  const gain = exchangePick(id);
  if (!gain) return;
  S.picking = false;
  render();
  startReveal([{ id, gold: false, gain, stars: 0 }], true);
}

function onClick(e) {
  const b = e.target.closest('button');
  if (e.target === dlg) return close();
  if (!b || b.disabled) return;
  const act = b.dataset.act;
  if (b.classList.contains('sx-close')) return close();
  if (b.classList.contains('sx-back')) { playSound('cancel'); S.area = null; render(); dlg.querySelector('.sx-body').scrollTop = 0; return; }
  if (b.dataset.area) { playSound('confirm'); S.area = b.dataset.area; S.filter = 'all'; render(); dlg.querySelector('.sx-body').scrollTop = 0; return; }
  if (b.dataset.filter) { playSound('select'); S.filter = b.dataset.filter; render(); return; }
  if (b.dataset.pull) return pull(+b.dataset.pull);
  if (b.dataset.id) { if (b.classList.contains('take')) take(b.dataset.id); return; }
  if (act === 'pick') { playSound('confirm'); S.picking = true; render(); return toast('Open a biome and tap any Pokémon you\'ve caught.'); }
  if (act === 'unpick') { playSound('cancel'); S.picking = false; return render(); }
  if (act === 'open') return openCapsule();
  if (act === 'next') return nextCapsule();
  if (act === 'skip') { stopTimers(); S.reveal.phase = 'done'; return drawReveal(); }
  if (act === 'again') { closeReveal(); return pull(1); }
  if (act === 'done') { playSound('confirm'); return closeReveal(); }
}

function build() {
  dlg = document.createElement('dialog');
  dlg.className = `shiny-ex${calmFx() ? ' calm' : ''}`;
  dlg.setAttribute('aria-label', 'Shiny Exchange');
  dlg.innerHTML = `<div class="sx-frame">
      <header class="sx-top">
        <button type="button" class="sx-key sx-back" aria-label="Back to the biomes" hidden>‹</button>
        <button type="button" class="sx-key sx-close" aria-label="Close">✕</button>
        <div class="sx-title"><h2>SHINY EXCHANGE</h2><span class="sx-sub"></span></div>
        <span class="sx-coins">${COIN}<b></b></span>
      </header>
      <div class="sx-body"></div>
      <div class="sx-reveal" hidden></div>
      <p class="sx-toast" role="status" hidden></p>
    </div>`;
  dlg.addEventListener('click', onClick);
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); if (S.reveal) { if (S.reveal.phase === 'shiny' || S.reveal.phase === 'done') closeReveal(); } else if (S.area) { S.area = null; render(); } else close(); });
  document.body.append(dlg);
}

function close() {
  if (!dlg) return;
  stopTimers();
  clearTimeout(toast.t);
  playSound('cancel');
  dlg.close();
  dlg.remove();
  dlg = null;
  Object.assign(S, { area: null, filter: 'all', picking: false, reveal: null, after: false });
  refreshCoins();
  const done = onDone;
  onDone = null;
  done?.();
}

/** The capsules a reveal of `gains` (openSealed()'s) opens. */
const unsealed = (id, gains) => gains.map(gain => ({ id, gold: false, gain, stars: 0 }));

/** The Exchange, over the Outfitter. `done` runs as it closes. A Pokémon caught with its sealed capsules still shut
    (the tab closed on the catch's rewards) opens them first. */
export function openShinyExchange(done = null) {
  if (dlg) return;
  onDone = done;
  build();
  render();
  dlg.showModal();
  playSound('confirm');
  const shut = staleSealed().flatMap(id => unsealed(id, openSealedCapsules(id)));
  if (shut.length) { render(); startReveal(shut, false, true); }
}

/** A Safari catch of `id` opening its sealed capsules (`gains`, openSealed()'s; js/run.js saves them with the
    rewards): the window is only the reveal, each capsule's dark glass clearing to the shadow before it opens. */
export function openSealedReveal(id, gains, done) {
  if (dlg || !gains.length) return done();
  onDone = done;
  S.after = true;
  build();
  dlg.showModal();
  startReveal(unsealed(id, gains), false, true);
}
