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

import { CARDS_BY_ID, TYPES, scaledEffects, SUPER_EFFECTIVE, NOT_VERY_EFFECTIVE } from './data/cards.js';
import { RELICS_BY_ID } from './data/relics.js';
import { spriteUrl, stageName } from './data/starters.js';
import { $, el, makeCard, showScreen, setBackdrop, toast, sleep } from './ui.js';
import { playMusic } from './audio.js';

const ENERGY_PER_TURN = 3;
const HAND_SIZE = 5;
const ENRAGE_EVERY = 6;   // every this many turns the enemy gets angrier...
const ENRAGE_BONUS = 2;   // ...and gains this much strength (so you can't stall behind block forever)

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
 *   onEnd      called when the fight is over with
 *              { won, hp, damageTaken }
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
    exhaust: [],       // exhausted cards (e.g. Potion): gone for the rest of THIS fight only

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
  playMusic(encounter.kind === 'boss' ? 'boss' : encounter.kind === 'elite' ? 'elite' : 'wild', { restart: true });
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
  if (type.beats === b.def.type) multiplier = SUPER_EFFECTIVE;
  else if (type.losesTo === b.def.type) multiplier = NOT_VERY_EFFECTIVE;

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
  // Exhausted cards leave the fight for good (they don't go to the discard pile,
  // so they can't reshuffle back into your draw pile this battle).
  if (card.exhaust) b.exhaust.push(card); else b.discard.push(card);

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
  if (card.exhaust) pop('player-zone', `💨 ${card.name} exhausted`, 'note', 300);

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
      const effect = enemyTypeMultiplier();
      if (effect > 1) pop('player-zone', 'Super effective!', 'note bad', 260);
      if (effect < 1) pop('player-zone', 'Not very effective…', 'note good', 260);
      log(`${b.def.name} used ${move.name}! ${damage} damage${effect > 1 ? ' (super effective!)' : effect < 1 ? ' (not very effective)' : ''}${through < damage ? `, ${damage - through} blocked` : ''}.`);
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

  // Enrage: long fights get more dangerous.
  if (b.turn % ENRAGE_EVERY === 0) {
    en.strength += ENRAGE_BONUS;
    pop('enemy-zone', `😡 Enraged +${ENRAGE_BONUS}`, 'note bad', 350);
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

/**
 * The type chart applied to enemy attacks. An enemy's attacks use its own
 * type: super effective if that type beats yours, not very effective if it loses to yours, else x1.
 */
function enemyTypeMultiplier() {
  const attackerType = TYPES[battle.def.type];
  if (attackerType.beats === battle.starter.type) return SUPER_EFFECTIVE;
  if (attackerType.losesTo === battle.starter.type) return NOT_VERY_EFFECTIVE;
  return 1;
}

/** Damage an enemy attack will deal right now (includes strength, type and weaken). */
function attackDamage(move) {
  const en = battle.enemy;
  const raw = Math.round((move.amount + en.strength) * enemyTypeMultiplier());
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
  $('player-name').textContent = stageName(b.starter, b.stage);
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
  box.title = b.def.description;

  $('enemy-zone').dataset.type = b.def.type;
  $('enemy-name').textContent = (b.kind === 'boss' ? '👑 ' : b.kind === 'elite' ? '💀 ' : '') + b.def.name;
  $('enemy-type').textContent = TYPES[b.def.type].icon;
  $('enemy-type').title = `${TYPES[b.def.type].label} type`;
  $('enemy-type').className = `chip type-${b.def.type}`;
  $('battle-log').textContent = '';

  $('battle-relics').replaceChildren(...b.relics.map(id => {
    const relic = RELICS_BY_ID[id];
    const node = el('span', 'battle-relic', relic.icon);
    node.title = `${relic.name}: ${relic.text}`;
    return node;
  }));
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
  $('player-plate').classList.toggle('has-block', b.block > 0);
  $('enemy-plate').classList.toggle('has-block', b.enemy.block > 0);

  const orb = $('player-energy');
  orb.replaceChildren(el('span', 'orb-icon', '⚡'), el('b', '', String(b.energy)));
  orb.classList.toggle('empty', b.energy === 0);
  $('draw-count').textContent = `📚 ${b.drawPile.length}`;
  $('discard-count').textContent = `🗂️ ${b.discard.length}`;
  $('end-turn-btn').disabled = b.busy || b.over;
}

/** The little bubble that says what the enemy will do next. */
function renderIntent() {
  const b = battle;
  const box = $('enemy-intent');
  if (b.over) { box.textContent = ''; box.className = 'intent'; return; }

  const move = currentMove();
  let icon = '⚔️', value = '', kind = 'attack', detail = '';
  if (move.kind === 'attack' || move.kind === 'drain') {
    icon = move.kind === 'drain' ? '🩸' : '⚔️';
    // ▲ means the enemy's type is strong against yours, ▼ means it is weak against yours
    const arrow = enemyTypeMultiplier() > 1 ? '▲' : enemyTypeMultiplier() < 1 ? '▼' : '';
    value = b.guard ? '✋' : `${attackDamage(move)}${arrow}`;
    detail = b.guard ? 'will hit your Guard' : `${attackDamage(move)} damage${move.kind === 'drain' ? ` and heal ${move.heal}` : ''}`;
  } else if (move.kind === 'defend') {
    icon = '🛡️'; kind = 'defend'; value = `+${move.amount}`; detail = `+${move.amount} block`;
  } else {
    icon = '💪'; kind = 'buff'; value = `+${move.amount}`; detail = `+${move.amount} strength`;
  }
  box.className = `intent ${kind}`;
  box.replaceChildren(el('span', 'intent-icon', icon), el('b', 'intent-value', value), el('span', 'intent-name', move.name));
  box.title = `Next turn: ${move.name} (${detail})`;
}

function renderStatus() {
  const b = battle;
  const en = b.enemy;
  const enemyBadges = [];
  if (en.block)    enemyBadges.push(['🛡️', en.block, `Block ${en.block}: soaks up damage until its next turn`, 'block']);
  if (en.burn)     enemyBadges.push(['🔥', en.burn, `Burn ${en.burn}: takes ${en.burn} damage at the start of its turn`]);
  if (en.weakened) enemyBadges.push(['💨', '', 'Weakened: its next attack deals half damage']);
  if (en.strength) enemyBadges.push(['💪', en.strength, `Strength ${en.strength}: +${en.strength} damage on every attack`, 'bad']);
  $('enemy-status').replaceChildren(...enemyBadges.map(badgeFor));

  const playerBadges = [];
  if (b.block)      playerBadges.push(['🛡️', b.block, `Block ${b.block}: absorbs damage until your next turn`, 'block']);
  if (b.focus)      playerBadges.push(['🎯', b.focus, `Focus: your next attack deals +${b.focus} damage`, 'good']);
  if (b.guard)      playerBadges.push(['✋', '', 'Guard: blocks the next enemy attack completely', 'block']);
  if (b.nextEnergy) playerBadges.push(['⚡', b.nextEnergy, `+${b.nextEnergy} energy next turn`, 'good']);
  $('player-status').replaceChildren(...playerBadges.map(badgeFor));
}

/** A floating status icon above a sprite, with its number in a corner bubble. */
function badgeFor([icon, value, title, kind = '']) {
  const node = el('span', `badge ${kind}`, icon);
  node.title = title;
  node.setAttribute('aria-label', title);
  if (value !== '') node.append(el('b', '', String(value)));
  return node;
}

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
