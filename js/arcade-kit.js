/* arcade-kit.js  -  the shared cabinet for the Secret Base's arcade games (2026-10-12, the user's ask: ten arcade
   machines as Game Corner prizes, each playable at home). A game is a definition: its look (`colour`), a How to play
   (`help`), a logical canvas size (W x H) and make(api), which returns (and must not score or end the game until ticked or tapped, as the start screen draws one) { tick(dt, now), draw(g, now), down(x, y),
   move(x, y), up(x, y), key(k, down) } for one game. The kit runs the window (the Game Corner's panel), the loop, input
   in canvas units, Score / Best, the start and game-over screens and the cabinet's control deck (a joystick sent as
   the arrow keys, or `stick: false` for none, or `keys` for big arrow buttons, or `swipe: true` for no buttons; START / EXIT; the game's own round
   buttons, `pad`), and keeps each game's best in the Game Corner's
   records (`arc-<id>`). Nothing here pays: these are free play. A new game is a file using runArcade() and a line in
   js/home-arcade.js. */

import { hushBlip, playSound, preloadSounds } from './audio.js';
import { el, fitText } from './ui.js';
import { calmFx } from './prefs.js';
import { openPanel, key, firstLook, helpKey } from './corner-panel.js';
import { record, best } from './corner-pot.js';
import { postArcadeScore, openLeaderboard } from './leaderboard.js';
import { ARCADE_BY_ID } from './data/leaderboard.js';
import { buddy } from './trainercard.js';

const sprites = new Map(), stills = new Map();
/** A Pokémon's front GIF as an image (its first frame when drawn on a canvas). */
export function sprite(id) {
  if (!sprites.has(id)) { const img = new Image(); img.src = `assets/pokemon/${id}-front.gif`; sprites.set(id, img); }
  return sprites.get(id);
}
/** The sprite's first frame copied onto a canvas once, facing either way: drawing a GIF onto a canvas every frame (and
    saving and restoring the context round it) cost the games their frame rate on phones (the user's ask, 2026-10-12). */
function still(id, flip) {
  const k = flip ? `${id}~` : id;
  let c = stills.get(k);
  if (c) return c;
  const img = sprite(id);
  if (!img.complete || !img.naturalWidth) return null;
  c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d');
  if (flip) { x.translate(c.width, 0); x.scale(-1, 1); }
  x.drawImage(img, 0, 0);
  stills.set(k, c);
  return c;
}
/** Draws a sprite with its feet at (x, y), `h` units tall, flipped if `flip`. */
export function drawMon(g, id, x, y, h, flip = false) {
  const c = still(id, flip);
  if (!c) return;
  const w = h * c.width / c.height, smooth = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  g.drawImage(c, x - w / 2, y - h, w, h);
  g.imageSmoothingEnabled = smooth;
}
const stamps = new Map();
/** Something painted once onto a canvas of its own at the screen's scale, then stamped every frame: gradients, clips and
    hundreds of little paths redrawn each frame cost the games their frame rate on phones (2026-10-12). `paint(g)` draws
    it in a `w` x `h` box from 0, 0; `key` names what's in it. Call it from the top level of draw(), not under a rotate. */
export function stamp(g, key, x, y, w, h, paint) {
  const s = g.getTransform().a, k = `${key}@${s}`;
  let c = stamps.get(k);
  if (!c) {
    c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * s)); c.height = Math.max(1, Math.ceil(h * s));
    const cg = c.getContext('2d');
    cg.scale(s, s);
    paint(cg);
    stamps.set(k, c);
    if (stamps.size > 500) stamps.delete(stamps.keys().next().value);
  }
  g.drawImage(c, x, y, c.width / s, c.height / s);
}
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** Big centred text with a dark edge, shrunk to fit `maxW` if given (the start screen's names ran off the sides). */
export function banner(g, text, x, y, size, colour = '#fff', maxW = 0) {
  g.font = `800 ${size}px system-ui, sans-serif`;
  if (maxW) { const w = g.measureText(text).width; if (w > maxW) { size *= maxW / w; g.font = `800 ${size}px system-ui, sans-serif`; } }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = size / 5; g.strokeStyle = 'rgba(0, 0, 0, 0.75)'; g.strokeText(text, x, y);
  g.fillStyle = colour; g.fillText(text, x, y);
}

/** Each cabinet's marquee (the user's ask, 2026-10-12: a proper title on top of every machine, with artwork, animation
    and the game's Pokémon): [the Pokémon whose sprite stands on it, the small line over the name, the big name]. A new
    game needs a line, or it shows its title alone. */
const MARQUEE = {
  berry: ['pachirisu', 'Pachirisu', 'Berry Catch'], bowling: ['geodude', 'Geodude', 'Bowling'], breakout: ['electrode', 'Electrode', 'Breakout'],
  bubble: ['squirtle', 'Squirtle', 'Bubble Shooter'], claw: ['slowpoke', 'Slowpoke\'s', 'Claw Machine'], crossing: ['poliwag', 'Poliwag', 'Crossing'],
  ditto: ['ditto', 'Where\'s', 'Ditto?'], flap: ['pidgey', 'Pidgey', 'Flap'], invaders: ['beedrill', 'Beedrill', 'Invaders'],
  maze: ['gastly', 'Gastly', 'Maze'], memory: ['voltorb', 'Voltorb', 'Memory'], pinball: ['pikachu', 'Pokémon', 'Pinball'],
  pong: ['psyduck', 'Psyduck', 'Pong'], puzzle: ['eevee', 'Poké', 'Puzzle'], rhythm: ['jigglypuff', 'Jigglypuff\'s', 'Sing-Along'],
  runner: ['ponyta', 'Ponyta', 'Dash'], skeeball: ['clefairy', 'Poké Ball', 'Skee-Ball'], snake: ['ekans', 'Ekans', 'Trail'],
  stacker: ['snorlax', 'Snorlax', 'Stacker'], volley: ['pikachu', 'Pikachu', 'Volleyball'], whack: ['diglett', 'Whac-a-', 'Diglett'],
  words: ['unown', 'Unown', 'Word Search'],
};
const caps = (t) => t.toUpperCase().replace(/É/g, 'é');

/** Opens `def`'s game in the cabinet window; `onClose` once it's shut. */
export function runArcade(def, onClose) {
  preloadSounds('select', 'confirm', 'cancel', 'coins', 'stat-up', 'plink-1', 'plink-2', 'fx-tick', ...(def.sounds || []));
  const rec = `arc-${def.id}`;
  let state = 'ready', score = 0, game = null, raf = 0, last = 0, line = def.intro, help = firstLook(`arc-${def.id}`);
  let cv = null, g = null, overText = '', overAt = 0, preview = null, fit = null;
  const calm = calmFx();

  const panel = openPanel(`ar ar-${def.id}`, def.title, { onClose: () => { cancelAnimationFrame(raf); fit?.disconnect(); document.removeEventListener('keydown', onKey, true); document.removeEventListener('keyup', onKey, true); onClose?.(); } });
  panel.root.style.setProperty('--ar', def.colour);

  const api = {
    W: def.W, H: def.H,
    get score() { return score; },
    set score(v) { score = v; meters(); },
    add(n) { score += n; meters(); },
    say(text) { line = text; const p = panel.root.querySelector('.vf-say'); if (p) p.textContent = text; },
    sound: (id, fallback) => playSound(id, fallback),
    over(text) {
      if (state !== 'play') return;
      state = 'over'; overAt = performance.now();
      const top = score > best(rec);
      if (score > 0) record(rec, score);
      overText = text || 'Game over';
      api.say(`${overText}${top && score > 0 ? ` A new best: ${score.toLocaleString()}!` : ` Score: ${score.toLocaleString()}.`} Tap to play again.`);
      playSound(top && score > 0 ? 'stat-up' : 'cancel', 'select');
      render();
      const said = line, ranked = ARCADE_BY_ID[def.id];
      if (ranked && score > 0) postArcadeScore(def.id, score, buddy().id).then(t => { if (t && line === said) api.say(`${said} 🏆 ${t}`); });
    },
  };

  function start() {
    score = 0; game = def.make(api); state = 'play'; line = def.go || def.intro;
    playSound('confirm', 'select');
    render();
  }

  function meters() {
    const m = panel.root.querySelector('.vf-meters');
    if (!m) return;
    const put = (cls, n) => { const b = m.querySelector(cls), t = n.toLocaleString(); if (b.textContent !== t) b.textContent = t; };
    put('.ar-score', score);
    put('.ar-best', Math.max(best(rec), score));
  }

  /** The lit marquee on top of the cabinet: a sunburst turning behind the game's Pokémon, bulbs chasing round the edge,
      the name as an arcade logo (fitted to one line, never wrapped or cut), Free play under it, 🏆 and ? on the right. */
  function marquee() {
    const head = el('div', 'vf-head ar-marquee');
    const [mon, kick, name] = MARQUEE[def.id] || [null, '', def.title];
    head.append(el('span', 'arm-rays'), el('span', 'arm-bulbs'), el('span', 'arm-bulbs arm-bulbs-b'));
    if (mon) {
      const fig = el('span', 'arm-mon'), img = new Image();
      img.src = `assets/pokemon/${mon}-front.gif`; img.alt = ''; img.draggable = false;
      fig.append(el('span', 'arm-spot'), img, el('span', 'arm-twinkle'), el('span', 'arm-twinkle arm-twinkle-b'));
      head.append(fig);
    }
    const logo = el('div', 'arm-logo');
    if (kick) logo.append(el('span', 'arm-kick', caps(kick)));
    const big = el('strong', 'vf-title arm-name', caps(name));
    big.dataset.text = caps(name);
    logo.append(big, el('span', 'vf-lv ar-free', 'Free play'));
    const keys = el('div', 'arm-keys');
    if (ARCADE_BY_ID[def.id]) {
      const board = el('button', 'cg-help-key ar-board-key', '🏆');
      board.type = 'button';
      board.setAttribute('aria-label', 'Weekly leaderboard');
      board.addEventListener('click', () => { playSound('select'); openLeaderboard(0, 'arcade'); });
      keys.append(board);
    }
    keys.append(helpKey(help, () => { help = !help; render(); }));
    head.append(logo, keys);
    fitText(big, 12);
    return head;
  }

  function render() {
    const head = marquee();
    const box = el('div', 'vf-panel ar-panel');
    if (help) {
      box.append(head, helpScreen());
      panel.root.replaceChildren(box);
      size(Math.min(cv.parentElement.clientWidth - 12, 240 * def.W / def.H));
      return loop();
    }
    const m = el('div', 'vf-meters ar-leds');
    for (const [k, cls] of [['Score', 'ar-score'], ['Best', 'ar-best']]) { const b = el('div', 'vf-meter'); b.append(el('span', '', k), el('b', cls, '0')); m.append(b); }
    cv = el('canvas', 'ar-canvas');
    g = cv.getContext('2d');
    const stage = el('div', 'ar-stage');
    stage.append(cv);
    const bezel = el('div', 'ar-bezel');
    bezel.append(m, stage);
    box.classList.add('ar-cab');
    box.classList.toggle('playing', state === 'play');
    box.append(head, bezel, deck(), el('p', 'vf-say ar-say', line));
    panel.root.replaceChildren(box);
    meters();
    size();
    fit?.disconnect();
    fit = new ResizeObserver(() => { if (cv.isConnected && !help) size(); });
    fit.observe(stage);
    bind();
    loop();
  }

  /** Before a game or after one, any control starts it (not in the first moments after a game over, so a held
      button doesn't throw the next one away). */
  const begin = () => { if (state === 'ready' || performance.now() - overAt > 600) start(); };

  /** The control deck under the screen, every cabinet's (the user's ask, 2026-10-12: an arcade's): a joystick on the
      left fed to the game as the arrow keys, START and EXIT in the middle, and the game's own round buttons on the right
      (`def.pad`: [label, action], e.g. Bubble Shooter's SHOOT). A game played by taps alone has `stick: false`; one
      steered by thumbs has `keys: { left, right }` instead, big arrow buttons held like the arrow keys ([label, key], e.g.
      Poliwag Crossing's ◀ ▶ and ▲ ▼; the user's ask the same day). Pressed on pointerdown so a phone's double-tap zoom
      never eats them. */
  function deck() {
    if (def.swipe) return swipeDeck();
    const row = el('div', 'ar-deck');
    const mid = sysKeys('ar-sys');
    const btns = el('div', 'ar-btns');
    for (const [label, act] of def.pad || []) btns.append(button(label, `ar-pad-${act}`, () => game[act]?.()));
    if (def.keys?.right) btns.append(arrows(def.keys.right));
    const left = def.keys?.left ? arrows(def.keys.left) : def.keys || def.stick === false ? el('div') : joystick();
    row.append(left, mid, btns);
    return row;
  }

  /** A game steered by swiping its screen (`swipe: true`) has no buttons to play with (the user's ask, 2026-10-12): a
      faint "swipe to play" mark, a fingertip gliding along it, and the two system keys side by side. */
  function swipeDeck() {
    const row = el('div', 'ar-deck ar-deck-swipe');
    const hint = el('div', 'ar-swipe');
    hint.append(el('span', 'ar-swipe-track'), el('span', 'ar-swipe-dot'), el('span', 'ar-swipe-text', 'Swipe to play'));
    row.append(hint, sysKeys('ar-pills'));
    return row;
  }

  /** START and EXIT as small round buttons with their names under them, a Neo Geo's (the user's call, 2026-10-12: the
      Game Boy's slanted pills looked ugly). */
  function sysKeys(cls) {
    const box = el('div', cls);
    const dot = (label, kind, fn) => {
      const b = key('', `ar-dot ${kind}`, fn);
      b.setAttribute('aria-label', label);
      const wrap = el('label', 'ar-dot-box');
      wrap.append(b, el('span', 'ar-dot-label', label));
      return wrap;
    };
    box.append(dot(state === 'play' ? 'Restart' : state === 'over' ? 'Again' : 'Start', 'ar-start', start),
      dot('Exit', 'ar-exit', () => panel.shut()));
    return box;
  }

  /** A round arcade button: `press` as it goes down, `lift` as it comes up (a held arrow key lets go). */
  function button(label, cls, press, lift) {
    const b = el('button', `ar-btn ${cls}`, '');
    b.type = 'button';
    b.append(el('span', 'ar-btn-cap'), el('span', 'ar-btn-label', label));
    let held = false;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      b.classList.add('down');
      try { b.setPointerCapture(e.pointerId); } catch {}
      if (state !== 'play') return begin();
      held = true;
      press();
    });
    b.addEventListener('click', hushBlip);   // the game sounds its own buttons; the menu blip on release doubled them
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => {
      b.classList.remove('down');
      if (held) { held = false; if (state === 'play') lift?.(); }
    });
    return b;
  }

  /** Big arrow buttons for a thumb, held down like the arrow keys. */
  function arrows(list) {
    const box = el('div', `ar-arrows${list.some(([, k]) => k === 'up' || k === 'down') ? ' ar-col' : ''}`);
    for (const [label, k] of list) box.append(button(label, `ar-arrow ar-arrow-${k}`, () => { playSound('fx-tick', 'select'); game.key?.(k, true); }, () => game.key?.(k, false)));
    return box;
  }

  /** An 8-way stick: tilting it presses the arrow keys it leans towards, letting go lets them all up. */
  function joystick() {
    const box = el('div', 'ar-stick');
    const knob = el('span', 'ar-knob');
    box.append(el('span', 'ar-stick-gate'), el('span', 'ar-shaft'), knob);
    const down = new Set();
    let id = null;
    const press = (want) => {
      for (const k of [...down]) if (!want.has(k)) { down.delete(k); if (state === 'play') game.key?.(k, false); }
      for (const k of want) if (!down.has(k)) { down.add(k); if (state === 'play') game.key?.(k, true); }
    };
    const lean = (dx, dy) => {
      const r = box.clientWidth / 2, d = Math.hypot(dx, dy), max = r * 0.42, f = d > max ? max / d : 1;
      box.style.setProperty('--sx', `${dx * f}px`); box.style.setProperty('--sy', `${dy * f}px`);
      const want = new Set(), dead = r * 0.22;
      if (d > dead) {
        const a = Math.atan2(dy, dx), c = Math.cos(a), s = Math.sin(a);
        if (c > 0.38) want.add('right'); if (c < -0.38) want.add('left');
        if (s > 0.38) want.add('down'); if (s < -0.38) want.add('up');
      }
      press(want);
    };
    const from = (e) => { const r = box.getBoundingClientRect(); lean(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2); };
    box.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (state !== 'play') return begin();   // the deck is drawn afresh as a game starts, so this stick is gone
      id = e.pointerId; try { box.setPointerCapture(id); } catch {} box.classList.add('held'); from(e);
    });
    box.addEventListener('pointermove', (e) => { if (e.pointerId === id) from(e); });
    const free = (e) => { if (e.pointerId !== id) return; id = null; box.classList.remove('held'); lean(0, 0); };
    box.addEventListener('pointerup', free);
    box.addEventListener('pointercancel', free);
    stick = (k, on) => {   // the arrow keys lean it too, so it reads as the controls
      if (id !== null) return;
      const [x, y] = [{ left: -1, right: 1 }[k] || 0, { up: -1, down: 1 }[k] || 0];
      if (!x && !y) return;
      box.style.setProperty('--sx', on ? `${x * box.clientWidth * 0.2}px` : '0px');
      box.style.setProperty('--sy', on ? `${y * box.clientWidth * 0.2}px` : '0px');
    };
    return box;
  }
  let stick = () => {};

  /** How to play as an attract screen: the game itself playing on a little CRT, then the steps as numbered tiles. */
  function helpScreen() {
    const card = el('div', 'ar-help');
    const scr = el('div', 'ar-help-screen');
    cv = el('canvas', 'ar-canvas ar-help-cv');
    g = cv.getContext('2d');
    scr.append(cv);
    const list = el('ol', 'ar-help-steps');
    def.help.forEach(([lead, rest], i) => {
      const li = el('li'), words = el('div');
      words.append(el('b', '', lead), ` ${rest}`);
      li.append(el('span', 'ar-step-no', String(i + 1)), words);
      list.append(li);
    });
    card.append(el('strong', 'ar-help-title', 'HOW TO PLAY'), scr, list, key('Got it!', 'vf-go', () => { playSound('confirm'); help = false; render(); }));
    return card;
  }

  function loop() {
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /** The screen as big as its stage allows at the game's own shape (the cabinet is full screen since 2026-10-12), at no
      more than 1.5 pixels a CSS pixel: at a phone's 2x and over, filling the canvas cost more frames than it looked. */
  function size(fixed) {
    const st = cv.parentElement;
    const w = fixed || Math.max(120, Math.floor(Math.min(st.clientWidth, st.clientHeight * def.W / def.H))) || 360;
    const dpr = Math.min(1.5, devicePixelRatio || 1), cw = Math.round(w * dpr), ch = Math.round(w * def.H / def.W * dpr);
    // resizing clears the canvas, so it is painted again at once rather than shown blank till the next frame
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; if (last) paint(performance.now()); }
    cv.style.width = `${w}px`;
    cv.style.height = `${w * def.H / def.W}px`;
  }

  function at(e) {
    const r = cv.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * def.W, (e.clientY - r.top) / r.height * def.H];
  }
  function bind() {
    cv.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      cv.setPointerCapture?.(e.pointerId);
      if (state !== 'play') { if (state === 'ready' || performance.now() - overAt > 600) start(); return; }
      game.down?.(...at(e));
    });
    cv.addEventListener('pointermove', (e) => { if (state === 'play') game.move?.(...at(e), e.buttons > 0 || e.pointerType === 'touch'); });
    cv.addEventListener('pointerup', (e) => { if (state === 'play') game.up?.(...at(e)); });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function onKey(e) {
    if (!cv?.isConnected || help || document.getElementById('board-dialog')?.open) return;
    const k = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', ' ': 'act', Enter: 'act', z: 'left', m: 'right' }[e.key];
    if (!k) return;
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'keydown' && state !== 'play' && k === 'act') { if (!e.repeat) start(); return; }
    if (state === 'play' && !(e.repeat && e.type === 'keydown')) game.key?.(k, e.type === 'keydown');
    if (!e.repeat) stick(k, e.type === 'keydown');
  }
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('keyup', onKey, true);

  function frame(now) {
    if (!cv?.isConnected) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state === 'play' && !help) game.tick?.(dt, now);
    paint(now);
    raf = requestAnimationFrame(frame);
  }

  function paint(now) {
    const s = cv.width / def.W;
    g.setTransform(s, 0, 0, s, 0, 0);
    g.clearRect(0, 0, def.W, def.H);
    if (game && !help) game.draw(g, now); else (preview ??= def.make(api)).draw(g, now);
    if (state !== 'play' && !help) {
      g.fillStyle = 'rgba(0, 0, 0, 0.45)'; g.fillRect(0, 0, def.W, def.H);
      if (state === 'over') banner(g, overText.toUpperCase(), def.W / 2, def.H * 0.4, def.W / 11, '#ffd84a', def.W * 0.9);
      banner(g, state === 'over' ? `${score.toLocaleString()}` : def.title.toUpperCase(), def.W / 2, def.H * (state === 'over' ? 0.52 : 0.42), def.W / (state === 'over' ? 8 : 11), '#fff', def.W * 0.9);
      if (!calm || state === 'ready') banner(g, 'TAP TO PLAY', def.W / 2, def.H * 0.64, def.W / 18, `rgba(255, 255, 255, ${0.6 + 0.4 * Math.sin(now / 250)})`);
    }
  }

  render();
  return panel;
}
