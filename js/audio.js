/* ============================================================
   audio.js  -  background music and sound effects.

   MUSIC: one looping track plays at a time: 'title' on the menus,
   'map1' / 'map2' / 'map3' on each biome's map, 'wild' / 'elite' / 'boss'
   during fights, 'victory' ('trainer-victory' after an Alpha or a boss) from the moment an enemy faints until you're
   back on the map, and 'center' at a Pokémon Center. Switching tracks
   crossfades.

   Why the Web Audio API instead of plain <audio> elements: iPhones ignore
   an <audio> element's .volume, so fades would be impossible there. Each
   track's <audio> element is routed through its own GainNode instead.

   Each music file is only downloaded the first time its track is needed,
   so nobody downloads boss music just by opening the page.

   SOUND EFFECTS (like the Pokémon Center chime) are short clips decoded
   into memory, so they play without delay and can overlap. A missing
   effect file is simply silent.

   CRIES are one clip per Pokémon in assets/audio/cries/, named by sprite
   id. Only one plays at a time: a new cry cuts the previous one.

   Browsers refuse to play sound until the player has tapped or pressed a
   key, so the first track requested is held until then (see unlock()).
   The 🔊 button mutes music and effects together.
   ============================================================ */

import { getSave, updateSave } from './storage.js';
const $ = (id) => document.getElementById(id);   // not imported from ui.js, which imports this file

const TRACKS = {
  title:   'assets/audio/title.mp3',
  wild:    'assets/audio/wild.mp3',
  elite:   'assets/audio/elite.mp3',
  boss:    'assets/audio/boss.mp3',
  center:  'assets/audio/center.mp3',
  victory: 'assets/audio/victory.mp3',                  // after a wild fight
  'trainer-victory': 'assets/audio/trainer-victory.mp3',   // after an Alpha (Team Rocket's too) or a boss: Red/Blue's trainer victory, the user's pick
  map1:    'assets/audio/map1.mp3',      // one theme per biome, played on its map
  map2:    'assets/audio/map2.mp3',
  map3:    'assets/audio/map3.mp3',
  map4:    'assets/audio/map3.mp3',   // PLACEHOLDER: the Crystal Depths borrow the Wastes' theme until its own map4.mp3 arrives
  evolution: 'assets/audio/evolution.mp3',   // the evolution scene (evolution.js), cut as the new form cries
  'hall-of-fame': 'assets/audio/hall-of-fame.mp3',   // the Hall of Fame scene after a Level 5 win (halloffame.js)
  'run-win': 'assets/audio/run-win.mp3',             // the same scene after any other won run
  kombat:  'assets/audio/kombat.mp3',   // Chad Master Kenmatta's fight (KEN.music), the user's: an 8-bit Mortal Kombat theme
};
// The battle files are hard-cut clips of songs that go on repeating, so looping the whole file jumped from mid-phrase back
// to the intro (the user found it broke the immersion). These loop inside the file instead, seamlessly: [loopStart,
// loopEnd] in seconds, loopEnd - loopStart being the song's own repeat, found by correlating the file against itself
// (both points sit well inside the part that repeats, so a decoder's few ms of padding doesn't matter).
const LOOP_POINTS = {
  wild:  [47.31002, 126],   // intro ~14 s, then a 78.69 s phrase
  elite: [62.50379, 146],   // 83.50 s
  boss:  [117.35612, 178],  // 60.64 s
  // The map files are one pass of their song, then a fade-out over its start coming round again. That start matches
  // the file's own in melody and beat (chroma and onsets, 0.95-0.99) but not sample for sample, so these cross-fade
  // (the third number, seconds) over the join, phase-aligned, instead of fading out and restarting.
  map1:  [7.26172, 45.44, 0.3],    // 38.18 s
  map2:  [3.79134, 63.27, 0.3],    // 59.48 s
  map3:  [1.02, 39.2, 0.3],        // 38.18 s, the whole song
  map4:  [1.02, 39.2, 0.3],        // map3's, while it plays map3.mp3
  victory: [4.20957, 15.46, 0.3],   // the fanfare, then an 11.25 s loop the file starts again before it fades (chroma 0.985 over 6 s)
  'trainer-victory': [2.40018, 24.92, 0.3],   // the fanfare, then a 22.52 s loop (chroma 0.98); the file fades out after
  kombat: [30, 115.97016, 0.3],   // an 85.97 s repeat (0.81 sample correlation at the join, so cross-faded); the file fades out at 194 s
};
// A track whose file isn't there yet plays another in its place (the user supplies these MP3s later).
const TRACK_FALLBACK = { 'hall-of-fame': 'victory', 'run-win': 'victory', 'trainer-victory': 'victory', kombat: 'boss' };
const missing = new Set();   // tracks whose file failed to load
// Files come mastered at very different loudness, so each can be boosted
// (or cut) on top of SFX_VOLUME. `gain` defaults to 1. `start`/`length` (seconds)
// play just part of a file, fading out at the end, so a long one can be trimmed without re-encoding.
// `synth` builds the sound in code instead of loading a file.
const SOUNDS = {
  heal:  { url: 'assets/audio/sfx/heal.mp3', gain: 0.5 },   // the Pokémon Center chime
  card:  { url: 'assets/audio/sfx/card.mp3', gain: 0.3 },    // a card is played: as quiet as confirm, its twin (the user's call)
  confirm: { url: 'assets/audio/sfx/card.mp3', gain: 0.3 },  // any other window's confirm (Add to deck, Forget it, Yes...) and the menu blip: same file as card (the user's call), much quieter (the user found it too loud)
  hit:   { url: 'assets/audio/sfx/hit.mp3' },     // damage gets through, either way
  'hit-super': { url: 'assets/audio/sfx/hit-super.mp3' },  // ...super effectively (falls back to hit)
  'hit-weak':  { url: 'assets/audio/sfx/hit-weak.mp3' },   // ...not very effectively (falls back to hit)
  block: { synth: blockClink, gain: 0.5 },   // you gain block, or a hit is fully blocked: made in code (the user's call), no file
  faint: { url: 'assets/audio/sfx/faint.mp3' },   // the enemy faints
  buy:   { url: 'assets/audio/sfx/buy.mp3' },     // a Poké Mart purchase
  event: { url: 'assets/audio/sfx/event.mp3' },   // walking into a ? event
  item:  { url: 'assets/audio/sfx/item.mp3' },    // an item is used
  potion: { url: 'assets/audio/sfx/potion.mp3' }, // a healing item is used (heal.mp3 stays the Pokémon Center's own)
  'ball-throw': { url: 'assets/audio/sfx/ball-throw.mp3' },   // the battle intro's Poké Ball is thrown
  'ball-open':  { url: 'assets/audio/sfx/ball-open.mp3' },    // ...and pops open (and the Continue card's ball)
  'stat-up':    { url: 'assets/audio/sfx/stat-up.mp3' },      // strength or focus gained, either side
  'stat-down':  { url: 'assets/audio/sfx/stat-down.mp3' },    // the enemy gets Weak or Vulnerable
  'item-get':   { url: 'assets/audio/sfx/item-get.mp3' },     // a relic or item is received (not bought: that's buy)
  'low-hp':     { url: 'assets/audio/sfx/low-hp.mp3', gain: 0.35 },   // looped by setLoop() while your HP is at 20% or below in battle; quiet (the user's call)
  'heal-hp':    { url: 'assets/audio/sfx/potion.mp3' },       // a card or power heals you in battle: the potion's file (the user's call); never the Center's heal
  power:        { url: 'assets/audio/sfx/power.mp3' },        // a power card is played (the Power Lens pop-up)
  burn:         { url: 'assets/audio/sfx/burn.mp3' },         // burn damage ticks on the enemy
  stick:        { synth: stickTick },                         // the Game Corner's joystick moves the cursor: made in code (the user's call)
  thunder:      { url: 'assets/audio/sfx/thunder.mp3' },      // a lightning bolt in a boss's storm
  coins:        { url: 'assets/audio/sfx/buy.mp3' },          // a fight's PokéCoins and ₽ are paid out: the Mart's buy file (the user's call)
  door:         { url: 'assets/audio/sfx/event.mp3' },        // walking into a Poké Mart or Pokémon Center: the same sound as a ? room (the user's call)
  achievement:  { url: 'assets/audio/sfx/achievement.mp3' },  // an achievement unlocks a starter
  cancel:       { url: 'assets/audio/sfx/bag.mp3' },          // Back / Skip / Leave, closing a window, backing out of a pick: the Bag's file (the user's call)
  bag:          { url: 'assets/audio/sfx/bag.mp3' },          // the Bag is opened
  'run-away':   { url: 'assets/audio/sfx/run-away.mp3' },     // you get away: the Poké Doll, or Team Rocket's "Run for it"
  evolved:      { url: 'assets/audio/sfx/evolved.mp3', gain: 0.55 },   // "Congratulations! Your X evolved into Y!" (evolution.js); mastered ~5 dB over item-get
  'no-pp':      { url: 'assets/audio/sfx/no-pp.mp3', gain: 0.5 },   // a card is tapped without enough PP left (the greyed-out ones): a dense buzz, so at half gain
  'pc-on':      { url: 'assets/audio/sfx/pc-on.mp3' },        // the games' PC booting up: only the title's Sign in PC (the user's call)
  'pc-off':     { url: 'assets/audio/sfx/pc-off.mp3' },       // ...and logging off as that window closes, in place of cancel
  fortify:      { url: 'assets/audio/sfx/fortify.mp3', gain: 0.8 },   // Kenmatta's FORTIFY YOUR MIND: Wong's shout (the user's clip); also his Mata-Mindset's extra draw each turn
  'fw-launch':  { synth: fireworkLaunch },   // the Hall of Fame's fireworks (celebrate.js): a rocket whistles up...
  'fw-pop':     { synth: ac => fireworkPop(ac, 0.45, 90, 0.16) },   // ...and bursts
  'fw-boom':    { synth: ac => fireworkPop(ac, 1.1, 55, 0.22) },    // ...the finale's biggest one
  'fw-crackle': { synth: fireworkCrackle },  // ...and a crackler fizzes out
  quake:        { synth: quakeRumble },      // the Wastes' boss arena: the crater rumbles before it erupts (scene.js)
  eruption:     { synth: ac => fireworkPop(ac, 2.2, 38, 0.26) },   // ...and blows
  bloom:        { synth: ac => powerSurge(ac, [523, 659, 784, 1047, 1319, 1568], 2) },     // the Clearing's: the ancient tree's heart bursts
  bell:         { synth: templeBell },       // the Shrine's: the temple bell tolls three times...
  spirit:       { synth: ac => powerSurge(ac, [440, 523, 622, 880, 1047, 1245], 2.4) },   // ...and the spirits surge
  rustle:       { synth: grassRustle },      // a wild Pokémon pops out of the tall grass in a biome's intro (biome-intro.js)
  'biome-title': { synth: arrivalChime },    // ...and the biome's name lands: a bright, welcoming chime
  'furin-0':    { synth: ac => windChime(ac, 1568), gain: 0.6 },   // the Shrine's intro: a wind chime as each pair of lanterns lights...
  'furin-1':    { synth: ac => windChime(ac, 1760), gain: 0.6 },
  'furin-2':    { synth: ac => windChime(ac, 2093), gain: 0.6 },
  'bell-far':   { synth: templeBell, gain: 0.5 },   // ...and the Main Hall's bell tolls far off as it comes into view
  gust:         { synth: hotGust },          // the Wastes' intro: a hot wind as you burst out of the ash cloud...
  'rumble-far': { synth: farRumble },        // ...and the volcano huffs, far off, as its name lands
  // the Safari Zone's catch (battle.js): each wobble of the ball on the ground, then the latch and jingle of a catch. The
  // user's own files once they're in assets/audio/sfx/; until then (or if one fails to load) the synth stands in
  'catch-shake':   { url: 'assets/audio/sfx/catch-shake.mp3', synth: catchShake, gain: 0.25 },
  'catch-shake-2': { url: 'assets/audio/sfx/catch-shake-2.mp3', synth: catchShake, gain: 0.25 },   // the user's recording's 2nd and 3rd wobbles
  'catch-shake-3': { url: 'assets/audio/sfx/catch-shake-3.mp3', synth: catchShake, gain: 0.25 },
  'catch-success': { url: 'assets/audio/sfx/catch-success.mp3', synth: catchSuccess, gain: 0.35 },
  'gate-hum':   { synth: gateHum },          // the Sealed Gate's scene (gatescene.js): the seal's low, uneasy drone...
  'gate-crack': { synth: gateCrack },        // ...a hit cracks it, or a chain snaps...
  'gate-shatter': { synth: gateShatter },    // ...and the door blows apart in crystal shards
};
const SFX_MIN_GAP = 0.07;     // seconds: the same effect asked for again sooner than this is dropped
// Sprite ids that have a file in assets/audio/cries/. Listed rather than probed so
// Pokémon without a cry stay silent instead of logging a 404 every fight.
const CRIES = new Set([
  'charmander', 'charmeleon', 'charizard', 'bulbasaur', 'ivysaur', 'venusaur',
  'squirtle', 'wartortle', 'blastoise',
  'cyndaquil', 'quilava', 'typhlosion', 'chikorita', 'bayleef', 'meganium',
  'totodile', 'croconaw', 'feraligatr', 'tepig', 'pignite', 'emboar',
  'snivy', 'servine', 'serperior', 'oshawott', 'dewott', 'samurott',
  'torchic', 'combusken', 'blaziken', 'treecko', 'grovyle', 'sceptile',
  'mudkip', 'marshtomp', 'swampert', 'chimchar', 'monferno', 'infernape',
  'turtwig', 'grotle', 'torterra', 'piplup', 'prinplup', 'empoleon',
  'moltres', 'virizion', 'suicune', 'mewtwo', 'entei', 'celebi', 'kyogre', 'hooh', 'lugia', 'palkia',
  'reshiram', 'victini', 'heatran', 'manaphy', 'keldeo', 'rayquaza',
  'vulpix', 'growlithe', 'pansear', 'oddish', 'hoppip', 'seedot', 'poliwag', 'psyduck',
  'marill', 'rattata', 'sentret', 'zigzagoon', 'litwick', 'houndour', 'darumaka', 'bellsprout',
  'paras', 'cherubi', 'krabby', 'slowpoke', 'shellos', 'teddiursa', 'aipom', 'stantler',
  'magmar', 'torkoal', 'heatmor', 'tangela', 'cacturne', 'maractus', 'staryu', 'crawdaunt',
  'sharpedo', 'tauros', 'bouffalant', 'zangoose',
  'raticate', 'furret', 'linoone', 'ambipom', 'persian', 'watchog',
  'purugly', 'cinccino', 'lopunny',
  'snorlax', 'kangaskhan', 'miltank', 'ursaring', 'stoutland', 'exploud',
  'slaking', 'regigigas', 'lickilicky', 'porygonz',
  'crobat', 'sableye', 'gigalith', 'steelix', 'excadrill', 'haxorus', 'golurk', 'bronzong',
  'claydol', 'dusknoir', 'lanturn', 'magnezone', 'clefable', 'ditto', 'smeargle', 'eternatus',
]);
const MUSIC_VOLUME = 0.375;   // 0-1
const SFX_VOLUME = 0.6;       // 0-1
const CRY_VOLUME = 0.12;      // 0-1, low because the cry files are mastered ~4x louder than the music
const FADE = 0.8;             // seconds for a crossfade
// On touch screens only the END of a tap (touchend / pointerup / click) counts as
// a gesture that may start sound; pointerdown works with a mouse but not a finger.
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];

let ctx = null;            // the AudioContext, created the first time any sound is needed
let musicBus = null;       // gain node every music track runs through
let sfxBus = null;         // gain node every sound effect runs through
let cryBus = null;         // gain node every cry runs through
let masterBus = null;      // the volume slider: every bus runs through it
let cryPlaying = null;     // the AudioBufferSourceNode of the cry playing now
const players = {};        // track name -> { el, gain } (el is a LoopedTrack for LOOP_POINTS tracks)
const buffers = {};        // sound name -> Promise of its decoded AudioBuffer (null if missing)
const lastPlayed = {};     // sound name -> { source, gain, at } of its latest play
const loops = {};          // sound name -> { on, source } of an effect that repeats until turned off (setLoop)
let current = null;        // name of the track that should be playing right now

let lastCue = -1;          // ctx time the latest effect started

// Like the games' menu blip: a tap on any control (a button, a map room, a card, a text box,
// the dimmed area around a blown-up card, anything with a note in its title) plays the confirm sound, unless that tap already
// set off an effect of its own (a card played, a purchase). Checked a tick later, once the
// tap's own playSound() has had its turn. Cries don't count: picking a starter blips, then cries.
const CONTROLS = 'button, a[href], [role="button"], [role="tab"], summary, .map-node, .card, #reward-log, #evolve-scene.waiting, #hof-scene.waiting, .card-focus, .card-zoom, [title], [data-tip]';
// ...except these back out (Back / Skip / Leave, No, a window's Close or ✕, a zoomed card), so they blip `cancel`
const CANCELS = '#reward-skip, #coll-back, #sel-back, #confirm-no, .sheet-close, form[method="dialog"] button, .card-zoom';
function menuBlip(e) {
  if (!ctx || !e.target.closest?.(CONTROLS)) return;
  const at = ctx.currentTime;
  const name = e.target.closest(CANCELS) ? 'cancel' : 'confirm';
  setTimeout(() => { if (lastCue < at) playSound(name, 'confirm'); });
}

/** Called once at startup. */
export function initAudio() {
  renderButton();
  // the Poké Ball menu's Sound and the title's are the same control twice
  for (const id of SOUND_TOGGLES) $(id).addEventListener('click', () => setMuted(!getSave().muted));
  for (const id of VOLUME_SLIDERS) {
    const slider = $(id);
    slider.addEventListener('input', () => { setVolume(slider.value / 100); paintSliders(); });
    slider.addEventListener('change', () => playSound('confirm'));   // a blip at the new level, so you hear what you picked
  }
  paintSliders();

  UNLOCK_EVENTS.forEach(type => document.addEventListener(type, unlock, true));
  document.addEventListener('click', menuBlip);
  // Escape on a modal window (`cancel` doesn't bubble, so listen while it captures)
  // a window with a data-close-sound plays its own as it closes (the title PC's pc-off), so it skips this one
  document.addEventListener('cancel', (e) => { if (e.target instanceof HTMLDialogElement && !e.target.dataset.closeSound) playSound('cancel', 'confirm'); }, true);

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  playMusic('title');
}

/**
 * Switch to a track, or pass null for silence. Does nothing if it's
 * already the one playing.
 * restart: start from the beginning instead of where it last stopped.
 * cut:     switch instantly (no fade out, no fade in), e.g. for a fanfare.
 */
export function playMusic(name, { restart = false, cut = false } = {}) {
  if (missing.has(name)) name = TRACK_FALLBACK[name] ?? null;
  if (current === name) return;
  const previous = current;
  current = name;
  if (previous) cut ? stop(previous) : fadeOut(previous);
  if (!name) return;
  if (restart && players[name]) players[name].el.currentTime = 0;
  if (!getSave().muted) fadeIn(name, cut);
}

/** Dip the music to a quarter for `seconds`, then bring it back, so a jingle (an unlock's fanfare) isn't lost in a song. */
export function duckMusic(seconds) {
  if (!musicBus) return;
  const g = musicBus.gain, now = ctx.currentTime;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(MUSIC_VOLUME * 0.25, now + 0.2);
  g.setValueAtTime(MUSIC_VOLUME * 0.25, now + seconds);
  g.linearRampToValueAtTime(MUSIC_VOLUME, now + seconds + 0.8);
}

/** Start downloading a track ahead of time so it can start the moment it's needed. */
export function preloadMusic(name) {
  player(name);
}

/** Start downloading effects ahead of time so their first play isn't delayed. */
export function preloadSounds(...names) {
  names.forEach(name => loadSound(name));
}

/**
 * Play a sound effect, or `fallback` if its own file is missing.
 * Resolves with the clip's length in seconds (0 if nothing played).
 */
export async function playSound(name, fallback) {
  if (getSave().muted) return 0;
  let buffer = await loadSound(name);
  if (!buffer && fallback) buffer = await loadSound(name = fallback);
  if (!buffer || ctx.state !== 'running') return 0;
  const now = ctx.currentTime;
  const last = lastPlayed[name];
  if (last && now - last.at < SFX_MIN_GAP) return 0;
  // a repeat cuts the one still ringing (with a tiny fade, so it doesn't click) instead of layering on top
  if (last && now < last.at + last.length) {
    last.gain.gain.cancelScheduledValues(now);
    last.gain.gain.setValueAtTime(last.gain.gain.value, now);
    last.gain.gain.linearRampToValueAtTime(0, now + 0.03);
    last.source.stop(now + 0.03);
  }
  const { gain: volume = 1, start = 0, length = buffer.duration - start } = SOUNDS[name] || {};
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  if (length < buffer.duration - start) {
    gain.gain.setValueAtTime(volume, now + length - 0.08);
    gain.gain.linearRampToValueAtTime(0, now + length);
  }
  source.connect(gain).connect(sfxBus);
  source.start(now, start, length);
  lastPlayed[name] = { source, gain, at: now, length };
  lastCue = now;
  return length;
}

/**
 * Play a Pokémon's cry by sprite id, cutting off any cry still playing.
 * Shiny forms use the base cry. Resolves once the cry has finished or been
 * cut off; straight away if sound is muted, still blocked, or it has no file.
 */
export async function playCry(spriteId) {
  const id = cryId(spriteId);
  stopCry();
  if (getSave().muted || !CRIES.has(id)) return;
  const buffer = await loadSound(`cry:${id}`, `assets/audio/cries/${id}.mp3`);
  if (!buffer || ctx.state !== 'running' || getSave().muted) return;
  stopCry();   // another cry may have been asked for while this one loaded
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(cryBus);
  cryPlaying = source;
  await new Promise(resolve => { source.onended = resolve; source.start(); });
  if (cryPlaying === source) cryPlaying = null;
}

/**
 * Keep an effect repeating (the games' low-HP beeping) until it's turned off. Safe to call on every
 * render: asking for the state it's already in does nothing. Muting stops it; unmuting doesn't restart it
 * until the next call.
 */
export async function setLoop(name, on) {
  const loop = loops[name] ||= { on: false, source: null };
  if (loop.on === on) return;
  loop.on = on;
  if (!on) { loop.source?.stop(); loop.source = null; return; }
  if (getSave().muted) { loop.on = false; return; }
  const buffer = await loadSound(name);
  if (!buffer || ctx.state !== 'running' || !loop.on || loop.source) { if (!loop.source) loop.on = false; return; }
  const { gain: volume = 1 } = SOUNDS[name] || {};
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain).connect(sfxBus);
  source.start();
  loop.source = source;
}

/** Start downloading cries ahead of time so they play without delay. */
export function preloadCries(...spriteIds) {
  spriteIds.map(cryId).filter(id => CRIES.has(id))
    .forEach(id => loadSound(`cry:${id}`, `assets/audio/cries/${id}.mp3`));
}

const cryId = (spriteId) => spriteId.replace(/-shiny$/, '');

function stopCry() {
  const source = cryPlaying;
  cryPlaying = null;
  source?.stop();   // fires onended, so whoever awaited it moves on
}

function setMuted(muted) {
  updateSave(d => { d.muted = muted; });
  renderButton();
  if (muted) stopCry();
  if (muted) Object.keys(loops).forEach(name => setLoop(name, false));
  if (!current) return;
  if (muted) Object.keys(players).forEach(fadeOut);
  else fadeIn(current);
}

// squared, so the slider's low half isn't nearly all loud (ears hear loudness roughly logarithmically)
const volumeGain = () => (getSave().volume ?? 1) ** 2;

function setVolume(volume) {
  updateSave(d => { d.volume = volume; });
  if (masterBus) masterBus.gain.setTargetAtTime(volumeGain(), ctx.currentTime, 0.02);
}

const SOUND_TOGGLES = ['music-btn', 'title-music-btn'];
const VOLUME_SLIDERS = ['volume-slider', 'title-volume'];

function renderButton() {
  const muted = getSave().muted;
  for (const id of SOUND_TOGGLES) {
    const btn = $(id);
    btn.querySelector('.mi-icon').textContent = muted ? '🔇' : '🔊';
    btn.querySelector('.mi-label').textContent = muted ? 'Sound off' : 'Sound on';
    btn.title = muted ? 'Turn sound on' : 'Mute sound';
    btn.setAttribute('aria-pressed', String(!muted));
  }
  $('title-sound-icon').textContent = muted ? '🔇' : '🔊';
}

/** Every slider shows the saved volume, its green part painted from --v (WebKit has no ::range-progress). */
function paintSliders() {
  const value = Math.round((getSave().volume ?? 1) * 100);
  for (const id of VOLUME_SLIDERS) {
    const slider = $(id);
    slider.value = value;
    slider.style.setProperty('--v', value);
  }
}

function audioContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterBus = ctx.createGain();
    masterBus.gain.value = volumeGain();
    masterBus.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = MUSIC_VOLUME;
    musicBus.connect(masterBus);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_VOLUME;
    sfxBus.connect(masterBus);
    cryBus = ctx.createGain();
    cryBus.gain.value = CRY_VOLUME;
    cryBus.connect(masterBus);
  }
  return ctx;
}

/** The track's <audio> element and gain node, created on first use. */
function player(name) {
  audioContext();
  if (!players[name]) {
    const onError = () => {
      missing.add(name);
      if (current !== name) return;
      current = null;
      playMusic(TRACK_FALLBACK[name] ?? null);
    };
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(musicBus);
    let el;
    if (LOOP_POINTS[name]) el = new LoopedTrack(TRACKS[name], LOOP_POINTS[name], gain, onError);
    else {
      el = new Audio(TRACKS[name]);
      el.loop = true;
      el.addEventListener('error', onError);
      ctx.createMediaElementSource(el).connect(gain);
    }
    players[name] = { el, gain };
  }
  return players[name];
}

/**
 * A track that loops between two points inside its file, standing in for an <audio> element (play, pause, paused,
 * currentTime) so the fades above treat both alike. An <audio> element can only loop the whole file, so this plays a
 * decoded buffer instead. A decoded song is ~50 MB, so only the playing one is kept decoded: pausing drops it and keeps
 * the MP3's bytes, which decode again in a moment next time.
 * With no crossfade the buffer loops natively, sample-exact (the battle songs repeat exactly). With one, each pass is
 * its own source, handing over to the next with an equal-power crossfade centred on the loop points (the other songs'
 * repeats match in melody and beat but not sample for sample). Each pass's end queues the pass after next, from the
 * audio thread, so a throttled background tab can't miss a join.
 */
const RISE = Float32Array.from({ length: 64 }, (_, i) => Math.sin(i / 63 * Math.PI / 2));
const FALL = RISE.slice().reverse();

class LoopedTrack {
  constructor(url, [loopStart, loopEnd, xfade = 0], out, onError) {
    Object.assign(this, { loopStart, loopEnd, xfade, out, onError });
    this.paused = true;
    this.offset = 0;        // where it resumes, in seconds into the file
    this.passes = [];       // { source, when, offset } of the passes playing or queued, oldest first
    this.bytes = fetch(url)
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.arrayBuffer(); })
      .catch(() => { onError(); return null; });
    this.decode();
  }
  decode() {
    this.decoded ||= this.bytes.then(data => data && ctx.decodeAudioData(data.slice(0))).catch(() => null);
    return this.decoded;
  }
  get currentTime() {
    const now = ctx?.currentTime ?? 0;
    const pass = this.passes.filter(p => p.when <= now).at(-1);
    if (this.paused || !pass) return this.offset;
    return this.wrap(pass.offset + now - pass.when);
  }
  set currentTime(t) {
    const playing = !this.paused;
    if (playing) this.pause(true);
    this.offset = t;
    if (playing) this.play();
  }
  /** The same moment in the song, brought back inside the loop (before the next crossfade starts). */
  wrap(t) {
    const length = this.loopEnd - this.loopStart;
    while (t >= this.loopEnd - this.xfade / 2) t -= length;
    return t;
  }
  play() {
    if (!this.paused) return Promise.resolve();
    this.paused = false;
    return this.decode().then(buffer => {
      if (this.paused || this.passes.length || !buffer) return;
      this.buffer = buffer;
      const offset = this.wrap(this.offset);
      if (!this.xfade) {
        const source = this.source(buffer);
        source.loop = true;
        source.loopStart = this.loopStart;
        source.loopEnd = this.loopEnd;
        source.connect(this.out);
        source.start(0, offset);
        this.passes = [{ source, when: ctx.currentTime, offset }];
        return;
      }
      this.pass(offset, ctx.currentTime, false);
      this.queue();
    });
  }
  source(buffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }
  /** One pass from `offset` to the loop's end, fading out across the join (and in, if it follows another). */
  pass(offset, when, fadeIn) {
    const source = this.source(this.buffer), gain = ctx.createGain();
    source.connect(gain).connect(this.out);
    if (fadeIn) { gain.gain.value = 0; gain.gain.setValueCurveAtTime(RISE, when, this.xfade); }
    const handOver = when + (this.loopEnd - this.xfade / 2 - offset);
    gain.gain.setValueCurveAtTime(FALL, handOver, this.xfade);
    source.start(when, offset);
    source.stop(handOver + this.xfade);
    const pass = { source, when, offset, handOver };
    source.onended = () => {
      if (!this.passes.includes(pass)) return;   // stopped by a pause
      this.passes = this.passes.filter(p => p !== pass);
      if (!this.paused && this.passes.length < 2) this.queue();
    };
    this.passes.push(pass);
  }
  queue() {
    const last = this.passes.at(-1);
    if (last) this.pass(this.loopStart - this.xfade / 2, last.handOver, true);
  }
  pause(keep = false) {
    if (this.paused) return;
    this.offset = this.currentTime;
    this.paused = true;
    const passes = this.passes;
    this.passes = [];
    passes.forEach(p => p.source.stop());
    if (!keep) this.decoded = null;
  }
}

function loadSound(name, url = SOUNDS[name]?.url) {
  const synth = SOUNDS[name]?.synth;
  if (synth && !url && !(name in buffers)) buffers[name] = Promise.resolve(synth(audioContext()));
  if (!(name in buffers)) {
    buffers[name] = fetch(url)
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.arrayBuffer(); })
      .then(data => audioContext().decodeAudioData(data))
      .catch(() => (synth ? synth(audioContext()) : null));   // a file with a synth behind it: the synth while the file is missing
  }
  return buffers[name];
}

function rampTo(gain, value) {
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(value, now + FADE);
}

// a track mastered a touch quieter than the rest gets a little lift (the user found the boss theme slightly quiet)
const TRACK_GAIN = { boss: 1.15, 'trainer-victory': 0.35, kombat: 0.25 };   // trainer-victory comes mastered ~11 dB louder than victory, kombat ~13 dB louder than boss

function fadeIn(name, instant = false) {
  const { el, gain } = player(name);
  const level = TRACK_GAIN[name] ?? 1;
  if (instant) { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setValueAtTime(level, ctx.currentTime); }
  else rampTo(gain, level);
  el.play().catch(() => { /* blocked until the first tap; unlock() retries */ });
}

function fadeOut(name) {
  const p = players[name];
  if (!p) return;
  rampTo(p.gain, 0);
  // pause once silent, unless the track was asked for again in the meantime
  setTimeout(() => {
    if (current !== name || getSave().muted) p.el.pause();
  }, FADE * 1000 + 50);
}

function stop(name) {
  const p = players[name];
  if (!p) return;
  p.gain.gain.cancelScheduledValues(ctx.currentTime);
  p.gain.gain.setValueAtTime(0, ctx.currentTime);
  p.el.pause();
}

/** The first tap or key press: now the browser lets us start sound. */
function unlock() {
  const context = audioContext();
  context.resume();
  preloadSounds('confirm', 'cancel', 'bag');   // so the first blip isn't late waiting on a download (or a missing file's 404)
  if (current && !getSave().muted) fadeIn(current);
  // stay subscribed until sound really works: the context is running and the current track isn't stuck paused
  setTimeout(() => {
    const blocked = current && !getSave().muted && players[current] && players[current].el.paused;
    if (context.state === 'running' && !blocked) {
      UNLOCK_EVENTS.forEach(type => document.removeEventListener(type, unlock, true));
    }
  }, 250);
}

/**
 * The block sound, built sample by sample: an 8-bit shield "clink". A tick of noise for the impact, a
 * square-wave blip that steps down (G6 then D6) like the games' chiptune effects, and a short metallic
 * ring from a few inharmonic partials so it reads as hitting something hard.
 */
function blockClink(ac) {
  const rate = ac.sampleRate, length = Math.round(rate * 0.3);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const ring = [[2093, 0.16], [3170, 0.1], [4060, 0.06]];
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const tick = (Math.random() * 2 - 1) * Math.exp(-t / 0.004) * 0.5;
    const pitch = t < 0.035 ? 1568 : 1175;
    const blip = Math.sign(Math.sin(2 * Math.PI * pitch * t)) * 0.22 * Math.exp(-t / 0.07);
    const metal = ring.reduce((sum, [f, a]) => sum + Math.sin(2 * Math.PI * f * t) * a, 0) * Math.exp(-t / 0.09);
    const fade = Math.min(1, t / 0.002, (length - i) / (rate * 0.01));   // no click at either end
    out[i] = (tick + blip + metal) * fade;
  }
  return normalize(buffer, 0.2);   // it used to peak at 0.9, about 4x the MP3s (the user found it far too loud)
}

/** Scale a synth buffer so its loudest sample is `peak`: the MP3s peak around 0.1-0.25, so synths sit with them. */
function normalize(buffer, peak) {
  const out = buffer.getChannelData(0);
  const top = out.reduce((max, v) => Math.max(max, Math.abs(v)), 0) || 1;
  for (let i = 0; i < out.length; i++) out[i] *= peak / top;
  return buffer;
}

/** The Game Corner's joystick: a short two-step square-wave cursor tick, like moving a menu cursor on an arcade screen. */
function stickTick(ac) {
  const rate = ac.sampleRate, length = Math.round(rate * 0.06);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const pitch = t < 0.02 ? 1319 : 1760;
    const fade = Math.min(1, t / 0.002, (length - i) / (rate * 0.008));
    out[i] = Math.sign(Math.sin(2 * Math.PI * pitch * t)) * Math.exp(-t / 0.04) * fade;
  }
  return normalize(buffer, 0.12);
}

/** A filtered click: a burst of noise rung through a resonant band at `freq`, the body of every plastic and metal tick below. */
function click(out, rate, at, freq, decay, level) {
  const start = Math.round(at * rate), w = 2 * Math.PI * freq / rate, r = Math.exp(-1 / (decay * rate));
  let y1 = 0, y2 = 0;
  for (let i = 0; start + i < out.length && i < rate * decay * 8; i++) {
    const x = i < rate * 0.0015 ? Math.random() * 2 - 1 : 0;
    const y = x + 2 * r * Math.cos(w) * y1 - r * r * y2;
    y2 = y1; y1 = y;
    out[start + i] += y * level;
  }
}

/** The ball rocking on the ground, like the games' "clack": a hollow knock as it tips, a plastic click as the halves rattle. */
function catchShake(ac) {
  const rate = ac.sampleRate, length = Math.round(rate * 0.22);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {   // the knock: a low thump sliding down
    const t = i / rate;
    out[i] += Math.sin(2 * Math.PI * (150 - 260 * t) * t) * Math.exp(-t / 0.035) * 0.9;
  }
  click(out, rate, 0, 2400, 0.012, 0.5);
  click(out, rate, 0.045, 1800, 0.01, 0.35);   // the rock back
  return normalize(buffer, 0.5);
}

/** A catch: the button latching shut (a sharp double click, the second ringing), then a short bright chiptune "Gotcha!". */
function catchSuccess(ac) {
  const rate = ac.sampleRate, length = Math.round(rate * 1.0);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  click(out, rate, 0, 3200, 0.008, 0.9);
  click(out, rate, 0.028, 4200, 0.03, 0.7);
  const notes = [[0.2, 1047, 0.09], [0.29, 1319, 0.09], [0.38, 1568, 0.09], [0.47, 2093, 0.45]];
  for (const [at, f, dur] of notes) {
    const start = Math.round(at * rate);
    for (let i = 0; i < dur * rate && start + i < length; i++) {
      const t = i / rate;
      const env = Math.min(1, t / 0.004) * (t < dur - 0.02 ? Math.exp(-t / (dur * 2)) : Math.max(0, (dur - t) / 0.02));
      out[start + i] += (Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1) * 0.22 * env;
    }
  }
  return normalize(buffer, 0.45);
}

/** The NES noise channel: random values held for `hold` samples, so it sounds crunchy rather than hissy. */
function chipNoise(length, hold) {
  const out = new Float32Array(length);
  let v = 0;
  for (let i = 0; i < length; i++) {
    if (i % hold === 0) v = Math.random() * 2 - 1;
    out[i] = v;
  }
  return out;
}

/** A firework rocket going up: a quiet square-wave whistle sliding up over a crunch of noise. */
function fireworkLaunch(ac) {
  const rate = ac.sampleRate, length = Math.round(rate * 0.4);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const noise = chipNoise(length, 6);
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    phase += (500 + 1400 * (t / 0.4) ** 1.5) / rate;
    const fade = Math.min(1, t / 0.02, (length - i) / (rate * 0.06));
    out[i] = (Math.sign(Math.sin(2 * Math.PI * phase)) * 0.25 + noise[i] * 0.3) * fade;
  }
  return normalize(buffer, 0.06);
}

/** A firework bursting: a thump that drops in pitch under a burst of chip noise that thins out as it fades. */
function fireworkPop(ac, seconds, thump, peak) {
  const rate = ac.sampleRate, length = Math.round(rate * seconds);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const noise = chipNoise(length, 3), rough = chipNoise(length, 14);
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    phase += thump * (1 + 1.5 * Math.exp(-t / 0.04)) / rate;
    const body = Math.sin(2 * Math.PI * phase) * Math.exp(-t / (seconds * 0.25));
    const blast = (noise[i] * 0.6 + rough[i] * 0.4) * Math.exp(-t / (seconds * 0.22));
    const fade = Math.min(1, t / 0.002, (length - i) / (rate * 0.03));
    out[i] = (body * 0.9 + blast) * fade;
  }
  return normalize(buffer, peak);
}

/** The ground rumbling: low chip noise and a wobbling sub-bass that swell over a few seconds, with a few rock knocks. */
function quakeRumble(ac) {
  const rate = ac.sampleRate, seconds = 2.8, length = Math.round(rate * seconds);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const low = chipNoise(length, 90), grit = chipNoise(length, 24);
  let phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate, swell = (t / seconds) ** 1.3;
    phase += (34 + 6 * Math.sin(t * 9)) / rate;
    const fade = Math.min(1, t / 0.15, (length - i) / (rate * 0.05));
    out[i] = (Math.sin(2 * Math.PI * phase) * 0.8 + low[i] * 0.7 + grit[i] * 0.25 * swell) * (0.25 + 0.75 * swell) * (0.75 + 0.25 * Math.sin(t * 23)) * fade;
  }
  for (const at of [0.5, 1.15, 1.7, 2.2]) {
    const start = Math.round(rate * at), knock = Math.round(rate * 0.09);
    for (let i = 0; i < knock && start + i < length; i++) out[start + i] += (Math.random() * 2 - 1) * 0.6 * (1 - i / knock);
  }
  return normalize(buffer, 0.2);
}

/** A temple bell struck once: a thud, then bronze partials (not whole multiples of the low one, which is what makes it a
    bell) that beat slowly against each other and ring out, the high ones dying first. */
function templeBell(ac) {
  const rate = ac.sampleRate, seconds = 3, length = Math.round(rate * seconds);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const partials = [[98, 1, 2.6], [99.4, 0.6, 2.4], [196.5, 0.55, 1.8], [272, 0.45, 1.3], [418, 0.32, 0.9], [538, 0.25, 0.6], [873, 0.14, 0.35]];
  const thud = chipNoise(Math.round(rate * 0.05), 8);
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    let v = 0;
    for (const [f, a, d] of partials) v += Math.sin(2 * Math.PI * f * t) * a * Math.exp(-t / d);
    if (i < thud.length) v += thud[i] * 0.5 * (1 - i / thud.length);
    out[i] = v * Math.min(1, t / 0.003, (length - i) / (rate * 0.05));
  }
  return normalize(buffer, 0.22);
}

/** A surge of power: rushing noise that bursts open bright and closes down, over a thump and a rising chip arpeggio. */
function powerSurge(ac, notes, seconds) {
  const rate = ac.sampleRate, length = Math.round(rate * seconds);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const noise = chipNoise(length, 2);
  let low = 0, phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    const cut = 200 + 5000 * Math.exp(-t / (seconds * 0.3));
    low += (1 - Math.exp(-2 * Math.PI * cut / rate)) * (noise[i] - low);
    const rush = low * Math.min(1, t / 0.02) * Math.exp(-t / (seconds * 0.4));
    phase += 45 * (1 + 2 * Math.exp(-t / 0.05)) / rate;
    const thump = Math.sin(2 * Math.PI * phase) * Math.exp(-t / 0.25);
    let arp = 0;
    notes.forEach((f, n) => { const s = t - n * 0.07; if (s >= 0) arp += Math.sign(Math.sin(2 * Math.PI * f * s)) * Math.exp(-s / 0.35) * 0.18; });
    out[i] = (rush * 1.4 + thump * 0.9 + arp) * Math.min(1, (length - i) / (rate * 0.05));
  }
  return normalize(buffer, 0.24);
}

/** A crackler: a scatter of tiny noise snaps, thinning out over most of a second. */
function fireworkCrackle(ac) {
  const rate = ac.sampleRate, length = Math.round(rate * 0.8);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const snap = Math.round(rate * 0.004);
  for (let n = 0; n < 34; n++) {
    const at = Math.floor(Math.random() ** 1.4 * (length - snap)), level = Math.random() * 0.6 + 0.4;
    for (let i = 0; i < snap; i++) out[at + i] += (Math.random() * 2 - 1) * level * (1 - i / snap);
  }
  return normalize(buffer, 0.12);
}

/** Tall grass shaken: three quick soft swishes of chip noise, the games' rustle. */
function grassRustle(ac) {
  const rate = ac.sampleRate, length = Math.round(rate * 0.32);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const noise = chipNoise(length, 4);
  let low = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate, s = (t % 0.1) / 0.1;
    low += 0.35 * (noise[i] - low);
    out[i] = low * Math.sin(Math.PI * s) * (1 - t / 0.32);
  }
  return normalize(buffer, 0.1);
}

/** A hot wind: soft noise swelling and passing, its brightness opening and closing with it. */
function hotGust(ac) {
  const rate = ac.sampleRate, seconds = 2.6, length = Math.round(rate * seconds);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const noise = chipNoise(length, 2);
  let low = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate, swell = Math.sin(Math.PI * Math.min(1, t / seconds)) ** 1.5;
    low += (1 - Math.exp(-2 * Math.PI * (250 + 1600 * swell) / rate)) * (noise[i] - low);
    out[i] = low * swell * (0.85 + 0.15 * Math.sin(t * 11));
  }
  return normalize(buffer, 0.1);
}

/** A volcano far off letting out a breath: a soft, deep rumble that swells and dies away. */
function farRumble(ac) {
  const rate = ac.sampleRate, seconds = 2.4, length = Math.round(rate * seconds);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const rough = chipNoise(length, 140);
  let low = 0, phase = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate, env = Math.min(1, t / 0.25) * Math.exp(-t / 0.9);
    low += 0.02 * (rough[i] - low);
    phase += (30 + 4 * Math.sin(t * 5)) / rate;
    out[i] = (Math.sin(2 * Math.PI * phase) * 0.7 + low * 3) * env * Math.min(1, (length - i) / (rate * 0.05));
  }
  return normalize(buffer, 0.16);
}

/** A shrine's wind chime (furin): a glassy tink, its high partials dying first. */
function windChime(ac, f) {
  const rate = ac.sampleRate, length = Math.round(rate * 1.2);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const partials = [[f, 1, 0.5], [f * 1.004, 0.5, 0.45], [f * 2.76, 0.4, 0.2], [f * 5.4, 0.22, 0.07]];
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    let v = 0;
    for (const [p, a, d] of partials) v += Math.sin(2 * Math.PI * p * t) * a * Math.exp(-t / d);
    out[i] = v * Math.min(1, t / 0.002, (length - i) / (rate * 0.05));
  }
  return normalize(buffer, 0.12);
}

/** Arriving somewhere new: a rising major arpeggio on a soft square wave, then a shimmer of high notes ringing out. */
function arrivalChime(ac) {
  const rate = ac.sampleRate, seconds = 2.2, length = Math.round(rate * seconds);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const notes = [[392, 0], [523, 0.09], [659, 0.18], [784, 0.27], [1047, 0.4]];
  const sparkle = [[2093, 0.55], [2637, 0.63], [3136, 0.71], [2637, 0.82], [3951, 0.93]];
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    let v = 0;
    for (const [f, at] of notes) { const s = t - at; if (s >= 0) v += Math.sign(Math.sin(2 * Math.PI * f * s)) * 0.16 * Math.exp(-s / (at === 0.4 ? 0.9 : 0.3)) * Math.min(1, s / 0.004); }
    for (const [f, at] of sparkle) { const s = t - at; if (s >= 0) v += Math.sin(2 * Math.PI * f * s) * 0.12 * Math.exp(-s / 0.35); }
    out[i] = v * Math.min(1, (length - i) / (rate * 0.05));
  }
  return normalize(buffer, 0.18);
}

/** The Sealed Gate's drone: two low tones a few hertz apart, beating slowly, under a thin hiss, swelling and dying away. */
function gateHum(ac) {
  const rate = ac.sampleRate, seconds = 2.6, length = Math.round(rate * seconds);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const hiss = chipNoise(length, 3);
  let low = 0;
  for (let i = 0; i < length; i++) {
    const t = i / rate, env = Math.sin(Math.PI * t / seconds) ** 1.5;
    low += 0.02 * (hiss[i] - low);
    const tone = Math.sin(2 * Math.PI * 55 * t) + Math.sin(2 * Math.PI * 58.5 * t) * 0.8 + Math.sign(Math.sin(2 * Math.PI * 110.4 * t)) * 0.12;
    out[i] = (tone * 0.5 + low * 1.2) * env;
  }
  return normalize(buffer, 0.16);
}

/** Stone and crystal cracking: a sharp snap, then a crunch of short ticks running off. */
function gateCrack(ac) {
  const rate = ac.sampleRate, length = Math.round(rate * 0.7);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const snap = chipNoise(Math.round(rate * 0.03), 1);
  snap.forEach((v, i) => { out[i] += v * (1 - i / snap.length); });
  let at = Math.round(rate * 0.02);
  while (at < length - 400) {
    const tick = Math.round(rate * (0.002 + Math.random() * 0.004)), level = 0.8 * (1 - at / length);
    for (let i = 0; i < tick; i++) out[at + i] += (Math.random() * 2 - 1) * level * (1 - i / tick);
    at += Math.round(rate * (0.008 + Math.random() * 0.03) * (1 + at / length * 2));
  }
  let phase = 0;
  for (let i = 0; i < Math.round(rate * 0.25); i++) {
    phase += (90 - 50 * i / (rate * 0.25)) / rate;
    out[i] += Math.sin(2 * Math.PI * phase) * 0.6 * Math.exp(-i / (rate * 0.08));
  }
  return normalize(buffer, 0.2);
}

/** The door shattering: a burst of noise, and a shower of glassy pings scattering high and dying away. */
function gateShatter(ac) {
  const rate = ac.sampleRate, seconds = 2.2, length = Math.round(rate * seconds);
  const buffer = ac.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const burst = chipNoise(length, 1);
  for (let i = 0; i < length; i++) out[i] = burst[i] * 0.7 * Math.exp(-i / (rate * 0.12));
  for (let n = 0; n < 60; n++) {
    const at = Math.floor(Math.random() ** 1.8 * rate * 1.6), f = 1800 + Math.random() * 4200, d = 0.05 + Math.random() * 0.25;
    const amp = 0.25 + Math.random() * 0.35;
    for (let i = 0; at + i < length && i < rate * d * 4; i++) out[at + i] += Math.sin(2 * Math.PI * f * i / rate) * amp * Math.exp(-i / (rate * d));
  }
  return normalize(buffer, 0.22);
}
