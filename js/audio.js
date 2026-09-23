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
// (or cut) on top of SFX_VOLUME. `gain` defaults to 1.
const SOUNDS = {
  heal: { url: 'assets/audio/sfx/heal.mp3' },   // the Pokémon Center chime
};
// Sprite ids that have a file in assets/audio/cries/. Listed rather than probed so
// Pokémon without a cry stay silent instead of logging a 404 every fight.
const CRIES = new Set([
  'charmander', 'charmeleon', 'charizard', 'bulbasaur', 'ivysaur', 'venusaur',
  'squirtle', 'wartortle', 'blastoise',
  'rattata', 'pidgey', 'oddish', 'poliwag', 'vulpix', 'zubat', 'geodude', 'growlithe',
  'bellsprout', 'krabby', 'machop', 'ponyta', 'staryu', 'rhyhorn', 'tangela', 'gloom',
  'poliwhirl', 'arcanine', 'snorlax', 'tangrowth', 'magmar', 'lapras', 'salamence',
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
let current = null;        // name of the track that should be playing right now

/** Called once at startup. */
export function initAudio() {
  renderButton();
  $('music-btn').addEventListener('click', () => setMuted(!getSave().muted));

  UNLOCK_EVENTS.forEach(type => document.addEventListener(type, unlock, true));

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
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = SOUNDS[name]?.gain ?? 1;
  source.connect(gain).connect(sfxBus);
  source.start();
  return buffer.duration;
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
  if (current && !getSave().muted) fadeIn(current);
  // stay subscribed until sound really works: the context is running and the current track isn't stuck paused
  setTimeout(() => {
    const blocked = current && !getSave().muted && players[current] && players[current].el.paused;
    if (context.state === 'running' && !blocked) {
      UNLOCK_EVENTS.forEach(type => document.removeEventListener(type, unlock, true));
    }
  }, 250);
}
