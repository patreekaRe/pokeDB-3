/* ============================================================
   rewards.js  -  the "choose one" screen, and the code that decides
   which cards and relics you are offered.
   ============================================================ */

import { poolForType, evolutionCardsFor, MAX_COPIES } from './data/cards.js';
import { RELICS } from './data/relics.js';
import { itemsForType, ITEM_WEIGHTS } from './data/items.js';
import { $, el, makeCard, makeRelic, showScreen } from './ui.js';
import { playSound } from './audio.js';

/* ---------- what you get offered ---------- */

/**
 * Pick 3 (or `count`) different cards to offer.
 * Later biomes and tougher fights make rare cards more likely.
 * source is 'fight', 'elite' or 'boss'.
 */
export function cardChoices(run, source, count = 3) {
  const b = run.biome;
  const weights = { common: 70 - b * 15, uncommon: 26 + b * 7, rare: 4 + b * 8 };
  if (source === 'elite') { weights.common -= 10; weights.rare += 10; }
  if (source === 'boss')  { weights.common -= 30; weights.rare += 25; weights.uncommon += 5; }

  const copies = (id) => run.deck.filter(x => x === id).length;
  let pool = poolForType(run.starter.type).filter(c => copies(c.id) < MAX_COPIES);
  const chosen = [];

  while (chosen.length < count && pool.length) {
    const weightOf = (c) => Math.max(1, weights[c.rarity || 'common']);
    let roll = Math.random() * pool.reduce((sum, c) => sum + weightOf(c), 0);
    const card = pool.find(c => (roll -= weightOf(c)) < 0) || pool[0];
    chosen.push(card);
    pool = pool.filter(c => c !== card);
  }
  return chosen;
}

/**
 * Pick 2 signature evolution cards to offer when your starter evolves.
 * run.stage is already the NEW stage by the time this runs (evolve() bumps
 * it first), so stage 1 gets the mid tier and stage 2 gets the high tier -
 * see evolutionCardsFor in cards.js.
 */
export function evolutionChoices(run) {
  const pool = evolutionCardsFor(run.starter.type, run.stage).filter(c => {
    const copies = run.deck.filter(x => x === c.id).length;
    return copies < (c.maxCopies || MAX_COPIES);
  });
  return pool.sort(() => Math.random() - 0.5).slice(0, 2);
}

/**
 * Pick up to 3 relics you don't already have and that suit your starter.
 * A boss offers its own boss relics, or the normal pool once you hold them all.
 */
export function relicChoices(run, { boss = false } = {}) {
  const fits = RELICS.filter(r => !run.relics.includes(r.id) && (!r.only || r.only === run.starter.type));
  const bossPool = boss ? fits.filter(r => r.boss) : [];
  const pool = bossPool.length ? bossPool : fits.filter(r => !r.boss);
  return pool.sort(() => Math.random() - 0.5).slice(0, 3);
}

/* ---------- the screen ---------- */

/**
 * Show a "choose one" screen.
 *   sub       the text box's line, or a list of lines
 *   options   [{ node, onPick, disabled, ask, confirm }]   node is the element to show, onPick runs when chosen.
 *             With `ask` (the question, read out to screen readers) the pick takes two taps, like a card in
 *             battle: the first blows the tile up with a `confirm` button under it (openFocus). Taking it
 *             plays the confirm sound, or `confirmSound` (a Mart purchase's own).
 *   onSkip    runs when the player skips (the skip button is hidden if not given)
 *   coins     after a fight, { foe, coins, money, disadvantage }: an icon row, and (on the first screen only) the text box's first lines
 *   layout    extra class for the options box ('mart-window'); options may carry a `group` and a `zoom` tile
 */
export function showChoice({ title, sub, options, skipLabel = 'Skip', onSkip, coins = null, layout = '' }) {
  $('reward-title').textContent = title;
  $('reward-coins').textContent = coins ? `💰 +${coins.coins}   💴 +₽${coins.money}` : '';
  $('reward-coins').hidden = !coins;
  // every screen after a fight shows the icon row, but only the first one tells the news
  const news = coins && !coins.told;
  if (coins) coins.told = true;
  const lines = [
    ...notes.splice(0),
    ...(news ? [`${coins.foe} fainted!`, `You got ${coins.coins} PokéCoins${coins.disadvantage ? ' for beating a type you\'re weak to' : ''}!`, `You got ₽${coins.money} for winning!`] : []),
    ...[].concat(sub),   // sub is one line, or a list of them
  ];
  sayLines(lines.filter(Boolean));

  // a `layout` (the Mart's 'mart-window') styles the options as one window; options with a `group` are
  // gathered into a .choice-group per group, in the order they first appear
  const box = $('reward-options');
  box.replaceChildren();
  box.className = `reward-options${layout ? ` ${layout}` : ''}`;
  const groups = {};
  const home = (group) => {
    if (!group) return box;
    if (!groups[group]) box.append(groups[group] = el('div', `choice-group group-${group}`));
    return groups[group];
  };

  let done = false;
  const once = (fn) => () => { if (done) return; done = true; closeFocus(); fn(); };

  for (const option of options) {
    const btn = el('button', 'reward-option');
    btn.type = 'button';
    btn.append(option.node);
    btn.disabled = !!option.disabled;
    const take = once(option.ask ? () => { playSound(option.confirmSound || 'confirm'); option.onPick(); } : option.onPick);
    btn.addEventListener('click', () => (option.ask ? openFocus(option, btn, take) : take()));
    home(option.group).append(btn);
  }

  const skip = $('reward-skip');
  skip.hidden = !onSkip;
  skip.style.visibility = '';   // the treasure room hides it this way while a relic flies to the Bag
  $('reward-skip-text').textContent = skipLabel;
  skip.onclick = onSkip ? once(onSkip) : null;

  showScreen('reward-screen');
}

/* A picked reward blows up in the middle of a dimmed screen, like a card picked in battle,
   with its confirm ("Add to deck") under it where battle says "Tap to play". The big tile
   or the confirm takes it; the dimmed area or Escape puts it back. */
let focus = null;   // { layer, btn, onKey }

function openFocus(option, btn, take) {
  closeFocus();
  const big = (option.zoom || option.node).cloneNode(true);   // zoom: the bare tile, when node wraps it (a Mart price tag)
  big.classList.add('focus-card');
  if (big.classList.contains('relic')) big.classList.add('focus-item');
  big.tabIndex = 0;
  big.setAttribute('role', 'button');
  big.setAttribute('aria-label', option.ask);
  const yes = el('button', 'ds-btn ds-go focus-confirm');
  yes.append(el('span', 'pp-pill', option.confirm || 'Choose'));
  yes.type = 'button';
  const layer = el('div', 'card-focus reward-focus');
  layer.append(big, yes);
  layer.addEventListener('click', (e) => {
    if (e.target.closest('.focus-card, .focus-confirm')) take(); else backOut();
  });
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); backOut(); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target === big) { e.preventDefault(); take(); }
  };
  document.addEventListener('keydown', onKey);
  btn.classList.add('picked');
  document.body.append(layer);
  focus = { layer, btn, onKey };
  yes.focus({ preventScroll: true });
}

function backOut() {
  playSound('cancel', 'confirm');
  closeFocus();
}

function closeFocus() {
  if (!focus) return;
  focus.layer.remove();
  focus.btn.classList.remove('picked');
  document.removeEventListener('keydown', focus.onKey);
  focus = null;
}

/* The reward screen's text box: types each line out like the battle log, then waits
   for you, like the games: a tap finishes the line being typed, or moves on to the
   next one, and a tap on the last one closes the box. The ▼ blinks while there's more to read. */
// The map has its own copy of the box (#map-log), so `box` names which one to use.
const TYPE_MS = 18;
let say = { lines: [], at: 0, typing: 0, box: 'reward-log' };

export function sayLines(lines, boxId = 'reward-log') {
  clearInterval(say.typing);
  say = { lines, at: 0, typing: 0, box: boxId };
  const box = $(boxId);
  box.hidden = !lines.length;
  box.onclick = () => {
    if (say.box !== boxId) return;
    if (say.typing) return finishLine();
    if (say.at < say.lines.length - 1) showLine(say.at + 1);
    else box.hidden = true;   // like the games, a tap on the last line closes the box
  };
  if (lines.length) showLine(0);
}

/* News from the run (a card learned, a Mart buy, an event's outcome) in place of pop-up toasts: told in the next
   text box, like the games. On the map it's told there and then; otherwise it waits for the next screen's box. */
const notes = [];
export function tell(line) {
  notes.push(line);
  if (document.body.dataset.screen === 'map-screen') showNotes();
}
/** Tell whatever news is waiting in the map's text box (or put the box away if there's none). */
export function showNotes() {
  sayLines(notes.splice(0), 'map-log');
}
export const dropNotes = () => { notes.length = 0; };

function showLine(i) {
  say.at = i;
  const box = $(say.box);
  const line = say.lines[i];
  $(`${say.box}-live`).textContent = line;
  box.classList.remove('more');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finishLine();
  const letters = Array.from(line);
  let shown = 0;
  // the rest of the line is laid out but invisible, so centred text doesn't slide as it types out
  const rest = el('span', 'log-rest');
  say.typing = setInterval(() => {
    shown += 2;
    rest.textContent = letters.slice(shown).join('');
    $(`${say.box}-text`).replaceChildren(letters.slice(0, shown).join(''), rest);
    if (shown >= letters.length) finishLine();
  }, TYPE_MS);
}

function finishLine() {
  clearInterval(say.typing);
  say.typing = 0;
  $(`${say.box}-text`).textContent = say.lines[say.at];
  $(say.box).classList.toggle('more', say.at < say.lines.length - 1);
}

/** Ready-made option tiles. */
export const cardOption = (card, stage, onPick, count = 1) => ({ node: makeCard(card, { stage, count }), onPick });
export const relicOption = (relic, onPick) => ({ node: makeRelic(relic), onPick });

/** A simple tile with an icon (an emoji, or an element such as itemSprite()) and text. */
export function textOption(icon, title, text, onPick) {
  const node = el('div', 'relic');
  node.append(typeof icon === 'string' ? el('span', 'relic-icon', icon) : icon, el('strong', 'relic-name', title), el('span', 'relic-text', text));
  return { node, onPick };
}

/** Pick `count` different items (commons more often) that suit your starter. */
export function itemChoices(run, count = 1) {
  let pool = itemsForType(run.starter.type);
  const chosen = [];
  while (chosen.length < count && pool.length) {
    let roll = Math.random() * pool.reduce((sum, i) => sum + ITEM_WEIGHTS[i.rarity], 0);
    const item = pool.find(i => (roll -= ITEM_WEIGHTS[i.rarity]) < 0) || pool[0];
    chosen.push(item);
    pool = pool.filter(i => i !== item);
  }
  return chosen;
}

export const itemOption = (item, onPick) => {
  const node = makeRelic(item);
  node.classList.add('item-tile');
  return { node, onPick };
};
