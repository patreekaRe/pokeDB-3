/* ============================================================
   battle.js  -  the turn-based fight.

   How a battle works:
     1. Your deck is shuffled into the DRAW pile.
     2. Each turn you draw 5 cards and get 3 energy.
     3. Playing a card costs energy and does its effects.
     4. End Turn: your hand is discarded, the enemy acts, and a new turn starts.
     5. When the draw pile runs out, the discard pile is shuffled back in.
     6. Reduce the enemy to 0 HP to win. If you hit 0 HP, you lose.

   battle.js does not know about maps or rewards. run.js starts a battle
   with startBattle() and gets told how it went through the onEnd callback.

   All of the battle's numbers live in one object called `battle`.
   The screen is redrawn from that object by the render functions,
   so the game rules (top half) and the drawing code (bottom half)
   stay separate and easy to read.
   ============================================================ */

import { CARDS_BY_ID, TYPES, scaledEffects } from './data/cards.js';
import { RELICS_BY_ID } from './data/relics.js';
import { spriteUrl, stageName } from './data/starters.js';
import { $, el, makeCard, showScreen, setBackdrop, toast, sleep } from './ui.js';

const ENERGY_PER_TURN = 3;
const HAND_SIZE = 5;

/** Relics that boost attacks of one type, by the type of your starter. */
const TYPE_RELIC = { fire: 'charcoal', grass: 'miracle-seed', water: 'mystic-water' };

/** The current battle, or null when no battle is running. */
let battle = null;
let nextUid = 1;

/** Called once at startup. */
export function initBattle() {
  $('end-turn-btn').addEventListener('click', endTurn);
}

/** Leave the battle without finishing it (used when you abandon a run). */
export function abandonBattle() {
  battle = null;
}

export const isBattleRunning = () => battle !== null && !battle.over;

const hasRelic = (id) => battle.relics.includes(id);

/* ============================================================
   PART 1: THE RULES
   ============================================================ */

/**
 * Start a fight.
 *   run        the current run (starter, stage, deck, hp, relics, biome)
 *   encounter  who you are fighting: { def, kind, maxHp, strength }
 *   onEnd      called when the fight is over with { won, hp, damageTaken }
 */
export function startBattle({ run, encounter, onEnd }) {
  const def = encounter.def;

  battle = {
    starter: run.starter,
    stage: run.stage,
    def,
    kind: encounter.kind,
    relics: [...run.relics],
    onEnd,

    // the player
    hp: run.hp,
    maxHp: run.maxHp,
    block: 0,
    energy: 0,
    nextEnergy: 0,     // bonus energy waiting for next turn
    focus: 0,          // bonus damage waiting for your next attack
    guard: false,      // blocks the next enemy attack completely
    sashReady: run.relics.includes('focus-sash'),
    turn: 0,
    damageTaken: 0,

    // the piles of cards
    drawPile: shuffle(run.deck.map(id => CARDS_BY_ID[id])),
    hand: [],
    discard: [],

    // the enemy
    enemy: {
      hp: encounter.maxHp,
      maxHp: encounter.maxHp,
      block: 0,
      strength: encounter.strength,   // extra damage on every attack
      burn: 0,
      weakened: false,                // next attack deals half
      moveIndex: Math.floor(Math.random() * def.moves.length),
    },

    busy: true,        // true while animations play, so clicks are ignored
    over: false,
  };

  setBackdrop(run.backdrop, run.starter.type);
  showScreen('battle-screen');
  setupBattleScreen();

  log(encounter.kind === 'boss' ? `${def.name} blocks the way!` : `A wild ${def.name} appeared!`);
  beginPlayerTurn();
}

function beginPlayerTurn() {
  const b = battle;
  b.turn += 1;
  b.block = b.turn === 1 && hasRelic('iron-plate') ? 8 : 0;   // block only lasts one round
  b.energy = ENERGY_PER_TURN + b.nextEnergy + (hasRelic('choice-scarf') ? 1 : 0);
  b.nextEnergy = 0;

  if (hasRelic('leftovers')) healPlayer(3);
  draw(HAND_SIZE + (hasRelic('scope-lens') ? 1 : 0));
  b.busy = false;
  renderAll();
}

/** Heal the player (never above max HP). Returns how much was healed. */
function healPlayer(amount) {
  const b = battle;
  const healed = Math.min(amount, b.maxHp - b.hp);
  b.hp += healed;
  if (healed > 0) pop('player-zone', `+${healed} HP`, 'heal');
  return healed;
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
  if (card.effects.needsWounded && b.hp >= b.maxHp) return `${card.name} only works when you're hurt.`;
  return null;
}

/** How much damage does this attack do to the current enemy? */
function damageFor(card) {
  const b = battle;
  const e = scaledEffects(card, b.stage);
  if (!e.damage) return { amount: 0, multiplier: 1 };

  let amount = e.damage;
  if (e.bonusIfLow && b.hp < b.maxHp / 2) amount += e.bonusIfLow;
  amount += b.focus;

  // relics
  if (hasRelic('muscle-band')) amount += 2;
  if (card.type === b.starter.type && hasRelic(TYPE_RELIC[card.type])) amount += 2;

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

  const e = scaledEffects(card, b.stage);
  const who = stageName(b.starter, b.stage);

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
    log(`${who} used ${card.name}! ${amount} damage${multiplier > 1 ? ' (super effective!)' : multiplier < 1 ? ' (not very effective)' : ''}.`);
    if (hasRelic('shell-bell')) healPlayer(2);
  } else {
    log(`${who} used ${card.name}.`);
  }

  // --- everything else a card can do ---
  if (e.burn)       { b.enemy.burn += e.burn; pop('enemy-zone', `🔥 Burn ${e.burn}`, 'note'); }
  if (e.weaken)     { b.enemy.weakened = true; pop('enemy-zone', '💨 Weakened', 'note'); }
  if (e.block)      { b.block += e.block; pop('player-zone', `+${e.block} 🛡️`, 'block'); }
  if (e.guard)      { b.guard = true; pop('player-zone', '✋ Guard up', 'block'); }
  if (e.focus)      { b.focus += e.focus; pop('player-zone', `🎯 +${e.focus} next attack`, 'note good'); }
  if (e.nextEnergy) { b.nextEnergy += e.nextEnergy; pop('player-zone', `⚡ +${e.nextEnergy} next turn`, 'note good'); }
  if (e.heal)       healPlayer(e.heal);
  if (e.draw)       draw(e.draw);

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
  let through = amount - absorbed;

  // Focus Sash: survive one fatal hit per battle.
  if (b.hp - through <= 0 && b.sashReady) {
    b.sashReady = false;
    through = b.hp - 1;
    pop('player-zone', '🎗️ Focus Sash!', 'note good', 300);
  }
  b.hp = Math.max(0, b.hp - through);
  b.damageTaken += through;
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
    const damage = attackDamage(move);
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
      if (hasRelic('rocky-helmet')) {
        hurtEnemy(3);
        pop('enemy-zone', '-3 ⛑️', 'dmg', 250);
      }
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
  if (b.enemy.hp <= 0) return finish(true);       // knocked out by Rocky Helmet
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
  renderAll();

  if (won) {
    $('enemy-portrait-box').classList.add('defeated');
    log(`${b.def.name} was defeated!`);
  } else {
    $('player-sprite').classList.add('defeated');
    log(`${stageName(b.starter, b.stage)} fainted…`);
  }
  await sleep(1200);
  if (battle !== b) return;

  b.onEnd({ won, hp: b.hp, damageTaken: b.damageTaken });
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
  $('hud-portrait').src = spriteUrl(b.starter, 'front', b.stage);
  $('player-sprite').src = spriteUrl(b.starter, 'back', b.stage);
  $('player-sprite').alt = stageName(b.starter, b.stage);
  $('player-sprite').classList.remove('defeated', 'lunge', 'hit');

  const img = $('enemy-img');
  img.src = b.def.image;
  img.alt = b.def.name;
  img.classList.toggle('pixel', !b.def.art);
  const box = $('enemy-portrait-box');
  box.classList.remove('defeated', 'hit', 'attacking');
  box.classList.toggle('sprite', !b.def.art);
  box.classList.toggle('elite', b.kind === 'elite');
  box.classList.toggle('boss', b.kind === 'boss');

  $('enemy-zone').dataset.type = b.def.type;
  $('enemy-name').textContent = (b.kind === 'boss' ? '👑 ' : b.kind === 'elite' ? '💀 ' : '') + b.def.name;
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
  setBar('player', b.hp, b.maxHp);
  setBar('enemy', b.enemy.hp, b.enemy.maxHp);
  setPill('player-block', '🛡️', 'Block', b.block);
  setPill('player-energy', '⚡', 'Energy', `${b.energy}`);
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
  b.relics.forEach(id => playerChips.push([RELICS_BY_ID[id].icon, '']));
  $('player-status').replaceChildren(...playerChips.map(chipFor));
}

const chipFor = ([icon, text]) => el('span', 'chip status', text ? `${icon} ${text}` : icon);

function renderHand() {
  const b = battle;
  const box = $('hand');
  box.replaceChildren();

  b.hand.forEach((entry, i) => {
    const { card } = entry;
    const node = makeCard(card, { stage: b.stage });
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
