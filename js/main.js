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

import { STARTERS, STARTERS_BY_ID, spriteUrl, stageName, useShinies } from './data/starters.js';
import { gateScene } from './gatescene.js';
import { gateHp } from './gate.js';
import { BIOMES } from './data/enemies.js';
import { MAX_LEVEL } from './data/difficulty.js';
import { getSave, updateSave, resetSave, clearRunData, loadRunData, isShiny } from './storage.js';
import { seedGate } from './data/gate.js';
import { initRun, beginRun, beginSafari, abandonRun, suspendRun, isRunActive, loadSavedRun, hasSavedRun, continueRun, runBiome, runSafariArea, peekEvent, isPeeking } from './run.js';
import { initBattle } from './battle.js';
import { toggleShop, initShop } from './shop.js';
import { initAudio, playSound } from './audio.js';
import { initHowto, openHowto } from './howto.js';
import { initPatchNotes } from './patchnotes.js';
import { initTitle, showTitle, showHome, leaveTitle } from './title.js';
import { initSelect, showSelect, refreshSelect, pickedStarter, prepare } from './select.js';
import { initCollection, showCollection } from './collection.js';
import { initTips } from './tips.js';
import { initPixelIcons } from './icons.js';
import { openStats, openAchievements } from './records.js';
import { initCardIndex, openCardIndex } from './cardindex.js';
import { initPokedex, openPokedex } from './pokedex.js';
import { initSafariDex, openSafariDex } from './safaridex.js';
import { initLeaderboard, openLeaderboard } from './leaderboard.js';
import { initSafariPrep, openSafariPrep } from './safariprep.js';
import { initCloud } from './cloud.js';
import { $, el, openDialog, closeDialog, confirmDialog } from './ui.js';
import { showPlaceScene, showScene } from './scene.js';
import { SAFARI_AREAS } from './data/safari.js';

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

/** Throw the run away for good (the user's ask): from the Poké Ball menu, or the title's Escape Rope, which has already
    asked in its own bubble (`sure`). */
async function requestAbandon(sure) {
  if (!hasSavedRun() && !isRunActive()) return;
  if (sure !== true && !(await confirmDialog('Abandon this run? It will be gone for good.', 'Abandon'))) return;
  abandonRun();
  if (!isPeeking()) clearRunData();   // a ?event= playtest run leaves the real saved run alone
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
  const query = new URLSearchParams(location.search);
  if (query.has('levels')) updateSave(d => { d.maxLevel = MAX_LEVEL; });
  // ?mewtwo unlocks Mewtwo for good, to playtest its run without winning Level 5 with every starter first.
  if (query.has('safari')) updateSave(d => { d.safariPass = true; });
  if (query.has('mewtwo')) updateSave(d => { if (!d.unlocked.includes('mewtwo')) d.unlocked.push('mewtwo'); });
  // ?lockmewtwo undoes it: Mewtwo locked again, its shiny dropped, a saved Mewtwo run gone, and the Sealed Gate back where
  // the Record Book's wins leave it. Only while Mewtwo is unlocked, so a bookmarked link can't reset the gate's progress.
  if (query.has('lockmewtwo') && getSave().unlocked.includes('mewtwo')) {
    if (loadRunData()?.starter === 'mewtwo') clearRunData();
    updateSave(d => {
      d.unlocked = d.unlocked.filter(id => id !== 'mewtwo');
      d.shiny.owned = d.shiny.owned.filter(id => id !== 'mewtwo');
      d.shiny.on = d.shiny.on.filter(id => id !== 'mewtwo');
      d.gateHp = seedGate(d);
    });
  }
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
  $('title-help').addEventListener('click', openHowto);
  initPatchNotes();
  $('about-btn').addEventListener('click', () => openDialog('about-dialog'));
  $('credits-link').addEventListener('click', () => openDialog('about-dialog'));
  initCardIndex();
  $('index-btn').addEventListener('click', () => openCardIndex(pickedStarter()?.type));
  initPokedex();
  initSafariDex();
  // in a Safari run the button opens the Safari Pokédex on the run's area: its catches never touch the main one
  $('dex-btn').addEventListener('click', () => (runSafariArea() ? openSafariDex(runSafariArea()) : openPokedex(runBiome())));
  $('stats-btn').addEventListener('click', openStats);
  $('achievements-btn').addEventListener('click', openAchievements);
  initBallMenu();
  initCloud();
  initLeaderboard();
  $('safari-dex-board').addEventListener('click', () => openLeaderboard());
  initSafariPrep({
    onStart: async () => {
      if (hasSavedRun() && !(await confirmDialog('Start today\'s Safari Zone run? Your saved run will be lost.', 'Start'))) return openSafariPrep();
      leaveTitle();
      beginSafari();
    },
  });

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
    onSafari: openSafariPrep,
    onBoard: () => openLeaderboard(),
    onGate: (mewtwo) => { newGame(mewtwo); previewStarter(mewtwo); },   // the broken gate: straight to Mewtwo's Prepare step
    onAbandon: requestAbandon,
  });
  initSelect({ onChoose: previewStarter, onBack: showHome });
  initCollection({ onBack: showHome });

  // Playtest shortcut (the user's ask): ?scene=tutor (or kombat, center...) shows just that room's painted scene, no
  // run started, so the saved run is untouched; &biome=shrine or wastes picks the biome outside its windows.
  const params = new URLSearchParams(location.search), place = params.get('scene');
  // ?area=wetland (any Safari area; &stage=0-3, &kind=elite or boss) shows that area's scene the same way, and each
  // tap walks on to its next place, then the next area
  if (params.has('area')) return peekSafari(params);
  if (place) {
    document.body.classList.add('scene-peek');
    showPlaceScene(place, { biome: params.get('biome') || 'clearing' });
    return;
  }
  // ...and ?event=move-tutor (any event id) walks a throwaway, never-saved run straight into that event's room
  if (params.get('event') && peekEvent(STARTERS.find(s => s.free), params.get('event'))) return;

  showSelect();   // under the title, so the menu scene is ready behind it
  showTitle().then(() => {
    // ?strike=90 (with &gate=HP, &starter=id, &stage=0-2, &level=0-5, &kind=loss, &first) plays the Sealed Gate's scene after PRESS START,
    // from the gate's HP, without saving anything; a strike past its HP is the break that frees Mewtwo
    if (params.has('strike')) return peekStrike(params);
    // Show the how-to-play once, the very first time.
    if (!getSave().seenHelp) {
      updateSave(d => { d.seenHelp = true; });
      setTimeout(openHowto, 400);
    }
  });
}

/** The ?strike= playtest: the gate scene on its own, nothing saved. */
/** The Safari areas' scenes, a floor at a time as you'd walk them (a playtest view: no run, nothing saved): floors 1-3,
    4-6 and 7-10 are an area's first three places (stageOf() in js/map.js), then the boss's. */
const PEEK_FLOORS = 11, PLACE_START = [0, 3, 6, 10];
function peekSafari(params) {
  document.body.classList.add('scene-peek');
  let i = Math.max(0, SAFARI_AREAS.findIndex(a => a.id === params.get('area')));
  let floor = PLACE_START[Math.min(3, Math.max(0, +params.get('stage') || 0))];
  const kind = params.get('kind') || 'wild', label = el('div', 'peek-label');
  document.body.append(label);
  const show = () => {
    const area = SAFARI_AREAS[i], stage = PLACE_START.findLastIndex(f => floor >= f);
    showScene(area.id, stage === 3 && kind === 'wild' ? 'boss' : kind, { progress: (floor + 1) / PEEK_FLOORS, stage, step: floor - PLACE_START[stage], seed: 1000 + i * 37 });
    label.textContent = `${area.name}, ${stage === 3 ? 'boss' : `floor ${floor + 1}`}: ${area.stages[stage]}. Tap for the next.`;
  };
  addEventListener('pointerup', () => { if (++floor >= PEEK_FLOORS) { floor = 0; i = (i + 1) % SAFARI_AREAS.length; } show(); });
  show();
}

function peekStrike(params) {
  const starter = STARTERS_BY_ID[params.get('starter')] ?? STARTERS.find(s => s.free);
  const stage = Math.min(starter.line.length - 1, Number(params.get('stage')) || 0);
  const before = gateHp(), hit = Math.max(0, Number(params.get('strike')) || 0);
  const after = Math.max(0, before - hit);
  const kind = params.get('kind') || (after === 0 ? 'ultimate' : 'win');
  gateScene({ starter, stage, before, after: kind === 'loss' ? before : after, kind, level: Number(params.get('level')) || 0, first: params.has('first'), music: 'title' });
}

init();
