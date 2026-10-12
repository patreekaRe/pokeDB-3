/* arcade-bubble.js  -  Squirtle Bubble Shooter, a home arcade game (js/arcade-kit.js; 2026-10-12, the user's pick, in
   place of Unown Word Search), after Puzzle Bobble: Squirtle fires coloured bubbles up into a cluster hanging from the
   ceiling. Three or more of a colour touching pop, and any bubbles left hanging from nothing fall for a bonus. Every few
   shots the ceiling drops a new row; a bubble past the line at the bottom ends it. Endless, faster rows as it goes.
   Aim with the cabinet's ◀ ▶ buttons (or the arrow keys) and press SHOOT (or Space): a tap on the screen never aims or fires
   (the user's call, 2026-10-12), it only swaps the two bubbles at the bottom. Buttons, not the joystick (the user's ask, the
   same day): a stick leaning low sent "down", which swapped the bubbles by itself. The launcher stays drawn while a shot
   flies and the swap mark is a drawn path, not a glyph: both flickered on phones. The dotted path shows for the first
   AIM_SHOTS shots, then only the launcher's beam. The sea behind is painted once a scale (`seabed()`). Bubbles are drawn from sprites cached per colour and scale (a gradient each a frame lagged on phones), and a
   new row slides the cluster down instead of jumping. Its foot is Puzzle Bobble's (the user's ask, 2026-10-12): a brass
   launcher with a gold pointer between two animated Squirtles, the normal one and the shiny, facing each other, the left
   one pulling the next bubble out of a bag and loading it after every shot (`load`). A tap anywhere under the line
   swaps the loaded bubble and the bag's. */

import { runArcade, banner, stamp } from './arcade-kit.js';
import { gifFrames } from './hd2d.js';

const R = 15, COLS = 10, ROWH = R * Math.sqrt(3), TOP = 8, W = COLS * R * 2, H = 420;
const LINE = H - 78, GUN = [W / 2, H - 46], SPEED = 640, START_ROWS = 6;
const POP = 10, DROP = 20, AIM_SHOTS = 3, BAG = [36, H - 6], LOADER = 84, CRANK = W - 76, LOAD_S = 0.32;
/* the bubbles' colours (base, light, dark): water, fire, grass, electric, psychic, each with its glyph inside */
const COLOURS = [['#2a7af0', '#b8e0ff', '#0a2c80'], ['#e83030', '#ffb0a0', '#701010'], ['#30c040', '#c0ffb0', '#0c5a18'], ['#f8d018', '#fff8b0', '#906800'], ['#b050e0', '#f0c8ff', '#4a1070']];
const TAU = Math.PI * 2;

const sprites = new Map();
/** A type's glyph, drawn round (0, 0) in a bubble `r` round: a drop, a flame, a leaf, a bolt, an eye. */
function glyph(g, colour, r) {
  const k = r / 15;
  g.beginPath();
  if (colour === 0) { g.moveTo(0, -7 * k); g.bezierCurveTo(5 * k, -1 * k, 6 * k, 2 * k, 6 * k, 3.5 * k); g.arc(0, 3.5 * k, 6 * k, 0, Math.PI); g.bezierCurveTo(-6 * k, 2 * k, -5 * k, -1 * k, 0, -7 * k); }
  else if (colour === 1) { g.moveTo(0, -8 * k); g.bezierCurveTo(7 * k, -2 * k, 7 * k, 3 * k, 5 * k, 5 * k); g.quadraticCurveTo(0, 9 * k, -5 * k, 5 * k); g.bezierCurveTo(-7 * k, 2 * k, -4 * k, -1 * k, -3 * k, -4 * k); g.quadraticCurveTo(-1 * k, -1 * k, 0, -8 * k); }
  else if (colour === 2) { g.moveTo(-6 * k, 6 * k); g.bezierCurveTo(-7 * k, -3 * k, 0, -7 * k, 7 * k, -7 * k); g.bezierCurveTo(7 * k, 0, 3 * k, 7 * k, -6 * k, 6 * k); }
  else if (colour === 3) { g.moveTo(2 * k, -8 * k); g.lineTo(-5 * k, 1 * k); g.lineTo(0, 1 * k); g.lineTo(-2 * k, 8 * k); g.lineTo(5 * k, -1 * k); g.lineTo(0, -1 * k); g.closePath(); }
  else { g.moveTo(-7 * k, 0); g.quadraticCurveTo(0, -7 * k, 7 * k, 0); g.quadraticCurveTo(0, 7 * k, -7 * k, 0); }
  g.fill();
  if (colour === 4) { g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, 0, 2.4 * k, 0, TAU); g.fill(); g.restore(); }
}

/** One bubble painted once at a scale, `r` units round, its canvas 1 unit wider each side: Puzzle Bobble's glossy
    marbles, a dark outline, the colour deepening to the edge, a type glyph embossed inside, a bold shine top left and a
    rim of light bottom right. */
function bubbleSprite(colour, r, s) {
  const k = `${colour},${r},${s}`;
  if (sprites.has(k)) return sprites.get(k);
  const c = document.createElement('canvas'), px = Math.ceil((r + 1) * 2 * s);
  c.width = c.height = px;
  const g = c.getContext('2d');
  g.scale(s, s);
  const x = r + 1, y = r + 1, [base, light, dark] = COLOURS[colour];
  g.fillStyle = dark; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();   // the outline
  const body = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r * 0.95);
  body.addColorStop(0, light); body.addColorStop(0.35, base); body.addColorStop(0.8, base); body.addColorStop(1, dark);
  g.fillStyle = body; g.beginPath(); g.arc(x, y, r - 1.2, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(x, y, r - 1.2, 0, TAU); g.clip();
  g.translate(x + r * 0.04, y + r * 0.08);
  g.fillStyle = 'rgba(255, 255, 255, 0.35)'; g.translate(0.8, 0.8); glyph(g, colour, r);   // embossed: a light edge under
  g.fillStyle = dark; g.globalAlpha = 0.7; g.translate(-0.8, -0.8); glyph(g, colour, r);
  g.restore();
  const rim = g.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.6, x - r * 0.2, y - r * 0.2, r * 1.15);   // light through the bottom right
  rim.addColorStop(0, 'rgba(255, 255, 255, 0)'); rim.addColorStop(0.75, 'rgba(255, 255, 255, 0)'); rim.addColorStop(1, 'rgba(255, 255, 255, 0.55)');
  g.fillStyle = rim; g.beginPath(); g.arc(x, y, r - 1.2, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.92)';   // the shine
  g.beginPath(); g.ellipse(x - r * 0.38, y - r * 0.42, r * 0.3, r * 0.17, -0.75, 0, TAU); g.fill();
  g.beginPath(); g.arc(x - r * 0.62, y - r * 0.08, r * 0.08, 0, TAU); g.fill();
  sprites.set(k, c);
  return c;
}

const WEEDS = [[6, 70, 0], [16, 46, 2], [W - 8, 64, 1], [W - 19, 40, 3]];
let bed = null;
/** The sea painted once a scale: deep water fading down, far rocks, the cave's rocky ceiling with stalactites, and the
    seabed under the line where Squirtle stands, sand, coral and shells. */
function seabed(scale) {
  if (bed?.scale === scale) return bed.cv;
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * scale); cv.height = Math.round(H * scale);
  const g = cv.getContext('2d');
  g.scale(scale, scale);
  const sea = g.createLinearGradient(0, 0, 0, LINE); sea.addColorStop(0, '#04203e'); sea.addColorStop(0.55, '#0c4a7e'); sea.addColorStop(1, '#1a78a8');
  g.fillStyle = sea; g.fillRect(0, 0, W, LINE + 6);
  const glow = g.createRadialGradient(W / 2, -40, 10, W / 2, -40, 260); glow.addColorStop(0, 'rgba(120, 220, 255, 0.35)'); glow.addColorStop(1, 'rgba(120, 220, 255, 0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, LINE);
  g.fillStyle = 'rgba(4, 30, 60, 0.55)';   // far rocks
  g.beginPath(); g.moveTo(0, LINE + 6);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, LINE - 30 - Math.abs(Math.sin(x * 0.031) * 40) - (x % 60 ? 0 : 14));
  g.lineTo(W, LINE + 6); g.fill();
  g.fillStyle = '#06182c'; g.fillRect(0, 0, W, TOP);   // the cave's ceiling
  for (let i = 0; i < 20; i++) { const x = i * 15 + 3, d = 5 + (i * 7) % 9; g.beginPath(); g.moveTo(x - 6, TOP); g.lineTo(x, TOP + d); g.lineTo(x + 7, TOP); g.fill(); }
  const sand = g.createLinearGradient(0, LINE + 6, 0, H); sand.addColorStop(0, '#c8a868'); sand.addColorStop(1, '#8a6a3a');
  g.fillStyle = sand; g.beginPath(); g.moveTo(0, LINE + 10);
  for (let x = 0; x <= W; x += 10) g.lineTo(x, LINE + 8 + Math.sin(x * 0.07) * 3);
  g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.fillStyle = 'rgba(255, 240, 200, 0.35)'; for (let i = 0; i < 40; i++) g.fillRect((i * 47) % W, LINE + 16 + (i * 13) % (H - LINE - 20), 1.5, 1.5);
  const coral = (x, y, c, s) => {   // a branching coral
    g.strokeStyle = c; g.lineCap = 'round';
    const branch = (bx, by, a, l, w) => { if (l < 4) return; const ex = bx + Math.cos(a) * l, ey = by + Math.sin(a) * l; g.lineWidth = w; g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.stroke(); branch(ex, ey, a - 0.5, l * 0.68, w * 0.75); branch(ex, ey, a + 0.45, l * 0.62, w * 0.75); };
    branch(x, y, -Math.PI / 2, 14 * s, 4 * s);
  };
  coral(22, H - 6, '#ff6a8a', 1.1); coral(W - 30, H - 4, '#ff9a4a', 1.2); coral(W - 12, H - 10, '#e85aa8', 0.8);
  for (const [x, c] of [[84, '#f0d0e0'], [W - 70, '#ffe0b0']]) { g.fillStyle = c; g.beginPath(); g.arc(x, H - 8, 5, Math.PI, 0); g.fill(); g.strokeStyle = 'rgba(120, 80, 60, 0.5)'; g.lineWidth = 0.8; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x, H - 8); g.lineTo(x + k * 2.2, H - 12.5); g.stroke(); } }
  bed = { scale, cv };
  return cv;
}

/** The two Squirtles' GIFs split into frames once (null till loaded, or if the browser can't). */
const crew = {};
function crewFrames(id) {
  if (!(id in crew)) { crew[id] = null; gifFrames(`assets/pokemon/${id}-front.gif`).then(f => { crew[id] = f && { f, total: f.reduce((a, x) => a + x.ms, 0) }; }); }
  return crew[id];
}
/** An animated Squirtle with its feet at (x, y), `h` tall, mirrored to face right if `flip`. */
function squirtle(g, id, x, y, h, flip, now) {
  const a = crewFrames(id);
  if (!a) return;
  let t = now % a.total, fr = a.f[0];
  for (const f of a.f) { if (t < f.ms) { fr = f; break; } t -= f.ms; }
  const w = h * fr.bmp.width / fr.bmp.height, smooth = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  g.save();
  g.translate(x, y);
  if (flip) g.scale(-1, 1);
  g.drawImage(fr.bmp, -w / 2, -h, w, h);
  g.restore();
  g.imageSmoothingEnabled = smooth;
}

/** The bubble bag, a tied burlap sack open at the top, painted in a 56 x 50 box (its mouth at 28, 12). */
function bagArt(g) {
  g.lineJoin = 'round';
  const body = g.createRadialGradient(22, 30, 4, 28, 32, 30);
  body.addColorStop(0, '#f0c890'); body.addColorStop(0.7, '#c89058'); body.addColorStop(1, '#8a5a30');
  g.fillStyle = body; g.strokeStyle = '#5a3418'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(14, 16); g.bezierCurveTo(-2, 26, 2, 48, 28, 48); g.bezierCurveTo(54, 48, 58, 26, 42, 16); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(90, 52, 24, 0.35)'; g.lineWidth = 1;   // the weave
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(8 + i * 10, 18 + (i % 2) * 2); g.quadraticCurveTo(10 + i * 9, 34, 12 + i * 8, 46); g.stroke(); }
  g.fillStyle = '#7a4a22';   // the open mouth
  g.beginPath(); g.ellipse(28, 13, 15, 5, 0, 0, TAU); g.fill();
  g.strokeStyle = '#5a3418'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#e8b878'; g.strokeStyle = '#5a3418';   // the folded lip
  for (const x of [15, 41]) { g.beginPath(); g.ellipse(x, 14, 5, 3.5, x < 28 ? -0.5 : 0.5, 0, TAU); g.fill(); g.stroke(); }
  g.fillStyle = '#c03030'; g.strokeStyle = '#601010'; g.lineWidth = 1.5;   // a Poké Ball patch
  g.beginPath(); g.arc(28, 33, 7, Math.PI, 0); g.fill(); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(28, 33, 7, 0, Math.PI); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(21, 33); g.lineTo(35, 33); g.stroke();
  g.beginPath(); g.arc(28, 33, 2.2, 0, TAU); g.fill(); g.stroke();
}
/** The front of the bag, painted over the bubble sitting in its mouth so it peeks out. */
function bagLip(g) {
  g.fillStyle = '#c89058'; g.strokeStyle = '#5a3418'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(13, 13); g.quadraticCurveTo(28, 22, 43, 13); g.lineTo(43, 18); g.quadraticCurveTo(28, 26, 13, 18); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#e8b878';
  for (const x of [15, 41]) { g.beginPath(); g.ellipse(x, 14, 5, 3.5, x < 28 ? -0.5 : 0.5, 0, TAU); g.fill(); g.stroke(); }
}
/** The launcher's still parts in a 96 x 60 box (the bubble's middle at 48, 30): Puzzle Bobble's brass half-wheel with
    its spokes and rivets standing on a geared base. */
function launcherArt(g) {
  const cx = 48, cy = 30;
  g.lineCap = 'round'; g.lineJoin = 'round';
  const brass = g.createLinearGradient(0, 4, 0, 60);
  brass.addColorStop(0, '#ffe8a0'); brass.addColorStop(0.45, '#d8a040'); brass.addColorStop(1, '#8a5a18');
  g.fillStyle = '#7a5020';   // the base under the wheel
  g.beginPath(); g.moveTo(cx - 34, 60); g.lineTo(cx - 24, cy + 14); g.lineTo(cx + 24, cy + 14); g.lineTo(cx + 34, 60); g.fill();
  g.fillStyle = brass; g.strokeStyle = '#4a2c08'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(cx - 32, 60); g.lineTo(cx - 22, cy + 13); g.lineTo(cx + 22, cy + 13); g.lineTo(cx + 32, 60); g.closePath(); g.fill(); g.stroke();
  for (const [x, r] of [[cx - 16, 7], [cx + 16, 7]]) {   // gears on the base
    g.fillStyle = '#b07828'; g.beginPath();
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16, rr = i % 2 ? r : r + 2.2; g.lineTo(x + Math.cos(a) * rr, 52 + Math.sin(a) * rr); }
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#4a2c08'; g.beginPath(); g.arc(x, 52, 2, 0, TAU); g.fill();
  }
  g.strokeStyle = '#4a2c08'; g.lineWidth = 9;   // the half-wheel, outlined then brass
  g.beginPath(); g.arc(cx, cy, 25, Math.PI * 0.92, Math.PI * 2.08); g.stroke();
  g.strokeStyle = brass; g.lineWidth = 6; g.stroke();
  g.strokeStyle = 'rgba(255, 248, 210, 0.7)'; g.lineWidth = 1.2;
  g.beginPath(); g.arc(cx, cy, 26.5, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
  g.strokeStyle = '#4a2c08'; g.lineWidth = 4;   // spokes down to the hub
  for (const a of [0.15, 0.85]) { g.beginPath(); g.moveTo(cx + Math.cos(a * Math.PI) * 24, cy + Math.sin(a * Math.PI) * 24); g.lineTo(cx, cy + 16); g.stroke(); }
  g.strokeStyle = '#d8a040'; g.lineWidth = 2;
  for (const a of [0.15, 0.85]) { g.beginPath(); g.moveTo(cx + Math.cos(a * Math.PI) * 24, cy + Math.sin(a * Math.PI) * 24); g.lineTo(cx, cy + 16); g.stroke(); }
  g.fillStyle = '#fff0b8'; g.strokeStyle = '#4a2c08'; g.lineWidth = 1;   // rivets
  for (let i = 0; i <= 6; i++) { const a = Math.PI * (0.95 + i * 0.183); g.beginPath(); g.arc(cx + Math.cos(a) * 25, cy + Math.sin(a) * 25, 1.6, 0, TAU); g.fill(); g.stroke(); }
}
/** The gold pointer the launcher turns, from the wheel out along `angle`: Puzzle Bobble's arrow. */
function pointer(g, angle, light) {
  const [gx, gy] = GUN, cx = Math.cos(angle), cy = Math.sin(angle), nx = -cy, ny = cx;
  const p = (d, w) => [gx + cx * d + nx * w, gy + cy * d + ny * w];
  g.save();
  g.lineJoin = 'round';
  g.fillStyle = '#ffd860'; g.strokeStyle = '#5a3408'; g.lineWidth = 1.8;
  g.beginPath();
  for (const [d, w] of [[R + 10, 3], [R + 30, 3], [R + 30, 8], [R + 46, 0], [R + 30, -8], [R + 30, -3], [R + 10, -3]]) g.lineTo(...p(d, w));
  g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = light; g.lineWidth = 1.4;   // a shine down its middle in the loaded bubble's light
  g.beginPath(); g.moveTo(...p(R + 12, 0.5)); g.lineTo(...p(R + 40, 0.5)); g.stroke();
  g.restore();
}

export const openBubble = (onClose) => runArcade({
  id: 'bubble', title: 'Squirtle Bubble Shooter', colour: '#3a8ae8', W, H,
  intro: 'Match three bubbles to pop them! Aim with ◀ ▶, then press SHOOT.',
  go: '◀ ▶ to aim, SHOOT to fire. Tap under the line to swap with the bag.',
  keys: { left: [['◀', 'left'], ['▶', 'right']] },
  pad: [['SHOOT', 'fire']],
  sounds: ['fx-bloop', 'fx-bubble'],
  help: [['Hold ◀ or ▶ to aim, then press SHOOT.', 'The beam shows where it goes (arrow keys and Space work too). Bounce shots off the walls!'], ['Tap under the line to swap.', 'The loaded bubble and the one in the bag trade places.'], ['Three or more of a colour touching pop.', `${POP} a bubble, and ${DROP} for each one left hanging that falls.`], ['Every few shots a new row pushes down.', 'Don\'t let them past the line!']],
  make(api) {
    let load = null, cheer = 0, rows = [], flip = 0, angle = -Math.PI / 2, held = 0, shot = null, shots = 0, fired = 0, slide = 0, scale = 1, cur, next;
    const falling = [], bursts = [];
    let pressed = { left: false, right: false };
    const offset = (r) => ((r + flip) % 2 ? R : 0);
    const width = (r) => (offset(r) ? COLS - 1 : COLS);
    const pos = (r, c) => [R + c * R * 2 + offset(r), TOP + R + r * ROWH];
    const randomRow = (r, n = COLOURS.length) => Array.from({ length: width(r) }, () => Math.floor(Math.random() * n));
    const colours = () => { const s = new Set(); rows.forEach(row => row.forEach(v => v !== null && v !== undefined && s.add(v))); return [...s]; };
    const deal = () => { const c = colours(); return c.length ? c[Math.floor(Math.random() * c.length)] : Math.floor(Math.random() * COLOURS.length); };
    for (let r = 0; r < START_ROWS; r++) rows.push(randomRow(r, 4));
    cur = deal(); next = deal();
    const pushEvery = () => Math.max(4, 8 - Math.floor(api.score / 800));

    const neighbours = (r, c) => {
      const d = offset(r) ? [0, 1] : [-1, 0], out = [[r, c - 1], [r, c + 1]];
      for (const rr of [r - 1, r + 1]) for (const dc of d) out.push([rr, c + dc]);
      return out.filter(([a, b]) => a >= 0 && a < rows.length && b >= 0 && b < width(a));
    };
    const at = (r, c) => rows[r]?.[c] ?? null;
    const flood = (starts, same) => {
      const seen = new Set(starts.map(([r, c]) => `${r},${c}`)), list = [...starts];
      for (let i = 0; i < list.length; i++) {
        for (const [a, b] of neighbours(...list[i])) {
          const k = `${a},${b}`;
          if (seen.has(k) || at(a, b) === null || (same !== undefined && at(a, b) !== same)) continue;
          seen.add(k); list.push([a, b]);
        }
      }
      return list;
    };
    const lower = () => {
      flip ^= 1;
      rows.unshift(randomRow(0, Math.max(3, colours().length)));
      slide += ROWH;
    };
    const trim = () => { while (rows.length && rows[rows.length - 1].every(v => v === null)) rows.pop(); };
    const tooLow = () => rows.some((row, r) => row.some(v => v !== null) && pos(r, 0)[1] + R > LINE);

    /** The nearest empty cell to (x, y), touching the ceiling or a bubble. */
    const snap = (x, y) => {
      const guess = Math.max(0, Math.round((y - TOP - R) / ROWH));
      let bestCell = null, bestD = Infinity;
      for (let r = Math.max(0, guess - 1); r <= guess + 1; r++) {
        while (rows.length <= r) rows.push(Array(width(rows.length)).fill(null));
        for (let c = 0; c < width(r); c++) {
          if (at(r, c) !== null) continue;
          if (r > 0 && !neighbours(r, c).some(([a, b]) => at(a, b) !== null)) continue;
          const [px, py] = pos(r, c), d = (px - x) ** 2 + (py - y) ** 2;
          if (d < bestD) { bestD = d; bestCell = [r, c]; }
        }
      }
      return bestCell;
    };

    const land = (x, y, colour) => {
      const cell = snap(x, y);
      if (!cell) return;
      rows[cell[0]][cell[1]] = colour;
      const group = flood([cell], colour);
      if (group.length >= 3) {
        cheer = 0.6;
        for (const [r, c] of group) { const [px, py] = pos(r, c); bursts.push({ x: px, y: py, colour, t: 0 }); rows[r][c] = null; }
        api.add(group.length * POP);
        api.sound('fx-bubble', 'plink-1');
        const tops = rows[0] ? rows[0].map((v, c) => [0, c]).filter(([r, c]) => at(r, c) !== null) : [];
        const held = new Set(flood(tops).map(([r, c]) => `${r},${c}`));
        let dropped = 0;
        rows.forEach((row, r) => row.forEach((v, c) => {
          if (v === null || held.has(`${r},${c}`)) return;
          const [px, py] = pos(r, c);
          falling.push({ x: px, y: py, vy: -60 - Math.random() * 80, vx: (Math.random() - 0.5) * 80, colour: v });
          rows[r][c] = null; dropped++;
        }));
        if (dropped) { api.add(dropped * DROP); api.say(`${dropped} dropped! +${dropped * DROP}`); api.sound('coins', 'plink-2'); }
        else if (group.length >= 5) api.say(`${group.length} popped! Splashing!`);
      }
      trim();
      if (++shots % pushEvery() === 0) { lower(); api.say('The ceiling drops a row!'); }
      if (!rows.some(row => row.some(v => v !== null))) { api.add(500); api.say('Board cleared! +500'); for (let r = 0; r < START_ROWS; r++) rows.push(randomRow(r, 4)); }
      if (tooLow()) api.over('The bubbles reached the line!');
    };

    const fire = () => {
      if (shot) return;
      shot = { x: GUN[0], y: GUN[1], vx: Math.cos(angle) * SPEED, vy: Math.sin(angle) * SPEED, colour: cur };
      fired++;
      cur = next; next = deal();
      load = { t: 0 };
      api.sound('fx-bloop', 'select');
    };
    const aimAt = (x, y) => { angle = Math.max(-Math.PI + 0.18, Math.min(-0.18, Math.atan2(y - GUN[1], x - GUN[0]))); };
    const onSwap = (x, y) => y > LINE + 6;
    const swap = () => { if (cur === next || load) return; [cur, next] = [next, cur]; api.sound('select'); };

    const bubble = (g, x, y, colour, r = R) => {
      const c = bubbleSprite(colour, r, scale);
      g.drawImage(c, x - r - 1, y - r - 1, c.width / scale, c.height / scale);
    };

    return {
      tick(dt) {
        // the aim turns slowly at first for fine aim, then faster the longer it's held
        const turn = (pressed.right ? 1 : 0) - (pressed.left ? 1 : 0);
        held = turn ? held + dt : 0;
        const rate = 0.7 + Math.min(1.5, held * 2.2);
        if (turn) aimAt(GUN[0] + Math.cos(angle + turn * rate * dt) * 100, GUN[1] + Math.sin(angle + turn * rate * dt) * 100);
        if (shot) {
          const steps = 6;
          for (let i = 0; i < steps && shot; i++) {
            const lift = slide;
            shot.x += shot.vx * dt / steps; shot.y += shot.vy * dt / steps;
            if (shot.x < R) { shot.x = R; shot.vx = Math.abs(shot.vx); }
            if (shot.x > W - R) { shot.x = W - R; shot.vx = -Math.abs(shot.vx); }
            let hit = shot.y <= TOP + R;
            if (!hit) rows.forEach((row, r) => row.forEach((v, c) => { if (v === null || hit) return; const [px, py] = pos(r, c); if ((px - shot.x) ** 2 + (py - lift - shot.y) ** 2 < (R * 1.75) ** 2) hit = true; }));
            if (hit) { const s = shot; shot = null; land(s.x, s.y + lift, s.colour); }
          }
        }
        if (load && (load.t += dt) >= LOAD_S) load = null;
        if (cheer) cheer = Math.max(0, cheer - dt);
        if (slide) { slide *= Math.exp(-dt * 9); if (slide < 0.2) slide = 0; }
        for (let i = falling.length - 1; i >= 0; i--) { const f = falling[i]; f.vy += 900 * dt; f.y += f.vy * dt; f.x += f.vx * dt; if (f.y > H + R) falling.splice(i, 1); }
        for (let i = bursts.length - 1; i >= 0; i--) if ((bursts[i].t += dt) > 0.35) bursts.splice(i, 1);
      },
      fire,
      down(x, y) { if (onSwap(x, y)) swap(); },
      key(k, down) { if (k === 'left' || k === 'right') pressed[k] = down; else if (k === 'act' && down) fire(); else if (k === 'down' && down) swap(); },
      draw(g, now) {
        scale = g.getTransform().a;
        g.drawImage(seabed(scale), 0, 0, W, H);
        g.fillStyle = 'rgba(200, 235, 255, 0.07)';   // light shafts drifting
        for (let i = 0; i < 4; i++) { const x = (i * 83 + now / 70) % (W + 60) - 30; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 26, 0); g.lineTo(x - 34, LINE); g.lineTo(x - 54, LINE); g.fill(); }
        for (const [sx, h, ph] of WEEDS) {   // kelp swaying up the walls
          g.strokeStyle = '#1e7a5a'; g.lineWidth = 5; g.lineCap = 'round';
          g.beginPath(); g.moveTo(sx, LINE + 6);
          for (let y = 1; y <= 6; y++) g.lineTo(sx + Math.sin(now / 700 + ph + y * 0.7) * y * 1.6, LINE + 6 - y * h / 6);
          g.stroke();
        }
        g.fillStyle = 'rgba(200, 235, 255, 0.35)';   // little bubbles rising
        for (let i = 0; i < 9; i++) { const y = LINE - ((i * 53 + now / 30) % LINE), x = (i * 37) % W + Math.sin(now / 500 + i) * 4; g.beginPath(); g.arc(x, y, 1.2 + (i % 3) * 0.7, 0, TAU); g.fill(); }
        rows.forEach((row, r) => row.forEach((v, c) => { if (v === null) return; const [px, py] = pos(r, c); bubble(g, px, py - slide, v); }));
        for (const b of bursts) { g.strokeStyle = COLOURS[b.colour][1]; g.globalAlpha = 1 - b.t / 0.35; g.lineWidth = 2; g.beginPath(); g.arc(b.x, b.y, R * (1 + b.t * 3), 0, TAU); g.stroke(); g.globalAlpha = 1; }
        for (const f of falling) bubble(g, f.x, f.y, f.colour);
        g.strokeStyle = `rgba(255, 90, 90, ${0.5 + 0.3 * Math.sin(now / 200)})`; g.setLineDash([8, 6]); g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, LINE); g.lineTo(W, LINE); g.stroke(); g.setLineDash([]);
        // the aim: dots along the path for the first shots, one bounce shown; the arrow always
        if (!shot && fired < AIM_SHOTS) {
          let x = GUN[0], y = GUN[1], vx = Math.cos(angle), vy = Math.sin(angle);
          g.fillStyle = 'rgba(255, 255, 255, 0.7)';
          for (let i = 0; i < 26 && y > TOP + R; i++) {
            x += vx * 12; y += vy * 12;
            if (x < R || x > W - R) { vx = -vx; x = Math.max(R, Math.min(W - R, x)); }
            g.beginPath(); g.arc(x, y, i % 2 ? 1.6 : 2.4, 0, TAU); g.fill();
          }
        }
        const [gx, gy] = GUN, mouth = [BAG[0], BAG[1] - 38], hop = (t, k = 1) => Math.abs(Math.sin(t * Math.PI)) * 7 * k;
        stamp(g, 'bubble-launcher', gx - 48, gy - 30, 96, 60, launcherArt);
        pointer(g, angle, COLOURS[cur][1]);
        const l = load ? load.t / LOAD_S : 1;
        // the loaded bubble: on its way from the bag in an arc while loading, then sat in the wheel
        if (l < 1) bubble(g, mouth[0] + (gx - mouth[0]) * l, mouth[1] + (gy - mouth[1]) * l - Math.sin(l * Math.PI) * 34, cur);
        else bubble(g, gx, gy, cur);
        if (shot) bubble(g, shot.x, shot.y, shot.colour);
        stamp(g, 'bubble-bag', BAG[0] - 28, BAG[1] - 50, 56, 50, bagArt);
        bubble(g, mouth[0], mouth[1] + 2 + (1 - l) * 12, next, R * 0.8);   // the next one rising into the bag's mouth
        stamp(g, 'bubble-baglip', BAG[0] - 28, BAG[1] - 50, 56, 50, bagLip);
        squirtle(g, 'squirtle', LOADER, H - 1 - (l < 1 ? hop(l) : 0) - hop(cheer / 0.6 * 2, cheer ? 1 : 0), 58, true, now);
        squirtle(g, 'squirtle-shiny', CRANK, H - 3 - hop(cheer / 0.6 * 2, cheer ? 1 : 0) - (l < 1 ? hop(l, 0.5) : 0), 58, false, now + 400);
        banner(g, 'NEXT', BAG[0], BAG[1] - 60, 9, '#a8d4ff');
        banner(g, 'TAP TO SWAP', GUN[0], H - 5, 9, '#ffd84a');
        banner(g, `Row in ${pushEvery() - (shots % pushEvery())}`, W - 30, LINE + 14, 10, '#ffffff');
      },
    };
  },
}, onClose);
