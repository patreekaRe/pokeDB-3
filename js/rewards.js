/* ============================================================
   rewards.js  -  the "choose one" screen, and the code that decides
   which cards and relics you are offered.
   ============================================================ */

import { poolForType, evolutionCardsFor, MAX_COPIES } from './data/cards.js';
import { RELICS } from './data/relics.js';
import { itemsForType, ITEM_WEIGHTS } from './data/items.js';
import { $, el, makeCard, makeRelic, showScreen } from './ui.js';

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
 *   options   [{ node, onPick, disabled }]   node is the element to show, onPick runs when chosen
 *   onSkip    runs when the player skips (the skip button is hidden if not given)
 */
export function showChoice({ title, sub, options, skipLabel = 'Skip', onSkip, coins = null }) {
  $('reward-title').textContent = title;
  // what the fight paid shows as icons; the text box says it in words, then what to do
  $('reward-coins').textContent = coins ? `💰 +${coins.coins}   💴 +₽${coins.money}` : '';
  $('reward-coins').hidden = !coins;
  const lines = coins
    ? [`You got ${coins.coins} PokéCoins${coins.disadvantage ? ' (type disadvantage bonus!)' : ''} and ₽${coins.money} prize money!`, sub]
    : [sub];
  sayLines(lines.filter(Boolean));

  const box = $('reward-options');
  box.replaceChildren();

  let done = false;
  const once = (fn) => () => { if (done) return; done = true; fn(); };

  for (const option of options) {
    const btn = el('button', 'reward-option');
    btn.type = 'button';
    btn.append(option.node);
    btn.disabled = !!option.disabled;
    btn.addEventListener('click', once(option.onPick));
    box.append(btn);
  }

  const skip = $('reward-skip');
  skip.hidden = !onSkip;
  skip.textContent = skipLabel;
  skip.onclick = onSkip ? once(onSkip) : null;

  showScreen('reward-screen');
}

/* The reward screen's text box: types each line out like the battle log. Tapping it
   finishes the line being typed, or moves on to the next; a finished line also moves
   on by itself after a moment, so the instruction is never stuck behind a tap. The
   ▼ blinks while there's more to read. */
const TYPE_MS = 18, NEXT_MS = 1500;
let say = { lines: [], at: 0, typing: 0, wait: 0 };

function sayLines(lines) {
  clearInterval(say.typing);
  clearTimeout(say.wait);
  say = { lines, at: 0, typing: 0, wait: 0 };
  $('reward-log').hidden = !lines.length;
  $('reward-log').onclick = () => {
    if (say.typing) return finishLine();
    if (say.at < say.lines.length - 1) showLine(say.at + 1);
  };
  if (lines.length) showLine(0);
}

function showLine(i) {
  clearTimeout(say.wait);
  say.at = i;
  const box = $('reward-log');
  const line = say.lines[i];
  $('reward-log-live').textContent = line;
  box.classList.remove('more');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finishLine();
  const letters = Array.from(line);
  let shown = 0;
  say.typing = setInterval(() => {
    shown += 2;
    $('reward-log-text').textContent = letters.slice(0, shown).join('');
    if (shown >= letters.length) finishLine();
  }, TYPE_MS);
}

function finishLine() {
  clearInterval(say.typing);
  say.typing = 0;
  $('reward-log-text').textContent = say.lines[say.at];
  const more = say.at < say.lines.length - 1;
  $('reward-log').classList.toggle('more', more);
  if (more) say.wait = setTimeout(() => showLine(say.at + 1), NEXT_MS);
}

/** Ready-made option tiles. */
export const cardOption = (card, stage, onPick, count = 1) => ({ node: makeCard(card, { stage, count }), onPick });
export const relicOption = (relic, onPick) => ({ node: makeRelic(relic), onPick });

/** A simple tile with an icon and text (used for resting). */
export function textOption(icon, title, text, onPick) {
  const node = el('div', 'relic');
  node.append(el('span', 'relic-icon', icon), el('strong', 'relic-name', title), el('span', 'relic-text', text));
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
