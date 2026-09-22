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

import { BIOMES, buildEncounter, pickEnemyId } from './data/enemies.js';
import { BASE_HP, HP_PER_STAGE, spriteUrl, stageName } from './data/starters.js';
import { STAGE_POWER } from './data/cards.js';
import { RELICS_BY_ID } from './data/relics.js';
import { getSave, updateSave } from './storage.js';
import { modsFor, MAX_LEVEL, LEVELS } from './data/difficulty.js';
import { checkAchievements } from './progress.js';
import { generateMap, renderMap } from './map.js';
import { startBattle, abandonBattle } from './battle.js';
import { cardChoices, relicChoices, evolutionChoices, showChoice, cardOption, relicOption, textOption } from './rewards.js';
import { showDeckDialog } from './deckpreview.js';
import { $, el, makeRelic, showScreen, setBackdrop, toast, openDialog, closeDialog } from './ui.js';

let run = null;

export const isRunActive = () => run !== null && !run.over;

/** Called once at startup. */
export function initRun({ onMenu, onNewRun }) {
  $('run-deck-btn').addEventListener('click', () => run && showDeckDialog(run));

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
  run = null;
}

/** Start a brand new run with a starter, at a Trainer Level (0 = the normal game). */
export function beginRun(starter, level = 0) {
  run = {
    starter,
    level,
    mods: modsFor(level),   // the rules of this Trainer Level
    levelUnlocked: null,    // set if winning this run unlocks the next level
    stage: 0,
    maxHp: BASE_HP,
    hp: BASE_HP,
    biome: 0,
    deck: [...starter.deck],
    relics: [],
    map: null,
    current: null,        // id of the map node you are standing on
    backdrop: '',
    rested: false,        // did you ever use a rest site? (for an achievement)
    fights: 0,
    unlocks: [],          // starters unlocked during this run
    over: false,
  };
  updateSave(d => { d.stats.runsStarted += 1; });
  startBiome();
}

/* ============================================================
   THE MAP
   ============================================================ */

function startBiome() {
  const biome = BIOMES[run.biome];
  run.map = generateMap();
  // Decide now which elite or boss each of those rooms holds, so the map can show it (scouting).
  for (const node of Object.values(run.map.byId)) {
    if (node.type === 'elite' || node.type === 'boss') node.enemyId = pickEnemyId(run.biome, node.type);
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
  $('run-title').textContent = stageName(run.starter, run.stage);
  $('biome-title').textContent = `Biome ${run.biome + 1}: ${biome.name}`;
  $('run-deck-count').textContent = String(run.deck.length);
  $('run-level').hidden = run.level === 0;
  $('run-level').textContent = `Level ${run.level}`;

  const ratio = run.hp / run.maxHp;
  const fill = $('run-hp-fill');
  fill.style.width = `${ratio * 100}%`;
  fill.dataset.level = ratio > 0.6 ? 'high' : ratio > 0.3 ? 'mid' : 'low';
  $('run-hp-text').textContent = `${run.hp} / ${run.maxHp}`;

  $('run-relics').replaceChildren(...run.relics.map(id => makeRelic(RELICS_BY_ID[id], { compact: true })));

  renderMap(run.map, run.current, enterNode);
  showScreen('map-screen');
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
  updateSave(d => { d.stats.enemiesDefeated += 1; });

  const steps = [];   // screens to show one after another
  if (node.type === 'fight') steps.push(next => offerCard('fight', next));
  if (node.type === 'elite') steps.push(next => offerRelic('Elite defeated!', next), next => offerCard('elite', next));

  if (node.type === 'boss') {
    updateSave(d => {
      d.stats.bossesDefeated[run.biome + 1] = true;
      if (result.damageTaken === 0) d.stats.noDamageBoss = true;
    });
    if (run.biome === BIOMES.length - 1) return endRun(true);       // final boss: you win!
    announceUnlocks();
    steps.push(next => evolve(next), next => offerEvolutionCard(next), next => offerCard('boss', next), next => offerRelic('Boss defeated!', next));
  }

  runSteps(steps, () => {
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
  });
}

function offerRelic(title, next) {
  const relics = relicChoices(run);
  if (!relics.length) return next();

  showChoice({
    title,
    sub: 'Choose a relic. It helps you for the rest of the run.',
    options: relics.map(relic => relicOption(relic, () => {
      run.relics.push(relic.id);
      toast(`Found ${relic.name}!`, 'ok');
      next();
    })),
    onSkip: next,
  });
}

function treasureRoom() {
  offerRelic('Treasure!', showMap);
}

function restSite() {
  const restHeal = run.mods.restHeal;
  const heal = Math.min(run.maxHp - run.hp, Math.ceil(run.maxHp * restHeal));
  showChoice({
    title: 'Pokémon Center',
    sub: 'A safe place to catch your breath.',
    options: [textOption('🏥', 'Rest', `Heal ${heal} HP (${Math.round(restHeal * 100)}% of your max HP).`, () => {
      run.hp += heal;
      run.rested = true;
      toast(`Healed ${heal} HP.`, 'ok');
      showMap();
    })],
    skipLabel: 'Leave without resting',
    onSkip: showMap,
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
  $('evolve-to').src = spriteUrl(run.starter, 'front', run.stage);
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

  if (won) {
    updateSave(d => {
      d.stats.runsWon += 1;
      d.stats.winsBy[run.starter.id] = (d.stats.winsBy[run.starter.id] || 0) + 1;
      if (!run.rested) d.stats.noRestWin = true;
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
