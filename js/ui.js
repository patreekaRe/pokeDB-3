/* ============================================================
   ui.js  -  small helpers every screen shares:
   switching screens, dialogs, and the card element.
   ============================================================ */

import { TYPES, CARDS_BY_ID, describe, keywords, termTips, cardTerms } from './data/cards.js';
import { ITEM_FIT } from './data/item-fit.js';
import { relicTerms } from './data/relics.js';
import { getSave } from './storage.js';
import { playMusic, playSound } from './audio.js';

/** Shorthand for document.getElementById. */
export const $ = (id) => document.getElementById(id);

/** Wait for a number of milliseconds (use with `await`). */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/** Build an element in one line: el('div', 'card big', 'Hello'). */
export function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/** A pixel-art ∞ (the pixel font has none), 9x5 pixels, sized by `--ip` in CSS (`.inf-px`). */
export function infGlyph() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 9 5');
  svg.setAttribute('class', 'inf-px');
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('aria-label', 'unlimited');
  svg.innerHTML = '<path fill="currentColor" d="M1 0h2v1h-2zM6 0h2v1h-2zM0 1h1v3h-1zM8 1h1v3h-1zM3 1h1v1h-1zM5 1h1v1h-1zM4 2h1v1h-1zM3 3h1v1h-1zM5 3h1v1h-1zM1 4h2v1h-2zM6 4h2v1h-2z"/>';
  return svg;
}

/* ---------- screens ---------- */

const SCREENS = ['start-screen', 'collection-screen', 'map-screen', 'reward-screen', 'battle-screen'];

// The screens of a run in progress: they pick their own music, and only they show the Bag.
const RUN_SCREENS = ['map-screen', 'battle-screen', 'reward-screen'];

/** Show one screen and hide the others. */
export function showScreen(id) {
  SCREENS.forEach(s => { $(s).hidden = s !== id; });
  document.body.dataset.screen = id;
  const inRun = RUN_SCREENS.includes(id);
  $('bag-btn').hidden = !inRun;
  $('money-pill').hidden = !inRun;
  // in a run the Shop moves into the Pokédex's dock, leaving the top bar to the run's own ₽ and Bag
  $('shop-btn').hidden = inRun;
  $('bag').hidden = true;
  $('bag-btn').setAttribute('aria-expanded', 'false');
  // the map, battles and reward screens pick their own track (biome theme, fight music, victory, Pokémon Center)
  if (!inRun) playMusic('title');
  window.scrollTo(0, 0);
}

/** Tint the page with the starter type's accent colour (or none). */
export function setTheme(type) {
  document.body.dataset.theme = type || '';
}

/** Refresh every on-screen PokéCoin balance from the save. Call this after coins change. */
export function refreshCoins() {
  const coins = getSave().coins;
  for (const node of document.querySelectorAll('.coin-value')) node.textContent = String(coins);
}

/* ---------- dialogs (built on the <dialog> element) ---------- */

export function openDialog(id) {
  const d = $(id);
  if (!d.open) d.showModal();
}
export function closeDialog(id) {
  const d = $(id);
  if (d.open) d.close();
}

/* A tap on the dimmed backdrop, outside a window, closes it like Escape (the user's call: every window closes that way).
   A window that moves the game along has a button that stands in for closing it: No, the result's Main menu, Continue. */
const OUTSIDE_TAP = { 'confirm-dialog': 'confirm-no', 'result-dialog': 'result-menu', 'unlock-dialog': 'unlock-ok' };
let downOn = null;   // where the press began, so a drag that ends on the backdrop (selecting text, a swipe) isn't a tap outside
document.addEventListener('pointerdown', (e) => { downOn = e.target; }, true);
document.addEventListener('click', (e) => {
  const d = e.target;
  if (!(d instanceof HTMLDialogElement) || !d.open || !d.matches(':modal') || downOn !== d || !e.detail) return;
  const r = d.getBoundingClientRect();
  if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return;
  const stand = OUTSIDE_TAP[d.id];
  if (stand) return $(stand).click();
  if (!d.dataset.closeSound) playSound('cancel', 'confirm');
  d.close();
});

/** Ask a yes/no question. Use it like:  if (await confirmDialog('Sure?')) { ... } */
export function confirmDialog(question, yesLabel = 'Yes') {
  $('confirm-text').textContent = question;
  $('confirm-yes').textContent = yesLabel;
  openDialog('confirm-dialog');
  return new Promise(resolve => {
    const finish = (answer) => {
      $('confirm-yes').onclick = $('confirm-no').onclick = null;
      closeDialog('confirm-dialog');
      resolve(answer);
    };
    $('confirm-yes').onclick = () => finish(true);
    $('confirm-no').onclick = () => finish(false);
  });
}

/* ---------- the card element ---------- */

/**
 * Build the HTML for one card.
 *   options.stage    evolution stage (moves get stronger, so the text changes)
 *   options.count    show a ×N badge (used when the same card is in the deck several times)
 */
export function makeCard(card, options = {}) {
  const type = TYPES[card.type];
  const node = el('div', `card type-${card.type}${card.upgraded ? ' upgraded' : ''}${card.status ? ' status' : ''}`);
  node.dataset.id = card.id;

  // options.cost: what it costs right now in battle (Mind Blown, Blue Flare), green when cheaper, red when dearer.
  // A Max Mushrooms roll is a copy with the rolled cost that keeps the real card as `orig`, so compare against that.
  const shown = options.cost ?? card.cost;
  const normal = card.orig?.cost ?? card.cost;
  const shift = typeof shown !== 'number' || shown === normal ? '' : shown < normal ? ' cheaper' : ' dearer';
  const cost = el('span', `card-cost${shift}`, String(shown));
  cost.title = card.cost === 'X' ? 'Costs all your energy' : `Costs ${shown} energy${shift ? ` right now (normally ${normal})` : ''}`;
  if (card.unplayable) cost.hidden = true;

  const name = el('h3', 'card-name', card.name);
  // pixel letters can't break inside a word, so a long one (Flamethrower) shrinks to fit the card
  const longest = Math.max(...card.name.split(/[ -]/).map(w => w.length));
  if (longest > 9) name.style.setProperty('--name-fit', (9.4 / longest).toFixed(3));
  const art = card.sprite ? cardSprite(card) : el('div', 'card-art', card.art);
  const tag = el('div', 'card-type', `${type.icon} ${type.label}`);
  const text = el('p', 'card-text');
  text.append(cardLine(card, options.stage || 0));

  // The outer .card sets the size; the inner .card-face is what you see.
  // (Text inside sizes itself from the card's width, see cards.css.)
  const face = el('div', 'card-face');
  face.append(cost, name, art, tag, text);
  // the TCG's rarity symbol (● ◆ ★) opposite the cost; a starting card counts as common, signature moves and junk have none
  const rarity = card.rarity || (card.evoOnly || card.token || card.status || card.safari ? null : 'common');
  if (rarity) {
    const gem = el('span', `card-rarity ${rarity}`);
    gem.title = rarity[0].toUpperCase() + rarity.slice(1);
    face.append(gem);
  }
  node.append(face);

  if (options.count > 1) node.append(el('span', 'in-deck', `×${options.count}`));
  fitWatch.observe(node);
  return node;
}

function cardLine(card, stage) {
  const words = keywords(card);
  const kw = ([label, tip]) => { const k = el('b', 'card-kw', `${label}.`); k.title = tip; return k; };
  // one wrapper, since .card-text is a grid and would give each piece its own row
  const line = el('span');
  line.append(...words.lead.flatMap(w => [kw(w), ' ']), ...colourTerms(describe(card, stage), card), ...words.tail.flatMap(w => [' ', kw(w)]));
  const tips = termTips(card);
  if (tips.length) line.title = tips.join(' ');
  return line;
}

/** An upgraded card's preview (PP Up): what changed from `base` turns green, StS's upgrade preview. The words are
    diffed in order (their longest common run), so a new clause or keyword lights up whole and a number that moved
    lights up alone. */
export function markUpgrade(node, base, stage = 0) {
  const cost = node.querySelector('.card-cost');
  if (typeof base.cost === 'number' && Number(cost.textContent) < base.cost) {
    cost.classList.add('cheaper');
    cost.title = `Costs ${cost.textContent} energy (was ${base.cost})`;
  }
  const words = (root) => {
    const out = [];
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = walk.nextNode(); t; t = walk.nextNode()) {
      for (const m of t.data.matchAll(/\S+/g)) out.push({ t, at: m.index, end: m.index + m[0].length, w: m[0] });
    }
    return out;
  };
  const was = words(cardLine(base, stage)).map(x => x.w);
  const now = words(node.querySelector('.card-text'));
  const lcs = now.map(() => new Array(was.length + 1).fill(0));
  lcs.push(new Array(was.length + 1).fill(0));
  for (let i = now.length - 1; i >= 0; i--) {
    for (let j = was.length - 1; j >= 0; j--) {
      lcs[i][j] = now[i].w === was[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const changed = [];
  for (let i = 0, j = 0; i < now.length;) {
    if (j < was.length && now[i].w === was[j]) { i++; j++; } else if (j < was.length && lcs[i][j + 1] >= lcs[i + 1][j]) j++;
    else changed.push(now[i++]);
  }
  // back to front, so wrapping one word never moves the offsets of the ones before it in the same text node
  for (const x of changed.reverse()) {
    const range = document.createRange();
    range.setStart(x.t, x.at);
    range.setEnd(x.t, x.end);
    range.surroundContents(el('span', 'up-diff'));
  }
  return node;
}

/* A long text or a two-line name can push the text window out of the card. The fonts differ
   between devices, so each card is measured once it's first laid out and its name and text
   shrink just enough to fit. Everything inside is in cqw, so one fit holds at any size. */
const fitWatch = new ResizeObserver((entries) => {
  for (const { target, contentRect } of entries) {
    if (!contentRect.width) continue;
    fitWatch.unobserve(target);
    fitCard(target);
  }
});

function fitCard(node) {
  const face = node.querySelector('.card-face');
  const name = node.querySelector('.card-name');
  const text = node.querySelector('.card-text');
  let nameFit = parseFloat(name.style.getPropertyValue('--name-fit')) || 1;
  while (name.scrollWidth > name.clientWidth + 1 && nameFit > 0.6) {
    nameFit -= 0.04;
    name.style.setProperty('--name-fit', nameFit.toFixed(2));
  }
  // the text window may reach halfway into the frame's bottom padding
  const room = () => face.clientHeight - parseFloat(getComputedStyle(face).paddingBottom) / 2;
  let textFit = 1;
  while (text.offsetHeight && text.offsetTop + text.offsetHeight > room() && textFit > 0.7) {
    textFit -= 0.04;
    text.style.setProperty('--text-fit', textFit.toFixed(2));
  }
}

/** A card's item art, cropped to the sprite's visible pixels (ITEM_FIT) so the CSS can scale it to fill the art window. */
function cardSprite(card) {
  const art = el('div', 'card-art');
  const [x, y, w, h] = ITEM_FIT[card.sprite] || [0, 0, 32, 32];
  const crop = itemSprite({ id: card.sprite, icon: card.art }, 'sprite-fit');
  for (const [k, v] of Object.entries({ bx: x, by: y, bw: w, bh: h })) crop.style.setProperty(`--${k}`, v);
  art.append(crop);
  return art;
}

/**
 * StS's keyword boxes: a little window per term a card uses (Exhaust, Tide, Weak...), shown beside the card
 * whenever it's blown up, since a phone can't reach a `title`. A card's DOM node works too (by its data-id).
 * Null when the card has no terms.
 */
/* Each keyword that has a box beside the blown-up card is coloured in the card's text, and its box's name in the same
   colour (StS 2's gold keywords, the user's pick 2026-09-28): the Fire / Water / Grass resources in their type's colour,
   debuffs purple, Strength red, the rest the keyword gold. */
const TERM_KIND = { Burn: 'burn', Tide: 'tide', 'Leech Seed': 'seed', Weak: 'debuff', Vulnerable: 'debuff', Sap: 'debuff', Debuffs: 'debuff', Strength: 'strength' };
export const termKind = (label) => TERM_KIND[label] || 'key';

function colourTerms(text, card) {
  const labels = cardTerms(card).map(([label]) => label).filter(l => l !== 'Upgraded' && l !== 'Losing HP' && !/^Combo /.test(l));
  if (!labels.length) return [text];
  const esc = labels.sort((a, b) => b.length - a.length).map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`\\b(${esc.join('|')})\\b`, 'gi');
  const out = [];
  let at = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > at) out.push(text.slice(at, m.index));
    const label = labels.find(l => l.toLowerCase() === m[0].toLowerCase());
    out.push(el('span', `term term-${termKind(label)}`, m[0]));
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

export function cardTips(card, big) {
  if (card instanceof Element) card = card.classList.contains('card') && CARDS_BY_ID[card.dataset.id];
  const terms = card ? cardTerms(card) : [];
  if (!terms.length) return null;
  // the boxes say it all, so the big card's own hover tips (the same words) would only cover them on a PC
  big?.querySelectorAll('.card-text [title]').forEach(node => node.removeAttribute('title'));
  const box = el('div', 'card-tips');
  for (const [label, text] of terms) {
    const tip = el('div', 'card-tip');
    tip.append(el('b', `card-tip-name term-${termKind(label)}`, label), el('span', '', text));
    box.append(tip);
  }
  return box;
}

/** A blown-up card with its keyword boxes: beside it when there's room, under it on a phone (CSS decides). */
export function withTips(big, card = big) {
  const tips = cardTips(card, big);
  if (!tips) return big;
  const row = el('div', 'tip-row');
  row.style.setProperty('--tips', tips.children.length);   // a phone stacks them under the card, which shrinks to make room
  row.append(big, tips);
  return row;
}

/**
 * Blow a card up in the middle of a dimmed screen so its text is easy to read.
 * Any tap or Escape closes it. Inside a modal dialog it's put in the dialog,
 * which sits in the top layer above everything else.
 */
export function zoomCard(card, stage, from) {
  const layer = el('div', 'card-zoom');
  const big = makeCard(card, { stage });
  big.classList.add('zoom-card');
  layer.append(withTips(big, card), el('p', 'focus-hint', 'Tap anywhere to close'));

  const close = () => {
    layer.remove();
    document.removeEventListener('keydown', onKey, true);
    from?.focus({ preventScroll: true });
  };
  // Escape would otherwise also close the dialog underneath
  const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); close(); } };
  layer.addEventListener('click', close);
  document.addEventListener('keydown', onKey, true);
  (from?.closest('dialog[open]') || document.body).append(layer);
}

/** Make a card in a deck view tappable to zoom in on it. */
export function zoomable(node, card, stage) {
  node.tabIndex = 0;
  node.setAttribute('role', 'button');
  node.setAttribute('aria-label', `${card.name}: tap to read it bigger`);
  node.addEventListener('click', () => zoomCard(card, stage, node));
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zoomCard(card, stage, node); }
  });
  return node;
}

/**
 * An item or relic's PokéSprite image (assets/items/<id>.png), in a span of the given class.
 * Sized in em like the pixel icons; falls back to its emoji if the file is missing.
 */
export function itemSprite(thing, className = '') {
  const box = el('span', className);
  const img = el('img', 'item-sprite');
  img.src = `assets/items/${thing.sprite || thing.id}.png`;
  img.alt = '';
  img.draggable = false;
  img.onerror = () => box.replaceChildren(thing.icon || '');
  box.append(img);
  return box;
}

/** A relic tile: icon, name and what it does. */
export function makeRelic(relic, { tips = false } = {}) {
  const node = el('div', 'relic');
  node.title = `${relic.name}: ${relic.text}`;
  node.append(itemSprite(relic, 'relic-icon'), el('strong', 'relic-name', relic.name), el('span', 'relic-text', relic.text));
  if (tips) { const box = relicTips(relic); if (box) node.append(box); }
  return node;
}

/** A relic's keyword boxes, as small lines under its text (the cards' words and colours). */
export function relicTips(relic) {
  const terms = relicTerms(relic);
  if (!terms.length) return null;
  const box = el('span', 'relic-terms');
  for (const [label, text] of terms) {
    const line = el('small', 'relic-term');
    line.append(el('b', `term-${termKind(label)}`, label), ` ${text}`);
    box.append(line);
  }
  return box;
}

/** A relic's words for a text box: what it does, then a line per keyword. */
export const relicLines = (relic) => [`${relic.name}: ${relic.text}`, ...relicTerms(relic).map(([label, text]) => `${label}: ${text}`)];

/** Group a list of card ids into [{ card, count }], keeping first-seen order. */
export function groupDeck(ids, cardsById) {
  const groups = new Map();
  for (const id of ids) groups.set(id, (groups.get(id) || 0) + 1);
  return [...groups].map(([id, count]) => ({ card: cardsById[id], count }));
}

/**
 * Fill a Gold/Silver HP bar: #<prefix>-hp, #<prefix>-hp-fill and #<prefix>-hp-text.
 * It turns yellow at half HP and red at a fifth, like the games.
 */
export function setHpBar(prefix, hp, max) {
  const ratio = Math.max(0, hp / max);
  const bar = $(`${prefix}-hp`);
  bar.dataset.level = ratio > 0.5 ? 'high' : ratio > 0.2 ? 'mid' : 'low';
  bar.setAttribute('aria-valuemax', String(max));
  bar.setAttribute('aria-valuenow', String(Math.max(0, hp)));
  $(`${prefix}-hp-fill`).style.setProperty('--hp', Math.min(1, ratio));
  $(`${prefix}-hp-text`).textContent = `${Math.max(0, hp)}/${max}`;
}

/** Taking an upgraded card: a little burst of green and gold sparks off its tile. */
export function upgradeBurst(node) {
  playSound('stat-up');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = node.getBoundingClientRect();
  const burst = el('div', 'up-burst');
  burst.style.left = `${r.width ? r.left + r.width / 2 : innerWidth / 2}px`;
  burst.style.top = `${r.height ? r.top + r.height / 2 : innerHeight / 2}px`;
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2, dist = 46 + (i % 3) * 18;
    const spark = el('i', i % 2 ? 'gold' : '');
    spark.style.setProperty('--dx', `${Math.round(Math.cos(angle) * dist)}px`);
    spark.style.setProperty('--dy', `${Math.round(Math.sin(angle) * dist)}px`);
    burst.append(spark);
  }
  burst.append(el('b', '', '+'));
  document.body.append(burst);
  setTimeout(() => burst.remove(), 800);
}

/** Show the run's Pokédollars in the top bar (it's only visible on the run screens). */
export function setMoney(amount) {
  $('money-value').textContent = String(amount);
  $('room-money').textContent = String(amount);
  $('run-money').textContent = String(amount);
}
