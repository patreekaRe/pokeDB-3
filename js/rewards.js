/* ============================================================
   rewards.js  -  the "choose one" screen, and the code that decides
   which cards and relics you are offered.
   ============================================================ */

import { poolForType, evolutionCardsFor, MAX_COPIES, baseId, upgradeId, CARDS_BY_ID, SAFARI_ONLY_CARDS } from './data/cards.js';
import { RELICS } from './data/relics.js';
import { itemsForType, ITEM_WEIGHTS } from './data/items.js';
import { playSound } from './audio.js';
import { random, shuffled, pickOne } from './rng.js';
import { textPace } from './prefs.js';

// The balance simulator imports the pure reward pickers in a Web Worker. Defer DOM helpers to the browser page so the
// worker can use cardChoices()/relicChoices() without evaluating UI code.
const UI = typeof document === 'undefined' ? {} : await import('./ui.js');
const { $, el, makeCard, makeRelic, showScreen, withTips, setHpBar, upgradeBurst, confirmDialog } = UI;

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
  // Bait and Rock are only ever offered in the Safari Zone
  let pool = [...poolForType(run.starter.type), ...(run.safari ? SAFARI_ONLY_CARDS : [])].filter(c => copies(c.id) < MAX_COPIES);
  const chosen = [];

  while (chosen.length < count && pool.length) {
    const weightOf = (c) => Math.max(1, weights[c.rarity || 'common']);
    let roll = random() * pool.reduce((sum, c) => sum + weightOf(c), 0);
    const card = pool.find(c => (roll -= weightOf(c)) < 0) || pool[0];
    chosen.push(card);
    pool = pool.filter(c => c !== card);
  }
  if (!reward) return chosen;

  const rarity = (c) => c.rarity || 'common';
  run.rarePity = chosen.some(c => rarity(c) === 'rare') ? 0
    : Math.min(RARE_PITY.max, (run.rarePity || 0) + RARE_PITY.step * chosen.filter(c => rarity(c) === 'common').length);
  const odds = REWARD_UPGRADE_ODDS[b] ?? 0;
  return chosen.map(c => (rarity(c) !== 'rare' && random() < odds ? CARDS_BY_ID[upgradeId(c.id)] : c));
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
  return shuffled(pool).slice(0, 2);
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
  const fits = RELICS.filter(r => !r.unique && !run.relics.includes(r.id) && (!r.only || r.only === run.starter.type));
  const bossPool = boss ? fits.filter(r => r.boss) : [];
  if (bossPool.length) return shuffled(bossPool).slice(0, 3);
  let pool = fits.filter(r => !r.boss);
  const odds = RELIC_ODDS[source] || RELIC_ODDS.normal;
  const chosen = [];
  while (chosen.length < 3 && pool.length) {
    let roll = random() * TIERS.reduce((sum, t) => sum + odds[t], 0);
    const at = TIERS.findIndex(t => (roll -= odds[t]) < 0);
    const order = [...TIERS.slice(at), ...TIERS.slice(0, at).reverse()];
    const tier = order.map(t => pool.filter(r => r.rarity === t)).find(list => list.length);
    const relic = pickOne(tier);
    chosen.push(relic);
    pool = pool.filter(r => r !== relic);
  }
  return chosen;
}

/* ---------- the screen ---------- */

/**
 * Show a "choose one" screen.
 *   sub       the text box's line, or a list of lines
 *   options   [{ node, onPick, disabled, ask, confirm, peek }]   node is the element to show, onPick runs when chosen.
 *             With `peek` (an event's sign) the first tap says it in the text box and the second takes it.
 *             With `ask` (the question, read out to screen readers) the pick takes two taps, like a card in
 *             battle: the first blows the tile up with a `confirm` button under it (openFocus). Taking it
 *             plays the confirm sound, or `confirmSound` (a Mart purchase's own). A `note` is a line over the
 *             confirm button (deckNote(): how many copies you already have).
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
  if (hp) { setHpBar('choice', hp.hp, hp.maxHp); setHpBar('room', hp.hp, hp.maxHp); }
}

export function showChoice({ title, sub, options, skipLabel = 'Skip', onSkip, coins = null, layout = '', reroll = null, over = false }) {
  $('reward-title').textContent = title;
  $('reward-coins').textContent = coins ? `💰 +${coins.coins}   💴 +₽${coins.money}` : '';
  $('reward-coins').hidden = !coins;
  // every screen after a fight shows the icon row, but only the first one tells the news
  const news = coins && !coins.told;
  if (coins) coins.told = true;
  const lines = [
    ...notes.splice(0),
    // the icon row over the screen already shows the coins and ₽, so the box doesn't read them out again
    ...(news ? [coins.beaten ?? `${coins.foe} fainted!`, ...(coins.dex || [])] : []),
    ...[].concat(sub),   // sub is one line, or a list of them
  ];
  sayLines(lines.filter(Boolean));

  // a `layout` (the Mart's 'mart-window') styles the options as one window; options with a `group` are
  // gathered into a .choice-group per group, in the order they first appear
  const box = $('reward-options');
  box.replaceChildren();
  box.className = `reward-options${layout ? ` ${layout}` : ''}`;
  box.style.zoom = '';   // fitMart()'s zoom-out would shrink the next screen too, and pull the Center's and events' fixed spots towards the top left
  const groups = {};
  // a deck picker's cards sit on the device's dark screen, which scrolls inside the glass (the box)
  const glass = layout.split(' ').includes('deck-pick') ? box.appendChild(el('div', 'deck-pick-screen')) : box;
  const home = (group) => {
    if (!group) return glass;
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
    if (option.peek) {
      // a disabled one still answers a tap, so you can read why it's greyed out
      btn.disabled = false;
      btn.classList.toggle('locked', !!option.disabled);
      if (option.disabled) btn.setAttribute('aria-disabled', 'true');
      btn.addEventListener('click', () => {
        if (btn.classList.contains('picked')) return take();
        box.querySelectorAll('.reward-option.picked').forEach(b => b.classList.remove('picked'));
        if (!option.disabled) btn.classList.add('picked');
        playSound('stick');
        sayLines([option.disabled ? option.peek : `${option.peek} Tap it again to choose.`]);
      });
    } else btn.addEventListener('click', () => (option.ask ? openFocus(option, btn, take) : take()));
    home(option.group).append(btn);
  }

  // a deck picker's confirm waits, greyed, left of Skip under the text box until a card is picked (the user's call,
  // 2026-10-08), so it never covers the card
  const deckPick = layout.split(' ').includes('deck-pick');
  $('reward-screen').classList.toggle('deck-picking', deckPick);
  armDeckOk(null);
  $('reward-ok').hidden = !deckPick;
  $('reward-ok-text').textContent = oneWord(options.find(o => o.confirm)?.confirm || 'Choose');

  const skip = $('reward-skip');
  // a room (an event, the Center, the Mart, the grotto) has the slim bar along the bottom, and Leave is its key after Home
  const inBar = /\b(event-room|center-room|treasure-room|mart-window)\b/.test(layout);
  // the rooms and a fight's reward steps (moves, relics, a found item): the bar along the bottom, the title on its
  // hinge's LCD, no top bar
  const roomy = inBar || /\b(learn-room|item-found|card-reveal-room)\b/.test(layout);
  $('reward-screen').classList.toggle('in-room', roomy);
  $('reward-screen').classList.toggle('learn', roomy && !inBar);
  $('room-title').textContent = title;
  // a screen whose picks blow up for a confirm keeps its gold key up, greyed, until one is picked (the user's call,
  // 2026-10-08: a key that came and went didn't read as a button)
  const asked = roomy && options.find(o => o.ask);
  roomConfirm(asked ? asked.confirm || 'Choose' : null);
  // a fight's reward steps put Skip by Home too, a key in the shell's colour (the user's call, 2026-10-08)
  if (roomy) $('room-home').after(skip);
  else $('reward-reroll').after(skip);
  skip.classList.toggle('room-leave', inBar);
  skip.classList.toggle('room-skip', roomy && !inBar);
  skip.hidden = !onSkip;
  skip.style.visibility = '';   // the treasure room hides it this way while a relic flies to the Bag
  $('reward-skip-text').textContent = skipLabel;
  skip.onclick = onSkip ? askFirst(once(onSkip), skip, title) : null;
  $('reward-reroll').hidden = !reroll;
  $('reward-reroll').onclick = reroll ? once(reroll) : null;

  showChoiceHp();
  showScreen('reward-screen');
  // `over`: just the options floating over the Sky Pillar's climb, its menu bar still along the bottom (the user's call,
  // 2026-10-07), so the map stays up and counts as the screen (the top bar keeps to the bar's LCD)
  $('reward-screen').classList.toggle('over-map', over);
  if (over) { $('map-screen').hidden = false; document.body.dataset.screen = 'map-screen'; }
}

// the pill says one word (the user's call, 2026-10-08); the windows outside a room keep the full label
const ONE_WORD = { 'Put in Bag': 'Take', 'PP Up': 'Upgrade' };
const oneWord = (label) => ONE_WORD[label] || label.split(' ')[0];

/* Skip and Leave are icon keys, so what they throw away isn't obvious: they ask first (the user's call, 2026-10-08).
   Leave only asks while the room still has something to pick, and Back never does. */
function askFirst(go, skip, title) {
  return async () => {
    const leave = skip.classList.contains('room-leave');
    if (leave && !$('reward-options').querySelector('.reward-option:not(:disabled)')) return go();
    if (!leave && $('reward-skip-text').textContent === 'Back') return go();
    playSound('stick');
    const sure = await confirmDialog(leave ? `Leave ${title}? You can't come back.` : "Skip this? You can't come back for it.",
      leave ? 'Leave' : 'Skip');
    if (sure) go();
  };
}

/** The deck picker's confirm: `fn` lights it up for the picked card, null greys it out again. */
function armDeckOk(fn) {
  const ok = $('reward-ok');
  ok.classList.remove('pressed');
  ok.disabled = !fn;
  ok.onclick = fn ? () => { pressConfirm(ok); fn(); } : null;
}

/** The room bar's confirm pill, beside the hinge's lights: `label` names it ("Take it" shows as "Take"), `fn` runs on a
    press; a label alone shows it greyed, no label puts it away. A screen that waits for a pick sets `disabled` itself. */
export function roomConfirm(label, fn) {
  const ok = $('room-ok');
  ok.classList.remove('pressed');
  ok.hidden = !label;
  ok.disabled = !fn;
  $('room-ok-text').textContent = label ? oneWord(label) : '';
  ok.setAttribute('aria-label', label || '');
  ok.onclick = fn ? () => { pressConfirm(ok); fn(); } : null;
  return ok;
}

/** A confirm once pressed stays on screen pushed in, lit, until the screen moves on: it never just vanishes under your
    finger (the user's call, 2026-10-08). */
export function pressConfirm(ok) {
  if (ok.classList.contains('pressed')) return;
  ok.classList.add('pressed');
  ok.disabled = true;
}

// the bar's height, for whatever has to stay clear of it (the Mart, the grotto, the move pick's text box, a picked card
// blown up over the screen, which lives outside it)
new ResizeObserver(() => document.documentElement.style.setProperty('--room-bar-h', `${$('room-bar').offsetHeight}px`)).observe($('room-bar'));

/* A picked reward blows up in the middle of a dimmed screen, like a card picked in battle,
   with its confirm ("Add to deck") under it where battle says "Tap to play". The big tile
   or the confirm takes it; the dimmed area or Escape puts it back. */
let focus = null;   // { layer, btn, onKey }

function openFocus(option, btn, takeIt) {
  closeFocus();
  // however it's taken (the key, the big card, Enter), the gold key goes down and stays down
  const take = () => {
    if (focus?.inRoom) pressConfirm($('room-ok'));
    if (focus?.deckPick) pressConfirm($('reward-ok'));
    takeIt();
  };
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
  let shown = withTips(big);
  // `before`: the card as it is now, small on the left of an arrow, so a PP Up shows what it was and what it becomes
  if (option.before) {
    const pair = el('div', 'up-pair');
    const was = option.before.cloneNode(true);
    was.classList.add('up-before');
    if (shown === big) shown = pair; else shown.replaceChild(pair, big);
    pair.append(was, el('span', 'up-arrow', '▶'), big);
  }
  layer.append(shown, ...(option.note ? [el('p', 'focus-note', option.note)] : []), yes);
  // over a room's bar, the confirm is its A key instead, and the bar stays lit above the dimmed screen
  const inRoom = $('reward-screen').classList.contains('in-room') && !$('reward-screen').hidden;
  if (inRoom) {
    yes.hidden = true;
    layer.classList.add('over-room');
    roomConfirm(option.confirm || 'Choose', take);
  }
  // over a deck picker, the dim stops above the text box so its button row stays lit and takes the confirm
  const deckPick = $('reward-screen').classList.contains('deck-picking') && !$('reward-screen').hidden;
  if (deckPick) {
    yes.hidden = true;
    layer.classList.add('over-pick');
    layer.style.bottom = `${Math.max(0, innerHeight - $('reward-screen').querySelector('.reward-bottom').getBoundingClientRect().top + 6)}px`;
    armDeckOk(take);
  }
  layer.addEventListener('click', (e) => {
    if (e.target.closest('.card-tips, .up-before, .up-arrow')) return;
    if (e.target.closest('.focus-card, .focus-confirm')) take(); else backOut();
  });
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); backOut(); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target === big) { e.preventDefault(); take(); }
  };
  document.addEventListener('keydown', onKey);
  btn.classList.add('picked');
  document.body.append(layer);
  focus = { layer, btn, onKey, inRoom, deckPick, label: option.confirm || 'Choose' };
  (inRoom ? $('room-ok') : deckPick ? $('reward-ok') : yes).focus({ preventScroll: true });
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
  // pressed, the key stays down; backed out, it greys again and waits for the next pick
  if (focus.inRoom && !$('room-ok').classList.contains('pressed')) roomConfirm(focus.label);
  if (focus.deckPick && !$('reward-ok').classList.contains('pressed')) armDeckOk(null);
  focus = null;
}

/* The reward screen's text box: types each line out like the battle log, then waits
   for you, like the games: a tap finishes the line being typed, or moves on to the
   next one, and a tap on the last one closes the box. The ▼ blinks while there's more to read. */
// The map has its own copy of the box (#map-log), so `box` names which one to use.
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
  const pace = textPace();
  if (!pace || matchMedia('(prefers-reduced-motion: reduce)').matches) return finishLine();
  box.classList.add('typing');   // an event's trainer bobs their head while it types (css/screens.css)
  const letters = Array.from(line);
  let shown = 0;
  // the rest of the line is laid out but invisible, so centred text doesn't slide as it types out
  const rest = el('span', 'log-rest');
  say.typing = setInterval(() => {
    shown += pace[0];
    rest.textContent = letters.slice(shown).join('');
    $(`${say.box}-text`).replaceChildren(letters.slice(0, shown).join(''), rest);
    if (shown >= letters.length) finishLine();
  }, pace[1]);
}

function finishLine() {
  clearInterval(say.typing);
  say.typing = 0;
  $(say.box).classList.remove('typing');
  $(`${say.box}-text`).textContent = say.lines[say.at];
  $(say.box).classList.toggle('more', say.at < say.lines.length - 1);
}

/** Ready-made option tiles. */
export function cardOption(card, stage, onPick, count = 1) {
  const node = makeCard(card, { stage, count });
  if (card.rarity === 'rare') node.classList.add('shimmer');
  return { node, onPick: onPick && (() => { if (card.upgraded) upgradeBurst(node); onPick(); }) };
}
/** The picked card's "already in your deck" line, counting upgraded copies too; null if you have none. */
export function deckNote(card, deck) {
  const n = deck.filter(id => baseId(id) === baseId(card.id)).length;
  return n ? `Already in your deck${n > 1 ? ` (×${n})` : ''}` : null;
}
export const relicOption =(relic, onPick) => ({ node: makeRelic(relic, { tips: true }), onPick });

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
    let roll = random() * pool.reduce((sum, i) => sum + ITEM_WEIGHTS[i.rarity], 0);
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
