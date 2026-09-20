/* ============================================================
   rewards.js  -  the "choose one" screen, and the code that decides
   which cards and relics you are offered.
   ============================================================ */

import { poolForType, MAX_COPIES } from './data/cards.js';
import { RELICS } from './data/relics.js';
import { $, el, makeCard, makeRelic, showScreen } from './ui.js';

/* ---------- what you get offered ---------- */

/**
 * Pick 3 different cards to offer.
 * Later biomes and tougher fights make rare cards more likely.
 * source is 'fight', 'elite' or 'boss'.
 */
export function cardChoices(run, source) {
  const b = run.biome;
  const weights = { common: 70 - b * 15, uncommon: 26 + b * 7, rare: 4 + b * 8 };
  if (source === 'elite') { weights.common -= 10; weights.rare += 10; }
  if (source === 'boss')  { weights.common -= 30; weights.rare += 25; weights.uncommon += 5; }

  const copies = (id) => run.deck.filter(x => x === id).length;
  let pool = poolForType(run.starter.type).filter(c => copies(c.id) < MAX_COPIES);
  const chosen = [];

  while (chosen.length < 3 && pool.length) {
    const weightOf = (c) => Math.max(1, weights[c.rarity || 'common']);
    let roll = Math.random() * pool.reduce((sum, c) => sum + weightOf(c), 0);
    const card = pool.find(c => (roll -= weightOf(c)) < 0) || pool[0];
    chosen.push(card);
    pool = pool.filter(c => c !== card);
  }
  return chosen;
}

/** Pick up to 3 relics you don't already have and that suit your starter. */
export function relicChoices(run) {
  const pool = RELICS.filter(r =>
    !run.relics.includes(r.id) && (!r.only || r.only === run.starter.type));
  return pool.sort(() => Math.random() - 0.5).slice(0, 3);
}

/* ---------- the screen ---------- */

/**
 * Show a "choose one" screen.
 *   options   [{ node, onPick }]   node is the element to show, onPick runs when chosen
 *   onSkip    runs when the player skips (the skip button is hidden if not given)
 */
export function showChoice({ title, sub, options, skipLabel = 'Skip', onSkip }) {
  $('reward-title').textContent = title;
  $('reward-sub').textContent = sub;

  const box = $('reward-options');
  box.replaceChildren();

  let done = false;
  const once = (fn) => () => { if (done) return; done = true; fn(); };

  for (const option of options) {
    const btn = el('button', 'reward-option');
    btn.type = 'button';
    btn.append(option.node);
    btn.addEventListener('click', once(option.onPick));
    box.append(btn);
  }

  const skip = $('reward-skip');
  skip.hidden = !onSkip;
  skip.textContent = skipLabel;
  skip.onclick = onSkip ? once(onSkip) : null;

  showScreen('reward-screen');
}

/** Ready-made option tiles. */
export const cardOption = (card, stage, onPick) => ({ node: makeCard(card, { stage }), onPick });
export const relicOption = (relic, onPick) => ({ node: makeRelic(relic), onPick });

/** A simple tile with an icon and text (used for resting). */
export function textOption(icon, title, text, onPick) {
  const node = el('div', 'relic');
  node.append(el('span', 'relic-icon', icon), el('strong', 'relic-name', title), el('span', 'relic-text', text));
  return { node, onPick };
}
