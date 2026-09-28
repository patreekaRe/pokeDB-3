/* ============================================================
   run.js  -  one attempt at the game, from the first fight to the
   last boss (or until you faint).

   A run goes like this:

       pick a starter -> preview the fixed deck -> Biome 1 map
         -> walk the map: fights, elites, rest sites, treasure, Poké Marts, ? events
         -> boss -> (evolve!) -> Biome 2 map -> boss -> evolve
         -> Biome 3 map -> final boss -> you win

   Everything about the current run lives in one object, `run`:
     starter, stage (0-2 evolution), hp, maxHp, biome (0-2),
     deck (list of card ids), relics (list of relic ids), map, ...
   ============================================================ */

import { BIOMES, buildEncounter, pickEnemyId, ENEMY_DEFS } from './data/enemies.js';
import { spriteFit } from './data/sprite-fit.js';
import { BASE_HP, HP_PER_STAGE, STARTERS_BY_ID, RENAMED_STARTERS, spriteUrl, stageName } from './data/starters.js';
import { STAGE_POWER, CARDS_BY_ID, MAX_COPIES, poolForType, baseId, upgradeId, canUpgrade } from './data/cards.js';
import { RELICS, RELICS_BY_ID, ABILITIES } from './data/relics.js';
import { ITEMS_BY_ID, ITEM_SLOTS, ITEM_DROP } from './data/items.js';
import { getSave, updateSave, awardCoins, coinsWithBonus, saveRunData, loadRunData, clearRunData, markSeen, perkLevel } from './storage.js';
import { MART_DISCOUNT, REWARD_CARDS, COIN_LEVEL_BONUS } from './data/shop.js';
import { modsFor, MAX_LEVEL, LEVELS } from './data/difficulty.js';
import { EVENTS, EVENTS_BY_ID, NPCS } from './data/events.js';
import { PRIZE_MONEY, MART_CARD_PRICES, MART_RELIC_PRICES, MART_ITEM_PRICES, MART_JITTER, MART_REMOVAL, MART_STOCK } from './data/mart.js';
import { checkAchievements } from './progress.js';
import { generateMap, renderMap, scopeable } from './map.js';
import { startBattle, abandonBattle, pickItem, isBattleRunning } from './battle.js';
import { cardChoices, relicChoices, evolutionChoices, itemChoices, showChoice, showChoiceHp, trackHp, sayLines, tell, showNotes, dropNotes, cardOption, relicOption, itemOption } from './rewards.js';
import { showDeckDialog } from './deckpreview.js';
import { $, el, makeCard, groupDeck, showScreen, setTheme, openDialog, closeDialog, refreshCoins, setMoney, sleep, setHpBar, itemSprite } from './ui.js';
import { playMusic, playSound, preloadSounds, playCry } from './audio.js';
import { showScene, showPlaceScene, healAtCenter, flashCenter, centerSpots, martProps, treasureSpots, treasureChest, itemBallArt, eventSpots, sceneAct } from './scene.js';
import { battleWipe } from './transition.js';
import { dexSeen, dexDefeated, dexWeight, hasDexPerk } from './pokedex.js';
import { DEX_START_MONEY, DEX_COMPLETE_COINS, SCOPE, SCOPE_REVEALS } from './data/pokedex.js';

let run = null;

export const isRunActive = () => run !== null && !run.over;

/** The biome the run in progress is in (the Pokédex opens on its page), or undefined. */
export const runBiome = () => (isRunActive() ? run.biome : undefined);

/* ============================================================
   PokéCoins  -  see js/data/shop.js for what they buy.
   ============================================================ */
export const COIN_REWARDS = { fight: 3, elite: 12, boss: 30, winBonus: 50 };

/** A coin reward at the run's Trainer Level (COIN_LEVEL_BONUS a level), before the Coin Finder. */
const levelCoins = (amount) => Math.round(amount * (1 + COIN_LEVEL_BONUS * run.level));

/** How many items the Bag holds: the Game Corner's Bag Pocket adds one. */
const itemSlots = () => ITEM_SLOTS + (perkLevel('bagPocket') ? 1 : 0);

/** A Poké Mart price after the Game Corner's Mart Card (read at the counter, so buying it mid-run counts at once). */
const martPrice = (price) => Math.round(price * (1 - MART_DISCOUNT[perkLevel('martCard')]));

/** Pick one random relic for the Starting Relic Charm passive (a common or uncommon one: rare and boss relics are meant to be found; Cleanse Tag only works when picked up). */
function randomStartingRelic() {
  const pool = RELICS.filter(r => r.rarity !== 'rare' && !r.boss && r.id !== 'cleanse-tag' && (!r.only || r.only === run.starter.type));
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Called once at startup. */
export function initRun({ onMenu, onNewRun }) {
  $('run-deck-btn').addEventListener('click', () => run && showDeckDialog(run));
  initBag();
  trackHp(() => run);
  initScope();

  $('result-menu').addEventListener('click',  () => { closeDialog('result-dialog'); onMenu(); });
  $('result-again').addEventListener('click', () => { closeDialog('result-dialog'); onNewRun(run.starter); });

  // These pop-ups move the game along, so Escape must not just close them.
  for (const id of ['result-dialog', 'evolve-dialog']) {
    $(id).addEventListener('cancel', (e) => e.preventDefault());
  }
}

/** Throw away the current run (used when you go back to the menu). */
/** Back to the menu keeping the save: Continue picks the run up from its last map checkpoint. */
export function suspendRun() {
  abandonBattle();
  run = null;
}

export function abandonRun() {
  abandonBattle();
  if (run) clearRunData();
  run = null;
}

/* ============================================================
   SAVED RUNS  -  a checkpoint is written every time the map is shown,
   so a refresh puts you back on the map before the room you were in.
   Everything is stored by id and rebuilt from the data files on load.
   ============================================================ */

const RUN_SAVE_VERSION = 8;

function checkpoint() {
  const { floors, byId } = run.map;
  saveRunData({
    version: RUN_SAVE_VERSION,
    starter: run.starter.id,
    level: run.level,
    levelUnlocked: run.levelUnlocked,
    stage: run.stage,
    hp: run.hp,
    maxHp: run.maxHp,
    biome: run.biome,
    deck: run.deck,
    relics: run.relics,
    items: run.items,
    itemChance: run.itemChance,
    map: { nodes: Object.values(byId), floors: floors.map(row => row.map(node => node.id)) },
    current: run.current,
    restCount: run.restCount,
    fights: run.fights,
    money: run.money,
    removals: run.removals,
    rarePity: run.rarePity,
    rerollBiome: run.rerollBiome,
    tutorLeft: run.tutorLeft,
    dexComplete: run.dexComplete,
    unlocks: run.unlocks.map(s => s.id),
  });
}

function restoreRun(saved) {
  if (saved.version !== RUN_SAVE_VERSION) throw new Error('old run save');
  const starterById = (id) => STARTERS_BY_ID[RENAMED_STARTERS[id] || id];
  const starter = starterById(saved.starter);
  const known = (ids, table) => ids.every(id => table[id]);
  if (!starter || !BIOMES[saved.biome] || !starter.line[saved.stage] || !(saved.hp > 0) || !(saved.money >= 0)
      || !known(saved.deck, CARDS_BY_ID) || !known(saved.relics, RELICS_BY_ID) || !known(saved.items, ITEMS_BY_ID) || !(saved.itemChance >= 0)
      || !saved.unlocks.every(starterById)) {
    throw new Error('bad run save');
  }

  // floors and byId must hold the same node objects, or visiting a room wouldn't show on the map
  const byId = Object.fromEntries(saved.map.nodes.map(node => [node.id, node]));
  const floors = saved.map.floors.map(row => row.map(id => byId[id]));
  const nodes = Object.values(byId);
  if (!byId.boss || floors.flat().some(n => !n) || (saved.current && !byId[saved.current])
      || nodes.some(n => [...n.next, ...n.prev].some(id => !byId[id]) || (n.enemyId && !ENEMY_DEFS[n.enemyId])
        || (n.event && !(EVENTS_BY_ID[n.event.id] && (!n.event.enemyId || ENEMY_DEFS[n.event.enemyId]) && eventIdsKnown(n.event)))
        || (n.stock && !(known(n.stock.cards.map(i => i.id), CARDS_BY_ID) && known(n.stock.relics.map(i => i.id), RELICS_BY_ID) && known(n.stock.items.map(i => i.id), ITEMS_BY_ID))))) {
    throw new Error('bad run map');
  }

  return {
    ...saved,
    starter,
    mods: modsFor(saved.level),
    map: { floors, boss: byId.boss, byId },
    unlocks: saved.unlocks.map(starterById),
    over: false,
  };
}

/** The saved run, rebuilt and ready to play, or null. A save that can't be restored is thrown away. */
export function loadSavedRun() {
  const saved = loadRunData();
  if (!saved) return null;
  try { return restoreRun(saved); }
  catch (err) { clearRunData(); return null; }
}

export const hasSavedRun = () => loadSavedRun() !== null;

/** Pick a saved run (from loadSavedRun) back up on its map. */
export function continueRun(saved) {
  run = saved;
  showMap();
}

/** Start a brand new run with a starter, at a Trainer Level (0 = the normal game). */
export function beginRun(starter, level = 0) {
  dropNotes();
  const passives = getSave().passives;
  const startHp = BASE_HP + passives.hpBoost * 5;   // shop passive: Max HP Boost

  run = {
    starter,
    level,
    mods: modsFor(level),   // the rules of this Trainer Level
    levelUnlocked: null,    // set if winning this run unlocks the next level
    stage: 0,
    maxHp: startHp,
    hp: startHp,
    biome: 0,
    deck: [...starter.deck],
    relics: [],
    items: [],             // one-use items in the Bag (ids), at most ITEM_SLOTS
    itemChance: ITEM_DROP.base,   // chance of an item after the next won fight
    map: null,
    current: null,        // id of the map node you are standing on
    restCount: 0,          // how many rest sites you've used this run (for an achievement)
    fights: 0,
    money: 0,              // Pokédollars: prize money for the Poké Mart, lost when the run ends
    removals: 0,           // moves forgotten at a Poké Mart this run (each one costs more)
    rarePity: 0,           // extra rare weight on the next card reward (RARE_PITY in rewards.js)
    rerollBiome: -1,       // the biome whose card reroll (Pokédex perk Oak's Advice) was used
    tutorLeft: perkLevel('tutorNotes'),   // starting moves still to PP Up (Game Corner perk Move Tutor Notes)
    unlocks: [],          // starters unlocked during this run
    pendingCoins: null,    // { foe, coins, money } won in the last fight, paid out when its rewards end
    over: false,
  };

  if (passives.relicCharm) {                         // shop passive: Starting Relic Charm
    const relic = randomStartingRelic();
    if (relic) { run.relics.push(relic.id); markSeen('relics', relic.id); tell(`Starting relic: ${relic.name}!`); }
  }

  // Pokédex perks, earned by completing a biome's page
  if (hasDexPerk('moms-savings')) { run.money += DEX_START_MONEY; tell(`Mom's Savings: you set out with ₽${DEX_START_MONEY}!`); }
  if (hasDexPerk('chansey-gift')) { run.items.push('potion'); markSeen('items', 'potion'); tell('Chansey\'s Gift: a Potion is in your Bag!'); }

  updateSave(d => { d.stats.runsStarted += 1; });
  startBiome();
}

/* ============================================================
   THE MAP
   ============================================================ */

function startBiome() {
  const biome = BIOMES[run.biome];
  run.map = generateMap();
  // Decide now who waits in every fight room: the map scouts elites and bosses, and a refresh can't reroll a fight.
  for (const node of Object.values(run.map.byId)) {
    if (['fight', 'elite', 'boss'].includes(node.type)) node.enemyId = pickEnemyId(run.biome, node.type, dexWeight);
    if (node.type === 'shop') node.stock = martStock();
  }
  rollEvents();
  run.current = null;
  showMap();
}

function showMap() {
  const biome = BIOMES[run.biome];
  scoping = false;
  setTheme(run.starter.type);
  preloadSounds('event', 'buy', 'item', 'potion', 'item-get', 'coins', 'door', 'achievement', 'bag', 'run-away');

  $('run-sprite').src = spriteUrl(run.starter, 'front', run.stage);
  $('run-sprite').alt = stageName(run.starter, run.stage);
  $('run-sprite').dataset.stage = String(run.stage);
  $('run-title').textContent = stageName(run.starter, run.stage);
  // The sign drops in like the games' location sign, but only when you arrive in a new biome.
  const sign = $('biome-name');
  if (sign.textContent !== biome.name) {
    sign.textContent = biome.name;
    sign.dataset.biome = biome.id;
    sign.classList.remove('arrive');
    void sign.offsetWidth;
    sign.classList.add('arrive');
  }
  $('run-deck-count').textContent = String(run.deck.length);
  $('run-relic-count').textContent = String(run.relics.length);
  $('bag-deck-text').textContent = `${run.deck.length} cards. Every card you win joins it for the rest of the run.`;
  $('run-level').hidden = run.level === 0;
  $('run-level').textContent = `Level ${run.level}`;

  setHpBar('run', run.hp, run.maxHp);
  setMoney(run.money);
  const ability = ABILITIES[run.starter.type];
  $('run-ability').hidden = !ability;
  if (ability) {
    $('run-ability').replaceChildren(itemSprite(ability), `Ability: ${ability.name}`);
    $('run-ability').title = `Ability: ${ability.name}. ${ability.text}`;
  }

  renderRelicList();
  renderItemList();
  closeBag(true);
  checkpoint();
  drawMap();
  showScreen('map-screen');
  document.querySelector('.map-trainer')?.scrollIntoView({ block: 'nearest' });   // on wide screens the map is taller than the screen
  showScene(biome.id);
  playMusic(`map${run.biome + 1}`);
  if (run.tutorLeft > 0) return tutorNotes();
  showNotes();
}

/** Move Tutor Notes (a Game Corner perk, Neow's "upgrade a card"): before the first room, PP Up starting moves.
    It's asked on the map, after the checkpoint, and `tutorLeft` is saved, so a refresh asks again. */
function tutorNotes() {
  const left = run.tutorLeft;
  upgradeMove(() => { run.tutorLeft = 0; showMap(); }, () => { run.tutorLeft -= 1; showMap(); }, {
    title: 'Move Tutor Notes',
    sub: [`Your Move Tutor Notes! Pick a move to PP Up before you set out${left > 1 ? ` (${left} to go)` : ''}.`, 'Tap one to see it upgraded.'],
    skipLabel: 'Skip',
  });
}

/* The Bag: one drop-down with a pocket each for your deck, relics and the map key, like the Gold/Silver Bag.
   The tabs pick a pocket, and the arrows flip through them in order. */
const POCKETS = ['deck', 'relics', 'items', 'key'];
let pocket = 'relics';

function initBag() {
  $('bag-btn').addEventListener('click', () => ($('bag').hidden ? openBag() : closeBag()));
  for (const tab of document.querySelectorAll('.bag-pocket')) {
    tab.addEventListener('click', () => showPocket(tab.dataset.pocket));
  }
  const flip = (step) => showPocket(POCKETS[(POCKETS.indexOf(pocket) + step + POCKETS.length) % POCKETS.length]);
  $('bag-prev').addEventListener('click', () => flip(-1));
  $('bag-next').addEventListener('click', () => flip(1));
  document.addEventListener('click', (e) => { if (!e.target.closest('#bag-btn, #bag')) closeBag(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBag();
    if ($('bag').hidden) return;
    if (e.key === 'ArrowLeft') flip(-1);
    if (e.key === 'ArrowRight') flip(1);
  });
}

function openBag() {
  playSound('bag');
  renderItemList();   // items can be used up in battle, so this pocket is redrawn each time
  $('bag').hidden = false;
  $('bag-btn').setAttribute('aria-expanded', 'true');
  showPocket(pocket);
}

function closeBag(quiet = false) {
  if (!quiet && !$('bag').hidden) playSound('bag');   // closing sounds just like opening (the user's call)
  $('bag').hidden = true;
  $('bag-btn').setAttribute('aria-expanded', 'false');
}

function showPocket(name) {
  pocket = name;
  for (const tab of document.querySelectorAll('.bag-pocket')) {
    const on = tab.dataset.pocket === name;
    tab.setAttribute('aria-selected', String(on));
    $(tab.getAttribute('aria-controls')).hidden = !on;
    if (on) $('bag-title').textContent = tab.dataset.name;
  }
}

function renderRelicList() {
  const row = (relic, label = relic.name) => {
    const li = el('div', 'howto-li');
    const text = el('span', 'howto-li-text');
    text.append(el('b', '', label), el('small', '', relic.text));
    li.append(itemSprite(relic, 'howto-node'), text);
    return li;
  };
  const ability = ABILITIES[run.starter.type];   // the starter's own, always first (StS's starter relic)
  const rows = run.relics.map(id => row(RELICS_BY_ID[id]));
  $('relics-list').replaceChildren(...(ability ? [row(ability, `Ability: ${ability.name}`)] : []),
    ...(rows.length ? rows : [el('p', 'drop-empty', 'No relics yet. Beat an elite or open a treasure to find one.')]));
}

/* The Items pocket: in battle, Use picks the item like a slot does (with the same confirm step); on the map only heals can be used.
   Items can't be used or tossed on the reward screens, where a change would be saved with the next checkpoint half-way through the rewards,
   except tossing in the Poké Mart, to make room for one you want to buy (saved with the purchases, when you leave). */
function renderItemList() {
  if (!run) return;
  const screen = document.body.dataset.screen;
  const inBattle = screen === 'battle-screen' && isBattleRunning();
  const onMap = screen === 'map-screen';
  const inMart = screen === 'reward-screen' && $('reward-options').classList.contains('mart-window');
  const rows = run.items.map((id, index) => {
    const item = ITEMS_BY_ID[id];
    const row = el('div', 'howto-li item-row');
    const text = el('span', 'howto-li-text');
    text.append(el('b', '', item.name), el('small', '', item.text));
    const actions = el('span', 'item-actions');
    const use = el('button', 'btn item-use', 'Use');
    use.type = 'button';
    use.disabled = !(inBattle || (onMap && item.map && (item.effects.maxHp || run.hp < run.maxHp)));
    use.addEventListener('click', () => {
      if (inBattle) { closeBag(true); return pickItem(index); }
      useItemOnMap(index);
    });
    const toss = el('button', 'btn item-toss', 'Toss');
    toss.type = 'button';
    toss.disabled = !onMap && !inMart;
    toss.addEventListener('click', () => {
      run.items.splice(index, 1);
      tell(`Tossed the ${item.name}.`);
      if (inMart) { renderItemList(); return martRoom(); }
      afterBagChange();
    });
    actions.append(use, toss);
    row.append(itemSprite(item, 'howto-node'), text, actions);
    return row;
  });
  $('items-list').replaceChildren(...(rows.length ? rows : [el('p', 'drop-empty', 'No items yet. Win fights or visit a Poké Mart to find some.')]));
  $('run-item-count').textContent = `${run.items.length}/${itemSlots()}`;
  $('items-note').textContent = inBattle ? 'Using an item costs no PP.'
    : `Holds ${itemSlots()} items. Use them in battle; potions and HP Up work on the map too.`;
}

function useItemOnMap(index) {
  const item = ITEMS_BY_ID[run.items[index]];
  run.items.splice(index, 1);
  if (item.effects.maxHp) {
    run.maxHp += item.effects.maxHp;
    run.hp += item.effects.maxHp;
    playSound('stat-up', 'item');
    tell(`Used ${item.name}: max HP +${item.effects.maxHp}.`);
  } else {
    const healed = Math.min(item.effects.heal, run.maxHp - run.hp);
    run.hp += healed;
    playSound('potion', 'item');
    tell(`Used ${item.name}: healed ${healed} HP.`);
  }
  setHpBar('run', run.hp, run.maxHp);
  afterBagChange();
}

/** Only called on the map screen, so saving here can't split a reward chain. */
function afterBagChange() {
  checkpoint();
  renderItemList();
}

/* ---------- the Silph Scope (a complete Pokédex's prize): reveal who waits in a fight room ---------- */

let scoping = false;   // picking a room to reveal: the map's fight rooms light up instead of the reachable ones

const scopeReveals = () => (getSave().dex.complete ? SCOPE_REVEALS + perkLevel('scopeUpgrade') : 0);
const scopeUsed = () => Object.values(run.map.byId).filter(n => n.revealed).length;   // saved with the map's nodes

function drawMap() {
  const biome = BIOMES[run.biome];
  const nodes = Object.values(run.map.byId);
  if (scoping && !nodes.some(scopeable)) scoping = false;
  renderMap(run.map, run.current, enterNode, {
    biome: biome.id, trainer: spriteUrl(run.starter, 'front', run.stage), stage: run.stage, reveal: scoping ? revealRoom : null,
  });
  const total = scopeReveals(), left = total - scopeUsed();
  const btn = $('scope-btn');
  btn.hidden = !total;
  if (!total) return;
  btn.classList.toggle('on', scoping);
  btn.disabled = !scoping && (left <= 0 || !nodes.some(scopeable));
  btn.setAttribute('aria-pressed', String(scoping));
  btn.querySelector('.scope-label').textContent = scoping ? 'Pick a room' : `${left}/${total}`;
  btn.title = scoping ? 'Tap a lit-up fight room to reveal it, or tap here to put the Scope away.'
    : `${SCOPE.name}: ${SCOPE.text} ${left} of ${total} left in this biome.`;
  $('map').classList.toggle('scoping', scoping);
}

function toggleScope() {
  if (!run || (!scoping && scopeReveals() - scopeUsed() <= 0)) return;
  scoping = !scoping;
  playSound(scoping ? 'confirm' : 'cancel', 'confirm');
  drawMap();
}

function revealRoom(node) {
  node.revealed = true;
  scoping = false;
  checkpoint();
  drawMap();
  playCry(ENEMY_DEFS[node.enemyId].spriteId);
}

function initScope() {
  $('scope-btn').replaceChildren(itemSprite(SCOPE, 'scope-icon'), el('span', 'scope-label'));
  $('scope-btn').addEventListener('click', toggleScope);
}

function enterNode(node) {
  run.current = node.id;
  node.visited = true;

  if (node.type === 'rest' || node.type === 'shop') playSound('door');
  if (node.type === 'rest') return restSite();
  if (node.type === 'treasure') return treasureRoom();
  if (node.type === 'shop') {
    const healed = run.relics.includes('big-malasada') ? Math.min(15, run.maxHp - run.hp) : 0;
    if (healed) { run.hp += healed; playSound('heal-hp'); tell(`You ate the Big Malasada. +${healed} HP!`); }
    return martRoom();
  }
  if (node.type === 'event') { playSound('event'); return eventRoom(node); }
  fight(node);   // 'fight', 'elite' or 'boss'
}

/* ============================================================
   FIGHTS AND WHAT COMES AFTER
   ============================================================ */

async function fight(node) {
  const enter = await battleWipe(node.type);
  const encounter = buildEncounter(run.biome, node.type, run.mods, node.enemyId);
  dexSeen(node.enemyId);
  startBattle({ run, encounter, onEnd: (result) => afterFight(node, result) });
  enter();
}

function afterFight(node, result) {
  run.maxHp = result.maxHp ?? run.maxHp;   // Jungle Healing (StS's Feed) and HP Up can raise it
  if (result.fled) {
    run.hp = result.hp;
    tell('Got away safely!');
    return showMap();
  }
  if (!result.won) return endRun(false);

  run.hp = result.hp;
  run.fights += 1;
  const { lines: dexNews, complete: dexComplete } = dexDefeated(node.enemyId);
  if (dexComplete) run.dexComplete = true;   // the result window says so too
  // A finished Pokédex page can earn a legendary (Ho-Oh, Lugia, Palkia): say so in this fight's reward box.
  // The final boss leaves it to endRun(), whose result window lists every unlock.
  if (!(node.type === 'boss' && run.biome === BIOMES.length - 1)) {
    for (const starter of checkAchievements()) {
      run.unlocks.push(starter);
      dexNews.push(`${starter.line[0].name} unlocked!`);
    }
  }

  const [low, high] = PRIZE_MONEY[node.type];
  const prize = (low + Math.floor(Math.random() * (high - low + 1))) * (run.relics.includes('amulet-coin') ? 2 : 1);
  const foe = ENEMY_DEFS[node.enemyId]?.name ?? 'The foe';
  run.pendingCoins = {
    foe: node.type === 'fight' ? `The wild ${foe}` : node.type === 'elite' ? `The Alpha ${foe}` : foe,
    coins: coinsWithBonus(levelCoins(COIN_REWARDS[node.type])), money: prize, dex: dexNews,
  };
  // Paid out only as the rewards end, right before the map checkpoint: a refresh on a
  // reward screen replays the fight, so paying earlier would let it be earned twice.
  const collect = () => {
    if (!run.pendingCoins.told) dexNews.forEach(tell);   // no reward screen said it
    awardCoins(levelCoins(COIN_REWARDS[node.type]));
    run.money += prize;
    setMoney(run.money);
    updateSave(d => { d.stats.enemiesDefeated += 1; });
    refreshCoins();
    playSound('coins');
    run.pendingCoins = null;
  };

  const steps = [];   // screens to show one after another
  if (node.type === 'fight') steps.push(next => offerCard('fight', next));
  if (node.type === 'elite') steps.push(next => offerRelic('The Alpha\'s relic', next, { source: 'elite' }), next => offerCard('elite', next));

  if (node.type === 'boss') {
    updateSave(d => {
      d.stats.bossesDefeated[run.biome + 1] = true;
      if (result.hp / run.maxHp > 0.5) d.stats.healthyBossWin = true;
    });
    if (run.biome === BIOMES.length - 1) { run.pendingCoins.told = true; run.dexNews = dexComplete ? dexNews.slice(0, -1) : dexNews; collect(); return endRun(true); }       // final boss: you win!
    announceUnlocks();
    steps.push(next => evolve(next), next => offerEvolutionCard(next), next => offerCard('boss', next), next => offerRelic('Boss relic', next, { boss: true }));
  }

  // Slay the Spire's potion odds: each drop makes the next one less likely, each miss more likely.
  if (Math.random() < run.itemChance) {
    run.itemChance = Math.max(0, run.itemChance - ITEM_DROP.step);
    const [item] = itemChoices(run);
    if (item) steps.push(next => offerItem(item, next));
  } else {
    run.itemChance = Math.min(1, run.itemChance + ITEM_DROP.step);
  }

  runSteps(steps, () => {
    collect();
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

function offerCard(source, next, rerolled = false) {
  const cards = cardChoices(run, source, REWARD_CARDS[perkLevel('scoutReport') ? 1 : 0], { reward: true });   // Scout Report: 4
  if (!cards.length) return next();

  // Oak's Advice (a Pokédex perk): once per biome, swap the moves offered for new ones
  const canReroll = hasDexPerk('oaks-advice') && run.rerollBiome !== run.biome;
  showChoice({
    title: 'Learn a new move',
    sub: [rerolled && 'Oak\'s Advice: new moves to pick from!', `Pick a move to add to your deck (${run.deck.length} cards now), or skip.`,
      canReroll && 'Oak\'s Advice: you can reroll these once this biome.'],
    options: cards.map(card => learnOption(card, next)),
    onSkip: next,
    coins: run.pendingCoins,
    reroll: canReroll ? () => { run.rerollBiome = run.biome; offerCard(source, next, true); } : null,
  });
}

/** The "choose 1 of 2" screen for a new signature move after evolving. */
function offerEvolutionCard(next) {
  const cards = evolutionChoices(run);
  if (!cards.length) return next();

  showChoice({
    title: 'Signature move',
    sub: `${stageName(run.starter, run.stage)} can learn a powerful signature move! Pick one to add to your deck.`,
    options: cards.map(card => learnOption(card, next)),
    onSkip: next,
    coins: run.pendingCoins,
  });
}

/** A card reward tile: first tap picks it, then "Add to deck" (or a second tap) takes it. */
function learnOption(card, next) {
  return {
    ...cardOption(card, run.stage, () => {
      run.deck.push(card.id);
      tell(`${card.name} added to your deck!`);
      next();
    }),
    ask: `Add ${card.name} to your deck?`,
    confirm: 'Add to deck',
  };
}

function offerRelic(title, next, { boss = false, source = 'normal' } = {}) {
  showRelics(title, relicChoices(run, { boss, source }), next);
}

function showRelics(title, relics, next) {
  if (!relics.length) return next();

  showChoice({
    title,
    sub: relics[0].boss ? 'Pick a boss relic. Each one is strong, but comes with a catch.' : 'Pick a relic. It helps you for the rest of the run.',
    options: relics.map(relic => ({ ...relicOption(relic, () => gainRelic(relic, next)), ask: `Take the ${relic.name}?`, confirm: 'Take it', confirmSound: 'item-get' })),
    onSkip: next,
    layout: 'relic-pick',
    coins: run.pendingCoins,
  });
}

function gainRelic(relic, next) {
  run.relics.push(relic.id);
  tell(`Found ${relic.name}!`);
  if (relic.id === 'cleanse-tag' && run.deck.length > MIN_DECK) return forgetMove(next, next);
  next();
}

/** A found item first lies in a Poké Ball in the middle of the screen, like an item ball in the games: tapped, it
    wobbles, pops open (the treasure chest's flash and rays) and the item rises out, floating like a treasure relic: tap
    it (then Put in Bag) and it flies into the Bag. With a full Bag your items float in a row under it: tap one to mark
    it for tossing (it greys out with a ✕), then Swap. */
function offerItem(item, next) {
  const thisRun = run, full = run.items.length >= itemSlots(), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const found = [`You found ${/^[AEIOUX]/.test(item.name) ? 'an' : 'a'} ${item.name}!`, item.text, full ? `Your Bag is full (${itemSlots()} items). Tap one of yours to swap it out, or leave it.`
    : `Tap it to put it in your Bag (up to ${itemSlots()} items, used up in battle).`];
  showChoice({
    title: 'Item found',
    sub: ['There\'s a Poké Ball lying here!', 'Tap it to open it!'],
    options: [],
    skipLabel: full ? 'Leave it' : 'Skip',
    onSkip: next,
    coins: run.pendingCoins,
    layout: 'item-found',
  });
  const stage = el('div', 'float-stage sealed'), spot = el('div', 'ball-spot'), thing = floatingThing(item, 0, 96), row = el('div', 'float-row');
  const go = goButton(full ? 'Swap' : 'Put in Bag');
  let toss = null, taking = false;

  const art = itemBallArt(['poke', 'great', 'ultra'][run.biome] || 'poke'), ball = el('button', 'item-ball');
  ball.type = 'button';
  ball.setAttribute('aria-label', 'Open the Poké Ball');
  const half = (name) => {
    const img = el('img', `ball-half ball-${name}`);
    Object.assign(img, { src: art[name].url, alt: '', draggable: false });
    return img;
  };
  ball.append(half('bottom'), half('top'), el('span', 'chest-glow'), centerLabel('Open', 'Open the Poké Ball'));
  spot.append(el('span', 'chest-rays'), ball, thing);
  stage.append(spot);
  ball.addEventListener('click', async () => {
    if (ball.classList.contains('shaking') || ball.classList.contains('opened')) return;
    ball.classList.add('shaking');
    await sleep(reduced ? 0 : 1100);
    if (run !== thisRun || !ball.isConnected) return;
    ball.classList.replace('shaking', 'opened');
    ball.tabIndex = -1;
    playSound('ball-open');
    stage.append(el('div', 'treasure-flash'));
    stage.classList.replace('sealed', 'open');
    await sleep(reduced ? 0 : 900);
    if (run !== thisRun || !ball.isConnected) return;
    sayLines(found);
  });

  if (full) {
    run.items.forEach((id, index) => {
      const mine = ITEMS_BY_ID[id], btn = floatingThing(mine, index + 1, 64);
      btn.addEventListener('click', () => {
        if (toss === index) return take();
        toss = index;
        stage.classList.add('choosing');
        row.querySelectorAll('.float-thing').forEach(b => b.classList.toggle('tossing', b === btn));
        go.hidden = false;
        sayLines([`Toss your ${mine.name} for the ${item.name}?`]);
      });
      row.append(btn);
    });
    stage.append(el('p', 'float-caption', 'Your Bag'), row);
  }
  thing.addEventListener('click', () => {
    if (full && toss === null) return sayLines([`${item.name}: ${item.text}`, 'Tap one of your items to swap it out.']);
    if (!full && go.hidden) { thing.classList.add('chosen'); go.hidden = false; return sayLines([`Put the ${item.name} in your Bag?`]); }
    take();
  });
  go.addEventListener('click', take);
  stage.append(go);
  $('reward-options').append(stage);

  async function take() {
    if (taking) return;
    taking = true;
    playSound('item-get');
    $('reward-skip').style.visibility = 'hidden';   // not `hidden`: the text box below would jump up into its place
    go.hidden = true;
    if (toss !== null) row.children[toss].classList.add('gone');
    await flyToBag(thing);
    if (run !== thisRun) return;
    if (toss === null) run.items.push(item.id); else run.items[toss] = item.id;
    tell(`Put the ${item.name} in the Bag.`);
    next();
  }
}

/** A relic or item bobbing in the light with no tile round it (the treasure room's look), its name under it. */
function floatingThing(thing, i = 0, size = 72) {
  if (ITEMS_BY_ID[thing.id] === thing) markSeen('items', thing.id);
  else if (RELICS_BY_ID[thing.id] === thing) markSeen('relics', thing.id);
  const btn = el('button', 'float-thing'), float = el('span', 'relic-float');
  btn.type = 'button';
  btn.style.setProperty('--i', i);
  btn.style.setProperty('--size', `${size}px`);
  btn.setAttribute('aria-label', `${thing.name}: ${thing.text}`);
  float.append(itemSprite(thing, 'treasure-sprite'));
  btn.append(el('span', 'relic-halo'), float, el('span', 'float-label', thing.name));
  return btn;
}

function goButton(label) {
  const btn = el('button', 'ds-btn ds-go ds-sm float-go');
  btn.type = 'button';
  btn.hidden = true;
  btn.append(el('span', 'pp-pill', label));
  return btn;
}

/** A floating relic or item shrinks away into the Bag (the treasure room's relicToBag). */
async function flyToBag(btn) {
  const from = btn.getBoundingClientRect(), to = $('bag-btn').getBoundingClientRect();
  btn.style.setProperty('--to-x', `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
  btn.style.setProperty('--to-y', `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
  btn.classList.add('taken');
  await sleep(matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 750);
}

/** An event's gift (the Shrine's relic) floats up over the scene with its name, so you see what you got; tapping it
    or Take it flies it into the Bag, then `done`. */
function revealGift(thing, lines, done) {
  const thisRun = run, box = $('reward-options');
  box.querySelectorAll('.reward-option').forEach(btn => { btn.hidden = true; });
  $('reward-skip').style.visibility = 'hidden';
  const stage = el('div', 'float-stage float-gift'), gift = floatingThing(thing, 0, 104), go = goButton('Take it');
  go.hidden = false;
  stage.append(gift, go);
  box.append(stage);
  sayLines(lines);
  let taking = false;
  const take = async () => {
    if (taking) return;
    taking = true;
    go.hidden = true;
    playSound('item-get');
    await flyToBag(gift);
    if (run === thisRun) done();
  };
  gift.addEventListener('click', take);
  go.addEventListener('click', take);
}

/** The treasure grotto: a Poké Ball chest on a dais in a shaft of light. Tapped, it wobbles like a ball about to open,
    pops, and the relics float up out of it with no tiles round them; tap one to read it in the text box, then tap it
    again (or Take it) and it flies into the Bag. */
function treasureRoom() {
  const thisRun = run, relics = relicChoices(run, { source: 'treasure' }), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  showChoice({
    title: 'Treasure',
    sub: ['A chest glints in a shaft of light.', 'Tap it to open it!'],
    options: [],
    skipLabel: 'Leave',
    onSkip: showMap,
    layout: 'treasure-room',
  });
  showPlaceScene('treasure', { biome: BIOMES[run.biome].id });

  const art = treasureChest(), stage = el('div', 'treasure-stage');
  const part = (name) => {
    const img = el('img', `chest-part chest-${name}`);
    Object.assign(img, { src: art[name].url, alt: '', draggable: false });
    img.style.setProperty('--w', art[name].w);
    img.style.setProperty('--h', art[name].h);
    return img;
  };
  const chest = el('button', 'treasure-chest');
  chest.type = 'button';
  chest.setAttribute('aria-label', 'Open the chest');
  chest.append(el('span', 'chest-rays'), part('open'), part('body'), part('lid'), el('span', 'chest-glow'), centerLabel('Open', 'Open the chest'));
  const take = el('button', 'ds-btn ds-go ds-sm treasure-take');
  take.type = 'button';
  take.hidden = true;
  take.append(el('span', 'pp-pill', 'Take it'));
  stage.append(chest, take);
  $('reward-options').append(stage);
  placeTreasure();

  let picked = null, taking = false;
  chest.addEventListener('click', async () => {
    if (chest.classList.contains('shaking') || chest.classList.contains('opened')) return;
    chest.classList.add('shaking');
    await sleep(reduced ? 0 : 1100);
    if (run !== thisRun || !chest.isConnected) return;
    chest.classList.replace('shaking', 'opened');
    chest.tabIndex = -1;
    playSound('ball-open');
    stage.append(el('div', 'treasure-flash'));
    relics.forEach((relic, i) => stage.append(relicButton(relic, i)));
    placeTreasure();
    await sleep(reduced ? 0 : 500 + relics.length * 180);
    if (run !== thisRun || !chest.isConnected) return;
    sayLines(relics.length ? ['The chest was full of relics!', 'Tap one to see what it does.'] : ['The chest is empty...']);
  });

  function relicButton(relic, i) {
    const btn = el('button', 'treasure-relic'), float = el('span', 'relic-float');
    btn.type = 'button';
    btn.setAttribute('aria-label', `${relic.name}: ${relic.text}`);
    btn.style.setProperty('--i', i);
    markSeen('relics', relic.id);
    float.append(itemSprite(relic, 'treasure-sprite'));
    btn.append(el('span', 'relic-halo'), float, el('span', 'relic-label', relic.name));
    btn.addEventListener('click', () => (picked === relic ? takeIt() : choose(relic, btn)));
    return btn;
  }

  function choose(relic, btn) {
    if (taking) return;
    picked = relic;
    stage.classList.add('choosing');
    stage.querySelectorAll('.treasure-relic').forEach(b => b.classList.toggle('chosen', b === btn));
    take.hidden = false;
    sayLines([`${relic.name}: ${relic.text}`]);
  }

  take.addEventListener('click', takeIt);
  async function takeIt() {
    if (!picked || taking) return;
    taking = true;
    playSound('item-get');
    $('reward-skip').style.visibility = 'hidden';   // not `hidden`: the text box below would jump up into its place
    take.hidden = true;
    const btn = stage.querySelector('.treasure-relic.chosen'), from = btn.getBoundingClientRect(), to = $('bag-btn').getBoundingClientRect();
    btn.style.setProperty('--to-x', `${to.left + to.width / 2 - (from.left + from.width / 2)}px`);
    btn.style.setProperty('--to-y', `${to.top + to.height / 2 - (from.top + from.height / 2)}px`);
    stage.classList.add('taking');
    btn.classList.add('taken');
    await sleep(reduced ? 0 : 750);
    if (run !== thisRun) return;
    gainRelic(picked, showMap);
  }
}

/** Stand the chest on the grotto's dais and float the relics in a row above it; the scene tells us whenever it repaints. */
function placeTreasure() {
  const stage = document.querySelector('.treasure-stage'), spot = stage?.isConnected && treasureSpots();
  if (!spot) return;
  const { left, foot, px } = spot, chestTop = foot - 28 * px, cx = left + 18 * px;
  const size = innerWidth <= 720 ? 72 : 96;
  const titleFoot = $('reward-title').getBoundingClientRect().bottom;
  const rowY = Math.max(titleFoot + size / 2 + 12, chestTop - 100 - size / 2);
  stage.style.setProperty('--px', `${px}px`);
  stage.style.setProperty('--size', `${size}px`);
  Object.assign(stage.querySelector('.treasure-chest').style, { left: `${left}px`, top: `${foot}px` });
  stage.querySelector('.treasure-take').style.top = `${Math.max(rowY + size / 2 + 24, chestTop - 66)}px`;
  const relics = [...stage.querySelectorAll('.treasure-relic')], gap = Math.min(size * 1.5, (innerWidth - 24) / Math.max(1, relics.length));
  relics.forEach((btn, i) => {
    const off = i - (relics.length - 1) / 2, x = cx + off * gap, y = rowY + Math.abs(off) * 14;
    Object.assign(btn.style, { left: `${x}px`, top: `${y}px` });
    btn.style.setProperty('--from-x', `${cx - x}px`);
    btn.style.setProperty('--from-y', `${chestTop + 8 * px - y}px`);
  });
}
addEventListener('scenepaint', placeTreasure);

/** Forgetting a move never takes the deck below this, so a reshuffle still deals a full hand and some. */
const MIN_DECK = 7;

function restSite() {
  const restHeal = run.mods.restHeal + (getSave().passives.wellFed ? 0.05 : 0);   // shop passive: Well-Fed Bonus
  const heal = Math.min(run.maxHp - run.hp, Math.ceil(run.maxHp * restHeal));
  const banned = run.relics.includes('choice-band');
  const atMin = run.deck.length <= MIN_DECK;
  const herb = run.relics.includes('mental-herb');   // like StS's Peace Pipe: only this relic lets the PC forget a move
  const upgradable = run.deck.some(id => canUpgrade(CARDS_BY_ID[id]));
  // no tiles here: the healing machine, the PC and Chansey in the scene are the choices, each under a bouncing label
  showChoice({
    title: 'Pokémon Center',
    sub: ['A safe place to catch your breath.', herb ? 'Use the healing machine to rest, the PC to forget a move (your Mental Herb), or ask Chansey for a PP Up.'
      : 'Use the healing machine to rest, or ask Chansey for a PP Up.'],
    options: [
      {
        node: captionedSign(banned ? 'No rest' : heal ? `Rest +${heal} HP` : 'Rest',
          banned ? 'Your Choice Band won\'t let you rest.' : heal ? `Heal ${heal} HP.` : 'You\'re already at full HP.'),
        disabled: banned,
        onPick: async () => {
          const thisRun = run;
          const before = run.hp;
          run.hp += heal;
          run.restCount += 1;
          $('reward-options').classList.add('resting');
          // like the games: the music stops, the balls go into the machine one by one, then they flash while the
          // healing chime plays out before you leave
          playMusic(null, { cut: true });
          await healAtCenter();
          if (run !== thisRun) return;
          const chime = await playSound('heal');
          const seconds = Math.min(chime, 4) || 2;
          flashCenter(seconds);
          vitals.fill(before, run.hp, seconds);   // the patient monitor's bar fills up while the chime plays
          showChoiceHp();
          await sleep(seconds * 1000);
          if (run !== thisRun) return;                 // the run was abandoned during the chime
          // a moment to see the full bar, with Chansey's goodbye, before heading back out
          sayLines([`${stageName(run.starter, run.stage)} is feeling much better! Come back any time!`]);
          await sleep(2200);
          if (run !== thisRun) return;
          showMap();
        },
      },
      {
        node: captionedSign('Forget',
          !herb ? 'Needs a Mental Herb.'
            : atMin ? `Your deck is at the minimum (${MIN_DECK} cards).` : 'Remove a card from your deck.'),
        disabled: !herb || atMin,
        onPick: () => forgetMove(restSite),
      },
      {
        node: captionedSign('PP Up', upgradable ? 'Upgrade a card for the rest of the run.' : 'Every card is already upgraded.'),
        disabled: !upgradable,
        onPick: () => upgradeMove(restSite),
      },
    ],
    skipLabel: 'Leave',
    onSkip: showMap,
    layout: 'center-room',
  });
  // Chansey, the nurse, stands behind the counter (placeCenterSpots() hides its feet at the counter top)
  const nurse = el('div', 'center-nurse'), sprite = el('img');
  sprite.src = 'assets/pokemon/chansey-front.gif';
  sprite.alt = 'Chansey, the nurse';
  nurse.append(sprite);
  const vitals = centerVitals(run.hp, banned ? 0 : heal);
  $('reward-options').append(nurse, vitals.node);
  showPlaceScene('center');
  placeCenterSpots();
  playMusic('center');
  preloadSounds('heal');
}

/** The Center's patient monitor: your Pokémon, its HP bar in green phosphor and what Rest would heal blinking on the
    end of it; `fill()` runs the bar and the numbers up in real time while you rest. placeCenterSpots() lays it over
    the scene's monitor screen. */
function centerVitals(hp, heal) {
  const node = el('div', 'center-vitals');
  node.title = heal ? `${stageName(run.starter, run.stage)}: ${hp}/${run.maxHp} HP. Resting heals ${heal}.` : `${stageName(run.starter, run.stage)}: ${hp}/${run.maxHp} HP.`;
  const face = el('img', 'vitals-face');
  face.src = spriteUrl(run.starter, 'front', run.stage);
  face.alt = '';
  const bar = el('span', 'vitals-bar'), fill = el('span', 'vitals-fill'), gain = el('span', 'vitals-gain');
  bar.append(fill, gain);
  const nums = el('span', 'vitals-hp'), plus = el('span', 'vitals-plus', heal ? `+${heal}` : '');
  node.append(face, el('span', 'vitals-name', stageName(run.starter, run.stage).toUpperCase()), bar, nums, plus);
  const show = (now, coming) => {
    fill.style.width = `${now / run.maxHp * 100}%`;
    gain.style.left = fill.style.width;
    gain.style.width = `${coming / run.maxHp * 100}%`;
    nums.textContent = `HP ${Math.round(now)}/${run.maxHp}`;
  };
  show(hp, heal);
  return {
    node,
    fill(from, to, seconds) {
      node.classList.add('healing');
      plus.textContent = '';
      const start = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - start) / (seconds * 1000));
        show(from + (to - from) * k, (to - from) * (1 - k));
        if (k < 1 && node.isConnected) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
  };
}

/** A Center or event sign that spells out what its choice does, since a phone never shows centerLabel()'s hover title. */
function captionedSign(text, caption) {
  const sign = el('span', 'center-label', text);
  sign.append(el('span', 'spot-caption', caption));
  return sign;
}

/** A sign with its caption is big: one over a prop near the edge is nudged back onto the screen, one that would
 *  cover a lower sign (the grunt's three, the Center's) is lifted clear of it, and none covers the screen's title. */
function spreadSigns(box) {
  const signs = [...box.querySelectorAll('.reward-option .center-label')];
  signs.forEach(sign => { sign.style.marginLeft = ''; sign.style.marginBottom = ''; });
  const title = $('reward-title'), vitals = box.querySelector('.event-vitals');
  const ceiling = Math.max(title.offsetHeight ? title.getBoundingClientRect().bottom + 6 : 0, vitals ? vitals.getBoundingClientRect().bottom + 6 : 0);
  const placed = [];
  signs.map(sign => ({ sign, r: sign.getBoundingClientRect() })).sort((a, b) => b.r.bottom - a.r.bottom).forEach(({ sign, r }) => {
    const edge = 8, gap = 10;   // the gap covers the signs bobbing out of step
    const nudge = r.left < edge ? edge - r.left : r.right > innerWidth - edge ? innerWidth - edge - r.right : 0;
    let lift = 0;
    for (const o of placed) {
      if (r.left + nudge < o.right && r.right + nudge > o.left && r.bottom - lift > o.top - gap) lift = r.bottom - o.top + gap;
    }
    if (r.top - lift < ceiling) lift = r.top - ceiling;   // over the prop rather than over the screen's title (the Shrine's roof)
    if (nudge) sign.style.marginLeft = `${nudge}px`;
    if (lift) sign.style.marginBottom = `${lift}px`;
    placed.push({ left: r.left + nudge, right: r.right + nudge, top: r.top - lift });
  });
}

function centerLabel(text, hint) {
  const label = el('span', 'center-label', text);
  label.title = hint;
  return label;
}

/** Lay the Center's two choices over the machine and the PC in the scene, and stand Chansey at the counter; the scene tells us whenever it repaints. */
function placeCenterSpots() {
  const box = $('reward-options');
  if (!box.classList.contains('center-room')) return;
  const spots = centerSpots();
  if (!spots) return;
  box.querySelectorAll('.reward-option').forEach((btn, i) => {
    // PP Up is Chansey herself: the part of her that shows over the counter (.center-nurse is 70px tall)
    const r = i === 2 ? { left: spots.nurse.x - 36, top: spots.nurse.y - 64, width: 72, height: 64 } : spots[i === 0 ? 'machine' : 'pc'];
    // at least a fingertip wide, around the thing itself
    const w = Math.max(r.width, 64), h = Math.max(r.height, 56);
    Object.assign(btn.style, { left: `${r.left + (r.width - w) / 2}px`, top: `${r.top + r.height - h}px`, width: `${w}px`, height: `${h}px` });
  });
  const nurse = box.querySelector('.center-nurse');
  if (nurse) Object.assign(nurse.style, { left: `${spots.nurse.x}px`, top: `${spots.nurse.y}px` });
  const vitals = box.querySelector('.center-vitals'), p = spots.patient;
  if (vitals && p) Object.assign(vitals.style, { left: `${p.left}px`, top: `${p.top}px`, width: `${p.width}px`, height: `${p.height}px`, fontSize: `${p.width / 11.5}px` });
  $('reward-screen').style.setProperty('--counter-foot', `${spots.foot}px`);   // the text box sits just under the counter
  spreadSigns(box);
  liftRoomLog();
}

/** On a short phone the text box under the counter reached down over Leave, so lift it just clear (it grows a line
 *  for long text, hence the observer). */
function liftRoomLog() {
  const screen = $('reward-screen'), box = screen.querySelector('.reward-bottom'), skip = $('reward-skip');
  if (!screen.querySelector(':is(.center-room, .event-room)')) return;
  const foot = parseFloat(screen.style.getPropertyValue('--counter-foot')) || 0;
  const floor = skip.offsetHeight ? skip.getBoundingClientRect().top : screen.getBoundingClientRect().bottom;   // Team Rocket has no Leave
  const room = floor - 8 - box.offsetHeight - (foot + 12);
  screen.style.setProperty('--log-lift', `${Math.max(0, -room)}px`);
}
new ResizeObserver(liftRoomLog).observe(document.querySelector('#reward-screen .reward-bottom'));
addEventListener('resize', liftRoomLog);

/** On a short window the Mart's shelves pushed Leave and the text box off the bottom, so the whole shop is zoomed out just
    enough for the screen to fit without scrolling. It works out its own zoom, so the scene's floor line (read from the
    counter's box) is repainted with a second resize once the zoom changes. */
function fitMart() {
  const shop = document.querySelector('#reward-options.mart-window');
  if (!shop) return;
  const before = shop.style.zoom;
  const note = document.querySelector('.fan-note')?.offsetHeight || 0;   // the fan note may scroll away under the page
  const fits = (zoom) => { shop.style.zoom = zoom; return document.documentElement.scrollHeight - note <= innerHeight; };
  if (!fits('')) {
    let [lo, hi] = [0.6, 1];   // the largest zoom that fits, to within 1%: the layout doesn't shrink in step with it
    while (hi - lo > 0.01) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    shop.style.zoom = lo.toFixed(3);
  }
  if (shop.style.zoom !== before) dispatchEvent(new Event('resize'));
}
addEventListener('resize', fitMart);
new ResizeObserver(() => fitMart()).observe(document.querySelector('#reward-screen .reward-bottom'));   // the text box grows as a line types out
addEventListener('scenepaint', placeCenterSpots);

/** The Mart's PC on the counter, under the same bouncing sign as the Center's. */
function martPc(text, hint) {
  const pc = el('span', 'mart-pc');
  pc.append(centerLabel(text, hint), el('span', 'mart-pc-icon', '💻'));
  return pc;
}

/** PP Up (StS's Smith): pick a card to upgrade for the rest of the run; it saves as its `<id>+`. The blown-up
    card shows the upgraded version, so you see what you get before you confirm. */
function upgradeMove(back, done = showMap, { title = 'PP Up', sub = 'Choose a move to power up for the rest of the run. Tap one to see it upgraded.', skipLabel = 'Back' } = {}) {
  showChoice({
    title,
    sub,
    options: groupDeck(run.deck, CARDS_BY_ID).filter(({ card }) => canUpgrade(card)).map(({ card, count }) => {
      const better = CARDS_BY_ID[upgradeId(card.id)];
      return {
        ...cardOption(card, run.stage, () => {
          run.deck.splice(run.deck.indexOf(card.id), 1, better.id);
          tell(`${card.name} became ${better.name}!`);
          done();
        }, count),
        zoom: makeCard(better, { stage: run.stage }),
        ask: `Upgrade ${card.name}?`,
        confirm: 'PP Up',
        confirmSound: 'stat-up',
      };
    }),
    skipLabel,
    onSkip: back,
  });
}

/** `done` runs after a card is forgotten; Cleanse Tag passes its reward chain here, the Center returns to the map. */
function forgetMove(back, done = showMap, skipLabel = back === done ? 'Keep every move' : 'Back', confirmSound) {
  showChoice({
    title: 'Forget a move',
    sub: `Choose a card to remove from your deck. It can't go below ${MIN_DECK} cards.`,
    options: groupDeck(run.deck, CARDS_BY_ID).map(({ card, count }) => ({
      ...cardOption(card, run.stage, () => {
        run.deck.splice(run.deck.indexOf(card.id), 1);
        tell(`${card.name} was forgotten.`);
        done();
      }, count),
      ask: `Forget ${card.name}?`,
      confirm: 'Forget it',
      confirmSound,
    })),
    skipLabel,
    onSkip: back,
  });
}

/* ---------- ? events (the numbers are in js/data/events.js) ---------- */

/** Rolled when the biome starts and saved on the node, so a refresh can't swap the event or its dice. No repeats in a biome until every event has come up. */
function rollEvents() {
  let bag = [];
  for (const node of Object.values(run.map.byId)) {
    if (node.type !== 'event') continue;
    if (!bag.length) bag = [...EVENTS].sort(() => Math.random() - 0.5);
    const event = bag.pop();
    node.event = { id: event.id };
    if (event.trapChance) node.event.trap = Math.random() < event.trapChance;
    if (event.team) {
      const team = event.team[run.biome];
      node.event.enemyId = team[Math.floor(Math.random() * team.length)];
      node.event.grunt = event.grunts[Math.floor(Math.random() * event.grunts.length)];
    }
    if (event.upgrade) {
      // every card of each rarity in a shuffled order: the trade takes the first one you don't already hold MAX_COPIES of
      const pool = poolForType(run.starter.type);
      node.event.offers = Object.fromEntries(Object.values(event.upgrade).map(rarity =>
        [rarity, shuffle(pool.filter(c => (c.rarity || 'common') === rarity)).map(c => c.id)]));
    }
    if (event.tosses) {
      node.event.luck = Math.random();   // one roll for every toss, so the bigger toss wins whenever the small one would
      node.event.relics = relicChoices(run).map(r => r.id);
    }
    if (event.offering) {
      const typeRelics = shuffle(RELICS.filter(r => r.only === run.starter.type));
      node.event.relics = [...typeRelics, ...relicChoices(run).filter(r => !r.only)].map(r => r.id);
    }
  }
}

const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);

/** Every card and relic id a saved event holds is still in the game (checked by restoreRun). */
const eventIdsKnown = (state) => Object.values(state.offers || {}).flat().every(id => CARDS_BY_ID[id])
  && (state.relics || []).every(id => RELICS_BY_ID[id]);

const perBiome = (value) => (Array.isArray(value) ? value[run.biome] : value);
const loseHp = (amount) => { run.hp = Math.max(1, run.hp - amount); };

// events with a scene of their own (PLACE_ART in js/scene.js): no tiles, their choices are signs over its props
const EVENT_SCENES = {
  'berry-tree': 'berry', 'hot-spring': 'spring', 'wishing-well': 'well', 'item-ball': 'itemball', 'team-rocket': 'rocket', shrine: 'altar',
  'move-tutor': 'tutor', 'move-deleter': 'deleter', 'day-care': 'daycare', 'fan-club': 'fans',
};

/** An event's room; `after` is its trainer's reaction (a figureDoes() move) once its picker is done: then the room has no
    choices, the text box says what happened, and closing it (or Leave) goes on to the map. */
function eventRoom(node, after) {
  const event = EVENTS_BY_ID[node.event.id];
  const back = () => eventRoom(node);
  const react = (move) => () => eventRoom(node, move);
  const { options, leave = true, sub = event.text, figures, vitals } = EVENT_CHOICES[event.id](event, node.event, back, react);
  const scene = EVENT_SCENES[event.id];
  showChoice({
    title: `${event.icon} ${event.name}`,
    sub: after ? [] : sub,
    options: after ? [] : options,
    skipLabel: 'Leave',
    onSkip: leave ? showMap : undefined,
    layout: scene ? `event-room ${scene}-room` : '',
  });
  if (!scene) return;
  if (vitals) {
    $('reward-options').append(eventVitals());
    setHpBar('event', run.hp, run.maxHp);
  }
  for (const [stand, figure] of Object.entries(figures || {})) $('reward-options').append(eventFigure(stand, figure));
  showPlaceScene(scene, { biome: BIOMES[run.biome].id, type: run.starter.type });
  placeEventSpots();
  if (!after) return;
  figureDoes('npc', after);
  const box = $('reward-log'), read = box.onclick;
  if (box.hidden) return;
  box.onclick = () => { read(); if (box.hidden) showMap(); };
}

/** Someone standing in an event's scene, on its `stands` (placeEventSpots()): the grunt and their Alpha, the Pokémon
    at the Day Care and the Fan Club, or a trainer (`npc`, an id in NPCS) who breathes, blinks, and bobs their head
    while the text box types. `flip` turns one round (front sprites all face left). */
function eventFigure(stand, { src, alpha, flip, npc }) {
  const figure = el('div', `event-figure${alpha ? ' alpha' : ''}${flip ? ' flip' : ''}${npc ? ' npc' : ''}`);
  figure.dataset.stand = stand;
  const img = (cls, file = src) => {
    const sprite = el('img', cls);
    sprite.src = file;
    sprite.alt = '';
    return sprite;
  };
  if (!npc) {
    const sprite = img('');
    sprite.addEventListener('load', placeEventSpots);
    figure.append(sprite);
    return figure;
  }
  // a still sprite, cut into legs, upper body and head so each can move by whole pixels (a scaled image would drop a row
  // somewhere in the face); the head holds an eyes-closed copy over the open one for blinking
  src = `assets/trainers/${npc}.png`;
  const legs = img('npc-legs'), upper = el('div', 'npc-upper'), torso = img('npc-torso'), head = el('div', 'npc-head');
  head.append(img(''), img('npc-shut', `assets/trainers/${npc}-blink.png`));
  upper.append(torso, head);
  figure.append(legs, upper);
  figure.style.setProperty('--phase', `${-Math.random() * 3}s`);
  legs.addEventListener('load', () => {
    const { naturalWidth: w, naturalHeight: h } = legs, { head: [x0, x1, y1], waist } = NPCS[npc];
    const x = (px) => `${px / w * 100}%`, y = (px) => `${px / h * 100}%`;
    figure.style.setProperty('--w', w);
    figure.style.setProperty('--h', h);
    legs.style.clipPath = `inset(${y(waist)} 0 0 0)`;
    torso.style.clipPath = `polygon(0 0, ${x(x0)} 0, ${x(x0)} ${y(y1)}, ${x(x1)} ${y(y1)}, ${x(x1)} 0, 100% 0, 100% ${y(waist)}, 0 ${y(waist)})`;
    head.style.clipPath = `inset(0 ${x(w - x1)} ${y(h - y1)} ${x(x0)})`;
    placeEventSpots();
  }, { once: true });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) blinkNow(figure);
  return figure;
}

/** A trainer blinks every 2-6 s, for ~120 ms, until the room closes. */
function blinkNow(figure) {
  setTimeout(() => {
    if (!figure.isConnected) return;
    figure.classList.add('npc-blink');
    setTimeout(() => { figure.classList.remove('npc-blink'); blinkNow(figure); }, 120);
  }, 2000 + Math.random() * 4000);
}

/** Your HP on an event where it decides the choice (the Hot Spring's soak or dip, an HP price): one slim row under the
    title, the battle's HP bar and numbers; the top bar's little plate steps aside for it. */
function eventVitals() {
  const plate = el('div', 'event-vitals');
  const bar = el('div', 'gb-hp');
  bar.id = 'event-hp';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Your HP');
  bar.setAttribute('aria-valuemin', '0');
  const tag = el('span', 'gb-hp-tag', 'HP:'), track = el('span', 'gb-hp-track'), fill = el('span', 'gb-hp-fill');
  tag.setAttribute('aria-hidden', 'true');
  fill.id = 'event-hp-fill';
  track.append(fill);
  bar.append(tag, track);
  const nums = el('span', 'gb-hp-num');
  nums.id = 'event-hp-text';
  plate.append(bar, nums);
  return plate;
}

/** Run the event's HP bar to your new HP, and give it a moment to be seen before the room closes. */
async function showHpChange() {
  if (!$('event-hp')) return;
  setHpBar('event', run.hp, run.maxHp);
  showChoiceHp();
  await sleep(1000);
}

/** A choice laid over one of the event scene's props, under a bouncing sign, like the Center's. */
const spotOption = (label, hint, onPick, disabled = false) => ({ node: captionedSign(label, hint), disabled, onPick });

/** Play a choice out on the event's scene before it takes effect; false if the run ended meanwhile. */
async function playOut(act, opts) {
  const thisRun = run;
  $('reward-options').classList.add('resting');
  await sleep(sceneAct(act, opts));
  return run === thisRun;
}

/** Someone in the scene reacts to a choice (a CSS animation timed to the scene's act, run again if it already ran): the
    grunt hops or shakes; a trainer jumps, nods, shakes their head (npc-no) or turns round (npc-turn, until the room closes). */
function figureDoes(stand, move) {
  const figure = $('reward-options').querySelector(`[data-stand="${stand}"]`);
  if (!figure) return;
  figure.classList.remove(move);
  void figure.offsetWidth;
  figure.classList.add(move);
}

/** Lay the event's choices over its props; the scene tells us whenever it repaints. */
function placeEventSpots() {
  const box = $('reward-options'), spots = box.classList.contains('event-room') && eventSpots();
  if (!spots) return;
  box.querySelectorAll('.reward-option').forEach((btn, i) => {
    const r = spots.spots[i];
    if (!r) return;
    const w = Math.max(r.width, 56), h = Math.max(r.height, 56);
    Object.assign(btn.style, { left: `${r.left + (r.width - w) / 2}px`, top: `${r.top + r.height - h}px`, width: `${w}px`, height: `${h}px` });
  });
  box.querySelectorAll('.event-figure').forEach(figure => {
    const at = spots.stands[figure.dataset.stand], sprite = figure.querySelector('img');
    if (!sprite.naturalWidth || !at) return;
    // half the scene's pixel size, like Chansey at the Center, its resting pose (SPRITE_FIT) centred on its feet
    const k = spots.px / 2, { naturalWidth: w, naturalHeight: h } = sprite;
    const [, bottom, fitLeft, fitRight] = spriteFit(sprite.src), flip = figure.classList.contains('flip');
    const [left, right] = flip ? [fitRight, fitLeft] : [fitLeft, fitRight];
    const top = at.y - (h - bottom) * k;
    Object.assign(figure.style, { width: `${w * k}px`, left: `${at.x - (left + (w - left - right) / 2) * k}px`, top: `${top}px` });
    // a stand with a `cut` is behind something (the tutor's desk): the figure ends there
    figure.style.clipPath = at.cut === undefined ? '' : `inset(0 0 ${Math.max(0, top + h * k - at.cut)}px 0)`;
  });
  const vitals = box.querySelector('.event-vitals'), title = $('reward-title');
  if (vitals) vitals.style.top = `${title.getBoundingClientRect().bottom + 10}px`;
  $('reward-screen').style.setProperty('--counter-foot', `${spots.foot}px`);
  liftRoomLog();
  spreadSigns(box);
}
addEventListener('scenepaint', placeEventSpots);

const EVENT_CHOICES = {
  'berry-tree'(event) {
    const heal = Math.min(run.maxHp - run.hp, Math.ceil(run.maxHp * event.eatHeal));
    const grow = perBiome(event.plantMaxHp);
    return { vitals: true, sub: [event.text, 'Eat the berries to heal, or plant one to grow stronger.'], options: [
      spotOption(heal ? `Eat +${heal} HP` : 'Eat', heal ? `Heal ${heal} HP.` : 'You\'re already at full HP.', async () => {
        if (!await playOut('eat')) return;
        run.hp += heal;
        playSound('heal-hp');
        await showHpChange();
        tell(`Healed ${heal} HP.`);
        showMap();
      }),
      spotOption(`Plant +${grow} max HP`, `Max HP +${grow} for the rest of the run.`, async () => {
        if (!await playOut('plant')) return;
        run.maxHp += grow;
        run.hp += grow;
        playSound('stat-up');
        await showHpChange();
        tell(`Max HP +${grow}!`);
        showMap();
      }),
    ] };
  },

  'move-tutor'(event, state, back, react) {
    const price = perBiome(event.price);
    const hpCost = perBiome(event.hpCost);
    // the lesson plays out first (he nods along at the board, or turns to watch you at the sandbag); you pay only once a
    // move is picked, so backing out of the picker is free, and then he nods: well learned
    const teach = (act, pay) => async () => {
      figureDoes('npc', act === 'train' ? 'npc-turn' : 'npc-nod');
      if (await playOut(act)) tutorCards(back, pay, react('npc-nod'));
    };
    return { vitals: true, figures: { npc: { npc: 'tutor' } }, sub: [event.text, `Pay ₽${price}, or train until it hurts (${hpCost} HP), to learn one of 3 rare moves.`], options: [
      spotOption(`Pay ₽${price}`, 'A lesson at the board: learn one of 3 rare moves.', teach('lesson', () => { run.money -= price; setMoney(run.money); }), run.money < price),
      spotOption(`Train -${hpCost} HP`, 'Train until it hurts, then learn one of 3 rare moves.', teach('train', () => loseHp(hpCost)), run.hp <= hpCost),
    ] };
  },

  'move-deleter'(event, state, back, react) {
    const hpCost = Math.ceil(run.maxHp * event.doubleHpCost);
    const canOne = run.deck.length > MIN_DECK;
    const canTwo = run.deck.length > MIN_DECK + 1;
    // he hops for joy once a move is gone, and shakes his head if you back out of his picker
    const gone = react('npc-jump'), refuse = () => { back(); figureDoes('npc', 'npc-no'); };
    // the HP is only paid once the second move is actually forgotten; stopping after one is free
    const second = () => forgetMove(gone, () => { loseHp(hpCost); tell(`Lost ${hpCost} HP.`); gone(); }, 'Stop at one (free)');
    return { vitals: true, figures: { npc: { npc: 'deleter' }, mon: { src: 'assets/pokemon/slowpoke-front.gif' } }, options: [
      spotOption('Forget a move', canOne ? 'Free: he erases one card from your deck.' : `Your deck is at the minimum (${MIN_DECK} cards).`,
        async () => { if (await playOut('erase')) forgetMove(refuse, gone); }, !canOne),
      spotOption(`Forget two -${hpCost} HP`, canTwo ? `The pendulum takes two cards, and ${hpCost} HP.` : `Needs a deck of ${MIN_DECK + 2} cards or more.`,
        async () => { if (await playOut('hypno')) forgetMove(refuse, second); }, !canTwo || run.hp <= hpCost),
    ] };
  },

  'item-ball'(event, state) {
    const damage = Math.min(run.hp - 1, perBiome(event.trapDamage));
    preloadSounds('ball-open', 'hit');
    return { vitals: true, sub: [event.text, 'It could hold a relic. It could also explode.'], options: [
      spotOption('Pick it up', 'A relic... or a Voltorb that explodes.', async () => {
        if (!await playOut('pickup', { trap: state.trap })) return;
        if (!state.trap) return offerRelic('Inside the Item Ball', showMap);
        loseHp(damage);
        await showHpChange();
        tell(`It was a Voltorb! It exploded for ${damage} damage.`);
        showMap();
      }),
    ] };
  },

  'hot-spring'(event) {
    const loss = perBiome(event.soakMaxHpLoss);
    const dip = Math.min(run.maxHp - run.hp, Math.ceil(run.maxHp * event.dipHeal));
    return { vitals: true, sub: [event.text, `Soak in the big pool for a full heal (max HP -${loss}), or take a quick dip.`], options: [
      spotOption('Soak: full HP', `Fully heal to ${run.maxHp - loss}/${run.maxHp - loss} HP, but lose ${loss} max HP.`, async () => {
        if (!await playOut('soak')) return;
        run.maxHp -= loss;
        run.hp = run.maxHp;
        playSound('heal-hp');
        await showHpChange();
        tell(`Fully healed. Max HP -${loss}.`);
        showMap();
      }),
      spotOption(dip ? `Dip +${dip} HP` : 'Dip', dip ? `Heal ${dip} HP, to ${run.hp + dip}/${run.maxHp}.` : 'You\'re already at full HP.', async () => {
        if (!await playOut('dip')) return;
        run.hp += dip;
        playSound('heal-hp');
        await showHpChange();
        tell(`Healed ${dip} HP.`);
        showMap();
      }),
    ] };
  },

  'team-rocket'(event, state, back) {
    const toll = perBiome(event.toll);
    const flee = Math.ceil(run.maxHp * event.fleeHp);
    const node = run.map.byId[run.current];
    const foe = ENEMY_DEFS[state.enemyId];
    return { leave: false, vitals: true, figures: {
      trainer: { src: `assets/trainers/${state.grunt || event.grunts[0]}.gif` },
      mon: { src: foe.image, alpha: true },
    }, sub: [event.text, `Pay ₽${toll}, battle the grunt's Alpha ${foe.name}, or run for it (-${flee} HP).`], options: [
      spotOption(`Pay ₽${toll}`, 'Walk on in peace.', async () => {
        run.money -= toll;
        setMoney(run.money);
        playSound('buy');
        figureDoes('trainer', 'hop');
        if (!await playOut('pay')) return;
        tell(`The grunt took ₽${toll}.`);
        showMap();
      }, run.money < toll),
      spotOption('Battle!', 'Elite fight, elite rewards.', () => fight({ ...node, type: 'elite', enemyId: state.enemyId })),
      spotOption('Run', `Lose ${flee} HP.`, async () => {
        playSound('run-away');
        figureDoes('trainer', 'shake');
        if (!await playOut('run')) return;
        loseHp(flee);
        await showHpChange();
        tell(`Got away, but lost ${flee} HP.`);
        showMap();
      }),
    ] };
  },

  'day-care'(event, state, back, react) {
    const trades = dayCareTrades(event, state);
    return { figures: {
      npc: { npc: 'daycare' }, left: { src: 'assets/pokemon/miltank-front.gif', flip: true }, right: { src: 'assets/pokemon/marill-front.gif' },
    }, options: [
      // she (behind Marill) turns to fetch the trade, and faces you again with a hop once it's done
      spotOption('Trade a move', trades.length ? 'Give a common or uncommon card, get one a rarity higher.' : 'You have no common or uncommon cards they can trade.',
        async () => { figureDoes('npc', 'npc-turn'); if (await playOut('trade')) dayCare(trades, back, react('npc-jump')); }, !trades.length),
    ] };
  },

  'wishing-well'(event, state) {
    const relics = state.relics.map(id => RELICS_BY_ID[id]).filter(r => !run.relics.includes(r.id));
    const canToss = relics.length && run.money >= perBiome(event.tosses[0].price);
    const fish = perBiome(event.fish);
    const fishOption = spotOption(`Fish ₽${fish}`, 'Fish out the coins other trainers tossed in.', () => {
      run.money += fish;
      setMoney(run.money);
      playSound('coins');
      tell(`Fished ₽${fish} out of the well!`);
      showMap();
    });
    return { sub: [event.text, canToss ? 'Toss a coin, or a big one for better odds.' : 'No wish today, but there are coins glinting at the bottom...'], options: event.tosses.map(({ price, odds }, i) => {
      if (i === 0 && !canToss) return fishOption;
      const cost = perBiome(price);
      const hint = relics.length ? `A ${Math.round(odds * 100)}% chance to find a relic.` : 'Nothing down there you don\'t already have.';
      return spotOption(`Toss ₽${cost}`, hint, async () => {
        run.money -= cost;
        setMoney(run.money);
        playSound('buy');
        const win = state.luck < odds;
        if (!await playOut('toss', { big: i > 0, win })) return;
        if (win) return showRelics('Your wish came true!', relics, showMap);
        tell('Plop. Nothing but ripples.');
        showMap();
      }, run.money < cost || !relics.length);
    }) };
  },

  'fan-club'(event) {
    const healthy = run.hp > run.maxHp / 2;
    const item = ITEMS_BY_ID[event.tiredItem];
    const money = perBiome(healthy ? event.healthyMoney : event.tiredMoney);
    const collect = () => { run.money += money; setMoney(run.money); playSound('coins'); tell(`The fans gave you ₽${money}!`); showMap(); };
    const cheer = async (then) => {
      $('reward-options').querySelectorAll('.event-figure').forEach(fan => fan.classList.add('hop'));
      if (await playOut('cheer')) then();
    };
    const view = { vitals: true, figures: { left: { src: 'assets/pokemon/persian-front.gif', flip: true }, right: { src: 'assets/pokemon/cinccino-front.gif' }, npc: { npc: 'chairman' } } };
    const why = 'Healthy Pokémon (over half HP) get prize money; tired ones get looked after.';
    if (healthy) return { ...view, sub: [event.text, why], options: [spotOption('Show off', `The fans are thrilled! They give you ₽${money}.`, () => cheer(collect))] };
    if (run.items.length < itemSlots()) {
      markSeen('items', item.id);
      return { ...view, sub: [event.text, why], options: [spotOption('Accept their gift', `They worry about your Pokémon and give you a ${item.name}.`, () => cheer(() => {
        figureDoes('npc', 'npc-jump');   // the Chairman, as he hands it over
        revealGift(item, [`The fans gave you a ${item.name}!`, item.text], () => {
          run.items.push(item.id);
          tell(`Put the ${item.name} in the Bag.`);
          showMap();
        });
      }))] };
    }
    return { ...view, sub: [event.text, why], options: [spotOption('Accept their gift', `They worry about your Pokémon and give you ₽${money}.`, () => cheer(collect))] };
  },

  'shrine'(event, state) {
    const cost = perBiome(event.offering);
    const relic = state.relics.map(id => RELICS_BY_ID[id]).find(r => !run.relics.includes(r.id));
    if (!relic) return { options: [spotOption('Pray', 'The shrine has nothing left to give you.', () => {}, true)] };
    return { vitals: true, sub: [event.text, `Offer ${cost} HP in prayer, and it will give you ${relic.name}: ${relic.text}`], options: [
      spotOption(`Pray -${cost} HP`, `Receive ${relic.icon} ${relic.name}: ${relic.text}`, async () => {
        if (!await playOut('pray')) return;
        loseHp(cost);
        await showHpChange();
        revealGift(relic, [`The shrine gave you ${relic.name}!`, relic.text], () => gainRelic(relic, showMap));
      }, run.hp <= cost),
    ] };
  },
};

/** The deck's common and uncommon cards, each with the card it trades for (the first rolled one you hold fewer than MAX_COPIES of). */
function dayCareTrades(event, state) {
  const copies = (id) => run.deck.filter(x => baseId(x) === id).length;
  return groupDeck(run.deck, CARDS_BY_ID)
    .filter(({ card }) => !card.evoOnly && event.upgrade[card.rarity || 'common'])
    .map(entry => ({ ...entry, gets: CARDS_BY_ID[state.offers[event.upgrade[entry.card.rarity || 'common']].find(id => copies(id) < MAX_COPIES)] }))
    .filter(entry => entry.gets);
}

function dayCare(trades, back, done = showMap) {
  showChoice({
    title: 'Day Care',
    sub: 'Choose a move to trade. A common comes back uncommon, and an uncommon comes back rare.',
    options: trades.map(({ card, count, gets }) => cardOption(card, run.stage, () => {
      run.deck.splice(run.deck.indexOf(card.id), 1, gets.id);
      tell(`${card.name} was traded for ${gets.name}!`);
      done();
    }, count)),
    skipLabel: 'Back',
    onSkip: back,
  });
}

/** The Move Tutor's lesson: 3 rare moves (or the best on offer if you own every rare), paid for only when one is learned. */
function tutorCards(back, pay, done = showMap) {
  const copies = (id) => run.deck.filter(x => baseId(x) === id).length;
  const rares = poolForType(run.starter.type).filter(c => c.rarity === 'rare' && copies(c.id) < MAX_COPIES);
  const cards = rares.length ? rares.sort(() => Math.random() - 0.5).slice(0, 3) : cardChoices(run, 'boss');
  showChoice({
    title: 'Move Tutor',
    sub: 'Which move should your Pokémon learn?',
    options: cards.map(card => cardOption(card, run.stage, () => {
      pay();
      run.deck.push(card.id);
      tell(`${card.name} added to your deck.`);
      done();
    })),
    skipLabel: 'Back',
    onSkip: back,
  });
}

/* ---------- the Poké Mart ---------- */

const jitter = (price) => Math.round(price * (1 + (Math.random() * 2 - 1) * MART_JITTER));

/** Rolled when the biome starts and saved on the node, so a refresh can't reroll the shelves. */
function martStock() {
  return {
    cards: cardChoices(run, 'fight', MART_STOCK.cards)
      .map(card => ({ id: card.id, price: jitter(MART_CARD_PRICES[card.rarity || 'common']), sold: false })),
    items: itemChoices(run, MART_STOCK.items)
      .map(item => ({ id: item.id, price: jitter(MART_ITEM_PRICES[item.rarity]), sold: false })),
    relics: relicChoices(run).slice(0, MART_STOCK.relics)
      .map(relic => ({ id: relic.id, price: jitter(MART_RELIC_PRICES[relic.rarity]), sold: false })),
  };
}

/** A shop tile: the usual card or relic tile with its price tag underneath, greyed out if you can't afford it. */
/**
 * A Mart tile with its price under it (red when you can't afford it). group places it in the Mart window:
 * 'cards' (the top row), 'items' / 'relics' (rows of icons) or 'service' (forgetting a move).
 * Buying takes two taps: the first blows the tile up with a "Buy" button under it.
 */
function ware(option, price, onBuy, { group, name }) {
  const node = el('div', 'mart-ware');
  const dear = price > run.money;
  node.append(option.node, el('span', `mart-price${dear ? ' too-dear' : ''}`, `💴 ${price}`));
  return {
    node,
    zoom: option.zoom || option.node,
    group,
    disabled: option.disabled || dear,
    ask: `Buy ${name} for ₽${price}?`,
    confirm: `Buy ₽${price}`,
    confirmSound: 'buy',
    onPick: () => { run.money -= price; setMoney(run.money); onBuy(); },
  };
}

/* Purchases are only checkpointed when you leave for the map, so a refresh inside the Mart undoes them along with the money. */
function martRoom() {
  const { stock } = run.map.byId[run.current];
  const copies = (id) => run.deck.filter(x => baseId(x) === id).length;

  const cards = stock.cards.filter(item => !item.sold && copies(item.id) < MAX_COPIES).map(item => {
    const card = CARDS_BY_ID[item.id];
    // a small card on the shelf, blown up full size when you tap it
    const option = { ...cardOption(card, run.stage), zoom: makeCard(card, { stage: run.stage }) };
    option.node.classList.add('small');
    return ware(option, martPrice(item.price), () => {
      item.sold = true;
      run.deck.push(card.id);
      tell(`Bought ${card.name}.`);
      martRoom();
    }, { group: 'cards', name: card.name });
  });

  const bagFull = run.items.length >= itemSlots();
  const items = stock.items.filter(item => !item.sold).map(item => {
    const found = ITEMS_BY_ID[item.id];
    const option = itemOption(found);
    if (bagFull) option.node.append(el('span', 'item-full', 'Bag full'));
    return ware({ ...option, disabled: bagFull }, martPrice(item.price), () => {
      item.sold = true;
      run.items.push(found.id);
      tell(`Bought a ${found.name}.`);
      martRoom();
    }, { group: 'items', name: `the ${found.name}` });
  });

  const relics = stock.relics.filter(item => !item.sold && !run.relics.includes(item.id)).map(item => {
    const relic = RELICS_BY_ID[item.id];
    return ware(relicOption(relic), martPrice(item.price), () => {
      item.sold = true;
      run.relics.push(relic.id);
      tell(`Bought ${relic.name}!`);
      if (relic.id === 'cleanse-tag' && run.deck.length > MIN_DECK) return forgetMove(martRoom, martRoom);
      martRoom();
    }, { group: 'relics', name: `the ${relic.name}` });
  });

  const removalPrice = martPrice(MART_REMOVAL.base + MART_REMOVAL.step * run.removals);
  const atMin = run.deck.length <= MIN_DECK;
  // forgetting a move is the PC on the counter, under a bouncing sign like the Center's; the money is only
  // taken once a card is actually forgotten, so "Back" out of the picker is free, and it needs no Buy step
  const removal = {
    node: martPc(stock.removed ? 'Sold out' : `Forget 💴${removalPrice}`,
      stock.removed ? 'Only one move can be forgotten per Mart.' : atMin ? `Your deck is at the minimum (${MIN_DECK} cards).` : `Remove one card from your deck for ₽${removalPrice}.`),
    group: 'service',
    disabled: stock.removed || atMin || removalPrice > run.money,
    onPick: () => forgetMove(martRoom, () => {
      stock.removed = true;   // once per Mart, like Slay the Spire's card removal
      run.money -= removalPrice;
      run.removals += 1;
      setMoney(run.money);
      martRoom();
    }, undefined, 'buy'),
  };

  showChoice({
    title: 'Poké Mart',
    sub: [`Welcome! You have ₽${run.money} to spend.`, perkLevel('martCard') && `Your Mart Card takes ${Math.round(MART_DISCOUNT[perkLevel('martCard')] * 100)}% off every price.`],
    options: [...cards, ...items, ...relics, removal],
    skipLabel: 'Leave',
    onSkip: showMap,
    layout: 'mart-window',
  });

  // a Bag-pocket sign hanging over the items and the relics shelves
  for (const [group, icon, text] of [['items', itemSprite({ id: 'potion' }), 'ITEMS'], ['relics', '💎', 'RELICS']]) {
    const sign = el('span', `shelf-sign ${group}`);
    sign.setAttribute('aria-hidden', 'true');
    const iconBox = typeof icon === 'string' ? el('span', 'shelf-sign-icon', icon) : icon;
    iconBox.classList.add('shelf-sign-icon');
    sign.append(iconBox, el('span', 'shelf-sign-text', text));
    document.querySelector(`#reward-options .group-${group}`)?.prepend(sign);
  }

  // the shopkeeper at the left end of the counter (the .mart-window grid places it); the counter stays bare (the user's call)
  const clerk = el('img', 'mart-clerk');
  clerk.src = 'assets/pokemon/kecleon-front.gif';
  clerk.alt = 'Kecleon, the shopkeeper';
  $('reward-options').append(clerk);

  fitMart();
  // the room's floor starts at the foot of the counter, so the shop stands on the tiles
  const shop = () => $('reward-options').getBoundingClientRect();
  showPlaceScene('mart', { floor: () => shop().bottom, span: () => [shop().left, shop().right] });

  // on a phone the counter spans the screen, so the plants and ball bins stand in front of it, against its foot
  const props = martProps();
  if (props) {
    const row = el('div', 'mart-props');
    row.setAttribute('aria-hidden', 'true');
    const prop = ({ url, w, h }) => Object.assign(el('img'), { src: url, alt: '', width: w * 4, height: h * 4 });
    row.append(prop(props.plant), prop(props.left), el('span', 'mart-props-gap'), prop(props.right), prop(props.plant));
    $('reward-options').append(row);
  }
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
  $('evolve-from').dataset.stage = String(from);
  $('evolve-to').src = spriteUrl(run.starter, 'front', run.stage);
  $('evolve-to').dataset.stage = String(run.stage);
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
    tell(`${starter.line[0].name} unlocked!`);
  }
}

function endRun(won) {
  run.over = true;
  clearRunData();

  let winCoins = 0;
  if (won) {
    winCoins = awardCoins(levelCoins(COIN_REWARDS.winBonus));
    refreshCoins();

    updateSave(d => {
      d.stats.runsWon += 1;
      d.stats.winsBy[run.starter.id] = (d.stats.winsBy[run.starter.id] || 0) + 1;
      if (run.restCount <= 3) d.stats.lightRestWin = true;
      if (run.restCount === 0) d.stats.noRestWin = true;
      if (run.deck.length <= 15) d.stats.smallDeckWin = true;
      const type = run.starter.type;
      d.stats.maxLevelWinByType[type] = Math.max(d.stats.maxLevelWinByType[type], run.level);
    });

    // Winning on your highest unlocked Trainer Level unlocks the next one.
    if (run.level === getSave().maxLevel && run.level < MAX_LEVEL) {
      run.levelUnlocked = run.level + 1;
      updateSave(d => { d.maxLevel = run.levelUnlocked; });
    }
  }

  announceUnlocks();   // a lost run can still have earned one (and an old save's goals are granted here too)

  const name = stageName(run.starter, run.stage);
  const biome = BIOMES[run.biome];
  $('result-title').textContent = won ? '🏆 You conquered the wastes!' : '💀 Your run has ended';
  $('result-text').textContent = won
    ? `${name} beat all three bosses! Fights won: ${run.fights}. Relics: ${run.relics.length}. Deck: ${run.deck.length} cards.`
    : `${name} fainted in Biome ${run.biome + 1} (${biome.name}) after ${run.fights} won fights. Try a different path or a different starter!`;

  dropNotes();   // the result window lists the unlocks itself
  const list = $('result-unlocks');
  const lines = [...run.unlocks.map(s => `🔓 Unlocked ${s.line[0].name}!`), ...(run.dexNews || []).map(line => `📕 ${line}`)];
  if (run.dexComplete) lines.push(`🏆 Pokédex complete! Every entry's research is done: +${coinsWithBonus(DEX_COMPLETE_COINS)} PokéCoins.`);
  if (won) lines.unshift(`💰 +${winCoins} PokéCoins for winning!`);
  if (run.levelUnlocked) lines.push(`⭐ Trainer Level ${run.levelUnlocked} unlocked: ${LEVELS[run.levelUnlocked].name}!`);
  list.replaceChildren(...lines.map(text => el('li', '', text)));
  list.hidden = lines.length === 0;
  $('result-again').textContent = 'New run';
  openDialog('result-dialog');
}
