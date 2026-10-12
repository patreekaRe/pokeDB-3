/* arcade-kit.js  -  the shared cabinet for the Secret Base's arcade games (2026-10-12, the user's ask: ten arcade
   machines as Game Corner prizes, each playable at home). A game is a definition: its look (`colour`), a How to play
   (`help`), a logical canvas size (W x H) and make(api), which returns (and must not score or end the game until ticked or tapped, as the start screen draws one) { tick(dt, now), draw(g, now), down(x, y),
   move(x, y), up(x, y), key(k, down) } for one game. The kit runs the window (the Game Corner's panel), the loop, input
   in canvas units, Score / Best, the start and game-over screens and the game's own keys (`pad`), and keeps each game's best in the Game Corner's
   records (`arc-<id>`). Nothing here pays: these are free play. A new game is a file using runArcade() and a line in
   js/home-arcade.js. */

import { playSound, preloadSounds } from './audio.js';
import { el } from './ui.js';
import { calmFx } from './prefs.js';
import { openPanel, key, firstLook, helpKey } from './corner-panel.js';
import { record, best } from './corner-pot.js';
import { postArcadeScore, openLeaderboard } from './leaderboard.js';
import { ARCADE_BY_ID } from './data/leaderboard.js';
import { buddy } from './trainercard.js';

const sprites = new Map();
/** A Pokémon's front GIF as an image (its first frame when drawn on a canvas). */
export function sprite(id) {
  if (!sprites.has(id)) { const img = new Image(); img.src = `assets/pokemon/${id}-front.gif`; sprites.set(id, img); }
  return sprites.get(id);
}
/** Draws a sprite with its feet at (x, y), `h` units tall, flipped if `flip`. */
export function drawMon(g, id, x, y, h, flip = false) {
  const img = sprite(id);
  if (!img.complete || !img.naturalWidth) return;
  const w = h * img.naturalWidth / img.naturalHeight;
  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(x, y);
  if (flip) g.scale(-1, 1);
  g.drawImage(img, -w / 2, -h, w, h);
  g.restore();
}
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** Big centred text with a dark edge. */
export function banner(g, text, x, y, size, colour = '#fff') {
  g.font = `800 ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = size / 5; g.strokeStyle = 'rgba(0, 0, 0, 0.75)'; g.strokeText(text, x, y);
  g.fillStyle = colour; g.fillText(text, x, y);
}

/** Opens `def`'s game in the cabinet window; `onClose` once it's shut. */
export function runArcade(def, onClose) {
  preloadSounds('select', 'confirm', 'cancel', 'coins', 'stat-up', 'plink-1', 'plink-2', ...(def.sounds || []));
  const rec = `arc-${def.id}`;
  let state = 'ready', score = 0, game = null, raf = 0, last = 0, line = def.intro, help = firstLook(`arc-${def.id}`);
  let cv = null, g = null, overText = '', overAt = 0, preview = null, fit = null;

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
    m.querySelector('.ar-score').textContent = score.toLocaleString();
    m.querySelector('.ar-best').textContent = Math.max(best(rec), score).toLocaleString();
  }

  function render() {
    const head = el('div', 'vf-head');
    head.append(el('strong', 'vf-title', def.title.toUpperCase()), el('span', 'vf-lv ar-free', 'Free play'));
    if (ARCADE_BY_ID[def.id]) {
      const board = el('button', 'cg-help-key ar-board-key', '🏆');
      board.type = 'button';
      board.setAttribute('aria-label', 'Weekly leaderboard');
      board.addEventListener('click', () => { playSound('select'); openLeaderboard(0, 'arcade'); });
      head.append(board);
    }
    head.append(helpKey(help, () => { help = !help; render(); }));
    const box = el('div', 'vf-panel ar-panel');
    if (help) {
      box.append(head, helpScreen());
      panel.root.replaceChildren(box);
      size(Math.min(cv.parentElement.clientWidth - 12, 240 * def.W / def.H));
      return loop();
    }
    const m = el('div', 'vf-meters');
    for (const [k, cls] of [['Score', 'ar-score'], ['Best', 'ar-best']]) { const b = el('div', 'vf-meter'); b.append(el('span', '', k), el('b', cls, '0')); m.append(b); }
    cv = el('canvas', 'ar-canvas');
    g = cv.getContext('2d');
    const stage = el('div', 'ar-stage');
    stage.append(cv);
    const keys = el('div', 'vf-keys');
    keys.append(key(state === 'play' ? 'Restart' : state === 'over' ? 'Play again' : 'Play', 'vf-go', start), key('Close', 'vf-close', () => panel.shut()));
    box.append(head, m, stage);
    if (def.pad) box.append(padRow());
    box.append(el('p', 'vf-say', line), keys);
    panel.root.replaceChildren(box);
    meters();
    size();
    fit?.disconnect();
    fit = new ResizeObserver(() => { if (cv.isConnected && !help) size(); });
    fit.observe(stage);
    bind();
    loop();
  }

  /** A game's own big keys under the screen (`def.pad`: [label, action], e.g. Bubble Shooter's SHOOT); before a game
      or after one, a press starts it. Pressed on pointerdown so a phone's double-tap zoom never eats it. */
  function padRow() {
    const row = el('div', 'ar-pad');
    for (const [label, act] of def.pad) {
      const b = el('button', `vf-key ar-pad-key ar-pad-${act}`, label);
      b.type = 'button';
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (state !== 'play') { if (state === 'ready' || performance.now() - overAt > 600) start(); return; }
        game[act]?.();
      });
      row.append(b);
    }
    return row;
  }

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

  /** The screen as big as its stage allows at the game's own shape (the cabinet is full screen since 2026-10-12). */
  function size(fixed) {
    const st = cv.parentElement;
    const w = fixed || Math.max(120, Math.floor(Math.min(st.clientWidth, st.clientHeight * def.W / def.H))) || 360;
    const dpr = Math.min(2, devicePixelRatio || 1), cw = Math.round(w * dpr), ch = Math.round(w * def.H / def.W * dpr);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
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
  }
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('keyup', onKey, true);

  function frame(now) {
    if (!cv?.isConnected) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state === 'play' && !help) game.tick?.(dt, now);
    const s = cv.width / def.W;
    g.setTransform(s, 0, 0, s, 0, 0);
    g.clearRect(0, 0, def.W, def.H);
    if (game && !help) game.draw(g, now); else (preview ??= def.make(api)).draw(g, now);
    if (state !== 'play' && !help) {
      g.fillStyle = 'rgba(0, 0, 0, 0.45)'; g.fillRect(0, 0, def.W, def.H);
      if (state === 'over') banner(g, overText.toUpperCase(), def.W / 2, def.H * 0.4, def.W / 11, '#ffd84a');
      banner(g, state === 'over' ? `${score.toLocaleString()}` : def.title.toUpperCase(), def.W / 2, def.H * (state === 'over' ? 0.52 : 0.42), def.W / (state === 'over' ? 8 : 11));
      if (!calmFx() || state === 'ready') banner(g, 'TAP TO PLAY', def.W / 2, def.H * 0.64, def.W / 18, `rgba(255, 255, 255, ${0.6 + 0.4 * Math.sin(now / 250)})`);
    }
    raf = requestAnimationFrame(frame);
  }

  render();
  return panel;
}
