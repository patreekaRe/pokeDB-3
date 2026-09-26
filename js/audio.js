/* ============================================================
   audio.js  -  background music and sound effects.

   MUSIC: one looping track plays at a time: 'title' on the menus,
   'map1' / 'map2' / 'map3' on each biome's map, 'wild' / 'elite' / 'boss'
   during fights, 'victory' from the moment an enemy faints until you're
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
  victory: 'assets/audio/victory.mp3',
  map1:    'assets/audio/map1.mp3',      // one theme per biome, played on its map
  map2:    'assets/audio/map2.mp3',
  map3:    'assets/audio/map3.mp3',
};
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
  'low-hp':     { url: 'assets/audio/sfx/low-hp.mp3' },       // looped by setLoop() while your HP is at 20% or below in battle
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
  'no-pp':      { url: 'assets/audio/sfx/no-pp.mp3', gain: 0.5 },   // a card is tapped without enough PP left (the greyed-out ones): a dense buzz, so at half gain
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
  'rattata', 'pidgey', 'oddish', 'poliwag', 'vulpix', 'zubat', 'geodude', 'growlithe',
  'bellsprout', 'krabby', 'machop', 'ponyta', 'staryu', 'rhyhorn', 'tangela', 'gloom',
  'poliwhirl', 'arcanine', 'snorlax', 'tangrowth', 'magmar', 'lapras', 'salamence',
  'flareon', 'poliwrath', 'ninetales', 'shiftry', 'slowking', 'chandelure', 'ursaring',
  'houndoom', 'breloom', 'kingdra', 'slaking', 'magmortar', 'gyarados',
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
let cryPlaying = null;     // the AudioBufferSourceNode of the cry playing now
const players = {};        // track name -> { el, gain }
const buffers = {};        // sound name -> Promise of its decoded AudioBuffer (null if missing)
const lastPlayed = {};     // sound name -> { source, gain, at } of its latest play
const loops = {};          // sound name -> { on, source } of an effect that repeats until turned off (setLoop)
let current = null;        // name of the track that should be playing right now

let lastCue = -1;          // ctx time the latest effect started

// Like the games' menu blip: a tap on any control (a button, a map room, a card, a text box,
// the dimmed area around a blown-up card, anything with a note in its title) plays the confirm sound, unless that tap already
// set off an effect of its own (a card played, a purchase). Checked a tick later, once the
// tap's own playSound() has had its turn. Cries don't count: picking a starter blips, then cries.
const CONTROLS = 'button, a[href], [role="button"], [role="tab"], summary, .map-node, .card, #reward-log, .card-focus, .card-zoom, [title], [data-tip]';
// ...except these back out (Back / Skip / Leave, No, a window's Close or ✕, a zoomed card), so they blip `cancel`
const CANCELS = '#reward-skip, #confirm-no, .sheet-close, form[method="dialog"] button, .card-zoom';
function menuBlip(e) {
  if (!ctx || !e.target.closest?.(CONTROLS)) return;
  const at = ctx.currentTime;
  const name = e.target.closest(CANCELS) ? 'cancel' : 'confirm';
  setTimeout(() => { if (lastCue < at) playSound(name, 'confirm'); });
}

/** Called once at startup. */
export function initAudio() {
  renderButton();
  $('music-btn').addEventListener('click', () => setMuted(!getSave().muted));

  UNLOCK_EVENTS.forEach(type => document.addEventListener(type, unlock, true));
  document.addEventListener('click', menuBlip);
  // Escape on a modal window (`cancel` doesn't bubble, so listen while it captures)
  document.addEventListener('cancel', (e) => { if (e.target instanceof HTMLDialogElement) playSound('cancel', 'confirm'); }, true);

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
  if (current === name) return;
  const previous = current;
  current = name;
  if (previous) cut ? stop(previous) : fadeOut(previous);
  if (!name) return;
  if (restart && players[name]) players[name].el.currentTime = 0;
  if (!getSave().muted) fadeIn(name, cut);
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

function renderButton() {
  const muted = getSave().muted;
  const btn = $('music-btn');
  btn.querySelector('.mi-icon').textContent = muted ? '🔇' : '🔊';
  btn.querySelector('.mi-label').textContent = muted ? 'Sound off' : 'Sound on';
  btn.title = muted ? 'Turn sound on' : 'Mute sound';
  btn.setAttribute('aria-pressed', String(!muted));
}

function audioContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    musicBus = ctx.createGain();
    musicBus.gain.value = MUSIC_VOLUME;
    musicBus.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_VOLUME;
    sfxBus.connect(ctx.destination);
    cryBus = ctx.createGain();
    cryBus.gain.value = CRY_VOLUME;
    cryBus.connect(ctx.destination);
  }
  return ctx;
}

/** The track's <audio> element and gain node, created on first use. */
function player(name) {
  audioContext();
  if (!players[name]) {
    const el = new Audio(TRACKS[name]);
    el.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain).connect(musicBus);
    players[name] = { el, gain };
  }
  return players[name];
}

function loadSound(name, url = SOUNDS[name]?.url) {
  const synth = SOUNDS[name]?.synth;
  if (synth && !(name in buffers)) buffers[name] = Promise.resolve(synth(audioContext()));
  if (!(name in buffers)) {
    buffers[name] = fetch(url)
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.arrayBuffer(); })
      .then(data => audioContext().decodeAudioData(data))
      .catch(() => null);
  }
  return buffers[name];
}

function rampTo(gain, value) {
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(value, now + FADE);
}

function fadeIn(name, instant = false) {
  const { el, gain } = player(name);
  if (instant) { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setValueAtTime(1, ctx.currentTime); }
  else rampTo(gain, 1);
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
