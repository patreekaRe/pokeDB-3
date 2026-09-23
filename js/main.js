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
   ============================================================ */

import { STARTERS, spriteUrl, BACKDROPS } from './data/starters.js';
import { ACHIEVEMENT_FOR } from './data/achievements.js';
import { TYPES, CARDS_BY_ID } from './data/cards.js';
import { getSave, updateSave, resetSave } from './storage.js';
import { isStarterUnlocked, isShopUnlock } from './progress.js';
import { openPreview } from './deckpreview.js';
import { initRun, beginRun, abandonRun, isRunActive } from './run.js';
import { initBattle } from './battle.js';
import { toggleShop } from './shop.js';
import { initAudio } from './audio.js';
import { initHowtoFx } from './fx.js';
import {
  $, el, makeCard, showScreen, setBackdrop, toast, openDialog, closeDialog, confirmDialog, refreshCoins,
} from './ui.js';

let selected = null;   // the starter picked on the start screen

/* ---------- start screen ---------- */

// The first 6 (the 3 real starters + the first 3 shop-bought skins) always
// show. Everything else (the rest of the shop skins, the achievement-locked
// skins, and the legendaries) collapses behind "Show more", so a fresh
// visitor sees a manageable grid, not all 18 at once.
const ALWAYS_SHOWN = 6;
let showAllStarters = false;

function renderStarters() {
  const grid = $('starter-grid');
  grid.replaceChildren();

  // If you've already unlocked or selected something in the collapsed group,
  // there's no point hiding it - expand automatically.
  const hidden = STARTERS.slice(ALWAYS_SHOWN);
  if (hidden.includes(selected) || hidden.some(isStarterUnlocked)) showAllStarters = true;

  STARTERS.forEach((starter, i) => {
    const unlocked = isStarterUnlocked(starter);
    const btn = el('button', `starter-btn type-${starter.type}`);
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
      const lockLabel = isShopUnlock(starter) ? '🔒 Shop' : starter.legendary ? '🔒 Legendary' : '🔒 Achievement';
      btn.append(el('span', 'starter-lock', lockLabel));
    }
    if (selected === starter) btn.classList.add('selected');

    btn.addEventListener('click', () => {
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
  $('choose-btn').disabled = false;

  setBackdrop(BACKDROPS[starter.type], starter.type);
}

function renderProgress() {
  const { stats, unlocked } = getSave();
  $('progress-line').textContent = stats.runsStarted === 0
    ? 'New here? Pick a starter and see its deck.'
    : `Runs won: ${stats.runsWon} of ${stats.runsStarted}   ·   Enemies defeated: ${stats.enemiesDefeated}   ·   Starters unlocked: ${3 + unlocked.length} of ${STARTERS.length}`;
}

/* ---------- moving between screens ---------- */

/** Show the start screen (keeps whichever starter you had picked). */
function showStart() {
  renderStarters();
  renderProgress();
  refreshCoins();
  if (!selected) setBackdrop(BACKDROPS.water, '');
  showScreen('start-screen');
}

function goToMenu() {
  abandonRun();
  selected = null;
  $('detail-sprite').hidden = true;
  $('detail-name').textContent = 'Pick a starter above';
  $('detail-blurb').textContent = 'Tap one of the three free starters to begin.';
  $('choose-btn').disabled = true;
  showStart();
}

/** Look at a starter's deck, and start a run from there. */
function previewStarter(starter) {
  selected = starter;
  openPreview(starter, { onBegin: (level) => beginRun(starter, level), onBack: showStart });
}

async function requestMenu() {
  if (isRunActive() && !(await confirmDialog('Abandon this run? You will lose your progress in it.', 'Abandon'))) return;
  goToMenu();
}

/* ---------- start everything ---------- */

function init() {
  initAudio();
  initHowtoFx();
  $('howto-card').append(makeCard(CARDS_BY_ID.ember, { stage: 0 }));   // a real card, so the guide always matches the game
  initBattle();
  initRun({ onMenu: goToMenu, onNewRun: previewStarter });

  $('choose-btn').addEventListener('click', () => selected && previewStarter(selected));
  $('shop-btn').addEventListener('click', () => toggleShop());
  $('starter-more-btn').addEventListener('click', () => { showAllStarters = !showAllStarters; renderStarters(); });

  // A purchase made while the shop was open over some other screen (map,
  // battle, a reward choice) should still be reflected once you're back
  // looking at the start screen - refresh it every time the dialog closes.
  $('shop-dialog').addEventListener('close', () => {
    $('shop-btn').setAttribute('aria-expanded', 'false');
    renderStarters();
    renderProgress();
  });

  // Buttons that are always on screen
  $('help-btn').addEventListener('click', () => openDialog('help-dialog'));
  $('howto-btn').addEventListener('click', () => openDialog('help-dialog'));
  $('about-btn').addEventListener('click', () => openDialog('about-dialog'));
  $('credits-link').addEventListener('click', () => openDialog('about-dialog'));
  $('brand-btn').addEventListener('click', requestMenu);

  $('reset-btn').addEventListener('click', async () => {
    if (!(await confirmDialog('Erase all stats and unlocked starters?', 'Erase'))) return;
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
