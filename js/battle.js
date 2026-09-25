/* ============================================================
   battle.js  -  the turn-based fight.

   How a battle works:
     1. Your deck is shuffled into the DRAW pile.
     2. Each turn you draw 5 cards and get 3 energy.
     3. Playing a card costs energy and does its effects.
     4. End Turn: your hand is discarded (except cards that retain), the
        enemy acts, and a new turn starts.
     5. When the draw pile runs out, the discard pile is shuffled back in.
     6. Reduce the enemy to 0 HP to win. If you hit 0 HP, you lose.

   battle.js does not know about maps or rewards. run.js starts a battle
   with startBattle() and gets told how it went through the onEnd callback.

   All of the battle's numbers live in one object called `battle`.
   The screen is redrawn from that object by the render functions,
   so the game rules (top half) and the drawing code (bottom half)
   stay separate and easy to read.
   ============================================================ */

import { CARDS_BY_ID, TYPES, POWERS, POWER_LENS, scaledEffects, SUPER_EFFECTIVE, NOT_VERY_EFFECTIVE } from './data/cards.js';
import { spriteUrl, stageName } from './data/starters.js';
import { ITEMS_BY_ID } from './data/items.js';
import { SPRITE_FIT } from './data/sprite-fit.js';
import { $, el, makeCard, makeRelic, showScreen, setTheme, sleep, setHpBar } from './ui.js';
import { showScene, setStorm } from './scene.js';
import { BIOMES } from './data/enemies.js';
import { playMusic, preloadMusic, playCry, preloadCries, playSound, preloadSounds, setLoop } from './audio.js';

const ENERGY_PER_TURN = 3;
const HAND_SIZE = 5;
const ENRAGE_EVERY = 6;   // every this many turns the enemy gets angrier...
const ENRAGE_BONUS = 2;   // ...and gains this much strength (so you can't stall behind block forever)
const CRY_WAIT_MAX = 3000;   // ms: the intro never waits longer than this for one cry

/** Relics that boost attacks of one type, by the type of your starter. */
const TYPE_RELIC = { fire: 'charcoal', grass: 'miracle-seed', water: 'mystic-water' };

/** The current battle, or null when no battle is running. */
let battle = null;
let nextUid = 1;

/** Called once at startup. */
export function initBattle() {
  $('end-turn-btn').addEventListener('click', endTurn);
  // tapping the battle around a picked card, or Escape, puts it back; tapping another card in the hand picks that one
  $('card-focus').addEventListener('click', (e) => {
    if (e.target.closest('.focus-card, .focus-play')) return;
    const other = document.elementsFromPoint(e.clientX, e.clientY).find(node => node.matches('.card.in-hand:not(.lifted)'));
    if (other && selectedUid !== null) tapCard(Number(other.dataset.uid));
    else cancelPick();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && battle) cancelPick(); });
  addEventListener('resize', () => { if (battle) { fanHand(); renderFocus(); } });
}

/** Leave the battle without finishing it (used when you abandon a run). */
export function abandonBattle() {
  battle = null;
  setLoop('low-hp', false);
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
 *              { won, hp, damageTaken }, plus fled: true after a Poké Doll
 */
export function startBattle({ run, encounter, onEnd }) {
  const def = encounter.def;

  battle = {
    starter: run.starter,
    stage: run.stage,
    def,
    kind: encounter.kind,
    relics: [...run.relics],
    items: run.items,   // the run's own list: using an item takes it out of the Bag
    onEnd,

    // the player
    hp: run.hp,
    maxHp: run.maxHp,
    block: 0,
    energy: 0,
    nextEnergy: 0,     // bonus energy waiting for next turn
    focus: 0,          // bonus damage waiting for your next attack
    guard: false,      // blocks the next enemy attack completely
    strength: run.relics.includes('black-belt') ? 1 : 0,   // extra damage on every hit, for the rest of this fight
    powers: {},        // power effects played this fight, added up: { blockEachTurn: 5, ... }
    sashReady: run.relics.includes('focus-sash'),
    turn: 0,
    damageTaken: 0,

    // the piles of cards
    drawPile: shuffle(run.deck.map(id => CARDS_BY_ID[id])),
    hand: [],
    discard: [],
    exhaust: [],       // exhausted and power cards: gone for the rest of THIS fight only

    // the enemy
    enemy: {
      hp: encounter.maxHp,
      maxHp: encounter.maxHp,
      block: 0,
      strength: encounter.strength,   // extra damage on every attack
      burn: run.relics.includes('flame-orb') ? 3 : 0,
      weakened: false,                // next attack deals half
      moveIndex: Math.floor(Math.random() * def.moves.length),
    },

    busy: true,        // true while animations play, so clicks are ignored
    over: false,
  };

  setTheme(run.starter.type);
  showScreen('battle-screen');
  showScene(BIOMES[run.biome]?.id, encounter.kind === 'boss' || encounter.kind === 'elite' ? encounter.kind : 'wild');
  playMusic(encounter.kind === 'boss' ? 'boss' : encounter.kind === 'elite' ? 'elite' : 'wild', { restart: true });
  preloadMusic('victory');
  setupBattleScreen();

  log(encounter.kind === 'boss' ? `${def.name} blocks the way!` : `A wild ${def.name} appeared!`);
  playIntro();
}

/**
 * The enemy appears and cries, then a Poké Ball is thrown in and your
 * Pokémon pops out and cries. Cards can't be played until it's done.
 */
async function playIntro() {
  const b = battle;
  const zone = $('player-zone');
  const sprite = $('player-sprite');
  const ball = $('intro-ball');
  const enemyZone = $('enemy-zone');
  const still = () => battle === b;   // the run may be abandoned mid-intro
  const cry = (id) => id ? Promise.race([playCry(id), sleep(CRY_WAIT_MAX)]) : null;
  const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const playerSpriteId = b.starter.line[b.stage].id;
  preloadCries(b.def.spriteId ?? '', playerSpriteId);
  preloadSounds('card', 'hit', 'block', 'faint', 'item', 'potion', 'ball-throw', 'ball-open', 'stat-up', 'stat-down', 'low-hp',
    'heal-hp', 'power', 'burn', 'shuffle', ...(b.kind === 'boss' ? ['thunder'] : []));

  zone.classList.add('awaiting');
  renderAll();
  // each Pokémon only cries once it's actually there to see
  if (motion) {
    enemyZone.classList.add('entering');
    await sleep(800);
    if (!still()) return;
    enemyZone.classList.replace('entering', 'revealed');
  }
  await Promise.all([cry(b.def.spriteId), sleep(motion ? 500 : 300)]);
  if (!still()) return;
  enemyZone.classList.remove('revealed');

  if (motion) {
    ball.hidden = false;
    // start off the left edge near the bottom; starting below the window would make the page scrollable for a moment
    const at = ball.getBoundingClientRect();
    ball.style.setProperty('--from-x', `${-at.left - 60}px`);
    ball.style.setProperty('--from-y', `${innerHeight - at.top - 40}px`);
    ball.classList.add('thrown');
    playSound('ball-throw');
    await sleep(700);
    if (!still()) return;
    ball.classList.replace('thrown', 'open');
    playSound('ball-open');
    await sleep(180);
    if (!still()) return;
  }
  zone.classList.remove('awaiting');
  if (motion) {
    sprite.classList.add('released');
    await sleep(330);   // the pop is at full size 55% into its 0.6 s
    if (!still()) return;
  }
  await Promise.all([cry(playerSpriteId), sleep(motion ? 270 : 0)]);
  if (!still()) return;
  resetIntro();
  beginPlayerTurn();
}

/** Put the intro's pieces back to rest (also run before each battle, in case one was cut short). */
function resetIntro() {
  const ball = $('intro-ball');
  ball.hidden = true;
  ball.classList.remove('thrown', 'open');
  $('player-sprite').classList.remove('released');
  $('player-zone').classList.remove('awaiting');
  $('enemy-zone').classList.remove('entering', 'revealed');
}

function beginPlayerTurn() {
  const b = battle;
  b.turn += 1;
  const p = b.powers;
  b.block = (b.turn === 1 && hasRelic('iron-plate') ? 8 : 0) + (p.blockEachTurn || 0);   // block only lasts one round
  if (b.block) statFx('player');
  const bossEnergy = ['choice-band', 'choice-specs', 'toxic-orb'].filter(hasRelic).length;
  b.energy = ENERGY_PER_TURN + b.nextEnergy + (hasRelic('choice-scarf') ? 1 : 0) + bossEnergy;
  b.turnEnergy = b.energy;
  b.nextEnergy = 0;

  if (hasRelic('toxic-orb') && b.hp > 1) { b.hp -= 1; b.damageTaken += 1; pop('player-zone', '-1 ☠️', 'dmg'); }
  if (hasRelic('leftovers')) healPlayer(2);
  if (p.healEachTurn && healPlayer(p.healEachTurn + healBonus())) playSound('heal-hp');
  if (hasRelic('grassy-seed') && b.turn % 3 === 0) { b.strength += 1; pop('player-zone', '🍀 +1 strength', 'note good'); playSound('stat-up'); statFx('player'); }
  if (p.burnEachTurn) { b.enemy.burn += p.burnEachTurn; pop('enemy-zone', `🔥 Burn ${p.burnEachTurn}`, 'note'); }
  if (p.strengthEachTurn) { b.strength += p.strengthEachTurn; pop('player-zone', `💪 +${p.strengthEachTurn}`, 'note good'); playSound('stat-up'); statFx('player'); }
  draw(HAND_SIZE + (hasRelic('scope-lens') ? 1 : 0) + (p.drawEachTurn || 0)
    + (b.turn === 1 && hasRelic('quick-claw') ? 2 : 0) - (hasRelic('choice-specs') ? 1 : 0));
  b.busy = false;
  renderAll();
}

/** Big Root: extra healing on heals that come from cards and powers (not other relics). */
const healBonus = () => (hasRelic('big-root') ? 2 : 0);

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
      playSound('shuffle');
      b.discard = [];
    }
    b.hand.push({ uid: nextUid++, card: b.drawPile.pop(), fresh: true });
  }
}

/** Can this card be played right now? Returns null if yes, or the reason if not. */
function whyNotPlayable(card) {
  const b = battle;
  if (b.busy || b.over) return 'Wait for your turn.';
  if (card.cost > b.energy) return 'Not enough PP!';
  if (card.effects.needsWounded && b.hp >= b.maxHp) return `${card.name} only works when you're hurt.`;
  return null;
}

/** The damage of each hit this attack does to the current enemy (an empty list for non-attacks). */
function damageFor(card) {
  const b = battle;
  const e = scaledEffects(card, b.stage);
  if (!e.damage && !e.blockDamage) return { hits: [], multiplier: 1 };

  const low = b.hp < b.maxHp / 2;
  let amount = e.blockDamage ? b.block : e.damage;
  if (e.bonusIfLow && low) amount += e.bonusIfLow;
  if (e.bonusPerBurn) amount += e.bonusPerBurn * b.enemy.burn;
  amount += b.strength * (e.strengthMult || 1);
  if (b.powers.blaze && low) amount += b.powers.blaze;

  // relics
  if (hasRelic('muscle-band')) amount += 2;
  if (card.type === b.starter.type && hasRelic(TYPE_RELIC[card.type])) amount += 2;

  // Fire beats Grass, Grass beats Water, Water beats Fire.
  let multiplier = 1;
  const type = TYPES[card.type];
  if (type.beats === b.def.type) multiplier = SUPER_EFFECTIVE;
  else if (type.losesTo === b.def.type) multiplier = NOT_VERY_EFFECTIVE;

  const hits = Array.from({ length: e.hits || 1 }, (_, i) => Math.round((amount + (i === 0 ? b.focus : 0)) * multiplier));
  return { hits, multiplier };
}

async function playCard(uid) {
  const b = battle;
  const index = b.hand.findIndex(h => h.uid === uid);
  if (index === -1) return;

  const { card } = b.hand[index];
  const problem = whyNotPlayable(card);
  if (problem) {
    log(problem);   // in the text box, like the games' "There's no PP left for this move!"
    if (card.cost > b.energy) shake($('player-energy'));
    return;
  }

  b.busy = true;
  b.energy -= card.cost;
  b.hand.splice(index, 1);
  playSound('card');
  // Exhausted cards leave the fight for good (they don't go to the discard pile,
  // so they can't reshuffle back into your draw pile this battle).
  if (card.exhaust || card.power) b.exhaust.push(card); else b.discard.push(card);

  const e = scaledEffects(card, b.stage);
  const who = stageName(b.starter, b.stage);

  if (e.selfDamage) {
    b.hp = Math.max(1, b.hp - e.selfDamage);
    b.damageTaken += e.selfDamage;
    pop('player-zone', `-${e.selfDamage}`, 'dmg');
  }

  // --- damage ---
  const { hits, multiplier } = damageFor(card);
  if (hits.length) {
    b.focus = 0;                                  // focus is used up by the attack
    for (const [i, amount] of hits.entries()) {
      lunge('player-sprite');
      await sleep(180);
      if (battle !== b) return;
      const dealt = hurtEnemy(amount);
      hitSound(dealt, multiplier);
      hitEffect('enemy-portrait-box');
      bigHit(dealt, b.enemy.maxHp);
      pop('enemy-zone', dealt > 0 ? `-${dealt}` : 'Blocked', dealt > 0 ? 'dmg' : 'note');
      if (b.enemy.hp <= 0) break;
      if (i < hits.length - 1) { renderBars(); await sleep(200); }
    }
    if (multiplier > 1) pop('enemy-zone', 'Super effective!', 'note good', 260);
    if (multiplier < 1) pop('enemy-zone', 'Not very effective…', 'note bad', 260);
    const total = hits.length > 1 ? `${hits.join(' + ')} damage` : `${hits[0]} damage`;
    log(`${who} used ${card.name}! ${total}${multiplier > 1 ? ' (super effective!)' : multiplier < 1 ? ' (not very effective)' : ''}.`);
    if (hasRelic('shell-bell')) healPlayer(1);
  } else {
    log(`${who} used ${card.name}.`);
  }

  // --- everything else a card can do ---
  if (e.burn)       { b.enemy.burn += e.burn; pop('enemy-zone', `🔥 Burn ${e.burn}`, 'note'); }
  if (e.weaken)     { b.enemy.weakened = true; pop('enemy-zone', '📉 Weakened', 'note'); playSound('stat-down'); statFx('enemy', 'down'); }
  if (e.block)      { const block = e.block + (hasRelic('damp-rock') ? 2 : 0); b.block += block; pop('player-zone', `+${block} 🛡️`, 'block'); playSound('block'); statFx('player'); }
  if (e.guard)      { b.guard = true; pop('player-zone', '✋ Guard up', 'block'); statFx('player'); }
  if (e.focus)      { b.focus += e.focus; pop('player-zone', `🎯 +${e.focus} next attack`, 'note good'); playSound('stat-up'); statFx('player'); }
  if (e.strength)   { b.strength += e.strength; pop('player-zone', `💪 +${e.strength}`, 'note good'); playSound('stat-up'); statFx('player'); }
  if (e.nextEnergy) { b.nextEnergy += e.nextEnergy; pop('player-zone', `⚡ +${e.nextEnergy} next turn`, 'note good'); }
  if (e.energy)     { b.energy += e.energy; b.turnEnergy += e.energy; pop('player-zone', `⚡ +${e.energy}`, 'note good'); }
  if (card.power) {
    for (const key of Object.keys(POWERS)) if (e[key]) b.powers[key] = (b.powers[key] || 0) + e[key];
    pop('player-zone', `${POWER_LENS[b.starter.type] ?? '🧬'} ${card.name}`, 'note good', 200);
    playSound('power');
  }
  if (e.heal && healPlayer(e.heal + healBonus())) playSound('heal-hp');
  if (e.draw)       draw(e.draw);
  if (card.power && hasRelic('power-herb')) draw(1);
  if (card.exhaust) {
    pop('player-zone', `💨 ${card.name} exhausted`, 'note', 300);
    if (hasRelic('eject-pack')) draw(1);
  }

  renderAll();
  await sleep(220);

  if (battle !== b) return;                      // the player left the battle
  if (b.enemy.hp <= 0) return finish(true);
  b.busy = false;
  renderAll();
}

/* ---------- items: free to use, once, on your turn ---------- */

function whyNotUsable(item) {
  const b = battle;
  if (b.busy || b.over) return 'Wait for your turn.';
  if (item.effects.flee && b.kind === 'boss') return 'You can\'t run from a boss!';
  if (item.effects.heal && !Object.keys(item.effects).some(k => k !== 'heal') && b.hp >= b.maxHp) return 'Your HP is already full.';
  return null;
}

async function useItem(index) {
  const b = battle;
  const item = ITEMS_BY_ID[b.items[index]];
  if (!item) return;
  const problem = whyNotUsable(item);
  if (problem) return log(problem);

  b.busy = true;
  b.items.splice(index, 1);
  const e = item.effects;
  log(`You used ${item.name}!`);
  playSound(e.heal ? 'potion' : 'item', 'item');

  if (e.flee) {
    b.over = true;
    renderAll();
    $('player-sprite').classList.add('fled');
    await sleep(900);
    if (battle !== b) return;
    $('player-sprite').classList.remove('fled');
    return b.onEnd({ won: false, fled: true, hp: b.hp, damageTaken: b.damageTaken });
  }

  if (e.burn)     { b.enemy.burn += e.burn; pop('enemy-zone', `🔥 Burn ${e.burn}`, 'note'); }
  if (e.block)    { b.block += e.block; pop('player-zone', `+${e.block} 🛡️`, 'block'); statFx('player'); }
  if (e.guard)    { b.guard = true; pop('player-zone', '✋ Guard up', 'block'); statFx('player'); }
  if (e.focus)    { b.focus += e.focus; pop('player-zone', `🎯 +${e.focus} next attack`, 'note good'); playSound('stat-up'); statFx('player'); }
  if (e.strength) { b.strength += e.strength; pop('player-zone', `💪 +${e.strength}`, 'note good'); playSound('stat-up'); statFx('player'); }
  if (e.energy)   { b.energy += e.energy; b.turnEnergy += e.energy; pop('player-zone', `⚡ +${e.energy}`, 'note good'); }
  if (e.heal)     healPlayer(e.heal);
  if (e.draw)     draw(e.draw);

  renderAll();
  await sleep(220);
  if (battle !== b) return;
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
  checkStorm();
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

  // Discard whatever is left in your hand, except cards that retain.
  // Grip Claw also keeps the leftmost card that would have been discarded.
  const gripped = hasRelic('grip-claw') ? b.hand.find(h => !h.card.retain) : null;
  const stays = (h) => h.card.retain || h === gripped;
  b.discard.push(...b.hand.filter(h => !stays(h)).map(h => h.card));
  b.hand = b.hand.filter(stays);
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
    checkStorm();
    hitEffect('enemy-portrait-box');
    pop('enemy-zone', `-${burnDamage} 🔥`, 'dmg');
    log(`${b.def.name} took ${burnDamage} burn damage.`);
    playSound('burn');
    if (hasRelic('heat-rock')) healPlayer(1);
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
      const effect = enemyTypeMultiplier();
      hitSound(through, effect);
      hitEffect('player-sprite');
      bigHit(through, b.maxHp);
      pop('player-zone', through > 0 ? `-${through}` : 'Blocked', through > 0 ? 'dmg' : 'block');
      if (effect > 1) pop('player-zone', 'Super effective!', 'note bad', 260);
      if (effect < 1) pop('player-zone', 'Not very effective…', 'note good', 260);
      log(`${b.def.name} used ${move.name}! ${damage} damage${effect > 1 ? ' (super effective!)' : effect < 1 ? ' (not very effective)' : ''}${through < damage ? `, ${damage - through} blocked` : ''}.`);
      if (hasRelic('rocky-helmet')) {
        hurtEnemy(3);
        pop('enemy-zone', '-3 ⛑️', 'dmg', 250);
      }
      if (hasRelic('wave-incense') && through === 0 && damage > 0) {
        hurtEnemy(5);
        pop('enemy-zone', '-5 🌊', 'dmg', 320);
      }
      if (b.powers.thorns) {
        hurtEnemy(b.powers.thorns);
        pop('enemy-zone', `-${b.powers.thorns} 🔮`, 'dmg', 400);
      }
    }
    if (move.kind === 'drain') {
      en.hp = Math.min(en.maxHp, en.hp + move.heal);
      pop('enemy-zone', `+${move.heal} HP`, 'heal', 200);
    }
  } else if (move.kind === 'defend') {
    en.block += move.amount;
    pop('enemy-zone', `+${move.amount} 🛡️`, 'block');
    statFx('enemy');
    log(`${b.def.name} used ${move.name} and raised a shield.`);
  } else if (move.kind === 'buff') {
    en.strength += move.amount;
    pop('enemy-zone', `💪 +${move.amount}`, 'note bad');
    playSound('stat-up');
    statFx('enemy');
    log(`${b.def.name} used ${move.name}! Its attacks hit harder.`);
  }

  // Enrage: long fights get more dangerous.
  if (b.turn % ENRAGE_EVERY === 0) {
    en.strength += ENRAGE_BONUS;
    pop('enemy-zone', `😡 Enraged +${ENRAGE_BONUS}`, 'note bad', 350);
    playSound('stat-up');
    statFx('enemy');
  }

  en.moveIndex += 1;                              // pick the next move
  renderAll();
  await sleep(700);

  if (battle !== b) return;
  if (b.hp <= 0) return finish(false);
  if (b.enemy.hp <= 0) return finish(true);       // knocked out by Rocky Helmet or Mirror Coat
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
  setStorm(false);
  b.busy = true;
  renderAll();

  if (won) {
    $('enemy-portrait-box').classList.add('defeated');
    playSound('faint');
    playMusic('victory', { restart: true, cut: true });   // like the games: the fanfare starts as the enemy faints
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

/**
 * The sprite files share one pixel scale (Pidgey is 48px, Charizard 100px), so size each by its file
 * instead of stretching all to one box. SPRITE_FIT gives the Pokémon's resting pose inside its GIF; the
 * pose's longest side sets the size ((side / 64)^lean * times, clamped, then * stage), and the box is
 * scaled so the pose, not the whole frame, comes out that big. --shift/--drop move the image so the
 * pose stands centred on its feet at the box bottom, and --head-room is how far down the box its head
 * starts (the enemy's intent drops to it). Your Pokémon's base size is bigger, since it stands nearer.
 */
function sizeSprite(img, lean, times, min, max, stage = 1, target = img) {
  const apply = () => {
    const W = img.naturalWidth, H = img.naturalHeight;
    if (!W) return;
    const [top, bottom, left, right] = SPRITE_FIT[img.src.split('/').pop().replace(/\.gif$/, '')] || [0, 0, 0, 0];
    const long = Math.max(W, H);
    const pose = Math.max(W - left - right, H - top - bottom);
    const f = Math.min(max, Math.max(min, Math.pow(pose / 64, lean) * times)) * stage;
    const set = (name, value) => target.style.setProperty(name, value.toFixed(3));
    set('--size', f * long / pose);
    set('--shift', (right - left) / 2 / long);
    set('--drop', bottom / long);
    set('--head-room', (long - H + top + bottom) / long);
  };
  img.onload = apply;
  if (img.complete) apply();
}

/** Things that don't change during a battle (sprites, names). */
function setupBattleScreen() {
  const b = battle;
  $('player-name').textContent = stageName(b.starter, b.stage);
  $('player-sprite').src = spriteUrl(b.starter, 'back', b.stage);
  $('player-sprite').alt = stageName(b.starter, b.stage);
  $('player-sprite').dataset.stage = String(b.stage);
  $('player-sprite').classList.remove('defeated', 'lunge', 'hit');
  // legendaries keep one sprite, so they grow by stage like the map sprites; the others' files already grow
  const oneSprite = b.starter.line.every(form => form.id.replace(/-shiny$/, '') === b.starter.line[0].id);
  sizeSprite($('player-sprite'), 0.5, 1.1, 0.75, 1.25, oneSprite ? [0.78, 0.9, 1][b.stage] : 1);
  resetIntro();

  const img = $('enemy-img');
  img.src = b.def.image;
  img.alt = b.def.name;
  img.classList.toggle('pixel', !b.def.art);
  const box = $('enemy-portrait-box');
  box.classList.remove('defeated', 'hit', 'attacking');
  box.classList.toggle('sprite', !b.def.art);
  const zone = $('enemy-zone');
  if (b.def.art) ['--size', '--shift', '--drop', '--head-room'].forEach(name => zone.style.removeProperty(name));
  else sizeSprite(img, 0.6, 1, 0.7, 1.3, 1, zone);
  box.classList.toggle('elite', b.kind === 'elite');
  box.classList.toggle('boss', b.kind === 'boss');
  box.title = b.def.description;

  $('enemy-zone').dataset.type = b.def.type;
  $('enemy-name').textContent = (b.kind === 'boss' ? '👹 ' : b.kind === 'elite' ? '💀 ' : '') + b.def.name;
  $('enemy-type').textContent = TYPES[b.def.type].icon;
  $('enemy-type').title = `${TYPES[b.def.type].label} type`;
  $('enemy-type').className = `chip type-${b.def.type}`;
  log('');
}

function renderAll() {
  if (!battle) return;
  renderBars();
  renderIntent();
  renderStatus();
  renderItems();
  renderHand();
}

/** Items are used from the Bag's Items pocket (pickItem), not the battle screen: drop a pick that no longer stands. */
function renderItems() {
  if (battle.busy || !battle.items[selectedItem]) selectedItem = null;
}

function renderBars() {
  const b = battle;
  setHpBar('player', b.hp, b.maxHp);
  setLoop('low-hp', !b.over && b.hp > 0 && b.hp <= b.maxHp * 0.2);   // the games' low-HP beeping
  setHpBar('enemy', b.enemy.hp, b.enemy.maxHp);
  $('player-plate').classList.toggle('has-block', b.block > 0);
  $('enemy-plate').classList.toggle('has-block', b.enemy.block > 0);

  // Energy is shown as the games' PP: "PP 2/3", out of what this turn started with. The number bumps when it changes.
  const orb = $('player-energy');
  const max = Math.max(b.turnEnergy ?? ENERGY_PER_TURN, b.energy);
  const shown = orb.dataset.shown === undefined ? b.energy : Number(orb.dataset.shown);
  const count = el('b', b.energy !== shown ? 'bump' : '', String(b.energy));
  const numbers = el('span', 'pp-count');
  numbers.append(count, `/${max}`);
  const pill = el('span', 'pp-pill');
  pill.append(el('span', 'pp-label', 'PP'), numbers);
  orb.replaceChildren(pill);
  orb.dataset.shown = String(b.energy);
  orb.classList.toggle('empty', b.energy === 0);
  $('draw-count').replaceChildren(el('span', 'pile-icon', '📚'), el('b', '', String(b.drawPile.length)));
  $('discard-count').replaceChildren(el('span', 'pile-icon', '🗂️'), el('b', '', String(b.discard.length)));
  $('end-turn-btn').disabled = b.busy || b.over;
}

/** The little bubble that says what the enemy will do next. */
function renderIntent() {
  const b = battle;
  const box = $('enemy-intent');
  if (b.over) { box.textContent = ''; box.className = 'intent'; delete box.dataset.move; return; }

  const move = currentMove();
  let icon = '⚔️', value = '', kind = 'attack', detail = '';
  if (move.kind === 'attack' || move.kind === 'drain') {
    icon = move.kind === 'drain' ? '🩸' : '⚔️';
    kind = move.kind;
    // ▲ means the enemy's type is strong against yours, ▼ means it is weak against yours
    const arrow = enemyTypeMultiplier() > 1 ? '▲' : enemyTypeMultiplier() < 1 ? '▼' : '';
    value = b.guard ? '✋' : `${attackDamage(move)}${arrow}`;
    detail = b.guard ? 'will hit your Guard' : `${attackDamage(move)} damage${move.kind === 'drain' ? ` and heal ${move.heal}` : ''}`;
  } else if (move.kind === 'defend') {
    icon = '🛡️'; kind = 'defend'; value = `+${move.amount}`; detail = `+${move.amount} block`;
  } else {
    icon = '💪'; kind = 'buff'; value = `+${move.amount}`; detail = `+${move.amount} strength`;
  }
  // The bubble pops in like the games' "!" emote, but only when the enemy picks a new move.
  const key = `${b.turn}:${move.name}`;
  const fresh = box.dataset.move !== key;
  box.dataset.move = key;
  box.className = `intent ${kind} fresh`;
  if (fresh) { box.classList.remove('fresh'); void box.offsetWidth; box.classList.add('fresh'); }
  box.replaceChildren(el('span', 'intent-icon', icon), el('b', 'intent-value', value), el('span', 'intent-name', move.name));
  box.title = `Next turn: ${move.name} (${detail})`;
}

function renderStatus() {
  const b = battle;
  const en = b.enemy;
  const enemyBadges = [];
  if (en.block)    enemyBadges.push(['🛡️', en.block, `Block ${en.block}: soaks up damage until its next turn`, 'block']);
  if (en.burn)     enemyBadges.push(['🔥', en.burn, `Burn ${en.burn}: takes ${en.burn} damage at the start of its turn`]);
  if (en.weakened) enemyBadges.push(['📉', '', 'Weakened: its next attack deals half damage']);
  if (en.strength) enemyBadges.push(['💪', en.strength, `Strength ${en.strength}: +${en.strength} damage on every attack`, 'bad']);
  $('enemy-status').replaceChildren(...enemyBadges.map(badgeFor));

  const playerBadges = [];
  if (b.block)      playerBadges.push(['🛡️', b.block, `Block ${b.block}: absorbs damage until your next turn`, 'block']);
  if (b.strength)   playerBadges.push(['💪', b.strength, `Strength ${b.strength}: +${b.strength} damage on every hit`, 'good']);
  if (b.focus)      playerBadges.push(['🎯', b.focus, `Focus: your next attack deals +${b.focus} damage`, 'good']);
  if (b.guard)      playerBadges.push(['✋', '', 'Guard: blocks the next enemy attack completely', 'block']);
  if (b.nextEnergy) playerBadges.push(['⚡', b.nextEnergy, `+${b.nextEnergy} energy next turn`, 'good']);
  for (const [key, power] of Object.entries(POWERS)) {
    if (b.powers[key]) playerBadges.push([power.icon, b.powers[key], power.text(b.powers[key]), 'good']);
  }
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
  if (b.busy || !b.hand.some(entry => entry.uid === selectedUid)) selectedUid = null;

  b.hand.forEach((entry, i) => {
    const { card } = entry;
    const node = makeCard(card, { stage: b.stage });
    node.classList.add('in-hand');

    if (whyNotPlayable(card) && !b.busy) node.classList.add('unplayable');
    if (b.busy) node.classList.add('waiting');
    if (entry.uid === selectedUid) node.classList.add('selected');
    node.dataset.uid = entry.uid;

    if (entry.fresh) {                            // cards just drawn slide in
      node.classList.add('deal');
      node.style.animationDelay = `${i * 70}ms`;
      entry.fresh = false;
    }

    node.tabIndex = 0;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `${card.name}, costs ${card.cost}`);
    node.addEventListener('click', () => tapCard(entry.uid));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapCard(entry.uid); }
    });
    box.append(node);
  });
  fanHand();
  renderFocus();
}

/** Fans the hand in a gentle arc, like cards held in a hand: each overlaps the last a little,
    more as the hand grows so it always fits: the hand never scrolls. */
function fanHand() {
  const box = $('hand');
  const cards = [...box.children];
  const n = cards.length;
  if (!n || !box.clientWidth) return;
  const w = cards[0].offsetWidth;
  const pad = getComputedStyle(box);
  const room = box.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight) - 16;   // the tilted end cards stick out a little
  const step = n > 1 ? Math.max(w * 0.12, Math.min(w * 0.88, (room - w) / (n - 1))) : w;
  const edge = (n - 1) / 2;
  box.style.setProperty('--overlap', `${w - step}px`);
  box.style.setProperty('--fan-tilt', `${edge ? Math.min(2.5, 9 / edge) : 0}deg`);
  box.style.setProperty('--fan-drop', `${edge ? Math.min(3, 14 / (edge * edge)) : 0}px`);
  cards.forEach((card, i) => card.style.setProperty('--fan', i - edge));
}

/* ---------- picking a card: the first tap blows it up, the second plays it ---------- */

let selectedUid = null;
let selectedItem = null;   // index into battle.items; items are picked and confirmed the same way

function tapCard(uid) {
  if (battle.busy) return;
  selectedItem = null;
  const entry = battle.hand.find(h => h.uid === uid);
  // a card that can't be played skips the big preview, which would cover the PP box's shake and the reason in the text box
  if (entry && whyNotPlayable(entry.card)) {
    selectedUid = null;
    renderItems();
    renderHand();
    return playCard(uid);
  }
  if (selectedUid === uid) {
    selectedUid = null;
    return playCard(uid);
  }
  selectedUid = uid;
  renderItems();
  renderHand();
}

function tapItem(index) {
  if (!battle || battle.busy) return;
  selectedUid = null;
  if (selectedItem === index) {
    selectedItem = null;
    return useItem(index);
  }
  selectedItem = index;
  renderItems();
  renderHand();
}

/** The Bag's Items pocket uses the same pick as the slots, so an item always gets a confirm step. */
export function pickItem(index) {
  if (!isBattleRunning() || battle.busy) return;
  selectedItem = null;
  tapItem(index);
}

function cancelPick() {
  if (selectedUid === null && selectedItem === null) return;
  playSound('cancel', 'confirm');
  selectedUid = null;
  selectedItem = null;
  renderItems();
  renderHand();
}

/** The Play / Use button under a picked card or item: End Turn's red striped panel and pill. */
function focusButton(label, onClick) {
  const btn = el('button', 'ds-btn ds-play focus-play');
  btn.type = 'button';
  btn.append(el('span', 'pp-pill', label));
  btn.addEventListener('click', onClick);
  return btn;
}

/** The picked card, risen out of the hand (popFromHand()), or the picked item blown up at the bottom middle over a dimmed battle. */
function renderFocus() {
  const b = battle;
  const layer = $('card-focus');
  layer.classList.remove('rise');
  const item = ITEMS_BY_ID[b.items[selectedItem]];
  if (item) {
    const index = selectedItem;
    const big = makeRelic(item);
    big.classList.add('focus-card', 'focus-item');
    const problem = whyNotUsable(item);
    if (problem) big.classList.add('unplayable');
    big.tabIndex = 0;
    big.setAttribute('role', 'button');
    big.setAttribute('aria-label', `Use ${item.name}`);
    big.addEventListener('click', () => tapItem(index));
    big.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapItem(index); }
    });
    layer.replaceChildren(big, problem ? el('p', 'focus-hint', problem) : focusButton('Use', () => tapItem(index)));
    layer.hidden = false;
    big.focus({ preventScroll: true });
    return;
  }
  const entry = b.hand.find(h => h.uid === selectedUid);
  if (!entry) { layer.hidden = true; layer.replaceChildren(); return; }

  const big = makeCard(entry.card, { stage: b.stage });
  big.classList.add('focus-card');
  const problem = whyNotPlayable(entry.card);
  if (problem) big.classList.add('unplayable');
  big.tabIndex = 0;
  big.setAttribute('role', 'button');
  big.setAttribute('aria-label', `Play ${entry.card.name}`);
  big.addEventListener('click', () => tapCard(entry.uid));
  big.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapCard(entry.uid); }
  });
  const extra = problem ? el('p', 'focus-hint', problem) : focusButton('Play', () => tapCard(entry.uid));
  layer.replaceChildren(big, extra);
  layer.classList.add('rise');
  layer.hidden = false;
  popFromHand(big, extra, $('hand').querySelector(`[data-uid="${entry.uid}"]`));
  big.focus({ preventScroll: true });
}

/**
 * Like Slay the Spire, the picked card rises out of its own place in the hand, bigger and straight,
 * instead of jumping to the middle of the screen; a small Play button sits under it
 * (the user's call). The hand's copy hides so it reads as the same card lifting.
 */
function popFromHand(big, extra, from) {
  if (!from) return;
  from.classList.add('lifted');
  const r = from.getBoundingClientRect();
  const w = big.offsetWidth, h = big.offsetHeight, gap = 8;
  const under = 16;   // clears the card's gold ring and drop shadow, which stick out ~8px past its box
  const ew = extra.offsetWidth, eh = extra.offsetHeight;
  const left = Math.max(gap, Math.min(innerWidth - w - gap, r.left + r.width / 2 - w / 2));
  const foot = Math.min(r.bottom, innerHeight - gap);   // the Play button stands at the hand card's foot, the card on it
  const top = Math.max(gap, foot - eh - under - h);
  Object.assign(big.style, { left: `${left}px`, top: `${top}px` });
  const ex = Math.max(gap, Math.min(innerWidth - ew - gap, left + w / 2 - ew / 2));
  Object.assign(extra.style, { left: `${ex}px`, top: `${top + h + under}px` });

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dx = r.left + r.width / 2 - (left + w / 2), dy = r.bottom - (top + h);
  big.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${r.width / w})` }, { transform: 'none' }],
    { duration: 140, easing: 'ease-out' });
  extra.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: 60, fill: 'backwards' });
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
/**
 * The games' stat change: bands of colour scroll over the Pokémon's own shape, warm and rising for a raise
 * (block and Guard count, like Defense), blue and sinking for a drop. The overlay is masked with the sprite's
 * own GIF, so it takes its outline; it sits in the element that shakes and lunges, so it moves with it.
 */
function statFx(side, dir = 'up') {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const img = $(side === 'enemy' ? 'enemy-img' : 'player-sprite');
  const host = side === 'enemy' ? $('enemy-portrait-box') : $('player-zone');
  host.querySelector('.stat-fx')?.remove();
  const box = img.getBoundingClientRect(), at = host.getBoundingClientRect();
  const fx = el('div', `stat-fx ${dir}`);
  Object.assign(fx.style, {
    left: `${box.left - at.left}px`, top: `${box.top - at.top}px`, width: `${box.width}px`, height: `${box.height}px`,
  });
  fx.style.setProperty('--mask', `url("${img.currentSrc || img.src}")`);
  host.append(fx);
  setTimeout(() => fx.remove(), 1000);
}

const hitEffect = (id) => flash(id, 'hit', 420);
const lunge = (id) => flash(id, 'lunge', 380);

/** Like the games, a super / not very effective hit has its own sound; a fully blocked one plays block. */
function hitSound(through, multiplier) {
  if (through <= 0) playSound('block');
  else playSound(multiplier > 1 ? 'hit-super' : multiplier < 1 ? 'hit-weak' : 'hit', 'hit');
}

/** A hit that takes a big bite out of someone (a quarter of their HP, or 25) jolts the arena and flashes the screen. */
function bigHit(through, maxHp) {
  if (through < Math.max(12, Math.min(25, maxHp * 0.25)) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  flash('battle-screen', 'big-hit', 450);
}

/** A boss close to fainting brings the weather in (see setStorm in scene.js). */
function checkStorm() {
  const en = battle.enemy;
  if (battle.kind === 'boss' && en.hp > 0 && en.hp <= en.maxHp * 0.3) setStorm(true);
}

/** A number or word that floats up from a spot on screen. */
function pop(zoneId, text, kind = '', delay = 0) {
  const zone = $(zoneId);
  const node = el('span', `pop ${kind}`, text);
  node.style.animationDelay = `${delay}ms`;
  zone.append(node);
  setTimeout(() => node.remove(), 1400 + delay);
}

/* The battle text types itself out like the games' text box; the full line goes to screen readers at once. */
let typing = 0;
function log(message) {
  const box = $('battle-log');
  const text = $('battle-log-text');
  $('battle-log-live').textContent = message;
  box.classList.toggle('quiet', !message);
  box.classList.remove('done');
  clearInterval(typing);
  fitLog(box, text, message);
  const letters = Array.from(message);
  if (!message || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    text.textContent = message;
    box.classList.add('done');
    return;
  }
  let shown = 0;
  typing = setInterval(() => {
    shown += 2;
    text.textContent = letters.slice(0, shown).join('');
    if (shown >= letters.length) { clearInterval(typing); box.classList.add('done'); }
  }, 18);
}

/** The text box is two lines tall, like the games': a message that would wrap onto a third line
    (a narrow phone, a long enemy name) gets a notch smaller text, measured in full before it types out.
    Only one notch: in the rare case it still needs three lines, the box grows a line (the user's call). */
function fitLog(box, text, message) {
  box.classList.remove('tight');
  text.textContent = message;
  if (text.offsetHeight > parseFloat(getComputedStyle(text).lineHeight) * 2.5) box.classList.add('tight');
  text.textContent = '';
}

function shake(node) {
  node.classList.remove('shake');
  void node.offsetWidth;
  node.classList.add('shake');
}
