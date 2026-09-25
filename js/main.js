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
     tips.js         tap-to-read hints (an element's title) on touch screens
   ============================================================ */

import { STARTERS, spriteUrl, stageName } from './data/starters.js';
import { ACHIEVEMENT_FOR } from './data/achievements.js';
import { TYPES } from './data/cards.js';
import { getSave, updateSave, resetSave, clearRunData } from './storage.js';
import { isStarterUnlocked, isShopUnlock } from './progress.js';
import { openPreview } from './deckpreview.js';
import { initRun, beginRun, abandonRun, isRunActive, loadSavedRun, hasSavedRun, continueRun } from './run.js';
import { initBattle } from './battle.js';
import { toggleShop } from './shop.js';
import { initAudio, playCry, playSound } from './audio.js';
import { initHowtoFx } from './fx.js';
import { initHowto, openHowto } from './howto.js';
import { showTitle } from './title.js';
import { showMenuScene } from './scene.js';
import { initTips } from './tips.js';
import { initPixelIcons } from './icons.js';
import { openStats, openAchievements } from './records.js';
import {
  $, el, showScreen, setTheme, toast, openDialog, closeDialog, confirmDialog, refreshCoins,
} from './ui.js';

let selected = null;   // the starter picked on the start screen

/* ---------- start screen ---------- */

// Only the 3 real starters always show. Everything else (the shop skins,
// the achievement-locked skins, and the legendaries) starts collapsed behind
// "Show more", however many are unlocked, so the main page stays short.
const ALWAYS_SHOWN = 3;
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
    fitSprite(img);
    btn.append(img, el('span', 'starter-name', unlocked ? starter.line[0].name : '???'));

    // a locked tile's corner badge says how to get it, without adding a line that would make the tile taller than the rest
    if (!unlocked) {
      const shop = isShopUnlock(starter);
      const badge = el('span', 'starter-source', shop ? '💰' : '🏆');
      badge.setAttribute('aria-hidden', 'true');
      btn.title = shop ? 'Trade PokéCoins for it at the Game Corner' : 'Earn it with an achievement';
      btn.classList.add('locked');
      btn.append(badge, el('span', 'sr-only', shop ? 'Locked: get it at the Game Corner' : 'Locked: earn an achievement'));
    }
    if (selected === starter) btn.classList.add('selected');

    btn.addEventListener('click', () => {
      if (unlocked) playCry(starter.line[0].id);
      if (unlocked && selected === starter) return showSheet(true);
      if (unlocked && starter.comingSoon) return toast(`✨ ${starter.line[0].name}'s own moves are coming soon!`, 'ok');
      if (unlocked) return selectStarter(starter);
      if (isShopUnlock(starter)) return toggleShop(starter.id);
      toast(`🔒 To unlock: ${ACHIEVEMENT_FOR[starter.id].text}`, 'warn');
    });
    grid.append(btn);
  });

  const moreBtn = $('starter-more-btn');
  moreBtn.textContent = showAllStarters ? 'Show fewer ▲' : `Show ${STARTERS.length - ALWAYS_SHOWN} more ▾`;
}

// The sprite GIFs pad their Pokémon with very different amounts of empty
// canvas (Totodile or Moltres fill barely half of theirs), so at one tile
// size some look tiny. Measure the visible pixels once per sprite and
// transform the image so every Pokémon fills about the same share of its
// box, feet near its bottom edge. A transform leaves the tile's layout alone.
const SPRITE_FILL = 0.88;     // the visible Pokémon's longer side, as a share of the box
const spriteFits = new Map(); // url -> transform string

function fitSprite(img) {
  const apply = () => { img.style.transform = spriteFits.get(img.src) || ''; };
  if (spriteFits.has(img.src)) return apply();
  img.addEventListener('load', () => {
    if (!spriteFits.has(img.src)) spriteFits.set(img.src, measureFit(img));
    apply();
  }, { once: true });
}

function measureFit(img) {
  const W = img.naturalWidth, H = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const alpha = g.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (alpha[(y * W + x) * 4 + 3] < 20) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return '';
  // in units of the (square) box: where object-fit: contain drew the Pokémon
  const s = 1 / Math.max(W, H);
  const ox = (1 - W * s) / 2, oy = (1 - H * s) / 2;
  const k = Math.max(1, SPRITE_FILL / (Math.max(x1 - x0 + 1, y1 - y0 + 1) * s));
  if (k < 1.05) return '';
  const cx = ox + (x0 + x1 + 1) / 2 * s, feet = oy + (y1 + 1) * s;
  const tx = 0.5 - k * cx, ty = 0.98 - k * feet;
  return `translate(${(tx * 100).toFixed(1)}%, ${(ty * 100).toFixed(1)}%) scale(${k.toFixed(3)})`;
}

function selectStarter(starter) {
  selected = starter;
  renderStarters();

  const type = TYPES[starter.type];
  $('detail-sprite').src = spriteUrl(starter, 'front');
  $('detail-sprite').alt = starter.line[0].name;
  $('detail-name').textContent = starter.line[0].name;
  $('detail-type').textContent = `${type.icon} ${type.label}`;
  $('detail-type').className = `detail-type type-${starter.type}`;
  $('detail-blurb').textContent = starter.blurb;

  setTheme(starter.type);
  showMenuScene(starter.type);
  showSheet(true);
}

/** The picked starter's panel: the page gets padding for it, so it never covers the last row of starters. */
function showSheet(open) {
  const sheet = $('starter-sheet');
  sheet.hidden = !open;
  document.body.classList.toggle('sheet-open', open);
  if (open) document.body.style.setProperty('--sheet-h', `${sheet.offsetHeight + 16}px`);
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
  showScreen('start-screen');
  setTheme(selected?.type);
  showMenuScene(selected?.type);
}

function goToMenu() {
  abandonRun();
  selected = null;
  showSheet(false);
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
  initTips();
  initHowtoFx();
  initHowto();
  initBattle();
  initRun({ onMenu: goToMenu, onNewRun: previewStarter });

  $('choose-btn').addEventListener('click', () => selected && previewStarter(selected));
  $('detail-close').addEventListener('click', () => showSheet(false));
  $('continue-btn').addEventListener('click', () => {
    const btn = $('continue-btn');
    if (!savedRun || btn.classList.contains('opening')) return;
    // the Poké Ball pops open, your Pokémon comes out with its cry, then the map loads
    btn.classList.add('opening');
    playSound('ball-open');
    const run = savedRun, still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => { btn.classList.add('out'); playCry(run.starter.line[run.stage]?.id ?? run.starter.line[0].id); }, still ? 0 : 250);
    setTimeout(() => continueRun(run), still ? 0 : 1100);
  });
  $('shop-btn').addEventListener('click', () => toggleShop());
  $('menu-shop-btn').addEventListener('click', () => toggleShop());
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
