/* ============================================================
   select.js  -  the character select, Slay the Spire-style.

   The picked Pokémon stands big on its type's scene, its name, HP,
   type, blurb and Ability in a see-through panel beside it, and every
   starter waits in a strip of portraits along the bottom, split into
   Starters and Legendaries tabs. A locked one shows as a silhouette and
   says how to get it (a Game Corner skin gets a button that opens the
   Game Corner on it). Choose goes on to the deck and level screen.
   ============================================================ */

import { STARTERS, BASE_HP, spriteUrl } from './data/starters.js';
import { ACHIEVEMENT_FOR } from './data/achievements.js';
import { TYPES } from './data/cards.js';
import { ABILITIES } from './data/relics.js';
import { spriteFit } from './data/sprite-fit.js';
import { getSave, updateSave, isShiny } from './storage.js';
import { isStarterUnlocked, isShopUnlock } from './progress.js';
import { toggleShop } from './shop.js';
import { playCry, playSound } from './audio.js';
import { showMenuScene } from './scene.js';
import { $, el, showScreen, setTheme, itemSprite, refreshCoins } from './ui.js';

const LEGENDS = (s) => s.legendary || s.secret;
const PSYCHIC = { label: 'Psychic', icon: '🔮' };   // Mewtwo's type has no cards yet, so it isn't in TYPES

let picked = null;        // the starter shown big
let tab = 'starters';
let handlers = null;      // { onChoose(starter), onBack() }

/** Called once at startup. */
export function initSelect(on) {
  handlers = on;
  $('sel-back').addEventListener('click', () => handlers.onBack());
  $('sel-go').addEventListener('click', () => {
    if (!picked || !usable(picked)) return;
    handlers.onChoose(picked);
  });
  $('sel-shiny').addEventListener('click', () => {
    const id = picked.id;
    updateSave(d => { d.shiny.on = isShiny(id) ? d.shiny.on.filter(x => x !== id) : [...d.shiny.on, id]; });
    playCry(picked.line[0].id);
    pick(picked, true);
  });
  $('sel-corner').addEventListener('click', () => toggleShop(picked.id));
  for (const btn of document.querySelectorAll('.sel-tabs .pxb')) {
    btn.addEventListener('click', () => {
      tab = btn.dataset.tab;
      const first = inTab().find(isStarterUnlocked) || inTab()[0];
      pick(inTab().includes(picked) ? picked : first, true);
    });
  }
  document.addEventListener('keydown', (e) => {
    if (document.body.dataset.screen !== 'start-screen' || document.body.classList.contains('titling')) return;
    if (document.querySelector('dialog:modal, #shop-dialog[open]')) return;
    const list = inTab(), at = list.indexOf(picked);
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) { e.preventDefault(); pick(list[(at + step + list.length) % list.length]); }
    else if (e.key === 'Enter' && !e.target.closest?.('button')) { e.preventDefault(); $('sel-go').click(); }
    else if (e.key === 'Escape') handlers.onBack();
  });
  addEventListener('resize', () => { if (document.body.dataset.screen === 'start-screen') sizeSprite(); });
}

/** Show the character select on `starter` (or the last one picked, or the first playable one). */
export function showSelect(starter = picked) {
  refreshCoins();
  showScreen('start-screen');
  const start = starter && usable(starter) ? starter : STARTERS.find(usable);   // coming back, a locked one you were looking at isn't the pick
  tab = LEGENDS(start) ? 'legends' : 'starters';
  pick(start, true);
}

/** Redraw after something changed off-screen (a Game Corner purchase, an unlock). */
export function refreshSelect() {
  if (picked) pick(picked, true);
}

export const pickedStarter = () => picked;

const inTab = () => STARTERS.filter(s => (tab === 'legends') === Boolean(LEGENDS(s)));
const usable = (s) => isStarterUnlocked(s) && !s.comingSoon;

function pick(starter, quiet = false) {
  const changed = picked !== starter;
  picked = starter;
  renderTabs();
  renderStrip();
  show(starter);
  if (changed && !quiet) playSound('stick', 'confirm');
  if (changed && isStarterUnlocked(starter)) playCry(starter.line[0].id);
}

function renderTabs() {
  for (const btn of document.querySelectorAll('.sel-tabs .pxb')) {
    const list = STARTERS.filter(s => (btn.dataset.tab === 'legends') === Boolean(LEGENDS(s)));
    const on = btn.dataset.tab === tab;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-selected', String(on));
    btn.querySelector('.pxb-i').textContent = `${btn.dataset.tab === 'legends' ? 'Legendaries' : 'Starters'} ${list.filter(isStarterUnlocked).length}/${list.length}`;
  }
}

function renderStrip() {
  const strip = $('sel-thumbs');
  strip.replaceChildren(...inTab().map(starter => {
    const unlocked = isStarterUnlocked(starter);
    const btn = el('button', `sel-thumb type-${starter.type}${unlocked ? '' : ' locked'}`);
    btn.type = 'button';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(starter === picked));
    btn.setAttribute('aria-label', unlocked ? starter.line[0].name : 'Locked');
    const img = el('img', 'pixel');
    img.src = spriteUrl(starter, 'front');
    img.alt = '';
    fitThumb(img);
    btn.append(img);
    if (!unlocked) btn.append(el('span', 'sel-lock', '🔒'));
    if (unlocked && getSave().shiny.owned.includes(starter.id)) btn.append(el('span', `sel-sparkle${isShiny(starter.id) ? ' on' : ''}`, '✨'));
    btn.addEventListener('click', () => pick(starter));
    return btn;
  }));
  strip.querySelector('[aria-checked="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function show(starter) {
  const unlocked = isStarterUnlocked(starter);
  const type = TYPES[starter.type] || PSYCHIC;
  const shop = !unlocked && isShopUnlock(starter);
  const sprite = $('sel-sprite');
  sprite.src = spriteUrl(starter, 'front');
  sprite.classList.toggle('locked', !unlocked);
  sprite.onload = sizeSprite;
  if (sprite.complete) sizeSprite();

  $('sel-name').textContent = unlocked ? starter.line[0].name : '???';
  const hp = BASE_HP + (getSave().passives.hpBoost || 0) * 5;
  $('sel-hp').textContent = `❤️ ${hp}/${hp}`;
  $('sel-type').textContent = `${type.icon} ${type.label}`;
  $('sel-type').className = `chip sel-type type-${starter.type}`;
  $('sel-blurb').textContent = unlocked ? starter.blurb
    : starter.secret ? 'Unlock every other starter to meet it.'
    : shop ? 'Trade PokéCoins for it at the Game Corner.'
    : `To unlock: ${ACHIEVEMENT_FOR[starter.id]?.text ?? 'keep playing.'}`;
  if (unlocked && starter.comingSoon) $('sel-blurb').textContent += ` Its own moves are coming soon.`;

  const ability = ABILITIES[starter.type];   // shared by every skin of the type
  $('sel-ability').hidden = !ability || !unlocked;
  if (ability) {
    const label = el('b');
    label.append(itemSprite(ability), `Ability: ${ability.name}`);
    $('sel-ability').replaceChildren(label, el('span', '', ability.text));
  }

  const owned = unlocked && getSave().shiny.owned.includes(starter.id);
  $('sel-shiny').hidden = !owned;
  $('sel-shiny').classList.toggle('on', owned && isShiny(starter.id));
  $('sel-shiny').setAttribute('aria-pressed', String(owned && isShiny(starter.id)));
  $('sel-shiny').querySelector('.pxb-i').textContent = `✨ Shiny ${isShiny(starter.id) ? 'on' : 'off'}`;
  $('sel-corner').hidden = !shop;
  $('sel-go').disabled = !usable(starter);

  document.querySelector('.select-screen').dataset.type = starter.type;
  setTheme(starter.type);
  showMenuScene(starter.type);
}

/**
 * The big sprite: every Pokémon's resting pose (SPRITE_FIT) scaled to fit the stage (its height, most of its width), in
 * whole or half steps so its pixels stay even, standing centred on its feet at the bottom of the stage.
 */
function sizeSprite() {
  const img = $('sel-sprite'), stage = img.parentElement;
  if (!img.naturalWidth || !stage.clientHeight) return;
  const [top, bottom, left, right] = spriteFit(img.src);
  const poseW = img.naturalWidth - left - right || 64, poseH = img.naturalHeight - top - bottom || 64;
  const fits = Math.min(stage.clientHeight * 0.9 / poseH, stage.clientWidth * 0.62 / poseW, 9);
  const s = Math.max(1, Math.floor(fits * 2) / 2);
  img.style.width = `${img.naturalWidth * s}px`;
  img.style.translate = `calc(-50% + ${((right - left) / 2) * s}px) ${bottom * s}px`;
}

/** A portrait: the resting pose fills the frame whatever padding its GIF has (SPRITE_FIT). */
function fitThumb(img) {
  const apply = () => {
    const [top, bottom, left, right] = spriteFit(img.src);
    const W = img.naturalWidth, H = img.naturalHeight;
    if (!W) return;
    const pose = Math.max(W - left - right, H - top - bottom) || W;
    const k = Math.min(2.2, 0.86 * Math.max(W, H) / pose);
    img.style.transform = `translate(${((right - left) / 2 / W) * 100}%, ${((bottom - top) / 2 / H) * 100}%) scale(${k.toFixed(3)})`;
  };
  img.addEventListener('load', apply, { once: true });
}
