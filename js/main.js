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
     deckpreview.js  the run's deck window (read-only, sort and filter)
     settings.js     the Pokédex's Settings toggles (battle speed, end-turn warning)
     run.js          one run: the map loop, rewards, evolution, the end
     map.js          building and drawing the branching map
     rewards.js      the "choose one" screen
     battle.js       the fight
     records.js      the Stats and Achievements windows
     howto.js        the swipeable How to play window
     title.js        the title screen: PRESS START, then the gem menu (home)
     select.js       the character select (New game)
     collection.js   the Collection: the device's home screen of apps (Pokédex, Moves, Relics, Items, Stats...)
     device.js       the Collection device: the handheld's cover, screen, apps and D-pad / A / B
     tips.js         tap-to-read hints (an element's title) on touch screens
     cloud.js        the optional cloud save (Firebase sign-in, from the Pokédex's Settings)
   ============================================================ */

import { STARTERS, STARTERS_BY_ID, spriteUrl, stageName, useShinies } from './data/starters.js';
import { gateHp } from './gate.js';
import { BIOMES, BIOMES_BY_ID, biomeAt, canWalk, FORKS, forkRoads, LEGACY_ROADS, POOL } from './data/enemies.js';
import { MAX_LEVEL } from './data/difficulty.js';
import { getSave, updateSave, clearRunData, loadRunData, isShiny } from './storage.js';
import { checkBadges } from './progress.js';
import { seedGate } from './data/gate.js';
import { DEPTHS_PAGE } from './data/pokedex.js';
import { safariTicket } from './daypass.js';
import { initRun, beginRun, beginSafari, abandonRun, forfeitRun,suspendRun, isRunActive, loadSavedRun, hasSavedRun, continueRun, runBiome, runSafariArea, peekEvent, peekSafariBoss, peekFinalBoss, peekDescent, peekBiome, isPeeking, playGate, beginTower, peekTower } from './run.js';
import { initTowerPrep, openTowerPrep } from './towerprep.js';
import { bootDevice } from './device-boot.js';
import { floorOf, towerWeekly } from './data/tower.js';
import { climbIntro } from './climb-intro.js';
import { initBattle } from './battle.js';
import { toggleShop, initShop } from './shop.js';
import { initAudio, playMusic } from './audio.js';
import { initSettings } from './settings.js';
import { initHowto, openHowto } from './howto.js';
import { initPatchNotes } from './patchnotes.js';
import { initTitle, showTitle, showHome, leaveTitle, eternatusGuest } from './title.js';
import { initSelect, showSelect, refreshSelect, pickedStarter, prepare } from './select.js';
import { initCollection, showCollection, openPokedex } from './collection.js';
import { hideDevice } from './device.js';
import { smoothIcon } from './smooth-icons.js';
import { initPlayTime } from './trainercard.js';
import { initTips } from './tips.js';
import { initPixelIcons } from './icons.js';
import { initPokedex } from './pokedex.js';
import { initLeaderboard, openLeaderboard } from './leaderboard.js';
import { initSafariPrep, openSafariPrep } from './safariprep.js';
import { initCloud } from './cloud.js';
import { $, el, openDialog, confirmDialog } from './ui.js';
import { bossArenaPrelude, showPlaceScene, showScene } from './scene.js';
import { SAFARI_AREAS, SAFARI_AREAS_BY_ID } from './data/safari.js';
import { stageOf } from './map.js';
import { biomeIntro, placeIntro } from './biome-intro.js';
import { travel, hasTravel } from './travel.js';
import { crossroads } from './crossroads.js';

/* ---------- moving between screens ---------- */

/** The saved run as the title's Continue gem shows it, or null. */
function savedRunCard() {
  const saved = loadSavedRun();
  if (!saved) return null;
  const { starter, stage, biome, hp, maxHp } = saved;
  const here = saved.current && saved.map.byId[saved.current];
  // a Safari run is in today's area, not the main game's biome: the same names as its map's signs
  const area = saved.safari && SAFARI_AREAS_BY_ID[saved.safari.areas?.[biome]];
  const land = area || biomeAt(saved.route, biome);
  return {
    saved, hp, maxHp,
    floor: saved.tower ? floorOf(saved.tower.flight, here ? here.floor : -1) : here ? here.floor + 1 : 0,   // the biome's floor you stand on; 0 on the road in, like StS's Neow floor (a climb's: the tower's)
    sprite: spriteUrl(starter, 'front', stage),
    name: stageName(starter, stage),
    place: saved.tower ? 'Sky Pillar' : area ? `Safari Zone: ${area.name}` : land?.name ?? `Biome ${biome + 1}`,
    spot: saved.tower ? `Floors ${saved.tower.flight * 10 + 1}-${saved.tower.flight * 10 + 10}` : land?.stages?.[stageOf(saved.map, here).stage],   // the place in it you stand in, as the map's board says
    biome: land?.id,
    safari: !!area,
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
  const dev = document.querySelector('.seldev');
  bootDevice(dev, { below: dev.querySelector('.tdev-lid'), screen: dev.querySelector('.sel-stage') });
}

/** Continue: the map, its Pokédex opening on the run (not a Sky Pillar climb, whose map is the tower). */
function continueGame(saved) {
  leaveTitle();
  const film = continueRun(saved);   // a place's walk-on film, if the run stood at a place's end: the boot comes after it
  const map = $('map-screen');
  if (!map.hidden && !map.classList.contains('tower')) bootDevice(map, { screen: map.querySelector('.mdex-window'), after: film });
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
// leaving from a fight or room means replaying it, as a refresh would. True once it has gone.
async function requestMenu() {
  if (isRunActive()) {
    if (document.body.dataset.screen !== 'map-screen'
      && !(await confirmDialog('Back to the menu? Your run is saved, but this room will start over when you continue.', 'Menu'))) return false;
    suspendRun();
    showHome();
    return true;
  }
  goHome();
  return true;
}

/** Throw the run away for good (the user's ask): from the Pokédex's Settings, or the title's Escape Rope, which has
    already asked in its own bubble (`sure`). True once it has gone. */
async function requestAbandon(sure) {
  if (!hasSavedRun() && !isRunActive()) return false;
  if (sure !== true && !(await confirmDialog('Abandon this run? It will be gone for good.', 'Abandon'))) return false;
  forfeitRun();
  if (!isPeeking()) clearRunData();   // a ?event= playtest run leaves the real saved run alone
  showHome();
  return true;
}

/* ---------- the Pokédex (top left) ---------- */

function initPokedexButton() {
  // a run's Pokédex apps open on the page it stands on: a Safari run's own Pokédex on its area (its catches never touch
  // the main one), else the main Pokédex on its biome
  // on the map, which already is the device, the button is the device's own Home key (css/screens.css)
  const key = document.createElement('span');
  key.className = 'home-key';
  key.setAttribute('aria-hidden', 'true');
  key.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 11.2 12 4.5l8 6.7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<path d="M6.6 10v8.6a1.4 1.4 0 0 0 1.4 1.4h2.6v-5h2.8v5H16a1.4 1.4 0 0 0 1.4-1.4V10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>';
  $('brand-btn').append(key);
  $('brand-btn').addEventListener('click', () => openPokedex({ dex: runBiome(), safari: runSafariArea() }));
  // leaving from inside the device puts it away once the confirm (if any) has said yes
  $('abandon-btn').addEventListener('click', async () => { if (await requestAbandon()) hideDevice(); });
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
  // ?lockdepths forgets the Crystal Depths' Pokédex page and how deep runs have gone, for a save whose playtests (before
  // peeked runs stopped counting) revealed the page early. Not while a saved run is down there.
  if (query.has('lockdepths') && !(loadRunData()?.starter === 'mewtwo' && loadRunData().biome >= 3)) {
    const deep = new Set([...DEPTHS_PAGE.ids, 'eternamax']);
    updateSave(d => {
      d.dex.seen = d.dex.seen.filter(id => !deep.has(id));
      d.dex.defeated = d.dex.defeated.filter(id => !deep.has(id));
      for (const id of deep) delete d.dex.count?.[id];
      d.dex.done = d.dex.done.filter(b => b !== DEPTHS_PAGE.biome);
      d.stats.deepestBiome = Math.min(d.stats.deepestBiome, 3);
    });
  }
  checkBadges();   // an old save gets every badge it can already prove, on day one (a quiet grant: no line)
  initAudio();
  initSettings();
  initTips();
  initPlayTime();
  initHowto();
  // The top bar has no background, so once the page scrolls a fade keeps its numbers off whatever slides under them.
  const markScrolled = () => document.body.classList.toggle('scrolled', scrollY > 4);
  addEventListener('scroll', markScrolled, { passive: true });
  initBattle();
  // the result window sits over the battle screen: the finished run goes, and the character select comes up under Prepare
  initRun({ onMenu: goHome, onNewRun: (starter) => { abandonRun(); showSelect(starter); previewStarter(starter); } });

  initShop();
  $('shop-btn').addEventListener('click', () => toggleShop());

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
  initPokedex();
  initPokedexButton();
  initCloud();
  initLeaderboard();
  initSafariPrep({
    onStart: async () => {
      if (!(await safariTicket())) return openSafariPrep();
      if (hasSavedRun() && !(await confirmDialog('Start today\'s Safari Zone run? Your saved run will be lost.', 'Start'))) return openSafariPrep();
      leaveTitle();
      beginSafari();
    },
  });

  initTowerPrep({
    onStart: async (practice) => {
      if (hasSavedRun() && !(await confirmDialog('Start a Sky Pillar climb? Your saved run will be lost.', 'Climb'))) return openTowerPrep();
      const climber = practice ?? towerWeekly().starter;
      const close = await climbIntro({ starter: climber, shiny: getSave().shiny.on.includes(climber.id) });
      leaveTitle();
      beginTower(practice);
      close();
    },
  });

  initTitle({
    savedRun: savedRunCard,
    onContinue: continueGame,
    onNewGame: () => newGame(),
    onCollection: () => { showCollection(); leaveTitle(); },
    onSafari: openSafariPrep,
    onTower: openTowerPrep,
    onBoard: () => openLeaderboard(),
    onGate: (mewtwo) => { newGame(mewtwo); previewStarter(mewtwo); },   // the broken gate: straight to Mewtwo's Prepare step
    onAbandon: requestAbandon,
  });
  $('dock-menu').querySelector('.mdex-ico').append(smoothIcon('home'));
  $('dock-menu').addEventListener('click', () => requestMenu());
  $('room-home').querySelector('.mdex-ico').append(smoothIcon('home'));
  $('room-home').addEventListener('click', () => $('brand-btn').click());
  $('reward-skip').prepend(el('span', 'leave-ico'));
  $('reward-skip').firstChild.append(smoothIcon('leave'));   // only shown while it's the room bar's Leave key
  initSelect({ onChoose: previewStarter, onBack: showHome });
  initCollection({
    onBack: showHome,
    menu: async () => { if (await requestMenu()) hideDevice(); },
    abandonable: () => isRunActive() || hasSavedRun(),
  });

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
  // ...and ?bossfight=wetland (any Safari area; &starter=id) walks one straight into that area's boss fight, prelude and arena included
  // ?bossfight=depths: Mewtwo (or &starter=id) straight into Eternatus, the final boss; &hp=0.1 shrinks its bars
  // ?tower=25: a throwaway Sky Pillar climb starting at that floor (the week's tower and starter), never saved; &hp=0.1
  // shrinks every foe's HP
  if (params.get('tower')) return peekTower(Number(params.get('tower')), Number(params.get('hp') ?? 1), (params.get('aug') || '').split(',').filter(Boolean));
  if (params.get('bossfight') === 'depths') eternatusGuest();   // back on the title, it crosses the sky
  if (params.get('bossfight') === 'depths') return peekFinalBoss(STARTERS_BY_ID[params.get('starter') ?? 'mewtwo'], Number(params.get('hp') ?? 1));
  // ?descent=mewtwo: Mewtwo's fall into the Crystal Depths after its biome 3 boss, then the Depths' film and map
  if (params.get('descent') === 'mewtwo') return peekDescent(STARTERS_BY_ID.mewtwo);
  // ?biome=ruins (any biome; &starter=id, &level=0-5; &slot=1 or 2 walks a pool biome at that fork): a throwaway run
  // starting in that biome, on the road through it
  if (params.get('biome') && peekBiome(STARTERS_BY_ID[params.get('starter')] ?? STARTERS.find(s => s.free), params.get('biome'), Number(params.get('level') ?? 0), Number(params.get('slot')) || null)) return;
  if (SAFARI_AREAS.some(a => a.id === params.get('bossfight'))) return peekSafariBoss(params.get('bossfight'), STARTERS_BY_ID[params.get('starter')]);

  showSelect();   // under the title, so the menu scene is ready behind it
  showTitle().then(() => {
    // ?strike=90 (with &gate=HP, &starter=id, &stage=0-2, &level=0-5, &kind=loss, &first) plays the descent and the Sealed Gate's scene after PRESS START,
    // from the gate's HP, without saving anything; a strike past its HP is the break that frees Mewtwo
    if (params.has('strike')) return peekStrike(params);
    // ?travel=shrine (the biome you walk to; &starter=id, &stage=0-2) plays that journey film after PRESS START, its
    // first-time lines included, without saving anything; &at=0.5 holds it at that point of the trip, no lines
    if (params.has('travel')) return peekTravel(params);
    // ?crossroads (&starter=id, &stage=0-2) shows the fork after Biome 1's boss after PRESS START; the road taken plays its
    // journey film if it has one, then the title comes back. Nothing is saved. &slot=2 is the fork after Biome 2's boss
    // (&from=ruins walks it from the Ruins); &road=savanna is the pool biome it offers beside the default
    if (params.has('crossroads')) return peekCrossroads(params);
    // ?climb (&starter=id) plays the Sky Pillar's opening film after PRESS START, then a throwaway climb from floor 1
    if (params.has('climb')) return peekClimb(params);
    // Show the how-to-play once, the very first time.
    if (!getSave().seenHelp) {
      updateSave(d => { d.seenHelp = true; });
      setTimeout(openHowto, 400);
    }
  });
}

/** The Safari areas' scenes, a floor at a time as you'd walk them (a playtest view: no run, nothing saved): floors 1-3,
    4-6 and 7-10 are an area's first three places (stageOf() in js/map.js), then the boss's. Each area opens with its
    intro film and each later place with its walk on, as a run plays them (&intro=0 leaves them out). */
const PEEK_FLOORS = 11, PLACE_START = [0, 3, 6, 10];
function peekSafari(params) {
  document.body.classList.add('scene-peek');
  const AREAS = BIOMES_BY_ID[params.get('area')] ? Object.values(BIOMES_BY_ID) : SAFARI_AREAS;   // a main biome too: ?area=depths, ?area=ruins
  let i = Math.max(0, AREAS.findIndex(a => a.id === params.get('area')));
  let floor = PLACE_START[Math.min(3, Math.max(0, +params.get('stage') || 0))];
  const kind = params.get('kind') || 'wild', label = el('div', 'peek-label');
  document.body.append(label);
  const films = params.get('intro') !== '0', walker = spriteUrl(STARTERS.find(s => s.free), 'back', 0);
  let busy = false, shown = -1, boss = false;
  // the boss's place plays its prelude too, after its walk-on; a tap there plays it again, a tap on the label walks on
  const play = (steps) => { busy = true; steps.reduce((done, step) => done.then(step), Promise.resolve()).then(() => { busy = false; }); };
  const show = () => {
    const area = AREAS[i], stage = PLACE_START.findLastIndex(f => floor >= f);
    const key = i * 4 + stage, steps = [];
    if (key !== shown && films) steps.push(() => stage === 0 ? biomeIntro(area, i + 1) : placeIntro(area, stage, walker));
    shown = key;
    boss = stage === 3 && kind !== 'elite';
    showScene(area.id, boss ? 'boss' : kind, { progress: (floor + 1) / PEEK_FLOORS, stage, step: floor - PLACE_START[stage], seed: 1000 + i * 37 });
    label.textContent = boss ? `${area.name}, boss: ${area.stages[3]}. Tap to replay, tap here for the next.`
      : `${area.name}, floor ${floor + 1}: ${area.stages[stage]}. Tap for the next.`;
    if (boss) steps.push(bossArenaPrelude);
    if (steps.length) play(steps);
  };
  addEventListener('pointerup', (e) => {
    if (busy) return;
    if (boss && e.target !== label) { play([bossArenaPrelude]); return; }
    if (++floor >= PEEK_FLOORS) { floor = 0; i = (i + 1) % AREAS.length; }
    show();
  });
  show();
}

/** The ?strike= playtest: the descent and the gate scene on their own, nothing saved (`?gate=0&strike=0`: the open gate). */
function peekStrike(params) {
  const starter = STARTERS_BY_ID[params.get('starter')] ?? STARTERS.find(s => s.free);
  const stage = Math.min(starter.line.length - 1, Number(params.get('stage')) || 0);
  const before = gateHp(), hit = Math.max(0, Number(params.get('strike')) || 0);
  const after = Math.max(0, before - hit);
  const kind = params.get('kind') || (before === 0 ? 'open' : after === 0 ? 'ultimate' : 'win');
  playGate({ starter, stage, before, after: kind === 'loss' ? before : after, kind, level: Number(params.get('level')) || 0, first: params.has('first'), land: params.get('land') || 'wastes', music: 'title' })
    .then((close) => { close?.(); playMusic('title'); });   // back to the title's song after the seal's
}

/** The ?travel= playtest: a journey film on its own, nothing saved. `?travel=ruins` comes from the Clearing; `&from=ruins`
    takes the other road's trip to the Wastes (a pool biome before a fork stands at the first one). */
async function peekTravel(params) {
  const from = BIOMES_BY_ID[params.get('from')], dest = BIOMES_BY_ID[params.get('travel')];
  const to = from ? (POOL.includes(from.id) ? FORKS[0] : from.slot) + 1 : dest?.slot ?? -1;
  const starter = STARTERS_BY_ID[params.get('starter')] ?? STARTERS.find(s => s.free);
  const stage = Math.min(starter.line.length - 1, Number(params.get('stage') ?? to) || 0);
  const at = params.has('at') ? Number(params.get('at')) : null;   // &at=0.5 holds the film there
  const close = await travel({ from: params.get('from') ?? BIOMES[to - 1]?.id, to: dest?.id, starter, stage, shiny: getSave().shiny.on.includes(starter.id), first: at === null, at, flyer: params.get('flyer') });
  close();
}

/** The ?crossroads playtest: the fork after Biome 1 (or &slot=2's), then the road taken's journey film. Nothing is saved. */
async function peekCrossroads(params) {
  const starter = STARTERS_BY_ID[params.get('starter')] ?? STARTERS.find(s => s.free);
  const slot = FORKS.includes(Number(params.get('slot'))) ? Number(params.get('slot')) : FORKS[0];
  const stage = Math.min(starter.line.length - 1, Number(params.get('stage') ?? slot) || 0), shiny = getSave().shiny.on.includes(starter.id);
  const from = canWalk(params.get('from'), slot - 1) ? params.get('from') : BIOMES[slot - 1].id;
  const road = [params.get('road'), LEGACY_ROADS[slot], ...POOL].find(id => POOL.includes(id) && id !== from);
  const fork = await crossroads({ ids: forkRoads(slot, { [slot]: road }), starter, stage, shiny });
  const close = hasTravel(from, fork.id) ? await travel({ from, to: fork.id, starter, stage, shiny, first: true }) : null;
  fork.close();
  close?.();
}

/** The ?climb playtest: the Sky Pillar's opening film, then ?tower=1's throwaway climb. Nothing is saved. */
async function peekClimb(params) {
  const starter = STARTERS_BY_ID[params.get('starter')] ?? towerWeekly().starter;
  const close = await climbIntro({ starter, shiny: getSave().shiny.on.includes(starter.id) });
  leaveTitle();
  peekTower(1);
  close();
}

init();
