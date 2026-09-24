/* ============================================================
   main.js  -  the front door of the game.

   It builds the start screen (pick a starter), wires up the buttons
   that are always on screen, and connects the screens:

       start screen -> deck preview -> map -> battle -> rewards -> map ...
                                        (run.js is in charge of that loop)

   The other files each do one job:
     data/*.js       cards, starters, enemies, relics, achievements (plain data)
     storage.js      saving to localStorage
     progress.js     unlocking starters
     ui.js           small helpers (dialogs, toasts, card element)
     deckpreview.js  the read-only deck preview
     run.js          one run: the map loop, rewards, evolution, the end
     map.js          building and drawing the branching map
     rewards.js      the "choose one" screen
     battle.js       the fight
     records.js      the Stats and Achievements windows
     howto.js        the swipeable How to play window
     title.js        the PRESS START title screen before the start screen
   ============================================================ */

import { STARTERS, spriteUrl, stageName, BACKDROPS } from './data/starters.js';
import { ACHIEVEMENT_FOR } from './data/achievements.js';
import { TYPES } from './data/cards.js';
import { getSave, updateSave, resetSave, clearRunData } from './storage.js';
import { isStarterUnlocked, isShopUnlock } from './progress.js';
import { openPreview } from './deckpreview.js';
import { initRun, beginRun, abandonRun, isRunActive, loadSavedRun, hasSavedRun, continueRun } from './run.js';
import { initBattle } from './battle.js';
import { toggleShop } from './shop.js';
import { initAudio, playCry } from './audio.js';
import { initHowtoFx } from './fx.js';
import { initHowto, openHowto } from './howto.js';
import { showTitle } from './title.js';
import { initPixelIcons } from './icons.js';
import { openStats, openAchievements } from './records.js';
import {
  $, el, showScreen, setBackdrop, toast, openDialog, closeDialog, confirmDialog, refreshCoins,
} from './ui.js';

let selected = null;   // the starter picked on the start screen

/* ---------- start screen ---------- */

// The first 6 (the 3 real starters + the first 3 shop-bought skins) always
// show. Everything else (the rest of the shop skins, the achievement-locked
// skins, and the legendaries) starts collapsed behind "Show more", however
// many are unlocked, so the main page stays short.
const ALWAYS_SHOWN = 6;
let showAllStarters = false;

function renderStarters() {
  const grid = $('starter-grid');
  grid.replaceChildren();

  STARTERS.forEach((starter, i) => {
    const unlocked = isStarterUnlocked(starter);
    const btn = el('button', `starter-btn type-${starter.type}${starter.secret ? ' secret' : ''}`);
    btn.type = 'button';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(selected === starter));
    btn.hidden = i >= ALWAYS_SHOWN && !showAllStarters;

    const img = el('img', 'pixel');
    img.src = spriteUrl(starter, 'front');
    img.alt = '';
    btn.append(img, el('span', 'starter-name', unlocked ? starter.line[0].name : '???'));

    if (!unlocked) {
      btn.classList.add('locked');
      const lockLabel = isShopUnlock(starter) ? '🔒 Shop' : starter.secret ? '🔒 ???' : starter.legendary ? '🔒 Legendary' : '🔒 Achievement';
      btn.append(el('span', 'starter-lock', lockLabel));
    }
    if (selected === starter) btn.classList.add('selected');

    btn.addEventListener('click', () => {
      if (unlocked) playCry(starter.line[0].id);
      if (unlocked && starter.comingSoon) return toast(`✨ ${starter.line[0].name}'s own moves are coming soon!`, 'ok');
      if (unlocked && selected === starter) return showChooseButton();
      if (unlocked) return selectStarter(starter);
      if (isShopUnlock(starter)) return toggleShop(starter.id);
      toast(`🔒 To unlock: ${ACHIEVEMENT_FOR[starter.id].text}`, 'warn');
    });
    grid.append(btn);
  });

  const moreBtn = $('starter-more-btn');
  moreBtn.textContent = showAllStarters ? 'Show fewer ▲' : `Show ${STARTERS.length - ALWAYS_SHOWN} more ▾`;
}

function selectStarter(starter) {
  selected = starter;
  renderStarters();

  const type = TYPES[starter.type];
  $('detail-sprite').src = spriteUrl(starter, 'front');
  $('detail-sprite').alt = starter.line[0].name;
  $('detail-sprite').hidden = false;
  $('detail-name').textContent = `${starter.line[0].name}  ${type.icon} ${type.label}`;
  $('detail-blurb').textContent = starter.blurb;
  $('detail-text').hidden = false;
  $('choose-btn').disabled = false;

  setBackdrop(BACKDROPS[starter.type], starter.type);
}

/** Tapping the picked starter again: bring "See starting deck" into view. */
function showChooseButton() {
  const btn = $('choose-btn');
  const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  btn.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
  btn.focus({ preventScroll: true });
}

/* ---------- moving between screens ---------- */

let savedRun = null;   // a run saved from an earlier visit, offered by the Continue button

function renderContinue() {
  savedRun = loadSavedRun();
  $('continue-btn').hidden = !savedRun;
  if (!savedRun) return;
  const { starter, stage, biome, hp, maxHp, level } = savedRun;
  $('continue-btn').className = `continue-btn type-${starter.type}`;
  $('continue-sprite').src = spriteUrl(starter, 'front', stage);
  $('continue-name').textContent = stageName(starter, stage);
  $('continue-info').textContent = `Biome ${biome + 1} · ${hp}/${maxHp} HP${level ? ` · Level ${level}` : ''}`;
  const ratio = hp / maxHp;
  $('continue-hp-fill').style.width = `${ratio * 100}%`;
  $('continue-hp-fill').dataset.level = ratio > 0.6 ? 'high' : ratio > 0.3 ? 'mid' : 'low';
}

/** Show the start screen (keeps whichever starter you had picked). */
function showStart() {
  renderContinue();
  renderStarters();
  refreshCoins();
  if (!selected) setBackdrop(BACKDROPS.water, '');
  showScreen('start-screen');
}

function goToMenu() {
  abandonRun();
  selected = null;
  $('detail-sprite').hidden = true;
  $('detail-text').hidden = true;
  $('choose-btn').disabled = true;
  showStart();
}

/** Look at a starter's deck, and start a run from there. */
function previewStarter(starter) {
  selected = starter;
  openPreview(starter, {
    onBegin: async (level) => {
      if (hasSavedRun() && !(await confirmDialog('Start a new run? Your saved run will be lost.', 'Start new'))) return;
      beginRun(starter, level);
    },
    onBack: showStart,
  });
}

async function requestMenu() {
  if (isRunActive() && !(await confirmDialog('Abandon this run? You will lose your progress in it.', 'Abandon'))) return;
  goToMenu();
}

/* ---------- the Poké Ball menu (top left) ---------- */

function initBallMenu() {
  const ball = $('brand-btn');
  const panel = $('ball-menu-panel');
  const setOpen = (open) => {
    panel.hidden = !open;
    ball.setAttribute('aria-expanded', String(open));
  };

  ball.addEventListener('click', () => setOpen(panel.hidden));
  $('home-btn').addEventListener('click', requestMenu);

  // picking an item closes the menu, except Sound, so you can see it switch on/off
  panel.addEventListener('click', (e) => {
    const item = e.target.closest('.menu-item');
    if (item && item.id !== 'music-btn') setOpen(false);
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
  initAudio();
  initHowtoFx();
  initHowto();
  initBattle();
  initRun({ onMenu: goToMenu, onNewRun: previewStarter });

  $('choose-btn').addEventListener('click', () => selected && previewStarter(selected));
  $('continue-btn').addEventListener('click', () => {
    const btn = $('continue-btn');
    if (!savedRun || btn.classList.contains('opening')) return;
    btn.classList.add('opening');   // the Poké Ball pops open, then the map loads
    const wait = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450;
    setTimeout(() => continueRun(savedRun), wait);
  });
  $('shop-btn').addEventListener('click', () => toggleShop());
  $('starter-more-btn').addEventListener('click', () => { showAllStarters = !showAllStarters; renderStarters(); });

  // A purchase made while the shop was open over some other screen (map,
  // battle, a reward choice) should still be reflected once you're back
  // looking at the start screen - refresh it every time the dialog closes.
  $('shop-dialog').addEventListener('close', () => {
    $('shop-btn').setAttribute('aria-expanded', 'false');
    renderStarters();
  });

  // Buttons that are always on screen
  $('help-btn').addEventListener('click', openHowto);
  $('howto-btn').addEventListener('click', openHowto);
  $('about-btn').addEventListener('click', () => openDialog('about-dialog'));
  $('credits-link').addEventListener('click', () => openDialog('about-dialog'));
  $('stats-btn').addEventListener('click', openStats);
  $('achievements-btn').addEventListener('click', openAchievements);
  initBallMenu();

  $('reset-btn').addEventListener('click', async () => {
    if (!(await confirmDialog('Erase all stats and unlocked starters?', 'Erase'))) return;
    resetSave();
    clearRunData();
    closeDialog('about-dialog');
    goToMenu();
    toast('Saved progress erased.', 'ok');
  });

  goToMenu();

  showTitle().then(() => {
    // the logo's bounce-in already ran behind the title screen: play it again now it can be seen
    const logo = document.querySelector('#start-screen .title');
    logo.replaceWith(logo.cloneNode(true));

    // Show the how-to-play once, the very first time.
    if (!getSave().seenHelp) {
      updateSave(d => { d.seenHelp = true; });
      setTimeout(openHowto, 400);
    }
  });
}

init();
