/* ============================================================
   run.js  -  one attempt at the game, from the first fight to the
   last boss (or until you faint).

   A run goes like this:

       pick a starter -> preview the fixed deck -> Biome 1 map
         -> walk the map: fights, elites, rest sites, treasure
         -> boss -> (evolve!) -> Biome 2 map -> boss -> evolve
         -> Biome 3 map -> final boss -> you win

   Everything about the current run lives in one object, `run`:
     starter, stage (0-2 evolution), hp, maxHp, biome (0-2),
     deck (list of card ids), relics (list of relic ids), map, ...
   ============================================================ */

import { BIOMES, buildEncounter, pickEnemyId, ENEMY_DEFS } from './data/enemies.js';
import { BASE_HP, HP_PER_STAGE, STARTERS_BY_ID, RENAMED_STARTERS, spriteUrl, stageName } from './data/starters.js';
import { STAGE_POWER, TYPES, CARDS_BY_ID } from './data/cards.js';
import { RELICS, RELICS_BY_ID } from './data/relics.js';
import { getSave, updateSave, awardCoins, coinsWithBonus, saveRunData, loadRunData, clearRunData } from './storage.js';
import { modsFor, MAX_LEVEL, LEVELS } from './data/difficulty.js';
import { checkAchievements } from './progress.js';
import { generateMap, renderMap } from './map.js';
import { startBattle, abandonBattle } from './battle.js';
import { cardChoices, relicChoices, evolutionChoices, showChoice, cardOption, relicOption, textOption } from './rewards.js';
import { showDeckDialog } from './deckpreview.js';
import { $, el, groupDeck, showScreen, setBackdrop, toast, openDialog, closeDialog, refreshCoins, sleep, setHpBar } from './ui.js';
import { playMusic, playSound, preloadSounds } from './audio.js';

let run = null;

export const isRunActive = () => run !== null && !run.over;

/* ============================================================
   PokéCoins  -  see js/data/shop.js for what they buy.
   ============================================================ */
export const COIN_REWARDS = { fight: 3, elite: 12, eliteDisadvantage: 18, boss: 30, winBonus: 50 };

/** True if the elite/boss on this node is a type that beats your starter (fighting it is a real risk). */
function isTypeDisadvantage(node) {
  if (!node.enemyId) return false;
  const enemyType = TYPES[ENEMY_DEFS[node.enemyId].type];
  return enemyType.beats === run.starter.type;
}

/** Pick one random relic for the Starting Relic Charm passive (never a rare or boss one - those are meant to be found; Cleanse Tag only works when picked up). */
function randomStartingRelic() {
  const pool = RELICS.filter(r => !r.rare && !r.boss && r.id !== 'cleanse-tag' && (!r.only || r.only === run.starter.type));
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Called once at startup. */
export function initRun({ onMenu, onNewRun }) {
  $('run-deck-btn').addEventListener('click', () => run && showDeckDialog(run));
  initBag();

  $('result-menu').addEventListener('click',  () => { closeDialog('result-dialog'); onMenu(); });
  $('result-again').addEventListener('click', () => { closeDialog('result-dialog'); onNewRun(run.starter); });

  // These pop-ups move the game along, so Escape must not just close them.
  for (const id of ['result-dialog', 'evolve-dialog']) {
    $(id).addEventListener('cancel', (e) => e.preventDefault());
  }
}

/** Throw away the current run (used when you go back to the menu). */
export function abandonRun() {
  abandonBattle();
  if (run) clearRunData();
  run = null;
}

/* ============================================================
   SAVED RUNS  -  a checkpoint is written every time the map is shown,
   so a refresh puts you back on the map before the room you were in.
   Everything is stored by id and rebuilt from the data files on load.
   ============================================================ */

const RUN_SAVE_VERSION = 1;

function checkpoint() {
  const { floors, byId } = run.map;
  saveRunData({
    version: RUN_SAVE_VERSION,
    starter: run.starter.id,
    level: run.level,
    levelUnlocked: run.levelUnlocked,
    stage: run.stage,
    hp: run.hp,
    maxHp: run.maxHp,
    biome: run.biome,
    deck: run.deck,
    relics: run.relics,
    map: { nodes: Object.values(byId), floors: floors.map(row => row.map(node => node.id)) },
    current: run.current,
    backdrop: run.backdrop,
    restCount: run.restCount,
    fights: run.fights,
    unlocks: run.unlocks.map(s => s.id),
  });
}

function restoreRun(saved) {
  if (saved.version !== RUN_SAVE_VERSION) throw new Error('old run save');
  const starterById = (id) => STARTERS_BY_ID[RENAMED_STARTERS[id] || id];
  const starter = starterById(saved.starter);
  const known = (ids, table) => ids.every(id => table[id]);
  if (!starter || !BIOMES[saved.biome] || !starter.line[saved.stage] || !(saved.hp > 0)
      || !known(saved.deck, CARDS_BY_ID) || !known(saved.relics, RELICS_BY_ID) || !saved.unlocks.every(starterById)) {
    throw new Error('bad run save');
  }

  // floors and byId must hold the same node objects, or visiting a room wouldn't show on the map
  const byId = Object.fromEntries(saved.map.nodes.map(node => [node.id, node]));
  const floors = saved.map.floors.map(row => row.map(id => byId[id]));
  const nodes = Object.values(byId);
  if (!byId.boss || floors.flat().some(n => !n) || (saved.current && !byId[saved.current])
      || nodes.some(n => [...n.next, ...n.prev].some(id => !byId[id]) || (n.enemyId && !ENEMY_DEFS[n.enemyId]))) {
    throw new Error('bad run map');
  }

  return {
    ...saved,
    starter,
    mods: modsFor(saved.level),
    map: { floors, boss: byId.boss, byId },
    unlocks: saved.unlocks.map(starterById),
    over: false,
  };
}

/** The saved run, rebuilt and ready to play, or null. A save that can't be restored is thrown away. */
export function loadSavedRun() {
  const saved = loadRunData();
  if (!saved) return null;
  try { return restoreRun(saved); }
  catch (err) { clearRunData(); return null; }
}

export const hasSavedRun = () => loadSavedRun() !== null;

/** Pick a saved run (from loadSavedRun) back up on its map. */
export function continueRun(saved) {
  run = saved;
  showMap();
}

/** Start a brand new run with a starter, at a Trainer Level (0 = the normal game). */
export function beginRun(starter, level = 0) {
  const passives = getSave().passives;
  const startHp = BASE_HP + passives.hpBoost * 5;   // shop passive: Max HP Boost

  run = {
    starter,
    level,
    mods: modsFor(level),   // the rules of this Trainer Level
    levelUnlocked: null,    // set if winning this run unlocks the next level
    stage: 0,
    maxHp: startHp,
    hp: startHp,
    biome: 0,
    deck: [...starter.deck],
    relics: [],
    map: null,
    current: null,        // id of the map node you are standing on
    backdrop: '',
    restCount: 0,          // how many rest sites you've used this run (for an achievement)
    fights: 0,
    unlocks: [],           // starters unlocked during this run
    pendingCoins: '',      // coins won in the last fight, paid out when its rewards end
    over: false,
  };

  if (passives.relicCharm) {                         // shop passive: Starting Relic Charm
    const relic = randomStartingRelic();
    if (relic) { run.relics.push(relic.id); toast(`Starting relic: ${relic.name}!`, 'ok'); }
  }

  updateSave(d => { d.stats.runsStarted += 1; });
  startBiome();
}

/* ============================================================
   THE MAP
   ============================================================ */

function startBiome() {
  const biome = BIOMES[run.biome];
  run.map = generateMap();
  // Decide now who waits in every fight room: the map scouts elites and bosses, and a refresh can't reroll a fight.
  for (const node of Object.values(run.map.byId)) {
    if (['fight', 'elite', 'boss'].includes(node.type)) node.enemyId = pickEnemyId(run.biome, node.type);
  }
  run.current = null;
  run.backdrop = biome.backdrop;
  showMap();
}

function showMap() {
  const biome = BIOMES[run.biome];
  setBackdrop(run.backdrop, run.starter.type);

  $('run-sprite').src = spriteUrl(run.starter, 'front', run.stage);
  $('run-sprite').alt = stageName(run.starter, run.stage);
  $('run-sprite').dataset.stage = String(run.stage);
  $('run-title').textContent = stageName(run.starter, run.stage);
  // The sign drops in like the games' location sign, but only when you arrive in a new biome.
  const sign = $('biome-name');
  if (sign.textContent !== biome.name) {
    sign.textContent = biome.name;
    sign.dataset.biome = biome.id;
    sign.classList.remove('arrive');
    void sign.offsetWidth;
    sign.classList.add('arrive');
  }
  $('run-deck-count').textContent = String(run.deck.length);
  $('run-relic-count').textContent = String(run.relics.length);
  $('bag-deck-text').textContent = `${run.deck.length} cards. Every card you win joins it for the rest of the run.`;
  $('run-level').hidden = run.level === 0;
  $('run-level').textContent = `Level ${run.level}`;

  setHpBar('run', run.hp, run.maxHp);

  renderRelicList();
  closeBag();
  checkpoint();
  renderMap(run.map, run.current, enterNode, { biome: biome.id, trainer: spriteUrl(run.starter, 'front', run.stage), stage: run.stage });
  showScreen('map-screen');
  playMusic(`map${run.biome + 1}`);
}

/* The Bag: one drop-down with a pocket each for your deck, relics and the map key, like the Gold/Silver Bag.
   The tabs pick a pocket, and the arrows flip through them in order. */
const POCKETS = ['deck', 'relics', 'key'];
let pocket = 'relics';

function initBag() {
  $('bag-btn').addEventListener('click', () => ($('bag').hidden ? openBag() : closeBag()));
  for (const tab of document.querySelectorAll('.bag-pocket')) {
    tab.addEventListener('click', () => showPocket(tab.dataset.pocket));
  }
  const flip = (step) => showPocket(POCKETS[(POCKETS.indexOf(pocket) + step + POCKETS.length) % POCKETS.length]);
  $('bag-prev').addEventListener('click', () => flip(-1));
  $('bag-next').addEventListener('click', () => flip(1));
  document.addEventListener('click', (e) => { if (!e.target.closest('#bag-btn, #bag')) closeBag(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBag();
    if ($('bag').hidden) return;
    if (e.key === 'ArrowLeft') flip(-1);
    if (e.key === 'ArrowRight') flip(1);
  });
}

function openBag() {
  $('bag').hidden = false;
  $('bag-btn').setAttribute('aria-expanded', 'true');
  showPocket(pocket);
}

function closeBag() {
  $('bag').hidden = true;
  $('bag-btn').setAttribute('aria-expanded', 'false');
}

function showPocket(name) {
  pocket = name;
  for (const tab of document.querySelectorAll('.bag-pocket')) {
    const on = tab.dataset.pocket === name;
    tab.setAttribute('aria-selected', String(on));
    $(tab.getAttribute('aria-controls')).hidden = !on;
    if (on) $('bag-title').textContent = tab.dataset.name;
  }
}

function renderRelicList() {
  const rows = run.relics.map(id => {
    const relic = RELICS_BY_ID[id];
    const row = el('div', 'howto-li');
    const text = el('span', 'howto-li-text');
    text.append(el('b', '', relic.name), el('small', '', relic.text));
    row.append(el('span', 'howto-node relic-node', relic.icon), text);
    return row;
  });
  $('relics-list').replaceChildren(...(rows.length ? rows : [el('p', 'drop-empty', 'No relics yet. Beat an elite or open a treasure to find one.')]));
}

function enterNode(node) {
  run.current = node.id;
  node.visited = true;

  if (node.type === 'rest') return restSite();
  if (node.type === 'treasure') return treasureRoom();
  fight(node);   // 'fight', 'elite' or 'boss'
}

/* ============================================================
   FIGHTS AND WHAT COMES AFTER
   ============================================================ */

function fight(node) {
  const encounter = buildEncounter(run.biome, node.type, run.mods, node.enemyId);
  startBattle({ run, encounter, onEnd: (result) => afterFight(node, result) });
}

function afterFight(node, result) {
  if (!result.won) return endRun(false);

  run.hp = result.hp;
  run.fights += 1;

  const disadvantage = node.type === 'elite' && isTypeDisadvantage(node);
  const coinsFor = { fight: COIN_REWARDS.fight, elite: disadvantage ? COIN_REWARDS.eliteDisadvantage : COIN_REWARDS.elite, boss: COIN_REWARDS.boss };
  run.pendingCoins = `+${coinsWithBonus(coinsFor[node.type])} 💰 PokéCoins${disadvantage ? ' (type disadvantage!)' : ''}`;
  // Paid out only as the rewards end, right before the map checkpoint: a refresh on a
  // reward screen replays the fight, so paying earlier would let it be earned twice.
  const collect = () => {
    awardCoins(coinsFor[node.type]);
    updateSave(d => { d.stats.enemiesDefeated += 1; });
    refreshCoins();
    toast(run.pendingCoins, 'ok');
    run.pendingCoins = '';
  };

  const steps = [];   // screens to show one after another
  if (node.type === 'fight') steps.push(next => offerCard('fight', next));
  if (node.type === 'elite') steps.push(next => offerRelic('Elite defeated!', next), next => offerCard('elite', next));

  if (node.type === 'boss') {
    updateSave(d => {
      d.stats.bossesDefeated[run.biome + 1] = true;
      if (result.hp / run.maxHp > 0.5) d.stats.healthyBossWin = true;
    });
    if (run.biome === BIOMES.length - 1) { collect(); return endRun(true); }       // final boss: you win!
    announceUnlocks();
    steps.push(next => evolve(next), next => offerEvolutionCard(next), next => offerCard('boss', next), next => offerRelic('Boss defeated!', next, { boss: true }));
  }

  runSteps(steps, () => {
    collect();
    if (node.type === 'boss') { run.biome += 1; startBiome(); }
    else showMap();
  });
}

/** Run a list of steps in order. Each step gets a function to call when it is finished. */
function runSteps(steps, done) {
  const [first, ...rest] = steps;
  if (!first) return done();
  first(() => runSteps(rest, done));
}

/* ---------- rewards ---------- */

function offerCard(source, next) {
  const cards = cardChoices(run, source);
  if (!cards.length) return next();

  showChoice({
    title: 'Choose a move',
    sub: `Add one card to your deck (you have ${run.deck.length}), or skip.`,
    options: cards.map(card => cardOption(card, run.stage, () => {
      run.deck.push(card.id);
      toast(`${card.name} added to your deck.`, 'ok');
      next();
    })),
    onSkip: next,
    coins: run.pendingCoins,
  });
}

/** The "choose 1 of 2" screen for a new signature move after evolving. */
function offerEvolutionCard(next) {
  const cards = evolutionChoices(run);
  if (!cards.length) return next();

  showChoice({
    title: `${stageName(run.starter, run.stage)} learned a new move!`,
    sub: 'Evolving unlocked a powerful signature move. Choose one to add to your deck.',
    options: cards.map(card => cardOption(card, run.stage, () => {
      run.deck.push(card.id);
      toast(`${card.name} added to your deck!`, 'ok');
      next();
    })),
    onSkip: next,
    coins: run.pendingCoins,
  });
}

function offerRelic(title, next, { boss = false } = {}) {
  const relics = relicChoices(run, { boss });
  if (!relics.length) return next();

  showChoice({
    title,
    sub: relics[0].boss ? 'Choose a boss relic. Each one is strong, but comes with a catch.' : 'Choose a relic. It helps you for the rest of the run.',
    options: relics.map(relic => relicOption(relic, () => {
      run.relics.push(relic.id);
      toast(`Found ${relic.name}!`, 'ok');
      if (relic.id === 'cleanse-tag' && run.deck.length > MIN_DECK) return forgetMove(next, next);
      next();
    })),
    onSkip: next,
    coins: run.pendingCoins,
  });
}

function treasureRoom() {
  offerRelic('Treasure!', showMap);
}

/** Forgetting a move never takes the deck below this, so a reshuffle still deals a full hand and some. */
const MIN_DECK = 7;

function restSite() {
  const restHeal = run.mods.restHeal + (getSave().passives.wellFed ? 0.05 : 0);   // shop passive: Well-Fed Bonus
  const heal = Math.min(run.maxHp - run.hp, Math.ceil(run.maxHp * restHeal));
  showChoice({
    title: 'Pokémon Center',
    sub: 'A safe place to catch your breath.',
    options: [run.relics.includes('choice-band')
      ? { ...textOption('🏥', 'Rest', 'Your Choice Band won\'t let you rest.', () => {}), disabled: true }
      : textOption('🏥', 'Rest', `Heal ${heal} HP (${Math.round(restHeal * 100)}% of your max HP).`, async () => {
      const thisRun = run;
      run.hp += heal;
      run.restCount += 1;
      // like the games: the music stops and the healing chime plays out before you leave
      playMusic(null, { cut: true });
      const chime = await playSound('heal');
      await sleep(Math.min(chime, 4) * 1000);
      if (run !== thisRun) return;                 // the run was abandoned during the chime
      toast(`Healed ${heal} HP.`, 'ok');
      showMap();
    }), forgetOption(restSite)],
    skipLabel: 'Leave without resting',
    onSkip: showMap,
  });
  playMusic('center');
  preloadSounds('heal');
}

function forgetOption(back) {
  const atMin = run.deck.length <= MIN_DECK;
  const text = atMin ? `Your deck is at the minimum (${MIN_DECK} cards).` : `Remove one card from your deck (you have ${run.deck.length}).`;
  return { ...textOption('📖', 'Forget a move', text, () => forgetMove(back)), disabled: atMin };
}

/** `done` runs after a card is forgotten; Cleanse Tag passes its reward chain here, the Center returns to the map. */
function forgetMove(back, done = showMap) {
  showChoice({
    title: 'Forget a move',
    sub: `Choose a card to remove from your deck. It can't go below ${MIN_DECK} cards.`,
    options: groupDeck(run.deck, CARDS_BY_ID).map(({ card, count }) => cardOption(card, run.stage, () => {
      run.deck.splice(run.deck.indexOf(card.id), 1);
      toast(`${card.name} was forgotten.`, 'ok');
      done();
    }, count)),
    skipLabel: back === done ? 'Keep every move' : 'Back',
    onSkip: back,
  });
}

/* ---------- evolution ---------- */

function evolve(next) {
  const from = run.stage;
  run.stage += 1;
  run.maxHp += HP_PER_STAGE;
  // Evolving heals you: fully at Trainer Level 0-4, only half of your missing HP at level 5.
  run.hp = Math.min(run.maxHp, Math.round(run.hp + (run.maxHp - run.hp) * run.mods.evolveHeal));
  const healed = run.mods.evolveHeal >= 1 ? 'fully healed' : 'healed by half of its missing HP';

  const fromName = stageName(run.starter, from);
  const toName = stageName(run.starter, run.stage);
  $('evolve-from').src = spriteUrl(run.starter, 'front', from);
  $('evolve-from').dataset.stage = String(from);
  $('evolve-to').src = spriteUrl(run.starter, 'front', run.stage);
  $('evolve-to').dataset.stage = String(run.stage);
  $('evolve-title').textContent = `${fromName} is evolving!`;
  $('evolve-text').textContent =
    `${fromName} evolved into ${toName}! Max HP +${HP_PER_STAGE} and ${healed}. ` +
    `All your moves are now ${STAGE_POWER * 100 * run.stage}% stronger.`;
  $('evolve-continue').onclick = () => { closeDialog('evolve-dialog'); next(); };
  openDialog('evolve-dialog');
}

/* ============================================================
   THE END OF A RUN
   ============================================================ */

/** Check achievements and tell the player about any new starters. */
function announceUnlocks() {
  for (const starter of checkAchievements()) {
    run.unlocks.push(starter);
    toast(`🔓 Unlocked ${starter.line[0].name}!`, 'ok');
  }
}

function endRun(won) {
  run.over = true;
  clearRunData();

  if (won) {
    const winCoins = awardCoins(COIN_REWARDS.winBonus);
    refreshCoins();
    toast(`+${winCoins} 💰 (run complete!)`, 'ok');

    updateSave(d => {
      d.stats.runsWon += 1;
      d.stats.winsBy[run.starter.id] = (d.stats.winsBy[run.starter.id] || 0) + 1;
      if (run.restCount <= 1) d.stats.lightRestWin = true;
      const type = run.starter.type;
      d.stats.maxLevelWinByType[type] = Math.max(d.stats.maxLevelWinByType[type], run.level);
    });
    announceUnlocks();

    // Winning on your highest unlocked Trainer Level unlocks the next one.
    if (run.level === getSave().maxLevel && run.level < MAX_LEVEL) {
      run.levelUnlocked = run.level + 1;
      updateSave(d => { d.maxLevel = run.levelUnlocked; });
    }
  }

  const name = stageName(run.starter, run.stage);
  const biome = BIOMES[run.biome];
  $('result-title').textContent = won ? '🏆 You conquered the wastes!' : '💀 Your run has ended';
  $('result-text').textContent = won
    ? `${name} beat all three bosses! Fights won: ${run.fights}. Relics: ${run.relics.length}. Deck: ${run.deck.length} cards.`
    : `${name} fainted in Biome ${run.biome + 1} (${biome.name}) after ${run.fights} won fights. Try a different path or a different starter!`;

  const list = $('result-unlocks');
  const lines = run.unlocks.map(s => `🔓 Unlocked ${s.line[0].name}!`);
  if (run.levelUnlocked) lines.push(`⭐ Trainer Level ${run.levelUnlocked} unlocked: ${LEVELS[run.levelUnlocked].name}!`);
  list.replaceChildren(...lines.map(text => el('li', '', text)));
  list.hidden = lines.length === 0;
  $('result-again').textContent = 'New run';
  openDialog('result-dialog');
}
