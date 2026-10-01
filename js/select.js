/* ============================================================
   select.js  -  the character select, Slay the Spire-style.

   The picked Pokémon stands big on its type's scene, its name, HP,
   type, blurb and Ability in a see-through panel beside it, and every
   starter waits in a strip of portraits along the bottom, split into
   Starters and Legendaries tabs. A locked one shows as a silhouette and
   says how to get it (a Game Corner skin gets a button that opens the
   Game Corner on it). Choose turns the same screen into the run's
   setup, StS-style (prepare()): the panel shows the evolution line
   and a Trainer Level picker, the strip gives way to the starting
   deck fanned out, and Choose becomes Begin run.
   ============================================================ */

import { STARTERS, BASE_HP, HP_PER_STAGE, spriteUrl } from './data/starters.js';
import { ACHIEVEMENT_FOR } from './data/achievements.js';
import { TYPES, CARDS_BY_ID, STAGE_POWER } from './data/cards.js';
import { LEVELS, MAX_LEVEL } from './data/difficulty.js';
import { COIN_LEVEL_BONUS } from './data/shop.js';
import { ABILITIES } from './data/relics.js';
import { spriteFit } from './data/sprite-fit.js';
import { getSave, updateSave, isShiny } from './storage.js';
import { isStarterUnlocked, isShopUnlock } from './progress.js';
import { toggleShop } from './shop.js';
import { playCry, playSound } from './audio.js';
import { showMenuScene } from './scene.js';
import { $, el, showScreen, setTheme, itemSprite, refreshCoins, makeCard, zoomable, groupDeck } from './ui.js';

const LEGENDS = (s) => s.legendary || s.secret;
const PSYCHIC = { label: '???', icon: '' };

let picked = null;        // the starter shown big
let tab = 'starters';
let handlers = null;      // { onChoose(starter), onBack() }
let preparing = null;     // after Choose: { onBegin(level), onBack() }, else null
let level = 0;            // the Trainer Level picked for the run

/** Called once at startup. */
export function initSelect(on) {
  handlers = on;
  $('sel-back').addEventListener('click', () => (preparing ? preparing.onBack() : handlers.onBack()));
  $('sel-go').addEventListener('click', () => {
    if (!picked || !usable(picked)) return;
    if (preparing) preparing.onBegin(level);
    else handlers.onChoose(picked);
  });
  $('level-down').addEventListener('click', () => setLevel(level - 1));
  $('level-up').addEventListener('click', () => setLevel(level + 1));
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
    if (step && preparing) { e.preventDefault(); setLevel(level + step); }
    else if (step) { e.preventDefault(); pick(list[(at + step + list.length) % list.length]); }
    else if (e.key === 'Enter' && !e.target.closest?.('button, summary')) { e.preventDefault(); $('sel-go').click(); }
    else if (e.key === 'Escape') $('sel-back').click();
  });
  addEventListener('resize', () => { if (document.body.dataset.screen === 'start-screen') sizeSprite(); });
}

/** Show the character select on `starter` (or the last one picked, or the first playable one). */
export function showSelect(starter = picked) {
  refreshCoins();
  showScreen('start-screen');
  setPreparing(null);
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
const level5Wins = (s) => getSave().stats.level5WinsBy[s.id] || 0;
const winsOf = (s) => getSave().stats.winsBy[s.id] || 0;

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
    if (unlocked && level5Wins(starter)) btn.append(Object.assign(el('span', 'sel-star', '⭐'), { title: 'Won on Trainer Level 5' }));
    if (unlocked && winsOf(starter)) btn.append(Object.assign(el('span', 'sel-thumb-wins', `🏆${winsOf(starter)}`),
      { title: `${winsOf(starter)} run${winsOf(starter) > 1 ? 's' : ''} won` }));
    if (unlocked && getSave().shiny.owned.includes(starter.id)) btn.append(el('span', `sel-sparkle${isShiny(starter.id) ? ' on' : ''}`, '✨'));
    btn.addEventListener('click', () => pick(starter));
    return btn;
  }));
  strip.querySelector('[aria-checked="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

function show(starter) {
  const unlocked = isStarterUnlocked(starter);
  const hiddenType = starter.secret && !unlocked;
  const type = hiddenType ? PSYCHIC : TYPES[starter.type];
  const shop = !unlocked && isShopUnlock(starter);
  const sprite = $('sel-sprite');
  sprite.src = spriteUrl(starter, 'front');
  sprite.classList.toggle('locked', !unlocked);
  sprite.onload = sizeSprite;
  if (sprite.complete) sizeSprite();

  $('sel-name').textContent = unlocked ? starter.line[0].name : '???';
  const wins = unlocked ? level5Wins(starter) : 0;
  if (wins) $('sel-name').append(Object.assign(el('span', 'sel-name-star', '⭐'),
    { title: `Won on Trainer Level 5${wins > 1 ? ` ${wins} times` : ''}` }));
  const hp = BASE_HP + (getSave().passives.hpBoost || 0) * 5;
  $('sel-hp').textContent = `❤️ ${hp}/${hp}`;
  $('sel-type').textContent = [type.icon, type.label].filter(Boolean).join(' ');
  $('sel-type').className = `chip sel-type${hiddenType ? '' : ` type-${starter.type}`}`;
  const won = winsOf(starter);
  $('sel-wins').hidden = !unlocked;
  $('sel-wins').textContent = `🏆 ${won} ${won === 1 ? 'win' : 'wins'}`;
  $('sel-wins').classList.toggle('none', !won);
  $('sel-blurb').textContent = unlocked ? starter.blurb
    : starter.secret ? 'Unlock every other starter and win a run on Trainer Level 5 to meet it.'
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

/* ---------- Prepare: the run's setup on the same screen ---------- */

/** After Choose: the evolution line, the Trainer Level and the starting deck, then Begin run (onBegin(level)) or Back. */
export function prepare(starter, on) {
  picked = starter;
  show(starter);
  renderEvo(starter);
  renderDeck(starter);
  level = getSave().maxLevel;   // start on your highest unlocked level
  renderLevel();
  setPreparing(on);
}

function setPreparing(on) {
  preparing = on;
  const screen = document.querySelector('.select-screen');
  screen.classList.toggle('preparing', !!on);
  $('sel-prep').hidden = !on;
  $('sel-deck').hidden = !on;
  $('sel-go').querySelector('.pxb-i').textContent = on ? 'Begin run' : 'Choose';
  requestAnimationFrame(sizeSprite);   // the stage changes height with the panel
}

/** The three forms in a row, each with its HP and when it evolves. */
function renderEvo(starter) {
  const WHEN = ['Start', 'Boss 1', 'Boss 2'];
  const row = $('prep-evo');
  row.replaceChildren(...starter.line.flatMap((form, i) => {
    const box = el('div', 'prep-form');
    const img = el('img', 'pixel');
    img.src = spriteUrl(starter, 'front', i);
    img.alt = '';
    box.append(img, el('b', '', form.name), el('span', '', `${BASE_HP + i * HP_PER_STAGE} HP · ${WHEN[i]}`));
    return i ? [el('span', 'prep-arrow', '▶'), box] : [box];
  }));
  row.title = `Evolves after you defeat the Biome 1 and Biome 2 bosses: +${HP_PER_STAGE} max HP, a full heal, `
    + `and all your moves get ${STAGE_POWER * 100}% stronger.`;
}

/** The starting deck fanned along the bottom, copies stacked (Ember ×3); tap a card to read it. */
function renderDeck(starter) {
  const groups = groupDeck(starter.deck, CARDS_BY_ID);
  $('prep-deckhead').textContent = `Starting deck · ${starter.deck.length} cards`;
  $('prep-fan').style.setProperty('--n', groups.length);
  $('prep-fan').replaceChildren(...groups.map(({ card, count }, i) => {
    const node = zoomable(makeCard(card, { count }), card, 0);
    const t = i - (groups.length - 1) / 2;
    node.style.setProperty('--t', t);
    return node;
  }));
}

function setLevel(to) {
  const max = getSave().maxLevel;
  const next = Math.max(0, Math.min(max, to));
  if (next === level) return;
  level = next;
  playSound('stick', 'confirm');
  renderLevel();
}

/** The picked level: its name, the rule it adds (the full list folds away), and the coin bonus. */
function renderLevel() {
  const max = getSave().maxLevel;
  $('level-num').textContent = String(level);
  $('level-name').textContent = LEVELS[level].name;
  $('level-down').disabled = level <= 0;
  $('level-up').disabled = level >= max;
  $('level-rule').textContent = level === 0 ? LEVELS[0].text
    : `${LEVELS[level].text}${level > 1 ? ` Plus the rules of Levels 1-${level - 1}.` : ''}`;
  $('level-coins').textContent = level ? `💰 Coins +${Math.round(level * COIN_LEVEL_BONUS * 100)}%` : '';
  $('level-coins').hidden = !level;
  const rules = Array.from({ length: level }, (_, i) => el('li', '', `${i + 1}. ${LEVELS[i + 1].text}`));
  if (max < MAX_LEVEL) rules.push(el('li', 'level-locked', `🔒 Win on Level ${max} to unlock Level ${max + 1}.`));
  $('level-rules').replaceChildren(...rules);
  $('level-rules').closest('details').hidden = !rules.length;
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
