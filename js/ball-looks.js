/* ball-looks.js  -  every ball as a 3D ball (2026-10-27, the user's ask: the battle's balls the same 3D balls as the
   Pokémon Center's machine). One skin painter a ball, wrapped round a sphere by the Center (js/center-3d.js), the Safari
   Outfitter (js/mall-outfitter.js) and tools/ball-sheets.mjs, which renders each into a spinning sprite sheet in
   assets/balls/ for the battle's throws (a sheet, not a WebGL context: the battle screen shares the phone's GPU with the
   arena and the warmed rooms). A skin is painted in 64 x 32 units: x runs round the sphere (16 the front, where the
   button is), y top to bottom, the band at 15-17. Keys are the item sprites' names (`poke-ball`, `love-ball`). */

/** Frames in a sheet: one turn, clockwise, the light staying put. */
export const BALL_FRAMES = 16;

const RIM = '#26262c';
const dot = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
/** Paint at the front (x 16) and the back (x 48). */
const twice = (f) => { f(16); f(48); };

/* top: a colour, or [upper, lower] for a gradient; bottom: white unless given; band: the dark band unless given. */
const LOOKS = {
  'poke-ball': { top: ['#ff6a5a', '#e02a20'] },
  'safari-ball': { top: '#8cae48', paint: (g) => {
    g.fillStyle = '#3e7a3a';
    for (const [x, y, rx, ry] of [[6, 5, 3.6, 2.6], [20, 3, 3, 2], [27, 9, 3.4, 2.6], [12, 11, 3, 2.4], [38, 5, 3.6, 2.4], [50, 10, 3.4, 2.8], [58, 3, 3, 2]]) {
      g.beginPath(); g.ellipse(x, y, rx, ry, 0.5, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = '#d8b848';
    for (const [x, y] of [[16, 6], [44, 11], [31, 3], [2, 11]]) { g.beginPath(); g.ellipse(x, y, 2.4, 1.7, -0.4, 0, Math.PI * 2); g.fill(); }
  } },
  'great-ball': { top: '#3a74e0', paint: (g) => { g.fillStyle = '#e04838'; for (const x of [0, 32, 64]) { g.beginPath(); g.roundRect(x - 5, 2.5, 10, 11, 3); g.fill(); } } },
  'ultra-ball': { top: '#2c2c34', paint: (g) => { g.fillStyle = '#f8d040'; for (const x of [0, 32, 64]) g.fillRect(x - 4, 1, 8, 15); } },
  'dusk-ball': { top: '#26362a', bottom: '#2c2c30', paint: (g) => {
    g.fillStyle = '#58c060'; g.fillRect(0, 3.5, 64, 2.4); g.fillRect(0, 9.5, 64, 2);
    g.fillStyle = '#f08030'; for (let x = 4; x < 64; x += 8) dot(g, x, 13.4, 0.9);
  } },
  'quick-ball': { top: '#3a6ad8', paint: (g) => { g.fillStyle = '#f8d040'; for (let x = 0; x <= 64; x += 16) { g.beginPath(); g.ellipse(x, 7.5, 4.2, 5.6, 0, 0, Math.PI * 2); g.fill(); } } },
  'timer-ball': { top: '#f6f6f6', paint: (g) => { g.fillStyle = '#e04838'; g.fillRect(0, 0, 64, 4.2); g.fillStyle = '#2c2c34'; for (const y of [6.4, 9.4, 12.4]) g.fillRect(0, y, 64, 1.4); } },
  'net-ball': { top: '#3aa8c8', paint: (g) => {
    g.strokeStyle = '#1e2a34'; g.lineWidth = 0.55;
    g.beginPath();
    for (let x = 0; x <= 64; x += 4) { g.moveTo(x, 0); g.lineTo(x, 16); }
    for (let y = 3; y < 16; y += 4) { g.moveTo(0, y); g.lineTo(64, y); }
    g.stroke();
  } },
  'luxury-ball': { top: '#2a2a30', bottom: '#2a2a30', paint: (g) => { g.fillStyle = '#d83838'; g.fillRect(0, 6, 64, 2); g.fillStyle = '#e8c048'; g.fillRect(0, 9.2, 64, 2.2); g.fillRect(0, 17.6, 64, 1.2); } },
  'master-ball': { top: '#7a3ac0', paint: (g) => {
    g.fillStyle = '#e870b8'; for (const x of [6.5, 25.5, 38.5, 57.5]) dot(g, x, 8, 3.4);
    g.fillStyle = '#ffffff'; g.font = '900 7px "Trebuchet MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    twice(x => g.fillText('M', x, 9.4));
  } },
  // Kurt's Apricorns (js/data/workshop.js's SKINS), after their HGSS sprites
  'level-ball': { top: '#4a4244', paint: (g) => { g.fillStyle = '#d04030'; g.fillRect(0, 6, 64, 2.6); g.fillStyle = '#e8b890'; g.fillRect(0, 9, 64, 6); g.fillStyle = '#d09050'; g.fillRect(0, 12.5, 64, 2.5); } },
  'lure-ball': { top: '#2a90c8', paint: (g) => {
    g.fillStyle = '#d05060'; twice(x => { g.beginPath(); g.ellipse(x - 2, 3, 10, 6, 0, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#f0c050'; twice(x => { for (const d of [-6, -2, 2]) g.fillRect(x + d, 6.5, 2.2, 3); });
    g.fillStyle = '#e08050'; twice(x => g.fillRect(x - 6, 9.5, 8.2, 1.2));
  } },
  'moon-ball': { top: ['#7488a0', '#506680'], paint: (g, top) => {
    twice(x => {
      g.fillStyle = '#f0c840'; dot(g, x, 6.5, 4.6);
      g.fillStyle = top; dot(g, x + 2.2, 5.2, 4.1);
    });
    g.fillStyle = '#a8f0f8';
    for (const [x, y] of [[6, 11], [25, 10], [30, 4], [40, 12], [56, 9], [9, 3]]) dot(g, x, y, 1.1);
  } },
  'friend-ball': { top: '#80c030', paint: (g) => {
    g.fillStyle = '#c05040';
    for (const [x, y, a] of [[9, 9, 0.6], [23, 8, -0.5], [41, 9, 0.6], [55, 8, -0.5]]) { g.beginPath(); g.ellipse(x, y, 3.2, 1.8, a, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#f0d010'; twice(x => dot(g, x, 4.5, 2));
  } },
  'love-ball': { top: '#d880b8', paint: (g) => {
    g.fillStyle = '#f8c8e4';
    twice(x => {
      const y = 4, s = 3.4;
      g.beginPath(); g.moveTo(x, y + s * 0.6);
      g.bezierCurveTo(x - s * 1.6, y - s * 0.6, x - s * 1.4, y + s * 1.6, x, y + s * 2.8);
      g.bezierCurveTo(x + s * 1.4, y + s * 1.6, x + s * 1.6, y - s * 0.6, x, y + s * 0.6);
      g.fill();
    });
  } },
  'heavy-ball': { top: '#98a8b8', paint: (g) => {
    g.fillStyle = '#5070d0'; for (const x of [2, 28, 34, 60]) g.fillRect(x - 2.5, 0, 5, 15);
    g.fillStyle = '#3050a0'; for (const x of [2, 28, 34, 60]) g.fillRect(x - 2.5, 11, 5, 4);
  } },
  'fast-ball': { top: '#e88040', paint: (g) => {
    g.fillStyle = '#f0c030'; twice(x => { g.beginPath(); g.moveTo(x - 6, 0); g.lineTo(x + 6, 0); g.lineTo(x, 14); g.closePath(); g.fill(); });
    g.fillStyle = '#fafafa'; twice(x => { dot(g, x - 8, 6, 1.8); dot(g, x + 8, 6, 1.8); });
  } },
  // the friends' secret ones
  'nest-ball': { top: '#70c030', paint: (g) => {
    g.fillStyle = '#f0f090'; g.beginPath(); g.moveTo(0, 15);
    for (let x = 0; x <= 64; x += 2) g.lineTo(x, 9.5 + Math.sin(x / 64 * Math.PI * 8) * 1.4);
    g.lineTo(64, 15); g.closePath(); g.fill();
  } },
  'repeat-ball': { top: ['#f0a030', '#e06030'], paint: (g) => { g.fillStyle = '#f0e030'; twice(x => g.fillRect(x - 2, 0, 4, 15)); g.fillRect(0, 6, 64, 2.6); } },
  'dream-ball': { top: '#f0b8d8', bottom: '#c8b8e8', paint: (g) => { g.fillStyle = '#f060a0'; g.fillRect(0, 0, 64, 6); g.fillStyle = '#f8d8ec'; twice(x => dot(g, x - 4, 8, 1.4)); } },
  'cherish-ball': { top: '#f04030', bottom: '#c83828', paint: (g) => {
    g.strokeStyle = '#a82818'; g.lineWidth = 1;
    twice(x => { g.beginPath(); g.arc(x - 3, 8, 2.6, Math.PI * 0.2, Math.PI * 1.8); g.stroke(); g.beginPath(); g.arc(x + 3, 8, 2.6, Math.PI * 1.2, Math.PI * 0.8); g.stroke(); });
  } },
  'sport-ball': { top: '#f09030', paint: (g) => {
    g.fillStyle = '#c05030'; for (const [x, y] of [[4, 4], [11, 11], [24, 6], [30, 12], [38, 3], [45, 9], [56, 5], [61, 12]]) dot(g, x, y, 1.8);
    g.fillStyle = '#f0e0a0'; twice(x => { g.beginPath(); g.ellipse(x - 2, 6, 3, 2.4, 0, 0, Math.PI * 2); g.fill(); });
  } },
  'heal-ball': { top: ['#f088d8', '#d850b8'], band: '#5878c0', bottom: '#f6e4f0' },
  'park-ball': { top: ['#f8e070', '#e0a830'], band: '#1a4ea0', bottom: '#3a78d8' },
  'premier-ball': { top: '#f6f6f8', band: '#c84030' },
  'jet-ball': { top: '#d0ecf4', bottom: '#5a5a62', paint: (g) => {
    g.fillStyle = '#1e7cc0'; twice(x => { for (const d of [-7, 5]) { g.beginPath(); g.moveTo(x + d, 15); g.lineTo(x + d + 3, 15); g.lineTo(x + d + 7, 0); g.lineTo(x + d + 4, 0); g.closePath(); g.fill(); } });
  } },
  'beast-ball': { top: '#3a62c8', bottom: '#2a2aa0', paint: (g) => {
    g.fillStyle = '#48a8e8'; twice(x => { g.beginPath(); g.ellipse(x, 7, 4.5, 6, 0, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#e8c820'; for (const x of [6, 26, 38, 58]) { g.fillRect(x - 1.2, 0, 2.4, 32); }
  } },
};

/** The balls with a 3D look (and a sheet in assets/balls/). */
export const BALL_LOOKS = Object.keys(LOOKS);

/** Paint a ball's skin into `g`, already scaled to 64 x 32 units. */
export function paintBallSkin(g, sprite) {
  const k = LOOKS[sprite] ?? LOOKS['poke-ball'];
  g.fillStyle = k.bottom ?? '#f4f4f4'; g.fillRect(0, 0, 64, 32);
  let top = k.top;
  if (Array.isArray(k.top)) {
    top = g.createLinearGradient(0, 0, 0, 16);
    top.addColorStop(0, k.top[0]); top.addColorStop(1, k.top[1]);
  }
  g.fillStyle = top; g.fillRect(0, 0, 64, 16);
  k.paint?.(g, Array.isArray(k.top) ? k.top[1] : k.top);
  g.fillStyle = k.band ?? RIM; g.fillRect(0, 14.9, 64, 2.2);
}

/** A ball's skin on a canvas of its own, `scale` pixels a unit. */
export function ballSkinCanvas(sprite, scale = 8) {
  const c = document.createElement('canvas');
  c.width = 64 * scale; c.height = 32 * scale;
  const g = c.getContext('2d');
  g.scale(scale, scale);
  paintBallSkin(g, sprite);
  return c;
}

/** A 3D ball in the page: its sheet's first frame (`.ball3d.spin` turns it; `.back` the other way). Unknown looks get
    the Poké Ball's. */
export function ball3d(sprite, cls = '') {
  const b = document.createElement('span');
  b.className = `ball3d${cls ? ` ${cls}` : ''}`;
  b.setAttribute('aria-hidden', 'true');
  setBall3d(b, sprite);
  return b;
}
export function setBall3d(node, sprite) {
  // absolute: a url() in a custom property resolves against the stylesheet that uses it (css/), not the page
  node.style.setProperty('--sheet', `url("${new URL(`assets/balls/${LOOKS[sprite] ? sprite : 'poke-ball'}.webp`, document.baseURI).href}")`);
}
