/* ============================================================
   audio.js  -  background music.

   One looping track plays at a time: 'title' on every screen except
   battles, and 'wild' / 'elite' / 'boss' during fights. Switching tracks
   crossfades between them.

   Why the Web Audio API instead of plain <audio> elements: iPhones ignore
   an <audio> element's .volume, so fades would be impossible there. Each
   track's <audio> element is routed through its own GainNode instead.

   Each file is only downloaded the first time its track is needed, so
   nobody downloads boss music just by opening the page.

   Browsers refuse to play sound until the player has tapped or pressed a
   key, so the first track requested is held until then (see unlock()).
   ============================================================ */

import { getSave, updateSave } from './storage.js';
const $ = (id) => document.getElementById(id);   // not imported from ui.js, which imports this file

const TRACKS = {
  title: 'assets/audio/title.mp3',
  wild:  'assets/audio/wild.mp3',
  elite: 'assets/audio/elite.mp3',
  boss:  'assets/audio/boss.mp3',
};
const VOLUME = 0.75;       // overall music volume, 0-1
const FADE = 0.8;          // seconds for a crossfade

let ctx = null;            // the AudioContext, created the first time any track is needed
let master = null;         // gain node every track runs through
const players = {};        // track name -> { el, gain }
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
 * Switch to a track. Does nothing if it's already the one playing.
 * restart: start from the beginning instead of where it last stopped.
 */
export function playMusic(name, { restart = false } = {}) {
  if (current === name) return;
  const previous = current;
  current = name;
  if (previous) fadeOut(previous);
  if (restart && players[name]) players[name].el.currentTime = 0;
  if (!getSave().muted) fadeIn(name);
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
  btn.title = muted ? 'Turn music on' : 'Mute music';
  btn.setAttribute('aria-pressed', String(!muted));
}

/** The track's <audio> element and gain node, created on first use. */
function player(name) {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = VOLUME;
    master.connect(ctx.destination);
  }
  if (!players[name]) {
    const el = new Audio(TRACKS[name]);
    el.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain).connect(master);
    players[name] = { el, gain };
  }
  return players[name];
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

/** The first tap or key press: now the browser lets us start sound. */
function unlock() {
  if (ctx) ctx.resume();
  if (current && !getSave().muted) fadeIn(current);
  if (ctx && ctx.state !== 'suspended') {
    ['pointerdown', 'keydown'].forEach(type => document.removeEventListener(type, unlock, true));
  }
}
