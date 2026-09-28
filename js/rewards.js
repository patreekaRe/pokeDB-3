/* ============================================================
   rewards.js  -  the "choose one" screen, and the code that decides
   which cards and relics you are offered.
   ============================================================ */

import { poolForType, evolutionCardsFor, MAX_COPIES, baseId, upgradeId, CARDS_BY_ID } from './data/cards.js';
import { RELICS } from './data/relics.js';
import { itemsForType, ITEM_WEIGHTS } from './data/items.js';
import { $, el, makeCard, makeRelic, showScreen, withTips, setHpBar } from './ui.js';
import { playSound } from './audio.js';
import { markSeen } from './storage.js';

/* ---------- what you get offered ---------- */

/** StS's reward rules. A common or uncommon card offered after a fight comes upgraded this often, per biome (StS: none
    in Act 1, 25% in Act 2, 50% in Act 3). */
export const REWARD_UPGRADE_ODDS = [0, 0.25, 0.5];
/** StS's rare pity: every common a fight's reward offers adds `step` to the next reward's rare weight (out of ~100),
    up to `max`, and offering a rare resets it. Kept in the run (`run.rarePity`). */
export const RARE_PITY = { step: 1, max: 40 };

/**
 * Pick 3 (or `count`) different cards to offer.
 * Later biomes and tougher fights make rare cards more likely.
 * source is 'fight', 'elite' or 'boss'. `reward` (a fight's card reward, not the Mart) applies the rare pity and
 * the upgrade odds above.
 */
export function cardChoices(run, source, count = 3, { reward = false } = {}) {
  const b = run.biome;
  const weights = { common: 70 - b * 15, uncommon: 26 + b * 7, rare: 4 + b * 8 };
  if (source === 'elite') { weights.common -= 10; weights.rare += 10; }
  if (source === 'boss')  { weights.common -= 30; weights.rare += 25; weights.uncommon += 5; }
  if (reward) weights.rare += run.rarePity || 0;

  const copies = (id) => run.deck.filter(x => baseId(x) === id).length;
  let pool = poolForType(run.starter.type).filter(c => copies(c.id) < MAX_COPIES);
  const chosen = [];

  while (chosen.length < count && pool.length) {
    const weightOf = (c) => Math.max(1, weights[c.rarity || 'common']);
    let roll = Math.random() * pool.reduce((sum, c) => sum + weightOf(c), 0);
    const card = pool.find(c => (roll -= weightOf(c)) < 0) || pool[0];
    chosen.push(card);
    pool = pool.filter(c => c !== card);
  }
  if (!reward) return chosen;

  const rarity = (c) => c.rarity || 'common';
  run.rarePity = chosen.some(c => rarity(c) === 'rare') ? 0
    : Math.min(RARE_PITY.max, (run.rarePity || 0) + RARE_PITY.step * chosen.filter(c => rarity(c) === 'common').length);
  const odds = REWARD_UPGRADE_ODDS[b] ?? 0;
  return chosen.map(c => (rarity(c) !== 'rare' && Math.random() < odds ? CARDS_BY_ID[upgradeId(c.id)] : c));
}

/**
 * Pick 2 signature evolution cards to offer when your starter evolves.
 * run.stage is already the NEW stage by the time this runs (evolve() bumps
 * it first), so stage 1 gets the mid tier and stage 2 gets the high tier -
 * see evolutionCardsFor in cards.js.
 */
export function evolutionChoices(run) {
  const pool = evolutionCardsFor(run.starter.type, run.stage).filter(c => {
    const copies = run.deck.filter(x => baseId(x) === c.id).length;
    return copies < (c.maxCopies || MAX_COPIES);
  });
  return pool.sort(() => Math.random() - 0.5).slice(0, 2);
}

/** StS's relic tiers: each relic offered rolls common / uncommon / rare by these weights (StS's 50 / 33 / 17),
    leaning rarer after an elite and in a treasure room. */
export const RELIC_ODDS = {
  normal:   { common: 50, uncommon: 33, rare: 17 },
  elite:    { common: 35, uncommon: 40, rare: 25 },
  treasure: { common: 20, uncommon: 50, rare: 30 },
};
const TIERS = ['common', 'uncommon', 'rare'];

/**
 * Pick up to 3 relics you don't already have and that suit your starter. Each one rolls a tier (RELIC_ODDS by
 * `source`: 'normal', 'elite' or 'treasure'); a tier with nothing left falls to the next one up, then down, like StS.
 * A boss offers its own boss relics, or the normal pool once you hold them all.
 */
export function relicChoices(run, { boss = false, source = 'normal' } = {}) {
  const fits = RELICS.filter(r => !run.relics.includes(r.id) && (!r.only || r.only === run.starter.type));
  const bossPool = boss ? fits.filter(r => r.boss) : [];
  if (bossPool.length) return bossPool.sort(() => Math.random() - 0.5).slice(0, 3);
  let pool = fits.filter(r => !r.boss);
  const odds = RELIC_ODDS[source] || RELIC_ODDS.normal;
  const chosen = [];
  while (chosen.length < 3 && pool.length) {
    let roll = Math.random() * TIERS.reduce((sum, t) => sum + odds[t], 0);
    const at = TIERS.findIndex(t => (roll -= odds[t]) < 0);
    const order = [...TIERS.slice(at), ...TIERS.slice(0, at).reverse()];
    const tier = order.map(t => pool.filter(r => r.rarity === t)).find(list => list.length);
    const relic = tier[Math.floor(Math.random() * tier.length)];
    chosen.push(relic);
    pool = pool.filter(r => r !== relic);
  }
  return chosen;
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
 *   coins     after a fight, { foe, coins, money }: an icon row, and (on the first screen only) the text box's first lines
 *   layout    extra class for the options box ('mart-window'); options may carry a `group` and a `zoom` tile
 */
/* Every choice screen shows your HP in the top bar (the Hot Spring's soak or dip, a Shrine's HP price...):
   run.js hands over where to read it, since this file doesn't hold the run. */
let hpSource = () => null;
export function trackHp(source) { hpSource = source; }
export function showChoiceHp() {
  const hp = hpSource();
  if (hp) setHpBar('choice', hp.hp, hp.maxHp);
}

export function showChoice({ title, sub, options, skipLabel = 'Skip', onSkip, coins = null, layout = '', reroll = null }) {
  $('reward-title').textContent = title;
  $('reward-coins').textContent = coins ? `💰 +${coins.coins}   💴 +₽${coins.money}` : '';
  $('reward-coins').hidden = !coins;
  // every screen after a fight shows the icon row, but only the first one tells the news
  const news = coins && !coins.told;
  if (coins) coins.told = true;
  const lines = [
    ...notes.splice(0),
    ...(news ? [`${coins.foe} fainted!`, `You got ${coins.coins} PokéCoins!`, `You got ₽${coins.money} for winning!`, ...(coins.dex || [])] : []),
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
  $('reward-reroll').hidden = !reroll;
  $('reward-reroll').onclick = reroll ? once(reroll) : null;

  showChoiceHp();
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
  layer.append(withTips(big), yes);
  layer.addEventListener('click', (e) => {
    if (e.target.closest('.card-tips')) return;
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

export function sayLines(lines, boxId = 'reward-log', onDone) {
  clearInterval(say.typing);
  say = { lines, at: 0, typing: 0, box: boxId };
  const box = $(boxId);
  box.hidden = !lines.length;
  box.onclick = () => {
    if (say.box !== boxId) return;
    if (say.typing) return finishLine();
    if (say.at < say.lines.length - 1) showLine(say.at + 1);
    else { box.hidden = true; onDone?.(); }   // like the games, a tap on the last line closes the box
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
  box.classList.add('typing');   // an event's trainer bobs their head while it types (css/screens.css)
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
  $(say.box).classList.remove('typing');
  $(`${say.box}-text`).textContent = say.lines[say.at];
  $(say.box).classList.toggle('more', say.at < say.lines.length - 1);
}

/** Ready-made option tiles. */
export const cardOption = (card, stage, onPick, count = 1) => ({ node: makeCard(card, { stage, count }), onPick });
export const relicOption = (relic, onPick) => {
  markSeen('relics', relic.id);
  return { node: makeRelic(relic), onPick };
};

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
  markSeen('items', item.id);
  const node = makeRelic(item);
  node.classList.add('item-tile');
  return { node, onPick };
};
