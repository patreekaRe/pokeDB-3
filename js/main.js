/* ============================================================
   main.js  -  the front door of the game.

   It builds the start screen (pick a starter), wires up the buttons
   that are always on screen, and connects the three screens:

       start screen  ->  deck builder  ->  battle
                   ^______________________|

   The other files each do one job:
     data/*.js       cards, starters, enemies (plain data)
     storage.js      saving to localStorage
     progress.js     what you have unlocked
     ui.js           small helpers (dialogs, toasts, card element)
     deckbuilder.js  the deck-building screen
     battle.js       the fight
   ============================================================ */

import { STARTERS, spriteUrl, BACKDROPS } from './data/starters.js';
import { TYPES } from './data/cards.js';
import { getSave, updateSave, resetSave } from './storage.js';
import { isStarterUnlocked } from './progress.js';
import { initDeckBuilder, openDeckBuilder } from './deckbuilder.js';
import { initBattle, startBattle, abandonBattle, isBattleRunning } from './battle.js';
import {
  $, el, showScreen, setBackdrop, toast, openDialog, closeDialog, confirmDialog,
} from './ui.js';

let selected = null;   // the starter picked on the start screen

/* ---------- start screen ---------- */

function renderStarters() {
  const grid = $('starter-grid');
  grid.replaceChildren();

  for (const starter of STARTERS) {
    const unlocked = isStarterUnlocked(starter);
    const btn = el('button', `starter-btn type-${starter.type}`);
    btn.type = 'button';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(selected === starter));

    const img = el('img', 'pixel');
    img.src = spriteUrl(starter, 'front');
    img.alt = '';
    btn.append(img, el('span', 'starter-name', unlocked ? starter.name : '???'));

    if (!unlocked) {
      btn.classList.add('locked');
      btn.append(el('span', 'starter-lock', `🔒 ${starter.unlockAt} wins`));
    }
    if (selected === starter) btn.classList.add('selected');

    btn.addEventListener('click', () => {
      if (!unlocked) return toast(`Win ${starter.unlockAt} battles to unlock ${starter.name}.`, 'warn');
      selectStarter(starter);
    });
    grid.append(btn);
  }
}

function selectStarter(starter) {
  selected = starter;
  renderStarters();

  const type = TYPES[starter.type];
  $('detail-sprite').src = spriteUrl(starter, 'front');
  $('detail-sprite').alt = starter.name;
  $('detail-sprite').hidden = false;
  $('detail-name').textContent = `${starter.name}  ${type.icon} ${type.label}`;
  $('detail-blurb').textContent = starter.blurb;
  $('choose-btn').disabled = false;

  setBackdrop(BACKDROPS[starter.type], starter.type);
}

function renderProgress() {
  const { wins, losses, streak, bestStreak } = getSave();
  $('progress-line').textContent = wins + losses === 0
    ? 'New here? Pick a starter and build your first deck.'
    : `Wins: ${wins}   ·   Losses: ${losses}   ·   Streak: ${streak} 🔥   ·   Best streak: ${bestStreak}`;
}

/* ---------- moving between screens ---------- */

function goToMenu() {
  abandonBattle();
  selected = null;
  $('detail-sprite').hidden = true;
  $('detail-name').textContent = 'Pick a starter above';
  $('detail-blurb').textContent = 'Tap one of the three free starters to begin.';
  $('choose-btn').disabled = true;
  renderStarters();
  renderProgress();
  setBackdrop(BACKDROPS.water, '');
  showScreen('start-screen');
}

async function requestMenu() {
  if (isBattleRunning() && !(await confirmDialog('Leave this battle? Your progress in the fight will be lost.', 'Leave'))) return;
  goToMenu();
}

/* ---------- start everything ---------- */

function init() {
  initDeckBuilder(startBattle);
  initBattle({ onEditDeck: openDeckBuilder, onMenu: goToMenu });

  $('choose-btn').addEventListener('click', () => selected && openDeckBuilder(selected));

  // Buttons that are always on screen
  $('help-btn').addEventListener('click', () => openDialog('help-dialog'));
  $('howto-btn').addEventListener('click', () => openDialog('help-dialog'));
  $('about-btn').addEventListener('click', () => openDialog('about-dialog'));
  $('credits-link').addEventListener('click', () => openDialog('about-dialog'));
  $('home-btn').addEventListener('click', requestMenu);
  $('brand-btn').addEventListener('click', requestMenu);

  $('reset-btn').addEventListener('click', async () => {
    if (!(await confirmDialog('Erase all wins, unlocks and saved decks?', 'Erase'))) return;
    resetSave();
    closeDialog('about-dialog');
    goToMenu();
    toast('Saved progress erased.', 'ok');
  });

  goToMenu();

  // Show the how-to-play once, the very first time.
  if (!getSave().seenHelp) {
    updateSave(d => { d.seenHelp = true; });
    setTimeout(() => openDialog('help-dialog'), 400);
  }
}

init();
