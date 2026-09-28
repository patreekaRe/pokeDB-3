/* ============================================================
   main.js  -  the front door of the game.

   It wires up the buttons that are always on screen and connects the
   screens. The title's gem menu is home:

       title -> New game: character select -> deck preview -> map -> battle -> rewards -> map ...
             -> Continue: map                                (run.js is in charge of that loop)
             -> Collection, Game Corner

   The other files each do one job:
     data/*.js       cards, starters, enemies, relics, achievements (plain data)
     storage.js      saving to localStorage
     progress.js     unlocking starters
     ui.js           small helpers (dialogs, card element)
     deckpreview.js  the run's deck window (read-only)
     run.js          one run: the map loop, rewards, evolution, the end
     map.js          building and drawing the branching map
     rewards.js      the "choose one" screen
     battle.js       the fight
     records.js      the Stats and Achievements windows
     howto.js        the swipeable How to play window
     title.js        the title screen: PRESS START, then the gem menu (home)
     select.js       the character select (New game)
     collection.js   the Collection (Pokédex, Moves, Relics, Items, Stats, Achievements)
     tips.js         tap-to-read hints (an element's title) on touch screens
     cloud.js        the optional cloud save (Firebase sign-in, from the Poké Ball menu)
   ============================================================ */

import { spriteUrl, stageName, useShinies } from './data/starters.js';
import { BIOMES } from './data/enemies.js';
import { MAX_LEVEL } from './data/difficulty.js';
import { getSave, updateSave, resetSave, clearRunData, isShiny } from './storage.js';
import { initRun, beginRun, abandonRun, suspendRun, isRunActive, loadSavedRun, hasSavedRun, continueRun, runBiome } from './run.js';
import { initBattle } from './battle.js';
import { toggleShop, initShop } from './shop.js';
import { initAudio, playSound } from './audio.js';
import { initHowto, openHowto } from './howto.js';
import { initTitle, showTitle, showHome, leaveTitle } from './title.js';
import { initSelect, showSelect, refreshSelect, pickedStarter, prepare } from './select.js';
import { initCollection, showCollection } from './collection.js';
import { initTips } from './tips.js';
import { initPixelIcons } from './icons.js';
import { openStats, openAchievements } from './records.js';
import { initCardIndex, openCardIndex } from './cardindex.js';
import { initPokedex, openPokedex } from './pokedex.js';
import { initCloud } from './cloud.js';
import { $, openDialog, closeDialog, confirmDialog } from './ui.js';

/* ---------- moving between screens ---------- */

/** The saved run as the title's Continue gem shows it, or null. */
function savedRunCard() {
  const saved = loadSavedRun();
  if (!saved) return null;
  const { starter, stage, biome, hp, maxHp } = saved;
  const here = saved.current && saved.map.byId[saved.current];
  return {
    saved, hp, maxHp,
    floor: here ? here.floor + 1 : 0,   // the biome's floor you stand on; 0 on the road in, like StS's Neow floor
    sprite: spriteUrl(starter, 'front', stage),
    name: stageName(starter, stage),
    place: BIOMES[biome]?.name ?? `Biome ${biome + 1}`,
    biome: BIOMES[biome]?.id,
    cry: starter.line[stage]?.id ?? starter.line[0].id,
  };
}

/** The title's menu is home: Main menu, a run's end and every Back come here. */
function goHome() {
  abandonRun();
  showHome();
}

/** New game: the character select, under the title as it fades. */
function newGame(starter) {
  showSelect(starter);
  leaveTitle();
}

/** Look at a starter's deck, and start a run from there. */
function previewStarter(starter) {
  prepare(starter, {
    onBegin: async (level) => {
      if (hasSavedRun() && !(await confirmDialog('Start a new run? Your saved run will be lost.', 'Start new'))) return;
      beginRun(starter, level);
    },
    onBack: () => showSelect(starter),
  });
}

// The run stays saved (the user's call: going to the menu shouldn't cost it). Only the map is a checkpoint, so
// leaving from a fight or room means replaying it, as a refresh would.
async function requestMenu() {
  if (isRunActive()) {
    if (document.body.dataset.screen !== 'map-screen'
      && !(await confirmDialog('Back to the menu? Your run is saved, but this room will start over when you continue.', 'Menu'))) return;
    suspendRun();
    return showHome();
  }
  goHome();
}

/** Throw the run away for good (the user's ask): from the Poké Ball menu, or the title's nameplate. */
async function requestAbandon() {
  if (!hasSavedRun() && !isRunActive()) return;
  if (!(await confirmDialog('Abandon this run? It will be gone for good.', 'Abandon'))) return;
  abandonRun();
  clearRunData();
  showHome();
}

/* ---------- the Poké Ball menu (top left) ---------- */

function initBallMenu() {
  const ball = $('brand-btn');
  const panel = $('ball-menu-panel');
  // opening and closing it sound like the Bag (the user's call), except when a picked item closes it
  const setOpen = (open, quiet = false) => {
    if (!quiet && open === panel.hidden) playSound('bag');
    panel.hidden = !open;
    ball.setAttribute('aria-expanded', String(open));
  };

  ball.addEventListener('click', () => {
    if (panel.hidden) $('abandon-btn').hidden = !isRunActive() && !hasSavedRun();
    setOpen(panel.hidden);
  });
  $('abandon-btn').addEventListener('click', requestAbandon);
  $('home-btn').addEventListener('click', requestMenu);

  // picking an item closes the menu, except Sound, so you can see it switch on/off
  panel.addEventListener('click', (e) => {
    const item = e.target.closest('.menu-item');
    if (item && item.id !== 'music-btn') setOpen(false, true);
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !e.target.closest('.ball-menu')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); ball.focus(); }
  });
}

/* ---------- start everything ---------- */

function init() {
  initPixelIcons();
  useShinies(isShiny);
  // Playtest shortcut (the user's ask): opening the game with ?levels unlocks every Trainer Level for good.
  if (new URLSearchParams(location.search).has('levels')) updateSave(d => { d.maxLevel = MAX_LEVEL; });
  initAudio();
  initTips();
  initHowto();
  // The top bar has no background, so once the page scrolls a fade keeps its numbers off whatever slides under them.
  const markScrolled = () => document.body.classList.toggle('scrolled', scrollY > 4);
  addEventListener('scroll', markScrolled, { passive: true });
  initBattle();
  initRun({ onMenu: goHome, onNewRun: previewStarter });

  initShop();
  $('shop-btn').addEventListener('click', () => toggleShop());
  $('menu-shop-btn').addEventListener('click', () => toggleShop());

  // A purchase made while the shop was open (a skin, a shiny) shows on the character select at once.
  $('shop-dialog').addEventListener('close', () => {
    $('shop-btn').setAttribute('aria-expanded', 'false');
    if (document.body.dataset.screen === 'start-screen') refreshSelect();
  });

  // Buttons that are always on screen
  $('help-btn').addEventListener('click', openHowto);
  $('about-btn').addEventListener('click', () => openDialog('about-dialog'));
  $('credits-link').addEventListener('click', () => openDialog('about-dialog'));
  initCardIndex();
  $('index-btn').addEventListener('click', () => openCardIndex(pickedStarter()?.type));
  initPokedex();
  $('dex-btn').addEventListener('click', () => openPokedex(runBiome()));
  $('stats-btn').addEventListener('click', openStats);
  $('achievements-btn').addEventListener('click', openAchievements);
  initBallMenu();
  initCloud();

  $('reset-btn').addEventListener('click', async () => {
    if (!(await confirmDialog('Erase all stats and unlocked starters?', 'Erase'))) return;
    resetSave();
    clearRunData();
    closeDialog('about-dialog');
    goHome();
  });

  initTitle({
    savedRun: savedRunCard,
    onContinue: (saved) => { leaveTitle(); continueRun(saved); },
    onNewGame: () => newGame(),
    onCollection: () => { showCollection(); leaveTitle(); },
    onGameCorner: () => toggleShop(),
    onAbandon: requestAbandon,
  });
  initSelect({ onChoose: previewStarter, onBack: showHome });
  initCollection({ onBack: showHome });

  showSelect();   // under the title, so the menu scene is ready behind it
  showTitle().then(() => {
    // Show the how-to-play once, the very first time.
    if (!getSave().seenHelp) {
      updateSave(d => { d.seenHelp = true; });
      setTimeout(openHowto, 400);
    }
  });
}

init();
