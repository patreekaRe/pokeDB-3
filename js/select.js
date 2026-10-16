/* ============================================================
   select.js  -  the character select, Slay the Spire-style.

   The Pokédex device (the user's call, 2026-10-07, like the Sky
   Pillar's lobby): the picked Pokémon stands big in a window onto its
   type's scene, its name, HP, type, blurb and Ability on a green LCD
   under it, and every starter waits in a strip of portraits on a dark
   screen, split by the Starters and Legendaries keys. A locked one shows as a silhouette and
   says how to get it (a Game Corner skin gets a button that opens the
   Game Corner on it). Choose turns the same screen into the run's
   setup, StS-style (prepare()): the panel shows the evolution line
   and a Trainer Level picker, the strip gives way to the starting
   deck fanned out, and A's Choose becomes Begin.
   ============================================================ */

import { STARTERS, BASE_HP, HP_PER_STAGE, spriteUrl } from './data/starters.js';
import { ACHIEVEMENT_FOR } from './data/achievements.js';
import { TYPES, CARDS_BY_ID, STAGE_POWER } from './data/cards.js';
import { LEVELS, MAX_LEVEL, MEWTWO_MODE, isMewtwoRun } from './data/difficulty.js';
import { sealOn, shardsPlaced } from './data/towns.js';
import { strengthOf } from './data/camp.js';
import { COIN_LEVEL_BONUS } from './data/shop.js';
import { ABILITIES } from './data/relics.js';
import { spriteFit, bodyX } from './data/sprite-fit.js';
import { getSave, updateSave, isShiny } from './storage.js';
import { workshopOf, packable, RECIPES_BY_ID } from './data/workshop.js';
import { isStarterUnlocked, isShopUnlock } from './progress.js';
import { aimCorner } from './shop.js';
import { openDeviceApp } from './collection.js';
import { playCry, playSound } from './audio.js';
import { showMenuScene } from './scene.js';
import { selectSky } from './select-sky.js';
import { smoothIcon } from './smooth-icons.js';
import { $, el, showScreen, setTheme, itemSprite, refreshCoins, makeCard, zoomable, groupDeck } from './ui.js';
import { HELD_BY_ID, POUCH } from './data/held.js';

const LEGENDS = (s) => s.legendary || s.secret;
const PSYCHIC = { label: '???', icon: '' };
const LEGEND_POSE = 66;

let picked = null;        // the starter shown big
let tab = 'starters';
let handlers = null;      // { onChoose(starter), onBack() }
let preparing = null;     // after Choose: { onBegin(level), onBack() }, else null
let level = 0;            // the Trainer Level picked for the run
let pouch = [];           // the Berry Pouch to set out with: held berry recipe ids (js/data/workshop.js), the first held
let pack = null;          // the run kit item to set out with (a recipe id), or none

/** Called once at startup. */
export function initSelect(on) {
  handlers = on;
  for (const node of document.querySelectorAll('#start-screen [data-icon]')) node.append(smoothIcon(node.dataset.icon));
  $('sel-back').addEventListener('click', () => (preparing ? preparing.onBack() : handlers.onBack()));
  $('sel-go').addEventListener('click', () => {
    if (!picked || !usable(picked)) return;
    if (preparing) preparing.onBegin(level, packed());
    else handlers.onChoose(picked);
  });
  $('level-down').addEventListener('click', () => setLevel(level - 1));
  $('level-up').addEventListener('click', () => setLevel(level + 1));
  $('pack-down').addEventListener('click', () => stepPack(-1));
  $('pack-up').addEventListener('click', () => stepPack(1));
  $('sel-shiny').addEventListener('click', () => {
    const id = picked.id;
    updateSave(d => { d.shiny.on = isShiny(id) ? d.shiny.on.filter(x => x !== id) : [...d.shiny.on, id]; });
    playCry(picked.line[0].id);
    pick(picked, true);
  });
  // the Game Corner takes over the screen as the Pokédex's app, on this skin; a skin bought there shows once it shuts
  $('sel-corner').addEventListener('click', () => {
    aimCorner(picked.id);
    openDeviceApp('corner', undefined, false, refreshSelect);
  });
  for (const btn of document.querySelectorAll('.sel-tabs .mdex-btn')) {
    btn.addEventListener('click', () => {
      if (preparing) return;
      tab = btn.dataset.tab;
      const first = inTab().find(isStarterUnlocked) || inTab()[0];
      pick(inTab().includes(picked) ? picked : first, true);
    });
  }
  document.addEventListener('keydown', (e) => {
    if (document.body.dataset.screen !== 'start-screen' || document.body.classList.contains('titling')) return;
    if (document.querySelector('dialog:modal, #shop-dialog[open]') || !$('collection-screen').hidden) return;
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
  for (const btn of document.querySelectorAll('.sel-tabs .mdex-btn')) {
    const list = STARTERS.filter(s => (btn.dataset.tab === 'legends') === Boolean(LEGENDS(s)));
    const on = btn.dataset.tab === tab;
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-selected', String(on));
    const count = `${list.filter(isStarterUnlocked).length}/${list.length}`;
    btn.querySelector('.mdex-count').textContent = count;
    if (on) $('sel-sub').textContent = `${btn.dataset.tab === 'legends' ? 'Legendaries' : 'Starters'} ${count}`;
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
    : starter.secret ? 'Something sleeps far beneath the wastes, behind a sealed gate. Win runs to reach it.'
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
  $('sel-shiny').textContent = `✨ Shiny ${isShiny(starter.id) ? 'on' : 'off'}`;
  $('sel-corner').hidden = !shop;
  $('sel-go').disabled = !usable(starter);

  document.querySelector('.select-screen').dataset.type = starter.type;
  setTheme(starter.type);
  showMenuScene(starter.type);
  selectSky(starter.type);
}

/* ---------- Prepare: the run's setup on the same screen ---------- */

/** After Choose: the evolution line, the Trainer Level and the starting deck, then Begin run (onBegin(level)) or Back. */
export function prepare(starter, on) {
  picked = starter;
  show(starter);
  renderEvo(starter);
  renderDeck(starter);
  level = isMewtwoRun(starter) ? 0 : getSave().maxLevel;   // start on your highest unlocked level
  renderLevel();
  pack = null;
  pouch = [];
  renderPack();
  setPreparing(on);
}

/* Pack (2026-10-15, the user's asks): what Kurt's Workshop has made you to keep (`save.workshop.kit`), shown only when
   something's kept: a Berry Pouch of up to POUCH held berries (tap a kept one to add it, a slot to take it out; the first is
   held as you set out, the rest go on one a biome from the Bag) and one run kit item for the Bag (◀ ▶). They're taken
   from the counts as the run begins (js/run.js's beginRun()). */
const keptOf = (kind) => packable(workshopOf(getSave())).filter(o => o.recipe.kind === kind);
const leftOf = (o) => o.n - pouch.filter(id => id === o.recipe.id).length;
const packed = () => ({ berries: [...pouch], item: keptOf('kit').some(o => o.recipe.id === pack) ? pack : null });
function stepPack(step) {
  const list = [null, ...keptOf('kit').map(o => o.recipe.id)];
  pack = list[(list.indexOf(pack) + step + list.length) % list.length];
  playSound('stick', 'confirm');
  renderPack();
}
function pouchAdd(id) {
  if (pouch.length >= POUCH) return;
  pouch.push(id);
  playSound('stick', 'confirm');
  renderPack();
}
function pouchTake(i) {
  pouch.splice(i, 1);
  playSound('cancel');
  renderPack();
}
function renderPack() {
  const berries = keptOf('held'), kits = keptOf('kit');
  $('prep-pack').hidden = !berries.length && !kits.length;
  $('pack-pouch').hidden = !berries.length;
  $('pack-kit').hidden = !kits.length;
  const room = Object.fromEntries(berries.map(o => [o.recipe.id, o.n]));
  pouch = pouch.filter(id => room[id]-- > 0);
  $('pouch-slots').replaceChildren(...Array.from({ length: POUCH }, (_, i) => {
    const h = HELD_BY_ID[RECIPES_BY_ID[pouch[i]]?.makes];
    const slot = el('button', `pouch-slot${h ? ' full' : ''}${i === 0 ? ' first' : ''}`);
    slot.type = 'button';
    slot.disabled = !h;
    slot.setAttribute('aria-label', h ? `Biome ${i + 1}: take the ${h.name} out` : `Biome ${i + 1}: empty`);
    if (h) { slot.append(itemSprite(h, 'pack-ico')); slot.addEventListener('click', () => pouchTake(i)); }
    const cell = el('div', 'pouch-cell');
    cell.append(slot, el('small', '', `Biome ${i + 1}`));
    return cell;
  }));
  $('pouch-kept').replaceChildren(...berries.map(o => {
    const h = HELD_BY_ID[o.recipe.makes], left = leftOf(o);
    const chip = el('button', 'pouch-chip');
    chip.type = 'button';
    chip.disabled = !left || pouch.length >= POUCH;
    chip.setAttribute('aria-label', `Pack ${h.name} (${left} left)`);
    chip.append(itemSprite(h, 'pack-ico'), el('span', '', `×${left}`));
    chip.addEventListener('click', () => pouchAdd(o.recipe.id));
    return chip;
  }));
  $('pouch-rule').textContent = pouch.length ? 'One berry a biome, eaten by itself when it\'s needed. Tap a slot to take it out.'
    : 'Tap a berry to pack it, one for each biome.';

  if (!kits.some(o => o.recipe.id === pack)) pack = null;
  const o = kits.find(k => k.recipe.id === pack), pick = $('pack-pick');
  if (!o) {
    pick.replaceChildren(el('span', 'pack-none', 'Nothing'));
    $('pack-rule').textContent = 'Pick one item from Kurt\'s Workshop to start the run in your Bag.';
    return;
  }
  const r = o.recipe;
  pick.replaceChildren(itemSprite({ id: r.sprite, icon: '' }, 'pack-ico'), el('span', 'pack-name', r.name));
  $('pack-rule').textContent = `Takes 1 of your ${o.n}. Starts in your Bag: ${r.text}`;
}

function setPreparing(on) {
  preparing = on;
  const screen = document.querySelector('.select-screen');
  screen.classList.toggle('preparing', !!on);
  $('sel-prep').hidden = !on;
  $('sel-deck').hidden = !on;
  $('sel-go-label').textContent = on ? 'Begin' : 'Choose';
  $('sel-title').textContent = on ? 'Prepare' : 'Choose';
  if (on) $('sel-sub').textContent = picked.line[0].name;
  else renderTabs();
  for (const key of document.querySelectorAll('.sel-tabs .mdex-btn')) key.disabled = !!on;
  $('sel-info').scrollTop = 0;
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
  if (isMewtwoRun(picked)) return;
  const max = getSave().maxLevel;
  const next = Math.max(0, Math.min(max, to));
  if (next === level) return;
  level = next;
  playSound('stick', 'confirm');
  renderLevel();
}

/** The picked level: its name, the rule it adds (the full list folds away), and the coin bonus. */
function renderLevel() {
  // Mewtwo's run is its own game mode with one fixed setting: no Level picker, its rules, coins or "All rules"
  const own = isMewtwoRun(picked);
  document.querySelector('.prep-level').hidden = own;
  if (own) {
    $('level-name').textContent = 'Mewtwo\'s own run';
    $('level-rule').textContent = `No Trainer Level. Biomes 1-3 are a speedrun, one road each (${MEWTWO_MODE.floors[0].length} rooms and a boss) where its attacks hit 25% harder and nothing counts for Pokédex research, then a fourth biome only Mewtwo can enter.${!sealOn() ? '' : strengthOf(shardsPlaced(getSave())) < 100
      ? ` There its Sealed Weakness holds it to ${strengthOf(shardsPlaced(getSave()))}% of its damage: every town Waystone mended gives some back.`
      : ' Every town Waystone is lit: it goes down at full strength.'}`;
    $('level-coins').hidden = true;
    $('level-rules').closest('details').hidden = true;
    return;
  }
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
  let fits = Math.min(stage.clientHeight * 0.62 / poseH, stage.clientWidth * 0.5 / poseW, 7);
  // legendaries share one scale (that of a LEGEND_POSE-tall pose), so the little ones (Celebi, Victini, Manaphy) stand
  // small beside Lugia instead of being blown up to fill the stage
  if (picked && LEGENDS(picked)) fits = Math.min(fits, stage.clientHeight * 0.62 / LEGEND_POSE);
  const s = Math.max(1, Math.floor(fits * 2) / 2);
  img.style.width = `${img.naturalWidth * s}px`;
  img.style.translate = `calc(-50% + ${((right - left) / 2 - bodyX(img.src)) * s}px) ${bottom * s}px`;
}

/** A portrait: the resting pose fills the frame whatever padding its GIF has (SPRITE_FIT). */
function fitThumb(img) {
  const apply = () => {
    const [top, bottom, left, right] = spriteFit(img.src);
    const W = img.naturalWidth, H = img.naturalHeight;
    if (!W) return;
    const pose = Math.max(W - left - right, H - top - bottom) || W;
    const k = Math.min(2.2, 0.86 * Math.max(W, H) / pose);
    img.style.transform = `translate(${(((right - left) / 2 - bodyX(img.src)) / W) * 100}%, ${((bottom - top) / 2 / H) * 100}%) scale(${k.toFixed(3)})`;
  };
  img.addEventListener('load', apply, { once: true });
}
