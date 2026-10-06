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

import { CARDS_BY_ID, TYPES, POWERS, POWER_LENS, scaledEffects, baseId, typePool, SUPER_EFFECTIVE, NOT_VERY_EFFECTIVE, WEAK_MULT, VULNERABLE_MULT } from './data/cards.js';
import { spriteUrl, stageName } from './data/starters.js';
import { ITEMS_BY_ID } from './data/items.js';
import { isShiny, getSave, updateSave, markSeen } from './storage.js';
import { ABILITIES, ENERGY_RELICS } from './data/relics.js';
import { spriteFit } from './data/sprite-fit.js';
import { $, el, makeCard, makeRelic, showScreen, setTheme, sleep, confirmDialog, setHpBar, previewHp, cardTips, itemSprite, zoomable, openDialog, closeDialog } from './ui.js';
import { showScene, showPlaceScene, showTowerScene, setStorm, bossArenaPrelude, bossPreludeSounds, bossRebirth, bossRebirthSounds } from './scene.js';
import { BIOMES, TRAITS } from './data/enemies.js';
import { journey } from './map.js';
import { playMusic, preloadMusic, playCry, preloadCries, playSound, preloadSounds, setLoop } from './audio.js';
import { setAura, stopAura } from './aura.js';
import { randIndex, pickOne, random } from './rng.js';
import { BALLS_BY_ID, THROW_PP, BAIT, ROCK_FLEE, RARE, catchChance, ballWeek, ballsInBag } from './data/balls.js';
import { timeOfDay } from './daytime.js';
import { flyTrail, burnAway } from './cardfx.js';

const ENERGY_PER_TURN = 3;
const HAND_SIZE = 5;
const MAX_HAND = 10;       // like StS: draws stop and new cards go to the discard pile once the hand is full
const ROOM_SERVICE_CAP = 6;   // the Room Service boss relic's cards per turn (StS's Velvet Choker)
const ENRAGE_EVERY = 6;   // every this many turns the enemy gets angrier...
const ENRAGE_BONUS = 2;   // ...and gains this much strength (so you can't stall behind block forever)
const CRY_WAIT_MAX = 3000;   // ms: the intro never waits longer than this for one cry
const BOSS_PRELUDE_LINES = ['The Ancient Tree stirs...', 'The shrine lanterns answer...', 'The crater rumbles...', 'The crystals hum with a terrible energy...'];
const SAFARI_PRELUDE_LINES = { meadow: 'The Lone Tree shudders in the wind...', forest: 'Light pours into the glade...', wetland: 'The lake begins to heave...', marsh: 'Something looms in the mist...', peak: 'The summit trembles...', desert: 'The air shimmers...' };

/** Relics that boost attacks of one type, by the type of your starter. */
const TYPE_RELIC = { fire: 'charcoal', grass: 'miracle-seed', water: 'mystic-water' };

/** The current battle, or null when no battle is running. */
let battle = null;
let nextUid = 1;

/** Called once at startup. */
export function initBattle() {
  $('end-turn-btn').addEventListener('click', askEndTurn);
  $('throw-btn').addEventListener('click', toggleBallPicker);
  // the ball picker floats over the battle like a menu: a tap anywhere else closes it
  document.addEventListener('pointerdown', (e) => {
    if (!$('ball-picker').hidden && !e.target.closest('#ball-picker, #throw-btn')) closeBallPicker();
  }, true);
  // tapping the battle around a picked card, or Escape, puts it back; tapping another card in the hand picks that one
  $('card-focus').addEventListener('click', (e) => {
    if (pilePick || e.target.closest('.focus-card, .focus-play')) return;
    const other = document.elementsFromPoint(e.clientX, e.clientY).find(node => node.matches('.card.in-hand:not(.lifted)'));
    if (other && (selectedUid !== null || choosing?.picked)) tapCard(Number(other.dataset.uid));
    else cancelPick();
  });
  initScrub();
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && battle) cancelPick(); });
  addEventListener('resize', () => { if (battle) { fanHand(); renderFocus(); } });
  document.querySelectorAll('.piles .pile').forEach(btn => btn.addEventListener('click', () => openPiles(btn.dataset.pile)));
}

/* StS's pile screens: the top bar's counts open a window with a tab per pile. The draw pile is sorted, so it doesn't
   give away what's coming next; the others list the latest card first. Copies that grew this fight (Aqua Cutter...)
   are their own card objects, so cards are grouped by object, not id. */
const PILES = [
  ['draw', '📚', 'Draw', 'Your next draws, sorted (their order stays a secret).'],
  ['discard', '🗂️', 'Discard', 'Shuffled back into your draw pile once it runs out. Latest first.'],
  ['exhaust', '🌫️', 'Exhaust', 'Exhausted cards: gone for the rest of this fight. Latest first.'],
];
// played powers share b.exhaust (they leave the fight too) but, as in StS, aren't shown as exhausted
const exhaustedCards = (b) => b.exhaust.filter(c => !c.power);

function openPiles(which) {
  if (!battle) return;
  showPile(which);
  openDialog('piles-dialog');
}

function showPile(which) {
  const b = battle;
  const lists = { draw: b.drawPile, discard: b.discard, exhaust: exhaustedCards(b) };
  $('piles-tabs').replaceChildren(...PILES.map(([id, icon, label]) => {
    const tab = el('button', 'index-tab');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(id === which));
    tab.append(el('span', 'index-tab-icon', icon), el('span', 'index-tab-label', `${label} ${lists[id].length}`));
    tab.addEventListener('click', () => showPile(id));
    return tab;
  }));
  const cards = which === 'draw'
    ? [...b.drawPile].sort((x, y) => x.name.localeCompare(y.name) || (costOf(x) === 'X' ? 9 : costOf(x)) - (costOf(y) === 'X' ? 9 : costOf(y)))
    : [...lists[which]].reverse();
  const groups = new Map();
  for (const card of cards) groups.set(card, (groups.get(card) || 0) + 1);
  const [, , , note] = PILES.find(([id]) => id === which);
  $('piles-note').textContent = groups.size ? note : 'Nothing here yet.';
  $('piles-cards').replaceChildren(...[...groups].map(([card, count]) =>
    zoomable(makeCard(asShown(card), { stage: b.stage, count, cost: costOf(card) }), asShown(card), b.stage)));
}

/** Leave the battle without finishing it (used when you abandon a run). */
export function abandonBattle() {
  closeBallPicker();
  battle = null;
  closeDialog('piles-dialog');
  choosing = null;
  if (pilePick) { pilePick = null; const layer = $('card-focus'); layer.hidden = true; layer.replaceChildren(); layer.classList.remove('pile-picking'); }
  setLoop('low-hp', false);
}

export const isBattleRunning = () => battle !== null && !battle.over;

const hasRelic = (id) => battle.relics.includes(id);
/** The starter's Ability (Blaze / Overgrow / Torrent / Pressure), from its type: ABILITIES in data/relics.js. */
const hasAbility = (id) => battle.ability?.id === id;
/** Battle speed (Settings, js/settings.js): 2x halves the waits of the enemy's turn and your hits; CSS halves their
    animations under `.fast-battle`. Read live, so flipping it mid-fight counts from the next wait. */
const speed = () => ((getSave().battleSpeed ?? 1) > 1 ? 2 : 1);
const pause = (ms) => sleep(ms / speed());

const isAttack = (card) => !!(card.effects.damage || card.effects.blockDamage);

/* ============================================================
   PART 1: THE RULES
   ============================================================ */

/**
 * Start a fight.
 *   run        the current run (starter, stage, deck, hp, relics, biome)
 *   encounter  who you are fighting: { def, kind, maxHp, strength }
 *   onEnd      called when the fight is over with
 *              { won, hp, damageTaken, tally }, plus fled: true after a Poké Doll
 */
export function startBattle({ run, encounter, onEnd, deferIntro = false }) {
  const def = encounter.def;
  const ability = ABILITIES[run.starter.type] ?? null;
  const junk = run.relics.includes('griseous-orb') ? [CARDS_BY_ID.sludge, CARDS_BY_ID.sludge] : [];   // StS's Mark of Pain
  const deck = shuffle([...run.deck.map(id => CARDS_BY_ID[id]), ...junk]);
  choosing = null;

  battle = {
    starter: run.starter,
    stage: run.stage,
    biome: run.biome,
    def,
    kind: encounter.kind,
    relics: [...run.relics],
    ability,
    items: run.items,   // the run's own list: using an item takes it out of the Bag
    onEnd,
    safari: Boolean(run.safari),   // a Safari Zone daily run: its starter may not be yours, so it earns no achievement goals
    catchable: Boolean(run.safari) && encounter.kind === 'fight',   // a Safari wild Pokémon: a ball can be thrown any turn
    rare: Boolean(encounter.rare),   // a Safari rare spawn: it runs off after RARE.turns of your turns (fewer with Rock)
    dmgMult: run.mods?.playerDmg ?? 1,   // Mewtwo's sprint: its attacks hit harder in biomes 1-3
    hpScale: encounter.maxHp / def.hp,   // the Level's and mode's HP: a second form (def.phase2) is scaled the same
    phased: false,     // the boss has already risen in its second form
    enemyActing: false,   // the enemy's turn is under way (a second form rising then ends it)

    // the player
    hp: run.hp,
    maxHp: run.maxHp,
    block: 0,
    energy: 0,
    nextEnergy: 0,     // bonus energy waiting for next turn
    focus: ability?.id === 'pressure' ? ability.amount : 0, // Pressure: bonus damage waiting for Mewtwo's first attack
    guard: false,      // blocks the next enemy attack completely
    endure: false,     // can't drop below 1 HP until your next turn (Endure)
    tide: ability?.id === 'torrent' ? ability.amount : 0,   // Water's stored-up resource: built by `tide` cards, all spent by the next `perTide` card
    tideGained: ability?.id === 'torrent' ? ability.amount : 0,   // all the Tide gained this fight, spent or not (Tsunami)
    surgeTurns: 0,     // turns Primal Reversion has already paid out: it pays 1 more each turn
    blockNext: 0,      // block waiting for your next turn (Shelter)
    blur: 0,           // turns your block survives the start of your turn (Aqua Veil)
    strength: (run.relics.includes('black-belt') ? 1 : 0) + (run.relics.includes('exp-share') ? 1 : 0),   // extra damage on every hit, for the rest of this fight
    firstAttack: run.relics.includes('dragon-fang'),   // Dragon Fang's bonus is still waiting for your first attack
    flex: 0,           // the part of `strength` that goes away at the end of this turn (Rototiller, StS's Flex)
    healedThisTurn: false,   // healed on this turn of yours (Grassy Glide)
    pledged: false,    // Grass Pledge has already paid out this turn
    powers: {},        // power effects played this fight, added up: { blockEachTurn: 5, ... }
    sashReady: run.relics.includes('focus-sash'),
    turn: 0,
    damageTaken: 0,
    tally: { played: 0, dealt: 0, biggest: 0, items: [] },   // this fight's share of the run's record (js/halloffame.js)
    hurtThisTurn: false,   // lost HP on this turn of yours (Temper Flare)
    timesHurt: 0,      // times you've lost HP this fight, however it happened (Mind Blown)
    played: 0,         // cards played this turn (this one included, while it resolves)
    attacks: 0,        // attacks played this turn
    discarded: 0,      // cards discarded from your hand by a card this turn

    // the piles of cards
    drawPile: [...deck.filter(c => !c.innate), ...deck.filter(c => c.innate)],   // innate cards on top: always in the first hand
    hand: [],
    discard: [],
    exhaust: [],       // exhausted and power cards: gone for the rest of THIS fight only

    // the enemy
    enemy: {
      hp: encounter.maxHp,
      maxHp: encounter.maxHp,
      block: 0,
      dmgBonus: encounter.strength,   // the biome's and level's extra damage: kept out of strength so it shows no 💪 badge
      strength: 0,                    // gained in the fight (buff moves, Enrage), shown as a badge
      dmgMult: encounter.dmgMult ?? 1,  // the Sky Pillar's compounding damage past floor 30
      burn: run.relics.includes('flame-orb') ? 3 : 0,
      seed: run.relics.includes('gooey-mulch') ? 2 : 0,   // Leech Seed: loses this much HP at the start of its turn, you heal it, then it drops by 1
      sap: 0,                         // its attacks deal this much less, all fight
      weak: 0,                        // turns left dealing WEAK_MULT damage
      vulnerable: 0,                  // turns left taking VULNERABLE_MULT damage from your attacks
      bait: 0,                        // Bait thrown at it (Safari): easier to catch, its attacks deal BAIT.damage more each
      rock: 0,                        // Rocks thrown at it (Safari): a wild one may run off on its turn
      moveIndex: randIndex(def.moves.length),
      grown: {},                      // what each `grow` move has gained so far, by name (Eternamax's Dynamax Cannon)
    },

    busy: true,        // true while animations play, so clicks are ignored
    over: false,
  };

  setTheme(run.starter.type);
  showScreen('battle-screen');
  const land = run.safari?.areas[run.biome] ?? BIOMES[run.biome]?.id;
  document.body.dataset.biome = land || '';   // the piles' colour
  if (def.arena) showPlaceScene(def.arena);
  else if (run.tower) {   // a Sky Pillar fight: one of the tower's rooms, its windows on the sky at that height (js/tower-art.js)
    const { flight } = run.tower, here = run.map?.byId[run.current];
    showTowerScene({ alt: flight * 10 + (here ? here.floor + 1 : 1), kind: encounter.kind, banner: flight >= 9 ? 'top' : flight % 3 });
  }
  else showScene(land, encounter.kind === 'boss' || encounter.kind === 'elite' ? encounter.kind : 'wild',
    journey(run.map, run.map?.byId[run.current]));
  playMusic(def.music ?? (encounter.kind === 'boss' ? 'boss' : encounter.kind === 'elite' ? 'elite' : 'wild'), { restart: true });
  preloadMusic(winTrack(encounter.kind));
  if (encounter.kind === 'boss' && run.biome >= 2 && !run.safari) preloadMusic('seal');   // the descent follows the last boss (Mewtwo's fall, its third)
  setupBattleScreen();

  log(encounter.kind === 'boss'
    ? def.prelude ?? (run.safari ? SAFARI_PRELUDE_LINES[run.safari.areas[run.biome]] : BOSS_PRELUDE_LINES[run.biome]) ?? 'A powerful presence stirs...'
    : `A wild ${def.name} appeared!`);
  if (deferIntro) {
    document.body.classList.add('boss-prelude');
    $('player-zone').classList.add('awaiting');
    $('enemy-zone').classList.add('boss-waiting');
    return () => playIntro();
  }
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
  preloadCries(b.def.spriteId ?? '', playerSpriteId, b.def.phase2?.spriteId ?? '');
  if (b.def.phase2) {
    new Image().src = b.def.phase2.image;
    preloadMusic(b.def.phase2.music);
  }
  preloadSounds('card', 'hit', 'block', 'faint', 'item', 'potion', 'ball-throw', 'ball-open', 'stat-up', 'stat-down', 'low-hp',
    'heal-hp', 'power', 'burn', 'run-away', 'no-pp', ...b.def.moves.map(m => m.sound).filter(Boolean), ...(b.kind === 'boss' ? ['thunder', ...bossPreludeSounds()] : []), ...(b.def.phase2 ? ['charge', ...bossRebirthSounds()] : []), ...(b.catchable ? ['catch-shake', 'catch-shake-2', 'catch-shake-3', 'catch-click', 'catch-success', 'bag'] : []));

  zone.classList.add('awaiting');
  renderAll();
  if (b.kind === 'boss') {
    document.body.classList.add('boss-prelude');
    enemyZone.classList.add('boss-waiting');
    try { await bossArenaPrelude(); }
    finally {
      document.body.classList.remove('boss-prelude');
      enemyZone.classList.remove('boss-waiting');
    }
    if (!still()) return;
    log(b.def.intro ?? `${b.def.name} blocks the way!`);
  }
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
    if (isShiny(b.starter.id)) shinySparkle(zone);
  }
  await Promise.all([cry(playerSpriteId), sleep(motion ? 270 : 0)]);
  if (!still()) return;
  resetIntro();
  beginPlayerTurn();
}

/** A shiny Pokémon comes out of its ball in a burst of sparkles, like the games. */
function shinySparkle(zone) {
  const burst = el('div', 'shiny-burst');
  burst.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 6; i++) {
    const star = el('span', 'shiny-star', '✨');
    star.style.setProperty('--angle', `${i * 60 + 30}deg`);
    star.style.setProperty('--delay', `${(i % 3) * 90}ms`);
    burst.append(star);
  }
  zone.append(burst);
  setTimeout(() => burst.remove(), 1200);
}

/** Put the intro's pieces back to rest (also run before each battle, in case one was cut short). */
function resetIntro() {
  document.body.classList.remove('boss-prelude');
  const ball = $('intro-ball');
  ball.hidden = true;
  ball.classList.remove('thrown', 'open');
  $('player-sprite').classList.remove('released');
  $('player-zone').classList.remove('awaiting');
  $('enemy-zone').classList.remove('entering', 'revealed', 'boss-waiting');
}

function beginPlayerTurn() {
  const b = battle;
  b.turn += 1;
  if (b.turn === 1 && (hasAbility('torrent') || hasAbility('pressure'))) abilityBanner();
  const p = b.powers;
  // block only lasts one round, unless Shell Armor or Aqua Veil keeps it (Everstone: it drops by 10)
  const fresh = (b.turn === 1 && hasRelic('iron-plate') ? 8 : 0) + (b.turn === 2 && hasRelic('stone-plate') ? 12 : 0)
    + (hasRelic('eviolite') ? 3 : 0) + (p.blockEachTurn || 0) + b.blockNext;
  b.block = (p.keepBlock || b.blur ? b.block : hasRelic('everstone') ? Math.max(0, b.block - 10) : 0) + fresh;
  if (b.blur) b.blur -= 1;
  b.blockNext = 0;
  if (b.block) statFx('player');
  const bossEnergy = ENERGY_RELICS.filter(hasRelic).length;
  const leftover = hasRelic('casteliacone') ? b.energy : 0;   // Casteliacone (StS's Ice Cream): unspent PP carries over
  b.energy = ENERGY_PER_TURN + b.nextEnergy + (hasRelic('choice-scarf') ? 1 : 0) + (hasRelic('exp-share') ? 1 : 0) + bossEnergy + leftover
    + (b.turn === 1 && hasRelic('lemonade') ? 1 : 0);
  b.turnEnergy = b.energy;
  b.nextEnergy = 0;
  b.played = b.attacks = b.discarded = 0;
  b.hurtThisTurn = false;
  b.healedThisTurn = false;
  b.endure = false;
  b.pledged = false;
  b.sludged = false;   // Black Sludge's HP is paid on the turn's first attack

  if (hasRelic('toxic-orb') && b.hp > 1) { b.hp -= 1; b.damageTaken += 1; markHurt(); pop('player-zone', '-1 ☠️', 'dmg'); }
  if (p.brutality) loseHp(p.brutality);
  if (hasRelic('leftovers')) healPlayer(2);
  if (p.healEachTurn && healPlayer(p.healEachTurn + healBonus())) playSound('heal-hp');
  if (hasRelic('grassy-seed') && b.turn % 3 === 0) gainStrength(1, '🍀 +1 strength');
  if (p.burnEachTurn) burnEnemy(p.burnEachTurn);
  if (p.strengthEachTurn) gainStrength(p.strengthEachTurn);
  if (p.weakEachTurn) applyDebuff('weaken', p.weakEachTurn);
  if (p.tideEachTurn) gainTide(p.tideEachTurn);
  if (p.tideSurge) gainTide(p.tideSurge + b.surgeTurns++);
  if (hasRelic('blue-flute')) gainTide(1);
  if (fresh && p.riptide) riptide();
  if (hasRelic('spelon-berry') && b.enemy.burn >= 2) {
    const dealt = hurtEnemy(Math.floor(b.enemy.burn / 2));
    hitEffect('enemy-portrait-box');
    pop('enemy-zone', `-${dealt} 🔥`, 'dmg', 150);
    playSound('burn');
  }
  if (hasRelic('exp-share')) { playSound('fortify'); pop('player-zone', '🎓 +1 card', 'block', 150); }   // the user's call: his shout every time his relic draws
  draw(HAND_SIZE + (hasRelic('scope-lens') ? 1 : 0) + (hasRelic('exp-share') ? 1 : 0) + (p.drawEachTurn || 0) + (p.brutality || 0)
    + (b.turn === 1 && hasRelic('quick-claw') ? 2 : 0) - (hasRelic('choice-specs') ? 1 : 0) + (hasRelic('max-mushrooms') ? 2 : 0));
  if (b.turn === 1 && hasRelic('strange-souvenir')) addRandomCards(1);
  if (b.enemy.hp <= 0) return finish(true);   // Riptide off the turn's first block, Spelon Berry, Enigma Berry
  b.busy = false;
  if (b.turn === 1 && !b.safari) showHandHint(lockDeal(b.hand.filter(h => h.fresh).length));   // Safari players already know the gestures
  else if (b.turn === HINT_TURNS + 1) hideHandHint();
  renderAll();
}

/* The opening hand can't be tapped until it has finished sliding in: a tap meant for the intro, or one landing on a
   card mid-slide, picked a card before the player had seen the hand. Matches .card.deal's 0.4 s and its 70 ms stagger. */
let dealLockUntil = 0;
function lockDeal(n) {
  const ms = n ? (n - 1) * 70 + 400 : 0;
  dealLockUntil = performance.now() + ms;
  const box = $('hand');
  box.classList.add('dealing');
  setTimeout(() => box.classList.remove('dealing'), ms);
  return ms;
}
const dealing = () => performance.now() < dealLockUntil;

/* Every battle teaches the hand's slide and swipe (the user's ask, 2026-10-04): two lines take turns fading in just
   above the cards, behind them, through the first HINT_TURNS turns (.hand-hint's animations), then it goes. */
const HINT_TURNS = 2;
let hintTimer = 0;
function showHandHint(delay) {
  hideHandHint();
  hintTimer = setTimeout(() => { $('hand-hint').hidden = false; }, delay + 300);
}
function hideHandHint() {
  clearTimeout(hintTimer);
  $('hand-hint').hidden = true;
}

/** Big Root: extra healing on heals that come from cards and powers (not other relics). */
const healBonus = () => (hasRelic('big-root') ? 2 : 0);

/** Heal the player (never above max HP). Returns how much was healed. Chlorophyll turns what's past max HP
    into block, and Grass Pledge turns a heal into strength once a turn. */
function healPlayer(amount) {
  const b = battle;
  const healed = Math.min(amount, b.maxHp - b.hp);
  b.hp += healed;
  if (healed > 0) {
    pop('player-zone', `+${healed} HP`, 'heal');
    b.healedThisTurn = true;
    if (b.powers.healStrength && !b.pledged) { b.pledged = true; gainStrength(b.powers.healStrength); }
    if (hasRelic('enigma-berry')) { const dealt = hurtEnemy(healed); pop('enemy-zone', dealt > 0 ? `-${dealt} 🫐` : 'Blocked', dealt > 0 ? 'dmg' : 'note', 150); }
  }
  if (amount > healed && b.powers.overheal) gainBlock(amount - healed);
  return healed;
}

/** Gain strength (a card, a power, a relic): Harvest heals for it. `flex` strength goes away at the end of the turn. */
function gainStrength(n, note = `💪 +${n}`, { flex = false } = {}) {
  const b = battle;
  if (hasRelic('muscle-wing')) { n += 1; note = `💪 +${n}`; }
  b.strength += n;
  if (flex) b.flex += n;
  pop('player-zone', note, 'note good');
  playSound('stat-up');
  statFx('player');
  if (b.powers.strengthHeal && healPlayer(b.powers.strengthHeal)) playSound('heal-hp');
}

/** Weak, Vulnerable, Leech Seed or Sap on the enemy, from a card or a power: Effect Spore hits for it, Sap Sipper
    blocks for Weak. */
function applyDebuff(kind, n) {
  const b = battle;
  const en = b.enemy;
  if (kind === 'weaken') { en.weak += n; pop('enemy-zone', `📉 Weak ${n}`, 'note'); }
  if (kind === 'vulnerable') { en.vulnerable += n; pop('enemy-zone', `💔 Vulnerable ${n}`, 'note'); }
  if (kind === 'seed') { en.seed += n; pop('enemy-zone', `🌱 Leech Seed ${n}`, 'note'); }
  if (kind === 'sap') { en.sap += n; pop('enemy-zone', `🍂 Sap ${n}`, 'note'); }
  playSound('stat-down');
  statFx('enemy', 'down');
  if (b.powers.debuffDamage) {
    const dealt = hurtEnemy(b.powers.debuffDamage);
    pop('enemy-zone', dealt > 0 ? `-${dealt} 🍄` : 'Blocked', dealt > 0 ? 'dmg' : 'note', 200);
  }
  if (kind === 'weaken' && b.powers.weakBlock) gainBlock(b.powers.weakBlock);
  if (kind === 'vulnerable' && hasRelic('toxic-plate')) applyDebuff('weaken', 1);
}

/** How many kinds of debuff the enemy has: Weak, Vulnerable, Leech Seed, Sap, Burn (Leaf Tornado, Pollen Puff). */
function debuffKinds() {
  const en = battle.enemy;
  return [en.weak, en.vulnerable, en.seed, en.sap, en.burn].filter(n => n > 0).length;
}

/** You lose HP by your own doing (a card or a power): never below 1. Raging Fury turns it into strength. */
function loseHp(n) {
  const b = battle;
  const lost = Math.min(n, b.hp - 1);
  if (lost <= 0) return;
  b.hp -= lost;
  b.damageTaken += lost;
  markHurt();
  pop('player-zone', `-${lost}`, 'dmg');
  if (b.powers.rupture) {
    b.strength += b.powers.rupture;
    pop('player-zone', `😡 +${b.powers.rupture} strength`, 'note good', 200);
    playSound('stat-up');
    statFx('player');
  }
}

/** Any HP loss, from the enemy too, counts for "lost HP this turn" and Mind Blown's discount. */
function markHurt() {
  battle.hurtThisTurn = true;
  battle.timesHurt += 1;
  if (hasRelic('salac-berry')) draw(1);   // Salac Berry (StS's Runic Cube): a card for every HP loss, the enemy's hits too
}

/** Lum Berry (StS's Medical Kit): status cards can be played for 0 PP, and exhaust. */
const lumCures = (card) => !!card.status && hasRelic('lum-berry');
const CURED = new WeakMap();
/* How a card reads in battle: under Lum Berry a status card says what it really does (0 PP, draw 1, Exhaust), not
   "Unplayable" (the user's call, 2026-09-28). The copy is only for show: the hand and piles keep the real card. */
function asShown(card) {
  if (!lumCures(card)) return card;
  if (!CURED.has(card)) CURED.set(card, { ...card, cost: 0, unplayable: false, exhaust: true, effects: { ...card.effects, draw: (card.effects.draw || 0) + 1 } });
  return CURED.get(card);
}

/** Blue Flare (StS's Corruption): cards that aren't attacks or powers cost 0 and exhaust. */
const corrupts = (card) => !!battle.powers.corruption && !isAttack(card) && !card.power && !card.status;

/** What a card costs right now: Mind Blown gets cheaper each time you're hurt, Triple Dive per discard this turn,
    Ebb and Flow's retained cards by their `discount`, and Blue Flare makes non-attacks free. */
function costOf(card) {
  if (card.cost === 'X') return 'X';
  if (corrupts(card) || lumCures(card)) return 0;
  const e = card.effects;
  return Math.max(0, card.cost - (e.costDownOnHurt || 0) * battle.timesHurt - (e.costDownOnDiscard || 0) * battle.discarded - (card.discount || 0));
}

/** The top card of the draw pile (the discard pile is shuffled in when it runs out), or null if both are empty. */
function drawTop() {
  const b = battle;
  if (b.drawPile.length === 0) {
    if (b.discard.length === 0) return null;
    b.drawPile = shuffle(b.discard);
    b.discard = [];
  }
  return b.drawPile.pop();
}

/** Draw cards. If the draw pile is empty, shuffle the discard pile back in. */
function draw(count) {
  const b = battle;
  for (let i = 0; i < count; i++) {
    if (b.hand.length >= MAX_HAND) return;
    const top = drawTop();
    if (!top) return;                            // nothing left anywhere
    // Max Mushrooms (StS's Snecko Eye): a drawn card costs 0-3 while it's in your hand (settled() puts it back)
    const card = hasRelic('max-mushrooms') && typeof top.cost === 'number' && !top.unplayable
      ? { ...top, cost: randIndex(4), orig: top } : top;
    b.hand.push({ uid: nextUid++, card, fresh: true });
  }
}

/** Can this card be played right now? Returns null if yes, or the reason if not. */
function whyNotPlayable(card) {
  const b = battle;
  if (b.busy || b.over) return 'Wait for your turn.';
  if (card.unplayable && !lumCures(card)) return `${card.name} can't be played.`;
  if (hasRelic('room-service') && b.played >= ROOM_SERVICE_CAP) return `Room Service: only ${ROOM_SERVICE_CAP} cards a turn.`;
  if (costOf(card) > b.energy) return 'Not enough PP!';   // an X card ('X') is always playable, even with 0 PP
  if (card.effects.needsWounded && b.hp >= b.maxHp) return `${card.name} only works when you're hurt.`;
  if (card.effects.needsEmptyDraw && b.drawPile.length) return `${card.name} only works when your draw pile is empty.`;
  return null;
}

/** A card's effects as played now: scaled by evolution, plus its per-X part for the X it was played with,
    plus its `ifBurned` / `ifHurt` extras when those hold as it's played. */
function effectsOf(card, x = 0) {
  const b = battle;
  const e = scaledEffects(card, b.stage);
  if (e.perX) {
    const times = x + (e.xPlus || 0);
    for (const [key, n] of Object.entries(e.perX)) e[key] = (e[key] || 0) + n * times;
  }
  if (e.ifBurned && b.enemy.burn > 0) addExtras(e, e.ifBurned);
  if (e.ifHurt && b.hurtThisTurn) addExtras(e, e.ifHurt);
  if (e.ifDiscarded && b.discarded) addExtras(e, e.ifDiscarded);
  if (e.ifWeak && b.enemy.weak > 0) addExtras(e, e.ifWeak);
  if (e.ifVulnerable && b.enemy.vulnerable > 0) addExtras(e, e.ifVulnerable);
  if (e.ifSeeded && b.enemy.seed > 0) addExtras(e, e.ifSeeded);
  if (e.ifHealed && b.healedThisTurn) addExtras(e, e.ifHealed);
  if (e.ifEnemyAttacks && ['attack', 'drain'].includes(currentMove().kind)) addExtras(e, e.ifEnemyAttacks);
  return e;
}

/** Adds a condition's extras onto a card's effects: `bonus` is extra damage, numbers add up. */
function addExtras(e, extras) {
  for (const [key, n] of Object.entries(extras)) {
    if (key === 'bonus') e.damage = (e.damage || 0) + n;
    else e[key] = typeof n === 'number' ? (e[key] || 0) + n : n;
  }
}

/** The damage of each hit this attack does to the current enemy (an empty list for non-attacks). */
function damageFor(card, e) {
  const b = battle;
  if (!e.damage && !e.blockDamage) return { hits: [], multiplier: 1 };

  const low = b.hp < b.maxHp / 2;
  let amount = e.blockDamage ? Math.floor(b.block * (e.blockDamage === true ? 1 : e.blockDamage)) : e.damage;
  if (e.bonusIfLow && low) amount += e.bonusIfLow;
  if (e.bonusPerBurn) amount += e.bonusPerBurn * b.enemy.burn;
  if (e.perTide) amount += e.perTide * b.tide;
  if (e.perTideHeld) amount += e.perTideHeld * b.tide;
  if (e.perTideGained) amount += e.perTideGained * b.tideGained;
  if (e.perPlayed) amount += e.perPlayed * (b.played - 1);
  if (e.perDiscard) amount += e.perDiscard * b.discarded;
  if (e.perExhausted) amount += e.perExhausted * (e.exhausted || 0);
  if (e.perDebuff) amount += e.perDebuff * debuffKinds();
  if (baseId(card.id) === 'cinder') amount += b.powers.cinderDamage || 0;
  amount += b.strength * (e.strengthMult || 1);
  if (b.powers.blaze && low) amount += b.powers.blaze;
  if (hasAbility('blaze') && low) amount += b.ability.amount;

  // relics
  if (hasRelic('muscle-band')) amount += 2;
  if (card.type === b.starter.type && hasRelic(TYPE_RELIC[card.type])) amount += 2;
  if (hasRelic('black-sludge')) amount += 3;
  if (b.firstAttack) amount += 10;   // Dragon Fang

  const multiplier = typeless() ? 1 : typeMultiplier(card.type, b.def.type);

  const vulnerable = b.enemy.vulnerable > 0 ? VULNERABLE_MULT : 1;
  const count = e.hitsPerAttack ? b.attacks : e.hitsPerExhausted ? e.exhausted || 0
    : e.perX?.hits ? e.hits : e.hits || 1;   // an X card played with X = 0 doesn't hit
  const hits = Array.from({ length: count }, (_, i) => Math.floor(Math.round((amount + (i === 0 ? b.focus : 0)) * multiplier * b.dmgMult) * vulnerable));
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
    if (costOf(card) > b.energy) { shake($('player-energy')); playSound('no-pp'); }
    return;
  }

  b.busy = true;
  clearPreview();
  const cost = costOf(card);
  const x = cost === 'X' ? b.energy : 0;
  b.energy -= cost === 'X' ? b.energy : cost;
  if (!card.power && (card.exhaust || corrupts(card) || lumCures(card))) burnOut(uid);   // it burns away as it's played
  else flyCard(uid, card);
  b.hand.splice(index, 1);
  if (!await resolveCard(card, x)) return;       // the player left the battle

  renderAll();
  await pause(220);

  if (battle !== b) return;                      // the player left the battle
  if (b.enemy.hp <= 0) return finish(true);
  if (!b.hand.length && hasRelic('magnet')) { draw(1); pop('player-zone', '🧿 Magnet', 'note good'); }
  b.busy = false;
  renderAll();
}

/**
 * A card does its thing: from your hand once paid for, or free off the draw pile (Wildfire, StS's Havoc,
 * which exhausts it). Resolves to false if the battle went away meanwhile.
 */
async function resolveCard(card, x, { exhaust = false } = {}) {
  const b = battle;
  markSeen('cards', card.id);   // a move is met in the Index once played, not when offered (the user's call); Metronome's too
  b.played += 1;
  b.tally.played += 1;
  if (isAttack(card)) b.attacks += 1;
  playSound('card');

  const e = effectsOf(card, x);
  const who = stageName(b.starter, b.stage);

  if (e.selfDamage) loseHp(e.selfDamage);
  if (e.exhaustHand) {
    // before the damage, which counts them (Burning Jealousy, Blast Burn)
    const going = b.hand.filter(h => e.exhaustHand === 'all' || (e.exhaustHand === 'status' ? h.card.status : !isAttack(h.card)));
    going.forEach(h => burnOut(h.uid));
    b.hand = b.hand.filter(h => !going.includes(h));
    going.forEach(h => exhaustCard(h.card));
    e.exhausted = going.length;
    renderHand();
  }
  if (e.discardHand) {
    // Wash Away / Water Shuriken: each card is discarded one by one, so Ripple and Undertow trigger
    const going = [...b.hand];
    going.forEach(discardFromHand);
    e.discardedNow = going.length;
    renderHand();
  }
  if (e.blockDamage && e.block) {
    // Aqua Tail: the block comes first, so the hit counts it
    gainBlock(e.block + (hasRelic('damp-rock') ? 2 : 0));
    e.block = 0;
  }

  // --- damage ---
  const { hits, multiplier } = damageFor(card, e);
  if (hits.length) {
    b.focus = 0;                                  // focus is used up by the attack
    let through = 0;
    for (const [i, amount] of hits.entries()) {
      lunge('player-sprite');
      await pause(180);
      if (battle !== b) return false;
      const dealt = hurtEnemy(amount);
      through += dealt;
      if (dealt > 0 && b.powers.attackSeed) applyDebuff('seed', b.powers.attackSeed);
      hitSound(dealt, multiplier);
      hitEffect('enemy-portrait-box');
      bigHit(dealt, b.enemy.maxHp, 'enemy-img');
      pop('enemy-zone', dealt > 0 ? `-${dealt}` : 'Blocked', dealt > 0 ? (multiplier > 1 ? 'dmg super' : 'dmg') : 'note');
      if (b.enemy.hp <= 0) break;
      if (i < hits.length - 1) { renderBars(); await pause(200); }
    }
    if (multiplier > 1) pop('enemy-zone', 'Super effective!', 'note good', 260);
    if (multiplier < 1) pop('enemy-zone', 'Not very effective…', 'note bad', 260);
    const total = hits.length > 1 ? `${hits.join(' + ')} damage` : `${hits[0]} damage`;
    log(`${who} used ${card.name}! ${total}${multiplier > 1 ? ' (super effective!)' : multiplier < 1 ? ' (not very effective)' : ''}.`);
    b.firstAttack = false;
    if (hasRelic('shell-bell')) healPlayer(1);
    if (hasRelic('black-sludge') && !b.sludged) { b.sludged = true; loseHp(1); }
    if (b.attacks % 3 === 0 && hasRelic('protein')) gainStrength(1, '💪 +1 Protein');
    if (b.attacks % 3 === 0 && hasRelic('fist-plate')) gainBlock(4);
    if (e.healDealt && healPlayer(through)) playSound('heal-hp');
    if (through > 0 && b.powers.attackHeal && healPlayer(b.powers.attackHeal)) playSound('heal-hp');
    if (e.perTide) e.tideSpent = spendTide();   // Brine: its blockPerTide counts the same Tide
    if (e.feed && b.enemy.hp <= 0) {
      b.maxHp += e.feed;
      b.hp += e.feed;
      pop('player-zone', `❤️ +${e.feed} max HP`, 'note good', 200);
    }
  } else {
    log(card.status ? `${card.name} was cleared away.` : `${who} used ${card.name}.`);
  }

  // --- everything else a card can do ---
  applyEffects(e);
  if (e.perDiscarded && e.discardedNow) applyEffects(timesEach(e.perDiscarded, e.discardedNow));
  if (e.combo && b.played - 1 >= e.combo.at) {
    pop('player-zone', '✨ Combo!', 'note good', 150);
    applyEffects(e.combo);
  }
  if (card.power) {
    for (const key of Object.keys(POWERS)) if (e[key]) b.powers[key] = (b.powers[key] || 0) + e[key];
    pop('player-zone', `${POWER_LENS[b.starter.type] ?? '🧬'} ${card.name}`, 'note good', 200);
    playSound('power');
  }
  if (e.discard) await pickFromHand(e.discard, 'discard', discardFromHand);
  if (e.exhaustPick) await pickFromHand(e.exhaustPick, 'exhaust', (entry) => { b.hand.splice(b.hand.indexOf(entry), 1); exhaustCard(entry.card); });
  if (e.copyPick) await pickFromHand(1, 'copy', (entry) => addCopies(entry.card, e.copyPick), (h) => !h.card.status && !h.card.unplayable);
  if (e.exhume) await takeFromExhaust();
  if (battle !== b) return false;

  // the card goes to its pile once it has done its thing (so its own draw can't shuffle it straight back in)
  if (card.power) b.exhaust.push(settled(card));  // powers leave the fight, but aren't "exhausted" (no triggers)
  else if (card.exhaust || exhaust || corrupts(card) || lumCures(card)) exhaustCard(card);
  else b.discard.push(settled(card));
  if (lumCures(card)) draw(1);
  if (card.power && hasRelic('power-herb')) draw(1);
  if (b.powers.cardDamage) { hurtEnemy(b.powers.cardDamage); pop('enemy-zone', `-${b.powers.cardDamage} ✨`, 'dmg', 150); }
  if (b.powers.cardBlock) gainBlock(b.powers.cardBlock);
  enemyTrait(card);

  for (let i = 0; i < (e.playTop || 0) && b.enemy.hp > 0; i++) {
    const top = drawTop();
    if (!top) break;
    pop('player-zone', `🌪️ ${top.name}!`, 'note good');
    renderAll();
    await pause(350);
    if (battle !== b) return false;
    if (top.unplayable) exhaustCard(top);
    else if (!await resolveCard(top, 0, { exhaust: true })) return false;
  }
  return battle === b;
}

/** Some of the Crystal Depths' Pokémon answer every card you play (their `trait`, TRAITS in js/data/enemies.js):
    Iron Barbs hurts you for each attack, Analytic gains strength from your Powers, Sturdy blocks a big turn. */
function enemyTrait(card) {
  const b = battle, t = b.def.trait, en = b.enemy;
  if (!t || en.hp <= 0 || card.status) return;
  if (t.id === 'barbs' && isAttack(card)) {
    const soaked = Math.min(b.block, t.amount), lost = Math.min(t.amount - soaked, b.hp - 1);
    b.block -= soaked;
    if (lost > 0) { b.hp -= lost; b.damageTaken += lost; markHurt(); }
    pop('player-zone', lost > 0 ? `-${lost} ${TRAITS.barbs.icon}` : `${TRAITS.barbs.icon} Blocked`, lost > 0 ? 'dmg' : 'note', 120);
  }
  if (t.id === 'analytic' && card.power) {
    en.strength += t.amount;
    pop('enemy-zone', `${TRAITS.analytic.icon} 💪 +${t.amount}`, 'note bad', 150);
    playSound('stat-up');
    statFx('enemy');
  }
  if (t.id === 'stamina' && b.played > t.after) {
    en.block += t.amount;
    pop('enemy-zone', `${TRAITS.stamina.icon} +${t.amount} 🛡️`, 'block', 150);
  }
}

/** Block, Weak, draw... everything a card does besides its damage. Also used for a card's combo and for
    `onExhaust` / `onDiscard`. Damp Rock adds to every card's block. */
function applyEffects(e) {
  const b = battle;
  for (let i = 0; i < (e.burn ? e.burnTimes || 1 : 0); i++) burnEnemy(e.burn, i * 150);
  if (e.burnMult && b.enemy.burn) { b.enemy.burn *= e.burnMult; pop('enemy-zone', `🔥 Burn ×${e.burnMult}`, 'note', 150); }
  if (e.weaken)     applyDebuff('weaken', e.weaken);
  if (e.vulnerable) applyDebuff('vulnerable', e.vulnerable);
  if (e.seed)       applyDebuff('seed', e.seed);
  if (e.sap)        applyDebuff('sap', e.sap);
  if (e.block)      gainBlock(e.block + (hasRelic('damp-rock') ? 2 : 0));
  if (e.blockMult && b.block) gainBlock(b.block * (e.blockMult - 1));
  if (e.blockPerTide) { const spent = e.tideSpent ?? spendTide(); if (spent) gainBlock(spent * e.blockPerTide + (hasRelic('damp-rock') ? 2 : 0)); }
  if (e.blockPerCard) gainBlock(e.blockPerCard * b.hand.length + (hasRelic('damp-rock') ? 2 : 0));
  if (e.blockNext)  { b.blockNext += e.blockNext; pop('player-zone', `🛡️ +${e.blockNext} next turn`, 'block', 150); }
  if (e.blur)       { b.blur = Math.max(b.blur, e.blur); pop('player-zone', '🛡️ Block stays', 'block', 150); }
  if (e.blockPerExhausted && e.exhausted) gainBlock(e.blockPerExhausted * e.exhausted + (hasRelic('damp-rock') ? 2 : 0));
  if (e.guard)      { b.guard = true; pop('player-zone', '✋ Guard up', 'block'); statFx('player'); }
  if (e.focus)      { b.focus += e.focus; pop('player-zone', `🎯 +${e.focus} next attack`, 'note good'); playSound('stat-up'); statFx('player'); }
  if (e.strength)   gainStrength(e.strength);
  if (e.flex)       gainStrength(e.flex, `💪 +${e.flex} this turn`, { flex: true });
  if (e.doubleStrength && b.strength > 0) gainStrength(b.strength, `💪 ×2`);
  if (e.tide)       gainTide(e.tide);
  if (e.tideMult && b.tide) gainTide(b.tide * (e.tideMult - 1));
  if (e.nextEnergy) { b.nextEnergy += e.nextEnergy; pop('player-zone', `⚡ ${e.nextEnergy > 0 ? '+' : ''}${e.nextEnergy} next turn`, e.nextEnergy > 0 ? 'note good' : 'note bad'); }
  if (e.endure)     { b.endure = true; pop('player-zone', '🎗️ Enduring', 'note good', 150); statFx('player'); }
  if (e.randomCard) addRandomCards(e.randomCard);
  if (e.energy)     { b.energy += e.energy; b.turnEnergy += e.energy; pop('player-zone', `⚡ +${e.energy}`, 'note good'); }
  if (e.heal && healPlayer(e.heal + healBonus())) playSound('heal-hp');
  if (e.healPerStrength && b.strength > 0 && healPlayer(e.healPerStrength * b.strength + healBonus())) playSound('heal-hp');
  if (e.healPerSeed && b.enemy.seed > 0 && healPlayer(e.healPerSeed * b.enemy.seed + healBonus())) playSound('heal-hp');
  if (e.draw)       draw(e.draw);
  if (e.drawPerDebuff) draw(e.drawPerDebuff * debuffKinds());
  if (e.drawTo)     draw(e.drawTo - b.hand.length);
  if (e.addCard)    addCards(e.addCard);
  if (e.bait)       { b.enemy.bait += e.bait; pop('enemy-zone', `🍓 Bait${e.bait > 1 ? ` ×${e.bait}` : ''}`, 'note', 150); }
  if (e.rock)       { b.enemy.rock += e.rock; pop('enemy-zone', '🪨 Rock!', 'note', 150); }
}

/** A card's "for each card discarded" extras, times that many: numbers multiply, an addCard makes that many. */
function timesEach(extras, n) {
  const out = {};
  for (const [key, v] of Object.entries(extras)) out[key] = key === 'addCard' ? { ...v, n: (v.n || 1) * n } : v * n;
  return out;
}

/** Burn the enemy (Drought adds to every Burn a card or power applies). */
function burnEnemy(n, delay = 0) {
  const add = n + (battle.powers.drought || 0) + (hasRelic('tamato-berry') ? 2 : 0);
  battle.enemy.burn += add;
  pop('enemy-zone', `🔥 Burn ${add}`, 'note', delay);
}

function gainBlock(n) {
  battle.block += n;
  pop('player-zone', `+${n} 🛡️`, 'block');
  playSound('block');
  statFx('player');
  if (battle.powers.riptide) riptide();
}

/** Riptide (StS's Juggernaut): gaining block hits the enemy. */
function riptide() {
  const n = battle.powers.riptide;
  const dealt = hurtEnemy(n);
  hitEffect('enemy-portrait-box');
  pop('enemy-zone', dealt > 0 ? `-${dealt} 🌀` : 'Blocked', dealt > 0 ? 'dmg' : 'note', 150);
}

/** Gain Tide; Drizzle adds to every gain. Everything gained counts for Tsunami. */
function gainTide(n) {
  const b = battle;
  const add = n + (b.powers.drizzle || 0);
  b.tide += add;
  b.tideGained += add;
  if (!b.safari && b.tide > getSave().stats.maxTide) updateSave(d => { d.stats.maxTide = b.tide; });   // Manaphy's goal
  pop('player-zone', `🌊 Tide +${add}`, 'note good');
}

/** Spend all your Tide (a `perTide` or `blockPerTide` card); Rain Dish turns what's spent into block. Returns how much. */
function spendTide() {
  const b = battle;
  const spent = b.tide;
  if (!spent) return 0;
  b.tide = hasRelic('lustrous-orb') ? Math.floor(spent / 2) : 0;
  pop('player-zone', `🌊 ${spent} Tide spent`, 'note', 200);
  if (b.powers.tideSpendBlock) gainBlock(spent * b.powers.tideSpendBlock);
  return spent;
}

/** New cards for this fight only (Cinders, status junk...): into your hand (the discard pile once it's full),
    shuffled into the draw pile, or onto the discard pile. */
function addCards({ id, n = 1, to = 'hand' }) {
  const b = battle;
  const card = CARDS_BY_ID[id];
  for (let i = 0; i < n; i++) {
    if (to === 'hand' && b.hand.length < MAX_HAND) b.hand.push({ uid: nextUid++, card, fresh: true });
    else if (to === 'draw') b.drawPile.splice(randIndex(b.drawPile.length + 1), 0, card);
    else b.discard.push(card);
  }
  pop('player-zone', `🃏 +${n} ${card.name}`, card.status ? 'note bad' : 'note good', 120);
}

/** Mimic (StS's Dual Wield): copies of a card in your hand, for this fight (the discard pile once the hand is full). */
function addCopies(card, n) {
  const b = battle;
  for (let i = 0; i < n; i++) {
    if (b.hand.length < MAX_HAND) b.hand.push({ uid: nextUid++, card, fresh: true });
    else b.discard.push(settled(card));
  }
  pop('player-zone', `🧬 +${n} ${card.name}`, 'note good', 120);
}

/** Metronome (StS's Discovery): random cards of your type, free this turn only. The free copy remembers the card
    (`orig`), which is what goes to a pile afterwards (settled). */
function addRandomCards(n) {
  const b = battle;
  const pool = typePool(b.starter.type).filter(c => !c.evoOnly);
  for (let i = 0; i < n && pool.length; i++) {
    const card = pickOne(pool);
    const free = { ...card, discount: typeof card.cost === 'number' ? card.cost : 0, orig: card };
    if (b.hand.length < MAX_HAND) b.hand.push({ uid: nextUid++, card: free, fresh: true });
    else b.discard.push(card);
    pop('player-zone', `✨ ${card.name}!`, 'note good', 150 + i * 150);
  }
}

/** TM (StS's Attack Potion): choose one of `n` different random cards of your type; it's free this turn, then an
    ordinary card for the rest of the fight. */
async function discoverCard(n) {
  const b = battle;
  const pool = [...typePool(b.starter.type).filter(c => !c.evoOnly)];
  const options = [];
  while (options.length < n && pool.length) options.push(pool.splice(randIndex(pool.length), 1)[0]);
  if (!options.length) return;
  const card = await pickFromPile(options, 'Choose a move to learn.', 'Learn');
  if (battle !== b) return;
  const free = { ...card, discount: typeof card.cost === 'number' ? card.cost : 0, orig: card };
  if (b.hand.length < MAX_HAND) b.hand.push({ uid: nextUid++, card: free, fresh: true });
  else b.discard.push(card);
  pop('player-zone', `💿 ${card.name}!`, 'note good', 150);
}

const settled = (card) => card.orig || card;

/** A card leaves the fight: its own `onExhaust`, the exhaust powers and Eject Pack all trigger. */
function exhaustCard(card) {
  const b = battle;
  b.exhaust.push(settled(card));
  pop('player-zone', `💨 ${card.name} exhausted`, 'note', 300);
  if (card.onExhaust) applyEffects(card.onExhaust);
  if (b.powers.exhaustBlock) gainBlock(b.powers.exhaustBlock);
  if (b.powers.exhaustDraw) draw(b.powers.exhaustDraw);
  if (b.powers.exhaustBurn) burnEnemy(b.powers.exhaustBurn, 150);
  if (hasRelic('eject-pack')) draw(1);
  if (hasRelic('smoke-poke-tail')) { const dealt = hurtEnemy(4); pop('enemy-zone', dealt > 0 ? `-${dealt} 💨` : 'Blocked', dealt > 0 ? 'dmg' : 'note', 200); }
  if (hasRelic('dawn-stone')) addTypeCard();
}

/** Dawn Stone (StS's Dead Branch): a random card of your type into your hand (the discard pile once it's full). */
function addTypeCard() {
  const b = battle;
  const pool = typePool(b.starter.type).filter(c => !c.evoOnly);
  const card = pickOne(pool);
  if (b.hand.length < MAX_HAND) b.hand.push({ uid: nextUid++, card, fresh: true });
  else b.discard.push(card);
  pop('player-zone', `💎 ${card.name}`, 'note good', 250);
}

/** Fusion Flare (StS's Exhume): a card from the exhaust pile back into your hand (never a power or another Exhume). */
async function takeFromExhaust() {
  const b = battle;
  const options = [...new Map(b.exhaust.filter(c => !c.power && !c.effects.exhume).map(c => [c.id, c])).values()];
  if (!options.length) return log('There\'s nothing in your exhaust pile to take back.');
  const card = options.length === 1 ? options[0] : await pickFromPile(options, 'Choose a card to take back.');
  if (battle !== b) return;
  b.exhaust.splice(b.exhaust.indexOf(card), 1);
  if (b.hand.length < MAX_HAND) b.hand.push({ uid: nextUid++, card, fresh: true });
  else b.discard.push(card);
  pop('player-zone', `🧬 ${card.name} is back`, 'note good', 150);
  renderAll();
}

/** Lays some cards out over the battle, dimmed behind them, and resolves with the one tapped. */
function pickFromPile(cards, prompt, verb = 'Take back') {
  log(prompt);
  const layer = $('card-focus');
  return new Promise(resolve => {
    const done = (card) => {
      pilePick = null;
      layer.classList.remove('pile-picking');
      layer.hidden = true;
      layer.replaceChildren();
      resolve(card);
    };
    // two taps, like a card in the hand: the first picks it and shows its keyword boxes and a button under the row
    // (a phone has no hover to read them by), the second (or the button) takes it
    const row = el('div', 'pile-pick'), below = el('div', 'pile-below');
    let picked = null;
    const pick = (card, node) => {
      if (picked === card) return done(card);
      picked = card;
      row.querySelectorAll('.pile-card.picked').forEach(n => n.classList.remove('picked'));
      node.classList.add('picked');
      below.replaceChildren(...[cardTips(asShown(card)), focusButton(verb, () => done(card))].filter(Boolean));
    };
    for (const card of cards) {
      const node = makeCard(asShown(card), { stage: battle.stage });
      node.classList.add('pile-card');
      node.tabIndex = 0;
      node.setAttribute('role', 'button');
      node.setAttribute('aria-label', `${verb} ${card.name}`);
      node.addEventListener('click', () => pick(card, node));
      node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(card, node); } });
      row.append(node);
    }
    pilePick = { done };
    layer.classList.remove('rise');
    layer.classList.add('pile-picking');
    layer.replaceChildren(el('p', 'focus-hint', prompt), row, below);
    layer.hidden = false;
    row.firstChild.focus({ preventScroll: true });
  });
}

/** A card made you discard this one from your hand (the end of your turn doesn't count, like StS). */
function discardFromHand(entry) {
  const b = battle;
  b.hand.splice(b.hand.indexOf(entry), 1);
  b.discard.push(settled(entry.card));
  b.discarded += 1;
  pop('player-zone', `🗂️ ${entry.card.name}`, 'note', 150);
  if (entry.card.onDiscard) applyEffects(entry.card.onDiscard);
  if (b.powers.discardTide) gainTide(b.powers.discardTide);
  if (b.powers.discardBlock) gainBlock(b.powers.discardBlock);
  if (hasRelic('heart-scale')) gainBlock(3);
}

/**
 * A card asks you to pick `n` cards in your hand ("Choose a card to discard."): the hand glows and a tap
 * picks one (tapCard), which `act` then takes out of the hand. With no more cards than asked for, it takes
 * them all without asking, like StS.
 */
async function pickFromHand(n, verb, act, only = () => true) {
  const b = battle;
  for (let left = n; left > 0; left--) {
    const open = b.hand.filter(only);
    if (!open.length) break;
    if (open.length <= left) { open.forEach(act); break; }
    log(`Choose a card to ${verb}.`);
    const uid = await new Promise(resolve => { choosing = { resolve, only, verb, picked: null }; renderAll(); });
    if (battle !== b) return;
    if (verb === 'exhaust') { renderPicking(); await burnOut(uid); if (battle !== b) return; }
    act(b.hand.find(h => h.uid === uid));
    renderAll();
  }
}

/* ---------- items: free to use, once, on your turn ---------- */

function whyNotUsable(item) {
  const b = battle;
  if (b.busy || b.over) return 'Wait for your turn.';
  if (item.effects.flee && b.kind === 'boss') return 'You can\'t run from a boss!';
  if (item.effects.revive) return `${item.name} works on its own when you would faint.`;
  if (item.effects.burnMult && !b.enemy.burn) return 'The enemy isn\'t burned.';
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
  b.tally.items.push(item.id);
  markSeen('items', item.id);   // items are met in the Index once used, not when offered (the user's call)
  const e = item.effects;
  log(`You used ${item.name}!`);
  playSound(e.flee ? 'run-away' : e.heal ? 'potion' : 'item', 'item');

  if (e.flee) {
    b.over = true;
    renderAll();
    $('player-sprite').classList.add('fled');
    await sleep(900);
    if (battle !== b) return;
    $('player-sprite').classList.remove('fled');
    return b.onEnd({ won: false, fled: true, hp: b.hp, maxHp: b.maxHp, damageTaken: b.damageTaken, tally: tallyOf(b) });
  }

  if (e.burn)     { b.enemy.burn += e.burn; pop('enemy-zone', `🔥 Burn ${e.burn}`, 'note'); }
  if (e.burnMult) { b.enemy.burn *= e.burnMult; pop('enemy-zone', `🔥 Burn ${b.enemy.burn}!`, 'note'); }
  if (e.weaken)   applyDebuff('weaken', e.weaken);
  if (e.vulnerable) applyDebuff('vulnerable', e.vulnerable);
  if (e.seed)     applyDebuff('seed', e.seed);
  if (e.tide)     gainTide(e.tide);
  if (e.maxHp)    { b.maxHp += e.maxHp; b.hp += e.maxHp; pop('player-zone', `💚 Max HP +${e.maxHp}`, 'heal'); playSound('stat-up'); statFx('player'); }
  if (e.block)    { b.block += e.block; pop('player-zone', `+${e.block} 🛡️`, 'block'); statFx('player'); }
  if (e.guard)    { b.guard = true; pop('player-zone', '✋ Guard up', 'block'); statFx('player'); }
  if (e.focus)    { b.focus += e.focus; pop('player-zone', `🎯 +${e.focus} next attack`, 'note good'); playSound('stat-up'); statFx('player'); }
  if (e.strength) { b.strength += e.strength; pop('player-zone', `💪 +${e.strength}`, 'note good'); playSound('stat-up'); statFx('player'); }
  if (e.energy)   { b.energy += e.energy; b.turnEnergy += e.energy; pop('player-zone', `⚡ +${e.energy}`, 'note good'); }
  if (e.heal)     healPlayer(e.heal);
  if (e.draw)     draw(e.draw);
  if (e.discover) await discoverCard(e.discover);
  if (battle !== b) return;

  renderAll();
  await sleep(220);
  if (battle !== b) return;
  if (b.enemy.hp <= 0) return finish(true);   // Enigma Berry off a Potion
  b.busy = false;
  renderAll();
}

/* ---------- catching: the Safari Zone's Throw Ball (js/data/balls.js, docs/reference/safari.md) ---------- */

/** A Safari wild fight: the Throw Ball button shows all fight (the odds are low at high HP, catchChance()). */
const canCatch = () => battle.catchable && !battle.over && battle.enemy.hp > 0;

/** Why a throw can't be made now, or null. A throw costs THROW_PP and ends your turn, so cards can be played first. */
function whyNotThrow() {
  const b = battle;
  if (b.busy || b.over) return 'Wait for your turn.';
  if (b.energy < THROW_PP) return `A throw costs ${THROW_PP} PP.`;
  return null;
}

/** The odds a ball catches right now, 0-1. */
function catchOdds(ball) {
  const b = battle, en = b.enemy;
  return catchChance({
    hpFrac: en.hp / en.maxHp, ball, turn: b.turn, night: timeOfDay() === 'night', type: b.def.type,
    debuffs: [en.burn, en.seed, en.weak, en.sap].filter(n => n > 0).length, bait: en.bait, rare: b.rare,
  });
}

function closeBallPicker() {
  $('ball-picker').hidden = true;
  $('throw-btn').setAttribute('aria-expanded', 'false');
}

/** The ball picker: the balls you can throw now, each with how many are left and its odds; a tap throws it. */
function toggleBallPicker() {
  const picker = $('ball-picker'), btn = $('throw-btn');
  if (!picker.hidden) return closeBallPicker();
  if (!canCatch()) return;
  const problem = whyNotThrow();
  if (problem) { log(problem); playSound('no-pp'); return; }
  playSound('bag');
  const rows = ballsInBag(getSave().balls, ballWeek()).map(({ ball, left }) => {
    const row = el('button', 'ball-row');
    row.type = 'button';
    const odds = Math.round(catchOdds(ball.id) * 100);
    row.append(itemSprite(ball, 'ball-icon'), el('span', 'ball-name', ball.name),
      el('span', 'ball-left', left === Infinity ? '' : `×${left}`), el('b', 'ball-odds', `${odds}%`));
    row.title = ball.text;
    row.setAttribute('aria-label', `${ball.name}${left === Infinity ? '' : `, ${left} left`}: ${odds}% to catch`);
    row.addEventListener('click', () => { closeBallPicker(); throwBall(ball.id); });
    return row;
  });
  picker.replaceChildren(el('div', 'ball-picker-title', 'Throw which ball?'), ...rows);
  picker.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  // over the Throw button, kept inside the window
  const at = btn.getBoundingClientRect(), w = picker.offsetWidth, h = picker.offsetHeight;
  picker.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, at.right - w))}px`;
  picker.style.top = `${Math.max(8, at.top - h - 8)}px`;
}

/** Throw a ball: it flies at the wild Pokémon, swallows it and shakes; a catch ends the fight as a win, a miss ends your turn. */
async function throwBall(id) {
  const b = battle;
  if (!canCatch() || whyNotThrow()) return;
  const ball = BALLS_BY_ID[id];
  const chance = catchOdds(id);
  b.busy = true;
  b.energy -= THROW_PP;
  b.thrown = (b.thrown || 0) + 1;
  // the ball is spent as it's thrown (a refresh replays the room, but not the ball)
  updateSave(d => {
    if (ball.stock) d.balls[id] = Math.max(0, (d.balls[id] || 0) - 1);
    if (ball.weekly) d.balls.masterWeek = ballWeek();
  });
  renderAll();
  const roll = random();
  const caught = roll < chance;
  // like the games, a near miss shakes more: three shakes and a click is a catch
  const miss = (roll - chance) / (1 - chance || 1);
  const shakes = caught ? 3 : miss < 1 / 3 ? 2 : miss < 2 / 3 ? 1 : 0;
  log(`You threw a ${ball.name}!`);
  const done = await ballAnimation(ball, shakes, caught);
  if (battle !== b || !done) return;
  if (caught) return caughtIt(id);
  log(shakes === 2 ? 'Aargh! Almost had it!' : shakes === 1 ? 'Aww! It appeared to be caught!' : `Oh no! The wild ${b.def.name} broke free!`);
  await sleep(700);
  if (battle !== b) return;
  b.busy = false;
  await endTurn();
}

/** The throw on screen: an arc to the Pokémon, a white flash as it's pulled in, the ball dropping and shaking, then the
    click (a catch) or the ball bursting open. Resolves false if the fight was left meanwhile. */
/** The pause before each wobble (ms): longer than the user's recording's rhythm, for suspense (his call). */
const SHAKE_GAPS = [600, 1100, 1000];

async function ballAnimation(ball, shakes, caught) {
  const b = battle;
  const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const box = $('enemy-portrait-box'), arena = $('arena');
  const thrown = el('span', 'thrown-ball');
  thrown.append(itemSprite(ball));
  arena.append(thrown);
  const a = arena.getBoundingClientRect(), target = box.getBoundingClientRect(), from = $('player-zone').getBoundingClientRect();
  const x = target.left + target.width / 2 - a.left, y = target.top + target.height * 0.45 - a.top;
  const ground = target.bottom - a.top - 18;
  const sx = from.left + from.width * 0.3 - a.left, sy = from.top + from.height * 0.6 - a.top;
  const at = (px, py) => `translate(${Math.round(px)}px, ${Math.round(py)}px)`;
  playSound('ball-throw');
  if (motion) {
    await thrown.animate([
      { transform: `${at(sx, sy)} rotate(0deg)` },
      { transform: `${at((sx + x) / 2, Math.min(sy, y) - 90)} rotate(-540deg)`, offset: 0.5 },
      { transform: `${at(x, y)} rotate(-1080deg)` },
    ], { duration: 650, easing: 'linear', fill: 'forwards' }).finished;
  }
  thrown.style.transform = at(x, y);
  if (battle !== b) { thrown.remove(); return false; }
  playSound('ball-open');
  box.classList.add('captured');
  await sleep(motion ? 450 : 200);
  if (motion) await thrown.animate([{ transform: at(x, y) }, { transform: at(x, ground) }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished;
  thrown.style.transform = at(x, ground);
  for (let i = 0; i < shakes; i++) {
    await sleep(motion ? SHAKE_GAPS[i] : 250);
    if (battle !== b) { thrown.remove(); return false; }
    playSound(['catch-shake', 'catch-shake-2', 'catch-shake-3'][i]);
    if (motion) await thrown.animate([{ transform: `${at(x, ground)} rotate(0deg)` }, { transform: `${at(x, ground)} rotate(-24deg)` },
      { transform: `${at(x, ground)} rotate(18deg)` }, { transform: `${at(x, ground)} rotate(0deg)` }], { duration: 420, easing: 'ease-in-out' }).finished;
  }
  await sleep(motion ? 420 : 250);
  if (battle !== b) { thrown.remove(); return false; }
  if (caught) {
    // one at a time, like the games (the user's call): the click, then the jingle alone, then the victory music in caughtIt()
    playMusic(null, { cut: true });
    playSound('catch-click');
    thrown.classList.add('caught');
    for (let i = 0; i < 3; i++) pop('enemy-zone', '✦', 'note good catch-star', i * 90);
    await sleep(600);
    b.jingle = await playSound('catch-success');
    return battle === b;
  }
  playSound('ball-open');
  thrown.classList.add('burst');
  box.classList.remove('captured');
  await sleep(300);
  thrown.remove();
  return battle === b;
}

/** Gotcha! The fight ends as a win, without the knockout (run.js pays less ₽ and offers its signature card). */
async function caughtIt(ballId) {
  const b = battle;
  b.over = true;
  setStorm(false);
  closeBallPicker();
  const grew = hasAbility('overgrow') && healPlayer(b.ability.amount);
  if (grew) abilityBanner();
  log(`Gotcha! The wild ${b.def.name} was caught!`);
  renderAll();
  await sleep(Math.max(grew ? 1900 : 1500, (b.jingle || 0) * 1000 + 150));
  if (battle !== b) return;
  playMusic(winTrack(b.kind), { restart: true, cut: true });
  document.querySelector('.thrown-ball')?.remove();
  $('enemy-portrait-box').classList.remove('captured');
  $('enemy-portrait-box').classList.add('defeated');
  stopAura();
  closeDialog('piles-dialog');
  b.onEnd({ won: true, caught: true, ball: ballId, hp: b.hp, maxHp: b.maxHp, damageTaken: b.damageTaken, tally: tallyOf(b) });
}

/** On its turn, before anything else: does the wild Pokémon run off? A rare spawn leaves after RARE.turns of your turns
    (a turn sooner per Rock); any other Safari wild may, once it's been hit by a Rock. */
function runsOff() {
  const b = battle, en = b.enemy;
  if (!b.catchable) return false;
  if (b.rare) return b.turn >= RARE.turns - en.rock;
  return en.rock > 0 && random() < ROCK_FLEE * en.rock;
}

/** It got away: the fight ends with nothing won (run.js says so and goes back to the map). */
async function runAway() {
  const b = battle;
  b.over = true;
  setStorm(false);
  closeBallPicker();
  renderAll();
  playSound('run-away');
  log(`The wild ${b.def.name} ran away!`);
  $('enemy-portrait-box').classList.add('ran');
  await sleep(1300);
  if (battle !== b) return;
  stopAura();
  closeDialog('piles-dialog');
  b.onEnd({ won: false, escaped: true, hp: b.hp, maxHp: b.maxHp, damageTaken: b.damageTaken, tally: tallyOf(b) });
}

/** Damage the enemy: its block soaks it up first. Returns the damage that got through. */
function hurtEnemy(amount) {
  const en = battle.enemy;
  const absorbed = Math.min(en.block, amount);
  en.block -= absorbed;
  const through = amount - absorbed;
  enemyLoses(through);
  battle.tally.biggest = Math.max(battle.tally.biggest, through);
  checkStorm();
  return through;
}

/** The enemy loses HP (a hit, Burn, Leech Seed), counted for the run's record without the overkill. */
function enemyLoses(n) {
  const en = battle.enemy;
  battle.tally.dealt += Math.min(en.hp, n);
  en.hp = Math.max(0, en.hp - n);
}

/** What this fight adds to the run's record. */
const tallyOf = (b) => ({ ...b.tally, turns: b.turn, taken: b.damageTaken });


/** Damage the player: block first, then HP. Returns the damage that got through. `source` names a fatal blow for the loss recap. */
function hurtPlayer(amount, source = null) {
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
  if (b.hp - through <= 0 && b.endure && b.hp > 0) {
    through = b.hp - 1;
    pop('player-zone', '🎗️ Endured!', 'note good', 300);
  }
  b.hp = Math.max(0, b.hp - through);
  b.damageTaken += through;
  if (through > 0) markHurt();
  if (b.hp <= 0) { b.blow = source; revive(); }
  return through;
}

/** Revive (StS's Fairy in a Bottle): fainting uses it up instead, and you come back with a share of your max HP. */
function revive() {
  const b = battle;
  const index = b.items.findIndex(id => ITEMS_BY_ID[id]?.effects.revive);
  if (index < 0) return;
  const item = ITEMS_BY_ID[b.items[index]];
  b.items.splice(index, 1);
  b.tally.items.push(item.id);
  markSeen('items', item.id);
  b.hp = Math.max(1, Math.floor(b.maxHp * item.effects.revive));
  pop('player-zone', `✨ Revived! +${b.hp} HP`, 'heal', 350);
  b.revived = `${item.name} brought ${stageName(b.starter, b.stage)} back!`;   // told after the hit's own line (withRevive)
  playSound('potion', 'item');
}

/** The line for a hit, plus Revive's news if that hit made you faint. */
function withRevive(message) {
  const b = battle;
  if (!b.revived) return message;
  const out = `${message} ${b.revived}`;
  b.revived = null;
  return out;
}

/** End Turn with PP left and a card you could play asks first, unless Settings switched that off. */
async function askEndTurn() {
  const b = battle;
  if (!b || b.busy || b.over) return;
  const playable = b.energy > 0 ? b.hand.filter(h => !whyNotPlayable(h.card)).length : 0;
  if (playable && (getSave().endTurnWarn ?? true)) {
    const cards = playable === 1 ? 'a card' : `${playable} cards`;
    const ok = await confirmDialog(`You still have ${b.energy} PP and ${cards} you can play. End your turn anyway? (Settings in the Poké Ball menu can turn this off.)`, 'End turn');
    if (!ok || battle !== b) return;
  }
  endTurn();
}

async function endTurn() {
  const b = battle;
  if (!b || b.busy || b.over) return;
  b.busy = true;

  // Eruption (StS's Combust): lose 1 HP, hit the enemy
  if (b.powers.combust) {
    loseHp(1);
    const dealt = hurtEnemy(b.powers.combust);
    hitEffect('enemy-portrait-box');
    pop('enemy-zone', dealt > 0 ? `-${dealt} 💥` : 'Blocked', dealt > 0 ? 'dmg' : 'note');
    playSound(dealt > 0 ? 'hit' : 'block');
    log(`Eruption hit ${b.def.name} for ${b.powers.combust}!`);
    renderAll();
    await pause(500);
    if (battle !== b) return;
    if (b.enemy.hp <= 0) return finish(true);
  }

  // Status cards that hurt while held (Poison), then Ethereal cards fade away (exhausted).
  const hurt = b.hand.reduce((sum, h) => sum + (h.card.effects.endTurnHurt || 0), 0);
  if (hurt) {
    const through = hurtPlayer(hurt, 'Poison');
    hitEffect('player-sprite');
    pop('player-zone', through > 0 ? `-${through} ☠️` : 'Blocked', through > 0 ? 'dmg' : 'block');
    log(withRevive(`The Poison in your hand hurt ${stageName(b.starter, b.stage)} for ${hurt}.`));
    renderAll();
    await pause(500);
    if (battle !== b) return;
    if (b.hp <= 0) return finish(false);
  }
  if (b.flex) { b.strength -= b.flex; b.flex = 0; }
  for (const h of b.hand) h.card = settled(h.card);   // Metronome's cards are only free this turn
  const fading = b.hand.filter(h => h.card.ethereal);
  fading.forEach(h => burnOut(h.uid));
  b.hand = b.hand.filter(h => !h.card.ethereal);
  fading.forEach(h => exhaustCard(h.card));
  if (b.enemy.hp <= 0) { renderAll(); return finish(true); }   // Smoke-Poke Tail off a faded card

  // Discard whatever is left in your hand, except cards that retain (Slowpoke Tail, StS's Runic Pyramid: all of it).
  // Grip Claw also keeps the leftmost card that would have been discarded, and Still Waters lets you pick more.
  const gripped = hasRelic('grip-claw') ? b.hand.find(h => !h.card.retain) : null;
  const kept = new Set(b.hand.filter(h => h.card.retain || h === gripped || hasRelic('slowpoke-tail')));
  if (b.powers.retainN && kept.size < b.hand.length) {
    await pickFromHand(b.powers.retainN, 'keep', (h) => kept.add(h), (h) => !kept.has(h));
    if (battle !== b) return;
  }
  b.discard.push(...b.hand.filter(h => !kept.has(h)).map(h => h.card));
  b.hand = b.hand.filter(h => kept.has(h));
  // a card kept in hand grows (Aqua Cutter, Life Dew, Hydro Cannon) and Ebb and Flow makes it cheaper, for this fight:
  // it becomes its own copy, so the deck's card stays as it was
  for (const h of b.hand) {
    const grow = h.card.growOnRetain;
    const cheaper = b.powers.retainDiscount && typeof h.card.cost === 'number' && costOf(h.card) > 0;
    if (!grow && !cheaper) continue;
    const effects = { ...h.card.effects };
    for (const [key, n] of Object.entries(grow || {})) effects[key] = (effects[key] || 0) + n;
    h.card = { ...h.card, effects, discount: (h.card.discount || 0) + (cheaper ? b.powers.retainDiscount : 0) };
  }
  renderAll();

  await pause(500);
  if (battle !== b) return;                      // the player left the battle
  await enemyTurn();
}

async function enemyTurn() {
  const b = battle;
  const en = b.enemy;
  const move = currentMove();
  if (runsOff()) return runAway();
  b.enemyActing = true;
  en.block = 0;                                   // enemy block only lasts one round

  // 1. Burn hurts the enemy first.
  if (en.burn > 0) {
    const burnDamage = en.burn;
    en.burn -= 1;
    enemyLoses(burnDamage);
    checkStorm();
    hitEffect('enemy-portrait-box');
    pop('enemy-zone', `-${burnDamage} 🔥`, 'dmg');
    log(`${b.def.name} took ${burnDamage} burn damage.`);
    playSound('burn');
    if (hasRelic('heat-rock')) healPlayer(2);
    renderAll();
    await pause(600);
    if (battle !== b) return;
    if (b.enemy.hp <= 0) return finish(true);
  }

  // 1b. Leech Seed drains it and heals you (Grassy Surge keeps it from dropping).
  if (en.seed > 0) {
    const n = Math.min(en.seed, en.hp);
    if (!b.powers.seedKeep) en.seed -= 1;
    enemyLoses(n);
    checkStorm();
    hitEffect('enemy-portrait-box');
    pop('enemy-zone', `-${n} 🌱`, 'dmg');
    log(`Leech Seed sapped ${n} HP from ${b.def.name}!`);
    if (healPlayer(n)) playSound('heal-hp');
    renderAll();
    await pause(600);
    if (battle !== b) return;
    if (b.enemy.hp <= 0) return finish(true);
  }

  // 2. Then it uses its move (with its own sound, if it has one: Kenmatta's FORTIFY YOUR MIND), yelling its `say` first.
  if (move.say) {
    log(`${b.def.name}: "${move.say}"`);
    await pause(1100);
    if (battle !== b) return;
  }
  if (move.sound) playSound(move.sound);
  $('enemy-portrait-box').classList.remove('charging');
  if (move.kind === 'attack' || move.kind === 'drain') {
    const damage = attackDamage(move);
    $('enemy-portrait-box').classList.add('attacking');
    await pause(300);
    $('enemy-portrait-box').classList.remove('attacking');
    if (battle !== b) return;

    if (b.guard) {
      b.guard = false;
      pop('player-zone', '✋ Guarded!', 'block');
      log(`${b.def.name} used ${move.name}, but your Guard stopped it!`);
    } else {
      const shield = b.block;
      const through = hurtPlayer(damage, move.name);
      const effect = enemyTypeMultiplier(move);
      hitSound(through, effect);
      hitEffect('player-sprite');
      bigHit(through, b.maxHp);
      pop('player-zone', through > 0 ? `-${through}` : 'Blocked', through > 0 ? (effect > 1 ? 'dmg super' : 'dmg') : 'block');
      if (effect > 1) pop('player-zone', 'Super effective!', 'note bad', 260);
      if (effect < 1) pop('player-zone', 'Not very effective…', 'note good', 260);
      log(withRevive(`${b.def.name} used ${move.name}! ${damage} damage${effect > 1 ? ' (super effective!)' : effect < 1 ? ' (not very effective)' : ''}${Math.min(shield, damage) ? `, ${Math.min(shield, damage)} blocked` : ''}.`));
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
    if (move.grow) {
      en.grown[move.name] = (en.grown[move.name] || 0) + move.grow;
      pop('enemy-zone', `📈 ${move.name} +${move.grow}`, 'note bad', 450);
    }
  } else if (move.kind === 'charge') {
    // a turn's warning before a huge hit: the intent already showed it, so there's time to block it or finish the boss
    pop('enemy-zone', '⚠️ Charging!', 'note bad');
    playSound('charge');
    statFx('enemy');
    $('enemy-portrait-box').classList.add('charging');
    log(`${b.def.name} is gathering energy for ${move.name}! Brace yourself!`);
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
  if (move.adds) {
    // junk for your deck (a `kind: 'status'` move does only this; an attack can do it too)
    const { card, n = 1, to = 'discard' } = move.adds;
    addCards({ id: card, n, to });
    playSound('stat-down');
    if (move.kind === 'status') log(`${b.def.name} used ${move.name}! ${n > 1 ? `${n} ${CARDS_BY_ID[card].name} cards` : CARDS_BY_ID[card].name} went into your deck.`);
  }

  if (en.weak > 0) en.weak -= 1;                  // like StS, Weak and Vulnerable wear off at the end of the enemy's turn
  if (en.vulnerable > 0) en.vulnerable -= 1;

  // Enrage: long fights get more dangerous.
  if (b.turn % ENRAGE_EVERY === 0) {
    en.strength += ENRAGE_BONUS;
    pop('enemy-zone', `😡 Enraged +${ENRAGE_BONUS}`, 'note bad', 350);
    playSound('stat-up');
    statFx('enemy');
  }

  en.moveIndex += 1;                              // pick the next move
  renderAll();
  await pause(700);

  if (battle !== b) return;
  if (b.hp <= 0) return finish(false);
  if (b.enemy.hp <= 0) return finish(true);       // knocked out by Rocky Helmet or Mirror Coat
  b.enemyActing = false;
  beginPlayerTurn();
}

const currentMove = () => battle.def.moves[battle.enemy.moveIndex % battle.def.moves.length];

/** Fire beats Grass, Grass beats Water, Water beats Fire. */
function typeMultiplier(attacker, defender) {
  const type = TYPES[attacker];
  if (type.beats === defender) return SUPER_EFFECTIVE;
  if (type.losesTo === defender) return NOT_VERY_EFFECTIVE;
  return 1;
}

/** Elites and bosses (Team Rocket's Alpha too) ignore the type chart both ways: only wild fights hinge on match-ups (the user's call). */
const typeless = () => battle.kind === 'elite' || battle.kind === 'boss';

/** A move with its own `type` (Body Slam is Normal) uses that, else the enemy's type. */
function enemyTypeMultiplier(move) {
  return typeless() ? 1 : typeMultiplier(move.type ?? battle.def.type, battle.starter.type);
}

/** Damage an enemy attack will deal right now (includes strength, type and weaken). */
function attackDamage(move) {
  const en = battle.enemy;
  const raw = Math.round(Math.max(0, move.amount + (en.grown[move.name] || 0) + en.dmgBonus + en.strength + en.bait * BAIT.damage - en.sap) * en.dmgMult * enemyTypeMultiplier(move));
  return en.weak > 0 ? Math.floor(raw * WEAK_MULT) : raw;
}

/** The fanfare after a win: the wild one, or Red/Blue's trainer victory after an Alpha (Team Rocket's too) or a boss. */
const winTrack = (kind) => (kind === 'elite' || kind === 'boss' ? 'trainer-victory' : 'victory');

async function finish(won) {
  const b = battle;
  if (won && b.def.phase2 && !b.phased) return rebirth();
  b.over = true;
  setStorm(false);
  b.busy = true;
  renderAll();

  if (won) {
    const grew = hasAbility('overgrow') && healPlayer(b.ability.amount);
    if (grew) abilityBanner();
    $('enemy-portrait-box').classList.add('defeated');
    playSound('faint');
    playMusic(winTrack(b.kind), { restart: true, cut: true });   // like the games: the fanfare starts as the enemy faints
    log(`${b.def.name} was defeated!`);
  } else {
    $('player-sprite').classList.add('defeated');
    log(`${stageName(b.starter, b.stage)} fainted…`);
  }
  await sleep(won && hasAbility('overgrow') ? 1700 : 1200);   // time to read Overgrow's banner
  if (battle !== b) return;
  if (!won && b.def.taunts?.win) {
    log(b.def.taunts.win);
    await sleep(2200);
    if (battle !== b) return;
  }

  stopAura();
  closeDialog('piles-dialog');
  b.onEnd({ won, foe: b.def.name, move: won ? null : b.blow ?? null, hp: b.hp, maxHp: b.maxHp, damageTaken: b.damageTaken, tally: tallyOf(b) });
}

/**
 * A boss with a second form (Eternatus) doesn't faint: it sinks into the Energy Well, the roof splits open on the Darkest
 * Day (bossRebirth() in scene.js), and it comes down through the rift as `def.phase2` (Eternamax) with a fresh bar,
 * its own music and cry, in the arena's storm at its fiercest. Its debuffs, block and strength are gone, like StS's
 * Awakened One; your side keeps everything. A tap skips the show. Felled on your turn, the turn goes on; on its own
 * (Burn, Leech Seed, Rocky Helmet), rising is its turn.
 */
async function rebirth() {
  const b = battle, en = b.enemy, next = b.def.phase2, still = () => battle === b;
  const motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  b.phased = true;
  b.busy = true;
  setStorm(false);
  renderAll();
  const box = $('enemy-portrait-box'), zone = $('enemy-zone');
  box.classList.remove('charging');
  box.classList.add('sinking');
  playSound('faint');
  log(`${b.def.name} fell... but the cavern is going dark!`);
  playMusic(null);
  await sleep(motion ? 1800 : 900);
  if (!still()) return;

  let skip;
  const skipped = new Promise(resolve => { skip = resolve; });
  const onTap = () => skip();
  document.addEventListener('pointerdown', onTap);
  document.body.classList.add('boss-prelude');
  zone.classList.add('boss-waiting');
  try { await bossRebirth(skipped); }
  finally { document.removeEventListener('pointerdown', onTap); }
  if (!still()) return;

  b.def = next;
  Object.assign(en, {
    hp: Math.round(next.hp * b.hpScale), block: 0, strength: 0, burn: 0, seed: 0, sap: 0, weak: 0, vulnerable: 0, moveIndex: 0, grown: {},
  });
  en.maxHp = en.hp;
  box.classList.remove('sinking', 'defeated', 'hit');
  setupEnemy();
  document.body.classList.remove('boss-prelude');
  zone.classList.remove('boss-waiting');
  setStorm(true);
  playMusic(next.music ?? 'boss', { restart: true });
  if (motion) zone.classList.add('emerging');
  renderAll();
  await Promise.all([Promise.race([playCry(next.spriteId), sleep(CRY_WAIT_MAX)]), sleep(motion ? 1400 : 300)]);
  if (!still()) return;
  zone.classList.remove('emerging');
  log(`${next.name}! Its power has no limit!`);
  await sleep(1300);
  if (!still()) return;
  if (b.enemyActing) {
    b.enemyActing = false;
    return beginPlayerTurn();
  }
  b.busy = false;
  renderAll();
}

/** Randomly reorder an array (returns a new array). */
function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randIndex(i + 1);
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
    const [top, bottom, left, right] = spriteFit(img.src);
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

/**
 * Gen 5's ability pop-up: "Charmander's Blaze" slides in on your side when the Ability does something (Torrent at
 * the fight's start, Blaze lighting up, Overgrow after a win), so it's clear what the Ability is and when it counts.
 */
let bannerTimer = 0;
function abilityBanner() {
  const b = battle, banner = $('ability-banner');
  $('ability-banner-who').textContent = `${stageName(b.starter, b.stage)}'s`;
  $('ability-banner-name').textContent = `${b.ability.icon} ${b.ability.name}`;
  banner.title = b.ability.text;
  banner.hidden = false;
  banner.classList.remove('show');
  void banner.offsetWidth;   // restarts the slide
  banner.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { banner.hidden = true; banner.classList.remove('show'); }, 1900);
}

/* Blaze lights up whenever HP falls below half (again after a heal took it back over); not during the intro. */
function checkBlaze() {
  const b = battle;
  showAbilityState();
  if (!hasAbility('blaze') || !b.turn) return;
  const lit = b.hp > 0 && b.hp < b.maxHp / 2;
  if (lit && !b.blazeLit) abilityBanner();
  b.blazeLit = lit;
}

/** The nameplate's Ability pill, like the map's: Blaze's is dim above half HP and lit below. */
function showAbilityState() {
  const b = battle, el = $('player-ability');
  if (!b.ability) return;
  const blaze = b.ability.id === 'blaze';
  const state = !blaze ? '' : b.hp > 0 && b.hp < b.maxHp / 2 ? 'on' : 'off';
  if (el.dataset.state === state && el.title) return;
  el.dataset.state = state;
  el.title = `Ability: ${b.ability.name}. ${b.ability.text}${state === 'off' ? ' (Not active yet.)' : state === 'on' ? ` Active now: +${b.ability.amount} damage!` : ''}`;
}

/** A foe with `taunts` (Kenmatta) talks once as its HP drops below half and below a fifth. Said a beat after the hit,
    so the card's own line is read first. */
function checkTaunts() {
  const b = battle, t = b.def.taunts, en = b.enemy;
  if (b.def.aura && !b.over && en.hp > 0 && en.hp <= en.maxHp / 2 && !b.ascended) {   // Super Saiyan 2 at half HP
    b.ascended = true;
    setAura($('enemy-img'), 2);
    playSound('power');
  }
  if (!t || b.over || en.hp <= 0) return;
  b.taunted ??= {};
  const say = (key) => {
    b.taunted[key] = true;
    setTimeout(() => { if (battle === b && !b.over) log(t[key]); }, 900);
  };
  if (t.low && !b.taunted.low && en.hp <= en.maxHp / 5) { b.taunted.half = true; say('low'); }
  else if (t.half && !b.taunted.half && en.hp <= en.maxHp / 2) say('half');
}

/** Things that don't change during a battle (sprites, names). */
function setupBattleScreen() {
  hideHandHint();
  const b = battle;
  $('player-name').textContent = stageName(b.starter, b.stage);
  const type = b.starter.type;
  $('player-type').textContent = TYPES[type].icon;
  $('player-type').title = `${TYPES[type].label} type`;
  $('player-type').className = `chip type-${type}`;
  $('player-ability').hidden = !b.ability;
  $('player-ability').dataset.type = type;
  if (b.ability) $('player-ability').textContent = b.ability.name;
  showAbilityState();
  $('ability-banner').hidden = true;
  $('player-sprite').src = spriteUrl(b.starter, 'back', b.stage);
  $('player-sprite').alt = stageName(b.starter, b.stage);
  $('player-sprite').dataset.stage = String(b.stage);
  $('player-sprite').classList.remove('defeated', 'lunge', 'hit');
  // legendaries keep one sprite, so they grow by stage like the map sprites; the others' files already grow
  const oneSprite = b.starter.line.every(form => form.id.replace(/-shiny$/, '') === b.starter.line[0].id);
  sizeSprite($('player-sprite'), 0.5, 1.1, 0.75, 1.25, oneSprite ? [0.78, 0.9, 1][b.stage] : 1);
  resetIntro();
  setupEnemy();
  log('');
}

/** The enemy's sprite, plate and type: at the start of a fight, and again when a boss rises in its second form. */
function setupEnemy() {
  const b = battle;
  const img = $('enemy-img');
  img.src = b.def.image;
  img.alt = b.def.name;
  img.classList.toggle('pixel', !b.def.art);
  setAura(img, 0);   // puts out Kenmatta's aura from a previous fight (aura.js)
  const box = $('enemy-portrait-box');
  box.classList.remove('defeated', 'hit', 'attacking');
  box.classList.toggle('sprite', !b.def.art);
  const zone = $('enemy-zone');
  if (b.def.art) ['--size', '--shift', '--drop', '--head-room'].forEach(name => zone.style.removeProperty(name));
  else sizeSprite(img, 0.6, 1, 0.7, 1.3, b.phased ? 1.25 : 1, zone);   // a boss's second form towers over the first
  box.classList.toggle('elite', b.kind === 'elite');
  box.classList.toggle('boss', b.kind === 'boss');
  box.title = b.def.description;

  const type = typeless() ? 'normal' : b.def.type;   // elites and bosses ignore the chart, so show them as Neutral
  $('enemy-zone').dataset.type = type;
  $('enemy-name').textContent = (b.kind === 'boss' ? '👹 ' : b.kind === 'elite' ? '💀 ' : b.rare ? '✨ ' : '') + b.def.name;
  $('enemy-plate').classList.toggle('rare', b.rare);
  box.classList.remove('captured', 'ran');
  closeBallPicker();
  $('enemy-type').textContent = TYPES[type].icon;
  $('enemy-type').title = `${TYPES[type].label} type`;
  $('enemy-type').className = `chip type-${type}`;
  box.classList.toggle('max', !!b.phased);
}

function renderAll() {
  if (!battle) return;
  checkBlaze();
  checkTaunts();
  renderBars();
  renderIntent();
  renderStatus();
  renderItems();
  renderHand();
  renderPicking();
}

const PICK_TEXT = {
  exhaust: ['🌫️', 'Exhaust a card', 'It\'s gone for the rest of this fight.'],
  discard: ['', 'Discard a card', 'It goes to your discard pile.'],
  keep: ['', 'Keep a card', 'It stays in your hand for next turn.'],
  copy: ['', 'Copy a card', 'A copy goes into your hand.'],
};

/* While a card asks you to pick one from your hand, the battle dims under the hand and a banner names the verb, so an
   Exhaust can't be mistaken for playing a card (the user exhausted one by accident, 2026-09-28). */
function renderPicking() {
  const screen = $('battle-screen');
  let banner = $('pick-banner');
  if (!banner) {
    banner = el('div', 'pick-banner');
    banner.id = 'pick-banner';
    banner.setAttribute('aria-live', 'polite');
    screen.append(banner);
  }
  const verb = choosing?.verb;
  screen.classList.toggle('picking', !!verb);
  if (!verb) { banner.hidden = true; delete banner.dataset.verb; return; }
  if (banner.dataset.verb === verb && !banner.hidden) return;
  const [icon, title, line] = PICK_TEXT[verb] || ['', `Choose a card to ${verb}`, ''];
  banner.dataset.verb = verb;
  screen.dataset.pick = verb;
  banner.replaceChildren(...[icon && el('span', 'pick-icon', icon), el('strong', 'pick-title', title), line && el('span', 'pick-line', line)].filter(Boolean));
  banner.hidden = false;
}

/** A card in your hand on screen: the risen one if it's up, else its spot in the hand. */
function handCard(uid) {
  const risen = $('card-focus').querySelector('.focus-card');
  if (risen && !$('card-focus').hidden && Number(risen.dataset.focusUid) === uid) return risen;
  return $('hand').querySelector(`[data-uid="${uid}"]`);
}

/** A played card flies off to where it acts, StS-style: an attack arcs at the enemy, landing as the hit does (~0.2 s),
    and a block, buff or power drops into your Pokémon (the user's call, 2026-09-28), with a trail in the card's type's
    colours (roadmap 8, `flyTrail()` in js/cardfx.js). */
function flyCard(uid, card) {
  const attack = isAttack(card);
  flyTrail(handCard(uid), $(attack ? 'enemy-img' : 'player-sprite'), { type: card.type, attack, fast: speed() > 1 });
}

/** A card exhausted from your hand, picked, played or faded (an Exhaust card, a status card under Lum Berry, an
    ethereal card, Burning Jealousy's hand) burns away into embers that drift into the exhaust pile (roadmap 8). */
function burnOut(uid) {
  const src = handCard(uid);
  if (!src) return Promise.resolve();
  const pile = $('exhaust-count');
  if (pile.hidden) {   // the first exhaust of the fight: the pile appears for the embers to land in
    pile.replaceChildren(el('span', 'pile-icon', '🌫️'), el('b', '', String(exhaustedCards(battle).length)));
    pile.hidden = false;
  }
  return burnAway(src, pile, { fast: speed() > 1 });
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
  renderPose();
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
  // like StS, the exhaust pile only shows once a card has been exhausted (played powers aren't; they just leave)
  const exhausted = exhaustedCards(b);
  $('exhaust-count').hidden = !exhausted.length;
  $('exhaust-count').replaceChildren(el('span', 'pile-icon', '🌫️'), el('b', '', String(exhausted.length)));
  $('end-turn-btn').disabled = b.busy || b.over;
  const throwable = canCatch();
  $('throw-btn').hidden = !throwable;
  if (!throwable) closeBallPicker();
  else {
    const problem = whyNotThrow();
    $('throw-btn').classList.toggle('spent', !!problem);
    $('throw-btn').title = problem ?? `Throw a ball: ${THROW_PP} PP, and it ends your turn. The lower its HP, the better the odds.`;
  }
  // nothing left to play: End Turn hops and blinks so it's clear that's the move (items don't count, they're optional)
  $('end-turn-btn').classList.toggle('nudge', !b.busy && !b.over && b.hand.every(h => whyNotPlayable(h.card)));
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
    const effect = enemyTypeMultiplier(move);
    const arrow = effect > 1 ? '▲' : effect < 1 ? '▼' : '';
    value = b.guard ? '✋' : `${attackDamage(move)}${arrow}`;
    detail = b.guard ? 'will hit your Guard' : `${attackDamage(move)} damage${move.kind === 'drain' ? ` and heal ${move.heal}` : ''}`;
  } else if (move.kind === 'defend') {
    icon = '🛡️'; kind = 'defend'; value = `+${move.amount}`; detail = `+${move.amount} block`;
  } else if (move.kind === 'status') {
    icon = CARDS_BY_ID[move.adds.card].art; kind = 'status'; value = `+${move.adds.n || 1}`; detail = '';
  } else if (move.kind === 'charge') {
    // shows the hit it's charging (the next move), so the warning carries its number
    const hit = b.def.moves[(b.enemy.moveIndex + 1) % b.def.moves.length];
    icon = '⚠️'; kind = 'charge'; value = String(attackDamage(hit)); detail = `charging: the turn after, ${hit.name} deals ${attackDamage(hit)} damage`;
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
  if (move.adds && move.kind !== 'status') box.append(el('span', 'intent-icon intent-adds', CARDS_BY_ID[move.adds.card].art));
  if (move.adds) {
    const junk = `puts ${move.adds.n || 1} ${CARDS_BY_ID[move.adds.card].name} into your ${{ hand: 'hand', draw: 'draw pile' }[move.adds.to] || 'discard pile'}`;
    detail = detail ? `${detail}, and ${junk}` : junk;
  }
  box.title = `Next turn: ${move.name} (${detail})`;
}

function renderStatus() {
  const b = battle;
  const en = b.enemy;
  const enemyBadges = [];
  if (en.block)    enemyBadges.push(['🛡️', en.block, `Block ${en.block}: soaks up damage until its next turn`, 'block']);
  if (en.burn)     enemyBadges.push(['🔥', en.burn, `Burn ${en.burn}: takes ${en.burn} damage at the start of its turn`]);
  if (en.weak)     enemyBadges.push(['📉', en.weak, `Weak ${en.weak}: deals 25% less damage for ${en.weak} more turn${en.weak > 1 ? 's' : ''}`]);
  if (en.vulnerable) enemyBadges.push(['💔', en.vulnerable, `Vulnerable ${en.vulnerable}: takes 50% more damage from your attacks for ${en.vulnerable} more turn${en.vulnerable > 1 ? 's' : ''}`]);
  if (en.seed)     enemyBadges.push(['🌱', en.seed, `Leech Seed ${en.seed}: at the start of its turn it loses ${en.seed} HP and you heal ${en.seed}${b.powers.seedKeep ? '' : ', then it drops by 1'}`]);
  if (en.sap)      enemyBadges.push(['🍂', en.sap, `Sap ${en.sap}: its attacks deal ${en.sap} less damage, all fight`]);
  if (en.strength) enemyBadges.push(['💪', en.strength, `Strength ${en.strength}: +${en.strength} damage on every attack`, 'bad']);
  if (en.bait)     enemyBadges.push(['🍓', en.bait, `Bait ${en.bait}: easier to catch, but its attacks deal ${en.bait * BAIT.damage} more`, 'bad']);
  if (en.rock)     enemyBadges.push(['🪨', en.rock, b.rare ? `Rock ${en.rock}: it runs off ${en.rock} turn${en.rock > 1 ? 's' : ''} sooner` : `Rock ${en.rock}: ${Math.round(ROCK_FLEE * en.rock * 100)}% chance it runs off on its turn`]);
  if (b.rare && !b.over) { const left = Math.max(0, RARE.turns - en.rock - b.turn + 1); enemyBadges.push(['💨', left, `A rare Pokémon: it runs off after ${left} more turn${left === 1 ? '' : 's'} of yours. Catch it or knock it out first!`, 'bad']); }
  if (b.def.trait) enemyBadges.push([TRAITS[b.def.trait.id].icon, '', TRAITS[b.def.trait.id].text(b.def.trait), 'bad']);
  $('enemy-status').replaceChildren(...enemyBadges.map(badgeFor));

  const playerBadges = [];
  if (b.block)      playerBadges.push(['🛡️', b.block, `Block ${b.block}: absorbs damage ${b.powers.keepBlock ? 'and stays between turns' : 'until your next turn'}`, 'block']);
  if (b.strength)   playerBadges.push(['💪', b.strength, `Strength ${b.strength}: +${b.strength} damage on every hit${b.flex ? ` (${b.flex} of it wears off at the end of this turn)` : ''}`, 'good']);
  if (b.dmgMult > 1) playerBadges.push(['🧬', '', `Unleashed: your attacks deal ${Math.round((b.dmgMult - 1) * 100)}% more damage in this biome`, 'good']);
  if (b.focus)      playerBadges.push(['🎯', b.focus, `Focus: your next attack deals +${b.focus} damage`, 'good']);
  if (b.guard)      playerBadges.push(['✋', '', 'Guard: blocks the next enemy attack completely', 'block']);
  if (b.nextEnergy) playerBadges.push(['⚡', b.nextEnergy, b.nextEnergy > 0 ? `+${b.nextEnergy} energy next turn` : `${-b.nextEnergy} less energy next turn`, b.nextEnergy > 0 ? 'good' : 'bad']);
  if (b.endure)     playerBadges.push(['🎗️', '', 'Endure: you can\'t drop below 1 HP until your next turn', 'good']);
  if (hasAbility('blaze') && b.hp < b.maxHp / 2) playerBadges.push(['🔥', '', `Blaze: your attacks deal +${b.ability.amount} while your HP is below half`, 'good']);
  if (b.tide)       playerBadges.push(['🌊', b.tide, `Tide ${b.tide}: lasts all fight; a move that says "per Tide" spends it all for a bigger hit`, 'good']);
  if (b.blockNext)  playerBadges.push(['🛡️', `+${b.blockNext}`, `+${b.blockNext} block at the start of your next turn`, 'block']);
  if (b.blur)       playerBadges.push(['🔰', '', 'Your block stays at the start of your next turn', 'block']);
  for (const [key, power] of Object.entries(POWERS)) {
    if (b.powers[key]) playerBadges.push([power.icon, power.flag ? '' : b.powers[key], power.text(b.powers[key]), 'good']);
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
    const node = makeCard(asShown(card), { stage: b.stage, cost: costOf(card) });
    node.classList.add('in-hand');

    if (choosing) node.classList.toggle('choosable', choosing.only(entry));
    else if (whyNotPlayable(card) && !b.busy) node.classList.add('unplayable');
    else if (b.busy) node.classList.add('waiting');
    if (entry.uid === (choosing ? choosing.picked : selectedUid)) node.classList.add('selected');
    node.dataset.uid = entry.uid;

    if (entry.fresh) {                            // cards just drawn slide in
      node.classList.add('deal');
      node.style.animationDelay = `${i * 70}ms`;
      entry.fresh = false;
    }

    node.tabIndex = 0;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', choosing?.only(entry) ? `Choose ${card.name}` : `${card.name}, costs ${costOf(card)}`);
    node.addEventListener('click', () => tapCard(entry.uid));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapCard(entry.uid); }
    });
    box.append(node);
  });
  fanHand();
  renderFocus();
  renderPose();
}

/* The enemy's body language, on #enemy-pose (between the box's lunges and the GIF's own animations): it braces while a
   raised attack is aimed at it, and sways on its feet below a quarter of its HP. */
function renderPose() {
  const b = battle, pose = $('enemy-pose');
  const up = !choosing && b.hand.find(h => h.uid === selectedUid);
  const standing = !b.over && b.enemy.hp > 0;
  pose.classList.toggle('bracing', standing && !!up && isAttack(up.card));
  pose.classList.toggle('swaying', standing && b.enemy.hp < b.enemy.maxHp * 0.25);
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
let choosing = null;       // { resolve } while a card asks you to pick a card in your hand (pickFromHand)
let pilePick = null;       // { done } while a card asks you to pick a card from a pile (pickFromPile)

function tapCard(uid) {
  if (dealing()) return;
  if (choosing) {
    // like playing a card: the first tap lifts it with a button naming what happens, the second confirms
    const entry = battle.hand.find(h => h.uid === uid);
    if (!entry || !choosing.only(entry)) return;
    if (choosing.picked !== uid) { choosing.picked = uid; return renderHand(); }
    const pick = choosing; choosing = null; return pick.resolve(uid);
  }
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

/* Hold a card and slide along the hand: whichever card the finger is over rises, and letting go leaves it up for a
   tap to play (the user's ask, 2026-10-04). Only the finger's x counts while it's over the hand. Cards are found by
   their place in the fan (offsetLeft, which ignores the spread's translate), so parting the hand around the risen card
   doesn't move the targets. The slide's own click is swallowed, so letting go never plays a card by accident.
   Swipe up to play (the user's ask, same day): drag a card up out of the hand and the risen card follows the finger;
   once the finger is FLING px above where it started and above the hand, the card is armed (it stops tracking x and
   glows), and letting go there plays it, or confirms a discard / exhaust pick, just as a second tap would. */
const FLING = 40;
function initScrub() {
  let drag = null;
  const handCardAt = (x, y) => document.elementsFromPoint(x, y).find(node => node.matches('.card.in-hand, .focus-card'));
  const nearest = (x) => {
    const box = $('hand'), left = box.getBoundingClientRect().left - box.scrollLeft;
    let best = null, gap = Infinity;
    for (const card of box.children) {
      const d = Math.abs(left + card.offsetLeft + card.offsetWidth / 2 - x);
      if (d < gap) { gap = d; best = card; }
    }
    return best && Number(best.dataset.uid);
  };
  const risen = () => $('card-focus').querySelector('.focus-card:not(.focus-item)');
  const current = () => (choosing ? choosing.picked : selectedUid);
  const settle = () => {
    const card = risen();
    if (card) { card.style.translate = ''; card.classList.remove('flinging'); }
  };
  const pick = (uid) => {
    const entry = battle.hand.find(h => h.uid === uid);
    if (!entry) return;
    if (choosing) {
      if (!choosing.only(entry) || choosing.picked === uid) return;
      choosing.picked = uid;
    } else {
      if (selectedUid === uid) return;
      selectedUid = uid;
      selectedItem = null;
      renderItems();
    }
    renderHand();
    playSound('stick');
    if (navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(8);
  };
  document.addEventListener('pointerdown', (e) => {
    drag = null;
    if (!battle || battle.busy || battle.over || pilePick || dealing() || !e.isPrimary || e.button > 0) return;
    const card = handCardAt(e.clientX, e.clientY);
    if (!card) return;
    const uid = card.classList.contains('focus-card') ? current() : Number(card.dataset.uid);
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, uid, on: false, armed: false };
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id || !battle || battle.busy) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(dx) < 12 && dy > -12) return;
      drag.on = true;
      if (Math.abs(dx) < -dy && drag.uid != null) pick(drag.uid);   // straight up: lift the card it started on
    }
    e.preventDefault();
    const handTop = $('hand').getBoundingClientRect().top;
    drag.armed = current() != null && -dy >= FLING && e.clientY < handTop;
    if (!drag.armed && e.clientY >= handTop) pick(nearest(e.clientX));
    const card = risen();
    if (card) {
      card.style.translate = `0 ${Math.min(0, dy)}px`;
      card.classList.toggle('flinging', drag.armed);
    }
  }, { passive: false });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { on: slid, armed } = drag;
    drag = null;
    if (!slid) return;
    const swallow = (c) => { c.stopPropagation(); c.preventDefault(); };
    document.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => document.removeEventListener('click', swallow, { capture: true }), 400);
    const uid = current();
    if (armed && battle && !battle.busy && uid != null) return tapCard(uid);
    settle();
  };
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', (e) => { if (drag?.id === e.pointerId) { drag = null; settle(); } });
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
  if (choosing?.picked) { choosing.picked = null; playSound('cancel', 'confirm'); return renderHand(); }
  if (selectedUid === null && selectedItem === null) return;
  playSound('cancel', 'confirm');
  selectedUid = null;
  selectedItem = null;
  renderItems();
  renderHand();
}

/** The Play / Use button under a picked card or item: End Turn's red striped panel and pill. */
const PICK_VERBS = { discard: 'Discard', exhaust: 'Exhaust', keep: 'Keep', copy: 'Copy' };

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
  clearPreview();
  if (pilePick) return;                           // Fusion Flare's picker owns the layer until a card is taken
  const layer = $('card-focus');
  layer.classList.remove('rise');
  spreadHand(selectedItem == null ? (choosing ? choosing.picked : selectedUid) : null);
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
  const entry = b.hand.find(h => h.uid === (choosing ? choosing.picked : selectedUid));
  if (!entry) { layer.hidden = true; layer.replaceChildren(); return; }

  const big = makeCard(asShown(entry.card), { stage: b.stage, cost: costOf(entry.card) });
  big.classList.add('focus-card');
  big.dataset.focusUid = entry.uid;
  const problem = choosing ? null : whyNotPlayable(entry.card);
  if (problem) big.classList.add('unplayable');
  else if (!choosing) showPreview(entry);
  big.tabIndex = 0;
  big.setAttribute('role', 'button');
  const verb = choosing ? PICK_VERBS[choosing.verb] ?? choosing.verb : 'Play';
  big.setAttribute('aria-label', `${verb} ${entry.card.name}`);
  big.addEventListener('click', () => tapCard(entry.uid));
  big.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapCard(entry.uid); }
  });
  // a playable card has no Play button: a second tap on it plays it (the user's call, 2026-10-04)
  const extra = problem ? el('p', 'focus-hint', problem) : choosing ? focusButton(verb, () => tapCard(entry.uid)) : null;
  if (choosing) extra.classList.add(`pick-${choosing.verb}`);
  const tips = cardTips(asShown(entry.card), big);
  layer.replaceChildren(big, ...(extra ? [extra] : []), ...(tips ? [tips] : []));
  layer.classList.add('rise');
  layer.hidden = false;
  popFromHand(big, extra, $('hand').querySelector(`[data-uid="${entry.uid}"]`), tips);
  big.focus({ preventScroll: true });
}

/**
 * StS's damage preview: while a card is raised, the enemy's HP bar flashes the chunk it would take (after its block,
 * Vulnerable, strength, Focus...) and your nameplate the block it would add. It asks damageFor() as if the card were
 * being played (played/attacks already counted, Aqua Tail's block first), then puts the numbers back.
 */
function showPreview(entry) {
  const b = battle, card = entry.card;
  const x = costOf(card) === 'X' ? b.energy : 0;
  const e = effectsOf(card, x);
  const damp = hasRelic('damp-rock') ? 2 : 0;
  if (e.exhaustHand) {
    e.exhausted = b.hand.filter(h => h !== entry && (e.exhaustHand === 'all' || (e.exhaustHand === 'status' ? h.card.status : !isAttack(h.card)))).length;
  }
  const saved = { block: b.block, played: b.played, attacks: b.attacks };
  let block = 0;
  if (e.blockDamage && e.block) { block += e.block + damp; b.block += e.block + damp; e.block = 0; }
  b.played += 1;
  if (isAttack(card)) b.attacks += 1;
  const { hits } = damageFor(card, e);
  Object.assign(b, saved);

  const total = hits.reduce((sum, n) => sum + n, 0);
  previewHp('enemy', b.enemy.hp, Math.max(0, total - b.enemy.block), b.enemy.maxHp);
  if (e.selfDamage) previewHp('player', b.hp, Math.min(e.selfDamage, b.hp - 1), b.maxHp);

  if (e.block) block += e.block + damp;
  if (e.blockPerCard) block += e.blockPerCard * (b.hand.length - 1) + damp;
  if (e.blockMult) block += (b.block + block) * (e.blockMult - 1);
  if (e.blockPerExhausted && e.exhausted) block += e.blockPerExhausted * e.exhausted + damp;
  if (block > 0) {
    $('player-plate').classList.add('block-preview');
    $('player-status').prepend(badgeFor(['🛡️', `+${block}`, `Playing it adds ${block} block`, 'block preview']));
  }
}

function clearPreview() {
  previewHp('enemy', 0, 0, 1);
  previewHp('player', 0, 0, 1);
  $('player-plate').classList.remove('block-preview');
  $('player-status').querySelector('.badge.preview')?.remove();
}

/**
 * Like Slay the Spire, the picked card rises out of its own place in the hand, bigger and straight, its foot dipping
 * into the hand (the user's call, 2026-10-04); a hint or a pick button, if any, sits above it. The hand's copy hides so
 * it reads as the same card lifting, and spreadHand() parts the cards beside it.
 */
function popFromHand(big, extra, from, tips) {
  if (!from) { tips?.remove(); return; }
  from.classList.add('lifted');
  const r = from.getBoundingClientRect();
  const w = big.offsetWidth, h = big.offsetHeight, gap = 8;
  const above = 14;   // clears the card's gold ring and drop shadow, which stick out ~8px past its box
  const left = Math.max(gap, Math.min(innerWidth - w - gap, r.left + r.width / 2 - w / 2));
  const foot = Math.min(r.top + r.height * 0.75, innerHeight - gap);   // low, so it stays in the thumb's reach
  const eh = extra ? extra.offsetHeight + above : 0;
  const top = Math.max(gap + eh, foot - h);
  const tilt = parseFloat(from.style.getPropertyValue('--fan')) * parseFloat(getComputedStyle($('hand')).getPropertyValue('--fan-tilt'));
  Object.assign(big.style, { left: `${left}px`, top: `${top}px`, rotate: `${tilt || 0}deg` });   // keeps its slant in the fan (the user's call)
  if (extra) {
    const ew = extra.offsetWidth;
    const ex = Math.max(gap, Math.min(innerWidth - ew - gap, left + w / 2 - ew / 2));
    Object.assign(extra.style, { left: `${ex}px`, top: `${top - eh}px` });
  }
  if (tips) placeTips(tips, left, top - eh, w, gap);

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dx = r.left + r.width / 2 - (left + w / 2), dy = r.bottom - (top + h);
  big.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${r.width / w})` }, { transform: 'none' }],
    { duration: 140, easing: 'ease-out' });
  extra?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: 60, fill: 'backwards' });
}

/* StS's hand: while a card is up, the cards beside it slide away from it along the fan's arc, most the nearest, opening
   its gap; --shift moves each one's place in the fan too, so it tilts and sinks like a card held where it slid to. */
function spreadHand(uid) {
  const cards = [...$('hand').children];
  const at = cards.findIndex(card => Number(card.dataset.uid) === uid);
  const w = cards[0]?.offsetWidth ?? 0;
  const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft || w : w;
  cards.forEach((card, i) => {
    const d = i - at, near = Math.abs(d);
    const push = at < 0 || !d ? 0 : Math.sign(d) * w * 0.28 / Math.sqrt(near);
    card.style.setProperty('--push', `${push.toFixed(1)}px`);
    card.style.setProperty('--shift', step ? (push / step).toFixed(3) : 0);
  });
}

/* The keyword boxes go beside the risen card, StS-style, on whichever side has room; a phone rarely has it, so
   there they stack over the card instead, where the arena is. */
const TIPS_W = 190;

function placeTips(tips, left, top, w, gap) {
  const right = innerWidth - left - w - 2 * gap, leftRoom = left - 2 * gap;
  const side = right >= TIPS_W ? 'right' : leftRoom >= TIPS_W ? 'left' : null;
  const width = side ? TIPS_W : Math.min(innerWidth - 2 * gap, 340);
  tips.style.width = `${width}px`;
  const th = tips.offsetHeight;
  if (side) {
    tips.style.left = `${side === 'right' ? left + w + gap : left - gap - width}px`;
    tips.style.top = `${Math.max(gap, Math.min(top, innerHeight - th - gap))}px`;
  } else {
    tips.style.left = `${Math.max(gap, Math.min(innerWidth - width - gap, left + w / 2 - width / 2))}px`;
    tips.style.top = `${Math.max(gap, top - gap - th)}px`;
  }
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

/** A hit that takes a big bite out of someone (a quarter of their HP, or 25) jolts the arena and flashes the screen; the enemy reels back from it (`recoil`, its sprite). */
function bigHit(through, maxHp, recoil) {
  if (through < Math.max(12, Math.min(25, maxHp * 0.25)) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  flash('battle-screen', 'big-hit', 450);
  if (recoil) flash(recoil, 'recoil', 520);
}

/** A boss close to fainting brings the weather in (see setStorm in scene.js). */
function checkStorm() {
  const en = battle.enemy;
  if (battle.kind === 'boss' && en.hp > 0 && en.hp <= en.maxHp * 0.3 && !(battle.def.phase2 && !battle.phased)) setStorm(true);
}

/** A number or word that floats up from a spot on screen. */
function pop(zoneId, text, kind = '', delay = 0) {
  const zone = $(zoneId);
  const node = el('span', `pop ${kind}`, text);
  delay /= speed();
  node.style.animationDelay = `${delay}ms`;
  zone.append(node);
  setTimeout(() => node.remove(), 1400 / speed() + delay);
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
  }, 18 / speed());
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
