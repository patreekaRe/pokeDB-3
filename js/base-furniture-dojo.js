/* base-furniture-dojo.js  -  Kenmatta's dojo set (docs/roadmap.md's "Kenmatta's dojo opens", 2026-10-15): seven
   pieces never sold, each earned with a belt or a number of stars in his dojo (js/data/dojo.js's DOJO_REWARDS,
   js/data/furniture.js's `dojo` source). One colour each, his: dark wood, red leather, gold. His poster and the
   Dragonite medallion are painted from their pictures, loaded once before the catalogue is built (this module's
   top-level await, as js/base-furniture-gym.js's posters are); a picture that fails leaves the piece without it. */

import { R, P, disc, oval, ovalShade, cyl, panel, wood, floorShadow, ctx, sh } from './base-paint.js';

const PICS = {};
async function load(id, src) {
  const res = await fetch(new URL(`../${src}`, import.meta.url));
  if (!res.ok) return;
  PICS[id] = await createImageBitmap(await res.blob());
}
if (typeof createImageBitmap === 'function' && typeof OffscreenCanvas === 'function') {
  await Promise.all([load('ken', 'assets/trainers/alder.png'), load('medal', 'assets/arena/ken-medallion.jpg')].map(p => p.catch(() => {})));
}

const OAK = '#6a4224', RED = '#c8382a', GOLD = '#e0b04a', INK = '#2a1a10';

const words = (text, x, y, size, col, w) => {
  const g = ctx();
  g.font = `bold ${size}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = col; g.fillText(text, x, y, w);
};

export const DOJO_KINDS = [
  // his signed poster: him under a sunburst, FORTIFY YOUR MIND on a red band, his scrawl across the corner
  { id: 'kenposter', name: 'Kenmatta\'s poster', group: 'Dojo', solo: true, w: 1, h: 1, layer: 'wall', price: 300, wall(x) {
    const g = ctx(), X = x + 3, Y = 10, W = 26, H = 54;
    R(X + 1, Y + 1, W, H, 'rgba(0,0,0,0.2)');
    panel(X, Y, W, H, '#f8f4ec');
    g.save();
    g.beginPath(); g.rect(X + 2, Y + 2, W - 4, H - 15); g.clip();
    const bg = g.createLinearGradient(0, Y, 0, Y + H - 13);
    bg.addColorStop(0, '#ffd858'); bg.addColorStop(1, '#e85030');
    g.fillStyle = bg; g.fillRect(X + 2, Y + 2, W - 4, H - 15);
    const cx = X + W / 2, cy = Y + 22;
    g.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 50, a, a + Math.PI / 12); g.closePath(); g.fill(); }
    const pic = PICS.ken;
    if (pic) {
      const s = Math.min((W - 4) / pic.width, (H - 17) / pic.height), w = pic.width * s, h = pic.height * s;
      g.imageSmoothingEnabled = false;
      g.drawImage(pic, cx - w / 2, Y + H - 13 - h, w, h);
    }
    g.restore();
    R(X + 2, Y + H - 13, W - 4, 8, RED); R(X + 2, Y + H - 13, W - 4, 1, '#f07858');
    words('FORTIFY YOUR MIND', cx, Y + H - 8.8, 3.2, '#ffe070', W - 6);
    g.strokeStyle = '#8a1a10'; g.lineWidth = 0.7;
    g.beginPath();
    for (let i = 0; i <= 14; i++) { const t = i / 14, px = X + W - 15 + t * 11, py = Y + H - 2.6 - Math.sin(t * Math.PI * 3) * 1.2 - t * 1.4; i ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.stroke();
    for (const px of [X + 3, X + W - 3]) { disc(px, Y + 3, 1.4, '#d84848'); disc(px - 0.4, Y + 2.6, 0.5, '#ffb0a8'); }
  } },
  // the dojo's mat: tatami in a black cloth border round a red sun
  { id: 'dojomat', name: 'Dojo mat', group: 'Dojo', solo: true, w: 2, h: 2, layer: 'rug', price: 300, high: 0.04, side: 'c', flat(w, h) {
    R(0, 0, w, h, '#2c2a26');
    const T = '#d4ca84';
    R(3, 3, w - 6, h - 6, T);
    for (let j = 3; j < h - 3; j++) for (let i = 3; i < w - 3; i++) if ((i + j * 3) % 7 === 0) P(i, j, sh(T, -1)); else if ((i * 5 + j) % 13 === 0) P(i, j, sh(T, 1));
    R(w / 2 - 0.5, 3, 1, h - 6, sh(T, -2));
    disc(w / 2, h / 2, 12, sh(RED, -1)); disc(w / 2, h / 2, 11, RED); disc(w / 2 - 3, h / 2 - 3, 3, sh(RED, 1));
    for (const [cx, cy] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) R(cx, cy, 1, 1, GOLD);
  } },
  // a wing chun wooden dummy: a post on its frame, three arms and a leg
  { id: 'wingchun', name: 'Wooden dummy', group: 'Dojo', solo: true, w: 1, h: 1, price: 380, draw(x, b) {
    floorShadow(x + 2, b, 28);
    wood(x + 3, b - 8, 26, 4, OAK); cyl(x + 4, b - 30, 3, 26, sh(OAK, -1)); cyl(x + 25, b - 30, 3, 26, sh(OAK, -1)); wood(x + 3, b - 32, 26, 3, OAK);
    cyl(x + 11, b - 74, 10, 66, '#9a6a3a'); oval(x + 16, b - 74, 5, 2, sh('#9a6a3a', 1));
    for (const j of [-66, -50, -30]) R(x + 11, b + j, 10, 1, sh('#9a6a3a', -2));
    R(x + 2, b - 60, 10, 3, '#b0804a'); R(x + 20, b - 60, 10, 3, '#b0804a'); R(x + 1, b - 61, 2, 5, sh('#b0804a', -1)); R(x + 29, b - 61, 2, 5, sh('#b0804a', -1));
    R(x + 14, b - 46, 4, 10, '#b0804a'); R(x + 12, b - 37, 8, 3, sh('#b0804a', -1));
    R(x + 18, b - 26, 9, 3, '#b0804a'); R(x + 26, b - 26, 3, 12, '#b0804a');
  } },
  // the Dragonite medallion from his alcove, in gold on the wall
  { id: 'dragonitemedal', name: 'Dragonite medallion', group: 'Dojo', solo: true, w: 1, h: 1, layer: 'wall', price: 600, wall(x) {
    const g = ctx(), cx = x + 16, cy = 34;
    disc(cx + 1, cy + 1, 15, 'rgba(0,0,0,0.25)');
    disc(cx, cy, 15, '#8a5a18'); disc(cx, cy, 14, GOLD); disc(cx, cy, 12, '#a86a18');
    const pic = PICS.medal;
    if (pic) {
      g.save(); g.beginPath(); g.arc(cx, cy, 11.5, 0, Math.PI * 2); g.clip();
      g.drawImage(pic, cx - 11.5, cy - 11.5, 23, 23);
      g.restore();
    } else { disc(cx, cy, 11, '#f0a040'); oval(cx, cy + 2, 6, 7, '#f8c870'); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; P(cx + Math.cos(a) * 13 - 0.5, cy + Math.sin(a) * 13 - 0.5, '#fff0b0'); }
    R(cx - 0.5, 14, 1, 6, INK); disc(cx, 14, 1.5, '#9a9aa8');
  } },
  // his own sandbag: red leather on a chain from an A-frame, banded black, FYM stitched on it
  { id: 'kensandbag', name: 'Kenmatta\'s sandbag', group: 'Dojo', solo: true, w: 1, h: 1, price: 420, draw(x, b) {
    floorShadow(x, b, 32);
    for (let j = 0; j < 84; j++) { R(x + 1 + Math.floor(j / 28), b - 84 + j, 3, 1, OAK); R(x + 28 - Math.floor(j / 28), b - 84 + j, 3, 1, OAK); }
    wood(x, b - 88, 32, 5, sh(OAK, 1));
    R(x + 15, b - 83, 2, 10, '#9a9aa8');
    cyl(x + 8, b - 73, 16, 48, RED); oval(x + 16, b - 73, 8, 2, sh(RED, 1)); oval(x + 16, b - 25, 8, 2, sh(RED, -1));
    for (const j of [-66, -32]) R(x + 8, b + j, 16, 3, '#2a2a30');
    words('FYM', x + 16, b - 49, 6, '#ffe070', 14);
  } },
  // the dojo's gong: a red frame, the gold gong hung in it, the striker leaning
  { id: 'dojogong', name: 'Dojo gong', group: 'Dojo', solo: true, w: 1, h: 1, price: 520, draw(x, b) {
    floorShadow(x, b, 32);
    cyl(x + 1, b - 74, 4, 74, RED); cyl(x + 27, b - 74, 4, 74, RED); wood(x, b - 78, 32, 6, sh(RED, -1));
    R(x + 10, b - 72, 1, 8, INK); R(x + 21, b - 72, 1, 8, INK);
    disc(x + 16, b - 48, 14, sh(GOLD, -2)); disc(x + 16, b - 48, 13, GOLD); disc(x + 16, b - 48, 9, sh(GOLD, -1)); disc(x + 16, b - 48, 8, GOLD);
    words('力', x + 16, b - 48, 9, '#8a5a18');
    disc(x + 12, b - 54, 2.5, sh(GOLD, 2));
    R(x + 4, b - 10, 2, 10, OAK); disc(x + 5, b - 12, 3, '#f4f0e0');
  } },
  // the black belt trophy: a gold cup on a dark plinth, a black belt tied round its stem
  { id: 'blackbelttrophy', name: 'Black belt trophy', group: 'Dojo', solo: true, w: 1, h: 1, price: 800, draw(x, b) {
    floorShadow(x + 4, b, 24);
    wood(x + 6, b - 12, 20, 12, '#2a1a10'); R(x + 9, b - 8, 14, 3, GOLD); R(x + 10, b - 7, 12, 1, sh(GOLD, -2));
    cyl(x + 14, b - 22, 4, 10, GOLD); ovalShade(x + 16, b - 23, 6, 2, GOLD);
    for (let j = 0; j < 20; j++) { const half = 11 - Math.floor(j * j / 40); R(x + 16 - half, b - 44 + j, half * 2, 1, GOLD); P(x + 16 - half, b - 44 + j, sh(GOLD, -1)); R(x + 16 - half + 3, b - 44 + j, 2, 1, sh(GOLD, 2)); }
    oval(x + 16, b - 44, 11, 2, sh(GOLD, -2));
    for (const s of [-1, 1]) for (let a = 0; a < 10; a++) P(x + 16 + s * (11 + Math.round(Math.sin(a / 3) * 4)), b - 42 + a, sh(GOLD, -1));
    R(x + 9, b - 20, 14, 3, '#22222a'); R(x + 14, b - 21, 4, 5, '#0c0c10');
    R(x + 13, b - 17, 2, 7, '#22222a'); R(x + 17, b - 17, 2, 6, '#22222a');
  } },
];
