/* ============================================================
   statsdex.js  -  the Collection device's Stats app, "Trainer Data",
   made like its Pokédex app (the user's pick, 2026-10-06): a banner per
   section (Runs, Battles, Collection, Wallet, Champions), then the red
   handheld on that section. Its numbers are seven-segment LCD digits
   that count up as the page opens, runs read as a battle nameplate's
   HP bar, the bosses are badge slots that light up once beaten, and
   the champions sit in a PC Box.
   ============================================================ */

import { getSave, loadRunData } from './storage.js';
import { STARTERS, spriteUrl } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { ALL_CARDS, TYPES } from './data/cards.js';
import { RELICS } from './data/relics.js';
import { ITEMS } from './data/items.js';
import { BIOMES, ENEMY_DEFS } from './data/enemies.js';
import { MAX_LEVEL } from './data/difficulty.js';
import { DEX_PAGES } from './data/pokedex.js';
import { researchCount, progressBar, still, sceneImg } from './pokedex.js';
import { el, itemSprite } from './ui.js';
import { smoothIcon } from './smooth-icons.js';
import { playCry, playSound } from './audio.js';

const DEX_IDS = new Set(DEX_PAGES.flatMap(p => p.ids));   // the Depths' page is counted apart
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const BOX = 30;   // a PC Box: 6 x 5

/* ---------- the numbers, read from the save each time ---------- */

function numbers() {
  const save = getSave();
  const s = save.stats;
  const inRun = loadRunData() ? 1 : 0;
  const finished = Math.max(0, s.runsStarted - inRun);
  const winsOf = (type) => STARTERS.filter(st => st.type === type).reduce((n, st) => n + (s.winsBy[st.id] || 0), 0);
  const [researched, entries] = researchCount();
  const seenCards = new Set(save.seen.cards);
  const champs = STARTERS.filter(st => (s.winsBy[st.id] || 0) > 0).sort((a, b) => s.winsBy[b.id] - s.winsBy[a.id]);
  const collection = [
    ['Starters', STARTERS.filter(st => st.free || save.unlocked.includes(st.id)).length, STARTERS.length],
    ['Shinies', save.shiny.owned.length, STARTERS.filter(st => !st.secret || save.shiny.owned.includes(st.id)).length],
    ['Pokédex', save.dex.defeated.filter(id => DEX_IDS.has(id)).length, entries],
    ['Research', researched, entries],
    ['Moves', ALL_CARDS.filter(c => seenCards.has(c.id)).length, ALL_CARDS.length],
    ['Relics', save.seen.relics.length, RELICS.length],
    ['Items', save.seen.items.length, ITEMS.length],
  ];
  return {
    save, s, inRun, finished, winsOf, champs, collection,
    lost: Math.max(0, s.runsStarted - s.runsWon - inRun),
    bestLevel: Math.max(...Object.values(s.maxLevelWinByType)),
    biomes: BIOMES.filter((b, i) => !b.secret || s.deepestBiome > i),
  };
}

const finalStage = (st) => st.line.length - 1;

/** A starter's sprite, at its final stage (a champion finished its run evolved). */
function mon(st, cls, stage = finalStage(st)) {
  const img = el('img', `pixel ${cls}`);
  img.src = spriteUrl(st, 'front', stage);
  img.alt = '';
  img.draggable = false;
  return img;
}

const heads = new Map();

/** Where a sprite's head is, in GIF pixels: [x, y, size] of a square. The top of the body is the head on almost
    every Pokémon, so it takes a square off the top of the median pose (spriteFit) and centres it on the opaque
    pixels there. HEAD_FIX overrides the few where something else stands higher (a bulb, wings). */
function headBox(img) {
  const src = img.currentSrc || img.src;
  if (heads.has(src)) return heads.get(src);
  const W = img.naturalWidth, H = img.naturalHeight;
  const [top, bottom, left, right] = spriteFit(src);
  const bw = W - left - right, bh = H - top - bottom;
  const size = Math.max(16, Math.round(Math.min(bw, bh) * 0.62));
  let cx = left + bw / 2;
  try {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, top, W, Math.min(size, bh)).data;
    let sum = 0, n = 0;
    for (let y = 0; y < Math.min(size, bh); y++) for (let x = 0; x < W; x++) if (px[(y * W + x) * 4 + 3] > 40) { sum += x; n++; }
    if (n) cx = sum / n;
  } catch { /* tainted or not decoded: centre on the body */ }
  const fix = HEAD_FIX[src.split('/').pop().replace(/-shiny/, '').replace(/\.\w+$/, '')];
  const box = fix || [Math.min(Math.max(cx - size / 2, 0), W - size), Math.min(Math.max(top - size * 0.08, 0), H - size), size];
  heads.set(src, box);
  return box;
}

/** Hand-placed heads, [x, y, size] in GIF pixels, for the stage-0 sprites the measure gets wrong: a flame, leaf
    or crest above the head, a head off to one side, or wings flapping over it (those get a looser square). */
const HEAD_FIX = {
  'cyndaquil-front': [2, 8, 22], 'chikorita-front': [1, 23, 24], 'tepig-front': [2, 12, 24],
  'torchic-front': [4, 10, 22], 'mudkip-front': [0, 20, 24], 'chimchar-front': [4, 6, 30],
  'victini-front': [12, 22, 32], 'hooh-front': [14, 40, 34], 'moltres-front': [16, 34, 36],
  'virizion-front': [10, 5, 26], 'suicune-front': [2, 18, 28], 'entei-front': [23, 5, 32],
  'kyogre-front': [18, 32, 32], 'lugia-front': [44, 44, 32], 'palkia-front': [0, 10, 34],
  'reshiram-front': [20, 0, 40], 'heatran-front': [14, 6, 30], 'manaphy-front': [4, 10, 30],
  'keldeo-front': [4, 6, 26], 'rayquaza-front': [16, 20, 28], 'mewtwo-front': [14, 4, 24],
};

/** A starter's head in a square slot, the same size for every Pokémon whatever its GIF's size. */
function headShot(st, stage) {
  const frame = el('span', 'sdx-slot-pic');
  const img = mon(st, 'sdx-slot-mon', stage);
  const place = () => {
    const [x, y, s] = headBox(img);
    Object.assign(img.style, {
      width: `${img.naturalWidth / s * 100}%`, height: `${img.naturalHeight / s * 100}%`,
      left: `${-x / s * 100}%`, top: `${-y / s * 100}%`,
    });
    frame.classList.add('ready');
  };
  if (img.complete && img.naturalWidth) place(); else img.addEventListener('load', place, { once: true });
  frame.append(img);
  return frame;
}

function enemyImg(id, cls) {
  const img = el('img', `pixel ${cls}`);
  img.src = ENEMY_DEFS[id].image;
  img.alt = '';
  img.draggable = false;
  return img;
}

/* ---------- seven-segment digits ---------- */

// segments a b c d e f g, lit per character
const SEGS = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '',
};
const SHAPE = {
  a: 'M2.4 1h7.2l-1.4 1.6H3.8Z', d: 'M2.4 19h7.2l-1.4-1.6H3.8Z', g: 'M2.6 10l1.2-.9h4.4l1.2.9-1.2.9H3.8Z',
  f: 'M1.6 1.8l1.6 1.6v5.2L1.6 9.4Z', b: 'M10.4 1.8L8.8 3.4v5.2l1.6.8Z',
  e: 'M1.6 10.6l1.6.8v5.2l-1.6 1.6Z', c: 'M10.4 10.6l-1.6.8v5.2l1.6 1.6Z',
};
const NS = 'http://www.w3.org/2000/svg';

/** `text` as LCD digits: every segment drawn, the unlit ones a faint ghost like a real panel. */
function segInto(node, text) {
  node.replaceChildren();
  for (const ch of String(text)) {
    if (ch === ',') { node.append(el('span', 'seg-comma', ',')); continue; }
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 12 20');
    svg.setAttribute('class', 'seg-digit');
    const lit = SEGS[ch] ?? '';
    for (const k of 'abcdefg') {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', SHAPE[k]);
      if (lit.includes(k)) p.setAttribute('class', 'on');
      svg.append(p);
    }
    node.append(svg);
  }
}

const group = (n) => n.toLocaleString('en-US');

/** A readout: a label over a number in LCD digits, counted up from 0 when the page opens (countUp()). */
function readout(label, value, { note = '', icon = null, cls = '' } = {}) {
  const box = el('div', `sdx-readout ${cls}`);
  const head = el('span', 'sdx-readout-label');
  if (icon) head.append(smoothIcon(icon));
  head.append(label);
  const num = el('span', 'sdx-seg');
  num.dataset.value = typeof value === 'number' ? value : '';
  segInto(num, typeof value === 'number' ? group(value) : value);
  num.setAttribute('aria-label', String(value));
  box.append(head, num);
  if (note) box.append(note instanceof Node ? note : el('small', 'sdx-note', note));
  return box;
}

let counting = 0;
/** Every readout on the page counts up together, with a tick now and then. */
function countUp(root) {
  const nums = [...root.querySelectorAll('.sdx-seg')].filter(n => n.dataset.value !== '' && +n.dataset.value > 0);
  const token = ++counting;
  if (calm() || !nums.length) return;
  const ends = nums.map(n => +n.dataset.value);
  const width = nums.map(n => group(+n.dataset.value).length);
  const pad = (v, w) => group(v).padStart(w, ' ');
  const t0 = performance.now(), length = 900;
  let lastTick = 0;
  nums.forEach((n, i) => segInto(n, pad(0, width[i])));
  const frame = (now) => {
    if (token !== counting || !nums[0].isConnected) return;
    const k = Math.min(1, (now - t0) / length);
    const ease = 1 - (1 - k) ** 3;
    nums.forEach((n, i) => segInto(n, pad(Math.round(ends[i] * ease), width[i])));
    if (k < 1 && now - lastTick > 75) { playSound('stat-tick'); lastTick = now; }
    if (k < 1) requestAnimationFrame(frame);
    else nums.forEach((n, i) => segInto(n, group(ends[i])));
  };
  requestAnimationFrame(frame);
}

/* ---------- the sections ---------- */

const SECTIONS = [
  {
    id: 'runs', name: 'Runs', sub: 'Wins and losses', b1: '#9ab4d8', b2: '#34486e',
    count: (n) => `${n.s.runsWon} won`,
    art(n) {
      const top = n.champs[0];
      const shelf = el('span', 'pdx-banner-mons sdx-podium');
      shelf.append(el('span', 'sdx-spot'), top ? mon(top, 'sdx-podium-mon') : el('span', 'sdx-podium-empty', '?'), el('span', 'sdx-pedestal'));
      return shelf;
    },
    page(n) {
      const { s } = n;
      const rate = n.finished ? s.runsWon / n.finished : 0;
      const plate = el('div', 'pdx-lcd sdx-hp');
      const top = el('div', 'sdx-hp-top');
      top.append(el('b', '', 'TRAINER'), el('span', 'sdx-hp-lv', `:L${s.runsStarted}`));
      const bar = el('div', 'sdx-hp-bar');
      bar.append(el('span', 'sdx-hp-tag', 'WIN'));
      const track = el('span', 'sdx-hp-track');
      const fill = el('i', `sdx-hp-fill${rate < 0.2 ? ' red' : rate < 0.5 ? ' yellow' : ''}`);
      fill.style.setProperty('--to', `${rate * 100}%`);
      track.append(fill);
      bar.append(track);
      plate.append(top, bar, el('div', 'sdx-hp-num', n.finished ? `${s.runsWon}/ ${n.finished}   ${Math.round(rate * 100)}%` : 'NO RUNS YET'));
      const grid = el('div', 'sdx-readouts');
      grid.append(
        readout('Won', s.runsWon, { icon: 'trophy' }),
        readout('Lost', n.lost, { icon: 'skull', note: n.inRun ? '+1 in progress' : '' }),
        readout('Best Lv', n.bestLevel >= 0 ? n.bestLevel : '-', { icon: 'star', note: `Unlocked ${n.save.maxLevel}/${MAX_LEVEL}` }),
      );
      const types = el('div', 'sdx-readouts sdx-types');
      types.append(...['fire', 'grass', 'water'].map(t => {
        const best = s.maxLevelWinByType[t];
        const stars = el('small', 'sdx-stars');
        stars.title = best >= 0 ? `Best: Level ${best}` : 'No win yet';
        for (let i = 1; i <= MAX_LEVEL; i++) stars.append(el('span', i <= best ? 'on' : '', '★'));
        return readout(TYPES[t].label, n.winsOf(t), { icon: t, note: stars, cls: `type-${t}` });
      }));
      return [plate, grid, head('Wins by type'), types];
    },
  },
  {
    id: 'battles', name: 'Battles', sub: 'Every fight', b1: '#6cc85a', b2: '#2b7a3a',
    count: (n) => `${group(n.s.enemiesDefeated)} defeated`,
    scene: (n) => BIOMES[Math.max(0, (n.s.deepestBiome || 1) - 1)].id,
    art(n) {
      const biome = BIOMES[Math.max(0, (n.s.deepestBiome || 1) - 1)];
      const beaten = biome.bosses.filter(id => n.save.dex.defeated.includes(id));
      const shelf = el('span', 'pdx-banner-mons');
      for (const id of (beaten.length ? beaten : biome.bosses).slice(0, 2)) {
        shelf.append(enemyImg(id, `pdx-banner-mon${beaten.includes(id) ? '' : ' unseen'}`));
      }
      return shelf;
    },
    page(n) {
      const { s } = n;
      const grid = el('div', 'sdx-readouts');
      const furthest = s.deepestBiome ? BIOMES[s.deepestBiome - 1].name : 'Not yet';
      grid.append(
        readout('Defeated', s.enemiesDefeated, { icon: 'swords' }),
        readout('Alphas', s.elitesDefeated, { icon: 'boss' }),
        readout('Furthest', s.deepestBiome || '-', { icon: 'map', note: furthest }),
      );
      const out = [grid, head('Bosses')];
      const defeated = new Set(n.save.dex.defeated);
      n.biomes.forEach((biome, i) => {
        const row = el('div', `pdx-lcd sdx-bosses biome-${biome.id}`);
        const top = el('div', 'sdx-bosses-top');
        const kills = s.bossKills[i + 1] || 0;
        top.append(el('b', '', biome.name), el('span', 'sdx-kills', `×${kills}`));
        const slots = el('div', 'sdx-boss-slots');
        for (const id of biome.bosses) {
          const got = defeated.has(id);
          const slot = el('span', `sdx-boss${got ? ' got' : ''}`);
          slot.title = got ? ENEMY_DEFS[id].name : '???';
          slot.append(enemyImg(id, 'sdx-boss-mon'));
          slots.append(slot);
        }
        row.append(top, slots);
        out.push(row);
      });
      return out;
    },
  },
  {
    id: 'collection', name: 'Collection', sub: 'Everything found', b1: '#5ac0b0', b2: '#1e5a5a',
    count: (n) => {
      const [got, all] = n.collection.reduce(([g, a], [, x, y]) => [g + x, a + y], [0, 0]);
      return `${Math.floor((got / all) * 100)}% found`;
    },
    art(n) {
      const shelf = el('span', 'pdx-banner-mons sdx-fan');
      for (const t of ['fire', 'grass', 'water']) {
        const card = el('span', `sdx-fan-card type-${t}`);
        card.append(smoothIcon(t));
        shelf.append(card);
      }
      const relic = RELICS.find(r => n.save.seen.relics.includes(r.id));
      const item = ITEMS.find(i => n.save.seen.items.includes(i.id));
      if (relic) shelf.append(itemSprite(relic, 'sdx-fan-thing'));
      if (item) shelf.append(itemSprite(item, 'sdx-fan-thing'));
      return shelf;
    },
    page(n) {
      const box = el('div', 'pdx-lcd sdx-scan');
      for (const [label, got, all] of n.collection) {
        const row = el('div', `sdx-scan-row${got >= all ? ' done' : ''}`);
        row.append(el('span', 'sdx-scan-label', `${got >= all ? '★ ' : ''}${label}`), el('b', '', `${got}/${all}`), progressBar(got, all));
        box.append(row);
      }
      return [box];
    },
  },
  {
    id: 'wallet', name: 'Wallet', sub: 'PokéCoins', b1: '#f0b838', b2: '#8a5208',
    count: (n) => `${group(n.save.coins)} coins`,
    art() {
      const shelf = el('span', 'pdx-banner-mons sdx-coin');
      shelf.append(smoothIcon('coin'));
      return shelf;
    },
    page(n) {
      const grid = el('div', 'sdx-readouts sdx-wide');
      grid.append(
        readout('PokéCoins now', n.save.coins, { icon: 'coin' }),
        readout('Earned in all', n.s.coinsEarned, { icon: 'cash', note: 'Counted since 28 Sep 2026' }),
        readout('Most Tide held', n.s.maxTide, { icon: 'water' }),
      );
      return [grid];
    },
  },
  {
    id: 'champions', name: 'Champions', sub: 'Your winners', b1: '#5a6ac8', b2: '#10163a',
    count: (n) => `${n.champs.length} champion${n.champs.length === 1 ? '' : 's'}`,
    art(n) {
      const shelf = el('span', 'pdx-banner-mons sdx-champ-row');
      for (const st of n.champs.slice(0, 3).reverse()) shelf.append(mon(st, 'pdx-banner-mon'));
      if (!n.champs.length) shelf.append(el('span', 'sdx-podium-empty', '?'));
      return shelf;
    },
    page: championsPage,
  },
];

const head = (text) => el('h4', 'sdx-head', text);

/* ---------- Champions: a PC Box ---------- */

function championsPage(n) {
  const { s, champs, save } = n;
  const crown = champs[0];
  const bestLv = (st) => Math.max(-1, ...(save.hallOfFame || []).filter(e => e.starter === st.id && typeof e.level === 'number').map(e => e.level));
  const card = el('div', 'pdx-lcd sdx-summary');
  const show = (st) => {
    if (!st) {
      card.replaceChildren(el('p', 'sdx-empty', 'Win a run and your champion takes a slot in the Box.'));
      return;
    }
    const pic = el('span', 'sdx-summary-pic');
    pic.append(mon(st, 'sdx-summary-mon'));
    const info = el('div', 'sdx-summary-info');
    const lv = bestLv(st);
    const name = el('b', 'sdx-summary-name', st.line[finalStage(st)].name);
    if (st === crown) name.prepend(el('span', 'sdx-crown', '♛ '));
    info.append(name, el('span', `index-only type-${st.type}`, `${TYPES[st.type].icon} ${TYPES[st.type].label}`),
      el('span', '', `Wins: ${s.winsBy[st.id]}`),
      el('span', '', lv >= 0 ? `Best: Level ${lv}${(s.level5WinsBy?.[st.id] || 0) ? ' ⭐' : ''}` : 'Best: -'));
    card.replaceChildren(pic, info);
  };
  const box = el('div', 'sdx-box');
  const title = el('div', 'sdx-box-title', 'BOX 1');
  const slots = el('div', 'sdx-box-slots');
  const size = Math.max(BOX, Math.ceil(champs.length / 6) * 6);
  for (let i = 0; i < size; i++) {
    const st = champs[i];
    const slot = el('button', `sdx-slot${st ? '' : ' empty'}`);
    slot.type = 'button';
    if (!st) { slot.disabled = true; slots.append(slot); continue; }
    slot.setAttribute('aria-label', `${st.line[finalStage(st)].name}: ${s.winsBy[st.id]} wins`);
    slot.append(headShot(st, 0));
    if (st === crown) slot.append(el('span', 'sdx-slot-crown', '♛'));
    if (save.shiny.on.includes(st.id)) slot.classList.add('shiny');
    slot.addEventListener('click', () => {
      slots.querySelector('.on')?.classList.remove('on');
      slot.classList.add('on');
      show(st);
      playCry(st.line[finalStage(st)].id);
    });
    if (st === crown) slot.classList.add('on');
    slots.append(slot);
  }
  box.append(title, slots);
  show(crown);
  return [card, box];
}

/* ---------- the app ---------- */

export const statsApp = (() => {
  let host, list, stage;
  let view = 'list', at = 0, busy = false;

  function renderList() {
    const n = numbers();
    const wrap = el('div', 'pdx-banners');
    wrap.append(...SECTIONS.map(sec => {
      const b = el('button', `pdx-banner sdx-banner sdx-${sec.id}`);
      b.type = 'button';
      b.style.setProperty('--b1', sec.b1);
      b.style.setProperty('--b2', sec.b2);
      if (sec.scene) b.append(sceneImg(still(sec.scene(n), 150, 46, 0.56), 'pdx-banner-art'), el('span', 'pdx-banner-shade'));
      b.append(el('span', 'pdx-stripe'), el('strong', 'pdx-banner-name', sec.name), el('span', 'pdx-banner-sub', sec.sub),
        el('span', 'pdx-banner-count', sec.count(n)), sec.art(n));
      b.addEventListener('click', () => openSection(SECTIONS.indexOf(sec), b));
      return b;
    }));
    list.replaceChildren(wrap);
  }

  function renderPage() {
    const dev = el('div', 'pdx-device sdx-device');
    const body = el('div', 'pdx-body');
    const controls = el('div', 'pdx-controls');
    const step = (dir, label, glyph) => {
      const b = el('button', 'pdx-round', glyph);
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.addEventListener('click', () => show(at + dir));
      return b;
    };
    controls.append(step(-1, 'Previous', '◀'), el('span', 'pdx-lcd pdx-counter'), step(1, 'Next', '▶'));
    dev.append(body, controls);
    stage.replaceChildren(dev);
    fill();
  }

  function fill() {
    const sec = SECTIONS[at];
    const dev = stage.querySelector('.pdx-device');
    dev.style.setProperty('--b1', sec.b1);
    dev.style.setProperty('--b2', sec.b2);
    dev.dataset.section = sec.id;
    const nameplate = el('div', 'pdx-lcd pdx-nameplate');
    nameplate.append(el('span', 'pdx-name', `TRAINER DATA · ${sec.name.toUpperCase()}`));
    const body = dev.querySelector('.pdx-body');
    body.replaceChildren(nameplate, ...sec.page(numbers()));
    dev.querySelector('.pdx-counter').textContent = `${at + 1} / ${SECTIONS.length}`;
    countUp(body);
  }

  function show(i) {
    if (busy) return;
    at = (i + SECTIONS.length) % SECTIONS.length;
    stage.scrollTop = 0;
    fill();
  }

  /* opening and shutting: the banner zooms up into the device, and back (as js/bagdex.js) */
  const EASE = 'cubic-bezier(0.2, 0.8, 0.25, 1)';
  const settle = (anim) => anim.finished.catch(() => {});
  function overBanner(dev, box) {
    const d = dev.getBoundingClientRect();
    const h = Math.max(1, Math.min(d.height, innerHeight - Math.max(0, d.top)));
    return `translate(${box.left - d.left}px, ${box.top - d.top}px) scale(${box.width / d.width}, ${box.height / h})`;
  }

  async function openSection(i, from) {
    if (busy) return;
    at = i;
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
    busy = false;
  }

  async function backToList() {
    if (busy || view === 'list') return;
    const dev = stage.querySelector('.pdx-device');
    playSound('dex-off');
    counting++;
    if (!calm() && dev) {
      busy = true;
      stage.scrollTop = 0;
      const box = list.querySelector(`.sdx-${SECTIONS[at].id}`)?.getBoundingClientRect();
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
    mount(panel) {
      host = panel;
      list = el('div', 'pdx-list');
      stage = el('div', 'pdx-stage');
      stage.hidden = true;
      host.append(list, stage);
      view = 'list';
      busy = false;
      renderList();
    },
    back() {
      if (busy) return true;
      if (view === 'list') return false;
      backToList();
      return true;
    },
    key(e) {
      const step = view === 'page' && { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step) return false;
      show(at + step);
      return true;
    },
    unmount() { busy = false; counting++; },
  };
})();
