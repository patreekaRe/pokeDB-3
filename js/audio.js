/* ============================================================
   audio.js  -  background music and sound effects.

   MUSIC: one looping track plays at a time: 'title' on every screen
   except battles and rest sites, 'wild' / 'elite' / 'boss' during fights
   and 'center' at a Pokémon Center. Switching tracks crossfades.

   Why the Web Audio API instead of plain <audio> elements: iPhones ignore
   an <audio> element's .volume, so fades would be impossible there. Each
   track's <audio> element is routed through its own GainNode instead.

   Each music file is only downloaded the first time its track is needed,
   so nobody downloads boss music just by opening the page.

   SOUND EFFECTS (like the Pokémon Center chime) are short clips decoded
   into memory, so they play without delay and can overlap. A missing
   effect file is simply silent.

   Browsers refuse to play sound until the player has tapped or pressed a
   key, so the first track requested is held until then (see unlock()).
   The 🔊 button mutes music and effects together.
   ============================================================ */

import { getSave, updateSave } from './storage.js';
const $ = (id) => document.getElementById(id);   // not imported from ui.js, which imports this file

const TRACKS = {
  title:  'assets/audio/title.mp3',
  wild:   'assets/audio/wild.mp3',
  elite:  'assets/audio/elite.mp3',
  boss:   'assets/audio/boss.mp3',
  center: 'assets/audio/center.mp3',
};
const SOUNDS = {
  heal:        'assets/audio/sfx/heal.mp3',        // the Pokémon Center chime
};
const MUSIC_VOLUME = 0.375;   // 0-1
const SFX_VOLUME = 0.6;       // 0-1
const FADE = 0.8;             // seconds for a crossfade

let ctx = null;            // the AudioContext, created the first time any sound is needed
let musicBus = null;       // gain node every music track runs through
let sfxBus = null;         // gain node every sound effect runs through
const players = {};        // track name -> { el, gain }
const buffers = {};        // sound name -> Promise of its decoded AudioBuffer (null if missing)
let current = null;        // name of the track that should be playing right now

/** Called once at startup. */
export function initAudio() {
  renderButton();
  $('music-btn').addEventListener('click', () => setMuted(!getSave().muted));

  ['pointerdown', 'keydown'].forEach(type => document.addEventListener(type, unlock, true));

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
 * cut:     stop the old track instantly instead of fading it out.
 */
export function playMusic(name, { restart = false, cut = false } = {}) {
  if (current === name) return;
  const previous = current;
  current = name;
  if (previous) cut ? stop(previous) : fadeOut(previous);
  if (!name) return;
  if (restart && players[name]) players[name].el.currentTime = 0;
  if (!getSave().muted) fadeIn(name);
}

/** Start downloading effects ahead of time so their first play isn't delayed. */
export function preloadSounds(...names) {
  names.forEach(loadSound);
}

/**
 * Play a sound effect, or `fallback` if its own file is missing.
 * Resolves with the clip's length in seconds (0 if nothing played).
 */
export async function playSound(name, fallback) {
  if (getSave().muted) return 0;
  let buffer = await loadSound(name);
  if (!buffer && fallback) buffer = await loadSound(fallback);
  if (!buffer || ctx.state !== 'running') return 0;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(sfxBus);
  source.start();
  return buffer.duration;
}

function setMuted(muted) {
  updateSave(d => { d.muted = muted; });
  renderButton();
  if (!current) return;
  if (muted) Object.keys(players).forEach(fadeOut);
  else fadeIn(current);
}

function renderButton() {
  const muted = getSave().muted;
  const btn = $('music-btn');
  btn.textContent = muted ? '🔇' : '🔊';
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

function loadSound(name) {
  if (!(name in buffers)) {
    buffers[name] = fetch(SOUNDS[name])
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

function fadeIn(name) {
  const { el, gain } = player(name);
  rampTo(gain, 1);
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
  if (ctx) ctx.resume();
  if (current && !getSave().muted) fadeIn(current);
  if (ctx && ctx.state !== 'suspended') {
    ['pointerdown', 'keydown'].forEach(type => document.removeEventListener(type, unlock, true));
  }
}
