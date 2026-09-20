/* ============================================================
   battle.js  -  the turn-based fight.

   How a battle works:
     1. Your deck is shuffled into the DRAW pile.
     2. Each turn you draw 5 cards and get 3 energy.
     3. Playing a card costs energy and does its effects.
     4. End Turn: your hand is discarded, the enemy acts, and a new turn starts.
     5. When the draw pile runs out, the discard pile is shuffled back in.
     6. Reduce the enemy to 0 HP to win. If you hit 0 HP, you lose.

   All of the battle's numbers live in one object called `battle`.
   The screen is redrawn from that object by the render functions,
   so the game rules (top half) and the drawing code (bottom half)
   stay separate and easy to read.
   ============================================================ */

import { CARDS_BY_ID, TYPES } from './data/cards.js';
import { randomEnemy } from './data/enemies.js';
import { spriteUrl } from './data/starters.js';
import { getSave, recordResult } from './storage.js';
import { newUnlocks } from './progress.js';
import { $, el, makeCard, showScreen, setBackdrop, toast, sleep, openDialog, closeDialog } from './ui.js';

const PLAYER_MAX_HP = 70;
const ENERGY_PER_TURN = 3;
const HAND_SIZE = 5;
const STREAK_HP_BONUS = 8;   // each win in your streak gives the next enemy this much extra HP...
const STREAK_DAMAGE_BONUS = 1; // ...and this much extra damage on every attack
const MAX_STREAK_BONUSES = 6;

/** The current battle, or null when no battle is running. */
let battle = null;
let handlers = { onEditDeck() {}, onMenu() {} };
let nextUid = 1;

/** Called once at startup. */
export function initBattle(callbacks) {
  handlers = callbacks;
  $('end-turn-btn').addEventListener('click', endTurn);
  $('result-again').addEventListener('click', () => { closeDialog('result-dialog'); startBattle(battle.starter, battle.deckIds); });
  $('result-deck').addEventListener('click',  () => { closeDialog('result-dialog'); handlers.onEditDeck(battle.starter); });
  $('result-menu').addEventListener('click',  () => { closeDialog('result-dialog'); handlers.onMenu(); });
}

/** Leave the battle without finishing it (used by the menu button). */
export function abandonBattle() {
  battle = null;
}

export const isBattleRunning = () => battle !== null && !battle.over;

/* ============================================================
   PART 1: THE RULES
   ============================================================ */

export function startBattle(starter, deckIds) {
  const def = randomEnemy();
  const streakBonus = Math.min(getSave().streak, MAX_STREAK_BONUSES) * STREAK_HP_BONUS;

  battle = {
    starter,
    deckIds,
    def,

    // the player
    hp: PLAYER_MAX_HP,
    block: 0,
    energy: 0,
    nextEnergy: 0,     // bonus energy waiting for next turn
    focus: 0,          // bonus damage waiting for your next attack
    guard: false,      // blocks the next enemy attack completely

    // the piles of cards
    drawPile: shuffle(deckIds.map(id => CARDS_BY_ID[id])),
    hand: [],
    discard: [],

    // the enemy
    enemy: {
      hp: def.hp + streakBonus,
      maxHp: def.hp + streakBonus,
      block: 0,
      strength: Math.min(getSave().streak, MAX_STREAK_BONUSES) * STREAK_DAMAGE_BONUS,   // extra damage on every attack
      burn: 0,
      weakened: false, // next attack deals half
      moveIndex: Math.floor(Math.random() * def.moves.length),
    },

    busy: true,        // true while animations play, so clicks are ignored
    over: false,
  };

  setBackdrop(def.backdrop, starter.type);
  showScreen('battle-screen');
  setupBattleScreen();

  const streak = getSave().streak;
  log(`A wild ${def.name} appeared!${streak ? `  (Win streak: ${streak} 🔥)` : ''}`);
  beginPlayerTurn();
}

function beginPlayerTurn() {
  const b = battle;
  b.block = 0;                                   // block only lasts one round
  b.energy = ENERGY_PER_TURN + b.nextEnergy;
  b.nextEnergy = 0;
  draw(HAND_SIZE);
  b.busy = false;
  renderAll();
}

/** Draw cards. If the draw pile is empty, shuffle the discard pile back in. */
function draw(count) {
  const b = battle;
  for (let i = 0; i < count; i++) {
    if (b.drawPile.length === 0) {
      if (b.discard.length === 0) return;        // nothing left anywhere
      b.drawPile = shuffle(b.discard);
      b.discard = [];
    }
    b.hand.push({ uid: nextUid++, card: b.drawPile.pop(), fresh: true });
  }
}

/** Can this card be played right now? Returns null if yes, or the reason if not. */
function whyNotPlayable(card) {
  const b = battle;
  if (b.busy || b.over) return 'Wait for your turn.';
  if (card.cost > b.energy) return 'Not enough energy!';
  if (card.effects.needsWounded && b.hp >= PLAYER_MAX_HP) return `${card.name} only works when you're hurt.`;
  return null;
}

/** How much damage does this attack do to the current enemy? */
function damageFor(card) {
  const b = battle;
  const e = card.effects;
  if (!e.damage) return { amount: 0, multiplier: 1 };

  let amount = e.damage;
  if (e.bonusIfLow && b.hp < PLAYER_MAX_HP / 2) amount += e.bonusIfLow;
  amount += b.focus;

  // Fire beats Grass, Grass beats Water, Water beats Fire.
  let multiplier = 1;
  const type = TYPES[card.type];
  if (type.beats === b.def.type) multiplier = 1.5;
  else if (type.losesTo === b.def.type) multiplier = 0.5;

  return { amount: Math.round(amount * multiplier), multiplier };
}

async function playCard(uid) {
  const b = battle;
  const index = b.hand.findIndex(h => h.uid === uid);
  if (index === -1) return;

  const { card } = b.hand[index];
  const problem = whyNotPlayable(card);
  if (problem) return toast(problem, 'warn');

  b.busy = true;
  b.energy -= card.cost;
  b.hand.splice(index, 1);
  b.discard.push(card);

  const e = card.effects;

  // --- damage ---
  if (e.damage) {
    const { amount, multiplier } = damageFor(card);
    b.focus = 0;                                  // focus is used up by the attack
    lunge('player-sprite');
    await sleep(180);
    const dealt = hurtEnemy(amount);
    hitEffect('enemy-portrait-box');
    pop('enemy-zone', dealt > 0 ? `-${dealt}` : 'Blocked', dealt > 0 ? 'dmg' : 'note');
    if (multiplier > 1) pop('enemy-zone', 'Super effective!', 'note good', 260);
    if (multiplier < 1) pop('enemy-zone', 'Not very effective…', 'note bad', 260);
    log(`${b.starter.name} used ${card.name}! ${amount} damage${multiplier > 1 ? ' (super effective!)' : multiplier < 1 ? ' (not very effective)' : ''}.`);
  } else {
    log(`${b.starter.name} used ${card.name}.`);
  }

  // --- everything else a card can do ---
  if (e.burn)       { b.enemy.burn += e.burn; pop('enemy-zone', `🔥 Burn ${e.burn}`, 'note'); }
  if (e.weaken)     { b.enemy.weakened = true; pop('enemy-zone', '💨 Weakened', 'note'); }
  if (e.block)      { b.block += e.block; pop('player-zone', `+${e.block} 🛡️`, 'block'); }
  if (e.guard)      { b.guard = true; pop('player-zone', '✋ Guard up', 'block'); }
  if (e.focus)      { b.focus += e.focus; pop('player-zone', `🎯 +${e.focus} next attack`, 'note good'); }
  if (e.nextEnergy) { b.nextEnergy += e.nextEnergy; pop('player-zone', `⚡ +${e.nextEnergy} next turn`, 'note good'); }
  if (e.heal) {
    const healed = Math.min(e.heal, PLAYER_MAX_HP - b.hp);
    b.hp += healed;
    if (healed > 0) pop('player-zone', `+${healed} HP`, 'heal');
  }
  if (e.draw) draw(e.draw);

  renderAll();
  await sleep(220);

  if (battle !== b) return;                      // the player left the battle
  if (b.enemy.hp <= 0) return finish(true);
  b.busy = false;
  renderAll();
}

/** Damage the enemy: its block soaks it up first. Returns the damage that got through. */
function hurtEnemy(amount) {
  const en = battle.enemy;
  const absorbed = Math.min(en.block, amount);
  en.block -= absorbed;
  const through = amount - absorbed;
  en.hp = Math.max(0, en.hp - through);
  return through;
}

/** Damage the player: block first, then HP. Returns the damage that got through. */
function hurtPlayer(amount) {
  const b = battle;
  const absorbed = Math.min(b.block, amount);
  b.block -= absorbed;
  const through = amount - absorbed;
  b.hp = Math.max(0, b.hp - through);
  return through;
}

async function endTurn() {
  const b = battle;
  if (!b || b.busy || b.over) return;
  b.busy = true;

  // Discard whatever is left in your hand.
  b.discard.push(...b.hand.map(h => h.card));
  b.hand = [];
  renderAll();

  await sleep(500);
  if (battle !== b) return;                      // the player left the battle
  await enemyTurn();
}

async function enemyTurn() {
  const b = battle;
  const en = b.enemy;
  const move = currentMove();
  en.block = 0;                                   // enemy block only lasts one round

  // 1. Burn hurts the enemy first.
  if (en.burn > 0) {
    const burnDamage = en.burn;
    en.burn -= 1;
    en.hp = Math.max(0, en.hp - burnDamage);
    hitEffect('enemy-portrait-box');
    pop('enemy-zone', `-${burnDamage} 🔥`, 'dmg');
    log(`${b.def.name} took ${burnDamage} burn damage.`);
    renderAll();
    await sleep(600);
    if (battle !== b) return;
    if (b.enemy.hp <= 0) return finish(true);
  }

  // 2. Then it uses its move.
  if (move.kind === 'attack' || move.kind === 'drain') {
    let damage = attackDamage(move);
    en.weakened = false;                          // weaken only affects one attack
    $('enemy-portrait-box').classList.add('attacking');
    await sleep(250);
    $('enemy-portrait-box').classList.remove('attacking');
    if (battle !== b) return;

    if (b.guard) {
      b.guard = false;
      pop('player-zone', '✋ Guarded!', 'block');
      log(`${b.def.name} used ${move.name}, but your Guard stopped it!`);
    } else {
      const through = hurtPlayer(damage);
      hitEffect('player-sprite');
      pop('player-zone', through > 0 ? `-${through}` : 'Blocked', through > 0 ? 'dmg' : 'block');
      log(`${b.def.name} used ${move.name}! ${damage} damage${through < damage ? ` (${damage - through} blocked)` : ''}.`);
    }
    if (move.kind === 'drain') {
      en.hp = Math.min(en.maxHp, en.hp + move.heal);
      pop('enemy-zone', `+${move.heal} HP`, 'heal', 200);
    }
  } else if (move.kind === 'defend') {
    en.block += move.amount;
    pop('enemy-zone', `+${move.amount} 🛡️`, 'block');
    log(`${b.def.name} used ${move.name} and raised a shield.`);
  } else if (move.kind === 'buff') {
    en.strength += move.amount;
    pop('enemy-zone', `💪 +${move.amount}`, 'note bad');
    log(`${b.def.name} used ${move.name}! Its attacks hit harder.`);
  }

  en.moveIndex += 1;                              // pick the next move
  renderAll();
  await sleep(700);

  if (battle !== b) return;
  if (b.hp <= 0) return finish(false);
  beginPlayerTurn();
}

const currentMove = () => battle.def.moves[battle.enemy.moveIndex % battle.def.moves.length];

/** Damage an enemy attack will deal right now (includes strength and weaken). */
function attackDamage(move) {
  const en = battle.enemy;
  const raw = move.amount + en.strength;
  return en.weakened ? Math.floor(raw / 2) : raw;
}

async function finish(won) {
  const b = battle;
  b.over = true;
  b.busy = true;
  const winsBefore = getSave().wins;
  recordResult(won);
  renderAll();

  if (won) {
    $('enemy-portrait-box').classList.add('defeated');
    log(`${b.def.name} was defeated!`);
  } else {
    $('player-sprite').classList.add('defeated');
    log(`${b.starter.name} fainted…`);
  }
  await sleep(1100);
  if (battle !== b) return;

  const save = getSave();
  $('result-title').textContent = won ? '🏆 Victory!' : '💀 Defeated';
  $('result-text').textContent = won
    ? `You beat ${b.def.name}. Win streak: ${save.streak} (best: ${save.bestStreak}). Total wins: ${save.wins}.`
    : `${b.def.name} was too strong this time. Tweak your deck and try again!`;

  const unlocks = won ? newUnlocks(winsBefore, save.wins) : [];
  const list = $('result-unlocks');
  list.replaceChildren(...unlocks.map(u => el('li', '', `🔓 ${u}`)));
  list.hidden = unlocks.length === 0;
  $('result-again').textContent = won ? 'Next battle' : 'Try again';
  openDialog('result-dialog');
}

/** Randomly reorder an array (returns a new array). */
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============================================================
   PART 2: DRAWING THE SCREEN
   ============================================================ */

/** Things that don't change during a battle (sprites, names). */
function setupBattleScreen() {
  const b = battle;
  $('hud-portrait').src = spriteUrl(b.starter, 'front');
  $('player-sprite').src = spriteUrl(b.starter, 'back');
  $('player-sprite').classList.remove('defeated', 'lunge', 'hit');
  $('enemy-img').src = b.def.image;
  $('enemy-img').alt = b.def.name;
  $('enemy-portrait-box').classList.remove('defeated', 'hit', 'attacking');
  $('enemy-zone').dataset.type = b.def.type;
  $('enemy-name').textContent = b.def.name;
  $('enemy-type').textContent = `${TYPES[b.def.type].icon} ${TYPES[b.def.type].label}`;
  $('enemy-type').className = `chip type-${b.def.type}`;
  $('enemy-desc').textContent = b.def.description;
  $('battle-log').textContent = '';
}

function renderAll() {
  if (!battle) return;
  renderBars();
  renderIntent();
  renderStatus();
  renderHand();
}

function setBar(prefix, hp, max) {
  const ratio = Math.max(0, hp / max);
  const fill = $(`${prefix}-hp-fill`);
  fill.style.width = `${ratio * 100}%`;
  fill.dataset.level = ratio > 0.6 ? 'high' : ratio > 0.3 ? 'mid' : 'low';
  $(`${prefix}-hp-text`).textContent = `${hp} / ${max}`;
}

function renderBars() {
  const b = battle;
  setBar('player', b.hp, PLAYER_MAX_HP);
  setBar('enemy', b.enemy.hp, b.enemy.maxHp);
  setPill('player-block', '🛡️', 'Block', b.block);
  setPill('player-energy', '⚡', 'Energy', `${b.energy}/${ENERGY_PER_TURN}`);
  setPill('draw-count', '📚', 'Draw', b.drawPile.length);
  setPill('discard-count', '🗂️', 'Discard', b.discard.length);
  $('end-turn-btn').disabled = b.busy || b.over;
}

/** A small stat badge. The word (Block, Energy...) is hidden on phones to save room. */
function setPill(id, icon, label, value) {
  $(id).replaceChildren(`${icon} `, el('span', 'lbl', `${label} `), String(value));
}

/** The little bubble that says what the enemy will do next. */
function renderIntent() {
  const b = battle;
  const box = $('enemy-intent');
  if (b.over) { box.textContent = ''; box.className = 'intent'; return; }

  const move = currentMove();
  let icon = '⚔️', text = '', kind = 'attack';
  if (move.kind === 'attack' || move.kind === 'drain') {
    const dmg = attackDamage(move);
    icon = move.kind === 'drain' ? '🩸' : '⚔️';
    text = b.guard ? `${move.name} (guarded)` : `${move.name} · ${dmg}`;
  } else if (move.kind === 'defend') {
    icon = '🛡️'; kind = 'defend'; text = `${move.name} · +${move.amount} block`;
  } else {
    icon = '💪'; kind = 'buff'; text = `${move.name} · +${move.amount} strength`;
  }
  box.className = `intent ${kind}`;
  box.replaceChildren(el('span', 'intent-icon', icon), el('span', '', text));
  box.title = 'What the enemy will do on its next turn';
}

function renderStatus() {
  const b = battle;
  const en = b.enemy;
  const enemyChips = [];
  if (en.block)    enemyChips.push(['🛡️', `Block ${en.block}`]);
  if (en.burn)     enemyChips.push(['🔥', `Burn ${en.burn}`]);
  if (en.weakened) enemyChips.push(['💨', 'Weakened']);
  if (en.strength) enemyChips.push(['💪', `Strength +${en.strength}`]);
  $('enemy-status').replaceChildren(...enemyChips.map(chipFor));

  const playerChips = [];
  if (b.focus)      playerChips.push(['🎯', `Focus +${b.focus}`]);
  if (b.guard)      playerChips.push(['✋', 'Guard']);
  if (b.nextEnergy) playerChips.push(['⚡', `+${b.nextEnergy} next turn`]);
  $('player-status').replaceChildren(...playerChips.map(chipFor));
}

const chipFor = ([icon, text]) => el('span', 'chip status', `${icon} ${text}`);

function renderHand() {
  const b = battle;
  const box = $('hand');
  box.replaceChildren();

  b.hand.forEach((entry, i) => {
    const { card } = entry;
    const node = makeCard(card);
    node.classList.add('in-hand');

    if (whyNotPlayable(card) && !b.busy) node.classList.add('unplayable');
    if (b.busy) node.classList.add('waiting');

    if (entry.fresh) {                            // cards just drawn slide in
      node.classList.add('deal');
      node.style.animationDelay = `${i * 70}ms`;
      entry.fresh = false;
    }

    node.tabIndex = 0;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `${card.name}, costs ${card.cost}`);
    node.addEventListener('click', () => playCard(entry.uid));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playCard(entry.uid); }
    });
    box.append(node);
  });
}

/* ---------- little visual effects ---------- */

/** Add a class for a moment, then remove it (restarts the CSS animation). */
function flash(id, className, ms = 400) {
  const node = $(id);
  node.classList.remove(className);
  void node.offsetWidth;                          // forces the browser to restart the animation
  node.classList.add(className);
  setTimeout(() => node.classList.remove(className), ms);
}
const hitEffect = (id) => flash(id, 'hit', 420);
const lunge = (id) => flash(id, 'lunge', 380);

/** A number or word that floats up from a spot on screen. */
function pop(zoneId, text, kind = '', delay = 0) {
  const zone = $(zoneId);
  const node = el('span', `pop ${kind}`, text);
  node.style.animationDelay = `${delay}ms`;
  zone.append(node);
  setTimeout(() => node.remove(), 1400 + delay);
}

function log(message) {
  $('battle-log').textContent = message;
}
